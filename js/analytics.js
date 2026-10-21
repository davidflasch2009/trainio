/* Trainio – Übungs-Helfer, Auswertungen, Rekorde
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   6. Übungs-Helfer, Analytics-Engine, PR-Berechnung
   ========================================================================== */
const e1rm = (w, r) => (w > 0 && r >= 1) ? w * (1 + r / 30) : 0;  // Epley

/* ---------- Einseitig (unilateral): reps/durationSec = links, repsR/durationSecR = rechts ---------- */
const UNI_DEFAULT = new Set(['kh_rudern', 'konzentrations_curl', 'bulgarian', 'side_plank', 'landmine_press', 'trizeps_einarmig', 'meadows_row',
  'latzug_einarmig', 'beinpresse_einbeinig', 'reverse_lunge', 'step_up', 'pistol_squat', 'rdl_einbeinig', 'beincurl_stehend', 'kabel_kickback',
  'copenhagen_plank', 'waden_einbeinig', 'sandbag_carry',
  'kabel_fly_einarmig', 'seitheben_lean_away', 'aussenrotation_kabel', 'aussenrotation_kh', 'kickback_kabel', 'kabelrudern_einarmig', 'preacher_kh', 'kabel_curl_einarmig', 'split_squat_multipresse', 'hip_thrust_einbeinig', 'seitl_ausfall', 'curtsy_lunge', 'cossack_squat', 'abduktion_kabel', 'adduktion_kabel', 'beinstrecker_einbeinig', 'beincurl_einbeinig', 'glute_maschine', 'kh_rdl_einbeinig_kabel', 'oblique_rotation', 'kabel_crunch_seitlich', 'side_bend_roman', 'kb_windmill', 'kb_press', 'kb_row'].map(x => EX_PREFIX + x));
/** Wdh. für Kraftwerte (e1RM, PR): bei einseitigen Sätzen zählt die schwächere Seite */
const repsOf = s => s.repsR != null ? Math.min(+s.reps || 0, +s.repsR || 0) : +s.reps || 0;
/** Wdh. für Volumen: beide Seiten */
const repsSum = s => (+s.reps || 0) + (s.repsR != null ? +s.repsR || 0 : 0);
const setVol = s => repsSum(s) * (+s.weightKg || 0);
/** „10" bzw. „10/8" (links/rechts) – für gespeicherte Sätze */
const repsTxt = s => s.repsR != null ? `${s.reps ?? 0}/${s.repsR}` : `${s.reps ?? '–'}`;
const secTxt = s => s.durationSecR != null ? `${fmtClock(s.durationSec || 0)}/${fmtClock(s.durationSecR)}` : fmtClock(s.durationSec || 0);

