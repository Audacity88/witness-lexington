// Focused browser regression; uses the existing puppeteer-core dependency.
// node test/wl-polish.mjs http://127.0.0.1:8765/
// Serve this repo locally; all non-loopback requests are blocked. One Chrome instance.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = new URL(process.argv[2]);
if (!['127.0.0.1','localhost','[::1]'].includes(base.hostname)) throw Error('Supply a loopback repo URL');
const executablePath = process.env.CHROME_BIN || [
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(p=>fs.existsSync(p));
if (!executablePath) throw Error('No installed Chrome found');
const browser = await puppeteer.launch({executablePath,headless:true,timeout:10000,args:[
  '--no-sandbox','--disable-background-networking','--disable-component-update','--disable-sync',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
const errors=[],results=[];
try {
  const page=await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',r=>{
    if(r.url().startsWith(base.origin+'/')||/^(data|blob):/.test(r.url()))void r.continue();
    else {errors.push('External request blocked');void r.abort();}
  });
  async function audit() {
    const report=await page.evaluate(async()=>{
      await document.fonts.ready;
      const host=document.getElementById('witness-game');
      const controls=[...document.querySelectorAll('.top button, .panel > p, .panel button')].filter(e=>!e.closest('[hidden]'));
      const checked=controls.map(e=>{
        e.scrollIntoView({block:'center',inline:'nearest'});
        const r=e.getBoundingClientRect();
        let ok=r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;
        for(let a=e.parentElement;a;a=a.parentElement){
          const s=getComputedStyle(a),b=a.getBoundingClientRect();
          if(/hidden|auto|scroll|clip/.test(s.overflowY))ok=ok&&r.top>=b.top+a.clientTop-1&&r.bottom<=b.top+a.clientTop+a.clientHeight+1;
          if(/hidden|auto|scroll|clip/.test(s.overflowX))ok=ok&&r.left>=b.left+a.clientLeft-1&&r.right<=b.left+a.clientLeft+a.clientWidth+1;
        }
        const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        ok=ok&&(hit===e||e.contains(hit));
        return {name:e.id||'objective',ok,box:[r.x,r.y,r.width,r.height]};
      });
      return {checked,scroll:host.scrollHeight>host.clientHeight,horizontal:host.scrollWidth>host.clientWidth};
    });
    assert.deepEqual(report.checked.filter(c=>!c.ok),[],JSON.stringify(report));
    assert(!report.horizontal,'No horizontal clipping');
    for(const id of ['notebook','pause','music','objective'])assert(report.checked.some(c=>c.name===id),id+' checked');
    return report;
  }
  for(const entry of ['index.html','dist/witness-game.html','dist/witness-game-inline.html']) {
    await page.setViewport({width:320,height:240});
    await page.goto(new URL(entry,base).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.WitnessGame);
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const paused=()=>page.evaluate(()=>WitnessGame.snapshot().paused);
    await click('begin');await audit();
    await page.focus('#skip');await page.keyboard.press('Tab');
    assert.equal(await paused(),false,'Tab past Skip must not pause');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    assert.equal(await paused(),false,'Visible blur must not pause');
    await click('skip');await click('rewind');await click('start-ride');
    const tiny=await audit();assert(tiny.scroll,'Tiny HUD has a vertical scroll extent');
    for(const id of ['interact','travel-parsonage','travel-lantern','travel-orchard'])assert(tiny.checked.some(c=>c.name===id),id+' checked');
    await page.focus('#travel-parsonage');await page.keyboard.press('Tab');
    assert.equal(await paused(),false,'Tab past final enabled gameplay control must not pause');
    if(entry==='index.html'){
      fs.mkdirSync('artifacts',{recursive:true});
      await page.screenshot({path:'artifacts/wl-polish-320x240.png'});
    }
    await page.setViewport({width:1280,height:800});await audit();
    for(const [width,height] of [[100,100],[1,1],[2000,200],[200,2000]]){
      await page.setViewport({width,height});
      assert(await page.evaluate(()=>document.querySelector('canvas').width>0&&document.querySelector('canvas').height>0));
    }
    // Trigger a genuine visibilitychange in this same Chrome instance.
    const cover=await browser.newPage();
    try {
      await cover.bringToFront();await page.waitForFunction(()=>document.hidden&&WitnessGame.snapshot().paused);
    } finally {await cover.close();await page.bringToFront();}
    assert.equal(await paused(),true,'Return waits for explicit Resume');
    results.push({entry,controls:tiny.checked.length});
  }
  assert.deepEqual(errors,[],'No page errors or external requests');
  console.log(JSON.stringify({kind:'320x240 reachability, Tab-out, hidden pause, resize matrix',results,screenshot:'artifacts/wl-polish-320x240.png'}));
} finally {await browser.close();}
