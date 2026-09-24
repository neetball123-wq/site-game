/* =========================================================
   つづきから — ドット絵（地形・人物・飾り・パレット）
   絵はすべて「色番号」の並び。0＝いちばん明るい 〜 3＝いちばん暗い、
   4＝ゴースト（ふだんは0と同じ色。コントラストを上げると見える）、
   5＝あかり（夜でも明るいまま）、255＝透明。
   ========================================================= */
window.TPX = (() => {
  const S = 16, TR = 255;

  /* ---------- 描き道具 ---------- */
  function img(w, h, fill) { const a = new Uint8Array(w * h).fill(fill === undefined ? TR : fill); a.w = w; a.h = h; return a; }
  function pen(a) {
    const w = a.w, h = a.h;
    const px = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c; };
    const P = {
      a, px: (x, y, c) => { px(x, y, c); return P; },
      fill: (c) => { a.fill(c); return P; },
      rect: (x, y, rw, rh, c) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) px(x + i, y + j, c); return P; },
      hl: (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); return P; },
      vl: (x, y0, y1, c) => { for (let y = y0; y <= y1; y++) px(x, y, c); return P; },
      disc: (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) px(cx + x, cy + y, c); return P; },
      pts: (list, c) => { list.forEach(([x, y]) => px(x, y, c)); return P; },
      stamp: (rows, x0, y0) => { rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.') px(x0 + x, y0 + y, ch === 'g' ? 4 : ch === 'L' ? 5 : +ch); } }); return P; },
      over: (src, x0, y0) => { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const v = src[y * src.w + x]; if (v !== TR) px(x0 + x, y0 + y, v); } return P; }
    };
    return P;
  }
  const fromRows = (rows) => { const a = img(rows[0].length, rows.length); pen(a).stamp(rows, 0, 0); return a; };
  const mirror = (src) => { const a = img(src.w, src.h); for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) a[y * src.w + (src.w - 1 - x)] = src[y * src.w + x]; return a; };

  /* ---------- 地面 ---------- */
  const tuft = (d, x, y, c) => d.pts([[x, y], [x + 2, y], [x + 1, y + 1]], c);
  function grass(d, v) {
    d.fill(0);
    if (v % 2) { tuft(d, 6, 2, 1); tuft(d, 11, 6, 1); tuft(d, 2, 9, 2); tuft(d, 9, 12, 1); }
    else { tuft(d, 2, 3, 1); tuft(d, 9, 5, 2); tuft(d, 4, 11, 1); tuft(d, 12, 12, 1); }
  }
  function sand(d, v) {
    d.fill(0);
    const pts = v % 2 ? [[3, 2], [11, 4], [6, 8], [13, 10], [2, 13], [9, 14]] : [[5, 1], [12, 3], [2, 6], [9, 9], [14, 13], [5, 12]];
    d.pts(pts, 1); d.px(pts[1][0] + 1, pts[1][1], 1); d.px(pts[4][0], pts[4][1] + 1, 2);
  }
  function road(d, v) {
    d.fill(1);
    d.pts(v % 2 ? [[3, 3], [10, 6], [6, 12], [13, 13]] : [[5, 2], [12, 4], [2, 10], [9, 13]], 2);
    d.pts(v % 2 ? [[4, 3], [11, 6]] : [[6, 2], [3, 10]], 0);
  }
  function sea(d, f) {
    d.fill(2);
    const s = f ? 2 : 0;
    [[1, 3], [9, 7], [4, 12]].forEach(([x, y], i) => {
      const xx = (x + s + i) % 16;
      d.hl(xx, xx + 3, y, 1); d.px(xx + 1, y - 1, 0); d.px(xx + 2, y - 1, 0);
    });
  }
  const GROUND = { grass, sand, road, sea };

  /* ---------- 物（地面の上に描く） ---------- */
  function tree(d) {
    d.disc(8, 7, 7, 3).disc(8, 7, 6, 2);
    d.pts([[5, 3], [6, 3], [4, 4], [5, 5], [9, 3], [10, 4], [3, 7], [11, 6], [12, 8]], 1);
    d.pts([[5, 4], [10, 3]], 0);
    d.pts([[7, 11], [9, 10], [11, 11], [4, 10]], 3);
    d.rect(7, 13, 2, 3, 3);
  }
  function pine(d) {
    const tiers = [[1, 5, 1, 4], [4, 9, 2, 6], [8, 13, 3, 7]];
    tiers.forEach(([y0, y1, h0, h1]) => {
      for (let y = y0; y <= y1; y++) {
        const hw = Math.round(h0 + (h1 - h0) * (y - y0) / Math.max(1, y1 - y0));
        d.hl(8 - hw, 7 + hw, y, 2); d.px(8 - hw, y, 3); d.px(7 + hw, y, 3);
      }
      const w = h1; d.hl(8 - w, 7 + w, y1, 3);
    });
    d.pts([[6, 4], [5, 8], [9, 7], [4, 12], [10, 11]], 1);
    d.rect(7, 13, 2, 3, 3);
  }
  function rock(d) {
    d.disc(8, 9, 6, 3).disc(8, 9, 5, 2);
    d.pts([[5, 6], [6, 5], [7, 5], [5, 7], [4, 8]], 1); d.px(6, 6, 0);
    d.pts([[10, 12], [11, 11], [8, 13]], 3);
  }
  function wetrock(d) {
    d.disc(5, 6, 4, 3).disc(5, 6, 3, 2).px(4, 4, 1).px(3, 5, 1);
    d.disc(11, 11, 4, 3).disc(11, 11, 3, 2).px(10, 9, 1).px(9, 10, 1);
    d.px(12, 3, 3).px(13, 3, 3).px(2, 12, 3);
  }
  function cave(d, low) {
    d.disc(8, 8, 8, 3).disc(8, 8, 7, 2);
    d.pts([[4, 3], [5, 2], [6, 2], [3, 5]], 1);
    if (low) { d.disc(8, 11, 4, 3); d.rect(4, 11, 9, 5, 3); d.pts([[7, 7], [8, 7], [9, 7]], 3); }
    else { d.pts([[2, 13], [3, 14], [13, 13], [12, 14], [8, 15]], 0); d.disc(8, 11, 2, 3); }
  }
  function flowers(d) {
    [[4, 4], [11, 7], [6, 12], [13, 13]].forEach(([x, y]) => { d.pts([[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]], 1); d.px(x, y, 3); });
  }
  function roof(d, v) {
    d.fill(2);
    for (let y = 3; y < 16; y += 4) d.hl(0, 15, y, 3);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4 + v) % 2; x < 16; x += 3) d.px(x, y, 1);
    d.hl(0, 15, 15, 3);
  }
  function wall(d) {
    d.fill(0); d.vl(0, 0, 15, 2); d.vl(15, 0, 15, 2); d.hl(0, 15, 0, 3); d.hl(0, 15, 1, 2);
    d.rect(0, 13, 16, 3, 2); d.hl(0, 15, 12, 3);
  }
  function windowT(d, lit) {
    wall(d); d.rect(3, 3, 10, 8, 3); d.rect(4, 4, 8, 6, lit ? 5 : 1);
    d.vl(8, 4, 9, 3); d.hl(4, 11, 6, 3); if (!lit) d.pts([[5, 5], [9, 5]], 0);
  }
  function door(d) {
    wall(d); d.rect(3, 2, 10, 14, 3); d.rect(4, 3, 8, 13, 2);
    d.vl(8, 3, 15, 3); d.px(7, 9, 0); d.px(9, 9, 0); d.hl(4, 11, 3, 1);
  }
  function offering(d) {
    wall(d); d.hl(0, 15, 3, 3); d.pts([[3, 4], [3, 5], [8, 4], [8, 5], [8, 6], [13, 4], [13, 5]], 3);
    d.rect(2, 8, 12, 8, 3); d.rect(3, 9, 10, 6, 2); d.hl(3, 12, 11, 3); d.hl(3, 12, 13, 3); d.hl(3, 12, 9, 1);
  }
  function lantern(d) {
    d.rect(6, 13, 4, 3, 3); d.rect(7, 10, 2, 3, 2); d.vl(6, 10, 12, 3); d.vl(9, 10, 12, 3);
    d.rect(5, 6, 6, 4, 3); d.rect(6, 7, 4, 2, 1); d.px(7, 7, 3); d.px(8, 7, 3);
    d.hl(3, 12, 5, 3); d.hl(4, 11, 4, 3); d.hl(6, 9, 3, 3); d.px(7, 2, 3); d.px(8, 2, 3);
  }
  function ema(d) {
    d.vl(3, 10, 15, 3); d.vl(12, 10, 15, 3);
    d.rect(1, 2, 14, 9, 3); d.rect(2, 3, 12, 7, 2); d.hl(1, 14, 1, 3);
    [[3, 4], [7, 4], [11, 4], [3, 7], [7, 7], [11, 7]].forEach(([x, y], i) => { d.rect(x, y, 3, 2, i % 3 === 1 ? 1 : 0); });
  }
  function torii(d, pillar) {
    d.rect(0, 0, 16, 3, 3); d.hl(0, 15, 1, 2); d.rect(0, 5, 16, 2, 3);
    if (pillar) { d.rect(6, 3, 4, 13, 3); d.vl(7, 7, 15, 2); }
  }
  function steps(d) {
    d.fill(1);
    for (let y = 0; y < 16; y += 4) { d.hl(0, 15, y, 0); d.hl(0, 15, y + 3, 3); d.hl(0, 15, y + 2, 2); }
    d.vl(0, 0, 15, 3); d.vl(15, 0, 15, 3);
  }
  function sign(d) {
    d.rect(7, 10, 2, 6, 3); d.rect(1, 2, 14, 9, 3); d.rect(2, 3, 12, 7, 1);
    d.hl(4, 11, 5, 2); d.hl(4, 9, 7, 2); d.px(3, 3, 0); d.px(4, 3, 0);
  }
  function mailbox(d) {
    d.rect(4, 3, 8, 12, 3); d.rect(5, 4, 6, 10, 2); d.hl(5, 10, 3, 3);
    d.hl(6, 9, 6, 0); d.hl(6, 9, 7, 3); d.px(6, 5, 1);
    d.rect(3, 14, 10, 2, 3);
  }
  function well(d) {
    d.disc(8, 9, 6, 3).disc(8, 9, 5, 1).disc(8, 9, 3, 3);
    d.pts([[5, 5], [6, 4], [7, 4]], 0); d.pts([[11, 12], [10, 13]], 2);
    d.vl(2, 1, 9, 3); d.vl(13, 1, 9, 3); d.hl(2, 13, 1, 3);
  }
  function fence(d) {
    d.hl(0, 15, 6, 3); d.hl(0, 15, 7, 2); d.hl(0, 15, 10, 3); d.hl(0, 15, 11, 2);
    d.rect(2, 4, 2, 11, 3); d.rect(12, 4, 2, 11, 3); d.px(2, 4, 2); d.px(12, 4, 2);
  }
  function crops(d) {
    d.fill(2);
    [3, 8, 13].forEach(y => { d.hl(0, 15, y, 3); [1, 5, 9, 13].forEach(x => d.pts([[x, y - 1], [x + 1, y - 2], [x - 1, y - 2]], 0)); });
  }
  function pier(d, eL, eR, eB) {
    d.fill(1);
    for (let y = 3; y < 16; y += 4) d.hl(0, 15, y, 2);
    d.pts([[2, 1], [13, 1], [2, 5], [13, 5], [2, 9], [13, 9], [2, 13], [13, 13]], 3);
    if (eL) d.vl(0, 0, 15, 3); if (eR) d.vl(15, 0, 15, 3);
    if (eB) { d.hl(0, 15, 15, 3); d.rect(1, 12, 2, 4, 3); d.rect(13, 12, 2, 4, 3); }
  }
  function bench(d) {
    d.rect(1, 4, 14, 2, 3); d.rect(1, 7, 14, 3, 3); d.hl(2, 13, 8, 2);
    d.rect(2, 10, 2, 5, 3); d.rect(12, 10, 2, 5, 3);
  }

  /* ---------- 家の中 ---------- */
  function iwall(d, v) {
    d.fill(1);
    for (let x = v % 2 ? 1 : 3; x < 16; x += 4) d.vl(x, 0, 11, 0);
    d.rect(0, 12, 16, 4, 2); d.hl(0, 15, 12, 3); d.hl(0, 15, 15, 3);
  }
  function floor(d) {
    d.fill(0);
    for (let y = 3; y < 16; y += 4) d.hl(0, 15, y, 1);
    d.pts([[5, 0], [5, 1], [5, 2], [12, 4], [12, 5], [12, 6], [3, 8], [3, 9], [3, 10], [10, 12], [10, 13], [10, 14]], 1);
  }
  function tatami(d, eT, eB, eL, eR) {
    d.fill(1);
    for (let y = 1; y < 16; y += 2) for (let x = y % 4 === 1 ? 0 : 2; x < 16; x += 4) d.px(x, y, 0);
    if (eT) d.hl(0, 15, 0, 3); if (eB) d.hl(0, 15, 15, 3); if (eL) d.vl(0, 0, 15, 3); if (eR) d.vl(15, 0, 15, 3);
  }
  function futon(d) {
    d.rect(1, 1, 14, 15, 3); d.rect(2, 2, 12, 13, 0);
    d.rect(3, 3, 10, 4, 1); d.hl(3, 12, 7, 3);
    for (let y = 9; y < 15; y += 2) for (let x = 3 + (y % 4 === 1 ? 1 : 0); x < 14; x += 3) d.px(x, y, 2);
  }
  function table(d) { d.rect(1, 4, 14, 8, 3); d.rect(2, 5, 12, 5, 2); d.hl(2, 13, 5, 1); d.rect(2, 12, 2, 3, 3); d.rect(12, 12, 2, 3, 3); }
  function notebook(d) { table(d); d.rect(4, 3, 8, 6, 3); d.rect(5, 4, 3, 4, 0); d.rect(8, 4, 3, 4, 0); d.hl(5, 7, 5, 2); d.hl(8, 10, 6, 2); }
  function tv(d) {
    d.rect(1, 2, 14, 11, 3); d.rect(2, 3, 10, 8, 1); d.pts([[3, 4], [4, 4], [3, 5]], 0);
    d.px(13, 4, 0); d.px(13, 6, 0); d.rect(3, 13, 2, 3, 3); d.rect(11, 13, 2, 3, 3); d.hl(5, 3, 1, 3); d.px(9, 0, 3); d.px(8, 1, 3);
  }
  function photo(d) { iwall(d, 0); d.rect(3, 2, 10, 8, 3); d.rect(4, 3, 8, 6, 0); d.disc(6, 6, 1, 2); d.disc(10, 6, 1, 2); d.hl(4, 11, 8, 1); }
  function calendar(d) {
    iwall(d, 1); d.rect(3, 1, 10, 10, 3); d.rect(4, 2, 8, 8, 0); d.hl(4, 11, 3, 3);
    for (let y = 5; y < 10; y += 2) for (let x = 5; x < 12; x += 2) d.px(x, y, 2);
    d.px(11, 9, 3); d.px(10, 9, 3);
  }
  function iwindow(d, lit) { iwall(d, 0); d.rect(2, 1, 12, 9, 3); d.rect(3, 2, 10, 7, lit ? 5 : 0); d.vl(8, 2, 8, 3); d.hl(3, 12, 5, 3); if (!lit) d.pts([[4, 3], [5, 3], [4, 4]], 1); }
  function mat(d) { floor(d); d.rect(2, 4, 12, 9, 3); d.rect(3, 5, 10, 7, 2); d.hl(3, 12, 7, 1); d.hl(3, 12, 10, 1); }
  function counter(d) { d.fill(0); d.rect(0, 2, 16, 14, 3); d.rect(0, 3, 16, 4, 1); d.hl(0, 15, 3, 0); d.rect(0, 8, 16, 7, 2); for (let x = 2; x < 16; x += 4) d.vl(x, 8, 14, 3); }
  function shelf(d) {
    iwall(d, 1); d.rect(1, 1, 14, 14, 3); d.rect(2, 2, 12, 12, 2); d.hl(2, 13, 6, 3); d.hl(2, 13, 10, 3);
    [[3, 3, 0], [6, 3, 1], [9, 4, 0], [12, 3, 1], [3, 7, 1], [7, 7, 0], [11, 7, 1], [4, 11, 0], [8, 11, 1], [12, 11, 0]].forEach(([x, y, c]) => d.rect(x, y, 2, 3, c));
  }
  function board(d, v) { iwall(d, 0); d.rect(0, 1, 16, 10, 3); d.rect(0, 2, 16, 8, 2); const o = v % 3 * 3; d.hl(1 + o % 5, 9 + o % 5, 4, 0); d.hl(2, 12 - o % 4, 6, 1); d.hl(1 + o % 3, 7 + o % 3, 8, 0); d.hl(0, 15, 11, 3); }
  function desk(d) { floor(d); d.rect(2, 5, 12, 6, 3); d.rect(3, 6, 10, 3, 1); d.rect(3, 11, 2, 3, 3); d.rect(11, 11, 2, 3, 3); }
  function stairsUp(d) { d.fill(1); for (let y = 1; y < 16; y += 3) { d.hl(1, 14, y, 3); d.hl(1, 14, y + 1, 0); } d.vl(0, 0, 15, 3); d.vl(15, 0, 15, 3); }
  function stairsDown(d) { d.fill(3); for (let y = 2; y < 16; y += 3) { d.hl(2 + (y >> 2), 13 - (y >> 2), y, 2); } d.vl(0, 0, 15, 2); d.vl(15, 0, 15, 2); }
  function stone(d, v) { d.fill(1); d.hl(0, 15, 7, 2); d.hl(0, 15, 15, 2); d.vl(v % 2 ? 4 : 11, 0, 6, 2); d.vl(v % 2 ? 11 : 4, 8, 14, 2); d.pts([[2, 2], [9, 10]], 0); }
  function railing(d, v) { stone(d, v); d.hl(0, 15, 2, 3); d.hl(0, 15, 3, 2); for (let x = 1; x < 16; x += 3) d.vl(x, 3, 9, 3); d.hl(0, 15, 9, 3); }
  function lens(d, lit, half) {
    stone(d, 0); d.rect(1, 1, 14, 14, 3); d.rect(2, 2, 12, 12, lit ? 5 : 0);
    for (let y = 4; y < 14; y += 3) d.hl(2, 13, y, lit ? 0 : 1);
    if (half === 'L') d.vl(15, 1, 14, lit ? 5 : 0); if (half === 'R') d.vl(0, 1, 14, lit ? 5 : 0);
  }
  function radio(d) { floor(d); d.rect(1, 5, 14, 9, 3); d.rect(2, 6, 7, 7, 2); for (let y = 7; y < 13; y += 2) d.hl(2, 8, y, 3); d.disc(12, 8, 2, 1); d.disc(12, 12, 1, 0); d.vl(3, 0, 5, 3); d.px(3, 0, 0); }
  function chest(d) { floor(d); d.rect(2, 4, 12, 10, 3); d.rect(3, 5, 10, 3, 2); d.rect(3, 9, 10, 4, 2); d.hl(3, 12, 8, 3); d.rect(7, 7, 2, 3, 0); }
  function drawing(d, v) { iwall(d, v); d.rect(2, 1, 12, 10, 3); d.rect(3, 2, 10, 8, 0); if (v % 2) { d.disc(8, 6, 2, 2); d.pts([[6, 4], [10, 4]], 2); } else { d.hl(4, 11, 7, 1); d.disc(7, 5, 1, 3); d.pts([[10, 3], [11, 4]], 2); } }
  function cwall(d, v) { d.fill(3); d.pts(v % 2 ? [[2, 3], [3, 3], [9, 6], [12, 11], [5, 13], [6, 13]] : [[5, 2], [11, 4], [12, 4], [3, 9], [8, 12], [13, 14]], 2); }
  function cfloor(d, v) { d.fill(2); d.pts(v % 2 ? [[3, 4], [10, 9], [6, 13]] : [[12, 2], [4, 10], [11, 14]], 1); d.pts([[7, 6], [1, 12]], 3); }
  function pool(d, f) { d.fill(2); d.disc(8, 8, 6, 3); d.disc(8, 8, 5, 1); d.disc(8 + (f ? 1 : 0), 8, 2, 5); d.pts([[5, 6], [11, 10]], 0); }
  function carved(d) { cwall(d, 0); d.hl(3, 5, 5, 1); d.vl(4, 5, 9, 1); d.vl(8, 5, 9, 1); d.hl(8, 11, 9, 1); d.vl(11, 5, 9, 1); }
  function exitMat(d) { floor(d); d.rect(1, 6, 14, 10, 3); d.rect(2, 7, 12, 8, 2); for (let x = 3; x < 14; x += 3) d.vl(x, 8, 13, 1); }
  function caveExit(d) { d.fill(3); d.disc(8, 10, 6, 1); d.disc(8, 10, 4, 0); d.rect(2, 11, 12, 5, 0); }
  function voidT(d) { d.fill(3); }

  /* ---------- タイル一覧 ----------
     g: 地面の種類（auto＝まわりで決める）、b: 通れない、draw: 地面の上に描く、pid: 色の番号（8月32日だけ使う） */
  const PID = { base: 0, grass: 1, sea: 2, sand: 3, roof: 4, wall: 5, light: 6, rock: 7, wood: 8, hero: 9, natsu: 10, npc: 11, cat: 12, tree: 13, flower: 14, torii: 15, lantern: 16, sky: 17, road: 18, cave: 19, tatami: 20 };
  const WORLD = {
    '~': { g: 'sea', b: 1, pid: PID.sea, anim: 1 },
    ',': { g: 'sand', pid: PID.sand },
    '.': { g: 'grass', pid: PID.grass },
    ':': { g: 'grass', draw: flowers, pid: PID.flower },
    '=': { g: 'road', pid: PID.road },
    'T': { g: 'grass', b: 1, draw: tree, pid: PID.tree },
    'Y': { g: 'grass', b: 1, draw: pine, pid: PID.tree },
    '#': { g: 'auto', b: 1, draw: rock, pid: PID.rock },
    'c': { g: 'sea', b: 1, draw: wetrock, pid: PID.rock, tide: 1 },
    'C': { g: 'sea', b: 1, draw: cave, pid: PID.rock, tide: 1 },
    'r': { own: roof, b: 1, pid: PID.roof },
    'h': { own: wall, b: 1, pid: PID.wall },
    'n': { own: windowT, b: 1, pid: PID.wall, lit: 1 },
    'd': { own: door, b: 1, pid: PID.wood },
    'o': { own: offering, b: 1, pid: PID.wood },
    'q': { g: 'grass', b: 1, draw: lantern, pid: PID.rock },
    'e': { g: 'grass', b: 1, draw: ema, pid: PID.wood },
    'g': { g: 'grass', b: 1, draw: (d) => torii(d, true), pid: PID.torii },
    'G': { g: 'road', draw: (d) => torii(d, false), pid: PID.torii },
    '^': { own: steps, pid: PID.rock },
    'K': { g: 'grass', b: 1, pid: PID.light },
    'k': { g: 'grass', b: 1, pid: PID.light },
    'L': { g: 'grass', b: 1, pid: PID.light },
    'S': { g: 'auto', b: 1, draw: sign, pid: PID.wood },
    'M': { g: 'auto', b: 1, draw: mailbox, pid: PID.roof },
    'W': { g: 'grass', b: 1, draw: well, pid: PID.rock },
    'B': { g: 'grass', b: 1, pid: PID.tree },
    'F': { g: 'grass', b: 1, draw: fence, pid: PID.wood },
    'x': { own: crops, b: 1, pid: PID.grass },
    'P': { own: 'pier', pid: PID.wood },
    'b': { g: 'auto', b: 1, draw: bench, pid: PID.wood }
  };
  const INSIDE = {
    '#': { own: iwall, b: 1, pid: PID.wall },
    '.': { own: floor, pid: PID.wood },
    ':': { own: 'tatami', pid: PID.tatami },
    'f': { own: futon, pid: PID.tatami },
    't': { g: 'floor', b: 1, draw: table, pid: PID.wood },
    'n': { g: 'floor', b: 1, draw: notebook, pid: PID.wood },
    'v': { g: 'floor', b: 1, draw: tv, pid: PID.base },
    'p': { own: photo, b: 1, pid: PID.wall },
    'C': { own: calendar, b: 1, pid: PID.wall },
    'w': { own: iwindow, b: 1, pid: PID.wall, lit: 1 },
    'd': { own: exitMat, pid: PID.wood },
    'c': { own: counter, b: 1, pid: PID.wood },
    's': { own: shelf, b: 1, pid: PID.wood },
    'k': { own: board, b: 1, pid: PID.base },
    'D': { own: desk, b: 1, pid: PID.wood },
    'u': { own: stairsUp, pid: PID.rock },
    'j': { own: stairsDown, pid: PID.rock },
    ',': { own: stone, pid: PID.rock },
    'r': { own: railing, b: 1, pid: PID.rock },
    'O': { own: 'lens', b: 1, pid: PID.lantern },
    'R': { own: radio, b: 1, pid: PID.base },
    'x': { own: chest, b: 1, pid: PID.wood },
    'a': { own: drawing, b: 1, pid: PID.wall },
    'm': { own: mat, pid: PID.tatami },
    '%': { own: cwall, b: 1, pid: PID.cave },
    ';': { own: cfloor, pid: PID.cave },
    'Q': { own: pool, b: 1, pid: PID.sea, anim: 1 },
    'Z': { own: carved, b: 1, pid: PID.cave },
    'E': { own: caveExit, pid: PID.cave },
    'X': { own: voidT, b: 1, pid: PID.cave }
  };

  /* タイル画像のキャッシュ。key はタイル＋状態（夜・潮・縁・コマ） */
  const cache = {};
  function tile(set, ch, o) {
    const def = (set === 'in' ? INSIDE : WORLD)[ch] || (set === 'in' ? INSIDE.X : WORLD['~']);
    const key = set + ch + '|' + (o.v || 0) + (o.f || 0) + (o.lit ? 1 : 0) + (o.low ? 1 : 0) + (o.g || '') + (o.e || '') + (o.half || '');
    if (cache[key]) return cache[key];
    const a = img(S, S, 0), d = pen(a);
    if (def.own === 'pier') pier(d, o.e && o.e[0] === '1', o.e && o.e[1] === '1', o.e && o.e[2] === '1');
    else if (def.own === 'tatami') tatami(d, o.e && o.e[0] === '1', o.e && o.e[1] === '1', o.e && o.e[2] === '1', o.e && o.e[3] === '1');
    else if (def.own === 'lens') lens(d, o.lit, o.half);
    else if (def.own) def.own(d, def.lit ? o.lit : (o.v || 0), o.f);
    else {
      let g = def.g;
      if (g === 'auto') g = o.g || 'grass';
      if (g === 'floor') floor(d);
      else if (def.tide && o.low) sand(d, o.v || 0);
      else (GROUND[g] || grass)(d, g === 'sea' ? (o.f || 0) : (o.v || 0));
      if (def.draw) def.draw(d, def.tide ? o.low : o.v);
    }
    cache[key] = a;
    return a;
  }

  /* ---------- 人物（16×16） ---------- */
  const R = (s) => s.trim().split(/\s+/);
  const SP = {};
  const legsStand = ['....32233223....', '.....30..03.....', '.....33..33.....'];
  const legsWalk = ['....32233223....', '.....30..33.....', '.....33.........'];
  const sideStand = ['.....322223.....', '.....30..03.....', '.....33..33.....'];
  const sideWalk = ['....32222223....', '....30....03....', '....33....33....'];
  const body = (head, torso, legs) => fromRows(head.concat(torso, legs));
  function person(key, head, torso, headU, headS, torsoS) {
    SP[key + '_d'] = body(head, torso, legsStand);
    SP[key + '_dw'] = body(head, torso, legsWalk);
    if (headU) { SP[key + '_u'] = body(headU, torso, legsStand); SP[key + '_uw'] = body(headU, torso, legsWalk); }
    if (headS) {
      SP[key + '_l'] = body(headS, torsoS, sideStand); SP[key + '_lw'] = body(headS, torsoS, sideWalk);
      SP[key + '_r'] = mirror(SP[key + '_l']); SP[key + '_rw'] = mirror(SP[key + '_lw']);
    }
  }
  // ユウ（帽子の男の子）
  person('hero',
    R(`................ .....333333..... ....32222223.... ...3222222223... ...3333333333... ...3300000033... ...3303003033... ....30000003.... .....300003.....`),
    R(`....31111113.... ...3111111113... ...3031111303... ....32222223....`),
    R(`................ .....333333..... ....32222223.... ...3222222223... ...3222222223... ...3333333333... ...3333333333... ....33333333.... .....333333.....`),
    R(`................ ......333333.... .....32222223... ....322222223... ..3333333333.... ....300003333... ....303003333... ....30000033.... .....3000033....`),
    R(`.....3111113.... ....31111113.... ....31031113.... .....322223.....`));
  // ナツ（おかっぱの女の子）
  const natsuHead = R(`................ .....333333..... ....33333333.... ...3332222333... ...3320000233... ...3203003023... ...3200000023... ...3320000233... ....33300333....`);
  person('natsu', natsuHead,
    R(`....31101113.... ...3111111113... ...3011111103... ...3111111113...`),
    R(`................ .....333333..... ....33333333.... ...3332222333... ...3322222233... ...3322222233... ...3322222233... ...3332222333... ....33333333....`),
    R(`................ ......33333..... .....3333333.... ....333222233... ....300002233... ....303002233... ....300002233... ....330022333... .....3333333....`),
    R(`.....3111113.... ....31111113.... ....31011113.... ....31111113....`));
  SP.yukata_d = fromRows(natsuHead.concat(R(`....32020203.... ...3202020203... ...3033333303... ...3220202023...`), ['...3202020203...', '....33333333....', '.....33..33.....']));
  // おじいちゃん
  SP.grandpa_d = fromRows(R(`................ .....333333..... ....30000003.... ...3000000003... ...3100000013... ...3103003013... ...3100000013... ....30111103.... .....300003..... ....32222223.... ...3202222023... ...3022222203... ....32222223.... ....32233223.... .....30..03..... .....33..33.....`));
  // トメさん（灯台守）
  SP.tome_d = fromRows(R(`......3333...... .....311113..... ....33333333.... ...3311111133... ...3100000013... ...3103003013... ...3100000013... ....30033003.... .....300003..... ....30000003.... ...3300000033... ...3030000303... ....30000003.... ....33333333.... .....30..03..... .....33..33.....`));
  // せんせい（めがね）
  SP.teacher_d = fromRows(R(`................ .....333333..... ....33333333.... ...3333333333... ...3300000033... ...3033003303... ...3303333033... ....30000003.... .....300003..... ....30033003.... ...3000330003... ...3030330303... ....32222223.... ....32233223.... .....30..03..... .....33..33.....`));
  // なつやのおばちゃん（パーマ）
  SP.shop_d = fromRows(R(`.....3.33.3..... ....3232323..... ...323232323.... ..32320000323... ..32303003023... ..32300000032... ...330033003.... ....30000003.... .....300003..... ....31111113.... ...3311111133... ...3031111303... ...3111111113... ...3333333333... .....30..03..... .....33..33.....`));
  // つりのおじさん（麦わら帽子）
  SP.fisher_d = fromRows(R(`................ .....333333..... ....31111113.... .33333333333333. .31111111111113. ..333000000333.. ...3033003303... ...3000000003... ....32222223.... ....32022023.... ...3222222223... ...3022222203... ....33333333.... ....32233223.... .....30..03..... .....33..33.....`));
  // こども（虫あみの男の子／麦わらの女の子）
  SP.kida_d = fromRows(R(`............333. ....3.3.3..3..3. ...33333333.3... ...3333333333... ...3300000033... ...3303003033... ....30000003.... .....300003..... ....30000003.... ...3000000003.3. ...3030000303.3. ....32222223..3. ....32233223..3. .....30..03...3. .....33..33..... ................`));
  SP.kidb_d = fromRows(R(`................ ....33333333.... ..331111111133.. .31111111111113. ..333333333333.. ...3300000033... ...3303003033... ....30000003.... .....300003..... ....30000003.... ...3000000003... ...3000000003... ...3000000003... ...3333333333... .....30..03..... .....33..33.....`));
  // ミケ（三毛猫）
  SP.cat_1 = fromRows(R(`................ ................ ...3........3... ...33......33... ...3033333303... ...3000000003... ...3030000303... ...3000330003... ....30000003.... ....32200003.... ...3222000003... ...3220000003.3. ...3000000003.3. ...3000000003.3. ....300330033.3. ....333..33333..`));
  SP.cat_2 = fromRows(R(`................ ................ ...3........3... ...33......33... ...3033333303... ...3000000003... ...3033000333... ...3000330003... ....30000003.... ....32200003.... ...3222000003... ...3220000003... ...3000000003.33 ...3000000003.3. ....300330033.3. ....333..33333..`));
  // ？（ウラの子）
  SP.ghost_d = fromRows(R(`................ .....333333..... ....33333333.... ...3330000333... ...3333330333... ...3333300333... ...3333303333... ....33333333.... .....330333..... ....33333333.... ...3333333333... ...3333333333... ....33333333.... ....33333333.... .....33..33..... .....33..33.....`));

  /* ---------- 飾り（大きいもの） ---------- */
  const DECO = {};
  // 灯台（32×48）。ガラスの部分は、光っているときだけ 5（あかり）
  function lighthouse(lit) {
    const a = img(32, 48), d = pen(a);
    d.disc(16, 5, 5, 3).disc(16, 5, 4, 2); d.rect(10, 5, 12, 2, 3); d.vl(16, 0, 1, 3); d.px(16, 0, 3);
    d.rect(8, 7, 16, 9, 3); d.rect(9, 8, 14, 7, lit ? 5 : 1); d.vl(13, 8, 14, 3); d.vl(18, 8, 14, 3); if (!lit) d.pts([[10, 9], [11, 9], [10, 10]], 0);
    d.rect(5, 16, 22, 2, 3); d.hl(6, 25, 16, 2); for (let x = 6; x < 26; x += 3) d.vl(x, 14, 15, 3);
    for (let y = 18; y < 48; y++) { const hw = 7 + Math.floor((y - 18) / 6); d.hl(16 - hw, 15 + hw, y, 0); d.px(16 - hw, y, 3); d.px(15 + hw, y, 3); }
    for (let y = 24; y < 29; y++) { const hw = 7 + Math.floor((y - 18) / 6); d.hl(17 - hw, 14 + hw, y, 2); }
    for (let y = 36; y < 41; y++) { const hw = 7 + Math.floor((y - 18) / 6); d.hl(17 - hw, 14 + hw, y, 2); }
    d.rect(18, 36, 8, 12, 3); d.rect(19, 37, 6, 11, 2); d.px(23, 42, 0); d.hl(19, 24, 37, 1);
    d.rect(9, 31, 3, 3, 3); d.px(10, 32, lit ? 5 : 1);
    return a;
  }
  DECO.lighthouse = lighthouse(false); DECO.lighthouseLit = lighthouse(true);
  // 大きな木（32×56）
  (() => {
    const a = img(32, 56), d = pen(a);
    d.rect(11, 34, 10, 22, 3); d.rect(12, 34, 8, 21, 2); d.vl(14, 36, 52, 3); d.vl(18, 40, 54, 3); d.pts([[16, 44], [16, 45]], 3);
    d.pts([[9, 54], [10, 53], [21, 53], [22, 54], [8, 55], [23, 55]], 3); d.hl(8, 23, 55, 3);
    [[16, 14, 13], [7, 20, 8], [25, 20, 8], [11, 28, 8], [21, 28, 8], [16, 24, 9]].forEach(([x, y, r]) => d.disc(x, y, r, 3));
    [[16, 14, 12], [7, 20, 7], [25, 20, 7], [11, 28, 7], [21, 28, 7], [16, 24, 8]].forEach(([x, y, r]) => d.disc(x, y, r, 2));
    [[11, 7], [12, 6], [13, 6], [10, 8], [4, 16], [5, 15], [22, 13], [23, 14], [8, 24], [15, 19], [20, 22], [26, 17], [13, 30]].forEach(([x, y]) => { d.px(x, y, 1); d.px(x + 1, y, 1); });
    [[12, 6], [5, 15]].forEach(([x, y]) => d.px(x, y, 0));
    [[18, 30], [9, 31], [24, 26], [20, 34], [10, 22], [17, 11]].forEach(([x, y]) => d.px(x, y, 3));
    DECO.bigtree = a;
  })();
  // 渡し船（32×16）
  DECO.boat = fromRows(R(`................................ ...........33333333........... ...........30000003........... ...........30330303........... ...........30000003........... ..........3333333333.......... ...3333333333333333333333333... ...3111111111111111111111113... ....31111111111111111111113.... ....32222222222222222222223.... .....322222222222222222223..... ......3333333333333333333...... ................................ ................................ ................................ ................................`).map(r => r.slice(0, 32)));
  // 屋台（16×16）
  DECO.stall = fromRows(R(`3333333333333333 3030303030303030 3030303030303030 3333333333333333 .3............3. .3....3LL3....3. .3....3LL3....3. .3.....33.....3. 3333333333333333 3222222222222223 3211212112121123 3222222222222223 3333333333333333 .3............3. .3............3. .33..........33.`));
  // ちょうちん（8×10）
  DECO.chochin = fromRows(R(`...33... ..3LL3.. .3LLLL3. .333333. .3LLLL3. .3LLLL3. .333333. .3LLLL3. ..3LL3.. ...33...`));
  // 七夕の笹（16×32）
  (() => {
    const a = img(16, 32), d = pen(a);
    d.vl(7, 2, 31, 3); d.vl(8, 2, 31, 2);
    [6, 12, 18, 24, 30].forEach(y => d.hl(6, 9, y, 3));
    [[2, 4, 1], [11, 7, 1], [1, 12, 1], [12, 14, 1], [3, 19, 1], [11, 21, 1]].forEach(([x, y]) => { d.hl(x, x + 3, y, 3); d.hl(x + 1, x + 2, y - 1, 2); d.hl(x, x + 2, y + 1, 2); });
    [[3, 6, 0], [11, 9, 1], [2, 14, 0], [13, 16, 0], [4, 21, 1], [12, 23, 0]].forEach(([x, y, c]) => { d.rect(x, y, 2, 5, 3); d.rect(x, y, 1, 4, c); });
    DECO.bamboo = a;
  })();
  // 灯台の上のランプ（8×8）
  DECO.lampOn = fromRows(R(`..3333.. .3LLLL3. 3LLLLLL3 3LLLLLL3 3LLLLLL3 3LLLLLL3 .3LLLL3. ..3333..`));
  DECO.lampOff = fromRows(R(`..3333.. .311113. 31100113 31000013 31000013 31100113 .311113. ..3333..`));
  // ひかる小石（ひみつの印）
  DECO.spark = fromRows(R(`...3... ..303.. .30L03. 30LLL03 .30L03. ..303.. ...3...`));

  /* ---------- パレット ---------- */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const MONO = {
    day: ['#E4EFC2', '#A6C47C', '#5A8451', '#1E3C2A'],
    morning: ['#E8F0CC', '#AFC98A', '#5F8A5E', '#223F33'],
    evening: ['#E6E2B4', '#B2B176', '#6A6F4A', '#283225'],
    night: ['#93A983', '#5B7759', '#2C4636', '#11231A'],
    ura: ['#1C1030', '#4A2D6E', '#A57FD2', '#F2E6FF']
  };
  const GLOW = '#F1F7D2';
  const COLOR = {
    0: ['#FFF6E2', '#E0CFA8', '#8C7A5E', '#2A2430'], 1: ['#F2F6CA', '#A9D46E', '#4E9A4B', '#1D4A30'],
    2: ['#E8F7FA', '#8ED2E6', '#3B8BC4', '#183E6D'], 3: ['#FFF7DC', '#F2DCA2', '#CEA365', '#6D4D2C'],
    4: ['#FFE9DA', '#F29C7B', '#C54E3C', '#5A1E1C'], 5: ['#FFF9EE', '#EADBC2', '#AE9272', '#4C3A2A'],
    6: ['#FFFFFF', '#F6DCD2', '#D24B4B', '#3A2228'], 7: ['#F2EFE8', '#BCB5A8', '#7C7468', '#36302A'],
    8: ['#FCEAD4', '#DAA872', '#8E5E38', '#402818'], 9: ['#FAD9B8', '#EEF2FF', '#3D6FD0', '#1E2238'],
    10: ['#FAD9B8', '#FFC6D2', '#E0607E', '#2A1A1E'], 11: ['#F8D8B8', '#EDE6D6', '#6F86A8', '#262630'],
    12: ['#FFFFFF', '#F5C890', '#D07A34', '#2B2222'], 13: ['#EAF7C8', '#8FCB5E', '#3F8A45', '#16402A'],
    14: ['#FFF6F8', '#F9A8C4', '#E0507E', '#3A1E30'], 15: ['#FFF0E8', '#F28A6A', '#D23A2A', '#4A1612'],
    16: ['#FFFBE0', '#FFD86A', '#F09A30', '#5A2A10'], 17: ['#FFF9E8', '#FFE0A8', '#F7B27A', '#8A5A7A'],
    18: ['#FBEFD8', '#E4CFA2', '#A88A5C', '#4A3A26'], 19: ['#B9B3C8', '#7C7294', '#4A4260', '#1C1828'],
    20: ['#F4F0C8', '#D8D08A', '#9C9450', '#44401E']
  };
  /* コントラスト（0〜10、ふつう5）を反映した色の表 */
  function build(mode, con) {
    const k = 0.35 + con * 0.13;
    const adj = (set) => {
      const cs = set.map(hex);
      const mid = [0, 1, 2].map(i => cs.reduce((s, c) => s + c[i], 0) / cs.length);
      return cs.map(c => c.map((v, i) => Math.max(0, Math.min(255, Math.round(mid[i] + (v - mid[i]) * k)))));
    };
    const ghostMix = con >= 9 ? (con - 8) * 0.28 : 0;
    const mk = (set, glowHex) => {
      const c = adj(set);
      const ghost = c[0].map((v, i) => Math.round(v + (c[1][i] - v) * ghostMix));
      const glow = adj([glowHex || GLOW, set[1], set[2], set[3]])[0];
      return [c[0], c[1], c[2], c[3], ghost, glow];
    };
    if (mode === 'color') {
      const out = {};
      Object.keys(COLOR).forEach(p => { out[p] = mk(COLOR[p], '#FFF3B0'); });
      return { color: true, pal: out };
    }
    return { color: false, pal: mk(MONO[mode] || MONO.day, mode === 'ura' ? '#FFD1F2' : GLOW) };
  }

  return { S, TR, img, pen, fromRows, mirror, tile, WORLD, INSIDE, SP, DECO, PID, MONO, build, hex };
})();
