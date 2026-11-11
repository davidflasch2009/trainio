# Bestandsaufnahme: Was wirkt heute unprofessionell?

Ergebnis zu [Ticket 01](tickets/01-bestandsaufnahme.md). Stand: Trainio 1.33.1, Standard-Design „Trainio“ (`gymlog`),
aufgenommen am 11.11.2026 bei 390 × 844 px (iPhone-Breite, doppelte Pixeldichte). Begriffe wie in
[CONTEXT.md](../../CONTEXT.md). Hier wird nur beschrieben, nichts entschieden; Ideen stehen höchstens als
**Hinweis für die Basis** da.

## Kurz: die fünf größten Probleme

1. **Kein festes Raster für Schrift und Abstände.** `css/app.css` nutzt 34 verschiedene Schriftgrößen (davon
   8 halbe Pixel), 7 Schriftstärken, 20 Buchstabenabstände, 154 verschiedene Abstandswerte, 40 Eckenradien und
   82 verschiedene Schatten. Gerendert sind es 20 Schriftgrößen über 15 Bildschirme und bis zu 13 auf einem einzigen.
   Deshalb wirkt alles „ein bisschen anders“, nichts wie aus einem Guss.
2. **Alles ist gleich laut.** Fortschritt → Übersicht hat 23 Karten, 18 Info-Knöpfe und rund 3.100 Zeichen Text,
   aber keine Hauptaussage. Das ausführliche Workout zeigt 13 Schriftgrößen und 6 Schriftstärken auf einem Bildschirm.
3. **Grün ist überall und signalisiert deshalb nichts mehr.** Hauptknopf, Links, aktive Tabs, erledigte Sätze, alle
   Balken und Flächen sind grün. Dazu kommen eigene Farbsätze für Pulszonen, Phasen, Kategorien und Intensität.
4. **Die Diagramme haben keinen gemeinsamen Stil und sind teils irreführend.** Es gibt sieben Diagrammarten mit
   wechselnder Legende. Geglättete Linien und gestauchte Achsen übertreiben kleine Schwankungen, und Cardio-Tage
   zählen in Kraft-Diagrammen als 0 kg.
5. **Kleinigkeiten, die Vertrauen kosten.** Texte werden abgeschnitten („SÄTZE × W…“, „1.375 k“), die Pausen-Leiste
   verdeckt Knöpfe, und es gibt Widersprüche („PR-Bonus 0 · kein neuer Rekord“ direkt neben „Neuer PR“). Begriffe
   wechseln (Fertig/Beenden, Legs/Beine), Einheiten auch (kg/t).

## So entstand die Aufnahme

- **Werkzeug:** Chromium über Playwright, 390 × 844 px, Faktor 2, iPhone-Kennung, App lokal ohne Firebase (lokaler
  Modus). Die Zählungen stammen aus einem Skript über `css/app.css` (ohne Kommentare, je Deklaration) und aus einer
  Messung am gerenderten DOM je Bildschirm (sichtbare Textelemente, Modus Dunkel).
- **Beispieldaten:** 10 Wochen Push/Pull/Beine (Mo/Mi/Fr) mit steigenden Gewichten, insgesamt 28 Kraft-Workouts und
  8 Cardio-Einheiten (Laufband/Rad), dazu Körpergewicht 78 → 80,5 kg, Ruhepuls wöchentlich, Phase „Bulk Herbst“,
  Kraftziel Bankdrücken 5 × 90 kg und der Plan „Push / Pull / Beine“. Heute (Mittwoch) ist laut Plan „Pull“ dran.
- **Abweichungen vom iPhone:** Unter Linux fehlt SF Pro, die Schrift ist Inter (sehr ähnlich). Notch und
  Home-Balken fehlen. Die Unschärfe hinter Leisten kann am iPhone stärker sein. Meldungen oben (Toasts) wurden
  vor der Aufnahme entfernt, außer beim Workout-Abschluss. Lange Seiten sind auf 1.700 bzw. 2.600 px Höhe gekappt.

## Schwachstellen nach Schwere

### Hoch – prägen den Gesamteindruck

**H1 · Keine Schrift-Skala**
- **Was:** Größen, Stärken und Abstände der Schrift folgen keiner Stufung. Kartentitel haben 13 px, Diagramm-Titel
  14 px, Abschnitts-Überschriften 21, 22 oder 26 px. Dazwischen stehen viele halbe Stufen (9,5 / 10,5 / 11,5 / 12,5 /
  13,5 / 15,5 / 16,5 / 17,5 px).
