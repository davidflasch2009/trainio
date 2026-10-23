/* Trainio – Diagramm-Bausteine (Chart.js)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   13. Charts (Chart.js v4, lazy geladen)
   ========================================================================== */
function chartColors() {
  return {
    accent: cssVar('--accent'), text: cssVar('--text'), dim: cssVar('--text-dim'), faint: cssVar('--text-faint'),
    grid: cssVar('--grid'), surface: cssVar('--surface'), danger: cssVar('--danger'), warning: cssVar('--warning'),
    success: cssVar('--success'), series: [1, 2, 3, 4, 5, 6, 7, 8].map(i => cssVar('--c' + i))
  };
}
const Charts = (() => {
  const inst = new Map();
  let loading = null;
  function ensure() {
    if (window.Chart) return Promise.resolve(true);
    if (!loading) loading = loadScript(CDN.chart).then(() => { window.Chart.register(crosshairPlugin); applyDefaults(); return true; }).catch(() => { loading = null; return false; });
    return loading;
  }
  function applyDefaults() {
    const C = window.Chart;
    if (!C) return;
    const c = chartColors();
    C.defaults.font.family = getComputedStyle(document.body).fontFamily;
    C.defaults.font.size = 11.5;
    C.defaults.color = c.dim;
    C.defaults.borderColor = c.grid;
    C.defaults.maintainAspectRatio = false;
    C.defaults.responsive = true;
    C.defaults.animation.duration = S().motion === 'full' ? 350 : 0;
    const tt = C.defaults.plugins.tooltip;
    Object.assign(tt, { backgroundColor: cssVar('--surface-3'), titleColor: c.text, bodyColor: c.text, borderColor: cssVar('--border-strong'), borderWidth: 1, padding: 10, cornerRadius: 10, boxPadding: 4, usePointStyle: true });
    Object.assign(C.defaults.plugins.legend.labels, { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 14, color: c.dim });
    Object.assign(C.defaults.elements.point, { radius: 0, hoverRadius: 6, hitRadius: 14 });
    C.defaults.elements.line.borderWidth = 2;
    C.defaults.elements.line.borderCapStyle = 'round';
    C.defaults.elements.line.borderJoinStyle = 'round';
    C.defaults.elements.bar.borderRadius = 4;
    C.defaults.scale.grid.lineWidth = 1;
    C.defaults.scale.ticks.color = c.faint;
    C.defaults.font.size = 11;
    C.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12 };
    C.defaults.plugins.tooltip.bodyFont = { weight: '500', size: 12.5 };
    // Re-Theme laufender Charts (Kopie der Liste – mount() entfernt und ergänzt Einträge, sonst Endlosschleife)
    for (const [id, x] of [...inst]) if (x.chart) draw(id, x.factory);
  }
  // Unterhalb des Bildschirms erst zeichnen, wenn das Diagramm in Sicht kommt – dann sieht man es aufbauen
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const id = e.target.id.slice(3), x = inst.get(id);
    if (x && x.lazy && x.canvas === e.target) draw(id, x.factory);
  }), { rootMargin: '0px 0px -6% 0px' }) : null;
  function mount(id, factory) {
    const cv = document.getElementById('cv-' + id);
    if (!cv) return;
    destroy(id);
    if (io && motionFull() && cv.getBoundingClientRect().top > innerHeight) {
      inst.set(id, { factory, canvas: cv, lazy: true });
      io.observe(cv);
      return;
    }
    draw(id, factory);
  }
  function draw(id, factory) {
    const cv = document.getElementById('cv-' + id);
    if (!cv) return;
    inst.delete(id);
    const box = cv.parentElement;
    box.classList.remove('chart-wait');
    $$('.chart-empty', box).forEach(n => n.remove());
    if (!window.Chart) {
      box.insertAdjacentHTML('beforeend', `<div class="chart-empty">Diagramme brauchen beim ersten Mal eine Internetverbindung.</div>`);
      return;
    }
    let cfg = null;
    try { cfg = factory(); } catch (e) { console.error('Chart', id, e); }
    if (!cfg) {
      cv.style.display = 'none';
      box.insertAdjacentHTML('beforeend', `<div class="chart-empty">Noch nicht genug Daten im gewählten Zeitraum</div>`);
      inst.set(id, { factory, canvas: cv });
      return;
    }
    cv.style.display = '';
    const chart = new window.Chart(cv.getContext('2d'), cfg);
    inst.set(id, { chart, canvas: cv, factory });
  }
  function destroy(id) { const x = inst.get(id); if (x && x.chart) x.chart.destroy(); if (x && x.lazy && io) io.unobserve(x.canvas); inst.delete(id); }
  function destroyIn(root) {
    for (const [id, x] of [...inst]) if (!x.canvas || !x.canvas.isConnected || (root && root.contains(x.canvas))) destroy(id);
  }
  function get(id) { return inst.get(id); }
  return { ensure, applyDefaults, mount, destroy, destroyIn, get };
})();

