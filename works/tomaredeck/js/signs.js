'use strict';
// ============================================================
//  signs: road-sign card art + every small icon in the game
//  (all drawn live with the pixel primitives from core.js)
// ============================================================
const SC_ = { red: '#d8363f', redD: '#a3222c', white: '#f6f4ee', blue: '#2f64b8', blueD: '#214a8c', yel: '#f2c230', yelD: '#c89a1c', blk: '#1e1c28', grn: '#2f8a4f', grnD: '#1f6a39', pole: '#a3a9b6', poleD: '#6f7584', orange: '#f07a3a' };

// ---------- sign shape helpers ----------
function sPole(cx, top, bot) { rectF(cx - 2, top, 4, bot - top, OUT); rectF(cx - 1, top, 2, bot - top, SC_.pole); px(cx - 1, top + 1, '#e8ecf2'); }
function sCircle(cx, cy, r, ring, fill, ringW = 2) { ellipseF(cx, cy, r + 1, r + 1, OUT); ellipseF(cx, cy, r, r, ring); ellipseF(cx, cy, r - ringW, r - ringW, fill); }
function sInvTri(cx, cy, r, fill = SC_.red, border = SC_.white) {
  const P = (rr, dy = 0) => [cx - rr * 0.95, cy - rr * 0.55 + dy, cx + rr * 0.95, cy - rr * 0.55 + dy, cx, cy + rr + dy];
  polyO(P(r + 1), border); polyF(P(r - 1.2), fill);
}
function sTri(cx, cy, r, fill, border) { const P = rr => [cx, cy - rr, cx + rr * 0.95, cy + rr * 0.55, cx - rr * 0.95, cy + rr * 0.55]; polyO(P(r + 1), border); polyF(P(r - 1.2), fill); }
function sDiamond(cx, cy, r) { const P = rr => [cx, cy - rr, cx + rr, cy, cx, cy + rr, cx - rr, cy]; polyO(P(r), SC_.blk); polyF(P(r - 1), SC_.yel); polyF(P(r - 2.5), SC_.blk); polyF(P(r - 3.5), SC_.yel); }
function sSquare(cx, cy, w, h, fill = SC_.blue) { panel(cx - w / 2 - 1, cy - h / 2 - 1, w + 2, h + 2, SC_.white); rectF(cx - w / 2 + 1, cy - h / 2 + 1, w - 2, h - 2, fill); }
function sOct(cx, cy, r, fill) { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } polyO(p, fill); }
function sArrow(x0, y0, x1, y1, c, th = 2) { lineF(x0, y0, x1, y1, c, th); const a = Math.atan2(y1 - y0, x1 - x0); polyF([x1 + Math.cos(a) * 3, y1 + Math.sin(a) * 3, x1 + Math.cos(a + 2.3) * 4, y1 + Math.sin(a + 2.3) * 4, x1 + Math.cos(a - 2.3) * 4, y1 + Math.sin(a - 2.3) * 4], c); }
function sCar(x, y, c = '#e8534f', f = 1) { rectF(x - 6, y - 4, 12, 4, OUT); rectF(x - 5, y - 3, 10, 2, c); rectF(x - 3 * f - (f < 0 ? 3 : 0), y - 6, 6, 3, OUT); rectF(x - 3 * f - (f < 0 ? 2 : -1), y - 5, 4, 2, mix(c, '#ffffff', 0.4)); px(x - 4, y, OUT); px(x + 3, y, OUT); }
function sStopSign(cx, cy, r) { sInvTri(cx, cy, r); rectF(cx - r * 0.45, cy - r * 0.2, r * 0.9, 1, SC_.white); rectF(cx - r * 0.3, cy + r * 0.12, r * 0.6, 1, SC_.white); }
function smear(cx, cy, r0, r1, a0, a1, c1 = '#ffffff', c2 = '#ff8fa6') { polyF(arcPts(cx, cy, r0, r1, a0, a1, 1), c2); polyF(arcPts(cx, cy, r0 + 1, r1 - 1, a0 + 0.1, a1 - 0.05, 1), c1); }
function sCone(cx, by, h = 14) { const w = h * 0.45; polyO([cx - w, by, cx - 1.5, by - h, cx + 1.5, by - h, cx + w, by], SC_.orange); rectF(cx - w * 0.62, by - h * 0.5, w * 1.24, 2, SC_.white); rectF(cx - w - 2, by - 1, w * 2 + 4, 2, OUT); rectF(cx - w - 1, by - 1, w * 2 + 2, 1, '#e0602a'); }

