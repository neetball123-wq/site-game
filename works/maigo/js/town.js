/* =========================================================
   迷子の天気予報 — 机の上のジオラマ（three.js r128）
   3Dが使えないときは、真上から見た2Dの地図で描く
   ========================================================= */
window.MT = (() => {
  'use strict';
  const GW = 6, GH = 5;
  const S = {                       // 画面側から書きこむ「いまの様子」
    tod: -0.5, clouds: [], rain: [], bows: [], wind: null, teru: null, steam: 0,
    marks: [], hover: null, roofOpen: false, fragOnRoof: false, hiyori: 0, snow: 0, day: 0, cat: false,
  };
  let mode = null, canvas = null, view = 'tilt';
  let R, SC, CAM, SUN, HEMI, STARS, clock = 0, last = 0, raf = 0;
  const C3 = (h) => new THREE.Color(h);
  const wx = (x) => x - 2.5, wz = (y) => y - 2;

  /* ---------- 時間帯の光 ---------- */
  const KEYS = [
    { t: -0.6, sky: '#f3d6be', sun: '#ffd4a0', si: 0.55, pos: [6, 2.2, 1.5], hs: '#f6dcc6', hg: '#8a7a66', hi: 0.55, night: 0.35 },
    { t: 0, sky: '#bfe2f4', sun: '#fff0d4', si: 0.8, pos: [6, 5, 3], hs: '#dff1fb', hg: '#9c8f74', hi: 0.5, night: 0 },
    { t: 1, sky: '#9fd3f1', sun: '#fffaf0', si: 0.78, pos: [3, 8, 4], hs: '#e8f6ff', hg: '#a39676', hi: 0.46, night: 0 },
    { t: 2, sky: '#f2b48e', sun: '#ffb27a', si: 0.85, pos: [-6.5, 3, 2], hs: '#ffd9c0', hg: '#8f6f5f', hi: 0.55, night: 0.15 },
    { t: 3, sky: '#18223f', sun: '#9fb4ff', si: 0.32, pos: [-2, 7, 4], hs: '#3a4a78', hg: '#1b1f2e', hi: 0.45, night: 1 },
  ];
  function lightAt(t) {
    t = Math.max(KEYS[0].t, Math.min(3, t));
    let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
    const mixc = (p, q) => C3(p).lerp(C3(q), u);
    return { sky: mixc(a.sky, b.sky), sun: mixc(a.sun, b.sun), si: a.si + (b.si - a.si) * u, pos: a.pos.map((v, k) => v + (b.pos[k] - v) * u),
      hs: mixc(a.hs, b.hs), hg: mixc(a.hg, b.hg), hi: a.hi + (b.hi - a.hi) * u, night: a.night + (b.night - a.night) * u };
  }

  /* ---------- 部品 ---------- */
  const MATS = new Map();
  function M(c, o) {
    const k = c + (o ? JSON.stringify(o) : '');
    if (!MATS.has(k)) MATS.set(k, new THREE.MeshPhongMaterial(Object.assign({ color: c, flatShading: true, shininess: 0 }, o || {})));
    return MATS.get(k);
  }
  let WIN;       // 夜に光る窓
  const TOPS = []; // 雪で白くなる地面
  function mesh(geo, mat, x, y, z, g) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
  const box = (w, h, d, c, x, y, z, g) => mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? M(c) : c, x, y + h / 2, z, g);
  const cyl = (rt, rb, h, c, x, y, z, g, seg) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 8), typeof c === 'string' ? M(c) : c, x, y + h / 2, z, g);
  const cone = (r, h, c, x, y, z, g, seg) => mesh(new THREE.ConeGeometry(r, h, seg || 6), M(c), x, y + h / 2, z, g);
  const sph = (r, c, x, y, z, g, a, b) => mesh(new THREE.SphereGeometry(r, a || 8, b || 6), typeof c === 'string' ? M(c) : c, x, y, z, g);
  function roof(w, d, h, c, x, y, z, g) {
    const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.lineTo(-d / 2, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2);
    return mesh(geo, M(c), x, y, z, g);
  }
  function house(x, z, g, wall, rc, s, rot) {
    s = s || 1; const hg = new THREE.Group(); hg.position.set(x, 0.12, z); hg.rotation.y = rot || 0; g.add(hg);
    box(0.26 * s, 0.2 * s, 0.22 * s, wall, 0, 0, 0, hg);
    roof(0.3 * s, 0.26 * s, 0.12 * s, rc, 0, 0.2 * s, 0, hg);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.07 * s, 0.06 * s, 0.01), WIN); w.position.set(0.04 * s, 0.1 * s, 0.111 * s); hg.add(w);
    return hg;
  }
  function tree(x, z, g, s, c) {
    s = s || 1; cyl(0.02 * s, 0.03 * s, 0.14 * s, '#7a5a3c', x, 0.12, z, g, 5);
    cone(0.11 * s, 0.26 * s, c || '#5f9a52', x, 0.2 * s + 0.08, z, g, 6);
  }

  /* ---------- 町をつくる ---------- */
  const OBJ = {};
  function top(c, low) { const m = M(c).clone(); m.userData.base = C3(c); TOPS.push(m); return m; }
  function buildTile(t) {
    const g = new THREE.Group(); g.position.set(wx(t.x), 0, wz(t.y)); SC.add(g);
    const low = t.kind === 'sea' || t.kind === 'offing';
    const colors = { mt: '#8fae6a', forest: '#86b36a', shrine: '#9cc27a', dome: '#a8c98a', sea: '#6fb8dc', field: '#9a7650', mitsu: '#a7cf86', obs: '#9fcc84',
      shops: '#c9c1ad', port: '#c9bea4', paddy: '#d7bd5a', school: '#c7b18c', plaza: '#cfc6b4', station: '#b9b3a6', hill: '#95c476', offing: '#5eaed6',
      river: '#9cc780', bank: '#cbbd9c', houses: '#a3cc84', park: '#8fc672', temple: '#b8ad96', hospital: '#b4d49a', beach: '#e6d6a6' };
    const h = low ? 0.06 : 0.12;
    const base = box(0.97, h, 0.97, top(colors[t.kind]), 0, 0, 0, g);
    base.userData.tile = t; PICK.push(base);
    const K = t.kind;
    if (K === 'mt') {
      cone(0.36, 0.95, '#6f8f55', -0.12, 0.1, 0.05, g, 6); cone(0.26, 0.7, '#7d9a5e', 0.2, 0.1, -0.12, g, 6); cone(0.18, 0.45, '#8a7a5c', 0.22, 0.1, 0.25, g, 5);
      cone(0.1, 0.18, '#f4f1ea', -0.12, 0.87, 0.05, g, 6);
    } else if (K === 'forest') {
      [[-0.25, -0.2, 1.1], [0.1, -0.28, 0.9], [0.28, 0.05, 1.2], [-0.2, 0.2, 1], [0.05, 0.25, 0.8], [-0.02, -0.02, 1.3]].forEach(([x, z, s], i) => tree(x, z, g, s, i % 2 ? '#4f8a48' : '#5f9a52'));
    } else if (K === 'shrine') {
      const red = '#d9482b';
      cyl(0.02, 0.02, 0.32, red, -0.13, 0.12, 0.28, g, 6); cyl(0.02, 0.02, 0.32, red, 0.13, 0.12, 0.28, g, 6);
      box(0.4, 0.035, 0.05, red, 0, 0.44, 0.28, g); box(0.32, 0.025, 0.04, red, 0, 0.37, 0.28, g);
      box(0.3, 0.16, 0.22, '#e8dcc2', 0, 0.12, -0.15, g); roof(0.38, 0.3, 0.12, '#5a5048', 0, 0.28, -0.15, g);
      tree(-0.33, -0.3, g, 0.9); tree(0.33, -0.3, g, 0.8);
    } else if (K === 'dome') {
      cyl(0.3, 0.32, 0.22, '#eeeae2', 0, 0.12, 0, g, 16);
      const d = mesh(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M('#dfe3e8'), 0, 0.34, 0, g);
      OBJ.dome = d;
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.01), WIN); w.position.set(0, 0.24, 0.32); g.add(w);
    } else if (K === 'sea' || K === 'offing') {
      const wv = box(0.97, 0.02, 0.97, new THREE.MeshPhongMaterial({ color: K === 'offing' ? '#4ea3d0' : '#63b2da', transparent: true, opacity: 0.85, shininess: 60 }), 0, h, 0, g);
      (OBJ.waves = OBJ.waves || []).push(wv);
      if (K === 'offing') { cyl(0.04, 0.05, 0.1, '#e0584a', 0.25, h + 0.02, 0.2, g, 8); OBJ.buoy = g.children[g.children.length - 1]; OBJ.offing = g; }
    } else if (K === 'field') {
      for (let i = 0; i < 5; i++) box(0.84, 0.03, 0.08, '#7a5a3a', 0, 0.12, -0.34 + i * 0.17, g);
      OBJ.sprouts = [];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const s = box(0.04, 0.06, 0.04, '#7cc25a', -0.34 + j * 0.17, 0.15, -0.34 + i * 0.17, g); OBJ.sprouts.push(s); }
      box(0.04, 0.3, 0.04, '#7a5a3c', 0.4, 0.12, 0.4, g); sph(0.06, '#d9b98a', 0.4, 0.48, 0.4, g); // かかし
      box(0.24, 0.03, 0.03, '#7a5a3c', 0.4, 0.36, 0.4, g);
    } else if (K === 'mitsu') {
      house(-0.12, -0.12, g, '#f2ead8', '#b75c43', 1.5);
      cyl(0.012, 0.012, 0.34, '#8a8f96', 0.12, 0.12, 0.3, g, 5); cyl(0.012, 0.012, 0.34, '#8a8f96', 0.42, 0.12, 0.3, g, 5);
      box(0.32, 0.01, 0.01, '#8a8f96', 0.27, 0.45, 0.3, g);
      OBJ.futon = box(0.26, 0.14, 0.02, '#f7b6c2', 0.27, 0.3, 0.3, g);
      box(0.1, 0.08, 0.02, '#ffffff', 0.35, 0.36, 0.34, g);
    } else if (K === 'obs') {
      box(0.34, 0.26, 0.3, '#f6f3ea', -0.1, 0.12, 0, g);
      const rf = new THREE.Group(); rf.position.set(-0.1, 0.38, -0.15); g.add(rf);
      const rm = box(0.4, 0.04, 0.36, '#3f7fb3', 0, 0, 0.15, rf); rm.userData.roof = true; PICK.push(rm); OBJ.roof = rf;
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshBasicMaterial({ color: '#fffdf4', side: THREE.DoubleSide }));
      paper.position.set(0.08, 0.05, 0.12); paper.rotation.x = -1.2; paper.rotation.z = 0.4; rf.add(paper); OBJ.paper = paper;
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.01), WIN); w.position.set(-0.02, 0.25, 0.155); g.add(w);
      // 風見鶏
      cyl(0.008, 0.008, 0.36, '#6b6b6b', -0.18, 0.42, -0.05, g, 4);
      const v = new THREE.Group(); v.position.set(-0.18, 0.74, -0.05); g.add(v); OBJ.vane = v;
      box(0.2, 0.012, 0.012, '#2e2e2e', 0, 0, 0, v); cone(0.03, 0.06, '#2e2e2e', 0.12, -0.03, 0, v, 4).rotation.z = -Math.PI / 2;
      box(0.05, 0.06, 0.012, '#2e2e2e', -0.08, 0.005, 0, v); sph(0.022, '#d9482b', 0.02, 0.05, 0, v);
      // 百葉箱と雨量計
      box(0.12, 0.12, 0.1, '#ffffff', 0.25, 0.26, 0.2, g);
      [[-0.04, -0.03], [0.04, -0.03], [-0.04, 0.03], [0.04, 0.03]].forEach(([a, b]) => cyl(0.006, 0.006, 0.14, '#ffffff', 0.25 + a, 0.12, 0.2 + b, g, 4));
      cyl(0.04, 0.04, 0.1, '#c9ced6', 0.3, 0.12, -0.25, g, 10);
    } else if (K === 'shops') {
      const cs = [['#f3d7a6', '#e0584a'], ['#d8e8f0', '#3e9bd6'], ['#f0e0ec', '#5aaa6a']];
      cs.forEach(([w, a], i) => { const x = -0.3 + i * 0.3; box(0.26, 0.26, 0.24, w, x, 0.12, -0.12, g); box(0.26, 0.02, 0.12, a, x, 0.3, 0.05, g).rotation.x = 0.35;
        const wn = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.01), WIN); wn.position.set(x, 0.2, 0.005); g.add(wn); });
      box(0.9, 0.01, 0.3, '#b8ae9a', 0, 0.12, 0.3, g);
    } else if (K === 'port') {
      box(0.97, 0.02, 0.5, new THREE.MeshPhongMaterial({ color: '#63b2da', transparent: true, opacity: 0.85, shininess: 60 }), 0, 0.06, 0.24, g);
      box(0.18, 0.04, 0.5, '#8a6a4a', -0.2, 0.08, 0.2, g);
      const b = new THREE.Group(); b.position.set(0.18, 0.1, 0.25); g.add(b); OBJ.boat = b;
      box(0.26, 0.06, 0.1, '#f2f2f2', 0, 0, 0, b); box(0.1, 0.07, 0.07, '#3e9bd6', -0.03, 0.06, 0, b); cyl(0.006, 0.006, 0.22, '#6b6b6b', 0.05, 0.06, 0, b, 4);
      box(0.2, 0.2, 0.2, '#e8e0cc', -0.28, 0.12, -0.28, g); roof(0.22, 0.24, 0.08, '#7a8a96', -0.28, 0.32, -0.28, g);
    } else if (K === 'paddy') {
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) cone(0.035, 0.1, '#e2c35a', -0.36 + j * 0.145, 0.12, -0.36 + i * 0.145, g, 4);
      box(0.97, 0.01, 0.04, '#9c8a5a', 0, 0.12, 0, g);
    } else if (K === 'school') {
      box(0.8, 0.26, 0.22, '#f4efe4', 0, 0.12, -0.32, g); roof(0.84, 0.24, 0.06, '#8a9aa6', 0, 0.38, -0.32, g);
      for (let i = 0; i < 5; i++) { const wn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.01), WIN); wn.position.set(-0.3 + i * 0.15, 0.26, -0.205); g.add(wn); }
      const trk = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 24), M('#f4f0e6', { side: THREE.DoubleSide })); trk.rotation.x = -Math.PI / 2; trk.scale.set(1.5, 1, 1); trk.position.set(0, 0.125, 0.18); g.add(trk);
      OBJ.flags = new THREE.Group(); g.add(OBJ.flags);
      ['#e0584a', '#f2c14e', '#3e9bd6', '#5aaa6a', '#e0584a', '#f2c14e'].forEach((c, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 3), M(c)); f.rotation.x = Math.PI; f.position.set(-0.38 + i * 0.15, 0.42, 0.02); OBJ.flags.add(f); });
      box(0.012, 0.3, 0.012, '#9a9a9a', -0.42, 0.12, 0.02, g); box(0.012, 0.3, 0.012, '#9a9a9a', 0.42, 0.12, 0.02, g);
    } else if (K === 'plaza') {
      cyl(0.16, 0.18, 0.05, '#bfb8aa', 0, 0.12, 0, g, 12); cyl(0.12, 0.12, 0.03, '#8cc8e8', 0, 0.17, 0, g, 12); cyl(0.02, 0.03, 0.14, '#bfb8aa', 0, 0.17, 0, g, 6);
      tree(-0.32, -0.3, g, 1); tree(0.32, 0.3, g, 1); box(0.18, 0.04, 0.05, '#8a6a4a', 0.28, 0.14, -0.3, g);
    } else if (K === 'station') {
      box(0.97, 0.01, 0.03, '#6b6b6b', 0, 0.12, 0.12, g); box(0.97, 0.01, 0.03, '#6b6b6b', 0, 0.12, 0.24, g);
      box(0.7, 0.06, 0.18, '#d8d2c4', -0.08, 0.12, -0.08, g); box(0.5, 0.02, 0.18, '#5a7aa0', -0.08, 0.36, -0.08, g);
      cyl(0.012, 0.012, 0.18, '#8a8f96', -0.3, 0.18, -0.08, g, 4); cyl(0.012, 0.012, 0.18, '#8a8f96', 0.14, 0.18, -0.08, g, 4);
      const tr = new THREE.Group(); tr.position.set(0, 0.13, 0.18); g.add(tr); OBJ.train = tr;
      box(0.3, 0.12, 0.12, '#f2f2f2', 0, 0, 0, tr); box(0.3, 0.03, 0.125, '#e0584a', 0, 0.05, 0, tr);
    } else if (K === 'hill') {
      const hm = mesh(new THREE.SphereGeometry(0.46, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), top('#8ec070'), 0, 0.1, 0, g); hm.scale.y = 0.55;
      tree(0.12, -0.08, g, 1.3, '#5f9a52'); OBJ.hilltop = new THREE.Vector3(wx(t.x) - 0.1, 0.36, wz(t.y) + 0.05);
      box(0.14, 0.03, 0.05, '#8a6a4a', -0.14, 0.33, 0.06, g);
    } else if (K === 'river' || K === 'bank') {
      const wide = K === 'river' ? 0.5 : 0.22, off = K === 'river' ? 0 : -0.38;
      box(wide, 0.02, 0.97, new THREE.MeshPhongMaterial({ color: '#6fb8dc', transparent: true, opacity: 0.9, shininess: 50 }), off, 0.12, 0, g);
      if (K === 'bank') { for (let i = 0; i < 8; i++) sph(0.03, '#a89c84', -0.1 + (i % 4) * 0.12, 0.14, -0.3 + Math.floor(i / 4) * 0.5, g, 5, 4); OBJ.bank = g; }
      else { tree(0.38, -0.3, g, 0.8); tree(-0.38, 0.3, g, 0.7); }
    } else if (K === 'houses') {
      const c = [['#f2e6d0', '#8a5a4a'], ['#e0ecf2', '#4a6a8a'], ['#f4e0d4', '#6a8a5a'], ['#efe9dc', '#a0584a']];
      const seed = t.x * 3 + t.y;
      house(-0.22, -0.2, g, c[seed % 4][0], c[seed % 4][1], 1.1);
      house(0.22, -0.15, g, c[(seed + 1) % 4][0], c[(seed + 1) % 4][1], 1, 0.2);
      house(-0.05, 0.25, g, c[(seed + 2) % 4][0], c[(seed + 2) % 4][1], 1.15, -0.1);
      tree(0.35, 0.3, g, 0.7);
    } else if (K === 'park') {
      tree(-0.3, -0.28, g, 1.1); tree(0.32, -0.25, g, 0.9);
      box(0.03, 0.18, 0.03, '#e0584a', -0.15, 0.12, 0.18, g); box(0.03, 0.18, 0.03, '#e0584a', 0.1, 0.12, 0.18, g); box(0.28, 0.02, 0.02, '#e0584a', -0.025, 0.3, 0.18, g);
      box(0.1, 0.02, 0.2, '#f2c14e', 0.3, 0.2, 0.2, g).rotation.x = 0.5; box(0.03, 0.14, 0.03, '#9a9a9a', 0.3, 0.12, 0.08, g);
      cyl(0.12, 0.12, 0.02, '#e6d6a6', -0.2, 0.12, 0.3, g, 10);
    } else if (K === 'temple') {
      box(0.5, 0.2, 0.38, '#e8dcc2', 0, 0.12, -0.08, g); roof(0.62, 0.5, 0.2, '#4a4a52', 0, 0.32, -0.08, g);
      box(0.08, 0.26, 0.08, '#8a6a4a', 0.32, 0.12, 0.32, g); tree(-0.32, 0.3, g, 1, '#c96a3a');
    } else if (K === 'hospital') {
      box(0.62, 0.42, 0.36, '#f7f7f4', 0, 0.12, -0.1, g); box(0.66, 0.03, 0.4, '#d8dde2', 0, 0.54, -0.1, g);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const wn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.01), WIN); wn.position.set(-0.22 + i * 0.15, 0.26 + r * 0.14, 0.085); g.add(wn); }
      box(0.1, 0.03, 0.01, '#5aaa6a', 0, 0.5, 0.085, g); box(0.03, 0.1, 0.01, '#5aaa6a', 0, 0.465, 0.085, g);
      tree(-0.36, 0.32, g, 0.8); tree(0.36, 0.32, g, 0.8);
    } else if (K === 'beach') {
      box(0.97, 0.02, 0.4, new THREE.MeshPhongMaterial({ color: '#63b2da', transparent: true, opacity: 0.85, shininess: 60 }), 0, 0.06, 0.28, g);
      box(0.5, 0.01, 0.04, '#ffffff', 0, 0.1, 0.07, g); cone(0.12, 0.12, '#e0584a', -0.2, 0.3, -0.2, g, 8); cyl(0.008, 0.008, 0.2, '#9a9a9a', -0.2, 0.12, -0.2, g, 4);
    }
    return g;
  }

  /* ---------- 雲・雨・虹 ---------- */
  const CL = new Map();
  function cloudMesh(id) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#3a3f48', transparent: true, opacity: 1 });
    let s = id * 9301 + 49297; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const n = 5 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const r = 0.15 + rnd() * 0.1, a = (i / n) * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      m.position.set(Math.cos(a) * 0.17 * (0.6 + rnd() * 0.5), (rnd() - 0.3) * 0.08 + (i === 0 ? 0.08 : 0), Math.sin(a) * 0.13);
      m.castShadow = true; g.add(m);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat); c.position.y = 0.07; c.castShadow = true; g.add(c);
    g.userData.mat = mat; g.userData.ph = rnd() * 6;
    SC.add(g); return g;
  }
  const RAIN = [], BOW = [];
  function rainObj(i) {
    const n = 26, pos = new Float32Array(n * 6), sp = [];
    for (let k = 0; k < n; k++) sp.push([Math.random() * 0.7 - 0.35, Math.random() * 1.4, Math.random() * 0.6 - 0.3]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#3f78c0', transparent: true, opacity: 0 }));
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.05, transparent: true, opacity: 0 }));
    line.position.set(wx(i % 6), 0, wz(Math.floor(i / 6))); pts.position.copy(line.position);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.25, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#7fa3cf', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    col.position.set(line.position.x, 0.75, line.position.z);
    SC.add(line); SC.add(pts); SC.add(col);
    return { line, pts, sp, col };
  }
  function bowObj(i) {
    const g = new THREE.Group(); g.position.set(wx(i % 6), 0.1, wz(Math.floor(i / 6)));
    const cols = ['#e0584a', '#f29a3a', '#f2d14e', '#6ac47a', '#4aa3d8', '#6a6ad0'];
    cols.forEach((c, k) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.46 - k * 0.028, 0.016, 5, 28, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 }));
      g.add(m);
    });
    SC.add(g); return g;
  }
  let TERU, HIYORI, STEAM, RINGS = [], PICK = [];
  function teruObj() {
    const g = new THREE.Group();
    const w = M('#ffffff');
    sph(0.07, w, 0, 0, 0, g, 10, 8);
    mesh(new THREE.ConeGeometry(0.09, 0.13, 10, 1, true), M('#ffffff', { side: THREE.DoubleSide }), 0, -0.1, 0, g);
    const eye = M('#3a3a3a'); sph(0.009, eye, -0.025, 0.01, 0.065, g, 4, 3); sph(0.009, eye, 0.025, 0.01, 0.065, g, 4, 3);
    box(0.03, 0.006, 0.006, '#e0584a', 0, -0.025, 0.066, g);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 3), M('#8a8f96')); str.position.y = 0.37; g.add(str);
    g.traverse(o => { if (o.isMesh) o.userData.teru = true; });
    g.visible = false; SC.add(g); return g;
  }
  function hiyoriObj() {
    const g = new THREE.Group();
    cyl(0.035, 0.05, 0.12, '#9b8ac4', 0, 0, 0, g, 8); sph(0.03, '#f2d6bf', 0, 0.15, 0, g, 8, 6); sph(0.032, '#d8d8d8', 0, 0.165, -0.008, g, 8, 6);
    cyl(0.004, 0.004, 0.12, '#6a4a3a', 0.05, 0, 0.02, g, 4);
    g.visible = false; SC.add(g); return g;
  }

  /* ---------- はじめる ---------- */
  function init(cv) {
    canvas = cv;
    try {
      if (!window.THREE) throw new Error('no three');
      R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (e) { mode = '2d'; init2d(); return false; }
    mode = '3d';
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    SC = new THREE.Scene(); SC.background = C3('#bfe2f4');
    CAM = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    HEMI = new THREE.HemisphereLight('#dff1fb', '#9c8f74', 0.6); SC.add(HEMI);
    SUN = new THREE.DirectionalLight('#ffffff', 1); SUN.castShadow = true; SUN.shadow.mapSize.set(1024, 1024);
    const sc = SUN.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 0.5; sc.far = 30; SUN.shadow.bias = -0.0015;
    SC.add(SUN); SC.add(SUN.target);
    WIN = new THREE.MeshPhongMaterial({ color: '#d9e6ee', emissive: '#ffc766', emissiveIntensity: 0, flatShading: true });
    // 台（木の板）と目盛り
    const board = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.3, 5.9), M('#c89a62')); board.position.y = -0.15; board.receiveShadow = true; SC.add(board);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.08, 6.0), M('#a8784a')); edge.position.y = -0.34; SC.add(edge);
    const lab = document.createElement('canvas'); lab.width = 1380; lab.height = 1180; const x = lab.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, lab.width, lab.height);
    x.fillStyle = '#5a3c20'; x.font = 'bold 44px "Zen Maru Gothic", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const px = (v) => (v + 3.45) / 6.9 * lab.width, pz = (v) => (v + 2.95) / 5.9 * lab.height;
    for (let i = 0; i < 6; i++) { x.fillText('ABCDEF'[i], px(wx(i)), pz(2.72)); x.fillText('ABCDEF'[i], px(wx(i)), pz(-2.72)); }
    for (let j = 0; j < 5; j++) { x.fillText(String(j + 1), px(-3.22), pz(wz(j))); x.fillText(String(j + 1), px(3.22), pz(wz(j))); }
    x.font = 'bold 36px "Zen Maru Gothic", sans-serif'; x.fillStyle = '#b8462e'; x.fillText('北', px(-3.22), pz(-2.72));
    const lt = new THREE.CanvasTexture(lab); lt.anisotropy = 4;
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 5.9), new THREE.MeshBasicMaterial({ map: lt, transparent: true }));
    lp.rotation.x = -Math.PI / 2; lp.position.y = 0.003; SC.add(lp);
    MD.TILES.forEach(buildTile);
    for (let i = 0; i < 30; i++) { RAIN.push(rainObj(i)); BOW.push(bowObj(i)); }
    for (let i = 0; i < 30; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.45, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      r.rotation.x = -Math.PI / 2; r.position.set(wx(i % 6), 0.135, wz(Math.floor(i / 6))); SC.add(r); RINGS.push(r);
    }
    TERU = teruObj(); HIYORI = hiyoriObj();
    STEAM = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })); STEAM.add(s); }
    STEAM.position.set(wx(5), 0.1, wz(2)); SC.add(STEAM);
    // 夜の星
    const sg = new THREE.BufferGeometry(), sv = [];
    for (let i = 0; i < 260; i++) { const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2; sv.push(Math.cos(a) * 30 * Math.cos(e), 30 * Math.sin(e), -Math.abs(Math.sin(a)) * 30 * Math.cos(e) - 5); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    STARS = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, transparent: true, opacity: 0 })); SC.add(STARS);
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else addEventListener('resize', resize);
    last = performance.now(); raf = requestAnimationFrame(loop);
    return true;
  }
  function resize() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 400;
    if (mode === '3d') { R.setSize(w, h, false); CAM.aspect = w / h; place(); CAM.updateProjectionMatrix(); }
    else if (mode === '2d') { const d = Math.min(2, devicePixelRatio || 1); canvas.width = w * d; canvas.height = h * d; }
  }
  function place() {
    const asp = CAM.aspect, vf = CAM.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const top = view === 'top';
    const dir = top ? new THREE.Vector3(0, 1, 0.0001) : new THREE.Vector3(0, 0.74, 0.67).normalize();
    const needW = top ? 7.3 : 7.4, needH = top ? 6.4 : 5.2;
    const d = Math.max((needW / 2) / Math.tan(hf / 2), (needH / 2) / Math.tan(vf / 2)) * (top ? 1 : 1.12);
    CAM.position.copy(dir.multiplyScalar(d)); CAM.position.z += top ? 0 : 0.3;
    CAM.lookAt(0, top ? 0 : 0.1, top ? 0 : 0.35);
  }
  function setView(v) { view = v; if (mode === '3d') { place(); CAM.updateProjectionMatrix(); } }

  /* ---------- 毎フレーム ---------- */
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    frame(dt);
  }
  function frame(dt) {
    clock += dt;
    if (mode === '2d') { draw2d(); return; }
    const L = lightAt(S.tod);
    SC.background = L.sky; HEMI.color.copy(L.hs); HEMI.groundColor.copy(L.hg); HEMI.intensity = L.hi;
    SUN.color.copy(L.sun); SUN.intensity = L.si; SUN.position.set(L.pos[0], L.pos[1], L.pos[2]);
    WIN.emissiveIntensity = L.night * 1.1;
    STARS.material.opacity = Math.max(0, L.night - 0.4) * 1.6;
    // 雪化粧
    for (const m of TOPS) { m.color.copy(m.userData.base).lerp(C3('#f4f6fa'), S.snow * 0.85); }
    // 雲
    const seen = new Set();
    for (const c of S.clouds) {
      let g = CL.get(c.id); if (!g) { g = cloudMesh(c.id); CL.set(c.id, g); }
      seen.add(c.id); const al = c.a == null ? 1 : c.a; g.visible = al > 0.01;
      const bob = Math.sin(clock * 0.8 + g.userData.ph) * 0.025;
      g.position.set(wx(c.x), 1.45 + bob + (c.gray || 0) * -0.08, wz(c.y));
      const s = (c.s == null ? 1 : c.s) * (1 + (c.gray || 0) * 0.12);
      g.scale.set(s, s * (1 - (c.gray || 0) * 0.1), s);
      const mat = g.userData.mat;
      mat.color.setRGB(1, 1, 1).lerp(C3('#7d8594'), c.gray || 0);
      mat.emissive.set('#3a3f48').multiplyScalar(1 - L.night * 0.7);
      mat.opacity = al;
      mat.transparent = mat.opacity < 0.99;
    }
    for (const [id, g] of CL) if (!seen.has(id)) g.visible = false;
    // 雨・雪
    const rainAt = new Map(); for (const r of S.rain) rainAt.set(r.y * 6 + r.x, r);
    RAIN.forEach((o, i) => {
      const r = rainAt.get(i), a = r ? r.a : 0;
      o.line.material.opacity = r && !r.snow ? a * 0.95 : 0; o.pts.material.opacity = r && r.snow ? a : 0; o.col.material.opacity = r ? a * (r.snow ? 0.12 : 0.28) : 0; o.col.visible = a > 0;
      if (a <= 0) return;
      const p = o.line.geometry.attributes.position.array, q = o.pts.geometry.attributes.position.array;
      o.sp.forEach((d, k) => {
        const sp = r.snow ? 0.35 : 2.6; let y = 1.35 - ((d[1] + clock * sp) % 1.3);
        const sx = r.snow ? Math.sin(clock * 2 + k) * 0.05 : 0;
        p.set([d[0], y, d[2], d[0] - 0.02, y - 0.12, d[2]], k * 6); q.set([d[0] + sx, y, d[2]], k * 3);
      });
      o.line.geometry.attributes.position.needsUpdate = true; o.pts.geometry.attributes.position.needsUpdate = true;
    });
    // 虹
    const bowAt = new Map(); for (const b of S.bows) bowAt.set(b.y * 6 + b.x, b.a);
    BOW.forEach((g, i) => {
      const a = bowAt.get(i) || 0; g.visible = a > 0.01;
      if (g.visible) { g.children.forEach(m => { m.material.opacity = a * 0.85; }); g.rotation.x = view === 'top' ? -Math.PI / 2 + 0.25 : -0.25; g.scale.setScalar(0.9 + a * 0.1); }
    });
    // 目印の輪
    const mk = new Map(); for (const m of S.marks) mk.set(m.y * 6 + m.x, m);
    RINGS.forEach((r, i) => {
      const m = mk.get(i); const hv = S.hover && S.hover[0] + S.hover[1] * 6 === i;
      if (!m && !hv) { r.material.opacity = 0; return; }
      const col = hv ? '#ffffff' : ({ req: '#f28c28', obs: '#2b7fb8', ok: '#3daa5c', ng: '#e0584a', sel: '#ffffff' })[m.kind] || '#ffffff';
      r.material.color.set(col); r.material.opacity = hv ? 0.9 : (m.kind === 'ng' ? 0.6 + 0.35 * Math.sin(clock * 5) : 0.8);
    });
    // 風見鶏
    if (OBJ.vane) {
      let tgt = OBJ.vane.rotation.y + 0.002;
      if (S.wind) { const d = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0] }[S.wind]; tgt = Math.atan2(d[1], -d[0]); }
      let df = tgt - OBJ.vane.rotation.y; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
      OBJ.vane.rotation.y += df * Math.min(1, dt * 4) + (S.wind ? Math.sin(clock * 9) * 0.004 : 0);
    }
    if (OBJ.boat) { OBJ.boat.position.y = 0.1 + Math.sin(clock * 1.6) * 0.012; OBJ.boat.rotation.z = Math.sin(clock * 1.3) * 0.05; }
    if (OBJ.buoy) OBJ.buoy.position.y = 0.08 + Math.sin(clock * 2) * 0.01;
    if (OBJ.train) OBJ.train.position.x = ((clock * 0.12) % 1.6) - 0.8;
    if (OBJ.sprouts) OBJ.sprouts.forEach((s, i) => { const k = Math.min(1, Math.max(0.05, (S.day - 1 + (i % 3) * 0.2) / 4)); s.scale.set(1, k * 1.6, 1); s.visible = S.day >= 1; });
    if (OBJ.flags) OBJ.flags.visible = S.day === 5;
    if (OBJ.futon) OBJ.futon.visible = S.day === 0 || S.day === 4;
    if (OBJ.roof) { const tr = S.roofOpen ? -1.1 : 0; OBJ.roof.rotation.x += (tr - OBJ.roof.rotation.x) * Math.min(1, dt * 6); }
    if (OBJ.paper) { OBJ.paper.visible = S.fragOnRoof; OBJ.paper.rotation.z = 0.4 + Math.sin(clock * 5) * 0.15; }
    // てるてる坊主
    if (S.teru) {
      TERU.visible = true; TERU.position.set(wx(S.teru.x), 0.95 + Math.sin(clock * 1.5) * 0.02, wz(S.teru.y));
      const rz = S.teru.furu ? Math.PI : 0; TERU.rotation.z += (rz - TERU.rotation.z) * Math.min(1, dt * 6); TERU.rotation.y = Math.sin(clock * 0.9) * 0.3;
      TERU.children[TERU.children.length - 1].visible = !S.teru.furu;
    } else TERU.visible = false;
    // 湯気
    STEAM.children.forEach((s, i) => { const u = (clock * 0.5 + i / 5) % 1; s.position.set(Math.sin(i * 2.1) * 0.15, 0.1 + u * 0.8, Math.cos(i * 1.7) * 0.12); s.material.opacity = S.steam * (1 - u) * 0.7; s.scale.setScalar(0.6 + u); });
    // 日和さん
    if (S.hiyori > 0.01 && OBJ.hilltop) { HIYORI.visible = true; HIYORI.position.copy(OBJ.hilltop); HIYORI.scale.setScalar(Math.min(1, S.hiyori)); }
    else HIYORI.visible = false;
    R.render(SC, CAM);
  }

  /* ---------- マスを選ぶ ---------- */
  const ray = window.THREE ? new THREE.Raycaster() : null;
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    if (mode === '2d') {
      const g = grid2d(); const x = Math.floor((cx - r.left - g.ox) / g.s), y = Math.floor((cy - r.top - g.oy) / g.s);
      if (x < 0 || y < 0 || x >= GW || y >= GH) return null;
      const roofHit = x === 3 && y === 1 && (cy - r.top - g.oy) - y * g.s < g.s * 0.35;
      return { x, y, roof: roofHit };
    }
    const v = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, CAM);
    const objs = PICK.slice(); if (TERU.visible) TERU.traverse(o => { if (o.isMesh) objs.push(o); });
    const hit = ray.intersectObjects(objs, false)[0];
    if (!hit) return null;
    if (hit.object.userData.teru) return { x: S.teru.x, y: S.teru.y, teru: true };
    if (hit.object.userData.roof) return { x: 3, y: 1, roof: true };
    const t = hit.object.userData.tile; return t ? { x: t.x, y: t.y } : null;
  }

  /* ---------- 2Dの地図（3Dが使えないとき） ---------- */
  let X2;
  function init2d() { X2 = canvas.getContext('2d'); resize(); addEventListener('resize', resize); last = performance.now(); raf = requestAnimationFrame(loop); }
  function grid2d() {
    const w = canvas.clientWidth, h = canvas.clientHeight, s = Math.min((w - 40) / GW, (h - 90) / GH);
    return { s, ox: (w - s * GW) / 2, oy: (h - s * GH) / 2 + 14 };
  }
  const K2 = { mt: ['#7d9a5e', '⛰'], forest: ['#6fa05e', '🌲'], shrine: ['#9cc27a', '⛩'], dome: ['#a8c98a', '🔭'], sea: ['#6fb8dc', ''], field: ['#9a7650', '🌱'], mitsu: ['#a7cf86', '🏠'],
    obs: ['#9fcc84', '📡'], shops: ['#c9c1ad', '🏪'], port: ['#8cc4dc', '⚓'], paddy: ['#d7bd5a', '🌾'], school: ['#c7b18c', '🏫'], plaza: ['#cfc6b4', '⛲'], station: ['#b9b3a6', '🚉'],
    hill: ['#8ec070', '🌳'], offing: ['#4ea3d0', '〜'], river: ['#8cc4dc', ''], bank: ['#cbbd9c', '🪨'], houses: ['#a3cc84', '🏘'], park: ['#8fc672', '🛝'], temple: ['#b8ad96', '🛕'], hospital: ['#b4d49a', '🏥'], beach: ['#e6d6a6', '🏖'] };
  function draw2d() {
    const d = Math.min(2, devicePixelRatio || 1), x = X2; x.setTransform(d, 0, 0, d, 0, 0);
    const w = canvas.clientWidth, h = canvas.clientHeight, L = lightAtHex(S.tod);
    x.fillStyle = L; x.fillRect(0, 0, w, h);
    const g = grid2d();
    MD.TILES.forEach(t => {
      const [c, e] = K2[t.kind]; x.fillStyle = c; x.fillRect(g.ox + t.x * g.s + 2, g.oy + t.y * g.s + 2, g.s - 4, g.s - 4);
      if (S.snow > 0) { x.fillStyle = `rgba(245,247,250,${S.snow * 0.8})`; x.fillRect(g.ox + t.x * g.s + 2, g.oy + t.y * g.s + 2, g.s - 4, g.s - 4); }
      x.font = `${g.s * 0.34}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, g.ox + (t.x + 0.5) * g.s, g.oy + (t.y + 0.5) * g.s);
    });
    x.fillStyle = '#5a3c20'; x.font = `bold ${Math.max(11, g.s * 0.2)}px sans-serif`;
    for (let i = 0; i < GW; i++) x.fillText('ABCDEF'[i], g.ox + (i + 0.5) * g.s, g.oy - 12);
    for (let j = 0; j < GH; j++) x.fillText(String(j + 1), g.ox - 12, g.oy + (j + 0.5) * g.s);
    for (const m of S.marks) { x.strokeStyle = ({ req: '#f28c28', obs: '#2b7fb8', ok: '#3daa5c', ng: '#e0584a' })[m.kind] || '#fff'; x.lineWidth = 3; x.strokeRect(g.ox + m.x * g.s + 4, g.oy + m.y * g.s + 4, g.s - 8, g.s - 8); }
    if (S.hover) { x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(g.ox + S.hover[0] * g.s + 4, g.oy + S.hover[1] * g.s + 4, g.s - 8, g.s - 8); }
    for (const r of S.rain) { x.strokeStyle = r.snow ? `rgba(255,255,255,${r.a})` : `rgba(80,130,210,${r.a})`; x.lineWidth = 2; for (let k = 0; k < 7; k++) { const px = g.ox + (r.x + 0.15 + k * 0.1) * g.s, py = g.oy + (r.y + ((clock * 1.5 + k * 0.37) % 1)) * g.s; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py + 6); x.stroke(); } }
    for (const b of S.bows) { ['#e0584a', '#f29a3a', '#f2d14e', '#6ac47a', '#4aa3d8'].forEach((c, k) => { x.strokeStyle = c; x.globalAlpha = b.a; x.lineWidth = 3; x.beginPath(); x.arc(g.ox + (b.x + 0.5) * g.s, g.oy + (b.y + 0.8) * g.s, g.s * (0.38 - k * 0.05), Math.PI, 0); x.stroke(); }); x.globalAlpha = 1; }
    for (const c of S.clouds) {
      if ((c.a == null ? 1 : c.a) < 0.02) continue;
      x.globalAlpha = c.a == null ? 1 : c.a; const gr = Math.round(255 - (c.gray || 0) * 120); x.fillStyle = `rgb(${gr},${gr},${gr + 8})`;
      const cx = g.ox + (c.x + 0.5) * g.s, cy = g.oy + (c.y + 0.42) * g.s, s = g.s * 0.2 * (c.s == null ? 1 : c.s);
      [[-1, 0.2], [0, -0.3], [1, 0.2], [0, 0.3]].forEach(([a, b]) => { x.beginPath(); x.arc(cx + a * s * 0.9, cy + b * s, s, 0, Math.PI * 2); x.fill(); });
      x.strokeStyle = 'rgba(60,70,90,.35)'; x.lineWidth = 1; x.stroke(); x.globalAlpha = 1;
    }
    if (S.teru) { x.font = `${g.s * 0.3}px sans-serif`; x.save(); x.translate(g.ox + (S.teru.x + 0.8) * g.s, g.oy + (S.teru.y + 0.22) * g.s); if (S.teru.furu) x.rotate(Math.PI); x.fillText('👻', 0, 0); x.restore(); }
    if (S.fragOnRoof) { x.fillStyle = '#fffdf4'; x.fillRect(g.ox + 3.6 * g.s, g.oy + 1.08 * g.s, g.s * 0.16, g.s * 0.12); }
  }
  function lightAtHex(t) {
    const k = KEYS; t = Math.max(k[0].t, Math.min(3, t)); let i = 0; while (i < k.length - 2 && t > k[i + 1].t) i++;
    const a = k[i], b = k[i + 1], u = (t - a.t) / (b.t - a.t);
    const h = (s) => [1, 3, 5].map(j => parseInt(s.slice(j, j + 2), 16));
    const A = h(a.sky), B = h(b.sky); return `rgb(${A.map((v, j) => Math.round(v + (B[j] - v) * u)).join(',')})`;
  }

  return { init, S, pick, setView, get mode() { return mode; }, get view() { return view; }, _step: (n) => { for (let i = 0; i < (n || 1); i++) frame(1 / 30); } };
})();
