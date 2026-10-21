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

/* ---------- Toasts ---------- */
function toast(msg, type = 'info', opts = {}) {
  const root = $('#toastRoot');
  if (!root) return;
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
  el.addEventListener('click', e => {
    if (e.target.closest('.t-act') && opts.action) opts.action.fn();
    clearTimeout(t); remove();
  });
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
  function open({ title = '', body = '', foot = '', size = '', onClose = null, cls = '' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal-backdrop"></div>
      <div class="modal ${size} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="btn-icon" data-modal-close aria-label="Schließen">${icon('x')}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    $('#modalRoot').appendChild(wrap);
    document.body.classList.add('modal-open');
    const m = {
      wrap, el: $('.modal', wrap), body: $('.modal-body', wrap), onClose, closed: false,
      close: v => close(m, v),
      setBody(html) { m.body.innerHTML = html; },
      setTitle(t) { $('.modal-head h2', wrap).textContent = t; },
      setFoot(html) {
        let f = $('.modal-foot', wrap);
        if (!html) { if (f) f.remove(); return; }
        if (!f) { f = document.createElement('div'); f.className = 'modal-foot'; m.el.appendChild(f); }
        f.innerHTML = html;
      }
    };
    $('.modal-backdrop', wrap).addEventListener('click', () => close(m));
    $('[data-modal-close]', wrap).addEventListener('click', () => close(m));
    sheetSwipe(m);
    stack.push(m);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    return m;
  }
  /** Bottom-Sheet (Handy) nach unten wegwischen: am Kopf jederzeit, im Inhalt nur ganz oben gescrollt */
  function sheetSwipe(m) {
    const bd = $('.modal-backdrop', m.wrap);
    let y0 = null, x0 = 0, dy = 0, t0 = 0, head = false, lock = null;
    m.el.addEventListener('touchstart', e => {
      y0 = null;
      if (innerWidth >= 700 || e.touches.length !== 1) return;
      head = !!e.target.closest('.modal-head');
      if (!head && !(e.target.closest('.modal-body') && m.body.scrollTop <= 0)) return;
      if (!head && e.target.closest('input, textarea, select, .chips, .wall-row, .seg, .fc-sets, .design-grid')) return;
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; t0 = Date.now(); lock = null;
    }, { passive: true });
    m.el.addEventListener('touchmove', e => {
      if (y0 == null) return;
      const d = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
      if (lock == null && (Math.abs(d) > 6 || Math.abs(dx) > 6)) lock = Math.abs(d) > Math.abs(dx) && d > 0 ? 'y' : 'no';
      if (lock !== 'y' || (!head && m.body.scrollTop > 0)) { if (lock === 'no') y0 = null; return; }
      e.preventDefault();
      dy = Math.max(0, d);
      m.el.style.transition = 'none';
      m.el.style.transform = `translateY(${dy}px)`;
      bd.style.transition = 'none';
      bd.style.opacity = String(Math.max(0, 1 - dy / Math.max(1, m.el.offsetHeight)));
    }, { passive: false });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      m.el.style.transition = ''; bd.style.transition = ''; bd.style.opacity = '';
      const fast = dy > 30 && dy / Math.max(1, Date.now() - t0) > 0.5;
      m.el.style.transform = '';
      if (lock === 'y' && (dy > Math.min(140, m.el.offsetHeight * 0.3) || fast)) close(m);
    };
    m.el.addEventListener('touchend', end);
    m.el.addEventListener('touchcancel', end);
  }
  function close(m, value) {
    if (!m || m.closed) return;
    m.closed = true;
    const i = stack.indexOf(m);
    if (i >= 0) stack.splice(i, 1);
    m.wrap.classList.remove('open');
    if (typeof Charts !== 'undefined') Charts.destroyIn(m.wrap);
    setTimeout(() => m.wrap.remove(), 260);
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
    const m = Modal.open({
      title, size: 'sm',
      body: `${text ? `<p class="dim">${esc(text)}</p>` : ''}${html}
        ${requireText ? `<div class="field mt-16"><span>Zur Bestätigung „${esc(requireText)}" eintippen</span><input class="input" id="cfmInput" autocomplete="off" autocapitalize="characters"></div>` : ''}`,
      foot: `<button class="btn btn-secondary" data-x="cancel">${esc(cancelLabel)}</button>
             <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-x="ok" ${requireText ? 'disabled' : ''}>${esc(okLabel)}</button>`,
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
window.addEventListener('scroll', () => { const p = $('#popover'); if (p && !p.hidden) p.hidden = true; }, { passive: true });

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
function beep() {
  if (!S().sound) return;
  try {
    unlockAudio();
    const ctx = audioCtx;
    if (!ctx) return;
    [0, 0.2, 0.4].forEach((d, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1320 : 880;
      const t = ctx.currentTime + d;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.2);
    });
  } catch (e) {}
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || S().confetti === false || S().motion === 'off') return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = [cssVar('--accent'), '#ffffff', '#ffb020', '#5aa9ff', '#ff6fae'];
  const parts = Array.from({ length: 130 }, () => ({
    x: W / 2 + (Math.random() - .5) * 60, y: H * .32, vx: (Math.random() - .5) * 15, vy: -Math.random() * 13 - 4,
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
    if (reg) await reg.showNotification(title, { body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'gymlog-rest', renotify: true, vibrate: [200, 100, 200] });
    else new Notification(title, { body, icon: 'icon-192.png' });
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
  lernio: GF + 'Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700',
  brutal: GF + 'Space+Grotesk:wght@400;500;600;700',
  soft: GF + 'Nunito:wght@400;600;700;800;900',
  iron: GF + 'Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700',
  neon: GF + 'Orbitron:wght@600;700;800',
  terminal: GF + 'JetBrains+Mono:wght@400;500;700;800'
};
const USER_FONTS = { rounded: GF + 'Nunito:wght@400;600;700;800;900', condensed: DESIGN_FONTS.iron };
/* surf = Kartenfarbe je Modus (für die Kontrast-Berechnung eigener Akzentfarben) */
const DESIGNS = [
  { id: 'gymlog', name: 'Trainio', desc: 'Ruhiges Graphit mit gedecktem Grün – klar und professionell', surf: { dark: '#15171b', light: '#ffffff' } },
  { id: 'glass', name: 'Liquid Glass', desc: 'Glas, Unschärfe & Licht – wie iOS 26', nav: 'floating', surf: { dark: '#25273b', light: '#f6f7fb' } },
  { id: 'lernio', name: 'Lernio', desc: 'Petrol & IBM Plex – wie deine Lernio-App', surf: { dark: '#151f1e', light: '#ffffff' } },
  { id: 'mono', name: 'Mono', desc: 'Schwarz-Weiß, OLED-schwarz & papierweiß', surf: { dark: '#0b0b0b', light: '#ffffff' } },
  { id: 'brutal', name: 'Brutal', desc: 'Dicke Kanten, harte Schatten, Sticker-Farben', surf: { dark: '#1d1d1d', light: '#fffdf7' } },
  { id: 'soft', name: 'Soft', desc: 'Weiche Schatten, alles rund', surf: { dark: '#252a35', light: '#e8ecf2' } },
  { id: 'iron', name: 'Iron', desc: 'Industrial-Gym: Stahl, Orange, Condensed', surf: { dark: '#191b1d', light: '#f6f5f2' } },
  { id: 'neon', name: 'Neon', desc: 'Synthwave: Pink, Cyan, Glow & Raster', surf: { dark: '#160a31', light: '#ffffff' } },
  { id: 'terminal', name: 'Terminal', desc: 'Monospace, Phosphor-Grün & Papier', surf: { dark: '#06140a', light: '#fbf9f3' } }
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
  return `--accent:${hex};--accent-text:${text};--accent-ink:${ink};--btn-ink:${ink};--accent-soft:rgba(${r},${g},${b},${mode === 'dark' ? .16 : .13});--accent-dim:${Color.mix(hex, surf, .42)};`;
}

function resolvedTheme() {
  const t = S().theme;
  if (t === 'system') return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  if (t === 'time') { const h = new Date().getHours(); return h >= 19 || h < 7 ? 'dark' : 'light'; }
  return t === 'light' ? 'light' : 'dark';
}
function lookAttrs(s = S()) {
  const D = designOf(s.design);
  return {
    'data-design': D.id,
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
  root.style.cssText = (accent ? accentCss(accent, mode, D.surf[mode]) : '') + (D.id === 'glass' ? `--glass-blur:${blur};` : '');
  const fonts = [DESIGN_FONTS[D.id], USER_FONTS[s.font]].filter(Boolean);
  fonts.forEach(ensureFont);
  const meta = $('meta[name="theme-color"]');
  if (meta) { const bg = cssVar('--bg'); meta.setAttribute('content', /^#/.test(bg) ? bg : (mode === 'light' ? '#f3f5f8' : '#0b0d10')); }
  try {
    localStorage.setItem(LS.theme, s.theme);
    localStorage.setItem(LS.look, JSON.stringify({
      theme: s.theme, attrs, fonts,
      accent: accent ? { light: accentCss(accent, 'light', D.surf.light), dark: accentCss(accent, 'dark', D.surf.dark) } : null,
      extra: D.id === 'glass' ? `--glass-blur:${blur};` : ''
    }));
  } catch (e) {}
  const sig = [mode, JSON.stringify(attrs), root.style.cssText].join('|');
  const changed = sig !== _lookSig;
  _lookSig = sig;
  if (changed && typeof Charts !== 'undefined') Charts.applyDefaults();
  return changed;
}
(mq => { const f = () => { if (S().theme === 'system' && applyTheme()) App.renderCurrent(); }; if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); })(matchMedia('(prefers-color-scheme: light)'));
setInterval(() => { if (S().theme === 'time' && applyTheme()) App.renderCurrent(); }, 60000);

/* Mini-Vorschau eines Designs (liest nur dessen Tokens) */
function designPreview(id, mode) {
  return `<div class="tp" data-design="${id}" data-theme="${mode}" aria-hidden="true">
    <div class="tp-title">${id === 'terminal' ? '&gt; trainio' : 'Trainio'}</div>
    <div class="tp-card"><div class="tp-line"></div><div class="tp-line s"></div>
      <div class="tp-row"><span class="tp-dot on"></span><span class="tp-dot"></span><span class="tp-btn"></span></div></div>
    <span class="tp-mode">${mode === 'dark' ? '☾' : '☀'}</span></div>`;
}
const designPair = id => `<div class="dt-pair">${designPreview(id, 'light')}${designPreview(id, 'dark')}</div>`;
const THEME_LABEL = { dark: 'Dunkel', light: 'Hell', system: 'System', time: 'Nach Uhrzeit' };

const stackLine = (title, sub, control) => `<div class="set-line stack"><div class="sl-main"><div class="sl-title">${title}</div>${sub ? `<div class="sl-sub">${sub}</div>` : ''}</div>${control}</div>`;
const LOOK_KEYS = ['design', 'theme', 'accent', 'wall', 'glassBlur', 'radius', 'font', 'textSize', 'density', 'contrast', 'navStyle', 'navLabels', 'startTab', 'motion', 'haptics', 'confetti', 'homeStats', 'homeRecent'];
function setLook(k, v) {
  if (k === 'homeRecent') v = +v;
  Store.saveSettings({ [k]: v });
  applyTheme();
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
  go(tab) {
    if (!Views[tab]) return;
    if (tab !== this.peek) this.peek = null;
    const changed = tab !== this.tab;
    // denselben Tab erneut antippen: der Tab darf selbst reagieren (z. B. Mehr → zurück zur Übersicht)
    if (!changed && Views[tab].reselect && Views[tab].reselect()) return;
    // Tab verlassen: der alte Tab darf aufräumen (z. B. Mehr → offene Gruppe schließen)
    if (changed && Views[this.tab] && Views[this.tab].leave) Views[this.tab].leave();
    // Richtung für die Einblendung: Tab weiter rechts in der Leiste → von rechts, sonst von links
    const order = visibleTabs().map(t => t[0]), from = order.indexOf(this.tab), to = order.indexOf(tab);
    const dir = from < 0 || to < 0 || to > from ? 'fwd' : 'back';
    this.tab = tab;
    UI.tab = tab;
    saveUI();
    $('#popover').hidden = true;
    this.renderCurrent();
    if (changed) {
      window.scrollTo({ top: 0 });
      fx($$('#bottomNav .nav-btn.active svg, #sidebar .side-btn.active svg'), 'fx-pop');
      fx($('#tab-' + tab), 'fx-pg-' + dir);
      countUp($$(`#tab-${tab} :is(${COUNT_SEL})`));
    }
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
Actions.exTabToggle = async () => {
  if (F('f_exercises')) {
    if (!await confirmDialog({ title: 'Übungen-Tab ausblenden?', text: 'Die Bibliothek bleibt erreichbar: beim Hinzufügen von Übungen und unter Mehr → Übungs-Bibliothek.', okLabel: 'Ausblenden' })) return;
    Store.saveSettings({ f_exercises: false });
    App.go('more');
    toast('Übungen-Tab ausgeblendet – wieder einblenden unter Mehr → Tabs & Funktionen', 'success', { duration: 4500 });
  } else {
    Store.saveSettings({ f_exercises: true });
    App.peek = null;
    App.renderCurrent();
    toast('Übungen-Tab wieder eingeblendet', 'success');
  }
};

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
  $('#sidebar').innerHTML = `<div class="brand"><img src="icon-192.png" alt="">${APP.name}</div>` +
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
window.addEventListener('scroll', () => { $('#topbar').classList.toggle('scrolled', scrollY > 4); document.body.classList.toggle('is-scrolled', scrollY > 4); }, { passive: true });

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


