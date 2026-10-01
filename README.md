# GymLog

Workout-Tracker, Trainingsplan-Builder und Progress-Tracker als Single-File-PWA
(`index.html` mit allem CSS + JS inline, kein Build-Step).

- Läuft sofort im **lokalen Modus** (Daten im Browser), auch ohne Firebase.
- Mit Firebase: Google-Login + Sync zwischen iPhone und Laptop (Firestore, offline-fähig).
- Diagramme: Chart.js 4 · PDF-Export: jsPDF 2 · beide lazy per CDN geladen.

## Dateien

| Datei | Zweck |
| --- | --- |
| `index.html` | komplette App |
| `sw.js` | Service Worker (Offline-Cache) |
| `manifest.json` | PWA-Manifest |
| `icon-192.png`, `icon-512.png` | App-Icons |

## 1. Firebase einrichten (einmalig)

1. In der [Firebase Console](https://console.firebase.google.com) ein **neues Projekt** anlegen (z. B. `gymlog-xxxxx`).
2. **Firestore Database** → Datenbank erstellen → *Native Mode*, Region `eur3 (Europe)`.
3. **Authentication** → *Sign-in method* → **Google** aktivieren.
4. **Authentication → Settings → Authorized domains** → `davidflasch2009.github.io` hinzufügen.
5. **Firestore → Regeln** ersetzen durch:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **Projekteinstellungen → Allgemein → Deine Apps → Web-App (`</>`)** registrieren und die
   `firebaseConfig` kopieren.
7. In `index.html` ganz oben im `<script>` die Platzhalter in `const FIREBASE_CONFIG = { … }`
   durch die echten Werte ersetzen.

Solange dort noch `DEINE_API_KEY` steht, läuft die App im lokalen Modus. Daten, die du lokal
erfasst hast, kannst du beim ersten Login ins Konto übernehmen.

## 2. Deployment (GitHub Pages)

1. Repo → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)`.
2. Live-URL: `https://davidflasch2009.github.io/trainio/`
3. Änderungen veröffentlichen:

   ```bash
   git add . && git commit -m "…" && git push
   ```

> **Wichtig:** Bei jedem Deploy in `sw.js` die Konstante `CACHE` hochzählen
> (`gymlog-v2` → `gymlog-v3` …). Sonst zeigt das iPhone noch die alte Version.
> Die App meldet neue Versionen selbst („Neue Version verfügbar – Neu laden“).

### Installieren

- **iPhone (Safari):** Teilen → *Zum Home-Bildschirm*.
- **Windows (Chrome/Edge):** Install-Symbol in der Adressleiste oder *Mehr → App installieren*.

## 3. Arrow-Import

1. Screenshots der Arrow-History machen.
2. In der App: **Mehr → 🏹 Arrow-Import → „Prompt für Claude kopieren“**.
3. Prompt + Screenshots an Claude schicken, den zurückgegebenen JSON-Block in das Textfeld
   einfügen (oder als `.json` hochladen).
4. **Validieren & Vorschau** → prüfen → **Import bestätigen**.

Duplikate (gleiches Datum + gleiche Sätze) werden übersprungen, englische Arrow-Namen
(„Bench Press“, „Lat Pulldown“ …) automatisch auf die Bibliothek gemappt, `weightLb` wird in
kg umgerechnet. Der letzte Import lässt sich unter **Mehr → Letzten Import rückgängig machen**
komplett zurücknehmen.

## Lokal testen

```bash
python -m http.server 8000
# → http://localhost:8000
```

Der Service Worker läuft nur über `http://localhost` oder `https://`, nicht über `file://`.
