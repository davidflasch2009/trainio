/* Trainio – Start-Tab (Dashboard, Kacheln, Workout starten) und Ziele pro Übung
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
    const dots = Array.from({ length: 7 }, (_, i) => `<i class="${st.days.has(cw + i) ? 'on' : ''} ${cw + i === t ? 'today' : ''}" title="${WD_SHORT[dowOfDN(cw + i)]}"></i>`).join('');
    const nRecent = S().homeRecent ?? 3;
    const recent = nRecent ? ix.rows.slice(-nRecent).reverse() : [];
    el.innerHTML = `
      <div class="start-date">${esc(new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
      ${S().design === 'sky' ? Sky.startLine() : ''}
      ${w ? `<button class="card clickable mt-16" data-act="go" data-tab="training" style="width:100%;text-align:left;border-color:var(--accent-dim)">
          <div class="row"><span class="badge accent"><span class="pulse" style="width:8px;height:8px;border-radius:50%;background:currentColor;animation:pulse 1.4s infinite"></span> Live</span><span class="grow"></span><span class="wo-timer" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span></div>
          <h3 class="mt-8">${esc(w.name)}</h3>
        </button>` : ''}
      ${S().homeStats === false ? '' : `<div class="stat-grid mt-16">${homeTileKeys().map(k => ({
        streak: `<div class="stat">
          <div class="stat-label">${icon('flame')} Streak ${infoBtn('Aufeinanderfolgende Wochen mit mindestens einem Workout. Die Punkte zeigen deine Trainingstage dieser Woche.')}</div>
          <div class="stat-value">${st.cur}<small>${st.cur === 1 ? 'Woche' : 'Wochen'}</small></div>
          <div class="week-dots">${dots}</div>
        </div>`,
        volume: `<div class="stat">
          <div class="stat-label">${icon('bolt')} Volumen ${infoBtn('Wiederholungen × Gewicht aller Sätze dieser Woche. Vergleich: Vorwoche bis zum gleichen Tag.')}</div>
          <div class="stat-value">${fmtTon(volNow)}</div>
          <div class="stat-sub">diese Woche ${deltaHtml(volNow, volPrev)}</div>
        </div>`,
        workouts: `<div class="stat">
          <div class="stat-label">${icon('trophy')} Workouts</div>
          <div class="stat-value">${ix.rows.length}</div>
          ${ix.rows.length ? '' : '<div class="stat-sub">Leg los!</div>'}
        </div>`,
        score: scoreTile(ix, t),
        next: k !== 'next' ? '' : `<button class="stat clickable" data-act="startNext" style="text-align:left;color:inherit;font:inherit;cursor:pointer">
          <div class="stat-label">${icon('calendar')} ${next ? whenLabel(next) : 'Nächstes Training'}</div>
          <div class="stat-value" style="font-size:19px">${next ? esc(next.day.name) : '–'}</div>
          ${next ? '' : `<div class="stat-sub ellipsis">${activePlan() ? 'Keine Tage geplant' : 'Plan erstellen →'}</div>`}
        </button>`
      })[k] || moreTile(k, ix, t, cw)).join('')}</div>`}
      <div class="mt-16">
        ${w ? `<button class="btn btn-hero" data-act="go" data-tab="training">${icon('play')} Workout fortsetzen</button>`
            : `<button class="btn btn-hero" data-act="startSheet">${icon('play')} Workout starten</button>`}
      </div>
      ${Heart.startCard()}
      ${goalsCard()}
      ${nRecent ? `<div class="section-head"><h2>Letzte Workouts</h2>${ix.rows.length ? `<button class="link-btn" data-act="showHistory">Alle anzeigen</button>` : ''}</div>
      ${recent.length ? `<div class="col">${recent.map(miniWorkoutCard).join('')}</div>`
        : `<div class="card">${emptyState('dumbbell', 'Noch keine Workouts', 'Starte dein erstes Training – oder importiere deine Arrow-History unter Mehr → Daten.', F('f_arrow') ? `<button class="btn btn-secondary" data-act="openArrow">${icon('upload')} Arrow-Import</button>` : '')}</div>`}` : ''}
    `;
  }
};
/* Startseiten-Kacheln: Auswahl und Reihenfolge unter Mehr → Darstellung → Startseite
   [Schlüssel, Name, Beschreibung, nur wenn …] – die ersten vier sind der Standard */
