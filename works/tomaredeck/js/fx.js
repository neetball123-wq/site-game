'use strict';
// ============================================================
//  fx: camera, screen effects, particles, floating numbers
// ============================================================
const Cam = {
  x: 0, y: 0, tx: 0, ty: 0, trauma: 0, kx: 0, ky: 0, zoom: 1, zv: 0, tilt: 0, tv: 0, sx: 0, sy: 0, holdZ: 1, holdT: 0, fx: W / 2, fy: H / 2, focusT: 0,
  reset() { this.x = this.y = this.tx = this.ty = 0; this.trauma = 0; this.kx = this.ky = 0; this.zoom = 1; this.zv = 0; this.tilt = 0; this.tv = 0; this.holdT = 0; this.focusT = 0; },
  shake(a) { this.trauma = Math.min(1, this.trauma + a); },
  kick(dx, dy) { this.kx += dx; this.ky += dy; },
  punch(z, t = 0) { this.zv += z; this.tv += t; },
  hold(z, frames, fx, fy) { this.holdZ = z; this.holdT = frames; if (fx != null) { this.fx = fx; this.fy = fy; this.focusT = frames + 20; } },
  focus(fx, fy, frames) { this.fx = fx; this.fy = fy; this.focusT = frames; },
  update(t) {
    // gentle idle drift so the scene breathes
    this.x = lerp(this.x, this.tx + Math.sin(t * 0.004) * 6, 0.05); this.y = lerp(this.y, this.ty + Math.sin(t * 0.0031) * 2, 0.05);
    const t2 = this.trauma * this.trauma;
    this.sx = Math.round((Math.random() * 2 - 1) * 8 * t2 + this.kx); this.sy = Math.round((Math.random() * 2 - 1) * 6 * t2 + this.ky);
    this.trauma = Math.max(0, this.trauma - 0.03);
    this.kx *= 0.72; this.ky *= 0.72; if (Math.abs(this.kx) < 0.3) this.kx = 0; if (Math.abs(this.ky) < 0.3) this.ky = 0;
    const zt = this.holdT > 0 ? this.holdZ : 1; if (this.holdT > 0) this.holdT--;
    this.zv += (zt - this.zoom) * (this.holdT > 0 ? 0.06 : 0.18); this.zv *= 0.62; this.zoom += this.zv; if (this.zoom < 1) { this.zoom = 1; this.zv = Math.max(0, this.zv); }
    this.tv += (0 - this.tilt) * 0.16; this.tv *= 0.66; this.tilt += this.tv;
    if (this.focusT > 0) this.focusT--; else { this.fx = lerp(this.fx, W / 2, 0.1); this.fy = lerp(this.fy, H / 2, 0.1); }
  },
};
const Scr = {
  flashC: '#ffffff', flashA: 0, lb: 0, lbT: 0, inv: 0, slowT: 0, slowTo: 1, ts: 1, hitstop: 0, tint: null, tintA: 0,
  flash(c, a) { this.flashC = c; this.flashA = Math.max(this.flashA, a); },
  slow(to, frames) { this.slowTo = to; this.slowT = Math.max(this.slowT, frames); },
  stop(n) { this.hitstop = Math.max(this.hitstop, n); },
  update() {
    this.flashA = Math.max(0, this.flashA - 0.07);
    this.lb = lerp(this.lb, this.lbT, 0.15);
    if (this.inv > 0) this.inv--;
    if (this.slowT > 0) { this.slowT--; this.ts = lerp(this.ts, this.slowTo, 0.35); } else this.ts = lerp(this.ts, 1, 0.12);
    if (Math.abs(this.ts - 1) < 0.01) this.ts = 1;
    this.tintA = Math.max(0, this.tintA - 0.02);
  },
};

