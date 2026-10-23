/* Trainio – Smoke-Test: prüft die Dateien und klickt die wichtigsten Wege der App im Browser durch
   (Handy- und Desktop-Größe). Läuft komplett lokal: Firebase und CDNs sind gesperrt, die App läuft im lokalen Modus.
   Aufruf: npm test   (einmalig vorher: npm install && npx playwright install chromium)
   Bei einem Fehler landet ein Screenshot in tests/screenshots/. */
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failed = 0;
function check(cond, msg, detail) {
  if (cond) console.log('  ✓ ' + msg);
  else { failed++; console.log('  ✗ ' + msg + (detail ? `\n      ${detail}` : '')); }
  return !!cond;
}

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
  const icons = (read('js/core.js').match(/const APP_ICONS = \[([^\]]*)\]/) || [])[1] || '';
  const n = (icons.match(/'\d+'/g) || []).length;
  const dirs = fs.readdirSync(path.join(ROOT, 'icons')).filter(d => /^\d+$/.test(d));
  const files = ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.json'];
  check(dirs.length === n && dirs.every(d => files.every(f => fs.existsSync(path.join(ROOT, 'icons', d, f)))), `App-Icons: ${n} in core.js, ${dirs.length} Ordner, alle Dateien vorhanden`);
  check(read('sw.js').includes(`length: ${n} }`), 'App-Icons: Anzahl in sw.js passt');
  check(index.includes(`/^[2-${n}]$/`), 'App-Icons: erlaubte Nummern in index.html passen');
}

/* ---------- 2. Kleiner Webserver für das Repo ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* ---------- 3. Browser ---------- */
async function openApp(browser, base, viewport) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block', locale: 'de-DE' });
  // nur die eigene Seite – Firebase, Chart.js, Schriften usw. bleiben draußen
  await ctx.route(url => !url.href.startsWith(base), r => r.abort());
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  return page;
}
const pause = (page, ms = 250) => page.waitForTimeout(ms);
const noViewError = page => page.evaluate(() => !document.querySelector('.tab.active').innerText.includes('Fehler beim Anzeigen'));
const appErrors = page => page.evaluate(() => ErrLog.all().map(e => e.msg || e.message || String(e)));

