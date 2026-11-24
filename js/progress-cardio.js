/* Trainio – Fortschritt: Cardio
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

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
      ${cb.card({ id: 'c1', wide: true, title: 'Cardio-Minuten pro Woche', info: 'Cardio-Minuten pro Woche. Gestrichelt: Ø der abgeschlossenen Wochen.',
        big: fmtDur(curMin * 60), small: 'im Zeitraum', delta: deltaHtml(curMin, prevMin), sub: prv ? prevLabel : '',
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
        <div class="cc-head"><span class="cc-title">Bestleistungen</span>${infoBtn('Deine besten Einheiten je Cardio-Art, unabhängig vom Zeitraum.')}</div>
        <div class="col mt-8" style="gap:12px">${bests.slice(0, 8).map(b => { const info = cardioInfo(Ex.get(b.id)); return `<div>
          <button class="link-btn" style="padding:0;min-height:28px;color:var(--text)" data-act="openExercise" data-id="${esc(b.id)}"><b>${esc(Ex.name(b.id))}</b> <span class="tiny dim">${b.n}×</span></button>
          <div class="cd-bests">${bestCell('Längste', b.dur, fmtDur(b.dur && b.dur.secs))}${info.mode === 'dist' ? bestCell('Weiteste', b.km && b.km.km ? b.km : null, b.km ? fmtKm(b.km.km) : '') + bestCell('Schnellste', b.kmh, b.kmh ? fmtKmh(b.kmh.kmh) : '') : ''}</div></div>`; }).join('')}</div>
      </div>
    </div>`;
  cb.mountAll();
};
Changes.cardioEx = el => { UI.cardioEx = el.value; saveUI(); App.renderCurrent(); };
