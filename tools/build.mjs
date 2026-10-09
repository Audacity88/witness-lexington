// Build the self-contained embeddable bundle.  node tools/build.mjs
// Outputs (dist/):
//   witness-game.bundle.js   checked-in THREE r186 + v2 scripts + CSS + Doolittle image + source register
//   fence-gz.json            {title, html}: gzip+base64 inline loader (DecompressionStream -> <script>.text; no eval / blob URLs)
//   fence-inline.json        {title, html}: plain inline <script> fallback (only if it fits the 1,000,000-byte doc limit)
//   witness-game.html        standalone single file (the gz fence wrapped as a full page)
// Offline build uses the checked-in THREE bundle and the same v2 scripts as index.html.
import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import crypto from 'crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const DIST = path.join(ROOT, 'dist'); fs.mkdirSync(DIST, { recursive: true });
const three = rd('vendor/three-orbit.global.js');
const files = [...rd('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => f !== 'vendor/three-orbit.global.js');
if (files.includes('src/game.js') || !files.includes('src/night-ride.js')) throw new Error('Expected the v2 entrypoint');
const img = 'data:image/webp;base64,' + fs.readFileSync(path.join(ROOT, 'assets/doolittle-plate1.webp')).toString('base64');
const css = rd('src/night-ride.css');
const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sources = '<!doctype html><meta charset="utf-8"><title>Witness Lexington sources</title><pre style="white-space:pre-wrap">' + escape(rd('SOURCES.md') + '\n' + rd('CREDITS.md')) + '</pre>';
const app = files.map(rd).join(';\n');
const header = '/* Witness Lexington v2. THREE r186 MIT. Doolittle Plate I: Yale object 2482, CC0. */\n';
const bundle = header + three + ';\nwindow.WG_DOOLITTLE_SRC=' + JSON.stringify(img) + ';\nwindow.WL_SOURCES_URL=URL.createObjectURL(new Blob([' + JSON.stringify(sources) + '],{type:"text/html"}));\n' +
  '(function(){var s=document.createElement("style");s.textContent=' + JSON.stringify(css) + ';document.head.appendChild(s);})();\n' + app;
if (/fired two shots/i.test(bundle)) throw new Error('Barker overstatement in build');
fs.writeFileSync(path.join(DIST, 'witness-game.bundle.js'), bundle);

// 3) safety checks for Workbench inline embedding
const REWRITE = /((?:https?:\/\/[^\/\s"'`<>]+)?\/f\/[a-f0-9]{16,64}(?:\.[A-Za-z0-9]+)?)(\?[^\s"'`<>)]*)?/gi;
const check = (label, s) => { const rw = (s.match(REWRITE) || []).length, sc = (s.match(/<\/script/gi) || []).length, cm = (s.match(/<!--/g) || []).length;
  if (rw || sc || cm) throw new Error(`${label}: rewriter matches ${rw}, </script ${sc}, <!-- ${cm}`); return { rewriterMatches: rw, closeScript: sc }; };
check('bundle', bundle);

const TITLE = 'Witness Lexington \u2014 The Green and the evidence';
const shell = "<style>html,body{margin:0;height:100%;overflow:hidden}</style><div id='witness-game' style='width:100%;height:100vh;min-height:400px'></div>";
const note = (k) => `<!-- Witness Lexington v2 (kid game). ${k}. Doolittle engraving: Yale University Art Gallery 1920.25a-d, public domain (CC0). three.js r186 MIT. -->`;
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
const report = { entrypoint: files, threeBytes: B(three), imageDataUriBytes: B(img), appBytes: B(app), bundleBytes: B(bundle),
  bundleSha256: crypto.createHash('sha256').update(bundle).digest('hex'), gzFenceJsonBytes: B(gzJson), gzPayloadB64Bytes: gz.length,
  inlineFenceJsonBytes: B(inlineJson), inlineFits, rewriterMatches: 0, closeScriptInPayload: 0 };
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
