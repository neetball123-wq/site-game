'use strict';
// ============================================================
//  enemies: junk appliances gone feral + the Demolisher
// ============================================================
function tint(c) {
  const k = ROOM ? ROOM.st.key : 'day';
  if (k === 'night') return mix(c, '#1c2046', 0.38);
  if (k === 'dusk') return mix(c, '#b4607c', 0.14);
  return c;
}
const ETYPES = {
  mw: { w: 14, h: 12, hp: 30, kb: 1, poise: 0, scrap: 3, meter: 8, size: 1 },
  fan: { w: 14, h: 14, hp: 24, kb: 1.1, poise: 0, scrap: 3, meter: 8, size: 1, fly: true },
  drum: { w: 12, h: 15, hp: 24, kb: 0.8, poise: 0, scrap: 3, meter: 8, size: 1 },
  cam: { w: 12, h: 10, hp: 40, kb: 0, poise: 0, scrap: 4, meter: 10, size: 1, fixed: true },
  vend: { w: 24, h: 36, hp: 250, kb: 0.22, poise: 70, scrap: 18, meter: 25, size: 3, elite: true },
  boss: { w: 64, h: 92, hp: 1700, kb: 0, poise: 9999, scrap: 60, meter: 0, size: 6, fixed: true, boss: true },
};
let EID = 1;
class Enemy {
  constructor(kind, x, y, lvl, mode = 'drop') {
    const T = ETYPES[kind]; this.kind = kind; this.T = T; this.id = EID++;
    this.x = x; this.y = y; this.w = T.w; this.h = T.h; this.vx = 0; this.vy = 0; this.facing = -1;
    this.maxhp = this.hp = Math.round(T.hp * lvl.hp); this.dmgMul = lvl.dmg; this.spd = lvl.spd;
    this.state = 'idle'; this.st = 0; this.cd = rnd(30, 90); this.flash = 0; this.stun = 0; this.onGround = false; this.dead = false;
    this.poise = T.poise; this.armor = false; this.burn = 0; this.burnT = 0; this.showHp = 0; this.sx = 1; this.sy = 1; this.rot = 0; this.t = rnd(100);
    this.spawnMode = mode; this.spawnT = 1; this.falling = mode === 'drop';
    if (mode === 'drop') { this.y = Cam.y - 30 - rnd(0, 60); this.targetY = y; this.warn = 0; }
    else if (mode === 'fly') { this.spawnT = 30; }
    else if (mode === 'boot') { this.spawnT = 40; }
    else this.spawnT = 0;
    if (this.init) this.init();
  }
  box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  get P() { return Game.player; }
  dist() { return Math.abs(this.P.x - this.x); }
  face() { this.facing = sgn(this.P.x - this.x) || this.facing; }
  hitP(b, d) { if (overlap(b, this.P.box())) return this.P.damage(Math.round(d * this.dmgMul), this.x); return false; }
  update(ts) {
    this.t += ts; this.flash = Math.max(0, this.flash - ts); this.showHp = Math.max(0, this.showHp - ts);
    if (this.spawnMode === 'drop' && this.falling) {
      this.vy = Math.min(this.vy + 0.35 * ts, 7); this.y += this.vy * ts; this.warn += ts;
      if (this.y >= this.targetY) { this.y = this.targetY; this.falling = false; this.vy = 0; this.onGround = true; this.spawnT = 16; this.sy = 0.55; this.sx = 1.4;
        Fx.dust(this.x, this.y, 6, 1.2); Fx.flatRing(this.x, this.y, 3, 18, 12, '#ffffff'); Cam.shake(0.12 * this.T.size); Snd.play('spawn', { x: this.x }); }
      return;
    }
    if (this.spawnT > 0) { this.spawnT -= ts; this.animSquash(ts); if (this.fixed()) return; this.physics(ts); return; }
    if (this.burn > 0) { this.burn -= ts; this.burnT += ts; if (this.burnT > 30) { this.burnT = 0; Game.hitEnemy(this, { dmg: 3, kbx: 0, kby: 0, stop: 0, dir: 0, x: this.x, y: this.y - this.h / 2, src: 'burn' }); } if (Math.random() < 0.3) Fx.fire(this.x + rnd(-this.w / 3, this.w / 3), this.y - rnd(0, this.h), 1, 0.7); }
    if (this.stun > 0) {
      this.stun -= ts;
      if (!this.T.fly || this.falling2) { this.vy = Math.min(this.vy + 0.3 * (this.onGround ? 1 : 0.8) * ts, 6); }
      else { this.vy *= Math.pow(0.85, ts); }
      if (this.onGround) this.vx = approach(this.vx, 0, 0.25 * ts); else this.vx *= Math.pow(0.97, ts);
      const vx0 = this.vx; this.physics(ts, true);
      if (this.hitWall && Math.abs(vx0) > 3.2) { this.vx = -vx0 * 0.4; Fx.sparks(this.x + sgn(vx0) * this.w / 2, this.y - this.h / 2, 5, -sgn(vx0)); Fx.dust(this.x + sgn(vx0) * this.w / 2, this.y - this.h / 2, 3); Cam.shake(0.15); Snd.play('hit', { x: this.x, p: 0.5, pitch: 0.7 }); this.hp -= 4; Fx.num(this.x, this.y - this.h - 4, 4, false, '#ffb0b0'); if (this.hp <= 0) this.die(); }
      this.animSquash(ts);
      return;
    }
    this.ai(ts);
    this.animSquash(ts);
  }
  fixed() { return this.T.fixed; }
  physics(ts, stunned) {
    if (this.T.fixed) return;
    if (this.T.fly && !stunned) { this.x += this.vx * ts; this.y += this.vy * ts; this.x = clamp(this.x, 20, ROOM.pw - 20); this.y = clamp(this.y, 30, ROOM.ph - 30); return; }
    const vy0 = this.vy; moveBody(this, ts, { step: true });
    if (this.justLanded && vy0 > 2) { this.sy = 0.7; this.sx = 1.3; Fx.dust(this.x, this.y, 3, 0.8); if (stunned && vy0 > 3.5) { this.vy = -vy0 * 0.35; this.onGround = false; Cam.shake(0.08); } }
  }
  animSquash(ts) { this.sy = lerp(this.sy, 1, 0.2 * ts); this.sx = lerp(this.sx, 1, 0.2 * ts); }
  onHit(h) { }
  die() {
    if (this.dead) return; this.dead = true;
    const s = this.T.size, x = this.x, y = this.y - this.h / 2;
    Snd.play('explode', { x, p: Math.min(1, 0.35 + s * 0.2) });
    Fx.ring(x, y, 3, 16 + s * 8, 14, '#ffffff', 3); Fx.star(x, y, 10 + s * 3, '#fff6d0', 6);
    for (let i = 0; i < 6 + s * 4; i++) Fx.scrapChunk(x + rnd(-this.w / 2, this.w / 2), y + rnd(-this.h / 3, this.h / 3));
    Fx.sparks(x, y, 10 + s * 4, 0, '#ffd27a', 1.2); Fx.smoke(x, y, 4 + s * 2, 0.8 + s * 0.3); Fx.fire(x, y, 4 + s * 2, 1);
    Fx.glowP(x, y, 30 + s * 10, '#ffb060', 14);
    Cam.shake(0.18 + s * 0.08);
    Game.onEnemyDeath(this);
  }
  // ---- default draw helpers
  drawShadow(cx, cy) {
    if (this.T.fixed && this.kind !== 'boss') return;
    const gy = groundBelow(this.x, this.y - 1, 160); if (gy == null) return;
    const d = gy - this.y; const s = clamp(1 - d / 120, 0.2, 1);
    ditherEllipse(this.x - cx, gy - cy, this.w * 0.55 * s, 1.6 * s, '#000000', 0.35 * s);
  }
  drawWarn(cx, cy) {
    if (this.spawnMode === 'drop' && this.falling) {
      const x = this.x - cx, y = this.targetY - cy; const on = (this.warn | 0) % 8 < 5;
      if (on) { polyF([x - 4, y - 8, x + 4, y - 8, x, y - 3], ROOM.st.accent); rectF(x - 5, y - 1, 10, 1, ROOM.st.accent); }
      ditherEllipse(x, y, this.w * 0.6, 2, '#000000', clamp(this.warn / 40, 0.1, 0.5));
    }
  }
  drawHp(cx, cy) {
    if (this.showHp <= 0 || this.T.boss) return;
    const w = Math.max(12, this.w + 4), x = Math.round(this.x - cx - w / 2), y = Math.round(this.y - cy - this.h - 7);
    rectF(x - 1, y - 1, w + 2, 4, OUT); rectF(x, y, w, 2, '#3a3550'); rectF(x, y, Math.max(0, w * this.hp / this.maxhp), 2, '#ff5d73');
  }
  exclaim(cx, cy, col = '#ff4d5a') {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy - this.h - 10 - (this.st < 4 ? 2 : 0));
    rectF(x - 2, y - 1, 5, 9, OUT); rectF(x - 1, y, 3, 5, col); rectF(x - 1, y + 6, 3, 1, col);
  }
  draw(cx, cy) {
    this.drawWarn(cx, cy);
    if (this.falling) { SIL = null; }
    const jit = (Scr.hitstop > 0 && this.flash > 0) ? (Math.random() < 0.5 ? -1 : 1) : 0;
    if (this.flash > 0 && (this.flash | 0) % 3 !== 2) SIL = '#ffffff';
    this.render(this.x - cx + jit, this.y - cy);
    SIL = null;
  }
}

