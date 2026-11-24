/* Trainio – Fortschritt: Kraft und Volumen
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ---------- Kraft ---------- */
const BENCHMARKS = {
  ex_bankdruecken: [1.0, 1.5, 2.0], ex_kniebeuge: [1.25, 1.75, 2.5], ex_kniebeuge_lowbar: [1.25, 1.75, 2.5],
  ex_kreuzheben: [1.5, 2.0, 2.75], ex_sumo_kreuzheben: [1.5, 2.0, 2.75], ex_military_press: [0.6, 0.85, 1.1], ex_ohp_kh: [0.6, 0.85, 1.1]
};
const median = a => { const v = [...a].sort((x, y) => x - y), m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
/** Kraftzuwachs braucht je Übung Werte aus mind. so vielen Wochen (im Zeitraum, ab dem letzten Form-Fix) */
const GAIN_MIN_WEEKS = 4;
const gainNeed = `mind. ${GAIN_MIN_WEEKS} Trainingswochen je Übung nötig`;
/** Sessions einer Übung im Zeitraum, ab dem letzten Form-Fix (davor war die Technik eine andere) */
const gainPts = (ix, id, r) => sinceFix(ix.sessions[id] || [], r.to).filter(s => s.dn >= r.from && s.dn <= r.to && s.best > 0);
/** Robuste Kraftkurve einer Übung (Sessions nach Datum sortiert):
   1. je Woche ein Wert: das beste e1RM der Woche (Heavy-/Light-Tage in einer Woche stören so nicht),
   2. Bezug (= 100 %) ist der Median der ersten k Wochenwerte (k = 2, ab 6 Wochen 3) – die Kurve steht dort auf 100 %,
   3. danach gleitender Median der letzten k Wochenwerte.
   Früher: bestes e1RM bis zum Tag ÷ erste Session. So ein laufendes Maximum steigt schon durch Tagesform-Schwankungen
   (σ 2–4 %) um 3–6 % (docs/redesign/recherche/trainio-score.md, Abschnitt 5). null bei weniger als GAIN_MIN_WEEKS Wochen. */
function robustSeries(pts) {
  const wk = [];
  for (const s of pts) {
    const w = weekStartDN(s.dn), last = wk[wk.length - 1];
    if (last && last.w === w) { last.best = Math.max(last.best, s.best); last.dn = s.dn; }
    else wk.push({ w, dn: s.dn, best: s.best });
  }
  if (wk.length < GAIN_MIN_WEEKS) return null;
  const k = wk.length >= 6 ? 3 : 2, base = median(wk.slice(0, k).map(w => w.best));
  // x = letzte Session der Woche (Stand an diesem Tag)
  const series = wk.map((w, i) => { const start = i < k, v = start ? base : median(wk.slice(i - k + 1, i + 1).map(p => p.best)); return { x: w.dn, v, ratio: v / base, start }; });
  return { base, cur: series[series.length - 1].v, k, weeks: wk.length, series };
}
/** Kraftzuwachs je Übung (mind. GAIN_MIN_WEEKS Trainingswochen im Zeitraum): aktuelle Form gegenüber dem Start im Zeitraum */
function strengthGains(ix, ids, r) {
  return ids.map(id => {
    const pts = gainPts(ix, id, r), rs = robustSeries(pts);
    return rs && { id, base: rs.base, cur: rs.cur, gain: (rs.cur / rs.base - 1) * 100, series: rs.series.map(p => ({ x: p.x, ratio: p.ratio })), n: pts.length, weeks: rs.weeks };
  }).filter(Boolean);
}
/** Kraft-Index (verkettet): Übungen, die später dazukommen, starten neutral und ziehen den Schnitt nicht nach unten.
   Geometrisches Mittel der Veränderungen – das arithmetische Mittel schaukelt sich bei Rauschen über viele Schritte auf. */
function gainIndex(gains) {
  const xs = uniq(gains.flatMap(g => g.series.map(p => p.x))).sort((a, b) => a - b);
  let level = 1, prev = new Map();
  return xs.map(x => {
    const cur = new Map();
    for (const g of gains) { let v = null; for (const p of g.series) { if (p.x <= x) v = p.ratio; else break; } if (v != null) cur.set(g.id, v); }
    const ch = [...cur].filter(([id]) => prev.has(id)).map(([id, v]) => Math.log(v / prev.get(id)));
    if (ch.length) level *= Math.exp(avg(ch));
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
    const cmp = ids.map(id => { const pts = gainPts(ix, id, r); return { id, n: pts.length, rs: robustSeries(pts) }; }).filter(x => x.rs).sort((a, b) => b.n - a.n).slice(0, 4)
      .map((x, i) => ({ id: x.id, color: c.series[i], pts: x.rs.series.map(p => ({ x: p.x, y: round(p.ratio * 100, 1),
        label: p.start ? `100 % (Start: e1RM ${fmtW(p.v)}, Median der ersten ${x.rs.k} Wochen)` : `${nf(p.ratio * 100, 0)} % (e1RM ${fmtW(p.v)}, Median der letzten ${x.rs.k} Wochen)` })) }));
    const cmpTop = cmp.length ? cmp.reduce((a, b) => b.pts[b.pts.length - 1].y > a.pts[a.pts.length - 1].y ? b : a) : null;
    return cb.card({ id: 'k13', wide: true, title: 'Kraft im Vergleich', info: 'Deine Form je Übung, die ersten Wochen im Zeitraum sind 100 %. So siehst du, welche Übung am schnellsten wächst.',
      big: cmpTop ? (cmpTop.pts[cmpTop.pts.length - 1].y >= 100 ? '+' : '') + nf(cmpTop.pts[cmpTop.pts.length - 1].y - 100, 0) + ' %' : '–', small: cmpTop ? Ex.name(cmpTop.id) : gainNeed,
      factory: () => cmp.length ? timeLine(cmp.map(x => lineDS(Ex.name(x.id), x.pts, x.color, { fill: false })), { legend: true, tooltipFmt: v => nf(v, 0) + ' %', yFmt: v => nf(v, 0) + ' %', thresholds: { axis: 'y', lines: [{ value: 100, label: 'Start', color: c.faint }] } }) : null });
  };
  // Tage seit letztem PR (für eine Übung oder eine Auswahl)
  const sincePRCard = (ids, firstDn) => {
    const ev = ix.prEvents.filter(p => ids.includes(p.exId));
    const last = ev[ev.length - 1];
    const fx = ids.length === 1 ? lastFix(ix.sessions[ids[0]] || []) : null, fixNewer = fx && (!last || fx.dn > last.dn);
    const since = fixNewer ? t - fx.dn : last ? t - last.dn : t - firstDn;
    return `<div class="chart-card">
        <div class="cc-head"><span class="cc-title">Tage seit letztem PR</span>${infoBtn(`Tage seit deinem letzten Rekord ${ids.length > 1 ? 'in diesen Übungen' : 'in dieser Übung'}.`)}</div>
        <div class="cc-big"><b style="font-size:46px">${since}</b><small>${since === 1 ? 'Tag' : 'Tage'}</small></div>
        <div class="cc-sub">${fixNewer ? `Seit dem Form-Fix am ${fmtDate(fx.date)} noch kein neuer PR` : last ? `Letzter PR: ${ids.length > 1 ? esc(Ex.name(last.exId)) + ' ' : ''}${fmtW(last.w)} × ${last.r} am ${fmtDate(last.date)}` : 'Noch kein PR – seit der ersten Session'}</div>
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
    const what = scope === 'muscle' ? `deiner ${muscle}-Übungen` : 'aller Übungen';
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
      ${cb.card({ id: 'kx', wide: true, title: 'Kraftzuwachs', info: `Wie viel stärker du im Zeitraum geworden bist, als Ø ${what}. Es zählen ganze Wochen, nicht einzelne Tage.`,
        big: idxNow != null ? (idxNow >= 0 ? '+' : '') + nf(idxNow, 1) + ' %' : '–', small: gains.length ? `Ø aus ${gains.length} ${gains.length === 1 ? 'Übung' : 'Übungen'}` : gainNeed,
        factory: () => idxPts.length > 1 ? timeLine([lineDS('Kraftzuwachs', idxPts.map(p => ({ x: p.x, y: p.y, label: `${p.y >= 0 ? '+' : ''}${nf(p.y, 1)} % (${p.n} Übungen)` })), c.accent)],
          { tooltipFmt: v => nf(v, 1) + ' %', yFmt: v => nf(v, 0) + ' %', thresholds: { axis: 'y', lines: [{ value: 0, label: '', color: c.faint }] } }) : null })}
      ${cb.card({ id: 'kt', title: 'Top-Aufsteiger', info: `Die Übungen mit dem größten Kraftzuwachs im Zeitraum. Es zählen ganze Wochen, nicht einzelne Tage.`, size: top.length > 5 ? 'lg' : '',
        big: top.length ? esc(Ex.name(top[0].id)) : '–', small: top.length ? `${top[0].gain >= 0 ? '+' : ''}${nf(top[0].gain, 0)} %` : gainNeed,
        factory: () => top.length ? barChart(top.map(g => Ex.name(g.id)), [barDS('Zuwachs', top.map(g => round(g.gain, 1)), top.map(g => g.gain > 0.05 ? c.accent : c.faint))],
          { horizontal: true, yFmt: v => nf(v, 0) + ' %', tooltipFmt: (v, ctx) => `${v >= 0 ? '+' : ''}${nf(v, 1)} % · ${fmtW(top[ctx.dataIndex].base)} → ${fmtW(top[ctx.dataIndex].cur)}` }) : null })}
      ${cmpCard(ids)}
      ${cb.card({ id: 'kp', wide: true, title: 'PR-Timeline', info: `Neue e1RM-Rekorde ${what} pro Woche.`,
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
  // Gewicht vs. Kraft: Veränderung im Zeitraum – robust wie der Kraftzuwachs (Wochenwerte, Median), kein laufendes Maximum
  const e1Rs = robustSeries(gainPts(ix, exId, r));
  const e1Delta = e1Rs ? e1Rs.cur - e1Rs.base : null;
  const bwDelta = bwR.length > 1 ? bwR[bwR.length - 1].kg - bwR[0].kg : null;
  const signKg = d => (d > 0.005 ? '+' : d < -0.005 ? '−' : '±') + fmtW(Math.abs(d));
  body.innerHTML = `${head}
    <div class="charts-grid">
      ${cb.card({ id: 'k1', wide: true, title: 'Geschätztes 1RM', info: `Bestes geschätztes 1RM je Session (Formel: ${(E1RM_FORMULAS.find(f => f[0] === S().e1rmFormula) || E1RM_FORMULAS[0])[1]}). Gestrichelt: Trend im Zeitraum.`,
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
      ${cb.card({ id: 'k12', wide: true, title: 'Rep-Maxima', info: 'Dein schwerstes Gewicht für 1 bis 12 Wiederholungen. Sind zwei Balken fast gleich hoch, ist ein neuer Rekord nah.',
        big: repMax.length ? fmtW(repMax[0].w) : '–', small: repMax.length ? (repMax[0].n === 1 && repMax[0].r === 1 ? 'echtes 1RM' : `schwerster Satz (${repMax[0].r} Wdh.)`) : '',
        sub: (newestRep ? `Neuester Rep-PR: ${fmtW(newestRep.w)} × ${newestRep.r} am ${fmtDN(newestRep.dn, { day: '2-digit', month: '2-digit', year: '2-digit' })}` : '') + (ssF !== ss ? ` · seit dem Form-Fix am ${fmtDate(ssF[0].date)}` : ''),
        factory: () => repMax.length ? barChart(repMax.map(x => x.n + '×'), [barDS('Bestes Gewicht', repMax.map(x => toU(x.w)), c.accent)],
          { tooltipFmt: (v, ctx) => `${fmtW(fromU(v))} für ${repMax[ctx.dataIndex].n}+ Wdh. · ${fmtDN(repMax[ctx.dataIndex].dn, { day: '2-digit', month: '2-digit', year: '2-digit' })}`, yFmt: v => nf(v, 0) }) : null })}
      ${cmpCard(exIds)}
      ${cb.card({ id: 'k2', title: 'Max-Gewicht pro Session', info: 'Schwerstes bewegtes Gewicht je Session (mind. 1 Wiederholung).',
        big: inRF.length ? fmtW(maxOf(inRF, s => s.maxW)) : '–', small: fixInR ? 'seit Form-Fix' : '',
        factory: () => inR.length ? timeLine([lineDS('Max-Gewicht', inR.map(s => ({ x: s.dn, y: toU(s.maxW), label: `${fmtW(s.maxW)} × ${s.repsAtMax}` })), c.accent, { pointRadius: 4, fill: false })], { tooltipFmt: v => fmtW(fromU(v)), thresholds: fixMarks }) : null })}
      ${cb.card({ id: 'k4', title: 'Trainings-Intensität', info: 'Schwerstes Gewicht der Session in % deines besten e1RM. 85 % entspricht etwa 5 Wiederholungen.',
        big: inR.length ? nf(inR[inR.length - 1].maxW / runBest.get(inR[inR.length - 1]) * 100, 0) + ' %' : '–', small: 'letzte Session',
        factory: () => inR.length ? timeLine([lineDS('Intensität', inR.map(s => ({ x: s.dn, y: round(s.maxW / runBest.get(s) * 100, 1) })), c.accent)], { tooltipFmt: v => nf(v, 0) + ' %', yFmt: v => v + ' %', yMax: 100 }) : null })}
      ${cb.card({ id: 'k5', title: 'Relative Kraft', info: 'e1RM geteilt durch dein Körpergewicht. Linien: solide, fortgeschritten, elite.',
        big: hasBw && inR.length && Analytics.bwAt(inR[inR.length - 1].dn) ? nf(inR[inR.length - 1].best / Analytics.bwAt(inR[inR.length - 1].dn), 2) + ' ×' : '–', small: hasBw ? 'Körpergewicht' : 'Körpergewicht im Körper-Tab eintragen',
        factory: () => {
          if (!hasBw) return null;
          const pts = inR.map(s => { const bw = Analytics.bwAt(s.dn); return bw ? { x: s.dn, y: round(s.best / bw, 3) } : null; }).filter(Boolean);
          if (!pts.length) return null;
          const lines = bench ? [{ value: bench[0], label: 'solide', color: c.faint }, { value: bench[1], label: 'fortgeschritten', color: c.dim }, { value: bench[2], label: 'elite', color: c.accent }] : null;
          const ys = pts.map(p => p.y);
          return timeLine([lineDS('Relative Kraft', pts, c.accent)], { tooltipFmt: v => nf(v, 2) + ' × KG', yFmt: v => nf(v, 1), thresholds: lines ? { lines, axis: 'y' } : null, yMin: Math.max(0, Math.min(...ys, bench ? bench[0] : 99) - .2), yMax: bench ? Math.max(...ys, bench[2]) + .15 : undefined });
        } })}
      ${cb.card({ id: 'kgw', wide: true, title: 'Gewicht vs. Kraft', info: 'Geschätztes 1RM (links) und Körpergewicht (rechts) im selben Zeitraum. So siehst du, ob du beim Zu- oder Abnehmen stärker wirst.',
        big: e1Delta != null ? signKg(e1Delta) : '–', small: e1Delta != null ? 'Kraft (e1RM)' : `mind. ${GAIN_MIN_WEEKS} Trainingswochen im Zeitraum nötig`,
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
  // Reine Cardio-Workouts haben kein Volumen – sonst Punkte auf der Nulllinie und ein verfälschter Ø
  return ix.rows.filter(w => !w.cardioOnly).map(w => ({ dn: w.dn, ton: w.ton, sets: w.sets, reps: w.reps, bins: w.bins, name: w.name, restAvg: w.restAvg }));
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
      ${cb.card({ id: 'v1', wide: true, title: 'Tonnage pro Woche', info: `Wiederholungen × Gewicht pro Woche (${scopeName}). Gestrichelt: Ø der abgeschlossenen Wochen.`,
        big: fmtTon(tot(x => x.ton)), small: 'im Zeitraum', delta: deltaHtml(tot(x => x.ton), totP(x => x.ton)), sub: prv ? prevLabel : '',
        factory: () => inR.length ? barChart(wLabels, [barDS('Tonnage', tonW.map(toU), c.accent), avgLine(tonW.map(toU))], { running: ri, tooltipFmt: v => fmtTon(fromU(v)), yFmt: v => nf(v / (unit() === 'kg' && v >= 1000 ? 1000 : 1), 1) + (unit() === 'kg' && v >= 1000 ? ' t' : '') }) : null })}
      ${scope === 'muscle' ? cb.card({ id: 'v2', title: 'Sätze pro Woche', info: `Kräftig: ${mm} ist Hauptmuskel, blass: ${mm} hilft nur mit. Gestrichelt: Ø der direkten Sätze.`,
          big: nf(tot(x => x.sets), 0), small: 'direkte Sätze', delta: deltaHtml(tot(x => x.sets), totP(x => x.sets)),
          sub: sum(helpW) ? `+ ${nf(sum(helpW), 0)} mitgeholfen${helpTop.length ? ` (${esc(helpTop.join(', '))})` : ''}` : '',
          factory: () => inR.length || sum(helpW) ? barChart(wLabels, [
            barDS('Direkt', setsW, c.accent, { borderRadius: 0 }),
            barDS('Mitgeholfen', helpW, alpha(c.accent, .3), { runAlpha: .12 }),
            avgLine(setsW)], { stacked: true, legend: true, running: ri, tooltipFmt: v => `${nf(v, 0)} Sätze` }) : null })
        : cb.card({ id: 'v2', title: 'Sätze pro Woche', info: 'Erledigte Arbeitssätze pro Woche.', big: nf(tot(x => x.sets), 0), small: 'Sätze', delta: deltaHtml(tot(x => x.sets), totP(x => x.sets)),
        factory: () => inR.length ? barChart(wLabels, [barDS('Sätze', setsW, c.accent), avgLine(setsW)], { running: ri, tooltipFmt: v => nf(v, 0) }) : null })}
      ${cb.card({ id: 'v3', title: 'Wiederholungen pro Woche', info: 'Alle Wiederholungen pro Woche.', big: nf(tot(x => x.reps), 0), small: 'Wdh.', delta: deltaHtml(tot(x => x.reps), totP(x => x.reps)),
        factory: () => inR.length ? barChart(wLabels, [barDS('Wiederholungen', repsW, c.accent), avgLine(repsW)], { running: ri, tooltipFmt: v => nf(v, 0) }) : null })}
      ${cb.card({ id: 'v4', wide: true, title: scope === 'total' ? 'Volumen pro Workout' : 'Volumen pro Session', info: 'Jeder Punkt ist ein Workout, die Linie der Ø der letzten 3 Wochen.',
        big: inR.length ? fmtTon(avg(inR.map(x => x.ton))) : '–', small: 'Ø', delta: inP && inP.length ? deltaHtml(avg(inR.map(x => x.ton)), avg(inP.map(x => x.ton))) : '',
        factory: () => {
          if (inR.length < 2) return null;
          const pts = inR.map(x => ({ x: x.dn, y: toU(x.ton), label: `${fmtTon(x.ton)}${x.name ? ' · ' + x.name : ''}` }));
          return timeLine([
            lineDS('Workout', pts, c.faint, { showLine: false, fill: false, pointRadius: 3, pointBackgroundColor: c.faint, pointBorderWidth: 0 }),
            lineDS('Ø 3 Wochen', timeAvg(pts), c.accent, { fill: false, pointRadius: 0 })
          ], { legend: true, tooltipFmt: v => fmtTon(fromU(v)) });
        } })}
      ${scope === 'total' ? `${cb.card({ id: 'vt', wide: true, title: 'Volumen pro Workout-Typ', info: 'Volumen je Workout, getrennt nach Name (z. B. „Push A“ und „Push B“). Trend: die letzten 3 Einheiten gegen die ersten 3.',
        big: types.length ? nf(types.length, 0) : '–', small: types.length ? (types.length === 1 ? 'Workout-Typ' : 'Workout-Typen') : 'mind. 2 gleichnamige Workouts nötig',
        factory: () => types.length ? timeLine(types.map(tp => lineDS(tp.name, tp.ws.map(w => ({ x: w.dn, y: toU(w.ton), label: fmtTon(w.ton) })), tp.color, { fill: false, pointRadius: 3 })), { legend: true, tooltipFmt: v => fmtTon(fromU(v)) }) : null,
        extra: types.length ? `<div class="mt-8">${types.map(tp => `<div class="ratio-row small"><span class="ampel-dot" style="background:${tp.color}"></span><span class="grow">${esc(tp.name)} <span class="dim">${tp.ws.length}×</span></span><span class="dim">Ø ${fmtTon(tp.avgTon)}</span>${deltaHtml(tp.last, tp.first)}</div>`).join('')}</div>` : '' })}
      ${cb.card({ id: 'v12', title: 'Trainingsdichte', info: 'Wiederholungen × Gewicht pro Trainingsminute. Steigt sie, schaffst du mehr in derselben Zeit.',
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
      ${cb.card({ id: 'v8', wide: true, title: 'Set-Intensitäts-Mix', info: 'Anteil deiner Sätze je Wiederholungsbereich. Für Muskelaufbau wirken alle Bereiche, solange die Sätze hart sind.',
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
