/* =========================================================
   ツブのとっておき — むすび（12の結末）
   絵は 128×96。いちばん細かい解像度で描く
   ========================================================= */
(function (G) {
  'use strict';
  const PX = G.PX, TA = G.TA, TI = G.TI;
  const ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const NAMES = {
    A: '空の郵便屋', B: '森のお医者さん', C: '雪山の救助隊', D: '星をかぞえる人', E: 'うたうたい', F: '坂の上のパン屋',
    G: '星の海の飛行士', H: '森の絵本作家', I: '空中ブランコ', J: 'ふつうの毎日', K: 'ひと粒にかえる', L: 'あなたのとなり',
  };
  const W = 128, H = 96;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  /* ---- 描く道具 ---- */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function grad(b, x0, y0, x1, y1, c0, c1, steps) {
    steps = steps || 6;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const t = (y - y0) / Math.max(1, y1 - y0 - 1), th = BAYER[(y % 4) * 4 + (x % 4)] / 16;
      b.put(x, y, PX.mix(c0, c1, Math.min(1, Math.floor(t * steps + th) / steps)));
    }
  }
  const rect = (b, x, y, w, h, c, a) => b.fill(Math.round(x), Math.round(y), Math.round(w), Math.round(h), c, a);
  function disc(b, cx, cy, r, c, a) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) b.put(cx + x, cy + y, c, a); }
  function ell(b, cx, cy, rx, ry, c, a) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1.02) b.put(cx + x, cy + y, c, a); }
  function tri(b, ax, ay, bx, by, cx, cy, c, a) {
    const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx)), minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
    const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const d1 = s(x + 0.5, y + 0.5, ax, ay, bx, by), d2 = s(x + 0.5, y + 0.5, bx, by, cx, cy), d3 = s(x + 0.5, y + 0.5, cx, cy, ax, ay);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) b.put(x, y, c, a);
    }
  }
  function line(b, x0, y0, x1, y1, c, a) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) b.put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c, a); }
  function stars(b, n, seed, y1, cols) { const r = rng(seed); for (let i = 0; i < n; i++) { const x = r() * W | 0, y = r() * (y1 || H) | 0; b.put(x, y, (cols || ['#fff6c9', '#c8d4ff', '#ffffff'])[i % 3], 0.5 + r() * 0.5); } }
  function girl(b, look, x, y, face, over) {
    const lk = Object.assign({}, look, over || {});
    const g = TA.build(4, lk, face || 'n');
    b.blit(g, Math.round(x - g.w / 2), Math.round(y - g.h));
    const d = TA.dot(4), tint = (TA.TINT[lk.tint] || TA.TINT.fu).g;
    return { x: Math.round(x - g.w / 2), y: Math.round(y - g.h), w: g.w, h: g.h, dot: [Math.round(x - g.w / 2) + d[0], Math.round(y - g.h) + d[1]], tint };
  }
  function glowDot(b, gp) { const [x, y] = gp.dot; b.put(x, y, gp.tint); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => b.put(x + dx, y + dy, gp.tint, 0.35)); }
  function cloud(b, x, y, s, c) { disc(b, x, y, s, c); disc(b, x + s, y + 1, s - 1, c); disc(b, x - s + 1, y + 1, s - 2, c); rect(b, x - s, y + 1, s * 2 + 1, s - 1, c); }

  /* ---- 見た目（髪は育ったとおり、服は結末ごと） ---- */
  function baseLook(d) {
    const lk = (d && d.look) || { hair: 'fu', outfit: 'fu', tint: 'fu', yoru: 0, acc: [] };
    const hair = (d && d.hairs && d.hairs[2]) || lk.hair || 'fu';
    return { hair, outfit: lk.outfit, tint: lk.tint, yoru: lk.yoru || 0, acc: [] };
  }
  const OUTFIT = {
    A: { outfit: 'sora', tint: 'sora', acc: ['goggles', 'scarf'] }, B: { outfit: 'mido', tint: 'mido', acc: ['glasses'] },
    C: { outfit: 'hono', tint: 'hono', acc: ['headband'] }, D: { outfit: 'hosi', tint: 'hosi', acc: ['glasses'] },
    E: { outfit: 'uta', tint: 'uta', acc: ['ribbon'] }, F: { outfit: 'hina', tint: 'hina', acc: [] },
    G: { outfit: 'space', tint: 'sora', acc: [] }, H: { outfit: 'mido', tint: 'uta', acc: ['crown'] }, I: { outfit: 'circus', tint: 'uta', acc: ['ribbon'] },
    J: { outfit: 'fu', acc: [] }, K: { outfit: 'yoru', tint: 'yoru', acc: [] }, L: { acc: [] },
  };

  /* ---- 12の絵 ---- */
  const SCENE = {
    A(b, lk) { // 空の郵便屋：海と桟橋と、赤い水上飛行機
      grad(b, 0, 0, W, 58, '#7cc3ee', '#dff3ff', 7);
      cloud(b, 22, 16, 6, '#ffffff'); cloud(b, 96, 10, 5, '#f4f9ff'); cloud(b, 70, 28, 4, '#ffffff');
      grad(b, 0, 58, W, 78, '#5aa9dc', '#2f78b8', 5);
      ell(b, 108, 58, 16, 4, '#6fb46a'); rect(b, 92, 58, 32, 1, '#4d8f4f'); rect(b, 104, 52, 2, 6, '#fff6e6'); rect(b, 103, 50, 4, 2, '#e8574a');
      const r = rng(3); for (let i = 0; i < 30; i++) b.put(r() * W | 0, 60 + (r() * 18 | 0), '#bfe6ff', 0.7);
      // 飛行機
      rect(b, 72, 70, 40, 3, '#fffaf0'); rect(b, 74, 73, 36, 1, '#c9ccd8'); line(b, 80, 66, 80, 70, '#5a4a4a'); line(b, 102, 66, 102, 70, '#5a4a4a');
      ell(b, 90, 62, 20, 4, '#e8574a'); rect(b, 74, 60, 34, 2, '#ff8a70'); rect(b, 70, 55, 5, 7, '#c23b35');
      rect(b, 80, 52, 24, 3, '#c23b35'); rect(b, 80, 52, 24, 1, '#ff8a70'); line(b, 84, 55, 84, 59, '#5a4a4a'); line(b, 100, 55, 100, 59, '#5a4a4a');
      rect(b, 93, 57, 5, 3, '#9fe4ff'); rect(b, 110, 56, 2, 12, '#b9c0cc', 0.8); disc(b, 110, 62, 2, '#6a707a');
      // 桟橋
      grad(b, 0, 78, 72, 96, '#b8804a', '#8a5a2a', 3);
      for (let x = 0; x < 72; x += 8) rect(b, x, 78, 1, 18, '#6a4028');
      rect(b, 0, 78, 72, 1, '#d9a86a');
      for (let x = 6; x < 70; x += 20) rect(b, x, 86, 3, 10, '#5a3a22');
      // 手紙が風にのる
      [[14, 34], [26, 26], [40, 38], [8, 44]].forEach(([x, y], i) => { rect(b, x, y, 5, 3, '#fffaf0'); b.put(x + 2, y + 1, i % 2 ? '#e8574a' : '#5ea8d6'); });
      const gp = girl(b, lk, 44, 90, 'joy');
      rect(b, gp.x + gp.w - 4, gp.y + 26, 6, 5, '#8a5a3c'); rect(b, gp.x + gp.w - 3, gp.y + 27, 4, 1, '#f2c14e');
      return gp;
    },
    B(b, lk) { // 森のお医者さん
      grad(b, 0, 0, W, 60, '#dff0c8', '#b8dca0', 5);
      const r = rng(9);
      for (let i = 0; i < 9; i++) { const x = i * 16 - 4 + (r() * 6 | 0), h = 30 + (r() * 16 | 0); tri(b, x, 70 - h, x - 10, 70, x + 10, 70, '#7fae78'); }
      for (let i = 0; i < 7; i++) { const x = i * 22 + 4 + (r() * 8 | 0), h = 36 + (r() * 14 | 0); tri(b, x, 78 - h, x - 12, 78, x + 12, 78, '#4f8a4f'); rect(b, x - 1, 76, 3, 4, '#6a4a2a'); }
      grad(b, 0, 76, W, 96, '#8cc46e', '#6fa85a', 4);
      // 小屋
      rect(b, 86, 50, 36, 28, '#c98f5a'); tri(b, 82, 50, 104, 34, 126, 50, '#b8503a'); rect(b, 84, 49, 40, 2, '#8a3a2a');
      for (let y = 52; y < 78; y += 4) rect(b, 86, y, 36, 1, '#b07a48');
      rect(b, 108, 58, 10, 20, '#8a5a3c'); disc(b, 110, 68, 1, '#f2c14e');
      rect(b, 91, 56, 10, 8, '#fff3b8'); rect(b, 95, 56, 1, 8, '#8a5a3c'); rect(b, 91, 59, 10, 1, '#8a5a3c');
      rect(b, 96, 40, 8, 8, '#ffffff'); rect(b, 99, 41, 2, 6, '#6fb46a'); rect(b, 97, 43, 6, 2, '#6fb46a');
      // どうぶつ
      ell(b, 22, 86, 4, 3, '#ffffff'); rect(b, 20, 80, 1, 4, '#ffffff'); rect(b, 23, 80, 1, 4, '#ffffff'); b.put(24, 85, '#3a2030'); b.put(18, 86, '#ffd0e0');
      ell(b, 72, 86, 5, 3, '#f28a3a'); tri(b, 75, 81, 77, 78, 79, 83, '#f28a3a'); b.put(77, 82, '#3a2030'); rect(b, 65, 84, 3, 2, '#ffffff'); rect(b, 69, 85, 4, 1, '#ffffff', 0.9);
      rect(b, 71, 83, 3, 1, '#ffffff'); rect(b, 72, 82, 1, 3, '#ffffff');
      const gp = girl(b, lk, 46, 92, 'joy');
      ell(b, gp.x + gp.w - 3, gp.y + 18, 2, 2, '#5ea8d6'); b.put(gp.x + gp.w - 1, gp.y + 18, '#f2c14e');
      return gp;
    },
    C(b, lk) { // 雪山の救助隊
      grad(b, 0, 0, W, 60, '#9fb8d8', '#e6eef8', 6);
      tri(b, 30, 14, -10, 70, 70, 70, '#c9d6e8'); tri(b, 30, 14, 20, 30, 38, 28, '#ffffff');
      tri(b, 92, 6, 44, 70, 140, 70, '#b7c7de'); tri(b, 92, 6, 80, 24, 102, 22, '#ffffff');
      tri(b, 92, 6, 104, 70, 140, 70, '#9fb2cc', 0.6);
      grad(b, 0, 66, W, 96, '#ffffff', '#dbe6f2', 4);
      // 旗
      rect(b, 96, 50, 1, 34, '#6a707a'); tri(b, 97, 50, 110, 54, 97, 58, '#f28a3a');
      // 犬
      ell(b, 80, 86, 8, 5, '#b8804a'); ell(b, 88, 80, 4, 4, '#b8804a'); rect(b, 86, 81, 5, 3, '#ffffff'); b.put(89, 79, '#3a2030'); b.put(91, 81, '#3a2030');
      rect(b, 74, 88, 2, 5, '#8a5a2a'); rect(b, 84, 88, 2, 5, '#8a5a2a'); rect(b, 76, 82, 6, 2, '#ffffff'); rect(b, 83, 84, 3, 2, '#e8574a');
      const gp = girl(b, lk, 46, 93, 'n');
      const r = rng(5); for (let i = 0; i < 60; i++) b.put(r() * W | 0, r() * H | 0, '#ffffff', 0.85);
      return gp;
    },
    D(b, lk) { // 星をかぞえる人
      grad(b, 0, 0, W, 76, '#0e1236', '#2a3470', 7);
      stars(b, 140, 11, 70);
      for (let x = 0; x < W; x++) for (let k = 0; k < 6; k++) { const y = Math.round(10 + x * 0.35 + Math.sin(x / 9 + k) * 4 + k); b.put(x, y, '#c8d4ff', 0.12); }
      // ほうき星
      line(b, 30, 10, 58, 22, '#bfe6ff', 0.5); line(b, 30, 11, 57, 23, '#bfe6ff', 0.3); disc(b, 58, 22, 1, '#ffffff');
      // 丘と天文台
      ell(b, 96, 96, 60, 24, '#1f2548'); ell(b, 20, 100, 50, 22, '#262c55');
      rect(b, 92, 60, 26, 14, '#d9dde8'); ell(b, 105, 60, 13, 10, '#c9ccd8'); rect(b, 92, 60, 26, 1, '#9aa3b0'); rect(b, 104, 50, 3, 10, '#2a3060'); rect(b, 100, 66, 6, 8, '#fff3b8');
      // 望遠鏡
      line(b, 66, 92, 70, 76, '#8a909a'); line(b, 76, 92, 71, 76, '#8a909a'); rect(b, 64, 70, 14, 4, '#f4f4f8'); rect(b, 76, 69, 3, 6, '#c9ccd8');
      const gp = girl(b, lk, 44, 94, 'wow');
      return gp;
    },
    E(b, lk) { // うたうたい
      grad(b, 0, 0, W, 72, '#1a1030', '#3a1f4a', 5);
      for (let y = 0; y < 90; y++) { const w = 6 + y * 0.42; rect(b, 50 - w / 2, y, w, 1, '#fff3c4', 0.12 + (BAYER[(y % 4) * 4] / 16) * 0.05); }
      rect(b, 0, 72, W, 24, '#6a4028'); for (let x = 0; x < W; x += 10) rect(b, x, 72, 1, 8, '#5a3420'); rect(b, 0, 72, W, 1, '#b8804a');
      ell(b, 50, 88, 22, 4, '#fff3c4', 0.3);
      // マイク
      rect(b, 66, 60, 1, 30, '#9aa3b0'); disc(b, 66, 58, 2, '#3a3a4a'); rect(b, 62, 89, 9, 1, '#6a707a');
      // 客席
      const r = rng(21);
      for (let i = 0; i < 22; i++) { const x = (i * 6 + (r() * 4 | 0)) % W, y = 90 + (i % 2) * 3; disc(b, x, y, 3, '#140c22'); if (i % 5 === 1) { line(b, x + 2, y - 6, x + 3, y - 2, '#ff9ad8'); } if (i % 7 === 3) line(b, x - 2, y - 6, x - 1, y - 2, '#9fe4ff'); }
      [[20, 20], [100, 14], [110, 40], [12, 50], [86, 30]].forEach(([x, y]) => { b.put(x, y, '#fff3c4'); b.put(x + 1, y, '#fff3c4', 0.5); b.put(x - 1, y, '#fff3c4', 0.5); b.put(x, y + 1, '#fff3c4', 0.5); b.put(x, y - 1, '#fff3c4', 0.5); });
      const gp = girl(b, lk, 50, 88, 'joy');
      return gp;
    },
    F(b, lk) { // 坂の上のパン屋
      grad(b, 0, 0, W, 40, '#f6a878', '#ffd9a0', 5);
      rect(b, 0, 24, W, 58, '#f4e4cf');
      for (let y = 26; y < 80; y += 6) for (let x = (y / 6 | 0) % 2 ? 0 : 5; x < W; x += 10) rect(b, x, y, 1, 1, '#e6ccb0');
      // 日よけ
      for (let x = 10; x < 118; x += 8) { rect(b, x, 30, 4, 10, '#e8574a'); rect(b, x + 4, 30, 4, 10, '#fff6ea'); tri(b, x, 40, x + 4, 40, x + 2, 43, '#e8574a'); tri(b, x + 4, 40, x + 8, 40, x + 6, 43, '#fff6ea'); }
      rect(b, 8, 28, 112, 2, '#8a3a2a');
      // 窓とパン
      rect(b, 14, 48, 52, 26, '#8a5a3c'); rect(b, 16, 50, 48, 22, '#fff3d0');
      [[22, 60], [32, 58], [44, 61], [54, 58], [26, 67], [40, 68], [52, 67]].forEach(([x, y]) => { ell(b, x, y, 5, 3, '#d9954a'); rect(b, x - 2, y - 1, 1, 1, '#f2c07a'); rect(b, x + 1, y - 1, 1, 1, '#f2c07a'); });
      rect(b, 16, 64, 48, 1, '#c9a070');
      // 扉と看板
      rect(b, 84, 46, 22, 36, '#a8703f'); rect(b, 87, 50, 16, 14, '#fff3d0'); disc(b, 101, 68, 1, '#f2c14e');
      rect(b, 76, 12, 30, 10, '#6a4028'); ell(b, 91, 17, 8, 3, '#d9954a'); rect(b, 86, 16, 1, 1, '#f2c07a'); rect(b, 94, 16, 1, 1, '#f2c07a');
      // 石だたみ
      grad(b, 0, 80, W, 96, '#c9b8a0', '#a8987e', 3);
      for (let y = 82; y < 96; y += 4) for (let x = (y / 4 | 0) % 2 ? 0 : 4; x < W; x += 9) rect(b, x, y, 7, 1, '#b8a88e');
      const gp = girl(b, lk, 72, 93, 'joy');
      rect(b, gp.x - 6, gp.y + 26, 12, 2, '#8a5a3c'); ell(b, gp.x - 2, gp.y + 24, 3, 2, '#d9954a'); ell(b, gp.x + 3, gp.y + 24, 3, 2, '#e2a560');
      return gp;
    },
    G(b, lk) { // 星の海の飛行士
      rect(b, 0, 0, W, H, '#05060f'); stars(b, 160, 33);
      // 地球
      for (let y = 50; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x - 100, dy = y - 150, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 96) { const land = Math.sin(x / 7) + Math.cos(y / 5 + x / 13) > 0.9; b.put(x, y, land ? '#5f9f55' : '#2f6fb8'); if (Math.sin(x / 4 + y / 3) > 0.93) b.put(x, y, '#ffffff'); }
        else if (d < 100) b.put(x, y, '#8fd0f2', (100 - d) / 5);
      }
      // ふわり
      const gp = girl(b, lk, 52, 72, 'joy');
      const hx = gp.x + gp.w / 2, hy = gp.y + 11;
      for (let a = 0; a < Math.PI * 2; a += 0.05) b.put(Math.round(hx + Math.cos(a) * 12), Math.round(hy + Math.sin(a) * 12), '#dff3ff', 0.7);
      disc(b, Math.round(hx - 6), Math.round(hy - 7), 1, '#ffffff', 0.8);
      for (let i = 0; i < 40; i++) b.put(gp.x + gp.w / 2 + i, gp.y + 30 + Math.round(Math.sin(i / 5) * 3), '#c9ccd8', 0.8);
      return gp;
    },
    H(b, lk) { // 森の絵本作家
      rect(b, 0, 0, W, H, '#f0dcc0');
      for (let y = 0; y < 70; y += 8) rect(b, 0, y, W, 1, '#e6cda8');
      // 窓の外の森
      rect(b, 8, 10, 46, 42, '#fff8ec'); grad(b, 11, 13, 51, 49, '#cfe8c0', '#a8d090', 4);
      for (let i = 0; i < 5; i++) tri(b, 14 + i * 9, 22 + (i % 2) * 5, 8 + i * 9, 49, 20 + i * 9, 49, '#5f9f55');
      rect(b, 30, 13, 2, 36, '#fff8ec');
      // 机と絵本
      rect(b, 60, 60, 66, 4, '#a8703f'); rect(b, 64, 64, 3, 32, '#8a5a3c'); rect(b, 118, 64, 3, 32, '#8a5a3c');
      rect(b, 72, 46, 34, 14, '#fffaf0'); rect(b, 88, 46, 2, 14, '#e6dcc8');
      ell(b, 80, 52, 4, 3, '#7fc47a'); b.put(79, 51, '#3a2030'); rect(b, 76, 56, 8, 1, '#8a6a4a');
      rect(b, 94, 50, 8, 6, '#c9d6e8'); rect(b, 95, 49, 6, 1, '#e8574a'); rect(b, 96, 52, 2, 2, '#f2c14e'); rect(b, 99, 52, 2, 2, '#8fd0f2');
      rect(b, 110, 52, 4, 8, '#3a3a5a'); rect(b, 111, 50, 2, 2, '#6a707a');
      [[62, 57, '#e8574a'], [65, 57, '#5ea8d6'], [68, 57, '#f2c14e']].forEach(([x, y, c]) => rect(b, x, y, 1, 3, c));
      grad(b, 0, 86, W, 96, '#b8804a', '#a8703f', 2);
      const gp = girl(b, lk, 40, 94, 'joy');
      return gp;
    },
    I(b, lk) { // 空中ブランコ
      rect(b, 0, 0, W, H, '#1a0e1e');
      for (let i = 0; i < 16; i++) tri(b, 64, -4, i * 9 - 8, 70, i * 9 + 1, 70, i % 2 ? '#8a1f2a' : '#e6d6c8', 0.9);
      grad(b, 0, 70, W, 96, '#3a1a2a', '#2a1020', 3);
      ell(b, 64, 88, 40, 6, '#c9a070', 0.5);
      // スポットライト
      for (let y = 0; y < 70; y++) { const w = 4 + y * 0.35; rect(b, 34 - w / 2 + y * 0.1, y, w, 1, '#fff3c4', 0.16); }
      // ブランコ
      line(b, 80, 0, 84, 40, '#e6d6c8'); line(b, 98, 0, 94, 40, '#e6d6c8'); rect(b, 83, 40, 13, 2, '#f2c14e');
      // 台
      rect(b, 22, 62, 26, 3, '#c9a070'); rect(b, 33, 65, 2, 31, '#8a6a4a');
      // 紙ふぶき
      const r = rng(4); const cols = ['#ffe08a', '#ff9ad8', '#9fe4ff', '#b6f0a0'];
      for (let i = 0; i < 50; i++) b.put(r() * W | 0, r() * 70 | 0, cols[i % 4], 0.9);
      const gp = girl(b, lk, 35, 62, 'joy');
      return gp;
    },
    J(b, lk, d) { // ふつうの毎日：あの部屋に、夕方、帰ってくる
      const room = G.TR2.room(W, H, { st: 4, time: 'evening', season: 'autumn', deco: (d && d.deco) || {}, tint: lk.tint });
      b.blit(room, 0, 0);
      const gp = girl(b, lk, 58, 90, 'joy');
      const bx = gp.x + gp.w - 4, by = gp.y + 22;
      rect(b, bx, by, 8, 9, '#d9b07a'); rect(b, bx, by, 8, 1, '#b8804a'); rect(b, bx + 1, by - 5, 1, 5, '#7fc47a'); rect(b, bx + 2, by - 4, 1, 4, '#fffaf0'); ell(b, bx + 5, by - 1, 2, 1, '#d9954a');
      const f = b.clone(); G.TR2.light(f, room); b.d.set(f.d);
      return gp;
    },
    K(b, lk) { // ひと粒にかえる
      grad(b, 0, 0, W, 80, '#0b0c26', '#2a2458', 7); stars(b, 90, 7, 70);
      // 屋根
      for (let y = 78; y < H; y++) for (let x = 0; x < W; x++) b.put(x, y, (x + (y % 4 < 2 ? 0 : 3)) % 6 === 0 ? '#2a2238' : '#3a3050');
      rect(b, 0, 78, W, 1, '#5a4a70');
      const gp = girl(b, lk, 64, 66, 'n');
      // 足もとから、光の粒にほどける
      const r = rng(8);
      for (let y = gp.y + 26; y < gp.y + gp.h; y++) for (let x = gp.x; x < gp.x + gp.w; x++) {
        const c = b.get(x, y); if (!c) continue;
        const k = (y - (gp.y + 26)) / (gp.h - 26);
        if (r() < k * 1.1) { rect(b, x, y, 1, 1, '#1a1840'); if (r() < 0.5) b.put(x + (r() * 6 - 3 | 0), y - (r() * 30 | 0), r() < 0.5 ? '#fff3c4' : '#e2c6ff', 0.9); }
      }
      for (let i = 0; i < 26; i++) b.put(gp.x + (r() * gp.w | 0), gp.y - (r() * 40 | 0), r() < 0.5 ? '#fff3c4' : '#e2c6ff', 0.6 + r() * 0.4);
      disc(b, 104, 14, 1, '#fffbe6'); [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dy], i) => b.put(104 + dx, 14 + dy, '#fff3c4', i < 4 ? 0.6 : 0.25));
      return gp;
    },
    L(b, lk, d) { // あなたのとなり：だれもいない部屋。窓が開いている
      const room = G.TR2.room(W, H, { st: 4, time: 'night', season: 'spring', deco: (d && d.deco) || {}, tint: lk.tint, doorOpen: true });
      b.blit(room, 0, 0);
      const f = b.clone(); G.TR2.light(f, room); b.d.set(f.d);
      return null;
    },
  };

  function draw(id, d) {
    const b = new PX.Bmp(W, H);
    const lk = Object.assign(baseLook(d), OUTFIT[id] || {});
    if (id === 'L' && d && d.look) Object.assign(lk, { outfit: d.look.outfit, tint: d.look.tint });
    if (id === 'J' && d && d.look) lk.tint = d.look.tint;
    const gp = SCENE[id](b, lk, d);
    if (gp) glowDot(b, gp);
    return b;
  }

  /* ---- ことば ---- */
  const TXT = {
    A: ['ツブは、小さな水上飛行機の 免許をとった。', '島から島へ、手紙をはこぶ仕事。', '海の上では、風が いちばんの道しるべになる。', '毎月いちど、あなたの家の上を、赤い飛行機が ひくく飛んでいく。', '庭に落ちてくる手紙は、いつも 知らない町のにおいがした。'],
    B: ['ツブは、森のはずれで 小さな動物病院をひらいた。', 'けがをした鳥、迷子の子ぎつね、ときどき、くまの子も。', '看板には、ツブが描いた どんぐりの絵。', '夜おそくまで、診察室の灯りが 消えないことが多い。', '「生きものは、とっておけないから。だから、たすけるの」'],
    C: ['ツブは、山の救助隊にはいった。', 'ふぶきの夜も、赤い上着で 雪の中へ出ていく。', '相棒は、もこもこの 大きな犬。', '「だいじょうぶ。わたし、すぐに行くから」', 'ツブにたすけられた人は、みんな アホ毛の光を 覚えているという。'],
    D: ['ツブは、山の上の天文台で はたらいている。', '夜ごと 空をしらべて、まだ名前のない星を かぞえる。', 'ある冬、ツブは ひとつの ほうき星を見つけた。', 'そのほうき星には、ツブの名前が ついている。', '「わたしが来たところも、いつか 見つけられるかな」'],
    E: ['ツブは、うたうたいになった。', '駅前でうたっていた歌が、いつのまにか ラジオから流れてきた。', '大きな舞台に立つ日も、ツブは 客席のすみを さがす。', 'いちばん うしろの席に、あなたが いるかどうか。', '新しい歌の名前は、「とっておき」。'],
    F: ['ツブは、坂の上に 小さなパン屋をひらいた。', 'あなたの家から、歩いて 五分。', 'いちばん人気は、ちょっと こげた 丸いパン。', '朝いちばんの焼きたては、いつも あなたの分が とってある。', '「だって、ここが わたしの たからばこだもん」'],
    G: ['ツブは、宇宙飛行士になった。', '打ち上げの朝、ツブは 窓の外に 手をふった。', '宇宙からは、ふるさとの町の灯りが ひと粒の光みたいに 見えるという。', '「ねえ。わたし、ここから来たのかもしれない」', '通信の最後は、いつも「ただいま」で終わる。'],
    H: ['ツブは、森の近くで 絵本を描いている。', '主人公は、いつも ちいさな生きものたち。', 'いちばん読まれた一冊は、ひと粒の光が 女の子になる話。', 'その絵本の最後のページには、缶の絵が 描いてある。', '缶の中身は、読む人ごとに ちがって見えるらしい。'],
    I: ['ツブは、サーカスの 空中ブランコ乗りになった。', 'テントの いちばん高いところで、ツブは 手をはなす。', '一瞬だけ、宙にうかんで。', 'かならず、つぎのブランコを つかむ。', '「手をはなすのは、こわくないよ。ちゃんと つかめるって 知ってるから」'],
    J: ['ツブは、なにか特別なものには ならなかった。', '町の郵便局で はたらいて、週末は 花を育てて、ときどき 絵を描く。', '日曜の夕方には、買いものぶくろを さげて 帰ってくる。', '「ただいま。晩ごはん、なに？」', 'なにものにも なれたし、なにものにも ならなかった。それで、よかったと思う。'],
    K: ['十八の、春の夜。', 'ツブのからだが、すこしずつ 光の粒に ほどけはじめた。', '「……呼ばれてるの。帰らなきゃ」', '粒は ひとつ、またひとつ、窓から 夜空へ のぼっていった。', '最後の ひと粒が、あの夜と おなじように、あなたの手のひらで ふるえた。', 'いまでも、晴れた夜には、東の空に ひとつだけ まばたきをする星がある。'],
    L: ['ツブは、なにも持たずに 出ていった。', '……はずだった。', '「なにも とっておかない人って、ふしぎだね」', '「だから、わたしが とっておくことにしたの。あなたを」', 'ふと気づくと、ツブは 画面の外に いた。'],
  };
  const FLAVOR = {
    A: { hosi: '夜間飛行のときは、星をたよりに 飛ぶらしい。', mido: '配達先の島で、迷子の子やぎを 拾ったこともある。', hono: '嵐の日にも、ツブは 飛ぶのをやめなかった。', uta: '操縦席では、いつも 鼻歌をうたっている。', hina: '島のおばあさんたちに、お菓子を山ほど もらって帰ってくる。' },
    B: { sora: '渡り鳥の足に、ときどき 手紙をむすんで 空へ返す。', hono: '雪の日は、スキーで往診に行く。', hosi: '見たこともない こけの名前を、図鑑に 書きたしている。', uta: '待合室には、ツブの描いた 動物の絵が かざってある。', hina: '病院の縁側は、近所のおばあさんたちの 集まり場所になった。' },
    C: { sora: 'ヘリコプターから、ロープ一本で 降りていく。', mido: '山の花の咲く場所を、だれよりも よく知っている。', hosi: '天気図を読むのが、隊で いちばん うまい。', uta: '山小屋では、ツブの歌が いちばんの暖房らしい。', hina: '救助のあとは、いつも 熱いスープを つくってくれる。' },
    D: { sora: '観測のない日は、気球で 空の高いところまで のぼる。', mido: '天文台のまわりの 夜の花を、ぜんぶ知っている。', hono: '雪の山道を、毎晩 歩いて のぼる。', uta: '星の動きを、音楽にして 発表したこともある。', hina: '天文台の ストーブの上には、いつも やかんが のっている。' },
    E: { sora: '世界じゅうを まわって、うたっている。', mido: '森の中の ちいさな舞台が、いちばん 好きらしい。', hono: 'どんなに大きな会場でも、声が いちばん うしろまで とどく。', hosi: '歌詞には、いつも 星がでてくる。', hina: 'ライブのあとは、かならず 家に電話をくれる。' },
    F: { sora: '店の窓からは、遠くの港が 見える。', mido: '裏の畑で、パンにいれる ハーブを育てている。', hono: '朝三時に起きて、生地を こねる。', hosi: '焼き時間は、秒まで ノートに記録している。', uta: 'お店では、いつも ツブの鼻歌が 聞こえる。' },
  };
  function itemName(d) { const id = (d.bag && d.bag[0]) || (d.tin && d.tin[0]) || (d.mine && d.mine[0]); return id && TI.get(id) ? TI.get(id).name : null; }
  function lines(id, d) {
    const L = TXT[id].slice();
    const f = FLAVOR[id] && d && d.sec && FLAVOR[id][d.sec];
    if (f) L.splice(L.length - 1, 0, f);
    return L;
  }
  function letter(id, d) {
    const n = d ? itemName(d) : null, I = (s) => (n ? [s.replace('＊', n)] : []);
    const L = {
      A: ['あなたへ', 'きょうは、南の島まで 飛んだよ。', ...I('「＊」は、いまも 操縦席に かざってある。'), '缶は、まだ あの棚にある？', 'ツブ'],
      B: ['あなたへ', '子ぎつねが、きょう 森に帰ったよ。', ...I('「＊」は、診察室の 机の上。'), 'たまには、顔を見せにきてね。', 'ツブ'],
      C: ['あなたへ', 'ふぶきの夜は、あの家の灯りを 思いだす。', ...I('「＊」、いつも ポケットに入れてる。'), 'ツブ'],
      D: ['あなたへ', '今夜は、よく晴れてる。', ...I('「＊」を、望遠鏡の となりに 置いてるよ。'), '窓をあけて、空を見てみて。', 'ツブ'],
      E: ['あなたへ', 'つぎの歌は、あなたのことを 歌うよ。', ...I('「＊」のことも、ちょっとだけ。'), '聞いても、笑わないでね。', 'ツブ'],
      F: ['あなたへ', '明日の朝、パンを とりにきて。', ...I('「＊」は、レジの横に かざってある。'), 'ツブ'],
      G: ['あなたへ（宇宙より）', '地球って、缶みたい。', 'だいじなものが、ぜんぶ 入ってる。', ...I('「＊」も、ここまで 連れてきたよ。'), 'ツブ'],
      H: ['あなたへ', '新しい絵本が できました。', ...I('今度のお話には、「＊」が 出てくるよ。'), 'ツブ'],
      I: ['あなたへ', 'つぎの町は、海のそば。', ...I('「＊」は、テントの柱に むすんである。'), 'ツブ'],
      J: ['（れいぞうこの メモ）', 'プリン、ふたつ 買ってあるよ。', 'ひとつは、あなたの。', 'ツブ'],
      K: ['あなたへ', 'わたしを とっておいてくれて、ありがとう。', ...I('「＊」は、あなたに かえします。'), '空を見たら、わたしも 見てるよ。', 'ツブ'],
      L: [],
    };
    return L[id] || [];
  }

  G.TE = { ORDER, NAMES, draw, lines, letter, W, H };
})(window);