// ---------- card art: ART[id](cx, cy, t) inside a 46x32 window centred at (cx, cy) ----------
const ART = {
  swing(cx, cy, t) { smear(cx - 2, cy + 8, 11, 17, -2.9, -0.3); sPole(cx + 7, cy - 2, cy + 16); sStopSign(cx + 7, cy - 6, 8); },
  guard(cx, cy) {
    for (const x of [cx - 13, cx, cx + 13]) { rectF(x - 2, cy - 2, 4, 18, OUT); rectF(x - 1, cy - 2, 2, 18, '#98a2ac'); }
    rectF(cx - 21, cy - 7, 42, 11, OUT); rectF(cx - 20, cy - 6, 40, 1, '#f4f4ee'); rectF(cx - 20, cy - 5, 40, 3, '#d6dade'); rectF(cx - 20, cy - 2, 40, 1, '#9ea6ad'); rectF(cx - 20, cy - 1, 40, 3, '#c7ccd0'); rectF(cx - 20, cy + 2, 40, 1, '#838b93');
    for (let x = cx - 16; x < cx + 20; x += 13) { px(x, cy - 4, '#6e767e'); px(x + 3, cy - 4, '#6e767e'); }
  },
  tomare(cx, cy, t) { sPole(cx, cy + 2, cy + 17); sInvTri(cx, cy - 3, 12); const w = SC_.white; rectF(cx - 6, cy - 8, 3, 5, w); rectF(cx - 2, cy - 9, 2, 6, w); rectF(cx + 2, cy - 8, 4, 2, w); rectF(cx + 3, cy - 5, 3, 3, w); rectF(cx - 3, cy - 1, 6, 2, w); },
  double(cx, cy) { smear(cx - 4, cy + 6, 8, 13, -2.8, -0.6); smear(cx + 2, cy + 2, 8, 13, 0.3, 2.4, '#ffffff', '#ffb0c0'); sStopSign(cx + 10, cy - 8, 5); },
  sweep(cx, cy) { polyF([cx - 20, cy + 2, cx + 20, cy - 4, cx + 21, cy + 1, cx - 19, cy + 7], '#ff8fa6'); polyF([cx - 18, cy + 3, cx + 19, cy - 2, cx + 19, cy + 1, cx - 17, cy + 5], '#ffffff'); sStopSign(cx + 16, cy - 8, 5); for (const x of [cx - 12, cx - 2, cx + 8]) { rectF(x, cy + 9, 5, 5, '#9aa0ad'); rectF(x, cy + 9, 5, 1, '#c7ccd6'); } },
  slam(cx, cy) { rectF(cx - 22, cy + 10, 44, 6, '#8d8f98'); for (let i = 0; i < 5; i++) lineF(cx + rnd(-2, 2) * 0 + (i - 2) * 4, cy + 10, cx + (i - 2) * 8, cy + 15, OUT); sPole(cx, cy - 12, cy + 6); sStopSign(cx, cy + 5, 7); for (const d of [-1, 1]) { ellipseF(cx + d * 14, cy + 8, 4, 3, '#e6e0d2'); ellipseF(cx + d * 19, cy + 6, 3, 2, '#e6e0d2'); } },
  rearend(cx, cy) { rectF(cx - 22, cy + 10, 44, 1, '#8d8f98'); sCar(cx - 7, cy + 10, '#4f8fe8'); sCar(cx + 7, cy + 10, '#e8534f', -1); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; lineF(cx, cy + 3, cx + Math.cos(a) * 7, cy + 3 + Math.sin(a) * 7, i % 2 ? '#fff4c0' : '#ffd23f'); } },
  bolt(cx, cy, t) { const a = (t || 0) * 0.1; const p = []; for (let i = 0; i < 6; i++) p.push(cx + Math.cos(a + i * Math.PI / 3) * 7, cy + Math.sin(a + i * Math.PI / 3) * 7); polyO(p, '#c7ccd6'); ellipseF(cx, cy, 3, 3, '#6f7584'); ellipseF(cx, cy, 1.5, 1.5, '#2d2a3c'); for (let i = 0; i < 3; i++) rectF(cx - 20 + i * 2, cy - 4 + i * 4, 8, 1, '#ffffff'); },
  scrape(cx, cy) { rectF(cx - 20, cy + 6, 40, 10, '#6d7179'); for (let i = 0; i < 4; i++) lineF(cx - 16 + i * 3, cy + 7, cx + 10 + i * 3, cy + 14, '#9ea3ab'); for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.5 + rnd(-1.1, 0.4); lineF(cx + 10, cy + 6, cx + 10 + Math.cos(a) * rnd(5, 12), cy + 6 + Math.sin(a) * rnd(5, 12), i % 2 ? '#ffd23f' : '#ff8a3c'); } rectF(cx + 4, cy - 10, 12, 16, '#b8643a'); rectF(cx + 5, cy - 9, 10, 1, '#d88a50'); },
  speeding(cx, cy) { ellipseF(cx, cy + 2, 14, 14, OUT); ellipseF(cx, cy + 2, 13, 13, '#2d2a3c'); for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.8 + i * 0.175); px(cx + Math.cos(a) * 10, cy + 2 + Math.sin(a) * 10, i > 5 ? '#ff4d5a' : '#f6f4ee'); } lineF(cx, cy + 2, cx + 9, cy - 4, '#ff4d5a', 2); ellipseF(cx, cy + 2, 2, 2, '#f6f4ee'); rectF(cx - 22, cy + 16, 44, 1, '#ffffff'); },
  conetoss(cx, cy) { for (let i = 0; i < 5; i++) px(cx - 18 + i * 5, cy + 8 - Math.sin(i / 4 * Math.PI) * 10, '#ffffff'); sCone(cx + 10, cy + 6, 14); },
  ram(cx, cy) { for (let i = 0; i < 4; i++) rectF(cx - 22 + i * 2, cy - 6 + i * 4, 10, 1, '#ffffff'); rectF(cx - 8, cy - 8, 18, 16, OUT); rectF(cx - 7, cy - 7, 16, 14, '#d6dade'); rectF(cx - 7, cy - 7, 16, 2, '#f4f4ee'); rectF(cx + 9, cy - 9, 3, 18, '#9aa0ad'); for (let i = 0; i < 5; i++) px(cx + 13 + rnd(0, 6), cy + rnd(-8, 8), '#ffd23f'); },
  noentry(cx, cy) { sPole(cx, cy + 6, cy + 17); sCircle(cx, cy - 2, 12, SC_.white, SC_.red, 1); rectF(cx - 8, cy - 4, 16, 4, SC_.white); },
  slow(cx, cy) { sPole(cx, cy + 4, cy + 17); sInvTri(cx, cy - 4, 12); const w = SC_.white; rectF(cx - 6, cy - 10, 5, 2, w); rectF(cx - 6, cy - 7, 5, 4, w); rectF(cx + 1, cy - 10, 5, 2, w); rectF(cx + 2, cy - 7, 3, 4, w); rectF(cx - 1, cy - 2, 2, 3, w); },
  detour(cx, cy) { sSquare(cx, cy - 1, 26, 22); const w = SC_.white; rectF(cx - 8, cy + 5, 2, -1, w); lineF(cx - 7, cy + 7, cx - 7, cy - 4, w, 2); lineF(cx - 7, cy - 4, cx + 4, cy - 4, w, 2); sArrow(cx + 4, cy - 4, cx + 4, cy + 5, w, 2); },
  cone(cx, cy) { sCone(cx, cy + 12, 22); },
  refuel(cx, cy) { rectF(cx - 8, cy - 12, 14, 26, OUT); rectF(cx - 7, cy - 11, 12, 24, '#e8534f'); rectF(cx - 5, cy - 9, 8, 6, '#f6f4ee'); rectF(cx - 4, cy - 8, 6, 2, '#2d2a3c'); lineF(cx + 5, cy - 6, cx + 11, cy - 6, OUT, 2); lineF(cx + 11, cy - 6, cx + 11, cy + 6, OUT, 2); rectF(cx + 9, cy + 6, 5, 3, '#9aa0ad'); rectF(cx - 8, cy + 13, 16, 2, OUT); },
  caution(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); rectF(cx - 1, cy - 9, 3, 8, SC_.blk); rectF(cx - 1, cy + 1, 3, 3, SC_.blk); },
  wind(cx, cy, t) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); lineF(cx - 6, cy + 5, cx - 6, cy - 7, SC_.blk); const s = Math.sin((t || 0) * 0.1); for (let i = 0; i < 4; i++) rectF(cx - 5 + i * 3, cy - 7 + i * 0.5 + s * i * 0.3, 3, 4 - i * 0.6, i % 2 ? SC_.white : '#e8534f'); },
  bump(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); rectF(cx - 7, cy + 2, 14, 1, SC_.blk); ellipseF(cx, cy + 2, 4, 3, SC_.blk); rectF(cx - 5, cy + 3, 10, 2, SC_.yel); sCar(cx + 1, cy - 1, SC_.blk); },
  rockfall(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); polyF([cx - 8, cy - 6, cx - 2, cy - 6, cx - 2, cy + 6, cx - 8, cy + 6], SC_.blk); ellipseF(cx + 3, cy - 3, 2, 2, SC_.blk); ellipseF(cx + 5, cy + 2, 2.5, 2, SC_.blk); ellipseF(cx + 1, cy + 5, 1.5, 1.5, SC_.blk); },
  deer(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); const b = SC_.blk; rectF(cx - 5, cy - 2, 9, 4, b); rectF(cx + 3, cy - 6, 2, 5, b); rectF(cx + 3, cy - 7, 4, 2, b); px(cx + 3, cy - 9, b); px(cx + 5, cy - 9, b); rectF(cx - 5, cy + 2, 1, 4, b); rectF(cx - 2, cy + 2, 1, 4, b); rectF(cx + 1, cy + 2, 1, 4, b); rectF(cx + 3, cy + 2, 1, 4, b); },
  mirror(cx, cy) { rectF(cx - 1, cy - 4, 3, 22, OUT); rectF(cx, cy - 4, 1, 22, SC_.orange); ellipseF(cx, cy - 7, 10, 10, OUT); ellipseF(cx, cy - 7, 9, 9, SC_.orange); ellipseF(cx, cy - 7, 7, 7, '#bfe0f0'); ellipseF(cx + 2, cy - 5, 4, 4, '#e8f6ff'); sCar(cx - 1, cy - 4, '#e8534f'); px(cx - 4, cy - 12, '#ffffff'); },
  parking(cx, cy) { sPole(cx, cy + 8, cy + 17); sSquare(cx, cy - 2, 22, 22); textC('P', cx + 1, cy - 9, SC_.white, true, 2); },
  roadwork(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); const b = SC_.blk; ellipseF(cx - 2, cy - 7, 1.5, 1.5, b); rectF(cx - 3, cy - 5, 3, 5, b); lineF(cx - 2, cy - 4, cx + 4, cy - 1, b); lineF(cx + 4, cy - 1, cx + 5, cy + 4, b); rectF(cx + 3, cy + 4, 4, 1, b); rectF(cx - 4, cy, 1, 5, b); rectF(cx - 1, cy, 1, 5, b); },
  oneway(cx, cy) { sPole(cx, cy + 6, cy + 17); sSquare(cx, cy - 2, 30, 14); sArrow(cx - 10, cy - 2, cx + 8, cy - 2, SC_.white, 3); },
  highway(cx, cy) { sPole(cx - 10, cy + 6, cy + 17); sPole(cx + 10, cy + 6, cy + 17); sSquare(cx, cy - 2, 36, 20, SC_.grn); sArrow(cx, cy + 5, cx, cy - 7, SC_.white, 2); rectF(cx - 14, cy - 8, 8, 2, SC_.white); rectF(cx + 7, cy - 8, 8, 2, SC_.white); rectF(cx - 14, cy - 4, 6, 1, SC_.white); rectF(cx + 7, cy - 4, 6, 1, SC_.white); },
  toll(cx, cy) { rectF(cx - 20, cy - 12, 40, 5, OUT); rectF(cx - 19, cy - 11, 38, 3, SC_.grn); for (const x of [cx - 14, cx + 10]) { rectF(x, cy - 7, 5, 22, OUT); rectF(x + 1, cy - 7, 3, 22, '#d6dade'); } rectF(cx - 6, cy - 2, 12, 12, OUT); rectF(cx - 5, cy - 1, 10, 10, '#f6f4ee'); textC('Y', cx, cy + 1, SC_.grn, false); rectF(cx - 3, cy + 4, 6, 1, SC_.grn); rectF(cx - 3, cy + 6, 6, 1, SC_.grn); },
  nopark(cx, cy) { sPole(cx, cy + 6, cy + 17); sCircle(cx, cy - 2, 12, SC_.red, SC_.blue, 2); lineF(cx - 6, cy - 8, cx + 6, cy + 4, SC_.red, 2); lineF(cx + 6, cy - 8, cx - 6, cy + 4, SC_.red, 2); },
  slippery(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); sCar(cx, cy - 2, SC_.blk); for (let i = 0; i < 3; i++) { lineF(cx - 6 + i * 4, cy + 2, cx - 8 + i * 4, cy + 6, SC_.blk); } },
  barricade(cx, cy, t) { for (const x of [cx - 16, cx + 14]) { rectF(x, cy - 2, 3, 18, OUT); rectF(x + 1, cy - 2, 1, 18, '#9aa0ad'); } rectF(cx - 20, cy - 8, 40, 9, OUT); for (let i = 0; i < 8; i++) polyF([cx - 19 + i * 5, cy - 7, cx - 16 + i * 5, cy - 7, cx - 13 + i * 5, cy, cx - 16 + i * 5, cy], i % 2 ? SC_.blk : SC_.yel); rectF(cx - 19, cy - 7, 38, 1, '#ffffff'); const on = ((t || 0) / 20 | 0) % 2; ellipseF(cx, cy - 11, 3, 3, OUT); ellipseF(cx, cy - 11, 2, 2, on ? '#ffb030' : '#8a5a20'); },
  stopline(cx, cy) { rectF(cx - 23, cy - 16, 46, 32, '#6d7179'); for (let i = 0; i < 40; i++) px(cx - 22 + hash2(i, 3) * 44, cy - 15 + hash2(3, i) * 30, '#7d818a'); rectF(cx - 20, cy + 6, 40, 4, SC_.white); const w = SC_.white; rectF(cx - 14, cy - 10, 5, 12, w); rectF(cx - 7, cy - 10, 5, 12, w); rectF(cx, cy - 10, 5, 12, w); rectF(cx + 8, cy - 10, 6, 12, w); for (const x of [cx - 13, cx - 6, cx + 1, cx + 9]) rectF(x, cy - 6, 3, 2, '#6d7179'); },
  merge(cx, cy) { sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); lineF(cx + 3, cy + 7, cx + 3, cy - 8, SC_.blk, 2); lineF(cx - 5, cy + 7, cx + 2, cy - 1, SC_.blk, 2); },
  rustspray(cx, cy) { rectF(cx - 12, cy - 6, 10, 20, OUT); rectF(cx - 11, cy - 5, 8, 18, '#b8643a'); rectF(cx - 11, cy - 5, 8, 2, '#d88a50'); rectF(cx - 9, cy - 10, 4, 5, '#9aa0ad'); rectF(cx - 7, cy - 11, 3, 2, OUT); for (let i = 0; i < 14; i++) px(cx - 2 + rnd(0, 18), cy - 12 + rnd(-6, 6) + i * 0.2, pick(['#b8643a', '#d88a50', '#8a4a2a'])); },
  crosswalk(cx, cy) { sPole(cx, cy + 8, cy + 17); sSquare(cx, cy - 2, 22, 22); polyF([cx, cy - 11, cx + 9, cy + 7, cx - 9, cy + 7], SC_.white); polyF([cx, cy - 8, cx + 7, cy + 5, cx - 7, cy + 5], SC_.blue); const b = SC_.blk; ellipseF(cx, cy - 4, 1.5, 1.5, b); rectF(cx - 1, cy - 2, 2, 4, b); lineF(cx - 1, cy + 2, cx - 3, cy + 5, b); lineF(cx, cy + 2, cx + 2, cy + 5, b); for (let i = 0; i < 4; i++) rectF(cx - 9 + i * 5, cy + 8, 3, 2, SC_.white); },
  horn(cx, cy) { polyO([cx - 12, cy - 3, cx - 6, cy - 3, cx + 4, cy - 10, cx + 4, cy + 10, cx - 6, cy + 3, cx - 12, cy + 3], '#c7ccd6'); for (let i = 1; i <= 3; i++) polyF(arcPts(cx + 6, cy, 3 * i + 2, 3 * i + 3, -0.8, 0.8, 1), '#ffd23f'); },
  convoy(cx, cy) { rectF(cx - 22, cy + 10, 44, 1, '#8d8f98'); sCar(cx - 11, cy + 10, '#4f8fe8'); sCar(cx + 11, cy + 10, '#6ac47a'); sArrow(cx - 3, cy + 3, cx + 3, cy + 3, '#ffffff', 1); sArrow(cx + 3, cy + 3, cx - 3, cy + 3, '#ffffff', 1); },
  crossing(cx, cy, t) {
    sPole(cx, cy + 8, cy + 17); sDiamond(cx, cy - 2, 13); const b = SC_.blk;
    rectF(cx - 7, cy - 2, 11, 5, b); rectF(cx + 2, cy - 5, 4, 8, b); rectF(cx - 6, cy - 5, 2, 3, b); ellipseF(cx - 4, cy + 4, 1.5, 1.5, b); ellipseF(cx, cy + 4, 1.5, 1.5, b); ellipseF(cx + 4, cy + 4, 1.5, 1.5, b);
    const s = ((t || 0) / 8 | 0) % 3; ellipseF(cx - 5 - s, cy - 7 - s, 1 + s * 0.4, 1 + s * 0.4, b);
  },
  allstop(cx, cy) { sPole(cx - 11, cy + 2, cy + 17); sPole(cx + 11, cy + 2, cy + 17); sStopSign(cx - 11, cy - 2, 7); sStopSign(cx + 11, cy - 2, 7); sPole(cx, cy + 4, cy + 17); sStopSign(cx, cy + 1, 8); },
  signal(cx, cy, t) { rectF(cx - 1, cy + 6, 3, 12, OUT); rectF(cx - 17, cy - 8, 34, 14, OUT); rectF(cx - 16, cy - 7, 32, 12, '#3a4048'); const ph = ((t || 0) / 40 | 0) % 3; const cols = [['#2fd07a', '#1a4a30'], ['#ffc23c', '#5a4a1a'], ['#ff4d5a', '#5a1a20']]; for (let i = 0; i < 3; i++) { ellipseF(cx - 10 + i * 10, cy - 1, 4, 4, OUT); ellipseF(cx - 10 + i * 10, cy - 1, 3, 3, ph === i ? cols[i][0] : cols[i][1]); } rectF(cx - 16, cy - 10, 32, 2, '#3a4048'); },
  deadend(cx, cy) { sPole(cx, cy + 8, cy + 17); sSquare(cx, cy - 2, 22, 22); rectF(cx - 1, cy - 1, 3, 11, SC_.white); rectF(cx - 8, cy - 4, 17, 3, SC_.white); rectF(cx - 8, cy - 8, 17, 2, SC_.red); },
  turbo(cx, cy) { ellipseF(cx - 2, cy, 11, 11, OUT); ellipseF(cx - 2, cy, 10, 10, '#9aa0ad'); ellipseF(cx - 2, cy, 6, 6, '#c7ccd6'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; lineF(cx - 2, cy, cx - 2 + Math.cos(a) * 6, cy + Math.sin(a) * 6, '#6f7584'); } rectF(cx + 8, cy - 3, 12, 6, OUT); rectF(cx + 8, cy - 2, 11, 4, '#9aa0ad'); for (let i = 0; i < 4; i++) ellipseF(cx + 20 + i * 2, cy, 2 + i * 0.5, 2, ['#fff3b0', '#ffc23c', '#ff6a2c', '#8a3a3a'][i]); },
  heavyduty(cx, cy) { sPole(cx, cy + 6, cy + 17); sCircle(cx, cy - 2, 12, SC_.red, SC_.white, 2); const b = SC_.blk; rectF(cx - 7, cy - 5, 9, 6, b); rectF(cx + 2, cy - 3, 4, 4, b); ellipseF(cx - 4, cy + 2, 1.5, 1.5, b); ellipseF(cx + 3, cy + 2, 1.5, 1.5, b); },
  roundabout(cx, cy) { sPole(cx, cy + 6, cy + 17); sCircle(cx, cy - 2, 12, SC_.white, SC_.blue, 1); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; polyF(arcPts(cx, cy - 2, 4, 7, a, a + 1.4, 1), SC_.white); const e = a + 1.5; polyF([cx + Math.cos(e) * 5.5, cy - 2 + Math.sin(e) * 5.5 - 0, cx + Math.cos(e - 0.5) * 8.5, cy - 2 + Math.sin(e - 0.5) * 8.5, cx + Math.cos(e - 0.5) * 2.5, cy - 2 + Math.sin(e - 0.5) * 2.5], SC_.white); } },
  acidrain(cx, cy) { for (let i = 0; i < 5; i++) ellipseF(cx - 12 + i * 6, cy - 8 + (i % 2) * 2, 6, 4, '#4a4e64'); ellipseF(cx, cy - 10, 8, 5, '#5a5e74'); for (let i = 0; i < 9; i++) lineF(cx - 16 + i * 4, cy - 2 + (i % 3) * 3, cx - 18 + i * 4, cy + 3 + (i % 3) * 3, '#9ad060'); rectF(cx - 22, cy + 13, 44, 3, '#b8643a'); },
  jam(cx, cy, t) { rectF(cx - 21, cy - 10, 42, 20, OUT); rectF(cx - 20, cy - 9, 40, 18, '#15121c'); const on = ((t || 0) / 30 | 0) % 2; for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) if ((hash2(i, j) < 0.6) ^ (on && hash2(j, i) < 0.2)) rectF(cx - 18 + i * 4, cy - 7 + j * 4, 3, 3, '#ff9a2a'); },
  noise(cx, cy, t) { rectF(cx - 20, cy - 13, 40, 26, OUT); for (let j = 0; j < 24; j += 2) for (let i = 0; i < 38; i += 2) rectF(cx - 19 + i, cy - 12 + j, 2, 2, Math.random() < 0.5 ? '#d8d8e0' : '#4a4a58'); },
  pothole(cx, cy) { rectF(cx - 23, cy - 16, 46, 32, '#6d7179'); ellipseF(cx, cy + 2, 14, 7, '#3a3e48'); ellipseF(cx, cy + 3, 12, 5, '#15161e'); for (let i = 0; i < 6; i++) lineF(cx - 14 + i * 5, cy - 5 + (i % 2) * 2, cx - 12 + i * 5, cy - 2, '#3a3e48'); },
  rustcard(cx, cy) { rectF(cx - 14, cy - 12, 28, 24, OUT); rectF(cx - 13, cy - 11, 26, 22, '#8a5a3a'); for (let i = 0; i < 30; i++) rectF(cx - 13 + hash2(i, 1) * 24, cy - 11 + hash2(1, i) * 20, 2, 2, pick(['#b8643a', '#6a3a22', '#d88a50'])); },
};
// fallback art
function drawArt(id, cx, cy, t) { const f = ART[id]; if (f) f(cx, cy, t); else { sPole(cx, cy + 6, cy + 17); sDiamond(cx, cy - 2, 12); textC('?', cx + 1, cy - 5, SC_.blk, true); } }

