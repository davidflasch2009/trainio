# Trainio – Hinweise für KI-Assistenten (Claude, Codex …)

PWA ohne Build-Step: `index.html`, `css/*.css`, `js/*.js`. Funktionen und Einrichtung: README.md, Begriffe: CONTEXT.md.
Kommunikation, UI-Texte und Kommentare auf Deutsch.

## Aufbau

- **Ladereihenfolge = `index.html`.** Alle `js/*.js` sind klassische Skripte und teilen sich einen gemeinsamen
  Gültigkeitsbereich (keine Module, kein `import`). Eine Datei darf beim **Laden** nur nutzen, was in früheren Dateien
  steht; in Funktionen (beim Rendern, Klicken …) ist alles erreichbar. Funktions-Hoisting gilt nur innerhalb einer Datei.
- **Schichten** (in Ladereihenfolge): `config`, `core` (Hilfen, Einstellungen, Speicher-Schlüssel) → `seeds`, `store`
  (Daten, Sync) → `ui`, `sky`, `motion` (Bausteine, Darstellung, Bewegung) → `analytics`, `workout` (Berechnungen,
  Workout-Zustand) → Ansichten: `start`, `training`, `history`, `workout-ui`/`-actions`/`-summary`, `keypad`,
  `exercises`, `charts`, `body-map`, `progress*`, `heart`, `more`, `import` → `boot` (Start der App).
- **Styles**: `css/*.css` in der Reihenfolge aus `index.html` – spätere Regeln gewinnen. Tokens zuerst, Designs und
  Bewegung danach.
- **Neue Datei**: in `index.html` an der richtigen Stelle eintragen (mit `?v=`), README-Tabelle ergänzen. Service Worker
  und Release-Skript finden sie dann selbst; `tests/static.js` prüft, dass jede Datei geladen wird.
- **Dateien aufteilen**: nur zusammenhängende Abschnitte verschieben und direkt hintereinander laden – dann läuft der
  Code exakt wie vorher. Vorher prüfen, dass beim Laden ausgeführter Code keine Funktion aus einem späteren Teil braucht.

## Tests

- `npm test` (Chromium), `BROWSER=webkit npm test` (Safari-Engine), `ONLY=verlauf,tastatur npm test` (einzelne Abläufe).
- `tests/static.js` ohne Browser, `tests/e2e/<ablauf>.js` je ein Ablauf, eingetragen in `tests/run.js`,
  gemeinsame Hilfen in `tests/lib/harness.js`, Beispieldaten in `tests/lib/beispieldaten.js`.
- Auf GitHub laufen beide Browser; veröffentlicht wird nur, wenn beide grün sind.

## Ablauf nach jeder fertigen Änderung (ohne Nachfrage)

David möchte, dass fertige Änderungen **immer automatisch live gehen**:

1. `npm test` muss grün sein (bei neuen Funktionen den passenden Ablauf in `tests/e2e/` ergänzen oder einen neuen
   anlegen und in `tests/run.js` eintragen), README bei neuen Funktionen anpassen.
2. `python3 tools/release.py <version>` – Patch (x.y.**z**) für Fixes und kleine Änderungen,
   Minor (x.**y**.0) für neue Funktionen.
3. Committen und auf `main` pushen – GitHub Pages veröffentlicht `main`, sobald die Tests grün sind.
4. Erledigte GitHub-Issues schließen (mit kurzem Kommentar).
