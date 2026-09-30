/* =========================================================
   ツブのとっておき — ツブの部屋（解像度ごとに描き直す）
   同じ部屋を、W×H の画素で描く。細かい物は、画素が足りるときだけ描く。
   o: { st, time: morning|day|evening|night, season, deco:{色:0..2}, randoseru, tint }
   ========================================================= */
(function (G) {
  'use strict';
  const PX = G.PX || (typeof require !== 'undefined' ? require('./pix.js') : null);
  const C = {
    wall: '#f4e4cf', wallDot: '#ead3b8', wain: '#e5caa8', wainLine: '#d6b893', base: '#a77d5b',
    floor: '#cf9f6f', floorHi: '#dcb083', seam: '#b88657', rug: '#efb9a3', rugEdge: '#d9917a', rugIn: '#f6d3c0',
    frame: '#fff8ec', frameSh: '#d8c1a2', door: '#bf906a', doorSh: '#a47753', doorHi: '#d3a67f', knob: '#f2c14e',
    bedWood: '#a87a55', bedSh: '#8d6444', pillow: '#fffaf2', sheet: '#fff1e2',
    lampPole: '#6f5a4a', shade: '#fff0c8', shadeSh: '#f1d9a0',
  };
  const SKY = {
    morning: ['#9ed3ef', '#ffe3cc'], day: ['#83c4ee', '#d7f0ff'], evening: ['#f08a63', '#ffd39a'], night: ['#151a45', '#2d3775'],
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const THEME_COL = { sora: '#8fd0f2', mido: '#7fc47a', hono: '#ec6b54', hosi: '#5563b8', uta: '#f59ac8', hina: '#f2c14e', yoru: '#6d4fc2', fu: '#e8c9a0' };

  function room(W, H, o) {
    o = o || {};
    const b = new PX.Bmp(W, H);
    const glow = new Uint8Array(W * H); // 光る画素（夜でも暗くしない）
    const X = (u) => Math.round(u * W), Y = (v) => Math.round(v * H);
    const put = (x, y, c, g) => { if (x < 0 || y < 0 || x >= W || y >= H) return; b.put(x, y, c); glow[y * W + x] = g ? 1 : 0; };
    const fill = (x0, y0, x1, y1, c, g) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(x, y, c, g); };
    const R = (u0, v0, u1, v1, c, g) => { const x0 = X(u0), y0 = Y(v0); fill(x0, y0, Math.max(x0 + 1, X(u1)), Math.max(y0 + 1, Y(v1)), c, g); };
    const px = Math.max(1, Math.round(W / 64)); // 線の太さ
    const big = W >= 60, huge = W >= 90;
    const mix = (a, c, t) => PX.hex(PX.mix(a, c, t));
    const time = o.time || 'day', season = o.season || 'spring', st = o.st || 2;
    const deco = o.deco || {};
    const tint = THEME_COL[o.tint] || THEME_COL.fu;

    /* 壁 */
    const wallBot = 0.72;
    R(0, 0, 1, wallBot, C.wall);
    if (big) for (let y = 2; y < Y(0.55); y += Math.max(3, Math.round(H / 14))) for (let x = (y / 3 | 0) % 2 ? 2 : Math.round(W / 24); x < W; x += Math.max(4, Math.round(W / 12))) put(x, y, C.wallDot);
    R(0, 0.55, 1, wallBot, C.wain);
    if (big) for (let x = 0; x < W; x += Math.max(3, Math.round(W / 20))) fill(x, Y(0.56), x + 1, Y(wallBot), C.wainLine);
    R(0, 0.55, 1, 0.555, C.wainLine);
    R(0, wallBot - 0.02, 1, wallBot, C.base);

    /* 床 */
    R(0, wallBot, 1, 1, C.floor);
    const plank = Math.max(2, Math.round(H * 0.07));
    for (let y = Y(wallBot) + plank; y < H; y += plank) fill(0, y, W, y + 1, C.seam);
    if (big) for (let y = Y(wallBot), k = 0; y < H; y += plank, k++) for (let x = (k * 7) % 13 + 3; x < W; x += Math.round(W / 3.2)) fill(x, y + 1, x + 1, Math.min(H, y + plank), C.seam);
    if (big) for (let y = Y(wallBot) + 1; y < H; y += plank) for (let x = 1; x < W; x += Math.round(W / 5)) fill(x, y, x + Math.round(W / 14), y + 1, C.floorHi);

    /* 窓 */
    const wu0 = 0.07, wu1 = 0.36, wv0 = 0.1, wv1 = 0.5;
    const x0 = X(wu0), x1 = X(wu1), y0 = Y(wv0), y1 = Y(wv1);
    const [s0, s1] = SKY[time];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const t = (y - y0) / Math.max(1, y1 - y0 - 1);
      const th = BAYER[(y % 4) * 4 + (x % 4)] / 16;
      const q = Math.min(1, Math.floor(t * 5 + th) / 5);
      put(x, y, mix(s0, s1, q), 1);
    }
    // 外の景色：丘と町
    const hillC = { spring: ['#9ccf8a', '#f6c6d6'], summer: ['#6fb86a', '#4f9a52'], autumn: ['#d99a55', '#c7703f'], winter: ['#eef3fb', '#cfdcee'] }[season];
    const nightDim = time === 'night' ? 0.62 : time === 'evening' ? 0.25 : 0;
    for (let x = x0; x < x1; x++) {
      const u = (x - x0) / (x1 - x0);
      const h1 = 0.18 + 0.08 * Math.sin(u * 5.2 + 1) + 0.04 * Math.sin(u * 13);
      const h2 = 0.09 + 0.05 * Math.sin(u * 7.5 + 3);
      for (let y = y0; y < y1; y++) {
        const v = 1 - (y - y0) / (y1 - y0);
        if (v < h1) put(x, y, mix(hillC[0], '#1a1b3a', nightDim), 1);
        if (v < h2) put(x, y, mix(hillC[1], '#1a1b3a', nightDim), 1);
      }
    }
    if (big) { // 町の屋根
      for (let k = 0; k < 4; k++) {
        const hx = x0 + Math.round((x1 - x0) * (0.12 + k * 0.22)), hy = y1 - Math.round((y1 - y0) * (0.13 + (k % 2) * 0.05));
        const w = Math.max(2, Math.round((x1 - x0) * 0.12));
        fill(hx, hy, hx + w, y1, mix(['#f3efe6', '#e8d9c2', '#f7e8e0', '#e6eef3'][k], '#1a1b3a', nightDim), 1);
        fill(hx - 1, hy - 1, hx + w + 1, hy, mix(['#c95b4a', '#5b79b5', '#6a9a5a', '#b7784a'][k], '#1a1b3a', nightDim), 1);
        if (time === 'night' || time === 'evening') put(hx + (w >> 1), hy + 1, '#ffe38a', 1);
      }
    }
    // 太陽・月・星
    const cw = x1 - x0, ch = y1 - y0;
    const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) { const X2 = cx + x, Y2 = cy + y; if (X2 >= x0 && X2 < x1 && Y2 >= y0 && Y2 < y1) put(X2, Y2, c, 1); } };
    const r0 = Math.max(1, Math.round(cw * 0.08));
    if (time === 'night') {
      const stars = [[0.15, 0.1], [0.4, 0.22], [0.7, 0.08], [0.85, 0.3], [0.28, 0.38], [0.58, 0.44], [0.08, 0.5], [0.92, 0.55], [0.5, 0.05]];
      stars.forEach(([u, v], i) => { if (i < (big ? 9 : 4)) put(x0 + Math.round(u * (cw - 1)), y0 + Math.round(v * (ch - 1)), i % 3 ? '#fff6c9' : '#c8d4ff', 1); });
      disc(x0 + Math.round(cw * 0.72), y0 + Math.round(ch * 0.2), r0, '#fff4c4');
      if (r0 >= 2) disc(x0 + Math.round(cw * 0.72) + Math.max(1, r0 >> 1), y0 + Math.round(ch * 0.2) - 1, r0 - 1, s0);
    } else if (time === 'evening') disc(x0 + Math.round(cw * 0.3), y0 + Math.round(ch * 0.55), r0 + 1, '#ffef9e');
    else if (time === 'morning') disc(x0 + Math.round(cw * 0.78), y0 + Math.round(ch * 0.42), r0, '#fff6d8');
    else { // 雲
      const cl = season === 'summer' ? '#ffffff' : '#f4f8ff';
      disc(x0 + Math.round(cw * 0.3), y0 + Math.round(ch * 0.3), r0, cl); disc(x0 + Math.round(cw * 0.3) + r0, y0 + Math.round(ch * 0.3) + 1, r0, cl);
      if (season === 'summer') disc(x0 + Math.round(cw * 0.3) - r0 + 1, y0 + Math.round(ch * 0.3) + 1, Math.max(1, r0 - 1), cl);
    }
    // 季節：さくらの枝・もみじ・つらら
    if (season === 'spring' && big) for (let k = 0; k < 9; k++) put(x0 + (k * 5 % cw), y0 + 1 + (k * 3 % Math.max(2, (ch >> 2))), k % 2 ? '#ffc4d8' : '#ffdbe7', 1);
    if (season === 'autumn' && big) for (let k = 0; k < 6; k++) put(x0 + 1 + (k * 7 % (cw - 2)), y0 + 1 + (k * 5 % Math.max(2, (ch >> 1))), k % 2 ? '#e8743f' : '#f2b23d', 1);
    // 窓わく
    fill(x0 - px, y0 - px, x1 + px, y0, C.frame); fill(x0 - px, y1, x1 + px, y1 + px, C.frame);
    fill(x0 - px, y0, x0, y1, C.frame); fill(x1, y0, x1 + px, y1, C.frame);
    fill(((x0 + x1) >> 1), y0, ((x0 + x1) >> 1) + Math.max(1, px - (big ? 0 : 1)), y1, C.frame);
    if (big) fill(x0, (y0 + y1) >> 1, x1, ((y0 + y1) >> 1) + 1, C.frame);
    fill(x0 - px * 2, y1 + px, x1 + px * 2, y1 + px * 2 + (big ? 1 : 0), C.frameSh); // 窓台
    if (season === 'winter') fill(x0, y1 - 1, x1, y1, '#ffffff', 1);
    // カーテン
    const cur = mix(tint, '#ffffff', 0.45), curSh = mix(tint, '#ffffff', 0.15);
    const cwid = Math.max(1, Math.round(W * 0.035));
    fill(x0 - px * 2 - cwid, y0 - px * 2, x0 - px, y1 + px, cur); fill(x1 + px, y0 - px * 2, x1 + px * 2 + cwid, y1 + px, cur);
    if (big) { fill(x0 - px * 2 - cwid, y0, x0 - px * 2 - cwid + 1, y1 + px, curSh); fill(x1 + px * 2 + cwid - 1, y0, x1 + px * 2 + cwid, y1 + px, curSh); }
    fill(x0 - px * 3 - cwid, y0 - px * 3, x1 + px * 3 + cwid, y0 - px * 2, C.bedSh); // カーテンレール

    /* ドア */
    const dx0 = X(0.8), dx1 = X(0.95), dy0 = Y(0.18), dy1 = Y(wallBot);
    fill(dx0 - px, dy0 - px, dx1 + px, dy1, C.frame);
    fill(dx0, dy0, dx1, dy1, C.door);
    if (big) {
      const pw = Math.round((dx1 - dx0) * 0.3), ph = Math.round((dy1 - dy0) * 0.3);
      const pxL = dx0 + Math.round((dx1 - dx0) * 0.15), pxR = dx1 - Math.round((dx1 - dx0) * 0.15) - pw;
      [[pxL, dy0 + 2], [pxR, dy0 + 2], [pxL, dy0 + ph + 5], [pxR, dy0 + ph + 5]].forEach(([x, y]) => { fill(x, y, x + pw, y + ph, C.doorSh); fill(x + 1, y + 1, x + pw, y + ph, C.doorHi); fill(x + 1, y + 1, x + pw - 1, y + ph - 1, C.door); });
    }
    fill(dx0 + Math.max(1, Math.round((dx1 - dx0) * 0.12)), Y(0.47), dx0 + Math.max(1, Math.round((dx1 - dx0) * 0.12)) + Math.max(1, px), Y(0.47) + Math.max(1, px), C.knob);
    // ドアが開いている（出かけているあいだ）
    if (o.doorOpen) { fill(dx0, dy0, dx1, dy1, time === 'night' ? '#1c1a33' : '#fff3d6', 1); fill(dx0, dy0, dx0 + Math.max(1, Math.round((dx1 - dx0) * 0.25)), dy1, C.doorSh); }

    /* 棚 */
    const shv = 0.33;
    R(0.44, shv, 0.72, shv + 0.02, C.bedWood);
    if (big) { R(0.46, shv + 0.02, 0.47, shv + 0.05, C.bedSh); R(0.69, shv + 0.02, 0.70, shv + 0.05, C.bedSh); }

    /* 家具（時期ごと） */
    if (st <= 1) { // ベビーベッド
      R(0.02, 0.5, 0.3, 0.86, C.bedWood);
      R(0.03, 0.52, 0.29, 0.72, '#fff6ea');
      for (let x = X(0.04); x < X(0.29); x += Math.max(2, Math.round(W / 22))) fill(x, Y(0.52), x + 1, Y(0.74), C.bedSh);
      R(0.02, 0.72, 0.3, 0.76, C.bedSh);
      R(0.04, 0.62, 0.28, 0.72, mix(tint, '#ffffff', 0.6));
      // モビール
      R(0.16, 0.0, 0.165, 0.2, C.bedSh);
      if (big) { R(0.1, 0.2, 0.22, 0.21, C.bedSh); [[0.1, '#ffd65a'], [0.16, '#9fe4ff'], [0.22, '#ffb3de']].forEach(([u, c]) => R(u - 0.01, 0.22, u + 0.01, 0.26, c)); }
    } else {
      // ベッド
      R(0.0, 0.58, 0.25, 0.9, C.bedWood);
      R(0.0, 0.6, 0.24, 0.76, C.sheet);
      R(0.0, 0.66, 0.24, 0.8, mix(tint, '#ffffff', 0.35));
      if (big) R(0.0, 0.66, 0.24, 0.675, mix(tint, '#ffffff', 0.6));
      R(0.02, 0.6, 0.12, 0.66, C.pillow);
      R(0.0, 0.8, 0.25, 0.83, C.bedSh);
      R(0.23, 0.56, 0.25, 0.9, C.bedSh);
    }
    if (st >= 3) { // 机といす
      R(0.6, 0.52, 0.78, 0.55, C.bedWood); R(0.6, 0.55, 0.62, 0.76, C.bedSh); R(0.76, 0.55, 0.78, 0.76, C.bedSh);
      R(0.62, 0.55, 0.7, 0.62, C.doorHi);
      if (big) R(0.645, 0.58, 0.675, 0.59, C.knob);
    }
    if (st === 2 && o.randoseru) { // ランドセル
      const rc = THEME_COL[o.randoseru] || '#c94a3a';
      R(0.735, 0.34, 0.745, 0.37, C.bedSh);
      R(0.72, 0.37, 0.77, 0.47, rc); if (big) { R(0.72, 0.37, 0.77, 0.4, mix(rc, '#000000', 0.2)); R(0.74, 0.41, 0.75, 0.43, C.knob); }
    }
    // スタンドの灯り
    const lx = X(0.73), ly0 = Y(0.3), ly1 = Y(0.86);
    if (st <= 2) {
      fill(lx, ly0 + 2, lx + Math.max(1, px), ly1, C.lampPole);
      fill(lx - Math.max(2, Math.round(W * 0.03)), ly1 - 1, lx + Math.max(3, Math.round(W * 0.035)), ly1, C.lampPole);
      fill(lx - Math.max(2, Math.round(W * 0.035)), ly0 - Math.max(2, Math.round(H * 0.06)), lx + Math.max(3, Math.round(W * 0.04)), ly0 + 2, C.shade, time === 'night');
    } else {
      fill(X(0.64), Y(0.45), X(0.65), Y(0.52), C.lampPole);
      fill(X(0.62), Y(0.42), X(0.68), Y(0.46), C.shade, time === 'night');
    }

    /* ラグ */
    const rcx = W * 0.5, rcy = H * 0.9, rrx = W * 0.26, rry = H * 0.075;
    for (let y = Y(0.8); y < H; y++) for (let x = 0; x < W; x++) {
      const d = ((x + 0.5 - rcx) / rrx) ** 2 + ((y + 0.5 - rcy) / rry) ** 2;
      if (d <= 1) put(x, y, d > 0.72 ? C.rugEdge : (big && d > 0.5 && d < 0.6 ? C.rugIn : C.rug));
    }

    /* 飾り（色ごと） */
    const lv = (t) => deco[t] || 0;
    if (lv('sora') >= 1) { // 紙ひこうきのモビール
      const hx = X(0.58);
      fill(hx, 0, hx + 1, Y(0.1), C.bedSh);
      [[0.5, 0.12], [0.58, 0.16], [0.66, 0.11]].forEach(([u, v], i) => { if (!big && i === 1) return; R(u - 0.03, v, u + 0.03, v + 0.018, '#ffffff'); R(u - 0.01, v + 0.018, u + 0.02, v + 0.035, '#dbe9f5'); });
      if (big) R(0.5, 0.1, 0.66, 0.105, C.bedSh);
    }
    if (lv('sora') >= 2) { R(0.44, 0.14, 0.56, 0.27, '#8fd0f2'); if (big) { R(0.46, 0.16, 0.49, 0.2, '#7fc47a'); R(0.51, 0.19, 0.55, 0.24, '#7fc47a'); R(0.47, 0.22, 0.49, 0.25, '#7fc47a'); } }
    if (lv('mido') >= 1) { // 窓辺の鉢
      [[0.12, '#6fb46a'], [0.3, '#8fcf6a']].forEach(([u, c]) => { R(u - 0.025, 0.46, u + 0.025, 0.5, '#c9754a'); R(u - 0.035, 0.4, u + 0.035, 0.46, c); if (big) R(u - 0.005, 0.37, u + 0.015, 0.41, c); });
    }
    if (lv('mido') >= 2) { // 大きな観葉植物
      R(0.54, 0.62, 0.6, 0.72, '#c9754a'); R(0.51, 0.44, 0.63, 0.62, '#5f9f55'); if (big) { R(0.53, 0.46, 0.56, 0.5, '#86c46e'); R(0.58, 0.5, 0.61, 0.55, '#86c46e'); R(0.55, 0.4, 0.58, 0.44, '#5f9f55'); }
    }
    if (lv('hono') >= 1) { // ボール
      const bx = X(0.27), by = Y(0.9), br = Math.max(1, Math.round(W * 0.022));
      for (let y = -br; y <= br; y++) for (let x = -br; x <= br; x++) if (x * x + y * y <= br * br + 0.5) put(bx + x, by + y, (x + y) % 3 === 0 && big ? '#2e2e3a' : '#ffffff');
    }
    if (lv('hono') >= 2) { // ペナント
      for (let k = 0; k < Math.max(3, X(0.1)); k++) fill(X(0.1) + k, Y(0.02), X(0.1) + k + 1, Y(0.02) + Math.max(1, Math.round((X(0.1) - k) * 0.5)), '#e8574a');
      if (big) R(0.12, 0.03, 0.15, 0.04, '#ffffff');
    }
    if (lv('hosi') >= 1) { // 本の山
      const bx = st >= 3 ? 0.66 : 0.64, by = st >= 3 ? 0.52 : 0.78;
      ['#5563b8', '#e8c25a', '#b85a5a', '#6fb46a'].forEach((c, i) => R(bx + (i % 2) * 0.01, by - (i + 1) * 0.025, bx + 0.07 + (i % 2) * 0.01, by - i * 0.025, c));
    }
    if (lv('hosi') >= 2) { // 星図
      R(0.58, 0.1, 0.7, 0.27, '#232a5c'); if (big) [[0.6, 0.13], [0.64, 0.18], [0.67, 0.12], [0.62, 0.23], [0.68, 0.22], [0.65, 0.15]].forEach(([u, v]) => put(X(u), Y(v), '#fff6c9', 1));
      else put(X(0.64), Y(0.18), '#fff6c9', 1);
    }
    if (lv('uta') >= 1) { // 貼った絵
      [[0.41, '#ffe0ee', '#f59ac8'], [0.47, '#e3f3ff', '#8fd0f2'], [0.53, '#fff5d6', '#f2c14e']].forEach(([u, bg, fg], i) => { if (!big && i === 2) return; R(u, 0.39, u + 0.045, 0.47, bg); R(u + 0.01, 0.41, u + 0.035, 0.45, fg); });
    }
    if (lv('uta') >= 2) { // ギター
      R(0.77, 0.44, 0.785, 0.62, '#8d6444'); R(0.755, 0.62, 0.8, 0.74, '#e39a55'); if (big) R(0.77, 0.66, 0.785, 0.69, '#5b3b28');
    }
    if (lv('hina') >= 1) { // ちゃぶ台とお茶
      R(0.27, 0.74, 0.37, 0.76, C.bedWood); R(0.28, 0.76, 0.29, 0.8, C.bedSh); R(0.35, 0.76, 0.36, 0.8, C.bedSh);
      R(0.29, 0.71, 0.32, 0.74, '#ffffff'); if (big) R(0.33, 0.72, 0.35, 0.74, '#f2c14e');
    }
    if (lv('hina') >= 2) { // 棚のびん
      ['#f2c14e', '#e0674a', '#fff4dc'].forEach((c, i) => R(0.46 + i * 0.04, shv - 0.05, 0.49 + i * 0.04, shv, c));
    }
    if (lv('yoru') >= 1) { // 星のガーランド
      for (let x = X(0.4); x < X(0.78); x++) { const y = Y(0.03) + Math.round(Math.sin((x - X(0.4)) / W * 18) * Math.max(1, H * 0.012)); put(x, y, '#6a5a8a'); if ((x - X(0.4)) % Math.max(3, Math.round(W / 16)) === 0) put(x, y + 1, '#fff0a8', 1); }
    }
    if (lv('yoru') >= 2) { // 月のランプ
      const mx = X(0.66), my = Y(shv) - Math.max(2, Math.round(H * 0.04)), mr = Math.max(1, Math.round(W * 0.018));
      for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) if (x * x + y * y <= mr * mr + 0.5 && !((x - mr * 0.6) ** 2 + (y + mr * 0.3) ** 2 < mr * mr * 0.6)) put(mx + x, my + y, '#ffe9a8', 1);
    }

    b.glow = glow; b.meta = { x0, x1, y0, y1, st, time, wallBot };
    return b;
  }

  // 光のあたりかた（人物を重ねたあとにかける）。glow の画素は暗くしない
  function light(b, room) {
    const W = b.w, H = b.h, glow = room.glow, m = room.meta;
    const { x0, x1, y0, y1, st, time, wallBot } = m;
    const X = (u) => Math.round(u * W), Y = (v) => Math.round(v * H);
    const lampX = st <= 2 ? X(0.73) : X(0.65), lampY = st <= 2 ? Y(0.28) : Y(0.44);
    const winCx = (x0 + x1) / 2, winCy = (y0 + y1) / 2;
    PX.tone(b, (r, g, bl, x, y) => {
      if (glow[y * W + x]) return [r, g, bl];
      if (time === 'day') return [r, g, bl];
      if (time === 'morning') { const k = 1 - 0.12 * (y / H); return [r * k + 6, g * k + 2, bl * (k - 0.02)]; }
      if (time === 'evening') { const d = Math.hypot(x - winCx, (y - winCy) * 1.3) / W; const k = 0.95 - d * 0.35; return [r * k + 18, g * (k - 0.1), bl * (k - 0.28)]; }
      const d = Math.hypot(x - lampX, (y - lampY) * 1.1) / W;
      const L = Math.max(0, 0.55 - d * 1.25);
      const th = BAYER[(y % 4) * 4 + (x % 4)] / 16 * 0.08;
      const lq = Math.floor((L + th) * 10) / 10;
      return [r * (0.3 + lq * 1.05) + 8, g * (0.3 + lq * 0.9) + 6, bl * (0.42 + lq * 0.55) + 18];
    });
    if (time === 'evening' || time === 'morning') {
      const col = time === 'evening' ? [255, 190, 120] : [255, 244, 220], a = time === 'evening' ? 0.22 : 0.16;
      for (let y = Y(wallBot); y < H; y++) {
        const t = (y - Y(wallBot)) / (H - Y(wallBot));
        const sx0 = Math.round(x0 + (time === 'evening' ? 1 : -0.2) * t * W * 0.35), sx1 = Math.round(x1 + (time === 'evening' ? 1.1 : 0.1) * t * W * 0.35);
        for (let x = Math.max(0, sx0); x < Math.min(W, sx1); x++) if (!glow[y * W + x]) b.put(x, y, col, a);
      }
    }
    return b;
  }

  // 人物の足もと（部屋の中の立ち位置）
  const spot = (W, H) => ({ x: Math.round(W * 0.5), y: Math.round(H * 0.93) });
  const door = (W, H) => ({ x: Math.round(W * 0.875), y: Math.round(H * 0.73) });

  const API = { room, light, spot, door, THEME_COL };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.TR2 = API;
})(typeof window !== 'undefined' ? window : globalThis);
