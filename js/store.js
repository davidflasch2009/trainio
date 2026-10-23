/* Trainio – Datenspeicher (lokal + Firestore) & Google-Anmeldung
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   3. Store – In-Memory + localStorage-Mirror + Firestore (Realtime)
   Writes landen immer sofort lokal; Firestore synchronisiert im Hintergrund
   (mit enablePersistence auch offline). Fotos liegen lokal in IndexedDB.
   ========================================================================== */
const COLLS = ['exercises', 'templates', 'plans', 'workouts', 'progress', 'prs', 'meta', 'imports', 'photos'];
const NO_MIRROR = new Set(['photos']);  // zu groß für localStorage → IndexedDB
const TS_KEYS = new Set(['createdAt', 'updatedAt', 'startedAt', 'endedAt', 'lastRecalc', 'importedAt', 'undoneAt']);

/* Kleiner IndexedDB-Wrapper für Fotos */
const PhotoDB = (() => {
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB nicht verfügbar'));
      const r = indexedDB.open('gymlog-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    put: (id, v) => tx('readwrite', s => s.put(v, id)).catch(e => console.warn('PhotoDB', e)),
    del: id => tx('readwrite', s => s.delete(id)).catch(e => console.warn('PhotoDB', e)),
    clear: () => tx('readwrite', s => s.clear()).catch(e => console.warn('PhotoDB', e)),
    async all() {
      try {
        const db = await open();
        return await new Promise((res, rej) => {
          const out = {};
          const t = db.transaction('photos', 'readonly');
          const c = t.objectStore('photos').openCursor();
          c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } };
          t.oncomplete = () => res(out);
          t.onerror = () => rej(t.error);
        });
      } catch (e) { return {}; }
    }
  };
})();

