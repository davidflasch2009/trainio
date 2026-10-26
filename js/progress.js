/* Trainio – Fortschritt-Tab
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   14. View: Fortschritt (Analytics-Zentrale)
   ========================================================================== */
const PERIODS = [['4w', '4W'], ['3m', '3M'], ['6m', '6M'], ['1y', '1J'], ['all', 'Alles'], ['custom', 'Custom']];
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
    const r = Analytics.range();
    el.innerHTML = `
      <div class="prog-controls">
        <div class="seg tabs" role="tablist">${progSubs().map(([k, l]) => `<button role="tab" class="${UI.progSub === k ? 'active' : ''}" data-act="progSub" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row pc-row">
          <div class="chips grow pc-chips phase-chips">${PERIODS.map(([k, l]) => `<button class="chip sm ${UI.period === k ? 'active' : ''}" data-act="period" data-v="${k}">${l}${k === 'custom' && UI.period === 'custom' && r.custom ? ` ${fmtDN(r.from, { day: '2-digit', month: '2-digit' })}–${fmtDN(r.to, { day: '2-digit', month: '2-digit' })}` : ''}</button>`).join('')}<span class="pc-sep" aria-hidden="true"></span>${phases().map(ph => { const on = UI.period === 'ph:' + ph.id; return `<button class="chip sm phase ${on ? 'active' : ''}" data-act="period" data-v="ph:${esc(ph.id)}" style="--ph:${PHASE_TYPES[ph.type] ? PHASE_TYPES[ph.type][1] : 'var(--accent)'}"><i></i>${esc(ph.name)}</button>${on ? `<button class="chip sm" data-act="phaseEdit" data-id="${esc(ph.id)}" aria-label="Phase bearbeiten">${icon('edit')}</button>` : ''}`; }).join('')}<button class="chip sm ghost" data-act="phaseEdit">${icon('plus')} Phase</button></div>
          <div class="seg sm" style="flex:0 0 auto" aria-label="Einheit"><button class="${unit() === 'kg' ? 'active' : ''}" data-act="unitSet" data-v="kg">kg</button><button class="${unit() === 'lb' ? 'active' : ''}" data-act="unitSet" data-v="lb">lb</button></div>
        </div>
        ${r.phase ? `<div class="tiny dim pc-phase">${esc(PHASE_TYPES[r.phase.type] ? PHASE_TYPES[r.phase.type][0] : 'Phase')} · seit ${fmtDate(r.phase.from)}${r.phase.to ? ' bis ' + fmtDate(r.phase.to) : ' (läuft)'} · ${Math.round(r.len / 7)} Wochen</div>` : ''}
      </div>
      <div id="progBody"></div>`;
    updateTopH();
    // Aktiven Zeitraum/Tab in den scrollbaren Leisten sichtbar halten
    $$('.pc-chips, .prog-controls .seg.tabs', el).forEach(c => { const a = $('.active', c); if (a && c.scrollWidth > c.clientWidth) c.scrollLeft = a.offsetLeft - c.offsetLeft - c.clientWidth / 2 + a.offsetWidth / 2; });
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
Views.progress.leave = applyDefaultPeriod;   // beim nächsten Öffnen ist wieder der Standard gewählt
Actions.progSub = el => { UI.progSub = el.dataset.v; saveUI(); App.renderCurrent(); };
Actions.period = async el => {
  const v = el.dataset.v;
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
Actions.unitSet = el => { Store.saveSettings({ unit: el.dataset.v }); };

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
const rateFields = (lo, hi, ph = ['', '']) => `<div class="form-grid">
    <label class="field"><span>von (${rateUnit()} pro Woche)</span><input class="input" id="rtMin" value="${esc(rateToInput(lo))}" placeholder="${esc(ph[0])}" autocomplete="off" enterkeyhint="next"></label>
    <label class="field"><span>bis (${rateUnit()} pro Woche)</span><input class="input" id="rtMax" value="${esc(rateToInput(hi))}" placeholder="${esc(ph[1])}" autocomplete="off" enterkeyhint="done"></label>
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
    body: `<div class="stack">
      <div class="seg" id="phType">${Object.entries(PHASE_TYPES).map(([k, [l]]) => `<button data-t="${k}" class="${d.type === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <label class="field"><span>Name</span><input class="input" id="phName" value="${esc(d.name)}" placeholder="z. B. Bulk 2026" autocomplete="off"></label>
      <div class="form-grid">
        <label class="field"><span>Start</span><input class="input" type="date" id="phFrom" value="${esc(d.from)}"></label>
        <label class="field"><span>Ende (leer = läuft noch)</span><input class="input" type="date" id="phTo" value="${esc(d.to || '')}"></label>
      </div>
      <div><div class="bold small mb-8">Gewicht pro Woche (optional)</div>
        ${rateFields(d.rateMin, d.rateMax, [rateToInput(sug[0]), rateToInput(sug[1])])}
        <p class="tiny dim mt-8">Erlaubte Veränderung des Wochendurchschnitts, z. B. Bulk 0 bis +200 g. Im Körper-Tab sind Wochen in diesem Bereich grün, darüber oder darunter orange. Leer lassen = kein Ziel.</p></div>
      <p class="tiny dim">Die Phase erscheint im Fortschritt als eigener Zeitraum – alle Auswertungen gelten dann nur für diese Zeit.</p></div>`,
    foot: `${old ? `<button class="btn btn-danger-ghost" data-x="del" style="flex:0 0 auto" aria-label="Löschen">${icon('trash')}</button>` : ''}<button class="btn btn-secondary" data-x="c">Abbrechen</button><button class="btn btn-primary" data-x="ok">Speichern</button>`
  });
  m.el.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]');
    if (t) { applyRateDefault(m.el, d.type, t.dataset.t); d.type = t.dataset.t; $$('#phType button', m.el).forEach(b => b.classList.toggle('active', b === t)); if (!$('#phName', m.el).value.trim() || Object.values(PHASE_TYPES).some(([l]) => $('#phName', m.el).value.startsWith(l))) $('#phName', m.el).value = `${PHASE_TYPES[d.type][0]} ${new Date().getFullYear()}`; return; }
    const b = e.target.closest('[data-x]'); if (!b) return;
    const list = (S().phases || []).filter(p => p.id !== d.id);
    if (b.dataset.x === 'del') {
      if (!await confirmDialog({ title: 'Phase löschen?', text: `„${d.name}" wird entfernt. Deine Workouts bleiben erhalten.`, okLabel: 'Löschen', danger: true })) return;
      Store.saveSettings({ phases: list });
      if (UI.period === 'ph:' + d.id) { UI.period = defaultPeriod() || '3m'; saveUI(); }
      m.close(); return;
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
const prevLabel = 'vs. Vorperiode';

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
  const todayNote = e < t ? ' · heute zählt, sobald dein Workout gespeichert ist' : '';
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
  const goal = weeklyTarget();
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
        <div class="cc-sub">Längster Streak: ${st.best} Wochen · diese Woche ${st.days.size}/${goal} Tage</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Workouts gesamt</span>${infoBtn('Alle gespeicherten Workouts. Balken = Workouts pro Woche der letzten 12 Wochen.')}</div>
        <div class="cc-big"><b>${ix.rows.length}</b><small>Ø ${nf(avgDone(wCounts, 11), 1)} / Woche (11 W)</small></div>
        <div class="minibars" role="img" aria-label="Workouts pro Woche, letzte 12 Wochen">${wCounts.map((n, i) => `<i class="${n ? '' : 'zero'}${i === 11 ? ' run' : ''}" style="height:${Math.max(4, n / mxW * 100)}%" title="KW ${isoWeek(weeks12[i]).week}: ${n}${i === 11 ? ' (läuft noch)' : ''}"></i>`).join('')}</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Wochenvergleich</span>${infoBtn(`Diese Woche im Vergleich zur Vorwoche bis zum gleichen Wochentag – so ist der Vergleich fair, auch mitten in der Woche. Der heutige Tag zählt erst, wenn du heute ein Workout gespeichert hast; vorher wird in beiden Wochen bis gestern verglichen. Volumen = Σ Wiederholungen × Gewicht aller erledigten Arbeitssätze.`)}</div>
        ${cmpTable(['Diese Woche', 'Vorwoche'], cmpRows(wkNow, wkPrev), `${e < cw ? 'Noch kein abgeschlossener Tag diese Woche' : `Vorwoche bis ${wdName}`}${todayNote} · ganze Vorwoche: ${wkFull.n} ${wkFull.n === 1 ? 'Workout' : 'Workouts'}, ${fmtTon(wkFull.ton)}`)}
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Trainingstage im ${now.toLocaleDateString('de-DE', { month: 'long' })}</span>${infoBtn('Unterschiedliche Tage mit Training im aktuellen Monat. Verglichen wird mit dem anteiligen Durchschnitt der letzten 6 Monate bis zum heutigen Tag (heute zählt erst nach deinem Workout).')}</div>
        <div class="cc-big"><b>${curMonth}</b><small>Ø ${nf(avg6, 1)} / Monat (6 M.)</small>${now.getDate() >= 3 ? deltaHtml(curMonth, expected) : ''}</div>
        <div class="cc-sub">Soll bis heute (anteilig): ${nf(expected, 1)} Tage · Hochrechnung: ${nf(monthFrac ? curMonth / monthFrac : 0, 0)}</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Monatsrückblick</span>${infoBtn(`${monthName(nowD)} im Vergleich zum ${monthName(pmD)} bis zum gleichen Tag. Der heutige Tag zählt erst, wenn du heute ein Workout gespeichert hast. Körpergewicht: Durchschnitt aller Einträge im ganzen Monat.`)}</div>
        ${cmpTable([monthName(nowD), monthName(pmD)], [...cmpRows(moNow, moPrev), ...(bwNow || bwPrev ? [['Ø Gewicht', bwNow ? fmtW(bwNow) : '–', bwPrev ? fmtW(bwPrev) : '–', bwNow && bwPrev ? deltaHtml(bwNow, bwPrev, { fmt: d => (d > 0 ? '+' : '') + fmtW(d), neutral: true }) : '']] : [])],
          `${e < ms ? 'Noch kein abgeschlossener Tag diesen Monat' : `${monthName(pmD)} bis zum ${e - ms + 1}.`}${todayNote} · ganzer Monat: ${moFull.n} ${moFull.n === 1 ? 'Workout' : 'Workouts'}, ${fmtTon(moFull.ton)}`)}
      </div>
      ${!F('f_score') ? '' : (() => {
        // Workout-Score im Zeitraum: Punkte je Workout + Ø der letzten 3 Wochen
        const rS = Analytics.range(), sOf = rs => rs.map(x => ({ x, s: Analytics.score(x.id) })).filter(o => o.s);
        const cur = sOf(Analytics.rowsIn(rS)), prv = sOf(Analytics.rowsIn(Analytics.prevRange(rS)));
        const a = cur.length ? avg(cur.map(o => o.s.score)) : null, b = prv.length ? avg(prv.map(o => o.s.score)) : null;
        return cb.card({ id: 'score', wide: true, title: 'Workout-Score', info: 'Score 0–100 je Workout: Fortschritt gegenüber dem letzten Mal (45), erledigte Sätze (35) und Anstrengung laut RPE (20); fehlt ein Teil, wird hochgerechnet. Neue e1RM-Rekorde geben +3 (höchstens +9). Punkte = einzelne Workouts, Linie = Ø der letzten 3 Wochen.',
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
        <div class="cc-head"><span class="cc-title">${icon('target', 'cc-ic')} Nächster PR-Angriff</span>${infoBtn('Übung mit der höchsten PR-Dringlichkeit: Deine Form der letzten 4 Wochen ist nah am Bestwert und du hast sie länger nicht trainiert. Vorschlag zielt auf ein ~1,5 % höheres e1RM.')}</div>
        ${attack ? `<div class="cc-big"><b style="font-size:20px">${esc(Ex.name(attack.exId))}</b></div>
          <div class="cc-sub">Versuche <b class="accent">${fmtW(attack.weight)} × ${attack.reps}</b> · aktueller e1RM-PR ${fmtW(attack.pr)} · zuletzt ${relDays(attack.lastDn)}</div>
          <button class="btn btn-secondary btn-sm mt-12" data-act="openExercise" data-id="${esc(attack.exId)}">Verlauf ansehen</button>`
        : '<p class="dim small mt-8">Trainiere Übungen mindestens 3× – dann schlagen wir dir hier den nächsten PR vor.</p>'}
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">${icon('trophy', 'cc-ic')} Aktive PRs</span>${infoBtn('Anzahl Übungen, bei denen in den letzten 4 Wochen ein neues geschätztes 1RM gefallen ist.')}</div>
        <div class="cc-big"><b>${activePRs.length}</b><small>Übungen mit PR in 4 Wochen</small></div>
        <div class="cc-sub">${activePRs.slice(0, 5).map(id => esc(Ex.name(id))).join(' · ') || 'Zeit für neue Rekorde!'}</div>
      </div>
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Letzte 7 Tage</span>${infoBtn('Jede Zelle ist ein Tag; je kräftiger das Grün, desto mehr Volumen. Tippen öffnet das Workout.')}</div>
        <div class="heat7">${days7.map(d => `<button style="background:${heatColor(d.lv)};${d.lv >= 3 ? 'color:var(--accent-ink)' : ''}" class="${d.dn === t ? 'today' : ''}" ${d.rs.length ? `data-act="openWorkout" data-id="${esc(d.rs[d.rs.length - 1].id)}"` : 'disabled'} title="${d.rs.length ? esc(d.rs.map(r => r.name).join(', ')) + ' · ' + fmtTon(d.ton) : 'Ruhetag'}" aria-label="${WD_SHORT[dowOfDN(d.dn)]}: ${d.rs.length ? esc(d.rs.map(r => r.name).join(', ')) : 'Ruhetag'}">
          <span>${WD_SHORT[dowOfDN(d.dn)]}</span><span style="font-size:10px;opacity:.8">${d.rs.length ? fmtTon(d.ton).replace(' ', '') : '·'}</span></button>`).join('')}</div>
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
      cells += `<rect x="${left + wi * (cs + gap)}" y="${top + di * (cs + gap)}" width="${cs}" height="${cs}" rx="3" fill="${heatColor(lv)}" ${rs ? `data-act="openWorkout" data-id="${esc(rs[rs.length - 1].id)}" style="cursor:pointer"` : ''}><title>${fmtDN(dn)}${rs ? ': ' + esc(rs.map(r => r.name).join(', ')) + ' · ' + fmtTon(ton) : ''}</title></rect>`;
    }
  }
  const lbl = S().weekStart === 'sunday' ? ['', 'Mo', '', 'Mi', '', 'Fr', ''] : ['Mo', '', 'Mi', '', 'Fr', '', 'So'];
  const W = left + 53 * (cs + gap), H = top + 7 * (cs + gap);
  return `<div class="gh-heat" id="ghHeat"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Trainingstage der letzten 52 Wochen">${months}${lbl.map((l, i) => l ? `<text x="0" y="${top + i * (cs + gap) + 10}" style="text-anchor:start;font-size:10px" fill="var(--text-faint)">${l}</text>` : '').join('')}${cells}</svg></div>
    <div class="gh-legend">weniger ${[0, 1, 2, 3, 4].map(l => `<i style="background:${heatColor(l)}"></i>`).join('')} mehr</div>`;
}

/* ---------- Spezial-Statistiken (§17.6) ---------- */
function renderMoreStats(el) {
  const ix = Analytics.cur();
  const r = Analytics.range();
  const rows = Analytics.rowsIn(r);
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
    ${cb.card({ id: 'setsw', title: 'Sätze pro Workout', info: 'Anzahl erledigter Arbeitssätze je Workout.', big: rows.length ? nf(avg(rows.map(w => w.sets)), 1) : '–', small: 'Ø',
      factory: () => rows.length > 1 ? timeLine([lineDS('Sätze', rows.map(w => ({ x: w.dn, y: w.sets })), c.accent)], { tooltipFmt: v => nf(v, 0) }) : null })}
    ${cb.card({ id: 'prm', title: 'PRs pro Monat', info: 'Anzahl neuer e1RM-Bestwerte pro Monat (letzte 12 Monate). Der laufende Monat ist blass.', big: sum(prMonth), small: 'PRs in 12 Monaten',
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
      <div class="cc-head"><span class="cc-title">${icon('warn', 'cc-ic')} Erste-Hilfe-Ampel</span>${infoBtn('Vergleicht das beste e1RM der letzten 4 Wochen mit den 4 Wochen davor. Grün: Fortschritt oder neuer PR. Gelb: Stagnation. Rot: Rückschritt > 3 %.')}</div>
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
  return `<p class="small dim mb-8">${got} von ${total} Stufen erreicht · ${TIERS.map(([l, c]) => `<span class="ms-legend" style="--c:${c}">${l}</span>`).join(' ')}</p>
    ${groups.map(([g, ms]) => `<div class="card mb-12"><h4 class="mb-8">${esc(g)}</h4>${ms.map(row).join('')}</div>`).join('')}
    <div class="card"><h4 class="mb-8">Spezial</h4><div class="badges-grid">${special.map(([i, l, sub, ok]) => `<div class="badge-tile ${ok ? 'got' : ''}"><span class="bt-ic">${icon(i)}</span>${esc(l)}${sub ? `<em>${esc(sub)}</em>` : ''}</div>`).join('')}</div></div>`;
}


/* ---------- Kraft ---------- */
const BENCHMARKS = {
  ex_bankdruecken: [1.0, 1.5, 2.0], ex_kniebeuge: [1.25, 1.75, 2.5], ex_kniebeuge_lowbar: [1.25, 1.75, 2.5],
  ex_kreuzheben: [1.5, 2.0, 2.75], ex_sumo_kreuzheben: [1.5, 2.0, 2.75], ex_military_press: [0.6, 0.85, 1.1], ex_ohp_kh: [0.6, 0.85, 1.1]
};
/** Kraftzuwachs je Übung: bestes e1RM bis zum Tag ÷ erste Session im Zeitraum (mind. 3 Sessions im Zeitraum) */
function strengthGains(ix, ids, r) {
  return ids.map(id => {
    const pts = sinceFix(ix.sessions[id] || [], r.to).filter(s => s.dn >= r.from && s.dn <= r.to && s.best > 0);
    if (pts.length < 3) return null;
    const base = pts[0].best;
    let run = 0;
    const series = pts.map(s => { run = Math.max(run, s.best); return { x: s.dn, ratio: run / base }; });
    return { id, base, best: run, gain: (run / base - 1) * 100, series, n: pts.length };
  }).filter(Boolean);
}
/** Kraft-Index (verkettet): Übungen, die später dazukommen, starten neutral und ziehen den Schnitt nicht nach unten */
function gainIndex(gains) {
  const xs = uniq(gains.flatMap(g => g.series.map(p => p.x))).sort((a, b) => a - b);
  let level = 1, prev = new Map();
  return xs.map(x => {
    const cur = new Map();
    for (const g of gains) { let v = null; for (const p of g.series) { if (p.x <= x) v = p.ratio; else break; } if (v != null) cur.set(g.id, v); }
    const ch = [...cur].filter(([id]) => prev.has(id)).map(([id, v]) => v / prev.get(id) - 1);
    if (ch.length) level *= 1 + avg(ch);
    prev = cur;
    return { x, y: round((level - 1) * 100, 1), n: cur.size };
  });
}
ProgressViews.strength = body => {
  const ix = Analytics.cur();
  const r = Analytics.range();
  const prv = Analytics.prevRange(r);
  const c = chartColors();
  const t = todayDN();
  const exIds = Object.keys(ix.sessions).filter(id => Ex.get(id) && Ex.type(Ex.get(id)) === 'kg').sort((a, b) => ix.sessions[b].length - ix.sessions[a].length);
  if (!exIds.length) { body.innerHTML = `<div class="card mt-16">${emptyState('chart', 'Noch keine Kraftdaten', 'Trainiere eine Übung mit Gewicht, um hier deinen Kraftverlauf zu sehen.')}</div>`; return; }
  const scope = ['total', 'exercise', 'muscle'].includes(UI.kraftScope) ? UI.kraftScope : 'total';
  const musOpts = MUSCLES.filter(m => exIds.some(id => isPrimary(id, m)));
  const muscle = musOpts.includes(UI.kraftMuscle) ? UI.kraftMuscle : musOpts[0];
  const exId = ix.sessions[UI.kraftEx] && exIds.includes(UI.kraftEx) ? UI.kraftEx : exIds[0];
  const big3Chips = BIG3.map(b => b.ids.find(id => ix.sessions[id])).filter(Boolean);
  const cb = chartBuilder();
  // Kraft im Vergleich: e1RM der meist-trainierten Übungen (der Auswahl), Start im Zeitraum = 100 %
  const cmpCard = ids => {
    const cmp = ids.map(id => ({ id, pts: sinceFix(ix.sessions[id], r.to).filter(s => s.dn >= r.from && s.dn <= r.to && s.best > 0) })).filter(x => x.pts.length >= 3).sort((a, b) => b.pts.length - a.pts.length).slice(0, 4)
      .map((x, i) => { let run = 0; return { id: x.id, color: c.series[i], pts: x.pts.map(s => { run = Math.max(run, s.best); return { x: s.dn, y: round(run / x.pts[0].best * 100, 1), label: `${nf(run / x.pts[0].best * 100, 0)} % (bestes e1RM ${fmtW(run)})` }; }) }; });
    const cmpTop = cmp.length ? cmp.reduce((a, b) => b.pts[b.pts.length - 1].y > a.pts[a.pts.length - 1].y ? b : a) : null;
    return cb.card({ id: 'k13', wide: true, title: 'Kraft im Vergleich', info: 'Bestes geschätztes 1RM bis zum jeweiligen Tag für deine meist-trainierten Übungen (mind. 3 Sessions im Zeitraum), bei der ersten Session im Zeitraum auf 100 % gesetzt. So siehst du auf einer Skala, welche Übung am schnellsten wächst.',
      big: cmpTop ? (cmpTop.pts[cmpTop.pts.length - 1].y >= 100 ? '+' : '') + nf(cmpTop.pts[cmpTop.pts.length - 1].y - 100, 0) + ' %' : '–', small: cmpTop ? Ex.name(cmpTop.id) : 'mind. 3 Sessions je Übung nötig',
      factory: () => cmp.length ? timeLine(cmp.map(x => lineDS(Ex.name(x.id), x.pts, x.color, { fill: false })), { legend: true, tooltipFmt: v => nf(v, 0) + ' %', yFmt: v => nf(v, 0) + ' %', thresholds: { axis: 'y', lines: [{ value: 100, label: 'Start', color: c.faint }] } }) : null });
  };
  // Tage seit letztem PR (für eine Übung oder eine Auswahl)
  const sincePRCard = (ids, firstDn) => {
    const ev = ix.prEvents.filter(p => ids.includes(p.exId));
    const last = ev[ev.length - 1];
    const fx = ids.length === 1 ? lastFix(ix.sessions[ids[0]] || []) : null, fixNewer = fx && (!last || fx.dn > last.dn);
    const since = fixNewer ? t - fx.dn : last ? t - last.dn : t - firstDn;
    return `<div class="chart-card">
        <div class="cc-head"><span class="cc-title">Tage seit letztem PR</span>${infoBtn(`Wird rot, wenn dein letzter Rekord ${ids.length > 1 ? 'in diesen Übungen' : 'in dieser Übung'} mehr als 60 Tage zurückliegt – Zeit für einen neuen Reiz (Deload, andere Wiederholungsbereiche, Variation).`)}</div>
        <div class="cc-big"><b style="font-size:46px;${since > 60 ? 'color:var(--danger)' : ''}">${since}</b><small>${since === 1 ? 'Tag' : 'Tage'}</small></div>
        <div class="cc-sub">${fixNewer ? `Seit dem Form-Fix am ${fmtDate(fx.date)} noch kein neuer PR` : last ? `Letzter PR: ${ids.length > 1 ? esc(Ex.name(last.exId)) + ' ' : ''}${fmtW(last.w)} × ${last.r} am ${fmtDate(last.date)}` : 'Noch kein PR – seit der ersten Session'}${since > 60 ? ' · ⚠ Zeit für einen neuen Reiz' : ''}</div>
      </div>`;
  };
  const head = `
    <div class="card mt-12">
      <div class="seg fit">${[['total', 'Gesamt'], ['exercise', 'Pro Übung'], ['muscle', 'Pro Muskelgruppe']].map(([k, l]) => `<button class="${scope === k ? 'active' : ''}" data-act="kraftScope" data-v="${k}">${l}</button>`).join('')}</div>
      ${scope === 'exercise' ? `<select class="select mt-12" data-ch="kraftEx" aria-label="Übung">${exIds.map(id => `<option value="${esc(id)}" ${id === exId ? 'selected' : ''}>${esc(Ex.name(id))} (${ix.sessions[id].length}×)</option>`).join('')}</select>
      ${big3Chips.length ? `<div class="chips mt-12">${big3Chips.map(id => `<button class="chip ${id === exId ? 'active' : ''}" data-act="kraftEx" data-v="${esc(id)}">${esc(BIG3.find(b => b.ids.includes(id)).label)}</button>`).join('')}</div>` : ''}` : ''}
      ${scope === 'muscle' ? `<select class="select mt-12" data-ch="kraftMuscle" aria-label="Muskelgruppe">${musOpts.map(m => `<option ${m === muscle ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>` : ''}
    </div>`;

  /* ----- Gesamt / Pro Muskelgruppe: Prozent-Ansicht (kg verschiedener Übungen lassen sich nicht addieren) ----- */
  if (scope !== 'exercise') {
    const ids = scope === 'muscle' ? exIds.filter(id => isPrimary(id, muscle)) : exIds;
    const what = scope === 'muscle' ? `deiner ${muscle}-Übungen (${muscle} als Hauptmuskel)` : 'aller Übungen';
    const gains = strengthGains(ix, ids, r);
    const idxPts = gainIndex(gains);
    const idxNow = idxPts.length ? idxPts[idxPts.length - 1].y : null;
    const top = gains.slice().sort((a, b) => b.gain - a.gain).slice(0, 8);
    const weeks = Analytics.weeksOf(r), ri = runIdx(weeks);
    const prR = ix.prEvents.filter(p => ids.includes(p.exId) && p.dn >= r.from && p.dn <= r.to);
    const prPrev = prv ? ix.prEvents.filter(p => ids.includes(p.exId) && p.dn >= prv.from && p.dn <= prv.to).length : null;
    const prW = weeks.map(w => prR.filter(p => p.dn >= w && p.dn < w + 7));
    const firstDn = Math.min(...ids.map(id => ix.sessions[id][0].dn));
    body.innerHTML = `${head}
    <div class="charts-grid">
      ${cb.card({ id: 'kx', wide: true, title: 'Kraftzuwachs', info: `Wie viel stärker du im Zeitraum geworden bist – als Durchschnitt ${what} mit mind. 3 Sessions. Je Übung zählt das beste geschätzte 1RM bis zum jeweiligen Tag im Vergleich zur ersten Session im Zeitraum. Übungen, die später dazukommen, starten neutral und ziehen den Schnitt nicht nach unten.`,
        big: idxNow != null ? (idxNow >= 0 ? '+' : '') + nf(idxNow, 1) + ' %' : '–', small: gains.length ? `Ø aus ${gains.length} ${gains.length === 1 ? 'Übung' : 'Übungen'}` : 'mind. 3 Sessions je Übung nötig',
        factory: () => idxPts.length > 1 ? timeLine([lineDS('Kraftzuwachs', idxPts.map(p => ({ x: p.x, y: p.y, label: `${p.y >= 0 ? '+' : ''}${nf(p.y, 1)} % (${p.n} Übungen)` })), c.accent)],
          { tooltipFmt: v => nf(v, 1) + ' %', yFmt: v => nf(v, 0) + ' %', yMin: 0 }) : null })}
      ${cb.card({ id: 'kt', title: 'Top-Aufsteiger', info: `Die Übungen mit dem größten Kraftzuwachs im Zeitraum: bestes geschätztes 1RM im Vergleich zur ersten Session im Zeitraum (mind. 3 Sessions).`, size: top.length > 5 ? 'lg' : '',
        big: top.length ? esc(Ex.name(top[0].id)) : '–', small: top.length ? `${top[0].gain >= 0 ? '+' : ''}${nf(top[0].gain, 0)} %` : 'mind. 3 Sessions je Übung nötig',
        factory: () => top.length ? barChart(top.map(g => Ex.name(g.id)), [barDS('Zuwachs', top.map(g => round(g.gain, 1)), top.map(g => g.gain > 0.05 ? c.accent : c.faint))],
          { horizontal: true, yFmt: v => nf(v, 0) + ' %', tooltipFmt: (v, ctx) => `${v >= 0 ? '+' : ''}${nf(v, 1)} % · ${fmtW(top[ctx.dataIndex].base)} → ${fmtW(top[ctx.dataIndex].best)}` }) : null })}
      ${cmpCard(ids)}
      ${cb.card({ id: 'kp', wide: true, title: 'PR-Timeline', info: `Neue Rekorde (geschätztes 1RM) ${what} pro Woche. Die laufende Woche ist blass.`,
        big: prR.length, small: 'PRs im Zeitraum', delta: deltaHtml(prR.length, prPrev, { fmt: d => (d > 0 ? '+' : '') + nf(d, 0) }), sub: prv ? prevLabel : '',
        factory: () => prR.length ? barChart(weeks.map(w => 'KW ' + isoWeek(w).week), [barDS('PRs', prW.map(x => x.length), c.accent)],
          { running: ri, tooltipFmt: (v, ctx) => `${v}${prW[ctx.dataIndex].length ? ' · ' + uniq(prW[ctx.dataIndex].map(p => Ex.name(p.exId))).slice(0, 3).join(', ') : ''}` }) : null })}
      ${sincePRCard(ids, firstDn)}
    </div>`;
    cb.mountAll();
    return;
  }

  /* ----- Pro Übung: kg-Karten ----- */
  const ss = ix.sessions[exId];
  const inR = ss.filter(s => s.dn >= r.from && s.dn <= r.to);
  // Form-Fix: Vergleiche, Trend und Bestwerte erst ab dem letzten Fix (im Zeitraum); ältere Werte bleiben blass sichtbar
  const fx = lastFix(ss.filter(s => s.dn <= r.to)), fixDn = fx ? fx.dn : -Infinity, fixInR = fx && fx.dn >= r.from;
  const inRF = inR.filter(s => s.dn >= fixDn);
  const inP = prv && (!fx || prv.from >= fixDn) ? ss.filter(s => s.dn >= prv.from && s.dn <= prv.to) : [];
  const bestNow = inRF.length ? maxOf(inRF, s => s.best) : null;
  const bestPrev = inP.length ? maxOf(inP, s => s.best) : null;
  const prEv = ix.prEvents.filter(p => p.exId === exId);
  const fixMarks = fixLines(ss, r.from, r.to);
  // laufendes Bestes e1RM (für Intensität) – startet beim Form-Fix neu
  let run = 0;
  const runBest = new Map();
  for (const s of ss) { if (s.fix) run = 0; run = Math.max(run, s.best); runBest.set(s, run); }
  const bench = BENCHMARKS[exId];
  const bwAll = Analytics.bwSeries();
  const hasBw = bwAll.length > 0;
  const bwR = bwAll.filter(p => p.dn >= r.from && p.dn <= r.to);
  // Rep-Maxima: schwerstes Gewicht für mind. n Wiederholungen (alle Sessions)
  const repMax = [];
  const ssF = sinceFix(ss);
  for (let n = 1; n <= 12; n++) {
    let best = null;
    for (const s of ssF) for (const x of s.list) if (!x.fix && x.r >= n && x.w > 0 && (!best || x.w > best.w || (x.w === best.w && s.dn < best.dn))) best = { n, w: x.w, r: x.r, dn: s.dn };
    if (best) repMax.push(best);
  }
  const newestRep = repMax.length ? repMax.reduce((a, b) => b.dn > a.dn ? b : a) : null;
  // Gewicht vs. Kraft: Veränderung im Zeitraum
  const e1Delta = inRF.length > 1 ? maxOf(inRF, s => s.best) - inRF[0].best : null;
  const bwDelta = bwR.length > 1 ? bwR[bwR.length - 1].kg - bwR[0].kg : null;
  const signKg = d => (d > 0.005 ? '+' : d < -0.005 ? '−' : '±') + fmtW(Math.abs(d));
  body.innerHTML = `${head}
    <div class="charts-grid">
      ${cb.card({ id: 'k1', wide: true, title: 'Geschätztes 1RM', info: 'Pro Session der beste Satz, umgerechnet mit Epley: Gewicht × (1 + Wdh./30). Gestrichelt: lineare Trendlinie im Zeitraum.',
        big: bestNow ? fmtW(bestNow) : '–', small: fixInR ? `bestes seit Form-Fix (${fmtDateShort(fx.date)})` : 'bestes im Zeitraum', delta: deltaHtml(bestNow, bestPrev), sub: inP.length ? prevLabel : '',
        factory: () => {
          if (!inR.length) return null;
          const pt = s => ({ x: s.dn, y: toU(s.best), label: `${fmtW(s.best)} (${fmtW(s.bestSet.w)} × ${s.bestSet.r})` });
          const pts = inRF.map(pt), old = inR.filter(s => s.dn < fixDn).map(pt);
          const ds = [...(old.length ? [lineDS('vor Form-Fix', old, c.faint, { fill: false })] : []), lineDS('e1RM', pts, c.accent)];
          const lr = pts.length >= 3 ? linReg(pts) : null;
          if (lr) ds.push({ label: 'Trend', data: [{ x: pts[0].x, y: lr.slope * pts[0].x + lr.intercept }, { x: pts[pts.length - 1].x, y: lr.slope * pts[pts.length - 1].x + lr.intercept }], borderColor: c.dim, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0 });
          return timeLine(ds, { tooltipFmt: v => fmtW(fromU(v)), legend: !!lr || old.length > 0, thresholds: fixMarks });
        } })}
      ${cb.card({ id: 'k12', wide: true, title: 'Rep-Maxima', info: 'Dein schwerstes Gewicht für mindestens 1, 2, 3 … 12 Wiederholungen – über alle Sessions dieser Übung. Wo zwei Balken fast gleich hoch sind, liegt dein nächster Rep-PR in Reichweite.',
        big: repMax.length ? fmtW(repMax[0].w) : '–', small: repMax.length ? (repMax[0].n === 1 && repMax[0].r === 1 ? 'echtes 1RM' : `schwerster Satz (${repMax[0].r} Wdh.)`) : '',
        sub: (newestRep ? `Neuester Rep-PR: ${fmtW(newestRep.w)} × ${newestRep.r} am ${fmtDN(newestRep.dn, { day: '2-digit', month: '2-digit', year: '2-digit' })}` : '') + (ssF !== ss ? ` · seit dem Form-Fix am ${fmtDate(ssF[0].date)}` : ''),
        factory: () => repMax.length ? barChart(repMax.map(x => x.n + '×'), [barDS('Bestes Gewicht', repMax.map(x => toU(x.w)), c.accent)],
          { tooltipFmt: (v, ctx) => `${fmtW(fromU(v))} für ${repMax[ctx.dataIndex].n}+ Wdh. · ${fmtDN(repMax[ctx.dataIndex].dn, { day: '2-digit', month: '2-digit', year: '2-digit' })}`, yFmt: v => nf(v, 0) }) : null })}
      ${cmpCard(exIds)}
      ${cb.card({ id: 'k2', title: 'Max-Gewicht pro Session', info: 'Schwerstes bewegtes Gewicht je Session (mind. 1 Wiederholung).',
        big: inRF.length ? fmtW(maxOf(inRF, s => s.maxW)) : '–', small: fixInR ? 'seit Form-Fix' : '',
        factory: () => inR.length ? timeLine([lineDS('Max-Gewicht', inR.map(s => ({ x: s.dn, y: toU(s.maxW), label: `${fmtW(s.maxW)} × ${s.repsAtMax}` })), c.accent, { pointRadius: 4, fill: false })], { tooltipFmt: v => fmtW(fromU(v)), thresholds: fixMarks }) : null })}
      ${cb.card({ id: 'k4', title: 'Trainings-Intensität', info: 'Schwerstes Gewicht der Session geteilt durch dein bis dahin bestes e1RM × 100 %. Zeigt, wie schwer du trainierst (z. B. 85 % ≈ 5er-Bereich).',
        big: inR.length ? nf(inR[inR.length - 1].maxW / runBest.get(inR[inR.length - 1]) * 100, 0) + ' %' : '–', small: 'letzte Session',
        factory: () => inR.length ? timeLine([lineDS('Intensität', inR.map(s => ({ x: s.dn, y: round(s.maxW / runBest.get(s) * 100, 1) })), c.accent)], { tooltipFmt: v => nf(v, 0) + ' %', yFmt: v => v + ' %', yMax: 100 }) : null })}
      ${cb.card({ id: 'k5', title: 'Relative Kraft', info: 'e1RM geteilt durch dein Körpergewicht am jeweiligen Tag. Linien: Richtwerte solide / fortgeschritten / elite (für Big 3 und Overhead Press).',
        big: hasBw && inR.length && Analytics.bwAt(inR[inR.length - 1].dn) ? nf(inR[inR.length - 1].best / Analytics.bwAt(inR[inR.length - 1].dn), 2) + ' ×' : '–', small: hasBw ? 'Körpergewicht' : 'Körpergewicht im Körper-Tab eintragen',
        factory: () => {
          if (!hasBw) return null;
          const pts = inR.map(s => { const bw = Analytics.bwAt(s.dn); return bw ? { x: s.dn, y: round(s.best / bw, 3) } : null; }).filter(Boolean);
          if (!pts.length) return null;
          const lines = bench ? [{ value: bench[0], label: 'solide', color: c.faint }, { value: bench[1], label: 'fortgeschritten', color: c.dim }, { value: bench[2], label: 'elite', color: c.accent }] : null;
          const ys = pts.map(p => p.y);
          return timeLine([lineDS('Relative Kraft', pts, c.accent)], { tooltipFmt: v => nf(v, 2) + ' × KG', yFmt: v => nf(v, 1), thresholds: lines ? { lines, axis: 'y' } : null, yMin: Math.max(0, Math.min(...ys, bench ? bench[0] : 99) - .2), yMax: bench ? Math.max(...ys, bench[2]) + .15 : undefined });
        } })}
      ${cb.card({ id: 'kgw', wide: true, title: 'Gewicht vs. Kraft', info: 'Geschätztes 1RM dieser Übung (linke Achse) und dein Körpergewicht als 7-Tage-Durchschnitt (rechte Achse) im selben Zeitraum. So siehst du, ob du stärker wirst, während du ab- oder zunimmst.',
        big: e1Delta != null ? signKg(e1Delta) : '–', small: e1Delta != null ? 'Kraft (e1RM)' : 'mind. 2 Sessions im Zeitraum nötig',
        sub: hasBw ? (bwDelta != null ? `Körpergewicht im selben Zeitraum: ${signKg(bwDelta)}` : 'Zu wenige Gewichts-Einträge im Zeitraum') : 'Körpergewicht im Körper-Tab eintragen',
        factory: () => {
          if (!inR.length || !bwR.length) return null;
          const ma = bwR.map(p => { const w = bwAll.filter(q => q.dn <= p.dn && q.dn > p.dn - 7); return { x: p.dn, y: toU(avg(w.map(q => q.kg))) }; });
          const cfg = timeLine([
            lineDS('e1RM', inR.map(s => ({ x: s.dn, y: toU(s.best) })), c.accent, { fill: false }),
            lineDS('Körpergewicht', ma, c.series[0], { fill: false, pointRadius: 0, yAxisID: 'y2' })
          ], { legend: true, tooltipFmt: v => fmtW(fromU(v)) });
          cfg.options.scales.y2 = { position: 'right', grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 5, callback: yAuto() } };
          return cfg;
        } })}
      ${cb.card({ id: 'k6', title: 'PR-Timeline', info: 'Jeder Punkt ist ein neuer e1RM-Rekord dieser Übung.',
        big: prEv.filter(p => p.dn >= r.from).length, small: 'PRs im Zeitraum',
        factory: () => {
          const pts = prEv.filter(p => p.dn >= r.from && p.dn <= r.to).map(p => ({ x: p.dn, y: toU(p.e1rm), label: `${fmtW(p.w)} × ${p.r}, am ${fmtDate(p.date)}` }));
          if (!pts.length) return null;
          const cfg = timeLine([{ label: 'PR', data: pts, backgroundColor: c.accent, borderColor: c.surface, borderWidth: 2, pointRadius: 6, pointHoverRadius: 8, showLine: false }], { thresholds: fixMarks });
          cfg.type = 'scatter';
          cfg.options.interaction = { mode: 'nearest', intersect: false };
          return cfg;
        } })}
      ${sincePRCard([exId], ss[0].dn)}
    </div>`;
  cb.mountAll();
};
Actions.kraftScope = el => { UI.kraftScope = el.dataset.v; saveUI(); App.renderCurrent(); };
Changes.kraftMuscle = el => { UI.kraftMuscle = el.value; saveUI(); App.renderCurrent(); };
Changes.kraftEx = el => { UI.kraftEx = el.value; saveUI(); App.renderCurrent(); };
Actions.kraftEx = el => { UI.kraftEx = el.dataset.v; saveUI(); App.renderCurrent(); };

/* ---------- Volumen ---------- */
function binsOfList(list) { const b = [0, 0, 0, 0]; for (const x of list) if (x.r > 0) b[x.r <= 5 ? 0 : x.r <= 10 ? 1 : x.r <= 15 ? 2 : 3]++; return b; }
function scopeItems(ix, scope) {
  if (scope === 'exercise') return (ix.sessions[UI.volEx] || []).map(s => ({ dn: s.dn, ton: s.vol, sets: s.sets, reps: s.reps, bins: binsOfList(s.list), name: Ex.name(UI.volEx) }));
  if (scope === 'muscle') {
    const m = UI.volMuscle;
    const sessByW = {};
    for (const [id, ss] of Object.entries(ix.sessions)) {
      const ex = Ex.get(id);
      if (!ex || !isPrimary(ex, m)) continue;
      for (const s of ss) (sessByW[s.wid] || (sessByW[s.wid] = [])).push(s);
    }
    return ix.rows.filter(w => w.mP[m]).map(w => {
      const ss = sessByW[w.id] || [];
      return { dn: w.dn, ton: sum(ss.map(s => s.vol)), sets: w.mP[m], reps: sum(ss.map(s => s.reps)), bins: ss.reduce((b, s) => binsOfList(s.list).map((v, i) => v + b[i]), [0, 0, 0, 0]), name: w.name };
    });
  }
  return ix.rows.map(w => ({ dn: w.dn, ton: w.ton, sets: w.sets, reps: w.reps, bins: w.bins, name: w.name, restAvg: w.restAvg }));
}
ProgressViews.volume = body => {
  const ix = Analytics.cur();
  const r = Analytics.range();
  const prv = Analytics.prevRange(r);
  const c = chartColors();
  const scope = UI.volScope;
  const exOpts = Object.keys(ix.sessions).filter(id => Ex.get(id) && Ex.type(Ex.get(id)) !== 'cardio').sort((a, b) => Ex.name(a).localeCompare(Ex.name(b), 'de'));
  if (!exOpts.includes(UI.volEx) && exOpts.length) UI.volEx = exOpts.find(id => Ex.type(Ex.get(id)) === 'kg') || exOpts[0];
  const items = scopeItems(ix, scope);
  const inR = items.filter(x => x.dn >= r.from && x.dn <= r.to);
  const inP = prv ? items.filter(x => x.dn >= prv.from && x.dn <= prv.to) : null;
  const weeks = Analytics.weeksOf(r);
  const wk = f => weeks.map(w => sum(inR.filter(x => x.dn >= w && x.dn < w + 7).map(f)));
  const wLabels = weeks.map(w => 'KW ' + isoWeek(w).week);
  const tonW = wk(x => x.ton), setsW = wk(x => x.sets), repsW = wk(x => x.reps);
  const tot = f => sum(inR.map(f)), totP = f => inP ? sum(inP.map(f)) : null;
  // Ø-Linie ohne die laufende Woche – sie ist noch nicht vorbei
  const ri = runIdx(weeks);
  const avgLine = (vals, label = 'Ø') => ({ type: 'line', label, isAvg: true, data: vals.map(() => avgDone(vals, ri)), borderColor: c.dim, borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, fill: false });
  // Wochentage
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const x of inR) wd[(dowOfDN(x.dn) + 6) % 7] += x.ton;
  // Top 10
  const exVol = {};
  for (const w of ix.rows) if (w.dn >= r.from && w.dn <= r.to) for (const [id, v] of Object.entries(w.exVol)) {
    if (scope === 'muscle' && !isPrimary(id, UI.volMuscle)) continue;
    exVol[id] = (exVol[id] || 0) + v;
  }
  const top10 = Object.entries(exVol).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  // Jahresvergleich (kumuliert nach KW)
  const y = new Date().getFullYear();
  const cum = yr => { const per = new Array(53).fill(0); for (const x of items) { const iw = isoWeek(x.dn); if (iw.year === yr) per[iw.week - 1] += x.ton; } let s = 0; return per.map(v => (s += v)); };
  const curW = isoWeek(todayDN()).week;
  const thisY = cum(y).map((v, i) => i < curW ? toU(v) : null), lastY = cum(y - 1).map(v => toU(v));
  // Dichte (nur Gesamt): echte Dauer, ohne reine Cardio-Einheiten
  const durRows = ix.rows.filter(w => w.dn >= r.from && w.dn <= r.to && w.dur > 0 && !w.estDur);
  // Pro Workout-Typ (nur Gesamt): nach Workout-Name gruppiert, z. B. „Push A" und „Push B" getrennt
  const typeMap = new Map();
  for (const w of ix.rows) if (w.dn >= r.from && w.dn <= r.to && w.ton > 0 && !w.cardioOnly) { if (!typeMap.has(w.name)) typeMap.set(w.name, []); typeMap.get(w.name).push(w); }
  const types = [...typeMap].filter(([, ws]) => ws.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([name, ws], i) => {
      const k = Math.min(3, Math.floor(ws.length / 2));
      const first = avg(ws.slice(0, k).map(w => w.ton)), last = avg(ws.slice(-k).map(w => w.ton));
      return { name, ws, color: c.series[i], avgTon: avg(ws.map(w => w.ton)), first, last };
    });
  const dens = durRows.filter(w => w.ton > 0 && w.dur >= 600 && !w.cardioOnly).map(w => ({ x: w.dn, y: round(toU(w.ton) / (w.dur / 60), 1), label: `${nf(toU(w.ton) / (w.dur / 60), 0)} ${unit()}/min · ${w.name}` }));
  // Pro Muskelgruppe: mitgeholfene Sätze (Muskel ist bei der Übung nicht Hauptmuskel) blass dazu
  const mm = UI.volMuscle, rowsR = ix.rows.filter(w => w.dn >= r.from && w.dn <= r.to);
  const helpW = scope === 'muscle' ? weeks.map(w => sum(rowsR.filter(x => x.dn >= w && x.dn < w + 7).map(x => x.mS[mm] || 0))) : null;
  const helpEx = {};
  if (scope === 'muscle') for (const w of rowsR) for (const [id, n] of Object.entries(w.exSets)) { const g = (Ex.get(id) || {}).muscleGroups || []; if (g.indexOf(mm) > 0) helpEx[id] = (helpEx[id] || 0) + n; }
  const helpTop = Object.entries(helpEx).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => Ex.name(id));
  const cb = chartBuilder();
  const scopeName = scope === 'exercise' ? Ex.name(UI.volEx) : scope === 'muscle' ? `Übungen mit ${UI.volMuscle} als Hauptmuskel` : 'alle Übungen';
  body.innerHTML = `
    <div class="card mt-12">
      <div class="seg fit">${[['total', 'Gesamt'], ['exercise', 'Pro Übung'], ['muscle', 'Pro Muskelgruppe']].map(([k, l]) => `<button class="${scope === k ? 'active' : ''}" data-act="volScope" data-v="${k}">${l}</button>`).join('')}</div>
      ${scope === 'exercise' ? `<select class="select mt-12" data-ch="volEx" aria-label="Übung">${exOpts.map(id => `<option value="${esc(id)}" ${id === UI.volEx ? 'selected' : ''}>${esc(Ex.name(id))}</option>`).join('')}</select>` : ''}
      ${scope === 'muscle' ? `<select class="select mt-12" data-ch="volMuscle" aria-label="Muskelgruppe">${MUSCLES.map(m => `<option ${m === UI.volMuscle ? 'selected' : ''}>${m}</option>`).join('')}</select>` : ''}
    </div>
    <div class="charts-grid">
      ${cb.card({ id: 'v1', wide: true, title: 'Tonnage pro Woche', info: `Σ Wiederholungen × Gewicht pro Kalenderwoche (${scopeName}). Gestrichelt: Durchschnitt der abgeschlossenen Wochen. Die laufende Woche ist blass.`,
        big: fmtTon(tot(x => x.ton)), small: 'im Zeitraum', delta: deltaHtml(tot(x => x.ton), totP(x => x.ton)), sub: prv ? prevLabel : '',
        factory: () => inR.length ? barChart(wLabels, [barDS('Tonnage', tonW.map(toU), c.accent), avgLine(tonW.map(toU))], { running: ri, tooltipFmt: v => fmtTon(fromU(v)), yFmt: v => nf(v / (unit() === 'kg' && v >= 1000 ? 1000 : 1), 1) + (unit() === 'kg' && v >= 1000 ? ' t' : '') }) : null })}
      ${scope === 'muscle' ? cb.card({ id: 'v2', title: 'Sätze pro Woche', info: `Kräftig: direkte Sätze – Übungen, bei denen ${mm} der Hauptmuskel ist. Blass: Sätze, bei denen ${mm} nur mithilft (z. B. Bizeps beim Klimmzug oder Rudern). Gestrichelt: Ø der direkten Sätze. Die laufende Woche ist heller.`,
          big: nf(tot(x => x.sets), 0), small: 'direkte Sätze', delta: deltaHtml(tot(x => x.sets), totP(x => x.sets)),
          sub: sum(helpW) ? `+ ${nf(sum(helpW), 0)} mitgeholfen${helpTop.length ? ` (${esc(helpTop.join(', '))})` : ''}` : '',
          factory: () => inR.length || sum(helpW) ? barChart(wLabels, [
            barDS('Direkt', setsW, c.accent, { borderRadius: 0 }),
            barDS('Mitgeholfen', helpW, alpha(c.accent, .3), { runAlpha: .12 }),
            avgLine(setsW)], { stacked: true, legend: true, running: ri, tooltipFmt: v => `${nf(v, 0)} Sätze` }) : null })
        : cb.card({ id: 'v2', title: 'Sätze pro Woche', info: 'Anzahl erledigter Arbeitssätze pro Woche. Die laufende Woche ist blass.', big: nf(tot(x => x.sets), 0), small: 'Sätze', delta: deltaHtml(tot(x => x.sets), totP(x => x.sets)),
        factory: () => inR.length ? barChart(wLabels, [barDS('Sätze', setsW, c.accent), avgLine(setsW)], { running: ri, tooltipFmt: v => nf(v, 0) }) : null })}
      ${cb.card({ id: 'v3', title: 'Wiederholungen pro Woche', info: 'Summe aller Wiederholungen pro Woche. Die laufende Woche ist blass.', big: nf(tot(x => x.reps), 0), small: 'Wdh.', delta: deltaHtml(tot(x => x.reps), totP(x => x.reps)),
        factory: () => inR.length ? barChart(wLabels, [barDS('Wiederholungen', repsW, c.accent), avgLine(repsW)], { running: ri, tooltipFmt: v => nf(v, 0) }) : null })}
      ${cb.card({ id: 'v4', wide: true, title: scope === 'total' ? 'Volumen pro Workout' : 'Volumen pro Session', info: 'Jeder Punkt ist ein Workout. Die Linie ist der Durchschnitt der jeweils letzten 3 Wochen – so siehst du den Trend, ohne dass Push-, Pull- und Beintage durcheinanderspringen.',
        big: inR.length ? fmtTon(avg(inR.map(x => x.ton))) : '–', small: 'Ø', delta: inP && inP.length ? deltaHtml(avg(inR.map(x => x.ton)), avg(inP.map(x => x.ton))) : '',
        factory: () => {
          if (inR.length < 2) return null;
          const pts = inR.map(x => ({ x: x.dn, y: toU(x.ton), label: `${fmtTon(x.ton)}${x.name ? ' · ' + x.name : ''}` }));
          return timeLine([
            lineDS('Workout', pts, c.faint, { showLine: false, fill: false, pointRadius: 3, pointBackgroundColor: c.faint, pointBorderWidth: 0 }),
            lineDS('Ø 3 Wochen', timeAvg(pts), c.accent, { fill: false, pointRadius: 0 })
          ], { legend: true, tooltipFmt: v => fmtTon(fromU(v)) });
        } })}
      ${scope === 'total' ? `${cb.card({ id: 'vt', wide: true, title: 'Volumen pro Workout-Typ', info: 'Volumen je Workout, getrennt nach Workout-Name (z. B. „Push A" und „Push B" einzeln) – so vergleichst du gleiche Trainingstage miteinander. Die 5 häufigsten Workouts mit mind. 2 Einheiten im Zeitraum. Trend: Ø der letzten 3 Einheiten gegen die ersten 3.',
        big: types.length ? nf(types.length, 0) : '–', small: types.length ? (types.length === 1 ? 'Workout-Typ' : 'Workout-Typen') : 'mind. 2 gleichnamige Workouts nötig',
        factory: () => types.length ? timeLine(types.map(tp => lineDS(tp.name, tp.ws.map(w => ({ x: w.dn, y: toU(w.ton), label: fmtTon(w.ton) })), tp.color, { fill: false, pointRadius: 3 })), { legend: true, tooltipFmt: v => fmtTon(fromU(v)) }) : null,
        extra: types.length ? `<div class="mt-8">${types.map(tp => `<div class="ratio-row small"><span class="ampel-dot" style="background:${tp.color}"></span><span class="grow">${esc(tp.name)} <span class="dim">${tp.ws.length}×</span></span><span class="dim">Ø ${fmtTon(tp.avgTon)}</span>${deltaHtml(tp.last, tp.first)}</div>`).join('')}</div>` : '' })}
      ${cb.card({ id: 'v12', title: 'Trainingsdichte', info: 'Tonnage pro Trainingsminute je Workout (kg/min). Steigt sie, schaffst du mehr Arbeit in derselben Zeit. Linie: Ø der letzten 3 Wochen.',
        big: dens.length ? nf(avg(dens.map(p => p.y)), 0) : '–', small: unit() + '/min Ø',
        factory: () => dens.length > 1 ? timeLine([
          lineDS('Workout', dens, c.faint, { showLine: false, fill: false, pointRadius: 3, pointBackgroundColor: c.faint, pointBorderWidth: 0 }),
          lineDS('Ø 3 Wochen', timeAvg(dens), c.accent, { fill: false, pointRadius: 0 })
        ], { legend: true, tooltipFmt: v => nf(v, 0) + ' ' + unit() + '/min' }) : null })}` : ''}
      ${cb.card({ id: 'v5', title: 'Volumen nach Wochentag', info: 'An welchen Wochentagen passiert die meiste Arbeit? Tonnage im Zeitraum je Wochentag.',
        factory: () => sum(wd) ? barChart(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], [barDS('Tonnage', wd.map(toU), c.accent)], { tooltipFmt: v => fmtTon(fromU(v)), yFmt: v => unit() === 'kg' && v >= 1000 ? nf(v / 1000, 0) + ' t' : nf(v, 0) }) : null })}
      ${cb.card({ id: 'v6', title: scope === 'muscle' ? `Top-Übungen ${UI.volMuscle}` : 'Volumen pro Übung (Top 10)', info: 'Deine meist-trainierten Übungen im Zeitraum nach Tonnage.', size: 'lg',
        factory: () => top10.length ? barChart(top10.map(([id]) => Ex.name(id)), [barDS('Tonnage', top10.map(([, v]) => toU(v)), c.accent)], { horizontal: true, tooltipFmt: v => fmtTon(fromU(v)), yFmt: v => unit() === 'kg' && v >= 1000 ? nf(v / 1000, 0) + ' t' : nf(v, 0) }) : null })}
      ${cb.card({ id: 'v7', title: 'Volumen-Trend pro Übung', info: 'Volumen je Session für die gewählte Übung mit Trendlinie.',
        top: scope !== 'exercise' ? `<select class="select mt-8" data-ch="volEx" style="min-height:38px;padding-top:4px;padding-bottom:4px" aria-label="Übung">${exOpts.map(id => `<option value="${esc(id)}" ${id === UI.volEx ? 'selected' : ''}>${esc(Ex.name(id))}</option>`).join('')}</select>` : '',
        factory: () => {
          const ss = (ix.sessions[UI.volEx] || []).filter(s => s.dn >= r.from && s.dn <= r.to && s.vol > 0);
          if (!ss.length) return null;
          const pts = ss.map(s => ({ x: s.dn, y: toU(s.vol) }));
          const lr = pts.length >= 3 ? linReg(pts) : null;
          const ds = [lineDS(Ex.name(UI.volEx), pts, c.accent)];
          if (lr) ds.push({ label: 'Trend', data: [{ x: pts[0].x, y: lr.slope * pts[0].x + lr.intercept }, { x: pts[pts.length - 1].x, y: lr.slope * pts[pts.length - 1].x + lr.intercept }], borderColor: c.dim, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0 });
          return timeLine(ds, { tooltipFmt: v => fmtTon(fromU(v)) });
        } })}
      ${cb.card({ id: 'v8', wide: true, title: 'Set-Intensitäts-Mix', info: 'Anteil deiner Sätze je Wiederholungsbereich pro Woche: 1–5 = Kraft, 6–10 = Hypertrophie/Kraft, 11–15 = Hypertrophie, 16+ = Kraftausdauer.',
        factory: () => {
          const bw = weeks.map(w => inR.filter(x => x.dn >= w && x.dn < w + 7).reduce((b, x) => x.bins.map((v, i) => v + b[i]), [0, 0, 0, 0]));
          if (!sum(bw.map(sum))) return null;
          const pctOf = i => bw.map(b => sum(b) ? round(b[i] / sum(b) * 100, 1) : 0);
          return barChart(wLabels, ['1–5', '6–10', '11–15', '16+'].map((l, i) => barDS(`${l} Wdh.`, pctOf(i), c.series[i], { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 2 } })), { stacked: true, legend: true, xMax: 100, running: ri, yFmt: v => v + ' %', tooltipFmt: v => nf(v, 0) + ' %' });
        } })}
      ${cb.card({ id: 'v9', wide: true, title: `Tonnage ${y} vs. ${y - 1}`, info: 'Kumulierte Tonnage nach Kalenderwoche – dieses Jahr gegen das Vorjahr. Unabhängig vom Zeitraum-Filter.',
        big: fmtTon(fromU(thisY[curW - 1] || 0)), small: `bis KW ${curW}`, delta: deltaHtml(thisY[curW - 1] || 0, lastY[curW - 1] || 0), sub: `vs. ${y - 1} bis KW ${curW}`,
        factory: () => (sum(lastY.map(v => v || 0)) || (thisY[curW - 1] || 0)) ? {
          type: 'line',
          data: { labels: Array.from({ length: 53 }, (_, i) => 'KW ' + (i + 1)), datasets: [
            { label: String(y), data: thisY, borderColor: c.accent, backgroundColor: alpha(c.accent, .1), fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 },
            { label: String(y - 1), data: lastY, borderColor: c.series[0], fill: false, tension: .3, pointRadius: 0, borderWidth: 2 }] },
          options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtTon(fromU(ctx.parsed.y))}` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0 } }, y: { grid: { color: c.grid }, ticks: { maxTicksLimit: 5, callback: v => unit() === 'kg' ? nf(v / 1000, 0) + ' t' : nf(v / 1000, 0) + 'k' } } } }
        } : null })}
    </div>`;
  cb.mountAll();
};
Actions.volScope = el => { UI.volScope = el.dataset.v; saveUI(); App.renderCurrent(); };
Changes.volEx = el => { UI.volEx = el.value; saveUI(); App.renderCurrent(); };
Changes.volMuscle = el => { UI.volMuscle = el.value; saveUI(); App.renderCurrent(); };

/* ---------- Muskeln (detailliert): 36 Regionen statt 14 Gruppen ---------- */
/* key: [Anzeigename, übergeordnete Muskelgruppe] */
const REGIONS = {
  brust_o: ['Obere Brust (Schlüsselbein-Anteil)', 'Brust'], brust_m: ['Mittlere Brust', 'Brust'], brust_u: ['Untere Brust', 'Brust'],
  serratus: ['Sägemuskel (Serratus)', 'Brust'],
  delt_v: ['Vordere Schulter', 'Schulter'], delt_s: ['Seitliche Schulter', 'Schulter'], delt_h: ['Hintere Schulter', 'Hintere Schulter'],
  rotatoren: ['Rotatorenmanschette (Infraspinatus)', 'Hintere Schulter'],
  bizeps: ['Bizeps', 'Bizeps'], brachialis: ['Brachialis & Oberarmspeichenmuskel', 'Bizeps'],
  trizeps_l: ['Trizeps – langer Kopf', 'Trizeps'], trizeps_s: ['Trizeps – seitlicher Kopf', 'Trizeps'],
  unterarm_f: ['Unterarm-Beuger', 'Unterarme'], unterarm_e: ['Unterarm-Strecker', 'Unterarme'],
  trap_o: ['Oberer Trapez (Nacken)', 'Trapez'], trap_m: ['Mittlerer Trapez', 'Trapez'], trap_u: ['Unterer Trapez', 'Trapez'],
  rhomboiden: ['Rhomboiden', 'Rücken'], lat: ['Latissimus', 'Rücken'], teres: ['Großer Rundmuskel (Teres)', 'Rücken'],
  ruecken_u: ['Unterer Rücken (Rückenstrecker)', 'Unterer Rücken'],
  bauch_o: ['Obere Bauchmuskeln', 'Bauch'], bauch_u: ['Untere Bauchmuskeln', 'Bauch'], obliques: ['Seitliche Bauchmuskeln', 'Bauch'],
  hueftbeuger: ['Hüftbeuger', 'Bauch'],
  quad_rf: ['Gerader Schenkelmuskel (Rectus femoris)', 'Quadrizeps'], quad_vl: ['Äußerer Quadrizeps (Vastus lateralis)', 'Quadrizeps'],
  quad_vm: ['Innerer Quadrizeps (Vastus medialis)', 'Quadrizeps'],
  adduktoren: ['Adduktoren', 'Adduktoren'], abduktoren: ['Abduktoren / mittlerer Gesäßmuskel', 'Abduktoren'],
  gluteus: ['Gesäß (großer Gesäßmuskel)', 'Gesäß'],
  hamstrings_l: ['Beinbeuger außen (Biceps femoris)', 'Beinbeuger'], hamstrings_m: ['Beinbeuger innen (Semitendinosus)', 'Beinbeuger'],
  waden: ['Waden (Zwillingswadenmuskel)', 'Waden'], soleus: ['Schollenmuskel (Soleus)', 'Waden'], tibialis: ['Schienbein (Tibialis)', 'Waden']
};
/** Regionen einer Übung: Hauptmuskel zählt 1, Hilfsmuskeln 0,5 – verfeinert über Name & Aliase */
const _regCache = new Map();
function exRegions(ex) {
  if (!ex) return {};
  const key = ex.id + '|' + (ex.muscleGroups || []).join(',') + '|' + ex.name;
  if (_regCache.has(key)) return _regCache.get(key);
  const n = norm([ex.name, ...(ex.aliases || [])].join(' '));
  const has = re => re.test(n);
  const out = {};
  const add = (regs, w) => regs.forEach(r => { out[r] = Math.max(out[r] || 0, w); });
  (ex.muscleGroups || []).forEach((m, i) => {
    const w = i === 0 ? 1 : 0.5;
    switch (m) {
      case 'Brust':
        if (has(/schräg|incline|von unten|low to high|landmine/)) { add(['brust_o'], w); add(['brust_m'], w * .5); }
        else if (has(/negativ|decline|dip|von oben|high to low/)) { add(['brust_u'], w); add(['brust_m'], w * .5); }
        else { add(['brust_m'], w); add(['brust_o', 'brust_u'], w * .5); }
        if (has(/liegestütz|push.?up|pullover|plus|serratus/)) add(['serratus'], w * .5);
        break;
      case 'Schulter':
        if (has(/außenrot|aussenrot|innenrot|external rot|internal rot|rotator|cuban/)) add(['rotatoren'], w);
        else if (has(/seitheb|lateral|upright|aufrecht/)) add(['delt_s'], w);
        else if (has(/front raise|frontheb/)) add(['delt_v'], w);
        else if (has(/bank|bench|dip|liegestütz|push.?up|fly|flie|brust|chest|floor/)) add(['delt_v'], w);
        else if (has(/arnold/)) add(['delt_v', 'delt_s'], w);
        else { add(['delt_v'], w); add(['delt_s'], w * .6); add(['serratus'], w * .3); }
        if (has(/upright|aufrecht/)) add(['trap_o'], w * .5);
        break;
      case 'Hintere Schulter':
        add(['delt_h'], w); add(['rotatoren'], w * .5);
        if (has(/face|reverse|butterfly|fly|flie|pull.?apart/)) add(['trap_m', 'rhomboiden'], w * .4);
        break;
      case 'Bizeps':
        if (has(/hammer|neutral|seil|rope|cross.?body|zottman/)) { add(['brachialis'], w); add(['bizeps'], w * .6); }
        else if (has(/reverse|obergriff|overhand|pronated/)) { add(['brachialis'], w); add(['unterarm_e'], w * .5); add(['bizeps'], w * .4); }
        else { add(['bizeps'], w); add(['brachialis'], w * .4); }
        break;
      case 'Trizeps':
        if (has(/über.?kopf|overhead|french|skull|stirn|liegend|lying|katana|jm press|tate/)) { add(['trizeps_l'], w); add(['trizeps_s'], w * .6); }
        else { add(['trizeps_s'], w); add(['trizeps_l'], w * .6); }
        break;
      case 'Unterarme':
        if (has(/reverse|strecker|extension|obergriff/)) add(['unterarm_e'], w);
        else { add(['unterarm_f'], w); add(['unterarm_e'], w * .4); }
        break;
      case 'Rücken':
        if (has(/pullover|straight.?arm|überzug/)) { add(['lat'], w); add(['teres'], w * .7); add(['serratus'], w * .4); }
        else if (has(/lat|klimm|pull.?up|chin|pulldown|latzug|hang/)) { add(['lat'], w); add(['teres'], w * .8); add(['rhomboiden', 'trap_u'], w * .4); }
        else if (has(/rudern|row|face|reverse|seal|pendlay|meadows/)) { add(['rhomboiden', 'trap_m'], w); add(['lat'], w * .8); add(['teres'], w * .6); add(['trap_u', 'delt_h'], w * .4); }
        else if (has(/kreuzheb|deadlift|rack/)) { add(['trap_m', 'rhomboiden', 'lat'], w * .6); add(['trap_o'], w * .4); }
        else { add(['lat'], w); add(['rhomboiden', 'trap_m'], w * .7); add(['teres'], w * .6); }
        break;
      case 'Trapez':
        if (has(/y.?raise|y.?heb|prone y|lower trap/)) add(['trap_u'], w);
        else if (has(/shrug|schulterheb|farmer|carry|clean|snatch|umsetz|reiß|upright|aufrecht|rack/)) add(['trap_o'], w);
        else if (has(/face|reverse|rudern|row|pull.?apart|fly/)) { add(['trap_m', 'rhomboiden'], w); add(['trap_u'], w * .5); }
        else { add(['trap_o'], w); add(['trap_m'], w * .6); }
        break;
      case 'Unterer Rücken': add(['ruecken_u'], w); break;
      case 'Bauch':
        if (has(/twist|side|seit|oblique|woodchop|pallof|bicycle|copenhagen|suitcase/)) add(['obliques'], w);
        else if (has(/leg raise|beinheb|knee raise|knieheb|hanging|l.?sit|v.?up|mountain|reverse crunch|dragon/)) { add(['bauch_u'], w); add(['hueftbeuger'], w * .75); add(['bauch_o'], w * .5); }
        else if (has(/plank|stütz|hollow|ab wheel|rollout|bear/)) { add(['bauch_o', 'bauch_u'], w); add(['obliques'], w * .7); }
        else { add(['bauch_o'], w); add(['bauch_u'], w * .6); if (has(/sit.?up|situp/)) add(['hueftbeuger'], w * .5); }
        break;
      case 'Quadrizeps':
        if (has(/beinstreck|leg extension|extension|sissy/)) { add(['quad_rf'], w); add(['quad_vl', 'quad_vm'], w * .8); }
        else if (has(/eng|narrow|heel|ferse|cyclist|spanish|step/)) { add(['quad_vm'], w); add(['quad_vl'], w * .8); add(['quad_rf'], w * .6); }
        else { add(['quad_vl', 'quad_vm'], w); add(['quad_rf'], w * .6); }
        if (has(/sumo|ausfall|lunge|split|bulgarian|goblet|step/)) add(['adduktoren'], .5);
        break;
      case 'Gesäß': add(['gluteus'], w); if (has(/abduk|hip thrust|bridge|split|lunge|ausfall|bulgarian|step|kickback|monster|band walk|einbeinig|single leg|pistol/)) add(['abduktoren'], .5); break;
      case 'Beinbeuger':
        if (has(/sitzend|seated|nordic/)) { add(['hamstrings_m'], w); add(['hamstrings_l'], w * .8); }
        else add(['hamstrings_l', 'hamstrings_m'], w);
        break;
      case 'Adduktoren': add(['adduktoren'], w); break;
      case 'Abduktoren': add(['abduktoren'], w); break;
      case 'Waden':
        if (has(/tibialis|tib raise|schienbein/)) add(['tibialis'], w);
        else if (has(/sitzend|seated/)) add(['soleus'], w);
        else if (has(/stehend|standing|einbeinig|single|beinpresse|press|jump|seil|steigung|incline/)) { add(['waden'], w); add(['soleus'], w * .5); }
        else add(['waden', 'soleus'], w);
        break;
    }
  });
  _regCache.set(key, out);
  return out;
}

/* Körper-Grafik 200×440 – linke Bildhälfte definiert, rechte gespiegelt */
const BODY = {
  // Silhouette (linke Hälfte, Mittellinie x=100)
  sil: 'M100 58L92 58C92 65 91 70 88 73C82 77 74 79 68 82C60 85 55 92 53 102C51 112 51 122 50 132C49 142 47 150 45 158C42 172 39 188 37 202C36 208 35 212 34 216C30 220 25 226 23 234C22 240 25 243 28 241L31 235C31 241 33 247 36 247C38 247 39 244 39 240L39 247C40 250 44 250 44 246L43 238C45 241 48 240 47 236L46 226C47 221 47 217 46 213C48 202 51 188 54 175C56 167 58 159 60 151C62 140 64 129 66 119C69 131 72 144 74 156C75 168 74 182 72 196C70 210 69 226 70 244C71 264 74 284 77 300C76 314 74 328 75 344C77 362 81 378 83 392C82 398 78 404 76 410C82 415 92 415 96 410C96 402 95 396 94 390C95 374 96 356 95 338C94 322 95 310 96 300C98 280 99 256 99 232L100 222Z',
  head: '<ellipse cx="100" cy="36" rx="16" ry="20"/><path d="M84 38c-3 0-4 6-1 10l2 1zM116 38c3 0 4 6 1 10l-2 1z"/>',
  front: {
    single: {
      bauch_o: ['M90 124h9v16h-9z', 'M101 124h9v16h-9z', 'M90 142h9v17h-9z', 'M101 142h9v17h-9z'],
      bauch_u: ['M90 161h9v16h-9z', 'M101 161h9v16h-9z', 'M90 179h9v34c-4-1-7-8-9-18z', 'M101 179h9v16c-2 10-5 17-9 18z']
    },
    paired: {
      trap_o: ['M91 63C89 70 84 75 76 79L95 80C94 74 93 68 91 63Z'],
      delt_s: ['M68 82C60 84 54 92 52 104C51 112 52 120 55 127C57 116 59 106 62 98C64 92 66 87 68 82Z'],
      delt_v: ['M69 82C66 88 63 96 62 104C60 112 58 120 56 127C62 123 66 116 68 108C70 100 72 92 75 84Z'],
      brust_o: ['M99 82L76 84C73 88 71 92 70 96C79 93 89 92 99 93Z'],
      brust_m: ['M99 94.5C89 93.5 79 94.5 70 97.5C68.5 101 68 105 68 108C78 106.5 89 107.5 99 109.5Z'],
      brust_u: ['M99 111C89 109 78 108 68 109.5C68 113 70 116 74 119C82 124 92 124 99 121Z'],
      serratus: ['M71 119L81 122L76 127Z', 'M72 128L81 131L77 136Z', 'M73 137L80 140L76 145Z'],
      bizeps: ['M56 124C53 133 51.5 141 51 147C54 150 58 149 60 145C62 137 64 129 66 120C62 120 58 121 56 124Z'],
      brachialis: ['M51 149C50.5 151 50.2 153 50 154.5C54 158 58 156 60 150L60 147C58 151 54 152 51 149Z',
        'M46 158C42 170 40 180 39 188C42 186 45 180 48 172C50 166 53 162 55 160C51 157 48 157 46 158Z'],
      trizeps_s: ['M53 106C51 118 50 130 48 146L50 154C51 140 53 130 56 124C54 118 53 112 53 106Z'],
      unterarm_f: ['M56 160C51 176 47 191 43 205L37 213L45 214C48 202 52 186 59 157Z',
        'M39.5 191C42 188 44.5 184 47 179C45.5 187 43.5 195 42 203L37 200C37.8 197 38.6 194 39.5 191Z'],
      obliques: ['M83 123L88 125L88 193C83 190 79 187 76 183C76 169 75 157 75 147C78 137 80 129 83 123Z'],
      hueftbeuger: ['M77 192C83 197 89 205 93 214L89 219C84 210 79 202 75 197Z'],
      abduktoren: ['M74 194C71.5 198 70.5 203 71 208L74 211C75.5 206 75.5 200 74.5 196Z'],
      quad_vl: ['M73 212C70 230 70 256 74 280C76 290 78 296 80 301L83 299C80 281 78 257 79 233C79 225 77 218 73 212Z'],
      quad_rf: ['M80 220C79 244 80 268 84 293L90 297C92 273 92 247 90 227C87 223 83 221 80 220Z'],
      quad_vm: ['M92 262C90 274 90 286 92 297L97 301C99 291 99 279 97 266Z'],
      adduktoren: ['M89 214L99 223L99 257C96 247 93 237 90 227Z'],
      tibialis: ['M78 316C76 334 78 352 82 370L85 368C83 350 82 332 83 314Z'],
      waden: ['M88 314C93 328 95 344 93 362L90 366C90 348 89 330 86 316Z'],
      soleus: ['M90 369C92 375 93 381 92.5 387L89 386C88 380 88 375 88.5 370Z']
    },
    // Konturen & Faserlinien (nur Linien)
    lines: ['M84 303a5 6 0 1 0 10 0a5 6 0 1 0-10 0', 'M80 88l10 2M76 101l16 0M75 114l17-1', 'M58 92l6 10M55 102l5 10',
      'M80 236l3 40M86 232l1 44', 'M94 64l-1 12', 'M96 214l-6-7', 'M57 130l2 12']
  },
  back: {
    single: {
      ruecken_u: ['M93 154C91 168 91 184 92 199L99 201V151Z', 'M107 154C109 168 109 184 108 199L101 201V151Z']
    },
    paired: {
      trap_o: ['M100 58L92 58C90 67 84 74 70 82C79 84 89 86 100 88Z'],
      trap_m: ['M100 89.5C89 87.5 80 86 72 84C74 87 77 90 81 92.5C88 97 94 103 100 110Z'],
      trap_u: ['M100 112C94 105 88 99 82 95C86 108 92 126 100 150Z'],
      delt_h: ['M70 82C62 84 55 92 53 104C52 112 53 120 56 127C59 118 62 110 66 103C68 98 69 93 70 89Z'],
      rotatoren: ['M71 90C69 96 68 101 68 106C71 110 76 112 82 113C81 107 80 100 79.5 94C77 92.5 74 91 71 90Z'],
      rhomboiden: ['M81 95C82 102 83 109 84 115C86 116 88 116 90 115C88 108 85 101 81 95Z'],
      teres: ['M67.5 109C66.5 113 66.3 117 66.8 121C72 122 78 120 84 117C79 116 73 114 67.5 109Z'],
      lat: ['M67 124C70 134 74 146 77 158C80 172 86 184 96 192L99 181C98 167 96 155 93 144C90 134 88 126 86 120C80 123 73 125 67 124Z'],
      trizeps_l: ['M56 124C53 134 51 146 50 154C54 158 58 156 60 150C62 140 64 130 66 120C62 120 58 121 56 124Z'],
      trizeps_s: ['M53 106C51 118 50 130 48 146L50 154C51 140 53 130 56 124C54 118 53 112 53 106Z'],
      unterarm_e: ['M46 158C42 172 39 186 37 200L42 203C45 189 49 175 55 160C51 157 48 157 46 158Z', 'M56 160C51 176 47 191 43 205L37 213L45 214C48 202 52 186 59 157Z'],
      abduktoren: ['M76 192C73 198 72 206 74 214C78 208 84 203 90 199C86 195 81 193 76 192Z'],
      gluteus: ['M74 215C72 229 76 242 86 248C94 252 99 246 99 236V203C92 203 84 207 78 211Z'],
      hamstrings_l: ['M74 252C72 270 74 288 78 302L86 304C84 286 84 268 86 254Z'],
      hamstrings_m: ['M87 254C86 272 88 290 90 304L97 302C99 286 99 270 98 254Z'],
      waden: ['M76 314C72 328 73 344 80 356C84 344 86 328 86 314Z', 'M87 314C87 330 89 346 93 358C98 346 98 330 95 316Z'],
      soleus: ['M80 358C81 368 83 378 85 386L93 386C94 376 94 368 93 360C90 364 86 364 80 358Z']
    },
    lines: ['M88 140l6 18M82 150l8 20', 'M58 96l6 8M56 104l6 10', 'M80 270l2 26M92 268l1 28', 'M80 232c4 4 10 6 16 6', 'M72 98l7 8']
  }
};
function bodySvg(view, valueOf, labelOf) {
  const v = BODY[view];
  const mus = (m, d) => {
    const val = valueOf(m);
    const name = typeof REGIONS !== 'undefined' && REGIONS[m] ? REGIONS[m][0] : m;
    return `<path class="mus" d="${d}" fill="${val.color}" data-act="muscleTap" data-m="${esc(m)}" role="button" aria-label="${esc(name)}: ${esc(labelOf(m))}"><title>${esc(name)}: ${esc(labelOf(m))}</title></path>`;
  };
  const half = Object.entries(v.paired).map(([m, ds]) => ds.map(d => mus(m, d)).join('')).join('') + `<g class="mlines">${v.lines.map(d => `<path d="${d}"/>`).join('')}</g>`;
  const single = Object.entries(v.single).map(([m, ds]) => ds.map(d => mus(m, d)).join('')).join('');
  return `<svg viewBox="14 0 172 440" role="img" aria-label="Muskel-Heatmap ${view === 'front' ? 'vorne' : 'hinten'}">
    <g class="base">${BODY.head}<path d="${BODY.sil}"/><path d="${BODY.sil}" transform="matrix(-1 0 0 1 200 0)"/></g>
    <g class="base-fill"><path d="${BODY.sil}"/><path d="${BODY.sil}" transform="matrix(-1 0 0 1 200 0)"/></g>
    ${half}<g transform="matrix(-1 0 0 1 200 0)">${half}</g>${single}
    <text x="100" y="434">${view === 'front' ? 'Vorne' : 'Hinten'}</text></svg>`;
}

/** Gewichtete Sätze pro Region in den Workouts eines Zeitraums */
function regionSets(rows) {
  const out = {};
  Object.keys(REGIONS).forEach(k => { out[k] = 0; });
  for (const w of rows) for (const [id, n] of Object.entries(w.exSets || {})) {
    const regs = exRegions(Ex.get(id));
    for (const [r, wt] of Object.entries(regs)) out[r] += n * wt;
  }
  return out;
}
/* Farbskala: 0 = Muskel grau, wenig → zarter Akzent, Zielbereich → voller Akzent, viel → leuchtend */
const regionColor = pw => {
  const k = clamp(pw / 20, 0, 1);
  if (k <= 0) return 'var(--mus-off)';
  if (k < .6) return `color-mix(in srgb, var(--accent) ${Math.round(28 + 72 * k / .6)}%, var(--mus-off))`;
  return `color-mix(in srgb, var(--mus-hi) ${Math.round((k - .6) / .4 * 65)}%, var(--accent))`;
};

ProgressViews.muscles = body => {
  const ix = Analytics.cur();
  const r = Analytics.range();
  const c = chartColors();
  const rows = Analytics.rowsIn(r);
  const nWeeks = Math.max(1, r.len / 7);
  // Direkte Sätze (Hauptmuskel der Übung) und mitgeholfene Sätze getrennt; für Richtwerte zählen mitgeholfene halb
  const setsM = {}, helpM = {};
  MUSCLES.forEach(m => { setsM[m] = sum(rows.map(w => w.mP[m] || 0)); helpM[m] = sum(rows.map(w => w.mS[m] || 0)); });
  const pwD = m => setsM[m] / nWeeks, pwH = m => helpM[m] / nWeeks;
  const perWeek = m => pwD(m) + pwH(m) / 2;
  const lmText = v => v < 10 ? 'unter MEV' : v > 20 ? 'über MRV' : 'im Zielbereich';
  const lmColor = m => perWeek(m) < 10 ? c.faint : perWeek(m) > 20 ? c.warning : c.accent;
  const cats = k => sum(rows.map(w => w.cats[k] || 0));
  const push = cats('Push'), pull = cats('Pull'), legs = cats('Legs');
  const ppRatio = push ? pull / push : null;
  const luRatio = push + pull ? legs / (push + pull) : null;
  const weeks = Analytics.weeksOf(r), ri = runIdx(weeks);
  const weekly = f => weeks.map(w => f(rows.filter(x => x.dn >= w && x.dn < w + 7)));
  const wLabels = weeks.map(w => 'KW ' + isoWeek(w).week);
  // Muskeln über Zeit: Top 7 Muskelgruppen im Zeitraum, Rest = Andere
  const topM = MUSCLES.filter(m => setsM[m] > 0).sort((a, b) => setsM[b] - setsM[a]).slice(0, 7);
  const neglected = MUSCLES.filter(m => perWeek(m) < 10);
  const usage = {};
  for (const [id, ss] of Object.entries(ix.sessions)) usage[id] = ss.length;
  const suggest = m => Store.all('exercises').filter(e => (e.muscleGroups || [])[0] === m || (e.muscleGroups || []).includes(m)).sort((a, b) => ((b.muscleGroups || [])[0] === m) - ((a.muscleGroups || [])[0] === m) || (usage[b.id] || 0) - (usage[a.id] || 0)).slice(0, 2);
  const variety = MUSCLES.map(m => [m, new Set(rows.flatMap(w => w.ex.filter(id => isPrimary(id, m)))).size]);
  const donutData = MUSCLES.map(m => [m, setsM[m]]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const top7 = donutData.slice(0, 7), rest = sum(donutData.slice(7).map(x => x[1]));
  const rSets = regionSets(rows);
  const rpw = k => rSets[k] / nWeeks;
  const regList = Object.keys(REGIONS).sort((a, b) => rpw(b) - rpw(a));
  const ratioBadge = (v, lo, hi) => v == null ? '' : v < lo || v > hi ? `<span class="badge warn">${icon('warn')} Dysbalance</span>` : `<span class="badge accent">${icon('check')} ausgewogen</span>`;
  const cb = chartBuilder();
  body.innerHTML = `
    <div class="charts-grid">
      <div class="chart-card wide">
        <div class="cc-head"><span class="cc-title">Body-Heatmap</span>${infoBtn(`${Object.keys(REGIONS).length} Muskelregionen, eingefärbt nach gewichteten Sätzen pro Woche: Hauptmuskel der Übung zählt voll, Hilfsmuskeln anteilig. Schrägbank trifft z. B. die obere Brust, Hammer-Curls den Brachialis, Trizepsdrücken über Kopf den langen Trizepskopf, Rudern die Rhomboiden & den mittleren Trapez, Beinstrecken den Rectus femoris, Wadenheben sitzend den Soleus. Tippe auf einen Muskel für Details.`)}</div>
        <div class="body-map mt-8">${bodySvg('front', k => ({ color: regionColor(rpw(k)) }), k => `${nf(rpw(k), 1)} Sätze/Woche`)}${bodySvg('back', k => ({ color: regionColor(rpw(k)) }), k => `${nf(rpw(k), 1)} Sätze/Woche`)}</div>
        <div class="row mt-8 tiny dim"><span>0</span><span class="heat-scale" style="background:linear-gradient(90deg, var(--mus-off), color-mix(in srgb, var(--accent) 40%, var(--mus-off)), var(--accent) 60%, color-mix(in srgb, var(--mus-hi) 65%, var(--accent)))"></span><span>20+ Sätze/Woche</span></div>
        <div class="reg-list mt-12">${regList.map(k => `<button class="reg-item" data-act="muscleTap" data-m="${k}"><span class="reg-dot" style="background:${regionColor(rpw(k))}"></span><span class="reg-name">${esc(REGIONS[k][0])}</span><b>${nf(rpw(k), 1)}</b><i style="--w:${Math.min(100, rpw(k) / 20 * 100)}%"></i></button>`).join('')}</div>
      </div>
      ${cb.card({ id: 'm2', wide: true, title: 'Sätze pro Muskelgruppe / Woche', size: 'lg', info: 'Durchschnittliche Arbeitssätze pro Woche im Zeitraum. Kräftig: direkte Sätze (der Muskel ist Hauptmuskel der Übung). Blass: Sätze, bei denen er nur mithilft (z. B. Bizeps beim Klimmzug). Für die Richtwerte zählen mitgeholfene Sätze halb – die Farbe zeigt das Ergebnis. MEV (10) = Minimum für Wachstum, MAV (15) = optimaler Bereich, MRV (20) = maximal erholbar.',
        factory: () => {
          const cfg = barChart(MUSCLES, [
            barDS('Direkt', MUSCLES.map(m => round(pwD(m), 1)), MUSCLES.map(lmColor), { borderRadius: 0 }),
            barDS('Mitgeholfen', MUSCLES.map(m => round(pwH(m), 1)), MUSCLES.map(m => alpha(lmColor(m), .3)))
          ], {
            horizontal: true, stacked: true, legend: true, tooltipFmt: v => `${nf(v, 1)} Sätze`,
            thresholds: { axis: 'x', lines: [{ value: 10, label: 'MEV', color: c.dim }, { value: 15, label: 'MAV', color: c.accent }, { value: 20, label: 'MRV', color: c.warning }] }, xMax: Math.max(24, Math.ceil(Math.max(...MUSCLES.map(m => pwD(m) + pwH(m))) + 2))
          });
          cfg.options.plugins.tooltip.callbacks.footer = items => items.length ? `zählt als ${nf(perWeek(MUSCLES[items[0].dataIndex]), 1)} (${lmText(perWeek(MUSCLES[items[0].dataIndex]))})` : '';
          return cfg;
        } })}
      ${cb.card({ id: 'm3', title: 'Muskelgruppen-Verteilung', info: 'Anteil der direkten Sätze je Muskelgruppe im Zeitraum (Top 7, Rest = Andere). Jeder Satz zählt nur für den Hauptmuskel der Übung.', size: '',
        factory: () => {
          if (!top7.length) return null;
          const all = [...top7, ...(rest ? [['Andere', rest]] : [])], tot = sum(all.map(x => x[1]));
          return barChart(all.map(x => x[0]), [barDS('Anteil', all.map(x => round(x[1] / tot * 100, 1)), all.map(x => x[0] === 'Andere' ? c.faint : c.accent))],
            { horizontal: true, yFmt: v => v + ' %', tooltipFmt: (v, ctx) => `${nf(v, 0)} % · ${all[ctx.dataIndex][1]} Sätze` });
        } })}
      ${cb.card({ id: 'm4', title: 'Push vs. Pull', info: 'Verhältnis Pull-Sätze zu Push-Sätzen. Ideal ≈ 1,0 (Rücken/Brust-Balance). Warnung unter 0,8 oder über 1,2.',
        big: ppRatio != null ? nf(ppRatio, 2) : '–', small: `${pull} Pull / ${push} Push`, top: `<div class="mt-8">${ratioBadge(ppRatio, 0.8, 1.2)}</div>`,
        factory: () => { const d = weekly(rs => { const p = sum(rs.map(w => w.cats.Push || 0)), q = sum(rs.map(w => w.cats.Pull || 0)); return p ? round(q / p, 2) : null; }); const mx = Math.max(1.5, ...d.filter((v, i) => v != null && i !== ri)); return d.some(v => v != null) ? barChart(wLabels, [{ type: 'line', label: 'Pull/Push', data: d, borderColor: c.accent, backgroundColor: c.accent, pointRadius: 3, spanGaps: true, tension: .3 }], { running: ri, xMax: Math.ceil(mx * 1.15 * 2) / 2, yFmt: v => nf(v, 1), tooltipFmt: v => nf(v, 2), thresholds: { axis: 'y', lines: [{ value: 0.8, label: '0,8', color: c.faint }, { value: 1.2, label: '1,2', color: c.faint }] } }) : null; } })}
      ${cb.card({ id: 'm5', title: 'Beine vs. Oberkörper', info: 'Verhältnis Leg-Sätze zu Push+Pull-Sätzen. Ausgewogen zwischen 0,4 und 0,8. Warnung unter 0,4 oder über 0,8.',
        big: luRatio != null ? nf(luRatio, 2) : '–', small: `${legs} Beine / ${push + pull} Oberkörper`, top: `<div class="mt-8">${ratioBadge(luRatio, 0.4, 0.8)}</div>`,
        factory: () => { const d = weekly(rs => { const u = sum(rs.map(w => (w.cats.Push || 0) + (w.cats.Pull || 0))), l = sum(rs.map(w => w.cats.Legs || 0)); return u ? round(l / u, 2) : null; }); const mx = Math.max(1, ...d.filter((v, i) => v != null && i !== ri)); return d.some(v => v != null) ? barChart(wLabels, [{ type: 'line', label: 'Beine/Oberkörper', data: d, borderColor: c.accent, backgroundColor: c.accent, pointRadius: 3, spanGaps: true, tension: .3 }], { running: ri, xMax: Math.ceil(mx * 1.15 * 2) / 2, yFmt: v => nf(v, 1), tooltipFmt: v => nf(v, 2), thresholds: { axis: 'y', lines: [{ value: 0.4, label: '0,4', color: c.faint }, { value: 0.8, label: '0,8', color: c.faint }] } }) : null; } })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Vernachlässigte Muskelgruppen</span>${infoBtn('Muskelgruppen, die im Zeitraum im Schnitt unter MEV (10 Sätze/Woche) lagen – mit passenden Übungsvorschlägen. Direkte Sätze zählen voll, mitgeholfene halb.')}</div>
        ${neglected.length ? neglected.map(m => `<div class="ratio-row small"><span class="ampel-dot" style="background:var(--danger)"></span><span class="grow"><b style="font-size:14px">${esc(m)}</b> <span class="dim">${nf(perWeek(m), 1)}/W${helpM[m] ? ` (${nf(pwD(m), 1)} direkt)` : ''}</span><br><span class="dim">${suggest(m).map(e => `<button class="link-btn" style="min-height:28px;padding:0 6px 0 0;font-size:12.5px" data-act="openExercise" data-id="${esc(e.id)}">${esc(e.name)}</button>`).join('')}</span></span></div>`).join('') : '<p class="dim small mt-8">Alle Muskelgruppen über MEV – top! ✅</p>'}
      </div>
      ${cb.card({ id: 'm7', title: 'Muskel-Fortschritt', info: 'Sätze pro Woche für die gewählte Muskelgruppe über die Zeit. Kräftig: direkte Sätze, blass darüber: Sätze, bei denen der Muskel nur mithilft.',
        top: `<select class="select mt-8" data-ch="muscleSel" style="min-height:38px;padding-top:4px;padding-bottom:4px" aria-label="Muskelgruppe">${MUSCLES.map(m => `<option ${m === UI.muscleSel ? 'selected' : ''}>${m}</option>`).join('')}</select>`,
        factory: () => { const ms = UI.muscleSel, d = weekly(rs => sum(rs.map(w => w.mP[ms] || 0))), h = weekly(rs => sum(rs.map(w => w.mS[ms] || 0))); return sum(d) + sum(h) ? barChart(wLabels, [
          { type: 'line', label: 'Direkt', data: d, borderColor: c.accent, backgroundColor: alpha(c.accent, .16), fill: 'origin', pointRadius: 3, tension: .3 },
          { type: 'line', label: 'Mitgeholfen', data: h, borderColor: alpha(c.accent, .4), backgroundColor: alpha(c.accent, .07), fill: '-1', pointRadius: 0, borderWidth: 1.5, tension: .3, runAlpha: .2 }
        ], { stacked: true, legend: sum(h) > 0, running: ri, tooltipFmt: v => `${v} Sätze`, thresholds: { axis: 'y', lines: [{ value: 10, label: 'MEV', color: c.faint }, { value: 20, label: 'MRV', color: c.warning }] } }) : null; } })}
      ${cb.card({ id: 'm9', wide: true, title: 'Muskeln über Zeit', info: 'Direkte Arbeitssätze pro Woche je Muskelgruppe, gestapelt – die 7 meist-trainierten Gruppen im Zeitraum, der Rest als „Andere". Jeder Satz zählt nur für den Hauptmuskel der Übung. Die laufende Woche ist blass.', size: 'lg',
        factory: () => topM.length ? barChart(wLabels, [
          ...topM.map((m, i) => barDS(m, weekly(rs => sum(rs.map(w => w.mP[m] || 0))), c.series[i], { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 1 } })),
          ...(MUSCLES.length > topM.length ? [barDS('Andere', weekly(rs => sum(rs.map(w => sum(MUSCLES.filter(m => !topM.includes(m)).map(m => w.mP[m] || 0))))), c.faint, { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 1 } })] : [])
        ], { stacked: true, legend: true, running: ri, tooltipFmt: v => `${nf(v, 0)} Sätze` }) : null })}
      ${cb.card({ id: 'm8', title: 'Übungs-Vielfalt', info: 'Wie viele unterschiedliche Übungen pro Muskelgruppe du im Zeitraum gemacht hast (Variety Score) – gezählt beim Hauptmuskel der Übung.', size: 'lg',
        big: new Set(rows.flatMap(w => w.ex)).size, small: 'verschiedene Übungen gesamt',
        factory: () => variety.some(x => x[1]) ? barChart(variety.map(x => x[0]), [barDS('Übungen', variety.map(x => x[1]), c.series[0])], { horizontal: true, tooltipFmt: v => `${v} Übungen` }) : null })}
    </div>`;
  cb.mountAll();
};
Changes.muscleSel = el => { UI.muscleSel = el.value; saveUI(); App.renderCurrent(); };
Actions.muscleTap = el => {
  const k = el.dataset.m;
  const reg = REGIONS[k]; if (!reg) return;
  const r = Analytics.range();
  const rows = Analytics.rowsIn(r);
  const nWeeks = Math.max(1, r.len / 7);
  const exCount = {};
  for (const w of rows) for (const [id, n] of Object.entries(w.exSets || {})) { const wt = exRegions(Ex.get(id))[k]; if (wt) exCount[id] = (exCount[id] || 0) + n * wt; }
  const sets = sum(Object.values(exCount));
  const pw = sets / nWeeks;
  const status = pw < 10 ? ['danger', 'unter MEV – mehr Volumen hilft'] : pw <= 20 ? ['accent', 'im Zielbereich (MEV–MRV)'] : ['warn', 'über MRV – auf Erholung achten'];
  $$('.body-map .mus').forEach(p => p.classList.toggle('sel', p.dataset.m === k));
  const lib = Store.all('exercises').filter(e => exRegions(e)[k] === 1 && !exCount[e.id]).slice(0, 8);
  Modal.open({
    title: reg[0], size: 'sm',
    body: `<p class="small dim">Gehört zur Gruppe <b>${esc(reg[1])}</b></p>
      <div class="pr-grid mt-12" style="grid-template-columns:repeat(2,1fr)">
        <div class="pr-box"><span>Sätze/Woche</span><b>${nf(pw, 1)}</b></div>
        <div class="pr-box"><span>Sätze im Zeitraum</span><b>${nf(sets, 1)}</b></div>
      </div>
      <p class="mt-12"><span class="badge ${status[0]}">${esc(status[1])}</span></p>
      <h4 class="mt-16 mb-8">Übungen im Zeitraum</h4>
      ${Object.keys(exCount).length ? `<div class="list">${Object.entries(exCount).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<button class="list-item" data-act="openExercise" data-id="${esc(id)}"><span class="li-main"><span class="li-title">${esc(Ex.name(id))}</span><div class="li-sub">${exRegions(Ex.get(id))[k] === 1 ? 'Hauptmuskel' : 'Hilfsmuskel'}</div></span><span class="dim small">${nf(n, 1)} Sätze</span>${icon('chevR', 'li-chev')}</button>`).join('')}</div>` : '<p class="dim small">Keine im Zeitraum.</p>'}
      ${lib.length ? `<h4 class="mt-16 mb-8">Übungen für diesen Muskel</h4><div class="chips wrap">${lib.map(e => `<button class="chip" data-act="openExercise" data-id="${esc(e.id)}">${esc(e.name)}</button>`).join('')}</div>` : ''}`,
    onClose: () => $$('.body-map .mus.sel').forEach(p => p.classList.remove('sel'))
  });
};

/* ---------- Körper ---------- */
/* ---------- Cardio: Minuten & km pro Woche, Tempo-Verlauf, Bestleistungen, Verteilung ---------- */
ProgressViews.cardio = body => {
  const ix = Analytics.cur();
  const r = Analytics.range(), prv = Analytics.prevRange(r);
  const c = chartColors();
  const cIds = Object.keys(ix.sessions).filter(id => ix.sessions[id][0] && ix.sessions[id][0].cardio);
  const cb = chartBuilder();
  // Herz (Ruhepuls, VO2max, Zonen, Intensität, Herz-Plan) über den Cardio-Auswertungen
  const heart = F('f_heart') ? `<div class="section-head"><h2>Herz</h2></div>${Heart.section(cb, r)}${F('f_cardio') ? '<div class="section-head"><h2>Cardio</h2></div>' : ''}` : '';
  if (!cIds.length || !F('f_cardio')) {
    body.innerHTML = heart + (F('f_cardio') ? `<div class="card ${heart ? '' : 'mt-16'}">${emptyState('heart', 'Noch kein Cardio', 'Starte Cardio über „Workout starten“ auf dem Start-Tab oder füge Cardio im Workout hinzu – Dauer, Distanz und Tempo landen dann hier.', `<button class="btn btn-primary" data-act="startCardio">${icon('heart')} Cardio starten</button>`)}</div>` : '');
    cb.mountAll();
    return;
  }
  const rowsR = Analytics.rowsIn(r), rowsP = prv ? Analytics.rowsIn(prv) : null;
  const tot = (rs, k) => sum(rs.map(x => x[k]));
  const units = rs => rs.reduce((n, x) => n + Object.keys(x.cBy).length, 0);
  const weeks = Analytics.weeksOf(r);
  const wLabels = weeks.map(w => 'KW ' + isoWeek(w).week);
  const perWeek = k => weeks.map(w => sum(rowsR.filter(x => x.dn >= w && x.dn < w + 7).map(x => x[k])));
  const minW = perWeek('cSec').map(v => round(v / 60, 0)), kmW = perWeek('cKm').map(v => round(v, 2));
  const ri = runIdx(weeks);
  const avgLine = vals => ({ type: 'line', label: 'Ø', isAvg: true, data: vals.map(() => avgDone(vals, ri)), borderColor: c.dim, borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, fill: false });
  // Tempo: nur Arten mit Distanz & berechenbarem km/h
  const speedIds = cIds.filter(id => ix.sessions[id].some(x => cardioKmhValid(x.km, x.secs))).sort((a, b) => ix.sessions[b].length - ix.sessions[a].length);
  if (!speedIds.includes(UI.cardioEx)) UI.cardioEx = speedIds[0] || '';
  const sp = UI.cardioEx ? ix.sessions[UI.cardioEx].filter(x => x.dn >= r.from && x.dn <= r.to && cardioKmhValid(x.km, x.secs)) : [];
  // Verteilung nach Art (Minuten im Zeitraum)
  const byEx = {};
  for (const x of rowsR) for (const [id, v] of Object.entries(x.cBy)) byEx[id] = (byEx[id] || 0) + v.sec / 60;
  const dist = Object.entries(byEx).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top6 = dist.slice(0, 6), rest = sum(dist.slice(6).map(x => x[1]));
  // Bestleistungen (gesamt) je Art
  const bestOf = (ss, f) => ss.reduce((b, x) => f(x) > (b ? f(b) : 0) ? x : b, null);
  const bests = cIds.map(id => {
    const ss = ix.sessions[id];
    return { id, n: ss.length, dur: bestOf(ss, x => x.secs), km: bestOf(ss, x => x.km), kmh: bestOf(ss.filter(x => cardioKmhValid(x.km, x.secs)), x => x.kmh) };
  }).sort((a, b) => b.n - a.n);
  const bestCell = (label, x, txt) => x ? `<div class="cd-best"><span>${label}</span><b>${txt}</b><small>${fmtDateShort(x.date)}</small></div>` : '';
  const curMin = tot(rowsR, 'cSec') / 60, prevMin = rowsP ? tot(rowsP, 'cSec') / 60 : null;
  const curKm = tot(rowsR, 'cKm'), prevKm = rowsP ? tot(rowsP, 'cKm') : null;
  body.innerHTML = `${heart}
    <div class="charts-grid">
      ${cb.card({ id: 'c1', wide: true, title: 'Cardio-Minuten pro Woche', info: 'Summe der Cardio-Dauer pro Kalenderwoche – nach dem Krafttraining und als eigene Einheit. Gestrichelt: Durchschnitt der abgeschlossenen Wochen. Die laufende Woche ist blass.',
        big: fmtDur(curMin * 60), small: `im Zeitraum · ${units(rowsR)} Einheiten`, delta: deltaHtml(curMin, prevMin), sub: prv ? prevLabel : '',
        factory: () => sum(minW) ? barChart(wLabels, [barDS('Minuten', minW, c.accent), avgLine(minW)], { running: ri, tooltipFmt: v => nf(v, 0) + ' min' }) : null })}
      ${cb.card({ id: 'c2', wide: true, title: 'Distanz pro Woche', info: 'Summe aller Distanzen (km) pro Kalenderwoche – nur Arten mit Distanz (Laufen, Rad, Rudern …).',
        big: curKm ? fmtKm(curKm) : '–', small: 'im Zeitraum', delta: deltaHtml(curKm, prevKm), sub: prv ? prevLabel : '',
        factory: () => sum(kmW) ? barChart(wLabels, [barDS('km', kmW, c.series[0]), avgLine(kmW)], { running: ri, tooltipFmt: v => nf(v, 2) + ' km', yFmt: v => nf(v, 0) }) : null })}
      ${speedIds.length ? cb.card({ id: 'c3', wide: true, title: 'Tempo-Verlauf', info: 'Durchschnittsgeschwindigkeit (km/h) je Einheit = Distanz ÷ Dauer. Gestrichelt: Trend im Zeitraum.',
        top: `<select class="select mt-8" data-ch="cardioEx" style="min-height:38px;padding-top:4px;padding-bottom:4px" aria-label="Cardio-Art">${speedIds.map(id => `<option value="${esc(id)}" ${id === UI.cardioEx ? 'selected' : ''}>${esc(Ex.name(id))}</option>`).join('')}</select>`,
        big: sp.length ? fmtKmh(sp[sp.length - 1].kmh) : '–', small: sp.length ? 'zuletzt' : 'keine Einheit im Zeitraum', delta: sp.length > 1 ? deltaHtml(sp[sp.length - 1].kmh, sp[0].kmh) : '', sub: sp.length > 1 ? `vs. ${fmtDateShort(sp[0].date)}` : '',
        factory: () => {
          if (!sp.length) return null;
          const pts = sp.map(x => ({ x: x.dn, y: round(x.kmh, 2), label: `${fmtKmh(x.kmh)} (${cardioTxt({ sec: x.secs, km: x.km }, null)})` }));
          const ds = [lineDS(Ex.name(UI.cardioEx), pts, c.accent)];
          if (pts.length >= 3) { const lr = linReg(pts); ds.push({ label: 'Trend', data: [{ x: pts[0].x, y: lr.slope * pts[0].x + lr.intercept }, { x: pts[pts.length - 1].x, y: lr.slope * pts[pts.length - 1].x + lr.intercept }], borderColor: c.dim, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0 }); }
          return timeLine(ds, { tooltipFmt: v => fmtKmh(v), yFmt: yAuto(' km/h') });
        } }) : ''}
      ${cb.card({ id: 'c4', title: 'Verteilung nach Art', info: 'Anteil der Cardio-Minuten je Art im Zeitraum (Top 6, Rest = Andere).',
        factory: () => top6.length ? donut([...top6.map(([id]) => Ex.name(id)), ...(rest ? ['Andere'] : [])], [...top6.map(x => round(x[1], 0)), ...(rest ? [round(rest, 0)] : [])], [...c.series.slice(0, top6.length), c.faint], { tooltipFmt: v => nf(v, 0) + ' min' }) : null })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Bestleistungen</span>${infoBtn('Deine besten Einheiten je Cardio-Art (gesamt, unabhängig vom Zeitraum): längste Dauer, weiteste Distanz, schnellstes Tempo. Neue Bestleistungen werden nach dem Workout gefeiert.')}</div>
        <div class="col mt-8" style="gap:12px">${bests.slice(0, 8).map(b => { const info = cardioInfo(Ex.get(b.id)); return `<div>
          <button class="link-btn" style="padding:0;min-height:28px;color:var(--text)" data-act="openExercise" data-id="${esc(b.id)}"><b>${esc(Ex.name(b.id))}</b> <span class="tiny dim">${b.n}×</span></button>
          <div class="cd-bests">${bestCell('Längste', b.dur, fmtDur(b.dur && b.dur.secs))}${info.mode === 'dist' ? bestCell('Weiteste', b.km && b.km.km ? b.km : null, b.km ? fmtKm(b.km.km) : '') + bestCell('Schnellste', b.kmh, b.kmh ? fmtKmh(b.kmh.kmh) : '') : ''}</div></div>`; }).join('')}</div>
      </div>
    </div>`;
  cb.mountAll();
};
Changes.cardioEx = el => { UI.cardioEx = el.value; saveUI(); App.renderCurrent(); };

ProgressViews.body = body => {
  const r = Analytics.range();
  const c = chartColors();
  const P = Store.all('progress').filter(p => isISO(p.date)).sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
  const bwAll = Analytics.bwSeries();
  const bwR = bwAll.filter(p => p.dn >= r.from && p.dn <= r.to);
  const ma7 = bwR.map(p => { const w = bwAll.filter(q => q.dn <= p.dn && q.dn > p.dn - 7); return { x: p.dn, y: toU(avg(w.map(q => q.kg))) }; });
  const latest = bwAll[bwAll.length - 1];
  const monthAgo = latest ? bwAll.filter(p => p.dn <= latest.dn - 28).pop() : null;
  const bf = P.filter(p => p.bodyFatPct > 0 && dayNum(p.date) >= r.from && dayNum(p.date) <= r.to);
  const lean = bf.filter(p => p.bodyWeightKg > 0).map(p => ({ x: dayNum(p.date), y: toU(p.bodyWeightKg * (1 - p.bodyFatPct / 100)) }));
  const latestM = key => { const e = [...P].reverse().find(p => p.measurements && p.measurements[key] > 0); return e ? e.measurements[key] : null; };
  const ratio = (a, b) => { const x = latestM(a), y = latestM(b); return x && y ? x / y : null; };
  const adonis = ratio('shoulderCm', 'waistCm'), whr = ratio('waistCm', 'hipCm'), armThigh = ratio('armCm', 'thighCm');
  const photos = Store.all('photos').filter(p => p.data).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const mSeries = MEASURES.map(([k, l], i) => ({ k, l, color: c.series[i], data: P.filter(p => p.measurements && p.measurements[k] > 0 && dayNum(p.date) >= r.from && dayNum(p.date) <= r.to).map(p => ({ x: dayNum(p.date), y: p.measurements[k] })) })).filter(s => s.data.length);
  // Gewicht: Trend, Ziel, Veränderung pro Woche
  const goal = S().bwGoal > 0 ? +S().bwGoal : null;
  const trendPts = bwR.map(p => ({ x: p.dn, y: p.kg }));
  const trend = trendPts.length >= 3 && trendPts[trendPts.length - 1].x - trendPts[0].x >= 14 ? linReg(trendPts) : null;
  const perWeek = trend ? trend.slope * 7 : null;
  let eta = null;
  if (goal && latest && trend && Math.abs(goal - latest.kg) > .1 && Math.sign(goal - latest.kg) === Math.sign(trend.slope) && Math.abs(trend.slope) > 1e-4) {
    const days = (goal - latest.kg) / trend.slope;
    if (days > 0 && days < 730) eta = todayDN() + Math.round(days);
  }
  const weeks = new Map();
  bwAll.forEach(p => { const w = weekStartDN(p.dn); if (!weeks.has(w)) weeks.set(w, []); weeks.get(w).push(p.kg); });
  const wk = [...weeks.entries()].sort((x, y) => x[0] - y[0]).map(([w, v]) => ({ w, kg: avg(v) }));
  const wkDiff = wk.map((x, i) => i ? { w: x.w, d: x.kg - wk[i - 1].kg, gap: x.w - wk[i - 1].w } : null).filter(x => x && x.gap <= 14 && x.w >= weekStartDN(r.from) && x.w <= r.to);
  // Wochenziel: Bereich je Woche (Phase oder allgemein) und Treffer
  const rateNow = rateRuleAt(weekStartDN(todayDN()));
  const rules = wkDiff.map(x => rateRuleAt(x.w));
  const rateHit = wkDiff.filter((x, i) => rules[i] && x.d >= rules[i].lo - 1e-6 && x.d <= rules[i].hi + 1e-6).length;
  const startR = bwR[0], minR = bwR.length ? bwR.reduce((m, p) => p.kg < m.kg ? p : m) : null, maxR = bwR.length ? bwR.reduce((m, p) => p.kg > m.kg ? p : m) : null;
  const todayEntry = P.find(p => p.date === isoDate() && p.bodyWeightKg > 0);
  const signW = d => (d > 0.005 ? '+' : d < -0.005 ? '−' : '±') + nf(Math.abs(toU(d)), Math.abs(d) < 1 ? 2 : 1) + ' ' + unit();
  const statRow = (l, v, sub = '') => `<div class="ratio-row"><span class="grow">${l}</span><b>${v}</b>${sub ? `<span class="tiny dim">${sub}</span>` : ''}</div>`;
  const cb = chartBuilder();
  body.innerHTML = `
    <div class="card mt-12 bw-quick">
      <div class="small dim">${todayEntry ? `Heute: ${fmtW(todayEntry.bodyWeightKg)} – neuer Wert ersetzt ihn` : 'Gewicht heute'}</div>
      <div class="row mt-8">
        <input class="input" id="bwQuick" inputmode="decimal" placeholder="${latest ? esc(inputW(latest.kg)) : 'z. B. 82,5'}" aria-label="Gewicht heute in ${unit()}" enterkeyhint="done">
        <span class="dim">${unit()}</span>
        <button class="btn btn-primary" data-act="bwQuickSave">${icon('check')} Speichern</button>
      </div>
      <div class="row between mt-4">
        <button class="link-btn" data-act="bodyNew" style="padding:6px 0;min-height:32px">Anderes Datum${F('f_bodyFat') || F('f_measures') || F('f_photos') ? ' oder mehr Werte' : ''} eintragen</button>
        <button class="link-btn" data-act="bwImport" style="padding:6px 0;min-height:32px">${icon('upload').replace('<svg', '<svg width="15" height="15" style="vertical-align:-3px"')} CSV importieren</button>
      </div>
    </div>
    <div class="charts-grid">
      ${cb.card({ id: 'b1', wide: true, title: 'Körpergewicht', info: 'Alle Gewichts-Einträge (Körper-Tab und Workouts). Grüne Linie: gleitender 7-Tage-Durchschnitt – er glättet Wasser-Schwankungen. Trend = lineare Veränderung im gewählten Zeitraum.',
        big: latest ? fmtW(latest.kg) : '–', delta: latest && monthAgo ? deltaHtml(latest.kg, monthAgo.kg, { fmt: d => (d > 0 ? '+' : '') + fmtW(d), neutral: true }) : '',
        sub: [monthAgo ? 'vs. vor 4 Wochen' : '', perWeek != null ? `Trend ${signW(perWeek)} pro Woche` : '', goal ? `Ziel ${fmtW(goal)}${latest ? ` · noch ${fmtW(Math.abs(goal - latest.kg))}` : ''}${eta ? ` · ca. ${fmtDN(eta, { day: 'numeric', month: 'short' })}` : ''}` : ''].filter(Boolean).join(' · '),
        top: `<div class="row mt-8"><button class="chip sm" data-act="bwGoalSet">${icon('target')} ${goal ? 'Ziel: ' + fmtW(goal) : 'Zielgewicht festlegen'}</button></div>`,
        factory: () => {
          if (!bwR.length) return null;
          const ds = [
            lineDS('Messwert', bwR.map(p => ({ x: p.dn, y: toU(p.kg) })), c.faint, { fill: false, borderWidth: 1, tension: 0, pointRadius: bwR.length <= 90 ? 2.5 : 0, pointBackgroundColor: c.faint }),
            lineDS('Ø 7 Tage', ma7, c.accent, { fill: false, borderWidth: 2.5, pointRadius: 0 })
          ];
          const ys = bwR.map(p => toU(p.kg)).concat(goal ? [toU(goal)] : []);
          return timeLine(ds, { legend: true, tooltipFmt: v => nf(v, 1) + ' ' + unit(), thresholds: goal ? { axis: 'y', lines: [{ value: toU(goal), label: 'Ziel', color: c.dim }] } : null,
            yMin: Math.floor(Math.min(...ys) - .5), yMax: Math.ceil(Math.max(...ys) + .5) });
        } })}
      ${cb.card({ id: 'b5', wide: true, title: 'Veränderung pro Woche', info: rateNow || rules.some(Boolean) ? 'Wochendurchschnitt im Vergleich zur Vorwoche. Grün = im Bereich deines Wochenziels, orange = darüber oder darunter, das blasse Band zeigt den erlaubten Bereich. Das Ziel stellst du hier oder pro Phase ein (Fortschritt → „+ Phase"); in einer Phase gilt deren Bereich. Wochen ohne Eintrag werden übersprungen.' : 'Wochendurchschnitt im Vergleich zur Vorwoche. Blau = abgenommen, orange = zugenommen. Mit einem Wochenziel (Knopf oben) siehst du, welche Wochen im erlaubten Bereich lagen. Wochen ohne Eintrag werden übersprungen.',
        top: `<div class="row mt-8"><button class="chip sm" data-act="bwRateSet">${icon('target')} ${rateNow ? `${rateNow.phase ? esc(rateNow.phase.name) : esc((RATE_GOALS.find(x => x[0] === rateNow.type) || [0, 'Ziel'])[1])}: ${esc(rateText(rateNow.lo, rateNow.hi))}` : 'Wochenziel festlegen'}</button></div>`,
        big: wkDiff.length ? signW(wkDiff[wkDiff.length - 1].d) : '–', small: wkDiff.length ? 'letzte Woche' : 'mind. 2 Wochen mit Einträgen nötig',
        sub: rules.some(Boolean) ? `${rateHit} von ${rules.filter(Boolean).length} Wochen im Bereich` : '',
        factory: () => {
          if (!wkDiff.length) return null;
          const labels = wkDiff.map(x => 'KW ' + isoWeek(x.w).week);
          const vals = wkDiff.map(x => round(toU(x.d), 3));
          const ri = wkDiff.findIndex(x => x.w === weekStartDN(todayDN()));
          if (!rules.some(Boolean)) return barChart(labels, [barDS('Abnahme', vals.map(v => v < 0 ? v : null), c.series[0]), barDS('Zunahme', vals.map(v => v > 0 ? v : null), c.series[1])],
            { stacked: true, legend: true, running: ri, tooltipFmt: v => fmtRate(fromU(v)), yFmt: v => (v > 0 ? '+' : '') + nf(v, 1) });
          const st = wkDiff.map((x, i) => !rules[i] ? 'none' : x.d < rules[i].lo - 1e-6 ? 'low' : x.d > rules[i].hi + 1e-6 ? 'high' : 'ok');
          const pick = k => vals.map((v, i) => st[i] === k ? v : null);
          const cfg = barChart(labels, [
            barDS('Im Bereich', pick('ok'), c.success),
            barDS('Außerhalb', vals.map((v, i) => st[i] === 'low' || st[i] === 'high' ? v : null), c.warning),
            ...(st.includes('none') ? [barDS('Ohne Ziel', pick('none'), c.faint)] : [])
          ], { stacked: true, legend: true, running: ri, tooltipFmt: v => fmtRate(fromU(v)), yFmt: v => (v > 0 ? '+' : '') + nf(v, 1) });
          const ranges = rules.map(rl => rl ? [toU(rl.lo), toU(rl.hi)] : null);
          cfg.plugins = [...(cfg.plugins || []), rangeBandPlugin];
          cfg.options.plugins.rangeBand = { ranges, color: alpha(c.success, .13), edge: alpha(c.success, .45) };
          const ext = ranges.filter(Boolean).flat();
          cfg.options.scales.y.suggestedMin = Math.min(0, ...ext);
          cfg.options.scales.y.suggestedMax = Math.max(0, ...ext);
          cfg.options.plugins.tooltip.callbacks.footer = items => {
            const i = items.length ? items[0].dataIndex : -1, rl = rules[i];
            if (!rl) return i >= 0 ? 'kein Wochenziel für diese Woche' : '';
            return `Ziel ${rateText(rl.lo, rl.hi)}${rl.phase ? ` (${rl.phase.name})` : ''} · ${st[i] === 'ok' ? 'im Bereich' : st[i] === 'high' ? 'über dem Bereich' : 'unter dem Bereich'}`;
          };
          return cfg;
        } })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">${icon('scale', 'cc-ic')} Im Zeitraum</span>${infoBtn('Kennzahlen deines Gewichts im oben gewählten Zeitraum.')}</div>
        ${bwR.length ? `${statRow('Start', fmtW(startR.kg), fmtDN(startR.dn, { day: '2-digit', month: '2-digit' }))}
        ${statRow('Aktuell', fmtW(bwR[bwR.length - 1].kg), fmtDN(bwR[bwR.length - 1].dn, { day: '2-digit', month: '2-digit' }))}
        ${statRow('Veränderung', signW(bwR[bwR.length - 1].kg - startR.kg))}
        ${statRow('Niedrigster', fmtW(minR.kg), fmtDN(minR.dn, { day: '2-digit', month: '2-digit' }))}
        ${statRow('Höchster', fmtW(maxR.kg), fmtDN(maxR.dn, { day: '2-digit', month: '2-digit' }))}
        ${statRow('Einträge', nf(bwR.length, 0))}` : '<p class="dim small mt-8">Noch keine Einträge im Zeitraum.</p>'}
      </div>
      ${F('f_bodyFat') ? `${cb.card({ id: 'b2', title: 'Körperfett', info: 'Körperfettanteil in Prozent – falls eingetragen.', big: bf.length ? nf(bf[bf.length - 1].bodyFatPct, 1) + ' %' : '–',
        factory: () => bf.length ? timeLine([lineDS('KFA', bf.map(p => ({ x: dayNum(p.date), y: p.bodyFatPct })), c.accent)], { tooltipFmt: v => nf(v, 1) + ' %', yFmt: yAuto(' %') }) : null })}
      ${cb.card({ id: 'b3', title: 'Fettfreie Masse', info: 'Gewicht × (1 – KFA/100). Steigt sie, baust du Muskeln auf.', big: lean.length ? fmtW(fromU(lean[lean.length - 1].y)) : '–',
        factory: () => lean.length ? timeLine([lineDS('Fettfreie Masse', lean, c.accent)], { tooltipFmt: v => fmtW(fromU(v)) }) : null })}` : ''}
      ${F('f_measures') ? `${cb.card({ id: 'b4', wide: true, title: 'Umfänge', info: 'Veränderung jedes Umfangs in cm seit dem ersten Eintrag im Zeitraum – so werden auch kleine Änderungen sichtbar. Der Tooltip zeigt zusätzlich den Messwert. Tippe in der Legende auf eine Linie, um sie aus- oder einzublenden.', size: 'lg',
        sub: 'Veränderung in cm seit Zeitraumbeginn',
        factory: () => mSeries.length ? timeLine(mSeries.map(s => lineDS(s.l, s.data.map(p => ({ x: p.x, y: round(p.y - s.data[0].y, 1), label: `${nf(p.y, 1)} cm (${p.y - s.data[0].y >= 0 ? '+' : '−'}${nf(Math.abs(p.y - s.data[0].y), 1)})` })), s.color, { fill: false, pointRadius: s.data.length <= 30 ? 3 : 0 })),
          { legend: true, tooltipFmt: v => nf(v, 1) + ' cm', yFmt: v => (v > 0 ? '+' : '') + nf(v, 1), thresholds: { axis: 'y', lines: [{ value: 0, label: '', color: c.faint }] } }) : null })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Verhältnisse</span>${infoBtn('Schulter/Taille: „Adonis-Index", ideal ≈ 1,618. Taille/Hüfte: gesund bei Männern < 0,9, Frauen < 0,85. Arm/Oberschenkel: Proportion Ober- zu Unterkörper.')}</div>
        <div class="ratio-row"><span class="grow">Schulter / Taille</span><b>${adonis ? nf(adonis, 2) : '–'}</b><span class="tiny dim">Ziel 1,62</span></div>
        <div class="ratio-row"><span class="grow">Taille / Hüfte</span><b>${whr ? nf(whr, 2) : '–'}</b><span class="tiny dim">${whr ? (whr < (S().sex === 'f' ? .85 : .9) ? '✓ gesund' : '⚠ erhöht') : ''}</span></div>
        <div class="ratio-row"><span class="grow">Arm / Oberschenkel</span><b>${armThigh ? nf(armThigh, 2) : '–'}</b><span class="tiny dim"></span></div>
      </div>` : ''}
      ${F('f_photos') ? `<div class="chart-card">
        <div class="cc-head"><span class="cc-title">Fotos</span>${infoBtn('Fortschrittsfotos chronologisch. Tippe auf ein Foto für den Vorher/Nachher-Vergleich.')}</div>
        ${photos.length ? `<div class="photo-strip mt-8">${photos.map(p => `<button data-act="photoCompare" data-id="${esc(p.id)}"><img src="${p.data}" alt="Foto vom ${esc(fmtDate(p.date))}" loading="lazy">${esc(fmtDate(p.date))}</button>`).join('')}</div>` : '<p class="dim small mt-8">Noch keine Fotos – füge beim nächsten Eintrag eins hinzu.</p>'}
      </div>` : ''}
    </div>
    <button class="btn btn-ghost btn-block mt-12" data-act="bodyCfg">${icon('sliders')} Anzeige anpassen</button>
    <div class="section-head"><h2>Verlauf</h2><span class="small dim">${P.length} Einträge</span></div>
    ${P.length ? `<div class="list">${[...P].reverse().map(p => `<button class="list-item" data-act="bodyEdit" data-id="${esc(p.id)}">
      <span class="li-icon">${icon(p.photoId && F('f_photos') ? 'camera' : 'scale')}</span>
      <span class="li-main"><span class="li-title">${esc(fmtDate(p.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))}</span>
      <div class="li-sub">${[p.bodyWeightKg ? fmtW(p.bodyWeightKg) : '', F('f_bodyFat') && p.bodyFatPct ? nf(p.bodyFatPct, 1) + ' % KFA' : '', F('f_measures') && p.measurements ? MEASURES.filter(([k]) => p.measurements[k]).length + ' Umfänge' : '', p.notes ? esc(p.notes) : ''].filter(Boolean).join(' · ') || '–'}</div></span>
      ${icon('chevR', 'li-chev')}</button>`).join('')}</div>` : `<div class="card">${emptyState('scale', 'Noch keine Einträge', 'Trag oben dein Gewicht ein – der Verlauf entsteht automatisch.')}</div>`}`;
  cb.mountAll();
};
Actions.bwQuickSave = () => {
  const inp = $('#bwQuick');
  const v = parseNum(inp && inp.value);
  if (!v || v < 20 || v > 400) { toast('Bitte ein Gewicht eintragen', 'warn'); if (inp) inp.focus(); return; }
  const kg = round(fromU(v), 2), today = isoDate();
  const ex = Store.all('progress').find(p => p.date === today && p.bodyWeightKg > 0) || Store.all('progress').find(p => p.date === today);
  if (ex) Store.put('progress', ex.id, { bodyWeightKg: kg, updatedAt: Date.now() });
  else Store.put('progress', autoId(), { date: today, bodyWeightKg: kg, bodyFatPct: null, measurements: null, photoUrl: null, photoId: null, notes: '', createdAt: Date.now(), updatedAt: Date.now() }, { replace: true });
  toast(`${fmtW(kg)} gespeichert`, 'success');
};
Actions.bwRateSet = () => {
  const g = S().bwRate || {};
  let type = g.type || (g.min != null ? 'maintain' : '');
  const cur = rateRuleAt(weekStartDN(todayDN()));
  const sug = RATE_DEFAULTS[type || 'bulk'];
  const m = Modal.open({
    title: 'Wochenziel Gewicht', size: 'sm',
    body: `<div class="stack">
      ${cur && cur.phase ? `<div class="card small">Gerade gilt die Phase <b>${esc(cur.phase.name)}</b> (${esc(rateText(cur.lo, cur.hi))}). Diese Einstellung gilt für Wochen ohne Phase mit Bereich.
        <button class="link-btn mt-4" style="padding:0;min-height:30px" data-x="phase">Phase bearbeiten</button></div>` : ''}
      <div class="seg" id="rtType">${RATE_GOALS.map(([k, l]) => `<button data-t="${k}" class="${type === k ? 'active' : ''}">${l}</button>`).join('')}<button data-t="" class="${!type ? 'active' : ''}">Kein Ziel</button></div>
      <div id="rtBox" ${type ? '' : 'hidden'}>${rateFields(g.min, g.max, [rateToInput(sug[0]), rateToInput(sug[1])])}
        <p class="tiny dim mt-8">Erlaubte Veränderung deines Wochendurchschnitts zur Vorwoche. Im Diagramm „Veränderung pro Woche“ sind Wochen in diesem Bereich grün, darüber oder darunter orange.</p></div>
    </div>`,
    foot: `<button class="btn btn-secondary" data-x="c">Abbrechen</button><button class="btn btn-primary" data-x="ok">Speichern</button>`
  });
  if (type && g.min == null) applyRateDefault(m.el, null, type);
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-t]');
    if (t) { applyRateDefault(m.el, type || null, t.dataset.t || 'other'); type = t.dataset.t; $$('#rtType button', m.el).forEach(x => x.classList.toggle('active', x === t)); $('#rtBox', m.el).hidden = !type; return; }
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'phase') { m.close(); Actions.phaseEdit({ dataset: { id: cur.phase.id } }); return; }
    if (b.dataset.x === 'ok') {
      if (!type) Store.saveSettings({ bwRate: null });
      else {
        const rt = readRate(m.el);
        if (rt === false) return;
        if (!rt) return toast('Bitte von und bis angeben', 'warn');
        Store.saveSettings({ bwRate: { type, min: rt[0], max: rt[1] } });
      }
      toast('Wochenziel gespeichert', 'success');
    }
    m.close();
  });
};
Actions.bwGoalSet = async () => {
  const cur = S().bwGoal;
  const v = await promptDialog({ title: 'Zielgewicht', label: `Ziel in ${unit()} (leer = kein Ziel)`, value: cur ? inputW(cur) : '', inputmode: 'decimal', okLabel: 'Speichern' });
  if (v == null) return;
  const n = parseNum(v);
  Store.saveSettings({ bwGoal: n && n > 20 ? round(fromU(n), 2) : null });
};
/* ---------- Gewicht aus CSV importieren (z. B. Better Weight, Withings, Libra, eigene Tabellen) ---------- */
function csvSplit(line, d) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === d) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}
/** Datum in ISO: 2026-10-15, 15.10.2026, 15.10.26, 15/10/2026, 2026/10/15 (Uhrzeit wird ignoriert) */
function csvDate(v) {
  const t = String(v || '').trim();
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) { const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; return isISO(iso) ? iso : null; }
  m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return isISO(iso) ? iso : null; }
  return null;
}
function parseWeightCsv(text) {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { rows: [], skipped: 0, error: 'Keine Daten gefunden' };
  const first = lines[0];
  const d = first.includes('\t') ? '\t' : (first.split(';').length >= first.split(',').length ? ';' : ',');
  let head = csvSplit(first, d);
  let dateCol = head.findIndex(h => /datum|date|tag\b|day|zeit|time/i.test(h));
  let wCol = head.findIndex(h => /gewicht|weight|masse|mass|kg|lbs?\b/i.test(h) && !/bmi|fett|fat|muskel|muscle|wasser|water|bone|knochen|ziel|goal/i.test(h));
  let lb = wCol >= 0 && /\blbs?\b|pound|pfund/i.test(head[wCol]);
  let start = 1;
  if (dateCol < 0 || wCol < 0) {
    // Ohne erkennbare Kopfzeile: erste Datumsspalte + erste Zahl-Spalte danach
    const cells = csvSplit(first, d);
    dateCol = cells.findIndex(c => csvDate(c));
    wCol = cells.findIndex((c, i) => i !== dateCol && parseNum(c) > 20 && parseNum(c) < 700);
    lb = false; start = csvDate(first.split(d)[Math.max(0, dateCol)]) ? 0 : 1;
    if (dateCol < 0 || wCol < 0) return { rows: [], skipped: lines.length, error: 'Spalten für Datum und Gewicht nicht erkannt' };
  }
  const byDate = new Map();
  let skipped = 0;
  for (const line of lines.slice(start)) {
    const c = csvSplit(line, d);
    const date = csvDate(c[dateCol]);
    let w = parseNum(c[wCol]);
    if (w != null && lb) w *= KG_PER_LB;
    if (!date || w == null || w < 20 || w > 400 || date > isoDate()) { skipped++; continue; }
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(w);
  }
  const rows = [...byDate.entries()].map(([date, ws]) => ({ date, kg: round(avg(ws), 2) })).sort((a, b) => a.date.localeCompare(b.date));
  return { rows, skipped, lb, error: rows.length ? null : 'Keine gültigen Gewichtswerte gefunden' };
}
Actions.bwImport = () => {
  let parsed = null;
  const m = Modal.open({
    title: 'Gewicht importieren', size: 'lg',
    body: `<p class="small dim">CSV-Export aus deiner Waagen- oder Gewichts-App (z. B. Better Weight, Withings, Libra) – Datum und Gewicht werden automatisch erkannt, auch mit deutschem Komma.</p>
      <label class="btn btn-secondary btn-block mt-12">${icon('upload')} CSV-Datei wählen<input type="file" id="bwiFile" accept=".csv,.txt,text/csv,text/plain" hidden></label>
      <label class="field mt-12"><span>… oder Inhalt hier einfügen</span><textarea class="textarea" id="bwiText" placeholder="&quot;Datum&quot;;&quot;Gewicht (kg)&quot;&#10;&quot;2026-10-15&quot;;&quot;75,8&quot;" style="min-height:96px;font-family:var(--mono);font-size:13px"></textarea></label>
      <div id="bwiPrev" class="mt-12"></div>`,
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="go" disabled>${icon('check')} Importieren</button>`
  });
  const go = $('[data-x="go"]', m.el);
  const preview = () => {
    const text = $('#bwiText', m.el).value;
    const box = $('#bwiPrev', m.el);
    if (!text.trim()) { box.innerHTML = ''; go.disabled = true; parsed = null; return; }
    parsed = parseWeightCsv(text);
    if (parsed.error) { box.innerHTML = `<div class="card tight danger-text">${icon('xCircle', 'imp-ic')} ${esc(parsed.error)}</div>`; go.disabled = true; return; }
    const have = new Set(Store.all('progress').filter(p => p.bodyWeightKg > 0).map(p => p.date));
    const dup = parsed.rows.filter(r => have.has(r.date)).length;
    const ks = parsed.rows.map(r => r.kg), r0 = parsed.rows[0], r1 = parsed.rows[parsed.rows.length - 1];
    box.innerHTML = `<div class="card tight" style="background:var(--surface-2)">
        <div>${icon('checkCircle', 'imp-ic')} <b>${parsed.rows.length}</b> Tage mit Gewicht${parsed.lb ? ' (aus lb umgerechnet)' : ''}</div>
        <div class="mt-4">${icon('calendar', 'imp-ic')} ${esc(fmtDate(r0.date, { day: '2-digit', month: '2-digit', year: 'numeric' }))} – ${esc(fmtDate(r1.date, { day: '2-digit', month: '2-digit', year: 'numeric' }))}</div>
        <div class="mt-4">${icon('scale', 'imp-ic')} ${fmtW(r0.kg)} → ${fmtW(r1.kg)} · min ${fmtW(Math.min(...ks))} · max ${fmtW(Math.max(...ks))}</div>
        ${parsed.skipped ? `<div class="mt-4 dim">${icon('warn', 'imp-ic')} ${parsed.skipped} Zeilen ohne gültiges Datum/Gewicht übersprungen</div>` : ''}
        <div class="mt-8">${sparkline(ks.map(toU), cssVar('--accent'))}</div>
      </div>
      ${dup ? `<label class="set-line mt-8" style="padding:8px 0"><div class="sl-main"><div class="sl-title">${dup} ${dup === 1 ? 'Tag' : 'Tage'} schon vorhanden</div><div class="sl-sub">Aus: überspringen · An: mit Werten aus der Datei überschreiben</div></div>
        <span class="switch"><input type="checkbox" switch id="bwiOver" aria-label="Vorhandene überschreiben"><span></span></span></label>` : ''}`;
    const label = n => { go.disabled = !n; go.innerHTML = n ? `${icon('check')} ${n} importieren` : 'Alles schon vorhanden'; };
    label(parsed.rows.length - dup);
    const over = $('#bwiOver', m.el);
    if (over) over.addEventListener('change', () => label(over.checked ? parsed.rows.length : parsed.rows.length - dup));
  };
  $('#bwiText', m.el).addEventListener('input', debounce(preview, 250));
  $('#bwiFile', m.el).addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    $('#bwiText', m.el).value = await f.text();
    preview();
  });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'cancel') return m.close();
    if (b.dataset.x !== 'go' || !parsed || !parsed.rows.length) return;
    const over = !!($('#bwiOver', m.el) && $('#bwiOver', m.el).checked);
    const byDate = new Map(Store.all('progress').filter(p => p.bodyWeightKg > 0).map(p => [p.date, p]));
    const importId = autoId(), now = Date.now(), ops = [], created = [], overwritten = [];
    for (const r of parsed.rows) {
      const ex = byDate.get(r.date);
      if (ex) {
        if (!over || Math.abs(ex.bodyWeightKg - r.kg) < 1e-6) continue;
        overwritten.push({ id: ex.id, bodyWeightKg: ex.bodyWeightKg });
        ops.push({ type: 'put', coll: 'progress', id: ex.id, doc: { bodyWeightKg: r.kg, updatedAt: now } });
      } else {
        const id = autoId();
        created.push(id);
        ops.push({ type: 'put', coll: 'progress', id, replace: true, doc: { date: r.date, bodyWeightKg: r.kg, bodyFatPct: null, measurements: null, photoUrl: null, photoId: null, notes: '', importId, createdAt: now, updatedAt: now } });
      }
    }
    if (!ops.length) { toast('Nichts Neues – alle Tage sind schon vorhanden', 'info', { cat: 'always' }); return m.close(); }
    go.disabled = true;
    await Store.batch(ops);
    Store.put('imports', importId, { source: 'weight-csv', importedAt: now, undoneAt: null, counts: { progress: created.length, overwritten: overwritten.length }, docIds: { workouts: [], exercises: [], progress: created }, overwritten }, { replace: true });
    m.close();
    toast(`${created.length} Gewichtswerte importiert${overwritten.length ? `, ${overwritten.length} überschrieben` : ''}`, 'success', { cat: 'always', duration: 4500 });
  });
};
Actions.bodyCfg = () => Modal.open({ title: 'Körper-Tab anpassen', size: 'sm', body: `<p class="small dim">Das Gewicht ist immer da. Schalte zusätzlich ein, was du erfassen willst – vorhandene Daten bleiben erhalten.</p>
  <div class="list mt-12">${setLine('Körperfett', 'KFA & fettfreie Masse', toggleCtl('f_bodyFat'))}${setLine('Umfänge', 'Brust, Taille, Arm … & Verhältnisse', toggleCtl('f_measures'))}${setLine('Fotos', 'Fortschrittsfotos & Vergleich', toggleCtl('f_photos'))}</div>` });
Actions.bodyNew = () => openBodyForm(null);
Actions.bodyEdit = el => openBodyForm(Store.raw('progress', el.dataset.id));

async function compressImage(file, max = 900, q = .72) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild konnte nicht gelesen werden')); i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.naturalWidth * scale);
    cv.height = Math.round(img.naturalHeight * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    let data = cv.toDataURL('image/jpeg', q);
    if (data.length > 850000) data = cv.toDataURL('image/jpeg', .5);
    return data;
  } finally { URL.revokeObjectURL(url); }
}
function openBodyForm(entry) {
  const d = entry ? JSON.parse(JSON.stringify(entry)) : { date: isoDate(), bodyWeightKg: Analytics.bwSeries().length ? Analytics.bwSeries().slice(-1)[0].kg : null, bodyFatPct: null, measurements: {}, notes: '' };
  d.measurements = d.measurements || {};
  let photoData = null;
  const existingPhoto = entry && entry.photoId ? Store.raw('photos', entry.photoId) : null;
  const m = Modal.open({
    title: entry ? 'Eintrag bearbeiten' : 'Neuer Körper-Eintrag', size: F('f_bodyFat') || F('f_measures') || F('f_photos') ? 'lg' : 'sm',
    body: `<div class="stack">
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" id="bfDate" value="${esc(d.date)}" max="${isoDate()}"></label>
        <label class="field"><span>Gewicht (${unit()})</span><input class="input" id="bfW" inputmode="decimal" value="${inputW(d.bodyWeightKg)}" placeholder="z. B. 82,5"></label>
        <label class="field" ${F('f_bodyFat') ? '' : 'hidden'}><span>Körperfett (%)</span><input class="input" id="bfBf" inputmode="decimal" value="${d.bodyFatPct != null ? String(d.bodyFatPct).replace('.', ',') : ''}" placeholder="optional"></label>
      </div>
      <div ${F('f_measures') ? '' : 'hidden'}><div class="field-label mb-8">Umfänge (cm)</div>
        <div class="measure-grid">${MEASURES.map(([k, l]) => `<label class="field"><span>${l}</span><input class="input" data-mk="${k}" inputmode="decimal" value="${d.measurements[k] != null ? String(d.measurements[k]).replace('.', ',') : ''}"></label>`).join('')}</div></div>
      <div class="field" ${F('f_photos') ? '' : 'hidden'}><span>Foto</span>
        <div class="row">${existingPhoto ? `<img src="${existingPhoto.data}" alt="" style="width:64px;height:84px;object-fit:cover;border-radius:10px" id="bfPrev">` : '<img alt="" style="width:64px;height:84px;object-fit:cover;border-radius:10px;display:none" id="bfPrev">'}
        <label class="btn btn-secondary">${icon('camera')} ${existingPhoto ? 'Foto ersetzen' : 'Foto wählen'}<input type="file" accept="image/*" id="bfPhoto" hidden></label></div></div>
      <label class="field"><span>Notizen</span><textarea class="textarea" id="bfNotes" style="min-height:70px">${esc(d.notes || '')}</textarea></label>
    </div>`,
    foot: `${entry ? `<button class="btn btn-danger-ghost" data-x="del" style="flex:0 0 auto" aria-label="Löschen">${icon('trash')}</button>` : ''}<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">Speichern</button>`
  });
  $('#bfPhoto', m.el).addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      photoData = await compressImage(f);
      const prev = $('#bfPrev', m.el);
      prev.src = photoData; prev.style.display = '';
    } catch (err) { toast(err.message, 'error'); }
  });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'cancel') return m.close();
    if (b.dataset.x === 'del') {
      if (!await confirmDialog({ title: 'Eintrag löschen?', text: `Körper-Eintrag vom ${fmtDate(entry.date)}${entry.photoId ? ' inkl. Foto' : ''} löschen?`, okLabel: 'Löschen', danger: true })) return;
      Store.del('progress', entry.id);
      if (entry.photoId) Store.del('photos', entry.photoId);
      m.close();
      toast('Eintrag gelöscht', 'success');
      return;
    }
    const date = $('#bfDate', m.el).value;
    if (!isISO(date)) return toast('Bitte ein gültiges Datum wählen', 'warn');
    const w = parseNum($('#bfW', m.el).value), bfv = parseNum($('#bfBf', m.el).value);
    const meas = {};
    let any = false;
    $$('[data-mk]', m.el).forEach(i => { const v = parseNum(i.value); meas[i.dataset.mk] = v && v > 0 ? v : null; if (v) any = true; });
    if (w == null && bfv == null && !any && !photoData && !existingPhoto && !$('#bfNotes', m.el).value.trim()) return toast('Bitte mindestens einen Wert eintragen', 'warn');
    if ((w != null && w <= 0) || (bfv != null && (bfv < 0 || bfv > 70))) return toast('Bitte plausible Werte eingeben', 'warn');
    const id = entry ? entry.id : autoId();
    let photoId = entry ? entry.photoId || null : null;
    if (photoData) {
      photoId = photoId || autoId();
      Store.put('photos', photoId, { date, data: photoData, entryId: id, createdAt: Date.now() }, { replace: true });
    } else if (photoId && existingPhoto && existingPhoto.date !== date) Store.put('photos', photoId, { date });
    Store.put('progress', id, {
      date, bodyWeightKg: w != null ? round(fromU(w), 2) : null, bodyFatPct: bfv, measurements: any ? meas : null,
      photoUrl: null, photoId, notes: $('#bfNotes', m.el).value.trim(), createdAt: entry ? entry.createdAt || Date.now() : Date.now(), updatedAt: Date.now()
    }, { replace: true });
    m.close();
    toast('Eintrag gespeichert', 'success');
  });
}
Actions.photoCompare = el => {
  const photos = Store.all('photos').filter(p => p.data).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!photos.length) return;
  let after = photos.find(p => p.id === el.dataset.id) || photos[photos.length - 1];
  let before = photos[0].id !== after.id ? photos[0] : (photos[1] || photos[0]);
  if (before.date > after.date) [before, after] = [after, before];
  const m = Modal.open({ title: 'Vorher / Nachher', size: 'lg' });
  const draw = () => {
    m.setBody(`
      <div class="form-grid mb-12">
        <label class="field"><span>Vorher</span><select class="select" id="pcA">${photos.map(p => `<option value="${esc(p.id)}" ${p.id === before.id ? 'selected' : ''}>${esc(fmtDate(p.date))}</option>`).join('')}</select></label>
        <label class="field"><span>Nachher</span><select class="select" id="pcB">${photos.map(p => `<option value="${esc(p.id)}" ${p.id === after.id ? 'selected' : ''}>${esc(fmtDate(p.date))}</option>`).join('')}</select></label>
      </div>
      <div class="compare" id="pcBox">
        <img src="${after.data}" alt="Nachher">
        <img src="${before.data}" alt="Vorher" id="pcTop" style="clip-path:inset(0 50% 0 0)">
        <span class="cmp-line" id="pcLine" style="left:50%"></span>
        <span class="cmp-tag" style="left:10px">${esc(fmtDate(before.date))}</span><span class="cmp-tag" style="right:10px">${esc(fmtDate(after.date))}</span>
      </div>
      <input type="range" min="0" max="100" value="50" id="pcRange" class="mt-12" style="width:100%;accent-color:var(--accent);height:32px" aria-label="Vergleichs-Regler">
      <p class="center dim small mt-8">${Math.round(dayNum(after.date) - dayNum(before.date))} Tage Unterschied</p>`);
    const set = v => { $('#pcTop', m.el).style.clipPath = `inset(0 ${100 - v}% 0 0)`; $('#pcLine', m.el).style.left = v + '%'; };
    $('#pcRange', m.el).addEventListener('input', e => set(+e.target.value));
    const box = $('#pcBox', m.el);
    const drag = e => { const rc = box.getBoundingClientRect(); const v = clamp((e.clientX - rc.left) / rc.width * 100, 0, 100); set(v); $('#pcRange', m.el).value = v; };
    box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); drag(e); box.onpointermove = drag; });
    box.addEventListener('pointerup', () => { box.onpointermove = null; });
    $('#pcA', m.el).addEventListener('change', e => { before = photos.find(p => p.id === e.target.value); draw(); });
    $('#pcB', m.el).addEventListener('change', e => { after = photos.find(p => p.id === e.target.value); draw(); });
  };
  draw();
};


