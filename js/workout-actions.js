/* Trainio – Aktives Workout: Bedienung (Eingaben, Haken, Menüs, Wischgesten, Abschluss)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

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
  const row = $(`.set-row[data-ei="${ei}"][data-si="${si}"]`);
  if (!row) return;
  row.classList.add('sel');
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
  // Zahl rollt wie ein Zählwerk: mehr → von unten, weniger → von oben
  fx($$(`[data-in^="set"][data-ei="${el.dataset.ei}"][data-si="${el.dataset.si}"]`).filter(i => el.parentElement && el.parentElement.contains(i)), d > 0 ? 'fx-roll-up' : 'fx-roll-down');
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
    fx($$(`#ex-${en.uid} .exs-count .roll, .wo-stats .roll`), 'fx-roll-down');
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
  // Häkchen zeichnet sich, Zähler (Übung und Kopf) rollen eine Stelle weiter
  fx($(`.set-row[data-ei="${ei}"][data-si="${si}"]`), 'fx-done');
  fx($$(`#ex-${en.uid} .exs-count .roll, .wo-stats .roll`), 'fx-roll-up');
  fx($(`#ex-${en.uid} .exs-count.ok svg`), 'fx-pop');
  if (exDone) fx($('#ex-' + en.uid), 'fx-complete');
  // Liste: zur nächsten Übung scrollen, wenn diese fertig ist
  const nextE = woCollapse() ? openIndex(w) : w.sel.e;
  if (!focus && exDone && nextE >= 0 && nextE !== ei && S().autoScroll !== false) requestAnimationFrame(() => scrollToExercise(w.entries[nextE]));
  else if (focus && w.focusE !== ei) Scroll.to(0, true);
  // Letzter Satz abgehakt: zum „Workout beenden"-Knopf unten scrollen
  if (wasLast && !focus && S().autoScroll !== false) requestAnimationFrame(() => { const b = $('#woFinishEnd'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  // Gleiche Übung geht weiter: die Pausen-Leiste darf den nächsten Satz (und seinen „Satz erledigt"-Knopf) nicht verdecken
  else if (!exDone && S().autoScroll !== false) requestAnimationFrame(() => revealAboveDock(w.sel));
};
/** Liegt der gewählte Satz unter der Pausen-Leiste, so weit hochscrollen, dass er knapp darüber frei steht */
function revealAboveDock(sel) {
  const dock = $('.rest-dock:not(.leaving)');
  if (!dock || !sel || sel.e < 0) return;
  const q = `[data-ei="${sel.e}"][data-si="${sel.s}"]`;
  const els = $$(`.set-row${q}, [data-act="setDone"]${q}`).filter(n => n.offsetParent && !n.closest('.modal'));
  if (!els.length) return;
  // Oberkante der Leiste aus ihrer festen Position – unabhängig davon, ob sie gerade noch hereingleitet
  const dockTop = innerHeight - (parseFloat(getComputedStyle(dock).bottom) || 0) - dock.offsetHeight;
  const over = Math.max(...els.map(n => n.getBoundingClientRect().bottom)) - (dockTop - 12);
  if (over > 0) Scroll.to(Scroll.y + over, S().motion === 'full');
}
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
    !s.warmup && { key: 'warm', label: 'Aufwärmsatz', icon: 'flame' },
    F('f_setTypes') && s.kind !== 'drop' && { key: 'drop', label: 'Drop-Satz', icon: 'arrowDown' },
    F('f_setTypes') && s.kind !== 'fail' && { key: 'fail', label: 'Bis zum Muskelversagen', icon: 'bolt' },
    !s.warmup && { key: 'fixset', label: s.fix ? 'Form-Fix entfernen' : 'Form-Fix (nur dieser Satz)', icon: 'refresh' },
    s.weightKg != null && { key: 'fillW', label: `${fmtW(s.weightKg)} für alle offenen Sätze`, icon: 'copy' },
    { key: 'dup', label: 'Satz duplizieren', icon: 'copy' },
    { key: 'del', label: 'Satz löschen', icon: 'trash', danger: true }
  ]);
  if (!k) return;
  if (k === 'normal') { s.warmup = false; s.kind = null; }
  if (k === 'warm') { s.warmup = true; s.kind = null; s.fix = false; }
  if (k === 'fixset') { s.fix = !s.fix; toast(s.fix ? 'Form-Fix: Satz zählt nicht gegen dich' : 'Form-Fix entfernt', 'success', { cat: 'workout' }); }
  if (k === 'drop' || k === 'fail') { s.warmup = false; s.kind = k; }
  if (k === 'fillW') en.sets.forEach(x => { if (!x.done && !x.warmup) x.weightKg = s.weightKg; });
  if (k === 'dup') en.sets.splice(si + 1, 0, { ...s, done: false, doneAt: null });
  if (k === 'del') { en.sets.splice(si, 1); Workout.autoSelect(); }
  Workout.save();
  App.renderCurrent();
};
/** Form-Fix-Hinweis in der Übungskarte */
const fixTxt = en => `${icon('refresh').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} Form-Fix${en.formFix.note ? ': ' + esc(en.formFix.note) : ''} – ab hier neu gezählt`;
Actions.exMenu = async el => {
  const w = Workout.cur(); const ei = +el.dataset.ei; const en = w.entries[ei];
  const type = Ex.type(Ex.get(en.exerciseId));
  const isCardio = type === 'cardio';
  const k = await actionMenu(en.exerciseName, [
    F('f_warmup') && type === 'kg' && { key: 'warm', label: 'Aufwärmsätze hinzufügen', icon: 'flame' },
    !isCardio && { key: 'goal', label: 'Trainingsziel ändern', icon: 'target' },
    canFillAny(en, lastSessionFor(en.exerciseId, w)) && { key: 'fill', label: 'Letztes Mal übernehmen', icon: 'fillIn' },
    !isCardio && { label: 'Sätze & Pause', icon: 'layers', items: [
      F('f_setTypes') && { key: 'drop', label: 'Drop-Satz hinzufügen', icon: 'arrowDown' },
      F('f_plates') && type === 'kg' && { key: 'plates', label: 'Scheibenrechner', icon: 'plate' },
      { key: 'rest', label: 'Pausenzeit ändern', sub: `aktuell ${fmtClock(en.target.restSec || S().defaultRestSec)}`, icon: 'timer' },
      { key: 'uni', label: en.uni ? 'Beidseitig erfassen' : 'Einseitig: links & rechts', icon: 'swap' }
    ] },
    { label: isCardio ? 'Notizen' : 'Notizen & Technik', icon: 'note', items: [
      { key: 'note', label: en.note ? 'Notiz für heute bearbeiten' : 'Notiz nur für heute', icon: 'note' },
      { key: 'pin', label: pinNote(en.exerciseId) ? 'Dauerhafte Notiz bearbeiten' : 'Dauerhafte Notiz', icon: 'flag' },
      !isCardio && { key: 'fix', label: en.formFix ? 'Form-Fix entfernen' : 'Form-Fix', icon: 'refresh' }
    ] },
    { label: 'Übung verwalten', icon: 'sliders', items: [
      { key: 'info', label: 'Details & Verlauf', icon: 'chart' },
      { key: 'swap', label: 'Übung ersetzen', icon: 'swap' },
      ei > 0 && { key: 'up', label: 'Nach oben', icon: 'arrowUp' },
      ei < w.entries.length - 1 && { key: 'down', label: 'Nach unten', icon: 'arrowDown' },
      { key: 'del', label: 'Übung entfernen', icon: 'trash', danger: true }
    ] }
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
  } else if (k === 'fix') {
    if (en.formFix) { en.formFix = null; toast(`Form-Fix bei ${en.exerciseName} entfernt`, 'success', { cat: 'workout' }); }
    else {
      const v = await promptDialog({ title: 'Form-Fix', label: 'Was machst du an der Technik besser? (optional)', placeholder: 'z. B. tiefer, Rücken gerade', okLabel: 'Form-Fix setzen' });
      if (v == null) return;
      en.formFix = { note: v.trim(), at: Date.now() };
      en.suggestion = null;   // kein „mehr Gewicht"-Vorschlag mehr – jetzt zählt die saubere Technik
      toast(`Form-Fix: ${en.exerciseName} zählt ab diesem Workout neu`, 'success', { cat: 'workout' });
    }
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
    const [gone] = w.entries.splice(ei, 1);
    w.openE = null;
    toast(`${en.exerciseName} entfernt`, 'info', { duration: 6000, action: { label: 'Rückgängig', fn: () => {
      const cw = Workout.cur(); if (!cw || cw.id !== w.id || cw.entries.some(e => e.uid === gone.uid)) return;
      cw.entries.splice(Math.min(ei, cw.entries.length), 0, gone);
      Workout.autoSelect(); Workout.save(); App.renderCurrent();
      fx($('#ex-' + gone.uid), 'fx-up');
    } } });
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
  if (!w) return;
  const keep = JSON.parse(JSON.stringify(w));
  Workout.discard();
  App.renderCurrent();
  // Länger stehen lassen als sonst: hier steckt ein ganzes Training drin
  toast(w.editingId ? 'Änderungen verworfen' : 'Workout abgebrochen', 'info', { duration: 9000, action: { label: 'Rückgängig', fn: () => {
    if (!Workout.restore(keep)) return toast('Es läuft schon ein anderes Workout', 'warn');
    App.go('training'); App.renderCurrent();
    toast('Workout wiederhergestellt', 'success');
  } } });
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
  App.go('start', { kind: 'zoomout' });
  if (res.editing) { toast('Workout aktualisiert', 'success'); return; }
  showSummary(res);
};