const Store = (() => {
  const data = {};
  const ver = {};
  COLLS.forEach(c => { data[c] = {}; ver[c] = 0; });
  const listeners = new Map();
  const syncListeners = new Set();
  let owner = 'local';         // 'local' (Gast) oder Firebase-UID
  let cloudInit = false;       // Erst-Sync für diese UID erledigt?
  let mergePending = false;    // Gast-Daten warten noch auf den Upload ins Konto
  let queue = [];              // Offline-Ops, falls Firebase-SDK nicht geladen werden konnte
  let uid = null, db = null;
  let unsubs = [];
  let serverSeen = {};
  let pendingWrites = 0;
  let pendingInit = false;
  let readyHooks = [];
  let syncHooks = [];
  let settingsCache = null;
  const dirty = new Set();
  let flushTimer = null;

  /* ---------- lokal ---------- */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS.data);
      if (raw) {
        const o = JSON.parse(raw);
        owner = o.owner || 'local';
        cloudInit = !!o.cloudInit;
        mergePending = !!o.mergePending;
        queue = Array.isArray(o.queue) ? o.queue : [];
        for (const c of COLLS) if (o.colls && o.colls[c]) data[c] = o.colls[c];
      }
      if (!data.meta.settings) {
        const s = localStorage.getItem(LS.settings);
        if (s) data.meta.settings = { ...JSON.parse(s), id: 'settings' };
      }
    } catch (e) { console.warn('Lokaler Cache defekt – wird neu aufgebaut', e); }
  }
  let quotaWarned = false;
  const saveLocal = debounce(() => {
    try {
      const colls = {};
      for (const c of COLLS) if (!NO_MIRROR.has(c)) colls[c] = data[c];
      localStorage.setItem(LS.data, JSON.stringify({ owner, cloudInit, mergePending, queue, savedAt: Date.now(), colls }));
      if (data.meta.settings) localStorage.setItem(LS.settings, JSON.stringify(data.meta.settings));
    } catch (e) {
      console.error(e);
      if (!quotaWarned) { quotaWarned = true; toast('Lokaler Speicher voll – bitte Backup machen und alte Daten löschen', 'error'); }
    }
  }, 300);

  function queueEmit(c) {
    ver[c]++;
    if (c === 'meta') settingsCache = null;
    dirty.add(c);
    if (!flushTimer) flushTimer = setTimeout(flush, 0);
  }
  function flush() {
    flushTimer = null;
    const cs = [...dirty];
    dirty.clear();
    saveLocal();
    for (const c of cs) (listeners.get(c) || []).forEach(cb => { try { cb(c); } catch (e) { console.error(e); } });
    (listeners.get('*') || []).forEach(cb => { try { cb(cs); } catch (e) { console.error(e); } });
  }

  /* ---------- Firestore-Helfer ---------- */
  const ref = c => db.collection('users').doc(uid).collection(c);
  /* Firestore erlaubt keine Arrays in Arrays (z. B. warmupSteps) → als { _arr: […] } speichern */
  const encArr = v => Array.isArray(v) ? v.map(x => Array.isArray(x) ? { _arr: encArr(x) } : encArr(x))
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encArr(x)])) : v;
  const isArrBox = x => x && typeof x === 'object' && Array.isArray(x._arr) && Object.keys(x).length === 1;
  const decArr = v => Array.isArray(v) ? v.map(x => isArrBox(x) ? decArr(x._arr) : decArr(x))
    : v && typeof v === 'object' && typeof v.toMillis !== 'function' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decArr(x)])) : v;
  function toRemote(doc) {
    const o = encArr(JSON.parse(JSON.stringify(doc))); // JSON entfernt undefined (Firestore mag das nicht)
    delete o.id;
    for (const k of Object.keys(o)) {
      if (TS_KEYS.has(k) && typeof o[k] === 'number') o[k] = firebase.firestore.Timestamp.fromMillis(o[k]);
    }
    return o;
  }
  function fromRemote(id, d) {
    const o = { ...decArr(d), id };
    for (const k of Object.keys(o)) if (o[k] && typeof o[k].toMillis === 'function') o[k] = o[k].toMillis();
    return o;
  }
  const online = () => !!(uid && db);
  function track(p) {
    pendingWrites++;
    emitSync();
    p.catch(fsError).finally(() => { pendingWrites--; emitSync(); });
  }
  function emitSync() { const s = syncState(); syncListeners.forEach(cb => cb(s)); }
  function syncState() {
    if (!uid) return Auth.configured() ? (owner !== 'local' ? 'offline' : 'local') : 'local';
    if (!navigator.onLine) return 'offline';
    return pendingWrites > 0 ? 'pending' : 'synced';
  }
  function enqueue(op) {
    // Konto-Daten im Cache, aber Firebase (noch) nicht verbunden → später nachholen
    if (owner !== 'local' && !uid) queue.push(op);
  }

  /* ---------- öffentliche API ---------- */
  function put(coll, id, doc, opts = {}) {
    const prev = data[coll][id];
    const next = opts.replace || !prev ? { ...doc, id } : { ...prev, ...doc, id };
    data[coll][id] = next;
    if (coll === 'photos') PhotoDB.put(id, next);
    queueEmit(coll);
    if (online()) { try { track(ref(coll).doc(id).set(toRemote(next), { merge: !opts.replace })); } catch (e) { fsError(e); } }
    else enqueue({ t: 'put', c: coll, id });
    return Promise.resolve(next);
  }
  function del(coll, id) {
    delete data[coll][id];
    if (coll === 'photos') PhotoDB.del(id);
    queueEmit(coll);
    if (online()) { try { track(ref(coll).doc(id).delete()); } catch (e) { fsError(e); } }
    else enqueue({ t: 'del', c: coll, id });
    return Promise.resolve();
  }
  /** Mehrere Writes – lokal sofort, remote in Firestore-Batches à 500 */
  async function batch(ops, onProgress) {
    for (const op of ops) {
      if (op.type === 'put') {
        const prev = data[op.coll][op.id];
        data[op.coll][op.id] = op.replace || !prev ? { ...op.doc, id: op.id } : { ...prev, ...op.doc, id: op.id };
        if (op.coll === 'photos') PhotoDB.put(op.id, data[op.coll][op.id]);
      } else {
        delete data[op.coll][op.id];
        if (op.coll === 'photos') PhotoDB.del(op.id);
      }
      queueEmit(op.coll);
    }
    if (!online()) {
      ops.forEach(op => enqueue({ t: op.type === 'put' ? 'put' : 'del', c: op.coll, id: op.id }));
      onProgress && onProgress(ops.length, ops.length);
      return;
    }
    await remoteBatch(ops.map(op => ({ type: op.type, coll: op.coll, id: op.id, replace: op.replace })), onProgress);
  }
  /** Ops in Firestore-Batches schreiben (max. 450 Ops bzw. ~3 MB je Batch). Liefert false, wenn etwas schiefging. */
  async function remoteBatch(ops, onProgress, { wait = 5000 } = {}) {
    let ok = true;
    const chunks = [];
    let cur = [], size = 0;
    for (const op of ops) {
      let payload = null;
      if (op.type === 'put') {
        const doc = data[op.coll][op.id];
        if (!doc) continue;
        payload = toRemote(doc);
        if (JSON.stringify(payload).length > 1000000) { console.warn('Dokument zu groß für Firestore', op.coll, op.id); ok = false; continue; }
      }
      const sz = payload ? JSON.stringify(payload).length : 100;
      if (cur.length && (cur.length >= 450 || size + sz > 3000000)) { chunks.push(cur); cur = []; size = 0; }
      cur.push([op, payload]); size += sz;
    }
    if (cur.length) chunks.push(cur);
    let done = 0;
    for (const chunk of chunks) {
      const b = db.batch();
      for (const [op, payload] of chunk) {
        const r = ref(op.coll).doc(op.id);
        try { if (payload) b.set(r, payload, { merge: !op.replace }); else b.delete(r); }
        catch (e) { console.error('[Firestore] übersprungen', op.coll, op.id, e); ok = false; }
      }
      const p = b.commit();
      track(p);
      p.catch(() => { ok = false; });
      // Offline resolved commit() erst nach Server-Ack → nicht ewig blockieren
      if (navigator.onLine) await Promise.race([p.catch(() => {}), sleep(wait)]);
      done += chunk.length;
      onProgress && onProgress(done, ops.length);
      await sleep(0);
    }
    return ok;
  }
  const all = coll => Object.values(data[coll]);
  const raw = (coll, id) => data[coll][id] || null;
  const list = (coll, opts = {}) => {
    let arr = all(coll);
    if (opts.filter) arr = arr.filter(opts.filter);
    if (opts.sort) arr = arr.sort(opts.sort);
    return Promise.resolve(arr);
  };
  const get = (coll, id) => Promise.resolve(raw(coll, id));
  function subscribe(coll, cb) {
    if (!listeners.has(coll)) listeners.set(coll, new Set());
    listeners.get(coll).add(cb);
    return () => listeners.get(coll).delete(cb);
  }
  function settings() {
    return settingsCache || (settingsCache = { ...DEFAULT_SETTINGS, ...(data.meta.settings || {}) });
  }
  function saveSettings(patch) {
    const next = { ...settings(), ...patch };
    delete next.id;
    try {
      localStorage.setItem(LS.settings, JSON.stringify(next));
      if (patch.theme) localStorage.setItem(LS.theme, patch.theme);
    } catch (e) {}
    return put('meta', 'settings', next);
  }

  /* ---------- Seeds & Reset ---------- */
  function seedLocal() {
    if (!Object.keys(data.exercises).length) for (const e of seedExerciseDocs()) data.exercises[e.id] = e;
    queueEmit('exercises');
  }
  function resetData() {
    COLLS.forEach(c => { if (c === 'meta') { const s = data.meta.settings; data.meta = s ? { settings: s } : {}; } else data[c] = {}; queueEmit(c); });
    queue = [];
    PhotoDB.clear();
  }
  function hasUserData() {
    return all('workouts').length > 0 || all('progress').length > 0 ||
      all('exercises').some(e => e.isCustom) || all('plans').length > 0 || all('templates').length > 0;
  }

  /* ---------- Firebase verbinden / trennen ---------- */
  let askMergeFn = null;
  async function attach(userId, { askMerge } = {}) {
    detachListeners();
    askMergeFn = askMerge || null;
    const guest = owner === 'local' || (owner === userId && mergePending);
    if (owner !== 'local' && owner !== userId) { resetData(); cloudInit = false; mergePending = false; }
    if (owner === 'local') cloudInit = false;
    uid = userId;
    db = firebase.firestore();
    serverSeen = {};
    // Offline gesammelte Ops nachholen (nur wenn der Cache diesem Konto gehört)
    if (owner === userId && queue.length && cloudInit) {
      const ops = queue.map(q => ({ type: q.t === 'put' ? 'put' : 'del', coll: q.c, id: q.id }));
      queue = [];
      await remoteBatch(ops).catch(fsError);
    }
    if (!cloudInit) await initialSync(guest, askMerge);
    owner = userId;
    saveLocal();
    if (cloudInit) subscribeAll();
    emitSync();
  }
  function subscribeAll() {
    detachListeners();
    for (const c of COLLS) unsubs.push(ref(c).onSnapshot(snap => onSnap(c, snap), err => fsError(err)));
  }
  /** Erster Abgleich mit dem Konto. Lokale Daten werden erst ersetzt, wenn der Upload sicher geklappt hat. */
  async function initialSync(guest, askMerge) {
    let cloudEmpty;
    try {
      const snaps = await Promise.all(['exercises', 'plans', 'workouts'].map(c => ref(c).limit(1).get({ source: 'server' })));
      cloudEmpty = snaps.every(s => s.empty);
    } catch (e) {
      console.warn('Server nicht erreichbar – Erst-Sync folgt, sobald online', e);
      if (e && e.code === 'permission-denied') fsError(e);
      pendingInit = true;
      mergePending = guest;
      return;
    }
    const failed = () => {
      pendingInit = true;
      mergePending = guest;
      toast('Hochladen ins Konto hat nicht geklappt – deine Daten bleiben auf diesem Gerät, neuer Versuch beim nächsten Start.', 'error', { duration: 6000 });
    };
    if (cloudEmpty) {
      // Erster Login: Bibliothek + Pläne (und ggf. Gast-Daten) ins Konto hochladen
      seedLocal();
      const ops = [];
      for (const c of COLLS) for (const id of Object.keys(data[c])) ops.push({ type: 'put', coll: c, id });
      if (!await remoteBatch(ops, null, { wait: 20000 })) return failed();
    } else if (guest) {
      if (hasUserData() && askMerge && await askMerge()) {
        // Gast-Daten ins bestehende Konto übernehmen (Seeds haben feste IDs → keine Duplikate)
        const ops = [];
        for (const c of ['workouts', 'progress', 'photos', 'imports']) for (const id of Object.keys(data[c])) ops.push({ type: 'put', coll: c, id });
        all('exercises').filter(e => e.isCustom).forEach(e => ops.push({ type: 'put', coll: 'exercises', id: e.id }));
        all('plans').forEach(p => ops.push({ type: 'put', coll: 'plans', id: p.id }));
        all('templates').forEach(t => ops.push({ type: 'put', coll: 'templates', id: t.id }));
        if (!await remoteBatch(ops, null, { wait: 20000 })) return failed();
        readyHooks.push(() => PR.recalcAll({ silent: true }));
      } else {
        resetData();
      }
    }
    pendingInit = false;
    mergePending = false;
    cloudInit = true;
  }
  function onSnap(c, snap) {
    // Leerer Cache-Snapshot beim allerersten Start würde lokale Daten kurz löschen → ignorieren
    if (snap.metadata.fromCache && snap.empty && !serverSeen[c] && Object.keys(data[c]).length) return;
    const firstServer = !snap.metadata.fromCache && !serverSeen[c];
    if (!snap.metadata.fromCache) serverSeen[c] = true;
    const next = {};
    snap.forEach(d => { next[d.id] = fromRemote(d.id, d.data()); });
    // Konto hat (noch) keine Einstellungen → die lokalen behalten und hochladen statt auf Standard zurückzufallen
    if (c === 'meta' && firstServer && !next.settings && data.meta.settings) {
      next.settings = data.meta.settings;
      setTimeout(() => put('meta', 'settings', data.meta.settings), 0);
    }
    data[c] = next;
    if (c === 'photos') { PhotoDB.clear().then(() => Object.entries(next).forEach(([id, v]) => PhotoDB.put(id, v))); }
    queueEmit(c);
    if (syncHooks.length && serverSeen.exercises && serverSeen.meta) {
      const hooks = syncHooks; syncHooks = [];
      setTimeout(() => hooks.forEach(h => h()), 300);
    }
    if (readyHooks.length && serverSeen.workouts && serverSeen.exercises) {
      const hooks = readyHooks; readyHooks = [];
      setTimeout(() => hooks.forEach(h => h()), 300);
    }
  }
  function detachListeners() { unsubs.forEach(u => { try { u(); } catch (e) {} }); unsubs = []; }
  function detach() {
    detachListeners();
    uid = null; db = null; owner = 'local'; cloudInit = false; mergePending = false; pendingInit = false;
    resetData();
    seedLocal();
    saveLocal();
    emitSync();
  }
  async function retryInit() {
    if (!online() || !pendingInit) return;
    await initialSync(mergePending, askMergeFn);
    saveLocal();
    if (cloudInit) { subscribeAll(); emitSync(); }
  }

  async function boot() {
    loadLocal();
    if (owner === 'local' && !Object.keys(data.exercises).length) seedLocal();
    const photos = await PhotoDB.all();
    if (Object.keys(photos).length) { data.photos = photos; queueEmit('photos'); }
    ['exercises', 'plans', 'workouts', 'progress', 'prs', 'meta'].forEach(queueEmit);
    window.addEventListener('online', () => { emitSync(); retryInit(); });
    window.addEventListener('offline', emitSync);
  }

  return {
    boot, put, del, batch, all, raw, list, get, subscribe, settings, saveSettings,
    attach, detach, resetData, seedLocal, hasUserData,
    /** fn ausführen, sobald Übungen + Einstellungen vom Server da sind (lokal: sofort) */
    whenSynced(fn) { if (!uid || (serverSeen.exercises && serverSeen.meta)) fn(); else syncHooks.push(fn); },
    onSync: cb => { syncListeners.add(cb); return () => syncListeners.delete(cb); },
    syncState, emitSync,
    ver: c => ver[c],
    owner: () => owner,
    isOnline: online,
    uid: () => uid
  };
})();
const S = () => Store.settings();

