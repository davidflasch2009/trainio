/* Trainio – Trainio-Score
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen.
   Zeigt die Entwicklung (werde ich stärker, baue ich Muskeln auf?) als Zahl 0–100. Eingaben: nur Workouts und
   Körpergewicht. Regeln: docs/redesign/ANFORDERUNGEN.md, Abschnitt 6 – kurz:
   - Kraft (50): je Übung bestes geschätztes 1RM pro Woche, Median der letzten 4 Wochen gegen die 4 davor,
     als % pro Monat gegen das erwartete Tempo r (Trainingserfahrung: < 1 Jahr 3 %, 1–3 Jahre 1 %, darüber 0,5 %).
   - Trainingsreiz (30): Arbeitssätze je Muskelgruppe und Woche (Hauptmuskel 1, Hilfsmuskel 0,5, RPE ≤ 5 halb),
     abflachende Kurve, je Körperbereich gemittelt.
   - Gewichtstrend (20): % Körpergewicht pro Woche gegen die Spanne der Phase.
   Fehlt ein Teil, wird mit den übrigen auf 100 hochgerechnet. Das erwartete Tempo ergibt etwa 85. */
'use strict';

const TScore = (() => {
  // Sieben Körperbereiche [Name, Muskelgruppen, Plural für „hängt/hängen hinterher“]
  const REGIONS = [
    ['Brust', ['Brust'], false],
    ['Rücken', ['Rücken', 'Trapez'], false],
    ['Schultern', ['Schulter', 'Hintere Schulter'], true],
    ['Arme', ['Bizeps', 'Trizeps', 'Unterarme'], true],
    ['Beine vorne', ['Quadrizeps', 'Adduktoren'], true],
    ['Gesäß & Beine hinten', ['Gesäß', 'Beinbeuger', 'Abduktoren', 'Waden'], true],
    ['Rumpf', ['Bauch', 'Unterer Rücken'], false]
  ];
  const regionOf = m => REGIONS.findIndex(r => r[1].includes(m));
  const W = { kraft: 50, reiz: 30, gewicht: 20 };
  // Trainingsreiz-Kurve (Bulk, voll ab 18 Sätzen); Cut und Erhalt: gleiche Form, gestaucht
  const CURVE = [[0, 0], [4, .35], [10, .65], [15, .85], [18, 1]];
  const FULL = { bulk: 18, cut: 8, maintain: 10, other: 10, none: 10 };
  const lerp = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
    return pts[pts.length - 1][1];
  };
  const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const clamp100 = v => Math.max(0, Math.min(100, v));

  /** Phase, die am Tag dn läuft (zuletzt gestartete zuerst) */
  const phaseAt = dn => (S().phases || []).filter(p => isISO(p.from) && dayNum(p.from) <= dn && (!p.to || dayNum(p.to) >= dn))
    .sort((a, b) => b.from.localeCompare(a.from))[0] || null;
  /** Erwartetes Kraft-Tempo in % pro Monat nach Trainingserfahrung („Trainiere seit“, sonst erstes Workout) */
  function expectedRate(dn) {
    const ts = S().trainingSince, rows = Analytics.cur().rows;
    const since = /^\d{4}-\d{2}$/.test(ts || '') ? dayNum(ts + '-01') : rows.length ? rows[0].dn : dn;
    const years = (dn - since) / 365.25;
    return years < 1 ? 3 : years < 3 ? 1 : 0.5;
  }
  /** Kraft-Wert 0–100 aus % pro Monat, Anker je Phase (100 / 85 / 50 / 0) */
  function kraftScore(rate, type, r) {
    const a = type === 'bulk' ? [[-r, 0], [0, 50], [r, 85], [1.5 * r, 100]]
      : type === 'cut' ? [[-6, 0], [-3, 50], [0, 85], [r / 2, 100]]
      : [[-5, 0], [-2, 50], [r / 2, 85], [r, 100]];
    return clamp100(lerp(a.map(([x, y]) => [x, y * 1]), rate));
  }
  /** Gewichtstrend 0–100 aus % pro Woche; eigene Spanne der Phase (in %) gilt vor den Standardspannen */
  function weightScore(x, type, own) {
    if (own) {
      const [lo, hi] = own, w = Math.max(.25, hi - lo);
      if (x >= lo && x <= hi) return 100;
      return clamp100(100 - (x < lo ? lo - x : x - hi) / w * 100);
    }
    if (type === 'bulk') return x > .5 ? Math.max(60, 100 - (x - .5) * 80) : x >= .1 ? 100 : x >= 0 ? 50 + x * 500 : clamp100(50 + x * 200);
    if (type === 'cut') return x < -1 ? Math.max(20, 100 - (-1 - x) * 80) : x <= -.25 ? 100 : x <= 0 ? 50 : clamp100(50 - x * 100);
    return Math.abs(x) <= .25 ? 100 : clamp100(100 - (Math.abs(x) - .25) * 160);
  }

  /** Score am Tag E (dn). → { state: 'none'|'ok', … } */
  function computeAt(E) {
    const ix = Analytics.cur(), F = S().e1rmFormula;
    const ph = phaseAt(E), type = ph ? (PHASE_TYPES[ph.type] ? ph.type : 'other') : 'none';
    const phStart = ph ? dayNum(ph.from) : -Infinity;
    const W0 = weekStartDN(E);
    const strengthRows = ix.rows.filter(r => r.done > 0 && r.dn <= E && r.dn >= phStart);
    const weekHas = new Set(strengthRows.map(r => weekStartDN(r.dn)));
    // Fenster: 8 Wochen, bei Pausen bis 3 Wochen länger; nur seit Beginn der Phase
    let span = 8;
    for (let k = 0; k < 4; k++) {
      let empty = 0;
      for (let i = 0; i < span; i++) if (!weekHas.has(W0 - 7 * i)) empty++;
      const next = 8 + Math.min(3, empty);
      if (next === span) break;
      span = next;
    }
    const weeks = [];
    for (let i = span - 1; i >= 0; i--) { const w = W0 - 7 * i; if (w + 6 >= phStart) weeks.push(w); }
    const from = weeks.length ? Math.max(weeks[0], phStart) : E;
    const inWin = strengthRows.filter(r => r.dn >= from);
    const used = weeks.filter(w => weekHas.has(w));
    const need = Math.max(6 - inWin.length, 4 - used.length, 0);
    if (need > 0) return { state: 'none', need, phase: ph, type };

    // Hälften: ältere und neuere Trainingswochen
    const half = used.length >> 1, older = used.slice(0, used.length - half), recent = used.slice(used.length - half);
    const oldSet = new Set(older), recSet = new Set(recent);
    const midOld = mean(older) + 3, midRec = mean(recent) + 3, months = Math.max(.5, (midRec - midOld) / 30.44);
    const r = expectedRate(E);

    // ---- Kraft je Übung ----
    const exRates = [];
    for (const [exId, ssAll] of Object.entries(ix.sessions)) {
      const ex = Ex.get(exId);
      if (!ex || Ex.type(ex) !== 'kg') continue;
      const ss = sinceFix(ssAll.filter(s => !s.cardio), E).filter(s => s.dn <= E);
      if (ss.length < 5) continue;   // neue Übungen zählen ab der 5. Einheit
      const best = new Map();
      for (const s of ss) {
        if (s.dn < from) continue;
        let b = 0;
        for (const x of s.list || []) {
          if (x.fix || !(x.w > 0) || !(x.r > 0)) continue;
          if (x.rpe != null && +x.rpe <= 5) continue;
          const rir = x.rpe ? Math.max(0, 10 - +x.rpe) : 0;
          if (x.r + rir > 12) continue;
          b = Math.max(b, e1rmBy(x.w, x.r + rir, F));
        }
        if (!b) continue;
        const w = weekStartDN(s.dn);
        best.set(w, Math.max(best.get(w) || 0, b));
      }
      const a = median([...best].filter(([w]) => oldSet.has(w)).map(([, v]) => v));
      const b = median([...best].filter(([w]) => recSet.has(w)).map(([, v]) => v));
      if (!a || !b) continue;
      const reg = regionOf((ex.muscleGroups || [])[0]);
      if (reg < 0) continue;
      exRates.push({ exId, reg, rate: (b / a - 1) * 100 / months, n: ss.filter(s => s.dn >= from).length });
    }

    // ---- Trainingsreiz je Muskelgruppe (Sätze pro Woche in der neueren Hälfte) ----
    const recRows = inWin.filter(row => recSet.has(weekStartDN(row.dn)));
    const nWeeks = Math.max(1, recent.length);
    const sets = {};
    for (const row of recRows) {
      for (const [m, v] of Object.entries(row.mP || {})) sets[m] = (sets[m] || 0) + v;
      for (const [m, v] of Object.entries(row.mS || {})) sets[m] = (sets[m] || 0) + v * .5;
    }
    const full = FULL[type] || 10, curve = CURVE.map(([x, y]) => [x * full / 18, y]);
    const groupSets = m => (sets[m] || 0) / nWeeks;

    // ---- je Körperbereich ----
    const regions = REGIONS.map(([name, groups, plural], i) => {
      const rates = exRates.filter(e => e.reg === i);
      const rate = rates.length ? median(rates.map(e => e.rate)) : null;
      const kraft = rate == null ? null : kraftScore(rate, type, r);
      const avgSets = mean(groups.map(groupSets));
      const reiz = mean(groups.map(m => lerp(curve, groupSets(m)))) * 100;
      const parts = [[kraft, W.kraft], [reiz, W.reiz]].filter(([v]) => v != null);
      const raw = parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0);
      // wenige Daten im Bereich → stärker zur Mitte
      const nR = rates.reduce((a, e) => a + e.n, 0);
      const value = Math.round(50 + (raw - 50) * (.5 + .5 * Math.min(1, nR / 8)));
      return { name, plural, rate, kraft, reiz, sets: avgSets, value };
    });

    // ---- Gesamt: Kraft und Reiz über die Bereiche, Gewicht ----
    const kr = regions.filter(x => x.kraft != null);
    const kraft = kr.length ? mean(kr.map(x => x.kraft)) : null;
    const kraftRate = kr.length ? mean(kr.map(x => x.rate)) : null;
    const reiz = mean(regions.map(x => x.reiz));
    let gewicht = null, bwRate = null;
    if (type !== 'other' || (ph && ph.rateMin != null && ph.rateMax != null)) {
      // erste 2 Wochen nach einem Wechsel Bulk ↔ Cut zählen nicht
      const prev = ph ? (S().phases || []).filter(p => p !== ph && isISO(p.from) && p.from < ph.from).sort((a, b) => b.from.localeCompare(a.from))[0] : null;
      const swap = ph && prev && ((ph.type === 'bulk' && prev.type === 'cut') || (ph.type === 'cut' && prev.type === 'bulk'));
      const wFrom = Math.max(E - 27, phStart + (swap ? 14 : 0));
      const pts = Analytics.bwSeries().filter(p => p.dn >= wFrom && p.dn <= E);
      if (pts.length >= 6 && pts[pts.length - 1].dn - pts[0].dn >= 14) {
        const mx = mean(pts.map(p => p.dn)), my = mean(pts.map(p => p.kg));
        const slope = pts.reduce((a, p) => a + (p.dn - mx) * (p.kg - my), 0) / Math.max(1e-9, pts.reduce((a, p) => a + (p.dn - mx) ** 2, 0));
        bwRate = slope * 7 / my * 100;
        const own = ph && ph.rateMin != null && ph.rateMax != null ? [ph.rateMin / my * 100, ph.rateMax / my * 100] : null;
        gewicht = weightScore(bwRate, type, own);
      }
    }
    const parts = [[kraft, W.kraft], [reiz, W.reiz], [gewicht, W.gewicht]].filter(([v]) => v != null);
    const raw = parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0);
    const conf = Math.min(1, (inWin.length - 6) / 10);
    const uncertain = inWin.length < 12 || exRates.length < 3;
    const value = Math.round(clamp100(50 + (raw - 50) * (.6 + .4 * conf)));
    return { state: 'ok', value, uncertain, phase: ph, type, r, kraft, kraftRate, reiz, gewicht, bwRate, regions,
      phaseShort: ph && E - phStart < 21, sessions: inWin.length };
  }

  /** Klartext: Hauptzeile und höchstens zwei Hinweise */
  function text(x) {
    const kr = x.kraftRate;
    const kraft = kr == null ? null : kr >= x.r / 2 ? 'Kraft steigt' : kr >= -.5 ? 'Kraft gehalten' : kr >= -2 ? 'Kraft sinkt leicht' : 'Kraft sinkt deutlich';
    const weak = x.regions.filter(g => g.sets < 4).sort((a, b) => a.sets - b.sets)[0];
    const mid = x.regions.some(g => g.sets >= 4 && g.sets < 10);
    const reiz = weak ? `wenig Reiz für ${weak.name}` : mid ? (kraft === 'Kraft steigt' ? 'Reiz reicht – Fortschritt da' : 'wirksamer Reiz') : 'guter Aufbau-Reiz';
    const hints = [];
    let gew = null;
    if (x.bwRate != null) {
      const b = x.bwRate;
      if (x.type === 'bulk' && b > .5) hints.push('Zunahme zu schnell – eher Fett');
      else if (x.type === 'cut' && b < -1) hints.push('Abnahme zu schnell – Muskeln in Gefahr');
      else gew = b > .1 ? 'Zunahme im Plan' : b < -.1 ? 'Abnahme im Plan' : 'Gewicht stabil';
    }
    const lag = x.regions.filter(g => g.value < 65).sort((a, b) => a.value - b.value)[0];
    if (lag) hints.push(`${lag.name} ${lag.plural ? 'hängen' : 'hängt'} hinterher`);
    if (x.uncertain) hints.push('noch unsicher – wenige Daten');
    if (x.phaseShort) hints.push('Phase läuft erst kurz');
    const main = [kraft, reiz, gew].filter(Boolean).join(', ');
    return { main: main.charAt(0).toUpperCase() + main.slice(1), hints: hints.slice(0, 2) };
  }

  let cache = null, cacheKey = '';
  /** Aktueller Score mit Verlauf (8 Wochen) und Klartext; gecacht, bis sich Daten oder Einstellungen ändern */
  function get() {
    const s = S();
    const key = [Analytics.cur().builtAt, Store.ver('progress'), Store.ver('exercises'), todayDN(), s.e1rmFormula, s.trainingSince, JSON.stringify(s.phases || [])].join('|');
    if (cache && key === cacheKey) return cache;
    const t = todayDN(), rows = Analytics.cur().rows.filter(r => r.done > 0);
    const last = rows.length ? rows[rows.length - 1].dn : null;
    // Pause über 3 Wochen: der letzte Wert bleibt, „Pause – Score ruht“
    const pause = last != null && t - last > 21;
    const E = pause ? last : t;
    const cur = computeAt(E);
    const W0 = weekStartDN(E);
    const history = [];
    for (let k = 7; k >= 1; k--) { const x = computeAt(W0 - 7 * k + 6); history.push({ dn: W0 - 7 * k + 6, v: x.state === 'ok' ? x.value : null }); }
    history.push({ dn: E, v: cur.state === 'ok' ? cur.value : null });
    cache = { ...cur, pause, history, ...(cur.state === 'ok' ? text(cur) : { main: '', hints: [] }) };
    if (pause && cache.state === 'ok') cache.hints = ['Pause – Score ruht', ...cache.hints].slice(0, 2);
    cacheKey = key;
    return cache;
  }

  /* ---------- Darstellung ---------- */
  const R = 46, C = 2 * Math.PI * R;
  /** Kreis mit Zahl; sm = etwas kleiner (Fortschritt → Übersicht) */
  function circle(sm = false) {
    const x = get();
    const ok = x.state === 'ok', v = ok ? x.value : 0;
    return `<button class="tscore ${sm ? 'sm' : ''} ${ok ? '' : 'empty'}" data-act="tscoreOpen" aria-label="Trainio-Score ${ok ? v : 'noch offen'}">
      <span class="tscore-c"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="${R}" fill="none" stroke-width="5"/>${ok ? `<circle class="arc" cx="50" cy="50" r="${R}" fill="none" stroke-width="5" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - v / 100)).toFixed(2)}"/>` : ''}</svg><b>${ok ? v : '–'}</b></span>
      <span class="tscore-l">Trainio-Score</span>
      ${ok ? '' : `<span class="tscore-need">Noch ${x.need} ${x.need === 1 ? 'Workout' : 'Workouts'}</span>`}
    </button>`;
  }
  function open() {
    const x = get();
    if (x.state !== 'ok') {
      detailSheet({ title: 'Trainio-Score', info: 'Schätzung aus Training und Gewicht. 85 heißt: im erwarteten Tempo.',
        body: `<div class="det"><div class="center">${circle()}</div><p class="dim center">Noch zu wenig Daten – noch ${x.need} ${x.need === 1 ? 'Workout' : 'Workouts'}.</p></div>` });
      return;
    }
    const part = v => v == null ? '–' : Math.round(v);
    detailSheet({ title: 'Trainio-Score', info: 'Schätzung aus Training und Gewicht. 85 heißt: im erwarteten Tempo.',
      body: `<div class="det">
        <div class="center">${circle().replace('data-act="tscoreOpen"', 'tabindex="-1"')}</div>
        <div><p class="bold">${esc(x.main)}</p>${x.hints.map(h => `<p class="det-hint mt-8">${esc(h)}</p>`).join('')}</div>
        <div><div class="sec-h" style="margin-top:0"><h2>Körperbereiche</h2></div>
          <div class="list">${x.regions.map(g => `<div class="kv"><span>${esc(g.name)}</span><b class="${g.value < 65 ? 'warn' : ''}">${g.value}</b></div>`).join('')}</div></div>
        <div><div class="sec-h" style="margin-top:0"><h2>Verlauf</h2><span class="small dim">8 Wochen</span></div>
          ${svgChart({ type: 'line', values: x.history.map(h => h.v), labels: x.history.map((h, i) => i === x.history.length - 1 ? 'jetzt' : i % 2 ? '' : fmtDate(dnToISO(h.dn), { day: 'numeric', month: 'numeric' })), min: 0, max: 100, ticks: [0, 50, 100] })}</div>
        <div><div class="sec-h" style="margin-top:0"><h2>Bestandteile</h2></div>
          <div class="list">
            <div class="kv"><span>Kraft</span><b>${part(x.kraft)}</b></div>
            <div class="kv"><span>Trainingsreiz</span><b>${part(x.reiz)}</b></div>
            <div class="kv"><span>Gewichtstrend</span><b>${part(x.gewicht)}</b></div>
          </div></div>
      </div>` });
  }
  return { get, computeAt, circle, open, REGIONS, expectedRate, kraftScore, weightScore };
})();
Actions.tscoreOpen = () => TScore.open();
