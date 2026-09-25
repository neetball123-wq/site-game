/* =========================================================
   深夜ラジオの投稿職人 — ガラスの向こうのブース（three.js r128 ＋ ブルーム）
   カメラは副調整室の側（z が正）。ブースの奥の壁（z=-2）に大きな窓があり、港と灯台が見える。
   ========================================================= */
window.BB = (() => {
  'use strict';
  const S = { onair: 0, host: 'idle', clock: '25:00', sec: 0, handT: -1, hold: 0, end: 0, endT: 0, blink: 0, talkAmp: 0, mx: 0, my: 0, phones: 1, song: 0 };
  let R, SC, CAM, COMP = null, FIN = null, BLOOM = null, mode = null, canvas, clock = 0, last = 0, paused = false;
  const TEX = {}, TICK = [];
  const H = {};   // ツジモトさんの体
  const P = {};   // 動かすもの
  const lin = (h) => new THREE.Color(h).convertSRGBToLinear();
  const JP = '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  /* ---------- テクスチャ ---------- */
  function ctex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); draw(x, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    t.userData = { c, x, draw }; return t;
  }
  function redraw(t) { const { c, x, draw } = t.userData; x.clearRect(0, 0, c.width, c.height); draw(x, c.width, c.height); t.needsUpdate = true; }
  function glowTex() {
    return ctex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,.5)'); g.addColorStop(0.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  }
  function facade(cols, rows, wall, litP, warm) {
    const W = 32 * cols, Hh = 32 * rows, lit = [];
    for (let i = 0; i < cols * rows; i++) lit.push(rnd() < litP);
    const paint = (x, em) => {
      x.fillStyle = em ? '#000' : wall; x.fillRect(0, 0, W, Hh);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const L = lit[r * cols + c], px = c * 32 + 8, py = r * 32 + 9;
        if (em) { if (L) { x.fillStyle = warm && (r * 7 + c) % 5 ? '#ffcf8f' : '#cfe2ff'; x.fillRect(px, py, 16, 13); } continue; }
        x.fillStyle = L ? '#e8c890' : '#0d1018'; x.fillRect(px, py, 16, 13);
      }
    };
    return { map: ctex(W, Hh, (x) => paint(x, false)), em: ctex(W, Hh, (x) => paint(x, true)) };
  }
  function posterTex(kind) {
    return ctex(256, 360, (x, w, h) => {
      if (kind === 'hoshi') {
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#27204a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; x.fillRect(rnd() * w, rnd() * h * 0.7, 1.5, 1.5); }
        x.strokeStyle = 'rgba(232,201,138,.8)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(60, 90); x.lineTo(120, 70); x.lineTo(170, 120); x.lineTo(200, 90); x.stroke();
        x.fillStyle = '#e8c98a'; x.font = `700 30px ${JP}`; x.textAlign = 'center'; x.fillText('最終投影', w / 2, 250);
        x.font = `500 16px ${JP}`; x.fillText('みなと天文館', w / 2, 285); x.font = `400 13px ${JP}`; x.fillText('1985 — 2026', w / 2, 310);
      } else if (kind === 'bus') {
        x.fillStyle = '#efe7d4'; x.fillRect(0, 0, w, h); x.fillStyle = '#2d5a55'; x.fillRect(0, 0, w, 110);
        x.fillStyle = '#f2eee2'; x.font = `700 26px ${JP}`; x.textAlign = 'center'; x.fillText('夜ノ森線', w / 2, 55); x.font = `500 15px ${JP}`; x.fillText('ありがとう、最終便', w / 2, 85);
        x.fillStyle = '#c8742a'; x.fillRect(40, 170, 176, 70); x.fillStyle = '#1a1a1a'; x.beginPath(); x.arc(80, 245, 16, 0, 7); x.arc(176, 245, 16, 0, 7); x.fill();
        x.fillStyle = '#ffd9a0'; for (let i = 0; i < 4; i++) x.fillRect(52 + i * 40, 182, 30, 24);
        x.fillStyle = '#555'; x.font = `400 13px ${JP}`; x.fillText('夜ノ森交通', w / 2, 320);
      } else if (kind === 'yofu') {
        x.fillStyle = '#12192e'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#f5e6b8'; x.beginPath(); x.arc(128, 120, 60, 0, 7); x.fill(); x.fillStyle = '#12192e'; x.beginPath(); x.arc(152, 104, 56, 0, 7); x.fill();
        x.fillStyle = '#f5e6b8'; x.font = `900 34px ${JP}`; x.textAlign = 'center'; x.fillText('よふかし', w / 2, 240); x.fillText('通信', w / 2, 280);
        x.font = `500 13px ${JP}`; x.fillText('潮見放送 AM1062', w / 2, 320);
      } else if (kind === 'board') {
        x.fillStyle = '#9a7650'; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(60,40,20,${rnd() * 0.25})`; x.fillRect(rnd() * w, rnd() * h, 3, 3); }
        const pin = (px, py, ww, hh, col, rot, draw) => { x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = col; x.fillRect(-ww / 2, -hh / 2, ww, hh); if (draw) draw(); x.fillStyle = '#c33'; x.beginPath(); x.arc(0, -hh / 2 + 6, 4, 0, 7); x.fill(); x.restore(); };
        pin(70, 70, 90, 60, '#f6f0e0', -0.08, () => { x.fillStyle = '#2b4c8c'; x.font = `400 11px ${JP}`; x.fillText('ねむれない灯台', -38, 4); });
        pin(180, 90, 80, 56, '#fff8e8', 0.1, () => { x.fillStyle = '#333'; x.font = `400 11px ${JP}`; x.fillText('殿堂 2004', -30, 4); });
        pin(80, 190, 70, 70, '#12192e', 0.05, () => { x.fillStyle = '#f5e6b8'; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); x.fillStyle = '#12192e'; x.beginPath(); x.arc(9, -6, 20, 0, 7); x.fill(); });
        pin(185, 200, 84, 60, '#ffeef0', -0.12, () => { x.fillStyle = '#c8372d'; x.font = `700 12px ${JP}`; x.fillText('ナクシタ堂', -32, 4); });
        pin(128, 300, 150, 60, '#f6f0e0', 0.02, () => { x.fillStyle = '#333'; x.font = `500 14px ${JP}`; x.fillText('23年、ありがとう', -56, 5); });
      }
    });
  }
  function signTex(on) {
    return ctex(256, 96, (x, w, h) => {
      x.fillStyle = on ? '#3a0a08' : '#1a0c0b'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#555'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
      x.fillStyle = on ? '#ff3b2a' : '#4a1814'; x.font = `900 54px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ON AIR', w / 2, h / 2 + 3);
    });
  }
  function clockDraw(x, w) {
    x.fillStyle = '#0a0a0c'; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 2, 0, 7); x.fill();
    x.strokeStyle = '#444'; x.lineWidth = 6; x.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2 - Math.PI / 2, r = w / 2 - 22, on = i <= S.sec;
      x.fillStyle = on ? '#ff3b2a' : '#3a1210'; x.beginPath(); x.arc(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r, i % 5 ? 4 : 6, 0, 7); x.fill();
    }
    x.fillStyle = '#ff3b2a'; x.font = `700 ${w * 0.2}px "Share Tech Mono", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(S.clock, w / 2, w / 2);
  }
  function monDraw(x, w, h) {
    x.fillStyle = '#06101c'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#58c3ff'; x.font = `700 20px "Share Tech Mono", monospace`; x.fillText('AM 1062  ' + (S.onair ? 'ON AIR' : 'STANDBY'), 14, 30);
    x.strokeStyle = '#7fd6ff'; x.lineWidth = 2; x.beginPath();
    for (let i = 0; i < 64; i++) { const v = (Math.sin(clock * 9 + i * 0.7) * 0.5 + Math.sin(clock * 23 + i * 1.9) * 0.5) * (0.15 + S.talkAmp * 0.85); x.lineTo(14 + i * ((w - 28) / 63), h * 0.6 + v * h * 0.25); }
    x.stroke(); x.fillStyle = '#1e4a6a'; x.fillRect(14, h - 26, w - 28, 8); x.fillStyle = '#58c3ff'; x.fillRect(14, h - 26, (w - 28) * (0.3 + S.talkAmp * 0.6), 8);
  }
  function reflTex() {
    return ctex(512, 256, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(160,190,255,.10)'); g.addColorStop(0.55, 'rgba(160,190,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const c = ['#ff5a3a', '#58c3ff', '#ffd27a', '#7aff9a'][i % 4]; x.fillStyle = c; x.globalAlpha = 0.5; x.beginPath(); x.arc(40 + (i % 13) * 34, h - 30 - Math.floor(i / 13) * 16, 2.2, 0, 7); x.fill(); }
      x.globalAlpha = 1;
    });
  }
  function moonTex() {
    return ctex(128, 128, (x) => { x.fillStyle = '#fff4d8'; x.beginPath(); x.arc(64, 64, 40, 0, 7); x.fill(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(82, 52, 38, 0, 7); x.fill(); });
  }
  function poTex() {
    return ctex(256, 96, (x, w, h) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ff4a3a'; x.font = `900 64px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('〒', 48, h / 2 + 4);
      x.fillStyle = '#ffe6c8'; x.font = `700 30px ${JP}`; x.fillText('潮見郵便局', 160, h / 2 + 2);
    });
  }

  /* ---------- 部品 ---------- */
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: 0.8, metalness: 0 }, o || {}));
  function box(w, h, d, mat, x, y, z, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || SC).add(m); return m; }
  function rod(a, b, r, mat, parent) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); (parent || SC).add(m); return m;
  }
  function sprite(tex, color, sx, sy, x, y, z, op) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: lin(color), transparent: true, opacity: op == null ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(sx, sy, 1); s.position.set(x, y, z); SC.add(s); return s;
  }

  function buildRoom() {
    const wall = M('#2a3040'), foam = M('#262b3a', { roughness: 1 }), trim = M('#15171d', { roughness: 0.5, metalness: 0.4 });
    // 床・天井
    box(4.8, 0.02, 4.4, M('#1c1e26', { roughness: 1 }), 0, 0, 0.1);
    box(4.8, 0.04, 4.4, M('#101218'), 0, 2.72, 0.1);
    // 奥の壁（大きな窓）
    const WX = 1.55, WY0 = 0.82, WY1 = 2.28;
    box(2.4 - WX, 2.7, 0.12, wall, -(WX + (2.4 - WX) / 2), 1.35, -2.0);
    box(2.4 - WX, 2.7, 0.12, wall, WX + (2.4 - WX) / 2, 1.35, -2.0);
    box(WX * 2, WY0, 0.12, wall, 0, WY0 / 2, -2.0);
    box(WX * 2, 2.7 - WY1, 0.12, wall, 0, WY1 + (2.7 - WY1) / 2, -2.0);
    // 窓わく
    [[0, WY0, WX * 2 + 0.06, 0.05], [0, WY1, WX * 2 + 0.06, 0.05]].forEach(([x, y, w, h]) => box(w, h, 0.1, trim, x, y, -1.95));
    [-WX, 0, WX].forEach((x) => box(0.05, WY1 - WY0, 0.1, trim, x, (WY0 + WY1) / 2, -1.95));
    box(WX * 2, 0.12, 0.14, M('#3a3f4c'), 0, WY1 + 0.08, -1.9); // 巻きあげたブラインド
    // 横の壁（吸音材）
    [-1, 1].forEach((s) => {
      box(0.1, 2.7, 4.4, wall, s * 2.4, 1.35, 0.1);
      const geo = new THREE.BoxGeometry(0.06, 0.34, 0.34), n = 7 * 11, im = new THREE.InstancedMesh(geo, foam, n), o = new THREE.Object3D(); let k = 0;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 11; c++) { o.position.set(s * (2.34 - rnd() * 0.02), 0.35 + r * 0.36, -1.85 + c * 0.36); o.rotation.set(0, 0, 0); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
      SC.add(im);
    });
    // 天井の照明
    [-0.9, 0.9].forEach((x) => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), new THREE.MeshBasicMaterial({ color: lin('#ffe2b8') })); d.rotation.x = Math.PI / 2; d.position.set(x, 2.69, -0.6); SC.add(d); });
    // ON AIR
    TEX.signOn = signTex(true); TEX.signOff = signTex(false);
    P.sign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.23, 0.06), [M('#222'), M('#222'), M('#222'), M('#222'), new THREE.MeshBasicMaterial({ map: TEX.signOff }), M('#222')]);
    P.sign.position.set(-1.95, 2.35, -1.9); SC.add(P.sign);
    // 時計
    TEX.clock = ctex(256, 256, clockDraw);
    P.clock = new THREE.Mesh(new THREE.CircleGeometry(0.27, 40), new THREE.MeshBasicMaterial({ map: TEX.clock })); P.clock.position.set(1.98, 1.9, -1.93); SC.add(P.clock);
    // ポスターとコルクボード
    const pl = (kind, x, y, z, ry, w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 1.4), M('#fff', { map: posterTex(kind), roughness: 0.9 })); m.position.set(x, y, z); m.rotation.y = ry; SC.add(m); return m; };
    pl('hoshi', -1.98, 1.42, -1.93, 0, 0.46);
    pl('board', 1.95, 1.05, -1.93, 0, 0.5);
    pl('yofu', -2.0, 0.55, -1.93, 0, 0.3);
  }

  function buildDesk() {
    const wood = M('#6b4a32', { roughness: 0.55 }), dark = M('#1b1d22', { roughness: 0.6, metalness: 0.3 }), metal = M('#9aa0a8', { roughness: 0.35, metalness: 0.8 });
    box(2.7, 0.05, 0.85, wood, 0, 0.76, -0.55);
    const front = box(2.7, 0.72, 0.04, M('#3a2a20', { roughness: 0.7 }), 0, 0.38, -0.13);
    // 前板のランプ
    for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), new THREE.MeshBasicMaterial({ color: lin(i % 4 === 0 ? '#ff5a3a' : i % 3 ? '#58c3ff' : '#ffd27a') })); l.position.set(-0.9 + i * 0.16, 0.62, -0.108); SC.add(l); }
    // 卓（ミキサー）
    box(0.7, 0.05, 0.3, dark, -0.25, 0.8, -0.35);
    for (let i = 0; i < 6; i++) box(0.03, 0.02, 0.1, M('#ddd'), -0.5 + i * 0.1, 0.835, -0.32 - (i % 3) * 0.03);
    // マイクとアーム
    rod([0.78, 0.78, -0.92], [0.78, 1.52, -0.92], 0.018, metal);
    rod([0.78, 1.52, -0.92], [0.3, 1.38, -0.86], 0.014, metal);
    rod([0.3, 1.38, -0.86], [0.27, 1.28, -0.84], 0.012, metal);
    const mic = new THREE.Group(); mic.position.set(0.25, 1.23, -0.82); SC.add(mic);
    const mb = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.03, 0.15, 16), dark); mb.rotation.x = Math.PI / 2 - 0.25; mb.rotation.z = -0.6; mic.add(mb);
    const grill = new THREE.Mesh(new THREE.SphereGeometry(0.037, 16, 12), M('#50545c', { roughness: 0.4, metalness: 0.6 })); grill.position.set(-0.02, 0.01, -0.07); mic.add(grill);
    const pop = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.005, 6, 28), dark); pop.position.set(0.14, 1.26, -0.92); pop.rotation.y = -0.6; SC.add(pop);
    const popm = new THREE.Mesh(new THREE.CircleGeometry(0.075, 28), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.35 })); popm.position.copy(pop.position); popm.rotation.y = -0.6; SC.add(popm);
    // スタンドライト
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.11, 0.14, 20, 1, true), M('#2f5a4a', { side: THREE.DoubleSide, roughness: 0.5 }));
    shade.position.set(-0.76, 1.19, -0.62); shade.rotation.z = -0.35; SC.add(shade);
    rod([-0.95, 0.79, -0.7], [-0.9, 1.1, -0.66], 0.012, metal); rod([-0.9, 1.1, -0.66], [-0.8, 1.2, -0.62], 0.01, metal);
    box(0.16, 0.02, 0.12, dark, -0.95, 0.79, -0.7);
    P.bulb = sprite(TEX.glow, '#ffc98a', 0.22, 0.22, -0.74, 1.12, -0.61, 0.7);
    P.lamp = new THREE.PointLight(lin('#ffc98a'), 2.2, 3.6, 2); P.lamp.position.set(-0.74, 1.1, -0.6); SC.add(P.lamp);
    // モニター
    TEX.mon = ctex(256, 160, monDraw);
    const mon = new THREE.Group(); mon.position.set(0.95, 1.0, -0.62); mon.rotation.y = -0.55; SC.add(mon);
    box(0.44, 0.28, 0.03, dark, 0, 0, 0, mon);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ map: TEX.mon })); scr.position.z = 0.017; mon.add(scr);
    rod([0.95, 0.79, -0.64], [0.95, 0.86, -0.64], 0.02, dark);
    P.monL = new THREE.PointLight(lin('#6fb6ff'), 0.4, 1.6, 2); P.monL.position.set(0.8, 1.0, -0.5); SC.add(P.monL);
    // マグとゆげ
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 18), M('#e8e2d4', { roughness: 0.4 })); mug.position.set(-0.45, 0.83, -0.32); SC.add(mug);
    P.steam = [0, 1, 2].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: lin('#9aa4b8'), transparent: true, opacity: 0, depthWrite: false })); s.scale.set(0.06, 0.1, 1); SC.add(s); return { s, t: i / 3 }; });
    // ハガキの束
    const cardM = M('#f3ecd8', { roughness: 0.9 });
    for (let i = 0; i < 7; i++) { const c = box(0.1, 0.004, 0.148, cardM, 0.42 + (rnd() - 0.5) * 0.02, 0.79 + i * 0.005, -0.32 + (rnd() - 0.5) * 0.02); c.rotation.y = (rnd() - 0.5) * 0.3; }
    // 手わたされるハガキ
    TEX.cardBack = ctex(128, 188, (x, w, h) => { x.fillStyle = '#f3ecd8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8372d'; x.lineWidth = 2; for (let i = 0; i < 7; i++) x.strokeRect(34 + i * 12, 10, 10, 14); x.save(); x.translate(16, 44); x.rotate(Math.PI); x.fillStyle = '#c96'; x.fillRect(-26, -30, 26, 30); x.restore(); x.fillStyle = '#2b4c8c'; x.font = `400 13px ${JP}`; for (let i = 0; i < 6; i++) x.fillRect(80 - i * 12, 40, 2, 90 - i * 8); });
    P.card = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.148), new THREE.MeshStandardMaterial({ map: TEX.cardBack, side: THREE.DoubleSide, roughness: 0.9 })); P.card.visible = false; SC.add(P.card);
    // 窓の下わく（副調整室の側）と、ガラスの映りこみ
    TEX.refl = reflTex();
    P.glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: TEX.refl, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    P.glass.position.set(0, 1.27, 2.3); SC.add(P.glass);
    // イス
    box(0.46, 0.06, 0.44, dark, -0.05, 0.5, -1.15); box(0.44, 0.56, 0.06, dark, -0.05, 0.9, -1.42); rod([-0.05, 0.05, -1.15], [-0.05, 0.48, -1.15], 0.025, metal);
  }

  function buildHost() {
    const skin = M('#e6c3a5', { roughness: 0.7 }), sweater = M('#2f3a52', { roughness: 0.95 }), hair = M('#2a221c', { roughness: 0.9 }), shirt = M('#e9e6de'), dark = M('#141519', { roughness: 0.5, metalness: 0.3 });
    const root = new THREE.Group(); root.position.set(-0.05, 0.53, -1.12); root.rotation.y = 0.1; SC.add(root); H.root = root;
    const torso = new THREE.Group(); root.add(torso); H.torso = torso;
    const lathe = new THREE.LatheGeometry([[0, 0], [0.17, 0], [0.19, 0.1], [0.2, 0.3], [0.22, 0.45], [0.2, 0.52], [0.12, 0.57], [0.05, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 24);
    const body = new THREE.Mesh(lathe, sweater); body.scale.set(1, 1, 0.72); torso.add(body);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), shirt); collar.rotation.x = Math.PI / 2; collar.position.y = 0.58; torso.add(collar);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), skin); neck.position.y = 0.63; torso.add(neck);
    const head = new THREE.Group(); head.position.y = 0.76; torso.add(head); H.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 18), skin); skull.scale.set(0.93, 1.08, 1); head.add(skull);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.116, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.56), hair); hr.scale.set(0.96, 1.06, 1.04); hr.position.set(0, 0.012, -0.012); hr.rotation.x = -0.35; head.add(hr);
    [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), skin); ear.position.set(s * 0.1, -0.005, 0); ear.scale.set(0.5, 1, 0.8); head.add(ear); });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), skin); nose.position.set(0, -0.01, 0.105); head.add(nose);
    // めがね
    const gl = M('#2a2522', { roughness: 0.4, metalness: 0.5 });
    [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 20), gl); r.position.set(s * 0.038, 0.012, 0.1); head.add(r); });
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), gl); br.position.set(0, 0.016, 0.104); head.add(br);
    // ヘッドホン
    const ph = new THREE.Group(); head.add(ph); H.phones = ph;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 8, 28, Math.PI), dark); band.position.y = 0.01; ph.add(band);
    [-1, 1].forEach((s) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.035, 18), dark); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.122, -0.005, 0); ph.add(cup); });
    // うで
    ['L', 'R'].forEach((k, i) => {
      const s = i ? 1 : -1, sh = new THREE.Group(); sh.position.set(s * 0.215, 0.5, 0); torso.add(sh);
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.28, 12), sweater); up.position.y = -0.14; sh.add(up);
      const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
      const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.036, 0.26, 12), sweater); fo.position.y = -0.13; el.add(fo);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), skin); hand.position.y = -0.28; hand.scale.set(0.85, 1.1, 0.7); el.add(hand);
      H['sh' + k] = sh; H['el' + k] = el; H['hand' + k] = hand;
    });
    // いまの姿勢（なめらかに追いかける）
    H.p = { lean: 0.05, hx: 0, hy: 0, hz: 0, shLx: -0.62, shLz: 0.1, elLx: -1.05, shRx: -0.62, shRz: -0.1, elRx: -1.05, bob: 0 };
  }

  function buildOutside() {
    // 空
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: lin('#03060f') }, mid: { value: lin('#0d1430') }, hor: { value: lin('#2a2446') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top, mid, hor; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.06 ? mix(mid, top, smoothstep(0.06, 0.5, h)) : mix(hor, mid, smoothstep(-0.02, 0.06, h)); gl_FragColor = vec4(c, 1.0); }',
    }));
    SC.add(sky);
    // 星
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = (rnd() - 0.5) * 1.4, e = 0.02 + rnd() * 0.5; pos[i * 3] = Math.sin(a) * 800 * Math.cos(e); pos[i * 3 + 1] = Math.sin(e) * 800; pos[i * 3 + 2] = -Math.cos(a) * 800 * Math.cos(e); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    SC.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: lin('#dfe6ff'), size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false })));
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), color: lin('#fff1cf'), transparent: true, depthWrite: false })); moon.scale.set(14, 14, 1); moon.position.set(-95, 48, -420); SC.add(moon);
    sprite(TEX.glow, '#8a93c8', 60, 60, -95, 48, -421, 0.25);
    // 海
    const SEA = -9;
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2400, 1400), new THREE.MeshBasicMaterial({ color: lin('#060a14') })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, SEA, -700); SC.add(sea);
    // 遠くの山
    const hills = new THREE.Shape(); hills.moveTo(-900, 0); for (let i = 0; i <= 40; i++) hills.lineTo(-900 + i * 45, 10 + Math.sin(i * 0.7) * 8 + Math.sin(i * 1.9) * 5 + (i > 26 ? 10 : 0)); hills.lineTo(900, -20); hills.lineTo(-900, -20);
    const hm = new THREE.Mesh(new THREE.ShapeGeometry(hills), new THREE.MeshBasicMaterial({ color: lin('#0a0d18') })); hm.position.set(0, SEA, -700); SC.add(hm);
    // 町（港の向こう）
    const fac = [facade(6, 8, '#3a3a44', 0.3, true), facade(4, 5, '#4a4540', 0.45, true), facade(8, 12, '#2e3440', 0.22, false)];
    fac.forEach((f, fi) => {
      const geo = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.em, emissive: lin('#ffffff'), emissiveIntensity: 1.4, roughness: 0.9 });
      const cnt = 26, im = new THREE.InstancedMesh(geo, mat, cnt), o = new THREE.Object3D();
      for (let i = 0; i < cnt; i++) {
        const x = -230 + rnd() * 460, z = -180 - rnd() * 260, w = 8 + rnd() * 14, h = fi === 2 ? 14 + rnd() * 30 : 5 + rnd() * 14;
        if (Math.abs(x + 40) < 16 && z > -230) { o.scale.set(0.001, 0.001, 0.001); } else o.scale.set(w, h, 8 + rnd() * 8);
        o.position.set(x, SEA + h / 2, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      }
      SC.add(im);
    });
    // 岸の灯り
    for (let i = 0; i < 22; i++) { const x = -200 + i * 19, z = -170 - Math.sin(i * 0.5) * 8; sprite(TEX.glow, i % 3 ? '#ffc98a' : '#cfe2ff', 3, 3, x, SEA + 2.5, z, 0.9); sprite(TEX.glow, '#ffb870', 1.6, 10, x, SEA - 0.1, z + 6, 0.18); }
    // 郵便局（ここだけ特別）
    const po = new THREE.Group(); po.position.set(-40, SEA, -190); SC.add(po);
    box(26, 14, 12, M('#8d8676', { roughness: 0.9 }), 0, 7, 0, po);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) if (!(r === 1 && c === 2)) box(2.6, 2, 0.2, new THREE.MeshBasicMaterial({ color: lin(r === 0 && c % 2 ? '#3a3226' : '#12151c') }), -9.5 + c * 3.8, 2.5 + r * 4, 6.05, po);
    P.poWin = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2), new THREE.MeshBasicMaterial({ color: lin('#ffe0a8') })); P.poWin.position.set(-9.5 + 2 * 3.8, 6.5, 6.12); po.add(P.poWin);
    P.poGlow = sprite(TEX.glow, '#ffd49a', 9, 9, -40 - 9.5 + 7.6, SEA + 6.5, -183.5, 0.55);
    P.poRefl = sprite(TEX.glow, '#ffc98a', 3, 18, -40 - 1.9, SEA - 0.2, -176, 0.25);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.75), new THREE.MeshBasicMaterial({ map: poTex(), transparent: true, blending: THREE.AdditiveBlending })); sign.position.set(0, 15.8, 6.1); po.add(sign);
    // 灯台（15秒に1回）
    const lh = new THREE.Group(); lh.position.set(78, SEA, -380); SC.add(lh); P.lh = lh;
    const rock = new THREE.Mesh(new THREE.ConeGeometry(40, 12, 7), M('#0b0e14')); rock.position.y = 2; lh.add(rock);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 18, 16), M('#d9d6cc', { roughness: 0.7 })); tower.position.y = 16; lh.add(tower);
    const lan = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 2.4, 12), new THREE.MeshBasicMaterial({ color: lin('#fff2cc') })); lan.position.y = 26.2; lh.add(lan);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 12), M('#3a1a14')); cap.position.y = 28.5; lh.add(cap);
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { c: { value: lin('#fff0c8') }, k: { value: 0.28 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; uniform float k; varying vec2 vUv; void main(){ float a = pow(vUv.y, 2.2) * k; float e = 1.0 - abs(vUv.x - 0.5) * 2.0; gl_FragColor = vec4(c * a * (0.5 + e), 1.0); }',
    });
    const beam = new THREE.Group(); beam.position.y = 26.2; lh.add(beam); P.beam = beam;
    [0, Math.PI].forEach((r) => { const b = new THREE.Mesh(new THREE.ConeGeometry(9, 170, 24, 1, true), beamMat); b.rotation.z = -Math.PI / 2; b.position.x = -85; const g = new THREE.Group(); g.rotation.y = r; g.add(b); beam.add(g); });
    P.flare = sprite(TEX.glow, '#fff2cc', 22, 22, 78, SEA + 26.2, -379, 0.6);
    // 遠くを走る車
    P.car = sprite(TEX.glow, '#ffe8c0', 2.2, 2.2, -200, SEA + 1.5, -165, 0.9);
  }

  /* ---------- 仕上げ ---------- */
  const FINAL_SHADER = {
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 0.95 }, grain: { value: 0.03 }, fade: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time, exposure, grain, fade; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r = dot(d, d);
        vec3 c; c.r = texture2D(tDiffuse, vUv + d * 0.003).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * 0.003).b;
        c = aces(c * exposure); c = pow(c, vec3(1.0 / 2.2));
        c *= 1.0 - r * 1.1;
        c += (rnd(vUv * vec2(1731.0, 977.0) + fract(time)) - 0.5) * grain;
        gl_FragColor = vec4(c * fade, 1.0);
      }`,
  };

  function init(cv, opt) {
    canvas = cv;
    if (opt && opt.flat) { mode = '2d'; init2d(); return '2d'; }
    try { if (!window.THREE) throw 0; R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
    catch (e) { mode = '2d'; init2d(); return '2d'; }
    mode = '3d';
    R.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
    SC = new THREE.Scene();
    CAM = new THREE.PerspectiveCamera(40, 16 / 7, 0.05, 2000);
    TEX.glow = glowTex();
    SC.add(new THREE.AmbientLight(lin('#26304a'), 0.55));
    const key = new THREE.SpotLight(lin('#ffe6c4'), 1.3, 6, 0.7, 0.7, 2); key.position.set(0.2, 2.65, -0.4); key.target.position.set(0, 0.8, -0.8); SC.add(key); SC.add(key.target);
    const rim = new THREE.DirectionalLight(lin('#7188cc'), 0.45); rim.position.set(0.5, 2, -6); SC.add(rim);
    const spill = new THREE.PointLight(lin('#4a6aff'), 0.25, 4, 2); spill.position.set(0, 1.1, 2.2); SC.add(spill);
    P.red = new THREE.PointLight(lin('#ff3020'), 0, 2.4, 2); P.red.position.set(-1.9, 2.2, -1.7); SC.add(P.red);
    buildRoom(); buildDesk(); buildHost(); buildOutside();
    const can = THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass;
    if (can) {
      try {
        COMP = new THREE.EffectComposer(R);
        COMP.addPass(new THREE.RenderPass(SC, CAM));
        BLOOM = new THREE.UnrealBloomPass(new THREE.Vector2(512, 256), 0.75, 0.55, 0.82); COMP.addPass(BLOOM);
        FIN = new THREE.ShaderPass(FINAL_SHADER); COMP.addPass(FIN);
        R.toneMapping = THREE.NoToneMapping; R.outputEncoding = THREE.LinearEncoding;
      } catch (e) { COMP = null; }
    }
    if (!COMP) { R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1; R.outputEncoding = THREE.sRGBEncoding; }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { ['signOn', 'signOff', 'clock'].forEach((k) => redraw(TEX[k])); });
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); S.mx = ((e.clientX - r.left) / r.width - 0.5) * 2; S.my = ((e.clientY - r.top) / r.height - 0.5) * 2; });
    canvas.parentElement.addEventListener('pointerleave', () => { S.mx = 0; S.my = 0; });
    last = performance.now(); requestAnimationFrame(loop);
    return '3d';
  }
  function resize() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 350;
    if (mode === '3d') {
      R.setSize(w, h, false); CAM.aspect = w / h;
      CAM.fov = S.fov0 = w / h < 1.25 ? 62 : w / h < 1.8 ? 50 : 40; CAM.updateProjectionMatrix();
      if (COMP) { COMP.setSize(w, h); if (BLOOM) BLOOM.resolution.set(w / 2, h / 2); }
    } else if (mode === '2d') { const d = Math.min(2, devicePixelRatio || 1); canvas.width = w * d; canvas.height = h * d; }
  }

  /* ---------- 毎フレーム ---------- */
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; if (paused || document.hidden) return; frame(dt); }
  const camFrom = [0, 1.3, 2.75], camTo = [-0.85, 1.58, -1.62];
  const V = window.THREE ? { a: new THREE.Vector3(), b: new THREE.Vector3(), t: new THREE.Vector3() } : null;
  const ease = (u) => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  let secT = 0, monT = 0;
  function frame(dt) {
    clock += dt;
    if (mode === '2d') { draw2d(); return; }
    // 時計とモニター
    secT += dt; if (secT > 1) { secT = 0; S.sec = (S.sec + 1) % 60; redraw(TEX.clock); }
    monT += dt; if (monT > 0.12) { monT = 0; redraw(TEX.mon); }
    S.talkAmp = damp(S.talkAmp, S.host === 'talk' || S.host === 'read' || S.host === 'laugh' ? 0.5 + 0.5 * Math.abs(Math.sin(clock * 7)) : 0.05, 6, dt);
    pose(dt);
    // ON AIR
    P.red.intensity = damp(P.red.intensity, S.onair ? 0.6 : 0, 5, dt);
    // ゆげ
    P.steam.forEach((o) => { o.t = (o.t + dt * 0.25) % 1; o.s.position.set(-0.45 + Math.sin(o.t * 6 + clock) * 0.015, 0.9 + o.t * 0.22, -0.32); o.s.material.opacity = Math.sin(o.t * Math.PI) * 0.18; o.s.scale.set(0.05 + o.t * 0.06, 0.08 + o.t * 0.08, 1); });
    // スタンドの明かりのゆらぎ
    P.lamp.intensity = 2.2 + Math.sin(clock * 13) * 0.02;
    // 灯台（15秒で1回、こちらを照らす）
    P.beam.rotation.y = (clock / 15) * Math.PI * 2 + 0.6;
    const th = P.beam.rotation.y, dot = (Math.cos(th) * 78 + Math.sin(th) * 383) / 391;
    const fl = Math.pow(Math.max(0, dot), 60) + Math.pow(Math.max(0, -dot), 60);
    P.flare.material.opacity = 0.22 + fl * 1.2; P.flare.scale.setScalar(12 + fl * 44);
    // 郵便局の窓
    let win = 1;
    if (S.blink > 0) { S.blink += dt; const t = S.blink; win = t < 0.6 ? 1 : (Math.floor((t - 0.6) / 0.45) % 2 === 0 && t < 3.3) ? 0.08 : 1; if (t > 4) S.blink = 0; }
    P.poWin.material.color.copy(lin('#ffe0a8')).multiplyScalar(win); P.poGlow.material.opacity = 0.55 * win; P.poRefl.material.opacity = 0.25 * win;
    // 車
    P.car.position.x = -230 + ((clock * 9) % 460);
    // ハガキの受けわたし
    handCard(dt);
    // カメラ
    let cx = camFrom[0], cy = camFrom[1], cz = camFrom[2];
    V.t.set(0, 1.12, -0.95);
    if (S.end > 0) {
      S.endT = Math.min(1, S.endT + dt / 9); const u = ease(S.endT);
      cx += (camTo[0] - cx) * u; cy += (camTo[1] - cy) * u; cz += (camTo[2] - cz) * u;
      V.a.set(-40, -1, -190); V.t.lerp(V.a, Math.min(1, u * 1.15));
      const f = S.fov0 * (1 - 0.5 * u); if (Math.abs(CAM.fov - f) > 0.01) { CAM.fov = f; CAM.updateProjectionMatrix(); }
    }
    CAM.position.set(cx + S.mx * 0.14 * (1 - S.endT), cy - S.my * 0.06 * (1 - S.endT), cz);
    CAM.lookAt(V.t);
    if (FIN) { FIN.uniforms.time.value = clock; }
    if (COMP) COMP.render(dt); else R.render(SC, CAM);
  }

  function pose(dt) {
    const p = H.p, t = clock, st = S.host, tg = { lean: 0.04, hx: 0.02, hy: 0.05, hz: 0, shLx: -0.62, shLz: 0.12, elLx: -1.05, shRx: -0.62, shRz: -0.12, elRx: -1.05, bob: 0 };
    const breath = Math.sin(t * 1.4) * 0.008;
    if (st === 'talk') { tg.lean = 0.12; tg.hx = 0.05 + Math.sin(t * 5.2) * 0.04; tg.hy = 0.12 + Math.sin(t * 0.7) * 0.1; tg.shRx = -0.9 + Math.sin(t * 2.3) * 0.18; tg.elRx = -1.5 + Math.sin(t * 3.1) * 0.25; tg.shRz = -0.25; }
    else if (st === 'read') { tg.lean = 0.1; tg.hx = 0.32 + Math.sin(t * 4.6) * 0.02; tg.shRx = -0.95; tg.elRx = -1.55; tg.shRz = -0.28; tg.shLx = -0.8; tg.elLx = -1.35; tg.shLz = 0.25; }
    else if (st === 'laugh') { tg.lean = 0.02; tg.hx = -0.18 + Math.abs(Math.sin(t * 9)) * 0.08; tg.bob = Math.abs(Math.sin(t * 9)) * 0.012; tg.shRx = -0.7; tg.elRx = -1.2; }
    else if (st === 'still') { tg.lean = 0.08; tg.hx = 0.22; tg.hy = 0.02; }
    else if (st === 'moved') { tg.lean = 0.14; tg.hx = 0.42; tg.hy = -0.05; tg.shLx = -1.25; tg.elLx = -2.25; tg.shLz = 0.42; }
    else if (st === 'listen') { tg.lean = -0.04; tg.hx = 0.1; tg.hz = Math.sin(t * 1.2) * 0.08; tg.hy = 0.25; tg.bob = Math.sin(t * 2.4) * 0.004; }
    else if (st === 'bow') { tg.lean = 0.3; tg.hx = 0.35; }
    for (const k in tg) p[k] = damp(p[k], tg[k], st === 'laugh' || st === 'talk' ? 9 : 4, dt);
    H.torso.rotation.x = p.lean; H.torso.position.y = p.bob + breath;
    H.head.rotation.set(p.hx, p.hy, p.hz);
    H.shL.rotation.set(p.shLx, 0, p.shLz); H.elL.rotation.x = p.elLx;
    H.shR.rotation.set(p.shRx, 0, p.shRz); H.elR.rotation.x = p.elRx;
    // ヘッドホンをはずす
    const off = S.phones ? 0 : 1; H.phones.position.y = damp(H.phones.position.y, off * 0.22, 3, dt); H.phones.position.z = damp(H.phones.position.z, off * 0.12, 3, dt); H.phones.visible = H.phones.position.y < 0.2;
  }

  function handCard(dt) {
    if (S.handT < 0 && !S.hold) { P.card.visible = false; return; }
    H.handR.getWorldPosition(V.b);
    if (S.handT >= 0) {
      S.handT += dt / 1.3; const u = ease(Math.min(1, S.handT));
      V.a.set(0.05, 0.95, 2.3);
      P.card.visible = true;
      P.card.position.set(V.a.x + (V.b.x - V.a.x) * u, V.a.y + (V.b.y - V.a.y) * u + Math.sin(u * Math.PI) * 0.35, V.a.z + (V.b.z - V.a.z) * u);
      P.card.rotation.set(-0.4 * (1 - u), u * 0.3, (1 - u) * 1.2);
      if (S.handT >= 1) { S.handT = -1; S.hold = 1; }
    } else if (S.hold) {
      P.card.visible = true; P.card.position.set(V.b.x - 0.04, V.b.y + 0.08, V.b.z + 0.03); P.card.rotation.set(-0.35, 0.25, 0);
    }
  }

  /* ---------- 2D（3Dが使えないとき） ---------- */
  let X2 = null;
  function init2d() { X2 = canvas.getContext('2d'); resize(); addEventListener('resize', resize); last = performance.now(); requestAnimationFrame(loop); }
  function draw2d() {
    const c = canvas, x = X2, w = c.width, h = c.height; if (!x) return;
    x.fillStyle = '#161a24'; x.fillRect(0, 0, w, h);
    const wx0 = w * 0.18, wx1 = w * 0.82, wy0 = h * 0.08, wy1 = h * 0.62;
    const g = x.createLinearGradient(0, wy0, 0, wy1); g.addColorStop(0, '#050914'); g.addColorStop(1, '#262246'); x.fillStyle = g; x.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    x.save(); x.beginPath(); x.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); x.clip();
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(wx0 + ((i * 97) % 1000) / 1000 * (wx1 - wx0), wy0 + ((i * 53) % 1000) / 1000 * (wy1 - wy0) * 0.6, 1.5, 1.5); }
    x.fillStyle = '#0a0d16'; x.fillRect(wx0, wy1 - (wy1 - wy0) * 0.22, wx1 - wx0, (wy1 - wy0) * 0.22);
    for (let i = 0; i < 30; i++) { x.fillStyle = i % 3 ? '#ffcf8f' : '#cfe2ff'; x.fillRect(wx0 + (i / 30) * (wx1 - wx0), wy1 - (wy1 - wy0) * (0.12 + (i % 4) * 0.02), 2, 2); }
    const lx = wx1 - (wx1 - wx0) * 0.12, ly = wy1 - (wy1 - wy0) * 0.25, a = clock / 15 * Math.PI * 2;
    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,240,200,.18)'; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + Math.cos(a) * w, ly - 10 + Math.sin(a) * 20); x.lineTo(lx + Math.cos(a) * w, ly + 10 + Math.sin(a) * 20); x.fill();
    const pw = S.blink > 0 && Math.floor(S.blink / 0.45) % 2 ? 0.1 : 1; x.fillStyle = `rgba(255,220,160,${pw})`; x.fillRect(wx0 + (wx1 - wx0) * 0.2, wy1 - (wy1 - wy0) * 0.15, 5, 4);
    x.globalCompositeOperation = 'source-over'; x.restore();
    // 机と人
    const lg = x.createRadialGradient(w * 0.35, h * 0.62, 5, w * 0.35, h * 0.62, w * 0.35); lg.addColorStop(0, 'rgba(255,200,130,.35)'); lg.addColorStop(1, 'rgba(255,200,130,0)'); x.fillStyle = lg; x.fillRect(0, 0, w, h);
    const hx = w * 0.5, hy = h * 0.5 + (S.host === 'moved' ? h * 0.03 : 0);
    x.fillStyle = '#0c0e14'; x.beginPath(); x.ellipse(hx, hy, h * 0.09, h * 0.1, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(hx - h * 0.22, h * 0.95); x.quadraticCurveTo(hx - h * 0.2, hy + h * 0.1, hx, hy + h * 0.1); x.quadraticCurveTo(hx + h * 0.2, hy + h * 0.1, hx + h * 0.22, h * 0.95); x.fill();
    if (S.phones) { x.strokeStyle = '#0c0e14'; x.lineWidth = h * 0.02; x.beginPath(); x.arc(hx, hy, h * 0.11, Math.PI, 0); x.stroke(); }
    if (S.hold) { x.fillStyle = '#f3ecd8'; x.fillRect(hx + h * 0.05, hy + h * 0.1, h * 0.09, h * 0.13); }
    x.fillStyle = '#3a2a20'; x.fillRect(0, h * 0.72, w, h * 0.28);
    x.fillStyle = '#6b4a32'; x.fillRect(0, h * 0.7, w, h * 0.03);
    x.fillStyle = S.onair ? '#ff3b2a' : '#4a1814'; x.font = `900 ${h * 0.06}px ${JP}`; x.fillText('ON AIR', w * 0.04, h * 0.1);
    if (S.fade2 != null) { x.fillStyle = `rgba(0,0,0,${S.fade2})`; x.fillRect(0, 0, w, h); }
  }

  /* ---------- 外から ---------- */
  function set(o) {
    if ('onair' in o) { S.onair = o.onair ? 1 : 0; if (mode === '3d') { P.sign.material[4].map = S.onair ? TEX.signOn : TEX.signOff; P.sign.material[4].needsUpdate = true; } }
    if ('host' in o && o.host) { S.host = o.host; if (o.host !== 'read' && o.host !== 'still') S.hold = 0; }
    if ('clock' in o) { S.clock = o.clock; if (mode === '3d') redraw(TEX.clock); }
    if ('phones' in o) S.phones = o.phones ? 1 : 0;
  }
  function hand() { if (mode === '2d') { S.hold = 1; return; } S.handT = 0; S.hold = 0; }
  function ending() { S.end = 1; S.endT = 0; }
  function blink() { S.blink = 0.001; }
  function reset() { S.end = 0; S.endT = 0; S.phones = 1; S.blink = 0; if (mode === '3d') { CAM.fov = S.fov0; CAM.updateProjectionMatrix(); } }
  return { init, set, hand, ending, blink, reset, get mode() { return mode; }, pause(v) { paused = v; }, _step: (n) => { for (let i = 0; i < (n || 1); i++) frame(1 / 30); } };
})();
