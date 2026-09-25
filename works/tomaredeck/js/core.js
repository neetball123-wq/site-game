'use strict';
// ============================================================
//  core: constants, math, drawing primitives, rig, fonts, input, JP text
// ============================================================
const W = 480, H = 270, MG = 12;
const OUT = '#221f30';

// ---------- math ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const TAU = Math.PI * 2;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// seeded RNG with serialisable state
class RNG {
  constructor(seed) { this.s = seed >>> 0 || 1; }
  next() { let t = this.s += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  weighted(list) { let tot = 0; for (const [, w] of list) tot += w; let r = this.next() * tot; for (const [v, w] of list) { if ((r -= w) < 0) return v; } return list[list.length - 1][0]; }
}

// ---------- color ----------
const _rgbCache = new Map();
function hex2rgb(h) {
  let r = _rgbCache.get(h); if (r) return r;
  const s = h.replace('#', '');
  r = [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
  _rgbCache.set(h, r); return r;
}
const ci = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
function rgb2hex(r, g, b) { return '#' + ((1 << 24) | (ci(r) << 16) | (ci(g) << 8) | ci(b)).toString(16).slice(1); }
const _mixCache = new Map();
function mix(a, b, t) {
  t = Math.round(clamp(t, 0, 1) * 32) / 32;
  const k = a + b + t; let r = _mixCache.get(k); if (r) return r;
  const A = hex2rgb(a), B = hex2rgb(b);
  r = rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  _mixCache.set(k, r); return r;
}
function rgba(h, a) { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

// ---------- dithering ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const dth = (x, y, a) => a > BAYER[((y & 3) << 2) | (x & 3)];

// ---------- drawing primitives (on current ctx G) ----------
let G = null, SIL = null;
function useCtx(c) { G = c; G.__c = null; }
function fs(c) { c = SIL || c; if (G.__c !== c) { G.fillStyle = c; G.__c = c; } }
function resetFs() { if (G) G.__c = null; }
function rectF(x, y, w, h, c) {
  const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h);
  if (x1 <= x0 || y1 <= y0) return; fs(c); G.fillRect(x0, y0, x1 - x0, y1 - y0);
}
function rectI(x, y, w, h, c) { fs(c); G.fillRect(x, y, w, h); }
function px(x, y, c) { fs(c); G.fillRect(Math.round(x), Math.round(y), 1, 1); }
function ellipseF(cx, cy, rx, ry, c) {
  if (rx <= 0 || ry <= 0) return;
  fs(c);
  const Rx = rx + 0.35, Ry = ry + 0.35;
  const j0 = Math.floor(cy - Ry), j1 = Math.ceil(cy + Ry);
  for (let j = j0; j <= j1; j++) {
    const dy = (j + 0.5 - cy) / Ry, t = 1 - dy * dy; if (t < 0) continue;
    const hw = Rx * Math.sqrt(t);
    const x0 = Math.ceil(cx - hw - 0.5), x1 = Math.floor(cx + hw - 0.5) + 1;
    if (x1 > x0) G.fillRect(x0, j, x1 - x0, 1);
  }
}
function ringF(cx, cy, r, th, c, ry) {
  if (r <= 0) return; ry = ry || r; const ri = r - th, sy = ry / r;
  fs(c);
  const Ro = r + 0.35, Ri = ri + 0.35;
  const j0 = Math.floor(cy - Ro * sy), j1 = Math.ceil(cy + Ro * sy);
  for (let j = j0; j <= j1; j++) {
    const dy = (j + 0.5 - cy) / sy; const to = Ro * Ro - dy * dy; if (to < 0) continue;
    const ho = Math.sqrt(to);
    const ox0 = Math.ceil(cx - ho - 0.5), ox1 = Math.floor(cx + ho - 0.5) + 1;
    const ti = Ri * Ri - dy * dy;
    if (ri <= 0 || ti < 0) { if (ox1 > ox0) G.fillRect(ox0, j, ox1 - ox0, 1); continue; }
    const hi = Math.sqrt(ti);
    const ix0 = Math.ceil(cx - hi - 0.5), ix1 = Math.floor(cx + hi - 0.5) + 1;
    if (ix0 > ox0) G.fillRect(ox0, j, ix0 - ox0, 1);
    if (ox1 > ix1) G.fillRect(ix1, j, ox1 - ix1, 1);
  }
}
function lineF(x0, y0, x1, y1, c, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  fs(c);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy; const o = t >> 1; let n = 0;
  for (; ;) {
    G.fillRect(x0 - o, y0 - o, t, t);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
    if (++n > 3000) break;
  }
}
const _xs = [];
function polyF(p, c) {
  const n = p.length >> 1; if (n < 3) return;
  let mn = 1e9, mx = -1e9;
  for (let i = 1; i < p.length; i += 2) { if (p[i] < mn) mn = p[i]; if (p[i] > mx) mx = p[i]; }
  fs(c);
  const j0 = Math.floor(mn), j1 = Math.ceil(mx);
  for (let j = j0; j <= j1; j++) {
    const yc = j + 0.5; _xs.length = 0;
    for (let i = 0; i < n; i++) {
      const ax = p[i * 2], ay = p[i * 2 + 1], k = (i + 1) % n, bx = p[k * 2], by = p[k * 2 + 1];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) _xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    _xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < _xs.length; i += 2) {
      const x0 = Math.ceil(_xs[i] - 0.5), x1 = Math.floor(_xs[i + 1] - 0.5) + 1;
      if (x1 > x0) G.fillRect(x0, j, x1 - x0, 1);
    }
  }
}
function offPts(p, dx, dy) { const q = new Array(p.length); for (let i = 0; i < p.length; i += 2) { q[i] = p[i] + dx; q[i + 1] = p[i + 1] + dy; } return q; }
function polyO(p, c, oc = OUT) { polyF(offPts(p, -1, 0), oc); polyF(offPts(p, 1, 0), oc); polyF(offPts(p, 0, -1), oc); polyF(offPts(p, 0, 1), oc); polyF(p, c); }
function ditherRect(x, y, w, h, c, a) {
  if (a <= 0) return; if (a >= 1) return rectF(x, y, w, h, c);
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); fs(c);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (dth(i, j, a)) G.fillRect(i, j, 1, 1);
}
function ditherEllipse(cx, cy, rx, ry, c, a) {
  if (a <= 0 || rx <= 0 || ry <= 0) return; if (a >= 0.97) return ellipseF(cx, cy, rx, ry, c);
  fs(c);
  const Rx = rx + 0.35, Ry = ry + 0.35;
  const j0 = Math.floor(cy - Ry), j1 = Math.ceil(cy + Ry);
  for (let j = j0; j <= j1; j++) {
    const dy = (j + 0.5 - cy) / Ry, t = 1 - dy * dy; if (t < 0) continue;
    const hw = Rx * Math.sqrt(t);
    const x0 = Math.ceil(cx - hw - 0.5), x1 = Math.floor(cx + hw - 0.5) + 1;
    for (let i = x0; i < x1; i++) if (dth(i, j, a)) G.fillRect(i, j, 1, 1);
  }
}
function arcPts(cx, cy, r0, r1, a0, a1, f) {
  const p = []; const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) * r1 / 3));
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * r1 * f, cy + Math.sin(a) * r1); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * r0 * f, cy + Math.sin(a) * r0); }
  return p;
}
// pixel "rounded" panel: corners cut by 1px, 1px outline
function panel(x, y, w, h, fill, edge = OUT, hi) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rectI(x + 1, y, w - 2, h, edge); rectI(x, y + 1, w, h - 2, edge);
  rectI(x + 1, y + 1, w - 2, h - 2, fill);
  if (hi) { rectI(x + 2, y + 1, w - 4, 1, hi); }
}
function globalAlpha(a) { G.globalAlpha = a; }

