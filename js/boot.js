/* Trainio – Start der App
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   17. Boot
   ========================================================================== */
/* Updates kommen von selbst: Beim Öffnen der App (auch aus dem Hintergrund) wird eine neue Version sofort eingespielt,
   solange noch nichts angetippt ist; sonst beim nächsten Verlassen der App – wenn kein Fenster offen ist und nichts
   getippt wird. Bis dahin bietet eine Meldung „Neu laden" an. Workout und Daten sind vorher gesichert. */
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  // „Gerade gestartet": App geöffnet oder aus dem Hintergrund zurück (iPhone lädt dabei nicht neu) und noch nichts angetippt
  let t0 = Date.now(), reloading = false, touched = false;
  const fresh = () => { t0 = Date.now(); touched = false; document.addEventListener('pointerdown', () => { touched = true; }, { capture: true, once: true, passive: true }); };
  fresh();
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
  const apply = sw => {
    if (!sw || sw.state !== 'installed') return;
    Store.flushLocal();
    sw.postMessage({ type: 'SKIP_WAITING' });
  };
  const quiet = () => !Modal.count() && !typing();
  navigator.serviceWorker.register('sw.js').then(reg => {
    let offered = null;
    const offer = sw => {
      if (offered === sw) return;
      offered = sw;
      toast('Neue Version verfügbar', 'info', { cat: 'update', duration: 20000, action: { label: 'Neu laden', fn: () => apply(sw) } });
    };
    // gerade gestartet und noch nichts angetippt → sofort; App im Hintergrund → sofort; sonst anbieten
    const handle = sw => { if (!navigator.serviceWorker.controller) return; if ((!touched && Date.now() - t0 < 6000) || (document.hidden && quiet())) apply(sw); else offer(sw); };
    if (reg.waiting) handle(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => { if (sw.state === 'installed') handle(sw); });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { if (reg.waiting && quiet()) apply(reg.waiting); return; }
      fresh();
      if (reg.waiting) handle(reg.waiting);
      reg.update().catch(() => {});
    });
  }).catch(e => console.warn('Service Worker:', e));
}

/* iPhone: Trainio legt dort keine Verlaufs-Einträge an (js/more.js). Ältere Versionen taten es – solche Einträge
   bleiben bis zum Beenden der App erhalten, und iOS wischt vom Rand hinein und zeigt ein altes Bild der Seite.
   Landet man so auf einem Eintrag: Eintrag leeren und die aktuelle Seite neu zeichnen, damit das Bild verschwindet. */
function guardIOSHistory() {
  if (!isIOSDevice) return;
  if (history.state) try { history.replaceState(null, ''); } catch (e) {}
  window.addEventListener('popstate', () => {
    try { history.replaceState(null, ''); } catch (e) {}
    const y = Scroll.y, tab = $('#tab-' + App.tab);
    if (tab) tab._html = null;   // wirklich neu aufbauen – der Mehr-Tab überspringt sonst gleichen Inhalt
    App.renderCurrent();
    Scroll.to(y);
  });
}

async function boot() {
  await Store.boot();
  applyTheme();
  const st = S().startTab;
  if (st && st !== 'last' && Views[st]) App.tab = st;
  if (Store.owner() === 'local') ensureSeeds();
  Store.subscribe('*', cs => { if (cs.includes('meta')) applyTheme(); scheduleRender(); });
  Store.onSync(() => { renderNav(); if (App.tab === 'more') scheduleRender(); });
  // Fortschritt startet mit dem eingestellten Zeitraum (sonst zuletzt gewählter)
  applyDefaultPeriod();
  // Icon über „Auf dem Home-Bildschirm übernehmen" gewählt (?icon=N) → als Einstellung merken
  if (window.__iconFromUrl && window.__iconFromUrl !== S().appIcon) Store.saveSettings({ appIcon: window.__iconFromUrl });
  // Entfernte Designs (Lernio, Mono, Brutal, Soft, Neon, Terminal) → Trainio
  if (!DESIGNS.some(d => d.id === S().design)) { Store.saveSettings({ design: 'gymlog' }); applyTheme(); }
  App.renderCurrent();
  fx($('#tab-' + App.tab), 'fx-fade');   // ruhig einblenden, ohne Verrutschen
  countUp($$(`#tab-${App.tab} :is(${COUNT_SEL})`));
  updateTopH();
  // Workout-Resume nach App-Kill / Reload
  const w = Workout.cur();
  if (w) {
    toast(`„${w.name}" wiederhergestellt – weiter geht's`, 'info', { cat: 'workout' });
    if (!w.editingId) WakeLock.request();
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (App.tab === 'more') scheduleRender(); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; toast(`${APP.name} installiert`, 'success'); });
  let wasOffline = !navigator.onLine;
  window.addEventListener('offline', () => { wasOffline = true; toast('Offline – alles wird lokal gespeichert und später synchronisiert', 'warn', { cat: 'sync' }); });
  window.addEventListener('online', () => { if (wasOffline) toast('Wieder online', 'success', { cat: 'sync' }); wasOffline = false; });
  registerSW();
  guardIOSHistory();
  Auth.init();
}
boot();
