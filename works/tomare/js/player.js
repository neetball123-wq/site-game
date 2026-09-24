'use strict';
// ============================================================
//  player: little scrap robot with a 止まれ sign
// ============================================================
const PL = {
  spd: 2.05, accG: 0.42, decG: 0.55, accA: 0.28, decA: 0.14,
  grav: 0.33, fallMul: 1.28, maxFall: 5.8, jumpV: 5.45, djumpV: 4.9,
  coyote: 7, jbuf: 9, dashV: 5.8, dashT: 11, dashCd: 14, dashRegen: 38,
};
const PC = {
  body: '#ece6d6', shade: '#cbc2ae', hi: '#fffcf2', skirt: '#b3a993', dark: '#5a5468', leg: '#4b4658',
  eye: '#ffd23f', eye2: '#f0a020', sock: '#2d2a3c', scarf: '#e5486d', scarf2: '#a52d4f', led: '#ff4d6d', pole: '#a3a9b6', pole2: '#6f7584',
};
// attacks: angles in local facing-right space (0 = forward, -PI/2 = up)
const ATKS = {
  a1: { st: 4, ac: 4, rc: 12, pre: -2.75, a1: 1.05, dmg: 10, kb: 2.5, ky: -1.6, stop: 4, shake: 0.14, lunge: 2.6, box: [-2, -26, 32, 28], next: 'a2', sw: 0.45 },
  a2: { st: 3, ac: 4, rc: 12, pre: 1.45, a1: -2.1, dmg: 11, kb: 2.7, ky: -2.3, stop: 4, shake: 0.16, lunge: 2.6, box: [-2, -30, 32, 32], next: 'a3', sw: 0.55 },
  a3: { st: 8, ac: 5, rc: 19, pre: -3.7, a1: 1.5, dmg: 22, kb: 5.4, ky: -3.4, stop: 8, shake: 0.45, lunge: 3.6, box: [0, -30, 36, 33], heavy: true, slam: true, sw: 1 },
  up: { st: 5, ac: 5, rc: 15, pre: 1.35, a1: -2.45, dmg: 12, kb: 1.2, ky: -6.4, stop: 5, shake: 0.22, lunge: 1.2, box: [-6, -44, 30, 46], launch: true, sw: 0.7, hop: -2.6 },
  air: { st: 2, ac: 10, rc: 7, pre: -2.1, a1: -2.1 + TAU, dmg: 9, kb: 2.4, ky: -2.6, stop: 3, shake: 0.12, lunge: 0, box: [-24, -36, 48, 42], spin: true, sw: 0.5 },
  charged: { st: 4, ac: 6, rc: 22, pre: -3.8, a1: 1.55, dmg: 34, kb: 7.5, ky: -4.2, stop: 11, shake: 0.65, lunge: 5.5, box: [-2, -38, 44, 40], heavy: true, slam: true, sw: 1.3 },
};
let HITID = 1;