- **Wo:** überall, am stärksten im laufenden Workout (ausführlich) und in Fortschritt → Übersicht.
- **Zahl:** 34 Basisgrößen in 242 `font-size`-Angaben (28 davon in den allgemeinen Regeln). Gerendert sind es 20
  verschiedene Größen, im ausführlichen Workout allein 13 Größen und 6 Stärken. Es gibt 7 Zahlenwerte für die
  Schriftstärke (400–750) plus 2 Variablen sowie 20 verschiedene Buchstabenabstände. 9 Angaben in CSS und
  9 Inline-Größen in JS ignorieren die Einstellung „Textgröße“.
- **Beleg:** [ist-workout-ausfuehrlich-dunkel](bilder/ist-workout-ausfuehrlich-dunkel.jpg),
  [ist-fortschritt-uebersicht-hell](bilder/ist-fortschritt-uebersicht-hell.jpg)
- **Hinweis für die Basis:** wenige benannte Schriftstufen (Titel, Überschrift, Text, Beschriftung, Zahl groß/klein),
  keine halben Pixel.

**H2 · Fortschritt → Übersicht ist überladen und ohne Hierarchie**
- **Was:** Viele gleich aufgebaute Karten folgen untereinander, jede mit Titel, Info-Knopf und meist einem
  Vollbild-Symbol. Darauf folgen zwei Tabellen, Balken, Punkte mit Linie, ein Ring, Tageskacheln, eine
  Kalender-Heatmap und „Mehr Stats“. Oben fehlt eine Hauptaussage. Die erste Karte (Streak) wiederholt die
  Startseite. Fußnoten in Karten erklären die Rechnung, z. B. „Vorwoche bis Di · heute zählt, sobald dein Workout
  gespeichert ist · ganze Vorwoche: 4 Workouts, 25,2 t“.
- **Wo:** Fortschritt → Übersicht. Etwas abgeschwächt gilt es auch für Herz & Cardio, Körper und Muskeln.
- **Zahl:** 23 Karten, 18 Info-Knöpfe, 13 Schriftgrößen, 8 Textfarben und rund 3.100 Zeichen auf einer Seite.
- **Beleg:** [ist-fortschritt-uebersicht-dunkel](bilder/ist-fortschritt-uebersicht-dunkel.jpg),
  [ist-fortschritt-uebersicht-hell](bilder/ist-fortschritt-uebersicht-hell.jpg)

**H3 · Grün als Dauerfarbe: Die Akzentfarbe hat keine Signalwirkung**
- **Was:** Grün tragen gleichzeitig der Hauptknopf, Textlinks („Analyse“, „Bearbeiten“, „+ Neu“, „Alle anzeigen“),
  aktive Tabs und Zeitraum-Chips, erledigte Sätze, Fortschrittsbalken, alle Balkendiagramme, Flächen unter Linien,
  positive Veränderungen, die Info-Symbole auf der Startseite, die Heatmap und die Muskelfigur. Im ausführlichen
  Workout sind über zehn Elemente gleichzeitig grün: Beenden, Fortschrittsbalken, Übungs-Pille, Kartenrahmen,
  „Alle übernehmen“, 2 Haken, Zeilenfläche, „Satz erledigt“, Pausen-Ring und Tab.
- **Zusätzliche Farbsätze:** Daneben gibt es eigene Paletten für Kategorie-Kürzel in Übungen, 5 Pulszonen mit
  getönten Flächen, die Intensität (Grün/Braun/Rot), die Phasen (fest im Code, z. B. `#22c55e`), Medaillen-Stufen
  und Diagramm-Serien (`--c1` bis `--c8`).
- **Zahl:** 76 feste Farbwerte außerhalb der Variablen in `css/app.css` (139 Vorkommen, 44 davon in allgemeinen
  Regeln) und 150 feste Hex-Farben in `js/*.js`.
- **Beleg:** [ist-workout-ausfuehrlich-hell](bilder/ist-workout-ausfuehrlich-hell.jpg),
  [ist-fortschritt-cardio-hell](bilder/ist-fortschritt-cardio-hell.jpg),
  [ist-uebungen-dunkel](bilder/ist-uebungen-dunkel.jpg)

