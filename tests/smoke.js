/* Trainio – Smoke-Test: prüft die Dateien und klickt die wichtigsten Wege der App im Browser durch
   (Handy- und Desktop-Größe). Läuft komplett lokal: Firebase und CDNs sind gesperrt, die App läuft im lokalen Modus –
   nur Chart.js kommt aus node_modules, damit auch die Diagramme wirklich gezeichnet werden.
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

/* ---------- 2. Kleiner Webserver für das Repo ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.startsWith('/test/')) p = p.slice(5);   // Testversion: dieselben Dateien unter /test/ (wie auf GitHub Pages)
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
async function openApp(browser, base, viewport, touch = false, userAgent = undefined) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block', locale: 'de-DE', hasTouch: touch, acceptDownloads: true, userAgent });
  // nur die eigene Seite – Firebase, Schriften usw. bleiben draußen; Chart.js (CDN) kommt aus node_modules
  const chartJs = path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js');
  await ctx.route(url => !url.href.startsWith(base), r => /\/chart\.js@/.test(r.request().url()) && fs.existsSync(chartJs)
    ? r.fulfill({ path: chartJs, contentType: 'text/javascript' }) : r.abort());
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
/** Wischgeste mit dem Finger (Touch über CDP) */
async function swipe(page, x1, x2, y) {
  const cdp = page.cdp || (page.cdp = await page.context().newCDPSession(page));
  const tp = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await tp('touchStart', x1);
  for (let k = 1; k <= 10; k++) { await tp('touchMove', x1 + (x2 - x1) * k / 10); await page.waitForTimeout(16); }
  await tp('touchEnd');
  await page.waitForTimeout(600);
}

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
    const vt = await page.evaluate(() => document.documentElement.dataset.vt || '');
    await pause(page, 150);
    check(await page.evaluate(t => App.tab === t, tab) && await noViewError(page) && !vt, `Tab „${tab}" öffnet sich (sofort, ohne Überblenden)`, vt);
  }

  // Workout über „Workout starten" → heutiges Plan-Workout
  await page.click('#bottomNav [data-tab="start"]');
  await page.click('[data-act="startSheet"]');
  await pause(page, 100);
  check(await page.evaluate(() => getComputedStyle(document.querySelector('#app')).transform === 'none' && !!document.querySelector('.modal-wrap')),
    'Menü von unten: Seite dahinter bleibt gleich groß (in Safari sonst unscharf)');
  await page.click('.modal .am-featured');
  await pause(page, 400);
  check(await page.evaluate(() => { const w = Workout.cur(); return w && w.name === 'Push' && w.entries.length === 2; }), 'Workout „Push" startet mit 2 Übungen');

  const set = (si, f) => `#tab-training [data-in="${f}"][data-ei="0"][data-si="${si}"]`;
  await page.fill(set(0, 'setW'), '60');
  await page.fill(set(0, 'setB'), '8');
  await page.click(`#tab-training [data-act="setDone"][data-ei="0"][data-si="0"]`);
  const live = await page.evaluate(() => {
    const path = document.querySelector('.set-row[data-ei="0"][data-si="0"] .set-check svg path');
    const rolls = [...document.querySelectorAll('#tab-training .roll')];
    const box = document.querySelector('#restBox');
    const r = { draw: getComputedStyle(path).animationName, rolls: rolls.map(r => r.textContent + (r.classList.contains('fx-roll-up') ? '↑' : '')).join(' '), dockIn: !!box && box.classList.contains('fx-rest-in') };
    App.renderCurrent();
    return { ...r, dockKept: !!box && box === document.querySelector('#restBox') && box.isConnected };
  });
  check(live.draw === 'drawCheck' && live.rolls === '1↑ 1↑', 'Satz abhaken: Häkchen zeichnet sich, Zähler rollen weiter', JSON.stringify(live));
  check(live.dockIn && live.dockKept, 'Pausen-Leiste gleitet herein und bleibt beim Neu-Zeichnen stehen', JSON.stringify(live));
  await pause(page, 300);
  const s0 = await page.evaluate(() => ({ s: Workout.cur().entries[0].sets[0], rest: !!Workout.cur().rest, dock: document.querySelector('#restDock').innerHTML.length }));
  check(s0.s.done && s0.s.weightKg === 60 && s0.s.reps === 8, 'Satz 1 (60 kg × 8) abgehakt', JSON.stringify(s0.s));
  check(s0.rest && s0.dock > 0, 'Pausen-Timer startet nach dem Satz');
  await page.click('#restDock [data-act="restSkip"]');
  const leave = await page.evaluate(() => ({ gone: !document.querySelector('#restBox'), leaving: !!document.querySelector('#restDock .rest-dock.leaving') }));
  await pause(page, 400);
  check(leave.gone && leave.leaving && !await page.evaluate(() => document.querySelector('#restDock').children.length), 'Pause beenden: Leiste gleitet nach unten weg', JSON.stringify(leave));

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
  check(await page.evaluate(() => !!document.querySelector('.modal.alert')), 'Rückfrage erscheint als Alert');
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

  // Seitwärts wischen wechselt den Bereich
  await page.click(`#tab-progress [data-act="progSub"][data-v="overview"]`);
  await pause(page, 300);
  // Fortschritt-Leiste haftet genau dort, wo sie steht – sie rutscht beim Losscrollen nicht erst ein Stück mit
  const stick = await page.evaluate(() => [0, 6, 12, 40].map(y => { Scroll.el.scrollTop = y; return Math.round(document.querySelector('.prog-controls').getBoundingClientRect().top); }));
  await page.evaluate(() => Scroll.to(0));
  check(stick.every(t => t === stick[0]), 'Fortschritt-Leiste bleibt beim Losscrollen ruhig stehen', stick.join(', '));
  // Am Seitenende federt die Spalte (Gummiband) – auch kurze Seiten können minimal scrollen
  check(await page.evaluate(() => getComputedStyle(Scroll.el).overscrollBehaviorY === 'contain'), 'Inhalt federt am Seitenende nach (overscroll: contain)');
  // Scrollen: Dokument bleibt stehen, nur die Inhaltsspalte scrollt – Tab-Leiste unten, Fortschritt-Leiste oben
  await page.mouse.move(200, 500);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(30); }
  await pause(page, 300);
  const fixed = await page.evaluate(() => ({ doc: scrollY, col: Scroll.y, nav: Math.round(document.querySelector('#bottomNav').getBoundingClientRect().bottom), vh: innerHeight, prog: Math.round(document.querySelector('.prog-controls').getBoundingClientRect().top) }));
  check(fixed.doc === 0 && fixed.col > 0 && Math.abs(fixed.nav - fixed.vh) < 2 && fixed.prog >= 0 && fixed.prog < 40, 'Scrollen: Tab-Leiste bleibt unten, Fortschritt-Leiste haftet oben', JSON.stringify(fixed));
  await page.evaluate(() => Scroll.to(0));
  await pause(page, 200);
  await swipe(page, 320, 70, 620);
  check(await page.evaluate(() => UI.progSub === 'strength'), 'Fortschritt: nach links wischen → nächster Bereich (Kraft)');

  // Training: Verlauf + Workout-Detail
  await page.click('#bottomNav [data-tab="training"]');
  await page.click('#tab-training [data-act="trainSub"][data-v="history"]');
  await pause(page);
  check(await noViewError(page), 'Training → Verlauf');
  await page.click('#tab-training [data-act="openWorkout"] >> nth=0');
  check(await page.evaluate(() => !document.documentElement.dataset.vt), 'Workout-Detail kommt normal von unten (kein Übergang aus der Karte)');
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
  // Zurück-Wischen vom linken Rand (sonst nur in der iPhone-App aktiv)
  await page.evaluate(() => { Motion.edgeAlways = true; openMoreSub('training'); });
  await pause(page, 600);
  await swipe(page, 6, 320, 420);
  check(await page.evaluate(() => !moreSub && !document.querySelector('.edge-ghost, .edge-shade') && !(history.state && history.state.moreSub)), 'Mehr: vom linken Rand wischen → zurück zur Übersicht');
  await page.evaluate(() => openMoreSub('training'));
  await pause(page, 600);
  await swipe(page, 6, 60, 420);
  check(await page.evaluate(() => moreSub === 'training' && !document.querySelector('.edge-ghost, .edge-shade')), 'Mehr: kurz wischen und loslassen → bleibt auf der Unterseite');
  await page.evaluate(() => closeMoreSub());
  await pause(page, 600);
  // Antippen fühlbar: gehalten → gibt nach; sofort losscrollen → keine Reaktion
  const cdpP = page.cdp || (page.cdp = await page.context().newCDPSession(page));
  const row = await page.evaluate(() => { const r = document.querySelector('#tab-more button.list-item').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const tch = (type, y) => cdpP.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: row.x, y }] });
  await tch('touchStart', row.y); await pause(page, 200);
  const held = await page.evaluate(() => !!document.querySelector('#tab-more .pressed'));
  await tch('touchMove', row.y - 40); await tch('touchEnd'); await pause(page, 500);
  await tch('touchStart', row.y); await pause(page, 20); for (let k = 1; k <= 6; k++) { await tch('touchMove', row.y - k * 15); await pause(page, 16); }
  const scrolling = await page.evaluate(() => document.querySelectorAll('.pressed').length);
  await tch('touchEnd'); await pause(page, 300);
  check(held && !scrolling && !(await page.evaluate(() => document.querySelectorAll('.pressed').length)), 'Antippen: gibt beim Halten nach, beim Losscrollen nicht', JSON.stringify({ held, scrolling }));
  // Unterseite gleitet sofort herein (CSS-Animation, keine View Transition mit Foto der alten Seite)
  const push = await page.evaluate(() => { openMoreSub('workout'); return { cls: document.querySelector('#tab-more').classList.contains('fx-pg-fwd'), vtName: getComputedStyle(document.querySelector('#bottomNav')).viewTransitionName || 'none' }; });
  check(push.cls && push.vtName === 'none', 'Unterseite gleitet sofort herein, Tab-Leiste ohne Übergangs-Namen', JSON.stringify(push));
  await page.evaluate(() => closeMoreSub());
  await pause(page, 500);
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

  // Workout bearbeiten mit langen Übungsnamen: nichts ragt seitlich heraus (sonst wischt das Fenster zur Seite)
  const wide = await page.evaluate(async () => {
    const ids = ['ex_brustgestuetztes_rudern', 'ex_trizeps_sz', 'ex_schraeg_brustpresse'].filter(id => Ex.get(id));
    Store.put('templates', 'tlong', { name: 'Pull', exercises: ids.map(id => ({ exerciseId: id, sets: 2, reps: '4-8', restSec: 180, notes: '', uni: true })), createdAt: Date.now() });
    openTemplateEditor(Store.raw('templates', 'tlong'));
    await new Promise(r => setTimeout(r, 500));
    const b = document.querySelector('.modal .modal-body');
    const r = { n: ids.length, sw: b.scrollWidth, cw: b.clientWidth, ox: getComputedStyle(b).overflowX };
    Modal.closeAll();
    return r;
  });
  check(wide.n === 3 && wide.sw <= wide.cw && wide.ox === 'hidden', 'Workout bearbeiten: lange Namen passen, Fenster lässt sich nicht seitlich wischen', JSON.stringify(wide));

  check(!page.errors.length, 'keine JavaScript-Fehler im Ablauf', page.errors.join(' | '));
  const logged = await appErrors(page);
  check(!logged.length, 'Fehlerprotokoll der App ist leer', logged.join(' | '));
}

