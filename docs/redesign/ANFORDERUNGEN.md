# Redesign & Trainio-Score – Anforderungen

Der Bauplan für das neue Trainio. Er wächst mit jeder Entscheidung auf der [Karte](KARTE.md).
Offene Punkte sind mit ⏳ markiert und verlinken das Ticket, das sie klärt.
**Sind keine ⏳ mehr übrig, ist der Bauplan fertig und die Umsetzung kann starten.**
Begriffe wie Design, Modus, Basis, Feinanpassung und Markenzeichen sind in [CONTEXT.md](../../CONTEXT.md) festgelegt.

## 1. Ziel

Trainio wirkt professioneller: eine neue gemeinsame **Basis**, darauf **vier markante Designs**.
Dazu kommt der **Trainio-Score**, der zeigt, wie sich Kraft und Muskulatur entwickeln.

## 2. Rahmen (gilt für alles)

- **Handy zuerst:** Das iPhone ist der Hauptort, jede Entscheidung wird zuerst bei 390 px Breite geprüft.
- **Der Aufbau bleibt:** Tabs, Bildschirme und Funktionen bleiben erhalten, kein Feature fällt weg.
  Innerhalb eines Bildschirms darf alles neu angeordnet werden (Reihenfolge, Hierarchie, Komponenten).
- **Alle Funktionen bleiben einzeln abschaltbar** (Mehr → Tabs & Funktionen).
- **Wenig Text (David: „extrem wichtig“):** Jede Erklärung im (i) hat **höchstens 2 kurze Sätze**: was die Zahl
  oder das Diagramm zeigt und, nur wenn nötig, wie man es liest. Keine Herleitungen, Formeln oder Quellen (die stehen
  in README und Recherche), keine Wiederholung von Standards wie „die laufende Woche ist blass“ – das zeigt die
  Gestaltung. Auch sonst keine Fülltexte auf den Bildschirmen: so kurz und klar wie möglich.
- **Details erst nach Antippen (David, 12.11.2026: „dass man nicht so überrumpelt wird“):** Übersichten zeigen je
  Kachel nur **Titel und Zahl**, ohne Untertitel, Fußnoten oder Sätze. Verlauf, Vergleiche, Aufschlüsselung und die
  Erklärung (i) erscheinen erst nach dem Antippen. Das gilt überall, nicht nur beim Score.
- **Alles folgt dem Design:** Teilen-Bild, Workout-Score-Ring & Konfetti, Diagramme und Animationen.
- Sprache: Deutsch.

## 3. Basis

Die neue gemeinsame Gestaltung, auf der alle vier Designs aufsetzen: Raster & Abstände, Schriftstufen,
Zahlen-Darstellung, Komponenten (Karte, Liste, Knopf, Eingabe, Segment, Kachel, Fenster, Menü),
Diagramm-Stil und Symbole.

- Ausgangslage – [Bestandsaufnahme](bestandsaufnahme.md) erledigt (Grundlage für die Festlegung, keine Anforderung)
- Vorbilder – [Recherche](recherche/vorbilder.md) erledigt (Grundlage für die Festlegung, keine Anforderung)
- ⏳ Festlegung – [Die neue Basis](tickets/03-basis.md)

## 4. Designs

- **Genau vier Designs**, jedes in Hell und Dunkel.
- **Markant:** Man erkennt jedes auf einem Screenshot ohne Namen sofort. Die Designs unterscheiden sich in Form,
  Schrift, Material und Bewegung, nicht nur in der Farbe.
- **Jedes Design hat ein Markenzeichen**, ein eigenes Verhalten, nicht nur einen eigenen Look.

| Design | Festgelegt | Offen |
| --- | --- | --- |
| **Fokus** | Bleibt. Schwarz-weiß und ruhig, Farbe nur für Signale. Markenzeichen: **Spotlight** im Workout. | ⏳ [Fokus auf der neuen Basis](tickets/05-fokus.md) |
| **Liquid Glass** | Bleibt. Glas, Unschärfe & Licht. | ⏳ [Liquid Glass auf der neuen Basis](tickets/06-liquid-glass.md), inkl. Markenzeichen |
| Design 3 | – | ⏳ [Welche zwei Designs kommen dazu?](tickets/04-designs-auswahl.md) |
| Design 4 | – | ⏳ [Welche zwei Designs kommen dazu?](tickets/04-designs-auswahl.md) |

- **Standard-Design:** eines der vier. Das bisherige „Trainio“ (Graphit & gedecktes Grün) entfällt.
  ⏳ Welches – [Welche zwei Designs kommen dazu?](tickets/04-designs-auswahl.md)