**H4 · Laufendes Workout (ausführlich): dicht, abgeschnitten, verdeckt**
- **Was:** Texte werden abgeschnitten: das Etikett „SÄTZE × W…“, die Volumen-Zahl in der Kopfzeile („1.375 k“) und
  die Spalte „Letztes“ („137,5…“). Drei unterschiedlich gestaltete Pillen liegen übereinander („Letztes Mal …“,
  „Alle übernehmen“, „Ziel: …“). Für denselben Satz gibt es vier Eingabewege: Felder in der Zeile, Stepper, RPE-Reihe
  und Scheiben. Die Pausen-Leiste liegt über „Satz erledigt“, in der schlichten Ansicht über „Übung hinzufügen /
  Cardio“.
- **Wo:** Training mit laufendem Workout, ausführliche Ansicht (die schlichte ist deutlich ruhiger).
- **Zahl:** 13 Schriftgrößen, 6 Schriftstärken, 9 Eckenradien, 48 Knöpfe gerendert (schlicht: 7 Größen, 22 Knöpfe).
- **Beleg:** [ist-workout-ausfuehrlich-dunkel](bilder/ist-workout-ausfuehrlich-dunkel.jpg),
  [ist-workout-schlicht-hell](bilder/ist-workout-schlicht-hell.jpg)

**H5 · Diagramme ohne gemeinsamen Stil, teils irreführend**
- **Was:** Es gibt sieben Diagrammarten: senkrechte, waagerechte und gestapelte Balken, Linie mit Fläche, Punkte mit
  Durchschnittslinie, Ring, Kalender-Heatmap und Körperfigur. Die Legende steht mal unten als Punkte, mal rechts, mal
  fehlt sie. Jede Diagramm-Karte hat zwei Symbole (Info und Vollbild).
- **Geglättete Linien:** `tension: .25` in `js/charts.js` wölbt Kurven zwischen gleichen Messwerten über die Punkte
  hinaus.
- **Gestauchte Achsen:** Achsen beginnen nicht bei null. Beim Ruhepuls (Achse 59–62) sieht eine Schwankung von
  3 Schlägen wie ein Absturz aus.
- **Cardio-Tage als null:** Cardio-Einheiten zählen in Kraft-Diagrammen als 0. „Volumen pro Workout“ zeigt Punkte auf
  der Nulllinie, und die Ø-Linie mischt Kraft- und Cardio-Tage. In „Letzte 7 Tage“ steht „Sa 0kg“.
- **Beleg:** [ist-fortschritt-cardio-dunkel](bilder/ist-fortschritt-cardio-dunkel.jpg),
  [ist-fortschritt-volumen-dunkel](bilder/ist-fortschritt-volumen-dunkel.jpg),
  [ist-fortschritt-uebersicht-dunkel](bilder/ist-fortschritt-uebersicht-dunkel.jpg),
  [ist-fortschritt-kraft-hell](bilder/ist-fortschritt-kraft-hell.jpg)

**H6 · Widersprüche und gemischte Begriffe kosten Vertrauen**
- **Was:**
  - Der Workout-Abschluss zeigt „PR-Bonus 0 · kein neuer Rekord“, darunter aber „Neue PRs: Kreuzheben 140 kg × 4“ und
    oben die Meldung „Neuer PR“. Ein Gewichts-PR zählt also nicht als Rekord für den Workout-Score: Es gibt zwei
    PR-Begriffe.
  - Dieselbe Aktion heißt „Fertig“ (schlicht), „Beenden“ (ausführlich) und „Beenden & speichern“ (Rückfrage). Danach
    schließt „Fertig“ das Abschluss-Fenster.
  - Der Plan heißt „Beine“, das Diagramm „Push / Pull / Legs Balance“ mit Legende „Legs“.
  - In einer Liste steht „4.960 kg“ neben „15,6 t“. Daneben stehen „4.960kg“ ohne Leerzeichen und „137,5×5“ neben
    „82,5 kg × 8“.
  - Englische Begriffe stehen neben deutschen: Streak, Body-Heatmap, Top-Aufsteiger, PR-Angriff.
