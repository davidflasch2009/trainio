/* Trainio – Arrow-Import
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   16. Arrow-Import (§16): Validierung → Vorschau → Commit → Rollback
   ========================================================================== */
const ARROW_EXAMPLE = {
  source: 'arrow', exportedAt: '2026-10-01T12:00:00Z', version: 1,
  exercises: [{ name: 'Bankdrücken', category: 'Push', muscleGroups: ['Brust', 'Trizeps', 'Schulter'], equipment: 'Langhantel', notes: '' }],
  workouts: [
    { date: '2026-07-14', name: 'Push A', durationSec: 4200, bodyWeightKg: 82.0, notes: 'Bank gut, Schulter zwickt',
      entries: [
        { exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 70, rpe: 7, done: true }, { reps: 6, weightKg: 80, rpe: 9, done: true }, { reps: 3, weightKg: 90, rpe: 10, done: true }] },
        { exerciseName: 'Kreuzheben', sets: [{ reps: 5, weightKg: 120, rpe: 8, done: true }] }] },
    { date: '2026-07-17', name: 'Pull A', durationSec: 3900, bodyWeightKg: null, notes: '',
      entries: [
        { exerciseName: 'Pull Up', sets: [{ reps: 8, weightKg: 0, rpe: null, done: true }, { reps: 7, weightKg: 0, rpe: null, done: true }] },
        { exerciseName: 'Reverse Pec Deck Machine', sets: [{ reps: 15, weightKg: 35, rpe: 8, done: true }] }] }
  ],
  progressEntries: [{ date: '2026-07-01', bodyWeightKg: 81.5, bodyFatPct: null, measurements: null, notes: '' }]
};
const ARROW_PROMPT = `Ich schicke dir Screenshots aus meiner Workout-App „Arrow". Extrahiere ALLE Workouts daraus und antworte ausschließlich mit EINEM JSON-Block in genau diesem Format (keine Erklärungen davor oder danach):

{
  "source": "arrow",
  "exportedAt": "<aktueller ISO-Zeitstempel>",
  "version": 1,
  "exercises": [
    { "name": "Bankdrücken", "category": "Push", "muscleGroups": ["Brust", "Trizeps", "Schulter"], "equipment": "Langhantel", "notes": "" }
  ],
  "workouts": [
    {
      "date": "YYYY-MM-DD", "name": "Push A", "durationSec": 4200, "bodyWeightKg": null, "notes": "",
      "entries": [
        { "exerciseName": "Bankdrücken", "sets": [ { "reps": 8, "weightKg": 70, "rpe": null, "done": true } ] }
      ]
    }
  ],
  "progressEntries": []
}

Regeln:
- Genau ein Eintrag in "exercises" pro eindeutiger Übung; "name" exakt wie in "entries[].exerciseName".
- "category" nur: Push, Pull, Legs, Core, Cardio, Full Body.
- "equipment" nur: Langhantel, Kurzhantel, Maschine, Kabel, Körpergewicht, Band.
- "muscleGroups" nur aus: ${MUSCLES.join(', ')}.
- Gewichte in kg. Falls die App lbs zeigt: statt "weightKg" das Feld "weightLb" verwenden.
- Körpergewichts-Übungen ohne Zusatzgewicht: "weightKg": 0.
- Unbekannte Werte (RPE, Dauer, Körpergewicht) als null – nichts erfinden.
- Datum immer als YYYY-MM-DD, Workouts chronologisch.`;