// ------------------------------------------------------------ microwave
class MW extends Enemy {
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts;
    this.gravity(ts);
    switch (this.state) {
      case 'idle': case 'walk':
        this.face(); this.state = 'walk';
        if (this.onGround) {
          this.hopT = (this.hopT || 0) + ts;
          if (this.hopT > 18) { this.hopT = 0; this.vy = -1.6; this.vx = this.facing * 1.1 * this.spd; this.onGround = false; this.sy = 1.2; this.sx = 0.85; }
          else this.vx = approach(this.vx, 0, 0.15 * ts);
        }
        if (this.cd <= 0 && this.dist() < 62 && Math.abs(P.y - this.y) < 24 && this.onGround) { this.state = 'wind'; this.st = 0; this.vx = 0; Snd.play('beep', { x: this.x, pitch: 1.2 }); }
        break;
      case 'wind':
        this.sy = 0.84 + Math.sin(this.st * 1.5) * 0.04; this.face();
        if (this.st > 24 / this.spd) { this.state = 'lunge'; this.st = 0; this.vx = this.facing * 3.8; this.vy = -3.3; this.onGround = false; Snd.play('swing', { x: this.x, p: 0.3, pitch: 1.4 }); }
        break;
      case 'lunge':
        this.hitP({ x: this.x - 8 + this.facing * 4, y: this.y - 12, w: 16, h: 12 }, 12);
        if (this.onGround && this.st > 4) { this.state = 'rec'; this.st = 0; this.vx = 0; Fx.dust(this.x, this.y, 3); }
        break;
      case 'rec': this.vx = approach(this.vx, 0, 0.3 * ts); if (this.st > 34) { this.state = 'walk'; this.cd = rnd(40, 90); } break;
    }
    const vx0 = this.vx; this.physics(ts);
    if (this.hitWall && this.state === 'walk') { this.vy = -5.4; this.vx = vx0; this.onGround = false; this.hopT = -20; this.sy = 1.3; this.sx = 0.8; }
  }
  gravity(ts) { this.vy = Math.min(this.vy + 0.3 * ts, 6); }
  render(X, Y) {
    const f = this.facing, open = this.state === 'lunge', wind = this.state === 'wind';
    const bob = this.onGround && this.state === 'walk' ? 0 : 0;
    R.begin(X, Y, f, this.sx, this.sy, this.stun > 0 ? -0.25 : 0, 0, -6);
    const hop = !this.onGround;
    R.rect(-5, -3, 2, 3 - (hop ? 1 : 0), tint('#4b4658')); R.rect(3, -3, 2, 3 - (hop ? 1 : 0), tint('#4b4658'));
    R.rect(-7, -12 + bob, 14, 10, tint('#dcd6c8'));
    if (open) R.poly([1, -12, 9, -17, 10, -15, 3, -11], tint('#bfb8a8'));
    R.flush(OUT);
    // door / window (front side)
    const glowC = wind || open ? '#ff8a3c' : '#6b5a52';
    if (open) { R.drect(-6, -11, 8, 8, '#1d1a2a'); for (let i = 0; i < 4; i++) { R.px(-5 + i * 2, -11, '#f4f2ee'); R.px(-4 + i * 2, -4, '#f4f2ee'); } R.drect(-4, -7, 4, 1, '#ff8a3c'); }
    else { R.drect(-6, -11, 8, 7, tint('#3a3444')); R.drect(-5, -10, 6, 5, tint(glowC)); R.px(-5, -10, '#ffffff'); R.drect(1, -11, 1, 7, tint('#b8b0a0')); }
    R.drect(3, -11, 3, 8, tint('#c4bdae'));
    const eyeC = wind || open ? '#ff4d5a' : '#ffd23f';
    R.px(3, -10, eyeC); R.px(5, -10, eyeC);
    R.px(4, -7, tint('#6d6577')); R.px(4, -5, tint('#6d6577'));
    R.drect(-7, -12, 14, 1, tint('#f4efe4')); R.drect(-7, -3, 14, 1, tint('#a8a090'));
    if (this.t % 200 < 100) R.px(-6, -3, tint('#a88a7c'));
    if (wind) this._g = [X + 4 * f, Y - 10];
  }
  drawGlow(cx, cy) { if (this.state === 'wind' || this.state === 'lunge') glow(this.x - cx - this.facing * 2, this.y - cy - 7, 14, '#ff8a3c', 0.5); else if (ROOM.st.key === 'night') glow(this.x - cx + this.facing * 4, this.y - cy - 10, 6, '#ffd23f', 0.4); }
}

