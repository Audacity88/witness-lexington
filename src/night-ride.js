/* WL-S1/S2/S3: the playable day and modern investigation. No scoring changes. */
(function () {
  'use strict';
  var D = window.WL_NIGHT, B = window.WL_DAWN, host = document.getElementById('witness-game');
  var STORE = 'witness-lexington-s1-v1', keys = {}, target = null, yaw = 0, drag = null;
  var paused = false, elapsed = 0, last = performance.now(), storageOK = true, modalReturn = null, replaying = false, replayPhase = 'complete', dawn = null;
  host.classList.add('wl');
  var W = window.WGWorld.create(host), lex = W.makeLex(), night = W.makeNight();
  W.canvas.setAttribute('aria-label', 'Low-poly Lexington scene. Use labeled travel buttons or WASD to ride or walk.');
  W.canvas.setAttribute('tabindex', '-1');
  var state = fresh(), saved = readSave(), slice;
  var S = window.WL_SLICE;
  function later() { return S.phases.includes(state.phase); }
  function modern() { return S.modern.includes(state.phase); }
  function greenWalking() { return ['green', 'shelter'].includes(state.phase) && !state.green.sheltered; }

  function freshDawn() { return { met: false, delivered: false, listened: [], questions: [], boundary: false, x: -11, z: -9 }; }
  function fresh() { return { phase: 'intro', accepted: false, asked: false, visited: [], returned: false, x: 0, z: 44, dawn: freshDawn(), green: window.WL_SLICE.fresh() }; }
  function uniqueIDs(list, allowed) {
    return Array.isArray(list) && list.length <= allowed.length && new Set(list).size === list.length &&
      list.every(function (id) { return allowed.includes(id); });
  }
  function validDawn(d) {
    return d && typeof d.met === 'boolean' && typeof d.delivered === 'boolean' && typeof d.boundary === 'boolean' &&
      uniqueIDs(d.listened, ['near', 'far']) && uniqueIDs(d.questions, ['militia', 'town']) &&
      Number.isFinite(d.x) && d.x >= -13 && d.x <= 13 && Number.isFinite(d.z) && d.z >= -16 && d.z <= -8 &&
      (d.met || !d.delivered && !d.listened.length && !d.questions.length && !d.boundary) &&
      (!d.boundary || d.delivered && d.listened.length === 2 && d.questions.length === 2);
  }
  function musterDone() { var d = state.dawn; return d.delivered && d.listened.length === 2 && d.questions.length === 2; }
  function onFoot() { return state.phase === 'muster'; }
  function playable() { return state.phase === 'ride' || onFoot() || greenWalking() || state.phase === 'green-event'; }
  function valid(s) {
    return s && ['rewind', 'ride', 'complete', 'dawn', 'muster', 'muster-complete'].concat(window.WL_SLICE.phases).includes(s.phase) && typeof s.accepted === 'boolean' &&
      typeof s.asked === 'boolean' && typeof s.returned === 'boolean' && Array.isArray(s.visited) &&
      s.visited.length <= 2 && new Set(s.visited).size === s.visited.length &&
      s.visited.every(function (id) { return id === 'lantern' || id === 'orchard'; }) &&
      Number.isFinite(s.x) && Math.abs(s.x) <= 1.6 && Number.isFinite(s.z) && s.z >= 0 && s.z <= 46 &&
      (!s.visited.length || s.accepted) && (!s.returned || s.visited.length === 2) &&
      (!['complete', 'dawn', 'muster', 'muster-complete'].concat(window.WL_SLICE.phases).includes(s.phase) || s.returned) &&
      (s.phase !== 'rewind' || !s.accepted) && validDawn(s.dawn) &&
      (!['rewind', 'ride', 'complete', 'dawn'].includes(s.phase) || !s.dawn.met && !s.dawn.delivered && !s.dawn.listened.length && !s.dawn.questions.length && !s.dawn.boundary) &&
      (!['muster-complete'].concat(window.WL_SLICE.phases).includes(s.phase) || s.dawn.boundary) &&
      window.WL_SLICE.valid(s.green, s.phase) &&
      (window.WL_SLICE.phases.includes(s.phase) || !s.green.spot && !s.green.observed && !s.green.sheltered && !s.green.inspected.length);
  }
  function readSave() {
    try {
      var raw = localStorage.getItem(STORE), s;
      try { s = JSON.parse(raw); } catch (e) { return null; }
      // Upgrade the WL-S1 checkpoint in place, keeping its alarm and notebook.
      if (s && s.version === 1 && s.run && !s.run.dawn && ['rewind', 'ride', 'complete'].includes(s.run.phase)) s.run.dawn = freshDawn();
      if (s && s.version === 1 && s.run && !s.run.green) s.run.green = window.WL_SLICE.fresh();
      if (s && s.run && s.run.green) {
        window.WL_SLICE.migrate(s.run.green);
        // Older essay checkpoints allowed fact contradictions. Keep their draft and revise the hypothesis.
        if (['essay', 'finished'].includes(s.run.phase) && window.WL_SLICE.valid(s.run.green, 'hypothesis') &&
          s.run.green.hypothesis && !window.WL_CHECK.score(s.run.green.hypothesis.version).accepted) s.run.phase = 'hypothesis';
        // Changed content rules must not discard a structurally valid completed draft.
        if (s.run.phase === 'finished' && window.WL_SLICE.valid(s.run.green, 'essay') &&
          (!window.WL_CHECK.essay(s.run.green.essay, s.run.green.inspected, s.run.green.hypothesis).passed || window.WL_SLICE.authorship(s.run.green).flags.length)) s.run.phase = 'essay';
      }
      return s && s.version === 1 && valid(s.run) ? s.run : null;
    }
    catch (e) { storageOK = false; return null; }
  }
  function save() {
    if (slice) slice.finishFocus(true);
    if (!['rewind', 'ride', 'complete', 'dawn', 'muster', 'muster-complete'].concat(window.WL_SLICE.phases).includes(state.phase)) return;
    try { localStorage.setItem(STORE, JSON.stringify({ version: 1, run: state })); saved = JSON.parse(JSON.stringify(state)); }
    catch (e) { storageOK = false; }
    notice.textContent = storageOK ? 'Progress saves on this device.' : 'Saving is unavailable. Refresh will lose this run.';
    if (studyNotice) studyNotice.textContent = notice.textContent;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n;
  }
  function button(text, action, id, primary) {
    var b = el('button', primary ? 'primary' : '', text); b.type = 'button';
    if (id) b.id = id; b.addEventListener('click', action); return b;
  }
  // Source tags such as [NIGHT] render as rubric spans; the text itself is unchanged.
  function rich(node, text) {
    var parts = String(text).split(/(\[[A-Z0-9]+\])/);
    if (parts.length === 1) { node.textContent = text; return node; }
    node.textContent = '';
    parts.forEach(function (part, i) { if (part) node.appendChild(el('span', i % 2 ? 'src' : '', part)); });
    return node;
  }
  function setText(node, text) { if (node.textContent !== text) rich(node, text); }
  function paragraph(parent, text, cls) { parent.appendChild(rich(el('p', cls || ''), text)); }
  var top = el('div', 'top'), brand = el('div', 'brand'), tools = el('div', 'row');
  brand.appendChild(el('b', '', 'Witness Lexington')); var chapter = el('small', '', 'Dawn of April 19 · reconstructed opening'); brand.appendChild(chapter);
  var notebookButton = button('Notebook', notebook, 'notebook');
  var pauseButton = button('Pause', function () { setPaused(!paused); }, 'pause');
  var musicButton = button('Mute music', function () { music.toggle(); }, 'music');
  var musicLabel = el('span', '', 'Mute music');
  musicButton.replaceChildren(musicLabel);
  var music = window.WL_MUSIC(function (s) {
    musicButton.setAttribute('aria-pressed', String(s.muted));
    musicLabel.textContent = s.muted ? 'Play music' : 'Mute music';
    musicButton.setAttribute('aria-label', musicLabel.textContent);
    musicButton.disabled = s.unavailable;
    musicButton.title = s.unavailable ? 'Music is unavailable in this browser.' : s.started ? 'Synthesized background music' : 'Music starts when you begin or resume a run.';
  });
  musicButton.setAttribute('aria-pressed', 'false');
  musicButton.setAttribute('aria-label', 'Mute music');
  musicButton.title = 'Music starts when you begin or resume a run.';
  tools.append(notebookButton, pauseButton, musicButton); top.append(brand, tools); host.appendChild(top);
  var panel = el('section', 'panel'), objective = el('p'), route = el('div', 'row route'), actionRow = el('div', 'row');
  var interactButton = button('Talk with Revere · E', interact, 'interact', true);
  var feedback = el('small'); feedback.setAttribute('role', 'status');
  var notice = el('div', 'notice'); notice.textContent = storageOK ? 'Progress saves on this device.' : 'Saving is unavailable. Refresh will lose this run.';
  actionRow.append(interactButton, feedback); panel.append(objective, route, actionRow, notice); host.appendChild(panel);
  var overlay = el('section', 'overlay'), card = el('div', 'card'), studyNotice = el('p', 'notice');
  studyNotice.setAttribute('role', 'status'); overlay.appendChild(card); host.appendChild(overlay);
  var dialog = document.createElement('dialog'); host.appendChild(dialog);
  dialog.addEventListener('close', function () {
    placeMusic();
    if (modalReturn && modalReturn.isConnected && !modalReturn.disabled && modalReturn.getClientRects().length) modalReturn.focus();
    else if (playable()) interactButton.focus();
    modalReturn = null;
  });
  function clearMovement() { keys = {}; target = null; drag = null; }
  function openDialog(title, kind) {
    clearMovement(); modalReturn = document.activeElement; dialog.replaceChildren(); dialog.className = kind || 'talk';
    dialog.setAttribute('aria-label', title);
    var header = el('header'); header.setAttribute('data-initial', title.charAt(0)); header.appendChild(el('h2', '', title)); dialog.appendChild(header);
    dialog.showModal();
  }
  // The dialog's primary action shares the sticky footer with Close so it never falls below the fold.
  function closeControl() {
    var row = el('div', 'close');
    Array.from(dialog.children).filter(function (n) { return n.tagName === 'BUTTON' && n.className === 'primary'; }).forEach(function (n) { row.appendChild(n); });
    row.appendChild(button('Close', function () { dialog.close(); }, 'close-dialog')); row.appendChild(musicButton); dialog.appendChild(row);
  }
  function sourceNote(parent, text, id) { paragraph(parent, text + ' ' + id, 'tag'); }
  function notebook() {
    openDialog('Eli\'s notebook', 'notebook');
    paragraph(dialog, 'Eli is fictional. Errands and speech are dramatized. These gameplay notes are not primary testimony.');
    dialog.appendChild(el('h3', '', 'Opening captions'));
    D.captions.concat([D.pivot, D.rewind]).forEach(function (c) { paragraph(dialog, c.text + ' ' + c.source); });
    dialog.appendChild(el('h3', '', 'Fictional gameplay observations'));
    var ids = [];
    if (state.accepted) ids.push('warning'); if (state.asked) ids.push('question');
    ids = ids.concat(state.visited); if (state.returned) ids.push('returned');
    if (!ids.length) paragraph(dialog, 'No alarm observations collected yet.');
    ids.forEach(function (id, i) { paragraph(dialog, (i + 1) + '. ' + D.records[id]); });
    dialog.appendChild(el('h3', '', 'Dawn muster observations · fictional gameplay'));
    var d = state.dawn, dawnIDs = [];
    if (d.met) dawnIDs.push('parker'); if (d.delivered) dawnIDs.push('delivered');
    dawnIDs = dawnIDs.concat(d.listened, d.questions); if (d.boundary) dawnIDs.push('boundary');
    if (!dawnIDs.length) paragraph(dialog, 'No dawn observations collected yet.');
    dawnIDs.forEach(function (id) { paragraph(dialog, B.records[id]); });
    dialog.appendChild(el('h3', '', 'Historical context and citations'));
    D.sources.concat([B.source]).forEach(function (s) {
      var a = el('article'); paragraph(a, s.id + ' ' + s.label); paragraph(a, s.note);
      var link = el('a', '', 'Passage and source reference'); link.href = window.WL_SOURCES_URL || 'SOURCES.md#' + s.anchor;
      link.target = '_blank'; link.rel = 'noopener'; a.appendChild(link); dialog.appendChild(a);
    });
    dialog.appendChild(el('h3', '', 'Green observations · fictional gameplay'));
    if (state.green.observed) paragraph(dialog, window.WL_GREEN.records[state.green.spot]);
    if (state.green.sheltered) paragraph(dialog, window.WL_GREEN.records.shelter);
    if (!state.green.observed) paragraph(dialog, 'No Green observations recorded yet.');
    if (state.green.sheltered) {
      dialog.appendChild(el('h3', '', 'Inspected historical sources'));
      window.WG_DATA.cards.filter(function (c) { return state.green.inspected.includes(c.id); }).forEach(function (c) { paragraph(dialog, c.title + ' ' + c.source); });
      if (state.green.rank.length === 2) paragraph(dialog, 'Your usefulness order: ' + state.green.rank.map(function (id) { return window.WG_DATA.cards.find(function (c) { return c.id === id; }).title; }).join(', ') + '. Your limitation: ' + state.green.limitation);
      if (state.green.hypothesis) { var v = state.green.hypothesis.version, data = window.WG_DATA; paragraph(dialog, 'Your last tested hypothesis: ' + data.shooters[v.shooter].label + '; ' + data.zones[v.location].label + '; ' + data.aftermaths[v.aftermath].label + '. This was a test, not a witnessed first shot.'); }
    }
    paragraph(dialog, 'Full source register: CREDITS.md. Inspect historical documents individually in the evidence room.');
    closeControl();
  }
  function showCard(title, text, tag) {
    card.replaceChildren(); card.className = 'card'; if (tag) paragraph(card, tag, 'tag kicker');
    var heading = el('h1', '', title); heading.setAttribute('tabindex', '-1'); card.appendChild(heading); paragraph(card, text);
    studyNotice.textContent = notice.textContent; if (later()) card.appendChild(studyNotice);
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', title);
    card.classList.toggle('study-card', later() && modern() && !paused);
    overlay.hidden = false; overlay.classList.toggle('black', state.phase === 'blackout');
    overlay.classList.toggle('study', later() && modern());
  }
  function go(phase) {
    if (slice) slice.finishFocus();
    clearMovement(); paused = false; elapsed = 0; state.phase = phase; feedback.textContent = '';
    if (dialog.open) dialog.close(); save(); render();
  }
  function rewind() { go('rewind'); }
  // Every overlay card gets a scrolling body and a fixed action footer, as the study cards already do.
  function splitCard() {
    if (overlay.hidden || card.querySelector('.card-scroll')) return;
    var body = el('div', 'card-scroll'), actions = el('div', 'card-actions');
    Array.from(card.children).forEach(function (n) { (n.tagName === 'BUTTON' ? actions : body).appendChild(n); });
    card.append(body, actions);
    card.querySelector('h1').focus();
  }
  function placeMusic() {
    var footer = dialog.open ? dialog.querySelector('.close') : !overlay.hidden ? card.querySelector('.card-actions') : tools;
    if (footer) footer.appendChild(musicButton);
  }
  function render() {
    var hadCardFocus = overlay.contains(document.activeElement);
    music.pause(paused); music.scene(state.phase); tools.appendChild(musicButton); draw(); splitCard(); placeMusic();
    if (overlay.hidden && hadCardFocus) W.canvas.focus();
  }
  function draw() {
    panel.classList.toggle('is-caption', state.phase === 'opening');
    chapter.textContent = ['intro', 'opening', 'blackout'].includes(state.phase) ? 'Dawn of April 19 · reconstructed opening' : later() ? modern() ? 'Modern study · evidence and answer' : 'Lexington Green · reconstructed scene' : ['dawn', 'muster', 'muster-complete'].includes(state.phase) ? 'Dawn of April 19 · dramatized muster' : state.phase === 'ride' ? 'Night of April 18 · fictional errand' : 'The night alarm';
    panel.hidden = !playable(); overlay.hidden = true;
    top.inert = paused || !playable() && state.phase !== 'opening';
    panel.inert = paused || !playable() && state.phase !== 'opening';
    pauseButton.disabled = !playable() && state.phase !== 'opening';
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    top.hidden = state.phase === 'blackout';
    if (paused) {
      showCard('Paused', 'The scene and your movement are stopped.');
      card.appendChild(button('Resume', function () { setPaused(false); }, 'resume', true)); return;
    }
    if (state.phase === 'intro') {
      showCard('Witness Lexington', 'A warning in the night. A question at dawn. Play Eli, a fictional 12-year-old Lexington resident.', 'Night alarm, dawn muster, Green, and investigation');
      card.classList.add('is-title'); card.querySelector('h1').replaceChildren(el('span', 'title-kicker', 'Witness'), el('span', '', ' '), el('span', 'title-main', 'Lexington'));
      paragraph(card, 'Your errands are dramatized. Historical context has source labels in your notebook. No combat or timer.');
      var start = button('Begin the opening', function () { music.start(); go('opening'); }, 'begin', true); card.appendChild(start);
      if (saved) card.appendChild(button('Resume saved run', function () { music.start(); state = JSON.parse(JSON.stringify(saved)); go(state.phase); }, 'load'));
    } else if (state.phase === 'opening') {
      panel.hidden = false; route.replaceChildren(); actionRow.hidden = true; notice.hidden = true;
      route.appendChild(button('Skip to rewind', function () { go('blackout'); }, 'skip'));
      caption();
    } else if (state.phase === 'blackout') {
      showCard(D.pivot.text, 'The camera cut away before any shot. This opening cannot identify a first shooter.', D.pivot.source);
      card.appendChild(button(replaying ? 'Return to the saved checkpoint' : 'Rewind to the night', function () {
        if (replaying) { replaying = false; go(replayPhase); } else rewind();
      }, 'rewind', true));
      card.appendChild(button('Read captions and sources', notebook, 'black-notebook'));
    } else if (state.phase === 'rewind') {
      showCard(D.rewind.text, 'You are Eli. Meet the dramatized Revere at the parsonage, then carry a warning to two fictional households.', D.rewind.source);
      paragraph(card, 'Ride with WASD or the arrow keys. Drag to look. Press E near a stop, or use its interaction button. Travel buttons steer for you. N opens the notebook; Escape pauses or closes a dialog.');
      paragraph(card, 'Learn to ask who supplied a report and whether they saw it themselves. Your borrowed horse and lane are invented.');
      card.appendChild(button('Start the night alarm', function () { go('ride'); }, 'start-ride', true));
    } else if (state.phase === 'ride') {
      actionRow.hidden = false; notice.hidden = false; route.replaceChildren();
      D.stops.forEach(function (s) {
        var b = button('Ride to ' + s.name, function () { target = { x: 0, z: s.z }; feedback.textContent = 'Riding to ' + s.name + '. Movement keys cancel assistance.'; }, 'travel-' + s.id);
        b.disabled = !state.accepted && s.id !== 'parsonage'; route.appendChild(b);
      });
      updateObjective(); updateInteraction();
    } else if (state.phase === 'complete') {
      showCard('Alarm complete', 'Both households have heard the warning, and Eli is back at the meeting point.', 'WL-S1 checkpoint');
      paragraph(card, 'You heard reports. You did not see the regulars on the road. A warning can help people prepare without proving who will fire first.');
      paragraph(card, 'Continue on foot to the dawn muster. Your alarm notes stay in the notebook.');
      card.appendChild(button('Continue to dawn muster', function () { go('dawn'); }, 'continue-dawn', true));
      paragraph(card, storageOK ? 'Checkpoint saved on this device. You can return to your notebook after a refresh.' : 'Saving is unavailable. Keep this page open to retain your notebook.');
      card.appendChild(button('Read the notebook', notebook, 'end-notebook'));
      card.appendChild(button('Replay the opening', function () { replayPhase = state.phase; replaying = true; go('opening'); }, 'replay'));
      card.appendChild(button('Restart this run', restart, 'restart'));
    } else if (state.phase === 'dawn') {
      showCard('Dawn muster', B.caption, 'WL-S2 · Simplified reconstruction');
      paragraph(card, 'Eli leaves the borrowed horse and continues on foot. First, meet Parker at the marked stop.');
      paragraph(card, 'Learn what distance can hide. Missing words cannot tell you anyone\'s intent or who will fire first. Speech and the hearing experiment are dramatized, not historical quotations.');
      paragraph(card, 'WASD or arrows walk; drag to look; E interacts. Travel buttons assist movement. N opens the notebook; Escape pauses. There is no timer or combat.');
      card.appendChild(button('Walk to the muster', function () { yaw = 0; go('muster'); }, 'start-muster', true));
    } else if (onFoot()) {
      actionRow.hidden = false; notice.hidden = false; route.replaceChildren();
      B.stops.filter(function (s) { return objectiveStops().includes(s.id); }).forEach(function (s) {
        var b = button('Walk to ' + s.name, function () {
          target = { x: s.x, z: s.z }; feedback.textContent = 'Walking to ' + s.name + '. Movement keys cancel assistance.';
        }, 'travel-' + s.id);
        route.appendChild(b);
      });
      updateObjective(); updateInteraction();
    } else if (state.phase === 'muster-complete') {
      showCard('Muster complete', 'Eli delivered the message, compared both listening spots, and found the spectator boundary.', 'WL-S2 checkpoint · Fictional gameplay');
      paragraph(card, 'You heard a complete simulated instruction nearby and missing words farther away. A partial order does not establish intent or a first shooter.');
      paragraph(card, 'Choose a spectator spot on the Green, then investigate historical documents in the modern evidence room.');
      card.appendChild(button('Continue to the Green', function () { yaw = 0; go('green'); }, 'continue-green', true));
      paragraph(card, storageOK ? 'Checkpoint saved on this device.' : 'Saving is unavailable. Keep this page open to retain your notebook.');
      card.appendChild(button('Read the notebook', notebook, 'end-notebook'));
      card.appendChild(button('Replay the opening', function () { replayPhase = state.phase; replaying = true; go('opening'); }, 'replay'));
      card.appendChild(button('Restart this run', restart, 'restart'));
    } else if (later()) slice.render();
  }
  function restart() {
    openDialog('Restart this run?', 'confirm'); paragraph(dialog, 'This clears the saved run and Eli\'s gameplay observations.');
    dialog.appendChild(button('Clear and restart', function () {
      try { localStorage.removeItem(STORE); } catch (e) { storageOK = false; }
      saved = null; slice.reset(); state = fresh(); replaying = false; dialog.close(); go('intro');
    }, 'confirm-restart', true)); closeControl();
  }
  function caption() {
    var i = Math.min(2, Math.floor(elapsed / 7)); setText(objective, D.captions[i].text + ' ' + D.captions[i].source);
  }
  function updateObjective() {
    if (onFoot()) {
      var d = state.dawn;
      setText(objective, !d.met ? 'Meet Parker at the marked stop. Speech is dramatized. [FORMATION] [COMMAND]' :
        !d.delivered ? 'Deliver Parker\'s invented message to the marked fictional militiaman.' :
        d.listened.length < 2 ? 'Message delivered. Compare the listening spots. Recorded ' + d.listened.length + '/2. [COMMAND]' :
        d.questions.length < 2 ? 'Ask the fictional witnesses about their reports. Asked ' + d.questions.length + '/2.' :
        'Find the spectator boundary and record the limits of what you heard.');
      return;
    }
    setText(objective, !state.accepted ? 'Meet Revere at the parsonage. This encounter is dramatized. [NIGHT]' :
      state.visited.length < 2 ? 'Carry the warning to both fictional households. Alarmed ' + state.visited.length + ' of 2. Choose either order.' :
      'Both households are alarmed. Return to the parsonage meeting point.');
  }
  // Stops the current objective points to. Their scene labels stay visible, or pin to the screen edge.
  function objectiveStops() {
    if (state.phase === 'ride') {
      if (!state.accepted || state.visited.length === 2) return ['parsonage'];
      return ['lantern', 'orchard'].filter(function (id) { return !state.visited.includes(id); });
    }
    if (!onFoot()) return [];
    var d = state.dawn;
    if (!d.met) return ['parker'];
    if (!d.delivered) return ['militia'];
    if (d.listened.length < 2) return ['near', 'far'].filter(function (id) { return !d.listened.includes(id); });
    if (d.questions.length < 2) return ['militia', 'town'].filter(function (id) { return !d.questions.includes(id); });
    return d.boundary ? [] : ['boundary'];
  }
  function nearby() {
    if (onFoot()) return B.stops.find(function (s) { return Math.hypot(state.dawn.x - s.x, state.dawn.z - s.z) < 1.6; });
    return D.stops.find(function (s) { return Math.hypot(state.x, state.z - s.z) < 3.5; });
  }
  function updateInteraction() {
    var s = nearby(), text = 'Approach a marked stop · E';
    if (onFoot()) {
      interactButton.textContent = s ? (s.id === 'near' || s.id === 'far' ? 'Listen at ' : s.id === 'boundary' ? 'Inspect ' : 'Talk with ') + s.name + ' · E' : 'Approach a marked stop · E';
      interactButton.disabled = !s || !state.dawn.met && s.id !== 'parker'; return;
    }
    if (s) text = s.id === 'parsonage' ? (state.visited.length === 2 ? 'Finish the alarm · E' : 'Talk with Revere · E') :
      (state.visited.includes(s.id) ? 'Revisit ' : 'Alert ') + s.name + ' · E';
    if (interactButton.textContent !== text) interactButton.textContent = text;
    interactButton.disabled = !s || (!state.accepted && s.id !== 'parsonage');
  }
  function interact() {
    if (!playable() || paused || dialog.open || !overlay.hidden) return;
    if (greenWalking()) { slice.interact(); return; }
    if (onFoot()) { interactDawn(); return; }
    var s = nearby(); if (!s || (!state.accepted && s.id !== 'parsonage')) return;
    if (s.id === 'parsonage' && state.visited.length === 2) { state.returned = true; go('complete'); return; }
    openDialog(s.id === 'parsonage' ? 'Paul Revere' : s.name);
    sourceNote(dialog, s.id === 'parsonage' ? 'Dramatized dialogue. These are invented words, not a quotation.' : 'Fictional character · Dramatized dialogue.', s.id === 'parsonage' ? '[NIGHT]' : '');
    paragraph(dialog, s.id === 'parsonage' ? D.revere[0] : D.resident);
    if (s.id === 'parsonage') {
      if (!state.asked) {
        dialog.appendChild(button('Who told you?', function () {
          state.asked = true; save(); dialog.close(); interact();
        }, 'ask-source', true));
      } else {
        paragraph(dialog, D.revere[1] + ' · Dramatized dialogue');
        dialog.appendChild(button('Hear the errand', revereErrand, 'hear-errand', true));
      }
    } else {
      paragraph(dialog, 'Eli passes on the warning heard at the parsonage. Eli has not seen the column. This exchange is invented.');
      dialog.appendChild(button(state.visited.includes(s.id) ? 'Already recorded · continue' : 'Record the alarm and continue', function () {
        if (!state.visited.includes(s.id)) state.visited.push(s.id);
        dialog.close(); updateObjective(); save();
      }, 'record-alarm', true));
    }
    closeControl();
  }
  function revereErrand() {
    dialog.close(); openDialog('The alarm errand');
    sourceNote(dialog, 'Fictional gameplay. Not Revere\'s historical ride.', '');
    paragraph(dialog, 'Borrow this horse, carry the warning to the Lantern and Orchard households, then return here.');
    dialog.appendChild(button(state.accepted ? 'Continue the errand' : 'Accept the alarm errand', function () {
      state.accepted = true; dialog.close(); render(); save();
    }, 'accept', true));
    closeControl();
  }
  function interactDawn() {
    var s = nearby(), d = state.dawn;
    if (!s || !d.met && s.id !== 'parker') return;
    openDialog(s.name);
    if (s.id === 'parker') {
      sourceNote(dialog, 'Dramatized dialogue. Invented words, not a quotation.', '[FORMATION] [COMMAND]');
      paragraph(dialog, B.parker);
      paragraph(dialog, 'Fictional errand: carry a reminder to the marked militiaman to listen for orders. Eli does not cause any historical order or outcome.');
      dialog.appendChild(button(d.met ? 'Continue the muster' : 'Accept the message', function () { clearMovement(); d.met = true; modalReturn = W.canvas; dialog.close(); render(); save(); }, 'accept-message', true));
    } else if (s.id === 'near' || s.id === 'far') {
      sourceNote(dialog, 'Dramatized hearing experiment. Displayed text represents hearing; this scene is silent.', '[COMMAND]');
      paragraph(dialog, B.hearing[s.id]);
      paragraph(dialog, s.id === 'near' ? 'Nearby, the whole simulated instruction is clear.' : 'Farther away, some words are unclear. The gaps are simulated, not a trimmed primary-source quotation.');
      paragraph(dialog, 'Historical context, paraphrase: the cited account describes some men not hearing Parker\'s raspy command. This invented experiment cannot reconstruct what any real individual heard. [COMMAND]');
      dialog.appendChild(button(d.listened.includes(s.id) ? 'Already recorded · continue' : 'Record this listening spot', function () {
        if (!d.listened.includes(s.id)) d.listened.push(s.id); dialog.close(); render(); save();
      }, 'record-listening', true));
    } else if (s.id === 'militia' || s.id === 'town') {
      sourceNote(dialog, 'Fictional character · Dramatized dialogue. Not historical testimony.', '');
      if (s.id === 'militia' && !d.delivered) {
        paragraph(dialog, 'Pass on the reminder to listen for orders. This message relay is invented.');
        dialog.appendChild(button('Deliver the message', function () {
          d.delivered = true; dialog.close(); render(); save();
        }, 'deliver-message', true));
      } else if (!d.delivered || d.listened.length < 2) {
        paragraph(dialog, !d.delivered ? 'First deliver Parker\'s invented message to the marked militiaman.' : 'Next, compare the two listening spots.');
      } else if (d.questions.includes(s.id)) {
        paragraph(dialog, (s.id === 'militia' ? B.militiaman : B.townsperson) + ' · Dramatized dialogue');
      } else {
        dialog.appendChild(button(s.id === 'militia' ? 'What could you hear?' : 'What could you see?', function () {
          d.questions.push(s.id); save(); dialog.close(); render(); interactDawn();
        }, 'ask-' + s.id, true));
      }
    } else {
      sourceNote(dialog, 'Fictional gameplay boundary. The marked location is not a historical fact.', '');
      paragraph(dialog, 'Stay at the spectator edge. Eli has no weapon and will not join the ranks.');
      if (musterDone()) {
        paragraph(dialog, 'Compare your notebook: hearing a report or part of an instruction does not establish who fired first.');
        dialog.appendChild(button('Record the boundary and finish the muster', function () { d.boundary = true; go('muster-complete'); }, 'finish-muster', true));
      } else paragraph(dialog, objective.textContent);
    }
    closeControl();
  }
  function setPaused(value) {
    if (!playable() && state.phase !== 'opening' || dialog.open) return;
    paused = value; clearMovement(); render(); save();
    if (paused) card.querySelector('button').focus(); else pauseButton.focus();
  }
  function movingKey(k) { return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k); }
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (dialog.open) return;
    if (k === 'tab' && !overlay.hidden) {
      var buttons = Array.from(card.querySelectorAll('button, a[href], select, textarea, input, summary')).filter(function (b) { return !b.disabled && b.getClientRects().length; });
      var first = buttons[0], end = buttons[buttons.length - 1];
      if (!first) { e.preventDefault(); return; }
      var outside = !card.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card.querySelector('h1') || outside)) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && (document.activeElement === end || outside)) { e.preventDefault(); first.focus(); }
      return;
    }
    if (['TEXTAREA', 'INPUT', 'SELECT'].includes(e.target.tagName)) return;
    if (k === 'escape') { e.preventDefault(); if (!e.repeat) setPaused(!paused); return; }
    if (k === 'n' && !e.repeat) { e.preventDefault(); notebook(); return; }
    if (paused || !playable() || !overlay.hidden || state.phase === 'green-event') return;
    if (movingKey(k)) { e.preventDefault(); keys[k] = true; target = null; }
    if (k === 'e' && !e.repeat) { e.preventDefault(); interact(); }
  });
  window.addEventListener('keyup', function (e) { delete keys[e.key.toLowerCase()]; });
  window.addEventListener('blur', function () { clearMovement(); setPaused(true); });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearMovement(); setPaused(true); } });
  W.canvas.addEventListener('pointerdown', function (e) {
    if (playable() && state.phase !== 'green-event' && !paused && !dialog.open && overlay.hidden) { drag = e.clientX; W.canvas.setPointerCapture(e.pointerId); }
  });
  W.canvas.addEventListener('pointermove', function (e) {
    if (drag !== null) { yaw += (drag - e.clientX) * 0.006; drag = e.clientX; }
  });
  W.canvas.addEventListener('pointerup', function () { drag = null; });
  W.canvas.addEventListener('pointercancel', function () { drag = null; });
  function resize() {
    var width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    W.renderer.setSize(width, height, false);
    W.cam.aspect = width / height; W.cam.updateProjectionMatrix();
  }
  slice = S.create({ W: W, lex: lex, card: card, panel: panel, overlay: overlay, actionRow: actionRow, notice: notice,
    route: route, objective: objective, interactButton: interactButton, el: el, paragraph: paragraph, button: button, setText: setText,
    showCard: showCard, placeMusic: placeMusic, go: go, notebook: notebook, restart: restart, save: save,
    state: function () { return state; }, target: function () { return target; }, setTarget: function (t) { target = t; },
    elapsed: function () { return elapsed; }, tick: function (dt) { elapsed += dt; }
  });
  // Scene labels are laid out clear of the brand plate, HUD buttons and bottom panel.
  W.labelAvoid = function () {
    var o = W.canvas.getBoundingClientRect();
    return [brand, tools, panel].filter(function (n) { return !n.hidden && n.getClientRects().length; }).map(function (n) {
      var r = n.getBoundingClientRect();
      return { left: r.left - o.left - 4, top: r.top - o.top - 4, right: r.right - o.left + 8, bottom: r.bottom - o.top + 8 };
    });
  };
  new ResizeObserver(resize).observe(host); resize(); render();
  function frame(now) {
    var dt = Math.max(0, (now - last) / 1000), moveDt = Math.min(0.05, dt); last = now;
    var opening = ['intro', 'opening', 'blackout'].includes(state.phase);
    if (state.phase === 'opening' && !paused && !dialog.open) {
      elapsed += dt; caption(); if (elapsed >= 22) go('blackout');
    }
    if (!later()) slice.hide();
    if (later()) {
      if (dawn) dawn.group.visible = false;
      slice.frame(dt, now, !paused && !dialog.open, keys, yaw);
    } else if (opening) {
      // No firing events or replay plan is ever invoked. Hide the seed's leading officer.
      if (dawn) dawn.group.visible = false;
      lex.regs.forEach(function (r) { r.visible = true; });
      lex.poseCutscene(state.phase === 'intro' ? 15 : Math.min(19.5, 7 + elapsed * 0.65)); lex.horse.visible = false;
      W.labelFocus = []; W.cam.position.set(27, 19, 34); W.cam.lookAt(0, 1, 4); W.renderer.render(lex.scene, W.cam);
    } else if (['dawn', 'muster', 'muster-complete'].includes(state.phase)) {
      if (!dawn) dawn = W.makeDawn(lex, B.stops);
      dawn.group.visible = true; lex.regs.forEach(function (r) { r.visible = false; }); lex.horse.visible = false;
      var d = state.dawn, mx = 0, mz = 0;
      if (onFoot() && d.met && !paused && !dialog.open) {
        if (target) {
          mx = target.x - d.x; mz = target.z - d.z;
          if (Math.hypot(mx, mz) < 0.12) { d.x = target.x; d.z = target.z; target = null; mx = mz = 0; feedback.textContent = 'Arrived. Use the interaction button or E.'; save(); }
        } else {
          var f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
          var r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
          mx = -Math.sin(yaw) * f + Math.cos(yaw) * r; mz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
        }
        var len = Math.hypot(mx, mz), step = target ? Math.min(moveDt * 4, len) : moveDt * 4;
        if (len) { d.x = Math.max(-13, Math.min(13, d.x + mx / len * step)); d.z = Math.max(-16, Math.min(-8, d.z + mz / len * step)); }
      }
      dawn.pose(d.x, d.z, mx, mz, now / 1000);
      dawn.rings.forEach(function (ring, i) {
        var id = B.stops[i].id, done = id === 'parker' ? d.met : id === 'militia' ? d.delivered && d.questions.includes(id) : id === 'boundary' ? d.boundary : d.listened.includes(id) || d.questions.includes(id);
        ring.done = done;
      });
      W.cam.position.set(d.x + Math.sin(yaw) * 12, 10, d.z + Math.cos(yaw) * 12);
      W.labelFocus = objectiveStops(); W.cam.lookAt(d.x, 1, d.z + 3); W.renderer.render(dawn.scene, W.cam);
      if (onFoot()) updateInteraction();
    } else {
      var dx = 0, dz = 0;
      if (state.phase === 'ride' && state.accepted && !paused && !dialog.open) {
        if (target) {
          dx = target.x - state.x; dz = target.z - state.z;
          if (Math.hypot(dx, dz) < 0.15) { state.x = target.x; state.z = target.z; target = null; dx = dz = 0; feedback.textContent = 'Arrived. Use the interaction button or E.'; save(); }
        } else {
          var forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
          var right = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
          dx = -Math.sin(yaw) * forward + Math.cos(yaw) * right;
          dz = -Math.cos(yaw) * forward - Math.sin(yaw) * right;
        }
        var length = Math.hypot(dx, dz);
        if (length) {
          var step = target ? Math.min(moveDt * 7, length) : moveDt * 7;
          state.x = Math.max(-1.6, Math.min(1.6, state.x + dx / length * step));
          state.z = Math.max(0, Math.min(46, state.z + dz / length * step));
          night.horse.rotation.y = Math.atan2(-dx, -dz);
        }
      }
      night.horse.position.set(state.x, 0, state.z);
      night.legs.forEach(function (leg, i) { leg.rotation.x = !W.reducedMotion() && (dx || dz) ? Math.sin(now / 140 + i * 1.6) * 0.4 : 0; });
      night.rings.forEach(function (ring, i) { ring.done = state.visited.includes(D.stops[i].id); });
      W.cam.position.set(state.x + Math.sin(yaw) * 14, 10, state.z + Math.cos(yaw) * 14);
      W.labelFocus = objectiveStops(); W.cam.lookAt(state.x, 1.5, state.z - 1); W.renderer.render(night.scene, W.cam);
      if (state.phase === 'ride') updateInteraction();
    }
    requestAnimationFrame(frame);
  }
  // Read-only snapshot for reviewer diagnostics. No scene seeking or source-scoring bypass.
  window.WitnessGame = { snapshot: function () { return JSON.parse(JSON.stringify({ run: state, paused: paused, elapsed: elapsed, assisted: !!target, storageOK: storageOK, dialog: dialog.open, labels: W.labelBoxes || [] })); } };
  requestAnimationFrame(frame);
})();
