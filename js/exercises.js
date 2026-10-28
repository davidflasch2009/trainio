/* Trainio – Übungs-Auswahl, Tools, Übungs-Bibliothek
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   10. Übungs-Picker (Single/Multi)
   ========================================================================== */
function pickExercises({ multi = true, title = 'Übung wählen', cat: cat0 = 'all' } = {}) {
  return new Promise(resolve => {
    const picked = [];
    let q = '', cat = cat0;
    let result = null;
    const m = Modal.open({
      title, size: 'full',
      body: `<div class="search"><input class="input" id="pkQ" placeholder="Übung suchen …" autocomplete="off">${icon('search')}</div>
        <div class="chips mt-12" id="pkCats"></div>
        <div class="col mt-12" id="pkList" style="gap:8px"></div>`,
      foot: multi ? `<button class="btn btn-secondary" data-x="new">${icon('plus')} Neue Übung</button><button class="btn btn-primary" data-x="ok" id="pkOk" disabled>Hinzufügen</button>` : `<button class="btn btn-secondary" data-x="new">${icon('plus')} Neue Übung</button>`,
      onClose: () => resolve(result)
    });
    const usage = {};
    for (const r of Analytics.cur().rows) for (const id of [...r.ex, ...Object.keys(r.cBy || {})]) usage[id] = (usage[id] || 0) + 1;
    const renderList = () => {
      $('#pkCats', m.el).innerHTML = ['all', ...REGION_NAMES].map(c => `<button class="chip ${cat === c ? 'active' : ''}" data-c="${c}">${c === 'all' ? 'Alle' : c}</button>`).join('');
      const nq = norm(q);
      let list = Ex.sorted().filter(e => (cat === 'all' || exRegion(e) === cat) && (!nq || exMatches(e, q)));
      if (!nq && (cat === 'all' || cat === 'Cardio')) list = list.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.name.localeCompare(b.name, 'de'));
      $('#pkList', m.el).innerHTML = list.length ? list.map(e => `<button class="ex-item ${picked.includes(e.id) ? 'picked' : ''}" data-pick="${esc(e.id)}">
          ${regionDot(e)}
          <span class="grow" style="min-width:0"><div class="bold ellipsis">${esc(e.name)}</div><div class="ex-meta ellipsis">${esc((e.muscleGroups || []).join(', '))} · ${esc(e.equipment)}</div></span>
          ${picked.includes(e.id) ? `<span class="badge accent">${picked.indexOf(e.id) + 1}</span>` : (usage[e.id] ? `<span class="tiny dim">${usage[e.id]}×</span>` : '')}
        </button>`).join('') : emptyState('search', 'Nichts gefunden', 'Lege die Übung einfach neu an.');
      const ok = $('#pkOk', m.el);
      if (ok) { ok.disabled = !picked.length; ok.textContent = picked.length ? `Hinzufügen (${picked.length})` : 'Hinzufügen'; }
    };
    renderList();
    $('#pkQ', m.el).addEventListener('input', debounce(e => { q = e.target.value; renderList(); }, 150));
    m.el.addEventListener('click', async e => {
      const c = e.target.closest('[data-c]');
      if (c) { cat = c.dataset.c; renderList(); return; }
      const p = e.target.closest('[data-pick]');
      if (p) {
        const id = p.dataset.pick;
        if (!multi) { result = [id]; m.close(); return; }
        const i = picked.indexOf(id);
        if (i >= 0) picked.splice(i, 1); else picked.push(id);
        renderList();
        return;
      }
      const x = e.target.closest('[data-x]');
      if (!x) return;
      if (x.dataset.x === 'ok') { result = picked.slice(); m.close(); }
      if (x.dataset.x === 'new') {
        const id = await openExerciseForm(null, { name: q });
        if (id) { if (!multi) { result = [id]; m.close(); return; } picked.push(id); renderList(); }
      }
    });
  });
}

/* ==========================================================================
   11. Tools: Scheibenrechner & 1RM-Rechner
   ========================================================================== */
const PLATE_COLORS = { 50: '#2b2f36', 2: '#5a6170', 1: '#b9bec7', 0.25: '#d9d9d9', 55: '#e5484d', 25: '#e5484d', 20: '#3987e5', 15: '#eda100', 10: '#1baf7a', 5: '#e8e8e8', 2.5: '#3a3f4a', 1.25: '#9aa3af', 0.5: '#c3c2b7', 45: '#3987e5', 35: '#eda100' };
function platesFor(totalU, barU, plates) {
  let per = (totalU - barU) / 2;
  const out = [];
  if (per < 0) return { out, rest: per * 2 };
  for (const p of plates) { while (per >= p - 1e-9) { out.push(p); per = round(per - p, 4); } }
  return { out, rest: round(per * 2, 3) };
}
/* ---------- Scheibenrechner im Workout: Gewicht des aktuellen Satzes ---------- */
const PLATE_SRC = { last: 'wie letztes Mal', goal: 'Ziel', prev: 'wie Satz davor' };
/** Satz für den Scheibenrechner: erster offener Satz der Übung (ohne Übung: der ausgewählten bzw. ersten offenen Gewichts-Übung) */
function plateTarget(w, ei = null) {
  const isKg = i => i >= 0 && !!w.entries[i] && Ex.type(Ex.get(w.entries[i].exerciseId)) === 'kg';
  const hasOpen = i => w.entries[i].sets.some(s => !s.done);
  if (ei == null) {
    ei = w.sel && isKg(w.sel.e) && hasOpen(w.sel.e) ? w.sel.e : w.entries.findIndex((_, i) => isKg(i) && hasOpen(i));
    if (ei < 0) return null;
  }
  if (!isKg(ei) || !w.entries[ei].sets.length) return null;
  const sets = w.entries[ei].sets, si = sets.findIndex(s => !s.done);
  return { ei, si: si < 0 ? sets.length - 1 : si };
}
/** Gewicht eines Satzes wie im Eingabefeld: eingetragen → letztes Mal (Platzhalter) → Ziel → Satz davor */
function plateWeightOf(w, ei, si) {
  const en = w.entries[ei], s = en.sets[si];
  if (s.weightKg != null) return { kg: s.weightKg, src: 'set' };
  const prev = S().woPrev !== false ? prevForSet(en, si, lastSessionFor(en.exerciseId, w)) : null;
  if (prev && prev.w) return { kg: prev.w, src: 'last' };
  const g = s.warmup ? null : goalWeight(en);
  if (g) return { kg: g, src: 'goal' };
  for (let i = si - 1; i >= 0; i--) if (en.sets[i].weightKg != null && !!en.sets[i].warmup === !!s.warmup) return { kg: en.sets[i].weightKg, src: 'prev' };
  return { kg: null, src: null };
}
function plateSetLabel(en, si) {
  const s = en.sets[si];
  if (s.warmup) return 'Aufwärmsatz';
  const no = en.sets.slice(0, si + 1).filter(x => !x.warmup).length;
  return `Satz ${no}${s.kind === 'drop' ? ' · Drop' : ''}`;
}

