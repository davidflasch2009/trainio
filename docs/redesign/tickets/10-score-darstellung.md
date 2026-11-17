# Trainio-Score: Hauptplatz, Karte und Klartext

- **Typ:** prototype (HITL)
- **Status:** erledigt
- **Übernommen von:** Claude mit David
- **Blockiert durch:** [Trainio-Score: die Formel](09-score-formel.md), [Die neue Basis: Raster, Schrift, Komponenten, Diagramme](03-basis.md)

## Frage

Wie sieht der Trainio-Score aus? Fest steht ([Formel](09-score-formel.md)): Er ist die wichtigste Information der
App und hat den **Hauptplatz oben auf der Startseite**. Dazu kommt eine ausführliche Karte oben in Fortschritt →
Übersicht. Er ist **nicht nur Text**: Zahl, Aufschlüsselung und Verlauf sind grafisch, der Klartext ergänzt sie.

- Die grafische Form der Zahl, klar unterscheidbar vom Workout-Score-Ring
- Die Aufschlüsselung nach den 7 Körperbereichen als Grafik (Balken? Körperfigur?)
- Der Verlauf (z. B. kleiner Linienverlauf der letzten Wochen)
- Hauptzeile und Hinweise im Klartext
- Was das Antippen öffnet
- Zustand „noch zu wenig Daten“: Fortschritt zum ersten Score
- Wie der Hauptplatz aussieht, wenn der Score abgeschaltet ist

## Antwort

Entschieden am 17.11.2026 im Rahmen von Davids Vorgaben (Kreis mit Zahl, Details erst nach Antippen,
schlicht). Siehe [ANFORDERUNGEN.md, Abschnitt 6](../ANFORDERUNGEN.md#6-trainio-score).

- Hauptplatz: großer Kreis (Spur und Bogen in der Akzentfarbe) mit der Zahl, darunter „Trainio-Score“.
- Antippen öffnet ein Fenster von unten: Kreis, Klartext, Körperbereiche als Liste, Verlauf als eine Linie,
  Bestandteile als Liste.
- Zustände für „zu wenig Daten“, „unsicher“, „Pause“ und „abgeschaltet“ sind festgelegt.
- Der Workout-Score bleibt ein kleiner, dicker Ring und erscheint nur im Abschluss und in den Workout-Details.