// ---------- small icons ----------
// status icons are 7x7, drawn at top-left (x, y)
const SICON = {
  str(x, y) { rectF(x + 1, y + 1, 5, 5, OUT); rectF(x + 2, y + 2, 3, 3, '#ff8a3c'); rectF(x + 3, y, 1, 7, OUT); rectF(x, y + 3, 7, 1, OUT); px(x + 3, y + 3, '#ffd23f'); },
  dex(x, y) { polyO([x + 1, y + 1, x + 6, y + 1, x + 6, y + 4, x + 3.5, y + 6.5, x + 1, y + 4], '#7fb8ff'); px(x + 2, y + 2, '#ffffff'); },
  slow(x, y) { polyO([x, y + 1, x + 7, y + 1, x + 3.5, y + 7], SC_.red, OUT); rectF(x + 2, y + 2, 3, 1, SC_.white); },
  dent(x, y) { ellipseF(x + 3.5, y + 3.5, 3, 3, OUT); ellipseF(x + 3.5, y + 3.5, 2.2, 2.2, '#c7ccd6'); rectF(x + 3, y + 2, 2, 3, '#6f7584'); px(x + 2, y + 2, '#ffffff'); },
  rust(x, y) { ellipseF(x + 3.5, y + 3.5, 3, 3, OUT); ellipseF(x + 3.5, y + 3.5, 2.3, 2.3, '#b8643a'); px(x + 2, y + 3, '#d88a50'); px(x + 4, y + 4, '#6a3a22'); },
  stop(x, y) { polyO([x, y + 1, x + 7, y + 1, x + 3.5, y + 7], SC_.red, OUT); rectF(x + 1, y + 2, 5, 1, SC_.white); rectF(x + 2, y + 4, 3, 1, SC_.white); },
  nopark(x, y) { ellipseF(x + 3.5, y + 3.5, 3.4, 3.4, SC_.red); ellipseF(x + 3.5, y + 3.5, 2.2, 2.2, SC_.blue); lineF(x + 2, y + 2, x + 5, y + 5, SC_.red); },
  thorns(x, y) { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; lineF(x + 3, y + 3, x + 3 + Math.cos(a) * 3, y + 3 + Math.sin(a) * 3, '#c7ccd6'); } rectF(x + 2, y + 2, 3, 3, OUT); px(x + 3, y + 3, '#ff4d5a'); },
  grow(x, y) { polyO([x + 3.5, y, x + 7, y + 4, x + 5, y + 4, x + 5, y + 7, x + 2, y + 7, x + 2, y + 4, x, y + 4], '#7dff9a'); },
  plated(x, y) { rectF(x, y + 1, 7, 5, OUT); rectF(x + 1, y + 2, 5, 3, '#9aa0ad'); px(x + 1, y + 2, '#ffffff'); px(x + 5, y + 4, '#6f7584'); },
  oneway(x, y) { rectF(x, y + 1, 7, 5, SC_.blue); sArrow(x + 1, y + 3.5, x + 5, y + 3.5, SC_.white, 1); },
  highway(x, y) { rectF(x, y, 7, 7, SC_.grn); lineF(x + 3, y + 5, x + 3, y + 1, SC_.white); px(x + 2, y + 2, SC_.white); px(x + 4, y + 2, SC_.white); },
  signal(x, y) { rectF(x, y + 2, 7, 3, OUT); px(x + 1, y + 3, '#2fd07a'); px(x + 3, y + 3, '#ffc23c'); px(x + 5, y + 3, '#ff4d5a'); },
  roadwork(x, y) { polyO([x + 3.5, y, x + 7, y + 3.5, x + 3.5, y + 7, x, y + 3.5], SC_.yel); px(x + 3, y + 3, SC_.blk); },
  convoy(x, y) { sCar(x + 3.5, y + 6, '#4f8fe8'); },
  parking(x, y) { rectF(x, y, 7, 7, SC_.blue); text('P', x + 2, y + 1, SC_.white); },
  mirror(x, y) { ellipseF(x + 3.5, y + 3, 3, 3, SC_.orange); ellipseF(x + 3.5, y + 3, 2, 2, '#bfe0f0'); rectF(x + 3, y + 6, 1, 1, SC_.orange); },
  hazard(x, y) { polyO([x + 3.5, y, x + 7, y + 3.5, x + 3.5, y + 7, x, y + 3.5], SC_.yel); rectF(x + 3, y + 2, 1, 2, SC_.blk); px(x + 3, y + 5, SC_.blk); },
  explode(x, y) { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; lineF(x + 3, y + 3, x + 3 + Math.cos(a) * (i % 2 ? 2 : 3.5), y + 3 + Math.sin(a) * (i % 2 ? 2 : 3.5), i % 2 ? '#ffd23f' : '#ff6a2c'); } },
  redlight(x, y) { rectF(x, y, 7, 7, OUT); ellipseF(x + 3.5, y + 3.5, 2.5, 2.5, '#ff4d5a'); },
  grab(x, y) { lineF(x + 3, y, x + 3, y + 3, '#c7ccd6'); lineF(x + 3, y + 3, x + 1, y + 6, '#c7ccd6'); lineF(x + 3, y + 3, x + 5, y + 6, '#c7ccd6'); },
  dark(x, y) { ellipseF(x + 3.5, y + 3.5, 3, 3, '#2d2a3c'); ellipseF(x + 4.5, y + 2.5, 2, 2, '#9fa0c8'); },
};
function drawSIcon(id, x, y) { const f = SICON[id]; if (f) f(Math.round(x), Math.round(y)); else rectF(x, y, 7, 7, '#ff00ff'); }