/* Datenwege mit echten Eingaben: Backup → alles löschen → wiederherstellen, Arrow-Import + Rückgängig, Gewichts-CSV */
async function dataFlow(page) {
  console.log('Datenwege');
  const count = () => page.evaluate(() => ({ w: Store.all('workouts').length, t: Store.all('templates').length, pr: Store.all('prs').length, prog: Store.all('progress').length, ex: Store.all('exercises').length, imp: Store.all('imports').length }));
  await page.evaluate(async () => {
    const ops = [];
    for (let i = 1; i <= 6; i++) { const st = Date.now() - i * 86400000 * 3; ops.push({ type: 'put', coll: 'workouts', id: 'dw' + i, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 60 + i, done: true }] }] } }); }
    ops.push({ type: 'put', coll: 'templates', id: 'dt1', doc: { name: 'Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '8', restSec: 90 }] } });
    await Store.batch(ops); await PR.recalcAll();
    Store.saveSettings({ design: 'plakat' });
  });
  const before = await count();
  // Backup herunterladen
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => { Actions.backupJSON(); })]);
  const file = path.join(SHOTS, '..', '.backup-test.json');
  await dl.saveAs(file);
  const bk = JSON.parse(fs.readFileSync(file, 'utf8'));
  check(bk.app === 'Trainio' && bk.data.workouts.length === before.w, `Backup enthält alle ${before.w} Workouts`);
  // Alles löschen: zwei Rückfragen, die zweite mit „LÖSCHEN"
  await page.evaluate(() => { Actions.deleteAll(); });
  await pause(page, 400); await page.click('.modal [data-x="ok"]'); await pause(page, 450);
  await page.fill('#cfmInput', 'LÖSCHEN'); await page.click('.modal [data-x="ok"]'); await pause(page, 900);
  const del = await count();
  check(del.w === 0 && del.t === 0 && del.ex > 300, 'Alles gelöscht, Übungs-Bibliothek neu angelegt', JSON.stringify(del));
  // Wiederherstellen: Datei → „Komplett ersetzen" → bestätigen
  page.once('filechooser', fc => fc.setFiles(file));
  await page.evaluate(() => { Actions.restoreJSON(); });
  await pause(page, 600); await page.click('.modal [data-k="replace"]'); await pause(page, 500); await page.click('.modal [data-x="ok"]'); await pause(page, 1500);
  const after = await count();
  fs.rmSync(file, { force: true });
  check(after.w === before.w && after.t === before.t && after.pr === before.pr, 'Backup wiederhergestellt (Workouts, Vorlagen, PRs)', JSON.stringify({ before, after }));
  check(await page.evaluate(() => S().design === 'plakat'), 'Einstellungen aus dem Backup übernommen');
  // Arrow-Import mit dem Beispiel, danach rückgängig
  await page.evaluate(() => { Actions.openArrow(); }); await pause(page, 500);
  await page.click('.modal [data-x="example"]'); await pause(page, 200);
  await page.click('.modal [data-x="validate"]'); await pause(page, 600);
  const c0 = await count();
  await page.click('#impCommit'); await pause(page, 2500);
  const c1 = await count();
  check(c1.w > c0.w && c1.imp === c0.imp + 1, `Arrow-Import: ${c1.w - c0.w} Workouts importiert`, JSON.stringify({ c0, c1 }));
  await page.evaluate(() => Modal.closeAll()); await pause(page, 400);
  await page.evaluate(() => { Actions.undoImport(); }); await pause(page, 500); await page.click('.modal [data-x="ok"]'); await pause(page, 1500);
  check((await count()).w === c0.w, 'Arrow-Import rückgängig gemacht');
  // Gewicht als CSV (Semikolon, Dezimalkomma)
  const csvFile = path.join(SHOTS, '..', '.gewicht-test.csv');
  fs.writeFileSync(csvFile, '"Datum";"Gewicht (kg)"\n"2026-10-01";"81,4"\n"2026-10-02";"81,1"\n"2026-10-03";"80,9"\n');
  const g0 = (await count()).prog;
  await page.evaluate(() => { Actions.bwImport(); }); await pause(page, 500);
  await page.setInputFiles('#bwiFile', csvFile); await pause(page, 600);
  if (await page.evaluate(() => !document.querySelector('.modal [data-x="go"]').disabled)) { await page.click('.modal [data-x="go"]'); await pause(page, 900); }
  fs.rmSync(csvFile, { force: true });
  check((await count()).prog === g0 + 3, 'Gewichts-CSV: 3 Werte importiert');
  await page.evaluate(() => Modal.closeAll());

  // Design wechseln, während Diagramme gezeichnet sind (früher: „Canvas is already in use")
  console.log('Design-Wechsel mit Diagrammen');
  await page.evaluate(() => App.go('progress'));
  await pause(page, 600);
  // Alle Diagramme sind sofort gezeichnet – auch unterhalb des Bildschirms, ohne Hinscrollen (sonst unscharf auf dem iPhone)
  const cv = await page.evaluate(() => typeof Chart === 'undefined' ? null : [...document.querySelectorAll('#tab-progress canvas')].filter(c => c.style.display !== 'none')
    .map(c => ({ id: c.id, drawn: !!Chart.getChart(c), below: c.getBoundingClientRect().top > innerHeight, sharp: Math.abs(c.width - c.clientWidth * devicePixelRatio) < 2 })));
  check(cv && cv.length && cv.every(c => c.drawn) && cv.some(c => c.below), `Diagramme sofort gezeichnet, auch unterhalb (${cv ? cv.length : 0})`, cv ? JSON.stringify(cv.filter(c => !c.drawn)) : 'Chart.js fehlt – npm install ausführen');
  check(cv && cv.every(c => c.sharp), 'Diagramme mit voller Pixeldichte', cv ? JSON.stringify(cv.filter(c => !c.sharp)) : '');
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 600);
  const designs = await page.locator('#tab-more .design-tile').evaluateAll(tiles => tiles.map(t => t.dataset.v));
  check(designs.join(',') === 'gymlog,glass,pure,plakat,fokus,sky', 'Darstellung zeigt die sechs verfügbaren Designs', designs.join(','));
  check(await page.evaluate(() => ['paper', 'iron', 'carbon'].every(design => lookAttrs({ design })['data-design'] === 'gymlog')), 'Entfernte Designs fallen auf Trainio zurück');
  // Trainio-Standard: Nachtblau & Kreide, Gold für Rekorde, Kreidestreifen, Sportschrift für Zahlen
  const tr = await page.evaluate(() => {
    Store.saveSettings({ design: 'gymlog', theme: 'dark', accent: '' }); applyTheme();
    const box = document.createElement('div'); box.innerHTML = `<span class="badge accent">${icon('trophy')} PR</span><div class="card">x</div>`; document.querySelector('#tab-more').append(box);
    const cs = el => getComputedStyle(el), root = cs(document.documentElement);
    const out = {
      bg: root.getPropertyValue('--bg').trim(), accent: root.getPropertyValue('--accent').trim(),
      gold: cs(box.querySelector('.i-trophy')).color, stripes: /repeating-linear-gradient/.test(cs(document.body).backgroundImage),
      noBorder: cs(box.querySelector('.card')).borderTopColor === 'rgba(0, 0, 0, 0)', font: /Saira/.test(root.getPropertyValue('--font-num')),
      fontLink: !!document.querySelector('link[href*="Saira"]')
    };
    box.remove();
    return out;
  });
  check(tr.bg === '#0c111c' && tr.accent === '#ece6d3' && tr.gold === 'rgb(214, 178, 94)' && tr.stripes && tr.noBorder && tr.font && tr.fontLink,
    'Trainio-Design: Nachtblau & Kreide, Pokale in Gold, Kreidestreifen, Karten ohne Rahmen im Dunkeln, Sportschrift geladen', JSON.stringify(tr));
  for (const sel of ['[data-k="accent"][data-v="#0a84ff"]', '[data-k="design"][data-v="glass"]', '[data-k="theme"][data-v="light"]', '[data-k="design"][data-v="pure"]']) {
    await page.click(`#tab-more ${sel}`);
    await pause(page, 450);
  }
  await pause(page, 600);   // Überblendung zu Ende
  const look = await page.evaluate(() => ({ d: document.documentElement.dataset.design, t: document.documentElement.dataset.theme, swap: document.documentElement.classList.contains('look-swap'), active: !!document.querySelector('#tab-more .design-tile.active[data-v="pure"]') }));
  check(look.d === 'pure' && look.t === 'light' && !look.swap && look.active, 'Design, Farbe und Modus übernommen', JSON.stringify(look));
  // Plakat: eckig, Linien statt Karten, Rot nur als Akzent
  await page.click('#tab-more [data-k="accent"][data-v=""]').catch(() => page.evaluate(() => Store.saveSettings({ accent: '' })));
  await page.click('#tab-more [data-k="design"][data-v="plakat"]');
  await pause(page, 900);
  await page.evaluate(() => App.go('start'));
  await pause(page, 500);
  const pl = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement), st = document.querySelector('#tab-start .stat'), hero = document.querySelector('#tab-start .btn-hero');
    return { d: document.documentElement.dataset.design, rs: cs.getPropertyValue('--rs').trim(), accent: cs.getPropertyValue('--accent').trim(), statTop: st && getComputedStyle(st).borderTopWidth, statBg: st && getComputedStyle(st).backgroundColor, heroR: hero && getComputedStyle(hero).borderRadius }; });
  check(pl.d === 'plakat' && pl.rs === '0' && pl.accent === '#e2001a' && pl.statTop === '2px' && pl.statBg === 'rgba(0, 0, 0, 0)' && pl.heroR === '0px', 'Design „Plakat": eckig, Linien statt Karten, Signalrot', JSON.stringify(pl));
  // Plakat: umrahmte Einträge in „Workout starten" behalten Innenabstand (Icon klebt nicht am Rahmen)
  const amPad = await page.evaluate(async () => { Actions.startSheet(); await new Promise(r => setTimeout(r, 500));
    const e = document.querySelector('.modal .list-item.am-solo, .modal .list-item.am-featured'), v = e ? parseFloat(getComputedStyle(e).paddingLeft) : -1; Modal.closeAll(); return v; });
  check(amPad >= 10, 'Plakat: umrahmte Einträge mit Innenabstand', String(amPad));
  await pause(page, 400);
  // Eigene Einstellungen gelten auch im Plakat: „Rund" rundet Knöpfe, Chips und Schalter, eigene Farbe färbt Diagramme
  await page.evaluate(() => { setLook('radius', 'round'); setLook('accent', '#a3e635'); openMoreSub('look'); });
  await pause(page, 700);
  const plr = await page.evaluate(() => { const r = sel => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).borderTopLeftRadius) : -1; };
    return { btn: r('#tab-more .look-preview .btn'), chip: r('#tab-more .look-preview .chip'), seg: r('#tab-more .seg'), sw: r('#tab-more .switch span'), c1: cssVar('--c1') }; });
  check(plr.btn >= 15 && plr.chip >= 18 && plr.seg >= 15 && plr.sw >= 15 && plr.c1 === '#a3e635', 'Plakat: Ecken „Rund" und eigene Akzentfarbe wirken', JSON.stringify(plr));
  await page.evaluate(() => { setLook('radius', 'auto'); setLook('accent', ''); });
  // Startskript in index.html (Darstellung vor dem ersten Bild) kennt jedes Design – sonst springt es kurz auf „Trainio"
  const boot = await page.evaluate(async () => { const html = await (await fetch('index.html')).text(); const m = html.match(/!\/\^\(([a-z|]+)\)\$\//); return { ids: m ? m[1].split('|') : [], all: DESIGNS.map(d => d.id) }; });
  check(boot.all.every(id => boot.ids.includes(id)), 'Startskript kennt alle Designs', JSON.stringify(boot));
  // Aufgeräumt: keine Beschreibungen unter Designs, Erklärungen nur im (i) neben dem Titel
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 500);
  const tidy = await page.evaluate(() => ({ desc: document.querySelectorAll('#tab-more .dt-desc').length, subs: document.querySelectorAll('#tab-more .sl-sub').length,
    infos: document.querySelectorAll('#tab-more .sl-title .info-i').length, hint: [...document.querySelectorAll('#tab-more p')].filter(x => /Home-Bildschirm|Browser-Tab/.test(x.textContent)).length }));
  check(tidy.desc === 0 && tidy.subs === 0 && tidy.hint === 0 && tidy.infos >= 5, 'Darstellung ohne Erklärtexte, Erklärungen im (i)', JSON.stringify(tidy));
  // Tag & Nacht: Phase nach Sonnenstand statt Hell/Dunkel, Himmel sichtbar, vier Vorschau-Himmel, Tageszeit statt Modus
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 500);
  await page.click('#tab-more [data-k="design"][data-v="sky"]');
  await pause(page, 900);
  const sk = await page.evaluate(() => { const r = document.documentElement, b = getComputedStyle(document.body), ph = r.dataset.phase;
    return { d: r.dataset.design, ph, okTheme: r.dataset.theme === Sky.THEME[ph], sky: getComputedStyle(document.getElementById('sky')).display, top: b.getPropertyValue('--sk-top').trim(),
      previews: document.querySelectorAll('#tab-more .design-tile.active .tp').length, tageszeit: !!document.querySelector('#tab-more .sky-set'), modus: !!document.querySelector('#tab-more [data-k="theme"]'),
      cache: (JSON.parse(localStorage.getItem('gymlog.look')) || {}).sky }; });
  check(sk.d === 'sky' && ['dawn', 'day', 'dusk', 'night'].includes(sk.ph) && sk.okTheme && sk.sky === 'block' && /^#/.test(sk.top) && sk.previews === 4 && sk.tageszeit && !sk.modus && Array.isArray(sk.cache) && sk.cache.length === 4,
    'Design „Tag & Nacht": Phase nach Sonnenstand, Himmel, vier Vorschau-Himmel, Tageszeit statt Modus', JSON.stringify(sk));
  // Über 24 Stunden: Phasen in der richtigen Reihenfolge, Text auf dem Himmel immer lesbar (oben 7:1)
  const day = await page.evaluate(() => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); const seq = [], bad = [];
    for (let i = 0; i < 96; i++) { const t = d0.getTime() + i * 15 * 6e4, c = Sky.compute(t); if (seq[seq.length - 1] !== c.ph) seq.push(c.ph);
      const k = Color.contrast(Sky.INK[c.ph][0], c.sky.top); if (k < 7) bad.push(i + ':' + c.ph + ':' + k.toFixed(1)); }
    return { seq: seq.join(' '), bad, noon: Sky.state(d0.getTime() + 12 * 36e5).ph }; });
  check(day.seq === 'night dawn day dusk night' && !day.bad.length && day.noon === 'day', 'Tag & Nacht: Nacht → Dämmerung → Tag → Sonnenuntergang → Nacht, Himmel immer lesbar', JSON.stringify(day));
  // Phasenwechsel ohne Neustart: Uhr auf 12:00, dann 23:30 stellen → beim Zurückkehren in die App wechselt die Phase
  const flip = await page.evaluate(async () => { const real = Date.now, r = document.documentElement, out = [];
    try {
      for (const [h, m] of [[12, 0], [23, 30]]) { const d = new Date(); d.setHours(h, m, 0, 0); const t = d.getTime(); Date.now = () => t;
        document.dispatchEvent(new Event('visibilitychange')); await new Promise(res => setTimeout(res, 2200)); out.push(r.dataset.phase + '/' + r.dataset.theme); }
      return out.join(' ');
    } finally { Date.now = real; } });
  check(flip === 'day/light night/dark', 'Tag & Nacht: Phase wechselt von selbst (12:00 Tag/hell → 23:30 Nacht/dunkel)', flip);
  await page.evaluate(() => { switchLook(() => {}); });
  await pause(page, 300);
  // Fokus: schwarz-weiß ohne Effekte, Spotlight auf aktuelle Übung und nächsten Satz
  const fk = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    setLook('design', 'fokus'); App.go('start'); await sleep(500);
    const hero = document.querySelector('#tab-start .btn-hero'), effects = hero ? getComputedStyle(hero, '::after').backgroundImage + getComputedStyle(hero).boxShadow : '?';
    Workout.start({ name: 'Fokus-Test', entries: [Workout.makeEntry('ex_bankdruecken'), Workout.makeEntry('ex_kniebeuge')] });
    const w = Workout.cur(); w.entries[0].sets[0].weightKg = 80; w.entries[0].sets[0].reps = 8; w.entries[0].sets[0].done = true; Workout.save();
    App.go('training'); App.renderCurrent(); await sleep(700);
    const cur = document.querySelector('#tab-training .ex-card.ex-cur'), other = document.querySelector('#tab-training .ex-card:not(.ex-cur)');
    const next = cur && cur.querySelector('.set-row.set-next');
    const out = { d: document.documentElement.dataset.design, effects, accent: cssVar('--accent'), font: cssVar('--font-display'), cur: !!cur, nextSi: next ? next.dataset.si : null, otherOp: other ? +getComputedStyle(other).opacity : null };
    Workout.discard(); App.go('start');
    return out; });
  check(fk.d === 'fokus' && fk.effects === 'nonenone' && ['#ffffff', '#0a0a0a'].includes(fk.accent) && !/Saira/.test(fk.font) && fk.cur && fk.nextSi === '1' && fk.otherOp < .8,
    'Design „Fokus": schwarz-weiß ohne Effekte, Spotlight auf aktuelle Übung und nächsten Satz', JSON.stringify(fk));
  await page.evaluate(() => App.go('progress'));
  await pause(page, 600);
  const logged = await appErrors(page);
  check(!logged.length && !page.errors.length, 'keine Fehler beim Design-Wechsel', [...logged, ...page.errors].join(' | '));
}

/* iPhone-Kennung: keine eigenen Verlaufs-Einträge – sonst wischt iOS selbst vom Rand durch den Verlauf
   (vorwärts holte nach „Start" die Einstellungen zurück, zurück lief doppelt mit Trainios Geste) */
async function iphoneFlow(page) {
  console.log('iPhone-Kennung');
  check(await page.evaluate(() => isIOSDevice), 'App erkennt das iPhone');
  const h0 = await page.evaluate(() => history.length);
  await page.evaluate(() => { App.go('more'); openMoreSub('look'); });
  await pause(page, 500);
  check(await page.evaluate(h0 => moreSub === 'look' && history.length === h0 && !history.state, h0), 'Gruppe öffnet ohne Verlaufs-Eintrag');
  await page.click('#topbar [data-act="moreBack"]');
  await pause(page, 500);
  check(await page.evaluate(() => !moreSub), 'Zurück-Knopf schließt die Gruppe');
  await page.evaluate(() => openMoreSub('training'));
  await pause(page, 400);
  await page.click('#bottomNav [data-tab="start"]');
  await pause(page, 300);
  await page.evaluate(() => history.forward());   // = Wisch nach links in der iPhone-App
  await pause(page, 400);
  check(await page.evaluate(() => App.tab === 'start' && !moreSub), 'Nach Wechsel zu Start holt „Vorwärts" die Einstellungen nicht zurück');
  await page.evaluate(() => { Motion.edgeAlways = true; App.go('more'); openMoreSub('workout'); });
  await pause(page, 500);
  await swipe(page, 6, 320, 420);
  check(await page.evaluate(h0 => !moreSub && history.length === h0 && !document.querySelector('.edge-ghost, .edge-shade'), h0), 'Zurück-Wischen vom Rand schließt die Gruppe');
  // Alte Verlaufs-Einträge (von früheren Versionen, bleiben bis zum Beenden der App): Wischen darf nichts verändern
  await page.evaluate(() => { App.go('start'); history.pushState({ moreSub: 'look' }, ''); history.back(); });
  await pause(page, 400);
  await page.evaluate(() => history.forward());   // = iOS-Wisch nach links auf den alten Eintrag
  await pause(page, 500);
  check(await page.evaluate(() => App.tab === 'start' && !moreSub && !history.state), 'Alter Verlaufs-Eintrag: App bleibt auf Start, Eintrag geleert');
  await page.evaluate(() => history.pushState({ moreSub: 'look' }, ''));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined', null, { timeout: 10000 });
  await pause(page, 500);
  check(await page.evaluate(() => !moreSub && !history.state), 'Beim Start auf altem Eintrag: Eintrag geleert, keine Gruppe offen');
  // Fenster von unten: kurz ziehen und loslassen → federt zurück, weit ziehen → schließt
  await page.evaluate(() => { App.go('start'); Actions.startSheet(); });
  await pause(page, 800);
  const hd = await page.evaluate(() => { const r = document.querySelector('.modal .modal-head').getBoundingClientRect(); return { x: r.left + 120, y: r.top + 20, h: document.querySelector('.modal').offsetHeight }; });
  const cdpS = page.cdp || (page.cdp = await page.context().newCDPSession(page));
  const drag = async (to, steps) => { await cdpS.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hd.x, y: hd.y }] }); for (let k = 1; k <= steps; k++) { await cdpS.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: hd.x, y: hd.y + to * k / steps }] }); await pause(page, 30); } await pause(page, 150); await cdpS.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page, 800); };
  await drag(60, 6);
  check(await page.evaluate(() => Modal.count() === 1 && getComputedStyle(document.querySelector('.modal')).transform === 'none'), 'Fenster: kurz gezogen → federt zurück');
  await drag(hd.h * 0.6, 12);
  check(await page.evaluate(() => Modal.count() === 0), 'Fenster: weit nach unten gezogen → schließt');
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

