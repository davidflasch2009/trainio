/* Trainio – Start-Tab & Training-Tab
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   8. View: Start (Dashboard)
   ========================================================================== */
Views.start = {
  render(el) {
    const ix = Analytics.cur();
    const st = Analytics.streak();
    const t = todayDN();
    const cw = weekStartDN(t);
    const volNow = Analytics.volumeBetween(cw, t);
    // Vorwoche bis zum gleichen Tag – heute erst, wenn heute ein Workout gespeichert ist
    const volPrev = Analytics.volumeBetween(cw - 7, cw - 7 + (Analytics.cmpEnd() - cw));
    const next = Analytics.nextPlanDay();
    const w = Workout.cur();
    const goal = weeklyTarget();
    const dots = Array.from({ length: 7 }, (_, i) => `<i class="${st.days.has(cw + i) ? 'on' : ''} ${cw + i === t ? 'today' : ''}" title="${WD_SHORT[dowOfDN(cw + i)]}"></i>`).join('');
    const nRecent = S().homeRecent ?? 3;
    const recent = nRecent ? ix.rows.slice(-nRecent).reverse() : [];
    el.innerHTML = `
      <div class="start-date">${esc(new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
      ${w ? `<button class="card clickable mt-16" data-act="go" data-tab="training" style="width:100%;text-align:left;border-color:var(--accent-dim)">
          <div class="row"><span class="badge accent"><span class="pulse" style="width:8px;height:8px;border-radius:50%;background:currentColor;animation:pulse 1.4s infinite"></span> Live</span><span class="grow"></span><span class="wo-timer" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span></div>
          <h3 class="mt-8">${esc(w.name)}</h3>
          <p class="dim small">Workout läuft – tippen zum Fortsetzen</p>
        </button>` : ''}
      ${S().homeStats === false ? '' : `<div class="stat-grid mt-16">${homeTileKeys().map(k => ({
        streak: `<div class="stat">
          <div class="stat-label">${icon('flame')} Streak ${infoBtn('Aufeinanderfolgende Wochen mit mindestens einem Workout. Die Punkte zeigen deine Trainingstage dieser Woche.')}</div>
          <div class="stat-value">${st.cur}<small>${st.cur === 1 ? 'Woche' : 'Wochen'}</small></div>
          <div class="week-dots">${dots}</div>
          <div class="stat-sub">${st.days.size}/${goal} Tage diese Woche</div>
        </div>`,
        volume: `<div class="stat">
          <div class="stat-label">${icon('bolt')} Volumen ${infoBtn('Summe aus Wiederholungen × Gewicht aller erledigten Sätze dieser Woche. Vergleich mit der Vorwoche bis zum gleichen Wochentag – der heutige Tag zählt erst, wenn du heute ein Workout gespeichert hast.')}</div>
          <div class="stat-value">${fmtTon(volNow)}</div>
          <div class="stat-sub">diese Woche ${deltaHtml(volNow, volPrev)}</div>
        </div>`,
        workouts: `<div class="stat">
          <div class="stat-label">${icon('trophy')} Workouts</div>
          <div class="stat-value">${ix.rows.length}</div>
          <div class="stat-sub">${ix.rows.length ? 'seit ' + fmtDate(ix.rows[0].date, { month: 'short', year: 'numeric' }) : 'Leg los!'}</div>
        </div>`,
        score: scoreTile(ix, t),
        next: `<button class="stat clickable" data-act="startNext" style="text-align:left;color:inherit;font:inherit;cursor:pointer">
          <div class="stat-label">${icon('calendar')} ${next ? whenLabel(next) : 'Nächstes Training'}</div>
          <div class="stat-value" style="font-size:19px">${next ? esc(next.day.name) : '–'}</div>
          <div class="stat-sub ellipsis">${next ? esc(next.plan.name) : activePlan() ? 'Keine Tage geplant' : 'Plan erstellen →'}</div>
        </button>`
      })[k]).join('')}</div>`}
      <div class="mt-16">
        ${w ? `<button class="btn btn-hero" data-act="go" data-tab="training">${icon('play')} Workout fortsetzen</button>`
            : `<button class="btn btn-hero" data-act="startSheet">${icon('play')} Workout starten</button>`}
      </div>
      ${goalsCard()}
      ${nRecent ? `<div class="section-head"><h2>Letzte Workouts</h2>${ix.rows.length ? `<button class="link-btn" data-act="showHistory">Alle anzeigen</button>` : ''}</div>
      ${recent.length ? `<div class="col">${recent.map(miniWorkoutCard).join('')}</div>`
        : `<div class="card">${emptyState('dumbbell', 'Noch keine Workouts', 'Starte dein erstes Training – oder importiere deine Arrow-History unter Mehr → Daten.', F('f_arrow') ? `<button class="btn btn-secondary" data-act="openArrow">${icon('upload')} Arrow-Import</button>` : '')}</div>`}` : ''}
    `;
  }
};
/* Startseiten-Kacheln: Auswahl und Reihenfolge unter Mehr → Darstellung → Startseite */
const HOME_TILES = [['streak', 'Streak'], ['volume', 'Volumen'], ['workouts', 'Workouts'], ['next', 'Nächstes Training'], ['score', 'Ø Score']];
const homeTileKeys = () => (Array.isArray(S().homeTiles) ? S().homeTiles : HOME_TILES.slice(0, 4).map(x => x[0]))
  .filter(k => HOME_TILES.some(x => x[0] === k) && (k !== 'score' || F('f_score')));
