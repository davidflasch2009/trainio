/* Trainio – Aktives Workout: Ansicht (Sätze, Cardio, Fokus, Übersicht, Ziel-Editor)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ---------- Aktives Workout rendern ---------- */
function liveStats(w) {
  let total = 0, done = 0, vol = 0;
  for (const en of w.entries) for (const s of en.sets) {
    if (s.warmup) continue;
    total++;
    if (s.done) { done++; vol += setVol(s); }
  }
  return { total, done, vol };
}
function lastSessionFor(exId, w) {
  const ss = Analytics.sessionsOf(exId).filter(s => s.wid !== w.editingId && s.wid !== w.id);
  return ss.length ? ss[ss.length - 1] : null;
}
function renderActiveWorkout(el, w) {
  const st = liveStats(w);
  const hBefore = cardHeights(el);
  const focus = S().woView === 'focus' && F('f_focus') && w.entries.length > 0;
  el.innerHTML = `
    <div class="wo-head wo-simple">
      <div class="wo-main">
        <div class="grow" style="min-width:0">
          <div class="wo-title ellipsis">${esc(w.name)}</div>
          <div class="wo-stats small dim">${w.editingId ? `<span>Bearbeitung · ${fmtDate(w.date)}</span>` : `<span class="wo-timer" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span>`}<span><i class="roll">${st.done}</i>/${st.total} Sätze</span></div>
        </div>
        <button class="btn-icon" data-act="woMore" aria-label="Weitere Optionen">${icon('dots')}</button>
        <button class="btn btn-primary" data-act="woFinish">${icon('check')} ${w.editingId ? 'Speichern' : 'Fertig'}</button>
      </div>
      <div class="wo-progress" style="width:100%"><i style="width:${st.total ? st.done / st.total * 100 : 0}%"></i></div>
    </div>
    <div class="wo-body">
      ${focus ? focusView(w) : w.entries.length ? w.entries.map((en, ei) => woCard(en, ei, w, simpleCard)).join('') : `<div class="card mb-12">${emptyState('dumbbell', 'Noch keine Übungen', 'Füge die erste Übung hinzu und leg los.')}</div>`}
      ${!focus && st.total && st.done === st.total ? `<button class="btn btn-primary btn-block btn-lg mb-12" id="woFinishEnd" data-act="woFinish">${icon('check')} ${w.editingId ? 'Änderungen speichern' : 'Workout beenden'}</button>` : ''}
      <div class="row mt-4" style="gap:8px"><button class="btn btn-secondary btn-lg grow" data-act="woAddEx">${icon('plus')} Übung hinzufügen</button><button class="btn btn-secondary btn-lg" data-act="startCardio" aria-label="Cardio hinzufügen">${icon('heart')} Cardio</button></div>
    </div>`;
  updateTopH();
  fxOpenCard(el);
  animCardHeights(el, hBefore);
  animWoProgress(el, w, st);
}

/* ---------- Sanfte Übergänge im Workout ---------- */
/** Übungs-Karten: Höhenänderung (Zu-/Aufklappen, Satz dazu) gleitet statt zu springen */
const cardHeights = root => Object.fromEntries($$('.ex-card', root).map(c => [c.id, c.offsetHeight]));
const cardDelta = new Map();   // laufende Animationen: Karten-ID → Höhenunterschied (für scrollToExercise)
function animCardHeights(root, before) {
  if (!motionFull()) return;
  $$('.ex-card', root).forEach(c => {
    const h0 = before[c.id], h1 = c.offsetHeight;
    if (h0 == null || Math.abs(h1 - h0) < 3) return;
    c.style.height = h0 + 'px'; c.style.overflow = 'hidden';
    void c.offsetHeight;
    c.style.transition = 'height .34s cubic-bezier(.2, .8, .2, 1)';
    c.style.height = h1 + 'px';
    cardDelta.set(c.id, h1 - h0);
    let t;
    const end = e => { if (e && e.target !== c) return; clearTimeout(t); c.style.height = c.style.overflow = c.style.transition = ''; cardDelta.delete(c.id); c.removeEventListener('transitionend', end); };
    c.addEventListener('transitionend', end);
    t = setTimeout(end, 500);
  });
}
/** Fortschrittsbalken im Workout-Kopf: vom alten Stand weich auf den neuen, bei 100 % einmal aufleuchten */
let lastWoPct = null;
function animWoProgress(el, w, st) {
  const bar = $('.wo-progress i', el);
  const p = st.total ? st.done / st.total * 100 : 0;
  const prev = lastWoPct && lastWoPct.id === (w.id || w.startedAt) ? lastWoPct.p : null;
  lastWoPct = { id: w.id || w.startedAt, p };
  if (!bar || prev == null || prev === p) return;
  bar.style.transition = 'none'; bar.style.width = prev + '%';
  void bar.offsetWidth;
  bar.style.transition = ''; bar.style.width = p + '%';
  if (p >= 100 && prev < 100) fx(bar, 'fx-glow');
}

/** Wechselt die offene Übung (oder die Fokus-Übung), blendet sie sanft ein */
let lastOpenCard = null;
function fxOpenCard(root) {
  const c = $('.ex-open, .focus', root);
  const id = c ? c.id : null;
  if (id && lastOpenCard && id !== lastOpenCard) fx(c, c.classList.contains('focus') ? 'fx-up' : 'fx-open');
  lastOpenCard = id;
}
/* ---------- Zugeklappte Übungen: nur die aktuelle ist offen ---------- */
const woCollapse = () => S().woCollapse !== false;
/** Aktuelle (offene) Übung: manuell geöffnet, sonst die erste mit offenen Sätzen; -1 = alle fertig */
function openIndex(w) {
  if (Number.isInteger(w.openE) && w.entries[w.openE]) return w.openE;
  return w.entries.findIndex(en => en.sets.some(s => !s.done));
}
/* Spotlight (Design „Fokus"): die aktuelle Übung heißt ex-cur, ihr nächster offener Satz set-next – das CSS dimmt den Rest */
function markNextSet(html, en, ei) {
  const si = en.sets.findIndex(s => !s.done);
  return si < 0 ? html : html.replace(new RegExp(`<div class="set-row([^"]*)" data-ei="${ei}" data-si="${si}"`), `<div class="set-row$1 set-next" data-ei="${ei}" data-si="${si}"`);
}
function woCard(en, ei, w, full) {
  const type = Ex.type(Ex.get(en.exerciseId));
  if (type === 'cardio') full = cardioCard;
  const cur = openIndex(w) === ei;
  if (!woCollapse() || cur) {
    const html = full(en, ei, w).replace('class="ex-card', `class="ex-card ex-open${cur ? ' ex-cur' : ''}`);
    return cur ? markNextSet(html, en, ei) : html;
  }
  const ws = workSets(en), done = ws.filter(s => s.done);
  const complete = en.sets.length > 0 && en.sets.every(s => s.done);
  const fmt = s => type === 'sec' ? secTxt(s) : (s.weightKg ? `${wNum(s.weightKg)}×${repsTxt(s)}` : repsTxt(s));
  const gw = goalWeight(en);
  const sub = type === 'cardio' ? (done.length ? cardioTxt(cardioTotals(done), cardioInfo(Ex.get(en.exerciseId))) : cardioGoalTxt(en))
    : done.length ? done.map(fmt).join(' · ') : `${ws.length} × ${goalReps(en, type)}${type === 'sec' ? ' s' : ''}${en.uni ? ' je Seite' : ''}${gw ? ' · ' + fmtW(gw) : ''}`;
  return `<div class="ex-card exc ${complete ? 'complete' : ''}" id="ex-${en.uid}">
    <button class="exc-head" data-act="exOpen" data-ei="${ei}" aria-expanded="false" aria-label="${esc(en.exerciseName)} öffnen">
      <span class="exc-idx">${complete ? icon('check') : ei + 1}</span>
      <span class="grow" style="min-width:0"><span class="exc-name">${esc(en.exerciseName)}</span><span class="exc-sub">${esc(sub)}</span></span>
      ${complete ? '' : `<span class="exc-cnt">${done.length}/${ws.length}</span>`}${icon('chevD')}
    </button>
  </div>`;
}
Actions.exOpen = el => {
  const w = Workout.cur(); if (!w) return;
  const ei = +el.dataset.ei, en = w.entries[ei]; if (!en) return;
  w.openE = ei;
  const fo = firstOpen(en);
  w.sel = { e: ei, s: fo >= 0 ? fo : -1 };
  Workout.save();
  App.renderCurrent();
  requestAnimationFrame(() => scrollToExercise(en));
};

