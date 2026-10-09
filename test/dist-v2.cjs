/* Inspect every shipped payload, including gzip fences. No browser or git required. */
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), assert = require('node:assert/strict'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
let checks = 0;
for (const file of fs.readdirSync(dist).filter(f => /\.(js|html|json)$/.test(f))) {
  let text = fs.readFileSync(path.join(dist, file), 'utf8');
  if (file.startsWith('fence-')) text = JSON.parse(text).html;
  const encoded = text.match(/atob\('([^']+)'\)/);
  const payload = encoded ? zlib.gunzipSync(Buffer.from(encoded[1], 'base64')).toString() : text;
  assert(!/fired two shots/i.test(text + payload), file + ': Barker overstatement');
  assert(!payload.includes('Credits &amp; licenses — Witness the First Shot'), file + ': stale credits title');
  if (file !== 'build-report.json') {
    assert(payload.includes('WL_SLICE'), file + ': missing v2 controller');
    assert(payload.includes('card-actions'), file + ': missing v2 styles');
    assert(payload.includes('one or two shots'), file + ': missing qualified Barker account');
    assert(payload.includes('WG_DOOLITTLE_SRC'), file + ': missing bundled image');
    assert(!payload.includes('phase:"globe"'), file + ': stale v1 controller');
    if (encoded || file.endsWith('.js')) new vm.Script(file.endsWith('.js') ? text : payload);
  }
  checks++;
}
// Fixtures must obey the same wording rule, including embedded gzip payloads.
const testDir = path.join(root, 'test');
function fixtureFiles(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? fixtureFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const fixtures = fs.readdirSync(testDir).filter(f => /\.(html|json)$/.test(f) && !f.startsWith('package')).map(f => path.join(testDir, f)).concat(fixtureFiles(path.join(testDir, 'fixtures')));
for (const file of fixtures) {
  const text = fs.readFileSync(file, 'utf8'), encoded = text.match(/atob\('([^']+)'\)/);
  const payload = encoded ? zlib.gunzipSync(Buffer.from(encoded[1], 'base64')).toString() : text;
  assert(!/fired two shots/i.test(text + payload), path.relative(root, file) + ': Barker overstatement');
  if (encoded) {
    assert.equal(payload, fs.readFileSync(path.join(dist, 'witness-game.bundle.js'), 'utf8'), 'CSP fixture must use the current v2 build');
    assert(payload.includes('Credits &amp; licenses — Witness Lexington'), 'CSP fixture credits title');
    assert(text.includes('Content-Security-Policy'), 'CSP fixture keeps its policy');
    new vm.Script(payload);
  }
  checks++;
}
const report = JSON.parse(fs.readFileSync(path.join(dist, 'build-report.json')));
const indexScripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !f.startsWith('vendor/'));
assert.deepEqual(report.entrypoint, indexScripts);
assert(report.gzFenceJsonBytes < 980000);
assert.equal(fs.existsSync(path.join(dist, 'fence-inline.json')), report.inlineFits);
console.log(JSON.stringify({ kind: 'decoded dist payloads; no browser acceptance', checks: checks + 3, inlineFits: report.inlineFits }));