// intent icons (12x12, top-left at x,y)
function drawIntent(kind, x, y, t, big) {
  x = Math.round(x); y = Math.round(y);
  switch (kind) {
    case 'atk': { // clenched fist, bigger when big
      const s = big ? 1 : 0;
      rectF(x + 1 - s, y + 3 - s, 10 + s * 2, 7 + s * 2, OUT); rectF(x + 2 - s, y + 4 - s, 8 + s * 2, 5 + s * 2, '#ff6b6b'); rectF(x + 2 - s, y + 4 - s, 8 + s * 2, 1, '#ffb0b0');
      for (let i = 0; i < 3; i++) rectF(x + 4 + i * 2, y + 4 - s, 1, 3, OUT); rectF(x, y + 5, 3, 3, OUT); rectF(x + 1, y + 6, 2, 1, '#ff6b6b'); break;
    }
    case 'def': polyO([x + 2, y + 1, x + 10, y + 1, x + 10, y + 6, x + 6, y + 11, x + 2, y + 6], '#7fb8ff'); rectF(x + 3, y + 2, 2, 3, '#e6f2ff'); break;
    case 'buff': polyO([x + 6, y, x + 11, y + 5, x + 8, y + 5, x + 8, y + 11, x + 4, y + 11, x + 4, y + 5, x + 1, y + 5], '#ffd23f'); px(x + 5, y + 2, '#ffffff'); break;
    case 'debuff': polyO([x + 6, y + 11, x + 11, y + 6, x + 8, y + 6, x + 8, y, x + 4, y, x + 4, y + 6, x + 1, y + 6], '#b58cff'); break;
    case 'charge': { const on = ((t || 0) / 8 | 0) % 2; polyO([x + 7, y, x + 2, y + 7, x + 6, y + 7, x + 4, y + 12, x + 10, y + 4, x + 6, y + 4, x + 8, y], on ? '#fff3a0' : '#ffd23f'); break; }
    case 'summon': rectF(x + 1, y + 1, 10, 10, OUT); rectF(x + 2, y + 2, 8, 8, '#7dff9a'); rectF(x + 5, y + 3, 2, 6, OUT); rectF(x + 3, y + 5, 6, 2, OUT); break;
    case 'stopped': sInvTri(x + 6, y + 5, 6); rectF(x + 3, y + 3, 6, 1, SC_.white); break;
    case 'heal': rectF(x + 1, y + 1, 10, 10, OUT); rectF(x + 2, y + 2, 8, 8, '#7dff9a'); rectF(x + 5, y + 3, 2, 6, '#ffffff'); rectF(x + 3, y + 5, 6, 2, '#ffffff'); break;
    case 'steal': rectF(x + 2, y + 1, 8, 10, OUT); rectF(x + 3, y + 2, 6, 8, '#f6f4ee'); lineF(x + 6, y - 1, x + 6, y + 3, '#c7ccd6'); lineF(x + 4, y + 3, x + 8, y + 3, '#c7ccd6'); break;
    default: rectF(x + 1, y + 1, 10, 10, OUT); rectF(x + 2, y + 2, 8, 8, '#8a86a0'); textC('?', x + 6, y + 3, '#ffffff', false);
  }
}

