/* Trainio – Aktives Workout: Ansicht & Bedienung (Sätze, Fokus, Ziel-Editor, Wischgesten, Abschluss & Score)
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
const woSimple = () => S().woStyle !== 'detailed';
function renderActiveWorkout(el, w) {
  const st = liveStats(w);
  const hBefore = cardHeights(el);
  const focus = S().woView === 'focus' && F('f_focus') && w.entries.length > 0;
  if (woSimple()) {
    el.innerHTML = `
      <div class="wo-head wo-simple">
        <div class="wo-main">
          <div class="grow" style="min-width:0">
            <div class="wo-title ellipsis">${esc(w.name)}</div>
            <div class="wo-stats small dim">${w.editingId ? `<span>Bearbeitung · ${fmtDate(w.date)}</span>` : `<span class="wo-timer" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span>`}<span>${st.done}/${st.total} Sätze</span></div>
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
    return;
  }
  el.innerHTML = `
    <div class="wo-head">
      <div class="wo-main">
        <div class="grow" style="min-width:0">
          <button class="ex-name ellipsis" data-act="woRename" style="background:none;border:0;padding:0;color:var(--text);font-weight:800;font-size:calc(17px * var(--fs));max-width:100%;text-align:left">${esc(w.name)} ${icon('edit').replace('<svg', '<svg width="14" height="14" style="vertical-align:-1px;opacity:.5"')}</button>
          <div class="wo-stats small dim">
            ${w.editingId ? `<span class="badge warn">Bearbeitung · ${fmtDate(w.date)}</span>` : `<span class="wo-timer" style="font-size:calc(16px * var(--fs));color:var(--text)" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span>`}
            <span>${st.done}/${st.total} Sätze</span><span>${fmtTon(st.vol)}</span>
          </div>
        </div>
        <button class="btn-icon" data-act="woMore" aria-label="Weitere Optionen">${icon('dots')}</button>
        <button class="btn btn-primary" data-act="woFinish">${icon('check')} ${w.editingId ? 'Speichern' : 'Beenden'}</button>
      </div>
      <div class="wo-progress" style="width:100%"><i style="width:${st.total ? st.done / st.total * 100 : 0}%"></i></div>
      ${w.entries.length ? `<div class="wo-tools">
        ${F('f_focus') ? '' : '<!--'}<div class="seg sm wo-view" role="group" aria-label="Ansicht">
          <button class="${focus ? '' : 'active'}" data-act="woView" data-v="list" aria-label="Listen-Ansicht: alle Übungen" title="Liste">${icon('list')}<span>Liste</span></button>
          <button class="${focus ? 'active' : ''}" data-act="woView" data-v="focus" aria-label="Fokus-Ansicht: eine Übung groß" title="Fokus">${icon('target')}<span>Fokus</span></button>
        </div>${F('f_focus') ? '' : '-->'}
        ${S().woStrip !== false ? woStrip(w, focus) : `<button class="ws-item ws-all" data-act="woOverview">${icon('layers')} Übersicht</button>`}
      </div>` : ''}
    </div>
    <div class="wo-body">
    ${focus ? focusView(w) : `<div id="woEntries" class="${S().showRPE ? '' : 'no-rpe'} ${S().woPrev === false ? 'no-prev' : ''}">
      ${w.entries.length ? w.entries.map((en, ei) => woCard(en, ei, w, exerciseCard)).join('') : `<div class="card mb-12">${emptyState('dumbbell', 'Noch keine Übungen', 'Füge die erste Übung hinzu und leg los.')}</div>`}
    </div>`}
    <div class="row" style="gap:8px"><button class="btn btn-secondary btn-lg grow" data-act="woAddEx">${icon('plus')} Übung hinzufügen</button><button class="btn btn-secondary btn-lg" data-act="startCardio" aria-label="Cardio hinzufügen">${icon('heart')} Cardio</button></div>
    ${F('f_woExtras') ? '' : '<div hidden>'}<div class="card mt-16">
      <div class="form-grid">
        <label class="field"><span>Körpergewicht (${unit()})</span><input class="input" inputmode="decimal" data-in="woBw" value="${inputW(w.bodyWeightKg)}" placeholder="optional"></label>
        <label class="field"><span>Datum</span><input class="input" type="date" data-ch="woDate" value="${esc(w.date)}" max="${isoDate()}"></label>
        <label class="field full"><span>Notizen</span><textarea class="textarea" data-in="woNotes" placeholder="Wie lief's? Schlaf, Energie, Technik …" style="min-height:72px">${esc(w.notes || '')}</textarea></label>
      </div>
    </div>${F('f_woExtras') ? '' : '</div>'}
    <button class="btn btn-primary btn-block btn-lg mt-16" id="woFinishEnd" data-act="woFinish">${icon('check')} ${w.editingId ? 'Änderungen speichern' : 'Workout beenden'}</button>
    <button class="btn btn-danger-ghost btn-block mt-12" data-act="woCancel">${icon('x')} ${w.editingId ? 'Bearbeitung verwerfen' : 'Workout abbrechen'}</button>
    </div>`;
  updateTopH();
  fxOpenCard(el);
  animCardHeights(el, hBefore);
  animWoProgress(el, w, st);
  // Aktuelle Übung in der Leiste sichtbar halten
  const strip = $('#woStrip', el), cur = strip && $('.ws-item.cur', strip);
  if (cur) strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
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
function woCard(en, ei, w, full) {
  const type = Ex.type(Ex.get(en.exerciseId));
  if (type === 'cardio') full = cardioCard;
  if (!woCollapse() || openIndex(w) === ei) return full(en, ei, w).replace('class="ex-card', 'class="ex-card ex-open');
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
  return `<input class="${cls}" inputmode="numeric" data-in="setBR" ${d} value="${v ?? ''}" placeholder="${esc(ph.r || generic)}" data-ph0="${esc(ph.r0 || generic)}" aria-label="${type === 'sec' ? 'Sekunden rechts' : 'Wiederholungen rechts'}" enterkeyhint="done">`;
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
  const what = info.mode === 'dist' ? 'Dauer + Distanz' : info.mode === 'level' && info.lvl ? `Dauer + ${info.lvl}` : 'Dauer';
  return m ? `Ziel ${nf(m, 0)} min · ${what}` : what;
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
      <input class="set-in" inputmode="decimal" data-in="cdDur" ${d} value="${esc(durIn(s.durationSec))}" placeholder="${esc(durPh)}" aria-label="Dauer in Minuten (z. B. 30 oder 30:15)" enterkeyhint="next">
      ${dist ? `<input class="set-in" inputmode="decimal" data-in="cdKm" ${d} value="${s.distKm != null ? esc(nf(s.distKm, 3)) : ''}" placeholder="${esc(kmPh)}" aria-label="Distanz in km" enterkeyhint="${lvl ? 'next' : 'done'}">` : ''}
      ${lvl ? `<input class="set-in" inputmode="decimal" data-in="cdLvl" ${d} value="${s.level != null ? esc(nf(s.level, 1)) : ''}" placeholder="${esc(lvPh)}" aria-label="${esc(lvl)}" enterkeyhint="done">` : ''}
      ${fill ? fillBtn(s, prev, 'cardio', d) : ''}
      <button class="set-check" data-act="setDone" ${d} aria-label="${s.done ? 'Abschnitt zurücksetzen' : 'Abschnitt erledigt'}">${icon('check')}</button>
    </div>`;
  }).join('');
  const sum = cardioSumTxt(en);
  return `<div class="ex-card exs cd-card ${complete ? 'complete' : ''}" id="ex-${en.uid}">
    <div class="exs-head">
      <div class="grow" style="min-width:0">
        <button class="ex-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button>
        <div class="exs-goal" style="text-decoration:none">${esc(cardioGoalTxt(en))}</div>
      </div>
      <span class="exs-count ${complete ? 'ok' : ''}">${complete ? icon('check') : en.sets.length > 1 ? `${doneN}/${en.sets.length}` : ''}</span>
      <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Optionen">${icon('dots')}</button>
    </div>
    ${last ? `<div class="exs-last"><span class="grow">Letztes Mal ${fmtDateShort(last.date)}: ${esc(cardioTxt({ sec: last.secs, km: last.km, lvl: last.lvl || null }, info))}</span>${canFillAny(en, last) ? `<button class="link-btn" data-act="exFill" data-ei="${ei}">${icon('fillIn')} Übernehmen</button>` : ''}</div>` : ''}
    ${pinNote(en.exerciseId) ? `<div class="exs-last">${pinChip(en.exerciseId)}</div>` : ''}
    ${en.note ? `<div class="exs-last">${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(en.note)}</div>` : ''}
    <div class="exs-sets cd-sets" style="--cd-cols:${cols}">
      <div class="set-head"><span></span><span>Min.</span>${dist ? '<span>km</span>' : ''}${lvl ? `<span>${esc(lvlHead)}</span>` : ''}${fill ? '<span></span>' : ''}<span></span></div>
      ${rows}
    </div>
    <div class="cd-sum" data-cdsum="${ei}" ${sum ? '' : 'hidden'}>${esc(sum)}</div>
    <button class="exs-add" data-act="setAdd" data-ei="${ei}">${icon('plus')} Abschnitt</button>
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
  const gw = goalWeight(en);
  const uni = !!en.uni;
  const goal = `${ws.length} × ${goalReps(en, type)}${type === 'sec' ? ' s' : ''}${uni ? ' je Seite' : ''}${gw ? ' · ' + fmtW(gw) : ''}`;
  const fmtPrev = p => type === 'sec' ? prevSec(p) : (p.w ? `${wNum(p.w)}×${prevR(p)}` : `${prevR(p)}`);
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
      <input class="set-in" inputmode="decimal" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${esc(wPh)}" aria-label="Gewicht" enterkeyhint="next">
      <input class="set-in" inputmode="numeric" data-in="setB" ${d} value="${bVal ?? ''}" placeholder="${esc(bPh)}" aria-label="${type === 'sec' ? 'Sekunden' : 'Wiederholungen'}${uni ? ' links' : ''}" enterkeyhint="${uni ? 'next' : 'done'}">
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
      <span class="exs-count ${complete ? 'ok' : ''}">${complete ? icon('check') : `${doneN}/${ws.length}`}</span>
      <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Optionen">${icon('dots')}</button>
    </div>
    ${pinNote(en.exerciseId) ? `<div class="exs-last">${pinChip(en.exerciseId)}</div>` : ''}
    ${en.note ? `<div class="exs-last">${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(en.note)}</div>` : ''}
    ${last ? `<div class="exs-last"><span class="grow">Letztes Mal: ${esc(last.list.map(fmtPrev).join(' · '))}</span>${canFillAny(en, last) ? `<button class="link-btn" data-act="exFill" data-ei="${ei}">${icon('fillIn')} Alle übernehmen</button>` : ''}</div>` : ''}
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
    w.entries.length && { key: 'ov', label: 'Übersicht aller Übungen', sub: 'Reihenfolge & Ziele ändern', icon: 'layers' },
    F('f_focus') && w.entries.length && { key: 'view', label: focus ? 'Listen-Ansicht' : 'Fokus-Ansicht', sub: focus ? 'Alle Übungen untereinander' : 'Eine Übung groß – wischen zum Wechseln', icon: focus ? 'list' : 'target' },
    { key: 'rename', label: 'Umbenennen', icon: 'edit' },
    F('f_woExtras') && woSimple() && { key: 'notes', label: 'Notiz, Datum & Körpergewicht', icon: 'note' },
    w.entries.length && { key: 'tpl', label: 'Als Workout speichern', sub: 'Unter „Meine Workouts"', icon: 'copy' },
    { key: 'style', label: woSimple() ? 'Ausführliche Eingabe' : 'Schlichte Eingabe', sub: woSimple() ? 'Mehr Spalten, Stepper & Leisten' : 'Nur Gewicht, Wdh. & Haken', icon: 'sliders' },
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
  else if (k === 'style') { Store.saveSettings({ woStyle: woSimple() ? 'detailed' : 'simple' }); App.renderCurrent(); }
  else if (k === 'cancel') Actions.woCancel();
};

/* ---------- Bausteine: Ziel, Fortschritt, Satz-Typen ---------- */
const workSets = en => en.sets.filter(s => !s.warmup);
const shortName = n => n.length > 18 ? n.replace(/\s*\(.*?\)\s*/g, ' ').trim().slice(0, 18) + (n.length > 18 ? '…' : '') : n;
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
function goalBar(en, ei, type) {
  const n = workSets(en).length;
  const gw = goalWeight(en);
  const wLabel = type === 'kg' ? 'Gewicht' : 'Zusatz';
  const wVal = gw != null && gw > 0 ? fmtW(gw) : (type === 'kg' ? '–' : 'ohne');
  return `<button class="ex-goal" data-act="goalEdit" data-ei="${ei}" aria-label="Ziel für ${esc(en.exerciseName)} bearbeiten">
    <span class="eg"><small>Sätze × ${type === 'sec' ? 'Sek.' : 'Wdh.'}</small><b>${n} × ${esc(goalReps(en, type))}</b></span>
    <span class="eg"><small>${wLabel}</small><b>${wVal}</b></span>
    <span class="eg"><small>Pause</small><b>${fmtClock((en.target && en.target.restSec) || S().defaultRestSec)}</b></span>
    <span class="eg-edit">${icon('edit')}</span>
  </button>`;
}
function exSummary(en, w, type) {
  const ws = workSets(en);
  const done = ws.filter(s => s.done);
  const dots = `<span class="dots">${ws.map(s => `<i class="${s.done ? 'on' : ''}"></i>`).join('')}</span>`;
  if (!done.length) return `<div class="ex-sum">${dots}<span>${ws.length} ${ws.length === 1 ? 'Satz' : 'Sätze'} geplant</span></div>`;
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
  return `<div class="ex-sum">${dots}<span>${done.length}/${ws.length}</span><span>${txt}</span></div>`;
}
const KIND_LABEL = { drop: 'D', fail: 'F' };
function setNumHtml(s, num, d) {
  const cls = s.warmup ? 'warm' : (s.kind || '');
  const kind = !s.warmup && KIND_LABEL[s.kind] ? `<i>${KIND_LABEL[s.kind]}</i>` : '';
  return `<button class="set-num ${cls}" data-act="setMenu" ${d} aria-label="Satz ${num} Optionen">${num}${kind}</button>`;
}

