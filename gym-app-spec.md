# Gym-App „GymLog" – Vollständige Spezifikation für Claude Code

## 0. Kontext & Ziel

Baue eine **Single-File Progressive Web App (PWA)** namens **GymLog** zum Tracken von Krafttraining. Die App soll die gleiche technische Architektur wie meine bestehende Lernio-App haben (einzelne `index.html`, Firebase Firestore + Google Auth, Service Worker, GitHub Pages Deployment). Zielgeräte: iPhone 14 (iOS 26, installiert als Standalone-PWA) und Windows Laptop (installiert als PWA via Chrome/Edge).

**Hauptzweck:** Alles-in-einem Workout-Tracker + Trainingsplan-Builder + Progress-Tracker.

---

## 1. Tech Stack (zwingend)

- **Single-File PWA:** `index.html` mit kompletten CSS und JS inline (kein Build-Step, kein bundler, keine Frameworks wie React/Vue).
- **Firebase JS SDK compat v10.14.1** über CDN:
  - `firebase-app-compat.js`
  - `firebase-auth-compat.js`
  - `firebase-firestore-compat.js`
- **Firebase Auth** mit Google Sign-In (`signInWithPopup`, Fallback auf `signInWithRedirect` bei mobile Safari).
- **Firebase Firestore** mit `enablePersistence({ synchronizeTabs: true })` für Offline-Modus.
- **Chart.js v4** über CDN für Diagramme (eine Library, nichts anderes).
- **jsPDF v2** über CDN für PDF-Export.
- **Service Worker** `sw.js`: network-first für Navigationen, cache-first für Assets, Cache-Name `gymlog-v1` (bei jedem Deploy hochzählen).
- **manifest.json** mit `display: standalone`, Theme-Color z. B. `#111318` (dunkel, siehe Design-System).
- **Keine externen UI-Libraries, kein Tailwind-Build.** Reines CSS mit CSS Custom Properties.

---

## 2. Dateistruktur

```
/gymlog/
  index.html         # komplette App (CSS + JS inline)
  sw.js              # Service Worker
  manifest.json      # PWA Manifest
  icon-192.png       # 192x192 App Icon
  icon-512.png       # 512x512 App Icon
  README.md          # kurze Setup-Anleitung
```

**Icon-Design:** schwarzer runder Hintergrund mit weißer Hantel-Silhouette, dezenter neon-grüner Akzent (`#39FF88`).

---

## 3. Firebase Setup

- **Neues Firebase Projekt** anlegen (NICHT das von Lernio wiederverwenden) – Vorschlag für Project-ID: `gymlog-xxxxx`.
- Firestore im **Native Mode**, Region `eur3` (Europe).
- Google Sign-In als Auth-Provider aktivieren.
- GitHub-Pages-Domain als Authorized Domain hinzufügen.
- **Firestore Security Rules:**

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

- Firebase-Config in `index.html` als `const FIREBASE_CONFIG = { ... }` ganz oben im `<script>`.

---

## 4. Datenmodell (Firestore)

Alle Daten userscoped unter `users/{uid}/...`.

### 4.1 `users/{uid}/exercises/{exerciseId}`
Übungs-Bibliothek (vorbefüllt + eigene).
```json
{
  "name": "Bankdrücken",
  "category": "Push",             // Push | Pull | Legs | Core | Cardio | Full Body
  "muscleGroups": ["Brust", "Trizeps", "Schulter"],
  "equipment": "Langhantel",      // Langhantel | Kurzhantel | Maschine | Kabel | Körpergewicht | Band
  "isCustom": false,              // true wenn vom User erstellt
  "notes": "Schulterblätter zusammen, Füße fest",
  "defaultUnit": "kg",            // kg | lb | sec | reps
  "createdAt": <timestamp>
}
```

### 4.2 `users/{uid}/plans/{planId}`
Trainingspläne (fixe + eigene).
```json
{
  "name": "Push Pull Full Body 4x",
  "description": "David's Haupt-Split Mo/Di/Do/Fr",
  "isCustom": false,
  "days": [
    {
      "name": "Push Full Body A",
      "exercises": [
        { "exerciseId": "...", "sets": 4, "reps": "6-8", "restSec": 180, "notes": "" }
      ]
    }
  ],
  "createdAt": <timestamp>
}
```

### 4.3 `users/{uid}/workouts/{workoutId}`
Absolvierte Trainingseinheiten.
```json
{
  "date": "2026-10-01",
  "startedAt": <timestamp>,
  "endedAt": <timestamp>,
  "durationSec": 4200,
  "planId": "...",                // optional, falls aus Plan gestartet
  "planDayName": "Push A",        // Snapshot des Tages-Namens
  "notes": "Gut gefühlt, Bank neuer PR",
  "bodyWeightKg": 82.5,           // optional
  "entries": [
    {
      "exerciseId": "...",
      "exerciseName": "Bankdrücken",   // Snapshot für History
      "sets": [
        { "reps": 8, "weightKg": 70, "rpe": 7, "done": true },
        { "reps": 6, "weightKg": 80, "rpe": 9, "done": true }
      ]
    }
  ]
}
```

### 4.4 `users/{uid}/progress/{entryId}`
Progress-Tracker (Körpermaße, Gewicht, Fotos).
```json
{
  "date": "2026-10-01",
  "bodyWeightKg": 82.5,
  "bodyFatPct": 15.2,
  "measurements": {
    "chestCm": 102, "waistCm": 80, "armCm": 38, "thighCm": 60, "shoulderCm": 120, "neckCm": 40, "calfCm": 38
  },
  "photoUrl": null,               // optional, später Firebase Storage
  "notes": ""
}
```

