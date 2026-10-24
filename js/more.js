/* Trainio – Mehr-Tab: Konto, Einstellungen, Daten
   Teil der App: alle js/*.js-Dateien teilen sich einen gemeinsamen Gültigkeitsbereich und werden
   in der Reihenfolge aus index.html geladen. */
'use strict';

/* ==========================================================================
   15. View: Mehr (Konto, Einstellungen, Daten, Tools, Über)
   ========================================================================== */
let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function setLine(title, sub, control) {
  return `<div class="set-line"><div class="sl-main"><div class="sl-title">${title}</div>${sub ? `<div class="sl-sub">${sub}</div>` : ''}</div>${control}</div>`;
}
function toggleCtl(key, extra = '') {
  const on = key.startsWith('f_') ? S()[key] !== false : !!S()[key];
  return `<label class="switch"><input type="checkbox" switch data-ch="setToggle" data-k="${key}" ${on ? 'checked' : ''} ${extra} aria-label="${key}"><span></span></label>`;
}
function segCtl(key, opts) {
  return `<div class="seg sm">${opts.map(([v, l]) => `<button class="${String(S()[key]) === String(v) ? 'active' : ''}" data-act="setSeg" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function selectCtl(key, opts) {
  return `<select class="select" data-ch="setSelect" data-k="${key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(S()[key]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
const navRowInline = (act, ic, title, sub = '') => `<button class="list-item" data-act="${act}"><span class="li-main"><span class="li-title">${title}</span>${sub ? `<div class="li-sub">${esc(sub)}</div>` : ''}</span>${icon('chevR', 'li-chev')}</button>`;
const navRow = (act, ic, title, sub = '', cls = '') => `<button class="list-item ${cls}" data-act="${act}"><span class="li-icon">${icon(ic)}</span><span class="li-main"><span class="li-title">${title}</span>${sub ? `<div class="li-sub">${sub}</div>` : ''}</span>${icon('chevR', 'li-chev')}</button>`;

/* Mehr-Tab: Übersicht (Suche, Konto, Gruppen) – jede Gruppe öffnet sich als eigene Seite.
   Gruppe: { id, title, ic, sub, intro?, head?, foot?, sections: [[Überschrift, Einträge, HTML über der Liste?]] }
   Eintrag: { t: Titel, s: Untertitel, kw: Suchwörter, html, only: 'search' = nur in der Suche } */
let moreSub = (!isIOSDevice && history.state && history.state.moreSub) || null, moreQ = '', moreScroll = 0;
const mi = (t, s, ctl, kw = '') => ({ t, s, kw, html: setLine(t, s, ctl) });
const mRow = (html, t, s = '', kw = '', only = '') => ({ t, s, kw, html, only });
const lastImportDoc = () => Store.all('imports').filter(i => !i.undoneAt).sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0))[0];

function moreGroups() {
  const user = Auth.user();
  const s = S();
  const lastImport = lastImportDoc();
  const plans = Store.all('plans').sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const libRow = F('f_exercises') ? [] : [mRow(navRow('openLibrary', 'book', 'Übungs-Bibliothek', 'Übungen ansehen, anlegen & bearbeiten'), 'Übungs-Bibliothek', 'Übungen ansehen, anlegen & bearbeiten', 'übungen bibliothek')];
  const hidden = FEATURES.flatMap(g => g[1]).filter(([k]) => !F(k)).length;
  return [
    { id: 'account', title: 'Konto & Profil', ic: 'user', sub: 'Anmeldung, Sync, Name, Geschlecht, Geburtsjahr',
      head: `<div class="card">
        ${user ? `
          <div class="acc-card">
            <div class="avatar">${user.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer">` : esc((user.name || user.email || '?')[0].toUpperCase())}</div>
            <div class="grow" style="min-width:0"><div class="bold ellipsis">${esc(user.name || 'Angemeldet')}</div><div class="small dim ellipsis">${esc(accountLine(user))}</div></div>
            ${syncPill()}
          </div>
          <p class="small dim mt-12">Alle Daten werden live zwischen deinen Geräten synchronisiert – auch offline getrackte Workouts, sobald wieder Netz da ist.</p>
          <button class="btn btn-secondary btn-block mt-12" data-act="signOut">${icon('logout')} Abmelden</button>`
        : `
          <div class="acc-card">
            <div class="avatar">${icon('user')}</div>
            <div class="grow"><div class="bold">Lokaler Modus</div><div class="small dim">${Auth.configured() ? 'Melde dich an, um iPhone und Laptop zu synchronisieren.' : 'Firebase ist noch nicht konfiguriert – deine Daten bleiben auf diesem Gerät.'}</div></div>
          </div>
          ${Auth.providers().map((k, i) => `<button class="btn btn-secondary btn-block ${i ? 'mt-8' : 'mt-12'}" data-act="signIn" data-p="${k}" ${Auth.configured() ? '' : 'disabled'}>${Auth.provider(k).icon} Mit ${Auth.provider(k).label} anmelden</button>`).join('')}
          ${Auth.configured() && Auth.providers().length > 1 ? '<p class="tiny dim mt-8">Jeder Anmeldeweg ist ein eigenes Konto. Angemeldet kannst du weitere verknüpfen – sie führen dann zu denselben Daten.</p>' : ''}
          ${Auth.configured() ? '' : '<p class="tiny dim mt-8">Trage deine Firebase-Config in js/config.js ein (siehe README).</p>'}`}
      </div>`,
      sections: [
        ['', [mRow(user ? setLine('Konto', esc(accountLine(user)), `<button class="btn btn-secondary btn-sm" data-act="signOut">${icon('logout')} Abmelden</button>`)
          : setLine('Konto', 'Lokaler Modus', `<button class="btn btn-secondary btn-sm" data-act="signIn" ${Auth.configured() ? '' : 'disabled'}>Anmelden</button>`),
          'Konto', 'Anmelden, Abmelden, Sync', 'konto login anmelden abmelden google github synchronisieren sync', 'search')]],
        ...(user ? [['Anmeldewege', Auth.providers().map(k => providerRow(k, user)), '<p class="small dim">Verknüpfte Anmeldewege führen zum selben Konto mit denselben Daten.</p>']] : []),
        ['Profil', [
          mi('Name', 'Erscheint im PDF-Export', `<input class="input" data-in="setName" value="${esc(s.displayName)}" placeholder="${esc(user && user.name ? user.name.split(' ')[0] : 'Dein Name')}" style="max-width:150px">`, 'profil'),
          mi('Geschlecht', 'Für Richtwerte (z. B. Taille/Hüfte, VO2max)', segCtl('sex', [['m', 'Mann'], ['f', 'Frau']]), 'mann frau profil'),
          mi('Geburtsjahr', 'Für Pulszonen & VO2max', `<input class="input" data-in="setBirth" inputmode="numeric" autocomplete="off" value="${esc(s.birthYear || '')}" placeholder="z. B. 2005" style="max-width:110px">`, 'alter herz puls zonen vo2max profil'),
          mi('Maximalpuls', 'Leer = aus dem Alter geschätzt (208 − 0,7 × Alter)', `<input class="input" data-in="setHrMax" inputmode="numeric" autocomplete="off" value="${esc(s.hrMax || '')}" placeholder="${Heart.maxHr() && Heart.maxHr().est ? 'ca. ' + Heart.maxHr().v : 'z. B. 195'}" style="max-width:110px">`, 'herzfrequenz max puls zonen herz')]]
      ] },
    { id: 'training', title: 'Training', ic: 'dumbbell', sub: 'Plan, Wochenziel, Herz-Plan, Einheit, Gewichte, Aufwärmsätze, 1RM-Formel, Zeitraum',
      sections: [
        ['Plan & Woche', [
          mi('Aktiver Trainingsplan', 'Für „Nächstes Training" & Konsistenz', selectCtl('activePlanId', [['', '– keiner –'], ...plans.filter(isSchedule).map(p => [p.id, p.name])]), 'plan programm split'),
          mi('Wochenziel', activePlan() ? `Aus dem Plan: ${planDaysCount(activePlan())}× pro Woche` : 'Geplante Workouts pro Woche', selectCtl('weeklyGoal', [1, 2, 3, 4, 5, 6, 7].map(n => [n, n + '× pro Woche'])), 'ziel trainingstage'),
          mi('Wochenstart', 'Ab welchem Tag eine Woche zählt', segCtl('weekStart', [['monday', 'Mo'], ['sunday', 'So']]), 'montag sonntag kalender')]],
        ...(F('f_heart') ? [['Herz', [
          mi('Herz-Plan', Heart.plan() ? `${Heart.plan().sessions}× pro Woche · ${Heart.plan().hard}× hart · ${Heart.plan().z2} min locker` : 'Aus – Wochenziel fürs Herztraining', `<button class="btn btn-secondary btn-sm" data-act="heartPlan">${Heart.plan() ? 'Bearbeiten' : 'Einrichten'}</button>`, 'herz cardio ausdauer zone 2 intervalle ruhepuls vo2max plan wochenziel'),
          mi('Ruhepuls', 'Im Takt tippen oder 30 Sekunden zählen', `<button class="btn btn-secondary btn-sm" data-act="rhrMeasure">Messen</button>`, 'herz puls ruhepuls messen')]]] : []),
        ['Gewichte', [
          mi('Einheit', 'Alle Gewichte in kg oder lb', segCtl('unit', [['kg', 'kg'], ['lb', 'lb']]), 'kilo pfund lbs'),
          mi('Gewichts-Inkrement', 'Schrittweite der +/- Buttons', segCtl('weightSteps', [[1.25, '1,25'], [2.5, '2,5'], [5, '5']]), 'schritte plus minus steigerung'),
          mi('Stangengewicht', 'Scheibenrechner & Aufwärmsätze', `<input class="input num-input" data-ch="setBar" inputmode="decimal" value="${inputW(s.barKg)}" style="max-width:90px;min-width:0"><span class="small dim">${unit()}</span>`, 'langhantel bar'),
          mRow(navRowInline('openPlatesCfg', 'plate', 'Scheiben & Stange', `${(unit() === 'lb' ? S().platesLb : S().platesKg).map(x => nf(x, 2)).join(' · ')} ${unit()} · Stange ${wNum(S().barKg)}`), 'Scheiben & Stange', 'Verfügbare Scheiben', 'hantelscheiben platten'),
          mRow(navRowInline('openWarmupCfg', 'flame', 'Aufwärmsätze', (S().warmupSteps || []).map(([p, r]) => `${p} %×${r}`).join(' · ') + (S().warmupBar !== false ? ' · leere Stange' : '')), 'Aufwärmsätze', 'Prozent und Wdh. pro Aufwärmsatz', 'aufwärmen warmup')]],
        ['Auswertung', [
          mi('1RM-Formel', 'Für geschätztes Maximum, Diagramme, PRs und Score', selectCtl('e1rmFormula', E1RM_FORMULAS), 'e1rm maximum epley brzycki'),
          mi('Zeitraum im Fortschritt', 'Ist beim Öffnen des Fortschritts ausgewählt', selectCtl('progPeriod', [['last', 'Zuletzt gewählter'], ['4w', '4 Wochen'], ['3m', '3 Monate'], ['6m', '6 Monate'], ['1y', '1 Jahr'], ['all', 'Alles'], ...phases().map(ph => ['ph:' + ph.id, `Phase: ${ph.name}`]),
            ...(String(s.progPeriod).startsWith('ph:') && !phaseById(s.progPeriod.slice(3)) ? [[s.progPeriod, 'Alles (Phase gelöscht)']] : [])]), 'zeitraum standard periode phase fortschritt vorausgewählt')]]
      ] },
    { id: 'workout', title: 'Workout', ic: 'list', sub: 'Eingabe, Vorbelegen, neue Übungen, Ansicht, Beenden',
      sections: [
        ['Eingabe', [
          mi('Eingabe', 'Schlicht: nur Gewicht, Wdh. & Haken · Ausführlich: Stepper, Leisten, Spalten', segCtl('woStyle', [['simple', 'Schlicht'], ['detailed', 'Ausführlich']]), 'schlicht ausführlich stepper'),
          mi('Werte als Text vorausfüllen', 'Aus: Letztes Mal steht grau als Platzhalter – mit dem Pfeil pro Satz übernehmen', toggleCtl('prefillText'), 'vorbelegen platzhalter'),
          mi('Letztes Mal anzeigen', 'Werte vom letzten Training als Hilfe', toggleCtl('woPrev'), 'vorherige werte'),
          s.woStyle === 'detailed' ? mi('RPE anzeigen', 'Anstrengung 6–10 pro Satz', toggleCtl('showRPE'), 'rir') : mi('RPE-Spalte', 'Anstrengung 6–10 pro Satz', toggleCtl('simpleRPE'), 'rir'),
          mi('Nächsten Satz vorbelegen', 'Nach dem Abhaken: Gewicht & Wdh. in den nächsten leeren Satz übernehmen', toggleCtl('carryNext'), 'übernehmen vorbelegen automatisch')]],
        ['Neue Übungen', [
          mi('Standard-Sätze', 'Wenn du eine Übung hinzufügst', selectCtl('defSets', [1, 2, 3, 4, 5, 6, 8, 10].map(n => [n, n + (n === 1 ? ' Satz' : ' Sätze')])), 'sätze anzahl standard'),
          mi('Standard-Wdh.', 'Wdh.-Bereich in neuen Workouts, z. B. 8-12', `<input class="input" data-ch="defReps" value="${esc(defReps())}" inputmode="text" style="max-width:110px">`, 'wiederholungen bereich standard')]],
        ['Ansicht', [
          mi('Standard-Ansicht', 'Liste: alle Übungen · Fokus: eine Übung groß', segCtl('woView', [['list', 'Liste'], ['focus', 'Fokus']]), 'liste fokus'),
          mi('Nur aktuelle Übung offen', 'Fertige & kommende Übungen werden zugeklappt', toggleCtl('woCollapse'), 'zuklappen einklappen'),
          ...(s.woStyle === 'detailed' ? [mi('Übersichtsleiste', 'Alle Übungen mit Fortschritt oben im Workout', toggleCtl('woStrip'), 'leiste')] : []),
          mi('Automatisch weiterscrollen', 'Zur nächsten Übung, wenn eine fertig ist', toggleCtl('autoScroll'), 'scrollen'),
          mi('Bildschirm anlassen', 'Während eines Workouts (Wake Lock)', toggleCtl('wakeLock'), 'display sperre wake lock')]],
        ['Beenden', [
          mi('Nachfrage beim Beenden', 'Immer · nur wenn noch Sätze offen sind · nie', selectCtl('finishConfirm', [['always', 'Immer'], ['open', 'Bei offenen Sätzen'], ['never', 'Nie']]), 'bestätigen nachfragen beenden offen')]]
      ] },
    { id: 'rest', title: 'Pause & Timer', ic: 'timer', sub: 'Standard-Pause, Auto-Start, Ton, Vorwarnung, Aufwärm-/Drop-Pause',
      sections: [
        ['', [
          mi('Standard-Pause', 'Wenn der Plan nichts vorgibt', selectCtl('defaultRestSec', [45, 60, 90, 120, 150, 180, 240, 300].map(n => [n, fmtClock(n) + ' min'])), 'pausenzeit satzpause timer rest'),
          mi('Pausen-Timer', 'Startet automatisch nach jedem erledigten Satz', toggleCtl('autoRest'), 'timer pause automatisch starten'),
          mi('Pausen-Benachrichtigung', 'Push-Hinweis, wenn die App im Hintergrund ist', toggleCtl('notifyRestDone'), 'mitteilung push timer'),
          mi('Ton bei Pausenende', 'Kurzer Ton, wenn die Pause vorbei ist', toggleCtl('sound'), 'sound klang timer'),
          mi('Pausen-Ton', 'Klang am Pausenende – ▶ zum Probehören', `${selectCtl('restSound', REST_SOUNDS)}<button class="btn-icon" data-act="soundTest" aria-label="Probehören">${icon('play')}</button>`, 'klang sound gong glocke'),
          mi('Vorwarnung', 'Kurzer Ton & Vibration vor Pausenende', selectCtl('restWarnSec', [[0, 'Aus'], [5, '5 s vorher'], [10, '10 s vorher'], [15, '15 s vorher']]), 'warnung vorher countdown')]],
        ['Besondere Sätze', [
          mi('Nach Aufwärmsätzen', 'Höchstens so lang wie die normale Pause', selectCtl('restWarmSec', [[15, '0:15 min'], [30, '0:30 min'], [45, '0:45 min'], [60, '1:00 min'], [90, '1:30 min'], ['same', 'Wie normal']]), 'aufwärmen warmup pause'),
          mi('Vor einem Drop-Satz', 'Zwischen Satz und Drop-Satz – meist direkt weiter', selectCtl('restDropSec', [['normal', 'Wie normal'], [0, 'Keine Pause'], [10, '0:10 min'], [15, '0:15 min'], [30, '0:30 min']]), 'drop dropsatz pause')]]
      ] },
    lookGroup(s),
    { id: 'toasts', title: 'Meldungen', ic: 'info', sub: 'Hinweise oben im Bildschirm ein- oder ausschalten',
      intro: 'Kurze Meldungen oben im Bildschirm. Fehler, Hinweise wie „Bitte ein Gewicht eintragen" und Meldungen mit Knopf (z. B. „Rückgängig") kommen immer. Antippen oder nach oben bzw. zur Seite wischen schließt eine Meldung sofort.',
      sections: [['', TOAST_CATS.map(([k, t, sub]) => mi(t, esc(sub), toggleCtl('toast_' + k), 'meldung hinweis toast benachrichtigung nervt'))]] },
    { id: 'features', title: 'Tabs & Funktionen', ic: 'sliders', sub: `${hidden || 'Keine'} ausgeblendet · Tabs, Körper-Tab, Timer, PRs, Auswertungen …`,
      intro: 'Schalte aus, was du nicht brauchst – die App wird dadurch schlanker. Deine Daten bleiben immer erhalten.',
      sections: FEATURES.map(([g, items], i) => [g, [...items.map(([k, l, sub]) => mi(esc(l), sub ? esc(sub) : '', toggleCtl(k), 'funktion ausblenden einblenden')), ...(i === 0 ? libRow : [])]]) },
    { id: 'data', title: 'Daten', ic: 'database', sub: 'Import, Export, Backup, Löschen',
      sections: [
        ['Importieren', [
          ...(F('f_arrow') ? [mRow(navRow('openArrow', 'upload', 'Arrow-Import', 'Workouts aus der Arrow-App übernehmen'), 'Arrow-Import', 'Workouts aus der Arrow-App übernehmen', 'import', 'search')] : []),
          ...(lastImport ? [mRow(navRow('undoImport', 'undo', 'Letzten Import rückgängig machen', esc(fmtDate(isoDate(new Date(lastImport.importedAt))))), 'Letzten Import rückgängig machen', '', 'import', 'search')] : []),
          mRow(navRow('bwImport', 'scale', 'Gewicht importieren', 'CSV aus Waagen-/Gewichts-App'), 'Gewicht importieren', 'CSV aus Waagen-/Gewichts-App', 'körpergewicht waage import')],
          // über der Liste: großer Arrow-Knopf + Rückgängig (wie bisher)
          `${F('f_arrow') ? `<button class="btn btn-arrow" data-act="openArrow">${icon('upload')} Arrow-Import</button>` : ''}
          ${lastImport ? `<button class="btn btn-secondary btn-block mt-8" data-act="undoImport" style="flex-wrap:wrap;white-space:normal;padding-top:8px;padding-bottom:8px;row-gap:2px">${icon('undo')} Letzten Import rückgängig machen <span class="small dim">(${esc(fmtDate(isoDate(new Date(lastImport.importedAt))))}, ${lastImport.source === 'weight-csv' ? `${((lastImport.docIds || {}).progress || []).length + ((lastImport.overwritten || []).length)} Gewichtswerte` : `${(lastImport.docIds && lastImport.docIds.workouts || []).length} Workouts`})</span></button>` : ''}`],
        ['Exportieren & Sichern', [
          mRow(navRow('exportCSV', 'file', 'Export CSV', 'Alle Sätze flach – Excel-kompatibel'), 'Export CSV', 'Alle Sätze flach – Excel-kompatibel', 'exportieren tabelle'),
          mRow(navRow('exportPDF', 'file', 'Export PDF', 'Trainingsprotokoll oder Übungs-Report'), 'Export PDF', 'Trainingsprotokoll oder Übungs-Report', 'exportieren drucken'),
          mRow(navRow('backupJSON', 'download', 'Backup JSON', 'Komplettes Backup aller Daten'), 'Backup JSON', 'Komplettes Backup aller Daten', 'sicherung sichern'),
          mRow(navRow('restoreJSON', 'upload', 'Restore', 'Backup-Datei wiederherstellen'), 'Restore', 'Backup-Datei wiederherstellen', 'wiederherstellen backup')]],
        ['', [mRow(navRow('deleteAll', 'trash', 'Alle Daten löschen', 'Mit doppelter Bestätigung', 'danger'), 'Alle Daten löschen', 'Mit doppelter Bestätigung', 'zurücksetzen reset')]]
      ] },
    ...(F('f_tools') ? [{ id: 'tools', title: 'Tools', ic: 'calc', sub: 'Scheibenrechner, 1RM-Rechner',
      sections: [['', [
        mRow(navRow('toolPlates', 'plate', 'Scheibenrechner', 'Welche Scheiben pro Seite?'), 'Scheibenrechner', 'Welche Scheiben pro Seite?', 'rechner'),
        mRow(navRow('tool1RM', 'calc', '1RM-Rechner', 'Max schätzen + Prozent-Tabelle'), '1RM-Rechner', 'Max schätzen + Prozent-Tabelle', 'rechner maximalkraft')]]] }] : []),
    { id: 'app', title: 'App & Hilfe', ic: 'info', sub: `Version ${APP.version}, Updates, Fehlerprotokoll, Kontakt`,
      sections: [['', [
        ...(!isStandalone() && (deferredInstall || Auth.isIOS()) ? [mRow(navRow('install', 'install', 'App installieren', Auth.isIOS() ? 'Zum Home-Bildschirm hinzufügen' : 'Als eigenständige App öffnen'), 'App installieren', 'Zum Home-Bildschirm hinzufügen', 'home bildschirm')] : []),
        mRow(navRow('checkUpdate', 'refresh', 'Nach Updates suchen', `Version ${APP.version}`), 'Nach Updates suchen', `Version ${APP.version}`, 'update aktualisieren neue version'),
        mRow(navRow('openErrLog', 'warn', 'Fehlerprotokoll', ErrLog.all().length ? `${ErrLog.all().length} Einträge – zum Kopieren und Weiterschicken` : 'Keine Fehler aufgezeichnet'), 'Fehlerprotokoll', '', 'fehler absturz log bug'),
        mRow(`<a class="list-item" href="${APP.repo}" target="_blank" rel="noopener"><span class="li-icon">${icon('link')}</span><span class="li-main"><span class="li-title">Repository</span><div class="li-sub">${esc(APP.repo.replace('https://', ''))}</div></span>${icon('chevR', 'li-chev')}</a>`, 'Repository', 'GitHub', 'quellcode code'),
        mRow(`<a class="list-item" href="${APP.contact}" target="_blank" rel="noopener"><span class="li-icon">${icon('mail')}</span><span class="li-main"><span class="li-title">Kontakt & Feedback</span><div class="li-sub">Issue auf GitHub öffnen</div></span>${icon('chevR', 'li-chev')}</a>`, 'Kontakt & Feedback', 'Issue auf GitHub öffnen', 'hilfe fehler melden')]]] }
  ];
}
/* Darstellung (früher ein eigenes Fenster): Vorschau oben, darunter Design, Modus, Farben, Feinschliff … */
function lookGroup(s) {
  const D = designOf(s.design);
  const seg = (k, opts) => `<div class="seg sm">${opts.map(([v, l]) => `<button class="${String(s[k]) === String(v) ? 'active' : ''}" data-act="lookSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sw = (k, label) => `<label class="switch"><input type="checkbox" switch data-ch="lookToggle" data-k="${k}" ${s[k] !== false ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label>`;
  const st = (t, sub, ctl, kw = '') => ({ t, s: sub, kw, html: stackLine(t, sub, ctl) });
  const tg = (k, t, sub = '', kw = '') => mi(t, sub, sw(k, t), kw);
  const accent = Color.valid(s.accent) ? s.accent.toLowerCase() : '';
  const isPreset = ACCENTS.some(([h]) => h === accent);
  return { id: 'look', title: 'Darstellung', ic: 'sun', sub: 'Design, App-Icon, Farben, Modus, Schrift, Navigation, Startseite',
    head: `<div class="card look-preview">
      <div class="stat-grid" style="grid-template-columns:1fr 1fr">
        <div class="stat"><div class="stat-label">${icon('flame')} Streak</div><div class="stat-value">12<small>Wochen</small></div><div class="week-dots"><i class="on"></i><i class="on"></i><i></i><i class="on today"></i><i></i><i></i><i></i></div></div>
        <div class="stat"><div class="stat-label">${icon('bolt')} Volumen</div><div class="stat-value">8,4 t</div><div class="stat-sub"><span class="delta up">${icon('arrowUp')}+12 %</span></div></div>
      </div>
      <div class="row mt-12"><span class="btn btn-primary grow">${icon('play')} Workout starten</span><span class="btn btn-secondary">${icon('layers')}</span></div>
      <div class="chips mt-12"><span class="chip active">Push</span><span class="chip">Pull</span><span class="chip">Legs</span><span class="badge accent">${icon('trophy')} PR</span></div>
    </div>`,
    sections: [
      ['Design', [mRow(`<button class="list-item" data-act="moreSub" data-v="look"><span class="li-icon">${icon('sun')}</span><span class="li-main"><span class="li-title">Design</span><div class="li-sub">${esc(D.name)}</div></span>${icon('chevR', 'li-chev')}</button>`,
          'Design', D.name, 'theme ' + DESIGNS.map(d => d.name).join(' '), 'search')],
        `<div class="design-grid hscroll" data-row="design">${DESIGNS.map(d => `
          <button class="design-tile ${d.id === D.id ? 'active' : ''}" data-act="lookSet" data-k="design" data-v="${d.id}" aria-pressed="${d.id === D.id}">
            ${designPair(d.id)}
            <span class="dt-name">${esc(d.name)}${d.id === D.id ? icon('checkCircle') : ''}</span>
            <span class="dt-desc">${esc(d.desc)}</span>
          </button>`).join('')}</div>`],
      ['App-Icon', [mRow(`<button class="list-item" data-act="moreSub" data-v="look"><span class="li-icon"><img class="li-img" src="${iconSrc()}" alt=""></span><span class="li-main"><span class="li-title">App-Icon</span></span>${icon('chevR', 'li-chev')}</button>`,
          'App-Icon', 'Symbol auf dem Home-Bildschirm', 'icon logo symbol home bildschirm', 'search')],
        `<div class="icon-grid hscroll" data-row="icon">${APP_ICONS.map(id => `<button class="icon-tile ${id === iconId() ? 'active' : ''}" data-act="iconSet" data-v="${id}" aria-pressed="${id === iconId()}" aria-label="App-Icon ${id}"><img src="${iconSrc('icon-192.png', id)}" alt="" decoding="async"></button>`).join('')}</div>${iconHintHtml()}`],
      ['Farben & Modus', [
        st('Modus', '„Uhrzeit": hell von 7 bis 19 Uhr, danach dunkel. Jedes Design gibt es hell und dunkel.', seg('theme', [['light', 'Hell'], ['dark', 'Dunkel'], ['system', 'System'], ['time', 'Uhrzeit']]), 'hell dunkel dark light nachtmodus'),
        st('Akzentfarbe', 'Buttons, Diagramme & Markierungen übernehmen die Farbe. Text-Varianten werden automatisch kontrastreich angepasst.', `<div class="swatches">
          <button class="swatch def ${accent ? '' : 'active'}" data-act="lookSet" data-k="accent" data-v="" aria-label="Design-Standard" title="Design-Standard">${accent ? '' : icon('check')}</button>
          ${ACCENTS.map(([h, n]) => `<button class="swatch ${accent === h ? 'active' : ''}" style="background:${h};color:${Color.contrast('#fff', h) > 2.2 ? '#fff' : '#111'}" data-act="lookSet" data-k="accent" data-v="${h}" aria-label="${n}" title="${n}">${accent === h ? icon('check') : ''}</button>`).join('')}
          <label class="swatch custom ${accent && !isPreset ? 'active' : ''}" title="Eigene Farbe" ${accent && !isPreset ? `style="background:${accent};color:#fff"` : ''}>${icon('plus')}<input type="color" data-in="lookColor" data-ch="lookColor" value="${accent || '#39ff88'}" aria-label="Eigene Farbe"></label>
        </div>`, 'farbe eigene farbe'),
        ...(D.id === 'glass' ? [
          st('Glas-Hintergrund', '', `<div class="wall-row">${WALLS.map(([k, n]) => `<button class="wall-tile ${s.wall === k ? 'active' : ''}" data-theme="${resolvedTheme()}" data-wall="${k}" data-act="lookSet" data-k="wall" data-v="${k}" aria-label="${n}"><span>${n}</span></button>`).join('')}</div>`, 'wallpaper liquid glass'),
          st('Glas-Unschärfe', 'Stärker = mehr Glas, aber mehr Akku', seg('glassBlur', [['off', 'Aus'], ['light', 'Leicht'], ['normal', 'Normal'], ['strong', 'Stark']]), 'blur liquid glass')] : [])]],
      ['Feinschliff', [
        st('Ecken', '', seg('radius', [['auto', 'Design'], ['sharp', 'Eckig'], ['medium', 'Mittel'], ['round', 'Rund']]), 'rund eckig radius'),
        mi('Schrift', '', `<select class="select" data-ch="lookSelect" data-k="font">${[['auto', 'Design-Schrift'], ['system', 'System'], ['rounded', 'Abgerundet'], ['serif', 'Serif'], ['mono', 'Monospace'], ['condensed', 'Schmal (Condensed)']].map(([v, l]) => `<option value="${v}" ${s.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`, 'schriftart font'),
        st('Textgröße', '', seg('textSize', [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]), 'schriftgröße'),
        st('Dichte', 'Abstände & Höhe von Zeilen', seg('density', [['compact', 'Kompakt'], ['normal', 'Normal'], ['comfy', 'Luftig']]), 'kompakt luftig abstand'),
        tg('contrast', 'Hoher Kontrast', 'Kräftigere Nebentexte & Rahmen')]],
      ['Navigation', [
        st('Tab-Leiste', 'Nur auf dem Handy', seg('navStyle', [['auto', 'Design'], ['classic', 'Klassisch'], ['floating', 'Schwebend']]), 'leiste unten schwebend'),
        tg('navLabels', 'Beschriftung unter Icons', '', 'tab leiste text'),
        st('Beim Öffnen', 'Welcher Tab zuerst erscheint', seg('startTab', [['start', 'Start'], ['training', 'Training'], ['last', 'Zuletzt']]), 'start tab')]],
      ['Bewegung & Feedback', [
        st('Animationen', '', seg('motion', [['full', 'Voll'], ['reduced', 'Reduziert'], ['off', 'Aus']]), 'bewegung'),
        tg('haptics', 'Vibration', 'Kurzes Feedback bei Satz, Pause & Schaltern (iPhone ab iOS 18)', 'haptik vibrieren'),
        tg('confetti', 'Konfetti bei neuen PRs', '', 'rekord feiern')]],
      ['Startseite', [
        tg('homeStats', 'Statistik-Kacheln', '', 'start'),
        ...(s.homeStats !== false ? [st('Kacheln', 'Antippen schaltet ein oder aus, die Pfeile ändern die Reihenfolge', tileChooserHtml(), 'kacheln reihenfolge streak volumen score startseite')] : []),
        st('Letzte Workouts', 'Anzahl auf der Startseite', seg('homeRecent', [[0, 'Aus'], [3, '3'], [5, '5'], [8, '8']]), 'start')]]
    ],
    foot: `<button class="btn btn-secondary btn-block mt-24" data-act="lookReset">${icon('undo')} Darstellung zurücksetzen</button>` };
}
/* ---------- Konto: Anmeldewege (Google, GitHub …) verknüpfen / trennen ---------- */
const accountLine = u => u.email || `Angemeldet mit ${u.providers.map(k => Auth.provider(k).label).join(' & ') || 'Konto'}`;
function providerRow(k, user) {
  const pv = Auth.provider(k), on = user.providers.includes(k), only = on && user.providers.length < 2;
  const sub = on ? (only ? 'Verknüpft · einziger Anmeldeweg' : 'Verknüpft') : 'Nicht verknüpft';
  const ctl = !on ? `<button class="btn btn-secondary btn-sm" data-act="linkProv" data-p="${k}">Verknüpfen</button>`
    : only ? '' : `<button class="btn btn-ghost btn-sm" data-act="unlinkProv" data-p="${k}">Trennen</button>`;
  return mRow(setLine(`<span class="prov-t">${pv.icon}${esc(pv.label)}</span>`, sub, ctl), pv.label, sub, 'anmeldeweg anmelden verknüpfen trennen login konto ' + k);
}
Actions.linkProv = el => Auth.link(el.dataset.p);
Actions.unlinkProv = el => Auth.unlink(el.dataset.p);

/* ---------- Startseiten-Kacheln: an/aus + Reihenfolge ---------- */
const tilesOn = () => (Array.isArray(S().homeTiles) ? S().homeTiles : HOME_TILES.slice(0, 4).map(x => x[0])).filter(k => HOME_TILES.some(x => x[0] === k));
function tileChooserHtml() {
  const on = tilesOn(), all = HOME_TILES.filter(([k]) => (k !== 'score' || F('f_score')) && (k !== 'rhr' || F('f_heart'))).map(x => x[0]);
  const order = [...on.filter(k => all.includes(k)), ...all.filter(k => !on.includes(k))];
  return `<div class="tile-list">${order.map(k => {
    const active = on.includes(k), i = on.indexOf(k), name = HOME_TILES.find(x => x[0] === k)[1];
    return `<div class="tile-row ${active ? 'on' : ''}">
      <button class="tile-tog" data-act="tileToggle" data-k="${k}" aria-pressed="${active}">${icon(active ? 'checkCircle' : 'plus')}<span>${name}</span></button>
      ${active ? `<button class="btn-icon" data-act="tileMove" data-k="${k}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="${name} nach oben">${icon('chevU')}</button><button class="btn-icon" data-act="tileMove" data-k="${k}" data-d="1" ${i === on.length - 1 ? 'disabled' : ''} aria-label="${name} nach unten">${icon('chevD')}</button>` : ''}
    </div>`;
  }).join('')}</div>`;
}
Actions.tileToggle = el => {
  const k = el.dataset.k, on = tilesOn();
  Store.saveSettings({ homeTiles: on.includes(k) ? on.filter(x => x !== k) : [...on, k] });
};
Actions.tileMove = el => {
  const on = tilesOn(), i = on.indexOf(el.dataset.k), j = i + +el.dataset.d;
  if (i < 0 || j < 0 || j >= on.length) return;
  [on[i], on[j]] = [on[j], on[i]];
  Store.saveSettings({ homeTiles: on });
};

/* ---------- App-Icon ---------- */
function iconHintHtml() {
  const ios = Auth.isIOS(), android = /Android/i.test(navigator.userAgent);
  if (ios && isStandalone()) return `<button class="btn btn-secondary btn-block mt-12" data-act="iconHome">${icon('install')} Auf dem Home-Bildschirm übernehmen</button>
    <p class="tiny dim mt-8">Auf dem iPhone legt der Home-Bildschirm das Icon beim Hinzufügen fest – die Anleitung führt dich durch.</p>`;
  if (ios) return '<p class="tiny dim mt-12">Jetzt in Safari <b>Teilen → Zum Home-Bildschirm</b> – die App bekommt dann dieses Icon.</p>';
  if (android) return '<p class="tiny dim mt-12">Chrome übernimmt das neue Icon auf dem Home-Bildschirm meist innerhalb eines Tages, manchmal mit Rückfrage. Sofort geht es, wenn du die App neu installierst.</p>';
  return '<p class="tiny dim mt-12">Das Icon im Browser-Tab und in der Seitenleiste ändert sich sofort.</p>';
}
Actions.iconSet = el => { Store.saveSettings({ appIcon: el.dataset.v }); applyIcon(); };
/** iPhone: Icon wird beim Hinzufügen festgelegt → Safari mit ?icon=N öffnen, neu hinzufügen, alte App löschen */
Actions.iconHome = () => {
  const url = location.origin + location.pathname.replace(/index\.html$/, '') + '?icon=' + iconId();
  const user = Auth.user();
  const m = Modal.open({ title: 'Icon auf den Home-Bildschirm', size: 'sm',
    body: `<div class="row" style="gap:12px;align-items:center"><img src="${iconSrc()}" alt="" style="width:56px;height:56px;border-radius:13px;flex-shrink:0"><p class="small dim">Das iPhone legt das Icon beim Hinzufügen zum Home-Bildschirm fest. So bekommst du dieses Icon:</p></div>
      ${user ? '' : `<div class="card mt-12" style="border-color:var(--warning)"><p class="small"><b>Achtung:</b> Du bist nicht angemeldet. Die neue App startet ohne deine Daten, und beim Löschen der alten App gehen sie verloren. Melde dich vorher an (Mehr → Konto & Profil) oder erstelle ein Backup und stelle es in der neuen App wieder her.</p>
        <button class="btn btn-secondary btn-sm mt-8" data-act="backupJSON">${icon('download')} Backup erstellen</button></div>`}
      <ol class="small mt-12" style="padding-left:20px;line-height:1.75">
        <li><b>In Safari öffnen</b> (Knopf unten) – oder den Link kopieren und in Safari einfügen.</li>
        <li>In Safari <b>Teilen</b> ${icon('share').replace('<svg', '<svg width="15" height="15" style="vertical-align:-2px"')} → <b>„Zum Home-Bildschirm“</b> → Hinzufügen.</li>
        <li>Die neue App öffnen und ${user ? 'kurz prüfen, ob deine Daten da sind (Sync)' : 'das Backup wiederherstellen (Mehr → Daten → Restore)'}.</li>
        <li>Erst dann die alte Trainio-App löschen: lange drücken → <b>App entfernen</b>.</li>
      </ol>`,
    foot: `<button class="btn btn-secondary" data-x="copy">${icon('copy')} Link kopieren</button><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener">In Safari öffnen</a>` });
  m.el.addEventListener('click', async e => {
    if (!e.target.closest('[data-x="copy"]')) return;
    try { await navigator.clipboard.writeText(url); toast('Link kopiert – in Safari einfügen', 'success', { cat: 'always' }); }
    catch (err) { promptDialog({ title: 'Link für Safari', label: 'Markieren und kopieren', value: url }); }
  });
};
Actions.lookSet = el => setLook(el.dataset.k, el.dataset.v);
Changes.lookToggle = el => setLook(el.dataset.k, el.checked);
Changes.lookSelect = el => setLook(el.dataset.k, el.value);
Changes.lookColor = el => setLook('accent', el.value.toLowerCase());
// Farbwähler live (ohne Speichern/Re-Render, sonst schließt sich der Picker)
Inputs.lookColor = el => {
  const D = designOf(S().design), mode = resolvedTheme();
  document.documentElement.style.cssText = accentCss(el.value, mode, D.surf[mode]) + (D.id === 'glass' ? `--glass-blur:${cssVar('--glass-blur')};` : '');
};
Actions.lookReset = async () => {
  if (!await confirmDialog({ title: 'Darstellung zurücksetzen?', text: 'Design, Farben, Schrift und alle Anzeige-Optionen gehen zurück auf Standard. Deine Daten bleiben unberührt.', okLabel: 'Zurücksetzen' })) return;
  const patch = {};
  LOOK_KEYS.forEach(x => { patch[x] = DEFAULT_SETTINGS[x]; });
  switchLook(() => Store.saveSettings(patch));
  toast('Darstellung zurückgesetzt', 'success');
};

/* Reihenfolge der Gruppen auf der Übersicht (Blöcke mit Abstand) */
const MORE_BLOCKS = [['training', 'workout', 'rest'], ['look', 'toasts', 'features'], ['data', 'tools', 'app']];
const plainText = h => String(h || '').replace(/<[^>]*>/g, '');
/* Alle Suchwörter müssen vorkommen; kurze (< 4 Zeichen) nur am Wortanfang, sonst findet „rpe" auch „Körper" */
function settingMatches(fields, q) {
  const hay = ' ' + fields.filter(Boolean).map(searchKey).join(' ');
  return searchKey(q).split(' ').every(w => hay.includes(w.length >= 4 ? w : ' ' + w));
}

function moreSearchHtml(q) {
  const hits = moreGroups().map(g => [g, g.sections.flatMap(([h, items]) => items.filter(it => settingMatches([g.title, h, it.t, plainText(it.s), it.kw], q)))]).filter(([, l]) => l.length);
  if (!hits.length) return `<div class="card mt-12">${emptyState('search', 'Nichts gefunden', `Keine Einstellung passt zu „${q.trim()}“.`)}</div>`;
  return hits.map(([g, l]) => `<div class="section-head"><h4>${esc(g.title)}</h4><button class="btn btn-ghost btn-sm" data-act="moreSub" data-v="${g.id}">Öffnen ${icon('chevR').replace('<svg', '<svg width="15" height="15"')}</button></div>
    <div class="list">${l.map(it => it.html).join('')}</div>`).join('');
}
function moreHomeHtml(groups) {
  const user = Auth.user();
  const by = Object.fromEntries(groups.map(g => [g.id, g]));
  const row = g => `<button class="list-item" data-act="moreSub" data-v="${g.id}"><span class="li-icon">${icon(g.ic)}</span><span class="li-main"><span class="li-title">${g.title}</span><div class="li-sub">${g.sub}</div></span>${icon('chevR', 'li-chev')}</button>`;
  const st = Store.syncState();
  return `
    <button class="card clickable acc-card more-acc mt-12" data-act="moreSub" data-v="account">
      <div class="avatar">${user ? (user.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer">` : esc((user.name || user.email || '?')[0].toUpperCase())) : icon('user')}</div>
      <div class="grow" style="min-width:0"><div class="bold ellipsis">${user ? esc(user.name || 'Angemeldet') : 'Lokaler Modus'}</div><div class="small dim ellipsis">${user ? esc(accountLine(user)) : 'Anmelden für Sync · Name, Geschlecht'}</div></div>
      ${user ? `<span class="sync-pill ${st}"><i></i>${SYNC_LABEL[st]}</span>` : ''}
      ${icon('chevR', 'li-chev')}
    </button>
    ${MORE_BLOCKS.map((ids, i) => {
      const rows = ids.filter(id => by[id]).map(id => row(by[id]));
      if (i === 0 && !F('f_exercises')) rows.unshift(navRow('openLibrary', 'book', 'Übungs-Bibliothek', 'Übungen ansehen, anlegen & bearbeiten'));
      return `<div class="list mt-16">${rows.join('')}</div>`;
    }).join('')}
    <p class="center tiny faint mt-24">${APP.name} v${APP.version} · ${Store.all('workouts').length} Workouts · ${Store.all('exercises').length} Übungen</p>`;
}
function morePageHtml(g) {
  return `<h2 class="more-title">${g.title}</h2>${g.intro ? `<p class="small dim">${g.intro}</p>` : ''}${g.head ? `<div class="mt-12">${g.head}</div>` : ''}` +
    g.sections.map(([h, items, pre]) => {
      const l = items.filter(it => it.only !== 'search');
      if (!l.length && !pre) return '';
      return `${h ? `<div class="section-head"><h4>${h}</h4></div>` : ''}${pre ? pre + (l.length ? '<div class="mt-12"></div>' : '') : ''}${l.length ? `<div class="list ${h ? '' : 'mt-16'}">${l.map(it => it.html).join('')}</div>` : ''}`;
    }).join('') + (g.foot || '');
}

Views.more = {
  render(el) {
    const groups = moreGroups();
    const g = moreSub && groups.find(x => x.id === moreSub);
    if (moreSub && !g) moreSub = null;
    if (g && g.id === 'look') Object.values(DESIGN_FONTS).forEach(ensureFont);   // Schriften für die Design-Kacheln
    const q = moreQ.trim();
    const html = g ? morePageHtml(g) : `
      <div class="search mt-8"><input class="input" id="moreQ" data-in="moreQ" type="search" placeholder="Einstellungen durchsuchen …" value="${esc(moreQ)}" autocomplete="off" enterkeyhint="search">${icon('search')}</div>
      <div id="moreRes">${q ? moreSearchHtml(q) : ''}</div>
      <div id="moreHome" class="${q ? 'hidden' : ''}">${moreHomeHtml(groups)}</div>`;
    // Gleicher Inhalt (z. B. Sync, zweiter Durchlauf nach dem Speichern): nichts austauschen – sonst blinken Bilder
    if (el._html !== html || !el.firstElementChild) {
      const keep = Object.fromEntries($$('.hscroll[data-row]', el).map(r => [r.dataset.row, r.scrollLeft]));
      el.innerHTML = html;
      el._html = html;
      // Wisch-Reihen (Design, App-Icon): Position halten, beim Öffnen die aktive Kachel in die Mitte
      $$('.hscroll[data-row]', el).forEach(r => {
        const a = $('.active', r);
        r.scrollLeft = r.dataset.row in keep ? keep[r.dataset.row] : a ? a.offsetLeft - (r.clientWidth - a.offsetWidth) / 2 : 0;
      });
    }
    Motion.topTitle(g ? g.title : '');
  },
  // Zurück-Knopf oben, solange eine Gruppe offen ist
  back: () => moreSub ? `<button class="btn btn-ghost btn-sm topbar-back" data-act="moreBack">${icon('chevL')} Mehr</button>` : '',
  // „Mehr" erneut antippen: zurück zur Übersicht bzw. Suche leeren
  reselect: () => { if (moreSub) { closeMoreSub(); return true; } moreQ = ''; return false; },
  // Zurück-Wischen (js/motion.js): Übersicht unter die Seiten-Kopie zeichnen, beim Abbrechen die Gruppe zurückholen
  edgeBack: () => {
    if (!moreSub) return null;
    const id = moreSub, y = Scroll.y;
    return {
      show: () => { moreSub = null; App.renderCurrent(); Scroll.to(moreScroll); },
      undo: () => { moreSub = id; App.renderCurrent(); Scroll.to(y); },
      done: () => { if (history.state && history.state.moreSub) history.back(); }   // popstate findet moreSub schon leer
    };
  },
  // anderer Tab: offene Gruppe schließen und Suche leeren – beim Zurückkommen startet Mehr bei der Übersicht
  leave: () => {
    moreQ = ''; moreScroll = 0;
    if (!moreSub) return;
    moreSub = null;
    if (history.state && history.state.moreSub) history.back();   // Verlaufs-Eintrag der Gruppe wieder entfernen
  }
};
/* Verlauf: Auf Android und im Browser bekommt jede offene Gruppe einen Verlaufs-Eintrag – die Zurück-Taste schließt sie.
   Auf dem iPhone nicht: iOS wischt in Web-Apps vom Rand selbst durch den Verlauf (zurück UND vorwärts, nicht
   abschaltbar) und zeigt dabei alte Bildschirmfotos. So holte nach dem Wechsel zu „Start" ein Wisch nach links die
   Einstellungen zurück, und auf Unterseiten liefen iOS- und Trainio-Geste gleichzeitig. Zurück geht dort per Knopf
   oder mit Trainios Wischen vom linken Rand (js/motion.js). */
const moreHistory = !isIOSDevice;
function openMoreSub(id) {
  if (!moreSub) moreScroll = Scroll.y;
  if (moreHistory) try { history.pushState({ moreSub: id }, ''); } catch (e) {}
  if (App.tab !== 'more') { moreSub = id; App.go('more'); Scroll.to(0); return; }   // Tab-Wechsel: ohne Übergang
  Motion.go('push', () => { moreSub = id; App.renderCurrent(); Scroll.to(0); });
}
function closeMoreSub() {
  if (!moreSub) return;
  if (history.state && history.state.moreSub) { history.back(); return; }   // popstate erledigt den Rest
  Motion.go('pop', () => { moreSub = null; App.renderCurrent(); Scroll.to(moreScroll); });
}
// Zurück-Geste/-Taste (Android, Browser) schließt die offene Gruppe
window.addEventListener('popstate', () => {
  if (!moreHistory || !moreSub) return;   // iPhone: kein eigener Verlauf (Schutz in js/boot.js)
  const next = (history.state && history.state.moreSub) || null;
  if (App.tab !== 'more') { moreSub = next; return; }
  Motion.go(next ? 'push' : 'pop', () => { moreSub = next; App.renderCurrent(); Scroll.to(next ? 0 : moreScroll); });
});
// Schalter & Felder ändern das DOM selbst – danach baut der nächste Render den Mehr-Tab wieder komplett auf
['input', 'change'].forEach(t => document.addEventListener(t, e => {
  const tm = $('#tab-more');
  if (tm && e.target.id !== 'moreQ' && tm.contains(e.target)) tm._html = null;
}, true));
Actions.moreSub = el => openMoreSub(el.dataset.v);
Actions.moreBack = () => closeMoreSub();
Inputs.moreQ = debounce(el => {
  moreQ = el.value;
  const q = moreQ.trim(), res = $('#moreRes'), home = $('#moreHome');
  if (res) res.innerHTML = q ? moreSearchHtml(q) : '';
  if (home) home.classList.toggle('hidden', !!q);
}, 150);
Actions.signIn = async el => {
  const ps = Auth.providers();
  const k = (el && el.dataset && el.dataset.p) || (ps.length > 1 ? await actionMenu('Anmelden', ps.map(p => ({ key: p, label: `Mit ${Auth.provider(p).label} anmelden`, icon: 'user' }))) : ps[0]);
  if (k) Auth.signIn(k);
};
Actions.signOut = () => Auth.signOut();
Actions.setSeg = el => {
  const k = el.dataset.k;
  let v = el.dataset.v;
  if (k === 'weightSteps') v = +v;
  Store.saveSettings({ [k]: v });
};
Changes.setSelect = el => {
  const k = el.dataset.k;
  const num = ['weeklyGoal', 'defaultRestSec', 'defSets', 'restWarnSec'].includes(k) || (['restWarmSec', 'restDropSec'].includes(k) && /^\d+$/.test(el.value));
  Store.saveSettings({ [k]: num ? +el.value : el.value });
  // andere 1RM-Formel → gespeicherte Rekorde (bestes e1RM) neu berechnen
  if (k === 'progPeriod') applyDefaultPeriod();
  if (k === 'e1rmFormula') PR.recalcAll().then(() => toast('1RM neu berechnet', 'success', { cat: 'always' }));
};
Changes.setToggle = async el => {
  const k = el.dataset.k;
  if (k === 'notifyRestDone' && el.checked && 'Notification' in window && Notification.permission !== 'granted') {
    const p = await Notification.requestPermission().catch(() => 'denied');
    if (p !== 'granted') toast('Benachrichtigungen wurden nicht erlaubt – Hinweis kommt nur in der App', 'warn');
  }
  Store.saveSettings({ [k]: el.checked });
  if (k === 'wakeLock') { if (el.checked && Workout.cur()) WakeLock.request(); else if (!el.checked) WakeLock.release(); }
};
// Standard-Wdh. für neue Übungen: Zahl oder Bereich („10", „8-12")
Changes.defReps = el => {
  const v = el.value.trim().replace(/\s+/g, '').replace(/[–—]/g, '-');
  if (!/^\d{1,3}(-\d{1,3})?$/.test(v)) { toast('Bitte eine Zahl oder einen Bereich wie 8-12 eintragen', 'warn'); el.value = defReps(); return; }
  Store.saveSettings({ defReps: v });
};
Inputs.setName = debounce(el => Store.saveSettings({ displayName: el.value.trim() }), 500);
Inputs.setBirth = debounce(el => { const y = parseInt(el.value, 10); Store.saveSettings({ birthYear: y > 1920 && y <= new Date().getFullYear() - 8 ? y : null }); }, 600);
Inputs.setHrMax = debounce(el => { const v = parseInt(el.value, 10); Store.saveSettings({ hrMax: v >= 120 && v <= 230 ? v : null }); }, 600);
Changes.setBar = el => { const v = parseNum(el.value); if (v != null && v >= 0) Store.saveSettings({ barKg: round(fromU(v), 3) }); };
// Läuft ein Workout: gleich mit dem aktuellen Satz öffnen
Actions.toolPlates = () => { const w = Workout.cur(); openPlates(null, w ? plateTarget(w) : null); };
Actions.tool1RM = () => open1RM();
Actions.install = async () => {
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => {});
    deferredInstall = null;
    App.renderCurrent();
    return;
  }
  Modal.open({
    title: 'App installieren', size: 'sm',
    body: `<ol class="small" style="padding-left:20px;line-height:1.8">
      <li>In Safari unten auf <b>Teilen</b> ${icon('share').replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} tippen</li>
      <li><b>„Zum Home-Bildschirm"</b> wählen</li>
      <li>Mit <b>Hinzufügen</b> bestätigen – fertig!</li></ol>
      <p class="dim small mt-8">Danach startet ${APP.name} im Vollbild wie eine native App.</p>`
  });
};
Actions.openErrLog = () => {
  const l = ErrLog.all().slice().reverse();
  const m = Modal.open({
    title: 'Fehlerprotokoll', size: 'lg',
    body: `<p class="small dim">Hier landen Fehler, die in der App aufgetreten sind (höchstens 30). Tippe auf „Kopieren" und schick den Text an den Entwickler – er enthält Version, Gerät und Fehlermeldung, aber keine Trainingsdaten.</p>
      ${l.length ? `<div class="list mt-12">${l.map(e => `<div class="list-item" style="display:block;cursor:default">
        <div class="small"><b>${esc(e.msg)}</b></div>
        <div class="tiny dim mt-4">${esc(new Date(e.t).toLocaleString('de-DE'))} · v${esc(e.v)} · ${esc(e.where || '–')}${e.tab ? ' · Tab ' + esc(e.tab) : ''}</div>
        ${e.stack ? `<pre class="tiny faint mt-4" style="white-space:pre-wrap;word-break:break-word;margin:0">${esc(e.stack)}</pre>` : ''}</div>`).join('')}</div>` : `<div class="card mt-12">${emptyState('checkCircle', 'Keine Fehler', 'Bisher ist nichts schiefgelaufen.')}</div>`}`,
    foot: `${l.length ? `<button class="btn btn-danger-ghost" data-x="clear" style="flex:0 0 auto">${icon('trash')} Leeren</button>` : ''}<button class="btn btn-secondary" data-x="c">Schließen</button><button class="btn btn-primary" data-x="copy">${icon('copy')} Kopieren</button>`
  });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'copy') {
      const txt = ErrLog.report();
      try { await navigator.clipboard.writeText(txt); toast('Fehlerbericht kopiert', 'success', { cat: 'always' }); }
      catch (err) { Modal.open({ title: 'Fehlerbericht', body: `<textarea class="textarea code" readonly style="min-height:320px">${esc(txt)}</textarea><p class="tiny dim mt-8">Text markieren und kopieren.</p>` }); }
      return;
    }
    if (b.dataset.x === 'clear') { ErrLog.clear(); toast('Fehlerprotokoll geleert', 'success'); App.renderCurrent(); }
    m.close();
  });
};
Actions.checkUpdate = async () => {
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (!reg) return toast('Kein Service Worker aktiv', 'info', { cat: 'always' });
    await reg.update();
    if (reg.waiting || reg.installing) toast('Update wird geladen …', 'info', { cat: 'always' });
    else toast('Du hast die neueste Version', 'success', { cat: 'always' });
  } catch (e) { toast('Update-Prüfung fehlgeschlagen', 'error'); }
};

/* ---------- Export: CSV ---------- */
Actions.exportCSV = () => {
  const W = Store.all('workouts').filter(w => isISO(w.date)).sort((a, b) => a.date.localeCompare(b.date) || (a.startedAt || 0) - (b.startedAt || 0));
  if (!W.length) return toast('Noch keine Workouts zum Exportieren', 'info', { cat: 'always' });
  const q = v => { const s = v == null ? '' : String(v); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const dec = v => v == null || v === '' ? '' : String(round(+v, 3)).replace('.', ',');
  const head = ['date', 'workoutName', 'exerciseName', 'setNumber', 'reps', 'weightKg', 'rpe', 'done', 'notes', 'warmup', 'durationSec', 'repsRight', 'durationSecRight', 'distanceKm', 'level'];
  const lines = [head];
  for (const w of W) for (const en of w.entries || []) (en.sets || []).forEach((s, i) => {
    lines.push([w.date, w.planDayName || w.name || '', Ex.entryName(en), i + 1, s.reps ?? '', dec(s.weightKg), dec(s.rpe), s.done === false ? 'false' : 'true', w.notes || '', s.warmup ? 'true' : 'false', s.durationSec ?? '', s.repsR ?? '', s.durationSecR ?? '', dec(s.distKm), dec(s.level)]);
  });
  download(`trainio-workouts-${isoDate()}.csv`, '﻿' + lines.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`${lines.length - 1} Sätze exportiert`, 'success');
};

/* ---------- Export: PDF (jsPDF) ---------- */
const slug = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pdfSafe = s => String(s ?? '').replace(/[–—]/g, '-').replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/…/g, '...').replace(/•/g, '-').replace(/≈/g, '~').replace(/[^\x00-\xFF]/g, '');
Actions.exportPDF = () => {
  const exIds = Object.keys(Analytics.cur().sessions).filter(id => Ex.get(id)).sort((a, b) => Ex.name(a).localeCompare(Ex.name(b), 'de'));
  const m = Modal.open({
    title: 'Export PDF', size: 'sm',
    body: `<div class="stack">
      <div class="field"><span>Art</span><div class="seg" id="pdfType"><button class="active" data-t="log">Trainingsprotokoll</button><button data-t="ex">Übungs-Report</button></div></div>
      <label class="field"><span>Zeitraum</span><select class="select" id="pdfRange">${[['all', 'Alles'], ['28', 'Letzte 4 Wochen'], ['91', 'Letzte 3 Monate'], ['182', 'Letzte 6 Monate'], ['365', 'Letztes Jahr']].map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      <label class="field hidden" id="pdfExWrap"><span>Übung</span><select class="select" id="pdfEx">${exIds.map(id => `<option value="${esc(id)}" ${id === UI.kraftEx ? 'selected' : ''}>${esc(Ex.name(id))}</option>`).join('')}</select></label>
    </div>`,
    foot: `<button class="btn btn-secondary" data-x="c">Abbrechen</button><button class="btn btn-primary" data-x="go">${icon('download')} PDF erstellen</button>`
  });
  let type = 'log';
  m.el.addEventListener('click', async e => {
    const tb = e.target.closest('[data-t]');
    if (tb) { type = tb.dataset.t; $$('#pdfType button', m.el).forEach(b => b.classList.toggle('active', b === tb)); $('#pdfExWrap', m.el).classList.toggle('hidden', type !== 'ex'); return; }
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'c') return m.close();
    const rv = $('#pdfRange', m.el).value;
    const from = rv === 'all' ? -Infinity : todayDN() - +rv + 1;
    b.disabled = true;
    b.textContent = 'Erstelle …';
    try {
      await loadScript(CDN.jspdf);
      if (type === 'log') await pdfWorkoutLog(from);
      else await pdfExerciseReport($('#pdfEx', m.el).value, from);
      m.close();
    } catch (err) {
      console.error(err);
      toast('PDF fehlgeschlagen: ' + (err.message || 'jsPDF nicht geladen (offline?)'), 'error');
      b.disabled = false; b.textContent = 'PDF erstellen';
    }
  });
};
function pdfDoc() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const st = { doc, y: 20, page: 1 };
  st.text = (s, x, y, o) => doc.text(pdfSafe(s), x, y, o);
  st.need = h => { if (st.y + h > 282) { footer(st); doc.addPage(); st.page++; st.y = 20; } };
  return st;
}
function footer(st) {
  const d = st.doc;
  d.setFontSize(8); d.setTextColor(140);
  d.text(pdfSafe(`${APP.name} · erstellt am ${fmtDate(isoDate(), { day: '2-digit', month: '2-digit', year: 'numeric' })}`), 15, 292);
  d.text(String(st.page), 195, 292, { align: 'right' });
  d.setTextColor(20);
}
function pdfCover(st, title, sub, stats) {
  const d = st.doc;
  const user = Auth.user();
  d.setFillColor(11, 13, 16); d.rect(0, 0, 210, 297, 'F');
  d.setFillColor(57, 255, 136); d.rect(15, 60, 18, 3, 'F');
  d.setTextColor(241, 243, 245); d.setFont('helvetica', 'bold'); d.setFontSize(32);
  st.text(APP.name, 15, 52);
  d.setFontSize(20); st.text(title, 15, 80);
  d.setFont('helvetica', 'normal'); d.setFontSize(12); d.setTextColor(154, 163, 175);
  st.text(sub, 15, 90);
  st.text((S().displayName || (user && user.name) || '') + (user && user.email ? ` · ${user.email}` : ''), 15, 98);
  let y = 125;
  for (const [k, v] of stats) {
    d.setTextColor(154, 163, 175); d.setFontSize(10); st.text(k, 15, y);
    d.setTextColor(241, 243, 245); d.setFontSize(18); d.setFont('helvetica', 'bold'); st.text(v, 15, y + 8);
    d.setFont('helvetica', 'normal');
    y += 20;
  }
  d.setTextColor(20);
  d.addPage(); st.page++; st.y = 20;
}
async function pdfWorkoutLog(from) {
  const W = Store.all('workouts').filter(w => isISO(w.date) && dayNum(w.date) >= from).sort((a, b) => a.date.localeCompare(b.date) || (a.startedAt || 0) - (b.startedAt || 0));
  if (!W.length) throw new Error('Keine Workouts im Zeitraum');
  const ix = Analytics.cur();
  const rows = ix.rows.filter(r => r.dn >= from);
  const st = pdfDoc();
  const d = st.doc;
  pdfCover(st, 'Trainingsprotokoll', `${fmtDate(W[0].date)} - ${fmtDate(W[W.length - 1].date)}`, [
    ['Workouts', String(W.length)], ['Tonnage', fmtTon(sum(rows.map(r => r.ton)))], ['Sätze', nf(sum(rows.map(r => r.sets)), 0)],
    ['PRs', String(ix.prEvents.filter(p => p.dn >= from).length)], ['Trainingszeit', fmtDur(sum(rows.map(r => r.dur)))]
  ]);
  for (const w of W) {
    const row = rows.find(r => r.id === w.id);
    st.need(24);
    d.setFillColor(238, 241, 245); d.roundedRect(15, st.y - 5, 180, 9, 2, 2, 'F');
    d.setFont('helvetica', 'bold'); d.setFontSize(11);
    st.text(`${fmtDate(w.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}  ·  ${w.planDayName || w.name || 'Workout'}`, 18, st.y + 1);
    d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(90);
    st.text(`${fmtDur(w.durationSec)} · ${row && row.cardioOnly ? 'Cardio' : `${fmtTon(row ? row.ton : 0)} · ${row ? row.sets : 0} Sätze`}${row && row.cSec && !row.cardioOnly ? ' · Cardio ' + fmtDur(row.cSec) : ''}`, 192, st.y + 1, { align: 'right' });
    d.setTextColor(20);
    st.y += 10;
    if (w.notes) { d.setFontSize(9); d.setTextColor(90); const ls = d.splitTextToSize(pdfSafe(w.notes), 175); st.need(ls.length * 4); d.text(ls, 18, st.y); st.y += ls.length * 4 + 1; d.setTextColor(20); }
    for (const en of w.entries || []) {
      const sets = (en.sets || []).filter(s => s.done !== false);
      if (!sets.length) continue;
      const isSec = Ex.type(Ex.get(en.exerciseId)) === 'sec';
      const txt = Ex.type(Ex.get(en.exerciseId)) === 'cardio' ? cardioTxt(cardioTotals(sets), cardioInfo(Ex.get(en.exerciseId))) : sets.map(s => (s.warmup ? 'W ' : '') + (isSec ? secTxt(s) : (s.weightKg ? `${wNum(s.weightKg)}×${repsTxt(s)}` : repsTxt(s))) + (s.rpe ? ` @${nf(s.rpe, 1)}` : '')).join('   ');
      d.setFontSize(9.5);
      const lines = d.splitTextToSize(pdfSafe(txt), 120);
      st.need(lines.length * 4.5 + 2);
      d.setFont('helvetica', 'bold'); st.text(Ex.entryName(en), 18, st.y);
      d.setFont('helvetica', 'normal'); d.text(lines, 75, st.y);
      st.y += lines.length * 4.5 + 1.5;
    }
    st.y += 5;
  }
  footer(st);
  d.save(`trainio-protokoll-${isoDate()}.pdf`);
  toast('PDF erstellt', 'success');
}
async function pdfExerciseReport(exId, from) {
  const ss = Analytics.sessionsOf(exId).filter(s => s.dn >= from);
  if (!ss.length) throw new Error('Keine Daten für diese Übung im Zeitraum');
  const pr = Store.raw('prs', exId);
  const st = pdfDoc();
  const d = st.doc;
  d.setFont('helvetica', 'bold'); d.setFontSize(22);
  st.text(Ex.name(exId), 15, 22);
  d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(90);
  st.text(`Übungs-Report · ${fmtDate(ss[0].date)} - ${fmtDate(ss[ss.length - 1].date)} · ${ss.length} Sessions`, 15, 29);
  d.setTextColor(20);
  const boxes = [['Bestes e1RM', pr ? fmtW(pr.best1RM) : '-'], ['Max-Gewicht', pr ? `${fmtW(pr.bestWeightKg)} × ${pr.bestReps}` : '-'], ['Bestes Volumen', pr ? fmtTon(pr.bestVolume) : '-'], ['Sessions', String(ss.length)]];
  boxes.forEach(([k, v], i) => {
    const x = 15 + i * 45.5;
    d.setFillColor(238, 241, 245); d.roundedRect(x, 35, 43, 18, 2, 2, 'F');
    d.setFontSize(8); d.setTextColor(90); st.text(k, x + 3, 41);
    d.setFontSize(12); d.setTextColor(20); d.setFont('helvetica', 'bold'); st.text(v, x + 3, 49); d.setFont('helvetica', 'normal');
  });
  // Chart offscreen rendern und als Bild einbetten
  if (await Charts.ensure()) {
    const cv = document.createElement('canvas');
    cv.width = 1000; cv.height = 460;
    const pts = ss.filter(s => s.best > 0).map(s => ({ x: s.dn, y: round(toU(s.best), 1) }));
    const vol = ss.map(s => ({ x: s.dn, y: round(toU(s.maxW), 1) }));
    const ch = new window.Chart(cv.getContext('2d'), {
      type: 'line',
      data: { datasets: [
        { label: 'e1RM', data: pts, borderColor: '#0b8f48', backgroundColor: 'rgba(11,143,72,.12)', fill: true, tension: .3, pointRadius: pts.length < 40 ? 3 : 0, borderWidth: 3 },
        { label: 'Max-Gewicht', data: vol, borderColor: '#2a78d6', fill: false, tension: .3, pointRadius: 0, borderWidth: 2 }] },
      plugins: [{ id: 'bg', beforeDraw: c => { const x = c.ctx; x.save(); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.restore(); } }],
      options: { responsive: false, animation: false, devicePixelRatio: 1, plugins: { legend: { labels: { color: '#333', font: { size: 16 } } }, tooltip: { enabled: false } },
        scales: { x: { type: 'linear', ticks: { color: '#555', font: { size: 14 }, callback: v => fmtDN(v, { day: '2-digit', month: '2-digit', year: '2-digit' }), maxTicksLimit: 8 }, grid: { display: false } },
          y: { ticks: { color: '#555', font: { size: 14 }, callback: v => nf(v, 0) + ' ' + unit() }, grid: { color: '#e5e5e5' } } } }
    });
    d.addImage(cv.toDataURL('image/jpeg', 0.88), 'JPEG', 15, 60, 180, 83);
    ch.destroy();
    st.y = 152;
  } else st.y = 62;
  d.setFont('helvetica', 'bold'); d.setFontSize(9);
  const cols = [[15, 'Datum'], [42, 'Sätze'], [140, 'Bester Satz'], [165, 'e1RM'], [195, 'Volumen']];
  cols.forEach(([x, l], i) => st.text(l, x, st.y, i >= 2 ? { align: i === 4 ? 'right' : 'left' } : undefined));
  d.setFont('helvetica', 'normal');
  st.y += 5;
  for (const s of [...ss].reverse()) {
    const lines = d.splitTextToSize(pdfSafe(s.list.map(x => x.w ? `${wNum(x.w)}×${prevR(x)}` : `${prevR(x)}`).join('  ')), 94);
    st.need(lines.length * 4.2 + 1.5);
    st.text(fmtDate(s.date), 15, st.y);
    d.text(lines, 42, st.y);
    st.text(s.bestSet ? `${wNum(s.bestSet.w)}×${s.bestSet.r}` : '-', 140, st.y);
    st.text(s.best ? wNum(s.best) : '-', 165, st.y);
    st.text(fmtTon(s.vol), 195, st.y, { align: 'right' });
    st.y += lines.length * 4.2 + 1.5;
  }
  footer(st);
  d.save(`trainio-${slug(Ex.name(exId))}-${isoDate()}.pdf`);
  toast('PDF erstellt', 'success');
}

/* ---------- Backup / Restore / Löschen ---------- */
Actions.backupJSON = () => {
  const data = {};
  for (const c of COLLS) data[c] = Store.all(c);
  download(`trainio-backup-${isoDate()}.json`, JSON.stringify({ app: 'Trainio', version: 1, exportedAt: new Date().toISOString(), data }), 'application/json');
  toast(`Backup erstellt (${data.workouts.length} Workouts)`, 'success');
};
Actions.restoreJSON = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    let json;
    try { json = JSON.parse(await readFileText(f)); } catch (e) { return toast('Datei ist kein gültiges JSON', 'error'); }
    if (!json || !['GymLog','Trainio'].includes(json.app) || !json.data || typeof json.data !== 'object') return toast('Das ist kein Trainio-Backup', 'error');
    const counts = COLLS.map(c => [c, Array.isArray(json.data[c]) ? json.data[c].length : 0]).filter(x => x[1]);
    const mode = await actionMenu('Backup wiederherstellen', [
      { key: 'merge', label: 'Zusammenführen', sub: 'Backup-Daten ergänzen/überschreiben gleiche IDs', icon: 'layers' },
      { key: 'replace', label: 'Komplett ersetzen', sub: 'Aktuelle Daten werden vorher gelöscht', icon: 'refresh', danger: true }
    ]);
    if (!mode) return;
    if (!await confirmDialog({ title: 'Wirklich wiederherstellen?', text: `Backup vom ${json.exportedAt ? new Date(json.exportedAt).toLocaleString('de-DE') : '?'}: ${counts.map(([c, n]) => `${n} ${c}`).join(', ')}.`, okLabel: 'Wiederherstellen', danger: mode === 'replace' })) return;
    const ops = [];
    if (mode === 'replace') for (const c of COLLS) for (const d of Store.all(c)) ops.push({ type: 'del', coll: c, id: d.id });
    for (const c of COLLS) for (const d of (json.data[c] || [])) if (d && d.id) { const { id, ...rest } = d; ops.push({ type: 'put', coll: c, id: String(id), doc: rest, replace: true }); }
    toast('Stelle wieder her …', 'info', { cat: 'always' });
    await Store.batch(ops);
    await PR.recalcAll();
    applyTheme();
    toast('Backup wiederhergestellt', 'success');
  };
  inp.click();
};
Actions.deleteAll = async () => {
  if (!await confirmDialog({ title: 'Alle Daten löschen?', text: 'Alle Workouts, Pläne, Übungen, Körperdaten, Fotos und PRs werden gelöscht – auf allen Geräten. Mach vorher besser ein Backup.', okLabel: 'Weiter', danger: true })) return;
  if (!await confirmDialog({ title: 'Letzte Warnung', text: 'Das kann nicht rückgängig gemacht werden.', okLabel: 'Endgültig löschen', danger: true, requireText: 'LÖSCHEN' })) return;
  const ops = [];
  for (const c of COLLS) for (const d of Store.all(c)) ops.push({ type: 'del', coll: c, id: d.id });
  Workout.discard();
  await Store.batch(ops);
  const seeds = [...seedExerciseDocs().map(e => ({ type: 'put', coll: 'exercises', id: e.id, doc: e }))];
  Store.saveSettings({ activePlanId: '', seedVersion: SEED_VERSION });
  await Store.batch(seeds);
  try { localStorage.removeItem(LS.ui); } catch (e) {}
  applyTheme();
  App.go('start');
  toast('Alle Daten gelöscht – Übungs-Bibliothek neu angelegt', 'success');
};
Actions.undoImport = async () => {
  const imp = Store.all('imports').filter(i => !i.undoneAt).sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0))[0];
  if (!imp) return;
  const ids = imp.docIds || {};
  const wIds = (ids.workouts || []).filter(id => Store.raw('workouts', id));
  const pIds = (ids.progress || []).filter(id => Store.raw('progress', id));
  const wSet = new Set(wIds);
  const usedElsewhere = new Set(Store.all('workouts').filter(w => !wSet.has(w.id)).flatMap(w => (w.entries || []).map(e => e.exerciseId)));
  const usedInPlans = new Set(Store.all('templates').flatMap(t => (t.exercises || []).map(x => x.exerciseId)));
  const eIds = (ids.exercises || []).filter(id => Store.raw('exercises', id) && !usedElsewhere.has(id) && !usedInPlans.has(id));
  if (!await confirmDialog({ title: 'Import rückgängig machen?', text: imp.source === 'weight-csv' ? `Entfernt ${pIds.length} importierte Gewichtswerte${(imp.overwritten || []).length ? ` und stellt ${imp.overwritten.length} überschriebene wieder her` : ''} (Import vom ${new Date(imp.importedAt).toLocaleString('de-DE')}).` : `Entfernt ${wIds.length} Workouts, ${eIds.length} neu angelegte Übungen und ${pIds.length} Körper-Einträge aus dem Import vom ${new Date(imp.importedAt).toLocaleString('de-DE')}.`, okLabel: 'Rückgängig machen', danger: true })) return;
  const ops = [
    ...wIds.map(id => ({ type: 'del', coll: 'workouts', id })),
    ...pIds.map(id => ({ type: 'del', coll: 'progress', id })),
    ...eIds.map(id => ({ type: 'del', coll: 'exercises', id })),
    ...(imp.overwritten || []).filter(o => Store.raw('progress', o.id)).map(o => ({ type: 'put', coll: 'progress', id: o.id, doc: { bodyWeightKg: o.bodyWeightKg, updatedAt: Date.now() } })),
    { type: 'put', coll: 'imports', id: imp.id, doc: { undoneAt: Date.now() } }
  ];
  await Store.batch(ops);
  await PR.recalcAll();
  toast('Import rückgängig gemacht', 'success');
};


