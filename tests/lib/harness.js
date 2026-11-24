/* Gemeinsame Test-Hilfen: Prüfen, lokaler Webserver, App im Browser öffnen */
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SHOTS = path.join(__dirname, '..', 'screenshots');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const state = { failed: 0, messages: [] };
function check(cond, msg, detail) {
  if (cond) console.log('  ✓ ' + msg);
  else { state.failed++; state.messages.push(msg + (detail ? ' – ' + detail : '')); console.log('  ✗ ' + msg + (detail ? `\n      ${detail}` : '')); }
  return !!cond;
}

/* ---------- 2. Kleiner Webserver für das Repo ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
/** Ersetzte Dateien (Pfad → Inhalt), z. B. ein neuer sw.js für den Update-Test */
const overrides = {};
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (overrides[p] != null) { res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'text/plain' }); return res.end(overrides[p]); }
      if (p.startsWith('/test/')) p = p.slice(5);   // für tests/e2e/altlasten.js: die frühere Testversion unter /test/ nachstellen
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* ---------- 3. Browser ---------- */
async function openApp(browser, base, viewport, touch = false, userAgent = undefined, { serviceWorkers = 'block' } = {}) {
  const ctx = await browser.newContext({ viewport, serviceWorkers, locale: 'de-DE', hasTouch: touch, acceptDownloads: true, userAgent });
  // nur die eigene Seite – Firebase, Schriften usw. bleiben draußen; Chart.js (CDN) kommt aus node_modules
  const chartJs = path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js');
  await ctx.route(url => !url.href.startsWith(base), r => /\/chart\.js@/.test(r.request().url()) && fs.existsSync(chartJs)
    ? r.fulfill({ path: chartJs, contentType: 'text/javascript' }) : r.abort());
  // WebKit unter Linux (ohne Grafikkarte, Software-Rendering) stürzt bei CSS-Übergängen zufällig ab – das iPhone nicht.
  // Darum dort ohne transition; Animationen und alles andere laufen normal.
  if (browser.browserType().name() === 'webkit') await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.appendChild(st);
  }));
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('crash', () => page.errors.push('Browser-Seite abgestürzt'));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|Failed to preconnect|ERR_FAILED|net::/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#tab-' + App.tab).innerHTML.length > 0, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  return page;
}
const round1 = v => Math.round(v * 10) / 10;
const pause = (page, ms = 250) => page.waitForTimeout(ms);
const noViewError = page => page.evaluate(() => !document.querySelector('.tab.active').innerText.includes('Fehler beim Anzeigen'));
const appErrors = page => page.evaluate(() => ErrLog.all().map(e => e.msg || e.message || String(e)));
/** Ein Touch-Ereignis (touchStart/touchMove/touchEnd, points = [{ x, y }]). Chromium: echter Touch über CDP.
    Andere Engines (WebKit): TouchEvents per JavaScript am Element unter dem ersten Finger – ohne natives Scrollen. */
/** Browser-Engine der Seite: 'chromium' oder 'webkit' */
const engine = page => page.context().browser().browserType().name();
async function touch(page, type, points = []) {
  if (engine(page) === 'chromium') {
    const cdp = page.cdp || (page.cdp = await page.context().newCDPSession(page));
    return cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : points });
  }
  return page.evaluate(([type, points]) => {
    const name = { touchStart: 'touchstart', touchMove: 'touchmove', touchEnd: 'touchend' }[type];
    if (name === 'touchstart') window.__touchTarget = document.elementFromPoint(points[0].x, points[0].y) || document.body;
    const target = window.__touchTarget || document.body;
    // WebKit ohne Touch-Bildschirm kennt keinen Touch-Konstruktor → einfache Objekte mit denselben Feldern
    const list = (name === 'touchend' ? window.__lastTouch || [] : points).map((p, i) =>
      ({ identifier: i, target, clientX: p.x, clientY: p.y, pageX: p.x + scrollX, pageY: p.y + scrollY, screenX: p.x, screenY: p.y }));
    if (name !== 'touchend') window.__lastTouch = points;
    const ev = new Event(name, { bubbles: true, cancelable: true, composed: true });
    for (const [k, v] of [['touches', name === 'touchend' ? [] : list], ['targetTouches', name === 'touchend' ? [] : list], ['changedTouches', list]])
      Object.defineProperty(ev, k, { value: v });
    target.dispatchEvent(ev);
  }, [type, points]);
}
/** Wischgeste mit dem Finger */
async function swipe(page, x1, x2, y) {
  await touch(page, 'touchStart', [{ x: x1, y }]);
  for (let k = 1; k <= 10; k++) { await touch(page, 'touchMove', [{ x: x1 + (x2 - x1) * k / 10, y }]); await page.waitForTimeout(16); }
  await touch(page, 'touchEnd');
  await page.waitForTimeout(600);
}

module.exports = { overrides, ROOT, SHOTS, read, state, check, serve, openApp, pause, round1, noViewError, appErrors, engine, touch, swipe };