/* ---------- Cardio: Dauer + Distanz (km/h berechnet) bzw. Dauer + Stufe ---------- */
/* Modus je Art: dist = Dauer + Distanz (+ optional Stufe/Steigung), level = Dauer + Stufe, time = nur Dauer */
const CARDIO_CFG = {
  laufen: ['dist', 'Steigung'], laufband: ['dist', 'Steigung'], laufband_steigung: ['dist', 'Steigung'],
  laufen_draussen: ['dist'], sprints: ['dist'], spazieren: ['dist'], wandern: ['dist'], nordic_walking: ['dist'], rucking: ['dist'],
  fahrrad: ['dist', 'Stufe'], spinning: ['dist', 'Stufe'], liegeergometer: ['dist', 'Stufe'], radfahren: ['dist'], mountainbike: ['dist'],
  rudergeraet: ['dist', 'Stufe'], skierg: ['dist', 'Stufe'], crosstrainer: ['dist', 'Stufe'], assault_bike: ['dist'],
  rudern_boot: ['dist'], kajak: ['dist'], sup: ['dist'], schwimmen: ['dist'], inlineskaten: ['dist'], skilanglauf: ['dist'],
  stepper: ['level', 'Stufe'], treppensteigen: ['level', 'Etagen'], jump_rope: ['level', 'Stufe'], hiit: ['level', 'Stufe'],
  tabata: ['level', 'Stufe'], zirkeltraining: ['level', 'Stufe'], battle_ropes: ['level', 'Stufe'], sled_push: ['level', 'Gewicht'],
  step_aerobic: ['level', 'Stufe'], trampolin: ['level', 'Stufe'], boxsack: ['level', 'Stufe'], schattenboxen: ['level', 'Stufe'],
  aquajogging: ['time'], kampfsport: ['time'], tanzen: ['time'], klettern: ['time'], fussball: ['time'], basketball: ['time'],
  handball: ['time'], volleyball: ['time'], tennis: ['time'], badminton: ['time'], squash: ['time'], tischtennis: ['time']
};
/** { mode, lvl } – lvl = Bezeichnung des Stufen-Felds oder null (kein Feld) */
function cardioInfo(ex) {
  if (!ex) return { mode: 'level', lvl: 'Stufe' };
  const base = cardioBase(ex);
  if (ex.cardioMode && ex.cardioMode !== base.mode) return { mode: ex.cardioMode, lvl: ex.cardioMode === 'time' ? null : base.lvl || 'Stufe' };
  return base;
}
function cardioBase(ex) {
  const c = CARDIO_CFG[String(ex.id || '').replace(/^ex_/, '')];
  if (c) return { mode: c[0], lvl: c[1] || null };
  const n = norm([ex.name, ...(ex.aliases || [])].join(' '));
  if (/(fußball|fussball|soccer|basketball|handball|volleyball|tennis|badminton|squash|klettern|boulder|tanz|dance|zumba|kampf|boxen|yoga|golf|hockey)/.test(n)) return { mode: 'time', lvl: null };
  if (/(laufband|treadmill)/.test(n)) return { mode: 'dist', lvl: 'Steigung' };
  if (/(ergometer|bike|rad|cycl|spinning|ruder|row|ski|crosstrainer|elliptical)/.test(n)) return { mode: 'dist', lvl: 'Stufe' };
  if (/(lauf|run|jog|geh|walk|wander|hike|schwimm|swim|skat|paddel|kajak|kanu)/.test(n)) return { mode: 'dist', lvl: null };
  return { mode: 'level', lvl: 'Stufe' };
}
const lvlUnit = lvl => lvl === 'Steigung' ? ' %' : lvl === 'Gewicht' ? ' kg' : '';
const fmtKm = km => nf(km, km < 100 ? 2 : 1) + ' km';
const fmtKmh = v => nf(v, 1) + ' km/h';
/** km/h nur bei sinnvoller Strecke & Dauer werten (keine Ausreißer aus Tippfehlern) */
const cardioKmhValid = (km, sec) => km >= 0.1 && sec >= 60 && km / (sec / 3600) < 80;
/** Dauer-Eingabe: „30" = 30 min, „30,5" = 30:30, „30:15" = 30 min 15 s, „1:05:00" = 1 h 5 min */
function parseDur(v) {
  const t = String(v ?? '').trim();
  if (!t) return null;
  if (t.includes(':')) {
    const p = t.split(':').map(x => parseInt(x, 10) || 0);
    const sec = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + (p[1] || 0);
    return sec > 0 ? sec : null;
  }
  const n = parseNum(t);
  return n != null && n > 0 ? Math.round(n * 60) : null;
}
/** Dauer fürs Eingabefeld: ganze Minuten als „30", sonst „30:15" */
const durIn = sec => sec == null ? '' : sec % 60 ? fmtClock(sec) : String(Math.round(sec / 60));
function cardioTotals(sets) {
  let sec = 0, km = 0, secT = 0, kmT = 0, n = 0, lvl = null;
  for (const s of sets || []) {
    if (!s || s.warmup || s.done === false) continue;
    const a = +s.durationSec || 0, b = +s.distKm || 0;
    if (!a && !b) continue;
    n++; sec += a; km += b;
    if (a && b) { secT += a; kmT += b; }
    if (s.level != null && (lvl == null || +s.level > lvl)) lvl = +s.level;
  }
  return { sec, km, secT, kmT, n, lvl, kmh: cardioKmhValid(kmT, secT) ? kmT / (secT / 3600) : 0 };
}
/** Kurztext einer Cardio-Einheit/eines Abschnitts: „30 min · 3,20 km · 6,4 km/h · St. 8" */
function cardioTxt(x, info) {
  const sec = x.sec ?? x.durationSec, km = x.km ?? x.distKm, lv = x.lvl !== undefined ? x.lvl : x.level;
  const parts = [];
  if (sec) parts.push(sec % 60 ? fmtClock(sec) + ' min' : fmtDur(sec));
  if (km) parts.push(fmtKm(+km));
  if (km && sec && cardioKmhValid(+km, +sec)) parts.push(fmtKmh(km / (sec / 3600)));
  if (lv != null && info && info.lvl) parts.push(`${info.lvl} ${nf(+lv, 1)}${lvlUnit(info.lvl)}`);
  return parts.join(' · ') || '–';
}
/** dasselbe für Einträge aus dem Analytics-Index ({ r, sec, u: [L, R], us: [L, R] }) */
const prevR = p => p.u ? p.u.join('/') : p.r;
const prevSec = p => p.us ? `${fmtClock(p.us[0])}/${fmtClock(p.us[1])}` : fmtClock(p.sec || 0);

