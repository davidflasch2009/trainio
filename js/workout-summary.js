/* Trainio – Aktives Workout: Zusammenfassung und Score
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ---------- Session-Zusammenfassung ---------- */
/* ---------- Workout-Score: Ring (füllt sich, Zahl zählt hoch) + Aufschlüsselung ---------- */
function scoreRingHtml(sc, small = false) {
  const R = 52, L = 2 * Math.PI * R;
  return `<button type="button" class="score-ring ${small ? 'sm' : ''}" data-act="scoreMore" data-score="${sc.score}" aria-expanded="false" aria-label="Workout-Score ${sc.score} von 100 – Aufschlüsselung zeigen">
    <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${R}" fill="none" stroke-width="10"/><circle class="ring-fg" cx="60" cy="60" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${L}" style="stroke-dashoffset:${L}" data-len="${L}"/></svg>
    <div class="score-mid"><b class="score-num">${sc.score}</b></div></button>`;
}
/** Score-Ring antippen: Aufschlüsselung (Fortschritt, Erledigt, Anstrengung, e1RM-Bonus) auf- und zuklappen */
Actions.scoreMore = el => {
  const box = el.closest('.modal') || document, more = $('.score-more', box);
  if (!more) return;
  more.hidden = !more.hidden;
  // Ring und Pfeil-Knopf darunter zeigen denselben Zustand
  $$('[data-act="scoreMore"]', box).forEach(b => { b.setAttribute('aria-expanded', String(!more.hidden)); b.classList.toggle('open', !more.hidden); });
  if (!more.hidden) fx(more, 'fx-open');
};
function scoreBreakdownHtml(sc) {
  const W = Analytics.SCORE_W;
  const item = (k, l, why) => sc.parts[k] == null
    ? `<div class="sb-item na"><span>${l}</span><b>–</b><small>${why}</small></div>`
    : `<div class="sb-item"><span>${l}</span><b>${Math.round(sc.parts[k] * W[k])}<small> / ${W[k]}</small></b><i style="--p:${Math.round(sc.parts[k] * 100)}%"></i></div>`;
  return `<button type="button" class="score-toggle" data-act="scoreMore" aria-expanded="false" aria-label="Score-Aufschlüsselung zeigen">${icon('chevD')}</button>
    <div class="score-more" hidden><div class="score-bd">${item('prog', 'Fortschritt', 'keine Vergleichswerte')}${item('done', 'Erledigt', '')}${item('rpe', 'Anstrengung', 'kein RPE eingetragen')}
    <div class="sb-item"><span>e1RM-Bonus</span><b>${sc.bonus ? '+' + sc.bonus : '0'}</b><small>${sc.prs ? `${sc.prs} ${sc.prs === 1 ? 'neuer e1RM-Rekord' : 'neue e1RM-Rekorde'}` : 'kein neuer e1RM-Rekord'}</small></div></div>
    ${sc.scaled ? '<p class="tiny faint center mt-8">Fehlende Teile werden auf 100 hochgerechnet.</p>' : ''}</div>`;
}
/** Ring von leer auf den Score füllen, Zahl im gleichen Tempo hochzählen.
 *  Je höher der Score, desto länger dauert es und desto stärker bremst es am Ende ab.
 *  celebrate: Abschluss-Moment direkt nach dem Workout (bei 100 mit Konfetti & Vibration) */