- **Entfallen:** Trainio, Iron, Pure, Carbon, Paper, Plakat und Tag & Nacht, außer eines davon wird Design 3 oder 4.
- Wer ein entferntes Design nutzt, landet automatisch beim neuen Standard.

## 5. Darstellung, Feinanpassung & Startseite

Entschieden in [Darstellung neu ordnen](tickets/07-darstellung.md).

**Mehr → Darstellung** von oben nach unten:

1. **Vorschau**
2. **Design:** die vier Design-Kacheln
3. **App-Icon** (wie heute)
4. **Modus** und **Akzentfarbe**
5. **Lesbarkeit:** Textgröße, Hoher Kontrast
6. **Bewegung & Feedback:** Animationen, Vibration, Konfetti
7. **Feinanpassung ›:** eine einzige Zeile ganz unten, die eine eigene Unterseite öffnet
8. Darstellung zurücksetzen

**Feinanpassung**

- Enthält Ecken, Schrift, Dichte, Tab-Leiste (Stil und Beschriftung) und die eigene Akzentfarbe.
  ⏳ Ob der Glas-Hintergrund dazukommt: [Liquid Glass auf der neuen Basis](tickets/06-liquid-glass.md)
- Gilt **je Design**: Jedes Design merkt sich seine eigenen Anpassungen. Nach einem Wechsel sieht man das neue
  Design so, wie es gedacht ist.
- Die Zeile zeigt den Zustand: „Wie im Design“ oder z. B. „2 Änderungen“.
- Die Unterseite hat „Auf Design zurücksetzen“, das nur für das aktuelle Design gilt.
- Die Suche im Mehr-Tab findet die Regler weiterhin und öffnet die Unterseite.

**Akzentfarbe**

- Jedes Design bietet eine kleine, passende Auswahl (4–6 Farben, die erste ist die Standardfarbe des Designs).
  Fokus hat womöglich gar keine, weil Farbe dort nur Signal ist.
  ⏳ Die Auswahl je Design entscheiden die Design-Tickets.
- Eine eigene Farbe gibt es nur noch in der Feinanpassung. Der Kontrast wird wie heute automatisch angepasst.

**Startseite**: eine eigene Gruppe im Mehr-Tab direkt unter Darstellung. Sie enthält Statistik-Kacheln
(Auswahl und Reihenfolge), die Karte „Herz diese Woche“, Letzte Workouts und „Beim Öffnen“ (welcher Tab zuerst
erscheint).

**Darstellung zurücksetzen** setzt alles in der Darstellung zurück, auch die Feinanpassungen aller Designs.
Die Startseite bleibt unberührt.

**Umstieg auf die neuen Designs** (einmalig, für alle Nutzer):

- **Bleibt:** Modus, Textgröße, Hoher Kontrast, Animationen, Vibration, Konfetti, Startseite, App-Icon.
- **Zurück auf „vom Design“:** Ecken, Schrift, Dichte, Tab-Leiste.
- **Akzentfarbe:** bleibt, wenn das neue Design sie anbietet, sonst gilt die Standardfarbe des Designs.
- Wer ein entferntes Design nutzt, landet beim neuen Standard.
- Wurde wirklich etwas zurückgesetzt, erscheint einmal der Hinweis „Neue Designs – deine Anpassungen wurden
  zurückgesetzt“.

## 6. Trainio-Score

Entschieden in [Trainio-Score: die Formel](tickets/09-score-formel.md). Grundlage ist die
[Recherche](recherche/trainio-score.md).

**Was er ist**

- **Name:** Trainio-Score. Er ist eigenständig, der Workout-Score bleibt, wie er ist.
- **Aussage:** nur die **Entwicklung** („Werde ich stärker, baue ich Muskeln auf?“), nicht das absolute
  Kraft-Niveau.
- **Eingaben:** nur Workouts und Körpergewicht.
- **Ausgabe:** Zahl **0–100**, als **Grafik** dargestellt, mit Klartext dazu. Keine geschätzten kg Muskel.
  Im (i) steht „Schätzung aus Training und Gewicht“.
- **Berechnung:** aus den gespeicherten Daten wie beim Workout-Score. Auch ältere und importierte Workouts zählen
  sofort.
- **Abschaltbar** unter Mehr → Tabs & Funktionen wie jede Auswertung. Ist er aus, sieht die Startseite aus wie ohne
  Score.

**Wo er steht**

