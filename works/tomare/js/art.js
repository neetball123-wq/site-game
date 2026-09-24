'use strict';
// ============================================================
//  art: stage palettes, procedural backgrounds, textures, glows
// ============================================================
const STAGES = [
  { // 0: road / day — pale, washed-out "gentle apocalypse"
    key: 'day', song: 'day', amb: 'wind', weather: 'motes',
    sky: ['#76a2cc', '#8ab2d6', '#a2c3df', '#bbd4e7', '#d3e3ed', '#e7eff0'],
    cloud: ['#f9fbfa', '#e3ecf1', '#c7d7e2'], land: '#b2c5d4', landHi: '#c2d2de',
    far: ['#a9bece', '#b9cbd8', '#98afc2'], mid: ['#8fa4b7', '#a9bac9', '#7a8fa3', '#687e93'], midWin: ['#6b7f94', '#cfdde6'],
    vine: ['#88a878', '#6f9064', '#a5c28e'], rust: '#a88a7c',
    near: ['#697789', '#55627a'], wire: '#4a5466', haze: '#e4edf0',
    curb: ['#d8d3c5', '#bbb5a6', '#9c9686', '#7f796b'], wall: ['#a3866c', '#bb9e7e', '#846b57', '#5f4b3f', '#4a3a32'],
    grass: ['#8db35d', '#6f9447', '#b3d07a', '#56753d'], fg: '#343a4a', light: '#fffbe6', ambient: 0, lampGlow: '#fff2c0',
    accent: '#e0525a', sunX: 300, sunY: 30,
  },
  { // 1: town / dusk
    key: 'dusk', song: 'dusk', amb: 'wind', weather: 'petals',
    sky: ['#4e4a82', '#77609a', '#b06e9a', '#e08795', '#f6a98c', '#ffd2a0'],
    cloud: ['#ffd6b8', '#f59f8f', '#b26e8e'], land: '#c78a93', landHi: '#e2a39a',
    far: ['#c28397', '#d399a2', '#a86e88'], mid: ['#8a5c7e', '#b77c8c', '#6f4a6d', '#5a3c5d'], midWin: ['#62405f', '#ffd68a'],
    vine: ['#7f8a5c', '#666f4a', '#9aa46c'], rust: '#9a5a52',
    near: ['#4a3552', '#3a2946'], wire: '#34263f', haze: '#f3b89b',
    curb: ['#d9a58f', '#bb8876', '#9a6c60', '#7b5450'], wall: ['#a8604f', '#c07660', '#8a4b44', '#6a383a', '#4f2a30'],
    grass: ['#8f9a55', '#6f7a44', '#b3b86b', '#566035'], fg: '#2e2032', light: '#ffd9a8', ambient: 0.08, lampGlow: '#ffc27a',
    accent: '#ff6b6b', sunX: 250, sunY: 118,
  },
  { // 2: city / night, rain
    key: 'night', song: 'night', amb: 'rain', weather: 'rain',
    sky: ['#0e1024', '#151934', '#1c2143', '#252a52', '#30335f', '#43396b'],
    cloud: ['#3a3f6e', '#2a2e56', '#1d2042'], land: '#23284a', landHi: '#2f3560',
    far: ['#1f2445', '#272d52', '#181c38'], mid: ['#1a1e3b', '#252b50', '#141730', '#10132a'], midWin: ['#0f1228', '#ffcf73'],
    vine: ['#2f4a4a', '#243b3d', '#3d5f5a'], rust: '#3b3150',
    near: ['#12152a', '#0c0e1f'], wire: '#0b0d1c', haze: '#2c2f58',
    curb: ['#4b5275', '#3a4062', '#2d324f', '#23273f'], wall: ['#343a5c', '#3e4570', '#2a2f4d', '#20243d', '#181b2f'],
    grass: ['#2f5b55', '#244842', '#3f7a6e', '#1b3533'], fg: '#07081a', light: '#9fd0ff', ambient: 0.35, lampGlow: '#ffd08a',
    accent: '#ff4f9a', sunX: 92, sunY: 44,
  },
];
const DAWN = { sky: ['#5b6ea8', '#8a8fc0', '#c7a2c0', '#f2b9a8', '#ffd9b0', '#fff0d0'] };

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return c; }
function paint(c, fn) { const prev = G; useCtx(c.getContext('2d')); fn(c); if (prev) useCtx(prev); return c; }

