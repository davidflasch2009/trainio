# Redesign & Trainio-Score – Anforderungen

Der Bauplan für das neue Trainio. Er wächst mit jeder Entscheidung auf der [Karte](KARTE.md).
Offene Punkte sind mit ⏳ markiert und verlinken das Ticket, das sie klärt.
**Sind keine ⏳ mehr übrig, ist der Bauplan fertig und die Umsetzung kann starten.**
**Stand 17.11.2026: Der Bauplan ist fertig.** Die Umsetzung startet in der Testversion (Abschnitt 8).
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
- **Schlicht und schön (David, 12.11.2026: „du übertreibst es immer, zu viele Diagramme und Striche“):** keine
  Mini-Grafiken in Kacheln, keine Skalen, Zierlinien oder Deko-Elemente. Diagramme nur in den Details, dort höchstens
  eins. Im Zweifel weglassen.
- **Alles folgt dem Design:** Teilen-Bild, Workout-Score-Ring & Konfetti, Diagramme und Animationen.
- Sprache: Deutsch.

## 3. Basis

Die neue gemeinsame Gestaltung, auf der alle vier Designs aufsetzen: Raster & Abstände, Schriftstufen,
Zahlen-Darstellung, Komponenten (Karte, Liste, Knopf, Eingabe, Segment, Kachel, Fenster, Menü),
Diagramm-Stil und Symbole.

Entschieden in [Die neue Basis](tickets/03-basis.md). Vorlage ist der schlichte Aufbau von „Klarblau 2“
([Prototyp](prototypen/04-klarblau/index.html)). Grundlagen: [Bestandsaufnahme](bestandsaufnahme.md),
[Vorbilder](recherche/vorbilder.md).

**Aufbau der Bildschirme** (die einzelnen Bildschirme folgen diesen Mustern, eigene Festlegungen brauchen sie nicht)

- **Übersichten** (Start, Fortschritt, Herz, Körper …): Kacheln in zwei Spalten mit Titel und Zahl, Listen für
  Gleichartiges, höchstens ein Hauptknopf je Ansicht.
- **Startseite:** Datum, Trainio-Score-Kreis, Statistik-Kacheln (Auswahl wie heute), Hauptknopf „Workout starten“
  bzw. „Weiter: Pull“, Ziele, Letzte Workouts.
- **Details öffnen sich als Fenster von unten** (David): Titel, (i), Schließen; darunter eine große Zahl, höchstens
  ein Diagramm und wenige Werte als Liste. Nach unten wischen schließt.
- **Fortschritt:** Titel, Zeitraum als Knopf („3 Monate ▾“, öffnet ein Menü von unten mit Zeitraum und Einheit),
  darunter die Bereiche als Textreiter.
- **Laufendes Workout:** Kopf mit Name, Zeit und „Beenden“, ein schmaler Fortschrittsbalken, je Übung eine Tabelle
  (Satz, kg, Wdh., Haken). Die aktuelle Zeile klappt die Eingabe auf: Stepper für kg und Wdh., „Letztes Mal …“,
  RPE auf Antippen, Hauptknopf „Satz erledigt“. Die Pause steht als Leiste über der Tab-Leiste und verdeckt nichts.
  Die Einstellung „ausführlich“ bleibt und zeigt zusätzlich die Vorwerte als Spalte und RPE direkt.
- **Workout-Score und Trainio-Score** sind unterscheidbar: Der Trainio-Score ist ein großer Kreis mit der Zahl und
  der Beschriftung „Trainio-Score“. Der Workout-Score steht nur im Abschluss eines Workouts und in dessen Details,
  als kleiner, dicker Ring.

**Raster und Maße**

- 4/8-Raster: Abstände 4, 8, 12, 16, 20, 24 und 28 px. Seitenrand 20 px, zwischen Abschnitten 28 px, in Kacheln
  und Listen 16 px.
- Tap-Flächen mindestens 44 × 44 px, auch bei kleinen Symbolen.

**Schrift**

- Systemschrift (auf dem iPhone SF Pro). Stufen: Seitentitel 30, Abschnitt 20, Text 17, Nebenzeile 15,
  Beschriftung 13, Tab-Leiste 11 px. Zahlen 32 px in Kacheln, 56 px groß in Details. Gewichte 400, 500, 600, 700.
- Ziffern haben feste Breite. Zahl groß, Einheit klein und grau daneben.
- Ein Design darf Titel- und Zahlenschrift sowie Gewichte tauschen, Fließtext bleibt Systemschrift.

**Farben**

- Neutral: Hintergrund, Fläche (Kacheln, Listen), Trennlinie, Text, Text 2.
- **Eine Akzentfarbe** je Design für Hauptknopf, aktuellen Wert, Auswahl und Fortschritt.
- **Signalfarben mit fester Bedeutung** in allen Designs: Gut (Grün), Achtung (Ocker), Schlecht (Rot).
- Kontrast für Text mindestens 4,5 : 1, in Hell und Dunkel.