- **Beleg:** [ist-workout-abschluss-dunkel](bilder/ist-workout-abschluss-dunkel.jpg),
  [ist-start-hell](bilder/ist-start-hell.jpg), [ist-rueckfrage-hell](bilder/ist-rueckfrage-hell.jpg),
  [ist-fortschritt-uebersicht-hell](bilder/ist-fortschritt-uebersicht-hell.jpg)

### Mittel – fallen beim zweiten Hinsehen auf

**M1 · Abstände ohne Raster, Inhalte nicht auf einer Linie**
- **Was:** Abstände mischen 4er-, 6er- und 10er-Schritte. Auf der Startseite stehen die Kachel-Werte nicht auf einer
  Höhe: „11 Wochen“ steht höher als „4.960 kg“ daneben, „36“ höher als „Pull“. Jede Kachel ist innen anders gebaut
  (Punkte-Reihe, Veränderung, Untertitel).
- **Zahl:** 570 Abstands-Angaben mit 154 verschiedenen Werten (padding 118, margin 48, gap 20) und 29 px-Längen von
  1 bis 120. Nur 47 % der px-Angaben liegen im 4er-Raster. Häufigste Werte: 8 px (99 ×), 6 px (84 ×), 10 px (82 ×),
  12 px (81 ×), 4 px (79 ×).
- **Beleg:** [ist-start-dunkel](bilder/ist-start-dunkel.jpg), [ist-start-hell](bilder/ist-start-hell.jpg)

**M2 · Zu viele Komponenten-Varianten, Karten in Karten**
- **Was:** Fast alles steckt in einer Karte, oft mit einer weiteren Fläche darin: das Segment „Gesamt / Pro Übung /
  Pro Muskelgruppe“ in einer eigenen Karte, die Kennzahlen-Leiste in der Übungskarte, Pulszonen-Zeilen in einer
  Karte. Der Abschluss besteht aus 8 gleich großen Kacheln.
- **Zahl:**
  - 39 CSS-Klassen mit eigener Fläche, Ecken und Innenabstand, davon etwa 20 Karten/Kacheln und 13 Pillen/Chips.
  - 13 `.btn`-Klassen und 8 weitere knopfartige Klassen.
  - 22 Klassen für Listen-Zeilen (`-item`/`-row`).
  - 40 Eckenradien in 206 Angaben; die Radius-Variablen werden nur 9-mal genutzt, `--radius-lg` nie.
  - 82 verschiedene Schatten.
- **Beleg:** [ist-fortschritt-kraft-dunkel](bilder/ist-fortschritt-kraft-dunkel.jpg),
  [ist-workout-abschluss-hell](bilder/ist-workout-abschluss-hell.jpg),
  [ist-fortschritt-cardio-hell](bilder/ist-fortschritt-cardio-hell.jpg)
- **Hinweis für die Basis:** je eine Karte, Liste, Kachel und Pille mit festen Varianten. Radien und Schatten als
  wenige Stufen.

**M3 · Überschriften uneinheitlich, Haupt-Tabs ohne Titel**
- **Was:** Training, Fortschritt, Übungen und Mehr haben keinen Seitentitel. Sie beginnen direkt mit einem Segment,
  einer Tab-Leiste oder einem Suchfeld; nur Unterseiten wie „Darstellung“ bekommen einen großen Titel.
- **Vier Überschrift-Arten:**
  - groß und fett: „Ziele“, „Letzte Workouts“, „Herz“, „Cardio“, „Mehr Stats“, „Verlauf“
  - klein, grau, in Großbuchstaben: „MITTWOCH, 11. NOVEMBER“, „NOVEMBER 2026“, „DESIGN“, „NEUE PRS“
  - Kartentitel mit 13–14 px
  - Feld-Etiketten in Großbuchstaben: „GEWICHT (KG)“, „SÄTZE × W…“
- **Zahl:** 15 allgemeine Selektoren setzen Großbuchstaben.
- **Beleg:** [ist-training-plaene-dunkel](bilder/ist-training-plaene-dunkel.jpg),
  [ist-fortschritt-cardio-dunkel](bilder/ist-fortschritt-cardio-dunkel.jpg),
  [ist-mehr-darstellung-hell](bilder/ist-mehr-darstellung-hell.jpg)