const Ex = {
  get: id => Store.raw('exercises', id),
  name: id => (Store.raw('exercises', id) || {}).name || (Store.raw('prs', id) || {}).exerciseName || 'Unbekannte Übung',
  /** Name für einen Workout-Eintrag: aktueller Bibliotheksname, sonst Snapshot */
  entryName: en => (Store.raw('exercises', en.exerciseId) || {}).name || en.exerciseName || 'Übung',
  type: ex => !ex ? 'kg' : ex.defaultUnit === 'cardio' || (ex.category === 'Cardio' && ex.defaultUnit === 'sec') ? 'cardio' : ex.defaultUnit === 'sec' ? 'sec' : ex.defaultUnit === 'reps' ? 'reps' : 'kg',
  /** Standard: einseitig (links/rechts getrennt)? */
  isUni: ex => !!ex && (ex.unilateral != null ? !!ex.unilateral : UNI_DEFAULT.has(ex.id)),
  sorted: () => Store.all('exercises').slice().sort((a, b) => a.name.localeCompare(b.name, 'de')),
  /** Case-insensitiver Lookup auf Name + Aliase */
  findByName(name) {
    const n = norm(name);
    if (!n) return null;
    const all = Store.all('exercises');
    const exact = all.find(e => norm(e.name) === n) || all.find(e => (e.aliases || []).some(a => norm(a) === n));
    if (exact) return exact;
    // Fallback: gleiche Wörter in anderer Reihenfolge, Klammern/Bindestriche egal
    // („Triceps Pushdown (Rope)" = „Triceps Rope Pushdown")
    const k = wordKey(name);
    return all.find(e => [e.name, ...(e.aliases || [])].some(a => wordKey(a) === k)) || null;
  }
};
function exMeta() {
  const m = {};
  for (const e of Store.all('exercises')) m[e.id] = { category: e.category, muscleGroups: e.muscleGroups || [], defaultUnit: e.defaultUnit, cardio: Ex.type(e) === 'cardio' };
  return m;
}

/**
 * Baut den Analytics-Index aus allen Workouts. Bewusst „pure" und ohne Zugriff
 * auf äußere Variablen, damit die Funktion auch als Web Worker laufen kann.
 */
