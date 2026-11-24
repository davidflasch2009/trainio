'use strict';
const fs = require('fs');
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

/* Datenwege mit echten Eingaben: Backup → alles löschen → wiederherstellen, Arrow-Import + Rückgängig, Gewichts-CSV */
async function dataFlow(page) {
  console.log('Datenwege');
  const count = () => page.evaluate(() => ({ w: Store.all('workouts').length, t: Store.all('templates').length, pr: Store.all('prs').length, prog: Store.all('progress').length, ex: Store.all('exercises').length, imp: Store.all('imports').length }));
  await page.evaluate(async () => {
    const ops = [];
    for (let i = 1; i <= 6; i++) { const st = Date.now() - i * 86400000 * 3; ops.push({ type: 'put', coll: 'workouts', id: 'dw' + i, doc: { date: isoDate(new Date(st)), startedAt: st, durationSec: 3000, name: 'Push', entries: [{ exerciseId: 'ex_bankdruecken', exerciseName: 'Bankdrücken', sets: [{ reps: 8, weightKg: 60 + i, done: true }] }] } }); }
    ops.push({ type: 'put', coll: 'templates', id: 'dt1', doc: { name: 'Push', exercises: [{ exerciseId: 'ex_bankdruecken', sets: 3, reps: '8', restSec: 90 }] } });
    await Store.batch(ops); await PR.recalcAll();
    Store.saveSettings({ design: 'plakat' });
  });
  const before = await count();
  // Backup herunterladen
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => { Actions.backupJSON(); })]);
  const file = path.join(SHOTS, '..', '.backup-test.json');
  await dl.saveAs(file);
  const bk = JSON.parse(fs.readFileSync(file, 'utf8'));
  check(bk.app === 'Trainio' && bk.data.workouts.length === before.w, `Backup enthält alle ${before.w} Workouts`);
  // Alles löschen: zwei Rückfragen, die zweite mit „LÖSCHEN"
  await page.evaluate(() => { Actions.deleteAll(); });
  await pause(page, 400); await page.click('.modal [data-x="ok"]'); await pause(page, 450);
  await page.fill('#cfmInput', 'LÖSCHEN'); await page.click('.modal [data-x="ok"]'); await pause(page, 900);
  const del = await count();
  check(del.w === 0 && del.t === 0 && del.ex > 300, 'Alles gelöscht, Übungs-Bibliothek neu angelegt', JSON.stringify(del));
  // Wiederherstellen: Datei → „Komplett ersetzen" → bestätigen
  page.once('filechooser', fc => fc.setFiles(file));
  await page.evaluate(() => { Actions.restoreJSON(); });
  await pause(page, 600); await page.click('.modal [data-k="replace"]'); await pause(page, 500); await page.click('.modal [data-x="ok"]'); await pause(page, 1500);
  const after = await count();
  fs.rmSync(file, { force: true });
  check(after.w === before.w && after.t === before.t && after.pr === before.pr, 'Backup wiederhergestellt (Workouts, Vorlagen, PRs)', JSON.stringify({ before, after }));
  check(await page.evaluate(() => S().design === 'plakat'), 'Einstellungen aus dem Backup übernommen');
  // Arrow-Import mit dem Beispiel, danach rückgängig
  await page.evaluate(() => { Actions.openArrow(); }); await pause(page, 500);
  await page.click('.modal [data-x="example"]'); await pause(page, 200);
  await page.click('.modal [data-x="validate"]'); await pause(page, 600);
  const c0 = await count();
  await page.click('#impCommit'); await pause(page, 2500);
  const c1 = await count();
  check(c1.w > c0.w && c1.imp === c0.imp + 1, `Arrow-Import: ${c1.w - c0.w} Workouts importiert`, JSON.stringify({ c0, c1 }));
  await page.evaluate(() => Modal.closeAll()); await pause(page, 400);
  await page.evaluate(() => { Actions.undoImport(); }); await pause(page, 500); await page.click('.modal [data-x="ok"]'); await pause(page, 1500);
  check((await count()).w === c0.w, 'Arrow-Import rückgängig gemacht');
  // Gewicht als CSV (Semikolon, Dezimalkomma)
  const csvFile = path.join(SHOTS, '..', '.gewicht-test.csv');
  fs.writeFileSync(csvFile, '"Datum";"Gewicht (kg)"\n"2026-10-01";"81,4"\n"2026-10-02";"81,1"\n"2026-10-03";"80,9"\n');
  const g0 = (await count()).prog;
  await page.evaluate(() => { Actions.bwImport(); }); await pause(page, 500);
  await page.setInputFiles('#bwiFile', csvFile); await pause(page, 600);
  if (await page.evaluate(() => !document.querySelector('.modal [data-x="go"]').disabled)) { await page.click('.modal [data-x="go"]'); await pause(page, 900); }
  fs.rmSync(csvFile, { force: true });
  check((await count()).prog === g0 + 3, 'Gewichts-CSV: 3 Werte importiert');
  await page.evaluate(() => Modal.closeAll());

  // Design wechseln, während Diagramme gezeichnet sind (früher: „Canvas is already in use")
  console.log('Design-Wechsel mit Diagrammen');
  await page.evaluate(() => App.go('progress'));
  await pause(page, 600);
  // Alle Diagramme sind sofort gezeichnet – auch unterhalb des Bildschirms, ohne Hinscrollen (sonst unscharf auf dem iPhone)
  const cv = await page.evaluate(() => typeof Chart === 'undefined' ? null : [...document.querySelectorAll('#tab-progress canvas')].filter(c => c.style.display !== 'none')
    .map(c => ({ id: c.id, drawn: !!Chart.getChart(c), below: c.getBoundingClientRect().top > innerHeight, sharp: Math.abs(c.width - c.clientWidth * devicePixelRatio) < 2 })));
  check(cv && cv.length && cv.every(c => c.drawn) && cv.some(c => c.below), `Diagramme sofort gezeichnet, auch unterhalb (${cv ? cv.length : 0})`, cv ? JSON.stringify(cv.filter(c => !c.drawn)) : 'Chart.js fehlt – npm install ausführen');
  check(cv && cv.every(c => c.sharp), 'Diagramme mit voller Pixeldichte', cv ? JSON.stringify(cv.filter(c => !c.sharp)) : '');
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 600);
  const designs = await page.locator('#tab-more .design-tile').evaluateAll(tiles => tiles.map(t => t.dataset.v));
  check(designs.join(',') === 'gymlog,glass,pure,plakat,fokus,sky', 'Darstellung zeigt die sechs verfügbaren Designs', designs.join(','));
  check(await page.evaluate(() => ['paper', 'iron', 'carbon'].every(design => lookAttrs({ design })['data-design'] === 'gymlog')), 'Entfernte Designs fallen auf Trainio zurück');
  // Trainio-Standard: Nachtblau & Kreide, Gold für Rekorde, Kreidestreifen, Sportschrift für Zahlen
  const tr = await page.evaluate(() => {
    Store.saveSettings({ design: 'gymlog', theme: 'dark', accent: '' }); applyTheme();
    const box = document.createElement('div'); box.innerHTML = `<span class="badge accent">${icon('trophy')} PR</span><div class="card">x</div>`; document.querySelector('#tab-more').append(box);
    const cs = el => getComputedStyle(el), root = cs(document.documentElement);
    const out = {
      bg: root.getPropertyValue('--bg').trim(), accent: root.getPropertyValue('--accent').trim(),
      gold: cs(box.querySelector('.i-trophy')).color, stripes: /repeating-linear-gradient/.test(cs(document.body).backgroundImage),
      noBorder: cs(box.querySelector('.card')).borderTopColor === 'rgba(0, 0, 0, 0)', font: /Saira/.test(root.getPropertyValue('--font-num')),
      fontLink: !!document.querySelector('link[href*="Saira"]')
    };
    box.remove();
    return out;
  });
  check(tr.bg === '#0c111c' && tr.accent === '#ece6d3' && tr.gold === 'rgb(214, 178, 94)' && tr.stripes && tr.noBorder && tr.font && tr.fontLink,
    'Trainio-Design: Nachtblau & Kreide, Pokale in Gold, Kreidestreifen, Karten ohne Rahmen im Dunkeln, Sportschrift geladen', JSON.stringify(tr));
  for (const sel of ['[data-k="accent"][data-v="#0a84ff"]', '[data-k="design"][data-v="glass"]', '[data-k="theme"][data-v="light"]', '[data-k="design"][data-v="pure"]']) {
    await page.click(`#tab-more ${sel}`);
    await pause(page, 450);
  }
  await pause(page, 600);   // Überblendung zu Ende
  const look = await page.evaluate(() => ({ d: document.documentElement.dataset.design, t: document.documentElement.dataset.theme, swap: document.documentElement.classList.contains('look-swap'), active: !!document.querySelector('#tab-more .design-tile.active[data-v="pure"]') }));
  check(look.d === 'pure' && look.t === 'light' && !look.swap && look.active, 'Design, Farbe und Modus übernommen', JSON.stringify(look));
  // Plakat: eckig, Linien statt Karten, Rot nur als Akzent
  await page.click('#tab-more [data-k="accent"][data-v=""]').catch(() => page.evaluate(() => Store.saveSettings({ accent: '' })));
  await page.click('#tab-more [data-k="design"][data-v="plakat"]');
  await pause(page, 900);
  await page.evaluate(() => App.go('start'));
  await pause(page, 500);
  const pl = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement), st = document.querySelector('#tab-start .stat'), hero = document.querySelector('#tab-start .btn-hero');
    return { d: document.documentElement.dataset.design, rs: cs.getPropertyValue('--rs').trim(), accent: cs.getPropertyValue('--accent').trim(), statTop: st && getComputedStyle(st).borderTopWidth, statBg: st && getComputedStyle(st).backgroundColor, heroR: hero && getComputedStyle(hero).borderRadius }; });
  check(pl.d === 'plakat' && pl.rs === '0' && pl.accent === '#e2001a' && pl.statTop === '2px' && pl.statBg === 'rgba(0, 0, 0, 0)' && pl.heroR === '0px', 'Design „Plakat": eckig, Linien statt Karten, Signalrot', JSON.stringify(pl));
  // Plakat: umrahmte Einträge in „Workout starten" behalten Innenabstand (Icon klebt nicht am Rahmen)
  const amPad = await page.evaluate(async () => { Actions.startSheet(); await new Promise(r => setTimeout(r, 500));
    const e = document.querySelector('.modal .list-item.am-solo, .modal .list-item.am-featured'), v = e ? parseFloat(getComputedStyle(e).paddingLeft) : -1; Modal.closeAll(); return v; });
  check(amPad >= 10, 'Plakat: umrahmte Einträge mit Innenabstand', String(amPad));
  await pause(page, 400);
  // Eigene Einstellungen gelten auch im Plakat: „Rund" rundet Knöpfe, Chips und Schalter, eigene Farbe färbt Diagramme
  await page.evaluate(() => { setLook('radius', 'round'); setLook('accent', '#a3e635'); openMoreSub('look'); });
  await pause(page, 700);
  const plr = await page.evaluate(() => { const r = sel => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).borderTopLeftRadius) : -1; };
    return { btn: r('#tab-more .look-preview .btn'), chip: r('#tab-more .look-preview .chip'), seg: r('#tab-more .seg'), sw: r('#tab-more .switch span'), c1: cssVar('--c1') }; });
  check(plr.btn >= 15 && plr.chip >= 18 && plr.seg >= 15 && plr.sw >= 15 && plr.c1 === '#a3e635', 'Plakat: Ecken „Rund" und eigene Akzentfarbe wirken', JSON.stringify(plr));
  await page.evaluate(() => { setLook('radius', 'auto'); setLook('accent', ''); });
  // Startskript in index.html (Darstellung vor dem ersten Bild) kennt jedes Design – sonst springt es kurz auf „Trainio"
  const boot = await page.evaluate(async () => { const html = await (await fetch('index.html')).text(); const m = html.match(/!\/\^\(([a-z|]+)\)\$\//); return { ids: m ? m[1].split('|') : [], all: DESIGNS.map(d => d.id) }; });
  check(boot.all.every(id => boot.ids.includes(id)), 'Startskript kennt alle Designs', JSON.stringify(boot));
  // Aufgeräumt: keine Beschreibungen unter Designs, Erklärungen nur im (i) neben dem Titel
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 500);
  const tidy = await page.evaluate(() => ({ desc: document.querySelectorAll('#tab-more .dt-desc').length, subs: document.querySelectorAll('#tab-more .sl-sub').length,
    infos: document.querySelectorAll('#tab-more .sl-title .info-i').length, hint: [...document.querySelectorAll('#tab-more p')].filter(x => /Home-Bildschirm|Browser-Tab/.test(x.textContent)).length }));
  check(tidy.desc === 0 && tidy.subs === 0 && tidy.hint === 0 && tidy.infos >= 5, 'Darstellung ohne Erklärtexte, Erklärungen im (i)', JSON.stringify(tidy));
  // Tag & Nacht: Phase nach Sonnenstand statt Hell/Dunkel, Himmel sichtbar, vier Vorschau-Himmel, Tageszeit statt Modus
  await page.evaluate(() => openMoreSub('look'));
  await pause(page, 500);
  await page.click('#tab-more [data-k="design"][data-v="sky"]');
  await pause(page, 900);
  const sk = await page.evaluate(() => { const r = document.documentElement, b = getComputedStyle(document.body), ph = r.dataset.phase;
    return { d: r.dataset.design, ph, okTheme: r.dataset.theme === Sky.THEME[ph], sky: getComputedStyle(document.getElementById('sky')).display, top: b.getPropertyValue('--sk-top').trim(),
      previews: document.querySelectorAll('#tab-more .design-tile.active .tp').length, tageszeit: !!document.querySelector('#tab-more .sky-set'), modus: !!document.querySelector('#tab-more [data-k="theme"]'),
      cache: (JSON.parse(localStorage.getItem('gymlog.look')) || {}).sky }; });
  check(sk.d === 'sky' && ['dawn', 'day', 'dusk', 'night'].includes(sk.ph) && sk.okTheme && sk.sky === 'block' && /^#/.test(sk.top) && sk.previews === 4 && sk.tageszeit && !sk.modus && Array.isArray(sk.cache) && sk.cache.length === 4,
    'Design „Tag & Nacht": Phase nach Sonnenstand, Himmel, vier Vorschau-Himmel, Tageszeit statt Modus', JSON.stringify(sk));
  // Über 24 Stunden: Phasen in der richtigen Reihenfolge, Text auf dem Himmel immer lesbar (oben 7:1)
  const day = await page.evaluate(() => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); const seq = [], bad = [];
    for (let i = 0; i < 96; i++) { const t = d0.getTime() + i * 15 * 6e4, c = Sky.compute(t); if (seq[seq.length - 1] !== c.ph) seq.push(c.ph);
      const k = Color.contrast(Sky.INK[c.ph][0], c.sky.top); if (k < 7) bad.push(i + ':' + c.ph + ':' + k.toFixed(1)); }
    return { seq: seq.join(' '), bad, noon: Sky.state(d0.getTime() + 12 * 36e5).ph }; });
  check(day.seq === 'night dawn day dusk night' && !day.bad.length && day.noon === 'day', 'Tag & Nacht: Nacht → Dämmerung → Tag → Sonnenuntergang → Nacht, Himmel immer lesbar', JSON.stringify(day));
  // Phasenwechsel ohne Neustart: Uhr auf 12:00, dann 23:30 stellen → beim Zurückkehren in die App wechselt die Phase
  const flip = await page.evaluate(async () => { const real = Date.now, r = document.documentElement, out = [];
    try {
      for (const [h, m] of [[12, 0], [23, 30]]) { const d = new Date(); d.setHours(h, m, 0, 0); const t = d.getTime(); Date.now = () => t;
        document.dispatchEvent(new Event('visibilitychange')); await new Promise(res => setTimeout(res, 2200)); out.push(r.dataset.phase + '/' + r.dataset.theme); }
      return out.join(' ');
    } finally { Date.now = real; } });
  check(flip === 'day/light night/dark', 'Tag & Nacht: Phase wechselt von selbst (12:00 Tag/hell → 23:30 Nacht/dunkel)', flip);
  await page.evaluate(() => { switchLook(() => {}); });
  await pause(page, 300);
  // Fokus: schwarz-weiß ohne Effekte, Spotlight auf aktuelle Übung und nächsten Satz
  const fk = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    setLook('design', 'fokus'); App.go('start'); await sleep(500);
    const hero = document.querySelector('#tab-start .btn-hero'), effects = hero ? getComputedStyle(hero, '::after').backgroundImage + getComputedStyle(hero).boxShadow : '?';
    Workout.start({ name: 'Fokus-Test', entries: [Workout.makeEntry('ex_bankdruecken'), Workout.makeEntry('ex_kniebeuge')] });
    const w = Workout.cur(); w.entries[0].sets[0].weightKg = 80; w.entries[0].sets[0].reps = 8; w.entries[0].sets[0].done = true; Workout.save();
    App.go('training'); App.renderCurrent(); await sleep(700);
    const cur = document.querySelector('#tab-training .ex-card.ex-cur'), other = document.querySelector('#tab-training .ex-card:not(.ex-cur)');
    const next = cur && cur.querySelector('.set-row.set-next');
    const out = { d: document.documentElement.dataset.design, effects, accent: cssVar('--accent'), font: cssVar('--font-display'), cur: !!cur, nextSi: next ? next.dataset.si : null, otherOp: other ? +getComputedStyle(other).opacity : null };
    Workout.discard(); App.go('start');
    return out; });
  check(fk.d === 'fokus' && fk.effects === 'nonenone' && ['#ffffff', '#0a0a0a'].includes(fk.accent) && !/Saira/.test(fk.font) && fk.cur && fk.nextSi === '1' && fk.otherOp < .8,
    'Design „Fokus": schwarz-weiß ohne Effekte, Spotlight auf aktuelle Übung und nächsten Satz', JSON.stringify(fk));
  await page.evaluate(() => App.go('progress'));
  await pause(page, 600);
  const logged = await appErrors(page);
  check(!logged.length && !page.errors.length, 'keine Fehler beim Design-Wechsel', [...logged, ...page.errors].join(' | '));
}

module.exports = dataFlow;
