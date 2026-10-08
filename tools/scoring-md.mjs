// node tools/scoring-md.mjs > SCORING.md   (renders the scoring table from data/evidence.js)
import fs from 'fs'; const w = {}; new Function('window', fs.readFileSync(new URL('../data/evidence.js', import.meta.url), 'utf8'))(w); const D = w.WG_DATA;
const out = ['# Scoring table (generated from data/evidence.js)', '', 'G = fits (green), R = contradicts (red), - = says nothing (grey). Per card: red if any choice is R, else green if any G, else grey.',
  'A version is **NOT ACCEPTED** if any *hard fact* card is red. Testimony cards may be red in an accepted version (shown as "But it contradicts: ...").', ''];
const label = (dim, k) => (dim === 'shooter' ? D.shooters : dim === 'location' ? D.zones : D.aftermaths)[k]?.label || k;
for (const c of D.cards) { const t = D.table[c.id] || {}; out.push(`## ${c.title}${c.date ? ' (' + c.date + ')' : ''} \u2014 ${c.kind === 'fact' ? 'HARD FACT' : 'testimony'}`, '');
  for (const dim of Object.keys(t)) { out.push(`| ${dim} | mark | why |`, '|---|---|---|');
    for (const [k, v] of Object.entries(t[dim])) { const m = Array.isArray(v) ? v[0] : v; const why = Array.isArray(v) ? v[1] : ''; out.push(`| ${label(dim, k)} (\`${k}\`) | ${m} | ${why.replace(/\|/g, '/')} |`); } out.push(''); } }
out.push('## Shooter \u2192 allowed locations', '', ...Object.entries(D.shooters).map(([k, s]) => `- ${s.label} (\`${k}\`): ${(s.zones || []).join(', ')}`));
console.log(out.join('\n'));