function buildIndex(W, EX) {
  const dnOf = s => { const p = String(s).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  const e1 = (w, r) => (w > 0 && r >= 1) ? w * (1 + r / 30) : 0;
  const ws = W.filter(w => w && typeof w.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.date)).slice()
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.startedAt || 0) - (b.startedAt || 0));
  const rows = [], sessions = {}, prEvents = [], runBest = {};
  for (const w of ws) {
    const dn = dnOf(w.date);
    const row = {
      id: w.id, date: w.date, dn, name: w.planDayName || w.name || 'Freies Workout', startedAt: w.startedAt || null,
      dur: w.durationSec || 0, ton: 0, sets: 0, reps: 0, rpeSum: 0, rpeN: 0, rpeVol: 0, planned: 0, done: 0,
      cSec: 0, cKm: 0, cBy: {}, cardioOnly: false,
      muscles: {}, mP: {}, mS: {}, cats: {}, bins: [0, 0, 0, 0], restAvg: null, avgRpe: null, ex: [], exVol: {}, exSets: {}, exReps: {}, imp: !!w.importId,
      bw: w.bodyWeightKg || null, planId: w.planId || null, estDur: !!w.durationEstimated
    };
    const times = [];
    for (const en of (w.entries || [])) {
      const exId = en && en.exerciseId;
      if (!exId) continue;
      const meta = EX[exId] || {};
      // Cardio: eigene Kennzahlen (Dauer, Distanz, km/h) – zählt nicht in Kraft-Statistiken
      if (meta.cardio) {
        let cs = 0, ck = 0, ckT = 0, cn = 0, lvl = 0;
        const cl = [];
        for (const s of (en.sets || [])) {
          if (!s || s.done === false) continue;
          const sec = +s.durationSec || 0, km = +s.distKm || 0;
          if (!sec && !km) continue;
          cn++; cs += sec; ck += km; if (km && sec) ckT += sec;
          if (+s.level > lvl) lvl = +s.level;
          if (s.doneAt) times.push(s.doneAt);
          cl.push({ sec, km, lvl: s.level != null ? +s.level : null });
        }
        if (!cn) continue;
        row.cSec += cs; row.cKm += ck;
        const cb = row.cBy[exId] || (row.cBy[exId] = { sec: 0, km: 0 });
        cb.sec += cs; cb.km += ck;
        const kmTimed = cl.filter(x => x.km && x.sec).reduce((a, x) => a + x.km, 0);
        const sess = { wid: w.id, date: w.date, dn, cardio: true, secs: cs, km: ck, kmh: ckT ? kmTimed / (ckT / 3600) : 0, lvl, list: cl, best: 0, bestSet: null, maxW: 0, repsAtMax: 0, vol: 0, sets: cn, reps: 0 };
        (sessions[exId] || (sessions[exId] = [])).push(sess);
        continue;
      }
      let best = 0, bestSet = null, maxW = 0, repsAtMax = 0, vol = 0, n = 0, reps = 0, secs = 0;
      const list = [];
      for (const s of (en.sets || [])) {
        if (!s || s.warmup) continue;
        row.planned++;
        if (s.done === false) continue;
        row.done++;
        // Einseitige Sätze: Kraftwerte mit der schwächeren Seite, Volumen mit beiden Seiten
        const uniS = s.repsR != null || s.durationSecR != null;
        const rL = +s.reps || 0, rR = s.repsR != null ? +s.repsR || 0 : rL;
        const sL = +s.durationSec || 0, sR = s.durationSecR != null ? +s.durationSecR || 0 : sL;
        const r = uniS ? Math.min(rL, rR) : rL, rT = uniS ? rL + rR : rL;
        const wt = +s.weightKg || 0, sec = uniS ? Math.min(sL, sR) : sL;
        n++; reps += rT; secs += uniS ? sL + sR : sL;
        const v = rT * wt;
        vol += v;
        if (s.rpe) { row.rpeSum += +s.rpe; row.rpeN++; row.rpeVol += v * (+s.rpe) / 10; }
        if (s.doneAt) times.push(s.doneAt);
        const e = e1(wt, r);
        if (e > best) { best = e; bestSet = { w: wt, r }; }
        if (r >= 1) {
          if (wt > maxW) { maxW = wt; repsAtMax = r; }
          else if (wt === maxW && r > repsAtMax) repsAtMax = r;
        }
        if (r > 0) row.bins[r <= 5 ? 0 : r <= 10 ? 1 : r <= 15 ? 2 : 3]++;
        // Erster Muskel = Hauptmuskel (direkter Satz), weitere = helfen mit (z. B. Bizeps beim Klimmzug)
        (meta.muscleGroups || []).forEach((m, i) => { row.muscles[m] = (row.muscles[m] || 0) + 1; const t = i ? row.mS : row.mP; t[m] = (t[m] || 0) + 1; });
        const cat = meta.category || 'Full Body';
        row.cats[cat] = (row.cats[cat] || 0) + 1;
        list.push(uniS ? { r, w: wt, rpe: s.rpe || null, sec, u: [rL, rR], us: [sL, sR] } : { r, w: wt, rpe: s.rpe || null, sec });
      }
      if (!n) continue;
      row.sets += n; row.reps += reps; row.ton += vol;
      row.exVol[exId] = (row.exVol[exId] || 0) + vol;
      row.exSets[exId] = (row.exSets[exId] || 0) + n;
      row.exReps[exId] = (row.exReps[exId] || 0) + reps;
      if (row.ex.indexOf(exId) < 0) row.ex.push(exId);
      const sess = { wid: w.id, date: w.date, dn, best, bestSet, maxW, repsAtMax, vol, sets: n, reps, secs, list };
      (sessions[exId] || (sessions[exId] = [])).push(sess);
      if (best > 0) {
        if (runBest[exId] === undefined) runBest[exId] = best;
        else if (best > runBest[exId] + 1e-9) {
          prEvents.push({ exId, wid: w.id, date: w.date, dn, e1rm: best, w: bestSet.w, r: bestSet.r, prev: runBest[exId] });
          runBest[exId] = best;
        }
      }
    }
    times.sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < times.length; i++) { const g = (times[i] - times[i - 1]) / 1000; if (g >= 15 && g <= 600) gaps.push(g); }
    if (gaps.length) row.restAvg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    row.avgRpe = row.rpeN ? row.rpeSum / row.rpeN : null;
    row.cardioOnly = !row.done && (row.cSec > 0 || row.cKm > 0);
    rows.push(row);
  }
  return { rows, sessions, prEvents, builtAt: Date.now() };
}