// ------------------------------------------------------------ fan drone
class FAN extends Enemy {
  init() { this.side = Math.random() < 0.5 ? -1 : 1; this.blade = 0; this.bladeV = 0.4; this.cable = []; for (let i = 0; i < 5; i++) this.cable.push({ x: this.x, y: this.y + i * 2, px: this.x, py: this.y + i * 2 }); if (this.spawnMode === 'drop') { this.spawnMode = 'fly'; this.falling = false; this.y = this.targetY - 50; this.x = Cam.x + (this.x < Cam.x + W / 2 ? -20 : W + 20); this.spawnT = 30; } }
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts;
    if (Math.abs(P.x - this.x) > 130) this.side = sgn(this.x - P.x) || 1;
    const tx = P.x + this.side * 72, ty = P.y - 52 + Math.sin(this.t * 0.05) * 8;
    const acc = this.state === 'wind' ? 0.02 : 0.06;
    this.vx = clamp(this.vx + clamp(tx - this.x, -1, 1) * acc * ts, -1.5, 1.5); this.vy = clamp(this.vy + clamp(ty - this.y, -1, 1) * acc * ts, -1.2, 1.2);
    this.vx *= Math.pow(0.95, ts); this.vy *= Math.pow(0.95, ts);
    this.face();
    if (this.state === 'idle' && this.cd <= 0) { this.state = 'wind'; this.st = 0; Snd.play('laserCharge', { x: this.x }); }
    if (this.state === 'wind' && this.st > 38 / this.spd) {
      this.state = 'idle'; this.cd = rnd(130, 190) / this.spd;
      const a0 = Math.atan2(P.y - 8 - this.y, P.x - this.x);
      for (let i = -1; i <= 1; i++) { const a = a0 + i * 0.28; Game.projs.push({ kind: 'orb', owner: 'enemy', x: this.x + Math.cos(a) * 8, y: this.y + Math.sin(a) * 8, vx: Math.cos(a) * 1.9, vy: Math.sin(a) * 1.9, r: 3, dmg: 10 * this.dmgMul, life: 220, reflect: true, c: '#ff5fa2' }); }
      this.vx -= Math.cos(a0) * 1.5; this.vy -= Math.sin(a0) * 1.5; Snd.play('orb', { x: this.x });
    }
    this.physics(ts);
  }
  update(ts) {
    if (this.spawnMode === 'fly' && this.spawnT > 0) { this.spawnT -= ts; this.x = lerp(this.x, this.P.x + (this.x < this.P.x ? -72 : 72), 0.05); this.y = lerp(this.y, this.P.y - 52, 0.05); }
    else super.update(ts);
    if (this.stun > 0) this.vy += 0.05 * ts;
    this.bladeV = lerp(this.bladeV, this.state === 'wind' ? 1.4 : this.stun > 0 ? 0.1 : 0.45, 0.1); this.blade += this.bladeV * ts;
    this.rot = lerp(this.rot, clamp(this.vx * 0.15, -0.4, 0.4) * this.facing, 0.1);
    const c = this.cable; c[0].x = this.x; c[0].y = this.y + 7;
    for (let i = 1; i < c.length; i++) { const p = c[i]; const vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 0.2; }
    for (let k = 0; k < 2; k++) for (let i = 1; i < c.length; i++) { const a = c[i - 1], b = c[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; const df = (d - 2.4) / d; b.x -= dx * df; b.y -= dy * df; }
  }
  physics(ts, stunned) {
    if (stunned) { this.x += this.vx * ts; this.y += this.vy * ts; this.x = clamp(this.x, 20, ROOM.pw - 20); if (this.y > ROOM.ground[Math.floor(this.x / TILE)] * TILE - 10) { this.y = ROOM.ground[Math.floor(this.x / TILE)] * TILE - 10; this.vy = -Math.abs(this.vy) * 0.5; } return; }
    super.physics(ts);
  }
  box() { return { x: this.x - 7, y: this.y - 7, w: 14, h: 14 }; }
  drawShadow(cx, cy) { const gy = groundBelow(this.x, this.y, 200); if (gy == null) return; const d = gy - this.y; const s = clamp(1 - d / 140, 0.2, 1); ditherEllipse(this.x - cx, gy - cy, 7 * s, 1.5, '#000000', 0.3 * s); }
  render(X, Y) {
    const f = this.facing;
    const cx = Math.round(X), cy = Math.round(Y);
    R.begin(cx, cy, 1, 1, 1, 0, 0, 0);
    const c = this.cable; for (let i = 0; i + 1 < c.length; i++) R.wline(c[i].x - (this.x - X), c[i].y - (this.y - Y), c[i + 1].x - (this.x - X), c[i + 1].y - (this.y - Y), tint('#4b4658'), 1);
    R.ell(0, 0, 7.5, 7.5, tint('#cfd6dc'));
    R.flush(OUT);
    R.dell(0, 0, 6.5, 6.5, tint('#7d8a96'));
    for (let i = 0; i < 3; i++) { const a = this.blade + i * TAU / 3; const bx = Math.cos(a) * 3.5, by = Math.sin(a) * 3.5; R.dell(bx, by, 2.5, 2.5, tint(this.state === 'wind' ? '#f2d0dc' : '#dfe6ea')); }
    R.dell(0, 0, 2, 2, this.state === 'wind' ? '#ff5fa2' : tint('#4b4658')); R.px(0 + (f > 0 ? 0 : -1), -1, this.state === 'wind' ? '#ffffff' : '#ffd23f');
    for (let k = -6; k <= 6; k += 3) R.dline(k, -Math.sqrt(49 - k * k), k, Math.sqrt(49 - k * k), tint('#b8c2ca'));
    R.drect(-2, -9, 4, 2, tint('#9aa3ad')); R.px(-1, -10, '#ff4d5a');
  }
  drawGlow(cx, cy) { glow(this.x - cx, this.y - cy, this.state === 'wind' ? 16 + Math.sin(this.st * 0.8) * 3 : 7, this.state === 'wind' ? '#ff5fa2' : '#ffd23f', this.state === 'wind' ? 0.7 : 0.3); }
}

// ------------------------------------------------------------ oil drum roller
class DRUM extends Enemy {
  init() { this.col = Math.random() < 0.5 ? '#4f7fb8' : '#b8634f'; this.bounces = 0; }
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts;
    this.vy = Math.min(this.vy + 0.3 * ts, 6);
    switch (this.state) {
      case 'idle':
        this.vx = approach(this.vx, 0, 0.2 * ts); this.rot = lerp(this.rot, 0, 0.2);
        if (this.cd <= 0 && this.dist() < 170 && Math.abs(P.y - this.y) < 30) { this.face(); this.state = 'wind'; this.st = 0; Snd.play('beep', { x: this.x, pitch: 0.8 }); }
        break;
      case 'wind':
        this.rot = lerp(this.rot, this.facing * 0.35 + Math.sin(this.st * 1.2) * 0.12, 0.2);
        if ((this.st | 0) % 6 === 0) Fx.smoke(this.x - this.facing * 5, this.y - 14, 1, 0.4, '#d8d8d8');
        if (this.st > 34 / this.spd) { this.state = 'roll'; this.st = 0; this.bounces = 0; Snd.play('dash', { x: this.x }); }
        break;
      case 'roll':
        this.vx = this.facing * 3.3 * this.spd; this.rot += this.facing * 0.35 * ts;
        if ((this.st | 0) % 4 === 0) Fx.dust(this.x - this.facing * 5, this.y, 1, 0.6);
        this.hitP({ x: this.x - 7, y: this.y - 13, w: 14, h: 13 }, 14);
        for (const o of ROOM.objs) if (!o.dead && Math.abs(o.x - this.x) < 9 && Math.abs(o.y - this.y) < 10) hitObj(o, this.facing, 0.7);
        if (this.st > 150) { this.state = 'dizzy'; this.st = 0; }
        break;
      case 'dizzy':
        this.vx = approach(this.vx, 0, 0.12 * ts); this.rot = lerp(this.rot, Math.round(this.rot / Math.PI) * Math.PI + Math.PI / 2 * this.facing, 0.05);
        if (this.st > 70) { this.state = 'idle'; this.cd = rnd(50, 110); this.rot = 0; Fx.dust(this.x, this.y, 3); }
        break;
    }
    const vx0 = this.vx; this.physics(ts);
    if (this.state === 'roll' && this.hitWall) { this.bounces++; this.facing = -this.facing; this.vx = -vx0 * 0.6; Cam.shake(0.15); Fx.sparks(this.x - this.facing * 7, this.y - 7, 5, this.facing); Snd.play('hit', { x: this.x, p: 0.4, pitch: 0.6 }); if (this.bounces >= 2) { this.state = 'dizzy'; this.st = 0; } }
  }
  die() {
    if (this.dead) return; super.die();
    Game.explosion(this.x, this.y - 7, 36, 26, 12, this);
  }
  render(X, Y) {
    const f = this.facing; const rolling = this.state === 'roll' || this.state === 'dizzy';
    R.begin(X, Y - 7, 1, this.sx, this.sy, this.rot, 0, 0);
    const C = tint(this.col), CL = tint(mix(this.col, '#ffffff', 0.35)), CD = tint(mix(this.col, '#000000', 0.3)), CDD = tint(mix(this.col, '#000000', 0.5));
    R.rect(-6, -6, 12, 13, C); R.ell(0, -6, 6, 1.6, C); R.ell(0, 7, 6, 1.6, C);
    R.flush(OUT);
    // cylinder shading: bright stripe left, falling off to the right
    R.drect(-5, -6, 2, 13, CL); R.drect(-3, -6, 1, 13, tint(mix(this.col, '#ffffff', 0.15))); R.drect(3, -6, 1, 13, CD); R.drect(4, -6, 2, 13, CDD);
    // lid
    R.dell(0, -6, 5, 1, tint(mix(this.col, '#ffffff', 0.5))); R.px(2, -7, tint('#3a3444'));
    // raised ribs
    for (const ry of [-2, 3]) { R.drect(-6, ry, 12, 1, CDD); R.drect(-6, ry - 1, 12, 1, CL); }
    R.poly([0.5, -0.8, 2.8, 0.5, 0.5, 1.8, -1.8, 0.5], tint('#f2c14e'), false);
    const eyeC = this.state === 'wind' || this.state === 'roll' ? '#ff4d5a' : '#ffd23f';
    R.drect(-3 + (f > 0 ? 2 : -1), -5, 5, 2, OUT); R.drect(-2 + (f > 0 ? 2 : -1), -5, 3, 1, eyeC);
    for (let k = 0; k < 3; k++) R.px(-5 + k * 4, 5 + (k % 2), tint(ROOM.st.rust));
    if (this.state === 'dizzy') { const a = this.t * 0.2; for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3; px(X + Math.cos(b) * 7, Y - 20 + Math.sin(b) * 2, '#ffd23f'); } }
  }
  drawGlow(cx, cy) { if (this.state === 'wind' || this.state === 'roll') glow(this.x - cx, this.y - cy - 10, 10, '#ff4d5a', 0.45); }
}