let lastFsErr = 0;
function fsError(e) {
  console.error('[Firestore]', e);
  if (Date.now() - lastFsErr < 4000) return;
  lastFsErr = Date.now();
  const msg = e && e.code === 'permission-denied'
    ? 'Keine Berechtigung – Firestore-Regeln prüfen (siehe README)'
    : (e && e.message) || String(e);
  toast('Sync-Fehler: ' + msg, 'error');
}

/* ==========================================================================
   4. Auth (Google, GitHub …) & Firebase-Initialisierung
   Jeder Anmeldeweg ist ein eigenes Konto; angemeldet lassen sich weitere verknüpfen
   (führen dann zu denselben Daten). Welche angeboten werden: AUTH_PROVIDERS in js/config.js.
   ========================================================================== */
const PROVIDERS = {
  google: { id: 'google.com', label: 'Google', icon: GOOGLE_ICON,
    make() { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; } },
  github: { id: 'github.com', label: 'GitHub', icon: GITHUB_ICON,
    make() { const p = new firebase.auth.GithubAuthProvider(); p.addScope('user:email'); return p; } }
};
const providerKey = id => Object.keys(PROVIDERS).find(k => PROVIDERS[k].id === id) || null;

const Auth = (() => {
  let user = null;
  let enabled = false;
  let status = 'init'; // init | unconfigured | ready | failed
  let pendingLink = null; // { cred, email } – nach der Anmeldung mit dem bisherigen Weg verknüpfen
  const LINK_KEY = 'gymlog.pendingLink';
  const CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
  const REDIRECT = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported', 'auth/internal-error'];
  // Fehler mit eigener Behandlung – auch auf dem iPhone kein Redirect-Versuch
  const HANDLED = ['auth/account-exists-with-different-credential', 'auth/credential-already-in-use', 'auth/email-already-in-use',
    'auth/provider-already-linked', 'auth/operation-not-allowed', 'auth/unauthorized-domain', 'auth/network-request-failed'];
  const configured = () => {
    const k = String(FIREBASE_CONFIG.apiKey || '');
    return !!k && !k.startsWith('DEINE') && !String(FIREBASE_CONFIG.projectId || '').startsWith('DEIN');
  };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const providers = () => (typeof AUTH_PROVIDERS !== 'undefined' ? AUTH_PROVIDERS : ['google']).filter(k => PROVIDERS[k]);
  const toUser = u => ({
    uid: u.uid, name: u.displayName || '', email: u.email || (u.providerData.find(p => p && p.email) || {}).email || '', photo: u.photoURL || '',
    providers: u.providerData.map(p => p && providerKey(p.providerId)).filter(Boolean)
  });

  async function init() {
    if (!configured()) { status = 'unconfigured'; Store.emitSync(); return; }
    try {
      await loadScript(CDN.fbApp);
      await Promise.all([loadScript(CDN.fbAuth), loadScript(CDN.fbStore)]);
    } catch (e) {
      status = 'failed';
      Store.emitSync();
      toast('Firebase nicht erreichbar – lokaler Modus, Sync folgt beim nächsten Start', 'warn', { cat: 'sync' });
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      const db = firebase.firestore();
      try { await db.enablePersistence({ synchronizeTabs: true }); }
      catch (e) { console.warn('Offline-Persistence nicht verfügbar:', e.code || e); }
      enabled = true;
      status = 'ready';
      firebase.auth().getRedirectResult().then(r => {
        if (r && r.operationType === 'link' && r.user) linked(r.user, providerKey(r.credential && r.credential.providerId));
      }).catch(e => authError(e, true));
      firebase.auth().onAuthStateChanged(onUser);
    } catch (e) {
      status = 'failed';
      toast('Firebase-Fehler: ' + e.message, 'error');
    }
  }
  async function onUser(u) {
    if (u) {
      user = toUser(u);
      linkPending(u);
      try {
        await Store.attach(u.uid, { askMerge });
        Store.whenSynced(ensureSeeds);
      } catch (e) { fsError(e); }
    } else {
      const had = !!user || Store.owner() !== 'local';
      user = null;
      if (had) Store.detach();
    }
    App.renderAll();
  }
  function askMerge() {
    const n = Store.all('workouts').length;
    return confirmDialog({
      title: 'Lokale Daten übernehmen?',
      text: `Du hast ohne Konto ${n} Workout${n === 1 ? '' : 's'} und weitere Daten erfasst. Sollen sie in dein Konto übernommen werden? Sonst werden sie auf diesem Gerät verworfen.`,
      okLabel: 'Übernehmen', cancelLabel: 'Verwerfen'
    });
  }
  /** Popup – scheitert es (iOS-Standalone, blockiert), Redirect. false = abgebrochen bzw. Seite wird umgeleitet */
  async function viaPopup(popup, redirect) {
    try { await popup(); return true; }
    catch (e) {
      if (CANCELLED.includes(e.code)) return false;
      if (REDIRECT.includes(e.code) || (isIOS() && !HANDLED.includes(e.code))) { await redirect(); return false; }
      throw e;
    }
  }
  function ready() {
    if (!configured()) { toast('Firebase ist noch nicht konfiguriert – siehe README', 'warn'); return false; }
    if (!enabled) { toast('Firebase lädt noch oder ist offline', 'warn'); return false; }
    return true;
  }
  async function signIn(key = 'google') {
    const pv = PROVIDERS[key];
    if (!pv || !ready()) return;
    const provider = pv.make();
    try { await viaPopup(() => firebase.auth().signInWithPopup(provider), () => firebase.auth().signInWithRedirect(provider)); }
    catch (e) { authError(e); }
  }
  function authError(e, quiet = false) {
    if (e && e.code === 'auth/account-exists-with-different-credential') return offerLink(e);
    if (quiet && e && CANCELLED.includes(e.code)) return;
    toast(authMsg(e), 'error');
  }
  /** Gleiche E-Mail hat schon ein Konto (anderer Anmeldeweg): dort anmelden, dann diesen Weg verknüpfen */
  async function offerLink(e) {
    const cred = e.credential || null, email = e.email || (e.customData && e.customData.email) || '';
    const tried = PROVIDERS[providerKey(cred && cred.providerId)];
    const others = providers().filter(k => !tried || PROVIDERS[k] !== tried);
    if (!cred || !tried || !others.length) return toast('Mit dieser E-Mail gibt es schon ein Konto – bitte mit dem bisherigen Anmeldeweg anmelden.', 'warn', { duration: 6000 });
    const text = `Mit ${email || 'dieser E-Mail'} gibt es schon ein Trainio-Konto. Melde dich einmal wie bisher an – danach ist ${tried.label} damit verknüpft und führt zu denselben Daten.`;
    if (!await confirmDialog({ title: 'Konto gibt es schon', text, okLabel: others.length > 1 ? 'Weiter' : `Mit ${PROVIDERS[others[0]].label} anmelden` })) return;
    const key = others.length > 1 ? await actionMenu('Womit hast du dich bisher angemeldet?', others.map(k => ({ key: k, label: PROVIDERS[k].label, icon: 'user' }))) : others[0];
    if (!key) return;
    pendingLink = { cred, email };
    // überlebt den Redirect-Login (iPhone)
    try { sessionStorage.setItem(LINK_KEY, JSON.stringify({ cred: cred.toJSON(), email, at: Date.now() })); } catch (x) {}
    signIn(key);
  }
  async function linkPending(u) {
    let p = pendingLink;
    pendingLink = null;
    try {
      const raw = sessionStorage.getItem(LINK_KEY);
      sessionStorage.removeItem(LINK_KEY);
      const o = raw && JSON.parse(raw);
      if (!p && o && Date.now() - o.at < 10 * 60000) p = { cred: firebase.auth.OAuthProvider.credentialFromJSON(o.cred), email: o.email };
    } catch (x) {}
    if (!p || !p.cred) return;
    const pv = PROVIDERS[providerKey(p.cred.providerId)], label = pv ? pv.label : 'Der Anmeldeweg';
    if (p.email && u.email && norm(p.email) !== norm(u.email)) {
      toast(`Angemeldet mit ${u.email} – ${label} wurde nicht verknüpft, weil es zu ${p.email} gehört.`, 'warn', { duration: 7000 });
      return;
    }
    try { const r = await u.linkWithCredential(p.cred); linked(r.user || u, providerKey(p.cred.providerId)); }
    catch (e) { toast(linkMsg(e, label), 'error', { duration: 7000 }); }
  }
  async function linked(u, key) {
    try { await u.reload(); } catch (e) {}
    const cu = firebase.auth().currentUser;
    if (cu) user = toUser(cu);
    App.renderAll();
    toast(`${PROVIDERS[key] ? PROVIDERS[key].label : 'Anmeldeweg'} verknüpft – führt jetzt zu denselben Daten`, 'success');
  }
  /** Angemeldet: weiteren Anmeldeweg mit diesem Konto verknüpfen */
  async function link(key) {
    const pv = PROVIDERS[key], cu = enabled && firebase.auth().currentUser;
    if (!pv || !cu) return;
    const provider = pv.make();
    try { if (await viaPopup(() => cu.linkWithPopup(provider), () => cu.linkWithRedirect(provider))) linked(cu, key); }
    catch (e) { toast(linkMsg(e, pv.label), 'error', { duration: 7000 }); }
  }
  async function unlink(key) {
    const pv = PROVIDERS[key], cu = enabled && firebase.auth().currentUser;
    if (!pv || !cu) return;
    if (cu.providerData.length < 2) { toast('Der einzige Anmeldeweg lässt sich nicht trennen', 'warn'); return; }
    const ok = await confirmDialog({ title: `${pv.label} trennen?`, text: `Danach kommst du mit ${pv.label} nicht mehr in dieses Konto. Deine Daten bleiben erhalten.`, okLabel: 'Trennen', danger: true });
    if (!ok) return;
    try {
      await cu.unlink(pv.id);
      user = toUser(firebase.auth().currentUser || cu);
      App.renderAll();
      toast(`${pv.label} getrennt`, 'success');
    } catch (e) { toast(authMsg(e), 'error'); }
  }
  function linkMsg(e, label) {
    if (e && ['auth/credential-already-in-use', 'auth/email-already-in-use', 'auth/account-exists-with-different-credential'].includes(e.code))
      return `Dieses ${label}-Konto gehört schon zu einem anderen Trainio-Konto mit eigenen Daten. Verknüpfen geht nur mit einem Anmeldeweg, der noch kein Konto hat.`;
    if (e && e.code === 'auth/provider-already-linked') return `${label} ist schon verknüpft.`;
    return authMsg(e);
  }
  async function signOut() {
    const ok = await confirmDialog({ title: 'Abmelden?', text: 'Deine Daten bleiben in der Cloud. Die lokale Kopie auf diesem Gerät wird entfernt.', okLabel: 'Abmelden', danger: true });
    if (!ok) return;
    if (localStorage.getItem(LS.active)) { toast('Bitte erst das laufende Workout beenden', 'warn'); return; }
    try { await firebase.auth().signOut(); toast('Abgemeldet', 'success'); }
    catch (e) { toast(authMsg(e), 'error'); }
  }
  function authMsg(e) {
    const map = {
      'auth/unauthorized-domain': 'Diese Domain ist in Firebase nicht autorisiert (Authentication → Settings → Authorized domains).',
      'auth/network-request-failed': 'Keine Verbindung – bitte später erneut versuchen.',
      'auth/popup-blocked': 'Popup wurde blockiert.',
      'auth/operation-not-allowed': 'Dieser Anmeldeweg ist in Firebase noch nicht aktiviert (Authentication → Sign-in method).'
    };
    return 'Login-Fehler: ' + (map[e && e.code] || (e && e.message) || e);
  }
  return {
    init, signIn, signOut, link, unlink, configured, isIOS, providers,
    provider: k => PROVIDERS[k],
    user: () => user,
    status: () => status
  };
})();