/** Scheibenrechner – mit ctx { ei, si } für einen Satz im laufenden Workout (◀ ▶ wechselt den Satz, Gewicht übernehmen) */
function openPlates(kg, ctx = null) {
  const step = S().weightSteps || 2.5;
  const def = unit() === 'lb' ? 135 : 60;
  let total = kg ? round(toU(kg), 2) : def;
  let bar = round(toU(S().barKg), 1);
  let src = null, srcU = null;   // woher das Gewicht des Satzes stammt (Platzhalter, Ziel …) und welcher Wert
  const ctxSet = () => { const w = Workout.cur(), en = ctx && w && w.entries[ctx.ei]; return en && en.sets[ctx.si] ? { w, en, s: en.sets[ctx.si] } : null; };
  const loadSet = () => { const c = ctxSet(); if (!c) return; const p = plateWeightOf(c.w, ctx.ei, ctx.si); src = p.src; if (p.kg != null) total = srcU = round(toU(p.kg), 2); };
  if (ctx) loadSet();
  const m = Modal.open({ title: 'Scheibenrechner', size: 'sm', body: '' });
  const ctxHtml = () => {
    const c = ctxSet();
    if (!c) return '';
    const n = c.en.sets.length, label = plateSetLabel(c.en, ctx.si);
    return `<div class="pl-ctx">
        <button class="btn-icon" data-pn="-1" ${ctx.si <= 0 ? 'disabled' : ''} aria-label="Satz davor">${icon('chevL')}</button>
        <div class="grow center" style="min-width:0"><div class="bold ellipsis">${esc(c.en.exerciseName)}</div>
          <div class="tiny dim">${esc(label)} von ${n}${c.s.done ? ' · erledigt' : ''}${PLATE_SRC[src] && Math.abs(total - srcU) < 1e-6 ? ` · ${PLATE_SRC[src]}` : ''}</div></div>
        <button class="btn-icon" data-pn="1" ${ctx.si >= n - 1 ? 'disabled' : ''} aria-label="Nächster Satz">${icon('chevR')}</button>
      </div>`;
  };
  const applyHtml = () => {
    const c = ctxSet();
    if (!c) return '';
    const label = esc(plateSetLabel(c.en, ctx.si).replace(' · Drop', ''));
    if (c.s.weightKg != null && Math.abs(toU(c.s.weightKg) - total) < 1e-6) return `<p class="center tiny dim mt-12">${icon('check').replace('<svg', '<svg width="14" height="14"')} ${label}: ${nf(total, 2)} ${unit()} eingetragen</p>`;
    return `<button class="btn btn-primary btn-block mt-12" data-plapply>${icon('check')} ${nf(total, 2)} ${unit()} für ${label} übernehmen</button>`;
  };
  const draw = () => {
    const plates = availPlates();
    const { out, rest } = platesFor(total, bar, plates);
    const maxP = Math.max(...plates, 1);
    const counts = {};
    out.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    const exact = round(total - rest, 2);
    m.setBody(`${ctxHtml()}
      <div class="pl-target">
        <button class="btn-icon pl-step" data-pd="-1" aria-label="Weniger">${icon('minus')}</button>
        <div class="grow center"><input class="pl-input" id="plT" inputmode="decimal" value="${String(total).replace('.', ',')}" aria-label="Zielgewicht"><div class="tiny dim">${unit()} gesamt</div></div>
        <button class="btn-icon pl-step" data-pd="1" aria-label="Mehr">${icon('plus')}</button>
      </div>
      <div class="plates-vis" aria-hidden="true">
        <span class="bar-end"></span><span class="sleeve"></span>
        ${out.map(p => `<span class="plate" style="height:${46 + p / maxP * 84}px;width:${p >= 10 ? 18 : 13}px;background:${PLATE_COLORS[p] || '#8a8f98'}"><em>${nf(p, 2)}</em></span>`).join('')}
        <span class="sleeve" style="width:26px;height:12px;opacity:.6"></span>
      </div>
      <div class="center">
        ${total < bar ? '<p class="warn-text">Ziel ist leichter als die Stange.</p>' : out.length
          ? `<p class="dim small">Pro Seite</p><div class="pl-counts">${Object.entries(counts).sort((a, b) => b[0] - a[0]).map(([p, n]) => `<span class="pl-chip" style="--pc:${PLATE_COLORS[p] || '#8a8f98'}"><i></i><b>${n}×</b> ${nf(+p, 2)}</span>`).join('')}</div>`
          : '<p class="dim">Nur die Stange</p>'}
        ${rest > 0.001 ? `<p class="warn-text small mt-8">Nicht exakt möglich – nächstes machbares Gewicht: <b>${nf(exact, 2)} ${unit()}</b></p>` : ''}
      </div>
      ${applyHtml()}
      <h4 class="mt-16 mb-8">Stange</h4>
      <div class="chips wrap">${uniq([...(unit() === 'lb' ? [45, 35, 25] : [20, 15, 10]), bar]).filter(v => v > 0).sort((a, b) => b - a).map(v => `<button class="chip sm ${bar === v ? 'active' : ''}" data-plb="${v}">${nf(v, 1)} ${unit()}</button>`).join('')}<button class="chip sm ${bar === 0 ? 'active' : ''}" data-plb="0">Ohne</button></div>
      <button class="btn btn-ghost btn-sm mt-12" data-act="openPlatesCfg">${icon('sliders')} Verfügbare Scheiben: ${plates.map(x => nf(x, 2)).join(' · ')}</button>`);
  };
  draw();
  m.el.addEventListener('change', e => { if (e.target.id === 'plT') { total = Math.max(0, parseNum(e.target.value) || 0); draw(); } });
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-pd],[data-plb],[data-pn],[data-plapply]'); if (!t || t.disabled) return;
    if (t.dataset.pd) total = Math.max(0, round(total + +t.dataset.pd * step * 2, 2));
    else if (t.dataset.pn) {
      const c = ctxSet(); if (!c) return;
      ctx.si = clamp(ctx.si + +t.dataset.pn, 0, c.en.sets.length - 1);
      loadSet();
    } else if (t.hasAttribute('data-plapply')) {
      const c = ctxSet(); if (!c) return;
      c.s.weightKg = round(fromU(total), 3);
      src = null;
      Workout.save();
      App.renderCurrent();
    }
    else bar = +t.dataset.plb;
    vibrate(6);
    draw();
  });
  // Nach Änderung der verfügbaren Scheiben neu zeichnen
  const unsub = Store.subscribe('meta', () => { if (!m.closed) draw(); else unsub(); });
}
Actions.openWarmupCfg = () => {
  let steps = JSON.parse(JSON.stringify(S().warmupSteps || []));
  let bar = S().warmupBar !== false;
  const PRESETS = [['Kurz', [[50, 8], [75, 3]]], ['Standard', [[40, 5], [60, 3], [80, 2]]], ['Kraft', [[40, 5], [55, 3], [70, 2], [85, 1], [92, 1]]]];
  const m = Modal.open({ title: 'Aufwärmsätze', info: 'Prozent vom Arbeitsgewicht und Wiederholungen je Aufwärmsatz. Gerundet auf dein Gewichts-Inkrement.', size: 'sm', foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">${icon('check')} Speichern</button>` });
  const ex = 100;
  const draw = () => {
    steps.sort((a, b) => a[0] - b[0]);
    m.setBody(`<div class="chips">${PRESETS.map(([n, st]) => `<button class="chip" data-pre="${n}">${n}</button>`).join('')}</div>
      <div class="list mt-12">${steps.map(([pc, r], i) => `<div class="set-line wu-row">
          <div class="sl-main"><div class="sl-title">Satz ${i + 1}</div><div class="sl-sub">bei 100 kg → ${nf(Math.round(ex * pc / 100 / 2.5) * 2.5, 1)} kg × ${r}</div></div>
          <div class="pe-step wu-step"><button data-wp="${i}" data-d="-5" aria-label="Weniger Prozent">${icon('minus')}</button><span>${pc} %</span><button data-wp="${i}" data-d="5" aria-label="Mehr Prozent">${icon('plus')}</button></div>
          <div class="pe-step wu-step"><button data-wr="${i}" data-d="-1" aria-label="Weniger Wdh.">${icon('minus')}</button><span>${r}×</span><button data-wr="${i}" data-d="1" aria-label="Mehr Wdh.">${icon('plus')}</button></div>
          <button class="btn-icon" data-wdel="${i}" aria-label="Entfernen">${icon('x')}</button>
        </div>`).join('') || '<div class="list-item dim small">Keine Aufwärmsätze</div>'}</div>
      <button class="btn btn-secondary btn-block mt-8" data-wadd ${steps.length >= 6 ? 'disabled' : ''}>${icon('plus')} Satz hinzufügen</button>
      <div class="list mt-12">${setLine('Zuerst leere Stange', `Bei Langhantel: ${wNum(S().barKg)} ${unit()} × 10`, `<label class="switch"><input type="checkbox" switch id="wuBar" ${bar ? 'checked' : ''}><span></span></label>`)}</div>`);
  };
  draw();
  m.el.addEventListener('change', e => { if (e.target.id === 'wuBar') bar = e.target.checked; });
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-pre],[data-wp],[data-wr],[data-wdel],[data-wadd],[data-x]'); if (!t || t.disabled) return;
    if (t.dataset.pre) steps = JSON.parse(JSON.stringify(PRESETS.find(x => x[0] === t.dataset.pre)[1]));
    else if (t.dataset.wp) { const st = steps[+t.dataset.wp]; st[0] = clamp(st[0] + +t.dataset.d, 5, 95); }
    else if (t.dataset.wr) { const st = steps[+t.dataset.wr]; st[1] = clamp(st[1] + +t.dataset.d, 1, 20); }
    else if (t.dataset.wdel) steps.splice(+t.dataset.wdel, 1);
    else if (t.hasAttribute('data-wadd')) { const last = steps[steps.length - 1]; steps.push([last ? Math.min(95, last[0] + 10) : 50, last ? Math.max(1, last[1] - 1) : 5]); }
    else if (t.dataset.x === 'cancel') return m.close();
    else if (t.dataset.x === 'ok') { Store.saveSettings({ warmupSteps: steps, warmupBar: bar }); toast('Aufwärmsätze gespeichert', 'success'); return m.close(); }
    draw();
  });
};

