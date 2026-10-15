// Real UI playthrough. Uses the existing test/package.json dependency; no install step.
// node test/night-ride.mjs http://127.0.0.1:8765/index.html /tmp/wl-s1-shots
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verifyReports } from './verify.mjs';
const [,, url, outdir = '/tmp/wl-s1-shots'] = process.argv;
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
  for (const [width, height, order] of [[960, 540, ['lantern', 'orchard']], [662, 418, ['orchard', 'lantern']]]) {
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
    let failure = null;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
      check('Opening subtitle matches dawn', await page.$eval('.brand small', e => e.textContent.includes('Dawn of April 19')));
      await click('#begin');
      if (width === 960) {
        await click('#pause'); const before = await snapshot();
        await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
        check('Pause traps keyboard focus', await page.evaluate(() => document.activeElement.id === (document.getElementById('music').disabled ? 'resume' : 'music')));
        await new Promise(r => setTimeout(r, 200));
        check('Opening pauses its clock', (await snapshot()).elapsed === before.elapsed);
        await click('#resume'); await phase('blackout');
      } else { await click('#skip'); await phase('blackout'); }
      await shot('blackout');
      check('Blackout is opaque', await page.$eval('.overlay', e => getComputedStyle(e).backgroundColor === 'rgb(0, 0, 0)'));
      await click('#black-notebook');
      check('Skip retains every caption', await page.$eval('dialog', e => e.textContent.includes('Estimates vary.') && e.textContent.includes('[FORMATION]')));
      await click('#close-dialog'); await click('#rewind'); await shot('rewind');
      await reloadAndResume(); await phase('rewind'); await click('#start-ride');
      await page.keyboard.press('e'); await shot('revere');
      check('Revere speech is labeled', await page.$eval('dialog', e => e.textContent.includes('Dramatized dialogue') && e.textContent.includes('not a quotation')));
      await click('#ask-source'); await click('#accept');
      await page.bringToFront(); await page.keyboard.down('w');
      try {
        await new Promise(r => setTimeout(r, 300));
        await page.waitForFunction(() => WitnessGame.snapshot().run.z < 44, { timeout: 5000 });
      } finally { await page.keyboard.up('w'); }
      check('Keyboard rides the horse', (await snapshot()).run.z < 44);
      await shot('ride');
      await click('#travel-' + order[0]); await click('#pause'); const before = await snapshot();
      await new Promise(r => setTimeout(r, 200));
      check('Pause freezes movement', (await snapshot()).run.z === before.run.z);
      await click('#resume');
      await click('#travel-' + order[0]); await click('#notebook'); const inNotebook = await snapshot();
      await new Promise(r => setTimeout(r, 200));
      check('Notebook stops movement', (await snapshot()).run.z === inNotebook.run.z);
      await click('#close-dialog');
      await travel(order[0], order[0] === 'lantern' ? 28 : 10); await click('#record-alarm');
      await reloadAndResume(); await phase('ride');
      check('Mid-alarm refresh preserves the first household', (await snapshot()).run.visited[0] === order[0]);
      await travel(order[0], order[0] === 'lantern' ? 28 : 10); await click('#record-alarm');
      check('Revisits do not duplicate observations', (await snapshot()).run.visited.length === 1);
      await travel(order[1], order[1] === 'lantern' ? 28 : 10); await click('#record-alarm');
      check('Both household orders complete', JSON.stringify((await snapshot()).run.visited) === JSON.stringify(order));
      await travel('parsonage', 44); await phase('complete'); await shot('checkpoint');
      await reloadAndResume(); await phase('complete'); await click('#end-notebook'); await shot('notebook');
      check('Completion notebook survives refresh', await page.$eval('dialog', e => e.textContent.includes('rode back') && e.textContent.includes('not primary testimony')));
      await click('#close-dialog'); await click('#replay'); await click('#skip'); await click('#rewind'); await phase('complete');
      await reloadAndResume(); await phase('complete');
      check('Opening replay preserves the completed checkpoint', (await snapshot()).run.returned);
      await click('#restart'); await click('#confirm-restart'); await phase('intro');
      check('Restart clears saved alarm', await page.evaluate(() => localStorage.getItem('witness-lexington-s1-v1') === null));
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
