# Vorbilder: Was macht Fitness-Apps professionell?

Recherche zum Ticket [02 – Vorbilder](../tickets/02-vorbilder.md). Stand: 11.11.2026.
Begriffe (Basis, Design, Akzentfarbe, Feinanpassung …) wie in [CONTEXT.md](../../../CONTEXT.md).

## Kurzfassung

- **Professionell wirkt vor allem Konsistenz:** wenige Schriftstufen, ein festes Abstandsraster, eine Akzentfarbe,
  ein Symbol-Stil. Android sagt es wörtlich: ungleiche Abstände gleicher Elemente lassen ein Design „haphazard“
  (zusammengewürfelt) wirken. In `css/app.css` stehen heute laut grober Zählung **45 verschiedene
  `font-size`-Angaben, 155 verschiedene `padding`-/`margin`-/`gap`-Angaben und 40 verschiedene `border-radius`-Angaben**
  (genaue Zahlen liefert Ticket 01).
- **Feste Zahlen aus den Leitlinien:** iOS-Text 17 pt, Minimum 11 pt; Tap-Ziel 44 × 44 pt (Android 48 dp,
  WCAG mindestens 24 px); Kontrast 4,5 : 1 für Text, 3 : 1 für Grafik und große Schrift; 8er-Raster mit
  4er-Feinraster; höchstens etwa 5 Segmente auf dem iPhone; 1–2 hervorgehobene Knöpfe je Ansicht.
- **Material 3 und Apple verlangen nicht alle Stufen:** Apple hat 11 Textstile, Material 15. Google schreibt
  ausdrücklich, dass ein Produkt wahrscheinlich nicht alle 15 braucht, und zeigt als Beispiel eine Auswahl von 5.
- **Diagramme nach Apple:** einfache Formen (Balken, Linie), etwa 4 Gitterlinien mit runden Schritten, Titel mit
  der Kernaussage („Gesamt: 1.234“), kleine Vorschau-Diagramme ohne Achsen, Farbe nie als einziges
  Unterscheidungsmerkmal, die aktuellen Werte farbig und den Rest zurückgenommen (so die Trend-Diagramme in
  Apple Fitness).
- **Gemeinsam haben die guten Fitness-Apps:** eine Hauptzahl oben, feste Farbbedeutungen (z. B. WHOOP:
  grün/gelb/rot nach festen Bereichen), Deutung in Klartext statt nackter Zahlen (Gentler Streak), wenige Tabs,
  plattformnahe Bedienelemente und einen einheitlichen Symbolsatz.
- **Liquid Glass gehört nach Apple nur in die Navigationsebene** (Leisten, Menüs). Auf Inhaltskarten ist es
  ausdrücklich unerwünscht, Glas auf Glas ebenso.

## Wie gelesen wurde (Kennzeichnung)

Jede Aussage in den Abschnitten 1–3 trägt eine Kennzeichnung:

- **[Beleg]**: steht so in der verlinkten Primärquelle und wurde dort im Wortlaut gelesen.
- **[Auszug]**: Die Primärquelle war in dieser Sitzung **nicht direkt abrufbar** (Netzwerkfreigabe fehlt, siehe
  unten). Gelesen wurde nur ein Auszug über die Websuche. Die Aussage ist plausibel, aber schwächer belegt.
- **[Einschätzung]**: eigene Schlussfolgerung oder Beobachtung, nicht von einer Quelle gedeckt.

**Grenzen:** Direkt lesbar waren nur `developer.apple.com` (HIG, WWDC-Mitschriften, Apple Design Awards,
„Behind the Design“), `developer.android.com` und GitHub-Rohdateien (Material Components, W3C-WCAG-Quelltext,
MDN-Quelltext). **Gesperrt** waren u. a. `m3.material.io`, `apple.com/newsroom`, `whoop.com`, `ouraring.com`,
`hevyapp.com`, `strava.com` und `sketch.com`. Die Abschnitte zu WHOOP, Oura, Hevy, Strong und Strava sind deshalb
dünner belegt als die zu Apple und Android. Soll das nachgeholt werden, müssen diese Hosts in den Netzwerk-Einstellungen
der Sitzung freigegeben werden.

---

## 1. Leitlinien von Apple (HIG) und Material 3

### 1.1 Schrift

**iOS-Textstile, Standardgröße „Large“** ([HIG Typography][hig-typo]) [Beleg]:

| Stil | Größe / Zeilenhöhe (pt) | Gewicht |
| --- | --- | --- |
| Large Title | 34 / 41 | Regular (betont: Bold) |
| Title 1 | 28 / 34 | Regular |
| Title 2 | 22 / 28 | Regular |
| Title 3 | 20 / 25 | Regular |
| Headline | 17 / 22 | **Semibold** |
| Body | 17 / 22 | Regular |
| Callout | 16 / 21 | Regular |
| Subhead | 15 / 20 | Regular |
| Footnote | 13 / 18 | Regular |
| Caption 1 | 12 / 16 | Regular |
| Caption 2 | 11 / 13 | Regular |

- Standardgröße iOS **17 pt**, Minimum **11 pt** [Beleg, [HIG Typography][hig-typo]].
- „Avoid light font weights“: Regular, Medium, Semibold und Bold bevorzugen, Ultralight, Thin und Light meiden,
  besonders bei kleiner Schrift [Beleg, [HIG Typography][hig-typo]].
- „Minimize the number of typefaces you use“: Zu viele Schriften verwischen die Hierarchie und lassen eine
  Oberfläche „poorly designed“ wirken [Beleg, [HIG Typography][hig-typo]].
- Hierarchie entsteht über **Gewicht, Größe und Farbe**. Fett ist ausdrücklich ein Mittel für eine zusätzliche
  Stufe [Beleg, [HIG Typography][hig-typo]].
- Bei drei und mehr Zeilen keine enge Zeilenhöhe [Beleg, [HIG Typography][hig-typo]].
- Eigene Schrift: Laut Apple funktioniert es gut, eine eigene Schrift für Überschriften und Zwischentitel zu nehmen
  und die **Systemschrift für Fließtext und Kleintext**, weil sie bei kleinen Größen am besten lesbar ist
  [Beleg, [HIG Branding][hig-branding]]. Das passt direkt auf die Frage, was ein Design an der Schrift ändern darf.
