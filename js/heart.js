/* Trainio – Herz & Ausdauer
   Ruhepuls messen (im Takt tippen oder 30 s zählen), VO2max (Schätzung aus Ruhe- und Maximalpuls oder Messwert),
   Pulszonen, Intensität im Cardio, Intervall-Timer und Herz-Plan (Wochenziel, erst nach dem Aktivieren da).
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   Herz & Ausdauer
   ========================================================================== */
const EFFORTS = [['easy', 'locker'], ['mod', 'mittel'], ['hard', 'hart']];
const EFFORT_INFO = 'Locker = Zone 2: du kannst noch in ganzen Sätzen sprechen. Mittel = nur noch kurze Sätze. Hart = nur einzelne Wörter (Intervalle). Den Ø Puls kannst du zusätzlich eintragen, z. B. vom Griff-Sensor am Gerät – dann zeigt Trainio die Zone dazu.';
/* Pulszonen in % der Herzfrequenz-Reserve (Karvonen); ohne Ruhepuls in % des Maximalpulses */
const HR_ZONES = [
  ['Regeneration', .5, .6, 'ganz locker, ausrollen'],
  ['Grundlage (Zone 2)', .6, .7, 'locker – ganze Sätze sprechen'],
  ['Tempo', .7, .8, 'zügig – nur kurze Sätze'],
  ['Schwelle', .8, .9, 'hart – einzelne Wörter'],
  ['Maximal', .9, 1, 'alles – nur kurz haltbar']
];
/* VO2max-Einordnung (ml/kg/min) nach Shvartz & Reibold (1990): Untergrenzen von „niedrig" bis „ausgezeichnet" je Altersgruppe (bis … Jahre) */
const VO2_LABELS = ['sehr niedrig', 'niedrig', 'eher niedrig', 'durchschnittlich', 'gut', 'sehr gut', 'ausgezeichnet'];
const VO2_NORMS = {
  m: [[24, [32, 38, 44, 51, 57, 63]], [29, [31, 36, 43, 49, 54, 60]], [34, [29, 35, 41, 46, 52, 57]], [39, [28, 33, 39, 44, 49, 55]], [44, [26, 32, 36, 42, 47, 52]],
    [49, [25, 30, 35, 40, 44, 49]], [54, [24, 28, 33, 37, 42, 47]], [59, [22, 27, 31, 35, 40, 44]], [200, [21, 25, 29, 33, 37, 41]]],
  f: [[24, [27, 32, 37, 42, 47, 52]], [29, [26, 31, 36, 41, 45, 50]], [34, [25, 30, 34, 38, 43, 47]], [39, [24, 28, 32, 36, 41, 45]], [44, [22, 26, 30, 34, 38, 42]],
    [49, [21, 24, 28, 32, 36, 39]], [54, [19, 23, 26, 30, 33, 37]], [59, [18, 21, 24, 28, 31, 34]], [200, [16, 19, 22, 25, 28, 31]]]
};
const HIIT_PRESETS = [
  { k: '4x4', label: '4 × 4 min', warm: 600, work: 240, rest: 180, rounds: 4, cool: 300 },
  { k: '8x1', label: '8 × 1 min', warm: 600, work: 60, rest: 60, rounds: 8, cool: 300 },
  { k: '30-30', label: '10 × 30 s', warm: 600, work: 30, rest: 30, rounds: 10, cool: 300 }
];
const HIIT_NAMES = { warm: 'Aufwärmen', work: 'Hart', rest: 'Locker', cool: 'Abwärmen' };
const HIIT_KEYS = ['warm', 'work', 'rest', 'rounds', 'cool'];
const hiitLen = s => s % 60 === 0 ? `${s / 60} min` : s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${pad(s % 60)} min`;
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const RHR_TAPS = 20;   // so viele Schläge tippen, dann steht der Ruhepuls

const Heart = (() => {
  /* ---------- Profil & Werte ---------- */
  const age = () => { const y = parseInt(S().birthYear, 10), a = new Date().getFullYear() - y; return y > 1900 && a >= 8 && a <= 100 ? a : null; };
  /** Maximalpuls: eingetragen oder geschätzt nach Tanaka (208 − 0,7 × Alter) */
  function maxHr() {
    const m = parseInt(S().hrMax, 10);
    if (m >= 120 && m <= 230) return { v: m, est: false };
    const a = age();
    return a ? { v: Math.round(208 - .7 * a), est: true } : null;
  }
  const entries = () => Store.all('heart').filter(h => isISO(h.date)).sort((a, b) => a.date.localeCompare(b.date));
  const rhrList = () => entries().filter(h => h.rhr > 0).map(h => ({ dn: dayNum(h.date), date: h.date, v: +h.rhr }));
  /** Ø Ruhepuls der Messungen in den 7 Tagen bis dn – glättet die Schwankungen von Tag zu Tag */
  const rhrAt = (dn, list = rhrList()) => { const w = list.filter(x => x.dn <= dn && x.dn > dn - 7); return w.length ? avg(w.map(x => x.v)) : null; };
  function rhrNow() {
    const l = rhrList();
    if (!l.length) return null;
    const last = l[l.length - 1];
    return { last, base: rhrAt(last.dn, l), today: last.dn === todayDN() };
  }
  function zones() {
    const m = maxHr();
    if (!m) return null;
    const r = rhrNow(), rest = r ? Math.round(r.base) : null;
    const at = p => Math.round(rest ? rest + (m.v - rest) * p : m.v * p);
    return { max: m, rest, list: HR_ZONES.map(([name, lo, hi, feel], i) => ({ i: i + 1, name, feel, lo: at(lo), hi: at(hi) })) };
  }
  const zoneOfHr = (hr, z = zones()) => z && hr > 0 ? (z.list.find(x => hr < x.hi) || z.list[4]).i : null;
  /** Puls → Intensität: bis Zone 2 locker, Zone 3 mittel, ab Zone 4 hart */
  const effortOfHr = (hr, z) => { const n = zoneOfHr(hr, z); return n ? (n <= 2 ? 'easy' : n === 3 ? 'mod' : 'hard') : null; };
  /** VO2max-Schätzung nach Uth et al. (2004): 15,3 × Maximalpuls ÷ Ruhepuls */
  const vo2Est = rhr => { const m = maxHr(); return m && rhr > 0 ? round(15.3 * m.v / rhr, 1) : null; };
  function vo2Points() {
    const l = rhrList();
    return {
      est: maxHr() ? l.map(x => ({ x: x.dn, y: vo2Est(rhrAt(x.dn, l)) })) : [],
      meas: entries().filter(h => h.vo2 > 0).map(h => ({ x: dayNum(h.date), y: +h.vo2 }))
    };
  }
  /** Aktueller Wert: der neuere von Schätzung und Messung (am gleichen Tag zählt die Messung) */
  function vo2Now() {
    const { est, meas } = vo2Points(), e = est[est.length - 1], m = meas[meas.length - 1];
    if (m && (!e || m.x >= e.x)) return { v: m.y, dn: m.x, est: false };
    return e ? { v: e.y, dn: e.x, est: true } : null;
  }
  function vo2Class(v) {
    const a = age();
    if (!a || !(v > 0)) return null;
    const rows = VO2_NORMS[S().sex === 'f' ? 'f' : 'm'], row = (rows.find(r => a <= r[0]) || rows[rows.length - 1])[1];
    let i = 0;
    while (i < row.length && v >= row[i]) i++;
    return { i, label: VO2_LABELS[i] };
  }
  const docId = date => 'd' + date;
  const saveRhr = (bpm, how, date = isoDate()) => Store.put('heart', docId(date), { date, rhr: Math.round(bpm), rhrM: how, updatedAt: Date.now() });
  const saveVo2 = (v, date = isoDate()) => Store.put('heart', docId(date), { date, vo2: round(v, 1), updatedAt: Date.now() });

  /* ---------- Cardio-Einheiten mit Intensität (gespeicherte Workouts + laufendes) ---------- */
  function cardioItems(from, to) {
    const z = zones(), out = [];
    const add = (wo, wid) => {
      const dn = dayNum(wo.date);
      if (dn < from || dn > to) return;
      for (const en of wo.entries || []) {
        if (!en || Ex.type(Ex.get(en.exerciseId)) !== 'cardio') continue;
        const sec = sum((en.sets || []).filter(s => s && s.done !== false && !s.warmup).map(s => +s.durationSec || 0));
        if (sec) out.push({ wid, dn, sec, eff: en.effort || effortOfHr(en.hr, z) || 'none' });
      }
    };
    for (const wo of Store.all('workouts')) if (wo && isISO(wo.date)) add(wo, wo.id);
    const w = Workout.cur();
    if (w && !w.editingId) add({ date: w.date, entries: w.entries.map(en => ({ ...en, sets: en.sets.filter(s => s.done) })) }, w.id);
    return out;
  }
  /* ---------- Herz-Plan: Wochenziel ---------- */
  const plan = () => { const p = S().heartPlan; return p && typeof p === 'object' ? p : null; };
  function planWeek(p = plan()) {
    if (!p) return null;
    const ws = weekStartDN(todayDN()), items = cardioItems(ws, ws + 6), byW = {};
    for (const it of items) { const b = byW[it.wid] || (byW[it.wid] = { sec: 0, hard: false }); b.sec += it.sec; if (it.eff === 'hard') b.hard = true; }
    const units = Object.values(byW);
    return {
      p,
      sessions: units.filter(b => b.sec >= 600 || b.hard).length,
      hard: units.filter(b => b.hard).length,
      z2: Math.round(sum(items.filter(i => i.eff === 'easy').map(i => i.sec)) / 60)
    };
  }
  const planBar = (label, cur, goal, unit = '') => goal ? `<div class="hp-row ${cur >= goal ? 'ok' : ''}">
      <div class="hp-top"><span class="grow">${label}</span><b>${cur}${unit}</b><span class="dim">/ ${goal}${unit}</span>${cur >= goal ? icon('check') : ''}</div>
      <div class="hp-bar"><i style="width:${Math.min(100, cur / goal * 100)}%"></i></div></div>` : '';
  function planBars(pw) {
    const all = pw.sessions >= pw.p.sessions && pw.hard >= (pw.p.hard || 0) && pw.z2 >= (pw.p.z2 || 0);
    return `${planBar('Einheiten', pw.sessions, pw.p.sessions)}${planBar('davon hart', pw.hard, pw.p.hard)}${planBar('locker (Zone 2)', pw.z2, pw.p.z2, ' min')}
      ${all ? `<div class="hp-done">${icon('checkCircle')} Woche geschafft – stark!</div>` : ''}`;
  }

  /* ---------- Ruhepuls messen ---------- */
  function bpmOf(ts) {
    const iv = [];
    for (let i = 1; i < ts.length; i++) iv.push(ts[i] - ts[i - 1]);
    if (iv.length < 4) return null;
    const med = iv.slice().sort((a, b) => a - b)[iv.length >> 1];
    // Doppel-Tipper und verpasste Schläge (≈ halber/doppelter Abstand) zählen nicht
    const ok = iv.filter(x => x > med * .7 && x < med * 1.3);
    return { bpm: Math.round(60000 / (ok.length >= 4 ? avg(ok) : med)), shaky: ok.length < iv.length * .75 };
  }
  function measure() {
    let mode = S().rhrMode === 'count' ? 'count' : 'tap', taps = [], timer = null;
    const RL = 2 * Math.PI * 52;
    const m = Modal.open({
      title: 'Ruhepuls messen', size: 'sm',
      body: `<div class="seg hr-mode" role="group" aria-label="Messart"><button data-mode="tap">Im Takt tippen</button><button data-mode="count">30 s zählen</button></div>
        <p class="small dim mt-12">Am besten morgens direkt nach dem Aufwachen, noch im Liegen. Puls am Hals oder Handgelenk ertasten.</p>
        <div class="hr-stage mt-16"></div>
        <div class="center mt-8"><button class="link-btn" data-x="manual">Wert direkt eintragen</button></div>`,
      onClose: () => clearInterval(timer)
    });
    const stage = $('.hr-stage', m.el);
    const setMode = md => {
      mode = md; clearInterval(timer);
      $$('.hr-mode button', m.el).forEach(b => b.classList.toggle('active', b.dataset.mode === md));
      if (md === 'tap') tapView(); else countView();
    };
    function tapView() {
      taps = [];
      stage.innerHTML = `<button class="hr-tap" type="button" aria-label="Bei jedem Herzschlag tippen">${icon('heart')}<span>Bei jedem Schlag tippen</span></button>
        <div class="hr-live"><b id="hrBpm">–</b><small>/min</small></div>
        <div class="hr-prog" aria-hidden="true"><i id="hrProg"></i></div>
        <p class="tiny dim center mt-8" id="hrHint">${RHR_TAPS} Schläge – etwa 20 Sekunden</p>`;
      // pointerdown statt click: kein Verzug, jeder Tipp zählt sofort
      $('.hr-tap', stage).addEventListener('pointerdown', e => { e.preventDefault(); onTap(e.timeStamp || performance.now()); });
    }
    function onTap(t) {
      const prev = taps[taps.length - 1];
      if (prev != null && t - prev > 2500) { taps = []; $('#hrHint', stage).textContent = 'Zu lange Pause – neu begonnen'; }
      taps.push(t);
      vibrate(6);
      fx($('.hr-tap', stage), 'fx-beat');
      const r = taps.length >= 5 ? bpmOf(taps) : null;
      $('#hrBpm', stage).textContent = r ? r.bpm : '–';
      $('#hrProg', stage).style.width = Math.min(100, (taps.length - 1) / (RHR_TAPS - 1) * 100) + '%';
      if (taps.length >= RHR_TAPS) result(bpmOf(taps), 'tap');
    }
    function countView() {
      stage.innerHTML = `<div class="hr-ring"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52" fill="none" stroke-width="8"/><circle id="hrRing" class="ring-fg" cx="60" cy="60" r="52" fill="none" stroke-width="8" stroke-dasharray="${RL}" style="stroke-dashoffset:0"/></svg><b id="hrSec">30</b></div>
        <div id="hrCtl"><button class="btn btn-primary btn-block btn-lg mt-16" data-x="cstart">${icon('play')} Start</button>
        <p class="tiny dim center mt-8">Ab dem ersten Ton zählen, bis nach 30 Sekunden der zweite kommt.</p></div>`;
    }
    function countStart() {
      const t0 = Date.now();
      playSound('warn'); vibrate(40);
      $('#hrCtl', stage).innerHTML = `<p class="center mt-16 bold">Zählen …</p><button class="btn btn-secondary btn-block mt-8" data-x="cstop">Abbrechen</button>`;
      timer = setInterval(() => {
        const left = 30 - (Date.now() - t0) / 1000;
        $('#hrSec', stage).textContent = Math.max(0, Math.ceil(left));
        $('#hrRing', stage).style.strokeDashoffset = String(RL * clamp(1 - left / 30, 0, 1));
        if (left > 0) return;
        clearInterval(timer);
        playSound('double'); vibrate([200, 80, 200]);
        countInput();
      }, 100);
    }
    function countInput() {
      stage.innerHTML = `<label class="field"><span>Gezählte Schläge in 30 Sekunden</span><input class="input hr-num" id="hrCnt" inputmode="numeric" autocomplete="off" placeholder="z. B. 31"></label>
        <div class="hr-live"><b id="hrBpm">–</b><small>/min</small></div>
        <button class="btn btn-primary btn-block mt-8" data-x="csave" disabled>Speichern</button>`;
      const inp = $('#hrCnt', stage);
      inp.addEventListener('input', () => {
        const n = parseInt(inp.value, 10), bpm = n > 0 ? n * 2 : null;
        $('#hrBpm', stage).textContent = bpm || '–';
        $('[data-x="csave"]', stage).disabled = !(bpm >= 30 && bpm <= 130);
      });
      setTimeout(() => inp.focus(), 60);
    }
    function result(r, how) {
      const ok = r && r.bpm >= 30 && r.bpm <= 130, cur = rhrNow();
      stage.innerHTML = `<div class="hr-live big fx-pop"><b>${ok ? r.bpm : '–'}</b><small>Schläge/min</small></div>
        ${!ok ? '<p class="small center hr-warn">Das passt nicht – bitte nochmal gleichmäßig tippen.</p>'
          : r.shaky ? '<p class="small center hr-warn">Die Abstände waren ungleichmäßig – zur Sicherheit nochmal messen.</p>' : ''}
        ${ok && cur ? `<p class="small dim center">${cur.today ? `Heute schon gemessen: ${cur.last.v} – wird ersetzt` : `Ø letzte 7 Tage: ${nf(cur.base, 0)}`}</p>` : ''}
        <div class="row mt-16" style="gap:8px"><button class="btn btn-secondary grow" data-x="again">Nochmal</button>${ok ? `<button class="btn btn-primary grow" data-x="save" data-v="${r.bpm}" data-how="${how}">Speichern</button>` : ''}</div>`;
      vibrate(ok ? [30, 60, 30] : 120);
    }
    function manualView() {
      clearInterval(timer);
      stage.innerHTML = `<label class="field"><span>Ruhepuls (Schläge pro Minute)</span><input class="input hr-num" id="hrMan" inputmode="numeric" autocomplete="off" placeholder="z. B. 62"></label>
        <button class="btn btn-primary btn-block mt-12" data-x="msave">Speichern</button>`;
      setTimeout(() => $('#hrMan', stage).focus(), 60);
    }
    function done(bpm, how) {
      saveRhr(bpm, how);
      if (how !== 'manual' && how !== S().rhrMode) Store.saveSettings({ rhrMode: how });
      toast(`Ruhepuls ${bpm}/min gespeichert`, 'success', { cat: 'confirm' });
      m.close();
    }
    m.el.addEventListener('click', e => {
      const md = e.target.closest('[data-mode]');
      if (md) return setMode(md.dataset.mode);
      const b = e.target.closest('[data-x]');
      if (!b) return;
      const x = b.dataset.x;
      if (x === 'again') setMode(mode);
      else if (x === 'cstart') countStart();
      else if (x === 'cstop') setMode('count');
      else if (x === 'manual') manualView();
      else if (x === 'save') done(+b.dataset.v, b.dataset.how);
      else if (x === 'csave') done(parseInt($('#hrCnt', stage).value, 10) * 2, 'count');
      else if (x === 'msave') {
        const v = parseInt($('#hrMan', stage).value, 10);
        if (!(v >= 30 && v <= 130)) return toast('Bitte einen Wert zwischen 30 und 130 eintragen', 'warn');
        done(v, 'manual');
      }
    });
    m.el.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const b = $('[data-x="csave"]:not([disabled]), [data-x="msave"]', stage);
      if (b) b.click();
    });
    setMode(mode);
    return m;
  }
  function vo2Entry() {
    const m = Modal.open({
      title: 'VO2max eintragen', size: 'sm',
      body: `<p class="small dim">Ein gemessener Wert, z. B. aus einer Leistungsdiagnostik. Er hat Vorrang vor der Schätzung.</p>
        <div class="row mt-12" style="gap:8px;align-items:flex-end"><label class="field grow"><span>VO2max (ml/kg/min)</span><input class="input" id="v2Val" inputmode="decimal" autocomplete="off" placeholder="z. B. 45"></label>
        <label class="field grow"><span>Datum</span><input class="input" id="v2Date" type="date" value="${isoDate()}" max="${isoDate()}"></label></div>`,
      foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">Speichern</button>`
    });
    m.el.addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'cancel') return m.close();
      const v = parseNum($('#v2Val', m.el).value), d = $('#v2Date', m.el).value;
      if (!(v >= 10 && v <= 95)) return toast('Bitte einen Wert zwischen 10 und 95 eintragen', 'warn');
      if (!isISO(d) || d > isoDate()) return toast('Bitte ein Datum wählen', 'warn');
      saveVo2(v, d);
      m.close();
    });
    setTimeout(() => $('#v2Val', m.el).focus(), 300);
  }
  function history() {
    const list = () => entries().slice().reverse();
    const row = h => `<div class="list-item"><span class="li-main"><span class="li-title">${fmtDate(h.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
      <div class="li-sub">${[h.rhr > 0 ? `Ruhepuls ${h.rhr}/min${h.rhrM === 'tap' ? ' (getippt)' : h.rhrM === 'count' ? ' (gezählt)' : ''}` : '', h.vo2 > 0 ? `VO2max ${nf(h.vo2, 1)} (gemessen)` : ''].filter(Boolean).join(' · ')}</div></span>
      <button class="btn-icon" data-del="${esc(h.id)}" aria-label="Eintrag löschen">${icon('trash')}</button></div>`;
    const m = Modal.open({
      title: 'Ruhepuls & VO2max', size: 'sm',
      body: list().length ? `<div class="list">${list().map(row).join('')}</div>` : emptyState('heart', 'Noch keine Werte', 'Miss deinen Ruhepuls – am besten morgens nach dem Aufwachen.')
    });
    m.el.addEventListener('click', async e => {
      const b = e.target.closest('[data-del]');
      if (!b || !await confirmDialog({ title: 'Eintrag löschen?', okLabel: 'Löschen', danger: true })) return;
      Store.del('heart', b.dataset.del);
      b.closest('.list-item').remove();
    });
  }
  function planEdit() {
    const cur = plan(), p = { sessions: 3, hard: 1, z2: 90, rhrGoal: null, vo2Goal: null, ...(cur || {}) };
    const LIM = { sessions: [1, 14], hard: [0, 7], z2: [0, 900] }, UNIT = { hard: '×', z2: ' min' };
    const step = (k, label, sub, d) => setLine(label, sub, `<div class="stepper hp-step"><button data-st="${k}" data-d="-${d}" aria-label="${label}: weniger">${icon('minus')}</button><b data-v="${k}">${p[k]}${UNIT[k] || ''}</b><button data-st="${k}" data-d="${d}" aria-label="${label}: mehr">${icon('plus')}</button></div>`);
    const m = Modal.open({
      title: 'Herz-Plan', size: 'sm',
      body: `<p class="small dim">Dein Wochenziel. Es zählt jedes Cardio ab 10 Minuten – auch nach dem Krafttraining. Ob locker oder hart, stellst du im Workout bei der Cardio-Übung ein.</p>
        <div class="list mt-12">${step('sessions', 'Einheiten pro Woche', 'Cardio ab 10 min', 1)}${step('hard', 'davon hart', 'z. B. Intervalle (4 × 4 min)', 1)}${step('z2', 'Minuten locker', 'Zone 2 – ganze Sätze sprechen', 15)}</div>
        <h4 class="mt-16 mb-8">Ziele (optional)</h4>
        <div class="row" style="gap:8px"><label class="field grow"><span>Ruhepuls-Ziel</span><input class="input" id="hpRhr" inputmode="numeric" autocomplete="off" value="${p.rhrGoal || ''}" placeholder="z. B. 55"></label>
        <label class="field grow"><span>VO2max-Ziel</span><input class="input" id="hpVo2" inputmode="decimal" autocomplete="off" value="${p.vo2Goal ? nf(p.vo2Goal, 1) : ''}" placeholder="z. B. 50"></label></div>
        <p class="tiny dim mt-8">Die Ziele erscheinen als Linie in den Diagrammen.</p>`,
      foot: `<button class="btn btn-secondary" data-x="${cur ? 'off' : 'cancel'}">${cur ? 'Plan beenden' : 'Abbrechen'}</button><button class="btn btn-primary" data-x="ok">${cur ? 'Speichern' : 'Aktivieren'}</button>`
    });
    const refresh = () => $$('[data-v]', m.el).forEach(x => { x.textContent = p[x.dataset.v] + (UNIT[x.dataset.v] || ''); });
    m.el.addEventListener('click', async e => {
      const s = e.target.closest('[data-st]');
      if (s) {
        const k = s.dataset.st;
        p[k] = clamp(p[k] + +s.dataset.d, ...LIM[k]);
        if (k === 'sessions' && p.hard > p.sessions) p.hard = p.sessions;
        if (k === 'hard' && p.hard > p.sessions) p.sessions = p.hard;
        refresh(); vibrate(8);
        return;
      }
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'cancel') return m.close();
      if (b.dataset.x === 'off') {
        if (await confirmDialog({ title: 'Herz-Plan beenden?', text: 'Deine Werte und Einheiten bleiben – nur das Wochenziel verschwindet.', okLabel: 'Beenden', danger: true })) { Store.saveSettings({ heartPlan: null }); m.close(); }
        return;
      }
      const rg = parseInt($('#hpRhr', m.el).value, 10), vg = parseNum($('#hpVo2', m.el).value);
      Store.saveSettings({ heartPlan: { sessions: p.sessions, hard: p.hard, z2: p.z2, rhrGoal: rg >= 30 && rg <= 120 ? rg : null, vo2Goal: vg >= 10 && vg <= 95 ? round(vg, 1) : null } });
      toast(cur ? 'Herz-Plan gespeichert' : 'Herz-Plan aktiv – viel Erfolg!', 'success', { cat: cur ? 'confirm' : 'workout' });
      m.close();
    });
  }

  /* ---------- Intervall-Timer ---------- */
  function hiitPhases(c) {
    const ph = [];
    if (c.warm) ph.push({ k: 'warm', len: c.warm });
    for (let r = 1; r <= c.rounds; r++) {
      ph.push({ k: 'work', len: c.work, r });
      if (r < c.rounds && c.rest) ph.push({ k: 'rest', len: c.rest, r });
    }
    if (c.cool) ph.push({ k: 'cool', len: c.cool });
    return ph;
  }
  const hiitTotal = c => sum(hiitPhases(c).map(p => p.len));
  function hiitState(h) {
    const ph = hiitPhases(h.cfg), total = sum(ph.map(p => p.len));
    const el = ((h.pausedAt || Date.now()) - h.startedAt - (h.pausedMs || 0)) / 1000;
    let t = el;
    for (let i = 0; i < ph.length; i++) {
      if (t < ph[i].len) return { i, ph, cur: ph[i], left: ph[i].len - t, el, total };
      t -= ph[i].len;
    }
    return { done: true, ph, el: total, total };
  }
  let hiitModal = null, lastPh = null, lastBeep = null;
  /** Kurzanzeige für die Karte im Workout: „Hart · 3:12 · Runde 2/4" */
  function pillTxt(h) {
    const st = hiitState(h);
    if (st.done) return 'Intervalle geschafft';
    return `${HIIT_NAMES[st.cur.k]} · ${mmss(st.left)}${st.cur.r ? ` · Runde ${st.cur.r}/${h.cfg.rounds}` : ''}${h.pausedAt ? ' · Pause' : ''}`;
  }
  function hiitSetup(ei) {
    const w = Workout.cur(), en = w && w.entries[ei];
    if (!en) return;
    if (w.hiit) return hiitOpen();
    const c = { ...HIIT_PRESETS[0], ...(S().hiit || {}) };
    const fld = (k, label, val, mode = 'decimal') => `<label class="field"><span>${label}</span><input class="input" data-hf="${k}" inputmode="${mode}" autocomplete="off" value="${val}"></label>`;
    const m = Modal.open({
      title: 'Intervall-Timer', size: 'sm',
      body: `<div class="chips wrap">${HIIT_PRESETS.map(p => `<button class="chip" data-hp="${p.k}">${p.label}</button>`).join('')}</div>
        <div class="hiit-form mt-12">${fld('warm', 'Aufwärmen', durIn(c.warm))}${fld('work', 'Hart', durIn(c.work))}${fld('rest', 'Locker', durIn(c.rest))}${fld('rounds', 'Runden', c.rounds, 'numeric')}${fld('cool', 'Abwärmen', durIn(c.cool))}</div>
        <p class="small mt-12">Gesamt: <b id="hiTot">–</b></p>
        <p class="tiny dim mt-4">Zeiten in Minuten, z. B. 4 oder 0:30. Hart: so viel Widerstand, dass nur noch einzelne Wörter gehen. Locker: ruhig weitertreten. Beim Wechsel kommen Ton und Vibration, der Bildschirm bleibt an.</p>`,
      foot: `<button class="btn btn-primary btn-block btn-lg" data-x="go">${icon('play')} Start</button>`
    });
    const read = () => {
      const g = k => $(`[data-hf="${k}"]`, m.el).value;
      return { warm: parseDur(g('warm')) || 0, work: parseDur(g('work')) || 0, rest: parseDur(g('rest')) || 0, rounds: clamp(parseInt(g('rounds'), 10) || 0, 0, 50), cool: parseDur(g('cool')) || 0 };
    };
    const upd = () => {
      const x = read();
      $('#hiTot', m.el).textContent = x.work && x.rounds ? `${fmtDur(hiitTotal(x))} · ${x.rounds} × ${hiitLen(x.work)} hart` : '–';
      $$('[data-hp]', m.el).forEach(b => { const p = HIIT_PRESETS.find(q => q.k === b.dataset.hp); b.classList.toggle('active', HIIT_KEYS.every(k => p[k] === x[k])); });
    };
    m.el.addEventListener('input', upd);
    m.el.addEventListener('click', e => {
      const p = e.target.closest('[data-hp]');
      if (p) {
        const q = HIIT_PRESETS.find(x => x.k === p.dataset.hp);
        HIIT_KEYS.forEach(k => { $(`[data-hf="${k}"]`, m.el).value = k === 'rounds' ? q.rounds : durIn(q[k]); });
        upd();
        return;
      }
      if (!e.target.closest('[data-x="go"]')) return;
      const x = read();
      if (!x.work || !x.rounds) return toast('Bitte Dauer „Hart" und Runden eintragen', 'warn');
      Store.saveSettings({ hiit: x });
      const cw = Workout.cur(), ce = cw && cw.entries.find(q => q.uid === en.uid);
      if (!ce) return m.close();
      cw.hiit = { uid: en.uid, cfg: x, startedAt: Date.now(), pausedMs: 0, pausedAt: null };
      Workout.save();
      playSound('warn'); vibrate(40);
      m.dismiss();
      App.renderCurrent();
      hiitOpen();
    });
    upd();
  }
  function hiitOpen() {
    const w = Workout.cur(), h = w && w.hiit;
    if (!h || hiitModal) return;
    const R = 120, L = 2 * Math.PI * R;
    const m = Modal.open({
      title: 'Intervalle', size: 'sm',
      body: `<div class="hiit-run" id="hiRun">
        <div class="hiit-phase" id="hiPh"></div><div class="hiit-round dim" id="hiRd"></div>
        <div class="rest-ring hiit-ring"><svg viewBox="0 0 280 280"><circle class="ring-bg" cx="140" cy="140" r="${R}" fill="none" stroke-width="14"/><circle id="hiRing" class="ring-fg" cx="140" cy="140" r="${R}" fill="none" stroke-width="14" stroke-dasharray="${L}" data-len="${L}"/></svg>
          <div class="ring-txt"><b id="hiT">–</b><span class="dim small" id="hiNext"></span></div></div>
        <div class="hiit-line" aria-hidden="true">${hiitPhases(h.cfg).map(p => `<i class="hl-${p.k}" style="flex-grow:${p.len}"><b></b></i>`).join('')}</div>
        <div class="small dim">Noch <b id="hiLeft"></b> von ${fmtDur(hiitTotal(h.cfg))}</div>
        <div class="row" style="width:100%;gap:8px"><button class="btn btn-secondary grow" data-x="pause" id="hiPause"></button><button class="btn btn-secondary grow" data-x="skip">${icon('skip')} Nächste Phase</button></div>
        <button class="btn btn-secondary btn-block" data-x="stop">Beenden</button></div>`,
      onClose: () => { hiitModal = null; }
    });
    hiitModal = m;
    m.el.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]');
      if (b && b.dataset.x === 'ok') return m.close();
      const cw = Workout.cur(), ch = cw && cw.hiit;
      if (!b || !ch) return;
      if (b.dataset.x === 'pause') {
        if (ch.pausedAt) { ch.pausedMs = (ch.pausedMs || 0) + Date.now() - ch.pausedAt; ch.pausedAt = null; } else ch.pausedAt = Date.now();
      } else if (b.dataset.x === 'skip') {
        const st = hiitState(ch);
        if (!st.done) ch.startedAt -= Math.ceil(st.left * 1000);
      } else if (b.dataset.x === 'stop') {
        const st = hiitState(ch);
        const ok = await confirmDialog({ title: 'Intervalle beenden?', text: st.el >= 60 ? `Die bisherigen ${fmtDur(st.el)} werden als harte Einheit eingetragen.` : 'Es wird noch nichts eingetragen.', okLabel: 'Beenden' });
        if (ok && Workout.cur() && Workout.cur().hiit) hiitFinish(false);
        return;
      }
      Workout.save();
      hiitTick();
    });
    hiitTick();
  }
  /** Fertig oder abgebrochen: Dauer als erledigten Abschnitt eintragen, Übung als „hart" markieren */
  function hiitFinish(complete) {
    const w = Workout.cur(), h = w && w.hiit;
    if (!h) return;
    const st = hiitState(h);
    const secs = Math.round(complete ? st.total : st.el);
    const rounds = complete ? h.cfg.rounds : st.ph.slice(0, st.i).filter(p => p.k === 'work').length + (st.cur && st.cur.k === 'work' && st.left < st.cur.len / 2 ? 1 : 0);
    w.hiit = null;
    const en = w.entries.find(e => e.uid === h.uid);
    const logged = !!en && secs >= 60;
    if (logged) {
      en.effort = 'hard';
      en.hiit = { rounds, work: h.cfg.work, rest: h.cfg.rest };
      let s = en.sets.find(x => !x.done && x.durationSec == null && x.distKm == null);
      if (!s) { s = Workout.newSet(); en.sets.push(s); }
      s.durationSec = secs; s.done = true; s.doneAt = Date.now();
    }
    Workout.autoSelect(); Workout.save();
    if (complete) { playSound('gong'); vibrate([200, 100, 200, 100, 400]); }
    if (hiitModal) {
      hiitModal.setBody(`<div class="hiit-run ph-done">
        <div class="sum-badge sum-draw">${icon(complete ? 'trophy' : 'checkCircle')}</div>
        <h2>${complete ? 'Geschafft!' : 'Beendet'}</h2>
        <p class="dim center">${rounds} × ${hiitLen(h.cfg.work)} hart · ${fmtDur(secs)} gesamt${logged ? `<br>Eingetragen bei ${esc(en.exerciseName)} – als harte Einheit.` : ''}</p>
        <button class="btn btn-primary btn-block btn-lg" data-x="ok">Fertig</button></div>`);
      $$('.sum-draw svg *', hiitModal.el).forEach(n => n.setAttribute('pathLength', '1'));
    } else if (logged) toast(`Intervalle ${complete ? 'geschafft' : 'beendet'} – ${fmtDur(secs)} eingetragen`, 'success', { cat: 'workout' });
    App.renderCurrent();
  }
  /** Takt (5×/s): Anzeige, Ton + Vibration beim Phasenwechsel, kurze Töne in den letzten 3 Sekunden */
  function hiitTick() {
    const w = Workout.cur(), h = w && w.hiit;
    if (!h) { if (hiitModal && $('#hiRun:not(.ph-done)', hiitModal.el)) hiitModal.close(); return; }
    const st = hiitState(h);
    if (st.done) return hiitFinish(true);
    const key = h.startedAt + ':' + (h.pausedMs || 0);
    if (!h.pausedAt) {
      if (lastPh && lastPh.cfg === h.cfg && lastPh.i !== st.i) {
        if (st.cur.k === 'work') { playSound('double'); vibrate([250, 100, 250]); } else { playSound('bell'); vibrate(300); }
      }
      const s = Math.ceil(st.left);
      if (s <= 3 && st.cur.len > 8 && !(lastBeep && lastBeep.key === key && lastBeep.i === st.i && lastBeep.s === s)) { lastBeep = { key, i: st.i, s }; playSound('warn'); }
    }
    lastPh = { cfg: h.cfg, i: st.i };
    const { cur, left } = st, name = HIIT_NAMES[cur.k];
    const pt = pillTxt(h);
    $$('[data-hiit-pill]').forEach(p => { p.textContent = pt; });
    if (!hiitModal) return;
    const el = hiitModal.el, run = $('#hiRun', el);
    if (!run || run.classList.contains('ph-done')) return;
    run.className = `hiit-run ph-${cur.k}${h.pausedAt ? ' paused' : ''}`;
    $('#hiPh', el).textContent = h.pausedAt ? 'Pause' : name;
    $('#hiRd', el).textContent = cur.r ? `Runde ${cur.r} von ${h.cfg.rounds}` : cur.k === 'warm' ? `danach ${h.cfg.rounds} × ${hiitLen(h.cfg.work)} hart` : 'gleich geschafft';
    $('#hiT', el).textContent = mmss(left);
    const nx = st.ph[st.i + 1];
    $('#hiNext', el).textContent = nx ? `danach ${hiitLen(nx.len)} ${HIIT_NAMES[nx.k].toLowerCase()}` : 'letzte Phase';
    const ring = $('#hiRing', el);
    ring.style.strokeDashoffset = String(ring.dataset.len * (1 - left / cur.len));
    $('#hiLeft', el).textContent = mmss(st.total - st.el);
    $$('.hiit-line i', el).forEach((seg, i) => { seg.classList.toggle('past', i < st.i); seg.classList.toggle('cur', i === st.i); seg.firstChild.style.width = i < st.i ? '100%' : i === st.i ? `${100 * (1 - left / cur.len)}%` : '0%'; });
    const pb = $('#hiPause', el), pl = h.pausedAt ? `${icon('play')} Fortsetzen` : `${icon('pause')} Pause`;
    if (pb.dataset.l !== pl) { pb.innerHTML = pl; pb.dataset.l = pl; }
  }
  setInterval(hiitTick, 200);
  /** Intervalle von außerhalb des Workouts starten: Cardio-Übung im laufenden Workout nehmen oder Cardio starten */
  async function hiitQuick() {
    const w0 = Workout.cur();
    if (w0 && w0.hiit) return hiitOpen();
    const isC = en => Ex.type(Ex.get(en.exerciseId)) === 'cardio';
    let ei = w0 ? w0.entries.map((en, i) => isC(en) ? i : -1).filter(i => i >= 0).pop() : undefined;
    if (ei == null) {
      const n0 = w0 ? w0.entries.length : 0;
      await Actions.startCardio();
      const w1 = Workout.cur();
      if (!w1 || (w0 && w1.entries.length === n0) || !isC(w1.entries[w1.entries.length - 1])) return;
      ei = w1.entries.length - 1;
    }
    if (App.tab !== 'training') App.go('training');
    setTimeout(() => hiitSetup(ei), 380);
  }

  /* ---------- Bausteine für Workout, Start und Fortschritt ---------- */
  function cardioExtras(en, ei, w) {
    const hz = en.hr > 0 ? zoneOfHr(+en.hr) : null;
    return `${w.hiit && w.hiit.uid === en.uid ? `<button class="hiit-pill" data-act="hiitOpen">${icon('timer')}<span class="grow" data-hiit-pill>${pillTxt(w.hiit)}</span>${icon('chevR')}</button>` : ''}
      <div class="cd-eff">
        <span class="cd-eff-l">Intensität ${infoBtn(EFFORT_INFO)}</span>
        <label class="cd-hr"><small data-hz="${ei}">${hz ? 'Zone ' + hz : ''}</small><input class="input" inputmode="numeric" data-in="cdHr" data-ei="${ei}" value="${en.hr > 0 ? en.hr : ''}" placeholder="Ø Puls" autocomplete="off" aria-label="Durchschnittspuls (optional)"></label>
        <div class="seg sm cd-eff-seg" role="group" aria-label="Intensität">${EFFORTS.map(([k, l]) => `<button class="${en.effort === k ? 'active' : ''}" data-act="cdEffort" data-ei="${ei}" data-v="${k}" aria-pressed="${en.effort === k}">${l}</button>`).join('')}</div>
      </div>`;
  }
  const cardioFoot = ei => `<div class="cd-foot"><button class="exs-add" data-act="setAdd" data-ei="${ei}">${icon('plus')} Abschnitt</button><button class="exs-add" data-act="hiitSetup" data-ei="${ei}">${icon('timer')} Intervalle</button></div>`;
  const effortTxt = en => [en.effort ? (EFFORTS.find(x => x[0] === en.effort) || [])[1] : '', en.hr > 0 ? `Ø ${en.hr} Puls` : '', en.hiit ? `${en.hiit.rounds} × ${hiitLen(en.hiit.work)} Intervalle` : ''].filter(Boolean).join(' · ');
  function rhrTile() {
    const now = rhrNow();
    return `<button class="stat clickable" data-act="rhrMeasure" style="text-align:left;color:inherit;font:inherit;cursor:pointer">
      <div class="stat-label">${icon('heart')} Ruhepuls</div>
      <div class="stat-value">${now ? now.last.v : '–'}<small>/min</small></div>
      <div class="stat-sub">${now ? (now.today ? 'heute gemessen' : `${relDays(now.last.dn)} · jetzt messen`) : 'Tippen zum Messen'}</div>
    </button>`;
  }
  function startCard() {
    const pw = F('f_heart') ? planWeek() : null;
    if (!pw) return '';
    const now = rhrNow();
    return `<div class="card mt-16 hp-card">
      <div class="row"><b class="grow hp-title">${icon('heart')} Herz diese Woche</b><button class="btn-icon" data-act="heartPlan" aria-label="Herz-Plan bearbeiten">${icon('edit')}</button></div>
      ${planBars(pw)}
      <div class="row mt-12" style="gap:8px">${now && now.today ? '' : `<button class="btn btn-secondary btn-sm grow" data-act="rhrMeasure">${icon('heart')} Ruhepuls messen</button>`}<button class="btn btn-secondary btn-sm grow" data-act="hiitQuick">${icon('timer')} Intervalle</button></div>
    </div>`;
  }
  /** Abschnitt „Herz" im Fortschritt (über den Cardio-Auswertungen) */
  function section(cb, r) {
    const c = chartColors(), p = plan();
    const l = rhrList(), inR = l.filter(x => x.dn >= r.from && x.dn <= r.to), now = rhrNow();
    const first = inR[0], baseFirst = first ? rhrAt(first.dn, l) : null;
    const v = vo2Now(), cls = v ? vo2Class(v.v) : null, vp = vo2Points();
    const estR = vp.est.filter(x => x.x >= r.from && x.x <= r.to), measR = vp.meas.filter(x => x.x >= r.from && x.x <= r.to);
    const z = zones(), a = age();
    const goalLine = (val, label) => val ? { axis: 'y', lines: [{ value: val, label, color: c.success }] } : undefined;
    // Intensität pro Woche
    const weeks = Analytics.weeksOf(r), ri = runIdx(weeks), items = cardioItems(r.from, r.to);
    const per = k => weeks.map(w => round(sum(items.filter(i => i.eff === k && i.dn >= w && i.dn < w + 7).map(i => i.sec)) / 60, 0));
    const effW = Object.fromEntries(['easy', 'mod', 'hard', 'none'].map(k => [k, per(k)]));
    const rated = sum(effW.easy) + sum(effW.mod) + sum(effW.hard);
    const stack = (label, data, color) => barDS(label, data, color, { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 2 } });
    const ageCta = `<button class="btn btn-secondary btn-sm mt-8" data-act="heartAge">${icon('user')} Geburtsjahr eintragen</button>`;
    const pw = planWeek();
    return `
      <div class="hr-actions"><button class="btn btn-primary grow" data-act="rhrMeasure">${icon('heart')} Ruhepuls messen</button><button class="btn btn-secondary grow" data-act="hiitQuick">${icon('timer')} Intervall-Timer</button></div>
      <div class="charts-grid">
        ${pw ? `<div class="chart-card wide hp-card"><div class="cc-head"><span class="cc-title">Herz-Plan · diese Woche</span><button class="btn-icon" style="width:36px;height:36px" data-act="heartPlan" aria-label="Herz-Plan bearbeiten">${icon('edit')}</button></div>${planBars(pw)}</div>`
          : `<div class="chart-card wide hp-card"><div class="cc-head"><span class="cc-title">Herz-Plan</span></div>
            <p class="small dim mt-4">Ein Wochenziel fürs Herztraining, z. B. 3 Einheiten, davon 1× hart (Intervalle), 90 Minuten locker in Zone 2 – alles frei einstellbar.</p>
            <div><button class="btn btn-secondary btn-sm mt-12" data-act="heartPlan">${icon('plus')} Herz-Plan einrichten</button></div></div>`}
        ${cb.card({ id: 'h1', wide: true, title: 'Ruhepuls', info: 'Herzschläge pro Minute in völliger Ruhe – am besten morgens direkt nach dem Aufwachen gemessen. Sinkt er über Wochen, arbeitet dein Herz effizienter. Die Linie zeigt den Ø der letzten 7 Tage (einzelne Tage schwanken), die Punkte die einzelnen Messungen.',
          big: now ? nf(now.base, 0) : '–', small: now ? `Ø 7 Tage · zuletzt ${now.last.v} ${relDays(now.last.dn)}` : 'noch nicht gemessen',
          delta: now && baseFirst && first.dn < now.last.dn ? deltaHtml(now.base, baseFirst, { invert: true, fmt: x => (x > 0 ? '+' : '') + nf(x, 0) }) : '', sub: now && baseFirst && first.dn < now.last.dn ? `seit ${fmtDateShort(first.date)}` : '',
          extra: `<div class="row mt-8" style="gap:8px"><button class="btn btn-secondary btn-sm" data-act="heartHistory">${icon('list')} Alle Werte</button></div>`,
          factory: () => inR.length ? timeLine([
            lineDS('Ø 7 Tage', inR.map(x => ({ x: x.dn, y: round(rhrAt(x.dn, l), 1) })), c.accent),
            { ...lineDS('Messung', inR.map(x => ({ x: x.dn, y: x.v })), c.faint), showLine: false, fill: false, pointRadius: 3 }
          ], { tooltipFmt: x => nf(x, 0) + '/min', thresholds: goalLine(p && p.rhrGoal, 'Ziel') }) : null })}
        ${cb.card({ id: 'h2', wide: true, title: 'VO2max', info: 'Maximale Sauerstoffaufnahme in ml pro kg Körpergewicht und Minute – das beste Einzelmaß für Ausdauer und Herzgesundheit. Ohne Uhr schätzt Trainio sie nach Uth et al. (2004): 15,3 × Maximalpuls ÷ Ruhepuls (Ø 7 Tage). Das ist ein Richtwert (etwa ±10 %), der Trend ist aber aussagekräftig. Gemessene Werte (z. B. aus einer Leistungsdiagnostik) haben Vorrang. Einordnung nach Alter und Geschlecht (Shvartz & Reibold).',
          big: v ? nf(v.v, 1) : '–', small: v ? `ml/kg/min · ${v.est ? 'geschätzt' : 'gemessen'}` : !maxHr() ? 'Geburtsjahr fehlt' : 'erst Ruhepuls messen',
          sub: cls ? `<div class="vo2-scale" aria-hidden="true">${VO2_LABELS.map((_, i) => `<i class="${i === cls.i ? 'on' : ''}"></i>`).join('')}</div><div class="vo2-lbl"><b>${cls.label}</b> für ${a} Jahre${a < 20 ? ' (Werte ab 20 Jahren)' : ''}</div>` : '',
          extra: `<div class="row mt-8" style="gap:8px">${maxHr() ? '' : ageCta}<button class="btn btn-secondary btn-sm" data-act="vo2Entry">${icon('plus')} Messwert eintragen</button></div>`,
          factory: () => estR.length || measR.length ? timeLine([
            ...(estR.length ? [lineDS('geschätzt', estR, c.accent)] : []),
            ...(measR.length ? [{ ...lineDS('gemessen', measR, c.series[1]), showLine: measR.length > 1, fill: false, pointRadius: 4 }] : [])
          ], { tooltipFmt: x => nf(x, 1), legend: estR.length > 0 && measR.length > 0, thresholds: goalLine(p && p.vo2Goal, 'Ziel') }) : null })}
        <div class="chart-card">
          <div class="cc-head"><span class="cc-title">Deine Pulszonen</span>${infoBtn('Berechnet aus Maximal- und Ruhepuls (Karvonen-Formel: Ruhepuls + Anteil der Herzfrequenz-Reserve); ohne Ruhepuls als Anteil des Maximalpulses. Der Maximalpuls wird aus dem Alter geschätzt (208 − 0,7 × Alter, Tanaka) – kennst du deinen echten, trag ihn ein. Fürs Herz am wichtigsten: viel Zeit in Zone 2 und ab und zu kurz Zone 4–5.')}</div>
          ${z ? `<div class="hz-list mt-8">${z.list.map(x => `<div class="hz-row hz-${x.i}"><span class="hz-n">${x.i}</span><span class="grow"><b>${x.name}</b><small>${x.feel}</small></span><span class="hz-b">${x.lo}–${x.hi}</span></div>`).join('')}</div>
            <div class="tiny dim mt-8">Max-Puls ${z.max.v}${z.max.est ? ' (geschätzt)' : ''}${z.rest ? ` · Ruhepuls ${z.rest}` : ' · ohne Ruhepuls'} · <button class="link-btn hz-edit" data-act="heartMax">ändern</button></div>`
          : `<p class="small dim mt-8">Für deine persönlichen Zonen braucht Trainio dein Alter (oder deinen Maximalpuls).</p><div>${ageCta}</div>`}
        </div>
        ${cb.card({ id: 'h3', title: 'Intensität pro Woche', info: 'Cardio-Minuten je Woche nach Intensität – eingestellt im Workout bei der Cardio-Übung (locker / mittel / hart) oder aus dem Ø Puls. Bewährt für Herz und VO2max: etwa 80 % locker (Zone 2), 20 % hart. „Mittel" bringt pro Minute am wenigsten.',
          big: rated ? Math.round(sum(effW.easy) / rated * 100) + ' %' : '–', small: rated ? 'locker im Zeitraum' : 'noch keine Intensität erfasst',
          factory: () => items.length ? barChart(weeks.map(w => 'KW ' + isoWeek(w).week), [
            stack('locker', effW.easy, c.success), stack('mittel', effW.mod, c.warning), stack('hart', effW.hard, c.danger),
            ...(sum(effW.none) ? [stack('ohne Angabe', effW.none, c.faint)] : [])
          ], { stacked: true, legend: true, running: ri, tooltipFmt: x => nf(x, 0) + ' min' }) : null })}
      </div>`;
  }

  return {
    age, maxHr, rhrNow, zones, zoneOfHr, vo2Est, vo2Now, vo2Class, saveRhr, saveVo2, cardioItems, plan, planWeek,
    measure, vo2Entry, history, planEdit, hiitSetup, hiitOpen, hiitFinish, hiitQuick, hiitState, hiitPhases,
    cardioExtras, cardioFoot, effortTxt, rhrTile, startCard, section
  };
})();