function exerciseCard(en, ei, w) {
  const ex = Ex.get(en.exerciseId);
  const type = Ex.type(ex);
  const last = lastSessionFor(en.exerciseId, w);
  const pr = Store.raw('prs', en.exerciseId);
  const ws = workSets(en);
  const complete = ws.length > 0 && ws.every(s => s.done) && en.sets.every(s => s.done);
  const t = en.target || {};
  const fmtPrev = s => !s ? '–' : type === 'sec' ? prevSec(s) + (s.w ? ` +${wNum(s.w)}` : '') : (s.w ? `${wNum(s.w)}×${prevR(s)}` : `${prevR(s)}`);
  const lastTxt = last ? `Letztes Mal ${fmtDateShort(last.date)}: ${last.list.map(fmtPrev).join(' · ')}` : '';
  const uni = !!en.uni;
  const [lo] = parseRange(t.reps);
  let workNo = 0;
  const rows = en.sets.map((s, si) => {
    const num = s.warmup ? 'W' : ++workNo;
    const prev = last && !s.warmup ? (last.list[num - 1] || null) : null;
    const sel = w.sel.e === ei && w.sel.s === si;
    const isPR = F('f_prs') && s.done && !s.warmup && pr && type !== 'sec' && ((+s.weightKg || 0) > (pr.bestWeightKg || 0) + 1e-6 || e1rm(+s.weightKg, repsOf(s)) > (pr.best1RM || 0) + 0.05);
    return setRow(ei, si, s, num, prev, type, sel, isPR, fmtPrev, uni, lo) + (sel ? setPanel(ei, si, s, type, uni) : '');
  }).join('');
  const meta = ex ? [ex.equipment, (ex.muscleGroups || []).slice(0, 2).join(', ')].filter(Boolean).join(' · ') : '';
  return `<div class="ex-card ${complete ? 'complete' : ''} ${uni ? 'uni' : ''}" id="ex-${en.uid}" style="scroll-margin-top:calc(env(safe-area-inset-top) + var(--wo-head-h, 120px))">
    <div class="ex-card-head">
      <span class="ex-idx ${catCls(ex && ex.category)}">${complete ? icon('check').replace('<svg', '<svg width="16" height="16"') : ei + 1}</span>
      <div class="grow" style="min-width:0">
        <button class="ex-name" data-act="openExercise" data-id="${esc(en.exerciseId)}">${esc(en.exerciseName)}</button>
        ${meta ? `<div class="ex-sub">${esc(meta)}</div>` : ''}
      </div>
      <button class="btn-icon" data-act="exMenu" data-ei="${ei}" aria-label="Übungs-Menü">${icon('dots')}</button>
    </div>
    ${goalBar(en, ei, type)}
    <div class="ex-hints">
      ${lastTxt ? `<span class="hint-chip">${esc(lastTxt)}</span>` : '<span class="hint-chip">Erstes Mal – viel Spaß!</span>'}
      ${last && canFillAny(en, last) ? `<button class="hint-chip fill" data-act="exFill" data-ei="${ei}">${icon('fillIn')} Alle übernehmen</button>` : ''}
      ${en.suggestion ? `<span class="hint-chip ${en.suggestion.type === 'up' ? 'up' : ''}">${en.suggestion.type === 'up' ? '↑ ' : ''}${esc(en.suggestion.text)}</span>` : ''}
      ${t.notes ? `<span class="hint-chip note">${esc(t.notes)}</span>` : ''}
      ${en.note ? `<span class="hint-chip note">${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(en.note)}</span>` : ''}
      ${pinChip(en.exerciseId, 'hint-chip pin')}
    </div>
    <div class="set-head"><span>Satz</span><span>Letztes</span><span>${type === 'kg' ? unit() : '+' + unit()}</span>${uni ? '<span>Links</span><span>Rechts</span>' : `<span>${type === 'sec' ? 'Sek.' : 'Wdh.'}</span>`}<span class="rpe-h">RPE</span><span></span></div>
    ${rows}
    ${exSummary(en, w, type)}
    <div class="ex-foot">
      <button class="btn btn-secondary btn-sm" data-act="setAdd" data-ei="${ei}">${icon('plus')} Satz</button>
      ${type === 'kg' && F('f_warmup') ? `<button class="btn btn-ghost btn-sm" data-act="warmup" data-ei="${ei}">${icon('flame')} Aufwärmen</button>` : ''}
    </div>
  </div>`;
}
function setRow(ei, si, s, num, prev, type, sel, isPR, fmtPrev, uni = false, lo = null) {
  const bVal = type === 'sec' ? s.durationSec : s.reps;
  const wPh = prev && prev.w ? inputW(prev.w) : '';
  const ph = sidePh(s, prev, type);
  const bPh = ph.l || (lo ? String(lo) : '');
  const d = `data-ei="${ei}" data-si="${si}"`;
  const canFill = !isPR && setFillable(s, prev, type);
  return `<div class="set-row ${s.done ? 'done' : ''} ${sel ? 'sel' : ''}" ${d}>
    ${setNumHtml(s, num, d)}
    ${canFill ? `<button class="set-prev can-fill" data-act="setFill" ${d} aria-label="${esc(fmtPrev(prev))} übernehmen" title="Antippen = übernehmen">${fmtPrev(prev)}</button>`
      : `<span class="set-prev" data-act="setSel" ${d}>${isPR ? `<span class="accent bold">${icon('trophy').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} PR</span>` : fmtPrev(prev)}</span>`}
    <input class="set-in" inputmode="decimal" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${esc(wPh)}" aria-label="Gewicht" enterkeyhint="next">
    <input class="set-in" inputmode="numeric" data-in="setB" ${d} value="${bVal ?? ''}" placeholder="${esc(bPh)}" aria-label="${type === 'sec' ? 'Sekunden' : 'Wiederholungen'}${uni ? ' links' : ''}" enterkeyhint="${uni ? 'next' : 'done'}">
    ${uni ? rInput(s, d, type, ph) : ''}
    <select class="set-rpe" data-ch="setRpe" ${d} aria-label="RPE"><option value="">–</option>${RPE_VALUES.map(v => `<option value="${v}" ${+s.rpe === v ? 'selected' : ''}>${nf(v, 1)}</option>`).join('')}</select>
    <button class="set-check" data-act="setDone" ${d} aria-label="${s.done ? 'Satz zurücksetzen' : 'Satz erledigt'}">${icon('check')}</button>
  </div>`;
}

