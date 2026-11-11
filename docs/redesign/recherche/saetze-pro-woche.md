# Recherche: Wie viele Sätze pro Muskel und Woche?

- **Frage:** Wie viele Arbeitssätze pro Muskel und Woche sind für Muskelaufbau (und Kraft) optimal, nach dem
  Forschungsstand 2026? Taugen die Linien MEV 10 / MAV 15 / MRV 20 in Fortschritt → Muskeln?
- **Stand:** 11.11.2026
- **Baut auf:** [trainio-score.md](trainio-score.md), Abschnitte 2 und 3. Was dort stand, wurde nachgeprüft (siehe
  „Abgleich mit der ersten Recherche“ am Ende).
- **Betrifft:** Diagramm „Sätze pro Muskelgruppe / Woche“, Karte „Vernachlässigte Muskelgruppen“, Region-Popup der
  Körperkarte (`js/progress.js`, `ProgressViews.muscles`) und den Teil „Trainingsreiz“ des Trainio-Scores
  ([ANFORDERUNGEN.md](../ANFORDERUNGEN.md), Abschnitt 6).

## Wie diese Recherche entstanden ist (bitte zuerst lesen)

- **Suche:** systematisch über die Europe-PMC-REST-API (Titel/Abstract, 2022–2026, nach Zitierungen und Datum
  sortiert), z. B. `(TITLE_ABS:"resistance training" …) AND (TITLE:"volume" OR TITLE:"sets" OR TITLE:"dose-response")
  AND (TITLE_ABS:hypertrophy …) AND PUB_YEAR:[2022 TO 2026]`, dazu gezielte Suchen zu Einzel- vs.
  Mehrgelenkübungen, Erhalt, Frequenz, Nähe zum Versagen, Erholung je Muskel und Preprints (SportRxiv, bioRxiv,
  medRxiv). Volltexte über PMC (Europe-PMC-Volltext-XML) und SportRxiv-PDFs.
- **Nicht erreichbar:** der Verlags-Volltext der veröffentlichten Pelland-Meta-Regression (Springer, Bezahlschranke)
  – gelesen wurde der inhaltsgleiche Preprint (Version 2, Sept. 2024); die OSF-Zusatzmaterialien (osf.io gesperrt);
  bioRxiv-Volltexte; die Seiten von Renaissance Periodization (rpstrength.com lässt sich in dieser Umgebung nicht
  aufrufen – die RP-Zahlen stammen aus Suchauszügen).
- **Kennzeichnung jeder Aussage:**
  **[Volltext]** im Volltext gelesen (bei Preprints: **[Volltext, Preprint]**) ·
  **[Abstract]** nur die Zusammenfassung gelesen ·
  **[Sekundärquelle]** Zahl stammt aus einer anderen Arbeit oder einem Suchauszug ·
  **[Einschätzung]** eigene Ableitung oder Bewertung.
- **Zählweise:** „Sätze“ meint harte Arbeitssätze (nahe am Muskelversagen, ohne Aufwärmsätze). „Fraktional“ heißt:
  direkte Sätze zählen 1, mithelfende 0,5 – genau so rechnet Trainio heute (`perWeek = direkt + mitgeholfen / 2`).
  Wo eine Studie anders gezählt hat, steht es dabei.
- Alle Zahlen sind **Gruppenmittel aus meist 6–12 Wochen langen Studien**. Für einen einzelnen Menschen über Jahre
  sind sie nur eine Orientierung.

## Kurzfassung für den Besitzer

1. **Mehr Sätze bringen im Mittel mehr Muskel, aber jeder weitere Satz bringt weniger.** Eine harte Obergrenze hat
   die Forschung nicht gefunden. Für **Kraft** flacht es viel früher ab: Ab etwa 3–4 Sätzen pro Woche und Übung
   kommt kaum noch etwas dazu.
2. **Messbares Wachstum beginnt im Mittel schon bei etwa 4 Sätzen pro Woche** (halb gezählte Hilfssätze inklusive).
   „10 = Minimum für Wachstum“ stimmt so nicht; 10 ist eher „gut“.
3. **Trainios Regel „Hilfsmuskel zählt halb“ ist die am besten gestützte einfache Regel** (Pelland u. a. 2026,
   67 Studien). Klimmzüge und Rudern zählen also wirklich für den Bizeps.
4. **Dein Bizeps:** 4 direkte Sätze plus z. B. 9 Sätze Klimmzüge/Rudern ergeben 4 + 4,5 = **8,5 Sätze**. Das liegt
   nach der Forschung im **wirksamen Bereich**, nicht „unter dem Minimum“. In einer Studie an Trainierten
   (Hermann u. a. 2025) wuchs der Bizeps in 8 Wochen um 2,7–4,5 % mit nur **2 Curl-Sätzen + 4 Sätzen Latzug/Rudern
   pro Woche**. Dass du Fortschritt siehst, passt genau dazu.
5. **Wären 15 Bizeps-Sätze besser?** Das Durchschnittsmodell sagt: etwas mehr Wachstum, aber mit kleinem Ertrag pro
   Satz. Studien, die gezielt den Bizeps Trainierter untersucht haben, fanden über etwa 18 Sätze keinen Zusatznutzen.
   **Erholbar** waren in Studien sogar 27–32 Sätze über 6–8 Wochen; nötig sind sie aber nicht.
6. **MEV 10 / MAV 15 / MRV 20 sind keine Forschungswerte**, sondern ein Coaching-Modell (Renaissance Periodization).
   RP selbst nennt für den Bizeps andere Zahlen (MEV 8–10, MRV 20–26) und sagt, dass Rückentraining den Bizeps
   schon gut wachsen lässt. Eine Warnlinie „MRV 20“ für jeden Muskel ist nicht belegt.
7. **Unterschiedliche Zahlen je Muskel sind nicht belastbar belegt.** Kleine Muskeln erholen sich nach normalem
   Training eher schneller, sind bei ungewohnter Belastung (viel Exzentrik) aber sogar anfälliger.
8. **Pro Einheit** bringt ein Muskel ab etwa 11 halb gezählten Sätzen kaum noch messbar mehr (Preprint, 2025).
9. **Was wirklich zählt, ist ein harter Satz:** 0–3 Wiederholungen vor dem Versagen. Leichte Sätze zählen weniger.
10. **Vorschlag:** Linien bei **4 / 10 / 20** mit neutralen Wörtern („wirksam“, „viel“, „sehr viel“) statt
    MEV/MAV/MRV, und „vernachlässigt“ erst unter 4 Sätzen.

---

## 1. Dosis-Wirkung: Sätze pro Woche → Muskelwachstum und → Kraft

### Die großen Auswertungen

- **Pelland, Remmert, Robinson, Hinson & Zourdos 2026** (*Sports Med* 56:481–505, online 2025): Bayessche
  Meta-Regressionen, **67 Studien, 2.058 Teilnehmende** (79 % Männer, im Mittel 25 Jahre, 39 Studien mit
  Trainierten, 28 mit Untrainierten). Muskelgröße nur direkt gemessen (Ultraschall, MRT, CT, Biopsie). Studiendauer
  im Mittel 10,4 ± 4,5 Wochen. **[Abstract]** (veröffentlicht), **[Volltext, Preprint]** (SportRxiv, Version 2).
  - **Zählweise:** Verglichen wurden „total“ (Hilfssatz = 1), „fraktional“ (0,5) und „direkt“ (0). Für Wachstum
    und Kraft passte **„fraktional“ am besten** (Bayes-Faktoren „stark“ bis „sehr stark“). **[Volltext, Preprint]**
  - **Muskel:** Die Kurve steigt mit abnehmendem Ertrag (bestes Modell: Wurzel-Funktion). Am mittleren Volumen
    (~12 Sätze) bringt **jeder weitere Satz ≈ +0,24 % Muskelgröße** (95-%-Intervall 0,15–0,33 %). Ein **klares
    Plateau gab es nicht**, und auch keine umgekehrte U-Kurve – allerdings gibt es über etwa 25 Sätze nur wenige
    Studien. **[Volltext, Preprint]**
  - **„Effizienz-Stufen“ für Muskel** (fraktionale Sätze/Woche; „nachweisbar“ = +2,05 %, die kleinste in
    Studien messbare Veränderung): **[Volltext, Preprint]**

    | Sätze/Woche | Stufe | Was es heißt |
    | --- | --- | --- |
    | **4** | minimal wirksame Dosis | reicht für nachweisbares Wachstum |
    | 5–10 | höhere Effizienz | ~6 weitere Sätze für den nächsten nachweisbaren Schritt |
    | 11–18 | mittlere Effizienz | ~8,5 weitere Sätze pro Schritt |
    | 19–29 | geringere Effizienz | ~10,75 weitere Sätze pro Schritt |
    | 30–42 | geringste Effizienz | ~12,5 weitere Sätze pro Schritt |
    | 43+ | unklar | zu wenig Daten, eventuell sogar weniger Wachstum |

  - **Kraft:** viel stärker abflachend (Kehrwert-Modell, „funktionelles Plateau“). **1 Satz pro Woche** reicht für
    nachweisbaren Kraftzuwachs, nachweisbare Zusatzschritte nur bis **etwa 4 fraktionale Sätze pro Woche**; danach
    nicht mehr verlässlich über der Messschwelle (3,96 %). Am mittleren Volumen +0,21 % je Satz. **[Volltext, Preprint]**
    Laut einer Folgearbeit derselben Gruppe nennt die veröffentlichte Fassung den Punkt, ab dem kein Vorteil mehr
    nachweisbar ist, bei **~31 fraktionalen Sätzen/Woche für Muskel und ~3 für Kraft**. **[Sekundärquelle: Remmert 2025]**
  - **Frequenz:** Bei gleichem Volumen bringt öfter trainieren für den **Muskel kaum etwas** (+0,32 % je
    zusätzlicher Einheit, nicht sicher von null verschieden), für **Kraft schon** (+3,27 % je Einheit, abflachend).
    **[Volltext, Preprint]**
  - **Grenzen:** Die Modelle erklären nur etwa ein Viertel der Unterschiede (R² marginal ≈ 22–26 %). Die Autoren
    sind selbst Coaches. 78 % der Effekte stammen aus Training bis (oder nahe) Versagen. **[Volltext, Preprint]**