/* Scheiben & Stange: welche Scheiben es in deinem Gym gibt */
const ALL_PLATES = { kg: [50, 25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5, 0.25], lb: [55, 45, 35, 25, 10, 5, 2.5, 1.25] };
const availPlates = () => (unit() === 'lb' ? S().platesLb : S().platesKg).slice().sort((a, b) => b - a);
Actions.openPlatesCfg = () => {
  const lb = unit() === 'lb';
  let sel = new Set(availPlates());
  let bar = round(toU(S().barKg), 1);
  const m = Modal.open({ title: 'Scheiben & Stange', info: 'Tippe an, welche Scheiben es in deinem Gym gibt – der Scheibenrechner rechnet nur mit diesen.', size: 'sm', foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">${icon('check')} Speichern</button>` });
  const draw = () => m.setBody(`<h4 class="mb-8">Verfügbare Scheiben (${unit()})</h4>
      <div class="plate-pick">${ALL_PLATES[lb ? 'lb' : 'kg'].map(v => `<button class="pp ${sel.has(v) ? 'on' : ''}" data-pv="${v}" style="--pc:${PLATE_COLORS[v] || '#8a8f98'}"><i></i>${nf(v, 2)}</button>`).join('')}</div>
      <h4 class="mt-24 mb-8">Standard-Stange</h4>
      <div class="chips wrap">${(lb ? [45, 35, 25, 15] : [20, 15, 10, 7]).map(v => `<button class="chip ${bar === v ? 'active' : ''}" data-bar="${v}">${v} ${unit()}</button>`).join('')}<button class="chip ${bar === 0 ? 'active' : ''}" data-bar="0">Ohne</button></div>
      <label class="field mt-12"><span>Eigenes Stangengewicht</span><input class="input num-input" id="pcBar" inputmode="decimal" value="${String(bar).replace('.', ',')}"></label>`);
  draw();
  m.el.addEventListener('change', e => { if (e.target.id === 'pcBar') { const v = parseNum(e.target.value); if (v != null && v >= 0) bar = v; draw(); } });
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-pv],[data-bar],[data-x]'); if (!t) return;
    if (t.dataset.pv) { const v = +t.dataset.pv; sel.has(v) ? sel.delete(v) : sel.add(v); }
    else if (t.dataset.bar != null) bar = +t.dataset.bar;
    else if (t.dataset.x === 'cancel') return m.close();
    else if (t.dataset.x === 'ok') {
      if (!sel.size) return toast('Mindestens eine Scheibe auswählen', 'warn');
      Store.saveSettings({ [lb ? 'platesLb' : 'platesKg']: [...sel].sort((a, b) => b - a), barKg: round(fromU(bar), 3) });
      toast('Gespeichert', 'success'); return m.close();
    }
    draw();
  });
};
Actions.plates = el => openPlates(null, el.dataset.ei != null && Workout.cur() ? { ei: +el.dataset.ei, si: +el.dataset.si } : null);
function open1RM() {
  const m = Modal.open({ title: '1RM-Rechner', size: 'sm', body: '' });
  let w = 80, r = 5;
  const draw = () => {
    const one = e1rm(w, r) || w;
    const rows = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map(p => {
      const load = one * p / 100;
      const reps = p === 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1)));
      return `<tr><td>${p} %</td><td class="r bold">${nf(load, 1)} ${unit()}</td><td class="r dim">≈ ${reps} Wdh.</td></tr>`;
    }).join('');
    m.setBody(`<div class="form-grid">
        <label class="field"><span>Gewicht (${unit()})</span><input class="input num-input" id="rmW" inputmode="decimal" value="${String(w).replace('.', ',')}"></label>
        <label class="field"><span>Wiederholungen</span><input class="input num-input" id="rmR" inputmode="numeric" value="${r}"></label>
      </div>
      <div class="center mt-16"><p class="dim small">Geschätztes 1RM (Epley)</p><div style="font-size:42px;font-weight:800">${nf(one, 1)} <small class="dim" style="font-size:18px">${unit()}</small></div></div>
      <table class="tbl mt-12"><tbody>${rows}</tbody></table>`);
    $('#rmW', m.el).addEventListener('change', e => { w = parseNum(e.target.value) || 0; draw(); });
    $('#rmR', m.el).addEventListener('change', e => { r = Math.max(1, Math.round(parseNum(e.target.value) || 1)); draw(); });
  };
  draw();
}