/* ---------- Übersichtsleiste ---------- */
function woStrip(w, focus) {
  const curE = focus ? focusIndex(w) : w.sel.e;
  return `<div class="wo-strip" id="woStrip">${w.entries.map((en, i) => {
    const ws = workSets(en), d = ws.filter(s => s.done).length;
    const complete = ws.length && d === ws.length;
    return `<button class="ws-item ${i === curE ? 'cur' : ''} ${complete ? 'complete' : ''}" data-act="woJump" data-ei="${i}" aria-label="${esc(en.exerciseName)}: ${d} von ${ws.length} Sätzen">
      <span class="ws-ring" style="--p:${ws.length ? d / ws.length * 100 : 0}">${complete ? icon('check') : i + 1}</span>
      <span class="ws-name">${esc(shortName(en.exerciseName))}</span><span class="ws-cnt">${d}/${ws.length}</span></button>`;
  }).join('')}<button class="ws-item ws-all" data-act="woOverview">${icon('layers')} Übersicht</button></div>`;
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
  const fmtPrev = p => !p ? '–' : type === 'sec' ? prevSec(p) + (p.w ? ` +${wNum(p.w)}` : '') : (p.w ? `${wNum(p.w)} ${unit()} × ${prevR(p)}` : `${prevR(p)} Wdh.`);
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
      <div class="fc-label"><b>${s.warmup ? 'Aufwärmsatz' : `Satz ${no} von ${ws.length}`}${s.done ? ' <span class="badge accent">erledigt</span>' : ''}</b>${prev ? `<span>Letztes Mal: ${esc(fmtPrev(prev))}</span>` : ''}${setFillable(s, prev, type) ? `<button class="link-btn fc-fill" data-act="setFill" ${d}>${icon('fillIn')} Übernehmen</button>` : ''}</div>
      <div class="fc-steppers ${uni ? 'uni' : ''}">
        <div class="fc-big"><div class="stepper-label">${type === 'kg' ? 'Gewicht' : 'Zusatzgewicht'} (${unit()})</div>
          <div class="stepper"><button data-act="step" data-f="w" data-d="-1" ${d} aria-label="Weniger Gewicht">${icon('minus')}</button>
          <input class="fc-in" inputmode="decimal" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${esc(wPh)}" aria-label="Gewicht">
          <button data-act="step" data-f="w" data-d="1" ${d} aria-label="Mehr Gewicht">${icon('plus')}</button></div></div>
        <div class="fc-big"><div class="stepper-label">${uni ? bShort + ' links' : bLabel}</div>
          <div class="stepper"><button data-act="step" data-f="b" data-d="-1" ${d} aria-label="Weniger">${icon('minus')}</button>
          <input class="fc-in" inputmode="numeric" data-in="setB" ${d} value="${(type === 'sec' ? s.durationSec : s.reps) ?? ''}" placeholder="${esc(bPh)}" aria-label="${bLabel}${uni ? ' links' : ''}">
          <button data-act="step" data-f="b" data-d="1" ${d} aria-label="Mehr">${icon('plus')}</button></div></div>
        ${uni ? `<div class="fc-big"><div class="stepper-label">${bShort} rechts</div>
          <div class="stepper"><button data-act="step" data-f="bR" data-d="-1" ${d} aria-label="Weniger rechts">${icon('minus')}</button>
          ${rInput(s, d, type, ph, '', 'fc-in')}
          <button data-act="step" data-f="bR" data-d="1" ${d} aria-label="Mehr rechts">${icon('plus')}</button></div></div>` : ''}
      </div>
      ${(woSimple() ? S().simpleRPE : S().showRPE) ? `<div class="rpe-chips"><span class="tiny dim bold" style="width:30px">RPE</span>${[6, 7, 8, 9, 10].map(v => `<button data-act="rpePick" data-v="${v}" ${d} class="${+s.rpe === v ? 'active' : ''}">${v}</button>`).join('')}</div>` : ''}
      <button class="btn ${s.done ? 'btn-secondary' : 'btn-primary'} btn-lg btn-block" data-act="setDone" ${d}>${icon(s.done ? 'undo' : 'check')} ${s.done ? 'Rückgängig' : 'Satz erledigt'}</button>
      <div class="row" ${woSimple() ? 'hidden' : ''}>
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
      ${woSimple() ? `<div class="center"><button class="exs-goal" data-act="goalEdit" data-ei="${ei}">${esc(`${ws.length} × ${goalReps(en, type)}${type === 'sec' ? ' s' : ''}${goalWeight(en) ? ' · ' + fmtW(goalWeight(en)) : ''}`)}</button></div>` : goalBar(en, ei, type)}
      <div class="ex-hints" ${woSimple() ? 'hidden' : ''}>
        ${en.suggestion ? `<span class="hint-chip ${en.suggestion.type === 'up' ? 'up' : ''}">${en.suggestion.type === 'up' ? '↑ ' : ''}${esc(en.suggestion.text)}</span>` : ''}
        ${en.target && en.target.notes ? `<span class="hint-chip note">${esc(en.target.notes)}</span>` : ''}
        ${en.note ? `<span class="hint-chip note">${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(en.note)}</span>` : ''}
      </div>
      <div class="fc-sets">${pills}<button class="fc-pill add" data-act="setAdd" data-ei="${ei}" aria-label="Satz hinzufügen">${icon('plus')}</button></div>
      ${cur}
      ${exSummary(en, w, type)}
      <div class="fc-foot" ${woSimple() ? 'hidden' : ''}>${type === 'kg' && F('f_warmup') ? `<button class="btn btn-ghost btn-sm" data-act="warmup" data-ei="${ei}">${icon('flame')} Aufwärmsätze</button>` : ''}</div>
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
  window.scrollTo({ top: 0 });
};
Actions.focusNav = el => {
  const w = Workout.cur(); if (!w) return;
  const ei = clamp(focusIndex(w) + +el.dataset.d, 0, w.entries.length - 1);
  w.focusE = ei;
  const fo = firstOpen(w.entries[ei]);
  w.sel = { e: ei, s: fo >= 0 ? fo : w.entries[ei].sets.length - 1 };
  Workout.save();
  App.renderCurrent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  $$('.ws-item').forEach(b => b.classList.toggle('cur', +b.dataset.ei === ei));
  const strip = $('#woStrip'), cur = strip && $('.ws-item.cur', strip);
  if (cur) strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
  scrollToExercise(en);
};
function scrollToExercise(en) {
  const card = $('#ex-' + en.uid);
  const head = $('.wo-head');
  if (!card) return;
  // Karten darüber, die gerade noch zu-/aufklappen, schon mit ihrer Endhöhe einrechnen
  let shift = 0;
  for (const [id, d] of cardDelta) { const c = document.getElementById(id); if (c && c !== card && (c.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)) shift += d; }
  const top = card.getBoundingClientRect().top + shift + scrollY - (head ? head.getBoundingClientRect().bottom : 120) - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: S().motion === 'full' ? 'smooth' : 'auto' });
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
        <div class="ge-row"><div class="ge-l"><b>Arbeitssätze</b><small>${doneN ? `${doneN} schon erledigt` : 'Wie oft?'}</small></div>${stepper('sets', st.sets, 'Sätze')}</div>
        <div class="ge-row stack"><div class="ge-l"><b>${bName}</b><small>Feste Zahl oder Bereich von – bis</small></div>
          <div class="ge-pair">${stepper('lo', st.lo, 'von')}<span class="dim">–</span>${stepper('hi', st.hi, 'bis')}</div>
          <div class="ge-quick" style="width:100%">${(type === 'sec' ? [[30], [45], [60], [90]] : [[5], [8], [10], [12], [6, 8], [8, 12], [12, 15]]).map(([a, b]) => `<button data-q="${a}-${b || ''}">${a}${b ? '–' + b : ''}</button>`).join('')}</div></div>
        <div class="ge-row"><div class="ge-l"><b>${type === 'kg' ? 'Gewicht' : 'Zusatzgewicht'} (${unit()})</b><small>Schritt ${nf(S().weightSteps, 2)} ${unit()}</small></div>${stepper('w', st.w != null ? String(st.w).replace('.', ',') : '', 'Gewicht')}</div>
        <div class="ge-row"><div class="ge-l"><b>Pause</b><small>nach jedem Satz</small></div>${stepper('rest', fmtClock(st.rest), 'Pause')}</div>
        <div class="ge-row"><div class="ge-l"><b>Für alle offenen Sätze übernehmen</b><small>Gewicht & ${bName} eintragen</small></div><label class="switch"><input type="checkbox" id="geApply" ${st.apply ? 'checked' : ''}><span></span></label></div>
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

