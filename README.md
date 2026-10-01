# Trainio

Workout-Tracker, Trainingsplan-Builder und Progress-Tracker als Single-File-PWA
(`index.html` mit allem CSS + JS inline, kein Build-Step).

- Läuft sofort im **lokalen Modus** (Daten im Browser), auch ohne Firebase.
- Mit Firebase: Google-Login + Sync zwischen iPhone und Laptop (Firestore, offline-fähig).
- Diagramme: Chart.js 4 · PDF-Export: jsPDF 2 · beide lazy per CDN geladen.

## Designs & Darstellung

Unter **Mehr → Design & Darstellung** gibt es 9 Designs, jedes in **Hell und Dunkel**
(oder automatisch nach System / Uhrzeit):

| Design | Look |
| --- | --- |
| Trainio | Neon-Grün auf Graphit – das Original |
| Liquid Glass | Glas-Material mit Unschärfe & Wallpaper, wie iOS 26 |
| Lernio | Petrol & IBM Plex – passend zur Lernio-App |
| Mono | Schwarz-Weiß, OLED-schwarz bzw. papierweiß |
| Brutal | Neo-Brutalismus: dicke Kanten, harte Schatten, Sticker-Farben |
| Soft | Weiche Schatten, alles rund |
| Iron | Industrial-Gym: Stahl, Orange, Condensed-Schrift |
| Neon | Synthwave mit Glow & Raster |
| Terminal | Monospace, Phosphor-Grün / Papier |

Dazu einstellbar: Akzentfarbe (12 Vorgaben oder eigene Farbe – Kontrast wird automatisch
angepasst), Glas-Hintergrund & Unschärfe, Ecken, Schrift, Textgröße, Dichte, hoher Kontrast,
Tab-Leiste (klassisch/schwebend, mit/ohne Beschriftung), Start-Tab, Animationen, Vibration,
Konfetti und Inhalte der Startseite.

## Workout-Ansicht (ausführlich)

- **Übersichtsleiste** oben: alle Übungen mit Fortschrittsring – antippen springt hin.
- **Ziel-Leiste** pro Übung (Sätze × Wdh. · Gewicht · Pause) – antippen öffnet den Ziel-Editor
  (Satzanzahl, Wdh.-Bereich, Gewicht, Pause, Notiz – optional auf alle offenen Sätze übertragen).
- **Liste** (alle Übungen) oder **Fokus** (eine Übung, große Eingaben, vor/zurück).
- **Übersicht**: alle Übungen mit Ziel & erledigten Sätzen, umsortieren, Ziele ändern.
- **Satz-Typen**: Aufwärmen (W), Drop-Satz (D), bis Muskelversagen (F).

## Meine Workouts & Trainingsplan

- Es gibt keine vorgegebenen Pläne – alles erstellst du selbst unter **Training**.
- **Meine Workouts**: Name + Übungen (Sätze, Wdh., Pause, Notiz), z. B. „Push", „Beine".
- **Trainingsplan**: für jeden Wochentag eines deiner Workouts oder Ruhetag. Start und
  „Nächstes Training" richten sich danach; die Konsistenz zählt die geplanten Tage.
- **Starten** nur über den Start-Tab („Workout starten“): nächstes Plan-Workout, eines deiner
  Workouts, Übungen wählen, leeres Workout oder letztes wiederholen. Jedes Workout lässt sich
  über ⋯ → „Als Workout speichern" unter „Meine Workouts" ablegen.

## Aufwärmsätze & Scheibenrechner

- **Mehr → Aufwärmsätze**: Prozent vom Arbeitsgewicht und Wdh. pro Aufwärmsatz frei
  einstellen (bis zu 6 Stufen, Vorlagen Kurz/Standard/Kraft, optional zuerst leere Stange).
- **Mehr → Scheiben & Stange**: verfügbare Scheiben (kg/lb) und Stangengewicht festlegen.
- Der **Scheibenrechner** zeigt die Beladung pro Seite mit Anzahl je Scheibe, Zielgewicht mit
  ±-Tasten und – falls nicht exakt ladbar – das nächste machbare Gewicht.

## Workout-Eingabe

- **Schlicht** (Standard): pro Satz nur Gewicht, Wdh. und Haken; Ziel, Aufwärmen, Scheiben,
  Notizen usw. hinter dem ⋯-Menü.
- **Ausführlich**: Übersichtsleiste, Ziel-Leiste, „Letztes Mal"-Spalte, RPE, Stepper.
- Umschalten unter **Mehr → Workout-Ansicht** oder im Workout über ⋯.
- **Nur aktuelle Übung offen** (Standard): fertige und kommende Übungen sind zugeklappt
  (Name + Sätze bzw. Ziel). Ist eine Übung fertig, klappt sie zu und die nächste öffnet sich;
  antippen öffnet jede Übung direkt. Abschaltbar unter **Mehr → Workout-Ansicht**.

## Funktionen ein-/ausschalten

**Mehr → Funktionen**: Übungen- und Fortschritt-Tab, einzelne Auswertungen, Pausen-Timer,
Aufwärmsätze, Scheibenrechner, Progressions-Vorschläge, PR-Feiern, Satz-Typen, Fokus-Modus,
Workout-Notizen, Arrow-Import und Tools – alles einzeln abschaltbar.

## Übungen & Muskel-Diagramm

- ~190 Übungen inkl. Maschinen, Kabel, Kettlebell, Core & Cardio. Bestehende Konten bekommen
  neue Übungen automatisch ergänzt.
- Body-Heatmap mit 23 Muskelregionen (z. B. obere/untere Brust, vordere/seitliche/hintere
  Schulter, Latissimus, Rhomboiden, Adduktoren, Soleus) plus sortierte Regionen-Liste.

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