### 4.5 `users/{uid}/prs/{exerciseId}`
Personal Records – wird automatisch nach jedem Workout berechnet.
```json
{
  "exerciseId": "...",
  "exerciseName": "Bankdrücken",
  "bestWeightKg": 95,             // schwerstes bewegtes Gewicht (min. 1 Rep)
  "best1RM": 102.4,               // Epley: w * (1 + reps/30)
  "bestVolume": 2400,             // reps * weight einer Session
  "bestReps": 15,                 // meiste Reps bei schwerstem Gewicht
  "updatedAt": <timestamp>
}
```

### 4.6 `users/{uid}/meta/settings`
```json
{
  "unit": "kg",                   // kg | lb
  "theme": "dark",                // dark | light
  "weekStart": "monday",
  "defaultRestSec": 120,
  "weightSteps": 2.5,             // Kleinst-Inkrement
  "showRPE": true,
  "notifyRestDone": true
}
```

---

## 5. Store-Abstraktion (JS)

Baue ein `Store`-Objekt wie in Lernio:
- `Store.put(coll, id, data)` – mit Firestore `set({ merge: true })` + localStorage-Mirror
- `Store.del(coll, id)`
- `Store.list(coll, opts?)` – Promise<Array>
- `Store.get(coll, id)`
- `Store.saveSettings(patch)`
- `Store.subscribe(coll, callback)` – Realtime Listener

**Offline-Verhalten:** Writes gehen immer sofort an localStorage, Firestore-Sync passiert im Hintergrund via Persistence.

**localStorage Keys:**
- `gymlog.v1` – kompletter Datencache
- `gymlog.settings` – Settings-Cache
- `gymlog.theme` – Theme-Cache
- `gymlog.activeWorkout` – laufendes Workout (survived Reloads!)

---

## 6. Design-System

### 6.1 Farben (Dark First)
```css
:root {
  --bg: #0b0d10;
  --surface: #15181d;
  --surface-2: #1d2129;
  --border: #272c35;
  --text: #f1f3f5;
  --text-dim: #9aa3af;
  --accent: #39FF88;       /* Neon-Grün, Hauptakzent */
  --accent-dim: #1f8a4a;
  --danger: #ff5a5f;
  --warning: #ffb020;
  --success: #39FF88;
  --radius: 14px;
  --radius-sm: 8px;
}
```

Light-Theme als Alternative über `[data-theme="light"]`.

### 6.2 Typografie
- System-Font-Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Zahlen (Gewicht/Reps/Timer) in `font-variant-numeric: tabular-nums`

### 6.3 Komponenten
- **Cards** mit `background: var(--surface)`, `border-radius: var(--radius)`, dezentem `border: 1px solid var(--border)`
- **Buttons:** primary (accent-Füllung schwarzer Text), secondary (surface-2), ghost (transparent)
- **Input:** große Touch-Targets (min. 44px), zentrierter Text für Zahleninputs, mit +/- Buttons links/rechts
- **Bottom-Navigation** auf Mobile (5 Tabs), **Sidebar** auf Desktop (≥ 900px Breite)

### 6.4 Mobile-first
- Alle Interaktionen auf Daumenreichweite designen
- iOS Safe-Area respektieren: `padding: env(safe-area-inset-top) ...`
- Keine Hover-Only-Interaktionen

---

## 7. Tabs / Screens

5 Haupt-Tabs in Bottom-Navigation:

### 7.1 **Start** (Dashboard)
- Begrüßung („Servus David, Push A heute?") mit Google-Namen
- 4 Stat-Cards:
  1. **Streak** – Tage/Woche trainiert
  2. **Volumen diese Woche** (Sets × Reps × Gewicht)
  3. **Workouts gesamt**
  4. **Nächster geplanter Tag** aus aktivem Split
- **„Workout starten"**-Button (groß, accent, führt zu Plan-Auswahl oder leerem Workout)
- Letzte 3 Workouts als Mini-Cards (klickbar → Detail)
- Falls aktives Workout läuft: fetter Banner oben „Workout läuft seit 42:13 – fortsetzen"

### 7.2 **Training** (aktives Workout + Plan starten)
Zwei Zustände:

**A) Kein Workout aktiv:**
- Liste aller Trainingspläne (fixe + eigene)
- Je Plan: Tages-Auswahl → „Starten"
- „Freies Workout" Button (ohne Plan)

**B) Workout läuft:**
- Oben: Timer seit Start (mm:ss), Workout-Name
- Liste der Übungen des Tages
- Pro Übung: Übungsname, Zielsätze
- Pro Satz eine Zeile mit:
  - Set-Nummer
  - Reps-Input (number, mit +/-)
  - Gewicht-Input (number, mit +/- in `weightSteps`)
  - RPE-Dropdown (6–10, optional)
  - Checkmark-Button → Set „done"
  - Nach Done: **Rest-Timer** startet automatisch, großer Countdown oben einblendbar
- „Satz hinzufügen" / „Übung hinzufügen" (öffnet Exercise-Picker)
- „Workout beenden" (grün, speichert Workout, aktualisiert PRs, zeigt Zusammenfassung)
- „Abbrechen" (rot, mit Confirm)

### 7.3 **Übungen** (Bibliothek)
- Suchfeld oben (debounced)
- Filter-Chips: Category (Push/Pull/Legs/Core/Cardio), Equipment
- Grid/Liste der Übungen
- Jede Übung klickbar → Detail-Modal:
  - Name, Muskelgruppen, Equipment, Notes
  - **History-Graph** (siehe 8.3) wenn Daten vorhanden
  - Alle vergangenen Sets als Tabelle
  - PR-Anzeige (bestes 1RM, Volumen, Reps)
- Floating-Action-Button „+" → neue eigene Übung anlegen (Modal mit Formular)

### 7.4 **Fortschritt** (Analytics-Zentrale)

