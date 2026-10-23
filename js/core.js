/* Trainio – Konstanten & Hilfsfunktionen
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   0. Konstanten
   ========================================================================== */
const APP = {
  name: 'Trainio',
  version: '1.27.6',
  repo: 'https://github.com/davidflasch2009/trainio',
  contact: 'https://github.com/davidflasch2009/trainio/issues'
};

const CDN = {
  fbApp: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  fbAuth: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  fbStore: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
};

const LS = {
  data: 'gymlog.v1',
  settings: 'gymlog.settings',
  theme: 'gymlog.theme',
  active: 'gymlog.activeWorkout',
  ui: 'gymlog.ui',
  look: 'gymlog.look',
  errors: 'gymlog.errors'
};

const KG_PER_LB = 0.45359237;
const CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Full Body'];
const EQUIPMENT = ['Langhantel', 'Kurzhantel', 'Kettlebell', 'Maschine', 'Kabel', 'Körpergewicht', 'Band'];
const MUSCLES = ['Brust', 'Schulter', 'Hintere Schulter', 'Trizeps', 'Bizeps', 'Unterarme', 'Rücken', 'Trapez',
  'Unterer Rücken', 'Bauch', 'Quadrizeps', 'Beinbeuger', 'Gesäß', 'Adduktoren', 'Abduktoren', 'Waden'];
/* Muskel-Regionen für die Übungs-Filter (Übungen-Tab, Übungs-Auswahl) – passt zu jedem Plan.
   Es zählt der Hauptmuskel (erster Eintrag); Cardio-Übungen landen immer bei „Cardio". */
const MUSCLE_REGIONS = [
  ['Brust', 'BR', ['Brust']],
  ['Rücken', 'RÜ', ['Rücken', 'Trapez', 'Unterer Rücken']],
  ['Schultern', 'SC', ['Schulter', 'Hintere Schulter']],
  ['Arme', 'AR', ['Bizeps', 'Trizeps', 'Unterarme']],
  ['Beine', 'BE', ['Quadrizeps', 'Beinbeuger', 'Gesäß', 'Adduktoren', 'Abduktoren', 'Waden']],
  ['Core', 'CO', ['Bauch']],
  ['Cardio', 'CA', []]
];
const REGION_NAMES = MUSCLE_REGIONS.map(r => r[0]);
/* App-Icons: je Icon ein Ordner icons/<id>/ mit icon-192/512.png, icon-maskable-192/512.png, apple-touch-icon.png
   und manifest.json. Eigene Icons: Bilder im Ordner ersetzen und hier den Namen anpassen. */
const APP_ICONS = ['1', '2', '3', '4', '5', '6'];   // ohne Namen – in der Auswahl nur das Bild
const iconId = () => { const v = String(S().appIcon || '1'); return APP_ICONS.includes(v) ? v : '1'; };
const iconSrc = (file = 'icon-192.png', id = iconId()) => `icons/${id}/${file}`;
const defSets = () => clamp(Math.round(+S().defSets || 3), 1, 10);
const defReps = () => String(S().defReps || '8-12');
const UNIT_TYPES = { kg: 'Gewicht × Wdh.', reps: 'Körpergewicht (Wdh.)', sec: 'Zeit (Sek.)', cardio: 'Cardio' };
const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const MEASURES = [
  ['chestCm', 'Brust'], ['waistCm', 'Taille'], ['hipCm', 'Hüfte'], ['armCm', 'Arm'],
  ['thighCm', 'Oberschenkel'], ['shoulderCm', 'Schulter'], ['neckCm', 'Nacken'], ['calfCm', 'Wade']
];

