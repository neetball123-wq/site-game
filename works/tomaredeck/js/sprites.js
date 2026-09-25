'use strict';
// ============================================================
//  sprites: the robot (battle scale) + every enemy, drawn procedurally
// ============================================================
const PC = {
  body: '#ece6d6', shade: '#cbc2ae', shade2: '#b3a993', hi: '#fffcf2', skirt: '#b3a993', dark: '#5a5468', leg: '#4b4658', leg2: '#6a6478',
  eye: '#ffd23f', eye2: '#f0a020', sock: '#2d2a3c', scarf: '#e5486d', scarf2: '#a52d4f', led: '#ff4d6d', pole: '#a3a9b6',
};
function tint(c) {
  const k = PSTAGE ? PSTAGE.key : 'day';
  if (k === 'night') return mix(c, '#1c2046', 0.3);
  if (k === 'dusk') return mix(c, '#b4607c', 0.12);
  return c;
}

// ------------------------------------------------------------ the robot
class Robot {
  constructor() {
    this.x = 108; this.y = GY; this.face = 1; this.pose = 'idle'; this.pt = 0; this.pd = 1; this.ox = 0; this.oy = 0;
    this.wAng = -2.2; this.sx = 1; this.sy = 1; this.sv = 0; this.rot = 0; this.blink = 0; this.blinkT = 120; this.ant = 0; this.antV = 0; this.eyeRed = 0; this.flash = 0;
    this.smears = []; this.look = 0; this.t = 0; this.dead = false; this.walk = 0;
    this.scarf = []; for (let i = 0; i < 9; i++) this.scarf.push({ x: this.x - 7 - i * 3, y: this.y - 13, px: this.x - 7 - i * 3, py: this.y - 13 });
    this.signR = 9; this.poleL = 24; this.lastAng = null; this.target = null;
  }
  // start an animation; returns frames until the "impact" moment
  act(pose, opt = {}) {
    this.pose = pose; this.pt = 0; this.opt = opt; this.lastAng = null;
    const D = { swing: [22, 9], heavy: [30, 14], sweep: [26, 11], thrust: [18, 7], throw: [18, 7], guard: [22, 6], cast: [26, 12], hurt: [18, 0], win: [60, 0], stop: [28, 12], dash: [16, 6] }[pose] || [20, 8];
    this.pd = D[0]; return D[1];
  }
  update(ts) {
    this.t += ts; this.pt += ts; this.flash = Math.max(0, this.flash - ts); this.eyeRed = Math.max(0, this.eyeRed - ts);
    const p = this.pose, u = clamp(this.pt / this.pd, 0, 1), o = this.opt || {};
    let tgtAng = -2.2 + Math.sin(this.t * 0.04) * 0.05, ox = 0, oy = 0, rot = 0;
    const dashTo = o.dx || 0; // how far to lunge toward the target
    const from = o.from || 0, home = o.stay ? dashTo : 0;
    if (p === 'swing' || p === 'heavy' || p === 'sweep') {
      const pre = p === 'heavy' ? 0.35 : 0.3, hit = p === 'heavy' ? 0.47 : 0.42;
      if (u < pre) {
        const k = easeOut(u / pre); tgtAng = lerp(-2.2, -3.1, k); ox = lerp(from, dashTo - 3, easeInOut(u / pre));
        if (this.pt < 1.5) { this.sy = 0.84; this.sx = 1.15; }
        if (Math.abs(dashTo - from) > 30 && (this.pt | 0) % 2 === 0 && !SIM.on) { Fx.streak(this.x + ox - 8, this.y - rnd(6, 28), 4, 0, 3, '#ffffff', 6); if (this.pt < 2) { Fx.dustDir(this.x + from, this.y, -1, 4, 1); Snd.play('whoosh', { x: this.x, p: 0.2 }); } }
      }
      else if (u < hit) { const k = (u - pre) / (hit - pre); tgtAng = lerp(-3.1, p === 'sweep' ? 0.3 : 1.15, easeOutCubic(k)); ox = dashTo + 6 * k; if (this.lastAng == null) { this.lastAng = -3.1; Snd.play('swing', { x: this.x, p: p === 'heavy' ? 1 : 0.5, pitch: p === 'heavy' ? 0.75 : rnd(0.95, 1.1) }); this.sx = 1.2; this.sy = 0.86; } }
      else { const k = (u - hit) / (1 - hit); tgtAng = lerp(p === 'sweep' ? 0.3 : 1.15, -2.2, easeInOut(k)); ox = lerp(dashTo + 6, home, easeInOut(k)); if (!o.stay && dashTo > 30 && k > 0.2 && k < 0.8 && (this.pt | 0) % 3 === 0 && !SIM.on) Fx.dust(this.x + ox, this.y, 1, 0.6); }
      this.wAng = tgtAng;
      if (u >= pre && u < hit + 0.05 && this.lastAng != null) { this.smears.push({ a0: this.lastAng, a1: this.wAng, t: 0, x: this.x + ox, y: this.y, heavy: p === 'heavy' }); this.lastAng = this.wAng; }
    } else if (p === 'thrust' || p === 'dash') {
      if (u < 0.25) { tgtAng = lerp(-2.2, -0.2, easeOut(u / 0.25)); ox = from - 4 * (u / 0.25); }
      else if (u < 0.45) { tgtAng = -0.05; ox = lerp(from - 4, dashTo + 10, easeOutCubic((u - 0.25) / 0.2)); if (this.lastAng == null) { this.lastAng = 0; Snd.play('swing', { x: this.x, p: 0.3, pitch: 1.3 }); if (dashTo > 30) Snd.play('whoosh', { x: this.x, p: 0.3 }); } if (dashTo > 30 && !SIM.on) Fx.streak(this.x + ox - 10, this.y - rnd(6, 28), 5, 0, 3, '#ffffff', 6); }
      else { tgtAng = lerp(-0.05, -2.2, easeInOut((u - 0.45) / 0.55)); ox = lerp(dashTo + 10, home, easeInOut((u - 0.45) / 0.55)); }
      this.wAng = lerp(this.wAng, tgtAng, 0.5); rot = u > 0.25 && u < 0.5 ? 0.12 : 0;
    } else if (p === 'throw') {
      if (u < 0.35) tgtAng = lerp(-2.2, -3.4, easeOut(u / 0.35)); else if (u < 0.5) tgtAng = lerp(-3.4, -0.4, (u - 0.35) / 0.15); else tgtAng = lerp(-0.4, -2.2, easeInOut((u - 0.5) / 0.5));
      this.wAng = lerp(this.wAng, tgtAng, 0.6); ox = u < 0.35 ? -2 : u < 0.6 ? 2 : 0;
    } else if (p === 'guard') {
      tgtAng = u < 0.8 ? -1.35 : lerp(-1.35, -2.2, (u - 0.8) / 0.2); this.wAng = lerp(this.wAng, tgtAng, 0.35); ox = u < 0.8 ? 3 : 0;
      if (this.pt < 1.5) { this.sy = 0.82; this.sx = 1.18; }
    } else if (p === 'cast' || p === 'stop') {
      tgtAng = u < 0.7 ? -1.62 : lerp(-1.62, -2.2, (u - 0.7) / 0.3); this.wAng = lerp(this.wAng, tgtAng, 0.3); oy = u < 0.7 ? -Math.sin(u / 0.7 * Math.PI) * (p === 'stop' ? 10 : 4) : 0;
      if (p === 'stop' && u > 0.38 && u < 0.46 && !o._slam) { o._slam = true; this.sy = 0.7; this.sx = 1.35; }
    } else if (p === 'hurt') {
      ox = -8 * Math.sin(u * Math.PI) * (1 - u * 0.5); rot = -0.3 * (1 - u); this.wAng = lerp(this.wAng, -2.5, 0.3);
    } else if (p === 'win') {
      oy = -Math.abs(Math.sin(u * Math.PI * 2)) * 10; tgtAng = -1.6; this.wAng = lerp(this.wAng, tgtAng, 0.2);
    } else if (p === 'dead') {
      rot = lerp(this.rot, -1.45, 0.08); oy = 0; this.wAng = lerp(this.wAng, 0.4, 0.1);
    } else this.wAng = lerp(this.wAng, tgtAng, 0.15);
    if (u >= 1 && p !== 'dead' && p !== 'idle') { this.pose = 'idle'; this.opt = {}; }
    this.ox = ox; this.oy = oy; this.rot = p === 'dead' ? rot : lerp(this.rot, rot, 0.4);
    // squash spring
    this.sv += (1 - this.sy) * 0.28 * ts; this.sv *= Math.pow(0.62, ts); this.sy += this.sv * ts; this.sx = lerp(this.sx, 1 + (1 - this.sy) * 0.9, 0.35);
    // blink / antenna / smears
    this.blinkT -= ts; if (this.blinkT <= 0) { this.blink = 7; this.blinkT = rnd(120, 280); } if (this.blink > 0) this.blink -= ts;
    this.antV += (-this.ant * 0.2 - (this.ox - (this._pox || 0)) * 0.06) * ts; this.antV *= Math.pow(0.84, ts); this.ant += this.antV * ts; this.ant = clamp(this.ant, -1.2, 1.2); this._pox = this.ox;
    for (const s of this.smears) s.t += ts; this.smears = this.smears.filter(s => s.t < 6);
    // scarf verlet
    const ax = this.x + this.ox - 7 * this.face, ay = this.y + this.oy - 13 * this.sy; const sc = this.scarf; sc[0].x = ax; sc[0].y = ay;
    const wind = (PSTAGE && PSTAGE.key === 'night' ? -0.11 : -0.08) * this.face + Math.sin(this.t * 0.05 + Math.sin(this.t * 0.013) * 3) * 0.04;
    for (let i = 1; i < sc.length; i++) { const q = sc[i]; const vx = (q.x - q.px) * 0.9, vy = (q.y - q.py) * 0.9; q.px = q.x; q.py = q.y; q.x += vx * ts + wind * ts * (0.6 + i * 0.12); q.y += vy * ts + (0.06 + Math.sin(this.t * 0.21 + i) * 0.03) * ts; }
    for (let k = 0; k < 3; k++) for (let i = 1; i < sc.length; i++) { const a = sc[i - 1], b = sc[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, L = 2.8; const df = (d - L) / d; b.x -= dx * df; b.y -= dy * df; }
  }
  handLocal(a) { return [2 + Math.cos(a) * 6, -13 + Math.sin(a) * 4]; }
  signTip() { const h = this.handLocal(this.wAng); const a = this.wAng + this.rot; const L = this.poleL + this.signR; return [this.x + this.ox + (h[0] + Math.cos(a) * L) * this.face, this.y + this.oy + h[1] + Math.sin(a) * L]; }
  draw(cx, cy) {
    const X = this.x + this.ox - cx, Y = this.y + this.oy - cy, f = this.face;
    const walk = this.walk; const lp = walk ? Math.sin(walk) : 0;
    const breath = this.pose === 'idle' && Math.sin(this.t * 0.05) > 0.6 ? 1 : 0;
    this.drawSmears(cx, cy);
    if (this.flash > 0 && (this.flash | 0) % 3 !== 2) SIL = '#ffffff';
    R.begin(X, Y, f, this.sx, this.sy, this.rot, 0, -14);
    // ---- behind: scarf, back leg, back arm (+ weapon when shouldered)
    const sc = this.scarf;
    for (let i = 0; i + 1 < sc.length; i++) R.wline(sc[i].x - cx, sc[i].y - cy, sc[i + 1].x - cx, sc[i + 1].y - cy, i % 3 === 2 ? PC.scarf2 : PC.scarf, i < 4 ? 3 : i < 7 ? 2 : 1);
    R.rect(-6 - lp * 2, -8 - Math.max(0, lp) * 2, 3, 8, PC.leg); R.rect(-7 - lp * 2, -2 - Math.max(0, lp) * 2, 6, 2, PC.leg);
    const behind = Math.cos(this.wAng) < -0.1 || (Math.sin(this.wAng) < -0.3 && Math.cos(this.wAng) < 0.25);
    if (behind) { this.weapon(cx, cy, breath); const h = this.handLocal(this.wAng); R.line(-4, -14 + breath, h[0] - 2, h[1] + breath, PC.leg, 3); }
    R.flush(OUT);
    // ---- body
    R.rect(-11, -24 + breath, 22, 16, PC.body); R.ell(0.5, -24 + breath, 11, 9.5, PC.body);
    R.rect(3 + lp * 2, -8 - Math.max(0, -lp) * 2, 3, 8, PC.leg); R.rect(3 + lp * 2, -2 - Math.max(0, -lp) * 2, 6, 2, PC.leg);
    if (!behind) { const h = this.handLocal(this.wAng); R.line(0, -13 + breath, h[0], h[1] + breath, PC.leg, 3); }
    const aa = this.ant, ax0 = -4, ay0 = -32 + breath;
    R.line(ax0, ay0, ax0 + Math.sin(aa) * 8, ay0 - Math.cos(aa) * 8, PC.dark, 1);
    R.flush(OUT);
    // details
    const b = breath;
    R.drect(-11, -12 + b, 22, 3, PC.skirt); R.drect(-11, -9 + b, 22, 1, PC.shade2);
    R.drect(6, -24 + b, 4, 12, PC.shade); R.drect(8, -21 + b, 2, 8, PC.shade2);
    R.drect(-10, -24 + b, 2, 10, PC.hi); R.px(-7, -30 + b, PC.hi); R.px(-6, -31 + b, PC.hi); R.px(-5, -32 + b, PC.hi); R.px(-8, -29 + b, PC.hi);
    for (let i = 0; i < 3; i++) R.drect(-7 + i * 2.5, -16 + b, 1, 3, PC.shade2);
    R.drect(-11, -13 + b, 22, 1, PC.shade2);
    // wakaba (beginner) sticker + LED
    R.dpoly([-9, -21 + b, -7, -19 + b, -7, -16 + b, -9, -18 + b], '#ffd23f'); R.dpoly([-5, -21 + b, -7, -19 + b, -7, -16 + b, -5, -18 + b], '#2fb05a');
    R.px(-3, -22 + b, (this.t % 50) < 25 ? PC.led : '#9a2a3a');
    // antenna tip
    const tip = R.tx(ax0 + Math.sin(aa) * 8.5 + 0.5, ay0 - Math.cos(aa) * 8.5 + 0.5); const tipx = tip[0], tipy = tip[1];
    ellipseF(tipx - 0.5, tipy - 0.5, 1.5, 1.5, (this.t % 60) < 30 ? PC.led : '#ff99aa');
    // eye
    const ex = 5 + this.look, ey = -20 + b; const dead = this.dead;
    R.dell(ex, ey, 6.5, 6.5, PC.sock);
    const ec = dead ? '#4a4658' : this.eyeRed > 0 ? '#ff4d5a' : PC.eye;
    if ((this.blink > 0 && !dead) || (dead && (this.t % 24) < 3)) R.drect(ex - 5, ey - 0.5, 10, 2, ec);
    else {
      R.dell(ex, ey, 4.8, 4.8, ec); R.dell(ex, ey + 1.5, 4, 3, dead ? '#3a3648' : PC.eye2); R.dell(ex, ey, 2.3, 2.3, dead ? '#3a3648' : '#fff3b0');
      R.drect(ex - 3, ey - 3, 2, 2, '#ffffff'); R.px(ex + 2, ey + 2, '#ffffff');
      if (this.pose !== 'idle' && this.pose !== 'win' && this.pose !== 'dead' && this.pose !== 'hurt') { R.drect(ex - 5, ey - 5, 10, 2, PC.sock); R.drect(ex - 5, ey - 3, 3, 1, PC.sock); }
    }
    if (!behind) { this.weapon(cx, cy, breath); R.flush(OUT); }
    SIL = null;
    if (!dead) { const e = R.tx(ex, ey); const night = PSTAGE && PSTAGE.key === 'night'; glow(e[0], e[1], night ? 16 : 9, '#ffd23f', night ? 0.5 : 0.22); glow(tipx, tipy, 6, '#ff4d6d', 0.35); }
  }
  weapon(cx, cy, b) {
    const L = this.poleL, rS = this.signR;
    const h = this.handLocal(this.wAng); const hp = R.tx(h[0], h[1] + b); const hx = hp[0], hy = hp[1];
    const a = this.wAng + this.rot; const dx = Math.cos(a) * this.face, dy = Math.sin(a); const qx = -dy, qy = dx;
    const bx = hx - dx * 3, by = hy - dy * 3, tx = hx + dx * L, ty = hy + dy * L;
    R.wline(bx, by, tx, ty, PC.pole, 2);
    const cx0 = tx + dx * rS * 0.95, cy0 = ty + dy * rS * 0.95;
    const tri = r => [cx0 - dx * r, cy0 - dy * r, cx0 + dx * r * 0.5 + qx * r * 0.95, cy0 + dy * r * 0.5 + qy * r * 0.95, cx0 + dx * r * 0.5 - qx * r * 0.95, cy0 + dy * r * 0.5 - qy * r * 0.95];
    R.wpoly(tri(rS + 1.5), '#fbf7f0');
    R.L.push({ t: 3, p: tri(rS - 0.6), c: '#e0415a', o: false });
    for (const k of [1.3, 3.6]) R.L.push({ t: 2, x0: cx0 + dx * k - qx * rS * 0.38, y0: cy0 + dy * k - qy * rS * 0.38, x1: cx0 + dx * k + qx * rS * 0.38, y1: cy0 + dy * k + qy * rS * 0.38, c: '#fbf7f0', th: 1, o: false });
    R.L.push({ t: 2, x0: bx + qx * 0.7, y0: by + qy * 0.7, x1: tx - dx + qx * 0.7, y1: ty - dy + qy * 0.7, c: '#d5dae3', th: 1, o: false });
    this._sign = [cx0, cy0];
  }
  drawSmears(cx, cy) {
    const L = this.poleL + this.signR * 2 + 4; const rim = '#ff8fa6';
    const list = this.smears.slice().sort((a, b) => b.t - a.t);
    for (const s of list) {
      const u = s.t / 6; const X = s.x - cx, Y = s.y - cy;
      const h1 = this.handLocal(s.a1); const px0 = X + h1[0] * this.face, py0 = Y + h1[1];
      if (Math.abs(s.a1 - s.a0) < 0.05) continue;
      const outer = L + (s.heavy ? 5 : 2) - u * 3, inner = lerp(L * (s.heavy ? 0.4 : 0.55), outer - 2, easeIn(u));
      if (outer - inner < 1) continue;
      polyF(arcPts(px0, py0, inner, outer, s.a0, s.a1, this.face), rim);
      const i2 = inner + (outer - inner) * 0.22, o2 = outer - 1.5;
      if (o2 - i2 >= 1) polyF(arcPts(px0, py0, i2, o2, s.a0, s.a1, this.face), u < 0.35 ? '#ffffff' : '#ffe9ef');
    }
  }
}

// ------------------------------------------------------------ enemies
// every draw fn gets (e, X, Y, t): X,Y = feet centre in lo coords; enemies face left (f = -1)
const EDRAW = {};
function eStateCol(e) { return e.stopped ? 0.35 : 0; }

EDRAW.mw = (e, X, Y, t) => {
  const open = e.pose === 'atk', wind = e.pose === 'buff', f = -1;
  const hop = e.pose === 'atk' ? -Math.sin(clamp(e.pt / 18, 0, 1) * Math.PI) * 8 : 0;
  R.begin(X, Y + hop, f, e.sx, e.sy, e.pose === 'hurt' ? -0.2 : 0, 0, -12);
  R.rect(-12, -5, 4, 5, tint('#4b4658')); R.rect(7, -5, 4, 5, tint('#4b4658')); R.rect(-13, -2, 6, 2, tint('#4b4658')); R.rect(6, -2, 6, 2, tint('#4b4658'));
  R.rect(-17, -27, 34, 22, tint('#dcd6c8'));
  if (open) R.poly([1, -26, 18, -34, 20, -30, 5, -24], tint('#bfb8a8'));
  R.flush(OUT);
  const B = tint('#dcd6c8');
  R.drect(-17, -27, 34, 2, tint('#f4efe4')); R.drect(-17, -7, 34, 2, tint('#a8a090')); R.drect(15, -25, 2, 18, tint('#bfb8a8'));
  // door / window
  if (open) { R.drect(-15, -24, 17, 17, '#1d1a2a'); for (let i = 0; i < 6; i++) { R.dpoly([-15 + i * 3, -24, -12 + i * 3, -24, -13.5 + i * 3, -21], '#f4f2ee'); R.dpoly([-15 + i * 3, -7, -12 + i * 3, -7, -13.5 + i * 3, -10], '#f4f2ee'); } R.dell(-6.5, -15, 5, 2, '#ff8a3c'); R.drect(-9, -16, 5, 1, '#fff3b0'); }
  else {
    R.drect(-15, -24, 17, 16, tint('#3a3444')); const gl = wind ? '#ff8a3c' : e.hp < e.maxhp * 0.5 ? '#8a5a44' : '#6b5a52';
    R.drect(-13, -22, 13, 12, tint(gl)); R.drect(-13, -22, 13, 1, tint(mix(gl, '#ffffff', 0.3))); R.dline(-12, -21, -8, -17, tint('#ffffff'));
    R.drect(3, -24, 1, 16, tint('#b8b0a0')); R.drect(1, -18, 2, 5, tint('#9a9284'));
  }
  // control panel with LED "face"
  R.drect(5, -24, 9, 16, tint('#c4bdae')); R.drect(6, -23, 7, 5, '#1d1a2a');
  const angry = wind || open || e.intent && e.intent.type === 'atk';
  const ec = e.stopped ? '#6a6a78' : angry ? '#ff4d5a' : '#7dff9a';
  if (angry) { R.px(7, -22, ec); R.px(8, -21, ec); R.px(11, -22, ec); R.px(10, -21, ec); } else { R.drect(7, -21, 2, 1, ec); R.drect(10, -21, 2, 1, ec); }
  R.dell(9.5, -14, 2, 2, tint('#6d6577')); R.dline(9.5, -14, 9.5 + Math.cos(t * 0.1) * 1.5, -14 + Math.sin(t * 0.1) * 1.5, tint('#e8e2d6'));
  R.drect(7, -10, 5, 1, tint('#6d6577'));
  for (let k = 0; k < 4; k++) R.px(-16 + hash2(k, e.uid) * 30, -26 + hash2(e.uid, k) * 18, tint('#a88a7c'));
  e._eye = R.tx(9.5, -21).slice();
};
EDRAW.cone = (e, X, Y, t) => {
  const hop = Math.abs(Math.sin(t * 0.08 + e.uid)) * (e.pose === 'atk' ? 6 : 1.5);
  R.begin(X, Y - hop, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.25 : Math.sin(t * 0.05 + e.uid) * 0.05, 0, -8);
  R.poly([-7, 0, -2, -19, 2, -19, 7, 0], tint('#f07a3a')); R.rect(-9, -2, 18, 3, tint('#e0602a'));
  R.flush(OUT);
  R.drect(-4.5, -11, 9, 3, tint('#f4f0e6')); R.drect(-3, -16, 6, 2, tint('#f4f0e6')); R.dline(-1, -18, -5, -2, tint('#ffb07a'));
  const ec = e.stopped ? '#6a6a78' : OUT; R.drect(-3, -8, 2, 2, ec); R.drect(1, -8, 2, 2, ec);
  if (e.intent && e.intent.type === 'atk') { R.px(-3, -9, OUT); R.px(2, -9, OUT); }
  e._eye = R.tx(0, -8).slice();
};
EDRAW.fan = (e, X, Y, t) => {
  const hy = -30 + Math.sin(t * 0.06 + e.uid) * 3; const cxp = X, cyp = Y + hy;
  const bladeV = e.pose === 'atk' || e.intent && e.intent.type === 'atk' ? 0.8 : 0.35; e._blade = (e._blade || 0) + (e.stopped ? 0.02 : bladeV);
  // cable
  for (let i = 0; i < 5; i++) lineF(cxp + Math.sin(t * 0.05 + i) * i * 0.6, cyp + 13 + i * 3, cxp + Math.sin(t * 0.05 + i + 1) * (i + 1) * 0.6, cyp + 16 + i * 3, OUT, 2);
  R.begin(cxp, cyp, -1, e.sx, e.sy, e.pose === 'hurt' ? 0.3 : Math.sin(t * 0.04) * 0.06, 0, 0);
  R.ell(0, 0, 14, 14, tint('#cfd6dc')); R.rect(-4, -18, 8, 5, tint('#9aa3ad'));
  R.flush(OUT);
  R.dell(0, 0, 12.5, 12.5, tint('#6d7a86'));
  for (let i = 0; i < 3; i++) { const a = e._blade + i * TAU / 3; R.dell(Math.cos(a) * 6.5, Math.sin(a) * 6.5, 4.5, 4.5, tint(e.intent && e.intent.type === 'debuff' ? '#e8d8ff' : '#e6ecf0')); R.dell(Math.cos(a) * 6.5 - 1, Math.sin(a) * 6.5 - 1, 2, 2, tint('#ffffff')); }
  for (let k = -12; k <= 12; k += 4) R.dline(k, -Math.sqrt(Math.max(0, 169 - k * k)), k, Math.sqrt(Math.max(0, 169 - k * k)), tint('#b8c2ca'));
  const ec = e.stopped ? '#6a6a78' : e.intent && e.intent.type === 'atk' ? '#ff5fa2' : '#ffd23f';
  R.dell(0, 0, 4, 4, tint('#4b4658')); R.dell(0, 0, 2, 2, ec); R.px(-1, -1, '#ffffff'); R.px(0, -18, '#ff4d5a');
  e._eye = [cxp, cyp]; e._cy = cyp;
};
EDRAW.drum = (e, X, Y, t) => {
  const col = e.variant ? '#4f7fb8' : '#b8634f'; const rev = e.intent && e.intent.type === 'charge';
  const wob = rev ? Math.sin(t * 0.6) * 0.08 : 0; const roll = e.pose === 'atk' ? Math.sin(clamp(e.pt / 20, 0, 1) * Math.PI) : 0;
  R.begin(X - roll * 30, Y, 1, e.sx, e.sy, wob + (e.pose === 'atk' ? -roll * 1.4 : 0) + (e.pose === 'hurt' ? 0.2 : 0), 0, -15);
  const C = tint(col), CL = tint(mix(col, '#ffffff', 0.35)), CD = tint(mix(col, '#000000', 0.3)), CDD = tint(mix(col, '#000000', 0.5));
  R.rect(-12, -28, 24, 26, C); R.ell(0, -28, 12, 3, C); R.ell(0, -2, 12, 3, C);
  R.flush(OUT);
  R.drect(-11, -28, 4, 26, CL); R.drect(-7, -28, 2, 26, tint(mix(col, '#ffffff', 0.15))); R.drect(5, -28, 3, 26, CD); R.drect(8, -28, 4, 26, CDD);
  R.dell(0, -28, 11, 2, tint(mix(col, '#ffffff', 0.5))); R.dell(4, -28, 2, 1, tint('#3a3444'));
  for (const ry of [-20, -10]) { R.drect(-12, ry, 24, 1, CDD); R.drect(-12, ry - 1, 24, 1, CL); }
  R.dpoly([0.5, -17, 4.5, -14.5, 0.5, -12, -3.5, -14.5], tint('#f2c14e')); R.px(0, -15, OUT);
  const ec = e.stopped ? '#6a6a78' : rev ? '#ff4d5a' : '#ffd23f';
  R.drect(-7, -25, 10, 3, OUT); R.drect(-6, -24.5, 7, 1.5, ec);
  for (let k = 0; k < 5; k++) R.px(-10 + hash2(k, e.uid) * 20, -8 + hash2(e.uid, k) * 6, tint('#8a4a2a'));
  if (rev && (t | 0) % 6 < 3) Fx.smoke(e.x + rnd(-8, 8), e.y - 30, 1, 0.4, '#d8d8d8');
  e._eye = R.tx(-1, -24).slice();
};
EDRAW.cam = (e, X, Y, t) => {
  const top = Y - 44; rectF(X - 2, top + 4, 4, 44, OUT); rectF(X - 1, top + 4, 2, 44, tint('#8d98a3')); rectF(X - 6, Y - 3, 12, 3, OUT);
  const aim = e.intent && e.intent.type === 'charge'; const ang = Math.PI + (aim ? 0.18 : 0.1 + Math.sin(t * 0.02) * 0.25);
  R.begin(X, top + 2, 1, e.sx, e.sy, ang, 0, 0);
  R.rect(-5, -4, 16, 8, tint('#e6e2d8')); R.rect(11, -3, 3, 6, tint('#3a3444')); R.rect(-8, -3, 4, 6, tint('#b8b0a0'));
  R.flush(OUT);
  R.drect(-5, -4, 16, 1, tint('#ffffff')); R.drect(-5, 3, 16, 1, tint('#b3ab9b'));
  const lens = e.stopped ? '#4a4a58' : aim ? '#ff3a6a' : '#6fe0ff'; R.drect(12, -2, 2, 4, lens); R.px(0, -2, (t | 0) % 40 < 20 ? '#ff4d5a' : '#6a2030');
  e._eye = R.tx(13, 0).slice(); e._aim = ang;
};
EDRAW.vend = (e, X, Y, t) => {
  const col = e.variant === 1 ? '#3f78c2' : e.variant === 2 ? '#e8e2d4' : '#d4524e'; const B = tint(col);
  const ch = e.intent && e.intent.type === 'charge';
  const step = Math.sin(t * 0.05) * (e.pose === 'idle' ? 0.5 : 0);
  R.begin(X + (e.pose === 'atk' ? -Math.sin(clamp(e.pt / 22, 0, 1) * Math.PI) * 26 : 0), Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.1 : ch ? Math.sin(t * 0.8) * 0.02 : 0, 0, -30);
  R.rect(-15, -7, 8, 7, tint('#4b4658')); R.rect(7, -7, 8, 7, tint('#4b4658'));
  R.rect(-20, -62, 40, 55, B);
  const armA = e.pose === 'atk' ? 1.1 : ch ? -2.2 : 0.95 + Math.sin(t * 0.06) * 0.1;
  const sh = [17, -44], hand = [sh[0] + Math.cos(armA) * 16, sh[1] + Math.sin(armA) * 16];
  R.line(sh[0], sh[1], hand[0], hand[1], tint('#6d6577'), 5); R.ell(hand[0], hand[1], 4.5, 4.5, tint('#8d8699'));
  R.flush(OUT);
  const lit = PSTAGE && PSTAGE.key !== 'day';
  R.drect(-17, -58, 24, 22, lit ? '#e8f6ff' : tint('#b9cedd')); R.drect(-17, -58, 24, 1, tint('#ffffff'));
  const cols = ['#e8534f', '#4f8fe8', '#f2c14e', '#6ac47a', '#ffffff'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { R.drect(-16 + i * 4.6, -57 + r * 7, 3, 5, tint(cols[(i + r) % 5])); R.px(-16 + i * 4.6, -57 + r * 7, '#ffffff'); R.drect(-16 + i * 4.6, -52 + r * 7, 3, 1, tint('#8a8a96')); }
  R.drect(-17, -34, 24, 4, tint(mix(col, '#000000', 0.35))); R.drect(-16, -33, 22, 1, OUT);
  R.drect(10, -57, 8, 13, tint(mix(col, '#000000', 0.2))); R.px(13, -54, ch && (t | 0) % 6 < 3 ? '#ff4d5a' : '#6ac47a'); R.drect(11, -49, 5, 1, OUT); R.drect(11, -47, 5, 1, OUT);
  R.drect(-17, -22, 24, 8, OUT); R.drect(-16, -21, 22, 5, tint(mix(col, '#000000', 0.5)));
  R.drect(-20, -62, 40, 3, tint(mix(col, '#ffffff', 0.35))); R.drect(16, -62, 4, 55, tint(mix(col, '#000000', 0.25)));
  const ec = e.stopped ? '#6a6a78' : ch || e.pose === 'atk' ? '#ff3a4a' : '#ffd23f';
  R.drect(-18, -68, 34, 7, tint('#4b4658')); R.drect(-9, -66, 18, 3, OUT); R.drect(-8, -65.5, 7, 2, ec); R.drect(2, -65.5, 5, 2, ec);
  for (let k = 0; k < 8; k++) R.px(-18 + hash2(k, e.uid) * 34, -58 + hash2(e.uid, k) * 48, tint('#a4643a'));
  if (e.hp < e.maxhp * 0.5) { R.dline(-12, -48, -5, -38, OUT); R.dline(-5, -38, -8, -30, OUT); }
  e._eye = R.tx(-4, -64).slice(); e._glowFront = R.tx(-5, -46).slice();
};
EDRAW.roller = (e, X, Y, t) => {
  const f = -1; const drumR = 20; const rollA = (e._roll = (e._roll || 0) + (e.pose === 'atk' ? 0.25 : 0.01));
  const ch = e.intent && e.intent.type === 'charge'; const shake = ch ? Math.sin(t * 1.3) * 0.6 : 0;
  const lunge = e.pose === 'atk' ? -Math.sin(clamp(e.pt / 26, 0, 1) * Math.PI) * 34 : 0;
  const Bc = tint('#e3b23c'), Bd = tint('#b88a24'), Bh = tint('#f6d67a'), stl = tint('#6d7380'), stlD = tint('#474b58'), dk = tint('#2e2c3a');
  R.begin(X + lunge + shake, Y, f, e.sx, e.sy, 0, 0, -30);
  // rear wheels + body + cab + front drum
  R.ell(34, -12, 12, 12, stlD); R.rect(-8, -44, 56, 30, Bc); R.rect(10, -76, 34, 34, Bc); R.rect(6, -80, 42, 6, stlD);
  R.rect(-40, -44, 38, 14, Bd); R.ell(-26, -20, drumR, drumR, stl);
  R.rect(40, -64, 6, 22, stl);
  R.flush(OUT);
  // drum stripes (rotating)
  for (let i = 0; i < 6; i++) { const a = rollA + i * TAU / 6; const yy = -20 + Math.sin(a) * drumR * 0.9; if (Math.cos(a) > 0) R.drect(-44, yy, 36, 1, stlD); }
  R.dell(-26, -20, 5, 5, stlD); R.dell(-26, -20, 2, 2, dk); R.drect(-44, -40, 36, 2, tint('#9aa0ad'));
  R.dell(34, -12, 5, 5, stl); R.dell(34, -12, 2, 2, dk);
  // hazard stripes & body details
  for (let i = -38; i < -4; i += 6) R.dpoly([i, -44, i + 3, -44, i + 6, -38, i + 3, -38], dk);
  R.drect(-8, -44, 56, 2, Bh); R.drect(-8, -18, 56, 3, Bd); for (let i = 0; i < 7; i++) R.px(-4 + i * 8, -40, Bd);
  // cab window with eyes
  R.drect(13, -72, 28, 16, dk); R.drect(14, -71, 26, 1, tint('#4a4e64'));
  const ec = e.stopped ? '#5a5a68' : ch ? '#ff4d3a' : '#ffd23f';
  R.dell(20, -63, 3.5, 3, ec); R.dell(33, -63, 3.5, 3, ec); R.px(19, -64, '#ffffff'); R.px(32, -64, '#ffffff');
  if (ch || e.phase === 2) { R.dline(16, -68, 23, -66, dk); R.dline(37, -68, 30, -66, dk); }
  R.drect(40, -84, 6, 4, stlD); // exhaust cap
  const on = (t | 0) % 30 < 15; R.drect(24, -84, 6, 4, on ? '#ff8a3a' : tint('#7a4a2a'));
  for (let k = 0; k < 8; k++) R.px(-4 + hash2(k, 7) * 50, -42 + hash2(7, k) * 24, tint('#a4643a'));
  if ((t | 0) % 7 === 0) Fx.smoke(e.x - 43 * f * -1 + (lunge ? lunge : 0) * -1 * 0, e.y - 86, 1, 0.7, PSTAGE && PSTAGE.key === 'night' ? '#3a3e62' : '#9a9aa0');
  e._eye = R.tx(26, -63).slice(); e._warn = R.tx(27, -82).slice();
};

// generic fallback so new enemy types always render something
function drawEnemyGeneric(e, X, Y) { R.begin(X, Y, -1, e.sx, e.sy); R.rect(-e.w / 2, -e.h, e.w, e.h, tint('#9aa0ad')); R.flush(OUT); R.drect(-4, -e.h + 6, 8, 4, '#ffd23f'); e._eye = R.tx(0, -e.h + 8).slice(); }