// ---------- rig: local-space shape builder with unified outline ----------
const _t = [0, 0];
const R = {
  ox: 0, oy: 0, f: 1, sx: 1, sy: 1, cs: 1, sn: 0, rot: 0, pvx: 0, pvy: 0, L: [],
  begin(ox, oy, f, sx, sy, rot, pvx, pvy) {
    this.ox = Math.round(ox); this.oy = Math.round(oy); this.f = f || 1; this.sx = sx || 1; this.sy = sy || 1;
    this.rot = rot || 0; this.cs = Math.cos(this.rot); this.sn = Math.sin(this.rot); this.pvx = pvx || 0; this.pvy = pvy || 0;
    this.L.length = 0; return this;
  },
  tx(dx, dy) {
    let x = dx * this.sx, y = dy * this.sy;
    if (this.rot) { const cx = this.pvx * this.sx, cy = this.pvy * this.sy, qx = x - cx, qy = y - cy; x = qx * this.cs - qy * this.sn + cx; y = qx * this.sn + qy * this.cs + cy; }
    _t[0] = this.ox + x * this.f; _t[1] = this.oy + y; return _t;
  },
  rect(dx, dy, w, h, c, o = true) {
    if (!this.rot) {
      let a = this.tx(dx, dy); const x0 = a[0], y0 = a[1]; a = this.tx(dx + w, dy + h); const x1 = a[0], y1 = a[1];
      this.L.push({ t: 0, x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0), c, o });
    } else {
      const p = []; for (const [u, v] of [[dx, dy], [dx + w, dy], [dx + w, dy + h], [dx, dy + h]]) { const a = this.tx(u, v); p.push(a[0], a[1]); }
      this.L.push({ t: 3, p, c, o });
    }
  },
  ell(dx, dy, rx, ry, c, o = true) { const a = this.tx(dx, dy); this.L.push({ t: 1, x: a[0], y: a[1], rx: rx * this.sx, ry: ry * this.sy, c, o }); },
  line(x0, y0, x1, y1, c, th = 1, o = true) { let a = this.tx(x0, y0); const ax = a[0], ay = a[1]; a = this.tx(x1, y1); this.L.push({ t: 2, x0: ax, y0: ay, x1: a[0], y1: a[1], c, th, o }); },
  poly(pts, c, o = true) { const p = []; for (let i = 0; i < pts.length; i += 2) { const a = this.tx(pts[i], pts[i + 1]); p.push(a[0], a[1]); } this.L.push({ t: 3, p, c, o }); },
  wline(x0, y0, x1, y1, c, th = 1, o = true) { this.L.push({ t: 2, x0, y0, x1, y1, c, th, o }); },
  wpoly(p, c, o = true) { this.L.push({ t: 3, p, c, o }); },
  well(x, y, rx, ry, c, o = true) { this.L.push({ t: 1, x, y, rx, ry, c, o }); },
  flush(oc) {
    const L = this.L;
    if (oc) for (let i = 0; i < L.length; i++) {
      const s = L[i]; if (!s.o) continue;
      switch (s.t) {
        case 0: rectF(s.x - 1, s.y, s.w + 2, s.h, oc); rectF(s.x, s.y - 1, s.w, s.h + 2, oc); break;
        case 1: ellipseF(s.x, s.y, s.rx + 1, s.ry + 1, oc); break;
        case 2: lineF(s.x0, s.y0, s.x1, s.y1, oc, s.th + 2); break;
        case 3: polyF(offPts(s.p, -1, 0), oc); polyF(offPts(s.p, 1, 0), oc); polyF(offPts(s.p, 0, -1), oc); polyF(offPts(s.p, 0, 1), oc); break;
      }
    }
    for (let i = 0; i < L.length; i++) {
      const s = L[i];
      switch (s.t) {
        case 0: rectF(s.x, s.y, s.w, s.h, s.c); break;
        case 1: ellipseF(s.x, s.y, s.rx, s.ry, s.c); break;
        case 2: lineF(s.x0, s.y0, s.x1, s.y1, s.c, s.th); break;
        case 3: polyF(s.p, s.c); break;
      }
    }
    L.length = 0;
  },
  px(dx, dy, c) { const a = this.tx(dx + 0.5, dy + 0.5); fs(c); G.fillRect(Math.floor(a[0]), Math.floor(a[1]), 1, 1); },
  dline(x0, y0, x1, y1, c, th = 1) { let a = this.tx(x0, y0); const ax = a[0], ay = a[1]; a = this.tx(x1, y1); lineF(ax, ay, a[0], a[1], c, th); },
  drect(dx, dy, w, h, c) { let a = this.tx(dx, dy); const x0 = a[0], y0 = a[1]; a = this.tx(dx + w, dy + h); rectF(Math.min(x0, a[0]), Math.min(y0, a[1]), Math.abs(a[0] - x0), Math.abs(a[1] - y0), c); },
  dell(dx, dy, rx, ry, c) { const a = this.tx(dx, dy); ellipseF(a[0], a[1], rx * this.sx, ry * this.sy, c); },
  dpoly(pts, c) { const p = []; for (let i = 0; i < pts.length; i += 2) { const a = this.tx(pts[i], pts[i + 1]); p.push(a[0], a[1]); } polyF(p, c); },
};