function setPanel(ei, si, s, type, uni = false) {
  const d = `data-ei="${ei}" data-si="${si}"`;
  const bLabel = type === 'sec' ? 'Sekunden' : 'Wiederholungen', bShort = type === 'sec' ? 'Sek.' : 'Wdh.';
  // Platzhalter wie in der Zeile: Werte vom letzten Mal
  const w = Workout.cur(), en = w && w.entries[ei];
  const prev = en ? prevForSet(en, si, lastSessionFor(en.exerciseId, w)) : null;
  const ph = sidePh(s, prev, type);
  return `<div class="set-panel ${uni ? 'uni' : ''}" ${d}>
    <div><div class="stepper-label">${type === 'kg' ? 'Gewicht' : 'Zusatzgewicht'} (${unit()})</div>
      <div class="stepper"><button data-act="step" data-f="w" data-d="-1" ${d} aria-label="Weniger Gewicht">${icon('minus')}</button>
      <input inputmode="decimal" data-in="setW" ${d} value="${inputW(s.weightKg)}" placeholder="${prev && prev.w ? esc(inputW(prev.w)) : '0'}" aria-label="Gewicht">
      <button data-act="step" data-f="w" data-d="1" ${d} aria-label="Mehr Gewicht">${icon('plus')}</button></div></div>
    <div><div class="stepper-label">${uni ? bShort + ' links' : bLabel}</div>
      <div class="stepper"><button data-act="step" data-f="b" data-d="-1" ${d} aria-label="Weniger">${icon('minus')}</button>
      <input inputmode="numeric" data-in="setB" ${d} value="${(type === 'sec' ? s.durationSec : s.reps) ?? ''}" placeholder="${esc(ph.l || '0')}" aria-label="${bLabel}${uni ? ' links' : ''}">
      <button data-act="step" data-f="b" data-d="1" ${d} aria-label="Mehr">${icon('plus')}</button></div></div>
    ${uni ? `<div><div class="stepper-label">${bShort} rechts</div>
      <div class="stepper"><button data-act="step" data-f="bR" data-d="-1" ${d} aria-label="Weniger rechts">${icon('minus')}</button>
      ${rInput(s, d, type, { r: ph.r || '0', r0: ph.r0 || '0' }, '0', '')}
      <button data-act="step" data-f="bR" data-d="1" ${d} aria-label="Mehr rechts">${icon('plus')}</button></div></div>` : ''}
    ${S().showRPE ? `<div class="rpe-chips"><span class="tiny dim bold" style="width:30px">RPE</span>${[6, 7, 8, 9, 10].map(v => `<button data-act="rpePick" data-v="${v}" ${d} class="${+s.rpe === v ? 'active' : ''}">${v}</button>`).join('')}</div>` : ''}
    <div class="panel-actions">
      ${type === 'kg' && F('f_plates') ? `<button class="btn btn-ghost btn-sm" data-act="plates" ${d}>${icon('plate')} Scheiben</button>` : ''}
      <span class="grow"></span>
      <button class="btn ${s.done ? 'btn-secondary' : 'btn-primary'}" data-act="setDone" ${d}>${icon(s.done ? 'undo' : 'check')} ${s.done ? 'Rückgängig' : 'Satz erledigt'}</button>
    </div>
  </div>`;
}
function updateTopH() {
  const tb = $('#topbar');
  if (tb) document.documentElement.style.setProperty('--top-h', tb.offsetHeight + 'px');
}
window.addEventListener('resize', debounce(updateTopH, 150));

