/* ==========================================================================
   Trainio Service Worker
   WICHTIG: CACHE bei JEDEM Deploy hochzählen (gymlog-v2, gymlog-v3, …),
   sonst zeigt das iPhone ggf. noch alte Assets.
   ========================================================================== */
const CACHE = 'gymlog-v18';

const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './icon.svg'];
const CDN_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
];
// Design-Schriften (Google Fonts) ebenfalls cache-first → Designs funktionieren offline
const CDN_HOSTS = ['www.gstatic.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// Firestore-, Auth- und Google-API-Requests NIE cachen
const BYPASS = /(firestore\.googleapis\.com|googleapis\.com|identitytoolkit|securetoken|firebaseinstallations|accounts\.google\.com|apis\.google\.com|\/__\/auth\/)/;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
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
    await Promise.all(keys.filter(k => k.startsWith('gymlog-') && k !== CACHE).map(k => caches.delete(k)));
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
  if (BYPASS.test(url.href)) return;

  // Navigation (HTML): network-first, Fallback auf Cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(CACHE);
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
        const cache = await caches.open(CACHE);
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
