/* Trainio – Testversion des Umbaus (…/test/)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen.
   Nur aktiv, wenn TESTVERSION (js/core.js) gilt: Dort hat die App eigenen Speicher, kein Firebase und startet mit
   Beispieldaten – 10 Wochen Push/Pull/Beine, Körpergewicht und eine Bulk-Phase. Siehe docs/redesign/ANFORDERUNGEN.md. */
'use strict';

const Testversion = (() => {
  const WEEKS = 10;
  // Tag: [Name, Wochentag (0 = Mo), Übungen: [ID, Wdh.-Bereich, Startgewicht kg, Steigerung alle 2 Wochen]]
  const DAYS = [
    ['Push', 0, [['bankdruecken', '6-8', 70, 2.5], ['schraegbank_kh', '8-10', 24, 2], ['military_press', '6-8', 42.5, 1.25],
      ['seitheben', '12-15', 9, 1], ['trizeps_kabel', '10-12', 25, 2.5]]],
    ['Pull', 2, [['lh_rudern', '6-8', 65, 2.5], ['latzug', '8-10', 60, 2.5], ['kabelrudern', '10-12', 55, 2.5],
      ['face_pull', '12-15', 20, 1.25], ['curl_kh', '10-12', 12, 1]]],
    ['Beine', 4, [['kniebeuge', '5-7', 90, 2.5], ['rdl', '8-10', 80, 2.5], ['beinpresse', '10-12', 160, 5],
      ['beincurl_sitzend', '10-12', 45, 2.5], ['waden_stehend', '12-15', 70, 2.5]]]
  ];
  // Fester Zufall: die Beispieldaten sehen nach jedem Neuladen gleich aus
  const rng = (a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; });

  function build() {
    const rnd = rng(42), ops = [], put = (coll, id, doc) => ops.push({ type: 'put', coll, id, doc, replace: true });
    const now = new Date(), today = isoDate(now);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) - (WEEKS - 1) * 7);
    const day = n => new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);
    const tplId = name => 'tpl_bsp_' + name.toLowerCase();
    const exName = id => (Store.raw('exercises', 'ex_' + id) || {}).name || id;

    const schedule = Array(7).fill(null);
    for (const [name, wd, exs] of DAYS) {
      schedule[wd] = tplId(name);
      put('templates', tplId(name), { name, exercises: exs.map(([id, reps], i) => ({ exerciseId: 'ex_' + id, sets: 3, reps, restSec: i < 2 ? 150 : 90, notes: '' })), createdAt: start.getTime() });
    }
    put('plans', 'plan_bsp', { name: 'Push · Pull · Beine', schedule, isCustom: true, createdAt: start.getTime() });

    for (let w = 0; w < WEEKS; w++) for (const [name, wd, exs] of DAYS) {
      const d = day(w * 7 + wd);
      if (isoDate(d) >= today || rnd() < 0.08) continue;   // Zukunft und ab und zu ein ausgelassenes Training
      const startedAt = d.getTime() + (17 * 60 + Math.round(rnd() * 90)) * 60000;
      const durationSec = Math.round((52 + rnd() * 20) * 60);
      const entries = exs.map(([id, range, kg, step]) => {
        const [lo, hi] = range.split('-').map(Number);
        const weightKg = Math.round((kg + step * Math.floor(w / 2)) * 4) / 4;
        const reps = Math.min(hi, lo + (w % 2) + (rnd() < 0.3 ? 1 : 0));
        return { exerciseId: 'ex_' + id, exerciseName: exName(id), sets: [0, 1, 2].map(i => ({
          reps: i === 2 && rnd() < 0.5 ? reps - 1 : reps, weightKg, rpe: i === 2 ? 8 + 0.5 * Math.floor(rnd() * 3) : null, done: true })) };
      });
      put('workouts', `wo_bsp_${w}_${wd}`, { date: isoDate(d), startedAt, endedAt: startedAt + durationSec * 1000, durationSec, planId: 'plan_bsp',
        planDayIndex: wd, planDayName: name, templateId: tplId(name), name, notes: '', bodyWeightKg: null, entries,
        createdAt: startedAt + durationSec * 1000, updatedAt: startedAt + durationSec * 1000 });
    }

    // Körpergewicht alle 2–3 Tage, Lean Bulk mit gut 0,2 kg pro Woche
    for (let n = 0; ; n += rnd() < 0.5 ? 2 : 3) {
      const d = day(n), date = isoDate(d);
      if (date >= today) break;
      const t = d.getTime() + 7 * 3600000;
      put('progress', 'bw_bsp_' + n, { date, bodyWeightKg: Math.round((76 + 0.03 * n + (rnd() - 0.5) * 0.8) * 10) / 10, bodyFatPct: null,
        measurements: null, photoUrl: null, photoId: null, notes: '', createdAt: t, updatedAt: t });
    }
    return { ops, settings: { activePlanId: 'plan_bsp', testSeeded: true,
      phases: [{ id: 'ph_bsp', name: 'Bulk', type: 'bulk', from: isoDate(start), to: '', rateMin: null, rateMax: null }] } };
  }

  /** Alles in der Testversion löschen und die Beispieldaten neu anlegen (Einstellungen wie Design bleiben). */
  async function load() {
    Workout.discard();
    const ops = [];
    for (const c of COLLS) for (const d of Store.all(c)) if (!(c === 'meta' && d.id === 'settings')) ops.push({ type: 'del', coll: c, id: d.id });
    ops.push(...seedExerciseDocs().map(e => ({ type: 'put', coll: 'exercises', id: e.id, doc: e, replace: true })));
    await Store.batch(ops);
    const b = build();
    await Store.batch(b.ops);
    Store.saveSettings({ ...b.settings, seedVersion: SEED_VERSION });
    await PR.recalcAll();
  }

  /** Erster Start der Testversion: Beispieldaten anlegen */
  async function boot() {
    if (TESTVERSION && !S().testSeeded) await load();
  }

  const card = (cls = '') => `<div class="card ${cls}">
      <div class="acc-card">
        <div class="avatar">${icon('refresh')}</div>
        <div class="grow"><div class="bold">Testversion</div><div class="small dim">Beispieldaten, getrennt von deinen echten Daten</div></div>
      </div>
      <button class="btn btn-secondary btn-block mt-12" data-act="testReload">Beispieldaten neu laden</button>
    </div>`;

  return { boot, load, card };
})();

Actions.testReload = async () => {
  if (!await confirmDialog({ title: 'Beispieldaten neu laden?', text: 'Alles in der Testversion wird zurückgesetzt. Deine echten Daten bleiben unberührt.', okLabel: 'Neu laden' })) return;
  await Testversion.load();
  try { localStorage.removeItem(LS.ui); } catch (e) {}
  toast('Beispieldaten neu geladen', 'success');
  App.go('start');
};