- **Schoenfeld, Ogborn & Krieger 2017** (*J Sports Sci*): Meta-Analyse, 15 Studien, 34 Gruppen, fast nur
  Untrainierte. Jeder Satz pro Woche **+0,37 %** Muskelgröße; < 5 / 5–9 / ≥ 10 Sätze: nur ein Trend (p = 0,074).
  **[Abstract]** Die Gruppenwerte liegen bei etwa **5 % / 7 % / 10 %** Zuwachs. **[Sekundärquelle: Iversen 2021]**
- **Baz-Valle u. a. 2022** (*J Hum Kinet*): Meta-Analyse, nur junge **Trainierte**, 6 Studien, Vergleich 12–20 vs.
  > 20 Sätze. Kein Vorteil über 20 für **Quadrizeps** (SMD −0,20, p = 0,19) und **Bizeps** (−0,10, p = 0,59), Vorteil
  nur für den **Trizeps** (−0,50, p = 0,01). Fazit der Autoren: **12–20 Sätze**, bei 2× pro Woche. Sie vermuten
  selbst, dass der Trizeps-Vorteil an der Zählweise liegt (Drücksätze voll mitgezählt). **[Volltext]**
- **Currier u. a. 2023** (*BJSM*): Bayessche Netzwerk-Meta-Analyse, 119 Studien (Muskel). Alle Trainingsformen
  wirken; am besten für Muskel: **mehrere Sätze**, 2× pro Woche. **[Abstract]**
- **McLeod u. a. 2024** (*J Sport Health Sci*): Umbrella-Review über 44 Reviews: **Satzzahl beeinflusst Muskel und
  Kraft**, Last und Frequenz vor allem die Kraft. **[Abstract]**
- **Ralston u. a. 2017** (*Sports Med*): Kraft-Meta-Analyse, 9 Studien. Mehr Sätze pro Woche leicht besser als
  wenige (ES-Unterschied 0,18). **[Abstract]**
- **Gegenstimme:** Buckner, Loenneke u. a. bezweifeln, dass die Dosis-Wirkung so klar ist (u. a. *J Trainology*
  2023, nicht gelesen). Ihre eigene neue Studie stützt das: Mehr Sätze als bisher brachten Trainierten am Bizeps
  nichts (Moreno 2025, unten). **[Sekundärquelle: Pelland-Literaturliste]**, **[Abstract]**

### Neue Studien an Trainierten mit hohem Volumen (2022–2026)

| Studie | Wer, wie lange | Sätze/Woche | Muskel | Kraft |
| --- | --- | --- | --- | --- |
| Brigatto 2022 | 27 trainierte Männer, 8 Wo | 16 / 24 / 32 je Muskel | 32 > 16 (Vastus lateralis, Trizeps) | 32 > 16 (Kniebeuge) |
| Aube 2022 | 35 Trainierte (Kniebeuge 2× KG), 8 Wo | 12 / 18 / 24 Beine | kein Unterschied (+7,7 / +6,7 / +6,1 %) | 18 am besten (+16 % vs. +5 % bei 24), p = 0,052 |
| Enes 2024 | 31 trainierte Männer (5 J. Erfahrung), 12 Wo | 22 fest vs. steigend bis **42** bzw. **52** (Quadrizeps) | kein signifikanter Unterschied, Plateau in den hohen Gruppen | mehr Sätze → mehr Kraft |
| Enes 2025 | 30 trainierte Frauen, 12 Wo | 22 fest vs. +2 bzw. +4 alle 2 Wo | +4-Gruppe > fest (Querschnitt), Dicke gleich | Steigerung > fest |
| Barsuhn 2025 | 29 trainierte Männer, 8 Wo | bisheriges Volumen vs. +30 % vs. +60 % | kein Unterschied | **bisheriges Volumen am besten** |
| Moreno 2025 | 42 Trainierte, Bizeps, je Arm, 12 Wo | bisheriges vs. erhöhtes Volumen | kein Unterschied | kein Unterschied |
| Camargo 2026 | 25 Trainierte, je Bein, 8 Wo | +20 % vs. **+120 %** zum Gewohnten | kein Unterschied, **auch kein Schaden** | – |
| Scarpelli 2022 | 16 Trainierte, je Bein, 8 Wo | 22 fest vs. 1,2× bisheriges | individuell > fest | – |
| Robinson 2025 (Preprint) | 16 Trainierte, je Bein, 2 × 11 Wo | ~8 vs. ~16 | 16 > 8 (+1,8 cm², 99 % Wahrscheinlichkeit) | kein klarer Unterschied |

Quellen: Brigatto, Aube, Enes 2024/2025, Barsuhn, Moreno, Camargo, Scarpelli, Robinson **[Abstract]**; Protokoll von
Enes 2024 (22 → 42/52 Sätze, ~2 RIR, letzter Satz bis Versagen) **[Volltext: Enes 2026, J Hum Kinet]**.

**Einordnung [Einschätzung]:** Bei Trainierten bringt **mehr als ~20 Sätze manchmal noch etwas** (Brigatto,
Enes 2025), **oft aber nichts Messbares** (Aube, Barsuhn, Moreno, Camargo, Enes 2024). **Schaden** für den Muskel hat
keine (nicht zurückgezogene) Studie gezeigt; die **Kraft** litt bei sehr hohem Volumen teils (Aube, Barsuhn). Das
Bild „abnehmender Ertrag, unscharfe Obergrenze“ ist robust; eine feste Zahl, ab der es „zu viel“ ist, gibt es nicht.

### Gibt es eine umgekehrte U-Kurve?

- Die zwei bekanntesten Belege dafür sind **zurückgezogen**: Barbalho u. a. 2020 (*IJSPP*, 5/10/15/20 Sätze bei
  trainierten Männern, „weniger ist mehr“) wurde 2020 zurückgezogen, Barbalho u. a. 2019 (*MSSE*, trainierte Frauen,
  „Upper Threshold“) 2021. Zu weiteren Barbalho-Arbeiten gibt es Bedenken der Verlage (Expression of Concern).
  **[Abstract/Retraction Notice]** Pelland hat solche Studien ausgeschlossen. **[Volltext, Preprint]**
- Eine Übersicht von Camargo u. a. 2025 („Is there a volume saturation point?“) kommt zu dem Schluss, dass ein
  Sättigungspunkt möglich, aber nicht belegt ist; widersprüchliche Ergebnisse erklären sich eher durch Methodik
  (Muskel, Übungswahl, Vortraining, zu kleine Studien) und individuelle Unterschiede. **[Abstract]**

### Kraft

- Kraft braucht wenig Volumen: Plateau ab ~3–4 fraktionalen Sätzen pro Woche (Pelland), 1 Satz 2–3× pro Woche bis
  zum Versagen steigert bei Trainierten das 1RM bereits deutlich (Androulakis-Korakakis 2020, Meta-Analyse:
  Kniebeuge +17,5 kg, Bank +8,3 kg in 8–12 Wochen). **[Volltext, Preprint]**, **[Abstract]**
- In Schoenfeld 2019 stiegen Kniebeuge und Bank bei 1, 3 und 5 Sätzen pro Übung gleich. **[Volltext]**
- Für Kraft zählt eher **Häufigkeit, schwere Last und Übungsspezifität** (Pelland: Frequenz; Currier: > 80 % 1RM).
  **[Volltext, Preprint]**, **[Abstract]**

---

## 2. Minimal wirksame Dosis und Erhalt

- **Ab ~4 Sätzen pro Woche** ist im Mittel Wachstum nachweisbar (Pelland, s. o.). **[Volltext, Preprint]**
- **Iversen u. a. 2021** (*Sports Med*, narrativer Review): Empfehlung **mindestens 4 Sätze pro Muskel und Woche**
  (6–15 RM), mehr (≥ 10) wenn möglich. Trainierte profitieren eher von 3 als von 1 Satz pro Übung. **[Volltext]**
- **Hermann u. a. 2025** (*MSSE*, RCT): 42 **Trainierte** (4,4 ± 3,8 Jahre Erfahrung, vorher alle mit
  Mehrsatz-Programmen), 8 Wochen, **je 1 Satz von 9 Übungen, 2× pro Woche**. Für den Bizeps heißt das: 2 Sätze Curls
  + 4 Sätze Latzug/Rudern pro Woche (fraktional 4). Ergebnis: **Bizeps +2,7 % (bis Versagen) bzw. +4,5 % (2 RIR)**,
  Trizeps +3,8 % bzw. +1,2 %, Quadrizeps +3–10 %. Die Autoren: Trainierte können mit wenig Volumen Muskeln halten und
  kurzfristig sogar zulegen. Vorbehalt: Vortraining-Volumen nicht erfasst, nur 8 Wochen. **[Volltext, Preprint]**
