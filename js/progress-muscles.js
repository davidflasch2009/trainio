/* Trainio – Fortschritt: Muskeln (Regionen, Körperkarte, Sätze pro Woche)
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

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
  const n = norm([ex.name, ...exAliases(ex)].join(' '));
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

/* Zusätzliche Teilregionen innerhalb der Atlas-Konturen (linke Körperhälfte). */
const BODY_SECTIONS = {
  front: {
    brust_m: { brust_o: 'M230 290H380V348Q310 334 248 371Z', brust_u: 'M240 412Q299 426 371 398V451H240Z' },
    delt_v: { delt_s: 'M180 294H242Q213 335 211 403H180Z' }
  },
  back: {
    trap_m: { trap_o: 'M980 275H1090V348Q1040 324 980 324Z', trap_u: 'M975 357Q1020 375 1090 400V487H975Z' },
    rotatoren: { rhomboiden: 'M1004 304H1050V416H1032Q1021 362 1004 343Z' }
  }
};
function bodySvg(view, valueOf, labelOf) {
  const v = BODY_MAP[view], front = view === 'front', axis = front ? 364 : 1084;
  const id = 'body-' + view;
  const defs = [];
  const neutral = d => `<path d="${d}" fill="var(--fig)"/>`;
  function muscle(k, d, clip = '') {
    const label = esc(REGIONS[k][0] + ': ' + labelOf(k));
    return `<path class="mus" data-act="muscleTap" data-m="${k}" d="${d}" fill="${valueOf(k).color}" ${clip} role="button" aria-label="${label}"><title>${label}</title></path>`;
  }
  const half = Object.entries(v.paired).map(([k, paths]) => paths.map(d => {
    if (k === 'neutral') return neutral(d);
    let result = muscle(k, d);
    for (const [part, mask] of Object.entries(BODY_SECTIONS[view][k] || {})) {
      defs.push(`<clipPath id="${id}-cut-${part}"><path d="${mask}"/></clipPath>`);
      result += muscle(part, d, `clip-path="url(#${id}-cut-${part})"`);
    }
    return result;
  }).join('')).join('');
  return `<svg viewBox="${axis - 340} 75 680 1340" role="img" aria-label="Muskel-Heatmap ${front ? 'vorne' : 'hinten'}">
    <defs>${defs.join('')}</defs>
    <path class="base" d="${v.outline}"/>${v.common.map(neutral).join('')}
    ${half}<g transform="translate(${2 * axis} 0) scale(-1 1)">${half}</g>
    <text x="${axis}" y="1400">${front ? 'Vorne' : 'Hinten'}</text></svg>`;
}

function heatmapWeek(today = todayDN()) {
  return { from: weekStartDN(today), to: today };
}
let heatmapWeekTimer;
function refreshHeatmapWeek() {
  if (App.tab === 'progress' && UI.progSub === 'muscles') App.renderCurrent();
}

/** Gewichtete Sätze pro Region in den Workouts eines Zeitraums */
function regionSets(rows) {
  const out = {};
  Object.keys(REGIONS).forEach(k => { out[k] = 0; });
  for (const w of rows) for (const [id, n] of Object.entries(w.exSetsW || {})) {
    const regs = exRegions(Ex.get(id));
    for (const [r, wt] of Object.entries(regs)) out[r] += n * wt;
  }
  return out;
}
/* Sätze pro Muskel und Woche (direkt 1, mitgeholfen ½) – Bereiche nach der Forschung, siehe
   docs/recherche/saetze-pro-woche.md: ab etwa 4 wächst ein Muskel messbar, mehr bringt mehr mit abnehmendem
   Ertrag, über etwa 20 kaum Zusatznutzen. Eine feste Obergrenze ist nicht belegt (deshalb keine Warnfarbe). */