const Analytics = (() => {
  let idx = null, key = '', computing = false;
  let bw = null, bwKey = '';
  function cur() {
    const k = Store.ver('workouts') + ':' + Store.ver('exercises');
    if (idx && k === key) return idx;
    const W = Store.all('workouts');
    // Große Datenmengen (> 500 Workouts) im Web Worker neu rechnen, UI nicht blockieren
    if (idx && W.length > 500 && window.Worker && window.Blob) {
      if (!computing) runWorker(W, exMeta(), k);
      return idx;
    }
    idx = buildIndex(W, exMeta());
    key = k;
    return idx;
  }
  function runWorker(W, EX, k) {
    computing = true;
    let url;
    try {
      url = URL.createObjectURL(new Blob([`${buildIndex.toString()}\nonmessage = e => postMessage(buildIndex(e.data.W, e.data.EX));`], { type: 'text/javascript' }));
      const wk = new Worker(url);
      wk.onmessage = e => { idx = e.data; key = k; computing = false; wk.terminate(); URL.revokeObjectURL(url); scheduleRender(); };
      wk.onerror = () => { computing = false; wk.terminate(); URL.revokeObjectURL(url); idx = buildIndex(W, EX); key = k; scheduleRender(); };
      wk.postMessage({ W, EX });
    } catch (e) {
      computing = false;
      idx = buildIndex(W, EX); key = k;
    }
  }
  /** Körpergewicht-Zeitreihe aus Fortschritt + Workouts */
  function bwSeries() {
    const k = Store.ver('progress') + ':' + Store.ver('workouts');
    if (bw && k === bwKey) return bw;
    const m = new Map();
    for (const w of Store.all('workouts')) if (w.bodyWeightKg > 0 && isISO(w.date)) m.set(dayNum(w.date), +w.bodyWeightKg);
    for (const p of Store.all('progress')) if (p.bodyWeightKg > 0 && isISO(p.date)) m.set(dayNum(p.date), +p.bodyWeightKg);
    bw = [...m.entries()].map(([dn, kg]) => ({ dn, kg })).sort((a, b) => a.dn - b.dn);
    bwKey = k;
    return bw;
  }
  function bwAt(dn) {
    const s = bwSeries();
    if (!s.length) return null;
    let lo = 0, hi = s.length - 1, ans = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (s[mid].dn <= dn) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans >= 0 ? s[ans].kg : s[0].kg;
  }
  const sessionsOf = exId => cur().sessions[exId] || [];

  /** Zeitraum aus globalem Filter */
  function range() {
    const t = todayDN();
    const days = { '4w': 28, '3m': 91, '6m': 182, '1y': 365 }[UI.period];
    if (days) return { from: t - days + 1, to: t, len: days };
    const ph = String(UI.period || '').startsWith('ph:') ? phaseById(UI.period.slice(3)) : null;
    if (ph) { const a = dayNum(ph.from), b = Math.min(t, ph.to ? dayNum(ph.to) : t); return { from: a, to: Math.max(a, b), len: Math.max(a, b) - a + 1, phase: ph }; }
    if (UI.period === 'custom' && isISO(UI.customFrom) && isISO(UI.customTo)) {
      const a = dayNum(UI.customFrom), b = dayNum(UI.customTo);
      return { from: Math.min(a, b), to: Math.max(a, b), len: Math.abs(b - a) + 1, custom: true };
    }
    const rows = cur().rows;
    const first = rows.length ? Math.min(rows[0].dn, t) : t - 27;
    return { from: first, to: t, len: t - first + 1, all: true };
  }
  const prevRange = r => r.all ? null : { from: r.from - r.len, to: r.from - 1, len: r.len };
  const rowsIn = r => r ? cur().rows.filter(w => w.dn >= r.from && w.dn <= r.to) : [];
  function weeksOf(r) {
    const out = [];
    for (let w = weekStartDN(r.from); w <= r.to; w += 7) out.push(w);
    return out;
  }
  /** Wochen-Streak: aufeinanderfolgende Wochen mit ≥ 1 Workout */
  function streak() {
    const rows = cur().rows.filter(r => !r.cardioOnly);
    const weeks = new Set(rows.map(w => weekStartDN(w.dn)));
    const cw = weekStartDN(todayDN());
    let curS = 0;
    let w = weeks.has(cw) ? cw : cw - 7;
    while (weeks.has(w)) { curS++; w -= 7; }
    let best = 0, run = 0, prev = null;
    for (const x of [...weeks].sort((a, b) => a - b)) { run = prev !== null && x - prev === 7 ? run + 1 : 1; best = Math.max(best, run); prev = x; }
    const thisWeekDays = new Set(rows.filter(r => r.dn >= cw).map(r => r.dn));
    return { cur: curS, best, thisWeek: rows.filter(r => r.dn >= cw).length, days: thisWeekDays };
  }
  /** Letzter Tag für Vergleiche „bis zum gleichen Tag“: heute erst, wenn heute ein Workout gespeichert ist – sonst bis gestern */
  function cmpEnd() { const t = todayDN(); return cur().rows.some(w => w.dn === t) ? t : t - 1; }
  function volumeBetween(a, b) { return sum(cur().rows.filter(w => w.dn >= a && w.dn <= b).map(w => w.ton)); }
  /** Nächstes geplantes Workout laut Wochenplan (heute, falls noch nicht trainiert) */
  function nextPlanDay() {
    const p = activePlan(); if (!p) return null;
    const t = todayDN();
    const doneToday = cur().rows.some(r => r.dn === t);
    for (let k = 0; k < 7; k++) {
      const dn = t + k, dow = dowMon(dn), tpl = Tpl.get(p.schedule[dow]);
      if (!tpl || (k === 0 && doneToday)) continue;
      return { plan: p, template: tpl, day: { name: tpl.name, exercises: tpl.exercises }, dow, inDays: k, doneToday };
    }
    return null;
  }
  /** Kompakter Cache für Firestore (meta/analyticsCache) */
  const persistCache = debounce(() => {
    const ix = buildIndex(Store.all('workouts'), exMeta());
    const byWeek = {}, byExerciseId = {}, byMuscle = {};
    for (const w of ix.rows) {
      const k = isoWeekKey(w.dn);
      const b = byWeek[k] || (byWeek[k] = { workouts: 0, tonnage: 0, sets: 0, reps: 0 });
      b.workouts++; b.tonnage = round(b.tonnage + w.ton, 1); b.sets += w.sets; b.reps += w.reps;
      for (const [m, c] of Object.entries(w.muscles)) byMuscle[m] = (byMuscle[m] || 0) + c;
    }
    for (const [id, ss] of Object.entries(ix.sessions)) {
      byExerciseId[id] = { sessions: ss.length, lastDate: ss[ss.length - 1].date, best1RM: round(maxOf(ss, s => s.best), 1), volume: round(sum(ss.map(s => s.vol)), 1) };
    }
    Store.put('meta', 'analyticsCache', { byWeek, byExerciseId, byMuscle, workouts: ix.rows.length, lastRecalc: Date.now() }, { replace: true });
  }, 2500);

  return { cur, bwSeries, bwAt, sessionsOf, range, prevRange, rowsIn, weeksOf, streak, cmpEnd, volumeBetween, nextPlanDay, persistCache };
})();

