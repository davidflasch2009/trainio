/* Trainio – Verlauf: Monate, Kalender, Workout-Detail, Teilen
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ---------- Verlauf + Kalender ---------- */
let historyMonths = 1;
function historyMonthSummary(rows) {
  const count = rows.length;
  return count === 1 ? '1 Workout' : count + ' Workouts';
}
function renderHistory(el) {
  const ix = Analytics.cur();
  const t = new Date();
  const [cy, cm] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  const first = new Date(cy, cm, 1);
  const startOff = S().weekStart === 'sunday' ? first.getDay() : (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();
  const byDate = {};
  for (const r of ix.rows) (byDate[r.date] || (byDate[r.date] = [])).push(r);
  const heads = S().weekStart === 'sunday' ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  let cells = '';
  for (let i = 0; i < startOff; i++) cells += '<span></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${cy}-${pad(cm + 1)}-${pad(d)}`;
    const has = byDate[iso];
    // ein Punkt pro Workout (max. 3, dann „+“); mehrere an einem Tag → erst auswählen
    const act = !has ? 'disabled' : has.length === 1 ? `data-act="openWorkout" data-id="${esc(has[0].id)}"` : `data-act="calDay" data-date="${iso}"`;
    cells += `<button class="${has ? 'has' : ''} ${iso === isoDate() ? 'today' : ''}" ${act} aria-label="${d}. ${has ? has.map(x => x.name).join(', ') : 'kein Training'}">${d}${has ? `<span class="cal-dots">${'<i></i>'.repeat(Math.min(3, has.length))}${has.length > 3 ? '<b>+</b>' : ''}</span>` : ''}</button>`;
  }
  el.innerHTML = `
    <div class="card">
      <div class="row between mb-8 cal-head">
        <button class="btn-icon" data-act="calNav" data-d="-1" aria-label="Vorheriger Monat">${icon('chevL')}</button>
        <div class="center"><div class="cal-pick">
          <select class="select cal-sel" data-ch="calPick" data-k="m" aria-label="Monat">${MONTHS_LONG.map((n, i) => `<option value="${i}" ${i === cm ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select class="select cal-sel" data-ch="calPick" data-k="y" aria-label="Jahr">${calYears(cy).map(y => `<option value="${y}" ${y === cy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div></div>
        <button class="btn-icon" data-act="calNav" data-d="1" aria-label="Nächster Monat">${icon('chevR')}</button>
      </div>
      <div class="cal">${heads.map(h => `<span class="cal-h">${h}</span>`).join('')}${cells}</div>
    </div>
    <div id="workoutHistory">${workoutHistoryHtml()}</div>`;
}
function workoutHistoryHtml() {
  const rows = Analytics.cur().rows.slice().reverse();
  if (!rows.length) return `<div class="card mt-16">${emptyState('history', 'Noch kein Verlauf', 'Abgeschlossene Workouts erscheinen hier.')}</div>`;
  const { groups, previous } = historyMonthPage(rows, historyMonths);
  return groups.map(g => `<section class="history-month"><div class="history-month-content">
      <div class="section-head"><h4>${parseISO(g.k + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</h4><span class="tiny dim">${historyMonthSummary(g.items)}</span></div>
      <div class="col" data-history-month="${g.k}">${g.items.length ? g.items.map(miniWorkoutCard).join('') : '<p class="small dim">Keine Workouts in diesem Monat.</p>'}</div>
    </div></section>`).join('') + historyMoreButton(previous, 'histMore');
}
Actions.calNav = el => {
  const t = new Date();
  let [y, m] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  m += +el.dataset.d;
  if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
  UI.calMonth = `${y}-${m}`;
  saveUI();
  App.renderCurrent();
};
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** Jahre für die Auswahl: vom ersten Workout bis heute (mind. das gerade gezeigte) */
function calYears(shown) {
  const rows = Analytics.cur().rows, now = new Date().getFullYear();
  const from = Math.min(shown, rows.length ? +rows[0].date.slice(0, 4) : now), to = Math.max(shown, now);
  return Array.from({ length: to - from + 1 }, (_, i) => to - i);
}
Changes.calPick = el => {
  const t = new Date();
  let [y, m] = (UI.calMonth || `${t.getFullYear()}-${t.getMonth()}`).split('-').map(Number);
  if (el.dataset.k === 'y') y = +el.value; else m = +el.value;
  UI.calMonth = `${y}-${m}`;
  saveUI();
  App.renderCurrent();
};
/** Tag mit mehreren Workouts: erst auswählen, welches geöffnet wird */
Actions.calDay = async el => {
  const rows = Analytics.cur().rows.filter(r => r.date === el.dataset.date);
  const k = await actionMenu(fmtDateLong(el.dataset.date), rows.map(r => {
    const wo = Store.raw('workouts', r.id) || {};
    const time = wo.startedAt ? new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' : '';
    return { key: r.id, label: woTitle(wo, r.name), sub: time + fmtDur(wo.durationSec) + (r.cardioOnly ? ' · Cardio' : ` · ${r.sets} Sätze`), icon: r.cardioOnly ? 'heart' : 'dumbbell' };
  }));
  if (k) openWorkoutDetail(k);
};
Actions.histMore = () => { historyMonths++; revealHistoryMonth($('#workoutHistory'), workoutHistoryHtml()); };

/* ---------- Workout-Detail ---------- */
Actions.openWorkout = el => openWorkoutDetail(el.dataset.id);
function timedSetSummary(sets, uni) {
  const times = sets.filter(s => s.done !== false && !s.warmup && (s.durationSec > 0 || s.durationSecR > 0))
    .map(s => {
      const left = Number(s.durationSec) || 0;
      const right = Number(s.durationSecR ?? left);
      if (uni || s.durationSecR != null) return { label: left + '/' + right + ' s', total: left + right };
      return { label: left + ' s', total: left };
    });
  if (!times.length) return '';
  if (times.every(t => t.label === times[0].label)) return times.length + ' × ' + times[0].label;
  return sum(times.map(t => t.total)) + ' s gesamt';
}
function openWorkoutDetail(id) {
  const wo = Store.raw('workouts', id);
  if (!wo) return toast('Workout nicht gefunden', 'error');
  const editMeta = () => openWorkoutMeta(id, () => { m.dismiss(); openWorkoutDetail(id); });
  const row = Analytics.cur().rows.find(r => r.id === id);
  const prEv = Analytics.cur().prEvents.filter(p => p.wid === id);
  const sc = F('f_score') ? Analytics.score(id) : null;
  // RPE-Spalte nur, wenn in diesem Workout irgendwo ein RPE eingetragen ist (wie die Kachel „Ø RPE“)
  const hasRpe = (wo.entries || []).some(en => (en.sets || []).some(s => s.rpe != null && s.rpe !== ''));
  const m = Modal.open({
    title: woTitle(wo), size: 'lg',
    body: `
      <button class="wd-when" data-x="meta" aria-label="Datum, Uhrzeit und Dauer bearbeiten">${esc(fmtDateLong(wo.date))}${parseISO(wo.date).getFullYear() !== new Date().getFullYear() ? ' ' + parseISO(wo.date).getFullYear() : ''}${wo.startedAt ? ' · ' + new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ''} ${icon('edit')}</button>
      ${sc ? `<div class="wd-score mt-12">${scoreRingHtml(sc, true)}${scoreBreakdownHtml(sc)}</div>` : ''}
      ${prTiles([
        { html: n => `<button class="pr-box wd-edit" data-x="meta" aria-label="Dauer bearbeiten"><span>Dauer ${icon('edit')}</span><b>${n === 3 ? fmtMin(wo.durationSec) : fmtDur(wo.durationSec)}</b></button>` },
        ...(row && row.cardioOnly ? [] : [['Volumen', fmtTon(row ? row.ton : 0)], ['Sätze', row ? row.sets : 0], ...(row && row.avgRpe ? [['Ø RPE', nf(row.avgRpe, 1)]] : [])]),
        ...(row && (row.cSec || row.cKm) ? [['Cardio', fmtDur(row.cSec)], ...(row.cKm ? [['Distanz', fmtKm(row.cKm)]] : [])] : [])
      ], 'mt-12')}
      ${prEv.length ? `<div class="mt-12 row wrap">${prEv.map(p => `<span class="badge accent">${icon('trophy')} ${esc(Ex.name(p.exId))} ${fmtW(p.w)} × ${p.r}</span>`).join('')}</div>` : ''}
      ${wo.notes ? `<div class="card tight mt-12" style="background:var(--surface-2)">${icon('note').replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px;margin-right:6px"')}${esc(wo.notes)}</div>` : ''}
      ${(wo.entries || []).map(en => {
        const ex = Ex.get(en.exerciseId);
        if (Ex.type(ex) === 'cardio') {
          const info = cardioInfo(ex), ss = (en.sets || []).filter(s => s.durationSec || s.distKm);
          return `<div class="mt-16">
            <div class="row between"><button class="link-btn" style="padding:0;min-height:32px;color:var(--text)" data-act="openExercise" data-id="${esc(en.exerciseId)}"><b>${esc(Ex.entryName(en))}</b></button>
            <span class="tiny dim">${esc(cardioTxt(cardioTotals(en.sets), info))}</span></div>
            ${Heart.effortTxt(en) ? `<div class="tiny dim">${esc(Heart.effortTxt(en))}</div>` : ''}
            ${ss.length > 1 || info.mode !== 'time' ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Abschn.</th><th class="r">Dauer</th>${info.mode === 'dist' ? '<th class="r">km</th><th class="r">km/h</th>' : ''}${info.lvl ? `<th class="r">${esc(info.lvl)}</th>` : ''}</tr></thead><tbody>
            ${ss.map((s, i) => `<tr style="${s.done === false ? 'opacity:.45' : ''}"><td>${i + 1}</td><td class="r">${s.durationSec ? fmtClock(s.durationSec) : '–'}</td>${info.mode === 'dist' ? `<td class="r">${s.distKm ? nf(s.distKm, 2) : '–'}</td><td class="r">${s.distKm && cardioKmhValid(s.distKm, s.durationSec) ? nf(s.distKm / (s.durationSec / 3600), 1) : '–'}</td>` : ''}${info.lvl ? `<td class="r">${s.level != null ? nf(s.level, 1) + lvlUnit(info.lvl) : '–'}</td>` : ''}</tr>`).join('')}
            </tbody></table></div>` : ''}</div>`;
        }
        const isSec = Ex.type(ex) === 'sec';
        const sets = en.sets || [];
        const weighted = isSec && sets.some(s => s.weightKg > 0);
        return `<div class="mt-16">
          <div class="row between"><button class="link-btn" style="padding:0;min-height:32px;color:var(--text)" data-act="openExercise" data-id="${esc(en.exerciseId)}"><b>${esc(Ex.entryName(en))}</b>${en.uni ? ' <span class="badge">L/R</span>' : ''}${en.formFix ? ' <span class="badge warn">Form-Fix</span>' : ''}</button>
          <span class="tiny dim">${isSec ? timedSetSummary(sets, en.uni) : fmtTon(sum(sets.filter(s => s.done !== false && !s.warmup).map(setVol)))}</span></div>
          ${en.formFix && en.formFix.note ? `<div class="tiny dim">${esc(en.formFix.note)}</div>` : ''}
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Satz</th><th class="r">${isSec ? (en.uni ? 'Zeit L/R' : 'Zeit') : unit()}</th>${isSec && !weighted ? '' : `<th class="r">${weighted ? unit() : en.uni ? 'Wdh. L/R' : 'Wdh.'}</th>`}${hasRpe ? '<th class="r">RPE</th>' : ''}${isSec ? '' : '<th class="r">e1RM</th>'}</tr></thead><tbody>
          ${(en.sets || []).map((s, i) => `<tr style="${s.done === false ? 'opacity:.45' : ''}"><td>${s.warmup ? 'W' : i + 1 - (en.sets.slice(0, i).filter(x => x.warmup).length)}${!s.warmup && KIND_LABEL[s.kind] ? ` <span class="badge ${s.kind === 'fail' ? 'danger' : 'info'}" style="height:18px">${KIND_LABEL[s.kind]}</span>` : ''}${s.done === false ? ' <span class="tiny">(offen)</span>' : ''}${s.fix && !s.warmup ? ' <span class="badge warn" style="padding:1px 5px">Form-Fix</span>' : ''}</td>
            <td class="r">${isSec ? secTxt(s) : wNum(s.weightKg)}</td>${isSec && !weighted ? '' : `<td class="r">${weighted ? (s.weightKg ? wNum(s.weightKg) : '–') : repsTxt(s)}</td>`}${hasRpe ? `<td class="r">${s.rpe ?? '–'}</td>` : ''}
            ${isSec ? '' : `<td class="r dim">${!s.fix && e1rm(s.weightKg, repsOf(s)) ? wNum(e1rm(s.weightKg, repsOf(s))) : '–'}</td>`}</tr>`).join('')}
          </tbody></table></div></div>`;
      }).join('')}`,
    foot: `<button class="btn btn-secondary" data-x="share" aria-label="Teilen" title="Teilen" style="flex:0 0 auto">${icon('share')}</button>
      <button class="btn btn-secondary" data-x="edit" style="flex:1 1 auto;padding:0 12px">Bearbeiten</button>
      <button class="btn btn-primary" data-x="repeat" style="flex:1 1 auto;padding:0 12px">Wiederholen</button>`
  });
  animScoreRing(m.el);
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'meta') editMeta();
    else if (b.dataset.x === 'edit') {
      const k = await actionMenu('Workout bearbeiten', [
        { key: 'meta', label: 'Datum, Uhrzeit & Dauer', icon: 'calendar' },
        { key: 'sets', label: 'Sätze & Übungen', icon: 'dumbbell' },
        { key: 'del', label: 'Workout löschen', icon: 'trash', danger: true }
      ]);
      if (k === 'meta') editMeta();
      else if (k === 'sets') { m.dismiss(); Workout.load(wo, { edit: true }); }
      else if (k === 'del') {
        m.dismiss();
        withUndo(`${woTitle(wo)} vom ${fmtDate(wo.date, { day: 'numeric', month: 'numeric' })} gelöscht`, { docs: [['workouts', id]],
          run: () => { Store.del('workouts', id); PR.recalcAll(); }, after: () => PR.recalcAll() });
      }
    }
    else if (b.dataset.x === 'repeat') { m.dismiss(); Workout.load(wo); }
    else if (b.dataset.x === 'share') shareWorkout({ ...wo, id });
  });
}
/** Gespeichertes Workout nachträglich ändern: Name, Datum, Startzeit, Dauer, Körpergewicht, Notiz */
function openWorkoutMeta(id, onSaved) {
  const wo = Store.raw('workouts', id);
  if (!wo) return;
  const st = wo.startedAt ? new Date(wo.startedAt) : null;
  const p2 = n => String(n).padStart(2, '0');
  const mins = Math.round((wo.durationSec || 0) / 60);
  const m = Modal.open({
    title: 'Workout bearbeiten', size: 'sm',
    body: `<div class="form-grid">
        <label class="field full"><span>Name</span><input class="input" id="wmName" value="${esc(woTitle(wo, ''))}" placeholder="Workout"></label>
        <label class="field"><span>Datum</span><input class="input" type="date" id="wmDate" value="${esc(wo.date)}" max="${isoDate()}"></label>
        <label class="field"><span>Startzeit</span><input class="input" type="time" id="wmTime" value="${st ? p2(st.getHours()) + ':' + p2(st.getMinutes()) : ''}"></label>
        <div class="field full"><span>Dauer</span>
          <div class="row wm-dur"><input class="input" id="wmH" inputmode="numeric" value="${Math.floor(mins / 60)}" aria-label="Stunden"><span class="dim">h</span>
          <input class="input" id="wmM" inputmode="numeric" value="${mins % 60}" aria-label="Minuten"><span class="dim">min</span></div></div>
        <label class="field full"><span>Körpergewicht (${unit()})</span><input class="input" id="wmBw" inputmode="decimal" value="${inputW(wo.bodyWeightKg)}" placeholder="optional"></label>
        <label class="field full"><span>Notiz</span><textarea class="textarea" id="wmNotes" style="min-height:70px" placeholder="Wie lief's?">${esc(wo.notes || '')}</textarea></label>
      </div>`,
    foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="save">${icon('check')} Speichern</button>`
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'cancel') return m.close();
    if (b.dataset.x !== 'save') return;
    const v = sel => $(sel, m.el).value.trim();
    const date = v('#wmDate');
    if (!isISO(date) || date > isoDate()) return toast('Bitte ein gültiges Datum wählen', 'warn');
    const durSec = Math.round(((parseNum(v('#wmH')) || 0) * 60 + (parseNum(v('#wmM')) || 0)) * 60);
    if (durSec <= 0 || durSec > 24 * 3600) return toast('Bitte eine Dauer zwischen 1 Minute und 24 Stunden eintragen', 'warn');
    const start = parseISO(date);
    const tm = v('#wmTime').match(/^(\d{1,2}):(\d{2})/);
    if (tm) start.setHours(+tm[1], +tm[2], 0, 0);
    else if (st) start.setHours(st.getHours(), st.getMinutes(), 0, 0);
    else start.setHours(12, 0, 0, 0);
    const bw = parseNum(v('#wmBw'));
    if (bw && !bwValidKg(round(fromU(bw), 2))) return toast(`Bitte ein Körpergewicht ${bwRangeTxt()} eintragen`, 'warn');
    const name = v('#wmName') || wo.name || 'Workout';
    const patch = {
      date, startedAt: start.getTime(), endedAt: start.getTime() + durSec * 1000, durationSec: durSec, durationEstimated: false,
      name, notes: $('#wmNotes', m.el).value.trim(), bodyWeightKg: bw ? round(fromU(bw), 2) : null, updatedAt: Date.now()
    };
    Store.put('workouts', id, patch);
    m.close();
    toast('Workout aktualisiert', 'success');
    if (onSaved) onSaved();
  });
}
function workoutText(wo) {
  const lines = [`${woTitle(wo)} – ${fmtDate(wo.date)}`, `Dauer: ${fmtDur(wo.durationSec)}`];
  let ton = 0;
  for (const en of wo.entries || []) {
    const done = (en.sets || []).filter(s => s.done !== false && !s.warmup);
    if (!done.length) continue;
    ton += sum(done.map(setVol));
    if (Ex.type(Ex.get(en.exerciseId)) === 'cardio') { lines.push(`• ${Ex.entryName(en)}: ${cardioTxt(cardioTotals(done), cardioInfo(Ex.get(en.exerciseId)))}`); continue; }
    const isSec = Ex.type(Ex.get(en.exerciseId)) === 'sec';
    lines.push(`• ${Ex.entryName(en)}${en.uni ? ' (L/R)' : ''}: ${done.map(s => isSec ? secTxt(s) : (s.weightKg ? `${wNum(s.weightKg)}×${repsTxt(s)}` : repsTxt(s))).join(', ')}`);
  }
  if (ton) lines.splice(2, 0, `Volumen: ${fmtTon(ton)}`);
  lines.push('', `– getrackt mit ${APP.name}`);
  return lines.join('\n');
}
/* ---------- Teilen: Story-Bild (9:16) im eigenen Theme, Text als Alternative ---------- */
async function shareWorkout(wo) {
  let file = null, url = null;
  const canFiles = f => { try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] })); } catch (e) { return false; } };
  const m = Modal.open({
    title: 'Workout teilen', size: 'sm', cls: 'share-modal',
    body: `<div class="share-prev"><span class="share-load" aria-label="Bild wird erstellt"></span></div>
`,
    foot: `<button class="btn btn-secondary" data-x="text">${icon('copy')} Als Text</button>
      <button class="btn btn-primary" data-x="img" disabled>${icon('share')} Bild teilen</button>`,
    onClose: () => { if (url) URL.revokeObjectURL(url); }
  });
  try {
    const blob = await shareImage(wo);
    file = new File([blob], `trainio-${wo.date || 'workout'}.png`, { type: 'image/png' });
    url = URL.createObjectURL(blob);
    $('.share-prev', m.el).innerHTML = `<img src="${url}" alt="Vorschau: Teilen-Bild des Workouts">`;
    const b = $('[data-x="img"]', m.el);
    b.disabled = false;
    if (!canFiles(file)) b.innerHTML = `${icon('download')} Bild speichern`;
  } catch (e) {
    console.warn('Teilen-Bild', e);
    $('.share-prev', m.el).innerHTML = `<p class="small dim center" style="padding:16px">Bild konnte nicht erstellt werden – teile das Workout als Text.</p>`;
  }
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'text') return shareText(wo);
    if (!file) return;
    try {
      if (canFiles(file)) { await navigator.share({ files: [file], title: `${woTitle(wo)} · ${APP.name}` }); return; }
      const a = document.createElement('a');
      a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      toast('Bild gespeichert', 'success', { cat: 'always' });
    } catch (err) { if (err.name !== 'AbortError') toast('Teilen nicht möglich', 'error'); }
  });
}
async function shareText(wo) {
  const text = workoutText(wo);
  try {
    if (navigator.share) { await navigator.share({ title: APP.name, text }); return; }
    await navigator.clipboard.writeText(text);
    toast('In die Zwischenablage kopiert', 'success', { cat: 'always' });
  } catch (e) { if (e.name !== 'AbortError') toast('Teilen nicht möglich', 'error'); }
}
/** Beste Leistung einer Übung für das Bild („80 kg × 8“, „1:30“, „30:00 · 5,2 km“) */
function shareBest(en) {
  const ex = Ex.get(en.exerciseId), t = Ex.type(ex);
  const done = (en.sets || []).filter(s => s.done !== false && !s.warmup);
  if (!done.length) return null;
  const top = f => done.reduce((a, b) => f(b) > f(a) ? b : a);
  const n = `${done.length} ${done.length === 1 ? 'Satz' : 'Sätze'}`;
  if (t === 'cardio') return { best: cardioTxt(cardioTotals(done), cardioInfo(ex)), sub: 'Cardio' };
  if (t === 'sec') return { best: secTxt(top(s => +s.durationSec || 0)), sub: n };
  if (t === 'reps') { const b = top(repsOf); return { best: `${repsTxt(b)} Wdh.${b.weightKg ? ' · +' + fmtW(b.weightKg) : ''}`, sub: n }; }
  const b = top(s => e1rm(s.weightKg, repsOf(s)) || +s.weightKg || 0);
  return { best: b.weightKg ? `${wNum(b.weightKg)} ${unit()} × ${repsTxt(b)}` : `${repsTxt(b)} Wdh.`, sub: n };
}
/** Story-Bild 1080×1920 zeichnen – Farben, Schriften & Eigenheiten des aktuellen Designs → PNG-Blob */
async function shareImage(wo) {
  const W = 1080, H = 1920, P = 80, root = document.documentElement, cs = getComputedStyle(root);
  const v = k => cs.getPropertyValue(k).trim();
  const design = root.dataset.design, dark = root.dataset.theme === 'dark';
  const C = { bg: v('--bg'), surf: v('--surface'), surf3: v('--surface-3'), border: v('--border'), text: v('--text'), dim: v('--text-dim'), faint: v('--text-faint'), accent: v('--accent'), acc: v('--accent-text'), gold: v('--gold-text') || '#f6bb2a' };
  const FN = { body: v('--font') || 'system-ui, sans-serif', disp: v('--font-display') || v('--font') || 'system-ui, sans-serif', num: v('--font-num') || v('--font') || 'system-ui, sans-serif' };
  const fwx = v('--fw-x') || '700', upper = v('--title-transform') === 'uppercase', rsv = parseFloat(v('--rs')), rs = Number.isFinite(rsv) ? rsv : 1;
  // Web-Schriften des gewählten Designs vor dem Zeichnen laden
  await Promise.race([Promise.all(['400', '600', fwx].flatMap(w => [FN.body, FN.disp, FN.num].map(f => document.fonts.load(`${w} 60px ${f}`).catch(() => {})))), new Promise(r => setTimeout(r, 1500))]);
  const logo = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = iconSrc('icon-192.png'); });
  const id = wo.id, row = Analytics.cur().rows.find(r => r.id === id);
  const sc = id && F('f_score') ? Analytics.score(id) : null;
  const prIds = new Set(id ? Analytics.cur().prEvents.filter(p => p.wid === id).map(p => p.exId) : []);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const withA = (col, a) => { const m = /^rgba?\(([^)]+)\)/.exec(col); if (m) { const [r, g, b] = m[1].split(',').map(n => parseFloat(n)); return `rgba(${r},${g},${b},${a})`; } if (Color.valid(col)) { const [r, g, b] = Color.rgb(col); return `rgba(${r},${g},${b},${a})`; } return col; };
  const glow = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, withA(col, a)); g.addColorStop(1, withA(col, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const rr = (X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else { x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); } };
  const font = (w, px, fam) => { x.font = `${w} ${px}px ${fam}`; };
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; };
  const shrink = (t, w, px, fam, max, min = 26) => { for (; px > min; px -= 2) { font(w, px, fam); if (x.measureText(t).width <= max) return; } };
  const spacing = s => { if ('letterSpacing' in x) x.letterSpacing = s; };
  const trophy = (X, Y, size, col) => {
    x.save(); x.translate(X, Y); x.scale(size / 24, size / 24);
    x.strokeStyle = col; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    (ICONS.trophy.match(/d="([^"]+)"/g) || []).forEach(d => x.stroke(new Path2D(d.slice(3, -1))));
    x.restore();
  };

  // Hintergrund: Design-Farbe mit weichem Licht – Glass mit Aurora, Carbon mit Karbon-Muster, Paper mit Körnung
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  if (design === 'sky') Sky.drawShare(x, W, H);   // Tag & Nacht: der Himmel von jetzt mit Sonne bzw. Mond und Bergen
  else if (design === 'glass') {
    (dark ? [[80, 120, 900, '#3a60ff', .38], [1040, 260, 760, '#a840c8', .26], [960, 1780, 900, '#10a0aa', .26], [40, 1860, 900, '#6440f0', .28]]
      : [[80, 120, 900, '#76b0ff', .55], [1040, 260, 760, '#ffa0cd', .5], [960, 1780, 900, '#96e8d0', .5], [40, 1860, 900, '#c4acff', .55]]).forEach(([cx, cy, r, col, a]) => glow(cx, cy, r, col, a));
  } else if (design === 'fokus') {
    // Fokus: schlicht – nur die Hintergrundfarbe
  } else if (design === 'plakat') {
    // Plakat: kein Leuchten – ein roter Block oben links und eine kräftige Linie wie auf einem Sportplakat
    x.fillStyle = C.accent; x.fillRect(0, 0, W, 28);
  } else {
    glow(W * .12, H * .06, 980, C.accent, dark ? .2 : .1);
    glow(W * .95, H * .92, 1100, C.accent, dark ? .13 : .07);
  }

  // Kopf: Logo, App-Name, Datum
  x.textBaseline = 'alphabetic';
  if (logo) { x.save(); rr(P, 84, 76, 76, 18); x.clip(); x.drawImage(logo, P, 84, 76, 76); x.restore(); }
  font(fwx, 40, FN.disp); x.fillStyle = C.text; x.textAlign = 'left';
  x.fillText(upper ? APP.name.toUpperCase() : APP.name, P + 96, 136);
  font('600', 32, FN.body); x.fillStyle = C.dim; x.textAlign = 'right';
  x.fillText(parseISO(wo.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), W - P, 134);

  // Titel (max. 2 Zeilen) und Datum mit Uhrzeit
  let y = 290;
  const title = woTitle(wo);
  font(fwx, 92, FN.disp); x.fillStyle = C.text; x.textAlign = 'left';
  const words = (upper ? title.toUpperCase() : title).split(/\s+/), lines = [];
  for (const wd of words) { const l = lines.length ? lines[lines.length - 1] + ' ' + wd : wd; if (lines.length && x.measureText(l).width <= W - 2 * P) lines[lines.length - 1] = l; else lines.push(wd); }
  if (lines.length > 2) lines.splice(1, lines.length, lines.slice(1).join(' '));
  lines.forEach((l, i) => { x.fillText(fit(l, W - 2 * P), P, y + i * 100); });
  y += (lines.length - 1) * 100 + 62;
  font('500', 36, FN.body); x.fillStyle = C.dim;
  x.fillText(fmtDateLong(wo.date) + (wo.startedAt ? ' · ' + new Date(wo.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ''), P, y);
  y += 40;

  // Platz vorab planen: passen alle Übungen, wird übriger Raum gleichmäßig auf die Abstände verteilt
  const items = (wo.entries || []).map(en => ({ en, b: shareBest(en) })).filter(i => i.b);
  const dense = items.length > 5;   // viele Übungen: alles etwas kompakter
  const gap = 20, th = dense ? 140 : 164, tr = Math.round(26 * rs);
  const foot = H - 150, rowH = dense ? 84 : 90, pad = 34, headH = 62, rTop = dense ? 40 : 60, rBot = dense ? 50 : 70;
  // Ring wird kleiner, damit bis zu 8 Übungen Platz haben
  const want = items.length ? pad * 2 + headH + Math.min(8, items.length) * rowH : 0;
  const R = clamp(Math.floor((foot - 30 - y - th - 40 - want - rTop - rBot) / 2), 110, 170);
  const listY0 = y + (sc ? rTop + 2 * R + rBot : 40) + th + 40;
  const fitRows = Math.max(1, Math.min(8, Math.floor((foot - 30 - listY0 - pad * 2 - headH) / rowH)));
  const shown = items.length > fitRows ? items.slice(0, fitRows - 1) : items, more = items.length - shown.length;
  const listH = items.length ? pad * 2 + headH + (shown.length + (more ? 1 : 0)) * rowH : 0;
  const extra = Math.max(0, Math.min(110, (foot - 30 - listY0 - listH) / 4));
  y += extra;

  // Score-Ring (bei 100 in Gold)
  if (sc) {
    const cx = W / 2, cy = y + rTop + R, perfect = sc.score >= 100, k = R / 170;
    x.lineCap = design === 'plakat' ? 'butt' : 'round'; x.lineWidth = Math.round(32 * Math.max(.8, k));
    x.strokeStyle = C.surf3; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    let arcCol = C.accent;
    if (perfect) { const g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#ffe9a8'); g.addColorStop(.45, '#f6bb2a'); g.addColorStop(1, '#d38800'); arcCol = g; }
    x.save(); if (design !== 'plakat' && design !== 'fokus') { x.shadowColor = withA(perfect ? '#f6bb2a' : C.accent, .55); x.shadowBlur = 34; }
    x.strokeStyle = arcCol; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.005, sc.score / 100)); x.stroke(); x.restore();
    x.textAlign = 'center'; x.fillStyle = perfect ? C.gold : C.text;
    font(fwx, Math.round(150 * k), FN.num); x.fillText(String(sc.score), cx, cy + 54 * k);
    y = cy + R + rBot;
  } else y += 40;
  y += extra;

  // Kennzahlen
  const cardio = row && row.cardioOnly;
  const tiles = cardio
    ? [...(wo.durationSec ? [['Dauer', fmtDur(wo.durationSec)]] : []), ...(row.cSec ? [['Cardio', fmtDur(row.cSec)]] : []), ...(row.cKm ? [['Distanz', fmtKm(row.cKm)]] : []), ['Übungen', String((wo.entries || []).length)]]
    : [['Dauer', fmtDur(wo.durationSec)], ['Volumen', fmtTon(row ? row.ton : 0)], ['Sätze', String(row ? row.sets : 0)],
       ...(F('f_prs') ? [['PRs', String(prIds.size)]] : row && row.avgRpe ? [['Ø RPE', nf(row.avgRpe, 1)]] : [])];
  const tw = (W - 2 * P - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([l, val], i) => {
    const tx = P + i * (tw + gap);
    if (design === 'plakat') { x.fillStyle = C.text; x.fillRect(tx, y, tw, 5); }
    else { rr(tx, y, tw, th, tr); x.fillStyle = C.surf; x.fill(); }
    if (design !== 'pure' && design !== 'glass' && design !== 'plakat') { x.lineWidth = 2; x.strokeStyle = C.border; x.stroke(); }
    const tpad = design === 'plakat' ? 0 : 24;
    x.textAlign = 'left'; font(design === 'plakat' ? '700' : '600', 27, FN.body); x.fillStyle = C.dim; x.fillText(upper || design === 'plakat' ? l.toUpperCase() : l, tx + tpad, y + th * .32);
    x.fillStyle = l === 'PRs' && +val > 0 ? C.acc : C.text; shrink(val, fwx, design === 'plakat' ? 58 : 50, FN.num, tw - 2 * tpad - (tpad ? 0 : 8)); x.fillText(val, tx + tpad, y + th * .76);
  });
  y += th + 40 + extra;

  // Übungen: bester Satz je Übung, PRs mit Pokal; was nicht passt → „+ N weitere“
  if (items.length) {
    const li = design === 'plakat' ? 0 : 36;   // Einrückung der Liste (Plakat: bündig)
    if (design === 'plakat') { x.fillStyle = C.text; x.fillRect(P, y, W - 2 * P, 5); }
    else { rr(P, y, W - 2 * P, listH, Math.round(32 * rs)); x.fillStyle = C.surf; x.fill(); }
    if (design !== 'pure' && design !== 'glass' && design !== 'plakat') { x.lineWidth = 2; x.strokeStyle = C.border; x.stroke(); }
    let ry = y + pad;
    x.textAlign = 'left'; font('700', 27, FN.body); spacing('4px'); x.fillStyle = C.faint;
    x.fillText('ÜBUNGEN', P + li, ry + 34); spacing('0px');
    x.textAlign = 'right'; font('600', 27, FN.body); x.fillText(`${items.length} ${items.length === 1 ? 'Übung' : 'Übungen'}`, W - P - li, ry + 34);
    ry += headH;
    shown.forEach(({ en, b }, i) => {
      if (i) { x.fillStyle = C.border; x.fillRect(P + li, ry, W - 2 * P - 2 * li, 2); }
      const pr = prIds.has(en.exerciseId);
      x.textAlign = 'right'; font(fwx, 38, FN.num); const bw = Math.min(x.measureText(b.best).width, 420);
      x.fillStyle = pr ? C.acc : C.text; x.fillText(fit(b.best, 420), W - P - li, ry + rowH * .62);
      if (pr) trophy(W - P - li - bw - 50, ry + rowH * .62 - 32, 36, C.acc);
      x.textAlign = 'left'; font('600', 38, FN.body); x.fillStyle = C.text;
      x.fillText(fit(Ex.entryName(en), W - 2 * P - 2 * li - bw - (pr ? 72 : 30)), P + li, ry + rowH * .49);
      font('500', 27, FN.body); x.fillStyle = C.dim; x.fillText(b.sub, P + li, ry + rowH * .87);
      ry += rowH;
    });
    if (more) { x.fillStyle = C.border; x.fillRect(P + li, ry, W - 2 * P - 2 * li, 2); x.textAlign = 'left'; font('600', 32, FN.body); x.fillStyle = C.dim; x.fillText(`+ ${more} weitere ${more === 1 ? 'Übung' : 'Übungen'}`, P + li, ry + rowH * .62); }
  }

  // Fuß: „getrackt mit Trainio“
  x.textAlign = 'center'; font('600', 30, FN.body); x.fillStyle = design === 'sky' ? C.dim : C.faint;   // Tag & Nacht: über den Bergen
  x.fillText(`getrackt mit ${APP.name}`, W / 2, H - 82);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/png'));
}