class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 9; this.h = 15; this.vx = 0; this.vy = 0; this.facing = 1; this.onGround = true;
    this.state = 'move'; this.st = 0; this.hp = 100; this.maxhp = 100; this.meter = 0; this.lagHp = 100;
    this.coyote = 0; this.jbuf = 0; this.abuf = 0; this.dbuf = 0; this.sbuf = 0; this.airJumps = 1; this.airDash = 1;
    this.dashMax = 1; this.dash = 1; this.dashRe = 0; this.dashCd = 0; this.iframes = 0; this.pdT = 0; this.pdUsed = false;
    this.atk = null; this.atkName = ''; this.comboT = 0; this.lastAtk = ''; this.comboBuf = false; this.airAtks = 0; this.held = false; this.chargeT = 0;
    this.sx = 1; this.sy = 1; this.sv = 0; this.rot = 0; this.flipT = 0; this.runPh = 0; this.blinkT = 150; this.blink = 0; this.ant = 0; this.antV = 0;
    this.wAng = -2.1; this.lastAng = null; this.smears = []; this.dropT = 0; this.hurtT = 0; this.stepT = 0; this.idleT = 0; this.look = 0;
    this.ammoMax = 3; this.ammo = 3; this.ammoT = 0; this.cut = false; this.dead = false; this.deadT = 0; this.eyeRed = 0; this.landT = 0;
    this.S = { dmg: 1, spd: 1, size: 0, crit: 0.06, volt: 0, blaze: 0, magnet: 0, bolt: 0, quake: 0, meterGain: 1, reflex: 0, echo: 0 };
    this.scarf = []; for (let i = 0; i < 7; i++) this.scarf.push({ x: x - i * 2, y: y - 9, px: x - i * 2, py: y - 9 });
    this.pogo = 0; this.autoWalk = 0; this.ctrl = true;
  }
  // called every tick, including hitstop / cut-in freezes, so no press is ever dropped
  readInput() {
    if (!this.ctrl || this.dead) return;
    if (In.pressed('jump')) this.jbuf = PL.jbuf;
    if (In.pressed('attack')) { this.abuf = 12; this.held = true; }
    if (In.pressed('dash')) this.dbuf = 8;
    if (In.pressed('shot')) this.sbuf = 8;
    if (!In.down('attack')) this.held = false;
  }
  get cx() { return this.x; }
  get cy() { return this.y - this.h / 2; }
  handLocal(a) { return [1.5 + Math.cos(a) * 3.4, -6.5 + Math.sin(a) * 2.4]; }

  // ---------------------------------------------------------- update
  update(ts) {
    const S = this.S;
    this.iframes = Math.max(0, this.iframes - ts); this.dashCd = Math.max(0, this.dashCd - ts); this.coyote = Math.max(0, this.coyote - ts);
    this.jbuf = Math.max(0, this.jbuf - ts); this.abuf = Math.max(0, this.abuf - ts); this.dbuf = Math.max(0, this.dbuf - ts); this.sbuf = Math.max(0, this.sbuf - ts);
    this.comboT = Math.max(0, this.comboT - ts); this.dropT = Math.max(0, this.dropT - ts); this.pdT = Math.max(0, this.pdT - ts); this.eyeRed = Math.max(0, this.eyeRed - ts);
    this.lagHp = this.lagHp > this.hp ? Math.max(this.hp, this.lagHp - 0.6 * ts) : this.hp;
    if (this.dash < this.dashMax) { this.dashRe += ts; if (this.dashRe >= PL.dashRegen) { this.dashRe = 0; this.dash++; } }
    if (this.ammo < this.ammoMax) { this.ammoT += ts; if (this.ammoT >= 52) { this.ammoT = 0; this.ammo++; } }
    const ctrl = this.ctrl && !this.dead;
    const ax = ctrl ? In.axis() : 0;
    this.readInput();
    if (this.autoWalk > 0) { this.autoWalk -= ts; this.vx = 1.4; this.facing = 1; }
    const wasGround = this.onGround;
    switch (this.state) {
      case 'move': this.updMove(ts, ax); break;
      case 'attack': this.updAttack(ts, ax); break;
      case 'charge': this.updCharge(ts, ax); break;
      case 'dash': this.updDash(ts); break;
      case 'plunge': this.updPlunge(ts); break;
      case 'land': this.st += ts; this.vx = approach(this.vx, 0, 0.5 * ts); this.gravity(ts); if (this.st > 10) this.state = 'move'; if (this.dbuf > 0) this.tryDash(ax); break;
      case 'hurt': this.st += ts; this.vx = approach(this.vx, 0, 0.12 * ts); this.gravity(ts); if (this.st > 16) this.state = 'move'; break;
      case 'dead': this.updDead(ts); break;
      case 'super': this.vx = 0; this.vy = 0; break;
    }
    if (this.state !== 'super') {
      const vy0 = this.vy;
      moveBody(this, ts, { step: true, drop: this.dropT > 0 });
      if (this.justLanded) this.onLand(vy0);
      else if (this.state === 'plunge' && this.onGround && this.st >= 7) this.onLand(8);
      if (this.onGround) { this.coyote = PL.coyote; this.airJumps = 1; this.airDash = 1; this.airAtks = 0; }
      else if (wasGround && this.vy >= 0) this.coyote = PL.coyote;
      if (this.hitWall && this.state === 'dash') { Fx.sparks(this.x + this.facing * 5, this.y - 8, 3, -this.facing); }
    }
    if (this.y > ROOM.ph + 40 && !this.dead) { this.y = ROOM.ground[Math.floor(this.x / TILE)] * TILE - 30; this.vy = 0; this.damage(10, this.x, true); }
    this.animate(ts, ax);
  }
  gravity(ts, mul = 1) {
    let g = PL.grav * mul; if (this.vy > 0) g *= PL.fallMul;
    if (Math.abs(this.vy) < 0.9 && In.down('jump') && this.state === 'move') g *= 0.55;
    this.vy = Math.min(this.vy + g * ts, PL.maxFall);
  }
  updMove(ts, ax) {
    const spd = PL.spd * this.S.spd;
    if (ax) {
      if (this.onGround && sgn(this.vx) === -ax && Math.abs(this.vx) > 1.3) { Fx.dustDir(this.x, this.y, -ax, 3, 0.8); this.sx = 1.25; this.sy = 0.85; }
      this.vx = approach(this.vx, ax * spd, (this.onGround ? PL.accG : PL.accA) * ts); this.facing = ax;
    } else this.vx = approach(this.vx, 0, (this.onGround ? PL.decG : PL.decA) * ts);
    // jumping
    if (this.jbuf > 0) {
      const onOneWay = this.onGround && this.standingOneWay();
      if (In.down('down') && onOneWay) { this.dropT = 12; this.y += 1; this.onGround = false; this.jbuf = 0; }
      else if (this.onGround || this.coyote > 0) this.doJump();
      else if (this.airJumps > 0) this.doDJump();
    }
    if (this.cut === false && !this.onGround && this.vy < -2 && !In.down('jump')) { this.vy = -2; this.cut = true; }
    this.gravity(ts);
    if (this.dbuf > 0 && this.tryDash(ax)) return;
    if (this.abuf > 0) { this.chooseAttack(ax); if (this.state !== 'move') return; }
    if (this.sbuf > 0) this.shoot();
  }
  standingOneWay() { const ty = Math.floor((this.y + 1) / TILE); return tileAt(Math.floor(this.x / TILE), ty) === 2; }
  doJump() {
    this.vy = -PL.jumpV; this.onGround = false; this.coyote = 0; this.jbuf = 0; this.cut = false;
    this.sy = 1.35; this.sx = 0.72; this.sv = 0; Fx.dust(this.x, this.y, 3, 0.8); Snd.play('jump', { x: this.x });
  }
  doDJump() {
    this.vy = -PL.djumpV; this.airJumps--; this.jbuf = 0; this.cut = false; this.flipT = 18;
    this.sy = 1.3; this.sx = 0.75;
    for (let i = 0; i < 5; i++) Fx.add({ k: 'fire', x: this.x + rnd(-2, 2), y: this.y, vx: rnd(-0.6, 0.6), vy: rnd(0.8, 2), r: rnd(1.5, 2.5), life: rndi(8, 14) });
    Fx.flatRing(this.x, this.y + 1, 2, 12, 14, '#ffffff'); Fx.smoke(this.x, this.y + 2, 2, 0.6);
    Snd.play('djump', { x: this.x });
  }
  tryDash(ax) {
    if (this.dash <= 0 || this.dashCd > 0 || (!this.onGround && this.airDash <= 0)) return false;
    const dir = ax || this.facing; this.facing = dir;
    this.state = 'dash'; this.st = 0; this.vx = dir * PL.dashV; this.vy = 0; this.dash--; this.dbuf = 0; this.dashRe = Math.min(this.dashRe, 0);
    if (!this.onGround) this.airDash--;
    this.iframes = Math.max(this.iframes, 12); this.pdT = 9 + this.S.reflex * 3; this.pdUsed = false;
    this.sx = 1.4; this.sy = 0.7; this.flipT = 0;
    Fx.dustDir(this.x, this.y, -dir, 5, 1); Snd.play('dash', { x: this.x });
    Fx.flatRing(this.x - dir * 4, this.y - 7, 3, 10, 10, '#ffffff');
    return true;
  }
  updDash(ts) {
    this.st += ts; this.vy = 0;
    this.vx = this.facing * PL.dashV * (this.st < 8 ? 1 : 0.8);
    if (Math.floor(this.st) !== Math.floor(this.st - ts) && Math.floor(this.st) % 3 === 1) this.afterimage(this.pdUsed ? '#ffd23f' : (Math.floor(this.st) % 6 === 1 ? '#7fe0ff' : '#b58cff'));
    if (Math.random() < 0.6) Fx.streak(this.x - this.facing * rnd(4, 10), this.y - rnd(2, 14), this.facing * 3, 0, 2, '#ffffff', 5);
    if (this.S.reflex) for (const e of Game.enemies) if (!e.dead && !e.dashHit && overlap(this.box(), e.box())) { e.dashHit = true; Game.hitEnemy(e, { dmg: 8 * this.S.reflex, kbx: this.facing * 1.5, kby: -1, stop: 2, dir: this.facing, x: e.x, y: e.y - e.h / 2, src: 'dash' }); }
    if (this.st >= PL.dashT) { this.state = 'move'; this.vx *= 0.42; this.dashCd = PL.dashCd; for (const e of Game.enemies) e.dashHit = false; if (this.abuf > 0) this.chooseAttack(In.axis()); }
    else if (this.st > 5 && this.abuf > 0) { this.state = 'move'; this.vx *= 0.6; this.chooseAttack(In.axis()); }
    else if (this.st > 4 && this.jbuf > 0 && (this.onGround || this.coyote > 0)) { this.state = 'move'; this.doJump(); this.vx *= 0.9; }
  }
  chooseAttack(ax) {
    this.abuf = 0;
    if (!this.onGround) {
      if (In.down('down')) { this.startPlunge(); return; }
      if (this.airAtks < 2) { this.airAtks++; this.startAtk('air', ax); }
      return;
    }
    if (In.down('up')) { this.startAtk('up', ax); return; }
    let n = 'a1';
    if (this.comboT > 0 && this.lastAtk === 'a1') n = 'a2'; else if (this.comboT > 0 && this.lastAtk === 'a2') n = 'a3';
    this.startAtk(n, ax);
  }
  startAtk(name, ax) {
    const A = ATKS[name]; if (ax) this.facing = ax;
    if (this.wAng > Math.PI + 0.5) this.wAng -= TAU; if (this.wAng < -Math.PI - 0.5) this.wAng += TAU;
    this.startAng = this.wAng;
    this.state = 'attack'; this.atk = A; this.atkName = name; this.st = 0; this.atkId = HITID++; this.hitSet = new Set(); this.comboBuf = false;
    this.lastAng = null; this.connected = false; this.chargeOK = this.held && (name === 'a1' || name === 'a2' || name === 'a3');
    if (A.hop) { this.vy = A.hop; this.onGround = false; }
    if (name === 'air') this.vy = Math.min(this.vy, -1.2);
  }
  atkSpeed() { return 1 + (this.S.spd - 1) * 0.8; }
  updAttack(ts, ax) {
    const A = this.atk, sp = this.atkSpeed(); this.st += ts * sp;
    const t = this.st, end1 = A.st, end2 = A.st + A.ac, end3 = A.st + A.ac + A.rc;
    // movement during attack
    if (t < end2) { if (A.lunge && this.onGround) this.vx = approach(this.vx, this.facing * A.lunge * (t < end1 ? 0.25 : 1), 0.8 * ts); }
    else this.vx = approach(this.vx, 0, (this.onGround ? 0.35 : 0.08) * ts);
    if (!this.onGround && ax) this.vx = approach(this.vx, ax * PL.spd * 0.8, 0.15 * ts);
    this.gravity(ts, this.atkName === 'air' ? 0.45 : 1);
    if (this.atkName === 'air' && this.vy > 1.2) this.vy = 1.2;
    // weapon angle
    if (t < end1) { const u = easeOut(t / end1); this.wAng = lerp(this.startAng, A.pre, u); }
    else if (t < end2) {
      const u = (t - end1) / A.ac; const e = 1 - Math.pow(1 - u, 3);
      this.wAng = lerp(A.pre, A.a1, e);
      if (this.lastAng == null) { this.lastAng = A.pre; Snd.play('swing', { x: this.x, p: A.sw, pitch: A.heavy ? 0.75 : rnd(0.95, 1.1) }); if (A.heavy) { this.sx = 1.25; this.sy = 0.8; } }
      this.smears.push({ a0: this.lastAng, a1: this.wAng, t: 0, x: this.x, y: this.y, f: this.facing, heavy: A.heavy, spin: A.spin });
      this.lastAng = this.wAng;
      this.doHits(A);
    } else {
      const u = clamp((t - end2) / A.rc, 0, 1);
      const over = A.spin ? 0 : sgn(A.a1 - A.pre) * 0.25 * Math.sin(u * Math.PI);
      this.wAng = lerp(A.a1 + over, A.spin ? -2.1 + TAU : A.a1, u * 0.3);
      if (A.slam && t - ts * sp < end2 && this.onGround) this.slamFx(A);
      // cancels
      if (this.abuf > 0 && t > end2 + 2) this.comboBuf = true;
      if (this.chargeOK && this.held && this.onGround && t > end2 + 1) { this.state = 'charge'; this.chargeT = 0; this.st = 0; Snd.play('charge', { x: this.x }); return; }
      if (this.comboBuf && t > end2 + 3 && A.next && this.onGround) { this.lastAtk = this.atkName; this.startAtk(A.next, In.axis()); return; }
      if (this.dbuf > 0 && this.tryDash(ax)) return;
      if (this.jbuf > 0 && t > end2 + 2 && (this.onGround || this.coyote > 0)) { this.state = 'move'; this.doJump(); return; }
      if (this.sbuf > 0 && t > end2 + 2) this.shoot();
      if (t >= end3) { this.state = 'move'; this.lastAtk = this.atkName; this.comboT = 16; if (this.abuf > 0) this.chooseAttack(ax); }
    }
    if (this.atkName === 'air' && this.onGround && t > end1) { this.state = 'move'; this.lastAtk = ''; }
  }
  slamFx(A) {
    const tipX = this.x + this.facing * (18 + this.S.size * 2), y = this.y;
    Fx.dustDir(tipX, y, 1, 4, 1.1); Fx.dustDir(tipX, y, -1, 4, 1.1); Fx.crack(tipX, y, 5 + (A === ATKS.charged ? 4 : 0));
    Fx.bits(tipX, y - 2, 5, ROOM.st.wall.slice(0, 3));
    Cam.shake(A === ATKS.charged ? 0.5 : 0.28); Cam.kick(0, 3);
    Snd.play('heavy', { x: tipX, p: 0.6 });
    if (A === ATKS.charged) { Fx.shock(tipX, y, 1, 40, '#ffffff'); Fx.flatRing(tipX, y, 4, 36, 16, '#ffffff'); }
  }
  atkBox(A) {
    const [dx, dy, w, h] = A.box; const sz = this.S.size * 2;
    const x0 = this.facing > 0 ? this.x + dx : this.x - dx - w - sz; return { x: x0, y: this.y + dy - sz * 0.5, w: w + sz, h: h + sz * 0.5 };
  }
  doHits(A) {
    const b = this.atkBox(A);
    let hitAny = false;
    for (const e of Game.enemies) {
      if (e.dead || e.spawnT > 0 || this.hitSet.has(e)) continue;
      if (!overlap(b, e.box())) continue;
      this.hitSet.add(e); hitAny = true;
      const hx = clamp(this.x + this.facing * 14, e.x - e.w / 2, e.x + e.w / 2), hy = clamp(this.y - 10, e.y - e.h, e.y);
      const dir = A.spin ? sgn(e.x - this.x) || this.facing : this.facing;
      Game.hitEnemy(e, { dmg: A.dmg, kbx: dir * A.kb, kby: A.ky, stop: A.stop, shake: A.shake, heavy: A.heavy, dir, x: hx, y: hy, src: 'melee', launch: A.launch, atk: this.atkName });
    }
    for (const o of ROOM.objs) { if (o.dead || this.hitSet.has(o)) continue; if (overlap(b, { x: o.x - o.w / 2, y: o.y - o.h, w: o.w, h: o.h })) { this.hitSet.add(o); hitObj(o, this.facing, A.heavy ? 1 : 0.4); } }
    for (const p of Game.projs) {
      if (p.owner !== 'enemy' || !p.reflect || this.hitSet.has(p)) continue;
      if (overlap(b, { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 })) {
        this.hitSet.add(p); p.owner = 'player'; const sp = Math.hypot(p.vx, p.vy) * 1.8 + 1;
        const tgt = Game.nearestEnemy(p.x, p.y); let a = this.facing > 0 ? 0 : Math.PI; if (tgt) a = Math.atan2(tgt.y - tgt.h / 2 - p.y, tgt.x - p.x);
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.dmg = 16 * this.S.dmg; p.c = '#8ff0ff'; p.life += 60; p.reflected = true;
        Fx.star(p.x, p.y, 9, '#ffffff', 6); Snd.play('reflect', { x: p.x }); Scr.stop(3); Game.addMeter(6);
      }
    }
    if (hitAny && !this.connected) { this.connected = true; if (this.atkName === 'air') this.vy = Math.min(this.vy, -1.6); }
  }
  updCharge(ts, ax) {
    this.st += ts; this.chargeT += ts; this.vx = approach(this.vx, 0, 0.4 * ts); this.gravity(ts);
    if (ax) this.facing = ax;
    this.wAng = lerp(this.wAng, -3.0, 0.2);
    const full = this.chargeT >= 26;
    if (Math.random() < 0.5) { const a = rnd(TAU), r = rnd(14, 24); const hx = this.x + this.facing * 2, hy = this.y - 12; Fx.add({ k: 'spark', x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r, vx: -Math.cos(a) * 1.6, vy: -Math.sin(a) * 1.6, life: 10, c: full ? '#ffd23f' : '#ffffff', g: 0 }); }
    if (full && !this.chargeFull) { this.chargeFull = true; Snd.play('ding', { x: this.x }); Fx.star(this.x - this.facing * 8, this.y - 26, 10, '#ffffff', 8); Scr.flash('#ffffff', 0.25); }
    if (!In.down('attack')) {
      const wasFull = this.chargeFull; this.chargeFull = false;
      if (wasFull) { if (this.meter >= 100 && typeof Game.startSuper === 'function') { Game.startSuper(); return; } this.startAtk('charged', 0); }
      else { this.state = 'move'; }
      return;
    }
    if (this.dbuf > 0) { this.chargeFull = false; this.tryDash(ax); }
  }
  startPlunge() { this.state = 'plunge'; this.st = 0; this.vy = -1.4; this.vx *= 0.3; this.atkId = HITID++; this.hitSet = new Set(); this.sx = 0.85; this.sy = 1.2; Snd.play('whoosh', { x: this.x, p: 0.3 }); }
  updPlunge(ts) {
    this.st += ts;
    if (this.st < 7) { this.vy = approach(this.vy, 0, 0.3 * ts); this.wAng = lerp(this.wAng, -1.57 - 0.6, 0.35); return; }
    this.vy = 8.6; this.vx = approach(this.vx, 0, 0.2 * ts); this.wAng = lerp(this.wAng, 1.57, 0.5);
    if ((this.st | 0) % 2 === 0) this.afterimage('#ffffff');
    const b = { x: this.x - 9, y: this.y - 6, w: 18, h: 16 };
    if (Game.superPlunge) return;
    for (const e of Game.enemies) {
      if (e.dead || e.spawnT > 0 || this.hitSet.has(e)) continue;
      if (overlap(b, e.box())) {
        this.hitSet.add(e);
        Game.hitEnemy(e, { dmg: 14, kbx: sgn(e.x - this.x) * 1.5, kby: 2.5, stop: 5, shake: 0.25, dir: this.facing, x: this.x, y: this.y, src: 'plunge', heavy: true });
        this.vy = -5.9; this.state = 'move'; this.airJumps = 1; this.airDash = 1; this.airAtks = 0; this.flipT = 18; this.cut = true;
        Fx.flatRing(this.x, this.y + 2, 3, 16, 12, '#ffffff'); Snd.play('djump', { x: this.x });
        return;
      }
    }
    for (const o of ROOM.objs) if (!o.dead && overlap(b, { x: o.x - o.w / 2, y: o.y - o.h, w: o.w, h: o.h })) hitObj(o, sgn(o.x - this.x) || 1, 1);
  }
  onLand(vy) {
    this.cut = false;
    if (this.state === 'plunge' && this.st >= 7) {
      this.state = 'land'; this.st = 0; this.sx = 1.5; this.sy = 0.6; this.vx = 0;
      const R0 = 40 + this.S.quake * 14;
      Fx.dustDir(this.x, this.y, 1, 7, 1.3); Fx.dustDir(this.x, this.y, -1, 7, 1.3); Fx.crack(this.x, this.y, 7);
      Fx.flatRing(this.x, this.y, 4, R0, 16, '#ffffff'); Fx.shock(this.x, this.y, 0, R0, '#ffffff'); Fx.bits(this.x, this.y - 2, 8, ROOM.st.wall.slice(0, 3));
      Cam.shake(0.42); Cam.kick(0, 4); Cam.punch(0.04); Scr.stop(5); Snd.play('heavy', { x: this.x, p: 1 });
      for (const e of Game.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        if (Math.abs(e.x - this.x) < R0 + e.w / 2 && Math.abs(e.y - this.y) < 28) Game.hitEnemy(e, { dmg: 16, kbx: sgn(e.x - this.x || 1) * 3, kby: -3.6, stop: 5, dir: sgn(e.x - this.x || 1), x: e.x, y: e.y - 4, src: 'plunge', heavy: true, launch: true });
      }
      for (const o of ROOM.objs) if (!o.dead && Math.abs(o.x - this.x) < R0) hitObj(o, sgn(o.x - this.x) || 1, 1);
      if (this.S.volt) Game.chainVolt(this.x, this.y - 8, 2 + this.S.volt, 10 * this.S.volt);
      return;
    }
    const p = clamp((vy - 2) / 4, 0, 1);
    this.sy = 1 - 0.3 * (0.4 + p * 0.6); this.sx = 1 + 0.35 * (0.4 + p * 0.6); this.sv = 0;
    Fx.dust(this.x - 3, this.y, 2 + Math.round(p * 3), 0.7 + p * 0.5); Fx.dust(this.x + 3, this.y, 2 + Math.round(p * 3), 0.7 + p * 0.5);
    Snd.play('land', { x: this.x, p });
    if (p > 0.8) { Cam.shake(0.1); if (this.S.quake) { Fx.flatRing(this.x, this.y, 3, 28, 12, '#ffffff'); for (const e of Game.enemies) if (!e.dead && Math.abs(e.x - this.x) < 34 && Math.abs(e.y - this.y) < 20) Game.hitEnemy(e, { dmg: 8 * this.S.quake, kbx: sgn(e.x - this.x || 1) * 2, kby: -2.5, stop: 3, dir: 1, x: e.x, y: e.y - 4, src: 'quake' }); } }
  }
  shoot() {
    if (this.ammo <= 0) { this.sbuf = 0; return; }
    this.sbuf = 0; this.ammo--; this.ammoT = 0;
    const n = 1 + this.S.bolt * 2; const hx = this.x + this.facing * 6, hy = this.y - 9;
    for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.18; Game.projs.push({ kind: 'bolt', owner: 'player', x: hx, y: hy, vx: Math.cos(a) * 6.8 * this.facing, vy: Math.sin(a) * 6.8 - 0.3, r: 3, dmg: 6 * this.S.dmg, life: 70, rot: 0, g: 0.05 }); }
    this.vx -= this.facing * 0.7; this.sx = 0.85; this.sy = 1.1;
    Fx.star(hx + this.facing * 3, hy, 5, '#fff2c0', 4); Snd.play('shot', { x: this.x });
  }
  afterimage(c) {
    const snap = { x: this.x, y: this.y, facing: this.facing, sx: this.sx, sy: this.sy, rot: this.rot, wAng: this.wAng, runPh: this.runPh, onGround: this.onGround, blink: 0, state: this.state, vy: this.vy, vx: this.vx, S: this.S, snap: true, scarf: this.scarf.map(p => ({ x: p.x, y: p.y })) };
    Fx.after((cx, cy) => this.draw(cx, cy, snap), 12, c);
  }
  damage(d, srcX, force) {
    if (this.dead || this.state === 'super' || Game.superT >= 0) return false;
    if (!force && this.iframes > 0) {
      if (this.state === 'dash' && this.pdT > 0 && !this.pdUsed) this.perfectDodge();
      return false;
    }
    this.hp -= d; this.iframes = 70; this.eyeRed = 30;
    const dir = sgn(this.x - srcX) || -this.facing;
    this.state = 'hurt'; this.st = 0; this.vx = dir * 3.2; this.vy = -3; this.onGround = false; this.facing = -dir;
    Scr.stop(7); Cam.shake(0.45); Cam.kick(dir * 4, 0); Scr.flash('#ff3050', 0.3); Snd.play('hurt', { x: this.x });
    Fx.sparks(this.x, this.y - 8, 8, dir, '#ffe0a0'); Fx.bits(this.x, this.y - 8, 4, ['#ece6d6', '#6d6577']);
    Game.combo = 0;
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    return true;
  }
  perfectDodge() {
    this.pdUsed = true; Scr.slow(0.25, 40 + this.S.reflex * 20); Scr.flash('#8fd8ff', 0.25); Snd.play('perfect');
    Fx.ring(this.x, this.y - 8, 4, 30, 16, '#bff0ff', 2); Game.addMeter(18); this.iframes = Math.max(this.iframes, 30);
    this.dash = Math.min(this.dashMax, this.dash + 1);
  }
  die() {
    this.dead = true; this.state = 'dead'; this.st = 0; this.vy = -4.5; this.vx = -this.facing * 1.8; this.ctrl = false;
    Scr.slow(0.2, 90); Cam.punch(0.12, 0.05 * this.facing); Cam.hold(1.18, 100); Game.focus = { x: this.x, y: this.y - 10, t: 100 }; Scr.flash('#ffffff', 0.6); Snd.play('death');
    Fx.bits(this.x, this.y - 8, 10, ['#ece6d6', '#6d6577', '#e5486d', '#ffd23f']);
    Game.onPlayerDeath();
  }
  updDead(ts) {
    this.st += ts; this.gravity(ts); this.vx = approach(this.vx, 0, (this.onGround ? 0.2 : 0.02) * ts);
    if (!this.onGround) this.rot += this.vx * 0.12 * ts; else this.rot = lerp(this.rot, Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2), 0.2);
    if (this.onGround && this.st > 20 && Math.random() < 0.05) Fx.smoke(this.x, this.y - 8, 1, 0.6);
    if (this.onGround && Math.random() < 0.02) Fx.sparks(this.x, this.y - 8, 2, 0);
  }

  // ---------------------------------------------------------- animation
  animate(ts, ax) {
    // squash & stretch spring
    this.sv += (1 - this.sy) * 0.28 * ts; this.sv *= Math.pow(0.62, ts); this.sy += this.sv * ts;
    this.sx = lerp(this.sx, 1 + (1 - this.sy) * 0.9, 0.35);
    this.sy = clamp(this.sy, 0.55, 1.5); this.sx = clamp(this.sx, 0.6, 1.6);
    if (this.flipT > 0) { this.flipT -= ts; this.rot = (1 - easeOut(Math.max(0, this.flipT) / 18)) * TAU; if (this.flipT <= 0) this.rot = 0; }
    else if (this.state === 'hurt') this.rot = -0.35;
    else if (this.state !== 'dead') this.rot = lerp(this.rot, this.state === 'dash' ? 0.12 : 0, 0.3);
    // run cycle
    if (this.onGround && Math.abs(this.vx) > 0.2 && (this.state === 'move' || this.state === 'attack')) {
      const prev = this.runPh; this.runPh += Math.abs(this.vx) * 0.2 * ts;
      if (Math.floor(prev / Math.PI) !== Math.floor(this.runPh / Math.PI)) {
        Snd.play('step', { x: this.x, pitch: rnd(0.8, 1.2), gap: 0.05 });
        if (Math.abs(this.vx) > 1.6 && Math.random() < 0.5) Fx.add({ k: 'dust', x: this.x - this.facing * 3, y: this.y, vx: -this.facing * 0.4, vy: -0.2, r: 1.6, life: 14, c: ROOM.st.key === 'night' ? '#5a6190' : '#e6e0d2' });
        if (ROOM.st.key === 'night' && Math.random() < 0.6) Fx.add({ k: 'splash', x: this.x - this.facing * 2, y: this.y, life: 8 });
      }
      this.idleT = 0;
    } else { this.runPh = lerp(this.runPh, Math.round(this.runPh / Math.PI) * Math.PI, 0.3); this.idleT += ts; }
    // blink
    this.blinkT -= ts; if (this.blinkT <= 0) { this.blink = 7; this.blinkT = rnd(120, 260); } if (this.blink > 0) this.blink -= ts;
    // look around when idle long
    if (this.idleT > 200) this.look = Math.sin(this.idleT * 0.02) > 0.6 ? -1 : 0; else this.look = 0;
    // antenna spring
    this.antV += (-this.ant * 0.2 - this.vx * 0.05 * this.facing + (this.vy < 0 ? 0.02 : 0)) * ts; this.antV *= Math.pow(0.82, ts); this.ant += this.antV * ts; this.ant = clamp(this.ant, -1.2, 1.2);
    // idle weapon angle
    if (this.state === 'move' || this.state === 'hurt' || this.state === 'land' || this.state === 'dash') {
      let tgt = -2.15;
      if (this.state === 'dash') tgt = -2.7; else if (!this.onGround) tgt = this.vy < 0 ? -2.35 : -1.9; else if (Math.abs(this.vx) > 0.5) tgt = -2.45 + Math.sin(this.runPh * 2) * 0.12;
      else tgt += Math.sin(Game.t * 0.04) * 0.04;
      if (this.wAng > Math.PI + 0.5) this.wAng -= TAU; if (this.wAng < -Math.PI - 0.5) this.wAng += TAU;
      this.wAng = lerp(this.wAng, tgt, 0.22);
    }
    // smears age
    for (const s of this.smears) s.t += ts; this.smears = this.smears.filter(s => s.t < 5);
    // scarf verlet
    const anc = this.scarfAnchor();
    const sc = this.scarf; sc[0].x = anc[0]; sc[0].y = anc[1];
    const wind = (this.windOverride != null ? this.windOverride : (ROOM && ROOM.st.key === 'night' ? -0.09 : -0.07)) + Math.sin(Game.t * 0.05 + Math.sin(Game.t * 0.013) * 3) * 0.035;
    for (let i = 1; i < sc.length; i++) {
      const p = sc[i]; const vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9; p.px = p.x; p.py = p.y;
      p.x += vx * ts + wind * ts * (0.6 + i * 0.12); p.y += vy * ts + (0.07 + Math.sin(Game.t * 0.21 + i) * 0.03) * ts;
    }
    for (let k = 0; k < 3; k++) for (let i = 1; i < sc.length; i++) {
      const a = sc[i - 1], b = sc[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, L = 2.2;
      const diff = (d - L) / d; b.x -= dx * diff; b.y -= dy * diff;
    }
  }
  scarfAnchor() { return [this.x - this.facing * 3 * this.sx, this.y - 9 * this.sy]; }
  box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  // ---------------------------------------------------------- draw
  draw(cx, cy, P) {
    P = P || this;
    const self = P === this;
    if (self && this.iframes > 0 && this.state !== 'dash' && this.state !== 'dead' && this.state !== 'super' && ((this.iframes | 0) % 6 < 2)) return;
    const X = P.x - cx, Y = P.y - cy, f = P.facing;
    const onG = P.onGround, running = onG && Math.abs(P.vx) > 0.3;
    // legs
    let lb = [0, 0], lf = [0, 0];
    if (running) { const p = P.runPh; lb = [-Math.sin(p) * 1.6, -Math.max(0, Math.cos(p)) * 1.8]; lf = [Math.sin(p) * 1.6, -Math.max(0, -Math.cos(p)) * 1.8]; }
    else if (!onG) { lb = [-1, -1]; lf = [1, P.vy < 0 ? -2 : 0]; }
    const bob = running ? -Math.round(Math.abs(Math.sin(P.runPh))) : (self && Math.sin(Game.t * 0.05) > 0.7 ? 1 : 0);
    const lean = running && Math.abs(P.vx) > 1.4 ? 1 : 0;
    if (self && !SIL) this.drawSmears(cx, cy);
    R.begin(X, Y, f, P.sx, P.sy, P.rot, 0, -8);
    // ---- group 1: scarf + back leg
    const sc = P.scarf;
    for (let i = 0; i + 1 < sc.length; i++) R.wline(sc[i].x - cx, sc[i].y - cy, sc[i + 1].x - cx, sc[i + 1].y - cy, i % 3 === 2 ? PC.scarf2 : PC.scarf, i < 5 ? 2 : 1);
    R.rect(-3 + lb[0], -4 + lb[1], 2, 4, PC.leg); R.rect(-4 + lb[0], -1 + lb[1], 3, 1, PC.leg);
    const wBehind = Math.cos(P.wAng) < -0.15 || (P.wAng < -1.3 && P.wAng > -2.8 && Math.sin(P.wAng) < 0 && Math.cos(P.wAng) < 0.2);
    if (wBehind) { this.drawWeapon(P, cx, cy, false, bob); const h = this.handLocal(P.wAng); R.line(-1, -6 + bob, h[0] - 1, h[1] + bob, PC.leg, 2); }
    R.flush(OUT);
    // ---- group 2: body
    R.rect(-5, -12 + bob, 11, 9, PC.body);
    R.ell(0.5 + lean, -12 + bob, 5.5, 4.6, PC.body);
    R.rect(1 + lf[0], -4 + lf[1], 2, 4, PC.leg); R.rect(1 + lf[0], -1 + lf[1], 3, 1, PC.leg);
    if (!wBehind) { const h = this.handLocal(P.wAng); R.line(0, -6 + bob, h[0], h[1] + bob, PC.leg, 2); }
    // antenna
    const aa = P.ant || 0; const ax0 = -1.5 + lean, ay0 = -16 + bob;
    R.line(ax0, ay0, ax0 + Math.sin(aa) * 4, ay0 - Math.cos(aa) * 4, PC.dark, 1);
    R.flush(OUT);
    // body details
    R.drect(-5, -6 + bob, 11, 2, PC.skirt); R.drect(-5, -4 + bob, 11, 1, PC.shade);
    R.drect(3, -12 + bob, 2, 6, PC.shade); R.drect(-4, -12 + bob, 1, 5, PC.hi); R.px(-3 + lean, -15 + bob, PC.hi); R.px(-2 + lean, -16 + bob, PC.hi);
    R.drect(-3, -8 + bob, 3, 1, PC.shade); R.px(-3, -10 + bob, PC.led);
    // antenna tip
    const tip = R.tx(ax0 + Math.sin(aa) * 4.5 + 0.5, ay0 - Math.cos(aa) * 4.5 + 0.5);
    const tipx = tip[0], tipy = tip[1];
    px(tipx - 0.5, tipy - 0.5, (Game.t % 60) < 30 ? PC.led : '#ff99aa');
    // eye
    const ex = 2.5 + lean + (P.look || 0), ey = -10.5 + bob;
    R.dell(ex, ey, 3, 3, PC.sock);
    const dead = P.dead || P.state === 'dead';
    const ec = dead ? '#4a4658' : (P.eyeRed > 0 ? '#ff4d5a' : PC.eye);
    if ((P.blink > 0 && !dead) || (dead && (Game.t % 20) < 3)) R.drect(ex - 2.5, ey - 0.5, 5, 1, ec);
    else {
      R.dell(ex, ey, 2, 2, ec); R.drect(ex - 2, ey + 0.5, 4, 1, dead ? '#3a3648' : PC.eye2); R.px(ex - 1.5, ey - 1.5, '#ffffff');
      if (P.state === 'attack' || P.state === 'charge' || P.state === 'plunge') { R.drect(ex - 2.5, ey - 2.5, 5, 1, PC.sock); R.px(ex - 2.5, ey - 1.5, PC.sock); }
    }
    // ---- group 3: weapon + arm in front
    if (!wBehind) { this.drawWeapon(P, cx, cy, true, bob); R.flush(OUT); }
    // eye glow
    const night = ROOM && ROOM.st.key === 'night';
    if (self && !dead && !SIL) { const e = R.tx(ex, ey); glow(e[0], e[1], night ? 12 : 7, '#ffd23f', night ? 0.55 : 0.25); glow(tipx, tipy, 5, '#ff4d6d', 0.35); }
    if (self && this.state === 'charge' && this._sign) { const s = this._sign; glow(s.cx0, s.cy0, this.chargeFull ? 26 : 14, this.chargeFull ? '#ffd23f' : '#ffffff', 0.5 + 0.3 * Math.sin(Game.t * 0.6)); }
  }
  drawWeapon(P, cx, cy, front, bob = 0) {
    const L = 13 + this.S.size * 2, rS = 4.6 + this.S.size * 0.7;
    const h = this.handLocal(P.wAng); const hp = R.tx(h[0], h[1] + bob); const hx = hp[0], hy = hp[1];
    const a = P.wAng + (P.rot || 0); const dx = Math.cos(a) * P.facing, dy = Math.sin(a); const qx = -dy, qy = dx;
    const bx = hx - dx * 1.5, by = hy - dy * 1.5, tx = hx + dx * L, ty = hy + dy * L;
    R.wline(bx, by, tx, ty, PC.pole, 2);
    // sign plate: inverted triangle (止まれ) whose apex meets the pole
    const cx0 = tx + dx * rS * 0.95, cy0 = ty + dy * rS * 0.95;
    const tri = r => [cx0 - dx * r, cy0 - dy * r, cx0 + dx * r * 0.5 + qx * r * 0.95, cy0 + dy * r * 0.5 + qy * r * 0.95, cx0 + dx * r * 0.5 - qx * r * 0.95, cy0 + dy * r * 0.5 - qy * r * 0.95];
    R.wpoly(tri(rS + 1.3), '#fbf7f0');
    const s = this._sign = { cx0, cy0, qx, qy, dx, dy, rS, tx, ty };
    R.L.push({ t: 3, p: tri(rS - 0.5), c: this.S.blaze ? '#ff5a2a' : '#e0415a', o: false });
    if (rS > 5.5) R.L.push({ t: 2, x0: cx0 + dx * 1.5 - qx * rS * 0.25, y0: cy0 + dy * 1.5 - qy * rS * 0.25, x1: cx0 + dx * 1.5 + qx * rS * 0.25, y1: cy0 + dy * 1.5 + qy * rS * 0.25, c: '#fbf7f0', th: 1, o: false });
    R.L.push({ t: 2, x0: bx + qx * 0.6, y0: by + qy * 0.6, x1: tx - dx + qx * 0.6, y1: ty - dy + qy * 0.6, c: '#d5dae3', th: 1, o: false });
    if (P === this && (this.S.blaze || this.S.volt) && Math.random() < 0.3) {
      if (this.S.blaze) Fx.fire(s.cx0 + cx, s.cy0 + cy, 1, 0.6);
      if (this.S.volt && Math.random() < 0.3) Fx.add({ k: 'spark', x: s.cx0 + cx + rnd(-3, 3), y: s.cy0 + cy + rnd(-3, 3), vx: rnd(-1, 1), vy: rnd(-1, 1), life: 6, c: '#9ff0ff', g: 0 });
    }
  }
  drawSmears(cx, cy) {
    const L = 13 + this.S.size * 2 + 4.6 + this.S.size * 0.7 + 4;
    const rimC = this.S.blaze ? '#ff8a3c' : this.S.volt ? '#9ff0ff' : '#ff8fa6';
    // older first so fresh arcs sit on top; each arc thins toward its outer edge as it ages
    const list = this.smears.slice().sort((a, b) => b.t - a.t);
    for (const s of list) {
      const u = s.t / 5; const X = s.x - cx, Y = s.y - cy;
      const h1 = this.handLocal(s.a1); const px0 = X + h1[0] * s.f, py0 = Y + h1[1];
      const a0 = s.a0, a1 = s.a1; if (Math.abs(a1 - a0) < 0.05) continue;
      const outer = L + (s.heavy ? 3 : 1) - u * 2;
      const inner = lerp(L * (s.heavy ? 0.42 : 0.58), outer - 1.5, easeIn(u));
      if (outer - inner < 1) continue;
      polyF(arcPts(px0, py0, inner, outer, a0, a1, s.f), rimC);
      const inner2 = inner + (outer - inner) * 0.2, outer2 = outer - 1.2;
      if (outer2 - inner2 >= 1) polyF(arcPts(px0, py0, inner2, outer2, a0, a1, s.f), u < 0.35 ? '#ffffff' : '#ffe9ef');
    }
  }
}
function polyDither(p, c, a) {
  // dithered poly fill via scanline
  const n = p.length >> 1; let mn = 1e9, mx = -1e9; for (let i = 1; i < p.length; i += 2) { mn = Math.min(mn, p[i]); mx = Math.max(mx, p[i]); }
  fs(c);
  for (let j = Math.floor(mn); j <= Math.ceil(mx); j++) {
    const yc = j + 0.5; _xs.length = 0;
    for (let i = 0; i < n; i++) { const ax = p[i * 2], ay = p[i * 2 + 1], k = (i + 1) % n, bx = p[k * 2], by = p[k * 2 + 1]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) _xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
    _xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < _xs.length; i += 2) { const x0 = Math.ceil(_xs[i] - 0.5), x1 = Math.floor(_xs[i + 1] - 0.5) + 1; for (let x = x0; x < x1; x++) if (dth(x, j, a)) G.fillRect(x, j, 1, 1); }
  }
}
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
