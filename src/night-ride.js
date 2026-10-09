/* WL-S1: opening, rewind, and Eli's fictional alarm errand. No scoring changes. */
(function () {
  'use strict';
  var D = window.WL_NIGHT, T = window.THREE, host = document.getElementById('witness-game');
  var STORE = 'witness-lexington-s1-v1', keys = {}, target = null, yaw = 0, drag = null;
  var paused = false, elapsed = 0, last = performance.now(), storageOK = true, modalReturn = null, replaying = false;
  host.classList.add('wl');
  var W = window.WGWorld.create(host), lex = W.makeLex(), night = W.makeNight();
  W.canvas.setAttribute('aria-label', 'Low-poly Lexington scene. Use the labeled travel buttons or WASD to ride.');
  var state = fresh(), saved = readSave();

  function fresh() { return { phase: 'intro', accepted: false, asked: false, visited: [], returned: false, x: 0, z: 44 }; }
  function valid(s) {
    return s && ['rewind', 'ride', 'complete'].includes(s.phase) && typeof s.accepted === 'boolean' &&
      typeof s.asked === 'boolean' && typeof s.returned === 'boolean' && Array.isArray(s.visited) &&
      s.visited.length <= 2 && new Set(s.visited).size === s.visited.length &&
      s.visited.every(function (id) { return id === 'lantern' || id === 'orchard'; }) &&
      Number.isFinite(s.x) && Math.abs(s.x) <= 1.6 && Number.isFinite(s.z) && s.z >= 0 && s.z <= 46 &&
      (!s.visited.length || s.accepted) && (!s.returned || s.visited.length === 2) &&
      (s.phase !== 'complete' || s.returned) && (s.phase !== 'rewind' || !s.accepted);
  }
  function readSave() {
    try {
      var raw = localStorage.getItem(STORE), s;
      try { s = JSON.parse(raw); } catch (e) { return null; }
      return s && s.version === 1 && valid(s.run) ? s.run : null;
    }
    catch (e) { storageOK = false; return null; }
  }
  function save() {
    if (!['rewind', 'ride', 'complete'].includes(state.phase)) return;
    try { localStorage.setItem(STORE, JSON.stringify({ version: 1, run: state })); saved = JSON.parse(JSON.stringify(state)); }
    catch (e) { storageOK = false; }
    notice.textContent = storageOK ? 'Progress saves on this device.' : 'Saving is unavailable. Refresh will lose this run.';
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n;
  }
  function button(text, action, id, primary) {
    var b = el('button', primary ? 'primary' : '', text); b.type = 'button';
    if (id) b.id = id; b.addEventListener('click', action); return b;
  }
  function paragraph(parent, text, cls) { parent.appendChild(el('p', cls || '', text)); }
  var top = el('div', 'top'), brand = el('div', 'brand'), tools = el('div', 'row');
  brand.appendChild(el('b', '', 'Witness Lexington')); var chapter = el('small', '', 'The night alarm'); brand.appendChild(chapter);
  var notebookButton = button('Notebook', notebook, 'notebook');
  var pauseButton = button('Pause', function () { setPaused(!paused); }, 'pause');
  tools.append(notebookButton, pauseButton); top.append(brand, tools); host.appendChild(top);
  var panel = el('section', 'panel'), objective = el('p'), route = el('div', 'row route'), actionRow = el('div', 'row');
  var interactButton = button('Talk with Revere · E', interact, 'interact', true);
  var feedback = el('small'); feedback.setAttribute('role', 'status');
  var notice = el('div', 'notice'); notice.textContent = storageOK ? 'Progress saves on this device.' : 'Saving is unavailable. Refresh will lose this run.';
  actionRow.append(interactButton, feedback); panel.append(objective, route, actionRow, notice); host.appendChild(panel);
  var overlay = el('section', 'overlay'), card = el('div', 'card'); overlay.appendChild(card); host.appendChild(overlay);
  var dialog = document.createElement('dialog'); host.appendChild(dialog);
  dialog.addEventListener('close', function () {
    clearMovement();
    if (modalReturn && modalReturn.isConnected && !modalReturn.disabled && modalReturn.getClientRects().length) modalReturn.focus();
    else if (state.phase === 'ride') interactButton.focus();
    modalReturn = null;
  });
  function clearMovement() { keys = {}; target = null; drag = null; }
  function openDialog(title) {
    clearMovement(); modalReturn = document.activeElement; dialog.replaceChildren();
    var header = el('header'); header.appendChild(el('h2', '', title)); dialog.appendChild(header);
    dialog.showModal();
  }
  function closeControl() {
    var row = el('div', 'close'); row.appendChild(button('Close', function () { dialog.close(); }, 'close-dialog')); dialog.appendChild(row);
  }
  function sourceNote(parent, text, id) { paragraph(parent, text + ' ' + id, 'tag'); }
  function notebook() {
    openDialog('Eli\'s notebook');
    paragraph(dialog, 'Eli is fictional. Errands and speech are dramatized. These gameplay notes are not primary testimony.');
    dialog.appendChild(el('h3', '', 'Opening captions'));
    D.captions.concat([D.pivot, D.rewind]).forEach(function (c) { paragraph(dialog, c.text + ' ' + c.source); });
    dialog.appendChild(el('h3', '', 'Fictional gameplay observations'));
    var ids = [];
    if (state.accepted) ids.push('warning'); if (state.asked) ids.push('question');
    ids = ids.concat(state.visited); if (state.returned) ids.push('returned');
    if (!ids.length) paragraph(dialog, 'No alarm observations collected yet.');
    ids.forEach(function (id, i) { paragraph(dialog, (i + 1) + '. ' + D.records[id]); });
    dialog.appendChild(el('h3', '', 'Historical context and citations'));
    D.sources.forEach(function (s) {
      var a = el('article'); paragraph(a, s.id + ' ' + s.label); paragraph(a, s.note);
      var link = el('a', '', 'Passage and source reference'); link.href = 'SOURCES.md#' + s.anchor;
      link.target = '_blank'; link.rel = 'noopener'; a.appendChild(link); dialog.appendChild(a);
    });
    paragraph(dialog, 'Full source register: CREDITS.md. Historical documents, evidence ranking, and the essay arrive in a later slice.');
    closeControl();
  }
  function showCard(title, text, tag) {
    card.replaceChildren(); if (tag) paragraph(card, tag, 'tag'); card.appendChild(el('h1', '', title)); paragraph(card, text);
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', title);
    overlay.hidden = false; overlay.classList.toggle('black', state.phase === 'blackout');
  }
  function go(phase) {
    clearMovement(); paused = false; elapsed = 0; state.phase = phase;
    if (dialog.open) dialog.close(); save(); render();
  }
  function rewind() { go('rewind'); }
  function render() {
    chapter.textContent = state.phase === 'ride' ? 'Night of April 18 · fictional errand' : 'The night alarm';
    panel.hidden = state.phase !== 'ride'; overlay.hidden = true;
    top.inert = paused || state.phase !== 'ride' && state.phase !== 'opening';
    panel.inert = paused || state.phase !== 'ride' && state.phase !== 'opening';
    pauseButton.disabled = ['intro', 'blackout', 'rewind', 'complete'].includes(state.phase);
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    top.hidden = state.phase === 'blackout';
    if (paused) {
      showCard('Paused', 'The scene and your horse are stopped.');
      card.appendChild(button('Resume', function () { setPaused(false); }, 'resume', true)); return;
    }
    if (state.phase === 'intro') {
      showCard('Witness Lexington', 'A warning in the night. A question at dawn. Play Eli, a fictional 12-year-old Lexington resident.', 'Slice A · The night alarm');
      paragraph(card, 'Your errands are dramatized. Historical context has source labels in your notebook. No combat or timer.');
      var start = button('Begin the opening', function () { go('opening'); }, 'begin', true); card.appendChild(start);
      if (saved) card.appendChild(button('Resume saved alarm', function () { state = JSON.parse(JSON.stringify(saved)); go(state.phase); }, 'load'));
    } else if (state.phase === 'opening') {
      panel.hidden = false; route.replaceChildren(); actionRow.hidden = true; notice.hidden = true;
      route.appendChild(button('Skip to rewind', function () { go('blackout'); }, 'skip'));
      caption();
    } else if (state.phase === 'blackout') {
      showCard(D.pivot.text, 'The camera cut away before any shot. This opening cannot identify a first shooter.', D.pivot.source);
      card.appendChild(button(replaying ? 'Return to the alarm checkpoint' : 'Rewind to the night', function () {
        if (replaying) { replaying = false; go('complete'); } else rewind();
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
      paragraph(card, 'Dawn muster is the next slice. It is not playable in this build.');
      paragraph(card, storageOK ? 'Checkpoint saved on this device. You can return to your notebook after a refresh.' : 'Saving is unavailable. Keep this page open to retain your notebook.');
      card.appendChild(button('Read the notebook', notebook, 'end-notebook', true));
      card.appendChild(button('Replay the opening', function () { replaying = true; go('opening'); }, 'replay'));
      card.appendChild(button('Restart this run', restart, 'restart'));
    }
  }
  function restart() {
    openDialog('Restart this run?'); paragraph(dialog, 'This clears the saved alarm and Eli\'s gameplay observations.');
    dialog.appendChild(button('Clear and restart', function () {
      try { localStorage.removeItem(STORE); } catch (e) { storageOK = false; }
      saved = null; state = fresh(); replaying = false; dialog.close(); go('intro');
    }, 'confirm-restart', true)); closeControl();
  }
  function caption() {
    var i = Math.min(2, Math.floor(elapsed / 7)); objective.textContent = D.captions[i].text + ' ' + D.captions[i].source;
  }
  function updateObjective() {
    objective.textContent = !state.accepted ? 'Meet Revere at the parsonage. This encounter is dramatized. [NIGHT]' :
      state.visited.length < 2 ? 'Carry the warning to both fictional households. Alarmed ' + state.visited.length + ' of 2. Choose either order.' :
      'Both households are alarmed. Return to the parsonage meeting point.';
  }
  function nearby() {
    return D.stops.find(function (s) { return Math.hypot(state.x, state.z - s.z) < 3.5; });
  }
  function updateInteraction() {
    var s = nearby(), text = 'Approach a marked stop · E';
    if (s) text = s.id === 'parsonage' ? (state.visited.length === 2 ? 'Finish the alarm · E' : 'Talk with Revere · E') :
      (state.visited.includes(s.id) ? 'Revisit ' : 'Alert ') + s.name + ' · E';
    if (interactButton.textContent !== text) interactButton.textContent = text;
    interactButton.disabled = !s || (!state.accepted && s.id !== 'parsonage');
  }
  function interact() {
    if (state.phase !== 'ride' || paused || dialog.open) return;
    var s = nearby(); if (!s || (!state.accepted && s.id !== 'parsonage')) return;
    if (s.id === 'parsonage' && state.visited.length === 2) { state.returned = true; go('complete'); return; }
    openDialog(s.id === 'parsonage' ? 'Paul Revere' : s.name);
    sourceNote(dialog, s.id === 'parsonage' ? 'Dramatized dialogue. These are invented words, not a quotation.' : 'Fictional character · Dramatized dialogue.', s.id === 'parsonage' ? '[NIGHT]' : '');
    paragraph(dialog, s.id === 'parsonage' ? D.revere[0] : D.resident);
    if (s.id === 'parsonage') {
      var answer = el('p');
      dialog.appendChild(button('Who told you?', function () {
        state.asked = true; answer.textContent = D.revere[1] + ' · Dramatized dialogue'; save();
      }, 'ask-source')); dialog.appendChild(answer);
      paragraph(dialog, 'Fictional errand: borrow this horse, carry the warning to the Lantern and Orchard households, then return here. You are not retracing Revere\'s historical ride.');
      dialog.appendChild(button(state.accepted ? 'Continue the errand' : 'Accept the alarm errand', function () {
        state.accepted = true; dialog.close(); updateObjective(); render(); save();
      }, 'accept', true));
    } else {
      paragraph(dialog, 'Eli passes on the warning heard at the parsonage. Eli has not seen the column. This exchange is invented.');
      dialog.appendChild(button(state.visited.includes(s.id) ? 'Already recorded · continue' : 'Record the alarm and continue', function () {
        if (!state.visited.includes(s.id)) state.visited.push(s.id);
        dialog.close(); updateObjective(); save();
      }, 'record-alarm', true));
    }
    closeControl();
  }
  function setPaused(value) {
    if (!['opening', 'ride'].includes(state.phase) || dialog.open) return;
    paused = value; clearMovement(); render(); save();
    if (paused) card.querySelector('button').focus(); else pauseButton.focus();
  }
  function movingKey(k) { return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k); }
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (dialog.open) return;
    if (k === 'tab' && !overlay.hidden) {
      var buttons = Array.from(card.querySelectorAll('button')).filter(function (b) { return !b.disabled; });
      var first = buttons[0], end = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && document.activeElement === end || !card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      return;
    }
    if (k === 'escape') { e.preventDefault(); setPaused(!paused); return; }
    if (k === 'n' && !e.repeat) { e.preventDefault(); notebook(); return; }
    if (paused || state.phase !== 'ride') return;
    if (movingKey(k)) { e.preventDefault(); keys[k] = true; target = null; }
    if (k === 'e' && !e.repeat) { e.preventDefault(); interact(); }
  });
  window.addEventListener('keyup', function (e) { delete keys[e.key.toLowerCase()]; });
  window.addEventListener('blur', function () { clearMovement(); setPaused(true); });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearMovement(); setPaused(true); } });
  W.canvas.addEventListener('pointerdown', function (e) {
    if (state.phase === 'ride' && !paused && !dialog.open) { drag = e.clientX; W.canvas.setPointerCapture(e.pointerId); }
  });
  W.canvas.addEventListener('pointermove', function (e) {
    if (drag !== null) { yaw += (drag - e.clientX) * 0.006; drag = e.clientX; }
  });
  W.canvas.addEventListener('pointerup', function () { drag = null; });
  W.canvas.addEventListener('pointercancel', function () { drag = null; });
  function resize() {
    W.renderer.setSize(host.clientWidth, host.clientHeight, false);
    W.cam.aspect = host.clientWidth / Math.max(1, host.clientHeight); W.cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize(); render();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var opening = ['intro', 'opening', 'blackout'].includes(state.phase);
    if (state.phase === 'opening' && !paused && !dialog.open) {
      elapsed += dt; caption(); if (elapsed >= 22) go('blackout');
    }
    if (opening) {
      // No firing events or replay plan is ever invoked. Hide the seed's leading officer.
      lex.poseCutscene(state.phase === 'intro' ? 15 : Math.min(19.5, 7 + elapsed * 0.65)); lex.horse.visible = false;
      W.cam.position.set(27, 19, 34); W.cam.lookAt(0, 1, 4); W.renderer.render(lex.scene, W.cam);
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
          var step = target ? Math.min(dt * 7, length) : dt * 7;
          state.x = Math.max(-1.6, Math.min(1.6, state.x + dx / length * step));
          state.z = Math.max(0, Math.min(46, state.z + dz / length * step));
          night.horse.rotation.y = Math.atan2(-dx, -dz);
        }
      }
      night.horse.position.set(state.x, 0, state.z);
      night.legs.forEach(function (leg, i) { leg.rotation.x = dx || dz ? Math.sin(now / 140 + i * 1.6) * 0.4 : 0; });
      night.rings.forEach(function (ring, i) { ring.material.color.set(state.visited.includes(D.stops[i].id) ? 0x83c4b2 : 0xffd18b); });
      W.cam.position.set(state.x + Math.sin(yaw) * 14, 10, state.z + Math.cos(yaw) * 14);
      W.cam.lookAt(state.x, 1.5, state.z - 1); W.renderer.render(night.scene, W.cam);
      if (state.phase === 'ride') updateInteraction();
    }
    requestAnimationFrame(frame);
  }
  // Read-only snapshot for reviewer diagnostics. No scene seeking or source-scoring bypass.
  window.WitnessGame = { snapshot: function () { return JSON.parse(JSON.stringify({ run: state, paused: paused, elapsed: elapsed, assisted: !!target, storageOK: storageOK, dialog: dialog.open })); } };
  requestAnimationFrame(frame);
})();