// relic ("parts") icons 14x14, top-left at x,y
const RICON = {
  battery(x, y) { rectF(x + 2, y + 3, 10, 9, OUT); rectF(x + 3, y + 4, 8, 7, '#e8534f'); rectF(x + 3, y + 4, 8, 2, '#f6f4ee'); rectF(x + 5, y + 1, 4, 2, OUT); rectF(x + 6, y + 7, 2, 3, '#ffd23f'); },
  hardhat(x, y) { ellipseF(x + 7, y + 8, 6, 5, OUT); ellipseF(x + 7, y + 8, 5, 4, '#f2c230'); rectF(x, y + 9, 14, 3, OUT); rectF(x + 1, y + 10, 12, 1, '#f2c230'); rectF(x + 6, y + 3, 2, 6, '#c89a1c'); px(x + 4, y + 5, '#fff3a0'); },
  omamori(x, y) { rectF(x + 3, y + 3, 8, 10, OUT); rectF(x + 4, y + 4, 6, 8, '#ff7fa0'); rectF(x + 5, y + 6, 4, 4, '#ffd23f'); lineF(x + 7, y + 3, x + 5, y, '#e0415a'); lineF(x + 7, y + 3, x + 9, y, '#e0415a'); },
  purse(x, y) { ellipseF(x + 7, y + 9, 6, 4, OUT); ellipseF(x + 7, y + 9, 5, 3, '#8a4a7a'); rectF(x + 3, y + 4, 8, 2, '#d8b24a'); ellipseF(x + 5, y + 3, 1.5, 1.5, '#ffd23f'); ellipseF(x + 9, y + 3, 1.5, 1.5, '#ffd23f'); },
  flare(x, y) { lineF(x + 3, y + 12, x + 10, y + 3, OUT, 4); lineF(x + 3, y + 12, x + 10, y + 3, '#e0415a', 2); ellipseF(x + 11, y + 2, 2, 2, '#fff3b0'); px(x + 12, y, '#ff8a3c'); },
  conehat(x, y) { sCone(x + 7, y + 13, 12); },
  tire(x, y) { ellipseF(x + 7, y + 7, 6, 6, OUT); ellipseF(x + 7, y + 7, 5, 5, '#3a3a44'); ellipseF(x + 7, y + 7, 2.5, 2.5, '#9aa0ad'); px(x + 4, y + 4, '#6a6a78'); },
  wakaba(x, y) { polyO([x + 3, y + 2, x + 7, y + 5, x + 7, y + 13, x + 3, y + 10], '#ffd23f'); polyO([x + 11, y + 2, x + 7, y + 5, x + 7, y + 13, x + 11, y + 10], '#2fb05a'); },
  reflector(x, y) { polyO([x + 7, y + 1, x + 13, y + 12, x + 1, y + 12], '#ff8a3c'); polyF([x + 7, y + 5, x + 10, y + 10, x + 4, y + 10], '#ffd0a0'); },
  mudflap(x, y) { rectF(x + 3, y + 1, 8, 12, OUT); rectF(x + 4, y + 2, 6, 10, '#3a3a44'); rectF(x + 4, y + 2, 6, 1, '#6a6a78'); text('A', x + 5, y + 5, '#c7ccd6'); },
  thermos(x, y) { rectF(x + 4, y + 2, 6, 11, OUT); rectF(x + 5, y + 3, 4, 9, '#4f8fe8'); rectF(x + 5, y + 1, 4, 2, '#c7ccd6'); rectF(x + 5, y + 6, 4, 1, '#f6f4ee'); },
  jumper(x, y) { lineF(x + 2, y + 10, x + 7, y + 4, '#e0415a', 2); lineF(x + 12, y + 10, x + 7, y + 4, OUT, 2); rectF(x, y + 10, 4, 3, '#e0415a'); rectF(x + 10, y + 10, 4, 3, OUT); polyF([x + 7, y, x + 5, y + 4, x + 7, y + 4, x + 6, y + 7, x + 9, y + 3, x + 7, y + 3, x + 8, y], '#ffd23f'); },
  triangle(x, y) { polyO([x + 7, y + 1, x + 13, y + 12, x + 1, y + 12], '#e0415a'); polyF([x + 7, y + 5, x + 10, y + 10, x + 4, y + 10], '#1e1c28'); },
  dashcam(x, y) { rectF(x + 1, y + 3, 12, 8, OUT); rectF(x + 2, y + 4, 10, 6, '#3a3a44'); ellipseF(x + 9, y + 7, 2.5, 2.5, '#8fd8ff'); px(x + 3, y + 5, '#ff4d5a'); },
  horn(x, y) { polyO([x + 1, y + 5, x + 4, y + 5, x + 10, y + 1, x + 10, y + 13, x + 4, y + 9, x + 1, y + 9], '#c7ccd6'); px(x + 12, y + 5, '#ffd23f'); px(x + 12, y + 9, '#ffd23f'); px(x + 13, y + 7, '#ffd23f'); },
  odometer(x, y) { rectF(x + 1, y + 4, 12, 6, OUT); for (let i = 0; i < 4; i++) { rectF(x + 2 + i * 3, y + 5, 2, 4, i === 3 ? '#e0415a' : '#f6f4ee'); } },
  wiper(x, y) { polyF(arcPts(x + 7, y + 12, 9, 11, -2.6, -0.5, 1), '#bfe0f0'); lineF(x + 7, y + 12, x + 2, y + 4, OUT, 2); },
  navi(x, y) { rectF(x + 1, y + 2, 12, 9, OUT); rectF(x + 2, y + 3, 10, 7, '#2f8a4f'); lineF(x + 3, y + 9, x + 7, y + 5, '#f6f4ee'); lineF(x + 7, y + 5, x + 11, y + 7, '#ffd23f'); rectF(x + 5, y + 11, 4, 2, OUT); },
  keychain(x, y) { ringF(x + 5, y + 5, 4, 1, '#d8b24a'); rectF(x + 7, y + 7, 6, 2, '#c7ccd6'); rectF(x + 11, y + 9, 2, 2, '#c7ccd6'); },
  chains(x, y) { for (let i = 0; i < 4; i++) ringF(x + 3 + i * 3, y + 4 + (i % 2) * 5, 2.5, 1, '#c7ccd6'); },
  supercharger(x, y) { ART.turbo(x + 5, y + 7); },
  airbag(x, y) { ellipseF(x + 7, y + 7, 6, 6, OUT); ellipseF(x + 7, y + 7, 5, 5, '#f6f4ee'); ellipseF(x + 5, y + 5, 2, 2, '#ffffff'); ringF(x + 7, y + 7, 3, 1, '#d6dade'); },
  cruise(x, y) { ringF(x + 7, y + 7, 6, 2, '#3a3a44'); rectF(x + 1, y + 6, 12, 2, '#3a3a44'); ellipseF(x + 7, y + 7, 2, 2, '#9aa0ad'); },
  hazardlamp(x, y) { ellipseF(x + 7, y + 7, 6, 6, OUT); ellipseF(x + 7, y + 7, 5, 5, '#e0415a'); polyF([x + 7, y + 3, x + 11, y + 10, x + 3, y + 10], '#ffffff'); polyF([x + 7, y + 5.5, x + 9.5, y + 9, x + 4.5, y + 9], '#e0415a'); },
  v8(x, y) { rectF(x + 1, y + 4, 12, 8, OUT); rectF(x + 2, y + 5, 10, 6, '#9aa0ad'); for (let i = 0; i < 4; i++) rectF(x + 2 + i * 3, y + 2, 2, 3, '#6f7584'); textC('V8', x + 7, y + 6, '#e0415a', false); },
  bigtank(x, y) { rectF(x + 2, y + 2, 10, 11, OUT); rectF(x + 3, y + 3, 8, 9, '#e8534f'); rectF(x + 5, y + 5, 4, 5, '#f6f4ee'); rectF(x + 9, y, 3, 3, OUT); },
  navipro(x, y) { rectF(x, y + 1, 14, 11, OUT); rectF(x + 1, y + 2, 12, 9, '#1e3a6a'); for (let i = 0; i < 3; i++) rectF(x + 2, y + 3 + i * 3, 10, 1, '#8fd8ff'); px(x + 11, y + 9, '#ffd23f'); },
  mechanic(x, y) { lineF(x + 3, y + 11, x + 10, y + 4, OUT, 4); lineF(x + 3, y + 11, x + 10, y + 4, '#c7ccd6', 2); ringF(x + 11, y + 3, 3, 1, '#c7ccd6'); },
  lantern(x, y) { rectF(x + 3, y + 2, 8, 10, OUT); rectF(x + 4, y + 3, 6, 8, '#ffd08a'); rectF(x + 5, y + 1, 4, 2, OUT); rectF(x + 6, y + 5, 2, 4, '#fff3b0'); },
};
function drawRIcon(id, x, y) { const f = RICON[id]; x = Math.round(x); y = Math.round(y); if (f) f(x, y); else { rectF(x + 2, y + 2, 10, 10, OUT); rectF(x + 3, y + 3, 8, 8, '#8a86a0'); } }