/* ---------- Interaktionen im Workout ---------- */
const entryAt = el => { const w = Workout.cur(); return w ? w.entries[+el.dataset.ei] : null; };
const setAt = el => { const en = entryAt(el); return en ? en.sets[+el.dataset.si] : null; };
function syncInputs(el, field, value) {
  $$(`[data-in="${field}"][data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).forEach(i => { if (i !== el) i.value = value; });
}
Inputs.setW = el => {
  const s = setAt(el); if (!s) return;
  const v = parseNum(el.value);
  s.weightKg = v == null ? null : Math.max(0, fromU(v));
  Workout.save();
  syncInputs(el, 'setW', el.value);
};
Inputs.setB = el => {
  const s = setAt(el); const en = entryAt(el); if (!s) return;
  const v = parseNum(el.value);
  const val = v == null ? null : Math.max(0, Math.round(v));
  if (Ex.type(Ex.get(en.exerciseId)) === 'sec') s.durationSec = val; else s.reps = val;
  Workout.save();
  syncInputs(el, 'setB', el.value);
  if (en.uni) syncRightPh(el.dataset.ei, el.dataset.si, val);
};
/** Rechtes Feld zeigt als Vorschlag den linken Wert (leer lassen = wie links) */
function syncRightPh(ei, si, val) {
  $$(`[data-in="setBR"][data-ei="${ei}"][data-si="${si}"]`).forEach(i => { i.placeholder = val != null ? String(val) : (i.dataset.ph0 || ''); });
}
Inputs.setBR = el => {
  const s = setAt(el); const en = entryAt(el); if (!s) return;
  const v = parseNum(el.value);
  const val = v == null ? null : Math.max(0, Math.round(v));
  if (Ex.type(Ex.get(en.exerciseId)) === 'sec') s.durationSecR = val; else s.repsR = val;
  Workout.save();
  syncInputs(el, 'setBR', el.value);
};
Changes.setRpe = el => { const s = setAt(el); if (!s) return; s.rpe = el.value ? +el.value : null; Workout.save(); };
Inputs.woBw = el => Workout.set(w => { const v = parseNum(el.value); w.bodyWeightKg = v ? fromU(v) : null; });
Inputs.woNotes = el => Workout.set(w => { w.notes = el.value; });
Changes.woDate = el => { if (isISO(el.value)) Workout.set(w => { w.date = el.value; }); };

/* Satz auswählen → Stepper-Panel unter die Zeile schieben (ohne kompletten Re-Render) */
function selectSet(ei, si, { rerender = false } = {}) {
  const w = Workout.cur(); if (!w) return;
  if (w.sel.e === ei && w.sel.s === si && !rerender) return;
  w.sel = { e: ei, s: si };
  Workout.save();
  if (rerender) return App.renderCurrent();
  $$('.set-row.sel').forEach(r => r.classList.remove('sel'));
  $$('.set-panel').forEach(p => p.remove());
  const row = $(`.set-row[data-ei="${ei}"][data-si="${si}"]`);
  if (!row) return;
  row.classList.add('sel');
  if (woSimple()) return;
  const en = w.entries[ei];
  row.insertAdjacentHTML('afterend', setPanel(ei, si, en.sets[si], Ex.type(Ex.get(en.exerciseId)), !!en.uni));
}
Actions.setSel = el => {
  const w = Workout.cur();
  if (w && el.closest('.focus')) { w.sel = { e: +el.dataset.ei, s: +el.dataset.si }; w.focusE = +el.dataset.ei; Workout.save(); App.renderCurrent(); return; }
  selectSet(+el.dataset.ei, +el.dataset.si);
};
document.addEventListener('focusin', e => {
  const i = e.target.closest('.set-row .set-in, .set-row .set-rpe');
  if (i) selectSet(+i.dataset.ei, +i.dataset.si);
});
Actions.step = el => {
  const s = setAt(el), en = entryAt(el); if (!s) return;
  const type = Ex.type(Ex.get(en.exerciseId));
  const d = +el.dataset.d;
  const w = Workout.cur();
  const last = lastSessionFor(en.exerciseId, w);
  const workNo = en.sets.slice(0, +el.dataset.si + 1).filter(x => !x.warmup).length;
  const prev = last && !s.warmup ? last.list[workNo - 1] : null;
  if (el.dataset.f === 'w') {
    const cur = s.weightKg != null ? toU(s.weightKg) : (prev && prev.w ? toU(prev.w) : 0);
    // Krumme Werte (z. B. aus lb umgerechnet) zuerst aufs Inkrement-Raster ziehen
    const st = S().weightSteps, k = cur / st;
    const onGrid = Math.abs(k - Math.round(k)) < 1e-6;
    const next = Math.max(0, round(onGrid ? cur + d * st : (d > 0 ? Math.ceil(k) : Math.floor(k)) * st, 2));
    s.weightKg = fromU(next);
    $$(`[data-in="setW"][data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).forEach(i => { i.value = inputW(s.weightKg); });
  } else {
    const right = el.dataset.f === 'bR';
    const base = type === 'sec' ? 'durationSec' : 'reps';
    const key = base + (right ? 'R' : '');
    const step = type === 'sec' ? 5 : 1;
    const side = i => prev ? (type === 'sec' ? (prev.us ? prev.us[i] : prev.sec) : (prev.u ? prev.u[i] : prev.r)) || 0 : 0;
    // Rechts startet beim linken Wert
    const cur = s[key] != null ? s[key] : right && s[base] != null ? s[base] : side(right ? 1 : 0);
    s[key] = Math.max(0, cur + d * step);
    $$(`[data-in="setB${right ? 'R' : ''}"][data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).forEach(i => { i.value = s[key]; });
    if (!right && en.uni) syncRightPh(el.dataset.ei, el.dataset.si, s[key]);
  }
  vibrate(8);
  Workout.save();
  fx($$(`[data-in^="set"][data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).filter(i => el.parentElement && el.parentElement.contains(i)), 'fx-bump');
};
Actions.rpePick = el => {
  const s = setAt(el); if (!s) return;
  s.rpe = +s.rpe === +el.dataset.v ? null : +el.dataset.v;
  Workout.save();
  $$(`.rpe-chips button[data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).forEach(b => b.classList.toggle('active', +b.dataset.v === +s.rpe));
  const sel = $(`.set-rpe[data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`);
  if (sel) sel.value = s.rpe ? String(s.rpe) : '';
};
Actions.setDone = el => {
  const w = Workout.cur();
  const ei = +el.dataset.ei, si = +el.dataset.si;
  const en = w.entries[ei], s = en.sets[si];
  if (!s) return;
  if (s.done) {
    s.done = false; s.doneAt = null;
    w.sel = { e: ei, s: si };
    Workout.save();
    App.renderCurrent();
    fx($(`.set-row[data-ei="${ei}"][data-si="${si}"] .set-check`), 'fx-bump');
    return;
  }
  const type = Ex.type(Ex.get(en.exerciseId));
  if (type === 'cardio') {
    const pc = f => $(`.set-row [data-in="${f}"][data-ei="${ei}"][data-si="${si}"]`);
    const di = pc('cdDur'), ki = pc('cdKm'), li = pc('cdLvl');
    if (s.durationSec == null && di) s.durationSec = parseDur(di.placeholder);
    if (s.distKm == null && ki) { const v = parseNum(ki.placeholder); s.distKm = v > 0 ? v : null; }
    if (s.level == null && li) s.level = parseNum(li.placeholder);
    if (!s.durationSec && !s.distKm) {
      toast('Bitte Dauer eintragen (z. B. 30 = 30 min)', 'warn');
      if (di) di.focus();
      return;
    }
  }
  // Leere Felder mit den Werten vom letzten Mal (Placeholder) füllen – Liste oder Fokus
  const pick = f => $(`.set-row [data-in="${f}"][data-ei="${ei}"][data-si="${si}"]`) || $(`.fc-cur [data-in="${f}"][data-ei="${ei}"][data-si="${si}"]`);
  const wi = pick('setW'), bi = pick('setB');
  if (type !== 'cardio') {
  if (s.weightKg == null && wi && wi.placeholder) s.weightKg = fromU(parseNum(wi.placeholder));
  if (type === 'sec') { if (s.durationSec == null && bi && bi.placeholder) s.durationSec = parseNum(bi.placeholder); }
  else if (s.reps == null && bi && bi.placeholder) s.reps = parseNum(bi.placeholder);
  if (en.uni) {
    const kR = type === 'sec' ? 'durationSecR' : 'repsR', kL = type === 'sec' ? 'durationSec' : 'reps';
    const ri = pick('setBR');
    if (s[kR] == null) s[kR] = (ri && ri.value === '' && parseNum(ri.placeholder) != null ? parseNum(ri.placeholder) : null) ?? s[kL];
  }
  if (type === 'kg' && s.weightKg == null) {
    toast('Bitte Gewicht eintragen (0 für ohne Gewicht)', 'warn');
    selectSet(ei, si);
    const inp = $('.set-panel [data-in="setW"]') || pick('setW');
    if (inp) inp.focus();
    return;
  }
  const count = type === 'sec' ? s.durationSec : s.reps;
  if (!count || count < 1) {
    toast(type === 'sec' ? 'Bitte Dauer in Sekunden eintragen' : 'Bitte Wiederholungen eintragen', 'warn');
    selectSet(ei, si);
    const inp = $('.set-panel [data-in="setB"]') || pick('setB');
    if (inp) inp.focus();
    return;
  }
  }
  s.done = true;
  s.doneAt = Date.now();
  vibrate(25);
  const wasLast = w.entries.every(e => e.sets.every(x => x.done));
  const exDone = en.sets.every(x => x.done);
  w.sel = nextOpenAfter(w, ei, si);
  // Übung fertig → zuklappen, nächste offene Übung aufklappen
  if (exDone && w.openE === ei) w.openE = null;
  const focus = S().woView === 'focus';
  // Fokus: bei fertiger Übung automatisch weiter (falls gewünscht), sonst „erledigt"-Ansicht
  if (focus) w.focusE = exDone && S().autoScroll !== false && w.sel.e >= 0 ? w.sel.e : ei;
  // Nächsten Satz wie diesen vorbelegen (Gewicht + Wdh. bzw. Sekunden), damit ein Tipp aufs Häkchen reicht –
  // nur Felder, die leer sind und für die es keinen Wert vom letzten Mal gibt (der bleibt als Vorschlag stehen)
  const nx = en.sets[si + 1];
  if (S().carryNext !== false && nx && !nx.done && !nx.warmup && !s.warmup && type !== 'cardio') {
    const pv = prevForSet(en, si + 1, lastSessionFor(en.exerciseId, w)) || {};
    if (nx.weightKg == null && !pv.w) nx.weightKg = s.weightKg;
    const k = type === 'sec' ? 'durationSec' : 'reps', kR = type === 'sec' ? 'durationSecR' : 'repsR';
    if (nx[k] == null && !(type === 'sec' ? pv.sec : pv.r)) {
      nx[k] = s[k];
      if (s[kR] != null && nx[kR] == null) nx[kR] = s[kR];
    }
  }
  Workout.save();
  if (!wasLast && !w.editingId && S().autoRest !== false && type !== 'cardio') {
    const normal = en.target.restSec || S().defaultRestSec, ws = S().restWarmSec, ds = S().restDropSec;
    const nxt = w.sel.e >= 0 ? w.entries[w.sel.e] : null, nxtSet = nxt ? nxt.sets[w.sel.s] : null;
    // nach Aufwärmsätzen höchstens die eingestellte Pause; vor einem Drop-Satz die Drop-Pause (0 = gar keine)
    let rest = s.warmup ? (ws === 'same' ? normal : Math.min(+ws || 60, normal)) : normal;
    if (nxtSet && nxtSet.kind === 'drop' && !nxtSet.done && ds !== 'normal' && ds != null) rest = +ds || 0;
    if (rest > 0) RestTimer.start(rest, nxt ? `Als Nächstes: ${nxt.exerciseName} · Satz ${w.sel.s + 1}` : '');
  }
  if (wasLast) toast('Alle Sätze erledigt – stark! Unten „Workout beenden" tippen.', 'success', { cat: 'workout' });
  else if (exDone) toast(`${en.exerciseName} abgeschlossen`, 'success', { cat: 'workout' });
  App.renderCurrent();
  fx($(`.set-row[data-ei="${ei}"][data-si="${si}"]`), 'fx-done');
  if (exDone) fx($('#ex-' + en.uid), 'fx-complete');
  // Liste: zur nächsten Übung scrollen, wenn diese fertig ist
  const nextE = woCollapse() ? openIndex(w) : w.sel.e;
  if (!focus && exDone && nextE >= 0 && nextE !== ei && S().autoScroll !== false) requestAnimationFrame(() => scrollToExercise(w.entries[nextE]));
  else if (focus && w.focusE !== ei) window.scrollTo({ top: 0, behavior: 'smooth' });
  // Letzter Satz abgehakt: zum „Workout beenden"-Knopf unten scrollen
  if (wasLast && !focus && S().autoScroll !== false) requestAnimationFrame(() => { const b = $('#woFinishEnd'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
};
/* ---------- Wischgesten auf Satz-Zeilen: → abhaken, ← löschen (mit Rückgängig) ---------- */
function deleteSetWithUndo(ei, si) {
  const w = Workout.cur(); if (!w) return;
  const en = w.entries[ei]; if (!en || !en.sets[si]) return;
  const [gone] = en.sets.splice(si, 1);
  Workout.autoSelect(); Workout.save(); App.renderCurrent();
  toast(`Satz ${si + 1} gelöscht`, 'info', { duration: 4500, action: { label: 'Rückgängig', fn: () => {
    const cw = Workout.cur(); const ce = cw && cw.entries.find(e => e.uid === en.uid); if (!ce) return;
    ce.sets.splice(Math.min(si, ce.sets.length), 0, gone); Workout.save(); App.renderCurrent();
    fx($(`.set-row[data-ei="${cw.entries.indexOf(ce)}"][data-si="${si}"]`), 'fx-up');
  } } });
}
(() => {
  let row = null, bg = null, x0 = 0, y0 = 0, dx = 0, mode = null; // mode: null (unentschieden) | 'h' | 'v'
  const TH = () => Math.min(110, row ? row.offsetWidth * .28 : 90);
  const reset = (animate = true) => {
    if (!row) return;
    const r = row, b = bg;
    r.style.transition = animate ? 'transform .22s cubic-bezier(.2,.8,.2,1)' : '';
    r.style.setProperty('--sx', '0px');
    setTimeout(() => {
      r.classList.remove('swiping', 'sw-left', 'sw-right', 'sw-armed'); r.style.transition = ''; r.style.removeProperty('--sx'); if (b) b.remove();
      if (renderPending && !swipeActive && !isEditingInView()) { renderPending = false; App.renderCurrent(); }
    }, animate ? 230 : 0);
    row = bg = null; mode = null; dx = 0; swipeActive = false;
  };
  document.addEventListener('touchstart', e => {
    const r = e.target.closest('.wo-body .set-row[data-ei]');
    if (!r || e.touches.length > 1 || e.target.closest('select, .dd-btn')) return;
    if (row) reset(false);
    row = r; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; mode = null;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!row) return;
    const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
    if (!mode) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      mode = Math.abs(mx) > Math.abs(my) * 1.3 ? 'h' : 'v';
      if (mode === 'v') { row = null; return; }
      bg = document.createElement('div');
      bg.className = 'swipe-bg';
      const done = row.classList.contains('done');
      bg.innerHTML = `<span class="sw-l">${icon(done ? 'undo' : 'check')}<b>${done ? 'Zurück' : 'Erledigt'}</b></span><span class="sw-r"><b>Löschen</b>${icon('trash')}</span>`;
      // Aktions-Fläche hinter die Zeile legen (gleiche Position), die Zeile selbst gleitet darüber
      const par = row.parentElement;
      if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
      Object.assign(bg.style, { top: row.offsetTop + 'px', height: row.offsetHeight + 'px', left: row.offsetLeft + 'px', width: row.offsetWidth + 'px' });
      par.insertBefore(bg, row); row.classList.add('swiping'); swipeActive = true;
    }
    if (mode !== 'h') return;
    e.preventDefault();
    dx = mx;
    const lim = row.offsetWidth * .7, eased = Math.sign(dx) * Math.min(lim, Math.abs(dx));
    row.style.setProperty('--sx', eased + 'px');
    const armed = Math.abs(dx) > TH();
    [row, bg].forEach(n => { n.classList.toggle('sw-right', dx > 0); n.classList.toggle('sw-left', dx < 0); });
    if (armed !== row.classList.contains('sw-armed')) { row.classList.toggle('sw-armed', armed); bg.classList.toggle('sw-armed', armed); if (armed) vibrate(10); }
  }, { passive: false });
  const end = () => {
    if (!row || mode !== 'h') { row = null; mode = null; return; }
    const r = row, ei = +r.dataset.ei, si = +r.dataset.si;
    if (Math.abs(dx) > TH()) {
      if (dx > 0) { reset(); setTimeout(() => Actions.setDone({ dataset: { ei, si } }), 120); }
      else {
        r.style.transition = 'transform .2s ease-in';
        r.style.setProperty('--sx', -r.offsetWidth + 'px');
        row = bg = null; mode = null; swipeActive = false;
        setTimeout(() => deleteSetWithUndo(ei, si), 190);
      }
    } else reset();
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', () => reset());
})();

Actions.setAdd = el => {
  const w = Workout.cur(); const en = w.entries[+el.dataset.ei];
  const lastSet = Ex.type(Ex.get(en.exerciseId)) === 'cardio' ? null : [...en.sets].reverse().find(s => !s.warmup);
  const ns = Workout.newSet(lastSet ? { reps: lastSet.reps, repsR: lastSet.repsR, weightKg: lastSet.weightKg, durationSec: lastSet.durationSec, durationSecR: lastSet.durationSecR } : {});
  en.sets.push(ns);
  w.sel = { e: +el.dataset.ei, s: en.sets.length - 1 };
  w.focusE = +el.dataset.ei;
  Workout.save();
  App.renderCurrent();
  fx($(`.set-row[data-ei="${el.dataset.ei}"][data-si="${en.sets.length - 1}"], .fc-pill[data-ei="${el.dataset.ei}"][data-si="${en.sets.length - 1}"]`), 'fx-up');
};
/** Drop-Satz anhängen: Gewicht ca. 20 % unter dem letzten Arbeitssatz, abgerundet aufs Gewichts-Inkrement */
Actions.dropAdd = el => {
  const w = Workout.cur(); const ei = +el.dataset.ei; const en = w.entries[ei];
  const last = [...en.sets].reverse().find(s => !s.warmup);
  const st = S().weightSteps, kg = last && last.weightKg ? last.weightKg : null;
  const ns = Workout.newSet({ weightKg: kg != null ? fromU(Math.max(0, Math.floor(toU(kg) * 0.8 / st) * st)) : null, durationSec: last ? last.durationSec : null });
  ns.kind = 'drop';
  en.sets.push(ns);
  w.sel = { e: ei, s: en.sets.length - 1 };
  w.focusE = ei;
  Workout.save();
  App.renderCurrent();
  fx($(`.set-row[data-ei="${ei}"][data-si="${en.sets.length - 1}"], .fc-pill[data-ei="${ei}"][data-si="${en.sets.length - 1}"]`), 'fx-up');
};
Actions.setMenu = async el => {
  const w = Workout.cur(); const ei = +el.dataset.ei, si = +el.dataset.si;
  const en = w.entries[ei], s = en.sets[si];
  const cardio = Ex.type(Ex.get(en.exerciseId)) === 'cardio';
  const k = await actionMenu(`${en.exerciseName} – ${cardio ? 'Abschnitt' : 'Satz'}`, cardio ? [
    { key: 'dup', label: 'Abschnitt duplizieren', icon: 'copy' },
    en.sets.length > 1 && { key: 'del', label: 'Abschnitt löschen', icon: 'trash', danger: true }
  ] : [
    (s.warmup || s.kind) && { key: 'normal', label: 'Normaler Arbeitssatz', icon: 'check' },
    !s.warmup && { key: 'warm', label: 'Aufwärmsatz', sub: 'Zählt nicht für Volumen & PRs', icon: 'flame' },
    F('f_setTypes') && s.kind !== 'drop' && { key: 'drop', label: 'Drop-Satz', sub: 'Direkt weiter mit weniger Gewicht', icon: 'arrowDown' },
    F('f_setTypes') && s.kind !== 'fail' && { key: 'fail', label: 'Bis zum Muskelversagen', sub: 'Markiert den Satz mit „F"', icon: 'bolt' },
    s.weightKg != null && { key: 'fillW', label: `${fmtW(s.weightKg)} für alle offenen Sätze`, icon: 'copy' },
    { key: 'dup', label: 'Satz duplizieren', icon: 'copy' },
    { key: 'del', label: 'Satz löschen', icon: 'trash', danger: true }
  ]);
  if (!k) return;
  if (k === 'normal') { s.warmup = false; s.kind = null; }
  if (k === 'warm') { s.warmup = true; s.kind = null; }
  if (k === 'drop' || k === 'fail') { s.warmup = false; s.kind = k; }
  if (k === 'fillW') en.sets.forEach(x => { if (!x.done && !x.warmup) x.weightKg = s.weightKg; });
  if (k === 'dup') en.sets.splice(si + 1, 0, { ...s, done: false, doneAt: null });
  if (k === 'del') { en.sets.splice(si, 1); Workout.autoSelect(); }
  Workout.save();
  App.renderCurrent();
};
Actions.exMenu = async el => {
  const w = Workout.cur(); const ei = +el.dataset.ei; const en = w.entries[ei];
  const isCardio = Ex.type(Ex.get(en.exerciseId)) === 'cardio';
  const k = await actionMenu(en.exerciseName, [
    !isCardio && { key: 'goal', label: 'Ziel: Sätze, Wdh., Gewicht, Pause', icon: 'target' },
    canFillAny(en, lastSessionFor(en.exerciseId, w)) && { key: 'fill', label: 'Letztes Mal übernehmen', sub: 'Platzhalter als Werte in alle leeren Sätze', icon: 'fillIn' },
    F('f_warmup') && Ex.type(Ex.get(en.exerciseId)) === 'kg' && { key: 'warm', label: 'Aufwärmsätze hinzufügen', icon: 'flame' },
    F('f_setTypes') && !isCardio && { key: 'drop', label: 'Drop-Satz hinzufügen', sub: 'Direkt weiter mit ca. 20 % weniger Gewicht', icon: 'arrowDown' },
    F('f_plates') && Ex.type(Ex.get(en.exerciseId)) === 'kg' && { key: 'plates', label: 'Scheibenrechner', icon: 'plate' },
    !isCardio && { key: 'uni', label: en.uni ? 'Beidseitig erfassen' : 'Einseitig: links & rechts', sub: en.uni ? 'Eine Wdh.-Zahl pro Satz' : 'Wdh. für jede Seite getrennt eintragen', icon: 'swap' },
    { key: 'pin', label: pinNote(en.exerciseId) ? 'Dauerhafte Notiz bearbeiten' : 'Dauerhafte Notiz', sub: 'Bleibt bei der Übung – z. B. Sitzhöhe, Griff', icon: 'flag' },
    { key: 'note', label: en.note ? 'Notiz für heute bearbeiten' : 'Notiz nur für heute', sub: 'Nur in diesem Workout', icon: 'note' },
    !isCardio && { key: 'rest', label: 'Pausenzeit ändern', sub: `aktuell ${fmtClock(en.target.restSec || S().defaultRestSec)}`, icon: 'timer' },
    { key: 'swap', label: 'Übung ersetzen', icon: 'swap' },
    ei > 0 && { key: 'up', label: 'Nach oben', icon: 'arrowUp' },
    ei < w.entries.length - 1 && { key: 'down', label: 'Nach unten', icon: 'arrowDown' },
    { key: 'info', label: 'Übungs-Details & Verlauf', icon: 'chart' },
    { key: 'del', label: 'Übung entfernen', icon: 'trash', danger: true }
  ]);
  if (!k) return;
  if (k === 'goal') return openGoalEditor(ei);
  if (k === 'fill') return Actions.exFill({ dataset: { ei } });
  if (k === 'warm') return Actions.warmup({ dataset: { ei } });
  if (k === 'drop') return Actions.dropAdd({ dataset: { ei } });
  if (k === 'plates') { const t = plateTarget(w, ei); return t ? openPlates(null, t) : openPlates(goalWeight(en)); }
  if (k === 'uni') {
    en.uni = !en.uni;
    if (!en.uni) en.sets.forEach(x => { x.repsR = null; x.durationSecR = null; });
    // als Standard der Übung merken – beim nächsten Mal wieder so
    const ex = Ex.get(en.exerciseId);
    if (ex && Ex.isUni(ex) !== en.uni) Store.put('exercises', ex.id, { unilateral: en.uni, updatedAt: Date.now() });
    toast(en.uni ? `${en.exerciseName}: links & rechts getrennt` : `${en.exerciseName}: beidseitig`, 'success', { cat: 'workout' });
  } else if (k === 'pin') {
    await Actions.pinNoteEdit({ dataset: { id: en.exerciseId } });
  } else if (k === 'note') {
    const v = await promptDialog({ title: 'Notiz für heute', label: en.exerciseName, value: en.note || '', placeholder: 'z. B. Sitzhöhe 4, enger Griff' });
    if (v != null) en.note = v.trim();
  } else if (k === 'rest') {
    const v = await promptDialog({ title: 'Pausenzeit', label: 'Sekunden', value: String(en.target.restSec || S().defaultRestSec), inputmode: 'numeric' });
    if (v != null && parseNum(v) > 0) en.target.restSec = Math.round(parseNum(v));
  } else if (k === 'swap') {
    const ids = await pickExercises({ multi: false, title: 'Übung ersetzen' });
    if (!ids || !ids[0]) return;
    const fresh = Workout.makeEntry(ids[0], { ...en.target, sets: en.sets.length });
    w.entries[ei] = { ...fresh, target: { ...en.target }, note: en.note };
  } else if (k === 'up' || k === 'down') {
    const j = k === 'up' ? ei - 1 : ei + 1;
    [w.entries[ei], w.entries[j]] = [w.entries[j], w.entries[ei]];
    if (w.openE === ei) w.openE = j; else if (w.openE === j) w.openE = ei;
  } else if (k === 'info') { openExerciseDetail(en.exerciseId); return; }
  else if (k === 'del') {
    if (en.sets.some(s => s.done) && !await confirmDialog({ title: 'Übung entfernen?', text: `${en.exerciseName} hat bereits erledigte Sätze. Trotzdem entfernen?`, okLabel: 'Entfernen', danger: true })) return;
    w.entries.splice(ei, 1);
    w.openE = null;
  }
  Workout.autoSelect();
  Workout.save();
  App.renderCurrent();
};
Actions.warmup = el => {
  const w = Workout.cur(); const en = w.entries[+el.dataset.ei];
  const first = en.sets.find(s => !s.warmup);
  const ex = Ex.get(en.exerciseId);
  let target = first && first.weightKg;
  if (!target) { const l = lastSessionFor(en.exerciseId, w); target = l ? l.maxW : null; }
  if (!target) return toast('Erst ein Arbeitsgewicht eintragen', 'warn');
  if (en.sets.some(s => s.warmup) && en.sets.filter(s => s.warmup).every(s => !s.done)) en.sets = en.sets.filter(s => !s.warmup);
  const bar = ex && ex.equipment === 'Langhantel' ? S().barKg : 0;
  const step = fromU(S().weightSteps);
  const steps = (S().warmupSteps || []).filter(x => x[0] > 0 && x[0] < 100).sort((a, b) => a[0] - b[0]).map(([pct, r]) => [pct / 100, r]);
  const scheme = [...(bar && S().warmupBar !== false ? [[0, 10]] : []), ...steps];
  const sets = [];
  for (const [p, r] of scheme) {
    let kg = p === 0 ? bar : Math.max(bar, Math.round(target * p / step) * step);
    if (kg >= target || sets.some(s => s.weightKg === kg)) continue;
    if (p === 0 && target - bar < 10) continue;
    sets.push(Workout.newSet({ weightKg: kg, reps: r, warmup: true }));
  }
  if (!sets.length) return toast('Gewicht zu leicht für Aufwärmsätze', 'info', { cat: 'always' });
  en.sets.unshift(...sets);
  Workout.autoSelect();
  Workout.save();
  App.renderCurrent();
  toast(`${sets.length} Aufwärmsätze hinzugefügt`, 'success', { cat: 'workout' });
};
Actions.woAddEx = async () => {
  const ids = await pickExercises({ multi: true, title: 'Übungen hinzufügen' });
  if (!ids || !ids.length) return;
  const w = Workout.cur();
  if (!w) return;
  ids.forEach(id => w.entries.push(Workout.makeEntry(id, { sets: defSets() })));
  Workout.autoSelect();
  Workout.save();
  App.renderCurrent();
  w.entries.slice(-ids.length).forEach(en => fx($('#ex-' + en.uid), 'fx-up'));
  setTimeout(() => { const last = w.entries[w.entries.length - ids.length]; const c = last && $('#ex-' + last.uid); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
};
Actions.woRename = async () => {
  const w = Workout.cur();
  const v = await promptDialog({ title: 'Workout umbenennen', label: 'Name', value: w.name });
  if (v && v.trim()) { Workout.set(x => { x.name = v.trim(); }); App.renderCurrent(); }
};
Actions.woCancel = async () => {
  const w = Workout.cur();
  const ok = await confirmDialog({
    title: w.editingId ? 'Änderungen verwerfen?' : 'Workout abbrechen?',
    text: w.editingId ? 'Das gespeicherte Workout bleibt unverändert.' : 'Alle Sätze dieses Workouts gehen verloren. Das kann nicht rückgängig gemacht werden.',
    okLabel: w.editingId ? 'Verwerfen' : 'Abbrechen & löschen', cancelLabel: 'Weiter trainieren', danger: true
  });
  if (!ok) return;
  Workout.discard();
  App.renderCurrent();
  toast(w.editingId ? 'Änderungen verworfen' : 'Workout verworfen', 'info', { cat: 'workout' });
};
Actions.woFinish = async () => {
  const w = Workout.cur();
  if (!w) return;
  const st = liveStats(w);
  const open = st.total - st.done;
  const ask = S().finishConfirm || 'always';
  if (!st.done) {
    if (!await confirmDialog({ title: 'Noch kein Satz erledigt', text: 'Es wurde noch kein Satz abgehakt. Trotzdem speichern?', okLabel: 'Speichern' })) return;
  } else if ((ask === 'always' || (ask === 'open' && open)) && !await confirmDialog({
    title: w.editingId ? 'Änderungen speichern?' : 'Workout beenden?',
    text: open ? `${open} ${open === 1 ? 'Satz ist' : 'Sätze sind'} noch offen und ${open === 1 ? 'wird' : 'werden'} als „nicht erledigt" gespeichert.` : 'Alle Sätze erledigt – sauber!',
    okLabel: w.editingId ? 'Speichern' : 'Beenden & speichern'
  })) return;
  const res = Workout.finish();
  if (!res) return;
  App.go('start');
  if (res.editing) { toast('Workout aktualisiert', 'success'); return; }
  showSummary(res);
};