async function heartFlow(page) {
  console.log('Herz & Ausdauer');
  await page.evaluate(() => { UI.progSub = 'cardio'; App.go('progress'); });
  await pause(page, 400);
  check(await page.evaluate(() => !!document.querySelector('#progBody [data-act="rhrMeasure"]') && /Herz & Cardio/.test(document.querySelector('.prog-controls').innerText)) && await noViewError(page),
    'Fortschritt → Herz & Cardio auch ohne Workouts');
  // Ruhepuls im Takt tippen: 20 Schläge alle 600 ms ≈ 100/min
  await page.click('#progBody [data-act="rhrMeasure"]');
  await pause(page, 400);
  const tap = await page.$('.hr-tap'), bx = await tap.boundingBox();
  for (let i = 0; i < 20; i++) { await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down(); await page.mouse.up(); await pause(page, 600); }
  const bpm = await page.evaluate(() => +(document.querySelector('.hr-live.big b') || {}).textContent);
  check(bpm >= 85 && bpm <= 115, 'Ruhepuls im Takt tippen: 20 Schläge alle 0,6 s ≈ 100/min', String(bpm));
  await page.click('.modal [data-x="save"]');
  await pause(page);
  check(await page.evaluate(b => { const h = Store.raw('heart', 'd' + isoDate()); return h && h.rhr === b && h.rhrM === 'tap'; }, bpm), 'Ruhepuls gespeichert (heute, getippt)');
  // Wert direkt eintragen ersetzt den heutigen
  await page.evaluate(() => Actions.rhrMeasure());
  await pause(page, 400);
  await page.click('.modal [data-x="manual"]');
  await page.fill('#hrMan', '62');
  await page.click('.modal [data-x="msave"]');
  await pause(page);
  check(await page.evaluate(() => Store.raw('heart', 'd' + isoDate()).rhr === 62), 'Ruhepuls direkt eingetragen (ersetzt den heutigen Wert)');
  // Geburtsjahr im Profil → Maximalpuls, VO2max-Schätzung, Pulszonen
  await page.evaluate(() => { App.go('more'); openMoreSub('account'); });
  await pause(page, 300);
  await page.fill('#tab-more [data-in="setBirth"]', '2000');
  await pause(page, 900);
  const est = await page.evaluate(() => ({ y: S().birthYear, max: Heart.maxHr(), vo2: Heart.vo2Now(), cls: Heart.vo2Now() && Heart.vo2Class(Heart.vo2Now().v), z: Heart.zones() && Heart.zones().list.length }));
  const age = new Date().getFullYear() - 2000, want = round1(15.3 * Math.round(208 - 0.7 * age) / 62);
  check(est.y === 2000 && est.max.est && est.vo2 && est.vo2.est && Math.abs(est.vo2.v - want) < 0.11 && est.cls && est.z === 5, `Geburtsjahr → VO2max geschätzt (${want}), Einordnung und 5 Pulszonen`, JSON.stringify(est));
  // Herz-Plan: erst nach dem Aktivieren da
  check(await page.evaluate(() => S().heartPlan === null && !Heart.startCard()), 'Herz-Plan ist anfangs aus');
  await page.evaluate(() => { UI.progSub = 'cardio'; App.go('progress'); });
  await pause(page, 300);
  await page.click('#progBody [data-act="heartPlan"]');
  await pause(page, 400);
  await page.click('.modal [data-st="sessions"][data-d="1"]');
  await page.click('.modal [data-x="ok"]');
  await pause(page);
  check(await page.evaluate(() => { const p = S().heartPlan; return p && p.sessions === 4 && p.hard === 1 && p.z2 === 90; }), 'Herz-Plan aktiviert und angepasst (4 Einheiten, 1× hart, 90 min locker)');
  // Cardio im Workout: Intensität, Puls, Intervall-Timer
  await page.evaluate(() => Workout.start({ name: 'Rad', entries: [Workout.makeEntry('ex_fahrrad')] }));
  await pause(page, 600);
  await page.click('#tab-training [data-act="cdEffort"][data-v="easy"]');
  await page.fill('#tab-training [data-in="cdHr"]', '130');
  await pause(page, 150);
  check(await page.evaluate(() => { const en = Workout.cur().entries[0]; return en.effort === 'easy' && en.hr === 130 && /^Zone \d$/.test(document.querySelector('[data-hz="0"]').textContent); }), 'Cardio: Intensität „locker" und Ø Puls mit Zone');
  await page.click('#tab-training [data-act="hiitSetup"]');
  await pause(page, 400);
  await page.click('.modal [data-hp="4x4"]');
  await page.click('.modal [data-x="go"]');
  await pause(page, 600);
  check(await page.evaluate(() => !!Workout.cur().hiit && document.querySelector('#hiPh').textContent === 'Aufwärmen' && /Intervalle|Aufwärmen/.test(document.querySelector('[data-hiit-pill]').textContent)), 'Intervall-Timer läuft (Aufwärmen, Anzeige in der Karte)');
  for (let i = 0; i < 12 && await page.evaluate(() => !!document.querySelector('#hiRun:not(.ph-done)')); i++) { await page.click('.modal [data-x="skip"]'); await pause(page, 260); }
  const hi = await page.evaluate(() => { const en = Workout.cur().entries[0]; return { done: !!document.querySelector('.ph-done'), eff: en.effort, hiit: en.hiit, sets: en.sets.map(s => [s.durationSec, s.done]) }; });
  check(hi.done && hi.eff === 'hard' && hi.hiit && hi.hiit.rounds === 4 && hi.sets.some(([d, ok]) => d === 2400 && ok), 'Intervalle bis zum Ende: 40 min als harter Abschnitt eingetragen', JSON.stringify(hi));
  await page.click('.modal [data-x="ok"]');
  await pause(page);
  await page.evaluate(() => { Store.saveSettings({ finishConfirm: 'never' }); Actions.woFinish(); });
  await pause(page, 700);
  await page.evaluate(() => Modal.closeAll());
  await pause(page, 300);
  const saved = await page.evaluate(() => { const w = Store.all('workouts')[0]; const en = w && w.entries[0]; return { en: en && { effort: en.effort, hr: en.hr, hiit: en.hiit }, week: Heart.planWeek() }; });
  check(saved.en && saved.en.effort === 'hard' && saved.en.hr === 130 && saved.en.hiit && saved.week.sessions === 1 && saved.week.hard === 1, 'Gespeichert mit Intensität; Herz-Plan zählt die Einheit', JSON.stringify(saved));
  await page.evaluate(() => App.go('start'));
  await pause(page, 300);
  check(await page.evaluate(() => /Herz diese Woche/.test((document.querySelector('#tab-start .hp-card') || {}).innerText || '')), 'Startseite zeigt „Herz diese Woche"');
  // Startseite: Herz-Karte abschaltbar, alle Kacheln wählbar
  await page.evaluate(() => { App.go('more'); openMoreSub('look'); });
  await pause(page, 300);
  await page.click('#tab-more [data-k="homeHeart"]');
  await pause(page, 300);
  await page.evaluate(() => { Store.saveSettings({ homeTiles: HOME_TILES.map(x => x[0]), homeLiftEx: 'ex_bankdruecken' }); App.go('start'); });
  await pause(page, 500);
  const home = await page.evaluate(() => ({ off: S().homeHeart === false, card: !!document.querySelector('#tab-start .hp-card'), n: document.querySelectorAll('#tab-start .stat-grid > .stat').length,
    want: HOME_TILES.filter(x => tileAvail(x[0])).length, bad: /undefined|NaN/.test(document.querySelector('#tab-start .stat-grid').innerText) }));
  check(home.off && !home.card, 'Startseite: „Herz diese Woche" lässt sich ausblenden', JSON.stringify(home));
  check(home.n === home.want && home.n >= 17 && !home.bad && await noViewError(page), `Startseite: alle ${home.want} Kacheln wählbar und gefüllt`, JSON.stringify(home));
  await page.evaluate(() => { UI.progSub = 'cardio'; App.go('progress'); });
  await pause(page, 900);
  check(await page.evaluate(() => ['h1', 'h3'].every(id => !!Chart.getChart(document.querySelector('#cv-' + id)))) && await noViewError(page), 'Herz-Diagramme gezeichnet (Ruhepuls, Intensität)');
  check(!page.errors.length && !(await appErrors(page)).length, 'keine JavaScript-Fehler', page.errors.concat(await appErrors(page)).join(' | '));
}
const round1 = v => Math.round(v * 10) / 10;

async function formFixFlow(page) {
  console.log('Form-Fix');
  // 4× Bankdrücken mit 90 kg (schlechte Form)
  await page.evaluate(async () => {
    const ops = [90, 90, 90, 90].map((kg, i) => { const st = Date.now() - (30 - i * 6) * 864e5; return { type: 'put', coll: 'workouts', id: 'ff' + i, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [1, 2, 3].map(() => ({ reps: 5, weightKg: kg, done: true })) }] } }; });
    await Store.batch(ops); await PR.recalcAll();
    Store.put('templates', 'tff', { name: 'Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '5', restSec: 0, notes: '' }], createdAt: Date.now() });
    Store.saveSettings({ finishConfirm: 'never', autoRest: false });
    Workout.start({ templateId: 'tff' });
  });
  await pause(page, 500);
  await page.click('#tab-training [data-act="exMenu"][data-ei="0"]');
  await pause(page, 400);
  await page.click('.modal [data-k="fix"]');
  await pause(page, 400);
  await page.fill('#pdInput', 'tiefer, Rücken gerade');
  await page.click('.modal [data-x="ok"]');
  await pause(page, 300);
  check(await page.evaluate(() => { const en = Workout.cur().entries[0]; return en.formFix && en.formFix.note === 'tiefer, Rücken gerade' && /Form-Fix/.test(document.querySelector('#tab-training .fix-line').innerText); }), 'Form-Fix über ⋯ bei der Übung gesetzt (mit Notiz, Hinweis in der Karte)');
  const finish = kg => page.evaluate(k => { const w = Workout.cur(); w.entries[0].sets.forEach(s => { s.weightKg = k; s.reps = 5; s.done = true; s.doneAt = Date.now(); }); Workout.save(); Actions.woFinish(); }, kg);
  await finish(80);
  await pause(page, 700);
  const a = await page.evaluate(() => { const w = Store.all('workouts').find(x => x.entries[0].formFix); const sc = w && Analytics.score(w.id); return { sum: /Form-Fix – neue Startwerte/.test(document.querySelector('.modal-body').innerText), prog: sc && sc.parts.prog, pr: Store.raw('prs', 'ex_bankdruecken') }; });
  check(a.sum && a.prog === 0.6, 'Score: 80 statt 90 kg mit Form-Fix wird neutral gewertet', JSON.stringify(a));
  check(a.pr && a.pr.bestWeightKg === 80 && a.pr.fixDate && a.pr.beforeFix && a.pr.beforeFix.bestWeightKg === 90, 'PRs starten neu (80 kg), 90 kg bleibt als „vor Form-Fix"', JSON.stringify(a.pr));
  await page.evaluate(() => { Modal.closeAll(); Workout.start({ templateId: 'tff' }); });
  await pause(page, 500);
  await finish(82.5);
  await pause(page, 700);
  check(await page.evaluate(() => /Neue PRs/i.test(document.querySelector('.modal-body').innerText) && Analytics.cur().prEvents.some(e => e.exId === 'ex_bankdruecken' && e.w === 82.5)), 'Nach dem Form-Fix: 82,5 kg zählt als neuer PR');
  await page.evaluate(() => { Modal.closeAll(); UI.progSub = 'strength'; UI.kraftScope = 'exercise'; UI.kraftEx = 'ex_bankdruecken'; App.go('progress'); });
  await pause(page, 800);
  check(await page.evaluate(() => /seit Form-Fix/.test(document.querySelector('#progBody').innerText)) && await noViewError(page), 'Fortschritt → Kraft rechnet ab dem Form-Fix');
  await page.evaluate(() => openExerciseDetail('ex_bankdruecken'));
  await pause(page, 600);
  check(await page.evaluate(() => /Form-Fix am .*Vorher: 1RM/.test((document.querySelector('.modal .fix-card') || {}).innerText || '')), 'Übungs-Seite zeigt Form-Fix und Bestwerte von vorher');
  // Form-Fix nur für einen Satz: Satz 2 bewusst leichter
  await page.evaluate(() => { Modal.closeAll(); Workout.start({ templateId: 'tff' }); });
  await pause(page, 500);
  await page.click('#tab-training [data-act="setMenu"][data-ei="0"][data-si="1"]');
  await pause(page, 400);
  await page.click('.modal [data-k="fixset"]');
  await pause(page, 300);
  check(await page.evaluate(() => Workout.cur().entries[0].sets[1].fix === true && /Form-Fix bei Satz 2/.test(document.querySelector('#tab-training').innerText) && !!document.querySelector('#tab-training .set-num.fix')), 'Form-Fix nur für Satz 2 (über die Satznummer), markiert');
  await page.evaluate(() => { const w = Workout.cur(); w.entries[0].sets.forEach((s, i) => { s.weightKg = i === 1 ? 75 : 82.5; s.reps = 5; s.done = true; s.doneAt = Date.now(); }); Workout.save(); Actions.woFinish(); });
  await pause(page, 700);
  const one = await page.evaluate(() => { const rows = Analytics.cur().rows, w = Store.raw('workouts', rows[rows.length - 1].id); const ss = Analytics.sessionsOf('ex_bankdruecken'), cur = ss[ss.length - 1]; return { fix: w.entries[0].sets.map(s => !!s.fix), prog: Analytics.score(w.id).parts.prog, maxW: cur.maxW, setsN: cur.setsN, sets: cur.sets }; });
  check(one.fix.join() === 'false,true,false' && one.prog === 0.6 && one.maxW === 82.5 && one.setsN === 2 && one.sets === 3, 'Leichterer Form-Fix-Satz zählt nicht gegen dich (Score, Kraftwerte), bleibt erledigt', JSON.stringify(one));
  await page.evaluate(() => Modal.closeAll());
  check(!page.errors.length && !(await appErrors(page)).length, 'keine JavaScript-Fehler', page.errors.concat(await appErrors(page)).join(' | '));
}

