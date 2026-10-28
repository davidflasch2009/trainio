/* Trainio – UI-Kern: Toasts, Dialoge, Navigation, Designs
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   5. UI-Kern: Toasts, Modals, Dialoge, Popover, Navigation, Theme
   ========================================================================== */
const UI = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(LS.ui)) || {}; } catch (e) {}
  return Object.assign({
    tab: 'start', trainSub: 'plans', progSub: 'overview', period: '3m', customFrom: null, customTo: null,
    exCat: 'all', exEq: 'all', exSort: 'az', kraftEx: 'ex_bankdruecken', volScope: 'total', volEx: 'ex_bankdruecken',
    volMuscle: 'Brust', muscleSel: 'Brust', kraftScope: 'total', kraftMuscle: 'Brust', calMonth: null, exChart: 'e1rm'
  }, s, { exQ: '' });
})();
const saveUI = debounce(() => { try { localStorage.setItem(LS.ui, JSON.stringify(UI)); } catch (e) {} }, 250);

/* ---------- Scrollen: nur die Inhaltsspalte scrollt, nie das Dokument (siehe CSS „App-Rahmen") ---------- */
const Scroll = (() => {
  const el = document.querySelector('.main-col');
  return {
    el,
    get y() { return el.scrollTop; },
    to(top, smooth = false) { el.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' }); },
    /** Scroll-Position, bei der ein Element ganz oben steht */
    topOf(node) { return node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop; }
  };
})();
/* iPhone: Öffnet sich die Tastatur, schiebt iOS das ganze Dokument hoch – und vergisst manchmal, es danach
   zurückzuschieben (Leisten stehen dann mitten im Bild). Ohne aktives Eingabefeld gehört das Dokument immer auf 0. */
const typing = () => { const a = document.activeElement; return !!a && a.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable="true"]'); };
function resetViewport() {
  const vv = window.visualViewport;
  if (typing() || (vv && vv.scale > 1.01)) return;   // beim Tippen bzw. Hineinzoomen nicht dazwischenfunken
  if (window.scrollY || window.scrollX || (vv && Math.abs(vv.offsetTop) > 0.5)) window.scrollTo(0, 0);
}
window.addEventListener('scroll', resetViewport, { passive: true });
document.addEventListener('focusout', () => setTimeout(resetViewport, 80));
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(resetViewport, 80));

/* ---------- Toasts ---------- */
/* Meldungs-Gruppen, einzeln schaltbar unter Mehr → Meldungen. Fehler/Warnungen, Meldungen mit Knopf (z. B.
   „Rückgängig") und cat: 'always' kommen immer. Ohne Angabe: 'pr' bei PR-Toasts, sonst 'confirm'. */
