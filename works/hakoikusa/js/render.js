/* =========================================================
   ハコイクサ — 3D表示（three.js r128）
   正投影の斜め見下ろし。箱・ピース・札（バッジ）・効果範囲・
   置く前の影・戦いの演出をここで描く。
   ========================================================= */
(function (G) {
  'use strict';
  const HK = G.HK;
  const { DEF, RAR } = HK.data;
  const RU = HK.rules;
  const V = HK.view = {};

  const PITCH = 0.64;           // 見下ろしの角度（ラジアン）
  const INSET = 0.05;           // ピースどうしのすき間
  const BAND = 0.052;           // 輪郭線の太さ（ワールド単位）
  const BADGE = 0.62;

  let renderer, scene, camera, raycaster, clock;
  let canvas, W = 1, H = 1, rect = null;
  const cam = { yaw: Math.PI / 4, yawTo: Math.PI / 4, spin: 0, target: new THREE.Vector3(0, 1, 0), targetTo: new THREE.Vector3(0, 1, 0), scale: 0.02, scaleTo: 0.02, shake: 0 };
  let mode = 'shop';
  const sides = [];
  const frameCbs = [];
  let slice = 0;
  let time = 0;

  const hexv = (h) => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); };
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  /* ---------------- シェーダ ---------------- */
  const PIECE_VS = `
    attribute vec4 aD;
    varying vec3 vN; varying vec3 vW; varying vec4 vD;
    void main(){
      vN = normalize(mat3(modelMatrix) * normal);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz; vD = aD;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const PIECE_FS = `
    precision highp float;
    uniform vec3 uColor; uniform vec3 uLight; uniform vec3 uTint; uniform vec3 uOrigin;
    uniform float uTintAmt; uniform float uFlash; uniform float uFill; uniform float uFillOn;
    uniform float uYMin; uniform float uYMax; uniform float uClipY; uniform float uAlpha; uniform float uStun; uniform float uDim;
    varying vec3 vN; varying vec3 vW; varying vec4 vD;
    void main(){
      vec3 n = normalize(vN);
      float band = ${BAND.toFixed(3)};
      float e = 0.0;
      e = max(e, 1.0 - smoothstep(band * 0.5, band, vD.x));
      e = max(e, 1.0 - smoothstep(band * 0.5, band, vD.y));
      e = max(e, 1.0 - smoothstep(band * 0.5, band, vD.z));
      e = max(e, 1.0 - smoothstep(band * 0.5, band, vD.w));
      if (vW.y > uClipY) {
        if (e < 0.45) discard;
        gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.45), 1.0);
        return;
      }
      float l = max(dot(n, uLight), 0.0);
      float shade = 0.54 + 0.48 * l;
      vec3 lp = vW - uOrigin;
      vec3 f = abs(fract(lp + 0.5) - 0.5);
      float seam = 0.0;
      if (abs(n.y) < 0.5) seam = max(seam, 1.0 - smoothstep(0.0, 0.025, f.y));
      if (abs(n.x) < 0.5) seam = max(seam, 1.0 - smoothstep(0.0, 0.025, f.x));
      if (abs(n.z) < 0.5) seam = max(seam, 1.0 - smoothstep(0.0, 0.025, f.z));
      vec3 col = uColor * shade;
      col *= 1.0 - seam * 0.16;
      if (abs(n.y) < 0.5) col *= 0.9 + 0.1 * smoothstep(0.0, 0.5, fract(lp.y));
      if (uFillOn > 0.5) {
        float fy = mix(uYMin, uYMax, uFill);
        float lit = step(vW.y, fy);
        col = mix(col * 0.66, col * 1.06, lit);
        float line = 1.0 - smoothstep(0.0, 0.035, abs(vW.y - fy));
        col = mix(col, vec3(1.0, 0.95, 0.78), line * 0.85 * step(0.01, uFill) * step(uFill, 0.99));
      }
      col = mix(col, vec3(0.62, 0.7, 0.92), uStun * 0.6);
      col = mix(col, uTint, uTintAmt);
      col = mix(col, vec3(1.0, 0.98, 0.9), uFlash);
      col = mix(col, vec3(0.86, 0.83, 0.78), uDim);
      col = mix(col, vec3(0.15, 0.12, 0.1), e * 0.92);
      gl_FragColor = vec4(col, uAlpha);
    }`;
  const BADGE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const BADGE_FS = `
    precision highp float;
    uniform sampler2D map; uniform float uProg; uniform float uOn; uniform float uFlash; uniform float uDim; uniform float uStun;
    varying vec2 vUv;
    void main(){
      vec2 p = vUv * 2.0 - 1.0; float r = length(p);
      vec4 col = texture2D(map, vUv);
      if (uOn > 0.5) {
        float a = atan(p.x, p.y); a = a < 0.0 ? a + 6.2831853 : a; a /= 6.2831853;
        float ring = smoothstep(0.78, 0.82, r) * (1.0 - smoothstep(0.97, 1.0, r));
        vec3 rc = a <= uProg ? vec3(1.0, 0.83, 0.28) : vec3(0.2, 0.17, 0.14);
        if (uStun > 0.5) rc = vec3(0.55, 0.65, 1.0);
        col.rgb = mix(col.rgb, rc, ring);
        col.a = max(col.a, ring);
      }
      col.rgb = mix(col.rgb, vec3(1.0), uFlash * 0.75);
      col.a *= uDim;
      if (col.a < 0.02) discard;
      gl_FragColor = col;
    }`;

  function pieceMat(color, opts) {
    opts = opts || {};
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: hexv(color) }, uLight: { value: new THREE.Vector3(0, 1, 0) }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uOrigin: { value: new THREE.Vector3() }, uTintAmt: { value: 0 }, uFlash: { value: 0 }, uFill: { value: 0 }, uFillOn: { value: 0 },
        uYMin: { value: 0 }, uYMax: { value: 1 }, uClipY: { value: 999 }, uAlpha: { value: opts.alpha == null ? 1 : opts.alpha }, uStun: { value: 0 }, uDim: { value: 0 },
      },
      vertexShader: PIECE_VS, fragmentShader: PIECE_FS,
      transparent: !!opts.transparent, depthWrite: !opts.transparent,
    });
  }

  /* ---------------- ピースの形（つなぎ目のない多面体） ---------------- */
  const FACES = [
    { d: [1, 0, 0], t1: [0, 1, 0], t2: [0, 0, 1] },
    { d: [-1, 0, 0], t1: [0, 0, 1], t2: [0, 1, 0] },
    { d: [0, 1, 0], t1: [0, 0, 1], t2: [1, 0, 0] },
    { d: [0, -1, 0], t1: [1, 0, 0], t2: [0, 0, 1] },
    { d: [0, 0, 1], t1: [1, 0, 0], t2: [0, 1, 0] },
    { d: [0, 0, -1], t1: [0, 1, 0], t2: [1, 0, 0] },
  ];
  /* cells は箱の中の座標。center を原点にした形をつくる。 */
  function pieceGeo(cells, center) {
    const set = new Set(cells.map((c) => c.join(',')));
    const has = (x, y, z) => set.has(x + ',' + y + ',' + z);
    const pos = [], nor = [], ad = [], ind = [];
    let vi = 0;
    for (const c of cells) {
      for (const F of FACES) {
        const { d, t1, t2 } = F;
        if (has(c[0] + d[0], c[1] + d[1], c[2] + d[2])) continue;
        const ext = (t, s) => {
          const m = [c[0] + t[0] * s, c[1] + t[1] * s, c[2] + t[2] * s];
          if (!has(...m)) return [0.5 - INSET, true];
          if (has(m[0] + d[0], m[1] + d[1], m[2] + d[2])) return [0.5 + INSET, true];
          return [0.5, false];
        };
        const [a1n, o1n] = ext(t1, -1), [a1p, o1p] = ext(t1, 1), [a2n, o2n] = ext(t2, -1), [a2p, o2p] = ext(t2, 1);
        const base = [c[0] + 0.5 - center[0] + d[0] * (0.5 - INSET), c[1] + 0.5 - center[1] + d[1] * (0.5 - INSET), c[2] + 0.5 - center[2] + d[2] * (0.5 - INSET)];
        const w1 = a1n + a1p, w2 = a2n + a2p;
        const corners = [[-a1n, -a2n], [a1p, -a2n], [a1p, a2p], [-a1n, a2p]];
        for (const [u, v] of corners) {
          pos.push(base[0] + t1[0] * u + t2[0] * v, base[1] + t1[1] * u + t2[1] * v, base[2] + t1[2] * u + t2[2] * v);
          nor.push(d[0], d[1], d[2]);
          const du0 = u + a1n, du1 = a1p - u, dv0 = v + a2n, dv1 = a2p - v;
          ad.push(o1n ? du0 : 9 + du0, o1p ? du1 : 9 + du1, o2n ? dv0 : 9 + dv0, o2p ? dv1 : 9 + dv1);
        }
        ind.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        vi += 4;
        void w1; void w2;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(ad, 4));
    g.setIndex(ind);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  function centroid(cells) {
    let x = 0, y = 0, z = 0;
    for (const c of cells) { x += c[0] + 0.5; y += c[1] + 0.5; z += c[2] + 0.5; }
    return [x / cells.length, y / cells.length, z / cells.length];
  }
  function topAnchor(cells) {
    const set = new Set(cells.map((c) => c.join(',')));
    const tops = cells.filter((c) => !set.has(c[0] + ',' + (c[1] + 1) + ',' + c[2]));
    let maxY = -1; for (const c of tops) maxY = Math.max(maxY, c[1]);
    const hi = tops.filter((c) => c[1] === maxY);
    let x = 0, z = 0; for (const c of hi) { x += c[0] + 0.5; z += c[2] + 0.5; }
    return [x / hi.length, maxY + 1, z / hi.length];
  }

  /* ---------------- 札（バッジ）の絵 ---------------- */
  const badgeTex = {};
  function makeBadgeTex(id) {
    if (badgeTex[id]) return badgeTex[id];
    const d = DEF[id], s = 128, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const g = cv.getContext('2d');
    const col = new THREE.Color(d.color);
    const light = col.clone().lerp(new THREE.Color('#ffffff'), 0.18).getStyle();
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.49, 0, Math.PI * 2); g.fillStyle = '#2a211b'; g.fill();
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2); g.fillStyle = RAR[d.rar].color; g.fill();
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.385, 0, Math.PI * 2); g.fillStyle = light; g.fill();
    g.font = `400 ${Math.round(s * 0.46)}px "Dela Gothic One", "Hiragino Kaku Gothic ProN", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = s * 0.07; g.strokeStyle = '#2a211b';
    g.strokeText(d.mark, s / 2, s / 2 + s * 0.03);
    g.fillStyle = '#fffaf0'; g.fillText(d.mark, s / 2, s / 2 + s * 0.03);
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 4;
    badgeTex[id] = t;
    return t;
  }
  function badgeMat(id) {
    return new THREE.ShaderMaterial({
      uniforms: { map: { value: makeBadgeTex(id) }, uProg: { value: 0 }, uOn: { value: 0 }, uFlash: { value: 0 }, uDim: { value: 1 }, uStun: { value: 0 } },
      vertexShader: BADGE_VS, fragmentShader: BADGE_FS, transparent: true, depthTest: false, depthWrite: false,
    });
  }
  const badgeGeo = new THREE.PlaneGeometry(1, 1);

  function textTex(txt, opts) {
    opts = opts || {};
    const s = opts.size || 128, cv = document.createElement('canvas');
    cv.width = s * (opts.wide || 1); cv.height = s;
    const g = cv.getContext('2d');
    if (opts.bg) { g.beginPath(); g.arc(cv.width / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.fillStyle = opts.bg; g.fill(); if (opts.ring) { g.lineWidth = s * 0.06; g.strokeStyle = opts.ring; g.stroke(); } }
    g.font = `${opts.weight || 400} ${Math.round(s * (opts.fs || 0.56))}px ${opts.font || '"Dela Gothic One", sans-serif'}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (opts.stroke) { g.lineJoin = 'round'; g.lineWidth = s * 0.08; g.strokeStyle = opts.stroke; g.strokeText(txt, cv.width / 2, s / 2 + s * 0.04); }
    g.fillStyle = opts.color || '#2a211b'; g.fillText(txt, cv.width / 2, s / 2 + s * 0.04);
    const t = new THREE.CanvasTexture(cv);
    return t;
  }

  /* ---------------- 箱（一つの陣） ---------------- */
  function makeSide(si) {
    const root = new THREE.Group();
    scene.add(root);
    const S = { si, root, frame: new THREE.Group(), piecesG: new THREE.Group(), badgesG: new THREE.Group(), fxG: new THREE.Group(), box: null, meshes: new Map(), walls: [], dims: null, pos: new THREE.Vector3(), posTo: new THREE.Vector3(), visible: true, crest: null, crestAnim: { flash: 0, shake: 0 }, school: null, stunned: new Set(), charge: new Map() };
    root.add(S.frame, S.piecesG, S.badgesG, S.fxG);
    return S;
  }
  function buildFrame(S, W_, D_, H_, tone) {
    S.frame.clear();
    S.walls = [];
    const wood = tone === 'enemy' ? '#6d5a4a' : '#b98d5c';
    const floorC = tone === 'enemy' ? '#8e7a66' : '#dcc39b';
    const lineC = tone === 'enemy' ? 0x4b3d31 : 0x9c7b52;
    // 床
    const slab = new THREE.Mesh(pieceGeo([[0, 0, 0]].flatMap(() => { const a = []; for (let x = 0; x < W_; x++) for (let z = 0; z < D_; z++) a.push([x, 0, z]); return a; }), [W_ / 2, 0.5, D_ / 2]), pieceMat(floorC));
    slab.scale.set(1 + 0.24 / W_, 0.16, 1 + 0.24 / D_);
    slab.position.set(0, -0.09, 0);
    slab.material.uniforms.uLight.value = V._light;
    S.frame.add(slab);
    S.slab = slab;
    // 床の目
    const pts = [];
    for (let x = 0; x <= W_; x++) pts.push(x - W_ / 2, 0.003, -D_ / 2, x - W_ / 2, 0.003, D_ / 2);
    for (let z = 0; z <= D_; z++) pts.push(-W_ / 2, 0.003, z - D_ / 2, W_ / 2, 0.003, z - D_ / 2);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    S.frame.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: lineC, transparent: true, opacity: 0.75 })));
    // 壁（奥の2面だけ見せる）
    const mk = (nx, nz) => {
      const g = new THREE.Group();
      const len = nx ? D_ : W_;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(len, H_), new THREE.MeshBasicMaterial({ color: tone === 'enemy' ? 0x3e342c : 0xfff8ea, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
      plane.position.y = H_ / 2;
      g.add(plane);
      const p2 = [];
      for (let i = 0; i <= len; i++) p2.push(i - len / 2, 0, 0, i - len / 2, H_, 0);
      for (let y = 1; y <= H_; y++) p2.push(-len / 2, y, 0, len / 2, y, 0);
      const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3));
      const lines = new THREE.LineSegments(g2, new THREE.LineBasicMaterial({ color: lineC, transparent: true, opacity: 0.5, depthWrite: false }));
      g.add(lines);
      if (nx) { g.rotation.y = Math.PI / 2; g.position.x = nx * W_ / 2; } else { g.position.z = nz * D_ / 2; }
      g.userData = { n: new THREE.Vector3(nx, 0, nz), op: 0, plane, lines };
      S.frame.add(g);
      S.walls.push(g);
    };
    mk(-1, 0); mk(1, 0); mk(0, -1); mk(0, 1);
    // 柱（四隅）と上のふち
    const post = new THREE.BoxGeometry(0.07, H_ + 0.08, 0.07);
    const pm = new THREE.MeshBasicMaterial({ color: new THREE.Color(wood) });
    S.posts = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const m = new THREE.Mesh(post, pm.clone());
      m.material.transparent = true;
      m.position.set(sx * W_ / 2, (H_ + 0.08) / 2 - 0.04, sz * D_ / 2);
      m.userData = { sx, sz };
      S.frame.add(m); S.posts.push(m);
    }
    const rim = [];
    rim.push(-W_ / 2, H_, -D_ / 2, W_ / 2, H_, -D_ / 2, W_ / 2, H_, -D_ / 2, W_ / 2, H_, D_ / 2, W_ / 2, H_, D_ / 2, -W_ / 2, H_, D_ / 2, -W_ / 2, H_, D_ / 2, -W_ / 2, H_, -D_ / 2);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rim, 3));
    const rimL = new THREE.LineSegments(rg, new THREE.LineDashedMaterial({ color: lineC, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.9 }));
    rimL.computeLineDistances();
    S.frame.add(rimL);
    // 段の番号（高いほど効き目が上がる／そろった段は金色）
    S.levelTags = [];
    for (let y = 0; y < H_; y++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: levelTex(y, false, tone === 'enemy'), transparent: true, depthTest: false }));
      sp.scale.set(0.56, 0.56, 1);
      sp.userData.y = y + 0.5;
      sp.userData.key = y + '|0';
      sp.renderOrder = 22;
      S.frame.add(sp);
      S.levelTags.push(sp);
    }
    S.rims = null;
    S.dims = [W_, D_, H_];
  }

  const levelCache = {};
  function levelTex(y, full, enemy) {
    const k = y + '|' + (full ? 1 : 0) + '|' + (enemy ? 1 : 0);
    if (levelCache[k]) return levelCache[k];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (full) { g.beginPath(); g.arc(64, 50, 38, 0, Math.PI * 2); g.fillStyle = '#E8B64A'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#2a211b'; g.stroke(); }
    g.font = '400 54px "Dela Gothic One", sans-serif';
    g.fillStyle = full ? '#2a211b' : enemy ? '#e9dccb' : '#6b5238';
    g.fillText(String(y + 1), 64, 54);
    if (y > 0) {
      g.font = '900 30px "Zen Kaku Gothic New", sans-serif';
      g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = enemy ? '#3a2f26' : '#fbf5ea'; g.strokeText('+' + y * 10 + '%', 64, 108);
      g.fillStyle = enemy ? '#f0c878' : '#b8582a'; g.fillText('+' + y * 10 + '%', 64, 108);
    }
    return (levelCache[k] = new THREE.CanvasTexture(cv));
  }
  /* そろった段：金の枠。flash に入っている段は光らせる */
  const layerFlashes = [];
  V.setLevels = function (si, full, flash) {
    const S = sides[si];
    if (!S.levelTags || !S.dims) return;
    const set = new Set(full || []);
    const [W_, D_] = S.dims;
    S.levelTags.forEach((sp, y) => {
      const k = y + '|' + (set.has(y) ? 1 : 0);
      if (sp.userData.key !== k) { sp.material.map = levelTex(y, set.has(y), si === 1); sp.material.needsUpdate = true; sp.userData.key = k; }
    });
    if (S.rims) { S.frame.remove(S.rims); S.rims.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); S.rims = null; }
    if (set.size) {
      const g = new THREE.Group();
      const pts = [];
      const x0 = -W_ / 2 - 0.04, x1 = W_ / 2 + 0.04, z0 = -D_ / 2 - 0.04, z1 = D_ / 2 + 0.04;
      for (const y of set) for (const h of [y + 0.01, y + 0.99]) pts.push(x0, h, z0, x1, h, z0, x1, h, z0, x1, h, z1, x1, h, z1, x0, h, z1, x0, h, z1, x0, h, z0);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xE8B64A, transparent: true, opacity: 0.95, depthTest: false })));
      for (const y of set) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(W_ + 0.06, 0.98, D_ + 0.06), new THREE.MeshBasicMaterial({ color: 0xFFD66B, transparent: true, opacity: 0.07, depthWrite: false }));
        m.position.y = y + 0.5;
        g.add(m);
      }
      S.rims = g;
      S.frame.add(g);
    }
    for (const y of flash || []) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(W_ + 0.12, 1, D_ + 0.12), new THREE.MeshBasicMaterial({ color: 0xFFE39A, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.y = y + 0.5;
      S.root.add(m);
      layerFlashes.push({ m, S, t: 0 });
      for (let i = 0; i < 16; i++) spark(S.root.localToWorld(new THREE.Vector3((Math.random() - 0.5) * W_, y + 1, (Math.random() - 0.5) * D_)), 0xffd98a, 1, { speed: 1.2, up: 2.5, top: true, add: true, life: 0.8 });
    }
  };

  /* ---------------- ピースのメッシュ ---------------- */
  function makePieceMesh(S, p) {
    const d = DEF[p.id];
    const ctr = centroid(p.cells);
    const geo = pieceGeo(p.cells, ctr);
    const mat = pieceMat(d.color);
    mat.uniforms.uLight.value = V._light;
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);
    const bm = badgeMat(p.id);
    const badge = new THREE.Mesh(badgeGeo, bm);
    badge.renderOrder = 20;
    badge.scale.setScalar(BADGE);
    S.badgesG.add(badge);
    S.piecesG.add(group);
    const [W_, D_] = S.dims;
    const a = topAnchor(p.cells);
    const M = {
      uid: p.uid, id: p.id, cells: p.cells.map((c) => c.slice()), key: p.id + '|' + p.cells.map((c) => c.join(',')).join(';'),
      group, mesh, mat, badge, bm,
      base: new THREE.Vector3(ctr[0] - W_ / 2, ctr[1], ctr[2] - D_ / 2),
      anchor: new THREE.Vector3(a[0] - W_ / 2, a[1] + 0.12, a[2] - D_ / 2),
      yMin: Math.min(...p.cells.map((c) => c[1])), yMax: Math.max(...p.cells.map((c) => c[1])) + 1,
      dy: 0, vy: 0, pop: 0, flash: 0, tint: 0, tintTo: 0, tintCol: new THREE.Vector3(1, 1, 1), wob: 0, occl: false, dimTo: 0, dim: 0, fly: null, gone: false,
      shake: 0, hideBadge: false,
    };
    mesh.userData.M = M;
    mesh.userData.side = S.si;
    group.position.copy(M.base);
    return M;
  }
  function disposeMesh(S, M) {
    S.piecesG.remove(M.group);
    S.badgesG.remove(M.badge);
    M.mesh.geometry.dispose();
    M.mat.dispose();
    M.bm.dispose();
  }

  /* 箱の中身をそろえる。info: { drops:{uid:段数}, placed: uid, from:{uid:[dx,dy,dz]} } */
  V.syncBox = function (si, box, info) {
    info = info || {};
    const S = sides[si];
    const tone = si === 1 ? 'enemy' : 'player';
    if (!S.dims || S.dims[0] !== box.W || S.dims[1] !== box.D || S.dims[2] !== box.H) {
      buildFrame(S, box.W, box.D, box.H, tone);
      for (const M of S.meshes.values()) disposeMesh(S, M);
      S.meshes.clear();
      V.fit(true);
    }
    S.box = box;
    const keep = new Set();
    for (const p of box.pieces) {
      keep.add(p.uid);
      const key = p.id + '|' + p.cells.map((c) => c.join(',')).join(';');
      let M = S.meshes.get(p.uid);
      if (M && M.key === key) continue;
      const old = M;
      if (old) disposeMesh(S, old);
      M = makePieceMesh(S, p);
      S.meshes.set(p.uid, M);
      if (info.drops && info.drops[p.uid]) { M.dy = info.drops[p.uid]; M.vy = 0; }
      else if (info.placed === p.uid) { M.dy = info.lift != null ? info.lift : 0.55; M.vy = -1; }
      else if (info.merged && info.merged.includes(p.uid)) { M.pop = 1; M.flash = 1; }
      else if (info.intro) { M.dy = 3 + (M.base.y) * 0.8 + Math.random() * 1.2; M.vy = 0; M.delay = info.intro * Math.random(); }
    }
    for (const [uid, M] of S.meshes) if (!keep.has(uid)) { disposeMesh(S, M); S.meshes.delete(uid); }
    V._occlDirty = true;
  };
  V.clearBox = function (si) {
    const S = sides[si];
    for (const M of S.meshes.values()) disposeMesh(S, M);
    S.meshes.clear();
    S.box = null;
  };
  V.mesh = (si, uid) => sides[si] && sides[si].meshes.get(uid);

  /* ---------------- 置く前の影（ゴースト） ---------------- */
  let ghost = null;
  V.setGhost = function (id, cells, ok, extra) {
    const S = sides[0];
    const key = id + '|' + cells.map((c) => c.join(',')).join(';') + '|' + ok;
    if (ghost && ghost.key === key) return;
    const prevPos = ghost ? ghost.group.position.clone() : null;
    V.clearGhost();
    const ctr = centroid(cells);
    const [W_, D_] = S.dims;
    const mat = pieceMat(ok ? DEF[id].color : '#d8452f', { transparent: true, alpha: ok ? 0.62 : 0.5 });
    mat.uniforms.uLight.value = V._light;
    const mesh = new THREE.Mesh(pieceGeo(cells, ctr), mat);
    mesh.renderOrder = 5;
    const group = new THREE.Group();
    group.add(mesh);
    const target = new THREE.Vector3(ctr[0] - W_ / 2, ctr[1], ctr[2] - D_ / 2);
    group.position.copy(prevPos || target);
    // 落ちる先を示す柱と床の影
    const set = new Set(cells.map((c) => c[0] + ',' + c[2]));
    const lows = {};
    for (const c of cells) { const k = c[0] + ',' + c[2]; if (lows[k] == null || c[1] < lows[k]) lows[k] = c[1]; }
    const shadow = new THREE.Group();
    const smat = new THREE.MeshBasicMaterial({ color: ok ? 0x2a211b : 0xd8452f, transparent: true, opacity: ok ? 0.22 : 0.3, depthWrite: false });
    for (const k of set) {
      const [x, z] = k.split(',').map(Number);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), smat);
      q.rotation.x = -Math.PI / 2;
      q.position.set(x + 0.5 - W_ / 2, lows[k] + 0.012, z + 0.5 - D_ / 2);
      shadow.add(q);
    }
    S.root.add(group, shadow);
    ghost = { key, group, mesh, mat, target, shadow, id, cells, ok };
    if (extra && extra.snap) group.position.copy(target);
  };
  V.clearGhost = function () {
    if (!ghost) return;
    ghost.group.parent.remove(ghost.group);
    ghost.shadow.parent.remove(ghost.shadow);
    ghost.mesh.geometry.dispose(); ghost.mat.dispose();
    ghost = null;
  };

  /* ---------------- 効果範囲の表示 ---------------- */
  const RANGE_COL = { up: 0xf08a3c, down: 0x3f8fd6, adj: 0x4fb06a, side: 0xd9b23a, col: 0x8c62d6, layer: 0xd9b23a, gear: 0xd9b23a, self: 0x999999 };
  const rangePool = [];
  let rangeUsed = 0;
  const rangeGeo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
  const rangeEdge = new THREE.EdgesGeometry(rangeGeo);
  const arrowTex = {};
  V.setRange = function (list) {
    // list: [{cells:[[x,y,z]], kind}]
    const S = sides[0];
    rangeUsed = 0;
    const [W_, D_] = S.dims;
    const seen = new Set();
    for (const r of list) {
      for (const c of r.cells) {
        const k = c.join(',') + r.kind;
        if (seen.has(k)) continue;
        seen.add(k);
        let o = rangePool[rangeUsed];
        if (!o) {
          const m = new THREE.Mesh(rangeGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2, depthWrite: false, color: 0xffffff }));
          const e = new THREE.LineSegments(rangeEdge, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85, color: 0xffffff, depthWrite: false }));
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
          sp.scale.set(0.34, 0.34, 1);
          m.add(e); m.add(sp);
          m.renderOrder = 6;
          o = { m, e, sp };
          rangePool.push(o);
        }
        o.m.material.color.setHex(RANGE_COL[r.kind] || 0xffffff);
        o.e.material.color.setHex(RANGE_COL[r.kind] || 0xffffff);
        const glyph = r.kind === 'up' ? '↑' : r.kind === 'down' ? '↓' : r.kind === 'col' ? '↕' : r.kind === 'side' || r.kind === 'gear' ? '⇄' : r.kind === 'layer' ? '▭' : '◇';
        if (!arrowTex[glyph + r.kind]) arrowTex[glyph + r.kind] = textTex(glyph, { size: 64, fs: 0.72, color: '#fff', stroke: '#' + (RANGE_COL[r.kind] || 0xffffff).toString(16).padStart(6, '0'), font: '"Zen Kaku Gothic New", sans-serif', weight: 900 });
        o.sp.material.map = arrowTex[glyph + r.kind];
        o.sp.material.needsUpdate = true;
        o.m.position.set(c[0] + 0.5 - W_ / 2, c[1] + 0.5, c[2] + 0.5 - D_ / 2);
        o.m.userData.ph = (c[0] + c[1] * 2 + c[2]) * 0.35;
        if (!o.m.parent) S.root.add(o.m);
        o.m.visible = true;
        rangeUsed++;
      }
    }
    for (let i = rangeUsed; i < rangePool.length; i++) rangePool[i].m.visible = false;
  };
  V.clearRange = () => { for (const o of rangePool) o.m.visible = false; rangeUsed = 0; };

  /* ハイライト：{uid: 'to'|'from'|'neg'|'self'|'gear'} */
  const HL = { to: [0.36, 0.86, 0.5], from: [1.0, 0.8, 0.3], neg: [0.95, 0.3, 0.22], self: [1, 1, 1], gear: [1.0, 0.85, 0.35], sel: [1, 1, 1] };
  V.highlight = function (si, map) {
    const S = sides[si];
    for (const [uid, M] of S.meshes) {
      const k = map && map[uid];
      M.tintTo = k ? (k === 'self' ? 0.18 : 0.42) : 0;
      if (k) M.tintCol.set(...HL[k]);
    }
  };
  V.dimOthers = function (si, keepSet) {
    const S = sides[si];
    for (const [uid, M] of S.meshes) M.dimTo = keepSet && !keepSet.has(uid) ? 0.55 : 0;
  };

  /* ---------------- 浮かぶ文字（DOM） ---------------- */
  let labelLayer = null;
  const labels = [];
  V.setLabels = function (list) {
    // list: [{si, uid, html, cls}]
    while (labels.length > list.length) { const l = labels.pop(); l.el.remove(); }
    list.forEach((it, i) => {
      let l = labels[i];
      if (!l) { const el = document.createElement('div'); el.className = 'lbl'; labelLayer.appendChild(el); l = labels[i] = { el }; }
      if (l.html !== it.html) { l.el.innerHTML = it.html; l.html = it.html; }
      l.el.className = 'lbl ' + (it.cls || '');
      l.si = it.si; l.uid = it.uid; l.cell = it.cell;
    });
  };
  const tmpV = new THREE.Vector3();
  function project(v) {
    tmpV.copy(v).project(camera);
    return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H];
  }
  V.project = (si, local) => { const S = sides[si]; const w = local.clone(); S.root.localToWorld(w); return project(w); };
  V.badgeScreen = function (si, uid) {
    const S = sides[si], M = S && S.meshes.get(uid);
    if (!M) return null;
    return project(M.badge.getWorldPosition(new THREE.Vector3()));
  };
  V.crestScreen = function (si) { const S = sides[si]; if (!S.crest) return null; return project(S.crest.getWorldPosition(new THREE.Vector3())); };
  V.worldOfCell = function (si, c) { const S = sides[si]; const [W_, D_] = S.dims; const v = new THREE.Vector3(c[0] + 0.5 - W_ / 2, c[1] + 0.5, c[2] + 0.5 - D_ / 2); S.root.localToWorld(v); return v; };

  /* 数字などのポップ（DOM） */
  V.pop = function (x, y, html, cls) {
    const el = document.createElement('div');
    el.className = 'pop ' + (cls || '');
    el.innerHTML = html;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    labelLayer.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  };

  /* ---------------- 底の焼き印（箱がからっぽのときだけ見える） ---------------- */
  let floorMark = null;
  V.setFloorMark = function (lines) {
    const S = sides[0];
    if (floorMark) { S.root.remove(floorMark); floorMark.geometry.dispose(); floorMark.material.map.dispose(); floorMark.material.dispose(); floorMark = null; }
    if (!lines || !S.dims) return;
    const [W_, D_] = S.dims;
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
    const g = cv.getContext('2d');
    g.translate(256, 256); g.rotate(-0.05);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = 'rgba(92, 60, 30, .55)'; g.lineWidth = 6;
    g.beginPath(); g.arc(0, -8, 190, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(92, 60, 30, .72)';
    lines.forEach((t, i) => { g.font = `400 ${i === lines.length - 1 ? 30 : 44}px "Dela Gothic One", sans-serif`; g.fillText(t, 0, -60 + i * 64 + (i === lines.length - 1 ? 20 : 0)); });
    const tex = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W_, D_) * 0.9, Math.min(W_, D_) * 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    m.rotation.set(-Math.PI / 2, 0, Math.PI / 4 + (Math.round((cam.yawTo - Math.PI / 4) / (Math.PI / 2)) * Math.PI / 2));
    m.position.y = 0.006;
    m.renderOrder = 2;
    S.root.add(m);
    floorMark = m;
  };

  /* ---------------- 紋（相手の顔のかわり） ---------------- */
  V.setCrest = function (si, mark, color) {
    const S = sides[si];
    if (S.crest) { S.root.remove(S.crest); S.crest = null; }
    if (!mark) return;
    const t = textTex(mark, { size: 160, fs: 0.5, color: '#fffaf0', stroke: '#2a211b', bg: color, ring: '#2a211b' });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    sp.scale.set(1.05, 1.05, 1);
    sp.renderOrder = 25;
    S.crest = sp;
    S.root.add(sp);
  };
  V.crestHit = function (si, big) { const S = sides[si]; S.crestAnim.flash = 1; S.crestAnim.shake = big ? 1 : 0.6; };

  /* ---------------- 粒と弾 ---------------- */
  const parts = [];
  const dotTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
  function spark(pos, color, n, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, transparent: true, depthWrite: false, depthTest: !opts.top, blending: opts.add ? THREE.AdditiveBlending : THREE.NormalBlending }));
      const s = (opts.size || 0.16) * (0.6 + Math.random() * 0.8);
      sp.scale.set(s, s, 1);
      sp.position.copy(pos);
      sp.renderOrder = 30;
      const a = Math.random() * Math.PI * 2, u = Math.random();
      const sp0 = opts.speed || 2.2;
      sp.userData = { v: new THREE.Vector3(Math.cos(a) * sp0 * (0.4 + u), (opts.up || 1.5) * (0.5 + Math.random()), Math.sin(a) * sp0 * (0.4 + u)), life: (opts.life || 0.55) * (0.7 + Math.random() * 0.6), t: 0, g: opts.g == null ? 6 : opts.g, s };
      scene.add(sp);
      parts.push(sp);
    }
  }
  V.spark = spark;
  V.dust = function (si, uid) {
    const S = sides[si], M = S.meshes.get(uid);
    if (!M) return;
    const [W_, D_] = S.dims;
    for (const c of M.cells) {
      if (c[1] !== M.yMin) continue;
      const v = new THREE.Vector3(c[0] + 0.5 - W_ / 2, c[1] + 0.05, c[2] + 0.5 - D_ / 2);
      S.root.localToWorld(v);
      spark(v, 0xcdb58f, 3, { speed: 1.6, up: 0.6, life: 0.4, size: 0.2, g: 2 });
    }
  };
  const bullets = [];
  const bulletGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  V.shoot = function (from, to, color, dur, cb, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(bulletGeo, new THREE.MeshBasicMaterial({ color }));
    m.renderOrder = 28;
    m.material.depthTest = false;
    if (opts.size) m.scale.setScalar(opts.size);
    scene.add(m);
    const mid = from.clone().lerp(to, 0.5); mid.y += opts.arc == null ? 1.6 : opts.arc;
    bullets.push({ m, from: from.clone(), to: to.clone(), mid, t: 0, dur, cb, color, trail: 0 });
  };
  const bolts = [];
  V.bolt = function (si, col) {
    const S = sides[si];
    const [W_, , D_, H_] = [S.dims[0], 0, S.dims[1], S.dims[2]];
    const top = new THREE.Vector3(col[0] + 0.5 - W_ / 2, H_ + 4, col[1] + 0.5 - D_ / 2);
    const bot = new THREE.Vector3(col[0] + 0.5 - W_ / 2, 0.05, col[1] + 0.5 - D_ / 2);
    S.root.localToWorld(top); S.root.localToWorld(bot);
    const pts = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const p = top.clone().lerp(bot, i / n);
      if (i > 0 && i < n) { p.x += (Math.random() - 0.5) * 0.45; p.z += (Math.random() - 0.5) * 0.45; }
      pts.push(p);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf4ecff, transparent: true, depthTest: false }));
    l.renderOrder = 40;
    const l2 = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x9d7cff, transparent: true, depthTest: false }));
    l2.position.x = 0.03; l2.renderOrder = 39;
    // 柱の光
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.96, H_, 0.96), new THREE.MeshBasicMaterial({ color: 0xb49cff, transparent: true, opacity: 0.35, depthWrite: false }));
    beam.position.set(col[0] + 0.5 - W_ / 2, H_ / 2, col[1] + 0.5 - D_ / 2);
    S.root.add(beam);
    scene.add(l, l2);
    bolts.push({ l, l2, beam, S, t: 0 });
    spark(bot, 0xc9b6ff, 10, { add: true, speed: 3, up: 2, top: true });
  };

  /* ---------------- 散らばり（負けたとき） ---------------- */
  V.burst = function (si) {
    const S = sides[si];
    for (const M of S.meshes.values()) {
      const dir = M.base.clone(); dir.y = 0; if (dir.lengthSq() < 0.01) dir.set(Math.random() - 0.5, 0, Math.random() - 0.5); dir.normalize();
      M.fly = { v: new THREE.Vector3(dir.x * (2 + Math.random() * 3), 5 + Math.random() * 4, dir.z * (2 + Math.random() * 3)), w: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8), t: 0 };
      M.hideBadge = true;
    }
    spark(S.root.localToWorld(new THREE.Vector3(0, 1, 0)), 0xffd27a, 26, { speed: 5, up: 4, life: 0.9, size: 0.26 });
  };

  /* ---------------- カメラ ---------------- */
  V._light = new THREE.Vector3(0, 1, 0);
  function camBasis(yaw) {
    const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    return { back, right };
  }
  V.camRight = () => camBasis(cam.yaw).right;
  V.rotate = function (dir) { cam.yawTo += dir * Math.PI / 2; V._occlDirty = true; };
  V.yawIndex = () => ((Math.round((cam.yawTo - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4;
  /* 持っているピースを「倒す」ときの軸（画面の左右に近いほう） */
  V.tipAxis = function () {
    const r = camBasis(cam.yawTo).right;
    return Math.abs(r.x) >= Math.abs(r.z) ? ['x', Math.sign(r.x)] : ['z', Math.sign(r.z)];
  };
  V.setRect = function (r) { rect = r; V.fit(); };
  V.fit = function (instant) {
    if (!rect || !sides[0] || !sides[0].dims) return;
    // 見せたい範囲（箱＋少し上）
    const boxes = mode === 'battle' ? [0, 1] : [0];
    let minR = Infinity, maxR = -Infinity, minU = Infinity, maxU = -Infinity, midR = 0;
    const cy = Math.cos(PITCH), sy = Math.sin(PITCH);
    // 4方向どこから見ても大きさが変わらないように、最大をとる
    for (let k = 0; k < 4; k++) {
      const yaw = Math.PI / 4 + k * Math.PI / 2;
      const { back, right } = camBasis(yaw);
      const up = new THREE.Vector3(-back.x * sy, cy, -back.z * sy);
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
      for (const si of boxes) {
        const S = sides[si];
        if (!S.dims) continue;
        const [W_, D_, H_] = S.dims;
        const off = mode === 'battle' ? battleOffset(si, yaw) : new THREE.Vector3();
        for (const x of [-W_ / 2 - 0.2, W_ / 2 + 0.2]) for (const z of [-D_ / 2 - 0.2, D_ / 2 + 0.2]) for (const y of [-0.2, H_ + (mode === 'battle' ? 2.1 : 0.9)]) {
          const p = new THREE.Vector3(x, y, z).add(off);
          const pr = p.dot(right), pu = p.dot(up);
          a = Math.min(a, pr); b = Math.max(b, pr); c = Math.min(c, pu); d = Math.max(d, pu);
        }
      }
      minR = Math.min(minR, a - (a + b) / 2); maxR = Math.max(maxR, b - (a + b) / 2);
      minU = Math.min(minU, c); maxU = Math.max(maxU, d);
      midR = (a + b) / 2;
    }
    const ew = maxR - minR, eh = maxU - minU;
    const s = Math.max(ew / (rect.w * 0.9), eh / (rect.h * 0.86));
    cam.scaleTo = s;
    const midU = (maxU + minU) / 2;
    cam.midU = midU;
    cam.midR = midR;
    if (instant) { cam.scale = s; cam.target.copy(cam.targetTo); }
  };
  function battleOffset(si, yaw) {
    const { right, back } = camBasis(yaw);
    const S0 = sides[0].dims || [3, 3, 2], S1 = sides[1].dims || [3, 3, 2];
    if (rect && rect.h > rect.w * 1.15) {
      // 縦長の画面：相手を奥（上）、自分を手前（下）に
      const d0 = Math.max(S0[0], S0[1]) * 0.75 + 1.4 + S1[2] * 0.35, d1 = Math.max(S1[0], S1[1]) * 0.75 + 1.4 + S0[2] * 0.35;
      return si === 0 ? back.clone().multiplyScalar(d0) : back.clone().multiplyScalar(-d1);
    }
    const half0 = Math.max(S0[0], S0[1]) * 0.72 + 0.9, half1 = Math.max(S1[0], S1[1]) * 0.72 + 0.9;
    return si === 0 ? right.clone().multiplyScalar(-half0) : right.clone().multiplyScalar(half1);
  }
  function updateCamera(dt) {
    const k = 1 - Math.pow(0.0005, dt);
    if (mode === 'title' && !V.noSpin) cam.yawTo += dt * 0.25;
    cam.yaw += (cam.yawTo - cam.yaw) * Math.min(1, k * 1.25);
    cam.scale += (cam.scaleTo - cam.scale) * k;
    cam.target.lerp(cam.targetTo, k);
    const { back, right } = camBasis(cam.yaw);
    const cy = Math.cos(PITCH), sy = Math.sin(PITCH);
    const up = new THREE.Vector3(-back.x * sy, cy, -back.z * sy);
    const dir = new THREE.Vector3(back.x * cy, sy, back.z * cy);
    // 中心：見せたい範囲の中心が rect の中心にくるように
    cam.midRn = (cam.midRn || 0) + ((cam.midR || 0) - (cam.midRn || 0)) * k;
    const center = up.clone().multiplyScalar(cam.midU || 1).add(right.clone().multiplyScalar(cam.midRn));
    let shake = new THREE.Vector3();
    if (cam.shake > 0) { cam.shake = Math.max(0, cam.shake - dt * 3); shake = right.clone().multiplyScalar((Math.random() - 0.5) * cam.shake * 0.12).add(up.clone().multiplyScalar((Math.random() - 0.5) * cam.shake * 0.12)); }
    camera.position.copy(center).add(dir.clone().multiplyScalar(40)).add(shake);
    camera.up.copy(up);
    camera.lookAt(center.clone().add(shake));
    const s = cam.scale;
    const cx = rect ? rect.x + rect.w / 2 : W / 2, cyy = rect ? rect.y + rect.h / 2 : H / 2;
    camera.left = -cx * s; camera.right = (W - cx) * s; camera.top = cyy * s; camera.bottom = -(H - cyy) * s;
    camera.updateProjectionMatrix();
    // 光はカメラについてくる（上がいちばん明るく、左の面、右の面の順）
    V._light.copy(right.clone().multiplyScalar(-0.5).add(new THREE.Vector3(0, 1, 0)).add(back.clone().multiplyScalar(0.35))).normalize();
    // 陣の位置
    for (const S of sides) {
      if (mode === 'battle') S.posTo.copy(battleOffset(S.si, cam.yaw));
      else S.posTo.set(0, 0, 0);
      S.pos.lerp(S.posTo, Math.min(1, k * 0.9));
      S.root.position.copy(S.pos);
    }
    // 壁（奥の2面だけ）
    for (const S of sides) {
      for (const w of S.walls) {
        const show = w.userData.n.dot(back) < -0.01 ? 1 : 0;
        w.userData.op += (show - w.userData.op) * Math.min(1, k * 1.4);
        w.userData.plane.material.opacity = 0.34 * w.userData.op;
        w.userData.lines.material.opacity = 0.55 * w.userData.op;
        w.visible = w.userData.op > 0.02;
      }
      if (S.posts) for (const p of S.posts) {
        const n = new THREE.Vector3(p.userData.sx, 0, p.userData.sz);
        const front = n.dot(back) > 0.9;
        p.material.opacity = front ? 0.15 : 1;
      }
      if (S.levelTags && S.dims) {
        // 左の奥の柱のそばに段の番号
        const [W_, D_] = S.dims;
        const corner = new THREE.Vector3(0, 0, 0);
        let best = -Infinity;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const v = new THREE.Vector3(sx * W_ / 2, 0, sz * D_ / 2);
          const sc = -v.dot(right) - v.dot(back) * 0.4;
          if (sc > best) { best = sc; corner.copy(v); }
        }
        const out = right.clone().multiplyScalar(-0.46);
        for (const sp of S.levelTags) sp.position.set(corner.x + out.x, sp.userData.y, corner.z + out.z);
      }
      if (S.crest && S.dims) {
        S.crest.position.set(0, S.dims[2] + 1.15, 0);
        const a = S.crestAnim;
        if (a.shake > 0) { a.shake = Math.max(0, a.shake - dt * 3.5); S.crest.position.x += (Math.random() - 0.5) * a.shake * 0.25; }
        a.flash = Math.max(0, a.flash - dt * 4);
        const sc = 1.05 * (1 + a.flash * 0.12);
        S.crest.scale.set(sc, sc, 1);
        S.crest.material.color.setRGB(1, 1 - a.flash * 0.35, 1 - a.flash * 0.45);
      }
    }
  }

  /* ---------------- 選択（レイ） ---------------- */
  const ndc = new THREE.Vector2();
  V.pick = function (cx, cy, opts) {
    opts = opts || {};
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = [];
    const which = opts.sides || [0];
    for (const si of which) { const S = sides[si]; if (!S.box) continue; for (const M of S.meshes.values()) if (!opts.skip || !opts.skip.has(M.uid)) list.push(M.mesh); }
    const hits = raycaster.intersectObjects(list, false);
    for (const h of hits) {
      const M = h.object.userData.M, si = h.object.userData.side, S = sides[si];
      if (slice && si === 0 && h.point.y > slice + 0.001) continue;
      const loc = S.root.worldToLocal(h.point.clone());
      const n = h.face.normal.clone();
      const [W_, D_] = S.dims;
      const inside = loc.clone().sub(n.clone().multiplyScalar(0.02));
      const cell = [Math.floor(inside.x + W_ / 2), Math.floor(inside.y), Math.floor(inside.z + D_ / 2)];
      return { si, uid: M.uid, cell, normal: [Math.round(n.x), Math.round(n.y), Math.round(n.z)] };
    }
    // 床
    for (const si of which) {
      const S = sides[si];
      if (!S.dims) continue;
      const [W_, D_] = S.dims;
      const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -S.root.position.y);
      const p = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(pl, p)) continue;
      const loc = S.root.worldToLocal(p);
      const fx = loc.x + W_ / 2, fz = loc.z + D_ / 2;
      const m = opts.margin == null ? 0 : opts.margin;
      if (fx < -m || fz < -m || fx > W_ + m || fz > D_ + m) continue;
      return { si, floor: [Math.max(0, Math.min(W_ - 1, Math.floor(fx))), Math.max(0, Math.min(D_ - 1, Math.floor(fz)))], out: fx < 0 || fz < 0 || fx > W_ || fz > D_ };
    }
    return null;
  };

  /* ---------------- 断面（段を隠す） ---------------- */
  V.setSlice = function (k) { slice = k; V._occlDirty = true; };
  V.getSlice = () => slice;

  /* ---------------- 見本の絵（品書き用） ---------------- */
  const thumbCache = {};
  let tScene, tCam, tRT;
  V.thumb = function (id, cells) {
    const key = id + (cells ? '|' + cells.map((c) => c.join(',')).join(';') : '');
    if (thumbCache[key]) return thumbCache[key];
    if (!tScene) { tScene = new THREE.Scene(); tCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100); tRT = new THREE.WebGLRenderTarget(256, 256); }
    const shape = cells || RU.shapeOf(id);
    const ctr = centroid(shape);
    const mat = pieceMat(DEF[id].color);
    const yaw = Math.PI / 4;
    const { back, right } = camBasis(yaw);
    const cy = Math.cos(PITCH), sy = Math.sin(PITCH);
    const up = new THREE.Vector3(-back.x * sy, cy, -back.z * sy);
    const dir = new THREE.Vector3(back.x * cy, sy, back.z * cy);
    mat.uniforms.uLight.value = right.clone().multiplyScalar(-0.5).add(new THREE.Vector3(0, 1, 0)).add(back.clone().multiplyScalar(0.35)).normalize();
    mat.uniforms.uOrigin.value.set(-ctr[0], -ctr[1], -ctr[2]);
    const mesh = new THREE.Mesh(pieceGeo(shape, ctr), mat);
    tScene.add(mesh);
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    for (const cc of shape) for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) {
      const p = new THREE.Vector3(cc[0] + dx - ctr[0], cc[1] + dy - ctr[1], cc[2] + dz - ctr[2]);
      a = Math.min(a, p.dot(right)); b = Math.max(b, p.dot(right)); c = Math.min(c, p.dot(up)); d = Math.max(d, p.dot(up));
    }
    const half = Math.max(b - a, d - c) / 2 * 1.08, mr = (a + b) / 2, mu = (c + d) / 2;
    const center = right.clone().multiplyScalar(mr).add(up.clone().multiplyScalar(mu));
    tCam.position.copy(center).add(dir.clone().multiplyScalar(20));
    tCam.up.copy(up); tCam.lookAt(center);
    tCam.left = -half; tCam.right = half; tCam.top = half; tCam.bottom = -half; tCam.updateProjectionMatrix();
    const prevClear = renderer.getClearAlpha();
    renderer.setRenderTarget(tRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(tScene, tCam);
    const px = new Uint8Array(256 * 256 * 4);
    renderer.readRenderTargetPixels(tRT, 0, 0, 256, 256, px);
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, prevClear);
    tScene.remove(mesh); mesh.geometry.dispose(); mat.dispose();
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) img.data.set(px.subarray((255 - y) * 256 * 4, (256 - y) * 256 * 4), y * 256 * 4);
    g.putImageData(img, 0, 0);
    const out = document.createElement('canvas'); out.width = out.height = 128;
    out.getContext('2d').drawImage(cv, 0, 0, 128, 128);
    return (thumbCache[key] = out.toDataURL());
  };

  /* ---------------- 毎フレーム ---------------- */
  let lastOccl = 0;
  function updateOcclusion() {
    scene.updateMatrixWorld();
    const S = sides[0];
    const objs = [];
    for (const s of sides) for (const M of s.meshes.values()) objs.push(M.mesh);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const rc = new THREE.Raycaster();
    for (const s of sides) for (const M of s.meshes.values()) {
      const p = M.badge.position.clone();
      s.root.localToWorld(p);
      rc.set(p.clone().sub(dir.clone().multiplyScalar(40)), dir);
      rc.far = 40 - 0.03;
      const hits = rc.intersectObjects(objs, false);
      let occl = false;
      for (const h of hits) { if (h.object === M.mesh) continue; if (slice && s === S && h.point.y > slice) continue; occl = true; break; }
      M.occl = occl;
    }
    void S;
  }
  function frame(dt) {
    time += dt;
    updateCamera(dt);
    const camQ = camera.quaternion;
    for (const S of sides) {
      const [W_, D_] = S.dims || [1, 1];
      if (S.slab) S.slab.material.uniforms.uOrigin.value.set(-W_ / 2 + S.root.position.x, S.root.position.y, -D_ / 2 + S.root.position.z);
      for (const M of S.meshes.values()) {
        const mu = M.mat.uniforms;
        mu.uLight.value = V._light;
        if (M.delay > 0) { M.delay -= dt; M.group.visible = false; M.badge.visible = false; continue; }
        M.group.visible = true;
        // 落下
        if (M.dy > 0 || M.vy !== 0) {
          M.vy -= 34 * dt;
          M.dy += M.vy * dt;
          if (M.dy <= 0) {
            M.dy = 0;
            V._occlDirty = true;
            if (M.vy < -3.2) { const imp = -M.vy; M.vy = imp * 0.2; if (V.onLand) V.onLand(S.si, M.uid, imp); } else M.vy = 0;
          }
        }
        if (M.fly) {
          const f = M.fly; f.t += dt;
          f.v.y -= 16 * dt;
          M.group.position.addScaledVector(f.v, dt);
          M.group.rotation.x += f.w.x * dt; M.group.rotation.y += f.w.y * dt; M.group.rotation.z += f.w.z * dt;
          if (M.group.position.y < -6) M.group.visible = false;
        } else {
          M.group.position.set(M.base.x, M.base.y + M.dy, M.base.z);
          M.group.rotation.set(0, 0, M.wob ? Math.sin(time * 22 + M.uid) * 0.03 : 0);
          if (M.shake > 0) { M.shake = Math.max(0, M.shake - dt * 4); M.group.position.x += (Math.random() - 0.5) * M.shake * 0.08; M.group.position.z += (Math.random() - 0.5) * M.shake * 0.08; }
        }
        M.pop = Math.max(0, M.pop - dt * 5.5);
        const sc = 1 + Math.sin(M.pop * Math.PI) * 0.1;
        M.group.scale.setScalar(sc);
        M.flash = Math.max(0, M.flash - dt * 5);
        M.tint += (M.tintTo * (0.75 + 0.25 * Math.sin(time * 6)) - M.tint) * Math.min(1, dt * 12);
        M.dim += (M.dimTo - M.dim) * Math.min(1, dt * 10);
        mu.uFlash.value = M.flash;
        mu.uTintAmt.value = M.tint;
        mu.uTint.value.copy(M.tintCol);
        mu.uDim.value = M.dim;
        mu.uOrigin.value.set(-W_ / 2 + S.root.position.x, S.root.position.y, -D_ / 2 + S.root.position.z);
        mu.uClipY.value = S.si === 0 && slice ? slice + S.root.position.y : 999;
        const ch = S.charge.get(M.uid);
        mu.uFillOn.value = ch != null ? 1 : 0;
        if (ch != null) {
          mu.uFill.value = ch;
          mu.uYMin.value = M.group.position.y + S.root.position.y + (M.yMin - (M.base.y)) * sc;
          mu.uYMax.value = M.group.position.y + S.root.position.y + (M.yMax - (M.base.y)) * sc;
        }
        const stn = S.stunned.has(M.uid) ? 1 : 0;
        mu.uStun.value += (stn - mu.uStun.value) * Math.min(1, dt * 12);
        // 札
        const b = M.badge;
        b.visible = !M.hideBadge && !(S.si === 0 && slice && M.yMin >= slice) && (M.group.visible);
        b.position.set(M.anchor.x + (M.group.position.x - M.base.x), M.anchor.y + (M.group.position.y - M.base.y), M.anchor.z + (M.group.position.z - M.base.z));
        b.quaternion.copy(camQ);
        const bs = BADGE * (M.occl ? 0.78 : 1) * (1 + M.flash * 0.25 + Math.sin(M.pop * Math.PI) * 0.15);
        b.scale.setScalar(bs);
        M.bm.uniforms.uDim.value = (M.occl ? 0.42 : 1) * (1 - M.dim * 0.5);
        M.bm.uniforms.uFlash.value = M.flash;
        M.bm.uniforms.uOn.value = ch != null ? 1 : 0;
        M.bm.uniforms.uProg.value = ch != null ? ch : 0;
        M.bm.uniforms.uStun.value = stn;
      }
    }
    if (floorMark && floorMark.material.opacity < 1) floorMark.material.opacity = Math.min(1, floorMark.material.opacity + dt * 0.35);
    // ゴースト
    if (ghost) {
      ghost.group.position.lerp(ghost.target, Math.min(1, dt * 22));
      ghost.mat.uniforms.uLight.value = V._light;
      ghost.mat.uniforms.uAlpha.value = (ghost.ok ? 0.55 : 0.42) + Math.sin(time * 7) * 0.08;
      ghost.mat.uniforms.uOrigin.value.set(-sides[0].dims[0] / 2, 0, -sides[0].dims[1] / 2);
    }
    // 範囲
    for (let i = 0; i < rangeUsed; i++) {
      const o = rangePool[i];
      const ph = time * 3 + o.m.userData.ph;
      o.m.material.opacity = 0.16 + 0.08 * Math.sin(ph);
      o.m.scale.setScalar(0.97 + 0.02 * Math.sin(ph));
      o.sp.position.y = 0.05 * Math.sin(ph * 1.3);
    }
    // 粒
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], u = p.userData;
      u.t += dt;
      u.v.y -= u.g * dt;
      p.position.addScaledVector(u.v, dt);
      const k = 1 - u.t / u.life;
      p.material.opacity = Math.max(0, k);
      p.scale.setScalar(u.s * (0.6 + 0.4 * k));
      if (u.t >= u.life) { scene.remove(p); p.material.dispose(); parts.splice(i, 1); }
    }
    // 弾
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.t += dt / b.dur;
      const t = Math.min(1, b.t);
      const a = b.from.clone().lerp(b.mid, t), c = b.mid.clone().lerp(b.to, t);
      b.m.position.copy(a.lerp(c, t));
      b.m.rotation.x += dt * 12; b.m.rotation.y += dt * 9;
      b.trail += dt;
      if (b.trail > 0.03) { b.trail = 0; spark(b.m.position, b.color, 1, { speed: 0.3, up: 0.2, life: 0.25, size: 0.14, g: 0, add: true, top: true }); }
      if (b.t >= 1) { scene.remove(b.m); b.m.material.dispose(); bullets.splice(i, 1); if (b.cb) b.cb(); }
    }
    for (let i = layerFlashes.length - 1; i >= 0; i--) {
      const f = layerFlashes[i];
      f.t += dt;
      const k = Math.max(0, 1 - f.t / 0.9);
      f.m.material.opacity = 0.6 * k;
      f.m.scale.set(1 + (1 - k) * 0.08, 1 + (1 - k) * 0.3, 1 + (1 - k) * 0.08);
      if (f.t > 0.9) { f.S.root.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); layerFlashes.splice(i, 1); }
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.t += dt;
      const k = Math.max(0, 1 - b.t / 0.35);
      b.l.material.opacity = k; b.l2.material.opacity = k * 0.8; b.beam.material.opacity = 0.35 * k;
      if (b.t > 0.35) { scene.remove(b.l, b.l2); b.S.root.remove(b.beam); b.l.geometry.dispose(); b.beam.geometry.dispose(); bolts.splice(i, 1); }
    }
    // 札の隠れ具合
    lastOccl += dt;
    if (V._occlDirty && lastOccl > 0.12) { lastOccl = 0; V._occlDirty = false; updateOcclusion(); }
    if (Math.abs(cam.yaw - cam.yawTo) > 0.002) V._occlDirty = true;
    // ラベル
    for (const l of labels) {
      let p = null;
      if (l.cell) p = project(V.worldOfCell(l.si || 0, l.cell));
      else if (l.uid != null) p = V.badgeScreen(l.si || 0, l.uid);
      if (!p) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px)`;
    }
    for (const cb of frameCbs) cb(dt);
    renderer.render(scene, camera);
  }

  /* ---------------- はじめ ---------------- */
  V.init = function (cv, layer) {
    canvas = cv;
    labelLayer = layer;
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, G.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    raycaster = new THREE.Raycaster();
    sides.push(makeSide(0), makeSide(1));
    clock = new THREE.Clock();
    V.resize();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  V.step = function (n, dt) { for (let i = 0; i < n; i++) frame(dt || 1 / 60); };
  V.resize = function () {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    V.fit();
  };
  V.setMode = function (m) {
    mode = m;
    if (m !== 'title') cam.yawTo = Math.PI / 4 + Math.round((cam.yawTo - Math.PI / 4) / (Math.PI / 2)) * Math.PI / 2;
    sides[1].root.visible = m === 'battle';
    V.fit();
  };
  V.getMode = () => mode;
  V.onFrame = (cb) => frameCbs.push(cb);
  V.shake = (a) => { cam.shake = Math.max(cam.shake, a); };
  V.setCharge = function (si, map) { sides[si].charge = map; };
  V.setStunned = function (si, set) { sides[si].stunned = set; };
  V.side = (si) => sides[si];
  V.setWobble = function (si, set) { for (const [uid, M] of sides[si].meshes) M.wob = set && set.has(uid) ? 1 : 0; };
  V.fire = function (si, uid) { const M = sides[si].meshes.get(uid); if (M) { M.pop = 1; M.flash = 0.9; } };
  V.hitPiece = function (si, uid) { const M = sides[si].meshes.get(uid); if (M) { M.shake = 1; M.flash = 0.5; } };
  V.cam = cam;
})(typeof window !== 'undefined' ? window : globalThis);