// ---------- particles (world space = screen space of the battle scene) ----------
let PGROUND = GY;                 // bounce line for debris
let PSTAGE = null;                // current stage palette
const Parts = [];
const Fx = {
  add(o) { o.t = 0; Parts.push(o); return o; },
  dustC() { const st = PSTAGE || STAGES[0]; return st.key === 'night' ? '#5a6190' : st.key === 'dusk' ? '#e8c0a8' : '#e6e0d2'; },
  dust(x, y, n = 4, s = 1, col) { const c = col || this.dustC(); for (let i = 0; i < n; i++) this.add({ k: 'dust', x: x + rnd(-3, 3) * s, y: y - rnd(0, 2), vx: rnd(-1, 1) * s * 0.9, vy: -rnd(0.1, 0.6) * s, r: rnd(1.5, 3.2) * s, life: rndi(16, 30), c }); },
  dustDir(x, y, dir, n = 5, s = 1) { const c = this.dustC(); for (let i = 0; i < n; i++) this.add({ k: 'dust', x, y: y - rnd(0, 2), vx: dir * rnd(0.4, 2.2) * s, vy: -rnd(0.1, 0.7), r: rnd(1.5, 3) * s, life: rndi(14, 26), c }); },
  sparks(x, y, n, dir, c = '#fff4c0', sp = 1) { for (let i = 0; i < n; i++) { const a = (dir ? (dir > 0 ? 0 : Math.PI) : rnd(TAU)) + rnd(-1.1, 1.1); const v = rnd(1.5, 4.5) * sp; this.add({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: rndi(8, 18), c, g: 0.18 }); } },
  debris(x, y, vx, vy, c, sz = 2) { this.add({ k: 'debris', x, y, vx, vy, c, sz, life: rndi(60, 110), g: 0.25, rest: 0 }); },
  bits(x, y, n, cols) { for (let i = 0; i < n; i++) this.debris(x + rnd(-4, 4), y + rnd(-4, 4), rnd(-3, 3), rnd(-5, -1.5), pick(cols), rndi(1, 3)); },
  chunk(x, y, cols) { this.add({ k: 'debris', x, y, vx: rnd(-3.5, 3.5), vy: rnd(-6, -2), c: pick(cols || ['#d8d4c8', '#9aa0ad', '#b5b0a4', '#6d6577']), sz: rndi(2, 4), life: rndi(80, 140), g: 0.25, rest: 0 }); },
  smoke(x, y, n = 3, s = 1, c) { for (let i = 0; i < n; i++) this.add({ k: 'smoke', x: x + rnd(-4, 4) * s, y: y + rnd(-3, 3) * s, vx: rnd(-0.4, 0.4), vy: -rnd(0.2, 0.8), r: rnd(3, 6) * s, life: rndi(30, 60), c: c || (PSTAGE && PSTAGE.key === 'night' ? '#3a3e62' : '#8d8f98') }); },
  fire(x, y, n = 3, s = 1) { for (let i = 0; i < n; i++) this.add({ k: 'fire', x: x + rnd(-3, 3) * s, y: y + rnd(-2, 2) * s, vx: rnd(-0.5, 0.5), vy: -rnd(0.6, 1.6) * s, r: rnd(2, 4) * s, life: rndi(14, 26) }); },
  ring(x, y, r0, r1, life, c = '#ffffff', th = 2) { this.add({ k: 'ring', x, y, r0, r1, life, c, th }); },
  flatRing(x, y, r0, r1, life, c = '#ffffff') { this.add({ k: 'fring', x, y, r0, r1, life, c }); },
  star(x, y, sz, c = '#ffffff', life = 5, ang = 0) { this.add({ k: 'star', x, y, sz, c, life, ang: ang || rnd(TAU) }); },
  num(x, y, v, opt = {}) { this.add({ k: 'num', x, y, vx: rnd(-0.5, 0.5), vy: -2.4, v: String(v), big: opt.big, c: opt.c || '#ffffff', life: opt.big ? 60 : 44, scale: opt.scale || 1 }); },
  label(x, y, s, c = '#ffffff', life = 50) { this.add({ k: 'label', x, y, s, c, life }); },
  streak(x, y, vx, vy, len, c, life = 10) { this.add({ k: 'streak', x, y, vx, vy, len, c, life }); },
  glowP(x, y, r, c, life) { this.add({ k: 'glowp', x, y, r, c, life }); },
  bolt(x0, y0, x1, y1, c = '#9ff0ff', life = 8) { const pts = [[x0, y0]]; const n = Math.max(3, Math.floor(dist(x0, y0, x1, y1) / 7)); for (let i = 1; i < n; i++) { const t = i / n; pts.push([lerp(x0, x1, t) + rnd(-5, 5), lerp(y0, y1, t) + rnd(-5, 5)]); } pts.push([x1, y1]); this.add({ k: 'lbolt', pts, c, life }); },
  crack(x, y, sz) { this.add({ k: 'crack', x, y, sz, life: 120, seed: Math.random() * 1000 }); },
  shock(x, y, len, c = '#ffffff') { this.add({ k: 'shock', x, y, len, c, life: 14 }); },
  rust(x, y, n = 6) { for (let i = 0; i < n; i++) this.add({ k: 'dust', x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-0.3, 0.3), vy: rnd(0.1, 0.6), r: rnd(1, 2), life: rndi(20, 40), c: pick(['#b8643a', '#8a4a2a', '#d88a50']) }); },
  pixelBurst(x, y, cols, n = 18) { for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(0.5, 3); this.add({ k: 'pix', x: x + rnd(-6, 6), y: y + rnd(-8, 8), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, c: pick(cols), life: rndi(14, 30) }); } },
};
function updateParts(ts) {
  let j = 0;
  for (let i = 0; i < Parts.length; i++) {
    const p = Parts[i]; p.t += ts;
    switch (p.k) {
      case 'dust': p.x += p.vx * ts; p.y += p.vy * ts; p.vx *= Math.pow(0.9, ts); p.vy *= Math.pow(0.92, ts); break;
      case 'spark': p.x += p.vx * ts; p.y += p.vy * ts; p.vy += p.g * ts; p.vx *= Math.pow(0.93, ts); break;
      case 'pix': p.x += p.vx * ts; p.y += p.vy * ts; p.vy += 0.08 * ts; p.vx *= Math.pow(0.95, ts); break;
      case 'debris': {
        if (p.rest > 20) break;
        p.vy += p.g * ts; p.x += p.vx * ts; p.y += p.vy * ts;
        if (p.y > PGROUND && p.vy > 0) { p.y = PGROUND; p.vy = p.vy > 1 ? -p.vy * 0.4 : 0; p.vx *= 0.7; if (Math.abs(p.vy) < 0.5) p.rest++; }
        break;
      }
      case 'smoke': p.x += p.vx * ts; p.y += p.vy * ts; p.vy *= Math.pow(0.98, ts); p.r += 0.06 * ts; break;
      case 'fire': p.x += p.vx * ts; p.y += p.vy * ts; p.r *= Math.pow(0.97, ts); break;
      case 'num': p.x += p.vx * ts; p.y += p.vy * ts; p.vy = Math.min(p.vy + 0.14 * ts, 0.6); break;
      case 'label': p.y -= 0.35 * ts; break;
      case 'streak': p.x += p.vx * ts; p.y += p.vy * ts; break;
      case 'petal': case 'mote': p.x += p.vx * ts; p.y += p.vy * ts; p.ph += 0.05 * ts; p.vx += Math.sin(p.ph) * 0.01; break;
      case 'drop': p.x += p.vx * ts; p.y += p.vy * ts; if (p.y > p.gy) { p.t = p.life; Fx.add({ k: 'splash', x: p.x, y: p.gy, life: 8 }); } break;
    }
    if (p.t < p.life) Parts[j++] = p;
  }
  Parts.length = j;
}
function drawParts(cx, cy, layer) {
  for (let i = 0; i < Parts.length; i++) {
    const p = Parts[i]; const u = p.t / p.life; const x = p.x - cx, y = p.y - cy;
    if (layer === 'glow') {
      if (p.k === 'fire') glow(x, y, p.r * 3, '#ff8a3c', 0.5 * (1 - u)); else if (p.k === 'spark') glow(x, y, 6, '#ffd27a', 0.45 * (1 - u));
      else if (p.k === 'glowp') glow(x, y, p.r, p.c, 1 - u); else if (p.k === 'lbolt') glow(p.pts[0][0] - cx, p.pts[0][1] - cy, 20, p.c, 0.6 * (1 - u));
      continue;
    }
    switch (p.k) {
      case 'dust': ditherEllipse(x, y, p.r * (1 - u * 0.4), p.r * (1 - u * 0.4), p.c, 1 - u * u); break;
      case 'smoke': ditherEllipse(x, y, p.r, p.r, p.c, 0.8 * (1 - u)); break;
      case 'spark': lineF(x, y, x - p.vx * 1.8, y - p.vy * 1.8, u < 0.4 ? '#ffffff' : p.c); break;
      case 'pix': if (u < 0.8 || (p.t | 0) % 2) rectF(x, y, u < 0.5 ? 2 : 1, u < 0.5 ? 2 : 1, p.c); break;
      case 'debris': { const s = p.sz; if (u > 0.8 && ((p.t | 0) % 4 < 2)) break; rectF(x - s / 2, y - s, s, s, p.c); if (s > 2) px(x - s / 2, y - s, '#ffffff'); break; }
      case 'fire': { const c = u < 0.25 ? '#fff3b0' : u < 0.5 ? '#ffc23c' : u < 0.75 ? '#ff6a2c' : '#8a3a3a'; ellipseF(x, y, p.r, p.r * 1.2, c); break; }
      case 'ring': { const r = lerp(p.r0, p.r1, easeOut(u)); const th = Math.max(1, Math.round(p.th * (1 - u))); ringF(x, y, r, th, p.c); break; }
      case 'fring': { const r = lerp(p.r0, p.r1, easeOut(u)); ringF(x, y, r, Math.max(1, 2 - u * 2), p.c, r * 0.28); break; }
      case 'star': {
        const s = p.sz * (u < 0.3 ? 1 : 1 - (u - 0.3) / 0.7);
        for (let k = 0; k < 4; k++) { const a = p.ang + k * Math.PI / 2; const L = s * (k % 2 ? 0.55 : 1); polyF([x + Math.cos(a) * L, y + Math.sin(a) * L, x + Math.cos(a + 1.35) * s * 0.18, y + Math.sin(a + 1.35) * s * 0.18, x + Math.cos(a - 1.35) * s * 0.18, y + Math.sin(a - 1.35) * s * 0.18], p.c); }
        ellipseF(x, y, s * 0.25, s * 0.25, '#ffffff'); break;
      }
      case 'num': {
        if (u > 0.78 && ((p.t | 0) % 4 < 2)) break;
        const sc = p.big ? 2 : 1; const tw = textW(p.v, true, sc); const pop = p.t < 5 ? (p.big ? 3 : 1) : 0;
        textO(p.v, x - tw / 2, y - pop, p.c, OUT, true, sc); break;
      }
      case 'label': { if (u > 0.8 && ((p.t | 0) % 4 < 2)) break; textC(p.s, x, y, p.c, false, 1, OUT); break; }
      case 'streak': lineF(x, y, x - p.vx * p.len, y - p.vy * p.len, p.c); break;
      case 'shock': { const L = p.len * easeOut(u), hgt = Math.round(9 * (1 - u)); for (const d of [-1, 1]) { const xx = x + d * L; if (hgt > 0) { rectF(xx - 1, y - hgt, 3, hgt, p.c); rectF(xx, y - hgt - 2, 1, 2, '#ffffff'); } } break; }
      case 'lbolt': { const c = (p.t | 0) % 2 ? '#ffffff' : p.c; for (let k = 1; k < p.pts.length; k++) lineF(p.pts[k - 1][0] - cx, p.pts[k - 1][1] - cy, p.pts[k][0] - cx, p.pts[k][1] - cy, c, u < 0.3 ? 2 : 1); break; }
      case 'crack': {
        const r = mulberry32(p.seed | 0); const a = u > 0.8 ? (1 - u) / 0.2 : 1; if (a < 0.3 && ((p.t | 0) % 3)) break;
        for (let k = 0; k < 5; k++) { let xx = x, yy = y; const dir = (r() < 0.5 ? -1 : 1); for (let s = 0; s < 4; s++) { const nx = xx + dir * (2 + r() * p.sz / 3), ny = yy + (r() < 0.5 ? 1 : 0); lineF(xx, yy, nx, ny, OUT); xx = nx; yy = ny; } }
        break;
      }
      case 'petal': { const c = (p.ph | 0) % 2 ? '#ffd1dc' : '#ffb3c6'; rectF(x, y, Math.sin(p.ph * 2) > 0 ? 2 : 1, 1, c); break; }
      case 'mote': { if (dth(Math.round(x), Math.round(y), 0.6 + 0.4 * Math.sin(p.ph))) px(x, y, '#ffffff'); break; }
      case 'drop': lineF(x, y, x - p.vx * 2, y - p.vy * 2, '#8fa3d9'); break;
      case 'splash': { const s = Math.round(u * 3); px(x - 1 - s, y - 1 - (u < 0.5 ? 1 : 0), '#b8c6ef'); px(x + 1 + s, y - 1 - (u < 0.5 ? 1 : 0), '#b8c6ef'); break; }
    }
  }
}
function weather(st, ts) {
  if (!st) return;
  if (st.weather === 'rain') { for (let i = 0; i < 5 * ts; i++) Fx.add({ k: 'drop', x: rnd(-40, W + 60), y: -10, vx: -1.2, vy: rnd(7, 9), gy: rnd(GY - 20, H), life: 60 }); }
  else if (st.weather === 'petals') { if (Math.random() < 0.16 * ts) Fx.add({ k: 'petal', x: W + 10, y: rnd(0, H * 0.7), vx: -rnd(0.5, 1.1), vy: rnd(0.15, 0.4), ph: rnd(TAU), life: 700 }); }
  else if (Math.random() < 0.1 * ts) Fx.add({ k: 'mote', x: rnd(0, W), y: rnd(0, H * 0.8), vx: rnd(-0.15, 0.25), vy: -rnd(0.02, 0.15), ph: rnd(TAU), life: rndi(200, 400) });
}