async function desktopFlow(page) {
  console.log('Desktop (1280 × 800)');
  check(!page.errors.length, 'App startet ohne Fehler', page.errors.join(' | '));
  for (const tab of ['start', 'training', 'exercises', 'progress', 'more']) {
    await page.click(`#sidebar [data-tab="${tab}"]`);
    await pause(page, 150);
    check(await page.evaluate(t => App.tab === t, tab) && await noViewError(page), `Tab „${tab}" (Seitenleiste)`);
  }
  check(await page.evaluate(() => !Keypad.on() && kpIM('decimal') === 'decimal'), 'Desktop (Maus): keine eigene Zahlentastatur, normale Eingabe');
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

/* Anzeige-Fehler aus der Bestandsaufnahme (docs/redesign/bestandsaufnahme.md, H4–H6) */
async function anzeigeFlow(page) {
  console.log('Anzeige-Fehler');
  await page.evaluate(async () => {
    const day = n => { const st = Date.now() - n * 864e5; return { date: isoDate(new Date(st)), startedAt: st }; };
    const bank = (n, kg, reps) => ({ ...day(n), durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [1, 2, 3].map(() => ({ reps, weightKg: kg, done: true })) }] });
    await Store.batch([
      { type: 'put', coll: 'workouts', id: 'az1', doc: bank(20, 100, 8) },
      { type: 'put', coll: 'workouts', id: 'az2', doc: bank(10, 105, 3) },   // schwerer (Gewichts-PR), aber kein besseres e1RM
      { type: 'put', coll: 'workouts', id: 'az3', doc: { ...day(1), durationSec: 1800, name: 'Laufen', entries: [{ exerciseId: 'ex_laufband', exerciseName: 'Laufband (Joggen)', sets: [{ durationSec: 1800, distKm: 5, done: true }] }] } }
    ]);
    await PR.recalcAll();
  });
  // 1. Workout-Score: der Bonus zählt nur e1RM-Rekorde und sagt das auch – kein „kein neuer Rekord“ neben „Neuer PR“
  const bd = await page.evaluate(() => { const sc = Analytics.score('az2'); return { prs: sc.prs, html: scoreBreakdownHtml(sc) }; });
  check(bd.prs === 0 && /e1RM-Bonus/.test(bd.html) && /kein neuer e1RM-Rekord/.test(bd.html) && !/PR-Bonus|kein neuer Rekord/.test(bd.html),
    'Workout-Score: Bonus heißt „e1RM-Bonus“ – ein Gewichts-PR ohne neues e1RM widerspricht ihm nicht', JSON.stringify(bd.prs));
  // 2. Reine Cardio-Workouts erscheinen nicht als 0 kg
  const cv = await page.evaluate(() => { const ix = Analytics.cur(); return { cardio: ix.rows.some(r => r.id === 'az3' && r.cardioOnly), total: scopeItems(ix, 'total').map(x => x.ton) }; });
  check(cv.cardio && cv.total.length === 2 && cv.total.every(t => t > 0), 'Volumen pro Workout: reine Cardio-Workouts zählen nicht mit (keine Punkte auf der Nulllinie)', JSON.stringify(cv));
  await page.evaluate(() => { UI.progSub = 'overview'; App.go('progress'); });
  await pause(page, 600);
  const h7 = await page.evaluate(() => [...document.querySelectorAll('#tab-progress .heat7 button')].map(b => b.getAttribute('aria-label')).join(' | '));
  check(/Cardio/.test(h7) && !/\b0\s?kg/.test(h7), '„Letzte 7 Tage“: ein Cardio-Tag heißt „Cardio“ statt „0 kg“ (Vorlesetext)', h7);
  const h7txt = await page.evaluate(() => document.querySelector('#tab-progress .heat7').innerText.replace(/\s+/g, ' ').trim());
  check(!/kg|\dt\b|Cardio/.test(h7txt), '„Letzte 7 Tage“: in den Kästchen nur der Wochentag, keine Mini-Werte', h7txt);
  // Kraftzuwachs robust (bestes e1RM je Woche, Median der ersten gegen gleitenden Median der letzten Wochen):
  // Tagesform-Schwankungen (σ 3 %) ohne echten Fortschritt ergeben ≈ 0 % – je Übung im Mittel und im verketteten Index
  // der Karte „Kraftzuwachs“. Das frühere laufende Maximum gegen die erste Session zeigt bei denselben Daten ≈ +6 %.
  const kz = await page.evaluate(() => {
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const gauss = () => { let u = -6; for (let i = 0; i < 12; i++) u += rnd(); return u; };
    // 12 Wochen, 2 Sessions pro Woche; e1RM = Niveau (je nach Woche) × Tagesform
    const w0 = weekStartDN(7000), mk = lvl => Array.from({ length: 24 }, (_, i) => ({ dn: w0 + (i >> 1) * 7 + (i % 2) * 3, best: lvl(i >> 1) * (1 + 0.03 * gauss()) }));
    const sessions = {}, flat = [], up = [];
    for (let k = 0; k < 300; k++) { flat.push('f' + k); sessions['f' + k] = mk(() => 100); }
    for (let k = 0; k < 50; k++) { up.push('u' + k); sessions['u' + k] = mk(w => 100 * (1 + 0.01 * w)); }   // +1 % pro Woche
    const all = { from: 0, to: 99999 }, ix = { sessions };
    const gF = strengthGains(ix, flat, all), gU = strengthGains(ix, up, all), last = a => a[a.length - 1].y;
    const old = avg(flat.map(id => { const ss = sessions[id]; return (Math.max(...ss.map(s => s.best)) / ss[0].best - 1) * 100; }));
    return { n: gF.length, flat: round(avg(gF.map(g => g.gain)), 2), flatIdx: last(gainIndex(gF)), old: round(old, 1), up: round(avg(gU.map(g => g.gain)), 1), upIdx: last(gainIndex(gU)) };
  });
  check(kz.n === 300 && Math.abs(kz.flat) < 0.5 && Math.abs(kz.flatIdx) < 0.5 && kz.old > 3, 'Kraftzuwachs: verrauschte, aber gleichbleibende Daten ergeben ≈ 0 % (früher laufendes Maximum: ≈ +6 %)', JSON.stringify(kz));
  check(kz.up > 6 && kz.up < 12 && kz.upIdx > 6 && kz.upIdx < 12, 'Kraftzuwachs: echte Steigerung (+1 % pro Woche) bleibt sichtbar', JSON.stringify(kz));
  // Form-Fix startet neu (Werte davor zählen nicht), unter 4 Trainingswochen gibt es keinen Wert,
  // mehrere Sessions pro Woche zählen als eine Woche
  const kf = await page.evaluate(() => {
    const w0 = weekStartDN(7000), wk = (n, lvl, from = 0, perWeek = 1) => Array.from({ length: n * perWeek }, (_, i) => ({ dn: w0 + (from + Math.floor(i / perWeek)) * 7 + i % perWeek, best: lvl }));
    const fix = [...wk(6, 120), ...wk(6, 100, 6)]; fix[6].fix = true;           // vor dem Fix 120 kg, danach 100 kg
    const short = [...wk(9, 120), ...wk(3, 100, 9)]; short[9].fix = true;       // nach dem Fix erst 3 Wochen
    const g = strengthGains({ sessions: { fix, short, often: wk(3, 100, 0, 3), weekly: wk(4, 100) } }, ['fix', 'short', 'often', 'weekly'], { from: 0, to: 99999 });
    return g.map(x => `${x.id}:${round(x.gain, 1)}/${x.weeks}`).join(' ');
  });
  check(kf === 'fix:0/6 weekly:0/4', 'Kraftzuwachs: ab dem Form-Fix, erst ab 4 Trainingswochen je Übung', kf);
  // Blasse Anteile (z. B. mitgeholfene Sätze) auch bei „Hoher Kontrast“, wo Farben als color-mix() kommen
  const al = await page.evaluate(() => [alpha('color-mix(in srgb, #000000 50%, #ffffff)', .3), alpha('#ff0000', .5)]);
  check(/^rgba\(12[78], 12[78], 12[78], 0\.3\)$/.test(al[0]) && al[1] === 'rgba(255, 0, 0, 0.5)', 'Diagramme: blasse Anteile auch bei „Hoher Kontrast“ (color-mix wird aufgelöst)', al.join(' | '));
  // 3. Pausen-Leiste: Nach jedem Satz bleibt der nächste Satz samt „Satz erledigt“ sichtbar über der Leiste
  await page.evaluate(() => {
    Store.put('templates', 'taz', { name: 'Brust', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 8, reps: '8', restSec: 90, notes: '' }], createdAt: Date.now() });
    Store.saveSettings({ autoRest: true, autoScroll: true, finishConfirm: 'never' });
    Workout.start({ templateId: 'taz' });
  });
  await pause(page, 600);
  const covered = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(si => {
      Workout.set(w => Object.assign(w.entries[0].sets[si], { weightKg: 60, reps: 8 }));
      App.renderCurrent();
      [...document.querySelectorAll(`#tab-training [data-act="setDone"][data-ei="0"][data-si="${si}"]`)].find(n => n.offsetParent).click();
    }, i);
    await pause(page, 800);
    const r = await page.evaluate(() => {
      const sel = Workout.cur().sel, dock = document.querySelector('.rest-dock:not(.leaving)');
      if (!dock || sel.e < 0) return null;
      const q = `[data-ei="${sel.e}"][data-si="${sel.s}"]`;
      const bottom = Math.max(...[...document.querySelectorAll(`#tab-training .set-row${q}, #tab-training [data-act="setDone"]${q}`)].filter(n => n.offsetParent).map(n => n.getBoundingClientRect().bottom));
      return { s: sel.s, bottom: Math.round(bottom), dock: Math.round(dock.getBoundingClientRect().top) };
    });
    if (r && r.bottom > r.dock) covered.push(r);
  }
  check(!covered.length, 'Pausen-Leiste verdeckt den nächsten Satz nicht (6 Sätze nacheinander)', JSON.stringify(covered));
  // Nur noch die schlichte Eingabe – Plan-Notiz, Steigerungs-Hinweis und Menü-Funktionen bleiben erreichbar
  const one = await page.evaluate(async () => {
    Workout.discard();
    Store.put('templates', 'tnote', { name: 'Notiz', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 2, reps: '5', restSec: 90, notes: 'Schulterblätter zusammen' }], createdAt: Date.now() });
    Workout.start({ templateId: 'tnote' });
    Workout.set(w => { w.entries[0].suggestion = { type: 'up', weightKg: 82.5, text: 'Mehr Gewicht: 82,5 kg' }; });
    App.renderCurrent();
    await new Promise(r => setTimeout(r, 300));
    const tab = document.querySelector('#tab-training');
    const menu = [];
    const orig = window.actionMenu;
    window.actionMenu = async (t, items) => { menu.push(...items.filter(Boolean).map(i => i.key)); return null; };
    await Actions.woMore(); await Actions.exMenu({ dataset: { ei: 0 } });
    window.actionMenu = orig;
    return { note: tab.innerText.includes('Schulterblätter zusammen'), up: /82,5 kg ↑/.test(tab.innerText), detailed: !!tab.querySelector('.set-head .rpe-h, .wo-strip, .ex-goal, .set-panel'),
      menu: menu.join(','), settings: !!document.querySelector('[data-seg="woStyle"]') };
  });
  check(one.note && one.up && !one.detailed && !/style/.test(one.menu) && /notes/.test(one.menu) && /warm/.test(one.menu) && /plates/.test(one.menu) && /drop/.test(one.menu),
    'Nur eine Workout-Eingabe: Plan-Notiz und Steigerung sichtbar, Aufwärmen/Scheiben/Drop-Satz/Notiz im Menü', JSON.stringify(one));
  const mig = await page.evaluate(async () => {
    Store.saveSettings({ woStyle: 'detailed', simpleRPE: false, seedVersion: 7 });
    ensureSeeds();
    await new Promise(r => setTimeout(r, 200));
    return { rpe: S().simpleRPE, v: S().seedVersion };
  });
  check(mig.rpe === true && mig.v >= 8, 'Umzug: wer „Ausführlich“ mit RPE hatte, behält die RPE-Eingabe als Spalte', JSON.stringify(mig));
  await page.evaluate(() => { Workout.discard(); Workout.start({ templateId: 'taz' }); App.renderCurrent(); });
  await pause(page, 300);
  // Workout-Kopf auf dem Handy deckend: darunter gescrollte Übungen scheinen in keinem Design durch
  const see = await page.evaluate(async () => {
    const out = [];
    for (const d of DESIGNS) for (const m of d.phased ? ['dark'] : ['light', 'dark']) {
      Store.saveSettings({ design: d.id, theme: m }); applyTheme();
      await new Promise(r => setTimeout(r, 60));
      const h = document.querySelector('.wo-head');
      if (!h) { out.push(d.id + ': kein Kopf'); continue; }
      // Deckkraft aus rgb(a)(…) oder color(srgb … / a) lesen
      const c = getComputedStyle(h).backgroundColor, sl = c.match(/\/\s*([\d.]+)\s*\)$/), rg = c.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      const alpha = c === 'transparent' ? 0 : sl ? +sl[1] : rg ? +rg[1] : 1;
      if (alpha < 1) out.push(`${d.id}·${m} ${c}`);
    }
    Store.saveSettings({ design: 'gymlog', theme: 'dark' }); applyTheme();
    return out;
  });
  check(!see.length, 'Workout-Kopf auf dem Handy in allen Designs deckend (nichts scheint durch)', see.join(', '));
  await page.evaluate(() => Workout.discard ? Workout.discard() : null);
}

/* Sätze pro Muskel und Woche – Bereiche nach der Recherche (docs/redesign/recherche/saetze-pro-woche.md) */
/* Testversion unter …/test/: eigener Speicher, kein Firebase, Beispieldaten – die echten Daten bleiben unberührt */
async function testversionFlow(page) {
  console.log('Testversion (…/test/)');
  await page.evaluate(async () => {
    await Store.batch([{ type: 'put', coll: 'workouts', id: 'echt1', doc: { date: isoDate(), startedAt: Date.now(), durationSec: 600, name: 'Echt', entries: [] } }]);
    Store.flushLocal();
  });
  const t = await page.context().newPage();
  t.errors = [];
  t.on('pageerror', e => t.errors.push(e.message));
  await t.goto(page.url() + 'test/', { waitUntil: 'domcontentloaded' });
  await t.waitForFunction(() => typeof App !== 'undefined' && Store.all('workouts').length > 0 && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 10000 });
  const r = await t.evaluate(() => ({ test: TESTVERSION, key: LS.data, fb: Auth.configured(), wo: Store.all('workouts').length, echt: !!Store.raw('workouts', 'echt1'),
    bw: Store.all('progress').length, phase: (S().phases || []).map(p => p.type).join(), plan: S().activePlanId, prs: Store.all('prs').length }));
  check(r.test && r.key === 'trainio-test.v1' && !r.fb, 'Testversion: eigener Speicher, kein Firebase');
  check(r.wo >= 20 && r.bw >= 20 && r.phase === 'bulk' && r.plan === 'plan_bsp' && r.prs > 10 && !r.echt,
    `Testversion: Beispieldaten (${r.wo} Workouts, ${r.bw}× Gewicht, Bulk), das echte Workout ist nicht zu sehen`);
  let bad = [];
  for (const tab of ['start', 'training', 'progress', 'more']) {
    await t.evaluate(x => App.go(x), tab); await pause(t, 300);
    if (!await noViewError(t)) bad.push(tab);
  }
  const more = await t.evaluate(() => document.querySelector('#tab-more').innerText);
  check(!bad.length && more.includes('Beispieldaten neu laden') && !more.includes('Lokaler Modus'), 'Testversion: alle Tabs laufen, „Mehr“ zeigt „Beispieldaten neu laden“', bad.join(', '));
  const again = await t.evaluate(async () => { Store.del('workouts', Store.all('workouts')[0].id); Store.put('workouts', 'extra', { date: isoDate(), startedAt: Date.now(), name: 'X', entries: [] });
    await Testversion.load(); return Store.all('workouts').length; });
  check(again === r.wo, 'Testversion: „Neu laden“ stellt die Beispieldaten wieder her');
  await t.evaluate(() => Store.flushLocal());
  const real = await t.evaluate(() => Object.keys((JSON.parse(localStorage.getItem('gymlog.v1')) || { colls: {} }).colls.workouts || {}));
  check(real.join() === 'echt1', 'Testversion: die echten Daten bleiben unberührt', real.join());
  check(!t.errors.length, 'Testversion ohne JS-Fehler', t.errors.join(' | '));
  await t.close();
}