/** Ø Workout-Score der letzten 4 Wochen + letzter Score */
function scoreTile(ix, t) {
  const sc = ix.rows.filter(r => r.dn > t - 28).map(r => Analytics.score(r.id)).filter(Boolean).map(s => s.score);
  const last = ix.rows.length ? Analytics.score(ix.rows[ix.rows.length - 1].id) : null;
  return `<div class="stat">
    <div class="stat-label">${icon('target')} Ø Score ${infoBtn('Durchschnittlicher Workout-Score (0–100) der letzten 4 Wochen. Wie er sich zusammensetzt, steht nach jedem Workout unter dem Ring.')}</div>
    <div class="stat-value">${sc.length ? nf(avg(sc), 0) : '–'}</div>
    <div class="stat-sub">${last ? `letztes Workout: ${last.score}` : 'noch kein Workout'}</div>
  </div>`;
}
function miniWorkoutCard(r) {
  const d = parseISO(r.date);
  return `<button class="card clickable tight mini-wo" data-act="openWorkout" data-id="${esc(r.id)}" style="width:100%;text-align:left;color:inherit;font:inherit">
    <div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
    <div class="grow">
      <div class="bold ellipsis">${esc(r.name)}</div>
      <div class="mw-stats"><span>${icon('timer', '') .replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${fmtDur(r.dur)}</span>${r.sets || !r.cSec ? `<span>${fmtTon(r.ton)}</span><span>${r.sets} Sätze</span>` : ''}${r.cSec || r.cKm ? `<span>${icon('heart').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${fmtDur(r.cSec)}${r.cKm ? ' · ' + fmtKm(r.cKm) : ''}</span>` : ''}${r.avgRpe ? `<span>RPE ${nf(r.avgRpe, 1)}</span>` : ''}</div>
    </div>
    ${icon('chevR', 'li-chev')}
  </button>`;
}
Actions.startNext = () => {
  if (Workout.cur()) return App.go('training');
  const n = Analytics.nextPlanDay();
  if (!n) { UI.trainSub = 'plans'; return App.go('training'); }
  Workout.start({ templateId: n.template.id });
};
Actions.startSheet = async () => {
  if (Workout.cur()) return App.go('training');
  const n = Analytics.nextPlanDay();
  const k = await actionMenu('Workout starten', [
    n && { key: 'next', label: `${n.day.name}`, kicker: whenLabel(n), sub: `laut „${n.plan.name}"`, icon: 'play', featured: true },
    Tpl.all().length && { key: 'pick', label: 'Eins meiner Workouts', sub: Tpl.all().slice(0, 3).map(t => t.name).join(' · ') + (Tpl.all().length > 3 ? ' …' : ''), icon: 'layers' },
    { key: 'compose', label: 'Workout zusammenstellen', sub: 'Übungen aus der Bibliothek wählen & los', icon: 'list' },
    { key: 'cardio', label: 'Cardio', sub: 'Laufen, Rad, Stepper, Schwimmen …', icon: 'heart', featured: 'plain' },
    { key: 'free', label: 'Leeres Workout', sub: 'Ohne Plan, Übungen unterwegs hinzufügen', icon: 'plus' },
    Store.all('workouts').length ? { key: 'repeat', label: 'Letztes Workout wiederholen', icon: 'repeat' } : null
  ]);
  if (k === 'next') Workout.start({ templateId: n.template.id });
  else if (k === 'pick') {
    const t = await actionMenu('Welches Workout?', Tpl.all().map(x => ({ key: x.id, label: x.name, sub: `${(x.exercises || []).length} Übungen · ca. ${planDayMinutes(x)} min`, icon: 'dumbbell' })));
    if (t) Workout.start({ templateId: t });
  }
  else if (k === 'free') Workout.start({ name: 'Freies Workout' });
  else if (k === 'cardio') Actions.startCardio();
  else if (k === 'compose') Actions.composeWorkout();
  else if (k === 'repeat') {
    const last = Store.all('workouts').sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt || 0) - (a.startedAt || 0))[0];
    if (last) Workout.load(last);
  }
};
/** Cardio starten (eigene Einheit) bzw. ins laufende Workout einfügen */
Actions.startCardio = async () => {
  const cur = Workout.cur();
  const ix = Analytics.cur(), use = {}, lastDn = {};
  for (const r of ix.rows) for (const id of Object.keys(r.cBy || {})) { use[id] = (use[id] || 0) + 1; lastDn[id] = r.dn; }
  const all = Store.all('exercises').filter(e => Ex.type(e) === 'cardio');
  const recent = all.filter(e => use[e.id]).sort((a, b) => (lastDn[b.id] - lastDn[a.id]) || (use[b.id] - use[a.id])).slice(0, 5);
  const k = await actionMenu(cur ? 'Cardio hinzufügen' : 'Cardio starten', [
    ...recent.map(e => { const ss = Analytics.sessionsOf(e.id), l = ss[ss.length - 1]; return { key: e.id, label: e.name, sub: l ? `Zuletzt ${relDays(l.dn)}: ${cardioTxt({ sec: l.secs, km: l.km, lvl: null }, cardioInfo(e))}` : '', icon: 'heart' }; }),
    { key: '__all', label: recent.length ? 'Andere Cardio-Art …' : 'Cardio-Art wählen …', sub: `${all.length} Arten: Laufband, Rad, Stepper, Schwimmen, Sport …`, icon: 'list' }
  ]);
  if (!k) return;
  let id = k;
  if (k === '__all') {
    const ids = await pickExercises({ multi: false, title: 'Cardio-Art wählen', cat: 'Cardio' });
    if (!ids || !ids[0]) return;
    id = ids[0];
  }
  const w = Workout.cur();
  if (w) {
    const en = Workout.makeEntry(id);
    w.entries.push(en);
    w.openE = w.entries.length - 1;
    Workout.autoSelect(); Workout.save();
    if (App.tab !== 'training') App.go('training'); else App.renderCurrent();
    setTimeout(() => { const c = $('#ex-' + en.uid); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  } else Workout.start({ name: Ex.name(id), entries: [Workout.makeEntry(id)] });
};
/* ---------- Ziele pro Übung: Gewicht × Wdh. (echter Satz, z. B. 8 × 100 kg) oder e1RM (geschätzt) ---------- */
const goalsList = () => S().goals || [];
const goalType = g => g.type === 'wr' ? 'wr' : 'e1rm';   // ältere Ziele ohne Typ sind e1RM-Ziele
const goalLabel = g => goalType(g) === 'wr' ? `${g.reps} × ${fmtW(g.kg)}` : `${fmtW(g.kg)} 1RM`;
/** Bestes geschätztes 1RM einer Übung aus allen gespeicherten Workouts */
const best1RM = exId => Math.max(0, maxOf(Analytics.sessionsOf(exId).filter(x => !x.cardio), x => x.best));
/** Schwerster Satz mit mindestens `reps` Wdh. (Arbeitssätze, erledigt) – null, wenn es keinen gibt */
function bestForReps(exId, reps, docs = Store.all('workouts')) {
  let best = null;
  for (const w of docs) for (const en of w.entries || []) {
    if (en.exerciseId !== exId) continue;
    for (const s of en.sets || []) {
      const kg = +s.weightKg || 0, r = repsOf(s);
      if (s.done === false || s.warmup || !kg || r < reps) continue;
      if (!best || kg > best.w || (kg === best.w && r > best.r)) best = { w: kg, r };
    }
  }
  return best;
}
/** Stand eines Ziels: aktueller Wert, Fortschritt 0–1, erreicht?, bester passender Satz */
function goalState(g) {
  if (goalType(g) === 'wr') {
    const b = bestForReps(g.exId, g.reps), cur = b ? b.w : 0;
    return { cur, b, p: g.kg ? Math.min(1, cur / g.kg) : 0, ok: !!g.reachedAt || cur >= g.kg - 1e-6 };
  }
  const cur = best1RM(g.exId);
  const ss = Analytics.sessionsOf(g.exId).filter(x => !x.cardio && x.bestSet), top = ss.length ? ss.reduce((a, b) => b.best > a.best ? b : a) : null;
  return { cur, b: top ? { w: top.bestSet.w, r: top.bestSet.r } : null, p: g.kg ? Math.min(1, cur / g.kg) : 0, ok: !!g.reachedAt || cur >= g.kg - 1e-6 };
}
function goalsCard() {
  const gs = goalsList();
  const rows = gs.map(g => {
    const { cur, b, p, ok } = goalState(g), wr = goalType(g) === 'wr';
    const bestTxt = b ? `bester Satz ${fmtW(b.w)} × ${b.r}` : '';
    const right = wr ? `${cur ? fmtW(cur, 1) : '–'} / ${fmtW(g.kg, 1)} · ${g.reps} Wdh.` : `${cur ? fmtW(cur, 1) : '–'} / ${fmtW(g.kg, 1)} 1RM`;
    const sub = ok ? `Erreicht${g.reachedAt ? ' am ' + fmtDate(isoDate(new Date(g.reachedAt))) : ''}${bestTxt ? ' · ' + bestTxt : ''}`
      : cur ? `Noch ${fmtW(g.kg - cur, 1)}${wr ? ` bei ${g.reps}+ Wdh.` : ''} · ${bestTxt} · ${nf(p * 100, 0)} %`
      : wr && Analytics.sessionsOf(g.exId).length ? `Noch kein Satz mit ${g.reps}+ Wdh.` : 'Noch keine Sätze für diese Übung';
    return `<button class="goal-item ${ok ? 'reached' : ''}" data-act="kgoalMenu" data-id="${esc(g.id)}">
      <div class="goal-top"><b>${ok ? icon('trophy').replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px;color:var(--accent-text)"') + ' ' : ''}${esc(Ex.name(g.exId))}</b><span>${right}</span></div>
      <div class="goal-bar" style="--p:${Math.round(p * 100)}%"><i></i></div>
      <div class="goal-sub">${sub}</div>
    </button>`;
  }).join('');
  return `<div class="section-head"><h2>Ziele</h2><button class="link-btn" data-act="kgoalEdit">${icon('plus').replace('<svg', '<svg width="15" height="15" style="vertical-align:-2px"')} Ziel</button></div>
    ${gs.length ? `<div class="card" style="padding-top:4px;padding-bottom:4px">${rows}</div>` : `<button class="card clickable" data-act="kgoalEdit" style="width:100%;text-align:left;color:inherit;font:inherit"><div class="bold">${icon('target').replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}Kraftziel setzen</div><div class="small dim mt-4">z. B. Bankdrücken 8 × 100 kg – oder 100 kg 1RM, geschätzt aus deinen Sätzen (80 kg × 11 ≈ 109 kg).</div></button>`}`;
}
Actions.kgoalEdit = async el => {
  const old = el && el.dataset && el.dataset.id ? goalsList().find(g => g.id === el.dataset.id) : null;
  let exId = old ? old.exId : null;
  if (!exId) {
    const ids = await pickExercises({ multi: false, title: 'Übung für das Ziel' });
    if (!ids || !ids[0]) return;
    exId = ids[0];
    if (Ex.type(Ex.get(exId)) !== 'kg') return toast('Ziele gehen nur bei Übungen mit Gewicht × Wdh.', 'warn');
  }
  const g = await goalDialog(exId, old);
  if (!g) return;
  Store.saveSettings({ goals: [...goalsList().filter(x => x.id !== g.id), g] });
  toast(g.reachedAt && !(old && old.reachedAt) ? `Ziel schon erreicht – ${Ex.name(exId)} ${goalLabel(g)}` : `Ziel gesetzt: ${Ex.name(exId)} ${goalLabel(g)}`, 'success');
};
/** Formular: Art (Gewicht × Wdh. / e1RM), Wdh., Gewicht – mit Vorschlag aus den bisherigen Sätzen */
function goalDialog(exId, old) {
  return new Promise(resolve => {
    let type = old ? goalType(old) : 'wr', res = null;
    const step = unit() === 'lb' ? 5 : 2.5;
    // Vorschlag: etwas mehr als der schwerste passende Satz – sonst aus dem e1RM zurückgerechnet (Epley)
    const sugW = reps => { const b = bestForReps(exId, reps), c = best1RM(exId); const v = b ? toU(b.w) + step / 2 : c && reps ? toU(c) / (1 + reps / 30) : 0; return v ? Math.ceil(v / step) * step : ''; };
    const sug1 = () => { const c = best1RM(exId); return c ? Math.ceil(toU(c * 1.1) / 5) * 5 : ''; };
    const reps0 = old && goalType(old) === 'wr' ? old.reps : 8;
    const m = Modal.open({
      title: old ? 'Ziel ändern' : 'Neues Ziel', size: 'sm',
      body: `<p class="bold">${esc(Ex.name(exId))}</p>
        <div class="seg fit mt-12" id="gType">${[['wr', 'Gewicht × Wdh.'], ['e1rm', 'e1RM']].map(([k, l]) => `<button type="button" data-t="${k}" class="${type === k ? 'active' : ''}">${l}</button>`).join('')}</div>
        <div class="form-grid mt-12">
          <label class="field" id="gRepsF"><span>Wiederholungen</span><input class="input num-input" id="gReps" inputmode="numeric" value="${reps0}"></label>
          <label class="field" id="gKgF"><span id="gKgL"></span><input class="input num-input" id="gKg" inputmode="decimal" value="${old ? String(round(toU(old.kg), 2)).replace('.', ',') : sugW(reps0)}"></label>
        </div>
        <p class="tiny dim mt-12" id="gHint"></p>`,
      foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">${icon('check')} Speichern</button>`,
      onClose: () => resolve(res)
    });
    const $m = q => $(q, m.el);
    const draw = () => {
      $$('#gType button', m.el).forEach(b => b.classList.toggle('active', b.dataset.t === type));
      $m('#gRepsF').classList.toggle('hidden', type !== 'wr');
      $m('#gKgF').style.gridColumn = type === 'wr' ? '' : '1 / -1';
      $m('#gKgL').textContent = type === 'wr' ? `Gewicht (${unit()})` : `Ziel-1RM (${unit()})`;
      const reps = Math.round(parseNum($m('#gReps').value) || 0), b = reps > 0 ? bestForReps(exId, reps) : null, c = best1RM(exId);
      $m('#gHint').textContent = type === 'wr'
        ? `Erreicht, sobald du einen Satz mit mindestens ${reps || '…'} Wdh. bei diesem Gewicht schaffst. ${b ? `Bisher schwerster Satz mit ${reps}+ Wdh.: ${fmtW(b.w)} × ${b.r}.` : `Bisher kein Satz mit ${reps || '…'}+ Wdh.`}`
        : `Geschätztes 1RM aus deinen Sätzen (${(E1RM_FORMULAS.find(f => f[0] === S().e1rmFormula) || E1RM_FORMULAS[0])[1]}). ${c ? `Aktuell ${fmtW(c, 1)}.` : 'Noch keine Sätze.'}`;
    };
    draw();
    m.el.addEventListener('input', e => { if (e.target.id === 'gReps') draw(); });
    m.el.addEventListener('click', e => {
      const t = e.target.closest('#gType [data-t]');
      if (t && t.dataset.t !== type) {
        type = t.dataset.t;
        const kgIn = $m('#gKg');
        kgIn.value = type === 'wr' ? sugW(Math.round(parseNum($m('#gReps').value) || 8)) : sug1();
        draw(); return;
      }
      const x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'cancel') return m.close();
      const w = parseNum($m('#gKg').value), reps = Math.round(parseNum($m('#gReps').value) || 0);
      if (!w || w <= 0) return toast('Bitte ein Gewicht eingeben', 'warn');
      if (type === 'wr' && !(reps >= 1 && reps <= 100)) return toast('Bitte 1–100 Wiederholungen eingeben', 'warn');
      const g = { id: old ? old.id : autoId().slice(0, 8), exId, type, kg: fromU(w), ...(type === 'wr' ? { reps } : {}), createdAt: old ? old.createdAt : Date.now(), reachedAt: null };
      if (goalState(g).ok) g.reachedAt = old && old.reachedAt && goalType(old) === type && old.kg === g.kg && old.reps === g.reps ? old.reachedAt : Date.now();
      res = g; m.close();
    });
  });
}
Actions.kgoalMenu = async el => {
  const g = goalsList().find(x => x.id === el.dataset.id); if (!g) return;
  const k = await actionMenu(`${Ex.name(g.exId)} · ${goalLabel(g)}`, [
    { key: 'edit', label: 'Ziel ändern', icon: 'edit' },
    { key: 'info', label: 'Übungs-Verlauf', icon: 'chart' },
    { key: 'del', label: 'Ziel löschen', icon: 'trash', danger: true }
  ]);
  if (k === 'edit') Actions.kgoalEdit({ dataset: { id: g.id } });
  else if (k === 'info') openExerciseDetail(g.exId);
  else if (k === 'del') Store.saveSettings({ goals: goalsList().filter(x => x.id !== g.id) });
};
/** Nach dem Workout: neu erreichte Ziele markieren und zurückgeben (best = e1RM bzw. Gewicht des passenden Satzes) */
function checkGoals(doc) {
  const hit = [];
  const goals = goalsList().map(g => {
    if (g.reachedAt) return g;
    let best = 0, ok = false;
    if (goalType(g) === 'wr') { const b = bestForReps(g.exId, g.reps, [doc]); best = b ? b.w : 0; ok = !!b && b.w >= g.kg - 1e-6; }
    else { best = Math.max(0, maxOf((doc.entries || []).filter(en => en.exerciseId === g.exId).flatMap(en => en.sets || []).filter(s => s.done !== false && !s.warmup), s => e1rm(+s.weightKg || 0, repsOf(s)))); ok = best >= g.kg - 1e-6; }
    if (ok) { hit.push({ ...g, best }); return { ...g, reachedAt: Date.now() }; }
    return g;
  });
  if (hit.length) Store.saveSettings({ goals });
  return hit;
}

Actions.showHistory = () => { UI.trainSub = 'history'; App.go('training'); };

/* ==========================================================================
   9. View: Training (Pläne, Verlauf, aktives Workout)
   ========================================================================== */
Views.training = {
  render(el) {
    const w = Workout.cur();
    if (w) return renderActiveWorkout(el, w);
    el.innerHTML = `
      <div class="seg mb-12" role="tablist">
        <button class="${UI.trainSub !== 'history' ? 'active' : ''}" data-act="trainSub" data-v="plans">Pläne</button>
        <button class="${UI.trainSub === 'history' ? 'active' : ''}" data-act="trainSub" data-v="history">Verlauf</button>
      </div>
      <div id="trainBody"></div>`;
    const body = $('#trainBody', el);
    if (UI.trainSub === 'history') renderHistory(body);
    else renderPlans(body);
  }
};
Actions.trainSub = el => { UI.trainSub = el.dataset.v; saveUI(); App.renderCurrent(); };

Actions.freeWorkout = () => Workout.start({ name: 'Freies Workout' });
/** Grobe Dauer eines Trainingstags: pro Satz ~45 s Arbeit + Pause, plus 5 min Aufwärmen */
const isCardioId = id => Ex.type(Ex.get(id)) === 'cardio';
const planDayMinutes = d => Math.round(d.exercises.reduce((t, x) => t + (isCardioId(x.exerciseId) ? (parseNum(x.reps) || 20) * 60 : (+x.sets || 0) * (45 + (+x.restSec || S().defaultRestSec))), 0) / 60) + (d.exercises.length ? 5 : 0);
/* ---------- Meine Workouts & Trainingsplan (Wochentage) ---------- */
const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WD_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const dowMon = dn => (dowOfDN(dn) + 6) % 7; // 0 = Montag
const Tpl = {
  all: () => Store.all('templates').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
  get: id => (id ? Store.raw('templates', id) : null)
};
const isSchedule = p => !!(p && Array.isArray(p.schedule));
const activePlan = () => { const p = Store.raw('plans', S().activePlanId); return isSchedule(p) ? p : null; };
const planDaysCount = p => (p && p.schedule ? p.schedule.filter(id => Tpl.get(id)).length : 0);
/** Geplante Workouts pro Woche: aus dem aktiven Plan, sonst Wochenziel */
function weeklyTarget() { return planDaysCount(activePlan()) || S().weeklyGoal || 4; }
const tplSets = t => sum((t.exercises || []).map(x => isCardioId(x.exerciseId) ? 0 : +x.sets || 0));
const whenLabel = n => n.inDays === 0 ? 'Heute' : n.inDays === 1 ? 'Morgen' : WEEKDAYS[n.dow];

function renderPlans(el) {
  const tpls = Tpl.all();
  const p = activePlan();
  const others = Store.all('plans').filter(x => isSchedule(x) && (!p || x.id !== p.id));
  const td = dowMon(todayDN());
  const next = Analytics.nextPlanDay();
  el.innerHTML = `
    <div class="section-head" style="margin-top:4px"><h2>Trainingsplan</h2>${p ? `<span class="row" style="gap:14px"><button class="link-btn" data-act="planAnalyze" data-id="${esc(p.id)}">Analyse</button><button class="link-btn" data-act="planEdit" data-id="${esc(p.id)}">Bearbeiten</button></span>` : ''}</div>
    ${p ? `<div class="card">
        <div class="row between"><b class="ellipsis">${esc(p.name)}</b><span class="small dim">${planDaysCount(p)} Trainingstage</span></div>
        <div class="week-plan mt-12">${p.schedule.map((id, i) => {
          const t = Tpl.get(id);
          return `<button class="wp-day ${i === td ? 'today' : ''} ${t ? 'has' : ''}" data-act="${t ? 'tplMenu' : 'planEdit'}" data-id="${esc(t ? t.id : p.id)}" aria-label="${WEEKDAYS[i]}: ${t ? esc(t.name) : 'Ruhetag'}"><span>${WD_KURZ[i]}</span><b>${t ? esc(t.name) : '–'}</b></button>`;
        }).join('')}</div>
      </div>`
    : `<div class="card">${emptyState('calendar', 'Noch kein Trainingsplan',
        tpls.length ? 'Lege fest, an welchem Wochentag du welches deiner Workouts machst.' : 'Erstelle zuerst deine Workouts – danach verteilst du sie im Plan auf die Wochentage.',
        tpls.length ? `<button class="btn btn-primary" data-act="planNew">${icon('calendar')} Trainingsplan erstellen</button>` : `<button class="btn btn-primary" data-act="tplNew">${icon('plus')} Erstes Workout erstellen</button>`)}</div>`}
    ${others.length ? `<div class="list mt-12">${others.map(o => `<div class="list-item"><span class="li-main"><span class="li-title">${esc(o.name)}</span><div class="li-sub">${o.schedule.map((id, i) => Tpl.get(id) ? WD_KURZ[i] : null).filter(Boolean).join(' · ') || 'keine Tage'}</div></span>
        <button class="btn btn-secondary btn-sm" data-act="planActivate" data-id="${esc(o.id)}">Aktivieren</button><button class="btn-icon" data-act="planMenu" data-id="${esc(o.id)}" aria-label="Plan-Menü">${icon('dots')}</button></div>`).join('')}</div>` : ''}
    ${p ? `<div class="row mt-8"><button class="btn btn-ghost btn-sm" data-act="planNew">${icon('plus')} Weiteren Plan</button><span class="grow"></span><button class="btn btn-ghost btn-sm" data-act="planMenu" data-id="${esc(p.id)}">${icon('dots')} Plan-Optionen</button></div>` : ''}

    <div class="section-head"><h2>Meine Workouts</h2>${tpls.length ? `<button class="link-btn" data-act="tplNew">${icon('plus').replace('<svg', '<svg width="15" height="15" style="vertical-align:-2px"')} Neu</button>` : ''}</div>
    ${tpls.length ? `<div class="col" style="gap:10px">${tpls.map(t => tplCard(t, p)).join('')}</div>`
      : `<div class="card">${emptyState('dumbbell', 'Noch keine Workouts', 'Ein Workout ist deine Übungsliste für einen Trainingstag – z. B. „Push", „Beine" oder „Oberkörper A".', `<button class="btn btn-primary" data-act="tplNew">${icon('plus')} Workout erstellen</button>`)}</div>`}`;
}
function tplCard(t, p) {
  const days = p ? p.schedule.map((id, i) => id === t.id ? WD_KURZ[i] : null).filter(Boolean) : [];
  return `<div class="card tpl-card">
    <div class="row top">
      <div class="grow" style="min-width:0">
        <h3 class="ellipsis">${esc(t.name)}</h3>
        <p class="small dim mt-8">${(t.exercises || []).length} Übungen · ${tplSets(t)} Sätze · ca. ${planDayMinutes(t)} min${days.length ? ` · <span class="accent bold">${days.join(', ')}</span>` : ''}</p>
        <p class="tiny faint mt-8 tpl-ex">${(t.exercises || []).map(x => esc(Ex.name(x.exerciseId))).join(' · ')}</p>
      </div>
      <button class="btn-icon" data-act="tplMenu" data-id="${esc(t.id)}" aria-label="Workout-Optionen">${icon('dots')}</button>
    </div>
  </div>`;
}
Actions.tplStart = el => Workout.start({ templateId: el.dataset.id });
Actions.tplNew = () => openTemplateEditor(null);
Actions.planNew = () => {
  if (!Tpl.all().length) { toast('Erstelle zuerst ein Workout', 'info', { cat: 'always' }); return openTemplateEditor(null); }
  openScheduleEditor(null);
};
Actions.planEdit = el => openScheduleEditor(Store.raw('plans', el.dataset.id));
Actions.planActivate = el => { Store.saveSettings({ activePlanId: el.dataset.id }); toast('Trainingsplan aktiviert', 'success'); };
Actions.tplMenu = async el => {
  const t = Tpl.get(el.dataset.id); if (!t) return;
  const k = await actionMenu(t.name, [
    { key: 'start', label: 'Starten', icon: 'play' },
    { key: 'edit', label: 'Bearbeiten', icon: 'edit' },
    { key: 'dup', label: 'Duplizieren', icon: 'copy' },
    { key: 'del', label: 'Löschen', icon: 'trash', danger: true }
  ]);
  if (k === 'start') Workout.start({ templateId: t.id });
  else if (k === 'edit') openTemplateEditor(t);
  else if (k === 'dup') { const id = autoId(); Store.put('templates', id, { ...JSON.parse(JSON.stringify(t)), id: undefined, name: t.name + ' (Kopie)', createdAt: Date.now(), updatedAt: Date.now() }, { replace: true }); toast('Workout dupliziert', 'success'); }
  else if (k === 'del') {
    const inPlans = Store.all('plans').filter(p => isSchedule(p) && p.schedule.includes(t.id));
    if (!await confirmDialog({ title: 'Workout löschen?', text: `„${t.name}" wird gelöscht.${inPlans.length ? ' Die Tage im Trainingsplan werden zu Ruhetagen.' : ''} Bereits absolvierte Trainings bleiben erhalten.`, okLabel: 'Löschen', danger: true })) return;
    inPlans.forEach(p => Store.put('plans', p.id, { ...p, schedule: p.schedule.map(id => id === t.id ? null : id), updatedAt: Date.now() }, { replace: true }));
    Store.del('templates', t.id);
    toast('Workout gelöscht', 'success');
  }
};
Actions.planMenu = async el => {
  const p = Store.raw('plans', el.dataset.id); if (!p) return;
  const k = await actionMenu(p.name, [
    p.id !== S().activePlanId && { key: 'active', label: 'Als aktiven Plan setzen', icon: 'flag' },
    { key: 'analyze', label: 'Plan analysieren', icon: 'chart' },
    { key: 'edit', label: 'Bearbeiten', icon: 'edit' },
    { key: 'dup', label: 'Duplizieren', icon: 'copy' },
    { key: 'del', label: 'Löschen', icon: 'trash', danger: true }
  ]);
  if (k === 'active') Actions.planActivate({ dataset: { id: p.id } });
  else if (k === 'analyze') openPlanAnalysis(p);
  else if (k === 'edit') openScheduleEditor(p);
  else if (k === 'dup') { const id = autoId(); Store.put('plans', id, { ...JSON.parse(JSON.stringify(p)), id: undefined, name: p.name + ' (Kopie)', createdAt: Date.now(), updatedAt: Date.now() }, { replace: true }); toast('Plan dupliziert', 'success'); }
  else if (k === 'del') {
    if (!await confirmDialog({ title: 'Plan löschen?', text: `„${p.name}" wird gelöscht. Deine Workouts und dein Verlauf bleiben erhalten.`, okLabel: 'Löschen', danger: true })) return;
    Store.del('plans', p.id);
    if (S().activePlanId === p.id) Store.saveSettings({ activePlanId: (Store.all('plans').find(isSchedule) || {}).id || '' });
    toast('Plan gelöscht', 'success');
  }
};

/** Workout-Editor: Name + Übungen (Sätze, Wdh., Pause, Notiz) */
/** Vorlagen-Übung einseitig? Ohne eigene Angabe gilt der Standard der Übung */
const tplUni = x => x.uni != null ? !!x.uni : Ex.isUni(Ex.get(x.exerciseId));
function openTemplateEditor(tpl, { onSave = null } = {}) {
  const draft = tpl ? JSON.parse(JSON.stringify(tpl)) : { name: '', exercises: [] };
  let saved = null;
  const m = Modal.open({ title: tpl ? 'Workout bearbeiten' : 'Neues Workout', size: 'full',
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">${icon('check')} Speichern</button>`,
    onClose: () => { if (onSave) onSave(saved); } });
  const render = () => {
    const xs = draft.exercises;
    m.setBody(`
      <label class="field"><span>Name des Workouts</span><input class="input" data-pe="name" value="${esc(draft.name)}" placeholder="z. B. Push, Beine, Oberkörper A"></label>
      <div class="pe-daysum mt-12">${xs.length ? `${xs.length} Übungen · ${tplSets(draft)} Sätze · ca. ${planDayMinutes(draft)} min` : 'Noch keine Übungen – füge welche aus der Bibliothek hinzu.'}</div>
      <div class="col mt-12" style="gap:8px">
        ${xs.map((x, xi) => `
          <div class="pe-row">
            <div class="row"><b class="grow ellipsis">${esc(Ex.name(x.exerciseId))}</b>
              ${isCardioId(x.exerciseId) ? `<span class="badge">${icon('heart').replace('<svg', '<svg width="13" height="13"')} Cardio</span>` : `<button class="uni-chip ${tplUni(x) ? 'on' : ''}" data-pa="uni" data-xi="${xi}" aria-pressed="${tplUni(x)}" title="Einseitig: links und rechts getrennt erfassen">${icon('swap')} L/R</button>`}
              <button class="btn-icon" data-pa="exUp" data-xi="${xi}" aria-label="Nach oben" ${xi === 0 ? 'disabled style="opacity:.3"' : ''}>${icon('chevU')}</button>
              <button class="btn-icon" data-pa="exDel" data-xi="${xi}" aria-label="Entfernen">${icon('x')}</button></div>
            ${isCardioId(x.exerciseId) ? `<div class="pe-fields" style="grid-template-columns:1fr"><label><div class="mini-label">Ziel-Dauer (Minuten, optional)</div><input class="input" inputmode="numeric" data-pe="reps" data-xi="${xi}" value="${esc(x.reps)}" placeholder="z. B. 30"></label></div>` : `<div class="pe-fields">
              <div><div class="mini-label">Sätze</div><div class="pe-step"><button data-pa="setsDec" data-xi="${xi}" aria-label="Weniger Sätze">${icon('minus')}</button><input class="input" inputmode="numeric" data-pe="sets" data-xi="${xi}" value="${esc(x.sets)}" aria-label="Sätze"><button data-pa="setsInc" data-xi="${xi}" aria-label="Mehr Sätze">${icon('plus')}</button></div></div>
              <label><div class="mini-label">${Ex.type(Ex.get(x.exerciseId)) === 'sec' ? 'Sekunden' : 'Wdh.'}${tplUni(x) ? ' je Seite' : ''}</div><input class="input" data-pe="reps" data-xi="${xi}" value="${esc(x.reps)}" placeholder="8-12"></label>
              <label><div class="mini-label">Pause</div><select class="select" data-pe="restSec" data-xi="${xi}">${uniq([30, 45, 60, 90, 120, 150, 180, 240, 300, +x.restSec || S().defaultRestSec]).sort((a, b) => a - b).map(v => `<option value="${v}" ${+x.restSec === v ? 'selected' : ''}>${fmtClock(v)}</option>`).join('')}</select></label>
            </div>`}
            <input class="input" data-pe="notes" data-xi="${xi}" value="${esc(x.notes || '')}" placeholder="Notiz (optional)" style="min-height:40px">
          </div>`).join('')}
      </div>
      <button class="btn btn-secondary btn-block mt-12" data-pa="exAdd">${icon('plus')} Übungen hinzufügen</button>`);
  };
  render();
  m.body.addEventListener('input', e => {
    const t = e.target.closest('[data-pe]'); if (!t) return;
    const k = t.dataset.pe, xi = +t.dataset.xi;
    if (k === 'name') draft.name = t.value;
    else if (k === 'sets' || k === 'restSec') draft.exercises[xi][k] = parseInt(t.value, 10) || 0;
    else draft.exercises[xi][k] = t.value;
  });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-pa], [data-x]'); if (!b || b.disabled) return;
    const xi = +b.dataset.xi, a = draft.exercises;
    switch (b.dataset.pa || b.dataset.x) {
      case 'exUp': [a[xi - 1], a[xi]] = [a[xi], a[xi - 1]]; break;
      case 'exDel': a.splice(xi, 1); break;
      case 'setsDec': case 'setsInc': a[xi].sets = clamp((+a[xi].sets || 0) + (b.dataset.pa === 'setsInc' ? 1 : -1), 1, 20); break;
      case 'uni': a[xi].uni = !tplUni(a[xi]); break;
      case 'exAdd': {
        const ids = await pickExercises({ multi: true, title: 'Übungen hinzufügen' });
        if (!ids || !ids.length) return;
        ids.forEach(id => a.push(isCardioId(id) ? { exerciseId: id, sets: 1, reps: '', restSec: 0, notes: '' } : { exerciseId: id, sets: defSets(), reps: Ex.type(Ex.get(id)) === 'sec' ? '60' : defReps(), restSec: S().defaultRestSec, notes: '', uni: Ex.isUni(Ex.get(id)) }));
        break;
      }
      case 'cancel': m.close(); return;
      case 'save': {
        if (!draft.name.trim()) { toast('Bitte einen Namen eingeben', 'warn'); $('[data-pe="name"]', m.el).focus(); return; }
        if (!a.length) { toast('Mindestens eine Übung hinzufügen', 'warn'); return; }
        const id = tpl ? tpl.id : autoId();
        Store.put('templates', id, { name: draft.name.trim(), exercises: a.map(x => ({ exerciseId: x.exerciseId, sets: Math.max(1, +x.sets || 1), reps: String(x.reps || ''), restSec: +x.restSec || S().defaultRestSec, notes: x.notes || '', uni: tplUni(x) })), createdAt: tpl ? tpl.createdAt || Date.now() : Date.now(), updatedAt: Date.now() }, { replace: true });
        saved = id;
        m.close();
        toast(`Workout „${draft.name.trim()}" gespeichert`, 'success');
        return;
      }
      default: return;
    }
    render();
  });
}

