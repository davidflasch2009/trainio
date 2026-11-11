# Vorbilder: Was macht Fitness-Apps professionell?

- **Typ:** research (AFK)
- **Status:** erledigt
- **Übernommen von:** Claude (Recherche-Agent)
- **Blockiert durch:** –

## Frage

Was macht gut gestaltete Fitness- und Tracking-Apps professionell, und was davon passt zu Trainio?
David hat keine Vorbild-Apps genannt, deshalb braucht die neue Basis eine belegte Grundlage:

- Leitlinien aus Apple Human Interface Guidelines (iOS) und Material 3: Schriftstufen, Abstände, Raster,
  Dichte, Farbe, Umgang mit großen Zahlen, Diagramme.
- Was anerkannt gut gestaltete Apps (z. B. Apple Fitness, Hevy, Strong, Whoop, Strava, Gentler Streak, Oura)
  gemeinsam haben: Typografie, Karten vs. Listen, Zahl der Farben, Symbole statt Emojis, Diagramm-Stil,
  Datendichte, leere Zustände. Quellen: offizielle Design-Beiträge, Case Studies, Auszeichnungen (Apple Design Awards).
- Konkrete, übertragbare Regeln für eine Web-App ohne Build-Step (z. B. „höchstens 5 Schriftstufen“, 4-px- oder
  8-px-Raster, Ziffern mit fester Breite).

Ergebnis: `docs/redesign/recherche/vorbilder.md` mit Quellen, verlinkt aus diesem Ticket.

## Antwort

Ergebnis: [recherche/vorbilder.md](../recherche/vorbilder.md) mit Quellen. Jede Aussage ist als Beleg, Auszug oder
Einschätzung gekennzeichnet.

- **Professionell heißt vor allem konsistent:** wenige Schriftstufen, ein festes 8er-Raster mit 4er-Feinraster,
  eine Akzentfarbe, ein Symbolsatz. Trainio hat heute in `css/app.css` grob 45 verschiedene Schriftgrößen,
  155 Abstands- und 40 Radius-Angaben.
- **Feste Zahlen:** Fließtext 17 pt, mindestens 11 pt. Tap-Ziel 44 × 44 pt. Kontrast 4,5 : 1 für Text,
  3 : 1 für Grafik. Höchstens etwa 5 Segmente und 1–2 hervorgehobene Knöpfe je Ansicht. Ziffern mit fester Breite.
- **Diagramme (Apple):** Balken oder Linie, etwa 4 Gitterlinien, ein Titel mit der Kernaussage, Vorschau-Diagramme
  ohne Achsen, aktuelle Werte farbig, der Rest zurückgenommen.
- **Gute Fitness-Apps:** eine Hauptzahl oben, feste Farbbedeutungen, Deutung in Klartext, wenige Tabs,
  plattformnahe Bausteine.
- **Liquid Glass gehört laut Apple nur in die Navigationsebene:** nicht auf Inhaltskarten, kein Glas auf Glas.
  Das ist wichtig für [Liquid Glass auf der neuen Basis](06-liquid-glass.md).
- **Eigene Schrift nur für Titel,** Systemschrift für Fließtext. Das ist eine saubere Grenze zwischen Basis und Design.
- **Lizenzen:** SF Pro darf nicht als Webfont eingebunden werden, die Systemschrift über `-apple-system` ist
  erlaubt. Freie Symbolsätze: Lucide, Phosphor, Tabler.

Grenze: Die Seiten von Material, WHOOP, Oura, Hevy und Strava waren gesperrt. Was zu diesen Apps drinsteht,
beruht auf Such-Auszügen.
