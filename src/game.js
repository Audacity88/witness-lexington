/* Witness the First Shot — game flow, UI, scoring, and the window.WitnessGame debug hook.
   Needs window.THREE, window.WG_DATA (data/evidence.js), window.WG_COAST_B64, window.WGWorld. Zero network requests. */
(function () {
  'use strict';
  var D = window.WG_DATA, W;
  var host = document.getElementById('witness-game') || document.getElementById('witness') || document.body;
  if (host === document.body) { document.documentElement.style.height = '100%'; document.body.style.cssText += ';margin:0;height:100%;min-height:400px'; }
  else if (!host.clientHeight) host.style.height = '480px';
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.style.overflow = 'hidden'; host.classList.add('wg');

  // ---------------- styles ----------------
  var css = document.createElement('style');
  css.textContent = [
    '.wg{--bg:rgba(255,255,255,.93);--fg:#15171d;--sub:#4a5160;--line:rgba(0,0,0,.13);--chip:#f3f1ec;--chip2:#e8e4da;--accent:#c2412d;--accent2:#1f6fb2;--solid:#fbfaf7;--shadow:0 6px 24px rgba(0,0,0,.24);',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--fg);-webkit-user-select:none;user-select:none}',
    '.wg.dark{--bg:rgba(17,19,27,.93);--fg:#f2f3f7;--sub:#b8bfcc;--line:rgba(255,255,255,.15);--chip:#252935;--chip2:#2f3442;--accent:#e2643f;--accent2:#7cc0ff;--solid:#15171f;--shadow:0 6px 24px rgba(0,0,0,.6)}',
    '.wg *{box-sizing:border-box}',
    '.wg-top{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none;z-index:5}',
    '.wg-top>*{pointer-events:auto}',
    '.wg-pill{background:var(--bg);color:var(--fg);border-radius:999px;padding:6px 12px;font-weight:700;font-size:clamp(11px,1.9vw,14px);box-shadow:var(--shadow);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}',
    '.wg-pill small{font-weight:600;color:var(--sub);margin-left:6px}',
    '.wg-btn{font:inherit;font-weight:700;font-size:clamp(13px,2.1vw,16px);padding:10px 16px;border-radius:14px;border:2px solid var(--line);background:var(--chip);color:var(--fg);cursor:pointer;transition:transform .08s,background .15s,border-color .15s;line-height:1.2;text-align:left}',
    '.wg-btn:hover{border-color:var(--accent2)}.wg-btn:active{transform:scale(.97)}',
    '.wg-btn.primary{background:var(--accent);color:#fff;border-color:transparent;text-align:center}',
    '.wg-btn.ghost{background:transparent}',
    '.wg-btn.sel{border-color:var(--accent2);box-shadow:0 0 0 3px rgba(31,111,178,.25);background:var(--chip2)}',
    '.wg-btn[disabled]{opacity:.45;cursor:default}',
    '.wg-btn small{display:block;font-weight:500;font-size:.78em;color:var(--sub);margin-top:2px}',
    '.wg-btn.primary small{color:rgba(255,255,255,.85)}',
    '.wg-panel{position:absolute;left:10px;right:10px;bottom:10px;max-height:64%;overflow:auto;background:var(--bg);border-radius:16px;padding:10px 12px 12px;box-shadow:var(--shadow);z-index:4;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:wgUp .3s ease both}',
    '.wg-panel.full{top:52px;max-height:none}',
    '.wg-panel.center{top:50%;bottom:auto;left:50%;right:auto;transform:translate(-50%,-50%);width:min(560px,calc(100% - 20px));max-height:calc(100% - 64px);margin-top:20px;animation:wgPop .35s cubic-bezier(.2,1.3,.4,1) both}',
    '.wg-h{font-weight:800;font-size:clamp(15px,2.8vw,21px);margin:0 0 6px}',
    '.wg-p{font-size:clamp(12px,2vw,15px);color:var(--sub);margin:0 0 8px;line-height:1.35}',
    '.wg-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
    '.wg-row.end{justify-content:flex-end}',
    '.wg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}','.wg-grid.cards{grid-template-columns:repeat(auto-fill,minmax(205px,1fr))}',
    '.wg-steps{display:flex;gap:6px;align-items:center;margin-bottom:6px;font-size:12px;color:var(--sub);font-weight:700}',
    '.wg-dot{width:9px;height:9px;border-radius:50%;background:var(--line)}.wg-dot.on{background:var(--accent)}',
    '.wg-cap{position:absolute;left:12px;bottom:12px;max-width:min(80%,460px);padding:10px 14px;border-radius:12px;background:var(--bg);box-shadow:var(--shadow);line-height:1.3;pointer-events:none;transition:opacity .4s;z-index:3}',
    '.wg-cap b{display:block;font-size:clamp(13px,2.4vw,17px)}.wg-cap span{display:block;font-size:clamp(12px,2vw,15px);color:var(--sub)}',
    '.wg-black{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:6;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px}',
    '.wg-black p{color:#fff;font-size:clamp(18px,4vw,32px);font-weight:700;text-align:center;margin:0 16px;opacity:0;transition:opacity 1s}',
    '.wg-black .wg-btn{opacity:0;transition:opacity .6s;pointer-events:auto}',
    '.wg-smoke{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5;background:radial-gradient(ellipse at 40% 60%,#f4f2ee 0%,#e7e3dc 45%,#cfc9bf 100%)}',
    '.wg-haze{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:2;background:radial-gradient(ellipse at center,#f4f7fb 0%,#dfe7f1 55%,#c3d0e0 100%)}',
    '.wg-year{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);padding:6px 18px 8px;border-radius:14px;background:rgba(8,12,26,.62);text-align:center;pointer-events:none;opacity:0;z-index:3}',
    '.wg-year b{display:block;white-space:nowrap;font-size:clamp(26px,7vw,60px);font-weight:800;color:#fff;letter-spacing:.04em;line-height:1.1}.wg-year span{color:#dfe6f5;font-size:clamp(11px,1.9vw,14px)}',
    '.wg-tag{position:absolute;transform:translate(-50%,-130%);background:#ff5a36;color:#fff;font-weight:800;font-size:clamp(11px,1.9vw,14px);padding:4px 10px;border-radius:999px;pointer-events:none;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.35);z-index:3;display:none}',
    '.wg-tag:after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#ff5a36}',
    '.wg-card{border-radius:12px;border:2px solid var(--line);border-left-width:9px;padding:7px 10px 8px;background:var(--chip);animation:wgIn .35s both;font-size:clamp(12px,1.9vw,14px)}',
    '.wg-card.green{border-left-color:#2e9e5b}.wg-card.red{border-left-color:#d6453d}.wg-card.grey{border-left-color:#9aa0aa}',
    '.wg-card h4{margin:0;font-size:1em;display:flex;justify-content:space-between;gap:6px;align-items:baseline}',
    '.wg-badge{font-size:.78em;font-weight:800;border-radius:999px;padding:1px 8px;white-space:nowrap;color:#fff}',
    '.wg-badge.green{background:#2e9e5b}.wg-badge.red{background:#d6453d}.wg-badge.grey{background:#8a9099}',
    '.wg-q{font-style:italic;color:var(--sub);margin:4px 0 0;font-size:.92em;line-height:1.3}',
    '.wg-flag{display:inline-block;margin-top:4px;font-size:.8em;font-weight:700;background:#ffe9b0;color:#5c4100;border-radius:6px;padding:1px 6px}',
    '.wg-why{margin-top:4px;font-size:.92em;font-weight:600}',
    '.wg-sec{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--sub);margin:10px 0 6px}',
    '.wg-stamp{display:inline-block;font-weight:900;letter-spacing:.06em;font-size:clamp(16px,3vw,22px);padding:3px 12px;border:3px solid;border-radius:10px;transform:rotate(-4deg);animation:wgStamp .5s cubic-bezier(.2,1.7,.4,1) both;margin-right:8px}',
    '.wg-stamp.ok{color:#2e9e5b;border-color:#2e9e5b}.wg-stamp.no{color:#d6453d;border-color:#d6453d}',
    '.wg-rank{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}',
    '.wg-rank li{display:flex;align-items:center;gap:8px;background:var(--chip);border:2px solid var(--line);border-radius:12px;padding:6px 8px;font-weight:700;font-size:clamp(12px,2vw,15px);touch-action:none;cursor:grab}',
    '.wg-rank li.drag{opacity:.85;border-color:var(--accent2);box-shadow:var(--shadow);cursor:grabbing}',
    '.wg-rank .n{width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none}',
    '.wg-rank .t{flex:1;min-width:0}.wg-rank .t small{display:block;font-weight:500;color:var(--sub);font-size:.8em}',
    '.wg-rank button{font:inherit;font-weight:800;border:0;background:var(--chip2);color:var(--fg);border-radius:8px;width:30px;height:28px;cursor:pointer}',
    '.wg input[type=range]{width:100%;accent-color:var(--accent)}',
    '.wg-sticky{margin-top:10px;position:sticky;bottom:-12px;background:var(--solid);padding:8px 0 4px;box-shadow:0 -8px 10px -6px rgba(0,0,0,.12)}','.wg-tryother{margin-right:auto;font-weight:800;color:var(--accent2);font-size:clamp(12px,1.9vw,14px)}',
    '.wg-docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}',
    '.wg-doc:first-child{grid-column:1/-1}',
    '.wg-src{margin:2px 0 4px;font-size:.82em;color:var(--sub)}',
    '.wg-ex{margin:4px 0 0;font-size:.8em;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--sub)}',
    '.wg-quote{margin:4px 0;padding:6px 10px;border-left:3px solid var(--accent);background:var(--bg);border-radius:6px;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:1.02em;line-height:1.35}',
    '.wg-scan{margin-top:6px;border:2px dashed var(--line);border-radius:8px;padding:8px;text-align:center;font-size:.85em;color:var(--sub)}',
    '.wg-list{margin:4px 0 0;padding-left:18px}',
    '.wg-fig{margin:4px 0 0}.wg-fig img{display:block;width:100%;max-height:300px;object-fit:contain;border-radius:8px;background:#e9e2d0;cursor:zoom-in}',
    '.wg-fig figcaption{font-size:.85em;color:var(--sub);margin-top:4px}',
    '.wg-zoom{position:absolute;inset:0;z-index:9;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:zoom-out}',
    '.wg-zoom img{max-width:96%;max-height:88%;object-fit:contain}.wg-zoom span{color:#ddd;font-size:12px}',
    '.wg-ta{width:100%;min-height:72px;resize:vertical;font:inherit;font-size:clamp(13px,2vw,16px);line-height:1.4;padding:8px 10px;border-radius:12px;border:2px solid var(--line);background:var(--chip);color:var(--fg);-webkit-user-select:text;user-select:text}',
    '.wg-ta:focus{outline:none;border-color:var(--accent2)}',
    '.wg-wc{font-size:12px;font-weight:700}.wg-pastemsg{font-size:12px;font-weight:700;color:#d6453d}',
    '.wg-crit{display:flex;gap:8px;align-items:flex-start;margin:4px 0;font-size:clamp(12px,1.9vw,14px)}.wg-crit b{width:22px;height:22px;flex:none;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center}',
    '.wg-crit.ok b{background:#2e9e5b}.wg-crit.no b{background:#d6453d}',
    '.wg-res{scroll-margin-bottom:64px}.wg-hints{margin:6px 0 0;padding-left:18px;font-size:clamp(12px,1.9vw,14px);color:var(--fg)}.wg-hints li{margin:3px 0}',
    '.wg-conf{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:7}',
    '.wg-conf i{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;animation:wgFall 1.7s ease-in forwards}',
    '@keyframes wgUp{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes wgPop{from{transform:translate(-50%,-50%) scale(.9);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}',
    '@keyframes wgIn{from{transform:translateY(8px) scale(.97);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes wgStamp{from{transform:rotate(-4deg) scale(2.2);opacity:0}to{transform:rotate(-4deg) scale(1);opacity:1}}',
    '@keyframes wgFall{to{transform:translateY(560px) rotate(540deg);opacity:.2}}'
  ].join('\n');
  document.head.appendChild(css);

  W = window.WGWorld.create(host);
  var T = window.THREE, R = W.renderer, cam = W.cam, camB = W.camB, controls = W.controls;
  var lexA = W.makeLex();

  function el(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || host).appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var haze = el('div', 'wg-haze'), yearBox = el('div', 'wg-year', null, '<b>AD 1775</b><span>April 19, 1775 · Lexington, Massachusetts</span>');
  var cap = el('div', 'wg-cap'); cap.style.opacity = '0';
  var smoke = el('div', 'wg-smoke'), black = el('div', 'wg-black');
  var blackCap = el('p', '', black); blackCap.textContent = D.cutsceneCaption;
  var contBtn = el('button', 'wg-btn primary', black, 'Continue \u203a'); contBtn.type = 'button';
  var top = el('div', 'wg-top'), title = el('div', 'wg-pill', top), topR = el('div', 'wg-row', top);
  var skipBtn = el('button', 'wg-btn', topR, 'Skip \u203a'); skipBtn.type = 'button'; skipBtn.style.padding = '6px 14px';
  var tagA = el('div', 'wg-tag', null, '1st shot!');
  var panel = null, conf = null;

  // ---------------- theme ----------------
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function themeIsLight() {
    var m = window.margin, t = m && (m.theme || m.colorScheme);
    if (typeof t === 'function') { try { t = t(); } catch (e) { t = null; } }
    if (t === 'light' || t === 'dark') return t === 'light';
    var de = document.documentElement, a = de.getAttribute('data-theme') || de.style.colorScheme;
    if (a === 'light' || a === 'dark') return a === 'light';
    if (de.classList.contains('dark')) return false; if (de.classList.contains('light')) return true;
    return !!(mq && mq.matches);
  }
  function applyTheme() { host.classList.toggle('dark', !themeIsLight()); }
  applyTheme(); setInterval(applyTheme, 1500);
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', applyTheme); else if (mq.addListener) mq.addListener(applyTheme); }

  // ---------------- scoring ----------------
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
  function cardById(id) { for (var i = 0; i < D.cards.length; i++) if (D.cards[i].id === id) return D.cards[i]; }
  function vText(v) { return D.shooters[v.shooter].label + ' \u00b7 ' + D.zones[v.location].label.toLowerCase() + ' \u00b7 ' + D.aftermaths[v.aftermath].label.toLowerCase(); }

  // ---------------- state ----------------
  var CUT_LEN = 31, GLOBE_END = 6.2;
  var st = { stage: 'boot', side: null, step: 1, draft: {}, sides: { militia: null, british: null }, last: null,
    cutT: 0, repT: 0, cmpT: 0, paused: false, view: 'main' };
  var plans = { A: null };

  function setPanel(cls, html) {
    if (panel) panel.remove(); panel = null; if (conf) { conf.remove(); conf = null; }
    if (html == null) return null;
    panel = el('div', 'wg-panel ' + (cls || ''), null, html); return panel;
  }
  function setTitle(main, small) { title.innerHTML = esc(main) + (small ? '<small>' + esc(small) + '</small>' : ''); }
  function sideTag() { return st.side ? D.sides[st.side].label : ''; }
  function camPreset(c, aspect, split) {             // wide view of the Green
    var dist = split ? Math.max(30, 19 / (Math.tan(25 * Math.PI / 180) * aspect)) : Math.max(24, 20 / (Math.tan(25 * Math.PI / 180) * aspect));
    var dir = new T.Vector3(0, 0.68, 0.73).normalize();
    c.position.set(1, 0, -0.5).addScaledVector(dir, dist); c.lookAt(1, 0, -0.5);
    return new T.Vector3(1, 0, -0.5);
  }
  function wideCam() { var tg = camPreset(cam, aspect(), false); controls.target.copy(tg); controls.update(); }
  function aspect() { return Math.max(0.3, (host.clientWidth || 960) / (host.clientHeight || 540)); }
  function hideTransient() {
    haze.style.opacity = yearBox.style.opacity = smoke.style.opacity = black.style.opacity = '0'; black.style.pointerEvents = 'none';
    blackCap.style.opacity = contBtn.style.opacity = '0'; cap.style.opacity = '0'; tagA.style.display = 'none'; skipBtn.style.display = 'none';
  }

  // ---------------- stage: cutscene ----------------
  function startCutscene() {
    hideTransient(); setPanel(); st.stage = 'cutscene'; st.cutT = 0; st.view = 'globe'; controls.enabled = false;
    lexA.fx.clear(); lexA.ring.visible = false; W.globe.ensure(); skipBtn.style.display = '';
    setTitle('Witness the First Shot', 'Lexington, 1775');
  }
  var CAPS = [
    [6.6, 14.0, 'Lexington, Massachusetts', 'April 19, 1775 \u00b7 dawn', 'The British column marches up the road behind a mounted officer.'],
    [14.0, 20.0, 'The advance companies wheel onto the Green', 'The militia stand in two ranks, in plain sight.', ''],
    [20.0, 23.3, 'About 400 regulars. About 80 militia.', 'A few townspeople watch.', '']
  ];
  var camTmp = new T.Vector3(), lookTmp = new T.Vector3(), lookA = new T.Vector3(), lookB = new T.Vector3(), pA = new T.Vector3(), pB = new T.Vector3();
  function cutCam(t) {
    var e = W.ease, h = W.head;
    function track(tt) { pA.set(-6.5, 2.6, h(tt) + 9); lookA.set(2.5, 1.6, h(tt) - 0.5); }
    if (t < 8.6) { track(8.6); var k = e((t - GLOBE_END) / (8.6 - GLOBE_END)); camTmp.set(14, 46, 82).lerp(pA, k); lookTmp.set(2.5, 1, 40).lerp(lookA, k); }
    else if (t < 14) { track(t); camTmp.copy(pA); lookTmp.copy(lookA); }
    else if (t < 20) { track(14); var k2 = e((t - 14) / 1.9); pB.set(-1, 7.5, -21).lerp(new T.Vector3(-4, 7, -22), W.clamp01((t - 15.9) / 4.1)); lookB.set(2, 1, 6);
      camTmp.copy(pA).lerp(pB, k2); lookTmp.copy(lookA).lerp(lookB, k2); }
    else { var k3 = W.clamp01((t - 20) / 3.4); camTmp.set(30 - 3 * k3, 6.5 - 0.4 * k3, 1.5); lookTmp.set(1, 1.2, 2.5); }
    cam.position.copy(camTmp); cam.lookAt(lookTmp);
  }
  var SHOT_AT = 23.35, puffed = false;
  function stepCutscene(dt) {
    var t = st.cutT, prev = t; st.cutT = t = t + dt;
    if (t < GLOBE_END) {
      st.view = 'globe';
      var globeData = W.globe.place(W.clamp01(t / GLOBE_END));
      if (globeData && globeData.yearText) {
        yearBox.innerHTML = '<b>' + globeData.yearText + '</b><span>Time-travel transition</span>';
      }
      yearBox.style.opacity = String(W.clamp01((t - 0.6) / 0.6) * W.clamp01((GLOBE_END - 0.5 - t) / 0.5));
    } else { st.view = 'main'; yearBox.style.opacity = '0'; lexA.poseCutscene(t); cutCam(t); }
    var hz = Math.max(0, 1 - Math.abs(t - GLOBE_END) / 0.75); haze.style.opacity = String(Math.min(1, hz * 1.2));
    var c = null; CAPS.forEach(function (C) { if (t >= C[0] && t < C[1]) c = C; });
    if (c) { if (cap.dataset.k !== String(c[0])) { cap.dataset.k = String(c[0]); cap.innerHTML = '<b>' + esc(c[2]) + '</b><span>' + esc(c[3]) + '</span>' + (c[4] ? '<span>' + esc(c[4]) + '</span>' : ''); }
      cap.style.opacity = String(W.clamp01((t - c[0]) / 0.4) * W.clamp01((c[1] - t) / 0.4)); } else cap.style.opacity = '0';
    // the first shot: the frame fills with smoke before anyone can be seen firing, then cut to dark
    if (prev < SHOT_AT && t >= SHOT_AT && !puffed) { puffed = true;
      for (var i = 0; i < 26; i++) { var p = new T.Vector3(-9 + (i % 13) * 1.6, 1.2 + (i % 3) * 0.4, i < 13 ? -2 : 8); lexA.fx.puff(p, 1.6); } }
    if (t < SHOT_AT) puffed = false;
    smoke.style.opacity = String(W.clamp01((t - SHOT_AT) / 0.25));
    black.style.opacity = String(W.clamp01((t - (SHOT_AT + 0.55)) / 0.6));
    blackCap.style.opacity = t > SHOT_AT + 1.3 ? '1' : '0';
    var showCont = t > SHOT_AT + 3.2; contBtn.style.opacity = showCont ? '1' : '0'; black.style.pointerEvents = showCont ? 'auto' : 'none';
    lexA.fx.update(dt);
    if (t >= CUT_LEN) goPick();
  }
  skipBtn.addEventListener('click', function () { goPick(); });
  contBtn.addEventListener('click', function () { goPick(); });

  // ---------------- stage: pick ----------------
  function goPick() {
    hideTransient(); st.stage = 'pick'; st.view = 'main'; st.side = null;
    lexA.poseFormed(); lexA.fx.clear(); lexA.ring.visible = false; setMarkers(null); wideCam(); controls.enabled = true;
    setTitle('Pick your side', bothDone() ? 'both done!' : anyDone() ? '1 done \u00b7 the other is optional' : 'act out an account');
    var html = '<div class="wg-h">Whose story will you act out' + (st.sides.militia || st.sides.british ? ' next' : ' first') + '?</div>' +
      '<p class="wg-p">Each side told it differently. Act out one \u2014 or both!</p><div class="wg-grid">';
    ['militia', 'british'].forEach(function (k) { var S = D.sides[k], done = st.sides[k];
      html += '<button type="button" class="wg-btn' + (done ? ' sel' : '') + '" data-side="' + k + '">' + esc(S.label) + (done ? ' \u2713' : '') + '<small>' + esc(S.says) + '</small></button>'; });
    html += '</div>' + (anyDone() ? '<div class="wg-row end" style="margin-top:8px"><button type="button" class="wg-btn primary" data-go="room">Go to the evidence room \u203a</button></div>' : '');
    var p = setPanel('center', html);
    p.querySelectorAll('[data-side]').forEach(function (b) { b.addEventListener('click', function () { goSetup(b.getAttribute('data-side')); }); });
    var g = p.querySelector('[data-go]'); if (g) g.addEventListener('click', function () { goEvidenceRoom(); });
  }
  function bothDone() { return !!(st.sides.militia && st.sides.british); }

  // ---------------- stage: setup (reenact) ----------------
  function setMarkers(allowed) { Object.keys(lexA.markers).forEach(function (k) { lexA.markers[k].visible = !!(allowed && allowed.indexOf(k) >= 0); }); }
  function goSetup(side, step) {
    hideTransient(); st.stage = 'setup'; st.view = 'main'; st.side = side || st.side; st.step = step || 1;
    var prevV = st.sides[st.side] && st.sides[st.side].version;
    if (!st.draft || st.draft.side !== st.side) st.draft = prevV ? JSON.parse(JSON.stringify(prevV)) : { side: st.side };
    lexA.poseFormed(); lexA.fx.clear(); wideCam(); controls.enabled = true;
    renderSetup();
  }
  function previewDraft() {
    var d = st.draft; lexA.poseFormed(); lexA.ring.visible = false; lexA.hidden.visible = false;
    if (st.stage !== 'setup') return;
    setMarkers(st.step === 2 && d.shooter ? D.shooters[d.shooter].zones : null);
    if (d.shooter && d.location) {
      var pt = d.point || W.zonePoint(d.location, null);
      lexA.ring.visible = true; lexA.ring.position.set(pt.x, 0.13, pt.z); lexA.ring.scale.set(1, 1, 1);
      if (d.shooter === 'hidden') { var P = lexA.plan(fullDraft()); lexA.poseReplay(P, 0, 0); lexA.ring.visible = true; lexA.ring.position.set(pt.x, 0.13, pt.z); }
    }
  }
  function fullDraft() { var d = st.draft; return { side: st.side, shooter: d.shooter, location: d.location, aftermath: d.aftermath || 'volley', point: d.point }; }
  function renderSetup() {
    var d = st.draft, S = D.sides[st.side];
    setTitle('Act it out', S.label);
    var dots = '<div class="wg-steps">' + [1, 2, 3].map(function (i) { return '<span class="wg-dot' + (i <= st.step ? ' on' : '') + '"></span>'; }).join('') +
      '<span>Step ' + st.step + ' of 3 \u00b7 ' + esc(S.says) + '</span></div>';
    var html = dots;
    if (st.step === 1) {
      html += '<div class="wg-h">Who fired the first shot?</div><div class="wg-grid">' + Object.keys(D.shooters).map(function (k) { var o = D.shooters[k];
        return '<button type="button" class="wg-btn' + (d.shooter === k ? ' sel' : '') + '" data-shooter="' + k + '">' + esc(o.label) + '<small>' + esc(o.sub) + '</small></button>'; }).join('') + '</div>';
    } else if (st.step === 2) {
      var zs = D.shooters[d.shooter].zones;
      html += '<div class="wg-h">Where? Tap a glowing spot in the scene</div><div class="wg-row">' + zs.map(function (z) {
        return '<button type="button" class="wg-btn' + (d.location === z ? ' sel' : '') + '" data-zone="' + z + '">' + esc(D.zones[z].label) + '</button>'; }).join('') + '</div>';
    } else {
      html += '<div class="wg-h">What happened next?</div><div class="wg-grid">' + Object.keys(D.aftermaths).map(function (k) { var o = D.aftermaths[k];
        return '<button type="button" class="wg-btn' + (d.aftermath === k ? ' sel' : '') + '" data-after="' + k + '">' + esc(o.label) + '<small>' + esc(o.sub) + '</small></button>'; }).join('') + '</div>';
    }
    html += '<div class="wg-row end" style="margin-top:8px"><button type="button" class="wg-btn ghost" data-nav="back">\u2039 Back</button>' +
      (st.step < 3 ? '<button type="button" class="wg-btn primary" data-nav="next"' + ((st.step === 1 && !d.shooter) || (st.step === 2 && !d.location) ? ' disabled' : '') + '>Next \u203a</button>'
                   : '<button type="button" class="wg-btn primary" data-nav="play"' + (!d.aftermath ? ' disabled' : '') + '>\u25b6 Play my version</button>') + '</div>';
    var p = setPanel('', html);
    p.querySelectorAll('[data-shooter]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-shooter');
      if (d.shooter !== k) { d.shooter = k; d.location = null; d.point = null; } st.step = 2; renderSetup(); }); });
    p.querySelectorAll('[data-zone]').forEach(function (b) { b.addEventListener('click', function () { d.location = b.getAttribute('data-zone'); d.point = W.zonePoint(d.location, null); renderSetup(); }); });
    p.querySelectorAll('[data-after]').forEach(function (b) { b.addEventListener('click', function () { d.aftermath = b.getAttribute('data-after'); renderSetup(); }); });
    p.querySelector('[data-nav=back]').addEventListener('click', function () { if (st.step > 1) { st.step--; renderSetup(); } else goPick(); });
    var nx = p.querySelector('[data-nav=next]'); if (nx) nx.addEventListener('click', function () { st.step++; renderSetup(); });
    var pl = p.querySelector('[data-nav=play]'); if (pl) pl.addEventListener('click', function () { goReplay(); });
    previewDraft();
  }
  // tap-to-pick on the scene (a short tap, not an orbit drag)
  var down = null;
  W.canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  W.canvas.addEventListener('pointerup', function (e) {
    if (!down) return; var moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved > 8 || dt > 600 || st.stage !== 'setup' || st.step !== 2 || !st.draft.shooter) return;
    var g = W.pickGround(e.clientX, e.clientY); if (!g) return;
    var q = W.snap(g, D.shooters[st.draft.shooter].zones); st.draft.location = q.zone; st.draft.point = { x: q.x, z: q.z }; renderSetup();
  });

  // ---------------- stage: replay ----------------
  function goReplay(v) {
    hideTransient(); st.stage = 'replay'; st.view = 'main';
    var ver = v || fullDraft(); st.last = ver; setMarkers(null);
    lexA.fx.clear(); plans.A = lexA.plan(ver); st.repT = 0; wideCam(); controls.enabled = true;
    setTitle('Your version', D.sides[ver.side].label);
    var p = setPanel('', '<div class="wg-row" style="justify-content:space-between"><div><div class="wg-h" style="margin:0">' + esc(D.shooters[ver.shooter].label) + ' fires first</div>' +
      '<p class="wg-p" style="margin:0">' + esc(D.zones[ver.location].label) + ' \u00b7 then: ' + esc(D.aftermaths[ver.aftermath].label.toLowerCase()) + '</p></div>' +
      '<div class="wg-row"><button type="button" class="wg-btn ghost" data-r="again">\u21bb Replay</button><button type="button" class="wg-btn primary" data-r="ev" disabled>See the evidence \u203a</button></div></div>');
    p.querySelector('[data-r=again]').addEventListener('click', function () { goReplay(st.last); });
    p.querySelector('[data-r=ev]').addEventListener('click', function () { goEvidence(st.last); });
  }
  function stepReplay(dt, clockT) {
    var P = plans.A, t0 = st.repT; st.repT = Math.min(P.dur, t0 + dt);
    lexA.poseReplay(P, st.repT, clockT); lexA.fireEvents(P, t0, st.repT); lexA.fx.update(dt);
    if (st.repT >= lexA.SHOT_T + 0.6 && panel) { var b = panel.querySelector('[data-r=ev]'); if (b) b.disabled = false; }
  }

  // ---------------- stage: evidence ----------------
  function cardHTML(c, col, why, i) {
    var lab = col === 'green' ? 'fits \u2713' : col === 'red' ? 'contradicts \u2717' : 'silent';
    var body = c.quotes ? c.quotes.map(function (q) { return '<p class="wg-q">\u201c' + esc(q) + '\u201d</p>'; }).join('') : '<p class="wg-q">' + esc(c.summary) + '</p>';
    return '<div class="wg-card ' + col + '" style="animation-delay:' + (i * 0.06).toFixed(2) + 's" data-card="' + c.id + '"><h4><span>' + esc(c.title) + (c.date ? ' <span style="font-weight:600;color:var(--sub)">' + esc(c.date) + '</span>' : '') + '</span>' +
      '<span class="wg-badge ' + col + '">' + lab + '</span></h4>' + body + (c.flag ? '<span class="wg-flag">' + esc(c.flag) + '</span>' : '') +
      '<div class="wg-why">' + esc(why.join(' ')) + '</div></div>';
  }
  function goEvidence(v) {
    hideTransient(); st.stage = 'evidence'; st.view = 'main'; controls.enabled = true;
    v = v || st.last || fullDraft(); st.last = v; st.side = v.side;
    var sc = score(v); st.score = sc;
    if (sc.accepted) st.sides[v.side] = { version: JSON.parse(JSON.stringify(v)), score: sc, played: true };
    setTitle('The evidence', D.sides[v.side].label);
    var redNames = sc.redTestimony.map(function (id) { return cardById(id).title; });
    var head = sc.accepted
      ? '<span class="wg-stamp ok">ACCEPTED \u2713</span><b>Your version fits every hard fact.</b>' + (redNames.length ? '<p class="wg-p" style="margin:6px 0 0">But it contradicts: ' + esc(redNames.join('; ')) + '. That\u2019s OK \u2014 witnesses disagree.</p>' : '<p class="wg-p" style="margin:6px 0 0">No testimony contradicts it.</p>')
      : '<span class="wg-stamp no">NOT ACCEPTED</span><b>It doesn\u2019t fit a hard fact.</b><p class="wg-p" style="margin:6px 0 0">' + esc(sc.reasons.join(' ')) + '</p>';
    var html = '<div>' + head + '</div><p class="wg-p" style="margin:6px 0 0"><b>Your version:</b> ' + esc(vText(v)) + '</p>';
    html += '<div class="wg-sec">Hard facts (must fit)</div><div class="wg-grid cards">' + D.cards.filter(function (c) { return c.kind === 'fact'; }).map(function (c, i) { return cardHTML(c, sc.cards[c.id], sc.why[c.id], i); }).join('') + '</div>';
    html += '<div class="wg-sec">Testimony (can disagree)</div><div class="wg-grid cards">' + D.cards.filter(function (c) { return c.kind === 'testimony'; }).map(function (c, i) { return cardHTML(c, sc.cards[c.id], sc.why[c.id], i + 4); }).join('') + '</div>';
    var other = v.side === 'militia' ? 'british' : 'militia';
    html += '<div class="wg-row end wg-sticky">' + (sc.accepted && !st.sides[other] ? '<span class="wg-tryother" title="' + esc(D.sides[other].says) + '">Now try the other side\u2019s account? (optional)</span>' : '') +
      '<button type="button" class="wg-btn ghost" data-e="change">\u270e Change my version</button>' +
      (sc.accepted ? (!st.sides[other] ? '<button type="button" class="wg-btn" data-e="next">Play ' + esc(lc(D.sides[other].label)) + ' \u203a</button>' : '') +
                     '<button type="button" class="wg-btn primary" data-e="room">Evidence room \u203a</button>'
                   : '<button type="button" class="wg-btn primary" data-e="change2">Try again \u203a</button>') + '</div>';
    var p = setPanel('full', html);
    p.querySelector('[data-e=change]').addEventListener('click', function () { st.draft = JSON.parse(JSON.stringify(v)); goSetup(v.side, 1); });
    var b;
    if ((b = p.querySelector('[data-e=change2]'))) b.addEventListener('click', function () { st.draft = JSON.parse(JSON.stringify(v)); goSetup(v.side, 3); });
    if ((b = p.querySelector('[data-e=next]'))) b.addEventListener('click', function () { st.draft = {}; goSetup(other, 1); });
    if ((b = p.querySelector('[data-e=room]'))) b.addEventListener('click', function () { goEvidenceRoom(); });
    if (sc.accepted) confetti();
  }
  function confetti() {
    conf = el('div', 'wg-conf'); var cols = ['#2e9e5b', '#ffcf3f', '#1f6fb2', '#e2643f', '#9b59b6'];
    for (var i = 0; i < 36; i++) { var c = el('i', '', conf); c.style.left = ((i * 37) % 100) + '%'; c.style.background = cols[i % cols.length]; c.style.animationDelay = ((i % 9) * 0.07).toFixed(2) + 's'; }
  }

  // ---------------- stage: evidence room (the actual documents) ----------------
  var DOC_IMG = window.WG_DOOLITTLE_SRC || 'assets/doolittle-plate1.webp';
  function anyDone() { return !!(st.sides.militia || st.sides.british); }
  function ensurePreset(k) { if (!st.sides[k]) { var v = JSON.parse(JSON.stringify(D.sides[k].preset)); v.side = k; v.point = W.zonePoint(v.location, null); st.sides[k] = { version: v, score: score(v) }; } }
  function myReenactHTML() {
    return ['militia', 'british'].map(function (k) { var S = st.sides[k];
      if (!S) return '<div class="wg-card grey" style="animation:none"><h4><span>' + esc(D.sides[k].label) + '</span><span class="wg-badge grey">not played</span></h4><p class="wg-q" style="font-style:normal">Optional \u2014 you can still try it.</p></div>';
      var chips = D.cards.map(function (c) { var col = S.score.cards[c.id]; return '<span class="wg-badge ' + col + '" style="display:inline-block;margin:2px 3px 0 0">' + esc(c.title.replace(/ \u2014.*$/, '').replace(/\(British\)/, '')) + (c.id === 'revere1798' ? ' 1798' : c.id === 'revere1775' ? ' 1775' : '') + '</span>'; }).join('');
      return '<div class="wg-card ' + (S.score.accepted ? 'green' : 'red') + '" style="animation:none"><h4><span>' + esc(D.sides[k].label) + '</span><span class="wg-badge green">accepted</span></h4>' +
        '<p class="wg-q" style="font-style:normal">' + esc(vText(S.version)) + '</p><div style="margin-top:4px">' + chips + '</div></div>'; }).join('');
  }
  function goEvidenceRoom() {
    if (!anyDone()) ensurePreset('militia');
    hideTransient(); st.stage = 'evidenceRoom'; st.view = 'main'; controls.enabled = false; lexA.poseFormed(); lexA.fx.clear(); lexA.ring.visible = false; setMarkers(null); wideCam();
    setTitle('The evidence room', 'the real documents');
    var R = D.room;
    function scan(txt) { return '<div class="wg-scan">' + esc(txt) + '</div>'; }
    function doc(d, inner) { return '<div class="wg-card grey wg-doc" style="animation:none"><h4><span>' + esc(d.title) + '</span><span class="wg-badge ' + (d.badgeColor || 'grey') + '">' + esc(d.badge) + '</span></h4>' +
      (d.source ? '<p class="wg-src">' + esc(d.source) + '</p>' : '') + inner + (d.flag ? '<span class="wg-flag">' + esc(d.flag) + '</span>' : '') + '</div>'; }
    var html = '<div class="wg-h">Look at the real evidence</div><p class="wg-p">Then you\u2019ll answer: <b>' + esc(window.WG_ESSAY.question) + '</b></p>';
    html += '<div class="wg-docs">';
    html += doc(R.doolittle, '<figure class="wg-fig"><img alt="' + esc(R.doolittle.alt) + '" src="' + DOC_IMG + '" data-zoom><figcaption>' + esc(R.doolittle.caption) + '</figcaption></figure>');
    html += doc(R.revere1775, '<p class="wg-ex">Excerpts:</p>' + R.revere1775.quotes.map(function (q) { return '<blockquote class="wg-quote">\u201c' + esc(q) + '\u201d</blockquote>'; }).join('') + scan(R.revere1775.scan));
    html += doc(R.revere1798, '<p class="wg-ex">Excerpt:</p>' + R.revere1798.quotes.map(function (q) { return '<blockquote class="wg-quote">\u201c' + esc(q) + '\u201d</blockquote>'; }).join('') + scan(R.revere1798.scan));
    html += doc(R.barker, '<p class="wg-quote" style="font-style:normal">' + esc(R.barker.text) + '</p>' + scan(R.barker.scan));
    html += doc(R.depositions, '<p class="wg-quote" style="font-style:normal">' + esc(R.depositions.text) + '</p>' + scan(R.depositions.scan));
    html += doc(R.facts, '<ul class="wg-list">' + D.cards.filter(function (c) { return c.kind === 'fact'; }).map(function (c) { return '<li>' + esc(c.summary) + '</li>'; }).join('') + '</ul>');
    html += '</div><div class="wg-sec">Your reenactments</div><div class="wg-grid cards">' + myReenactHTML() + '</div>';
    html += '<div class="wg-row end wg-sticky">' + (!bothDone() ? '<button type="button" class="wg-btn ghost" data-r="other">Play ' + esc(lc(D.sides[otherSide()].label)) + '</button>' : '') +
      '<button type="button" class="wg-btn primary" data-r="essay">Write your answer \u203a</button></div>';
    var p = setPanel('full', html);
    p.querySelector('[data-r=essay]').addEventListener('click', function () { goEssay(); });
    var o = p.querySelector('[data-r=other]'); if (o) o.addEventListener('click', function () { st.draft = {}; goSetup(otherSide(), 1); });
    var im = p.querySelector('[data-zoom]'); im.addEventListener('click', function () { var z = el('div', 'wg-zoom', null, '<img alt="" src="' + DOC_IMG + '"><span>tap to close</span>'); z.addEventListener('click', function () { z.remove(); }); });
  }
  function lc(s) { return s.replace(/^The /, 'the '); }
  function otherSide() { var done = st.sides; if (done.militia && !done.british) return 'british'; if (done.british && !done.militia) return 'militia'; return st.side === 'militia' ? 'british' : 'militia'; }

  // ---------------- stage: essay ----------------
  var E = window.WG_ESSAY, essay = { text: '', result: null, tel: null };
  function newTel() { return { startedAt: null, msFocused: 0, focusSince: null, firstKeyAt: null, lastKeyAt: null, keystrokes: 0, inputEvents: 0, deletes: 0, pasteAttempts: 0, dropAttempts: 0, log: [] }; }
  essay.tel = newTel();
  function words(t) { var m = String(t).trim().match(/[A-Za-z0-9\u00C0-\u024F'\u2019-]+/g); return m ? m.length : 0; }
  function rx(s) { return new RegExp(s, 'i'); }
  function check(text) {
    var t = String(text || '').toLowerCase().replace(/\u2019/g, "'"), n = words(t), res = { words: n, minWords: E.minWords, refs: [], own: [], stance: null, criteria: {}, hints: [], passed: false };
    // (a) evidence references, one per card group
    var groups = {};
    E.refs.forEach(function (r) { if (groups[r.group]) return; if (r.any.some(function (p) { return rx(p).test(t); })) { groups[r.group] = r.id; res.refs.push({ id: r.id, card: r.group, label: r.label }); } });
    // STRONG: the kid's own reenactment (only if a personal phrase is present)
    var sents = t.split(/[.!?\n]+/).filter(function (s) { return rx(E.own.personal).test(s); });
    if (sents.length) {
      ['militia', 'british'].forEach(function (k) { var S = st.sides[k]; if (!S || !S.played) return; var v = S.version;
        ['shooter', 'location', 'aftermath'].forEach(function (dim) { var p = E.own[dim][v[dim]]; if (p && sents.some(function (s) { return rx(p).test(s); })) res.own.push({ kind: dim, side: k, value: v[dim] }); });
        Object.keys(E.own.cards).forEach(function (cid) { var col = S.score.cards[cid], cp = rx(E.own.cards[cid]), colp = rx(E.own.colors[col]);
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
    var mentions = { militia: E.accounts.militia.any.some(function (p) { return rx(p).test(t); }), british: E.accounts.british.any.some(function (p) { return rx(p).test(t); }) };
    var opposing = st2 === 'british' ? ['british'] : st2 === 'militia' ? ['militia'] : ['militia', 'british'];
    var missing = opposing.filter(function (k) { return !mentions[k]; }), weigh = rx(E.weighing).test(t);
    res.criteria.otherSide = { pass: !missing.length && weigh, mentions: mentions, opposing: opposing, weighing: weigh };
    res.criteria.length = { pass: n >= E.minWords, words: n, need: E.minWords };
    // hints
    function f(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
    if (!res.criteria.evidence.pass) res.hints.push(refCount === 0 ? E.hints.refs0 : f(E.hints.refs1, { got: res.refs.length ? res.refs[0].label.replace(/^"|"$/g, '') : 'your own reenactment' }));
    missing.forEach(function (k) { var acc = k === 'british' ? 'british' : 'militia', played = st.sides[acc] && st.sides[acc].played;
      res.hints.push(f(played ? E.hints.otherPlayed : E.hints.otherNotPlayed, { other: E.accounts[k].label })); });
    if (!missing.length && !weigh) res.hints.push(E.hints.weigh);
    if (!res.criteria.length.pass) res.hints.push(f(E.hints.length, { min: E.minWords, n: n }));
    if (!st2) res.hints.push(E.hints.stance);
    if (!res.own.length && anyPlayed()) res.hints.push(E.hints.own);
    res.passed = res.criteria.evidence.pass && res.criteria.otherSide.pass && res.criteria.length.pass;
    return res;
  }
  function anyPlayed() { return !!((st.sides.militia && st.sides.militia.played) || (st.sides.british && st.sides.british.played)); }
  function telSnapshot() {
    var T0 = essay.tel, now = performance.now(), chars = essay.text.length;
    var ms = T0.msFocused + (T0.focusSince ? now - T0.focusSince : 0), ratio = chars ? T0.keystrokes / chars : null;
    return { msFocused: Math.round(ms), msFirstToLastKey: T0.firstKeyAt ? Math.round(T0.lastKeyAt - T0.firstKeyAt) : 0, keystrokes: T0.keystrokes, inputEvents: T0.inputEvents, deletes: T0.deletes,
      finalChars: chars, finalWords: words(essay.text), keystrokeRatio: ratio == null ? null : +ratio.toFixed(2), pasteAttempts: T0.pasteAttempts, dropAttempts: T0.dropAttempts, log: T0.log.slice(-20) };
  }
  function flags() { var s = telSnapshot(), th = E.telemetry;
    return { pasteAttempted: s.pasteAttempts + s.dropAttempts > 0, lowKeystrokeRatio: s.finalChars >= th.minCharsForRatio && s.keystrokeRatio != null && s.keystrokeRatio < th.lowRatio, aiSuspected: null }; }
  function goEssay(text) {
    if (!anyDone()) ensurePreset('militia');
    hideTransient(); st.stage = 'essay'; st.view = 'main'; controls.enabled = false;
    if (text != null) essay.text = text;
    setTitle('Your answer', 'case notes');
    var p = setPanel('full', '<div class="wg-h">' + esc(E.question) + '</div>' +
      '<p class="wg-p">Use at least ' + E.minRefs + ' pieces of evidence, say what the other side claims and why it\u2019s weaker (or still possible). About ' + E.minWords + '+ words.</p>' +
      '<textarea class="wg-ta" rows="5" spellcheck="true" aria-label="Your answer" placeholder="I think ... because ..."></textarea>' +
      '<div class="wg-row" style="justify-content:space-between;margin-top:4px"><span class="wg-wc"></span><span class="wg-pastemsg" style="display:none">Pasting is off \u2014 please type your own words.</span></div>' +
      '<div class="wg-res"></div>' +
      '<div class="wg-row end wg-sticky"><button type="button" class="wg-btn ghost" data-s="room">\u2039 Evidence room</button>' + (!bothDone() ? '<button type="button" class="wg-btn ghost" data-s="other">Play ' + esc(lc(D.sides[otherSide()].label)) + '</button>' : '') +
      '<button type="button" class="wg-btn primary" data-s="check">Check my answer</button></div>');
    var ta = p.querySelector('textarea'), wc = p.querySelector('.wg-wc'), pm = p.querySelector('.wg-pastemsg');
    ta.value = essay.text;
    function upd() { var n = words(ta.value); wc.textContent = n + ' / ' + E.minWords + ' words'; wc.style.color = n >= E.minWords ? '#2e9e5b' : 'var(--sub)'; }
    function blocked(kind, e) { e.preventDefault(); var tel = essay.tel; if (kind === 'drop') tel.dropAttempts++; else tel.pasteAttempts++;
      var len = 0; try { len = ((e.clipboardData || e.dataTransfer).getData('text') || '').length; } catch (x) {}
      tel.log.push({ kind: kind, at: Math.round(performance.now()), chars: len }); pm.style.display = ''; setTimeout(function () { pm.style.display = 'none'; }, 2500); }
    ta.addEventListener('paste', function (e) { blocked('paste', e); });
    ta.addEventListener('drop', function (e) { blocked('drop', e); });
    ta.addEventListener('dragover', function (e) { e.preventDefault(); });
    ta.addEventListener('beforeinput', function (e) { if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop' || e.inputType === 'insertFromPasteAsQuotation') blocked(e.inputType === 'insertFromDrop' ? 'drop' : 'paste', e); });
    ta.addEventListener('keydown', function (e) { var tel = essay.tel, now = performance.now();
      if (e.key && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete')) { tel.keystrokes++; if (!tel.firstKeyAt) tel.firstKeyAt = now; tel.lastKeyAt = now; if (e.key === 'Backspace' || e.key === 'Delete') tel.deletes++; } });
    ta.addEventListener('input', function () { essay.tel.inputEvents++; essay.text = ta.value; upd(); });
    ta.addEventListener('focus', function () { var tel = essay.tel; if (!tel.startedAt) tel.startedAt = performance.now(); tel.focusSince = performance.now(); });
    ta.addEventListener('blur', function () { var tel = essay.tel; if (tel.focusSince) { tel.msFocused += performance.now() - tel.focusSince; tel.focusSince = null; } });
    upd();
    p.querySelector('[data-s=room]').addEventListener('click', function () { goEvidenceRoom(); });
    var o = p.querySelector('[data-s=other]'); if (o) o.addEventListener('click', function () { st.draft = {}; goSetup(otherSide(), 1); });
    p.querySelector('[data-s=check]').addEventListener('click', function () { runCheck(); });
    if (essay.result) showResult(essay.result);
  }
  function runCheck() { essay.result = check(essay.text); showResult(essay.result); return essay.result; }
  function showResult(r) {
    if (!panel || st.stage !== 'essay') return; var box = panel.querySelector('.wg-res');
    function row(ok, txt) { return '<div class="wg-crit ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? '\u2713' : '\u2717') + '</b><span>' + txt + '</span></div>'; }
    var c = r.criteria, h = '';
    if (r.passed) h += '<div style="margin:6px 0"><span class="wg-stamp ok">CASE CLOSED \u2713</span><b>Great detective work!</b></div>';
    h += row(c.evidence.pass, 'Evidence: ' + c.evidence.count + ' of ' + c.evidence.need + (r.refs.length ? ' \u2014 ' + r.refs.map(function (x) { return esc(x.label); }).join('; ') : '') + (c.evidence.strong ? ' <span class="wg-badge green">+ your own reenactment (strong!)</span>' : ''));
    h += row(c.otherSide.pass, 'The other side: ' + (c.otherSide.pass ? 'you explained it' : 'not yet'));
    h += row(c.length.pass, 'Length: ' + c.length.words + ' / ' + c.length.need + ' words');
    if (r.hints.length) h += '<ul class="wg-hints">' + r.hints.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    box.innerHTML = h; try { box.scrollIntoView({ block: 'nearest' }); } catch (x) {}
    if (r.passed) { confetti(); var row2 = panel.querySelector('.wg-sticky'); if (row2 && !row2.querySelector('[data-s=again]')) { var b = el('button', 'wg-btn', row2, 'Play again'); b.type = 'button'; b.setAttribute('data-s', 'again');
      b.addEventListener('click', function () { st.sides = { militia: null, british: null }; essay.text = ''; essay.result = null; essay.tel = newTel(); startCutscene(); }); } }
  }

  // ---------------- sizing + render ----------------
  var vw = 1, vh = 1;
  function resize() {
    vw = Math.max(1, host.clientWidth || window.innerWidth); vh = Math.max(1, host.clientHeight || window.innerHeight);
    R.setSize(vw, vh, false); W.globe.cam.aspect = vw / vh; W.globe.cam.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(host);
  function panelOffset() {                             // keep the action above a bottom panel
    if (!panel || panel.classList.contains('full') || panel.classList.contains('center')) return 0;
    return Math.min(vh * 0.4, panel.offsetHeight + 10) / 2;
  }
  var tagV = new T.Vector3();
  function placeTag(tag, lex, P, t, camera, x0, w) {
    if (!P || t < lex.SHOT_T - 0.7 || t > lex.SHOT_T + 2.6 || !lex.shooterWorld(P, tagV)) { tag.style.display = 'none'; return; }
    tagV.y += 0.5; var s = W.project(tagV, camera, w, vh);
    if (!s.vis) { tag.style.display = 'none'; return; }
    tag.style.display = 'block'; tag.style.left = (x0 + s.x) + 'px'; tag.style.top = s.y + 'px';
    tag.textContent = t < lex.SHOT_T ? 'watch here' : '1st shot!';
  }
  function render() {
    if (st.view === 'globe') { R.setScissorTest(false); R.setViewport(0, 0, vw, vh); R.render(W.globe.scene, W.globe.cam); return; }
    cam.aspect = vw / vh; var o = st.stage === 'cutscene' ? 0 : panelOffset();
    if (o) cam.setViewOffset(vw, vh, 0, o, vw, vh); else cam.clearViewOffset(); cam.updateProjectionMatrix();
    R.setScissorTest(false); R.setViewport(0, 0, vw, vh); R.render(lexA.scene, cam);
    if (st.stage === 'replay') placeTag(tagA, lexA, plans.A, st.repT, cam, 0, vw); else tagA.style.display = 'none';
  }

  // ---------------- loop ----------------
  var last = performance.now(), clockT = 0;
  function frame(dtOverride, noRender) {
    var now = performance.now(), dt = typeof dtOverride === 'number' ? dtOverride : Math.min(0.1, (now - last) / 1000); last = now;
    if (st.paused && typeof dtOverride !== 'number') dt = 0;
    clockT += dt;
    if (st.stage === 'cutscene') stepCutscene(dt);
    else if (st.stage === 'replay') stepReplay(dt, clockT);
    else { lexA.fx.update(dt); if (st.stage === 'setup' && lexA.ring.visible) { var pul = 1 + 0.15 * Math.sin(clockT * 6); lexA.ring.scale.set(pul, pul, pul); }
      Object.keys(lexA.markers).forEach(function (k) { var m = lexA.markers[k]; if (m.visible) m.userData.m.material.opacity = 0.32 + 0.2 * Math.sin(clockT * 4); }); }
    if (controls.enabled && st.view === 'main') controls.update();
    if (!noRender) render();
  }
  R.setAnimationLoop(function () { frame(); });
  startCutscene();

  // ---------------- debug / test hook ----------------
  function steps(fn, seconds) { var n = Math.ceil((seconds || 0) / 0.05); for (var i = 0; i < n; i++) frame(0.05, true); if (fn) fn(); render(); }
  function normV(v, side) { var o = JSON.parse(JSON.stringify(v || {})); o.side = o.side || side || st.side || 'militia';
    var pre = D.sides[o.side].preset; ['shooter', 'location', 'aftermath'].forEach(function (k) { if (!o[k]) o[k] = pre[k]; });
    if (D.shooters[o.shooter].zones.indexOf(o.location) < 0) o.location = D.shooters[o.shooter].zones[0];
    if (!o.point) o.point = W.zonePoint(o.location, null); return o; }
  window.WitnessGame = {
    stages: ['cutscene', 'pick', 'setup', 'replay', 'evidence', 'evidenceRoom', 'essay'],
    data: D, essayRules: E, score: score,
    pause: function (v) { st.paused = v !== false; },
    setVersion: function (v) {
      var o = normV(v, v && v.side); st.side = o.side; st.draft = JSON.parse(JSON.stringify(o)); st.last = o;
      var sc = score(o); if (sc.accepted) st.sides[o.side] = { version: o, score: sc, played: true }; else if (st.sides[o.side] && !st.sides[o.side].score.accepted) st.sides[o.side] = null;
      return sc;
    },
    setEssay: function (text) {
      essay.text = String(text == null ? '' : text); essay.tel.log.push({ kind: 'setByHook', at: Math.round(performance.now()), chars: essay.text.length });
      if (panel && st.stage === 'essay') { var ta = panel.querySelector('textarea'); if (ta) { ta.value = essay.text; ta.dispatchEvent(new Event('input')); essay.tel.inputEvents--; } }
      return essay.text.length;
    },
    checkEssay: function () { var r = st.stage === 'essay' ? runCheck() : (essay.result = check(essay.text)); return { passed: r.passed, criteria: r.criteria, refs: r.refs, own: r.own, stance: r.stance, hints: r.hints }; },
    seek: function (stage, opts) {
      opts = opts || {}; st.paused = !!opts.pause;
      if (opts.militia) this.setVersion(Object.assign({ side: 'militia' }, opts.militia));
      if (opts.british) this.setVersion(Object.assign({ side: 'british' }, opts.british));
      if (stage === 'cutscene') { startCutscene(); steps(null, opts.t || 0); }
      else if (stage === 'pick') { goPick(); steps(null, 0.1); }
      else if (stage === 'setup') { var v = opts.version ? normV(opts.version, opts.side) : null; st.draft = v ? JSON.parse(JSON.stringify(v)) : {}; if (v) st.draft.side = v.side;
        goSetup(v ? v.side : (opts.side || 'militia'), opts.step || 1); steps(null, 0.1); }
      else if (stage === 'replay') { var rv = normV(opts.version, opts.side); goReplay(rv); steps(null, opts.t != null ? opts.t : 3); }
      else if (stage === 'evidence') { goEvidence(normV(opts.version, opts.side)); steps(null, 0.1); }
      else if (stage === 'evidenceRoom') { goEvidenceRoom(); steps(null, 0.1); }
      else if (stage === 'essay') { goEssay(opts.text != null ? String(opts.text) : null); steps(null, 0.1); if (opts.check) runCheck(); }
      else throw new Error('unknown stage ' + stage);
      return this.state();
    },
    state: function () {
      var sc = st.stage === 'evidence' ? st.score : (st.last ? score(st.last) : null), r = essay.result;
      return { stage: st.stage, side: st.side, step: st.step, view: st.view,
        version: st.last ? { side: st.last.side, shooter: st.last.shooter, location: st.last.location, aftermath: st.last.aftermath } : null,
        evidence: sc ? sc.cards : null, accepted: sc ? sc.accepted : null, reason: sc ? (sc.accepted ? (sc.redTestimony.length ? 'accepted; contradicts testimony: ' + sc.redTestimony.join(', ') : 'accepted') : sc.reasons.join(' ')) : null,
        redTestimony: sc ? sc.redTestimony : null, redFacts: sc ? sc.redFacts : null,
        sides: { militia: st.sides.militia ? { version: st.sides.militia.version, accepted: st.sides.militia.score.accepted, played: !!st.sides.militia.played, cards: st.sides.militia.score.cards } : null,
                 british: st.sides.british ? { version: st.sides.british.version, accepted: st.sides.british.score.accepted, played: !!st.sides.british.played, cards: st.sides.british.score.cards } : null },
        offerOtherSide: anyDone() && !bothDone(),
        essay: { text: essay.text, words: words(essay.text), checked: !!r, passed: r ? r.passed : null, criteria: r ? r.criteria : null, refs: r ? r.refs : null, own: r ? r.own : null, stance: r ? r.stance : null, hints: r ? r.hints : null,
                 telemetry: telSnapshot(), flags: flags() },
        cutsceneT: +st.cutT.toFixed(2), replayT: +st.repT.toFixed(2),
        drawCalls: R.info.render.calls, triangles: R.info.render.triangles, globePaintMs: W.globe.paintMs() };
    }
  };
})();
