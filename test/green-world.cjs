const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..') + '/';
const paint = new Proxy({ measureText: s => ({width:s.length*20}), createRadialGradient: () => ({addColorStop(){}}) }, {get(o,k){return k in o ? o[k] : ()=>{};}});
const canvas = () => ({style:{},getContext:()=>paint});
const ctx = {console,performance:{now:()=>0},document:{createElement:()=>canvas()}};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'vendor/three-orbit.global.js','utf8'),ctx);
ctx.THREE = {...ctx.THREE, WebGLRenderer:class {constructor(){this.domElement=canvas();this.shadowMap={};} setPixelRatio(){}}, OrbitControls:class{}};
vm.runInContext(fs.readFileSync(root+'src/world.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(root+'data/green.js','utf8'),ctx);
const w=ctx.WGWorld.create({appendChild(){}}),lex=w.makeLex(),green=w.makeGreen(lex,ctx.WL_GREEN.stops);
const blocker=green.group.children.find(o=>o.geometry?.parameters?.width===12 && o.geometry?.parameters?.height===8);
assert(blocker,'staged obstruction exists');
let checks=0;
for(const [width,height] of [[960,540],[662,418]]) for(const spot of ['corner','edge']) {
 w.cam.aspect=width/height;w.cam.updateProjectionMatrix();
 for(const t of [0,3,6,7,9.9,10,15]) {
  green.pose(spot==='corner'?18:10,-14,0,0,1,'green-event',t,spot,2);
  assert(lex.regs.every(r=>r.visible)); assert(!lex.ring.visible&&!lex.hidden.visible);
  assert(Object.values(lex.markers).every(m=>!m.visible));
  lex.scene.traverse(o=>assert([o.position.x,o.position.y,o.position.z,o.scale.x,o.scale.y,o.scale.z].every(Number.isFinite)));
  assert.equal(blocker.visible,t>=6&&t<10);
  if(t>=6&&t<10){
   w.cam.updateMatrixWorld(true);lex.scene.updateMatrixWorld(true);
   for(const x of [-0.98,0,0.98])for(const y of [-0.98,0,0.98]) {
    const ray=new ctx.THREE.Raycaster();ray.setFromCamera(new ctx.THREE.Vector2(x,y),w.cam);
    assert(ray.intersectObject(blocker).length,`pivot ray ${width} ${spot} ${t} ${x} ${y} obstructed`);checks++;
   }
  }
  if(t===3)assert.equal(lex.horse.position.z,22,'officer starts behind advance companies');
  if(t===10){ assert(lex.militia.every(m=>m.position.y>=0)); }
  checks++;
 }
}
console.log(JSON.stringify({kind:'CPU scene construction with bundled THREE; renderer/canvas stubs; no visual acceptance',checks,coverage:'Both spectator spots and target aspects; obstruction rays cover screen; regulars visible; no shooter marker; finite transforms; officer arrives from rear.'},null,2));
