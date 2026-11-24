'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

async function desktopFlow(page) {
  console.log('Desktop (1280 × 800)');
  check(!page.errors.length, 'App startet ohne Fehler', page.errors.join(' | '));
  for (const tab of ['start', 'training', 'exercises', 'progress', 'more']) {
    await page.click(`#sidebar [data-tab="${tab}"]`);
    await pause(page, 150);
    check(await page.evaluate(t => App.tab === t, tab) && await noViewError(page), `Tab „${tab}" (Seitenleiste)`);
  }
  check(await page.evaluate(() => !Keypad.on() && kpIM('decimal') === 'decimal'), 'Desktop (Maus): keine eigene Zahlentastatur, normale Eingabe');
  check(!page.errors.length, 'keine JavaScript-Fehler', page.errors.join(' | '));
}

module.exports = desktopFlow;
