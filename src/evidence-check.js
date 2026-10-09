/* Inherited scoring marks; local essay structure guards. */
(function () {
  'use strict';
  var D = window.WG_DATA, E = window.WG_ESSAY;
  var DIMS = ['shooter', 'location', 'aftermath'];
  function score(v) {
    var out = { cards: {}, why: {}, accepted: true, reasons: [], redTestimony: [], redFacts: [] };
    D.cards.forEach(function (c) {
      var tab = D.table[c.id] || {}, marks = [];
      DIMS.forEach(function (dim) { var e = tab[dim] && tab[dim][v[dim]]; if (e) marks.push({ m: e[0], why: e[1] }); });
      var red = marks.filter(function (m) { return m.m === 'R'; }), green = marks.filter(function (m) { return m.m === 'G'; }), grey = marks.filter(function (m) { return m.m === '-'; });
      var col = red.length ? 'red' : green.length ? 'green' : 'grey';
      var why = (red.length ? red : green.length ? green : grey).map(function (m) { return m.why; });
      if (!why.length) why = ['Says nothing about your version.'];
      out.cards[c.id] = col; out.why[c.id] = why;
      if (col === 'red' && c.kind === 'fact') { out.accepted = false; out.redFacts.push(c.id); why.forEach(function (w) { if (out.reasons.indexOf(w) < 0) out.reasons.push(w); }); }
      if (col === 'red' && c.kind === 'testimony') out.redTestimony.push(c.id);
    });
    return out;
  }
  function rx(s) { return new RegExp(s, 'i'); }
  function words(t) { var m = String(t).trim().match(/[A-Za-z0-9\u00C0-\u024F'\u2019-]+/g); return m ? m.length : 0; }
  function similar(a, b) {
    var x = new Set(a.match(/[a-z']+/g) || []), y = new Set(b.match(/[a-z']+/g) || []);
    var shared = Array.from(x).filter(function (w) { return y.has(w); }).length;
    return shared / Math.max(1, x.size + y.size - shared) >= E.structure.nearDuplicate;
  }
  function distinctSentences(sentences) {
    return sentences.filter(function (s, i) { return !sentences.slice(0, i).some(function (prev) { return similar(s, prev); }); });
  }
  function check(text, inspected, hypothesis) {
    var st = { sides: {} };
    if (hypothesis) st.sides[hypothesis.version.side] = { version: hypothesis.version, score: score(hypothesis.version), played: true };
    function anyPlayed() { return !!hypothesis; }
    var t = String(text || '').toLowerCase().replace(/\u2019/g, "'"), n = words(t), res = { words: n, minWords: E.minWords, refs: [], own: [], stance: null, criteria: {}, hints: [], passed: false };
    var sentences = t.split(/[.!?\n]+/).map(function (s) { return s.trim().replace(/\s+/g, ' '); }).filter(Boolean);
    function mentionsSource(r, s) {
      return !(r.otherSource && rx(r.otherSource).test(s) && !rx(r.source).test(s)) && r.any.some(function (p) { return rx(p).test(s); });
    }
    function groupCount(s) {
      return new Set(E.refs.filter(function (r) { return mentionsSource(r, s); }).map(function (r) { return r.group; })).size;
    }
    var dense = sentences.filter(function (s) { return groupCount(s) > E.structure.maxGroupsPerSentence; });
    var claims = sentences.filter(function (s) { return words(s) >= E.structure.minSentenceWords && rx(E.structure.claim).test(s) && groupCount(s) <= E.structure.maxGroupsPerSentence; });
    var distinct = distinctSentences(claims), repeated = sentences.length ? 1 - distinctSentences(sentences).length / sentences.length : 0;
    var connected = claims.some(function (s) { return rx(E.structure.connective).test(s); });
    res.criteria.structure = { pass: distinct.length >= E.structure.minSentences && repeated <= E.structure.maxRepeatedFraction && connected && !dense.length,
      denseSentences: dense.length, distinctSentences: distinct.length, repeatedFraction: repeated, connected: connected };
    // (a) evidence references in attributed claim sentences, one per card group
    var groups = {};
    E.refs.forEach(function (r) { if (!inspected.includes(r.group) || groups[r.group]) return; if (claims.some(function (s) { return (!r.detailClaim || rx(r.detailClaim).test(s)) && (!r.attribution || rx(r.attribution).test(s)) && (!r.exclude || !rx(r.exclude).test(s)) && mentionsSource(r, s); })) { groups[r.group] = r.id; res.refs.push({ id: r.id, card: r.group, label: r.label }); } });
    // STRONG: the kid's own reenactment (only if a personal phrase is present)
    var sents = claims.filter(function (s) { return rx(E.own.personal).test(s); });
    if (sents.length) {
      ['militia', 'british'].forEach(function (k) { var S = st.sides[k]; if (!S || !S.played) return; var v = S.version;
        ['shooter', 'location', 'aftermath'].forEach(function (dim) { var p = E.own[dim][v[dim]]; if (p && sents.some(function (s) { return rx(p).test(s); })) res.own.push({ kind: dim, side: k, value: v[dim] }); });
        Object.keys(E.own.cards).filter(function (cid) { return inspected.includes(cid); }).forEach(function (cid) { var col = S.score.cards[cid], cp = rx(E.own.cards[cid]), colp = rx(E.own.colors[col]);
          if (sents.some(function (s) { return cp.test(s) && colp.test(s); })) res.own.push({ kind: 'cardColor', side: k, card: cid, color: col }); });
      });
    }
    var refCount = res.refs.length + (res.own.length ? 1 : 0);
    res.criteria.evidence = { pass: refCount >= E.minRefs, count: refCount, need: E.minRefs, strong: res.own.length > 0 };
    // stance + (b) the other side
    var lead = rx(E.stance.lead + '[^.]{0,60}'), st2 = null, sentences2 = t.split(/[.!?\n]+/);
    sentences2.some(function (s) { if (!lead.test(s)) return false; if (rx(E.stance.unsure).test(s)) { st2 = 'unsure'; return true; } if (rx(E.stance.british).test(s)) { st2 = 'british'; return true; } if (rx(E.stance.militia).test(s)) { st2 = 'militia'; return true; } return false; });
    if (!st2) { if (rx(E.stance.unsure).test(t)) st2 = 'unsure'; else { var bi = t.search(rx(E.stance.british)), mi = t.search(rx(E.stance.militia)); if (bi >= 0 && (mi < 0 || bi < mi)) st2 = 'british'; else if (mi >= 0) st2 = 'militia'; } }
    res.stance = st2;   // 'british' = believes the regulars fired first (the militia's account); 'militia' = the British account
    var mentions = { militia: claims.some(function (s) { return E.accounts.militia.any.some(function (p) { return rx(p).test(s); }); }), british: claims.some(function (s) { return E.accounts.british.any.some(function (p) { return rx(p).test(s); }); }) };
    var opposing = st2 === 'british' ? ['british'] : st2 === 'militia' ? ['militia'] : ['militia', 'british'];
    var missing = opposing.filter(function (k) { return !mentions[k]; }), weigh = claims.some(function (s) { return rx(E.weighing).test(s) && rx(E.structure.connective).test(s); });
    res.criteria.otherSide = { pass: !missing.length && weigh, mentions: mentions, opposing: opposing, weighing: weigh };
    res.criteria.length = { pass: n >= E.minWords, words: n, need: E.minWords };
    // hints
    if (!res.criteria.structure.pass) res.hints.push(E.hints.structure);
    function f(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
    if (!res.criteria.evidence.pass) res.hints.push(refCount === 0 ? E.hints.refs0 : f(E.hints.refs1, { got: res.refs.length ? res.refs[0].label.replace(/^"|"$/g, '') : 'your own reenactment' }));
    missing.forEach(function (k) { var acc = k === 'british' ? 'british' : 'militia', played = st.sides[acc] && st.sides[acc].played;
      res.hints.push(f(played ? E.hints.otherPlayed : E.hints.otherNotPlayed, { other: E.accounts[k].label })); });
    if (!missing.length && !weigh) res.hints.push(E.hints.weigh);
    if (!res.criteria.length.pass) res.hints.push(f(E.hints.length, { min: E.minWords, n: n }));
    if (!st2) res.hints.push(E.hints.stance);
    if (!res.own.length && anyPlayed()) res.hints.push(E.hints.own);
    res.passed = res.criteria.evidence.pass && res.criteria.otherSide.pass && res.criteria.length.pass && res.criteria.structure.pass;
    return res;
  }
  window.WL_CHECK = { score: score, essay: check, words: words };
})();