const TOAST_CATS = [
  ['confirm', 'Bestätigungen', '„Gespeichert", „Gelöscht", „Dupliziert" …'],
  ['workout', 'Workout-Ablauf', '„… gestartet", „Übung abgeschlossen", „Pause vorbei" …'],
  ['pr', 'PRs & Ziele', '„Neuer PR", „Ziel erreicht"'],
  ['sync', 'Verbindung & Sync', '„Offline", „Wieder online", Firebase'],
  ['update', 'App-Updates', '„Neue Version verfügbar"']
];
function toastCat(type, opts) {
  if (opts.cat) return opts.cat;
  if (type === 'error' || type === 'warn' || opts.action) return 'always';
  return type === 'pr' ? 'pr' : 'confirm';
}
function toast(msg, type = 'info', opts = {}) {
  const root = $('#toastRoot');
  if (!root) return;
  const cat = toastCat(type, opts);
  if (cat !== 'always' && S()['toast_' + cat] === false) return;
  const ic = { success: 'checkCircle', error: 'xCircle', warn: 'warn', info: 'info', pr: 'trophy' }[type] || 'info';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon(ic, 't-ic')}<span>${esc(msg)}</span>${opts.action ? `<button class="t-act">${esc(opts.action.label)}</button>` : ''}`;
  root.appendChild(el);
  while (root.children.length > 3) root.firstElementChild.remove();
  const dur = opts.duration || (type === 'error' ? 5500 : type === 'pr' ? 5000 : 2800);
  const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), 220); };
  const t = setTimeout(remove, dur);
  let swiped = false;
  el.addEventListener('click', e => {
    if (swiped) return;
    if (e.target.closest('.t-act') && opts.action) opts.action.fn();
    clearTimeout(t); remove();
  });
  // Wegwischen: nach oben oder zur Seite; die Meldung folgt dem Finger, kurzes Ziehen federt zurück
  let x0 = null, y0 = 0, dx = 0, dy = 0;
  el.addEventListener('touchstart', e => { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = dy = 0; el.style.transition = 'none'; }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (x0 == null) return;
    dx = e.touches[0].clientX - x0; dy = Math.min(0, e.touches[0].clientY - y0);
    if (Math.abs(dx) < 4 && dy > -4) return;
    e.preventDefault();
    const side = Math.abs(dx) > Math.abs(dy);
    el.style.transform = side ? `translateX(${dx}px)` : `translateY(${dy}px)`;
    el.style.opacity = String(1 - Math.min(.8, (side ? Math.abs(dx) / el.offsetWidth : -dy / 60)));
  }, { passive: false });
  const end = () => {
    if (x0 == null) return;
    x0 = null;
    const side = Math.abs(dx) > Math.abs(dy), far = side ? Math.abs(dx) > Math.min(110, el.offsetWidth * .3) : dy < -28;
    el.style.transition = 'transform .2s var(--ease-out), opacity .2s';
    if (far) {
      swiped = true; clearTimeout(t);
      el.style.transform = side ? `translateX(${Math.sign(dx) * (el.offsetWidth + 40)}px)` : 'translateY(-140%)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    } else if (Math.abs(dx) > 4 || dy < -4) {
      swiped = true; setTimeout(() => { swiped = false; }, 60);   // kein Antipp-Schließen nach kurzem Ziehen
      el.style.transform = ''; el.style.opacity = '';
    }
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

/* ---------- Fehlerprotokoll: Fehler sichtbar machen statt still zu verschlucken ---------- */
const ErrLog = (() => {
  // Netzwerk/Offline/Cloud-Abbrüche: nur protokollieren, nicht als Fehler einblenden
  const QUIET = /network|offline|failed to fetch|load failed|unavailable|deadline|ResizeObserver|Script error|client is offline|Diagramme brauchen|Script konnte nicht geladen/i;
  let lastToast = 0;
  const read = () => { try { return JSON.parse(localStorage.getItem(LS.errors)) || []; } catch (e) { return []; } };
  function add(err, where = '') {
    const msg = String((err && (err.message || err.reason)) || err || 'Unbekannter Fehler').slice(0, 300);
    const stack = String((err && err.stack) || '').split('\n').slice(0, 6).map(l => l.trim().replace(/https?:\/\/[^\s)]+\//g, '')).join('\n');
    let tab = ''; try { tab = App.tab || ''; } catch (x) {}   // App existiert beim Start evtl. noch nicht
    const e = { t: Date.now(), msg, stack, where, v: APP.version, tab };
    try { const l = read(); l.push(e); localStorage.setItem(LS.errors, JSON.stringify(l.slice(-30))); } catch (x) {}
    console.error('[Trainio]', where, err);
    if (QUIET.test(msg) || Date.now() - lastToast < 4000) return;
    lastToast = Date.now();
    toast('Da ist etwas schiefgelaufen: ' + msg.slice(0, 90), 'error', { duration: 7000, action: { label: 'Details', fn: () => Actions.openErrLog() } });
  }
  function report() {
    const l = read();
    let env = '';
    try { env = `Bildschirm ${screen.width}×${screen.height} · ${isStandalone() ? 'als App' : 'im Browser'} · ${Auth.user() ? 'angemeldet' : 'nicht angemeldet'} · Design ${S().design}`; } catch (x) {}
    return [`${APP.name} v${APP.version} · ${new Date().toLocaleString('de-DE')}`, navigator.userAgent, env, '',
      ...l.slice().reverse().map(e => `[${new Date(e.t).toLocaleString('de-DE')}] v${e.v} · ${e.where || '–'} · Tab ${e.tab || '–'}\n${e.msg}${e.stack ? '\n' + e.stack : ''}`)].join('\n');
  }
  return { add, all: read, clear: () => { try { localStorage.removeItem(LS.errors); } catch (e) {} }, report };
})();
window.addEventListener('error', e => ErrLog.add(e.error || e.message, 'Fehler'));
window.addEventListener('unhandledrejection', e => ErrLog.add(e.reason, 'Aktion'));

/* ---------- Modals (Stack-fähig) ---------- */
const Modal = (() => {
  const stack = [];
  /** info: Erklärung als (i) neben dem Titel statt als Text im Fenster */
  function open({ title = '', info = '', body = '', foot = '', size = '', onClose = null, cls = '' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal-backdrop"></div>
      <div class="modal ${size} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h2>${esc(title)}${info ? infoBtn(info) : ''}</h2><button class="btn-icon" data-modal-close aria-label="Schließen">${icon('x')}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    $('#modalRoot').appendChild(wrap);
    document.body.classList.add('modal-open');
    const m = {
      wrap, el: $('.modal', wrap), body: $('.modal-body', wrap), onClose, closed: false,
      close: v => close(m, v),
      /** schließen, weil es woanders weitergeht (löschen, bearbeiten, starten …) */
      dismiss: v => close(m, v),
      setBody(html) { m.body.innerHTML = html; },
      setTitle(t) { $('.modal-head h2', wrap).textContent = t; },
      setFoot(html) {
        let f = $('.modal-foot', wrap);
        if (!html) { if (f) f.remove(); return; }
        if (!f) { f = document.createElement('div'); f.className = 'modal-foot'; m.el.appendChild(f); }
        f.innerHTML = html;
      }
    };
    m.alert = /\balert\b/.test(cls);
    $('.modal-backdrop', wrap).addEventListener('click', () => close(m));
    $('[data-modal-close]', wrap).addEventListener('click', () => close(m));
    if (!m.alert) sheetSwipe(m);
    stack.push(m);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    return m;
  }
  /** Bottom-Sheet (Handy) wegwischen: am Kopf jederzeit, im Inhalt nur ganz oben gescrollt. Folgt dem Finger 1:1,
      nach oben nur mit Widerstand. Beim Loslassen zählt die Geschwindigkeit der letzten Bewegung: schnell nach unten
      oder weit genug → das Fenster gleitet mit Fingertempo hinaus, sonst federt es zurück. */
  const SPRING_BACK = CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? 'linear(0, 0.0233 2.8%, 0.083 5.6%, 0.1661 8.3%, 0.2621 11.1%, 0.3631 13.9%, 0.4632 16.7%, 0.5583 19.4%, 0.6456 22.2%, 0.7235 25%, 0.7912 27.8%, 0.8487 30.6%, 0.8964 33.3%, 0.9349 36.1%, 0.9653 38.9%, 0.9885 41.7%, 1.0055 44.4%, 1.0174 47.2%, 1.0252 50%, 1.0296 52.8%, 1.0314 55.6%, 1.0313 58.3%, 1.0299 61.1%, 1.0275 63.9%, 1.0246 66.7%, 1.0215 69.4%, 1.0183 72.2%, 1.0152 75%, 1.0123 77.8%, 1.0098 80.6%, 1.0075 83.3%, 1.0055 86.1%, 1.0039 88.9%, 1.0025 91.7%, 1.0015 94.4%, 1.0007 97.2%, 1)'
    : 'cubic-bezier(.32, .72, 0, 1)';
  function sheetSwipe(m) {
    const bd = $('.modal-backdrop', m.wrap);
    let y0 = null, x0 = 0, dy = 0, head = false, lock = null, ly = 0, lt = 0, v = 0;
    m.el.addEventListener('touchstart', e => {
      y0 = null;
      if (innerWidth >= 700 || e.touches.length !== 1 || m.closed) return;
      head = !!e.target.closest('.modal-head');
      if (!head && !(e.target.closest('.modal-body') && m.body.scrollTop <= 0)) return;
      if (!head && e.target.closest('input, textarea, select, .chips, .wall-row, .seg, .fc-sets, .hscroll')) return;
      y0 = ly = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; v = 0; lt = e.timeStamp; lock = null;
    }, { passive: true });
    m.el.addEventListener('touchmove', e => {
      if (y0 == null) return;
      const y = e.touches[0].clientY, d = y - y0, dx = e.touches[0].clientX - x0;
      // im Inhalt nur nach unten (nach oben wird gescrollt), am Kopf in beide Richtungen
      if (lock == null && (Math.abs(d) > 6 || Math.abs(dx) > 6)) lock = Math.abs(d) > Math.abs(dx) && (d > 0 || head) ? 'y' : 'no';
      if (lock !== 'y' || (!head && m.body.scrollTop > 0)) { if (lock === 'no') y0 = null; return; }
      if (e.cancelable) e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lt);
      v = v * 0.3 + ((y - ly) / dt) * 0.7;   // px/ms, leicht geglättet
      ly = y; lt = e.timeStamp;
      dy = d >= 0 ? d : -36 * (1 - 1 / (1 - d / 90));   // nach oben: Gummiband, höchstens ~36 px
      m.el.style.transition = 'none';
      m.el.style.transform = `translateY(${dy.toFixed(1)}px)`;
      bd.style.transition = 'none';
      bd.style.opacity = String(Math.max(0, Math.min(1, 1 - dy / Math.max(1, m.el.offsetHeight))));
    }, { passive: false });
    const end = e => {
      if (y0 == null) return;
      y0 = null;
      if (lock !== 'y') return;
      const h = m.el.offsetHeight, vel = e && e.timeStamp - lt > 90 ? 0 : v;   // Finger stand still → kein Schwung
      if (dy > 0 && (vel > 0.5 || (dy > Math.min(140, h * 0.3) && vel > -0.2))) {
        // hinaus mit dem Tempo des Fingers (mind. 130 ms, höchstens 320 ms)
        const dur = Math.round(clamp((h - dy) / Math.max(vel, 1.1), 130, 320));
        m.el.style.transition = `transform ${dur}ms cubic-bezier(.25, .75, .45, 1)`;
        bd.style.transition = `opacity ${dur}ms linear`;
        m.el.style.transform = ''; bd.style.opacity = '';
        close(m);
        return;
      }
      // zurückfedern
      m.el.style.transition = `transform 550ms ${SPRING_BACK}`;
      bd.style.transition = 'opacity .3s';
      m.el.style.transform = ''; bd.style.opacity = '';
      setTimeout(() => { if (!m.closed && y0 == null) { m.el.style.transition = ''; bd.style.transition = ''; } }, 600);
    };
    m.el.addEventListener('touchend', end);
    m.el.addEventListener('touchcancel', end);
  }
  function close(m, value, instant = false) {
    if (!m || m.closed) return;
    m.closed = true;
    const i = stack.indexOf(m);
    if (i >= 0) stack.splice(i, 1);
    m.wrap.classList.remove('open');
    if (typeof Charts !== 'undefined') Charts.destroyIn(m.wrap);
    if (instant) m.wrap.remove();
    else { m.wrap.classList.add('closing'); setTimeout(() => m.wrap.remove(), 340); }
    if (!stack.length) document.body.classList.remove('modal-open');
    if (m.onClose) m.onClose(value);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) close(stack[stack.length - 1]); });
  return { open, close, top: () => stack[stack.length - 1], count: () => stack.length, closeAll: () => [...stack].reverse().forEach(m => close(m)) };
})();

/** Eigener Confirm-Dialog (kein window.confirm) */
function confirmDialog({ title, text = '', html = '', okLabel = 'OK', cancelLabel = 'Abbrechen', danger = false, requireText = null }) {
  return new Promise(resolve => {
    let result = false;
    const tall = okLabel.length + cancelLabel.length > 22;   // lange Beschriftungen: Knöpfe untereinander (wie iOS), Abbrechen unten
    const m = Modal.open({
      title, size: 'sm', cls: 'alert',
      body: `${text ? `<p class="dim">${esc(text)}</p>` : ''}${html}
        ${requireText ? `<div class="field mt-16"><span>Zur Bestätigung „${esc(requireText)}" eintippen</span><input class="input" id="cfmInput" autocomplete="off" autocapitalize="characters"></div>` : ''}`,
      foot: `${tall ? '<div class="alert-stack">' : ''}<button class="btn btn-secondary" data-x="cancel">${esc(cancelLabel)}</button>
             <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-x="ok" ${requireText ? 'disabled' : ''}>${esc(okLabel)}</button>${tall ? '</div>' : ''}`,
      onClose: () => resolve(result)
    });
    m.el.addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      result = b.dataset.x === 'ok';
      m.close();
    });
    if (requireText) {
      const inp = $('#cfmInput', m.el);
      inp.addEventListener('input', () => { $('[data-x=ok]', m.el).disabled = inp.value.trim().toUpperCase() !== requireText; });
      setTimeout(() => inp.focus(), 300);
    }
  });
}
function promptDialog({ title, label = '', value = '', placeholder = '', okLabel = 'Speichern', inputmode = 'text' }) {
  return new Promise(resolve => {
    let result = null;
    const m = Modal.open({
      title, size: 'sm',
      body: `<label class="field"><span>${esc(label)}</span><input class="input" id="pdInput" value="${esc(value)}" placeholder="${esc(placeholder)}" inputmode="${inputmode}" autocomplete="off"></label>`,
      foot: `<button class="btn btn-secondary" data-x="cancel">Abbrechen</button><button class="btn btn-primary" data-x="ok">${esc(okLabel)}</button>`,
      onClose: () => resolve(result)
    });
    const inp = $('#pdInput', m.el);
    const ok = () => { result = inp.value; m.close(); };
    m.el.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'ok') ok(); else m.close(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    setTimeout(() => { inp.focus(); inp.select(); }, 300);
  });
}
/** Aktions-Menü als Bottom-Sheet → Promise<key|null> */
function actionMenu(title, items) {
  return new Promise(resolve => {
    let res = null;
    const m = Modal.open({
      title, size: 'sm',
      body: (() => {
        // featured: true = hervorgehoben in Akzentfarbe, 'plain' = abgesetzt, aber neutral; der Rest als Liste darunter
        const all = items.filter(Boolean), feat = all.filter(it => it.featured === true), solo = all.filter(it => it.featured === 'plain'), rest = all.filter(it => !it.featured);
        const row = (it, cls = '') => `
        <button class="list-item ${cls} ${it.danger ? 'danger' : ''}" data-k="${esc(it.key)}">
          <span class="li-icon">${icon(it.icon || 'chevR')}</span>
          <span class="li-main">${it.kicker ? `<span class="li-kicker">${esc(it.kicker)}</span>` : ''}<span class="li-title">${esc(it.label)}</span>${it.sub ? `<div class="li-sub">${esc(it.sub)}</div>` : ''}</span>
          ${cls ? icon('chevR', 'li-chev') : ''}
        </button>`;
        // Hervorgehobene Einträge (z. B. heutiges Workout) abgesetzt über der Liste
        return `${feat.map(it => row(it, 'am-featured fx-up')).join('')}${solo.map((it, i) => row(it, `am-solo fx-up${feat.length || i ? ' mt-8' : ''}`)).join('')}${rest.length ? `<div class="list fx-stagger${feat.length || solo.length ? ' mt-12' : ''}">${rest.map(it => row(it)).join('')}</div>` : ''}`;
      })(),
      onClose: () => resolve(res)
    });
    m.el.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { res = b.dataset.k; m.close(); } });
  });
}

/* ---------- Info-Popover („Was ist das?") ---------- */
const infoBtn = text => `<button class="info-i" data-info="${esc(text)}" aria-label="Was ist das?">${icon('info')}</button>`;
function showPopover(anchor, text) {
  const pop = $('#popover');
  pop.textContent = text;
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = clamp(r.left + r.width / 2 - pw / 2, 12, innerWidth - pw - 12);
  let top = r.bottom + 8;
  if (top + ph > innerHeight - 12) top = Math.max(12, r.top - ph - 8);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}
document.addEventListener('click', e => {
  const pop = $('#popover');
  const b = e.target.closest('[data-info]');
  if (b) { e.preventDefault(); e.stopPropagation(); if (!pop.hidden && pop.dataset.for === b.dataset.info) { pop.hidden = true; return; } pop.dataset.for = b.dataset.info; showPopover(b, b.dataset.info); return; }
  if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
}, true);
document.addEventListener('scroll', () => { const p = $('#popover'); if (p && !p.hidden) p.hidden = true; }, { capture: true, passive: true });

/* ---------- Bewegung: Einmal-Effekte auf frisch gerenderten Elementen ---------- */
/** Effekt-Klasse setzen (startet neu, falls schon gesetzt). Reduziert/Aus regelt das CSS. */
function fx(el, cls) {
  if (!el) return;
  (el.length != null && !el.tagName ? Array.from(el) : [el]).forEach(n => { n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); n.addEventListener('animationend', function done(ev) { if (ev.target === n) { n.classList.remove(cls); n.removeEventListener('animationend', done); } }); });
}
/** Volle Animationen? (Einstellung „Animationen: Voll" und kein „Bewegung reduzieren" im System) */
const motionFull = () => S().motion === 'full' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Zahlen hochzählen: die Zahl am Anfang des ersten Textknotens läuft von 0 auf ihren Wert („8,4 t", „1.234 kg", „12") */
function countUp(els, dur = 700, delay = 0) {
  if (!motionFull()) return;
  (els.length != null && !els.tagName ? Array.from(els) : [els]).forEach(el => {
    const tn = el && [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue));
    if (!tn || tn.nodeValue.includes(':')) return;   // Uhrzeiten/Dauern („1:05 h") nicht zählen
    const txt = tn.nodeValue, m = txt.match(/^(\s*)(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/);
    if (!m) return;
    const raw = m[2], dec = (raw.split(',')[1] || '').length, target = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    if (!(target > 0)) return;
    const pre = m[1], post = txt.slice(m[0].length), t0 = performance.now();
    const step = now => {
      if (!tn.isConnected) return;
      const p = Math.max(0, Math.min(1, (now - t0 - delay) / dur));
      tn.nodeValue = p < 1 ? pre + nf(target * (1 - Math.pow(1 - p, 3)), dec) + post : txt;
      if (p < 1) requestAnimationFrame(step);
    };
    tn.nodeValue = pre + '0' + post;
    requestAnimationFrame(step);
  });
}
const COUNT_SEL = '.stat-value, .cc-big > b';
/* Ansicht wechseln (Segment, Chips, Unter-Tabs): Inhalt unter dem Schalter sanft einblenden */
const SWAP_ACTS = new Set(['trainSub', 'progSub', 'period', 'volScope', 'kraftScope', 'unitSet', 'kraftEx', 'exCat', 'exEq', 'woView', 'histMore', 'setSeg']);
function fxSwap(act, v) {
  const sel = `[data-act="${act}"]${v != null ? `[data-v="${CSS.escape(v)}"]` : ''}`;
  let n = $(`#view ${sel}`);
  if (!n) return;
  // vom Schalter bis zur obersten Ebene des Tabs gehen – alles darunter wird eingeblendet
  while (n && n.parentElement && !n.parentElement.classList.contains('tab')) n = n.parentElement;
  if (!n || !n.parentElement) return;
  for (let s = n.nextElementSibling; s; s = s.nextElementSibling) fx(s, 'fx-up');
}

