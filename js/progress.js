/* Trainio – Fortschritt-Tab: Rahmen, Zeitraum, Phasen und Wochenziel, Übersicht, Meilensteine
   Die einzelnen Bereiche stehen in progress-strength.js, progress-muscles.js, progress-cardio.js und progress-body.js.
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   14. View: Fortschritt (Analytics-Zentrale)
   ========================================================================== */
const PERIODS = [['4w', '4 Wochen'], ['3m', '3 Monate'], ['6m', '6 Monate'], ['1y', '1 Jahr'], ['all', 'Alles'], ['custom', 'Eigener Zeitraum']];
/* ---------- Funktionen ein-/ausschalten ---------- */
const FEATURES = [
  ['Navigation', [['f_exercises', 'Übungen-Tab', 'Bibliothek als eigener Tab (Übungen bleiben im Workout wählbar)'], ['f_progress', 'Fortschritt-Tab', 'Statistiken & Diagramme']]],
  ['Fortschritt', [['f_score', 'Workout-Score', 'Ring beim Abschluss, im Workout-Detail und im Fortschritt'], ['f_strength', 'Kraft-Auswertungen'], ['f_volume', 'Volumen-Auswertungen'], ['f_muscles', 'Muskel-Auswertungen & Body-Heatmap'], ['f_cardio', 'Cardio-Auswertungen'], ['f_heart', 'Herz & Ausdauer', 'Ruhepuls, VO2max, Pulszonen, Intensität, Intervall-Timer & Herz-Plan'], ['f_body', 'Körper-Tab (Gewicht)'], ['f_moreStats', '„Mehr Stats" in der Übersicht'], ['f_badges', 'Meilensteine']]],
  ['Körper-Tab', [['f_bodyFat', 'Körperfett & fettfreie Masse'], ['f_measures', 'Umfänge & Verhältnisse', 'Brust, Taille, Arm … in cm'], ['f_photos', 'Fortschrittsfotos']]],
  ['Workout', [['f_warmup', 'Aufwärmsätze-Button'], ['f_plates', 'Scheibenrechner'], ['f_suggest', 'Progressions-Vorschläge', '„Ziel: mehr Wdh. bei …" & automatische Steigerung'], ['f_prs', 'PR-Erkennung & Feiern', 'Markierungen, Toasts, Konfetti'], ['f_setTypes', 'Satz-Typen', 'Drop-Satz & bis Muskelversagen'], ['f_focus', 'Fokus-Modus'], ['f_woExtras', 'Körpergewicht, Datum & Notizen im Workout']]],
  ['Daten & Tools', [['f_arrow', 'Arrow-Import'], ['f_tools', 'Tools: Scheiben- & 1RM-Rechner']]]
];
const F = k => S()[k] !== false;
// eigene Seite im Mehr-Tab (Tabs & Funktionen)
Actions.openFeatures = () => openMoreSub('features');
const PROG_SUBS = [['overview', 'Übersicht'], ['strength', 'Kraft'], ['volume', 'Volumen'], ['muscles', 'Muskeln'], ['cardio', 'Cardio'], ['body', 'Körper']];
const progSubs = () => PROG_SUBS.filter(([k]) => k === 'overview' || F('f_' + k) || (k === 'cardio' && F('f_heart'))).map(([k, l]) => [k, k === 'cardio' && F('f_heart') ? (F('f_cardio') ? 'Herz & Cardio' : 'Herz') : l]);
Views.progress = {
  render(el) {
    if (!progSubs().some(x => x[0] === UI.progSub)) UI.progSub = 'overview';
    if (UI.progSub !== 'body') bodyHistoryMonths = 1;
    const r = Analytics.range();
    const periodKey = r.all ? 'all' : UI.period;
    const label = r.phase ? `${r.phase.name} · ${phaseDates(r.phase)}`
      : r.custom ? rangeLabel(r) : PERIODS.find(([key]) => key === periodKey)[1];
    el.innerHTML = `
      <div class="prog-controls">
        ${tabsHtml(progSubs(), UI.progSub, 'progSub', 'progBody', 'Fortschritt', 'prog-tabs')}
        <button type="button" class="prog-period" data-act="choosePeriod" aria-haspopup="dialog">
          <span class="dim">Zeitraum</span>
          ${r.phase ? `<i aria-hidden="true" style="background:${PHASE_TYPES[r.phase.type]?.[1] || 'var(--accent)'}"></i>` : ''}
          <span class="prog-period-value">${esc(label)}</span>${icon('chevD')}
        </button>
      </div>
      <div id="progBody" ${tabPanelAttrs('progBody', UI.progSub)}></div>`;
    updateTopH();
    const tabs = $('.prog-tabs', el), active = $('.active', tabs);
    if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = active.offsetLeft + (active.offsetWidth - tabs.clientWidth) / 2;
    const body = $('#progBody', el);
    // Körper und Herz gehen auch ohne Workouts (Gewicht, Ruhepuls)
    if (!Analytics.cur().rows.length && UI.progSub !== 'body' && !(UI.progSub === 'cardio' && F('f_heart'))) {
      body.innerHTML = `<div class="card mt-16">${emptyState('chart', 'Noch keine Trainingsdaten', 'Sobald du Workouts trackst oder deine Arrow-History importierst, entstehen hier über 40 Auswertungen.', F('f_arrow') ? `<button class="btn btn-secondary" data-act="openArrow">${icon('upload')} Arrow-Import</button>` : '')}</div>`;
      return;
    }
    ProgressViews[progSubs().some(x => x[0] === UI.progSub) ? UI.progSub : 'overview'](body);
  }
};
/** Standard-Zeitraum aus den Einstellungen – null = zuletzt gewählter bleibt; gelöschte Phase → Alles */
function defaultPeriod() {
  const v = String(S().progPeriod || 'last');
  if (v.startsWith('ph:')) return phaseById(v.slice(3)) ? v : 'all';
  return PERIODS.some(([k]) => k === v && k !== 'custom') ? v : null;
}
function applyDefaultPeriod() {
  const v = defaultPeriod();
  if (v && UI.period !== v) { UI.period = v; saveUI(); }
}
Views.progress.leave = () => { bodyHistoryMonths = 1; applyDefaultPeriod(); };   // beim nächsten Öffnen wieder Standard-Zeitraum und aktueller Monat
Actions.progSub = el => { UI.progSub = el.dataset.v; saveUI(); App.renderCurrent(); };
const phaseDates = ph => ph.to ? `${fmtDate(ph.from)} – ${fmtDate(ph.to)}` : `seit ${fmtDate(ph.from)}`;
Actions.choosePeriod = async () => {
  const r = Analytics.range(), current = r.all ? 'all' : UI.period;
  const options = PERIODS.map(([key, label]) => ({
    key, label, icon: key === current ? 'check' : 'calendar',
    sub: key === current ? (r.custom ? rangeLabel(r) : 'Ausgewählt') : ''
  }));
  for (const ph of phases()) {
    const key = 'ph:' + ph.id;
    const type = PHASE_TYPES[ph.type]?.[0] || 'Phase';
    const sub = key === current ? `Ausgewählt · ${type} · ${phaseDates(ph)} · ${Math.round(r.len / 7)} Wochen` : `${type} · ${phaseDates(ph)}`;
    options.push({ key, label: ph.name, sub, icon: key === current ? 'check' : 'calendar' });
  }
  if (r.phase) options.push({ key: 'edit', label: 'Phase bearbeiten', sub: r.phase.name, icon: 'edit' });
  options.push({ key: 'new', label: 'Phase anlegen', icon: 'plus' });
  const v = await actionMenu('Zeitraum wählen', options);
  if (!v) return;
  if (v === 'new' || v === 'edit') return Actions.phaseEdit({ dataset: { id: v === 'edit' ? r.phase.id : '' } });

  if (v === 'custom') {
    const t = isoDate();
    const from = UI.customFrom || dnToISO(todayDN() - 60);
    const m = Modal.open({
      title: 'Eigener Zeitraum', size: 'sm',
      body: `<div class="form-grid"><label class="field"><span>Von</span><input class="input" type="date" id="cfFrom" value="${from}" max="${t}"></label><label class="field"><span>Bis</span><input class="input" type="date" id="cfTo" value="${UI.customTo || t}" max="${t}"></label></div>`,
      foot: `<button class="btn btn-secondary" data-x="c">Abbrechen</button><button class="btn btn-primary" data-x="ok">Anwenden</button>`
    });
    m.el.addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'ok') {
        const f = $('#cfFrom', m.el).value, to = $('#cfTo', m.el).value;
        if (!isISO(f) || !isISO(to)) return toast('Bitte gültige Daten wählen', 'warn');
        Object.assign(UI, { period: 'custom', customFrom: f, customTo: to });
        saveUI();
        App.renderCurrent();
      }
      m.close();
    });
    return;
  }
  UI.period = v;
  saveUI();
  App.renderCurrent();
};