const volBand = v => v < 4 ? 'wenig' : v < 10 ? 'wirksam' : v <= 20 ? 'viel' : 'sehr viel';
const volBandLines = c => [{ value: 4, label: 'wirksam', color: c.dim }, { value: 10, label: 'viel', color: c.dim }, { value: 20, label: 'sehr viel', color: c.dim }];
/* Farbskala: 0 = Muskel grau, unter 4 zarter Akzent, 4–10 bis voller Akzent, 10–20 leuchtend */
const regionColor = pw => {
  if (!(pw > 0)) return 'var(--mus-off)';
  if (pw < 10) return `color-mix(in srgb, var(--accent) ${Math.round(pw < 4 ? 20 + 30 * pw / 4 : 50 + 50 * (pw - 4) / 6)}%, var(--mus-off))`;
  return `color-mix(in srgb, var(--mus-hi) ${Math.round(clamp((pw - 10) / 10, 0, 1) * 65)}%, var(--accent))`;
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
  const lmColor = m => perWeek(m) < 4 ? c.faint : c.accent;
  const cats = k => sum(rows.map(w => w.cats[k] || 0));
  const push = cats('Push'), pull = cats('Pull'), legs = cats('Legs');
  const ppRatio = push ? pull / push : null;
  const luRatio = push + pull ? legs / (push + pull) : null;
  const weeks = Analytics.weeksOf(r), ri = runIdx(weeks);
  const weekly = f => weeks.map(w => f(rows.filter(x => x.dn >= w && x.dn < w + 7)));
  const wLabels = weeks.map(w => 'KW ' + isoWeek(w).week);
  // Muskeln über Zeit: Top 7 Muskelgruppen im Zeitraum, Rest = Andere
  const topM = MUSCLES.filter(m => setsM[m] > 0).sort((a, b) => setsM[b] - setsM[a]).slice(0, 7);
  const neglected = MUSCLES.filter(m => perWeek(m) < 4);
  const usage = {};
  for (const [id, ss] of Object.entries(ix.sessions)) usage[id] = ss.length;
  const suggest = m => Store.all('exercises').filter(e => (e.muscleGroups || [])[0] === m || (e.muscleGroups || []).includes(m)).sort((a, b) => ((b.muscleGroups || [])[0] === m) - ((a.muscleGroups || [])[0] === m) || (usage[b.id] || 0) - (usage[a.id] || 0)).slice(0, 2);
  const variety = MUSCLES.map(m => [m, new Set(rows.flatMap(w => w.ex.filter(id => isPrimary(id, m)))).size]);
  const donutData = MUSCLES.map(m => [m, setsM[m]]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const top7 = donutData.slice(0, 7), rest = sum(donutData.slice(7).map(x => x[1]));
  const rSets = regionSets(Analytics.rowsIn(heatmapWeek()));
  clearTimeout(heatmapWeekTimer);
  heatmapWeekTimer = setTimeout(refreshHeatmapWeek, parseISO(dnToISO(weekStartDN(todayDN()) + 7)).getTime() - Date.now() + 50);
  const rpw = k => rSets[k];
  const regList = Object.keys(REGIONS).sort((a, b) => rpw(b) - rpw(a));
  const ratioBadge = (v, lo, hi) => v == null ? '' : v < lo || v > hi ? `<span class="badge warn">${icon('warn')} Dysbalance</span>` : `<span class="badge accent">${icon('check')} ausgewogen</span>`;
  const cb = chartBuilder();
  body.innerHTML = `
    <div class="charts-grid">
      <div class="chart-card wide">
        <div class="cc-head"><span class="cc-title">Body-Heatmap · Diese Woche</span>${infoBtn('Gewichtete Arbeitssätze seit Wochenbeginn, unabhängig vom Zeitraum oben. Antippen zeigt die Übungen.')}</div>
        <div class="body-map mt-8">${bodySvg('front', k => ({ color: regionColor(rpw(k)) }), k => `${nf(rpw(k), 1)} Sätze/Woche`)}${bodySvg('back', k => ({ color: regionColor(rpw(k)) }), k => `${nf(rpw(k), 1)} Sätze/Woche`)}</div>
        <div class="row mt-8 tiny dim"><span>0</span><span class="heat-scale" style="background:linear-gradient(90deg, var(--mus-off), color-mix(in srgb, var(--accent) 50%, var(--mus-off)) 20%, var(--accent) 50%, color-mix(in srgb, var(--mus-hi) 65%, var(--accent)))"></span><span>20+ Sätze/Woche</span></div>
        <button type="button" class="reg-toggle${UI.regOpen ? ' open' : ''}" data-act="regToggle" aria-expanded="${!!UI.regOpen}" aria-controls="regList"><span>Alle Muskeln</span>${icon('chevD')}</button>
        <div class="reg-list mt-8" id="regList"${UI.regOpen ? '' : ' hidden'}>${regList.map(k => `<button class="reg-item" data-act="muscleTap" data-m="${k}"><span class="reg-dot" style="background:${regionColor(rpw(k))}"></span><span class="reg-name">${esc(REGIONS[k][0])}</span><b>${nf(rpw(k), 1)}</b><i style="--w:${Math.min(100, rpw(k) / 20 * 100)}%"></i></button>`).join('')}</div>
      </div>
      ${cb.card({ id: 'm2', wide: true, title: 'Sätze pro Muskelgruppe / Woche', size: 'lg', info: 'Sätze pro Woche je Muskel, blass heißt mitgeholfen (zählt halb). Ab 4 wächst ein Muskel messbar, über 20 kaum noch mehr.',
        factory: () => {
          const cfg = barChart(MUSCLES, [
            barDS('Direkt', MUSCLES.map(m => round(pwD(m), 1)), MUSCLES.map(lmColor), { borderRadius: 0 }),
            barDS('Mitgeholfen', MUSCLES.map(m => round(pwH(m), 1)), MUSCLES.map(m => alpha(lmColor(m), .3)))
          ], {
            horizontal: true, stacked: true, legend: true, tooltipFmt: v => `${nf(v, 1)} Sätze`,
            thresholds: { axis: 'x', lines: volBandLines(c) }, xMax: Math.max(24, Math.ceil(Math.max(...MUSCLES.map(m => pwD(m) + pwH(m))) + 2))
          });
          cfg.options.plugins.tooltip.callbacks.footer = items => items.length ? `zählt als ${nf(perWeek(MUSCLES[items[0].dataIndex]), 1)} (${volBand(perWeek(MUSCLES[items[0].dataIndex]))})` : '';
          return cfg;
        } })}
      ${cb.card({ id: 'm3', title: 'Muskelgruppen-Verteilung', info: 'Anteil der Sätze je Muskelgruppe, gezählt beim Hauptmuskel der Übung.', size: '',
        factory: () => {
          if (!top7.length) return null;
          const all = [...top7, ...(rest ? [['Andere', rest]] : [])], tot = sum(all.map(x => x[1]));
          return barChart(all.map(x => x[0]), [barDS('Anteil', all.map(x => round(x[1] / tot * 100, 1)), all.map(x => x[0] === 'Andere' ? c.faint : c.accent))],
            { horizontal: true, yFmt: v => v + ' %', tooltipFmt: (v, ctx) => `${nf(v, 0)} % · ${all[ctx.dataIndex][1]} Sätze` });
        } })}
      ${cb.card({ id: 'm4', title: 'Push vs. Pull', info: 'Pull-Sätze geteilt durch Push-Sätze. Ausgewogen zwischen 0,8 und 1,2.',
        big: ppRatio != null ? nf(ppRatio, 2) : '–', small: `${pull} Pull / ${push} Push`, top: `<div class="mt-8">${ratioBadge(ppRatio, 0.8, 1.2)}</div>`,
        factory: () => { const d = weekly(rs => { const p = sum(rs.map(w => w.cats.Push || 0)), q = sum(rs.map(w => w.cats.Pull || 0)); return p ? round(q / p, 2) : null; }); const mx = Math.max(1.5, ...d.filter((v, i) => v != null && i !== ri)); return d.some(v => v != null) ? barChart(wLabels, [{ type: 'line', label: 'Pull/Push', data: d, borderColor: c.accent, backgroundColor: c.accent, pointRadius: 3, spanGaps: true, tension: .3 }], { running: ri, xMax: Math.ceil(mx * 1.15 * 2) / 2, yFmt: v => nf(v, 1), tooltipFmt: v => nf(v, 2), thresholds: { axis: 'y', lines: [{ value: 0.8, label: '0,8', color: c.faint }, { value: 1.2, label: '1,2', color: c.faint }] } }) : null; } })}
      ${cb.card({ id: 'm5', title: 'Beine vs. Oberkörper', info: 'Bein-Sätze geteilt durch Oberkörper-Sätze. Ausgewogen zwischen 0,4 und 0,8.',
        big: luRatio != null ? nf(luRatio, 2) : '–', small: `${legs} Beine / ${push + pull} Oberkörper`, top: `<div class="mt-8">${ratioBadge(luRatio, 0.4, 0.8)}</div>`,
        factory: () => { const d = weekly(rs => { const u = sum(rs.map(w => (w.cats.Push || 0) + (w.cats.Pull || 0))), l = sum(rs.map(w => w.cats.Legs || 0)); return u ? round(l / u, 2) : null; }); const mx = Math.max(1, ...d.filter((v, i) => v != null && i !== ri)); return d.some(v => v != null) ? barChart(wLabels, [{ type: 'line', label: 'Beine/Oberkörper', data: d, borderColor: c.accent, backgroundColor: c.accent, pointRadius: 3, spanGaps: true, tension: .3 }], { running: ri, xMax: Math.ceil(mx * 1.15 * 2) / 2, yFmt: v => nf(v, 1), tooltipFmt: v => nf(v, 2), thresholds: { axis: 'y', lines: [{ value: 0.4, label: '0,4', color: c.faint }, { value: 0.8, label: '0,8', color: c.faint }] } }) : null; } })}
      <div class="chart-card">
        <div class="cc-head"><span class="cc-title">Vernachlässigte Muskelgruppen</span>${infoBtn('Muskelgruppen mit weniger als 4 Sätzen pro Woche, darunter wächst ein Muskel kaum. Mit passenden Übungen.')}</div>
        ${neglected.length ? neglected.map(m => `<div class="ratio-row small"><span class="ampel-dot" style="background:var(--danger)"></span><span class="grow"><b style="font-size:14px">${esc(m)}</b> <span class="dim">${nf(perWeek(m), 1)}/W${helpM[m] ? ` (${nf(pwD(m), 1)} direkt)` : ''}</span><br><span class="dim">${suggest(m).map(e => `<button class="link-btn" style="min-height:28px;padding:0 6px 0 0;font-size:12.5px" data-act="openExercise" data-id="${esc(e.id)}">${esc(e.name)}</button>`).join('')}</span></span></div>`).join('') : '<p class="dim small mt-8">Jede Muskelgruppe bekommt mindestens 4 Sätze pro Woche.</p>'}
      </div>
      ${cb.card({ id: 'm7', title: 'Muskel-Fortschritt', info: 'Sätze pro Woche für die gewählte Muskelgruppe, blass heißt mitgeholfen.',
        top: `<select class="select mt-8" data-ch="muscleSel" style="min-height:38px;padding-top:4px;padding-bottom:4px" aria-label="Muskelgruppe">${MUSCLES.map(m => `<option ${m === UI.muscleSel ? 'selected' : ''}>${m}</option>`).join('')}</select>`,
        factory: () => { const ms = UI.muscleSel, d = weekly(rs => sum(rs.map(w => w.mP[ms] || 0))), h = weekly(rs => sum(rs.map(w => w.mS[ms] || 0))); return sum(d) + sum(h) ? barChart(wLabels, [
          { type: 'line', label: 'Direkt', data: d, borderColor: c.accent, backgroundColor: alpha(c.accent, .16), fill: 'origin', pointRadius: 3, tension: .3 },
          { type: 'line', label: 'Mitgeholfen', data: h, borderColor: alpha(c.accent, .4), backgroundColor: alpha(c.accent, .07), fill: '-1', pointRadius: 0, borderWidth: 1.5, tension: .3, runAlpha: .2 }
        ], { stacked: true, legend: sum(h) > 0, running: ri, tooltipFmt: v => `${v} Sätze`, thresholds: { axis: 'y', lines: volBandLines(c) } }) : null; } })}
      ${cb.card({ id: 'm9', wide: true, title: 'Muskeln über Zeit', info: 'Sätze pro Woche der 7 meist-trainierten Muskelgruppen, gezählt beim Hauptmuskel.', size: 'lg',
        factory: () => topM.length ? barChart(wLabels, [
          ...topM.map((m, i) => barDS(m, weekly(rs => sum(rs.map(w => w.mP[m] || 0))), c.series[i], { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 1 } })),
          ...(MUSCLES.length > topM.length ? [barDS('Andere', weekly(rs => sum(rs.map(w => sum(MUSCLES.filter(m => !topM.includes(m)).map(m => w.mP[m] || 0))))), c.faint, { borderRadius: 0, borderColor: c.surface, borderWidth: { top: 1 } })] : [])
        ], { stacked: true, legend: true, running: ri, tooltipFmt: v => `${nf(v, 0)} Sätze` }) : null })}
      ${cb.card({ id: 'm8', title: 'Übungs-Vielfalt', info: 'Wie viele verschiedene Übungen du je Muskelgruppe gemacht hast.', size: 'lg',
        big: new Set(rows.flatMap(w => w.ex)).size, small: 'verschiedene Übungen gesamt',
        factory: () => variety.some(x => x[1]) ? barChart(variety.map(x => x[0]), [barDS('Übungen', variety.map(x => x[1]), c.series[0])], { horizontal: true, tooltipFmt: v => `${v} Übungen` }) : null })}
    </div>`;
  cb.mountAll();
};
Changes.muscleSel = el => { UI.muscleSel = el.value; saveUI(); App.renderCurrent(); };
/* Muskel-Liste unter der Heatmap: ein-/ausklappen, Zustand bleibt gemerkt */
Actions.regToggle = el => {
  UI.regOpen = !UI.regOpen; saveUI();
  const list = $('#regList'); if (!list) return;
  list.hidden = !UI.regOpen;
  el.classList.toggle('open', UI.regOpen);
  el.setAttribute('aria-expanded', String(UI.regOpen));
  if (UI.regOpen) fx(list, 'fx-up');
};
Actions.muscleTap = el => {
  const k = el.dataset.m;
  const reg = REGIONS[k]; if (!reg) return;
  const rows = Analytics.rowsIn(heatmapWeek());
  const exCount = {};
  for (const w of rows) for (const [id, n] of Object.entries(w.exSetsW || {})) { const wt = exRegions(Ex.get(id))[k]; if (wt) exCount[id] = (exCount[id] || 0) + n * wt; }
  const sets = sum(Object.values(exCount));
  $$('.body-map .mus').forEach(p => p.classList.toggle('sel', p.dataset.m === k));
  const lib = Store.all('exercises').filter(e => exRegions(e)[k] === 1 && !exCount[e.id]).slice(0, 8);
  Modal.open({
    title: reg[0], size: 'sm',
    body: `<p class="small dim">Gehört zur Gruppe <b>${esc(reg[1])}</b></p>
      <div class="pr-grid mt-12" style="grid-template-columns:1fr">
        <div class="pr-box"><span>Sätze diese Woche</span><b>${nf(sets, 1)}</b></div>
      </div>
      <h4 class="mt-16 mb-8">Übungen diese Woche</h4>
      ${Object.keys(exCount).length ? `<div class="list">${Object.entries(exCount).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<button class="list-item" data-act="openExercise" data-id="${esc(id)}"><span class="li-main"><span class="li-title">${esc(Ex.name(id))}</span><div class="li-sub">${exRegions(Ex.get(id))[k] === 1 ? 'Hauptmuskel' : 'Hilfsmuskel'}</div></span><span class="dim small">${nf(n, 1)} Sätze</span>${icon('chevR', 'li-chev')}</button>`).join('')}</div>` : '<p class="dim small">Keine im Zeitraum.</p>'}
      ${lib.length ? `<h4 class="mt-16 mb-8">Übungen für diesen Muskel</h4><div class="chips wrap">${lib.map(e => `<button class="chip" data-act="openExercise" data-id="${esc(e.id)}">${esc(e.name)}</button>`).join('')}</div>` : ''}`,
    onClose: () => $$('.body-map .mus.sel').forEach(p => p.classList.remove('sel'))
  });
};