Das wichtigste Tab der App. **5 Sub-Tabs** oben als Segmented Control: **Übersicht** | **Kraft** | **Volumen** | **Muskeln** | **Körper**.

Globale Steuerung oben (sticky): **Zeitraum-Filter** (4W / 3M / 6M / 1J / Alles / Custom) und **Einheit-Toggle** (kg/lb). Jeder Chart reagiert darauf.

Alle Diagramme mit Chart.js. Responsive, mind. 220px hoch. Alle Karten/Charts mit kurzer Beschriftung („Was ist das?") als kleines Info-i das ein Tooltip öffnet.

Details siehe §17 – hier nur die Tab-Übersicht:

- **Übersicht:** Dashboard mit den 10 wichtigsten Zahlen auf einen Blick (Streak, Workouts gesamt, Volumen diese Woche vs letzte, Trainingstage im Monat, aktive PRs, Konsistenz-Score, geschätztes 1RM Big 3, Push/Pull-Balance, nächster PR-Angriff, letzte 7 Workouts als Mini-Heatmap).
- **Kraft:** alles rund um Gewicht und 1RM pro Übung.
- **Volumen:** Tonnage, Sets, Reps über Zeit auf verschiedenen Ebenen.
- **Muskeln:** Fokus pro Muskelgruppe (Sets/Woche, Balance, Body-Heatmap).
- **Körper:** Körpergewicht, BF%, Umfänge, Fotos.

### 7.5 **Mehr**
- Konto & Sync: Google Sign-In Button, aktuelle Email, Sign-Out
- Einstellungen:
  - Einheit (kg/lb)
  - Theme (dark/light/system)
  - Standard-Pause (Sekunden)
  - Gewichts-Inkrement (2.5 / 1.25 / 5)
  - RPE anzeigen (Toggle)
  - Pausen-Benachrichtigung (Toggle, Web Push API falls erlaubt)
- Daten:
  - **Export CSV** (siehe 8.4)
  - **Export PDF** (siehe 8.4)
  - **Backup JSON** (download komplett)
  - **Restore** (JSON Upload)
  - **🏹 Arrow-Import** (siehe §16) – fetter, hervorgehobener Button
  - **Alle Daten löschen** (mit doppeltem Confirm)
- Über: Version, Link zu Repo, Kontakt

---

## 8. Features im Detail

### 8.1 Workout-Flow
1. User tippt „Workout starten" → Plan-Day-Picker oder „Frei"
2. Plan-Day lädt Übungen als Snapshot in `localStorage.gymlog.activeWorkout`
3. User trackt Sets live; jeder Done-Set schreibt in localStorage, nicht sofort in Firestore (Perf)
4. Rest-Timer: Countdown mit Haptic (navigator.vibrate falls verfügbar), optional Audio-Ping
5. „Beenden" → batched Write in Firestore, PR-Aktualisierung, Modal mit Session-Summary (Volumen, Dauer, neue PRs, Session-RPE-Durchschnitt)

### 8.2 PR-Berechnung
Nach jedem Workout für jede Übung:
- `best1RM` = max(set.weightKg × (1 + set.reps / 30)) – nur wenn `set.done && set.reps >= 1`
- `bestWeightKg` = max(set.weightKg) wo reps ≥ 1
- `bestVolume` = max(Σ(set.reps × set.weightKg) pro Workout)
- `bestReps` = max(set.reps) wo set.weightKg = bestWeightKg

Alte Werte vergleichen, nur bei Verbesserung in `prs/{exerciseId}` schreiben. Bei neuem PR Toast anzeigen: „🏆 Neuer PR: Bankdrücken 95 kg × 1!"

### 8.3 Diagramme (Chart.js)
Für jede Übung in Detail-Ansicht und im Fortschritt-Tab:
- **1RM-Verlauf:** X=Datum, Y=geschätztes 1RM pro Session (bester Satz der Session)
- **Volumen-Verlauf:** X=Datum, Y=Gesamtvolumen pro Session
- **Max-Gewicht-Verlauf:** X=Datum, Y=schwerstes Gewicht pro Session
- Chart-Konfiguration: `type: 'line'`, `tension: 0.3`, Accent-Farbe als `borderColor`, transparentes `backgroundColor` für Fill
- Immer responsive, `maintainAspectRatio: false`, min. 220px Höhe

### 8.4 Export
- **CSV:** Alle Workouts flach – Spalten: date, workoutName, exerciseName, setNumber, reps, weightKg, rpe, done, notes. UTF-8 mit BOM, Semikolon-Trenner (Excel-kompatibel). Blob-Download.
- **PDF:** jsPDF – Deckblatt (User, Zeitraum), pro Workout Tabelle. Alternative: nur „Übungs-Report" pro Übung mit eingebettetem Chart (als Canvas-DataURL).
- **JSON Backup:** komplettes Dump aller Collections als `gymlog-backup-YYYY-MM-DD.json`.

---

## 9. Vorbefüllte fixe Trainingspläne

Beim ersten Login für den User automatisch anlegen (nur wenn `plans` leer):

### Plan 1: „Push Pull Full Body 4x" (David's aktueller Split)
Tage:
1. **Push Full Body A** – Bankdrücken 4×6-8, Overhead Press 3×8, Kniebeuge 3×6, Dips 3×10, Trizeps-Drücken Kabel 3×12, Seitheben 3×15
2. **Pull Full Body A** – Kreuzheben 3×5, Klimmzug 4×6-10, Langhantelrudern 3×8, Rumänisches Kreuzheben 3×10, Bizeps-Curl Kurzhantel 3×12, Face Pull 3×15
3. **Push Full Body B** – Schrägbankdrücken Kurzhantel 4×8, Beinpresse 3×10, Military Press 3×8, Butterfly 3×12, Trizeps-Pushdown Seil 3×12, Wadenheben 4×12
4. **Pull Full Body B** – Kreuzheben 3×5 light, Latzug 4×10, T-Bar Rudern 3×10, Beincurl 3×12, Hammer Curl 3×12, Reverse Fly 3×15

### Plan 2: „Push Pull Legs 6x"
PPL klassisch, 6 Tage.

### Plan 3: „Upper Lower 4x"
Oberkörper/Unterkörper.

### Plan 4: „Full Body 3x" (Einsteiger)
3 Ganzkörper-Tage.

### Plan 5: „Starting Strength"
Klassischer A/B SS mit Kniebeuge, Bank, Rudern, OHP, Kreuzheben.

---

## 10. Vorbefüllte Übungs-Bibliothek

Beim ersten Login (nur wenn leer) ca. **80 Übungen** anlegen. Kategorisiert:

### Push (Brust/Schulter/Trizeps)
Bankdrücken, Schrägbankdrücken (LH/KH), Negativbankdrücken, Kurzhantel-Bankdrücken, Butterfly, Kabel-Crossover, Dips, Liegestütze, Military Press, Overhead Press (KH), Arnold Press, Seitheben, Front Raise, Trizeps-Drücken Langhantel (SZ), Trizeps-Pushdown Seil, Overhead Trizeps Extension, Dips eng, Diamant-Liegestütze.

### Pull (Rücken/Bizeps)
Kreuzheben konventionell, Sumo-Kreuzheben, Rumänisches Kreuzheben, Klimmzug (Weit/Eng/Neutral), Latzug (Weit/Eng), Langhantelrudern, Kurzhantelrudern einarmig, T-Bar Rudern, Kabelrudern sitzend, Face Pull, Reverse Fly, Shrugs, Bizeps-Curl Langhantel, Bizeps-Curl Kurzhantel, Hammer Curl, Konzentrations-Curl, Preacher Curl, Kabel-Bizeps-Curl.

### Legs
Kniebeuge (High-Bar/Low-Bar), Front-Kniebeuge, Beinpresse, Hackenschmidt, Ausfallschritte (KH/LH), Bulgarian Split Squat, Beinstrecker, Beincurl liegend, Beincurl sitzend, Nordic Curl, Hip Thrust, Glute Bridge, Wadenheben stehend, Wadenheben sitzend, Goblet Squat.

### Core
Plank, Side Plank, Hanging Leg Raise, Russian Twist, Cable Crunch, Ab Wheel Rollout, Dead Bug, Hollow Hold, Bauchpresse Maschine.

### Cardio
Laufen, Rudergerät, Fahrrad, Stepper, Jump Rope, Burpees, HIIT Intervalle.

### Full Body / Olympic
Clean & Press, Snatch, Thruster, Kettlebell Swing, Turkish Get-Up, Farmers Walk.

Für jede Übung: Name, Category, muscleGroups, Equipment, kurze Notes (1 Satz Technik-Tipp). `isCustom: false`.

---

## 11. PWA-Anforderungen

### 11.1 manifest.json
```json
{
  "name": "GymLog",
  "short_name": "GymLog",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0b0d10",
  "theme_color": "#0b0d10",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 11.2 Service Worker (sw.js)
- `install`: wichtige Assets vorcachen (`index.html`, `manifest.json`, Icons, Chart.js, jsPDF, Firebase SDK CDN URLs)
- `activate`: alte Caches löschen
- `fetch`:
  - Für Navigation (HTML): **network-first**, Fallback auf Cache
  - Für statische Assets: **cache-first**
  - Firestore-Requests NIE cachen (bypass)
- Cache-Name: `gymlog-v1` – bei jedem Deploy manuell erhöhen (v2, v3, …)

### 11.3 iOS Spezifika
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<link rel="apple-touch-icon" href="icon-192.png">`
- Safe-Area in CSS beachten
- iOS Safari fällt bei `signInWithPopup` oft um → auto-Fallback auf `signInWithRedirect`

---

## 12. Deployment

- Repo: `davidflasch2009/gymlog` (GitHub Pages aus `main` Branch)
- Live-URL wird `https://davidflasch2009.github.io/gymlog/` sein → in Firebase Console als Authorized Domain eintragen
- Lokale Dev-Dateien auf Laptop: `~/Desktop/gymlog/`
- Workflow: Datei ändern → `git add . && git commit -m "..." && git push` → GitHub Pages deployed automatisch
- **Service Worker Cache bei jedem Deploy bumpen!** (sonst iPhone zeigt alte Version)

---

## 13. Edge Cases / Qualitäts-Checks

- **Workout-Resume:** Wenn App gekillt wird während Workout läuft → beim Öffnen aus `gymlog.activeWorkout` wiederherstellen und Banner anzeigen.
- **Offline Workout:** Komplett ohne Netz tracken möglich; Sync beim nächsten Online-Event.
- **Doppelter Login:** Wenn User auf iPhone und Laptop parallel – Firestore-Listener zeigt live den gleichen Stand.
- **Zeitzonen:** Alle Dates als ISO-String `YYYY-MM-DD` lokal, Timestamps als Firestore Timestamp.
- **Zahleneingabe iOS:** `<input type="number" inputmode="decimal" step="0.5">` – kein Zoom beim Fokus (`font-size: 16px` mindestens).
- **Hitboxes:** Alle Buttons min. 44×44 px.
- **Delete-Operationen** immer mit Confirm-Dialog (nicht `confirm()`, sondern eigenes Modal).
- **Error-Handling:** Firestore-Fehler als Toast anzeigen, nicht silent swallow.

---

## 14. Reihenfolge der Implementierung (bitte so arbeiten)

1. Grundgerüst: `index.html`, `manifest.json`, `sw.js`, Icons-Platzhalter, Firebase-Config, Google-Sign-In funktionsfähig.
2. Design-System + Bottom-Nav + alle 5 leeren Tabs.
3. Store-Abstraktion + localStorage-Mirror + Firestore-Persistence.
4. Übungs-Bibliothek: vorbefüllt beim ersten Login + Suche + Filter + Custom-Übung anlegen.
5. Trainingsplan-Datenstruktur + fixe Pläne vorbefüllen + Plan-Liste anzeigen.
6. Workout-Flow: freies Workout → Set tracken → beenden → in Firestore speichern.
7. Workout-Flow aus Plan starten + Rest-Timer + aktives Workout persistieren.
8. PR-Berechnung + PR-Toast + PR-Anzeige in Übungs-Detail.
9. Fortschritt-Tab: Körpermaße-CRUD + Chart.js Linien-Diagramme.
10. Übungs-Diagramme (1RM, Volumen, Max-Gewicht).
11. Workout-Heatmap-Kalender.
12. Export CSV + Export PDF + JSON Backup/Restore.
13. **Arrow-Import-Funktion** (siehe §16) – Button im Mehr-Tab, Textarea + File-Upload, Validierung, Preview, Commit.
14. Einstellungen (Theme, Einheit, Rest-Default, …).
15. PWA-Polish: Service-Worker-Cache sauber, iOS-Meta-Tags, Install-Prompt.
16. QA-Durchlauf: alle Edge Cases aus §13 prüfen.

---

## 15. Wichtig für Claude Code

- **Single-File:** alles in `index.html` inline, keine ESM-Imports außer Firebase CDN & Chart.js CDN & jsPDF CDN.
- **Kein Build-Step.** Direkt im Browser lauffähig.
- **Code-Qualität:** sauberes IIFE oder module-pattern, Funktionen klein halten, Kommentare auf Deutsch an kritischen Stellen.
- **Keine Platzhalter wie „TODO" oder „// implement later".** Alles fertig implementieren.
- **Nach jedem großen Schritt** einen kurzen Test-Hinweis geben, was ich im Browser prüfen soll.
- **Firebase-Config** leer lassen (`apiKey: "DEINE_API_KEY"` etc.), ich füge die echten Werte selbst ein.

Los geht's – fang mit Schritt 1 an und frag mich, bevor du zu Schritt 2 gehst.

---

## 16. Arrow-Import (migrierte Workouts aus der alten App)

Ich habe bisher alle Workouts in der App **„Arrow: Social Workout Tracker"** (LevelUp App Studios) getrackt. Arrow bietet keinen offiziellen Export. Workflow: Ich mache Screenshots meiner Arrow-History und lasse die Werte von Claude extrahieren. Claude liefert mir einen JSON-Block im unten definierten Format zurück. **In der GymLog-App brauche ich einen Import-Button, der diesen JSON-Block direkt einliest und die Workouts/PRs/Übungen anlegt.**

### 16.1 UI (im Mehr-Tab)

- Button **„🏹 Arrow-Import"** öffnet eine eigene Seite / ein großes Modal:
  - Headline: „Arrow-Import"
  - Kurzer Hinweis-Text: „Fügst du den JSON-Block aus deinem Chat hier ein. Wir zeigen dir vor dem Speichern eine Vorschau."
  - **Textarea** (monospace, min. 300px hoch) zum Reinpasten des JSON
  - Alternativ **File-Upload** für `.json`-Datei
  - Button **„Validieren & Vorschau"**
  - Nach Validierung: Preview-Panel mit Statistiken
    - X Workouts gefunden
    - Y einzigartige Übungen (Z davon neu, werden in Bibliothek angelegt)
    - Zeitraum von – bis
    - Liste der ersten 5 und letzten 5 Workouts
    - Warnungen (fehlende Felder, Duplikate basierend auf Datum+Übung)
  - Zwei Buttons unten: **„Abbrechen"** / **„Import bestätigen"**
- Nach Bestätigung:
  - Progress-Anzeige („Importiere Workout 12/47…")
  - Toast am Ende: „✅ 47 Workouts, 23 Übungen und 18 PRs importiert"

### 16.2 Import-JSON-Format (verbindlich)

```json
{
  "source": "arrow",
  "exportedAt": "2026-10-01T12:00:00Z",
  "version": 1,
  "exercises": [
    {
      "name": "Bankdrücken",
      "category": "Push",
      "muscleGroups": ["Brust", "Trizeps", "Schulter"],
      "equipment": "Langhantel",
      "notes": ""
    }
  ],
  "workouts": [
    {
      "date": "2026-07-14",
      "name": "Push A",
      "durationSec": 4200,
      "bodyWeightKg": 82.0,
      "notes": "Bank gut, Schulter zwickt",
      "entries": [
        {
          "exerciseName": "Bankdrücken",
          "sets": [
            { "reps": 8, "weightKg": 70, "rpe": 7, "done": true },
            { "reps": 6, "weightKg": 80, "rpe": 9, "done": true },
            { "reps": 3, "weightKg": 90, "rpe": 10, "done": true }
          ]
        },
        {
          "exerciseName": "Kreuzheben",
          "sets": [
            { "reps": 5, "weightKg": 120, "rpe": 8, "done": true }
          ]
        }
      ]
    }
  ],
  "progressEntries": [
    {
      "date": "2026-07-01",
      "bodyWeightKg": 81.5,
      "bodyFatPct": null,
      "measurements": null,
      "notes": ""
    }
  ]
}
```

### 16.3 Import-Logik (so verarbeiten)

1. **Validierung:**
   - JSON-Parse mit try/catch – bei Fehler rote Error-Box mit Zeilennummer
   - Prüfen dass `source === "arrow"` und `version === 1`
   - Pflichtfelder prüfen: `workouts[].date`, `workouts[].entries[].exerciseName`, `sets[].reps`, `sets[].weightKg`
   - Datumsformat `YYYY-MM-DD` prüfen
   - Zahlen-Felder auf `>= 0` prüfen
   - Bei fehlenden optionalen Feldern (rpe, notes, durationSec, bodyWeightKg) Defaults setzen (`rpe: null`, `notes: ""`, Dauer aus 60s × Anzahl Sätze schätzen)

2. **Übungs-Mapping:**
   - Für jede im Import vorkommende `exerciseName`: lookup in `users/{uid}/exercises`
   - Match **case-insensitiv und trimmed** auf `name` oder auf alte Aliase
   - Wenn Übung existiert → `exerciseId` wiederverwenden
   - Wenn nicht: aus `exercises[]`-Block der Import-JSON Metadaten holen und neue Übung mit `isCustom: true` anlegen. Fehlt der Eintrag im Block, Fallback: Übung mit `category: "Full Body"`, `equipment: "Unbekannt"`, leeren muscleGroups anlegen – Toast-Hinweis am Ende.

3. **Workout-Insert:**
   - Pro Workout ein Dokument in `users/{uid}/workouts/{autoId}` schreiben
   - `startedAt` = `date` als 18:00 Uhr lokal, `endedAt` = `startedAt + durationSec`
   - `entries[].exerciseId` setzen (aus Mapping), `exerciseName` als Snapshot behalten
   - **Duplikat-Check:** Falls bereits ein Workout am selben `date` mit identischer Entries-Liste existiert → überspringen und in Preview als „Duplikat" markieren
   - **Batched Writes:** Firestore in Batches zu je 500 Operationen; progress-Callback für UI

4. **PRs neu berechnen:**
   - Nach Import einmal `recalculateAllPRs()` laufen lassen über alle Workouts (nicht nur neue), damit PRs korrekt sind
   - PRs in `users/{uid}/prs/{exerciseId}` schreiben
   - Keine PR-Toasts beim Import (sonst 100 Pop-Ups)

5. **Progress-Entries:**
   - Pro Eintrag ein Dokument in `users/{uid}/progress/{autoId}`
   - Duplikat-Check auf `date`

6. **Rollback:**
   - Jeden Import als eine „Import-Transaction" markieren: in `users/{uid}/meta/imports/{importId}` Metadaten + Liste aller angelegten Doc-IDs speichern
   - Button **„Letzten Import rückgängig machen"** im Mehr-Tab → löscht alle Docs dieser Transaction
   - Nur der letzte Import ist rückgängig machbar

### 16.4 Edge Cases

- **Unbekannte Übungs-Namen:** wie oben beschrieben – neu anlegen mit Fallback-Werten, Warnung im Preview.
- **Teilweise fehlerhafte Workouts:** einzelne kaputte Workouts überspringen, Import läuft weiter, Fehler-Zusammenfassung am Ende.
- **Große Imports (> 200 Workouts):** JSON in Chunks à 50 Workouts verarbeiten, UI nicht blockieren (`setTimeout` 0 zwischen Chunks).
- **Reihenfolge:** Workouts nach `date` aufsteigend sortieren vor Insert, damit PR-Zeitstrahl stimmt.
- **Einheiten:** falls im Import `"weightLb"` statt `"weightKg"` → automatisch zu kg konvertieren (`× 0.4536`), Toast-Hinweis.
- **Mehrfach-Import:** erlaubt, Duplikat-Check verhindert Chaos.

### 16.5 Beispiel-UI-Text für Validierungs-Preview

```
✅ JSON gültig
📅 Zeitraum: 14.07.2026 – 29.09.2026
🏋️  47 Workouts gefunden
📊 23 einzigartige Übungen (5 davon neu – werden angelegt)
📈 3 Körper-Einträge
⚠️  2 Workouts könnten Duplikate sein (14.08., 22.08.)
⚠️  1 Übung ohne Kategorie-Info: „Reverse Pec Deck" – wird als „Pull" angelegt

Importieren?  [ Abbrechen ]  [ Import bestätigen ]
```

### 16.6 Reihenfolge der Umsetzung für den Import

a) Nur die UI (Textarea, File-Upload, Buttons, Preview-Panel-Layout).
b) JSON-Parsing + Validierung + Preview-Statistiken (ohne Insert).
c) Übungs-Mapping + Neuanlage.
d) Workout-Insert + Duplikat-Check (batched).
e) PR-Recalculation.
f) Progress-Entries-Insert.
g) Import-Transaction-Logging + Rollback-Button.
h) Edge-Cases + Chunking + Fehler-Zusammenfassung.

