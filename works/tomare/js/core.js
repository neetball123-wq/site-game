'use strict';
// ============================================================
//  core: constants, math, drawing primitives, rig, font, input
// ============================================================
const W = 384, H = 216, MG = 12;          // internal resolution + margin
const TILE = 8;
const OUT = '#221f30';                    // global outline color

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
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const TAU = Math.PI * 2;
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash2(i, 7), hash2(i + 1, 7), u); }

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
    if (++n > 2000) break;
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
// arc band (for slash smears): angles a0->a1, radii r0 (inner) r1 (outer)
function arcPts(cx, cy, r0, r1, a0, a1, f) {
  const p = []; const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) * r1 / 3));
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * r1 * f, cy + Math.sin(a) * r1); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * r0 * f, cy + Math.sin(a) * r0); }
  return p;
}

// ---------- rig: local-space shape builder with unified outline ----------
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
  // world-space
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
  // immediate detail pixel in local space
  px(dx, dy, c) { const a = this.tx(dx + 0.5, dy + 0.5); fs(c); G.fillRect(Math.floor(a[0]), Math.floor(a[1]), 1, 1); },
  dline(x0, y0, x1, y1, c, th = 1) { let a = this.tx(x0, y0); const ax = a[0], ay = a[1]; a = this.tx(x1, y1); lineF(ax, ay, a[0], a[1], c, th); },
  drect(dx, dy, w, h, c) { let a = this.tx(dx, dy); const x0 = a[0], y0 = a[1]; a = this.tx(dx + w, dy + h); rectF(Math.min(x0, a[0]), Math.min(y0, a[1]), Math.abs(a[0] - x0), Math.abs(a[1] - y0), c); },
  dell(dx, dy, rx, ry, c) { const a = this.tx(dx, dy); ellipseF(a[0], a[1], rx * this.sx, ry * this.sy, c); },
};
const _t = [0, 0];

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
};
const F5 = {};
(function () {
  const s = {
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
  };
  for (const k in s) F5[k] = s[k];
})();
function textW(str, big) { return str.length * (big ? 6 : 4) - 1; }
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
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) text(str, x + dx, y + dy, oc, big, scale);
  text(str, x, y, c, big, scale);
}