/* ---------- Personal Records ---------- */
const PR = {
  /** PR-Kennzahlen aus allen Sessions einer Übung */
  compute(exId, ix) {
    const ss = ix.sessions[exId];
    if (!ss || !ss.length) return null;
    if (ss[0].cardio) {
      const c = { durSec: 0, km: 0, kmh: 0 };
      for (const x of ss) { c.durSec = Math.max(c.durSec, x.secs); c.km = Math.max(c.km, x.km); if (cardioKmhValid(x.km, x.secs)) c.kmh = Math.max(c.kmh, x.kmh); }
      return { exerciseId: exId, exerciseName: Ex.name(exId), cardio: true, bestDurSec: c.durSec, bestKm: round(c.km, 3), bestKmh: round(c.kmh, 2), updatedAt: Date.now() };
    }
    let bestW = 0, best1 = 0, bestV = 0, bestR = 0;
    for (const s of ss) { best1 = Math.max(best1, s.best); bestV = Math.max(bestV, s.vol); bestW = Math.max(bestW, s.maxW); }
    for (const s of ss) for (const x of s.list) if (x.r >= 1 && x.w === bestW && x.r > bestR) bestR = x.r;
    return { exerciseId: exId, exerciseName: Ex.name(exId), bestWeightKg: round(bestW, 2), best1RM: round(best1, 1), bestVolume: round(bestV, 1), bestReps: bestR, updatedAt: Date.now() };
  },
  /** Kennzahlen einer einzelnen Session (Workout-Eintrag) */
  ofEntry(entry) {
    let bestW = 0, best1 = 0, vol = 0, bestR = 0, bestSet = null, heavy = null;
    for (const s of entry.sets || []) {
      if (!s || s.warmup || s.done === false) continue;
      const r = repsOf(s), w = +s.weightKg || 0;
      vol += setVol(s);
      const e = e1rm(w, r);
      if (e > best1) { best1 = e; bestSet = { w, r }; }
      if (r >= 1 && (w > bestW || (w === bestW && r > bestR))) { bestW = w; bestR = r; heavy = { w, r }; }
    }
    return { bestW, best1, vol, bestR, bestSet, heavy };
  },
  /** Nach dem Workout: alte Werte vergleichen, nur Verbesserungen schreiben */
  updateAfterWorkout(workout) {
    const results = [];
    const ops = [];
    const seen = new Set();
    for (const en of workout.entries || []) {
      if (!en.exerciseId || seen.has(en.exerciseId)) continue;
      seen.add(en.exerciseId);
      const merged = { ...en, sets: workout.entries.filter(e => e.exerciseId === en.exerciseId).flatMap(e => e.sets || []) };
      if (Ex.type(Ex.get(en.exerciseId)) === 'cardio') {
        const c = cardioTotals(merged.sets);
        if (!c.sec && !c.km) continue;
        const old = Store.raw('prs', en.exerciseId);
        const name = en.exerciseName || Ex.name(en.exerciseId);
        const kmh = cardioKmhValid(c.kmT, c.secT) ? c.kmT / (c.secT / 3600) : 0;
        const cur = { durSec: c.sec, km: c.km, kmh };
        if (!old || !old.cardio) {
          ops.push({ type: 'put', coll: 'prs', id: en.exerciseId, doc: { exerciseId: en.exerciseId, exerciseName: name, cardio: true, bestDurSec: c.sec, bestKm: round(c.km, 3), bestKmh: round(kmh, 2), updatedAt: Date.now() }, replace: true });
          results.push({ exId: en.exerciseId, name, first: true, cardio: cur });
          continue;
        }
        const imp = { dur: c.sec > (old.bestDurSec || 0) + 0.5, km: c.km > (old.bestKm || 0) + 1e-4, kmh: kmh > (old.bestKmh || 0) + 0.005 };
        if (!imp.dur && !imp.km && !imp.kmh) continue;
        ops.push({ type: 'put', coll: 'prs', id: en.exerciseId, doc: { ...old, exerciseName: name, bestDurSec: imp.dur ? c.sec : old.bestDurSec, bestKm: imp.km ? round(c.km, 3) : old.bestKm, bestKmh: imp.kmh ? round(kmh, 2) : old.bestKmh, updatedAt: Date.now() }, replace: true });
        results.push({ exId: en.exerciseId, name, imp, cardio: cur, old });
        continue;
      }
      const s = PR.ofEntry(merged);
      if (!s.bestR && !s.vol) continue;
      const old = Store.raw('prs', en.exerciseId);
      const name = en.exerciseName || Ex.name(en.exerciseId);
      if (!old) {
        ops.push({ type: 'put', coll: 'prs', id: en.exerciseId, doc: { exerciseId: en.exerciseId, exerciseName: name, bestWeightKg: round(s.bestW, 2), best1RM: round(s.best1, 1), bestVolume: round(s.vol, 1), bestReps: s.bestR, updatedAt: Date.now() } });
        results.push({ exId: en.exerciseId, name, first: true, s });
        continue;
      }
      const imp = {
        weight: s.bestW > (old.bestWeightKg || 0) + 1e-6,
        e1rm: s.best1 > (old.best1RM || 0) + 0.05,
        volume: s.vol > (old.bestVolume || 0) + 0.05,
        reps: Math.abs(s.bestW - (old.bestWeightKg || 0)) < 1e-6 && s.bestR > (old.bestReps || 0)
      };
      if (!imp.weight && !imp.e1rm && !imp.volume && !imp.reps) continue;
      const doc = {
        ...old,
        exerciseName: name,
        bestWeightKg: imp.weight ? round(s.bestW, 2) : old.bestWeightKg,
        bestReps: imp.weight ? s.bestR : Math.max(old.bestReps || 0, imp.reps ? s.bestR : 0),
        best1RM: imp.e1rm ? round(s.best1, 1) : old.best1RM,
        bestVolume: imp.volume ? round(s.vol, 1) : old.bestVolume,
        updatedAt: Date.now()
      };
      ops.push({ type: 'put', coll: 'prs', id: en.exerciseId, doc });
      results.push({ exId: en.exerciseId, name, imp, s, old });
    }
    if (ops.length) Store.batch(ops);
    return results;
  },
  /** Text für den PR-Toast */
  label(res) {
    const ex = Ex.get(res.exId);
    if (res.cardio) {
      const c = res.cardio, i = res.imp || {};
      return `${res.name} ${i.kmh ? fmtKmh(c.kmh) : i.km ? fmtKm(c.km) : fmtDur(c.durSec)}`;
    }
    if (res.imp.weight && res.s.heavy) return `${res.name} ${fmtW(res.s.heavy.w)} × ${res.s.heavy.r}`;
    if (res.imp.e1rm && res.s.bestSet) return `${res.name} e1RM ${fmtW(res.s.best1)} (${fmtW(res.s.bestSet.w)} × ${res.s.bestSet.r})`;
    if (res.imp.reps) return `${res.name} ${Ex.type(ex) === 'reps' && !res.s.bestW ? '' : fmtW(res.s.bestW) + ' × '}${res.s.bestR} Wdh.`;
    return `${res.name} Volumen ${fmtTon(res.s.vol)}`;
  },
  /** Komplett neu berechnen (nach Import, Löschen, Bearbeiten) */
  async recalcAll() {
    const ix = buildIndex(Store.all('workouts'), exMeta());
    const ops = [];
    const ids = new Set(Object.keys(ix.sessions));
    for (const exId of ids) { const p = PR.compute(exId, ix); if (p) ops.push({ type: 'put', coll: 'prs', id: exId, doc: p, replace: true }); }
    for (const old of Store.all('prs')) if (!ids.has(old.id)) ops.push({ type: 'del', coll: 'prs', id: old.id });
    await Store.batch(ops);
    Analytics.persistCache();
    return ops.filter(o => o.type === 'put').length;
  }
};