const DEFAULT_SETTINGS = {
  unit: 'kg',
  theme: 'dark',
  weekStart: 'monday',
  defaultRestSec: 120,
  weightSteps: 2.5,
  showRPE: true,
  notifyRestDone: true,
  // Eigene Ergänzungen
  activePlanId: '',
  weeklyGoal: 4,
  sex: 'm',
  sound: true,
  wakeLock: true,
  appIcon: '1',
  // Workout: Standard für neue Übungen, nächsten Satz vorbelegen, Nachfrage beim Beenden (always | open | never)
  defSets: 3, defReps: '8-12', carryNext: true, finishConfirm: 'always',
  // Auswertung: 1RM-Formel (epley | brzycki | avg), Standard-Zeitraum im Fortschritt ('last' = zuletzt gewählter)
  e1rmFormula: 'epley', progPeriod: 'last',
  // Pause: nach Aufwärmsätzen (Sek., 'same' = wie normal), nach Drop-Satz ('normal' | Sek.), Vorwarnung (Sek., 0 = aus), Ton
  restWarmSec: 60, restDropSec: 'normal', restWarnSec: 0, restSound: 'beep',
  // Startseite: Kacheln und Reihenfolge
  homeTiles: ['streak', 'volume', 'workouts', 'next'],
  // Meldungen oben (Toasts) je Gruppe – Bestätigungen standardmäßig aus
  toast_confirm: false, toast_workout: true, toast_pr: true, toast_sync: true, toast_update: true,
  prefillText: false,
  displayName: '',
  barKg: 20,
  warmupSteps: [[40, 5], [60, 3], [80, 2]],
  // Körper-Tab: standardmäßig nur Gewicht
  f_bodyFat: false,
  f_measures: false,
  f_photos: false,
  bwGoal: null,
  bwRate: null,   // Wochenziel ohne Phase: { type: 'bulk'|'cut'|'maintain', min, max } in kg/Woche
  warmupBar: true,
  platesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
  platesLb: [45, 35, 25, 10, 5, 2.5],
  // Darstellung
  design: 'gymlog',
  accent: '',
  wall: 'aurora',
  glassBlur: 'normal',
  radius: 'auto',
  font: 'auto',
  textSize: 'm',
  density: 'normal',
  contrast: false,
  navStyle: 'auto',
  navLabels: true,
  startTab: 'last',
  motion: 'full',
  haptics: true,
  confetti: true,
  homeStats: true,
  homeRecent: 3,
  // Workout-Ansicht
  woStyle: 'simple',
  woCollapse: true,
  simpleRPE: false,
  woView: 'list',
  woStrip: true,
  woPrev: true,
  autoRest: true,
  autoScroll: true
};

/* ==========================================================================
   1. Utilities
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, d = 1) => { const f = 10 ** d; return Math.round(v * f) / f; };
const sum = a => a.reduce((s, x) => s + (x || 0), 0);
const avg = a => a.length ? sum(a) / a.length : 0;
const maxOf = (a, f = x => x) => a.reduce((m, x) => Math.max(m, f(x)), -Infinity);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const uniq = a => [...new Set(a)];
/** Suche: Bindestriche/Satzzeichen zählen als Leerzeichen, alle Suchwörter müssen vorkommen
 *  („t bar" findet „T-Bar Rudern brustgestützt", „tbar" ebenfalls) */