/* ==========================================================================
   12. View: Übungen (Bibliothek, Detail, Formular)
   ========================================================================== */
Views.exercises = {
  render(el) {
    el.innerHTML = `
      <div class="search"><input class="input" id="exQ" data-in="exQ" type="search" placeholder="Suchen: Name, Muskel, Equipment …" value="${esc(UI.exQ)}" autocomplete="off" enterkeyhint="search">${icon('search')}</div>
      <div class="chips mt-12" aria-label="Muskelgruppe">${['all', ...REGION_NAMES].map(c => `<button class="chip ${exCatNow() === c ? 'active' : ''}" data-act="exCat" data-v="${c}">${c === 'all' ? 'Alle' : c}</button>`).join('')}</div>
      <div class="chips mt-8" aria-label="Equipment">${['all', ...EQUIPMENT, 'Eigene'].map(c => `<button class="chip soft ${UI.exEq === c ? 'active' : ''}" data-act="exEq" data-v="${c}">${c === 'all' ? 'Jedes Equipment' : c}</button>`).join('')}</div>
      <div class="row between mt-12">
        <span class="small dim" id="exCount"></span>
        <select class="select" data-ch="exSort" style="width:auto;min-height:38px;padding-top:4px;padding-bottom:4px;font-size:14px" aria-label="Sortierung">
          ${[['az', 'A–Z'], ['recent', 'Zuletzt trainiert'], ['freq', 'Am häufigsten'], ['strong', 'Stärkstes e1RM']].map(([k, l]) => `<option value="${k}" ${UI.exSort === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="ex-list mt-8" id="exList"></div>`;
    renderExList();
  }
};
function renderExList() {
  const list = $('#exList');
  if (!list) return;
  const ix = Analytics.cur();
  const nq = norm(UI.exQ);
  let items = Store.all('exercises').filter(e =>
    (exCatNow() === 'all' || exRegion(e) === exCatNow()) &&
    (UI.exEq === 'all' || (UI.exEq === 'Eigene' ? e.isCustom : e.equipment === UI.exEq)) &&
    (!nq || exMatches(e, UI.exQ, [e.equipment, e.category, exRegion(e)])));
  const info = id => {
    const ss = ix.sessions[id] || [];
    return { n: ss.length, last: ss.length ? ss[ss.length - 1].dn : null, best: ss.length ? maxOf(ss, s => s.best) : 0 };
  };
  const meta = {};
  items.forEach(e => { meta[e.id] = info(e.id); });
  const by = {
    az: (a, b) => a.name.localeCompare(b.name, 'de'),
    recent: (a, b) => (meta[b.id].last || 0) - (meta[a.id].last || 0) || a.name.localeCompare(b.name, 'de'),
    freq: (a, b) => meta[b.id].n - meta[a.id].n || a.name.localeCompare(b.name, 'de'),
    strong: (a, b) => meta[b.id].best - meta[a.id].best || a.name.localeCompare(b.name, 'de')
  };
  items.sort(by[UI.exSort] || by.az);
  $('#exCount').textContent = `${items.length} Übung${items.length === 1 ? '' : 'en'}`;
  list.innerHTML = items.length ? items.map(e => {
    const mi = meta[e.id];
    const pr = Store.raw('prs', e.id);
    const t = Ex.type(e);
    const right = mi.n ? `<b>${t === 'cardio' ? (pr && pr.bestKmh ? fmtKmh(pr.bestKmh) : pr && pr.bestDurSec ? fmtDur(pr.bestDurSec) : mi.n + '×') : t === 'kg' && pr && pr.best1RM ? fmtW(pr.best1RM, 0) : t !== 'kg' && pr ? (pr.bestReps || '–') + (t === 'sec' ? '' : ' Wdh.') : mi.n + '×'}</b>${relDays(mi.last)}` : '<span class="faint">noch nie</span>';
    return `<button class="ex-item" data-act="openExercise" data-id="${esc(e.id)}">
      ${regionDot(e)}
      <span class="grow" style="min-width:0">
        <div class="bold ellipsis">${esc(e.name)} ${e.isCustom ? '<span class="badge" style="vertical-align:1px">Eigene</span>' : ''}</div>
        <div class="ex-meta ellipsis">${esc((e.muscleGroups || []).join(', ') || '–')} · ${esc(e.equipment)}</div>
      </span>
      <span class="ex-right">${right}</span>
    </button>`;
  }).join('') : `<div class="card" style="grid-column:1/-1">${emptyState('search', 'Keine Übung gefunden', 'Filter anpassen oder eine eigene Übung anlegen.', `<button class="btn btn-primary" data-act="exNew">${icon('plus')} Neue Übung</button>`)}</div>`;
}
Inputs.exQ = debounce(el => { UI.exQ = el.value; renderExList(); }, 200);
// Filter nach Muskel-Region; ältere gespeicherte Werte (Push/Pull/Legs …) zählen als „Alle“
const exCatNow = () => REGION_NAMES.includes(UI.exCat) ? UI.exCat : 'all';
Actions.exCat = el => { UI.exCat = el.dataset.v; saveUI(); App.renderCurrent(); };
Actions.exEq = el => { UI.exEq = el.dataset.v; saveUI(); App.renderCurrent(); };
Changes.exSort = el => { UI.exSort = el.value; saveUI(); renderExList(); };
Actions.exNew = () => openExerciseForm(null, { name: UI.exQ });
Actions.openExercise = el => openExerciseDetail(el.dataset.id);

/* ---------- Übungs-Detail ---------- */
function openExerciseDetail(id) {
  const ex = Ex.get(id);
  if (!ex) return toast('Übung nicht gefunden', 'error');
  const ss = Analytics.sessionsOf(id);
  const pr = Store.raw('prs', id);
  const t = Ex.type(ex);
  const prEv = Analytics.cur().prEvents.filter(p => p.exId === id);
  const live = Workout.cur();
  let showAll = false;
  const m = Modal.open({ title: ex.name, size: 'lg' });
  const draw = () => {
    const sessions = ss.slice().reverse();
    const shown = showAll ? sessions : sessions.slice(0, 8);
    m.setBody(`
      <div class="row wrap">
        <span class="badge ${catCls(ex.category)}">${esc(ex.category)}</span>
        <span class="badge">${esc(ex.equipment)}</span>
        ${t === 'cardio' && ex.category === 'Cardio' ? '' : `<span class="badge">${esc(UNIT_TYPES[t])}</span>`}
        ${ex.isCustom ? '<span class="badge info">Eigene Übung</span>' : ''}
      </div>
      <div class="muscle-pick mt-12">${(ex.muscleGroups || []).map(mg => `<span class="chip soft active" style="min-height:30px">${esc(mg)}</span>`).join('') || '<span class="dim small">Keine Muskelgruppen hinterlegt</span>'}</div>
      <button class="card tight mt-12 pin-card" data-act="pinNoteEdit" data-id="${esc(ex.id)}">${pinNote(ex.id) ? `${icon('note').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px;flex-shrink:0"')} <span class="bold">Meine Notiz:</span> ${esc(pinNote(ex.id))}` : `<span class="dim">📌 Eigene Notiz hinzufügen (z. B. Sitzhöhe, Griff) – erscheint in jedem Workout</span>`}</button>
      ${ex.notes ? `<div class="card tight mt-12" style="background:var(--surface-2)"><span class="bold">Technik-Tipp:</span> ${esc(ex.notes)}</div>` : ''}
      ${ss.length && t === 'cardio' ? cardioDetailHtml(id, ss, showAll) : ss.length ? `
        <div class="pr-grid mt-16">
          ${t === 'kg' ? `
            <div class="pr-box"><span>Bestes 1RM (e)</span><b>${pr ? fmtW(pr.best1RM) : '–'}</b>${pr && pr.fixDate ? '<em>seit Form-Fix</em>' : ''}</div>
            <div class="pr-box"><span>Max-Gewicht</span><b>${pr ? fmtW(pr.bestWeightKg) : '–'}</b><em>${pr && pr.bestReps ? '× ' + pr.bestReps + ' Wdh.' : ''}</em></div>
            <div class="pr-box"><span>Bestes Volumen</span><b>${pr ? fmtTon(pr.bestVolume) : '–'}</b><em>pro Session</em></div>`
          : `<div class="pr-box"><span>${t === 'sec' ? 'Längster Satz' : 'Max Wdh.'}</span><b>${t === 'sec' ? fmtClock(maxOf(ss, s => maxOf(s.list, x => x.sec))) : (pr ? pr.bestReps : '–')}</b></div>
             <div class="pr-box"><span>Zusatzgewicht max</span><b>${pr && pr.bestWeightKg ? fmtW(pr.bestWeightKg) : '–'}</b></div>
             <div class="pr-box"><span>Sätze gesamt</span><b>${sum(ss.map(s => s.sets))}</b></div>`}
          <div class="pr-box"><span>Sessions</span><b>${ss.length}</b><em>zuletzt ${relDays(ss[ss.length - 1].dn)}</em></div>
        </div>
        <div class="chart-card mt-16" style="padding:12px">
          <div class="seg sm">${(t === 'kg' ? [['e1rm', '1RM-Verlauf'], ['vol', 'Volumen'], ['maxw', 'Max-Gewicht']] : [['reps', t === 'sec' ? 'Dauer' : 'Wiederholungen'], ['sets', 'Sätze']]).map(([k, l]) => `<button data-x="chart" data-v="${k}" class="${exChartKey(t) === k ? 'active' : ''}">${l}</button>`).join('')}</div>
          <div class="chart-box"><canvas id="cv-exd" role="img" aria-label="Verlauf ${esc(ex.name)}"></canvas></div>
        </div>
        ${pr && pr.fixDate ? `<div class="card tight mt-12 fix-card">${icon('refresh')}<span><b>Form-Fix am ${fmtDate(pr.fixDate)}</b> – PRs und Vergleiche zählen ab da neu.${pr.beforeFix && pr.beforeFix.best1RM ? ` Vorher: 1RM ${fmtW(pr.beforeFix.best1RM)}${pr.beforeFix.bestWeightKg ? ` · max. ${fmtW(pr.beforeFix.bestWeightKg)}${pr.beforeFix.bestReps ? ' × ' + pr.beforeFix.bestReps : ''}` : ''}.` : ''}</span></div>` : ''}
        ${prEv.length ? `<div class="mt-12 small dim">${icon('trophy').replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} ${prEv.length} PR${prEv.length === 1 ? '' : 's'} – zuletzt am ${fmtDate(prEv[prEv.length - 1].date)} (${fmtW(prEv[prEv.length - 1].w)} × ${prEv[prEv.length - 1].r})</div>` : ''}
        <h4 class="mt-24 mb-8">Alle Sätze</h4>
        ${shown.map(s => `<div class="card tight mb-8" style="background:var(--surface-2)">
            <div class="row between"><button class="link-btn" style="padding:0;min-height:30px" data-x="wo" data-id="${esc(s.wid)}">${esc(fmtDate(s.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }))}</button>${s.fix ? `<span class="badge warn" title="${esc(s.fixNote || '')}">Form-Fix</span><span class="grow"></span>` : ''}
            <span class="tiny dim">${t === 'kg' ? `e1RM ${fmtW(s.best)} · ${fmtTon(s.vol)}` : `${s.sets} Sätze`}</span></div>
            <div class="small num">${s.list.map(x => t === 'sec' ? prevSec(x) + (x.w ? ` +${wNum(x.w)}` : '') : (x.w ? `${wNum(x.w)} × ${prevR(x)}` : `${prevR(x)} Wdh.`) + (x.rpe ? ` <span class="faint">@${nf(x.rpe, 1)}</span>` : '') + (x.fix ? ' <span class="fix-line tiny bold">Form-Fix</span>' : '')).join(' &nbsp;·&nbsp; ')}</div>
          </div>`).join('')}
        ${sessions.length > 8 && !showAll ? `<button class="btn btn-secondary btn-block" data-x="all">Alle ${sessions.length} Sessions anzeigen</button>` : ''}
      ` : `<div class="mt-16">${emptyState('chart', 'Noch keine Daten', 'Sobald du diese Übung trainierst, siehst du hier Verlauf, PRs und alle Sätze.')}</div>`}
    `);
    if (ss.length) Charts.ensure().then(() => Charts.mount('exd', () => exerciseChart(id, exChartKey(t, id))));
  };
  m.setFoot(`${live ? `<button class="btn btn-primary" data-x="add">${icon('plus')} Zum Workout</button>` : ''}
    <button class="btn btn-secondary" data-x="edit">${icon('edit')} Bearbeiten</button>
    <button class="btn btn-danger-ghost" data-x="del" style="flex:0 0 auto" aria-label="Löschen">${icon('trash')}</button>`);
  draw();
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    const x = b.dataset.x;
    if (x === 'chart') { UI.exChart = b.dataset.v; saveUI(); draw(); }
    else if (x === 'all') { showAll = true; draw(); }
    else if (x === 'wo') openWorkoutDetail(b.dataset.id);
    else if (x === 'edit') { const nid = await openExerciseForm(ex); if (nid) { m.dismiss(); openExerciseDetail(nid); } }
    else if (x === 'add') {
      const w = Workout.cur();
      if (!w) return;
      w.entries.push(Workout.makeEntry(id, { sets: defSets() }));
      Workout.autoSelect(); Workout.save();
      m.dismiss();
      App.go('training');
      toast(`${ex.name} hinzugefügt`, 'success', { cat: 'workout' });
    } else if (x === 'del') {
      const usedPlans = Store.all('templates').filter(t => (t.exercises || []).some(y => y.exerciseId === id));
      const ok = await confirmDialog({
        title: 'Übung löschen?',
        text: `„${ex.name}" wird aus der Bibliothek entfernt.${ss.length ? ` Sie kommt in ${ss.length} Workouts vor – der Verlauf bleibt mit Namen erhalten.` : ''}${usedPlans.length ? ` Sie wird aus ${usedPlans.length} deiner Workouts entfernt.` : ''}`,
        okLabel: 'Löschen', danger: true
      });
      if (!ok) return;
      usedPlans.forEach(t => Store.put('templates', t.id, { ...t, exercises: t.exercises.filter(y => y.exerciseId !== id), updatedAt: Date.now() }, { replace: true }));
      Store.del('exercises', id);
      m.dismiss();
      toast('Übung gelöscht', 'success');
    }
  });
}
function cardioDetailHtml(id, ss, showAll) {
  const info = cardioInfo(Ex.get(id)), t = 'cardio';
  const sessions = ss.slice().reverse(), shown = showAll ? sessions : sessions.slice(0, 8);
  const best = (f, ok = () => true) => ss.filter(ok).reduce((b, x) => f(x) > (b ? f(b) : 0) ? x : b, null);
  const bD = best(x => x.secs), bK = best(x => x.km), bS = best(x => x.kmh, x => cardioKmhValid(x.km, x.secs));
  const keys = [['cdur', 'Dauer'], ...(info.mode === 'dist' ? [['ckm', 'Distanz'], ['ckmh', 'Tempo']] : []), ...(info.lvl ? [['clvl', info.lvl]] : [])];
  return `
    <div class="pr-grid mt-16">
      <div class="pr-box"><span>Längste Einheit</span><b>${bD ? fmtDur(bD.secs) : '–'}</b><em>${bD ? fmtDateShort(bD.date) : ''}</em></div>
      ${info.mode === 'dist' ? `<div class="pr-box"><span>Weiteste Distanz</span><b>${bK && bK.km ? fmtKm(bK.km) : '–'}</b><em>${bK && bK.km ? fmtDateShort(bK.date) : ''}</em></div>
      <div class="pr-box"><span>Schnellstes Tempo</span><b>${bS ? fmtKmh(bS.kmh) : '–'}</b><em>${bS ? fmtDateShort(bS.date) : ''}</em></div>` : `<div class="pr-box"><span>Gesamtzeit</span><b>${fmtDur(sum(ss.map(x => x.secs)))}</b></div>`}
      <div class="pr-box"><span>Einheiten</span><b>${ss.length}</b><em>zuletzt ${relDays(ss[ss.length - 1].dn)}</em></div>
    </div>
    <div class="chart-card mt-16" style="padding:12px">
      ${keys.length > 1 ? `<div class="seg sm">${keys.map(([k, l]) => `<button data-x="chart" data-v="${k}" class="${exChartKey(t, id) === k ? 'active' : ''}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="chart-box"><canvas id="cv-exd" role="img" aria-label="Verlauf"></canvas></div>
    </div>
    <h4 class="mt-24 mb-8">Alle Einheiten</h4>
    ${shown.map(s => `<div class="card tight mb-8" style="background:var(--surface-2)">
        <div class="row between"><button class="link-btn" style="padding:0;min-height:30px" data-x="wo" data-id="${esc(s.wid)}">${esc(fmtDate(s.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }))}</button>
        <span class="tiny dim">${s.list.length > 1 ? s.list.length + ' Abschnitte' : ''}</span></div>
        <div class="small num">${esc(cardioTxt({ sec: s.secs, km: s.km, lvl: s.lvl || null }, info))}</div>
      </div>`).join('')}
    ${sessions.length > 8 && !showAll ? `<button class="btn btn-secondary btn-block" data-x="all">Alle ${sessions.length} Einheiten anzeigen</button>` : ''}`;
}
function exChartKey(t, id) {
  const k = UI.exChart;
  if (t === 'cardio') { const info = cardioInfo(Ex.get(id)); const ok = ['cdur', ...(info.mode === 'dist' ? ['ckm', 'ckmh'] : []), ...(info.lvl ? ['clvl'] : [])]; return ok.includes(k) ? k : 'cdur'; }
  if (t === 'kg') return ['e1rm', 'vol', 'maxw'].includes(k) ? k : 'e1rm';
  return ['reps', 'sets'].includes(k) ? k : 'reps';
}
/** 1RM-, Volumen- und Max-Gewicht-Verlauf einer Übung (§8.3) */
function exerciseChart(id, key) {
  const ss = Analytics.sessionsOf(id);
  if (ss.length < 1) return null;
  const t = Ex.type(Ex.get(id));
  const map = {
    e1rm: ['Geschätztes 1RM', s => toU(s.best), v => fmtW(fromU(v))],
    vol: ['Volumen', s => toU(s.vol), v => fmtTon(fromU(v))],
    maxw: ['Max-Gewicht', s => toU(s.maxW), v => fmtW(fromU(v))],
    reps: [t === 'sec' ? 'Längster Satz (s)' : 'Max Wdh.', s => t === 'sec' ? maxOf(s.list, x => x.sec) : maxOf(s.list, x => x.r), v => t === 'sec' ? fmtClock(v) : nf(v, 0)],
    sets: ['Sätze', s => s.sets, v => nf(v, 0)],
    cdur: ['Dauer (min)', s => round(s.secs / 60, 1), v => nf(v, 0) + ' min'],
    ckm: ['Distanz (km)', s => round(s.km, 2), v => fmtKm(v)],
    ckmh: ['Tempo (km/h)', s => cardioKmhValid(s.km, s.secs) ? round(s.kmh, 2) : 0, v => fmtKmh(v)],
    clvl: [(cardioInfo(Ex.get(id)).lvl || 'Stufe') + ' (max)', s => s.lvl || 0, v => nf(v, 1)]
  };
  const [label, f, fmt] = map[key] || map.e1rm;
  const data = ss.map(s => ({ x: s.dn, y: f(s) })).filter(p => p.y > 0);
  if (!data.length) return null;
  return timeLine([lineDS(label, data, chartColors().accent)], { tooltipFmt: v => fmt(v), thresholds: fixLines(ss) });
}

/* ---------- Übung anlegen / bearbeiten ---------- */
function openExerciseForm(ex, preset = {}) {
  return new Promise(resolve => {
    const d = ex ? JSON.parse(JSON.stringify(ex)) : { name: preset.name || '', category: 'Push', muscleGroups: [], equipment: 'Langhantel', defaultUnit: 'kg', notes: '', aliases: [] };
    let result = null;
    const m = Modal.open({
      title: ex ? 'Übung bearbeiten' : 'Neue Übung', size: 'lg',
      foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">Speichern</button>`,
      onClose: () => resolve(result)
    });
    const draw = () => m.setBody(`
      <div class="stack">
        <label class="field"><span>Name *</span><input class="input" data-f="name" value="${esc(d.name)}" placeholder="z. B. Schrägbank-Butterfly" autocomplete="off"></label>
        <div class="form-grid">
          <label class="field"><span>Kategorie</span><select class="select" data-f="category">${CATEGORIES.map(c => `<option ${d.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field"><span>Equipment</span><select class="select" data-f="equipment">${uniq([...EQUIPMENT, d.equipment]).map(c => `<option ${d.equipment === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        </div>
        <div class="field"><span>Erfassung</span>
          <div class="seg">${Object.entries({ kg: 'Gewicht × Wdh.', reps: 'Nur Wdh.', sec: 'Zeit', cardio: 'Cardio' }).map(([k, l]) => `<button data-u="${k}" class="${Ex.type(d) === k ? 'active' : ''}">${l}</button>`).join('')}</div></div>
        ${Ex.type(d) === 'cardio' ? `<div class="field"><span>Cardio-Felder</span>
          <div class="seg">${Object.entries({ dist: 'Dauer + Distanz', level: 'Dauer + Stufe', time: 'Nur Dauer' }).map(([k, l]) => `<button data-cm="${k}" class="${cardioInfo(d).mode === k ? 'active' : ''}">${l}</button>`).join('')}</div></div>` : ''}
        <div class="list"><div class="set-line"><div class="sl-main"><div class="sl-title">Einseitig (links & rechts)</div><div class="sl-sub">Wdh. für jede Seite getrennt erfassen – z. B. Bulgarian Split Squat, einarmiges Rudern</div></div>
          <label class="switch"><input type="checkbox" switch data-uni ${Ex.isUni(d) ? 'checked' : ''} aria-label="Einseitig"><span></span></label></div></div>
        <div class="field"><span>Muskelgruppen</span>
          <div class="muscle-pick">${[...MUSCLES, 'Ausdauer'].map(mg => `<button class="chip soft ${d.muscleGroups.includes(mg) ? 'active' : ''}" data-m="${esc(mg)}">${esc(mg)}</button>`).join('')}</div></div>
        <label class="field"><span>Technik-Notiz</span><textarea class="textarea" data-f="notes" placeholder="1 Satz Technik-Tipp">${esc(d.notes || '')}</textarea></label>
        <label class="field"><span>Alternative Namen (Komma-getrennt)</span><input class="input" data-f="aliases" value="${esc((d.aliases || []).join(', '))}" placeholder="z. B. englischer Name aus Arrow"></label>
      </div>`);
    draw();
    m.body.addEventListener('input', e => {
      const f = e.target.dataset.f;
      if (!f) return;
      if (f === 'aliases') d.aliases = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
      else d[f] = e.target.value;
    });
    m.body.addEventListener('change', e => { if (e.target.matches('[data-uni]')) { d.unilateral = e.target.checked; return; } const f = e.target.dataset.f; if (f) d[f] = e.target.value; });
    m.el.addEventListener('click', e => {
      const u = e.target.closest('[data-u]');
      if (u) { d.defaultUnit = u.dataset.u; if (u.dataset.u === 'cardio') d.category = 'Cardio'; else if (d.category === 'Cardio' && Ex.type(d) === 'cardio') d.category = 'Full Body'; draw(); return; }
      const cm = e.target.closest('[data-cm]');
      if (cm) { d.cardioMode = cm.dataset.cm; draw(); return; }
      const mg = e.target.closest('[data-m]');
      if (mg) {
        const v = mg.dataset.m;
        d.muscleGroups = d.muscleGroups.includes(v) ? d.muscleGroups.filter(x => x !== v) : [...d.muscleGroups, v];
        mg.classList.toggle('active');
        return;
      }
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'cancel') return m.close();
      const name = d.name.trim();
      if (!name) return toast('Bitte einen Namen eingeben', 'warn');
      const dup = Store.all('exercises').find(x => x.id !== (ex && ex.id) && norm(x.name) === norm(name));
      if (dup) return toast(`„${dup.name}" gibt es schon`, 'warn');
      const id = ex ? ex.id : autoId();
      Store.put('exercises', id, {
        name, category: d.category, muscleGroups: d.muscleGroups, equipment: d.equipment, defaultUnit: d.defaultUnit || 'kg', ...(d.cardioMode ? { cardioMode: d.cardioMode } : {}), ...(d.myNote ? { myNote: d.myNote } : {}),
        notes: (d.notes || '').trim(), aliases: d.aliases || [], isCustom: ex ? !!ex.isCustom : true, unilateral: Ex.isUni(d),
        createdAt: ex ? ex.createdAt || Date.now() : Date.now(), updatedAt: Date.now()
      }, { replace: true });
      result = id;
      toast(ex ? 'Übung gespeichert' : `„${name}" angelegt`, 'success');
      m.close();
    });
  });
}


