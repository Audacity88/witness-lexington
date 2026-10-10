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
// Route, interaction, footer and primary buttons must sit wholly inside the viewport and every clipping ancestor, uncovered by the HUD
// or anything else; at 960x540 and larger they must not wrap. Scene labels must sit inside the viewport, clear of the HUD and of each
// other, with text at least 14px.
function audit() {
  const out = { small: [], tinyText: [], hiddenPrimary: [], clipped: [], wrapped: [], labels: [] };
  const shown = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width && r.height && s.visibility !== 'hidden' && s.display !== 'none'; };
  const overlay = document.querySelector('.overlay'), overlayUp = overlay && !overlay.hidden && shown(overlay);
  const root = document.querySelector('dialog[open]') || (overlayUp ? overlay : document);
  const name = e => (e.id || e.textContent.trim()).slice(0, 40);
  const box = r => `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  const hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  root.querySelectorAll('.route button, #interact, .card-actions button, dialog .close button, .top button, button.primary').forEach(e => {
    if (!shown(e) || e.closest('[hidden]')) return;
    const r = e.getBoundingClientRect(), why = [];
    if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) why.push('viewport');
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const b = a.getBoundingClientRect(), left = b.left + a.clientLeft, top = b.top + a.clientTop;
      if (r.left < left - 0.5 || r.top < top - 0.5 || r.right > left + a.clientWidth + 0.5 || r.bottom > top + a.clientHeight + 0.5) why.push('clipped by ' + (a.className || a.tagName));
    }
    for (const [fx, fy] of [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x = r.left + 4 + (r.width - 8) * fx, y = r.top + 4 + (r.height - 8) * fy, top = document.elementFromPoint(x, y);
      if (top && top !== e && !e.contains(top)) { why.push('covered by ' + (top.id || top.className || top.tagName)); break; }
    }
    if (why.length) out.clipped.push(name(e) + ' ' + box(r) + ' ' + why.join(', '));
    if (innerWidth >= 900 && innerHeight > 450) {
      const range = document.createRange(); range.selectNodeContents(e);
      const lines = new Set(Array.from(range.getClientRects()).filter(q => q.width > 1).map(q => Math.round(q.top + q.height / 2)));
      if (lines.size > 1) out.wrapped.push(name(e) + ' ' + lines.size + ' lines');
    }
  });
  if (root === document) {
    const canvas = document.querySelector('canvas').getBoundingClientRect();
    const hud = Array.from(document.querySelectorAll('.top .brand, .top .row, .panel')).filter(e => shown(e) && !e.closest('[hidden]')).map(e => e.getBoundingClientRect());
    const placed = [];
    for (const l of WitnessGame.snapshot().labels) {
      const r = { left: canvas.left + l.left, top: canvas.top + l.top, right: canvas.left + l.left + l.width, bottom: canvas.top + l.top + l.height, width: l.width, height: l.height }, why = [];
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) why.push('viewport');
      if (hud.some(h => hit(r, h))) why.push('under HUD');
      if (placed.some(p => hit(r, p))) why.push('overlaps label');
      if (l.titlePx < 14 || (l.subPx !== null && l.subPx < 14)) why.push(`text ${l.titlePx.toFixed(1)}/${l.subPx === null ? '-' : l.subPx.toFixed(1)}px`);
      if (why.length) out.labels.push(l.text + ' ' + box(r) + ' ' + why.join(', '));
      placed.push(r);
    }
  }
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
    const check = async name => { await settle(350); audits[name] = await page.evaluate(audit); };
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
      await click('#interact'); await click('#record-alarm'); await ride('orchard', 10); await check('ride-orchard'); await click('#interact'); await click('#record-alarm');
      await ride('parsonage', 44); await click('#interact'); await phase('complete'); await shot('07-checkpoint');
      await click('#continue-dawn'); await click('#start-muster'); await shot('08-muster-parker');
      await click('#interact'); await shot('09-dialog-parker'); await click('#accept-message');
      await walk('near'); await shot('10-muster-listening-spot');
      await click('#pause'); await shot('26-paused'); await click('#resume');
      await click('#interact'); await shot('11-dialog-listening'); await click('#record-listening');
      await walk('far'); await check('muster-at-far'); await click('#interact'); await click('#record-listening');
      await walk('militia'); await check('muster-at-militia'); await click('#interact'); await click('#deliver-message'); await click('#ask-militia'); await shot('12-dialog-militiaman'); await click('#close-dialog');
      await walk('town'); await check('muster-at-town'); await click('#interact'); await click('#ask-town'); await click('#close-dialog');
      await walk('boundary'); await shot('27-muster-boundary'); await click('#interact'); await click('#finish-muster'); await phase('muster-complete');
      await click('#continue-green'); await phase('green'); await shot('13-green-spots');
      await walkGreen('edge'); await check('green-at-edge'); await walkGreen('corner'); await check('green-at-corner'); await click('#interact'); await phase('green-event');
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
    const problems = Object.fromEntries(Object.entries(audits).map(([k, a]) => [k, Object.fromEntries(Object.entries(a).filter(([, v]) => v.length))]).filter(([, a]) => Object.keys(a).length));
    reports.push({ size, failure, errors, external, problems, shots: Object.keys(audits).length });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outdir, 'ui-audit.json'), JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports, null, 2));
if (reports.some(r => r.failure || r.errors.length || r.external.length || Object.keys(r.problems).length)) process.exitCode = 1;