/* ---------- Event-Delegation ---------- */
const Actions = {};
const Inputs = {};
const Changes = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.act];
  if (!fn) return;
  const act = el.dataset.act, v = el.dataset.v;
  try {
    const r = fn(el, e);
    if (r && typeof r.then === 'function') r.catch(err => ErrLog.add(err, act));
    if (SWAP_ACTS.has(act)) Promise.resolve(r).then(() => requestAnimationFrame(() => fxSwap(act, v))).catch(() => {});
  } catch (err) { ErrLog.add(err, act); }
});
/* Schalter: Knopf-Animation fertig laufen lassen, bevor neu gerendert wird */
let renderHoldUntil = 0;
document.addEventListener('change', e => { if (e.target.closest('.switch')) renderHoldUntil = Date.now() + 240; }, true);
document.addEventListener('input', e => {
  const el = e.target.closest('[data-in]');
  if (el && Inputs[el.dataset.in]) try { Inputs[el.dataset.in](el, e); } catch (err) { ErrLog.add(err, el.dataset.in); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-ch]');
  if (!el || !Changes[el.dataset.ch]) return;
  try { const r = Changes[el.dataset.ch](el, e); if (r && typeof r.then === 'function') r.catch(err => ErrLog.add(err, el.dataset.ch)); } catch (err) { ErrLog.add(err, el.dataset.ch); }
});