/* ---------- Phasen: benannte Zeiträume (Bulk, Cut, Erhalt …) ---------- */
const PHASE_TYPES = { bulk: ['Bulk', '#22c55e'], cut: ['Cut', '#f97316'], maintain: ['Erhalt', '#3b82f6'], other: ['Sonstiges', '#a855f7'] };
const phases = () => (S().phases || []).slice().sort((a, b) => b.from.localeCompare(a.from));
const phaseById = id => (S().phases || []).find(p => p.id === id) || null;
/* ---------- Wochenziel fürs Gewicht: erlaubte Veränderung pro Woche (kg), je Phase oder allgemein ---------- */
const RATE_DEFAULTS = { bulk: [0, 0.2], cut: [-0.5, -0.25], maintain: [-0.2, 0.2], other: null };
const RATE_GOALS = [['bulk', 'Zunehmen'], ['cut', 'Abnehmen'], ['maintain', 'Halten']];
const rateUnit = () => unit() === 'kg' ? 'g' : 'lb';
const rateToInput = kg => kg == null ? '' : unit() === 'kg' ? String(Math.round(kg * 1000)) : String(round(toU(kg), 2)).replace('.', ',');
const rateFromInput = v => { const n = parseNum(String(v || '').replace(/[−–]/g, '-')); return n == null ? null : round(unit() === 'kg' ? n / 1000 : fromU(n), 4); };
const fmtRate = kg => (kg > 0.0005 ? '+' : kg < -0.0005 ? '−' : '') + (unit() === 'kg' ? nf(Math.abs(kg) * 1000, 0) + ' g' : nf(Math.abs(toU(kg)), 2) + ' lb');
const rateText = (lo, hi) => `${fmtRate(lo)} bis ${fmtRate(hi)}`;
/** Gültiger Bereich für die Woche ab ws: Phase mit Bereich (die zuletzt gestartete), sonst die allgemeine Einstellung */
function rateRuleAt(ws) {
  const ph = phases().find(p => p.rateMin != null && p.rateMax != null && dayNum(p.from) <= ws + 6 && (!p.to || dayNum(p.to) >= ws));
  if (ph) return { lo: ph.rateMin, hi: ph.rateMax, phase: ph };
  const g = S().bwRate;
  return g && g.min != null && g.max != null ? { lo: g.min, hi: g.max, phase: null, type: g.type } : null;
}
/** Zwei Eingabefelder „von / bis" für den Wochen-Bereich */
const rateFields = (lo, hi, ph = ['', ''], short = false) => `<div class="form-grid">
    <label class="field"><span>von (${rateUnit()}${short ? '' : ' pro Woche'})</span><input class="input" id="rtMin" value="${esc(rateToInput(lo))}" placeholder="${esc(ph[0])}" autocomplete="off" enterkeyhint="next"></label>
    <label class="field"><span>bis (${rateUnit()}${short ? '' : ' pro Woche'})</span><input class="input" id="rtMax" value="${esc(rateToInput(hi))}" placeholder="${esc(ph[1])}" autocomplete="off" enterkeyhint="done"></label>
  </div>`;
