/* WL-DEMO2: a quiet, synthesized Yankee Doodle phrase. No audio files. */
(function () {
  'use strict';
  window.WL_MUSIC = function (changed) {
    var context = null, master, noise, timer, next = 0, note = 0, beat = 0;
    var started = false, muted = false, unavailable = false;
    var tune = [[72,1],[72,1],[74,1],[76,1],[72,1],[76,1],[74,2],
      [67,1],[67,1],[72,1],[72,1],[74,1],[76,1],[72,2],
      [71,1],[67,1],[72,1],[72,1],[74,1],[76,1],[77,1],[76,1],
      [74,1],[72,1],[71,1],[67,1],[69,1],[71,1],[72,2],[72,2]];
    var tick = 0.23;
    function status() { return { started: started, muted: muted, unavailable: unavailable }; }
    function fail() {
      unavailable = true; clearInterval(timer);
      if (master) master.gain.value = 0;
      changed(status());
    }
    function voice(frequency, time, duration, drum) {
      var source = drum && beat % 4 === 2 ? context.createBufferSource() : context.createOscillator();
      var envelope = context.createGain();
      if ('buffer' in source) source.buffer = noise;
      else {
        source.type = drum ? 'triangle' : 'sine';
        source.frequency.setValueAtTime(frequency, time);
        if (drum) source.frequency.exponentialRampToValueAtTime(45, time + duration);
      }
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(drum ? 0.15 : 0.28, time + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
      source.connect(envelope); envelope.connect(master);
      source.onended = function () { source.disconnect(); envelope.disconnect(); };
      source.start(time); source.stop(time + duration + 0.01);
    }
    function schedule() {
      if (!context || context.state !== 'running' || muted || document.hidden || unavailable) return;
      next = Math.max(next, context.currentTime + 0.02);
      while (next < context.currentTime + 0.2) {
        var entry = tune[note];
        voice(440 * Math.pow(2, (entry[0] - 69) / 12), next, entry[1] * tick * 0.85, false);
        for (var i = 0; i < entry[1]; i++) {
          if (beat % 2 === 0) voice(120, next + i * tick, 0.09, true);
          beat++;
        }
        next += entry[1] * tick; note = (note + 1) % tune.length;
      }
    }
    function sync() {
      changed(status());
      if (!started || unavailable) return;
      try {
        if (!context) {
          // The first AudioContext is created only by Begin or Resume, never on page load.
          var Audio = window.AudioContext || window.webkitAudioContext;
          context = new Audio(); master = context.createGain();
          master.gain.value = 0; master.connect(context.destination);
          noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.1), context.sampleRate);
          var samples = noise.getChannelData(0);
          for (var i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          timer = setInterval(schedule, 100);
        }
        var silent = muted || document.hidden;
        master.gain.setTargetAtTime(silent ? 0 : 0.12, context.currentTime, 0.015);
        var operation = silent ? context.suspend() : context.resume();
        operation.then(schedule).catch(fail);
      } catch (e) { fail(); }
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () {
      if (context) { master.gain.value = 0; context.suspend().catch(fail); }
    });
    window.addEventListener('pageshow', sync);
    return {
      start: function () { started = true; sync(); },
      toggle: function () { muted = !muted; sync(); },
      status: status
    };
  };
})();
