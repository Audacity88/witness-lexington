// Headless test driver: node run.mjs <url> <w> <h> <light|dark> <outdir> <steps.json>
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const [,, url, w, h, scheme, outdir, stepsFile] = process.argv;
const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
fs.mkdirSync(outdir, { recursive: true });
const errors = [], net = [], results = [];
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
page.on('console', m => { if (['error', 'warn', 'warning', 'assert'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('request', r => { const u = r.url(); if (!u.startsWith(new URL(url).origin) && !u.startsWith('data:') && !u.startsWith('blob:')) net.push(u); });
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() || {}).errorText));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.WitnessGame && window.WitnessGame.state', { timeout: 30000 });
await page.evaluate('WitnessGame.pause(true)');
for (const s of steps) {
  let st;
  try {
    if (s.js) st = await page.evaluate(s.js);
    if (s.click) await page.click(s.click);
    if (s.type) { await page.focus(s.type.sel); await page.keyboard.type(s.type.text, { delay: s.type.delay || 0 }); }
    if (s.after) st = await page.evaluate(s.after);
  } catch (e) { errors.push('step ' + s.name + ': ' + e.message); continue; }
  await new Promise(r => setTimeout(r, s.wait || 250));
  if (s.scroll) await page.evaluate(s.scroll);
  if (s.shot) await page.screenshot({ path: `${outdir}/${s.shot}.png` });
  if (s.eval) { try { st = await page.evaluate(s.eval); } catch (e) { errors.push('eval ' + s.name + ': ' + e.message); } }
  if (s.expect) { let ok = false; try { ok = await page.evaluate(s.expect); } catch (e) {} if (!ok) errors.push('EXPECT FAILED ' + s.name + ': ' + s.expect); }
  results.push({ name: s.name, state: st });
}
fs.writeFileSync(`${outdir}/results-${w}x${h}-${scheme}.json`, JSON.stringify({ url, w, h, scheme, errors, net, results }, null, 1));
console.log(JSON.stringify({ size: `${w}x${h}`, scheme, errors: errors.length, net: net.length, steps: results.length }));
if (errors.length) console.log(errors.slice(0, 20).join('\n'));
if (net.length) console.log('NET:', net.join(' '));
await browser.close();
