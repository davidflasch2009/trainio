'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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
  const drag = async (dy, steps) => {
    const tp = (type, y) => touch(page, type, [{ x: 120, y }]);
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

module.exports = tastaturFlow;