- **Hauptplatz oben auf der Startseite.** Er ist die wichtigste Information der App (David): ein **großer Kreis mit
  der Zahl**, sonst nichts ([Skizze von David](bilder/skizze-david-start-score.png)). Antippen öffnet die Details mit
  Aufschlüsselung nach Körperbereichen, Verlauf und Klartext.
- **Fortschritt → Übersicht:** ausführliche Karte ganz oben mit Aufschlüsselung, Verlauf und Erklärung.
- Eine eigene Startseiten-Kachel gibt es nicht, der Hauptplatz ersetzt sie.
- ⏳ Aussehen – [Trainio-Score: Hauptplatz, Karte und Klartext](tickets/10-score-darstellung.md)

**Bestandteile** (in jeder Phase gleich gewichtet, nur die Ziele ändern sich)

| Teil | Anteil | Was gemessen wird |
| --- | --- | --- |
| **Kraft** | 50 | Entwicklung des geschätzten 1RM je Übung im Vergleich zum erwarteten Tempo |
| **Trainingsreiz** | 30 | Arbeitssätze je Muskelgruppe und Woche (Hauptmuskel 1, Hilfsmuskel 0,5, leichte Sätze mit RPE ≤ 5 halb), mit abflachender Kurve, dann je Körperbereich gemittelt |
| **Gewichtstrend** | 20 | Veränderung des Körpergewichts in % pro Woche im Vergleich zur Spanne der Phase |

Fehlt ein Teil, z. B. weil kein Gewicht eingetragen ist, fällt er weg. Die übrigen Teile werden dann auf 100
hochgerechnet.

**Maßstab für Kraft:** das erwartete Tempo nach **Trainingserfahrung**. Unter 1 Jahr 3 % pro Monat, 1–3 Jahre 1 %,
über 3 Jahre 0,5 %. Neue Einstellung **„Trainiere seit“** (Monat und Jahr) unter Mehr → Konto & Profil. Ohne
Eintrag gilt das Datum des ersten Workouts in Trainio.

**Skala:** Das erwartete Tempo der Phase ergibt **etwa 85**. **100 ist selten** und gibt es nur bei deutlich mehr
(etwa dem 1,5-fachen Tempo). Stillstand im Bulk liegt bei 50. Zwischen den Ankern wird linear gerechnet, begrenzt
auf 0–100.

**Ziele je Phase** (`r` = erwartetes Tempo, Kraft in % pro Monat, Gewicht in % Körpergewicht pro Woche)

| Phase | Kraft 100 / 85 / 50 / 0 | Trainingsreiz voll ab | Gewicht „gut“ |
| --- | --- | --- | --- |
| **Bulk** | 1,5 r / r / ±0 / −r | 18 Sätze je Muskelgruppe und Woche | +0,1 bis +0,5 % |
| **Cut** | +r/2 / gehalten / −3 % / −6 % | 8 Sätze | −0,25 bis −1,0 % |
| **Erhalt, Sonstiges, ohne Phase** | r / r/2 / −2 % / −5 % | 10 Sätze | −0,25 bis +0,25 % |

- Hat eine Phase eine **eigene Gewichtsspanne**, gilt diese. Bei „Sonstiges“ ohne eigene Spanne fällt der
  Gewichtsteil weg.
- **Bulk zu schnell** (über +0,5 %): leichter Abzug und der Hinweis „Zunahme zu schnell – eher Fett“. Abnahme im
  Bulk gibt einen deutlichen Abzug.
- **Cut zu schnell** (über −1 %): Abzug und der Hinweis „Abnahme zu schnell – Muskeln in Gefahr“. Kaum Abnahme
  gibt halbe Punkte.

**Körperbereiche:** 7, im Gesamtwert alle gleich gewichtet. Eine vernachlässigte Gruppe senkt den Score über den
Trainingsreiz („Beine hängen hinterher“).

| Körperbereich | Muskelgruppen |
| --- | --- |
| Brust | Brust |
| Rücken | Rücken, Trapez |
| Schultern | Schulter, Hintere Schulter |
| Arme | Bizeps, Trizeps, Unterarme |
| Beine vorne | Quadrizeps, Adduktoren |
| Gesäß & Beine hinten | Gesäß, Beinbeuger, Abduktoren, Waden |
| Rumpf | Bauch, Unterer Rücken |

Den Kraft-Trend eines Körperbereichs bilden nur Übungen, deren Hauptmuskel dort liegt. Hilfsmuskeln zählen nur
beim Trainingsreiz, und zwar zur Hälfte.

