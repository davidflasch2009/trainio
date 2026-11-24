'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');
const { historyNavigationChecks } = require('./verlauf');

async function koerperVerlaufFlow(page) {
  console.log('Körper-Verlauf: Monate einzeln aufklappen');
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await page.evaluate(async () => {
    const dates = ['2026-01-12', '2026-01-10', '2025-12-31', '2025-10-09'];
    await Store.batch(dates.map((date, i) => ({ type: 'put', coll: 'progress', id: 'body_hist_' + i,
      doc: { date, bodyWeightKg: 80 - i, notes: 'Messung ' + i, createdAt: i } })));
    UI.progSub = 'body'; UI.period = 'all';
    App.go('progress', { instant: true });
  });
  await pause(page);
  const state = () => page.evaluate(() => ({
    months: [...document.querySelectorAll('[data-body-history-month]')].map(e => e.dataset.bodyHistoryMonth),
    ids: [...document.querySelectorAll('#bodyHistory [data-act="bodyEdit"]')].map(e => e.dataset.id),
    next: document.querySelector('[data-act="bodyHistMore"]')?.textContent
  }));
  let s = await state();
  check(s.months.join() === '2026-01' && s.ids.join() === 'body_hist_0,body_hist_1' && s.next === 'Dezember aufklappen'
    && !await page.locator('[data-act="bodyCfg"]').count() && !/Anzeige anpassen/.test(await page.locator('#progBody').innerText()),
    'Körper: nur aktueller Monat, neueste Messung zuerst, kein „Anzeige anpassen“', JSON.stringify(s));
  await page.locator('[data-act="bodyHistMore"]').scrollIntoViewIfNeeded();
  await pause(page);
  const before = await page.evaluate(() => { window.bodyChartBefore = document.querySelector('#cv-b1'); return Scroll.y; });
  await page.click('[data-act="bodyHistMore"]');
  s = await state();
  check(s.months.join() === '2026-01,2025-12' && s.ids.length === 3 && s.next === 'November aufklappen'
    && await page.evaluate(y => Math.abs(Scroll.y - y) < 2 && window.bodyChartBefore === document.querySelector('#cv-b1') && Analytics.bwSeries().length === 4, before),
    'Dezember wird ergänzt; Scrollposition und Diagramm bleiben erhalten, Auswertungen enthalten alle Messungen', JSON.stringify(s));
  await page.click('[data-act="bodyEdit"][data-id="body_hist_2"]');
  await page.fill('#bfNotes', 'Ältere Messung bearbeitet');
  await page.click('.modal [data-x="save"]');
  await pause(page, 400);
  s = await state();
  check(s.months.join() === '2026-01,2025-12' && /Ältere Messung bearbeitet/.test(await page.locator('[data-body-history-month="2025-12"]').innerText()),
    'Älterer Eintrag bleibt bearbeitbar und der Monat nach dem Speichern geöffnet');
  await page.click('[data-act="bodyHistMore"]');
  s = await state();
  check(s.months.join() === '2026-01,2025-12,2025-11' && s.next === 'Oktober aufklappen'
    && /Keine Einträge/.test(await page.locator('[data-body-history-month="2025-11"]').innerText()),
    'Leerer Monat mit Hinweis und Button für den nächsten Monat', JSON.stringify(s));
  await page.click('[data-act="bodyHistMore"]');
  s = await state();
  check(s.months.join() === '2026-01,2025-12,2025-11,2025-10' && s.ids.length === 4 && new Set(s.ids).size === 4 && !s.next,
    'Körper-Verlauf endet beim ältesten Monat, alle Einträge genau einmal', JSON.stringify(s));
  await historyNavigationChecks(page, 'body');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#bodyHistory');
  s = await state();
  check(s.months.join() === '2026-01' && s.ids.length === 2, 'Nach Neuladen ist nur der aktuelle Monat sichtbar', JSON.stringify(s));
  await page.evaluate(async () => {
    await Store.batch(Store.all('progress').filter(p => p.date.startsWith('2026-01')).map(p => ({ type: 'del', coll: 'progress', id: p.id })));
    App.renderCurrent();
  });
  s = await state();
  check(!s.ids.length && s.next === 'Dezember aufklappen' && /Keine Einträge in diesem Monat/.test(await page.locator('#bodyHistory').innerText()),
    'Leerer aktueller Monat: ältere Körper-Einträge weiterhin erreichbar', JSON.stringify(s));
  await page.evaluate(async () => {
    await Store.batch(Store.all('progress').map(p => ({ type: 'del', coll: 'progress', id: p.id })));
    App.renderCurrent();
  });
  check(/Noch keine Einträge/.test(await page.locator('#bodyHistory').innerText()) && !(await state()).next,
    'Ohne Messungen erscheint der leere Verlauf ohne Aufklapp-Button');
  await page.evaluate(() => Actions.openFeatures());
  await page.waitForSelector('#tab-more [data-ch="setToggle"][data-k="f_bodyFat"]');
  check(await page.locator('#tab-more [data-ch="setToggle"]:is([data-k="f_bodyFat"], [data-k="f_measures"], [data-k="f_photos"])').count() === 3,
    'Körper-Anzeige weiterhin über Tabs & Funktionen einstellbar');
  check(!page.errors.length && !(await appErrors(page)).length, 'Körper-Verlauf ohne JavaScript-Fehler', page.errors.join(' | '));
}

module.exports = koerperVerlaufFlow;
