/* WL-MUSIC2: public-domain tune excerpts, newly arranged for a small Web Audio ensemble. */
(function () {
  'use strict';
  // MIDI pitch and quarter-note duration. These are abbreviated instrumental arrangements,
  // not archival transcriptions or a claim about music played on Lexington Green.
  var tunes = [
    { id: 'yankee-doodle', root: 60, notes: [
      [72,1],[72,1],[74,1],[76,1],[72,1],[76,1],[74,2],
      [67,1],[67,1],[72,1],[72,1],[74,1],[76,1],[72,2],
      [71,1],[67,1],[72,1],[72,1],[74,1],[76,1],[77,1],[76,1],
      [74,1],[72,1],[71,1],[67,1],[69,1],[71,1],[72,2],[72,2]] },
    { id: 'british-grenadiers', root: 67, notes: [
      [67,1],[71,1],[71,1],[72,1],[74,2],[74,1],[76,1],
      [74,1],[72,1],[71,1],[69,1],[67,3],[67,1],
      [67,1],[71,1],[71,1],[72,1],[74,2],[74,1],[76,1],
      [74,1],[72,1],[71,1],[69,1],[67,4],
      [74,1],[74,1],[76,1],[78,1],[79,2],[78,1],[76,1],
      [74,1],[72,1],[71,1],[69,1],[67,2],[71,2],
      [72,1],[71,1],[69,1],[67,1],[69,2],[66,2],[67,4]] },
    { id: 'minuet-in-g', root: 67, notes: [
      [74,1],[67,0.5],[69,0.5],[71,0.5],[72,0.5],[74,1],[67,1],[67,1],
      [76,1],[72,0.5],[74,0.5],[76,0.5],[78,0.5],[79,1],[67,1],[67,1],
      [72,1],[74,0.5],[72,0.5],[71,0.5],[69,0.5],[71,1],[72,0.5],[71,0.5],[69,0.5],[67,0.5],
      [66,1],[67,0.5],[69,0.5],[71,0.5],[67,0.5],[71,1],[69,2],
      [74,1],[67,0.5],[69,0.5],[71,0.5],[72,0.5],[74,1],[67,1],[67,1],
      [76,1],[72,0.5],[74,0.5],[76,0.5],[78,0.5],[79,1],[67,1],[67,1],
      [72,1],[74,0.5],[72,0.5],[71,0.5],[69,0.5],[71,1],[72,0.5],[71,0.5],[69,0.5],[67,0.5],
      [69,1],[71,0.5],[69,0.5],[67,0.5],[66,0.5],[67,3]] },
    { id: 'french-air', root: 60, notes: [
      [72,1],[72,1],[79,1],[79,1],[81,1],[81,1],[79,2],
      [77,1],[77,1],[76,1],[76,1],[74,1],[74,1],[72,2],
      [79,1],[79,1],[77,1],[77,1],[76,1],[76,1],[74,2],
      [79,1],[79,1],[77,1],[77,1],[76,1],[76,1],[74,2],
      [72,1],[72,1],[79,1],[79,1],[81,1],[81,1],[79,2],
      [77,1],[77,1],[76,1],[76,1],[74,1],[74,1],[72,2]] }
  ];
  var moods = {
    night: { bpm: 88, level: 0.72, lead: ['fiddle', 'harpsichord'], bass: 'harpsichord', stride: 8, drums: 0, shift: -12 },
    muster: { bpm: 112, level: 0.85, lead: ['fife', 'fiddle'], bass: 'harpsichord', stride: 4, drums: 1, shift: 0 },
    green: { bpm: 64, level: 0.65, lead: ['fiddle', 'fife'], bass: 'fiddle', stride: 8, drums: 0, shift: -12 },
    study: { bpm: 82, level: 0.6, lead: ['harpsichord', 'fiddle'], bass: 'harpsichord', stride: 4, drums: 0, shift: -12 }
  };
  function moodFor(phase) {
    if (['intro', 'opening', 'blackout', 'green-event'].includes(phase)) return null;
    if (['rewind', 'ride', 'complete'].includes(phase)) return 'night';
    if (['dawn', 'muster', 'muster-complete'].includes(phase)) return 'muster';
    if (['green', 'shelter'].includes(phase)) return 'green';
    return 'study';
  }
  window.WL_MUSIC = function (changed) {
    var context = null, master, noise, timer, next = 0, note = 0, beat = 0;
    var pulse = 0;
    var started = false, muted = false, unavailable = false, pageAway = false;
    var mood = null, tune = null, bag = [], lastTune = null, arrangement = 0, setting;
    var active = new Set();
    function status() { return { started: started, muted: muted, unavailable: unavailable }; }
    function silent() { return muted || document.hidden || pageAway || !mood; }
    function stopVoices() {
      active.forEach(function (v) {
        var gain = v.envelope.gain, time = context.currentTime;
        if (v.time >= time) { v.source.stop(time); return; }
        if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(time);
        else {
          // Older implementations need the current value captured before cancellation.
          var value = gain.value; gain.cancelScheduledValues(time); gain.setValueAtTime(value, time);
        }
        gain.setTargetAtTime(0.0001, time, 0.006);
        v.source.stop(context.currentTime + 0.03);
      });
    }
    function fail() {
      unavailable = true; clearInterval(timer);
      if (master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.value = 0; }
      changed(status());
    }
    function voice(pitch, time, duration, instrument, level) {
      var snare = instrument === 'snare', drum = snare || instrument === 'drum';
      var source = snare ? context.createBufferSource() : context.createOscillator();
      var envelope = context.createGain(), filter = context.createBiquadFilter();
      if (snare) { source.buffer = noise; filter.type = 'bandpass'; filter.frequency.value = 1700; }
      else {
        source.type = instrument === 'fiddle' || instrument === 'harpsichord' ? 'sawtooth' : 'triangle';
        source.frequency.setValueAtTime(drum ? 125 : 440 * Math.pow(2, (pitch - 69) / 12), time);
        if (drum) source.frequency.exponentialRampToValueAtTime(48, time + duration);
        filter.type = 'lowpass';
        filter.frequency.value = instrument === 'fife' ? 3200 : instrument === 'fiddle' ? 1800 : 2400;
      }
      var attack = instrument === 'fiddle' ? 0.045 : instrument === 'fife' ? 0.018 : 0.004;
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(level, time + attack);
      if (instrument === 'fiddle' || instrument === 'fife') envelope.gain.setValueAtTime(level * 0.7, time + duration * 0.65);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      source.connect(filter); filter.connect(envelope); envelope.connect(master);
      var v = { source: source, envelope: envelope, time: time }; active.add(v);
      source.onended = function () { active.delete(v); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      source.start(time); source.stop(time + duration + 0.01);
    }
    function rest() { return 20 + Math.random() * 20; }
    function beginTune() {
      if (!bag.length) {
        bag = tunes.slice();
        for (var i = bag.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1)), swap = bag[i]; bag[i] = bag[j]; bag[j] = swap;
        }
      }
      // A new bag and a scene transition must also avoid repeating the previous tune.
      if (bag[0].id === lastTune) { var first = bag.shift(); bag.push(first); }
      tune = bag.shift(); lastTune = tune.id; note = 0; beat = 0; pulse = 0;
      var variant = arrangement++ % 2, m = moods[mood];
      setting = { tick: 60 / (m.bpm + (variant ? 6 : -4)), lead: m.lead[variant], mood: m };
    }
    function schedule() {
      if (!context || context.state !== 'running' || silent() || unavailable) return;
      try {
        next = Math.max(next, context.currentTime + 0.02);
        while (next < context.currentTime + 0.2) {
          if (!tune) beginTune();
          var entry = tune.notes[note], m = setting.mood, tick = setting.tick;
          var length = entry[1] * tick;
          voice(entry[0] + m.shift, next, length * (setting.lead === 'harpsichord' ? 0.62 : 0.88), setting.lead, 0.18 * m.level);
          // Night uses a quiet open fifth rather than a busy major-key accompaniment.
          while (pulse < beat + entry[1]) {
            var at = next + (pulse - beat) * tick;
            if (pulse % m.stride === 0) {
              voice(tune.root - 12, at, tick * 1.5, m.bass, 0.055 * m.level);
              voice(tune.root - 5, at, tick * 1.5, m.bass, 0.025 * m.level);
              if (mood === 'study') voice(tune.root + 4, at + tick * 0.5, tick, 'harpsichord', 0.025);
            }
            if (m.drums) voice(0, at, 0.12, pulse % 2 ? 'snare' : 'drum', 0.1 * m.level);
            pulse++;
          }
          beat += entry[1]; next += length; note++;
          if (note === tune.notes.length) { tune = null; next += rest(); }
        }
      } catch (e) { fail(); }
    }
    function sync() {
      changed(status());
      if (!started || unavailable) return;
      try {
        if (!context) {
          // Begin/Resume is the only context-creation path; never autoplay on page load.
          var Audio = window.AudioContext || window.webkitAudioContext;
          context = new Audio(); master = context.createGain();
          master.gain.value = 0; master.connect(context.destination);
          noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
          var samples = noise.getChannelData(0);
          for (var i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          timer = setInterval(schedule, 100);
        }
        master.gain.setTargetAtTime(silent() ? 0 : 0.12, context.currentTime, 0.015);
        var operation = silent() ? context.suspend() : context.resume();
        operation.then(schedule).catch(fail);
      } catch (e) { fail(); }
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { pageAway = true; sync(); });
    window.addEventListener('pageshow', function () { pageAway = false; sync(); });
    return {
      start: function () { started = true; sync(); },
      toggle: function () { muted = !muted; sync(); },
      scene: function (phase) {
        var selected = moodFor(phase);
        if (selected === mood) return;
        mood = selected;
        if (context && !unavailable) {
          try { stopVoices(); } catch (e) { fail(); return; }
          // Preserve an existing playlist rest, and leave a full rest after an interrupted tune.
          next = Math.max(tune ? context.currentTime + 0.03 + rest() : next, context.currentTime + 0.05);
        }
        tune = null; sync();
      },
      status: status
    };
  };
})();