const CAT_RULES = [
  ['Full Body', /(clean|snatch|thruster|burpee|kettlebell swing|get.?up|farmer|reißen|umsetzen)/],
  ['Cardio', /(lauf|run|jog|treadmill|bike|fahrrad|cycl|rowing machine|rudergerät|rower|ergometer|stepper|stair|elliptical|crosstrainer|seil|jump rope|hiit|swim|schwimm|sprint)/],
  ['Core', /(crunch|plank|sit.?up|bauch|\babs?\b|core|leg raise|beinheben|russian|hollow|dead bug|wood.?chop|pallof|ab wheel|rollout)/],
  ['Legs', /(squat|kniebeug|\bleg\b|bein|lunge|ausfall|calf|wade|hip thrust|glute|gesäß|hack|split|step.?up|adduct|abduct|nordic)/],
  ['Pull', /(row|ruder|pull|zug|chin|curl|deadlift|kreuzheb|shrug|face|rear|reverse|\blat\b|lats|bizeps|bicep|back|rücken)/],
  ['Push', /(press|drück|bench|bank|push|dip|fly|flie|butterfly|raise|heben|tricep|trizeps|extension|skull|chest|brust|shoulder|schulter|ohp)/]
];
const MUSCLE_RULES = [
  ['Brust', /(bench|bank|chest|brust|\bfly|flie|butterfly|pec deck(?! rev)|push.?up|liegestütz|\bdips?\b)/],
  ['Schulter', /(shoulder|schulter|overhead|ohp|military|lateral|seitheb|front raise|arnold)/],
  ['Hintere Schulter', /(rear|reverse|face pull|hintere)/],
  ['Trizeps', /(tricep|trizeps|skull|pushdown|\bdips?\b|close.?grip|french)/],
  ['Bizeps', /(bicep|bizeps|hammer|preacher|\bchin)/],
  ['Rücken', /(\brow\b|rowing|ruder|pull.?up|klimm|\blat\b|pulldown|latzug|\bchin)/],
  ['Trapez', /(shrug|trap|schulterheben)/],
  ['Unterer Rücken', /(deadlift|kreuzheb|back extension|hyperext|good morning|rückenstreck)/],
  ['Bauch', /(crunch|plank|sit.?up|bauch|\babs?\b|core|leg raise|russian|hollow)/],
  ['Quadrizeps', /(squat|kniebeug|leg press|beinpress|lunge|ausfall|leg extension|beinstreck|hack|step.?up)/],
  ['Beinbeuger', /(leg curl|beincurl|hamstring|romanian|rdl|stiff|nordic)/],
  ['Gesäß', /(hip thrust|glute|gesäß|bridge|kickback|abduct)/],
  ['Adduktoren', /(adduct|adduktor|inner thigh|copenhagen)/],
  ['Abduktoren', /(abduct|abduktor|outer thigh|band walk|monster)/],
  ['Waden', /(calf|wade)/]
];
function guessCategory(name) { const n = norm(name); const r = CAT_RULES.find(([, re]) => re.test(n)); return r ? r[0] : null; }
function guessMuscles(name) {
  const n = norm(name);
  let out = MUSCLE_RULES.filter(([, re]) => re.test(n)).map(([m]) => m);
  if (/(leg|bein)/.test(n)) out = out.filter(m => m !== 'Bizeps');
  if (/(reverse|rear)/.test(n)) out = out.filter(m => m !== 'Brust');
  if (/curl/.test(n) && !/(leg|bein)/.test(n) && !out.includes('Bizeps')) out.push('Bizeps');
  return out.slice(0, 4);
}
/** Position eines JSON-Fehlers finden (Safari liefert keine Position) */
function findJsonErrorPos(s) {
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const fail = () => { throw i; };
  function str() { i++; while (i < s.length) { const ch = s[i]; if (ch === '\\') { i += 2; continue; } if (ch === '"') { i++; return; } if (ch < ' ') fail(); i++; } fail(); }
  function val() {
    ws();
    const ch = s[i];
    if (ch === '{') { i++; ws(); if (s[i] === '}') { i++; return; } for (;;) { ws(); if (s[i] !== '"') fail(); str(); ws(); if (s[i] !== ':') fail(); i++; val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === '}') { i++; return; } fail(); } }
    if (ch === '[') { i++; ws(); if (s[i] === ']') { i++; return; } for (;;) { val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === ']') { i++; return; } fail(); } }
    if (ch === '"') return str();
    const m = /^(-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(s.slice(i, i + 64));
    if (m) { i += m[0].length; return; }
    fail();
  }
  try { val(); ws(); if (i < s.length) fail(); return null; } catch (pos) { return typeof pos === 'number' ? pos : null; }
}
function jsonErrorText(text, err) {
  let pos = null;
  const m = String(err.message).match(/position (\d+)/);
  if (m) pos = +m[1];
  if (pos == null) pos = findJsonErrorPos(text);
  if (pos == null) return `JSON ungültig: ${err.message}`;
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  const src = text.split('\n')[line - 1] || '';
  return `JSON ungültig in Zeile ${line}, Spalte ${col}:\n${src.trim().slice(0, 120)}\n\n(${err.message})`;
}

