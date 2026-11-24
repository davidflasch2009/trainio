'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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

module.exports = kleintextFlow;