// ------------------------------------------------------------ CCTV laser camera on a pole
class CAM extends Enemy {
  init() { this.aim = Math.PI / 2 + 0.5; this.poleH = 0; this.spawnMode = 'boot'; this.spawnT = 40; this.falling = false; this.gy = this.y; this.y = this.y - rnd(40, 54); this.beam = null; this.cd = rnd(40, 90); }
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts;
    const ta = Math.atan2(P.y - 9 - this.y + 5, P.x - this.x);
    switch (this.state) {
      case 'idle': this.aim += angDiff(this.aim, ta) * 0.03 * ts; if (this.cd <= 0) { this.state = 'aim'; this.st = 0; Snd.play('laserCharge', { x: this.x }); } break;
      case 'aim': this.aim += angDiff(this.aim, ta) * 0.08 * ts; if (this.st > 50 / this.spd) { this.state = 'lock'; this.st = 0; Snd.play('beep', { x: this.x, pitch: 1.5 }); } break;
      case 'lock': if (this.st > 14) { this.state = 'fire'; this.st = 0; Snd.play('laser', { x: this.x }); Cam.shake(0.12); } break;
      case 'fire': {
        const end = this.rayEnd(); this.beam = end;
        const d = segDist(P.x, P.y - 8, this.x + Math.cos(this.aim) * 6, this.y - 5 + Math.sin(this.aim) * 6, end[0], end[1]);
        if (d < 6) P.damage(Math.round(18 * this.dmgMul), this.x);
        if ((this.st | 0) % 2 === 0) { Fx.sparks(end[0], end[1], 2, 0, '#ff9fd0'); Fx.smoke(end[0], end[1], 1, 0.5); }
        if (this.st > 16) { this.state = 'idle'; this.cd = rnd(90, 140) / this.spd; this.beam = null; }
        break;
      }
    }
    this.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
  }
  rayEnd() { let x = this.x, y = this.y - 5; const dx = Math.cos(this.aim) * 3, dy = Math.sin(this.aim) * 3; for (let i = 0; i < 160; i++) { x += dx; y += dy; if (solidPx(x, y)) break; } return [x, y]; }
  update(ts) {
    if (this.spawnT > 0) { this.spawnT -= ts; this.poleH = lerp(this.poleH, 1, 0.1); return; }
    this.poleH = 1; super.update(ts);
  }
  drawShadow() { }
  box() { return { x: this.x - 6, y: this.y - 10, w: 12, h: 10 }; }
  render(X, Y) {
    const gyS = this.gy - (this.y - Y);
    const top = Y - 2; const pb = lerp(gyS, top, this.poleH);
    rectF(X - 2, pb, 4, gyS - pb, OUT); rectF(X - 1, pb, 2, gyS - pb, tint('#8d98a3'));
    if (this.spawnT > 0 && (this.spawnT | 0) % 4 < 2) return;
    R.begin(X, Y - 5, 1, 1, 1, this.aim, 0, 0);
    R.rect(-4, -3, 11, 6, tint('#e6e2d8')); R.rect(7, -2, 2, 4, tint('#3a3444')); R.rect(-6, -2, 3, 4, tint('#b8b0a0'));
    R.flush(OUT);
    R.drect(-4, -3, 11, 1, tint('#ffffff')); R.drect(-4, 2, 11, 1, tint('#b3ab9b'));
    const lens = this.state === 'aim' || this.state === 'lock' || this.state === 'fire' ? '#ff3a6a' : '#6fe0ff';
    R.drect(8, -1, 1, 2, lens);
    R.px(0, -1, ((this.t | 0) % 40 < 20) ? '#ff4d5a' : '#6a2030');
  }
  drawFront(cx, cy) {
    const x0 = this.x - cx + Math.cos(this.aim) * 8, y0 = this.y - 5 - cy + Math.sin(this.aim) * 8;
    if (this.state === 'aim' || this.state === 'lock') {
      const e = this.rayEnd(); const x1 = e[0] - cx, y1 = e[1] - cy; const n = Math.floor(dist(x0, y0, x1, y1) / 3);
      const on = this.state === 'lock' ? ((this.st | 0) % 4 < 2) : true;
      if (on) for (let i = 0; i < n; i++) if (this.state === 'lock' || i % 2 === ((this.t / 3) | 0) % 2) px(lerp(x0, x1, i / n), lerp(y0, y1, i / n), '#ff3a6a');
    }
    if (this.state === 'fire' && this.beam) {
      const x1 = this.beam[0] - cx, y1 = this.beam[1] - cy; const w = this.st < 3 ? 7 : Math.max(1, 5 - this.st * 0.25);
      lineF(x0, y0, x1, y1, '#ff4f9a', Math.round(w) + 2); lineF(x0, y0, x1, y1, '#ffd0e8', Math.max(1, Math.round(w) - 1)); lineF(x0, y0, x1, y1, '#ffffff', 1);
      ellipseF(x0, y0, w * 0.8, w * 0.8, '#ffffff'); ellipseF(x1, y1, w, w, '#ffd0e8');
    }
  }
  drawGlow(cx, cy) {
    const x0 = this.x - cx + Math.cos(this.aim) * 8, y0 = this.y - 5 - cy + Math.sin(this.aim) * 8;
    if (this.state === 'fire' && this.beam) { const n = 6; for (let i = 0; i <= n; i++) glow(lerp(x0, this.beam[0] - cx, i / n), lerp(y0, this.beam[1] - cy, i / n), 18, '#ff4f9a', 0.5); }
    else glow(x0, y0, 6, this.state === 'idle' ? '#6fe0ff' : '#ff3a6a', 0.5);
  }
}
function segDist(px_, py_, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0; const l2 = dx * dx + dy * dy || 1; const t = clamp(((px_ - x0) * dx + (py_ - y0) * dy) / l2, 0, 1); return Math.hypot(px_ - (x0 + dx * t), py_ - (y0 + dy * t)); }