**M4 · Steuerleisten abgeschnitten oder umbrechend**
- **Was:** Die Tabs im Fortschritt sind an beiden Rändern abgeschnitten („Herz & Card“, „Körp“). Der Zeitraum-Chip
  „Alles“ verschwindet hinter dem kg/lb-Schalter. „Pro Muskelgruppe“ bricht im Segment auf zwei Zeilen um. Auch die
  Filter-Chips in Übungen sind abgeschnitten („Arr“). Dass man seitlich scrollen kann, zeigt nur das Abschneiden.
  Im Fortschritt nehmen drei Steuerreihen (Tabs, Zeitraum, Einheit) rund 140 px ein, bevor Inhalt kommt.
- **Beleg:** [ist-fortschritt-kraft-hell](bilder/ist-fortschritt-kraft-hell.jpg),
  [ist-fortschritt-muskeln-dunkel](bilder/ist-fortschritt-muskeln-dunkel.jpg),
  [ist-uebungen-hell](bilder/ist-uebungen-hell.jpg)

**M5 · Viel Erklärtext statt klarer Darstellung**
- **Was:** Info-Knöpfe sitzen an fast jeder Karte; auf der Startseite stehen grüne Info-Symbole neben den
  Kachel-Titeln. Fußnoten erklären Rechenwege. Die Muskel-Liste hat über 25 Zeilen mit lateinischen Zusätzen
  („Äußerer Quadrizeps (Vastus lateralis)“). Pulszonen tragen Beschreibungen.
- **Zahl:** 35 Info-Knöpfe und 54 Fenster-Infotexte im Code. Die 77 festen Erklärtexte haben im Schnitt 137 Zeichen,
  der längste 413. Gerendert: Fortschritt-Übersicht rund 3.100 Zeichen, Muskeln rund 2.200, Körper rund 1.500.
- **Beleg:** [ist-fortschritt-muskeln-hell](bilder/ist-fortschritt-muskeln-hell.jpg),
  [ist-fortschritt-uebersicht-dunkel](bilder/ist-fortschritt-uebersicht-dunkel.jpg)

**M6 · Darstellung: viele Bedienelement-Arten, Feinschliff weit oben**
- **Was:** Auf einer Seite stehen fünf Arten von Bedienelementen: Segment, Farbtupfer, Schalter, Auswahlfeld und
  Sortierliste. Der „Feinschliff“ (Ecken, Schrift, Textgröße, Dichte, Kontrast) steht direkt unter den Farben; dass er
  ans Ende wandert, ist bereits Anforderung. Die Design-Kacheln zeigen den Namen doppelt („Trainio Trainio“). Die
  App-Icons sind stilistisch uneinheitlich, sie gehören aber nicht zu diesem Vorhaben.
- **Zahl:** 21 verschiedene Eckenradien, 9 Schriftgrößen und 6 Schriftstärken gerendert.
- **Beleg:** [ist-mehr-darstellung-dunkel](bilder/ist-mehr-darstellung-dunkel.jpg)

### Niedrig – Feinschliff

- **N1 · Übungen-Liste:** Die Zwei-Buchstaben-Kürzel in Kategorie-Farben („CO“, „BE“, „CA“) wirken wie Platzhalter.
  In jeder Zeile steht „noch nie“, und der Plus-Knopf liegt über dem rechten Rand der Liste. Beleg:
  [ist-uebungen-dunkel](bilder/ist-uebungen-dunkel.jpg)
- **N2 · Meldung über dem Fenster:** Die Meldung „Neuer PR …“ liegt halbtransparent über dem Titel „Workout
  gespeichert“. Beleg: [ist-workout-abschluss-hell](bilder/ist-workout-abschluss-hell.jpg)
- **N3 · Kalender im Verlauf:** „5 Trainingstage“ klemmt unter der Monats- und Jahresauswahl. Die Liste darunter
  wiederholt die Datums-Kästchen der Startseite. Beleg:
  [ist-training-verlauf-dunkel](bilder/ist-training-verlauf-dunkel.jpg)
- **N4 · Training → Pläne:** Drei Link-Arten stehen nebeneinander: grüne Textlinks, graue Textknöpfe mit Symbol
  („Weiteren Plan“, „Plan-Optionen“) und Drei-Punkte-Menüs. Die Übungslisten der Workouts enden mit „…“. Beleg:
  [ist-training-plaene-hell](bilder/ist-training-plaene-hell.jpg)
