/* Trainio – Fortschritt: Körper (Gewicht, Wochenziel, CSV-Import, Körpermaße, Fotos)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

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
      ${cb.card({ id: 'b1', wide: true, title: 'Körpergewicht', info: 'Alle Gewichts-Einträge. Die Linie ist der Ø der letzten 7 Tage, sie glättet Wasser-Schwankungen.',
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
      ${cb.card({ id: 'b5', wide: true, title: 'Veränderung pro Woche', info: rateNow || rules.some(Boolean) ? 'Wochendurchschnitt gegen die Vorwoche. Grün: im Bereich deines Wochenziels (blasses Band), orange: außerhalb.' : 'Wochendurchschnitt gegen die Vorwoche. Blau: abgenommen, orange: zugenommen.',
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
      ${cb.card({ id: 'b3', title: 'Fettfreie Masse', info: 'Dein Gewicht ohne Körperfett. Steigt sie über Wochen, spricht das für Muskelaufbau.', big: lean.length ? fmtW(fromU(lean[lean.length - 1].y)) : '–',
        factory: () => lean.length ? timeLine([lineDS('Fettfreie Masse', lean, c.accent)], { tooltipFmt: v => fmtW(fromU(v)) }) : null })}` : ''}
      ${F('f_measures') ? `${cb.card({ id: 'b4', wide: true, title: 'Umfänge', info: 'Veränderung jedes Umfangs seit Beginn des Zeitraums. Antippen in der Legende blendet Linien aus oder ein.', size: 'lg',
        sub: 'Veränderung in cm seit Zeitraumbeginn',
        factory: () => mSeries.length ? timeLine(mSeries.map(s => lineDS(s.l, s.data.map(p => ({ x: p.x, y: round(p.y - s.data[0].y, 1), label: `${nf(p.y, 1)} cm (${p.y - s.data[0].y >= 0 ? '+' : '−'}${nf(Math.abs(p.y - s.data[0].y), 1)})` })), s.color, { fill: false, pointRadius: s.data.length <= 30 ? 3 : 0 })),
          { legend: true, tooltipFmt: v => nf(v, 1) + ' cm', yFmt: v => (v > 0 ? '+' : '') + nf(v, 1), thresholds: { axis: 'y', lines: [{ value: 0, label: '', color: c.faint }] } }) : null })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Verhältnisse</span>${infoBtn('Verhältnisse deiner Umfänge. Taille/Hüfte gilt als gesund unter 0,9 (Männer) bzw. 0,85 (Frauen).')}</div>
        <div class="ratio-row"><span class="grow">Schulter / Taille</span><b>${adonis ? nf(adonis, 2) : '–'}</b><span class="tiny dim"></span></div>
        <div class="ratio-row"><span class="grow">Taille / Hüfte</span><b>${whr ? nf(whr, 2) : '–'}</b><span class="tiny dim">${whr ? (whr < (S().sex === 'f' ? .85 : .9) ? '✓ gesund' : '⚠ erhöht') : ''}</span></div>
        <div class="ratio-row"><span class="grow">Arm / Oberschenkel</span><b>${armThigh ? nf(armThigh, 2) : '–'}</b><span class="tiny dim"></span></div>
      </div>` : ''}
      ${F('f_photos') ? `<div class="chart-card">
        <div class="cc-head"><span class="cc-title">Fotos</span>${infoBtn('Fortschrittsfotos chronologisch. Tippe auf ein Foto für den Vorher/Nachher-Vergleich.')}</div>
        ${photos.length ? `<div class="photo-strip mt-8">${photos.map(p => `<button data-act="photoCompare" data-id="${esc(p.id)}"><img src="${p.data}" alt="Foto vom ${esc(fmtDate(p.date))}" loading="lazy">${esc(fmtDate(p.date))}</button>`).join('')}</div>` : '<p class="dim small mt-8">Noch keine Fotos – füge beim nächsten Eintrag eins hinzu.</p>'}
      </div>` : ''}
    </div>
    <div class="section-head"><h2>Verlauf</h2></div>
    <div id="bodyHistory">${bodyHistoryHtml()}</div>`;
  cb.mountAll();
};
let bodyHistoryMonths = 1;
function bodyHistoryHtml() {
  const rows = Store.all('progress').filter(p => isISO(p.date)).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  if (!rows.length) return `<div class="card">${emptyState('scale', 'Noch keine Einträge', 'Trag oben dein Gewicht ein – der Verlauf entsteht automatisch.')}</div>`;
  const { groups, previous } = historyMonthPage(rows, bodyHistoryMonths);
  return groups.map(g => `<section class="history-month"><div class="history-month-content">
    <div class="section-head"><h4>${fmtDate(g.k + '-01', { month: 'long', year: 'numeric' })}</h4><span class="tiny dim">${g.items.length === 1 ? '1 Eintrag' : g.items.length + ' Einträge'}</span></div>
    <div class="list" data-body-history-month="${g.k}">${g.items.length ? g.items.map(p => `<button class="list-item" data-act="bodyEdit" data-id="${esc(p.id)}">
      <span class="li-icon">${icon(p.photoId && F('f_photos') ? 'camera' : 'scale')}</span>
      <span class="li-main"><span class="li-title">${esc(fmtDate(p.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))}</span>
      <div class="li-sub">${[p.bodyWeightKg ? fmtW(p.bodyWeightKg) : '', F('f_bodyFat') && p.bodyFatPct ? nf(p.bodyFatPct, 1) + ' % KFA' : '', F('f_measures') && p.measurements ? MEASURES.filter(([k]) => p.measurements[k]).length + ' Umfänge' : '', p.notes ? esc(p.notes) : ''].filter(Boolean).join(' · ') || '–'}</div></span>
      ${icon('chevR', 'li-chev')}</button>`).join('') : '<p class="small dim">Keine Einträge in diesem Monat.</p>'}</div>
    </div></section>`).join('') + historyMoreButton(previous, 'bodyHistMore');
}
Actions.bodyHistMore = () => {
  bodyHistoryMonths++;
  revealHistoryMonth($('#bodyHistory'), bodyHistoryHtml());
};
/* Körpergewicht: plausible Spanne in kg – gilt für jede Einheit gleich (erst umrechnen, dann prüfen) */
const BW_MIN_KG = 20, BW_MAX_KG = 400;
const bwValidKg = kg => kg != null && kg >= BW_MIN_KG - 0.005 && kg <= BW_MAX_KG + 0.005;
const bwRangeTxt = () => `zwischen ${nf(toU(BW_MIN_KG), 0)} und ${nf(toU(BW_MAX_KG), 0)} ${unit()}`;
Actions.bwQuickSave = () => {
  const inp = $('#bwQuick');
  const v = parseNum(inp && inp.value);
  const kg = v ? round(fromU(v), 2) : null, today = isoDate();
  if (!v) { toast('Bitte ein Gewicht eintragen', 'warn'); if (inp) inp.focus(); return; }
  if (!bwValidKg(kg)) { toast(`Bitte ein Gewicht ${bwRangeTxt()} eintragen`, 'warn'); if (inp) inp.focus(); return; }
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
    info: 'Erlaubte Veränderung deines Wochendurchschnitts zur Vorwoche. Im Diagramm „Veränderung pro Woche“ sind Wochen in diesem Bereich grün, darüber oder darunter orange.',
    body: `<div class="stack">
      ${cur && cur.phase ? `<div class="card small">Gerade gilt die Phase <b>${esc(cur.phase.name)}</b> (${esc(rateText(cur.lo, cur.hi))}). Diese Einstellung gilt für Wochen ohne Phase mit Bereich.
        <button class="link-btn mt-4" style="padding:0;min-height:30px" data-x="phase">Phase bearbeiten</button></div>` : ''}
      <div class="seg" id="rtType">${RATE_GOALS.map(([k, l]) => `<button data-t="${k}" class="${type === k ? 'active' : ''}">${l}</button>`).join('')}<button data-t="" class="${!type ? 'active' : ''}">Kein Ziel</button></div>
      <div id="rtBox" ${type ? '' : 'hidden'}>${rateFields(g.min, g.max, [rateToInput(sug[0]), rateToInput(sug[1])])}</div>
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
    info: 'CSV-Export aus deiner Waagen- oder Gewichts-App (z. B. Better Weight, Withings, Libra) – Datum und Gewicht werden automatisch erkannt, auch mit deutschem Komma.',
    body: `<label class="btn btn-secondary btn-block">${icon('upload')} CSV-Datei wählen<input type="file" id="bwiFile" accept=".csv,.txt,text/csv,text/plain" hidden></label>
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
      m.close();
      withUndo(`Eintrag vom ${fmtDate(entry.date, { day: 'numeric', month: 'numeric' })}${entry.photoId ? ' mit Foto' : ''} gelöscht`, {
        docs: [['progress', entry.id], ...(entry.photoId ? [['photos', entry.photoId]] : [])],
        run: () => { Store.del('progress', entry.id); if (entry.photoId) Store.del('photos', entry.photoId); } });
      return;
    }
    const date = $('#bfDate', m.el).value;
    if (!isISO(date)) return toast('Bitte ein gültiges Datum wählen', 'warn');
    if (date > isoDate()) return toast('Das Datum darf nicht in der Zukunft liegen', 'warn');
    const w = parseNum($('#bfW', m.el).value), bfv = parseNum($('#bfBf', m.el).value);
    const meas = {};
    let any = false, badMeas = false;
    // Umfänge: leer = keine Messung; nur Werte über 0 (und unter 300 cm) zählen als Messung
    $$('[data-mk]', m.el).forEach(i => {
      const v = i.value.trim() ? parseNum(i.value) : null;
      if (v == null) { meas[i.dataset.mk] = null; if (i.value.trim()) badMeas = true; return; }
      if (v <= 0 || v > 300) { badMeas = true; meas[i.dataset.mk] = null; return; }
      meas[i.dataset.mk] = v; any = true;
    });
    if (badMeas) return toast('Bitte Umfänge zwischen 1 und 300 cm eintragen', 'warn');
    if (w != null && !bwValidKg(round(fromU(w), 2))) return toast(`Bitte ein Gewicht ${bwRangeTxt()} eintragen`, 'warn');
    if (bfv != null && (bfv < 0 || bfv > 70)) return toast('Bitte einen Körperfettanteil zwischen 0 und 70 % eintragen', 'warn');
    if (w == null && bfv == null && !any && !photoData && !existingPhoto && !$('#bfNotes', m.el).value.trim()) return toast('Bitte mindestens einen Wert eintragen', 'warn');
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
      <p class="center dim small mt-8">${(n => `${n} ${n === 1 ? 'Tag' : 'Tage'} Unterschied`)(Math.abs(Math.round(dayNum(after.date) - dayNum(before.date))))}</p>`);
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