/* ---------- Einseitige Übungen: zweites Feld für rechts ---------- */
/** Platzhalter: links = letztes Mal; rechts = aktueller linker Wert, sonst letztes Mal */
function sidePh(s, prev, type) {
  const k = type === 'sec' ? 'durationSec' : 'reps';
  const side = i => prev ? (type === 'sec' ? (prev.us ? prev.us[i] : prev.sec) : (prev.u ? prev.u[i] : prev.r)) : null;
  const l = side(0), r = side(1);
  const r0 = r ? String(r) : l ? String(l) : '';
  return { l: l ? String(l) : '', r0, r: s[k] != null ? String(s[k]) : r0 };
}
function rInput(s, d, type, ph, generic = '', cls = 'set-in') {
  const v = type === 'sec' ? s.durationSecR : s.repsR;
  return `<input class="${cls}" inputmode="${kpIM('numeric')}" data-in="setBR" ${d} value="${v ?? ''}" placeholder="${esc(ph.r || generic)}" data-ph0="${esc(ph.r0 || generic)}" aria-label="${type === 'sec' ? 'Sekunden rechts' : 'Wiederholungen rechts'}" enterkeyhint="done">`;
}

/* ---------- Letztes Mal übernehmen: Platzhalter → echte Werte (nur leere Felder) ---------- */
function prevForSet(en, si, last) {
  const s = en.sets[si];
  if (!last || !s || s.warmup) return null;
  const no = en.sets.slice(0, si + 1).filter(x => !x.warmup).length;
  return last.list[no - 1] || null;
}
/** Hat der Satz noch leere Felder, die das letzte Mal füllen kann? */
function setFillable(s, prev, type) {
  if (!prev || !s || s.done) return false;
  if (type === 'cardio') return (s.durationSec == null && !!prev.sec) || (s.distKm == null && !!prev.km) || (s.level == null && prev.lvl != null);
  const b = type === 'sec' ? s.durationSec : s.reps;
  const pb = type === 'sec' ? (prev.us ? prev.us[0] : prev.sec) : (prev.u ? prev.u[0] : prev.r);
  return (b == null && !!pb) || (s.weightKg == null && (!!prev.w || type === 'kg'));
}
const canFillAny = (en, last) => { const type = Ex.type(Ex.get(en.exerciseId)); return en.sets.some((s, si) => setFillable(s, prevForSet(en, si, last), type)); };
function fillSet(en, si, last) {
  const s = en.sets[si], prev = prevForSet(en, si, last);
  const type = Ex.type(Ex.get(en.exerciseId));
  if (!setFillable(s, prev, type)) return false;
  if (type === 'cardio') {
    if (s.durationSec == null && prev.sec) s.durationSec = prev.sec;
    if (s.distKm == null && prev.km) s.distKm = prev.km;
    if (s.level == null && prev.lvl != null) s.level = prev.lvl;
    return true;
  }
  if (s.weightKg == null && (prev.w || type === 'kg')) s.weightKg = prev.w || 0;
  const [k, side] = type === 'sec' ? ['durationSec', i => prev.us ? prev.us[i] : prev.sec] : ['reps', i => prev.u ? prev.u[i] : prev.r];
  if (s[k] == null) s[k] = side(0) || null;
  if (en.uni && s[k + 'R'] == null) s[k + 'R'] = (prev.u || prev.us ? side(1) : null) || null;
  return true;
}
const fillBtn = (s, prev, type, d) => setFillable(s, prev, type)
  ? `<button class="set-fill" data-act="setFill" ${d} aria-label="Werte vom letzten Mal übernehmen" title="Letztes Mal übernehmen">${icon('fillIn')}</button>`
  : '<span></span>';
Actions.setFill = el => {
  const w = Workout.cur(); if (!w) return;
  const ei = +el.dataset.ei, si = +el.dataset.si, en = w.entries[ei];
  if (!en || !fillSet(en, si, lastSessionFor(en.exerciseId, w))) return;
  vibrate(8);
  w.sel = { e: ei, s: si };
  Workout.save();
  App.renderCurrent();
  fx($$(`[data-ei="${ei}"][data-si="${si}"].set-in, [data-ei="${ei}"][data-si="${si}"].fc-in`), 'fx-fill');
};
Actions.exFill = el => {
  const w = Workout.cur(); if (!w) return;
  const en = w.entries[+el.dataset.ei]; if (!en) return;
  const last = lastSessionFor(en.exerciseId, w);
  const n = en.sets.reduce((c, _, si) => c + (fillSet(en, si, last) ? 1 : 0), 0);
  if (!n) return;
  vibrate(8);
  Workout.save();
  App.renderCurrent();
  fx($$(`.set-in[data-ei="${el.dataset.ei}"], .fc-in[data-ei="${el.dataset.ei}"]`), 'fx-fill');
  toast(`${n} ${n === 1 ? 'Satz' : 'Sätze'} vom letzten Mal übernommen`, 'success', { cat: 'workout' });
};

/* ---------- Dauerhafte Übungs-Notiz (am Übungs-Dokument, erscheint in jedem Workout) ---------- */
const pinNote = exId => ((Ex.get(exId) || {}).myNote || '').trim();
const pinChip = (exId, cls = 'pin-note') => pinNote(exId) ? `<button class="${cls}" data-act="pinNoteEdit" data-id="${esc(exId)}" aria-label="Notiz bearbeiten">${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px;flex-shrink:0"')} ${esc(pinNote(exId))}</button>` : '';
Actions.pinNoteEdit = async el => {
  const id = el.dataset.id, ex = Ex.get(id); if (!ex) return;
  const v = await promptDialog({ title: 'Notiz zur Übung', label: `${ex.name} – bleibt für alle zukünftigen Workouts`, value: ex.myNote || '', placeholder: 'z. B. Sitzhöhe 4, Griff eng, Polster Stufe 2' });
  if (v == null) return;
  Store.put('exercises', id, { myNote: v.trim(), updatedAt: Date.now() });
  toast(v.trim() ? 'Notiz gespeichert – erscheint ab jetzt bei jedem Workout' : 'Notiz entfernt', 'success');
};

