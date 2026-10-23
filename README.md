# Trainio

link: https://davidflasch2009.github.io/trainio/

Workout-Tracker, Trainingsplan-Builder und Progress-Tracker als PWA ohne Build-Step
(`index.html` + `css/app.css` + `js/*.js`, direkt so auslieferbar).

- Läuft sofort im **lokalen Modus** (Daten im Browser), auch ohne Firebase.
- Mit Firebase: Google-Login + Sync zwischen iPhone und Laptop (Firestore, offline-fähig).
- Diagramme: Chart.js 4 · PDF-Export: jsPDF 2 · beide lazy per CDN geladen.

> **Lizenz: Alle Rechte vorbehalten.** Der Code ist zum Ansehen öffentlich, und die App darf unter dem Link
> oben privat genutzt werden. Fehler und Ideen gern als [Issue](https://github.com/davidflasch2009/trainio/issues).
> Kopieren, Verändern, Weitergeben, selbst Hosten oder kommerzielle Nutzung nur mit Erlaubnis – siehe [LICENSE](LICENSE).

## Workout-Score

Nach jedem Workout füllt sich ein Ring in der Akzentfarbe, in der Mitte zählt der **Score (0–100)** hoch.
Darunter die Aufschlüsselung:
- **Fortschritt (45):** pro Übung der Vergleich mit dem letzten Mal (60 % e1RM + 40 % Volumen; Cardio: Distanz
  und Dauer). Deutlich besser (≥ +2,5 %) volle Punkte, etwas besser 85 %, gleich 60 %, etwas schlechter 35 %,
  bis −8 % 15 %, darunter 0. Ein besseres e1RM zählt mindestens wie „gleich“.
- **Erledigt (35):** erledigte Arbeitssätze ÷ geplante.
- **Anstrengung (20):** RPE je Satz, volle Punkte bei RPE 7–9.
- **PR-Bonus:** +3 je neuem e1RM-Rekord, höchstens +9 (Score bleibt bei max. 100).

Fehlt ein Teil (kein Vergleich, kein RPE), wird auf 100 hochgerechnet. Der Score wird aus den gespeicherten
Workouts berechnet – auch alte und importierte haben einen. Zu sehen beim Abschluss, im Workout-Detail und als
Verlauf in Fortschritt → Übersicht („Workout-Score“).

## Meldungen

Kurze Meldungen oben im Bildschirm lassen sich unter **Mehr → Meldungen** je Gruppe abschalten: Bestätigungen
(„Gespeichert", „Gelöscht" … – standardmäßig aus), Workout-Ablauf, PRs & Ziele, Verbindung & Sync, App-Updates.
Fehler, Hinweise („Bitte ein Gewicht eintragen") und Meldungen mit Knopf („Rückgängig") kommen immer. Jede Meldung
schließt sich per Antippen oder **Wegwischen** (nach oben oder zur Seite; kurzes Ziehen federt zurück).

## Animationen

Alle Animationen folgen **Mehr → Darstellung → Animationen** (Voll / Reduziert / Aus) und „Bewegung reduzieren“
des Systems:
- **Tab-Wechsel mit Richtung** (weiter rechts in der Leiste → von rechts, sonst von links); Gruppen im Mehr-Tab
  gleiten von rechts herein und beim Zurückgehen von links.
- **Menüs von unten** (Workout starten, ⋯ usw.) lassen sich auf dem Handy nach unten wegwischen.
- **Zahlen zählen hoch** (Startseite, Fortschritt, Workout-Abschluss).
- **Workout:** fertige Übungen klappen sanft zu, die nächste sanft auf; der Fortschrittsbalken füllt sich weich
  und leuchtet bei 100 % auf; Pausen-Timer mit ablaufendem Ring, die letzten 3 Sekunden pulsieren.
- **Workout-Abschluss:** Abzeichen springt, Haken zeichnet sich, neue PRs erscheinen nacheinander mit Glanz.

## Designs & Darstellung

Unter **Mehr → Darstellung** gibt es 9 Designs, jedes in **Hell und Dunkel**
(oder automatisch nach System / Uhrzeit):

| Design | Look |
| --- | --- |
| Trainio | Ruhiges Graphit mit gedecktem Grün – klar und professionell (Standard) |
| Liquid Glass | Glas-Material mit Unschärfe & Wallpaper, wie iOS 26 |
| Lernio | Petrol & IBM Plex – passend zur Lernio-App |
| Mono | Schwarz-Weiß, OLED-schwarz bzw. papierweiß |
| Brutal | Neo-Brutalismus: dicke Kanten, harte Schatten, Sticker-Farben |
| Soft | Weiche Schatten, alles rund |
| Iron | Industrial-Gym: Stahl, Orange, Condensed-Schrift |
| Neon | Synthwave mit Glow & Raster |
| Terminal | Monospace, Phosphor-Grün / Papier |

Dazu einstellbar: Akzentfarbe (12 Vorgaben oder eigene Farbe – Kontrast wird automatisch
angepasst), Glas-Hintergrund & Unschärfe, Ecken, Schrift, Textgröße, Dichte, hoher Kontrast,
Tab-Leiste (klassisch/schwebend, mit/ohne Beschriftung), Start-Tab, Animationen, Vibration,
Konfetti und Inhalte der Startseite.

## Workout-Ansicht (ausführlich)

- **Übersichtsleiste** oben: alle Übungen mit Fortschrittsring – antippen springt hin.
- **Ziel-Leiste** pro Übung (Sätze × Wdh. · Gewicht · Pause) – antippen öffnet den Ziel-Editor
  (Satzanzahl, Wdh.-Bereich, Gewicht, Pause, Notiz – optional auf alle offenen Sätze übertragen).
- **Liste** (alle Übungen) oder **Fokus** (eine Übung, große Eingaben, vor/zurück).
- **Übersicht**: alle Übungen mit Ziel & erledigten Sätzen, umsortieren, Ziele ändern.
- **Satz-Typen**: Aufwärmen (W), Drop-Satz (D), bis Muskelversagen (F).

## Meine Workouts & Trainingsplan

- Es gibt keine vorgegebenen Pläne – alles erstellst du selbst unter **Training**.
- **Meine Workouts**: Name + Übungen (Sätze, Wdh., Pause, Notiz), z. B. „Push", „Beine".
- **Trainingsplan**: für jeden Wochentag eines deiner Workouts oder Ruhetag. Start und
  „Nächstes Training" richten sich danach; die Konsistenz zählt die geplanten Tage.
- **Starten** nur über den Start-Tab („Workout starten“): nächstes Plan-Workout, eines deiner
  Workouts, Übungen wählen, leeres Workout oder letztes wiederholen. Jedes Workout lässt sich
  über ⋯ → „Als Workout speichern" unter „Meine Workouts" ablegen.

## Aufwärmsätze & Scheibenrechner

- **Mehr → Training → Aufwärmsätze**: Prozent vom Arbeitsgewicht und Wdh. pro Aufwärmsatz frei
  einstellen (bis zu 6 Stufen, Vorlagen Kurz/Standard/Kraft, optional zuerst leere Stange).
- **Mehr → Training → Scheiben & Stange**: verfügbare Scheiben (kg/lb) und Stangengewicht festlegen.
- Der **Scheibenrechner** zeigt die Beladung pro Seite mit Anzahl je Scheibe, Zielgewicht mit
  ±-Tasten und – falls nicht exakt ladbar – das nächste machbare Gewicht.

## Workout-Eingabe

- **Schlicht** (Standard): pro Satz nur Gewicht, Wdh. und Haken; Ziel, Aufwärmen, Scheiben,
  Notizen usw. hinter dem ⋯-Menü.
- **Letztes Mal als Platzhalter**: Was du beim letzten Mal pro Satz gemacht hast, steht grau in den
  Feldern (nicht als Text). Der Pfeil-Knopf neben dem Satz übernimmt die Werte als Text,
  „Alle übernehmen“ macht das für alle leeren Sätze der Übung. Der Haken übernimmt leere Felder
  ebenfalls automatisch. In der ausführlichen Ansicht: Wert in der Spalte „Letztes“ antippen.
  Wer lieber alles direkt als Text vorausgefüllt haben will: **Mehr → Workout → Werte als Text vorausfüllen**.
- **Ausführlich**: Übersichtsleiste, Ziel-Leiste, „Letztes Mal"-Spalte, RPE, Stepper.
- Umschalten unter **Mehr → Workout** oder im Workout über ⋯.
- **Einseitige Übungen (links/rechts)**: z. B. Bulgarian Split Squat oder einarmiges Rudern. Pro Satz
  gibt es dann ein Feld für links und eins für rechts – rechts leer lassen = wie links. Einstellbar im
  Workout über ⋯ → „Einseitig", in „Meine Workouts" über den L/R-Schalter und beim Bearbeiten einer Übung.
  Volumen zählt beide Seiten, Kraftwerte (e1RM, PRs) die schwächere Seite.
- **Nur aktuelle Übung offen** (Standard): fertige und kommende Übungen sind zugeklappt
  (Name + Sätze bzw. Ziel). Ist eine Übung fertig, klappt sie zu und die nächste öffnet sich;
  antippen öffnet jede Übung direkt. Abschaltbar unter **Mehr → Workout**.

## Cardio

- **Eigener Übungstyp**: Statt Sätze × Sekunden gibt es pro Cardio-Übung einen Block mit
  **Dauer + Distanz (km)**. Die Geschwindigkeit in **km/h** rechnet die App aus. Optional kommt **Stufe** bzw.
  beim Laufband **Steigung (%)** dazu. Geräte ohne Distanz (Stepper, HIIT, Seilspringen …) haben
  **Dauer + Stufe**, Sportarten (Fußball, Tennis, Klettern …) nur die **Dauer**. Über „+ Abschnitt“ kannst du mehrere
  Teile eintragen (z. B. 5 min warm, 20 min schnell).
- **Dauer eingeben**: `30` = 30 min, `30,5` = 30:30, `30:15` = 30 min 15 s, `1:05:00` = 1 h 5 min.
- **Letztes Mal** steht als Platzhalter in den Feldern, „Übernehmen“ trägt es ein.
- **Cardio** über „Workout starten“ auf dem Start-Tab (eigene Einheit, direkt unter dem heutigen Workout)
  bzw. **Cardio**-Knopf im laufenden Workout
  (z. B. nach dem Krafttraining). Zuletzt genutzte Arten stehen oben.
- **48 Cardio-Arten**: Laufband, draußen laufen, Gehen, Wandern, Nordic Walking, Rad (Ergometer, draußen,
  Spinning, MTB), Rudern, SkiErg, Crosstrainer, Stepper, Schwimmen, Kajak/SUP, Inliner, Langlauf, HIIT,
  Tabata, Boxen, Tanzen, Klettern, Ballsportarten u. v. m. Eigene Cardio-Übungen: Erfassung „Cardio“
  und Felder wählen (Dauer + Distanz / Dauer + Stufe / nur Dauer).
- **Fortschritt → Cardio**: Minuten & km pro Woche, Tempo-Verlauf (km/h) je Art mit Trend,
  Verteilung nach Art und Bestleistungen (längste Einheit, weiteste Distanz, schnellstes Tempo).
  Neue Bestleistungen werden nach dem Workout gefeiert.
- **Getrennt von Kraft**: Cardio zählt nicht in Volumen, Satzanzahl, Muskel-Heatmap oder Push/Pull.
  Reine Cardio-Tage zählen nicht für Streak, Wochenziel und Konsistenz.

## Phasen & Ziele

- **Phasen** (Fortschritt → „+ Phase“): Name, Typ (Bulk / Cut / Erhalt / Sonstiges), Start und optional Ende.
  Jede Phase ist ein eigener Zeitraum-Chip – alle Auswertungen gelten dann genau für diese Zeit
  (z. B. „Bulk 2026“ seit 1. Juli). Bearbeiten über den Stift neben der aktiven Phase.
- **Kraftziele** (Start → „+ Ziel“): Ziel-1RM pro Übung, z. B. Bankdrücken 100 kg. Gerechnet wird mit der
  1RM-Formel (Epley: Gewicht × (1 + Wdh./30)) aus allen gespeicherten Sätzen – 80 kg × 11 ≈ 109 kg zählt also
  als erreicht. Fortschrittsbalken auf dem Start-Tab; erreichte Ziele werden nach dem Workout mit Konfetti gefeiert.

## Meilensteine

Fortschritt → Übersicht → **Meilensteine**: 15 Meilensteine mit je 5 Stufen
(Bronze → Silber → Gold → Platin → Diamant) in den Gruppen Training (Workouts, Streak, Workouts pro Monat,
Trainingszeit, verschiedene Übungen), Volumen (Tonnage, Sätze, Wiederholungen, PRs), Kraft (geschätztes 1RM
Bank/Kniebeuge/Kreuzheben, Big-3-Total) und Cardio (Zeit, Distanz) – jeweils mit Fortschrittsbalken
„noch X bis Gold“. Dazu Spezial-Abzeichen (Frühaufsteher, Nachteule, Marathon).

## Wischgesten im Workout

Satz-Zeile **nach rechts wischen = abhaken** (bzw. zurücksetzen, wenn schon erledigt), **nach links = löschen** –
mit „Rückgängig“ im Hinweis unten. Ab etwa einem Viertel der Breite rastet die Aktion ein; kürzer loslassen
bricht ab. Gilt in der Listen-Ansicht (schlicht & ausführlich) und bei Cardio-Abschnitten.

## Dauerhafte Übungs-Notiz

Im Workout über ⋯ → **„Dauerhafte Notiz“** (oder in den Übungs-Details) z. B. „Sitzhöhe 4, Griff eng“ hinterlegen.
Die Notiz hängt an der Übung und erscheint als 📌-Hinweis in jedem zukünftigen Workout – antippen zum Ändern.
„Notiz nur für heute“ gilt weiterhin nur für das aktuelle Workout.

## Mehr-Tab (Einstellungen)

Oben ein **Suchfeld** („pause", „rpe", „backup" …): Treffer erscheinen sofort und lassen sich direkt dort
umstellen. Darunter die Konto-Karte und die Gruppen – jede öffnet sich als eigene Seite (zurück über
„‹ Mehr" oben, die Zurück-Taste/-Geste oder erneutes Tippen auf „Mehr"; beim Wechsel auf einen anderen Tab
schließt sich die Gruppe und die Suche wird geleert):

| Gruppe | Inhalt |
| --- | --- |
| Konto & Profil | Google-Anmeldung, Sync-Status, Name, Geschlecht |
| Training | aktiver Plan, Wochenziel, Wochenstart, Einheit, Gewichts-Inkrement, Stange, Scheiben, Aufwärmsätze |
| Workout | Eingabe (Schlicht/Ausführlich), Vorausfüllen, Letztes Mal, RPE, Ansicht, Zuklappen, Scrollen, Bildschirm an |
| Pause & Timer | Standard-Pause, automatisch starten, Benachrichtigung, Ton |
| Darstellung | Vorschau, Design, Modus, Akzentfarbe, Glas-Hintergrund, Ecken, Schrift, Textgröße, Dichte, Kontrast, Tab-Leiste, Animationen, Startseite |
| Meldungen | Hinweise oben ein-/ausschalten: Bestätigungen (Standard aus), Workout-Ablauf, PRs & Ziele, Verbindung & Sync, App-Updates |
| Tabs & Funktionen | Tabs, Körper-Tab, Auswertungen und Workout-Funktionen ein-/ausschalten |
| Daten | Arrow-Import, Gewicht importieren, Rückgängig, Export CSV/PDF, Backup, Restore, Alle Daten löschen |
| Tools | Scheibenrechner, 1RM-Rechner (wenn eingeschaltet) |
| App & Hilfe | Installieren, Updates, Fehlerprotokoll, Repository, Kontakt |

Ist der Übungen-Tab ausgeblendet, steht die Übungs-Bibliothek direkt auf der Mehr-Übersicht.

## Tabs ein-/ausblenden

**Mehr → Tabs & Funktionen**: Übungen- und Fortschritt-Tab ein- oder ausblenden (der Übungen-Tab hat dafür auch unten
einen eigenen Knopf). Ist der Übungen-Tab aus, bleibt die Bibliothek unter **Mehr → Übungs-Bibliothek**
und beim Hinzufügen von Übungen erreichbar.

## Funktionen ein-/ausschalten

**Mehr → Tabs & Funktionen**: Übungen- und Fortschritt-Tab, einzelne Auswertungen, Pausen-Timer,
Aufwärmsätze, Scheibenrechner, Progressions-Vorschläge, PR-Feiern, Satz-Typen, Fokus-Modus,
Workout-Notizen, Cardio-Auswertungen, Arrow-Import und Tools – alles einzeln abschaltbar.

## Plan-Analyse

Beim Erstellen/Bearbeiten eines Trainingsplans steht unten eine **Live-Analyse**, die sich bei jeder
Tag-Zuweisung aktualisiert; „Ganze Analyse" öffnet die Übersicht (auch über Training → „Analyse" oder
Plan-Menü → „Plan analysieren"). Grundlage sind die geplanten Arbeitssätze der Workouts (ohne Cardio):

- **Push / Pull** – Pull-Sätze ÷ Push-Sätze, ausgewogen 0,8–1,2
- **Beine / Oberkörper** – Bein-Sätze ÷ (Push + Pull), ausgewogen 0,4–0,8
- **Frequenz** – an wie vielen Tagen ein Muskel als Hauptmuskel trainiert wird (Brust, Rücken, Schulter,
  Bizeps, Trizeps, Quadrizeps, Beinbeuger sollten 2× pro Woche vorkommen)
- **Erholung** – Warnung, wenn derselbe Muskel an zwei Tagen hintereinander je 3+ Sätze bekommt
  (auch So → Mo; Bauch, Unterarme und Waden ausgenommen)
- **Umfang & Dauer** – Tage, Sätze, Übungen und Minuten pro Workout; Warnung ohne Ruhetag oder bei
  Workouts über 25 Sätze bzw. 90 min

Jeder Punkt bekommt ✓ oder ⚠, bei ⚠ mit einem konkreten Tipp (z. B. „Ca. 9 Bein-Sätze mehr pro Woche").

## Im Workout

- **Drop-Satz:** ⋯ an der Übung → „Drop-Satz hinzufügen“ hängt einen Satz mit „D“ an, Gewicht ca. 20 % unter
  dem letzten Satz (abgerundet aufs Gewichts-Inkrement). „Bis zum Muskelversagen“ gibt es über die Satznummer.
- **Workout beenden:** Sobald alle Sätze abgehakt sind, erscheint unten ein großer „Workout beenden“-Knopf
  (in der schlichten Eingabe; die ausführliche hat ihn immer), mit automatischem Scrollen dorthin.

## Workouts nachträglich bearbeiten

Workout öffnen (z. B. unter „Letzte Workouts") → **Bearbeiten**:
- **Datum, Uhrzeit & Dauer** – auch Name, Körpergewicht und Notiz. Datum/Uhrzeit oder Dauer kann man
  im Workout-Detail auch direkt antippen.
- **Sätze & Übungen** – öffnet das Workout im Editor (Gewichte, Wiederholungen, Übungen).

## Körper-Tab

Standardmäßig nur das **Gewicht**: Schnelleingabe für heute, Verlauf mit 7-Tage-Durchschnitt, Trend pro
Woche, optionales **Zielgewicht** (mit geschätztem Datum), Veränderung pro Woche und Kennzahlen im Zeitraum.
**Wochenziel:** Pro Phase (Fortschritt → „+ Phase": Bulk, Cut, Erhalt …) oder allgemein im Körper-Tab
(„Wochenziel festlegen": Zunehmen / Abnehmen / Halten) legst du fest, wie stark sich dein Wochendurchschnitt
verändern darf, z. B. 0 bis +200 g. In „Veränderung pro Woche" sind Wochen im Bereich grün, darüber oder
darunter orange; ein blasses Band zeigt den erlaubten Bereich. In einer Phase gilt deren Bereich, sonst die
allgemeine Einstellung.
**Gewicht importieren:** Körper-Tab → „CSV importieren" (oder Mehr → Daten → Gewicht importieren). Funktioniert
mit CSV-Exporten aus Waagen-/Gewichts-Apps wie Better Weight, Withings oder Libra – Datum- und Gewichtsspalte
werden erkannt (Semikolon/Komma, deutsches Dezimalkomma, kg oder lb). Vorschau mit Zeitraum, vorhandene Tage
werden übersprungen oder auf Wunsch überschrieben; „Letzten Import rückgängig machen" nimmt alles wieder zurück.
Körperfett, Umfänge und Fotos lassen sich unter **Mehr → Tabs & Funktionen** (oder im Körper-Tab über
„Anzeige anpassen") einschalten – vorhandene Daten bleiben erhalten.

## Diagramme

Ruhige, einheitliche Darstellung (eine Farbe pro Kennzahl, Mehrfarbig nur beim Vergleich), Hilfslinie beim
Antippen, jedes Diagramm im Vollbild mit Tabelle. Die **laufende Woche** (bzw. der laufende Monat) ist blass
bzw. gestrichelt und zählt nicht in Durchschnittslinien – so sieht eine halbe Woche nicht wie ein Einbruch aus.

- **Übersicht**: Streak, Workouts gesamt, **Wochenvergleich** und **Monatsrückblick** (jeweils bis zum gleichen
  Tag der Vorperiode; der heutige Tag zählt erst, wenn heute ein Workout gespeichert ist – vorher wird bis
  gestern verglichen, auch bei der Volumen-Kachel auf der Startseite), Trainingstage im Monat, Push/Pull/Legs, PR-Angriff, aktive PRs, letzte 7 Tage,
  Jahres-Kalender; darunter immer sichtbar „Mehr Stats" (Lieblings-Übung, Workout-Dauer, Sätze pro Workout,
  PRs pro Monat, Rekord-Workout, Gesamt bewegt, Erste-Hilfe-Ampel) und die Meilensteine.
- **Kraft** mit Filter **Gesamt / Pro Übung / Pro Muskelgruppe**: Gesamt und Muskelgruppe zeigen den
  **Kraftzuwachs in %** (kg verschiedener Übungen lassen sich nicht addieren), **Top-Aufsteiger**,
  Kraft im Vergleich, PRs pro Woche und Tage seit dem letzten PR. Pro Übung: geschätztes 1RM, Rep-Maxima,
  Max-Gewicht, Intensität, relative Kraft, **Gewicht vs. Kraft** (Körpergewicht und e1RM in einem Diagramm),
  PR-Timeline.
- **Volumen**: Tonnage, Sätze und Wiederholungen pro Woche, Volumen pro Workout, **Volumen pro Workout-Typ**
  (nach Workout-Name, z. B. „Push A" und „Push B" getrennt), Trainingsdichte, Wochentage, Top-Übungen,
  Trend pro Übung, Intensitäts-Mix, Jahresvergleich.
- **Muskeln**: Body-Heatmap, Sätze pro Muskelgruppe, Verteilung, Push vs. Pull, Beine vs. Oberkörper,
  vernachlässigte Muskeln, Muskel-Fortschritt, **Muskeln über Zeit** (gestapelt), Übungs-Vielfalt.
- **Direkte vs. mitgeholfene Sätze**: Ein Satz zählt direkt für den Hauptmuskel der Übung (erster
  Muskel), für die übrigen nur als „mitgeholfen“ (z. B. Bizeps beim Klimmzug). Sätze pro Muskelgruppe
  und Muskel-Fortschritt zeigen direkt kräftig und mitgeholfen blass; für MEV/MAV/MRV und
  „Vernachlässigt“ zählen mitgeholfene Sätze halb. Verteilung, Muskeln über Zeit, Übungs-Vielfalt sowie
  Kraft/Volumen „Pro Muskelgruppe“ zählen nur Übungen mit diesem Hauptmuskel.
- **Körper → Umfänge**: Veränderung in cm seit Zeitraumbeginn statt flacher Linien auf einer Skala.

## Übungen & Muskel-Diagramm

- Über 320 Übungen inkl. Maschinen, Kabel, Multipresse (Smith Machine), Plate-Loaded, Kettlebell, Core & Cardio –
  gängige englische Gerätenamen sind als Suchbegriffe hinterlegt. Bestehende Konten bekommen
  neue Übungen automatisch ergänzt.
- Body-Heatmap mit 36 Muskelregionen plus sortierte Regionen-Liste, u. a. Brust oben/mitte/unten,
  Sägemuskel, vordere/seitliche/hintere Schulter, Rotatorenmanschette, Bizeps & Brachialis,
  Trizeps langer/seitlicher Kopf, Unterarm-Beuger/-Strecker, Trapez oben/mitte/unten, Rhomboiden,
  Latissimus, Teres, obere/untere Bauchmuskeln, Rectus femoris / Vastus lateralis / Vastus medialis,
  Beinbeuger außen/innen, Soleus und Tibialis. Welche Region eine Übung trifft, ergibt sich aus
  Muskelgruppe + Name (z. B. Hammer-Curls → Brachialis, Trizeps über Kopf → langer Kopf).

## Dateien

| Datei | Zweck |
| --- | --- |
| `index.html` | Grundgerüst; lädt CSS + Skripte (Reihenfolge wichtig) |
| `css/app.css` | alle Styles (Designs, Hell/Dunkel, Layout) |
| `js/config.js` | Firebase-Konfiguration |
| `js/core.js` | Konstanten, App-Version, Hilfsfunktionen |
| `js/seeds.js` | Übungs-Bibliothek + feste Pläne |
| `js/store.js` | Datenspeicher (lokal + Firestore) und Google-Anmeldung |
| `js/ui.js` | UI-Kern: Toasts, Dialoge, Navigation, Designs |
| `js/analytics.js` | Übungs-Helfer, Auswertungen, Rekorde |
| `js/workout.js` | Workout-Engine (aktives Workout) |
| `js/training.js` | Start-Tab + Training-Tab |
| `js/exercises.js` | Übungs-Auswahl, Tools, Übungs-Bibliothek |
| `js/charts.js` | Diagramm-Bausteine (Chart.js) |
| `js/progress.js` | Fortschritt-Tab |
| `js/more.js` | Mehr-Tab: Gruppen-Seiten, Einstellungs-Suche, Konto, Daten (Export CSV/PDF/JSON) |
| `js/import.js` | Arrow-Import |
| `js/boot.js` | Start der App |
| `sw.js` | Service Worker (Offline-Cache) |
| `tools/release.py` | Version für ein Deploy hochsetzen (siehe unten) |
| `manifest.json` | PWA-Manifest |
| `icon.svg` | Logo „Progress-Kettlebell“ als Vektor (Favicon) |
| `icon-192.png`, `icon-512.png` | App-Icons (abgerundete Kachel) |
| `icon-maskable-192.png`, `icon-maskable-512.png` | Android-Icons mit Sicherheitsrand (maskable) |
| `apple-touch-icon.png` | iPhone-Homescreen-Icon |

## 1. Firebase einrichten (einmalig)

1. In der [Firebase Console](https://console.firebase.google.com) ein **neues Projekt** anlegen (z. B. `gymlog-xxxxx`).
2. **Firestore Database** → Datenbank erstellen → *Native Mode*, Region `eur3 (Europe)`.
3. **Authentication** → *Sign-in method* → **Google** aktivieren.
4. **Authentication → Settings → Authorized domains** → `davidflasch2009.github.io` hinzufügen.
5. **Firestore → Regeln** ersetzen durch:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **Projekteinstellungen → Allgemein → Deine Apps → Web-App (`</>`)** registrieren und die
   `firebaseConfig` kopieren.
7. In `js/config.js` die Platzhalter in `const FIREBASE_CONFIG = { … }`
   durch die echten Werte ersetzen.

Solange dort noch `DEINE_API_KEY` steht, läuft die App im lokalen Modus. Daten, die du lokal
erfasst hast, kannst du beim ersten Login ins Konto übernehmen.

## 2. Deployment (GitHub Pages)

1. Repo → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)`.
2. Live-URL: `https://davidflasch2009.github.io/trainio/`
3. Änderungen veröffentlichen:

   ```bash
   git add . && git commit -m "…" && git push
   ```

> **Wichtig:** Vor jedem Deploy `python3 tools/release.py <version>` ausführen
> (z. B. `python3 tools/release.py 1.11.1`). Das setzt die App-Version in `js/core.js`,
> hängt `?v=<version>` an alle CSS/JS-Links in `index.html` und zählt `CACHE` in `sw.js`
> hoch. Sonst zeigt das iPhone noch die alte Version (oder alte und neue Dateien gemischt).
> Die App meldet neue Versionen selbst („Neue Version verfügbar – Neu laden“).

### Installieren

- **iPhone (Safari):** Teilen → *Zum Home-Bildschirm*.
- **Windows (Chrome/Edge):** Install-Symbol in der Adressleiste oder *Mehr → App & Hilfe → App installieren*.

## 3. Arrow-Import

1. Screenshots der Arrow-History machen.
2. In der App: **Mehr → Daten → 🏹 Arrow-Import → „Prompt für Claude kopieren“**.
3. Prompt + Screenshots an Claude schicken, den zurückgegebenen JSON-Block in das Textfeld
   einfügen (oder als `.json` hochladen).
4. **Validieren & Vorschau** → prüfen → **Import bestätigen**.

Duplikate (gleiches Datum + gleiche Sätze) werden übersprungen, englische Arrow-Namen
(„Bench Press“, „Lat Pulldown“ …) automatisch auf die Bibliothek gemappt, `weightLb` wird in
kg umgerechnet. Der letzte Import lässt sich unter **Mehr → Daten → Letzten Import rückgängig machen**
komplett zurücknehmen.

**Korrigierte Datei erneut importieren:** Gibt es schon einen Arrow-Import, bietet die Vorschau
„Alten Arrow-Import ersetzen“ an (vorausgewählt). Dann werden die Workouts des alten Imports durch
die neue Datei ersetzt – nichts wird doppelt. Selbst eingetragene Workouts und andere Importe
(z. B. Gewicht aus CSV) bleiben unverändert; vom alten Import angelegte Übungen werden
weiterverwendet, wenn die neue Datei sie enthält.

## Fehlerprotokoll

Geht in der App etwas schief, erscheint eine Meldung „Da ist etwas schiefgelaufen …“ mit **Details**.
Alle Fehler (höchstens 30) stehen unter **Mehr → App & Hilfe → Fehlerprotokoll**; „Kopieren“ erzeugt einen Bericht mit
Version, Gerät/Browser und Fehlermeldung (ohne Trainingsdaten) zum Weiterschicken. Netzwerk- und
Offline-Abbrüche werden nur protokolliert, nicht eingeblendet.

## Lokal testen

```bash
python -m http.server 8000
# → http://localhost:8000
```

Der Service Worker läuft nur über `http://localhost` oder `https://`, nicht über `file://`.

## Lizenz

Alle Rechte vorbehalten – Details in [LICENSE](LICENSE). Erlaubt sind Ansehen des Codes, private Nutzung der
App unter https://davidflasch2009.github.io/trainio/ und Issues mit Fehlern oder Vorschlägen; alles andere
(kopieren, verändern, weitergeben, selbst hosten, kommerziell nutzen) nur mit Erlaubnis.