// ---------- input ----------
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  // WASD + mouse:  Space jump / L-click attack / F,Shift dash / E,R-click shot
  // arrows:        Z jump / X attack / C dash / V shot
  jump: ['Space', 'KeyZ', 'KeyK'], attack: ['KeyX', 'KeyJ'], dash: ['KeyF', 'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyL'],
  shot: ['KeyE', 'KeyV', 'KeyI'], pause: ['Escape', 'KeyP'], ok: ['Enter', 'NumpadEnter'], mute: ['KeyM'], quit: ['KeyQ'],
};
const ACTIONS = Object.keys(KEYMAP);
const In = {
  keys: {}, hit: {}, now: {}, prev: {}, cur: {}, touch: {}, mouse: {}, touchAxis: 0, touchY: 0, pad: null, padPrev: {}, lastDevice: 'key',
  mx: -1, my: -1, mMoved: false, mClick: false, moved: false, clicked: false,
  init() {
    const code2a = {}; for (const a of ACTIONS) for (const c of KEYMAP[a]) (code2a[c] = code2a[c] || []).push(a);
    addEventListener('keydown', e => {
      const as = code2a[e.code]; if (as) e.preventDefault();
      if (e.repeat) return; this.keys[e.code] = true; this.lastDevice = 'key';
      if (as) for (const a of as) this.hit[a] = true;
      onUserGesture();
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.mouse = {}; });
    const cv = document.getElementById('screen');
    if (cv) {
      // mouse: left = attack (hold to charge), right = shot
      cv.addEventListener('pointerdown', e => {
        cv.focus(); onUserGesture();
        if (e.pointerType !== 'mouse') return;
        e.preventDefault(); this.lastDevice = 'mouse'; this.setMouse(e, cv);
        const a = e.button === 0 ? 'attack' : e.button === 2 ? 'shot' : null;
        if (a) { this.mouse[a] = true; this.hit[a] = true; }
        if (e.button === 0) this.mClick = true;
      });
      addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') return; if (e.button === 0) this.mouse.attack = false; if (e.button === 2) this.mouse.shot = false; });
      cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { this.setMouse(e, cv); this.mMoved = true; } });
      cv.addEventListener('contextmenu', e => e.preventDefault());
    }
    this.code2a = code2a;
    this.initTouch();
  },
  initTouch() {
    const tc = document.getElementById('touch'); if (!tc) return;
    const knob = document.getElementById('knob'), stick = document.getElementById('stick');
    let sid = null, sx = 0, sy = 0;
    addEventListener('touchstart', () => { if (!tc.classList.contains('on')) tc.classList.add('on'); this.lastDevice = 'touch'; onUserGesture(); }, { passive: true });
    stick.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; sid = t.identifier; sx = t.clientX; sy = t.clientY; knob.style.display = 'block'; knob.style.left = sx + 'px'; knob.style.top = sy + 'px'; }, { passive: false });
    stick.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === sid) {
        const dx = t.clientX - sx, dy = t.clientY - sy;
        this.touchAxis = Math.abs(dx) > 14 ? sgn(dx) : 0; this.touchY = Math.abs(dy) > 22 ? sgn(dy) : 0;
        if (this.touchY < 0 && !this.touch.up) this.hit.up = true;
        if (this.touchY > 0 && !this.touch.down) this.hit.down = true;
        if (this.touchAxis < 0 && !this.touch.left) this.hit.left = true;
        if (this.touchAxis > 0 && !this.touch.right) this.hit.right = true;
        this.touch.left = this.touchAxis < 0; this.touch.right = this.touchAxis > 0; this.touch.up = this.touchY < 0; this.touch.down = this.touchY > 0;
        knob.style.left = (sx + clamp(dx, -40, 40)) + 'px'; knob.style.top = (sy + clamp(dy, -40, 40)) + 'px';
      }
    }, { passive: false });
    const endStick = e => { for (const t of e.changedTouches) if (t.identifier === sid) { sid = null; this.touchAxis = 0; this.touchY = 0; this.touch.left = this.touch.right = this.touch.up = this.touch.down = false; knob.style.display = 'none'; } };
    stick.addEventListener('touchend', endStick); stick.addEventListener('touchcancel', endStick);
    for (const b of tc.querySelectorAll('.tb')) {
      const a = b.dataset.a;
      b.addEventListener('touchstart', e => { e.preventDefault(); this.touch[a] = true; this.hit[a] = true; if (a === 'jump' || a === 'attack') this.hit.ok = true; b.classList.add('dn'); }, { passive: false });
      const up = e => { e.preventDefault(); this.touch[a] = false; b.classList.remove('dn'); };
      b.addEventListener('touchend', up, { passive: false }); b.addEventListener('touchcancel', up, { passive: false });
    }
  },
  pollPad() {
    // getGamepads can throw inside sandboxed frames (permissions policy) — never let it stop the game
    let pads = [];
    try { pads = (navigator.getGamepads && navigator.getGamepads()) || []; } catch (e) { pads = []; }
    let p = null;
    for (const q of pads) if (q && q.connected && q.mapping === 'standard') { p = q; break; }
    const st = {};
    if (p) {
      // devices that report stuck axes/buttons (VR runtimes, virtual pads, wheels) are ignored until they change from rest
      if (!this.padBase || this.padBase.id !== p.id + p.index) this.padBase = { id: p.id + p.index, axes: p.axes.slice(), btn: p.buttons.map(b => b.pressed), live: false };
      const B = this.padBase;
      if (!B.live) { for (let i = 0; i < p.axes.length; i++) if (Math.abs(p.axes[i] - B.axes[i]) > 0.5) B.live = true; for (let i = 0; i < p.buttons.length; i++) if (p.buttons[i].pressed !== B.btn[i]) B.live = true; }
      if (!B.live) { this.padPrev = {}; this.pad = null; return; }
      const b = i => p.buttons[i] && p.buttons[i].pressed; const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      st.left = b(14) || ax < -0.4; st.right = b(15) || ax > 0.4; st.up = b(12) || ay < -0.55; st.down = b(13) || ay > 0.55;
      st.jump = b(0); st.attack = b(2); st.dash = b(1) || b(5) || b(7); st.shot = b(3) || b(4) || b(6); st.pause = b(9); st.ok = b(0) || b(9);
      for (const a in st) { if (st[a] && !this.padPrev[a]) { this.hit[a] = true; this.lastDevice = 'pad'; onUserGesture(); } }
    }
    this.padPrev = st; this.pad = st;
  },
  setMouse(e, cv) { const r = cv.getBoundingClientRect(); this.mx = (e.clientX - r.left) / r.width * W; this.my = (e.clientY - r.top) / r.height * H; },
  // call once per sim tick
  update() {
    this.pollPad();
    this.clicked = this.mClick; this.mClick = false; this.moved = this.mMoved; this.mMoved = false;
    for (const a of ACTIONS) {
      let d = false; for (const c of KEYMAP[a]) if (this.keys[c]) { d = true; break; }
      if (this.pad && this.pad[a]) d = true; if (this.touch[a]) d = true; if (this.mouse[a]) d = true;
      this.prev[a] = this.cur[a]; this.cur[a] = d;
      this.now[a] = !!this.hit[a]; this.hit[a] = false;
    }
  },
  down(a) { return !!this.cur[a]; },
  pressed(a) { return !!this.now[a]; },
  released(a) { return !this.cur[a] && this.prev[a]; },
  axis() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); },
  confirm() { return this.pressed('jump') || this.pressed('attack') || this.pressed('ok'); },
  eat() { for (const a of ACTIONS) this.now[a] = false; this.clicked = false; },
};
function onUserGesture() { if (typeof Snd !== 'undefined') Snd.unlock(); }