/* ---------- Cardio-Karte: pro Abschnitt Dauer (+ Distanz) (+ Stufe), km/h wird berechnet ---------- */
function cardioGoalTxt(en) {
  const info = cardioInfo(Ex.get(en.exerciseId)), m = parseNum(en.target && en.target.reps);
  return m && info ? `Ziel ${nf(m, 0)} min` : '';
}
function cardioSumTxt(en) {
  const t = cardioTotals(en.sets.map(x => ({ ...x, done: true })));
  if (!t.sec && !t.km) return '';
  const info = cardioInfo(Ex.get(en.exerciseId));
  // Bei einem Abschnitt nur sinnvoll, wenn km/h berechnet werden kann
  if (en.sets.length < 2 && !(info.mode === 'dist' && t.kmh)) return '';
  return `${en.sets.length > 1 ? 'Gesamt: ' : ''}${cardioTxt({ sec: t.sec, km: info.mode === 'dist' ? t.km : 0, lvl: null }, info)}`;
}
function cardioCard(en, ei, w) {
  const ex = Ex.get(en.exerciseId), info = cardioInfo(ex);
  const last = S().woPrev !== false ? lastSessionFor(en.exerciseId, w) : null;
  const tgt = parseNum(en.target && en.target.reps);
  const complete = en.sets.length > 0 && en.sets.every(s => s.done);
  const doneN = en.sets.filter(s => s.done).length;
  const dist = info.mode === 'dist', lvl = info.lvl;
  const fill = !!last;
  const cols = `30px repeat(${1 + (dist ? 1 : 0) + (lvl ? 1 : 0)}, minmax(0, 1fr))${fill ? ' 36px' : ''} 48px`;
  const lvlHead = lvl === 'Steigung' ? 'Steig. %' : lvl === 'Gewicht' ? 'kg' : lvl || '';
  const rows = en.sets.map((s, si) => {
    const prev = last ? last.list[si] || null : null;
    const d = `data-ei="${ei}" data-si="${si}"`;
    const durPh = prev && prev.sec ? durIn(prev.sec) : si === 0 && tgt ? String(tgt) : 'min';
    const kmPh = prev && prev.km ? nf(prev.km, 2) : 'km';
    const lvPh = prev && prev.lvl != null ? nf(prev.lvl, 1) : '–';
    return `<div class="set-row ${s.done ? 'done' : ''}" ${d}>
      <button class="set-num" data-act="setMenu" ${d} aria-label="Abschnitt ${si + 1} Optionen">${si + 1}</button>
      <input class="set-in" inputmode="${kpIM('decimal')}" data-in="cdDur" ${d} value="${esc(durIn(s.durationSec))}" placeholder="${esc(durPh)}" aria-label="Dauer in Minuten (z. B. 30 oder 30:15)" enterkeyhint="next">
      ${dist ? `<input class="set-in" inputmode="${kpIM('decimal')}" data-in="cdKm" ${d} value="${s.distKm != null ? esc(nf(s.distKm, 3)) : ''}" placeholder="${esc(kmPh)}" aria-label="Distanz in km" enterkeyhint="${lvl ? 'next' : 'done'}">` : ''}
      ${lvl ? `<input class="set-in" inputmode="${kpIM('decimal')}" data-in="cdLvl" ${d} value="${s.level != null ? esc(nf(s.level, 1)) : ''}" placeholder="${esc(lvPh)}" aria-label="${esc(lvl)}" enterkeyhint="done">` : ''}
      ${fill ? fillBtn(s, prev, 'cardio', d) : ''}
      <button class="set-check" data-act="setDone" ${d} aria-label="${s.done ? 'Abschnitt zurücksetzen' : 'Abschnitt erledigt'}">${icon('check')}</button>
    </div>`;
  }).join('');
  const sum = cardioSumTxt(en);
  return `<div class="ex-card exs cd-card ${complete ? 'complete' : ''}" id="ex-${en.uid}">
    <div class="exs-head">
      <div class="grow" style="min-width:0">
        <button class="ex-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button>
        ${cardioGoalTxt(en) ? `<div class="exs-goal" style="text-decoration:none">${esc(cardioGoalTxt(en))}</div>` : ''}
      </div>
      <span class="exs-count ${complete ? 'ok' : ''}">${complete ? icon('check') : en.sets.length > 1 ? `<i class="roll">${doneN}</i>/${en.sets.length}` : ''}</span>
      <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Optionen">${icon('dots')}</button>
    </div>
    ${last ? `<div class="exs-last"><span class="grow">Letztes Mal ${fmtDateShort(last.date)}: ${esc(cardioTxt({ sec: last.secs, km: last.km, lvl: last.lvl || null }, info))}</span>${canFillAny(en, last) ? `<button class="link-btn" data-act="exFill" data-ei="${ei}">${icon('fillIn')} Übernehmen</button>` : ''}</div>` : ''}
    ${pinNote(en.exerciseId) ? `<div class="exs-last">${pinChip(en.exerciseId)}</div>` : ''}
    ${exNotes(en, 'exs-last')}
    <div class="exs-sets cd-sets" style="--cd-cols:${cols}">
      <div class="set-head"><span></span><span>Min.</span>${dist ? '<span>km</span>' : ''}${lvl ? `<span>${esc(lvlHead)}</span>` : ''}${fill ? '<span></span>' : ''}<span></span></div>
      ${rows}
    </div>
    <div class="cd-sum" data-cdsum="${ei}" ${sum ? '' : 'hidden'}>${esc(sum)}</div>
    ${F('f_heart') ? Heart.cardioExtras(en, ei, w) + Heart.cardioFoot(ei) : `<button class="exs-add" data-act="setAdd" data-ei="${ei}">${icon('plus')} Abschnitt</button>`}
  </div>`;
}
const cdUpdateSum = ei => { const w = Workout.cur(), en = w && w.entries[ei], el = $(`[data-cdsum="${ei}"]`); if (!en || !el) return; const t = cardioSumTxt(en); el.textContent = t; el.hidden = !t; };
Inputs.cdDur = el => { const s = setAt(el); if (!s) return; s.durationSec = parseDur(el.value); Workout.save(); cdUpdateSum(el.dataset.ei); };
Inputs.cdKm = el => { const s = setAt(el); if (!s) return; const v = parseNum(el.value); s.distKm = v == null || v < 0 ? null : v; Workout.save(); cdUpdateSum(el.dataset.ei); };
Inputs.cdLvl = el => { const s = setAt(el); if (!s) return; const v = parseNum(el.value); s.level = v == null ? null : v; Workout.save(); };

