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
async function openApp(browser, base, viewport, touch = false) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block', locale: 'de-DE', hasTouch: touch, acceptDownloads: true });
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

/* Datenwege mit echten Eingaben: Backup → alles löschen → wiederherstellen, Arrow-Import + Rückgängig, Gewichts-CSV */
async function dataFlow(page) {
  console.log('Datenwege');
  const count = () => page.evaluate(() => ({ w: Store.all('workouts').length, t: Store.all('templates').length, pr: Store.all('prs').length, prog: Store.all('progress').length, ex: Store.all('exercises').length, imp: Store.all('imports').length }));
  await page.evaluate(async () => {
    const ops = [];
    for (let i = 1; i <= 6; i++) { const st = Date.now() - i * 86400000 * 3; ops.push({ type: 'put', coll: 'workouts', id: 'dw' + i, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 60 + i, done: true }] }] } }); }
    ops.push({ type: 'put', coll: 'templates', id: 'dt1', doc: { name: 'Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '8', restSec: 90 }] } });
    await Store.batch(ops); await PR.recalcAll();
    Store.saveSettings({ design: 'paper' });
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
  check(await page.evaluate(() => S().design === 'paper'), 'Einstellungen aus dem Backup übernommen');
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
  for (let y = 0; y < 5000; y += 350) { await page.evaluate(v => Scroll.to(v), y); await pause(page, 120); }
  const drawn = await page.evaluate(() => typeof Chart !== 'undefined' ? [...document.querySelectorAll('#tab-progress canvas')].filter(c => Chart.getChart(c)).length : -1);
  check(drawn > 0, `Diagramme gezeichnet (${drawn})`, drawn < 0 ? 'Chart.js fehlt – npm install ausführen' : '');
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 600);
  for (const sel of ['[data-k="accent"][data-v="#0a84ff"]', '[data-k="design"][data-v="glass"]', '[data-k="theme"][data-v="light"]', '[data-k="design"][data-v="iron"]']) {
    await page.click(`#tab-more ${sel}`);
    await pause(page, 450);
  }
  await pause(page, 600);   // Überblendung zu Ende
  const look = await page.evaluate(() => ({ d: document.documentElement.dataset.design, t: document.documentElement.dataset.theme, swap: document.documentElement.classList.contains('look-swap'), active: !!document.querySelector('#tab-more .design-tile.active[data-v="iron"]') }));
  check(look.d === 'iron' && look.t === 'light' && !look.swap && look.active, 'Design, Farbe und Modus übernommen', JSON.stringify(look));
  await page.evaluate(() => App.go('progress'));
  await pause(page, 600);
  for (let y = 0; y < 5000; y += 350) { await page.evaluate(v => Scroll.to(v), y); await pause(page, 120); }
  const logged = await appErrors(page);
  check(!logged.length && !page.errors.length, 'keine Fehler beim Design-Wechsel', [...logged, ...page.errors].join(' | '));
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
  for (const [flow, viewport, name] of [[mobileFlow, { width: 390, height: 844 }, 'handy'], [dataFlow, { width: 390, height: 844 }, 'daten'], [desktopFlow, { width: 1280, height: 800 }, 'desktop']]) {
    let page = null;
    try {
      page = await openApp(browser, base, viewport, name === 'handy');
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
