/* =========================================================
   最終バスの車掌 — 車内と車窓（three.js r128 ＋ ブルーム）
   バスは x の正の向きに走る。車内の左の壁（z が負）が歩道側で、扉がある。
   ========================================================= */
window.BW = (() => {
  'use strict';
  const S = {
    s: 0, speed: 0, acc: 0, yaw: 0, pitch: 0, door: 0, dawn: 0, bump: 0, climb: 0,
    pax: {}, refl: 0, fog: 0, hover: null, cross: 0, train: -1, bell: 0, window: 0,
    chiyo: 0, chiyoIn: 0, mirror: 0, sticker: 0, boat: 0, kana: 0, tome: 0, hayami: 0, yukoMan: 0, taku: 0, stopReq: 0,
  };
  let R, SC, CAM, COMP = null, FIN = null, BLOOM = null, mode = null, canvas, clock = 0, last = 0;
  let WORLD, FAR, SKY, STARS, MOON, HEMI, MOONL;
  const GROUND = -0.9, SIDE = -0.76;
  const SEGS = [];     // { x, g }
  const LAMPS = [];    // { x, y, z, c, i, tunnel }
  const PICK = [];
  const TICK = [];     // 毎フレーム動かすもの
  const TEX = {};
  const lin = (h) => new THREE.Color(h).convertSRGBToLinear();

  /* ---------- テクスチャ ---------- */
  function ctex(w, h, draw, rep) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); draw(x, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.userData = { c, x }; return t;
  }
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const JP = '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
  function glowTex() {
    return ctex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.55)'); g.addColorStop(0.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  }
  function facade(o) {
    const cols = o.cols, rows = o.rows, W = 64 * cols, H = 64 * rows;
    const lit = []; for (let i = 0; i < cols * rows; i++) lit.push(rnd() < o.lit);
    const paint = (x, em) => {
      x.fillStyle = em ? '#000' : o.wall; x.fillRect(0, 0, W, H);
      if (!em) { for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; x.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 8, 2 + rnd() * 8); } }
      if (o.wood && !em) for (let y = 0; y < H; y += 9) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, y, W, 1); }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const L = lit[r * cols + c], px = c * 64 + 12, py = r * 64 + 14, ww = 40, hh = o.tall ? 40 : 32;
        if (o.shutter && r === rows - 1) { if (!em) { x.fillStyle = '#6a6d72'; x.fillRect(c * 64 + 4, py - 6, 56, 50); for (let k = 0; k < 12; k++) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(c * 64 + 4, py - 6 + k * 4, 56, 1); } } continue; }
        if (em) { if (L) { x.fillStyle = o.cool && (r + c) % 3 === 0 ? '#bfe0ff' : '#ffd9a0'; x.fillRect(px, py, ww, hh); } continue; }
        x.fillStyle = o.frame || '#2a2c30'; x.fillRect(px - 3, py - 3, ww + 6, hh + 6);
        x.fillStyle = L ? (o.cool && (r + c) % 3 === 0 ? '#cfe6ff' : '#ffdca8') : '#15181e'; x.fillRect(px, py, ww, hh);
        if (L && rnd() < 0.5) { x.fillStyle = 'rgba(80,50,30,.45)'; x.fillRect(px, py, ww * (0.3 + rnd() * 0.4), hh); }
        if (!L) { x.fillStyle = 'rgba(120,140,170,.10)'; x.fillRect(px, py, ww, hh * 0.4); }
        if (o.balcony) { x.fillStyle = '#8a8d90'; x.fillRect(c * 64, py + hh + 4, 64, 5); }
      }
    };
    const map = ctex(W, H, (x) => paint(x, false)), em = ctex(W, H, (x) => paint(x, true));
    return { map, em };
  }
  function signTex(name, blank) {
    return ctex(256, 256, (x) => {
      x.fillStyle = '#f4f2ea'; x.beginPath(); x.arc(128, 128, 124, 0, Math.PI * 2); x.fill();
      x.lineWidth = 12; x.strokeStyle = blank ? '#8a8f96' : '#2a5aa0'; x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke();
      if (blank) { x.fillStyle = '#d8d6ce'; x.fillRect(40, 96, 176, 64); return; }
      x.fillStyle = '#2a5aa0'; x.font = `700 22px ${JP}`; x.textAlign = 'center'; x.fillText('夜ノ森線', 128, 70);
      x.fillStyle = '#1a1a1a'; let fs = 56; x.font = `900 ${fs}px ${JP}`; while (x.measureText(name).width > 200 && fs > 24) { fs -= 2; x.font = `900 ${fs}px ${JP}`; }
      x.textBaseline = 'middle'; x.fillText(name, 128, 132);
      x.font = `700 20px ${JP}`; x.fillStyle = '#555'; x.fillText('のりば', 128, 190);
    });
  }

  /* ---------- 材質 ---------- */
  const MC = new Map();
  function std(c, o) {
    const k = c + JSON.stringify(o || {});
    if (!MC.has(k)) { const m = new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: 0.85, metalness: 0 }, o || {})); if (o && o.emissive) m.emissive = lin(o.emissive); MC.set(k, m); }
    return MC.get(k);
  }
  const emis = (c, i) => new THREE.MeshStandardMaterial({ color: lin('#000000'), emissive: lin(c), emissiveIntensity: i || 2, roughness: 1 });
  function mesh(geo, mat, x, y, z, g, cast) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (g || SC).add(m); return m; }
  const box = (w, h, d, m, x, y, z, g) => mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' ? std(m) : m, x, y, z, g);
  const cyl = (r1, r2, h, m, x, y, z, g, seg) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 10), typeof m === 'string' ? std(m) : m, x, y, z, g);
  const sph = (r, m, x, y, z, g, a, b) => mesh(new THREE.SphereGeometry(r, a || 12, b || 10), typeof m === 'string' ? std(m) : m, x, y, z, g);
  function glow(c, s, x, y, z, g, o) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: lin(c), transparent: true, opacity: o == null ? 0.9 : o, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(s, s, 1); sp.position.set(x, y, z); (g || SC).add(sp); return sp;
  }
  function pool(c, r, x, z, g, o) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: TEX.glow, color: lin(c), transparent: true, opacity: o || 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, SIDE + 0.02, z); g.add(m); return m;
  }

  /* ---------- 人 ---------- */
  function lathe(pts, m) { return new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 14); }
  function person(L, pose, ghost) {
    const g = new THREE.Group(), k = L.kid ? 0.74 : 1;
    const mk = (c) => { const m = new THREE.MeshStandardMaterial({ color: lin(c), roughness: 0.82 }); if (ghost) { m.transparent = true; m.opacity = 0.62; m.emissive = lin('#5f7fb0'); m.emissiveIntensity = 0.35; m.depthWrite = false; } return m; };
    const cloth = mk(L.body), skin = mk(L.skin), hair = mk(L.hair), dark = mk('#1c1c20'), shoe = mk('#2a2422');
    g.userData.mats = [cloth, skin, hair, dark, shoe];
    const sit = pose === 'sit';
    const hip = sit ? 0.44 : 0.86;
    const torso = new THREE.Mesh(lathe([[0.001, 0], [0.15, 0], [0.16, 0.12], [0.18, 0.34], [0.19, 0.46], [0.12, 0.54], [0.05, 0.56], [0.001, 0.57]]), cloth);
    torso.position.y = hip; torso.scale.set(1, 1, 0.72); g.add(torso);
    if (L.old) torso.rotation.x = 0.18;
    const neckY = hip + 0.56;
    const head = new THREE.Group(); head.position.set(0, neckY + 0.1, L.old ? 0.05 : 0); g.add(head);
    mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, 0, 0, 0, head).scale.set(1, 1.1, 1);
    const hr = mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.012, -0.008, head);
    if (L.long) { mesh(new THREE.BoxGeometry(0.2, 0.26, 0.06), hair, 0, -0.1, -0.07, head); }
    if (!L.asleep) { sph(0.011, dark, -0.035, 0.005, 0.092, head, 6, 5); sph(0.011, dark, 0.035, 0.005, 0.092, head, 6, 5); }
    else { box(0.03, 0.004, 0.004, dark, -0.035, 0, 0.098, head); box(0.03, 0.004, 0.004, dark, 0.035, 0, 0.098, head); head.rotation.z = 0.35; head.rotation.x = 0.25; }
    if (L.cap) { cyl(0.108, 0.11, 0.07, dark, 0, 0.07, 0, head, 14); box(0.2, 0.012, 0.09, dark, 0, 0.04, 0.09, head); }
    if (L.towel) mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 16), mk('#f2f0ea'), 0, 0.04, 0, head).rotation.x = Math.PI / 2;
    if (L.uniform) { cyl(0.1, 0.105, 0.06, mk('#2a3550'), 0, 0.075, 0, head, 14); box(0.2, 0.012, 0.08, mk('#1a1f2e'), 0, 0.045, 0.08, head); }
    g.userData.head = head;
    // 腕
    const arm = (s) => {
      const a = new THREE.Group(); a.position.set(0.19 * s, hip + 0.46, 0); g.add(a);
      const up = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.3, 8), cloth, 0, -0.15, 0, a);
      const fo = new THREE.Group(); fo.position.set(0, -0.3, 0); a.add(fo);
      mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.27, 8), cloth, 0, -0.13, 0, fo);
      sph(0.038, skin, 0, -0.28, 0, fo, 8, 6);
      if (sit) { a.rotation.x = -0.25; a.rotation.z = s * 0.12; fo.rotation.x = -1.2; }
      else { a.rotation.z = s * 0.06; }
      return a;
    };
    g.userData.arms = [arm(-1), arm(1)];
    // 脚
    const legs = [];
    for (const s of [-1, 1]) {
      const l = new THREE.Group(); l.position.set(0.085 * s, hip, 0); g.add(l);
      const th = mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), L.suit || L.uniform ? cloth : dark, 0, -0.21, 0, l);
      const kn = new THREE.Group(); kn.position.set(0, -0.42, 0); l.add(kn);
      mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.42, 8), L.suit || L.uniform ? cloth : dark, 0, -0.21, 0, kn);
      box(0.09, 0.06, 0.2, L.boots ? mk('#2c3a2c') : shoe, 0, -0.43, 0.05, kn);
      if (sit) { l.rotation.x = -Math.PI / 2 + 0.08; kn.rotation.x = Math.PI / 2 - 0.08; }
      legs.push(l);
    }
    g.userData.legs = legs;
    // 持ち物
    if (L.flowers) { const f = new THREE.Group(); f.position.set(0.02, hip + 0.18, 0.32); g.add(f); mesh(new THREE.ConeGeometry(0.07, 0.22, 8), mk('#e8e2d0'), 0, 0, 0, f).rotation.x = Math.PI; ['#e86a9a', '#f2a0c0', '#ffffff', '#d85a8a', '#f2c0d0'].forEach((c, i) => sph(0.035, mk(c), Math.cos(i * 1.3) * 0.05, 0.13, Math.sin(i * 1.3) * 0.04, f, 6, 5)); f.rotation.x = -0.5; }
    if (L.cane) { const c = cyl(0.01, 0.01, 0.9, mk('#f4f4f0'), 0.26, hip - 0.05, 0.35, g, 6); c.rotation.x = 0.35; }
    if (L.cake) { box(0.3, 0.14, 0.24, mk('#f4ece0'), 0, hip + 0.12, 0.3, g); box(0.31, 0.02, 0.03, mk('#d85a6a'), 0, hip + 0.19, 0.3, g); }
    if (L.suit) box(0.035, 0.22, 0.01, mk('#8a2a36'), 0, hip + 0.32, 0.135, g);
    if (L.bag) { box(0.24, 0.26, 0.1, mk(L.bag), 0, hip + 0.25, -0.16, g); }
    if (L.cbag) { box(0.2, 0.16, 0.08, mk('#5a3a26'), 0.2, hip + 0.12, 0.05, g); }
    g.scale.setScalar(k);
    return g;
  }
  function paxAlpha(g, a, glowK) {
    for (const m of g.userData.mats) {
      if (!m.userData.base) m.userData.base = { o: m.opacity, t: m.transparent, e: m.emissiveIntensity };
      m.transparent = m.userData.base.t || a < 0.999; m.opacity = m.userData.base.o * a; m.depthWrite = !m.transparent;
      m.emissiveIntensity = m.userData.base.e + (glowK || 0);
      if (glowK && !m.userData.base.t) m.emissive = lin('#40506a');
    }
  }

  /* ---------- 車内 ---------- */
  const IN = {};
  function buildInterior() {
    const g = new THREE.Group(); SC.add(g); IN.g = g;
    const wall = std('#d8d0bc', { roughness: 0.7 }), lower = std('#8fa39a', { roughness: 0.6 }), alu = std('#b8bdc2', { roughness: 0.35, metalness: 0.7 });
    const floorT = ctex(512, 512, (x, w) => { x.fillStyle = '#5a4432'; x.fillRect(0, 0, w, w); for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(${40 + rnd() * 30},${28 + rnd() * 20},${18 + rnd() * 10},.6)`; x.fillRect(0, i * 32, w, 30); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 32 + 30, w, 2); } for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * 0.1})`; x.fillRect(rnd() * w, rnd() * w, 1 + rnd() * 30, 1); } }, [3, 1]);
    box(10.6, 0.05, 2.6, std('#ffffff', { map: floorT, roughness: 0.55 }), 0, -0.025, 0, g);
    box(10.6, 0.05, 2.6, std('#e8e4d8', { roughness: 0.9 }), 0, 2.36, 0, g);
    // 左の壁：窓と柱
    const WX = [[-4.9, -3.95], [-3.85, -2.9], [-2.8, -1.85], [-1.75, -0.65], [0.65, 1.75], [1.85, 2.8], [2.9, 3.85], [3.95, 4.9]];
    IN.WX = WX;
    box(10.6, 0.95, 0.06, lower, 0, 0.475, -1.28, g);
    box(10.6, 0.42, 0.06, wall, 0, 2.15, -1.28, g);
    const posts = [-5.25, -3.9, -2.85, -1.8, -0.6, 0.6, 1.8, 2.85, 3.9, 5.25];
    posts.forEach((p) => box(0.1, 1.0, 0.07, alu, p, 1.45, -1.27, g));
    box(10.6, 0.05, 0.1, alu, 0, 0.955, -1.25, g); box(10.6, 0.05, 0.08, alu, 0, 1.955, -1.26, g);
    // 窓ガラス
    const glass = new THREE.MeshStandardMaterial({ color: lin('#9fb4c8'), transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.6, depthWrite: false });
    const streak = ctex(256, 128, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,240,210,0)'); gr.addColorStop(0.45, 'rgba(255,240,210,.16)'); gr.addColorStop(0.5, 'rgba(255,240,210,.02)'); gr.addColorStop(0.7, 'rgba(255,240,210,.09)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
    const stM = new THREE.MeshBasicMaterial({ map: streak, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    WX.forEach(([a, b]) => { mesh(new THREE.PlaneGeometry(b - a, 1.0), glass, (a + b) / 2, 1.455, -1.255, g); mesh(new THREE.PlaneGeometry(b - a, 1.0), stM, (a + b) / 2, 1.455, -1.245, g); });
    // カーテン（柱にまとめてある）
    posts.slice(1, -1).forEach((p) => { if (Math.abs(p) < 0.7) return; const c = cyl(0.05, 0.035, 0.7, std('#b8a882', { roughness: 1 }), p, 1.55, -1.2, g, 8); c.scale.z = 0.6; });
    // 扉
    box(0.1, 2.0, 0.08, alu, -0.6, 1.0, -1.27, g); box(0.1, 2.0, 0.08, alu, 0.6, 1.0, -1.27, g);
    IN.doors = [];
    for (const s of [-1, 1]) {
      const d = new THREE.Group(); d.position.set(s * 0.275, 0, -1.29); g.add(d);
      box(0.54, 1.95, 0.04, std('#c8ccd0', { roughness: 0.4, metalness: 0.5 }), 0, 0.975, 0, d);
      mesh(new THREE.PlaneGeometry(0.4, 1.0), glass, 0, 1.3, 0.025, d);
      mesh(new THREE.PlaneGeometry(0.4, 0.5), glass, 0, 0.5, 0.025, d);
      d.userData.s = s; IN.doors.push(d);
    }
    box(1.1, 0.05, 0.4, std('#3a3a38'), 0, -0.2, -1.45, g);           // ステップ
    // 右の壁（うしろ側）
    box(10.6, 0.95, 0.06, lower, 0, 0.475, 1.28, g); box(10.6, 0.42, 0.06, wall, 0, 2.15, 1.28, g);
    [-5.25, -3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9].forEach((p) => box(0.1, 1.0, 0.07, alu, p, 1.45, 1.27, g));
    for (let p = -5.2; p < 3.9; p += 1.3) mesh(new THREE.PlaneGeometry(1.2, 1.0), glass, p + 0.65, 1.455, 1.255, g).rotation.y = Math.PI;
    // うしろの壁・前
    box(0.06, 2.4, 2.6, wall, -5.3, 1.2, 0, g);
    mesh(new THREE.PlaneGeometry(2.2, 0.8), glass, -5.26, 1.5, 0, g).rotation.y = Math.PI / 2;
    // いす（ロングシート）
    const moq = ctex(256, 256, (x, w) => { x.fillStyle = '#2d5a55'; x.fillRect(0, 0, w, w); for (let i = 0; i < 2500; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(20,50,45,.5)' : 'rgba(70,120,110,.35)'; x.fillRect(rnd() * w, rnd() * w, 2, 2); } x.strokeStyle = 'rgba(200,170,90,.35)'; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, w); x.stroke(); } }, [4, 1]);
    const seatM = std('#ffffff', { map: moq, roughness: 0.95 });
    for (const [a, b] of [[-5.1, -0.75], [0.75, 4.2]]) {
      const w = b - a, cx = (a + b) / 2;
      box(w, 0.12, 0.48, seatM, cx, 0.38, -0.98, g); box(w, 0.5, 0.1, seatM, cx, 0.72, -1.17, g); box(w, 0.32, 0.06, std('#6a6258'), cx, 0.16, -0.8, g);
      box(w, 0.12, 0.48, seatM, cx, 0.38, 0.98, g); box(w, 0.5, 0.1, seatM, cx, 0.72, 1.17, g);
    }
    // 手すり・つり革
    const pole = std('#d8a830', { roughness: 0.3, metalness: 0.6 }), steel = std('#c8ccd0', { roughness: 0.25, metalness: 0.8 });
    [[-0.72, -0.72], [0.72, -0.72], [-3.2, 0.72], [2.2, 0.72]].forEach(([x, z]) => cyl(0.02, 0.02, 2.34, pole, x, 1.17, z, g, 10));
    for (const z of [-0.5, 0.5]) cyl(0.015, 0.015, 9.5, steel, 0, 2.2, z, g, 8).rotation.z = Math.PI / 2;
    IN.straps = [];
    for (const z of [-0.5, 0.5]) for (let x = -4.4; x <= 4.0; x += 0.55) {
      const s = new THREE.Group(); s.position.set(x, 2.2, z); g.add(s);
      box(0.03, 0.2, 0.012, std('#d8ccb0'), 0, -0.1, 0, s);
      mesh(new THREE.TorusGeometry(0.055, 0.01, 6, 16), std('#f2f0e8', { roughness: 0.4 }), 0, -0.26, 0, s);
      s.userData.ph = rnd() * 6; IN.straps.push(s);
    }
    // 天井の灯り
    IN.lamps = [];
    for (let x = -4; x <= 4; x += 2) { const m = box(1.2, 0.03, 0.22, emis('#fff0cc', 1.1), x, 2.33, 0, g); IN.lamps.push(m); }
    // 降車ボタン
    IN.btns = [];
    [[-0.72, -0.72], [0.72, -0.72]].forEach(([x, z]) => { const b = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), emis('#ff3a2a', 0.3), x, 1.25, z + 0.03, g); b.rotation.x = Math.PI / 2; IN.btns.push(b); });
    // 広告と路線図
    IN.route = ctex(1024, 128, () => { });
    mesh(new THREE.PlaneGeometry(2.4, 0.3), new THREE.MeshStandardMaterial({ map: IN.route, roughness: 0.8, emissive: lin('#ffffff'), emissiveMap: IN.route, emissiveIntensity: 0.12 }), 0, 2.13, -1.245, g);
    const stick = mesh(new THREE.PlaneGeometry(0.2, 0.12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), 0, 2.13, -1.24, g); stick.userData.pick = 'sticker'; PICK.push(stick); IN.stick = stick;
    const ads = [
      ['みなと天文館', '最終投影　四十一年、ありがとう', '#1c2a4a', '#f4e6b0'],
      ['代筆屋ことづて', 'お手紙、書きます。港の見える坂', '#f2e8d4', '#5a3a2a'],
      ['ひなた町 観測所', '天気係アルバイト募集　時給：晴れ', '#cfe6f2', '#2b5f8b'],
      ['ナクシタ堂', 'あなたがなくしたもの、ぜんぶあります', '#2a2228', '#e8d8b0'],
      ['夜ノ森線', 'いつもご乗車ありがとうございます', '#f2f0ea', '#2a5aa0'],
      ['霞野線アーカイブ', '廃線跡をたずねて', '#e8e0cc', '#4a4034'],
    ];
    const adT = (a) => ctex(512, 128, (x, w, h) => { x.fillStyle = a[2]; x.fillRect(0, 0, w, h); x.fillStyle = a[3]; x.font = `900 44px ${JP}`; x.fillText(a[0], 24, 58); x.font = `500 24px ${JP}`; x.fillText(a[1], 26, 100); x.strokeStyle = a[3]; x.globalAlpha = 0.3; x.strokeRect(6, 6, w - 12, h - 12); });
    const adPos = [[-3.9, -1.25], [-2.5, -1.25], [2.5, -1.25], [3.9, -1.25]];
    adPos.forEach(([x, z], i) => mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: adT(ads[i]), roughness: 0.8, emissive: lin('#ffffff'), emissiveMap: adT(ads[i]), emissiveIntensity: 0.1 }), x, 2.13, z + 0.005, g));
    [[-3.3, 1.25], [0, 1.25]].forEach(([x, z], i) => mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: adT(ads[4 + i]), roughness: 0.8 }), x, 2.13, z - 0.005, g).rotation.y = Math.PI);
    // 前：運転席
    const fr = new THREE.Group(); fr.position.set(0, 0, 0); g.add(fr);
    box(0.06, 0.95, 2.6, lower, 5.3, 0.475, 0, fr);
    mesh(new THREE.PlaneGeometry(2.5, 1.2), glass, 5.28, 1.55, 0, fr).rotation.y = -Math.PI / 2;
    box(0.6, 0.35, 2.4, std('#3a3c40', { roughness: 0.6 }), 5.0, 0.95, 0, fr);
    const wheel = mesh(new THREE.TorusGeometry(0.21, 0.02, 8, 24), std('#1a1a1a'), 4.72, 1.12, 0.55, fr); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0.5;
    box(0.25, 0.5, 0.35, std('#6a6a70', { roughness: 0.4, metalness: 0.5 }), 4.3, 0.6, -0.55, fr);   // 運賃箱
    const drv = person({ body: '#2a3550', skin: '#d8b89a', hair: '#bcbcbc', uniform: true }, 'sit', false);
    drv.rotation.y = Math.PI / 2; drv.position.set(4.35, 0, 0.55); fr.add(drv); IN.driver = drv;
    box(0.5, 0.1, 0.45, std('#3a3a3a'), 4.35, 0.38, 0.55, fr);
    // 運賃表示器（天井からさがる）
    IN.led = ctex(512, 128, (x, w, h) => { x.fillStyle = '#080808'; x.fillRect(0, 0, w, h); });
    const ledM = new THREE.MeshStandardMaterial({ color: lin('#000000'), emissive: lin('#ffffff'), emissiveMap: IN.led, emissiveIntensity: 1.6, roughness: 1 });
    box(1.3, 0.34, 0.08, std('#1a1a1a'), 4.6, 2.05, -0.1, fr);
    mesh(new THREE.PlaneGeometry(1.2, 0.28), ledM, 4.555, 2.05, -0.1, fr).rotation.y = -Math.PI / 2;
    // ルームミラー
    const mir = mesh(new THREE.PlaneGeometry(0.34, 0.1), new THREE.MeshBasicMaterial({ color: lin('#2a3038') }), 5.15, 2.0, 0.35, fr); mir.rotation.y = -Math.PI / 2; mir.userData.pick = 'mirror'; PICK.push(mir); IN.mirror = mir;
    IN.eyes = ctex(256, 64, (x, w, h) => { x.fillStyle = '#3a3028'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8b89a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1210'; x.beginPath(); x.ellipse(80, 34, 18, 9, 0, 0, 7); x.ellipse(176, 34, 18, 9, 0, 0, 7); x.fill(); x.fillStyle = '#6a5040'; x.fillRect(50, 12, 60, 5); x.fillRect(146, 12, 60, 5); });
    // くもった窓（タクトのうしろ）
    IN.fogT = ctex(256, 256, (x, w) => {
      x.fillStyle = 'rgba(210,222,235,.55)'; x.fillRect(0, 0, w, w);
      for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${rnd() * 0.25})`; x.beginPath(); x.arc(rnd() * w, rnd() * w, rnd() * 2.5, 0, 7); x.fill(); }
      x.globalCompositeOperation = 'destination-out'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(80, 118); x.lineTo(128, 62); x.lineTo(176, 118); x.stroke();                       // 屋根
      x.beginPath(); x.moveTo(92, 118); x.lineTo(92, 200); x.moveTo(164, 118); x.lineTo(164, 200); x.stroke();  // 塔
      x.beginPath(); x.moveTo(110, 170); x.quadraticCurveTo(110, 132, 128, 132); x.quadraticCurveTo(146, 132, 146, 170); x.closePath(); x.stroke(); // 鐘
      x.beginPath(); x.arc(128, 178, 5, 0, 7); x.fill();
      x.beginPath(); x.moveTo(60, 206); x.lineTo(196, 206); x.stroke();
      x.lineWidth = 6; x.beginPath(); x.moveTo(206, 40); x.lineTo(222, 30); x.lineTo(222, 70); x.stroke();          // ちいさな印
      for (let i = 0; i < 5; i++) { x.lineWidth = 3; x.beginPath(); x.moveTo(80 + i * 22, 222); x.lineTo(80 + i * 22 + rnd() * 3, 250); x.stroke(); }
    });
    const fog = mesh(new THREE.PlaneGeometry(0.92, 0.95), new THREE.MeshBasicMaterial({ map: IN.fogT, transparent: true, opacity: 0, depthWrite: false }), -3.375, 1.46, -1.235, g);
    fog.userData.pick = 'fog'; PICK.push(fog); IN.fog = fog;
    // 灯り
    IN.l1 = new THREE.PointLight(lin('#ffe2b4'), 0.75, 6.5, 2); IN.l1.position.set(-2.2, 2.1, 0); g.add(IN.l1);
    IN.l2 = new THREE.PointLight(lin('#ffe2b4'), 0.75, 6.5, 2); IN.l2.position.set(2.2, 2.1, 0); g.add(IN.l2);
    return g;
  }

  /* ---------- 乗客 ---------- */
  const PX = {};
  function buildPax() {
    for (const p of LD.PAX) {
      const L = Object.assign({}, p.look, { asleep: p.asleep });
      if (p.hidden) {
        // 窓にだけうつる（向かいの席の人の、ガラスへのうつりこみ）
        const g = person(L, 'sit', true);
        g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.blending = THREE.AdditiveBlending; o.material.depthWrite = false; o.material.color = lin('#9fb8e0'); o.material.emissive = lin('#6f8fc0'); o.material.emissiveIntensity = 0.6; o.material.opacity = 0; } });
        g.userData.mats = []; g.traverse(o => { if (o.material) g.userData.mats.push(o.material); });
        g.position.set(-3.8, 0, -3.5); SC.add(g); PX[p.id] = { g, refl: true };
        const hit = mesh(new THREE.BoxGeometry(0.34, 0.6, 0.05), new THREE.MeshBasicMaterial({ visible: false }), -1.9, 1.12, -1.3); hit.userData.pick = 'refl'; PICK.push(hit); PX[p.id].hit = hit;
        continue;
      }
      const g = person(L, 'sit', !p.alive);
      g.position.set(p.seat, 0, -0.95);
      if (L.kid) g.position.y = 0.11;
      IN.g.add(g);
      const hit = mesh(new THREE.BoxGeometry(0.55, 1.1, 0.6), new THREE.MeshBasicMaterial({ visible: false }), p.seat, 0.75, -0.85, IN.g); hit.userData.pick = 'pax'; hit.userData.id = p.id; PICK.push(hit);
      PX[p.id] = { g, hit };
    }
    const chiyo = person({ body: '#2a3550', skin: '#ecd4c0', hair: '#4a3a34', uniform: true, cbag: true, long: false }, 'stand', true);
    chiyo.position.set(0.95, 0, -0.55); IN.g.add(chiyo); PX.chiyo = { g: chiyo };
  }

  /* ---------- 町 ---------- */
  function seg(i) { const g = new THREE.Group(); WORLD.add(g); const x = LD.STOPS[i] ? LD.STOPS[i].x : i; SEGS.push({ x, g }); return g; }
  function lamp(g, x, z, c, h, big) {
    const y0 = GROUND, H = h || 4.3;
    cyl(0.06, 0.08, H, '#3a3d42', x, y0 + H / 2, z, g, 8);
    const arm = box(0.9, 0.06, 0.06, std('#3a3d42'), x, y0 + H - 0.05, z + 0.4, g); arm.rotation.y = Math.PI / 2;
    box(0.36, 0.1, 0.18, emis(c, big ? 5 : 3.5), x, y0 + H - 0.1, z + 0.82, g);
    glow(c, big ? 3.2 : 2.4, x, y0 + H - 0.2, z + 0.82, g, 0.55);
    pool(c, big ? 3.2 : 2.6, x, z + 1.2, g, 0.32);
    LAMPS.push({ x, y: y0 + H - 0.3, z: z + 0.9, c: lin(c), i: big ? 1.6 : 1.1 });
  }
  function ground(g, x0, x1, opt) {
    opt = opt || {};
    const len = x1 - x0, cx = (x0 + x1) / 2;
    box(len, 0.02, 30, std('#17191e', { roughness: 0.55 }), cx, GROUND - 0.01, 12, g);                  // 車道
    for (let x = x0; x < x1; x += 6) box(3, 0.01, 0.15, std('#b8a060', { roughness: 0.6 }), x + 1.5, GROUND + 0.005, 2.9, g);
    if (!opt.noSide) {
      box(len, 0.16, 3.2, std(opt.side || '#34373e', { roughness: 0.9 }), cx, SIDE - 0.08, -3.2, g);    // 歩道
      box(len, 0.18, 0.18, std('#6a6d72'), cx, SIDE - 0.08, -1.6, g);                                    // 縁石
      for (const [a, b] of (opt.far || [[x0, x1]])) box(b - a, 0.02, 40, std('#1c2024', { roughness: 1 }), (a + b) / 2, SIDE - 0.1, -24.8, g);   // 奥の地面
    }
    box(len, 0.16, 3, std('#34373e', { roughness: 0.9 }), cx, SIDE - 0.08, 7.5, g);                    // 向こう側の歩道
  }
  function bld(g, x, z, w, h, d, fac, emI) {
    const m = new THREE.MeshStandardMaterial({ map: fac.map, emissiveMap: fac.em, emissive: lin('#ffffff'), emissiveIntensity: (emI == null ? 1.3 : emI) * 0.7, roughness: 0.9 });
    return mesh(new THREE.BoxGeometry(w, h, d), m, x, GROUND + h / 2, z, g);
  }
  function pole(g, x, name, blank) {
    const p = new THREE.Group(); p.position.set(x, SIDE, -2.25); g.add(p);
    cyl(0.04, 0.05, 2.5, '#c8ccd0', 0, 1.25, 0, p, 10);
    const d = mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshStandardMaterial({ map: signTex(name, blank), roughness: 0.6, emissive: lin('#ffffff'), emissiveMap: signTex(name, blank), emissiveIntensity: 0.22 }), 0, 2.2, 0.03, p);
    mesh(new THREE.CircleGeometry(0.3, 32), std('#c8ccd0'), 0, 2.2, -0.01, p).rotation.y = Math.PI;
    box(0.36, 0.5, 0.03, std('#f2f0e8', { emissive: '#ffffff', emissiveIntensity: 0.08 }), 0, 1.45, 0.02, p);
    box(1.4, 0.06, 0.36, std('#6a5a4a'), 1.1, 0.42, -0.5, p); box(0.06, 0.4, 0.3, std('#3a3a3a'), 0.5, 0.2, -0.5, p); box(0.06, 0.4, 0.3, std('#3a3a3a'), 1.7, 0.2, -0.5, p);
    return p;
  }
  function tree(g, x, z, h, c, r) {
    cyl(0.12, 0.18, h * 0.5, '#3a2c22', x, GROUND + h * 0.25, z, g, 8);
    for (let i = 0; i < 5; i++) sph(r * (0.6 + rnd() * 0.4), std(c, { roughness: 1 }), x + (rnd() - 0.5) * r, GROUND + h * 0.55 + rnd() * r, z + (rnd() - 0.5) * r, g, 8, 6);
  }
  function water(g, x0, x1, z0, z1, y) {
    const m = new THREE.MeshStandardMaterial({ color: lin('#0a1628'), roughness: 0.15, metalness: 0.7 });
    const w = mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m, (x0 + x1) / 2, y, (z0 + z1) / 2, g); w.rotation.x = -Math.PI / 2; return w;
  }
  function streaks(g, x0, x1, z, y, n, cols) {
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: lin(cols[i % cols.length]), transparent: true, opacity: 0.35 + rnd() * 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
      sp.scale.set(0.5 + rnd() * 0.6, 3 + rnd() * 4, 1); sp.position.set(x0 + rnd() * (x1 - x0), y, z - rnd() * 20); g.add(sp);
      TICK.push((t) => { sp.material.opacity = 0.25 + 0.2 * Math.sin(t * 2 + i); });
    }
  }
  function car(g, x, z, c, taxi) {
    const k = new THREE.Group(); k.position.set(x, GROUND, z); g.add(k);
    box(1.8, 0.55, 0.9, std(c, { roughness: 0.3, metalness: 0.4 }), 0, 0.45, 0, k); box(1.0, 0.4, 0.84, std('#151a22', { roughness: 0.1, metalness: 0.6 }), -0.1, 0.9, 0, k);
    if (taxi) { box(0.3, 0.14, 0.12, emis('#ffe08a', 2.2), -0.1, 1.17, 0, k); }
    for (const s of [-1, 1]) for (const e of [-0.6, 0.6]) cyl(0.2, 0.2, 0.12, '#101010', e, 0.2, s * 0.44, k, 12).rotation.x = Math.PI / 2;
    box(0.04, 0.1, 0.2, emis('#ff3a2a', 1.5), -0.92, 0.55, 0.3, k); box(0.04, 0.1, 0.2, emis('#ff3a2a', 1.5), -0.92, 0.55, -0.3, k);
    return k;
  }

  const FX = {};    // 物語で使う部品
  function buildWorld() {
    WORLD = new THREE.Group(); SC.add(WORLD);
    const ST = LD.STOPS, G = LD.GAP;
    seed = 11;
    const fac = {
      shop: facade({ cols: 4, rows: 2, wall: '#6a5a4c', lit: 0.2, shutter: true }),
      house: facade({ cols: 3, rows: 2, wall: '#5a5048', lit: 0.35 }),
      mansion: facade({ cols: 5, rows: 5, wall: '#8a8a86', lit: 0.3, balcony: true }),
      office: facade({ cols: 6, rows: 4, wall: '#4a4e56', lit: 0.25, cool: true, tall: true }),
      school: facade({ cols: 8, rows: 2, wall: '#6a4e36', lit: 0.0, wood: true, frame: '#3a2a1c' }),
      hosp: facade({ cols: 8, rows: 5, wall: '#c8ccce', lit: 0.45, cool: true }),
      ware: facade({ cols: 4, rows: 1, wall: '#5a6068', lit: 0.1 }),
      station: facade({ cols: 8, rows: 2, wall: '#5a5248', lit: 0.5, tall: true }),
    };
    // 各区間の地面と街灯
    for (let i = 0; i < ST.length; i++) {
      const g = seg(i), x = ST[i].x;
      const L = LD.LEGS[i];
      const special = L && (L.kind === 'tunnel' || L.kind === 'bigbridge' || L.kind === 'sea' || L.kind === 'bridge');
      const far = { 2: [[x - 35, x + 26]], 3: [[x - 26, x + 35]], 4: [[x - 35, x + 14]], 5: [], 7: [], 8: [] }[i];
      ground(g, x - G / 2, x + G / 2, { side: i === 4 ? '#3a3a34' : null, far });
      if (i === 5) box(50, 0.02, 4.4, std('#1c2024', { roughness: 1 }), x + 10, SIDE - 0.1, -7, g);
      const T0 = ST[5].x + 18, T1 = ST[5].x + 60;
      for (let lx = x - 30; lx < x + 34; lx += 14) { if (lx > T0 && lx < T1) continue; lamp(g, lx, -4.2, i === 7 || i === 8 ? '#ffd28a' : '#ffe0b0'); }
      if (!ST[i].gone || true) pole(g, x, ST[i].name, ST[i].gone);
    }
    seed = 21;
    const S0 = ST[0].x, S1 = ST[1].x, S2 = ST[2].x, S3 = ST[3].x, S4 = ST[4].x, S5 = ST[5].x, S6 = ST[6].x, S7 = ST[7].x, S8 = ST[8].x, S9 = ST[9].x;
    let g;
    /* 0 駅前 */
    g = SEGS[0].g;
    bld(g, S0 + 4, -14, 26, 7, 8, fac.station, 0.8);
    const tw = box(3, 11, 3, std('#8a7e6e'), S0 - 4, GROUND + 5.5, -11, g);
    FX.clock = ctex(256, 256, () => { }); drawClock(17);
    mesh(new THREE.CircleGeometry(1.1, 32), new THREE.MeshStandardMaterial({ map: FX.clock, emissive: lin('#ffffff'), emissiveMap: FX.clock, emissiveIntensity: 1.1, roughness: 1 }), S0 - 4, GROUND + 9, -9.48, g);
    glow('#fff4d8', 4, S0 - 4, GROUND + 9, -9.3, g, 0.35);
    const sn = ctex(512, 96, (x, w, h) => { x.fillStyle = '#1a2a4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f4f0e0'; x.font = `900 58px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('夜ノ森駅', w / 2, h / 2 + 2); });
    mesh(new THREE.PlaneGeometry(7, 1.3), new THREE.MeshStandardMaterial({ map: sn, emissive: lin('#ffffff'), emissiveMap: sn, emissiveIntensity: 1.2 }), S0 + 4, GROUND + 6.2, -9.95, g);
    car(g, S0 + 10, -6.5, '#2a2a2e', true); car(g, S0 + 14, -6.5, '#3a3a52', true);
    tree(g, S0 - 12, -7, 4, '#2a3a2a', 1.4); tree(g, S0 + 20, -7, 4, '#2a3a2a', 1.4);
    /* 1 商店街 */
    g = SEGS[1].g;
    for (let k = -3; k <= 3; k++) bld(g, S1 + k * 9, -9.5, 8.6, 6 + rnd() * 2, 7, fac.shop, 1.2);
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 60, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: lin('#8a9aa8'), transparent: true, opacity: 0.25, side: THREE.DoubleSide, roughness: 0.3, depthWrite: false }));
    arc.rotation.z = Math.PI / 2; arc.rotation.y = Math.PI / 2; arc.rotation.x = 0; arc.position.set(S1, GROUND + 5.2, -5); arc.rotation.set(0, 0, Math.PI / 2); g.add(arc);
    // ラーメン屋
    const rm = box(5, 4.2, 0.2, emis('#ffb870', 1.4), S1 + 2, GROUND + 2.1, -5.9, g);
    for (let k = 0; k < 4; k++) box(0.9, 0.8, 0.02, std('#b8302a', { emissive: '#601410', emissiveIntensity: 0.6 }), S1 + 0.6 + k * 1.0, GROUND + 3.4, -5.7, g);
    for (const dx of [-0.8, 4.6]) { sph(0.32, emis('#ff4a2a', 3.2), S1 + dx, GROUND + 3.2, -5.4, g, 14, 10).scale.y = 1.3; glow('#ff5a30', 2.2, S1 + dx, GROUND + 3.2, -5.2, g, 0.6); }
    pool('#ffb870', 3.5, S1 + 2, -4.2, g, 0.4);
    const ban = ctex(512, 128, (x, w, h) => { x.fillStyle = '#f2e8d0'; x.fillRect(0, 0, w, h); x.fillStyle = '#b82a22'; x.font = `900 80px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('らーめん', w / 2, h / 2 + 4); });
    mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshStandardMaterial({ map: ban, emissive: lin('#ffffff'), emissiveMap: ban, emissiveIntensity: 0.9 }), S1 + 2, GROUND + 4.8, -5.85, g);
    /* 1→2 踏切 */
    const cx = S1 + 40;
    FX.crossX = cx;
    for (let z = -40; z < 40; z += 1.2) box(0.25, 0.05, 1.0, std('#3a3028'), cx - 0.7, GROUND + 0.03, z, g), box(0.25, 0.05, 1.0, std('#3a3028'), cx + 0.7, GROUND + 0.03, z, g);
    for (const r of [-0.72, 0.72]) box(0.08, 0.08, 80, std('#8a8a8a', { metalness: 0.8, roughness: 0.3 }), cx + r, GROUND + 0.08, 0, g).rotation.set(0, 0, 0);
    FX.xl = [];
    const xing = (z, s) => {
      const p = new THREE.Group(); p.position.set(cx - 2.2, GROUND, z); g.add(p);
      cyl(0.08, 0.08, 3.6, '#e8e8e8', 0, 1.8, 0, p, 8);
      const xs = ctex(128, 128, (x) => { x.fillStyle = '#f2c230'; x.save(); x.translate(64, 64); x.rotate(Math.PI / 4); x.fillRect(-60, -10, 120, 20); x.rotate(-Math.PI / 2); x.fillRect(-60, -10, 120, 20); x.restore(); x.fillStyle = '#1a1a1a'; x.save(); x.translate(64, 64); x.rotate(Math.PI / 4); for (let k = -60; k < 60; k += 20) x.fillRect(k, -10, 10, 20); x.rotate(-Math.PI / 2); for (let k = -60; k < 60; k += 20) x.fillRect(k, -10, 10, 20); x.restore(); });
      mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: xs, transparent: true, side: THREE.DoubleSide }), 0, 3.4, 0, p).rotation.y = -Math.PI / 2;
      for (const d of [-0.28, 0.28]) { const l = sph(0.13, emis('#ff2a1a', 0.1), 0, 2.6, d, p, 12, 10); const gl = glow('#ff3020', 2.2, -0.1, 2.6, d, p, 0); FX.xl.push({ l, gl, d }); }
      const armG = new THREE.Group(); armG.position.set(0.3, 1.0, 0); p.add(armG);
      const at = ctex(256, 16, (x) => { for (let k = 0; k < 256; k += 32) { x.fillStyle = '#f2c230'; x.fillRect(k, 0, 16, 16); x.fillStyle = '#1a1a1a'; x.fillRect(k + 16, 0, 16, 16); } });
      box(0.08, 0.08, 5, std('#ffffff', { map: at }), 0, 0, s * 2.5, armG);
      armG.rotation.x = s * -1.4; (FX.arms = FX.arms || []).push({ g: armG, s });
    };
    xing(-2.4, 1); xing(4.6, -1);
    // 電車
    const tr = new THREE.Group(); g.add(tr); FX.train = tr; tr.position.set(cx, GROUND, -60);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Group(); c.position.z = -k * 17; tr.add(c);
      box(2.6, 3.2, 16, std('#c8ccd0', { metalness: 0.5, roughness: 0.4 }), 0, 1.9, 0, c); box(2.62, 0.3, 16, std('#2a6ab0'), 0, 1.1, 0, c);
      for (let w = -6.5; w <= 6.5; w += 1.6) { box(2.64, 0.8, 1.1, emis('#fff2d8', 1.8), 0, 2.4, w, c); }
    }
    tr.visible = false;
    /* 2 公民館前（もと小学校） */
    g = SEGS[2].g;
    const sc = bld(g, S2 + 2, -15, 24, 6.2, 6, fac.school, 0.0);
    box(25, 0.5, 7, std('#3a2c22'), S2 + 2, GROUND + 6.4, -15, g);
    // 鐘つきの塔（地面に立つ、小さな木の塔）
    const bt = new THREE.Group(); bt.position.set(S2 + 1.2, GROUND, -6.4); g.add(bt);
    const wood = std('#4a3626', { roughness: 0.95 });
    for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) box(0.18, 3.6, 0.18, wood, dx, 1.8, dz, bt);
    for (const y of [0.9, 3.5]) { box(1.8, 0.14, 0.14, wood, 0, y, -0.8, bt); box(1.8, 0.14, 0.14, wood, 0, y, 0.8, bt); box(0.14, 0.14, 1.8, wood, -0.8, y, 0, bt); box(0.14, 0.14, 1.8, wood, 0.8, y, 0, bt); }
    mesh(new THREE.ConeGeometry(1.7, 1.2, 4), std('#2e2218'), 0, 4.2, 0, bt).rotation.y = Math.PI / 4;
    const bell = new THREE.Group(); bell.position.set(0, 3.4, 0); bt.add(bell); FX.bell = bell;
    mesh(new THREE.CylinderGeometry(0.2, 0.38, 0.55, 18, 1, true), std('#b89a4a', { metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide }), 0, -0.4, 0, bell);
    sph(0.06, std('#8a7030', { metalness: 0.8 }), 0, -0.62, 0, bell, 8, 6);
    const bl = new THREE.SpotLight(lin('#ffe0b0'), 0, 10, 0.6, 0.6, 1.5); bl.position.set(S2 + 1.2, GROUND + 0.3, -3.6); bl.target.position.set(S2 + 1.2, GROUND + 3.2, -6.4); g.add(bl); g.add(bl.target); FX.bellLight = bl;
    glow('#fff0c8', 1.6, 0, 3.0, 0.9, bt, 0.18);
    FX.classWin = box(1.4, 1.1, 0.05, emis('#ffd9a0', 0), S2 - 3.2, GROUND + 4.5, -11.96, g);
    for (const dx of [-2.4, 2.4]) box(0.5, 1.8, 0.5, std('#8a8478'), S2 + 6 + dx, GROUND + 0.9, -5.2, g);
    const pl = ctex(256, 512, (x, w, h) => { x.fillStyle = '#e8e2d0'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a2a'; x.font = `700 46px ${JP}`; x.textAlign = 'center'; '夜ノ森公民館'.split('').forEach((c, i) => x.fillText(c, w / 2, 70 + i * 70)); });
    mesh(new THREE.PlaneGeometry(0.34, 1.1), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.8 }), S2 + 3.6, GROUND + 1.0, -4.94, g);
    tree(g, S2 - 9, -7.5, 5, '#2a2a22', 1.6);
    /* 2→3 小さな橋 */
    const bx = S2 + 35;
    water(g, bx - 8, bx + 8, -1.4, -60, GROUND - 3);
    for (let x = bx - 7; x <= bx + 7; x += 1.2) box(0.12, 1.1, 0.12, std('#8a8d92', { metalness: 0.5, roughness: 0.4 }), x, SIDE + 0.55, -1.8, g);
    box(15, 0.1, 0.1, std('#9a9da2', { metalness: 0.6, roughness: 0.3 }), bx, SIDE + 1.1, -1.8, g);
    streaks(g, bx - 6, bx + 6, -10, GROUND - 2.9, 10, ['#ffd9a0', '#bfe0ff']);
    FX.bridge = bx;
    /* 3 病院 */
    g = SEGS[3].g;
    bld(g, S3 + 3, -14, 26, 13, 9, fac.hosp, 1.3);
    const hs = ctex(512, 96, (x, w, h) => { x.fillStyle = '#0a3a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#9af0c8'; x.font = `900 60px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('夜ノ森市民病院', w / 2, h / 2 + 3); });
    mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshStandardMaterial({ map: hs, emissive: lin('#ffffff'), emissiveMap: hs, emissiveIntensity: 1.5 }), S3 + 3, GROUND + 12, -9.45, g);
    const ek = ctex(256, 96, (x, w, h) => { x.fillStyle = '#b01a1a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = `900 60px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('救急', w / 2, h / 2 + 3); });
    mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshStandardMaterial({ map: ek, emissive: lin('#ffffff'), emissiveMap: ek, emissiveIntensity: 1.8 }), S3 + 9, GROUND + 3.3, -9.45, g);
    FX.hospDoor = box(2.4, 2.4, 0.05, emis('#dff0ff', 1.4), S3 + 0.6, GROUND + 1.2, -9.44, g);
    pool('#dff0ff', 3, S3 + 0.6, -7.5, g, 0.4);
    car(g, S3 + 11, -6.5, '#f2f2f2');
    /* 3→4 坂（のぼり） */
    for (let k = 0; k < 6; k++) bld(g, S3 + 16 + k * 9, -10 - k * 0.3, 7, 5 + k * 0.9, 6, fac.house, 1.1);
    /* 4 大銀杏 */
    g = SEGS[4].g;
    const ic = new THREE.Group(); ic.position.set(S4 + 3, GROUND, -6.8); g.add(ic); FX.icho = ic;
    cyl(0.55, 0.9, 4.5, std('#4a3a2c', { roughness: 1 }), 0, 2.25, 0, ic, 12);
    const lg = new THREE.IcosahedronGeometry(0.62, 0), leafM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, emissive: lin('#6a4400'), emissiveIntensity: 0.22 });
    const N = 150, inst = new THREE.InstancedMesh(lg, leafM, N), dm = new THREE.Object3D(), cols = ['#f2b82a', '#e8a418', '#f6cc4a', '#d89a18', '#f8d860'];
    for (let k = 0; k < N; k++) {
      const a = rnd() * Math.PI * 2, u = rnd(), r = Math.sqrt(u) * 3.4, y = 2.6 + rnd() * 6.2 - r * 0.35;
      dm.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.85); dm.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); const sc = 0.7 + rnd() * 0.9; dm.scale.set(sc, sc * 0.8, sc); dm.updateMatrix();
      inst.setMatrixAt(k, dm.matrix); inst.setColorAt(k, lin(cols[k % cols.length]));
    }
    ic.add(inst);
    const up = new THREE.SpotLight(lin('#ffd890'), 1.7, 16, 0.8, 0.7, 1.2); up.position.set(S4 + 1, GROUND + 0.5, -3.2); up.target.position.set(S4 + 3, GROUND + 4.5, -6.8); g.add(up); g.add(up.target);
    glow('#ffd070', 10, S4 + 3, GROUND + 4.5, -6.2, g, 0.18);
    const lv = new THREE.BufferGeometry(), lp = []; for (let k = 0; k < 90; k++) lp.push(S4 + 3 + (rnd() - 0.5) * 9, GROUND + rnd() * 10, -6.8 + (rnd() - 0.2) * 6);
    lv.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const leaves = new THREE.Points(lv, new THREE.PointsMaterial({ color: lin('#ffd24a'), size: 0.12, transparent: true, opacity: 0.9 })); g.add(leaves);
    TICK.push((t, dt) => { const a = lv.attributes.position.array; for (let k = 1; k < a.length; k += 3) { a[k] -= dt * (0.4 + (k % 7) * 0.05); a[k - 1] += Math.sin(t + k) * dt * 0.3; if (a[k] < GROUND) a[k] = GROUND + 9 + (k % 5); } lv.attributes.position.needsUpdate = true; });
    const torii = new THREE.Group(); torii.position.set(S4 - 5, GROUND, -8); g.add(torii);
    for (const d of [-1.2, 1.2]) cyl(0.14, 0.16, 3.6, '#b83a22', d, 1.8, 0, torii, 10);
    box(3.6, 0.22, 0.3, std('#b83a22'), 0, 3.5, 0, torii); box(3.0, 0.16, 0.24, std('#b83a22'), 0, 2.9, 0, torii);
    for (let k = 0; k < 3; k++) bld(g, S4 + 12 + k * 9, -11, 7, 5, 6, fac.house, 1.0);
    /* 4→5 大きな橋 */
    const bb = S4 + 35;
    water(g, bb - 20, bb + 20, -1.6, -90, GROUND - 7);
    for (let x = bb - 16; x <= bb + 16; x += 4) { cyl(0.08, 0.1, 2.2, '#4a4d52', x, SIDE + 1.1, -1.85, g, 8); box(0.3, 0.3, 0.3, emis('#ffd8a0', 3.2), x, SIDE + 2.3, -1.85, g); glow('#ffcf90', 1.6, x, SIDE + 2.3, -1.75, g, 0.6); LAMPS.push({ x, y: SIDE + 2.3, z: -1.9, c: lin('#ffcf90'), i: 0.7 }); }
    box(34, 0.12, 0.12, std('#6a6d72', { metalness: 0.6 }), bb, SIDE + 1.0, -1.85, g);
    streaks(g, bb - 18, bb + 18, -20, GROUND - 6.9, 26, ['#ffd9a0', '#bfe0ff', '#ffb0a0']);
    const cityP = new THREE.BufferGeometry(), cp = []; for (let k = 0; k < 220; k++) cp.push(bb - 30 + rnd() * 60, GROUND - 4 + rnd() * 3, -60 - rnd() * 20);
    cityP.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    g.add(new THREE.Points(cityP, new THREE.PointsMaterial({ color: lin('#ffd9a0'), size: 0.25, transparent: true, opacity: 0.8 })));
    /* 5 川端 */
    g = SEGS[5].g;
    water(g, S5 - 30, S5 + 20, -9, -60, GROUND - 1.5);
    streaks(g, S5 - 20, S5 + 16, -12, GROUND - 1.45, 12, ['#ffd9a0']);
    const wil = new THREE.Group(); wil.position.set(S5 - 2.2, GROUND, -6.2); g.add(wil);
    cyl(0.25, 0.35, 3.5, '#3a3024', 0, 1.75, 0, wil, 8);
    for (let k = 0; k < 40; k++) { const a = rnd() * Math.PI * 2, r = 0.4 + rnd() * 1.6; const len = 2 + rnd() * 2; const s = box(0.03, len, 0.03, std('#4a6a3a', { roughness: 1 }), Math.cos(a) * r, 4 - len / 2, Math.sin(a) * r, wil); s.userData.ph = rnd() * 6; TICK.push((t) => { s.rotation.z = Math.sin(t * 0.8 + s.userData.ph) * 0.06; }); }
    box(0.1, 0.6, 30, std('#5a5a56'), S5, GROUND + 0.1, -8.6, g).rotation.y = Math.PI / 2;
    for (let k = 0; k < 3; k++) bld(g, S5 + 10 + k * 8, -6.6, 6, 4.5, 3, fac.house, 1.0);
    FX.kawaLamp = S5 + 3;
    /* 5→6 トンネル */
    const t0 = S5 + 20, t1 = S5 + 58;
    FX.tunnel = [t0, t1];
    const tunM = new THREE.MeshStandardMaterial({ color: lin('#5a5854'), roughness: 0.95, side: THREE.BackSide });
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, t1 - t0, 20, 1, true, 0, Math.PI), tunM);
    tun.rotation.z = Math.PI / 2; tun.position.set((t0 + t1) / 2, GROUND, 1.0); g.add(tun);
    for (const px of [t0 - 0.5, t1 + 0.5]) { box(1, 6, 3, std('#6a6862'), px, GROUND + 3, -4.7, g); box(1, 6, 3, std('#6a6862'), px, GROUND + 3, 6.7, g); box(1, 1.8, 14, std('#6a6862'), px, GROUND + 5.1, 1, g); }
    for (let x = t0 + 1.5; x < t1; x += 3) { box(0.8, 0.12, 0.2, emis('#ff9a3a', 4), x, GROUND + 2.9, -2.95, g); LAMPS.push({ x, y: GROUND + 2.8, z: -2.6, c: lin('#ff9a3a'), i: 1.4, tunnel: true }); }
    /* 6 団地 */
    g = SEGS[6].g;
    for (let k = -1; k <= 1; k++) bld(g, S6 + k * 16, -13 - Math.abs(k) * 2, 13, 11, 7, fac.mansion, 1.2);
    FX.family = S6 - 3;
    for (let k = 0; k < 3; k++) { box(0.6, 0.05, 0.6, std('#c84a3a'), S6 + 18 + k, GROUND + 0.8 + k * 0.4, -6, g); }
    /* 6→7 下り坂→海 */
    for (let k = 0; k < 4; k++) bld(g, S6 + 26 + k * 8, -9, 6, 4, 6, fac.house, 1.0);
    /* 7 港 */
    g = SEGS[7].g;
    water(g, S7 - 40, S7 + 200, -6, -160, GROUND - 0.7);
    streaks(g, S7 - 30, S7 + 150, -12, GROUND - 0.65, 40, ['#ffd9a0', '#ff6a5a', '#bfe0ff']);
    box(60, 0.8, 0.6, std('#4a4c50'), S7, GROUND - 0.3, -5.9, g);
    for (let x = S7 - 24; x < S7 + 30; x += 6) { cyl(0.18, 0.22, 0.5, '#2a2c30', x, GROUND + 0.25, -5.2, g, 10); }
    for (let k = 0; k < 2; k++) bld(g, S7 - 22 + k * 12, -8.5, 10, 6, 5, fac.ware, 0.6);
    for (const cxr of [S7 + 12, S7 + 26]) {
      const cr = new THREE.Group(); cr.position.set(cxr, GROUND, -12); g.add(cr);
      const red = std('#b83a2a', { roughness: 0.6 });
      for (const d of [-1.5, 1.5]) for (const e of [-1.5, 1.5]) box(0.3, 14, 0.3, red, d, 7, e, cr);
      box(3.4, 1, 18, red, 0, 14.5, -4, cr);
      const al = sph(0.25, emis('#ff2a1a', 4), 0, 15.3, -12, cr); const ag = glow('#ff3020', 3, 0, 15.3, -11.8, cr, 0.7);
      TICK.push((t) => { const on = Math.sin(t * 2.2 + cxr) > 0; al.material.emissiveIntensity = on ? 4 : 0.2; ag.material.opacity = on ? 0.7 : 0.05; });
    }
    const boat = (x, z, lit) => {
      const b = new THREE.Group(); b.position.set(x, GROUND - 0.7, z); g.add(b);
      box(5, 1.1, 1.8, std('#e8e4dc', { roughness: 0.6 }), 0, 0.4, 0, b); box(1.6, 1.2, 1.4, std('#d8d0c0'), -0.6, 1.4, 0, b); cyl(0.05, 0.05, 3.5, '#8a8a8a', 0.8, 2.5, 0, b, 6);
      const l = sph(0.15, emis('#ffe6a0', lit ? 3 : 0.05), 0.8, 4.3, 0, b); const gl = glow('#ffe0a0', 2.6, 0.8, 4.3, 0.1, b, lit ? 0.7 : 0);
      TICK.push((t) => { b.position.y = GROUND - 0.7 + Math.sin(t * 1.1 + x) * 0.06; b.rotation.x = Math.sin(t * 0.9 + x) * 0.03; });
      return { b, l, gl };
    };
    boat(S7 - 7, -9.5, true); boat(S7 + 9, -12, true); FX.genBoat = boat(S7 + 2.2, -8.4, false);
    const gm = ctex(256, 64, (x, w, h) => { x.fillStyle = '#e8e4dc'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a4a8a'; x.font = `900 40px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('第三源丸', w / 2, h / 2 + 2); });
    mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: gm, roughness: 0.7 }), 0, 0.5, 0.91, FX.genBoat.b);
    // 灯台
    const lh = new THREE.Group(); lh.position.set(S7 + 90, GROUND, -70); g.add(lh);
    cyl(1.2, 1.8, 14, '#e8e4dc', 0, 7, 0, lh, 16); sph(1, emis('#fff4d0', 5), 0, 14.5, 0, lh);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 60, 24, 1, true), new THREE.MeshBasicMaterial({ color: lin('#fff2d0'), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.geometry.translate(0, -30, 0); const bg = new THREE.Group(); bg.position.y = 14.5; lh.add(bg); beam.rotation.z = Math.PI / 2; bg.add(beam);
    glow('#fff4d0', 10, 0, 14.5, 0, lh, 0.6);
    TICK.push((t) => { bg.rotation.y = t * 0.6; });
    /* 7→9 海沿い */
    for (let x = S7 + 20; x < S8 + 30; x += 2.5) box(0.08, 0.7, 0.08, std('#c8ccd0'), x, SIDE + 0.35, -1.75, g);
    box(S8 + 10 - S7 - 20 + 20, 0.2, 0.05, std('#e8e8e8'), (S7 + 20 + S8 + 30) / 2, SIDE + 0.62, -1.75, g);
    /* 8 星見坂 */
    g = SEGS[8].g;
    box(60, 3, 30, std('#1a221a', { roughness: 1 }), S8, GROUND - 1.4, -22, g);
    tree(g, S8 - 8, -6, 5, '#1f2a1f', 1.8); tree(g, S8 + 9, -7, 6, '#1f2a1f', 2);
    FX.hoshiLamp = box(0.36, 0.1, 0.18, emis('#ffe0b0', 3), S8 + 1.0, GROUND + 3.4, -4.6, g); cyl(0.05, 0.06, 3.4, '#3a3d42', S8 + 1.0, GROUND + 1.7, -4.9, g, 8); glow('#ffe0b0', 2.2, S8 + 1.0, GROUND + 3.3, -4.5, g, 0.5); pool('#ffe0b0', 2.4, S8 + 0.6, -4.2, g, 0.35);
    const ch = person({ body: '#2a3550', skin: '#ecd4c0', hair: '#4a3a34', uniform: true, cbag: true }, 'stand', true);
    ch.position.set(S8 - 0.4, SIDE, -3.35); ch.rotation.y = 0.15; g.add(ch); FX.chiyoOut = ch; paxAlpha(ch, 0);
    /* 9 車庫前 */
    g = SEGS[9].g;
    const dep = facade({ cols: 6, rows: 1, wall: '#6a6e74', lit: 0.2 });
    bld(g, S9 + 2, -14, 30, 7, 10, dep, 0.8);
    for (let k = -1; k <= 1; k++) { const b = new THREE.Group(); b.position.set(S9 + k * 9, GROUND, -8.5); g.add(b); box(8, 2.8, 2.4, std('#dcd6c6', { roughness: 0.5 }), 0, 1.7, 0, b); box(8.02, 0.25, 2.42, std('#2a6a8a'), 0, 1.0, 0, b); for (let w = -3.4; w < 3.5; w += 1.1) box(0.9, 0.7, 2.44, std('#1a2028', { roughness: 0.1, metalness: 0.5 }), w, 2.35, 0, b); }
    box(0.9, 1.8, 0.7, emis('#e8f4ff', 1.3), S9 - 12, GROUND + 0.9, -5, g); glow('#dff0ff', 3, S9 - 12, GROUND + 1.2, -4.5, g, 0.4); pool('#dff0ff', 2.4, S9 - 12, -4, g, 0.4);
    // 物語の人たち（外）
    FX.out = {};
    const mkOut = (id, look, x, z, ry, ghost) => { const p = person(look, 'stand', ghost); p.position.set(x, SIDE, z); p.rotation.y = ry || 0; WORLD.add(p); paxAlpha(p, 0); FX.out[id] = p; return p; };
    mkOut('grandma', { body: '#8a6a5a', skin: '#ecd0b8', hair: '#dcdcdc', old: true }, S4 + 0.9, -4.7, -0.3);
    FX.flash = glow('#fff8e0', 1.4, S4 + 0.7, SIDE + 1.0, -4.3, WORLD, 0);
    mkOut('nurse', { body: '#e8eef2', skin: '#ecd0b8', hair: '#2a2228' }, S3 + 0.7, -7.6, 0);
    mkOut('wife', { body: '#b87a6a', skin: '#ecd0b8', hair: '#2a2228', long: true }, S6 - 0.9, -4.9, 0.3);
    mkOut('mina', { body: '#f2c0d0', skin: '#f3d2b8', hair: '#2a2228', kid: true }, S6 - 0.25, -4.6, 0.1);
    mkOut('oldman', { body: '#4a4a52', skin: '#d8b89a', hair: '#d8d8d8', flowers: true }, S5 + 0.7, -4.5, -0.3);
    FX.lantern = glow('#ffcf80', 1.4, S6 - 0.5, SIDE + 0.9, -4.3, WORLD, 0);
    // 遠くの山なみと街の灯
    FAR = new THREE.Group(); SC.add(FAR);
    const hill = new THREE.Shape(); hill.moveTo(-400, -20); for (let x = -400; x <= 400; x += 20) hill.lineTo(x, 8 + Math.sin(x * 0.02) * 6 + Math.sin(x * 0.051) * 4); hill.lineTo(400, -20);
    const hm = new THREE.Mesh(new THREE.ShapeGeometry(hill), new THREE.MeshBasicMaterial({ color: lin('#0b1020'), fog: false })); hm.position.set(0, GROUND, -150); FAR.add(hm);
    const fp = new THREE.BufferGeometry(), fpp = []; for (let k = 0; k < 500; k++) fpp.push(-400 + rnd() * 800, GROUND + rnd() * 9, -140 - rnd() * 5);
    fp.setAttribute('position', new THREE.Float32BufferAttribute(fpp, 3));
    FAR.add(new THREE.Points(fp, new THREE.PointsMaterial({ color: lin('#ffd9a0'), size: 0.5, transparent: true, opacity: 0.7, fog: false })));
  }
  function drawClock(min) {
    const c = FX.clock.userData, x = c.x, w = 256;
    x.fillStyle = '#f8f2e0'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill(); x.strokeStyle = '#2a2a2a'; x.lineWidth = 6; x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = '#2a2a2a'; x.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); }
    const hA = (min / 60) / 12 * Math.PI * 2, mA = min / 60 * Math.PI * 2;
    x.lineCap = 'round'; x.lineWidth = 10; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(hA) * 60, 128 - Math.cos(hA) * 60); x.stroke();
    x.lineWidth = 6; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(mA) * 92, 128 - Math.cos(mA) * 92); x.stroke();
    FX.clock.needsUpdate = true;
  }

  /* ---------- 空 ---------- */
  function buildSky() {
    SKY = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: lin('#02050d') }, mid: { value: lin('#0b1530') }, hor: { value: lin('#1d2748') }, dawn: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top, mid, hor; uniform float dawn; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.6, h)); vec3 d = mix(vec3(0.95,0.55,0.35), vec3(0.35,0.5,0.8), smoothstep(-0.02, 0.5, h)); c = mix(c, d * 0.9, dawn); gl_FragColor = vec4(c, 1.0); }',
    }));
    SC.add(SKY);
    const sg = new THREE.BufferGeometry(), sv = [], sc = [];
    for (let i = 0; i < 2200; i++) { const a = rnd() * Math.PI * 2, e = Math.asin(0.02 + rnd() * 0.98); sv.push(Math.cos(a) * Math.cos(e) * 420, Math.sin(e) * 420, Math.sin(a) * Math.cos(e) * 420); const b = 0.5 + rnd() * 0.5; sc.push(b, b, b * (0.9 + rnd() * 0.2)); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
    STARS = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
    SC.add(STARS);
    MOON = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(256, 256, (x, w) => { const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(0.3, 'rgba(255,245,220,1)'); g.addColorStop(0.34, 'rgba(255,240,210,.35)'); g.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), transparent: true, fog: false, depthWrite: false }));
    MOON.scale.set(60, 60, 1); MOON.position.set(-120, 150, -330); SC.add(MOON);
  }

  /* ---------- 光のにじみと仕上げ ---------- */
  const FINAL_SHADER = {
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 0.92 }, vig: { value: 1 }, grain: { value: 0.035 }, dawn: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time, exposure, vig, grain, dawn; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r = dot(d, d);
        vec3 c; c.r = texture2D(tDiffuse, vUv + d * 0.0035).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * 0.0035).b;
        c = aces(c * exposure);
        c = pow(c, vec3(1.0 / 2.2));
        c *= mix(1.0, 1.0 - r * 1.25, vig);
        c = mix(c, c * vec3(1.06, 1.0, 0.94), dawn);
        c += (rnd(vUv * vec2(1731.0, 977.0) + fract(time)) - 0.5) * grain;
        gl_FragColor = vec4(c, 1.0);
      }`,
  };

  /* ---------- はじめる ---------- */
  function init(cv) {
    canvas = cv;
    try {
      if (!window.THREE) throw 0;
      R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { mode = '2d'; init2d(); return false; }
    mode = '3d';
    R.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
    SC = new THREE.Scene();
    SC.fog = new THREE.FogExp2(lin('#0a1022'), 0.016);
    CAM = new THREE.PerspectiveCamera(58, 16 / 9, 0.05, 900);
    TEX.glow = glowTex();
    HEMI = new THREE.HemisphereLight(lin('#3a4a7a'), lin('#1a1612'), 0.22); SC.add(HEMI);
    MOONL = new THREE.DirectionalLight(lin('#8aa0d8'), 0.35); MOONL.position.set(-40, 80, -60); SC.add(MOONL);
    buildInterior(); buildPax(); buildWorld(); buildSky();
    // 窓の外から差しこむ光（街灯の数に関係なく3つ）
    S._pool = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffffff, 0, 9, 2); SC.add(l); return l; });
    S._red = new THREE.PointLight(lin('#ff2a1a'), 0, 12, 2); SC.add(S._red);
    S._car = new THREE.PointLight(lin('#f4f0ff'), 0, 14, 2); SC.add(S._car);
    S._tint = new THREE.PointLight(lin('#ffd9a0'), 0, 8, 2); S._tint.position.set(0, 1.6, -2.6); SC.add(S._tint);
    // 仕上げ
    const can = THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass;
    if (can) {
      try {
        COMP = new THREE.EffectComposer(R);
        COMP.addPass(new THREE.RenderPass(SC, CAM));
        BLOOM = new THREE.UnrealBloomPass(new THREE.Vector2(512, 256), 0.8, 0.5, 0.85);
        COMP.addPass(BLOOM);
        FIN = new THREE.ShaderPass(FINAL_SHADER); COMP.addPass(FIN);
        R.toneMapping = THREE.NoToneMapping; R.outputEncoding = THREE.LinearEncoding;
      } catch (e) { COMP = null; }
    }
    if (!COMP) { R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2; R.outputEncoding = THREE.sRGBEncoding; }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else addEventListener('resize', resize);
    last = performance.now(); requestAnimationFrame(loop);
    return true;
  }
  function resize() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 450;
    if (mode === '3d') {
      R.setSize(w, h, false); CAM.aspect = w / h;
      CAM.fov = w / h < 1.3 ? 66 : 58; CAM.updateProjectionMatrix();
      if (COMP) { COMP.setSize(w, h); if (BLOOM) BLOOM.resolution.set(w / 2, h / 2); }
    } else if (mode === '2d') { const d = Math.min(2, devicePixelRatio || 1); canvas.width = w * d; canvas.height = h * d; }
  }

  /* ---------- 毎フレーム ---------- */
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); }
  const tmpV = window.THREE ? new THREE.Vector3() : null;
  function frame(dt) {
    clock += dt;
    if (mode === '2d') { draw2d(dt); return; }
    const s = S.s;
    WORLD.position.x = -s;
    FAR.position.x = -s * 0.04;
    for (const q of SEGS) q.g.visible = Math.abs(q.x - s) < 150;
    for (const f of TICK) f(clock, dt);
    // 街灯の光を車内へ
    const near = LAMPS.map(l => ({ l, d: Math.abs(l.x - s) })).filter(q => q.d < 11).sort((a, b) => a.d - b.d).slice(0, 3);
    S._pool.forEach((pl, i) => {
      const q = near[i]; if (!q) { pl.intensity = 0; return; }
      pl.position.set(q.l.x - s, q.l.y, q.l.z); pl.color.copy(q.l.c);
      pl.intensity = q.l.i * (1 - S.dawn) * Math.max(0, 1 - q.d / 11) * 2.2;
    });
    // 踏切
    const xr = FX.crossX - s;
    const on = S.cross > 0;
    FX.xl.forEach((o, i) => { const lit = on && ((Math.floor(clock * 2.4) + (o.d > 0 ? 1 : 0)) % 2 === 0); o.l.material.emissiveIntensity = lit ? 6 : 0.1; o.gl.material.opacity = lit ? 0.9 : 0; });
    (FX.arms || []).forEach(a => { const tgt = on ? 0 : -1.4; a.g.rotation.x += (a.s * tgt - a.g.rotation.x) * Math.min(1, dt * 2); });
    S._red.position.set(xr - 2, 2.2, -2.6); S._red.intensity = on && Math.floor(clock * 2.4) % 2 === 0 && Math.abs(xr) < 12 ? 2.2 : 0;
    if (S.train >= 0) { FX.train.visible = true; FX.train.position.z = -70 + S.train * 140; } else FX.train.visible = false;
    // すれちがう車
    if (!S._carT && S.speed > 3 && Math.random() < dt * 0.12 && !(s > FX.tunnel[0] && s < FX.tunnel[1])) S._carT = 1;
    if (S._carT) { S._carT -= dt * 0.8; const cx = -14 + S._carT * 28; S._car.position.set(cx, 0.6, 3.2); S._car.intensity = Math.max(0, 1 - Math.abs(cx) / 14) * 3 * (1 - S.dawn); if (S._carT <= 0) { S._carT = 0; S._car.intensity = 0; } }
    // 公民館の鐘
    if (FX.bell) { FX.bell.rotation.z = Math.sin(clock * 5) * 0.4 * S.bell; FX.bellLight.intensity = S.taku * 3; FX.classWin.material.emissiveIntensity = S.taku * 2.4; }
    FX.genBoat.l.material.emissiveIntensity = 0.05 + S.boat * 3.5; FX.genBoat.gl.material.opacity = S.boat * 0.8;
    paxAlpha(FX.out.grandma, S.kana); FX.flash.material.opacity = S.kana * 0.8;
    paxAlpha(FX.out.nurse, S.tome);
    paxAlpha(FX.out.wife, S.hayami); paxAlpha(FX.out.mina, S.hayami); FX.lantern.material.opacity = S.hayami * 0.8;
    paxAlpha(FX.out.oldman, S.yukoMan);
    paxAlpha(FX.chiyoOut, S.chiyo); FX.hoshiLamp.material.emissiveIntensity = (Math.sin(clock * 13) > -0.6 || S.chiyo > 0.5 ? 3 : 0.3);
    // 動く人（降りていく乗客）
    for (const a of ACT) a.tick(dt);
    // 車内
    const sway = S.speed * 0.02;
    IN.straps.forEach(st => { st.rotation.z += ((-S.acc * 0.12 + Math.sin(clock * 1.7 + st.userData.ph) * sway) - st.rotation.z) * Math.min(1, dt * 3); st.rotation.x = Math.sin(clock * 1.3 + st.userData.ph) * sway * 0.5; });
    IN.doors.forEach(d => { d.position.x = d.userData.s * (0.275 + S.door * 0.5); });
    IN.lamps.forEach((m, i) => { m.material.emissiveIntensity = 1.1 * (0.94 + 0.06 * Math.sin(clock * 50 + i * 3) * (Math.random() < 0.02 ? 3 : 0.2)); });
    IN.btns.forEach(b => { b.material.emissiveIntensity = S.stopReq ? 3 : 0.3; });
    IN.fog.material.opacity = S.fog * 0.95;
    IN.mirror.material.map = S.mirror > 0.5 ? IN.eyes : null; IN.mirror.material.color = S.mirror > 0.5 ? lin('#ffffff') : lin('#2a3038'); IN.mirror.material.needsUpdate = true;
    const inTunnel = s > FX.tunnel[0] && s < FX.tunnel[1];
    S._tint.intensity = inTunnel ? 0 : 0;
    // 乗客
    for (const p of LD.PAX) {
      const o = PX[p.id], st = S.pax[p.id] || { a: 0 };
      if (o.refl) {
        const f = S.refl * (0.75 + 0.25 * Math.sin(clock * 2.3) + (near[0] ? (1 - near[0].d / 11) * 0.5 : 0));
        o.g.userData.mats.forEach(m => { m.opacity = f * 0.28; });
        o.g.visible = f > 0.01; o.hit.visible = true;
        continue;
      }
      o.g.visible = st.a > 0.01; o.hit.visible = st.a > 0.2;
      paxAlpha(o.g, st.a, S.hover === p.id ? 0.4 : 0);
      if (p.asleep) o.g.userData.head.rotation.z = 0.35 + Math.sin(clock * 0.9) * 0.05 + S.acc * 0.05;
      else o.g.userData.head.rotation.y = Math.sin(clock * 0.3 + p.seat) * 0.15;
      if (!p.alive && st.a > 0.01) o.g.position.y = (p.look.kid ? 0.11 : 0) + Math.sin(clock * 1.2 + p.seat) * 0.004;
    }
    PX.chiyo.g.visible = S.chiyoIn > 0.01; paxAlpha(PX.chiyo.g, S.chiyoIn);
    // 夜明け
    SKY.material.uniforms.dawn.value = S.dawn; STARS.material.opacity = 0.9 * (1 - S.dawn); MOON.material.opacity = 1 - S.dawn * 0.8;
    SC.fog.color.copy(lin('#0a1022')).lerp(lin('#c89a8a'), S.dawn * 0.8); SC.fog.density = 0.016 - S.dawn * 0.008;
    HEMI.intensity = 0.22 + S.dawn * 0.9; MOONL.intensity = 0.35 + S.dawn * 0.6; MOONL.color.copy(lin('#8aa0d8')).lerp(lin('#ffd0a8'), S.dawn);
    // カメラ
    const bumpY = S.bump * Math.sin(clock * 40) * 0.012; S.bump *= Math.pow(0.02, dt);
    CAM.position.set(Math.sin(S.yaw) * 0.25, 1.3 + Math.sin(clock * 9) * S.speed * 0.0008 + bumpY, 1.0);
    const yaw = S.yaw, pitch = 0.06 + S.pitch + S.climb * 0.05;
    tmpV.set(CAM.position.x + Math.sin(yaw) * 3, CAM.position.y + Math.tan(pitch) * 3, CAM.position.z - Math.cos(yaw) * 3);
    CAM.lookAt(tmpV);
    CAM.rotation.z += Math.sin(clock * 1.1) * S.speed * 0.0006 - S.acc * 0.004;
    if (COMP) { FIN.uniforms.time.value = clock; FIN.uniforms.dawn.value = S.dawn; FIN.uniforms.exposure.value = 0.92 + S.dawn * 0.35; COMP.render(dt); }
    else R.render(SC, CAM);
  }

  /* ---------- 降りていく人 ---------- */
  const ACT = [];
  function walkOut(id, stopX, to, opt) {
    opt = opt || {};
    const p = LD.PAX.find(q => q.id === id);
    const fig = person(Object.assign({}, p.look, { asleep: false }), 'stand', !p.alive);
    fig.position.set(stopX, SIDE, -1.9); WORLD.add(fig);
    const from = new THREE.Vector3(stopX, SIDE, -1.9), dest = new THREE.Vector3(to[0], SIDE, to[1]);
    let t = 0; const dur = opt.dur || 3.2;
    const a = {
      tick(dt) {
        t += dt; const u = Math.min(1, t / dur);
        fig.position.lerpVectors(from, dest, u);
        const dir = dest.clone().sub(from); fig.rotation.y = Math.atan2(dir.x, dir.z);
        const w = u < 1 ? Math.sin(t * 7) : 0;
        fig.userData.legs[0].rotation.x = w * 0.45; fig.userData.legs[1].rotation.x = -w * 0.45;
        fig.userData.arms[0].rotation.x = -w * 0.3; fig.userData.arms[1].rotation.x = w * 0.3;
        if (u >= 1 && opt.face != null) fig.rotation.y += (opt.face - fig.rotation.y) * Math.min(1, dt * 3);
        const fade = opt.fadeAt ? Math.max(0, 1 - Math.max(0, t - opt.fadeAt) / 2) : 1;
        paxAlpha(fig, fade);
        if (fade <= 0.01 && !a.gone) { a.gone = true; WORLD.remove(fig); ACT.splice(ACT.indexOf(a), 1); }
      },
    };
    ACT.push(a);
    return fig;
  }

  /* ---------- 選ぶ ---------- */
  const ray = window.THREE ? new THREE.Raycaster() : null;
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    if (mode === '2d') return pick2d(cx - r.left, cy - r.top, r.width, r.height);
    const v = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, CAM);
    const objs = PICK.filter(o => o.visible !== false);
    const hit = ray.intersectObjects(objs, false)[0];
    if (!hit) return null;
    const u = hit.object.userData;
    if (u.pick === 'pax') return { kind: 'pax', id: u.id };
    if (u.pick === 'refl') return S.refl > 0.05 ? { kind: 'refl' } : null;
    if (u.pick === 'fog') return S.fog > 0.2 ? { kind: 'fog' } : null;
    return { kind: u.pick };
  }

  /* ---------- 路線図と運賃表示器 ---------- */
  function drawRoute(cur, peeled) {
    if (mode !== '3d') return;
    const x = IN.route.userData.x, w = 1024, h = 128;
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2a5aa0'; x.font = `900 20px ${JP}`; x.fillText('夜ノ森循環', 14, 26);
    const X = (i) => 70 + i * 98;
    x.strokeStyle = '#2a5aa0'; x.lineWidth = 8; x.beginPath(); x.moveTo(X(0), 64); x.lineTo(X(9), 64); x.stroke();
    LD.STOPS.forEach((s, i) => {
      x.fillStyle = i === cur ? '#e0402a' : '#ffffff'; x.strokeStyle = '#2a5aa0'; x.lineWidth = 4; x.beginPath(); x.arc(X(i), 64, 11, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#1a1a1a'; x.font = `700 17px ${JP}`; x.textAlign = 'center'; x.fillText(s.name, X(i), 104);
      x.textAlign = 'left';
      if (s.gone && !peeled) { x.fillStyle = '#fbfaf6'; x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 4; x.fillRect(X(i) - 44, 44, 88, 72); x.shadowBlur = 0; }
    });
    IN.route.needsUpdate = true;
    const sx = X(8) / w - 0.5; IN.stick.position.x = sx * 2.4; IN.stick.visible = !peeled;
  }
  function drawLed(lines) {
    if (mode !== '3d') return;
    const x = IN.led.userData.x, w = 512, h = 128;
    x.fillStyle = '#060606'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ff8a1a'; x.font = `400 44px "DotGothic16", monospace`; x.textBaseline = 'middle';
    x.fillText(lines[0] || '', 16, 40); x.font = `400 30px "DotGothic16", monospace`; x.fillStyle = '#ffb040'; x.fillText(lines[1] || '', 16, 96);
    IN.led.needsUpdate = true;
  }
  function setClock(min) { if (mode === '3d' && FX.clock) drawClock(min); }

  /* ---------- 2D（3Dが使えないとき） ---------- */
  let X2 = null;
  function init2d() { X2 = canvas.getContext('2d'); resize(); addEventListener('resize', resize); last = performance.now(); requestAnimationFrame(loop); }
  function draw2d() {
    const d = Math.min(2, devicePixelRatio || 1), x = X2, w = canvas.clientWidth, h = canvas.clientHeight;
    x.setTransform(d, 0, 0, d, 0, 0);
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, S.dawn > 0.5 ? '#6a7ab0' : '#050a18'); sky.addColorStop(1, S.dawn > 0.5 ? '#f0b090' : '#1d2748'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    // 窓の外の影絵
    const s = S.s;
    for (let i = 0; i < 40; i++) { const bx = ((i * 97 - s * 6) % (w + 200) + w + 200) % (w + 200) - 100, bh = 40 + (i * 37 % 90); x.fillStyle = '#0c1020'; x.fillRect(bx, h * 0.55 - bh, 70, bh + 40); x.fillStyle = 'rgba(255,217,160,.7)'; for (let k = 0; k < 4; k++) if ((i + k) % 3 === 0) x.fillRect(bx + 10 + k * 14, h * 0.55 - bh + 12, 8, 8); }
    for (let i = 0; i < 8; i++) { const lx = ((i * 180 - s * 14) % (w + 200) + w + 200) % (w + 200) - 100; const g = x.createRadialGradient(lx, h * 0.3, 0, lx, h * 0.3, 60); g.addColorStop(0, 'rgba(255,220,160,.8)'); g.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = g; x.fillRect(lx - 60, h * 0.3 - 60, 120, 120); }
    // 車内の枠
    x.fillStyle = '#4a4a44'; x.fillRect(0, h * 0.62, w, h); x.fillRect(0, 0, w, h * 0.1);
    for (let i = 0; i < 6; i++) x.fillRect(i * w / 5 - 5, 0, 10, h * 0.62);
    // 乗客
    LD.PAX.forEach(p => {
      if (p.hidden) { if (S.refl > 0.05) { x.globalAlpha = S.refl * 0.35; x.fillStyle = '#bcd0f0'; const px = w * (0.5 + p.seat / 9); x.beginPath(); x.arc(px, h * 0.36, 14, 0, 7); x.fill(); x.fillRect(px - 16, h * 0.4, 32, 40); x.globalAlpha = 1; } return; }
      const st = S.pax[p.id]; if (!st || st.a < 0.05) return;
      const px = w * (0.5 + p.seat / 9), k = p.look.kid ? 0.75 : 1;
      x.globalAlpha = st.a * (p.alive ? 1 : 0.65); x.fillStyle = p.look.body; x.fillRect(px - 18 * k, h * 0.62 - 50 * k, 36 * k, 54 * k); x.fillStyle = p.look.skin; x.beginPath(); x.arc(px, h * 0.62 - 64 * k, 13 * k, 0, 7); x.fill();
      x.fillStyle = p.look.hair; x.beginPath(); x.arc(px, h * 0.62 - 68 * k, 13 * k, Math.PI, 0); x.fill();
      if (S.hover === p.id) { x.strokeStyle = '#ffd24a'; x.lineWidth = 2; x.strokeRect(px - 24, h * 0.62 - 86, 48, 92); }
      x.globalAlpha = 1;
    });
    if (S.fog > 0.2) { x.fillStyle = 'rgba(220,230,240,.4)'; x.fillRect(w * (0.5 - 3.8 / 9), h * 0.12, w * 0.1, h * 0.46); x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(w * (0.5 - 3.6 / 9), h * 0.2, w * 0.06, h * 0.25); }
    if (S.door > 0.1) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(w * 0.44, h * 0.1, w * 0.12, h * 0.9); }
  }
  function pick2d(px, py, w, h) {
    for (const p of LD.PAX) {
      const cx = w * (0.5 + p.seat / 9);
      if (Math.abs(px - cx) < 26 && py > h * 0.62 - 90 && py < h * 0.66) {
        if (p.hidden) return S.refl > 0.05 && py < h * 0.5 ? { kind: 'refl' } : null;
        if (S.pax[p.id] && S.pax[p.id].a > 0.2) return { kind: 'pax', id: p.id };
      }
    }
    const rx = w * (0.5 - 1.9 / 9); if (S.refl > 0.05 && Math.abs(px - rx) < 26 && py > h * 0.28 && py < h * 0.5) return { kind: 'refl' };
    if (S.fog > 0.2 && px > w * (0.5 - 3.8 / 9) && px < w * (0.5 - 2.9 / 9) && py < h * 0.58) return { kind: 'fog' };
    return null;
  }

  return { init, S, pick, drawRoute, drawLed, setClock, walkOut, FX: () => FX, get mode() { return mode; }, _step: (n) => { for (let i = 0; i < (n || 1); i++) frame(1 / 30); } };
})();
