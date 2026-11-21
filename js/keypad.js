/* ==========================================================================
   Eigene Zahlentastatur im Workout (nur auf Touch-Geräten)
   Statt der Handy-Tastatur: große Ziffern, ± passend zum Feld und eine Taste, die
   Gewicht → Wdh. → „Abhaken“ durchgeht. Die Felder bleiben echte Eingabefelder
   (inputmode="none"), alle Änderungen laufen über dieselben Inputs-Handler wie beim Tippen.
   ========================================================================== */
const KP_FIELDS = ['setW', 'setB', 'setBR', 'cdDur', 'cdKm', 'cdLvl'];
const KP_SEL = KP_FIELDS.map(f => `[data-in="${f}"]`).join(',');

const Keypad = (() => {
  let root = null, target = null, key = null, fresh = false, own = false, swallow = 0, holdT = 0, padT = 0, quiet = false;
  // Wo der Finger zuletzt aufgesetzt hat: Ein Tipp aufs Feld öffnet die Tastatur – liegt sie danach unter dem Finger,
  // darf der Klick desselben Tipps weder eine Taste drücken noch die Tastatur als „daneben getippt“ schließen
  let downEl = null, downAt = 0;
  const sameTap = () => Date.now() - downAt < 700;

  const on = () => S().numpad !== false && matchMedia('(pointer: coarse)').matches;
  const isOpen = () => !!root && root.classList.contains('open');
  const eligible = el => !!el && el.matches && el.matches(KP_SEL) && el.inputMode === 'none' && !!el.closest('#tab-training');
  const typeOf = ei => { const w = Workout.cur(), en = w && w.entries[ei]; return en ? Ex.type(Ex.get(en.exerciseId)) : 'kg'; };

  /** Was ein Feld darf: Komma, Länge, ± und Beschriftung */
  function spec(f, type) {
    const sec = type === 'sec';
    switch (f) {
      case 'setW': { const st = S().weightSteps || 2.5; return { label: type === 'kg' ? 'Gewicht' : 'Zusatzgewicht', sep: ',', dec: 2, max: 7, step: nf(st, 2), stepF: 'w' }; }
      case 'setB': return { label: sec ? 'Sekunden' : 'Wdh.', sep: '', max: sec ? 4 : 3, step: sec ? '5 s' : '1', stepF: 'b' };
      case 'setBR': return { label: sec ? 'Sekunden rechts' : 'Wdh. rechts', sep: '', max: sec ? 4 : 3, step: sec ? '5 s' : '1', stepF: 'bR' };
      case 'cdDur': return { label: 'Dauer (min)', sep: ':', dec: 2, max: 6, step: '1 min', own: (v, d) => durIn(Math.max(0, (parseDur(v) || 0) + d * 60)) };
      case 'cdKm': return { label: 'Distanz (km)', sep: ',', dec: 3, max: 7, step: '0,5', own: (v, d) => numOut(Math.max(0, (parseNum(v) || 0) + d * 0.5)) };
      default: return { label: 'Stufe', sep: ',', dec: 1, max: 5, step: '1', own: (v, d) => numOut(Math.max(0, (parseNum(v) || 0) + d)) };
    }
  }
  const numOut = n => String(round(n, 3)).replace('.', ',');

  /** Alle Tastatur-Felder desselben Satzes (Liste: Zeile, Fokus: großer Satz-Bereich) in Bildschirm-Reihenfolge */
  const group = el => { const c = el.closest('.set-row, .fc-cur'); return c ? $$(KP_SEL, c).filter(eligible) : [el]; };
  const setOf = el => { const w = Workout.cur(), en = w && w.entries[+el.dataset.ei]; return en ? en.sets[+el.dataset.si] : null; };

  function build() {
    root = document.createElement('div');
    root.id = 'numpad';
    root.className = 'numpad';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Zahlentastatur');
    const k = (id, txt, cls = '', lab = '') => `<button type="button" tabindex="-1" class="kp-k ${cls}" data-k="${id}" ${lab ? `aria-label="${lab}"` : ''}>${txt}</button>`;
    root.innerHTML = `<div class="kp-bar"><span class="kp-what"></span><button type="button" tabindex="-1" class="kp-close" data-k="close" aria-label="Tastatur schließen">${icon('chevD')}</button></div>
      <div class="kp-grid">
        ${k(1, 1)}${k(2, 2)}${k(3, 3)}${k('plus', '', 'kp-pm')}
        ${k(4, 4)}${k(5, 5)}${k(6, 6)}${k('minus', '', 'kp-pm')}
        ${k(7, 7)}${k(8, 8)}${k(9, 9)}${k('go', '', 'kp-go')}
        ${k('sep', ',', 'kp-dim')}${k(0, 0)}${k('back', icon('backspace'), 'kp-dim', 'Löschen (gedrückt halten: alles löschen)')}
      </div>`;
    document.body.appendChild(root);
    // Tasten nehmen dem Feld nie den Fokus weg
    ['pointerdown', 'mousedown'].forEach(t => root.addEventListener(t, e => { if (e.target.closest('.kp-k, .kp-close')) e.preventDefault(); }));
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-k]');
      if (!b || b.disabled) return;
      if (Date.now() < swallow) return;
      if (sameTap() && downEl && !root.contains(downEl)) return;
      press(b.dataset.k);
    });
    // ⌫ gedrückt halten → ganzes Feld leeren
    root.addEventListener('pointerdown', e => {
      if (!e.target.closest('[data-k="back"]')) return;
      clearTimeout(holdT);
      holdT = setTimeout(() => { swallow = Date.now() + 600; write(''); vibrate(15); }, 480);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => root.addEventListener(t, () => clearTimeout(holdT)));
    // Nach unten wischen schließt
    let y0 = null;
    root.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchmove', e => {
      if (y0 != null && e.touches[0].clientY - y0 > 48) { y0 = null; clearTimeout(holdT); swallow = Date.now() + 500; close(); }
    }, { passive: true });
    root.addEventListener('touchend', () => { y0 = null; }, { passive: true });
  }

  /** Feld neu suchen, falls die Ansicht inzwischen neu gezeichnet wurde */
  function resolve() {
    if (target && target.isConnected && target.offsetParent) return target;
    if (!key) return null;
    const q = `[data-in="${key.f}"][data-ei="${key.ei}"][data-si="${key.si}"]`;
    const el = $$(`#tab-training ${q}`).find(i => eligible(i) && i.offsetParent);
    return el || null;
  }

  function attach(el, { reveal = true } = {}) {
    if (!root) build();
    if (target && target !== el) target.classList.remove('kp-target');
    target = el;
    key = { f: el.dataset.in, ei: +el.dataset.ei, si: +el.dataset.si };
    fresh = true;
    el.classList.add('kp-target');
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    const wasOpen = isOpen();
    clearTimeout(padT);
    root.classList.add('open');
    document.body.classList.add('kp-open');
    document.documentElement.style.setProperty('--kp-h', root.offsetHeight + 'px');
    paint();
    if (reveal) requestAnimationFrame(() => show(el, wasOpen));
  }

  function close() {
    if (!root || !isOpen()) return;
    root.classList.remove('open');
    // Platz unten und Pausen-Leiste erst kurz danach zurücksetzen: sonst verrutscht die Seite zwischen
    // Antippen und Klick, und der Tipp (z. B. auf den Haken) landet daneben
    clearTimeout(padT);
    padT = setTimeout(() => { if (!isOpen()) document.body.classList.remove('kp-open'); }, 350);
    if (target) {
      target.classList.remove('kp-target');
      if (document.activeElement === target) target.blur();
    }
    target = null; key = null;
  }

  /** Beschriftung: was wird bearbeitet, ± und die große Taste passend zum Feld */
  function paint() {
    const el = target; if (!el) return;
    const t = typeOf(key.ei), sp = spec(key.f, t);
    const s = setOf(el), w = Workout.cur(), en = w && w.entries[key.ei];
    let what = sp.label;
    if (s && en) {
      const no = en.sets.slice(0, key.si + 1).filter(x => !x.warmup).length;
      what = `${t === 'cardio' ? 'Abschnitt ' + (key.si + 1) : s.warmup ? 'Aufwärmsatz' : 'Satz ' + no} · <b>${esc(sp.label)}</b>`;
    }
    $('.kp-what', root).innerHTML = what;
    const sep = $('[data-k="sep"]', root);
    sep.textContent = sp.sep; sep.disabled = !sp.sep; sep.setAttribute('aria-label', sp.sep === ':' ? 'Doppelpunkt' : sp.sep ? 'Komma' : '');
    const pl = $('[data-k="plus"]', root), mi = $('[data-k="minus"]', root);
    pl.textContent = '+' + sp.step; mi.textContent = '−' + sp.step;
    pl.setAttribute('aria-label', `${sp.label} plus ${sp.step}`); mi.setAttribute('aria-label', `${sp.label} minus ${sp.step}`);
    const go = $('[data-k="go"]', root), g = group(el), last = g.indexOf(el) === g.length - 1;
    const mode = !last ? 'next' : s && !s.done ? 'done' : 'close';
    go.dataset.mode = mode;
    go.innerHTML = mode === 'next' ? 'Weiter' : mode === 'done' ? `${icon('check')}<span>Abhaken</span>` : 'OK';
    go.setAttribute('aria-label', mode === 'next' ? 'Weiter zum nächsten Feld' : mode === 'done' ? 'Satz abhaken' : 'Tastatur schließen');
  }

  /** Feld sichtbar halten: unter dem Workout-Kopf, über Pausen-Leiste und Tastatur */
  function show(el, smooth) {
    const box = el.closest('.set-row, .fc-steppers') || el;
    const r = box.getBoundingClientRect();
    const head = $('#tab-training .wo-head');
    const top = (head ? head.getBoundingClientRect().bottom : 0) + 8;
    const dock = $('.rest-dock:not(.leaving)');
    const bottom = (dock && dock.offsetParent ? dock.getBoundingClientRect().top : root.getBoundingClientRect().top) - 10;
    let dy = 0;
    if (r.bottom > bottom) dy = r.bottom - bottom;
    if (r.top - dy < top) dy = r.top - top;
    if (Math.abs(dy) > 1) Scroll.to(Scroll.y + dy, smooth && S().motion === 'full');
  }

  /** Wert setzen und wie beim Tippen melden (Inputs-Handler speichern und gleichen andere Felder ab) */
  function write(v) {
    const el = resolve(); if (!el) return close();
    target = el;
    el.value = v;
    own = true;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } finally { own = false; }
    try { el.setSelectionRange(v.length, v.length); } catch (e) {}
  }

  function typeChar(ch) {
    const el = resolve(); if (!el) return close();
    const sp = spec(key.f, typeOf(key.ei));
    let v = fresh ? '' : el.value;
    fresh = false;
    if (ch === 'sep') {
      if (!sp.sep || v.includes(sp.sep)) return;
      v = (v || '0') + sp.sep;
    } else {
      if (sp.sep) {
        const i = v.indexOf(sp.sep);
        if (i >= 0 && v.length - i - 1 >= sp.dec) return;
      }
      v = v === '0' ? ch : v + ch;
    }
    if (v.length > sp.max) return;
    write(v);
  }

  function step(d) {
    const el = resolve(); if (!el) return close();
    const sp = spec(key.f, typeOf(key.ei));
    if (sp.stepF) Actions.step({ dataset: { ei: String(key.ei), si: String(key.si), f: sp.stepF, d: String(d) }, parentElement: null });
    else { write(sp.own(el.value || el.placeholder, d)); vibrate(8); }
    fresh = true;   // ein Tipp auf eine Ziffer danach ersetzt den neuen Wert
    paint();
  }

  function go() {
    const el = resolve(); if (!el) return close();
    const g = group(el), i = g.indexOf(el);
    if (i < g.length - 1) { attach(g[i + 1]); return; }
    const s = setOf(el);
    if (!s || s.done) { close(); return; }
    const { ei, si } = key;
    // Während des Abhakens nicht zurück ins alte Feld springen (das würde den Satz wieder auswählen)
    quiet = true;
    try { Actions.setDone({ dataset: { ei: String(ei), si: String(si) } }); } finally { quiet = false; }
    const w = Workout.cur(), now = w && w.entries[ei] && w.entries[ei].sets[si];
    if (!now || !now.done) return;   // Pflichtfeld fehlt: setDone hat bereits Hinweis gezeigt und das Feld gewählt
    // Gleiche Übung geht weiter → gleich im nächsten Satz weitertippen, sonst Tastatur zu
    const nx = w.sel;
    const nextEl = nx && nx.e === ei && nx.s >= 0 ? $$(`#tab-training [data-ei="${nx.e}"][data-si="${nx.s}"]`).find(n => eligible(n) && n.offsetParent) : null;
    if (nextEl) attach(nextEl);
    else close();
  }

  function press(k) {
    if (k === 'close') return close();
    if (!resolve()) return close();
    if (/^\d$/.test(k)) typeChar(k);
    else if (k === 'sep') typeChar('sep');
    else if (k === 'back') { const el = resolve(); fresh = false; write(el.value.slice(0, -1)); }
    else if (k === 'plus' || k === 'minus') step(k === 'plus' ? 1 : -1);
    else if (k === 'go') return go();
    if (k !== 'plus' && k !== 'minus') vibrate(5);
    if (isOpen() && target) { target.classList.add('kp-target'); if (document.activeElement !== target) target.focus({ preventScroll: true }); }
  }

  // Feld angetippt → Tastatur auf; anderes Feld/Fenster → zu
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (root && root.contains(el)) return;
    if (eligible(el)) { if (el !== target || !isOpen()) attach(el); return; }
    close();
  });
  document.addEventListener('pointerdown', e => { downEl = e.target; downAt = Date.now(); }, true);
  // Tipp außerhalb von Tastatur und Feld schließt (Scrollen nicht – das löst keinen Klick aus)
  document.addEventListener('click', e => {
    // nur echte Tipps – der unsichtbare Schalter für das iPhone-Tippgefühl (vibrate) klickt per Skript
    if (!e.isTrusted || !isOpen() || (root && root.contains(e.target))) return;
    if (eligible(e.target) || (sameTap() && (eligible(downEl) || (root && root.contains(downEl))))) return;
    close();
  }, true);
  // Echte Tastatur (Tablet) tippt normal weiter – dann nichts mehr ersetzen
  document.addEventListener('input', e => { if (!own && e.target === target) fresh = false; }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });
  window.addEventListener('popstate', close);
  window.addEventListener('resize', debounce(() => { if (isOpen()) document.documentElement.style.setProperty('--kp-h', root.offsetHeight + 'px'); }, 150));

  return {
    on, close, isOpen,
    /** Nach dem Neu-Zeichnen des Workouts: am selben Feld bleiben (oder schließen, wenn es weg ist) */
    sync() {
      if (!isOpen()) return;
      const el = resolve();
      if (!el) return close();
      if (el !== target) { target = el; el.classList.add('kp-target'); if (!quiet) el.focus({ preventScroll: true }); }
      paint();
    },
    /** Für Tests: Taste drücken */
    press,
    get target() { return target; }
  };
})();

/** inputmode für Zahlenfelder im Workout: mit eigener Tastatur „none“ (Handy-Tastatur bleibt zu) */
const kpIM = mode => Keypad.on() ? 'none' : mode;