---

## 17. Fortschritt / Analytics im Detail

Das ist das Herzstück der App. Jeder Chart hat: **Titel**, kurzen **Infotext**, **Chart.js-Diagramm**, **Haupt-Zahl** groß darüber (aktueller Wert + Delta vs. Vorperiode in grün/rot), optional **„Details"-Link** auf Vollbild.

Alle Zeitreihen beachten den globalen Zeitraum-Filter. „Delta vs. Vorperiode" vergleicht mit gleich langem Zeitraum davor.

### 17.1 Tab „Übersicht" (Dashboard)

Scrollbare Grid-Liste mit folgenden Karten (in dieser Reihenfolge):

1. **Streak-Karte** – aktueller Trainings-Streak in Tagen/Wochen, längster Streak jemals.
2. **Workouts gesamt** – große Zahl, darunter Mini-Bar-Chart der letzten 12 Wochen.
3. **Volumen diese Woche** – Tonnage in kg, Delta vs. letzte Woche in %.
4. **Trainingstage pro Monat** – aktueller Monat vs. Durchschnitt der letzten 6 Monate.
5. **Konsistenz-Score** – 0–100, berechnet aus (tatsächliche Workouts / geplante Workouts im Split × 100), geglättet über 4 Wochen.
6. **Big 3 Estimated 1RM** – 3 große Zahlen nebeneinander: Bank, Kniebeuge, Kreuzheben – jeweils mit Mini-Sparkline (letzte 90 Tage).
7. **Push / Pull / Legs Balance** – Donut-Chart mit Set-Verteilung der letzten 4 Wochen.
8. **Nächster PR-Angriff** – Übung mit der höchsten „PR-Dringlichkeit" (lange nicht trainiert aber nahe am PR), inkl. Vorschlag „Versuche 92 kg × 3".
9. **Aktive PRs** – Anzahl Übungen bei denen in den letzten 4 Wochen ein PR fiel.
10. **Heatmap letzte 7 Tage** – 7 Zellen mit Volumen pro Tag, hover = Workout-Name.

