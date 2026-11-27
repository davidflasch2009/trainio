'use strict';
const { check } = require('../lib/harness');

module.exports = async function appstart(page) {
  const splash = page.locator('#launchScreen');
  const css = '**/css/tokens.css*';
  await page.evaluate(() => {
    Store.saveSettings({ theme: 'light' });
    applyTheme();
    Store.put('templates', 'startprobe', { name: 'Offline-Plan', exercises: [] });
    Store.flushLocal();
  });

  // Eine notwendige Datei hängt im Netz. Die Figur muss davor sichtbar sein.
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  await page.route(css, async route => { await waiting; await route.continue(); });
  try {
    await page.reload({ waitUntil: 'commit' });
    await splash.waitFor();
    const arms = splash.locator('.launch-arms');
    const initial = await arms.getAttribute('d');
    await page.waitForFunction(d => document.querySelector('.launch-arms')?.getAttribute('d') !== d, initial);
    check(await splash.evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(250, 250, 250)'),
      'Heller Startbildschirm ist schon vor den Design-Dateien sichtbar');
    const box = await splash.locator('svg').boundingBox();
    check(box.width === 110 && await splash.getByRole('button').count() === 0, 'Bei langsamem Netz bewegt sich die 110-px-Figur ohne Offline-Knopf');
  } finally { release(); }
  await splash.waitFor({ state: 'detached' });
  await page.unroute(css);
  check(await page.evaluate(() => !!Store.raw('templates', 'startprobe') && !!document.querySelector('.tab.active')?.innerText.trim()),
    'Sobald die Startdateien bereit sind, erscheint die App mit den gespeicherten Daten');

  // Auch ohne das letzte Skript muss der Startbildschirm selbstständig funktionieren.
  await page.route(css, route => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  check(await splash.getByRole('button', { name: 'Erneut versuchen' }).isVisible(), 'Fehlendes Stylesheet beendet die Ladeanimation mit einem erneuten Versuch');
  await page.unroute(css);
  const boot = '**/js/boot.js*';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(boot, route => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  const retry = splash.getByRole('button', { name: 'Erneut versuchen' });
  await retry.waitFor();
  await page.unroute(boot);
  let resume;
  const hold = new Promise(resolve => { resume = resolve; });
  await page.route(boot, async route => { await hold; await route.continue(); });
  try {
    await Promise.all([page.waitForNavigation({ waitUntil: 'commit' }), retry.click({ noWaitAfter: true })]);
    const body = splash.locator('.launch-body');
    await body.waitFor();
    const pose = await body.getAttribute('transform');
    await page.waitForTimeout(120);
    check(pose === 'translate(0 -10)' && await body.getAttribute('transform') === pose, 'Erneuter Start und reduzierte Bewegung: Figur bleibt stehen');
  } finally { resume(); }
  await splash.waitFor({ state: 'detached' });
  check(await page.evaluate(() => !!Store.raw('templates', 'startprobe')), 'Nach einem Ladefehler öffnet der neue Versuch denselben Datenbestand');
};
