/* Witness History — the Athenian fleet in the Great Harbour of Syracuse (413 BC) and
   Lexington Green (Apr 19, 1775, dawn), linked by a geographic time-travel transition:
   zoom out to a low-poly Earth (continents painted at runtime from embedded, simplified vector
   coastlines), spin faster and faster as the years run, then slow and
   zoom back in at the destination's real latitude/longitude. Coastlines: Natural Earth 1:50m (public domain).
   Classic script: needs window.THREE (three r186 + OrbitControls) loaded first from /f/.
   Mounts into #witness, else #scene, else document.body. Zero network requests. */
(function () {
  'use strict';
  var T = window.THREE;
  if (!T || !T.OrbitControls) { throw new Error('Witness History: window.THREE with OrbitControls not loaded'); }

  var HOLD = 14, TRANS = 9;                 // seconds per scene / per time-jump
  var TAU = Math.PI * 2;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  // ---------- host + DOM overlay ----------
  var host = document.getElementById('witness') || document.getElementById('scene') || document.body;
  if (host === document.body) {
    document.documentElement.style.height = '100%';
    document.body.style.cssText += ';margin:0;height:100%;min-height:360px';
  } else if (!host.clientHeight) { host.style.height = '420px'; }
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.style.overflow = 'hidden';

  var renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  var cv = renderer.domElement;
  cv.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%';
  host.appendChild(cv);

  function el(tag, css, parent) { var e = document.createElement(tag); e.style.cssText = css; (parent || host).appendChild(e); return e; }
  var FONT = 'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';
  var haze = el('div', 'position:absolute;inset:0;pointer-events:none;opacity:0;' +
    'background:radial-gradient(ellipse at center,#f4f7fb 0%,#dfe7f1 55%,#c3d0e0 100%)');
  var yearBox = el('div', FONT + 'position:absolute;left:50%;bottom:7%;transform:translate(-50%,0);pointer-events:none;opacity:0;' +
    'text-align:center;padding:6px 18px 8px;border-radius:14px;background:rgba(8,12,26,.62);' +
    'box-shadow:0 4px 18px rgba(0,0,0,.35);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)');
  var year = el('div', 'white-space:nowrap;font-size:clamp(28px,8vw,72px);font-weight:800;letter-spacing:.05em;color:#fff;' +
    'text-shadow:0 1px 2px rgba(0,0,0,.6);font-variant-numeric:tabular-nums;line-height:1.1', yearBox);
  var route = el('div', 'white-space:nowrap;font-size:clamp(11px,1.9vw,14px);color:#dfe6f5;opacity:.9;margin-top:2px', yearBox);
  var cap = el('div', FONT + 'position:absolute;left:12px;bottom:12px;max-width:min(78%,440px);padding:10px 14px;border-radius:10px;' +
    'pointer-events:none;line-height:1.3;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)');
  var capPlace = el('div', 'font-weight:700;font-size:clamp(13px,2.4vw,17px)', cap);
  var capDate = el('div', 'font-size:clamp(12px,2.1vw,15px);opacity:.95', cap);
  var capNote = el('div', 'font-size:clamp(11px,1.8vw,13px);opacity:.8;margin-top:4px', cap);
  var barWrap = el('div', 'height:3px;border-radius:2px;margin-top:8px;overflow:hidden', cap);
  var bar = el('div', 'height:100%;width:0%', barWrap);
  var btn = el('button', FONT + 'position:absolute;right:12px;top:12px;padding:8px 12px;border-radius:999px;cursor:pointer;' +
    'font-size:13px;font-weight:600;border:1px solid transparent');
  btn.type = 'button';
  var hint = el('div', FONT + 'position:absolute;right:12px;bottom:12px;font-size:11px;pointer-events:none;padding:3px 7px;border-radius:6px');
  hint.textContent = 'drag to look around · scroll to zoom';

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  // Theme: prefer the host doc's theme if the widget runtime exposes one (window.margin.theme /
  // colorScheme, or a data-theme / color-scheme / .dark|.light marker on <html>); else the OS setting.
  function themeIsLight() {
    var m = window.margin, t = m && (m.theme || m.colorScheme);
    if (typeof t === 'function') { try { t = t(); } catch (e) { t = null; } }
    if (t === 'light' || t === 'dark') return t === 'light';
    var de = document.documentElement, a = de.getAttribute('data-theme') || de.style.colorScheme;
    if (a === 'light' || a === 'dark') return a === 'light';
    if (de.classList.contains('dark')) return false;
    if (de.classList.contains('light')) return true;
    return !!(mq && mq.matches);
  }
  var lastLight = null;
  function applyTheme() {
    var light = themeIsLight(); lastLight = light;
    cap.style.background = light ? 'rgba(255,255,255,.86)' : 'rgba(12,14,20,.74)';
    cap.style.color = light ? '#14171f' : '#f3f4f8';
    cap.style.boxShadow = light ? '0 2px 10px rgba(0,0,0,.18)' : '0 2px 12px rgba(0,0,0,.5)';
    barWrap.style.background = light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.18)';
    bar.style.background = light ? '#a4492a' : '#ffb871';
    btn.style.background = light ? 'rgba(255,255,255,.92)' : 'rgba(16,18,26,.8)';
    btn.style.color = light ? '#14171f' : '#f3f4f8';
    btn.style.borderColor = light ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.25)';
    hint.style.background = light ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.45)';
    hint.style.color = light ? '#333' : '#ddd';
  }
  applyTheme();
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', applyTheme); else mq.addListener(applyTheme); }
  setInterval(function () { if (themeIsLight() !== lastLight) applyTheme(); }, 1500);
  if (typeof MutationObserver === 'function') new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });

  // ---------- core scene ----------
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(50, 1, 0.1, 600);
  scene.add(camera);
  var controls = new T.OrbitControls(camera, cv);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 4; controls.maxDistance = 70; controls.maxPolarAngle = Math.PI * 0.48;

  var matCache = {};
  function mat(hex, extra) {
    var k = hex + (extra ? JSON.stringify(extra) : '');
    if (!matCache[k]) { var o = { color: hex, roughness: 0.85, metalness: 0.05, flatShading: true };
      if (extra) for (var p in extra) o[p] = extra[p]; matCache[k] = new T.MeshStandardMaterial(o); }
    return matCache[k];
  }
  function mesh(geo, m, cast, recv) { var x = new T.Mesh(geo, m); x.castShadow = cast !== false; x.receiveShadow = !!recv; return x; }
  // gable roof / pediment: triangular prism, ridge along X, spanning `span` in Z
  function gable(len, span, h) {
    var sh = new T.Shape(); sh.moveTo(-span / 2, 0); sh.lineTo(span / 2, 0); sh.lineTo(0, h); sh.lineTo(-span / 2, 0);
    var g = new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2); return g;
  }
  // Draw-call reduction: merge every static MeshStandardMaterial mesh under `root` (skipping subtrees
  // flagged userData.dyn and meshes flagged userData.keep) into ONE vertex-coloured mesh.
  var VCM = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.05 });
  function bake(root) {
    root.updateMatrixWorld(true);
    var inv = new T.Matrix4().copy(root.matrixWorld).invert(), list = [], m4 = new T.Matrix4();
    (function walk(o) { for (var i = 0; i < o.children.length; i++) { var c = o.children[i]; if (c.userData.dyn) continue;
      if (c.isMesh && !c.isInstancedMesh && !c.userData.keep && c.material && c.material.isMeshStandardMaterial && !c.material.transparent && !c.material.vertexColors) list.push(c);
      walk(c); } })(root);
    if (!list.length) return;
    var parts = [], total = 0;
    list.forEach(function (c) {
      var g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      for (var k in g.attributes) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(m4.multiplyMatrices(inv, c.matrixWorld));
      parts.push({ g: g, c: c.material.color }); total += g.attributes.position.count;
    });
    var P = new Float32Array(total * 3), N = new Float32Array(total * 3), C = new Float32Array(total * 3), o = 0;
    parts.forEach(function (pt) { var pa = pt.g.attributes.position.array, na = pt.g.attributes.normal.array;
      P.set(pa, o * 3); N.set(na, o * 3); for (var i = 0, n = pa.length / 3; i < n; i++) { C[(o + i) * 3] = pt.c.r; C[(o + i) * 3 + 1] = pt.c.g; C[(o + i) * 3 + 2] = pt.c.b; }
      o += pa.length / 3; pt.g.dispose(); });
    var mg = new T.BufferGeometry();
    mg.setAttribute('position', new T.BufferAttribute(P, 3)); mg.setAttribute('normal', new T.BufferAttribute(N, 3)); mg.setAttribute('color', new T.BufferAttribute(C, 3));
    mg.computeBoundingSphere();
    list.forEach(function (c) { c.parent.remove(c); });
    var merged = new T.Mesh(mg, VCM); merged.castShadow = true; merged.receiveShadow = true; root.add(merged);
  }
  function bakeScene(g) { bake(g); g.children.slice().forEach(function (c) { if (c.userData.dyn) bake(c); }); }

  function skyDome(top, mid, horizon) {
    var g = new T.SphereGeometry(400, 32, 16), pos = g.attributes.position, cols = [], c = new T.Color();
    var cT = new T.Color(top), cM = new T.Color(mid), cH = new T.Color(horizon);
    for (var i = 0; i < pos.count; i++) {
      var h = pos.getY(i) / 400;
      if (h < 0) c.copy(cH); else if (h < 0.25) c.copy(cH).lerp(cM, h / 0.25); else c.copy(cM).lerp(cT, (h - 0.25) / 0.75);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    var m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
    m.renderOrder = -1; return m;
  }
  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.18, 'rgba(255,225,160,.95)');
    g.addColorStop(0.45, 'rgba(255,170,90,.35)'); g.addColorStop(1, 'rgba(255,140,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  var GLOW = glowTex();
  function sun(dir, size) {
    var s = new T.Sprite(new T.SpriteMaterial({ map: GLOW, fog: false, depthWrite: false, transparent: true, blending: T.AdditiveBlending }));
    s.position.copy(dir).normalize().multiplyScalar(350); s.scale.set(size, size, 1); return s;
  }
  function lights(group, skyCol, groundCol, hemiI, sunCol, sunI, sunPos, extent) {
    group.add(new T.HemisphereLight(skyCol, groundCol, hemiI));
    var d = new T.DirectionalLight(sunCol, sunI); d.position.copy(sunPos); d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024); d.shadow.bias = -0.0006; d.shadow.normalBias = 0.02;
    var sc = d.shadow.camera; sc.left = -extent; sc.right = extent; sc.top = extent; sc.bottom = -extent; sc.near = 1; sc.far = 220;
    group.add(d); group.add(d.target);
  }
  function terrain(w, d, segW, segD, color, heightFn) {
    var g = new T.PlaneGeometry(w, d, segW, segD); g.rotateX(-Math.PI / 2);
    var p = g.attributes.position;
    for (var i = 0; i < p.count; i++) p.setY(i, heightFn(p.getX(i), p.getZ(i)));
    g.computeVertexNormals(); return mesh(g, mat(color), false, true);
  }

  // ---------- low-poly people ----------
  var G = {
    leg: new T.BoxGeometry(0.13, 0.75, 0.14).translate(0, -0.375, 0),
    torso: new T.BoxGeometry(0.42, 0.62, 0.26),
    coatTail: new T.BoxGeometry(0.44, 0.22, 0.28),
    arm: new T.BoxGeometry(0.11, 0.58, 0.12).translate(0, -0.27, 0),
    head: new T.IcosahedronGeometry(0.15, 0),
    tricorne: new T.ConeGeometry(0.26, 0.14, 3),
    roundHat: new T.CylinderGeometry(0.26, 0.26, 0.04, 8),
    roundCrown: new T.CylinderGeometry(0.13, 0.15, 0.14, 8),
    helmet: new T.SphereGeometry(0.2, 8, 4, 0, TAU, 0, Math.PI / 2),
    musket: new T.BoxGeometry(0.05, 1.25, 0.05),
    belt: new T.BoxGeometry(0.44, 0.07, 0.27),
    pack: new T.BoxGeometry(0.32, 0.36, 0.14)
  };
  var SKIN = [0xe0b48f, 0xc99a73, 0xa97a55, 0xd7a985, 0x8d5e3c];
  function person(o) {
    var g = new T.Group(), legs = [];
    for (var s = -1; s <= 1; s += 2) { var l = mesh(G.leg, mat(o.pants)); l.position.set(s * 0.1, 0.78, 0); l.userData.keep = true; g.add(l); legs.push(l); }
    var torso = mesh(G.torso, mat(o.coat)); torso.position.y = 1.1; g.add(torso);
    if (o.tails) { var ct = mesh(G.coatTail, mat(o.coat)); ct.position.set(0, 0.72, -0.01); g.add(ct); }
    if (o.belts) { var b = mesh(G.belt, mat(o.belts)); b.position.y = 1.18; b.rotation.z = 0.7; g.add(b);
      var b2 = mesh(G.belt, mat(o.belts)); b2.position.y = 1.18; b2.rotation.z = -0.7; g.add(b2); }
    if (o.pack) { var pk = mesh(G.pack, mat(o.pack)); pk.position.set(0, 1.12, -0.2); g.add(pk); }
    for (s = -1; s <= 1; s += 2) { var a = mesh(G.arm, mat(o.coat)); a.position.set(s * 0.27, 1.38, 0); a.rotation.x = s > 0 ? -0.35 : 0.1; g.add(a); }
    var head = mesh(G.head, mat(SKIN[(Math.random() * SKIN.length) | 0])); head.position.y = 1.58; g.add(head);
    var hat;
    if (o.hat === 'tricorne') { hat = mesh(G.tricorne, mat(o.hatColor || 0x1b1b1b)); hat.position.y = 1.74; hat.rotation.y = Math.PI / 3; }
    else if (o.hat === 'round') { hat = new T.Group(); hat.add(mesh(G.roundHat, mat(o.hatColor))); var cr = mesh(G.roundCrown, mat(o.hatColor)); cr.position.y = 0.08; hat.add(cr); hat.position.y = 1.7; }
    else if (o.hat === 'helmet') { hat = mesh(G.helmet, mat(o.hatColor || 0x4b5320)); hat.position.y = 1.62; }
    if (hat) g.add(hat);
    if (o.musket) { var m = mesh(G.musket, mat(0x4a3420)); m.position.set(0.3, 1.45, 0.08); m.rotation.x = -0.25; m.rotation.z = -0.12; g.add(m); }
    g.userData.legs = legs; g.userData.phase = Math.random() * TAU;
    return g;
  }
  function walk(p, t, speed) { var a = Math.sin(t * speed + p.userData.phase) * 0.45; p.userData.legs[0].rotation.x = a; p.userData.legs[1].rotation.x = -a; }

  // ---------- smoke (musket / cannon haze, purely atmospheric) ----------
  var PUFF = new T.IcosahedronGeometry(0.5, 1);
  function smokePool(group, n, color) {
    var pool = [];
    for (var i = 0; i < n; i++) {
      var m = new T.Mesh(PUFF, new T.MeshStandardMaterial({ color: color, roughness: 1, transparent: true, opacity: 0, depthWrite: false, flatShading: true }));
      m.visible = false; group.add(m); pool.push({ m: m, life: 0, max: 1, v: new T.Vector3() });
    }
    return {
      spawn: function (pos, size) {
        for (var i = 0; i < pool.length; i++) if (pool[i].life <= 0) {
          var p = pool[i]; p.life = p.max = rnd(3, 5); p.size = size || 1; p.m.position.copy(pos);
          p.v.set(rnd(0.3, 0.7), rnd(0.15, 0.35), rnd(-0.2, 0.2)); p.m.visible = true; return;
        }
      },
      update: function (dt) {
        for (var i = 0; i < pool.length; i++) { var p = pool[i]; if (p.life <= 0) continue; p.life -= dt;
          var k = 1 - p.life / p.max; p.m.position.addScaledVector(p.v, dt);
          p.m.scale.setScalar(p.size * (0.4 + k * 2.6)); p.m.material.opacity = 0.75 * (1 - k) * Math.min(1, k * 8);
          if (p.life <= 0) p.m.visible = false; }
      },
      clear: function () { for (var i = 0; i < pool.length; i++) { pool[i].life = 0; pool[i].m.visible = false; } }
    };
  }

  // ======================= SCENE B: Lexington Green, 1775 =======================
  function buildLexington() {
    var g = new T.Group();
    g.add(skyDome(0x3d4f7c, 0xd99a8a, 0xffc98f));
    var sunDir = new T.Vector3(-1, 0.12, -0.55);
    g.add(sun(sunDir, 120));
    lights(g, 0xbdc6ee, 0x5a5236, 0.9, 0xffb46b, 2.4, sunDir.clone().multiplyScalar(60), 40);

    g.add(terrain(220, 220, 44, 44, 0x5f7a3a, function (x, z) {
      var r = Math.sqrt(x * x + z * z); return r < 26 ? (Math.random() - 0.5) * 0.08 : (r - 26) * 0.04 * (1 + Math.sin(x * 0.07) * Math.cos(z * 0.09)) + (Math.random() - 0.5) * 0.6;
    }));
    // the green (slightly lighter) + road
    var green = mesh(new T.CircleGeometry(20, 9).rotateX(-Math.PI / 2), mat(0x6f8d43), false, true); green.position.y = 0.05; g.add(green);
    var road = mesh(new T.PlaneGeometry(4.5, 120).rotateX(-Math.PI / 2), mat(0x8a7354), false, true); road.position.set(2.5, 0.07, 30); g.add(road);

    // meetinghouse
    var mh = new T.Group(); mh.position.set(-12, 0, -16); mh.rotation.y = 0.25;
    var body = mesh(new T.BoxGeometry(10, 5.5, 7), mat(0xe9e3d3), true, true); body.position.y = 2.75; mh.add(body);
    var roof = mesh(gable(10.8, 7.8, 3.2), mat(0x5b4a3e)); roof.position.y = 5.5; mh.add(roof);
    var tower = mesh(new T.BoxGeometry(2.4, 3.2, 2.4), mat(0xe9e3d3)); tower.position.set(0, 9.2, 0); mh.add(tower);
    var spire = mesh(new T.ConeGeometry(1.5, 4.2, 4), mat(0x5b4a3e)); spire.position.set(0, 12.9, 0); spire.rotation.y = Math.PI / 4; mh.add(spire);
    for (var w = -3; w <= 3; w += 2) { var win = mesh(new T.BoxGeometry(0.9, 1.4, 0.1), mat(0x2d3440), false); win.position.set(w * 1.3, 3, 3.52); mh.add(win); }
    var door = mesh(new T.BoxGeometry(1.4, 2.4, 0.1), mat(0x4a3a2a), false); door.position.set(0, 1.2, 3.53); mh.add(door);
    g.add(mh);
    // houses (tavern etc.)
    var houses = [[-24, 6, 0.6, 0x7a4b3a], [22, -10, -0.4, 0xd9cfb8], [-20, 22, 1.1, 0x5e6b73], [24, 16, -1.2, 0x8c5a3c]];
    houses.forEach(function (h) {
      var hg = new T.Group(); hg.position.set(h[0], 0, h[1]); hg.rotation.y = h[2];
      var hb = mesh(new T.BoxGeometry(7, 4, 5), mat(h[3]), true, true); hb.position.y = 2; hg.add(hb);
      var hr = mesh(gable(7.6, 5.8, 2.4), mat(0x3f3a36)); hr.position.y = 4; hg.add(hr);
      var ch = mesh(new T.BoxGeometry(0.8, 2.4, 0.8), mat(0x6b4b3b)); ch.position.set(2.2, 5.4, 0); hg.add(ch);
      g.add(hg);
    });
    // trees
    for (var i = 0; i < 46; i++) {
      var a = rnd(0, TAU), r = rnd(30, 75), tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      if (Math.abs(tx - 2.5) < 6 && tz > 0) continue;
      var tr = new T.Group(); tr.position.set(tx, (r - 26) * 0.04, tz);
      var trunk = mesh(new T.CylinderGeometry(0.25, 0.35, 2, 5), mat(0x4b3621)); trunk.position.y = 1; tr.add(trunk);
      var crown = mesh(new T.ConeGeometry(rnd(1.8, 2.8), rnd(4.5, 7), 6), mat([0x2f4a26, 0x3a5a2c, 0x5a6b2c][i % 3])); crown.position.y = 4.4; tr.add(crown);
      var sc = rnd(0.8, 1.3); tr.scale.setScalar(sc); g.add(tr);
    }
    // militia: two loose ranks on the green, facing the road
    var militia = [], militiaPos = [], coats = [0x6b4a2f, 0x4f5a45, 0x4a5568, 0x8a6f4a, 0x5a3d2b, 0x3e4a5c];
    for (var rnk = 0; rnk < 2; rnk++) for (var k = 0; k < 9; k++) {
      var m = person({ coat: coats[(k + rnk * 3) % coats.length], pants: [0xc8b48a, 0x6d5a45, 0x8b7d6b][k % 3],
        hat: (k + rnk) % 3 ? 'round' : 'tricorne', hatColor: (k % 2) ? 0x3b2f22 : 0x1e1e1e, musket: true });
      m.position.set(-8 + k * 1.9 + rnd(-0.3, 0.3), 0.05, -3 - rnk * 1.6 + rnd(-0.3, 0.3));
      m.rotation.y = 0.15 + rnd(-0.2, 0.2); g.add(m); militia.push(m); militiaPos.push({ position: m.position.clone(), rotation: { y: m.rotation.y } });
    }
    // British regulars: column of threes advancing up the road
    var regs = [];
    for (var row = 0; row < 10; row++) for (var col = 0; col < 3; col++) {
      var rg = person({ coat: 0xb3262b, pants: 0xe8e2d0, tails: true, belts: 0xf2efe6, pack: 0x5a4632, hat: 'tricorne', musket: true });
      rg.userData.dyn = true; rg.rotation.y = Math.PI; rg.userData.ox = 1.2 + col * 1.3; rg.userData.oz = row * 1.6; g.add(rg); regs.push(rg);
    }
    // mounted officer at the column's head
    var horse = new T.Group();
    var hbody = mesh(new T.BoxGeometry(0.8, 0.9, 2.2), mat(0x3b2a1e)); hbody.position.y = 1.5; horse.add(hbody);
    var hneck = mesh(new T.BoxGeometry(0.45, 1.1, 0.5), mat(0x3b2a1e)); hneck.position.set(0, 2.1, -1.05); hneck.rotation.x = 0.5; horse.add(hneck);
    var hhead = mesh(new T.BoxGeometry(0.38, 0.4, 0.8), mat(0x3b2a1e)); hhead.position.set(0, 2.55, -1.45); horse.add(hhead);
    var hlegs = [];
    [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]].forEach(function (p) { var l = mesh(G.leg, mat(0x2e2016)); l.scale.set(1.3, 1.4, 1.3); l.position.set(p[0], 1.1, p[1]); l.userData.keep = true; horse.add(l); hlegs.push(l); });
    var rider = person({ coat: 0xb3262b, pants: 0xe8e2d0, tails: true, hat: 'tricorne' }); rider.position.y = 1.15; rider.userData.legs.forEach(function (l) { l.rotation.x = -1.2; }); horse.add(rider);
    horse.userData.dyn = true; g.add(horse);
    bakeScene(g);

    var smoke = smokePool(g, 36, 0xd9d5cc), tmp = new T.Vector3(), nextPuff = 0;
    return {
      group: g, fog: [0xe6b99c, 35, 180],
      cam: { pos: new T.Vector3(-15, 6, 27), target: new T.Vector3(0, 1.5, 2) },
      caption: ['Lexington Green, Massachusetts', 'April 19, 1775 · dawn',
        'Captain John Parker’s militia faces the advancing British regulars — the opening moment of the American Revolutionary War.'],
      reset: function () { smoke.clear(); nextPuff = 4; },
      update: function (dt, t, ht) {
        var adv = Math.min(ht, 11) * 1.55;                 // column advances then halts on the green
        var marching = ht < 11;
        for (var i = 0; i < regs.length; i++) { var r = regs[i];
          r.position.set(r.userData.ox, 0.05, 30 + r.userData.oz - adv);
          if (marching) walk(r, t, 7); else { r.userData.legs[0].rotation.x = r.userData.legs[1].rotation.x = 0; }
        }
        horse.position.set(0, 0.05, 27 - adv);
        hlegs.forEach(function (l, j) { l.rotation.x = marching ? Math.sin(t * 7 + j * 1.6) * 0.35 : 0; });
        if (ht > nextPuff) {                               // drifting powder smoke across the green
          var src = Math.random() < 0.5 ? militiaPos[(Math.random() * militiaPos.length) | 0] : regs[(Math.random() * 6) | 0];
          tmp.copy(src.position); tmp.y += 1.6; tmp.z += src.rotation.y > 1 ? -0.8 : 0.8;
          smoke.spawn(tmp, rnd(0.8, 1.4)); nextPuff = ht + rnd(0.25, 0.9);
        }
        smoke.update(dt);
      }
    };
  }

  // ======================= SCENE A: Great Harbour of Syracuse, 413 BC =======================
  function buildSyracuse() {
    var g = new T.Group();
    g.add(skyDome(0x2f6fc0, 0x9cc6ea, 0xf3e3c2));
    var sunDir = new T.Vector3(0.75, 0.6, 0.55);
    g.add(sun(sunDir, 90));
    lights(g, 0xd6e8ff, 0x9a8a62, 1.0, 0xfff0d2, 2.7, sunDir.clone().multiplyScalar(70), 60);

    // shore + hills (land at -z), Mediterranean sea (+z)
    var land = terrain(300, 120, 50, 24, 0xc9b27e, function (x, z) {
      var zz = z - 40; var y = 0.08 * (-12 - zz) + 0.3; if (zz < -40) y += (-40 - zz) * 0.3 * (0.6 + 0.4 * Math.sin(x * 0.04));
      return y + (Math.random() - 0.5) * (zz < -40 ? 1.4 : 0.2);
    });
    land.position.z = -40; g.add(land);
    for (var i = 0; i < 10; i++) {
      var hill = mesh(new T.IcosahedronGeometry(rnd(12, 20), 0), mat([0x8f8a58, 0x7d7f4c, 0xa0915f][i % 3]), false, true);
      hill.position.set(-130 + i * 28 + rnd(-6, 6), rnd(-3, 2), rnd(-100, -85)); hill.scale.y = rnd(0.45, 0.75); g.add(hill);
    }
    var seaGeo = new T.PlaneGeometry(340, 240, 56, 40); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, 0, 100);
    var seaPos = seaGeo.attributes.position, seaBase = new Float32Array(seaPos.count * 2);
    for (i = 0; i < seaPos.count; i++) { seaBase[i * 2] = seaPos.getX(i); seaBase[i * 2 + 1] = seaPos.getZ(i); }
    var sea = mesh(seaGeo, new T.MeshStandardMaterial({ color: 0x1f7f9a, roughness: 0.3, metalness: 0.1, flatShading: true }), false, true);
    sea.position.y = -0.1; sea.userData.keep = true; g.add(sea);

    // city walls of Syracuse along the shore, with towers and crenellations
    var stone = mat(0xdccba5), WALL_Z = -24;
    var wall = mesh(new T.BoxGeometry(170, 6, 3), stone, true, true); wall.position.set(0, 3 + 0.5, WALL_Z); g.add(wall);
    var merlonGeo = new T.BoxGeometry(1.1, 1, 3.1), NM = 76;
    var merlons = new T.InstancedMesh(merlonGeo, stone, NM); merlons.castShadow = true; var mm = new T.Matrix4();
    for (i = 0; i < NM; i++) { mm.makeTranslation(-84 + i * 2.24, 7, WALL_Z); merlons.setMatrixAt(i, mm); } g.add(merlons);
    for (i = -4; i <= 4; i++) { var tw = mesh(new T.BoxGeometry(6, 10, 6), mat(0xd2c09a), true, true); tw.position.set(i * 20, 5.5, WALL_Z); g.add(tw);
      var tc = mesh(new T.BoxGeometry(6.6, 0.8, 6.6), mat(0xc4b08a)); tc.position.set(i * 20, 10.8, WALL_Z); g.add(tc); }
    var gate = mesh(new T.BoxGeometry(4, 4.5, 0.4), mat(0x5a4632), false); gate.position.set(10, 2.6, WALL_Z + 1.6); g.add(gate);
    // houses behind the walls
    for (i = 0; i < 26; i++) {
      var hx = rnd(-75, 75), hz = rnd(-56, -32), hy = 0.08 * (-12 - hz) + 0.3 + Math.max(0, (-40 - hz)) * 0.3 * 0.8;
      var hw = rnd(4, 7), hd = rnd(4, 6), hh = rnd(3, 5);
      var hb = mesh(new T.BoxGeometry(hw, hh, hd), mat([0xefe6d2, 0xe2cfa9, 0xd9c29a][i % 3]), true, true); hb.position.set(hx, hy + hh / 2, hz); g.add(hb);
      var hr = mesh(new T.ConeGeometry(Math.max(hw, hd) * 0.72, 1.6, 4), mat(0xb5583a)); hr.rotation.y = Math.PI / 4; hr.scale.set(hw / Math.max(hw, hd), 1, hd / Math.max(hw, hd)); hr.position.set(hx, hy + hh + 0.8, hz); g.add(hr);
    }
    // temple on the rise (Doric, low-poly)
    var temple = new T.Group(); temple.position.set(-28, 7, -66);
    var base = mesh(new T.BoxGeometry(22, 1.6, 11), mat(0xe8dfca), true, true); base.position.y = 0.8; temple.add(base);
    var colGeo = new T.CylinderGeometry(0.45, 0.55, 6, 8), cols = new T.InstancedMesh(colGeo, mat(0xf1ead8), 24); cols.castShadow = true;
    var ci = 0; for (var cx = 0; cx < 8; cx++) for (var cz = 0; cz < 2; cz++) { mm.makeTranslation(-9.4 + cx * 2.7, 4.6, cz ? 4.4 : -4.4); cols.setMatrixAt(ci++, mm); }
    for (cz = 1; cz < 5; cz++) for (cx = 0; cx < 2; cx++) { mm.makeTranslation(cx ? 9.5 : -9.5, 4.6, -4.4 + cz * 1.76); cols.setMatrixAt(ci++, mm); }
    temple.add(cols);
    var ent = mesh(new T.BoxGeometry(22, 1.2, 11), mat(0xe8dfca)); ent.position.y = 8.2; temple.add(ent);
    var ped = mesh(gable(22.4, 11.4, 2.4), mat(0xd9cdb2)); ped.position.y = 8.8; temple.add(ped);
    g.add(temple);

    // triremes: three banks of oars, bronze ram, painted eyes, hoplite shields along the rail
    var BRONZE = new T.MeshStandardMaterial({ color: 0xb4874a, metalness: 0.75, roughness: 0.35, flatShading: true });
    var OAR = new T.BoxGeometry(0.07, 0.06, 3.2).translate(0, 0, 1.6);
    var SHIELD = new T.CylinderGeometry(0.32, 0.32, 0.06, 10).rotateX(Math.PI / 2);
    var EYE = new T.CircleGeometry(0.28, 10), PUPIL = new T.CircleGeometry(0.13, 8);
    function trireme(hullCol, stripeCol, shieldCol) {
      var s = new T.Group();
      var hull = mesh(new T.BoxGeometry(15, 1.5, 2.5), mat(hullCol)); hull.position.y = 0.55; s.add(hull);
      var bow = mesh(new T.ConeGeometry(1.25, 3.2, 4), mat(hullCol)); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.scale.set(1, 1, 0.7); bow.position.set(9.1, 0.65, 0); s.add(bow);
      var stripe = mesh(new T.BoxGeometry(15.05, 0.28, 2.55), mat(stripeCol)); stripe.position.y = 1.05; s.add(stripe);
      var deck = mesh(new T.BoxGeometry(14, 0.14, 2.1), mat(0xa47f52)); deck.position.y = 1.35; s.add(deck);
      var st1 = mesh(new T.BoxGeometry(1.6, 0.5, 1.6), mat(hullCol)); st1.position.set(-7.9, 1.35, 0); st1.rotation.z = 0.5; s.add(st1);
      var st2 = mesh(new T.BoxGeometry(1.3, 0.35, 0.9), mat(hullCol)); st2.position.set(-8.7, 2.15, 0); st2.rotation.z = 1.05; s.add(st2);
      var st3 = mesh(new T.BoxGeometry(0.9, 0.25, 0.6), mat(stripeCol)); st3.position.set(-8.75, 2.9, 0); st3.rotation.z = 1.6; s.add(st3);
      var ram = mesh(new T.ConeGeometry(0.38, 1.8, 6), BRONZE); ram.rotation.z = -Math.PI / 2; ram.position.set(11.3, 0.1, 0); s.add(ram);
      [-1, 1].forEach(function (sd) {
        var e = mesh(EYE, mat(0xf4efe2), false); e.position.set(8.0, 0.75, sd * 1.05); e.rotation.y = sd > 0 ? 0.35 : Math.PI - 0.35; s.add(e);
        var p = mesh(PUPIL, mat(0x15120f), false); p.position.set(8.02, 0.75, sd * 1.075); p.rotation.y = e.rotation.y; s.add(p);
      });
      var mast = mesh(new T.CylinderGeometry(0.1, 0.12, 5, 5), mat(0x6b5034)); mast.position.set(1.5, 3.8, 0); s.add(mast);
      var yard = mesh(new T.CylinderGeometry(0.07, 0.07, 4.4, 5), mat(0x6b5034)); yard.rotation.x = Math.PI / 2; yard.position.set(1.5, 6.1, 0); s.add(yard);
      var sail = mesh(new T.BoxGeometry(0.06, 0.6, 4.2), mat(0xe9dfc6)); sail.position.set(1.5, 5.75, 0); s.add(sail);
      var shields = new T.InstancedMesh(SHIELD, mat(shieldCol, { metalness: 0.5, roughness: 0.45 }), 18); shields.castShadow = true;
      var k = 0, m4 = new T.Matrix4();
      for (var q = 0; q < 9; q++) for (var sd = -1; sd <= 1; sd += 2) { m4.makeTranslation(-5.4 + q * 1.3, 1.65, sd * 1.22); shields.setMatrixAt(k++, m4); }
      s.add(shields);
      var N_PER = 13, oars = new T.InstancedMesh(OAR, mat(0x8a6a44), N_PER * 3 * 2); oars.castShadow = true;
      oars.instanceMatrix.setUsage(T.DynamicDrawUsage); s.add(oars);
      s.userData = { oars: oars, nPer: N_PER, ph: rnd(0, TAU), rate: rnd(2.1, 2.6), dyn: true };
      return s;
    }
    var qq = new T.Quaternion(), e3 = new T.Euler(), vp = new T.Vector3(), one = new T.Vector3(1, 1, 1), m4b = new T.Matrix4();
    function rowOars(s, t, effort) {
      var u = s.userData, k = 0, stroke = t * u.rate + u.ph;
      for (var bank = 0; bank < 3; bank++) for (var q = 0; q < u.nPer; q++) for (var sd = -1; sd <= 1; sd += 2) {
        var sw = Math.sin(stroke) * 0.38 * effort, lift = Math.cos(stroke) * 0.12 * effort;
        e3.set(0.32 + bank * 0.1 + lift, sd > 0 ? sw : Math.PI - sw, 0, 'YXZ');
        qq.setFromEuler(e3); vp.set(-5.6 + q * 0.92 + bank * 0.3, 0.45 + bank * 0.3, sd * (1.0 + bank * 0.12));
        m4b.compose(vp, qq, one); u.oars.setMatrixAt(k++, m4b);
      }
      u.oars.instanceMatrix.needsUpdate = true;
    }
    var fleet = [], foes = [];
    // Athenian fleet (dark hulls, blue-white stripe) massed in the harbour
    var AP = [[-18, 22, 0.3], [-4, 26, 0.1], [10, 21, -0.2], [24, 27, -0.4], [-30, 34, 0.5], [-12, 38, 0.2], [6, 36, 0], [22, 40, -0.3], [-2, 50, 0.1]];
    AP.forEach(function (p) { var s = trireme(0x2b2420, 0x3f6fa8, 0xc9a24a); s.userData.home = new T.Vector3(p[0], 0, p[1]); s.userData.yaw = p[2]; s.userData.dyn = true; g.add(s); fleet.push(s); });
    // Syracusan ships (lighter hulls, red stripe) closing in from the city side and the harbour flanks
    var SP = [[-75, -6, -40, 12], [-50, -12, -22, 8], [-20, -14, -4, 6], [15, -14, 14, 6], [50, -10, 34, 10], [80, 0, 46, 22], [90, 30, 50, 38]];
    SP.forEach(function (p) { var s = trireme(0x5a3a28, 0x9e2f25, 0xb87333);
      s.userData.a = new T.Vector3(p[0], 0, p[1]); s.userData.b = new T.Vector3(p[2], 0, p[3]);
      s.userData.yaw = -Math.atan2(p[3] - p[1], p[2] - p[0]); s.userData.dyn = true; g.add(s); foes.push(s); });
    bakeScene(g);
    var water = new T.Vector3();
    return {
      group: g, fog: [0xdfe7ea, 70, 330],
      cam: { pos: new T.Vector3(46, 14, 72), target: new T.Vector3(-4, 2, 8) },
      caption: ['Great Harbour of Syracuse, Sicily', '413 BC · the Sicilian Expedition',
        'The Athenian trireme fleet, hemmed in beneath the city walls as Syracusan ships close in — the turning point of the Peloponnesian War.'],
      reset: function () {},
      update: function (dt, t, ht) {
        for (var i = 0; i < seaPos.count; i++) { var x = seaBase[i * 2], z = seaBase[i * 2 + 1];
          seaPos.setY(i, Math.sin(x * 0.12 + t * 1.0) * 0.22 + Math.cos(z * 0.15 + t * 0.7) * 0.18 + Math.sin((x + z) * 0.05 + t * 0.5) * 0.14); }
        seaPos.needsUpdate = true;
        for (i = 0; i < fleet.length; i++) { var s = fleet[i], u = s.userData;
          s.position.set(u.home.x + Math.sin(t * 0.25 + u.ph) * 1.2, Math.sin(t * 1.1 + u.ph) * 0.12, u.home.z + Math.cos(t * 0.2 + u.ph) * 0.8);
          s.rotation.set(Math.sin(t * 0.9 + u.ph) * 0.02, u.yaw + Math.sin(t * 0.15 + u.ph) * 0.08, Math.sin(t * 0.8 + u.ph) * 0.025);
          rowOars(s, t, 0.5); }
        var k = ease(clamp01(ht / 12));
        for (i = 0; i < foes.length; i++) { s = foes[i]; u = s.userData;
          water.copy(u.a).lerp(u.b, k); s.position.set(water.x, Math.sin(t * 1.2 + u.ph) * 0.12, water.z);
          s.rotation.set(0, u.yaw, Math.sin(t * 0.9 + u.ph) * 0.025);
          rowOars(s, t * (k < 1 ? 1.4 : 0.6), k < 1 ? 1 : 0.35); }
      }
    };
  }

  var scenes = { syr: buildSyracuse(), lex: buildLexington() };
  var YEARS = { syr: -412, lex: 1775 };
  function fmtYear(y) { return y <= 0 ? (1 - y) + ' BC' : 'AD ' + y; }   // no year zero: -412 -> 413 BC
  scenes.syr.group.visible = false; scenes.lex.group.visible = false;
  scene.add(scenes.syr.group); scene.add(scenes.lex.group);

  // ---------- geographic transition: low-poly Earth ----------
  // Syracuse pin: 37.08N 15.27E (city centre on the mainland side; the quoted 37.07N 15.29E falls just offshore at 1:50m)
  var CITY = { syr: { lat: 37.08, lon: 15.27, label: 'Syracuse · 413 BC' }, lex: { lat: 42.45, lon: -71.23, label: 'Lexington · AD 1775' } };
  var D2R = Math.PI / 180;
  // Natural Earth 1:50m land (public domain), simplified + quantised to 0.02 deg, delta/zigzag/varint coded, base64.
  var COAST_B64 = '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';
  function decodeCoast(b64) {
    var bin = atob(b64), pos = 0;
    function vi() { var n = 0, m = 1, b; do { b = bin.charCodeAt(pos++); n += (b & 127) * m; m *= 128; } while (b & 128); return (n & 1) ? -(n + 1) / 2 : n / 2; }
    var nr = vi(), rings = [];
    for (var r = 0; r < nr; r++) { var np = vi(), a = new Float32Array(np * 2), x = 0, y = 0;
      for (var i = 0; i < np; i++) { x += vi(); y += vi(); a[i * 2] = x * 0.02; a[i * 2 + 1] = y * 0.02; } rings.push(a); }
    return rings;
  }
  function ll2v(lat, lon, r, out) { var la = lat * D2R, lo = lon * D2R; return (out || new T.Vector3()).set(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r); }

  var gScene = new T.Scene(), gCam = new T.PerspectiveCamera(50, 1, 0.005, 200);
  gScene.background = new T.Color(0x040814);
  var globe = new T.Group(); gScene.add(globe);
  var globePaintMs = 0, earth;
  function paintMap() {
    var t0 = performance.now();
    var W = Math.min(4096, renderer.capabilities.maxTextureSize || 4096), H = W / 2;
    var cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H; var x = cvs.getContext('2d');
    var rings = decodeCoast(COAST_B64), path = new Path2D(), coastPath = new Path2D();
    rings.forEach(function (a) {
      // unwrap longitudes so rings crossing the antimeridian stay continuous; draw at -360/0/+360 to wrap them.
      // Rings that encircle a pole (Antarctica) are closed along the map edge already, so draw those as-is.
      var n = a.length / 2, u = new Float32Array(n), lo = 1e9, hi = -1e9;
      for (var i = 0; i < n; i++) { var L = a[i * 2]; if (i) { var d = L - a[i * 2 - 2]; if (d > 180) d -= 360; else if (d < -180) d += 360; L = u[i - 1] + d; } u[i] = L; lo = Math.min(lo, L); hi = Math.max(hi, L); }
      var polar = Math.abs(u[n - 1] - u[0]) > 180, offs = polar ? [0] : [-360, 0, 360];
      offs.forEach(function (o) {
        if (!polar && (hi + o < -180 || lo + o > 180)) return;
        var pen = false;
        for (var i = 0; i < n; i++) { var px = ((polar ? a[i * 2] : u[i] + o) + 180) / 360 * W, py = (90 - a[i * 2 + 1]) / 180 * H;
          if (i) path.lineTo(px, py); else path.moveTo(px, py);
          var edge = polar && a[i * 2 + 1] < -84.5;            // don't outline the artificial map-edge closure of Antarctica
          if (edge) pen = false; else if (pen) coastPath.lineTo(px, py); else { coastPath.moveTo(px, py); pen = true; } }
        path.closePath(); if (!polar) coastPath.closePath();
      });
    });
    var oc = x.createLinearGradient(0, 0, 0, H);
    oc.addColorStop(0, '#1b4677'); oc.addColorStop(0.5, '#1f5a98'); oc.addColorStop(1, '#1b4677');
    x.fillStyle = oc; x.fillRect(0, 0, W, H);
    var cell = W / 160, rs = 7, TW = Math.round(cell * 16), TH = Math.round(cell * 8);
    function rnd2() { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }
    function facetTile(alpha) {                    // faint triangle tessellation tile = low-poly texture (drawn once, repeated)
      var tc = document.createElement('canvas'); tc.width = TW; tc.height = TH; var tx = tc.getContext('2d'), c = TW / 16;
      for (var gy = 0; gy < 8; gy++) for (var gx = -1; gx <= 16; gx++) {
        var x0 = gx * c + (gy & 1 ? c / 2 : 0), y0 = gy * c;
        for (var t = 0; t < 2; t++) { var v = rnd2(); tx.fillStyle = v > 0.5 ? 'rgba(255,255,255,' + (alpha * (v - 0.5) * 2) + ')' : 'rgba(0,0,0,' + (alpha * (0.5 - v) * 2) + ')';
          tx.beginPath(); if (t) { tx.moveTo(x0, y0); tx.lineTo(x0 + c, y0); tx.lineTo(x0 + c / 2, y0 + c); } else { tx.moveTo(x0 + c / 2, y0 + c); tx.lineTo(x0 + c, y0); tx.lineTo(x0 + c * 1.5, y0 + c); } tx.fill(); }
      }
      return tc;
    }
    function facets(alpha) { x.fillStyle = x.createPattern(facetTile(alpha), 'repeat'); x.fillRect(0, 0, W, H); }
    facets(0.06);
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.strokeStyle = 'rgba(64,138,200,.45)'; x.lineWidth = W / 220; x.stroke(coastPath);          // continental shelf
    x.strokeStyle = 'rgba(96,170,220,.55)'; x.lineWidth = W / 600; x.stroke(coastPath);
    var lg = x.createLinearGradient(0, 0, 0, H), stops = [[0, '#eef3f6'], [0.1, '#e6edf0'], [0.15, '#58784a'], [0.25, '#4e7a3e'], [0.31, '#62904a'],
      [0.36, '#b9a26c'], [0.41, '#d2b87c'], [0.45, '#7c9a4e'], [0.5, '#3f7f35'], [0.56, '#4a8a3a'], [0.62, '#c4a970'], [0.68, '#8fa05a'], [0.75, '#5d7a46'], [0.81, '#e3eaee'], [1, '#f2f6f8']];
    stops.forEach(function (sp) { lg.addColorStop(sp[0], sp[1]); });
    // land layer on its own canvas: gradient + facets everywhere, then masked once by the coastline path
    var lc = document.createElement('canvas'); lc.width = W; lc.height = H; var main = x; x = lc.getContext('2d');
    lg = x.createLinearGradient(0, 0, 0, H); stops.forEach(function (sp) { lg.addColorStop(sp[0], sp[1]); });   // gradients are per-context
    x.fillStyle = lg; x.fillRect(0, 0, W, H); facets(0.12);
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = '#000'; x.fill(path, 'evenodd');   // opaque mask
    x = main; x.drawImage(lc, 0, 0);
    x.strokeStyle = 'rgba(28,46,30,.6)'; x.lineWidth = Math.max(1.2, W / 2800); x.stroke(coastPath);  // crisp coastline
    var tex = new T.CanvasTexture(cvs); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    globePaintMs = Math.round(performance.now() - t0);
    return tex;
  }
  function ensureEarthMap() {                      // painted lazily (idle after start, or at the first jump) so the opening scene isn't delayed
    if (earth.material.map) return;
    earth.material.map = paintMap(); earth.material.color.set(0xffffff); earth.material.needsUpdate = true;
  }
  (function buildGlobe() {
    earth = new T.Mesh(new T.SphereGeometry(1, 128, 64), new T.MeshStandardMaterial({ color: 0x1f5a98, roughness: 0.92, metalness: 0, flatShading: true }));
    earth.rotation.y = -Math.PI / 2;               // align SphereGeometry's u=0 seam with lon -180 so ll2v() matches the map
    globe.add(earth);
    var ac = document.createElement('canvas'); ac.width = ac.height = 256; var ax = ac.getContext('2d'), gr = ax.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(110,170,255,0)'); gr.addColorStop(0.72, 'rgba(110,170,255,0)'); gr.addColorStop(0.78, 'rgba(130,190,255,.55)');
    gr.addColorStop(0.86, 'rgba(90,150,255,.18)'); gr.addColorStop(1, 'rgba(60,110,255,0)'); ax.fillStyle = gr; ax.fillRect(0, 0, 256, 256);
    var at = new T.CanvasTexture(ac); at.colorSpace = T.SRGBColorSpace;
    var atm = new T.Sprite(new T.SpriteMaterial({ map: at, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    atm.scale.set(2.56, 2.56, 1); atm.renderOrder = -1; gScene.add(atm);
    // stars
    var sp = new Float32Array(1600 * 3), v = new T.Vector3();
    for (var i = 0; i < 1600; i++) { v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(60, 90)); sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    gScene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false })));
  })();
  gScene.add(new T.HemisphereLight(0xcfe0ff, 0x1a2233, 0.9));
  var gSun = new T.DirectionalLight(0xfff3e0, 2.4); gSun.position.set(-3, 2.5, 5); gScene.add(gSun);
  // city pins + labels
  function labelSprite(text) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 96; var x = c.getContext('2d');
    x.font = '600 44px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; var w = Math.min(500, x.measureText(text).width + 40);
    x.fillStyle = 'rgba(8,12,26,.72)'; x.beginPath(); if (x.roundRect) x.roundRect((512 - w) / 2, 10, w, 76, 20); else x.rect((512 - w) / 2, 10, w, 76); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 50);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.renderOrder = 10; return sp;
  }
  var pins = {};
  ['syr', 'lex'].forEach(function (k) {
    var g = new T.Group(), C = CITY[k];
    var pin = new T.Mesh(new T.ConeGeometry(0.012, 0.05, 6).rotateX(-Math.PI / 2).translate(0, 0, 0.025), new T.MeshBasicMaterial({ color: k === 'syr' ? 0x5fd0ff : 0xff9a52 }));
    var dot = new T.Sprite(new T.SpriteMaterial({ map: GLOW, color: k === 'syr' ? 0x8fe0ff : 0xffb070, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    dot.scale.set(0.09, 0.09, 1);
    var lab = labelSprite(C.label); lab.position.set(0, 0, 0.1);
    g.add(pin); g.add(dot); g.add(lab);
    g.position.copy(ll2v(C.lat, C.lon, 1.002)); g.lookAt(ll2v(C.lat, C.lon, 2));
    globe.add(g); pins[k] = { g: g, pin: pin, dot: dot, lab: lab };
  });
  // great-circle route arc (rebuilt for each direction)
  var ARC_N = 96, arcGeo = new T.BufferGeometry(); arcGeo.setAttribute('position', new T.BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3));
  var arc = new T.Line(arcGeo, new T.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 })); globe.add(arc);
  function buildArc(from, to) {
    var A = ll2v(CITY[from].lat, CITY[from].lon, 1), B = ll2v(CITY[to].lat, CITY[to].lon, 1), ang = A.angleTo(B), arr = arcGeo.attributes.position.array, v = new T.Vector3();
    for (var i = 0; i <= ARC_N; i++) { var t = i / ARC_N;
      v.copy(A).multiplyScalar(Math.sin((1 - t) * ang) / Math.sin(ang)).addScaledVector(B, Math.sin(t * ang) / Math.sin(ang)).normalize().multiplyScalar(1.004 + 0.12 * Math.sin(Math.PI * t));
      arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; }
    arcGeo.attributes.position.needsUpdate = true; arcGeo.setDrawRange(0, 0);
  }
  var EXTRA_TURNS = 3, wp = new T.Vector3();
  function spinCurve(v) { return v - Math.sin(TAU * v) / TAU; }   // speed ~ 1 - cos: accelerates, peaks mid-way, decelerates
  function placeGlobe(from, to, u) {
    var A = CITY[from], B = CITY[to];
    var dLon = B.lon - A.lon; dLon = dLon + (dLon < 0 ? -360 : 360) * EXTRA_TURNS;   // westward for 413 BC -> 1775, eastward back
    var v = clamp01((u - 0.08) / 0.84), S = spinCurve(v);
    var lon = A.lon + dLon * S, lat = A.lat + (B.lat - A.lat) * S;
    globe.rotation.set(lat * D2R, -lon * D2R, 0, 'XYZ');
    var zo = ease(clamp01((u - 0.045) / 0.24)), zi = ease(clamp01((0.955 - u) / 0.24)), alt = 0.3 + 2.35 * Math.min(zo, zi);
    gCam.position.set(0, 0, 1 + alt); gCam.lookAt(0, 0, 0);
    var far = clamp01((alt - 0.5) / 0.8), ps = 0.2 + alt * 0.95;
    for (var k in pins) { var P = pins[k]; P.pin.scale.setScalar(ps); P.dot.scale.set(0.05 * ps, 0.05 * ps, 1);
      P.lab.material.opacity = far; P.lab.scale.set(0.42 * ps * 0.55, 0.08 * ps * 0.55, 1); P.lab.position.z = 0.06 * ps; }
    arcGeo.setDrawRange(0, Math.max(0, Math.round(S * (ARC_N + 1))));
    globe.updateMatrixWorld(true);
    for (k in pins) { pins[k].g.getWorldPosition(wp); var vis = wp.z > 0.25; pins[k].lab.visible = vis && far > 0.01; pins[k].dot.visible = wp.z > 0; }
    return S;
  }

  // ---------- state machine ----------
  var st = { cur: 'syr', mode: 'hold', t: 0, swapped: false, stage: 'scene', paused: false, camFrom: new T.Vector3() };
  function other(k) { return k === 'lex' ? 'syr' : 'lex'; }
  function enter(key) {
    var s = scenes[key];
    scenes[other(key)].group.visible = false; s.group.visible = true;
    scene.fog = new T.Fog(s.fog[0], s.fog[1], s.fog[2]);
    camera.position.copy(s.cam.pos); controls.target.copy(s.cam.target); controls.update();
    capPlace.textContent = s.caption[0]; capDate.textContent = s.caption[1]; capNote.textContent = s.caption[2];
    if (st.mode !== 'trans') setBtn(key);
    if (typeof layoutHint === 'function' && host.clientWidth) layoutHint();
    s.reset();
  }
  function setBtn(key) {
    btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = 'pointer';
    btn.textContent = key === 'syr' ? 'Travel to AD 1775 \u2192' : '\u2190 Travel to 413 BC';
    btn.setAttribute('aria-label', key === 'syr' ? 'Jump to Lexington Green, 1775' : 'Jump to Syracuse, 413 BC');
  }
  function startTransition() {
    if (st.mode === 'trans') return;
    ensureEarthMap();
    st.mode = 'trans'; st.t = 0; st.swapped = false; st.from = st.cur; st.to = other(st.cur); st.stage = 'scene';
    st.camFrom.copy(camera.position); controls.enabled = false; buildArc(st.from, st.to);
    btn.disabled = true; btn.style.opacity = '.7'; btn.style.cursor = 'default'; btn.textContent = 'Travelling\u2026';
    route.textContent = (st.from === 'syr' ? 'Syracuse, Sicily' : 'Lexington, Massachusetts') + '  \u2192  ' + (st.to === 'syr' ? 'Syracuse, Sicily' : 'Lexington, Massachusetts');
  }
  btn.addEventListener('click', startTransition);
  enter('syr');
  setTimeout(ensureEarthMap, 1200);

  var P_OUT = 0.12, P_IN = 0.88, vUp = new T.Vector3();
  function bump(p, a, m, b) { return p <= a || p >= b ? 0 : p < m ? (p - a) / (m - a) : (b - p) / (b - m); }
  function applyTransition() {
    var p = clamp01(st.t / TRANS);
    haze.style.opacity = String(Math.min(1, Math.max(bump(p, 0.05, P_OUT, 0.16), bump(p, 0.84, P_IN, 0.95)) * 1.15));
    cap.style.opacity = String(clamp01(1 - p / 0.06) + clamp01((p - 0.94) / 0.06));
    bar.style.width = '0%';
    if (p < P_OUT) {                                     // lift off from the source scene
      var k = ease(p / P_OUT); st.stage = 'scene';
      vUp.copy(st.camFrom).sub(controls.target).multiplyScalar(1 + 0.7 * k); vUp.y += 38 * k;
      camera.position.copy(controls.target).add(vUp); camera.lookAt(controls.target);
    } else if (p < P_IN) {                               // the globe
      st.stage = 'globe';
      var u = (p - P_OUT) / (P_IN - P_OUT), S = placeGlobe(st.from, st.to, u);
      var y = Math.round(YEARS[st.from] + (YEARS[st.to] - YEARS[st.from]) * S);
      year.textContent = fmtYear(y);
      yearBox.style.opacity = String(clamp01((p - 0.15) / 0.05) * clamp01((0.85 - p) / 0.05));
    } else {                                             // descend into the destination scene
      if (!st.swapped) { st.swapped = true; st.cur = st.to; enter(st.cur); st.camFrom.copy(camera.position); }
      st.stage = 'scene'; yearBox.style.opacity = '0';
      var d = 1 - ease((p - P_IN) / (1 - P_IN));
      vUp.copy(st.camFrom).sub(controls.target).multiplyScalar(1 + 0.7 * d); vUp.y += 38 * d;
      camera.position.copy(controls.target).add(vUp); camera.lookAt(controls.target);
    }
    if (p >= 1) { st.mode = 'hold'; st.t = 0; st.stage = 'scene'; setBtn(st.cur); haze.style.opacity = '0'; yearBox.style.opacity = '0'; cap.style.opacity = '1';
      camera.position.copy(st.camFrom); controls.enabled = true; controls.update(); }
  }

  // ---------- sizing ----------
  function resize() {
    var w = Math.max(1, host.clientWidth || window.innerWidth), h = Math.max(1, host.clientHeight || window.innerHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    gCam.aspect = w / h; gCam.updateProjectionMatrix();
    cap.style.maxWidth = w < 560 ? 'calc(100% - 24px)' : 'min(78%,440px)';
    layoutHint();
  }
  // keep the hint clear of the caption: measure, and move it to the top-left (short form) if they would collide
  function layoutHint() {
    var w = host.clientWidth || window.innerWidth;
    hint.style.top = ''; hint.style.left = ''; hint.style.right = '12px'; hint.style.bottom = '12px';
    hint.textContent = 'drag to look around · scroll to zoom';
    var capRight = cap.offsetLeft + cap.offsetWidth;
    if (w < 560 || capRight + 16 + hint.offsetWidth + 12 > w) {
      hint.style.top = '12px'; hint.style.left = '12px'; hint.style.right = ''; hint.style.bottom = '';
      hint.textContent = 'drag · zoom';
    }
  }
  resize();
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(host);

  // ---------- loop ----------
  var last = performance.now(), clockT = 0;
  function frame(dtOverride, noRender) {
    var now = performance.now(), dt = typeof dtOverride === 'number' ? dtOverride : Math.min(0.1, (now - last) / 1000); last = now;
    clockT += dt;
    if (!st.paused) st.t += dt;
    if (st.mode === 'hold') {
      bar.style.width = (clamp01(st.t / HOLD) * 100).toFixed(1) + '%';
      if (st.t >= HOLD) startTransition();
    }
    if (st.mode === 'trans') applyTransition();
    var s = scenes[st.cur];
    if (st.stage === 'scene') s.update(dt, clockT, st.mode === 'hold' ? st.t : 0);
    if (st.mode === 'hold') controls.update();
    if (!noRender) renderer.render(st.stage === 'globe' ? gScene : scene, st.stage === 'globe' ? gCam : camera);
  }
  renderer.setAnimationLoop(function () { frame(); });

  // small inspection hook (used for headless screenshots / review): seek to a state deterministically
  window.WitnessHistory = {
    jump: startTransition,
    pause: function (v) { st.paused = v !== false; },
    seek: function (key, mode, seconds) {
      st.mode = 'hold'; st.t = 0; st.stage = 'scene'; haze.style.opacity = '0'; yearBox.style.opacity = '0'; cap.style.opacity = '1';
      controls.enabled = true; st.cur = key; enter(key);
      if (mode === 'trans') startTransition();
      var steps = Math.ceil((seconds || 0) / 0.05); for (var i = 0; i < steps; i++) frame(0.05, true);
    },
    state: function () { return { scene: st.cur, mode: st.mode, stage: st.stage, t: +st.t.toFixed(2), year: year.textContent, drawCalls: renderer.info.render.calls, globePaintMs: globePaintMs, triangles: renderer.info.render.triangles }; }
  };
})();
