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
  const quick = await page.locator('.bw-quick').innerText();
  check(!/Anderes Datum|CSV|Gewicht heute|ersetzt/.test(quick) && await page.locator('.bw-quick #bwQuick').count() === 1,
    'Gewicht-Karte: nur Feld, Einheit und Speichern – kein Zusatztext', quick);
  await page.locator('.section-head [data-act="bodyNew"]').click();
  const form = page.locator('.modal-wrap.open .modal').getByText('Neuer Körper-Eintrag');
  await form.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  check(await form.isVisible(), '„+ Eintrag“ am Verlauf öffnet den Eintrag für ein anderes Datum');
  await page.locator('.modal-wrap.open').getByRole('button', { name: 'Schließen' }).click();
  await page.locator('.modal-wrap.closing').first().waitFor({ state: 'detached' }).catch(() => {});
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
  await page.evaluate(() => Store.saveSettings({
    bwRate: { type: 'bulk', min: 0, max: .3 },
    phases: [{ id: 'gewicht', name: 'Aufbau', type: 'bulk', from: '2026-01-12', to: '', rateMin: 0, rateMax: .2 }]
  }));
  await page.getByRole('button', { name: 'Aufbau: 0 g bis +200 g' }).click();
  await page.fill('#rtMin', '100');
  await page.fill('#rtMax', '250');
  await page.click('.modal [data-x="ok"]');
  await page.getByRole('button', { name: 'Aufbau: +100 g bis +250 g' }).waitFor();
  await page.waitForFunction(() => Chart.getChart('cv-b5')?.config.options.plugins.rangeBand?.ranges.at(-1)?.[0] === .1);
  const ziel = await page.evaluate(() => {
    const bereiche = Chart.getChart('cv-b5').config.options.plugins.rangeBand.ranges;
    return { bereiche, allgemein: S().bwRate, zeitraum: UI.period };
  });
  check(ziel.bereiche.at(-1)[1] === .25 && ziel.bereiche.at(-2)[1] === .3 && ziel.allgemein.max === .3 && ziel.zeitraum === 'all',
    'Das angezeigte Phasenziel ändert sein Diagrammband, frühere Wochen behalten das allgemeine Ziel', JSON.stringify(ziel));
  await page.getByRole('button', { name: 'Allgemeines Wochenziel' }).click();
  check(await page.locator('.modal-wrap.open #rtMax').inputValue() === '300', 'Das allgemeine Wochenziel bleibt separat bearbeitbar');
  await page.click('.modal-wrap.open [data-x="c"]');
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
