/* WL-S3 controller. One source at a time; no alternative first-shot animation. */
(function () {
  'use strict';
  var D = window.WG_DATA, E = window.WG_ESSAY, C = window.WL_CHECK, G = window.WL_GREEN;
  var phases = ['green', 'green-event', 'shelter', 'study', 'hypothesis', 'essay', 'finished'];
  var modern = ['study', 'hypothesis', 'essay', 'finished'];
  function telemetry() { return { keystrokes: 0, inputEvents: 0, deletes: 0, msFocused: 0, pasteAttempts: 0, dropAttempts: 0, typedChars: 0, unkeyedChars: 0, typingMs: 0, burst: 0, speedFlag: 0 }; }
  function authorship(g) {
    var t = g.tel, n = C.words(g.essay), ratio = g.essay.length ? t.typedChars / g.essay.length : 1;
    var wpm = n * 60000 / Math.max(1, t.typingMs);
    var flags = [];
    if (t.pasteAttempts || t.dropAttempts) flags.push('paste/drop attempt');
    if (g.essay.length >= E.telemetry.minCharsForRatio && ratio < E.telemetry.lowRatio) flags.push('low keystroke ratio');
    if (t.unkeyedChars) flags.push('text inserted without matching keystrokes');
    if (t.speedFlag || n >= E.telemetry.minWordsForSpeed && wpm > E.telemetry.maxWPM) flags.push('typing speed');
    if (t.burst) flags.push('typing burst');
    return { flags: flags, ratio: ratio, wordsPerMinute: Math.round(wpm), telemetry: Object.assign({}, t) };
  }
  function migrate(g) {
    if (g && g.tel && !Object.prototype.hasOwnProperty.call(g.tel, 'typedChars')) {
      Object.assign(g.tel, { typedChars: 0, unkeyedChars: g.essay ? g.essay.length : 0, typingMs: 0, burst: 0, speedFlag: 0 });
      g.priorFlags = []; g.result = null;
    }
  }
  function fresh() { return { x: 0, z: -15, spot: null, observed: false, sheltered: false, inspected: [], document: 'revere1775', rank: [], limitation: '', belief: null, hypothesis: null, essay: '', tel: telemetry(), priorFlags: [], result: null }; }
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
      !Array.isArray(g.priorFlags) || !g.priorFlags.every(function (r) { return r && Array.isArray(r.flags) && r.flags.every(function (f) { return typeof f === 'string'; }) && Number.isFinite(r.wordsPerMinute); }) ||
      !Object.keys(telemetry()).every(function (k) { return Number.isFinite(g.tel[k]) && g.tel[k] >= 0; }) ||
      g.hypothesis !== null && (!g.hypothesis || !versionOK(g.hypothesis.version)) ||
      g.observed && !g.spot || g.sheltered && !g.observed || g.inspected.length && !g.sheltered) return false;
    if (phase === 'green-event' && !g.spot || phase === 'shelter' && !g.observed || modern.includes(phase) && !g.sheltered) return false;
    if (['hypothesis', 'essay', 'finished'].includes(phase) && (g.inspected.length !== 9 || !ranked(g) || !g.belief)) return false;
    if (['essay', 'finished'].includes(phase) && (!g.hypothesis || !C.score(g.hypothesis.version).accepted)) return false;
    if (phase === 'finished' && (!C.essay(g.essay, g.inspected, g.hypothesis).passed || authorship(g).flags.length)) return false;
    return true;
  }
  function create(env) {
    var scene = null, focusSince = null, draft = null, body = env.card, actions = env.card;
    function g() { return env.state().green; }
    function p() { return env.state().phase; }
    function add(text, cls) { env.paragraph(body, text, cls); }
    function b(text, fn, id, primary) { var n = env.button(text, fn, id, primary); actions.appendChild(n); return n; }
    function showCard(title, text) {
      env.showCard(title, text);
      body = env.el('div', 'card-scroll'); actions = env.el('div', 'card-actions');
      Array.from(env.card.children).forEach(function (n) { body.appendChild(n); });
      env.card.append(body, actions);
    }
    function save() { env.save(); }
    function revealResult(result) {
      result.setAttribute('tabindex', '-1'); result.focus(); result.scrollIntoView({ block: 'start' });
    }
    function input(tag, label, id) {
      var l = env.el('label', '', label), n = env.el(tag); n.id = id; l.htmlFor = id; body.append(l, n); return n;
    }
    function select(label, id, entries, value, change) {
      var n = input('select', label, id);
      entries.forEach(function (e) { var o = env.el('option', '', e[1]); o.value = e[0]; n.appendChild(o); });
      n.value = value; n.addEventListener('change', function () { change(n.value); save(); }); return n;
    }
    function source(c) {
      add(c.sourceLabel + ' ' + c.source, 'tag');
      var a = env.el('a', '', 'Citation and passage'); a.href = window.WL_SOURCES_URL || 'SOURCES.md#' + c.anchor; a.target = '_blank'; a.rel = 'noopener'; body.appendChild(a);
    }
    function showDocument() {
      var s = g(), c = D.cards.find(function (c) { return c.id === s.document; });
      showCard('Evidence room · modern study', 'Read each source, then compare usefulness. This room is outside the 1775 story.');
      add('Inspected ' + s.inspected.length + '/9. Sources are shown individually; your draft stays on this device.', 'ledger');
      var pips = env.el('div', 'pips'); pips.setAttribute('aria-hidden', 'true');
      D.cards.forEach(function (card) { pips.appendChild(env.el('span', s.inspected.includes(card.id) ? 'pip done' : card.id === c.id ? 'pip current' : 'pip')); });
      body.appendChild(pips);
      select('Choose one document', 'document', D.cards.map(function (c) { return [c.id, c.title]; }), c.id, function (v) { s.document = v; render(); });
      body.appendChild(env.el('h2', '', c.title + (c.date ? ' · ' + c.date : ''))); source(c);
      if (c.id === 'doolittle') { var im = env.el('img'); im.src = window.WG_DOOLITTLE_SRC || 'assets/doolittle-plate1.webp'; im.alt = D.room.doolittle.alt; im.className = 'document-image'; body.appendChild(im); }
      else if (c.kind === 'testimony') add('Original scan not included. This card uses a cited excerpt or labeled paraphrase.');
      if (c.quotes) c.quotes.forEach(function (q) { body.appendChild(env.el('blockquote', '', q)); });
      if (c.summary) add((c.id === 'numbers' ? 'Reconstruction estimate: ' : 'Document paraphrase: ') + c.summary);
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
      var s = g(); body.appendChild(env.el('h2', '', 'Rank two sources by usefulness'));
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
      showCard('What do you believe so far?', 'A provisional belief is revisable. Testing an account does not prove it happened.');
      [['militia', 'Regulars may have fired first'], ['british', 'Militia may have fired first'], ['unsure', 'I cannot tell yet']].forEach(function (o) {
        b(o[1], function () { g().belief = o[0]; draft = null; env.go('hypothesis'); }, 'belief-' + o[0], true);
      });
    }
    function hypothesis() {
      var s = g(), old = draft || s.hypothesis && s.hypothesis.version;
      var v = old ? Object.assign({}, old) : Object.assign({ side: s.belief === 'british' ? 'british' : 'militia' }, D.sides[s.belief === 'british' ? 'british' : 'militia'].preset);
      showCard('Test a hypothesis', 'Choose a shooter, an allowed location, and what follows. These are proposed possibilities, not a replay of a known first shot.');
      add('Your provisional belief: ' + (s.belief === 'unsure' ? 'uncertain' : s.belief === 'militia' ? 'regulars may have fired first' : 'militia may have fired first') + '.');
      select('Account to test', 'account', Object.entries(D.sides).map(function (e) { return [e[0], e[1].label]; }), v.side, function (side) {
        // Changing accounts explicitly chooses its inherited preset, without changing belief.
        draft = Object.assign({ side: side }, D.sides[side].preset); render();
      });
      select('Possible shooter', 'shooter', Object.entries(D.shooters).map(function (e) { return [e[0], e[1].label]; }), v.shooter, function (id) {
        v.shooter = id; if (!D.shooters[id].zones.includes(v.location)) v.location = D.shooters[id].zones[0];
        location.replaceChildren(); zones(); clearResult();
      });
      var location = input('select', 'Allowed location', 'location');
      function zones() { D.shooters[v.shooter].zones.forEach(function (id) { var o = env.el('option', '', D.zones[id].label); o.value = id; location.appendChild(o); }); location.value = v.location; }
      zones(); location.addEventListener('change', function () { v.location = location.value; clearResult(); });
      select('Aftermath', 'aftermath', Object.entries(D.aftermaths).map(function (e) { return [e[0], e[1].label]; }), v.aftermath, function (id) { v.aftermath = id; clearResult(); });
      var writeAction = null;
      function clearResult() { result.replaceChildren(); result.className = ''; if (writeAction) { writeAction.remove(); writeAction = null; } }
      var result = env.el('div'); result.id = 'hypothesis-result'; result.setAttribute('role', 'status'); body.appendChild(result);
      b('Check this hypothesis', function () {
        draft = Object.assign({}, v); var sc = C.score(v); s.hypothesis = { version: Object.assign({}, v) }; save(); result.replaceChildren();
        result.className = sc.accepted ? 'verdict fits' : 'verdict contradicts';
        env.paragraph(result, sc.accepted ? 'Fits the inherited fact checks. This does not prove who fired first.' : 'Contradicts the inherited fact checks. Revise your hypothesis.');
        // Name every contradicting source for this test, regardless of the last viewed card.
        sc.redFacts.concat(sc.redTestimony).forEach(function (id) {
          var c = D.cards.find(function (c) { return c.id === id; });
          env.paragraph(result, c.title + ' ' + c.source + ': ' + sc.why[id].join(' '));
        });
        if (writeAction) writeAction.remove();
        writeAction = sc.accepted ? b('Write my answer', function () {
          if (C.score(v).accepted) env.go('essay');
        }, 'write-essay', true) : null;
        revealResult(result);
      }, 'check-hypothesis', true);
      b('Change provisional belief', belief, 'change-belief'); b('Inspect documents', function () { env.go('study'); }, 'hypothesis-documents');
    }
    function finishFocus(continueFocus) { if (focusSince !== null) { g().tel.msFocused += performance.now() - focusSince; focusSince = continueFocus ? performance.now() : null; } }
    function essay() {
      var s = g(); showCard('Your answer', E.question);
      add('Use at least ' + E.minRefs + ' evidence references and at least ' + E.minWords + ' words. Write at least three distinct claim sentences of five or more words each, connect evidence to your conclusion, and keep each sentence focused on one or two sources or facts. Use source details in complete claims and avoid repeated sentences or keyword lists. Address the opposing account and weigh it. Inspected historical cards count; your tested hypothesis can count once. Fictional speech is not primary testimony.');
      add('This is a local pattern check. Passing it does not settle history or confirm authorship. Confirmed outside authorship must be disqualified by teacher review outside this game.');
      var ta = input('textarea', 'Write your own answer', 'essay-text'); ta.rows = 8; ta.maxLength = 20000; ta.value = s.essay;
      var count = env.el('p', 'word-count'), warning = env.el('p'); warning.id = 'paste-warning'; warning.setAttribute('role', 'status'); body.append(count, warning);
      var result = env.el('div'); result.id = 'essay-result'; result.setAttribute('role', 'status'); body.appendChild(result);
      var finish = null, pending = 0, lastInput = null, burstStart = null, burstChars = 0;
      // Store edit deltas, not a full essay copy per keystroke. Native history may group multiple edits.
      var edits = [], editIndex = 0;
      function restoreCredit(text, direction) {
        var candidate = s.essay, index = editIndex;
        while (direction < 0 ? index > 0 : index < edits.length) {
          var edit = edits[direction < 0 ? --index : index++];
          var from = direction < 0 ? edit.inserted : edit.removed, to = direction < 0 ? edit.removed : edit.inserted;
          candidate = candidate.slice(0, edit.start) + to + candidate.slice(edit.start + from.length);
          if (candidate === text) {
            editIndex = index; s.tel.typedChars = direction < 0 ? edit.before : edit.after; return true;
          }
        }
        return false;
      }
      function update() {
        count.textContent = C.words(s.essay) + ' / ' + E.minWords + ' words'; result.replaceChildren(); s.result = { content: null, authorship: authorship(s), priorFlags: s.priorFlags.slice(), canFinish: false };
        if (finish) { finish.remove(); finish = null; }
      }
      function blocked(e, kind) {
        e.preventDefault(); s.tel[kind === 'drop' ? 'dropAttempts' : 'pasteAttempts']++; update();
        warning.textContent = 'Paste and drop are off. Retype your answer to finish. These flags are not proof of AI use.'; save();
      }
      ta.addEventListener('paste', function (e) { blocked(e, 'paste'); }); ta.addEventListener('drop', function (e) { blocked(e, 'drop'); });
      ta.addEventListener('dragover', function (e) { e.preventDefault(); });
      ta.addEventListener('beforeinput', function (e) {
        if (/^insertFrom(Paste|Drop)/.test(e.inputType || '')) { blocked(e, /Drop/.test(e.inputType) ? 'drop' : 'paste'); return; }
        // Native on-screen keyboards may send no printable keydown. Credit one trusted character, never a synthetic bulk insertion.
        if (!pending && e.isTrusted && e.inputType === 'insertText' && e.data && e.data.length === 1) pending = 1;
      });
      ta.addEventListener('keydown', function (e) {
        pending = !e.ctrlKey && !e.metaKey && e.key.length === 1 ? 1 : e.key === 'Enter' ? 1 : 0;
        if (pending || ['Backspace', 'Delete'].includes(e.key)) { s.tel.keystrokes++; if (['Backspace', 'Delete'].includes(e.key)) s.tel.deletes++; }
      });
      ta.addEventListener('keyup', function () { pending = 0; });
      ta.addEventListener('input', function (e) {
        var restored = e.isTrusted && /^history(Undo|Redo)$/.test(e.inputType || '') && restoreCredit(ta.value, e.inputType === 'historyUndo' ? -1 : 1);
        var old = s.essay, text = ta.value, a = 0, z = 0, now = performance.now();
        while (a < old.length && a < text.length && old[a] === text[a]) a++;
        while (z < old.length - a && z < text.length - a && old[old.length - 1 - z] === text[text.length - 1 - z]) z++;
        var inserted = text.length - a - z, before = s.tel.typedChars;
        if (!restored) {
          s.tel.typedChars = Math.max(0, s.tel.typedChars - (old.length - a - z)) + Math.min(pending, inserted); s.tel.unkeyedChars += Math.max(0, inserted - pending);
          edits.length = editIndex;
          edits.push({ start: a, removed: old.slice(a, old.length - z), inserted: text.slice(a, text.length - z), before: before, after: s.tel.typedChars });
          editIndex = edits.length;
          if (lastInput !== null) s.tel.typingMs += Math.min(now - lastInput, 2000);
          lastInput = now;
          if (burstStart === null || now - burstStart > E.telemetry.burstMs) { burstStart = now; burstChars = 0; }
          burstChars += inserted;
          if (burstChars >= E.telemetry.burstWords * 5) s.tel.burst++;
        }
        pending = 0;
        s.tel.inputEvents++; s.essay = text;
        if (authorship(s).flags.includes('typing speed')) s.tel.speedFlag = 1;
        update(); save();
      });
      ta.addEventListener('focus', function () { focusSince = performance.now(); });
      ta.addEventListener('blur', function () { pending = 0; finishFocus(); save(); }); update();
      b('Check my answer', function () {
        finishFocus(); if (document.activeElement === ta) focusSince = performance.now();
        var r = C.essay(s.essay, s.inspected, s.hypothesis), review = authorship(s); result.replaceChildren();
        if (finish) { finish.remove(); finish = null; }
        s.result = { content: r, authorship: review, priorFlags: s.priorFlags.slice(), canFinish: r.passed && !review.flags.length };
        if (review.flags.length) env.paragraph(result, 'Finish is blocked. Use Retype to start a fresh answer. If your input method keeps getting flagged, keep this draft and ask your teacher to review it outside the game. Your saved flags include earlier drafts; local Finish remains blocked.');
        env.paragraph(result, r.passed ? 'Content criteria met. Authorship still needs teacher review; this does not settle the first shot.' : 'Revise your answer using your inspected sources.');
        env.paragraph(result, 'Evidence ' + r.criteria.evidence.count + '/' + E.minRefs + '; other account ' + (r.criteria.otherSide.pass ? 'addressed' : 'needs weighing') + '; words ' + r.words + '/' + E.minWords + '.');
        r.hints.forEach(function (h) { env.paragraph(result, h); });
        env.paragraph(result, 'Local review flags: ' + (review.flags.join(', ') || 'none') + '. Accessibility input can affect these flags.');
        if (s.result.canFinish) finish = b('Finish this investigation', function () {
          if (C.essay(s.essay, s.inspected, s.hypothesis).passed && !authorship(s).flags.length) env.go('finished');
        }, 'finish-investigation', true); save(); revealResult(result);
      }, 'check-essay', true);
      b('Retype a fresh answer', function () {
        finishFocus();
        var review = authorship(s);
        if (review.flags.length) s.priorFlags.push(review);
        s.essay = ''; s.tel = telemetry(); s.result = null; save(); render();
      }, 'retype-essay');
      b('Revisit one document', function () { finishFocus(); env.go('study'); }, 'essay-documents');
      b('Revise my hypothesis', function () { finishFocus(); env.go('hypothesis'); }, 'essay-hypothesis');
      b('My scene notebook', env.notebook, 'essay-notebook');
    }
    function render() {
      if (p() === 'study') { showDocument(); return; }
      if (p() === 'hypothesis') { hypothesis(); return; }
      if (p() === 'essay') { essay(); return; }
      if (p() === 'finished') {
        showCard('Investigation complete', 'Your answer meets the local content criteria. The sources still leave the first shot unresolved. [PIVOT]');
        add('Your draft, notes, inspected sources, hypothesis, and authorship review flags are saved locally.');
        add('Current authorship flags: ' + (authorship(g()).flags.join(', ') || 'none') + '. Earlier flagged drafts: ' + g().priorFlags.length + '.');
        g().priorFlags.forEach(function (review, i) { add('Earlier draft ' + (i + 1) + ': ' + review.flags.join(', ') + '.'); });
        b('Read or revise my answer', function () { env.go('essay'); }, 'revise-essay', true); b('Read the notebook', env.notebook, 'end-notebook');
        b('Restart this run', env.restart, 'restart'); return;
      }
      if (p() === 'shelter' && g().sheltered) { shelterCard(); return; }
      env.overlay.hidden = true; env.panel.hidden = false; env.actionRow.hidden = false; env.notice.hidden = false; env.route.replaceChildren();
      env.panel.classList.toggle('is-caption', p() === 'green-event');
      env.setText(env.objective, p() === 'green' ? 'Choose either reconstructed spectator spot. Neither reveals a first shooter. [PIVOT]' : p() === 'shelter' ? 'Walk to the marked shelter. There is no timer or combat.' : G.captions[Math.min(2, Math.floor(env.elapsed() / 6))]);
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
        showCard('Shelter reached', 'Eli did not see a first shooter. Your observations are invented gameplay, not Revere’s testimony. [PIVOT]');
        add('Aftermath, document paraphrase: 8 colonists killed, 10 wounded; 1 British soldier wounded. [OUTCOME]');
        b('Leave 1775 for the evidence room', function () { env.go('study'); }, 'enter-study', true); b('Read my scene notes', env.notebook, 'shelter-notebook'); env.panel.hidden = true;
    }
    function frame(dt, now, active, keys, yaw) {
      if (!scene) scene = env.W.makeGreen(env.lex, G.stops);
      scene.group.visible = true;
      var s = g(), dx = 0, dz = 0, moveDt = Math.min(dt, 0.05);
      if (['green', 'shelter'].includes(p()) && active && !s.sheltered) {
        var target = env.target();
        if (target) { dx = target.x - s.x; dz = target.z - s.z; if (Math.hypot(dx, dz) < 0.12) { s.x = target.x; s.z = target.z; env.setTarget(null); dx = dz = 0; save(); } }
        else { var f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0); dx = -Math.sin(yaw) * f + Math.cos(yaw) * r; dz = -Math.cos(yaw) * f - Math.sin(yaw) * r; }
        var len = Math.hypot(dx, dz), step = target ? Math.min(moveDt * 4, len) : moveDt * 4;
        if (len) { s.x = Math.max(0, Math.min(19, s.x + dx / len * step)); s.z = Math.max(-20, Math.min(-13, s.z + dz / len * step)); }
      }
      scene.pose(s.x, s.z, dx, dz, now / 1000, p(), env.elapsed(), s.spot, yaw);
      if (p() === 'green-event' && active) {
        env.tick(dt);
        var t = env.elapsed(); env.setText(env.objective, G.captions[t < 6 ? 0 : t < 10 ? 1 : 2]);
        if (t >= 15 && !env.route.querySelector('#to-shelter')) render();
      } else if (['green', 'shelter'].includes(p()) && !s.sheltered) updateInteraction();
      env.W.renderer.render(env.lex.scene, env.W.cam);
    }
    function hide() { if (scene) scene.group.visible = false; }
    return { render: render, frame: frame, interact: interact, hide: hide, finishFocus: finishFocus, reset: function () { draft = null; focusSince = null; } };
  }
  window.WL_SLICE = { phases: phases, modern: modern, fresh: fresh, valid: valid, migrate: migrate, authorship: authorship, create: create };
})();
