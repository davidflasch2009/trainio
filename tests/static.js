'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { check, read, ROOT } = require('./lib/harness');

/* ---------- 1. Dateien: Syntax, Versionen, App-Icons ---------- */
function staticChecks() {
  console.log('Dateien');
  const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
  for (const f of [...jsFiles.map(x => 'js/' + x), 'sw.js']) {
    let err = '';
    try { execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); }
    catch (e) { err = String(e.stderr || e.message).split('\n').slice(0, 4).join(' | '); }
    check(!err, `${f} ohne Syntaxfehler`, err);
  }
  const index = read('index.html');
  const loaded = [...index.matchAll(/<script src="js\/([^"?]+)\?v=[^"]+"><\/script>/g)].map(m => m[1]);
  check(jsFiles.every(f => loaded.includes(f)), 'jede js/*.js wird in index.html geladen', jsFiles.filter(f => !loaded.includes(f)).join(', '));
  check(loaded.every(f => jsFiles.includes(f)), 'jede Datei aus index.html existiert', loaded.filter(f => !jsFiles.includes(f)).join(', '));
  const version = (read('js/core.js').match(/version: '([^']+)'/) || [])[1];
  const vs = [...index.matchAll(/(?:src|href)="(?:css|js)\/[^"?]+\?v=([^"]+)"/g)].map(m => m[1]);
  check(version && vs.length && vs.every(v => v === version), `?v= in index.html passt zur App-Version (${version})`, [...new Set(vs)].join(', '));
  check(/const CACHE = 'gymlog-v\d+';/.test(read('sw.js')), 'sw.js hat einen Cache-Namen');
  const sw = read('sw.js');
  check(sw.includes("if (!TESTVERSION && url.href.startsWith(TEST_PATH)) return;") && !/caches\.open\(CACHE\)/.test(sw) && sw.includes('k.startsWith(PREFIX) && k !== CACHE_NAME'),
    'sw.js: Testversion hat eigene Caches, die echte App lässt /test/ aus');
  check(!/'gymlog\.(?!')/.test(read('js/ui.js') + read('js/store.js') + read('js/more.js')) && /localStorage\.getItem\(P \+ 'look'\)/.test(index),
    'Speicher-Schlüssel kommen aus LS bzw. P (Testversion getrennt)');
  const icons = (read('js/core.js').match(/const APP_ICONS = \[([^\]]*)\]/) || [])[1] || '';
  const n = (icons.match(/'\d+'/g) || []).length;
  const dirs = fs.readdirSync(path.join(ROOT, 'icons')).filter(d => /^\d+$/.test(d));
  const files = ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.json'];
  check(dirs.length === n && dirs.every(d => files.every(f => fs.existsSync(path.join(ROOT, 'icons', d, f)))), `App-Icons: ${n} in core.js, ${dirs.length} Ordner, alle Dateien vorhanden`);
  check(read('sw.js').includes(`length: ${n} }`), 'App-Icons: Anzahl in sw.js passt');
  check(index.includes(`/^[2-${n}]$/`), 'App-Icons: erlaubte Nummern in index.html passen');
  // In Chromium nicht nachstellbar, darum nur statisch: ohne diese Regel endet die Tab-Leiste auf iOS 26 zu hoch
  check(/@media \(display-mode: standalone\) \{\s*html \{ min-height: min\(100lvh, calc\(100% \+ env\(safe-area-inset-top\)\)\); \}/.test(read('css/app.css')),
    'iOS-26-Fix: Seite als installierte App mindestens bildschirmhoch');
}

/* ---------- Prüfbericht 1.33.8: jeder der 18 Befunde (T01–T18) bleibt behoben ---------- */
/** Kontrast (WCAG): Textfarben jedes Designzustands gegen Seite, Karte und zweite Fläche */
function contrastChecks() {
  console.log('Kontrast der Designs');
  const css = read('css/app.css');
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const parse = v => { v = v.trim(); if (v.startsWith('#')) return { c: hex(v), a: 1 }; const m = v.match(/^rgba?\(([^)]+)\)$/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { c: p.slice(0, 3), a: p[3] == null ? 1 : p[3] }; };
  const over = (t, u) => t.c.map((v, i) => v * t.a + u[i] * (1 - t.a));
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const low = [];
  let n = 0;
  for (const [, design, state, body] of css.matchAll(/\[data-design="(\w+)"\]\[data-(?:theme|phase)="(\w+)"\]\s*\{([^}]*)\}/g)) {
    const v = {};
    for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) v[m[1]] = m[2].trim();
    if (!v['--bg'] || !v['--text-faint']) continue;
    n++;
    const bg = parse(v['--bg']).c, sf = over(parse(v['--surface']), bg), s2p = parse(v['--surface-2']), s2 = s2p.a < 1 ? over(s2p, sf) : s2p.c;
    for (const k of ['--text-dim', '--text-faint', '--accent-text']) {
      const r = Math.min(...[bg, sf, s2].map(g => ratio(parse(v[k]).c, g)));
      if (r < 4.5) low.push(`${design}·${state} ${k} ${r.toFixed(2)}`);
    }
    const ink = ratio(parse(v['--accent']).c, parse(v['--accent-ink']).c);
    if (ink < 4.5) low.push(`${design}·${state} Button-Schrift ${ink.toFixed(2)}`);
  }
  check(n === 14 && !low.length, `T09: Text und Haupt-Buttons in allen ${n} Designzuständen mindestens 4,5:1`, low.slice(0, 6).join(', '));
  const sw = read('sw.js');
  check(/url\.hostname !== 'fonts\.googleapis\.com'/.test(sw) && sw.includes('if (bypass(url)) return;'), 'T17: Schrift-Stylesheets von Google Fonts landen im Offline-Cache');
  const boot = read('js/boot.js');
  check(/if \(!hadController && !wantReload\) \{ hadController = true; return; \}/.test(boot) && /wantReload = true;/.test(boot), 'T11: „Neu laden" lädt auch beim ersten App-Start die neue Version');
  const store = read('js/store.js');
  check(/'imports', 'heart'\]/.test(store) && /all\('heart'\)\.length > 0/.test(store), 'T02: Ruhepuls zählt als Gastdaten und wird ins Konto übernommen');
}


module.exports = { staticChecks, contrastChecks };