- **Bickel, Cross & Bamman 2011** (*MSSE*): 16 Wochen Beintraining (3 × 3 Sätze, 3× pro Woche), danach 32 Wochen mit
  **einem Drittel oder einem Neuntel** der Dosis. Junge hielten den Muskelzuwachs mit beiden (bei 1/3 sogar
  weitere Faserzunahme), Ältere nicht. Kraft blieb sogar ohne Training weitgehend erhalten. **[Abstract]** Ein
  Neuntel entsprach **1 Einheit pro Woche mit je 1 Satz** von 3 Übungen. **[Sekundärquelle: Iversen 2021]**
- **Spiering u. a. 2021** (*JSCR*, Review): Kraft und Muskelgröße lassen sich bei Jüngeren **bis 32 Wochen mit
  1 Einheit und 1 Satz pro Übung** halten, solange die **Last hoch bleibt**. Ältere brauchen 2 Einheiten mit
  2–3 Sätzen. **[Abstract]**
- **Tavares u. a. 2017**: Nach 8 Wochen Aufbau hielten 1 oder 2 Einheiten pro Woche mit ~50 % des Volumens Kraft und
  Quadrizeps-Querschnitt; ohne Training gingen beide zurück. (Untrainierte) **[Abstract]**
- **Roth u. a. 2023** (*Scand J Med Sci Sports*): Trainierte im **Defizit**, 3 vs. 5 Sätze pro Übung: kein
  Unterschied beim Muskelerhalt. **[Abstract]**
- **Steele u. a. 2023**: Bei Minimaltraining (1×/Woche, je 1 Satz bis Versagen) stieg Kraft im ersten Jahr um
  30–50 % und erreichte nach 1–2 Jahren praktisch ein Plateau. **[Abstract]**

**Was bringen 4–6 Sätze pro Woche einem Trainierten? [Einschätzung]** Sicher genug zum **Erhalten** und
erfahrungsgemäß auch für **langsamen Aufbau** (Hermann 2025, Pelland-Stufe „minimal wirksam“). Für maximalen Aufbau
liegt im Mittel mehr drin. Für **Kraft** reicht es praktisch aus.

---

## 3. Indirektes Volumen: Zählen Klimmzug und Rudern für den Bizeps?

### Ja – und „halb“ ist eine gute Faustregel

- **Pelland 2026:** Die halbe Zählung erklärt die Daten **besser als voll oder gar nicht**. Für den Bizeps galten
  Latzug, Rudern (alle Griffe) als indirekt, für den Trizeps Bank-, Schräg- und Schulterdrücken. **[Volltext, Preprint]**
- **Remmert u. a. 2025** (Preprint, gleiche Daten): In einer explorativen Auswertung entsprach ein indirekter Satz
  etwa **32 % eines direkten Satzes für Muskelwachstum** und **16 % für Kraft**. 0,5 ist also eher großzügig.
  **[Volltext, Preprint]**
- **Schoenfeld u. a. 2019** (*MSSE*): Oberkörper **nur mit Mehrgelenkübungen** (Bank, Schulterdrücken, Latzug,
  Kabelrudern), **kein Curl**. Der **Bizeps wuchs trotzdem**, und zwar mit dem Volumen (5 > 1 Satz pro Übung, p = 0,02).
  Gezählt als 6 / 18 / 30 Bizeps-Sätze („total“), fraktional also 3 / 9 / 15. **[Volltext]**
- **Mannarino u. a. 2021** (*JSCR*, je Arm, 10 Untrainierte, 8 Wochen): Curl **+11,1 %** vs. einarmiges Rudern
  **+5,2 %** Bizepsdicke – Rudern wirkte also etwa **halb so stark**. **[Abstract]**
- **Leitão u. a. 2024** (akut, 16 gut Trainierte): Der Bizeps „schwoll“ nach Curls stärker an (+18,7 %) als nach
  Rudern (+12,2 %); der Brachialis gleich. Nur ein Hinweis auf die Beanspruchung, kein Wachstum. **[Abstract]**

### Bringt Isolation zusätzlich zu Verbundübungen etwas?

- **Gentil u. a. 2013** (Untrainierte, 10 Wochen): Latzug + Bank allein vs. zusätzlich Curls/Trizepsdrücken:
  Bizepsdicke **+6,5 % vs. +7,0 %**, kein Unterschied. **[Abstract]**
- **de França u. a. 2015** (Trainierte, 8 Wochen, Umfänge): kein Unterschied durch zusätzliche Isolation.
  **[Abstract]** (Umfang ist ein grobes Maß.)
- **Gentil, Soares & Bottaro 2015** (Review): Isolation bringt am Oberarm meist keinen Zusatznutzen. **[Abstract]**
- **Barbalho u. a. 2018** (Untrainierte): Oberarmumfang mit Isolation stärker (+5,2 % vs. +4,0 %). **[Abstract]**
  Vorsicht: Zu Barbalho-Arbeiten gibt es Rückzüge und Bedenken (Abschnitt 1).
- **Schoenfeld u. a. 2019** (*Sports*, Review zur Zählweise): Mehrgelenksätze sollten für manche Muskeln **nur
  anteilig** zählen; beim **Bizeps** ist die Lage gemischt, beim **Trizeps-Langkopf** und den **Beinbeugern**
  bringt Isolation eher mehr. Damals empfahlen die Autoren in der Praxis noch 1:1. **[Volltext]**

### Wo „halb“ nicht passt (je Übung verschieden)

- **Trizeps bei Drückübungen:** Bankdrücken allein ließ den Trizeps-Querschnitt insgesamt nicht signifikant wachsen
  (seitlicher Kopf ja, Langkopf nein); Isolation traf den Langkopf (Brandão 2020). Nach Bankdrücken wuchs der
  Trizeps in der Mitte, kaum oben (Wakahara 2013). **[Abstract]**
- **Beinbeuger und gerader Oberschenkelmuskel bei Kniebeugen:** 10 Wochen Kniebeugen ließen beide **nicht** wachsen,
  Adduktoren und Gesäß dagegen deutlich (+6–7 % bei tiefen Kniebeugen) (Kubo 2019). **[Abstract]**
- **Bizeps bei Bankdrücken:** keine Zunahme (Ogasawara 2012) – klar, er arbeitet dort nicht. **[Abstract]**
- **Umgekehrt** kann eine Verbundübung für den Hauptmuskel sogar besser sein als Isolation: Kniebeugen ließen den
  Quadrizeps stärker wachsen als Beinstrecken (Monte 2026). **[Abstract]**

**Folge [Einschätzung]:** 0,5 für alle Hilfsmuskeln ist ein **vernünftiger Durchschnitt**, für den Bizeps bei
Zugübungen gut gestützt. Für einige Paare (Beinbeuger bei Kniebeugen, Unterer Rücken als Stabilisator) ist es zu
viel, für andere (Gesäß bei tiefen Kniebeugen) eher zu wenig.

---

## 4. Kleine vs. große Muskeln – brauchen sie andere Satzzahlen?

### Was belegt ist

- **Keine Meta-Analyse liefert verlässliche Satzzahlen je Muskel.** Pelland hat Muskelgruppen nicht als eigenen
  Einflussfaktor berichtet; Schoenfeld 2019 (Frequenz) fand keinen Unterschied zwischen Ober- und Unterkörper.
  **[Volltext, Preprint]**, **[Abstract]**
- **Bizeps (Trainierte):** 9 / 18 / 27 Sätze → **+4,3 / +9,5 / +5,4 %** (Heaselgrave 2019, nicht signifikant);
  18 vs. 28 Sätze → arm-bezogene fettfreie Masse eher besser mit weniger (Amirthalingam 2017); über 20 Sätze kein
  Vorteil (Baz-Valle 2022); aber in Brigatto 2022 und Schoenfeld 2019 eher mehr mit mehr. **[Abstract]**, **[Volltext]**
- **Trizeps:** über 20 Sätze Vorteil (Baz-Valle 2022); 7 vs. 28 Sätze: +2,2 vs. +4,7 % (Ostrowski 1997). Erklärbar
  dadurch, dass der Trizeps beim Drücken nur mithilft und so mehr „volle“ Sätze braucht. **[Volltext]**,
  **[Sekundärquelle: Schoenfeld 2019]**
- **Waden:** Untrainierte Frauen, 6 vs. 12 Sätze: **+6,9 % vs. +12,0 %** (Kassiano 2024). **[Abstract]**
- **Ober- vs. Unterkörper bei Untrainierten:** 1 Satz reichte oben genauso wie 3, unten waren 3 besser (Rønnestad
  2007). Bei Trainierten waren 3 Sätze oben und unten besser. **[Sekundärquelle: Iversen 2021]**

### Erholen sich kleine Muskeln schneller?

- **Nach üblichem Training eher ja:** Übersicht über 24 Studien (Sousa, Zourdos, Storey & Helms 2024): Unterkörper
  braucht **48–72 h**, Oberkörper **≤ 24 h**; Mehrgelenk- und Unterkörperübungen, Exzentrik, gedehnte Positionen und
  Training bis Versagen verlängern die Erholung. **[Volltext]**
- **Bei ungewohnter, maximal exzentrischer Belastung nein:** Arm-Muskeln (Beuger und Strecker) zeigten **mehr**
  Muskelschaden als Beinmuskeln (Chen 2011, Untrainierte); nach Arm-Exzentrik war die Kraft nach 96 h noch nicht
  zurück, nach Bein-Exzentrik schon (Jamurtas 2005). **[Abstract]**