/* ---------- Schlichte Eingabe: pro Satz nur Gewicht, Wdh., Haken ---------- */
function simpleCard(en, ei, w) {
  const ex = Ex.get(en.exerciseId);
  const type = Ex.type(ex);
  const last = S().woPrev !== false ? lastSessionFor(en.exerciseId, w) : null;
  const ws = workSets(en);
  const doneN = ws.filter(s => s.done).length;
  const complete = en.sets.length > 0 && en.sets.every(s => s.done);
  const rpe = !!S().simpleRPE;
  const uni = !!en.uni;
  const goal = goalTxt(en, type);
  const generic = type === 'sec' ? 'Sek.' : 'Wdh.';
  const [lo] = parseRange(en.target && en.target.reps);
  const fill = !!last;
  let no = 0;
  const rows = en.sets.map((s, si) => {
    const num = s.warmup ? 'W' : ++no;
    const prev = last && !s.warmup ? last.list[num - 1] || null : null;
    const d = `data-ei="${ei}" data-si="${si}"`;
    const bVal = type === 'sec' ? s.durationSec : s.reps;
    const wPh = prev && prev.w ? inputW(prev.w) : (type === 'kg' ? unit() : '+' + unit());
    const ph = sidePh(s, prev, type);
    const bPh = ph.l || (lo ? String(lo) : generic);
    return `<div class="set-row ${s.done ? 'done' : ''}" ${d}>
      ${setNumHtml(s, num, d)}
      <input class="set-in" inputmode="${kpIM('decimal')}" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${esc(wPh)}" aria-label="Gewicht" enterkeyhint="next">
      <input class="set-in" inputmode="${kpIM('numeric')}" data-in="setB" ${d} value="${bVal ?? ''}" placeholder="${esc(bPh)}" aria-label="${type === 'sec' ? 'Sekunden' : 'Wiederholungen'}${uni ? ' links' : ''}" enterkeyhint="${uni ? 'next' : 'done'}">
      ${uni ? rInput(s, d, type, ph, generic) : ''}
      ${rpe ? `<select class="set-rpe" data-ch="setRpe" ${d} aria-label="RPE"><option value="">RPE</option>${RPE_VALUES.map(v => `<option value="${v}" ${+s.rpe === v ? 'selected' : ''}>${nf(v, 1)}</option>`).join('')}</select>` : ''}
      ${fill ? fillBtn(s, prev, type, d) : ''}
      <button class="set-check" data-act="setDone" ${d} aria-label="${s.done ? 'Satz zurücksetzen' : 'Satz erledigt'}">${icon('check')}</button>
    </div>`;
  }).join('');
  return `<div class="ex-card exs ${complete ? 'complete' : ''}" id="ex-${en.uid}">
    <div class="exs-head">
      <div class="grow" style="min-width:0">
        <button class="ex-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button>
        <button class="exs-goal" data-act="goalEdit" data-ei="${ei}" aria-label="Ziel bearbeiten">${esc(goal)}</button>
      </div>
      <span class="exs-count ${complete ? 'ok' : ''}">${complete ? icon('check') : `<i class="roll">${doneN}</i>/${ws.length}`}</span>
      <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Optionen">${icon('dots')}</button>
    </div>
    ${en.formFix ? `<div class="exs-last fix-line">${fixTxt(en)}</div>` : ''}
    ${fixSetsTxt(en) ? `<div class="exs-last fix-line">${fixSetsTxt(en)}</div>` : ''}
    ${pinNote(en.exerciseId) ? `<div class="exs-last">${pinChip(en.exerciseId)}</div>` : ''}
    ${exNotes(en, 'exs-last')}
    <div class="exs-sets ${rpe ? 'rpe' : ''} ${uni ? 'uni' : ''} ${fill ? 'fill' : ''}">
      <div class="set-head"><span></span><span>${type === 'kg' ? unit() : '+' + unit()}</span>${uni ? '<span>Links</span><span>Rechts</span>' : `<span>${type === 'sec' ? 'Sek.' : 'Wdh.'}</span>`}${rpe ? '<span>RPE</span>' : ''}${fill ? '<span></span>' : ''}<span></span></div>
      ${rows}
    </div>
    <button class="exs-add" data-act="setAdd" data-ei="${ei}">${icon('plus')} Satz</button>
  </div>`;
}
Actions.woMore = async () => {
  const w = Workout.cur(); if (!w) return;
  const focus = S().woView === 'focus';
  const k = await actionMenu(w.name, [
    w.entries.length && { key: 'ov', label: 'Übersicht aller Übungen', icon: 'layers' },
    F('f_focus') && w.entries.length && { key: 'view', label: focus ? 'Listen-Ansicht' : 'Fokus-Ansicht', icon: focus ? 'list' : 'target' },
    { key: 'rename', label: 'Umbenennen', icon: 'edit' },
    F('f_woExtras') && { key: 'notes', label: 'Notiz, Datum & Körpergewicht', icon: 'note' },
    w.entries.length && { key: 'tpl', label: 'Als Workout speichern', icon: 'copy' },
    { key: 'cancel', label: w.editingId ? 'Bearbeitung verwerfen' : 'Workout abbrechen', icon: 'x', danger: true }
  ]);
  if (k === 'ov') Actions.woOverview();
  else if (k === 'view') Actions.woView({ dataset: { v: focus ? 'list' : 'focus' } });
  else if (k === 'rename') Actions.woRename();
  else if (k === 'notes') Modal.open({ title: 'Notiz & Details', size: 'sm', body: `<div class="form-grid">
      <label class="field"><span>Körpergewicht (${unit()})</span><input class="input" inputmode="decimal" data-in="woBw" value="${inputW(w.bodyWeightKg)}" placeholder="optional"></label>
      <label class="field"><span>Datum</span><input class="input" type="date" data-ch="woDate" value="${esc(w.date)}" max="${isoDate()}"></label>
      <label class="field full"><span>Notizen</span><textarea class="textarea" data-in="woNotes" placeholder="Wie lief's? Schlaf, Energie, Technik …">${esc(w.notes || '')}</textarea></label></div>` });
  else if (k === 'tpl') saveAsTemplate(w.entries, w.name);
  else if (k === 'cancel') Actions.woCancel();
};