// ---------- glow sprites (smooth radial, additive) ----------
const _glow = new Map();
function glowSprite(r, color) {
  r = Math.max(2, Math.round(r)); const k = r + color; let c = _glow.get(k); if (c) return c;
  c = mkCanvas(r * 2, r * 2); const x = c.getContext('2d');
  const g = x.createRadialGradient(r, r, 0, r, r, r); const rgb = hex2rgb(color);
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.35, `rgba(${rgb},0.35)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); _glow.set(k, c); return c;
}
function glow(x, y, r, color, a = 1) {
  if (a <= 0.01) return; const s = glowSprite(r, color);
  G.globalCompositeOperation = 'lighter'; G.globalAlpha = Math.min(1, a);
  G.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2));
  G.globalAlpha = 1; G.globalCompositeOperation = 'source-over';
}

// ---------- sky ----------
function gradientFill(ctx, w, h, cols, y0, y1, xo = 0) {
  const img = ctx.createImageData(w, h), d = img.data, C = cols.map(hex2rgb), N = C.length;
  for (let y = 0; y < h; y++) {
    const t = clamp((y - y0) / (y1 - y0), 0, 1) * (N - 1); let i = Math.floor(t); if (i >= N - 1) i = N - 2; let f = t - i; f = clamp((f - 0.5) / 0.5, 0, 1);
    for (let x = 0; x < w; x++) { const c = dth(x + xo, y, f) ? C[i + 1] : C[i]; const o = (y * w + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
}
function makeSky(st, cols) {
  const c = mkCanvas(W + MG * 2, H + MG * 2 + 30);
  gradientFill(c.getContext('2d'), c.width, c.height, cols || st.sky, 0, c.height * 0.8);
  const halo = (x, y, r, col, a) => { const cx = c.getContext('2d'); const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); resetFs(); };
  paint(c, () => {
    const sx = st.sunX, sy = st.sunY;
    if (st.key === 'day') {
      halo(sx, sy, 60, '#ffffff', 0.55);
      ellipseF(sx, sy, 12, 12, '#f4f8f2'); ellipseF(sx, sy, 10, 10, '#ffffff');
    } else if (st.key === 'dusk') {
      halo(sx, sy, 110, '#ffe2b0', 0.6);
      ellipseF(sx, sy, 26, 26, '#ffe8b8'); ellipseF(sx, sy, 23, 23, '#fff3cf');
      for (let i = 0; i < 4; i++) rectF(sx - 30, sy + 6 + i * 5, 60, 1 + (i >> 1), mix('#ffd2a0', '#f6a98c', i / 4));
    } else {
      const r = new mulberry32(77);
      for (let i = 0; i < 140; i++) { const x = r() * c.width, y = r() * c.height * 0.6; px(x, y, r() < 0.2 ? '#e8ecff' : r() < 0.5 ? '#8a90c8' : '#5c6299'); }
      halo(sx, sy, 70, '#6a74c0', 0.45);
      ellipseF(sx, sy, 17, 17, '#dcdccc'); ellipseF(sx - 1, sy - 1, 16, 16, '#eeeee0');
      ellipseF(sx + 5, sy - 4, 4, 3, '#d4d3c2'); ellipseF(sx - 6, sy + 5, 3, 3, '#d4d3c2'); ellipseF(sx + 2, sy + 8, 2, 2, '#dad9c9'); ellipseF(sx - 4, sy - 7, 2, 2, '#dad9c9');
      ditherEllipse(sx + 6, sy + 3, 12, 14, '#c9c8b8', 0.5);
    }
  });
  return c;
}
// ---------- clouds (tileable strip) ----------
function cloudBlob(X, Y, w, h, cols, r) {
  const tw = Math.ceil(w + 60), th = Math.ceil(h * 2 + 30); const tmp = mkCanvas(tw, th); const main = G;
  useCtx(tmp.getContext('2d'));
  const x = 30, y = th - 12;
  const n = Math.max(3, Math.round(w / 10)); const pts = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); const cx = x + t * w; const ch = h * (0.45 + 0.55 * Math.sin(t * Math.PI)) * (0.7 + r() * 0.5); pts.push([cx, y - ch * 0.5, Math.max(4, ch * 0.6 + r() * 4)]); }
  for (const p of pts) ellipseF(p[0], p[1] + 2, p[2], p[2] * 0.8, cols[2]);
  for (const p of pts) ellipseF(p[0] - 1, p[1], p[2], p[2] * 0.78, cols[1]);
  for (const p of pts) ellipseF(p[0] - 2, p[1] - 2, p[2] * 0.8, p[2] * 0.6, cols[0]);
  const x2 = G; x2.save(); x2.globalCompositeOperation = 'destination-out'; x2.fillRect(0, y + 3, tw, 40); x2.restore(); resetFs();
  useCtx(main); main.drawImage(tmp, Math.round(X - 30), Math.round(Y - th + 12));
}
function makeClouds(st) {
  const Wd = 1024, Hh = 130; const c = mkCanvas(Wd, Hh); const r = mulberry32(st.key.length * 91 + 3);
  paint(c, (cv) => {
    const x = cv.getContext('2d');
    const cols = st.cloud;
    for (let i = 0; i < (st.key === 'night' ? 5 : 8); i++) {
      const cx = r() * Wd, cy = 30 + r() * 70, w = 40 + r() * 90, h = 14 + r() * 20;
      for (const off of [0, -Wd, Wd]) {
        if (st.key === 'dusk') {
          for (let k = 0; k < 3; k++) { const yy = cy + k * 4, ww = w * (1.4 - k * 0.3); rectF(cx + off - ww / 2, yy, ww, 3, cols[k === 0 ? 0 : k === 1 ? 1 : 2]); rectF(cx + off - ww / 2 + 6, yy + 3, ww - 12, 1, cols[2]); }
        } else cloudBlob(cx + off - w / 2, cy, w, h, cols, r);
      }
    }
  });
  return c;
}
// ---------- landmark (giant distant structure for scale) ----------
function makeLandmark(st) {
  const c = mkCanvas(320, 190); const col = st.land, hi = st.landHi;
  paint(c, () => {
    if (st.key === 'day') {
      // colossal fallen robot: tilted head half-buried + arm reaching skyward
      ellipseF(120, 150, 84, 62, col); rectF(36, 150, 170, 40, col);
      ellipseF(98, 132, 26, 24, hi); ellipseF(98, 132, 19, 18, mix(col, '#8da2b5', 0.3)); ellipseF(98, 132, 7, 7, mix(col, '#e6eef2', 0.5));
      for (let i = 0; i < 6; i++) rectF(150 + i * 7, 108 + i * 3, 3, 40, hi);
      polyF([190, 190, 214, 150, 232, 100, 246, 40, 262, 36, 258, 104, 236, 160, 224, 190], col);
      polyF([244, 38, 238, 14, 246, 8, 252, 30], col); polyF([252, 34, 254, 4, 262, 2, 262, 34], col); polyF([262, 36, 270, 12, 278, 16, 270, 42], col);
      lineF(247, 44, 257, 104, hi); ellipseF(236, 104, 7, 7, hi); ellipseF(236, 104, 5, 5, col);
      for (let i = 0; i < 40; i++) px(40 + Math.random() * 180, 96 + Math.random() * 30, hi);
      // antenna
      lineF(58, 110, 30, 58, col, 2); ellipseF(30, 57, 3, 3, col);
    } else if (st.key === 'dusk') {
      // leaning broken tower
      const ang = 0.2; const bx = 150, by = 190;
      const P = (h, w) => [bx + Math.sin(ang) * h + Math.cos(ang) * w, by - Math.cos(ang) * h + Math.sin(ang) * w];
      const q = [...P(0, -14), ...P(150, -6), ...P(150, 6), ...P(0, 14)]; polyF(q, col);
      for (const h of [60, 110]) { const a = P(h, -26), b = P(h, 26), d = P(h + 10, 18), e = P(h + 10, -18); polyF([...a, ...b, ...d, ...e], col); }
      const top = P(150, 0); lineF(top[0], top[1], top[0] + 18, top[1] - 34, col, 2);
      for (let i = 0; i < 30; i++) { const hh = Math.random() * 150; const pp = P(hh, rnd(-5, 5)); px(pp[0], pp[1], hi); }
      rectF(0, 170, 320, 20, col);
    } else {
      // colossal broken ring over the city, with red beacons
      ringF(160, 230, 200, 9, col); ringF(160, 230, 191, 1, hi);
      c.getContext('2d').clearRect(186, 0, 40, 60);
      for (let i = 0; i < 18; i++) { const a = -Math.PI * 0.9 + i * 0.1; if (a > -1.45 && a < -1.25) continue; const x = 160 + Math.cos(a) * 200, y = 230 + Math.sin(a) * 200; if (y < 190) rectF(x - 1, y - 6, 3, 8, col); }
      rectF(40, 150, 20, 40, col); rectF(250, 140, 18, 50, col);
    }
  });
  return c;
}
// ---------- far skyline (tileable) ----------
function makeFar(st) {
  const Wd = 768, Hh = 150; const c = mkCanvas(Wd, Hh); const r = mulberry32(1000 + st.key.length * 13);
  const [base, lit, dark] = st.far;
  paint(c, () => {
    let x = 0; const blds = [];
    while (x < Wd) { const w = 12 + r() * 30, h = 26 + r() * 80; blds.push([x, w, h, r()]); x += w + (r() < 0.3 ? r() * 16 : 0); }
    for (const [bx, w, h, rv] of blds) for (const off of [0, -Wd]) {
      const X = bx + off, top = Hh - h;
      if (rv < 0.12) { polyF([X, Hh, X + w * 0.2, top + 10, X + w, top + 22, X + w, Hh], base); continue; }
      rectF(X, top, w, h, base);
      if (rv < 0.35) polyF([X, top, X + w * 0.4, top - 6, X + w * 0.6, top + 3, X + w, top - 3, X + w, top + 1, X, top + 1], base);
      if (rv > 0.8) { rectF(X + w / 2, top - 14, 1, 14, base); px(X + w / 2, top - 15, st.key === 'night' ? '#ff4d5e' : lit); }
      rectF(X, top, 2, h, lit);
      for (let yy = top + 5; yy < Hh - 4; yy += 5) for (let xx = X + 3; xx < X + w - 2; xx += 3) {
        if (hash2(xx | 0, yy) < (st.key === 'night' ? 0.1 : 0.5)) px(xx, yy, st.key === 'night' ? (hash2(yy, xx | 0) < 0.3 ? '#8fd8ff' : '#e8b860') : dark);
      }
    }
    // crane silhouette
    const cx = 200 + r() * 300; rectF(cx, 20, 3, 130, dark); rectF(cx - 40, 20, 80, 3, dark); lineF(cx - 40, 23, cx, 8, dark); lineF(cx + 40, 23, cx, 8, dark); lineF(cx + 30, 23, cx + 30, 60, dark); rectF(cx + 26, 60, 9, 6, dark);
  });
  return c;
}
// ---------- mid city (tileable, detailed) ----------
function makeMid(st) {
  const Wd = 1024, Hh = 190; const c = mkCanvas(Wd, Hh); const r = mulberry32(2000 + st.key.length * 7);
  const [base, lit, dark, deep] = st.mid; const [win, winLit] = st.midWin; const night = st.key === 'night', dusk = st.key === 'dusk';
  st.neons = [];
  paint(c, () => {
    let x = 0; const blds = [];
    while (x < Wd) { const w = 44 + r() * 70, h = 60 + r() * 110; blds.push({ x, w, h, v: r(), k: r() }); x += w + 6 + r() * 30; }
    for (const b of blds) for (const off of [0, -Wd]) {
      const X = Math.round(b.x + off), w = Math.round(b.w), top = Math.round(Hh - b.h);
      if (X > Wd || X + w < 0) continue;
      // body + broken top
      rectF(X, top + 6, w, b.h, base);
      const pts = [X, top + 6]; const n = 5 + Math.floor(b.v * 5);
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push(X + t * w, top + (b.v < 0.45 ? r() * 12 : 3) + (i === 0 || i === n ? 3 : 0)); }
      pts.push(X + w, top + 6); polyF(pts, base);
      rectF(X, top + 6, 3, b.h, lit); rectF(X + w - 3, top + 6, 3, b.h, dark);
      if (dusk) rectF(X + w - 2, top + 6, 2, b.h, '#e6937f');
      // floors / windows
      const fl = 11 + Math.floor(b.k * 4), ww = 5, wg = 9;
      for (let yy = top + 14; yy < Hh - 8; yy += fl) {
        rectF(X + 3, yy + fl - 3, w - 6, 1, dark);
        for (let xx = X + 6; xx < X + w - 8; xx += wg) {
          const hv = hash2(xx, yy);
          const broken = hv < 0.18, litw = night && hv > 0.82;
          rectF(xx, yy, ww, 6, broken ? (night ? '#0a0c1c' : st.sky[3]) : litw ? winLit : win);
          if (!broken && !litw) px(xx, yy, lit);
          if (litw) { rectF(xx, yy + 4, ww, 2, mix(winLit, '#ff9d5c', 0.4)); }
          if (hv > 0.55 && hv < 0.62) { for (let k = 0; k < 8 + hv * 20; k++) if (yy + 6 + k < Hh) px(xx + 1 + (k % 2), yy + 6 + k, st.rust); }
        }
      }
      // rooftop items
      if (b.k < 0.3) { rectF(X + 8, top - 8, 12, 10, dark); rectF(X + 9, top + 2, 1, 6, deep); rectF(X + 18, top + 2, 1, 6, deep); ellipseF(X + 14, top - 8, 6, 2, lit); }
      else if (b.k < 0.5) { rectF(X + w * 0.6, top - 16, 1, 18, dark); rectF(X + w * 0.6 - 4, top - 12, 9, 1, dark); }
      // hanging vines
      if (b.v > 0.4) {
        const vx0 = X + 4 + r() * (w - 20), vw = 8 + r() * 16;
        for (let i = 0; i < vw; i++) { const len = 6 + hash2(i, b.x | 0) * 40; for (let k = 0; k < len; k++) if (dth(vx0 + i, top + 6 + k, 1 - k / len * 0.8)) px(vx0 + i, top + 6 + k, k < 3 ? st.vine[2] : (i + k) % 5 === 0 ? st.vine[1] : st.vine[0]); }
      }
      // signboard
      if (b.k > 0.62) {
        const sy = top + 18 + r() * 30, sw = 10 + r() * 14, sh = 20 + r() * 20, sxp = X - 4 + (r() < 0.5 ? 0 : w - 8);
        const sc = night ? (r() < 0.5 ? '#ff4f9a' : '#43e3ff') : pick([st.accent, '#6d8fb3', '#d8b25a', '#6aa58f']);
        rectF(sxp, sy, 9, sh, night ? '#141730' : mix(sc, base, 0.35)); rectF(sxp + 1, sy + 1, 7, sh - 2, night ? mix(sc, '#141730', 0.6) : mix(sc, st.haze, 0.25));
        for (let k = sy + 3; k < sy + sh - 3; k += 4) rectF(sxp + 3, k, 3, 2, night ? sc : mix(sc, '#ffffff', 0.5));
        if (night) st.neons.push({ x: sxp + 4, y: sy + sh / 2, h: sh, c: sc, ph: r() * 10 });
      }
      // exposed rebar on broken tops
      if (b.v < 0.45) for (let i = 0; i < 4; i++) { const rx = X + 4 + r() * (w - 8); lineF(rx, top + 6, rx + rnd(-3, 3), top - 4 - r() * 6, dark); }
    }
  });
  return c;
}
// ---------- tileable wall texture for terrain faces ----------
function makeWallTex(st) {
  const S = 64; const c = mkCanvas(S, S); const r = mulberry32(3000 + st.key.length);
  const [m, hi, sh, mort, deep] = st.wall;
  paint(c, (cv) => {
    rectF(0, 0, S, S, mort);
    if (st.key === 'day') {
      // cobblestones (jittered grid)
      const cells = []; const n = 6;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cells.push([(i + 0.5 + (r() - 0.5) * 0.5) * S / n + (j % 2) * 4, (j + 0.5 + (r() - 0.5) * 0.4) * S / n, r()]);
      const img = cv.getContext('2d').getImageData(0, 0, S, S), d = img.data;
      const cols = [hex2rgb(m), hex2rgb(hi), hex2rgb(sh), hex2rgb(mort), hex2rgb(st.wall[1])];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let b1 = 1e9, b2 = 1e9, bi = 0;
        for (let k = 0; k < cells.length; k++) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          const dx = x - cells[k][0] - ox, dy = (y - cells[k][1] - oy) * 1.2; const dd = dx * dx + dy * dy;
          if (dd < b1) { b2 = b1; b1 = dd; bi = k; } else if (dd < b2) b2 = dd;
        }
        const edge = Math.sqrt(b2) - Math.sqrt(b1);
        let col;
        if (edge < 1.6) col = cols[3];
        else { const cc = cells[bi]; const dx = x - cc[0], dy = y - cc[1]; const lit = -dx - dy; col = lit > 6 && edge > 2.5 ? cols[1] : lit < -7 || edge < 2.4 ? cols[2] : cols[0]; if (cc[2] > 0.8 && lit > 0) col = cols[4]; }
        const o = (y * S + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
      cv.getContext('2d').putImageData(img, 0, 0); useCtx(cv.getContext('2d'));
    } else if (st.key === 'dusk') {
      for (let j = 0; j < S / 6; j++) for (let i = -1; i < S / 12 + 1; i++) {
        const x = i * 12 + (j % 2) * 6, y = j * 6, v = r();
        rectF(x, y, 11, 5, v < 0.2 ? sh : v > 0.85 ? hi : m); rectF(x, y, 11, 1, v > 0.5 ? hi : mix(m, hi, 0.5)); rectF(x + 10, y + 1, 1, 4, sh);
        if (v < 0.07) { rectF(x + 3, y + 1, 4, 3, deep); }
      }
    } else {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const x = i * 32, y = j * 32; rectF(x, y, 31, 31, m); rectF(x, y, 31, 1, hi); rectF(x, y, 1, 31, hi); rectF(x + 30, y + 1, 1, 30, sh); rectF(x + 1, y + 30, 30, 1, sh);
        for (let k = 0; k < 3; k++) px(x + 5 + r() * 22, y + 5 + r() * 22, deep);
        ellipseF(x + 5, y + 5, 1, 1, sh); ellipseF(x + 26, y + 5, 1, 1, sh);
      }
      for (let k = 0; k < 30; k++) { const x = r() * S; lineF(x, r() * S, x, r() * S, mix(m, deep, 0.4)); }
    }
    // cracks & stains
    for (let k = 0; k < 3; k++) { let x = r() * S, y = r() * S; for (let s = 0; s < 8; s++) { const nx = x + rnd(-3, 3), ny = y + rnd(1, 4); lineF(x, y, nx, ny, deep); x = nx; y = ny; } }
  });
  return c;
}

// ---------- stage asset bundle ----------
const Assets = {};
function buildStageAssets(i) {
  const st = STAGES[i]; if (Assets[i]) return Assets[i];
  const A = { sky: makeSky(st), clouds: makeClouds(st), land: makeLandmark(st), far: makeFar(st), mid: makeMid(st), wall: makeWallTex(st) };
  A.wallPat = null; Assets[i] = A; return A;
}

// ---------- near layer: utility poles + swaying wires (drawn per frame) ----------
function drawNearLayer(st, camX, camY, t) {
  const f = 0.6, span = 176, ox = camX * f, base = 150 - camY * 0.5;
  const first = Math.floor((ox - 40) / span), last = Math.floor((ox + W + 40) / span);
  const [pc, pd] = st.near;
  const poles = [];
  for (let k = first - 1; k <= last + 1; k++) {
    const jit = (hash2(k, 3) - 0.5) * 40; const x = Math.round(k * span + jit - ox + MG); const top = Math.round(base - 108 + hash2(k, 5) * 12);
    poles.push([x, top, k]);
  }
  for (let i = 0; i < poles.length; i++) {
    const [x, top, k] = poles[i]; const kind = hash2(k, 9);
    if (kind < 0.2) {
      // tree silhouette
      const tx = x, ty = top + 40;
      rectF(tx - 2, ty, 4, 120, pd);
      ellipseF(tx, ty - 6, 22, 16, pd); ellipseF(tx - 14, ty + 4, 14, 10, pd); ellipseF(tx + 15, ty + 2, 15, 11, pd);
      ellipseF(tx - 4, ty - 10, 16, 10, pc); ellipseF(tx + 10, ty - 2, 10, 7, pc);
      continue;
    }
    rectF(x - 2, top, 4, 160, pc); rectF(x + 1, top, 1, 160, pd);
    rectF(x - 12, top + 8, 24, 2, pc); rectF(x - 9, top + 16, 18, 2, pc);
    for (const dx of [-10, -4, 4, 10]) rectF(x + dx, top + 5, 1, 3, pd);
    if (kind > 0.7) { rectF(x + 3, top + 24, 8, 12, pc); rectF(x + 3, top + 24, 8, 1, pd); }
    if (kind > 0.5 && kind < 0.7) { rectF(x - 7, top + 50, 14, 10, pd); rectF(x - 6, top + 51, 12, 8, st.key === 'night' ? '#2b3a8a' : '#5b86c4'); }
  }
  // wires
  const sway = Math.sin(t * 0.02) * 1.5;
  for (let i = 0; i + 1 < poles.length; i++) {
    const [x0, t0, k0] = poles[i], [x1, t1, k1] = poles[i + 1];
    if (hash2(k0, 9) < 0.2 || hash2(k1, 9) < 0.2) continue;
    for (const [dx, dy, sag] of [[-10, 8, 14], [10, 8, 12], [-6, 16, 18], [6, 16, 16]]) {
      const ax = x0 + dx, ay = t0 + dy, bx = x1 + dx, by = t1 + dy; const n = Math.ceil((bx - ax) / 3); let lx = ax, ly = ay;
      for (let s = 1; s <= n; s++) {
        const u = s / n; const x = lerp(ax, bx, u), y = lerp(ay, by, u) + Math.sin(u * Math.PI) * (sag + sway * Math.sin(u * Math.PI));
        lineF(lx, ly, x, y, st.wire); lx = x; ly = y;
      }
    }
  }
}

// ---------- upgrade icons (16x16, drawn live) ----------
function drawIcon(id, x, y, c1 = '#fff5e0', c2 = '#ffd23f') {
  x = Math.round(x); y = Math.round(y);
  const o = OUT;
  switch (id) {
    case 'sign': lineF(x + 3, y + 14, x + 10, y + 5, o, 3); lineF(x + 3, y + 14, x + 10, y + 5, '#9aa0ad', 1); polyF([x + 5, y + 1, x + 16, y + 1, x + 12, y + 10], '#fff'); polyF([x + 7, y + 2, x + 14, y + 2, x + 11.5, y + 7.5], '#e0415a'); break;
    case 'speed': for (let i = 0; i < 3; i++) polyF([x + 2 + i * 5, y + 3, x + 7 + i * 5, y + 8, x + 2 + i * 5, y + 13, x + 4 + i * 5, y + 8], i === 2 ? c2 : c1); break;
    case 'hull': ellipseF(x + 5.5, y + 6, 4, 4, '#ff5d73'); ellipseF(x + 10.5, y + 6, 4, 4, '#ff5d73'); polyF([x + 1.5, y + 7, x + 14.5, y + 7, x + 8, y + 15], '#ff5d73'); px(x + 4, y + 4, '#ffd0d8'); rectF(x + 7, y + 6, 2, 6, '#fff'); rectF(x + 5, y + 8, 6, 2, '#fff'); break;
    case 'jet': polyF([x + 8, y + 1, x + 13, y + 8, x + 8, y + 6, x + 3, y + 8], c1); rectF(x + 6, y + 8, 4, 3, '#9aa0ad'); polyF([x + 5, y + 11, x + 11, y + 11, x + 8, y + 16], '#ff9a3c'); px(x + 8, y + 12, '#fff3a0'); break;
    case 'volt': polyF([x + 9, y + 1, x + 3, y + 9, x + 8, y + 9, x + 6, y + 15, x + 13, y + 6, x + 8, y + 6, x + 11, y + 1], '#8fe8ff'); px(x + 8, y + 3, '#fff'); break;
    case 'blaze': ellipseF(x + 8, y + 10, 5, 5, '#ff6a2c'); polyF([x + 3, y + 10, x + 8, y + 1, x + 13, y + 10], '#ff6a2c'); ellipseF(x + 8, y + 11, 3, 3, '#ffd23f'); polyF([x + 5, y + 11, x + 8, y + 5, x + 11, y + 11], '#ffd23f'); px(x + 8, y + 12, '#fff'); break;
    case 'magnet': polyF(arcPts(x + 8, y + 8, 3, 6.5, Math.PI, TAU, 1), '#e0415a'); rectF(x + 2, y + 7, 3, 6, '#e0415a'); rectF(x + 11, y + 7, 3, 6, '#e0415a'); rectF(x + 2, y + 12, 3, 2, '#e8e8f0'); rectF(x + 11, y + 12, 3, 2, '#e8e8f0'); break;
    case 'bolt': for (let i = -1; i <= 1; i++) { const a = i * 0.35; lineF(x + 3, y + 8, x + 3 + Math.cos(a) * 11, y + 8 + Math.sin(a) * 11, '#c7ccd6', 2); px(x + 3 + Math.cos(a) * 11, y + 8 + Math.sin(a) * 11, c2); } break;
    case 'quake': rectF(x + 1, y + 12, 14, 3, '#b39679'); polyF([x + 8, y + 12, x + 5, y + 9, x + 8, y + 7, x + 6, y + 3], '#fff'); lineF(x + 8, y + 12, x + 11, y + 6, '#fff'); for (const d of [-6, 6]) lineF(x + 8 + d, y + 11, x + 8 + d * 1.2, y + 7, c2); break;
    case 'over': ringF(x + 8, y + 8, 7, 2, c2); ellipseF(x + 8, y + 8, 3, 3, '#fff'); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; px(x + 8 + Math.cos(a) * 8, y + 8 + Math.sin(a) * 8, '#fff'); } break;
    case 'reflex': ellipseF(x + 8, y + 8, 6, 6, '#8fb8ff'); ellipseF(x + 8, y + 8, 4, 4, '#dce9ff'); lineF(x + 8, y + 8, x + 8, y + 4, OUT); lineF(x + 8, y + 8, x + 11, y + 9, OUT); break;
    case 'lucky': polyF([x + 8, y + 1, x + 10, y + 6, x + 15, y + 6, x + 11, y + 9, x + 13, y + 15, x + 8, y + 11, x + 3, y + 15, x + 5, y + 9, x + 1, y + 6, x + 6, y + 6], c2); px(x + 7, y + 5, '#fff'); break;
    case 'echo': for (let i = 2; i >= 0; i--) { const cc = [c1, '#b3a7ff', '#6f64c8'][i]; polyF(arcPts(x + 4 + i * 3, y + 12, 5, 9, -2.3, -0.4, 1), cc); } break;
    case 'repair': rectF(x + 3, y + 4, 10, 11, '#d8594f'); rectF(x + 5, y + 2, 6, 3, '#9aa0ad'); rectF(x + 7, y + 7, 2, 6, '#fff'); rectF(x + 5, y + 9, 6, 2, '#fff'); break;
    case 'thorn': for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; lineF(x + 8, y + 8, x + 8 + Math.cos(a) * 7, y + 8 + Math.sin(a) * 7, i % 2 ? c1 : c2); } ellipseF(x + 8, y + 8, 3, 3, '#e0415a'); break;
  }
}