const HOME_TILES = [
  ['streak', 'Streak', 'Wochen am Stück mit Training'],
  ['volume', 'Volumen', 'Diese Woche, Vergleich mit der Vorwoche'],
  ['workouts', 'Workouts', 'Alle bisher'],
  ['next', 'Nächstes Training', 'Aus deinem Plan – antippen startet'],
  ['score', 'Ø Score', 'Workout-Score der letzten 4 Wochen', () => F('f_score')],
  ['sets', 'Sätze', 'Diese Woche, Vergleich mit der Vorwoche'],
  ['time', 'Trainingszeit', 'Diese Woche, Vergleich mit der Vorwoche'],
  ['month', 'Workouts im Monat', 'Vergleich mit dem Vormonat'],
  ['last', 'Letztes Workout', 'Wann und wie lange – antippen öffnet es'],
  ['consistency', 'Konsistenz', 'Wochenziel erreicht in den letzten 8 Wochen'],
  ['prs', 'PRs', 'Neue Bestleistungen der letzten 30 Tage', () => F('f_prs')],
  ['lift', 'Kraft einer Übung', 'Geschätztes 1RM einer Übung deiner Wahl'],
  ['bw', 'Körpergewicht', 'Letzter Wert und Veränderung in 4 Wochen', () => F('f_body')],
  ['cardio', 'Cardio', 'Minuten diese Woche, Vergleich mit der Vorwoche'],
  ['rhr', 'Ruhepuls', 'Letzter Wert – antippen misst', () => F('f_heart')],
  ['vo2', 'VO2max', 'Geschätzt oder gemessen, mit Einordnung', () => F('f_heart')],
  ['heart', 'Herz-Woche', 'Einheiten und Zone 2 dieser Woche', () => F('f_heart')]
];
const tileAvail = k => { const x = HOME_TILES.find(y => y[0] === k); return !!x && (!x[3] || x[3]()); };
const homeTileKeys = () => (Array.isArray(S().homeTiles) ? S().homeTiles : HOME_TILES.slice(0, 4).map(x => x[0])).filter(tileAvail);
/** Kachel, die per Tipp in einen Fortschritt-Bereich springt */
const homeLink = sub => F('f_progress') ? `class="stat clickable" data-act="homeProg" data-sub="${sub}" style="text-align:left;color:inherit;font:inherit;cursor:pointer"` : 'class="stat"';
Actions.homeProg = el => { UI.progSub = el.dataset.sub; saveUI(); App.go('progress'); };
/** Weitere Kacheln (alles außer Streak, Volumen, Workouts, Score, Nächstes Training) */
function moreTile(k, ix, t, cw) {
  const rows = ix.rows, inR = (a, b) => rows.filter(r => r.dn >= a && r.dn <= b);
  // Vorwoche bis zum gleichen Tag (wie beim Volumen)
  const prevEnd = cw - 7 + (Analytics.cmpEnd() - cw);
  const week = key => [sum(inR(cw, t).map(r => r[key])), sum(inR(cw - 7, prevEnd).map(r => r[key]))];
  const stat = (ic, label, value, sub, attrs = 'class="stat"', valStyle = '') => {
    const tag = attrs.includes('data-act') ? 'button' : 'div';
    return `<${tag} ${attrs}><div class="stat-label">${icon(ic)} ${label}</div><div class="stat-value"${valStyle}>${value}</div><div class="stat-sub ellipsis">${sub}</div></${tag}>`;
  };
  const in4w = (cur, old, d = 1) => { const x = toU(cur - old); return `${x > 0 ? '+' : ''}${nf(x, d)} ${unit()} in 4 Wochen`; };
  switch (k) {
    case 'sets': { const [a, b] = week('sets'); return stat('layers', 'Sätze', a, `diese Woche ${deltaHtml(a, b)}`); }
    case 'time': { const [a, b] = week('dur'); return stat('timer', 'Trainingszeit', a ? fmtDur(a) : '0 min', `diese Woche ${deltaHtml(a, b)}`); }
    case 'cardio': { const [a, b] = week('cSec'); return stat('heart', 'Cardio', a ? fmtDur(a) : '0 min', `diese Woche ${deltaHtml(a, b)}`, F('f_cardio') || F('f_heart') ? homeLink('cardio') : undefined); }
    case 'month': {
      const d = new Date(), m0 = dayNum(isoDate(new Date(d.getFullYear(), d.getMonth(), 1))), p0 = dayNum(isoDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
      return stat('calendar', 'Workouts im Monat', inR(m0, t).length, `Vormonat: ${inR(p0, m0 - 1).length}`);
    }
    case 'last': {
      const r = rows[rows.length - 1];
      return stat('history', 'Letztes Workout', r ? esc(r.name) : '–', r ? `${relDays(r.dn)} · ${fmtDur(r.dur)}` : 'noch keins',
        r ? `class="stat clickable" data-act="openWorkout" data-id="${esc(r.id)}" style="text-align:left;color:inherit;font:inherit;cursor:pointer"` : undefined, ' style="font-size:19px"');
    }
    case 'consistency': {
      // Trainingstage (ohne reine Cardio-Tage) je abgeschlossener Woche, Ziel wie beim Streak
      const goal = weeklyTarget();
      let hit = 0;
      for (let i = 1; i <= 8; i++) { const w = cw - 7 * i; if (new Set(inR(w, w + 6).filter(r => !r.cardioOnly).map(r => r.dn)).size >= goal) hit++; }
      return stat('target', 'Konsistenz', `${hit}<small>/ 8 Wochen</small>`, `Wochenziel (${goal}×) erreicht`);
    }
    case 'prs': {
      const ev = ix.prEvents.filter(p => p.dn > t - 30), l = ev[ev.length - 1];
      return stat('trophy', 'PRs', `${ev.length}<small>in 30 Tagen</small>`, l ? `${esc(Ex.name(l.exId))} · ${relDays(l.dn)}` : 'noch keine', F('f_strength') ? homeLink('strength') : undefined);
    }
    case 'lift': {
      const ex = Ex.get(S().homeLiftEx);
      if (!ex) return stat('trendUp', 'Kraft', '–', 'Übung wählen', 'class="stat clickable" data-act="tileLiftEx" style="text-align:left;color:inherit;font:inherit;cursor:pointer"');
      const ss = Analytics.sessionsOf(ex.id).filter(x => x.best > 0), l = ss[ss.length - 1];
      const old = l ? [...ss].reverse().find(x => x.dn <= l.dn - 28) : null;
      return stat('trendUp', esc(ex.name), l ? `${wNum(l.best)}<small>${unit()}</small>` : '–', l ? (old ? in4w(l.best, old.best) : `1RM geschätzt · ${relDays(l.dn)}`) : 'noch nicht trainiert',
        `class="stat clickable" data-act="openExercise" data-id="${esc(ex.id)}" style="text-align:left;color:inherit;font:inherit;cursor:pointer"`);
    }
    case 'bw': {
      const s = Analytics.bwSeries(), l = s[s.length - 1];
      const old = l ? [...s].reverse().find(x => x.dn <= l.dn - 28) : null;
      return stat('scale', 'Körpergewicht', l ? `${wNum(l.kg)}<small>${unit()}</small>` : '–', l ? (old ? in4w(l.kg, old.kg) : relDays(l.dn)) : 'noch nicht eingetragen', homeLink('body'));
    }
    case 'rhr': return Heart.rhrTile();
    case 'vo2': return Heart.vo2Tile();
    case 'heart': return Heart.weekTile();
  }
  return '';
}
/** Ø Workout-Score der letzten 4 Wochen + letzter Score */
function scoreTile(ix, t) {
  const rows = ix.rows.filter(Analytics.hasScore);
  const sc = rows.filter(r => r.dn > t - 28).map(r => Analytics.score(r.id)).filter(Boolean).map(s => s.score);
  const last = rows[rows.length - 1];
  return `<div class="stat">
    <div class="stat-label">${icon('target')} Ø Score ${infoBtn('Durchschnittlicher Workout-Score der letzten 4 Wochen. Für die Bewertung zählen die Kraftübungen.')}</div>
    <div class="stat-value">${sc.length ? nf(avg(sc), 0) : '–'}</div>
    <div class="stat-sub">${last ? `letzter Score: ${Analytics.score(last.id).score}` : 'noch kein Score'}</div>
  </div>`;
}
function miniWorkoutCard(r) {
  const d = parseISO(r.date);
  return `<button class="card clickable tight mini-wo" data-act="openWorkout" data-id="${esc(r.id)}" style="width:100%;text-align:left;color:inherit;font:inherit">
    <div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
    <div class="grow">
      <div class="bold ellipsis">${esc(r.name)}</div>
      <div class="mw-stats"><span>${icon('timer', '') .replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${fmtDur(r.dur)}</span>${r.sets || !r.cSec ? `<span>${fmtTon(r.ton)}</span>` : ''}${r.cSec || r.cKm ? `<span>${icon('heart').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${fmtDur(r.cSec)}${r.cKm ? ' · ' + fmtKm(r.cKm) : ''}</span>` : ''}</div>
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
    n && { key: 'next', label: `${n.day.name}`, kicker: whenLabel(n), icon: 'play', featured: true },
    Tpl.all().length && { key: 'pick', label: 'Eins meiner Workouts', icon: 'layers' },
    { key: 'compose', label: 'Workout zusammenstellen', icon: 'list' },
    { key: 'cardio', label: 'Cardio', icon: 'heart', featured: 'plain' },
    { key: 'free', label: 'Leeres Workout', icon: 'plus' },
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
    { key: '__all', label: recent.length ? 'Andere Cardio-Art …' : 'Cardio-Art wählen …', icon: 'list' }
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
const best1RM = exId => Math.max(0, maxOf(sinceFix(Analytics.sessionsOf(exId)).filter(x => !x.cardio), x => x.best));
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
    const fx = lastFix(Analytics.sessionsOf(g.exId));
    const b = bestForReps(g.exId, g.reps, fx ? Store.all('workouts').filter(w => w.date >= fx.date) : undefined), cur = b ? b.w : 0;
    return { cur, b, p: g.kg ? Math.min(1, cur / g.kg) : 0, ok: !!g.reachedAt || cur >= g.kg - 1e-6 };
  }
  const cur = best1RM(g.exId);
  const ss = sinceFix(Analytics.sessionsOf(g.exId)).filter(x => !x.cardio && x.bestSet), top = ss.length ? ss.reduce((a, b) => b.best > a.best ? b : a) : null;
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
    ${gs.length ? `<div class="card" style="padding-top:4px;padding-bottom:4px">${rows}</div>` : `<button class="card clickable" data-act="kgoalEdit" style="width:100%;text-align:left;color:inherit;font:inherit"><div class="bold">${icon('target').replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}Kraftziel setzen</div></button>`}`;
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
          <label class="field" id="gRepsF"><span>Wiederholungen${infoBtn('Erreicht, sobald du einen Satz mit so vielen Wiederholungen bei diesem Gewicht schaffst.')}</span><input class="input num-input" id="gReps" inputmode="numeric" value="${reps0}"></label>
          <label class="field" id="gKgF"><span id="gKgL"></span><input class="input num-input" id="gKg" inputmode="decimal" value="${old ? String(round(toU(old.kg), 2)).replace('.', ',') : String(sugW(reps0)).replace('.', ',')}"></label>
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
        ? `${b ? `Bisher schwerster Satz mit ${reps}+ Wdh.: ${fmtW(b.w)} × ${b.r}.` : `Bisher kein Satz mit ${reps || '…'}+ Wdh.`}`
        : `Geschätztes 1RM aus deinen Sätzen (${(E1RM_FORMULAS.find(f => f[0] === S().e1rmFormula) || E1RM_FORMULAS[0])[1]}). ${c ? `Aktuell ${fmtW(c, 1)}.` : 'Noch keine Sätze.'}`;
    };
    draw();
    m.el.addEventListener('input', e => { if (e.target.id === 'gReps') draw(); });
    m.el.addEventListener('click', e => {
      const t = e.target.closest('#gType [data-t]');
      if (t && t.dataset.t !== type) {
        type = t.dataset.t;
        const kgIn = $m('#gKg');
        kgIn.value = String(type === 'wr' ? sugW(Math.round(parseNum($m('#gReps').value) || 8)) : sug1()).replace('.', ',');
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
