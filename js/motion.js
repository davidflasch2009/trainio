/* Trainio – Bewegung wie iOS: Seitenübergänge (View Transitions), Karten-Stapel hinter Menüs,
   kleiner Titel in der Leiste, Zurück-Wischen vom linken Rand
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

const Motion = (() => {
  const root = document.documentElement;
  let skipNext = false;

  /** Läuft der nächste Übergang animiert? (Animationen „Voll", Browser kann View Transitions) */
  const can = () => !skipNext && motionFull() && typeof document.startViewTransition === 'function' && !document.hidden;

  /** DOM ändern – als View Transition, sonst direkt. kind: 'tab' | 'push' | 'pop' | 'zoom' | 'morph' */
  function go(kind, update) {
    if (!skipNext && Edge.active()) Edge.cleanup();
    if (!can()) { skipNext = false; update(); return null; }
    root.dataset.vt = kind;
    const t = document.startViewTransition(update);
    t.ready.catch(() => {});   // abgebrochen, weil schon der nächste Übergang startet – kein Fehler
    t.finished.catch(() => {}).finally(() => { if (root.dataset.vt === kind) delete root.dataset.vt; });
    t.updateCallbackDone.catch(e => ErrLog.add(e, 'Übergang'));
    return t;
  }

  /* ---------- Karte wächst in ihr Fenster hinein (Workout → Detail, Übung → Details) und beim Schließen zurück ----------
     Die Seite (#app) bekommt dabei einen eigenen Namen, damit der Karten-Stapel mitanimiert wird. */
  const named = (els, name) => els.forEach(([el, n]) => { if (el) el.style.viewTransitionName = name ? n : ''; });
  function morph(el, open) {
    if (!el || !can()) return open();
    const sel = el.dataset.act && el.dataset.id ? `[data-act="${el.dataset.act}"][data-id="${CSS.escape(el.dataset.id)}"]` : null;
    const page = $('#app');
    let m = null;
    named([[el, 'morph'], [page, 'page']], true);
    document.body.classList.add('vt-now');
    const t = go('morph', () => {
      el.style.viewTransitionName = '';
      const before = Modal.top();
      open();
      m = Modal.top() !== before ? Modal.top() : null;
      if (!m) return;
      m.wrap.classList.add('open', 'no-anim');
      m.el.style.viewTransitionName = 'morph';
      m.morphSel = sel;
    });
    const done = () => { named([[el, 'morph'], [page, 'page']], false); document.body.classList.remove('vt-now'); if (m) { m.el.style.viewTransitionName = ''; m.wrap.classList.remove('no-anim'); } };
    if (t) t.finished.finally(done); else done();
  }
  /** Fenster schließt zurück in seine Karte – false, wenn die Karte nicht (mehr) sichtbar ist */
  function unmorph(m, close) {
    const src = m.morphSel && $(m.morphSel);
    if (!src || !can()) return false;
    const r = src.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || !r.width) return false;
    const page = $('#app');
    m.el.style.viewTransitionName = 'morph';
    page.style.viewTransitionName = 'page';
    document.body.classList.add('vt-now');
    const t = go('morph', () => { m.el.style.viewTransitionName = ''; close(); src.style.viewTransitionName = 'morph'; });
    const done = () => { src.style.viewTransitionName = ''; page.style.viewTransitionName = ''; document.body.classList.remove('vt-now'); };
    if (t) t.finished.finally(done); else done();
    return true;
  }

  /* ---------- Karten erscheinen nacheinander (beim Öffnen eines Tabs) ---------- */
  function stagger(tab) {
    if (!tab || !motionFull()) return;
    const items = [...tab.children].flatMap(c => c.matches('#progBody, #trainBody, #moreHome, .stagger-in') ? [...c.children] : [c]);
    let i = 0;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      if (r.top > innerHeight || i >= 9) break;
      el.style.setProperty('--i', i++);
      fx(el, 'fx-stag');
    }
  }

  /* ---------- Karten-Stapel: Menü von unten → Seite dahinter wird etwas kleiner (nur Handy) ---------- */
  const STACK = ['#app', '#bottomNav', '#restDock > .rest-dock', '#fabRoot > .fab'];
  let unstackTimer = null;
  function stack(on) {
    const b = document.body;
    const want = on && motionFull() && innerWidth < 700;
    if (want === b.classList.contains('sheet-stack')) return;
    clearTimeout(unstackTimer);
    if (want) {
      // jedes Element um die Bildschirmmitte skalieren, damit alles wie eine Karte wirkt
      for (const sel of STACK) {
        const el = $(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        el.style.transformOrigin = `${innerWidth / 2 - r.left}px ${innerHeight / 2 - r.top}px`;
      }
      b.classList.remove('sheet-unstack');
      b.classList.add('sheet-stack');
    } else {
      b.classList.replace('sheet-stack', 'sheet-unstack');
      unstackTimer = setTimeout(() => {
        b.classList.remove('sheet-unstack');
        for (const sel of STACK) { const el = $(sel); if (el) el.style.transformOrigin = ''; }
      }, 520);
    }
  }

  /* ---------- Kleiner Titel in der Leiste, sobald der große Titel weggescrollt ist ---------- */
  function topTitle(text) {
    const tb = $('#topbar');
    let t = $('.topbar-mini', tb);
    if (!text) { if (t) t.remove(); tb.classList.remove('show-title'); return; }
    if (!t) { t = document.createElement('span'); t.className = 'topbar-mini'; tb.appendChild(t); }
    t.textContent = text;
    syncTitle();
  }
  function syncTitle() {
    const tb = $('#topbar'), big = $('.tab.active .more-title');
    if (!tb || !$('.topbar-mini', tb)) return;
    tb.classList.toggle('show-title', !!big && big.getBoundingClientRect().bottom < tb.getBoundingClientRect().bottom - 4);
  }
  Scroll.el.addEventListener('scroll', syncTitle, { passive: true });

  /* ---------- Zurück-Wischen vom linken Bildschirmrand (Unterseiten im Mehr-Tab) ----------
     Nur in der installierten iPhone-App – im Browser und auf Android macht das System die Zurück-Geste.
     Ab der ersten Bewegung gehört die Geste uns (nichts scrollt nebenher), ein zweiter Finger bricht ab.
     Die ganze Inhaltsspalte folgt dem Finger, dahinter liegt die vorige Seite. */
  let edgeAlways = false;
  const edgeOn = () => edgeAlways || (isIOSDevice && isStandalone());
  const canBack = () => (App.tab === 'more' && !!moreSub) || (!!App.peek && App.peek === App.tab);
  const Edge = (() => {
    let g = null;   // laufende Geste: { state: 'track' | 'drag' | 'settle', x0, y0, dx, t0, page, under, raf, timer }
    const W = () => innerWidth;
    function begin() {
      const under = document.createElement('div');
      under.className = 'edge-under';
      // Seite dahinter: Mehr-Übersicht (bei Unterseiten an der Stelle, an der sie verlassen wurde; bei der Bibliothek
      // über „Mehr" von oben) – sonst nur der Hintergrund
      const sub = App.tab === 'more' && moreSub, lib = !!App.peek && App.peek === App.tab && !moreSub;
      if (sub || lib) {
        under.innerHTML = `<div class="view"><div class="search mt-8"><input class="input" type="search" placeholder="Einstellungen durchsuchen …" tabindex="-1">${icon('search')}</div>${moreHomeHtml(moreGroups())}</div>`;
        under.firstElementChild.style.transform = `translateY(${sub ? -moreScroll : 0}px)`;
      }
      $('#app').prepend(under);
      g.page = Scroll.el;
      g.under = under;
      g.page.classList.add('edge-drag');
    }
    function move(p) {
      if (!g || !g.page) return;
      g.page.style.transform = `translateX(${p * W()}px)`;
      g.under.style.transform = `translateX(${-30 * (1 - p)}%)`;
      g.under.style.setProperty('--shade', String(0.12 * (1 - p)));
    }
    function cleanup() {
      if (!g) return;
      cancelAnimationFrame(g.raf);
      clearTimeout(g.timer);
      if (g.page) { g.page.classList.remove('edge-drag', 'edge-anim'); g.page.style.transform = ''; }
      if (g.under) g.under.remove();
      g = null;
    }
    function settle(back) {
      if (!g || !g.page) { g = null; return; }
      const mine = g;
      g.state = 'settle';
      g.page.classList.add('edge-anim');
      g.under.classList.add('edge-anim');
      g.raf = requestAnimationFrame(() => move(back ? 1 : 0));
      g.timer = setTimeout(() => {
        if (g !== mine) return;
        if (!back) return cleanup();
        skipNext = true;
        if (App.tab === 'more' && moreSub) closeMoreSub(); else App.go('more');
        // zurück per history.back() kommt asynchron → aufräumen, sobald die Unterseite weg ist
        const t1 = Date.now();
        (function wait() {
          if (g !== mine) return;
          if (!canBack() || Date.now() - t1 > 700) { skipNext = false; cleanup(); }
          else g.raf = requestAnimationFrame(wait);
        })();
      }, 300);
    }
    document.addEventListener('touchstart', e => {
      if (g && g.state === 'drag' && e.touches.length > 1) return settle(false);   // zweiter Finger: abbrechen
      if (g || e.touches.length !== 1 || !edgeOn() || !canBack() || Modal.count() || W() >= 900) return;
      const t = e.touches[0];
      if (t.clientX > 22) return;
      g = { state: 'track', x0: t.clientX, y0: t.clientY, dx: 0, t0: Date.now(), page: null, under: null, raf: 0, timer: 0 };
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!g || g.state === 'settle') return;
      if (e.cancelable) e.preventDefault();   // am Rand: kein Scrollen nebenher (sonst verschiebt iOS die Seite mit)
      const t = e.touches[0], mx = t.clientX - g.x0, my = t.clientY - g.y0;
      if (g.state === 'track') {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (!(mx > 0 && Math.abs(mx) > Math.abs(my))) { g = null; return; }   // senkrecht oder nach links: keine Zurück-Geste
        g.state = 'drag';
        begin();
      }
      g.dx = Math.max(0, mx);
      move(g.dx / W());
    }, { passive: false });
    const end = cancel => {
      if (!g || g.state === 'settle') return;
      if (g.state === 'track') { g = null; return; }
      const v = g.dx / Math.max(1, Date.now() - g.t0);
      settle(!cancel && (g.dx > W() * 0.35 || v > 0.5));
    };
    document.addEventListener('touchend', e => { if (!e.touches.length) end(false); });
    document.addEventListener('touchcancel', () => end(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden && g) { skipNext = false; cleanup(); } });
    return {
      /** läuft gerade eine Geste (Seite verschoben)? */
      active: () => !!g && g.state !== 'track',
      cleanup
    };
  })();

  /* ---------- Seitwärts wischen zwischen Bereichen: Fortschritt (Übersicht, Kraft …) und Training (Pläne, Verlauf) ----------
     Der Inhalt folgt dem Finger; am ersten/letzten Bereich federt er nur nach. Diagramme, Chips, Kalender
     und Eingaben behalten ihre eigenen Gesten. */
  const SWIPE_SKIP = 'input, textarea, select, canvas, .chips, .hscroll, .seg, .table-wrap, .cal, .wo-strip, .fc-sets, [data-noswipe]';
  function areas() {
    if (App.tab === 'progress') return { list: progSubs().map(x => x[0]), cur: UI.progSub, body: $('#progBody'), set: v => { UI.progSub = v; } };
    if (App.tab === 'training' && !Workout.cur()) return { list: ['plans', 'history'], cur: UI.trainSub === 'history' ? 'history' : 'plans', body: $('#trainBody'), set: v => { UI.trainSub = v; } };
    return null;
  }
  function subSwipe() {
    const view = $('#view');
    let a = null, x0 = 0, y0 = 0, dx = 0, t0 = 0, lock = null, on = false;
    // Während des Wischens kein Neu-Zeichnen (z. B. durch Sync) – sonst springt der Inhalt unter dem Finger weg
    const release = () => { swipeActive = false; if (renderPending) { renderPending = false; App.renderCurrent(); } };
    const reset = body => { body.classList.remove('sub-drag'); body.classList.add('sub-anim'); body.style.transform = ''; body.style.opacity = ''; setTimeout(() => { body.classList.remove('sub-anim'); release(); }, 260); };
    view.addEventListener('touchstart', e => {
      on = false;
      if (e.touches.length !== 1 || Modal.count() || e.target.closest(SWIPE_SKIP)) return;
      a = areas();
      if (!a || !a.body || a.list.length < 2 || !a.body.contains(e.target)) return;
      const t = e.touches[0];
      x0 = t.clientX; y0 = t.clientY; dx = 0; t0 = Date.now(); lock = null; on = true;
    }, { passive: true });
    view.addEventListener('touchmove', e => {
      if (!on) return;
      const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
      if (lock == null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) lock = Math.abs(mx) > Math.abs(my) * 1.3 ? 'x' : 'no';
      if (lock !== 'x') { if (lock === 'no') on = false; return; }
      if (e.cancelable) e.preventDefault();
      swipeActive = true;
      const i = a.list.indexOf(a.cur), end = (mx > 0 && i <= 0) || (mx < 0 && i >= a.list.length - 1);
      dx = end ? mx * 0.25 : mx;
      a.body.classList.add('sub-drag');
      a.body.style.transform = `translateX(${dx}px)`;
      a.body.style.opacity = String(1 - Math.min(Math.abs(dx) / innerWidth, 1) * 0.6);
    }, { passive: false });
    view.addEventListener('touchend', () => {
      if (!on) return;
      on = false;
      if (lock !== 'x') return;
      const body = a.body, dir = dx < 0 ? 1 : -1, j = a.list.indexOf(a.cur) + dir;
      const fast = Math.abs(dx) / Math.max(1, Date.now() - t0) > 0.45 && Math.abs(dx) > 30;
      if (j < 0 || j >= a.list.length || !(Math.abs(dx) > innerWidth * 0.28 || fast)) return reset(body);
      body.classList.remove('sub-drag'); body.classList.add('sub-anim');
      body.style.transform = `translateX(${-dir * innerWidth * 0.5}px)`; body.style.opacity = '0';
      const next = a.list[j], set = a.set;
      setTimeout(() => {
        swipeActive = false; renderPending = false;
        set(next); saveUI(); App.renderCurrent();
        const nb = areas() && areas().body;
        if (nb) fx(nb, dir > 0 ? 'fx-sub-next' : 'fx-sub-prev');
        vibrate(6);
      }, 150);
    });
    view.addEventListener('touchcancel', () => { if (on && lock === 'x') reset(a.body); on = false; });
  }
  subSwipe();

  return {
    can, go, stack, topTitle, syncTitle, morph, unmorph, stagger,
    /** nächster Übergang ohne jede Animation (nach dem Zurück-Wischen ist die Seite schon weg) */
    get quiet() { return skipNext; },
    /** nur für den Test: Zurück-Wischen auch außerhalb der iPhone-App erlauben */
    set edgeAlways(v) { edgeAlways = !!v; }
  };
})();
