'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, engine, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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
  const menu = page.locator('.modal-wrap:not(.closing) .modal');
  check(await menu.locator('.list > button[data-k="warm"]').isVisible(), 'Aufwärmsätze direkt im Übungsmenü erreichbar');
  check(await menu.locator('button[data-k]:visible, summary:visible').count() <= 6 && !await menu.locator('[data-k="del"]').isVisible(), 'Übungsmenü startet kompakt, Entfernen ist eingeklappt');
  await menu.locator('summary').filter({ hasText: 'Übung verwalten' }).click();
  check(await menu.locator('[data-k="del"]').isVisible(), 'Übung verwalten zeigt Entfernen');
  await menu.locator('summary').filter({ hasText: 'Sätze & Pause' }).click();
  check(!await menu.locator('[data-k="del"]').isVisible(), 'Beim Gruppenwechsel schließt die vorherige Gruppe');
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
  // (nur Chromium: braucht echte Pointer-Ereignisse vom Finger, WebKit unter Linux erzeugt sie nicht)
  if (engine(page) === 'chromium') {
    const row = await page.evaluate(() => { const r = document.querySelector('#tab-more button.list-item').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const tch = (type, y) => touch(page, type, [{ x: row.x, y }]);
    await tch('touchStart', row.y); await pause(page, 200);
    const held = await page.evaluate(() => !!document.querySelector('#tab-more .pressed'));
    await tch('touchMove', row.y - 40); await tch('touchEnd'); await pause(page, 500);
    await tch('touchStart', row.y); await pause(page, 20); for (let k = 1; k <= 6; k++) { await tch('touchMove', row.y - k * 15); await pause(page, 16); }
    const scrolling = await page.evaluate(() => document.querySelectorAll('.pressed').length);
    await tch('touchEnd'); await pause(page, 300);
    check(held && !scrolling && !(await page.evaluate(() => document.querySelectorAll('.pressed').length)), 'Antippen: gibt beim Halten nach, beim Losscrollen nicht', JSON.stringify({ held, scrolling }));
  }
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

module.exports = mobileFlow;
