'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

/* Sätze pro Muskel und Woche – Bereiche nach der Recherche (docs/recherche/saetze-pro-woche.md) */
async function muskelFlow(page) {
  console.log('Sätze pro Muskel');
  await page.evaluate(async () => {
    const ops = [];
    // 4 Wochen: je Woche 4 direkte Bizeps-Sätze (Curls) + 9 Sätze Rudern (Bizeps hilft mit) → zählt als 8,5
    for (let wk = 0; wk < 4; wk++) {
      const st = Date.now() - (3 + wk * 7) * 864e5;
      const sets = n => Array.from({ length: n }, () => ({ reps: 10, weightKg: 20, done: true }));
      ops.push({ type: 'put', coll: 'workouts', id: 'mu' + wk, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Pull', entries: [
        { exerciseId: 'ex_curl_kh', exerciseName: 'Curl', sets: sets(4) }, { exerciseId: 'ex_lh_rudern', exerciseName: 'Rudern', sets: sets(9) }] } });
    }
    // Leichte Sätze: 4 Curls mit RPE 5 zählen für Muskeln halb
    const st = Date.now() - 50 * 864e5;
    ops.push({ type: 'put', coll: 'workouts', id: 'murpe', doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 1200, name: 'Arme', entries: [
      { exerciseId: 'ex_curl_kh', exerciseName: 'Curl', sets: [1, 2, 3, 4].map(() => ({ reps: 12, weightKg: 10, rpe: 5, done: true })) }] } });
    await Store.batch(ops);
    UI.period = '4w'; UI.progSub = 'muscles'; App.go('progress');
  });
  await pause(page, 1500);
  const rpe = await page.evaluate(() => { const r = Analytics.cur().rows.find(x => x.id === 'murpe'); return r && { mP: r.mP['Bizeps'], sets: r.sets }; });
  check(rpe && rpe.mP === 2 && rpe.sets === 4, 'Leichte Sätze (RPE ≤ 5) zählen für den Muskel halb, als Satz voll', JSON.stringify(rpe));
  const v = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#tab-progress .chart-card')].find(c => /Sätze pro Muskelgruppe/.test(c.innerText));
    const ch = card && Chart.getChart(card.querySelector('canvas'));
    const neg = [...document.querySelectorAll('#tab-progress .chart-card')].find(c => /Vernachlässigte Muskelgruppen/.test(c.innerText));
    return { lines: ch ? ch.options.plugins.thresholds.lines.map(l => l.value + ' ' + l.label).join(', ') : null, mev: /\b(MEV|MAV|MRV)\b/.test(document.querySelector('#tab-progress').innerText), negBizeps: neg ? /Bizeps/.test(neg.innerText) : null, negRueckenOk: neg ? !/\bRücken\b/.test(neg.innerText) : null };
  });
  check(v.lines === '4 wirksam, 10 viel, 20 sehr viel' && !v.mev, 'Sätze pro Muskelgruppe: Linien bei 4 / 10 / 20 statt MEV/MAV/MRV', JSON.stringify(v));
  check(v.negBizeps === false && v.negRueckenOk, 'Vernachlässigt erst unter 4: Bizeps mit 4 direkt + 9 mitgeholfen (8,5) gilt als wirksam', JSON.stringify(v));
  // Kniebeugen ohne Beinbeuger/unteren Rücken – auch bei bestehenden Konten (nur, wenn niemand die Muskeln geändert hat)
  const sq = await page.evaluate(async () => {
    const e1 = Store.raw('exercises', 'ex_kniebeuge'), e2 = Store.raw('exercises', 'ex_kniebeuge_lowbar');
    await Store.batch([
      { type: 'put', coll: 'exercises', id: 'ex_kniebeuge', doc: { ...e1, muscleGroups: ['Quadrizeps', 'Gesäß', 'Unterer Rücken'] }, replace: true },
      { type: 'put', coll: 'exercises', id: 'ex_kniebeuge_lowbar', doc: { ...e2, muscleGroups: ['Quadrizeps', 'Gesäß', 'Beinbeuger', 'Waden'] }, replace: true }]);
    Store.saveSettings({ seedVersion: 5 });
    ensureSeeds();
    await new Promise(r => setTimeout(r, 300));
    return { hb: Store.raw('exercises', 'ex_kniebeuge').muscleGroups.join(','), lb: Store.raw('exercises', 'ex_kniebeuge_lowbar').muscleGroups.join(','), v: S().seedVersion };
  });
  check(sq.hb === 'Quadrizeps,Gesäß' && sq.lb === 'Quadrizeps,Gesäß,Beinbeuger,Waden' && sq.v >= 6, 'Kniebeuge: unterer Rücken entfernt, selbst geänderte Übungen bleiben unberührt', JSON.stringify(sq));
  // Wenig Text: jede Erklärung im (i) hat höchstens 2 kurze Sätze
  const infos = new Set();
  const grab = async () => (await page.evaluate(() => [...document.querySelectorAll('[data-info]')].map(b => b.dataset.info))).forEach(t => infos.add(t));
  await page.evaluate(() => Store.saveSettings({ f_bodyFat: true, f_measures: true }));
  for (const sub of ['overview', 'strength', 'volume', 'muscles', 'cardio', 'body']) {
    for (const sc of sub === 'strength' || sub === 'volume' ? ['total', 'exercise', 'muscle'] : ['total']) {
      await page.evaluate(([s, sc]) => { UI.progSub = s; UI.kraftScope = sc; UI.volScope = sc; App.go('progress'); }, [sub, sc]);
      await pause(page, 500); await grab();
    }
  }
  for (const t of ['start', 'training', 'more']) { await page.evaluate(t => App.go(t), t); await pause(page, 400); await grab(); }
  const ABBR = /\b(z\. B|d\. h|u\. a|bzw|ca|Wdh|usw|evtl|inkl|min|Std|Nr|vs|ggf|max|mind|etc)\./g;
  const sentences = t => t.replace(ABBR, m => m.replace(/\./g, '·')).replace(/\d\.\d/g, 'x').split(/[.!?…](?:\s|$)/).filter(x => x.trim().length > 2).length;
  const long = [...infos].filter(t => sentences(t) > 2 || t.length > 150);
  check(infos.size > 40 && !long.length, `Erklärungen im (i): höchstens 2 kurze Sätze (${infos.size} geprüft)`, long.slice(0, 3).join(' | '));
  // Muskel-Liste unter der Heatmap: eingeklappt, „Alle Muskeln“ klappt auf, bleibt nach dem Neu-Zeichnen offen
  const reg = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    UI.regOpen = false; UI.progSub = 'muscles'; App.go('progress', { instant: true }); App.renderCurrent(); await wait(300);
    const list = () => document.querySelector('#regList'), btn = () => document.querySelector('[data-act="regToggle"]');
    const zu = list().hidden && btn().getAttribute('aria-expanded') === 'false' && !list().offsetParent;
    btn().click(); await wait(100);
    const auf = !list().hidden && btn().getAttribute('aria-expanded') === 'true' && list().querySelectorAll('.reg-item').length > 10;
    App.renderCurrent(); await wait(200);
    const bleibt = !list().hidden && btn().classList.contains('open');
    btn().click(); await wait(100);
    return { zu, auf, bleibt, wiederZu: list().hidden && UI.regOpen === false };
  });
  check(reg.zu && reg.auf && reg.bleibt && reg.wiederZu, 'Muskel-Liste unter der Heatmap: eingeklappt, „Alle Muskeln“ klappt auf und wieder zu, Zustand bleibt', JSON.stringify(reg));
  const weekMap = await page.evaluate(() => {
    const mapped = new Set([...document.querySelectorAll('.body-map .mus')].map(p => p.dataset.m));
    const monday = dayNum('2026-11-23');
    const first = heatmapWeek(monday).from;
    return Object.keys(REGIONS).every(k => mapped.has(k)) && first === monday &&
      heatmapWeek(monday - 1).from === monday - 7 && heatmapWeek(monday + 6).from === monday;
  });
  check(weekMap, 'Heatmap: alle Regionen antippbar, Wochenwechsel am Montag');
}

module.exports = muskelFlow;
