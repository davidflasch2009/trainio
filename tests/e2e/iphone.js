'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

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
  const drag = async (to, steps) => { await touch(page, 'touchStart', [{ x: hd.x, y: hd.y }]); for (let k = 1; k <= steps; k++) { await touch(page, 'touchMove', [{ x: hd.x, y: hd.y + to * k / steps }]); await pause(page, 30); } await pause(page, 150); await touch(page, 'touchEnd'); await pause(page, 800); };
  await drag(60, 6);
  check(await page.evaluate(() => Modal.count() === 1 && getComputedStyle(document.querySelector('.modal')).transform === 'none'), 'Fenster: kurz gezogen → federt zurück');
  await drag(hd.h * 0.6, 12);
  check(await page.evaluate(() => Modal.count() === 0), 'Fenster: weit nach unten gezogen → schließt');
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

module.exports = iphoneFlow;