**Komponenten**

- Kachel (Fläche, Titel und Zahl), Liste (Fläche, Zeilen mit feiner Trennlinie), Knöpfe (Haupt-, Zweit-,
  Textknopf), Stepper, Segment, Textreiter, Fortschrittsbalken (6 px), Fenster von unten, Rückfrage (Mitte),
  Meldung (oben), Erklärung (i) nur in Fenstern.
- Keine Karte in einer Karte. Eine Aktion hat überall dasselbe Wort, z. B. immer „Beenden“.

**Diagramme**

- Nur in Fenstern, höchstens eins je Fenster: Balken oder Linie.
- Aktueller Wert im Akzent, der Rest grau, die laufende Woche blass. Keine Glättung, ehrliche Achsen (der Score immer
  0–100), wenige Gitterlinien, Zahlen an der rechten Achse.

**Symbole:** ein SVG-Satz mit einer Strichstärke, passend zur Schrift. Keine Emojis in Bedienelementen.

**Was ein Design übersteuern darf:** Farben (Hintergrund, Flächen, Akzent), Ecken, Titel- und Zahlenschrift,
Material (flach oder Glas in der Navigationsebene), Bewegung, Form der Tab-Leiste und sein Markenzeichen.
**Immer gleich:** Aufbau, Schriftstufen, Abstände, Tap-Größen, Bedeutung der Signalfarben, Diagramm-Regeln.

## 4. Designs

- **Genau vier Designs**, jedes in Hell und Dunkel.
- **Markant:** Man erkennt jedes auf einem Screenshot ohne Namen sofort. Die Designs unterscheiden sich in Form,
  Schrift, Material und Bewegung, nicht nur in der Farbe.
- **Jedes Design hat ein Markenzeichen**, ein eigenes Verhalten, nicht nur einen eigenen Look. Bei Pure ist es die
  bewusste Schlichtheit (David: „Pure ist der Inbegriff von Fokus und schlicht“).

| Design | Festlegung | Akzentfarben |
| --- | --- | --- |
| **Pure** (Standard) | Schlicht und ruhig, nichts lenkt ab: helle Flächen auf Weiß bzw. dunkle auf Schwarz, Ecken 8 px, Systemschrift. Vorlage ist Klarblau 2. **Abgrenzung zu Fokus:** Pure hat einen Farbakzent, Fokus nicht. Kein zusätzliches Verhalten als Markenzeichen. [Ticket](tickets/11-pure.md) | Blau (Standard), Rot, Grün, Orange, Violett |
| **Fokus** | Schwarz-weiß und ruhig, Farbe nur für Signale. **Markenzeichen: Spotlight** im Workout, nur die aktuelle Übung ist voll da. Konfetti in Graustufen. [Ticket](tickets/05-fokus.md) | keine (David) |
| **Liquid Glass** | **Glas wie beim iPhone** (David): nur in der Navigationsebene, also Tab-Leiste, Kopfzeile beim Scrollen, Fenster und Menüs. Kacheln und Listen bleiben deckend und gut lesbar, kein Glas auf Glas. Farbiger Hintergrund, die Auswahl bleibt in der Feinanpassung. **Markenzeichen: Die Tab-Leiste schrumpft beim Scrollen** und wird beim Hochscrollen wieder groß (David). Bei „Hoher Kontrast“ ohne Unschärfe. [Ticket](tickets/06-liquid-glass.md) | Blau (Standard), Türkis, Violett, Rosa, Grün, Orange |
| **Tag & Nacht** | **Markenzeichen: Der Himmel als Hintergrund wechselt mit der Tageszeit**, kein Hell/Dunkel zum Wählen. Kacheln und Listen deckend, kein Glas, weiche Serifen-Zahlen. **Abgrenzung zu Liquid Glass:** Himmel statt Glas, deckende Tab-Leiste. [Ticket](tickets/12-tag-und-nacht.md) | folgt dem Himmel, keine Auswahl (David) |

- **Standard-Design: Pure** (David, 12.11.2026). Das bisherige „Trainio“ (Graphit & gedecktes Grün) entfällt.
- **Entfallen:** Trainio, Iron, Carbon, Paper und Plakat. Sie werden mit dem Redesign entfernt, nicht vorher.
- Wer ein entferntes Design nutzt, landet automatisch bei Pure.
- Grundlage: [Welche Designs bleiben?](tickets/04-designs-auswahl.md) – nach vier Prototypen mit neuen Richtungen hat
  David entschieden, bei den vorhandenen Designs zu bleiben.

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

- Enthält Ecken, Schrift, Dichte, Tab-Leiste (Stil und Beschriftung) und die eigene Akzentfarbe. Bei Liquid Glass
  zusätzlich die Auswahl des Hintergrunds.
