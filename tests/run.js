/* Trainio – Testlauf: prüft die Dateien und klickt die wichtigsten Wege der App im Browser durch
   (Handy- und Desktop-Größe). Läuft komplett lokal: Firebase und CDNs sind gesperrt, die App läuft im lokalen Modus –
   nur Chart.js kommt aus node_modules, damit auch die Diagramme wirklich gezeichnet werden.
   Aufruf: npm test (Abläufe einzeln: ONLY=handy,verlauf npm test)   (einmalig vorher: npm install && npx playwright install chromium)
   Bei einem Fehler landet ein Screenshot in tests/screenshots/. */
'use strict';
const fs = require('fs');
const path = require('path');
const playwright = require('playwright');
const ENGINE = process.env.BROWSER || 'chromium';   // BROWSER=webkit: dieselben Abläufe in der Safari-Engine
const { check, state, serve, openApp, SHOTS } = require('./lib/harness');
const { staticChecks, contrastChecks } = require('./static');
const flow = name => require('./e2e/' + name);

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const HANDY = { width: 390, height: 844 };
/* In WebKit (Linux) nicht nachstellbar – dort nur in Chromium:
   tastatur: ein simuliertes Antippen löst in WebKit unter Linux keinen Klick aus (auf dem iPhone schon)
   offline:  WebKit in Playwright kann mit Service Worker nicht offline neu laden
   altlasten: braucht einen echten Service Worker (wie offline) */
const NUR_CHROMIUM = ['tastatur', 'offline', 'altlasten'];
/* Abläufe in fester Reihenfolge: [Name = Datei in tests/e2e/, Bildschirm, Touch] */
const FLOWS = [
  ['appstart', HANDY, false], ['handy', HANDY, true], ['daten', HANDY, false], ['iphone', HANDY, true], ['herz', HANDY, true], ['formfix', HANDY, true],
  ['anzeige', HANDY, true], ['zeitraum', HANDY, true], ['verlauf', HANDY, true], ['koerperverlauf', HANDY, true], ['muskel', HANDY, false],
  ['befunde', HANDY, false], ['tastatur', HANDY, true], ['rueckgaengig', HANDY, false],
  ['kleintext', HANDY, false], ['offline', HANDY, false], ['altlasten', HANDY, false], ['schmal', { width: 320, height: 700 }, false], ['desktop', { width: 1280, height: 800 }, false]];

(async () => {
  staticChecks();
  contrastChecks();
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  console.log(`Browser: ${ENGINE}`);
  const browser = await playwright[ENGINE].launch(ENGINE === 'chromium' && process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const only = (process.env.ONLY || '').split(',').filter(Boolean);   // ONLY=anzeige,kleintext: nur diese Abläufe
  for (const [name, viewport, touch] of FLOWS) {
    if (only.length && !only.includes(name)) continue;
    if (ENGINE !== 'chromium' && NUR_CHROMIUM.includes(name)) { console.log(`(${name}: nur in Chromium)`); continue; }
    let page = null;
    try {
      page = await openApp(browser, base, viewport, touch, name === 'iphone' ? IPHONE : undefined, { serviceWorkers: name === 'offline' || name === 'altlasten' ? 'allow' : 'block' });
      await flow(name)(page);
    } catch (e) {
      const js = page && page.errors.length ? ` · JS-Fehler: ${page.errors.join(' | ')}` : '';
      check(false, `Ablauf „${name}" abgebrochen`, e.message.split('\n')[0] + js);
    }
    if (state.failed && page) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, (ENGINE === 'chromium' ? '' : ENGINE + '-') + name + '.png') }).catch(() => {}); }
    if (page) await page.context().close();
  }
  await browser.close();
  srv.close();
  // auf GitHub: Fehler als Hinweis am Lauf (auch ohne Anmeldung lesbar)
  if (state.failed && process.env.GITHUB_ACTIONS) console.log(`::error title=${state.failed} Prüfung(en) fehlgeschlagen (${ENGINE})::` + state.messages.join('\n').slice(0, 30000).replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A'));
  console.log(state.failed ? `\n${state.failed} Prüfung(en) fehlgeschlagen` : '\nAlles in Ordnung');
  process.exit(state.failed ? 1 : 0);
})();