/* ---------- Bausteine: Ziel, Fortschritt, Satz-Typen ---------- */
const workSets = en => en.sets.filter(s => !s.warmup);
const shortName = n => n.length > 18 ? n.replace(/\s*\(.*?\)\s*/g, ' ').trim().slice(0, 18) + (n.length > 18 ? '…' : '') : n;
/** Ziel kurz: „2 × 4–8 je Seite · 82,5 kg ↑“ – der Pfeil zeigt, dass die App eine Steigerung vorschlägt */
function goalTxt(en, type) {
  const gw = goalWeight(en), up = en.suggestion && en.suggestion.type === 'up';
  return `${workSets(en).length} × ${goalReps(en, type)}${type === 'sec' ? ' s' : ''}${en.uni ? ' je Seite' : ''}${gw ? ' · ' + fmtW(gw) : ''}${up ? ' ↑' : ''}`;
}
/** Notizen zur Übung: aus dem Plan (Workout-Vorlage) und nur für heute */
function exNotes(en, cls) {
  const t = en.target && en.target.notes, n = en.note;
  if (!t && !n) return '';
  const ic = icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px;flex-shrink:0"');
  return [t, n].filter(Boolean).map(x => `<div class="${cls}">${ic} ${esc(x)}</div>`).join('');
}
function goalWeight(en) {
  if (en.target && en.target.weightKg != null) return en.target.weightKg;
  if (en.suggestion && en.suggestion.weightKg) return en.suggestion.weightKg;
  const s = workSets(en).find(x => x.weightKg != null);
  return s ? s.weightKg : null;
}
function goalReps(en, type) {
  const t = en.target || {};
  if (t.reps) return String(t.reps).replace('-', '–');
  const s = workSets(en).find(x => (type === 'sec' ? x.durationSec : x.reps) != null);
  return s ? String(type === 'sec' ? s.durationSec : s.reps) : '–';
}
function exSummary(en, w, type) {
  const ws = workSets(en);
  const done = ws.filter(s => s.done);
  const dots = `<span class="dots">${ws.map(s => `<i class="${s.done ? 'on' : ''}"></i>`).join('')}</span>`;
  if (!done.length) return '';
  let txt;
  if (type === 'sec') txt = `${fmtClock(sum(done.map(s => (+s.durationSec || 0) + (s.durationSecR != null ? +s.durationSecR || 0 : 0))))} gesamt`;
  else {
    const vol = sum(done.map(setVol));
    const top = done.reduce((b, s) => (+s.weightKg || 0) > (+b.weightKg || 0) || ((+s.weightKg || 0) === (+b.weightKg || 0) && repsOf(s) > repsOf(b)) ? s : b, done[0]);
    const last = lastSessionFor(en.exerciseId, w);
    const lastVol = last ? sum(last.list.slice(0, done.length).map(p => (p.w || 0) * (p.u ? p.u[0] + p.u[1] : p.r || 0))) : 0;
    const d = lastVol && vol ? (vol - lastVol) / lastVol : null;
    txt = `${vol ? `<b>${fmtTon(vol)}</b>` : `<b>${sum(done.map(repsSum))} Wdh.</b>`} · Top ${top.weightKg ? wNum(top.weightKg) + '×' : ''}${repsTxt(top)}${d != null && Math.abs(d) >= .005 ? ` <span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '↑' : '↓'} ${nf(Math.abs(d) * 100, 0)} %</span>` : ''}`;
  }
  return `<div class="ex-sum">${dots}<span>${txt}</span></div>`;
}
const KIND_LABEL = { drop: 'D', fail: 'F' };
function setNumHtml(s, num, d) {
  const fix = s.fix && !s.warmup;
  const cls = s.warmup ? 'warm' : fix ? 'fix' : (s.kind || '');
  const kind = fix ? `<i>${icon('refresh')}</i>` : !s.warmup && KIND_LABEL[s.kind] ? `<i>${KIND_LABEL[s.kind]}</i>` : '';
  return `<button class="set-num ${cls}" data-act="setMenu" ${d} aria-label="Satz ${num} Optionen${fix ? ' (Form-Fix)' : ''}">${num}${kind}</button>`;
}
/** Hinweis „Form-Fix bei Satz 2" unter der Übung (Satznummern ohne Aufwärmsätze) */
function fixSetsTxt(en) {
  let no = 0;
  const nums = en.sets.map(s => s.warmup ? null : (++no, s.fix ? no : null)).filter(Boolean);
  return nums.length ? `${icon('refresh').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} Form-Fix bei Satz ${nums.join(', ')} – zählt nicht gegen dich` : '';
}