// ---------- bitmap fonts ----------
const F3 = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110', 'E': '111100110100111',
  'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111', 'J': '001001001101010',
  'K': '101101110101101', 'L': '100100100100111', 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010',
  'P': '110101110100100', 'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
  'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101', 'Y': '101101010010010',
  'Z': '111001010100111', ' ': '000000000000000', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000',
  '+': '000010111010000', '/': '001001010100100', '!': '010010010000010', 'x': '000101010101000', '%': '101001010100101',
  '?': '110001010000010', '>': '100010001010100', '<': '001010100010001', '=': '000111000111000', '#': '101111101111101',
  '&': '010101010101011', "'": '010010000000000', ',': '000000000010100', '(': '010100100100010', ')': '010001001001010',
};
const F5 = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
  D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
  G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
  J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001100011100110101100111000110001', O: '01110100011000110001100011000101110',
  P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
  S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
  V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
  '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110', '2': '01110100010000100010001000100011111',
  '3': '11111000100010000010000011000101110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
  '6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110',
  '9': '01110100011000101111000010001001100', '+': '00000001000010011111001000010000000', '-': '00000000000000011111000000000000000',
  '.': '00000000000000000000000000110001100', '!': '00100001000010000100001000000000100', ' ': '00000000000000000000000000000000000',
  '/': '00001000100001000100010000100010000', ':': '00000011000110000000011000110000000', 'x': '00000100010101000100010101000100000',
  '?': '01110100010000100010001000000000100', '%': '11001110010001000100010001001110011', '&': '01100100101010001000101011001001101',
  "'": '00100001000000000000000000000000000', ',': '00000000000000000000001100010001000',
};
function textW(str, big, scale = 1) { return (str.length * (big ? 6 : 4) - 1) * scale; }
function text(str, x, y, c, big, scale = 1) {
  const fw = big ? 5 : 3, fh = big ? 7 : 5, F = big ? F5 : F3;
  x = Math.round(x); y = Math.round(y); fs(c);
  for (let i = 0; i < str.length; i++) {
    const g = F[str[i]] || F[str[i].toUpperCase()]; if (!g) { x += (fw + 1) * scale; continue; }
    for (let r = 0; r < fh; r++) for (let q = 0; q < fw; q++) if (g[r * fw + q] === '1') G.fillRect(x + q * scale, y + r * scale, scale, scale);
    x += (fw + 1) * scale;
  }
}
function textO(str, x, y, c, oc, big, scale = 1) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) text(str, x + dx * scale, y + dy * scale, oc, big, scale);
  text(str, x, y, c, big, scale);
}
function textC(str, cx, y, c, big, scale = 1, oc) { const w = textW(str, big, scale); if (oc) textO(str, Math.round(cx - w / 2), y, c, oc, big, scale); else text(str, Math.round(cx - w / 2), y, c, big, scale); }