/** Trainingsplan-Editor: für jeden Wochentag ein Workout oder Ruhetag */
function openScheduleEditor(plan) {
  const draft = plan ? { name: plan.name, schedule: plan.schedule.slice() } : { name: 'Mein Trainingsplan', schedule: Array(7).fill(null) };
  const m = Modal.open({ title: plan ? 'Trainingsplan bearbeiten' : 'Neuer Trainingsplan', size: 'lg',
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">${icon('check')} Speichern</button>` });
  const render = () => {
    const tpls = Tpl.all();
    const n = draft.schedule.filter(id => Tpl.get(id)).length;
    m.setBody(`
      <label class="field"><span>Name</span><input class="input" id="spName" value="${esc(draft.name)}"></label>
      <p class="small dim mt-12">Wähle für jeden Wochentag eines deiner Workouts – oder Ruhetag. <b>${n} Trainingstage</b>${n ? `, ca. ${Math.round(sum(draft.schedule.map(id => Tpl.get(id) ? planDayMinutes(Tpl.get(id)) : 0)) / 60 * 10) / 10} h pro Woche` : ''}.</p>
      <div class="list mt-12">${draft.schedule.map((id, i) => `
        <div class="set-line sched-row">
          <div class="sl-main"><div class="sl-title">${WEEKDAYS[i]}</div></div>
          <select class="select" data-wd="${i}" aria-label="${WEEKDAYS[i]}"><option value="">Ruhetag</option>${tpls.map(t => `<option value="${esc(t.id)}" ${t.id === id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
          <button class="btn-icon" data-new="${i}" aria-label="Neues Workout für ${WEEKDAYS[i]}" title="Neues Workout">${icon('plus')}</button>
        </div>`).join('')}</div>
      ${planSummaryHtml(analyzePlan(draft.schedule))}`);
  };
  render();
  m.body.addEventListener('change', e => { const s = e.target.closest('[data-wd]'); if (s) { draft.schedule[+s.dataset.wd] = s.value || null; render(); } });
  m.body.addEventListener('input', e => { if (e.target.id === 'spName') draft.name = e.target.value; });
  m.el.addEventListener('click', e => {
    const nb = e.target.closest('[data-new]');
    if (nb) { const wd = +nb.dataset.new; openTemplateEditor(null, { onSave: id => { if (id) draft.schedule[wd] = id; render(); } }); return; }
    const x = e.target.closest('[data-x]'); if (!x) return;
    if (x.dataset.x === 'cancel') return m.close();
    if (x.dataset.x === 'analyze') return openPlanAnalysis(draft);
    if (!draft.name.trim()) { toast('Bitte einen Namen eingeben', 'warn'); return; }
    if (!draft.schedule.some(id => Tpl.get(id))) { toast('Mindestens einem Tag ein Workout zuweisen', 'warn'); return; }
    const id = plan ? plan.id : autoId();
    Store.put('plans', id, { name: draft.name.trim(), schedule: draft.schedule.map(t => Tpl.get(t) ? t : null), isCustom: true, createdAt: plan ? plan.createdAt || Date.now() : Date.now(), updatedAt: Date.now() }, { replace: true });
    if (!plan || !activePlan()) Store.saveSettings({ activePlanId: id });
    m.close();
    toast('Trainingsplan gespeichert', 'success');
  });
}

/* ---------- Plan-Analyse: Balance, Frequenz, Erholung, Umfang – aus den geplanten Sätzen ----------
   Gezählt werden Arbeitssätze (ohne Cardio). Kategorie Push/Pull/Legs wie im Fortschritt-Tab; für Frequenz und
   Erholung zählt nur der Hauptmuskel der Übung (erster Eintrag), Hilfsmuskeln nicht. */
const PLAN_MAJOR = ['Brust', 'Rücken', 'Schulter', 'Bizeps', 'Trizeps', 'Quadrizeps', 'Beinbeuger'];
const PLAN_QUICK = ['Bauch', 'Unterarme', 'Waden'];   // erholen sich schnell – keine Warnung an Folgetagen
const PLAN_MAX_SETS = 25, PLAN_MAX_MIN = 90;
const nSets = (n, w) => `${n} ${w}-${n === 1 ? 'Satz' : 'Sätze'}`;
const nList = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a.join('');
function analyzePlan(schedule) {
  const days = (schedule || []).map((id, i) => { const t = Tpl.get(id); return t ? { i, t } : null; }).filter(Boolean);
  const cats = { Push: 0, Pull: 0, Legs: 0 };
  const dayMus = Array.from({ length: 7 }, () => ({}));
  for (const { i, t } of days) for (const x of t.exercises || []) {
    const e = Ex.get(x.exerciseId), n = +x.sets || 0;
    if (!e || !n || isCardioId(x.exerciseId)) continue;
    if (cats[e.category] != null) cats[e.category] += n;
    const m = (e.muscleGroups || [])[0];
    if (m) dayMus[i][m] = (dayMus[i][m] || 0) + n;
  }
  const push = cats.Push, pull = cats.Pull, legs = cats.Legs, upper = push + pull;
  const res = { days, push, pull, legs, checks: {} };
  // Push / Pull: Pull-Sätze ÷ Push-Sätze, ausgewogen 0,8–1,2
  const pp = push ? pull / push : null;
  res.checks.pp = !push && !pull ? { ok: null, val: null, text: 'Keine Push- oder Pull-Übungen im Plan.' }
    : !push ? { ok: false, val: null, tip: 'Keine Push-Übungen – ergänze z. B. Bankdrücken oder Schulterdrücken.' }
    : { ok: pp >= 0.8 && pp <= 1.2, val: pp,
      tip: pp < 0.8 ? `Ca. ${nSets(Math.ceil(0.8 * push - pull), 'Pull')} mehr pro Woche (z. B. Rudern, Latzug) – oder weniger Push.`
        : pp > 1.2 ? `Ca. ${nSets(Math.ceil(pull / 1.2 - push), 'Push')} mehr pro Woche (z. B. Bankdrücken, Schulterdrücken) – oder weniger Pull.` : '' };
  // Beine / Oberkörper: Bein-Sätze ÷ (Push + Pull), ausgewogen 0,4–0,8
  const lu = upper ? legs / upper : null;
  res.checks.lu = !upper && !legs ? { ok: null, val: null, text: 'Keine Oberkörper- oder Beinübungen im Plan.' }
    : !upper ? { ok: false, val: null, tip: 'Keine Oberkörper-Übungen im Plan.' }
    : { ok: lu >= 0.4 && lu <= 0.8, val: lu,
      tip: lu < 0.4 ? `Ca. ${nSets(Math.ceil(0.4 * upper - legs), 'Bein')} mehr pro Woche (z. B. Kniebeuge, Beinbeuger) – oder einen Beintag ergänzen.`
        : lu > 0.8 ? `Ca. ${nSets(Math.ceil(legs / 0.8 - upper), 'Oberkörper')} mehr pro Woche – oder weniger Beine.` : '' };
  // Frequenz: an wie vielen Tagen ist ein Muskel Hauptmuskel? Ideal 2× pro Woche
  const freq = {};
  MUSCLES.forEach(m => { freq[m] = dayMus.filter(d => d[m]).length; });
  const once = PLAN_MAJOR.filter(m => freq[m] === 1), none = PLAN_MAJOR.filter(m => !freq[m]);
  res.freq = freq;
  res.checks.freq = !days.length ? { ok: null } : { ok: !once.length && !none.length,
    tip: [once.length ? `${nList(once)} ${once.length > 1 ? 'werden' : 'wird'} nur 1× pro Woche direkt trainiert – verteile die Sätze auf zwei Tage.` : '',
      none.length ? `${nList(none)} ${none.length > 1 ? 'kommen' : 'kommt'} im Plan nicht als Hauptmuskel vor.` : ''].filter(Boolean).join(' ') };
  // Erholung: derselbe Muskel mit je ≥ 3 Sätzen an zwei Tagen hintereinander (auch So → Mo)
  const recov = [];
  for (let i = 0; i < 7; i++) {
    const j = (i + 1) % 7;
    for (const m of Object.keys(dayMus[i])) if (!PLAN_QUICK.includes(m) && dayMus[i][m] >= 3 && (dayMus[j][m] || 0) >= 3) recov.push({ m, a: i, b: j, n: [dayMus[i][m], dayMus[j][m]] });
  }
  res.recov = recov;
  res.checks.recov = !days.length ? { ok: null } : { ok: !recov.length,
    tip: recov.length ? 'Plane zwischen zwei harten Einheiten für denselben Muskel ca. 48 h Pause ein – tausche die Tage oder lege einen Ruhetag dazwischen.' : '' };
  // Umfang & Dauer
  res.per = days.map(({ i, t }) => ({ i, t, ex: (t.exercises || []).length, sets: tplSets(t), min: planDayMinutes(t) }));
  const long = res.per.filter(d => d.sets > PLAN_MAX_SETS || d.min > PLAN_MAX_MIN);
  res.sets = sum(res.per.map(d => d.sets)); res.min = sum(res.per.map(d => d.min));
  res.checks.vol = !days.length ? { ok: null } : { ok: !long.length && days.length < 7,
    tip: [days.length >= 7 ? 'Kein Ruhetag – plane mindestens einen Tag Pause pro Woche ein.' : '',
      long.length ? `${nList(long.map(d => `${esc(d.t.name)} (${WD_KURZ[d.i]})`))} ${long.length > 1 ? 'sind' : 'ist'} sehr lang (über ${PLAN_MAX_SETS} Sätze oder ${PLAN_MAX_MIN} min) – auf zwei Tage aufteilen?` : ''].filter(Boolean).join(' ') };
  return res;
}
const PLAN_CHECKS = [['pp', 'Push / Pull'], ['lu', 'Beine / Oberkörper'], ['freq', 'Frequenz'], ['recov', 'Erholung'], ['vol', 'Umfang']];
const paMark = ok => ok == null ? '<span class="pa-mark na">–</span>' : ok ? `<span class="pa-mark ok">${icon('check')}</span>` : `<span class="pa-mark warn">${icon('warn')}</span>`;
/** Kurzfassung im Plan-Editor – aktualisiert sich bei jeder Änderung */
function planSummaryHtml(a) {
  if (!a.days.length) return `<div class="card plan-sum mt-12"><p class="small dim">Weise den Tagen Workouts zu – dann erscheint hier die Plan-Analyse.</p></div>`;
  const c = a.checks;
  return `<div class="card plan-sum mt-12">
    <div class="row between"><b>Analyse</b><span class="small dim">${a.sets} Sätze · ca. ${nf(a.min / 60, 1)} h pro Woche</span></div>
    <div class="pa-pills mt-8">${PLAN_CHECKS.map(([k, l]) => `<span class="pa-pill ${c[k].ok == null ? '' : c[k].ok ? 'ok' : 'warn'}">${paMark(c[k].ok)}${l}${c[k].val != null ? ` <b>${nf(c[k].val, 2)}</b>` : ''}</span>`).join('')}</div>
    <button class="btn btn-secondary btn-sm btn-block mt-12" data-x="analyze">${icon('chart')} Ganze Analyse ${icon('chevR')}</button>
  </div>`;
}
/** Waagerechte Skala mit erlaubtem Bereich (gestrichelt) und Markierung für den Plan-Wert */
function paGauge(v, lo, hi, max, ok) {
  const pc = x => Math.max(0, Math.min(100, x / max * 100));
  return `<div class="pa-gauge ${ok ? '' : 'warn'}"><i style="left:${pc(lo)}%;width:${pc(hi) - pc(lo)}%"></i>${v != null ? `<b style="left:${pc(v)}%"></b>` : ''}</div>
    <div class="pa-ticks tiny faint"><span style="left:0">0</span><span style="left:${pc(lo)}%">${nf(lo, 1)}</span><span style="left:${pc(hi)}%">${nf(hi, 1)}</span><span style="left:100%">${nf(max, 1)}</span></div>`;
}
function openPlanAnalysis(plan) {
  const a = analyzePlan(plan && plan.schedule);
  const c = a.checks;
  const head = (k, l, extra = '') => `<div class="row between"><b>${l}</b><span class="row" style="gap:8px">${extra}${paMark(c[k].ok)}</span></div>`;
  const tip = k => c[k].tip ? `<p class="small pa-tip mt-8">${icon('info')} ${c[k].tip}</p>` : c[k].text ? `<p class="small dim mt-8">${c[k].text}</p>` : '';
  const freqChips = MUSCLES.filter(m => a.freq[m] || PLAN_MAJOR.includes(m)).sort((x, y) => a.freq[y] - a.freq[x])
    .map(m => `<span class="pa-chip ${a.freq[m] >= 2 ? 'ok' : a.freq[m] ? 'low' : 'none'}">${esc(m)} <b>${a.freq[m]}×</b></span>`).join('');
  Modal.open({ title: `Analyse: ${(plan && plan.name) || 'Trainingsplan'}`, size: 'lg',
    body: !a.days.length ? emptyState('calendar', 'Noch keine Trainingstage', 'Weise den Wochentagen Workouts zu, dann kann der Plan analysiert werden.') : `
      <div class="week-plan">${(plan.schedule || []).map((id, i) => { const t = Tpl.get(id); return `<div class="wp-day ${t ? 'has' : ''}"><span>${WD_KURZ[i]}</span><b>${t ? esc(t.name) : '–'}</b></div>`; }).join('')}</div>
      <p class="small dim mt-12">${a.days.length} Trainingstage · ${7 - a.days.length} Ruhetage · ${a.sets} Sätze · ca. ${nf(a.min / 60, 1)} h pro Woche</p>

      <div class="section-head"><h4>Balance</h4></div>
      <div class="card">
        ${head('pp', 'Push / Pull', c.pp.val != null ? `<span class="pa-val">${nf(c.pp.val, 2)}</span>` : '')}
        <div class="small dim">${a.pull} Pull-Sätze / ${a.push} Push-Sätze pro Woche · ausgewogen 0,8–1,2</div>
        ${c.pp.val != null ? paGauge(c.pp.val, 0.8, 1.2, 2, c.pp.ok) : ''}${tip('pp')}
      </div>
      <div class="card mt-12">
        ${head('lu', 'Beine / Oberkörper', c.lu.val != null ? `<span class="pa-val">${nf(c.lu.val, 2)}</span>` : '')}
        <div class="small dim">${a.legs} Bein-Sätze / ${a.push + a.pull} Oberkörper-Sätze pro Woche · ausgewogen 0,4–0,8</div>
        ${c.lu.val != null ? paGauge(c.lu.val, 0.4, 0.8, 1.5, c.lu.ok) : ''}${tip('lu')}
      </div>

      <div class="section-head"><h4>Frequenz & Erholung</h4></div>
      <div class="card">
        ${head('freq', 'Frequenz')}
        <div class="small dim">An wie vielen Tagen pro Woche ein Muskel direkt (als Hauptmuskel) trainiert wird – ideal 2×.</div>
        <div class="pa-chips mt-8">${freqChips}</div>${tip('freq')}
      </div>
      <div class="card mt-12">
        ${head('recov', 'Erholung')}
        ${a.recov.length ? `<div class="col mt-8" style="gap:4px">${a.recov.map(r => `<div class="small"><b>${esc(r.m)}</b> <span class="dim">${WD_KURZ[r.a]} → ${WD_KURZ[r.b]} (${r.n[0]} + ${r.n[1]} Sätze)</span></div>`).join('')}</div>`
          : '<div class="small dim">Kein Muskel wird an zwei Tagen hintereinander hart belastet (je 3+ Sätze).</div>'}${tip('recov')}
      </div>

      <div class="section-head"><h4>Umfang & Dauer</h4></div>
      <div class="card">
        ${head('vol', 'Umfang')}
        <table class="tbl mt-8"><thead><tr><th>Tag</th><th>Workout</th><th class="r">Übungen</th><th class="r">Sätze</th><th class="r">min</th></tr></thead><tbody>
          ${a.per.map(d => `<tr class="${d.sets > PLAN_MAX_SETS || d.min > PLAN_MAX_MIN ? 'pa-long' : ''}"><td>${WD_KURZ[d.i]}</td><td>${esc(d.t.name)}</td><td class="r">${d.ex}</td><td class="r">${d.sets}</td><td class="r">${d.min}</td></tr>`).join('')}
          <tr class="pa-sum"><td colspan="2">Ø pro Workout</td><td class="r">${nf(avg(a.per.map(d => d.ex)), 1)}</td><td class="r">${nf(avg(a.per.map(d => d.sets)), 1)}</td><td class="r">${Math.round(avg(a.per.map(d => d.min)))}</td></tr>
        </tbody></table>${tip('vol')}
      </div>
      <p class="tiny faint mt-12">Grundlage sind die geplanten Arbeitssätze deiner Workouts (ohne Cardio). Hilfsmuskeln zählen für Frequenz und Erholung nicht mit.</p>` });
}
Actions.planAnalyze = el => openPlanAnalysis(Store.raw('plans', el.dataset.id));

/* Eigenes Workout: Übungen aus der Bibliothek wählen → sofort starten */
Actions.composeWorkout = async () => {
  if (Workout.cur()) return App.go('training');
  const ids = await pickExercises({ multi: true, title: 'Übungen fürs Workout wählen' });
  if (!ids || !ids.length) return;
  Workout.start({ name: 'Eigenes Workout', entries: ids.map(id => Workout.makeEntry(id, { sets: defSets() })) });
};
/* Aktuelles/gespeichertes Workout unter „Meine Workouts" ablegen */
async function saveAsTemplate(entries, name) {
  const v = await promptDialog({ title: 'Als Workout speichern', label: 'Name', value: name || 'Mein Workout', okLabel: 'Speichern' });
  if (!v || !v.trim()) return;
  const ex = entries.map(en => ({ exerciseId: en.exerciseId, sets: Math.max(1, (en.sets || []).filter(s => !s.warmup).length || 3), reps: (en.target && en.target.reps) || String(((en.sets || []).find(s => s.reps) || {}).reps || '8-12'), restSec: (en.target && en.target.restSec) || S().defaultRestSec, notes: '', uni: !!en.uni }));
  const same = Tpl.all().find(t => norm(t.name) === norm(v));
  const id = same ? same.id : autoId();
  Store.put('templates', id, { name: v.trim(), exercises: ex, createdAt: same ? same.createdAt : Date.now(), updatedAt: Date.now() }, { replace: true });
  toast(`„${v.trim()}" unter „Meine Workouts" gespeichert`, 'success');
}

/* ---------- Verlauf + Kalender ---------- */
function renderHistory(el) {
  const ix = Analytics.cur();
  const rows = ix.rows.slice().reverse();
  const t = new Date();
  const [cy, cm] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  const first = new Date(cy, cm, 1);
  const startOff = S().weekStart === 'sunday' ? first.getDay() : (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();
  const byDate = {};
  for (const r of ix.rows) (byDate[r.date] || (byDate[r.date] = [])).push(r);
  const heads = S().weekStart === 'sunday' ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  let cells = '';
  for (let i = 0; i < startOff; i++) cells += '<span></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${cy}-${pad(cm + 1)}-${pad(d)}`;
    const has = byDate[iso];
    // ein Punkt pro Workout (max. 3, dann „+“); mehrere an einem Tag → erst auswählen
    const act = !has ? 'disabled' : has.length === 1 ? `data-act="openWorkout" data-id="${esc(has[0].id)}"` : `data-act="calDay" data-date="${iso}"`;
    cells += `<button class="${has ? 'has' : ''} ${iso === isoDate() ? 'today' : ''}" ${act} aria-label="${d}. ${has ? has.map(x => x.name).join(', ') : 'kein Training'}">${d}${has ? `<span class="cal-dots">${'<i></i>'.repeat(Math.min(3, has.length))}${has.length > 3 ? '<b>+</b>' : ''}</span>` : ''}</button>`;
  }
  const monthCount = Object.keys(byDate).filter(k => k.startsWith(`${cy}-${pad(cm + 1)}`)).length;
  // Gruppierung nach Monat
  const groups = [];
  for (const r of rows) {
    const k = r.date.slice(0, 7);
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, items: [] });
    groups[groups.length - 1].items.push(r);
  }
  el.innerHTML = `
    <div class="card">
      <div class="row between mb-8">
        <button class="btn-icon" data-act="calNav" data-d="-1" aria-label="Vorheriger Monat">${icon('chevL')}</button>
        <div class="center"><div class="cal-pick">
          <select class="select cal-sel" data-ch="calPick" data-k="m" aria-label="Monat">${MONTHS_LONG.map((n, i) => `<option value="${i}" ${i === cm ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select class="select cal-sel" data-ch="calPick" data-k="y" aria-label="Jahr">${calYears(cy).map(y => `<option value="${y}" ${y === cy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div><div class="tiny dim">${monthCount} Trainingstage</div></div>
        <button class="btn-icon" data-act="calNav" data-d="1" aria-label="Nächster Monat">${icon('chevR')}</button>
      </div>
      <div class="cal">${heads.map(h => `<span class="cal-h">${h}</span>`).join('')}${cells}</div>
    </div>
    ${groups.length ? groups.slice(0, UI.histMore ? 999 : 6).map(g => `
      <div class="section-head"><h4>${parseISO(g.k + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</h4><span class="tiny dim">${g.items.length} Workouts · ${fmtTon(sum(g.items.map(x => x.ton)))}</span></div>
      <div class="col">${g.items.map(miniWorkoutCard).join('')}</div>`).join('')
      + (groups.length > 6 && !UI.histMore ? `<button class="btn btn-secondary btn-block mt-16" data-act="histMore">Ältere Monate anzeigen</button>` : '')
    : `<div class="card mt-16">${emptyState('history', 'Noch kein Verlauf', 'Abgeschlossene Workouts erscheinen hier.')}</div>`}`;
}
Actions.calNav = el => {
  const t = new Date();
  let [y, m] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  m += +el.dataset.d;
  if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
  UI.calMonth = `${y}-${m}`;
  saveUI();
  App.renderCurrent();
};
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** Jahre für die Auswahl: vom ersten Workout bis heute (mind. das gerade gezeigte) */
function calYears(shown) {
  const rows = Analytics.cur().rows, now = new Date().getFullYear();
  const from = Math.min(shown, rows.length ? +rows[0].date.slice(0, 4) : now), to = Math.max(shown, now);
  return Array.from({ length: to - from + 1 }, (_, i) => to - i);
}
Changes.calPick = el => {
  const t = new Date();
  let [y, m] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  if (el.dataset.k === 'y') y = +el.value; else m = +el.value;
  UI.calMonth = `${y}-${m}`;
  saveUI();
  App.renderCurrent();
};
/** Tag mit mehreren Workouts: erst auswählen, welches geöffnet wird */
Actions.calDay = async el => {
  const rows = Analytics.cur().rows.filter(r => r.date === el.dataset.date);
  const k = await actionMenu(fmtDateLong(el.dataset.date), rows.map(r => {
    const wo = Store.raw('workouts', r.id) || {};
    const time = wo.startedAt ? new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' : '';
    return { key: r.id, label: wo.planDayName || wo.name || r.name, sub: time + fmtDur(wo.durationSec) + (r.cardioOnly ? ' · Cardio' : ` · ${r.sets} Sätze`), icon: r.cardioOnly ? 'heart' : 'dumbbell' };
  }));
  if (k) openWorkoutDetail(k);
};
Actions.histMore = () => { UI.histMore = true; App.renderCurrent(); };

/* ---------- Workout-Detail ---------- */
Actions.openWorkout = el => openWorkoutDetail(el.dataset.id);
function openWorkoutDetail(id) {
  const wo = Store.raw('workouts', id);
  if (!wo) return toast('Workout nicht gefunden', 'error');
  const editMeta = () => openWorkoutMeta(id, () => { m.dismiss(); openWorkoutDetail(id); });
  const row = Analytics.cur().rows.find(r => r.id === id);
  const prEv = Analytics.cur().prEvents.filter(p => p.wid === id);
  const sc = F('f_score') ? Analytics.score(id) : null;
  const m = Modal.open({
    title: wo.planDayName || wo.name || 'Workout', size: 'lg',
    body: `
      <button class="wd-when" data-x="meta" aria-label="Datum, Uhrzeit und Dauer bearbeiten">${esc(fmtDateLong(wo.date))}${parseISO(wo.date).getFullYear() !== new Date().getFullYear() ? ' ' + parseISO(wo.date).getFullYear() : ''}${wo.startedAt ? ' · ' + new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ''} ${icon('edit')}</button>
      ${sc ? `<div class="wd-score mt-12">${scoreRingHtml(sc, true)}${scoreBreakdownHtml(sc)}</div>` : ''}
      <div class="pr-grid mt-12">
        <button class="pr-box wd-edit" data-x="meta" aria-label="Dauer bearbeiten"><span>Dauer ${icon('edit')}</span><b>${fmtDur(wo.durationSec)}</b></button>
        ${row && row.cardioOnly ? '' : `<div class="pr-box"><span>Volumen</span><b>${fmtTon(row ? row.ton : 0)}</b></div>
        <div class="pr-box"><span>Sätze</span><b>${row ? row.sets : 0}</b></div>
        <div class="pr-box"><span>Ø RPE</span><b>${row && row.avgRpe ? nf(row.avgRpe, 1) : '–'}</b></div>`}
        ${row && (row.cSec || row.cKm) ? `<div class="pr-box"><span>Cardio</span><b>${fmtDur(row.cSec)}</b></div>${row.cKm ? `<div class="pr-box"><span>Distanz</span><b>${fmtKm(row.cKm)}</b></div>` : ''}` : ''}
      </div>
      ${prEv.length ? `<div class="mt-12 row wrap">${prEv.map(p => `<span class="badge accent">${icon('trophy')} ${esc(Ex.name(p.exId))} ${fmtW(p.w)} × ${p.r}</span>`).join('')}</div>` : ''}
      ${wo.notes ? `<div class="card tight mt-12" style="background:var(--surface-2)">${icon('note').replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px;margin-right:6px"')}${esc(wo.notes)}</div>` : ''}
      ${(wo.entries || []).map(en => {
        const ex = Ex.get(en.exerciseId);
        if (Ex.type(ex) === 'cardio') {
          const info = cardioInfo(ex), ss = (en.sets || []).filter(s => s.durationSec || s.distKm);
          return `<div class="mt-16">
            <div class="row between"><button class="link-btn" style="padding:0;min-height:32px;color:var(--text)" data-act="openExercise" data-id="${esc(en.exerciseId)}"><b>${esc(Ex.entryName(en))}</b></button>
            <span class="tiny dim">${esc(cardioTxt(cardioTotals(en.sets), info))}</span></div>
            ${ss.length > 1 || info.mode !== 'time' ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Abschn.</th><th class="r">Dauer</th>${info.mode === 'dist' ? '<th class="r">km</th><th class="r">km/h</th>' : ''}${info.lvl ? `<th class="r">${esc(info.lvl)}</th>` : ''}</tr></thead><tbody>
            ${ss.map((s, i) => `<tr style="${s.done === false ? 'opacity:.45' : ''}"><td>${i + 1}</td><td class="r">${s.durationSec ? fmtClock(s.durationSec) : '–'}</td>${info.mode === 'dist' ? `<td class="r">${s.distKm ? nf(s.distKm, 2) : '–'}</td><td class="r">${s.distKm && cardioKmhValid(s.distKm, s.durationSec) ? nf(s.distKm / (s.durationSec / 3600), 1) : '–'}</td>` : ''}${info.lvl ? `<td class="r">${s.level != null ? nf(s.level, 1) + lvlUnit(info.lvl) : '–'}</td>` : ''}</tr>`).join('')}
            </tbody></table></div>` : ''}</div>`;
        }
        const isSec = Ex.type(ex) === 'sec';
        return `<div class="mt-16">
          <div class="row between"><button class="link-btn" style="padding:0;min-height:32px;color:var(--text)" data-act="openExercise" data-id="${esc(en.exerciseId)}"><b>${esc(Ex.entryName(en))}</b>${en.uni ? ' <span class="badge">L/R</span>' : ''}</button>
          <span class="tiny dim">${fmtTon(sum((en.sets || []).filter(s => s.done !== false && !s.warmup).map(setVol)))}</span></div>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Satz</th><th class="r">${isSec ? (en.uni ? 'Zeit L/R' : 'Zeit') : unit()}</th><th class="r">${isSec ? '' : en.uni ? 'Wdh. L/R' : 'Wdh.'}</th><th class="r">RPE</th><th class="r">e1RM</th></tr></thead><tbody>
          ${(en.sets || []).map((s, i) => `<tr style="${s.done === false ? 'opacity:.45' : ''}"><td>${s.warmup ? '<span class="warn-text bold">W</span>' : i + 1 - (en.sets.slice(0, i).filter(x => x.warmup).length)}${!s.warmup && KIND_LABEL[s.kind] ? ` <span class="badge ${s.kind === 'fail' ? 'danger' : 'info'}" style="height:18px">${KIND_LABEL[s.kind]}</span>` : ''}${s.done === false ? ' <span class="tiny">(offen)</span>' : ''}</td>
            <td class="r">${isSec ? secTxt(s) : wNum(s.weightKg)}</td><td class="r">${isSec ? (s.weightKg ? fmtW(s.weightKg) : '') : repsTxt(s)}</td><td class="r">${s.rpe ?? '–'}</td>
            <td class="r dim">${!isSec && e1rm(s.weightKg, repsOf(s)) ? wNum(e1rm(s.weightKg, repsOf(s))) : '–'}</td></tr>`).join('')}
          </tbody></table></div></div>`;
      }).join('')}`,
    foot: `<button class="btn btn-danger-ghost" data-x="del" aria-label="Löschen" style="flex:0 0 auto">${icon('trash')}</button>
      <button class="btn btn-secondary" data-x="share" aria-label="Teilen" title="Teilen" style="flex:0 0 auto">${icon('share')}</button>
      <button class="btn btn-secondary" data-x="edit" style="flex:1 1 auto;padding:0 12px">Bearbeiten</button>
      <button class="btn btn-primary" data-x="repeat" style="flex:1 1 auto;padding:0 12px">Wiederholen</button>`
  });
  animScoreRing(m.el);
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'del') {
      if (await confirmDialog({ title: 'Workout löschen?', text: `${wo.planDayName || wo.name || 'Workout'} vom ${fmtDate(wo.date)} wird endgültig gelöscht. PRs werden neu berechnet.`, okLabel: 'Löschen', danger: true })) {
        Store.del('workouts', id);
        m.dismiss();
        PR.recalcAll();
        toast('Workout gelöscht', 'success');
      }
    } else if (b.dataset.x === 'meta') editMeta();
    else if (b.dataset.x === 'edit') {
      const k = await actionMenu('Workout bearbeiten', [
        { key: 'meta', label: 'Datum, Uhrzeit & Dauer', sub: 'Auch Name, Körpergewicht und Notiz', icon: 'calendar' },
        { key: 'sets', label: 'Sätze & Übungen', sub: 'Gewichte, Wiederholungen, Übungen ändern', icon: 'dumbbell' }
      ]);
      if (k === 'meta') editMeta();
      else if (k === 'sets') { m.dismiss(); Workout.load(wo, { edit: true }); }
    }
    else if (b.dataset.x === 'repeat') { m.dismiss(); Workout.load(wo); }
    else if (b.dataset.x === 'share') shareWorkout({ ...wo, id });
  });
}
/** Gespeichertes Workout nachträglich ändern: Name, Datum, Startzeit, Dauer, Körpergewicht, Notiz */
function openWorkoutMeta(id, onSaved) {
  const wo = Store.raw('workouts', id);
  if (!wo) return;
  const st = wo.startedAt ? new Date(wo.startedAt) : null;
  const p2 = n => String(n).padStart(2, '0');
  const mins = Math.round((wo.durationSec || 0) / 60);
  const m = Modal.open({
    title: 'Workout bearbeiten', size: 'sm',
    body: `<div class="form-grid">
        <label class="field full"><span>Name</span><input class="input" id="wmName" value="${esc(wo.planDayName || wo.name || '')}" placeholder="Workout"></label>
        <label class="field"><span>Datum</span><input class="input" type="date" id="wmDate" value="${esc(wo.date)}" max="${isoDate()}"></label>
        <label class="field"><span>Startzeit</span><input class="input" type="time" id="wmTime" value="${st ? p2(st.getHours()) + ':' + p2(st.getMinutes()) : ''}"></label>
        <div class="field full"><span>Dauer</span>
          <div class="row wm-dur"><input class="input" id="wmH" inputmode="numeric" value="${Math.floor(mins / 60)}" aria-label="Stunden"><span class="dim">h</span>
          <input class="input" id="wmM" inputmode="numeric" value="${mins % 60}" aria-label="Minuten"><span class="dim">min</span></div></div>
        <label class="field full"><span>Körpergewicht (${unit()})</span><input class="input" id="wmBw" inputmode="decimal" value="${inputW(wo.bodyWeightKg)}" placeholder="optional"></label>
        <label class="field full"><span>Notiz</span><textarea class="textarea" id="wmNotes" style="min-height:70px" placeholder="Wie lief's?">${esc(wo.notes || '')}</textarea></label>
      </div>`,
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">${icon('check')} Speichern</button>`
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'cancel') return m.close();
    if (b.dataset.x !== 'save') return;
    const v = sel => $(sel, m.el).value.trim();
    const date = v('#wmDate');
    if (!isISO(date) || date > isoDate()) return toast('Bitte ein gültiges Datum wählen', 'warn');
    const durSec = Math.round(((parseNum(v('#wmH')) || 0) * 60 + (parseNum(v('#wmM')) || 0)) * 60);
    if (durSec <= 0 || durSec > 24 * 3600) return toast('Bitte eine Dauer zwischen 1 Minute und 24 Stunden eintragen', 'warn');
    const start = parseISO(date);
    const tm = v('#wmTime').match(/^(\d{1,2}):(\d{2})/);
    if (tm) start.setHours(+tm[1], +tm[2], 0, 0);
    else if (st) start.setHours(st.getHours(), st.getMinutes(), 0, 0);
    else start.setHours(12, 0, 0, 0);
    const bw = parseNum(v('#wmBw'));
    const name = v('#wmName') || wo.name || 'Workout';
    const patch = {
      date, startedAt: start.getTime(), endedAt: start.getTime() + durSec * 1000, durationSec: durSec, durationEstimated: false,
      name, notes: $('#wmNotes', m.el).value.trim(), bodyWeightKg: bw ? round(fromU(bw), 2) : null, updatedAt: Date.now()
    };
    if (wo.planDayName) patch.planDayName = name;
    Store.put('workouts', id, patch);
    m.close();
    toast('Workout aktualisiert', 'success');
    if (onSaved) onSaved();
  });
}
function workoutText(wo) {
  const lines = [`${wo.planDayName || wo.name || 'Workout'} – ${fmtDate(wo.date)}`, `Dauer: ${fmtDur(wo.durationSec)}`];
  let ton = 0;
  for (const en of wo.entries || []) {
    const done = (en.sets || []).filter(s => s.done !== false && !s.warmup);
    if (!done.length) continue;
    ton += sum(done.map(setVol));
    if (Ex.type(Ex.get(en.exerciseId)) === 'cardio') { lines.push(`• ${Ex.entryName(en)}: ${cardioTxt(cardioTotals(done), cardioInfo(Ex.get(en.exerciseId)))}`); continue; }
    const isSec = Ex.type(Ex.get(en.exerciseId)) === 'sec';
    lines.push(`• ${Ex.entryName(en)}${en.uni ? ' (L/R)' : ''}: ${done.map(s => isSec ? secTxt(s) : (s.weightKg ? `${wNum(s.weightKg)}×${repsTxt(s)}` : repsTxt(s))).join(', ')}`);
  }
  if (ton) lines.splice(2, 0, `Volumen: ${fmtTon(ton)}`);
  lines.push('', `– getrackt mit ${APP.name}`);
  return lines.join('\n');
}
/* ---------- Teilen: Story-Bild (9:16) im eigenen Theme, Text als Alternative ---------- */
async function shareWorkout(wo) {
  let file = null, url = null;
  const canFiles = f => { try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] })); } catch (e) { return false; } };
  const m = Modal.open({
    title: 'Workout teilen', size: 'sm', cls: 'share-modal',
    body: `<div class="share-prev"><span class="share-load" aria-label="Bild wird erstellt"></span></div>
      <p class="tiny faint center mt-8">Story-Format 9:16 · Design „${esc(designOf(S().design).name)}“</p>`,
    foot: `<button class="btn btn-secondary" data-x="text">${icon('copy')} Als Text</button>
      <button class="btn btn-primary" data-x="img" disabled>${icon('share')} Bild teilen</button>`,
    onClose: () => { if (url) URL.revokeObjectURL(url); }
  });
  try {
    const blob = await shareImage(wo);
    file = new File([blob], `trainio-${wo.date || 'workout'}.png`, { type: 'image/png' });
    url = URL.createObjectURL(blob);
    $('.share-prev', m.el).innerHTML = `<img src="${url}" alt="Vorschau: Teilen-Bild des Workouts">`;
    const b = $('[data-x="img"]', m.el);
    b.disabled = false;
    if (!canFiles(file)) b.innerHTML = `${icon('download')} Bild speichern`;
  } catch (e) {
    console.warn('Teilen-Bild', e);
    $('.share-prev', m.el).innerHTML = `<p class="small dim center" style="padding:16px">Bild konnte nicht erstellt werden – teile das Workout als Text.</p>`;
  }
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'text') return shareText(wo);
    if (!file) return;
    try {
      if (canFiles(file)) { await navigator.share({ files: [file], title: `${wo.planDayName || wo.name || 'Workout'} · ${APP.name}` }); return; }
      const a = document.createElement('a');
      a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      toast('Bild gespeichert', 'success', { cat: 'always' });
    } catch (err) { if (err.name !== 'AbortError') toast('Teilen nicht möglich', 'error'); }
  });
}
async function shareText(wo) {
  const text = workoutText(wo);
  try {
    if (navigator.share) { await navigator.share({ title: APP.name, text }); return; }
    await navigator.clipboard.writeText(text);
    toast('In die Zwischenablage kopiert', 'success', { cat: 'always' });
  } catch (e) { if (e.name !== 'AbortError') toast('Teilen nicht möglich', 'error'); }
}
/** Beste Leistung einer Übung für das Bild („80 kg × 8“, „1:30“, „30:00 · 5,2 km“) */
function shareBest(en) {
  const ex = Ex.get(en.exerciseId), t = Ex.type(ex);
  const done = (en.sets || []).filter(s => s.done !== false && !s.warmup);
  if (!done.length) return null;
  const top = f => done.reduce((a, b) => f(b) > f(a) ? b : a);
  const n = `${done.length} ${done.length === 1 ? 'Satz' : 'Sätze'}`;
  if (t === 'cardio') return { best: cardioTxt(cardioTotals(done), cardioInfo(ex)), sub: 'Cardio' };
  if (t === 'sec') return { best: secTxt(top(s => +s.durationSec || 0)), sub: n };
  if (t === 'reps') { const b = top(repsOf); return { best: `${repsTxt(b)} Wdh.${b.weightKg ? ' · +' + fmtW(b.weightKg) : ''}`, sub: n }; }
  const b = top(s => e1rm(s.weightKg, repsOf(s)) || +s.weightKg || 0);
  return { best: b.weightKg ? `${wNum(b.weightKg)} ${unit()} × ${repsTxt(b)}` : `${repsTxt(b)} Wdh.`, sub: n };
}
/** Story-Bild 1080×1920 zeichnen – Farben, Schriften & Eigenheiten des aktuellen Designs → PNG-Blob */
async function shareImage(wo) {
  const W = 1080, H = 1920, P = 80, root = document.documentElement, cs = getComputedStyle(root);
  const v = k => cs.getPropertyValue(k).trim();
  const design = root.dataset.design, dark = root.dataset.theme === 'dark';
  const C = { bg: v('--bg'), surf: v('--surface'), surf3: v('--surface-3'), border: v('--border'), text: v('--text'), dim: v('--text-dim'), faint: v('--text-faint'), accent: v('--accent'), acc: v('--accent-text'), gold: v('--gold-text') || '#f6bb2a' };
  const FN = { body: v('--font') || 'system-ui, sans-serif', disp: v('--font-display') || v('--font') || 'system-ui, sans-serif', num: v('--font-num') || v('--font') || 'system-ui, sans-serif' };
  const fwx = v('--fw-x') || '700', upper = v('--title-transform') === 'uppercase', rs = parseFloat(v('--rs')) || 1;
  // Web-Schriften des Designs (Barlow, Titillium, Newsreader) vor dem Zeichnen laden
  await Promise.race([Promise.all(['400', '600', fwx].flatMap(w => [FN.body, FN.disp, FN.num].map(f => document.fonts.load(`${w} 60px ${f}`).catch(() => {})))), new Promise(r => setTimeout(r, 1500))]);
  const logo = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = iconSrc('icon-192.png'); });
  const id = wo.id, row = Analytics.cur().rows.find(r => r.id === id);
  const sc = id && F('f_score') ? Analytics.score(id) : null;
  const prIds = new Set(id ? Analytics.cur().prEvents.filter(p => p.wid === id).map(p => p.exId) : []);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const withA = (col, a) => { const m = /^rgba?\(([^)]+)\)/.exec(col); if (m) { const [r, g, b] = m[1].split(',').map(n => parseFloat(n)); return `rgba(${r},${g},${b},${a})`; } if (Color.valid(col)) { const [r, g, b] = Color.rgb(col); return `rgba(${r},${g},${b},${a})`; } return col; };
  const glow = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, withA(col, a)); g.addColorStop(1, withA(col, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const rr = (X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else { x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); } };
  const font = (w, px, fam) => { x.font = `${w} ${px}px ${fam}`; };
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; };
  const shrink = (t, w, px, fam, max, min = 26) => { for (; px > min; px -= 2) { font(w, px, fam); if (x.measureText(t).width <= max) return; } };
  const spacing = s => { if ('letterSpacing' in x) x.letterSpacing = s; };
  const trophy = (X, Y, size, col) => {
    x.save(); x.translate(X, Y); x.scale(size / 24, size / 24);
    x.strokeStyle = col; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    (ICONS.trophy.match(/d="([^"]+)"/g) || []).forEach(d => x.stroke(new Path2D(d.slice(3, -1))));
    x.restore();
  };

  // Hintergrund: Design-Farbe mit weichem Licht – Glass mit Aurora, Carbon mit Karbon-Muster, Paper mit Körnung
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  if (design === 'glass') {
    (dark ? [[80, 120, 900, '#3a60ff', .38], [1040, 260, 760, '#a840c8', .26], [960, 1780, 900, '#10a0aa', .26], [40, 1860, 900, '#6440f0', .28]]
      : [[80, 120, 900, '#76b0ff', .55], [1040, 260, 760, '#ffa0cd', .5], [960, 1780, 900, '#96e8d0', .5], [40, 1860, 900, '#c4acff', .55]]).forEach(([cx, cy, r, col, a]) => glow(cx, cy, r, col, a));
  } else {
    glow(W * .12, H * .06, 980, C.accent, dark ? .2 : .1);
    glow(W * .95, H * .92, 1100, C.accent, dark ? .13 : .07);
  }
  if (design === 'carbon') {
    const pc = document.createElement('canvas'); pc.width = pc.height = 14;
    const p = pc.getContext('2d'); p.fillStyle = dark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)';
    p.fillRect(0, 0, 7, 7); p.fillRect(7, 7, 7, 7);
    x.fillStyle = x.createPattern(pc, 'repeat'); x.fillRect(0, 0, W, H);
  }
  if (design === 'paper') {
    x.fillStyle = dark ? 'rgba(255,240,220,.035)' : 'rgba(90,70,40,.05)';
    for (let i = 0; i < 9000; i++) x.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  // Kopf: Logo, App-Name, Datum
  x.textBaseline = 'alphabetic';
  if (logo) { x.save(); rr(P, 84, 76, 76, 18); x.clip(); x.drawImage(logo, P, 84, 76, 76); x.restore(); }
  font(fwx, 40, FN.disp); x.fillStyle = C.text; x.textAlign = 'left';
  x.fillText(upper ? APP.name.toUpperCase() : APP.name, P + 96, 136);
  font('600', 32, FN.body); x.fillStyle = C.dim; x.textAlign = 'right';
  x.fillText(parseISO(wo.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), W - P, 134);

  // Titel (max. 2 Zeilen) und Datum mit Uhrzeit
  let y = 290;
  const title = (wo.planDayName || wo.name || 'Workout');
  font(fwx, 92, FN.disp); x.fillStyle = C.text; x.textAlign = 'left';
  const words = (upper ? title.toUpperCase() : title).split(/\s+/), lines = [];
  for (const wd of words) { const l = lines.length ? lines[lines.length - 1] + ' ' + wd : wd; if (lines.length && x.measureText(l).width <= W - 2 * P) lines[lines.length - 1] = l; else lines.push(wd); }
  if (lines.length > 2) lines.splice(1, lines.length, lines.slice(1).join(' '));
  lines.forEach((l, i) => { x.fillText(fit(l, W - 2 * P), P, y + i * 100); });
  y += (lines.length - 1) * 100 + 62;
  font('500', 36, FN.body); x.fillStyle = C.dim;
  x.fillText(fmtDateLong(wo.date) + (wo.startedAt ? ' · ' + new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ''), P, y);
  y += 40;

  // Platz vorab planen: passen alle Übungen, wird übriger Raum gleichmäßig auf die Abstände verteilt
  const items = (wo.entries || []).map(en => ({ en, b: shareBest(en) })).filter(i => i.b);
  const dense = items.length > 5;   // viele Übungen: alles etwas kompakter
  const gap = 20, tw = (W - 2 * P - gap * 3) / 4, th = dense ? 140 : 164, tr = Math.round(26 * rs);
  const foot = H - 150, rowH = dense ? 84 : 90, pad = 34, headH = 62, rTop = dense ? 40 : 60, rBot = dense ? 50 : 70;
  // Ring wird kleiner, damit bis zu 8 Übungen Platz haben
  const want = items.length ? pad * 2 + headH + Math.min(8, items.length) * rowH : 0;
  const R = clamp(Math.floor((foot - 30 - y - th - 40 - want - rTop - rBot) / 2), 110, 170);
  const listY0 = y + (sc ? rTop + 2 * R + rBot : 40) + th + 40;
  const fitRows = Math.max(1, Math.min(8, Math.floor((foot - 30 - listY0 - pad * 2 - headH) / rowH)));
  const shown = items.length > fitRows ? items.slice(0, fitRows - 1) : items, more = items.length - shown.length;
  const listH = items.length ? pad * 2 + headH + (shown.length + (more ? 1 : 0)) * rowH : 0;
  const extra = Math.max(0, Math.min(110, (foot - 30 - listY0 - listH) / 4));
  y += extra;

  // Score-Ring (bei 100 in Gold)
  if (sc) {
    const cx = W / 2, cy = y + rTop + R, perfect = sc.score >= 100, k = R / 170;
    x.lineCap = 'round'; x.lineWidth = Math.round(32 * Math.max(.8, k));
    x.strokeStyle = C.surf3; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    let arcCol = C.accent;
    if (perfect) { const g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#ffe9a8'); g.addColorStop(.45, '#f6bb2a'); g.addColorStop(1, '#d38800'); arcCol = g; }
    x.save(); x.shadowColor = withA(perfect ? '#f6bb2a' : C.accent, .55); x.shadowBlur = 34;
    x.strokeStyle = arcCol; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.005, sc.score / 100)); x.stroke(); x.restore();
    x.textAlign = 'center'; x.fillStyle = perfect ? C.gold : C.text;
    font(fwx, Math.round(150 * k), FN.num); x.fillText(String(sc.score), cx, cy + 54 * k);
    y = cy + R + rBot;
  } else y += 40;
  y += extra;

  // Kennzahlen
  const cardio = row && row.cardioOnly;
  const tiles = cardio
    ? [['Dauer', fmtDur(wo.durationSec)], ['Cardio', fmtDur(row.cSec)], ['Distanz', row.cKm ? fmtKm(row.cKm) : '–'], ['Übungen', String((wo.entries || []).length)]]
    : [['Dauer', fmtDur(wo.durationSec)], ['Volumen', fmtTon(row ? row.ton : 0)], ['Sätze', String(row ? row.sets : 0)],
       F('f_prs') ? ['PRs', String(prIds.size)] : ['Ø RPE', row && row.avgRpe ? nf(row.avgRpe, 1) : '–']];
  tiles.forEach(([l, val], i) => {
    const tx = P + i * (tw + gap);
    rr(tx, y, tw, th, tr); x.fillStyle = C.surf; x.fill();
    if (design !== 'pure' && design !== 'glass') { x.lineWidth = 2; x.strokeStyle = C.border; x.stroke(); }
    if (design === 'iron') { x.fillStyle = C.accent; x.fillRect(tx, y, tw, 5); }
    x.textAlign = 'left'; font('600', 27, FN.body); x.fillStyle = C.dim; x.fillText(upper ? l.toUpperCase() : l, tx + 24, y + th * .32);
    x.fillStyle = l === 'PRs' && +val > 0 ? C.acc : C.text; shrink(val, fwx, 50, FN.num, tw - 44); x.fillText(val, tx + 24, y + th * .76);
  });
  y += th + 40 + extra;

  // Übungen: bester Satz je Übung, PRs mit Pokal; was nicht passt → „+ N weitere“
  if (items.length) {
    rr(P, y, W - 2 * P, listH, Math.round(32 * rs)); x.fillStyle = C.surf; x.fill();
    if (design !== 'pure' && design !== 'glass') { x.lineWidth = 2; x.strokeStyle = C.border; x.stroke(); }
    let ry = y + pad;
    x.textAlign = 'left'; font('700', 27, FN.body); spacing('4px'); x.fillStyle = C.faint;
    x.fillText('ÜBUNGEN', P + 36, ry + 34); spacing('0px');
    x.textAlign = 'right'; font('600', 27, FN.body); x.fillText(`${items.length} ${items.length === 1 ? 'Übung' : 'Übungen'}`, W - P - 36, ry + 34);
    ry += headH;
    shown.forEach(({ en, b }, i) => {
      if (i) { x.fillStyle = C.border; x.fillRect(P + 36, ry, W - 2 * P - 72, 2); }
      const pr = prIds.has(en.exerciseId);
      x.textAlign = 'right'; font(fwx, 38, FN.num); const bw = Math.min(x.measureText(b.best).width, 420);
      x.fillStyle = pr ? C.acc : C.text; x.fillText(fit(b.best, 420), W - P - 36, ry + rowH * .62);
      if (pr) trophy(W - P - 36 - bw - 50, ry + rowH * .62 - 32, 36, C.acc);
      x.textAlign = 'left'; font('600', 38, FN.body); x.fillStyle = C.text;
      x.fillText(fit(Ex.entryName(en), W - 2 * P - 72 - bw - (pr ? 72 : 30)), P + 36, ry + rowH * .49);
      font('500', 27, FN.body); x.fillStyle = C.dim; x.fillText(b.sub, P + 36, ry + rowH * .87);
      ry += rowH;
    });
    if (more) { x.fillStyle = C.border; x.fillRect(P + 36, ry, W - 2 * P - 72, 2); x.textAlign = 'left'; font('600', 32, FN.body); x.fillStyle = C.dim; x.fillText(`+ ${more} weitere ${more === 1 ? 'Übung' : 'Übungen'}`, P + 36, ry + rowH * .62); }
  }

  // Fuß: „getrackt mit Trainio“
  x.textAlign = 'center'; font('600', 30, FN.body); x.fillStyle = C.faint;
  x.fillText(`getrackt mit ${APP.name}`, W / 2, H - 82);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/png'));
}
