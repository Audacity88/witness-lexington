/* WL-S3 controller. One source at a time; no alternative first-shot animation. */
(function () {
  'use strict';
  var D = window.WG_DATA, E = window.WG_ESSAY, C = window.WL_CHECK, G = window.WL_GREEN;
  var phases = ['green', 'green-event', 'shelter', 'study', 'hypothesis', 'essay', 'finished'];
  var modern = ['study', 'hypothesis', 'essay', 'finished'];
  function telemetry() { return { keystrokes: 0, inputEvents: 0, deletes: 0, msFocused: 0, pasteAttempts: 0, dropAttempts: 0 }; }
  function fresh() { return { x: 0, z: -15, spot: null, observed: false, sheltered: false, inspected: [], document: 'revere1775', rank: [], limitation: '', belief: null, hypothesis: null, essay: '', tel: telemetry() }; }
  function versionOK(v) { return v && ['militia', 'british'].includes(v.side) && D.shooters[v.shooter] && D.shooters[v.shooter].zones.includes(v.location) && D.aftermaths[v.aftermath]; }
  function ids(a, allow, max) { return Array.isArray(a) && a.length <= max && new Set(a).size === a.length && a.every(function (id) { return allow.includes(id); }); }
  function ranked(g) { return g.rank.length === 2 && g.limitation.trim().length >= 12; }
  function valid(g, phase) {
    var cards = D.cards.map(function (c) { return c.id; });
    if (!g || !Number.isFinite(g.x) || g.x < 0 || g.x > 19 || !Number.isFinite(g.z) || g.z < -20 || g.z > -13 ||
      ![null, 'corner', 'edge'].includes(g.spot) || typeof g.observed !== 'boolean' || typeof g.sheltered !== 'boolean' ||
      !ids(g.inspected, cards, 9) || !cards.includes(g.document) || !ids(g.rank, g.inspected, 2) ||
      typeof g.limitation !== 'string' || g.limitation.length > 2000 || ![null, 'militia', 'british', 'unsure'].includes(g.belief) ||
      typeof g.essay !== 'string' || g.essay.length > 20000 || !g.tel ||
      !Object.keys(telemetry()).every(function (k) { return Number.isFinite(g.tel[k]) && g.tel[k] >= 0; }) ||
      g.hypothesis !== null && (!g.hypothesis || !versionOK(g.hypothesis.version)) ||
      g.observed && !g.spot || g.sheltered && !g.observed || g.inspected.length && !g.sheltered) return false;
    if (phase === 'green-event' && !g.spot || phase === 'shelter' && !g.observed || modern.includes(phase) && !g.sheltered) return false;
    if (['hypothesis', 'essay', 'finished'].includes(phase) && (g.inspected.length !== 9 || !ranked(g) || !g.belief)) return false;
    if (['essay', 'finished'].includes(phase) && !g.hypothesis) return false;
    if (phase === 'finished' && !C.essay(g.essay, g.inspected, g.hypothesis).passed) return false;
    return true;
  }
  function create(env) {
    var scene = null, focusSince = null, draft = null;
    function g() { return env.state().green; }
    function p() { return env.state().phase; }
    function add(text, cls) { env.paragraph(env.card, text, cls); }
    function b(text, fn, id, primary) { var n = env.button(text, fn, id, primary); env.card.appendChild(n); return n; }
    function save() { env.save(); }
    function input(tag, label, id) {
      var l = env.el('label', '', label), n = env.el(tag); n.id = id; l.htmlFor = id; env.card.append(l, n); return n;
    }
    function select(label, id, entries, value, change) {
      var n = input('select', label, id);
      entries.forEach(function (e) { var o = env.el('option', '', e[1]); o.value = e[0]; n.appendChild(o); });
      n.value = value; n.addEventListener('change', function () { change(n.value); save(); }); return n;
    }
    function source(c) {
      add(c.sourceLabel + ' ' + c.source, 'tag');
      var a = env.el('a', '', 'Citation and passage'); a.href = 'SOURCES.md#' + c.anchor; a.target = '_blank'; a.rel = 'noopener'; env.card.appendChild(a);
    }
    function showDocument() {
      var s = g(), c = D.cards.find(function (c) { return c.id === s.document; });
      env.showCard('Evidence room · modern study', 'Read each source, then compare usefulness. This room is outside the 1775 story.');
      add('Inspected ' + s.inspected.length + '/9. Sources are shown individually; your draft stays on this device.');
      select('Choose one document', 'document', D.cards.map(function (c) { return [c.id, c.title]; }), c.id, function (v) { s.document = v; render(); });
      env.card.appendChild(env.el('h2', '', c.title + (c.date ? ' · ' + c.date : ''))); source(c);
      if (c.id === 'doolittle') { var im = env.el('img'); im.src = 'assets/doolittle-plate1.webp'; im.alt = D.room.doolittle.alt; im.className = 'document-image'; env.card.appendChild(im); }
      else if (c.kind === 'testimony') add('Original scan not included. This card uses a cited excerpt or labeled paraphrase.');
      if (c.quotes) c.quotes.forEach(function (q) { env.card.appendChild(env.el('blockquote', '', q)); });
      if (c.summary) add('Document paraphrase: ' + c.summary);
      if (c.flag) add(c.flag, 'tag'); add(c.limit);
      b(s.inspected.includes(c.id) ? 'Already inspected' : 'Record this source as inspected', function () { s.inspected.push(c.id); save(); render(); }, 'inspect', true).disabled = s.inspected.includes(c.id);
      var index = D.cards.indexOf(c);
      b('Next document', function () { s.document = D.cards[(index + 1) % D.cards.length].id; save(); render(); }, 'next-document');
      if (s.inspected.length === 9) ranking();
      if (s.hypothesis) b('Return to my essay draft', function () {
        if (valid(s, 'essay')) env.go('essay');
      }, 'return-essay').disabled = !valid(s, 'essay');
      b('My scene notebook', env.notebook, 'study-notebook');
    }
    function ranking() {
      var s = g(); env.card.appendChild(env.el('h2', '', 'Rank two sources by usefulness'));
      add('Choose the more useful source first. Explain a limitation in your own words. This reflection has no numerical score or official order.');
      ['First', 'Second'].forEach(function (label, i) {
        select(label + ' source', 'rank-' + i, [['', 'Choose a source']].concat(D.cards.map(function (c) { return [c.id, c.title]; })), s.rank[i] || '', function (v) {
          var other = env.card.querySelector('#rank-' + (1 - i)).value;
          s.rank = i === 0 ? [v, other] : [other, v]; s.rank = s.rank.filter(Boolean);
          ready();
        });
      });
      var note = input('textarea', 'One limitation of a chosen source', 'limitation'); note.maxLength = 2000; note.value = s.limitation;
      note.addEventListener('input', function () { s.limitation = note.value; ready(); save(); });
      var next = b('Choose a provisional account', function () { belief(); }, 'choose-belief', true);
      function ready() {
        var a = env.card.querySelector('#rank-0').value, b = env.card.querySelector('#rank-1').value;
        next.disabled = !a || !b || a === b || s.limitation.trim().length < 12;
        // Only persist a valid distinct ordered pair. Empty selection is incomplete.
        s.rank = a && b && a !== b ? [a, b] : [];
        var back = env.card.querySelector('#return-essay');
        if (back) back.disabled = !valid(s, 'essay');
      }
      ready();
    }
    function belief() {
      env.showCard('What do you believe so far?', 'A provisional belief is revisable. Testing an account does not prove it happened.');
      [['militia', 'Regulars may have fired first'], ['british', 'Militia may have fired first'], ['unsure', 'I cannot tell yet']].forEach(function (o) {
        b(o[1], function () { g().belief = o[0]; draft = null; env.go('hypothesis'); }, 'belief-' + o[0], true);
      });
    }
    function hypothesis() {
      var s = g(), old = draft || s.hypothesis && s.hypothesis.version;
      var v = old ? Object.assign({}, old) : Object.assign({ side: s.belief === 'british' ? 'british' : 'militia' }, D.sides[s.belief === 'british' ? 'british' : 'militia'].preset);
      env.showCard('Test a hypothesis', 'Choose a shooter, an allowed location, and what follows. These are proposed possibilities, not a replay of a known first shot.');
      add('Your provisional belief: ' + (s.belief === 'unsure' ? 'uncertain' : s.belief === 'militia' ? 'regulars may have fired first' : 'militia may have fired first') + '.');
      select('Account to test', 'account', Object.entries(D.sides).map(function (e) { return [e[0], e[1].label]; }), v.side, function (side) {
        // Changing accounts explicitly chooses its inherited preset, without changing belief.
        draft = Object.assign({ side: side }, D.sides[side].preset); render();
      });
      select('Possible shooter', 'shooter', Object.entries(D.shooters).map(function (e) { return [e[0], e[1].label]; }), v.shooter, function (id) {
        v.shooter = id; if (!D.shooters[id].zones.includes(v.location)) v.location = D.shooters[id].zones[0];
        location.replaceChildren(); zones(); result.replaceChildren();
      });
      var location = input('select', 'Allowed location', 'location');
      function zones() { D.shooters[v.shooter].zones.forEach(function (id) { var o = env.el('option', '', D.zones[id].label); o.value = id; location.appendChild(o); }); location.value = v.location; }
      zones(); location.addEventListener('change', function () { v.location = location.value; result.replaceChildren(); });
      select('Aftermath', 'aftermath', Object.entries(D.aftermaths).map(function (e) { return [e[0], e[1].label]; }), v.aftermath, function (id) { v.aftermath = id; result.replaceChildren(); });
      var result = env.el('div'); result.id = 'hypothesis-result'; result.setAttribute('role', 'status'); env.card.appendChild(result);
      b('Check this hypothesis', function () {
        draft = Object.assign({}, v); var sc = C.score(v); s.hypothesis = { version: Object.assign({}, v) }; save(); result.replaceChildren();
        env.paragraph(result, sc.accepted ? 'Fits the inherited fact checks. This does not prove who fired first.' : 'Contradicts the inherited fact checks. Revise your hypothesis.');
        // No side-by-side history of versions and no ready-made testimony counterargument.
        var chosen = D.cards.find(function (c) { return c.id === s.document; });
        env.paragraph(result, 'Current document: ' + chosen.title + ' · ' + ({ red: 'Contradicts', green: 'Fits', grey: 'Says nothing' })[sc.cards[chosen.id]] + ' ' + chosen.source);
        sc.why[chosen.id].forEach(function (why) { env.paragraph(result, why); });
        sc.redFacts.forEach(function (id) { var c = D.cards.find(function (c) { return c.id === id; }); env.paragraph(result, c.title + ' ' + c.source + ': ' + sc.why[id].join(' ')); });
        env.paragraph(result, 'Testimony contradictions: ' + sc.redTestimony.length + '. Revisit individual sources to examine them.');
        result.appendChild(env.button('Write my answer', function () { env.go('essay'); }, 'write-essay', true));
      }, 'check-hypothesis', true);
      b('Change provisional belief', belief, 'change-belief'); b('Inspect documents', function () { env.go('study'); }, 'hypothesis-documents');
    }
    function finishFocus(continueFocus) { if (focusSince !== null) { g().tel.msFocused += performance.now() - focusSince; focusSince = continueFocus ? performance.now() : null; } }
    function essay() {
      var s = g(); env.showCard('Your answer', E.question);
      add('Use at least ' + E.minRefs + ' evidence references and at least ' + E.minWords + ' words. Address the opposing account and weigh it. Inspected historical cards count; your tested hypothesis can count once. Fictional speech is not primary testimony.');
      add('This is a local pattern check. Passing it does not settle history or confirm authorship. Confirmed outside authorship must be disqualified by teacher review outside this game.');
      var ta = input('textarea', 'Write your own answer', 'essay-text'); ta.rows = 8; ta.maxLength = 20000; ta.value = s.essay;
      var count = env.el('p'), warning = env.el('p'); warning.id = 'paste-warning'; warning.setAttribute('role', 'status'); env.card.append(count, warning);
      var result = env.el('div'); result.id = 'essay-result'; result.setAttribute('role', 'status'); env.card.appendChild(result);
      function update() { count.textContent = C.words(s.essay) + ' / ' + E.minWords + ' words'; result.replaceChildren(); }
      function blocked(e, kind) { e.preventDefault(); s.tel[kind === 'drop' ? 'dropAttempts' : 'pasteAttempts']++; warning.textContent = 'Paste and drop are off. Please type your own words. Attempts are review flags, not proof of AI use.'; save(); }
      ta.addEventListener('paste', function (e) { blocked(e, 'paste'); }); ta.addEventListener('drop', function (e) { blocked(e, 'drop'); });
      ta.addEventListener('dragover', function (e) { e.preventDefault(); });
      ta.addEventListener('beforeinput', function (e) { if (/^insertFrom(Paste|Drop)/.test(e.inputType || '')) blocked(e, /Drop/.test(e.inputType) ? 'drop' : 'paste'); });
      ta.addEventListener('keydown', function (e) { if (e.key.length === 1 || ['Enter', 'Backspace', 'Delete'].includes(e.key)) { s.tel.keystrokes++; if (['Backspace', 'Delete'].includes(e.key)) s.tel.deletes++; } });
      ta.addEventListener('input', function () { s.tel.inputEvents++; s.essay = ta.value; update(); save(); });
      ta.addEventListener('focus', function () { focusSince = performance.now(); }); ta.addEventListener('blur', function () { finishFocus(); save(); }); update();
      b('Check my answer', function () {
        finishFocus(); if (document.activeElement === ta) focusSince = performance.now();
        var r = C.essay(s.essay, s.inspected, s.hypothesis); result.replaceChildren();
        env.paragraph(result, r.passed ? 'Content criteria met. Authorship still needs teacher review; this does not settle the first shot.' : 'Revise your answer using your inspected sources.');
        env.paragraph(result, 'Evidence ' + r.criteria.evidence.count + '/' + E.minRefs + '; other account ' + (r.criteria.otherSide.pass ? 'addressed' : 'needs weighing') + '; words ' + r.words + '/' + E.minWords + '.');
        r.hints.forEach(function (h) { env.paragraph(result, h); });
        var ratio = s.essay.length ? s.tel.keystrokes / s.essay.length : 1;
        env.paragraph(result, 'Local review flags: paste/drop attempts ' + (s.tel.pasteAttempts + s.tel.dropAttempts) + '; low keystroke ratio ' + (s.essay.length >= E.telemetry.minCharsForRatio && ratio < E.telemetry.lowRatio ? 'yes' : 'no') + '. Accessibility input can affect these flags.');
        if (r.passed) result.appendChild(env.button('Finish this investigation', function () { env.go('finished'); }, 'finish-investigation', true)); save();
      }, 'check-essay', true);
      b('Revisit one document', function () { finishFocus(); env.go('study'); }, 'essay-documents');
      b('Revise my hypothesis', function () { finishFocus(); env.go('hypothesis'); }, 'essay-hypothesis');
      b('My scene notebook', env.notebook, 'essay-notebook');
    }
    function render() {
      if (p() === 'study') { showDocument(); return; }
      if (p() === 'hypothesis') { hypothesis(); return; }
      if (p() === 'essay') { essay(); return; }
      if (p() === 'finished') {
        env.showCard('Investigation complete', 'Your answer meets the local content criteria. The sources still leave the first shot unresolved. [PIVOT]');
        add('Your draft, notes, inspected sources, and last hypothesis are saved locally. Teacher review of reasoning and authorship remains outside this game.');
        b('Read or revise my answer', function () { env.go('essay'); }, 'revise-essay', true); b('Read the notebook', env.notebook, 'end-notebook');
        b('Restart this run', env.restart, 'restart'); return;
      }
      if (p() === 'shelter' && g().sheltered) { shelterCard(); return; }
      env.overlay.hidden = true; env.panel.hidden = false; env.actionRow.hidden = false; env.notice.hidden = false; env.route.replaceChildren();
      env.objective.textContent = p() === 'green' ? 'Choose either reconstructed spectator spot. Neither reveals a first shooter. [PIVOT]' : p() === 'shelter' ? 'Walk to the marked shelter. There is no timer or combat.' : G.captions[Math.min(2, Math.floor(env.elapsed() / 6))];
      if (p() === 'green-event') {
        env.actionRow.hidden = true;
        if (env.elapsed() >= 15) env.route.appendChild(env.button('Move to shelter', function () { g().observed = true; env.go('shelter'); }, 'to-shelter', true));
        return;
      }
      G.stops.filter(function (s) { return p() === 'shelter' ? s.id === 'shelter' : s.id !== 'shelter'; }).forEach(function (s) {
        env.route.appendChild(env.button('Walk to ' + s.name, function () { env.setTarget({ x: s.x, z: s.z }); }, 'travel-' + s.id));
      }); updateInteraction();
    }
    function nearby() { return G.stops.find(function (s) { return Math.hypot(g().x - s.x, g().z - s.z) < 1.6 && (p() === 'shelter' ? s.id === 'shelter' : s.id !== 'shelter'); }); }
    function updateInteraction() { var s = nearby(); env.interactButton.textContent = s ? (p() === 'shelter' ? 'Enter shelter' : 'Observe from this spot') + ' · E' : 'Approach a marked stop · E'; env.interactButton.disabled = !s; }
    function interact() {
      var s = nearby(); if (!s) return;
      if (p() === 'green') { g().spot = s.id; env.go('green-event'); }
      else if (p() === 'shelter') {
        g().sheltered = true; env.go('shelter');
      }
    }
    function shelterCard() {
        env.showCard('Shelter reached', 'Eli did not see a first shooter. Your observations are invented gameplay, not Revere’s testimony. [PIVOT]');
        add('Aftermath, document paraphrase: 8 colonists killed, 10 wounded; 1 British soldier wounded. [OUTCOME]');
        b('Leave 1775 for the evidence room', function () { env.go('study'); }, 'enter-study', true); b('Read my scene notes', env.notebook, 'shelter-notebook'); env.panel.hidden = true;
    }
    function frame(dt, now, active, keys, yaw) {
      if (!scene) scene = env.W.makeGreen(env.lex, G.stops);
      scene.group.visible = true;
      var s = g(), dx = 0, dz = 0;
      if (['green', 'shelter'].includes(p()) && active && !s.sheltered) {
        var target = env.target();
        if (target) { dx = target.x - s.x; dz = target.z - s.z; if (Math.hypot(dx, dz) < 0.12) { s.x = target.x; s.z = target.z; env.setTarget(null); dx = dz = 0; save(); } }
        else { var f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0); dx = -Math.sin(yaw) * f + Math.cos(yaw) * r; dz = -Math.cos(yaw) * f - Math.sin(yaw) * r; }
        var len = Math.hypot(dx, dz), step = target ? Math.min(dt * 4, len) : dt * 4;
        if (len) { s.x = Math.max(0, Math.min(19, s.x + dx / len * step)); s.z = Math.max(-20, Math.min(-13, s.z + dz / len * step)); }
      }
      scene.pose(s.x, s.z, dx, dz, now / 1000, p(), env.elapsed(), s.spot, yaw);
      if (p() === 'green-event' && active) {
        env.tick(dt);
        var t = env.elapsed(); env.objective.textContent = G.captions[t < 6 ? 0 : t < 10 ? 1 : 2];
        if (t >= 15 && !env.route.querySelector('#to-shelter')) render();
      } else if (['green', 'shelter'].includes(p()) && !s.sheltered) updateInteraction();
      env.W.renderer.render(env.lex.scene, env.W.cam);
    }
    function hide() { if (scene) scene.group.visible = false; }
    return { render: render, frame: frame, interact: interact, hide: hide, finishFocus: finishFocus, reset: function () { draft = null; focusSince = null; } };
  }
  window.WL_SLICE = { phases: phases, modern: modern, fresh: fresh, valid: valid, create: create };
})();