// ---------- Japanese text (drawn at screen resolution over the pixel layers) ----------
// JT is a per-frame list of text commands in game coordinates; main.js flushes it after the pixel layers.
const JFONT = "'DotGothic16', 'MS Gothic', 'Osaka-Mono', monospace";
const JT = [];
const _jm = document.createElement('canvas').getContext('2d');
const _jmCache = new Map();
function jmeasure(str, size = 8) {
  const k = size + '|' + str; let w = _jmCache.get(k); if (w != null) return w;
  _jm.font = `${size * 4}px ${JFONT}`; w = _jm.measureText(str).width / 4;
  if (_jmCache.size > 4000) _jmCache.clear(); _jmCache.set(k, w); return w;
}
// on the hi-res HUD context text is drawn immediately (keeps layering right); elsewhere it is queued
let JCTX = null;
function jtext(str, x, y, size = 8, color = '#ffffff', align = 'left', shadow = OUT) {
  if (G && G === JCTX) {
    G.font = `${size}px ${JFONT}`; G.textAlign = align; G.textBaseline = 'top';
    if (shadow) { G.fillStyle = shadow; G.fillText(str, x + 0.5, y + 0.5); G.fillText(str, x + 0.5, y); }
    G.fillStyle = SIL || color; G.fillText(str, x, y); G.textAlign = 'left'; resetFs(); return;
  }
  JT.push({ str, x, y, size, color, align, shadow });
}
function jwrap(str, maxW, size = 8) {
  const lines = []; for (const para of String(str).split('\n')) {
    let cur = '';
    for (const ch of para) { if (jmeasure(cur + ch, size) > maxW && cur) { lines.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch; }
    lines.push(cur);
  }
  return lines;
}
// font readiness (canvas text needs the web font loaded before it's measured correctly)
let FONT_READY = false;
if (document.fonts && document.fonts.load) document.fonts.load(`32px 'DotGothic16'`, 'あ止').then(() => { FONT_READY = true; _jmCache.clear(); }).catch(() => { FONT_READY = true; });
else FONT_READY = true;

// ---------- input (mouse / touch first, keyboard shortcuts) ----------
const In = {
  mx: -100, my: -100, down: false, pressed: false, released: false, rpressed: false, moved: false, wheel: 0,
  _p: false, _r: false, _rp: false, _mv: false, _wh: 0, keys: {}, _hit: {}, hit: {}, lastPointer: 'mouse', downX: 0, downY: 0,
  init(cv) {
    const setPos = e => { const r = cv.getBoundingClientRect(); this.mx = (e.clientX - r.left) / r.width * W; this.my = (e.clientY - r.top) / r.height * H; };
    cv.addEventListener('pointerdown', e => {
      cv.focus(); onUserGesture(); setPos(e); this.lastPointer = e.pointerType;
      if (e.button === 2) { this._rp = true; e.preventDefault(); return; }
      if (e.button !== 0) return;
      this.down = true; this._p = true; this.downX = this.mx; this.downY = this.my;
      try { cv.setPointerCapture(e.pointerId); } catch (_) { }
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => { setPos(e); this._mv = true; this.lastPointer = e.pointerType; });
    const up = e => { if (e.button !== 0 && e.pointerType === 'mouse') return; if (this.down) { this.down = false; this._r = true; } setPos(e); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !this.down) { this.mx = -100; this.my = -100; } });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => { this._wh += sgn(e.deltaY); e.preventDefault(); }, { passive: false });
    addEventListener('keydown', e => {
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      onUserGesture(); if (e.repeat) return; this.keys[e.code] = true; this._hit[e.code] = true;
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.down = false; });
  },
  update() {
    this.pressed = this._p; this.released = this._r; this.rpressed = this._rp; this.moved = this._mv; this.wheel = this._wh;
    this._p = this._r = this._rp = this._mv = false; this._wh = 0;
    this.hit = this._hit; this._hit = {};
  },
  key(code) { return !!this.hit[code]; },
  anyKey(...codes) { return codes.some(c => this.hit[c]); },
  in(x, y, w, h) { return this.mx >= x && this.mx < x + w && this.my >= y && this.my < y + h; },
  eat() { this.pressed = this.released = this.rpressed = false; this.hit = {}; },
};
function onUserGesture() { if (typeof Snd !== 'undefined') Snd.unlock(); }
