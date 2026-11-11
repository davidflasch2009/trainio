# Recherche: Kraft- und Muskelentwicklung aus Workouts und Körpergewicht schätzen

- **Ticket:** [08 – Recherche Trainio-Score](../tickets/08-recherche-score.md) · Grundlage für [09 – Trainio-Score: die Formel](../tickets/09-score-formel.md)
- **Stand:** 11.11.2026
- **Begriffe:** Trainio-Score, Workout-Score, Phase – siehe [CONTEXT.md](../../../CONTEXT.md)

## Wie diese Recherche entstanden ist (bitte zuerst lesen)

- Gesucht wurde nach **Primärquellen**: Meta-Analysen, systematische Reviews, Positionspapiere und tragende
  Einzelstudien in Fachzeitschriften. Apps nur als Vergleich (Punkt 6).
- **Einschränkung:** In dieser Umgebung war der direkte Abruf von Volltexten gesperrt (PubMed, PMC, Verlage).
  Die Zahlen wurden deshalb über Abstracts und Suchauszüge der Originalarbeiten gegengeprüft. Wo eine Zahl aus
  der Fachliteratur stammt, aber hier **nicht** gegengeprüft werden konnte, steht **(ungeprüft)** dahinter.
  Vor einer endgültigen Festlegung lohnt bei diesen Stellen ein Blick in den Volltext.
- **Belegstärke** steht in eckigen Klammern:
  **[A]** Meta-Analyse, systematischer Review oder Positionspapier ·
  **[B]** einzelne Studie ·
  **[C]** Praxis-Faustregel aus dem Coaching, nicht peer-reviewed ·
  **[R]** eigene Modellrechnung für Trainio (Skript-Ergebnisse, Annahmen jeweils genannt).
- Alle Zahlen gelten im **Mittel von Gruppen**. Einzelne Menschen streuen stark (siehe Punkt 3). Für einen
  Score heißt das: Er kann nur eine **Schätzung** sein und sollte das auch sagen.

## Kurzfassung

1. **Kraftzuwachs wird mit der Trainingserfahrung schnell kleiner** (etwa logarithmisch). Als Orientierung für das
   geschätzte 1RM (e1RM): Einsteiger 2–5 % pro Monat, Fortgeschrittene 0,5–2 %, Erfahrene 0,25–0,75 %,
   Elite unter 0,3 %. Das sind abgeleitete Spannen, keine direkt gemessenen Studienwerte.
2. **Mehr Sätze pro Muskel und Woche bringen mehr Muskelwachstum, aber mit abnehmendem Ertrag.** 10+ Sätze
   schlagen < 5 Sätze deutlich; 12–20 Sätze gelten bei Trainierten als guter Standard. Für Kraft reichen deutlich
   weniger Sätze. **Trainios Zählweise (Hauptmuskel 1, Hilfsmuskel 0,5) ist genau die Methode, die die neueste
   Meta-Regression am besten stützt.**
3. **MEV 10 / MAV 15 / MRV 20 sind keine Forschungswerte**, sondern ein Coaching-Modell (Renaissance
   Periodization). 10 und 12–20 passen gut zur Literatur; „MRV 20“ ist keine belegte Obergrenze.
4. **Kraft und Muskel hängen beim einzelnen Menschen nur locker zusammen.** In den ersten Wochen und bei neuen
   Übungen ist Kraftzuwachs überwiegend Technik und Nervensystem. Kraft allein ist kein Muskelmaß.
5. **Gewicht pro Woche:** Bulk etwa **+0,25 bis +0,5 % des Körpergewichts**, Cut etwa **−0,5 bis −1 %**
   (langsamer schützt Muskeln besser). Schnelleres Zunehmen bringt vor allem mehr Fett.
6. **Kraft halten im Cut ist notwendig, aber kein Beweis für Muskelerhalt:** Im Defizit bleibt Kraft oft
   stabil, während Muskelmasse schon leidet. Ein Kraftverlust im Cut ist dagegen ein echtes Warnsignal.
7. **Rauschen:** Körpergewicht schwankt von Tag zu Tag um etwa **0,5 %** (≈ 0,4 kg bei 80 kg), ein 1RM von
   Tag zu Tag um etwa **2–4 %**. Daraus folgt ein Rückblick von **mindestens 6, besser 8 Wochen**.
8. **Achtung bei der heutigen Kraft-Auswertung:** „Bestes e1RM bis heute ÷ erste Session“ (`strengthGains`)
   zeigt schon bei reinem Rauschen **+3 bis +6 % Scheinzuwachs** und eignet sich daher nicht für den Score.
9. **Keine bekannte App** bewertet die Entwicklung phasenabhängig aus Training und Gewicht. Fitbod, Hevy und
   Strength Level bewerten das **absolute Niveau**, Whoop die **Belastung**. Trainio wäre hier eigenständig.

## Andockpunkte in der App (nur gelesen, nichts geändert)

| Baustein | Wo | Was er heute tut |
| --- | --- | --- |
| e1RM | `js/analytics.js` `e1rmBy`, in `buildIndex` als `e1` | Epley `w·(1 + r/30)`, Brzycki `w·36/(37 − r)` oder Mittelwert; pro Session bester Satz (`best`), Form-Fix-Sätze zählen nicht |
| Sessions je Übung | `buildIndex` → `sessions[exId]` | mit `best`, `list` (Wdh., Gewicht, RPE), `fix` beim Form-Fix |
| Form-Fix | `sinceFix()` | Vergleiche, Trend und PRs starten ab dem letzten Fix neu |
| Kraftzuwachs | `js/progress.js` `strengthGains` (~Z. 514), `gainIndex` | bestes e1RM bis zum Tag ÷ erste Session im Zeitraum, mind. 3 Sessions |
| Sätze pro Muskel | `buildIndex` → `mP` (direkt) / `mS` (mithelfend); `regionSets` mit `REGIONS` (36 Regionen) | Hauptmuskel 1, Hilfsmuskel 0,5; Richtwerte MEV 10 / MAV 15 / MRV 20 |
| Körpergewicht | `Analytics.bwSeries()`, Körper-Tab | Werte aus Körper-Tab und Workouts; 7-Tage-Schnitt; lineare Regression ab ≥ 3 Punkten über ≥ 14 Tage |
| Phasen | `PHASE_TYPES`, `RATE_DEFAULTS` | Bulk 0 bis +0,2 kg/Wo, Cut −0,5 bis −0,25 kg/Wo, Erhalt ±0,2 kg/Wo, Sonstiges ohne Vorgabe; eigene Spanne je Phase möglich (`rateMin`/`rateMax`) |

---

## 1. Realistische Zuwachsraten des geschätzten 1RM nach Trainingserfahrung

### Was die Forschung zeigt