/* ---------- Dropdown: eigenes Aufklapp-Menü statt Browser-Liste (in jedem Browser gleich, passt zum Theme) ----------
   Vor jedes <select> kommt ein Knopf; das echte <select> bleibt versteckt im DOM und hält Wert & change-Events,
   damit alle bestehenden Handler (data-ch, Modal-Listener, .value) unverändert funktionieren. */
const Dropdown = (() => {
  let cur = null;   // offenes Menü: { sel, btn, menu }
  const text = sel => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; };
  function sync(sel) {
    const b = sel._ddBtn; if (!b) return;
    b.querySelector('.dd-val').textContent = text(sel);
    b.disabled = sel.disabled;
  }
  function enhance(sel) {
    if (sel._ddBtn || sel.multiple || sel.size > 1) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = sel.className + ' dd-btn';
    for (const k of ['style', 'aria-label', 'title']) if (sel.hasAttribute(k)) b.setAttribute(k, sel.getAttribute(k));
    for (const k of ['ei', 'si']) if (k in sel.dataset) b.dataset[k] = sel.dataset[k];   // Satz-Auswahl im Workout (focusin)
    b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span class="dd-val"></span>';
    sel.classList.add('dd-native'); sel.tabIndex = -1;
    sel.before(b);
    sel._ddBtn = b; b._sel = sel;
    sync(sel);
  }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SELECT') enhance(root);
    else root.querySelectorAll('select').forEach(enhance);
  }
  function show(b) {
    const sel = b._sel; if (!sel || sel.disabled) return;
    close();
    const opt = o => `<button type="button" class="dd-opt ${o.selected ? 'on' : ''}" role="option" aria-selected="${o.selected}" data-i="${o.index}" ${o.disabled ? 'disabled' : ''}><span>${esc(o.textContent)}</span>${o.selected ? icon('check') : ''}</button>`;
    let html = '';
    for (const ch of sel.children) html += ch.tagName === 'OPTGROUP' ? `<div class="dd-group">${esc(ch.label)}</div>${[...ch.children].map(opt).join('')}` : opt(ch);
    const menu = document.createElement('div');
    menu.className = 'dd-menu'; menu.setAttribute('role', 'listbox');
    if (b.getAttribute('aria-label')) menu.setAttribute('aria-label', b.getAttribute('aria-label'));
    menu.innerHTML = html;
    document.body.appendChild(menu);
    // unter dem Feld, bei zu wenig Platz darüber; mindestens so breit wie das Feld, nie über den Rand
    const r = b.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, gap = 6;
    menu.style.minWidth = Math.min(Math.max(r.width, 96), vw - 24) + 'px';
    menu.style.maxWidth = (vw - 24) + 'px';
    const below = vh - r.bottom - gap - 10, above = r.top - gap - 10, want = Math.min(menu.scrollHeight, 340);
    const up = below < want && above > below;
    menu.style.maxHeight = Math.max(120, Math.min(340, up ? above : below)) + 'px';
    if (up) { menu.style.bottom = (vh - r.top + gap) + 'px'; menu.classList.add('up'); } else menu.style.top = (r.bottom + gap) + 'px';
    menu.style.left = clamp(r.left, 12, vw - 12 - menu.offsetWidth) + 'px';
    const on = menu.querySelector('.on');
    if (on) menu.scrollTop = on.offsetTop - (menu.clientHeight - on.offsetHeight) / 2;
    cur = { sel, btn: b, menu };
    b.setAttribute('aria-expanded', 'true'); b.classList.add('dd-open');
    if (motionFull()) fx(menu, 'dd-in');
    (on || menu.querySelector('.dd-opt:not(:disabled)'))?.focus({ preventScroll: true });
  }
  function close(focusBtn) {
    if (!cur) return;
    const { btn, menu } = cur;
    cur = null;
    menu.remove();
    btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('dd-open');
    if (focusBtn && btn.isConnected) btn.focus({ preventScroll: true });
  }
  function pick(i) {
    if (!cur) return;
    const { sel } = cur;
    close(true);
    if (sel.selectedIndex === i) return;
    sel.selectedIndex = i;
    sync(sel);
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.dd-btn');
    if (b) { e.preventDefault(); if (cur && cur.btn === b) close(); else show(b); return; }
    const o = e.target.closest('.dd-opt');
    if (o && cur && cur.menu.contains(o)) pick(+o.dataset.i);
  });
  // außerhalb tippen, scrollen (außer im Menü), Größe ändern → zu
  document.addEventListener('pointerdown', e => { if (cur && !cur.menu.contains(e.target) && !cur.btn.contains(e.target)) close(); }, true);
  document.addEventListener('scroll', e => { if (cur && !(e.target instanceof Node && cur.menu.contains(e.target))) close(); }, true);
  addEventListener('resize', () => close());
  // Wert per Code geändert und change ausgelöst → Text im Knopf nachziehen
  document.addEventListener('change', e => { if (e.target._ddBtn) sync(e.target); }, true);
  document.addEventListener('keydown', e => {
    if (!cur) {
      const b = e.target.closest && e.target.closest('.dd-btn');
      if (b && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(b); }
      return;
    }
    const opts = [...cur.menu.querySelectorAll('.dd-opt:not(:disabled)')], i = opts.indexOf(document.activeElement);
    if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(true); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = opts[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, opts.length - 1)]; if (n) n.focus(); }
  });
  // neue <select> automatisch umbauen; geänderte Optionen → Text nachziehen; Feld weg → Menü zu
  new MutationObserver(list => {
    for (const m of list) {
      const t = m.target, sel = t.tagName === 'SELECT' ? t : t.parentElement && t.parentElement.tagName === 'SELECT' ? t.parentElement : t.tagName === 'OPTGROUP' ? t.parentElement : null;
      if (sel && sel._ddBtn) sync(sel);
      m.addedNodes.forEach(scan);
      m.removedNodes.forEach(n => { if (n.tagName === 'SELECT' && n._ddBtn && n._ddBtn.nextSibling !== n) n._ddBtn.remove(); });
    }
    if (cur && !cur.btn.isConnected) close();
  }).observe(document.documentElement, { childList: true, subtree: true });
  scan(document.body);
  return { sync, close };
})();

