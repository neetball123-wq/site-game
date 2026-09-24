/* =========================================================
   告知事項あり — 3Dの部屋（three.js）と、スマホカメラの映像
   座標はメートル。x＝東、y＝上、z＝南。間取り図と同じ寸法。
   ========================================================= */
window.KW = (() => {
  const W = 324, H = 576;
  let ok = false, R, S, cam, gl, out, ctx;
  const O = {};                 // 名前つきの物
  const st = { mode: 'on', lights: true, closet: false, panel: false, door: false, drawer: false, name: 'あなた', mirror: false };
  const fx = { shake: 0, glitch: 0, flash: 0, flashC: '#fff', static: 0 };
  let tw = null, t = 0, last = 0;
  const noise = [];

  /* ---------- 絵（キャンバスで作る質感） ---------- */
  function cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function speckle(g, w, h, n, a, dark) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${dark ? '0,0,0' : '255,255,255'},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }
  const TEX = {};
  function tex(key, c, rx, ry) {
    const k = key + ':' + rx + ':' + ry;
    if (TEX[k]) return TEX[k];
    const tt = new THREE.CanvasTexture(c);
    tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(rx || 1, ry || 1);
    return (TEX[k] = tt);
  }
  const IMG = {};
  function makeImages() {
    IMG.paper = cnv(128, 128, (g, w, h) => { g.fillStyle = '#d8d3c9'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,.025)'; g.fillRect(x, 0, 1, h); } speckle(g, w, h, 500, .06, true); speckle(g, w, h, 200, .08); });
    IMG.wood = cnv(256, 256, (g, w, h) => { for (let y = 0; y < h; y += 32) { const c = 70 + Math.random() * 25; g.fillStyle = `rgb(${c + 40},${c + 18},${c - 12})`; g.fillRect(0, y, w, 32); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, w, 1); const off = Math.random() * w; g.fillRect(off, y, 1, 32); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,20,0,.12)'; g.fillRect(Math.random() * w, y + Math.random() * 32, 20 + Math.random() * 40, 1); } } });
    IMG.tile = cnv(128, 128, (g, w, h) => { g.fillStyle = '#8b8a86'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5d5c59'; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } speckle(g, w, h, 400, .12, true); });
    IMG.concrete = cnv(128, 128, (g, w, h) => { g.fillStyle = '#77756f'; g.fillRect(0, 0, w, h); speckle(g, w, h, 900, .15, true); speckle(g, w, h, 300, .08); });
    IMG.ub = cnv(128, 128, (g, w, h) => { g.fillStyle = '#cdd4d6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 63, w, 2); g.fillRect(63, 0, 2, h); speckle(g, w, h, 150, .05, true); });
    IMG.ceil = cnv(64, 64, (g, w, h) => { g.fillStyle = '#cbc6bc'; g.fillRect(0, 0, w, h); speckle(g, w, h, 150, .05, true); });
    IMG.curtain = cnv(128, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 150 + Math.sin(x / 5) * 25; g.fillStyle = `rgb(${v + 20},${v + 12},${v - 8})`; g.fillRect(x, 0, 1, h); } });
    IMG.city = cnv(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070d'); gr.addColorStop(1, '#141a2a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const y = 120 + Math.random() * 130; g.fillStyle = `rgba(255,${200 + Math.random() * 55},${150 + Math.random() * 80},${.3 + Math.random() * .7})`; g.fillRect(Math.random() * w, y, 1 + Math.random() * 2, 1 + Math.random() * 2); } });
    IMG.plate = cnv(128, 64, (g, w, h) => { g.fillStyle = '#e9e6de'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('204', w / 2, h / 2 + 2); });
    IMG.hatch = cnv(128, 128, (g, w, h) => { g.fillStyle = '#9a9890'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c21e'; g.fillRect(8, 8, w - 16, 20); g.fillStyle = '#111'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillText('避難ハッチ', w / 2, 24); g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#333'; g.fillRect(52, 70, 24, 10); });
    IMG.board = cnv(256, 256, (g, w, h) => { g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8231c'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; ['非常の際は', 'ここを破って', '隣戸へ避難', 'できます'].forEach((s, i) => g.fillText(s, w / 2, 60 + i * 28)); });
    IMG.brk = (off) => cnv(256, 160, (g, w, h) => { g.fillStyle = '#e4e2dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#333'; g.fillRect(14, 30, 50, 90); g.fillStyle = off ? '#777' : '#c33'; g.fillRect(28, off ? 90 : 42, 22, 22); g.font = 'bold 12px sans-serif'; g.fillStyle = '#222'; g.fillText('主幹', 24, 140); ['洋室', 'キッチン', '浴室', 'エアコン', ''].forEach((s, i) => { g.fillStyle = '#333'; g.fillRect(84 + i * 33, 40, 24, 58); g.fillStyle = '#ddd'; g.fillRect(88 + i * 33, 46, 16, 16); g.fillStyle = '#222'; g.font = '11px sans-serif'; g.fillText(s, 84 + i * 33, 118); }); });
    IMG.stain = cnv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 60); gr.addColorStop(0, 'rgba(80,55,25,.55)'); gr.addColorStop(1, 'rgba(80,55,25,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,25,10,.5)'; g.beginPath(); g.ellipse(48, 56, 7, 9, 0, 0, 7); g.ellipse(80, 56, 7, 9, 0, 0, 7); g.fill(); g.fillRect(56, 84, 16, 5); });
    IMG.tag = cnv(128, 64, (g, w, h) => { g.fillStyle = '#f2eee4'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = 'bold 26px serif'; g.textAlign = 'center'; g.fillText('久住', w / 2, 42); });
    IMG.mirror = (face) => cnv(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#39424a'); gr.addColorStop(1, '#171b1f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#0c0e10'; g.fillRect(20, 30, 40, 98); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(90, 0, 10, h); if (face) { g.fillStyle = '#050505'; g.beginPath(); g.ellipse(46, 60, 24, 40, 0, 0, 7); g.fill(); g.fillStyle = '#d8d2c6'; g.beginPath(); g.ellipse(46, 56, 13, 17, 0, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.ellipse(41, 53, 3, 4, 0, 0, 7); g.ellipse(52, 53, 3, 4, 0, 0, 7); g.fill(); g.fillRect(32, 36, 28, 10); g.fillRect(34, 40, 4, 34); } });
    IMG.hands = () => cnv(512, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const hand = (x, y, n, rot) => {
        g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = 'rgba(10,10,10,.85)';
        g.beginPath(); g.ellipse(0, 0, 30, 34, 0, 0, 7); g.fill();
        for (let i = 0; i < n; i++) { const a = -0.5 + i * 0.33; g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -46, 9, 17, 0, 0, 7); g.fill(); g.restore(); }
        g.strokeStyle = 'rgba(10,10,10,.5)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-18 + i * 12, 30); g.lineTo(-20 + i * 12 + Math.random() * 6, 60 + Math.random() * 30); g.stroke(); }
        g.restore();
      };
      const sc = [[72, 80], [440, 80], [72, 430], [440, 430]];
      sc.forEach(([x, y]) => { g.fillStyle = '#222'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.strokeStyle = '#999'; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.stroke(); });
      hand(140, 150, 3, -0.4); hand(372, 150, 2, 0.4); hand(140, 360, 1, -0.3); hand(372, 360, 4, 0.3);
      g.fillStyle = 'rgba(20,20,20,.8)'; g.font = 'bold 44px serif'; g.textAlign = 'center';
      g.fillText('ナナエ', 256, 250); g.font = 'bold 28px serif'; g.fillText('ここ', 256, 300);
      g.font = '22px serif'; g.fillText(st.name + 'さん', 256, 470);
      for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); const x = 180 + Math.random() * 150, y = 200 + Math.random() * 200; g.moveTo(x, y); g.lineTo(x + Math.random() * 8 - 4, y + 20 + Math.random() * 40); g.stroke(); }
    });
    for (let k = 0; k < 4; k++) noise.push(cnv(W, H, (g, w, h) => { const d = g.createImageData(w, h); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }));
  }

  /* ---------- 物を置く道具 ---------- */
  const M = {};
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  function mat(img, rx, ry, extra) { return lam(Object.assign({ map: tex(img, IMG[img], rx, ry) }, extra || {})); }
  function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (parent || S).add(b); return b; }
  // 範囲で置く（x0..x1, y0..y1, z0..z1）
  function blk(x0, x1, y0, y1, z0, z1, m, parent) { return box(Math.max(.001, x1 - x0), Math.max(.001, y1 - y0), Math.max(.001, z1 - z0), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent); }
  function plane(w, h, m, x, y, z, ry, rx, parent) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry || 0; p.rotation.x = rx || 0; (parent || S).add(p); return p; }

  function build() {
    M.wall = mat('paper', 3, 2); M.wood = mat('wood', 3, 5); M.tile = mat('tile', 2, 2); M.ceil = mat('ceil', 4, 6);
    M.conc = mat('concrete', 6, 3); M.ub = mat('ub', 3, 2); M.curtain = mat('curtain', 2, 1);
    M.white = lam({ color: 0xe8e6e0 }); M.steel = lam({ color: 0x9aa1a6 }); M.dark = lam({ color: 0x1a1a1a }); M.door = lam({ color: 0x4d535a });
    M.frame = lam({ color: 0xa7abae }); M.glass = new THREE.MeshLambertMaterial({ color: 0x223044, transparent: true, opacity: .35 });
    M.black = new THREE.MeshBasicMaterial({ color: 0x000000 }); M.cab = lam({ color: 0xd9d4c6 }); M.salt = lam({ color: 0xf4f3ee });
    const Y = 2.4, T = .06;
    /* 床・天井 */
    blk(0, 2.73, -.02, 0, 0, 6.37, M.wood);
    blk(.001, .909, 0, .012, .001, .909, M.tile);
    blk(0, 2.73, Y, Y + .02, 0, 6.37, M.ceil);
    /* 外壁 */
    blk(-T, 0, 0, Y, 0, 6.37, M.wall); blk(2.73, 2.73 + T, 0, Y, 0, 6.37, M.wall);
    blk(-T, .05, 0, Y, -T, 0, M.wall); blk(.86, 2.73 + T, 0, Y, -T, 0, M.wall); blk(.05, .86, 2.0, Y, -T, 0, M.wall);
    blk(-T, .3, 0, Y, 6.37, 6.37 + T, M.wall); blk(2.43, 2.73 + T, 0, Y, 6.37, 6.37 + T, M.wall); blk(.3, 2.43, 2.05, Y, 6.37, 6.37 + T, M.wall); blk(.3, 2.43, 0, .08, 6.37, 6.37 + T, M.wall);
    /* 中の壁 */
    blk(.91, .91 + T, 0, Y, 0, .12, M.wall); blk(.91, .91 + T, .8, Y, .8, .91, M.wall); blk(.91, .91 + T, 2.0, Y, .12, .8, M.wall);
    blk(.91, .91 + T, 0, Y, 1.82, 2.73, M.wall);
    blk(.91, 2.73, 0, Y, .91, .91 + T, M.wall);
    blk(.91, 2.73, 0, Y, 1.82 - T, 1.82, M.wall);
    O.back = blk(.97, 2.73, 0, Y, 2.275, 2.275 + .02, M.wall);
    blk(0, .05, 0, Y, 2.73, 2.73 + T, M.wall); blk(.86, .91, 0, Y, 2.73, 2.73 + T, M.wall); blk(.05, .86, 2.0, Y, 2.73, 2.73 + T, M.wall);
    blk(.91, 2.73, 2.0, Y, 2.73, 2.73 + T, M.wall);
    /* ブレーカー（玄関の西の壁、高いところ） */
    blk(0, .06, 1.82, 2.1, .12, .5, M.white);
    plane(.36, .23, lam({ map: tex('brk', IMG.brk(false)) }), .062, 1.96, .31, Math.PI / 2);
    /* 浴室（UB） */
    blk(.97, 2.72, .011, .02, .01, .9, lam({ color: 0xbfc8cb }));
    blk(2.7, 2.72, 0, Y, 0, .91, M.ub); blk(.97, 2.72, 0, Y, .01, .03, M.ub); blk(.97, 2.72, 0, Y, .88, .9, M.ub);
    const tub = blk(1.75, 2.7, 0, .55, .05, .87, M.white); blk(1.82, 2.64, .45, .56, .12, .8, lam({ color: 0x9fb0b6 }));
    blk(1.2, 1.55, .75, .85, .04, .3, M.white);
    O.mirror = plane(.5, .45, lam({ map: tex('mir0', IMG.mirror(false)) }), 2.695, 1.45, .45, -Math.PI / 2);
    O.mirrorFace = lam({ map: tex('mir1', IMG.mirror(true)) }); O.mirrorN = O.mirror.material;
    /* キッチン */
    blk(.97, 2.72, 0, .85, 1.22, 1.76, M.cab); blk(.97, 2.72, .85, .88, 1.2, 1.76, M.steel);
    blk(1.15, 1.7, .78, .88, 1.3, 1.65, M.dark);
    [[2.2, 1.45], [2.5, 1.45]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .02, 16), M.dark); c.position.set(x, .9, z); S.add(c); });
    blk(.97, 2.72, 1.6, 2.3, 1.45, 1.76, M.cab); blk(2.05, 2.72, 1.55, 1.6, 1.4, 1.76, M.steel);
    O.drawers = [];
    [1.0, 1.58, 2.16].forEach((x, i) => { const d = blk(x, x + .54, .52, .8, 1.2, 1.23, lam({ color: 0xe3dfd3 })); blk(x + .2, x + .34, .64, .67, 1.19, 1.2, M.steel, d); O.drawers.push(d); });
    /* 洋室 */
    O.lamp = new THREE.Mesh(new THREE.CylinderGeometry(.25, .28, .06, 24), new THREE.MeshBasicMaterial({ color: 0xf6f6ee })); O.lamp.position.set(1.36, 2.36, 4.55); S.add(O.lamp);
    blk(.001, .25, 1.95, 2.25, 4.1, 4.9, M.white);
    plane(.35, 1.9, M.curtain, .45, 1.05, 6.33, 0); plane(.35, 1.9, M.curtain, 2.28, 1.05, 6.33, 0);
    blk(.3, 2.43, .08, 2.05, 6.36, 6.37, M.glass); blk(1.35, 1.39, .08, 2.05, 6.35, 6.38, M.frame);
    [[.18, 6.2], [2.55, 6.2], [2.55, 2.95], [.18, 2.95]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(.035, .07, 12), M.salt); c.position.set(x, .045, z); S.add(c); blk(x - .05, x + .05, 0, .01, z - .05, z + .05, M.white); });
    plane(.9, .9, new THREE.MeshLambertMaterial({ map: tex('stain', IMG.stain), transparent: true }), 1.9, 2.395, 3.4, 0, Math.PI / 2);
    /* クローゼット */
    O.doorsL = blk(.93, 1.83, 0, 2.0, 2.745, 2.765, lam({ color: 0xe6e1d6 })); O.doorsR = blk(1.82, 2.72, 0, 2.0, 2.765, 2.785, lam({ color: 0xe1dccf }));
    blk(1.7, 1.73, .9, 1.2, 2.785, 2.79, M.steel, O.doorsL); blk(1.86, 1.89, .9, 1.2, 2.79, 2.795, M.steel, O.doorsR);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, 1.75, 8), M.steel); rod.rotation.z = Math.PI / 2; rod.position.set(1.84, 1.72, 2.5); S.add(rod);
    blk(.97, 2.72, 1.84, 1.87, 2.28, 2.73, M.cab);
    O.suit = blk(1.25, 1.85, 0, .26, 2.33, 2.7, lam({ color: 0x2c3a52 })); plane(.12, .06, lam({ map: tex('tag', IMG.tag) }), 1.55, .27, 2.52, 0, -Math.PI / 2);
    O.hands = plane(1.72, 1.9, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(IMG.hands()), transparent: true }), 1.84, 1.0, 2.298, 0); O.hands.visible = false;
    /* 壁の中（すきま 455mm） */
    blk(.97, 2.72, 0, .01, 1.82, 2.275, M.conc);
    const clothes = lam({ color: 0x2f3645 }), skin = lam({ color: 0xcdbfaf }), hair = lam({ color: 0x0b0b0b }), bone = lam({ color: 0xd8cfbb }), dress = lam({ color: 0x8e8778 });
    O.gap = new THREE.Group(); S.add(O.gap); O.gap.visible = false;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.12, .13, .55, 10), clothes); body.rotation.z = Math.PI / 2; body.position.set(1.45, .14, 2.08); O.gap.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), skin); head.position.set(1.12, .16, 2.1); O.gap.add(head);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 10), hair); hr.scale.set(1, .8, 1.1); hr.position.set(1.09, .2, 2.1); O.gap.add(hr);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, .45, 8), clothes); leg.rotation.z = 1.2; leg.position.set(1.82, .1, 2.02); O.gap.add(leg);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), skin); hand.position.set(1.3, .06, 2.22); O.gap.add(hand);
    [[2.0, .12, 1.95, .3, .22, .2, 0x3b2b25], [2.25, .08, 2.15, .25, .16, .18, 0x1f3326], [1.7, .05, 2.2, .14, .09, .28, 0x222222]].forEach(([x, y, z, w, h, d, c]) => box(w, h, d, lam({ color: c }), x, y, z, O.gap));
    const ph = plane(.07, .13, new THREE.MeshBasicMaterial({ color: 0x8fa9c4 }), 1.95, .012, 2.2, 0, -Math.PI / 2, O.gap);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(.085, 12, 10), bone); skull.position.set(2.5, .62, 1.9); O.gap.add(skull);
    [[-.03, .035], [.03, .035]].forEach(([dx, dz]) => { const e = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), M.black); e.position.set(2.5 + dx, .63, 1.9 + dz + .03); O.gap.add(e); });
    const cloth = new THREE.Mesh(new THREE.ConeGeometry(.24, .55, 12), dress); cloth.position.set(2.5, .27, 1.93); O.gap.add(cloth);
    /* 外廊下（はじまり） */
    blk(-4, 5, -.05, 0, -1.3, 0, M.conc); blk(-4, 5, 2.6, 2.7, -1.3, 0, M.conc);
    O.fdoor = new THREE.Group(); O.fdoor.position.set(.05, 0, -.03); S.add(O.fdoor);
    blk(0, .81, 0, 2.0, -.04, 0, M.door, O.fdoor); blk(.66, .74, .95, 1.05, -.08, -.04, M.steel, O.fdoor); blk(.35, .45, 1.55, 1.58, -.05, -.04, M.dark, O.fdoor);
    plane(.18, .09, lam({ map: tex('plate', IMG.plate) }), 1.05, 1.55, -.065, Math.PI);
    blk(-4, 5, 0, 1.1, -1.32, -1.25, M.conc); blk(-4, 5, 1.08, 1.12, -1.34, -1.23, M.frame);
    blk(-4, -.1, 0, 2.6, -.06, 0, M.conc); blk(2.8, 5, 0, 2.6, -.06, 0, M.conc);
    O.tube = blk(.2, 1.1, 2.55, 2.58, -.7, -.66, new THREE.MeshBasicMaterial({ color: 0xeef6ff }));
    plane(20, 8, new THREE.MeshBasicMaterial({ map: tex('city', IMG.city) }), .5, -1, -14, 0);
    /* バルコニー */
    blk(0, 2.73, -.08, 0, 6.43, 7.28, M.conc);
    for (let x = .05; x < 2.73; x += .11) blk(x, x + .025, 0, 1.08, 7.24, 7.27, M.frame);
    blk(0, 2.73, 1.08, 1.12, 7.22, 7.29, M.frame);
    plane(.9, .1, M.wall, 1.36, 2.35, 6.9, 0, Math.PI / 2);
    plane(.6, .5, lam({ map: tex('hatch', IMG.hatch) }), 2.1, .006, 6.85, 0, -Math.PI / 2);
    plane(.85, 1.6, lam({ map: tex('board', IMG.board) }), .02, .85, 6.85, Math.PI / 2);
    plane(40, 16, new THREE.MeshBasicMaterial({ map: tex('city', IMG.city) }), 2, -2, 30, Math.PI);
    /* 建物の外（最後に見上げる） */
    blk(-12, 12, -3.0, -2.9, 0, 30, M.conc);
    blk(-12, -.1, -2.9, 2.6, 6.35, 6.45, M.conc); blk(2.8, 12, -2.9, 2.6, 6.35, 6.45, M.conc); blk(-.1, 2.8, -2.9, 0, 6.35, 6.45, M.conc);
    [[-9, 1], [-6, 1], [-3, 1], [-9, -1.9], [-6, -1.9], [-3, -1.9], [.8, -1.9]].forEach(([x, y]) => plane(1.4, .9, new THREE.MeshBasicMaterial({ color: Math.random() < .3 ? 0x6d6247 : 0x0d0f14 }), x, y, 6.46, 0));
    O.lampPost = new THREE.PointLight(0xffd9a0, 1.2, 12, 2); O.lampPost.position.set(-2, -.6, 13); S.add(O.lampPost);
    /* ナナエ */
    O.nanae = figure(); O.nanae.visible = false; S.add(O.nanae);
  }
  function figure() {
    const g = new THREE.Group();
    const pale = lam({ color: 0xd4cfc4, emissive: 0x2a2826 }), dressM = lam({ color: 0xb5ae9f, emissive: 0x1c1b18 }), hair = lam({ color: 0x050505 }), black = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(.13, .3, 1.25, 12), dressM); dr.position.y = .62; g.add(dr);
    const to = new THREE.Mesh(new THREE.CylinderGeometry(.14, .13, .35, 12), dressM); to.position.y = 1.36; g.add(to);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 12), pale); hd.scale.set(.9, 1.15, .95); hd.position.y = 1.62; g.add(hd);
    const top = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), hair); top.scale.set(1, .7, 1.05); top.position.set(0, 1.7, -.01); g.add(top);
    box(.27, .95, .07, hair, 0, 1.2, -.09, g);
    [-.055, .055].forEach(x => box(.045, .5, .03, hair, x, 1.45, .1, g));
    [-.035, .035].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.017, 8, 6), black); e.position.set(x, 1.64, .1); g.add(e); });
    [-.18, .18].forEach(x => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .022, .7, 8), pale); a.position.set(x, 1.0, .02); a.rotation.z = x > 0 ? -.06 : .06; g.add(a); });
    return g;
  }

  /* ---------- 明かり ---------- */
  const L = {};
  function lights() {
    L.hemi = new THREE.HemisphereLight(0xc9d2e0, 0x2a2622, .45); S.add(L.hemi);
    L.pts = [[1.36, 2.2, 4.5, 1.1], [.45, 2.2, 1.4, .7], [1.8, 2.2, 1.35, .6], [1.8, 2.1, .45, .55], [1.8, 1.9, 2.55, .25]].map(([x, y, z, i]) => { const p = new THREE.PointLight(0xf2f5ff, i, 5, 2); p.position.set(x, y, z); p.userData.i = i; S.add(p); return p; });
    L.out = new THREE.PointLight(0xe6f2ff, .9, 6, 2); L.out.position.set(.6, 2.3, -.7); S.add(L.out);
    L.win = new THREE.PointLight(0x9fb6ff, 0, 5, 2); L.win.position.set(1.36, 1.9, 5.3); S.add(L.win);
    L.moon = new THREE.DirectionalLight(0x6c83b8, .25); L.moon.position.set(3, 6, 14); S.add(L.moon);
    L.torch = new THREE.SpotLight(0xfff0d0, 0, 9, .5, .55, 1.4); L.torch.position.set(0, -.05, 0); cam.add(L.torch);
    L.tt = new THREE.Object3D(); L.tt.position.set(0, -.1, -2); cam.add(L.tt); L.torch.target = L.tt;
    S.add(cam);
    S.fog = new THREE.FogExp2(0x000000, .05);
  }
  function applyMode() {
    const m = st.mode, on = m === 'on' && st.lights;
    L.hemi.intensity = on ? .45 : m === 'nv' ? .22 : m === 'torch' ? .04 : m === 'street' ? .1 : .0;
    L.pts.forEach(p => { p.intensity = on ? p.userData.i : 0; });
    O.lamp.material.color.set(on ? 0xf6f6ee : 0x2a2a2a);
    L.torch.intensity = m === 'torch' ? 2.4 : m === 'nv' ? 3.2 : 0;
    L.moon.intensity = m === 'black' ? 0 : .25;
    L.win.intensity = m === 'street' ? 1.4 : 0;
    O.lampPost.intensity = m === 'street' ? 2.2 : 0;
    O.hands.visible = m === 'nv' && !st.panel;
    S.fog.density = on ? .03 : .09;
  }

  /* ---------- カメラ（担当者のスマホ） ---------- */
  const V = {
    door_out: [[-.75, 1.55, -1.12], [.55, 1.2, 0]],
    genkan: [[.45, 1.5, .3], [.45, 1.25, 3.2]],
    breaker: [[.45, 1.6, .55], [.03, 1.95, .28]],
    kitchen: [[.45, 1.5, 1.05], [1.9, .8, 1.6]],
    bath: [[.62, 1.5, .45], [2.6, 1.2, .45]],
    room: [[.5, 1.5, 3.05], [1.55, 1.15, 6.37]],
    closet: [[1.82, 1.3, 4.45], [1.82, 1.05, 2.3]],
    behind: [[1.82, 1.45, 3.5], [1.8, 1.4, 6.0]],
    wall: [[1.5, 1.3, 2.62], [1.4, .08, 2.05]],
    wall2: [[2.15, 1.3, 2.62], [2.5, .45, 1.92]],
    corridor: [[.5, 1.5, 3.3], [.45, 1.3, .2]],
    balcony: [[1.3, 1.5, 6.15], [2.1, .05, 6.85]],
    side: [[1.3, 1.45, 6.7], [0, .9, 6.85]],
    down: [[2.1, 1.3, 6.7], [2.1, -2.8, 6.95]],
    outside: [[-.6, -1.3, 12.5], [1.3, 1.0, 6.37]]
  };
  const P = { p: new THREE.Vector3(), l: new THREE.Vector3() };
  function go(name, opt) {
    opt = opt || {};
    const v = V[name];
    if (!v) return Promise.resolve();
    const to = { p: new THREE.Vector3(...v[0]), l: new THREE.Vector3(...v[1]) };
    if (!ok || opt.cut) { P.p.copy(to.p); P.l.copy(to.l); tw = null; return Promise.resolve(); }
    return new Promise((res) => { tw = { from: { p: P.p.clone(), l: P.l.clone() }, to, t0: performance.now(), dur: opt.dur || 1500, walk: opt.walk !== false, res }; });
  }
  const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  /* ---------- 映像の後処理 ---------- */
  function post(now) {
    const m = st.mode;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    if (m === 'black' || !ok) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    else {
      const sh = fx.shake;
      const sx = (Math.random() - .5) * sh * 14, sy = (Math.random() - .5) * sh * 14;
      if (m === 'nv') {
        ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.65)';
        ctx.drawImage(gl, sx, sy, W, H);
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#6dff96'; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(10,40,16,.35)'; ctx.fillRect(0, 0, W, H);
      } else {
        ctx.drawImage(gl, sx, sy, W, H);
        if (m === 'torch') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#ffe9c8'; ctx.fillRect(0, 0, W, H); }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    // ざらつき
    ctx.globalAlpha = m === 'nv' ? .22 : m === 'black' ? .35 : .09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(noise[(now / 50 | 0) % noise.length], 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (fx.static > 0) { ctx.globalAlpha = Math.min(1, fx.static); ctx.drawImage(noise[(now / 30 | 0) % noise.length], 0, 0); ctx.globalAlpha = 1; }
    // ずれ
    if (fx.glitch > 0) {
      for (let i = 0; i < 6; i++) { const y = Math.random() * H, h = 4 + Math.random() * 30, dx = (Math.random() - .5) * 60 * fx.glitch; ctx.drawImage(out, 0, y, W, h, dx, y, W, h); }
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,0,60,${.12 * fx.glitch})`; ctx.fillRect(Math.random() * 6, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    // 走査線と周辺減光
    ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    const g = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (fx.flash > 0) { ctx.globalAlpha = Math.min(1, fx.flash); ctx.fillStyle = fx.flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  /* ---------- 毎コマ ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    step(now);
  }
  function step(now) {
    now = now || performance.now();
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
    if (ok) {
      if (tw) {
        const k = Math.min(1, (now - tw.t0) / tw.dur), e = ease(k);
        P.p.lerpVectors(tw.from.p, tw.to.p, e); P.l.lerpVectors(tw.from.l, tw.to.l, e);
        if (tw.walk) P.p.y += Math.abs(Math.sin(k * Math.PI * 5)) * .035 * (1 - k);
        if (k >= 1) { const r = tw.res; tw = null; r(); }
      }
      const sway = .012, n1 = Math.sin(t * 1.3) * sway + Math.sin(t * 3.1) * sway * .4, n2 = Math.cos(t * 1.1) * sway + Math.sin(t * 2.3) * sway * .5;
      cam.position.copy(P.p); cam.position.x += n1 * .5; cam.position.y += n2 * .5;
      cam.lookAt(P.l.x + n1 * 2, P.l.y + n2 * 2, P.l.z);
      L.out.intensity = Math.random() < .04 ? .1 : .9;
      O.tube.material.color.set(L.out.intensity < .5 ? 0x333333 : 0xeef6ff);
      if (O.nanae.visible && O.nanae.userData.face) O.nanae.lookAt(cam.position.x, 0, cam.position.z);
      R.render(S, cam);
    }
    post(now);
    fx.shake = Math.max(0, fx.shake - dt * 2.2); fx.glitch = Math.max(0, fx.glitch - dt * 1.6);
    fx.flash = Math.max(0, fx.flash - dt * 3); fx.static = Math.max(0, fx.static - dt * 1.2);
  }

  /* ---------- 外から使う ---------- */
  function init(canvas, name) {
    out = canvas; ctx = out.getContext('2d'); out.width = W; out.height = H;
    st.name = name || 'あなた';
    try {
      if (!window.THREE) throw new Error('no three');
      gl = document.createElement('canvas'); gl.width = W; gl.height = H;
      R = new THREE.WebGLRenderer({ canvas: gl, antialias: false, powerPreference: 'low-power' });
      R.setPixelRatio(1); R.setSize(W, H, false);
      S = new THREE.Scene(); S.background = new THREE.Color(0x000000);
      cam = new THREE.PerspectiveCamera(72, W / H, .05, 60);
      makeImages(); build(); lights(); applyMode();
      go('door_out', { cut: true });
      ok = true;
    } catch (e) { ok = false; if (!noise.length) makeImages(); }
    requestAnimationFrame(frame);
    return ok;
  }
  function mode(m) { st.mode = m; if (ok) applyMode(); }
  function set(k, v) {
    st[k] = v;
    if (!ok) return;
    if (k === 'lights') applyMode();
    if (k === 'door') O.fdoor.rotation.y = v ? -1.2 : 0;
    if (k === 'closet') { O.doorsL.visible = O.doorsR.visible = !v; }
    if (k === 'drawer') O.drawers[0].position.z = v ? 1.43 : 1.215;
    if (k === 'panel') { O.back.visible = !v; O.hands.visible = !v && st.mode === 'nv'; O.gap.visible = !!v; }
    if (k === 'mirror') O.mirror.material = v ? O.mirrorFace : O.mirrorN;
    if (k === 'name') { O.hands.material.map = new THREE.CanvasTexture(IMG.hands()); O.hands.material.needsUpdate = true; }
  }
  function nanae(pos, face) {
    if (!ok) return;
    if (!pos) { O.nanae.visible = false; return; }
    O.nanae.visible = true; O.nanae.position.set(pos[0], pos[1] || 0, pos[2]); O.nanae.rotation.y = pos[3] || 0; O.nanae.userData.face = face !== false;
  }
  function hit(kind, amt) {
    amt = amt == null ? 1 : amt;
    if (kind === 'shake') fx.shake = Math.max(fx.shake, amt);
    if (kind === 'glitch') fx.glitch = Math.max(fx.glitch, amt);
    if (kind === 'static') fx.static = Math.max(fx.static, amt);
    if (kind === 'flash') { fx.flash = amt; fx.flashC = '#fff'; }
    if (kind === 'red') { fx.flash = amt; fx.flashC = '#5a0000'; }
  }
  return { init, go, mode, set, nanae, hit, get ok() { return ok; }, get view() { return P; }, _step: step, V };
})();