// ------------------------------------------------------------ vending machine brute (elite)
class VEND extends Enemy {
  init() { this.col = pick(['#d4524e', '#3f78c2', '#e8e2d4']); this.face2 = -1; this.stomp = 0; this.cans = 0; }
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts; this.vy = Math.min(this.vy + 0.34 * ts, 7);
    const hurt = this.hp < this.maxhp * 0.5;
    switch (this.state) {
      case 'idle': case 'walk': {
        this.state = 'walk'; this.face(); this.armor = false;
        this.vx = approach(this.vx, this.facing * 0.55 * this.spd, 0.05 * ts);
        this.stomp += Math.abs(this.vx) * ts; if (this.stomp > 14) { this.stomp = 0; Snd.play('land', { x: this.x, p: 0.5 }); Fx.dust(this.x - this.facing * 8, this.y, 1, 0.8); Cam.shake(0.03); }
        if (this.cd <= 0) {
          const d = this.dist();
          if (d < 46) { this.state = 'slamW'; } else if (d > 110 || Math.random() < 0.5) { this.state = 'chargeW'; } else { this.state = 'tossW'; }
          this.st = 0; this.vx = 0; Snd.play('beep', { x: this.x, pitch: 0.7 });
        }
        break;
      }
      case 'chargeW':
        this.face(); if ((this.st | 0) % 12 === 0) { Fx.smoke(this.x - this.facing * 10, this.y - 30, 2, 0.6, '#e8e8e8'); Snd.play('land', { x: this.x, p: 0.6 }); Cam.shake(0.06); }
        this.sx = 1 + Math.sin(this.st) * 0.03;
        if (this.st > (hurt ? 32 : 44)) { this.state = 'charge'; this.st = 0; this.armor = true; Snd.play('roar', { x: this.x }); Cam.shake(0.2); }
        break;
      case 'charge':
        this.vx = this.facing * 4.3 * this.spd; if ((this.st | 0) % 3 === 0) Fx.dustDir(this.x - this.facing * 10, this.y, -this.facing, 2, 1);
        this.hitP({ x: this.x - 13, y: this.y - 34, w: 26, h: 34 }, 20);
        for (const o of ROOM.objs) if (!o.dead && Math.abs(o.x - this.x) < 16 && Math.abs(o.y - this.y) < 16) hitObj(o, this.facing, 1);
        if (this.st > 80) { this.state = 'rec'; this.st = 0; this.armor = false; }
        break;
      case 'stunned':
        this.vx = approach(this.vx, 0, 0.3 * ts); if (Math.random() < 0.2) Fx.sparks(this.x + rnd(-10, 10), this.y - rnd(10, 34), 1, 0);
        if (this.st > 80) { this.state = 'walk'; this.cd = rnd(40, 80); }
        break;
      case 'tossW':
        this.face(); if (this.st > 30) { this.state = 'toss'; this.st = 0; this.cans = hurt ? 5 : 3; }
        break;
      case 'toss':
        if (this.cans > 0 && (this.st | 0) % 9 === 0 && this.st > 0) {
          this.cans--; const dx = P.x - this.x + rnd(-30, 30); const t = 46; const vx = dx / t, vy = -4.4;
          Game.projs.push({ kind: 'can', owner: 'enemy', x: this.x + this.facing * 8, y: this.y - 12, vx, vy, r: 3, dmg: 10 * this.dmgMul, life: 200, g: 0.19, rot: 0, reflect: true, c: pick(['#e8534f', '#4f8fe8', '#f2c14e', '#6ac47a']) });
          Snd.play('shot', { x: this.x }); this.sx = 1.1; this.sy = 0.92;
        }
        if (this.cans <= 0 && this.st > 30) { this.state = 'rec'; this.st = 0; }
        break;
      case 'slamW': this.face(); this.sy = lerp(this.sy, 1.12, 0.1); if (this.st > 26) { this.state = 'slam'; this.st = 0; } break;
      case 'slam':
        if (this.st < 1.1) {
          this.sy = 0.72; this.sx = 1.3; Cam.shake(0.3); Scr.stop(3); Snd.play('heavy', { x: this.x, p: 0.8 });
          Fx.dust(this.x, this.y, 8, 1.4); Fx.flatRing(this.x, this.y, 5, 40, 16);
          for (const d of [-1, 1]) Game.projs.push({ kind: 'wave', owner: 'enemy', x: this.x + d * 14, y: this.y, vx: d * 3, vy: 0, r: 5, dmg: 14 * this.dmgMul, life: 55, h: 12 });
          this.hitP({ x: this.x - 22, y: this.y - 20, w: 44, h: 20 }, 16);
        }
        if (this.st > 30) { this.state = 'rec'; this.st = 0; }
        break;
      case 'rec': this.vx = approach(this.vx, 0, 0.2 * ts); if (this.st > 40) { this.state = 'walk'; this.cd = rnd(60, 120) * (hurt ? 0.6 : 1); } break;
    }
    const vx0 = this.vx; this.physics(ts);
    if (this.state === 'walk' && this.hitWall && this.onGround && Math.abs(this.P.x - this.x) > 20) {
      this.vy = -6.6; this.onGround = false; this.vx = this.facing * 1.2; this.sy = 1.3; this.sx = 0.8; Fx.dust(this.x, this.y, 5, 1.2); Snd.play('djump', { x: this.x });
    }
    if (this.state === 'walk' && !this.onGround && this.vy < 0) this.vx = this.facing * 1.2;
    if (this.state === 'charge' && this.hitWall) {
      this.state = 'stunned'; this.st = 0; this.armor = false; this.vx = -vx0 * 0.2;
      Cam.shake(0.5); Cam.kick(sgn(vx0) * 5, 0); Scr.stop(6); Snd.play('heavy', { x: this.x, p: 1 }); Fx.sparks(this.x + sgn(vx0) * 12, this.y - 20, 12, -sgn(vx0));
      Fx.bits(this.x + sgn(vx0) * 12, this.y - 20, 8, ['#d8d4c8', '#9aa0ad']); Fx.dust(this.x + sgn(vx0) * 12, this.y - 10, 6, 1.3);
      for (let i = 0; i < 3; i++) ROOM.objs.push(Object.assign(makeObj('can', this.x, this.y - 30), { vx: rnd(-2, 2), vy: rnd(-4, -2), onGround: false, vr: rnd(-0.4, 0.4) }));
    }
  }
  render(X, Y) {
    const f = this.facing, B = tint(this.col), hurt = this.hp < this.maxhp * 0.5;
    const step = this.state === 'walk' ? Math.sin(this.stomp / 14 * Math.PI) : 0;
    R.begin(X, Y, f, this.sx, this.sy, this.state === 'stunned' ? -0.12 : this.state === 'charge' ? 0.1 : 0, 0, -18);
    R.rect(-9, -4 - Math.max(0, step) * 2, 5, 4, tint('#4b4658')); R.rect(4, -4 - Math.max(0, -step) * 2, 5, 4, tint('#4b4658'));
    R.rect(-12, -38, 24, 34, B);
    const armA = this.state === 'slamW' ? -2.4 : this.state === 'slam' ? 1.2 : this.state === 'charge' ? 0.3 : this.state === 'toss' ? -0.6 + Math.sin(this.st * 0.7) : 0.9 + Math.sin(this.t * 0.08) * 0.1;
    const sh = [10, -26], hand = [sh[0] + Math.cos(armA) * 10, sh[1] + Math.sin(armA) * 10];
    R.line(sh[0], sh[1], hand[0], hand[1], tint('#6d6577'), 3); R.ell(hand[0], hand[1], 3, 3, tint('#8d8699'));
    R.flush(OUT);
    // front panel
    const lit = ROOM.st.key !== 'day' || this.state !== 'walk';
    R.drect(-10, -35, 14, 14, lit ? '#e8f6ff' : tint('#b9cedd')); R.drect(-10, -35, 14, 1, tint('#ffffff'));
    const cols = ['#e8534f', '#4f8fe8', '#f2c14e', '#6ac47a'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) R.drect(-9 + i * 3.5, -34 + r * 4.5, 2, 3, tint(cols[(i + r) % 4]));
    R.drect(-10, -20, 14, 3, tint(mix(this.col, '#000000', 0.35))); R.drect(-9, -19, 12, 1, OUT);
    R.drect(6, -34, 5, 8, tint(mix(this.col, '#000000', 0.2))); R.px(8, -32, this.state === 'chargeW' && (this.st | 0) % 6 < 3 ? '#ff4d5a' : '#6ac47a'); R.drect(7, -29, 3, 1, OUT);
    R.drect(-10, -13, 14, 5, OUT); R.drect(-9, -12, 12, 3, tint(mix(this.col, '#000000', 0.5)));
    R.drect(-12, -38, 24, 2, tint(mix(this.col, '#ffffff', 0.35))); R.drect(10, -38, 2, 34, tint(mix(this.col, '#000000', 0.25)));
    // visor eye
    const eyeC = this.state === 'chargeW' || this.state === 'charge' || this.state === 'slamW' ? '#ff3a4a' : '#ffd23f';
    R.drect(-11, -42, 20, 4, tint('#4b4658')); R.drect(-4, -41, 10, 2, OUT); R.drect(-3 + (f > 0 ? 3 : 0), -41, 4, 2, eyeC);
    for (let k = 0; k < 6; k++) R.px(-10 + hash2(k, this.id) * 20, -36 + hash2(this.id, k) * 30, tint(ROOM.st.rust));
    if (hurt) { R.dline(-8, -30, -3, -24, OUT); R.dline(-3, -24, -5, -18, OUT); if (Math.random() < 0.1) Fx.sparks(this.x + rnd(-8, 8), this.y - rnd(10, 30), 1, 0); }
    if (this.state === 'stunned') { const a = this.t * 0.2; for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3; px(X + Math.cos(b) * 10, Y - 48 + Math.sin(b) * 3, '#ffd23f'); } }
    if (this.armor && (this.t | 0) % 4 < 2) { SIL = null; }
  }
  drawGlow(cx, cy) {
    const lit = ROOM.st.key !== 'day';
    if (lit) glow(this.x - cx - this.facing * 3, this.y - cy - 28, 26, '#bfe8ff', 0.35);
    const hot = this.state === 'chargeW' || this.state === 'charge' || this.state === 'slamW';
    glow(this.x - cx + this.facing * 2, this.y - cy - 40, hot ? 16 : 8, hot ? '#ff3a4a' : '#ffd23f', hot ? 0.7 : 0.35);
  }
}

