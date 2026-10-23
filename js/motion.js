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
    if (!can()) { skipNext = false; update(); return false; }
    root.dataset.vt = kind;
    const t = document.startViewTransition(update);
    t.ready.catch(() => {});   // abgebrochen, weil schon der nächste Übergang startet – kein Fehler
    t.finished.catch(() => {}).finally(() => { if (root.dataset.vt === kind) delete root.dataset.vt; });
    t.updateCallbackDone.catch(e => ErrLog.add(e, 'Übergang'));
    return true;
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
  window.addEventListener('scroll', syncTitle, { passive: true });

  /* ---------- Zurück-Wischen vom linken Bildschirmrand (Unterseiten im Mehr-Tab) ----------
     Nur in der installierten iPhone-App – im Browser und auf Android macht das System die Zurück-Geste. */
  const edgeOn = () => edgeAlways || (isIOSDevice && isStandalone());
  let edgeAlways = false;
  const canBack = () => (App.tab === 'more' && !!moreSub) || (!!App.peek && App.peek === App.tab);
  function edgeBack() {
    let x0 = 0, y0 = 0, dx = 0, t0 = 0, on = false, lock = null, page = null, under = null;
    const W = () => innerWidth;
    function begin() {
      page = $('#view');
      under = document.createElement('div');
      under.className = 'edge-under';
      // Seite dahinter: Mehr-Übersicht (bei Unterseiten) – sonst nur der Hintergrund
      if (App.tab === 'more' && moreSub) {
        under.innerHTML = `<div class="view"><div class="search mt-8"><input class="input" type="search" placeholder="Einstellungen durchsuchen …" tabindex="-1">${icon('search')}</div>${moreHomeHtml(moreGroups())}</div>`;
        const inner = under.firstElementChild;
        inner.style.transform = `translateY(${$('#topbar').offsetHeight - moreScroll}px)`;
      }
      document.body.appendChild(under);
      page.classList.add('edge-drag');
    }
    function move(p) {
      page.style.transform = `translateX(${p * W()}px)`;
      under.style.transform = `translateX(${-30 * (1 - p)}%)`;
      under.style.setProperty('--shade', String(0.12 * (1 - p)));
    }
    function cleanup() {
      if (page) { page.classList.remove('edge-drag', 'edge-anim'); page.style.transform = ''; }
      if (under) under.remove();
      page = under = null;
    }
    function finish(back) {
      page.classList.add('edge-anim'); under.classList.add('edge-anim');
      requestAnimationFrame(() => move(back ? 1 : 0));
      setTimeout(() => {
        if (!back) return cleanup();
        skipNext = true;
        if (App.tab === 'more' && moreSub) closeMoreSub(); else App.go('more');
        // zurück per history.back() kommt asynchron → aufräumen, sobald die Unterseite weg ist
        const t1 = Date.now();
        (function wait() { if (!canBack() || Date.now() - t1 > 600) { skipNext = false; cleanup(); } else requestAnimationFrame(wait); })();
      }, 300);
    }
    document.addEventListener('touchstart', e => {
      on = false;
      if (e.touches.length !== 1 || !edgeOn() || !canBack() || Modal.count() || W() >= 900 || page) return;
      const t = e.touches[0];
      if (t.clientX > 24) return;
      x0 = t.clientX; y0 = t.clientY; dx = 0; t0 = Date.now(); lock = null; on = true;
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!on) return;
      const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
      if (lock == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
        lock = Math.abs(mx) > Math.abs(my) && mx > 0 ? 'x' : 'no';
        if (lock === 'x') begin();
      }
      if (lock !== 'x') { if (lock === 'no') on = false; return; }
      e.preventDefault();
      dx = Math.max(0, mx);
      move(dx / W());
    }, { passive: false });
    const end = cancel => {
      if (!on) return;
      on = false;
      if (lock !== 'x' || !page) return;
      const v = dx / Math.max(1, Date.now() - t0);
      finish(!cancel && (dx > W() * 0.35 || v > 0.5));
    };
    document.addEventListener('touchend', () => end(false));
    document.addEventListener('touchcancel', () => end(true));
  }
  edgeBack();

  return {
    can, go, stack, topTitle, syncTitle,
    /** nächster Übergang ohne jede Animation (nach dem Zurück-Wischen ist die Seite schon weg) */
    get quiet() { return skipNext; },
    /** nur für den Test: Zurück-Wischen auch außerhalb der iPhone-App erlauben */
    set edgeAlways(v) { edgeAlways = !!v; }
  };
})();
