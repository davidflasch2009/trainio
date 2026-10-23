/* Trainio – Firebase-Konfiguration
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   Firebase-Konfiguration – HIER die echten Werte aus der Firebase-Console eintragen
   (Projekteinstellungen → Allgemein → Deine Apps → SDK-Konfiguration).
   Solange die Platzhalter drinstehen, läuft Trainio im lokalen Modus (ohne Sync).
   ========================================================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAGkOgibkXi4c-ictrl6mqZufjYX4KmHWg",
  authDomain: "trainio-32d4b.firebaseapp.com",
  projectId: "trainio-32d4b",
  storageBucket: "trainio-32d4b.firebasestorage.app",
  messagingSenderId: "455774047701",
  appId: "1:455774047701:web:c52ea2a32b288c52f6c15c"
};

/* Anmeldewege in dieser Reihenfolge – jeder muss in Firebase (Authentication → Sign-in method) aktiviert sein.
   Möglich: 'google', 'github' (Einrichtung siehe README). */
const AUTH_PROVIDERS = ['google', 'github'];
