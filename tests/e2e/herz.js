'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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
  const abschluss = page.locator('.modal-wrap.open .modal');
  check(/Workout gespeichert/.test(await abschluss.innerText()) && await abschluss.locator('.score-ring, .score-more').count() === 0,
    'Reines Cardio wird ohne Workout-Score abgeschlossen');
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

module.exports = heartFlow;