async function muskelFlow(page) {
  console.log('Sätze pro Muskel');
  await page.evaluate(async () => {
    const ops = [];
    // 4 Wochen: je Woche 4 direkte Bizeps-Sätze (Curls) + 9 Sätze Rudern (Bizeps hilft mit) → zählt als 8,5
    for (let wk = 0; wk < 4; wk++) {
      const st = Date.now() - (3 + wk * 7) * 864e5;
      const sets = n => Array.from({ length: n }, () => ({ reps: 10, weightKg: 20, done: true }));
      ops.push({ type: 'put', coll: 'workouts', id: 'mu' + wk, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Pull', entries: [
        { exerciseId: 'ex_curl_kh', exerciseName: 'Curl', sets: sets(4) }, { exerciseId: 'ex_lh_rudern', exerciseName: 'Rudern', sets: sets(9) }] } });
    }
    // Leichte Sätze: 4 Curls mit RPE 5 zählen für Muskeln halb
    const st = Date.now() - 50 * 864e5;
    ops.push({ type: 'put', coll: 'workouts', id: 'murpe', doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 1200, name: 'Arme', entries: [
      { exerciseId: 'ex_curl_kh', exerciseName: 'Curl', sets: [1, 2, 3, 4].map(() => ({ reps: 12, weightKg: 10, rpe: 5, done: true })) }] } });
    await Store.batch(ops);
    UI.period = '4w'; UI.progSub = 'muscles'; App.go('progress');
  });
  await pause(page, 1500);
  const rpe = await page.evaluate(() => { const r = Analytics.cur().rows.find(x => x.id === 'murpe'); return r && { mP: r.mP['Bizeps'], sets: r.sets }; });
  check(rpe && rpe.mP === 2 && rpe.sets === 4, 'Leichte Sätze (RPE ≤ 5) zählen für den Muskel halb, als Satz voll', JSON.stringify(rpe));
  const v = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#tab-progress .chart-card')].find(c => /Sätze pro Muskelgruppe/.test(c.innerText));
    const ch = card && Chart.getChart(card.querySelector('canvas'));
    const neg = [...document.querySelectorAll('#tab-progress .chart-card')].find(c => /Vernachlässigte Muskelgruppen/.test(c.innerText));
    return { lines: ch ? ch.options.plugins.thresholds.lines.map(l => l.value + ' ' + l.label).join(', ') : null, mev: /\b(MEV|MAV|MRV)\b/.test(document.querySelector('#tab-progress').innerText), negBizeps: neg ? /Bizeps/.test(neg.innerText) : null, negRueckenOk: neg ? !/\bRücken\b/.test(neg.innerText) : null };
  });
  check(v.lines === '4 wirksam, 10 viel, 20 sehr viel' && !v.mev, 'Sätze pro Muskelgruppe: Linien bei 4 / 10 / 20 statt MEV/MAV/MRV', JSON.stringify(v));
  check(v.negBizeps === false && v.negRueckenOk, 'Vernachlässigt erst unter 4: Bizeps mit 4 direkt + 9 mitgeholfen (8,5) gilt als wirksam', JSON.stringify(v));
  // Kniebeugen ohne Beinbeuger/unteren Rücken – auch bei bestehenden Konten (nur, wenn niemand die Muskeln geändert hat)
  const sq = await page.evaluate(async () => {
    const e1 = Store.raw('exercises', 'ex_kniebeuge'), e2 = Store.raw('exercises', 'ex_kniebeuge_lowbar');
    await Store.batch([
      { type: 'put', coll: 'exercises', id: 'ex_kniebeuge', doc: { ...e1, muscleGroups: ['Quadrizeps', 'Gesäß', 'Unterer Rücken'] }, replace: true },
      { type: 'put', coll: 'exercises', id: 'ex_kniebeuge_lowbar', doc: { ...e2, muscleGroups: ['Quadrizeps', 'Gesäß', 'Beinbeuger', 'Waden'] }, replace: true }]);
    Store.saveSettings({ seedVersion: 5 });
    ensureSeeds();
    await new Promise(r => setTimeout(r, 300));
    return { hb: Store.raw('exercises', 'ex_kniebeuge').muscleGroups.join(','), lb: Store.raw('exercises', 'ex_kniebeuge_lowbar').muscleGroups.join(','), v: S().seedVersion };
  });
  check(sq.hb === 'Quadrizeps,Gesäß' && sq.lb === 'Quadrizeps,Gesäß,Beinbeuger,Waden' && sq.v >= 6, 'Kniebeuge: unterer Rücken entfernt, selbst geänderte Übungen bleiben unberührt', JSON.stringify(sq));
  // Wenig Text: jede Erklärung im (i) hat höchstens 2 kurze Sätze (docs/redesign/ANFORDERUNGEN.md, Abschnitt 2)
  const infos = new Set();
  const grab = async () => (await page.evaluate(() => [...document.querySelectorAll('[data-info]')].map(b => b.dataset.info))).forEach(t => infos.add(t));
  await page.evaluate(() => Store.saveSettings({ f_bodyFat: true, f_measures: true }));
  for (const sub of ['overview', 'strength', 'volume', 'muscles', 'cardio', 'body']) {
    for (const sc of sub === 'strength' || sub === 'volume' ? ['total', 'exercise', 'muscle'] : ['total']) {
      await page.evaluate(([s, sc]) => { UI.progSub = s; UI.kraftScope = sc; UI.volScope = sc; App.go('progress'); }, [sub, sc]);
      await pause(page, 500); await grab();
    }
  }
  for (const t of ['start', 'training', 'more']) { await page.evaluate(t => App.go(t), t); await pause(page, 400); await grab(); }
  const ABBR = /\b(z\. B|d\. h|u\. a|bzw|ca|Wdh|usw|evtl|inkl|min|Std|Nr|vs|ggf|max|mind|etc)\./g;
  const sentences = t => t.replace(ABBR, m => m.replace(/\./g, '·')).replace(/\d\.\d/g, 'x').split(/[.!?…](?:\s|$)/).filter(x => x.trim().length > 2).length;
  const long = [...infos].filter(t => sentences(t) > 2 || t.length > 150);
  check(infos.size > 40 && !long.length, `Erklärungen im (i): höchstens 2 kurze Sätze (${infos.size} geprüft)`, long.slice(0, 3).join(' | '));
  // Muskel-Liste unter der Heatmap: eingeklappt, „Alle Muskeln“ klappt auf, bleibt nach dem Neu-Zeichnen offen
  const reg = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    UI.regOpen = false; UI.progSub = 'muscles'; App.go('progress', { instant: true }); App.renderCurrent(); await wait(300);
    const list = () => document.querySelector('#regList'), btn = () => document.querySelector('[data-act="regToggle"]');
    const zu = list().hidden && btn().getAttribute('aria-expanded') === 'false' && !list().offsetParent;
    btn().click(); await wait(100);
    const auf = !list().hidden && btn().getAttribute('aria-expanded') === 'true' && list().querySelectorAll('.reg-item').length > 10;
    App.renderCurrent(); await wait(200);
    const bleibt = !list().hidden && btn().classList.contains('open');
    btn().click(); await wait(100);
    return { zu, auf, bleibt, wiederZu: list().hidden && UI.regOpen === false };
  });
  check(reg.zu && reg.auf && reg.bleibt && reg.wiederZu, 'Muskel-Liste unter der Heatmap: eingeklappt, „Alle Muskeln“ klappt auf und wieder zu, Zustand bleibt', JSON.stringify(reg));
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

