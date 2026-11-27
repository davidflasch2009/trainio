/* Offline und Updates mit echtem Service Worker: Die App startet ohne Netz aus dem Cache, eine neue Version wird
   beim Start sofort übernommen bzw. nach dem ersten Tippen per Meldung angeboten – die Daten bleiben dabei erhalten. */
'use strict';
const { check, pause, noViewError, overrides, read } = require('../lib/harness');

const ready = page => page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab) && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 15000 });
const controller = page => page.evaluate(() => navigator.serviceWorker.controller && new URL(navigator.serviceWorker.controller.scriptURL).pathname);
/** neue Version auf dem Server: gleicher sw.js, aber neuer Cache-Name */
function newVersion(n) {
  overrides['/sw.js'] = read('sw.js').replace(/const CACHE = 'gymlog-v(\d+)';/, (m, v) => `const CACHE = 'gymlog-v${+v + n}';`);
  return 'gymlog-v' + (+read('sw.js').match(/gymlog-v(\d+)/)[1] + n);
}

async function offlineFlow(page) {
  console.log('Offline & Updates (Service Worker)');
  const ctx = page.context();
  try {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
    check(await controller(page) === '/sw.js', 'Service Worker installiert und übernimmt die Seite');

    // Daten anlegen und sichern
    await page.evaluate(() => { Store.put('templates', 'tpl_offline', { name: 'Offline-Test', exercises: [], createdAt: Date.now() }); Store.flushLocal(); });

    // Auch mit Internet muss die installierte App die zum aktiven Worker passende Startseite nehmen.
    overrides['/index.html'] = '<!doctype html><title>Andere Serverversion</title>';
    try {
      await page.goto(new URL('index.html?startprobe', page.url()).href, { waitUntil: 'domcontentloaded' });
      await ready(page);
      check(await page.title() === 'Trainio' && await page.evaluate(() => !!Store.get('templates', 'tpl_offline')),
        'Installierter Start mit URL-Parameter nutzt die gespeicherte Version und den lokalen Datenbestand');
    } finally { delete overrides['/index.html']; }

    // ohne Netz neu starten
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await pause(page, 400);
    check(await noViewError(page), 'App startet offline aus dem Cache');
    check(await page.evaluate(() => !!Store.get('templates', 'tpl_offline')), 'offline: gespeicherte Daten sind da');
    await page.click('#bottomNav [data-tab="progress"]');
    await pause(page, 300);
    check(await page.evaluate(() => App.tab === 'progress') && await noViewError(page), 'offline: Tabs funktionieren');
    await ctx.setOffline(false);

    // Update direkt nach dem Start (noch nichts angetippt) → wird sofort übernommen, Seite lädt neu
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    const v2 = newVersion(1);
    const nav = page.waitForEvent('framenavigated', { timeout: 15000 });
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    await nav;
    await ready(page);
    await page.waitForFunction(v => caches.keys().then(k => k.includes(v)), v2, { timeout: 15000 }).catch(() => {});
    const keys1 = await page.evaluate(() => caches.keys());
    check(keys1.includes(v2) && keys1.filter(k => k.startsWith('gymlog-')).length === 1, 'Update beim Start: neue Version sofort übernommen, alter Cache gelöscht', keys1.join(', '));
    check(await page.evaluate(() => !!Store.get('templates', 'tpl_offline')), 'nach dem Update: Daten sind noch da');

    // Update während der Benutzung → Meldung „Neue Version verfügbar", „Neu laden" spielt sie ein
    await page.click('#bottomNav [data-tab="training"]');
    await pause(page, 200);
    const v3 = newVersion(2);
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    const btn = page.locator('#toastRoot button', { hasText: 'Neu laden' });
    await btn.waitFor({ timeout: 15000 });
    check(await page.evaluate(() => App.tab === 'training'), 'Update während der Benutzung: kein ungefragtes Neuladen, Meldung erscheint');
    const nav2 = page.waitForEvent('framenavigated', { timeout: 15000 });
    await btn.click();
    await nav2;
    await ready(page);
    await page.waitForFunction(v => caches.keys().then(k => k.includes(v)), v3, { timeout: 15000 }).catch(() => {});
    const keys2 = await page.evaluate(() => caches.keys());
    check(keys2.includes(v3) && keys2.filter(k => k.startsWith('gymlog-')).length === 1 && await noViewError(page), '„Neu laden" spielt die neue Version ein', keys2.join(', '));
    check(await page.evaluate(() => !!Store.get('templates', 'tpl_offline')), 'nach „Neu laden": Daten sind noch da');
    check(!page.errors.length, 'keine JavaScript-Fehler bei Offline und Update', page.errors.join(' | '));
  } finally {
    delete overrides['/sw.js'];
    await ctx.setOffline(false).catch(() => {});
  }
}

module.exports = offlineFlow;