/* Hilfslinien (MEV/MAV/MRV, Benchmarks) als kleines Inline-Plugin */
const thresholdPlugin = {
  id: 'thresholds',
  afterDatasetsDraw(chart, args, opts) {
    const lines = (opts && opts.lines) || [];
    if (!lines.length) return;
    const { ctx, chartArea: a, scales } = chart;
    const ax = opts.axis === 'x' ? scales.x : scales.y;
    ctx.save();
    ctx.font = '600 10.5px ' + getComputedStyle(document.body).fontFamily;
    for (const l of lines) {
      const p = ax.getPixelForValue(l.value);
      if (!Number.isFinite(p) || (opts.axis === 'x' ? p < a.left || p > a.right : p < a.top || p > a.bottom)) continue;
      ctx.strokeStyle = l.color; ctx.fillStyle = l.color; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (opts.axis === 'x') { ctx.moveTo(p, a.top); ctx.lineTo(p, a.bottom); } else { ctx.moveTo(a.left, p); ctx.lineTo(a.right, p); }
      ctx.stroke();
      ctx.setLineDash([]);
      if (opts.axis === 'x') { ctx.textAlign = 'center'; ctx.fillText(l.label, p, a.top - 5); }
      else { ctx.textAlign = 'left'; ctx.fillText(l.label, a.left + 4, p - 4); }
    }
    ctx.restore();
  }
};

