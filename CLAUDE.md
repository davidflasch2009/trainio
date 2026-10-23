# Trainio – Hinweise für Claude

PWA ohne Build-Step (`index.html`, `css/app.css`, `js/*.js`), Aufbau und Funktionen siehe README.md.
Kommunikation, UI-Texte und Kommentare auf Deutsch.

## Ablauf nach jeder fertigen Änderung (ohne Nachfrage)

David möchte, dass fertige Änderungen **immer automatisch live gehen**:

1. Im Browser testen (Playwright/Chromium, `python3 -m http.server`), README bei neuen Funktionen anpassen.
2. `python3 tools/release.py <version>` – Patch (x.y.**z**) für Fixes und kleine Änderungen,
   Minor (x.**y**.0) für neue Funktionen.
3. Committen und auf `main` pushen – GitHub Pages veröffentlicht `main` direkt.
4. Erledigte GitHub-Issues schließen (mit kurzem Kommentar).