- **Konkurrieren Muskeln um Wachstum?** Zusätzliches Beintraining bremste das Armwachstum nicht (Kataoka 2026).
  **[Abstract]**

### RP-Landmarks: Herkunft und Belegstand

- MEV, MAV, MRV (plus MV = Erhaltungsvolumen) stammen aus dem Coaching-Modell von **Renaissance Periodization**
  (Israetel u. a.). Es sind **Startwerte aus Praxiserfahrung**, keine Studienwerte; RP nennt sie selbst
  Bevölkerungsmittel, die jeder für sich anpassen muss. **[Sekundärquelle: Suchauszüge rpstrength.com]**
- **RP-Werte für den Bizeps:** MV 6–8, **MEV 8–10, MAV 14–20, MRV 20–26** Sätze pro Woche. RP schreibt außerdem: Wer
  den Bizeps nicht direkt trainiert, kann ihn **allein mit Rückentraining** „ziemlich“ wachsen lassen; wer wenig
  Rücken trainiert, braucht mehr direkte Bizepsarbeit. Das MV liegt laut RP allgemein bei etwa **6 Sätzen** (bei
  ≥ 2 Einheiten pro Woche). **[Sekundärquelle: Suchauszüge rpstrength.com, Seite selbst nicht abrufbar]**
- **Abgleich [Einschätzung]:** Die Größenordnung passt zur Forschung (MEV ~8–10 liegt in Pellands Stufe „höhere
  Effizienz“, MAV ~14–20 in den 12–20 von Baz-Valle). „MRV“ als feste Zahl ist **nicht** überprüfbar: In Studien
  wurden 27–52 Sätze ohne Schaden vertragen, aber nur für 6–12 Wochen. Trainios **gleiche 10/15/20 für jeden Muskel**
  sind ein vereinfachtes Echo davon – und bei RP liegt etwa der Bizeps-MRV sogar höher (20–26).

---

## 5. Erholbarkeit („MRV“), Sätze pro Einheit, Frequenz

### Wo kippt es?

- **Kein belegter Punkt, an dem Wachstum wieder sinkt** (Pelland: keine umgekehrte U-Kurve; Camargo 2026: +120 %
  Volumen ohne Einbuße; Enes 2024: bis 52 Sätze ohne Einbuße, aber auch ohne klaren Gewinn). **[Volltext, Preprint]**,
  **[Abstract]**
- **Kosten steigen trotzdem:** Mehr Volumen erhöht die empfundene Belastung („Strain“ 6S > 4S > fest) und senkt die
  Freude am Training leicht (Enes 2026); die Kraft kann leiden (Aube 2022, Barsuhn 2025); bei 10 × 10 sank die
  fettfreie Beinmasse zwischen Woche 6 und 12 (Hackett 2018, Pilotstudie). **[Volltext]**, **[Abstract]**
- **Studien sind kurz** (meist 6–12 Wochen) und messen nicht Verletzungen, Gelenkbeschwerden oder Lust aufs Training
  über Monate. Pelland weist ausdrücklich darauf hin. **[Volltext, Preprint]**

### Grenze pro Einheit

- **Remmert u. a. 2025** (Preprint, dieselben 67 Studien): Ab **~11 fraktionalen Sätzen pro Muskel und Einheit**
  (≈ 8 direkte bzw. ≈ 14 „total“) war kein weiterer nachweisbarer Vorteil mehr zu erkennen; für Kraft ab **~2 direkten
  Sätzen pro Übung und Einheit**. Das ist **keine Obergrenze**, nach der es schlechter würde, nur der Punkt, ab dem
  kein Vorteil mehr sicher messbar ist. Der Mittelwert der Studien lag bei ~6 Sätzen pro Einheit. **[Volltext, Preprint]**
- Eine ältere, unveröffentlichte Auswertung (Krieger 2017) sah den Knick bei **6–8 Sätzen pro Einheit**.
  **[Sekundärquelle: Remmert 2025]**
- Direkte Vergleiche: 16 Sätze an einem Tag vs. 2 × 8 → gleich (Brigatto 2019); alle 9 Quadrizeps-Sätze an einem Tag
  vs. auf 3 Tage verteilt → gleiche Muskeldicke, aber mehr bewegte Last verteilt (Calzavara 2026); 10 vs. 5 Sätze pro
  Übung („German Volume Training“) → nicht besser, Arm eher schlechter (Amirthalingam 2017). **[Abstract]**

### Frequenz

- Bei gleichem Volumen spielt die Häufigkeit für den Muskel kaum eine Rolle (Schoenfeld 2019, 25 Studien; Pelland
  2026; neue Meta-Analyse Boutagy & McKean 2026, 16 Studien: g = −0,06, Preprint). **[Abstract]**, **[Volltext, Preprint]**
- **Praktisch** hilft eine höhere Frequenz, viel Volumen unterzubringen, ohne über ~10 Sätze pro Einheit zu kommen.
  **[Einschätzung, gestützt auf Remmert 2025]**

---

## 6. Trainingserfahrung, individuelle Unterschiede, Nähe zum Versagen

### Trainierte vs. Untrainierte

- Pelland hat nach Trainingsstand bereinigt; die Kurvenform wurde durch weitere Faktoren „selten“ verändert (nur
  explorativ geprüft). **[Volltext, Preprint]**
- Untrainierte wachsen schon mit sehr wenig (1 Satz oben ≈ 3 Sätze, Rønnestad 2007; Ältere: 1 Satz reicht für
  Muskelgröße, Marques 2023). Trainierte brauchen eher mehr. **[Sekundärquelle: Iversen 2021]**, **[Abstract]**
- **Vortraining zählt vielleicht:** Individuell 1,2× das bisherige Volumen war besser als fest 22 Sätze (Scarpelli
  2022); eine Rückschau über 68 Trainierte fand nur einen schwachen bis mäßigen Zusammenhang zwischen
  Volumenänderung und Armwachstum (de Camargo 2023). Gezielte Steigerungen über das Gewohnte brachten aber in drei
  neuen Studien nichts (Barsuhn 2025, Moreno 2025, Camargo 2026). **[Abstract]**

### Individuelle Unterschiede

- Die Streuung zwischen Menschen ist **viel größer** als der Effekt der Satzzahl: Zwischen Personen war die
  Variabilität des Muskelzuwachses **40-mal** größer als zwischen den beiden Beinen derselben Person mit
  unterschiedlichem Programm (Damas 2019). **[Abstract]**
- Bei 34 Untrainierten (je Bein 1 vs. 3 Sätze) profitierten **13** klar von mehr Volumen beim Muskel, die übrigen
  nicht eindeutig (Hammarström 2020). Ältere, die auf 1 Satz nicht reagierten, reagierten auf 4 Sätze (Lixandrão
  2024). **[Abstract]**
- **Aber:** In der bislang saubersten Studie dazu (je Bein ~8 vs. ~16 Sätze, zweimal wiederholt) war der Vorteil von
  16 Sätzen für alle ähnlich; echte „Volumen-Responder“ ließen sich nicht nachweisen. Große Streuung in Studien ist
  oft Messfehler und Tagesform (Robinson 2025, Preprint). **[Abstract]**

### Nähe zum Muskelversagen

- **Robinson u. a. 2024** (*Sports Med*, Meta-Regression): Muskelwachstum steigt, je näher der Satz am Versagen
  endet – im Mittel **≈ +0,5 Prozentpunkte je Wiederholung weniger in Reserve** (bei gleichem Volumen); Kraft hängt
  kaum davon ab. Bei schwereren Lasten ist der Effekt schwächer. **[Abstract]**, **[Volltext, Preprint]**
- **Refalo u. a. 2023** (Meta-Analyse): Versagen vs. nicht Versagen: nur trivialer Vorteil (ES 0,19), bis zum
  „echten“ Versagen kein klarer Vorteil. **Refalo 2024** (Trainierte, Quadrizeps): **0 vs. 1–2 RIR gleich**.
  **Vasconcelos 2026** (Trainierte, **Bizeps**, je Arm): Versagen vs. 1–3 RIR gleich. **Hermann 2025** (Einsatz-
  training): Versagen leicht besser für manche Muskeln. **[Abstract]**, **[Volltext, Preprint]**
- **Folge für die Satzzahl [Einschätzung]:** Ein Satz zählt dann voll, wenn er **etwa 0–3 Wiederholungen vor dem
  Versagen** endet. Sätze mit 5+ Wiederholungen Reserve sind ein schwächerer Reiz. Eine reine Satzzählung, die
  leichte Sätze gleich zählt, überschätzt den Reiz. Training bis Versagen verlängert außerdem die Erholung
  (Sousa 2024).

---

## 7. Was taugt als ehrliche Anzeige in einer App?

**Belastbar sagen lässt sich [Einschätzung, gestützt auf Abschnitte 1–6]:**

| Fraktionale harte Sätze pro Muskel und Woche | Belegte Aussage | Wichtigste Belege |
| --- | --- | --- |
| **0** | kein Reiz (außer Alltag) | – |
| **unter 4** | wenig – reicht, um Muskel und Kraft eine Weile **zu halten**; für Kraft schon fast genug | Bickel 2011, Spiering 2021, Pelland (Kraft) |
| **4 bis unter 10** | **wirksam** – messbares Wachstum, hoher Ertrag pro Satz | Pelland (Stufen 1–2), Iversen 2021, Hermann 2025 |
| **10 bis 20** | **viel** – im Mittel mehr Wachstum, Ertrag pro Satz sinkt | Schoenfeld 2017, Baz-Valle 2022, Pelland |
| **über 20** | **sehr viel** – teils noch Zusatznutzen, oft keiner; mehr Ermüdung und Zeit | Brigatto 2022 vs. Aube 2022, Enes 2024, Barsuhn 2025 |

