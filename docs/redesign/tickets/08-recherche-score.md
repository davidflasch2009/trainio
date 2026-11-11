# Recherche: Kraft- und Muskelentwicklung aus Workouts und Körpergewicht schätzen

- **Typ:** research (AFK)
- **Status:** erledigt
- **Übernommen von:** Claude (Recherche-Agent)
- **Blockiert durch:** –

## Frage

Was sagt die Forschung dazu, wie sich Kraft- und Muskelentwicklung **nur** aus Trainingsdaten
(Übung, Sätze, Wdh., Gewicht, RPE) und Körpergewicht schätzen lassen? Der Trainio-Score (0–100 + Klartext)
misst nur die Entwicklung, kennt die Phase (Bulk/Cut/Erhalt) und schlüsselt nach Muskelgruppe auf.

1. Realistische Zuwachsraten des geschätzten 1RM pro Monat nach Trainingserfahrung (Anfänger, Fortgeschritten …)
2. Dosis-Wirkung: Sätze pro Muskel und Woche ↔ Muskelwachstum (Schoenfeld u. a.); sind MEV 10 / MAV 15 / MRV 20
   belegt?
3. Wie eng hängen Kraftzuwachs und Muskelwachstum zusammen, und wann ist Kraftzuwachs nur Technik oder Nerven?
4. Sinnvolle Gewichtsveränderung pro Woche in Bulk und Cut; was Kraft-Erhalt im Cut über Muskel-Erhalt aussagt
5. Wie lang ein Rückblick sein muss, damit ein Trend nicht im Rauschen untergeht (Tagesform, Wasser beim Gewicht)
6. Wie bestehende Apps oder Rechner so etwas bewerten (z. B. Fitbod, Hevy, Strength Level, Whoop) – nur als Vergleich

Ergebnis: `docs/redesign/recherche/trainio-score.md` mit Quellen und konkreten Zahlen, die die Formel braucht.

## Antwort

Ergebnis: [recherche/trainio-score.md](../recherche/trainio-score.md) mit 53 Quellen. Der Abschnitt
„Was das für die Formel heißt“ enthält Vorschläge für [Trainio-Score: die Formel](09-score-formel.md).

- **Kraftzuwachs (e1RM) pro Monat:** Einsteiger etwa 2–5 %, Fortgeschrittene 0,5–2 %, Erfahrene 0,25–0,75 %.
  Die Spannen sind aus Studien abgeleitet, keine misst sie direkt so.
- **Volumen:** Mehr Sätze bringen mehr Wachstum, mit abnehmendem Ertrag. 12–20 Sätze pro Muskel und Woche sind bei
  Trainierten Standard. Trainios Zählweise (Hauptmuskel 1, Hilfsmuskel 0,5) wird durch Pelland 2025 gestützt.
  MEV/MAV/MRV kommen aus einem Coaching-Modell. 10 und 15 passen zur Forschung, 20 ist keine belegte Obergrenze.
- **Kraft und Muskel hängen beim Einzelnen nur locker zusammen.** Am Anfang und bei neuen Übungen ist Zuwachs vor
  allem Technik. Im Cut beweist gehaltene Kraft keinen Muskelerhalt, ist aber nötig.
- **Gewicht pro Woche:** Bulk +0,25 bis +0,5 % des Körpergewichts, Cut −0,5 bis −1 %.
- **Rückblick:** Das Körpergewicht schwankt von Tag zu Tag um etwa 0,5 %, das 1RM um 2–4 %. Vorschlag: 8 Wochen
  (die letzten 4 gegen die 4 davor). Ein laufendes Maximum, wie es `strengthGains` verwendet, zeigt schon bei reinem
  Rauschen 3–6 % Zuwachs und taugt deshalb nicht.
- **Andere Apps:** Keine bewertet die Entwicklung phasenabhängig aus Training und Gewicht.

Grenze: PubMed und die Verlagsseiten waren gesperrt. Die Zahlen sind über Abstracts geprüft, Ungeprüftes ist markiert.
