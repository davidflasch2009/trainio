'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');


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
  await page.locator('.modal summary').filter({ hasText: 'Notizen & Technik' }).click();
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

module.exports = formFixFlow;
