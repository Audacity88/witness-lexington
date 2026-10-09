// Real UI playthrough. Uses the existing test/package.json dependency; no install step.
// node test/green-essay.mjs http://127.0.0.1:8765/index.html /tmp/wl-s3-shots
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [,, url, outdir = '/tmp/wl-s4-shots'] = process.argv;
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
  for (const [width, height, order, spot, scheme] of [[1280, 720, ['near', 'far'], 'corner', 'light'], [960, 540, ['near', 'far'], 'corner', 'dark'], [662, 418, ['far', 'near'], 'edge', 'dark']]) {
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
    await page.setViewport({ width, height }); await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:scheme}]);
    const snapshot = () => page.evaluate(() => WitnessGame.snapshot());
    const click = async selector => { await page.waitForSelector(selector, { visible: true }); await page.click(selector); };
    const phase = async p => page.waitForFunction(p => WitnessGame.snapshot().run.phase === p, { timeout: 45000 }, p);
    const check = (name, value) => { assert.ok(value, name); checks.push(name); };
    const visibleAction = async selector => page.$eval(selector, e => { const r=e.getBoundingClientRect(); return r.height>=44 && r.width>=44 && r.top>=0 && r.bottom<=innerHeight && r.left>=0 && r.right<=innerWidth; });
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
      await click('#travel-' + id);
      await page.waitForFunction(id => {
        const s = WL_DAWN.stops.find(s => s.id === id), d = WitnessGame.snapshot();
        return Math.hypot(d.run.dawn.x - s.x, d.run.dawn.z - s.z) < 0.13 && !d.assisted;
      }, { timeout: 30000 }, id);
      check('Muster interaction visible '+id,await visibleAction('#interact'));
      await shot('muster-'+id); await click('#interact');
    }
    async function walkGreen(id) {
      await click('#travel-' + id);
      await page.waitForFunction(id => {
        const stop = WL_GREEN.stops.find(s => s.id === id), s = WitnessGame.snapshot();
        return Math.hypot(s.run.green.x - stop.x, s.run.green.z - stop.z) < 0.13 && !s.assisted;
      }, { timeout: 30000 }, id);
      await click('#interact');
    }
    async function typeAnswer(text, selector = '#essay-text') {
      await click(selector);
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.down(modifier); await page.keyboard.press('A'); await page.keyboard.up(modifier); await page.keyboard.press('Backspace');
      await page.keyboard.type(text, {delay:60});
    }
    let failure = null;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.removeItem('witness-lexington-s1-v1'));
      await page.reload({ waitUntil: 'load' });
      await click('#begin'); await click('#skip'); await click('#rewind'); await click('#start-ride');
      await click('#interact'); await click('#ask-source'); await click('#accept');
      for (const id of ['lantern', 'orchard']) { await travel(id, id === 'lantern' ? 28 : 10); await click('#record-alarm'); }
      await travel('parsonage', 44); await click('#continue-dawn'); await click('#start-muster');
      check('Talk with Parker visible',await visibleAction('#interact'));await shot('muster-start');
      await click('#interact'); await click('#accept-message');
      for (const id of order) { await walkTo(id); await click('#record-listening'); }
      await walkTo('militia'); await click('#deliver-message'); await click('#ask-militia'); await click('#close-dialog');
      await walkTo('town'); await click('#ask-town'); await click('#close-dialog');
      await walkTo('boundary'); await click('#finish-muster'); await phase('muster-complete');
      const migration = await page.evaluateOnNewDocument(() => {
        const key='witness-lexington-s1-v1', s=JSON.parse(localStorage.getItem(key));
        if(s?.run?.phase==='muster-complete'){delete s.run.green;localStorage.setItem(key,JSON.stringify(s));window.wlS2Fixture=true;}
      });
      await page.reload({ waitUntil: 'load' }); await page.removeScriptToEvaluateOnNewDocument(migration.identifier);
      check('Prior S2 fixture applied before app startup', await page.evaluate(() => window.wlS2Fixture === true));
      await click('#load'); check('S2 migration retains notes', (await snapshot()).run.dawn.boundary && (await snapshot()).run.visited.length===2);
      await click('#continue-green'); await phase('green'); await shot('green');
      await click('#travel-'+spot); await click('#pause'); const paused=(await snapshot()).run.green;
      await new Promise(r=>setTimeout(r,200));check('Green pause freezes movement',JSON.stringify((await snapshot()).run.green)===JSON.stringify(paused));
      await click('#resume'); await click('#travel-'+spot); await click('#notebook'); const noted=(await snapshot()).run.green;
      await new Promise(r=>setTimeout(r,200));check('Notebook freezes and cancels travel',JSON.stringify((await snapshot()).run.green)===JSON.stringify(noted)&&!(await snapshot()).assisted);await click('#close-dialog');
      await walkGreen(spot); await phase('green-event');
      await page.waitForFunction(()=>WitnessGame.snapshot().elapsed>=4);await shot('approach');
      await page.waitForFunction(()=>WitnessGame.snapshot().elapsed>=7 && WitnessGame.snapshot().elapsed<10);await shot('pivot-obstructed');
      await click('#pause');const time=(await snapshot()).elapsed;await new Promise(r=>setTimeout(r,200));check('Pivot clock pauses', (await snapshot()).elapsed===time);await click('#resume');
      await reloadAndResume();await phase('green-event');check('Interrupted observation restarts', (await snapshot()).elapsed<2 && !(await snapshot()).run.green.observed);
      await page.waitForSelector('#to-shelter',{visible:true,timeout:45000});await shot('aftermath');await click('#to-shelter');await walkGreen('shelter');await shot('shelter');
      await reloadAndResume();await phase('shelter');check('Shelter resume offers study',await page.$('#enter-study')!==null);await click('#enter-study');await phase('study');
      check('Ranking gated before all cards',await page.$('#rank-0')===null);
      const ids=await page.evaluate(()=>WG_DATA.cards.map(c=>c.id));
      for(const id of ids){
        await page.select('#document',id);
        check('Card cited '+id,await page.$eval('.card',e=>e.textContent.includes('Citation and passage')&&e.textContent.includes('[')));
        if(['revere1775','revere1798','barker','depositions','doolittle','numbers'].includes(id))await shot('document-'+id);
        if(id==='barker')check('Barker one or two shots',await page.$eval('.card',e=>e.textContent.includes('one or two shots')));
        if(id==='doolittle')check('Artist framing',await page.$eval('.card',e=>e.textContent.includes('artist pictured')));
        check('Citation hit target '+id,await page.$eval('.card a',e=>e.getBoundingClientRect().height>=44));
        check('Study action pinned '+id,await visibleAction('#inspect'));await click('#inspect');
      }
      await page.select('#rank-0','barker');await page.select('#rank-1','barker');check('Duplicate rank blocked',await page.$eval('#choose-belief',e=>e.disabled));
      await page.select('#rank-1','revere1775');await click('#limitation');await page.keyboard.type('The diary gives one observer’s account and cannot establish every possible view.');
      await click('#choose-belief');await click('#belief-unsure');await phase('hypothesis');
      check('Hypothesis action pinned',await visibleAction('#check-hypothesis'));await click('#check-hypothesis');check('Militia preset accepted',await page.$eval('#hypothesis-result',e=>e.textContent.includes('Fits the inherited')));
      await page.select('#account','british');await click('#check-hypothesis');check('British preset accepted',await page.$eval('#hypothesis-result',e=>e.textContent.includes('Fits the inherited')));
      check('Account tests preserve uncertain belief',(await snapshot()).run.green.belief==='unsure');
      for(const value of ['stopped','even']){await page.select('#aftermath',value);await click('#check-hypothesis');check('Fact rejection '+value,await page.$eval('#hypothesis-result',e=>e.textContent.includes('Contradicts the inherited')));check('No essay action after rejection '+value,await page.$('#write-essay')===null);check('Contradictions named '+value,await page.$eval('#hypothesis-result',e=>e.textContent.includes('[OUTCOME]')&&!e.textContent.includes('Current document:')));await shot('rejected-'+value);}
      await page.select('#aftermath','fewshots');await click('#check-hypothesis');await click('#write-essay');await phase('essay');
      // Starting outside the overlay, Tab must reach the textarea, then wrap all controls.
      await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press('Tab');check('Keyboard reaches essay',await page.evaluate(()=>document.activeElement.id==='essay-text'));
      await page.keyboard.press('Shift+Tab');check('Reverse Tab wraps',await page.evaluate(()=>document.activeElement.id==='essay-notebook'));await page.keyboard.press('Tab');
      await typeAnswer('I believe the regulars fired first.');await click('#check-essay');check('Short unsupported essay fails',await page.$('#finish-investigation')===null);await shot('essay-failed');
      const blocked=await page.$eval('#essay-text',ta=>{
        const before=ta.value;const events=[new Event('paste',{bubbles:true,cancelable:true}),new Event('drop',{bubbles:true,cancelable:true}),new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertFromPaste',data:'Outside words'})];
        return events.every(e=>!ta.dispatchEvent(e))&&ta.value===before;
      });check('Paste/drop/beforeinput blocked',blocked);
      const draft=(await snapshot()).run.green.essay;await click('#essay-documents');
      await typeAnswer('', '#limitation');check('Cleared limitation disables essay return',await page.$eval('#return-essay',e=>e.disabled));
      await reloadAndResume();await phase('study');check('Incomplete ranking resumes with draft and dawn intact',(await snapshot()).run.green.essay===draft&&(await snapshot()).run.dawn.boundary);
      await typeAnswer('Too short', '#limitation');check('Short limitation keeps return disabled',await page.$eval('#return-essay',e=>e.disabled));
      await typeAnswer('The diary gives only one observer’s view.', '#limitation');
      await page.select('#rank-1','barker');check('Duplicate ranks disable essay return',await page.$eval('#return-essay',e=>e.disabled));
      await reloadAndResume();await phase('study');check('Invalid pair still resumes study with draft',(await snapshot()).run.green.essay===draft);
      await page.select('#rank-0','barker');await page.select('#rank-1','revere1775');check('Repaired ranking enables return',await page.$eval('#return-essay',e=>!e.disabled));
      await page.select('#document','revere1798');await click('#return-essay');check('Draft retained after document visit',await page.$eval('#essay-text',e=>e.value)===draft);
      await reloadAndResume();await phase('essay');check('Draft and telemetry survive refresh',(await snapshot()).run.green.essay===draft&&(await snapshot()).run.green.tel.dropAttempts===1);
      const answers=[
        'I think the regulars fired first. Parker said he ordered the militia to disperse and not to fire. Barker says the militia fired one or two shots first. However, Barker was on his own side and might have misunderstood the order. I would compare what each observer could see before choosing. These conflicting accounts do not identify a trigger puller with certainty, so my conclusion remains a belief.',
        'I think the regulars fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first. His diary is an opposing account, and I think his blame might reflect his own side. The documents disagree, so I cannot identify an individual from smoke alone. I would need more evidence to be certain.',
        'I think the militia fired first. Barker describes one or two shots first in his diary. The militia depositions say the regulars fired first, however their own side might have reasons to deny starting the firing. Revere had a house blocking his view, so his observation cannot tell us everything. I think the British account is more likely, but I would still compare dates and positions before making a stronger claim.',
        'I cannot tell who fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first, while the militia depositions blame the regulars. These accounts disagree and I cannot tell which report captures the first trigger pull. The later letter comes from the same witness. Hearing and smoke could support a possibility without proving a person fired.'
      ];
      await click('#retype-essay');
      await typeAnswer('Barker diary Parker disperse 400 however British account depositions. '.repeat(8));await click('#check-essay');
      check('Keyword stuffing blocked',await page.$('#finish-investigation')===null);await shot('essay-stuffing');
      await page.$eval('#essay-text',ta=>{ta.value='I think the regulars fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first. His diary is an opposing account, and I think his blame might reflect his own side. The documents disagree, so I cannot identify an individual from smoke alone. I would need more evidence to be certain.';ta.dispatchEvent(new Event('input',{bubbles:true}));});
      await click('#check-essay');check('Insertion after typing blocked',await page.$('#finish-investigation')===null);
      check('Per-field ratio and persisted flags',(await snapshot()).run.green.result.authorship.flags.includes('low keystroke ratio'));await shot('essay-insert-blocked');
      await reloadAndResume();await click('#check-essay');check('Flags survive reload',await page.$('#finish-investigation')===null);
      await click('#retype-essay');
      // Synchronous keyed insertion avoids remote-browser command latency diluting the burst reproduction.
      await page.$eval('#essay-text',(ta,text)=>{ta.focus();for(const ch of text){ta.dispatchEvent(new KeyboardEvent('keydown',{key:ch,bubbles:true}));ta.value+=ch;ta.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:ch}));}},answers[0]);
      await click('#check-essay');
      check('Burst blocks Finish',(await snapshot()).run.green.result.authorship.flags.includes('typing burst')&&await page.$('#finish-investigation')===null);await shot('essay-burst');
      for(let i=0;i<answers.length;i++){await click('#retype-essay');await typeAnswer(answers[i]);await click('#check-essay');check('Content pass '+i,await page.$('#finish-investigation')!==null);check('Finish pinned '+i,await visibleAction('#finish-investigation'));await shot('essay-passed-'+i);}
      await click('#finish-investigation');await phase('finished');await shot('finished');await reloadAndResume();await phase('finished');
      await click('#end-notebook');check('Notebook source hit target',await page.$eval('dialog a',e=>e.getBoundingClientRect().height>=44));await shot('notebook');check('Notebook retains all slices and separates documents',await page.$eval('dialog',e=>e.textContent.includes('rode back')&&e.textContent.includes('Green observations')&&e.textContent.includes('Inspected historical sources')));await click('#close-dialog');
      await click('#restart');await click('#confirm-restart');await phase('intro');check('Restart clears saved run',await page.evaluate(()=>localStorage.getItem('witness-lexington-s1-v1')===null));
      check('No horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('No console or asset errors',errors.length===0);check('No external requests',external.length===0);
    } catch(e) {failure=e.message;await shot('failure');}
    reports.push({width,height,spot,order,checks,errors,external,failure});
    fs.writeFileSync(path.join(outdir,'results.json'),JSON.stringify(reports,null,2));await page.close();
  }
} finally {await browser.close();}
console.log(JSON.stringify(reports.map(({width,height,spot,checks,failure,errors})=>({width,height,spot,checks:checks.length,failure,errors})),null,2));
if(reports.some(r=>r.failure||r.errors.length||r.external.length))process.exitCode=1;
