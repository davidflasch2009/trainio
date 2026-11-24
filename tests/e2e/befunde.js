'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

async function befundeFlow(page) {
  console.log('Befunde aus dem Prüfbericht');
  const base = new URL(page.url()).origin;
  // T01: zwei Tabs speichern unabhängig voneinander – nichts geht verloren
  const b = await page.context().newPage();
  b.errors = [];
  b.on('pageerror', e => b.errors.push(e.message));
  await b.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await b.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab).innerHTML.length > 0);
  await b.waitForTimeout(500);
  const doc = n => ({ name: n, category: 'Push', muscleGroups: ['Brust'], equipment: 'Kurzhantel', defaultUnit: 'kg', isCustom: true, aliases: [], createdAt: Date.now() });
  await page.evaluate(d => Store.put('exercises', 'qa_tab_a', d), doc('QA aus Tab A'));
  await pause(page, 500);
  await b.evaluate(d => Store.put('exercises', 'qa_tab_b', d), doc('QA aus Tab B'));
  await pause(b, 600);
  await page.evaluate(() => Store.del('exercises', 'ex_seitheben'));
  await pause(page, 600);
  const c = await page.context().newPage();
  await c.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await c.waitForFunction(() => typeof Store !== 'undefined' && Store.all('exercises').length > 300);
  const tabs = await c.evaluate(() => ({ a: !!Store.raw('exercises', 'qa_tab_a'), b: !!Store.raw('exercises', 'qa_tab_b'), del: !Store.raw('exercises', 'ex_seitheben') }));
  const live = await b.evaluate(() => ({ a: !!Store.raw('exercises', 'qa_tab_a'), del: !Store.raw('exercises', 'ex_seitheben') }));
  check(tabs.a && tabs.b && tabs.del && live.a && live.del && !b.errors.length, 'T01: zwei offene Tabs überschreiben sich nicht, der andere Tab sieht Änderungen sofort', JSON.stringify({ tabs, live, err: b.errors }));
  await c.close(); await b.close();

  // T03: alternative Namen bleiben eine Liste – Editor und Arrow-Zuordnung funktionieren weiter
  await page.evaluate(() => { Store.put('exercises', 'qa_alias', { name: 'QA Alias', category: 'Pull', muscleGroups: ['Rücken'], equipment: 'Kabel', defaultUnit: 'kg', isCustom: true, aliases: [], createdAt: Date.now() }); });
  await pause(page);
  await page.evaluate(() => { openExerciseForm(Store.raw('exercises', 'qa_alias')); });
  await pause(page, 400);
  await page.fill('.modal-wrap:not(.closing) input[data-f="aliases"]', 'Diagonal, Rotation');
  await page.locator('.modal-wrap:not(.closing) input[data-f="aliases"]').dispatchEvent('change');
  await page.click('.modal-wrap:not(.closing) [data-x="save"]');
  await pause(page, 500);
  const al = await page.evaluate(() => Store.raw('exercises', 'qa_alias').aliases);
  await page.evaluate(() => { openExerciseForm(Store.raw('exercises', 'qa_alias')); });
  await pause(page, 400);
  const form = await page.evaluate(() => ({ fields: Modal.top().el.querySelectorAll('[data-f]').length, val: (Modal.top().el.querySelector('input[data-f="aliases"]') || {}).value }));
  await page.evaluate(() => Modal.closeAll()); await pause(page);
  // ältere Stände mit Komma-Text: Suche, Import-Zuordnung und Reparatur beim Start
  const old = await page.evaluate(async () => {
    Store.put('exercises', 'qa_alias_alt', { name: 'QA Alt', category: 'Pull', muscleGroups: ['Rücken'], equipment: 'Kabel', defaultUnit: 'kg', isCustom: true, aliases: 'Old Row, Kabelzug alt', createdAt: Date.now() });
    const found = Ex.findByName('kabelzug alt'), fuzzy = Ex.findByName('Row Old');
    Store.saveSettings({ seedVersion: 6 }); ensureSeeds();
    await new Promise(r => setTimeout(r, 300));
    return { found: found && found.id, fuzzy: fuzzy && fuzzy.id, repaired: Store.raw('exercises', 'qa_alias_alt').aliases };
  });
  check(Array.isArray(al) && al.join('|') === 'Diagonal|Rotation' && form.fields >= 3 && form.val === 'Diagonal, Rotation', 'T03: Übung mit alternativen Namen lässt sich speichern und wieder bearbeiten', JSON.stringify({ al, form }));
  check(old.found === 'qa_alias_alt' && old.fuzzy === 'qa_alias_alt' && Array.isArray(old.repaired) && old.repaired.length === 2, 'T03: als Text gespeicherte Namen stören Import-Zuordnung nicht und werden repariert', JSON.stringify(old));

  // T05: umbenanntes Plan-Workout erscheint im Verlauf unter dem neuen Namen
  const ren = await page.evaluate(async () => {
    const st = Date.now() - 3600e3;
    await Store.put('workouts', 'qa_rename', { date: isoDate(), startedAt: st, endedAt: st + 1800e3, durationSec: 1800, planId: 'plan_test', planDayName: 'Beine', name: 'QA Freitag',
      entries: [{ exerciseId: 'ex_bankdruecken', sets: [{ reps: 5, weightKg: 50, done: true }] }] });
    await new Promise(r => setTimeout(r, 200));
    const row = Analytics.cur().rows.find(r => r.id === 'qa_rename');
    UI.trainSub = 'history'; App.go('training', { instant: true });
    await new Promise(r => setTimeout(r, 300));
    return { name: row && row.name, day: row && row.day, list: document.querySelector('#tab-training').innerText.includes('QA Freitag') };
  });
  check(ren.name === 'QA Freitag' && ren.day === 'Beine' && ren.list, 'T05: Verlauf zeigt den neuen Namen des Plan-Workouts', JSON.stringify(ren));

  // T06: Übungs-Report für Cardio zeigt Dauer, Distanz und Tempo statt Kraftwerten
  const pdf = await page.evaluate(async () => {
    const st = Date.now() - 7200e3;
    await Store.put('workouts', 'qa_bike', { date: isoDate(), startedAt: st, endedAt: st + 2262e3, durationSec: 2262, name: 'Rad',
      entries: [{ exerciseId: 'ex_fahrrad', sets: [{ durationSec: 2262, distKm: 17.85, done: true }] }] });
    await new Promise(r => setTimeout(r, 200));
    const ss = Analytics.sessionsOf('ex_fahrrad');
    const R = pdfReportSpec(Ex.type(Ex.get('ex_fahrrad')), ss, Store.raw('prs', 'ex_fahrrad'), cardioInfo(Ex.get('ex_fahrrad')));
    const kg = pdfReportSpec('kg', Analytics.sessionsOf('ex_bankdruecken'), null, {});
    const txt = JSON.stringify([R.boxes, R.cols, ss.map(R.row)]);
    return { txt, kgTxt: JSON.stringify([kg.boxes, Analytics.sessionsOf('ex_bankdruecken').map(kg.row)]) };
  });
  check(/37:42/.test(pdf.txt) && /17,85 km/.test(pdf.txt) && /28,4 km\/h/.test(pdf.txt) && !/undefined|NaN| kg/.test(pdf.txt), 'T06: Übungs-PDF für Cardio mit Dauer, Distanz und Tempo', pdf.txt.slice(0, 300));
  check(!/undefined|NaN/.test(pdf.kgTxt), 'T06: Übungs-PDF ohne PR-Eintrag zeigt keine „undefined"-Werte', pdf.kgTxt.slice(0, 200));

  // T07: Escape schließt nur die Auswahlliste, der Entwurf bleibt offen
  await page.evaluate(() => { App.go('exercises', { instant: true }); Actions.exNew(); });
  await pause(page, 400);
  const top = '.modal-wrap:not(.closing) .modal';
  await page.fill(top + ' input[data-f="name"]', 'QA Entwurf');
  await page.focus(top + ' .dd-btn');
  await page.keyboard.press('ArrowDown');
  await pause(page, 200);
  const ddOpen = await page.evaluate(() => !!document.querySelector('.dd-menu'));
  await page.keyboard.press('Escape');
  await pause(page, 200);
  const esc1 = await page.evaluate(() => ({ dd: !!document.querySelector('.dd-menu'), modal: Modal.count(), name: (Modal.top() && Modal.top().el.querySelector('input[data-f="name"]') || {}).value }));
  await page.keyboard.press('Escape');
  await pause(page, 400);
  const esc2 = await page.evaluate(() => Modal.count());
  check(ddOpen && !esc1.dd && esc1.modal === 1 && esc1.name === 'QA Entwurf' && esc2 === 0, 'T07: Escape schließt zuerst nur die Auswahlliste, der Entwurf bleibt erhalten', JSON.stringify({ ddOpen, esc1, esc2 }));

  // T08: Tastaturfokus bleibt im offenen Dialog
  await page.evaluate(() => { App.go('start', { instant: true }); });
  await pause(page, 300);
  await page.focus('[data-act="startSheet"]');
  await page.keyboard.press('Enter');
  await pause(page, 500);
  const trap = [];
  trap.push(await page.evaluate(() => !!Modal.top() && Modal.top().el.contains(document.activeElement)));
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate(() => Modal.top().el.contains(document.activeElement) && document.activeElement !== Modal.top().el)); }
  await page.keyboard.press('Shift+Tab');
  trap.push(await page.evaluate(() => Modal.top().el.contains(document.activeElement)));
  const inert = await page.evaluate(() => document.querySelector('#app').inert && document.querySelector('#bottomNav').inert);
  await page.keyboard.press('Escape');
  await pause(page, 400);
  const back = await page.evaluate(() => ({ inert: document.querySelector('#app').inert, focus: document.activeElement && document.activeElement.dataset.act }));
  check(trap.every(Boolean) && inert && !back.inert && back.focus === 'startSheet', 'T08: Fokus startet im Dialog, Tab bleibt darin, danach zurück zum Auslöser', JSON.stringify({ trap, inert, back }));

  // T12: Reiter mit vollständiger Tab-Struktur und Pfeiltasten
  await page.evaluate(() => { UI.trainSub = 'plans'; App.go('training', { instant: true }); });
  await pause(page, 300);
  const roles = await page.evaluate(() => {
    const out = [];
    for (const tl of document.querySelectorAll('.tab.active [role="tablist"]')) {
      const kids = [...tl.children];
      out.push(kids.length > 1 && kids.every(k => k.getAttribute('role') === 'tab' && ['true', 'false'].includes(k.getAttribute('aria-selected')) && document.getElementById(k.getAttribute('aria-controls'))));
    }
    return out;
  });
  await page.focus('.tab.active [role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await pause(page, 300);
  const arrow = await page.evaluate(() => ({ sub: UI.trainSub, focus: document.activeElement && document.activeElement.dataset.v, panel: document.querySelector('#trainBody').getAttribute('role') }));
  check(roles.length === 1 && roles.every(Boolean) && arrow.sub === 'history' && arrow.focus === 'history' && arrow.panel === 'tabpanel', 'T12: Pläne/Verlauf als vollständige Reiter, Pfeiltaste wechselt', JSON.stringify({ roles, arrow }));
  await page.evaluate(() => { UI.progSub = 'overview'; App.go('progress', { instant: true }); });
  await pause(page, 400);
  const pr = await page.evaluate(() => [...document.querySelectorAll('.prog-controls [role="tab"]')].every(k => k.hasAttribute('aria-selected') && k.getAttribute('aria-controls') === 'progBody'));
  check(pr, 'T12: Fortschritt-Bereiche ebenfalls mit vollständiger Tab-Struktur');

  // T10: Gewichtsschnelleingabe – gleiche Grenzen in kg und lb
  const bw = async (u, v) => page.evaluate(async ([u, v]) => {
    Store.saveSettings({ unit: u });
    UI.progSub = 'body'; App.go('progress', { instant: true });
    await new Promise(r => setTimeout(r, 250));
    const n0 = Store.all('progress').filter(p => p.date === isoDate()).map(p => p.bodyWeightKg).join();
    const inp = document.querySelector('#bwQuick');
    if (!inp) return 'kein Feld';
    inp.value = v; Actions.bwQuickSave();
    await new Promise(r => setTimeout(r, 150));
    const e = Store.all('progress').find(p => p.date === isoDate() && p.bodyWeightKg > 0);
    return e && Store.all('progress').filter(p => p.date === isoDate()).map(p => p.bodyWeightKg).join() !== n0 ? e.bodyWeightKg : null;
  }, [u, v]);
  const lbHi = await bw('lb', '441'), lbLo = await bw('lb', '30'), kgLo = await bw('kg', '13,61'), kgHi = await bw('kg', '200');
  check(lbHi === 200.03 && lbLo === null && kgLo === null && kgHi === 200, 'T10: 200 kg und 441 lb gelten gleich, 30 lb und 13,61 kg beide zu wenig', JSON.stringify({ lbHi, lbLo, kgLo, kgHi }));

  // T14 + T18: Körperformular weist negativen Umfang und Datum in der Zukunft zurück
  const body = async (date, w, chest) => page.evaluate(async ([date, w, chest]) => {
    Store.saveSettings({ f_measures: true });
    const n0 = Store.all('progress').length;
    Actions.bodyNew();
    await new Promise(r => setTimeout(r, 300));
    const m = Modal.top().el;
    if (date) m.querySelector('#bfDate').value = date;
    m.querySelector('#bfW').value = w;
    m.querySelector('[data-mk="chestCm"]').value = chest;
    m.querySelector('[data-x="save"]').click();
    await new Promise(r => setTimeout(r, 250));
    const open = Modal.count();
    Modal.closeAll();
    await new Promise(r => setTimeout(r, 300));
    return { added: Store.all('progress').length - n0, open };
  }, [date, w, chest]);
  const neg = await body(null, '', '-4');
  const tomorrow = await page.evaluate(() => dnToISO(todayDN() + 1));
  const fut = await body(tomorrow, '76', '');
  const ok = await body(null, '76', '98');
  check(neg.added === 0 && neg.open === 1, 'T14: negativer Umfang legt keinen leeren Eintrag an', JSON.stringify(neg));
  check(fut.added === 0 && fut.open === 1 && ok.added === 1, 'T18: Messwert mit Datum in der Zukunft wird nicht gespeichert, heute schon', JSON.stringify({ fut, ok }));

  // T15: 1RM-Rechner nennt die gewählte Formel
  const rm = [];
  for (const f of ['epley', 'brzycki', 'avg']) {
    rm.push(await page.evaluate(async f => { Store.saveSettings({ e1rmFormula: f }); open1RM(); await new Promise(r => setTimeout(r, 250)); const el = Modal.top().el; const t = el.innerText + ' ' + [...el.querySelectorAll('[data-info]')].map(b => b.dataset.info).join(' ') + (/\(Epley\)/.test(el.innerText) ? ' SICHTBAR' : ''); Modal.closeAll(); await new Promise(r => setTimeout(r, 300)); return t; }, f));
  }
  check(/Epley/.test(rm[0]) && /93,3/.test(rm[0]) && /Brzycki/.test(rm[1]) && !/Epley\)/.test(rm[1]) && /\n90 kg/.test(rm[1]) && /Mittelwert/.test(rm[2]) && /91,7/.test(rm[2]) && !rm.some(x => /SICHTBAR/.test(x)), 'T15: 1RM-Rechner nennt Epley, Brzycki und Mittelwert richtig (im ⓘ)');
  await page.evaluate(() => Store.saveSettings({ e1rmFormula: 'epley' }));

  // T16: Fotovergleich mit vertauschter Reihenfolge zeigt positiven Abstand
  const cmp = await page.evaluate(async () => {
    const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    Store.put('photos', 'qa_ph1', { date: '2026-10-01', data: px }); Store.put('photos', 'qa_ph2', { date: '2026-11-01', data: px });
    await new Promise(r => setTimeout(r, 100));
    Actions.photoCompare({ dataset: { id: 'qa_ph2' } });
    await new Promise(r => setTimeout(r, 300));
    const m = Modal.top().el, a = m.querySelector('#pcA'), b = m.querySelector('#pcB');
    a.value = 'qa_ph2'; a.dispatchEvent(new Event('change', { bubbles: true }));
    m.querySelector('#pcB').value = 'qa_ph1'; m.querySelector('#pcB').dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const t = Modal.top().el.innerText.match(/[−-]?\d+ Tage? Unterschied/);
    Modal.closeAll();
    Store.del('photos', 'qa_ph1'); Store.del('photos', 'qa_ph2');
    return t && t[0];
  });
  check(cmp === '31 Tage Unterschied', 'T16: vertauschte Vergleichsfotos zeigen „31 Tage Unterschied"', cmp);

  // T02 + T04: Ruhepuls allein zählt als Gasteingabe; Abmelden entfernt den Profilnamen, das Design bleibt
  const out = await page.evaluate(async () => {
    Store.saveSettings({ displayName: 'QA offline', birthYear: 1990, design: 'pure' });
    Store.detach();
    await new Promise(r => setTimeout(r, 400));
    const s = JSON.parse(localStorage.getItem(LS.settings) || '{}');
    Store.put('heart', 'qa_rhr', { date: isoDate(), rhr: 63, rhrM: 'tap', updatedAt: Date.now() });
    const heartOnly = Store.hasUserData();
    return { name: S().displayName, by: S().birthYear, design: S().design, lsName: s.displayName, heartOnly };
  });
  check(out.name === '' && out.by === null && out.lsName === '' && out.design === 'pure', 'T04: nach dem Abmelden ist der Profilname vom Gerät entfernt, das Design bleibt', JSON.stringify(out));
  check(out.heartOnly, 'T02: ein gespeicherter Ruhepuls allein löst die Übernahme-Rückfrage aus', JSON.stringify(out));
  await page.evaluate(() => Store.saveSettings({ design: 'gymlog' }));
  check(!page.errors.length, 'keine JavaScript-Fehler bei den Befund-Prüfungen', page.errors.join(' | '));
  const logged = await appErrors(page);
  check(!logged.length, 'Fehlerprotokoll bleibt leer', logged.join(' | '));
}

module.exports = befundeFlow;