const searchKey = s => norm(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function textMatches(fields, q) {
  const k = searchKey(q);
  if (!k) return true;
  const keys = fields.filter(Boolean).map(searchKey);
  const kc = k.replace(/ /g, ''), single = !k.includes(' ');
  for (const f of keys) {
    // ein Wort: irgendwo im Feld (wie bisher); mehrere Wörter: als Phrase ab Wortanfang
    if (single ? f.includes(k) : (' ' + f).includes(' ' + k)) return true;
    // zusammengeschrieben („tbar") ab einem Wortanfang
    const ws = f.split(' ');
    for (let i = 0; i < ws.length; i++) if (ws.slice(i).join('').startsWith(kc)) return true;
  }
  // mehrere Wörter in beliebiger Reihenfolge, auch über Felder hinweg („rudern brust")
  const words = k.split(' ');
  if (words.length > 1 && words.every(w => w.length >= 2)) { const hay = keys.join(' '); return words.every(w => hay.includes(w)); }
  return false;
}
const exMatches = (e, q, extra = []) => textMatches([e.name, ...(e.aliases || []), ...(e.muscleGroups || []), ...extra], q);
/** Namens-Schlüssel unabhängig von Wortreihenfolge und Satzzeichen */
const wordKey = s => norm(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').sort().join(' ');

function autoId() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const a = new Uint8Array(20);
  crypto.getRandomValues(a);
  let s = '';
  for (const b of a) s += c[b % 62];
  return s;
}

/** Zahl aus Eingabe lesen – akzeptiert Komma und Punkt (deutsche Tastatur) */
function parseNum(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const _nf = {};
function nf(v, d = 1) {
  if (v == null || !Number.isFinite(+v)) return '–';
  const f = _nf[d] || (_nf[d] = new Intl.NumberFormat('de-DE', { maximumFractionDigits: d }));
  return f.format(v);
}
const pct = (v, d = 0) => v == null || !Number.isFinite(v) ? '–' : nf(v * 100, d) + ' %';

/* ---------- Datum (lokal, ISO YYYY-MM-DD) ---------- */
const pad = n => String(n).padStart(2, '0');
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const isISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s)) && isoDate(parseISO(s)) === s;
/** Tag-Nummer seit Epoch (zeitzonenfrei) – Basis aller Zeitreihen */
const dayNum = s => { const [y, m, d] = String(s).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const dnToISO = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const todayDN = () => dayNum(isoDate());
const dowOfDN = n => new Date(n * 864e5).getUTCDay(); // 0 = So
const fmtDate = (s, o) => parseISO(s).toLocaleDateString('de-DE', o || { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtDN = (n, o) => fmtDate(dnToISO(n), o);
const fmtDateLong = s => parseISO(s).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDateShort = s => parseISO(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const WD_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function fmtDur(sec) {
  if (!sec) return '–';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
}
function relDays(dn) {
  const d = todayDN() - dn;
  if (d <= 0) return 'heute';
  if (d === 1) return 'gestern';
  if (d < 7) return `vor ${d} Tagen`;
  if (d < 14) return 'vor 1 Woche';
  if (d < 60) return `vor ${Math.floor(d / 7)} Wochen`;
  return `vor ${Math.floor(d / 30)} Monaten`;
}
/** Wochenstart (Mo/So je nach Einstellung) als Tag-Nummer */
function weekStartDN(n) {
  const ws = S().weekStart === 'sunday' ? 0 : 1;
  return n - ((dowOfDN(n) - ws + 7) % 7);
}
/** ISO-Kalenderwoche */
function isoWeek(n) {
  const d = new Date(n * 864e5);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThu) / 864e5 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return { year: d.getUTCFullYear(), week };
}
const isoWeekKey = n => { const w = isoWeek(n); return `${w.year}-W${pad(w.week)}`; };

/* ---------- Einheiten (intern immer kg) ---------- */
const unit = () => S().unit;
const toU = kg => kg == null ? null : (unit() === 'lb' ? kg / KG_PER_LB : kg);
const fromU = v => v == null ? null : (unit() === 'lb' ? v * KG_PER_LB : v);
const wNum = (kg, d = 1) => kg == null ? '–' : nf(toU(kg), d);
const fmtW = (kg, d = 1) => kg == null ? '–' : `${nf(toU(kg), d)} ${unit()}`;
function fmtTon(kg) {
  if (kg == null) return '–';
  const v = toU(kg);
  if (Math.abs(v) >= 10000) return `${nf(v / 1000, 1)} ${unit() === 'lb' ? 'k lb' : 't'}`;
  return `${nf(v, 0)} ${unit()}`;
}
/** Gewichtswert in aktueller Einheit runden (für Eingabefelder) */
const inputW = kg => kg == null ? '' : String(round(toU(kg), unit() === 'lb' ? 1 : 2)).replace('.', ',');

/* ---------- Scripts dynamisch laden (CDN) ---------- */
const _scripts = {};
function loadScript(src) {
  return _scripts[src] || (_scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = res;
    s.onerror = () => { delete _scripts[src]; s.remove(); rej(new Error('Script konnte nicht geladen werden: ' + src)); };
    document.head.appendChild(s);
  }));
}

function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function alpha(color, a) {
  const c = String(color || '').trim();
  const m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  return c;
}
function download(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function readFileText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsText(file); });
}
/** Lineare Regression (least squares) → { slope, intercept, r2 } */
function linReg(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = avg(points.map(p => p.x)), my = avg(points.map(p => p.y));
  let num = 0, den = 0, tot = 0;
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; tot += (p.y - my) ** 2; }
  if (!den) return null;
  const slope = num / den, intercept = my - slope * mx;
  const res = sum(points.map(p => (p.y - (slope * p.x + intercept)) ** 2));
  return { slope, intercept, r2: tot ? 1 - res / tot : 1 };
}
/* iPhone: Web-Apps können nicht vibrieren – ab iOS 18 erzeugt das Umschalten eines (unsichtbaren) iOS-Schalters
   ein kurzes Tippen. Wirkt nur direkt nach einer Berührung (z. B. Haken setzen), sonst passiert einfach nichts. */
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function iosTap() {
  const l = document.createElement('label'), i = document.createElement('input');
  l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
  i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
  // nicht bis zu den App-Klick-Handlern durchreichen (Popover/Dropdown schließen …)
  const stop = e => e.stopPropagation();
  l.addEventListener('click', stop); l.addEventListener('change', stop); l.addEventListener('input', stop);
  l.appendChild(i); document.head.appendChild(l); l.click(); l.remove();
}
const vibrate = p => { try { if (S().haptics === false) return; if (navigator.vibrate) navigator.vibrate(p); else if (isIOSDevice) iosTap(); } catch (e) {} };

/* ---------- Icons (inline SVG) ---------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  eyeOff: '<path d="M9.9 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.9 3.9M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 0-5.5 1-8.5z"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevU: '<path d="m6 15 6-6 6 6"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 11 3.5 3.5 0 0 1 18 18z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0L13 12"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M5.5 12.5h3l1.5-2.5 2 4 1.5-2h5"/>',
  fillIn: '<path d="M12 3v11M7.5 9.5 12 14l4.5-4.5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  dots: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h4"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9h14M12 9v6M9 21l3-6 3 6"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  install: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  skip: '<path d="M5 5v14l9-7zM18 5v14"/>',
  trendUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  trendDown: '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  fire: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 0-5.5 1-8.5z"/>'
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const GOOGLE_ICON = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const GITHUB_ICON = '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
