/* Trainio – Bewegung wie iOS: Seitenübergänge (View Transitions) für Unterseiten, Workout-Zoom und Design-Wechsel,
   kleiner Titel in der Leiste, Zurück-Wischen vom linken Rand, Wischen zwischen Bereichen
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

const Motion = (() => {
  const root = document.documentElement;
  let curVT = null;

  /** Läuft der nächste Übergang animiert? (Animationen „Voll", Browser kann View Transitions) */
  const can = () => motionFull() && typeof document.startViewTransition === 'function' && !document.hidden;

  /** DOM ändern – als View Transition, sonst direkt.
      kind: 'push' | 'pop' (Unterseite) · 'zoom' | 'zoomout' (Workout) · 'look' (Design) · null = ohne Übergang.
      Tab-Wechsel laufen wie bei iOS ohne Übergang – eine Überblendung lässt die Seite kurz zucken. */
  function go(kind, update) {
    if (!kind || !can()) { update(); return null; }
    if (Edge.active()) Edge.cleanup();
    const token = {};
    curVT = token;
    root.dataset.vt = kind;
    const t = document.startViewTransition(update);
    t.ready.catch(() => {});   // abgebrochen, weil schon der nächste Übergang startet – kein Fehler
    // nur der jeweils letzte Übergang räumt auf – sonst verliert ein schnell folgender seine Animation
    t.finished.catch(() => {}).finally(() => { if (curVT === token) { curVT = null; delete root.dataset.vt; } });
    t.updateCallbackDone.catch(e => ErrLog.add(e, 'Übergang'));
    return t;
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

  /* ---------- Zurück-Wischen vom linken Bildschirmrand (Unterseiten im Mehr-Tab, Bibliothek über „Mehr") ----------
     Nur in der installierten iPhone-App – im Browser und auf Android macht das System die Zurück-Geste.
     Sobald der Finger wischt, liegt eine Kopie der aktuellen Seite über allem und darunter steht schon die echte
     vorige Seite. Der Finger zieht nur die Kopie weg: Am Ende wird nichts mehr ausgetauscht, nichts flackert, und die
     echte Seite wird während der Geste nie verschoben. Abbrechen: Kopie gleitet zurück, die Seite wird wiederhergestellt. */
  let edgeAlways = false;
  const edgeOn = () => edgeAlways || (isIOSDevice && isStandalone());
  /** Wohin führt „zurück"? → { show, undo, done } oder null */
  function backTarget() {
    const v = Views[App.tab];
    if (v && v.edgeBack) { const b = v.edgeBack(); if (b) return b; }
    if (App.peek && App.peek === App.tab) {
      const tab = App.tab, y = Scroll.y;
      return {
        show: () => App.go('more', { instant: true }),
        undo: () => { App.peek = tab; App.go(tab, { instant: true }); Scroll.to(y); },
        done: () => {}
      };
    }
    return null;
  }
  const canBack = () => (App.tab === 'more' && !!moreSub) || (!!App.peek && App.peek === App.tab);
  /** Kopie der sichtbaren Seite: Leiste oben, Banner, aktiver Tab (ohne IDs – sonst fänden Abfragen die Kopie) */
  function snapshot() {
    const ghost = document.createElement('div');
    ghost.className = 'edge-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    const col = document.createElement('div');
    col.className = 'main-col';
    for (const n of Scroll.el.children) {
      if (n.id === 'sbShade') continue;
      if (n.id === 'view') {
        const v = n.cloneNode(false), tab = $('.tab.active', n);
        if (tab) { const c = tab.cloneNode(true); c.className = c.className.replace(/\b(tab|active)\b/g, '').trim(); v.appendChild(c); }
        col.appendChild(v);
      } else col.appendChild(n.cloneNode(true));
    }
    ghost.appendChild(col);
    const fab = $('#fabRoot > .fab');
    if (fab) ghost.appendChild(fab.cloneNode(true));
    if (document.body.classList.contains('is-scrolled')) { const sb = document.createElement('div'); sb.className = 'edge-sb'; ghost.appendChild(sb); }
    ghost.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    ghost.querySelectorAll('canvas').forEach(c => { c.style.visibility = 'hidden'; });
    return ghost;
  }
  const Edge = (() => {
    let g = null;   // laufende Geste: { state: 'track' | 'drag' | 'settle', x0, y0, dx, lx, lt, v, ghost, shade, back, y, timer }
    const W = () => innerWidth;
    function move(p) {
      g.ghost.style.transform = `translate3d(${(p * W()).toFixed(1)}px, 0, 0)`;
      g.shade.style.opacity = String(0.16 * (1 - p));
    }
    function begin() {
      const back = backTarget();
      if (!back) return false;
      const shade = document.createElement('div');
      shade.className = 'edge-shade';
      document.body.append(shade, g.ghost);
      g.ghost.firstElementChild.scrollTop = g.y;
      g.shade = shade;
      g.back = back;
      back.show();   // echte vorige Seite darunter zeichnen – die Kopie deckt alles ab
      return true;
    }
    function cleanup() {
      if (!g) return;
      clearTimeout(g.timer);
      if (g.state !== 'track') { g.ghost.remove(); if (g.shade) g.shade.remove(); }
      g = null;
    }
    function settle(commit) {
      const mine = g;
      g.state = 'settle';
      const p = g.dx / W(), dur = Math.round(clamp((commit ? 1 - p : p) * 420, 170, 340));
      const tr = `${dur}ms cubic-bezier(.32, .72, 0, 1)`;
      g.ghost.style.transition = `transform ${tr}`;
      g.shade.style.transition = `opacity ${tr}`;
      requestAnimationFrame(() => { if (g === mine) move(commit ? 1 : 0); });
      g.timer = setTimeout(() => {
        if (g !== mine) return;
        if (commit) { mine.back.done(); cleanup(); return; }
        // Abbrechen: Seite wiederherstellen, Kopie erst entfernen, wenn die echte Seite gezeichnet ist
        mine.back.undo();
        requestAnimationFrame(() => requestAnimationFrame(() => { if (g === mine) cleanup(); }));
      }, dur + 40);
    }
    document.addEventListener('touchstart', e => {
      if (g && g.state === 'drag' && e.touches.length > 1) return settle(false);   // zweiter Finger: abbrechen
      if (g || e.touches.length !== 1 || !edgeOn() || !canBack() || Modal.count() || W() >= 900) return;
      const t = e.touches[0];
      if (t.clientX > 22) return;
      // Kopie schon jetzt vorbereiten (noch nicht einfügen) – dann ruckelt der Start der Geste nicht
      g = { state: 'track', x0: t.clientX, y0: t.clientY, dx: 0, lx: t.clientX, lt: e.timeStamp, v: 0, ghost: snapshot(), shade: null, back: null, y: Scroll.y, timer: 0 };
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!g || g.state === 'settle') return;
      if (e.cancelable) e.preventDefault();   // am Rand: kein Scrollen nebenher
      const t = e.touches[0], mx = t.clientX - g.x0, my = t.clientY - g.y0;
      if (g.state === 'track') {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (!(mx > 0 && Math.abs(mx) > Math.abs(my))) { g = null; return; }   // senkrecht oder nach links: keine Zurück-Geste
        g.state = 'drag';
        if (!begin()) { g = null; return; }
      }
      const dt = Math.max(1, e.timeStamp - g.lt);
      g.v = g.v * 0.4 + ((t.clientX - g.lx) / dt) * 0.6;   // Geschwindigkeit (px/ms), leicht geglättet
      g.lx = t.clientX; g.lt = e.timeStamp;
      g.dx = Math.max(0, mx);
      move(g.dx / W());
    }, { passive: false });
    const end = (cancel, ts) => {
      if (!g || g.state === 'settle') return;
      if (g.state === 'track') { g = null; return; }
      const v = ts - g.lt > 90 ? 0 : g.v;   // Finger stand vor dem Loslassen still → keine Schwungkraft mehr
      // schnell nach rechts geschnippt oder weit genug gezogen (und nicht zurückgezogen) → zurück
      settle(!cancel && (v > 0.45 || (v > -0.15 && g.dx > W() * 0.4)));
    };
    document.addEventListener('touchend', e => { if (!e.touches.length) end(false, e.timeStamp); });
    document.addEventListener('touchcancel', e => end(true, e.timeStamp));
    // App verlassen mitten in der Geste: Seite wiederherstellen (ein schon losgelassenes Zurück läuft zu Ende)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden || !g || g.state === 'settle') return;
      if (g.state === 'drag') g.back.undo();
      cleanup();
    });
    return {
      /** läuft gerade eine Geste (Kopie liegt über der Seite)? */
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
      if (e.touches.length !== 1 || Modal.count() || Edge.active() || e.target.closest(SWIPE_SKIP)) return;
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
    can, go, topTitle, syncTitle,
    /** nur für den Test: Zurück-Wischen auch außerhalb der iPhone-App erlauben */
    set edgeAlways(v) { edgeAlways = !!v; }
  };
})();