// ------------------------------------------------------------ BOSS: Demolisher
class BOSS extends Enemy {
  init() {
    this.spawnMode = 'intro'; this.spawnT = 99999; this.falling = false; this.phase = 1; this.st = 0; this.state = 'intro';
    this.arm = { x: this.x - 40, y: this.y - 60, tx: this.x - 40, ty: this.y - 60 }; this.tread = 0; this.eyeGlow = 0; this.cd = 60; this.stuck = 0;
    this.introY = -160; this.y0 = this.y; this.hurtT = 0; this.lastAtk = '';
  }
  box() { return { x: this.x - 30, y: this.y - 92, w: 60, h: 92 }; }
  eyeBox() { return { x: this.x + this.facing * 14 - 9, y: this.y - 86, w: 18, h: 16 }; }
  clawBox() { return { x: this.arm.x - 10, y: this.arm.y - 6, w: 20, h: 16 }; }
  shoulder() { return [this.x + this.facing * 6, this.y - 74]; }
  update(ts) {
    this.t += ts; this.flash = Math.max(0, this.flash - ts); this.hurtT = Math.max(0, this.hurtT - ts);
    if (this.state === 'intro') { this.updIntro(ts); this.armIK(ts); return; }
    if (this.state === 'dying') { this.updDying(ts); return; }
    if (this.burn > 0) { this.burn -= ts; this.burnT += ts; if (this.burnT > 30) { this.burnT = 0; Game.hitEnemy(this, { dmg: 3, kbx: 0, kby: 0, stop: 0, dir: 0, x: this.x, y: this.y - 50, src: 'burn' }); } }
    if (this.phase === 1 && this.hp < this.maxhp * 0.5) { this.phase = 2; this.state = 'rage'; this.st = 0; Snd.play('roar', { x: this.x }); Cam.shake(0.6); Scr.flash('#ff3050', 0.3); Music.intensity(1); }
    this.ai(ts); this.armIK(ts);
    if (this.phase === 2 && Math.random() < 0.15) { Fx.smoke(this.x + rnd(-20, 20), this.y - rnd(50, 90), 1, 0.9, '#5a5560'); if (Math.random() < 0.3) Fx.sparks(this.x + rnd(-25, 25), this.y - rnd(20, 80), 2, 0); }
    if (Math.random() < 0.25) Fx.smoke(this.x - this.facing * 22, this.y - 100, 1, 0.7, ROOM.st.key === 'night' ? '#3a3e62' : '#9a9aa0');
  }
  updIntro(ts) {
    this.st += ts;
    if (this.st < 60) { this.y = this.y0 + this.introY; return; }
    if (this.st < 80) { this.introY = Math.min(0, this.introY + 14 * ts); this.y = this.y0 + this.introY; if (this.introY >= 0 && !this.landed) { this.landed = true; Cam.shake(1); Cam.punch(0.08, 0.03); Scr.stop(8); Scr.flash('#ffffff', 0.5); Snd.play('mega', { x: this.x }); Fx.dust(this.x - 30, this.y, 14, 2); Fx.dust(this.x + 30, this.y, 14, 2); Fx.flatRing(this.x, this.y, 10, 120, 22); for (let i = 0; i < 20; i++) Fx.scrapChunk(this.x + rnd(-40, 40), this.y - 10); } return; }
    if (this.st > 110 && this.st - ts <= 110) { Snd.play('roar', { x: this.x }); Cam.shake(0.5); }
    if (this.st > 110) this.eyeGlow = Math.min(1, this.eyeGlow + 0.05 * ts);
    this.arm.tx = this.x + this.facing * 50; this.arm.ty = this.y - 120 + Math.sin(this.st * 0.1) * 6;
    if (this.st > 180) { this.state = 'idle'; this.st = 0; this.spawnT = 0; Game.bossStart(); }
  }
  armIK(ts) { const k = this.armSpd || 0.08; this.arm.x = lerp(this.arm.x, this.arm.tx, k * ts); this.arm.y = lerp(this.arm.y, this.arm.ty, k * ts); }
  ai(ts) {
    const P = this.P; this.st += ts; this.cd -= ts; const sp = this.phase === 2 ? 1.35 : 1;
    this.face();
    this.eyeGlow = lerp(this.eyeGlow, this.state === 'idle' ? 0.7 : 1, 0.1);
    switch (this.state) {
      case 'idle': case 'rage': {
        this.armSpd = 0.06;
        const tx = clamp(P.x - this.facing * 110, 80, ROOM.pw - 80);
        this.vx = approach(this.vx, clamp(tx - this.x, -1, 1) * 0.6, 0.05 * ts); this.x += this.vx * ts; this.tread += this.vx * ts;
        this.arm.tx = this.x + this.facing * 44; this.arm.ty = this.y - 104 + Math.sin(this.t * 0.05) * 5;
        if (this.state === 'rage') { if (this.st > 70) { this.state = 'idle'; this.st = 0; this.cd = 20; } break; }
        if (this.cd <= 0) {
          const opts = ['slam', 'slam', 'sweep']; if (this.hp < this.maxhp * 0.75) opts.push('missile'); if (this.phase === 2) opts.push('spawn', 'rush');
          let a = pick(opts); if (a === this.lastAtk) a = pick(opts); this.lastAtk = a;
          this.state = a; this.st = 0; this.vx = 0;
        }
        break;
      }
      case 'slam': {
        this.armSpd = 0.12;
        if (this.st < 50 / sp) { this.arm.tx = P.x; this.arm.ty = this.y - 130; this.target = P.x; }
        else if (this.st < 62 / sp) { this.arm.tx = this.target; this.arm.ty = this.y - 134; if (this.st - ts < 50 / sp) Snd.play('beep', { x: this.target, pitch: 0.6 }); }
        else if (!this.slammed) {
          this.armSpd = 0.55; this.arm.ty = this.y - 6;
          if (this.arm.y > this.y - 16) {
            this.slammed = true; this.stuck = 55 / sp; this.arm.y = this.y - 6;
            Cam.shake(0.75); Cam.kick(0, 6); Cam.punch(0.05, 0.02 * sgn(rnd(-1, 1))); Scr.stop(7); Snd.play('mega', { x: this.arm.x });
            Fx.dust(this.arm.x, this.y, 12, 1.8); Fx.flatRing(this.arm.x, this.y, 6, 70, 18); Fx.crack(this.arm.x, this.y, 12); Fx.bits(this.arm.x, this.y - 4, 12, ROOM.st.wall.slice(0, 3));
            for (const d of [-1, 1]) Game.projs.push({ kind: 'wave', owner: 'enemy', x: this.arm.x + d * 12, y: this.y, vx: d * 3.2 * sp, vy: 0, r: 5, dmg: 16 * this.dmgMul, life: 90, h: 16 });
            this.hitP(this.clawBox(), 22);
          } else this.hitP(this.clawBox(), 22);
        } else { this.stuck -= ts; if (Math.random() < 0.2) Fx.smoke(this.arm.x, this.y - 6, 1, 0.6); if (this.stuck <= 0) { this.state = 'idle'; this.st = 0; this.slammed = false; this.cd = rnd(50, 90) / sp; } }
        break;
      }
      case 'sweep': {
        this.armSpd = 0.07;
        const side = this.sweepSide || (this.sweepSide = this.facing);
        if (this.st < 46 / sp) { this.arm.tx = this.x + side * 150; this.arm.ty = this.y - 12; if ((this.st | 0) % 10 === 0) Snd.play('beep', { x: this.arm.x, pitch: 0.9 }); }
        else if (this.st < 110 / sp) {
          this.armSpd = 0.09 * sp; this.arm.tx = this.x - side * 60; this.arm.ty = this.y - 12;
          this.hitP({ x: this.arm.x - 12, y: this.arm.y - 10, w: 24, h: 16 }, 18);
          if ((this.st | 0) % 3 === 0) { Fx.dustDir(this.arm.x, this.y, -side, 2, 1.2); Fx.sparks(this.arm.x, this.y - 2, 1, -side); }
          if ((this.st | 0) % 10 === 0) Snd.play('swing', { x: this.arm.x, p: 1, pitch: 0.5 });
        } else { this.state = 'idle'; this.st = 0; this.sweepSide = 0; this.cd = rnd(40, 80) / sp; }
        break;
      }
      case 'missile': {
        this.arm.tx = this.x - this.facing * 20; this.arm.ty = this.y - 120;
        const n = this.phase === 2 ? 7 : 5;
        if (this.st > 20 && (this.st | 0) % 8 === 0 && (this.fired || 0) < n && this.st - ts < (this.st | 0) + 0.01) {
          this.fired = (this.fired || 0) + 1;
          const tx = clamp(P.x + rnd(-70, 70), 30, ROOM.pw - 30);
          Game.projs.push({ kind: 'missile', owner: 'enemy', x: this.x - this.facing * 20, y: this.y - 104, vx: rnd(-1, 1), vy: -7, r: 4, dmg: 16 * this.dmgMul, life: 400, tx, ty: ROOM.ground[Math.floor(tx / TILE)] * TILE, phase: 0, t: 0 });
          Snd.play('missile', { x: this.x }); Fx.smoke(this.x - this.facing * 20, this.y - 100, 3, 0.8);
        }
        if (this.st > 20 + n * 8 + 40) { this.state = 'idle'; this.st = 0; this.fired = 0; this.cd = rnd(60, 100) / sp; }
        break;
      }
      case 'spawn': {
        this.arm.tx = this.x + this.facing * 30; this.arm.ty = this.y - 118;
        if ((this.st | 0) === 30 || (this.st | 0) === 50) { if (!this['sp' + (this.st | 0)]) { this['sp' + (this.st | 0)] = 1; const e = Game.spawnEnemy(pick(['mw', 'drum']), clamp(P.x + rnd(-80, 80), 40, ROOM.pw - 40), 'drop'); } }
        if (this.st > 80) { this.state = 'idle'; this.st = 0; this.sp30 = this.sp50 = 0; this.cd = rnd(50, 90); }
        break;
      }
      case 'rush': {
        if (this.st < 40) { this.tread += this.facing * 0.8; if ((this.st | 0) % 5 === 0) { Fx.smoke(this.x - this.facing * 30, this.y - 6, 2, 0.8); Cam.shake(0.06); } this.rushDir = this.facing; }
        else {
          this.vx = this.rushDir * 3.6; const ox = this.x; this.x = clamp(this.x + this.vx * ts, 60, ROOM.pw - 60); this.tread += this.vx * ts;
          this.hitP(this.box(), 22); if ((this.st | 0) % 3 === 0) Fx.dustDir(this.x - this.rushDir * 30, this.y, -this.rushDir, 2, 1.4);
          this.arm.tx = this.x + this.rushDir * 60; this.arm.ty = this.y - 30;
          if (this.x === ox || this.st > 140) { this.state = 'dazed'; this.st = 0; this.vx = 0; Cam.shake(0.8); Scr.stop(8); Snd.play('mega', { x: this.x }); Fx.sparks(this.x + this.rushDir * 32, this.y - 40, 16, -this.rushDir); Fx.bits(this.x + this.rushDir * 32, this.y - 40, 14, ['#d8d4c8', '#9aa0ad']); }
        }
        break;
      }
      case 'dazed': this.arm.tx = this.x + this.facing * 30; this.arm.ty = this.y - 20; if (Math.random() < 0.3) Fx.sparks(this.x + rnd(-20, 20), this.y - rnd(40, 90), 1, 0); if (this.st > 100) { this.state = 'idle'; this.st = 0; this.cd = 40; } break;
    }
  }
  die() {
    if (this.state === 'dying') return;
    this.state = 'dying'; this.st = 0; this.hp = 0; this.spawnT = 99999;
    Scr.slow(0.3, 120); Scr.lbT = 1; Cam.punch(0.1, 0.04); Cam.hold(1.1, 150); Game.focus = { x: this.x, y: this.y - 50, t: 150 }; Snd.play('roar', { x: this.x }); Music.setSong('off');
    Game.projs = Game.projs.filter(p => p.owner !== 'enemy');
    for (const e of Game.enemies) if (e !== this && !e.dead) e.die();
  }
  updDying(ts) {
    this.st += ts; this.arm.ty = lerp(this.arm.ty, this.y - 4, 0.02); this.arm.tx = lerp(this.arm.tx, this.x + this.facing * 70, 0.02); this.armIK(ts);
    if (Math.random() < 0.25 * ts) { const x = this.x + rnd(-34, 34), y = this.y - rnd(10, 100); Fx.ring(x, y, 2, 14, 10, '#ffffff', 2); Fx.fire(x, y, 4, 1.2); Fx.sparks(x, y, 5, 0); Snd.play('explode', { x, p: 0.5, gap: 0.07 }); Cam.shake(0.25); Scr.flash('#ffffff', 0.1); }
    if (this.st > 150 && !this.boom) {
      this.boom = true; this.dead = true; Scr.flash('#ffffff', 1); Scr.inv = 4; Cam.shake(1); Cam.punch(0.14, -0.05); Scr.stop(10); Snd.play('mega', { x: this.x });
      for (let i = 0; i < 40; i++) Fx.scrapChunk(this.x + rnd(-40, 40), this.y - rnd(10, 90));
      for (let i = 0; i < 16; i++) Fx.fire(this.x + rnd(-40, 40), this.y - rnd(0, 80), 3, 1.6);
      Fx.smoke(this.x, this.y - 40, 16, 2.5); Fx.ring(this.x, this.y - 50, 10, 160, 30, '#ffffff', 4);
      Scr.lbT = 0; Game.onEnemyDeath(this);
    }
  }
  draw(cx, cy) {
    const X = Math.round(this.x - cx), Y = Math.round(this.y - cy);
    if (this.flash > 0 && (this.flash | 0) % 3 !== 2) SIL = '#ffffff';
    const f = this.facing, hurt = this.phase === 2;
    const body = tint('#d8b24a'), bodyD = tint('#a88430'), bodyH = tint('#f2d27a'), steel = tint('#6d7380'), steelD = tint('#474b58'), dark = tint('#2e2c3a');
    // treads
    R.begin(X, Y, 1);
    R.rect(-42, -24, 84, 24, steelD); R.ell(-38, -12, 12, 12, steelD); R.ell(38, -12, 12, 12, steelD);
    R.flush(OUT);
    for (let i = -44; i < 46; i += 6) { const k = ((i + this.tread * 1.2) % 6 + 6) % 6; R.drect(i + k - 3, -24, 3, 2, steel); R.drect(i + k - 3, -2, 3, 2, steel); }
    for (const wx of [-30, -10, 10, 30]) { R.dell(wx, -12, 7, 7, steel); R.dell(wx, -12, 3, 3, dark); const a = this.tread * 0.15; R.dline(wx, -12, wx + Math.cos(a) * 6, -12 + Math.sin(a) * 6, tint('#9aa0ad')); }
    // torso
    R.begin(X, Y, f);
    R.rect(-30, -84, 56, 60, body); R.rect(-34, -44, 64, 20, bodyD);
    R.rect(-26, -100, 34, 20, body); // cabin
    R.rect(-32, -110, 8, 30, steel); // exhaust
    // arm segments (world)
    const [sx0, sy0] = this.shoulder(); const sx = sx0 - cx, sy = sy0 - cy; const ax = this.arm.x - cx, ay = this.arm.y - cy;
    const L1 = 62, L2 = 60; const d = Math.min(dist(sx, sy, ax, ay), L1 + L2 - 1); const base = Math.atan2(ay - sy, ax - sx);
    const ca = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)); const e1 = base - ca * f;
    const ex = sx + Math.cos(e1) * L1, ey = sy + Math.sin(e1) * L1;
    R.wline(sx, sy, ex, ey, body, 9); R.wline(ex, ey, ax, ay, steel, 6); R.well(ex, ey, 6, 6, steelD); R.well(sx, sy, 7, 7, steelD);
    // claw (3 hooked teeth)
    const ca2 = Math.atan2(ay - ey, ax - ex); const open = this.state === 'slam' && !this.slammed ? 0.75 : this.state === 'sweep' ? 0.35 : 0.2;
    for (const s of [-1, 0, 1]) { const a = ca2 + s * open; const mx = ax + Math.cos(a) * 13, my = ay + Math.sin(a) * 13; R.wline(ax, ay, mx, my, steelD, s ? 4 : 3); R.wline(mx, my, mx + Math.cos(a - (s || 1) * 1.3) * 7, my + Math.sin(a - (s || 1) * 1.3) * 7, steelD, 3); }
    R.well(ax, ay, 7, 7, steel);
    R.flush(OUT);
    // hydraulics & arm details (no outline)
    const nx = -(ey - sy) / L1, ny = (ex - sx) / L1;
    lineF(sx + nx * 5, sy + ny * 5, lerp(sx, ex, 0.75) + nx * 5, lerp(sy, ey, 0.75) + ny * 5, tint('#b8bcc6'), 2);
    lineF(sx + nx * 5, sy + ny * 5, lerp(sx, ex, 0.45) + nx * 5, lerp(sy, ey, 0.45) + ny * 5, tint('#e8ecf2'), 1);
    lineF(sx - nx * 3, sy - ny * 3, ex - nx * 3, ey - ny * 3, bodyH, 1);
    for (const u of [0.25, 0.5, 0.75]) px(lerp(sx, ex, u) - nx * 1, lerp(sy, ey, u) - ny * 1, bodyD);
    lineF(ex, ey - 2, ax, ay - 2, tint('#9aa0ad'), 1);
    ellipseF(ex, ey, 2, 2, tint('#9aa0ad')); ellipseF(sx, sy, 2.5, 2.5, tint('#9aa0ad')); ellipseF(ax, ay, 2, 2, tint('#9aa0ad'));
    // details
    R.drect(-30, -84, 56, 2, bodyH); R.drect(22, -84, 4, 40, bodyD);
    for (let i = -32; i < 30; i += 8) R.poly([i, -44, i + 4, -44, i + 8, -38, i + 4, -38], dark, false);
    R.drect(-34, -30, 64, 2, dark);
    R.drect(-24, -98, 30, 12, dark); // cabin window
    R.dline(-20, -97, -13, -88, tint('#4a4e64')); R.dline(-16, -97, -10, -90, tint('#3e4258'));
    // hazard stripes on the tread housing
    for (let i = -34; i < 30; i += 6) R.poly([i, -30, i + 3, -30, i + 6, -26, i + 3, -26], tint('#2e2c3a'), false);
    R.drect(-34, -26, 64, 1, bodyH);
    // rivets & panel seams
    for (let i = -28; i < 24; i += 7) { R.px(i, -82, bodyD); R.px(i, -46, bodyD); }
    R.drect(-2, -84, 1, 38, bodyD);
    // headlights
    R.drect(4, -100, 4, 3, tint('#fff2c0')); R.drect(-26, -100, 3, 3, tint('#fff2c0'));
    // rust streaks
    for (let k = 0; k < 5; k++) { const rx = -26 + hash2(k, 7) * 46; R.drect(rx, -80 + hash2(7, k) * 20, 1, 6 + hash2(k, k) * 10, tint('#a4643a')); }
    const eg = this.eyeGlow; const eyeC = mix('#3a1a24', hurt ? '#ff2a3a' : '#ff4d5a', eg);
    R.dell(-2 + 8, -92, 7, 5, mix(dark, '#5a1a24', eg)); R.dell(-2 + 8, -92, 4, 3, eyeC); R.dell(-2 + 8, -92, 1.5, 1.5, eg > 0.5 ? '#ffe0e0' : eyeC);
    R.drect(-22, -97, 6, 1, tint('#6a7a9a'));
    for (let i = 0; i < 5; i++) R.drect(-26 + i * 10, -70, 6, 12, i % 2 ? tint('#4a4658') : tint('#5a5668'));
    R.drect(-26, -56, 50, 2, bodyD); for (let k = 0; k < 12; k++) R.px(-28 + hash2(k, 1) * 52, -82 + hash2(1, k) * 56, tint('#a86a3a'));
    R.drect(-32, -112, 8, 2, steelD); R.drect(-31, -110, 1, 28, tint('#8a909c'));
    // warning light on top
    const on = (this.t | 0) % 30 < 15; R.drect(-10, -104, 6, 4, on ? '#ff4d3a' : tint('#7a2a2a'));
    if (hurt) { R.dline(-20, -80, -10, -64, OUT); R.dline(-10, -64, -14, -52, OUT); R.dline(10, -70, 18, -60, OUT); }
    SIL = null;
    this._eye = [X + f * 6, Y - 92]; this._warn = [X + f * -7, Y - 102];
    // slam target marker
    if (this.state === 'slam' && !this.slammed) { const tx = this.arm.x - cx; const gy = Y; const on2 = (this.st | 0) % 6 < 3; ditherEllipse(tx, gy, 16, 3, '#000000', 0.4); if (on2) { rectF(tx - 12, gy - 1, 24, 1, ROOM.st.accent); polyF([tx - 4, gy - 10, tx + 4, gy - 10, tx, gy - 4], ROOM.st.accent); } }
    if (this.state === 'sweep' && this.st < 46) { const on2 = (this.st | 0) % 6 < 3; if (on2) { for (let k = 0; k < 3; k++) polyF([ax - 10 - k * 7 * -this.sweepSide, ay - 16, ax - 10 - k * 7 * -this.sweepSide + 5 * -this.sweepSide, ay - 12, ax - 10 - k * 7 * -this.sweepSide, ay - 8], ROOM.st.accent); } }
  }
  drawGlow(cx, cy) {
    if (this.dead || !this._eye) return;
    glow(this._eye[0], this._eye[1], 26 + Math.sin(this.t * 0.2) * 3, '#ff3a4a', 0.55 * this.eyeGlow);
    const X = Math.round(this.x - cx), Y = Math.round(this.y - cy), f = this.facing;
    if (ROOM.st.key !== 'day') { glow(X + f * 6, Y - 99, 16, '#fff2c0', 0.45); glow(X - f * 24, Y - 99, 12, '#fff2c0', 0.35); }
    if ((this.t | 0) % 30 < 15) glow(this._warn[0], this._warn[1], 14, '#ff4d3a', 0.5);
  }
  drawShadow(cx, cy) { ditherEllipse(this.x - cx, this.y - cy, 48, 3, '#000000', 0.4); }
}
const ECLASS = { mw: MW, fan: FAN, drum: DRUM, cam: CAM, vend: VEND, boss: BOSS };
function makeEnemy(kind, x, y, lvl, mode) { return new ECLASS[kind](kind, x, y, lvl, mode); }