/* Zielbereich hinter Balken: je Kategorie [von, bis] oder null – benachbarte gleiche Bereiche ergeben ein durchgehendes Band */
const rangeBandPlugin = {
  id: 'rangeBand',
  beforeDatasetsDraw(chart, args, opts) {
    const rs = (opts && opts.ranges) || [];
    if (!rs.some(Boolean)) return;
    const { ctx, chartArea: a, scales: { x, y } } = chart;
    const step = rs.length > 1 ? Math.abs(x.getPixelForValue(1) - x.getPixelForValue(0)) : a.right - a.left;
    ctx.save();
    ctx.beginPath(); ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top); ctx.clip();
    rs.forEach((r, i) => {
      if (!r) return;
      const cx = x.getPixelForValue(i), y0 = y.getPixelForValue(r[0]), y1 = y.getPixelForValue(r[1]);
      ctx.fillStyle = opts.color;
      ctx.fillRect(cx - step / 2, Math.min(y0, y1), step, Math.max(1, Math.abs(y0 - y1)));
      ctx.fillStyle = opts.edge;
      ctx.fillRect(cx - step / 2, Math.min(y0, y1), step, 1); ctx.fillRect(cx - step / 2, Math.max(y0, y1) - 1, step, 1);
    });
    ctx.restore();
  }
};
/* Senkrechte Hilfslinie an der angetippten Stelle (Linien-Diagramme) */
const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    if (chart.config.type !== 'line') return;
    const act = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
    if (!act.length) return;
    const x = act[0].element.x, a = chart.chartArea, ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = cssVar('--border-strong'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke();
    ctx.restore();
  }
};
/** Gleitender Durchschnitt über die letzten n Punkte */
const movingAvg = (pts, n = 5) => pts.map((p, i) => { const w = pts.slice(Math.max(0, i - n + 1), i + 1); return { x: p.x, y: round(avg(w.map(q => q.y)), 2) }; });
/** Durchschnitt über ein Zeitfenster (Tage) – glättet abwechselnde Trainingstage */
const timeAvg = (pts, days = 21) => pts.map(p => ({ x: p.x, y: round(avg(pts.filter(q => q.x <= p.x && q.x > p.x - days).map(q => q.y)), 2) }));
const dnTick = function (v) {
  const span = (this.max - this.min) || 0;
  return span > 420 ? fmtDN(v, { month: 'short', year: '2-digit' }) : fmtDN(v, { day: '2-digit', month: '2-digit' });
};
function lineDS(label, data, color, opts = {}) {
  const c = chartColors();
  const n = data.length;
  return {
    label, data, borderColor: color, backgroundColor: alpha(color, .1), fill: true, tension: .25,
    // Punkte nur bei wenigen Werten – sonst nur der letzte Wert als Endpunkt
    pointRadius: ctx => n <= 16 ? 3 : (ctx.dataIndex === n - 1 ? 3.5 : 0), pointHoverRadius: 5, pointHitRadius: 12, pointBackgroundColor: color,
    pointBorderColor: c.surface, pointBorderWidth: 2, borderWidth: 2, spanGaps: true, ...opts
  };
}
/** Achsen-Ticks mit so vielen Nachkommastellen wie die Schrittweite braucht (82,5 statt 83/83/83) */
const yAuto = (suffix = '') => function (v, i, ticks) {
  const step = ticks && ticks.length > 1 ? Math.abs(ticks[1].value - ticks[0].value) : 1;
  return nf(v, step >= 1 ? 0 : step >= 0.1 ? 1 : 2) + suffix;
};
/** Start/Ende der Achse liegen oft dicht neben dem nächsten „runden" Tick – dann überlappen die Datumsangaben (z. B. „25.09.13.10.") */
function dropCrowdedTicks(ax) {
  const t = ax.ticks;
  if (t.length < 4) return;
  const step = t[2].value - t[1].value;
  if (t[t.length - 1].value - t[t.length - 2].value < step * .6) t.splice(t.length - 2, 1);
  if (t[1].value - t[0].value < step * .6) t.splice(1, 1);
}
/** Index der laufenden Woche in einer Wochen-Liste (oder -1) */
const runIdx = weeks => weeks.indexOf(weekStartDN(todayDN()));
/** Durchschnitt ohne die laufende (unvollständige) Woche */
const avgDone = (vals, ri) => avg(vals.filter((_, i) => i !== ri));
/** Laufende Woche/Monat: Balken blass, Linien zum letzten Punkt gestrichelt – kein scheinbarer Absturz */
function markRunning(datasets, ri) {
  for (const d of datasets) {
    if (d.isAvg) continue;
    if (d.type === 'line') {
      const col = d.borderColor, ra = d.runAlpha || .35;
      d.segment = { borderDash: ctx => ctx.p1DataIndex === ri ? [4, 4] : undefined };
      d.pointBackgroundColor = d.data.map((_, j) => j === ri ? alpha(col, ra) : col);
    } else {
      const col = j => Array.isArray(d.backgroundColor) ? d.backgroundColor[j] : d.backgroundColor, ra = d.runAlpha || .35;
      const bg = d.data.map((_, j) => j === ri ? alpha(col(j), ra) : col(j));
      d.hoverBackgroundColor = d.data.map((_, j) => j === ri ? alpha(col(j), ra + .1) : d.runAlpha ? col(j) : alpha(col(j), .8));
      d.backgroundColor = bg;
    }
  }
}
/** Zeitreihe mit linearer X-Achse (Tag-Nummern) – kein Datums-Adapter nötig */
function timeLine(datasets, { tooltipFmt = v => nf(v, 1), yFmt = yAuto(), legend = false, yMin, yMax, thresholds, xMax } = {}) {
  // Nur ein Zeitpunkt: Achse um ±7 Tage aufspannen statt unlesbarer Ticks
  const xs = datasets.flatMap(d => (d.data || []).map(p => p && p.x)).filter(Number.isFinite);
  let xMin;
  if (xs.length && Math.min(...xs) === Math.max(...xs)) { xMin = xs[0] - 7; xMax = xMax ?? xs[0] + 7; }
  return {
    type: 'line',
    data: { datasets },
    plugins: thresholds ? [thresholdPlugin] : [],
    options: {
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { type: 'linear', bounds: 'data', grid: { display: false }, border: { display: false }, min: xMin, max: xMax, ticks: { maxTicksLimit: 5, maxRotation: 0, callback: dnTick }, afterBuildTicks: dropCrowdedTicks },
        y: { grid: { color: chartColors().grid }, border: { display: false }, min: yMin, max: yMax, ticks: { maxTicksLimit: 5, callback: yFmt } }
      },
      plugins: {
        legend: { display: legend, position: 'bottom' },
        thresholds: thresholds || {},
        tooltip: {
          callbacks: {
            title: items => items.length ? fmtDN(Math.round(items[0].parsed.x), { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }) : '',
            label: ctx => `${ctx.dataset.label}: ${ctx.raw && ctx.raw.label ? ctx.raw.label : tooltipFmt(ctx.parsed.y, ctx)}`
          }
        }
      }
    }
  };
}
function barChart(labels, datasets, { yFmt, tooltipFmt, horizontal = false, stacked = false, legend = false, thresholds, xMax, running = -1, runLabel = 'läuft noch' } = {}) {
  // Ohne eigenes Format sind es Zählwerte – dann nur ganze Zahlen als Achsen-Ticks (nicht „1, 1, 2, 2")
  const intTicks = !yFmt;
  yFmt = yFmt || (v => nf(v, 0));
  const valAxis = horizontal ? 'x' : 'y';
  const catAxis = horizontal ? 'y' : 'x';
  if (running >= 0) markRunning(datasets, running);
  return {
    type: 'bar',
    data: { labels, datasets },
    plugins: thresholds ? [thresholdPlugin] : [],
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      layout: { padding: { top: thresholds && thresholds.axis === 'x' ? 16 : 0 } },
      interaction: { mode: 'index', intersect: false },
      scales: {
        // liegende Balken: jede Zeile beschriften (sonst fehlt bei 16 Muskelgruppen jedes zweite Label)
        [catAxis]: { stacked, grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: !horizontal, maxTicksLimit: horizontal ? 40 : 8 } },
        [valAxis]: { stacked, beginAtZero: true, max: xMax, grid: { color: chartColors().grid }, border: { display: false }, ticks: { maxTicksLimit: 5, callback: yFmt, precision: intTicks ? 0 : undefined } }
      },
      plugins: {
        legend: { display: legend, position: 'bottom' },
        thresholds: thresholds || {},
        tooltip: { callbacks: {
          title: items => items.length ? `${items[0].label}${items[0].dataIndex === running ? ` · ${runLabel}` : ''}` : '',
          label: ctx => `${ctx.dataset.label}: ${tooltipFmt ? tooltipFmt(ctx.parsed[valAxis], ctx) : nf(ctx.parsed[valAxis], 1)}` } }
      }
    }
  };
}
const barDS = (label, data, color, opts = {}) => ({ label, data, backgroundColor: color, hoverBackgroundColor: Array.isArray(color) ? color.map(x => alpha(x, .8)) : alpha(color, .8), borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22, categoryPercentage: .8, barPercentage: .9, ...opts });
function donut(labels, data, colors, { tooltipFmt = v => nf(v, 0) } = {}) {
  const total = sum(data);
  return {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: chartColors().surface, borderWidth: 2, hoverOffset: 6 }] },
    options: {
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { padding: 10 } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${tooltipFmt(ctx.parsed)} (${nf(total ? ctx.parsed / total * 100 : 0, 0)} %)` } }
      }
    }
  };
}

/* Karten-Builder: HTML sammeln, Charts nach dem Einfügen mounten */
function chartBuilder() {
  const pending = [];
  return {
    card({ id, title, info, big, small, delta, sub, size = '', wide = false, factory, extra = '', top = '' }) {
      if (factory) pending.push([id, factory]);
      return `<div class="chart-card ${wide ? 'wide' : ''}">
        <div class="cc-head"><span class="cc-title">${esc(title)}</span>${info ? infoBtn(info) : ''}${factory ? `<button class="btn-icon" style="width:36px;height:36px" data-act="chartExpand" data-id="${id}" data-title="${esc(title)}" aria-label="Vollbild">${icon('expand')}</button>` : ''}</div>
        ${top}
        ${big != null ? `<div class="cc-big"><b>${big}</b>${small ? `<small>${small}</small>` : ''}${delta || ''}</div>` : ''}
        ${sub ? `<div class="cc-sub">${sub}</div>` : ''}
        ${factory ? `<div class="chart-box chart-wait ${size}"><canvas id="cv-${id}" role="img" aria-label="${esc(title)}"></canvas></div>` : ''}
        ${extra}
      </div>`;
    },
    mountAll() {
      if (!pending.length) return;
      Charts.ensure().then(() => pending.forEach(([id, f]) => Charts.mount(id, f)));
    }
  };
}
/* Vollbild + Tabellenansicht (jeder Chart hat eine Tabelle als Zwilling) */
Actions.chartExpand = el => {
  const src = Charts.get(el.dataset.id);
  if (!src || !src.factory) return;
  const cfg = src.factory();
  const m = Modal.open({
    title: el.dataset.title, size: 'full',
    body: `<div class="chart-box chart-wait" style="height:min(62vh,520px)"><canvas id="cv-${el.dataset.id}__full"></canvas></div>
      <h4 class="mt-24 mb-8">Daten als Tabelle</h4><div class="table-wrap">${chartTable(cfg)}</div>`
  });
  Charts.mount(el.dataset.id + '__full', src.factory);
  return m;
};
function chartTable(cfg) {
  if (!cfg) return '<p class="dim">Keine Daten</p>';
  const ds = cfg.data.datasets;
  const fmtV = v => v == null ? '–' : typeof v === 'object' ? nf(v.y, 1) : nf(v, 1);
  if (cfg.data.labels) {
    return `<table class="tbl"><thead><tr><th></th>${ds.map(d => `<th class="r">${esc(d.label || '')}</th>`).join('')}</tr></thead><tbody>${cfg.data.labels.map((l, i) => `<tr><td>${esc(Array.isArray(l) ? l.join(' ') : l)}</td>${ds.map(d => `<td class="r">${fmtV(d.data[i])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  const xs = uniq(ds.flatMap(d => d.data.map(p => p.x))).sort((a, b) => b - a);
  return `<table class="tbl"><thead><tr><th>Datum</th>${ds.map(d => `<th class="r">${esc(d.label || '')}</th>`).join('')}</tr></thead><tbody>${xs.slice(0, 400).map(x => `<tr><td>${fmtDN(Math.round(x))}</td>${ds.map(d => { const p = d.data.find(q => q.x === x); return `<td class="r">${p ? fmtV(p) : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
}

/* Mini-Visualisierungen ohne Chart.js (Sparkline, Mini-Bars, Ring) */
function sparkline(vals, color) {
  if (vals.length < 2) return '<svg class="spark"></svg>';
  const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 100).toFixed(2)},${(28 - (v - mn) / span * 24).toFixed(2)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
const heatColor = lv => lv <= 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--accent) ${[0, 28, 50, 75, 100][clamp(lv, 0, 4)]}%, var(--surface-2))`;