/* ---------- Aktionen ---------- */
Actions.rhrMeasure = () => Heart.measure();
Actions.heartHistory = () => Heart.history();
Actions.vo2Entry = () => Heart.vo2Entry();
Actions.heartPlan = () => Heart.planEdit();
Actions.hiitSetup = el => Heart.hiitSetup(+el.dataset.ei);
Actions.hiitOpen = () => Heart.hiitOpen();
Actions.hiitQuick = () => Heart.hiitQuick();
Actions.cdEffort = el => {
  const w = Workout.cur(), en = w && w.entries[+el.dataset.ei];
  if (!en) return;
  en.effort = en.effort === el.dataset.v ? null : el.dataset.v;
  Workout.save();
  vibrate(8);
  // ohne Neu-Zeichnen umschalten – die Karte bleibt ruhig stehen
  $$('button', el.parentElement).forEach(b => { const on = b.dataset.v === en.effort; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
};
Inputs.cdHr = el => {
  const w = Workout.cur(), en = w && w.entries[+el.dataset.ei];
  if (!en) return;
  const v = parseInt(el.value, 10);
  en.hr = v >= 40 && v <= 230 ? v : null;
  Workout.save();
  const z = en.hr ? Heart.zoneOfHr(en.hr) : null, t = $(`[data-hz="${el.dataset.ei}"]`);
  if (t) t.textContent = z ? 'Zone ' + z : '';
};
Actions.heartAge = async () => {
  const v = await promptDialog({ title: 'Geburtsjahr', label: 'Für Pulszonen und VO2max', value: S().birthYear || '', placeholder: 'z. B. 2005', inputmode: 'numeric' });
  if (v == null) return;
  const y = parseInt(v, 10);
  if (!(y > 1920 && y <= new Date().getFullYear() - 8)) return toast('Bitte ein gültiges Geburtsjahr eintragen', 'warn');
  Store.saveSettings({ birthYear: y });
};
Actions.heartMax = async () => {
  const m = Heart.maxHr();
  const v = await promptDialog({ title: 'Maximalpuls', label: 'Leer lassen = aus dem Alter geschätzt', value: S().hrMax || '', placeholder: m ? `geschätzt ${m.v}` : 'z. B. 195', inputmode: 'numeric' });
  if (v == null) return;
  const n = parseInt(v, 10);
  if (String(v).trim() && !(n >= 120 && n <= 230)) return toast('Bitte einen Wert zwischen 120 und 230 eintragen', 'warn');
  Store.saveSettings({ hrMax: String(v).trim() ? n : null });
};
