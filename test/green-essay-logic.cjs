/* Integration checks with DOM/renderer stubs; no browser or visual acceptance. */
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
const ROOT = require('node:path').resolve(__dirname, '..') + '/';
class Element {
 constructor(tag, doc) { this.tagName=tag.toUpperCase(); this.doc=doc; this.children=[]; this.events={}; this._text=''; this.hidden=false; this.disabled=false; this.open=false; this.clientWidth=960; this.clientHeight=540; this.classList={add(){},toggle(){}}; }
 set textContent(t){ this._text=t; this.children=[]; } get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 append(...nodes){nodes.forEach(n=>{n.remove();n.parent=this;this.children.push(n)});}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}} appendChild(n){this.append(n);return n;}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 scrollIntoView(options){this.scrolled=options;}
 setAttribute(k,v){this[k]=v;} addEventListener(k,fn){(this.events[k]??=[]).push(fn);} dispatch(k,e={}){for(const fn of this.events[k]||[]) fn(e);}
 focus(){const old=this.doc.activeElement;if(old!==this){old?.dispatch('blur');this.doc.activeElement=this;this.dispatch('focus');}} get isConnected(){return true;} getClientRects(){return this.hidden?[]:[{}];} setPointerCapture(){}
 contains(n){return n===this||this.children.some(c=>c.contains(n));}
 querySelectorAll(tag){if(tag.includes(','))return this.children.flatMap(c=>[...(tag.split(', ').some(q=>q==='a[href]'?c.tagName==='A'&&c.href:c.tagName===q.toUpperCase())?[c]:[]),...c.querySelectorAll(tag)]);const matches=n=>tag[0]==='#'?n.id===tag.slice(1):tag[0]==='.'?n.className===tag.slice(1):n.tagName===tag.toUpperCase();return this.children.flatMap(c=>[...(matches(c)?[c]:[]),...c.querySelectorAll(tag)]);}
 querySelector(tag){return this.querySelectorAll(tag)[0]||null;}
 showModal(){this.open=true;} close(){this.open=false;this.dispatch('close');}
}
function boot(storage={}){
 const doc={activeElement:null,events:{},addEventListener(k,fn){(this.events[k]??=[]).push(fn)},createElement(tag){return new Element(tag,doc)}};
 const host=new Element('div',doc);doc.activeElement=host;doc.getElementById=id=>id==='witness-game'?host:walk(host).find(n=>n.id===id);
 const events={}, canvas=new Element('canvas',doc);host.append(canvas);let callback,now=0,cutPoses=0;
 const night={scene:{},horse:{position:{set(){}},rotation:{}},legs:Array.from({length:4},()=>({rotation:{}})),rings:Array.from({length:3},()=>({material:{color:{set(){}}}}))};
 const ctx={document:doc,console,performance:{now:()=>now},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},
 requestAnimationFrame:fn=>callback=fn,clearInterval(){},ResizeObserver:class{observe(){}},THREE:{},addEventListener:(k,fn)=>(events[k]??=[]).push(fn),WGWorld:{create:()=>({canvas,cam:{position:{set(){}},lookAt(){},updateProjectionMatrix(){}},renderer:{setSize(){},render(){}},makeNight:()=>night,makeLex:()=>({scene:{},regs:[],horse:{},poseCutscene(){cutPoses++}}),makeDawn:()=>({scene:{},group:{},rings:[],pose(){}}),makeGreen:()=>({group:{},pose(){}})})}};
 ctx.window=ctx;vm.createContext(ctx);for(const file of ['data/night-ride.js','data/dawn-muster.js','data/evidence.js','data/essay-rules.js','data/green.js','src/evidence-check.js','src/green-essay.js','src/music.js','src/night-ride.js']){
  if(file==='src/night-ride.js'){const createMusic=ctx.WL_MUSIC;ctx.WL_MUSIC=changed=>{ctx.music=createMusic(changed);return ctx.music;};}
  vm.runInContext(fs.readFileSync(ROOT+file,'utf8'),ctx,{filename:file});
 }
 function frame(ms=50){now+=ms;const cb=callback;callback=null;cb(now);}
 function frames(n,ms=50){for(let i=0;i<n;i++)frame(ms);}
 function click(id){const n=doc.getElementById(id);assert(n,'exists '+id);assert(!n.disabled,'enabled '+id);n.focus();n.dispatch('click');}
 function key(k,extra={}){for(const fn of events.keydown||[])fn({key:k,target:doc.activeElement,preventDefault(){},...extra});}
 function release(k){for(const fn of events.keyup||[])fn({key:k});}
 function snap(){return ctx.WitnessGame.snapshot();}
 function travel(id,z){click('travel-'+id);let n=0;while(snap().assisted&&n++<800)frame(1000/21);assert(n<800,'assisted arrival');assert(Math.abs(snap().run.z-z)<0.01);click('interact');}
 function walkTo(id) { const s=ctx.WL_DAWN.stops.find(s=>s.id===id);click('travel-'+id);let n=0;while(snap().assisted&&n++<800)frame(1000/21);assert(n<800);assert(Math.hypot(snap().run.dawn.x-s.x,snap().run.dawn.z-s.z)<0.01);click('interact'); }
 return {events,storage,doc,host,click,key,release,snap,frames,frame,travel,walkTo,ctx};
}
function walk(n){return [n,...n.children.flatMap(walk)];}
const checks=[];function check(name,fn){fn();checks.push(name);}
const KEY='witness-lexington-s1-v1';
check('Game Pause forwards audio pause without changing the music label',()=>{
 const game=boot();game.click('begin');game.click('skip');game.click('rewind');game.click('start-ride');game.click('pause');
 assert(game.snap().paused);assert(game.ctx.music.status().paused);assert(!game.ctx.music.status().muted);
 assert.equal(game.doc.getElementById('music').textContent,'Mute music');
 game.click('resume');assert(!game.ctx.music.status().paused);
});
check('Game Resume preserves a muted preference',()=>{
 const game=boot();game.click('begin');game.click('skip');game.click('rewind');game.click('start-ride');game.click('pause');game.doc.getElementById('music').dispatch('click');game.click('resume');
 assert(!game.snap().paused);assert(!game.ctx.music.status().paused);assert(game.ctx.music.status().muted);
 assert.equal(game.doc.getElementById('music').textContent,'Play music');
});
function alarm(g) { g.click('begin');g.click('skip');g.click('rewind');g.click('start-ride');g.click('interact');g.click('ask-source');g.click('accept');for(const id of ['lantern','orchard']){g.travel(id,id==='lantern'?28:10);g.click('record-alarm');}g.travel('parsonage',44); }
function muster(g) {g.click('continue-dawn');g.click('start-muster');g.click('interact');g.click('accept-message');for(const id of ['near','far']){g.walkTo(id);g.click('record-listening');}g.walkTo('militia');g.click('deliver-message');g.click('ask-militia');g.click('close-dialog');g.walkTo('town');g.click('ask-town');g.click('close-dialog');g.walkTo('boundary');g.click('finish-muster');}
function walkGreen(g,id) { g.click('travel-'+id);let n=0;while(g.snap().assisted&&n++<800)g.frame();assert(n<800);g.click('interact'); }
function select(g,id,value){const n=g.doc.getElementById(id);assert(n,id);n.value=value;n.dispatch('change');}
function type(g,id,text){const n=g.doc.getElementById(id);assert(n,id);n.focus();for(const ch of text){n.dispatch('keydown',{key:ch});g.key(ch);n.value=(n.value||'')+ch;n.dispatch('input');g.frame(90);}}
function reload(g){const h=boot(g.storage);h.click('load');h.frame();return h;}
const endings=[
 'I think the regulars fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first. His diary is an opposing account, and I think his blame might reflect his own side. The documents disagree, so I cannot identify an individual from smoke alone. I would need more evidence to be certain.',
 'I think the militia fired first. Barker describes one or two shots first in his diary. The militia depositions say the regulars fired first, however their own side might have reasons to deny starting the firing. Revere had a house blocking his view, so his observation cannot tell us everything. I think the British account is more likely, but I would still compare dates and positions before making a stronger claim.',
 'I cannot tell who fired first. Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first, while the militia depositions blame the regulars. These accounts disagree and I cannot tell which report captures the first trigger pull. The later letter comes from the same witness. Hearing and smoke could support a possibility without proving a person fired.'
];
for(const spot of ['corner','edge']) {
 let g=boot();alarm(g);muster(g);
 check('S2 checkpoint migration retains alarm/dawn '+spot,()=>{const s=JSON.parse(g.storage[KEY]);delete s.run.green;g.storage[KEY]=JSON.stringify(s);g=reload(g);assert.equal(g.snap().run.visited.length,2);assert(g.snap().run.dawn.boundary);});
 g.click('continue-green');g.frame();
 check('Green early interaction disabled '+spot,()=>assert(g.doc.getElementById('interact').disabled));
 check('Green keyboard bounds '+spot,()=>{g.key('a');g.frames(20);g.release('a');assert.equal(g.snap().run.green.x,0);g.key('w');g.frames(200);g.release('w');assert.equal(g.snap().run.green.z,-20);});
 g.click('travel-'+spot);g.frames(10);g.click('notebook');let before=JSON.stringify(g.snap().run.green);g.frames(20);
 check('Notebook freezes Green travel '+spot,()=>{assert.equal(JSON.stringify(g.snap().run.green),before);assert(!g.snap().assisted);});g.click('close-dialog');
 walkGreen(g,spot);assert.equal(g.snap().run.phase,'green-event');g.frames(145);
 check('Pause freezes pivot '+spot,()=>{g.click('pause');const t=g.snap().elapsed;g.frames(40);assert.equal(g.snap().elapsed,t);g.click('resume');});
 check('Interrupted event restarts honest observation '+spot,()=>{g=reload(g);assert.equal(g.snap().run.phase,'green-event');assert(!g.snap().run.green.observed);assert(g.snap().elapsed<0.1);});
 check('Green clock stays real-time below 20 fps '+spot,()=>{const t=g.snap().elapsed;g.frames(5,200);assert(Math.abs(g.snap().elapsed-t-1)<1e-9);});
 g.frames(320);g.click('to-shelter');walkGreen(g,'shelter');
 check('Shelter checkpoint survives refresh '+spot,()=>{g=reload(g);assert.equal(g.snap().run.phase,'shelter');assert(g.doc.getElementById('enter-study'));assert(g.snap().run.green.sheltered);});
 g.click('shelter-notebook');check('Notebook separates Green from sources '+spot,()=>assert(g.host.querySelector('dialog').textContent.includes('not primary testimony')));g.click('close-dialog');g.click('enter-study');
 check('Ranking unavailable until all sources inspected '+spot,()=>assert(!g.doc.getElementById('rank-0')));
 check('Music control survives document changes and notebook modal '+spot,()=>{
   g.click('next-document');assert(g.host.querySelector('.card-actions').contains(g.doc.getElementById('music')));
   g.click('study-notebook');assert(g.host.querySelector('dialog').contains(g.doc.getElementById('music')));
   g.doc.getElementById('music').dispatch('click');assert.equal(g.doc.getElementById('music').textContent,'Play music');assert.equal(g.doc.getElementById('music')['aria-pressed'],'true');
   g.doc.getElementById('music').dispatch('click');assert.equal(g.doc.getElementById('music').textContent,'Mute music');assert.equal(g.doc.getElementById('music')['aria-pressed'],'false');
   g.click('close-dialog');assert(g.host.querySelector('.card-actions').contains(g.doc.getElementById('music')));
 });
 for(const c of g.ctx.WG_DATA.cards){select(g,'document',c.id);if(c.id==='revere1775')assert(g.host.querySelector('.card').textContent.includes('Document paraphrase: Revere says'));g.click('inspect');assert(g.doc.getElementById('inspect').disabled);assert(g.host.querySelector('.card-actions').contains(g.doc.getElementById('music')));}
 check('Both accounts and Doolittle framing inspected '+spot,()=>{assert.equal(g.snap().run.green.inspected.length,9);select(g,'document','doolittle');assert(g.host.textContent.includes('artist pictured'));});
 select(g,'rank-0','barker');select(g,'rank-1','barker');
 check('Duplicate ranking cannot continue '+spot,()=>assert(g.doc.getElementById('choose-belief').disabled));
 select(g,'rank-1','revere1775');type(g,'limitation','The diary is only one observer’s account.');g.click('choose-belief');g.click('belief-unsure');
 g.click('check-hypothesis');check('Hypothesis result receives focus and scroll '+spot,()=>{const r=g.doc.getElementById('hypothesis-result');assert.equal(g.doc.activeElement,r);assert.equal(r.scrolled.block,'start');});check('Militia account preset accepted '+spot,()=>{assert(g.host.querySelector('#hypothesis-result').textContent.includes('Fits the inherited'));assert(g.snap().run.green.belief==='unsure');});
 select(g,'account','british');g.click('check-hypothesis');check('British preset also accepted '+spot,()=>assert(g.host.querySelector('#hypothesis-result').textContent.includes('Fits the inherited')));
 for(const a of ['stopped','even']){select(g,'aftermath',a);g.click('check-hypothesis');check('Hard facts reject '+a+' '+spot,()=>{assert(g.host.querySelector('#hypothesis-result').textContent.includes('Contradicts the inherited'));assert(!g.doc.getElementById('write-essay'));assert(g.host.querySelector('#hypothesis-result').textContent.includes('[OUTCOME]'));assert(g.host.querySelector('#hypothesis-result').textContent.includes('Paul Revere'));});}
 select(g,'aftermath','fewshots');g.click('check-hypothesis');g.click('write-essay');
 check('Overlay Tab includes essay text and wraps form controls '+spot,()=>{g.doc.activeElement=g.host;g.key('Tab');assert.equal(g.doc.activeElement.id,'essay-text');g.key('Tab',{shiftKey:true});assert.equal(g.doc.activeElement.id,'essay-notebook');g.key('Tab');assert.equal(g.doc.activeElement.id,'essay-text');});
 type(g,'essay-text','I believe the regulars fired first.');g.click('check-essay');check('Short unsupported answer fails '+spot,()=>assert(!g.doc.getElementById('finish-investigation')));
 check('Paste, drop, beforeinput blocked '+spot,()=>{const n=g.doc.getElementById('essay-text');for(const kind of ['paste','drop']){let stopped=false;n.dispatch(kind,{preventDefault(){stopped=true;}});assert(stopped);}let stopped=false;n.dispatch('beforeinput',{inputType:'insertFromPaste',preventDefault(){stopped=true;}});assert(stopped);assert.equal(g.snap().run.green.tel.pasteAttempts,2);assert.equal(g.snap().run.green.tel.dropAttempts,1);});
 check('Page exit flushes focused time '+spot,()=>{const ta=g.doc.getElementById('essay-text');ta.focus();g.frames(20);g.events.pagehide.forEach(fn=>fn());assert(JSON.parse(g.storage[KEY]).run.green.tel.msFocused>=1000);});
 const draft=g.snap().run.green.essay;g.click('essay-documents');
 check('Cleared limitation disables and guards essay return '+spot,()=>{
   const note=g.doc.getElementById('limitation');note.value='';note.dispatch('input');
   const back=g.doc.getElementById('return-essay');assert(back.disabled);
   back.disabled=false;back.dispatch('click');assert.equal(g.snap().run.phase,'study');
   assert(g.ctx.WL_SLICE.valid(g.snap().run.green,'study'));
 });
 check('Incomplete ranking reload retains draft and prior progress '+spot,()=>{
   g=reload(g);assert.equal(g.snap().run.phase,'study');assert(g.doc.getElementById('return-essay').disabled);
   assert.equal(g.snap().run.green.essay,draft);assert.equal(g.snap().run.visited.length,2);assert(g.snap().run.dawn.boundary);
 });
 check('Short limitation also blocks essay return '+spot,()=>{type(g,'limitation','Too short');assert(g.doc.getElementById('return-essay').disabled);});
 const note=g.doc.getElementById('limitation');note.value='';note.dispatch('input');type(g,'limitation','The diary gives only one observer’s view.');
 check('Duplicate or cleared source selection blocks essay return '+spot,()=>{
   select(g,'rank-1','barker');assert(g.doc.getElementById('return-essay').disabled);
   select(g,'rank-1','');assert(g.doc.getElementById('return-essay').disabled);
   g=reload(g);assert.equal(g.snap().run.phase,'study');assert.equal(g.snap().run.green.essay,draft);
 });
 check('Repairing ranking re-enables valid essay resume '+spot,()=>{
   select(g,'rank-0','barker');select(g,'rank-1','revere1775');assert(!g.doc.getElementById('return-essay').disabled);
   select(g,'document','revere1798');g.click('return-essay');assert(g.ctx.WL_SLICE.valid(g.snap().run.green,'essay'));
 });
 check('Document visit and typing shortcuts preserve draft '+spot,()=>{assert.equal(g.doc.getElementById('essay-text').value,draft);assert.equal(g.snap().run.phase,'essay');});
 g=reload(g);check('Essay refresh retains draft and counters '+spot,()=>{assert.equal(g.doc.getElementById('essay-text').value,draft);assert(g.snap().run.green.tel.keystrokes>0);assert.equal(g.snap().run.green.tel.dropAttempts,1);});
 check('Insertion after earlier typing is blocked and persisted '+spot,()=>{
   const ta=g.doc.getElementById('essay-text');ta.focus();ta.value=endings[0];ta.dispatch('input');g.click('check-essay');
   assert(!g.doc.getElementById('finish-investigation'));
   assert(g.snap().run.green.result.authorship.flags.includes('text inserted without matching keystrokes'));
   assert(g.snap().run.green.result.authorship.flags.includes('low keystroke ratio'));
   g=reload(g);g.click('check-essay');assert(!g.doc.getElementById('finish-investigation'));
   assert(JSON.parse(g.storage[KEY]).run.green.result.authorship.flags.length);
 });
 check('Typing speed flag stays until Retype despite slow edits '+spot,()=>{
   g.click('retype-essay');const ta=g.doc.getElementById('essay-text');ta.focus();
   for(const ch of endings[0]){ta.dispatch('keydown',{key:ch});ta.value+=ch;ta.dispatch('input');g.frame(30);}
   g.click('check-essay');assert(g.snap().run.green.result.authorship.flags.includes('typing speed'));
   g.frame(2000);ta.focus();ta.dispatch('keydown',{key:' '});ta.value+=' ';ta.dispatch('input');
   g.frame(2000);ta.dispatch('keydown',{key:'Backspace'});ta.value=ta.value.slice(0,-1);ta.dispatch('input');
   g.click('check-essay');assert(!g.doc.getElementById('finish-investigation'));assert(g.snap().run.green.result.authorship.flags.includes('typing speed'));
   g=reload(g);g.click('check-essay');assert(g.snap().run.green.result.authorship.flags.includes('typing speed'));
 });
 check('Fast keyed essay in 0.4 seconds is blocked '+spot,()=>{
   g.click('retype-essay');const ta=g.doc.getElementById('essay-text');ta.focus();
   for(const ch of endings[0]){ta.dispatch('keydown',{key:ch});ta.value+=ch;ta.dispatch('input');g.frame(400/endings[0].length);}
   g.click('check-essay');assert(!g.doc.getElementById('finish-investigation'));
   assert(g.snap().run.green.result.authorship.flags.includes('typing speed'));
   assert(g.snap().run.green.result.authorship.flags.includes('typing burst'));
   const result=g.doc.getElementById('essay-result'), saved=JSON.parse(g.storage[KEY]).run.green.result.authorship;
   assert.equal(g.doc.activeElement,result);assert.equal(result.scrolled.block,'start');
   assert(result.children[0].textContent.startsWith('Finish is blocked.'));
   assert(!result.textContent.includes('words/minute'));assert(!result.textContent.includes('typing rate'));
   assert(saved.wordsPerMinute>300);
 });
 check('Trusted on-screen characters work without keydown '+spot,()=>{
   g.click('retype-essay');const ta=g.doc.getElementById('essay-text');ta.focus();
   for(const ch of endings[0]){ta.dispatch('beforeinput',{isTrusted:true,inputType:'insertText',data:ch});ta.value+=ch;ta.dispatch('input');g.frame(90);}
   g.click('check-essay');assert(g.doc.getElementById('finish-investigation'));assert.equal(g.snap().run.green.tel.keystrokes,0);
 });
 g.click('retype-essay');const n=g.doc.getElementById('essay-text');type(g,'essay-text',endings[spot==='corner'?0:2]);
 check('Typed essay deletion undo/redo preserves credit and Finish '+spot,()=>{
   const text=n.value, typed=g.snap().run.green.tel.typedChars;
   n.dispatch('keydown',{key:'Backspace'});n.value='';n.dispatch('input',{inputType:'deleteContentBackward',isTrusted:true});
   assert.equal(g.snap().run.green.tel.typedChars,0);const ms=g.snap().run.green.tel.typingMs;
   for(const inputType of ['historyUndo','historyRedo','historyUndo']){
     n.dispatch('keydown',{key:'z',metaKey:true});n.value=inputType==='historyRedo'?'':text;n.dispatch('input',{inputType,isTrusted:true});
     g.click('check-essay');assert.equal(!!g.doc.getElementById('finish-investigation'),inputType==='historyUndo');
     assert.equal(g.snap().run.green.tel.typedChars,inputType==='historyUndo'?typed:0);
     assert.equal(g.snap().run.green.tel.typingMs,ms);assert.equal(g.snap().run.green.result.authorship.flags.length,0);
   }
 });
 check('Grouped native history and new edit branches preserve credit '+spot,()=>{
   const text=n.value;n.focus();type(g,'essay-text',' Extra words');
   n.value=text;n.dispatch('input',{inputType:'historyUndo',isTrusted:true});g.click('check-essay');
   assert.equal(g.snap().run.green.tel.typedChars,text.length);assert(g.doc.getElementById('finish-investigation'));
   n.value=text+' Extra words';n.dispatch('input',{inputType:'historyRedo',isTrusted:true});
   assert.equal(g.snap().run.green.tel.typedChars,n.value.length);
   n.value=text;n.dispatch('input',{inputType:'historyUndo',isTrusted:true});type(g,'essay-text',' Revised words');
   n.value=text;n.dispatch('input',{inputType:'historyUndo',isTrusted:true});
   n.value=text+' Revised words';n.dispatch('input',{inputType:'historyRedo',isTrusted:true});
   g.click('check-essay');assert(g.doc.getElementById('finish-investigation'));assert.equal(g.snap().run.green.result.authorship.flags.length,0);
   n.value=text;n.dispatch('input',{inputType:'historyUndo',isTrusted:true});
 });
 check('Contradictory saved essay/finished checkpoints resume hypothesis revision '+spot,()=>{
   const saved=JSON.parse(g.storage[KEY]);
   for(const phase of ['essay','finished'])for(const legacy of [true,false]){
     const checkpoint=JSON.parse(JSON.stringify(saved)),run=checkpoint.run;run.phase=phase;run.green.hypothesis.version.aftermath='stopped';
     if(legacy){for(const k of ['typedChars','unkeyedChars','typingMs','burst','speedFlag'])delete run.green.tel[k];delete run.green.priorFlags;delete run.green.result;}
     const h=boot({[KEY]:JSON.stringify(checkpoint)});assert(h.doc.getElementById('load'));h.click('load');
     assert.equal(h.snap().run.phase,'hypothesis');assert.equal(h.snap().run.green.essay,run.green.essay);
     assert.equal(JSON.stringify(h.snap().run.visited),JSON.stringify(run.visited));assert.equal(JSON.stringify(h.snap().run.dawn),JSON.stringify(run.dawn));
     for(const k of ['rank','inspected','limitation','belief','hypothesis'])assert.equal(JSON.stringify(h.snap().run.green[k]),JSON.stringify(run.green[k]));
     h.click('check-hypothesis');assert(!h.doc.getElementById('write-essay'));
     select(h,'aftermath','fewshots');h.click('check-hypothesis');h.click('write-essay');
     assert.equal(h.doc.getElementById('essay-text').value,run.green.essay);
     const resumed=reload(h);assert.equal(resumed.snap().run.phase,'essay');assert.equal(resumed.snap().run.green.essay,run.green.essay);
   }
 });
 g.click('check-essay');g.click('finish-investigation');
 check('Completed save with newly rejected content resumes for revision '+spot,()=>{
   const s=JSON.parse(g.storage[KEY]);s.run.phase='finished';s.run.green.essay=fs.readFileSync(ROOT+'test/fixtures/keyword-salad.txt','utf8');
   const h=boot({[KEY]:JSON.stringify(s)});assert(h.doc.getElementById('load'));h.click('load');assert.equal(h.snap().run.phase,'essay');
   for(const k of ['essay','rank','inspected','limitation','belief','hypothesis','tel','priorFlags'])assert.equal(JSON.stringify(h.snap().run.green[k]),JSON.stringify(s.run.green[k]));
   assert.equal(JSON.stringify(h.snap().run.dawn),JSON.stringify(s.run.dawn));assert.equal(JSON.stringify(h.snap().run.visited),JSON.stringify(s.run.visited));
   h.click('check-essay');assert(!h.doc.getElementById('finish-investigation'));const resumed=reload(h);assert.equal(resumed.snap().run.phase,'essay');assert.equal(resumed.snap().run.green.essay,s.run.green.essay);
 });
 check('Passing essay completes and resumes '+spot,()=>{assert.equal(g.snap().run.green.result.authorship.flags.length,0);assert(g.snap().run.green.result.priorFlags.length>=2);g=reload(g);assert.equal(g.snap().run.phase,'finished');assert(g.host.textContent.includes('Authorship')||g.host.textContent.includes('authorship'));assert(!g.host.textContent.includes('typing rate'));assert(!g.host.textContent.includes('words/minute'));assert(g.snap().run.green.priorFlags.some(r=>r.wordsPerMinute>300));});
 check('Unknown or synthetic history cannot grant outside text credit '+spot,()=>{
   const storage={...g.storage};
   for(const mode of ['unknown','synthetic-known']){
     const h=boot({...storage});h.click('load');h.click('revise-essay');const ta=h.doc.getElementById('essay-text');ta.focus();
     const text=mode==='unknown'?endings[0]+' Outside words':ta.value;
     ta.value='';ta.dispatch('input',{inputType:'deleteContentBackward',isTrusted:true});
     ta.value=text;ta.dispatch('input',{inputType:'historyUndo',isTrusted:mode==='unknown'});h.click('check-essay');
     assert(!h.doc.getElementById('finish-investigation'));assert(h.snap().run.green.result.authorship.flags.includes('text inserted without matching keystrokes'));
     // Actual native undo/redo of an already flagged insertion retains its review flags.
     ta.value='';ta.dispatch('input',{inputType:'historyUndo',isTrusted:true});
     ta.value=text;ta.dispatch('input',{inputType:'historyRedo',isTrusted:true});h.click('check-essay');
     assert(!h.doc.getElementById('finish-investigation'));assert(h.snap().run.green.result.authorship.flags.length);
   }
 });
 g.click('restart');g.click('confirm-restart');check('Restart clears S3 and prior slices '+spot,()=>assert.equal(Object.keys(g.storage).length,0));
}
const g=boot(),C=g.ctx.WL_CHECK,D=g.ctx.WG_DATA;
check('Opening subtitle describes dawn, not the night alarm',()=>{assert(g.host.querySelector('.brand').textContent.includes('Dawn of April 19'));g.click('begin');assert(g.host.querySelector('.brand').textContent.includes('Dawn of April 19'));g.click('skip');assert(g.host.querySelector('.brand').textContent.includes('Dawn of April 19'));});
check('Revere contradiction preserves the time-limited house obstruction',()=>{const line=D.table.revere1775.location.ranks[1];assert(line.includes('at that time'));assert(line.includes('house blocked'));assert(!line.includes('at all'));});
for(const text of endings)check('Either side and uncertainty content pass '+text.slice(0,25),()=>assert(C.essay(text,D.cards.map(c=>c.id),null).passed));
check('Uninspected references and invented speech do not count',()=>{assert.equal(C.essay(endings[0],[],null).refs.length,0);assert(!C.essay('Keep together. Listen for orders.',[],null).passed);});
const parkerEssay='I think the regulars fired first. Parker said he ordered the militia to disperse and not to fire. Barker says the militia fired one or two shots first. However, Barker was on his own side and might have misunderstood the order. I would compare what each observer could see before choosing. These conflicting accounts do not identify a trigger puller with certainty, so my conclusion remains a belief.';
check('Parker detail plus Barker passes with two inspected references',()=>{
 const r=C.essay(parkerEssay,['depositions','barker'],null);assert(r.passed);assert.equal(r.refs.length,2);assert(r.refs.some(r=>r.card==='depositions'));assert.equal(g.ctx.WG_ESSAY.minRefs,2);
});
check('Ordinary source attribution and past tense preserve good essays',()=>{
 for(const claim of ['According to Barker, the militia fired one or two shots first.', 'The militia fired one or two shots first, according to Barker.', 'Barker described one or two shots fired by the militia.'])assert(C.essay(parkerEssay.replace('Barker says the militia fired one or two shots first.',claim),['depositions','barker'],null).passed);
 const reverse=parkerEssay.replace('Parker said he ordered the militia to disperse and not to fire.', 'The militia were ordered to disperse and not to fire, according to Parker.');assert(C.essay(reverse,['depositions','barker'],null).passed);
});
check('Revere deposition and Barker are two source groups',()=>{
 const text=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.', "Revere's 1775 deposition says a house blocked his view of the militia, but Barker says the militia fired one or two shots first.");
 const r=C.essay(text,D.cards.map(c=>c.id),null);assert(r.passed);assert.equal(r.refs.length,2);assert.equal(r.criteria.structure.denseSentences,0);
});
check('Revere letter vocabulary does not invent a third source',()=>{
 const comparison="Revere’s 1798 letter says an officer appeared to fire a pistol in front of the troops, but Barker says the militia fired first.";
 const essay=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.',comparison);
 for(const inspected of [D.cards.map(c=>c.id),['revere1798','barker']]){
   const r=C.essay(essay,inspected,null);assert(r.passed);assert.equal(r.criteria.structure.denseSentences,0);
   assert.equal(r.refs.length,2);assert(r.refs.some(r=>r.card==='revere1798'));assert(!r.refs.some(r=>r.card==='revere1775'));
 }
 assert.equal(C.essay(comparison,['revere1775'],null).refs.length,0);
 const parkerComparison=comparison.replace('Barker says the militia fired first', "Parker's 1775 deposition says the regulars fired first");
 const p=C.essay(parkerComparison,D.cards.map(c=>c.id),null);assert.equal(p.refs.length,2);assert(p.refs.some(r=>r.card==='revere1798'));assert(p.refs.some(r=>r.card==='depositions'));assert.equal(p.criteria.structure.denseSentences,0);
 // Either explicit Revere document retains its own shared vocabulary; explicitly naming both counts both.
 const earlier="Revere's 1775 deposition says he saw smoke in front of the troops.";
 assert(C.essay(earlier,['revere1775'],null).refs.some(r=>r.card==='revere1775'));
 const both=earlier.replace('.', ", while Revere's 1798 letter says he saw a pistol.");
 const r=C.essay(both,['revere1775','revere1798'],null);assert.equal(r.refs.length,2);assert.equal(r.criteria.structure.denseSentences,0);
 const reverse="In his 1775 deposition, Revere said a house blocked his view, while Revere's 1798 letter says he saw a pistol.";
 const essayReverse=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.',reverse).replace('His diary', 'However, his diary');
 const reversed=C.essay(essayReverse,['revere1775','revere1798'],null);assert(reversed.passed);assert.equal(reversed.refs.length,2);assert.equal(reversed.criteria.structure.denseSentences,0);
});
check('Ordinary Revere comparisons preserve explicit and possessive document ownership',()=>{
 const comparisons=[
   "Revere said in his 1775 deposition that a house blocked his view, while his 1798 letter describes a pistol.",
   "Revere’s 1775 deposition says a house blocked his view, while his letter says he saw a pistol.",
   "Revere reported that a house blocked his view in his 1775 deposition, but his letter says he saw a pistol.",
   "Revere's 1798 letter says he saw a pistol, but his 1775 deposition says a house blocked his view."
 ];
 for(const comparison of comparisons){
   const essay=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.',comparison).replace('His diary', 'However, his diary');
   for(const inspected of [D.cards.map(c=>c.id),['revere1775','revere1798']]){
     const r=C.essay(essay,inspected,null);assert(r.passed,comparison);assert.equal(r.refs.length,2);assert(r.refs.some(r=>r.card==='revere1775'));assert(r.refs.some(r=>r.card==='revere1798'));assert.equal(r.criteria.structure.denseSentences,0);
   }
   assert.equal(C.essay(essay,['revere1775'],null).refs.length,1);
 }
 for(const [comparison,ids] of [
   ["Parker's 1775 deposition says the regulars fired first, and Revere's 1798 letter describes a pistol in front of the troops.",['depositions','revere1798']],
   ["Revere's 1798 letter says he saw smoke in front of the troops in 1775, but Barker says the militia fired first.",['revere1798','barker']]
 ]){
   const essay=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.',comparison).replace('His diary', 'However, his diary');
   const r=C.essay(essay,D.cards.map(c=>c.id),null);assert(r.passed,comparison);assert.equal(r.refs.length,2);assert(ids.every(id=>r.refs.some(r=>r.card===id)));assert(!r.refs.some(r=>r.card==='revere1775'));assert.equal(r.criteria.structure.denseSentences,0);
 }
 const otherAuthor="Revere saw smoke in front of the troops, but Parker said in his 1775 deposition that the regulars fired first.";
 const r=C.essay(otherAuthor,D.cards.map(c=>c.id),null);assert.equal(r.refs.length,2);assert(!r.refs.some(r=>r.card==='revere1798'));assert.equal(r.criteria.structure.denseSentences,0);
});
check('Following deposition attribution does not borrow Parker evidence for Revere',()=>{
 for(const owner of ['by Parker','of Parker','by Captain John Parker','written by Parker']){
   const comparison="Revere's 1798 letter describes a pistol in front of the troops, and the deposition "+owner+" says the regulars fired first.";
   const essay=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia. Barker says the militia fired one or two shots first.',comparison).replace('His diary','However, his diary');
   for(const inspected of [D.cards.map(c=>c.id),['revere1798','depositions']]){
     const r=C.essay(essay,inspected,null);assert(r.passed,comparison);assert.equal(r.refs.length,2);assert(r.refs.some(r=>r.card==='revere1798'));assert(r.refs.some(r=>r.card==='depositions'));assert(!r.refs.some(r=>r.card==='revere1775'));assert.equal(r.criteria.structure.denseSentences,0);
   }
   assert.equal(C.essay(essay,['revere1775'],null).refs.length,0);
 }
 const own="Revere's 1798 letter says he saw a pistol, and the deposition by Revere says a house blocked his view.";
 const r=C.essay(own,['revere1775','revere1798'],null);assert.equal(r.refs.length,2);assert.equal(r.criteria.structure.denseSentences,0);
});
check('Doolittle source limitations preserve evidence and inspection filtering',()=>{
 const claims=['Doolittle was only an artist, not an eyewitness to the first shot.', 'Doolittle was an artist, so his picture cannot prove who fired first.', 'Only an artist, Doolittle was not an eyewitness to the first shot.', 'Doolittle was not an eyewitness to the first shot.'];
 for(const claim of claims){
   const essay=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia.',claim).replace('smoke alone','the picture alone').replace('His diary', 'However, his diary');
   const r=C.essay(essay,['doolittle','barker'],null);assert(r.passed);assert.equal(r.refs.length,2);assert(r.refs.some(r=>r.card==='doolittle'));
   assert.equal(C.essay(essay,['barker'],null).refs.length,1);
 }
});
check('Parker reference is still filtered by inspection',()=>{const r=C.essay(parkerEssay,['barker'],null);assert(!r.passed);assert.equal(r.refs.length,1);});
check('Parker detail works in either order and identifies counteraccount',()=>{
 for(const text of ['Parker ordered dispersal and no firing.', 'An unprovoked attack without provocation is what Parker reported.', 'The militia were ordered to disperse and not to fire, according to Parker.'])assert(C.essay(text,['depositions'],null).refs.some(r=>r.card==='depositions'));
 assert(C.essay(parkerEssay.replace('the regulars fired first','the militia fired first'),['depositions','barker'],null).criteria.otherSide.pass);
});
check('Parker and deposition wording still count as one card',()=>{assert.equal(C.essay('Parker ordered dispersal and no firing in his sworn deposition.',['depositions'],null).refs.length,1);});
check('Bare Parker name and fictional muster speech do not count',()=>{for(const text of ['I met Parker.', 'Parker told Eli to keep together and listen for orders.', 'Parker was there. Someone else ordered dispersal.'])assert.equal(C.essay(text,['depositions'],null).refs.length,0);});
check('Same card counted once; own hypothesis counts once',()=>{const h={version:{side:'militia',...D.sides.militia.preset}};const r=C.essay('I picked a regular in front and a charge in my game. Revere saw smoke in front and a house blocked the view.', ['revere1775'],h);assert.equal(r.refs.length,1);assert.equal(r.criteria.evidence.count,2);});
check('Scoring marks match portable S2 fixture',()=>{const old=JSON.parse(fs.readFileSync(ROOT+'test/fixtures/s2-scoring.json','utf8'));for(const [card,tab] of Object.entries(old.table))for(const [dim,choices] of Object.entries(tab))for(const [choice,mark] of Object.entries(choices))assert.equal(D.table[card][dim][choice][0],mark);assert.equal(JSON.stringify(D.shooters),JSON.stringify(old.shooters));});
check('Keyword stuffing fails sentence structure',()=>{
 const r=C.essay('Barker diary Parker disperse 400 however British account depositions. '.repeat(8),D.cards.map(c=>c.id),null);
 assert(!r.passed);assert(!r.criteria.structure.pass);assert.equal(r.refs.length,0);
});
check('Six distinct shuffled keyword sentences fail content',()=>{
 const text=fs.readFileSync(ROOT+'test/fixtures/keyword-salad.txt','utf8'),r=C.essay(text,D.cards.map(c=>c.id),null);
 assert(!r.passed);assert(!r.criteria.structure.pass);assert(r.criteria.structure.denseSentences>0);assert(r.criteria.structure.repeatedFraction<=0.25);assert(r.words>=60);
});
check('Bare source names with claim verbs do not earn evidence',()=>{
 for(const text of ['Barker diary is useful because this account is important.', 'The militia depositions are useful because they are sworn.', 'The numbers card says 400 because numbers are important.', 'Doolittle says the engraving is useful because pictures matter.'])assert.equal(C.essay(text,D.cards.map(c=>c.id),null).refs.length,0);
});
check('Repeated fluent claims cannot inflate an essay',()=>{
 const r=C.essay('Barker says the militia fired one or two shots first, however Parker ordered dispersal. '.repeat(8),D.cards.map(c=>c.id),null);
 assert(!r.passed);assert(r.criteria.structure.repeatedFraction>0.25);
});
check('Fictional house view does not count as Revere testimony',()=>{
 for(const text of ['I stood at the house corner and my view was blocked.', 'Eli saw smoke in front of the troops but a house blocked his view of the militia.'])assert.equal(C.essay(text,['revere1775','revere1798'],null).refs.length,0);
 assert.equal(C.essay('Revere saw smoke in front of the troops but a house blocked his view of the militia.',['revere1775'],null).refs.length,1);
});
check('Near-duplicate keyword lists with a token variation fail',()=>{
 const text=['alpha','beta','gamma','delta','epsilon','zeta'].map(x=>'Barker diary is Parker disperse 400 however British account depositions '+x+'.').join(' ');
 const r=C.essay(text,D.cards.map(c=>c.id),null);assert(!r.passed);assert(!r.criteria.structure.pass);
 // A reporting verb does not rescue a near-duplicate list.
 assert(!C.essay(text.replaceAll('is','says'),D.cards.map(c=>c.id),null).passed);
});
check('Mentioning Revere alongside fictional observations gives no credit',()=>{
 for(const text of ['Eli saw smoke in front of the troops, but Revere was elsewhere.', 'I saw a pistol in the fictional scene where I met Revere.', 'Revere did not see my fictional scene, where a house blocked my view.'])assert.equal(C.essay(text,['revere1775','revere1798'],null).refs.length,0);
 const text=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia.', 'Eli saw smoke in front of the troops, but Revere was elsewhere.');
 assert(!C.essay(text,['barker','revere1775'],null).passed);
});
check('Passive and copular historical claims still receive credit',()=>{
 const examples=[['outcome','Eight colonists were killed and ten were wounded, but only one British soldier was wounded.'],['formation','The militia were in parade formation in plain sight.'],['doolittle',"Doolittle's engraving is an artist's picture, not proof of the first shooter."]];
 for(const [id,text] of examples)assert(C.essay(text,D.cards.map(c=>c.id),null).refs.some(r=>r.card===id),id);
 const text=endings[0].replace('Revere saw smoke in front of the troops but a house blocked his view of the militia.',examples[0][1]).replace('smoke alone','the casualties alone');
 assert(C.essay(text,D.cards.map(c=>c.id),null).passed);
});
check('Real elapsed time advances opening below 20 fps',()=>{
 const b=boot();b.click('begin');b.frames(10,200);assert(Math.abs(b.snap().elapsed-2)<1e-9);
});
check('Invalid future checkpoints rejected',()=>{for(const patch of [s=>{s.phase='study'},s=>{s.green.essay=42},s=>{s.green.tel.inputEvents=-1}]){const s={phase:'muster-complete',accepted:true,asked:true,visited:['lantern','orchard'],returned:true,x:0,z:44,dawn:{met:true,delivered:true,listened:['near','far'],questions:['militia','town'],boundary:true,x:0,z:-15},green:g.ctx.WL_SLICE.fresh()};patch(s);const b=boot({[KEY]:JSON.stringify({version:1,run:s})});assert(!b.doc.getElementById('load'));}});
check('Storage denial keeps live slice playable',()=>{const b=boot(new Proxy({}, {get(){throw Error('denied')},set(){throw Error('denied')}}));alarm(b);muster(b);b.click('continue-green');b.frame();walkGreen(b,'edge');b.frames(320);b.click('to-shelter');walkGreen(b,'shelter');b.click('enter-study');assert(!b.snap().storageOK);assert.equal(b.snap().run.phase,'study');assert(b.host.querySelector('.card').textContent.includes('Saving is unavailable. Refresh will lose this run.'));});
console.log(JSON.stringify({kind:'DOM/renderer simulation; not browser acceptance',checks:checks.length,results:checks},null,2));
