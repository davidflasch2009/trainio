/* Trainio – Training-Tab: Workouts, Trainingsplan, Plan-Analyse
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   9. View: Training (Pläne, Verlauf, aktives Workout)
   ========================================================================== */
Views.training = {
  leave() { historyMonths = 1; },
  render(el) {
    const w = Workout.cur();
    if (w || UI.trainSub !== 'history') historyMonths = 1;
    if (w) return renderActiveWorkout(el, w);
    el.innerHTML = `
      ${tabsHtml([['plans', 'Pläne'], ['history', 'Verlauf']], UI.trainSub === 'history' ? 'history' : 'plans', 'trainSub', 'trainBody', 'Training', 'seg mb-12')}
      <div id="trainBody" ${tabPanelAttrs('trainBody', UI.trainSub === 'history' ? 'history' : 'plans')}></div>`;
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
        <b class="ellipsis" style="display:block">${esc(p.name)}</b>
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
        <p class="small dim mt-8">ca. ${planDayMinutes(t)} min${days.length ? ` · <span class="accent bold">${days.join(', ')}</span>` : ''}</p>
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
    withUndo(`„${t.name}" gelöscht`, { docs: [['templates', t.id], ...inPlans.map(p => ['plans', p.id])], run: () => {
      inPlans.forEach(p => Store.put('plans', p.id, { ...p, schedule: p.schedule.map(id => id === t.id ? null : id), updatedAt: Date.now() }, { replace: true }));
      Store.del('templates', t.id);
    } });
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
    withUndo(`Plan „${p.name}" gelöscht`, { docs: [['plans', p.id]], settings: ['activePlanId'], run: () => {
      Store.del('plans', p.id);
      if (S().activePlanId === p.id) Store.saveSettings({ activePlanId: (Store.all('plans').find(isSchedule) || {}).id || '' });
    } });
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
  const head = (k, l, extra = '', info = '') => `<div class="row between"><b>${l}${info ? infoBtn(info) : ''}</b><span class="row" style="gap:8px">${extra}${paMark(c[k].ok)}</span></div>`;
  const tip = k => c[k].tip ? `<p class="small pa-tip mt-8">${icon('info')} ${c[k].tip}</p>` : c[k].text ? `<p class="small dim mt-8">${c[k].text}</p>` : '';
  const freqChips = MUSCLES.filter(m => a.freq[m] || PLAN_MAJOR.includes(m)).sort((x, y) => a.freq[y] - a.freq[x])
    .map(m => `<span class="pa-chip ${a.freq[m] >= 2 ? 'ok' : a.freq[m] ? 'low' : 'none'}">${esc(m)} <b>${a.freq[m]}×</b></span>`).join('');
  Modal.open({ title: `Analyse: ${(plan && plan.name) || 'Trainingsplan'}`, size: 'lg', info: 'Grundlage sind die geplanten Arbeitssätze deiner Workouts (ohne Cardio). Hilfsmuskeln zählen für Frequenz und Erholung nicht mit.',
    body: !a.days.length ? emptyState('calendar', 'Noch keine Trainingstage', 'Weise den Wochentagen Workouts zu, dann kann der Plan analysiert werden.') : `
      <div class="week-plan">${(plan.schedule || []).map((id, i) => { const t = Tpl.get(id); return `<div class="wp-day ${t ? 'has' : ''}"><span>${WD_KURZ[i]}</span><b>${t ? esc(t.name) : '–'}</b></div>`; }).join('')}</div>
      <p class="small dim mt-12">${a.sets} Sätze · ca. ${nf(a.min / 60, 1)} h pro Woche</p>

      <div class="section-head"><h4>Balance</h4></div>
      <div class="card">
        ${head('pp', 'Push / Pull', c.pp.val != null ? `<span class="pa-val">${nf(c.pp.val, 2)}</span>` : '', 'Pull-Sätze geteilt durch Push-Sätze pro Woche. Ausgewogen ist 0,8–1,2 (grüner Bereich).')}
        <div class="small dim">${a.pull} Pull-Sätze / ${a.push} Push-Sätze pro Woche</div>
        ${c.pp.val != null ? paGauge(c.pp.val, 0.8, 1.2, 2, c.pp.ok) : ''}${tip('pp')}
      </div>
      <div class="card mt-12">
        ${head('lu', 'Beine / Oberkörper', c.lu.val != null ? `<span class="pa-val">${nf(c.lu.val, 2)}</span>` : '', 'Bein-Sätze geteilt durch Oberkörper-Sätze (Push + Pull) pro Woche. Ausgewogen ist 0,4–0,8 (grüner Bereich).')}
        <div class="small dim">${a.legs} Bein-Sätze / ${a.push + a.pull} Oberkörper-Sätze pro Woche</div>
        ${c.lu.val != null ? paGauge(c.lu.val, 0.4, 0.8, 1.5, c.lu.ok) : ''}${tip('lu')}
      </div>

      <div class="section-head"><h4>Frequenz & Erholung</h4></div>
      <div class="card">
        ${head('freq', 'Frequenz', '', 'An wie vielen Tagen pro Woche ein Muskel direkt (als Hauptmuskel) trainiert wird – ideal 2×.')}
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
      </div>` });
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