async function befundeFlow(page) {
  console.log('Befunde aus dem Prüfbericht');
  const base = new URL(page.url()).origin;
  // T01: zwei Tabs speichern unabhängig voneinander – nichts geht verloren
  const b = await page.context().newPage();
  b.errors = [];
  b.on('pageerror', e => b.errors.push(e.message));
  await b.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await b.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab).innerHTML.length > 0);
  await b.waitForTimeout(500);
  const doc = n => ({ name: n, category: 'Push', muscleGroups: ['Brust'], equipment: 'Kurzhantel', defaultUnit: 'kg', isCustom: true, aliases: [], createdAt: Date.now() });
  await page.evaluate(d => Store.put('exercises', 'qa_tab_a', d), doc('QA aus Tab A'));
  await pause(page, 500);
  await b.evaluate(d => Store.put('exercises', 'qa_tab_b', d), doc('QA aus Tab B'));
  await pause(b, 600);
  await page.evaluate(() => Store.del('exercises', 'ex_seitheben'));
  await pause(page, 600);
  const c = await page.context().newPage();
  await c.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await c.waitForFunction(() => typeof Store !== 'undefined' && Store.all('exercises').length > 300);
  const tabs = await c.evaluate(() => ({ a: !!Store.raw('exercises', 'qa_tab_a'), b: !!Store.raw('exercises', 'qa_tab_b'), del: !Store.raw('exercises', 'ex_seitheben') }));
  const live = await b.evaluate(() => ({ a: !!Store.raw('exercises', 'qa_tab_a'), del: !Store.raw('exercises', 'ex_seitheben') }));
  check(tabs.a && tabs.b && tabs.del && live.a && live.del && !b.errors.length, 'T01: zwei offene Tabs überschreiben sich nicht, der andere Tab sieht Änderungen sofort', JSON.stringify({ tabs, live, err: b.errors }));
  await c.close(); await b.close();

  // T03: alternative Namen bleiben eine Liste – Editor und Arrow-Zuordnung funktionieren weiter
  await page.evaluate(() => { Store.put('exercises', 'qa_alias', { name: 'QA Alias', category: 'Pull', muscleGroups: ['Rücken'], equipment: 'Kabel', defaultUnit: 'kg', isCustom: true, aliases: [], createdAt: Date.now() }); });
  await pause(page);
  await page.evaluate(() => { openExerciseForm(Store.raw('exercises', 'qa_alias')); });
  await pause(page, 400);
  await page.fill('.modal-wrap:not(.closing) input[data-f="aliases"]', 'Diagonal, Rotation');
  await page.locator('.modal-wrap:not(.closing) input[data-f="aliases"]').dispatchEvent('change');
  await page.click('.modal-wrap:not(.closing) [data-x="save"]');
  await pause(page, 500);
  const al = await page.evaluate(() => Store.raw('exercises', 'qa_alias').aliases);
  await page.evaluate(() => { openExerciseForm(Store.raw('exercises', 'qa_alias')); });
  await pause(page, 400);
  const form = await page.evaluate(() => ({ fields: Modal.top().el.querySelectorAll('[data-f]').length, val: (Modal.top().el.querySelector('input[data-f="aliases"]') || {}).value }));
  await page.evaluate(() => Modal.closeAll()); await pause(page);
  // ältere Stände mit Komma-Text: Suche, Import-Zuordnung und Reparatur beim Start
  const old = await page.evaluate(async () => {
    Store.put('exercises', 'qa_alias_alt', { name: 'QA Alt', category: 'Pull', muscleGroups: ['Rücken'], equipment: 'Kabel', defaultUnit: 'kg', isCustom: true, aliases: 'Old Row, Kabelzug alt', createdAt: Date.now() });
    const found = Ex.findByName('kabelzug alt'), fuzzy = Ex.findByName('Row Old');
    Store.saveSettings({ seedVersion: 6 }); ensureSeeds();
    await new Promise(r => setTimeout(r, 300));
    return { found: found && found.id, fuzzy: fuzzy && fuzzy.id, repaired: Store.raw('exercises', 'qa_alias_alt').aliases };
  });
  check(Array.isArray(al) && al.join('|') === 'Diagonal|Rotation' && form.fields >= 3 && form.val === 'Diagonal, Rotation', 'T03: Übung mit alternativen Namen lässt sich speichern und wieder bearbeiten', JSON.stringify({ al, form }));
  check(old.found === 'qa_alias_alt' && old.fuzzy === 'qa_alias_alt' && Array.isArray(old.repaired) && old.repaired.length === 2, 'T03: als Text gespeicherte Namen stören Import-Zuordnung nicht und werden repariert', JSON.stringify(old));

  // T05: umbenanntes Plan-Workout erscheint im Verlauf unter dem neuen Namen
  const ren = await page.evaluate(async () => {
    const st = Date.now() - 3600e3;
    await Store.put('workouts', 'qa_rename', { date: isoDate(), startedAt: st, endedAt: st + 1800e3, durationSec: 1800, planId: 'plan_test', planDayName: 'Beine', name: 'QA Freitag',
      entries: [{ exerciseId: 'ex_bankdruecken', sets: [{ reps: 5, weightKg: 50, done: true }] }] });
    await new Promise(r => setTimeout(r, 200));
    const row = Analytics.cur().rows.find(r => r.id === 'qa_rename');
    UI.trainSub = 'history'; App.go('training', { instant: true });
    await new Promise(r => setTimeout(r, 300));
    return { name: row && row.name, day: row && row.day, list: document.querySelector('#tab-training').innerText.includes('QA Freitag') };
  });
  check(ren.name === 'QA Freitag' && ren.day === 'Beine' && ren.list, 'T05: Verlauf zeigt den neuen Namen des Plan-Workouts', JSON.stringify(ren));

  // T06: Übungs-Report für Cardio zeigt Dauer, Distanz und Tempo statt Kraftwerten
  const pdf = await page.evaluate(async () => {
    const st = Date.now() - 7200e3;
    await Store.put('workouts', 'qa_bike', { date: isoDate(), startedAt: st, endedAt: st + 2262e3, durationSec: 2262, name: 'Rad',
      entries: [{ exerciseId: 'ex_fahrrad', sets: [{ durationSec: 2262, distKm: 17.85, done: true }] }] });
    await new Promise(r => setTimeout(r, 200));
    const ss = Analytics.sessionsOf('ex_fahrrad');
    const R = pdfReportSpec(Ex.type(Ex.get('ex_fahrrad')), ss, Store.raw('prs', 'ex_fahrrad'), cardioInfo(Ex.get('ex_fahrrad')));
    const kg = pdfReportSpec('kg', Analytics.sessionsOf('ex_bankdruecken'), null, {});
    const txt = JSON.stringify([R.boxes, R.cols, ss.map(R.row)]);
    return { txt, kgTxt: JSON.stringify([kg.boxes, Analytics.sessionsOf('ex_bankdruecken').map(kg.row)]) };
  });
  check(/37:42/.test(pdf.txt) && /17,85 km/.test(pdf.txt) && /28,4 km\/h/.test(pdf.txt) && !/undefined|NaN| kg/.test(pdf.txt), 'T06: Übungs-PDF für Cardio mit Dauer, Distanz und Tempo', pdf.txt.slice(0, 300));
  check(!/undefined|NaN/.test(pdf.kgTxt), 'T06: Übungs-PDF ohne PR-Eintrag zeigt keine „undefined"-Werte', pdf.kgTxt.slice(0, 200));

  // T07: Escape schließt nur die Auswahlliste, der Entwurf bleibt offen
  await page.evaluate(() => { App.go('exercises', { instant: true }); Actions.exNew(); });
  await pause(page, 400);
  const top = '.modal-wrap:not(.closing) .modal';
  await page.fill(top + ' input[data-f="name"]', 'QA Entwurf');
  await page.focus(top + ' .dd-btn');
  await page.keyboard.press('ArrowDown');
  await pause(page, 200);
  const ddOpen = await page.evaluate(() => !!document.querySelector('.dd-menu'));
  await page.keyboard.press('Escape');
  await pause(page, 200);
  const esc1 = await page.evaluate(() => ({ dd: !!document.querySelector('.dd-menu'), modal: Modal.count(), name: (Modal.top() && Modal.top().el.querySelector('input[data-f="name"]') || {}).value }));
  await page.keyboard.press('Escape');
  await pause(page, 400);
  const esc2 = await page.evaluate(() => Modal.count());
  check(ddOpen && !esc1.dd && esc1.modal === 1 && esc1.name === 'QA Entwurf' && esc2 === 0, 'T07: Escape schließt zuerst nur die Auswahlliste, der Entwurf bleibt erhalten', JSON.stringify({ ddOpen, esc1, esc2 }));

  // T08: Tastaturfokus bleibt im offenen Dialog
  await page.evaluate(() => { App.go('start', { instant: true }); });
  await pause(page, 300);
  await page.focus('[data-act="startSheet"]');
  await page.keyboard.press('Enter');
  await pause(page, 500);
  const trap = [];
  trap.push(await page.evaluate(() => !!Modal.top() && Modal.top().el.contains(document.activeElement)));
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate(() => Modal.top().el.contains(document.activeElement) && document.activeElement !== Modal.top().el)); }
  await page.keyboard.press('Shift+Tab');
  trap.push(await page.evaluate(() => Modal.top().el.contains(document.activeElement)));
  const inert = await page.evaluate(() => document.querySelector('#app').inert && document.querySelector('#bottomNav').inert);
  await page.keyboard.press('Escape');
  await pause(page, 400);
  const back = await page.evaluate(() => ({ inert: document.querySelector('#app').inert, focus: document.activeElement && document.activeElement.dataset.act }));
  check(trap.every(Boolean) && inert && !back.inert && back.focus === 'startSheet', 'T08: Fokus startet im Dialog, Tab bleibt darin, danach zurück zum Auslöser', JSON.stringify({ trap, inert, back }));

  // T12: Reiter mit vollständiger Tab-Struktur und Pfeiltasten
  await page.evaluate(() => { UI.trainSub = 'plans'; App.go('training', { instant: true }); });
  await pause(page, 300);
  const roles = await page.evaluate(() => {
    const out = [];
    for (const tl of document.querySelectorAll('.tab.active [role="tablist"]')) {
      const kids = [...tl.children];
      out.push(kids.length > 1 && kids.every(k => k.getAttribute('role') === 'tab' && ['true', 'false'].includes(k.getAttribute('aria-selected')) && document.getElementById(k.getAttribute('aria-controls'))));
    }
    return out;
  });
  await page.focus('.tab.active [role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await pause(page, 300);
  const arrow = await page.evaluate(() => ({ sub: UI.trainSub, focus: document.activeElement && document.activeElement.dataset.v, panel: document.querySelector('#trainBody').getAttribute('role') }));
  check(roles.length === 1 && roles.every(Boolean) && arrow.sub === 'history' && arrow.focus === 'history' && arrow.panel === 'tabpanel', 'T12: Pläne/Verlauf als vollständige Reiter, Pfeiltaste wechselt', JSON.stringify({ roles, arrow }));
  await page.evaluate(() => { UI.progSub = 'overview'; App.go('progress', { instant: true }); });
  await pause(page, 400);
  const pr = await page.evaluate(() => [...document.querySelectorAll('.prog-controls [role="tab"]')].every(k => k.hasAttribute('aria-selected') && k.getAttribute('aria-controls') === 'progBody'));
  check(pr, 'T12: Fortschritt-Bereiche ebenfalls mit vollständiger Tab-Struktur');

  // T10: Gewichtsschnelleingabe – gleiche Grenzen in kg und lb
  const bw = async (u, v) => page.evaluate(async ([u, v]) => {
    Store.saveSettings({ unit: u });
    UI.progSub = 'body'; App.go('progress', { instant: true });
    await new Promise(r => setTimeout(r, 250));
    const n0 = Store.all('progress').filter(p => p.date === isoDate()).map(p => p.bodyWeightKg).join();
    const inp = document.querySelector('#bwQuick');
    if (!inp) return 'kein Feld';
    inp.value = v; Actions.bwQuickSave();
    await new Promise(r => setTimeout(r, 150));
    const e = Store.all('progress').find(p => p.date === isoDate() && p.bodyWeightKg > 0);
    return e && Store.all('progress').filter(p => p.date === isoDate()).map(p => p.bodyWeightKg).join() !== n0 ? e.bodyWeightKg : null;
  }, [u, v]);
  const lbHi = await bw('lb', '441'), lbLo = await bw('lb', '30'), kgLo = await bw('kg', '13,61'), kgHi = await bw('kg', '200');
  check(lbHi === 200.03 && lbLo === null && kgLo === null && kgHi === 200, 'T10: 200 kg und 441 lb gelten gleich, 30 lb und 13,61 kg beide zu wenig', JSON.stringify({ lbHi, lbLo, kgLo, kgHi }));

  // T14 + T18: Körperformular weist negativen Umfang und Datum in der Zukunft zurück
  const body = async (date, w, chest) => page.evaluate(async ([date, w, chest]) => {
    Store.saveSettings({ f_measures: true });
    const n0 = Store.all('progress').length;
    Actions.bodyNew();
    await new Promise(r => setTimeout(r, 300));
    const m = Modal.top().el;
    if (date) m.querySelector('#bfDate').value = date;
    m.querySelector('#bfW').value = w;
    m.querySelector('[data-mk="chestCm"]').value = chest;
    m.querySelector('[data-x="save"]').click();
    await new Promise(r => setTimeout(r, 250));
    const open = Modal.count();
    Modal.closeAll();
    await new Promise(r => setTimeout(r, 300));
    return { added: Store.all('progress').length - n0, open };
  }, [date, w, chest]);
  const neg = await body(null, '', '-4');
  const tomorrow = await page.evaluate(() => dnToISO(todayDN() + 1));
  const fut = await body(tomorrow, '76', '');
  const ok = await body(null, '76', '98');
  check(neg.added === 0 && neg.open === 1, 'T14: negativer Umfang legt keinen leeren Eintrag an', JSON.stringify(neg));
  check(fut.added === 0 && fut.open === 1 && ok.added === 1, 'T18: Messwert mit Datum in der Zukunft wird nicht gespeichert, heute schon', JSON.stringify({ fut, ok }));

  // T15: 1RM-Rechner nennt die gewählte Formel
  const rm = [];
  for (const f of ['epley', 'brzycki', 'avg']) {
    rm.push(await page.evaluate(async f => { Store.saveSettings({ e1rmFormula: f }); open1RM(); await new Promise(r => setTimeout(r, 250)); const el = Modal.top().el; const t = el.innerText + ' ' + [...el.querySelectorAll('[data-info]')].map(b => b.dataset.info).join(' ') + (/\(Epley\)/.test(el.innerText) ? ' SICHTBAR' : ''); Modal.closeAll(); await new Promise(r => setTimeout(r, 300)); return t; }, f));
  }
  check(/Epley/.test(rm[0]) && /93,3/.test(rm[0]) && /Brzycki/.test(rm[1]) && !/Epley\)/.test(rm[1]) && /\n90 kg/.test(rm[1]) && /Mittelwert/.test(rm[2]) && /91,7/.test(rm[2]) && !rm.some(x => /SICHTBAR/.test(x)), 'T15: 1RM-Rechner nennt Epley, Brzycki und Mittelwert richtig (im ⓘ)');
  await page.evaluate(() => Store.saveSettings({ e1rmFormula: 'epley' }));

  // T16: Fotovergleich mit vertauschter Reihenfolge zeigt positiven Abstand
  const cmp = await page.evaluate(async () => {
    const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    Store.put('photos', 'qa_ph1', { date: '2026-10-01', data: px }); Store.put('photos', 'qa_ph2', { date: '2026-11-01', data: px });
    await new Promise(r => setTimeout(r, 100));
    Actions.photoCompare({ dataset: { id: 'qa_ph2' } });
    await new Promise(r => setTimeout(r, 300));
    const m = Modal.top().el, a = m.querySelector('#pcA'), b = m.querySelector('#pcB');
    a.value = 'qa_ph2'; a.dispatchEvent(new Event('change', { bubbles: true }));
    m.querySelector('#pcB').value = 'qa_ph1'; m.querySelector('#pcB').dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const t = Modal.top().el.innerText.match(/[−-]?\d+ Tage? Unterschied/);
    Modal.closeAll();
    Store.del('photos', 'qa_ph1'); Store.del('photos', 'qa_ph2');
    return t && t[0];
  });
  check(cmp === '31 Tage Unterschied', 'T16: vertauschte Vergleichsfotos zeigen „31 Tage Unterschied"', cmp);

  // T02 + T04: Ruhepuls allein zählt als Gasteingabe; Abmelden entfernt den Profilnamen, das Design bleibt
  const out = await page.evaluate(async () => {
    Store.saveSettings({ displayName: 'QA offline', birthYear: 1990, design: 'pure' });
    Store.detach();
    await new Promise(r => setTimeout(r, 400));
    const s = JSON.parse(localStorage.getItem(LS.settings) || '{}');
    Store.put('heart', 'qa_rhr', { date: isoDate(), rhr: 63, rhrM: 'tap', updatedAt: Date.now() });
    const heartOnly = Store.hasUserData();
    return { name: S().displayName, by: S().birthYear, design: S().design, lsName: s.displayName, heartOnly };
  });
  check(out.name === '' && out.by === null && out.lsName === '' && out.design === 'pure', 'T04: nach dem Abmelden ist der Profilname vom Gerät entfernt, das Design bleibt', JSON.stringify(out));
  check(out.heartOnly, 'T02: ein gespeicherter Ruhepuls allein löst die Übernahme-Rückfrage aus', JSON.stringify(out));
  await page.evaluate(() => Store.saveSettings({ design: 'gymlog' }));
  check(!page.errors.length, 'keine JavaScript-Fehler bei den Befund-Prüfungen', page.errors.join(' | '));
  const logged = await appErrors(page);
  check(!logged.length, 'Fehlerprotokoll bleibt leer', logged.join(' | '));
}