**Was sich nicht belegt sagen lässt:**

- „Unter 10 wächst nichts“ oder „unter MEV“ – falsch, Wachstum beginnt deutlich darunter.
- „Über 20 ist nicht mehr erholbar“ – nicht belegt; erholbar ist individuell und hängt an Nähe zum Versagen,
  Übungen, Schlaf, Ernährung.
- Verschiedene feste Zahlen je Muskel – dafür fehlen Studien.
- „Optimal“ als ein Wert – es gibt einen breiten Bereich mit abnehmendem Ertrag; was „optimal“ ist, hängt davon ab,
  wie viel Zeit und Ermüdung man für wie viel Zusatzwachstum ausgeben will.

---

## Tabelle der wichtigsten Studien

| Jahr | Studie | Design | Population | Dauer / Messung | Kernergebnis | Link |
| --- | --- | --- | --- | --- | --- | --- |
| 2026 | Pelland u. a., *Sports Med* | Meta-Regression (Bayes) | 67 Studien, 2.058 Pers., ~58 % der Studien Trainierte | Ø 10 Wo; Ultraschall/MRT/CT/Biopsie, 1RM | Fraktionale Zählung passt am besten; Muskel: abnehmender Ertrag, kein Plateau, ab 4 Sätzen nachweisbar; Kraft: Plateau ab ~3–4 Sätzen | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41343037/), [Preprint](https://sportrxiv.org/index.php/server/preprint/view/460) |
| 2025 | Remmert u. a. (Preprint) | Meta-Regression pro Einheit | dieselben 67 Studien | wie oben | ~11 fraktionale Sätze/Einheit (Muskel), ~2 direkte (Kraft); indirekter Satz ≈ 32 % (Muskel) | [SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/537) |
| 2024 | Robinson u. a., *Sports Med* | Meta-Regression | volumengleiche Studien | – | Muskel wächst mehr, je näher am Versagen (~0,5 %-Pkt./RIR); Kraft kaum | [PubMed](https://pubmed.ncbi.nlm.nih.gov/38970765/) |
| 2022 | Baz-Valle u. a., *J Hum Kinet* | Meta-Analyse | 6 Studien, junge Trainierte | 6–24 Wo, Ultraschall | 12–20 ≈ > 20 Sätze für Quadrizeps und Bizeps, > 20 besser für Trizeps | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/) |
| 2017 | Schoenfeld, Ogborn & Krieger, *J Sports Sci* | Meta-Regression | 15 Studien, meist Untrainierte | – | +0,37 % je Satz/Woche; < 5 / 5–9 / ≥ 10 nur Trend | [PubMed](https://pubmed.ncbi.nlm.nih.gov/27433992/) |
| 2019 | Schoenfeld u. a., *MSSE* | RCT | 34 trainierte Männer | 8 Wo, Ultraschall, 1RM | Muskel: 5 > 1 Satz/Übung (auch Bizeps nur mit Zugübungen); Kraft gleich | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6303131/) |
| 2022 | Brigatto u. a., *JSCR* | RCT | 27 trainierte Männer | 8 Wo, Ultraschall | 32 > 16 Sätze für Beine und Trizeps | [PubMed](https://pubmed.ncbi.nlm.nih.gov/31868813/) |
| 2022 | Aube u. a., *JSCR* | RCT | 35 Trainierte | 8 Wo, Ultraschall, DXA | 12 = 18 = 24 Sätze (Muskel); 18 am besten für 1RM | [PubMed](https://pubmed.ncbi.nlm.nih.gov/32058362/) |
| 2024 | Enes u. a., *MSSE* | RCT | 31 trainierte Männer | 12 Wo, Ultraschall | 22 fest vs. bis 42/52: Muskel nicht signifikant mehr, Kraft mehr | [PubMed](https://pubmed.ncbi.nlm.nih.gov/37796222/) |
| 2025 | Enes u. a., *J Sports Sci* | RCT | 30 trainierte Frauen | 12 Wo | Steigerung leicht besser (Querschnitt, 1RM) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/39869076/) |
| 2025 | Barsuhn u. a., *J Appl Physiol* | RCT | 29 trainierte Männer | 8 Wo | +30/+60 % Volumen: kein Muskelvorteil, Kraft am besten ohne Steigerung | [PubMed](https://pubmed.ncbi.nlm.nih.gov/39665246/) |
| 2025 | Moreno u. a., *Eur J Appl Physiol* | RCT je Arm | 42 Trainierte (Bizeps) | 12 Wo | mehr Sätze als bisher: kein Zusatznutzen | [PubMed](https://pubmed.ncbi.nlm.nih.gov/39557664/) |
| 2026 | Camargo u. a., *J Appl Physiol* | RCT je Bein | 25 Trainierte | 8 Wo, Ultraschall, Biopsie | +120 % vs. +20 %: gleich, kein Schaden | [PubMed](https://pubmed.ncbi.nlm.nih.gov/42461790/) |
| 2025 | Robinson u. a. (Preprint) | RCT je Bein, wiederholt | 16 Trainierte | 2 × 11 Wo | 16 > 8 Sätze (Muskel); keine echten „Volumen-Responder“ nachweisbar | [DOI](https://doi.org/10.1101/2025.07.24.666533) |
| 2025 | Hermann u. a., *MSSE* | RCT | 42 Trainierte | 8 Wo, Ultraschall | 1 Satz × 9 Übungen, 2×/Wo: Bizeps +3–5 %, Muskeln gehalten/aufgebaut | [PubMed](https://pubmed.ncbi.nlm.nih.gov/40249908/), [Preprint](https://sportrxiv.org/index.php/server/preprint/view/484) |
| 2019 | Heaselgrave u. a., *IJSPP* | RCT | 49 trainierte Männer (Bizeps) | 6 Wo | 9/18/27 Sätze: +4,3/+9,5/+5,4 %, nicht signifikant | [PubMed](https://pubmed.ncbi.nlm.nih.gov/30160627/) |
| 2024 | Kassiano u. a., *Int J Sports Med* | RCT | 61 untrainierte Frauen (Waden) | 6 Wo | 12 > 6 Sätze | [PubMed](https://pubmed.ncbi.nlm.nih.gov/38684187/) |
| 2011 | Bickel, Cross & Bamman, *MSSE* | RCT | 70 Junge und Ältere | 16 + 32 Wo, Biopsie, MRT | Junge halten Muskeln mit 1/3 bzw. 1/9 der Dosis | [PubMed](https://pubmed.ncbi.nlm.nih.gov/21131862/) |
| 2021 | Iversen u. a., *Sports Med* | Review | – | – | ≥ 4 Sätze/Muskel/Woche als Minimum, ≥ 10 wenn möglich | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772/) |
| 2021 | Mannarino u. a., *JSCR* | RCT je Arm | 10 Untrainierte | 8 Wo | Curl +11,1 % vs. Rudern +5,2 % Bizeps | [PubMed](https://pubmed.ncbi.nlm.nih.gov/31268995/) |
| 2013 | Gentil u. a., *APNM* | RCT | 29 Untrainierte | 10 Wo | Isolation zusätzlich zu Latzug/Bank: kein Zusatznutzen | [PubMed](https://pubmed.ncbi.nlm.nih.gov/23537028/) |
| 2020 | Brandão u. a., *JSCR* | RCT | 43 Männer | MRT | Bankdrücken trifft Trizeps-Langkopf kaum | [PubMed](https://pubmed.ncbi.nlm.nih.gov/32149887/) |
| 2019 | Kubo u. a., *Eur J Appl Physiol* | RCT | 17 Männer | 10 Wo, MRT | Kniebeugen: Beinbeuger und gerader Oberschenkelmuskel wachsen nicht | [PubMed](https://pubmed.ncbi.nlm.nih.gov/31230110/) |
| 2024 | Sousa u. a., *J Hum Kinet* | Review | 24 Studien | – | Erholung Unterkörper 48–72 h, Oberkörper ≤ 24 h | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11057610/) |
| 2023 | Refalo u. a., *Sports Med* | Meta-Analyse | 15 Studien | – | Versagen vs. knapp davor: trivialer Unterschied | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748/) |
| 2019 | Damas u. a., *J Appl Physiol* | RCT je Bein | 20 Trainierte | 8 Wo | Unterschiede zwischen Menschen 40× größer als durch Programm | [PubMed](https://pubmed.ncbi.nlm.nih.gov/31268828/) |

---

## Was das für Trainio heißt

> **Alles Folgende sind Vorschläge.** Entscheiden tut David.

### Diagramm „Sätze pro Muskelgruppe / Woche“

**Vorschlag A (empfohlen): Linien bei 4 / 10 / 20, neutrale Wörter statt Abkürzungen**

| Bereich | Farbe (heute vorhandene Töne) | Beschriftung | Tooltip-Zusatz |
| --- | --- | --- | --- |
| 0 – < 4 | blass (`c.faint`) | „wenig“ | „reicht eher zum Halten“ |
| 4 – < 10 | Akzent | „wirksam“ | „Muskel wächst messbar“ |
| 10 – 20 | Akzent kräftig | „viel“ | „mehr Wachstum, jeder Satz bringt etwas weniger“ |
| > 20 | Akzent leuchtend (nicht Warnfarbe) | „sehr viel“ | „kaum Zusatznutzen pro Satz, mehr Ermüdung“ |

- **Linien:** `4 „wirksam ab“`, `10 „viel“`, `20 „sehr viel“`. Die Linie bei 15 („optimal“) fällt weg – es gibt kein
  belegtes Optimum bei 15.
- **Info-Text (Entwurf):** „Durchschnittliche harte Arbeitssätze pro Woche im Zeitraum. Kräftig: direkte Sätze (der
  Muskel ist Hauptmuskel der Übung). Blass: Sätze, bei denen er nur mithilft (z. B. Bizeps beim Klimmzug) – sie
  zählen halb, so passt es laut Studien am besten. Orientierung aus Studien, jeder Mensch ist anders: Ab etwa
  4 Sätzen wächst ein Muskel messbar. Mehr Sätze bringen mehr, aber jeder weitere etwas weniger. Über etwa 20 ist der
  Zusatznutzen klein und die Ermüdung größer. Für Kraft reichen deutlich weniger Sätze.“
- **Warnfarbe** (`c.warning`) nicht mehr für > 20 – das wäre eine Warnung ohne Beleg. Höchstens ein dezenter Hinweis
  „sehr viel – auf Erholung achten“, wenn zusätzlich die Kraft in diesen Übungen sinkt (das kann der Trainio-Score
  erkennen).

**Vorschlag B (kleinere Änderung): RP-Begriffe behalten, aber ehrlich beschriften**

- Linien bleiben, aber MEV auf ~8 (RP selbst: 8–10 für viele Muskeln) und Erklärung: „MEV/MAV/MRV sind
  Richtwerte aus dem Coaching (Renaissance Periodization), keine Studienwerte. Wachstum gibt es schon ab etwa
  4 Sätzen; eine feste Obergrenze ist nicht belegt.“
- Nachteil: Die Abkürzungen versprechen eine Genauigkeit, die es nicht gibt, und „MRV“ klingt wie eine harte Grenze.

### „Vernachlässigte Muskelgruppen“, Region-Popup, Körperkarte

- **Schwelle für „vernachlässigt“: unter 4** statt unter 10. Heute landet z. B. Davids Bizeps mit 8,5 halb gezählten
  Sätzen in dieser Liste, obwohl er nachweislich wirksam trainiert ist. Mit 10 als Schwelle erscheinen außerdem bei
  fast jedem Unterarme, Adduktoren, Abduktoren, Waden und Trapez – das ist eher Lärm als Hilfe.
- **Region-Popup** (`status` in `progress.js`): „unter MEV – mehr Volumen hilft“ / „im Zielbereich (MEV–MRV)“ /
  „über MRV – auf Erholung achten“ → „wenig Reiz“ / „wirksam“ / „viel“ / „sehr viel“.
- **Körperkarte** (`regionColor` skaliert heute auf 20): Skala an 4 / 10 / 20 ausrichten, z. B. volle Akzentfarbe ab
  10, leuchtend ab 20.
- **Tooltip** „zählt als 8,5 (unter MEV)“ → „zählt als 8,5 (wirksam)“.

### Umgang mit indirekten Sätzen

- **0,5 beibehalten.** Es ist die am besten gestützte einfache Regel (Pelland 2026), für den Bizeps bei Zugübungen
  zusätzlich durch Mannarino 2021 und Schoenfeld 2019 gestützt.
- **Getrennt zeigen wie heute** (kräftig/blass) – das ist ehrlich und erklärt sich selbst. Gut wäre im Tooltip beides:
  „4 direkt + 9 mitgeholfen = zählt als 8,5“.
- **Optional, je Übung feiner** [Einschätzung]: Für Paare mit Beleg für fast keinen Effekt den Hilfsmuskel aus den
  Übungsdaten nehmen oder schwächer zählen – z. B. „Beinbeuger“ bei Kniebeuge Low-Bar (Kubo 2019) und „Unterer
  Rücken“ bei Kniebeugen (nur haltend). Das wäre eine Datenänderung in `js/seeds.js`, keine Rechenänderung. Ein
  eigener Faktor je Übung und Muskel wäre genauer, aber nicht belegbar genau; das lohnt den Aufwand eher nicht.

### Je Muskel unterschiedliche Werte?

- **Empfehlung: nein, gleiche Bereiche für alle Muskeln.** Die Forschung liefert keine belastbaren Unterschiede; die
  RP-Werte je Muskel sind Erfahrungswerte. Die halbe Zählung fängt den wichtigsten Unterschied schon ab: Kleine
  Muskeln wie Bizeps, Trizeps und hintere Schulter bekommen viel mithelfendes Volumen und erreichen so ihre Werte.
- **Wenn individuell, dann vom Nutzer:** Statt fester Werte je Muskel könnte man später einen persönlichen Zielwert je
  Muskel erlauben („Fokus: Bizeps 12“). Das passt besser zur großen Streuung zwischen Menschen (Damas 2019).

### Weitere Anzeige-Ideen (optional)

- **Nur harte Sätze zählen:** Ist RPE eingetragen, Sätze mit **RPE ≤ 5** (≥ 5 Wdh. Reserve) nur halb zählen.
  Aufwärmsätze zählen heute schon nicht. [Einschätzung, gestützt auf Robinson 2024]
- **Hinweis pro Einheit:** Kommt ein Muskel in **einer** Einheit auf mehr als ~11 halb gezählte Sätze, ein
  dezenter Hinweis: „Ab etwa 10 Sätzen pro Einheit bringt jeder weitere wenig – lieber auf zwei Tage verteilen.“
  (Beleg: Preprint Remmert 2025, also vorsichtig formulieren.)
- **Kraft getrennt erwähnen:** Ein Satz im Info-Text reicht: „Für Kraft genügen wenige Sätze pro Übung; öfter pro
  Woche üben hilft mehr als viele Sätze.“

### Was sich für den Trainio-Score (Teil „Trainingsreiz“) ändert

Heute festgelegt (ANFORDERUNGEN, Abschnitt 6): Arbeitssätze je Körperbereich, Hauptmuskel 1, Hilfsmuskel 0,5, mit
abflachender Kurve; „voll ab“ Bulk 12–15, Cut 6–8, Erhalt/Sonstiges/ohne Phase 10.

1. **Zählweise bleibt** (fraktional) – gut belegt.
2. **Je Muskelgruppe rechnen, dann im Körperbereich mitteln.** Wenn die Sätze von Bizeps, Trizeps und Unterarmen zu
   „Arme“ **summiert** würden, wäre „voll ab 12–15“ viel zu leicht erreichbar. Vorschlag: Reiz je Muskelgruppe
   berechnen und dann den Mittelwert (oder bei „Beine hängen hinterher“ den schwächsten Wert) je Körperbereich nehmen.
3. **Kurve aus den Pelland-Stufen** statt einer harten Schwelle [Einschätzung]: Im Mittel bringen ~4 Sätze etwa ein
   Drittel, ~10 Sätze etwa zwei Drittel des Zuwachses von ~18 Sätzen. Daraus Anker für Bulk:

   | Fraktionale Sätze/Woche | 0 | 4 | 10 | 15 | ≥ 18 |
   | --- | --- | --- | --- | --- | --- |
   | Reiz-Anteil (Bulk) | 0 | 0,35 | 0,65 | 0,85 | 1,0 |

   Für Cut und Erhalt dieselbe Form, aber gestaucht (z. B. „voll“ bei 8 bzw. 10). Die heutigen „voll ab“-Werte können
   bleiben; wichtig ist, dass 8–9 Sätze nicht wie „fast nichts“ zählen.
4. **Keine Abzüge über 20.** Für einen Schaden durch Volumen gibt es keinen Beleg; höchstens ein Hinweis, wenn
   gleichzeitig die Kraft sinkt.
5. **Cut 6–8 Sätze „voll“ ist gut gestützt** (Bickel 2011, Spiering 2021, Roth 2023: 3 vs. 5 Sätze pro Übung im
   Defizit gleich).
6. **RPE nutzen, wenn vorhanden:** Sätze mit RPE ≤ 5 nur halb in den Reiz (siehe oben). Passt zur Kraft-Regel des
   Scores (RPE ≤ 5 zählt nicht).
7. **Klartext anpassen:** „guter Aufbau-Reiz“ ab ~10, „wirksamer Reiz“ 4–10, „wenig Reiz für …“ unter 4. Wenn bei
   4–10 Sätzen die Kraft steigt, eher „Reiz reicht – Fortschritt da“ als „wenig Reiz“. Das ist ehrlicher, weil
   niemand das individuelle Optimum kennt; der eigene Fortschritt ist der beste Hinweis.

---

## Abgleich mit der ersten Recherche (trainio-score.md)

| Aussage dort | Ergebnis der Nachprüfung |
| --- | --- |
| Pelland 2025, ~67 Studien, fraktional am besten, Kraft flacht ~4 Sätze ab (ungeprüft) | **Bestätigt** im Preprint-Volltext; veröffentlicht in *Sports Med* **2026**, 56:481–505 (online 2025). Kraft: nachweisbare Schritte bis ~4 fraktionale Sätze, veröffentlichte Fassung nennt ~3. |
| Schoenfeld 2017: < 5 / 5–9 / ≥ 10 → 5,4 / 6,6 / 9,8 % (ungeprüft) | Größenordnung bestätigt (~5 / 7 / 10 %, Sekundärquelle Iversen 2021); Gruppenvergleich nur Trend (p = 0,074) – bestätigt. |
| Schoenfeld 2019: ≈ 6–9 / 18–27 / 30–45 Sätze (ungeprüft) | **Bestätigt** (Volltext). Ergänzung: Oberkörper nur Verbundübungen, alle Sätze voll gezählt; fraktional für den Bizeps also 3 / 9 / 15. |
| Baz-Valle 2022: 12–20, über 20 nur Trizeps, 6 Studien | **Bestätigt** (Volltext). |
| MEV 10 / MAV 15 / MRV 20 = RP-Coachingmodell, MV ~6 | **Bestätigt** (Sekundärquelle). Ergänzung: RP-Bizeps MEV 8–10, MRV 20–26. |
| „10 und 12–20 passen gut zur Literatur“ | **Präzisiert:** 10 ist kein Minimum; messbar wirksam ab ~4. |
| Abflachende Kurve 0 → 0, 5 → ~0,5, 10 → ~0,8, 15–20 → 1 | Grundsätzlich richtig; die Pelland-Stufen sprechen für eine etwas flachere Kurve (4 → ~0,35, 10 → ~0,65), siehe oben. |

---

## Quellen

**Meta-Analysen und Übersichten zu Volumen und Frequenz**

- [Volltext, Preprint] Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC (2026): The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains. *Sports Med* 56:481–505. https://doi.org/10.1007/s40279-025-02344-w · PubMed: https://pubmed.ncbi.nlm.nih.gov/41343037/ · Preprint: https://sportrxiv.org/index.php/server/preprint/view/460
- [Volltext, Preprint] Remmert JF, Pelland JC, Robinson ZP, Hinson SR, Zourdos MC (2025): Is there too much of a good thing? Meta-regressions of the effect of per-session volume on hypertrophy and strength. SportRxiv. https://doi.org/10.51224/SRXIV.537 · https://sportrxiv.org/index.php/server/preprint/view/537
- [Abstract] Schoenfeld BJ, Ogborn D, Krieger JW (2017): Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci* 35(11):1073–1082. https://pubmed.ncbi.nlm.nih.gov/27433992/
- [Volltext] Baz-Valle E, Balsalobre-Fernández C, Alix-Fages C, Santos-Concejero J (2022): A systematic review of the effects of different resistance training volumes on muscle hypertrophy. *J Hum Kinet* 81:199–210. https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/
- [Abstract] Ralston GW, Kilgore L, Wyatt FB, Baker JS (2017): The effect of weekly set volume on strength gain: a meta-analysis. *Sports Med* 47(12):2585–2601. https://pmc.ncbi.nlm.nih.gov/articles/PMC5684266/
- [Abstract] Currier BS u. a. (2023): Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *Br J Sports Med* 57(18):1211–1220. https://pmc.ncbi.nlm.nih.gov/articles/PMC10579494/
- [Abstract] McLeod JC, Currier BS, Lowisz CV, Phillips SM (2024): The influence of resistance exercise training prescription variables on skeletal muscle mass, strength, and physical function in healthy adults: an umbrella review. *J Sport Health Sci* 13(1):47–60. https://pmc.ncbi.nlm.nih.gov/articles/PMC10818109/
- [Abstract] Schoenfeld BJ, Grgic J, Krieger J (2019): How many times per week should a muscle be trained to maximize muscle hypertrophy? *J Sports Sci* 37(11):1286–1295. https://pubmed.ncbi.nlm.nih.gov/30558493/
- [Abstract] Boutagy AG, McKean M (2026): Resistance training frequency and muscle hypertrophy: a systematic review and meta-analysis of volume-equated trials. medRxiv (Preprint). https://doi.org/10.64898/2026.10.07.26365015
- [Abstract] Camargo JBB u. a. (2025): Is there a volume saturation point for muscle hypertrophy in resistance-trained individuals? A narrative review. *Eur J Appl Physiol* 125(11):3065–3081. https://pubmed.ncbi.nlm.nih.gov/40883636/
- [Abstract] Marques DL u. a. (2023): Manipulating the resistance training volume in middle-aged and older adults. *Sports Med* 53(2):503–518. https://pubmed.ncbi.nlm.nih.gov/36307745/

**Einzelstudien zum Volumen (Trainierte, 2017–2026)**

- [Volltext] Schoenfeld BJ u. a. (2019): Resistance training volume enhances muscle hypertrophy but not strength in trained men. *Med Sci Sports Exerc* 51(1):94–103. https://pmc.ncbi.nlm.nih.gov/articles/PMC6303131/
- [Abstract] Brigatto FA u. a. (2022): High resistance-training volume enhances muscle thickness in resistance-trained men. *J Strength Cond Res* 36(1):22–30. https://pubmed.ncbi.nlm.nih.gov/31868813/
- [Abstract] Aube D u. a. (2022): Progressive resistance training volume: effects on muscle thickness, mass, and strength adaptations in resistance-trained individuals. *J Strength Cond Res* 36(3):600–607. https://pubmed.ncbi.nlm.nih.gov/32058362/
- [Abstract] Scarpelli MC u. a. (2022): Muscle hypertrophy response is affected by previous resistance training volume in trained individuals. *J Strength Cond Res* 36(4):1153–1157. https://pubmed.ncbi.nlm.nih.gov/32108724/
- [Abstract] Enes A, De Souza EO, Souza-Junior TP (2024): Effects of different weekly set progressions on muscular adaptations in trained males: is there a dose-response effect? *Med Sci Sports Exerc* 56(3):553–563. https://pubmed.ncbi.nlm.nih.gov/37796222/
- [Abstract] Enes A u. a. (2025): Does increasing the resistance-training volume lead to greater gains? The effects of weekly set progressions on muscular adaptations in females. *J Sports Sci* 43(4):381–392. https://pubmed.ncbi.nlm.nih.gov/39869076/
- [Volltext] Enes A u. a. (2026): Exploring the dose-response relationship between resistance-training volume and psychophysiological responses in trained males. *J Hum Kinet* 103:303–318. https://pmc.ncbi.nlm.nih.gov/articles/PMC13551339/
- [Abstract] Barsuhn A u. a. (2025): Training volume increases or maintenance based on previous volume: the effects on muscular adaptations in trained males. *J Appl Physiol* 138(1):259–269. https://pubmed.ncbi.nlm.nih.gov/39665246/
- [Abstract] Moreno EN, Sampson DT, Figueroa EC, Jessee MB, Buckner SL (2025): Increasing set volume relative to baseline does not augment skeletal muscle adaptations when compared to maintenance of baseline training volume in recreationally trained individuals. *Eur J Appl Physiol* 125(4):1049–1059. https://pubmed.ncbi.nlm.nih.gov/39557664/
- [Abstract] Camargo JBB u. a. (2026): Large increases in resistance training volume do not impair muscle hypertrophy or anabolic-catabolic molecular signaling in trained individuals. *J Appl Physiol* 141(2):477–493. https://pubmed.ncbi.nlm.nih.gov/42461790/
- [Abstract] Robinson ZP u. a. (2025): The effect of resistance training volume on individual-level skeletal muscle adaptations: a novel replicated within-participant unilateral trial. bioRxiv (Preprint). https://doi.org/10.1101/2025.07.24.666533
- [Abstract] de Camargo JBB u. a. (2023): Muscle hypertrophy responses to changes in training volume: a retrospective analysis. *Int J Sports Med* 44(8):599–604. https://pubmed.ncbi.nlm.nih.gov/37160161/
- [Abstract] Heaselgrave SR u. a. (2019): Dose-response relationship of weekly resistance-training volume and frequency on muscular adaptations in trained men. *Int J Sports Physiol Perform* 14(3):360–368. https://pubmed.ncbi.nlm.nih.gov/30160627/
- [Abstract] Amirthalingam T u. a. (2017): Effects of a modified German volume training program on muscular hypertrophy and strength. *J Strength Cond Res* 31(11):3109–3119. https://pubmed.ncbi.nlm.nih.gov/27941492/
- [Abstract] Hackett DA u. a. (2018): Effects of a 12-week modified German volume training program on muscle strength and hypertrophy – a pilot study. *Sports* 6(1):7. https://pmc.ncbi.nlm.nih.gov/articles/PMC5969184/
- [Abstract] Radaelli R u. a. (2015): Dose-response of 1, 3, and 5 sets of resistance exercise on strength, local muscular endurance, and hypertrophy. *J Strength Cond Res* 29(5):1349–1358. https://pubmed.ncbi.nlm.nih.gov/25546444/
- [Abstract] Kassiano W u. a. (2024): Bigger calves from doing higher resistance training volume? *Int J Sports Med* 45(10):739–747. https://pubmed.ncbi.nlm.nih.gov/38684187/
- [Abstract] Roth C u. a. (2023): Resistance training volume does not influence lean mass preservation during energy restriction in trained males. *Scand J Med Sci Sports* 33(1):20–35. https://pubmed.ncbi.nlm.nih.gov/36114738/
- [Abstract, Rückzug] Barbalho M u. a. (2020): Evidence of a ceiling effect for training volume in muscle hypertrophy and strength in trained men – less is more? *Int J Sports Physiol Perform* 15(2):268–277 – **zurückgezogen**. https://pubmed.ncbi.nlm.nih.gov/31188644/ · Rückzug „Upper threshold … in trained women“ (*MSSE* 2019): https://pubmed.ncbi.nlm.nih.gov/33986236/

**Minimal wirksame Dosis und Erhalt**

- [Volltext] Iversen VM, Norum M, Schoenfeld BJ, Fimland MS (2021): No time to lift? Designing time-efficient training programs for strength and hypertrophy: a narrative review. *Sports Med* 51(10):2079–2095. https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772/
- [Volltext, Preprint] Hermann T u. a. (2025): Without fail: muscular adaptations in single-set resistance training performed to failure or with repetitions-in-reserve. *Med Sci Sports Exerc* 57(9):2021–2031. https://pubmed.ncbi.nlm.nih.gov/40249908/ · Preprint: https://sportrxiv.org/index.php/server/preprint/view/484
- [Abstract] Bickel CS, Cross JM, Bamman MM (2011): Exercise dosing to retain resistance training adaptations in young and older adults. *Med Sci Sports Exerc* 43(7):1177–1187. https://pubmed.ncbi.nlm.nih.gov/21131862/
- [Abstract] Spiering BA, Mujika I, Sharp MA, Foulis SA (2021): Maintaining physical performance: the minimal dose of exercise needed to preserve endurance and strength over time. *J Strength Cond Res* 35(5):1449–1458. https://pubmed.ncbi.nlm.nih.gov/33629972/
- [Abstract] Tavares LD u. a. (2017): Effects of different strength training frequencies during reduced training period on strength and muscle cross-sectional area. *Eur J Sport Sci* 17(6):665–672. https://pubmed.ncbi.nlm.nih.gov/28316261/
- [Abstract] Androulakis-Korakakis P, Fisher JP, Steele J (2020): The minimum effective training dose required to increase 1RM strength in resistance-trained men. *Sports Med* 50(4):751–765. https://pubmed.ncbi.nlm.nih.gov/31797219/
- [Abstract] Fyfe JJ, Hamilton DL, Daly RM (2022): Minimal-dose resistance training for improving muscle mass, strength, and function. *Sports Med* 52(3):463–479. https://pubmed.ncbi.nlm.nih.gov/34822137/
- [Abstract] Steele J u. a. (2023): Long-term time-course of strength adaptation to minimal dose resistance training through retrospective longitudinal growth modeling. *Res Q Exerc Sport* 94(4):913–930. https://pubmed.ncbi.nlm.nih.gov/35591809/

**Indirektes Volumen, Einzel- vs. Mehrgelenkübungen**

- [Volltext] Schoenfeld B, Grgic J, Haun C, Itagaki T, Helms E (2019): Calculating set-volume for the limb muscles with the performance of multi-joint exercises. *Sports* 7(7):177. https://pmc.ncbi.nlm.nih.gov/articles/PMC6681288/
- [Abstract] Mannarino P u. a. (2021): Single-joint exercise results in higher hypertrophy of elbow flexors than multijoint exercise. *J Strength Cond Res* 35(10):2677–2681. https://pubmed.ncbi.nlm.nih.gov/31268995/
- [Abstract] Gentil P u. a. (2013): Effect of adding single-joint exercises to a multi-joint exercise resistance-training program on strength and hypertrophy in untrained subjects. *Appl Physiol Nutr Metab* 38(3):341–344. https://pubmed.ncbi.nlm.nih.gov/23537028/
- [Abstract] de França HS u. a. (2015): The effects of adding single-joint exercises to a multi-joint exercise resistance training program on upper body muscle strength and size in trained men. *Appl Physiol Nutr Metab* 40(8):822–826. https://pubmed.ncbi.nlm.nih.gov/26244600/
- [Abstract] Gentil P, Soares S, Bottaro M (2015): Single vs. multi-joint resistance exercises: effects on muscle strength and hypertrophy. *Asian J Sports Med* 6(2):e24057. https://pmc.ncbi.nlm.nih.gov/articles/PMC4592763/
- [Abstract] Barbalho M u. a. (2018): Does the addition of single joint exercises to a resistance training program improve changes in performance and anthropometric measures in untrained men? *Eur J Transl Myol* 28(4):7827. https://pmc.ncbi.nlm.nih.gov/articles/PMC6317138/
- [Abstract] Brandão L u. a. (2020): Varying the order of combinations of single- and multi-joint exercises differentially affects resistance training adaptations. *J Strength Cond Res* 34(5):1254–1263. https://pubmed.ncbi.nlm.nih.gov/32149887/
- [Abstract] Wakahara T, Fukutani A, Kawakami Y, Yanai T (2013): Nonuniform muscle hypertrophy: its relation to muscle activation in training session. *Med Sci Sports Exerc* 45(11):2158–2165. https://pubmed.ncbi.nlm.nih.gov/23657165/
- [Abstract] Ogasawara R u. a. (2012): Time course for arm and chest muscle thickness changes following bench press training. *Interv Med Appl Sci* 4(4):217–220. https://pmc.ncbi.nlm.nih.gov/articles/PMC3831787/
- [Abstract] Kubo K, Ikebukuro T, Yata H (2019): Effects of squat training with different depths on lower limb muscle volumes. *Eur J Appl Physiol* 119(9):1933–1942. https://pubmed.ncbi.nlm.nih.gov/31230110/
- [Abstract] Monte A u. a. (2026): Differential neuromuscular adaptations following multi-joint vs single-joint resistance exercise training. *Eur J Appl Physiol* 126(11):6065–6077. https://pubmed.ncbi.nlm.nih.gov/42570108/
- [Abstract] Leitão BFM u. a. (2024): Exercise selection plays an important role in inducing non-uniform acute responses on elbow flexors muscle thickness. *J Bodyw Mov Ther* 40:1097–1101. https://pubmed.ncbi.nlm.nih.gov/39593419/

**Muskeln, Erholung, Frequenz pro Einheit**

- [Volltext] Sousa CA, Zourdos MC, Storey AG, Helms ER (2024): The importance of recovery in resistance training microcycle construction. *J Hum Kinet* 91:205–223. https://pmc.ncbi.nlm.nih.gov/articles/PMC11057610/
- [Abstract] Chen TC, Lin KY, Chen HL, Lin MJ, Nosaka K (2011): Comparison in eccentric exercise-induced muscle damage among four limb muscles. *Eur J Appl Physiol* 111(2):211–223. https://pubmed.ncbi.nlm.nih.gov/20852880/
- [Abstract] Jamurtas AZ u. a. (2005): Comparison between leg and arm eccentric exercises of the same relative intensity on indices of muscle damage. *Eur J Appl Physiol* 95(2–3):179–185. https://pubmed.ncbi.nlm.nih.gov/16007451/
- [Abstract] Kataoka R u. a. (2026): Skeletal muscles do not compete for growth: activating additional muscle mass does not compromise changes in muscle size. *J Strength Cond Res* 40(9):1043–1049. https://pubmed.ncbi.nlm.nih.gov/42647752/
- [Abstract] Brigatto FA u. a. (2019): Effect of resistance training frequency on neuromuscular performance and muscle morphology after 8 weeks in trained men. *J Strength Cond Res* 33(8):2104–2116. https://pubmed.ncbi.nlm.nih.gov/29528962/
- [Abstract] Calzavara J, Barroso R (2026): Effects of weekly set distribution on volume load, lower-body strength, and quadriceps muscle thickness in trained men. *J Strength Cond Res* (online). https://pubmed.ncbi.nlm.nih.gov/42709978/

**Nähe zum Versagen, individuelle Unterschiede**

- [Abstract, Volltext Preprint] Robinson ZP u. a. (2024): Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy. *Sports Med* 54(9):2209–2231. https://pubmed.ncbi.nlm.nih.gov/38970765/ · Preprint: https://sportrxiv.org/index.php/server/preprint/view/295
- [Abstract] Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ (2023): Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy. *Sports Med* 53(3):649–665. https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748/
- [Abstract] Refalo MC u. a. (2024): Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve in resistance-trained individuals. *J Sports Sci* 42(1):85–101. https://pubmed.ncbi.nlm.nih.gov/38393985/
- [Abstract] Vasconcelos T u. a. (2026): Elbow flexor adaptations to failure versus repetitions-in-reserve training. *Muscles* 5(3):61. https://pmc.ncbi.nlm.nih.gov/articles/PMC13609929/
- [Abstract] Grgic J, Schoenfeld BJ, Orazem J, Sabol F (2022): Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy. *J Sport Health Sci* 11(2):202–211. https://pmc.ncbi.nlm.nih.gov/articles/PMC9068575/
- [Abstract] Damas F u. a. (2019): Myofibrillar protein synthesis and muscle hypertrophy individualized responses to systematically changing resistance training variables in trained young men. *J Appl Physiol* 127(3):806–815. https://pubmed.ncbi.nlm.nih.gov/31268828/
- [Abstract] Hammarström D u. a. (2020): Benefits of higher resistance-training volume are related to ribosome biogenesis. *J Physiol* 598(3):543–565. https://pubmed.ncbi.nlm.nih.gov/31813190/
- [Abstract] Lixandrão ME u. a. (2024): Higher resistance training volume offsets muscle hypertrophy nonresponsiveness in older individuals. *J Appl Physiol* 136(2):421–429. https://pubmed.ncbi.nlm.nih.gov/38174375/

**Coaching-Modell (nur zur Einordnung)**

- [Sekundärquelle] Renaissance Periodization: Bicep Training Guide (Volume Landmarks Bizeps). https://rpstrength.com/expert-advice/bicep-training-tips-hypertrophy · Training Volume Landmarks for Muscle Growth. https://rpstrength.com/training-volume-landmarks-muscle-growth/ – beide Seiten in dieser Umgebung nicht abrufbar, Zahlen aus Suchauszügen.