- **N5 · Tab-Leiste:** Sie ist zu 12 % durchsichtig, darunter liegender Text schimmert sichtbar durch. Beleg:
  [ist-training-verlauf-dunkel](bilder/ist-training-verlauf-dunkel.jpg)
- **N6 · Technische Ursachen (Hinweis für die Basis):**
  - 24 % aller Deklarationen (1.350 von 5.575) sind Design-Sonderregeln.
  - In `js/*.js` stehen 211 Inline-Styles; 27-mal wird die Symbolgröße per Text-Ersetzung gesetzt
    (`icon(…).replace('<svg', '<svg width=…')`).
  - Außerdem: 26 × `!important`, 15 z-index-Stufen und 41 verschiedene Zeitdauern für Übergänge.

### Was schon trägt

- **Menü von unten** („Workout starten“): Die hervorgehobene Hauptaktion steht oben, darunter folgt eine ruhige Liste
  mit einheitlichen Symbolen ([ist-menue-workout-starten-dunkel](bilder/ist-menue-workout-starten-dunkel.jpg)).
- **Rückfrage:** Klarer Titel, ein Satz, zwei untereinander gestellte Knöpfe wie bei iOS
  ([ist-rueckfrage-dunkel](bilder/ist-rueckfrage-dunkel.jpg)).
- **Mehr → Übersicht:** Gruppierte Liste mit Symbolen, wenig Text ([ist-mehr-hell](bilder/ist-mehr-hell.jpg)).
- **Symbole statt Emojis:** Durchgängig SVG-Symbole; im Code stehen nur 8 Emojis (⚠ ✓ 📌 ✅ ☾ ☀). Emojis sind kein
  Problem.
- **Diagrammfarben aus Tokens:** Diagramme nehmen ihre Farben aus Variablen (`--c1` bis `--c8`, `--grid`) und
  folgen so schon heute dem Design.

### Vergleich: Fokus und Liquid Glass

Beide Designs nutzen dasselbe Layout, dieselben Komponenten und dieselben Schriftgrößen wie Trainio.
**Liquid Glass** ([vergleich-glass-start-dunkel](bilder/vergleich-glass-start-dunkel.jpg)) tauscht die Akzentfarbe
(Blau), legt einen Verlauf als Hintergrund, macht Karten durchscheinend und lässt die Tab-Leiste schweben; diese
überdeckt dabei den letzten Listeneintrag. **Fokus** ([vergleich-fokus-workout-dunkel](bilder/vergleich-fokus-workout-dunkel.jpg))
setzt Weiß als Akzent, macht die Haken grau und blendet im Workout alles außer der aktuellen Übung ab (Spotlight).

Die Designs unterscheiden sich heute also vor allem in Farbe und Material, kaum in Form, Schrift oder Anordnung.
In Zahlen: Trainio hat 49 eigene Deklarationen, Fokus 92, Liquid Glass 246. Zur Anforderung „nicht nur Farbe“ ist das
die Ausgangslage.

## Zählungen

### `css/app.css` und `js/*.js`

