'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

/* Testversion unter …/test/: eigener Speicher, kein Firebase, Beispieldaten – die echten Daten bleiben unberührt */
async function testversionFlow(page) {
  console.log('Testversion (…/test/)');
  await page.evaluate(async () => {
    await Store.batch([{ type: 'put', coll: 'workouts', id: 'echt1', doc: { date: isoDate(), startedAt: Date.now(), durationSec: 600, name: 'Echt', entries: [] } }]);
    Store.flushLocal();
  });
  const t = await page.context().newPage();
  t.errors = [];
  t.on('pageerror', e => t.errors.push(e.message));
  await t.goto(page.url() + 'test/', { waitUntil: 'domcontentloaded' });
  await t.waitForFunction(() => typeof App !== 'undefined' && Store.all('workouts').length > 0 && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 10000 });
  const r = await t.evaluate(() => ({ test: TESTVERSION, key: LS.data, fb: Auth.configured(), wo: Store.all('workouts').length, echt: !!Store.raw('workouts', 'echt1'),
    bw: Store.all('progress').length, phase: (S().phases || []).map(p => p.type).join(), plan: S().activePlanId, prs: Store.all('prs').length }));
  check(r.test && r.key === 'trainio-test.v1' && !r.fb, 'Testversion: eigener Speicher, kein Firebase');
  check(r.wo >= 20 && r.bw >= 20 && r.phase === 'bulk' && r.plan === 'plan_bsp' && r.prs > 10 && !r.echt,
    `Testversion: Beispieldaten (${r.wo} Workouts, ${r.bw}× Gewicht, Bulk), das echte Workout ist nicht zu sehen`);
  let bad = [];
  for (const tab of ['start', 'training', 'progress', 'more']) {
    await t.evaluate(x => App.go(x), tab); await pause(t, 300);
    if (!await noViewError(t)) bad.push(tab);
  }
  const more = await t.evaluate(() => document.querySelector('#tab-more').innerText);
  check(!bad.length && more.includes('Beispieldaten neu laden') && !more.includes('Lokaler Modus'), 'Testversion: alle Tabs laufen, „Mehr“ zeigt „Beispieldaten neu laden“', bad.join(', '));
  const again = await t.evaluate(async () => { Store.del('workouts', Store.all('workouts')[0].id); Store.put('workouts', 'extra', { date: isoDate(), startedAt: Date.now(), name: 'X', entries: [] });
    await Testversion.load(); return Store.all('workouts').length; });
  check(again === r.wo, 'Testversion: „Neu laden“ stellt die Beispieldaten wieder her');
  await t.evaluate(() => Store.flushLocal());
  const real = await t.evaluate(() => Object.keys((JSON.parse(localStorage.getItem('gymlog.v1')) || { colls: {} }).colls.workouts || {}));
  check(real.join() === 'echt1', 'Testversion: die echten Daten bleiben unberührt', real.join());
  check(!t.errors.length, 'Testversion ohne JS-Fehler', t.errors.join(' | '));
  await t.close();
}

module.exports = testversionFlow;
