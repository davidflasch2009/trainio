'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

async function anzeigeFlow(page) {
  console.log('Anzeige-Fehler');
  await page.evaluate(async () => {
    const day = n => { const st = Date.now() - n * 864e5; return { date: isoDate(new Date(st)), startedAt: st }; };
    const bank = (n, kg, reps) => ({ ...day(n), durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [1, 2, 3].map(() => ({ reps, weightKg: kg, done: true })) }] });
    await Store.batch([
      { type: 'put', coll: 'workouts', id: 'az1', doc: bank(20, 100, 8) },
      { type: 'put', coll: 'workouts', id: 'az2', doc: bank(10, 105, 3) },   // schwerer (Gewichts-PR), aber kein besseres e1RM
      { type: 'put', coll: 'workouts', id: 'az3', doc: { ...day(1), durationSec: 1800, name: 'Laufen', entries: [{ exerciseId: 'ex_laufband', exerciseName: 'Laufband (Joggen)', sets: [{ durationSec: 1800, distKm: 5, done: true }] }] } }
    ]);
    await PR.recalcAll();
  });
  // 1. Workout-Score: der Bonus zählt nur e1RM-Rekorde und sagt das auch – kein „kein neuer Rekord“ neben „Neuer PR“
  const bd = await page.evaluate(() => { const sc = Analytics.score('az2'); return { prs: sc.prs, html: scoreBreakdownHtml(sc) }; });
  check(bd.prs === 0 && /e1RM-Bonus/.test(bd.html) && /kein neuer e1RM-Rekord/.test(bd.html) && !/PR-Bonus|kein neuer Rekord/.test(bd.html),
    'Workout-Score: Bonus heißt „e1RM-Bonus“ – ein Gewichts-PR ohne neues e1RM widerspricht ihm nicht', JSON.stringify(bd.prs));
  // 2. Reine Cardio-Workouts erscheinen nicht als 0 kg
  const cv = await page.evaluate(() => { const ix = Analytics.cur(); return { cardio: ix.rows.some(r => r.id === 'az3' && r.cardioOnly), total: scopeItems(ix, 'total').map(x => x.ton) }; });
  check(cv.cardio && cv.total.length === 2 && cv.total.every(t => t > 0), 'Volumen pro Workout: reine Cardio-Workouts zählen nicht mit (keine Punkte auf der Nulllinie)', JSON.stringify(cv));
  const months = await page.evaluate(() => {
    const rows = Analytics.cur().rows;
    const run = rows.find(r => r.id === 'az3');
    const step = { ...run, cBy: { ex_stepper: { sec: 1800, km: 0 } }, cKm: 0 };
    return historyMonthSummary([run, run]) === '2 Workouts'
      && historyMonthSummary([step]) === '1 Workout'
      && historyMonthSummary(rows) === '3 Workouts';
  });
  check(months, 'Monatsüberschrift zeigt nur die Workoutanzahl, auch bei Cardio');
  await page.evaluate(() => { UI.progSub = 'overview'; App.go('progress'); });
  await pause(page, 600);
  const h7 = await page.evaluate(() => [...document.querySelectorAll('#tab-progress .heat7 button')].map(b => b.getAttribute('aria-label')).join(' | '));
  check(/Cardio/.test(h7) && !/\b0\s?kg/.test(h7), '„Letzte 7 Tage“: ein Cardio-Tag heißt „Cardio“ statt „0 kg“ (Vorlesetext)', h7);
  await page.waitForFunction(() => !!Charts.get('setsw')?.factory);
  const setStats = await page.evaluate(() => {
    const chart = Charts.get('setsw').factory();
    const points = chart.data.datasets[0].data;
    const card = document.querySelector('#cv-setsw').closest('.chart-card');
    const table = document.createElement('div');
    table.innerHTML = chartTable(chart);
    return points.length === 2 && points.every(p => p.y === 3)
      && card.querySelector('.cc-big b').textContent === nf(3, 1)
      && table.querySelectorAll('tbody tr').length === 2;
  });
  check(setStats, 'Sätze pro Workout: Cardio aus Kurve, Durchschnitt und Vollbild-Tabelle ausgenommen');
  const h7txt = await page.evaluate(() => document.querySelector('#tab-progress .heat7').innerText.replace(/\s+/g, ' ').trim());
  check(!/kg|\dt\b|Cardio/.test(h7txt), '„Letzte 7 Tage“: in den Kästchen nur der Wochentag, keine Mini-Werte', h7txt);
  // Kraftzuwachs robust (bestes e1RM je Woche, Median der ersten gegen gleitenden Median der letzten Wochen):
  // Tagesform-Schwankungen (σ 3 %) ohne echten Fortschritt ergeben ≈ 0 % – je Übung im Mittel und im verketteten Index
  // der Karte „Kraftzuwachs“. Das frühere laufende Maximum gegen die erste Session zeigt bei denselben Daten ≈ +6 %.
  const kz = await page.evaluate(() => {
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const gauss = () => { let u = -6; for (let i = 0; i < 12; i++) u += rnd(); return u; };
    // 12 Wochen, 2 Sessions pro Woche; e1RM = Niveau (je nach Woche) × Tagesform
    const w0 = weekStartDN(7000), mk = lvl => Array.from({ length: 24 }, (_, i) => ({ dn: w0 + (i >> 1) * 7 + (i % 2) * 3, best: lvl(i >> 1) * (1 + 0.03 * gauss()) }));
    const sessions = {}, flat = [], up = [];
    for (let k = 0; k < 300; k++) { flat.push('f' + k); sessions['f' + k] = mk(() => 100); }
    for (let k = 0; k < 50; k++) { up.push('u' + k); sessions['u' + k] = mk(w => 100 * (1 + 0.01 * w)); }   // +1 % pro Woche
    const all = { from: 0, to: 99999 }, ix = { sessions };
    const gF = strengthGains(ix, flat, all), gU = strengthGains(ix, up, all), last = a => a[a.length - 1].y;
    const old = avg(flat.map(id => { const ss = sessions[id]; return (Math.max(...ss.map(s => s.best)) / ss[0].best - 1) * 100; }));
    return { n: gF.length, flat: round(avg(gF.map(g => g.gain)), 2), flatIdx: last(gainIndex(gF)), old: round(old, 1), up: round(avg(gU.map(g => g.gain)), 1), upIdx: last(gainIndex(gU)) };
  });
  check(kz.n === 300 && Math.abs(kz.flat) < 0.5 && Math.abs(kz.flatIdx) < 0.5 && kz.old > 3, 'Kraftzuwachs: verrauschte, aber gleichbleibende Daten ergeben ≈ 0 % (früher laufendes Maximum: ≈ +6 %)', JSON.stringify(kz));
  check(kz.up > 6 && kz.up < 12 && kz.upIdx > 6 && kz.upIdx < 12, 'Kraftzuwachs: echte Steigerung (+1 % pro Woche) bleibt sichtbar', JSON.stringify(kz));
  // Form-Fix startet neu (Werte davor zählen nicht), unter 4 Trainingswochen gibt es keinen Wert,
  // mehrere Sessions pro Woche zählen als eine Woche
  const kf = await page.evaluate(() => {
    const w0 = weekStartDN(7000), wk = (n, lvl, from = 0, perWeek = 1) => Array.from({ length: n * perWeek }, (_, i) => ({ dn: w0 + (from + Math.floor(i / perWeek)) * 7 + i % perWeek, best: lvl }));
    const fix = [...wk(6, 120), ...wk(6, 100, 6)]; fix[6].fix = true;           // vor dem Fix 120 kg, danach 100 kg
    const short = [...wk(9, 120), ...wk(3, 100, 9)]; short[9].fix = true;       // nach dem Fix erst 3 Wochen
    const g = strengthGains({ sessions: { fix, short, often: wk(3, 100, 0, 3), weekly: wk(4, 100) } }, ['fix', 'short', 'often', 'weekly'], { from: 0, to: 99999 });
    return g.map(x => `${x.id}:${round(x.gain, 1)}/${x.weeks}`).join(' ');
  });
  check(kf === 'fix:0/6 weekly:0/4', 'Kraftzuwachs: ab dem Form-Fix, erst ab 4 Trainingswochen je Übung', kf);
  // Blasse Anteile (z. B. mitgeholfene Sätze) auch bei „Hoher Kontrast“, wo Farben als color-mix() kommen
  const al = await page.evaluate(() => [alpha('color-mix(in srgb, #000000 50%, #ffffff)', .3), alpha('#ff0000', .5)]);
  check(/^rgba\(12[78], 12[78], 12[78], 0\.3\)$/.test(al[0]) && al[1] === 'rgba(255, 0, 0, 0.5)', 'Diagramme: blasse Anteile auch bei „Hoher Kontrast“ (color-mix wird aufgelöst)', al.join(' | '));
  // 3. Pausen-Leiste: Nach jedem Satz bleibt der nächste Satz samt „Satz erledigt“ sichtbar über der Leiste
  await page.evaluate(() => {
    Store.put('templates', 'taz', { name: 'Brust', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 8, reps: '8', restSec: 90, notes: '' }], createdAt: Date.now() });
    Store.saveSettings({ autoRest: true, autoScroll: true, finishConfirm: 'never' });
    Workout.start({ templateId: 'taz' });
  });
  await pause(page, 600);
  const covered = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(si => {
      Workout.set(w => Object.assign(w.entries[0].sets[si], { weightKg: 60, reps: 8 }));
      App.renderCurrent();
      [...document.querySelectorAll(`#tab-training [data-act="setDone"][data-ei="0"][data-si="${si}"]`)].find(n => n.offsetParent).click();
    }, i);
    await pause(page, 800);
    const r = await page.evaluate(() => {
      const sel = Workout.cur().sel, dock = document.querySelector('.rest-dock:not(.leaving)');
      if (!dock || sel.e < 0) return null;
      const q = `[data-ei="${sel.e}"][data-si="${sel.s}"]`;
      const bottom = Math.max(...[...document.querySelectorAll(`#tab-training .set-row${q}, #tab-training [data-act="setDone"]${q}`)].filter(n => n.offsetParent).map(n => n.getBoundingClientRect().bottom));
      return { s: sel.s, bottom: Math.round(bottom), dock: Math.round(dock.getBoundingClientRect().top) };
    });
    if (r && r.bottom > r.dock) covered.push(r);
  }
  check(!covered.length, 'Pausen-Leiste verdeckt den nächsten Satz nicht (6 Sätze nacheinander)', JSON.stringify(covered));
  // Nur noch die schlichte Eingabe – Plan-Notiz, Steigerungs-Hinweis und Menü-Funktionen bleiben erreichbar
  const one = await page.evaluate(async () => {
    Workout.discard();
    Store.put('templates', 'tnote', { name: 'Notiz', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 2, reps: '5', restSec: 90, notes: 'Schulterblätter zusammen' }], createdAt: Date.now() });
    Workout.start({ templateId: 'tnote' });
    Workout.set(w => { w.entries[0].suggestion = { type: 'up', weightKg: 82.5, text: 'Mehr Gewicht: 82,5 kg' }; });
    App.renderCurrent();
    await new Promise(r => setTimeout(r, 300));
    const tab = document.querySelector('#tab-training');
    const menu = [];
    const orig = window.actionMenu;
    window.actionMenu = async (t, items) => { menu.push(...items.filter(Boolean).flatMap(i => i.items || [i]).filter(Boolean).map(i => i.key)); return null; };
    await Actions.woMore(); await Actions.exMenu({ dataset: { ei: 0 } });
    window.actionMenu = orig;
    return { note: tab.innerText.includes('Schulterblätter zusammen'), up: /82,5 kg ↑/.test(tab.innerText), detailed: !!tab.querySelector('.set-head .rpe-h, .wo-strip, .ex-goal, .set-panel'),
      menu: menu.join(','), settings: !!document.querySelector('[data-seg="woStyle"]') };
  });
  check(one.note && one.up && !one.detailed && !/style/.test(one.menu) && /notes/.test(one.menu) && /warm/.test(one.menu) && /plates/.test(one.menu) && /drop/.test(one.menu),
    'Nur eine Workout-Eingabe: Plan-Notiz und Steigerung sichtbar, Aufwärmen/Scheiben/Drop-Satz/Notiz im Menü', JSON.stringify(one));
  const mig = await page.evaluate(async () => {
    Store.saveSettings({ woStyle: 'detailed', simpleRPE: false, seedVersion: 7 });
    ensureSeeds();
    await new Promise(r => setTimeout(r, 200));
    return { rpe: S().simpleRPE, v: S().seedVersion };
  });
  check(mig.rpe === true && mig.v >= 8, 'Umzug: wer „Ausführlich“ mit RPE hatte, behält die RPE-Eingabe als Spalte', JSON.stringify(mig));
  await page.evaluate(() => { Workout.discard(); Workout.start({ templateId: 'taz' }); App.renderCurrent(); });
  await pause(page, 300);
  // Workout-Kopf auf dem Handy deckend: darunter gescrollte Übungen scheinen in keinem Design durch
  const see = await page.evaluate(async () => {
    const out = [];
    for (const d of DESIGNS) for (const m of d.phased ? ['dark'] : ['light', 'dark']) {
      Store.saveSettings({ design: d.id, theme: m }); applyTheme();
      await new Promise(r => setTimeout(r, 60));
      const h = document.querySelector('.wo-head');
      if (!h) { out.push(d.id + ': kein Kopf'); continue; }
      // Deckkraft aus rgb(a)(…) oder color(srgb … / a) lesen
      const c = getComputedStyle(h).backgroundColor, sl = c.match(/\/\s*([\d.]+)\s*\)$/), rg = c.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      const alpha = c === 'transparent' ? 0 : sl ? +sl[1] : rg ? +rg[1] : 1;
      if (alpha < 1) out.push(`${d.id}·${m} ${c}`);
    }
    Store.saveSettings({ design: 'gymlog', theme: 'dark' }); applyTheme();
    return out;
  });
  check(!see.length, 'Workout-Kopf auf dem Handy in allen Designs deckend (nichts scheint durch)', see.join(', '));
  const timed = await page.evaluate(() => {
    const work = { durationSec: 45, done: true };
    Store.put('workouts', 'timed_detail', { name: 'Core', date: isoDate(), durationSec: 300, entries: [
      { exerciseId: 'ex_plank', sets: [work, work, work, { durationSec: 60, warmup: true }, { durationSec: 80, done: false }] },
      { exerciseId: 'ex_side_plank', uni: true, sets: [{ durationSec: 20, durationSecR: 30, weightKg: 5 }, { durationSec: 15, durationSecR: 25 }] }
    ] });
    openWorkoutDetail('timed_detail');
    return [...document.querySelectorAll('.modal-wrap:not(.closing) .table-wrap')].map(wrap => ({
      title: wrap.parentElement.querySelector('.row .tiny').textContent,
      cols: [...wrap.querySelectorAll('th')].map(th => th.textContent).join('|'),
      aligned: [...wrap.querySelectorAll('tbody tr')].every(tr => tr.cells.length === wrap.querySelectorAll('th').length)
    }));
  });
  check(timed.length === 2 && timed[0].title === '3 × 45 s' && timed[0].cols === 'Satz|Zeit'
    && timed[1].title === '90 s gesamt' && timed[1].cols === 'Satz|Zeit L/R|kg' && timed.every(t => t.aligned),
    'Zeitübungen: nur Arbeitssätze summiert, beide Seiten und Zusatzgewicht berücksichtigt', JSON.stringify(timed));
  const photos = await page.evaluate(async () => {
    const wo = { name: 'Cardio', date: isoDate(), durationSec: 1800, entries: [
      { exerciseId: 'ex_stepper', sets: [{ durationSec: 1800, done: true }] }
    ] };
    Store.put('workouts', 'share_time', wo);
    const proto = CanvasRenderingContext2D.prototype, draw = proto.fillText;
    const labels = [];
    proto.fillText = function (label, ...args) { labels.push(String(label).toLowerCase()); return draw.call(this, label, ...args); };
    try {
      const time = await shareImage({ ...wo, id: 'share_time' });
      const timeOnly = time.size > 0 && labels.includes('cardio') && !labels.includes('distanz');
      labels.length = 0;
      const run = await shareImage({ ...Store.raw('workouts', 'az3'), id: 'az3' });
      return timeOnly && run.size > 0 && labels.includes('distanz');
    } finally { proto.fillText = draw; }
  });
  check(photos, 'Teilen-Bild: Distanz nur mit aufgezeichneter Strecke');
  await page.evaluate(() => Workout.discard ? Workout.discard() : null);
}

module.exports = anzeigeFlow;