// drink ("can") icons 12x14
const CICON = {
  coffee(x, y) { rectF(x + 3, y + 2, 7, 11, OUT); rectF(x + 4, y + 3, 5, 9, '#8a5a3a'); rectF(x + 4, y + 6, 5, 3, '#f6f4ee'); rectF(x + 4, y + 3, 5, 1, '#c7ccd6'); },
  cola(x, y) { rectF(x + 3, y + 2, 7, 11, OUT); rectF(x + 4, y + 3, 5, 9, '#e0415a'); lineF(x + 4, y + 9, x + 8, y + 6, '#f6f4ee'); rectF(x + 4, y + 3, 5, 1, '#c7ccd6'); },
  milk(x, y) { polyO([x + 3, y + 4, x + 6.5, y + 1, x + 10, y + 4, x + 10, y + 13, x + 3, y + 13], '#f6f4ee'); rectF(x + 4, y + 7, 6, 3, '#4f8fe8'); },
  energy(x, y) { rectF(x + 3, y + 2, 7, 11, OUT); rectF(x + 4, y + 3, 5, 9, '#3a4ab8'); polyF([x + 7, y + 4, x + 5, y + 8, x + 7, y + 8, x + 6, y + 11, x + 9, y + 7, x + 7, y + 7, x + 8, y + 4], '#ffd23f'); },
  oil(x, y) { rectF(x + 2, y + 4, 8, 9, OUT); rectF(x + 3, y + 5, 6, 7, '#d8b24a'); lineF(x + 9, y + 5, x + 12, y + 2, OUT, 2); rectF(x + 4, y + 7, 4, 2, '#1e1c28'); },
  spray(x, y) { rectF(x + 3, y + 4, 7, 9, OUT); rectF(x + 4, y + 5, 5, 7, '#b58cff'); rectF(x + 5, y + 1, 3, 3, '#c7ccd6'); for (let i = 0; i < 3; i++) px(x + 10 + i, y + 1 + i, '#d8c0ff'); },
  extinguisher(x, y) { rectF(x + 3, y + 3, 7, 10, OUT); rectF(x + 4, y + 4, 5, 8, '#e0415a'); rectF(x + 5, y + 1, 3, 3, OUT); lineF(x + 7, y + 2, x + 11, y + 1, OUT); rectF(x + 4, y + 7, 5, 2, '#f6f4ee'); },
  sports(x, y) { rectF(x + 4, y + 1, 5, 2, OUT); rectF(x + 3, y + 3, 7, 10, OUT); rectF(x + 4, y + 4, 5, 8, '#8fd8ff'); rectF(x + 4, y + 7, 5, 2, '#2f64b8'); },
};
function drawCIcon(id, x, y) { const f = CICON[id]; x = Math.round(x); y = Math.round(y); if (f) f(x, y); }

