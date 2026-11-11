# Trainio-Score: die Formel

- **Typ:** grilling (HITL)
- **Status:** erledigt
- **Übernommen von:** Claude mit David
- **Blockiert durch:** [Recherche: Kraft- und Muskelentwicklung aus Workouts und Körpergewicht schätzen](08-recherche-score.md)

## Frage

Wie wird der Trainio-Score berechnet? Fest steht: 0–100 plus Klartext, nur Entwicklung, nur Workouts und
Körpergewicht, phasenabhängig (Bulk: Zuwachs, Cut: Erhalt, Erhalt: leichter Zuwachs, ohne Phase wie Erhalt),
fester Rückblick, Aufschlüsselung pro Muskelgruppe.

Zu entscheiden:

- Bestandteile und Gewichtung (z. B. Kraft-Trend, Trainingsreiz pro Muskel, Gewichtstrend passend zur Phase)
- Regeln je Phase, auch für „Sonstiges“
- Länge des Rückblicks und Abbildung auf 0–100 (was ist 50, was 100?)
- Mindest-Datenmenge: ab wann gibt es einen Score, was steht davor da?
- Muskelgruppen der Aufschlüsselung und wie Übungen zugeordnet werden (Hauptmuskel, Hilfsmuskeln)
- Umgang mit Form-Fix, Aufwärmsätzen, Cardio und Pausen (Urlaub, Krankheit)
- Klartext-Stufen (z. B. „Kraft steigt, guter Aufbau-Reiz“)

## Antwort

Entschieden mit David. Ausformuliert in [ANFORDERUNGEN.md, Abschnitt 6](../ANFORDERUNGEN.md#6-trainio-score).

1. **Bestandteile:** Kraft 50, Trainingsreiz 30, Gewichtstrend 20, in jeder Phase gleich gewichtet. David hat
   das Claude überlassen, gewählt wurde der Vorschlag der Recherche.
2. **Maßstab für Kraft:** Trainingserfahrung, über die neue Einstellung „Trainiere seit“ (sonst das erste Workout).
3. **Skala:** Das erwartete Tempo ergibt etwa 85, 100 ist selten.
4. **Aufschlüsselung:** 7 grobe Körperbereiche.
5. **Vernachlässigte Bereiche** senken den Gesamtwert.
6. **Zu schnelles Zu- oder Abnehmen** gibt einen Abzug und einen Hinweis.
7. **Klartext:** eine Hauptzeile plus höchstens zwei Hinweise, sachlich. **Neu von David:** Der Score ist die
   wichtigste Information der App. Er steht als **Hauptplatz oben auf der Startseite** und ist **nicht nur Text**,
   sondern grafisch. Die geplante Startseiten-Kachel entfällt.

Die Details (Rückblick 8 Wochen, Mindestdaten, Pausen, Phasenwechsel, RPE, neue Übungen) hat Claude im Rahmen
festgelegt.

**Nachtrag (nach der [Recherche zu Sätzen pro Woche](../recherche/saetze-pro-woche.md), mit David entschieden):**
Der Trainingsreiz wird je Muskelgruppe gerechnet und im Körperbereich gemittelt. Die Kurve verläuft
4 → 0,35, 10 → 0,65, 15 → 0,85 und ist im Bulk ab 18 Sätzen voll (Cut ab 8, Erhalt ab 10). Viele Sätze geben keinen
Abzug, leichte Sätze (RPE ≤ 5) zählen halb. Der Klartext sagt „Reiz reicht – Fortschritt da“, wenn bei 4–10 Sätzen
die Kraft steigt.
