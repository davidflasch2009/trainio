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
  // Alle Diagramme sind sofort gezeichnet – auch unterhalb des Bildschirms, ohne Hinscrollen (sonst unscharf auf dem iPhone)
  const cv = await page.evaluate(() => typeof Chart === 'undefined' ? null : [...document.querySelectorAll('#tab-progress canvas')].filter(c => c.style.display !== 'none')
    .map(c => ({ id: c.id, drawn: !!Chart.getChart(c), below: c.getBoundingClientRect().top > innerHeight, sharp: Math.abs(c.width - c.clientWidth * devicePixelRatio) < 2 })));
  check(cv && cv.length && cv.every(c => c.drawn) && cv.some(c => c.below), `Diagramme sofort gezeichnet, auch unterhalb (${cv ? cv.length : 0})`, cv ? JSON.stringify(cv.filter(c => !c.drawn)) : 'Chart.js fehlt – npm install ausführen');
  check(cv && cv.every(c => c.sharp), 'Diagramme mit voller Pixeldichte', cv ? JSON.stringify(cv.filter(c => !c.sharp)) : '');
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 600);
  for (const sel of ['[data-k="accent"][data-v="#0a84ff"]', '[data-k="design"][data-v="glass"]', '[data-k="theme"][data-v="light"]', '[data-k="design"][data-v="iron"]']) {
    await page.click(`#tab-more ${sel}`);
    await pause(page, 450);
  }
  await pause(page, 600);   // Überblendung zu Ende
  const look = await page.evaluate(() => ({ d: document.documentElement.dataset.design, t: document.documentElement.dataset.theme, swap: document.documentElement.classList.contains('look-swap'), active: !!document.querySelector('#tab-more .design-tile.active[data-v="iron"]') }));
  check(look.d === 'iron' && look.t === 'light' && !look.swap && look.active, 'Design, Farbe und Modus übernommen', JSON.stringify(look));
  // Plakat: eckig, Linien statt Karten, Rot nur als Akzent
  await page.click('#tab-more [data-k="accent"][data-v=""]').catch(() => page.evaluate(() => Store.saveSettings({ accent: '' })));
  await page.click('#tab-more [data-k="design"][data-v="plakat"]');
  await pause(page, 900);
  await page.evaluate(() => App.go('start'));
  await pause(page, 500);
  const pl = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement), st = document.querySelector('#tab-start .stat'), hero = document.querySelector('#tab-start .btn-hero');
    return { d: document.documentElement.dataset.design, rs: cs.getPropertyValue('--rs').trim(), accent: cs.getPropertyValue('--accent').trim(), statTop: st && getComputedStyle(st).borderTopWidth, statBg: st && getComputedStyle(st).backgroundColor, heroR: hero && getComputedStyle(hero).borderRadius }; });
  check(pl.d === 'plakat' && pl.rs === '0' && pl.accent === '#e2001a' && pl.statTop === '2px' && pl.statBg === 'rgba(0, 0, 0, 0)' && pl.heroR === '0px', 'Design „Plakat": eckig, Linien statt Karten, Signalrot', JSON.stringify(pl));
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
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

(async () => {
  staticChecks();
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
  for (const [flow, viewport, name] of [[mobileFlow, { width: 390, height: 844 }, 'handy'], [dataFlow, { width: 390, height: 844 }, 'daten'], [iphoneFlow, { width: 390, height: 844 }, 'iphone'], [heartFlow, { width: 390, height: 844 }, 'herz'], [formFixFlow, { width: 390, height: 844 }, 'formfix'], [desktopFlow, { width: 1280, height: 800 }, 'desktop']]) {
    let page = null;
    try {
      page = await openApp(browser, base, viewport, name === 'handy' || name === 'iphone' || name === 'herz' || name === 'formfix', name === 'iphone' ? IPHONE : undefined);
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
