# Die neue Basis: Raster, Schrift, Komponenten, Diagramme

- **Typ:** prototype (HITL)
- **Status:** offen
- **Übernommen von:** Claude mit David
- **Blockiert durch:** [Bestandsaufnahme: Was wirkt heute unprofessionell?](01-bestandsaufnahme.md), [Vorbilder: Was macht Fitness-Apps professionell?](02-vorbilder.md)

## Frage

Wie sieht die neue gemeinsame Basis aus, auf der alle vier Designs aufsetzen? Festzulegen:

- Raster und Abstände, Schriftstufen, Darstellung von Zahlen (Gewichte, Scores, Zeiten)
- Komponenten: Karte, Liste, Knopf, Eingabe, Segment, Kachel, Fenster, Menü von unten, Rückfrage, Meldung
- Diagramm-Stil (Linien, Achsen, Beschriftung, Farben) und Symbole (statt Emojis?)
- Was ein Design übersteuern darf und was immer gleich bleibt
- Texte: höchstens 2 kurze Sätze im (i), keine Fülltexte (siehe [ANFORDERUNGEN.md](../ANFORDERUNGEN.md), Abschnitt 2)

Grundlage: [Bestandsaufnahme](../bestandsaufnahme.md) (was heute stört, mit Zahlen) und [Vorbilder](../recherche/vorbilder.md), Abschnitt 4 (12 Vorschläge und eine mögliche Aufteilung Basis/Design).

Die Startseite bekommt oben den **Trainio-Score als Hauptplatz** (siehe [Formel](09-score-formel.md)). Im
Basis-Prototyp ist dafür ein Platz vorzusehen, die genaue Gestaltung klärt [Trainio-Score: Hauptplatz, Karte und Klartext](10-score-darstellung.md).

Prototyp: Startseite, laufendes Workout und Fortschritt → Übersicht in einer neutralen Haut (Hell und Dunkel,
390 px), damit David reagieren kann. Rahmen: Aufbau und Funktionen bleiben, innerhalb eines Bildschirms darf
alles neu angeordnet werden.

## Stand

- **Prototyp 1** (12.11.2026): drei Varianten der Basis – A „Listen“ (Apple-nah, gruppierte Listen, Workout als
  Tabelle), B „Kacheln“ (Zahlen zuerst, eine Übung auf einmal), C „Klartext“ (ein Satz sagt die Lage, ohne
  Kartenrahmen, Eingabe fest unten). Jeweils Start, laufendes Workout, Fortschritt → Übersicht und die Seite
  „Bausteine“, hell und dunkel. Quelle: [prototypen/03-basis/index.html](../prototypen/03-basis/index.html),
  Link für David: https://claude.ai/artifact/Ed68RGVAxiVwtJzk2YRGVw (privat).
- **Rückmeldung David zu Prototyp 1:** „Schon wieder viel zu viel Text.“ Genauere Werte erst nach Antippen, nicht nur
  beim Score, sondern überall. Score als großer Kreis mit Zahl oben auf der Startseite
  ([Skizze](../bilder/skizze-david-start-score.png)). In ANFORDERUNGEN.md (Abschnitt 2 und 6) übernommen.
- **Prototyp 2** (gleicher Link, Fassung 1 in Commit bb5af6d): Kacheln nur mit Titel und Zahl, Details nach
  Antippen, Score-Kreis oben. Zwei Varianten: A „Nur Zahlen“ (Details als Fenster von unten) und B „Mit Grafik“
  (kleine Grafik ohne Achsen in der Kachel, Details als eigene Seite). Wartet auf Davids Rückmeldung.
