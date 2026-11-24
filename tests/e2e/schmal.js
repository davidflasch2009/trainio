'use strict';
const path = require('path');
const { check, pause, noViewError, appErrors, touch, swipe, round1, SHOTS, ROOT, read } = require('../lib/harness');

/** T13: 320 px breit, Text XL, Dichte luftig, hoher Kontrast – in jedem Design ragt nichts über den Rand */
async function schmalFlow(page) {
  console.log('Schmales Display (320 × 700, Text XL)');
  // mit Beispieldaten, damit jede Ansicht gut gefüllt ist
  await page.addScriptTag({ path: path.join(ROOT, 'tests', 'lib', 'beispieldaten.js') });
  const n = await page.evaluate(async () => { await Beispieldaten.load(); App.renderCurrent(); return { wo: Store.all('workouts').length, bw: Store.all('progress').length, prs: Store.all('prs').length }; });
  check(n.wo >= 20 && n.bw >= 20 && n.prs > 10, `Beispieldaten geladen (${n.wo} Workouts, ${n.bw}× Gewicht)`, JSON.stringify(n));
  await pause(page, 500);
  const bad = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    const views = [['training', () => { UI.trainSub = 'plans'; App.go('training', { instant: true }); }], ['verlauf', () => { UI.trainSub = 'history'; App.go('training', { instant: true }); }],
      ['fortschritt', () => { UI.progSub = 'overview'; App.go('progress', { instant: true }); }], ['start', () => App.go('start', { instant: true })], ['mehr', () => App.go('more', { instant: true })]];
    for (const d of DESIGNS) {
      for (const m of d.phased ? ['dark'] : ['light', 'dark']) {
        Store.saveSettings({ motion: 'off', design: d.id, theme: m, textSize: 'xl', density: 'comfy', contrast: true });
        applyTheme();
        for (const [name, go] of views) {
          go(); await wait(160);
          const v = document.querySelector('#view'), vw = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth > vw || v.scrollWidth > v.clientWidth + 1) out.push(`${d.id}·${m} ${name}: ${v.scrollWidth}/${v.clientWidth}`);
        }
      }
    }
    Store.saveSettings({ textSize: 'm', density: 'normal', contrast: false, design: 'gymlog' });
    applyTheme();
    return out;
  });
  check(!bad.length, 'T13: Training, Verlauf, Fortschritt, Start und Mehr passen in jedem Design auf 320 px', bad.slice(0, 5).join(' | '));
  check(!page.errors.length, 'keine JavaScript-Fehler auf dem schmalen Display', page.errors.join(' | '));
}

module.exports = schmalFlow;