**Trainingsreiz-Kurve** (entschieden nach der [Recherche zu Sätzen pro Woche](recherche/saetze-pro-woche.md)):

- **Je Muskelgruppe rechnen, dann im Körperbereich mitteln.** Würden die Sätze von Bizeps, Trizeps und Unterarmen
  zu „Arme“ summiert, wäre der Bereich viel zu leicht voll.
- **Abflachende Kurve statt harter Schwelle.** Für den Bulk gilt: 0 Sätze → 0, 4 → 0,35, 10 → 0,65, 15 → 0,85,
  ab 18 → 1. Für Cut (voll ab 8) und Erhalt (voll ab 10) gilt dieselbe Form, nur gestaucht. Zwischen den Punkten
  wird linear gerechnet.
- **Keine Abzüge für viele Sätze.** Ein Schaden durch hohes Volumen ist nicht belegt.

**Messung**

- **Kraft:** je Übung das beste geschätzte 1RM pro Woche. Verglichen wird der Median der letzten 4 Wochen mit dem
  der 4 Wochen davor. Ein laufendes Maximum wird nicht verwendet.
  - Gezählt werden nur Sätze bis 12 Wdh. (Wdh. + Wdh. in Reserve).
  - RPE wird genutzt, wenn eingetragen (Wdh. in Reserve = 10 − RPE). Sätze mit RPE ≤ 5 zählen nicht.
  - Neue Übungen zählen ab der 5. Einheit. Ein Form-Fix startet die Übung neu.
- **Was nicht zählt:** Cardio und Aufwärmsätze zählen nicht. Form-Fix-Sätze zählen beim Trainingsreiz mit, beim
  Kraft-Trend nicht.
- **Rückblick:** fest 8 Wochen (die letzten 4 gegen die 4 davor), unabhängig vom Zeitraum im Fortschritt. Der
  Verlauf wird jede Woche neu berechnet. Für die Körperbereiche gelten dieselben 8 Wochen, bei wenigen Daten werden
  ihre Werte stärker zur Mitte gezogen.
- **Mindestdaten:** 6 Krafteinheiten in 8 Wochen, verteilt auf mindestens 4 Wochen. Davor steht „Noch zu wenig
  Daten – noch N Workouts“. Der Gewichtsteil zählt erst ab 6 Messungen in 3 Wochen.
- **Unsicherheit:** Bei wenigen Daten wird der Wert zur Mitte gezogen und als „noch unsicher“ markiert.
- **Pausen bis 3 Wochen** (Urlaub, Krankheit) bestrafen nicht, das Fenster verlängert sich entsprechend. Bei
  längeren Pausen steht „Pause – Score ruht“.
- **Phasenwechsel:** Gewertet werden nur Daten seit Beginn der Phase. In den ersten 2 Wochen nach einem Wechsel
  Bulk ↔ Cut zählt das Gewicht nicht. Bei einer Phase, die jünger als 3 Wochen ist, steht „Phase läuft erst kurz“.

**Klartext:** eine Hauptzeile plus höchstens zwei Hinweise, sachlich und ohne Emojis. Er ergänzt die Grafik und
ersetzt sie nicht.

- Kraft: „Kraft steigt“ / „Kraft gehalten“ / „Kraft sinkt leicht“ / „Kraft sinkt deutlich“
- Reiz: „guter Aufbau-Reiz“ (ab etwa 10 Sätzen) / „wirksamer Reiz“ (4–10) / „wenig Reiz für Beine“ (unter 4).
  Liegt ein Bereich bei 4–10 Sätzen und die Kraft steigt, heißt es „Reiz reicht – Fortschritt da“, nicht „wenig Reiz“.
- Gewicht: „Zunahme im Plan“ / „Zunahme zu schnell – eher Fett“ / „Abnahme zu schnell – Muskeln in Gefahr“ /
  „Gewicht stabil“
- Hinweise: „Beine hängen hinterher“, „noch unsicher – wenige Daten“, „Phase läuft erst kurz“

## 7. Nicht Teil dieses Vorhabens

- App-Icons neu gestalten (später, als eigenes Vorhaben).
- Navigation oder Tab-Struktur umbauen, Funktionen streichen.
- Absolutes Kraft-Niveau oder Vergleich mit Kraft-Standards im Score.
- Körperfett, Umfänge oder Fotos als Eingaben des Scores.

## 8. Umsetzung

⏳ Reihenfolge und Schritte der Umsetzung – noch nicht als Ticket gefasst (siehe [Karte](KARTE.md),
„Noch nicht festgelegt“).
