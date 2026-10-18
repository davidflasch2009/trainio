/* Trainio – Übungs-Bibliothek & feste Pläne
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   2. Seed-Daten: Übungs-Bibliothek (80 Übungen) + 5 fixe Pläne
   Format: [id, Name, Kategorie, Muskeln, Equipment, Einheit, Technik-Tipp, Aliase]
   Aliase (u. a. englische Arrow-Namen) helfen beim Import-Mapping.
   ========================================================================== */
const SEED_EXERCISES = [
  // --- Push ---
  ['bankdruecken', 'Bankdrücken', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Langhantel', 'kg', 'Schulterblätter zusammen, Füße fest, Stange zur unteren Brust.', ['Bench Press', 'Bench Press (Barbell)', 'Flachbankdrücken', 'Barbell Bench Press']],
  ['schraegbank_lh', 'Schrägbankdrücken', 'Push', ['Brust', 'Schulter', 'Trizeps'], 'Langhantel', 'kg', 'Bank auf 30–45°, Stange kontrolliert zur oberen Brust.', ['Incline Bench Press', 'Incline Bench Press (Barbell)', 'Schrägbankdrücken Langhantel', 'Schrägbankdrücken LH']],
  ['schraegbank_kh', 'Schrägbankdrücken Kurzhantel', 'Push', ['Brust', 'Schulter', 'Trizeps'], 'Kurzhantel', 'kg', 'Ellbogen ca. 45° zum Körper, unten volle Dehnung.', ['Incline Dumbbell Press', 'Incline Bench Press (Dumbbell)', 'Schrägbankdrücken KH']],
  ['negativbank', 'Negativbankdrücken', 'Push', ['Brust', 'Trizeps'], 'Langhantel', 'kg', 'Leichte Negativneigung, Stange zur unteren Brust führen.', ['Decline Bench Press', 'Decline Bench Press (Barbell)']],
  ['kh_bankdruecken', 'Kurzhantel-Bankdrücken', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Kurzhantel', 'kg', 'Hanteln kontrolliert absenken, oben nicht zusammenschlagen.', ['Dumbbell Bench Press', 'Bench Press (Dumbbell)', 'Kurzhantel Bankdrücken']],
  ['butterfly', 'Butterfly', 'Push', ['Brust'], 'Maschine', 'kg', 'Arme leicht gebeugt, Brust raus, langsam öffnen.', ['Pec Deck', 'Chest Fly (Machine)', 'Butterfly Maschine', 'Chest Fly', 'Machine Fly']],
  ['kabel_crossover', 'Kabel-Crossover', 'Push', ['Brust'], 'Kabel', 'kg', 'Hände vor dem Körper kreuzen, Spannung konstant halten.', ['Cable Crossover', 'Cable Fly', 'Cable Chest Fly']],
  ['dips', 'Dips', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Körpergewicht', 'reps', 'Oberkörper leicht nach vorne für mehr Brust, tief und kontrolliert.', ['Dip', 'Chest Dip', 'Chest Dips', 'Dips (Weighted)']],
  ['liegestuetze', 'Liegestütze', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Körpergewicht', 'reps', 'Körper bildet eine Linie, Ellbogen nah am Körper.', ['Push Up', 'Push-Up', 'Push Ups', 'Pushups']],
  ['military_press', 'Military Press', 'Push', ['Schulter', 'Trizeps'], 'Langhantel', 'kg', 'Im Stand, Gesäß anspannen, Kopf unter der Stange durch.', ['Overhead Press (Barbell)', 'OHP', 'Shoulder Press (Barbell)', 'Schulterdrücken Langhantel', 'Strict Press']],
  ['ohp_kh', 'Overhead Press (KH)', 'Push', ['Schulter', 'Trizeps'], 'Kurzhantel', 'kg', 'Hanteln auf Ohrhöhe starten und über Kopf zusammenführen.', ['Overhead Press', 'Dumbbell Shoulder Press', 'Shoulder Press (Dumbbell)', 'Overhead Press (Dumbbell)', 'Schulterdrücken Kurzhantel']],
  ['arnold_press', 'Arnold Press', 'Push', ['Schulter', 'Trizeps'], 'Kurzhantel', 'kg', 'Handflächen beim Hochdrücken nach vorne drehen.', ['Arnold Press (Dumbbell)']],
  ['seitheben', 'Seitheben', 'Push', ['Schulter'], 'Kurzhantel', 'kg', 'Ellbogen führen, nur bis Schulterhöhe, kein Schwung.', ['Lateral Raise', 'Lateral Raise (Dumbbell)', 'Side Lateral Raise', 'Seitheben Kurzhantel']],
  ['front_raise', 'Front Raise', 'Push', ['Schulter'], 'Kurzhantel', 'kg', 'Arme gestreckt bis Augenhöhe, Rumpf bleibt stabil.', ['Front Raise (Dumbbell)', 'Frontheben']],
  ['trizeps_sz', 'Trizeps-Drücken Langhantel (SZ)', 'Push', ['Trizeps'], 'Langhantel', 'kg', 'Ellbogen zeigen zur Decke, Stange zur Stirn absenken.', ['Skullcrusher', 'Skull Crusher', 'French Press', 'Lying Triceps Extension', 'Skullcrusher (Barbell)']],
  ['trizeps_kabel', 'Trizeps-Drücken Kabel', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Ellbogen fixiert am Körper, unten voll durchstrecken.', ['Triceps Pushdown', 'Tricep Pushdown', 'Triceps Pushdown (Cable)', 'Trizepsdrücken Kabel']],
  ['trizeps_seil', 'Trizeps-Pushdown Seil', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Seil unten auseinanderziehen, Ellbogen bleiben fix.', ['Triceps Rope Pushdown', 'Rope Pushdown', 'Tricep Rope Pushdown']],
  ['overhead_trizeps', 'Overhead Trizeps Extension', 'Push', ['Trizeps'], 'Kurzhantel', 'kg', 'Ellbogen eng, tief in die Dehnung hinter den Kopf.', ['Overhead Triceps Extension', 'Overhead Tricep Extension', 'Triceps Extension (Dumbbell)']],
  ['dips_eng', 'Dips eng', 'Push', ['Trizeps', 'Brust'], 'Körpergewicht', 'reps', 'Oberkörper aufrecht, Ellbogen nah am Körper.', ['Triceps Dip', 'Bench Dip', 'Bench Dips', 'Close Grip Dip']],
  ['diamant_ls', 'Diamant-Liegestütze', 'Push', ['Trizeps', 'Brust'], 'Körpergewicht', 'reps', 'Hände bilden ein Dreieck direkt unter der Brust.', ['Diamond Push Up', 'Diamond Push-Up']],
  // --- Pull ---
  ['kreuzheben', 'Kreuzheben', 'Pull', ['Unterer Rücken', 'Gesäß', 'Beinbeuger', 'Rücken', 'Trapez'], 'Langhantel', 'kg', 'Stange nah am Körper, neutraler Rücken, aus den Beinen drücken.', ['Kreuzheben konventionell', 'Deadlift', 'Deadlift (Barbell)', 'Conventional Deadlift']],
  ['sumo_kreuzheben', 'Sumo-Kreuzheben', 'Pull', ['Gesäß', 'Quadrizeps', 'Unterer Rücken', 'Beinbeuger'], 'Langhantel', 'kg', 'Breiter Stand, Knie nach außen, Hüfte nah an die Stange.', ['Sumo Deadlift', 'Sumo Deadlift (Barbell)']],
  ['rdl', 'Rumänisches Kreuzheben', 'Pull', ['Beinbeuger', 'Gesäß', 'Unterer Rücken'], 'Langhantel', 'kg', 'Hüfte nach hinten schieben, Knie leicht gebeugt, Dehnung spüren.', ['Romanian Deadlift', 'RDL', 'Romanian Deadlift (Barbell)', 'Romanian Deadlift (Dumbbell)']],
  ['klimmzug', 'Klimmzug', 'Pull', ['Rücken', 'Bizeps', 'Hintere Schulter'], 'Körpergewicht', 'reps', 'Obergriff etwas weiter als schulterbreit, Brust zur Stange.', ['Pull Up', 'Pull-Up', 'Pull Ups', 'Klimmzug weit', 'Klimmzüge', 'Wide Grip Pull Up']],
  ['klimmzug_eng', 'Klimmzug eng', 'Pull', ['Rücken', 'Bizeps'], 'Körpergewicht', 'reps', 'Untergriff schulterbreit, Ellbogen nach unten ziehen.', ['Chin Up', 'Chin-Up', 'Chin Ups', 'Klimmzug Untergriff']],
  ['klimmzug_neutral', 'Klimmzug neutral', 'Pull', ['Rücken', 'Bizeps', 'Unterarme'], 'Körpergewicht', 'reps', 'Handflächen zueinander, kontrolliert ablassen.', ['Neutral Grip Pull Up', 'Neutral Pull Up', 'Hammer Grip Pull Up']],
  ['latzug', 'Latzug', 'Pull', ['Rücken', 'Bizeps'], 'Kabel', 'kg', 'Brust raus, Stange zur oberen Brust, Schulterblätter runter.', ['Lat Pulldown', 'Lat Pulldown (Cable)', 'Latzug weit', 'Wide Grip Lat Pulldown']],
  ['latzug_eng', 'Latzug eng', 'Pull', ['Rücken', 'Bizeps'], 'Kabel', 'kg', 'Enger Griff, Ellbogen eng am Körper zur Hüfte ziehen.', ['Close Grip Lat Pulldown', 'Lat Pulldown (Close Grip)']],
  ['lh_rudern', 'Langhantelrudern', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps', 'Unterer Rücken'], 'Langhantel', 'kg', 'Oberkörper ca. 45° vorgebeugt, Stange zum Bauchnabel ziehen.', ['Bent Over Row', 'Bent Over Row (Barbell)', 'Barbell Row', 'Rudern Langhantel']],
  ['kh_rudern', 'Kurzhantelrudern einarmig', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps'], 'Kurzhantel', 'kg', 'Ellbogen nah am Körper zur Hüfte ziehen, nicht rotieren.', ['Dumbbell Row', 'One Arm Dumbbell Row', 'Single Arm Row', 'Bent Over One Arm Row (Dumbbell)']],
  ['tbar_rudern', 'T-Bar Rudern', 'Pull', ['Rücken', 'Trapez', 'Bizeps'], 'Langhantel', 'kg', 'Brust raus, Rücken neutral, Ellbogen nach hinten ziehen.', ['T-Bar Row', 'T Bar Row']],
  ['kabelrudern', 'Kabelrudern sitzend', 'Pull', ['Rücken', 'Bizeps', 'Hintere Schulter'], 'Kabel', 'kg', 'Aufrecht sitzen, Schulterblätter aktiv zusammenziehen.', ['Seated Cable Row', 'Seated Row', 'Seated Row (Cable)', 'Cable Row']],
  ['face_pull', 'Face Pull', 'Pull', ['Hintere Schulter', 'Trapez'], 'Kabel', 'kg', 'Seil zum Gesicht ziehen, Hände nach außen rotieren.', ['Face Pull (Cable)', 'Face Pulls']],
  ['reverse_fly', 'Reverse Fly', 'Pull', ['Hintere Schulter', 'Trapez'], 'Kurzhantel', 'kg', 'Arme leicht gebeugt, Schulterblätter zusammenführen.', ['Rear Delt Fly', 'Reverse Fly (Dumbbell)', 'Reverse Pec Deck', 'Rear Delt Fly (Machine)']],
  ['shrugs', 'Shrugs', 'Pull', ['Trapez'], 'Kurzhantel', 'kg', 'Schultern gerade nach oben ziehen, oben kurz halten.', ['Shrug', 'Shrugs (Dumbbell)', 'Shrug (Barbell)', 'Shrug (Dumbbell)', 'Schulterheben']],
  ['curl_lh', 'Bizeps-Curl Langhantel', 'Pull', ['Bizeps', 'Unterarme'], 'Langhantel', 'kg', 'Ellbogen am Körper, kein Schwung aus dem Rücken.', ['Bicep Curl (Barbell)', 'Barbell Curl', 'Biceps Curl (Barbell)', 'Langhantelcurl']],
  ['curl_kh', 'Bizeps-Curl Kurzhantel', 'Pull', ['Bizeps'], 'Kurzhantel', 'kg', 'Beim Hochcurlen supinieren, langsam ablassen.', ['Bicep Curl (Dumbbell)', 'Dumbbell Curl', 'Bicep Curl', 'Biceps Curl', 'Kurzhantelcurl']],
  ['hammer_curl', 'Hammer Curl', 'Pull', ['Bizeps', 'Unterarme'], 'Kurzhantel', 'kg', 'Neutraler Griff, Oberarme bleiben ruhig.', ['Hammer Curl (Dumbbell)', 'Hammer Curls']],
  ['konzentrations_curl', 'Konzentrations-Curl', 'Pull', ['Bizeps'], 'Kurzhantel', 'kg', 'Ellbogen am Oberschenkel abstützen, oben fest anspannen.', ['Concentration Curl', 'Concentration Curl (Dumbbell)']],
  ['preacher_curl', 'Preacher Curl', 'Pull', ['Bizeps'], 'Langhantel', 'kg', 'Oberarme flach auf dem Polster, unten nicht ganz überstrecken.', ['Preacher Curl (Barbell)', 'Scott Curl', 'Scottcurl', 'Preacher Curl (Machine)']],
  ['kabel_curl', 'Kabel-Bizeps-Curl', 'Pull', ['Bizeps'], 'Kabel', 'kg', 'Konstante Spannung, Ellbogen bleiben fixiert.', ['Cable Curl', 'Bicep Curl (Cable)', 'Biceps Curl (Cable)']],
  // --- Legs ---
  ['kniebeuge', 'Kniebeuge', 'Legs', ['Quadrizeps', 'Gesäß', 'Unterer Rücken'], 'Langhantel', 'kg', 'High-Bar: Stange auf dem Trapez, Knie folgen den Zehen, tief gehen.', ['Squat', 'Back Squat', 'Squat (Barbell)', 'Kniebeuge High-Bar', 'High Bar Squat', 'Kniebeugen']],
  ['kniebeuge_lowbar', 'Kniebeuge Low-Bar', 'Legs', ['Quadrizeps', 'Gesäß', 'Beinbeuger', 'Unterer Rücken'], 'Langhantel', 'kg', 'Stange auf der hinteren Schulter, mehr Hüftbeugung, Brust raus.', ['Low Bar Squat', 'Low-Bar Squat']],
  ['frontkniebeuge', 'Front-Kniebeuge', 'Legs', ['Quadrizeps', 'Gesäß', 'Bauch'], 'Langhantel', 'kg', 'Ellbogen hoch, Oberkörper bleibt aufrecht.', ['Front Squat', 'Front Squat (Barbell)', 'Frontkniebeuge']],
  ['beinpresse', 'Beinpresse', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Rücken bleibt am Polster, Knie oben nicht durchstrecken.', ['Leg Press', 'Leg Press (Machine)']],
  ['hackenschmidt', 'Hackenschmidt', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Füße schulterbreit, kontrolliert tief gehen.', ['Hack Squat', 'Hack Squat (Machine)']],
  ['ausfall_kh', 'Ausfallschritte Kurzhantel', 'Legs', ['Quadrizeps', 'Gesäß', 'Beinbeuger'], 'Kurzhantel', 'kg', 'Großer Schritt, hinteres Knie fast bis zum Boden.', ['Lunge (Dumbbell)', 'Dumbbell Lunge', 'Lunges', 'Walking Lunge']],
  ['ausfall_lh', 'Ausfallschritte Langhantel', 'Legs', ['Quadrizeps', 'Gesäß', 'Beinbeuger'], 'Langhantel', 'kg', 'Oberkörper aufrecht, Knie stabil über dem Fuß.', ['Lunge (Barbell)', 'Barbell Lunge']],
  ['bulgarian', 'Bulgarian Split Squat', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Hinterer Fuß auf der Bank, Gewicht auf dem vorderen Bein.', ['Bulgarische Kniebeuge', 'Split Squat', 'Bulgarian Split Squat (Dumbbell)']],
  ['beinstrecker', 'Beinstrecker', 'Legs', ['Quadrizeps'], 'Maschine', 'kg', 'Oben kurz halten, langsam ablassen.', ['Leg Extension', 'Leg Extension (Machine)']],
  ['beincurl_liegend', 'Beincurl liegend', 'Legs', ['Beinbeuger'], 'Maschine', 'kg', 'Hüfte ins Polster drücken, volle Bewegung.', ['Lying Leg Curl', 'Leg Curl', 'Beincurl', 'Lying Leg Curl (Machine)']],
  ['beincurl_sitzend', 'Beincurl sitzend', 'Legs', ['Beinbeuger'], 'Maschine', 'kg', 'Oberschenkel fixiert, Fersen kraftvoll nach hinten ziehen.', ['Seated Leg Curl', 'Seated Leg Curl (Machine)']],
  ['nordic_curl', 'Nordic Curl', 'Legs', ['Beinbeuger'], 'Körpergewicht', 'reps', 'Langsam nach vorne ablassen, Hüfte bleibt gestreckt.', ['Nordic Hamstring Curl', 'Nordic Curls']],
  ['hip_thrust', 'Hip Thrust', 'Legs', ['Gesäß', 'Beinbeuger'], 'Langhantel', 'kg', 'Schultern auf der Bank, oben das Gesäß maximal anspannen.', ['Hip Thrust (Barbell)', 'Barbell Hip Thrust']],
  ['glute_bridge', 'Glute Bridge', 'Legs', ['Gesäß', 'Beinbeuger'], 'Körpergewicht', 'reps', 'Fersen in den Boden, Becken nach oben drücken.', ['Glute Bridge', 'Hip Bridge']],
  ['waden_stehend', 'Wadenheben stehend', 'Legs', ['Waden'], 'Maschine', 'kg', 'Volle Dehnung unten, oben eine Sekunde halten.', ['Standing Calf Raise', 'Calf Raise', 'Wadenheben', 'Calf Raise (Machine)']],
  ['waden_sitzend', 'Wadenheben sitzend', 'Legs', ['Waden'], 'Maschine', 'kg', 'Langsam und kontrolliert, voller Bewegungsumfang.', ['Seated Calf Raise', 'Seated Calf Raise (Machine)']],
  ['goblet_squat', 'Goblet Squat', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Hantel vor der Brust, Ellbogen zwischen die Knie.', ['Goblet Squat (Dumbbell)', 'Goblet Squat (Kettlebell)']],
  // --- Core ---
  ['plank', 'Plank', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Körper gerade wie ein Brett, Bauch und Gesäß anspannen.', ['Unterarmstütz', 'Planks']],
  ['side_plank', 'Side Plank', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Hüfte oben halten, Körper bildet eine Linie.', ['Seitstütz', 'Side Planks']],
  ['hanging_leg_raise', 'Hanging Leg Raise', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Ohne Schwung, Becken nach oben einrollen.', ['Beinheben hängend', 'Hanging Knee Raise', 'Leg Raise']],
  ['russian_twist', 'Russian Twist', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Oberkörper zurückgelehnt, aus der Taille drehen.', ['Russian Twists']],
  ['cable_crunch', 'Cable Crunch', 'Core', ['Bauch'], 'Kabel', 'kg', 'Wirbelsäule einrollen, nicht aus der Hüfte ziehen.', ['Kabel-Crunch', 'Cable Crunches']],
  ['ab_wheel', 'Ab Wheel Rollout', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Rücken nicht durchhängen lassen, Bauch fest.', ['Ab Wheel', 'Bauchroller', 'Ab Rollout']],
  ['dead_bug', 'Dead Bug', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Lendenwirbelsäule bleibt die ganze Zeit am Boden.', ['Dead Bugs']],
  ['hollow_hold', 'Hollow Hold', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Unterer Rücken am Boden, Arme und Beine gestreckt.', ['Hollow Body Hold']],
  ['bauchpresse', 'Bauchpresse Maschine', 'Core', ['Bauch'], 'Maschine', 'kg', 'Beim Einrollen ausatmen, langsam zurück.', ['Crunch (Machine)', 'Ab Crunch Machine', 'Crunch Machine', 'Crunch']],
  // --- Cardio ---
  ['laufen', 'Laufen', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'sec', 'Gleichmäßiges Tempo, locker durch die Nase atmen.', ['Running', 'Treadmill', 'Laufband', 'Joggen']],
  ['rudergeraet', 'Rudergerät', 'Cardio', ['Ausdauer', 'Rücken'], 'Maschine', 'sec', 'Beine – Rücken – Arme, zurück in umgekehrter Reihenfolge.', ['Rowing Machine', 'Rowing', 'Rower', 'Ergometer Rudern']],
  ['fahrrad', 'Fahrrad', 'Cardio', ['Ausdauer'], 'Maschine', 'sec', 'Sattelhöhe so, dass das Knie unten fast gestreckt ist.', ['Cycling', 'Stationary Bike', 'Bike', 'Ergometer', 'Spinning']],
  ['stepper', 'Stepper', 'Cardio', ['Ausdauer'], 'Maschine', 'sec', 'Nicht auf die Griffe stützen, aufrecht bleiben.', ['Stair Climber', 'StairMaster', 'Stairmaster', 'Stair Stepper']],
  ['jump_rope', 'Jump Rope', 'Cardio', ['Ausdauer', 'Waden'], 'Körpergewicht', 'sec', 'Aus den Fußgelenken springen, Ellbogen nah am Körper.', ['Seilspringen', 'Skipping']],
  ['burpees', 'Burpees', 'Cardio', ['Ausdauer', 'Brust', 'Quadrizeps'], 'Körpergewicht', 'reps', 'Explosiv hochspringen, sauber in die Liegestützposition.', ['Burpee']],
  ['hiit', 'HIIT Intervalle', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'sec', 'Kurze maximale Belastung, dazwischen aktive Pausen.', ['HIIT', 'Intervalltraining']],
  // --- Full Body / Olympic ---
  ['clean_press', 'Clean & Press', 'Full Body', ['Schulter', 'Gesäß', 'Quadrizeps', 'Trapez'], 'Langhantel', 'kg', 'Explosiv aus der Hüfte umsetzen, dann über Kopf drücken.', ['Clean and Press', 'Clean & Jerk', 'Umsetzen und Drücken']],
  ['snatch', 'Snatch', 'Full Body', ['Schulter', 'Gesäß', 'Quadrizeps', 'Trapez', 'Beinbeuger'], 'Langhantel', 'kg', 'Stange in einem Zug über Kopf, tief darunter abtauchen.', ['Reißen', 'Power Snatch']],
  ['thruster', 'Thruster', 'Full Body', ['Quadrizeps', 'Gesäß', 'Schulter', 'Trizeps'], 'Langhantel', 'kg', 'Aus der Front-Kniebeuge direkt in den Overhead-Press.', ['Thruster (Barbell)', 'Thrusters']],
  ['kb_swing', 'Kettlebell Swing', 'Full Body', ['Gesäß', 'Beinbeuger', 'Unterer Rücken'], 'Kurzhantel', 'kg', 'Hüftstreckung explosiv, die Arme sind nur Seile.', ['Kettlebell Swings', 'KB Swing']],
  ['tgu', 'Turkish Get-Up', 'Full Body', ['Schulter', 'Bauch', 'Gesäß'], 'Kurzhantel', 'kg', 'Blick zur Kettlebell, jede Phase kontrolliert.', ['Turkish Get Up', 'TGU']],
  ['farmers_walk', 'Farmers Walk', 'Full Body', ['Unterarme', 'Trapez', 'Bauch'], 'Kurzhantel', 'sec', 'Aufrecht gehen, Schultern zurück, fester Griff.', ["Farmer's Walk", 'Farmers Carry', "Farmer's Carry"]]
];


/* Erweiterung der Bibliothek (Seed v2) – wird bei bestehenden Konten einmalig ergänzt */
const SEED_EXERCISES_2 = [
  // --- Brust ---
  ['schraegbank_kh_fly', 'Schrägbank-Fliegende (KH)', 'Push', ['Brust', 'Schulter'], 'Kurzhantel', 'kg', 'Leicht gebeugte Arme, tief in die Dehnung, oben nicht zusammenschlagen.', ['Incline Dumbbell Fly', 'Incline Fly']],
  ['kh_fly', 'Fliegende Kurzhantel', 'Push', ['Brust'], 'Kurzhantel', 'kg', 'Bogen wie beim Umarmen, Ellbogen bleiben fix.', ['Dumbbell Fly', 'Chest Fly (Dumbbell)', 'Flys']],
  ['brustpresse', 'Brustpresse Maschine', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Maschine', 'kg', 'Griffe auf Brusthöhe, Schulterblätter an die Lehne.', ['Chest Press', 'Chest Press (Machine)', 'Machine Chest Press']],
  ['schraeg_brustpresse', 'Schräge Brustpresse Maschine', 'Push', ['Brust', 'Schulter', 'Trizeps'], 'Maschine', 'kg', 'Nach oben-vorne drücken, Brust bleibt hoch.', ['Incline Chest Press', 'Incline Chest Press (Machine)']],
  ['smith_bank', 'Bankdrücken Multipresse', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Maschine', 'kg', 'Bank so ausrichten, dass die Stange zur unteren Brust läuft.', ['Smith Machine Bench Press', 'Bench Press (Smith Machine)']],
  ['smith_schraeg', 'Schrägbankdrücken Multipresse', 'Push', ['Brust', 'Schulter', 'Trizeps'], 'Maschine', 'kg', 'Bank 30°, Stange zur oberen Brust.', ['Incline Bench Press (Smith Machine)', 'Smith Incline Press']],
  ['kabel_fly_tief', 'Kabel-Fly von unten', 'Push', ['Brust', 'Schulter'], 'Kabel', 'kg', 'Kabel tief einstellen, Hände nach oben vor der Brust zusammenführen.', ['Low to High Cable Fly', 'Low Cable Fly']],
  ['kabel_fly_hoch', 'Kabel-Fly von oben', 'Push', ['Brust'], 'Kabel', 'kg', 'Kabel hoch, nach unten-innen ziehen – Fokus untere Brust.', ['High to Low Cable Fly']],
  ['pullover_kh', 'Pullover Kurzhantel', 'Push', ['Brust', 'Rücken', 'Trizeps'], 'Kurzhantel', 'kg', 'Hüfte tief, Arme fast gestreckt in die Dehnung hinter den Kopf.', ['Dumbbell Pullover', 'Pullover']],
  ['schraeg_liegestuetz', 'Schräge Liegestütze', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Körpergewicht', 'reps', 'Hände erhöht – leichter, Füße erhöht – schwerer.', ['Incline Push Up', 'Decline Push Up']],
  ['floor_press', 'Floor Press', 'Push', ['Brust', 'Trizeps'], 'Langhantel', 'kg', 'Am Boden liegend, Oberarme berühren kurz den Boden.', ['Floor Press (Barbell)', 'Dumbbell Floor Press']],
  ['svend_press', 'Svend Press', 'Push', ['Brust'], 'Kurzhantel', 'kg', 'Scheibe zwischen den Händen zusammenpressen und nach vorne schieben.', ['Plate Press']],
  // --- Schulter ---
  ['schulterpresse_m', 'Schulterpresse Maschine', 'Push', ['Schulter', 'Trizeps'], 'Maschine', 'kg', 'Rücken an der Lehne, Griffe auf Kinnhöhe starten.', ['Shoulder Press (Machine)', 'Machine Shoulder Press']],
  ['push_press', 'Push Press', 'Push', ['Schulter', 'Trizeps', 'Quadrizeps'], 'Langhantel', 'kg', 'Kurzer Dip aus den Knien, Schwung explosiv über Kopf.', ['Push Press (Barbell)']],
  ['seitheben_kabel', 'Seitheben Kabel', 'Push', ['Schulter'], 'Kabel', 'kg', 'Kabel hinter dem Körper, gleichmäßige Spannung bis Schulterhöhe.', ['Cable Lateral Raise', 'Lateral Raise (Cable)']],
  ['seitheben_m', 'Seitheben Maschine', 'Push', ['Schulter'], 'Maschine', 'kg', 'Ellbogen führen, oben kurz halten.', ['Lateral Raise (Machine)', 'Machine Lateral Raise']],
  ['aufrechtes_rudern', 'Aufrechtes Rudern', 'Push', ['Schulter', 'Trapez'], 'Langhantel', 'kg', 'Schulterbreiter Griff, Ellbogen nur bis Schulterhöhe.', ['Upright Row', 'Upright Row (Barbell)', 'Upright Row (Cable)']],
  ['front_raise_scheibe', 'Front Raise Scheibe', 'Push', ['Schulter'], 'Kurzhantel', 'kg', 'Scheibe mit gestreckten Armen bis Augenhöhe.', ['Plate Front Raise']],
  ['landmine_press', 'Landmine Press', 'Push', ['Schulter', 'Brust', 'Trizeps'], 'Langhantel', 'kg', 'Stange einarmig schräg nach oben-vorne drücken.', ['Landmine Shoulder Press']],
  ['pike_ls', 'Pike-Liegestütze', 'Push', ['Schulter', 'Trizeps'], 'Körpergewicht', 'reps', 'Hüfte hoch, Kopf zwischen die Hände absenken.', ['Pike Push Up']],
  ['handstand_ls', 'Handstand-Liegestütze', 'Push', ['Schulter', 'Trizeps'], 'Körpergewicht', 'reps', 'An der Wand, kontrolliert bis Kopf fast am Boden.', ['Handstand Push Up', 'HSPU']],
  ['kabel_reverse_fly', 'Reverse Fly Kabel', 'Pull', ['Hintere Schulter', 'Trapez'], 'Kabel', 'kg', 'Kabel überkreuzt, Arme seitlich nach hinten öffnen.', ['Cable Reverse Fly', 'Rear Delt Cable Fly']],
  ['reverse_butterfly', 'Reverse Butterfly', 'Pull', ['Hintere Schulter', 'Trapez'], 'Maschine', 'kg', 'Brust an das Polster, Arme leicht gebeugt nach hinten.', ['Rear Delt Machine', 'Reverse Pec Deck Machine', 'Reverse Machine Fly']],
  ['band_pull_apart', 'Band Pull-Apart', 'Pull', ['Hintere Schulter', 'Trapez'], 'Band', 'reps', 'Band auf Brusthöhe auseinanderziehen, Schulterblätter zusammen.', ['Band Pull Apart']],
  // --- Trizeps ---
  ['kickback', 'Trizeps-Kickback', 'Push', ['Trizeps'], 'Kurzhantel', 'kg', 'Oberarm parallel zum Boden, nur der Unterarm bewegt sich.', ['Triceps Kickback', 'Dumbbell Kickback']],
  ['enges_bankdruecken', 'Enges Bankdrücken', 'Push', ['Trizeps', 'Brust'], 'Langhantel', 'kg', 'Griff schulterbreit, Ellbogen nah am Körper.', ['Close Grip Bench Press', 'Close-Grip Bench Press']],
  ['overhead_kabel_trizeps', 'Overhead Trizeps Kabel', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Mit dem Rücken zum Kabel, Ellbogen zeigen nach vorn.', ['Cable Overhead Triceps Extension', 'Overhead Cable Extension']],
  ['trizeps_einarmig', 'Trizeps-Pushdown einarmig', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Ohne Griff oder mit D-Griff, unten voll strecken.', ['Single Arm Pushdown', 'One Arm Triceps Pushdown']],
  ['bankdips', 'Bank-Dips', 'Push', ['Trizeps', 'Brust'], 'Körpergewicht', 'reps', 'Hände hinter dir auf der Bank, Rücken nah an der Kante.', ['Bankdips']],
  ['dips_maschine', 'Dips Maschine', 'Push', ['Trizeps', 'Brust'], 'Maschine', 'kg', 'Aufrecht sitzen, Griffe nach unten drücken.', ['Assisted Dip', 'Dip Machine', 'Seated Dip']],
  // --- Rücken ---
  ['pendlay_rudern', 'Pendlay Rudern', 'Pull', ['Rücken', 'Hintere Schulter', 'Trapez'], 'Langhantel', 'kg', 'Jede Wiederholung vom Boden, Oberkörper parallel.', ['Pendlay Row']],
  ['rudern_maschine', 'Rudern Maschine', 'Pull', ['Rücken', 'Bizeps', 'Hintere Schulter'], 'Maschine', 'kg', 'Brust ans Polster, Ellbogen nah am Körper nach hinten.', ['Seated Row (Machine)', 'Machine Row', 'Chest Supported Row']],
  ['seal_row', 'Seal Row', 'Pull', ['Rücken', 'Hintere Schulter', 'Trapez'], 'Langhantel', 'kg', 'Bäuchlings auf erhöhter Bank – kein Schwung möglich.', ['Seal Row (Barbell)']],
  ['brustgestuetztes_rudern', 'Brustgestütztes Rudern (KH)', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps'], 'Kurzhantel', 'kg', 'Bauch auf die Schrägbank, Hanteln zur Hüfte ziehen.', ['Chest Supported Dumbbell Row', 'Incline Dumbbell Row']],
  ['meadows_row', 'Meadows Row', 'Pull', ['Rücken', 'Hintere Schulter'], 'Langhantel', 'kg', 'Einarmig an der Landmine, Ellbogen hoch und weit.', ['Meadows Row (Landmine)']],
  ['latzug_einarmig', 'Latzug einarmig', 'Pull', ['Rücken', 'Bizeps'], 'Kabel', 'kg', 'Ellbogen zur Hüfte ziehen, oben voll strecken.', ['Single Arm Lat Pulldown', 'One Arm Pulldown']],
  ['latzug_ug', 'Latzug Untergriff', 'Pull', ['Rücken', 'Bizeps'], 'Kabel', 'kg', 'Schulterbreiter Untergriff, Brust zur Stange.', ['Underhand Lat Pulldown', 'Reverse Grip Pulldown']],
  ['straight_arm_pulldown', 'Straight-Arm Pulldown', 'Pull', ['Rücken'], 'Kabel', 'kg', 'Arme gestreckt, Stange in einem Bogen zu den Oberschenkeln.', ['Straight Arm Pulldown', 'Cable Pullover', 'Lat Pullover']],
  ['klimmzug_assist', 'Klimmzug Maschine (assistiert)', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Gegengewicht = Unterstützung, mit der Zeit reduzieren.', ['Assisted Pull Up', 'Assisted Pull-Up', 'Pull Up (Assisted)']],
  ['inverted_row', 'Inverted Row', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps'], 'Körpergewicht', 'reps', 'Körper gerade, Brust zur Stange ziehen.', ['Australian Pull Up', 'Bodyweight Row', 'Ring Row']],
  ['rack_pull', 'Rack Pull', 'Pull', ['Unterer Rücken', 'Trapez', 'Gesäß', 'Rücken'], 'Langhantel', 'kg', 'Stange ab Kniehöhe, Hüfte kräftig nach vorn.', ['Rack Pulls', 'Block Pull']],
  ['good_morning', 'Good Morning', 'Pull', ['Beinbeuger', 'Unterer Rücken', 'Gesäß'], 'Langhantel', 'kg', 'Hüfte nach hinten schieben, Rücken bleibt neutral.', ['Good Mornings']],
  ['hyperextension', 'Rückenstrecker (Hyperextension)', 'Pull', ['Unterer Rücken', 'Gesäß', 'Beinbeuger'], 'Körpergewicht', 'reps', 'Bis zur Neutralstellung hoch, nicht überstrecken.', ['Back Extension', 'Hyperextensions', '45 Degree Back Extension']],
  ['shrugs_lh', 'Shrugs Langhantel', 'Pull', ['Trapez'], 'Langhantel', 'kg', 'Schultern gerade nach oben, nicht kreisen.', ['Barbell Shrug']],
  ['kabel_shrugs', 'Shrugs Kabel', 'Pull', ['Trapez'], 'Kabel', 'kg', 'Oben eine Sekunde halten.', ['Cable Shrug']],
  // --- Bizeps & Unterarme ---
  ['sz_curl', 'SZ-Curl', 'Pull', ['Bizeps', 'Unterarme'], 'Langhantel', 'kg', 'Gelenkschonender Griff, Ellbogen bleiben am Körper.', ['EZ Bar Curl', 'EZ-Bar Curl', 'Curl (EZ Bar)']],
  ['schraegbank_curl', 'Schrägbank-Curl', 'Pull', ['Bizeps'], 'Kurzhantel', 'kg', 'Arme hängen hinter dem Körper – starke Dehnung.', ['Incline Dumbbell Curl', 'Incline Curl']],
  ['spider_curl', 'Spider Curl', 'Pull', ['Bizeps'], 'Kurzhantel', 'kg', 'Bäuchlings auf der Schrägbank, Arme hängen senkrecht.', ['Spider Curls']],
  ['bayesian_curl', 'Bayesian Curl', 'Pull', ['Bizeps'], 'Kabel', 'kg', 'Mit dem Rücken zum Kabel, Arm hinter dem Körper starten.', ['Bayesian Cable Curl', 'Behind the Back Cable Curl']],
  ['reverse_curl', 'Reverse Curl', 'Pull', ['Unterarme', 'Bizeps'], 'Langhantel', 'kg', 'Obergriff, Handgelenke gerade.', ['Reverse Barbell Curl', 'Reverse Grip Curl']],
  ['handgelenk_curl', 'Handgelenk-Curl', 'Pull', ['Unterarme'], 'Langhantel', 'kg', 'Unterarme auf der Bank, nur das Handgelenk bewegt sich.', ['Wrist Curl', 'Wrist Curls']],
  ['handgelenk_rev', 'Reverse Handgelenk-Curl', 'Pull', ['Unterarme'], 'Langhantel', 'kg', 'Obergriff, leichtes Gewicht, volle Bewegung.', ['Reverse Wrist Curl']],
  ['dead_hang', 'Dead Hang', 'Pull', ['Unterarme', 'Rücken'], 'Körpergewicht', 'sec', 'Locker hängen, Schultern leicht aktiv.', ['Hang', 'Bar Hang']],
  ['hammer_curl_seil', 'Hammer Curl Seil', 'Pull', ['Bizeps', 'Unterarme'], 'Kabel', 'kg', 'Neutraler Griff am Seil, Ellbogen fix.', ['Rope Hammer Curl', 'Cable Hammer Curl']],
  ['curl_maschine', 'Bizeps-Curl Maschine', 'Pull', ['Bizeps'], 'Maschine', 'kg', 'Ellbogen auf Drehpunkthöhe ausrichten.', ['Bicep Curl (Machine)', 'Machine Curl']],
  // --- Beine ---
  ['smith_kniebeuge', 'Kniebeuge Multipresse', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Füße leicht vor der Stange, tief und kontrolliert.', ['Smith Machine Squat', 'Squat (Smith Machine)']],
  ['pendel_kniebeuge', 'Pendel-Kniebeuge', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Rücken am Polster, Knie weit nach vorn.', ['Pendulum Squat']],
  ['belt_squat', 'Belt Squat', 'Legs', ['Quadrizeps', 'Gesäß', 'Adduktoren'], 'Maschine', 'kg', 'Last an der Hüfte – schont den Rücken.', ['Belt Squat (Machine)']],
  ['box_squat', 'Box Squat', 'Legs', ['Quadrizeps', 'Gesäß', 'Beinbeuger'], 'Langhantel', 'kg', 'Kurz auf der Box absitzen, Spannung halten.', ['Box Squats']],
  ['zercher_squat', 'Zercher Squat', 'Legs', ['Quadrizeps', 'Gesäß', 'Bauch'], 'Langhantel', 'kg', 'Stange in den Ellenbeugen, Oberkörper aufrecht.', ['Zercher Squats']],
  ['sumo_squat', 'Sumo-Kniebeuge', 'Legs', ['Quadrizeps', 'Adduktoren', 'Gesäß'], 'Kurzhantel', 'kg', 'Weiter Stand, Zehen nach außen, Knie folgen den Zehen.', ['Sumo Squat', 'Plie Squat']],
  ['beinpresse_einbeinig', 'Beinpresse einbeinig', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Knie bleibt über dem Fuß, Becken stabil.', ['Single Leg Press']],
  ['walking_lunges', 'Walking Lunges', 'Legs', ['Quadrizeps', 'Gesäß', 'Adduktoren'], 'Kurzhantel', 'reps', 'Großer Schritt, hinteres Knie fast am Boden.', ['Gehende Ausfallschritte']],
  ['reverse_lunge', 'Ausfallschritt rückwärts', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Nach hinten steigen, Gewicht auf dem vorderen Fuß.', ['Reverse Lunge', 'Reverse Lunges']],
  ['step_up', 'Step-Up', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Ganzer Fuß auf die Box, nicht vom hinteren Bein abdrücken.', ['Step Up', 'Box Step Up']],
  ['sissy_squat', 'Sissy Squat', 'Legs', ['Quadrizeps'], 'Körpergewicht', 'reps', 'Knie nach vorn, Körper bildet eine Linie Knie-Schulter.', ['Sissy Squats']],
  ['pistol_squat', 'Pistol Squat', 'Legs', ['Quadrizeps', 'Gesäß'], 'Körpergewicht', 'reps', 'Einbeinig tief, freies Bein gestreckt nach vorn.', ['Pistol Squats', 'Single Leg Squat']],
  ['wall_sit', 'Wall Sit', 'Legs', ['Quadrizeps'], 'Körpergewicht', 'sec', 'Rücken an der Wand, Knie 90°.', ['Wandsitzen']],
  ['stiff_leg_dl', 'Kreuzheben gestreckte Beine', 'Legs', ['Beinbeuger', 'Gesäß', 'Unterer Rücken'], 'Langhantel', 'kg', 'Knie fast gestreckt, Stange nah an den Beinen.', ['Stiff Leg Deadlift', 'Stiff-Legged Deadlift', 'SLDL']],
  ['rdl_kh', 'Rumänisches Kreuzheben (KH)', 'Legs', ['Beinbeuger', 'Gesäß', 'Unterer Rücken'], 'Kurzhantel', 'kg', 'Hüfte nach hinten, Hanteln an den Beinen entlang.', ['Dumbbell Romanian Deadlift', 'DB RDL']],
  ['rdl_einbeinig', 'Einbeiniges Kreuzheben', 'Legs', ['Beinbeuger', 'Gesäß'], 'Kurzhantel', 'kg', 'Hüfte bleibt gerade, hinteres Bein als Gegengewicht.', ['Single Leg Romanian Deadlift', 'Single Leg RDL']],
  ['beincurl_stehend', 'Beincurl stehend', 'Legs', ['Beinbeuger'], 'Maschine', 'kg', 'Einbeinig, Hüfte fest am Polster.', ['Standing Leg Curl']],
  ['glute_ham_raise', 'Glute-Ham Raise', 'Legs', ['Beinbeuger', 'Gesäß'], 'Körpergewicht', 'reps', 'Aus den Knien beugen, Hüfte gestreckt.', ['GHR', 'Glute Ham Raise']],
  ['hip_thrust_m', 'Hip Thrust Maschine', 'Legs', ['Gesäß', 'Beinbeuger'], 'Maschine', 'kg', 'Oben voll strecken und Gesäß anspannen.', ['Hip Thrust (Machine)', 'Glute Drive']],
  ['kabel_kickback', 'Glute Kickback Kabel', 'Legs', ['Gesäß'], 'Kabel', 'kg', 'Bein nach hinten-oben, Becken nicht verdrehen.', ['Cable Kickback', 'Glute Kickback', 'Cable Glute Kickback']],
  ['abduktoren_m', 'Abduktoren Maschine', 'Legs', ['Abduktoren', 'Gesäß'], 'Maschine', 'kg', 'Knie nach außen drücken, langsam zurück.', ['Hip Abduction', 'Hip Abduction (Machine)', 'Abductor Machine', 'Outer Thigh Machine']],
  ['adduktoren_m', 'Adduktoren Maschine', 'Legs', ['Adduktoren'], 'Maschine', 'kg', 'Beine kontrolliert zusammendrücken.', ['Hip Adduction', 'Hip Adduction (Machine)', 'Adductor Machine', 'Inner Thigh Machine']],
  ['copenhagen_plank', 'Copenhagen Plank', 'Legs', ['Adduktoren', 'Bauch'], 'Körpergewicht', 'sec', 'Oberes Bein auf der Bank, Hüfte hoch halten.', ['Copenhagen Adductor Plank']],
  ['monster_walk', 'Monster Walk (Band)', 'Legs', ['Abduktoren', 'Gesäß'], 'Band', 'reps', 'Band um die Knie, leicht gebeugt seitwärts gehen.', ['Band Walk', 'Lateral Band Walk']],
  ['frog_pump', 'Frog Pump', 'Legs', ['Gesäß'], 'Körpergewicht', 'reps', 'Fußsohlen zusammen, Hüfte explosiv nach oben.', ['Frog Pumps']],
  ['waden_beinpresse', 'Wadendrücken Beinpresse', 'Legs', ['Waden'], 'Maschine', 'kg', 'Nur der Fußballen auf der Platte, volle Dehnung.', ['Calf Press', 'Calf Press on Leg Press']],
  ['waden_einbeinig', 'Wadenheben einbeinig', 'Legs', ['Waden'], 'Kurzhantel', 'kg', 'Auf einer Stufe, ganz tief und ganz hoch.', ['Single Leg Calf Raise']],
  ['tibialis_raise', 'Tibialis Raise', 'Legs', ['Waden'], 'Körpergewicht', 'reps', 'Rücken an der Wand, Fußspitzen hochziehen.', ['Tib Raise', 'Tibialis Anterior Raise']],
  ['kettlebell_goblet', 'Kettlebell Deadlift', 'Legs', ['Gesäß', 'Beinbeuger', 'Quadrizeps'], 'Kettlebell', 'kg', 'Kettlebell zwischen den Füßen, Hüfte nach hinten.', ['Kettlebell Deadlift', 'KB Deadlift']],
  // --- Core ---
  ['crunch', 'Crunch', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Nur die Schultern abheben, unterer Rücken bleibt am Boden.', ['Crunches', 'Sit Up', 'Sit-Up']],
  ['reverse_crunch', 'Reverse Crunch', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Becken zur Brust einrollen, langsam ablassen.', ['Reverse Crunches']],
  ['beinheben_liegend', 'Beinheben liegend', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Rücken flach, Beine gestreckt langsam senken.', ['Lying Leg Raise', 'Leg Raises']],
  ['knee_raise_stuhl', 'Knieheben am Dip-Barren', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Knie zur Brust, Becken einrollen.', ["Captain's Chair Knee Raise", 'Captains Chair', 'Knee Raise']],
  ['woodchopper', 'Woodchopper Kabel', 'Core', ['Bauch'], 'Kabel', 'kg', 'Aus der Rumpfrotation ziehen, Arme bleiben lang.', ['Cable Woodchopper', 'Wood Chop', 'Woodchop']],
  ['pallof_press', 'Pallof Press', 'Core', ['Bauch'], 'Kabel', 'kg', 'Seitlich zum Kabel, Hände gerade nach vorn – nicht verdrehen lassen.', ['Pallof Press (Cable)', 'Anti-Rotation Press']],
  ['seitbeugen', 'Seitbeugen Kurzhantel', 'Core', ['Bauch'], 'Kurzhantel', 'kg', 'Nur zur Seite neigen, nicht nach vorn.', ['Dumbbell Side Bend', 'Side Bend']],
  ['mountain_climber', 'Mountain Climber', 'Core', ['Bauch', 'Ausdauer'], 'Körpergewicht', 'sec', 'Hüfte tief, Knie schnell abwechselnd zur Brust.', ['Mountain Climbers']],
  ['v_up', 'V-Up', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Arme und Beine gleichzeitig zur Mitte.', ['V-Ups', 'V Ups']],
  ['bicycle_crunch', 'Bicycle Crunch', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Ellbogen zum gegenüberliegenden Knie, langsam.', ['Bicycle Crunches']],
  ['l_sit', 'L-Sit', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Arme gestreckt, Beine waagerecht halten.', ['L Sit']],
  ['bird_dog', 'Bird Dog', 'Core', ['Bauch', 'Unterer Rücken'], 'Körpergewicht', 'reps', 'Gegengleich Arm und Bein strecken, Becken stabil.', ['Bird Dogs']],
  ['dragon_flag', 'Dragon Flag', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Körper als Brett von der Schulter absenken.', ['Dragon Flags']],
  // --- Cardio ---
  ['crosstrainer', 'Crosstrainer', 'Cardio', ['Ausdauer'], 'Maschine', 'sec', 'Aufrecht, Arme aktiv mitarbeiten lassen.', ['Elliptical', 'Cross Trainer']],
  ['laufband_steigung', 'Laufband Steigung (Gehen)', 'Cardio', ['Ausdauer', 'Waden'], 'Maschine', 'sec', 'Steigung 10–15 %, nicht an den Griffen festhalten.', ['Incline Walk', 'Incline Treadmill Walk', '12-3-30']],
  ['schwimmen', 'Schwimmen', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'sec', 'Gleichmäßige Züge, ruhig ausatmen.', ['Swimming']],
  ['assault_bike', 'Air Bike', 'Cardio', ['Ausdauer'], 'Maschine', 'sec', 'Arme und Beine gleichzeitig – brutal effizient.', ['Assault Bike', 'Airbike', 'Echo Bike']],
  ['sled_push', 'Schlitten schieben', 'Cardio', ['Quadrizeps', 'Gesäß', 'Ausdauer'], 'Maschine', 'sec', 'Tiefe Körperposition, kurze kräftige Schritte.', ['Sled Push', 'Prowler Push']],
  ['battle_ropes', 'Battle Ropes', 'Cardio', ['Ausdauer', 'Schulter'], 'Band', 'sec', 'Aus den Beinen arbeiten, Wellen gleichmäßig.', ['Battle Rope']],
  ['box_jump', 'Box Jumps', 'Cardio', ['Quadrizeps', 'Gesäß', 'Ausdauer'], 'Körpergewicht', 'reps', 'Weich landen, auf der Box ganz aufrichten.', ['Box Jump']],
  ['spazieren', 'Spazieren / Gehen', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'sec', 'Lockeres Tempo – zählt für die Regeneration.', ['Walking', 'Walk', 'Gehen']],
  // --- Full Body / Kettlebell ---
  ['power_clean', 'Power Clean', 'Full Body', ['Gesäß', 'Beinbeuger', 'Trapez', 'Quadrizeps'], 'Langhantel', 'kg', 'Explosive Hüftstreckung, Stange auf die Schultern fangen.', ['Power Clean (Barbell)', 'Umsetzen']],
  ['hang_clean', 'Hang Clean', 'Full Body', ['Gesäß', 'Trapez', 'Beinbeuger'], 'Langhantel', 'kg', 'Aus dem Hang über den Knien starten.', ['Hang Power Clean']],
  ['kb_goblet', 'Kettlebell Goblet Squat', 'Full Body', ['Quadrizeps', 'Gesäß', 'Bauch'], 'Kettlebell', 'kg', 'Kettlebell an den Hörnern vor der Brust.', ['Kettlebell Goblet Squat']],
  ['kb_snatch', 'Kettlebell Snatch', 'Full Body', ['Schulter', 'Gesäß', 'Beinbeuger'], 'Kettlebell', 'kg', 'Aus dem Swing in einem Zug über Kopf.', ['Kettlebell Snatch', 'KB Snatch']],
  ['kb_clean_press', 'Kettlebell Clean & Press', 'Full Body', ['Schulter', 'Gesäß', 'Trizeps'], 'Kettlebell', 'kg', 'Sauber umsetzen, dann strikt drücken.', ['Kettlebell Clean and Press']],
  ['man_maker', 'Man Maker', 'Full Body', ['Brust', 'Schulter', 'Rücken', 'Quadrizeps'], 'Kurzhantel', 'reps', 'Liegestütz, Rudern links/rechts, Clean, Press – eine Wiederholung.', ['Man Makers']],
  ['wall_ball', 'Wall Ball', 'Full Body', ['Quadrizeps', 'Gesäß', 'Schulter'], 'Kurzhantel', 'reps', 'Aus der tiefen Hocke den Ball an die Wand werfen.', ['Wall Balls', 'Wallball']],
  ['bear_crawl', 'Bear Crawl', 'Full Body', ['Schulter', 'Bauch', 'Quadrizeps'], 'Körpergewicht', 'sec', 'Knie knapp über dem Boden, Rücken flach.', ['Bear Crawls']],
  ['sandbag_carry', 'Suitcase Carry', 'Full Body', ['Unterarme', 'Bauch', 'Trapez'], 'Kurzhantel', 'sec', 'Einseitig tragen, Oberkörper bleibt gerade.', ['Suitcase Carry', 'Single Arm Farmer Carry']]
];
/* Cardio-Bibliothek (Seed v4): Dauer + Distanz bzw. Dauer + Stufe, siehe CARDIO_CFG */
const SEED_CARDIO = [
  ['laufband', 'Laufband (Joggen)', 'Cardio', ['Ausdauer'], 'Maschine', 'cardio', 'Lockerer Laufstil, nicht an den Griffen festhalten.', ['Treadmill Run', 'Treadmill Running', 'Laufband Laufen']],
  ['laufen_draussen', 'Laufen draußen', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Locker anfangen, Tempo erst nach 10 Minuten steigern.', ['Outdoor Run', 'Run Outdoor', 'Joggen draußen']],
  ['sprints', 'Sprint-Intervalle', 'Cardio', ['Ausdauer', 'Quadrizeps'], 'Körpergewicht', 'cardio', 'Gut aufwärmen, Sprints kurz und maximal, Gehpausen dazwischen.', ['Sprints', 'Sprint Intervals']],
  ['wandern', 'Wandern', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Gleichmäßiges Tempo, bergauf kleine Schritte.', ['Hiking', 'Hike']],
  ['nordic_walking', 'Nordic Walking', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Stöcke diagonal zum Schritt einsetzen, Arme aktiv.', ['Nordic Walk']],
  ['rucking', 'Rucking (Gehen mit Rucksack)', 'Cardio', ['Ausdauer', 'Trapez'], 'Körpergewicht', 'cardio', 'Rucksack eng am Rücken, aufrecht gehen.', ['Rucking', 'Ruck']],
  ['radfahren', 'Radfahren draußen', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Trittfrequenz eher hoch, Gänge früh schalten.', ['Outdoor Cycling', 'Road Bike', 'Rennrad', 'Fahrradfahren']],
  ['mountainbike', 'Mountainbike', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Gewicht bergab nach hinten, bergauf gleichmäßig treten.', ['MTB', 'Mountain Biking']],
  ['spinning', 'Spinning / Indoor Cycling', 'Cardio', ['Ausdauer'], 'Maschine', 'cardio', 'Widerstand so wählen, dass die Trittfrequenz kontrolliert bleibt.', ['Indoor Cycling', 'Spin Bike', 'Spin Class']],
  ['liegeergometer', 'Liegeergometer', 'Cardio', ['Ausdauer'], 'Maschine', 'cardio', 'Rücken an der Lehne, Knie unten fast gestreckt.', ['Recumbent Bike', 'Liegerad']],
  ['skierg', 'SkiErg', 'Cardio', ['Ausdauer', 'Rücken'], 'Maschine', 'cardio', 'Aus der Hüfte beugen, Arme ziehen bis zur Hüfte.', ['Ski Erg', 'Ski Ergometer']],
  ['rudern_boot', 'Rudern (Boot)', 'Cardio', ['Ausdauer', 'Rücken'], 'Körpergewicht', 'cardio', 'Beine – Rücken – Arme, ruhiger Rhythmus.', ['Rowing Boat', 'Rudern Wasser']],
  ['kajak', 'Kajak / Paddeln', 'Cardio', ['Ausdauer', 'Rücken'], 'Körpergewicht', 'cardio', 'Kraft aus dem Rumpf, nicht nur aus den Armen.', ['Kayaking', 'Paddling', 'Kanu']],
  ['sup', 'Stand-up-Paddling', 'Cardio', ['Ausdauer', 'Bauch'], 'Körpergewicht', 'cardio', 'Knie leicht gebeugt, Paddel weit vorne eintauchen.', ['SUP', 'Stand Up Paddle']],
  ['inlineskaten', 'Inlineskaten', 'Cardio', ['Ausdauer', 'Gesäß'], 'Körpergewicht', 'cardio', 'Tiefe Position, lange Abstöße zur Seite.', ['Inline Skating', 'Rollerblading']],
  ['skilanglauf', 'Skilanglauf', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Gewicht über dem Gleitski, Arme schieben aktiv.', ['Cross-Country Skiing', 'Langlauf']],
  ['aquajogging', 'Aquajogging', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Aufrecht im Wasser laufen, Gürtel trägt.', ['Aqua Jogging', 'Water Running']],
  ['treppensteigen', 'Treppensteigen', 'Cardio', ['Ausdauer', 'Gesäß'], 'Körpergewicht', 'cardio', 'Ganze Fußsohle aufsetzen, nicht am Geländer ziehen.', ['Stairs', 'Stair Climbing', 'Treppenlauf']],
  ['step_aerobic', 'Step-Aerobic', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Ganzer Fuß auf den Step, leise aufsetzen.', ['Step Aerobics']],
  ['trampolin', 'Trampolin', 'Cardio', ['Ausdauer', 'Waden'], 'Körpergewicht', 'cardio', 'Mittig springen, Rumpf fest.', ['Trampoline', 'Rebounding']],
  ['tabata', 'Tabata', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', '8 Runden: 20 s maximal, 10 s Pause.', ['Tabata Intervals']],
  ['zirkeltraining', 'Zirkeltraining', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Stationen zügig wechseln, Puls oben halten.', ['Circuit Training', 'Circuit', 'Metcon']],
  ['boxsack', 'Boxsack', 'Cardio', ['Ausdauer', 'Schulter'], 'Körpergewicht', 'cardio', 'Aus der Hüfte schlagen, Deckung oben.', ['Heavy Bag', 'Punching Bag', 'Sandsack']],
  ['schattenboxen', 'Schattenboxen', 'Cardio', ['Ausdauer', 'Schulter'], 'Körpergewicht', 'cardio', 'Locker auf den Fußballen, Kombinationen sauber.', ['Shadow Boxing']],
  ['kampfsport', 'Kampfsport', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Training im Verein oder Gym – Dauer eintragen.', ['Martial Arts', 'Kickboxen', 'MMA', 'Judo', 'Karate', 'BJJ']],
  ['tanzen', 'Tanzen / Zumba', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spaß zählt – Dauer eintragen.', ['Dancing', 'Zumba', 'Dance']],
  ['klettern', 'Klettern / Bouldern', 'Cardio', ['Ausdauer', 'Unterarme', 'Rücken'], 'Körpergewicht', 'cardio', 'Aus den Beinen drücken, Arme lang lassen.', ['Climbing', 'Bouldering']],
  ['fussball', 'Fußball', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Football', 'Soccer', 'Fussball']],
  ['basketball', 'Basketball', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Basketball']],
  ['handball', 'Handball', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Handball']],
  ['volleyball', 'Volleyball', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Volleyball', 'Beachvolleyball']],
  ['tennis', 'Tennis', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Tennis']],
  ['badminton', 'Badminton', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Federball']],
  ['squash', 'Squash', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Squash']],
  ['tischtennis', 'Tischtennis', 'Cardio', ['Ausdauer'], 'Körpergewicht', 'cardio', 'Spiel oder Training – Dauer eintragen.', ['Table Tennis', 'Ping Pong']]
];

/* Erweiterung Oktober: Maschinen, Kabel, Multipresse & Plate-Loaded, mehr Varianten */
const SEED_EXERCISES_3 = [
  ['cable_fly_sitzend', 'Seated Cable Chest Fly', 'Push', ['Brust', 'Schulter'], 'Kabel', 'kg', 'Sitzend, Rücken an der Lehne – Arme im leichten Bogen vor der Brust zusammenführen.', ['Kabel-Fliegende sitzend', 'Seated Cable Fly', 'Cable Chest Fly (Seated)']],
  ['kabel_brustpresse', 'Kabel-Brustpresse', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Kabel', 'kg', 'Griffe auf Brusthöhe, nach vorn drücken, kontrolliert zurück.', ['Cable Chest Press', 'Standing Cable Chest Press', 'Seated Cable Chest Press']],
  ['negativ_kh', 'Negativbankdrücken Kurzhantel', 'Push', ['Brust', 'Trizeps'], 'Kurzhantel', 'kg', 'Bank leicht negativ, Kurzhanteln auf Höhe der unteren Brust absenken.', ['Decline Dumbbell Press', 'Decline Bench Press (Dumbbell)']],
  ['brustpresse_plate', 'Brustpresse Plate-Loaded', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Maschine', 'kg', 'Iso-lateral: jede Seite drückt für sich, Schulterblätter bleiben hinten.', ['Hammer Strength Chest Press', 'Iso-Lateral Chest Press', 'Plate Loaded Chest Press']],
  ['negativ_brustpresse', 'Negative Brustpresse Maschine', 'Push', ['Brust', 'Trizeps'], 'Maschine', 'kg', 'Nach vorn-unten drücken, Brust bleibt oben.', ['Decline Chest Press', 'Decline Chest Press (Machine)', 'Hammer Strength Decline Press']],
  ['kabel_fly_schraeg', 'Schrägbank-Kabel-Fly', 'Push', ['Brust', 'Schulter'], 'Kabel', 'kg', 'Schrägbank zwischen die Kabelzüge, Arme im Bogen über der oberen Brust schließen.', ['Incline Cable Fly', 'Cable Fly (Incline)']],
  ['kabel_fly_einarmig', 'Kabel-Fly einarmig', 'Push', ['Brust'], 'Kabel', 'kg', 'Seitlich zum Kabel, Arm über die Körpermitte führen.', ['Single Arm Cable Fly', 'One Arm Cable Fly']],
  ['squeeze_press', 'Squeeze Press', 'Push', ['Brust', 'Trizeps'], 'Kurzhantel', 'kg', 'Kurzhanteln die ganze Zeit fest aneinanderdrücken.', ['Dumbbell Squeeze Press', 'Crush Press']],
  ['brustpresse_sitzend_eng', 'Brustpresse eng', 'Push', ['Brust', 'Trizeps'], 'Maschine', 'kg', 'Enger Griff, Ellbogen nah am Körper.', ['Close Grip Chest Press', 'Chest Press (Close Grip)']],
  ['schulter_multipresse', 'Smith Machine Shoulder Press', 'Push', ['Schulter', 'Trizeps'], 'Maschine', 'kg', 'Sitzend vor der Stange, bis knapp unters Kinn absenken, Ellbogen leicht vor dem Körper.', ['Schulterdrücken Multipresse', 'Shoulder Press (Smith Machine)', 'Smith Shoulder Press', 'Smith Overhead Press']],
  ['schulterpresse_plate', 'Schulterpresse Plate-Loaded', 'Push', ['Schulter', 'Trizeps'], 'Maschine', 'kg', 'Rücken fest an der Lehne, nicht ins Hohlkreuz drücken.', ['Hammer Strength Shoulder Press', 'Iso-Lateral Shoulder Press', 'Plate Loaded Shoulder Press']],
  ['front_raise_kabel', 'Front Raise Kabel', 'Push', ['Schulter'], 'Kabel', 'kg', 'Arm gestreckt bis auf Schulterhöhe heben, langsam ablassen.', ['Cable Front Raise', 'Frontheben Kabel']],
  ['y_raise_kabel', 'Y-Raise Kabel', 'Push', ['Schulter', 'Trapez'], 'Kabel', 'kg', 'Arme in Y-Form schräg nach oben führen, Daumen zeigen nach oben.', ['Cable Y Raise', 'Cable Y-Raise']],
  ['seitheben_sitzend', 'Seitheben sitzend', 'Push', ['Schulter'], 'Kurzhantel', 'kg', 'Sitzend ohne Schwung, Ellbogen führen die Bewegung.', ['Seated Lateral Raise', 'Seated Dumbbell Lateral Raise']],
  ['seitheben_lean_away', 'Seitheben Kabel weggelehnt', 'Push', ['Schulter'], 'Kabel', 'kg', 'An der Stange festhalten und weglehnen – längerer Zug in der Dehnung.', ['Lean Away Lateral Raise', 'Lean-Away Cable Lateral Raise']],
  ['z_press', 'Z Press', 'Push', ['Schulter', 'Trizeps', 'Bauch'], 'Langhantel', 'kg', 'Auf dem Boden mit gestreckten Beinen sitzen und über Kopf drücken – ohne Abstützen.', ['Z-Press']],
  ['kh_schulterdruecken_stehend', 'Schulterdrücken stehend (KH)', 'Push', ['Schulter', 'Trizeps', 'Bauch'], 'Kurzhantel', 'kg', 'Bauch fest, kein Hohlkreuz, Hanteln über dem Kopf zusammenführen.', ['Standing Dumbbell Shoulder Press', 'Standing Dumbbell Press']],
  ['aussenrotation_kabel', 'Außenrotation Kabel', 'Pull', ['Schulter'], 'Kabel', 'kg', 'Ellbogen am Körper, Unterarm nach außen drehen – leicht und sauber.', ['Cable External Rotation', 'External Rotation (Cable)']],
  ['aussenrotation_kh', 'Außenrotation Kurzhantel', 'Pull', ['Schulter'], 'Kurzhantel', 'kg', 'Seitlich liegend, Ellbogen am Körper, Hantel nach oben drehen.', ['Dumbbell External Rotation', 'Side Lying External Rotation']],
  ['kh_skullcrusher', 'Skull Crusher Kurzhantel', 'Push', ['Trizeps'], 'Kurzhantel', 'kg', 'Oberarme senkrecht, Hanteln neben den Kopf absenken.', ['Dumbbell Skull Crusher', 'Dumbbell Lying Triceps Extension']],
  ['jm_press', 'JM Press', 'Push', ['Trizeps', 'Brust'], 'Langhantel', 'kg', 'Mischung aus engem Bankdrücken und Skull Crusher, Stange Richtung Kinn.', ['JM Press (Barbell)']],
  ['kickback_kabel', 'Trizeps-Kickback Kabel', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Oberkörper vorgebeugt, Oberarm fix, Arm nach hinten strecken.', ['Cable Triceps Kickback', 'Cable Tricep Kickback']],
  ['trizeps_maschine', 'Trizepsmaschine', 'Push', ['Trizeps'], 'Maschine', 'kg', 'Ellbogen auf dem Polster, unten voll strecken.', ['Triceps Extension Machine', 'Triceps Extension (Machine)', 'Seated Triceps Press']],
  ['pushdown_untergriff', 'Trizeps-Pushdown Untergriff', 'Push', ['Trizeps'], 'Kabel', 'kg', 'Stange im Untergriff, Ellbogen bleiben am Körper.', ['Reverse Grip Pushdown', 'Reverse Grip Triceps Pushdown', 'Underhand Pushdown']],
  ['pushdown_vgriff', 'Trizeps-Pushdown V-Griff', 'Push', ['Trizeps'], 'Kabel', 'kg', 'V-Griff nach unten drücken, oben nicht zu weit hoch.', ['V-Bar Pushdown', 'Triceps Pushdown (V-Bar)']],
  ['dips_gewicht', 'Dips mit Gewicht', 'Push', ['Brust', 'Trizeps', 'Schulter'], 'Körpergewicht', 'kg', 'Zusatzgewicht am Gürtel, Oberkörper leicht nach vorn.', ['Weighted Dips', 'Weighted Dip']],
  ['trap_bar_kreuzheben', 'Trap-Bar-Kreuzheben', 'Pull', ['Gesäß', 'Quadrizeps', 'Rücken', 'Beinbeuger', 'Trapez'], 'Langhantel', 'kg', 'In der Hex-Bar stehen, Brust raus, mit den Beinen nach oben drücken.', ['Trap Bar Deadlift', 'Hex Bar Deadlift', 'Hexbar Kreuzheben']],
  ['defizit_kreuzheben', 'Defizit-Kreuzheben', 'Pull', ['Unterer Rücken', 'Beinbeuger', 'Gesäß', 'Rücken'], 'Langhantel', 'kg', 'Auf einer Erhöhung stehen – längerer Weg vom Boden.', ['Deficit Deadlift']],
  ['kabelrudern_einarmig', 'Kabelrudern einarmig', 'Pull', ['Rücken', 'Bizeps', 'Hintere Schulter'], 'Kabel', 'kg', 'Ellbogen nah am Körper zur Hüfte ziehen, Rumpf nicht verdrehen.', ['Single Arm Cable Row', 'One Arm Cable Row', 'Single Arm Seated Cable Row']],
  ['kabelrudern_breit', 'Kabelrudern breit', 'Pull', ['Rücken', 'Hintere Schulter', 'Trapez'], 'Kabel', 'kg', 'Breiter Griff, Ellbogen nach außen zur Brust ziehen.', ['Wide Grip Seated Cable Row', 'Wide Grip Cable Row']],
  ['rudern_plate', 'Rudern Plate-Loaded', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Brust am Polster, Schulterblätter zusammen, jede Seite für sich.', ['Hammer Strength Row', 'Iso-Lateral Row', 'Plate Loaded Row', 'Iso-Lateral Low Row']],
  ['high_row', 'High Row Maschine', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps'], 'Maschine', 'kg', 'Von oben schräg nach unten-hinten ziehen.', ['High Row', 'Iso-Lateral High Row', 'Hammer Strength High Row']],
  ['low_row', 'Low Row Maschine', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Zur Hüfte ziehen, Brust bleibt am Polster.', ['Low Row', 'Seated Low Row (Machine)']],
  ['latzug_plate', 'Latzug Plate-Loaded', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Ellbogen nach unten zur Hüfte ziehen, oben voll strecken.', ['Iso-Lateral Lat Pulldown', 'Hammer Strength Lat Pulldown', 'Iso-Lateral Front Lat Pulldown']],
  ['latzug_maschine', 'Latzug Maschine', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Oberschenkel fixiert, Griffe zur oberen Brust ziehen.', ['Lat Pulldown (Machine)', 'Machine Lat Pulldown']],
  ['tbar_brustgestuetzt', 'T-Bar Rudern brustgestützt', 'Pull', ['Rücken', 'Hintere Schulter', 'Bizeps'], 'Maschine', 'kg', 'Brust auf dem Polster, ohne Schwung rudern.', ['Chest Supported T-Bar Row', 'T-Bar Row (Machine)']],
  ['rudern_multipresse', 'Rudern Multipresse', 'Pull', ['Rücken', 'Bizeps'], 'Maschine', 'kg', 'Vorgebeugt mit geradem Rücken, Stange zum Bauch ziehen.', ['Smith Machine Row', 'Bent Over Row (Smith Machine)']],
  ['pullover_maschine', 'Pullover Maschine', 'Pull', ['Rücken'], 'Maschine', 'kg', 'Arme im großen Bogen von oben nach unten führen.', ['Pullover Machine', 'Machine Pullover', 'Lat Pullover Machine']],
  ['rueckenstrecker_maschine', 'Rückenstrecker Maschine', 'Pull', ['Unterer Rücken', 'Gesäß'], 'Maschine', 'kg', 'Langsam nach hinten strecken, nicht überstrecken.', ['Back Extension Machine', 'Lower Back Machine', 'Back Extension (Machine)']],
  ['reverse_hyper', 'Reverse Hyperextension', 'Pull', ['Unterer Rücken', 'Gesäß', 'Beinbeuger'], 'Maschine', 'kg', 'Oberkörper liegt, Beine kontrolliert nach hinten-oben heben.', ['Reverse Hyper', 'Reverse Hyperextensions']],
  ['shrug_multipresse', 'Shrugs Multipresse', 'Pull', ['Trapez'], 'Maschine', 'kg', 'Schultern gerade nach oben ziehen, kurz halten.', ['Smith Machine Shrug', 'Shrug (Smith Machine)']],
  ['shrug_maschine', 'Shrugs Maschine', 'Pull', ['Trapez'], 'Maschine', 'kg', 'Schultern zu den Ohren, nicht mit den Armen ziehen.', ['Shrug Machine', 'Machine Shrug']],
  ['rear_delt_row', 'Rear Delt Row (KH)', 'Pull', ['Hintere Schulter', 'Rücken'], 'Kurzhantel', 'kg', 'Ellbogen weit nach außen zur Seite ziehen.', ['Dumbbell Rear Delt Row', 'Rear Delt Row']],
  ['klimmzug_gewicht', 'Klimmzug mit Gewicht', 'Pull', ['Rücken', 'Bizeps'], 'Körpergewicht', 'kg', 'Zusatzgewicht am Gürtel, Kinn über die Stange.', ['Weighted Pull Up', 'Weighted Pull-Up', 'Weighted Chin Up']],
  ['incline_hammer_curl', 'Incline Dumbbell Hammer Curl', 'Pull', ['Bizeps', 'Unterarme'], 'Kurzhantel', 'kg', 'Auf der Schrägbank, Arme hängen hinter dem Körper, neutraler Griff.', ['Schrägbank Hammer Curl', 'Incline Hammer Curl', 'Hammer Curl (Incline)']],
  ['cross_body_hammer', 'Cross-Body Hammer Curl', 'Pull', ['Bizeps', 'Unterarme'], 'Kurzhantel', 'kg', 'Hantel quer vor dem Körper zur gegenüberliegenden Schulter.', ['Crossbody Hammer Curl', 'Cross Body Curl']],
  ['preacher_kh', 'Preacher Curl Kurzhantel', 'Pull', ['Bizeps'], 'Kurzhantel', 'kg', 'Oberarm flach auf dem Polster, unten nicht ganz ablegen.', ['Dumbbell Preacher Curl', 'Preacher Curl (Dumbbell)']],
  ['preacher_maschine', 'Preacher Curl Maschine', 'Pull', ['Bizeps'], 'Maschine', 'kg', 'Ellbogen auf dem Polster, ohne Schwung.', ['Machine Preacher Curl']],
  ['preacher_kabel', 'Preacher Curl Kabel', 'Pull', ['Bizeps'], 'Kabel', 'kg', 'Konstanter Zug über den ganzen Weg.', ['Cable Preacher Curl']],
  ['zottman_curl', 'Zottman Curl', 'Pull', ['Bizeps', 'Unterarme'], 'Kurzhantel', 'kg', 'Hoch im Untergriff, oben drehen, im Obergriff langsam ab.', ['Zottman Curls']],
  ['drag_curl', 'Drag Curl', 'Pull', ['Bizeps'], 'Langhantel', 'kg', 'Stange am Körper entlang nach oben ziehen, Ellbogen gehen nach hinten.', ['Barbell Drag Curl']],
  ['kabel_curl_hoch', 'Kabel-Curl über Kopf', 'Pull', ['Bizeps'], 'Kabel', 'kg', 'Arme auf Schulterhöhe, Hände zum Kopf ziehen.', ['High Cable Curl', 'Overhead Cable Curl', 'Double Biceps Cable Curl']],
  ['kabel_curl_einarmig', 'Kabel-Curl einarmig', 'Pull', ['Bizeps'], 'Kabel', 'kg', 'Oberarm ruhig, oben kurz anspannen.', ['Single Arm Cable Curl', 'One Arm Cable Curl']],
  ['hamstring_curl_machine', 'Hamstring Curl Machine', 'Legs', ['Beinbeuger'], 'Maschine', 'kg', 'Fersen zum Gesäß ziehen, Hüfte bleibt am Polster, langsam zurück.', ['Beinbeuger Maschine', 'Hamstring Curl', 'Hamstring Curl (Machine)', 'Leg Curl Machine']],
  ['beinpresse_horizontal', 'Beinpresse sitzend', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Horizontal sitzend, Knie folgen den Zehen, unten nicht abrunden.', ['Seated Leg Press', 'Horizontal Leg Press']],
  ['v_squat', 'V-Squat Maschine', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Schultern unter den Polstern, tief und kontrolliert.', ['V Squat', 'V-Squat']],
  ['reverse_hack', 'Reverse Hack Squat', 'Legs', ['Gesäß', 'Quadrizeps', 'Beinbeuger'], 'Maschine', 'kg', 'Gesicht zur Maschine, Hüfte weit nach hinten.', ['Reverse Hack Squat (Machine)']],
  ['split_squat_multipresse', 'Split Squat Multipresse', 'Legs', ['Quadrizeps', 'Gesäß'], 'Maschine', 'kg', 'Schrittstellung unter der Stange, hinteres Knie Richtung Boden.', ['Smith Machine Split Squat', 'Smith Machine Lunge']],
  ['hip_thrust_multipresse', 'Hip Thrust Multipresse', 'Legs', ['Gesäß', 'Beinbeuger'], 'Maschine', 'kg', 'Oberer Rücken auf der Bank, oben Gesäß fest anspannen.', ['Smith Machine Hip Thrust']],
  ['hip_thrust_kh', 'Hip Thrust Kurzhantel', 'Legs', ['Gesäß', 'Beinbeuger'], 'Kurzhantel', 'kg', 'Hantel auf der Hüfte, Kinn zur Brust.', ['Dumbbell Hip Thrust']],
  ['hip_thrust_einbeinig', 'Hip Thrust einbeinig', 'Legs', ['Gesäß', 'Beinbeuger'], 'Körpergewicht', 'reps', 'Ein Bein in der Luft, Becken bleibt gerade.', ['Single Leg Hip Thrust']],
  ['waden_multipresse', 'Wadenheben Multipresse', 'Legs', ['Waden'], 'Maschine', 'kg', 'Fußballen auf einer Erhöhung, ganz tief und ganz hoch.', ['Smith Machine Calf Raise']],
  ['donkey_calf', 'Donkey Calf Raise', 'Legs', ['Waden'], 'Maschine', 'kg', 'Vorgebeugt mit geradem Rücken, Fersen tief sinken lassen.', ['Donkey Calf Raises', 'Esel-Wadenheben']],
  ['pull_through', 'Cable Pull-Through', 'Legs', ['Gesäß', 'Beinbeuger'], 'Kabel', 'kg', 'Seil zwischen den Beinen, Hüfte nach hinten schieben und nach vorn strecken.', ['Pull Through', 'Kabel Pull-Through']],
  ['seitl_ausfall', 'Seitliche Ausfallschritte', 'Legs', ['Adduktoren', 'Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Großer Schritt zur Seite, anderes Bein bleibt gestreckt.', ['Lateral Lunge', 'Side Lunge']],
  ['curtsy_lunge', 'Curtsy Lunge', 'Legs', ['Gesäß', 'Quadrizeps', 'Abduktoren'], 'Kurzhantel', 'kg', 'Bein diagonal hinter dem Standbein absetzen.', ['Curtsy Lunges', 'Hofknicks-Ausfallschritt']],
  ['cossack_squat', 'Cossack Squat', 'Legs', ['Adduktoren', 'Quadrizeps', 'Gesäß'], 'Körpergewicht', 'reps', 'Weit gegrätscht zu einer Seite absinken, anderes Bein gestreckt.', ['Kosaken-Kniebeuge', 'Cossack Squats']],
  ['jump_squat', 'Jump Squat', 'Legs', ['Quadrizeps', 'Gesäß', 'Waden'], 'Körpergewicht', 'reps', 'Aus der Hocke explosiv springen, weich landen.', ['Squat Jump', 'Sprungkniebeuge']],
  ['kh_kniebeuge', 'Kniebeuge Kurzhantel', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Hanteln seitlich halten, aufrecht tief beugen.', ['Dumbbell Squat']],
  ['heel_elevated_squat', 'Kniebeuge Fersen erhöht', 'Legs', ['Quadrizeps', 'Gesäß'], 'Kurzhantel', 'kg', 'Fersen auf einer Scheibe – Knie dürfen weit nach vorn.', ['Heel Elevated Squat', 'Cyclist Squat']],
  ['abduktion_kabel', 'Abduktion Kabel', 'Legs', ['Abduktoren', 'Gesäß'], 'Kabel', 'kg', 'Fußschlaufe, Bein seitlich wegführen, Oberkörper ruhig.', ['Cable Hip Abduction', 'Standing Cable Abduction']],
  ['adduktion_kabel', 'Adduktion Kabel', 'Legs', ['Adduktoren'], 'Kabel', 'kg', 'Bein vor dem Standbein vorbei nach innen ziehen.', ['Cable Hip Adduction', 'Standing Cable Adduction']],
  ['beinstrecker_einbeinig', 'Beinstrecker einbeinig', 'Legs', ['Quadrizeps'], 'Maschine', 'kg', 'Oben kurz halten, langsam ablassen.', ['Single Leg Extension', 'Single Leg Leg Extension']],
  ['beincurl_einbeinig', 'Beincurl einbeinig', 'Legs', ['Beinbeuger'], 'Maschine', 'kg', 'Jede Seite einzeln – gut gegen Ungleichgewichte.', ['Single Leg Curl', 'Single Leg Hamstring Curl']],
  ['glute_maschine', 'Glute Kickback Maschine', 'Legs', ['Gesäß'], 'Maschine', 'kg', 'Bein nach hinten-oben drücken, Becken bleibt gerade.', ['Glute Kickback Machine', 'Glute Machine']],
  ['kh_rdl_einbeinig_kabel', 'Kabel-Kreuzheben einbeinig', 'Legs', ['Beinbeuger', 'Gesäß'], 'Kabel', 'kg', 'Hüfte gerade halten, Oberkörper und hinteres Bein bilden eine Linie.', ['Single Leg Cable RDL', 'Cable Single Leg Deadlift']],
  ['oblique_rotation', 'Oblique Rotation Machine', 'Core', ['Bauch'], 'Maschine', 'kg', 'Becken fixiert, Oberkörper kontrolliert zur Seite drehen – beide Seiten gleich oft.', ['Rotationsmaschine', 'Torso Rotation', 'Torso Rotation Machine', 'Rotary Torso', 'Bauch-Rotation Maschine']],
  ['toes_to_bar', 'Toes to Bar', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Hängend die Füße zur Stange führen, ohne Schwung.', ['T2B', 'Hanging Toes to Bar']],
  ['negativ_crunch', 'Negativ-Crunch', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Auf der Negativbank, Oberkörper einrollen statt hochreißen.', ['Decline Crunch', 'Decline Sit Up', 'Decline Sit-Up']],
  ['kabel_crunch_seitlich', 'Seitlicher Kabel-Crunch', 'Core', ['Bauch'], 'Kabel', 'kg', 'Seitlich zum Kabel, Rumpf zur Seite beugen.', ['Cable Oblique Crunch', 'Cable Side Crunch']],
  ['landmine_rotation', 'Landmine Rotation', 'Core', ['Bauch', 'Schulter'], 'Langhantel', 'kg', 'Stange mit gestreckten Armen von Hüfte zu Hüfte führen.', ['Landmine 180', 'Landmine Twist']],
  ['heel_touch', 'Heel Touches', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Schultern leicht angehoben, abwechselnd zu den Fersen tippen.', ['Fersen tippen', 'Heel Taps', 'Oblique Heel Touch']],
  ['flutter_kicks', 'Flutter Kicks', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Unterer Rücken bleibt am Boden, Beine flattern knapp darüber.', ['Beinschere', 'Scissor Kicks']],
  ['sit_up_gewicht', 'Sit-Up mit Gewicht', 'Core', ['Bauch'], 'Kurzhantel', 'kg', 'Scheibe an der Brust, langsam abrollen.', ['Weighted Sit Up', 'Weighted Sit-Up']],
  ['hanging_oblique', 'Hängendes Knieheben seitlich', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Knie abwechselnd schräg zur Seite hochziehen.', ['Hanging Oblique Knee Raise', 'Hanging Oblique Raise']],
  ['side_bend_roman', 'Seitbeugen am Rückenstrecker', 'Core', ['Bauch'], 'Körpergewicht', 'reps', 'Seitlich im Gerät, Oberkörper seitlich absenken und heben.', ['Roman Chair Side Bend', '45 Degree Side Bend']],
  ['plank_gewicht', 'Plank mit Gewicht', 'Core', ['Bauch'], 'Körpergewicht', 'sec', 'Scheibe auf dem oberen Rücken, Körper bleibt gerade.', ['Weighted Plank']],
  ['ab_crunch_kabel_stehend', 'Kabel-Crunch stehend', 'Core', ['Bauch'], 'Kabel', 'kg', 'Stehend vom oberen Kabel nach unten einrollen.', ['Standing Cable Crunch']],
  ['devil_press', 'Devil Press', 'Full Body', ['Schulter', 'Gesäß', 'Brust', 'Beinbeuger'], 'Kurzhantel', 'kg', 'Burpee auf die Hanteln, dann in einem Zug über Kopf.', ['Devils Press', "Devil's Press"]],
  ['kb_thruster', 'Kettlebell Thruster', 'Full Body', ['Quadrizeps', 'Schulter', 'Gesäß'], 'Kettlebell', 'kg', 'Aus der Front-Kniebeuge direkt über Kopf drücken.', ['KB Thruster']],
  ['kb_windmill', 'Kettlebell Windmill', 'Full Body', ['Bauch', 'Schulter'], 'Kettlebell', 'kg', 'Kettlebell über Kopf, Blick zur Glocke, seitlich absenken.', ['KB Windmill', 'Windmill']],
  ['kb_press', 'Kettlebell Press', 'Push', ['Schulter', 'Trizeps'], 'Kettlebell', 'kg', 'Aus der Rack-Position strikt über Kopf drücken.', ['Kettlebell Overhead Press', 'KB Press']],
  ['kb_row', 'Kettlebell Rudern', 'Pull', ['Rücken', 'Bizeps'], 'Kettlebell', 'kg', 'Abgestützt vorgebeugt, Kettlebell zur Hüfte ziehen.', ['Kettlebell Row', 'KB Row']],
  ['sandbag_clean', 'Sandbag Clean', 'Full Body', ['Gesäß', 'Rücken', 'Trapez'], 'Kurzhantel', 'kg', 'Sandsack vom Boden explosiv auf die Schulter oder Brust.', ['Sandsack umsetzen', 'Sandbag to Shoulder']]
];

const EX_PREFIX = 'ex_';
const SEED_VERSION = 5;
/** Neue Bibliotheks-Übungen bei bestehenden Konten einmalig ergänzen (nur fehlende IDs) */
function ensureSeeds() {
  const v = S().seedVersion || 1;
  if (v >= SEED_VERSION) return;
  const ops = [];
  let added = 0;
  if (v < 2) {
    const have = new Set(Store.all('exercises').map(e => e.id));
    seedExerciseDocs().filter(e => !have.has(e.id)).forEach(e => { ops.push({ type: 'put', coll: 'exercises', id: e.id, doc: e, replace: true }); added++; });
    if (added && !have.size) added = 0;
  }
  if (v >= 2 && v < 5) {
    // Neue Bibliotheks-Übungen ergänzen (Cardio, Oktober-Erweiterung)
    const have = new Set(Store.all('exercises').map(e => e.id));
    seedExerciseDocs().filter(e => !have.has(e.id)).forEach(e => { ops.push({ type: 'put', coll: 'exercises', id: e.id, doc: e, replace: true }); added++; });
  }
  let patch = { seedVersion: SEED_VERSION };
  if (v < 3) {
    // Vorgeschlagene Pläne entfernen, eigene Pläne in „Workouts + Wochenplan" umwandeln
    const now = Date.now();
    for (const p of Store.all('plans')) {
      if (isSchedule(p)) continue;
      if (!p.isCustom && !p.updatedAt) { ops.push({ type: 'del', coll: 'plans', id: p.id }); continue; }
      const ids = (p.days || []).map((d, i) => {
        const id = p.id + '_w' + i;
        ops.push({ type: 'put', coll: 'templates', id, doc: { name: d.name || 'Workout', exercises: d.exercises || [], createdAt: now + i, updatedAt: now }, replace: true });
        return id;
      });
      if (p.id === 'plan_my_workouts' || !ids.length) { ops.push({ type: 'del', coll: 'plans', id: p.id }); continue; }
      const pattern = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] }[Math.min(7, ids.length)];
      const schedule = Array(7).fill(null);
      pattern.forEach((wd, i) => { schedule[wd] = ids[i]; });
      ops.push({ type: 'put', coll: 'plans', id: p.id, doc: { name: p.name, schedule, isCustom: true, createdAt: p.createdAt || now, updatedAt: now }, replace: true });
    }
  }
  if (ops.length) Store.batch(ops).catch(fsError);
  if (v < 3) { const ap = Store.raw('plans', S().activePlanId); patch.activePlanId = isSchedule(ap) ? ap.id : ((Store.all('plans').find(isSchedule) || {}).id || ''); }
  Store.saveSettings(patch);
  if (added) toast(`${added} neue Übungen in der Bibliothek`, 'success', { duration: 4000 });
}
function seedExerciseDocs() {
  const now = Date.now();
  return [...SEED_EXERCISES, ...SEED_EXERCISES_2, ...SEED_CARDIO, ...SEED_EXERCISES_3].map(([id, name, category, muscleGroups, equipment, defaultUnit, notes, aliases]) => ({
    id: EX_PREFIX + id, name, category, muscleGroups, equipment, isCustom: false, notes, defaultUnit, aliases: aliases || [], createdAt: now
  }));
}
/** Big 3 – mehrere Varianten zählen zusammen */
const BIG3 = [
  { key: 'bench', label: 'Bank', ids: ['ex_bankdruecken'] },
  { key: 'squat', label: 'Kniebeuge', ids: ['ex_kniebeuge', 'ex_kniebeuge_lowbar'] },
  { key: 'dead', label: 'Kreuzheben', ids: ['ex_kreuzheben', 'ex_sumo_kreuzheben'] }
];


