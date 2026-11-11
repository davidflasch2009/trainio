# Karte: Redesign & Trainio-Score

`wayfinder:map`

## Ziel

Eine vollständige, klare Anforderungs-Datei – [ANFORDERUNGEN.md](ANFORDERUNGEN.md) – für das neue Trainio:
neue professionelle Basis, vier markante Designs und der Trainio-Score. Erreicht, wenn darin nichts mehr mit ⏳
markiert ist. Gebaut wird erst danach.

## Notizen

- **Bereich:** Trainio-PWA (ohne Build-Step, siehe README.md). Alles auf Deutsch. Das iPhone ist der Hauptort,
  deshalb wird jede Entscheidung zuerst bei 390 px Breite geprüft.
- **Begriffe:** [CONTEXT.md](../../CONTEXT.md) – Design, Modus, Basis, Akzentfarbe, Feinanpassung, Markenzeichen,
  Workout-Score, Trainio-Score, Phase. Neue Begriffe dort sofort eintragen.
- **Skills:** grilling-Tickets → Skill „grilling“ und „domain-modeling“; prototype → „prototype“; research → „research“.
- **Nur planen:** Diese Karte verändert die App nicht. Gebaut wird erst, wenn ANFORDERUNGEN.md kein ⏳ mehr hat
  (David, bestätigt beim Start der Umsetzung). Planungs-Dateien werden ohne Release auf `main` committet,
  Screenshots liegen unter `docs/redesign/bilder/`.
- **Prototypen** bekommt David als eigene Seite mit Link (privates Artifact), am iPhone zum Durchtippen –
  Wegwerf-Entwürfe, nie in der echten App. Quelle unter `docs/redesign/prototypen/`.
- **Wer entscheidet:** David alles, was den Geschmack prägt (Look der Basis, die vier Designs, Bestandteile und
  Klartext des Scores). Details im festgelegten Rahmen (genaue Abstände, Schriftgrößen, Randfälle) entscheidet
  Claude selbst und schreibt sie nachlesbar in ANFORDERUNGEN.md.
- **Reihenfolge:** Darstellung → Trainio-Score → Basis und Designs; die Bestandsaufnahme läuft nebenher.
- **Feste Vorlieben von David:** Kein Feature fällt weg, alles bleibt abschaltbar. Neue Regler wandern in die
  Feinanpassung, nicht nach oben. Lieber klar und ehrlich als scheingenau.
- **Ergebnis jedes Tickets:** Die Antwort steht im Ticket. Was daraus Anforderung wird, wandert zusätzlich in
  ANFORDERUNGEN.md, und das ⏳ dort wird ersetzt.

### So funktionieren die Tickets (lokale Markdown-Dateien)

- Jedes Ticket ist eine Datei in [tickets/](tickets/) mit Kopf **Typ**, **Status** (`offen` / `erledigt` /
  `außerhalb`), **Übernommen von** und **Blockiert durch**.
- **Übernehmen:** Bevor die Arbeit beginnt, wird „Übernommen von“ ausgefüllt und auf `main` gepusht.
  Übernommene Tickets lässt jede andere Session liegen.
- **Front:** Tickets mit Status `offen`, ohne „Übernommen von“, deren Blocker alle `erledigt` sind –
  `grep -l "Status:\*\* offen" docs/redesign/tickets/*.md`.
- **Abschließen:** Abschnitt `## Antwort` anhängen, Status auf `erledigt` setzen und hier unter
  „Entscheidungen bisher“ eine Zeile ergänzen.

## Entscheidungen bisher

<!-- eine Zeile je erledigtem Ticket: [Titel](Link): Kern der Antwort -->

- [Bestandsaufnahme: Was wirkt heute unprofessionell?](tickets/01-bestandsaufnahme.md): Kein Raster (34 Schriftgrößen, 154 Abstände), alles gleich laut, Akzentfarbe überall, zu viele Komponenten-Varianten, Designs unterscheiden sich fast nur in Farbe.
- [Vorbilder: Was macht Fitness-Apps professionell?](tickets/02-vorbilder.md): Professionell heißt konsistent – wenige Schriftstufen, 8er-Raster, eine Akzentfarbe, ein Symbolsatz, Klartext-Deutung; Liquid Glass laut Apple nur in der Navigationsebene.
- [Recherche: Kraft- und Muskelentwicklung aus Workouts und Körpergewicht schätzen](tickets/08-recherche-score.md): Erwartbarer e1RM-Zuwachs nach Erfahrung, Sätze pro Muskel als stärkster Wachstums-Treiber, Gewichtsraten je Phase, 8-Wochen-Rückblick; Vorschlag Kraft 50 / Reiz 30 / Gewicht 20.
- [Darstellung neu ordnen: oben, Feinanpassung und alte Einstellungen](tickets/07-darstellung.md): Feinanpassung als Unterseite ganz unten und je Design, Akzentfarben je Design kuratiert, Startseite als eigene Mehr-Gruppe, beim Umstieg werden Übersteuerungen zurückgesetzt.

## Noch nicht festgelegt

- **Steckbriefe der zwei neuen Designs:** Look, Markenzeichen, Akzentfarben-Auswahl, Teilen-Bild, Ring, Konfetti und
  Diagramme je Design.
  Lässt sich erst fassen, wenn feststeht, welche zwei es werden.
- **Die einzelnen Bildschirme auf der neuen Basis:** Reicht die Festlegung der Basis, oder brauchen Workout,
  Fortschritt, Training, Mehr sowie Fenster & Menüs eigene Entscheidungen? Das zeigt sich erst am Basis-Prototyp.
- **Reihenfolge der Umsetzung:** Basis zuerst? Alte Designs auf einmal oder schrittweise entfernen? In welchen
  Releases? Fest: Auch andere nutzen Trainio – jeder Release muss in sich fertig sein, nichts darf halb umgebaut
  live gehen.
- **Der Trainio-Score an weiteren Orten:** Teilen-Bild, Meilensteine, Hinweis bei starker Veränderung – vage,
  hängt an Formel und Darstellung.

## Außerhalb

- **App-Icons neu gestalten:** David will das später machen, als eigenes Vorhaben.
- **Navigation/Tab-Struktur umbauen oder Funktionen streichen:** Der Aufbau bleibt, nur die Gestaltung jedes
  Bildschirms wird neu.
- **Absolutes Kraft-Niveau im Score** (Vergleich mit Kraft-Standards): Der Trainio-Score misst nur die Entwicklung.
- **Körperfett, Umfänge, Fotos im Score:** David trägt nur Workouts und Körpergewicht ein.
