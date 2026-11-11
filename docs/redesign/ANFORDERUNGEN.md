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
- **Alles folgt dem Design:** Teilen-Bild, Workout-Score-Ring & Konfetti, Diagramme und Animationen.
- Sprache: Deutsch.

## 3. Basis

Die neue gemeinsame Gestaltung, auf der alle vier Designs aufsetzen: Raster & Abstände, Schriftstufen,
Zahlen-Darstellung, Komponenten (Karte, Liste, Knopf, Eingabe, Segment, Kachel, Fenster, Menü),
Diagramm-Stil und Symbole.

- ⏳ Ausgangslage – [Bestandsaufnahme: Was wirkt heute unprofessionell?](tickets/01-bestandsaufnahme.md)
- ⏳ Vorbilder – [Vorbilder: Was macht Fitness-Apps professionell?](tickets/02-vorbilder.md)
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

## 5. Darstellung & Feinanpassung

- Jedes Design legt Ecken, Schrift, Dichte und Glas-Hintergrund **selbst** fest.
- Die Regler zum Übersteuern **bleiben**, stehen aber in einer eigenen Gruppe **Feinanpassung ganz am Ende**
  der Darstellung, nicht mehr prominent oben.
- ⏳ Was oben bleibt, wie die Akzentfarbe gewählt wird und was mit vorhandenen Einstellungen passiert –
  [Darstellung neu ordnen](tickets/07-darstellung.md)

## 6. Trainio-Score

**Festgelegt:**

- **Name:** Trainio-Score. Er ist eigenständig, der Workout-Score bleibt, wie er ist.
- **Aussage:** nur die **Entwicklung** („Werde ich stärker, baue ich Muskeln auf?“), nicht das absolute
  Kraft-Niveau.
- **Eingaben:** nur Workouts und Körpergewicht.
- **Ausgabe:** Zahl **0–100 plus Klartext**, keine geschätzten kg Muskel. Er ist erkennbar eine Schätzung.
- **Kennt die Phase:** Bulk → Zuwachs ist gut, Cut → Erhalt ist gut, Erhalt → leichter Zuwachs ist gut.
  Ohne Phase gilt Erhalt.
- **Fester Rückblick** (z. B. die letzten Wochen gegenüber den Wochen davor), unabhängig vom gewählten Zeitraum im
  Fortschritt. Dazu ein Verlauf als Diagramm.
- **Aufschlüsselung pro Muskelgruppe** (z. B. „Beine hängen hinterher“).
- **Ort:** eigene Karte oben in Fortschritt → Übersicht (mit Aufschlüsselung und Verlauf) und als Startseiten-Kachel.

**Offen:**

- ⏳ Grundlagen – [Recherche: Kraft- und Muskelentwicklung schätzen](tickets/08-recherche-score.md)
- ⏳ Berechnung – [Trainio-Score: die Formel](tickets/09-score-formel.md)
- ⏳ Aussehen – [Trainio-Score: Karte, Kachel und Klartext](tickets/10-score-darstellung.md)

## 7. Nicht Teil dieses Vorhabens

- App-Icons neu gestalten (später, als eigenes Vorhaben).
- Navigation oder Tab-Struktur umbauen, Funktionen streichen.
- Absolutes Kraft-Niveau oder Vergleich mit Kraft-Standards im Score.
- Körperfett, Umfänge oder Fotos als Eingaben des Scores.

## 8. Umsetzung

⏳ Reihenfolge und Schritte der Umsetzung – noch nicht als Ticket gefasst (siehe [Karte](KARTE.md),
„Noch nicht festgelegt“).
