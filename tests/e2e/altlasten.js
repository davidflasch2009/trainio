/* Früher gab es unter …/test/ eine Testversion mit eigenem Speicher, eigenen Caches und eigenem Service Worker.
   Beim Start räumt die App deren Reste weg – die echten Daten bleiben dabei unberührt. */
'use strict';
const { check, pause } = require('../lib/harness');

const ready = page => page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab) && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 15000 });

async function altlastenFlow(page) {
  console.log('Reste der früheren Testversion');
  // Zustand eines Geräts, auf dem die Testversion einmal offen war (+ ein echtes Workout)
  await page.evaluate(async () => {
    await Store.batch([{ type: 'put', coll: 'workouts', id: 'echt1', doc: { date: isoDate(), startedAt: Date.now(), durationSec: 600, name: 'Echt', entries: [] } }]);
    Store.flushLocal();
    localStorage.setItem('trainio-test.v1', '{"colls":{}}');
    localStorage.setItem('trainio-test.settings', '{}');
    await (await caches.open('trainio-test-v99')).put('/x', new Response('alt'));
    await new Promise(r => { const q = indexedDB.open('trainio-test-photos', 1); q.onupgradeneeded = () => q.result.createObjectStore('photos'); q.onsuccess = () => { q.result.close(); r(); }; q.onerror = r; });
    await navigator.serviceWorker.register('test/sw.js', { scope: 'test/' });
  });
  await page.waitForFunction(() => navigator.serviceWorker.getRegistrations().then(rs => rs.some(r => /\/test\/$/.test(r.scope))), null, { timeout: 15000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(page);
  await pause(page, 1500);
  const r = await page.evaluate(async () => ({
    ls: Object.keys(localStorage).filter(k => k.startsWith('trainio-test.')),
    caches: (await caches.keys()).filter(k => k.startsWith('trainio-test-')),
    idb: indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).filter(n => n === 'trainio-test-photos') : [],
    sw: (await navigator.serviceWorker.getRegistrations()).map(x => x.scope).filter(s => /\/test\/$/.test(s)),
    echt: !!Store.raw('workouts', 'echt1')
  }));
  check(!r.ls.length && !r.caches.length && !r.idb.length && !r.sw.length, 'Reste der Testversion entfernt (Speicher, Caches, Fotos-Datenbank, Service Worker)', JSON.stringify(r));
  check(r.echt, 'echte Daten bleiben erhalten');
  check(!page.errors.length, 'keine JavaScript-Fehler beim Aufräumen', page.errors.join(' | '));
}

module.exports = altlastenFlow;
