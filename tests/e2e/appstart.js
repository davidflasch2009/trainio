'use strict';
const { check } = require('../lib/harness');

module.exports = async function appstart(page) {
  const splash = page.locator('#launchScreen');
  const css = '**/css/tokens.css*';
  const app = await page.evaluate(() => {
    Store.saveSettings({ theme: 'light' });
    applyTheme();
    Store.put('templates', 'startprobe', { name: 'Offline-Plan', exercises: [] });
    Store.flushLocal();
    return launchColors();
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
    const seen = await splash.evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
    check(seen.join() === app.join(), 'Heller Startbildschirm in den Farben des Designs, schon vor den Design-Dateien', JSON.stringify({ seen, app }));
    const box = await splash.locator('svg').boundingBox();
    check(box.width === 110 && await splash.getByRole('button').count() === 0, 'Bei langsamem Netz bewegt sich die 110-px-Figur ohne Offline-Knopf');
  } finally { release(); }
  await splash.waitFor({ state: 'detached' });
  await page.unroute(css);
  check(await page.evaluate(() => !!Store.raw('templates', 'startprobe') && !!document.querySelector('.tab.active')?.innerText.trim()),
    'Sobald die Startdateien bereit sind, erscheint die App mit den gespeicherten Daten');

  // Dunkles Trainio-Design: Ladebildschirm nachtblau mit Figur in der Akzentfarbe – kein Farbsprung beim Erscheinen
  const dark = await page.evaluate(() => { Store.saveSettings({ theme: 'dark', design: 'gymlog' }); applyTheme(); return launchColors(); });
  let free;
  const slow = new Promise(resolve => { free = resolve; });
  await page.route(css, async route => { await slow; await route.continue(); });
  try {
    await page.reload({ waitUntil: 'commit' });
    await splash.waitFor();
    const seen = await splash.evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
    check(seen.join() === dark.join() && dark[0] !== 'rgb(11, 11, 12)', 'Dunkles Trainio-Design: Ladebildschirm in Hintergrund- und Akzentfarbe des Designs', JSON.stringify({ seen, dark }));
  } finally { free(); }
  await splash.waitFor({ state: 'detached' });
  await page.unroute(css);
  check(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === dark[0], 'Nach dem Start: App-Hintergrund gleich dem Ladebildschirm');

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
