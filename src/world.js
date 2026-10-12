/* Witness Lexington — 3D world: Lexington Green (refactored from witness.js v2.1 buildLexington)
   and the low-poly globe (from witness.js v2.1's geographic transition). Classic script; needs
   window.THREE (three r186 + OrbitControls) and window.WG_COAST_B64. Defines window.WGWorld. */
(function () {
  'use strict';
  var T = window.THREE;
  if (!T || !T.OrbitControls) throw new Error('Witness Game: window.THREE with OrbitControls not loaded');
  var TAU = Math.PI * 2, D2R = Math.PI / 180;

  // seeded RNG so every run (and every screenshot) is laid out identically
  var seed = 1775;
  function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function rnd(a, b) { return a + rand() * (b - a); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function create(host) {
    var renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    var cv = renderer.domElement;
    cv.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none';
    host.appendChild(cv);

    // ---------- shared helpers (from v2.1) ----------
    var matCache = {};
    function mat(hex, extra) {
      var k = hex + (extra ? JSON.stringify(extra) : '');
      if (!matCache[k]) { var o = { color: hex, roughness: 0.85, metalness: 0.05, flatShading: true };
        if (extra) for (var p in extra) o[p] = extra[p]; matCache[k] = new T.MeshStandardMaterial(o); }
      return matCache[k];
    }
    function mesh(geo, m, cast, recv) { var x = new T.Mesh(geo, m); x.castShadow = cast !== false; x.receiveShadow = !!recv; return x; }
    function gable(len, span, h) {
      var sh = new T.Shape(); sh.moveTo(-span / 2, 0); sh.lineTo(span / 2, 0); sh.lineTo(0, h); sh.lineTo(-span / 2, 0);
      var g = new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2); return g;
    }
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
    function bakeAll(g) { bake(g); (function walk(o) { o.children.slice().forEach(function (c) { if (c.userData.dyn) { bake(c); } else if (c.isGroup) walk(c); }); })(g); }
    function skyDome(top, mid, horizon) {
      var g = new T.SphereGeometry(400, 32, 16), pos = g.attributes.position, cols = [], c = new T.Color();
      var cT = new T.Color(top), cM = new T.Color(mid), cH = new T.Color(horizon);
      for (var i = 0; i < pos.count; i++) { var h = pos.getY(i) / 400;
        if (h < 0) c.copy(cH); else if (h < 0.25) c.copy(cH).lerp(cM, h / 0.25); else c.copy(cM).lerp(cT, (h - 0.25) / 0.75);
        cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      var m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
      m.renderOrder = -1; return m;
    }
    function glowTex(inner, mid, outer) {
      var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, inner); g.addColorStop(0.18, mid); g.addColorStop(0.45, outer); g.addColorStop(1, 'rgba(255,140,60,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
    }
    var GLOW = glowTex('rgba(255,250,235,1)', 'rgba(255,225,160,.95)', 'rgba(255,170,90,.35)');
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

    // ---------- low-poly people (v2.1) ----------
    var G = {
      leg: new T.BoxGeometry(0.13, 0.75, 0.14).translate(0, -0.375, 0),
      torso: new T.BoxGeometry(0.42, 0.62, 0.26), coatTail: new T.BoxGeometry(0.44, 0.22, 0.28),
      arm: new T.BoxGeometry(0.11, 0.58, 0.12).translate(0, -0.27, 0), head: new T.IcosahedronGeometry(0.15, 0),
      tricorne: new T.ConeGeometry(0.26, 0.14, 3), roundHat: new T.CylinderGeometry(0.26, 0.26, 0.04, 8),
      roundCrown: new T.CylinderGeometry(0.13, 0.15, 0.14, 8), bonnet: new T.SphereGeometry(0.19, 8, 4, 0, TAU, 0, Math.PI / 2),
      musket: new T.BoxGeometry(0.05, 1.25, 0.05), belt: new T.BoxGeometry(0.44, 0.07, 0.27), pack: new T.BoxGeometry(0.32, 0.36, 0.14),
      skirt: new T.CylinderGeometry(0.2, 0.34, 0.8, 7)
    };
    var SKIN = [0xe0b48f, 0xc99a73, 0xa97a55, 0xd7a985, 0x8d5e3c];
    function person(o) {
      var g = new T.Group(), legs = [];
      if (o.skirt) { var sk = mesh(G.skirt, mat(o.pants)); sk.position.y = 0.4; g.add(sk); }
      for (var s = -1; s <= 1; s += 2) { var l = mesh(G.leg, mat(o.pants)); l.position.set(s * 0.1, 0.78, 0); l.userData.keep = true; if (o.skirt) l.visible = false; g.add(l); legs.push(l); }
      var torso = mesh(G.torso, mat(o.coat)); torso.position.y = 1.1; g.add(torso);
      if (o.tails) { var ct = mesh(G.coatTail, mat(o.coat)); ct.position.set(0, 0.72, -0.01); g.add(ct); }
      if (o.belts) { var b = mesh(G.belt, mat(o.belts)); b.position.y = 1.18; b.rotation.z = 0.7; g.add(b);
        var b2 = mesh(G.belt, mat(o.belts)); b2.position.y = 1.18; b2.rotation.z = -0.7; g.add(b2); }
      if (o.pack) { var pk = mesh(G.pack, mat(o.pack)); pk.position.set(0, 1.12, -0.2); g.add(pk); }
      for (s = -1; s <= 1; s += 2) { var a = mesh(G.arm, mat(o.coat)); a.position.set(s * 0.27, 1.38, 0); a.rotation.x = s > 0 ? -0.35 : 0.1; g.add(a); }
      var head = mesh(G.head, mat(SKIN[(rand() * SKIN.length) | 0])); head.position.y = 1.58; g.add(head);
      var hat;
      if (o.hat === 'tricorne') { hat = mesh(G.tricorne, mat(o.hatColor || 0x1b1b1b)); hat.position.y = 1.74; hat.rotation.y = Math.PI / 3; }
      else if (o.hat === 'round') { hat = new T.Group(); hat.add(mesh(G.roundHat, mat(o.hatColor))); var cr = mesh(G.roundCrown, mat(o.hatColor)); cr.position.y = 0.08; hat.add(cr); hat.position.y = 1.7; }
      else if (o.hat === 'bonnet') { hat = mesh(G.bonnet, mat(o.hatColor || 0xe8e0cc)); hat.position.y = 1.6; }
      if (hat) g.add(hat);
      if (o.musket) { var m = mesh(G.musket, mat(0x4a3420)); m.position.set(0.3, 1.45, 0.08); m.rotation.x = -0.25; m.rotation.z = -0.12; g.add(m); }
      g.userData.legs = legs; g.userData.phase = rand() * TAU;
      return g;
    }
    function walkLegs(p, t, speed, amp) { var a = Math.sin(t * speed + p.userData.phase) * (amp || 0.45); p.userData.legs[0].rotation.x = a; p.userData.legs[1].rotation.x = -a; }
    function standLegs(p) { p.userData.legs[0].rotation.x = p.userData.legs[1].rotation.x = 0; }
    function kneel(p, k) {             // k 0..1: lower onto one knee (no falling, no gore)
      p.position.y -= 0.42 * k; p.userData.legs[0].rotation.x = -1.35 * k; p.userData.legs[1].rotation.x = 1.0 * k; p.rotation.x = 0.12 * k;
    }

    // ---------- effects: smoke + muzzle flashes ----------
    var PUFF = new T.IcosahedronGeometry(0.5, 1);
    var FLASH = glowTex('rgba(255,255,240,1)', 'rgba(255,236,170,.95)', 'rgba(255,170,80,.4)');
    function fxPool(group, n) {
      var pool = [], fl = [];
      for (var i = 0; i < n; i++) {
        var m = new T.Mesh(PUFF, new T.MeshStandardMaterial({ color: 0xe4e0d8, emissive: 0x6d6a64, roughness: 1, transparent: true, opacity: 0, depthWrite: false, flatShading: true }));
        m.visible = false; group.add(m); pool.push({ m: m, life: 0, max: 1, v: new T.Vector3(), size: 1 });
      }
      for (i = 0; i < 28; i++) {
        var s = new T.Sprite(new T.SpriteMaterial({ map: FLASH, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        s.visible = false; group.add(s); fl.push({ s: s, life: 0 });
      }
      function puff(pos, size, drift) {
        for (var i = 0; i < pool.length; i++) if (pool[i].life <= 0) {
          var p = pool[i]; p.life = p.max = rnd(3, 5); p.size = size || 1; p.m.position.copy(pos);
          p.v.set(rnd(0.2, 0.6), rnd(0.15, 0.35), rnd(-0.2, 0.2)); if (drift) p.v.add(drift); p.m.visible = true; return;
        }
      }
      return {
        shot: function (pos, dir, big) {          // a muzzle flash + a puff of smoke just in front of the muzzle
          for (var i = 0; i < fl.length; i++) if (fl[i].life <= 0) { var f = fl[i]; f.life = 0.3; f.s.position.copy(pos); f.big = big ? 3.4 : 1.9; f.s.visible = true; break; }
          var p2 = pos.clone(); if (dir) p2.addScaledVector(dir, 0.5);
          puff(p2, big ? 1.4 : 1.0, dir ? dir.clone().multiplyScalar(0.6) : null);
        },
        puff: puff,
        update: function (dt) {
          for (var i = 0; i < pool.length; i++) { var p = pool[i]; if (p.life <= 0) continue; p.life -= dt;
            var k = 1 - p.life / p.max; p.m.position.addScaledVector(p.v, dt);
            p.m.scale.setScalar(p.size * (0.35 + k * 1.7)); p.m.material.opacity = 0.7 * (1 - k) * Math.min(1, k * 8);
            if (p.life <= 0) p.m.visible = false; }
          for (i = 0; i < fl.length; i++) { var f = fl[i]; if (f.life <= 0) continue; f.life -= dt;
            var s = f.big * (0.6 + 0.4 * (f.life / 0.3)); f.s.scale.set(s, s, 1); f.s.material.opacity = clamp01(f.life / 0.3);
            if (f.life <= 0) f.s.visible = false; }
        },
        clear: function () { pool.forEach(function (p) { p.life = 0; p.m.visible = false; }); fl.forEach(function (f) { f.life = 0; f.s.visible = false; }); }
      };
    }

    // ---------- UI overlays drawn in the scene: cartouche labels and wax-seal stop markers (see UI_STYLE.md) ----------
    var INK = '#241b12', PAPER = '#f3e9d2', RUBRIC = '#7e2219';
    var TITLE_PX = 60, SUB_PX = 46;
    var DISPLAY_FONT = '"IM Fell English SC","Libre Caslon Text",Georgia,serif', ITALIC_FONT = 'italic ' + SUB_PX + 'px "Libre Caslon Text",Georgia,serif';
    var STOP_TODO = 0xc0473a;
    function whenFontsReady(fn) {
      if (!document.fonts || !document.fonts.load) return;
      Promise.all([document.fonts.load('60px "IM Fell English SC"'), document.fonts.load(ITALIC_FONT)]).then(fn, function () {});
    }
    function cartouche(text) {
      var parts = text.split(' · '), title = parts[0], sub = parts.slice(1).join(' · ');
      var c = document.createElement('canvas'), x = c.getContext('2d'), titleFont = TITLE_PX + 'px ' + DISPLAY_FONT;
      x.font = titleFont; var tw = x.measureText(title).width;
      x.font = ITALIC_FONT; var sw = sub ? x.measureText(sub).width : 0;
      var bw = Math.ceil(Math.max(tw, sw) + 96), bh = sub ? 138 : 88, n = 14, tail = 18, sh = 8;
      c.width = bw + sh + 8; c.height = bh + tail + sh + 8; x = c.getContext('2d');
      // Ticket outline with concave corners and a pointer that drops toward the marker.
      function outline(ox, oy, inset, pointer) {
        var l = 4 + ox + inset, t = 4 + oy + inset, r = 4 + ox + bw - inset, b = 4 + oy + bh - inset, k = n + inset, cx = (l + r) / 2;
        x.beginPath(); x.moveTo(l + k, t); x.lineTo(r - k, t);
        x.arc(r, t, k, Math.PI, Math.PI / 2, true); x.lineTo(r, b - k);
        x.arc(r, b, k, Math.PI * 1.5, Math.PI, true);
        if (pointer) { x.lineTo(cx + tail, b); x.lineTo(cx, b + tail); x.lineTo(cx - tail, b); }
        x.lineTo(l + k, b); x.arc(l, b, k, 0, Math.PI * 1.5, true); x.lineTo(l, t + k);
        x.arc(l, t, k, Math.PI / 2, 0, true); x.closePath();
      }
      outline(sh, sh, 0, true); x.fillStyle = 'rgba(20,14,8,.85)'; x.fill();
      outline(0, 0, 0, true); x.fillStyle = PAPER; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
      outline(0, 0, 9, false); x.lineWidth = 1.5; x.strokeStyle = 'rgba(36,27,18,.7)'; x.stroke();
      var ty = 4 + (sub ? 50 : bh / 2 + 2);
      [4 + 28, 4 + bw - 28].forEach(function (lx) {
        x.beginPath(); x.moveTo(lx, ty - 7); x.lineTo(lx + 6, ty); x.lineTo(lx, ty + 7); x.lineTo(lx - 6, ty); x.closePath(); x.fillStyle = RUBRIC; x.fill();
      });
      x.textAlign = 'center'; x.textBaseline = 'middle';
      // A same-colour stroke thickens the strokes so the text survives being scaled down to about a third.
      x.lineJoin = 'round';
      x.font = titleFont; x.fillStyle = INK; x.strokeStyle = INK; x.lineWidth = 1.5;
      x.strokeText(title, 4 + bw / 2, ty); x.fillText(title, 4 + bw / 2, ty);
      if (sub) {
        x.font = ITALIC_FONT; x.fillStyle = RUBRIC; x.strokeStyle = RUBRIC; x.lineWidth = 2.5;
        x.strokeText(sub, 4 + bw / 2, 4 + 104); x.fillText(sub, 4 + bw / 2, 4 + 104);
      }
      return c;
    }
    // Arrow (points up before rotation) for edge-pinned labels, and an ink leader with paper edges that ties a label to its seal.
    function overlayTexture(w, h, draw) {
      var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
    }
    var ARROW_TEX = null, LEADER_TEX = null;
    function overlaySprite(kind) {
      if (!ARROW_TEX) {
        ARROW_TEX = overlayTexture(64, 64, function (x) {
          x.beginPath(); x.moveTo(32, 6); x.lineTo(58, 54); x.lineTo(32, 44); x.lineTo(6, 54); x.closePath();
          x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = PAPER; x.stroke();
          x.fillStyle = '#a8322a'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
        });
        LEADER_TEX = overlayTexture(8, 4, function (x) { x.fillStyle = PAPER; x.fillRect(0, 0, 8, 4); x.fillStyle = INK; x.fillRect(2, 0, 4, 4); });
      }
      var sp = new T.Sprite(new T.SpriteMaterial({ map: kind === 'arrow' ? ARROW_TEX : LEADER_TEX, depthTest: false, transparent: true, fog: false }));
      sp.renderOrder = kind === 'arrow' ? 11 : 9; sp.frustumCulled = false; sp.visible = false;
      if (kind === 'leader') sp.center.set(0.5, 0);
      return sp;
    }
    var LABELS = [];
    // id names the stop for objective focus. seal is the object the label belongs to: it decides edge pinning and,
    // unless noLeader is set, gets a leader line.
    function labelSprite(text, id, seal, noLeader) {
      var c = cartouche(text), t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      var sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true, fog: false }));
      sp.renderOrder = 10; sp.center.set(0.5, 0); sp.frustumCulled = false;
      sp.userData.label = { text: text, id: id || null, seal: seal || null, sub: text.indexOf(' · ') >= 0, w: c.width, h: c.height,
        arrow: overlaySprite('arrow'), leader: seal && !noLeader ? overlaySprite('leader') : null };
      sp.add(sp.userData.label.arrow); if (sp.userData.label.leader) sp.add(sp.userData.label.leader);
      sp.scale.set(c.width / c.height, 1, 1); LABELS.push(sp);
      whenFontsReady(function () {
        var next = cartouche(text), map = new T.CanvasTexture(next); map.colorSpace = T.SRGBColorSpace;
        sp.material.map.dispose(); sp.material.map = map; sp.material.needsUpdate = true;
        sp.userData.label.w = next.width; sp.userData.label.h = next.height;
      });
      return sp;
    }
    // Labels are laid out in screen space every frame (installed as scene.onBeforeRender, which runs after the
    // matrix update and before culling). Each label keeps a fixed on-screen size so its text never drops below
    // 14px and is kept inside the viewport, clear of the HUD rectangles reported by world.labelAvoid.
    // Labels for the stops in world.labelFocus (the current objective) are placed first and never fade: in place
    // while their seal is visible, otherwise pinned to the nearest edge of the safe band with an arrow toward the
    // seal. Other labels follow nearest first and fade when their anchor is off screen or no nearby slot is free.
    // A leader ties a label to its seal whenever the two are apart.
    var lv = new T.Vector3(), lq = new T.Quaternion(), lsc = new T.Vector3(), lsz = new T.Vector2();
    function labelOnScene(sp, scene) {
      for (var o = sp; o; o = o.parent) { if (!o.visible) return false; if (o === scene) return true; }
      return false;
    }
    function hits(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
    function inside(x, y, r) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
    function screenOf(v, camera, w, h) {
      var depth = -v.clone().applyMatrix4(camera.matrixWorldInverse).z, p = v.clone().project(camera);
      var x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * h;
      if (depth <= 0) { x = w - x; y = h - y; }
      return { x: x, y: y, depth: depth };
    }
    // Positions a sprite so its centre point lands on screen pixel (x, y) at the given view depth, sized in pixels.
    function placeOnScreen(sp, camera, w, h, x, y, depth, pw, ph, rotation) {
      var P = camera.projectionMatrix.elements, d = Math.max(depth, camera.near * 4);
      lv.set(((x / w) * 2 - 1) * d / P[0], (1 - (y / h) * 2) * d / P[5], -d).applyMatrix4(camera.matrixWorld);
      var unit = 2 * d / P[5] / h;
      if (rotation !== undefined) sp.material.rotation = rotation;
      sp.matrixWorld.compose(lv, lq, lsc.set(pw * unit, ph * unit, 1));
    }
    function layoutLabels(renderer, scene, camera) {
      renderer.getSize(lsz); var w = lsz.x, h = lsz.y, boxes = [];
      world.labelBoxes = boxes;
      if (!w || !h) return;
      var pad = 6, gap = 4, arrowPx = Math.round(Math.max(22, h / 26)), focus = world.labelFocus || [];
      var avoid = (world.labelAvoid && world.labelAvoid()) || [], placed = [], todo = [];
      var titlePx = Math.max(18, Math.min(24, h / 30));
      // The safe band runs between the HUD along the top and the panel along the bottom.
      var band = { left: pad, right: w - pad, top: pad, bottom: h - pad };
      avoid.forEach(function (r) {
        if (r.top < h * 0.3) band.top = Math.max(band.top, r.bottom);
        else if (r.bottom > h * 0.7) band.bottom = Math.min(band.bottom, r.top);
      });
      function blocked(p) { return p.x < 0 || p.x > w || p.y < 0 || p.y > h || avoid.some(function (r) { return inside(p.x, p.y, r); }); }
      LABELS.forEach(function (sp) {
        if (!labelOnScene(sp, scene)) return;
        var L = sp.userData.label;
        var a = screenOf(lv.copy(sp.position).applyMatrix4(sp.parent.matrixWorld), camera, w, h);
        var seal = L.seal ? screenOf(L.seal.getWorldPosition(new T.Vector3()), camera, w, h) : null;
        var t = seal || a, isFocus = L.id !== null && focus.indexOf(L.id) >= 0;
        todo.push({ sp: sp, L: L, a: a, seal: seal, focus: isFocus, pin: isFocus && !(t.depth > 0 && !blocked(t)) });
      });
      // Edge-pinned labels have the fewest free slots, so they go first; in-place objective labels can move and keep a leader.
      todo.sort(function (p, q) { return (q.pin - p.pin) || (q.focus - p.focus) || (p.a.depth - q.a.depth); });
      todo.forEach(function (it) {
        var L = it.L, s = Math.max(titlePx / TITLE_PX, L.sub ? 14 / SUB_PX : 0), pw = L.w * s, ph = L.h * s;
        var a = it.a, target = it.seal || a, best = null, pinned = false, blockers = avoid.concat(placed);
        var visible = a.depth > 0 && !blocked(a), targetOn = !it.pin;
        function clampBox(left, top, r) {
          r = r || { left: pad, right: w - pad, top: pad, bottom: h - pad };
          left = Math.max(r.left, Math.min(r.right - pw, left)); top = Math.max(r.top, Math.min(r.bottom - ph, top));
          return { left: left, top: top, right: left + pw, bottom: top + ph };
        }
        // Objective labels also try a grid over the given area, so they find the nearest free slot when crowded.
        function search(want, limit, r, grid) {
          var found = null, cands = [want], y, x;
          if (!blockers.some(function (b) { return hits(want, b); })) return want;
          if (grid) for (y = grid.top; y <= grid.bottom - ph; y += 6) for (x = grid.left; x <= grid.right - pw; x += 12) cands.push(clampBox(x, y, grid));
          blockers.forEach(function (b) {
            cands.push(clampBox(want.left, b.top - gap - ph, r), clampBox(want.left, b.bottom + gap, r),
              clampBox(b.left - gap - pw, want.top, r), clampBox(b.right + gap, want.top, r));
          });
          cands.forEach(function (c) {
            if (blockers.some(function (b) { return hits(c, b); })) return;
            var d = Math.hypot(c.left - want.left, c.top - want.top);
            if (d <= limit && (!found || d < found.d)) { found = c; found.d = d; }
          });
          return found;
        }
        if (it.focus && !targetOn) {
          // Pin at the point of the safe band nearest the seal, with room for the arrow on the edge the seal lies beyond.
          var r = { left: band.left, right: band.right, top: band.top, bottom: band.bottom }, room = arrowPx + gap;
          var ox = Math.max(band.left - target.x, target.x - band.right, 0), oy = Math.max(band.top - target.y, target.y - band.bottom, 0);
          pinned = ox >= oy ? (target.x < w / 2 ? 'left' : 'right') : (target.y < (band.top + band.bottom) / 2 ? 'top' : 'bottom');
          r[pinned] += pinned === 'left' || pinned === 'top' ? room : -room;
          var want = clampBox(target.x - pw / 2, target.y - ph / 2, r);
          best = search(want, Infinity, r, r) || want;
        } else if (visible || (it.focus && targetOn)) {
          var wantHere = clampBox(a.x - pw / 2, a.y - ph);
          best = it.focus ? search(wantHere, Infinity, null, band) || wantHere : search(wantHere, Math.max(2.5 * ph, 90));
        }
        var m = it.sp.material, shown = best ? 1 : 0;
        m.opacity += (shown - m.opacity) * 0.5; if (Math.abs(shown - m.opacity) < 0.02) m.opacity = shown;
        if (best) { placed.push(best); it.sp.userData.screen = { box: best, pinned: pinned, pw: pw, ph: ph }; }
        var at = it.sp.userData.screen, arrow = L.arrow, leader = L.leader;
        arrow.visible = false; if (leader) leader.visible = false;
        if (!at || m.opacity === 0) { m.opacity = 0; return; }
        var depth = a.depth > 0 ? a.depth : 10, b = at.box, bx = (b.left + b.right) / 2;
        placeOnScreen(it.sp, camera, w, h, bx, b.bottom, depth, at.pw, at.ph);
        var record = best ? { id: L.id, text: L.text, left: b.left, top: b.top, width: at.pw, height: at.ph,
          titlePx: TITLE_PX * s, subPx: L.sub ? SUB_PX * s : null, focus: it.focus, pinned: !!at.pinned, edge: at.pinned || null, arrow: null, leader: null } : null;
        if (at.pinned) {
          // The arrow sits in the reserved room beside the label and turns to point at the seal.
          var half = arrowPx / 2, side = at.pinned, ox, oy;
          if (side === 'left' || side === 'right') {
            ox = side === 'left' ? b.left - gap - half : b.right + gap + half;
            oy = Math.max(b.top + half, Math.min(b.bottom - half, target.y));
          } else {
            oy = side === 'top' ? b.top - gap - half : b.bottom + gap + half;
            ox = Math.max(b.left + half, Math.min(b.right - half, target.x));
          }
          var ux = target.x - ox, uy = target.y - oy, len = Math.hypot(ux, uy) || 1;
          ux /= len; uy /= len;
          arrow.visible = true; arrow.material.opacity = m.opacity;
          placeOnScreen(arrow, camera, w, h, ox, oy, depth, arrowPx, arrowPx, Math.atan2(-uy, ux) - Math.PI / 2);
          if (record) record.arrow = { x: ox, y: oy, dx: ux, dy: uy, size: arrowPx };
        } else if (leader && it.seal && it.seal.depth > 0) {
          // Leader from the seal's rim up to the label's pointer, drawn only when they are apart.
          var sx = it.seal.x, sy = it.seal.y, lx = bx - sx, ly = b.bottom - sy, dist = Math.hypot(lx, ly);
          var rim = Math.min(0.5 * 1.3 / it.seal.depth * camera.projectionMatrix.elements[5] * h / 2, dist);
          if (dist - rim > 8) {
            leader.visible = true; leader.material.opacity = m.opacity;
            var px = sx + lx / dist * rim, py = sy + ly / dist * rim;
            placeOnScreen(leader, camera, w, h, px, py, it.seal.depth, Math.max(4, h / 160), dist - rim, Math.atan2(-ly, lx) - Math.PI / 2);
            if (record) record.leader = { x1: px, y1: py, x2: bx, y2: b.bottom };
          }
        }
        if (record) boxes.push(record);
      });
    }
    var SEALS = {};
    function sealEmblem(x, kind) {
      x.fillStyle = INK; x.strokeStyle = INK; x.lineCap = 'round'; x.lineJoin = 'round';
      if (kind === 'quill') {
        x.beginPath(); x.moveTo(86, 174); x.bezierCurveTo(98, 124, 136, 86, 184, 68); x.bezierCurveTo(178, 112, 142, 150, 96, 172); x.closePath(); x.fill();
        x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(94, 166); x.quadraticCurveTo(134, 118, 178, 76); x.stroke();
        x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.moveTo(88, 172); x.lineTo(70, 194); x.stroke();
      } else if (kind === 'eye') {
        x.lineWidth = 9; x.beginPath(); x.moveTo(62, 128); x.quadraticCurveTo(128, 70, 194, 128); x.quadraticCurveTo(128, 186, 62, 128); x.closePath(); x.stroke();
        x.beginPath(); x.arc(128, 128, 20, 0, TAU); x.fill();
      } else if (kind === 'house') {
        x.beginPath(); x.moveTo(78, 124); x.lineTo(128, 80); x.lineTo(178, 124); x.closePath(); x.fill();
        x.fillRect(90, 122, 76, 56); x.fillStyle = '#ffffff'; x.fillRect(118, 144, 20, 34);
      } else if (kind === 'flag') {
        x.lineWidth = 8; x.beginPath(); x.moveTo(98, 186); x.lineTo(98, 72); x.stroke();
        x.beginPath(); x.moveTo(102, 74); x.lineTo(176, 98); x.lineTo(102, 124); x.closePath(); x.fill();
      } else {
        x.beginPath();
        for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 52; x[i ? 'lineTo' : 'moveTo'](128 + Math.cos(a) * r, 128 + Math.sin(a) * r); }
        x.closePath(); x.fill();
      }
    }
    // An open seal has a white fill that the material tints wax red. A visited seal is painted parchment with a
    // faded emblem and a check mark, so the state reads by shape as well as colour.
    function sealTexture(kind, done) {
      var key = kind + (done ? ':done' : '');
      if (SEALS[key]) return SEALS[key];
      var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
      x.beginPath();
      for (var i = 0; i <= 72; i++) {
        var a = i / 72 * TAU, r = 106 + Math.sin(a * 7) * 4 + Math.sin(a * 3 + 1) * 3;
        x[i ? 'lineTo' : 'moveTo'](128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      x.closePath(); x.fillStyle = done ? '#ece0c0' : '#ffffff'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
      x.globalAlpha = done ? 0.4 : 1;
      x.beginPath(); x.arc(128, 128, 80, 0, TAU); x.lineWidth = 5; x.stroke();
      if (x.setLineDash) x.setLineDash([7, 9]);
      x.beginPath(); x.arc(128, 128, 92, 0, TAU); x.lineWidth = 3; x.stroke();
      if (x.setLineDash) x.setLineDash([]);
      x.globalAlpha = done ? 0.25 : 1; sealEmblem(x, kind); x.globalAlpha = 1;
      if (done) {
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.beginPath(); x.moveTo(74, 132); x.lineTo(112, 172); x.lineTo(186, 84);
        x.strokeStyle = '#ece0c0'; x.lineWidth = 40; x.stroke();
        x.strokeStyle = INK; x.lineWidth = 30; x.stroke();
        x.strokeStyle = '#2f5e36'; x.lineWidth = 18; x.stroke();
      }
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; SEALS[key] = t; return t;
    }
    var SEAL_KIND = { parsonage: 'star', lantern: 'house', orchard: 'house', parker: 'star', militia: 'star', town: 'star',
      near: 'quill', far: 'quill', boundary: 'flag', corner: 'eye', edge: 'eye', shelter: 'house' };
    function stopMarker(id) {
      var kind = SEAL_KIND[id] || 'star', done = false;
      var m = new T.Mesh(new T.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({
        map: sealTexture(kind, false), color: STOP_TODO, transparent: true, depthWrite: false, fog: false
      }));
      m.renderOrder = 2;
      Object.defineProperty(m, 'done', {
        get: function () { return done; },
        set: function (v) {
          if (!!v === done) return; done = !!v;
          m.material.map = sealTexture(kind, done); m.material.color.set(done ? 0xffffff : STOP_TODO);
        }
      });
      return m;
    }

    // ======================= Lexington Green (instance) =======================
    // Geography (scene units ~ metres-ish, not to scale): the road comes in from +z; the Green is a disc at the origin.
    var LINE = {
      regFront: { z: 9, x0: -6, dx: 2 }, regBack: { z: 10.6 },
      milFront: { z: -3, x0: -8, dx: 1.9 }, milBack: { z: -4.6 },
      zones: {
        front:   { kind: 'line', z: 7.2, x0: -6, x1: 10 },
        between: { kind: 'line', z: 2.6, x0: -6, x1: 10 },
        ranks:   { kind: 'line', z: -3.8, x0: -8, x1: 7.2 },
        wall:    { kind: 'spot', x: -17.3, z: -6.5 },
        house:   { kind: 'spot', x: 18.4, z: -6.4 }
      }
    };
    function head(t) { return lerp(64, 21, ease((t - 6.6) / 7.6)); }      // column head z during the march (cutscene time)

    function makeLex() {
      seed = 1775;                                      // identical layout for every instance
      var scene = new T.Scene(); scene.fog = new T.Fog(0xe6b99c, 40, 190); scene.onBeforeRender = layoutLabels;
      var g = new T.Group(); scene.add(g);
      g.add(skyDome(0x3d4f7c, 0xd99a8a, 0xffc98f));
      var sunDir = new T.Vector3(-1, 0.12, -0.55);
      g.add(sun(sunDir, 120));
      lights(g, 0xc6cdef, 0x6a6040, 1.3, 0xffbd7a, 2.6, sunDir.clone().multiplyScalar(60), 42);
      g.add(terrain(240, 240, 44, 44, 0x5f7a3a, function (x, z) {
        var r = Math.sqrt(x * x + z * z); return r < 30 ? (rand() - 0.5) * 0.08 : (r - 30) * 0.04 * (1 + Math.sin(x * 0.07) * Math.cos(z * 0.09)) + (rand() - 0.5) * 0.6;
      }));
      var green = mesh(new T.CircleGeometry(22, 9).rotateX(-Math.PI / 2), mat(0x6f8d43), false, true); green.position.y = 0.05; g.add(green);
      var road = mesh(new T.PlaneGeometry(4.5, 110).rotateX(-Math.PI / 2), mat(0x8a7354), false, true); road.position.set(2.5, 0.07, 66); g.add(road);
      // meetinghouse
      var mh = new T.Group(); mh.position.set(-12, 0, -17); mh.rotation.y = 0.25;
      var body = mesh(new T.BoxGeometry(10, 5.5, 7), mat(0xe9e3d3), true, true); body.position.y = 2.75; mh.add(body);
      var roof = mesh(gable(10.8, 7.8, 3.2), mat(0x5b4a3e)); roof.position.y = 5.5; mh.add(roof);
      var tower = mesh(new T.BoxGeometry(2.4, 3.2, 2.4), mat(0xe9e3d3)); tower.position.set(0, 9.2, 0); mh.add(tower);
      var spire = mesh(new T.ConeGeometry(1.5, 4.2, 4), mat(0x5b4a3e)); spire.position.set(0, 12.9, 0); spire.rotation.y = Math.PI / 4; mh.add(spire);
      for (var w = -3; w <= 3; w += 2) { var win = mesh(new T.BoxGeometry(0.9, 1.4, 0.1), mat(0x2d3440), false); win.position.set(w * 1.3, 3, 3.52); mh.add(win); }
      var door = mesh(new T.BoxGeometry(1.4, 2.4, 0.1), mat(0x4a3a2a), false); door.position.set(0, 1.2, 3.53); mh.add(door);
      g.add(mh);
      // houses around the Green
      [[-25, 7, 0.6, 0x7a4b3a], [22.5, -10, -0.4, 0xd9cfb8], [-21, 24, 1.1, 0x5e6b73], [25, 18, -1.2, 0x8c5a3c], [12, -24, 0.1, 0xb8a585]].forEach(function (h) {
        var hg = new T.Group(); hg.position.set(h[0], 0, h[1]); hg.rotation.y = h[2];
        var hb = mesh(new T.BoxGeometry(7, 4, 5), mat(h[3]), true, true); hb.position.y = 2; hg.add(hb);
        var hr = mesh(gable(7.6, 5.8, 2.4), mat(0x3f3a36)); hr.position.y = 4; hg.add(hr);
        var ch = mesh(new T.BoxGeometry(0.8, 2.4, 0.8), mat(0x6b4b3b)); ch.position.set(2.2, 5.4, 0); hg.add(ch);
        for (var k = -1; k <= 1; k += 2) { var wi = mesh(new T.BoxGeometry(0.9, 1, 0.1), mat(0x2d3440), false); wi.position.set(k * 1.8, 2.3, 2.53); hg.add(wi); }
        g.add(hg);
      });
      // a low fieldstone wall along the west edge of the Green
      for (var sx = 0; sx < 14; sx++) {
        var stn = mesh(new T.BoxGeometry(rnd(0.7, 0.95), rnd(0.75, 1.05), rnd(0.7, 0.95)), mat([0x8d8a84, 0x77746e, 0x9b968c][sx % 3]), true, true);
        stn.position.set(-16 + rnd(-0.08, 0.08), 0.42, -12.5 + sx * 0.85); stn.rotation.y = rnd(-0.2, 0.2); g.add(stn);
        var cap = mesh(new T.BoxGeometry(rnd(0.5, 0.8), 0.35, rnd(0.5, 0.75)), mat(0x84817a), true, true);
        cap.position.set(-16 + rnd(-0.1, 0.1), 1.0, -12.3 + sx * 0.85); g.add(cap);
      }
      // trees
      for (var i = 0; i < 50; i++) {
        var a = rnd(0, TAU), r = rnd(32, 80), tx = Math.cos(a) * r, tz = Math.sin(a) * r;
        if (Math.abs(tx - 2.5) < 7 && tz > 0) continue;
        var tr = new T.Group(); tr.position.set(tx, (r - 30) * 0.04, tz);
        var trunk = mesh(new T.CylinderGeometry(0.25, 0.35, 2, 5), mat(0x4b3621)); trunk.position.y = 1; tr.add(trunk);
        var crown = mesh(new T.ConeGeometry(rnd(1.8, 2.8), rnd(4.5, 7), 6), mat([0x2f4a26, 0x3a5a2c, 0x5a6b2c][i % 3])); crown.position.y = 4.4; tr.add(crown);
        tr.scale.setScalar(rnd(0.8, 1.3)); g.add(tr);
      }
      // spectators (static): a few townspeople at the edges, watching
      [[-19.5, 3.2, 1.9, 0], [-20.6, 9, 2.3, 1], [17.6, -5.4, -1.6, 0], [19.4, -13.2, -1.1, 1], [-7.5, -12.6, 0.4, 0], [14, 14, -2.4, 0]].forEach(function (s, k) {
        var p = person(s[3] ? { coat: 0x7b5b6a, pants: 0x6a5b70, skirt: true, hat: 'bonnet', hatColor: 0xece4d0 }
                             : { coat: [0x5d5148, 0x6e6a58, 0x46505c][k % 3], pants: 0x5b5246, hat: 'round', hatColor: 0x2c241c });
        p.position.set(s[0], 0.05, s[1]); p.rotation.y = s[2]; g.add(p);
      });
      // militia: two ranks on the Green, facing the road (+z)
      var militia = [], coats = [0x6b4a2f, 0x4f5a45, 0x4a5568, 0x8a6f4a, 0x5a3d2b, 0x3e4a5c];
      for (var rnk = 0; rnk < 2; rnk++) for (var k = 0; k < 9; k++) {
        var m = person({ coat: coats[(k + rnk * 3) % coats.length], pants: [0xc8b48a, 0x6d5a45, 0x8b7d6b][k % 3],
          hat: (k + rnk) % 3 ? 'round' : 'tricorne', hatColor: (k % 2) ? 0x3b2f22 : 0x1e1e1e, musket: true });
        m.userData.dyn = true;
        m.userData.base = new T.Vector3(LINE.milFront.x0 + k * LINE.milFront.dx + rnd(-0.25, 0.25) + rnk * 0.5, 0.05, (rnk ? LINE.milBack.z : LINE.milFront.z) + rnd(-0.2, 0.2));
        m.userData.rotY = 0.12 + rnd(-0.15, 0.15); m.userData.rank = rnk; m.userData.k = k;
        g.add(m); militia.push(m);
      }
      // British regulars: 12 rows of three; the first 6 rows are the advance companies that wheel onto the Green
      var regs = [];
      for (var row = 0; row < 12; row++) for (var col = 0; col < 3; col++) {
        var rg = person({ coat: 0xb3262b, pants: 0xe8e2d0, tails: true, belts: 0xf2efe6, pack: 0x5a4632, hat: 'tricorne', musket: true });
        rg.userData.dyn = true; rg.userData.row = row; rg.userData.col = col; rg.userData.adv = row < 6;
        var idx = row * 3 + col;
        if (row < 6) { var slot = idx; rg.userData.slot = { x: LINE.regFront.x0 + (slot % 9) * LINE.regFront.dx, z: slot < 9 ? LINE.regFront.z : LINE.regBack.z, front: slot < 9 }; }
        g.add(rg); regs.push(rg);
      }
      // mounted officer
      var horse = new T.Group();
      var hbody = mesh(new T.BoxGeometry(0.8, 0.9, 2.2), mat(0x3b2a1e)); hbody.position.y = 1.5; horse.add(hbody);
      var hneck = mesh(new T.BoxGeometry(0.45, 1.1, 0.5), mat(0x3b2a1e)); hneck.position.set(0, 2.1, -1.05); hneck.rotation.x = 0.5; horse.add(hneck);
      var hhead = mesh(new T.BoxGeometry(0.38, 0.4, 0.8), mat(0x3b2a1e)); hhead.position.set(0, 2.55, -1.45); horse.add(hhead);
      var hlegs = [];
      [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]].forEach(function (p) { var l = mesh(G.leg, mat(0x2e2016)); l.scale.set(1.3, 1.4, 1.3); l.position.set(p[0], 1.1, p[1]); l.userData.keep = true; horse.add(l); hlegs.push(l); });
      var rider = person({ coat: 0xb3262b, pants: 0xe8e2d0, tails: true, hat: 'tricorne' }); rider.position.y = 1.15; rider.rotation.y = Math.PI; rider.userData.legs.forEach(function (l) { l.rotation.x = -1.2; }); horse.add(rider);
      horse.userData.dyn = true; g.add(horse);
      // the unknown hidden figure (only shown when the kid's version uses it)
      var hidden = person({ coat: 0x3c3f44, pants: 0x34322e, hat: 'round', hatColor: 0x222222, musket: true });
      hidden.userData.dyn = true; hidden.visible = false; g.add(hidden);
      bakeAll(g);

      // ---- non-baked overlays: zone markers, shooter ring, labels ----
      var markers = {}, mk = new T.Group(); g.add(mk);
      Object.keys(LINE.zones).forEach(function (zk) {
        var Z = LINE.zones[zk], grp = new T.Group(), m;
        var mm = new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.45, depthWrite: false, fog: false });
        if (Z.kind === 'line') { m = new T.Mesh(new T.PlaneGeometry(Z.x1 - Z.x0 + 2, 1.4).rotateX(-Math.PI / 2), mm); m.position.set((Z.x0 + Z.x1) / 2, 0.12, Z.z); }
        else { m = new T.Mesh(new T.RingGeometry(1.1, 1.7, 24).rotateX(-Math.PI / 2), mm); m.position.set(Z.x, 0.12, Z.z); }
        grp.add(m); grp.userData.m = m; grp.visible = false; mk.add(grp); markers[zk] = grp;
      });
      var ring = new T.Mesh(new T.RingGeometry(0.55, 0.85, 24).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xff5a36, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
      ring.visible = false; g.add(ring);
      var fx = fxPool(g, 110);

      var api = { scene: scene, group: g, militia: militia, regs: regs, horse: horse, rider: rider, hidden: hidden, markers: markers, ring: ring, fx: fx, hlegs: hlegs };

      // ----- poses -----
      function milRest(m) { m.position.copy(m.userData.base); m.rotation.set(0, m.userData.rotY, 0); standLegs(m); }
      function regFormed(r) {
        var u = r.userData;
        if (u.adv) { r.position.set(u.slot.x, 0.05, u.slot.z); r.rotation.set(0, Math.PI, 0); }
        else { r.position.set(1.2 + u.col * 1.3, 0.05, 21 + u.row * 1.6); r.rotation.set(0, Math.PI, 0); }
        standLegs(r);
      }
      // cutscene pose as a pure function of time (seconds since the cutscene began)
      api.poseCutscene = function (t) {
        hidden.visible = false; ring.visible = false;
        militia.forEach(milRest);
        var h = head(t), marching = t < 14.2;
        var wk = clamp01((t - 14) / 5.5);                   // wheel progress for the advance companies
        regs.forEach(function (r) {
          var u = r.userData, cx = 1.2 + u.col * 1.3, cz = Math.max(h, 21) + u.row * 1.6;
          if (u.adv && wk > 0) {
            var sx = cx, sz = 21 + u.row * 1.6, ex = u.slot.x, ez = u.slot.z, k = ease(wk);
            var mx = sx, mz = ez + 3.5;                    // quadratic curve: come down the road, then swing out into line
            var x = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * mx + k * k * ex, z = (1 - k) * (1 - k) * sz + 2 * (1 - k) * k * mz + k * k * ez;
            var dx = 2 * (1 - k) * (mx - sx) + 2 * k * (ex - mx), dz = 2 * (1 - k) * (mz - sz) + 2 * k * (ez - mz);
            r.position.set(x, 0.05, z);
            r.rotation.set(0, wk < 1 ? Math.atan2(dx, dz) * (1 - k * k) + Math.PI * (k * k) : Math.PI, 0);
            if (wk < 1) walkLegs(r, t, 7); else standLegs(r);
          } else {
            r.position.set(cx, 0.05, cz); r.rotation.set(0, Math.PI, 0);
            if (marching) walkLegs(r, t, 7); else standLegs(r);
          }
        });
        // the mounted officer leads the column, then rides out in front of the new line
        var hk = ease(clamp01((t - 14.6) / 4.5));
        horse.position.set(lerp(2.5, 2.2, hk), 0.05, lerp(Math.max(h, 21) - 3.2, 6.6, hk)); horse.rotation.set(0, 0, 0);
        hlegs.forEach(function (l, j) { l.rotation.x = (marching || (hk > 0 && hk < 1)) ? Math.sin(t * 7 + j * 1.6) * 0.35 : 0; });
      };
      api.poseFormed = function () { hidden.visible = false; militia.forEach(milRest); regs.forEach(regFormed);
        horse.position.set(2.2, 0.05, 6.6); horse.rotation.set(0, 0, 0); hlegs.forEach(function (l) { l.rotation.x = 0; }); };

      // ----- the kid's version, replayed. Positions are a pure function of t; shots fire as t crosses event times -----
      var REPLAY_T = 10.5, SHOT_T = 1.6;
      function nearest(list, x, z) { var best = null, bd = 1e9; list.forEach(function (o) { var p = o.userData.base || o.position, d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < bd) { bd = d; best = o; } }); return best; }
      api.plan = function (v) {                       // resolve a version into concrete actors + events
        var P = { v: v, events: [], shooter: null, kind: v.shooter }, pt = v.point || zonePoint(v.location, null);
        api.poseFormed();
        var frontRegs = regs.filter(function (r) { return r.userData.adv && r.userData.slot.front; });
        var backRegs = regs.filter(function (r) { return r.userData.adv && !r.userData.slot.front; });
        if (v.shooter === 'regular') { var s = nearest(frontRegs.map(function (r) { r.userData.base = new T.Vector3(r.userData.slot.x, 0, r.userData.slot.z); return r; }), pt.x, pt.z); P.shooter = s; P.from = new T.Vector3(s.userData.slot.x, 0.05, s.userData.slot.z); P.to = new T.Vector3(pt.x, 0.05, Math.min(pt.z, s.userData.slot.z) - (v.location === 'front' ? 0.8 : 0)); }
        else if (v.shooter === 'officer') { P.shooter = horse; P.from = new T.Vector3(2.2, 0.05, 6.6); P.to = new T.Vector3(pt.x, 0.05, pt.z); }
        else if (v.shooter === 'militiaman') { P.shooter = nearest(militia, pt.x, pt.z); }
        else { P.shooter = hidden; P.spot = v.location; }
        // events
        var E = P.events;
        E.push({ t: SHOT_T, kind: 'first' });
        var a = v.aftermath;
        function volley(t0, list, dirZ) { list.forEach(function (r, i) { E.push({ t: t0 + (i % 5) * 0.06 + (i * 0.013), kind: 'fire', who: r, dz: dirZ }); }); }
        if (a === 'volley') { volley(2.8, frontRegs, -1); volley(3.5, backRegs, -1); }
        if (a === 'fewshots') { E.push({ t: 2.5, kind: 'fire', who: militia[4], dz: 1 }); E.push({ t: 2.95, kind: 'fire', who: militia[12], dz: 1 }); volley(3.6, frontRegs, -1); volley(4.2, backRegs, -1); }
        if (a === 'even') { [2.6, 5.0, 7.4].forEach(function (t0, j) { volley(t0, j % 2 ? backRegs : frontRegs, -1); }); [3.8, 6.2, 8.6].forEach(function (t0) { volley(t0, militia, 1); }); }
        if (a === 'driveback') { volley(2.6, militia, 1); }
        E.sort(function (x, y) { return x.t - y.t; });
        P.dur = REPLAY_T; api.cur = P; return P;
      };
      function shooterMuzzle(P, out) {
        var s = P.shooter; s.updateMatrixWorld(true);
        if (P.kind === 'officer') { out.set(0.45, 2.75, -0.9).applyMatrix4(s.matrixWorld); return out; }
        out.set(0.3, 1.5, 0.75).applyMatrix4(s.matrixWorld); return out;
      }
      var tmpV = new T.Vector3(), tmpD = new T.Vector3();
      api.poseReplay = function (P, t, clockT) {
        var v = P.v, a = v.aftermath;
        militia.forEach(milRest);
        regs.forEach(regFormed);
        horse.position.set(2.2, 0.05, 6.6); horse.rotation.set(0, 0, 0); hlegs.forEach(function (l) { l.rotation.x = 0; });
        hidden.visible = false;
        // the first shooter gets into position
        var k = ease(clamp01(t / 1.2));
        if (P.kind === 'regular') { P.shooter.position.lerpVectors(P.from, P.to, k); if (k > 0 && k < 1) walkLegs(P.shooter, clockT, 7); }
        if (P.kind === 'officer') { horse.position.lerpVectors(P.from, P.to, k); if (k > 0 && k < 1) hlegs.forEach(function (l, j) { l.rotation.x = Math.sin(clockT * 7 + j * 1.6) * 0.35; }); }
        if (P.kind === 'militiaman') { P.shooter.rotation.y = 0; }
        if (P.kind === 'hidden') {
          hidden.visible = true; var Z = LINE.zones[P.spot];
          hidden.position.set(Z.x, 0.05, Z.z); hidden.rotation.set(0, P.spot === 'wall' ? 1.21 : -1.23, 0); standLegs(hidden);
          if (P.spot === 'wall') kneel(hidden, 0.75);
        }
        // aftermath motion
        var ch = clamp01((t - (a === 'fewshots' ? 4.6 : 4.0)) / 4.5);
        if ((a === 'volley' || a === 'fewshots') && ch > 0) {
          regs.forEach(function (r) { if (!r.userData.adv) return; r.position.z -= ease(ch) * 7.5 + (r.userData.col - 1) * 0; walkLegs(r, clockT, 11, 0.6); });
          // officers try to get in front of it — the charge is beyond their control
          horse.position.x = lerp(horse.position.x, 9.5, ease(clamp01((t - 4.2) / 3))); horse.rotation.y = -ease(clamp01((t - 4.2) / 1.5)) * 1.2;
          hlegs.forEach(function (l, j) { l.rotation.x = Math.sin(clockT * 9 + j * 1.6) * 0.4; });
        }
        if (a === 'volley' || a === 'fewshots') {
          var s0 = a === 'volley' ? 3.0 : 4.1, sk = clamp01((t - s0) / 4.5);
          militia.forEach(function (m, i) {
            if (P.kind === 'militiaman' && m === P.shooter && t < s0) return;
            if (i === 2 || i === 7 || i === 11 || i === 15) { kneel(m, ease(clamp01((t - s0 + 0.1) / 0.6))); return; }   // some go down on one knee
            if (sk <= 0) return;
            var ang = Math.atan2(m.userData.base.x * 0.18, -1) + (i % 3 - 1) * 0.35;
            m.position.x += Math.sin(ang) * sk * 9; m.position.z += Math.cos(ang) * sk * 9; m.rotation.y = ang; walkLegs(m, clockT, 12, 0.7);
          });
        }
        if (a === 'stopped') {                          // an officer rides along the front; nobody moves
          var sk2 = clamp01((t - 2.2) / 3.2);
          horse.position.x = 2.2 + Math.sin(sk2 * Math.PI) * -7; horse.rotation.y = (sk2 > 0 && sk2 < 1 ? (sk2 < 0.5 ? 1.4 : -1.4) : 0);
          if (sk2 > 0 && sk2 < 1) hlegs.forEach(function (l, j) { l.rotation.x = Math.sin(clockT * 9 + j * 1.6) * 0.4; });
        }
        if (a === 'driveback') {
          var dk = ease(clamp01((t - 3.2) / 4.5));
          militia.forEach(function (m) { m.position.z += dk * 7; m.rotation.y = 0; if (dk > 0 && dk < 1) walkLegs(m, clockT, 11, 0.6); });
          regs.forEach(function (r) { if (!r.userData.adv) return; r.position.z += dk * 9; r.rotation.y = dk > 0 ? 0 : Math.PI; if (dk > 0 && dk < 1) walkLegs(r, clockT, 11, 0.6); });
          horse.position.z += dk * 10; horse.rotation.y = dk > 0 ? Math.PI : 0;
        }
        // the first shooter stays visible in place for the first shot
        if (P.kind === 'militiaman' && t < SHOT_T + 0.8) { P.shooter.position.copy(P.shooter.userData.base); P.shooter.rotation.set(0, 0, 0); standLegs(P.shooter); }
        ring.visible = t < SHOT_T + 2.2; if (ring.visible) { var sp = P.kind === 'officer' ? horse.position : P.shooter.position; ring.position.set(sp.x, 0.13, sp.z); var pul = 1 + 0.15 * Math.sin(clockT * 8); ring.scale.set(pul, pul, pul); }
      };
      api.fireEvents = function (P, t0, t1) {        // fire the events whose time lies in (t0, t1]
        P.events.forEach(function (e) {
          if (e.t <= t0 || e.t > t1) return;
          if (e.kind === 'first') { shooterMuzzle(P, tmpV); tmpD.set(0, 0, P.kind === 'militiaman' ? 1 : P.kind === 'hidden' ? 0 : -1);
            if (P.kind === 'hidden') { P.shooter.getWorldDirection(tmpD); }
            fx.shot(tmpV, tmpD, true); }
          else if (e.kind === 'fire') { var w = e.who; w.updateMatrixWorld(true); tmpV.set(0.3, 1.5, 0.75).applyMatrix4(w.matrixWorld); tmpD.set(0, 0, e.dz); fx.shot(tmpV, tmpD, false); }
        });
      };
      api.shooterWorld = function (P, out) { if (!P || !P.shooter) return null; return shooterMuzzle(P, out); };
      api.SHOT_T = SHOT_T; api.REPLAY_T = REPLAY_T;
      return api;
    }

    // snap a picked ground point to the nearest allowed zone (returns {zone, x, z})
    function zonePoint(zone, p) {
      var Z = LINE.zones[zone]; if (!Z) return null;
      if (Z.kind === 'spot') return { zone: zone, x: Z.x, z: Z.z };
      var x = p ? Math.max(Z.x0, Math.min(Z.x1, p.x)) : (Z.x0 + Z.x1) / 2 + (zone === 'ranks' ? -0.6 : 0.2);
      return { zone: zone, x: x, z: Z.z };
    }
    function snap(p, allowed) {
      var best = null, bd = 1e9;
      allowed.forEach(function (z) { var q = zonePoint(z, p), d = (q.x - p.x) * (q.x - p.x) + (q.z - p.z) * (q.z - p.z); if (d < bd) { bd = d; best = q; } });
      return best;
    }

    // ======================= the globe (v2.1) =======================
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
      var rings = decodeCoast(window.WG_COAST_B64), path = new Path2D(), coastPath = new Path2D();
      rings.forEach(function (a) {
        var n = a.length / 2, u = new Float32Array(n), lo = 1e9, hi = -1e9;
        for (var i = 0; i < n; i++) { var L = a[i * 2]; if (i) { var d = L - a[i * 2 - 2]; if (d > 180) d -= 360; else if (d < -180) d += 360; L = u[i - 1] + d; } u[i] = L; lo = Math.min(lo, L); hi = Math.max(hi, L); }
        var polar = Math.abs(u[n - 1] - u[0]) > 180, offs = polar ? [0] : [-360, 0, 360];
        offs.forEach(function (o) {
          if (!polar && (hi + o < -180 || lo + o > 180)) return;
          var pen = false;
          for (var i = 0; i < n; i++) { var px = ((polar ? a[i * 2] : u[i] + o) + 180) / 360 * W, py = (90 - a[i * 2 + 1]) / 180 * H;
            if (i) path.lineTo(px, py); else path.moveTo(px, py);
            var edge = polar && a[i * 2 + 1] < -84.5;
            if (edge) pen = false; else if (pen) coastPath.lineTo(px, py); else { coastPath.moveTo(px, py); pen = true; } }
          path.closePath(); if (!polar) coastPath.closePath();
        });
      });
      var oc = x.createLinearGradient(0, 0, 0, H);
      oc.addColorStop(0, '#1b4677'); oc.addColorStop(0.5, '#1f5a98'); oc.addColorStop(1, '#1b4677');
      x.fillStyle = oc; x.fillRect(0, 0, W, H);
      var cell = W / 160, rs = 7, TW = Math.round(cell * 16), TH = Math.round(cell * 8);
      function rnd2() { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }
      function facetTile(alpha) {
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
      x.strokeStyle = 'rgba(64,138,200,.45)'; x.lineWidth = W / 220; x.stroke(coastPath);
      x.strokeStyle = 'rgba(96,170,220,.55)'; x.lineWidth = W / 600; x.stroke(coastPath);
      var stops = [[0, '#eef3f6'], [0.1, '#e6edf0'], [0.15, '#58784a'], [0.25, '#4e7a3e'], [0.31, '#62904a'],
        [0.36, '#b9a26c'], [0.41, '#d2b87c'], [0.45, '#7c9a4e'], [0.5, '#3f7f35'], [0.56, '#4a8a3a'], [0.62, '#c4a970'], [0.68, '#8fa05a'], [0.75, '#5d7a46'], [0.81, '#e3eaee'], [1, '#f2f6f8']];
      var lc = document.createElement('canvas'); lc.width = W; lc.height = H; var main = x; x = lc.getContext('2d');
      var lg = x.createLinearGradient(0, 0, 0, H); stops.forEach(function (sp) { lg.addColorStop(sp[0], sp[1]); });
      x.fillStyle = lg; x.fillRect(0, 0, W, H); facets(0.12);
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = '#000'; x.fill(path, 'evenodd');
      x = main; x.drawImage(lc, 0, 0);
      x.strokeStyle = 'rgba(28,46,30,.6)'; x.lineWidth = Math.max(1.2, W / 2800); x.stroke(coastPath);
      var tex = new T.CanvasTexture(cvs); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      globePaintMs = Math.round(performance.now() - t0);
      return tex;
    }
    function ensureEarthMap() { if (earth.material.map) return; earth.material.map = paintMap(); earth.material.color.set(0xffffff); earth.material.needsUpdate = true; }
    (function buildGlobe() {
      earth = new T.Mesh(new T.SphereGeometry(1, 128, 64), new T.MeshStandardMaterial({ color: 0x1f5a98, roughness: 0.92, metalness: 0, flatShading: true }));
      earth.rotation.y = -Math.PI / 2; globe.add(earth);
      var ac = document.createElement('canvas'); ac.width = ac.height = 256; var ax = ac.getContext('2d'), gr = ax.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(110,170,255,0)'); gr.addColorStop(0.72, 'rgba(110,170,255,0)'); gr.addColorStop(0.78, 'rgba(130,190,255,.55)');
      gr.addColorStop(0.86, 'rgba(90,150,255,.18)'); gr.addColorStop(1, 'rgba(60,110,255,0)'); ax.fillStyle = gr; ax.fillRect(0, 0, 256, 256);
      var at = new T.CanvasTexture(ac); at.colorSpace = T.SRGBColorSpace;
      var atm = new T.Sprite(new T.SpriteMaterial({ map: at, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      atm.scale.set(2.56, 2.56, 1); atm.renderOrder = -1; gScene.add(atm);
      seed = 99;
      var sp = new Float32Array(1600 * 3), v = new T.Vector3();
      for (var i = 0; i < 1600; i++) { v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(60, 90)); sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z; }
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
      gScene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false })));
    })();
    gScene.add(new T.HemisphereLight(0xcfe0ff, 0x1a2233, 0.9));
    var gSun = new T.DirectionalLight(0xfff3e0, 2.4); gSun.position.set(-3, 2.5, 5); gScene.add(gSun);
    var LEX = { lat: 42.45, lon: -71.23 };
    var SYRACUSE_YEAR = -412, LEX_YEAR = 1775;  // 413 BC to AD 1775 (no year 0: -412 = 413 BC)
    var YEAR_SPAN = LEX_YEAR - SYRACUSE_YEAR;   // 2187 years
    function fmtYear(y) { return y <= 0 ? (1 - y) + ' BC' : 'AD ' + y; }
    var pin = new T.Group();
    pin.add(new T.Mesh(new T.ConeGeometry(0.012, 0.05, 6).rotateX(-Math.PI / 2).translate(0, 0, 0.025), new T.MeshBasicMaterial({ color: 0xff9a52 })));
    var pinDot = new T.Sprite(new T.SpriteMaterial({ map: GLOW, color: 0xffb070, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pin.add(pinDot);
    var pinLab = labelSprite('Lexington · AD 1775'); pinLab.position.set(0, 0, 0.1); pin.add(pinLab);
    pin.position.copy(ll2v(LEX.lat, LEX.lon, 1.002)); pin.lookAt(ll2v(LEX.lat, LEX.lon, 2)); globe.add(pin);
    var START = { lat: 18, lon: -5 };
    // u: 0..1 — spin from 413 BC to AD 1775, rotating ~1 turn per year (2187 years total)
    function placeGlobe(u) {
      var S = ease(u), turns = YEAR_SPAN, dLon = (LEX.lon - START.lon) - 360 * turns;
      var lon = START.lon + dLon * S, lat = START.lat + (LEX.lat - START.lat) * S;
      globe.rotation.set(lat * D2R, -lon * D2R, 0, 'XYZ');
      var alt = 0.3 + 2.4 * (1 - ease(clamp01((u - 0.35) / 0.65)));
      gCam.position.set(0, 0, 1 + alt); gCam.lookAt(0, 0, 0);
      var ps = 0.2 + alt * 0.95, far = clamp01((alt - 0.5) / 0.8);
      pin.children[0].scale.setScalar(ps); pinDot.scale.set(0.05 * ps, 0.05 * ps, 1);
      pinLab.material.opacity = far; pinLab.scale.set(0.42 * ps * 0.55, 0.08 * ps * 0.55, 1); pinLab.position.z = 0.06 * ps;
      globe.updateMatrixWorld(true); var wp = new T.Vector3(); pin.getWorldPosition(wp); pinLab.visible = wp.z > 0.25 && far > 0.01; pinDot.visible = wp.z > 0;
      // Apply motion blur during high-speed rotation (peak velocity ~0.3-0.7)
      var speedFactor = Math.abs(Math.sin(Math.PI * S)); // peaks at 0.5, tapers at ends
      var blurAmount = clamp01(speedFactor * 2.2 - 0.15); // threshold to avoid blur at start/end
      earth.material.opacity = lerp(1, 0.35, blurAmount);
      earth.material.transparent = blurAmount > 0.01;
      // Return current year for display
      var year = Math.round(SYRACUSE_YEAR + YEAR_SPAN * S);
      return { year: year, yearText: fmtYear(year) };
    }

    // WL-S1's fictional lane uses the same low-poly people and materials as the Green.
    function makeNight() {
      var scene = new T.Scene(); scene.background = new T.Color(0x101e36); scene.onBeforeRender = layoutLabels;
      scene.fog = new T.Fog(0x101e36, 38, 105);
      var g = new T.Group(); scene.add(g);
      lights(g, 0xb4d5ff, 0x403d33, 1.6, 0xb4ceff, 2.1, new T.Vector3(-20, 35, 12), 55);
      g.add(mesh(new T.PlaneGeometry(130, 150).rotateX(-Math.PI / 2), mat(0x354c3c), false, true));
      var lane = mesh(new T.PlaneGeometry(5, 50).rotateX(-Math.PI / 2), mat(0x897a65), false, true);
      lane.position.set(0, 0.04, 23); g.add(lane);
      function home(x, z, color, label, id) {
        var h = new T.Group(); h.position.set(x, 0, z); g.add(h);
        var body = mesh(new T.BoxGeometry(6, 4, 5), mat(color), true, true); body.position.y = 2; h.add(body);
        var roof = mesh(gable(6.6, 5.8, 2), mat(0x34333b)); roof.position.y = 4; h.add(roof);
        [-1.6, 1.6].forEach(function (wx) {
          var win = mesh(new T.BoxGeometry(0.8, 1, 0.12), mat(0xffd18b, { emissive: 0xc48130, emissiveIntensity: 0.8 }), false);
          win.position.set(wx, 2.1, 2.55); h.add(win);
        });
        var sign = labelSprite(label, id, h, true); sign.position.set(0, 6.4, 0); h.add(sign);
      }
      home(-8, 44, 0xb2a493, 'Parsonage · reconstruction', 'parsonage');
      home(-8, 28, 0x876c65, 'Lantern · fictional', 'lantern');
      home(8, 10, 0x82929a, 'Orchard · fictional', 'orchard');
      var residents = [], rings = [];
      [[-2.8, 44], [-2.8, 28], [2.8, 10]].forEach(function (p, i) {
        var resident = person({ coat: i ? 0x977870 : 0x4a667b, pants: 0x6c6558, hat: 'round', hatColor: 0x292e39 });
        resident.position.set(p[0], 0, p[1]); resident.rotation.y = i === 2 ? -Math.PI / 2 : Math.PI / 2;
        g.add(resident); residents.push(resident);
        var ring = stopMarker(['parsonage', 'lantern', 'orchard'][i]);
        ring.position.set(0, 0.07, p[1]); g.add(ring); rings.push(ring);
      });
      for (var i = 0; i < 24; i++) {
        var tr = new T.Group(); tr.position.set((i % 2 ? -1 : 1) * (15 + i % 4 * 2), 0, i * 2.2 - 2);
        var trunk = mesh(new T.CylinderGeometry(0.25, 0.35, 2, 5), mat(0x4b3621)); trunk.position.y = 1; tr.add(trunk);
        var crown = mesh(new T.ConeGeometry(2.3, 6, 6), mat(0x304638)); crown.position.y = 4.5; tr.add(crown); g.add(tr);
      }
      var horse = new T.Group(), legs = [];
      [[0.8, 0.9, 2.2, 0, 1.5, 0], [0.45, 1.1, 0.5, 0, 2.1, -1.05], [0.38, 0.4, 0.8, 0, 2.55, -1.45]].forEach(function (b) {
        var part = mesh(new T.BoxGeometry(b[0], b[1], b[2]), mat(0x674c37)); part.position.set(b[3], b[4], b[5]); horse.add(part);
      });
      [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]].forEach(function (p) {
        var leg = mesh(G.leg, mat(0x40312b)); leg.scale.set(1.3, 1.4, 1.3); leg.position.set(p[0], 1.1, p[1]); horse.add(leg); legs.push(leg);
      });
      var eli = person({ coat: 0xd9af55, pants: 0x45516a, hat: 'round', hatColor: 0x826547 });
      eli.scale.setScalar(0.8); eli.position.y = 1.2; eli.rotation.y = Math.PI;
      eli.userData.legs.forEach(function (leg) { leg.rotation.x = -1.2; }); horse.add(eli); g.add(horse);
      return { scene: scene, horse: horse, legs: legs, rings: rings };
    }

    // WL-S2 reuses the Green before the arrival. No replay or firing API is invoked.
    function makeDawn(lex, stops) {
      lex.poseCutscene(0);
      lex.regs.forEach(function (r) { r.visible = false; }); lex.horse.visible = false;
      var g = new T.Group(); lex.scene.add(g);
      var rings = [];
      stops.forEach(function (s) {
        var ring = stopMarker(s.id);
        ring.position.set(s.x, 0.12, s.z); g.add(ring); rings.push(ring);
        var label = labelSprite(s.name, s.id, ring); label.position.set(s.x, 2.4, s.z); g.add(label);
        if (['parker', 'militia', 'town'].includes(s.id)) {
          var p = person({ coat: s.id === 'parker' ? 0x4a667b : 0x977870, pants: 0x6c6558, hat: 'round', hatColor: 0x292e39 });
          p.position.set(s.x, 0.05, s.z + 1.7); p.rotation.y = Math.PI; g.add(p);
        }
      });
      var eli = person({ coat: 0xd9af55, pants: 0x45516a, hat: 'round', hatColor: 0x826547 });
      eli.scale.setScalar(0.8); g.add(eli);
      var edge = mesh(new T.BoxGeometry(26, 0.06, 0.18), mat(0xffd18b), false);
      edge.position.set(0, 0.1, -16); g.add(edge);
      g.visible = false;
      return { scene: lex.scene, group: g, eli: eli, rings: rings,
        pose: function (x, z, dx, dz, time) {
          eli.position.set(x, 0.05, z);
          if (dx || dz) { eli.rotation.y = Math.atan2(dx, dz); walkLegs(eli, time, 9); }
          else standLegs(eli);
        } };
    }

    // WL-S3 uses no shooter plan or firing events. The pivot has no origin to reveal.
    function makeGreen(lex, stops) {
      var walkers = makeDawn(lex, stops), blocker = mesh(new T.BoxGeometry(12, 8, 1), mat(0x73533d));
      walkers.group.add(blocker); blocker.visible = false;
      return { group: walkers.group,
        pose: function (x, z, dx, dz, time, phase, t, spot, yaw) {
          lex.poseCutscene(phase === 'green-event' ? Math.min(23, 14 + t * 1.5) : 14);
          lex.regs.forEach(function (r) { r.visible = true; });
          lex.horse.visible = phase === 'green-event' && t >= 3;
          if (lex.horse.visible) lex.horse.position.z = lerp(22, 6.6, ease(clamp01((t - 3) / 3)));
          lex.hidden.visible = false; lex.ring.visible = false;
          Object.keys(lex.markers).forEach(function (k) { lex.markers[k].visible = false; });
          lex.fx.clear(); lex.militia.forEach(function (m) { m.visible = true; }); walkers.pose(x, z, dx, dz, time);
          walkers.rings.forEach(function (r, i) { r.visible = phase === 'shelter' ? stops[i].id === 'shelter' : phase === 'green'; });
          // Hide destination labels during observation so they cannot float through the obstruction.
          // The shelter label waits for the shelter step so it never reads as a choice at the spot-choosing step.
          walkers.group.children.forEach(function (c) {
            if (c.isSprite) c.visible = phase === 'shelter' ? c.userData.label.id === 'shelter' : phase === 'green' && c.userData.label.id !== 'shelter';
          });
          blocker.visible = phase === 'green-event' && t >= 6 && t < 10;
          if (phase === 'green-event') {
            time = t;
            var px = spot === 'corner' ? 18 : 10;
            cam.position.set(px, 1.9, -14); cam.lookAt(0, 1.8, 5);
            blocker.position.set(px - 0.9, 3, -12); blocker.rotation.y = -Math.atan2(px, 19);
            walkers.eli.visible = false;
            if (t >= 10) {
              var k = Math.min(1, (t - 10) / 5);
              lex.militia.forEach(function (m, i) { m.position.x += k * (i % 2 ? 6 : -6); m.position.z -= k * 8; walkLegs(m, time, 10); });
              lex.regs.forEach(function (r) { if (r.userData.adv) { r.position.z -= k * 4; walkLegs(r, time, 10); } });
              // Diffuse aftermath smoke has no first-shot muzzle, flash, direction, or identity.
              // No localized cloud that could suggest which line fired first.
            }
            lex.militia.forEach(function (m) { m.visible = m.position.distanceTo(cam.position) >= 2.5; });
          } else {
            walkers.eli.visible = !['study', 'hypothesis', 'essay', 'finished'].includes(phase);
            cam.position.set(x + Math.sin(yaw) * 10, 8, z + Math.cos(yaw) * 10); cam.lookAt(x, 1, z + 3);
            if (phase !== 'green') {
              lex.militia.forEach(function (m) { m.position.z -= 8; });
              lex.regs.forEach(function (r) { if (r.userData.adv) r.position.z -= 4; });
            }
          }
        }
      };
    }

    // ---------- cameras, picking ----------
    var cam = new T.PerspectiveCamera(50, 1, 0.1, 600), camB = new T.PerspectiveCamera(50, 1, 0.1, 600);
    var controls = new T.OrbitControls(cam, cv);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 6; controls.maxDistance = 70; controls.maxPolarAngle = Math.PI * 0.47;
    controls.enabled = false;
    var ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
    function pickGround(clientX, clientY) {
      var r = cv.getBoundingClientRect(); ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); return ray.ray.intersectPlane(ground, hit) ? { x: hit.x, z: hit.z } : null;
    }
    function project(v3, camera, w, h, out) { var p = v3.clone().project(camera || cam); out = out || {}; out.x = (p.x + 1) / 2 * w; out.y = (1 - p.y) / 2 * h; out.vis = p.z < 1; return out; }

    var world = {
      renderer: renderer, canvas: cv, cam: cam, camB: camB, controls: controls,
      makeLex: makeLex, makeNight: makeNight, makeDawn: makeDawn, makeGreen: makeGreen, LINE: LINE, head: head, snap: snap, zonePoint: zonePoint,
      globe: { scene: gScene, cam: gCam, place: placeGlobe, ensure: ensureEarthMap, paintMs: function () { return globePaintMs; }, fmtYear: fmtYear },
      pickGround: pickGround, project: project, ease: ease, clamp01: clamp01, lerp: lerp, V3: T.Vector3,
      labelAvoid: null, labelFocus: [], labelBoxes: []
    };
    return world;
  }
  window.WGWorld = { create: create };
})();
