/* Trainio – Start der App
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   17. Boot
   ========================================================================== */
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = sw => toast('Neue Version verfügbar', 'info', { duration: 20000, action: { label: 'Neu laden', fn: () => sw.postMessage({ type: 'SKIP_WAITING' }) } });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) offer(sw); });
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(e => console.warn('Service Worker:', e));
}

async function boot() {
  await Store.boot();
  applyTheme();
  const st = S().startTab;
  if (st && st !== 'last' && Views[st]) App.tab = st;
  if (Store.owner() === 'local') ensureSeeds();
  Store.subscribe('*', cs => { if (cs.includes('meta')) applyTheme(); scheduleRender(); });
  Store.onSync(() => { renderNav(); if (App.tab === 'more') scheduleRender(); });
  App.renderCurrent();
  fx($('#tab-' + App.tab), 'fx-up');
  countUp($$(`#tab-${App.tab} :is(${COUNT_SEL})`));
  updateTopH();
  // Workout-Resume nach App-Kill / Reload
  const w = Workout.cur();
  if (w) {
    toast(`„${w.name}" wiederhergestellt – weiter geht's`, 'info');
    if (!w.editingId) WakeLock.request();
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (App.tab === 'more') scheduleRender(); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; toast(`${APP.name} installiert`, 'success'); });
  let wasOffline = !navigator.onLine;
  window.addEventListener('offline', () => { wasOffline = true; toast('Offline – alles wird lokal gespeichert und später synchronisiert', 'warn'); });
  window.addEventListener('online', () => { if (wasOffline) toast('Wieder online', 'success'); wasOffline = false; });
  registerSW();
  Auth.init();
}
boot();