| Bereich | Wert | Anmerkung |
| --- | --- | --- |
| Umfang | 2.340 Zeilen, 210 KB, 5.575 Deklarationen | 1.514 verschiedene Selektoren, 96 Variablen |
| Design-Sonderregeln | 1.350 Deklarationen (24 %) | Tag & Nacht 284, Plakat 273, Liquid Glass 246, Pure 104, Carbon 100, Iron 94, Fokus 92, Paper 87, Trainio 49 |
| Schriftgrößen | **34** verschiedene (9–64 px) in 242 Angaben | 28 in allgemeinen Regeln; 8 halbe Pixel; häufigste: 12 px (32 ×), 13 px (26 ×), 12,5 px (20 ×) |
| Schriftgrößen ohne Faktor „Textgröße“ | 9 in CSS, 9 in JS | wachsen nicht mit der Einstellung mit |
| Schriftstärken | **7** Zahlenwerte (400, 500, 550, 600, 650, 700, 750) + 2 Variablen | Variablen: 700 für Titel und Zahlen, 600 für Knöpfe |
| Zeilenhöhen / Buchstabenabstände | 10 / **20** verschiedene | Buchstabenabstände von −0,045 em bis +0,1 em |
| Abstände (padding, margin, gap) | **154** verschiedene Werte in 570 Angaben | 29 px-Längen (1–120 px), nur 47 % im 4er-Raster |
| Eckenradien | **40** verschiedene Werte in 206 Angaben | Radius-Variablen nur 9 × genutzt, `--radius-lg` nie; 27 × Pille (999 px) |
| Schatten | **82** verschiedene `box-shadow` (125 Angaben) | 30 feste Werte ohne Variable, dazu 3 `text-shadow` |
| Farbwerte außerhalb der Variablen | **76** verschiedene (139 Vorkommen) | 44 davon in allgemeinen Regeln; häufig `#fff`, `#000`, Schwarz mit Deckkraft |
| Farbwerte in Variablen | 591 verschiedene | 9 Designs × Hell/Dunkel plus Hintergründe |
| Feste Hex-Farben in `js/*.js` | 150 verschiedene | sky.js 70, ui.js 38, exercises.js 13, training.js 11, progress.js 9 |
| Knopf-Varianten | 13 `.btn`-Klassen + 8 knopfartige | primary, secondary, ghost, accent-ghost, danger, danger-ghost, hero, icon, arrow, sm, lg, block; dazu link-btn, chip, fab, set-check, nav-btn, side-btn, dd-btn, tp-btn |
| Flächen (Karte, Kachel, Pille …) | 39 Klassen mit Fläche, Ecken und Innenabstand | etwa 20 Karten/Kacheln, 13 Pillen/Chips, 6 Bedienelemente |
| Listen-Zeilen | 22 Klassen auf `-item`/`-row` | z. B. list-item, ex-item, goal-item, sb-item, tile-row, set-row, hz-row |
| Großbuchstaben | 15 allgemeine Selektoren | Etiketten, Tabellenköpfe, Datumszeile, Kicker |
| Inline-Styles in `js/*.js` | 211 `style="…"` | dazu 27 × Symbolgröße per Text-Ersetzung |
| Erklärtexte | 35 Info-Knöpfe + 54 Fenster-Infotexte | 77 feste Texte, Ø 137 Zeichen, längster 413 |
| Emojis in `js/*.js` | 8 | kein Problem |
| Sonstiges | 26 × `!important`, 15 z-index-Stufen, 41 Zeitdauern, 38 Animationen, 31 Media Queries | |

### Gerendert je Bildschirm (Trainio, Dunkel)

Gezählt wurden sichtbare Elemente mit eigenem Text im Inhaltsbereich bzw. im offenen Fenster, über die ganze Seite.

| Bildschirm | Schriftgrößen | Stärken | Textfarben | Eckenradien | Info-Knöpfe | Karten | Zeichen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Start | 9 | 4 | 6 | 5 | 2 | 8 | 447 |
| Menü „Workout starten“ | 4 | 4 | 3 | 3 | 0 | 0 | 168 |
| Training · Pläne | 8 | 3 | 4 | 4 | 0 | 4 | 569 |
| Training · Verlauf | 8 | 4 | 4 | 5 | 0 | 37 | 1.881 |
| Fortschritt · Übersicht | **13** | 4 | 8 | 9 | **18** | **23** | **3.119** |
| Fortschritt · Kraft | 7 | 4 | 4 | 6 | 5 | 6 | 377 |
| Fortschritt · Volumen | 7 | 4 | 4 | 6 | 11 | 12 | 606 |
| Fortschritt · Muskeln | 7 | 4 | 5 | 9 | 9 | 9 | 2.233 |
| Fortschritt · Herz & Cardio | 10 | 5 | 7 | 8 | 10 | 10 | 1.088 |
| Fortschritt · Körper | 9 | 4 | 4 | 7 | 3 | 4 | 1.535 |
| Übungen | 6 | 3 | 12 | 3 | 0 | 0 | (323 Übungen) |
| Mehr | 3 | 3 | 3 | 4 | 0 | 1 | 167 |
| Mehr · Darstellung | 9 | 6 | (36) | **21** | 11 | 3 | 1.014 |
| Workout · schlicht | 7 | 4 | 5 | 7 | 0 | 0 | 305 |
| Workout · ausführlich | **13** | **6** | 7 | 9 | 0 | 1 | 732 |
| **Alle zusammen** | **20** | **8** | | | | | |