/* ---------- Fokus-Modus ---------- */
function focusIndex(w) {
  if (Number.isInteger(w.focusE) && w.entries[w.focusE]) return w.focusE;
  if (w.sel.e >= 0 && w.entries[w.sel.e]) return w.sel.e;
  return Math.max(0, w.entries.length - 1);
}
const firstOpen = en => en.sets.findIndex(s => !s.done);
function focusView(w) {
  const ei = focusIndex(w);
  const en = w.entries[ei];
  const ex = Ex.get(en.exerciseId);
  const type = Ex.type(ex);
  if (type === 'cardio') {
    const nP = ei > 0 ? w.entries[ei - 1] : null, nN = ei < w.entries.length - 1 ? w.entries[ei + 1] : null;
    return `<div class="focus" id="ex-${en.uid}">
      <div class="fc-head">
        <button class="btn-icon" data-act="focusNav" data-d="-1" aria-label="Vorherige Übung" ${nP ? '' : 'disabled style="opacity:.3"'}>${icon('chevL')}</button>
        <div class="fc-title"><div class="fc-of">Übung ${ei + 1} von ${w.entries.length}</div><button class="fc-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button></div>
        <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Menü">${icon('dots')}</button>
      </div>
      ${cardioCard(en, ei, w).replace('class="ex-card exs', 'class="ex-card exs fc-cardio')}
    </div>
    <div class="fc-nav">
      <button class="btn btn-secondary" data-act="focusNav" data-d="-1" ${nP ? '' : 'disabled'}>${icon('chevL')}<span>${nP ? esc(shortName(nP.exerciseName)) : 'Anfang'}</span></button>
      <button class="btn btn-secondary" data-act="focusNav" data-d="1" ${nN ? '' : 'disabled'}><span>${nN ? esc(shortName(nN.exerciseName)) : 'Ende'}</span>${icon('chevR')}</button>
    </div>`;
  }
  const last = lastSessionFor(en.exerciseId, w);
  const si = w.sel.e === ei && en.sets[w.sel.s] ? w.sel.s : firstOpen(en);
  const s = si >= 0 ? en.sets[si] : null;
  const ws = workSets(en);
  const uni = !!en.uni;
  let workNo = 0;
  const pills = en.sets.map((x, i) => {
    const label = x.warmup ? 'W' : ++workNo;
    const val = type === 'sec' ? (x.durationSec ? x.durationSec + (x.durationSecR != null ? '/' + x.durationSecR : '') + ' s' : '–') : (x.reps != null || x.weightKg != null ? `${x.weightKg ? wNum(x.weightKg) : '0'}×${x.reps ?? '?'}${x.repsR != null ? '/' + x.repsR : ''}` : '–');
    return `<button class="fc-pill ${x.done ? 'done' : ''} ${i === si ? 'cur' : ''} ${x.warmup ? 'warm' : ''}" data-act="setSel" data-ei="${ei}" data-si="${i}"><b>${label}${!x.warmup && KIND_LABEL[x.kind] ? KIND_LABEL[x.kind] : ''}</b><small>${val}</small></button>`;
  }).join('');
  const nPrev = ei > 0 ? w.entries[ei - 1] : null, nNext = ei < w.entries.length - 1 ? w.entries[ei + 1] : null;
  let cur;
  if (s) {
    const no = s.warmup ? null : en.sets.slice(0, si + 1).filter(x => !x.warmup).length;
    const prev = last && !s.warmup ? last.list[no - 1] || null : null;
    const d = `data-ei="${ei}" data-si="${si}"`;
    const wPh = prev && prev.w ? inputW(prev.w) : '';
    const ph = sidePh(s, prev, type);
    const [lo] = parseRange(en.target && en.target.reps);
    const bPh = ph.l || (lo ? String(lo) : '');
    const bLabel = type === 'sec' ? 'Sekunden' : 'Wiederholungen', bShort = type === 'sec' ? 'Sek.' : 'Wdh.';
    cur = `<div class="fc-cur">
      <div class="fc-label"><b>${s.warmup ? 'Aufwärmsatz' : `Satz ${no} von ${ws.length}`}${s.done ? ' <span class="badge accent">erledigt</span>' : ''}</b></div>
      <div class="fc-steppers ${uni ? 'uni' : ''}">
        <div class="fc-big"><div class="stepper-label">${type === 'kg' ? 'Gewicht' : 'Zusatzgewicht'} (${unit()})</div>
          <div class="stepper"><button data-act="step" data-f="w" data-d="-1" ${d} aria-label="Weniger Gewicht">${icon('minus')}</button>
          <input class="fc-in" inputmode="${kpIM('decimal')}" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${esc(wPh)}" aria-label="Gewicht">
          <button data-act="step" data-f="w" data-d="1" ${d} aria-label="Mehr Gewicht">${icon('plus')}</button></div></div>
        <div class="fc-big"><div class="stepper-label">${uni ? bShort + ' links' : bLabel}</div>
          <div class="stepper"><button data-act="step" data-f="b" data-d="-1" ${d} aria-label="Weniger">${icon('minus')}</button>
          <input class="fc-in" inputmode="${kpIM('numeric')}" data-in="setB" ${d} value="${(type === 'sec' ? s.durationSec : s.reps) ?? ''}" placeholder="${esc(bPh)}" aria-label="${bLabel}${uni ? ' links' : ''}">
          <button data-act="step" data-f="b" data-d="1" ${d} aria-label="Mehr">${icon('plus')}</button></div></div>
        ${uni ? `<div class="fc-big"><div class="stepper-label">${bShort} rechts</div>
          <div class="stepper"><button data-act="step" data-f="bR" data-d="-1" ${d} aria-label="Weniger rechts">${icon('minus')}</button>
          ${rInput(s, d, type, ph, '', 'fc-in')}
          <button data-act="step" data-f="bR" data-d="1" ${d} aria-label="Mehr rechts">${icon('plus')}</button></div></div>` : ''}
      </div>
      ${S().simpleRPE ? `<div class="rpe-chips"><span class="tiny dim bold" style="width:30px">RPE</span>${[6, 7, 8, 9, 10].map(v => `<button data-act="rpePick" data-v="${v}" ${d} class="${+s.rpe === v ? 'active' : ''}">${v}</button>`).join('')}</div>` : ''}
      <button class="btn ${s.done ? 'btn-secondary' : 'btn-primary'} btn-lg btn-block" data-act="setDone" ${d}>${icon(s.done ? 'undo' : 'check')} ${s.done ? 'Rückgängig' : 'Satz erledigt'}</button>
      <div class="row">
        ${type === 'kg' && F('f_plates') ? `<button class="btn btn-ghost btn-sm" data-act="plates" ${d}>${icon('plate')} Scheiben</button>` : ''}
        <span class="grow"></span>
        <button class="btn btn-ghost btn-sm" data-act="setMenu" ${d}>${icon('dots')} Satz-Optionen</button>
      </div>
    </div>`;
  } else {
    cur = `<div class="fc-done"><div class="big-check">${icon('check')}</div><h3>${esc(en.exerciseName)} erledigt</h3>
      <p class="small dim mt-8">${ws.length} Sätze geschafft.${nNext ? ` Weiter mit ${esc(nNext.exerciseName)}?` : ''}</p>
      <div class="row mt-16" style="justify-content:center;flex-wrap:wrap">
        <button class="btn btn-secondary" data-act="setAdd" data-ei="${ei}">${icon('plus')} Noch ein Satz</button>
        ${nNext ? `<button class="btn btn-primary" data-act="focusNav" data-d="1">Nächste Übung ${icon('chevR')}</button>` : `<button class="btn btn-primary" data-act="woFinish">${icon('check')} Workout beenden</button>`}
      </div></div>`;
  }
  return `<div class="focus" id="ex-${en.uid}">
      <div class="fc-head">
        <button class="btn-icon" data-act="focusNav" data-d="-1" aria-label="Vorherige Übung" ${nPrev ? '' : 'disabled style="opacity:.3"'}>${icon('chevL')}</button>
        <div class="fc-title"><div class="fc-of">Übung ${ei + 1} von ${w.entries.length}</div><button class="fc-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button></div>
        <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Menü">${icon('dots')}</button>
      </div>
      ${pinNote(en.exerciseId) ? `<div class="center mt-8">${pinChip(en.exerciseId)}</div>` : ''}
      ${en.formFix ? `<div class="center mt-8"><span class="hint-chip fix-line">${fixTxt(en)}</span></div>` : ''}
      ${fixSetsTxt(en) ? `<div class="center mt-8"><span class="hint-chip fix-line">${fixSetsTxt(en)}</span></div>` : ''}
      <div class="center"><button class="exs-goal" data-act="goalEdit" data-ei="${ei}">${esc(goalTxt(en, type))}</button></div>
      ${exNotes(en, 'center small dim mt-8')}
      <div class="fc-sets">${pills}<button class="fc-pill add" data-act="setAdd" data-ei="${ei}" aria-label="Satz hinzufügen">${icon('plus')}</button></div>
      ${cur}
      ${exSummary(en, w, type)}
    </div>
    <div class="fc-nav">
      <button class="btn btn-secondary" data-act="focusNav" data-d="-1" ${nPrev ? '' : 'disabled'}>${icon('chevL')}<span>${nPrev ? esc(shortName(nPrev.exerciseName)) : 'Anfang'}</span></button>
      <button class="btn btn-secondary" data-act="focusNav" data-d="1" ${nNext ? '' : 'disabled'}><span>${nNext ? esc(shortName(nNext.exerciseName)) : 'Ende'}</span>${icon('chevR')}</button>
    </div>`;
}
(() => {
  let sx = 0, sy = 0, on = false;
  document.addEventListener('touchstart', e => { const f = e.target.closest('.focus'); if (!f || e.target.closest('input, .stepper, .fc-sets, .rpe-chips')) { on = false; return; } on = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!on) return; on = false;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) Actions.focusNav({ dataset: { d: dx < 0 ? 1 : -1 } });
  }, { passive: true });
})();
Actions.woView = el => {
  const w = Workout.cur();
  if (w && el.dataset.v === 'focus') { w.focusE = w.sel.e >= 0 ? w.sel.e : 0; Workout.save(); }
  Store.saveSettings({ woView: el.dataset.v });
  App.renderCurrent();
  Scroll.to(0);
};
Actions.focusNav = el => {
  const w = Workout.cur(); if (!w) return;
  const ei = clamp(focusIndex(w) + +el.dataset.d, 0, w.entries.length - 1);
  w.focusE = ei;
  const fo = firstOpen(w.entries[ei]);
  w.sel = { e: ei, s: fo >= 0 ? fo : w.entries[ei].sets.length - 1 };
  Workout.save();
  App.renderCurrent();
  Scroll.to(0, true);
};
Actions.woJump = el => {
  const w = Workout.cur(); if (!w) return;
  const ei = +el.dataset.ei;
  const en = w.entries[ei]; if (!en) return;
  const fo = firstOpen(en);
  if (S().woView === 'focus') {
    w.focusE = ei;
    w.sel = { e: ei, s: fo >= 0 ? fo : en.sets.length - 1 };
    Workout.save();
    App.renderCurrent();
    return;
  }
  if (woCollapse()) return Actions.exOpen(el);
  if (fo >= 0) selectSet(ei, fo);
  scrollToExercise(en);
};
function scrollToExercise(en) {
  const card = $('#ex-' + en.uid);
  const head = $('.wo-head');
  if (!card) return;
  // Karten darüber, die gerade noch zu-/aufklappen, schon mit ihrer Endhöhe einrechnen
  let shift = 0;
  for (const [id, d] of cardDelta) { const c = document.getElementById(id); if (c && c !== card && (c.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)) shift += d; }
  const top = Scroll.topOf(card) + shift - (head ? head.getBoundingClientRect().bottom - Scroll.el.getBoundingClientRect().top : 120) - 8;
  Scroll.to(top, S().motion === 'full');
}
/** Nächster offener Satz: erst in derselben Übung, dann in den folgenden, dann von vorn */
function nextOpenAfter(w, ei, si) {
  const n = w.entries.length;
  for (let k = 0; k < n; k++) {
    const e = (ei + k) % n;
    const sets = w.entries[e].sets;
    const from = k === 0 ? si + 1 : 0;
    for (let i = from; i < sets.length; i++) if (!sets[i].done) return { e, s: i };
    if (k === 0) for (let i = 0; i < si; i++) if (!sets[i].done) return { e, s: i };
  }
  return { e: -1, s: -1 };
}

