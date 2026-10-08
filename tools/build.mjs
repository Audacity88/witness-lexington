// Build the self-contained embeddable bundle.  node tools/build.mjs
// Outputs (dist/):
//   witness-game.bundle.js   three r186 (tree-shaken) + data + coast + world + game + Doolittle image (data URI), minified
//   fence-gz.json            {title, html}: gzip+base64 inline loader (DecompressionStream -> <script>.text; no eval / blob URLs)
//   fence-inline.json        {title, html}: plain inline <script> fallback (only if it fits the 1,000,000-byte doc limit)
//   witness-game.html        standalone single file (the gz fence wrapped as a full page)
// Uses esbuild + three from /workspace/workbench-forge/node_modules (read-only).
import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import crypto from 'crypto'; import { createRequire } from 'module';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const NM = '/workspace/workbench-forge/node_modules';
const require = createRequire(NM + '/x.js'); const esbuild = require('esbuild');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const DIST = path.join(ROOT, 'dist'); fs.mkdirSync(DIST, { recursive: true });

// 1) tree-shaken three: only the names the game uses
const src = ['src/world.js', 'src/game.js'].map(rd).join('\n');
const names = [...new Set([...src.matchAll(/\b(?:T|THREE)\.([A-Z][A-Za-z0-9]+)/g)].map(m => m[1]))].filter(n => n !== 'OrbitControls').sort();
const entry = `import { ${names.join(',')} } from 'three';\nimport { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';\nwindow.THREE = { ${names.join(',')}, OrbitControls };\n`;
const three = (await esbuild.build({ stdin: { contents: entry, resolveDir: NM, loader: 'js' }, bundle: true, minify: true, format: 'iife', write: false, nodePaths: [NM], legalComments: 'none', target: 'es2019' })).outputFiles[0].text;

// 2) app code (minified separately; data files stay readable in the repo, minified only in the bundle)
const img = 'data:image/webp;base64,' + fs.readFileSync(path.join(ROOT, 'assets/doolittle-plate1.webp')).toString('base64');
const app = ['data/evidence.js', 'data/essay-rules.js', 'src/coast.js', 'src/world.js', 'src/game.js'].map(rd).join(';\n');
const appMin = (await esbuild.transform(app, { minify: true, loader: 'js', legalComments: 'none', target: 'es2019' })).code;
const header = '/* Witness the First Shot \u2014 bundle. three.js r186 (MIT, tree-shaken). Doolittle Plate I: Yale University Art Gallery 1920.25a-d (object 2482), public domain (CC0). */\n';
const bundle = header + three + ';\nwindow.WG_DOOLITTLE_SRC=' + JSON.stringify(img) + ';\n' + appMin;
fs.writeFileSync(path.join(DIST, 'witness-game.bundle.js'), bundle);

// 3) safety checks for Workbench inline embedding
const REWRITE = /((?:https?:\/\/[^\/\s"'`<>]+)?\/f\/[a-f0-9]{16,64}(?:\.[A-Za-z0-9]+)?)(\?[^\s"'`<>)]*)?/gi;
const check = (label, s) => { const rw = (s.match(REWRITE) || []).length, sc = (s.match(/<\/script/gi) || []).length, cm = (s.match(/<!--/g) || []).length;
  if (rw || sc || cm) throw new Error(`${label}: rewriter matches ${rw}, </script ${sc}, <!-- ${cm}`); return { rewriterMatches: rw, closeScript: sc }; };
check('bundle', bundle);

const TITLE = 'Witness the First Shot \u2014 Lexington Green, 1775';
const shell = "<style>html,body{margin:0;height:100%;overflow:hidden}</style><div id='witness-game' style='width:100%;height:100vh;min-height:400px'></div>";
const note = (k) => `<!-- Witness the First Shot (kid game). ${k}. Doolittle engraving: Yale University Art Gallery 1920.25a-d, public domain (CC0). three.js r186 MIT. -->`;
const gz = zlib.gzipSync(Buffer.from(bundle), { level: 9 }).toString('base64');
const loader = `<script>(async function(){var b=atob('${gz}'),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);var t=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();var s=document.createElement('script');s.text=t;document.body.appendChild(s);})();</script>`;
const gzHtml = shell + note('Payload = gzip+base64 of dist/witness-game.bundle.js') + loader;
check('gz payload', gz); if ((gzHtml.match(REWRITE) || []).length) throw new Error('rewriter match in gz fence');
const gzJson = JSON.stringify({ title: TITLE, html: gzHtml });
fs.writeFileSync(path.join(DIST, 'fence-gz.json'), gzJson);
const inlineHtml = shell + note('Plain inline fallback') + '<script>' + bundle + '</script>';
if ((inlineHtml.match(REWRITE) || []).length) throw new Error('rewriter match in inline fence');
const inlineJson = JSON.stringify({ title: TITLE, html: inlineHtml });
const LIMIT = 1000000, inlineFits = Buffer.byteLength(inlineJson) < LIMIT - 20000;
if (inlineFits) fs.writeFileSync(path.join(DIST, 'fence-inline.json'), inlineJson); else if (fs.existsSync(path.join(DIST, 'fence-inline.json'))) fs.unlinkSync(path.join(DIST, 'fence-inline.json'));
fs.writeFileSync(path.join(DIST, 'witness-game.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${TITLE}</title></head><body>${gzHtml}</body></html>`);
fs.writeFileSync(path.join(DIST, 'witness-game-inline.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${TITLE}</title></head><body>${inlineHtml}</body></html>`);
const B = s => Buffer.byteLength(s);
const report = { threeNames: names.length, threeMinBytes: B(three), imageDataUriBytes: B(img), appMinBytes: B(appMin), bundleBytes: B(bundle),
  bundleSha256: crypto.createHash('sha256').update(bundle).digest('hex'), gzFenceJsonBytes: B(gzJson), gzPayloadB64Bytes: gz.length,
  inlineFenceJsonBytes: B(inlineJson), inlineFits, rewriterMatches: 0, closeScriptInPayload: 0 };
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