/* ---------- Session-Zusammenfassung ---------- */
/* ---------- Workout-Score: Ring (füllt sich, Zahl zählt hoch) + Aufschlüsselung ---------- */
function scoreRingHtml(sc, small = false) {
  const R = 52, L = 2 * Math.PI * R;
  return `<div class="score-ring ${small ? 'sm' : ''}" data-score="${sc.score}" role="img" aria-label="Workout-Score ${sc.score} von 100">
    <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${R}" fill="none" stroke-width="10"/><circle class="ring-fg" cx="60" cy="60" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${L}" style="stroke-dashoffset:${L}" data-len="${L}"/></svg>
    <div class="score-mid"><b class="score-num">${sc.score}</b></div></div>`;
}
function scoreBreakdownHtml(sc) {
  const W = Analytics.SCORE_W;
  const item = (k, l, why) => sc.parts[k] == null
    ? `<div class="sb-item na"><span>${l}</span><b>–</b><small>${why}</small></div>`
    : `<div class="sb-item"><span>${l}</span><b>${Math.round(sc.parts[k] * W[k])}<small> / ${W[k]}</small></b><i style="--p:${Math.round(sc.parts[k] * 100)}%"></i></div>`;
  return `<div class="score-bd">${item('prog', 'Fortschritt', 'keine Vergleichswerte')}${item('done', 'Erledigt', '')}${item('rpe', 'Anstrengung', 'kein RPE eingetragen')}
    <div class="sb-item"><span>PR-Bonus</span><b>${sc.bonus ? '+' + sc.bonus : '0'}</b><small>${sc.prs ? `${sc.prs} ${sc.prs === 1 ? 'neuer Rekord' : 'neue Rekorde'}` : 'kein neuer Rekord'}</small></div></div>
    ${sc.scaled ? '<p class="tiny faint center mt-8">Fehlende Teile werden auf 100 hochgerechnet.</p>' : ''}`;
}
/** Ring von leer auf den Score füllen, Zahl im gleichen Tempo hochzählen.
 *  Je höher der Score, desto länger dauert es und desto stärker bremst es am Ende ab.
 *  celebrate: Abschluss-Moment direkt nach dem Workout (bei 100 mit Konfetti & Vibration) */