/* ---------- Übersicht aller Übungen ---------- */
function overviewHtml(w) {
  const st = liveStats(w);
  return `<div class="pr-grid">
      <div class="pr-box"><span>Übungen</span><b>${w.entries.length}</b></div>
      <div class="pr-box"><span>Sätze</span><b>${st.done}/${st.total}</b></div>
      <div class="pr-box"><span>Volumen</span><b>${fmtTon(st.vol)}</b></div>
      <div class="pr-box"><span>${w.editingId ? 'Datum' : 'Dauer'}</span><b>${w.editingId ? fmtDateShort(w.date) : fmtClock((Date.now() - w.startedAt) / 1000)}</b></div>
    </div>
    <div class="list mt-16">${w.entries.map((en, ei) => {
      const ex = Ex.get(en.exerciseId), type = Ex.type(ex);
      const ws = workSets(en), done = ws.filter(s => s.done);
      const gw = goalWeight(en);
      const cardio = type === 'cardio';
      const goal = cardio ? cardioGoalTxt(en) : `${ws.length} × ${goalReps(en, type)}${type === 'sec' ? ' s' : ''}${en.uni ? ' je Seite' : ''}${gw ? ' · ' + fmtW(gw) : ''} · Pause ${fmtClock((en.target && en.target.restSec) || S().defaultRestSec)}`;
      const doneTxt = cardio ? (done.length ? cardioTxt(cardioTotals(done), cardioInfo(ex)) : '') : done.map(s => type === 'sec' ? secTxt(s) : `${s.weightKg ? wNum(s.weightKg) + '×' : ''}${repsTxt(s)}`).join(' · ');
      return `<div class="list-item ov-item">
        <span class="ex-idx ${catCls(ex && ex.category)}">${ws.length && done.length === ws.length ? icon('check').replace('<svg', '<svg width="16" height="16"') : ei + 1}</span>
        <div class="li-main"><div class="li-title">${esc(en.exerciseName)} <span class="small dim">${done.length}/${ws.length}</span></div>
          <div class="li-sub">${esc(goal)}</div>${doneTxt ? `<div class="ov-done">✓ ${esc(doneTxt)}</div>` : ''}</div>
        <div class="ov-acts">
          <button class="btn-icon" data-x="up" data-ei="${ei}" aria-label="Nach oben" ${ei === 0 ? 'disabled style="opacity:.3"' : ''}>${icon('chevU')}</button>
          <button class="btn-icon" data-x="down" data-ei="${ei}" aria-label="Nach unten" ${ei === w.entries.length - 1 ? 'disabled style="opacity:.3"' : ''}>${icon('chevD')}</button>
          ${cardio ? '' : `<button class="btn-icon" data-x="goal" data-ei="${ei}" aria-label="Ziel bearbeiten">${icon('edit')}</button>`}
          <button class="btn-icon" data-x="go" data-ei="${ei}" aria-label="Hinspringen">${icon('chevR')}</button>
        </div></div>`;
    }).join('') || '<div class="list-item"><span class="dim">Noch keine Übungen</span></div>'}</div>
    <div class="row mt-12"><button class="btn btn-secondary grow" data-x="add">${icon('plus')} Übung hinzufügen</button><button class="btn btn-secondary grow" data-x="tpl" ${w.entries.length ? '' : 'disabled'}>${icon('copy')} Als Vorlage</button></div>`;
}
Actions.woOverview = () => {
  const w = Workout.cur(); if (!w) return;
  const m = Modal.open({ title: 'Workout-Übersicht', size: 'lg', body: overviewHtml(w) });
  const refresh = () => { if (!m.closed && Workout.cur()) { m.setBody(overviewHtml(Workout.cur())); App.renderCurrent(); } };
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b || b.disabled) return;
    const cw = Workout.cur(); if (!cw) return;
    const ei = +b.dataset.ei;
    switch (b.dataset.x) {
      case 'up': case 'down': {
        const j = b.dataset.x === 'up' ? ei - 1 : ei + 1;
        if (j < 0 || j >= cw.entries.length) return;
        [cw.entries[ei], cw.entries[j]] = [cw.entries[j], cw.entries[ei]];
        if (cw.focusE === ei) cw.focusE = j; else if (cw.focusE === j) cw.focusE = ei; if (cw.openE === ei) cw.openE = j; else if (cw.openE === j) cw.openE = ei;
        Workout.autoSelect(); Workout.save(); refresh(); break;
      }
      case 'goal': await openGoalEditor(ei); refresh(); break;
      case 'go': m.close(); Actions.woJump({ dataset: { ei } }); break;
      case 'add': await Actions.woAddEx(); refresh(); break;
      case 'tpl': await saveAsTemplate(cw.entries, cw.name); break;
    }
  });
};