/* ---------- Feedback: Ton, Konfetti, Benachrichtigung, Wake-Lock ---------- */
let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
document.addEventListener('click', unlockAudio, { once: true });
/* Pausen-Töne (synthetisch, keine Dateien): Auswahl unter Mehr → Pause & Timer */
const REST_SOUNDS = [['beep', 'Piep (3×)'], ['double', 'Doppelton'], ['gong', 'Gong'], ['bell', 'Glocke']];
function playSound(kind = S().restSound || 'beep', force = false) {
  if (!force && !S().sound) return;
  try {
    unlockAudio();
    const ctx = audioCtx;
    if (!ctx) return;
    const tone = (freq, d, len, vol = 0.3) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + d;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + len + 0.03);
    };
    if (kind === 'double') { tone(988, 0, 0.14); tone(988, 0.2, 0.14); }
    else if (kind === 'gong') { tone(196, 0, 1.6, 0.35); tone(392, 0, 1.2, 0.12); tone(588, 0, 0.8, 0.06); }
    else if (kind === 'bell') { tone(1318, 0, 1.0, 0.25); tone(2637, 0, 0.6, 0.08); tone(1976, 0.02, 0.8, 0.06); }
    else if (kind === 'warn') tone(1046, 0, 0.12, 0.16);
    else [0, 0.2, 0.4].forEach((d, i) => tone(i === 2 ? 1320 : 880, d, 0.17));
  } catch (e) {}
}
function beep() { playSound(); }
Actions.soundTest = () => playSound(S().restSound, true);
function confetti(o = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || S().confetti === false || S().motion === 'off') return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = o.colors || [cssVar('--accent'), '#ffffff', '#ffb020', '#5aa9ff', '#ff6fae'];
  const parts = Array.from({ length: o.n || 130 }, () => ({
    x: (o.x != null ? o.x : W / 2) + (Math.random() - .5) * 60, y: o.y != null ? o.y : H * .32, vx: (Math.random() - .5) * 15, vy: -Math.random() * 13 - 4,
    s: Math.random() * 6 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .35, c: colors[Math.random() * colors.length | 0]
  }));
  let last = performance.now();
  const frame = t => {
    const dt = Math.min(32, t - last) / 16; last = t;
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (const p of parts) {
      p.vy += .33 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .99; p.r += p.vr * dt;
      if (p.y < H + 20) alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (alive && c.isConnected) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
  setTimeout(() => c.remove(), 6000);
}
async function notify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: iconSrc(), badge: iconSrc(), tag: 'gymlog-rest', renotify: true, vibrate: [200, 100, 200] });
    else new Notification(title, { body, icon: iconSrc() });
    return true;
  } catch (e) { return false; }
}
const WakeLock = (() => {
  let lock = null, want = false;
  async function request() {
    want = true;
    if (!S().wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (e) {}
  }
  function release() { want = false; if (lock) { lock.release().catch(() => {}); lock = null; } }
  document.addEventListener('visibilitychange', () => { if (want && !lock && document.visibilityState === 'visible') request(); });
  return { request, release };
})();

/* ---------- Darstellung: Designs × Hell/Dunkel, Akzent, Feinschliff ---------- */
const GF = 'https://fonts.googleapis.com/css2?display=swap&family=';
const DESIGN_FONTS = {
  iron: GF + 'Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700',
  carbon: GF + 'Titillium+Web:wght@400;600;700',
  paper: GF + 'Newsreader:opsz,wght@6..72,500;6..72,600',
  // Plakat nutzt Helvetica Neue (iPhone/Mac); Archivo nur, wo sie fehlt
  plakat: GF + 'Archivo:wght@400;500;600;700',
  // Fokus: Saira – Zahlen und Titel wie auf einem Sport-Display
  fokus: GF + 'Saira:wght@500;600;700',
  // Tag & Nacht: Fraunces mit weichen Rundungen (SOFT 100) für Titel und große Zahlen
  sky: GF + 'Fraunces:opsz,wght,SOFT@9..144,400..700,100'
};
const USER_FONTS = { rounded: GF + 'Nunito:wght@400;600;700;800;900', condensed: DESIGN_FONTS.iron };
/* surf = Kartenfarbe je Modus (für die Kontrast-Berechnung eigener Akzentfarben).
   phased: kein Hell/Dunkel zum Auswählen – das Design folgt der Tageszeit (js/sky.js), surf dann je Phase */
const DESIGNS = [
  { id: 'gymlog', name: 'Trainio', desc: 'Ruhiges Graphit mit gedecktem Grün – klar und professionell', surf: { dark: '#141518', light: '#ffffff' } },
  { id: 'glass', name: 'Liquid Glass', desc: 'Glas, Unschärfe & Licht – wie iOS 26', nav: 'floating', surf: { dark: '#25273b', light: '#f6f7fb' } },
  { id: 'iron', name: 'Iron', desc: 'Industrial-Gym: Stahl, Orange, Condensed', surf: { dark: '#17191b', light: '#f9f8f5' } },
  { id: 'pure', name: 'Pure', desc: 'Reines Schwarz & Weiß, klare Flächen, Akzent nur wo nötig', surf: { dark: '#161618', light: '#f5f5f7' } },
  { id: 'carbon', name: 'Carbon', desc: 'Graphit & Rennrot – sportlich wie ein Cockpit', surf: { dark: '#16171a', light: '#ffffff' } },
  { id: 'paper', name: 'Paper', desc: 'Warmes Papier & Serifen-Titel – ruhig und editorial', surf: { dark: '#22201d', light: '#fbf8f2' } },
  { id: 'plakat', name: 'Plakat', desc: 'Schweizer Sportplakat: Raster, große Grotesk-Zahlen, Schwarz-Weiß & Signalrot', nav: 'classic', surf: { dark: '#0b0b0b', light: '#ffffff' } },
  { id: 'fokus', name: 'Fokus', desc: 'Tunnelblick: fast schwarz, eine Signalfarbe, Fokus-Ecken – im Workout Spotlight auf die aktuelle Übung und den nächsten Satz', nav: 'classic', surf: { dark: '#0f1113', light: '#ffffff' } },
  { id: 'sky', name: 'Tag & Nacht', desc: 'Der Himmel als Hintergrund: Dämmerung, Tag, Sonnenuntergang & Nacht – wechselt von selbst mit dem Sonnenstand', nav: 'floating', phased: true,
    surf: { dawn: '#f6eff4', day: '#f2f8fe', dusk: '#2e1b31', night: '#121a30', light: '#f2f8fe', dark: '#121a30' } }
];
const designOf = id => DESIGNS.find(d => d.id === id) || DESIGNS[0];
const ACCENTS = [['#39ff88', 'Neon'], ['#a3e635', 'Lime'], ['#10b981', 'Smaragd'], ['#14b8a6', 'Türkis'], ['#06b6d4', 'Cyan'], ['#0a84ff', 'Blau'],
  ['#6366f1', 'Indigo'], ['#8b5cf6', 'Violett'], ['#ec4899', 'Pink'], ['#ef4444', 'Rot'], ['#f97316', 'Orange'], ['#facc15', 'Gelb']];
const WALLS = [['aurora', 'Aurora'], ['ocean', 'Ozean'], ['sunset', 'Abendrot'], ['forest', 'Wald'], ['graphite', 'Graphit'], ['accent', 'Akzent']];

/* Farb-Mathematik (WCAG-Kontrast) */
const Color = {
  rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; },
  hex(a) { return '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); },
  lum(c) { const a = Color.rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; },
  contrast(a, b) { const x = Color.lum(a), y = Color.lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); },
  mix(a, b, t) { const A = Color.rgb(a), B = Color.rgb(b); return Color.hex(A.map((v, i) => v + (B[i] - v) * t)); },
  valid: h => /^#[0-9a-f]{6}$/i.test(String(h || ''))
};
/** Eigene Akzentfarbe → komplettes Token-Set, Text-Variante mit Kontrast ≥ 4,5 */
function accentCss(hex, mode, surf) {
  const toward = mode === 'dark' ? '#ffffff' : '#000000';
  let text = hex;
  for (let t = .06; Color.contrast(text, surf) < 4.5 && t <= 1; t += .06) text = Color.mix(hex, toward, t);
  const ink = Color.contrast('#ffffff', hex) >= Color.contrast('#0b0d10', hex) ? '#ffffff' : '#0b0d10';
  const [r, g, b] = Color.rgb(hex);
  return `--accent:${hex};--accent-text:${text};--accent-ink:${ink};--btn-ink:${ink};--btn-bg:${hex};--btn-fg:${ink};--accent-soft:rgba(${r},${g},${b},${mode === 'dark' ? .16 : .13});--accent-dim:${Color.mix(hex, surf, .42)};`;
}