function animScoreRing(root, delay = 250, celebrate = false) {
  const r = $('.score-ring', root); if (!r) return;
  const score = +r.dataset.score, fg = $('.ring-fg', r), num = $('.score-num', r), L = +fg.dataset.len;
  const draw = v => { fg.style.strokeDashoffset = String(L * (1 - v / 100)); };
  const finish = () => { draw(score); num.textContent = score; if (score >= 100) perfectScore(r, celebrate); };
  fg.style.transition = 'none';
  if (!motionFull() || !(score > 0)) { finish(); return; }
  const f = score / 100, dur = 1000 + 2400 * f * f, k = 2.2 + 1.3 * f;
  num.textContent = '0'; draw(0);
  let t0 = null;
  const step = now => {
    if (!r.isConnected) return;
    if (t0 == null) t0 = now + delay;
    const p = Math.max(0, Math.min(1, (now - t0) / dur));
    if (p >= 1) { finish(); return; }
    const v = score * (1 - Math.pow(1 - p, k));
    draw(v); num.textContent = Math.floor(v);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
/** Score 100: goldener Ring mit Lichtimpuls – direkt nach dem Workout zusätzlich Konfetti & Vibration */
function perfectScore(r, celebrate) {
  if (r.classList.contains('perfect')) return;
  const id = 'sg' + Math.random().toString(36).slice(2, 8), anim = motionFull();
  $('svg', r).insertAdjacentHTML('afterbegin', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".45" stop-color="#f6bb2a"/><stop offset="1" stop-color="#d38800"/></linearGradient></defs>`);
  $('.ring-fg', r).style.stroke = `url(#${id})`;
  r.classList.add('perfect');
  if (anim) r.classList.add('pop');
  if (!celebrate) return;
  const b = r.getBoundingClientRect();
  confetti({ x: b.left + b.width / 2, y: b.top + b.height / 2, colors: ['#ffe9a8', '#f6bb2a', '#d38800', '#ffffff', cssVar('--accent')] });
  vibrate([30, 60, 90]);
}
function showSummary({ id, doc, prs }) {
  const sc = F('f_score') ? Analytics.score(id) : null;
  const goalsHit = checkGoals(doc);
  const isC = e => Ex.type(Ex.get(e.exerciseId)) === 'cardio';
  const done = doc.entries.filter(e => !isC(e)).flatMap(e => e.sets.filter(s => s.done && !s.warmup));
  const ct = cardioTotals(doc.entries.filter(isC).flatMap(e => e.sets));
  const vol = sum(done.map(setVol));
  const rpes = done.filter(s => s.rpe).map(s => s.rpe);
  const real = F('f_prs') ? prs.filter(p => !p.first) : [];
  const firsts = F('f_prs') ? prs.filter(p => p.first) : [];
  // Vergleich mit dem letzten gleichen Plan-Tag
  const prevSame = Analytics.cur().rows.filter(r => r.id !== id && ((doc.planId && r.planId === doc.planId && r.name === doc.planDayName) || (!doc.planId && r.name === doc.name))).pop();
  const m = Modal.open({
    title: 'Workout gespeichert',
    body: `<div class="center" style="padding:14px 0 4px">
        ${sc ? scoreRingHtml(sc) : `<div class="sum-badge sum-draw">${icon(real.length ? 'trophy' : 'checkCircle')}</div>`}
        <h2 class="mt-8">${esc(doc.planDayName || doc.name)}</h2>
        <p class="dim">${esc(fmtDateLong(doc.date))}</p>
      </div>
      ${sc ? scoreBreakdownHtml(sc) : ''}
      <div class="pr-grid mt-16 fx-stagger">
        <div class="pr-box"><span>Dauer</span><b>${fmtDur(doc.durationSec)}</b></div>
        ${done.length || !ct.n ? `<div class="pr-box"><span>Volumen</span><b>${fmtTon(vol)}</b>${prevSame ? `<em>${deltaHtml(vol, prevSame.ton)} vs. ${fmtDateShort(prevSame.date)}</em>` : ''}</div>
        <div class="pr-box"><span>Sätze</span><b>${done.length}</b></div>
        <div class="pr-box"><span>Ø RPE</span><b>${rpes.length ? nf(avg(rpes), 1) : '–'}</b></div>` : ''}
        ${ct.n ? `<div class="pr-box"><span>Cardio</span><b>${fmtDur(ct.sec)}</b></div>${ct.km ? `<div class="pr-box"><span>Distanz</span><b>${fmtKm(ct.km)}</b></div>` : ''}${ct.kmh ? `<div class="pr-box"><span>Ø Tempo</span><b>${fmtKmh(ct.kmh)}</b></div>` : ''}` : ''}
      </div>
      ${real.length ? `<h4 class="mt-24 mb-8">Neue PRs</h4><div class="list sum-prs">${real.map((p, i) => `<div class="list-item pr-shine" style="--i:${i}"><span class="li-icon" style="color:var(--accent-text)">${icon('trophy')}</span><span class="li-main"><span class="li-title">${esc(PR.label(p))}</span><div class="li-sub">${[p.imp.weight && 'Gewicht', p.imp.e1rm && 'e1RM', p.imp.volume && 'Volumen', p.imp.reps && 'Wiederholungen', p.imp.dur && 'Längste Einheit', p.imp.km && 'Weiteste Distanz', p.imp.kmh && 'Schnellstes Tempo'].filter(Boolean).join(' · ')}</div></span></div>`).join('')}</div>` : ''}
      ${goalsHit.length ? `<h4 class="mt-24 mb-8">Ziel erreicht</h4><div class="list">${goalsHit.map(g => `<div class="list-item am-featured fx-up"><span class="li-icon">${icon('target')}</span><span class="li-main"><span class="li-title">${esc(Ex.name(g.exId))} ${goalLabel(g)}</span><div class="li-sub">${goalType(g) === 'wr' ? `Heute geschafft: ${fmtW(g.best)} × ${g.reps}+` : `Geschätztes 1RM heute: ${fmtW(g.best, 1)}`}</div></span></div>`).join('')}</div>` : ''}
      ${firsts.length ? `<p class="dim small mt-16">Erste Bestwerte gesetzt für: ${firsts.map(p => esc(p.name)).join(', ')}</p>` : ''}`,
    foot: `<button class="btn btn-secondary" data-x="share" aria-label="Teilen" style="flex:0 0 auto">${icon('share')}</button><button class="btn btn-secondary" data-x="tpl">${icon('copy')} Als Workout</button><button class="btn btn-primary" data-x="ok">Fertig</button>`
  });
  // Abschluss-Moment: Haken zeichnet sich, Zahlen zählen hoch, PRs erscheinen nacheinander mit Glanz
  $$('.sum-draw svg *', m.el).forEach(n => n.setAttribute('pathLength', '1'));
  animScoreRing(m.el, 250, true);
  countUp($$('.pr-box b', m.el), 900, 150);
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'share') shareWorkout({ ...doc, id });
    else if (b.dataset.x === 'tpl') saveAsTemplate(doc.entries, doc.planDayName || doc.name);
    else m.close();
  });
  if (goalsHit.length) {
    confetti();
    goalsHit.forEach((g, i) => setTimeout(() => toast(`Ziel erreicht: ${Ex.name(g.exId)} ${goalLabel(g)}`, 'pr'), 300 + i * 900));
  }
  if (real.length) {
    if (!goalsHit.length) confetti();
    real.slice(0, 4).forEach((p, i) => setTimeout(() => toast(`Neuer PR: ${PR.label(p)}`, 'pr'), 500 + i * 900));
  }
}

