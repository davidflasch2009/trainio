/* ==========================================================================
   Design „Tag & Nacht": der Himmel als Hintergrund
   Sonnenauf- und -untergang aus Datum und Zeitzone (ohne Standort-Abfrage). Daraus vier Phasen –
   Dämmerung, Tag, Sonnenuntergang, Nacht – mit eigenen UI-Farben (CSS-Tokens je data-phase).
   Der Himmel dahinter (#sky in index.html) wandert fließend mit der Uhrzeit: Verlauf, Sonne,
   Mond mit echter Mondphase, Sterne, Wolken und Berge. Jede Himmelsfarbe wird so weit aufgehellt
   bzw. abgedunkelt, dass Text direkt auf dem Himmel lesbar bleibt.
   ========================================================================== */
const Sky = (() => {
  const PHASES = ['dawn', 'day', 'dusk', 'night'];
  const NAME = { dawn: 'Dämmerung', day: 'Tag', dusk: 'Sonnenuntergang', night: 'Nacht' };
  const THEME = { dawn: 'light', day: 'light', dusk: 'dark', night: 'dark' };
  // Text- und Nebentext-Farbe je Phase – wie --text/--text-dim in css/app.css (für die Lesbarkeit des Himmels)
  const INK = { dawn: ['#251d36', '#574c6c'], day: ['#0f2236', '#44607a'], dusk: ['#fff3ea', '#e2c6c0'], night: ['#eaf0fb', '#a9b6d0'] };
  const MIN = 6e4, HOUR = 36e5, DAY = 864e5;

  /* ---------- Ort: aus der Zeitzone geschätzt (keine Standort-Abfrage) ---------- */
  const PLACES = {
    'Europe/Vienna': [48.21, 16.37, 'Wien'], 'Europe/Berlin': [52.52, 13.4, 'Berlin'], 'Europe/Zurich': [47.38, 8.54, 'Zürich'],
    'Europe/Busingen': [47.7, 8.69, 'Büsingen'], 'Europe/Vaduz': [47.14, 9.52, 'Vaduz'], 'Europe/Luxembourg': [49.61, 6.13, 'Luxemburg'],
    'Europe/Rome': [41.9, 12.5, 'Rom'], 'Europe/Paris': [48.86, 2.35, 'Paris'], 'Europe/Amsterdam': [52.37, 4.9, 'Amsterdam'],
    'Europe/Brussels': [50.85, 4.35, 'Brüssel'], 'Europe/London': [51.51, -.13, 'London'], 'Europe/Dublin': [53.35, -6.26, 'Dublin'],
    'Europe/Madrid': [40.42, -3.7, 'Madrid'], 'Europe/Lisbon': [38.72, -9.14, 'Lissabon'], 'Europe/Prague': [50.08, 14.44, 'Prag'],
    'Europe/Bratislava': [48.15, 17.11, 'Bratislava'], 'Europe/Budapest': [47.5, 19.04, 'Budapest'], 'Europe/Ljubljana': [46.06, 14.51, 'Ljubljana'],
    'Europe/Zagreb': [45.81, 15.98, 'Zagreb'], 'Europe/Warsaw': [52.23, 21.01, 'Warschau'], 'Europe/Copenhagen': [55.68, 12.57, 'Kopenhagen'],
    'Europe/Stockholm': [59.33, 18.07, 'Stockholm'], 'Europe/Oslo': [59.91, 10.75, 'Oslo'], 'Europe/Helsinki': [60.17, 24.94, 'Helsinki'],
    'Europe/Athens': [37.98, 23.73, 'Athen'], 'Europe/Istanbul': [41.01, 28.98, 'Istanbul'], 'America/New_York': [40.71, -74.01, 'New York'],
    'America/Chicago': [41.88, -87.63, 'Chicago'], 'America/Los_Angeles': [34.05, -118.24, 'Los Angeles']
  };
  let _place = null;
  function place() {
    if (_place) return _place;
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const p = PLACES[tz];
    // unbekannte Zone: Breite 48°, Länge aus der Abweichung zu UTC im Januar (15° je Stunde)
    const east = -new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset() / 60;
    return (_place = p ? { lat: p[0], lng: p[1], name: p[2] } : { lat: 48, lng: east * 15, name: '' });
  }

  /* ---------- Sonnenstand (Standardformeln der Astronomie, auf Minuten genau) ---------- */
  const RAD = Math.PI / 180, J1970 = 2440588, J2000 = 2451545;
  /** Sonnenaufgang, -untergang und Mittagshöhe für den Tag um `ms` (Sonnenrand −0,833° inkl. Lichtbrechung) */
  function sunTimes(ms, lat, lng) {
    const lw = -lng * RAD, phi = lat * RAD, d = ms / DAY - .5 + J1970 - J2000;
    const n = Math.round(d - .0009 - lw / (2 * Math.PI));
    const ds = .0009 + lw / (2 * Math.PI) + n;
    const M = RAD * (357.5291 + .98560028 * ds);
    const L = M + RAD * (1.9148 * Math.sin(M) + .02 * Math.sin(2 * M) + .0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
    const dec = Math.asin(Math.sin(L) * Math.sin(RAD * 23.4397));
    const eq = .0053 * Math.sin(M) - .0069 * Math.sin(2 * L);
    const noon = J2000 + ds + eq;
    const elev = 90 - Math.abs(lat - dec / RAD);
    const cosW = (Math.sin(-.833 * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (!(cosW > -1 && cosW < 1)) return null;   // Polartag oder Polarnacht
    const set = J2000 + .0009 + (Math.acos(cosW) + lw) / (2 * Math.PI) + n + eq;
    const toMs = j => (j + .5 - J1970) * DAY;
    return { rise: toMs(2 * noon - set), set: toMs(set), elev };
  }
  const dayStart = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const nextDay = d0 => dayStart(d0 + 36 * HOUR);   // robust bei 23-/25-Stunden-Tagen (Zeitumstellung)
  const prevDay = d0 => dayStart(d0 - 12 * HOUR);
  const _sched = new Map();
  /** Phasen eines Kalendertags: Dämmerung ab 45 min vor Sonnenaufgang, Tag ab 60 min danach,
      Sonnenuntergang ab 50 min vor dem Untergang, Nacht ab 45 min danach */
  function schedule(d0) {
    if (_sched.has(d0)) return _sched.get(d0);
    const P = place();
    const t = sunTimes(d0 + 12 * HOUR, P.lat, P.lng) || { rise: d0 + 6.5 * HOUR, set: d0 + 18 * HOUR, elev: 30 };
    const s = { rise: t.rise, set: t.set, elev: t.elev, dawn: t.rise - 45 * MIN, day: t.rise + 60 * MIN, dusk: t.set - 50 * MIN, night: t.set + 45 * MIN };
    if (s.day > s.dusk) s.day = s.dusk = (s.rise + s.set) / 2;
    if (_sched.size > 12) _sched.clear();
    _sched.set(d0, s);
    return s;
  }
  /** Phase zum Zeitpunkt t: Name, Grenzen a–b und Position 0–4 (Phase + Anteil) für den Himmels-Verlauf */
  function state(t) {
    const d0 = dayStart(t), s = schedule(d0);
    let ph, a, b;
    if (t < s.dawn) { ph = 'night'; a = schedule(prevDay(d0)).night; b = s.dawn; }
    else if (t < s.day) { ph = 'dawn'; a = s.dawn; b = s.day; }
    else if (t < s.dusk) { ph = 'day'; a = s.day; b = s.dusk; }
    else if (t < s.night) { ph = 'dusk'; a = s.dusk; b = s.night; }
    else { ph = 'night'; a = s.night; b = schedule(nextDay(d0)).dawn; }
    const f = b > a ? (t - a) / (b - a) : 0;
    return { ph, a, b, f, pos: PHASES.indexOf(ph) + f, s, d0 };
  }

  /* ---------- Mond ---------- */
  /** Mondalter 0–1 (0 Neumond, .5 Vollmond): mittlerer synodischer Monat ab dem Neumond vom 6.1.2000 */
  const moonAge = t => (((t / DAY + 2440587.5 - 2451550.1) / 29.530588853) % 1 + 1) % 1;
  function moonInfo(t) {
    const p = moonAge(t), pct = Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100);
    const name = p < .03 || p > .97 ? 'Neumond' : p < .22 ? 'zunehmende Sichel' : p < .28 ? 'zunehmender Halbmond' : p < .47 ? 'zunehmend'
      : p < .53 ? 'Vollmond' : p < .72 ? 'abnehmend' : p < .78 ? 'abnehmender Halbmond' : 'abnehmende Sichel';
    return { p, pct, name };
  }
  /** Beleuchteter Teil als SVG-Pfad (Kreis r um 0,0): äußere Hälfte + Schattengrenze als Halb-Ellipse */
  function moonPath(p, r = 18) {
    const rx = (r * Math.abs(Math.cos(2 * Math.PI * p))).toFixed(2), waxing = p < .5, crescent = p < .25 || p > .75;
    return `M0 ${-r}A${r} ${r} 0 0 ${waxing ? 1 : 0} 0 ${r}A${rx} ${r} 0 0 ${waxing === crescent ? 0 : 1} 0 ${-r}Z`;
  }

  /* ---------- Farben des Himmels ---------- */
  /* Stützpunkte über die Position 0–4 (Dämmerung, Tag, Sonnenuntergang, Nacht; .43 = Sonnenaufgang, 2.53 = Sonnenuntergang).
     top/up/low/hor: Verlauf von oben bis zum Horizont, far/near: Berge, cloud: Wolken, stars: Sterne 0–1 */
  const K = [
    [0, { top: '#26336b', up: '#56578f', low: '#b9809f', hor: '#f0a48e', far: '#4c4a80', near: '#2d2b58', cloud: '#a98aae', stars: .45 }],
    [.43, { top: '#5670b6', up: '#a197cd', low: '#f0adbb', hor: '#ffd0a4', far: '#8c86b8', near: '#5d5890', cloud: '#ffd9df', stars: 0 }],
    [1, { top: '#5b95dc', up: '#93bdea', low: '#cbe1f5', hor: '#f4e8dc', far: '#9ab2d0', near: '#7895bb', cloud: '#ffffff', stars: 0 }],
    [1.5, { top: '#3f8ae2', up: '#6daff0', low: '#a6d2f8', hor: '#e0f0ff', far: '#a6c0dc', near: '#83a1c6', cloud: '#ffffff', stars: 0 }],
    [2, { top: '#4a78c0', up: '#9da5cf', low: '#f0c39e', hor: '#ffcf8c', far: '#9a9cbc', near: '#6c7097', cloud: '#ffe6c8', stars: 0 }],
    [2.53, { top: '#33296b', up: '#853d84', low: '#e2606a', hor: '#ff9d4f', far: '#58345f', near: '#301c43', cloud: '#f08a86', stars: .05 }],
    [3, { top: '#121640', up: '#2b2263', low: '#5b356e', hor: '#974c69', far: '#271b45', near: '#150f2a', cloud: '#4d3a6a', stars: .65 }],
    [3.5, { top: '#04070f', up: '#08122a', low: '#0f1f3d', hor: '#19294b', far: '#0d1630', near: '#060b1c', cloud: '#1c2747', stars: 1 }]
  ];
  const lerp = (a, b, k) => a + (b - a) * k;
  function raw(pos) {
    pos = ((pos % 4) + 4) % 4;
    let i = K.length - 1;
    while (i > 0 && K[i][0] > pos) i--;
    const [p0, A] = K[i], [p1, B] = K[(i + 1) % K.length], span = (p1 > p0 ? p1 : p1 + 4) - p0;
    const k = span ? (pos - p0) / span : 0, o = {};
    for (const key in A) o[key] = typeof A[key] === 'number' ? lerp(A[key], B[key], k) : Color.mix(A[key], B[key], k);
    return o;
  }
  /* Himmel hinter Text: Richtung Weiß (helle Phasen) bzw. Nachtblau (dunkle) mischen, bis Text darauf lesbar ist.
     strict (oberer Himmel, dort stehen Titel und Datum): Text 7:1, Nebentext 4,5:1 – sonst 4,5:1 und 3:1 */
  function legible(c, ph, strict) {
    const [tx, dim] = INK[ph], toward = THEME[ph] === 'light' ? '#ffffff' : '#05070f', need = strict ? [7, 4.5] : [4.5, 3];
    let out = c;
    for (let k = .04; k <= 1 && (Color.contrast(tx, out) < need[0] || Color.contrast(dim, out) < need[1]); k += .04) out = Color.mix(c, toward, k);
    return out;
  }
  /* Höhe am Himmel (vh von oben) für den Anteil p des Bogens: 84 = Horizont hinter den Bergen */
  const arcY = (p, h) => 84 - 70 * h * Math.sin(Math.PI * clamp(p, -.12, 1.12));
  /** Alles, was den Himmel zum Zeitpunkt t ausmacht */
  function compute(t) {
    const st = state(t), ph = st.ph, s = st.s, c = raw(st.pos);
    const sky = { top: legible(c.top, ph, true), up: legible(c.up, ph, true), low: legible(c.low, ph, false), hor: legible(c.hor, ph, false),
      far: legible(c.far, ph, false), near: legible(c.near, ph, false), cloud: legible(c.cloud, ph, false), stars: THEME[ph] === 'dark' ? c.stars : c.stars * .5 };
    // Sonne: Bogen von links (Aufgang) nach rechts (Untergang), im Winter flacher; unter dem Horizont hinter den Bergen
    const p = (t - s.rise) / (s.set - s.rise), h = clamp(s.elev / 62, .32, 1), lift = Math.sin(Math.PI * clamp(p, 0, 1));
    const sun = { x: 8 + 84 * clamp(p, -.1, 1.1), y: arcY(p, h), o: p > -.12 && p < 1.12 ? 1 : 0,
      col: Color.mix('#ffa560', '#fff6dc', clamp(lift * 2.2, 0, 1)) };
    // Mond: läuft durch die Nacht – vom Sonnenuntergang bis zum nächsten Aufgang
    const night = t >= s.set ? [s.set, schedule(nextDay(st.d0)).rise] : [schedule(prevDay(st.d0)).set, s.rise];
    const q = (t - night[0]) / (night[1] - night[0]), mi = moonInfo(t);
    // flacher Bogen oben am Himmel – tiefer stünde er die ganze Nacht hinter den Karten
    const moon = { x: 10 + 80 * q, y: 30 - 20 * Math.sin(Math.PI * clamp(q, 0, 1)), o: mi.pct < 3 ? 0 : clamp(sky.stars * 1.6, 0, 1), p: mi.p };
    // Licht um die Sonne: am Horizont kräftig, mittags zart; nachts ein Hauch um den Mond
    const low = 1 - lift, dark = THEME[ph] === 'dark';
    const glow = sun.o ? { x: sun.x, y: sun.y, col: legible(Color.mix(sun.col, dark ? '#ff6a3a' : '#ffe9c4', low * .6), ph, false), a: dark ? .5 * low + .1 : .35 + .3 * low }
      : { x: moon.x, y: moon.y, col: legible('#3a4c80', ph, false), a: .35 * moon.o };
    return { st, ph, sky, sun, moon, glow, cloudA: dark ? .45 : ph === 'dawn' ? .75 : .9 };
  }

  /* ---------- Zeit (der Zeitraffer spielt eine eigene Uhr ab) ---------- */
  let lapse = null;
  const now = () => lapse ? lapse.t : Date.now();
  const phase = () => state(now()).ph;
  const theme = () => THEME[phase()];

  /* ---------- Malen ---------- */
  const VARS = ['top', 'up', 'low', 'hor', 'far', 'near', 'cloud'];
  let _stars = false;
  /* Sterne: drei Ebenen (klein, mittel, hell) mit festem Muster, als box-shadow eines Punkts – sehr günstig zu zeichnen */
  function starField() {
    if (_stars) return;
    const ls = document.querySelectorAll('#sky .sky-stars i');
    if (!ls.length) return;
    _stars = true;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    [62, 30, 12].forEach((n, i) => { if (ls[i]) ls[i].style.boxShadow = Array.from({ length: n }, () => `${(rnd() * 100).toFixed(1)}vw ${(rnd() * 70).toFixed(1)}vh rgba(255,255,255,${(.55 + rnd() * .45).toFixed(2)})`).join(','); });
  }
  const pct = v => v.toFixed(2) + '%';
  function paint(t = now()) {
    const c = compute(t), b = document.body, set = (k, v) => b.style.setProperty(k, v);
    VARS.forEach(k => set('--sk-' + k, c.sky[k]));
    set('--sk-stars', c.sky.stars.toFixed(3)); set('--sk-cloud-a', c.cloudA);
    set('--sk-sun', c.sun.col); set('--sun-x', pct(c.sun.x)); set('--sun-y', c.sun.y.toFixed(2) + 'vh'); set('--sun-o', c.sun.o);
    set('--moon-x', pct(c.moon.x)); set('--moon-y', c.moon.y.toFixed(2) + 'vh'); set('--moon-o', c.moon.o.toFixed(3));
    set('--sk-glow', c.glow.col); set('--sk-glow-a', c.glow.a.toFixed(3)); set('--glow-x', pct(c.glow.x)); set('--glow-y', c.glow.y.toFixed(2) + 'vh');
    const lit = document.querySelector('#sky .sky-moon .lit');
    if (lit) lit.setAttribute('d', moonPath(c.moon.p));
    return c;
  }
  /** Von applyTheme: Himmel einschalten und malen – bzw. Variablen wieder entfernen */
  function sync(on) {
    if (on) { starField(); paint(); return; }
    const b = document.body;
    if (b && b.style.getPropertyValue('--sk-top')) [...b.style].filter(k => /^--(sk|sun|moon|glow)-/.test(k)).forEach(k => b.style.removeProperty(k));
  }
  /* Grenzen des heutigen Tags in Minuten – für das Startskript in index.html (Phase vor dem ersten Bild) */
  function bounds() {
    const t = Date.now(), s = schedule(dayStart(t)), d0 = dayStart(t);
    return PHASES.map(p => Math.round((s[p] - d0) / MIN));
  }

  /* ---------- Wechsel der Phase: jede Minute prüfen, sanft überblenden ---------- */
  function tick() {
    if (lapse || typeof App === 'undefined' || S().design !== 'sky') return;
    paint();
    if (phase() === document.documentElement.dataset.phase) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;   // nicht mitten in einer Eingabe – nächste Minute
    const go = () => switchLook(() => {});
    const root = document.documentElement;
    if (document.startViewTransition && !root.dataset.motion && document.visibilityState === 'visible') {
      root.classList.add('sky-fade');
      try { document.startViewTransition(go).finished.finally(() => root.classList.remove('sky-fade')); } catch (e) { root.classList.remove('sky-fade'); go(); }
    } else go();
  }
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });

  /* ---------- Zeitraffer: ein ganzer Tag in 12 Sekunden, jede Phase gleich lang ---------- */
  const fmt = ms => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  function timelapse() {
    if (lapse || S().design !== 'sky') return;
    const root = document.documentElement, t0 = Date.now(), p0 = performance.now(), dur = 12000;
    const segs = [];
    for (let i = 0, t = t0; i < 5; i++) { const st = state(t); segs.push(st); t = st.b; }
    const P0 = segs[0].pos, base = Math.floor(P0);
    lapse = { t: t0 };
    root.classList.add('sky-lapse');
    const frame = () => {
      const k = Math.min(1, (performance.now() - p0) / dur), P = P0 + 4 * k;
      const sg = segs[Math.min(4, Math.floor(P) - base)], f = P - Math.floor(P);
      lapse.t = k >= 1 ? t0 + DAY : sg.a + f * (sg.b - sg.a);
      paint(lapse.t);
      const ph = state(lapse.t).ph;
      if (ph !== root.dataset.phase) {
        root.dataset.phase = ph; root.dataset.theme = THEME[ph];
        const ac = S().accent;
        root.style.cssText = Color.valid(ac) ? accentCss(ac, THEME[ph], designOf('sky').surf[ph]) : '';
      }
      lapseUi(lapse.t, ph);
      if (k < 1 && S().design === 'sky' && document.visibilityState === 'visible') requestAnimationFrame(frame);
      else {
        lapse = null; root.classList.remove('sky-lapse');
        const box = document.querySelector('.sky-set');   // Band, Phasen und Knopf zurück auf jetzt (die Seite selbst ändert sich nicht)
        if (box) box.outerHTML = settingsHtml();
        switchLook(() => {});
      }
    };
    requestAnimationFrame(frame);
  }
  function lapseUi(t, ph) {
    const m = document.querySelector('.sky-strip .sky-now'), btn = document.querySelector('[data-act="skyLapse"]');
    if (m) m.style.left = pct(((t - dayStart(t)) / DAY) * 100);
    if (btn) { btn.innerHTML = `${icon(THEME[ph] === 'dark' ? 'moon' : 'sun')} ${fmt(t)} · ${NAME[ph]}`; }
    document.querySelectorAll('.sky-ph').forEach(e => e.classList.toggle('on', e.dataset.ph === ph));
  }
  Actions.skyLapse = () => timelapse();

  /* ---------- Darstellung: Tageszeit statt Hell/Dunkel ---------- */
  /** Farbband über 24 Stunden – so sieht der Himmel heute aus */
  function stripCss(d0) {
    const stops = [];
    for (let i = 0; i <= 48; i++) { const c = raw(state(d0 + i * DAY / 48).pos); stops.push(`${Color.mix(c.up, c.low, .5)} ${(i / 48 * 100).toFixed(1)}%`); }
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }
  function settingsSub() {
    const P = place();
    return `Wechselt von selbst mit dem Sonnenstand – Hell und Dunkel ergeben sich aus der Tageszeit. ${P.name ? `Sonnenzeiten für ${P.name}` : 'Sonnenzeiten'}, geschätzt aus deiner Zeitzone.`;
  }
  function settingsHtml() {
    const t = Date.now(), st = state(t), s = st.s, mi = moonInfo(t);
    return `<div class="sky-set">
      <div class="sky-strip" style="background:${stripCss(st.d0)}"><i class="sky-now" style="left:${pct((t - st.d0) / DAY * 100)}"></i></div>
      <div class="sky-hours"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
      <div class="sky-phs">${PHASES.map(p => `<div class="sky-ph ${p === st.ph ? 'on' : ''}" data-ph="${p}"><i></i><b>${NAME[p]}</b><span>ab ${fmt(s[p])}</span></div>`).join('')}</div>
      <div class="sky-meta"><span>${icon('sunrise')}${fmt(s.rise)}</span><span>${icon('sunset')}${fmt(s.set)}</span><span>${icon('moon')}${esc(mi.name)} · ${mi.pct} %</span></div>
      <button class="btn btn-secondary btn-sm" data-act="skyLapse">${icon('play')} Zeitraffer: ein Tag in 12 Sekunden</button>
    </div>`;
  }
  /** Zeile unter dem Datum auf der Startseite: nächster Sonnenauf- oder -untergang */
  function startLine() {
    const t = Date.now(), d0 = dayStart(t), s = schedule(d0);
    const [ic, label, ms] = t < s.rise ? ['sunrise', 'Sonnenaufgang um', s.rise] : t < s.set ? ['sunset', 'Sonnenuntergang um', s.set]
      : ['sunrise', 'Sonnenaufgang morgen um', schedule(nextDay(d0)).rise];
    return `<div class="sky-next">${icon(ic)}<span>${label} ${fmt(ms)}</span></div>`;
  }

  /* ---------- Teilen-Bild: derselbe Himmel auf der Leinwand ---------- */
  const HILLS = {
    far: 'M0 300V170C60 160 110 120 170 112S260 140 320 128 420 70 500 78 600 132 680 126 780 88 860 96 980 140 1050 130 1150 104 1200 112V300Z',
    near: 'M0 300V226C80 214 150 196 240 200S400 236 500 228 650 190 760 194 900 230 1000 222 1130 196 1200 204V300Z'
  };
  function drawShare(x, W, H) {
    // Sonne und Mond nicht hinter den Score-Ring in der Bildmitte legen (er steht etwa im zweiten Viertel)
    const side = (px, py) => py > 18 && py < 52 && px > 28 && px < 72 ? (px < 50 ? 16 : 84) : px;
    const c = compute(now()), withA = (col, a) => { const [r, g, b] = Color.rgb(col); return `rgba(${r},${g},${b},${a})`; };
    const g = x.createLinearGradient(0, 0, 0, H);
    [[0, 'top'], [.36, 'up'], [.7, 'low'], [1, 'hor']].forEach(([o, k]) => g.addColorStop(o, c.sky[k]));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const gx = side(c.glow.x, c.glow.y) / 100 * W, gy = c.glow.y / 100 * H, gr = x.createRadialGradient(gx, gy, 0, gx, gy, H * .6);
    gr.addColorStop(0, withA(c.glow.col, c.glow.a)); gr.addColorStop(1, withA(c.glow.col, 0));
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    if (c.sky.stars > .05) {
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 104; i++) { const sx = rnd() * W, sy = rnd() * H * .7, a = (.55 + rnd() * .45) * c.sky.stars; x.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; x.beginPath(); x.arc(sx, sy, i < 62 ? 1.8 : i < 92 ? 2.6 : 3.6, 0, Math.PI * 2); x.fill(); }
    }
    if (c.sun.o) {
      const sx = side(c.sun.x, c.sun.y) / 100 * W, sy = c.sun.y / 100 * H, sg = x.createRadialGradient(sx, sy, 0, sx, sy, 150);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(.2, c.sun.col); sg.addColorStop(.36, withA(c.sun.col, .5)); sg.addColorStop(1, withA(c.sun.col, 0));
      x.fillStyle = sg; x.fillRect(sx - 150, sy - 150, 300, 300);
    } else if (c.moon.o) {
      const mx = side(c.moon.x, c.moon.y) / 100 * W, my = c.moon.y / 100 * H;
      x.save(); x.translate(mx, my); x.scale(2.6, 2.6);
      x.fillStyle = `rgba(200,212,240,${(.12 * c.moon.o).toFixed(3)})`; x.beginPath(); x.arc(0, 0, 18, 0, Math.PI * 2); x.fill();
      x.shadowColor = 'rgba(220,230,255,.6)'; x.shadowBlur = 16; x.fillStyle = withA('#eef2fb', c.moon.o); x.fill(new Path2D(moonPath(c.moon.p)));
      x.restore();
    }
    x.save(); x.translate(0, H * .8); x.scale(W / 1200, H * .2 / 300);
    x.fillStyle = c.sky.far; x.fill(new Path2D(HILLS.far)); x.fillStyle = c.sky.near; x.fill(new Path2D(HILLS.near));
    x.restore();
  }

  return { PHASES, NAME, THEME, INK, phase, theme, state, paint, sync, bounds, compute, raw, legible, moonInfo, moonPath, place, schedule,
    settingsSub, settingsHtml, startLine, drawShare, timelapse, now };
})();