// map node icons (centre at cx, cy; ~18px)
function drawNodeIcon(type, cx, cy, t, state) {
  cx = Math.round(cx); cy = Math.round(cy);
  switch (type) {
    case 'battle': sDiamond(cx, cy, 8); rectF(cx - 1, cy - 4, 2, 5, SC_.blk); rectF(cx - 1, cy + 2, 2, 2, SC_.blk); break;
    case 'elite': {
      const P = rr => [cx, cy - rr, cx + rr, cy, cx, cy + rr, cx - rr, cy];
      polyO(P(11), SC_.blk); polyF(P(10), '#e0415a'); polyF(P(7.5), SC_.yel);
      const b = SC_.blk; rectF(cx - 4, cy - 4, 2, 5, b); rectF(cx - 4, cy + 2, 2, 2, b); rectF(cx + 2, cy - 4, 2, 5, b); rectF(cx + 2, cy + 2, 2, 2, b); break;
    }
    case 'rest': sSquare(cx, cy, 14, 14); textC('P', cx + 1, cy - 3, SC_.white, true); break;
    case 'shop': rectF(cx - 6, cy - 9, 13, 18, OUT); rectF(cx - 5, cy - 8, 11, 16, '#e0415a'); rectF(cx - 4, cy - 7, 9, 7, '#e6f6ff'); for (let i = 0; i < 3; i++) rectF(cx - 3 + i * 3, cy - 6, 2, 3, ['#4f8fe8', '#ffd23f', '#6ac47a'][i]); rectF(cx - 4, cy + 3, 6, 2, OUT); break;
    case 'treasure': rectF(cx - 8, cy - 5, 17, 12, OUT); rectF(cx - 7, cy - 4, 15, 10, '#b98c60'); rectF(cx - 7, cy - 4, 15, 3, '#dcb083'); rectF(cx - 1, cy - 2, 3, 4, '#ffd23f'); break;
    case 'event': sCircle(cx, cy, 8, SC_.white, SC_.blue, 1); textC('?', cx + 1, cy - 3, SC_.white, true); break;
    case 'boss': sStopSign(cx, cy - 1, 13); break;
    case 'start': ellipseF(cx, cy, 4, 4, OUT); ellipseF(cx, cy, 3, 3, '#f6f4ee'); break;
  }
}