/** Validiert + normalisiert den Import, ohne etwas zu schreiben. replaceId: Workouts dieses Imports werden ersetzt und zählen nicht als Duplikat */
function analyzeImport(text, { replaceId = null } = {}) {
  if (!text.trim()) return { error: 'Bitte zuerst den JSON-Block einfügen oder eine Datei wählen.' };
  let json;
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { json = JSON.parse(cleaned); } catch (e) { return { error: jsonErrorText(cleaned, e) }; }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return { error: 'Erwartet wird ein JSON-Objekt { … }.' };
  const head = [];
  if (json.source !== 'arrow') head.push('„source" muss "arrow" sein.');
  if (json.version !== 1) head.push('„version" muss 1 sein.');
  if (!Array.isArray(json.workouts)) head.push('„workouts" fehlt oder ist keine Liste.');
  if (head.length) return { error: head.join('\n') };

  const warnings = [], broken = [];
  let lbUsed = false;
  const items = [];
  json.workouts.forEach((w, i) => {
    const label = `Workout #${i + 1}${w && w.date ? ` (${w.date})` : ''}`;
    const errs = [];
    if (!w || typeof w !== 'object') { broken.push({ label, errs: ['kein Objekt'] }); return; }
    if (!isISO(w.date)) errs.push('Datum fehlt oder nicht im Format YYYY-MM-DD');
    if (!Array.isArray(w.entries) || !w.entries.length) errs.push('keine „entries"');
    const entries = [];
    (Array.isArray(w.entries) ? w.entries : []).forEach((en, j) => {
      const nm = en && typeof en.exerciseName === 'string' ? en.exerciseName.trim() : '';
      if (!nm) { errs.push(`Eintrag ${j + 1}: „exerciseName" fehlt`); return; }
      if (!Array.isArray(en.sets) || !en.sets.length) { errs.push(`${nm}: keine Sätze`); return; }
      const sets = [];
      en.sets.forEach((s, k) => {
        if (!s || typeof s !== 'object') { errs.push(`${nm} Satz ${k + 1}: kein Objekt`); return; }
        let wkg = s.weightKg;
        if ((wkg === undefined || wkg === null) && s.weightLb != null) { wkg = +s.weightLb * 0.4536; lbUsed = true; }
        if (s.reps == null || wkg == null) { errs.push(`${nm} Satz ${k + 1}: „reps"/„weightKg" fehlt`); return; }
        if (!Number.isFinite(+s.reps) || +s.reps < 0 || !Number.isFinite(+wkg) || +wkg < 0) { errs.push(`${nm} Satz ${k + 1}: ungültige oder negative Zahl`); return; }
        const rpe = s.rpe != null && Number.isFinite(+s.rpe) && +s.rpe >= 0 ? +s.rpe : null;
        const o = { reps: Math.round(+s.reps), weightKg: round(+wkg, 3), rpe, done: s.done !== false };
        if (s.durationSec != null && +s.durationSec > 0) o.durationSec = Math.round(+s.durationSec);
        sets.push(o);
      });
      if (sets.length) entries.push({ exerciseName: nm, sets });
    });
    if (errs.length) { broken.push({ label, errs }); return; }
    const nSets = sum(entries.map(e => e.sets.length));
    const bw = w.bodyWeightKg != null && +w.bodyWeightKg > 0 ? +w.bodyWeightKg : (w.bodyWeightLb != null && +w.bodyWeightLb > 0 ? +w.bodyWeightLb * 0.4536 : null);
    items.push({
      date: w.date, name: (typeof w.name === 'string' && w.name.trim()) || 'Arrow-Workout',
      durationSec: Number.isFinite(+w.durationSec) && +w.durationSec > 0 ? Math.round(+w.durationSec) : nSets * 60,
      estDur: !(Number.isFinite(+w.durationSec) && +w.durationSec > 0),
      bodyWeightKg: bw ? round(bw, 2) : null, notes: typeof w.notes === 'string' ? w.notes : '', entries
    });
  });
  items.sort((a, b) => a.date.localeCompare(b.date));

  // Übungs-Mapping (case-insensitiv, getrimmt, inkl. Aliase)
  const block = new Map();
  (Array.isArray(json.exercises) ? json.exercises : []).forEach(e => { if (e && typeof e.name === 'string' && e.name.trim()) block.set(norm(e.name), e); });
  const mapping = new Map();
  const newExercises = [];
  for (const nm of uniq(items.flatMap(w => w.entries.map(e => e.exerciseName)))) {
    const key = norm(nm);
    if (mapping.has(key)) continue;
    const existing = Ex.findByName(nm);
    if (existing) { mapping.set(key, { id: existing.id, name: existing.name, isNew: false }); continue; }
    const meta = block.get(key);
    let category = meta && CATEGORIES.includes(meta.category) ? meta.category : null;
    const guessed = !category;
    if (!category) category = guessCategory(nm) || 'Full Body';
    const muscles = meta && Array.isArray(meta.muscleGroups) && meta.muscleGroups.length ? meta.muscleGroups.filter(m => MUSCLES.includes(m) || m === 'Ausdauer') : guessMuscles(nm);
    const equipment = meta && EQUIPMENT.includes(meta.equipment) ? meta.equipment : 'Unbekannt';
    const ne = { key, name: nm.trim(), category, muscleGroups: muscles, equipment, notes: meta && typeof meta.notes === 'string' ? meta.notes : '', guessed, fromBlock: !!meta };
    newExercises.push(ne);
    mapping.set(key, { id: null, name: ne.name, isNew: true, ne });
  }
  // Duplikat-Check (Datum + identische Einträge)
  const sigOf = (date, entries, idOf) => date + '|' + entries.map(e => idOf(e) + ':' + e.sets.map(s => `${s.reps}x${round(+s.weightKg || 0, 1)}`).join(',')).join(';');
  const existingSigs = new Set(), existingLoose = new Set();
  for (const w of Store.all('workouts')) {
    if (!isISO(w.date) || (replaceId && w.importId === replaceId)) continue;
    existingSigs.add(sigOf(w.date, (w.entries || []).map(e => ({ ...e, sets: (e.sets || []).filter(s => !s.warmup) })), e => e.exerciseId));
    existingLoose.add(w.date + '|' + uniq((w.entries || []).map(e => e.exerciseId)).sort().join(','));
  }
  const importIdOf = e => { const m = mapping.get(norm(e.exerciseName)); return m.id || 'new:' + m.ne.key; };
  const seen = new Set();
  const dupes = [], maybe = [];
  for (const w of items) {
    const sig = sigOf(w.date, w.entries, importIdOf);
    if (existingSigs.has(sig) || seen.has(sig)) { w.duplicate = true; dupes.push(w.date); }
    else if (existingLoose.has(w.date + '|' + uniq(w.entries.map(importIdOf)).sort().join(','))) maybe.push(w.date);
    seen.add(sig);
  }
  // Körper-Einträge
  const progress = [], progSkipped = [];
  const existingProgDates = new Set(Store.all('progress').map(p => p.date));
  (Array.isArray(json.progressEntries) ? json.progressEntries : []).forEach((p, i) => {
    if (!p || !isISO(p.date)) { progSkipped.push(`Körper-Eintrag #${i + 1}: Datum ungültig`); return; }
    const bw = p.bodyWeightKg != null && +p.bodyWeightKg > 0 ? +p.bodyWeightKg : (p.bodyWeightLb != null && +p.bodyWeightLb > 0 ? +p.bodyWeightLb * 0.4536 : null);
    const bf = p.bodyFatPct != null && +p.bodyFatPct >= 0 ? +p.bodyFatPct : null;
    let meas = null;
    if (p.measurements && typeof p.measurements === 'object') {
      meas = {};
      for (const [k] of MEASURES) meas[k] = p.measurements[k] != null && +p.measurements[k] > 0 ? +p.measurements[k] : null;
      if (!Object.values(meas).some(v => v)) meas = null;
    }
    const dup = existingProgDates.has(p.date) || progress.some(x => x.date === p.date);
    progress.push({ date: p.date, bodyWeightKg: bw ? round(bw, 2) : null, bodyFatPct: bf, measurements: meas, notes: typeof p.notes === 'string' ? p.notes : '', duplicate: dup });
  });
  if (lbUsed) warnings.push('Gewichte in lb gefunden – werden automatisch in kg umgerechnet (× 0,4536).');
  if (dupes.length) warnings.push(`${dupes.length} Workout${dupes.length === 1 ? ' ist' : 's sind'} bereits vorhanden und ${dupes.length === 1 ? 'wird' : 'werden'} übersprungen (${uniq(dupes).slice(0, 6).map(d => fmtDateShort(d) + '.').join(', ')}${dupes.length > 6 ? ' …' : ''})`);
  if (maybe.length) warnings.push(`${maybe.length} Workout${maybe.length === 1 ? ' könnte ein Duplikat sein' : 's könnten Duplikate sein'} (gleicher Tag, gleiche Übungen, andere Werte: ${uniq(maybe).slice(0, 6).map(d => fmtDateShort(d) + '.').join(', ')}) – ${maybe.length === 1 ? 'wird' : 'werden'} trotzdem importiert`);
  newExercises.filter(e => e.guessed).forEach(e => warnings.push(`Übung ohne Kategorie-Info: „${e.name}" – wird als „${e.category}" angelegt${e.muscleGroups.length ? ` (Muskeln geschätzt: ${e.muscleGroups.join(', ')})` : ''}`));
  const estDur = items.filter(w => w.estDur && !w.duplicate).length;
  if (estDur) warnings.push(`${estDur} Workout${estDur === 1 ? '' : 's'} ohne Dauer – geschätzt mit 60 s pro Satz.`);
  const progDup = progress.filter(p => p.duplicate).length;
  if (progDup) warnings.push(`${progDup} Körper-Eintrag/Einträge mit bereits vorhandenem Datum – werden übersprungen.`);
  return { items, mapping, newExercises, progress, warnings, broken, progSkipped, lbUsed, uniqueEx: mapping.size };
}