async function mobileFlow(page) {
  console.log('Handy (390 × 844)');
  check(!page.errors.length, 'App startet ohne Fehler', page.errors.join(' | '));
  check(await page.evaluate(() => Store.all('exercises').length > 300), 'Übungs-Bibliothek ist geladen');

  // Testdaten: ein Workout „Push" und ein Plan, in dem heute Push dran ist
  await page.evaluate(() => {
    const id = 'tpl_test';
    Store.put('templates', id, { name: 'Push', exercises: [
      { exerciseId: 'ex_bankdruecken', sets: 3, reps: '8', restSec: 90, notes: '' },
      { exerciseId: 'ex_seitheben', sets: 2, reps: '12-15', restSec: 60, notes: '' }], createdAt: Date.now() });
    const schedule = Array(7).fill(id);
    Store.put('plans', 'plan_test', { name: 'Test-Plan', schedule, isCustom: true, createdAt: Date.now() });
    Store.saveSettings({ activePlanId: 'plan_test' });
  });
  await pause(page);

  for (const tab of ['start', 'training', 'exercises', 'progress', 'more']) {
    await page.click(`#bottomNav [data-tab="${tab}"]`);
    await pause(page, 150);
    check(await page.evaluate(t => App.tab === t, tab) && await noViewError(page), `Tab „${tab}" öffnet sich`);
  }

  // Workout über „Workout starten" → heutiges Plan-Workout
  await page.click('#bottomNav [data-tab="start"]');
  await page.click('[data-act="startSheet"]');
  await page.click('.modal .am-featured');
  await pause(page, 400);
  check(await page.evaluate(() => { const w = Workout.cur(); return w && w.name === 'Push' && w.entries.length === 2; }), 'Workout „Push" startet mit 2 Übungen');

  const set = (si, f) => `#tab-training [data-in="${f}"][data-ei="0"][data-si="${si}"]`;
  await page.fill(set(0, 'setW'), '60');
  await page.fill(set(0, 'setB'), '8');
  await page.click(`#tab-training [data-act="setDone"][data-ei="0"][data-si="0"]`);
  await pause(page, 300);
  const s0 = await page.evaluate(() => ({ s: Workout.cur().entries[0].sets[0], rest: !!Workout.cur().rest, dock: document.querySelector('#restDock').innerHTML.length }));
  check(s0.s.done && s0.s.weightKg === 60 && s0.s.reps === 8, 'Satz 1 (60 kg × 8) abgehakt', JSON.stringify(s0.s));
  check(s0.rest && s0.dock > 0, 'Pausen-Timer startet nach dem Satz');
  await page.click('#restDock [data-act="restSkip"]');

  // Scheibenrechner über ⋯ an der Übung → zeigt Satz 2
  await page.click('#tab-training [data-act="exMenu"][data-ei="0"]');
  await page.click('.modal [data-k="plates"]');
  await pause(page);
  const pl = await page.evaluate(() => ({ ctx: (document.querySelector('.modal .pl-ctx') || {}).innerText || '', total: (document.querySelector('.modal #plT') || {}).value }));
  check(/Satz 2/.test(pl.ctx) && pl.total === '60', 'Scheibenrechner öffnet mit Satz 2 (60 kg)', JSON.stringify(pl));
  await page.keyboard.press('Escape');
  await pause(page);

  // Workout beenden → speichern, Zusammenfassung mit Score
  await page.click('[data-act="woFinish"] >> visible=true');
  await page.click('.modal [data-x="ok"]');
  await pause(page, 600);
  const saved = await page.evaluate(() => { const w = Store.all('workouts'); return { n: w.length, cur: !!Workout.cur(), sets: w[0] && w[0].entries[0].sets.filter(s => s.done).length, modal: !!document.querySelector('.modal'), score: w[0] && Analytics.score(w[0].id) }; });
  check(saved.n === 1 && !saved.cur && saved.sets === 1, 'Workout gespeichert (1 erledigter Satz)', JSON.stringify(saved));
  check(saved.modal && saved.score && saved.score.score >= 0, 'Zusammenfassung mit Score erscheint');
  await page.evaluate(() => Modal.closeAll());
  await pause(page);

  // Fortschritt: alle Bereiche
  await page.click('#bottomNav [data-tab="progress"]');
  const subs = await page.evaluate(() => [...document.querySelectorAll('#tab-progress [data-act="progSub"]')].map(b => b.dataset.v));
  for (const v of subs) {
    await page.click(`#tab-progress [data-act="progSub"][data-v="${v}"]`);
    await pause(page, 150);
    check(await noViewError(page), `Fortschritt → ${v}`);
  }

  // Training: Verlauf + Workout-Detail
  await page.click('#bottomNav [data-tab="training"]');
  await page.click('#tab-training [data-act="trainSub"][data-v="history"]');
  await pause(page);
  check(await noViewError(page), 'Training → Verlauf');
  await page.click('#tab-training [data-act="openWorkout"] >> nth=0');
  await pause(page);
  check(await page.evaluate(() => /Push/.test((document.querySelector('.modal') || {}).innerText || '')), 'Workout-Detail öffnet sich');
  await page.evaluate(() => Modal.closeAll());

  // Übungen: Suche + Detail
  await page.click('#bottomNav [data-tab="exercises"]');
  await page.fill('#exQ', 'bankdrücken');
  await pause(page, 400);
  check(await page.evaluate(() => [...document.querySelectorAll('#tab-exercises [data-act="openExercise"]')].some(x => /Bankdrücken/.test(x.innerText))), 'Übungssuche findet „Bankdrücken"');
  await page.click('#tab-exercises [data-act="openExercise"] >> nth=0');
  await pause(page);
  check(await page.evaluate(() => !!document.querySelector('.modal')), 'Übungs-Detail öffnet sich');
  await page.evaluate(() => Modal.closeAll());

  // Mehr: jede Gruppe + Suche
  await page.click('#bottomNav [data-tab="more"]');
  const groups = await page.evaluate(() => moreGroups().map(g => g.id));
  for (const g of groups) {
    await page.evaluate(id => openMoreSub(id), g);
    await pause(page, 120);
    check(await noViewError(page), `Mehr → ${g}`);
  }
  await page.click('#bottomNav [data-tab="start"]');   // Tab wechseln schließt die Gruppe
  await page.click('#bottomNav [data-tab="more"]');
  await pause(page);
  await page.fill('#moreQ', 'timer');
  await pause(page, 400);
  check(await page.evaluate(() => /Pausen-Timer/.test(document.querySelector('#moreRes').innerText)), 'Einstellungs-Suche findet „Pausen-Timer"');

  // Neu laden: Daten bleiben, laufendes Workout wird wiederhergestellt
  await page.evaluate(() => Workout.start({ name: 'Reload-Test' }));
  await pause(page, 500);   // lokales Speichern ist kurz verzögert
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined', null, { timeout: 10000 });
  await pause(page, 600);
  const after = await page.evaluate(() => ({ n: Store.all('workouts').length, cur: Workout.cur() && Workout.cur().name }));
  check(after.n === 1 && after.cur === 'Reload-Test', 'nach Neuladen: Daten da, Workout wiederhergestellt', JSON.stringify(after));

  check(!page.errors.length, 'keine JavaScript-Fehler im Ablauf', page.errors.join(' | '));
  const logged = await appErrors(page);
  check(!logged.length, 'Fehlerprotokoll der App ist leer', logged.join(' | '));
}

async function desktopFlow(page) {
  console.log('Desktop (1280 × 800)');
  check(!page.errors.length, 'App startet ohne Fehler', page.errors.join(' | '));
  for (const tab of ['start', 'training', 'exercises', 'progress', 'more']) {
    await page.click(`#sidebar [data-tab="${tab}"]`);
    await pause(page, 150);
    check(await page.evaluate(t => App.tab === t, tab) && await noViewError(page), `Tab „${tab}" (Seitenleiste)`);
  }
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

(async () => {
  staticChecks();
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const [flow, viewport, name] of [[mobileFlow, { width: 390, height: 844 }, 'handy'], [desktopFlow, { width: 1280, height: 800 }, 'desktop']]) {
    let page = null;
    try {
      page = await openApp(browser, base, viewport);
      await flow(page);
    } catch (e) {
      const js = page && page.errors.length ? ` · JS-Fehler: ${page.errors.join(' | ')}` : '';
      check(false, `Ablauf „${name}" abgebrochen`, e.message.split('\n')[0] + js);
    }
    if (failed && page) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png') }).catch(() => {}); }
    if (page) await page.context().close();
  }
  await browser.close();
  srv.close();
  console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlles in Ordnung');
  process.exit(failed ? 1 : 0);
})();