/* ---------- Progressions-Vorschlag (Double Progression) ---------- */
function parseRange(reps) {
  const m = String(reps || '').match(/(\d+)\s*(?:[-–]\s*(\d+))?/);
  if (!m) return [null, null];
  const lo = +m[1], hi = m[2] ? +m[2] : +m[1];
  return [Math.min(lo, hi), Math.max(lo, hi)];
}
function weightStepKg(exId) {
  const ex = Ex.get(exId);
  const base = fromU(S().weightSteps);
  const heavy = ex && (ex.category === 'Legs' || /kreuzheben/.test(exId)) && ex.equipment !== 'Kurzhantel';
  return heavy ? base * 2 : base;
}
function suggestFor(exId, target) {
  const ss = Analytics.sessionsOf(exId);
  const ex = Ex.get(exId);
  if (!ss.length || Ex.type(ex) !== 'kg') return null;
  const last = ss[ss.length - 1];
  const [lo, hi] = parseRange(target && target.reps);
  const work = last.list.filter(s => s.r > 0 && s.w > 0);
  if (!work.length || !hi) return null;
  const topW = maxOf(work, s => s.w);
  const atTop = work.filter(s => s.w === topW);
  const needSets = Math.min((target && target.sets) || atTop.length, atTop.length);
  if (atTop.length >= needSets && atTop.every(s => s.r >= hi)) {
    const next = topW + weightStepKg(exId);
    return { type: 'up', weightKg: next, reps: lo, text: `Letztes Mal alle Sätze ${hi}+ Wdh. → heute ${fmtW(next)} × ${lo}` };
  }
  return { type: 'keep', weightKg: topW, reps: null, text: `Ziel: mehr Wdh. bei ${fmtW(topW)} (bis ${hi})` };
}