/** Weniger Kleintext: entfernte Hinweise bleiben weg, Wichtiges (Dauer, Volumen, Ziele, Erklärungen im ⓘ) bleibt */
async function kleintextFlow(page) {
  console.log('Weniger Kleintext');
  await page.evaluate(() => {
    Store.saveSettings({ motion: 'off', woView: 'list' });
    Store.put('templates', 'k_tpl', { name: 'K-Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '6-8', restSec: 90 }], createdAt: Date.now() });
    Store.put('plans', 'k_plan', { name: 'K-Plan', schedule: ['k_tpl', null, 'k_tpl', null, null, null, null], createdAt: Date.now() });
    Store.saveSettings({ activePlanId: 'k_plan' });
    const st = Date.now() - 3 * 864e5;
    Store.put('workouts', 'k_w1', { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'K-Push', templateId: 'k_tpl',
      entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 80, rpe: 8, done: true }, { reps: 7, weightKg: 80, rpe: 9, done: true }] }] });
    PR.recalcAll();
    App.go('start', { instant: true });
  });
  await pause(page, 400);
  const start = await page.evaluate(() => { const t = document.querySelector('#tab-start').innerText; const mw = (document.querySelector('#tab-start .mw-stats') || {}).innerText || '';
    return { seit: /seit \w+\.? \d{4}/.test(t), plan: [...document.querySelectorAll('#tab-start .stat-sub')].some(e => e.textContent.includes('K-Plan')), mw }; });
  check(!start.seit && !start.plan && /min/.test(start.mw) && !/Sätze|RPE/.test(start.mw), 'Startseite: kein „seit …“, kein Planname, Workout-Zeile nur Dauer und Volumen', JSON.stringify(start));
  await page.evaluate(() => { UI.trainSub = 'plans'; App.go('training', { instant: true }); });
  await pause(page, 300);
  const pl = await page.evaluate(() => ({ tage: /\d Trainingstage/.test(document.querySelector('#tab-training').innerText), ex: !!document.querySelector('#tab-training .tpl-ex') }));
  check(!pl.tage && !pl.ex, 'Pläne: keine „Trainingstage“-Zahl, keine Übungsliste in den Workout-Karten', JSON.stringify(pl));
  await page.evaluate(() => { Workout.start({ templateId: 'k_tpl' }); App.go('training', { instant: true }); });
  await pause(page, 300);
  const wo = await page.evaluate(() => ({ last: /Letztes Mal/.test(document.querySelector('#tab-training').innerText), ph: document.querySelector('#tab-training [data-in="setW"][data-si="0"]').placeholder }));
  check(!wo.last && wo.ph === '80', 'Workout: keine „Letztes Mal“-Zeile, die Werte stehen grau im Feld', JSON.stringify(wo));
  await page.evaluate(() => { Store.saveSettings({ woView: 'focus' }); App.renderCurrent(); });
  await pause(page, 300);
  const fo = await page.evaluate(() => document.querySelector('#tab-training').innerText);
  check(!/Letztes Mal|geplant/.test(fo), 'Fokus: kein „Letztes Mal“, kein „Sätze geplant“', fo.slice(0, 160));
  await page.evaluate(() => { Store.saveSettings({ woView: 'list' }); Workout.discard(); openWorkoutDetail('k_w1'); });
  await pause(page, 500);
  const sc = await page.evaluate(() => { const m = document.querySelector('.modal-wrap:not(.closing) .modal'); const more = m.querySelector('.score-more'); return { hidden: more ? more.hidden : null, ring: !!m.querySelector('button.score-ring') }; });
  if (sc.ring) {
    await page.click('.modal-wrap:not(.closing) .score-toggle');
    const sc2 = await page.evaluate(() => { const m = document.querySelector('.modal-wrap:not(.closing) .modal'); return { hidden: m.querySelector('.score-more').hidden, exp: m.querySelector('.score-ring').getAttribute('aria-expanded') + '/' + m.querySelector('.score-toggle').getAttribute('aria-expanded'), clean: m.querySelector('.score-ring .score-mid').children.length === 1, bonus: /e1RM-Bonus/.test(m.innerText) }; });
    check(sc.hidden === true && sc2.hidden === false && sc2.exp === 'true/true' && sc2.clean && sc2.bonus, 'Workout-Score: Ring nur mit Zahl, Pfeil darunter klappt die Aufschlüsselung auf', JSON.stringify({ sc, sc2 }));
  } else check(true, 'Workout-Score aus – keine Aufschlüsselung');
  await page.evaluate(() => { Modal.closeAll(); openExerciseDetail('ex_bankdruecken'); });
  await pause(page, 500);
  const ex = await page.evaluate(() => document.querySelector('.modal-wrap:not(.closing) .modal').innerText);
  check(!/pro Session|erscheint in jedem Workout/.test(ex) && /Notiz hinzufügen/.test(ex), 'Übung: kein „pro Session“, Notiz-Knopf kurz', ex.slice(0, 200));
  await page.evaluate(() => { Modal.closeAll(); App.go('exercises', { instant: true }); });
  await pause(page, 400);
  check(!/noch nie/.test(await page.evaluate(() => document.querySelector('#tab-exercises').innerText)), 'Übungsliste: kein „noch nie“ bei unbenutzten Übungen');
  await page.evaluate(() => { UI.progSub = 'overview'; App.go('progress', { instant: true }); });
  await pause(page, 500);
  const pg = await page.evaluate(() => ({ t: document.querySelector('#tab-progress').innerText, info: [...document.querySelectorAll('#tab-progress [data-info]')].map(b => b.dataset.info).join(' ') }));
  check(!/heute zählt, sobald|\(11 W\)|aktueller e1RM-PR|vs\. Vorperiode/.test(pg.t) && /Ganze Vorwoche/.test(pg.info), 'Fortschritt: Fußnoten im ⓘ, kein „(11 W)“, kein „vs. Vorperiode“', pg.t.slice(0, 120));
  // Runde 2: alle Seiten
  const r2 = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const txt = q => (document.querySelector(q) || {}).innerText || '';
    const info = q => [...document.querySelectorAll(q + ' [data-info]')].map(b => b.dataset.info).join(' ');
    const out = {};
    Modal.closeAll(); App.go('start', { instant: true }); await wait(150);
    out.start = !/Tage diese Woche/.test(txt('#tab-start'));
    UI.trainSub = 'plans'; App.go('training', { instant: true }); await wait(150);
    out.plaene = !/Übungen · \d+ Sätze/.test(txt('#tab-training')) && /ca\. \d+ min/.test(txt('#tab-training'));
    UI.progSub = 'overview'; App.go('progress', { instant: true }); App.renderCurrent(); await wait(300);
    const pt = txt('#tab-progress');
    out.fortschritt = !/diese Woche \d+\/\d+ Tage|Soll bis heute \(|Stufen erreicht ·/.test(pt) && /Soll bis heute: /.test(info('#tab-progress')) && !document.querySelector('.gh-legend, .ms-legend');
    App.go('exercises', { instant: true }); await wait(200);
    out.uebungen = !/^\d+ Übungen$/m.test(txt('#tab-exercises'));
    App.go('more', { instant: true }); await wait(150);
    out.mehr = !/Workouts · \d+ Übungen/.test(txt('#tab-more'));
    Actions.openWarmupCfg(); await wait(250);
    out.aufwaermen = !/bei 100 kg/.test(txt('.modal-wrap:not(.closing) .modal'));
    Modal.closeAll(); await wait(300);
    open1RM(); await wait(250);
    out.rm = !/\(Epley/.test(txt('.modal-wrap:not(.closing) .modal'));
    Modal.closeAll(); await wait(300);
    goalDialog('ex_bankdruecken'); await wait(250);
    const gk = document.querySelector('#gKg').value, gh = document.querySelector('#gHint').textContent;
    out.kraftziel = !/\./.test(gk) && !/Erreicht, sobald/.test(gh) && /Bisher/.test(gh) && /Erreicht, sobald/.test(info('.modal-wrap:not(.closing) .modal'));
    Modal.closeAll(); await wait(300);
    // Kacheln: ohne RPE drei nebeneinander, Dauer kurz; mit RPE vier; ungerade → letzte breit
    openWorkoutDetail('k_w1'); await wait(400);
    const g1 = document.querySelector('.modal-wrap:not(.closing) .modal .pr-grid');
    out.detailMitRpe = g1.children.length === 4 && !g1.classList.contains('n3') && /Ø RPE/.test(g1.innerText);
    const rpeTh = () => [...document.querySelectorAll('.modal-wrap:not(.closing) .modal .tbl th')].some(th => th.textContent === 'RPE');
    out.rpeSpalteMit = rpeTh();
    Modal.closeAll(); await wait(300);
    Store.put('workouts', 'k_w2', { date: isoDate(new Date(Date.now() - 864e5)), startedAt: Date.now() - 864e5, durationSec: 3840, name: 'K-Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 80, done: true }] }] });
    openWorkoutDetail('k_w2'); await wait(400);
    const g2 = document.querySelector('.modal-wrap:not(.closing) .modal .pr-grid');
    out.detailOhneRpe = g2.children.length === 3 && g2.classList.contains('n3') && !/Ø RPE/.test(g2.innerText) && /64 min/.test(g2.innerText) && getComputedStyle(g2).gridTemplateColumns.split(' ').length === 3;
    // ohne eingetragenes RPE keine leere RPE-Spalte in der Satz-Tabelle
    out.rpeSpalteOhne = !rpeTh() && document.querySelector('.modal-wrap:not(.closing) .modal .tbl tbody tr').children.length === document.querySelector('.modal-wrap:not(.closing) .modal .tbl thead tr').children.length;
    // Text in den Kacheln zentriert – auch bei der bearbeitbaren Dauer mit Stift
    out.zentriert = [...g2.children].every(b => getComputedStyle(b).textAlign === 'center') && getComputedStyle(g2.querySelector('.wd-edit span')).justifyContent === 'center';
    Modal.closeAll(); await wait(300);
    const t5 = document.createElement('div'); t5.innerHTML = prTiles([['A', 1], ['B', 2], ['C', 3], ['D', 4], ['E', 5]]); document.body.append(t5);
    const last = t5.querySelector('.pr-grid').lastElementChild, first = t5.querySelector('.pr-grid').firstElementChild;
    out.fuenfKacheln = t5.querySelector('.pr-grid.odd') && Math.round(last.getBoundingClientRect().width) > Math.round(first.getBoundingClientRect().width) * 1.8;
    t5.remove();
    // Pausen-Leiste: kein Wort „Pause", Vorlesetext bleibt
    Store.saveSettings({ autoRest: true, woView: 'list' });
    Workout.start({ templateId: 'k_tpl' }); App.go('training', { instant: true }); await wait(200);
    Workout.set(w => Object.assign(w.entries[0].sets[0], { weightKg: 80, reps: 8 })); App.renderCurrent();
    [...document.querySelectorAll('#tab-training [data-act="setDone"]')].find(n => n.offsetParent).click(); await wait(400);
    const dock = document.querySelector('.rest-dock');
    out.pause = !!dock && !/^Pause/.test(dock.querySelector('.rest-label').innerText) && dock.getAttribute('aria-label') === 'Pause' && /\d:\d\d/.test(dock.innerText);
    Store.saveSettings({ woView: 'focus' }); App.renderCurrent(); await wait(150);
    out.einSatz = !!document.querySelector('#tab-training .ex-sum') && !/\d+\/\d+/.test(txt('#tab-training .ex-sum'));
    Workout.discard(); Store.saveSettings({ woView: 'list' }); App.renderCurrent();
    return out;
  });
  const r2bad = Object.entries(r2).filter(([, v]) => !v).map(([k]) => k);
  check(!r2bad.length, 'Weniger Kleintext, Runde 2: Start, Pläne, Fortschritt, Listen, Fenster, Pausen-Leiste', 'nicht erfüllt: ' + r2bad.join(', '));
  check(r2.detailOhneRpe && r2.detailMitRpe && r2.fuenfKacheln && r2.zentriert && r2.rpeSpalteMit && r2.rpeSpalteOhne, 'Kacheln: ohne RPE drei nebeneinander („64 min“), mit RPE vier, ungerade Zahl → letzte über die ganze Breite, Text zentriert; RPE-Spalte nur mit RPE', JSON.stringify(r2));
  await page.evaluate(() => { Modal.closeAll(); App.go('start', { instant: true }); });
  check(!page.errors.length && !(await appErrors(page)).length, 'keine JavaScript-Fehler mit weniger Kleintext', page.errors.concat(await appErrors(page)).join(' | '));
}

/** Rückgängig statt Rückfrage: Löschen passiert sofort, „Rückgängig“ in der Meldung stellt alles genau wieder her */
async function rueckgaengigFlow(page) {
  console.log('Rückgängig statt Rückfrage');
  const dlg = () => page.evaluate(() => !!document.querySelector('.modal.alert, .modal-wrap:not(.closing) .modal [data-x="ok"][class*="danger"]'));
  const undo = async () => { await page.click('#toastRoot .toast:last-child .t-act'); await pause(page, 250); };
  const del = async () => { await page.click('.modal-wrap:not(.closing) .modal [data-x="del"]'); await pause(page, 300); };
  const pick = k => page.evaluate(k => { window.__am = window.actionMenu; window.actionMenu = async () => { window.actionMenu = window.__am; return k; }; }, k);
  await page.evaluate(() => {
    Store.saveSettings({ motion: 'off' });
    Store.put('templates', 'u_tpl', { name: 'U-Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '6', restSec: 90 }, { exerciseId: 'ex_u', sets: 2, reps: '10', restSec: 60 }], createdAt: Date.now() });
    Store.put('exercises', 'ex_u', { name: 'U-Übung', muscle: 'Brust', equipment: 'Kurzhantel', custom: true });
    Store.put('plans', 'u_plan', { name: 'U-Plan', schedule: ['u_tpl', null, null, null, null, null, null], createdAt: Date.now() });
    Store.saveSettings({ activePlanId: 'u_plan' });
    Store.put('workouts', 'u_wo', { date: isoDate(), startedAt: Date.now() - 3600e3, durationSec: 3000, name: 'U-Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 3, weightKg: 300, done: true }] }] });
    PR.recalcAll();
    Store.put('photos', 'u_ph', { data: 'data:image/png;base64,iVBORw0KGgo=' });
    Store.put('progress', 'u_bw', { date: isoDate(), weightKg: 80, photoId: 'u_ph' });
    Store.put('heart', 'u_h', { date: isoDate(), rhr: 55 });
    App.go('training', { instant: true });
  });
  await pause(page, 300);
  const json = (c, id) => page.evaluate(([c, id]) => JSON.stringify(Store.raw(c, id)), [c, id]);

  // Workout (Vorlage) – mit Plan-Tag
  const tpl0 = await json('templates', 'u_tpl'), plan0 = await json('plans', 'u_plan');
  await pick('del'); await page.evaluate(() => Actions.tplMenu({ dataset: { id: 'u_tpl' } })); await pause(page, 250);
  const gone = await page.evaluate(() => ({ t: !Store.raw('templates', 'u_tpl'), day: Store.raw('plans', 'u_plan').schedule[0] }));
  check(gone.t && gone.day === null && !await dlg(), 'Workout löschen: sofort weg, Plan-Tag wird Ruhetag, keine Rückfrage', JSON.stringify(gone));
  await undo();
  check(await json('templates', 'u_tpl') === tpl0 && await json('plans', 'u_plan') === plan0, 'Rückgängig: Workout und Plan-Tag genau wie vorher');

  // Plan – aktiver Plan
  await pick('del'); await page.evaluate(() => Actions.planMenu({ dataset: { id: 'u_plan' } })); await pause(page, 250);
  check(!await json('plans', 'u_plan').then(j => JSON.parse(j)) && await page.evaluate(() => S().activePlanId !== 'u_plan'), 'Plan löschen: sofort weg, aktiver Plan wechselt');
  await undo();
  check(await json('plans', 'u_plan') === plan0 && await page.evaluate(() => S().activePlanId === 'u_plan'), 'Rückgängig: Plan wieder da und wieder aktiv');

  // Workout im Verlauf – PRs
  await pause(page, 300);
  const pr0 = await json('prs', 'ex_bankdruecken');
  await page.evaluate(() => openWorkoutDetail('u_wo')); await pause(page, 400);
  await del();
  await pause(page, 300);
  const wo1 = await page.evaluate(() => ({ gone: !Store.raw('workouts', 'u_wo'), modal: !!document.querySelector('.modal-wrap:not(.closing)') }));
  const prDel = await json('prs', 'ex_bankdruecken');
  check(wo1.gone && !wo1.modal && pr0.includes('300') && prDel !== pr0, 'Workout im Verlauf löschen: sofort weg, Fenster zu, 300-kg-Bestwert verschwindet', JSON.stringify(wo1));
  await undo();
  await pause(page, 300);
  const pr1 = await json('prs', 'ex_bankdruecken');
  { const a = JSON.parse(pr0), b = JSON.parse(pr1); const diff = Object.keys({ ...a, ...b }).filter(k => k !== 'updatedAt' && JSON.stringify(a[k]) !== JSON.stringify(b[k])); check(!!JSON.parse(await json('workouts', 'u_wo')) && !diff.length, 'Rückgängig: Workout wieder im Verlauf, Bestwert wieder genau wie vorher', diff.map(k => k + ': ' + JSON.stringify(a[k]) + ' → ' + JSON.stringify(b[k])).join(' · ')); }

  // Übung aus der Bibliothek – auch aus dem Workout entfernt
  await page.evaluate(() => openExerciseDetail('ex_u')); await pause(page, 400);
  await del();
  check(!JSON.parse(await json('exercises', 'ex_u')) && !JSON.parse(await json('templates', 'u_tpl')).exercises.some(x => x.exerciseId === 'ex_u'), 'Übung löschen: aus Bibliothek und Workout entfernt');
  await undo();
  check(!!JSON.parse(await json('exercises', 'ex_u')) && await json('templates', 'u_tpl') === tpl0, 'Rückgängig: Übung und Workout wieder vollständig');

  // Körper-Eintrag mit Foto
  const ph0 = await json('photos', 'u_ph');
  await page.evaluate(() => openBodyForm(Store.raw('progress', 'u_bw'))); await pause(page, 400);
  await del();
  check(!JSON.parse(await json('progress', 'u_bw')) && !JSON.parse(await json('photos', 'u_ph')), 'Körper-Eintrag löschen: Eintrag und Foto weg');
  await undo();
  check(!!JSON.parse(await json('progress', 'u_bw')) && await json('photos', 'u_ph') === ph0, 'Rückgängig: Eintrag samt Foto wieder da');

  // Phase
  await page.evaluate(() => Store.saveSettings({ phases: [{ id: 'u_phase', name: 'U-Bulk', type: 'bulk', from: isoDate(new Date(Date.now() - 20 * 864e5)), to: '' }] }));
  const ph = await page.evaluate(() => JSON.stringify(S().phases));
  await page.evaluate(() => Actions.phaseEdit({ dataset: { id: 'u_phase' } })); await pause(page, 400);
  await del();
  check(await page.evaluate(() => !(S().phases || []).length), 'Phase löschen: sofort weg');
  await undo();
  check(await page.evaluate(() => JSON.stringify(S().phases)) === ph, 'Rückgängig: Phase wieder da');

  // Herz: Eintrag in der Liste, Herz-Plan
  await page.evaluate(() => Heart.history()); await pause(page, 400);
  await page.click('.modal-wrap:not(.closing) [data-del="u_h"]'); await pause(page, 250);
  check(!JSON.parse(await json('heart', 'u_h')) && !await page.$('.modal-wrap:not(.closing) [data-del="u_h"]'), 'Ruhepuls-Eintrag löschen: aus Liste und Daten weg');
  await undo();
  check(!!JSON.parse(await json('heart', 'u_h')) && !!await page.$('.modal-wrap:not(.closing) [data-del="u_h"]'), 'Rückgängig: Eintrag wieder in Daten und Liste');
  await page.evaluate(() => Modal.closeAll()); await pause(page, 300);
  await page.evaluate(() => Store.saveSettings({ heartPlan: { sessions: 3, hard: 1, z2: 90, rhrGoal: 52, vo2Goal: null } }));
  await page.evaluate(() => Heart.planEdit()); await pause(page, 400);
  await page.click('.modal-wrap:not(.closing) [data-x="off"]'); await pause(page, 300);
  check(await page.evaluate(() => !S().heartPlan) && !await dlg(), 'Herz-Plan beenden: sofort, ohne Rückfrage');
  await undo();
  check(await page.evaluate(() => S().heartPlan && S().heartPlan.rhrGoal === 52), 'Rückgängig: Herz-Plan wieder aktiv');

  // Darstellung zurücksetzen
  await page.evaluate(() => Store.saveSettings({ design: 'pure', theme: 'dark' }));
  await page.evaluate(() => Actions.lookReset()); await pause(page, 400);
  check(await page.evaluate(() => S().design === DEFAULT_SETTINGS.design), 'Darstellung zurücksetzen: sofort Standard');
  await undo(); await pause(page, 300);
  check(await page.evaluate(() => S().design === 'pure' && S().theme === 'dark'), 'Rückgängig: Design wieder wie vorher');

  // Im Workout: Übung mit erledigtem Satz entfernen, Workout abbrechen
  await page.evaluate(() => { Workout.start({ templateId: 'u_tpl' }); Workout.set(w => { w.entries[0].sets[0] = { ...w.entries[0].sets[0], weightKg: 60, reps: 8, done: true }; }); App.go('training', { instant: true }); });
  await pause(page, 300);
  await pick('del'); await page.evaluate(() => Actions.exMenu({ dataset: { ei: 0 } })); await pause(page, 300);
  check(await page.evaluate(() => Workout.cur().entries.length === 1) && !await dlg(), 'Übung mit erledigtem Satz entfernen: sofort, ohne Rückfrage');
  await undo();
  check(await page.evaluate(() => { const e = Workout.cur().entries; return e.length === 2 && e[0].exerciseId === 'ex_bankdruecken' && e[0].sets[0].done && e[0].sets[0].weightKg === 60; }), 'Rückgängig: Übung an alter Stelle, erledigter Satz bleibt');
  const w0 = await page.evaluate(() => JSON.stringify(Workout.cur()));
  await page.evaluate(() => Actions.woCancel()); await pause(page, 300);
  check(await page.evaluate(() => !Workout.cur()) && !await dlg(), 'Workout abbrechen: sofort, ohne Rückfrage');
  await undo();
  check(await page.evaluate(() => JSON.stringify(Workout.cur())) === w0 && await page.evaluate(() => App.tab === 'training'), 'Rückgängig: Workout genau wie vorher, zurück im Training');
  await page.evaluate(() => Workout.discard());

  // Unumkehrbares fragt weiter nach
  await page.evaluate(() => { Actions.deleteAll(); });
  const wipe = await page.evaluate(() => typeof Actions.deleteAll);
  if (wipe === 'function') { await pause(page, 300); check(await page.evaluate(() => !!document.querySelector('.modal.alert, .modal-wrap:not(.closing) .modal')), '„Alle Daten löschen“ fragt weiterhin nach'); await page.evaluate(() => Modal.closeAll()); }
  check(!page.errors.length && !(await appErrors(page)).length, 'keine JavaScript-Fehler bei Rückgängig', page.errors.concat(await appErrors(page)).join(' | '));
}

/** Eigene Zahlentastatur im Workout (Touch): Tippen, ±, Weiter → Abhaken, Sonderfälle, Ausschalten */
async function tastaturFlow(page) {
  console.log('Zahlentastatur (Touch, 390 × 844)');
  const cardio = await page.evaluate(() => Store.all('exercises').find(e => Ex.type(e) === 'cardio').id);
  await page.evaluate(cardio => {
    Store.put('templates', 'tkp', { name: 'Tastatur', exercises: [
      { exerciseId: 'ex_bankdruecken', sets: 2, reps: '6-8', restSec: 90 }, { exerciseId: 'ex_seitheben', sets: 2, reps: '10', restSec: 60 },
      { exerciseId: cardio, sets: 1, reps: '', restSec: 0 }], createdAt: Date.now() });
    Store.saveSettings({ motion: 'off', woView: 'list', woCollapse: false, toast_workout: false, finishConfirm: 'never' });
    if (Workout.cur()) Workout.discard();
    Workout.start({ templateId: 'tkp' });
    Workout.set(w => { w.entries[1].uni = true; });
    App.go('training', { instant: true });
  }, cardio);
  await pause(page, 400);
  const st = () => page.evaluate(() => ({ open: Keypad.isOpen(), f: Keypad.target && Keypad.target.dataset.in, ei: Keypad.target && +Keypad.target.dataset.ei,
    si: Keypad.target && +Keypad.target.dataset.si, val: Keypad.target && Keypad.target.value, go: (document.querySelector('#numpad [data-k="go"]') || {}).textContent,
    plus: (document.querySelector('#numpad [data-k="plus"]') || {}).textContent, sep: (document.querySelector('#numpad [data-k="sep"]') || {}).textContent }));
  const key = async (...ks) => { for (const k of ks) await page.tap(`#numpad [data-k="${k}"]`); };
  const fld = (f, ei, si) => `#tab-training [data-in="${f}"][data-ei="${ei}"][data-si="${si}"]`;
  const im = await page.evaluate(() => [...document.querySelectorAll('#tab-training input[data-in^="set"], #tab-training input[data-in^="cd"]')].filter(i => i.dataset.in !== 'cdHr').map(i => i.inputMode));
  check(im.length > 5 && im.every(m => m === 'none'), 'Tastatur: Satzfelder öffnen nicht die Handy-Tastatur (inputmode none)', im.join(','));

  // Ein Satz komplett über die Tastatur
  await page.tap(fld('setW', 0, 0));
  await pause(page, 300);
  let s = await st();
  const vis = await page.evaluate(() => { const r = Keypad.target.getBoundingClientRect(), k = document.querySelector('#numpad').getBoundingClientRect(); return r.bottom <= k.top && r.top > 0; });
  check(s.open && s.f === 'setW' && s.plus === '+2,5' && /Weiter/.test(s.go) && vis, 'Tastatur öffnet am Gewicht (+2,5, „Weiter“), Feld bleibt darüber sichtbar', JSON.stringify(s));
  await key('8', '2', 'sep', '5');
  s = await st();
  check(s.val === '82,5' && await page.evaluate(() => Workout.cur().entries[0].sets[0].weightKg === 82.5), 'Tastatur: 82,5 getippt und gespeichert', JSON.stringify(s));
  await key('plus');
  check((await st()).val === '85', 'Tastatur: +2,5 → 85');
  await key('sep', '5', 'sep', '2', '5', '9');
  check((await st()).val === '0,52', 'Tastatur: erster Tipp ersetzt, Komma nur einmal, höchstens 2 Nachkommastellen', (await st()).val);
  await key('back', 'back', 'back', 'back', '0', '8', '0');
  check((await st()).val === '80', 'Tastatur: ⌫ und führende 0', (await st()).val);
  await key('go');
  s = await st();
  check(s.f === 'setB' && /Abhaken/.test(s.go) && s.plus === '+1' && s.sep === '', 'Weiter → Wdh. (±1, kein Komma), Taste heißt jetzt „Abhaken“', JSON.stringify(s));
  await key('6', 'go');
  await pause(page, 300);
  const d0 = await page.evaluate(() => Workout.cur().entries[0].sets[0]);
  s = await st();
  check(d0.done && d0.weightKg === 80 && d0.reps === 6 && s.open && s.ei === 0 && s.si === 1 && s.f === 'setW', 'Abhaken: 80 × 6 erledigt, Tastatur springt in Satz 2', JSON.stringify({ d0, s }));
  const dock = await page.evaluate(() => { const d = document.querySelector('.rest-dock'), k = document.querySelector('#numpad'); return !!d && d.getBoundingClientRect().bottom <= k.getBoundingClientRect().top + 1; });
  check(dock, 'Pausen-Leiste sitzt über der Tastatur');

  // Pflichtfeld fehlt
  await key('back', 'back', 'back', 'back');
  await page.tap(fld('setW', 0, 1));
  await page.evaluate(() => { Workout.cur().entries[0].sets[1].weightKg = null; });
  await page.tap(fld('setB', 0, 1));
  await key('5', 'go');
  await pause(page, 250);
  s = await st();
  check(!(await page.evaluate(() => Workout.cur().entries[0].sets[1].done)) && s.open && s.f === 'setW' && s.si === 1, 'Ohne Gewicht: nicht abgehakt, Tastatur springt ins Gewicht', JSON.stringify(s));

  // Links/Rechts
  await page.tap(fld('setW', 1, 0));
  await key('1', '0', 'go', '1', '2', 'go');
  s = await st();
  check(s.f === 'setBR' && /Abhaken/.test(s.go), 'Links/Rechts: Gewicht → links → rechts', JSON.stringify(s));
  await key('1', '1', 'go');
  await pause(page, 250);
  const u = await page.evaluate(() => Workout.cur().entries[1].sets[0]);
  check(u.done && u.reps === 12 && u.repsR === 11, 'Links/Rechts über die Tastatur abgehakt (12/11)', JSON.stringify(u));

  // Cardio: Doppelpunkt und ±1 min
  await page.tap(fld('cdDur', 2, 0));
  s = await st();
  await key('3', '0', 'sep', '1', '5', 'plus');
  const cd = await page.evaluate(() => Workout.cur().entries[2].sets[0].durationSec);
  check(s.sep === ':' && s.plus === '+1 min' && cd === 1875, 'Cardio: 30:15 getippt, +1 min → 31:15', JSON.stringify({ s, cd }));

  // Tipp daneben schließt, Haken in der Zeile trifft
  await page.tap(fld('setW', 0, 1));
  await key('6', '0');
  await page.tap(fld('setB', 0, 1));
  await key('5');
  await page.tap('#tab-training [data-act="setDone"][data-ei="0"][data-si="1"]');
  await pause(page, 450);
  const d1 = await page.evaluate(() => ({ done: Workout.cur().entries[0].sets[1].done, open: Keypad.isOpen() }));
  check(d1.done && !d1.open, 'Haken in der Zeile bei offener Tastatur: abgehakt, Tastatur zu', JSON.stringify(d1));

  // Fokus-Ansicht
  await page.evaluate(() => { Store.saveSettings({ woView: 'focus' }); Workout.set(w => { w.focusE = 1; w.sel = { e: 1, s: 1 }; }); App.renderCurrent(); });
  await pause(page, 300);
  await page.tap('#tab-training .fc-cur [data-in="setW"]');
  await key('1', '2', 'go', '1', '0', 'go', '9', 'go');
  // Übung fertig → nächste Übung: die Pausen-Leiste gleitet sofort mit der Tastatur nach unten, statt kurz „Satz erledigt“ zu verdecken
  const fd = await page.evaluate(() => { const w = Workout.cur(), d = document.querySelector('.rest-dock:not(.leaving)'), q = `[data-ei="${w.sel.e}"][data-si="${w.sel.s}"]`;
    const b = [...document.querySelectorAll(`#tab-training [data-act="setDone"]${q}`)].find(n => n.offsetParent);
    return { e: w.sel.e, raised: !!d && parseFloat(getComputedStyle(d).bottom) >= document.querySelector('#numpad').offsetHeight, dock: d ? Math.round(parseFloat(getComputedStyle(d).bottom)) : null, btn: b ? Math.round(b.getBoundingClientRect().bottom) : null, top: d ? Math.round(innerHeight - parseFloat(getComputedStyle(d).bottom) - d.offsetHeight) : null }; });
  check(fd.e === 2 && !fd.raised && fd.dock != null && (fd.btn == null || fd.btn <= fd.top), 'Fokus: nach dem Übungswechsel geht die Pausen-Leiste gleich mit der Tastatur nach unten', JSON.stringify(fd));
  await pause(page, 300);
  const f1 = await page.evaluate(() => Workout.cur().entries[1].sets[1]);
  check(f1.done && f1.weightKg === 12 && f1.reps === 10 && f1.repsR === 9, 'Fokus-Ansicht: Satz über die Tastatur abgehakt', JSON.stringify(f1));

  // Volle Animationen: Feld weit unten steht nach dem Hereinfedern über der Tastatur (nicht aus der Zwischenlage
  // gerechnet); kurz ziehen federt zurück ohne Tastendruck, weit nach unten wischen schließt
  await page.evaluate(() => { Keypad.close(); Store.saveSettings({ motion: 'full', woView: 'list' }); App.renderCurrent(); });
  await pause(page, 500);
  await page.evaluate(() => document.querySelector('#tab-training [data-in="cdDur"]').scrollIntoView({ block: 'end' }));
  await pause(page, 200);
  await page.tap('#tab-training [data-in="cdDur"]');
  await pause(page, 800);
  const anim = await page.evaluate(() => { const r = Keypad.target.closest('.set-row').getBoundingClientRect(), kp = document.querySelector('#numpad');
    return { row: Math.round(r.bottom), kpTop: Math.round(kp.getBoundingClientRect().top), end: innerHeight - kp.offsetHeight, v: Keypad.target.value }; });
  check(anim.row <= anim.kpTop && anim.kpTop === anim.end, 'Volle Animationen: Tastatur federt herein, Feld weit unten steht danach darüber', JSON.stringify(anim));
  const cdp = page.cdp || (page.cdp = await page.context().newCDPSession(page));
  const drag = async (dy, steps) => {
    const tp = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 120, y }] });
    await tp('touchStart', 640);
    for (let k = 1; k <= steps; k++) { await tp('touchMove', 640 + dy * k / steps); await page.waitForTimeout(30); }
    await tp('touchEnd');
    await pause(page, 600);
  };
  await drag(40, 5);
  const back = await page.evaluate(v => ({ open: Keypad.isOpen(), same: Keypad.target.value === v, tf: getComputedStyle(document.querySelector('#numpad')).transform }), anim.v);
  check(back.open && back.same && back.tf === 'none', 'Kurz nach unten ziehen: Tastatur federt zurück, nichts wird getippt', JSON.stringify(back));
  await drag(160, 10);
  check(!(await page.evaluate(() => Keypad.isOpen())), 'Weit nach unten wischen schließt die Tastatur');
  await page.evaluate(() => Store.saveSettings({ motion: 'off' }));

  // Ausschalten
  await page.evaluate(() => { Keypad.close(); Store.saveSettings({ numpad: false, woView: 'list' }); App.renderCurrent(); });
  await pause(page, 300);
  await page.tap(fld('setW', 0, 0));
  const off = await page.evaluate(() => ({ im: document.querySelector('#tab-training [data-in="setW"]').inputMode, open: Keypad.isOpen() }));
  check(off.im === 'decimal' && !off.open, 'Ausgeschaltet (Mehr → Workout): normale Handy-Tastatur', JSON.stringify(off));
  await page.evaluate(() => { Store.saveSettings({ numpad: true }); Workout.discard(); });
  check(!page.errors.length && !(await appErrors(page)).length, 'keine JavaScript-Fehler mit der Zahlentastatur', page.errors.concat(await appErrors(page)).join(' | '));
}

/** T13: 320 px breit, Text XL, Dichte luftig, hoher Kontrast – in jedem Design ragt nichts über den Rand */
async function schmalFlow(page) {
  console.log('Schmales Display (320 × 700, Text XL)');
  await page.goto(new URL(page.url()).origin + '/test/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('.tab.active') && document.querySelector('.tab.active').innerText.trim());
  await pause(page, 500);
  const bad = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    const views = [['training', () => { UI.trainSub = 'plans'; App.go('training', { instant: true }); }], ['verlauf', () => { UI.trainSub = 'history'; App.go('training', { instant: true }); }],
      ['fortschritt', () => { UI.progSub = 'overview'; App.go('progress', { instant: true }); }], ['start', () => App.go('start', { instant: true })], ['mehr', () => App.go('more', { instant: true })]];
    for (const d of DESIGNS) {
      for (const m of d.phased ? ['dark'] : ['light', 'dark']) {
        Store.saveSettings({ motion: 'off', design: d.id, theme: m, textSize: 'xl', density: 'comfy', contrast: true });
        applyTheme();
        for (const [name, go] of views) {
          go(); await wait(160);
          const v = document.querySelector('#view'), vw = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth > vw || v.scrollWidth > v.clientWidth + 1) out.push(`${d.id}·${m} ${name}: ${v.scrollWidth}/${v.clientWidth}`);
        }
      }
    }
    Store.saveSettings({ textSize: 'm', density: 'normal', contrast: false, design: 'gymlog' });
    applyTheme();
    return out;
  });
  check(!bad.length, 'T13: Training, Verlauf, Fortschritt, Start und Mehr passen in jedem Design auf 320 px', bad.slice(0, 5).join(' | '));
  check(!page.errors.length, 'keine JavaScript-Fehler auf dem schmalen Display', page.errors.join(' | '));
}

