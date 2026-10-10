// UI review screenshots and layout checks at the three contract sizes.
// node test/ui-shots.mjs http://127.0.0.1:8765/index.html artifacts/ui [1280x720,662x418,960x540]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const [,, url, outdir = '/tmp/wl-ui-shots', sizeList = '1280x720,960x540,662x418'] = process.argv;
if (!url || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) throw new Error('Supply a loopback test URL.');
const executablePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
fs.mkdirSync(outdir, { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: true, args: [
  '--no-sandbox', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'
] });
const essay = 'I think the regulars fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first. His diary is an opposing account, and I think his blame might reflect his own side. The documents disagree, so I cannot identify an individual from smoke alone. I would need more evidence to be certain.';
const reports = [];
// Every visible control is at least 44px, visible text is at least 14px, and primary buttons are on screen and not inside a scrolled body.
function audit() {
  const out = { small: [], tinyText: [], hiddenPrimary: [] };
  const shown = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width && r.height && s.visibility !== 'hidden' && s.display !== 'none'; };
  const root = document.querySelector('dialog[open]') || document;
  root.querySelectorAll('button, a[href], select, textarea').forEach(e => {
    if (!shown(e) || e.closest('[hidden]')) return;
    const r = e.getBoundingClientRect(); if (r.height < 44 || r.width < 44) out.small.push((e.id || e.textContent.trim()).slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  root.querySelectorAll('p, span, small, label, button, a, h1, h2, h3, blockquote, b, li, select, textarea').forEach(e => {
    if (!shown(e) || e.closest('[hidden]') || !e.textContent.trim()) return;
    const size = parseFloat(getComputedStyle(e).fontSize); if (size < 14) out.tinyText.push(e.tagName + ' ' + size + ' ' + e.textContent.trim().slice(0, 30));
  });
  root.querySelectorAll('button.primary').forEach(e => {
    if (!shown(e) || e.closest('[hidden]')) return;
    const r = e.getBoundingClientRect(), scroller = e.closest('.card-scroll');
    let ok = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    if (scroller) { const b = scroller.getBoundingClientRect(); ok = ok && r.top >= b.top && r.bottom <= b.bottom; }
    if (e.closest('dialog')) { const d = e.closest('dialog').getBoundingClientRect(); ok = ok && r.bottom <= d.bottom && r.top >= d.top; }
    if (!ok) out.hiddenPrimary.push(e.id || e.textContent.trim());
  });
  return out;
}
try {
  for (const size of sizeList.split(',')) {
    const [width, height] = size.split('x').map(Number);
    const page = await browser.newPage(), errors = [], external = [], audits = {};
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warn', 'assert'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
    page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText));
    await page.setRequestInterception(true);
    page.on('request', r => { if (!r.url().startsWith(new URL(url).origin) && !/^(data|blob):/.test(r.url())) { external.push(r.url()); r.abort(); } else r.continue(); });
    await page.setViewport({ width, height });
    const snap = () => page.evaluate(() => WitnessGame.snapshot());
    const click = async sel => { await page.waitForSelector(sel, { visible: true, timeout: 45000 }); await page.click(sel); };
    const phase = p => page.waitForFunction(p => WitnessGame.snapshot().run.phase === p, { timeout: 45000 }, p);
    const settle = ms => new Promise(r => setTimeout(r, ms));
    const shot = async name => { await settle(350); audits[name] = await page.evaluate(audit); await page.screenshot({ path: path.join(outdir, `${size}-${name}.png`) }); };
    const arrive = (fn, arg) => page.waitForFunction(fn, { timeout: 45000 }, arg);
    async function ride(id, z) { await click('#travel-' + id); await arrive(z => Math.abs(WitnessGame.snapshot().run.z - z) < 0.16 && !WitnessGame.snapshot().assisted, z); }
    async function walk(id) { await click('#travel-' + id); await arrive(id => { const s = WL_DAWN.stops.find(s => s.id === id), d = WitnessGame.snapshot(); return Math.hypot(d.run.dawn.x - s.x, d.run.dawn.z - s.z) < 0.13 && !d.assisted; }, id); }
    async function walkGreen(id) { await click('#travel-' + id); await arrive(id => { const s = WL_GREEN.stops.find(s => s.id === id), g = WitnessGame.snapshot(); return Math.hypot(g.run.green.x - s.x, g.run.green.z - s.z) < 0.13 && !g.assisted; }, id); }
    let failure = null;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready); await shot('01-title');
      await click('#begin'); await page.waitForFunction(() => WitnessGame.snapshot().elapsed >= 15, { timeout: 45000 }); await shot('02-opening');
      await click('#skip'); await shot('03-blackout');
      await click('#rewind'); await shot('04-rewind');
      await click('#start-ride'); await click('#interact'); await click('#ask-source'); await shot('05-dialog-revere');
      await click('#accept'); await ride('lantern', 28); await shot('06-ride-household');
      await click('#interact'); await click('#record-alarm'); await ride('orchard', 10); await click('#interact'); await click('#record-alarm');
      await ride('parsonage', 44); await click('#interact'); await phase('complete'); await shot('07-checkpoint');
      await click('#continue-dawn'); await click('#start-muster'); await shot('08-muster-parker');
      await click('#interact'); await shot('09-dialog-parker'); await click('#accept-message');
      await walk('near'); await shot('10-muster-listening-spot');
      await click('#pause'); await shot('26-paused'); await click('#resume');
      await click('#interact'); await shot('11-dialog-listening'); await click('#record-listening');
      await walk('far'); await click('#interact'); await click('#record-listening');
      await walk('militia'); await click('#interact'); await click('#deliver-message'); await click('#ask-militia'); await shot('12-dialog-militiaman'); await click('#close-dialog');
      await walk('town'); await click('#interact'); await click('#ask-town'); await click('#close-dialog');
      await walk('boundary'); await click('#interact'); await click('#finish-muster'); await phase('muster-complete');
      await click('#continue-green'); await phase('green'); await shot('13-green-spots');
      await walkGreen('corner'); await click('#interact'); await phase('green-event');
      await page.waitForFunction(() => WitnessGame.snapshot().elapsed >= 7, { timeout: 45000 }); await shot('14-green-caption');
      await click('#to-shelter'); await walkGreen('shelter'); await click('#interact'); await shot('15-shelter');
      await click('#enter-study'); await phase('study'); await shot('16-evidence-room');
      await page.select('#document', 'doolittle'); await shot('17-evidence-doolittle');
      for (const id of await page.evaluate(() => WG_DATA.cards.map(c => c.id))) { await page.select('#document', id); await click('#inspect'); }
      await page.select('#rank-0', 'barker'); await page.select('#rank-1', 'revere1775');
      await click('#limitation'); await page.keyboard.type('The diary gives one observer\u2019s account and cannot establish every view.');
      await page.$eval('.card-scroll', e => { e.scrollTop = e.scrollHeight; }); await shot('18-evidence-ranking');
      await click('#study-notebook'); await shot('19-notebook'); await click('#close-dialog');
      await click('#choose-belief'); await shot('20-belief'); await click('#belief-unsure'); await phase('hypothesis');
      await click('#check-hypothesis'); await shot('21-hypothesis-fits');
      await page.select('#aftermath', 'stopped'); await click('#check-hypothesis'); await shot('22-hypothesis-contradicts');
      await page.select('#aftermath', 'fewshots'); await click('#check-hypothesis'); await click('#write-essay'); await phase('essay');
      await shot('23-essay-empty');
      await click('#essay-text'); await page.keyboard.type(essay, { delay: 45 }); await click('#check-essay'); await shot('24-essay-checked');
      if (await page.$('#finish-investigation')) { await click('#finish-investigation'); await phase('finished'); await shot('25-finished'); }
    } catch (e) { failure = e.message; await page.screenshot({ path: path.join(outdir, `${size}-failure.png`) }); }
    const problems = Object.fromEntries(Object.entries(audits).filter(([, a]) => a.small.length || a.tinyText.length || a.hiddenPrimary.length));
    reports.push({ size, failure, errors, external, problems, shots: Object.keys(audits).length });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outdir, 'ui-audit.json'), JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports, null, 2));
if (reports.some(r => r.failure || r.errors.length || r.external.length || Object.keys(r.problems).length)) process.exitCode = 1;