function animScoreRing(root, delay = 250, celebrate = false) {
  const r = $('.score-ring', root); if (!r) return;
  const score = +r.dataset.score, fg = $('.ring-fg', r), num = $('.score-num', r), L = +fg.dataset.len;
  const draw = v => { fg.style.strokeDashoffset = String(L * (1 - v / 100)); };
  const finish = () => { draw(score); num.textContent = score; if (score >= 100) perfectScore(r, celebrate); };
  fg.style.transition = 'none';
  if (!motionFull() || !(score > 0)) { finish(); return; }
  const f = score / 100, dur = 1000 + 2400 * f * f, k = 2.2 + 1.3 * f;
  num.textContent = '0'; draw(0);
  let t0 = null;
  const step = now => {
    if (!r.isConnected) return;
    if (t0 == null) t0 = now + delay;
    const p = Math.max(0, Math.min(1, (now - t0) / dur));
    if (p >= 1) { finish(); return; }
    const v = score * (1 - Math.pow(1 - p, k));
    draw(v); num.textContent = Math.floor(v);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
/** Score 100: goldener Ring mit Lichtimpuls – direkt nach dem Workout zusätzlich Konfetti & Vibration */
function perfectScore(r, celebrate) {
  if (r.classList.contains('perfect')) return;
  const id = 'sg' + Math.random().toString(36).slice(2, 8), anim = motionFull();
  $('svg', r).insertAdjacentHTML('afterbegin', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".45" stop-color="#f6bb2a"/><stop offset="1" stop-color="#d38800"/></linearGradient></defs>`);
  $('.ring-fg', r).style.stroke = `url(#${id})`;
  r.classList.add('perfect');
  if (anim) r.classList.add('pop');
  if (!celebrate) return;
  const b = r.getBoundingClientRect();
  confetti({ x: b.left + b.width / 2, y: b.top + b.height / 2, colors: ['#ffe9a8', '#f6bb2a', '#d38800', '#ffffff', cssVar('--accent')] });
  vibrate([30, 60, 90]);
}
function showSummary({ id, doc, prs }) {
  const sc = F('f_score') ? Analytics.score(id) : null;
  const goalsHit = checkGoals(doc);
  const isC = e => Ex.type(Ex.get(e.exerciseId)) === 'cardio';
  const done = doc.entries.filter(e => !isC(e)).flatMap(e => e.sets.filter(s => s.done && !s.warmup));
  const ct = cardioTotals(doc.entries.filter(isC).flatMap(e => e.sets));
  const vol = sum(done.map(setVol));
  const rpes = done.filter(s => s.rpe).map(s => s.rpe);
  const real = F('f_prs') ? prs.filter(p => !p.first) : [];
  const firsts = F('f_prs') ? prs.filter(p => p.first && !p.fix) : [], fixes = prs.filter(p => p.fix);
  // Vergleich mit dem letzten gleichen Plan-Tag
  const prevSame = Analytics.cur().rows.filter(r => r.id !== id && ((doc.planId && r.planId === doc.planId && r.day === doc.planDayName) || (!doc.planId && r.name === doc.name))).pop();
  const m = Modal.open({
    title: 'Workout gespeichert',
    body: `<div class="center" style="padding:14px 0 4px">
        ${sc ? scoreRingHtml(sc) : `<div class="sum-badge sum-draw">${icon(real.length ? 'trophy' : 'checkCircle')}</div>`}
        <h2 class="mt-8">${esc(woTitle(doc))}</h2>
        <p class="dim">${esc(fmtDateLong(doc.date))}</p>
      </div>
      ${sc ? scoreBreakdownHtml(sc) : ''}
      ${prTiles([
        ['Dauer', n => n === 3 ? fmtMin(doc.durationSec) : fmtDur(doc.durationSec)],
        ...(done.length || !ct.n ? [['Volumen', fmtTon(vol), prevSame ? `<em>${deltaHtml(vol, prevSame.ton)}</em>` : ''], ['Sätze', done.length], ...(rpes.length ? [['Ø RPE', nf(avg(rpes), 1)]] : [])] : []),
        ...(ct.n ? [['Cardio', fmtDur(ct.sec)], ...(ct.km ? [['Distanz', fmtKm(ct.km)]] : []), ...(ct.kmh ? [['Ø Tempo', fmtKmh(ct.kmh)]] : [])] : [])
      ], 'sum-tiles mt-16 fx-stagger')}
      ${real.length ? `<h4 class="mt-24 mb-8">Neue PRs</h4><div class="list sum-prs">${real.map((p, i) => `<div class="list-item pr-shine" style="--i:${i}"><span class="li-icon" style="color:var(--accent-text)">${icon('trophy')}</span><span class="li-main"><span class="li-title">${esc(PR.label(p))}</span><div class="li-sub">${[p.imp.weight && 'Gewicht', p.imp.e1rm && 'e1RM', p.imp.volume && 'Volumen', p.imp.reps && 'Wiederholungen', p.imp.dur && 'Längste Einheit', p.imp.km && 'Weiteste Distanz', p.imp.kmh && 'Schnellstes Tempo'].filter(Boolean).join(' · ')}</div></span></div>`).join('')}</div>` : ''}
      ${goalsHit.length ? `<h4 class="mt-24 mb-8">Ziel erreicht</h4><div class="list">${goalsHit.map(g => `<div class="list-item am-featured fx-up"><span class="li-icon">${icon('target')}</span><span class="li-main"><span class="li-title">${esc(Ex.name(g.exId))} ${goalLabel(g)}</span><div class="li-sub">${goalType(g) === 'wr' ? `Heute geschafft: ${fmtW(g.best)} × ${g.reps}+` : `Geschätztes 1RM heute: ${fmtW(g.best, 1)}`}</div></span></div>`).join('')}</div>` : ''}
      ${fixes.length ? `<p class="dim small mt-16">${icon('refresh').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} Form-Fix – neue Startwerte für: ${fixes.map(p => esc(p.name)).join(', ')}. PRs zählen ab heute neu.</p>` : ''}
      ${firsts.length ? `<p class="dim small mt-16">Erste Bestwerte gesetzt für: ${firsts.map(p => esc(p.name)).join(', ')}</p>` : ''}`,
    foot: `<button class="btn btn-secondary" data-x="share" aria-label="Teilen" style="flex:0 0 auto">${icon('share')}</button><button class="btn btn-secondary" data-x="tpl">${icon('copy')} Als Workout</button><button class="btn btn-primary" data-x="ok">Fertig</button>`
  });
  // Abschluss-Moment: Haken zeichnet sich, Zahlen zählen hoch, PRs erscheinen nacheinander mit Glanz
  $$('.sum-draw svg *', m.el).forEach(n => n.setAttribute('pathLength', '1'));
  animScoreRing(m.el, 250, true);
  countUp($$('.pr-box b', m.el), 900, 150);
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'share') shareWorkout({ ...doc, id });
    else if (b.dataset.x === 'tpl') saveAsTemplate(doc.entries, woTitle(doc));
    else m.close();
  });
  if (goalsHit.length) {
    confetti();
    goalsHit.forEach((g, i) => setTimeout(() => toast(`Ziel erreicht: ${Ex.name(g.exId)} ${goalLabel(g)}`, 'pr'), 300 + i * 900));
  }
  if (real.length) {
    if (!goalsHit.length) confetti();
    real.slice(0, 4).forEach((p, i) => setTimeout(() => toast(`Neuer PR: ${PR.label(p)}`, 'pr'), 500 + i * 900));
  }
}
