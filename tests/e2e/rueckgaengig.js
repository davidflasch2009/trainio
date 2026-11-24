'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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
  await page.click('.modal [data-x="edit"]');
  await page.click('.modal [data-k="del"]');
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

module.exports = rueckgaengigFlow;