function resolvedTheme() {
  if (S().design === 'sky') return Sky.theme();
  const t = S().theme;
  if (t === 'system') return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  if (t === 'time') { const h = new Date().getHours(); return h >= 19 || h < 7 ? 'dark' : 'light'; }
  return t === 'light' ? 'light' : 'dark';
}
function lookAttrs(s = S()) {
  const D = designOf(s.design);
  return {
    'data-design': D.id,
    'data-phase': D.phased ? Sky.phase() : null,
    'data-radius': s.radius && s.radius !== 'auto' ? s.radius : null,
    'data-font': s.font && s.font !== 'auto' ? s.font : null,
    'data-text': s.textSize && s.textSize !== 'm' ? s.textSize : null,
    'data-density': s.density && s.density !== 'normal' ? s.density : null,
    'data-contrast': s.contrast ? 'high' : null,
    'data-nav': s.navStyle && s.navStyle !== 'auto' ? s.navStyle : (D.nav || 'classic'),
    'data-navlabels': s.navLabels === false ? 'off' : null,
    'data-motion': s.motion && s.motion !== 'full' ? s.motion : null,
    'data-wall': D.id === 'glass' ? (s.wall || 'aurora') : null
  };
}
const _fontLinks = new Set();
function ensureFont(href) {
  if (!href || _fontLinks.has(href)) return;
  _fontLinks.add(href);
  if ($(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href; l.crossOrigin = 'anonymous';
  document.head.appendChild(l);
}
let _lookSig = '';
/** Kartenfarbe des Designs im aktuellen Modus bzw. in der aktuellen Phase (Tag & Nacht) */
const lookSurf = D => D.surf[D.phased ? Sky.phase() : resolvedTheme()];
/** Alle Darstellungs-Einstellungen auf <html> anwenden → true, wenn sich sichtbar etwas geändert hat */
function applyTheme() {
  const s = S();
  const root = document.documentElement;
  const mode = resolvedTheme();
  const D = designOf(s.design);
  const attrs = lookAttrs(s);
  root.dataset.theme = mode;
  for (const [k, v] of Object.entries(attrs)) { if (v == null) root.removeAttribute(k); else root.setAttribute(k, v); }
  const accent = Color.valid(s.accent) ? s.accent : '';
  const blur = { off: '0px', light: '12px', normal: '22px', strong: '36px' }[s.glassBlur] || '22px';
  root.style.cssText = (accent ? accentCss(accent, mode, lookSurf(D)) : '') + (D.id === 'glass' ? `--glass-blur:${blur};` : '');
  Sky.sync(D.id === 'sky');
  const fonts = [DESIGN_FONTS[D.id], USER_FONTS[s.font]].filter(Boolean);
  fonts.forEach(ensureFont);
  const meta = $('meta[name="theme-color"]');
  if (meta) { const bg = cssVar('--bg'); meta.setAttribute('content', /^#/.test(bg) ? bg : (mode === 'light' ? '#f3f5f8' : '#0b0d10')); }
  try {
    localStorage.setItem(LS.theme, s.theme);
    localStorage.setItem(LS.look, JSON.stringify({
      theme: s.theme, attrs, fonts,
      // je Modus – bei Tag & Nacht zusätzlich je Phase; sky = Phasen-Grenzen von heute (Minuten) fürs Startskript
      accent: accent ? Object.fromEntries((D.phased ? [...Sky.PHASES, 'light', 'dark'] : ['light', 'dark']).map(k => [k, accentCss(accent, Sky.THEME[k] || k, D.surf[k])])) : null,
      sky: D.phased ? Sky.bounds() : null,
      extra: D.id === 'glass' ? `--glass-blur:${blur};` : ''
    }));
  } catch (e) {}
  const sig = [mode, JSON.stringify(attrs), root.style.cssText].join('|');
  const changed = sig !== _lookSig;
  _lookSig = sig;
  if (changed && typeof Charts !== 'undefined') Charts.applyDefaults();
  applyIcon();
  return changed;
}
/** Gewähltes App-Icon: Browser-Tab, Home-Bildschirm (iPhone beim Hinzufügen) und Android-Manifest */
function applyIcon() {
  const id = iconId();
  try { localStorage.setItem('gymlog.icon', id); } catch (e) {}
  const set = (lid, href, type) => { const l = document.getElementById(lid); if (!l) return; if (type && l.type !== type) l.type = type; if (l.getAttribute('href') !== href) l.setAttribute('href', href); };
  set('lnkTouch', iconSrc('apple-touch-icon.png'));
  set('lnkPng', iconSrc('icon-192.png'));
  set('lnkManifest', id === '1' ? 'manifest.json' : iconSrc('manifest.json'));
  // Vektor-Favicon gibt es nur fürs Original – sonst ebenfalls das PNG
  set('lnkSvg', id === '1' ? 'icon.svg' : iconSrc('icon-192.png'), id === '1' ? 'image/svg+xml' : 'image/png');
  const brand = $('#sidebar .brand img');
  if (brand && brand.getAttribute('src') !== iconSrc()) brand.setAttribute('src', iconSrc());
}
/** Darstellung umstellen: alles in einem Schritt, ohne halb gelaufene Farb-Übergänge. change() speichert die Einstellung. */
function switchLook(change) {
  const root = document.documentElement;
  root.classList.add('look-swap');
  change();
  applyTheme();
  // sofort neu zeichnen statt 40 ms später: der Re-Render aus dem Daten-Abo findet dann nichts mehr zu ändern
  clearTimeout(renderTimer); renderTimer = null;
  App.renderCurrent();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('look-swap')));
}
/* Hell/Dunkel nach System oder Uhrzeit: nur wenn sich der Modus wirklich ändert */
const followTheme = () => { if (resolvedTheme() !== document.documentElement.dataset.theme) switchLook(() => {}); };
(mq => { const f = () => { if (S().theme === 'system') followTheme(); }; if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); })(matchMedia('(prefers-color-scheme: light)'));
setInterval(() => { if (S().theme === 'time') followTheme(); }, 60000);

/* Mini-Vorschau eines Designs (liest nur dessen Tokens) */
function designPreview(id, mode) {
  return `<div class="tp" data-design="${id}" data-theme="${mode}" aria-hidden="true">
    <div class="tp-title">Trainio</div>
    <div class="tp-card"><div class="tp-line"></div><div class="tp-line s"></div>
      <div class="tp-row"><span class="tp-dot on"></span><span class="tp-dot"></span><span class="tp-btn"></span></div></div>
    <span class="tp-mode">${mode === 'dark' ? '☾' : '☀'}</span></div>`;
}
/* Tag & Nacht: vier kleine Himmel statt Hell/Dunkel – Sonne bzw. Mond, eine Karte, ein Knopf */
const skyPreview = ph => `<div class="tp" data-design="sky" data-phase="${ph}" data-theme="${Sky.THEME[ph]}" aria-hidden="true">
    <i class="tp-orb"></i><div class="tp-card"><div class="tp-line"></div><div class="tp-row"><span class="tp-btn"></span></div></div></div>`;
const designPair = id => designOf(id).phased ? `<div class="dt-pair four">${Sky.PHASES.map(skyPreview).join('')}</div>`
  : `<div class="dt-pair">${designPreview(id, 'light')}${designPreview(id, 'dark')}</div>`;
const THEME_LABEL = { dark: 'Dunkel', light: 'Hell', system: 'System', time: 'Nach Uhrzeit' };

const stackLine = (title, sub, control) => `<div class="set-line stack"><div class="sl-main"><div class="sl-title">${title}</div>${sub ? `<div class="sl-sub">${sub}</div>` : ''}</div>${control}</div>`;
const LOOK_KEYS = ['design', 'theme', 'accent', 'wall', 'glassBlur', 'radius', 'font', 'textSize', 'density', 'contrast', 'navStyle', 'navLabels', 'startTab', 'motion', 'haptics', 'confetti', 'homeStats', 'homeRecent', 'homeHeart'];
function setLook(k, v) {
  if (k === 'homeRecent') v = +v;
  switchLook(() => Store.saveSettings({ [k]: v }));
}
/* Die Darstellungs-Einstellungen selbst stehen im Mehr-Tab (Gruppe „Darstellung“, js/more.js) */
Actions.openLook = () => openMoreSub('look');


/* ---------- App-Shell: Navigation, Topbar, Banner, Rendering ---------- */
const TABS = [
  ['start', 'Start', 'home'],
  ['training', 'Training', 'dumbbell'],
  ['exercises', 'Übungen', 'book'],
  ['progress', 'Fortschritt', 'chart'],
  ['more', 'Mehr', 'grid']
];
const Views = {};

const App = {
  tab: TABS.some(t => t[0] === UI.tab) ? UI.tab : 'start',
  peek: null,   // ausgeblendeter Tab, der gerade über „Mehr" geöffnet ist
  /** Tab öffnen. kind: Übergang erzwingen (z. B. 'zoom' beim Workout-Start), instant: ganz ohne Übergang */
  go(tab, { kind: forced = null, instant = false } = {}) {
    if (!Views[tab]) return;
    if (tab !== this.peek) this.peek = null;
    const changed = tab !== this.tab;
    // denselben Tab erneut antippen: der Tab darf selbst reagieren (z. B. Mehr → zurück zur Übersicht)
    if (!changed && Views[tab].reselect && Views[tab].reselect()) return;
    // Tab verlassen: der alte Tab darf aufräumen (z. B. Mehr → offene Gruppe schließen)
    if (changed && Views[this.tab] && Views[this.tab].leave) Views[this.tab].leave();
    // Bibliothek über „Mehr" öffnen/schließen wirkt wie eine Unterseite (iOS-Push). Tab-Wechsel selbst laufen wie
    // bei iOS ohne Übergang – Überblenden und nachrückende Karten ließen die Seite kurz zucken.
    const kind = instant ? null : forced || (!changed ? null : tab === this.peek ? 'push' : this.peek === this.tab && tab === 'more' ? 'pop' : null);
    const apply = () => {
      this.tab = tab;
      UI.tab = tab;
      saveUI();
      $('#popover').hidden = true;
      this.renderCurrent();
      if (changed) {
        Scroll.to(0);
        fx($$('#bottomNav .nav-btn.active svg, #sidebar .side-btn.active svg'), 'fx-pop');
        countUp($$(`#tab-${tab} :is(${COUNT_SEL})`));
      }
    };
    Motion.go(kind, apply);
  },
  renderAll() {
    this.renderCurrent();
  },
  renderCurrent() {
    if (!visibleTabs().some(t => t[0] === this.tab) && this.peek !== this.tab) { this.tab = 'start'; UI.tab = 'start'; }
    renderNav();
    renderTopbar();
    renderBanner();
    $$('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + this.tab));
    const el = $('#tab-' + this.tab);
    if (typeof Charts !== 'undefined') Charts.destroyIn(el);
    try { Views[this.tab].render(el); }
    catch (e) { console.error(e); el.innerHTML = `<div class="empty">${icon('warn')}<h3>Ups, Fehler beim Anzeigen</h3><p class="small">${esc(e.message)}</p></div>`; }
    renderFab();
    RestTimer.render();
  }
};
Actions.go = el => App.go(el.dataset.tab);
/** Übungs-Bibliothek – als Tab oder (wenn ausgeblendet) über „Mehr" */
Actions.openLibrary = () => { if (!F('f_exercises')) App.peek = 'exercises'; App.go('exercises'); };

/* Re-Render bei Datenänderungen – aber nicht, während jemand tippt */
let renderTimer = null, renderPending = false;
function isEditingInView() {
  const a = document.activeElement;
  return !!(a && a.matches('input, textarea, select') && $('#view').contains(a));
}
let swipeActive = false;
function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => {
    renderTimer = null;
    if (isEditingInView() || swipeActive) { renderPending = true; return; }
    App.renderCurrent();
  }, Math.max(40, renderHoldUntil - Date.now()));
}
document.addEventListener('focusout', () => {
  if (!renderPending) return;
  setTimeout(() => { if (renderPending && !isEditingInView()) { renderPending = false; App.renderCurrent(); } }, 120);
});

