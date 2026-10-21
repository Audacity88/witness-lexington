// Real UI playthrough. Uses the existing test/package.json dependency; no install step.
// node test/dawn-muster.mjs http://127.0.0.1:8765/index.html /tmp/wl-s2-shots
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verifyReports } from './verify.mjs';
const [,, url, outdir = '/tmp/wl-s2-shots'] = process.argv;
if (!url || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) throw new Error('Supply a loopback test URL.');
const executablePath = process.env.CHROME_BIN || [
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(p => fs.existsSync(p));
if (!executablePath) throw new Error('No installed Chrome found. Set CHROME_BIN to an existing executable.');
fs.mkdirSync(outdir, { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: true, args: [
  '--no-sandbox', '--disable-background-networking', '--disable-component-update',
  '--disable-sync', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'
] });
const reports = [];
try {
  for (const [width, height, order] of [[960, 540, ['near', 'far']], [662, 418, ['far', 'near']]]) {
    const page = await browser.newPage(), errors = [], external = [], checks = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warn', 'assert'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
    page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ': ' + r.url()); });
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (!r.url().startsWith(new URL(url).origin) && !r.url().startsWith('data:')) { external.push(r.url()); r.abort(); }
      else r.continue();
    });
    await page.setViewport({ width, height });
    const snapshot = () => page.evaluate(() => WitnessGame.snapshot());
    const click = async selector => { await page.waitForSelector(selector, { visible: true }); await page.click(selector); };
    const phase = async p => page.waitForFunction(p => WitnessGame.snapshot().run.phase === p, { timeout: 45000 }, p);
    const check = (name, value) => { assert.ok(value, name); checks.push(name); };
    const shot = async name => page.screenshot({ path: path.join(outdir, `${width}x${height}-${name}.png`) });
    async function reloadAndResume() {
      await page.reload({ waitUntil: 'load' }); await click('#load');
    }
    async function travel(id, z) {
      await click('#travel-' + id);
      await page.waitForFunction(z => Math.abs(WitnessGame.snapshot().run.z - z) < 0.16 && !WitnessGame.snapshot().assisted, { timeout: 30000 }, z);
      await click('#interact');
    }
    async function walkTo(id) {
      if (await page.$('#travel-' + id)) {
        await click('#travel-' + id);
        await page.waitForFunction(id => {
          const s = WL_DAWN.stops.find(s => s.id === id), d = WitnessGame.snapshot();
          return Math.hypot(d.run.dawn.x - s.x, d.run.dawn.z - s.z) < 0.13 && !d.assisted;
        }, { timeout: 30000 }, id);
      } else {
        const stop = await page.evaluate(id => WL_DAWN.stops.find(stop => stop.id === id), id);
        await page.bringToFront();
        for (const [axis, negative, positive] of [['x', 'a', 'd'], ['z', 'w', 's']]) {
          const distance = stop[axis] - (await snapshot()).run.dawn[axis];
          if (Math.abs(distance) < 0.3) continue;
          const direction = Math.sign(distance), key = direction < 0 ? negative : positive;
          await page.keyboard.down(key);
          try {
            await page.waitForFunction((axis, target, direction) => (target - WitnessGame.snapshot().run.dawn[axis]) * direction < 0.3, { timeout: 30000 }, axis, stop[axis], direction);
          } finally { await page.keyboard.up(key); }
        }
      }
      await click('#interact');
    }
    let failure = null;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.removeItem('witness-lexington-s1-v1'));
      await page.reload({ waitUntil: 'load' });
      await click('#begin'); await click('#skip'); await click('#rewind'); await click('#start-ride');
      await click('#interact'); await click('#ask-source'); await click('#hear-errand'); await click('#accept');
      for (const id of ['lantern', 'orchard']) { await travel(id, id === 'lantern' ? 28 : 10); await click('#record-alarm'); }
      await travel('parsonage', 44); await phase('complete');
      // pagehide saves the live run. Convert it after navigation, before app startup.
      const migrationHook = await page.evaluateOnNewDocument(() => {
        const key = 'witness-lexington-s1-v1', s = JSON.parse(localStorage.getItem(key));
        if (s?.run?.phase === 'complete') {
          delete s.run.dawn; localStorage.setItem(key, JSON.stringify(s));
          window.wlLegacyFixtureApplied = !('dawn' in s.run);
        }
      });
      await page.reload({ waitUntil: 'load' });
      await page.removeScriptToEvaluateOnNewDocument(migrationHook.identifier);
      check('Migration fixture starts without dawn before application scripts', await page.evaluate(() => window.wlLegacyFixtureApplied === true));
      await click('#load'); await phase('complete');
      check('WL-S1 checkpoint migration retains both alarm notes', (await snapshot()).run.visited.length === 2);
      await click('#continue-dawn'); await shot('dawn');
      await reloadAndResume(); await phase('dawn'); await click('#start-muster'); await phase('muster');
      check('Parker starts within interaction range', !await page.$eval('#interact', e => e.disabled));
      await click('#interact'); await shot('parker');
      check('Parker line is visibly dramatized and sourced', await page.$eval('dialog', e => e.textContent.includes('Invented words, not a quotation.') && e.textContent.includes('[COMMAND]')));
      await click('#accept-message');
      await page.bringToFront(); await page.keyboard.down('d');
      try {
        await new Promise(r => setTimeout(r, 300));
        await page.waitForFunction(() => WitnessGame.snapshot().run.dawn.x > -11, { timeout: 5000 });
      } finally { await page.keyboard.up('d'); }
      check('Keyboard walks on foot', (await snapshot()).run.dawn.x > -11);
      await walkTo('boundary');
      check('Early boundary cannot finish the muster', await page.$('#finish-muster') === null);
      check('Boundary cannot skip the required relay', !(await snapshot()).run.dawn.delivered && await page.$('#finish-muster') === null);
      await click('#close-dialog');
      await click('#travel-militia'); await click('#pause'); const before = await snapshot();
      await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
      check('Pause keeps keyboard focus in its overlay', await page.evaluate(() => document.activeElement.id === (document.getElementById('music').disabled ? 'resume' : 'music')));
      await new Promise(r => setTimeout(r, 200));
      check('Pause freezes walking', JSON.stringify((await snapshot()).run.dawn) === JSON.stringify(before.run.dawn));
      await click('#resume'); await click('#travel-militia'); await click('#notebook'); const note = await snapshot();
      await new Promise(r => setTimeout(r, 200));
      check('Notebook stops movement and assistance', JSON.stringify((await snapshot()).run.dawn) === JSON.stringify(note.run.dawn) && !(await snapshot()).assisted);
      await click('#close-dialog');
      await walkTo('militia'); await click('#deliver-message');
      check('Delivery confirmed before listening', (await snapshot()).run.dawn.delivered && await page.$eval('.panel > p', e => e.textContent.includes('Message delivered.')));
      await click('#interact');
      check('Delivery cannot be repeated', await page.$('#deliver-message') === null);
      check('Witness question waits for both listening spots', await page.$('#ask-militia') === null);
      await click('#close-dialog');
      await walkTo(order[0]); await shot(order[0] + '-listening');
      check('Listening experiment has source and dramatization labels', await page.$eval('dialog', e => e.textContent.includes('Dramatized hearing experiment') && e.textContent.includes('[COMMAND]')));
      await click('#record-listening');
      await reloadAndResume(); await phase('muster');
      check('Mid-muster refresh preserves first listening spot', (await snapshot()).run.dawn.listened[0] === order[0]);
      await walkTo(order[0]); await click('#record-listening');
      check('Revisits do not duplicate listening observations', (await snapshot()).run.dawn.listened.length === 1);
      await walkTo(order[1]); await shot(order[1] + '-listening');
      check('Distant missing words cannot be mistaken for a primary quote', await page.$eval('dialog', e => !e.textContent.includes('Farther away') || e.textContent.includes('not a trimmed primary-source quotation')));
      await click('#record-listening');
      await walkTo('town'); await click('#ask-town'); await shot('townsperson');
      check('Townsperson reports secondhand information', await page.$eval('dialog', e => e.textContent.includes('Fictional character') && e.textContent.includes('did not see the column')));
      await click('#close-dialog'); await walkTo('militia'); await click('#ask-militia'); await shot('militiaman');
      check('Militiaman reports only partial hearing', await page.$eval('dialog', e => e.textContent.includes('I could not hear the rest.')));
      await click('#close-dialog'); await walkTo('boundary'); await shot('boundary'); await click('#finish-muster');
      await phase('muster-complete'); await shot('checkpoint');
      check('Both listening orders finish', JSON.stringify((await snapshot()).run.dawn.listened) === JSON.stringify(order));
      await reloadAndResume(); await phase('muster-complete'); await click('#end-notebook'); await shot('notebook');
      check('Notebook retains alarm and dawn records with source limits', await page.$eval('dialog', e => e.textContent.includes('rode back') && e.textContent.includes('Missing words') && e.textContent.includes('[COMMAND]')));
      await click('#close-dialog'); await click('#replay'); await click('#skip'); await click('#rewind'); await phase('muster-complete');
      await reloadAndResume(); await phase('muster-complete');
      check('Opening replay preserves dawn checkpoint', (await snapshot()).run.dawn.boundary);
      await click('#restart'); await click('#confirm-restart'); await phase('intro');
      check('Restart clears alarm and muster', await page.evaluate(() => localStorage.getItem('witness-lexington-s1-v1') === null));
      check('No horizontal viewport overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check('No console or asset errors', errors.length === 0); check('No external requests', external.length === 0);
    } catch (e) { failure = e.message; await shot('failure'); }
    reports.push({ width, height, order, checks, errors, external, failure });
    fs.writeFileSync(path.join(outdir, 'results.json'), JSON.stringify(reports, null, 2));
    await page.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(reports.map(({ width, height, checks, failure, errors }) => ({ width, height, checks: checks.length, failure, errors })), null, 2));
verifyReports(reports);