Die Größen über alle Bildschirme: 9, 10, 10,5, 11, 11,5, 12, 12,5, 13, 13,5, 14, 15, 15,5, 16, 16,5, 17, 18, 19, 20,
26 und 46 px. Die Stärken: 400, 550, 600, 650, 700, 750, 800 und 900. Die Textfarben in „Darstellung“ sind wegen der
Design-Vorschauen hoch. „Karten“ zählt `.card`, `.chart-card` und `.stat`.

## Bildergalerie

Alle Bilder liegen in [bilder/](bilder/) (36 JPEG, zusammen etwa 4,4 MB). „Ganze Seite“ ist auf 1.700 bzw. 2.600 px
Höhe gekappt.

### Start und Menü

| Bildschirm | Hell | Dunkel |
| --- | --- | --- |
| Start (ganze Seite) | <img src="bilder/ist-start-hell.jpg" width="160"> | <img src="bilder/ist-start-dunkel.jpg" width="160"> |
| Menü von unten „Workout starten“ | <img src="bilder/ist-menue-workout-starten-hell.jpg" width="160"> | <img src="bilder/ist-menue-workout-starten-dunkel.jpg" width="160"> |

### Training

| Bildschirm | Hell | Dunkel |
| --- | --- | --- |
| Pläne (ganze Seite) | <img src="bilder/ist-training-plaene-hell.jpg" width="160"> | <img src="bilder/ist-training-plaene-dunkel.jpg" width="160"> |
| Verlauf | <img src="bilder/ist-training-verlauf-hell.jpg" width="160"> | <img src="bilder/ist-training-verlauf-dunkel.jpg" width="160"> |

### Laufendes Workout

| Bildschirm | Hell | Dunkel |
| --- | --- | --- |
| Schlicht (Pause läuft) | <img src="bilder/ist-workout-schlicht-hell.jpg" width="160"> | <img src="bilder/ist-workout-schlicht-dunkel.jpg" width="160"> |
| Ausführlich | <img src="bilder/ist-workout-ausfuehrlich-hell.jpg" width="160"> | <img src="bilder/ist-workout-ausfuehrlich-dunkel.jpg" width="160"> |
| Rückfrage „Workout beenden?“ | <img src="bilder/ist-rueckfrage-hell.jpg" width="160"> | <img src="bilder/ist-rueckfrage-dunkel.jpg" width="160"> |
| Abschluss | <img src="bilder/ist-workout-abschluss-hell.jpg" width="160"> | <img src="bilder/ist-workout-abschluss-dunkel.jpg" width="160"> |

### Fortschritt (jeweils ganze Seite)

| Bildschirm | Hell | Dunkel |
| --- | --- | --- |
| Übersicht | <img src="bilder/ist-fortschritt-uebersicht-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-uebersicht-dunkel.jpg" width="160"> |
| Kraft | <img src="bilder/ist-fortschritt-kraft-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-kraft-dunkel.jpg" width="160"> |
| Volumen | <img src="bilder/ist-fortschritt-volumen-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-volumen-dunkel.jpg" width="160"> |
| Muskeln | <img src="bilder/ist-fortschritt-muskeln-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-muskeln-dunkel.jpg" width="160"> |
| Herz & Cardio | <img src="bilder/ist-fortschritt-cardio-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-cardio-dunkel.jpg" width="160"> |
| Körper | <img src="bilder/ist-fortschritt-koerper-hell.jpg" width="160"> | <img src="bilder/ist-fortschritt-koerper-dunkel.jpg" width="160"> |

### Übungen und Mehr

| Bildschirm | Hell | Dunkel |
| --- | --- | --- |
| Übungen | <img src="bilder/ist-uebungen-hell.jpg" width="160"> | <img src="bilder/ist-uebungen-dunkel.jpg" width="160"> |
| Mehr (ganze Seite) | <img src="bilder/ist-mehr-hell.jpg" width="160"> | <img src="bilder/ist-mehr-dunkel.jpg" width="160"> |
| Mehr → Darstellung (ganze Seite) | <img src="bilder/ist-mehr-darstellung-hell.jpg" width="160"> | <img src="bilder/ist-mehr-darstellung-dunkel.jpg" width="160"> |

### Vergleich mit Fokus und Liquid Glass

| Fokus · laufendes Workout (Dunkel) | Liquid Glass · Start (Dunkel) |
| --- | --- |
| <img src="bilder/vergleich-fokus-workout-dunkel.jpg" width="160"> | <img src="bilder/vergleich-glass-start-dunkel.jpg" width="160"> |