/** Liest „von / bis"; null = kein Bereich, false = ungültig (Hinweis wurde gezeigt) */
function readRate(root) {
  const a = $('#rtMin', root).value.trim(), b = $('#rtMax', root).value.trim();
  if (!a && !b) return null;
  const lo = rateFromInput(a), hi = rateFromInput(b);
  if (lo == null || hi == null) { toast('Bitte beide Grenzen angeben – oder beide leer lassen', 'warn'); return false; }
  return lo <= hi ? [lo, hi] : [hi, lo];
}
/** Vorschlag je Ziel in die Felder schreiben, solange sie leer sind oder noch den alten Vorschlag enthalten */
function applyRateDefault(root, prevType, type) {
  const mi = $('#rtMin', root), ma = $('#rtMax', root), pd = RATE_DEFAULTS[prevType], nd = RATE_DEFAULTS[type];
  const untouched = (!mi.value && !ma.value) || (pd && mi.value === rateToInput(pd[0]) && ma.value === rateToInput(pd[1]));
  if (untouched) { mi.value = nd ? rateToInput(nd[0]) : ''; ma.value = nd ? rateToInput(nd[1]) : ''; }
}
Actions.phaseEdit = el => {
  const old = el.dataset.id ? phaseById(el.dataset.id) : null;
  const d = old ? { ...old } : { id: autoId().slice(0, 8), name: '', type: 'bulk', from: dnToISO(todayDN() - 30), to: '', rateMin: RATE_DEFAULTS.bulk[0], rateMax: RATE_DEFAULTS.bulk[1] };
  const sug = RATE_DEFAULTS[d.type] || ['', ''];
  const m = Modal.open({
    title: old ? 'Phase bearbeiten' : 'Neue Phase', size: 'sm',
    info: 'Die Phase erscheint im Fortschritt als eigener Zeitraum – alle Auswertungen gelten dann nur für diese Zeit. Gewicht pro Woche: erlaubte Veränderung des Wochendurchschnitts, z. B. Bulk 0 bis +200 g. Im Körper-Tab sind Wochen in diesem Bereich grün, darüber oder darunter orange. Leer lassen = kein Ziel.',
    body: `<div class="stack">
      <div class="seg" id="phType">${Object.entries(PHASE_TYPES).map(([k, [l]]) => `<button data-t="${k}" class="${d.type === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <label class="field"><span>Name</span><input class="input" id="phName" value="${esc(d.name)}" placeholder="z. B. Bulk 2026" autocomplete="off"></label>
      <div class="form-grid">
        <label class="field"><span>Start</span><input class="input" type="date" id="phFrom" value="${esc(d.from)}"></label>
        <label class="field"><span>Ende (leer = läuft noch)</span><input class="input" type="date" id="phTo" value="${esc(d.to || '')}"></label>
      </div>
      <div><div class="bold small mb-8">Gewicht pro Woche (optional)</div>
        ${rateFields(d.rateMin, d.rateMax, [rateToInput(sug[0]), rateToInput(sug[1])], true)}</div>
    </div>`,
    foot: `${old ? `<button class="btn btn-danger-ghost" data-x="del" style="flex:0 0 auto" aria-label="Löschen">${icon('trash')}</button>` : ''}<button class="btn btn-secondary" data-x="c">Abbrechen</button><button class="btn btn-primary" data-x="ok">Speichern</button>`
  });
  m.el.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]');
    if (t) { applyRateDefault(m.el, d.type, t.dataset.t); d.type = t.dataset.t; $$('#phType button', m.el).forEach(b => b.classList.toggle('active', b === t)); if (!$('#phName', m.el).value.trim() || Object.values(PHASE_TYPES).some(([l]) => $('#phName', m.el).value.startsWith(l))) $('#phName', m.el).value = `${PHASE_TYPES[d.type][0]} ${new Date().getFullYear()}`; return; }
    const b = e.target.closest('[data-x]'); if (!b) return;
    const list = (S().phases || []).filter(p => p.id !== d.id);
    if (b.dataset.x === 'del') {
      const period = UI.period;
      m.close();
      withUndo(`Phase „${d.name}" gelöscht`, { settings: ['phases'], run: () => {
        Store.saveSettings({ phases: list });
        if (UI.period === 'ph:' + d.id) { UI.period = defaultPeriod() || '3m'; saveUI(); }
      }, after: () => { UI.period = period; saveUI(); } });
      return;
    }
    if (b.dataset.x === 'ok') {
      d.name = $('#phName', m.el).value.trim() || `${PHASE_TYPES[d.type][0]} ${new Date().getFullYear()}`;
      d.from = $('#phFrom', m.el).value; d.to = $('#phTo', m.el).value || '';
      if (!isISO(d.from)) return toast('Bitte ein Startdatum wählen', 'warn');
      if (d.to && d.to < d.from) return toast('Ende liegt vor dem Start', 'warn');
      const rt = readRate(m.el);
      if (rt === false) return;
      d.rateMin = rt ? rt[0] : null; d.rateMax = rt ? rt[1] : null;
      Store.saveSettings({ phases: [...list, d] });
      UI.period = 'ph:' + d.id; saveUI();
      toast(old ? 'Phase gespeichert' : `Phase „${d.name}" angelegt`, 'success');
    }
    m.close();
    App.renderCurrent();
  });
};