- **Gefälle nach Trainingsstand** [A]: Das ACSM-Positionspapier und der zugrunde liegende Review von Kraemer &
  Ratamess nennen mittlere Kraftzuwächse in Studien von etwa **40 % bei Untrainierten, 20 % bei mäßig
  Trainierten, 16 % bei Trainierten, 10 % bei Fortgeschrittenen**; im Positionspapier zusätzlich **2 % bei
  Elite** über Studienzeiträume von **4 Wochen bis 2 Jahren** (Elite-Wert und Zeitraum ungeprüft). Wegen der sehr
  unterschiedlichen Studienlängen lässt sich daraus **keine Monatsrate** ablesen, wohl aber das Verhältnis:
  Jede Stufe gewinnt grob die Hälfte der vorherigen.
  ([ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/), [Kraemer & Ratamess 2004](https://journals.lww.com/acsm-msse/fulltext/2004/04000/fundamentals_of_resistance_training__progression.17.aspx))
- **Verlauf über Jahre** [B]: Steele et al. werteten Trainingsprotokolle von Tausenden Mitgliedern einer
  Studiokette aus (1×/Woche, je ein Satz bis zum Muskelversagen, bis zu 352 Wochen). Kraft stieg **linear-
  logarithmisch**: steil am Anfang, **Plateau nach etwa einem Jahr** – bei dieser minimalen Dosis.
  ([Steele et al. 2023](https://doi.org/10.1080/02701367.2022.2070592))
- **Wettkampf-Kraftdreikämpfer** [B]: 1.897 Athleten über 15 Jahre; mittlerer Zuwachs des Totals
  **0,15 kg pro Tag** bei Männern (≈ 55 kg/Jahr), 0,12 kg bei Frauen. **Die stärksten Männer verbesserten sich nur
  halb so schnell** wie die schwächsten (0,10 vs. 0,21 kg/Tag). Bei einem Total von 500–600 kg entspricht der
  Mittelwert grob **0,8–0,9 % pro Monat** [R].
  ([Latella et al. 2020](https://doi.org/10.1519/JSC.0000000000003657))
- **Elite** [B]: Elite-Gewichtheber steigerten Maximalkraftwerte in 2 Jahren nur um etwa **4–5 %** (≈ 0,2 % pro
  Monat), nicht signifikant. ([Häkkinen et al. 1988](https://doi.org/10.1152/jappl.1988.65.6.2406))
- **Untrainierte** [B]: 287 Untrainierte gewannen in 20–24 Wochen im Mittel **+21 % Kraft** (Spanne −8 bis
  +60 %), also etwa 4 % pro Monat. ([Ahtiainen et al. 2016](https://doi.org/10.1007/s11357-015-9870-1))
- **Studien vs. Alltag:** Studien messen oft genau die trainierte Übung nach einem neuen Programm. Das
  überschätzt den Dauerzuwachs im Alltag, der zusätzlich durch Pausen, Urlaub und Deloads gebremst wird.

### Orientierungswerte für die Formel (abgeleitet, keine direkte Studienzahl)

| Trainingsalter (regelmäßig) | Belege | Erwartete e1RM-Rate im Bulk |
| --- | --- | --- |
| Einsteiger (< 1 Jahr) | Ahtiainen ≈ 4 %/Monat; Steele: steiler Anstieg im 1. Jahr | **2–5 % pro Monat** (anfangs mehr, viel davon Technik) |
| Fortgeschritten (1–3 Jahre) | ACSM-Gefälle; Latella ≈ 0,8 %/Monat im Mittel | **0,5–2 % pro Monat** |
| Erfahren (3+ Jahre) | Latella: Stärkste halb so schnell | **0,25–0,75 % pro Monat** |
| Elite | Häkkinen ≈ 0,2 %/Monat | **< 0,3 % pro Monat** |

**Unsicherheit:** Die Spannen sind aus Studien mit unterschiedlichen Übungen, Personen und Messmethoden
zusammengesetzt [R]. Die Übungen unterscheiden sich außerdem: Kleine Isolationsübungen springen durch
Gewichtsstufen prozentual stärker (2,5 kg auf 10 kg = +25 %), neue Übungen steigen anfangs schnell (Lernen).

---

## 2. Dosis-Wirkung: Sätze pro Muskel und Woche ↔ Muskelwachstum

### Was die Forschung zeigt

- **Schoenfeld, Ogborn & Krieger 2017** [A] (15 Studien, 34 Gruppen): Jeder zusätzliche Satz pro Woche brachte im
  Mittel **+0,37 % Muskelgröße**. Nach Gruppen: **< 5 Sätze 5,4 %, 5–9 Sätze 6,6 %, ≥ 10 Sätze 9,8 %** Zuwachs
  (Gruppenwerte ungeprüft; der Gruppenvergleich war nur ein Trend, p = 0,074). Daher stammt die verbreitete
  „mindestens 10 Sätze“-Regel. ([Schoenfeld et al. 2017](https://doi.org/10.1080/02640414.2016.1210197))
- **Schoenfeld et al. 2019** [B]: Trainierte Männer, 8 Wochen, 1, 3 oder 5 Sätze je Übung, 3×/Woche
  (≈ 6–9, 18–27, 30–45 Sätze pro Muskel und Woche, ungeprüft). **Mehr Volumen → mehr Muskel, aber nicht mehr
  Kraft.** ([Schoenfeld et al. 2019](https://pubmed.ncbi.nlm.nih.gov/30153194/))
- **Baz-Valle et al. 2022** [A] (Trainierte, ≥ 6 Wochen): **12–20 Sätze pro Woche** als Empfehlung; > 20 Sätze
  brachten nur beim Trizeps mehr. Kleine Datenbasis (6 Studien).
  ([Baz-Valle et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/))
- **Pelland et al. 2025** [A] (Meta-Regression, ~67 Studien): Muskelwachstum steigt mit dem Wochenvolumen,
  **mit abnehmendem Ertrag, ohne harte Obergrenze** im untersuchten Bereich. **Kraft flacht viel früher ab**
  (Sekundärquellen nennen ~4 Sätze pro Woche als praktisches Plateau, ungeprüft). Am besten passte die
  **„fraktionale“ Zählung: direkte Sätze 1, indirekte 0,5** – genau Trainios Regel. Frequenz spielt bei
  gleichem Volumen für Muskelwachstum kaum eine Rolle.
  ([Pelland et al. 2025](https://doi.org/10.1007/s40279-025-02344-w), [Preprint](https://sportrxiv.org/index.php/server/preprint/view/460))
- **Nähe zum Muskelversagen** [A]: Muskelwachstum nimmt zu, je näher Sätze am Versagen enden; für Kraft spielt
  das kaum eine Rolle. Sehr leichte Sätze (viele Wdh. in Reserve) sind also ein schwächerer Wachstumsreiz.
  ([Robinson et al. 2024](https://doi.org/10.1007/s40279-024-02069-2))
- **Erhalt braucht wenig** [B]: Nach 16 Wochen Aufbau hielten junge Erwachsene ihre Muskelzuwächse 32 Wochen
  lang mit **einem Drittel und sogar einem Neuntel** des Aufbau-Volumens; Kraft blieb sogar bei kompletter Pause
  weitgehend erhalten. Ältere brauchten mehr. ([Bickel et al. 2011](https://pubmed.ncbi.nlm.nih.gov/21131862/))

### Sind MEV 10 / MAV 15 / MRV 20 belegt?

- **Herkunft** [C]: MEV, MAV und MRV (plus MV = Erhaltungsvolumen) stammen aus dem Coaching-Modell von
  Renaissance Periodization (Israetel u. a.). RP selbst nennt die Werte **Startpunkte, „nicht in Stein
  gemeißelt“**, je Muskel und Person verschieden; MV liegt dort bei etwa **6 Sätzen pro Woche**.
  ([RP: Training Volume Landmarks](https://rpstrength.com/training-volume-landmarks-muscle-growth/))
- **Abgleich mit der Forschung:**
  - **MEV 10** passt zur „≥ 10 Sätze“-Gruppe bei Schoenfeld 2017. Wachstum gibt es aber auch darunter –
    10 ist eher „gut wirksam“ als „Minimum“.
  - **MAV 15** liegt mitten in den 12–20 Sätzen von Baz-Valle 2022 – plausibel.
  - **MRV 20** ist **keine belegte Grenze**: Studien zeigen bei Trainierten teils noch Zuwachs über 20 Sätze
    (Schoenfeld 2019, Pelland 2025), mit kleinerem Ertrag und mehr Ermüdung. Wo die Erholung endet, ist
    individuell.
- **Fazit:** Als Orientierung (wenig / gut / viel) taugen die Werte. In einer Formel sollten sie keine harten
  Stufen sein, sondern eine **abflachende Kurve** (z. B. 0 → 0, 5 → ~0,5, 10 → ~0,8, 15–20 → 1).

---

## 3. Wie eng hängen Kraftzuwachs und Muskelwachstum zusammen?

### Was die Forschung zeigt

- **Beim Einzelnen nur locker** [B]: Bei 585 Personen (12 Wochen Armtraining) reichte der Zuwachs an
  Muskelquerschnitt von **−2 bis +59 %**, an 1RM von **0 bis +250 %**
  ([Hubal et al. 2005](https://gwern.net/doc/exercise/2005-hubal.pdf)). Bei 287 Untrainierten stiegen im Mittel
  Muskelgröße **+4,8 %** und Kraft **+21 %**; die Veränderungen hingen nur **schwach** zusammen, und wer bei
  der Kraft stark zulegte, tat das nicht unbedingt beim Muskel
  ([Ahtiainen et al. 2016](https://doi.org/10.1007/s11357-015-9870-1), eingeordnet in
  [Buckner et al. 2016](https://cir.nii.ac.jp/crid/1360861294193062784)).
- **Fachstreit** [A]: Loenneke, Buckner u. a. argumentieren, trainingsbedingtes Muskelwachstum trage gar
  nicht zum Kraftzuwachs bei ([Loenneke et al. 2019](https://doi.org/10.1007/s40279-019-01106-9)). Taber,
  Vigotsky, Nuckols & Haun halten dagegen: Muskelwachstum ist eine **mitwirkende Ursache**, aber weder nötig
  noch allein hinreichend ([Taber et al. 2019](https://link.springer.com/doi/10.1007/s40279-019-01107-8)). Gemeinsamer Nenner:
  **Kurzfristig ist Kraft vor allem Nerven und Technik, langfristig trägt Muskelmasse bei.**
- **Nerven zuerst** [B]: Der Klassiker von Moritani & deVries zeigt, dass frühe Kraftzuwächse (erste Wochen)
  überwiegend neural sind und Muskelwachstum später den Anteil übernimmt
  ([Moritani & deVries 1979](https://pubmed.ncbi.nlm.nih.gov/453338/)). Messbares Muskelwachstum gibt es zwar
  schon nach etwa **3 Wochen** ([Seynnes et al. 2007](https://pubmed.ncbi.nlm.nih.gov/17053104/)), aber
  die frühe Zunahme ist teils **Schwellung (Ödem)** durch Muskelschaden
  ([Damas et al. 2016](https://link.springer.com/doi/10.1007/s00421-015-3243-4)).
- **Üben des Tests reicht** [B]: Wer nur den 1RM-Test übte (bis 5 Einzelversuche), steigerte sein 1RM
  **genauso** wie eine Gruppe mit 4 Sätzen à 8–12 Wdh. – baute aber **weniger Muskel** auf
  ([Mattocks et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28463902/)).
- **Last-Spezifität** [A]: Schwere Lasten steigern das 1RM stärker, Muskelwachstum ist über einen weiten
  Lastbereich gleich ([Schoenfeld et al. 2017, Low- vs. High-Load](https://pubmed.ncbi.nlm.nih.gov/28834797/)).
  Ein e1RM aus 15er-Sätzen unterschätzt also den Muskelfortschritt, und ein Wechsel des Wdh.-Bereichs
  verschiebt das e1RM, ohne dass sich am Muskel etwas ändert.
- **Kreuz-Effekt** [A]: Training eines Arms steigert die Kraft des untrainierten Arms um etwa **8 %** der
  Ausgangskraft (rund die Hälfte des Zuwachses der trainierten Seite) – ohne Muskelwachstum dort, also rein
  nerval ([Carroll et al. 2006](https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Contralateral-effects-of-unilateral-strength-training/991012820438702368)).
- **Muskelwachstum in Zahlen** [A]: In Kurzzeitstudien (meist Untrainierte) wächst der Muskelquerschnitt um
  etwa **0,15–0,26 % pro Tag** am Ellenbeuger (je nach Volumen; ≈ 1–2 % pro Woche)
  ([Wernbom et al. 2007](https://doi.org/10.2165/00007256-200737030-00004)). Über den ganzen Körper waren es im Mittel
  **+1,5 kg Muskelmasse** pro Studie ([Benito et al. 2020](https://doi.org/10.3390/ijerph17041285)). Bei
  Trainierten deutlich weniger.

### Wann ist Kraftzuwachs vermutlich nur Technik oder Nerven? (Ableitung für die App)

| Signal in den Daten | Warum | Beleg |
| --- | --- | --- |
| Übung ist **neu** (erste ~4 Sessions bzw. ~3–4 Wochen) | Lerneffekt, neurale Anpassung | Moritani & deVries 1979, Mattocks 2017 |
| Erste Sessions **nach einem Form-Fix** | neue Technik, neuer Startwert | Trainio-Logik, Lerneffekt |
| **Sprung > 5–10 %** innerhalb von 1–2 Wochen | schneller als jedes plausible Muskelwachstum | Wernbom 2007 (Größenordnung) |
| **Wechsel des Wdh.-Bereichs** (z. B. 12 → 5 Wdh.) | Formeln und Last-Spezifität verzerren das e1RM | Schoenfeld 2017, Reynolds 2006 |
| Kraft steigt, aber der Muskel bekommt **kaum Sätze** | Fortschritt ohne Wachstumsreiz | Pelland 2025, Mattocks 2017 |
| Nur **eine** Übung einer Muskelgruppe steigt, die übrigen nicht | eher Übungsgeschick als Muskel | Spezifität (s. o.) |

**Folge für den Score:** Ein Kraft-Trend allein ist kein Muskelmaß. Plausibler wird die Schätzung erst, wenn
Kraft-Trend **und** Trainingsreiz (Sätze nahe am Versagen) **und** ein zur Phase passender Gewichtstrend
zusammenkommen. Auch dann bleibt es eine Schätzung.

---

## 4. Gewichtsveränderung in Bulk und Cut; was Kraft-Erhalt im Cut aussagt

### Cut

- **0,5–1 % des Körpergewichts pro Woche**, um Muskeln bestmöglich zu erhalten [A]
  ([Helms, Aragon & Fitschen 2014](https://doi.org/10.1186/1550-2783-11-20)).
- **Langsamer ist besser** [B]: Spitzensportler mit **0,7 %/Woche** gewannen im Defizit **+2,1 %** fettfreie
  Masse und mehr Oberkörperkraft (+12 % vs. +6 %), bei **1,4 %/Woche** blieb die fettfreie Masse gleich
  (−0,2 %) ([Garthe et al. 2011](https://doi.org/10.1123/ijsnem.21.2.97)). Nach 12 Monaten war der Unterschied
  allerdings verschwunden.
- **Für schon schlanke Athleten ≤ 0,5 %/Woche** [A]
  ([Roberts, Helms, Trexler & Fitschen 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7052702/)).

### Bulk

- **+0,25 bis +0,5 % des Körpergewichts pro Woche**, Überschuss **10–20 %** über dem Bedarf; Erfahrene eher am
  unteren Ende [A] ([Iraki et al. 2019](https://doi.org/10.3390/sports7070154)).
- **Schneller bringt vor allem Fett** [B]: Trainierte mit **5 % vs. 15 %** Überschuss (8 Wochen): Die
  Gewichtszunahme sagte stark die Hautfaltenzunahme (Fett) voraus, kaum die Muskeldicke; Kniebeuge und
  Muskeldicke unterschieden sich nicht, nur das Bankdrücken stieg in der 15-%-Gruppe stärker. Kleine Gruppe
  (17 Personen) ([Helms et al. 2023](https://doi.org/10.1186/s40798-023-00651-y)).
- **Muskelzuwachs-Potenzial** [C]: Die verbreitete Faustregel nach Aragon nennt etwa **1–1,5 %** (Einsteiger),
  **0,5–1 %** (Fortgeschrittene) und **0,25–0,5 %** (Erfahrene) des Körpergewichts **pro Monat** als möglichen
  Muskelzuwachs bei Männern, bei Frauen etwa die Hälfte. Nicht peer-reviewed, nur zur Plausibilität.

### Erhalt

- Keine Studie definiert eine „Erhalt“-Spanne. Trainios Vorgabe **±0,2 kg pro Woche** entspricht bei 80 kg
  **±0,25 %** und liegt damit im Bereich der täglichen Schwankung (Punkt 5) – sinnvoll als „stabil“.

### Abgleich mit Trainios Vorgaben (`RATE_DEFAULTS`)

| Phase | Trainio heute (kg/Woche) | bei 80 kg in % | Literatur (% pro Woche) | Einordnung |
| --- | --- | --- | --- | --- |
| Bulk | 0 bis +0,2 | 0 bis +0,25 % | +0,25 bis +0,5 % | vorsichtig, passt für Erfahrene |
| Cut | −0,5 bis −0,25 | −0,6 bis −0,3 % | −1 bis −0,5 % (schlank: ≤ 0,5 %) | vorsichtig, muskelschonend |
| Erhalt | ±0,2 | ±0,25 % | – | plausibel |

Für den Score wären **Prozent des Körpergewichts** robuster als feste kg, weil sie für leichte und schwere
Menschen gleich gelten. Hat eine Phase eine eigene Spanne (`rateMin`/`rateMax`), sollte diese Vorrang haben.

### Was Kraft-Erhalt im Cut über Muskel-Erhalt aussagt

- **Kraft ist im Defizit robuster als Muskelmasse** [A]: Im Defizit fiel der Zuwachs an fettfreier Masse
  deutlich geringer aus als bei ausgeglichener Energiebilanz (Effektstärke **−0,57**, signifikant), der
  **Kraftzuwachs nicht** (−0,31, nicht signifikant). Ab etwa **500 kcal Defizit pro Tag** gab es im Modell
  keinen Muskelzuwachs mehr. Fast nur Einsteiger, daher für Trainierte unsicher
  ([Murphy & Koehler 2022](https://doi.org/10.1111/sms.14075)).
- **Kraft verschwindet langsam** [B]: Selbst bei kompletter Pause blieb Kraft über Monate weitgehend erhalten
  (Bickel 2011, s. o.).
- **Zu schnelles Abnehmen kostet Kraft und Muskel** [B]: Garthe 2011 (s. o.).
- **Glykogen und Wasser** [B]: Jedes Gramm Glykogen bindet etwa **3–4 g Wasser**; in den ersten Tagen eines
  Defizits (oder Kohlenhydrat-Aufbaus) ändert sich das Gewicht deshalb um 1–2 kg, ohne dass Fett oder Muskel
  dahinterstehen ([Kreitzman et al. 1992](https://scholar.google.com/scholar?q=Kreitzman+1992+Glycogen+storage+illusions+of+easy+weight+loss), Wert über Sekundärquellen).

**Folge für den Score:** Im Cut gilt **„Kraft gehalten“ als notwendig, aber nicht hinreichend**. Ein Score kann
gehaltene Kraft gut bewerten, darf sie aber nicht als „Muskeln sicher erhalten“ formulieren. Ein **Kraftverlust**
über das Rauschen hinaus (z. B. > 3 % in 4–8 Wochen) und ein **zu schneller Gewichtsverlust** (> 1 %/Woche) sind
die beiden Warnzeichen, die sich aus den Eingaben ablesen lassen.

---

## 5. Wie lang muss der Rückblick sein?

### Wie stark die Daten rauschen

- **Körpergewicht** [B]: Bei gesunden Erwachsenen schwankt das Gewicht von Tag zu Tag mit einer
  Standardabweichung von etwa **0,5 %** (über 7 Tage ~0,7 %), also ≈ **0,4 kg bei 80 kg**; die Waage selbst
  trägt nur ~0,1 kg bei ([Day-to-day variability in euvolemic body mass, Renal Failure 2023](https://doi.org/10.1080/0886022X.2023.2273421)).
  Dazu kommt ein **Wochenrhythmus**: schwerer am Sonntag/Montag, leichter bis Freitag
  ([Orsama et al. 2014](https://pubmed.ncbi.nlm.nih.gov/24504358/)), dazu Glykogen-/Salz-Sprünge und bei Frauen der Zyklus.
- **Kraft** [A]: Ein echter 1RM-Test schwankt zwischen zwei Terminen im Median um **4,2 %** (Spanne 0,5–12,1 %),
  bei Trainierten eher weniger ([Grgic et al. 2020](https://doi.org/10.1186/s40798-020-00260-z)). Beim
  geschätzten 1RM kommen hinzu:
  - **Wdh. in Reserve** werden im Mittel um **~1 Wdh. falsch eingeschätzt** (≈ 3 % e1RM), genauer nahe am
    Versagen ([Halperin et al. 2022](https://pubmed.ncbi.nlm.nih.gov/34542869/)).
  - **Formeln** sind bis etwa **10 Wdh.** brauchbar, darüber deutlich ungenauer
    ([Reynolds et al. 2006](https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf),
    [LeSuer et al. 1997](https://scholar.google.com/scholar?q=LeSuer+1997+accuracy+of+prediction+equations+for+estimating+1-RM+performance));
    das Verhältnis Wdh. ↔ %1RM unterscheidet sich je Übung (Beinpresse ≠ Bankdrücken), kaum nach Geschlecht,
    Alter oder Trainingsstand ([Nuzzo et al. 2024](https://doi.org/10.1007/s40279-023-01937-7)).
  - **Annahme für die Rechnung unten:** e1RM des besten Satzes schwankt von Session zu Session um **σ = 2–4 %**.

### Modellrechnung [R]

Kleines Python-Skript (nicht im Repo): Standardfehler einer Regressionsgeraden `σ / √Σ(t − t̄)²` bzw. eines
Mittelwert-Vergleichs `σ · √(2/n)`, Teil c) als Simulation mit 20.000 Durchläufen. Annahmen: zufälliges,
unabhängiges Rauschen, gleichmäßig verteilte Messungen.
Echte Daten sind zusätzlich zeitlich korreliert (Wasser bleibt ein paar Tage), die Werte sind also eher zu
optimistisch.

**a) Körpergewicht – Genauigkeit der Trendsteigung (Standardfehler, σ = 0,4–0,5 kg):**

| Rückblick | täglich wiegen | 3× pro Woche | 1× pro Woche |
| --- | --- | --- | --- |
| 2 Wochen | ±0,17–0,22 kg/Wo | – | – |
| 4 Wochen | ±0,06–0,08 kg/Wo | ±0,09–0,12 kg/Wo | ±0,13–0,17 kg/Wo |
| 6 Wochen | ±0,035–0,045 kg/Wo | ±0,05–0,06 kg/Wo | – |
| 8 Wochen | ±0,02–0,03 kg/Wo | ±0,035–0,04 kg/Wo | ±0,055–0,07 kg/Wo |

Ein Bulk-Ziel von +0,2 bis +0,4 kg/Woche (80 kg) sicher von „stabil“ zu trennen, braucht etwa ±0,05–0,1 kg/Wo:
**≥ 4 Wochen bei täglichem Wiegen oder ≥ 6 Wochen bei 3× pro Woche.** Ein Cut (−0,4 bis −0,8 kg/Wo) ist
schon nach 3–4 Wochen klar erkennbar.

**b) Kraft – Vergleich „Mittel der letzten k Wochen“ gegen „k Wochen davor“ (2 Sessions je Übung und Woche):**

| Block | Standardfehler je Übung (σ 2–4 %) | gemittelt über 6 Übungen | Erwartetes Signal bei 1 %/Monat |
| --- | --- | --- | --- |
| 3 vs. 3 Wochen | ±1,2–2,3 % | ±0,5–0,9 % | 0,7 % |
| 4 vs. 4 Wochen | ±1,0–2,0 % | ±0,4–0,8 % | 0,9 % |
| 6 vs. 6 Wochen | ±0,8–1,6 % | ±0,3–0,7 % | 1,4 % |

Bei nur 1 Session je Übung und Woche wird der Fehler um den Faktor ~1,4 größer. **Folge:** Für eine
einzelne Übung ist ein Monat zu kurz; erst **gemittelt über mehrere Übungen und über ≥ 8 Wochen**
(4 vs. 4) hebt sich ein Zuwachs von ~1 %/Monat knapp aus dem Rauschen, mit 12 Wochen (6 vs. 6) deutlich.

**c) Scheinzuwachs durch „bestes e1RM bis heute“:** Wird – wie in `strengthGains` – das laufende Maximum durch
die erste Session geteilt, steigt der Wert auch **ganz ohne echten Fortschritt**:

| Sessions im Zeitraum | σ = 2 % | σ = 3 % | σ = 4 % |
| --- | --- | --- | --- |
| 4 | +2,1 % | +3,2 % | +4,2 % |
| 8 | +2,9 % | +4,3 % | +5,9 % |
| 16 | +3,6 % | +5,4 % | +7,3 % |

Für die Anzeige „bester Wert“ ist das in Ordnung, **für einen Entwicklungs-Score nicht**: Er würde bei
Stillstand „Zuwachs“ melden und bei mehr Workouts automatisch steigen. Besser sind Mittelwerte/Mediane je
Woche oder eine robuste Trendgerade.

### Weitere Gründe für die Länge

- **Mesozyklen** dauern in der Praxis 4–6 Wochen plus Deload [C]. Ein kürzerer Rückblick sieht den Deload als
  „Rückschritt“; ein Rückblick ab 8 Wochen enthält mindestens einen ganzen Zyklus.
- **Pausen** [B]: 3 Wochen Trainingspause zwischen 6-Wochen-Blöcken schadeten dem Muskel- und Kraftzuwachs nach
  24 Wochen nicht ([Ogasawara et al. 2013](https://doi.org/10.1007/s00421-012-2511-9)). Krafteinbußen durch
  Trainingsstopp wachsen mit der Dauer und sind bei jungen Trainierten anfangs klein
  ([Bosquet et al. 2013](https://doi.org/10.1111/sms.12047); die oft genannten „~3–4 Wochen ohne
  nennenswerten Verlust“ stammen aus Sekundärquellen).
- **Reaktionszeit:** Ein Cut dauert oft nur 8–16 Wochen. Ein 12-Wochen-Rückblick würde dort zu träge reagieren.

**Ergebnis:** **Mindestens 6, besser 8 Wochen.** 12 Wochen sind robuster, reagieren aber spät.

---

## 6. Wie bestehende Apps und Rechner bewerten (nur Vergleich)

| App / Rechner | Was bewertet wird | Entwicklung oder Niveau? | Phase? | Quelle |
| --- | --- | --- | --- | --- |
| **Fitbod** – Strength Score | „mStrength“ je Muskel aus geschätzten 1RM aller Übungen, Gesamt = Mittel über Muskeln; erst wenn Push, Pull und Beine Daten haben | **Niveau** (als Verlauf ansehbar) | nein | [Fitbod Hilfe](https://help.fitbod.me/hc/en-us/sections/1500000536822-Progress-Performance-Tracking) |
| Fitbod – 1RM-Formel | eigene, gewichtsabhängige Epley-Variante, aus 303.494 Sätzen nahe am Versagen; 17–22 % konsistenter als klassische Formeln (Preprint) | – | – | [Marzagão 2026, arXiv](https://arxiv.org/abs/2603.17495) |
| **Hevy** – Strength Level | Perzentil gegenüber anderen Nutzern gleichen Geschlechts, Alters und Gewichts (Beginner … Elite) für einige Übungen; dazu Sätze pro Muskelgruppe als Diagramm | **Niveau** bzw. Volumen | nein | [Hevy Hilfe](https://help.hevyapp.com/hc/en-us/articles/38001696749335-Strength-Level-Feature-How-Hevy-Compares-Your-Strength-by-Exercise), [Hevy Sätze/Muskel](https://www.hevyapp.com/features/sets-per-muscle-group-per-week/) |
| **Strength Level** | Kraft-Standards aus Millionen eingetragener Lifts, nach Körpergewicht, Geschlecht und Alter | **Niveau** (laut Anforderungen ausgeschlossen) | nein | [strengthlevel.com](https://strengthlevel.com/strength-standards/biceps-curl) |
| **Whoop** – Strength Trainer | „Muscular Load“ aus Volumen (Sätze × Wdh. × Gewicht bzw. bewegte Masse) und Intensität (Tempo, Nähe zum Versagen), fließt in Strain | **Belastung**, nicht Entwicklung | nein | [Whoop: Muscular Load](https://www.whoop.com/ca/en/thelocker/how-whoop-measures-muscular-load/) |
| **RP Hypertrophy** | steuert Sätze je Muskel von MEV Richtung MRV anhand von Pump-, Muskelkater- und Leistungs-Rückmeldung | **Steuerung** des Volumens | indirekt | [RP Hilfe](https://help.rpstrength.com/hc/en-us/articles/34825395726743-Muscle-Emphasis-Breakdown) |
| **MacroFactor** – Trendgewicht | gewichteter gleitender Mittelwert (neue Werte zählen mehr); empfiehlt täglich, mind. 3× pro Woche zu wiegen | Gewichts**trend** | Ziel-Tempo ja | [MacroFactor Hilfe](https://help.macrofactorapp.com/en/articles/278-weight-trend) |
| **The Hacker’s Diet** (Herkunft des Trendgewichts) | exponentiell geglätteter Mittelwert mit 10 % Glättung (≈ 20-Tage-Mittel) | Gewichts**trend** | – | [fourmilab.ch](https://fourmilab.ch/hackdiet/www/subsubsection1_4_1_0_8_3.html) |

**Was sich daraus lernen lässt:**

- Keine der Apps verbindet Kraft-Trend, Trainingsreiz und Gewicht zu **einer phasenabhängigen Entwicklungs-Zahl**.
  Trainio würde hier etwas Eigenes bauen – ohne Vorbild, an dem sich die Gewichtung ablesen ließe.
- Fitbod ordnet die Muskeln in **Push / Pull / Beine** und gibt den Gesamtwert erst frei, wenn alle Gruppen
  Daten haben. Das ist ein brauchbares Vorbild für „Mindestdaten“ und eine grobe Aufschlüsselung.
- Fitbod nennt seine Werte ausdrücklich **Trend-Anzeiger, keine Labormessung** – passt zu Davids „lieber klar
  und ehrlich als scheingenau“.
- Trendgewicht (geglättet) ist Standard; MacroFactor stützt Ziel-Tempo auf den **Trend, nicht den Tageswert**.

---

## Was das für die Formel heißt

> **Alles Folgende sind Vorschläge.** Die Entscheidung fällt im Ticket
> [„Trainio-Score: die Formel“](../tickets/09-score-formel.md).

### Bestandteile und Gewichtung (Vorschlag)

| Teil | Gewicht | Was gemessen wird | Warum |
| --- | --- | --- | --- |
| **Kraft-Trend** | **50** | robuste e1RM-Veränderung je Übung, gemittelt je Muskelgruppe, im Vergleich zur Erwartung der Phase | einziges direktes Entwicklungs-Signal in den Daten (Punkt 1, 3) |
| **Trainingsreiz** | **30** | gewichtete Arbeitssätze pro Muskelgruppe und Woche (Hauptmuskel 1, Hilfsmuskel 0,5), als abflachende Kurve | stärkster belegter Treiber für Muskelwachstum (Punkt 2) und Gegengewicht zu „Kraft nur Technik“ (Punkt 3) |
| **Gewichtstrend** | **20** | Steigung des Körpergewichts in % pro Woche, verglichen mit der Spanne der Phase | zeigt, ob die Phase „funktioniert“ (Punkt 4) |

- Fehlt ein Teil (z. B. kein Gewicht eingetragen), fällt er weg und die übrigen werden auf 100 hochgerechnet –
  wie beim Workout-Score (`scaled`).
- Denkbar ist, im **Cut** den Gewichtsteil höher zu gewichten (z. B. 50/20/30), weil dort das Tempo über den
  Muskelerhalt mitentscheidet (Garthe 2011). Einfacher bleibt: feste Gewichte, nur die Zielspannen ändern sich je Phase.

### Kraft-Trend sauber messen (Vorschlag)

- **e1RM je Satz** mit der eingestellten Formel; nur Sätze mit **Wdh. (+ Wdh. in Reserve) ≤ 12**, keine
  Aufwärm- und Form-Fix-Sätze (wie bisher).
- **RPE nutzen, wenn vorhanden:** Wdh. in Reserve = 10 − RPE, in die Formel als `r + RIR` einsetzen
  (RIR-basierte RPE-Skala: [Helms et al. 2016](https://doi.org/10.1519/SSC.0000000000000218)). Sätze mit
  **RPE ≤ 5** auslassen – die Schätzung ist dort zu ungenau (Halperin 2022).
- **Je Übung und Woche ein Wert** (bestes e1RM der Woche), dann **Mittel/Median der letzten 4 Wochen gegen die
  4 Wochen davor** oder eine **robuste Trendgerade** (z. B. Theil–Sen auf dem Logarithmus) über 8 Wochen.
  **Kein laufendes Maximum** (Punkt 5c).
- **Neue Übungen** erst ab der ~5. Session werten, **nach Form-Fix** neu starten (`sinceFix`) und ebenfalls
  die ersten Sessions auslassen (Lerneffekt, Punkt 3).
- Pro Muskelgruppe zählen nur Übungen, bei denen sie **Hauptmuskel** ist; Hilfsmuskeln nur im Trainingsreiz.

### Erwartete Kraftrate (Bezugspunkt für „gut“)

- Erwartung nach Trainingsalter (Punkt 1): **< 1 Jahr 3 %/Monat, 1–3 Jahre 1 %/Monat, 3+ Jahre 0,5 %/Monat**
  als Mittelwerte der Spannen. Das Trainingsalter könnte aus dem ersten Workout in Trainio kommen (Import
  beachten) oder aus einer Einstellung in der Feinanpassung.
- Alternative ohne Trainingsalter: Erwartung = eigene Rate der letzten 6–12 Monate. Nachteil: Der Maßstab
  sinkt mit, wer stagniert, wird nicht mehr „schlechter“ bewertet.

### Phasen-Regeln (Vorschlag für die Anker)

`r` = erwartete e1RM-Rate aus dem Trainingsalter; Kraftwerte in % pro Monat, Gewicht in % Körpergewicht pro Woche.

| Phase | Kraft: 100 / 50 / 0 | Trainingsreiz: voll ab | Gewicht: „gut“ |
| --- | --- | --- | --- |
| **Bulk** | ≥ r / ±0 (Stillstand) / ≤ −r | ~12–15 Sätze je Muskel/Woche | +0,1 bis +0,5 %/Wo; > 0,5 % leichter Abzug („eher Fett“), < 0 deutlicher Abzug |
| **Cut** | ≥ 0 (gehalten) / −3 % / ≤ −6 % | ~6–8 Sätze (Erhalt braucht wenig, Bickel 2011) | −0,25 bis −1,0 %/Wo; schneller als −1 % Abzug („Muskeln in Gefahr“), kaum Abnahme halbe Punkte |
| **Erhalt** | ≥ r/2 / −2 % / ≤ −5 % | ~10 Sätze | −0,25 bis +0,25 %/Wo |
| **ohne Phase** | wie Erhalt | wie Erhalt | wie Erhalt |
| **Sonstiges** | wie Erhalt | wie Erhalt | nur mit eigener Spanne der Phase, sonst Gewichtsteil weglassen |

- Hat eine Phase eine **eigene Gewichtsspanne** (`rateMin`/`rateMax`), gilt diese statt der Tabelle.
- Zwischen den Ankern linear, an den Rändern begrenzen (0–100).
- **Unsicherheit ehrlich zeigen:** Bei wenigen Daten den Wert zur Mitte ziehen, z. B.
  `Score = 50 + (Rohwert − 50) · n / (n + k)` mit `n` = Zahl der Wochenwerte, und im Klartext „noch unsicher“.

### Fensterlänge (Vorschlag)

- **Fester Rückblick: 8 Wochen**, als Vergleich „letzte 4 Wochen gegenüber den 4 Wochen davor“ (passt zur
  Anforderung „die letzten Wochen gegenüber den Wochen davor“).
  - Begründung: enthält mindestens einen Mesozyklus mit Deload; hebt ~1 %/Monat Kraftzuwachs über mehrere
    Übungen knapp aus dem Rauschen; Gewichtstrend auf ~±0,05 kg/Woche genau bei 3× Wiegen pro Woche;
    reagiert noch schnell genug für einen Cut (Punkt 5).
- **Aufschlüsselung pro Muskelgruppe** hat weniger Daten je Gruppe → entweder 12 Wochen oder dieselben 8 Wochen
  mit stärkerem Ziehen zur Mitte.
- **Verlauf als Diagramm:** den 8-Wochen-Score wöchentlich neu berechnen.
- **Phasenwechsel im Fenster:** nur Daten seit Phasenbeginn verwenden; die **ersten 1–2 Wochen** nach einem Wechsel
  Bulk ↔ Cut beim Gewicht ausblenden (Glykogen und Wasser, Punkt 4). Ist die Phase jünger als ~3 Wochen:
  Klartext „Phase läuft erst kurz“.

### Mindestdaten (Vorschlag)

- **Score insgesamt:** ≥ 6 Kraft-Workouts in den letzten 8 Wochen, verteilt auf ≥ 4 Wochen, und ≥ 2 Übungen mit
  je ≥ 2 Wochenwerten **in beiden Hälften**. Davor: „Noch zu wenig Daten“ mit Fortschritt („noch 3 Workouts“).
- **Kraft-Trend je Muskelgruppe:** ≥ 1 Übung als Hauptmuskel mit ≥ 4 Sessions; sonst nur Trainingsreiz zeigen
  („Reiz ja, Trend noch offen“).
- **Gewichtsteil:** ≥ 6 Messungen über ≥ 21 Tage, sonst weglassen (Hinweis: „mind. 3× pro Woche wiegen“).

### Muskelgruppen der Aufschlüsselung

- Die 36 `REGIONS` sind für Kraft-Trends zu fein: Eine Region hat selten eine eigene Hauptübung. Sinnvoll sind
  die 16 `MUSCLES` oder gröber (z. B. Brust, Rücken, Schultern, Arme, Beine vorne, Beine hinten/Gesäß, Rumpf).
- Für den Gesamtwert alle Hauptgruppen gleich gewichten: Eine nicht trainierte Gruppe zieht dann über den
  Trainingsreiz nach unten – so entsteht „Beine hängen hinterher“.

### Pausen, Cardio, Aufwärmen, Form-Fix

- **Pausen bis ~2–3 Wochen** (Urlaub, Krankheit) nicht bestrafen: Wochen ohne Training aus dem Fenster nehmen
  und das Fenster entsprechend nach hinten verlängern; Kraft geht in dieser Zeit kaum verloren (Ogasawara 2013,
  Bickel 2011). Bei längeren Pausen Klartext „Pause – Score ruht“.
- **Cardio, Aufwärmsätze, Form-Fix-Sätze:** zählen nicht für Kraft-Trend (wie bisher); Form-Fix-Sätze im
  Trainingsreiz mitzählen ist vertretbar, da sie ein Reiz sind.

### Klartext (Bausteine, Beispiele)

- Kraft: „Kraft steigt“ / „Kraft gehalten“ / „Kraft sinkt leicht“ / „Kraft sinkt deutlich“
- Reiz: „guter Aufbau-Reiz“ / „Reiz reicht zum Halten“ / „wenig Reiz für Beine“
- Gewicht je Phase: „Zunahme im Plan“ / „Zunahme zu schnell – eher Fett“ / „Abnahme zu schnell – Muskeln in
  Gefahr“ / „Gewicht stabil“
- Ehrlichkeit: „Schätzung aus Training und Gewicht“, „noch unsicher – wenige Daten“

---

## Quellen

**Kraftzuwachs und Trainingserfahrung**

- [A] American College of Sports Medicine (2009): Progression models in resistance training for healthy adults. *Med Sci Sports Exerc* 41(3):687–708. https://pubmed.ncbi.nlm.nih.gov/19204579/
- [A] Kraemer WJ, Ratamess NA (2004): Fundamentals of resistance training: progression and exercise prescription. *Med Sci Sports Exerc* 36(4):674–688. https://journals.lww.com/acsm-msse/fulltext/2004/04000/fundamentals_of_resistance_training__progression.17.aspx
- [B] Steele J, Fisher J, et al. (2023): Long-term time-course of strength adaptation to minimal dose resistance training through retrospective longitudinal growth modeling. *Res Q Exerc Sport* 94(4):913–930. https://doi.org/10.1080/02701367.2022.2070592 · Preprint: https://sportrxiv.org/index.php/server/preprint/view/69
- [B] Latella C, et al. (2020): Long-term strength adaptation: a 15-year analysis of powerlifting athletes. *J Strength Cond Res* 34(9):2412–2418. https://doi.org/10.1519/JSC.0000000000003657
- [B] Häkkinen K, et al. (1988): Neuromuscular and hormonal adaptations in athletes to strength training in two years. *J Appl Physiol* 65(6):2406–2412. https://doi.org/10.1152/jappl.1988.65.6.2406
- [B] Ahtiainen JP, et al. (2016): Heterogeneity in resistance training-induced muscle strength and mass responses in men and women of different ages. *Age* 38:10. https://doi.org/10.1007/s11357-015-9870-1

**Volumen und Muskelwachstum**

- [A] Schoenfeld BJ, Ogborn D, Krieger JW (2017): Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci* 35(11):1073–1082. https://doi.org/10.1080/02640414.2016.1210197
- [B] Schoenfeld BJ, et al. (2019): Resistance training volume enhances muscle hypertrophy but not strength in trained men. *Med Sci Sports Exerc* 51(1):94–103. https://pubmed.ncbi.nlm.nih.gov/30153194/
- [A] Baz-Valle E, et al. (2022): A systematic review of the effects of different resistance training volumes on muscle hypertrophy. *J Hum Kinet* 81:199–210. https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/
- [A] Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC (2025): The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains. *Sports Med*. https://doi.org/10.1007/s40279-025-02344-w · Preprint: https://sportrxiv.org/index.php/server/preprint/view/460
- [A] Robinson ZP, et al. (2024): Exploring the dose–response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy. *Sports Med* 54:2209–2231. https://doi.org/10.1007/s40279-024-02069-2
- [B] Bickel CS, Cross JM, Bamman MM (2011): Exercise dosing to retain resistance training adaptations in young and older adults. *Med Sci Sports Exerc* 43(7):1177–1187. https://pubmed.ncbi.nlm.nih.gov/21131862/
- [A] Wernbom M, Augustsson J, Thomeé R (2007): The influence of frequency, intensity, volume and mode of strength training on whole muscle cross-sectional area in humans. *Sports Med* 37(3):225–264. https://doi.org/10.2165/00007256-200737030-00004
- [A] Benito PJ, et al. (2020): A systematic review with meta-analysis of the effect of resistance training on whole-body muscle growth in healthy adult males. *Int J Environ Res Public Health* 17(4):1285. https://doi.org/10.3390/ijerph17041285
- [C] Renaissance Periodization / Israetel M: Training Volume Landmarks for Muscle Growth. https://rpstrength.com/training-volume-landmarks-muscle-growth/

**Kraft vs. Muskel**

- [B] Hubal MJ, et al. (2005): Variability in muscle size and strength gain after unilateral resistance training. *Med Sci Sports Exerc* 37(6):964–972. https://gwern.net/doc/exercise/2005-hubal.pdf
- [A] Buckner SL, et al. (2016): The problem of muscle hypertrophy: revisited. *Muscle Nerve* 54(6):1012–1014. https://cir.nii.ac.jp/crid/1360861294193062784
- [A] Loenneke JP, Buckner SL, Dankel SJ, Abe T (2019): Exercise-induced changes in muscle size do not contribute to exercise-induced changes in muscular strength. *Sports Med* 49(7):987–991. https://doi.org/10.1007/s40279-019-01106-9
- [A] Taber CB, Vigotsky A, Nuckols G, Haun CT (2019): Exercise-induced myofibrillar hypertrophy is a contributory cause of gains in muscle strength. *Sports Med* 49(7):993–997. https://link.springer.com/doi/10.1007/s40279-019-01107-8
- [B] Moritani T, deVries HA (1979): Neural factors versus hypertrophy in the time course of muscle strength gain. *Am J Phys Med* 58(3):115–130. https://pubmed.ncbi.nlm.nih.gov/453338/
- [B] Seynnes OR, de Boer M, Narici MV (2007): Early skeletal muscle hypertrophy and architectural changes in response to high-intensity resistance training. *J Appl Physiol* 102(1):368–373. https://pubmed.ncbi.nlm.nih.gov/17053104/
- [B] Damas F, et al. (2016): Early resistance training-induced increases in muscle cross-sectional area are concomitant with edema-induced muscle swelling. *Eur J Appl Physiol* 116(1):49–56. https://link.springer.com/doi/10.1007/s00421-015-3243-4
- [B] Mattocks KT, et al. (2017): Practicing the test produces strength equivalent to higher volume training. *Med Sci Sports Exerc* 49(9):1945–1954. https://pubmed.ncbi.nlm.nih.gov/28463902/
- [A] Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017): Strength and hypertrophy adaptations between low- vs. high-load resistance training. *J Strength Cond Res* 31(12):3508–3523. https://pubmed.ncbi.nlm.nih.gov/28834797/
- [A] Carroll TJ, et al. (2006): Contralateral effects of unilateral strength training: evidence and possible mechanisms. *J Appl Physiol* 101(5):1514–1522. https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Contralateral-effects-of-unilateral-strength-training/991012820438702368

**Gewicht in Bulk und Cut**

- [A] Helms ER, Aragon AA, Fitschen PJ (2014): Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. *J Int Soc Sports Nutr* 11:20. https://doi.org/10.1186/1550-2783-11-20
- [B] Garthe I, et al. (2011): Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. *Int J Sport Nutr Exerc Metab* 21(2):97–104. https://doi.org/10.1123/ijsnem.21.2.97
- [A] Roberts BM, Helms ER, Trexler ET, Fitschen PJ (2020): Nutritional recommendations for physique athletes. *J Hum Kinet* 71:79–108. https://pmc.ncbi.nlm.nih.gov/articles/PMC7052702/
- [A] Iraki J, Fitschen P, Espinar S, Helms E (2019): Nutrition recommendations for bodybuilders in the off-season: a narrative review. *Sports* 7(7):154. https://doi.org/10.3390/sports7070154
- [B] Helms ER, et al. (2023): Effect of small and large energy surpluses on strength, muscle, and skinfold thickness in resistance-trained individuals. *Sports Med Open* 9:102. https://doi.org/10.1186/s40798-023-00651-y
- [A] Murphy C, Koehler K (2022): Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. *Scand J Med Sci Sports* 32(1):125–137. https://doi.org/10.1111/sms.14075
- [B] Kreitzman SN, Coxon AY, Szaz KF (1992): Glycogen storage: illusions of easy weight loss, excessive weight regain, and distortions in estimates of body composition. *Am J Clin Nutr* 56(1 Suppl):292S–293S. https://scholar.google.com/scholar?q=Kreitzman+1992+Glycogen+storage+illusions+of+easy+weight+loss

**Rauschen, Messgenauigkeit, Pausen**

- [B] Day-to-day variability in euvolemic body mass (2023). *Renal Failure*. https://doi.org/10.1080/0886022X.2023.2273421
- [B] Orsama AL, et al. (2014): Weight rhythms: weight increases during weekends and decreases during weekdays. *Obes Facts* 7(1):36–47. https://pubmed.ncbi.nlm.nih.gov/24504358/
- [A] Grgic J, Lazinica B, Schoenfeld BJ, Pedisic Z (2020): Test–retest reliability of the one-repetition maximum (1RM) strength assessment: a systematic review. *Sports Med Open* 6:31. https://doi.org/10.1186/s40798-020-00260-z
- [A] Halperin I, et al. (2022): Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. *Sports Med* 52(2):377–390. https://pubmed.ncbi.nlm.nih.gov/34542869/
- [B] Reynolds JM, Gordon TJ, Robergs RA (2006): Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry. *J Strength Cond Res* 20(3):584–592. https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf
- [B] LeSuer DA, et al. (1997): The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift. *J Strength Cond Res* 11(4):211–213. https://scholar.google.com/scholar?q=LeSuer+1997+accuracy+of+prediction+equations+for+estimating+1-RM+performance
- [A] Nuzzo JL, Pinto MD, Nosaka K, Steele J (2024): Maximal number of repetitions at percentages of the one repetition maximum. *Sports Med* 54(2):303–321. https://doi.org/10.1007/s40279-023-01937-7
- [C] Helms ER, et al. (2016): Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. *Strength Cond J* 38(4):42–49. https://doi.org/10.1519/SSC.0000000000000218
- [B] Ogasawara R, et al. (2013): Comparison of muscle hypertrophy following 6-month of continuous and periodic strength training. *Eur J Appl Physiol* 113(4):975–985. https://doi.org/10.1007/s00421-012-2511-9
- [A] Bosquet L, et al. (2013): Effect of training cessation on muscular performance: a meta-analysis. *Scand J Med Sci Sports* 23(3):e140–e149. https://doi.org/10.1111/sms.12047

**Apps (nur Vergleich)**

- Fitbod Hilfe: Progress & Performance Tracking (Strength Score). https://help.fitbod.me/hc/en-us/sections/1500000536822-Progress-Performance-Tracking
- Marzagão T (2026): A weight-dependent 1RM prediction equation optimized on 303,494 near-failure sets across 388 exercises. arXiv:2603.17495 (Preprint). https://arxiv.org/abs/2603.17495
- Hevy Hilfe: Strength Level Feature. https://help.hevyapp.com/hc/en-us/articles/38001696749335-Strength-Level-Feature-How-Hevy-Compares-Your-Strength-by-Exercise · Sätze pro Muskelgruppe: https://www.hevyapp.com/features/sets-per-muscle-group-per-week/
- Strength Level: Strength Standards. https://strengthlevel.com/strength-standards/biceps-curl
- Whoop: How WHOOP measures muscular load. https://www.whoop.com/ca/en/thelocker/how-whoop-measures-muscular-load/
- RP Strength Hilfe: Muscle Emphasis Breakdown. https://help.rpstrength.com/hc/en-us/articles/34825395726743-Muscle-Emphasis-Breakdown
- MacroFactor Hilfe: Weight Trend. https://help.macrofactorapp.com/en/articles/278-weight-trend
- Walker J: The Hacker’s Diet – exponentially smoothed moving averages. https://fourmilab.ch/hackdiet/www/subsubsection1_4_1_0_8_3.html