- Die SF-Schriften dürfen nicht eingebettet werden („don't embed system fonts“, [HIG Typography][hig-typo]).
  Laut Lizenz ist die San-Francisco-Schrift nur für Entwürfe („mock-ups“) von Apple-Apps gedacht
  [Beleg, [Apple Fonts, Lizenztext][apple-fonts]]. Für das Web heißt das: SF nur über
  `-apple-system`/`system-ui` nutzen, so wie Trainio es schon tut, und nie als Webfont [Einschätzung].

**Material 3** ([Material Components, Typography][m3-typo]) [Beleg]: 15 Stile in fünf Gruppen, Display
57/45/36, Headline 32/28/24, Title 22/16/14, Body 16/14/12, Label 14/12/11 (sp). Die Android-Doku sagt dazu:
„Your product will likely not need all 15 default styles … In this example, five sizes are chosen for a reduced
set“ [Beleg, [Compose Material 3][android-m3]].

**Folgerung** [Einschätzung]: Beide Systeme liefern einen Baukasten. Professionelle Apps nutzen davon eine
**kleine, feste Auswahl**, typisch 5–7 Stufen. Wichtig sind die gleichbleibende Zuordnung (welcher Stil wofür)
und die Abstufung über Gewicht und Farbe, nicht über viele Zwischengrößen. Auf dem iPhone entspricht 1 CSS-Pixel
1 pt, die Apple-Werte lassen sich also direkt als px übernehmen.

### 1.2 Raster und Abstände

- Android: „Android UI utilizes an **8 dp grid** for layout, components, and spacing“. Kleinere Elemente wie
  Symbole, Schrift und Teile von Komponenten werden „best aligned to a **4 dp grid**“. Und: „If using a baseline
  grid, stick to measurements of 4 and 8“ [Beleg, [Android Grids and units][android-grids]].
- Android: Gleiche Elemente mit ungleichen Abständen „can make designs appear haphazard“. Verwandte Inhalte
  gruppiert man durch „containment“ (Karten) [Beleg, [Android Layout basics][android-layout]].
- Material 3, Dichte: Dichtestufen verringern Polster oder Höhe in **4-dp-Schritten**. Hohe Dichte soll man
  ausdrücklich einschalten müssen und nicht als Standard bekommen. Bedienelemente sollen standardmäßig nicht unter
  48 × 48 dp fallen [Auszug, [M3 Grids & spacing – Density][m3-density]].
- Apple: Abstand zwischen Bedienelementen ist „as important as size“. Empfohlen werden **etwa 12 pt** Luft um
  Elemente mit sichtbarem Rahmen und **etwa 24 pt** um rahmenlose Elemente [Beleg, [HIG Accessibility][hig-a11y]].
- Apple: Gruppieren durch Leerraum, Container oder Trennlinien. Ausrichtung und Einrückung zeigen Zusammengehörigkeit
  und Unterordnung [Beleg, [HIG Layout][hig-layout]]. Sichere Bereiche (Dynamic Island, Home-Indikator) müssen
  frei bleiben [Beleg, [HIG Layout][hig-layout]].
- Apple nennt in der HIG keinen festen Seitenrand. Üblich sind auf dem iPhone **16 pt**, auf großen Modellen 20 pt
  (UIKit-Standardränder) [Einschätzung, in [UIKit layoutMargins][uikit-margins] ist kein Zahlenwert genannt].
- Material 3: Kompakte Fenster (Handy hochkant) sind **< 600 dp** breit [Beleg, [Android Window size classes][android-wsc]].
  Karten haben 16 dp seitliches Polster [Auszug, [M3 Cards specs][m3-cards]].

### 1.3 Tap-Größen

| Quelle | Wert |
| --- | --- |
| Apple HIG (iOS) | **44 × 44 pt** Standard, **28 × 28 pt** Minimum [Beleg, [HIG Accessibility][hig-a11y]]; „a hit region of at least 44x44 pt“ [Beleg, [HIG Buttons][hig-buttons]] |
| Android / Material | **48 × 48 dp** [Beleg, [Android Accessibility][android-a11y]] |
| WCAG 2.2, 2.5.8 (AA) | mindestens **24 × 24 CSS-px** oder genug Abstand [Beleg, [WCAG 2.2][wcag-target]] |

Außerdem: Eigene Knöpfe brauchen immer einen **gedrückten Zustand** [Beleg, [HIG Buttons][hig-buttons]].
In Diagrammen kann die ganze Zeichenfläche als Trefferfläche zum Wischen dienen, wenn die einzelnen Marken zu klein
sind [Beleg, [HIG Charts][hig-charts]].

### 1.4 Farbe und Kontrast

- **Eine Farbe, eine Bedeutung:** „Avoid using the same color to mean different things“ [Beleg, [HIG Color][hig-color]].
- **Akzentfarbe sparsam:** „Apply your app's accent color judiciously … use it intentionally for primary actions
  or status indicators“ [Beleg, [HIG Branding][hig-branding]].
- **1–2 hervorgehobene Knöpfe je Ansicht:** „Keep the number of prominent buttons to one or two per view“.
  Die bevorzugte Wahl wird über den **Stil** markiert, nicht über die Größe [Beleg, [HIG Buttons][hig-buttons]].
- **Semantische Stufen statt Einzelfarben:** iOS hat 3 Hintergrund-Ebenen (primary, secondary, tertiary, jeweils
  für einfache und gruppierte Ansichten) und 4 Textstufen (label, secondaryLabel, tertiaryLabel, quaternaryLabel)
  plus Platzhalter und Trennlinie [Beleg, [HIG Color][hig-color]].
- **Kontrast:** bis 17 pt mindestens **4,5 : 1**, ab 18 pt oder fett **3 : 1** [Beleg, [HIG Accessibility][hig-a11y]].
  Für eigene Farben in kleiner Schrift „strive for **7:1**“ [Beleg, [HIG Dark Mode][hig-dark]].
  Bedienelemente und für das Verständnis nötige Grafikteile (Diagrammlinien, Ränder von Eingabefeldern)
  brauchen **3 : 1** zur Umgebung [Beleg, [WCAG 2.2, 1.4.11][wcag-nontext]].
- **Nie nur Farbe:** Zusätzlich Form, Symbol oder Text verwenden. Rot-Grün ist das Standardbeispiel
  [Beleg, [HIG Color][hig-color], [HIG Accessibility][hig-a11y]].
- **Hell und Dunkel:** Jede eigene Farbe braucht eine helle, eine dunkle und eine kontrastreiche Variante
  [Beleg, [HIG Color][hig-color]]. Apple rät von einer appeigenen Hell/Dunkel-Einstellung ab, weil man sonst zwei
  Schalter bedienen muss [Beleg, [HIG Dark Mode][hig-dark]].
- **Material 3** arbeitet mit Farbrollen: primary für Hauptaktionen und aktive Zustände, secondary für weniger
  Wichtiges, tertiary für ausgleichende Akzente [Beleg, [Compose Material 3][android-m3]].
- **Workout-Bildschirm auf der Uhr:** keine vollflächige Hintergrundfarbe auf Ansichten, die lange stehen
  bleiben, „such as in a workout“ [Beleg, [HIG Color, watchOS][hig-color]].

### 1.5 Zahlen

- Ziffern mit fester Breite („tabular figures“) braucht man, damit Zahlen untereinander bündig stehen
  [Beleg, [SwiftUI monospacedDigit()][swiftui-mono]]. Im Web leistet das `font-variant-numeric: tabular-nums`:
  „numbers are all of the same size, allowing them to be easily aligned like in tables“
  [Beleg, [MDN font-variant-numeric][mdn-fvn]]. Ohne diese Einstellung sind die Ziffern der Systemschrift
  proportional, weshalb Apple dafür eine eigene Einstellung anbietet [Einschätzung].
- Für laufende Werte (Timer, Pausenuhr) verhindern feste Ziffernbreiten, dass die Zahl beim Zählen springt
  [Einschätzung].
- Einheiten und Kontext gehören in den Titel, die Achsenbeschriftung bleibt kurz. Für Screenreader schreibt man
  aus („60 Minuten“ statt „60m“, „6. Juni“ statt „6/6“) [Beleg, [HIG Charts][hig-charts]].
- Bei Bewegung (Workout) gilt: große Schrift, hoher Kontrast, das Wichtigste zuerst lesbar
  [Beleg, [HIG Workouts][hig-workouts]].

### 1.6 Diagramme

Aus [HIG Charts][hig-charts], [HIG Charting data][hig-charting], [WWDC22 „Design an effective chart“][wwdc-chart]
und [WWDC22 „Design app experiences with charts“][wwdc-chart-exp] [alles Beleg]:

- **Wenig zeigen:** „An effective chart highlights a few key pieces of information“. Nicht jeder Datensatz braucht
  ein Diagramm, manchmal reicht eine Liste.
- **Bekannte Formen:** Balken (Summen pro Zeitraum, Vergleiche), Linie (Verlauf, Trend), Punkte (einzelne Werte,
  Ausreißer). Neue Formen muss man erklären.
- **Achsen:** Balken beginnen bei 0. Für Werte weit weg von 0 (Puls, Körpergewicht) ist ein dynamischer Bereich
  besser. Feste Bereiche nur, wenn Min und Max eine Bedeutung haben (0–100 %).
- **Gitterlinien:** „around **four** horizontal grid lines“, Beschriftung in vertrauten Schritten (0, 5, 10 …;
  bei Tagen Wochenschritte).
- **Kleine Vorschau-Diagramme** brauchen weder Gitter noch Beschriftung noch Interaktion. Details kommen nach
  einem Tipp in der größeren Ansicht.
- **Titel mit Kernaussage:** statt einer Achsenbeschriftung ein Titel wie „Total Sales: 1,234 Pancakes“ oder
  gedeutet: „up 12%, totaling 1,234“.
- **Ausrichtung:** Die linke Kante des Diagramms fluchtet mit dem Rest des Bildschirms. Dafür kann die Y-Achse auf
  die rechte Seite.
- **Hierarchie:** Die Daten sind am auffälligsten, Achsen und Text ordnen sich unter. Mit mehr farblichem Gewicht
  lassen sich bestimmte Werte betonen: „Trend charts in the Fitness app use this strategy to highlight your recent
  activity“. Health nimmt beim Puls die Farbe heraus, um Minimum und Maximum hervorzuheben.
- **Farben für Kategorien:** gleiches visuelles Gewicht (Sättigung und Helligkeit angleichen), leicht zu benennen
  und gut unterscheidbar, Kontrast auch zum Hintergrund, zusätzlich Formen (Health: zwei Punktformen für den
  Blutdruck).
- **Ein Diagramm-System:** Gleiche Daten bekommen in Vorschau und Detail denselben Stil, dieselben Farben und
  dieselben Marken. Andere Typen und Stile nur dort, wo sich die Diagramme wirklich unterscheiden sollen.
- **Interaktion ergänzt nur:** Wichtiges darf sich nicht erst beim Antippen zeigen.

### 1.7 Material und Glas (Liquid Glass)

Aus [HIG Materials][hig-materials], [HIG Color][hig-color] und [WWDC25 „Meet Liquid Glass“][wwdc-glass]
[alles Beleg]:

- Liquid Glass bildet eine **eigene Ebene für Bedienung und Navigation** über dem Inhalt.
  „Don't use Liquid Glass in the content layer.“ Eine Tabelle aus Glas „would compete with other elements and
  muddy the hierarchy“.
- „**Avoid glass on glass**“: Gestapelte Glaselemente wirken unruhig. Auf Glas liegende Elemente bekommen Füllung,
  Transparenz oder Vibrancy, aber kein zweites Glas.
- Sparsam einsetzen. Einfärben („tinting“) nur für die Hauptaktion: „When every element is tinted, nothing stands
  out.“ Farbe gehört eher in die Inhaltsebene.
- Varianten: „regular“ (Standard, lesbar auf allem) und „clear“ (nur über Fotos und Videos, bei hellem Untergrund
  mit etwa **35 % dunkler Abdunkelung**). Beide nie mischen.
- Barrierefreiheit: „Transparenz reduzieren“ macht das Glas milchiger, „Kontrast erhöhen“ macht es weitgehend
  schwarz oder weiß mit Rand, „Bewegung reduzieren“ schaltet die elastischen Effekte ab.
- Mit Liquid Glass ist die Schrift in Hinweisfenstern und beim Onboarding „bolder and left-aligned“. Kapselformen
  und konzentrische Ecken ziehen sich durch das ganze System [Beleg, [WWDC25 „Get to know the new design system“][wwdc-ds]].

### 1.8 Komponenten und Texte

- **Segmente:** „no more than about **five** segments on iPhone“ [Beleg, [HIG Segmented controls][hig-segmented]].
- **Menüs von unten (Sheets):** nur eins auf einmal. Abbrechen steht links, Fertig rechts. Die mittlere Höhe
  eignet sich für schrittweises Aufdecken, mit Griff zum Ziehen [Beleg, [HIG Sheets][hig-sheets]].
- **Listen:** Für Text sind Zeilen am besten zu überfliegen. Zeilentexte kurz halten, lange Inhalte in eine
  Detailansicht verlagern [Beleg, [HIG Lists and tables][hig-lists]].
- **Symbole:** einheitliche Größe, Detailtiefe und Strichstärke, Strichstärke passend zum Text daneben
  [Beleg, [HIG Icons][hig-icons]]. Für vertraute Aktionen vertraute Symbole [Beleg, [HIG Buttons][hig-buttons]].
  SF Symbols unterliegen eigenen Nutzungsbedingungen (u. a. nicht in App-Icons oder Logos)
  [Beleg, [HIG SF Symbols][hig-sfsymbols]]. Laut Apple-Entwicklerforum deckt die Lizenz den Einsatz auf Websites
  nicht [Auszug, [Developer Forums][forum-sfsymbols]].
- **Texte:** „If you can use fewer words, do so.“ Knöpfe mit Verb beschriften, nicht verspielt („Send“ statt
  „Let's do it!“). Großschreibung je Elementtyp einheitlich. Kein „oops“ in Fehlermeldungen. **Leere Zustände**
  nennen den nächsten Schritt und bieten möglichst gleich den Knopf dafür an [Beleg, [HIG Writing][hig-writing]].
  Gelegentliche Emojis im *Tonfall* der Texte sind laut Apple in Ordnung [Beleg, [HIG Branding][hig-branding]].
- **Bewegung:** nur mit Zweck, kurz und präzise, abschaltbar, keine eigene Animation bei häufigen Handgriffen,
  nie warten lassen [Beleg, [HIG Motion][hig-motion]].
- **Laden:** sofort etwas zeigen (Platzhalter) statt einer leeren Fläche [Beleg, [HIG Loading][hig-loading]].
- **Aktivitätsringe:** Apples drei Ringe sind geschützt. Andere ringförmige Elemente soll man durch Abstand,
  Linien, Beschriftung, Farbe und Größe klar davon absetzen [Beleg, [HIG Activity rings][hig-rings]].

---

## 2. Gut gestaltete Fitness- und Tracking-Apps

### 2.1 Auszeichnungen (Auswahl mit Fitness-Bezug)

| App | Auszeichnung | Begründung der Jury (Kern) |
| --- | --- | --- |
| **Gentler Streak** | Apple Design Award 2024, Social Impact (Gewinner); ADA-Finalist 2023 Visuals and Graphics; Apple Watch App of the Year 2022 | „subtle and consistently pleasing design language“, Gesundheitsdaten „smartly organized“, die Monatsübersicht zeigt den Stand gegenüber der eigenen Geschichte, „less about hard comparisons and more about progress“ [Beleg, [ADA 2024][ada-2024], [Behind the Design][btd-gentler]] |
| **Any Distance** | ADA 2023, Visuals and Graphics (Gewinner) | Trainingswerte in „eye-popping and easily shareable formats“ [Beleg, [ADA 2023][ada-2023]] |
| **Flighty** (keine Fitness-App, aber datenlastig) | ADA 2023, Interaction (Gewinner) | „key information where you need it most, an intuitive interface“ [Beleg, [ADA 2023][ada-2023]] |
| **Slopes** (Ski-Tracker) | ADA 2022, Interaction (Gewinner) | „Packed with a mountain of data but as easy to navigate as a nice green run“ [Beleg, [ADA 2022][ada-2022]] |
| **Train Fitness** (Krafttraining-Logger) | ADA 2025, Inclusivity (Finalist) | erfasst Training über Uhr- und AirPods-Bewegung ohne Bildschirm [Beleg, [ADA 2025][ada-2025]] |
| **SmartGym** (Krafttraining) | App Store Award 2023, Apple Watch App of the Year | [Auszug, [Apple Newsroom 2023][newsroom-2023]] |

### 2.2 Was die Apps im Einzelnen zeigen

**Apple Fitness und Health**

- Die Trend-Diagramme in Fitness betonen die **jüngsten Werte farbig**, der Rest tritt zurück. Health zeigt kleine
  Trend-Diagramme und öffnet beim Antippen die große Fassung im **gleichen Stil**. Health nutzt beim Blutdruck
  Form und Farbe zugleich [Beleg, [WWDC22][wwdc-chart], [HIG Charting data][hig-charting], [HIG Charts][hig-charts]].
- Die Aktivitätsringe haben feste Farben und Bedeutungen und stehen immer auf Schwarz [Beleg, [HIG Activity rings][hig-rings]].
- Während des Trainings: nur das Nötige, ein eigenes, sofort erkennbares Aussehen für das laufende Training,
  große, kontrastreiche Werte und eine Zusammenfassung am Ende [Beleg, [HIG Workouts][hig-workouts]].

**Gentler Streak**

- „Statistics are just numbers. Without knowing how to interpret them, they are meaningless.“ Die App stellt
  Statistik verständlich neu dar und erklärt statt nur zu zählen [Beleg, [Behind the Design][btd-gentler]].
- Daten in „simple, easy-to-understand charts“, „colorful, approachable design“, gebaut vor allem mit UIKit,
  also mit Systembausteinen [Beleg, [Behind the Design][btd-gentler]].
- Designgrundsatz: Man soll sich vom ersten Öffnen an zu Hause fühlen („feel at home“), als Balance aus vertrauten
  UX-Bausteinen und eigener Gestaltung [Auszug, [Sketch-Interview][sketch-gentler]].

**Any Distance**

- „SF Symbols is the single greatest contribution to design Apple has ever made“: Die App stützt sich stark auf
  Apples Symbolsatz. Teilbare Karten sind der Kern. Pro Wert legt man über ein Augen-Symbol fest, ob er geteilt
  wird [Beleg, [Behind the Design][btd-anydistance]]. Das ist relevant für Trainios Teilen-Bild.

**Flighty** (als Muster für Datendichte)

- „We want Flighty to work so well that it feels almost boringly obvious.“ Vorbild sind Flughafentafeln mit
  **einer Zeile pro Flug**: „they've had 50 years of figuring out what's important“
  [Beleg, [Behind the Design][btd-flighty]].

**WHOOP**

- Die Startseite zeigt die drei Hauptwerte Schlaf, Erholung und Belastung auf einen Blick. Der Umbau folgte vor
  allem dem Feedback der Mitglieder [Auszug, [WHOOP Locker][whoop-home]].
- Die Farbe der Erholung ist an **feste Bereiche** gebunden: grün 67–100 %, gelb 34–66 %, rot 0–33 %
  [Auszug, [WHOOP Developer][whoop-dev], [WHOOP Locker][whoop-recovery]].
- Für die Datendarstellung holte WHOOP gezielt einen Informationsdesigner (Martin Oberhäuser)
  [Auszug, [WHOOP Locker][whoop-designer]].
- Die Oberfläche ist fast komplett schwarz, damit die Datenpunkte herausstechen [Auszug, Sekundärquelle
  [925 Studios][whoop-925], nicht geprüft].

**Oura**

- Umbau von fünf auf **drei Tabs** (Today, Vitals, My Health). Die drei Scores stehen oben auf „Today“, darunter
  ein zur Tageszeit passender Hinweis. Begründung: „commitment to simplicity in design“
  [Auszug, [Oura-Blog][oura-blog]].

**Hevy**

- Neu gebaut, damit die App auf iOS mit Liquid Glass und auf Android mit Material 3 „native“ wirkt
  (Community-Update, laut Auszug vom Juli 2026) [Auszug, [Hevy][hevy-update]].
- Beim Eintragen kann man wählen, welche Vorwerte („previous“) neben jedem Satz stehen
  [Auszug, [Hevy Workout-Einstellungen][hevy-settings]].

**Strong**

- Eine offizielle Design-Quelle wurde nicht gefunden. Laut App-Store-Text gibt es eine eingebaute Pausenuhr und
  Satzarten (Aufwärmen, Versagen, Drop-Satz) [Auszug, [App Store][strong-appstore]].
- Satz-Tabelle mit festen Spalten (Satz, Vorher, kg, Wdh., Haken) und reduziertes, ruhiges Erscheinungsbild
  [Einschätzung, aus Kenntnis der App, hier nicht belegt].

**Strava**

- Keine offizielle Design-Quelle gefunden. Fachpresse: Der Bereich „Du“ bündelt den Fortschritt mit persönlichen
  Fortschrittsdiagrammen [Auszug, Sekundärquelle [BikeRadar][strava-bikeradar]]. Für die Basis bringt Strava wenig
  Belastbares.

### 2.3 Gemeinsamkeiten

| Merkmal | Wo gesehen | Stärke |
| --- | --- | --- |
| **Eine Hauptzahl oben**, Details darunter oder nach einem Tipp | WHOOP (3 Werte), Oura (Scores oben), Apple Workouts, Apple-Diagrammregeln | Beleg/Auszug |
| **Deutung in Klartext** neben der Zahl | Gentler Streak, Oura (Hinweis), Apple (Titel mit Kernaussage) | Beleg |
| **Feste Farbbedeutung** (Ampel, Ringfarben), immer gleich | WHOOP, Apple Aktivitätsringe | Beleg/Auszug |
| **Wenig Farbe:** neutrale Flächen, Farbe nur für Daten, Status und Hauptaktion | Apple HIG, WHOOP (schwarz), Fitness-Trends (grau/farbig) | Beleg + Einschätzung |
| **Wenige Tabs** und Ablenkungsfreiheit im Training | Oura (5 → 3), Apple Workouts | Beleg/Auszug |
| **Plattformnahe Bausteine** plus eigene Note | Hevy (Liquid Glass/M3), Gentler Streak (UIKit, „zu Hause fühlen“) | Auszug/Beleg |
| **Ein Symbolsatz** statt gemischter Bilder oder Emojis | Any Distance (SF Symbols), HIG Icons | Beleg |
| **Einfache Diagramme** (Balken, Linie), Vorschau und Detail im selben Stil | Gentler Streak, Apple Health/Fitness | Beleg |
| **Fortschritt gegenüber sich selbst** statt gegenüber anderen | Gentler Streak (Monatsübersicht), Hevy (Vorwerte je Satz) | Beleg/Auszug |
| **Teilbare, gestaltete Karten** | Any Distance | Beleg |
| **Tabellarisches Satz-Logging** mit Vorwerten | Hevy, Strong | Auszug/Einschätzung |

**Karten oder Listen?** [Einschätzung, gestützt auf [HIG Lists][hig-lists] und
[Android Layout basics][android-layout]]: Bei Apple-nahen Apps sind **Listen** der Normalfall für gleichartige
Einträge (Übungen, Sätze, Verlauf, Einstellungen), als gruppierte Liste mit abgerundetem Block. **Karten** stehen
für in sich geschlossene Einheiten mit eigener Aussage (Score, Diagramm, Kennzahl). Unprofessionell wirkt es,
jede Zeile als eigene Karte zu bauen oder Karten in Karten zu stecken.

---

## 3. Übertragbare Regeln für eine Web-App ohne Build-Step

Alles ist mit CSS-Variablen in `css/app.css` umsetzbar, ein Build-Schritt ist nicht nötig.

| Regel | Wert | Umsetzung im Web | Grundlage |
| --- | --- | --- | --- |
| Feste Schriftstufen | 5–7 Stufen, 11 px Minimum, 17 px Fließtext | `--t-…`-Tokens, keine freien `font-size`-Werte | HIG, M3 [Beleg] · Stufenzahl [Einschätzung] |
| Höchstens 2 Schriftfamilien | System für Text/Kleintext, optional eine Display-Schrift für Titel/Zahlen | `--font` / `--font-display` (gibt es schon) | HIG Typography, Branding [Beleg] |
| Keine dünnen Schnitte | Gewichte 400/500/600/700 | `font-weight` nur aus diesen | HIG [Beleg] |
| 4/8-Raster | Abstände 4, 8, 12, 16, 24, 32, 48 | `--s-1 … --s-7` | Android [Beleg] · Skala [Einschätzung] |
| Seitenrand | 16 px bei 390 px Breite + `env(safe-area-inset-*)` | `max(16px, env(…))` (gibt es schon) | iOS-Praxis [Einschätzung], Safe Areas [Beleg] |
| Tap-Ziel | ≥ 44 × 44 px, Abstand zwischen Zielen | `min-height: 44px`, kleine Symbole mit Polster | HIG [Beleg], WCAG 24 px als absolute Untergrenze [Beleg] |
| Hervorgehobene Knöpfe | höchstens 1–2 je Ansicht | eine Klasse für „primär“ | HIG Buttons [Beleg] |
| Farben | 1 Akzentfarbe, 3 Signalfarben mit fester Bedeutung, Rest neutral (3 Flächen-, 3–4 Textstufen) | semantische Tokens statt Farbwerten im Code | HIG Color [Beleg] · Anzahl [Einschätzung] |
| Kontrast | Text 4,5 : 1 (klein besser 7 : 1), Grafik/Ränder 3 : 1, in Hell **und** Dunkel | Prüfung im Test (Kontrastrechner) | HIG, WCAG [Beleg] |
| Ziffern | feste Breite bei allen veränderlichen oder untereinander stehenden Zahlen | `font-variant-numeric: tabular-nums` | MDN, Apple [Beleg] |
| Zahl und Einheit | Zahl groß, Einheit kleiner und sekundär, deutsches Format | `Intl.NumberFormat('de-DE')` | [Einschätzung] |
| Diagramme | Balken/Linie, ~4 Gitterlinien, runde Schritte, Titel = Kernaussage, Vorschau ohne Achsen, aktuell = Akzent, Rest = grau | ein gemeinsamer Diagramm-Stil in `js/charts.js` | HIG Charts, WWDC22 [Beleg] |
| Segmente | ≤ 5 auf dem iPhone | sonst Liste oder scrollbare Leiste | HIG [Beleg] |
| Symbole | ein Satz, eine Strichstärke passend zur Schrift, als SVG | freie Sätze: Lucide (ISC), Phosphor (MIT), Tabler (MIT), Material Symbols (Apache 2.0) | HIG Icons [Beleg]; Lizenzen laut GitHub [Beleg] |
| Ecken | wenige Stufen; inneres Element = äußerer Radius minus Abstand (konzentrisch) | `--r-…`-Tokens | M3 Shape-Skala mit 5 Stufen [Beleg], Konzentrik bei Apple [Beleg] · Formel [Einschätzung] |
| Dichte | Änderungen in 4-px-Schritten, dichter nur auf Wunsch | Dichte-Regler in der Feinanpassung | M3 Density [Auszug] |
| Bewegung | kurz, zweckgebunden, abschaltbar | `@media (prefers-reduced-motion: reduce)` | HIG Motion [Beleg] |
| Glas | nur Navigationsebene, kein Glas auf Glas, Rückfall ohne Unschärfe | `backdrop-filter` nur an Leisten und Menüs; `prefers-contrast: more` beachten | HIG Materials, WWDC25 [Beleg] · Web-Umsetzung [Einschätzung] |

Hinweise zur Web-Umsetzung [Einschätzung, im Prototyp zu prüfen]:

- iOS Safari kennt `font: -apple-system-body` (und headline, subheadline, footnote, caption …). Damit folgt die
  Schrift der Textgröße aus den iOS-Einstellungen (Dynamic Type) [Auszug, [WebKit-Blog][webkit-sysfont]]. Trainio hat
  eine eigene Schriftgrößen-Einstellung (`--fs`). Ob man beides koppelt, ist eine eigene Entscheidung.
- Ob `prefers-reduced-transparency` in iOS Safari unterstützt wird, ist ungeprüft. Ohne Unterstützung braucht
  Liquid Glass einen eigenen Schalter in der Feinanpassung (gibt es mit „Glas-Hintergrund“ schon).

---

## 4. Was das für Trainio heißt

Vorschläge für die Basis (Ticket 03), keine Entscheidungen:

1. **Schriftstufen fest begrenzen:** etwa **5 Textstufen + 1 Zahlenstufe**, angelehnt an iOS (z. B. 34 Seitentitel,
   22 Abschnitt, 17 Text und Zeilentitel, 15 Nebenzeile, 13 Beschriftung und Achsen, dazu eine große Zahlenstufe
   für Score, Timer und Spotlight). Hierarchie über Gewicht und Textfarbe statt über Zwischengrößen. Heute stehen
   45 verschiedene `font-size`-Angaben im CSS.
2. **Eigene Schrift nur für Titel und große Zahlen:** Ein Design darf Display-Schrift und Gewichte tauschen.
   Fließtext und Kleintext bleiben in allen Designs Systemschrift (HIG Branding). So bleiben die Designs markant und
   trotzdem überall gleich gut lesbar.
3. **4/8-Raster mit 7 Abstands-Tokens** (4–48 px), Seitenrand 16 px. Der Dichte-Regler verschiebt in 4-px-Schritten.
   Heute stehen 155 verschiedene Abstandsangaben im CSS.
4. **Tap-Ziele ab 44 × 44 px**, auch für kleine Symbol-Knöpfe (größere Trefferfläche als das sichtbare Symbol).
   Jeder Knopf bekommt einen gedrückten Zustand.
5. **Farbe als System:** pro Design eine Akzentfarbe, dazu 3 Signalfarben mit fester, designübergreifender
   Bedeutung (gut / Achtung / schlecht, z. B. für Workout-Score und Trainio-Score). Alles andere bleibt neutral in
   3 Flächen- und 3–4 Textstufen. Höchstens 1–2 hervorgehobene Knöpfe pro Ansicht. Kontrast in Hell und Dunkel
   im Test prüfen. Als Modus „Automatisch“ voreinstellen, weil Apple von appeigenen Hell/Dunkel-Schaltern abrät.
6. **Zahlen einheitlich darstellen:** `tabular-nums` überall, wo Zahlen sich ändern oder untereinander stehen
   (Satz-Tabelle, Timer, Verlauf). Zahl groß, Einheit klein und sekundär, deutsches Zahlenformat aus einer
   gemeinsamen Hilfsfunktion.
7. **Eine Hauptzahl pro Karte plus ein Satz Klartext:** Das passt direkt zum Trainio-Score (0–100 plus Klartext)
   und folgt Gentler Streak, Oura und Apples Regel „Titel mit Kernaussage“.
8. **Ein Diagramm-Stil für alle Diagramme:** nur Balken und Linie, etwa 3–4 Gitterlinien mit runden Schritten,
   Y-Achse rechts, Titel mit Kernaussage, Vorschau-Diagramme (Startseiten-Kacheln) ohne Achsen. Aktueller Zeitraum
   in der Akzentfarbe, Vergleich grau. Farbe nie als einziges Merkmal, Vorschau und Detail im selben Stil.
9. **Listen für Gleichartiges, Karten für Abgeschlossenes:** Übungen, Sätze, Verlauf und Einstellungen als gruppierte
   Listen; Score, Diagramm und Kennzahl als Karte. Keine Karte in einer Karte.
10. **Ein Symbolsatz statt Emojis in Bedienelementen:** ein freier SVG-Satz (z. B. Lucide oder Phosphor) mit einer
    Strichstärke, die zur Schrift passt. Kein SF-Webfont (Lizenz nur für Entwürfe) und keine SF Symbols (Einsatz im
    Web laut Forum nicht gedeckt).
    Emojis höchstens noch im Tonfall von Texten (z. B. bei Glückwünschen).
11. **Liquid Glass richtig einsetzen:** Glas nur für Tab-Leiste, Kopfleiste, schwebende Knöpfe und Menüs von unten,
    nicht für Inhaltskarten. Kein Glas auf Glas. Nur die Hauptaktion einfärben.
12. **Laufendes Workout als eigene, ruhige Ansicht:** große Zahlen, hoher Kontrast, nur das Nötige (HIG Workouts).
    Das stützt das Spotlight von Fokus als Markenzeichen. Den Workout-Score-Ring deutlich von Apples
    Aktivitätsringen absetzen (ein Ring, eigene Farbe, Beschriftung).

Dazu passt eine Arbeitsteilung, die Ticket 03 festlegen könnte [Einschätzung]: **Die Basis legt fest**
Stufen-Anzahl, Raster, Tap-Größen, Bedeutung der Signalfarben, Diagramm-Grammatik und Komponenten-Aufbau.
**Ein Design legt fest** Display-Schrift, Gewichte, Radius-Werte, Material (flach oder Glas), Akzentfarbe und Bewegung.

---

## Quellen

**Apple – Human Interface Guidelines** (direkt gelesen, Stand Nov. 2026):
[Typography][hig-typo] ·
[Layout][hig-layout] ·
[Accessibility][hig-a11y] ·
[Color][hig-color] ·
[Dark Mode][hig-dark] ·
[Branding][hig-branding] ·
[Buttons][hig-buttons] ·
[Charts][hig-charts] ·
[Charting data][hig-charting] ·
[Materials][hig-materials] ·
[Workouts][hig-workouts] ·
[Activity rings][hig-rings] ·
[Icons][hig-icons] ·
[Lists and tables][hig-lists] ·
[Segmented controls][hig-segmented] ·
[Sheets][hig-sheets] ·
[Writing][hig-writing] ·
[Motion][hig-motion] ·
[Loading][hig-loading]

**Apple – Sonstiges** (direkt gelesen):

- WWDC22 [„Design an effective chart“][wwdc-chart] und [„Design app experiences with charts“][wwdc-chart-exp]
- WWDC25 [„Meet Liquid Glass“][wwdc-glass] und [„Get to know the new design system“][wwdc-ds]
- Entwickler-Doku: [SwiftUI `monospacedDigit()`][swiftui-mono], [UIKit `layoutMargins`][uikit-margins],
  [Apple Fonts mit SF-Lizenztext][apple-fonts], [HIG SF Symbols][hig-sfsymbols]
- Nur Auszug: [Developer Forums – SF Symbol License][forum-sfsymbols]
- Apple Design Awards [2022][ada-2022], [2023][ada-2023], [2024][ada-2024], [2025][ada-2025]
- Behind the Design: [Gentler Streak][btd-gentler], [Any Distance][btd-anydistance], [Flighty][btd-flighty]

**Google / Android / Material 3:**

- Direkt gelesen: [Grids and units][android-grids], [Layout basics][android-layout],
  [Material Design 3 in Compose][android-m3], [Make apps more accessible][android-a11y],
  [Window size classes][android-wsc], [Material Components Android – Typography (GitHub)][m3-typo]
- Nur Auszug (m3.material.io gesperrt): [M3 Grids & spacing – Density][m3-density], [M3 Cards specs][m3-cards]

**Web-Standards und Lizenzen** (direkt gelesen, WCAG und MDN über ihre Quelltexte auf GitHub):

- [WCAG 2.2 – 2.5.8 Target Size (Minimum)][wcag-target], [WCAG 2.2 – 1.4.11 Non-text Contrast][wcag-nontext]
- [MDN – `font-variant-numeric`][mdn-fvn]
- Symbol-Lizenzen: [Lucide (ISC)](https://github.com/lucide-icons/lucide/blob/main/LICENSE),
  [Phosphor (MIT)](https://github.com/phosphor-icons/core/blob/main/LICENSE),
  [Tabler (MIT)](https://github.com/tabler/tabler-icons/blob/main/LICENSE),
  [Material Symbols (Apache 2.0)](https://github.com/google/material-design-icons/blob/master/LICENSE)
- Nur Auszug: [WebKit – Using the System Font in Web Content][webkit-sysfont]

**Hersteller und Presse** (nur Auszug, Seiten in dieser Sitzung gesperrt):

- Gentler Streak: [Sketch-Interview][sketch-gentler]
- WHOOP: [The all-new WHOOP Home Screen][whoop-home], [WHOOP 101 (Developer)][whoop-dev],
  [How does WHOOP Recovery work][whoop-recovery], [Why WHOOP uses the best information designer in the world][whoop-designer],
  Sekundärquelle [925 Studios – WHOOP Design Breakdown][whoop-925]
- Oura: [New Oura App Experience][oura-blog]
- Hevy: [Community-Update][hevy-update], [Workout-Einstellungen][hevy-settings]
- Strong: [App Store][strong-appstore]
- Strava: Sekundärquelle [BikeRadar – Strava testet neues Layout][strava-bikeradar]
- [Apple Newsroom – App Store Awards 2023][newsroom-2023]

[hig-typo]: https://developer.apple.com/design/human-interface-guidelines/typography
[hig-layout]: https://developer.apple.com/design/human-interface-guidelines/layout
[hig-a11y]: https://developer.apple.com/design/human-interface-guidelines/accessibility
[hig-color]: https://developer.apple.com/design/human-interface-guidelines/color
[hig-dark]: https://developer.apple.com/design/human-interface-guidelines/dark-mode
[hig-branding]: https://developer.apple.com/design/human-interface-guidelines/branding
[hig-buttons]: https://developer.apple.com/design/human-interface-guidelines/buttons
[hig-charts]: https://developer.apple.com/design/human-interface-guidelines/charts
[hig-charting]: https://developer.apple.com/design/human-interface-guidelines/charting-data
[hig-materials]: https://developer.apple.com/design/human-interface-guidelines/materials
[hig-workouts]: https://developer.apple.com/design/human-interface-guidelines/workouts
[hig-rings]: https://developer.apple.com/design/human-interface-guidelines/activity-rings
[hig-icons]: https://developer.apple.com/design/human-interface-guidelines/icons
[hig-lists]: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
[hig-segmented]: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
[hig-sheets]: https://developer.apple.com/design/human-interface-guidelines/sheets
[hig-writing]: https://developer.apple.com/design/human-interface-guidelines/writing
[hig-motion]: https://developer.apple.com/design/human-interface-guidelines/motion
[hig-loading]: https://developer.apple.com/design/human-interface-guidelines/loading
[wwdc-chart]: https://developer.apple.com/videos/play/wwdc2022/110340/
[wwdc-chart-exp]: https://developer.apple.com/videos/play/wwdc2022/110342/
[wwdc-glass]: https://developer.apple.com/videos/play/wwdc2025/219/
[wwdc-ds]: https://developer.apple.com/videos/play/wwdc2025/356/
[swiftui-mono]: https://developer.apple.com/documentation/swiftui/view/monospaceddigit()
[uikit-margins]: https://developer.apple.com/documentation/uikit/uiview/layoutmargins
[apple-fonts]: https://developer.apple.com/fonts/
[hig-sfsymbols]: https://developer.apple.com/design/human-interface-guidelines/sf-symbols
[forum-sfsymbols]: https://developer.apple.com/forums/thread/757407
[ada-2022]: https://developer.apple.com/design/awards/2022/
[ada-2023]: https://developer.apple.com/design/awards/2023/
[ada-2024]: https://developer.apple.com/design/awards/2024/
[ada-2025]: https://developer.apple.com/design/awards/2025/
[btd-gentler]: https://developer.apple.com/news/?id=3m0ht22s
[btd-anydistance]: https://developer.apple.com/news/?id=uiiopcl8
[btd-flighty]: https://developer.apple.com/news/?id=970ncww4
[android-grids]: https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units
[android-layout]: https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics
[android-m3]: https://developer.android.com/develop/ui/compose/designsystems/material3
[android-a11y]: https://developer.android.com/guide/topics/ui/accessibility/apps
[android-wsc]: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
[m3-typo]: https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md
[m3-density]: https://m3.material.io/foundations/layout/grids-spacing/density
[m3-cards]: https://m3.material.io/components/cards/specs
[wcag-target]: https://www.w3.org/TR/WCAG22/#target-size-minimum
[wcag-nontext]: https://www.w3.org/TR/WCAG22/#non-text-contrast
[mdn-fvn]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
[webkit-sysfont]: https://webkit.org/?p=3709
[sketch-gentler]: https://www.sketch.com/blog/gentler-streak/
[whoop-home]: https://www.whoop.com/thelocker/the-all-new-whoop-home-screen/
[whoop-dev]: https://developer.whoop.com/docs/whoop-101
[whoop-recovery]: https://www.whoop.com/thelocker/how-does-whoop-recovery-work-101/
[whoop-designer]: https://www.whoop.com/thelocker/why-whoop-uses-the-best-information-designer-in-the-world
[whoop-925]: https://www.925studios.co/blog/whoop-design-breakdown
[oura-blog]: https://ouraring.com/blog/new-oura-app-experience/
[hevy-update]: https://www.hevyapp.com/community-updates/july-26/
[hevy-settings]: https://www.hevyapp.com/features/workout-settings/
[strong-appstore]: https://apps.apple.com/app/id464254577
[strava-bikeradar]: https://www.bikeradar.com/news/strava-beta-test-layout/
[newsroom-2023]: https://www.apple.com/newsroom/2023/11/apple-unveils-app-store-award-winners-the-best-apps-and-games-of-2023/
