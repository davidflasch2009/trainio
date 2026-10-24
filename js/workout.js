/* Trainio – Workout-Engine (aktives Workout)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   7. Workout-Engine (aktives Workout in localStorage – überlebt Reloads)
   ========================================================================== */
const Workout = (() => {
  let w = null;
  try { w = JSON.parse(localStorage.getItem(LS.active)); } catch (e) { w = null; }
  const save = () => { try { if (w) localStorage.setItem(LS.active, JSON.stringify(w)); else localStorage.removeItem(LS.active); } catch (e) {} };

  function newSet(src = {}) {
    return { reps: src.reps ?? null, repsR: src.repsR ?? null, weightKg: src.weightKg ?? null, durationSec: src.durationSec ?? null, durationSecR: src.durationSecR ?? null, distKm: src.distKm ?? null, level: src.level ?? null, rpe: src.rpe ?? null, done: false, warmup: !!src.warmup, kind: src.kind || null, doneAt: null };
  }
  /** Übung als Eintrag anlegen – mit Werten vom letzten Mal bzw. Progressions-Vorschlag */
  function makeEntry(exId, target = {}) {
    const ex = Ex.get(exId);
    if (Ex.type(ex) === 'cardio') {
      const ss = Analytics.sessionsOf(exId), last = ss.length ? ss[ss.length - 1] : null;
      const n = last ? Math.max(1, last.list.length) : 1;
      const sets = [];
      for (let i = 0; i < n; i++) {
        const s = newSet(), prev = last && last.list[i];
        if (S().prefillText && prev) { s.durationSec = prev.sec || null; s.distKm = prev.km || null; s.level = prev.lvl ?? null; }
        sets.push(s);
      }
      return {
        uid: autoId().slice(0, 8), exerciseId: exId, exerciseName: ex ? ex.name : 'Cardio', uni: false,
        target: { sets: n, reps: target.reps ? String(target.reps) : '', restSec: 0, notes: target.notes || '' },
        note: '', sets, suggestion: null
      };
    }
    const nSets = target.sets || 3;
    const ss = Analytics.sessionsOf(exId);
    const last = ss.length ? ss[ss.length - 1] : null;
    const sug = target.reps && F('f_suggest') ? suggestFor(exId, target) : null;
    const [lo] = parseRange(target.reps);
    const uni = target.uni != null ? !!target.uni : Ex.isUni(ex);
    const sets = [];
    for (let i = 0; i < nSets; i++) {
      const prev = last ? (last.list[i] || last.list[last.list.length - 1]) : null;
      const s = newSet();
      if (S().prefillText) {
        if (Ex.type(ex) === 'sec') {
          s.durationSec = prev ? (prev.us ? prev.us[0] : prev.sec) || null : (lo || null);
          if (uni && prev && prev.us) s.durationSecR = prev.us[1] || null;
          s.weightKg = prev && prev.w ? prev.w : null;
        }
        else if (sug && sug.type === 'up') { s.weightKg = sug.weightKg; s.reps = sug.reps; }
        else if (prev) { s.weightKg = prev.w || null; s.reps = (prev.u ? prev.u[0] : prev.r) || lo || null; if (uni && prev.u) s.repsR = prev.u[1] || null; }
        else if (lo) s.reps = lo;
      }
      sets.push(s);
    }
    return {
      uid: autoId().slice(0, 8), exerciseId: exId, exerciseName: ex ? ex.name : 'Übung', uni,
      target: { sets: nSets, reps: target.reps ? String(target.reps) : '', restSec: target.restSec || S().defaultRestSec, notes: target.notes || '' },
      note: '', sets, suggestion: sug
    };
  }
  function start({ planId = null, dayIndex = null, templateId = null, name = 'Freies Workout', entries = [] } = {}) {
    if (w) { toast('Es läuft bereits ein Workout', 'warn'); App.go('training'); return; }
    const plan = planId ? Store.raw('plans', planId) : null;
    const tpl = templateId ? Store.raw('templates', templateId) : null;
    const day = tpl ? { name: tpl.name, exercises: tpl.exercises || [] } : plan && plan.days && Number.isInteger(dayIndex) ? plan.days[dayIndex] : null;
    w = {
      id: autoId(), editingId: null, name: day ? day.name : name, planId: tpl ? (S().activePlanId || null) : plan ? plan.id : null, templateId: tpl ? tpl.id : null,
      planDayIndex: day && !tpl ? dayIndex : null, planDayName: day ? day.name : null,
      date: isoDate(), startedAt: Date.now(), bodyWeightKg: null, notes: '',
      entries: day ? day.exercises.filter(x => Ex.get(x.exerciseId)).map(x => makeEntry(x.exerciseId, x)) : entries,
      rest: null, sel: { e: 0, s: 0 }
    };
    const lastBw = Analytics.bwSeries();
    if (lastBw.length && todayDN() - lastBw[lastBw.length - 1].dn < 14) w.bodyWeightKg = lastBw[lastBw.length - 1].kg;
    autoSelect();
    save();
    WakeLock.request();
    App.go('training', { kind: 'zoom' });
    toast(`${w.name} gestartet`, 'success', { cat: 'workout' });
  }
  /** Vergangenes Workout bearbeiten oder wiederholen */
  function load(doc, { edit = false } = {}) {
    if (w) { toast('Bitte erst das laufende Workout beenden', 'warn'); return; }
    const entries = (doc.entries || []).map(en => {
      const ex = Ex.get(en.exerciseId);
      return {
        uid: autoId().slice(0, 8), exerciseId: en.exerciseId, exerciseName: ex ? ex.name : en.exerciseName,
        uni: !!en.uni || (en.sets || []).some(x => x.repsR != null || x.durationSecR != null),
        target: { sets: (en.sets || []).length, reps: '', restSec: S().defaultRestSec, notes: '' }, note: en.note || '',
        sets: (en.sets || []).map(s => edit ? { ...newSet(s), done: s.done !== false, doneAt: s.doneAt || null } : newSet({ ...s, rpe: null })),
        suggestion: null
      };
    });
    w = edit
      ? { ...doc, id: doc.id, editingId: doc.id, entries, rest: null, sel: { e: 0, s: 0 } }
      : { id: autoId(), editingId: null, name: doc.planDayName || doc.name || 'Workout', planId: doc.planId || null, planDayIndex: doc.planDayIndex ?? null, planDayName: doc.planDayName || null, date: isoDate(), startedAt: Date.now(), bodyWeightKg: null, notes: '', entries, rest: null, sel: { e: 0, s: 0 } };
    autoSelect();
    save();
    if (!edit) WakeLock.request();
    App.go('training', { kind: 'zoom' });
  }
  function autoSelect() {
    if (!w) return;
    for (let e = 0; e < w.entries.length; e++) {
      const s = w.entries[e].sets.findIndex(x => !x.done);
      if (s >= 0) { w.sel = { e, s }; return; }
    }
    w.sel = { e: -1, s: -1 };
  }
  function discard() {
    w = null;
    save();
    RestTimer.stop();
    WakeLock.release();
  }
  /** Workout speichern → Firestore, PRs, Zusammenfassung */
  function finish() {
    if (!w) return null;
    const editing = w.editingId;
    const entries = w.entries.map(en => ({
      exerciseId: en.exerciseId,
      exerciseName: en.exerciseName,
      ...(en.note ? { note: en.note } : {}),
      ...(en.uni ? { uni: true } : {}),
      sets: en.sets
        .filter(s => s.done || s.reps != null || s.repsR != null || s.weightKg != null || s.durationSec != null || s.distKm != null)
        .map(s => {
          const o = { reps: s.reps != null ? +s.reps : 0, weightKg: s.weightKg != null ? round(+s.weightKg, 3) : 0, rpe: s.rpe != null ? +s.rpe : null, done: !!s.done };
          if (en.uni) {
            // Rechts leer = wie links
            o.repsR = s.repsR != null ? +s.repsR : o.reps;
            if (s.durationSec != null) o.durationSecR = s.durationSecR != null ? +s.durationSecR : +s.durationSec;
          }
          if (s.warmup) o.warmup = true;
          else if (s.kind) o.kind = s.kind;
          if (s.durationSec != null) o.durationSec = +s.durationSec;
          if (s.distKm != null) o.distKm = round(+s.distKm, 3);
          if (s.level != null) o.level = +s.level;
          if (s.doneAt) o.doneAt = s.doneAt;
          return o;
        })
    })).filter(en => en.sets.length);
    const endedAt = editing ? (w.endedAt || Date.now()) : Date.now();
    // Nachgetragenes Cardio: Workout-Dauer mindestens so lang wie die eingetragene Cardio-Zeit
    const cardioSec = cardioTotals(entries.filter(en => Ex.type(Ex.get(en.exerciseId)) === 'cardio').flatMap(en => en.sets)).sec;
    const doc = {
      date: w.date,
      startedAt: w.startedAt,
      endedAt,
      durationSec: editing ? (w.durationSec || Math.round((endedAt - w.startedAt) / 1000)) : Math.max(Math.round((endedAt - w.startedAt) / 1000), cardioSec),
      planId: w.planId || null,
      planDayIndex: Number.isInteger(w.planDayIndex) ? w.planDayIndex : null,
      planDayName: w.planDayName || null,
      templateId: w.templateId || null,
      name: w.name || w.planDayName || 'Freies Workout',
      notes: w.notes || '',
      bodyWeightKg: w.bodyWeightKg ? round(+w.bodyWeightKg, 2) : null,
      entries,
      createdAt: editing ? (w.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    if (w.importId) doc.importId = w.importId;
    const id = editing || w.id;
    Store.put('workouts', id, doc, { replace: true });
    let prs = [];
    if (editing) PR.recalcAll();
    else prs = PR.updateAfterWorkout(doc);
    Analytics.persistCache();
    discard();
    return { id, doc, prs, editing };
  }
  return {
    cur: () => w, save, start, load, discard, finish, makeEntry, newSet, autoSelect,
    set(mut) { if (!w) return; mut(w); save(); }
  };
})();

/* ---------- Rest-Timer ---------- */
const RestTimer = (() => {
  let firedFor = null, warnedFor = null;
  function start(sec, label) {
    const w = Workout.cur();
    if (!w || !sec) return;
    w.rest = { endsAt: Date.now() + sec * 1000, total: sec, label: label || '' };
    firedFor = null; warnedFor = null;
    Workout.save();
    render();
  }
  function stop() {
    const w = Workout.cur();
    if (w) { w.rest = null; Workout.save(); }
    document.body.classList.remove('has-rest');
    const m = Modal.top();
    if (m && m.isRest) m.close();
    // Leiste gleitet nach unten weg statt plötzlich zu verschwinden
    const box = $('#restBox');
    if (box && motionFull()) {
      box.removeAttribute('id'); box.classList.add('leaving');
      setTimeout(() => box.remove(), 300);
    } else $('#restDock').innerHTML = '';
  }
  function adjust(d) {
    const w = Workout.cur();
    if (!w || !w.rest) return;
    w.rest.endsAt = Math.max(Date.now(), w.rest.endsAt + d * 1000);
    w.rest.total = Math.max(w.rest.total + d, 5);
    firedFor = null; warnedFor = null;
    Workout.save();
    tick();
  }
  const remaining = () => { const w = Workout.cur(); return w && w.rest ? (w.rest.endsAt - Date.now()) / 1000 : null; };
  function render() {
    const w = Workout.cur();
    const dock = $('#restDock');
    if (!w || !w.rest) { $$('.rest-dock:not(.leaving)', dock).forEach(n => n.remove()); document.body.classList.remove('has-rest'); return; }
    document.body.classList.add('has-rest');
    // Leiste schon da → nur Text auffrischen, damit laufende Animationen (Einblenden, Anstupsen) nicht abbrechen
    const box = $('.rest-dock:not(.leaving)', dock);
    if (box) { $('#restLbl', box).textContent = w.rest.label || ''; tick(); return; }
    const RL = 2 * Math.PI * 17;
    dock.innerHTML = `<div class="rest-dock" id="restBox">
      <div class="rest-row">
        <button class="rest-mini" data-act="restBig" aria-label="Großer Countdown"><svg viewBox="0 0 40 40"><circle class="ring-bg" cx="20" cy="20" r="17" fill="none" stroke-width="4"/><circle id="restMini" class="ring-fg" cx="20" cy="20" r="17" fill="none" stroke-width="4" stroke-dasharray="${RL}" data-len="${RL}"/></svg></button>
        <button class="rest-time" data-act="restBig" id="restTime" aria-label="Großer Countdown">0:00</button>
        <div class="rest-label"><b>Pause</b><br><span id="restLbl">${esc(w.rest.label)}</span></div>
        <button class="btn btn-sm btn-secondary" data-act="restAdj" data-d="-15">−15</button>
        <button class="btn btn-sm btn-secondary" data-act="restAdj" data-d="15">+15</button>
        <button class="btn-icon" data-act="restSkip" aria-label="Pause beenden">${icon('x')}</button>
      </div></div>`;
    fx($('#restBox'), 'fx-rest-in');
    tick();
  }
  function tick() {
    const w = Workout.cur();
    if (!w || !w.rest) return;
    const rem = remaining();
    const txt = rem > 0 ? fmtClock(Math.ceil(rem)) : '+' + fmtClock(-rem);
    const t = $('#restTime');
    if (t) t.textContent = rem > 0 ? txt : 'Los!';
    const frac = clamp(rem / w.rest.total, 0, 1);
    const mini = $('#restMini');
    if (mini) mini.style.strokeDashoffset = String(mini.dataset.len * (1 - frac));
    // letzte 3 Sekunden: Zeit und Ring pulsieren im Sekundentakt
    const ending = rem > 0 && rem <= 3.05;
    const box = $('#restBox');
    if (box) { box.classList.toggle('done', rem <= 0); box.classList.toggle('ending', ending); }
    const bigBox = $('.rest-big');
    if (bigBox) bigBox.classList.toggle('ending', ending);
    const big = $('#restBigTxt');
    if (big) big.textContent = rem > 0 ? fmtClock(Math.ceil(rem)) : 'Los!';
    const ring = $('#restRing');
    if (ring) ring.style.strokeDashoffset = String(ring.dataset.len * (1 - frac));
    // Vorwarnung kurz vor Pausenende (Einstellung, 0 = aus)
    const warn = +S().restWarnSec || 0;
    if (warn && rem > 0 && rem <= warn && w.rest.total > warn + 1 && warnedFor !== w.rest.endsAt) {
      warnedFor = w.rest.endsAt;
      playSound('warn'); vibrate(80);
    }
    if (rem <= 0 && firedFor !== w.rest.endsAt) {
      firedFor = w.rest.endsAt;
      done(w);
    }
    if (rem < -60) stop();
  }
  function done(w) {
    fx($('#restBox'), 'fx-nudge');
    vibrate([220, 120, 220, 120, 400]);
    beep();
    const sel = w.sel && w.entries[w.sel.e];
    const next = sel ? `Weiter: ${sel.exerciseName} – Satz ${w.sel.s + 1}` : 'Weiter geht\'s!';
    if (document.visibilityState === 'hidden' && S().notifyRestDone) notify('Pause vorbei', next);
    else toast(`Pause vorbei – ${next.replace('Weiter: ', '')}`, 'success', { cat: 'workout' });
  }
  function openBig() {
    const w = Workout.cur();
    if (!w || !w.rest) return;
    const R = 120, L = 2 * Math.PI * R;
    const m = Modal.open({
      title: 'Pause', size: 'sm',
      body: `<div class="rest-big">
        <div class="rest-ring"><svg viewBox="0 0 280 280"><circle class="ring-bg" cx="140" cy="140" r="${R}" fill="none" stroke-width="14"/><circle id="restRing" class="ring-fg" cx="140" cy="140" r="${R}" fill="none" stroke-width="14" stroke-dasharray="${L}" data-len="${L}"/></svg>
          <div class="ring-txt"><b id="restBigTxt">0:00</b><span class="dim small">${esc(w.rest.label)}</span></div></div>
        <div class="row" style="width:100%">
          <button class="btn btn-secondary grow" data-act="restAdj" data-d="-15">−15 s</button>
          <button class="btn btn-secondary grow" data-act="restAdj" data-d="15">+15 s</button>
          <button class="btn btn-secondary grow" data-act="restAdj" data-d="60">+1 min</button>
        </div>
        <button class="btn btn-primary btn-block btn-lg" data-act="restSkip">${icon('skip')} Pause beenden</button>
      </div>`
    });
    m.isRest = true;
    tick();
  }
  Actions.restAdj = el => adjust(+el.dataset.d);
  Actions.restSkip = () => stop();
  Actions.restBig = () => openBig();
  return { start, stop, render, tick, remaining };
})();

/* Globaler Sekunden-Takt für Timer */
setInterval(() => {
  const w = Workout.cur();
  if (!w) return;
  const el = (Date.now() - w.startedAt) / 1000;
  $$('[data-tick="wo"]').forEach(x => { x.textContent = fmtClock(el); });
  RestTimer.tick();
}, 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') RestTimer.tick(); });