(async () => {
  staticChecks();
  contrastChecks();
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
  const only = (process.env.ONLY || '').split(',').filter(Boolean);   // ONLY=anzeige,kleintext: nur diese Abläufe
  for (const [flow, viewport, name] of [[mobileFlow, { width: 390, height: 844 }, 'handy'], [dataFlow, { width: 390, height: 844 }, 'daten'], [iphoneFlow, { width: 390, height: 844 }, 'iphone'], [heartFlow, { width: 390, height: 844 }, 'herz'], [formFixFlow, { width: 390, height: 844 }, 'formfix'], [anzeigeFlow, { width: 390, height: 844 }, 'anzeige'], [muskelFlow, { width: 390, height: 844 }, 'muskel'], [testversionFlow, { width: 390, height: 844 }, 'testversion'], [befundeFlow, { width: 390, height: 844 }, 'befunde'], [tastaturFlow, { width: 390, height: 844 }, 'tastatur'], [rueckgaengigFlow, { width: 390, height: 844 }, 'rueckgaengig'], [kleintextFlow, { width: 390, height: 844 }, 'kleintext'], [schmalFlow, { width: 320, height: 700 }, 'schmal'], [desktopFlow, { width: 1280, height: 800 }, 'desktop']]) {
    if (only.length && !only.includes(name)) continue;
    let page = null;
    try {
      page = await openApp(browser, base, viewport, name === 'handy' || name === 'iphone' || name === 'herz' || name === 'formfix' || name === 'anzeige' || name === 'tastatur', name === 'iphone' ? IPHONE : undefined);
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