const visibleTabs = () => TABS.filter(([k]) => (k !== 'exercises' || F('f_exercises')) && (k !== 'progress' || F('f_progress')));
function renderNav() {
  const live = !!Workout.cur();
  const offline = Store.syncState() === 'offline';
  const dot = k => (k === 'training' && live ? '<i class="nav-dot"></i>' : '') + (k === 'more' && offline ? '<i class="nav-dot off" title="Offline"></i>' : '');
  const tabs = visibleTabs();
  const act = App.peek === App.tab ? 'more' : App.tab;
  $('#bottomNav').style.gridTemplateColumns = `repeat(${tabs.length}, 1fr)`;
  $('#bottomNav').innerHTML = tabs.map(([k, l, ic]) =>
    `<button class="nav-btn ${act === k ? 'active' : ''}" data-act="go" data-tab="${k}" aria-label="${l}${k === 'more' && offline ? ' (offline)' : ''}" ${act === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span>${dot(k)}</button>`).join('');
  $('#sidebar').innerHTML = `<div class="brand"><img src="${iconSrc()}" alt="">${APP.name}</div>` +
    tabs.map(([k, l, ic]) => `<button class="side-btn ${act === k ? 'active' : ''}" data-act="go" data-tab="${k}">${icon(ic)}<span>${l}</span>${dot(k)}</button>`).join('') +
    `<div class="side-foot">${APP.name} v${APP.version}</div>`;
}
const SYNC_LABEL = { local: 'Lokal', synced: 'Synchron', pending: 'Sync …', offline: 'Offline' };
function syncPill() {
  const s = Store.syncState();
  return `<span class="sync-pill ${s}" title="Sync-Status"><i></i>${SYNC_LABEL[s]}</span>`;
}
/* Keine Titelleiste: der aktive Tab ist unten/links markiert. Oben erscheint nur „Zurück", wenn ein Tab über
   „Mehr" geöffnet ist oder im Mehr-Tab eine Gruppe offen ist. Der Sync-Status (offline/ausstehend) steckt als
   Punkt am „Mehr"-Tab, Details unter Mehr → Konto & Profil. */