- Gilt **je Design**: Jedes Design merkt sich seine eigenen Anpassungen. Nach einem Wechsel sieht man das neue
  Design so, wie es gedacht ist.
- Die Zeile zeigt den Zustand: „Wie im Design“ oder z. B. „2 Änderungen“.
- Die Unterseite hat „Auf Design zurücksetzen“, das nur für das aktuelle Design gilt.
- Die Suche im Mehr-Tab findet die Regler weiterhin und öffnet die Unterseite.

**Akzentfarbe**

- Jedes Design bietet eine kleine, passende Auswahl (die erste ist die Standardfarbe), siehe Tabelle in Abschnitt 4.
  Fokus hat keine, Tag & Nacht folgt dem Himmel. Bei diesen beiden fehlt die Zeile „Akzentfarbe“.
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
- **Fortschritt → Übersicht:** derselbe Kreis, etwas kleiner, ganz oben. Antippen öffnet dieselben Details.
- Eine eigene Startseiten-Kachel gibt es nicht, der Hauptplatz ersetzt sie.

**Aussehen** (entschieden in [Trainio-Score: Hauptplatz, Karte und Klartext](tickets/10-score-darstellung.md))

- **Kreis:** eine Spur in der Flächenfarbe, darüber ein Bogen in der Akzentfarbe bis zum Wert, in der Mitte die Zahl,
  darunter „Trainio-Score“. Die Form folgt dem Design.
- **Fenster beim Antippen**, von oben nach unten: der Kreis; der Klartext als Hauptzeile und bis zu zwei kurze
  Hinweise (Hinweise in Achtung-Farbe); die sieben Körperbereiche als Liste mit Zahl, schwache Bereiche (unter 65) in
  Achtung-Farbe; der Verlauf der letzten 8 Wochen als eine Linie (0–100); die Bestandteile Kraft, Trainingsreiz und
  Gewichtstrend als Liste. Im (i): „Schätzung aus Training und Gewicht. 85 heißt: im erwarteten Tempo.“
- **Noch zu wenig Daten:** nur die Spur, statt der Zahl ein „–“, darunter „Noch N Workouts“.
- **Noch unsicher:** Zahl wie gewohnt, im Fenster der Hinweis „noch unsicher – wenige Daten“.
- **Pause:** Der letzte Wert bleibt, im Fenster steht „Pause – Score ruht“.
- **Abgeschaltet:** Die Startseite beginnt mit den Kacheln.

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
- Der Trainio-Score an weiteren Orten (Teilen-Bild, Meilensteine, Hinweis bei starker Veränderung): später.

## 8. Umsetzung

**Vorgehen (David, 17.11.2026):** Der Umbau wird gebaut und in einer **Testversion** ausprobiert. Live geht er erst,
wenn David ihn abnimmt.

1. **Testversion einrichten** (erledigt in v1.33.8). Der Umbau entsteht auf dem Zweig `redesign`. GitHub Pages veröffentlicht `main` weiter
   unter der gewohnten Adresse und den Zweig `redesign` zusätzlich unter `…/trainio/test/`. Eine GitHub-Action baut
   beides zusammen. Dafür stellt David einmalig in den Repo-Einstellungen die Pages-Quelle auf „GitHub Actions“.
   Der Service Worker der echten App lässt `/test/` aus. Die echte App ändert sich dadurch nicht.
2. **Testversion mit Beispieldaten** (David; erledigt in v1.33.8): eigener Speicher, keine Verbindung zu Davids Daten oder zu Firebase.
   Beim ersten Öffnen legt sie Beispiel-Workouts an (10 Wochen Push/Pull/Beine, Körpergewicht, Phase Bulk). Ein Knopf
   setzt die Beispieldaten zurück.
3. **Reihenfolge in der Testversion**, jeder Schritt sofort ausprobierbar:
   1. Basis: Schrift, Raster, Farben, Komponenten; Start, laufendes Workout und Fortschritt nach den Mustern;
      Details als Fenster von unten.
   2. Pure als Standard auf der Basis.
   3. Trainio-Score: Berechnung, Darstellung, Einstellung „Trainiere seit“.
   4. Fokus, Liquid Glass und Tag & Nacht auf der Basis.
   5. Alle übrigen Bildschirme (Training, Übungen, Mehr, Herz, Körper …) und Fenster nach den Mustern; Darstellung
      und Feinanpassung neu; Umstieg (entfernte Designs → Pure, Hinweis).
   6. Tests in `tests/smoke.js` für Score, Umstieg und die Trennung der Testversion.
4. **Live:** Nach Davids Abnahme kommt alles in **einem** Release auf `main` (neue Minor-Version). Bis dahin bleibt
   die echte App, wie sie ist. Fehlerbehebungen gehen weiter normal auf `main` und werden in `redesign` übernommen.