const ProgressViews = {};
const rangeLabel = r => r.all ? 'gesamt' : `${fmtDN(r.from, { day: '2-digit', month: '2-digit', year: '2-digit' })} – ${fmtDN(r.to, { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
const prevLabel = '';   // Vergleich zeigt der Pfeil mit Prozent; die Karte erklärt ihn im ⓘ

/* ---------- Übersicht ---------- */
ProgressViews.overview = body => {
  const ix = Analytics.cur();
  const c = chartColors();
  const t = todayDN();
  const st = Analytics.streak();
  const cw = weekStartDN(t);
  // Wochen-/Monatsvergleich: jeweils bis zum gleichen Tag der Vorperiode, damit die Hälfte der Woche nicht wie ein Einbruch aussieht.
  // Heute zählt erst, wenn heute ein Workout gespeichert ist (sonst stünde das Workout der Vorwoche schon drin, deins noch nicht).
  const e = Analytics.cmpEnd();
  const statsIn = (a, b) => { const rs = ix.rows.filter(r => r.dn >= a && r.dn <= b); return { n: rs.length, sets: sum(rs.map(r => r.sets)), ton: sum(rs.map(r => r.ton)), prs: ix.prEvents.filter(p => p.dn >= a && p.dn <= b).length }; };
  const wkNow = statsIn(cw, e), wkPrev = statsIn(cw - 7, cw - 7 + (e - cw)), wkFull = statsIn(cw - 7, cw - 1);
  const nowD = new Date();
  const ms = dayNum(`${nowD.getFullYear()}-${pad(nowD.getMonth() + 1)}-01`);
  const pmD = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1);
  const pms = dayNum(`${pmD.getFullYear()}-${pad(pmD.getMonth() + 1)}-01`);
  const moNow = statsIn(ms, e), moPrev = statsIn(pms, Math.min(ms - 1, pms + (e - ms))), moFull = statsIn(pms, ms - 1);
  const bwAvg = (a, b) => { const v = Analytics.bwSeries().filter(p => p.dn >= a && p.dn <= b); return v.length ? avg(v.map(p => p.kg)) : null; };
  const bwNow = bwAvg(ms, t), bwPrev = bwAvg(pms, ms - 1);
  const cmpRows = (a, b) => [
    ['Workouts', nf(a.n, 0), nf(b.n, 0), deltaHtml(a.n, b.n, { fmt: d => (d > 0 ? '+' : '') + nf(d, 0) })],
    ['Sätze', nf(a.sets, 0), nf(b.sets, 0), deltaHtml(a.sets, b.sets)],
    ['Volumen', fmtTon(a.ton), fmtTon(b.ton), deltaHtml(a.ton, b.ton)],
    ['PRs', nf(a.prs, 0), nf(b.prs, 0), deltaHtml(a.prs, b.prs, { fmt: d => (d > 0 ? '+' : '') + nf(d, 0) })]
  ];
  const wdName = WD_SHORT[dowOfDN(e)];
  const monthName = d => d.toLocaleDateString('de-DE', { month: 'long' });
  // 12-Wochen-Minibars (laufende Woche blass, Ø nur aus abgeschlossenen Wochen)
  const weeks12 = Array.from({ length: 12 }, (_, i) => cw - (11 - i) * 7);
  const wCounts = weeks12.map(w => ix.rows.filter(r => r.dn >= w && r.dn < w + 7).length);
  const mxW = Math.max(1, ...wCounts);
  // Trainingstage im Monat
  const now = new Date();
  const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
  const daysInMonth = key => new Set(ix.rows.filter(r => r.date.startsWith(key) && !r.cardioOnly).map(r => r.date)).size;
  const curMonth = daysInMonth(monthKey(now.getFullYear(), now.getMonth()));
  const prev6 = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1); return daysInMonth(monthKey(d.getFullYear(), d.getMonth())); });
  const avg6 = avg(prev6);
  const monthFrac = Math.max(0, e - ms + 1) / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expected = avg6 * monthFrac;
  // P/P/L letzte 4 Wochen
  const r4 = ix.rows.filter(r => r.dn > t - 28);
  const catSum = k => sum(r4.map(r => r.cats[k] || 0));
  const ppl = [catSum('Push'), catSum('Pull'), catSum('Legs'), catSum('Core') + catSum('Cardio') + catSum('Full Body')];
  // PRs
  const activePRs = uniq(ix.prEvents.filter(p => p.dn > t - 28).map(p => p.exId));
  const attack = nextPRAttack(ix);
  // Heatmap 7 Tage
  const maxDay = Math.max(1, ...ix.rows.filter(r => r.dn > t - 90).map(r => r.ton));
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const dn = t - 6 + i;
    const rs = ix.rows.filter(r => r.dn === dn);
    const ton = sum(rs.map(r => r.ton));
    return { dn, rs, ton, lv: rs.length ? Math.max(1, Math.ceil(ton / maxDay * 4)) : 0 };
  });
  const cb = chartBuilder();
  body.innerHTML = `
    <div class="charts-grid">
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">${icon('flame', 'cc-ic')} Streak</span>${infoBtn('Aufeinanderfolgende Kalenderwochen mit mindestens einem Workout. Die aktuelle Woche zählt, sobald du trainiert hast.')}</div>
        <div class="cc-big"><b>${st.cur}</b><small>${st.cur === 1 ? 'Woche' : 'Wochen'} in Folge</small></div>
        <div class="cc-sub">Längster Streak: ${st.best} Wochen</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Workouts gesamt</span>${infoBtn('Alle gespeicherten Workouts. Balken = Workouts pro Woche der letzten 12 Wochen.')}</div>
        <div class="cc-big"><b>${ix.rows.length}</b><small>Ø ${nf(avgDone(wCounts, 11), 1)} / Woche</small></div>
        <div class="minibars" role="img" aria-label="Workouts pro Woche, letzte 12 Wochen">${wCounts.map((n, i) => `<i class="${n ? '' : 'zero'}${i === 11 ? ' run' : ''}" style="height:${Math.max(4, n / mxW * 100)}%" title="KW ${isoWeek(weeks12[i]).week}: ${n}${i === 11 ? ' (läuft noch)' : ''}"></i>`).join('')}</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Wochenvergleich</span>${infoBtn(`Gegen die Vorwoche bis zum gleichen Tag${e < cw ? '' : ` (${wdName})`}, heute zählt erst nach dem Workout. Ganze Vorwoche: ${wkFull.n} ${wkFull.n === 1 ? 'Workout' : 'Workouts'}, ${fmtTon(wkFull.ton)}.`)}</div>
        ${cmpTable(['Diese Woche', 'Vorwoche'], cmpRows(wkNow, wkPrev))}
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Trainingstage im ${now.toLocaleDateString('de-DE', { month: 'long' })}</span>${infoBtn(`Tage mit Training in diesem Monat, verglichen mit deinem Ø der letzten 6 Monate. Soll bis heute: ${nf(expected, 1)}, Hochrechnung: ${nf(monthFrac ? curMonth / monthFrac : 0, 0)}.`)}</div>
        <div class="cc-big"><b>${curMonth}</b><small>Ø ${nf(avg6, 1)} / Monat (6 M.)</small>${now.getDate() >= 3 ? deltaHtml(curMonth, expected) : ''}</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Monatsrückblick</span>${infoBtn(`Gegen ${monthName(pmD)} bis zum gleichen Tag, Gewicht als Monats-Ø. Ganzer ${monthName(pmD)}: ${moFull.n} ${moFull.n === 1 ? 'Workout' : 'Workouts'}, ${fmtTon(moFull.ton)}.`)}</div>
        ${cmpTable([monthName(nowD), monthName(pmD)], [...cmpRows(moNow, moPrev), ...(bwNow || bwPrev ? [['Ø Gewicht', bwNow ? fmtW(bwNow) : '–', bwPrev ? fmtW(bwPrev) : '–', bwNow && bwPrev ? deltaHtml(bwNow, bwPrev, { fmt: d => (d > 0 ? '+' : '') + fmtW(d), neutral: true }) : '']] : [])])}
      </div>
      ${!F('f_score') ? '' : (() => {
        // Workout-Score im Zeitraum: Punkte je Workout + Ø der letzten 3 Wochen
        const rS = Analytics.range(), sOf = rs => rs.map(x => ({ x, s: Analytics.score(x.id) })).filter(o => o.s);
        const cur = sOf(Analytics.rowsIn(rS)), prv = sOf(Analytics.rowsIn(Analytics.prevRange(rS)));
        const a = cur.length ? avg(cur.map(o => o.s.score)) : null, b = prv.length ? avg(prv.map(o => o.s.score)) : null;
        return cb.card({ id: 'score', wide: true, title: 'Workout-Score', info: 'Die Bewertung jedes Workouts von 0 bis 100. Punkte: einzelne Workouts, Linie: Ø der letzten 3 Wochen.',
          big: a != null ? nf(a, 0) : '–', small: 'Ø im Zeitraum', delta: a != null && b != null ? deltaHtml(a, b, { fmt: d => (d > 0 ? '+' : '') + nf(d, 0) }) : '',
          factory: () => {
            if (cur.length < 2) return null;
            const pts = cur.map(o => ({ x: o.x.dn, y: o.s.score, label: `${o.s.score} · ${o.x.name}` }));
            return timeLine([
              lineDS('Workout', pts, c.faint, { showLine: false, fill: false, pointRadius: 3, pointBackgroundColor: c.faint, pointBorderWidth: 0 }),
              lineDS('Ø 3 Wochen', timeAvg(pts), c.accent, { fill: false, pointRadius: 0 })
            ], { legend: true, yMin: 0, yMax: 100, tooltipFmt: v => nf(v, 0) });
          } });
      })()}
      ${cb.card({
        id: 'ppl', title: 'Push / Pull / Legs Balance', info: 'Verteilung deiner Arbeitssätze nach Kategorie in den letzten 4 Wochen. „Andere" = Core, Cardio, Full Body.',
        size: 'sm', factory: () => sum(ppl) ? donut(['Push', 'Pull', 'Legs', 'Andere'], ppl, [c.series[0], c.series[1], c.series[2], c.faint], { tooltipFmt: v => `${nf(v, 0)} Sätze` }) : null
      })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">${icon('target', 'cc-ic')} Nächster PR-Angriff</span>${infoBtn('Die Übung, bei der ein neuer Rekord am nächsten liegt. Der Vorschlag zielt auf etwa 1,5 % mehr e1RM.')}</div>
        ${attack ? `<div class="cc-big"><b style="font-size:20px">${esc(Ex.name(attack.exId))}</b></div>
          <div class="cc-sub">Versuche <b class="accent">${fmtW(attack.weight)} × ${attack.reps}</b></div>
          <button class="btn btn-secondary btn-sm mt-12" data-act="openExercise" data-id="${esc(attack.exId)}">Verlauf ansehen</button>`
        : '<p class="dim small mt-8">Trainiere Übungen mindestens 3× – dann schlagen wir dir hier den nächsten PR vor.</p>'}
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">${icon('trophy', 'cc-ic')} Aktive PRs</span>${infoBtn('Anzahl Übungen, bei denen in den letzten 4 Wochen ein neues geschätztes 1RM gefallen ist.')}</div>
        <div class="cc-big"><b>${activePRs.length}</b><small>Übungen mit PR in 4 Wochen</small></div>
        ${activePRs.length ? '' : '<div class="cc-sub">Zeit für neue Rekorde!</div>'}
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Letzte 7 Tage</span>${infoBtn('Jede Zelle ist ein Tag; je kräftiger das Grün, desto mehr Volumen. Tippen öffnet das Workout.')}</div>
        <div class="heat7">${days7.map(d => `<button style="background:${heatColor(d.lv)};${d.lv >= 3 ? 'color:var(--accent-ink)' : ''}" class="${d.dn === t ? 'today' : ''}" ${d.rs.length ? `data-act="openWorkout" data-id="${esc(d.rs[d.rs.length - 1].id)}"` : 'disabled'} title="${d.rs.length ? esc(d.rs.map(r => r.name).join(', ')) + ' · ' + dayVolTxt(d.rs, d.ton) : 'Ruhetag'}" aria-label="${WD_SHORT[dowOfDN(d.dn)]}: ${d.rs.length ? esc(d.rs.map(r => r.name).join(', ')) + ', ' + dayVolTxt(d.rs, d.ton) : 'Ruhetag'}">
          <span>${WD_SHORT[dowOfDN(d.dn)]}</span></button>`).join('')}</div>
      </div>
      <div class="chart-card wide">
        <div class="cc-head"><span class="cc-title">Trainings-Konsistenz (52 Wochen)</span>${infoBtn('GitHub-Style: jede Zelle ein Tag, Farbintensität nach Tagesvolumen (Quartile). Tippen öffnet das Workout.')}</div>
        ${ghHeatmap(ix)}
      </div>
    </div>
    ${F('f_moreStats') ? `<div class="section-head"><h2>Mehr Stats</h2></div>
    <div id="moreStats"></div>` : ''}
    ${F('f_badges') ? `<div class="section-head"><h2>Meilensteine</h2></div>
    ${badgesHtml(ix)}` : ''}`;
  cb.mountAll();
  // Heatmap zeigt beim Öffnen die aktuellsten Wochen (rechts), ältere per Wischen
  const gh = $('#ghHeat', body);
  if (gh) requestAnimationFrame(() => { gh.scrollLeft = gh.scrollWidth; });
  if ($('#moreStats', body)) renderMoreStats($('#moreStats', body));
};
/** Kleine Vergleichstabelle (jetzt vs. vorher) für Wochen- und Monatsvergleich */
function cmpTable([colA, colB], rows, foot = '') {
  return `<table class="tbl cmp-tbl mt-8"><thead><tr><th></th><th class="r">${esc(colA)}</th><th class="r">${esc(colB)}</th><th></th></tr></thead>
    <tbody>${rows.map(([l, a, b, d]) => `<tr><td>${l}</td><td class="r"><b>${a}</b></td><td class="r dim">${b}</td><td class="r">${d || ''}</td></tr>`).join('')}</tbody></table>
    ${foot ? `<div class="cc-sub mt-8">${foot}</div>` : ''}`;
}

function nextPRAttack(ix) {
  const t = todayDN();
  let best = null;
  for (const [exId, ss] of Object.entries(ix.sessions)) {
    if (ss.length < 3 || Ex.type(Ex.get(exId)) !== 'kg') continue;
    const pr = maxOf(ss, s => s.best);
    if (!(pr > 0)) continue;
    const last = ss[ss.length - 1];
    const days = t - last.dn;
    if (days < 1 || days > 120) continue;
    const recent = maxOf(ss.filter(s => s.dn > last.dn - 28), s => s.best);
    const close = recent / pr;
    const score = Math.pow(close, 5) * (Math.min(days, 21) + 2) / 23;
    if (!best || score > best.score) best = { exId, pr, score, lastDn: last.dn };
  }
  if (!best) return null;
  const reps = 3;
  const step = fromU(S().weightSteps);
  const target = best.pr * 1.015;
  const weight = Math.ceil(target / (1 + reps / 30) / step) * step;
  return { ...best, reps, weight };
}
/** Volumen eines Tages als Text – reine Cardio-Tage heißen „Cardio“ statt „0 kg“ */
const dayVolTxt = (rs, ton) => rs.every(r => r.cardioOnly) ? 'Cardio' : fmtTon(ton);
function ghHeatmap(ix) {
  const t = todayDN();
  const ws = weekStartDN(t);
  const start = ws - 52 * 7;
  const byDn = {};
  for (const r of ix.rows) if (r.dn >= start) (byDn[r.dn] || (byDn[r.dn] = [])).push(r);
  const tons = Object.values(byDn).map(rs => sum(rs.map(r => r.ton))).filter(v => v > 0).sort((a, b) => a - b);
  const q = p => tons.length ? tons[Math.min(tons.length - 1, Math.floor(p * tons.length))] : 0;
  const q1 = q(.25), q2 = q(.5), q3 = q(.75);
  const level = v => !v ? 1 : v <= q1 ? 1 : v <= q2 ? 2 : v <= q3 ? 3 : 4;
  const cs = 12, gap = 3, left = 22, top = 16;
  let cells = '', months = '';
  let lastMonth = -1;
  for (let wi = 0; wi <= 52; wi++) {
    const w0 = start + wi * 7;
    const d0 = new Date(w0 * 864e5);
    if (d0.getUTCMonth() !== lastMonth && d0.getUTCDate() <= 7) { months += `<text x="${left + wi * (cs + gap)}" y="10" style="text-anchor:start;font-size:10px" fill="var(--text-faint)">${MONTHS[d0.getUTCMonth()]}</text>`; lastMonth = d0.getUTCMonth(); }
    for (let di = 0; di < 7; di++) {
      const dn = w0 + di;
      if (dn > t) continue;
      const rs = byDn[dn];
      const ton = rs ? sum(rs.map(r => r.ton)) : 0;
      const lv = rs ? level(ton) : 0;
      cells += `<rect x="${left + wi * (cs + gap)}" y="${top + di * (cs + gap)}" width="${cs}" height="${cs}" rx="3" fill="${heatColor(lv)}" ${rs ? `data-act="openWorkout" data-id="${esc(rs[rs.length - 1].id)}" style="cursor:pointer"` : ''}><title>${fmtDN(dn)}${rs ? ': ' + esc(rs.map(r => r.name).join(', ')) + ' · ' + dayVolTxt(rs, ton) : ''}</title></rect>`;
    }
  }
  const lbl = S().weekStart === 'sunday' ? ['', 'Mo', '', 'Mi', '', 'Fr', ''] : ['Mo', '', 'Mi', '', 'Fr', '', 'So'];
  const W = left + 53 * (cs + gap), H = top + 7 * (cs + gap);
  return `<div class="gh-heat" id="ghHeat"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Trainingstage der letzten 52 Wochen">${months}${lbl.map((l, i) => l ? `<text x="0" y="${top + i * (cs + gap) + 10}" style="text-anchor:start;font-size:10px" fill="var(--text-faint)">${l}</text>` : '').join('')}${cells}</svg></div>`;
}

