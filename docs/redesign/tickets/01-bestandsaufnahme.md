# Bestandsaufnahme: Was wirkt heute unprofessionell?

- **Typ:** task (AFK)
- **Status:** erledigt
- **Übernommen von:** Claude (Agent)
- **Blockiert durch:** –

## Frage

Wo genau wirkt Trainio heute unprofessionell? David empfindet es „generell“ so und nennt keine einzelnen Stellen.
Gesucht ist eine belastbare Ausgangslage für die neue Basis:

- Screenshots aller wichtigen Bildschirme im bisherigen Standard-Design „Trainio“ in Hell und Dunkel bei 390 px
  Breite (iPhone): Start, Training (Pläne, Verlauf), laufendes Workout (schlicht und ausführlich), Workout-Abschluss,
  Fortschritt (Übersicht, Kraft, Volumen, Muskeln, Cardio, Körper), Übungen, Mehr (Übersicht und Darstellung), ein
  Menü von unten, eine Rückfrage. Zum Vergleich je ein Screen in Fokus und Liquid Glass.
- Eine nach Schwere sortierte Liste der Schwachstellen: uneinheitliche Abstände und Schriftgrößen, Zahl der
  Komponenten-Varianten (Karten, Knöpfe, Listen …), Textmengen, Emojis, Diagramm-Stil, unklare Hierarchie und
  alles, was nicht wie eine hochwertige iOS-App wirkt.
- Wo möglich gezählt statt geschätzt, z. B. Zahl der verschiedenen Schriftgrößen und Abstände in `css/app.css`.

Ergebnis: `docs/redesign/bestandsaufnahme.md` mit Bildern unter `docs/redesign/bilder/`, verlinkt aus diesem Ticket.

## Antwort

Ergebnis: [bestandsaufnahme.md](../bestandsaufnahme.md) mit 36 Screenshots in [bilder/](../bilder/)
(Hell und Dunkel, 390 px, Chromium mit Inter statt SF Pro).

- **Kein Raster:** `css/app.css` hat 34 Schriftgrößen, 7 Schriftstärken, 154 Abstandswerte (nur 47 % im
  4er-Raster), 40 Eckenradien und 82 Schatten. Auf einem einzigen Bildschirm stehen bis zu 13 Schriftgrößen.
- **Alles gleich laut:** Fortschritt → Übersicht hat 23 Karten und 18 Info-Knöpfe, aber keine Hauptaussage.
  Das ausführliche Workout ist dicht, Texte werden abgeschnitten, und die Pausen-Leiste verdeckt Knöpfe.
- **Grün überall:** Die Akzentfarbe hat keine Signalwirkung mehr. Dazu kommen 76 feste Farben in CSS und
  150 in JS.
- **Diagramme:** 7 Arten mit wechselnder Legende. Geglättete Linien und gestauchte Achsen übertreiben Veränderungen.
- **Widersprüche und Begriffe:** „PR-Bonus 0“ steht neben „Neuer PR“. Begriffe und Einheiten wechseln
  (Fertig/Beenden, Beine/Legs, kg/t).
- **Zu viele Varianten:** etwa 20 Karten-, 13 Chip-, 21 Knopf- und 22 Zeilen-Klassen. 24 % der CSS sind
  Design-Sonderregeln.
- **Designs:** Fokus und Liquid Glass unterscheiden sich heute fast nur in Farbe und Material.
- **Was schon trägt** und alle gezählten Werte stehen in der Datei.