function previewHtml(a, prev = null, replace = false) {
  const ok = a.items.filter(w => !w.duplicate);
  const dates = a.items.map(w => w.date);
  const listItem = w => `<div class="row small" style="padding:4px 0;${w.duplicate ? 'opacity:.5;text-decoration:line-through' : ''}"><span class="num dim" style="width:76px">${fmtDate(w.date)}</span><span class="grow ellipsis bold">${esc(w.name)}</span><span class="dim">${w.entries.length} Üb. · ${sum(w.entries.map(e => e.sets.length))} Sätze</span></div>`;
  const aliased = [...a.mapping.entries()].filter(([k, m]) => !m.isNew && norm(m.name) !== k);
  const first5 = a.items.slice(0, 5), last5 = a.items.length > 10 ? a.items.slice(-5) : a.items.slice(5);
  const prevN = prev ? prevImportWorkouts(prev).length : 0;
  return `${prev ? `<label class="card row mb-12" style="gap:12px;align-items:flex-start;cursor:pointer">
      <input type="checkbox" id="impReplace" ${replace ? 'checked' : ''} style="width:22px;height:22px;margin-top:2px;flex:0 0 auto;accent-color:var(--accent)">
      <span><b>Alten Arrow-Import ersetzen</b><br><span class="small dim">Der Import vom ${esc(new Date(prev.importedAt).toLocaleDateString('de-DE'))} (${prevN} Workouts) wird durch diese Datei ersetzt – so entsteht nichts doppelt. Workouts, die du selbst in Trainio eingetragen hast, und andere Importe (z. B. Gewicht) bleiben unverändert.</span></span>
    </label>` : ''}<div class="preview-box">
      <div>${icon('checkCircle', 'imp-ic')} JSON gültig</div>
      ${dates.length ? `<div>${icon('calendar', 'imp-ic')} Zeitraum: ${fmtDate(dates[0], { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${fmtDate(dates[dates.length - 1], { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>` : ''}
      <div>${icon('dumbbell', 'imp-ic')} ${a.items.length} Workouts gefunden${a.items.length !== ok.length ? ` (${ok.length} werden importiert)` : ''}</div>
      ${prev && replace ? `<div>${icon('swap', 'imp-ic')} ${prevN} Workouts aus dem alten Import werden ersetzt</div>` : ''}
      <div>${icon('layers', 'imp-ic')} ${a.uniqueEx} einzigartige Übungen (${a.newExercises.length} davon neu – werden angelegt)</div>
      <div>${icon('chart', 'imp-ic')} ${a.progress.length} Körper-Einträge</div>
      ${a.warnings.map(w => `<div class="warn-line">${icon('warn', 'imp-ic')} ${esc(w)}</div>`).join('')}
      ${a.broken.length ? `<div class="danger-text">${icon('xCircle', 'imp-ic')} ${a.broken.length} fehlerhafte${a.broken.length === 1 ? 's Workout wird' : ' Workouts werden'} übersprungen:</div>${a.broken.slice(0, 8).map(b => `<div class="danger-text small">• ${esc(b.label)}: ${esc(b.errs.slice(0, 3).join('; '))}</div>`).join('')}` : ''}
      ${a.progSkipped.map(p => `<div class="danger-text small">${icon('xCircle', 'imp-ic')} ${esc(p)}</div>`).join('')}
    </div>
    ${a.items.length ? `<h4 class="mt-16 mb-8">Erste ${first5.length} Workouts</h4>${first5.map(listItem).join('')}${last5.length ? `<h4 class="mt-16 mb-8">Letzte ${last5.length} Workouts</h4>${last5.map(listItem).join('')}` : ''}` : ''}
    ${a.newExercises.length ? `<h4 class="mt-16 mb-8">Neue Übungen</h4><div class="chips wrap">${a.newExercises.map(e => `<span class="chip" style="cursor:default">${esc(e.name)} <span class="faint">· ${esc(e.category)}</span></span>`).join('')}</div>` : ''}
    ${aliased.length ? `<h4 class="mt-16 mb-8">Zugeordnet zu vorhandenen Übungen</h4><div class="small dim">${aliased.map(([k, m]) => `${esc(k)} → <b>${esc(m.name)}</b>`).join(' · ')}</div>` : ''}`;
}

/** Workouts eines Imports, die noch vorhanden sind */
const prevImportWorkouts = imp => ((imp.docIds || {}).workouts || []).filter(id => Store.raw('workouts', id));
Actions.openArrow = () => {
  let analysis = null;
  const prevImp = Store.all('imports').filter(i => i.source === 'arrow' && !i.undoneAt && prevImportWorkouts(i).length).sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0))[0] || null;
  let replace = !!prevImp;
  const m = Modal.open({
    title: 'Arrow-Import', size: 'full',
    body: `<p class="dim">Füge den JSON-Block aus deinem Chat hier ein. Wir zeigen dir vor dem Speichern eine Vorschau.</p>
      <div class="row wrap mt-12">
        <label class="btn btn-secondary btn-sm">${icon('upload')} .json-Datei<input type="file" accept=".json,application/json,text/plain" id="impFile" hidden></label>
        <button class="btn btn-ghost btn-sm" data-x="prompt">${icon('copy')} Prompt für Claude kopieren</button>
        <button class="btn btn-ghost btn-sm" data-x="example">${icon('file')} Beispiel einfügen</button>
      </div>
      <textarea class="textarea code mt-12 drop-zone" id="impText" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='{ "source": "arrow", "version": 1, "workouts": [ … ] }'></textarea>
      <button class="btn btn-primary btn-block mt-12" data-x="validate">${icon('checkCircle')} Validieren & Vorschau</button>
      <div id="impOut" class="mt-16"></div>`,
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="commit" id="impCommit" disabled>Import bestätigen</button>`
  });
  const ta = $('#impText', m.el), out = $('#impOut', m.el), commitBtn = $('#impCommit', m.el);
  const invalidate = () => { analysis = null; commitBtn.disabled = true; };
  ta.addEventListener('input', invalidate);
  ta.addEventListener('dragover', e => { e.preventDefault(); ta.classList.add('over'); });
  ta.addEventListener('dragleave', () => ta.classList.remove('over'));
  ta.addEventListener('drop', async e => { e.preventDefault(); ta.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) { ta.value = await readFileText(f); invalidate(); validate(); } });
  $('#impFile', m.el).addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; ta.value = await readFileText(f); invalidate(); validate(); });
  function validate(scroll = true) {
    analysis = analyzeImport(ta.value, { replaceId: replace && prevImp ? prevImp.id : null });
    if (analysis.error) { out.innerHTML = `<div class="import-err">${esc(analysis.error)}</div>`; analysis = null; commitBtn.disabled = true; return; }
    out.innerHTML = previewHtml(analysis, prevImp, replace);
    const cbx = $('#impReplace', out);
    if (cbx) cbx.addEventListener('change', () => { replace = cbx.checked; validate(false); });
    const n = analysis.items.filter(w => !w.duplicate).length + analysis.progress.filter(p => !p.duplicate).length;
    commitBtn.disabled = !n;
    commitBtn.textContent = n ? (replace && prevImp ? 'Ersetzen & importieren' : 'Import bestätigen') : 'Nichts Neues zu importieren';
    if (scroll) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    const x = b.dataset.x;
    if (x === 'cancel') return m.close();
    if (x === 'example') { ta.value = JSON.stringify(ARROW_EXAMPLE, null, 2); invalidate(); return; }
    if (x === 'prompt') {
      try { await navigator.clipboard.writeText(ARROW_PROMPT); toast('Prompt kopiert – zusammen mit den Screenshots an Claude schicken', 'success', { cat: 'always' }); }
      catch (err) { Modal.open({ title: 'Prompt für Claude', body: `<textarea class="textarea code" readonly style="min-height:360px">${esc(ARROW_PROMPT)}</textarea>` }); }
      return;
    }
    if (x === 'validate') return validate();
    if (x === 'commit' && analysis) {
      commitBtn.disabled = true;
      $$('[data-x]', m.el).forEach(btn => { btn.disabled = true; });
      ta.disabled = true;
      out.innerHTML = `<div class="card"><div class="bold" id="impStatus">Starte Import …</div><div class="progress-track mt-12"><i id="impBar"></i></div></div>`;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        const res = await commitImport(analysis, (msg, frac) => { $('#impStatus', m.el).textContent = msg; $('#impBar', m.el).style.width = Math.round(frac * 100) + '%'; }, { replace: replace ? prevImp : null });
        m.close();
        toast(`${res.replaced ? `${res.replaced} alte Workouts ersetzt · ` : ''}${res.workouts} Workouts, ${res.exercises} Übungen und ${res.prs} PRs importiert`, 'success', { cat: 'always', duration: 6000 });
        if (res.fallback) setTimeout(() => toast(`${res.fallback} Übung${res.fallback === 1 ? '' : 'en'} mit Standardwerten angelegt – bitte in der Bibliothek prüfen`, 'warn', { duration: 6000 }), 800);
        if (analysis.broken.length) setTimeout(() => toast(`${analysis.broken.length} fehlerhafte${analysis.broken.length === 1 ? 's Workout' : ' Workouts'} übersprungen`, 'warn', { duration: 6000 }), 1600);
        App.go('progress');
      } catch (err) {
        console.error(err);
        out.innerHTML = `<div class="import-err">Import abgebrochen: ${esc(err.message)}</div>`;
        $$('[data-x]', m.el).forEach(btn => { btn.disabled = false; });
        ta.disabled = false;
      }
    }
  });
};

async function commitImport(a, progress, { replace = null } = {}) {
  const importId = autoId();
  const created = { exercises: [], workouts: [], progress: [] };
  // 0) Alten Arrow-Import ersetzen: seine Workouts löschen; von ihm angelegte Übungen nur löschen,
  //    wenn die neue Datei sie nicht mehr nutzt und sie sonst nirgends vorkommen (Workouts, Pläne)
  let replaced = 0;
  if (replace) {
    const wIds = prevImportWorkouts(replace), wSet = new Set(wIds);
    const reused = new Set([...a.mapping.values()].filter(m => m.id).map(m => m.id));
    const usedElsewhere = new Set(Store.all('workouts').filter(w => !wSet.has(w.id)).flatMap(w => (w.entries || []).map(e => e.exerciseId)));
    const usedInPlans = new Set(Store.all('templates').flatMap(t => (t.exercises || []).map(x => x.exerciseId)));
    const oldEx = ((replace.docIds || {}).exercises || []).filter(id => Store.raw('exercises', id));
    created.exercises.push(...oldEx.filter(id => reused.has(id)));
    const delEx = oldEx.filter(id => !reused.has(id) && !usedElsewhere.has(id) && !usedInPlans.has(id));
    progress(`Entferne ${wIds.length} Workouts des alten Imports …`, 0.01);
    await Store.batch([
      ...wIds.map(id => ({ type: 'del', coll: 'workouts', id })),
      ...delEx.map(id => ({ type: 'del', coll: 'exercises', id })),
      { type: 'put', coll: 'imports', id: replace.id, doc: { undoneAt: Date.now(), replacedBy: importId } }
    ]);
    replaced = wIds.length;
  }
  // 1) Neue Übungen anlegen
  const exOps = [];
  for (const ne of a.newExercises) {
    const id = autoId();
    a.mapping.get(ne.key).id = id;
    created.exercises.push(id);
    exOps.push({ type: 'put', coll: 'exercises', id, doc: { name: ne.name, category: ne.category, muscleGroups: ne.muscleGroups, equipment: ne.equipment, isCustom: true, notes: ne.notes, defaultUnit: 'kg', aliases: [], importId, createdAt: Date.now() } });
  }
  if (exOps.length) { progress(`Lege ${exOps.length} Übungen an …`, 0.02); await Store.batch(exOps); }
  // 2) Workouts in Chunks à 50 (UI bleibt flüssig, Firestore-Batches ≤ 500)
  const list = a.items.filter(w => !w.duplicate);
  for (let i = 0; i < list.length; i += 50) {
    const chunk = list.slice(i, i + 50);
    const ops = chunk.map(w => {
      const id = autoId();
      created.workouts.push(id);
      const [y, mo, d] = w.date.split('-').map(Number);
      const startedAt = new Date(y, mo - 1, d, 18, 0, 0).getTime();
      return { type: 'put', coll: 'workouts', id, replace: true, doc: {
        date: w.date, startedAt, endedAt: startedAt + w.durationSec * 1000, durationSec: w.durationSec,
        planId: null, planDayIndex: null, planDayName: w.name, name: w.name, notes: w.notes, bodyWeightKg: w.bodyWeightKg,
        entries: w.entries.map(e => { const mp = a.mapping.get(norm(e.exerciseName)); return { exerciseId: mp.id, exerciseName: e.exerciseName, sets: e.sets }; }),
        ...(w.estDur ? { durationEstimated: true } : {}),
        importId, createdAt: Date.now(), updatedAt: Date.now()
      } };
    });
    progress(`Importiere Workout ${Math.min(i + 50, list.length)}/${list.length} …`, 0.05 + 0.75 * Math.min(i + 50, list.length) / list.length);
    await Store.batch(ops);
    await sleep(0);
  }
  // 3) Körper-Einträge
  const pOps = a.progress.filter(p => !p.duplicate).map(p => {
    const id = autoId();
    created.progress.push(id);
    const { duplicate, ...rest } = p;
    return { type: 'put', coll: 'progress', id, replace: true, doc: { ...rest, photoUrl: null, importId, createdAt: Date.now() } };
  });
  if (pOps.length) { progress(`Speichere ${pOps.length} Körper-Einträge …`, 0.85); await Store.batch(pOps); }
  // 4) PRs über ALLE Workouts neu berechnen (ohne Toasts)
  progress('Berechne Personal Records …', 0.92);
  await sleep(0);
  const prs = await PR.recalcAll();
  // 5) Import-Transaktion protokollieren (für Rollback)
  Store.put('imports', importId, {
    source: 'arrow', importedAt: Date.now(), undoneAt: null,
    counts: { workouts: created.workouts.length, exercises: created.exercises.length, progress: created.progress.length, skippedDuplicates: a.items.length - list.length, broken: a.broken.length },
    docIds: created
  }, { replace: true });
  progress('Fertig', 1);
  return { workouts: created.workouts.length, exercises: a.uniqueEx, prs, replaced, fallback: a.newExercises.filter(e => !e.fromBlock).length };
}