function renderTopbar() {
  const tb = $('#topbar');
  const back = App.peek === App.tab ? `<button class="btn btn-ghost btn-sm topbar-back" data-act="go" data-tab="more">${icon('chevL')} Mehr</button>`
    : Views[App.tab] && Views[App.tab].back ? Views[App.tab].back() : '';
  tb.innerHTML = back ? `${back}<span class="grow"></span>` : '';
  tb.classList.toggle('empty', !back);
}
function renderBanner() {
  const w = Workout.cur();
  const el = $('#banner');
  if (!w || App.tab === 'training') { el.innerHTML = ''; return; }
  el.innerHTML = `<button class="banner" data-act="go" data-tab="training" style="width:calc(100% - 32px)">
      <span class="pulse"></span>
      <span class="grow">${w.editingId ? 'Bearbeitung offen' : `Workout läuft seit <span class="tnum" data-tick="wo">${fmtClock((Date.now() - w.startedAt) / 1000)}</span>`} – fortsetzen</span>
      ${icon('chevR')}
    </button>`;
}
function renderFab() {
  const root = $('#fabRoot');
  root.innerHTML = App.tab === 'exercises' ? `<button class="fab" data-act="exNew" aria-label="Neue Übung">${icon('plus')}</button>` : '';
}
Scroll.el.addEventListener('scroll', () => { const s = Scroll.y > 4; $('#topbar').classList.toggle('scrolled', s); document.body.classList.toggle('is-scrolled', s); }, { passive: true });

/* Gemeinsame Bausteine */
function emptyState(ic, title, text, btn = '') {
  return `<div class="empty">${icon(ic)}<h3>${esc(title)}</h3><p class="small">${esc(text)}</p>${btn ? `<div class="mt-16">${btn}</div>` : ''}</div>`;
}
function deltaHtml(cur, prev, { invert = false, fmt = null, suffix = '', neutral = false } = {}) {
  if (prev == null || cur == null || !Number.isFinite(prev) || !Number.isFinite(cur)) return '';
  if (prev === 0) return cur > 0 ? `<span class="delta up">${icon('arrowUp')}neu</span>` : '';
  const d = (cur - prev) / Math.abs(prev);
  const cls = Math.abs(d) < 0.005 || neutral ? 'flat' : ((d > 0) !== invert ? 'up' : 'down');
  const ic = Math.abs(d) < 0.005 ? '' : icon(d > 0 ? 'arrowUp' : 'arrowDown');
  return `<span class="delta ${cls}">${ic}${fmt ? fmt(cur - prev) : (d > 0 ? '+' : '') + nf(d * 100, 0) + ' %'}${suffix}</span>`;
}
const catCls = c => 'cat-' + String(c || 'Full Body').replace(/\s+/g, '');
/** Ist m der Hauptmuskel (erster Eintrag) der Übung? */
const isPrimary = (exOrId, m) => (((typeof exOrId === 'string' ? Ex.get(exOrId) : exOrId) || {}).muscleGroups || [])[0] === m;
const catShort = c => ({ Push: 'PU', Pull: 'PL', Legs: 'LG', Core: 'CO', Cardio: 'CA', 'Full Body': 'FB' }[c] || '·');
/** Muskel-Region einer Übung (Hauptmuskel) – ohne Muskelangabe grob über die Kategorie */
function exRegion(e) {
  if (!e) return '';
  if (Ex.type(e) === 'cardio' || e.category === 'Cardio') return 'Cardio';
  const m = (e.muscleGroups || [])[0];
  const r = m && MUSCLE_REGIONS.find(x => x[2].includes(m));
  return r ? r[0] : ({ Legs: 'Beine', Core: 'Core' }[e.category] || '');
}
/** Farbiges Kürzel (z. B. „BR“ für Brust) für Übungs-Listen */
const regionDot = e => { const r = exRegion(e), i = REGION_NAMES.indexOf(r); return `<span class="cat-dot reg-${i < 0 ? 'x' : i}">${i < 0 ? '·' : MUSCLE_REGIONS[i][1]}</span>`; };


