/* ==========================================================================
   Trainio Service Worker
   WICHTIG: Bei JEDEM Deploy `python3 tools/release.py <version>` ausführen – zählt CACHE hoch und
   setzt ?v=<version> an CSS/JS in index.html. Sonst zeigt das iPhone ggf. noch alte Assets.
   ========================================================================== */
const CACHE = 'gymlog-v98';
/* Testversion des Umbaus unter …/test/ (eine zweite Kopie der App auf derselben Domain): Sie bekommt eigene Caches.
   Die echte App lässt alles unter /test/ in Ruhe und löscht nur ihre eigenen Caches. Gleiche Regel wie in js/core.js. */
const TESTVERSION = /\/test\/sw\.js$/.test(self.location.pathname);
const PREFIX = TESTVERSION ? 'trainio-test-' : 'gymlog-';
const CACHE_NAME = PREFIX + CACHE.slice('gymlog-'.length);
const TEST_PATH = new URL('test/', self.registration.scope).href;

const APP_SHELL = ['./', './index.html', './manifest.json', './icon.svg',
  ...['icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.json'].map(f => './icons/1/' + f),
  // Vorschaubilder aller App-Icons (Auswahl unter Darstellung)
  ...Array.from({ length: 6 }, (_, i) => `./icons/${i + 1}/icon-192.png`)];   // Anzahl = APP_ICONS in js/core.js
const CDN_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
];
// Design-Schriften (Google Fonts) ebenfalls cache-first → Designs funktionieren offline
const CDN_HOSTS = ['www.gstatic.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// Firestore-, Auth- und Google-API-Requests NIE cachen – außer den Schrift-Stylesheets (fonts.googleapis.com),
// sonst fehlt offline die Designschrift, sobald der normale Browser-Cache geleert ist
const BYPASS = /(firestore\.googleapis\.com|googleapis\.com|identitytoolkit|securetoken|firebaseinstallations|accounts\.google\.com|apis\.google\.com|\/__\/auth\/)/;
const bypass = url => BYPASS.test(url.href) && url.hostname !== 'fonts.googleapis.com';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // { cache: 'reload' }: am HTTP-Cache vorbei, damit HTML, CSS und JS sicher aus demselben Deploy stammen
    await cache.addAll(APP_SHELL.map(u => new Request(u, { cache: 'reload' })));
    // CSS/JS der App (mit ?v=…) direkt aus der index.html lesen und vorcachen → offline vollständig
    const html = await (await cache.match('./index.html')).text();
    const parts = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"]+)"/g)].map(m => './' + m[1]);
    await cache.addAll(parts.map(u => new Request(u, { cache: 'reload' })));
    // CDN-Libs einzeln vorcachen – ein Fehler soll die Installation nicht abbrechen
    await Promise.all(CDN_ASSETS.map(url =>
      cache.add(new Request(url, { mode: 'cors' })).catch(err => console.warn('[SW] nicht vorgecacht:', url, err))
    ));
  })());
  // Kein automatisches skipWaiting: die App zeigt „Neue Version – Neu laden" an.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (bypass(url)) return;
  if (!TESTVERSION && url.href.startsWith(TEST_PATH)) return;   // Testversion: gehört ihrem eigenen Service Worker

  // Navigation (HTML): network-first, Fallback auf Cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', res.clone());
        }
        return res;
      } catch (err) {
        return (await caches.match(req, { ignoreSearch: true }))
          || (await caches.match('./index.html'))
          || (await caches.match('./'))
          || Response.error();
      }
    })());
    return;
  }

  // Statische Assets (eigene + CDN-Libs): cache-first
  if (url.origin === self.location.origin || CDN_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreVary: true });
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    })());
  }
});

// Tipp auf die Pausen-Benachrichtigung → App in den Vordergrund holen
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length) return all[0].focus();
    return self.clients.openWindow('./');
  })());
});
