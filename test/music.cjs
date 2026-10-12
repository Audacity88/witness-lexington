/* Audio scheduling checks with a Web Audio clock double; no listening or browser acceptance. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '../src/music.js'), 'utf8');
function boot(random = 0.5, unavailable = false) {
  const doc = { hidden: false, events: {}, addEventListener(k, fn) { this.events[k] = fn; } };
  const events = {}, intervals = new Set(), contexts = [], updates = [];
  class Param {
    constructor() { this.value = 1; this.events = []; }
    setValueAtTime(v, t) { this.events.push(['set', v, t]); this.value = v; }
    linearRampToValueAtTime(v, t) { this.events.push(['linear', v, t]); }
    exponentialRampToValueAtTime(v, t) { this.events.push(['exp', v, t]); }
    setTargetAtTime(v, t) { this.events.push(['target', v, t]); this.value = v; }
    cancelScheduledValues(t) { this.events.push(['cancel', t]); }
    cancelAndHoldAtTime(t) { this.events.push(['hold', t]); }
  }
  class Node {
    connect(n) { this.target = n; } disconnect() { this.disconnected = true; }
  }
  class Audio {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 1000; this.sources = []; contexts.push(this); }
    createGain() { const n = new Node(); n.gain = new Param(); return n; }
    createBiquadFilter() { const n = new Node(); n.frequency = new Param(); return n; }
    createBuffer(ch, n) { return { getChannelData: () => new Float32Array(n) }; }
    createOscillator() { return this.source(false); }
    createBufferSource() { return this.source(true); }
    source(noise) {
      const n = new Node(); n.frequency = new Param(); n.noise = noise;
      n.start = t => { n.startTime = t; };
      n.stop = t => { n.stopTime = t; };
      this.sources.push(n); return n;
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }
  const math = Object.create(Math); math.random = () => random;
  const ctx = { document: doc, Math: math, Set, addEventListener: (k, fn) => events[k] = fn,
    setInterval: fn => { intervals.add(fn); return fn; }, clearInterval: fn => intervals.delete(fn) };
  if (!unavailable) ctx.AudioContext = Audio;
  ctx.window = ctx; vm.runInNewContext(code, ctx);
  const music = ctx.WL_MUSIC(s => updates.push(s));
  async function advance(seconds) {
    const a = contexts[0];
    for (let i = 0; i < Math.round(seconds * 20); i++) {
      if (a.state === 'running') a.currentTime += 0.05;
      for (const source of a.sources) if (!source.ended && source.stopTime <= a.currentTime) {
        source.ended = true; source.onended();
      }
      for (const fn of intervals) fn();
      await Promise.resolve();
    }
  }
  return { music, contexts, doc, events, updates, intervals, advance };
}
function peak(source) { return source.target.target.gain.events.find(e => e[0] === 'linear')?.[1] || 0; }
function melody(a) { return a.sources.filter(s => !s.noise && peak(s) > 0.1); }
function pitch(source) { return Math.round(69 + 12 * Math.log2(source.frequency.events[0][1] / 440)); }
function groups(notes) {
  const out = [];
  for (const n of notes) {
    if (!out.length || n.startTime - out.at(-1).at(-1).startTime > 10) out.push([]);
    out.at(-1).push(n);
  }
  return out;
}
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS ' + name); }
(async function () {
  const idle = boot(); idle.music.scene('ride'); idle.music.toggle();
  check('Scene and mute changes never create an AudioContext before Begin', () => assert.equal(idle.contexts.length, 0));
  for (const random of [0, 0.5, 0.999999]) {
    const g = boot(random); g.music.scene('muster'); g.music.start(); await g.advance(1000);
    const a = g.contexts[0], songs = groups(melody(a));
    const signatures = songs.map(s => s.slice(0, 3).map(pitch).join(','));
    check('Four tunes, no immediate repeats, across bag boundaries at random ' + random, () => {
      assert(songs.length >= 10); assert.equal(new Set(signatures).size, 4);
      for (let i = 1; i < signatures.length; i++) assert.notEqual(signatures[i], signatures[i - 1]);
      assert.equal(new Set(signatures.slice(0, 4)).size, 4);
    });
    check('Every completed tune has a 20–40 second rest at random ' + random, () => {
      for (let i = 1; i < songs.length; i++) {
        const last = songs[i - 1].at(-1), attack = last.target.target.gain.events.find(e => e[0] === 'linear')[2] - last.startTime;
        const nominalEnd = last.startTime + (last.stopTime - 0.01 - last.startTime) / (attack < 0.01 ? 0.62 : 0.88);
        const silence = songs[i][0].startTime - nominalEnd;
        assert(silence >= 20 - 1e-6 && silence <= 40 + 1e-6, String(silence));
      }
    });
    check('Muster uses fife, fiddle, bass drum and snare; ended nodes disconnect', () => {
      assert(a.sources.some(s => s.noise)); assert(a.sources.some(s => s.type === 'triangle' && peak(s) > 0.1));
      assert(a.sources.some(s => s.type === 'sawtooth' && peak(s) > 0.1));
      assert(a.sources.filter(s => s.ended).every(s => s.disconnected && s.target.disconnected && s.target.target.disconnected));
    });
  }
  for (const phase of ['ride', 'muster', 'green', 'study']) {
    const g = boot(); g.music.scene(phase); g.music.start(); await g.advance(100);
    const a = g.contexts[0], notes = melody(a), first = notes[0];
    check('Scene arrangement ' + phase, () => {
      assert(notes.length); assert.equal(a.sources.some(s => s.noise), phase === 'muster');
      const expected = phase === 'muster' ? 72 : 60; assert.equal(pitch(first), expected);
      const tick = notes[1].startTime - first.startTime;
      assert(Math.abs(tick - 60 / ({ride:84,muster:108,green:60,study:78}[phase])) < 1e-6);
      const attack = first.target.target.gain.events.find(e => e[0] === 'linear')[2] - first.startTime;
      assert(Math.abs(attack - (phase === 'muster' ? 0.018 : phase === 'study' ? 0.004 : 0.045)) < 1e-6);
    });
  }
  const g = boot(); g.music.scene('ride'); g.music.start(); await g.advance(3);
  const a = g.contexts[0], count = a.sources.length, frozen = a.currentTime;
  g.music.toggle(); await g.advance(50);
  check('Mute suspends the context and preserves the musical clock', () => {
    assert(g.music.status().muted); assert.equal(a.currentTime, frozen); assert.equal(a.sources.length, count);
  });
  g.music.toggle(); await g.advance(3);
  check('Unmute resumes without creating another context', () => { assert.equal(g.contexts.length, 1); assert(a.sources.length > count); });
  g.doc.hidden = true; g.doc.events.visibilitychange(); const hiddenCount = a.sources.length; await g.advance(50);
  check('Hidden tabs schedule no notes', () => assert.equal(a.sources.length, hiddenCount));
  g.doc.hidden = false; g.doc.events.visibilitychange(); await g.advance(1);
  g.events.pagehide(); const awayCount = a.sources.length; await g.advance(50);
  check('Pagehide stops scheduling', () => assert.equal(a.sources.length, awayCount));
  g.events.pageshow(); await g.advance(1);
  check('Pageshow resumes scheduling', () => assert(a.sources.length > awayCount));
  const before = melody(a).at(-1); g.music.scene('muster'); const transition = a.currentTime;
  await g.advance(29);
  check('Scene change silences queued voices and retains a full rest', () => {
    assert(before.stopTime <= transition + 0.031); assert(!melody(a).some(s => s.startTime > transition + 0.2));
    const automation = before.target.target.gain.events;
    assert(automation.some(e => e[0] === 'hold' && e[1] === transition));
    assert(!automation.some(e => e[0] === 'cancel'));
  });
  await g.advance(4);
  check('Scene transition resumes with a different tune and the new arrangement', () => {
    const notes = melody(a).filter(s => s.startTime > transition + 0.2);
    assert(notes.length); assert(notes[0].startTime - transition >= 30);
    assert.equal(notes[0].type, 'sawtooth');
    assert.notEqual(notes.slice(0,3).map(pitch).join(','), groups(melody(a))[0].slice(0,3).map(s => pitch(s) + 12).join(','));
  });
  const legacy = boot(); legacy.music.scene('ride'); legacy.music.start(); await legacy.advance(3);
  const live = legacy.contexts[0].sources.filter(s => !s.ended && s.startTime < legacy.contexts[0].currentTime);
  for (const s of live) { s.target.target.gain.cancelAndHoldAtTime = undefined; s.target.target.gain.value = 0.037; }
  legacy.music.scene('muster');
  check('Legacy fade captures the current value before canceling the ramp', () => {
    for (const s of live) {
      const automation = s.target.target.gain.events, at = automation.findIndex(e => e[0] === 'cancel');
      assert.equal(automation[at + 1][0], 'set'); assert.equal(automation[at + 1][1], 0.037);
      assert.equal(automation[at + 2][0], 'target');
    }
  });
  const queued = boot(); queued.music.scene('ride'); queued.music.start(); await Promise.resolve();
  const queuedAudio = queued.contexts[0], future = queuedAudio.sources.slice();
  queued.music.scene('muster');
  check('Queued voices stop before starting, even within the fade window', () => {
    assert(future.length); assert(future.some(s => s.startTime < 0.03));
    for (const s of future) { assert(s.stopTime <= queuedAudio.currentTime); assert(s.stopTime < s.startTime); }
  });
  const restCase = boot(); restCase.music.scene('ride'); restCase.music.start(); await restCase.advance(44);
  const resting = restCase.contexts[0], restCount = resting.sources.length;
  restCase.music.scene('muster'); await restCase.advance(10);
  check('A scene change during a rest preserves the existing silence', () => assert.equal(resting.sources.length, restCount));
  for (const phase of ['intro', 'opening', 'blackout', 'green-event']) {
    g.music.scene(phase); const n = a.sources.length; await g.advance(60);
    check('No musical first-shot cue in ' + phase, () => { assert.equal(a.sources.length, n); assert.equal(a.state, 'suspended'); });
  }
  const missing = boot(0.5, true); missing.music.scene('ride'); missing.music.start();
  check('Missing Web Audio fails quietly with unavailable status', () => assert(missing.music.status().unavailable));
  const broken = boot(); broken.music.scene('muster'); broken.music.start(); await broken.advance(1);
  broken.contexts[0].createOscillator = () => { throw Error('Device failure'); }; await broken.advance(2);
  check('Scheduling failure stops the timer and silences the master', () => {
    assert(broken.music.status().unavailable); assert.equal(broken.intervals.size, 0);
    assert.equal(broken.contexts[0].sources[0].target.target.target.gain.value, 0);
  });
  console.log(JSON.stringify({ kind: 'Web Audio clock double; no listening or browser acceptance', checks }));
})().catch(e => { console.error(e); process.exitCode = 1; });