/* ---------- Spezial-Statistiken (§17.6) ---------- */
function renderMoreStats(el) {
  const ix = Analytics.cur();
  const r = Analytics.range();
  const rows = Analytics.rowsIn(r);
  const strengthRows = rows.filter(w => !w.cardioOnly);
  const c = chartColors();
  const t = todayDN();
  const cb = chartBuilder();
  // Lieblings-Übungen
  const countEx = rs => { const m = {}; rs.forEach(w => w.ex.forEach(id => { m[id] = (m[id] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const favAll = countEx(ix.rows)[0], favPer = countEx(rows)[0];
  // Dauer-Histogramm
  const bins = [[0, 30, '< 30'], [30, 45, '30–45'], [45, 60, '45–60'], [60, 75, '60–75'], [75, 90, '75–90'], [90, 120, '90–120'], [120, 1e9, '120+']];
  const durs = rows.filter(w => w.dur > 60 && !w.estDur).map(w => w.dur / 60);
  // PRs pro Monat (12 Monate, der laufende zuletzt)
  const now = new Date();
  const months12 = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
  const prMonth = months12.map(k => ix.prEvents.filter(p => p.date.startsWith(k)).length);
  // Rekord-Workout
  const rec = ix.rows.reduce((a, b) => (!a || b.ton > a.ton ? b : a), null);
  // Fun
  const totalTon = sum(ix.rows.map(w => w.ton));
  // Ampel
  const ampel = Object.entries(ix.sessions)
    .filter(([id, ss]) => Ex.type(Ex.get(id)) === 'kg' && ss.length >= 3 && t - ss[ss.length - 1].dn <= 56)
    .map(([id, ss]) => {
      const recent = ss.filter(s => s.dn > t - 28), prior = ss.filter(s => s.dn <= t - 28 && s.dn > t - 56);
      const recMax = recent.length ? maxOf(recent, s => s.best) : 0;
      const prMax = prior.length ? maxOf(prior, s => s.best) : maxOf(ss.filter(s => s.dn <= t - 28), s => s.best);
      const prEv = ix.prEvents.some(p => p.exId === id && p.dn > t - 28);
      let st = 'yellow';
      if (prEv || (recMax && prMax && recMax > prMax * 1.01)) st = 'green';
      else if (recMax && prMax && recMax < prMax * 0.97) st = 'red';
      else if (!recMax) st = 'yellow';
      return { id, st, recMax, prMax, n: ss.length };
    }).sort((a, b) => ['red', 'yellow', 'green'].indexOf(a.st) - ['red', 'yellow', 'green'].indexOf(b.st) || b.n - a.n).slice(0, 12);
  const ampelColor = { green: c.success, yellow: c.warning, red: c.danger };
  const ampelText = { green: 'Fortschritt', yellow: 'Stagnation', red: 'Rückschritt' };
  el.innerHTML = `<div class="charts-grid">
    <div class="chart-card">
      <div class="cc-head"><span class="cc-title">${icon('heart', 'cc-ic')} Lieblings-Übung</span>${infoBtn('Übung mit den meisten Sessions – insgesamt und im gewählten Zeitraum.')}</div>
      <div class="ratio-row"><span class="grow">Insgesamt</span><b>${favAll ? esc(Ex.name(favAll[0])) : '–'}</b><span class="dim small">${favAll ? favAll[1] + '×' : ''}</span></div>
      <div class="ratio-row"><span class="grow">Im Zeitraum</span><b>${favPer ? esc(Ex.name(favPer[0])) : '–'}</b><span class="dim small">${favPer ? favPer[1] + '×' : ''}</span></div>
    </div>
    ${cb.card({ id: 'durh', title: 'Workout-Dauer', info: 'Verteilung der Workout-Dauer im Zeitraum (Minuten).', big: durs.length ? nf(avg(durs), 0) : '–', small: 'min Ø',
      factory: () => durs.length ? barChart(bins.map(b => b[2]), [barDS('Workouts', bins.map(([a, z]) => durs.filter(d => d >= a && d < z).length), c.accent)], { tooltipFmt: v => `${v} Workouts` }) : null })}
    ${cb.card({ id: 'setsw', title: 'Sätze pro Workout', info: 'Erledigte Arbeitssätze je Krafttraining. Bei gemischten Einheiten zählen die Kraftsätze.', big: strengthRows.length ? nf(avg(strengthRows.map(w => w.sets)), 1) : '–', small: 'Ø',
      factory: () => strengthRows.length ? timeLine([lineDS('Sätze', strengthRows.map(w => ({ x: w.dn, y: w.sets })), c.accent)], { tooltipFmt: v => nf(v, 0) }) : null })}
    ${cb.card({ id: 'prm', title: 'PRs pro Monat', info: 'Neue e1RM-Rekorde pro Monat in den letzten 12 Monaten.', big: sum(prMonth), small: 'PRs in 12 Monaten',
      factory: () => barChart(months12.map(k => MONTHS[+k.slice(5) - 1]), [barDS('PRs', prMonth, c.accent)], { tooltipFmt: v => `${v} PRs`, running: 11 }) })}
    <div class="chart-card">
      <div class="cc-head"><span class="cc-title">${icon('trophy', 'cc-ic')} Rekord-Workout</span>${infoBtn('Deine Session mit der höchsten Tonnage aller Zeiten.')}</div>
      ${rec ? `<div class="cc-big"><b>${fmtTon(rec.ton)}</b></div><div class="cc-sub">${esc(rec.name)} · ${fmtDate(rec.date)}</div><button class="btn btn-secondary btn-sm mt-12" data-act="openWorkout" data-id="${esc(rec.id)}">Öffnen</button>` : '–'}
    </div>
    <div class="chart-card">
      <div class="cc-head"><span class="cc-title">${icon('scale', 'cc-ic')} Gesamt bewegt</span>${infoBtn('Deine gesamte Tonnage in witzigen Einheiten: Big Mac à 230 g, Auto à 1,5 t, Elefant à 6 t.')}</div>
      <div class="cc-big"><b>${fmtTon(totalTon)}</b><small>insgesamt</small></div>
      <div class="cc-sub">= ${nf(totalTon / 0.23, 0)} Big Macs · ${nf(totalTon / 1500, 1)} Autos · ${nf(totalTon / 6000, 1)} Elefanten</div>
    </div>
    <div class="chart-card wide">
      <div class="cc-head"><span class="cc-title">${icon('warn', 'cc-ic')} Erste-Hilfe-Ampel</span>${infoBtn('Bestes e1RM der letzten 4 Wochen gegen die 4 Wochen davor. Grün: besser, gelb: gleich, rot: über 3 % schlechter.')}</div>
      ${ampel.length ? `<div>${ampel.map(a => `<button class="ampel-row" style="width:100%;background:none;border-left:0;border-right:0;border-top:0;color:inherit;text-align:left" data-act="openExercise" data-id="${esc(a.id)}"><span class="ampel-dot" style="background:${ampelColor[a.st]}"></span><span class="grow">${esc(Ex.name(a.id))}</span><span class="small dim">${ampelText[a.st]}</span><span class="small num" style="min-width:110px;text-align:right">${a.recMax ? wNum(a.recMax, 1) : '–'} ← ${a.prMax ? wNum(a.prMax, 1) : '–'} ${unit()}</span></button>`).join('')}</div>` : '<p class="dim small mt-8">Trainiere Übungen regelmäßig – dann erscheint hier ihre Ampel.</p>'}
    </div>
  </div>`;
  cb.mountAll();
}

/* ---------- Meilensteine: Stufen Bronze → Silber → Gold → Platin → Diamant ---------- */
const TIERS = [['Bronze', '#cd7f32'], ['Silber', '#b8c0cc'], ['Gold', '#f5c542'], ['Platin', '#6ee7d8'], ['Diamant', '#a78bfa']];
function milestoneList(ix) {
  const rows = ix.rows, strength = rows.filter(r => !r.cardioOnly);
  const st = Analytics.streak();
  const bestOf = ids => Math.max(0, maxOf(ids.flatMap(id => ix.sessions[id] || []), s => s.best));
  const big3 = BIG3.map(b => bestOf(b.ids));
  const months = {};
  strength.forEach(r => { const k = r.date.slice(0, 7); months[k] = (months[k] || 0) + 1; });
  const exCount = new Set(rows.flatMap(r => [...r.ex, ...Object.keys(r.cBy || {})])).size;
  const kg = v => fmtW(v, 0), t = v => nf(v / 1000, v < 10000 ? 1 : 0) + ' t';
  return [
    ['Training', [
      ['dumbbell', 'Workouts', strength.length, [10, 50, 100, 250, 500], v => nf(v, 0)],
      ['flame', 'Längster Streak', st.best, [4, 12, 26, 52, 104], v => nf(v, 0) + ' Wo.'],
      ['calendar', 'Workouts in einem Monat', Math.max(0, ...Object.values(months)), [8, 12, 16, 20, 25], v => nf(v, 0)],
      ['timer', 'Trainingszeit', sum(rows.map(r => r.dur)) / 3600, [10, 50, 100, 250, 500], v => nf(v, 0) + ' h'],
      ['layers', 'Verschiedene Übungen', exCount, [10, 25, 50, 75, 100], v => nf(v, 0)]
    ]],
    ['Volumen', [
      ['bolt', 'Tonnage gesamt', sum(rows.map(r => r.ton)), [10000, 100000, 500000, 1e6, 2.5e6], t],
      ['list', 'Sätze gesamt', sum(rows.map(r => r.sets)), [500, 2500, 5000, 10000, 25000], v => nf(v, 0)],
      ['repeat', 'Wiederholungen gesamt', sum(rows.map(r => r.reps)), [5000, 25000, 50000, 100000, 250000], v => nf(v, 0)],
      ['trophy', 'PRs', ix.prEvents.length, [1, 10, 25, 50, 100], v => nf(v, 0)]
    ]],
    ['Kraft (geschätztes 1RM)', [
      ['plate', 'Bankdrücken', big3[0], [60, 80, 100, 120, 140], kg],
      ['plate', 'Kniebeuge', big3[1], [80, 100, 140, 180, 220], kg],
      ['plate', 'Kreuzheben', big3[2], [100, 140, 180, 220, 260], kg],
      ['target', 'Big-3-Total', big3.every(v => v > 0) ? sum(big3) : 0, [300, 400, 500, 600, 700], kg]
    ]],
    ['Cardio', [
      ['heart', 'Cardio-Zeit', sum(rows.map(r => r.cSec)) / 3600, [5, 25, 50, 100, 250], v => nf(v, 0) + ' h'],
      ['flag', 'Cardio-Distanz', sum(rows.map(r => r.cKm)), [25, 100, 250, 500, 1000], v => nf(v, 0) + ' km']
    ]]
  ];
}
function badgesHtml(ix) {
  const groups = milestoneList(ix);
  const all = groups.flatMap(g => g[1]);
  const lvl = (v, th) => th.filter(x => v >= x).length;
  const got = sum(all.map(m => lvl(m[2], m[3]))), total = all.length * TIERS.length;
  const hours = ix.rows.filter(r => r.startedAt && !r.imp).map(r => new Date(r.startedAt).getHours());
  const special = [['sun', 'Frühaufsteher', 'vor 7 Uhr', hours.some(h => h < 7)], ['moon', 'Nachteule', 'ab 21 Uhr', hours.some(h => h >= 21)], ['timer', 'Marathon', '2 h+ Workout', ix.rows.some(r => r.dur >= 7200)], ['flag', 'Erstes Workout', '', ix.rows.length > 0]];
  const row = ([ic, name, v, th, f]) => {
    const n = lvl(v, th), next = th[n], prev = n ? th[n - 1] : 0;
    const p = next ? clamp((v - prev) / (next - prev), 0, 1) : 1;
    const tc = n ? TIERS[n - 1][1] : 'var(--surface-3)';
    return `<div class="ms-row" style="--tc:${tc}">
      <span class="ms-ic">${icon(ic)}</span>
      <div class="ms-main">
        <div class="ms-top"><b>${esc(name)}</b>${n ? `<span class="ms-tier">${TIERS[n - 1][0]}</span>` : ''}</div>
        <div class="ms-pips">${TIERS.map(([l, c], i) => `<i class="${i < n ? 'on' : ''}" style="--c:${c}" title="${l}: ${f(th[i])}"></i>`).join('')}</div>
        <div class="goal-bar ms-bar" style="--p:${Math.round(p * 100)}%"><i></i></div>
        <div class="ms-sub">${f(v)} · ${next ? `noch ${f(next - v)} bis ${TIERS[n][0]} (${f(next)})` : 'Höchste Stufe erreicht'}</div>
      </div>
    </div>`;
  };
  return `<p class="small dim mb-8">${got} von ${total} Stufen erreicht</p>
    ${groups.map(([g, ms]) => `<div class="card mb-12"><h4 class="mb-8">${esc(g)}</h4>${ms.map(row).join('')}</div>`).join('')}
    <div class="card"><h4 class="mb-8">Spezial</h4><div class="badges-grid">${special.map(([i, l, sub, ok]) => `<div class="badge-tile ${ok ? 'got' : ''}"><span class="bt-ic">${icon(i)}</span>${esc(l)}${sub ? `<em>${esc(sub)}</em>` : ''}</div>`).join('')}</div></div>`;
}
