'use strict';
const { check, appErrors } = require('../lib/harness');

module.exports = async function zeitraum(page) {
  await page.evaluate(() => App.go('progress', { instant: true }));
  const period = page.locator('.prog-period');
  const dialog = page.locator('.modal-wrap:not(.closing) .modal');
  const choose = async key => {
    await period.click();
    await dialog.locator(`[data-k="${key}"]`).click();
  };
  await choose('4w');
  await page.getByRole('tab', { name: 'Kraft', exact: true }).click();
  check((await period.innerText()).includes('4 Wochen') && await page.evaluate(() => Analytics.range().len === 28),
    'Fester Zeitraum bleibt beim Wechsel auf Kraft erhalten');

  await page.getByRole('tab', { name: 'Kraft', exact: true }).press('ArrowRight');
  await page.waitForFunction(() => document.activeElement?.dataset.v === 'volume');
  check(await page.getByRole('tab', { name: 'Volumen' }).getAttribute('aria-selected') === 'true',
    'Pfeiltaste wechselt Tab, Markierung und Tastaturfokus');

  await choose('custom');
  await dialog.locator('#cfFrom').fill('2025-02-01');
  await dialog.locator('#cfTo').fill('2025-02-10');
  await dialog.getByText('Anwenden', { exact: true }).click();
  check((await period.innerText()).includes('01.02.25 – 10.02.25'), 'Eigener Zeitraum zeigt beide Daten');
  await choose('custom');
  await dialog.getByText('Abbrechen', { exact: true }).click();
  check(await page.evaluate(() => Analytics.range().len === 10), 'Abbrechen behält die gesetzten Datumsgrenzen');

  await choose('new');
  await dialog.locator('#phName').fill('Bulk <A>');
  await dialog.locator('#phFrom').fill('2025-02-01');
  await dialog.getByText('Speichern', { exact: true }).click();
  check((await period.innerText()).includes('Bulk <A> · seit 01.02.25'), 'Neue Phase wird mit Name und Start ausgewählt');
  await choose('edit');
  await dialog.locator('#phTo').fill('2025-03-01');
  await dialog.getByText('Speichern', { exact: true }).click();
  check((await period.innerText()).includes('01.02.25 – 01.03.25'), 'Bearbeitete Phase zeigt das Enddatum');
  const phase = await page.evaluate(() => UI.period);
  await choose('all');
  await choose(phase);
  check(await page.evaluate(() => Analytics.range().phase?.name === 'Bulk <A>'), 'Bestehende Phase erneut auswählbar');

  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('tab', { name: 'Körper', exact: true }).click();
  const errors = await page.evaluate(() => {
    const root = document.documentElement;
    const results = [];
    for (const design of DESIGNS) {
      for (const mode of design.phased ? Sky.PHASES : ['light', 'dark']) {
        root.dataset.design = design.id;
        root.dataset.theme = design.phased ? Sky.THEME[mode] : mode;
        if (design.phased) root.dataset.phase = mode;
        Views.progress.render(document.querySelector('#tab-progress'));
        const bar = document.querySelector('.prog-controls');
        const active = bar.querySelector('[aria-selected="true"]');
        const box = bar.getBoundingClientRect(), tab = active.getBoundingClientRect();
        if (getComputedStyle(bar).borderBottomWidth !== '1px' || getComputedStyle(bar).borderTopWidth !== '0px'
          || getComputedStyle(active, '::after').height !== '3px' || active.dataset.v !== 'body'
          || tab.left < box.left - 1 || tab.right > box.right + 1 || bar.scrollWidth > bar.clientWidth
          || bar.querySelector('[data-act="unitSet"]')) results.push(design.id + '/' + mode);
      }
    }
    return results;
  });
  check(!errors.length, 'Alle Designs und Himmelsphasen bei 320 px: aktiver Tab sichtbar, Linie unter der Auswahl', errors.join(', '));
  await page.evaluate(() => { UI.period = 'ph:geloescht'; App.renderCurrent(); });
  check((await period.innerText()).includes('Alles') && await page.evaluate(() => Analytics.range().all),
    'Früher gespeicherte, inzwischen gelöschte Phase zeigt den tatsächlich ausgewerteten Zeitraum');
  check(!(await appErrors(page)).length && !page.errors.length, 'Zeitraumwahl ohne JavaScript-Fehler', page.errors.join(', '));
};