/* ---------- Ziel-Editor: was, wie oft, wie schwer, wie lange Pause ---------- */
function openGoalEditor(ei) {
  return new Promise(resolve => {
    const w = Workout.cur(); const en = w && w.entries[ei];
    if (!en) return resolve(false);
    const type = Ex.type(Ex.get(en.exerciseId));
    const ws = workSets(en);
    const doneN = ws.filter(s => s.done).length;
    const [lo0, hi0] = parseRange(en.target && en.target.reps);
    const firstB = ws.find(s => (type === 'sec' ? s.durationSec : s.reps) != null);
    const st = {
      sets: Math.max(1, ws.length || (en.target && en.target.sets) || 3),
      lo: lo0 || (firstB ? (type === 'sec' ? firstB.durationSec : firstB.reps) : (type === 'sec' ? 60 : 8)),
      hi: hi0 && hi0 !== lo0 ? hi0 : null,
      w: goalWeight(en) != null ? round(toU(goalWeight(en)), 2) : null,
      rest: (en.target && en.target.restSec) || S().defaultRestSec,
      note: en.note || '',
      apply: true
    };
    const bStep = type === 'sec' ? 5 : 1;
    const bName = type === 'sec' ? 'Sekunden' : 'Wiederholungen';
    const summary = () => `${st.sets} × ${st.lo}${st.hi ? '–' + st.hi : ''}${type === 'sec' ? ' s' : ''}${st.w ? ` @ ${nf(st.w, 2)} ${unit()}` : ''} · Pause ${fmtClock(st.rest)}`;
    const stepper = (k, val, label) => `<div class="stepper"><button data-g="${k}" data-d="-1" aria-label="${label} weniger">${icon('minus')}</button><input data-gin="${k}" inputmode="decimal" value="${val ?? ''}" placeholder="–" aria-label="${label}"><button data-g="${k}" data-d="1" aria-label="${label} mehr">${icon('plus')}</button></div>`;
    const body = () => `
      <div class="ge-sum" id="geSum">${esc(summary())}</div>
      <div class="mt-12">
        <div class="ge-row"><div class="ge-l"><b>Arbeitssätze</b>${doneN ? `<small>${doneN} schon erledigt</small>` : ''}</div>${stepper('sets', st.sets, 'Sätze')}</div>
        <div class="ge-row stack"><div class="ge-l"><b>${bName}</b></div>
          <div class="ge-pair">${stepper('lo', st.lo, 'von')}<span class="dim">–</span>${stepper('hi', st.hi, 'bis')}</div>
          <div class="ge-quick" style="width:100%">${(type === 'sec' ? [[30], [45], [60], [90]] : [[5], [8], [10], [12], [6, 8], [8, 12], [12, 15]]).map(([a, b]) => `<button data-q="${a}-${b || ''}">${a}${b ? '–' + b : ''}</button>`).join('')}</div></div>
        <div class="ge-row"><div class="ge-l"><b>${type === 'kg' ? 'Gewicht' : 'Zusatzgewicht'} (${unit()})</b></div>${stepper('w', st.w != null ? String(st.w).replace('.', ',') : '', 'Gewicht')}</div>
        <div class="ge-row"><div class="ge-l"><b>Pause</b></div>${stepper('rest', fmtClock(st.rest), 'Pause')}</div>
        <div class="ge-row"><div class="ge-l"><b>Für alle offenen Sätze übernehmen</b></div><label class="switch"><input type="checkbox" switch id="geApply" ${st.apply ? 'checked' : ''}><span></span></label></div>
      </div>
      <label class="field mt-12"><span>Notiz zur Übung</span><input class="input" id="geNote" value="${esc(st.note)}" placeholder="z. B. Sitzhöhe 4, enger Griff"></label>`;
    let saved = false;
    const m = Modal.open({
      title: en.exerciseName, size: 'sm', body: body(),
      foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">${icon('check')} Übernehmen</button>`,
      onClose: () => resolve(saved)
    });
    const sync = () => {
      $$('[data-gin]', m.el).forEach(i => { const k = i.dataset.gin; if (document.activeElement !== i) i.value = k === 'rest' ? fmtClock(st.rest) : k === 'w' ? (st.w != null ? String(st.w).replace('.', ',') : '') : (st[k] ?? ''); });
      $('#geSum', m.el).textContent = summary();
    };
    m.el.addEventListener('click', e => {
      const q = e.target.closest('[data-q]');
      if (q) { const [a, b] = q.dataset.q.split('-'); st.lo = +a; st.hi = b ? +b : null; sync(); return; }
      const g = e.target.closest('[data-g]');
      if (g) {
        const d = +g.dataset.d, k = g.dataset.g;
        if (k === 'sets') st.sets = clamp(st.sets + d, Math.max(1, doneN), 20);
        else if (k === 'lo') st.lo = Math.max(1, (st.lo || 0) + d * bStep);
        else if (k === 'hi') { st.hi = st.hi == null ? (d > 0 ? st.lo + bStep : null) : st.hi + d * bStep; if (st.hi != null && st.hi <= st.lo) st.hi = null; }
        else if (k === 'w') { const step = S().weightSteps; const cur = st.w || 0; const kk = cur / step; st.w = Math.max(0, round((Math.abs(kk - Math.round(kk)) < 1e-6 ? cur + d * step : (d > 0 ? Math.ceil(kk) : Math.floor(kk)) * step), 2)); }
        else if (k === 'rest') st.rest = clamp(st.rest + d * 15, 0, 900);
        vibrate(6);
        sync();
        return;
      }
      const x = e.target.closest('[data-x]');
      if (!x) return;
      if (x.dataset.x === 'cancel') return m.close();
      // Übernehmen
      const cw = Workout.cur(); const ce = cw && cw.entries[ei];
      if (!ce) return m.close();
      st.note = $('#geNote', m.el).value.trim();
      st.apply = $('#geApply', m.el).checked;
      const cur = workSets(ce);
      if (st.sets > cur.length) {
        const tpl = cur[cur.length - 1] || {};
        for (let i = cur.length; i < st.sets; i++) ce.sets.push(Workout.newSet({ reps: tpl.reps, repsR: tpl.repsR, weightKg: tpl.weightKg, durationSec: tpl.durationSec, durationSecR: tpl.durationSecR }));
      } else if (st.sets < cur.length) {
        let remove = cur.length - st.sets;
        for (let i = ce.sets.length - 1; i >= 0 && remove > 0; i--) if (!ce.sets[i].warmup && !ce.sets[i].done) { ce.sets.splice(i, 1); remove--; }
      }
      ce.target = { ...(ce.target || {}), sets: st.sets, reps: st.hi ? `${st.lo}-${st.hi}` : String(st.lo || ''), restSec: st.rest, weightKg: st.w != null ? fromU(st.w) : null };
      ce.note = st.note;
      if (st.apply) ce.sets.forEach(s => {
        if (s.done || s.warmup) return;
        if (st.w != null) s.weightKg = fromU(st.w);
        if (st.lo) { if (type === 'sec') s.durationSec = st.lo; else s.reps = st.lo; if (ce.uni) { if (type === 'sec') s.durationSecR = st.lo; else s.repsR = st.lo; } }
      });
      Workout.autoSelect();
      Workout.save();
      saved = true;
      m.close();
      App.renderCurrent();
      toast('Ziel aktualisiert', 'success');
    });
    m.el.addEventListener('change', e => {
      const i = e.target.closest('[data-gin]');
      if (!i) return;
      const k = i.dataset.gin;
      if (k === 'rest') { const p = String(i.value).split(':'); const sec = p.length > 1 ? (+p[0] || 0) * 60 + (+p[1] || 0) : parseNum(i.value); if (sec != null) st.rest = clamp(Math.round(sec), 0, 900); }
      else { const v = parseNum(i.value); if (k === 'w') st.w = v == null ? null : Math.max(0, v); else if (k === 'sets') st.sets = clamp(Math.round(v || 1), Math.max(1, doneN), 20); else if (k === 'hi') st.hi = v && v > st.lo ? Math.round(v) : null; else if (v) st[k] = Math.max(1, Math.round(v)); }
      sync();
    });
  });
}
Actions.goalEdit = el => openGoalEditor(+el.dataset.ei);

function updateTopH() {
  const tb = $('#topbar');
  if (tb) document.documentElement.style.setProperty('--top-h', tb.offsetHeight + 'px');
}
window.addEventListener('resize', debounce(updateTopH, 150));