### 17.2 Tab „Kraft"

**Dropdown oben:** Übung wählen (Default: Bankdrücken). Darüber **„Big 3"-Shortcut-Buttons** für Bank/Kniebeuge/Kreuzheben.

- **17.2.1 Geschätztes 1RM-Verlauf (Line)** – pro Session bester Satz via Epley `w × (1 + reps/30)`. Trendlinie dazu.
- **17.2.2 Max-Gewicht pro Session (Line + Dots)** – schwerstes bewegtes Gewicht (reps ≥ 1).
- **17.2.3 Reps bei Zielgewicht (Line)** – wenn User Zielgewicht setzt (z. B. „bei 80 kg wie viele Reps schaff ich?"), Linie zeigt max. Reps pro Session bei dem Gewicht ±2,5 kg.
- **17.2.4 Trainings-Intensität (Line)** – (bestes Gewicht der Session / aktuelles 1RM) × 100 % – zeigt wie schwer trainiert wurde.
- **17.2.5 Relative Kraft (Zahl + Line)** – `1RM / Körpergewicht`. Mit Benchmark-Linien (für Bank: 1.0 = solid, 1.5 = fortgeschritten, 2.0 = elite).
- **17.2.6 PR-Timeline (Scatter)** – jeder Punkt ein PR, X=Datum, Y=1RM. Hover zeigt „95 kg × 1, am 14.03.26".
- **17.2.7 „Days since last PR"-Zähler** – groß und rot wenn > 60 Tage.
- **17.2.8 Prognose (Line, gestrichelt)** – lineare Regression der letzten 90 Tage, projiziert 60 Tage in Zukunft. „Bei aktuellem Trend am 15.11. ≈ 97 kg".
- **17.2.9 Big 3 Total (Zahl + Line)** – Summe der 1RMs von Bank+Kniebeuge+Kreuzheben über Zeit.
- **17.2.10 Wilks-Score (Zahl + Line)** – wenn Körpergewicht bekannt, standardisierter Powerlifting-Score für Big 3.
- **17.2.11 Strength Ratios (Balken)** – Kniebeuge/Bank, Kreuzheben/Bank, Rudern/Bank. Grüner Balken wenn im „gesunden" Bereich, roter wenn Imbalance.

### 17.3 Tab „Volumen"

Drei Scope-Buttons oben: **Gesamt** | **Pro Übung** | **Pro Muskelgruppe**.

- **17.3.1 Tonnage pro Woche (Bar)** – Σ(reps × weight) pro Kalenderwoche. Durchschnitts-Linie overlay.
- **17.3.2 Sets pro Woche (Bar)** – reine Set-Anzahl.
- **17.3.3 Reps pro Woche (Bar)**.
- **17.3.4 Durchschnittliches Volumen pro Workout (Line)** – zeigt Dichte: wird jedes Training „voller"?
- **17.3.5 Volumen-Verteilung Tage (Radar)** – Mo-So Radar, wo im Wochenzyklus die meiste Arbeit passiert.
- **17.3.6 Volumen pro Übung (Horizontal Bar Top 10)** – meist-trainierte Übungen im Zeitraum.
- **17.3.7 Volumen-Trend pro Übung (Line, gewählte Übung)** – wie 17.2.1 aber für Volumen.
- **17.3.8 Set-Intensitäts-Mix (Stacked Bar)** – pro Woche: % der Sätze in Rep-Ranges 1-5 / 6-10 / 11-15 / 16+. Zeigt ob Kraft-, Hypertrophie- oder Ausdauer-fokussiert.
- **17.3.9 Tonnage Jahresvergleich (Line, 2 Linien)** – dieses Jahr vs. letztes Jahr parallel geplottet.
- **17.3.10 Pausenzeit-Durchschnitt (Line)** – durchschnittliche Pause pro Satz pro Workout, zeigt Trainings-Effizienz / Qualität.

### 17.4 Tab „Muskeln"

Der visuell coolste Tab.

- **17.4.1 Body-Heatmap (SVG, interaktiv)** – menschliche Figur **vorne + hinten** als SVG. Jede Muskelgruppe eingefärbt nach Trainings-Volumen im Zeitraum (grün=viel, grau=wenig). Tap auf Muskel → Detail-Modal mit Zahlen und Übungen.
- **17.4.2 Sets pro Muskelgruppe pro Woche (Bar)** – klassische „Volume Landmarks" Darstellung mit Linien bei **MEV (10)**, **MAV (15)**, **MRV (20)**. Zeigt pro Muskel ob zu wenig / optimal / zu viel.
- **17.4.3 Muskelgruppen-Donut** – Set-Verteilung in den gewählten Zeitraum (Brust x %, Rücken y %, …).
- **17.4.4 Push vs Pull Ratio (Zahl + Line)** – ideal 1.0, zeigt Rücken/Brust-Balance. Warnung ab < 0.8 oder > 1.2.
- **17.4.5 Beine vs Oberkörper Ratio (Zahl + Line)** – als Set-Verhältnis.
- **17.4.6 Vernachlässigte Muskelgruppen** – Liste der Muskeln die im Zeitraum unter MEV (10 Sets/W) blieben, rot markiert mit Vorschlag-Übungen.
- **17.4.7 Muskel-Fortschritt pro Gruppe (Line)** – gewählte Muskelgruppe: Sets/W über Zeit.
- **17.4.8 Übungs-Vielfalt (Zahl)** – wie viele unterschiedliche Übungen pro Muskelgruppe im Zeitraum (variety score).

### 17.5 Tab „Körper"

- **17.5.1 „+ Eintrag"-Button** oben – öffnet Formular (Datum, Gewicht, BF %, 7 Umfang-Felder, Foto, Notes).
- **17.5.2 Körpergewicht-Verlauf (Line)** – mit 7-Tage-Moving-Average overlay. Zeigt Delta vs. Monat davor.
- **17.5.3 BF %-Verlauf (Line)** – falls Daten vorhanden.
- **17.5.4 Fettfreie Masse (Line)** – `weight × (1 – bf/100)`, falls BF% vorhanden.
- **17.5.5 Umfang-Charts (Line, Multi-Series)** – alle 7 Umfänge in einem Chart, Legend-Toggle pro Linie.
- **17.5.6 Verhältnisse (Zahlen):** Schulter/Taille (idealer „Adonis-Index" ~1.618), Taille/Hüfte, Arm/Oberschenkel.
- **17.5.7 Fotos-Timeline (horizontal scrollable)** – Thumbnails chronologisch, Tap öffnet Vorher/Nachher-Vergleichs-Slider.
- **17.5.8 History-Liste** – alle Einträge absteigend, editierbar, löschbar.

### 17.6 Zusätzliche Spezial-Statistiken (verteilt in den Tabs oder als „Mehr Stats"-Button)

- **Beste Tageszeit** (Pie) – wann trainiere ich am häufigsten (Morgens 5-10 / Vormittag 10-14 / Nachmittag 14-18 / Abend 18-24).
- **Lieblings-Übung** – meist-trainiert insgesamt und im Zeitraum.
- **„Verwaiste" Übungen** – länger als 60 Tage nicht mehr trainiert, aber früher regelmäßig.
- **Workout-Dauer-Verteilung** (Histogram).
- **Satz-Anzahl pro Workout (Line)**.
- **Durchschnittliches RPE pro Workout (Line)** – falls RPE getrackt.
- **RPE-Volumen** (Line) – `Σ(reps × weight × rpe/10)` als „adjustierte Tonnage".
- **„Komplett-Rate"** – % der geplanten Sätze die als `done` abgehakt wurden.
- **PRs pro Monat (Bar)** – wo lief's richtig?
- **Trainings-Konsistenz-Heatmap** (GitHub-Style, 52 Wochen × 7 Tage) – mit Farb-Intensität nach Volumen des Tages.
- **Rekord-Workout** – Session mit höchster Tonnage, mit „öffnen"-Link.
- **„Wie viele Big-Mac bewegt?"** – Fun-Stat: Tonnage gesamt in witzige Einheiten (Elefanten, Autos, Big Macs à 230g).
- **Erste-Hilfe-Ampel pro Übung** – grün (gut Progress), gelb (stagnation > 4 W), rot (Regression > 4 W).

### 17.7 Berechnungs-Formeln (zentrale Util-Funktionen bauen)

```js
// Geschätztes 1RM (Epley)
e1RM = weight * (1 + reps / 30)

// Volumen eines Satzes
setVolume = reps * weight

// Workout-Tonnage
tonnage = Σ setVolume aller done-Sets

// Wilks-Score (vereinfacht, Männer, kg)
// Siehe Standard-Wilks-Koeffizienten – als Lookup-Tabelle einbauen

// Relative Kraft
relStrength = 1RM / bodyWeight

// Konsistenz-Score
consistency = (actualWorkoutsInPeriod / plannedWorkoutsInPeriod) * 100

// Set-Zuordnung zu Muskelgruppen
// Für jede Übung aus exercise.muscleGroups kommt pro Set 1 Count auf jede Gruppe
// (keine Fraktionierung – sauber und einfach)

// Lineare Regression für Prognose
// Standard least-squares auf (dayIndex, 1RM) über letzte 90 Tage,
// projizieren auf Tag today + 60
```

### 17.8 Performance / Caching

- Analytics-Daten einmal pro Workout-Insert in `users/{uid}/meta/analyticsCache` vorberechnen, nicht bei jedem Tab-Öffnen neu durch alle Workouts rechnen.
- Cache-Struktur: `{ byWeek: { "2026-W40": {...} }, byExerciseId: {...}, byMuscle: {...}, lastRecalc: ts }`
- Bei Zeitraum-Wechsel: in-Memory-Filter auf Cache, kein Firestore-Hit.
- Beim Import oder Workout-Delete: Full-Recalc im Hintergrund (Web Worker falls > 500 Workouts).

### 17.9 Umsetzungs-Reihenfolge der Analytics

a) Dashboard-Tab mit 10 Karten (einfachste Stats zuerst).
b) Kraft-Tab mit 1RM-Verlauf + Max-Gewicht + PR-Timeline.
c) Volumen-Tab mit Tonnage, Sets, Reps pro Woche.
d) Muskel-Tab: erst Sets/Muskel/Woche + Push-Pull-Ratio, dann SVG-Body-Heatmap.
e) Körper-Tab komplett.
f) Spezial-Stats (17.6) sukzessive.
g) Analytics-Cache einbauen sobald > 50 Workouts Last erzeugen.
h) Prognose-Linien, Wilks, Spezial-Features.

