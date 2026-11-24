'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, engine, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

/* Anzeige-Fehler aus einer früheren Bestandsaufnahme (H4–H6) */
async function historyNavigationChecks(page, kind) {
  const workout = kind === 'workout';
  const tab = workout ? 'training' : 'progress', action = workout ? 'histMore' : 'bodyHistMore';
  const sub = workout ? 'trainSub' : 'progSub', current = workout ? 'history' : 'body', other = workout ? 'plans' : 'overview';
  const root = workout ? '#workoutHistory' : '#bodyHistory';
  const reset = async () => {
    await page.click('#bottomNav [data-tab="start"]');
    await page.click(`#bottomNav [data-tab="${tab}"]`);
  };
  await reset();
  check(await page.locator(root + ' .history-month').count() === 1, `${kind}: Haupttab wechseln schließt ältere Monate`);
  // Abstand über der ersten Monatsüberschrift wie bei jedem Abschnitt (nicht dicht am Kalender bzw. an der Karte darüber)
  const gap = await page.locator(root + ' .section-head').first().evaluate(h => parseFloat(getComputedStyle(h).marginTop));
  check(gap >= 18, `${kind}: Abstand über der ersten Monatsüberschrift (${gap} px)`);
  const clean = await page.locator(`[data-act="${action}"]`).evaluate(b => {
    const s = getComputedStyle(b);
    return s.backgroundColor === 'rgba(0, 0, 0, 0)' && s.borderTopWidth === '0px' && !!b.querySelector('svg') && getComputedStyle(b, '::before').content === 'none';
  });
  check(clean, `${kind}: Monatsbutton nur Text und Pfeil, ohne Fläche, Rahmen oder Linien`);
  await page.locator(`[data-act="${action}"]`).scrollIntoViewIfNeeded();
  const motion = await page.evaluate(async ({ action, root }) => {
    const b = document.querySelector(`[data-act="${action}"]`);
    b.focus({ preventScroll: true }); b.click();
    const month = document.querySelector(root + ' .history-month:last-of-type');
    const initial = month.getBoundingClientRect().height;
    await new Promise(r => setTimeout(r, 100));
    const middle = month.getBoundingClientRect().height;
    await new Promise(r => setTimeout(r, 250));
    return { initial, middle, end: month.getBoundingClientRect().height, focus: document.activeElement?.dataset.act };
  }, { action, root });
  // WebKit-Tests laufen ohne CSS-Übergänge (tests/lib/harness.js) – dort nur der Fokus
  const slides = engine(page) !== 'chromium' || (motion.initial < motion.middle && motion.middle < motion.end);
  check(slides && motion.focus === action,
    `${kind}: neuer Monat gleitet auf, Tastaturfokus bleibt am Monatsbutton`, JSON.stringify(motion));
  await page.click(`[data-act="${sub}"][data-v="${other}"]`);
  await page.click(`[data-act="${sub}"][data-v="${current}"]`);
  check(await page.locator(root + ' .history-month').count() === 1, `${kind}: Untertab wechseln schließt ältere Monate`);
  await page.click(`[data-act="${action}"]`);
  await pause(page, 350);
  const y = await page.locator(root + ' .section-head').first().evaluate(el => {
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(); return r.top + r.height / 2;
  });
  await swipe(page, 60, 320, y);
  const changed = await page.evaluate(([sub, current]) => UI[sub] !== current, [sub, current]);
  await page.click(`[data-act="${sub}"][data-v="${current}"]`);
  check(changed && await page.locator(root + ' .history-month').count() === 1, `${kind}: Untertab per Wischgeste wechseln schließt ältere Monate`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click(`[data-act="${action}"]`);
  check(await page.locator(root + ' .history-month').count() === 2 && !await page.locator(root + ' .revealing').count(),
    `${kind}: bei reduzierter Bewegung öffnet der Monat sofort ohne Animation`);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await pause(page, 350);   // Tab-Auswahl wird verzögert gespeichert; danach darf der Test neu laden.
}

async function verlaufFlow(page) {
  console.log('Verlauf: Monate einzeln aufklappen');
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await page.evaluate(async () => {
    const dates = [...Array(8).fill('2026-01-10'), '2025-12-12', '2025-10-09'];
    await Store.batch(dates.map((date, i) => ({ type: 'put', coll: 'workouts', id: 'hist_' + i, doc: {
      date, name: 'Verlauf ' + i, startedAt: +parseISO(date) + i * 1000, durationSec: 1800,
      entries: [{ exerciseId: 'ex_bankdruecken', sets: [
        { weightKg: 20, reps: 10, warmup: true, done: true },
        { weightKg: 60, reps: 8, done: true }
      ] }]
    } })));
    UI.trainSub = 'history';
    UI.calMonth = null;
    App.go('training', { instant: true });
  });
  await pause(page);
  const state = () => page.evaluate(() => ({
    months: [...document.querySelectorAll('[data-history-month]')].map(e => e.dataset.historyMonth),
    ids: [...document.querySelectorAll('[data-history-month] .mini-wo')].map(e => e.dataset.id),
    next: document.querySelector('[data-act="histMore"]')?.textContent,
    summaries: [...document.querySelectorAll('#trainBody .section-head .tiny')].map(e => e.textContent)
  }));
  let s = await state();
  check(s.months.join() === '2026-01' && s.ids.length === 8 && s.next === 'Dezember aufklappen' && s.summaries.join() === '8 Workouts',
    'Zunächst nur der aktuelle Monat, alle acht Workouts und Vormonat-Button (Jahreswechsel)', JSON.stringify(s));

  await page.click('[data-history-month] [data-id="hist_7"]');
  await pause(page);
  const detail = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.modal .tbl tbody tr td:first-child')];
    return cells.map(c => {
      const style = getComputedStyle(c.firstElementChild || c);
      return { text: c.textContent, color: style.color, weight: style.fontWeight };
    });
  });
  check(detail.length === 2 && detail[0].text === 'W' && detail[1].text === '1'
    && detail[0].color === detail[1].color && detail[0].weight === detail[1].weight,
    'Workout-Detail: W hat dieselbe Schriftfarbe und -stärke wie die Satznummer', JSON.stringify(detail));
  await page.evaluate(() => Modal.closeAll());
  await pause(page);

  await page.locator('[data-act="histMore"]').scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => Scroll.y);
  await page.click('[data-act="histMore"]');
  await pause(page);
  s = await state();
  const scrollAfter = await page.evaluate(() => Scroll.y);
  check(s.months.join() === '2026-01,2025-12' && s.ids.length === 9 && s.next === 'November aufklappen'
    && Math.abs(scrollAfter - scrollBefore) < 2,
    'Ein Klick ergänzt Dezember, behält Januar und Scrollposition und bietet November an', JSON.stringify({ ...s, scrollBefore, scrollAfter }));
  await page.click('[data-act="histMore"]');
  await pause(page);
  s = await state();
  const nov = await page.locator('[data-history-month="2025-11"]').evaluate(e => ({ inner: e.innerText, text: e.textContent }));
  check(s.months.join() === '2026-01,2025-12,2025-11' && s.ids.length === 9 && s.next === 'Oktober aufklappen'
    && /Keine Workouts/.test(nov.inner),
    'Leerer November wird nicht übersprungen und bietet den nächsten Monat an', JSON.stringify({ ...s, nov }));
  await page.click('[data-act="histMore"]');
  s = await state();
  check(s.months.join() === '2026-01,2025-12,2025-11,2025-10' && s.ids.length === 10 && new Set(s.ids).size === 10 && !s.next,
    'Beim ältesten Monat endet das Aufklappen; kein Workout fehlt oder ist doppelt', JSON.stringify(s));

  await historyNavigationChecks(page, 'workout');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-history-month]');
  s = await state();
  check(s.months.join() === '2026-01' && s.next === 'Dezember aufklappen', 'Nach Neuladen startet der Verlauf wieder beim aktuellen Monat', JSON.stringify(s));
  await page.click('[data-act="calNav"][data-d="-1"]');
  await page.click('.cal [data-id="hist_8"]');
  await pause(page);
  check(/Verlauf 8/.test(await page.locator('.modal').innerText()) && (await state()).months.join() === '2026-01',
    'Kalender öffnet ein älteres Workout direkt, ohne den Verlauf aufzuklappen');
  await page.evaluate(() => Modal.closeAll());
  await pause(page);
  await page.click('[data-act="calNav"][data-d="1"]');
  await page.click('.cal [data-act="calDay"]');
  await pause(page);
  check(await page.locator('.modal [data-k^="hist_"]').count() === 8, 'Kalender bietet weiterhin alle Workouts desselben Tages zur Auswahl');
  await page.evaluate(() => Modal.closeAll());
  await page.evaluate(async () => {
    await Store.batch(Store.all('workouts').filter(w => w.date.startsWith('2026-01')).map(w => ({ type: 'del', coll: 'workouts', id: w.id })));
    App.renderCurrent();
  });
  s = await state();
  check(s.months.join() === '2026-01' && !s.ids.length && s.summaries.join() === '0 Workouts' && s.next === 'Dezember aufklappen',
    'Ohne Workouts im aktuellen Monat bleiben ältere Monate erreichbar', JSON.stringify(s));
  await page.evaluate(async () => {
    await Store.batch(Store.all('workouts').map(w => ({ type: 'del', coll: 'workouts', id: w.id })));
    App.renderCurrent();
  });
  check(/Noch kein Verlauf/.test(await page.locator('#trainBody').innerText()) && !(await state()).next, 'Ohne gespeicherte Workouts kein endloses Aufklappen');
  check(!page.errors.length && !(await appErrors(page)).length, 'Verlauf ohne JavaScript-Fehler', page.errors.join(' | '));
}

module.exports = verlaufFlow;
module.exports.historyNavigationChecks = historyNavigationChecks;
