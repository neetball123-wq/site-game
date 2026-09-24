'use strict';
// ============================================================
//  game: state machine, rooms, combat glue, HUD, scenes, loop
// ============================================================
const screenCv = document.getElementById('screen');
const SC = screenCv.getContext('2d');
const lo = mkCanvas(W + MG * 2, H + MG * 2); const LX = lo.getContext('2d');
const hud = mkCanvas(W, H); const HX = hud.getContext('2d');
const tmpC = mkCanvas(96, 64);
let K = 1;
function resize() {
  const dpr = window.devicePixelRatio || 1; const fit = Math.min(innerWidth / W, innerHeight / H);
  K = clamp(Math.ceil(fit * dpr), 1, 8);
  screenCv.width = W * K; screenCv.height = H * K;
  screenCv.style.width = Math.floor(W * fit) + 'px'; screenCv.style.height = Math.floor(H * fit) + 'px';
  SC.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

const PLANS = [['start', 'combat', 'combat', 'elite', 'rest'], ['combat', 'combat', 'combat', 'elite', 'rest'], ['combat', 'combat', 'elite', 'rest', 'boss']];

// ---------- save (per-browser record; the ウラガワ hub reads the same key to show progress) ----------
const Save = {
  KEY: 'tomare.v1',
  d: { playMs: 0, runs: 0, kills: 0, best: null, clears: 0, bestLoop: 0 },
  load() { try { const s = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (s && typeof s === 'object') Object.assign(this.d, s); } catch (e) { } },
  write() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { } },
  reach(stage, room, loop) {
    const i = loop * 15 + stage * 5 + room, b = this.d.best;
    if (!b || i > b.loop * 15 + b.stage * 5 + b.room) { this.d.best = { stage, room, loop }; this.write(); }
  },
};
Save.load();
// play time counts only while the page is visible, in 5 s steps
setInterval(() => { if (!document.hidden) { Save.d.playMs += 5000; Save.write(); } }, 5000);
const UPGRADES = [
  { id: 'sign', name: 'SIGN+', desc: 'ATK UP', max: 4, apply: p => { p.S.dmg += 0.22; p.S.size += 1; } },
  { id: 'speed', name: 'TURBO', desc: 'SPD UP', max: 3, apply: p => { p.S.spd += 0.12; } },
  { id: 'hull', name: 'HULL+', desc: 'HP +25', max: 5, apply: p => { p.maxhp += 25; p.hp = Math.min(p.maxhp, p.hp + 40); } },
  { id: 'jet', name: 'JET', desc: 'DASH +1', max: 2, apply: p => { p.dashMax += 1; p.dash = p.dashMax; } },
  { id: 'volt', name: 'VOLT', desc: 'CHAIN', max: 3, apply: p => { p.S.volt += 1; } },
  { id: 'blaze', name: 'BLAZE', desc: 'BURN', max: 3, apply: p => { p.S.blaze += 1; } },
  { id: 'magnet', name: 'MAGNET', desc: 'SCRAP HEAL', max: 2, apply: p => { p.S.magnet += 1; } },
  { id: 'bolt', name: 'BOLT+', desc: 'SHOT X3', max: 2, apply: p => { p.S.bolt += 1; p.ammoMax += 1; p.ammo = p.ammoMax; } },
  { id: 'quake', name: 'QUAKE', desc: 'SLAM UP', max: 2, apply: p => { p.S.quake += 1; } },
  { id: 'over', name: 'OVER', desc: 'METER UP', max: 2, apply: p => { p.S.meterGain += 0.5; } },
  { id: 'reflex', name: 'REFLEX', desc: 'DODGE UP', max: 2, apply: p => { p.S.reflex += 1; } },
  { id: 'lucky', name: 'LUCKY', desc: 'CRIT UP', max: 3, apply: p => { p.S.crit += 0.12; } },
  { id: 'echo', name: 'ECHO', desc: 'GHOST HIT', max: 2, apply: p => { p.S.echo += 1; } },
  { id: 'repair', name: 'REPAIR', desc: 'HP FULL', max: 99, apply: p => { p.hp = p.maxhp; } },
];

const Game = {
  state: 'title', t: 0, run: null, player: null, enemies: [], projs: [], pickups: [], timers: [], combo: 0, comboT: 0,
  waves: [], waveI: 0, waveDelay: 0, locked: false, cleared: false, trans: null, pick: null, road: null, superT: -1, superPlunge: false,
  deadT: 0, pauseSel: 0, pickupChain: 0, pickupChainT: 0, titleT: 0, bossRef: null, hudMeterFlash: 0, finish: 0, clearT: 0,

  // ---------------------------------------------------- run / rooms
  newRun() {
    this.run = { seed: (Math.random() * 1e9) | 0, stage: 0, loop: 0, room: 0, kills: 0, scrap: 0, time: 0, ups: {} };
    Save.d.runs++; Save.write();
    this.player = new Player(30, 190);
    this.enterRoom(0, 0);
    this.state = 'play';
    Scr.lbT = 0; Scr.lb = 0;
  },
  lvl() { const r = this.run; return { hp: 1 + r.stage * 0.32 + r.loop * 0.9, dmg: 1 + r.stage * 0.12 + r.loop * 0.35, spd: 1 + r.loop * 0.12 }; },
  enterRoom(stage, idx) {
    const r = this.run; r.stage = stage; r.room = idx;
    Save.reach(stage, idx, r.loop);
    buildStageAssets(stage);
    const type = PLANS[stage][idx];
    ROOM = genRoom(stage, type, r.seed + stage * 131 + idx * 17 + r.loop * 7919, r.loop);
    const P = this.player; P.x = 26; P.y = ROOM.ground[3] * TILE; P.vx = 0; P.vy = 0; P.state = 'move'; P.autoWalk = 22; P.onGround = true; P.smears = []; P.ctrl = true;
    for (const s of P.scarf) { s.x = s.px = P.x - 2; s.y = s.py = P.y - 9; }
    this.enemies = []; this.projs = []; this.pickups = []; this.timers = []; Parts.length = 0;
    this.locked = false; this.cleared = type === 'rest'; this.waveI = 0; this.pending = 0; this.waveDelay = 30; this.waves = this.planWaves(type); this.bossRef = null; this.finish = 0;
    Cam.reset(0, clamp(P.y - H * 0.62, 0, ROOM.ph - H)); Cam.lockX = null; Cam.bias = 0;
    Scr.lbT = 0;
    Music.setSong(STAGES[stage].song); Music.intensity(0.15); Snd.ambient(STAGES[stage].amb);
    if (type === 'rest') this.openDoor(true);
    if (type === 'boss') {
      Music.setSong('off'); this.locked = true;
      const b = makeEnemy('boss', ROOM.pw - 120, ROOM.ground[Math.floor((ROOM.pw - 120) / TILE)] * TILE, this.lvl(), 'none');
      b.facing = -1; this.enemies.push(b); this.bossRef = b; Scr.lbT = 1;
      P.autoWalk = 60;
    }
  },
  planWaves(type) {
    const r = this.run, s = r.stage;
    const pool = [['mw', 1], ['drum', 1.2], ['fan', 1.6]]; if (s >= 1) pool.push(['cam', 2]); if (s >= 2) pool.push(['vend', 5.5]);
    const build = budget => { const w = []; let b = budget; let guard = 0; while (b > 0.9 && guard++ < 30) { const [k, c] = pick(pool); if (c > b + 0.5) continue; if (k === 'vend' && w.includes('vend')) continue; w.push(k); b -= c; } return w; };
    if (type === 'start') return [['mw', 'mw'], ['mw', 'drum', 'mw']];
    if (type === 'combat') { const n = s === 0 ? 2 : 3; const out = []; for (let i = 0; i < n; i++) out.push(build(3 + s * 1.3 + r.loop * 2.5 + i)); return out; }
    if (type === 'elite') { const out = [s >= 1 ? ['vend', 'mw'] : ['vend']]; if (s >= 1 || r.loop) out.push(build(3 + s + r.loop * 2)); return out; }
    return [];
  },
  spawnEnemy(kind, x, mode) {
    let gx = clamp(x, 40, ROOM.pw - 40);
    const gy = kind === 'cam' ? ROOM.ground[Math.floor(gx / TILE)] * TILE : (groundBelow(gx, 16) || ROOM.ground[Math.floor(gx / TILE)] * TILE);
    const e = makeEnemy(kind, gx, gy, this.lvl(), kind === 'cam' ? 'boot' : (mode || 'drop'));
    e.facing = sgn(this.player.x - gx) || -1;
    this.enemies.push(e); return e;
  },
  spawnWave() {
    const wave = this.waves[this.waveI++]; const P = this.player;
    let i = 0;
    for (const k of wave) {
      let x, tries = 0;
      do { x = Cam.x + 40 + Math.random() * (W - 80); tries++; } while ((Math.abs(x - P.x) < 70 || x < 40 || x > ROOM.pw - 40) && tries < 30);
      this.pending++;
      this.later(i * 10, () => { this.pending--; this.spawnEnemy(k, x); });
      i++;
    }
    Music.intensity(0.8);
  },
  openDoor(instant) {
    const d = ROOM.door; if (d.open) return; d.open = true; d.t = instant ? 60 : 0;
    const w = ROOM.w; for (let y = d.top; y < d.bot; y++) { ROOM.tiles[y * w + w - 2] = 0; ROOM.tiles[y * w + w - 1] = 0; }
    if (!instant) Snd.play('gateOpen', { x: (w - 2) * TILE });
  },
  later(n, fn) { this.timers.push({ t: n, fn }); },

  // ---------------------------------------------------- combat glue
  hitEnemy(e, h) {
    if (e.dead) return; if (e.spawnT > 0 && e.kind !== 'cam') return; if (e.kind === 'cam' && e.spawnT > 0) return;
    if (e.kind === 'boss' && (e.state === 'intro' || e.state === 'dying')) return;
    const P = this.player; const raw = h.src === 'burn' || h.src === 'volt' || h.src === 'echo';
    let dmg = h.dmg * (raw ? 1 : P.S.dmg), crit = false;
    if ((h.src === 'melee' || h.src === 'shot' || h.src === 'plunge' || h.src === 'super') && Math.random() < P.S.crit) { crit = true; dmg *= 2; }
    if (e.kind === 'vend' && e.state === 'stunned') dmg *= 1.5;
    if (e.kind === 'boss') { if (h.y < e.y - 66) { dmg *= 1.6; crit = true; } if (e.state === 'dazed' || e.slammed) dmg *= 1.25; }
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = h.src === 'burn' ? 3 : 8; e.showHp = 150;
    if (e.T.kb > 0 && !e.armor && h.src !== 'burn') {
      e.vx = h.kbx * e.T.kb;
      if (h.kby) { e.vy = h.launch ? h.kby * Math.max(0.3, e.T.kb) : (e.onGround ? Math.max(h.kby * 0.6, -2.5) : h.kby); if (e.vy < -1) e.onGround = false; }
      e.stun = Math.max(e.stun, h.heavy ? 28 : 18);
      if (e.T.poise) { e.poise -= dmg; if (e.poise > 0) { e.stun = e.state === 'stunned' ? e.stun : 0; e.vx *= 0.25; e.vy = Math.max(e.vy, 0); } else { e.poise = e.T.poise; e.stun = 46; e.state = 'rec'; e.st = 0; } }
      if (e.stun > 0 && e.state === 'lunge') e.state = 'rec';
    }
    e.sx = 1.3; e.sy = 0.78;
    if (h.src !== 'burn') {
      const big = h.heavy || h.src === 'super';
      Scr.stop((h.stop || 0) + (crit ? 2 : 0));
      if (h.shake) Cam.shake(h.shake);
      Cam.kick((h.dir || 0) * (big ? 3 : 1.4), big ? 1.2 : 0.3);
      if (big) Cam.punch(0.025, 0.012 * (h.dir || 0));
      Fx.star(h.x, h.y, big ? 17 : 11, '#ffffff', big ? 7 : 5, (h.dir || 1) > 0 ? rnd(-0.4, 0.4) : Math.PI + rnd(-0.4, 0.4));
      Fx.sparks(h.x, h.y, big ? 10 : 6, h.dir, '#fff2c0'); Fx.ring(h.x, h.y, 2, big ? 20 : 12, 9, '#ffffff', 2);
      if (big) Fx.bits(h.x, h.y, 4, ['#d8d4c8', '#9aa0ad', '#6d6577']);
      Snd.play(big ? 'heavy' : 'hit', { x: e.x, p: big ? 0.8 : 0.4 + Math.min(0.5, this.combo * 0.03), pitch: e.kind === 'boss' ? 0.6 : e.kind === 'vend' ? 0.8 : 1 });
      if (crit) { Fx.star(h.x, h.y, 22, '#ffd23f', 8); Scr.flash('#ffffff', 0.1); }
      this.combo++; this.comboT = 130;
    }
    Fx.num(e.x + rnd(-4, 4), e.y - e.h - 4, dmg, crit, h.src === 'burn' ? '#ff9a5a' : h.src === 'volt' ? '#9ff0ff' : h.src === 'echo' ? '#c8b8ff' : null);
    if (h.src === 'melee' || h.src === 'plunge' || h.src === 'shot') this.addMeter(dmg * 0.5);
    if (h.src === 'melee' || h.src === 'plunge') {
      if (P.S.blaze) e.burn = 90 + P.S.blaze * 60;
      if (P.S.volt && (h.atk === 'a3' || h.atk === 'charged' || h.src === 'plunge' || Math.random() < 0.15)) this.chainVolt(e.x, e.y - e.h / 2, 1 + P.S.volt, 8 + P.S.volt * 5, e);
      if (P.S.echo && h.src === 'melee') { const hh = Object.assign({}, h, { dmg: h.dmg * 0.4 * P.S.echo, src: 'echo', stop: 1, shake: 0.05, heavy: false }); this.later(12, () => { if (!e.dead) { Fx.add({ k: 'ring', x: e.x, y: e.y - e.h / 2, r0: 4, r1: 18, life: 10, c: '#c8b8ff', th: 2 }); this.hitEnemy(e, hh); } }); }
    }
    if (e.hp <= 0) e.die();
  },
  addMeter(v) {
    const P = this.player; const was = P.meter; P.meter = Math.min(100, P.meter + v * P.S.meterGain);
    if (was < 100 && P.meter >= 100) { Snd.play('ding'); this.hudMeterFlash = 30; }
  },
  chainVolt(x, y, n, dmg, exclude) {
    const hit = new Set(exclude ? [exclude] : []); let cx = x, cy = y;
    for (let i = 0; i < n; i++) {
      let best = null, bd = 100;
      for (const e of this.enemies) { if (e.dead || hit.has(e) || e.spawnT > 0) continue; const d = dist(cx, cy, e.x, e.y - e.h / 2); if (d < bd) { bd = d; best = e; } }
      if (!best) break; hit.add(best);
      Fx.bolt(cx, cy, best.x, best.y - best.h / 2); Snd.play('clink', { x: best.x, pitch: 1.5 });
      const bx = best.x, by = best.y - best.h / 2; this.hitEnemy(best, { dmg, kbx: 0, kby: -1, stop: 1, dir: 0, x: bx, y: by, src: 'volt' });
      cx = bx; cy = by;
    }
  },
  explosion(x, y, r, dmgE, dmgP, src) {
    Fx.ring(x, y, 4, r, 16, '#ffffff', 3); Fx.fire(x, y, 10, 1.4); Fx.smoke(x, y, 8, 1.3); Fx.sparks(x, y, 14, 0, '#ffd27a', 1.4); Fx.glowP(x, y, r * 1.8, '#ffb060', 18);
    Cam.shake(0.4); Cam.punch(0.03); Scr.flash('#fff2d0', 0.15); Snd.play('explode', { x, p: 1 });
    for (const e of this.enemies) if (e !== src && !e.dead && e.spawnT <= 0 && dist(x, y, e.x, e.y - e.h / 2) < r + e.w / 2) this.hitEnemy(e, { dmg: dmgE, kbx: sgn(e.x - x || 1) * 4, kby: -4, stop: 2, dir: sgn(e.x - x), x: e.x, y: e.y - e.h / 2, src: 'boom', heavy: true, launch: true });
    const P = this.player; if (dist(x, y, P.x, P.y - 8) < r * 0.8) P.damage(dmgP, x);
    for (const o of ROOM.objs) if (!o.dead && dist(x, y, o.x, o.y) < r) hitObj(o, sgn(o.x - x) || 1, 1);
  },
  nearestEnemy(x, y) { let b = null, bd = 1e9; for (const e of this.enemies) { if (e.dead || e.spawnT > 0) continue; const d = dist(x, y, e.x, e.y); if (d < bd) { bd = d; b = e; } } return b; },
  onEnemyDeath(e) {
    const r = this.run; r.kills++; Save.d.kills++;
    if (e.kind === 'boss') { Save.d.clears++; Save.d.bestLoop = Math.max(Save.d.bestLoop || 0, r.loop + 1); Save.write(); }
    this.spawnScrap(e.x, e.y - e.h / 2, e.T.scrap + rndi(0, 2));
    if (Math.random() < (e.T.elite ? 1 : 0.1)) this.spawnPickup('oil', e.x, e.y - e.h / 2);
    this.addMeter(e.T.meter);
    if (e.T.elite && PLANS[r.stage][r.room] === 'elite') this.later(40, () => this.spawnPickup('chip', e.x, e.y - 20));
    if (e.kind === 'boss') { this.later(90, () => { this.spawnPickup('chip', e.x, e.y - 40); this.spawnScrap(e.x, e.y - 40, 30); }); }
    // room finisher
    const alive = this.enemies.filter(q => !q.dead).length + this.pending;
    if (this.locked && alive === 0 && this.waveI >= this.waves.length && !this.cleared && e.kind !== 'boss') {
      Scr.slow(0.15, 50); Cam.punch(0.09, 0.025 * (sgn(e.x - this.player.x) || 1)); Scr.flash('#ffffff', 0.35); Scr.lbT = 0.55;
      this.focus = { x: e.x, y: e.y - e.h / 2, t: 70 }; Cam.hold(1.14, 48);
      this.finish = 70; Snd.play('ding');
    }
  },
  spawnScrap(x, y, n) { for (let i = 0; i < n; i++) this.pickups.push({ kind: 'scrap', x: x + rnd(-4, 4), y, vx: rnd(-2.2, 2.2), vy: rnd(-4.5, -1.5), t: 0, w: 3, h: 3, onGround: false, spin: rnd(TAU) }); },
  spawnPickup(kind, x, y) { this.pickups.push({ kind, x, y, vx: kind === 'chip' ? 0 : rnd(-1, 1), vy: kind === 'chip' ? 0 : -3, t: 0, w: 6, h: 6, onGround: false }); },

  bossStart() { Scr.lbT = 0; Music.setSong('boss'); Music.intensity(1); Cam.punch(0.05); },
  // ---------------------------------------------------- super move
  startSuper() {
    const P = this.player; P.meter = 0; P.state = 'super'; P.vx = 0; P.vy = 0;
    this.superT = 0; this.superPlunge = false; Scr.lbT = 1; Snd.play('cutin'); Music.intensity(1);
  },
  superImpact() {
    const P = this.player; this.superPlunge = false;
    Scr.inv = 6; this.later(6, () => Scr.flash('#ffffff', 0.5)); Cam.shake(1); this.focus = { x: P.x, y: P.y - 10, t: 50 }; Cam.punch(0.16, 0.06 * P.facing); Scr.stop(12); Snd.play('mega', { x: P.x });
    Fx.ring(P.x, P.y - 6, 6, 200, 26, '#ffffff', 4); Fx.flatRing(P.x, P.y, 8, 180, 24, '#ffffff'); Fx.shock(P.x, P.y, 0, 180, '#ffffff'); Fx.crack(P.x, P.y, 12);
    Fx.dust(P.x - 20, P.y, 10, 2); Fx.dust(P.x + 20, P.y, 10, 2); Fx.bits(P.x, P.y - 4, 16, ROOM.st.wall.slice(0, 3));
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 && e.kind !== 'boss') continue;
      if (e.x < Cam.x - 30 || e.x > Cam.x + W + 30) continue;
      const d = sgn(e.x - P.x) || 1;
      this.hitEnemy(e, { dmg: e.kind === 'boss' ? 140 : 70, kbx: d * 6, kby: -6, launch: true, heavy: true, stop: 0, dir: d, x: e.x, y: e.y - e.h / 2, src: 'super' });
    }
    for (const o of ROOM.objs) if (!o.dead && Math.abs(o.x - P.x) < W) hitObj(o, sgn(o.x - P.x) || 1, 1.5);
    for (const p of this.projs) if (p.owner === 'enemy') p.life = 0;
    Scr.lbT = 0;
  },
  updSuper() {
    const P = this.player; this.superT++;
    if (this.superT === 58) { P.state = 'move'; P.vy = -6.6; P.onGround = false; P.cut = true; P.flipT = 18; P.ctrl = false; Snd.play('djump', { x: P.x }); Fx.dust(P.x, P.y, 6, 1.3); Fx.flatRing(P.x, P.y, 3, 26, 14); }
    if (this.superT === 74) { P.startPlunge(); P.st = 7; this.superPlunge = true; }
    if (this.superT > 74 && !this.superPlunge) { P.ctrl = true; this.superT = -1; }
    if (this.superT > 200) { this.superT = -1; P.ctrl = true; this.superPlunge = false; Scr.lbT = 0; }
  },

  // ---------------------------------------------------- pickups & projectiles
  updPickups(ts) {
    const P = this.player; const mag = 46 + P.S.magnet * 60;
    this.pickupChainT = Math.max(0, this.pickupChainT - ts); if (this.pickupChainT <= 0) this.pickupChain = 0;
    for (const k of this.pickups) {
      k.t += ts;
      if (k.kind === 'chip') {
        k.y += Math.sin(k.t * 0.08) * 0.2; if (Math.random() < 0.2) Fx.add({ k: 'spark', x: k.x + rnd(-6, 6), y: k.y + rnd(-6, 6), vx: 0, vy: -0.4, life: 16, c: '#ffd23f', g: 0 });
        if (dist(k.x, k.y, P.x, P.y - 8) < 14 && !P.dead) { k.dead = true; this.openPick('chip'); }
        continue;
      }
      const d = dist(k.x, k.y, P.x, P.y - 7);
      if (k.t > 22 && d < (k.kind === 'oil' ? 30 : mag) && !P.dead) {
        const a = Math.atan2(P.y - 7 - k.y, P.x - k.x); const s = Math.min(7, 1.5 + k.t * 0.04);
        k.vx = lerp(k.vx, Math.cos(a) * s, 0.25); k.vy = lerp(k.vy, Math.sin(a) * s, 0.25); k.x += k.vx * ts; k.y += k.vy * ts; k.onGround = false;
        if (d < 7) {
          k.dead = true;
          if (k.kind === 'scrap') { this.run.scrap++; this.pickupChain++; this.pickupChainT = 20; Snd.play('pickup', { x: k.x, pitch: 1 + Math.min(this.pickupChain, 16) * 0.06, gap: 0.02 }); if (P.S.magnet) P.hp = Math.min(P.maxhp, P.hp + 0.5 * P.S.magnet); Fx.add({ k: 'spark', x: k.x, y: k.y, vx: 0, vy: -0.8, life: 8, c: '#ffe7a0', g: 0 }); }
          else { P.hp = Math.min(P.maxhp, P.hp + 14); Snd.play('heal', { x: k.x }); Fx.num(P.x, P.y - 20, 14, false, '#7dff9a'); Fx.ring(P.x, P.y - 8, 3, 18, 12, '#7dff9a', 2); }
        }
      } else {
        k.vy = Math.min(k.vy + 0.25 * ts, 5); const vy0 = k.vy; moveBody(k, ts);
        if (k.justLanded && vy0 > 1.2) { k.vy = -vy0 * 0.45; k.onGround = false; if (k.kind === 'scrap' && Math.random() < 0.3) Snd.play('clink', { x: k.x, gap: 0.06, pitch: rnd(1.2, 1.6) }); }
        if (k.onGround) k.vx *= Math.pow(0.8, ts);
        if (k.t > 900 && k.kind === 'scrap') k.dead = true;
      }
    }
    this.pickups = this.pickups.filter(k => !k.dead);
  },
  updProjs(ts) {
    const P = this.player;
    for (const p of this.projs) {
      p.life -= ts;
      if (p.kind === 'missile') { this.updMissile(p, ts); continue; }
      if (p.kind === 'flame') { p.t = (p.t || 0) + ts; if (p.t > 10 && p.t < p.dur - 10 && Math.abs(P.x - p.x) < 9 && P.y > p.y - 70) P.damage(Math.round(p.dmg), p.x); if (Math.random() < 0.8) Fx.fire(p.x + rnd(-6, 6), p.y - rnd(0, 60 * Math.min(1, p.t / 8)), 1, 1.3); if (p.t > p.dur) p.life = 0; continue; }
      if (p.g) p.vy += p.g * ts;
      p.x += p.vx * ts; p.y += p.vy * ts; p.rot = (p.rot || 0) + 0.4 * ts;
      if (p.kind === 'wave') {
        const gy = p.y; if (!standPx(p.x, gy + 1) || solidPx(p.x + sgn(p.vx) * 3, gy - 4)) { p.life = 0; Fx.dust(p.x, gy, 3); continue; }
        if ((p.life | 0) % 3 === 0) Fx.add({ k: 'debris', x: p.x, y: gy - 2, vx: rnd(-0.5, 0.5), vy: rnd(-3, -1.5), c: ROOM.st.wall[1], sz: 2, life: 30, g: 0.25, rest: 0 });
        if (overlap({ x: p.x - 4, y: gy - p.h, w: 8, h: p.h }, P.box())) P.damage(Math.round(p.dmg), p.x - p.vx);
        continue;
      }
      if (solidPx(p.x, p.y)) {
        p.life = 0;
        if (p.kind === 'bolt') { Fx.sparks(p.x, p.y, 4, -sgn(p.vx)); Snd.play('clink', { x: p.x }); }
        else if (p.kind === 'can') this.canBurst(p);
        else { Fx.ring(p.x, p.y, 1, 8, 8, p.c || '#ff5fa2', 1); Fx.sparks(p.x, p.y, 3, 0, p.c); }
        continue;
      }
      if (p.owner === 'player') {
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          if (overlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, e.box())) {
            p.life = 0; const dir = sgn(p.vx) || 1;
            if (p.kind === 'can') { this.canBurst(p); break; }
            this.hitEnemy(e, { dmg: p.dmg, kbx: dir * (p.reflected ? 3 : 1.2), kby: p.reflected ? -2.5 : -0.6, stop: p.reflected ? 5 : 2, shake: p.reflected ? 0.2 : 0.04, dir, x: p.x, y: p.y, src: p.reflected ? 'melee' : 'shot', heavy: !!p.reflected });
            break;
          }
        }
        if (p.kind === 'bolt') for (const o of ROOM.objs) if (!o.dead && overlap({ x: p.x - 2, y: p.y - 2, w: 4, h: 4 }, { x: o.x - o.w / 2, y: o.y - o.h, w: o.w, h: o.h })) { hitObj(o, sgn(p.vx), 0.4); p.life = 0; }
      } else if (!P.dead) {
        if (dist(p.x, p.y, P.x, P.y - 7) < p.r + 5) { if (P.damage(Math.round(p.dmg), p.x)) { p.life = 0; if (p.kind === 'can') this.canBurst(p); else Fx.ring(p.x, p.y, 1, 10, 8, p.c, 1); } }
      }
    }
    this.projs = this.projs.filter(p => p.life > 0);
  },
  canBurst(p) {
    Fx.ring(p.x, p.y, 2, 16, 10, '#ffffff', 2); Fx.sparks(p.x, p.y, 6, 0, p.c); Fx.smoke(p.x, p.y, 2, 0.7); Snd.play('explode', { x: p.x, p: 0.2 });
    for (let i = 0; i < 6; i++) Fx.add({ k: 'debris', x: p.x, y: p.y, vx: rnd(-2, 2), vy: rnd(-3, -1), c: p.c, sz: 1, life: 30, g: 0.2, rest: 0 });
    const P = this.player;
    if (p.owner === 'enemy') { if (dist(p.x, p.y, P.x, P.y - 7) < 16) P.damage(Math.round(p.dmg), p.x); }
    else for (const e of this.enemies) if (!e.dead && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y - e.h / 2) < 20 + e.w / 2) this.hitEnemy(e, { dmg: 18, kbx: sgn(e.x - p.x) * 2, kby: -2, stop: 3, dir: sgn(e.x - p.x), x: e.x, y: e.y - e.h / 2, src: 'boom', heavy: true });
  },
  updMissile(p, ts) {
    p.t += ts;
    if (p.phase === 0) { p.vy -= 0.1 * ts; p.x += p.vx * ts; p.y += p.vy * ts; Fx.smoke(p.x, p.y + 4, 1, 0.5); if (p.y < Cam.y - 50) { p.phase = 1; p.x = p.tx; p.y = Cam.y - 60; p.vy = 0; p.warn = 0; } return; }
    if (p.phase === 1) { p.warn += ts; if (p.warn > 46) { p.phase = 2; p.vy = 7; Snd.play('whoosh', { x: p.x, p: 0.6 }); } return; }
    p.y += p.vy * ts; p.vy += 0.3 * ts; if (Math.random() < 0.8) Fx.fire(p.x, p.y - 6, 1, 0.8);
    if (p.y >= p.ty) {
      p.life = 0; this.explosionPlayerOnly(p.x, p.ty, 22, p.dmg);
      this.projs.push({ kind: 'flame', owner: 'enemy', x: p.x, y: p.ty, dmg: 8 * this.lvl().dmg, life: 999, dur: 60, t: 0 });
      Snd.play('flame', { x: p.x });
    }
  },
  explosionPlayerOnly(x, y, r, dmg) {
    Fx.ring(x, y - 4, 4, r + 8, 14, '#ffffff', 3); Fx.fire(x, y - 4, 8, 1.3); Fx.smoke(x, y - 6, 5, 1.1); Fx.sparks(x, y - 4, 10, 0, '#ffd27a', 1.2); Fx.glowP(x, y - 8, 50, '#ffb060', 16); Fx.dust(x, y, 5, 1.2);
    Cam.shake(0.3); Snd.play('explode', { x, p: 0.8 });
    const P = this.player; if (dist(x, y - 6, P.x, P.y - 7) < r) P.damage(Math.round(dmg), x);
    for (const o of ROOM.objs) if (!o.dead && Math.abs(o.x - x) < r) hitObj(o, sgn(o.x - x) || 1, 1);
  },

  // ---------------------------------------------------- picks (upgrades)
  rollCards(n = 3) {
    const r = this.run; const avail = UPGRADES.filter(u => (r.ups[u.id] || 0) < u.max && u.id !== 'repair');
    const out = []; const pool = avail.slice();
    while (out.length < n && pool.length) { const i = Math.floor(Math.random() * pool.length); out.push(pool.splice(i, 1)[0]); }
    if (this.player.hp < this.player.maxhp * 0.45 && out.length === n) out[n - 1] = UPGRADES.find(u => u.id === 'repair');
    return out;
  },
  openPick(src) { this.pick = { cards: this.rollCards(), sel: 1, t: 0, chosen: -1, src }; this.state = 'pick'; Snd.play('uiok'); Scr.lbT = 0.4; },
  applyUp(u) { const r = this.run; r.ups[u.id] = (r.ups[u.id] || 0) + 1; u.apply(this.player); },

  // ---------------------------------------------------- transitions
  goNext() {
    const r = this.run; const plan = PLANS[r.stage];
    this.trans = { t: 0, dur: 22, mid: () => {
      if (r.room + 1 < plan.length) { this.enterRoom(r.stage, r.room + 1); this.state = 'play'; }
      else this.startRoad();
    } };
    Snd.play('whoosh', { p: 0.5 });
  },
  startRoad() {
    const r = this.run; const afterBoss = PLANS[r.stage][r.room] === 'boss';
    let next = r.stage + 1; if (afterBoss) { next = 0; }
    this.road = { t: 0, next, dawn: afterBoss, cards: this.rollCards(), sel: 1, chosen: -1, ct: 0, scroll: 0 };
    buildStageAssets(next);
    if (!this.road.skySky) this.road.sky = afterBoss ? makeSky(STAGES[0], DAWN.sky) : Assets[next].sky;
    this.state = 'road'; Music.setSong(afterBoss ? 'dawn' : STAGES[next].song); Music.intensity(0); Snd.ambient('wind2');
    Parts.length = 0;
  },
  finishRoad() {
    const r = this.run, rd = this.road;
    if (rd.dawn) r.loop++;
    this.trans = { t: 0, dur: 26, mid: () => { this.enterRoom(rd.next, 0); this.state = 'play'; this.road = null; } };
  },
  onPlayerDeath() { this.deadT = 0; Music.setSong('off'); Snd.ambient(null); },

  // ---------------------------------------------------- update
  update() {
    In.update(); this.t++;
    if (In.pressed('mute')) Snd.toggleMute();
    if (this.trans) { this.trans.t++; if (this.trans.t === this.trans.dur) { this.trans.mid(); } if (this.trans.t >= this.trans.dur * 2) this.trans = null; if (this.trans && this.trans.t < this.trans.dur) { Scr.update(); return; } }
    switch (this.state) {
      case 'title': this.updTitle(); break;
      case 'play': case 'dead': this.updPlay(); break;
      case 'pick': this.updPick(); break;
      case 'road': this.updRoad(); break;
      case 'pause': if (In.pressed('pause') || In.confirm()) { this.state = 'play'; Snd.play('ui'); } if (In.pressed('quit')) { this.state = 'title'; this.titleT = 0; Music.setSong('day'); } break;
    }
    Scr.update();
    if (this.hudMeterFlash > 0) this.hudMeterFlash--;
  },
  updTitle() {
    this.titleT++;
    if (!ROOM) { buildStageAssets(0); ROOM = genRoom(0, 'start', 1234, 0); }
    if (!this.titleBot) { this.titleBot = new Player(0, 0); this.titleBot.facing = -1; this.titleBot.windOverride = 0.14; }
    const b = this.titleBot; b.x = 0; b.y = 0; b.onGround = true; b.vx = 0; b.facing = -1; b.animate(1, 0);
    if (Snd.ok && !Music.on) { Music.start(); Music.setSong('day'); Music.intensity(0); Snd.ambient('wind2'); }
    if (In.confirm()) { Snd.unlock(); if (!Music.on) Music.start(); Snd.play('uiok'); this.trans = { t: 0, dur: 24, mid: () => this.newRun() }; }
  },
  updPlay() {
    const P = this.player, ts = Scr.ts;
    if (this.state === 'play' && In.pressed('pause') && !P.dead) { this.state = 'pause'; Snd.play('ui'); return; }
    if (this.superT >= 0 && this.superT < 58) { this.updSuper(); Cam.update(P, ROOM); return; }
    if (Scr.hitstop > 0) { Scr.hitstop--; P.readInput(); Cam.update(null, ROOM); updateParts(0.15); return; }
    if (this.superT >= 0) this.updSuper();
    this.run.time += 1 / 60;
    for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= ts; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
    P.update(ts);
    if (this.superPlunge && P.state === 'land') this.superImpact();
    for (const e of this.enemies) e.update(ts);
    this.enemies = this.enemies.filter(e => !e.dead);
    for (const o of ROOM.objs) updateObj(o, ts);
    ROOM.objs = ROOM.objs.filter(o => !o.dead || false);
    this.updProjs(ts); this.updPickups(ts);
    this.updRoom(ts);
    updateParts(ts); weather(ROOM.st, ts);
    if (this.comboT > 0) { this.comboT -= ts; if (this.comboT <= 0) this.combo = 0; }
    if (this.finish > 0) { this.finish -= 1; if (this.finish <= 0) { Scr.lbT = 0; this.roomCleared(); } }
    if (this.focus) { this.focus.t--; if (this.focus.t <= 0) this.focus = null; }
    // camera
    const b = this.bossRef;
    if (b && !b.dead && b.state !== 'intro') { Cam.bias = clamp((b.x - P.x) * 0.25, -60, 60); } else Cam.bias = 0;
    if (b && b.state === 'intro') { Cam.lockX = clamp(b.x - W * 0.62, 0, ROOM.pw - W); } else Cam.lockX = null;
    Cam.update(P, ROOM);
    if (P.dead) { this.deadT++; if (this.deadT > 30) this.state = 'dead'; if (this.deadT > 110 && In.confirm()) { Snd.play('uiok'); this.trans = { t: 0, dur: 24, mid: () => this.newRun() }; } }
  },
  updRoom(ts) {
    const P = this.player, type = ROOM.type;
    // lock & waves
    if (!this.locked && !this.cleared && (type === 'combat' || type === 'elite' || type === 'start') && P.x > 96) { this.locked = true; this.waveDelay = 24; Snd.play('gate', { x: ROOM.pw - 12 }); Cam.shake(0.1); }
    if (this.locked && !this.cleared && type !== 'boss') {
      const alive = this.enemies.filter(e => !e.dead).length + this.pending;
      if (this.waveI < this.waves.length) {
        this.waveDelay -= ts; this.quietT = alive === 0 ? (this.quietT || 0) + ts : 0;
        const ready = (alive === 0 && this.waveDelay <= 0 && (this.waveI === 0 || this.quietT > 28)) || (alive <= 1 && this.waveI > 0 && this.waveDelay <= -200);
        if (ready) { this.spawnWave(); this.waveDelay = 40; this.quietT = 0; }
      }
      if (this.waveI >= this.waves.length && alive === 0 && this.finish <= 0 && !this.cleared) this.roomCleared();
    }
    if (type === 'boss' && this.bossRef && this.bossRef.dead && !this.cleared) { this.later(160, () => this.roomCleared()); this.cleared = 'pending'; }
    // door
    const d = ROOM.door; if (d.open) d.t += ts; d.lamp += ts;
    if (d.open && d.t > 30 && P.x > (ROOM.w - 2) * TILE - 2 && !this.trans && !P.dead) {
      if (ROOM.type === 'boss' && this.pickups.some(k => k.kind === 'chip')) { } else this.goNext();
    }
    // grass
    for (const g of ROOM.grass) {
      if (g.x < Cam.x - 10 || g.x > Cam.x + W + 10) continue;
      let push = 0; const ents = [P];
      for (const e of this.enemies) if (!e.T.fly) ents.push(e);
      for (const e of ents) { const dx = g.x - e.x, dy = g.y - e.y; if (Math.abs(dx) < e.w / 2 + 3 && dy > -3 && dy < e.h) push += sgn(dx || 1) * (1.4 + Math.abs(e.vx) * 0.4); }
      const wind = Math.sin(this.t * 0.03 + g.x * 0.07) * 0.35 + (ROOM.st.key === 'night' ? -0.2 : 0);
      g.bv += ((wind + push) - g.b) * 0.18 * ts; g.bv *= Math.pow(0.78, ts); g.b += g.bv * ts; g.b = clamp(g.b, -2, 2);
    }
    // birds
    for (const bd of ROOM.deco) {
      bd.t += ts;
      if (!bd.fly) { if (Math.abs(P.x - bd.x) < 52 || this.enemies.some(e => Math.abs(e.x - bd.x) < 30)) { bd.fly = true; bd.vx = sgn(bd.x - P.x || 1) * rnd(1.2, 2); bd.vy = -rnd(1.5, 2.5); Snd.play('flap', { x: bd.x }); } else if (Math.random() < 0.003 && ROOM.st.key === 'day') Snd.play('chirp', { x: bd.x, gap: 1 }); }
      else { bd.x += bd.vx * ts; bd.y += bd.vy * ts; bd.vy -= 0.02 * ts; }
    }
    ROOM.deco = ROOM.deco.filter(bd => bd.y > -60);
    // rest station
    const s = ROOM.station;
    if (s && !s.used && Math.abs(P.x - s.x) < 12 && P.onGround) {
      s.used = true; const heal = Math.round(P.maxhp * 0.5); P.hp = Math.min(P.maxhp, P.hp + heal); Snd.play('heal', { x: s.x }); Fx.ring(P.x, P.y - 8, 3, 30, 20, '#7dff9a', 2); Fx.num(P.x, P.y - 22, heal, true, '#7dff9a');
      for (let i = 0; i < 16; i++) Fx.add({ k: 'spark', x: P.x + rnd(-8, 8), y: P.y - rnd(0, 16), vx: 0, vy: -rnd(0.5, 1.5), life: rndi(20, 40), c: '#7dff9a', g: 0 });
    }
    if (ROOM.npc) { const n = ROOM.npc; n.t += ts; const near = Math.abs(P.x - n.x) < 60; n.wave = lerp(n.wave, near ? 1 : 0, 0.05); }
  },
  roomCleared() {
    if (this.cleared === true) return;
    this.cleared = true; this.locked = false; this.openDoor(false); Music.intensity(0.15);
    for (const p of this.projs) if (p.owner === 'enemy') p.life = 0;
  },
  // card under the mouse cursor (same layout as drawCards)
  cardAt(n, baseY) {
    if (In.mx < 0) return -1;
    const cw = 78, chH = 96, gap = 12, x0 = Math.round(W / 2 - (n * cw + (n - 1) * gap) / 2);
    for (let i = 0; i < n; i++) { const x = x0 + i * (cw + gap); if (In.mx >= x - 4 && In.mx < x + cw + 4 && In.my >= baseY - 10 && In.my < baseY + chH + 4) return i; }
    return -1;
  },
  // shared card-pick input: arrows/A-D to move, hover to select, click a card or press Space/Enter to take it
  cardInput(pk, baseY, canPick) {
    const n = pk.cards.length;
    if (In.pressed('left')) { pk.sel = (pk.sel + n - 1) % n; Snd.play('ui'); }
    if (In.pressed('right')) { pk.sel = (pk.sel + 1) % n; Snd.play('ui'); }
    const hov = this.cardAt(n, baseY);
    if (In.moved && hov >= 0 && hov !== pk.sel) { pk.sel = hov; Snd.play('ui'); }
    if (!canPick) return false;
    if (In.clicked) { if (hov >= 0) { pk.sel = hov; return true; } return false; }
    return In.pressed('jump') || In.pressed('ok') || In.pressed('attack');
  },
  updPick() {
    const pk = this.pick; pk.t++;
    if (pk.chosen < 0) {
      if (this.cardInput(pk, 58, pk.t > 20)) { pk.chosen = pk.sel; pk.ct = 0; this.applyUp(pk.cards[pk.sel]); Snd.play('uiok'); Scr.flash('#ffffff', 0.3); }
    } else { pk.ct++; if (pk.ct > 40) { this.state = 'play'; this.pick = null; Scr.lbT = 0; In.eat(); } }
    updateParts(0.2);
  },
  updRoad() {
    const rd = this.road; rd.t++; rd.scroll += rd.chosen >= 0 && rd.ct > 30 ? 3.5 : 1.3;
    if (!this.roadBot) this.roadBot = new Player(0, 0);
    if (rd.chosen < 0) {
      if (rd.t > 50 && this.cardInput(rd, 48, rd.t > 70)) { rd.chosen = rd.sel; rd.ct = 0; this.applyUp(rd.cards[rd.sel]); Snd.play('uiok'); Scr.flash('#ffffff', 0.3); }
    } else { rd.ct++; if (rd.ct === 90) this.finishRoad(); }
    Scr.lbT = 1;
  },

  // ============================================================ RENDER
  render() {
    useCtx(LX); LX.setTransform(1, 0, 0, 1, 0, 0); LX.globalAlpha = 1; LX.globalCompositeOperation = 'source-over';
    HX.clearRect(0, 0, W, H);
    if (this.state === 'title') this.drawTitle();
    else if (this.state === 'road') this.drawRoad();
    else this.drawWorld();
    // compose
    SC.setTransform(1, 0, 0, 1, 0, 0); SC.fillStyle = '#0d0c14'; SC.fillRect(0, 0, screenCv.width, screenCv.height);
    const z = Cam.zoom + Math.abs(Cam.tilt) * 1.9;
    let fx = W / 2, fy = H / 2;
    if (this.focus && this.focus.t > 0 && ROOM && this.state !== 'title' && this.state !== 'road') { fx = clamp(this.focus.x - Cam.x, 40, W - 40); fy = clamp(this.focus.y - Cam.y, 40, H - 40); }
    SC.save(); SC.scale(K, K);
    SC.translate(W / 2, H / 2); SC.rotate(Cam.tilt); SC.translate(-W / 2, -H / 2);
    SC.translate(fx, fy); SC.scale(z, z); SC.translate(-fx, -fy);
    SC.imageSmoothingEnabled = false;
    if (this.state === 'dead' || (this.player && this.player.dead)) SC.filter = `grayscale(${Math.min(0.85, this.deadT / 60)}) contrast(1.1)`;
    SC.drawImage(lo, -MG - (this.state === 'play' || this.state === 'dead' || this.state === 'pick' || this.state === 'pause' ? Cam.sx : 0), -MG - (this.state === 'play' || this.state === 'dead' || this.state === 'pick' || this.state === 'pause' ? Cam.sy : 0));
    SC.filter = 'none';
    SC.restore();
    // hud layer
    useCtx(HX);
    this.drawOverlay();
    SC.setTransform(K, 0, 0, K, 0, 0); SC.imageSmoothingEnabled = false; SC.drawImage(hud, 0, 0);
    SC.setTransform(1, 0, 0, 1, 0, 0);
  },
  drawBackdrop(st, A, camX, camY, t, skyOverride) {
    const LW = lo.width, LH = lo.height;
    LX.drawImage(skyOverride || A.sky, 0, -Math.round(camY * 0.1));
    const cxo = Math.round((camX * 0.05 + t * 0.06) % 1024); const cy = Math.round(6 - camY * 0.1);
    LX.drawImage(A.clouds, -cxo, cy); LX.drawImage(A.clouds, 1024 - cxo, cy);
    LX.drawImage(A.land, Math.round(LW * 0.34 - camX * 0.03 - 150), Math.round(LH - A.land.height - 34 - camY * 0.12));
    const fo = Math.round((camX * 0.14) % 768), fy = Math.round(LH - 150 - 30 - camY * 0.2);
    LX.drawImage(A.far, -fo, fy); LX.drawImage(A.far, 768 - fo, fy);
    this.haze(st, fy + 110, 40, 0.55);
    const mo = Math.round((camX * 0.32) % 1024), my = Math.round(LH - 190 + 2 - camY * 0.35);
    LX.drawImage(A.mid, -mo, my); LX.drawImage(A.mid, 1024 - mo, my);
    if (st.neons) for (const n of st.neons) { let x = n.x - mo; if (x < -30) x += 1024; if (x > LW + 30) continue; const on = Math.sin(t * 0.05 + n.ph * 7) > -0.85 || Math.random() < 0.5; if (on) glow(x, my + n.y, 22, n.c, 0.35); }
    this.haze(st, my + 150, 50, 0.4);
  },
  haze(st, y, h, a) {
    const k = st.key + '|' + h + '|' + a; this._hz = this._hz || {}; let c = this._hz[k];
    if (!c) { c = mkCanvas(1, h); const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(st.haze, 0)); g.addColorStop(1, rgba(st.haze, a)); x.fillStyle = g; x.fillRect(0, 0, 1, h); this._hz[k] = c; }
    LX.drawImage(c, 0, Math.round(y - h), lo.width, h); resetFs();
  },
  drawWorld() {
    const st = ROOM.st, A = Assets[ROOM.stage], P = this.player; const t = this.t;
    const ox = Cam.x - MG, oy = Cam.y - MG;
    this.zoomFX = null;
    if (Scr.inv > 0) { this.drawImpactFrame(ox, oy); return; }
    this.drawBackdrop(st, A, Cam.x, Cam.y, t);
    drawNearLayer(st, Cam.x, Cam.y, t);
    // room back layer
    const bx = Math.round(-Cam.x * BACK_F); LX.drawImage(ROOM.back, bx, -oy);
    for (const l of ROOM.lights) {
      let a = l.a; if (l.flick && Math.random() < 0.08) a *= 0.2; if (l.blink && ((t / 40) | 0) % 2) a = 0.1;
      const x = l.x + bx, y = l.y - oy; if (l.dot && a > 0.2) ellipseF(x, y, 2, 2, '#ffe07a');
      glow(x, y, l.r, l.c, a); if (l.cone) { for (let k = 1; k < 5; k++) ditherEllipse(x, y + k * 12, 4 + k * 5, 4, l.c, 0.08 * (5 - k) * a); }
    }
    // terrain
    LX.drawImage(ROOM.terrain, -ox, -oy);
    this.drawDoor(ox, oy);
    if (ROOM.station) this.drawStation(ox, oy);
    if (ROOM.npc) this.drawNpc(ox, oy);
    for (const bd of ROOM.deco) this.drawBird(bd, ox, oy);
    for (const o of ROOM.objs) { if (o.x < Cam.x - 20 || o.x > Cam.x + W + 20) continue; R.begin(0, 0); const sx = o.x, sy = o.y; o.x -= ox; o.y -= oy; drawObj(o); o.x = sx; o.y = sy; }
    // shadows
    for (const e of this.enemies) if (!e.falling) e.drawShadow(ox, oy);
    if (!P.dead) { const gy = groundBelow(P.x, P.y - 1, 160); if (gy != null) { const d = gy - P.y; const s = clamp(1 - d / 90, 0.2, 1); ditherEllipse(P.x - ox, gy - oy, 5 * s, 1.3, '#000000', 0.35 * s); } }
    // pickups
    for (const k of this.pickups) this.drawPickup(k, ox, oy);
    // entities
    for (const e of this.enemies) if (e.kind === 'boss') e.draw(ox, oy);
    for (const e of this.enemies) if (e.kind !== 'boss') e.draw(ox, oy);
    P.draw(ox, oy);
    for (const e of this.enemies) if (e.drawFront) e.drawFront(ox, oy);
    for (const p of this.projs) this.drawProj(p, ox, oy);
    drawParts(ox, oy);
    this.drawGrass(ox, oy);
    for (const e of this.enemies) e.drawHp(ox, oy);
    // grade
    if (st.key === 'dusk') { LX.globalCompositeOperation = 'soft-light'; LX.fillStyle = 'rgba(255,150,110,0.35)'; LX.fillRect(0, 0, lo.width, lo.height); LX.globalCompositeOperation = 'source-over'; resetFs(); }
    if (st.key === 'night') { LX.globalCompositeOperation = 'multiply'; LX.fillStyle = 'rgba(120,130,200,0.55)'; LX.fillRect(0, 0, lo.width, lo.height); LX.globalCompositeOperation = 'source-over'; resetFs(); }
    // glows
    for (const e of this.enemies) if (e.drawGlow && !e.falling) e.drawGlow(ox, oy);
    for (const p of this.projs) this.drawProjGlow(p, ox, oy);
    for (const k of this.pickups) if (k.kind === 'chip') glow(k.x - ox, k.y - oy, 20, '#ffd23f', 0.5); else if (st.key === 'night' && k.kind === 'scrap') glow(k.x - ox, k.y - oy, 4, '#ffe7a0', 0.4);
    if (ROOM.station && !ROOM.station.used) glow(ROOM.station.x - ox, ROOM.station.y - oy - 22, 26, '#7dff9a', 0.4 + 0.1 * Math.sin(t * 0.1));
    if (ROOM.door.open) glow((ROOM.w - 2) * TILE - ox + 4, ROOM.door.bot * TILE - oy - 20, 30, '#fff2c0', 0.25);
    drawParts(ox, oy, 'glow');
    if (st.key === 'night' && this.lightning > 0) { LX.fillStyle = `rgba(200,210,255,${this.lightning / 12 * 0.35})`; LX.fillRect(0, 0, lo.width, lo.height); resetFs(); }
    if (st.key === 'night') { if (this.lightning > 0) this.lightning--; else if (Math.random() < 0.0015) { this.lightning = 12; setTimeout(() => Snd.play('thunder'), 600); } }
    // foreground silhouettes
    this.drawFg(ox, oy);
    this.vignette();
    if (Scr.ts < 0.9) this.zoomFX = W / 2;
  },
  drawImpactFrame(ox, oy) {
    const inv = Scr.inv % 2 === 0; const bg = inv ? '#ffffff' : '#0d0c14', fg = inv ? '#0d0c14' : '#ffffff';
    LX.fillStyle = bg; LX.fillRect(0, 0, lo.width, lo.height); resetFs();
    SIL = fg; LX.drawImage(ROOM.terrain, -ox, -oy); // terrain as silhouette via composite below
    LX.globalCompositeOperation = 'source-atop'; LX.fillStyle = fg; LX.fillRect(0, 0, lo.width, lo.height); LX.globalCompositeOperation = 'source-over'; resetFs();
    LX.fillStyle = bg; LX.fillRect(0, 0, lo.width, Math.round(ROOM.ground[0] * TILE - oy - 70)); resetFs();
    for (const e of this.enemies) e.render && e.kind !== 'boss' ? (SIL = fg, e.render(e.x - ox, e.y - oy)) : (e.kind === 'boss' ? e.draw(ox, oy) : 0);
    SIL = fg; this.player.draw(ox, oy); SIL = null;
    const P = this.player; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; SIL = null; lineF(P.x - ox + Math.cos(a) * 30, P.y - oy - 8 + Math.sin(a) * 30, P.x - ox + Math.cos(a) * 300, P.y - oy - 8 + Math.sin(a) * 300, fg, 2); }
    SIL = null;
  },
  vignette() {
    if (!this._vig) {
      const c = mkCanvas(lo.width, lo.height); const x = c.getContext('2d'); const cx = c.width / 2, cy = c.height / 2;
      x.translate(cx, cy); x.scale(1, c.height / c.width); const g = x.createRadialGradient(0, 0, cx * 0.55, 0, 0, cx * 1.08);
      g.addColorStop(0, 'rgba(13,12,20,0)'); g.addColorStop(1, 'rgba(13,12,20,0.42)'); x.fillStyle = g; x.fillRect(-cx, -cx, c.width, c.width); this._vig = c;
    }
    LX.drawImage(this._vig, 0, 0);
  },
  drawDoor(ox, oy) {
    const d = ROOM.door, st = ROOM.st; const X = (ROOM.w - 2) * TILE - ox, top = d.top * TILE - oy, bot = d.bot * TILE - oy; const Hh = bot - top;
    rectF(X - 2, top - 6, 20, Hh + 6, OUT); rectF(X - 1, top - 5, 18, 4, st.curb[2]);
    const openAmt = d.open ? clamp(d.t / 30, 0, 1) : 0; const sh = Math.round(Hh * (1 - easeInOut(openAmt)));
    rectF(X, top, 16, Hh, d.open ? (st.key === 'night' ? '#1a1d36' : '#4a4658') : '#2a2838');
    if (d.open) { for (let i = 0; i < 3; i++) { const on = ((this.t / 6 | 0) + i) % 3 === 0; polyF([X + 4 + i * 4, top + Hh / 2 - 4, X + 7 + i * 4, top + Hh / 2, X + 4 + i * 4, top + Hh / 2 + 4], on ? '#fff2c0' : '#8a8578'); } }
    for (let y = 0; y < sh; y += 3) { rectF(X, top + y, 16, 2, '#9aa0aa'); rectF(X, top + y + 2, 16, 1, '#6a707c'); }
    if (sh > 4) { for (let i = 0; i < 16; i += 4) rectF(X + i, top + sh - 3, 2, 3, '#f2c14e'); rectF(X, top + sh - 1, 16, 1, OUT); }
    const lampOn = d.open ? true : this.locked ? ((d.lamp / 10) | 0) % 2 === 0 : true;
    ellipseF(X + 8, top - 9, 3, 3, OUT); ellipseF(X + 8, top - 9, 2, 2, d.open ? '#7dff9a' : this.locked ? (lampOn ? '#ff4d5a' : '#6a2030') : '#ffd23f');
    glow(X + 8, top - 9, 10, d.open ? '#7dff9a' : '#ff4d5a', lampOn ? 0.6 : 0.1);
    // left entrance lamp too
    if (this.locked) { const Y = ROOM.ground[2] * TILE - oy - 52; ellipseF(8 - ox, Y, 2, 2, lampOn ? '#ff4d5a' : '#6a2030'); glow(8 - ox, Y, 8, '#ff4d5a', lampOn ? 0.5 : 0.1); }
  },
  drawStation(ox, oy) {
    const s = ROOM.station, X = s.x - ox, Y = s.y - oy;
    rectF(X - 4, Y - 30, 9, 30, OUT); rectF(X - 3, Y - 29, 7, 29, '#d9d4c8'); rectF(X - 3, Y - 29, 7, 2, '#ffffff');
    ellipseF(X + 0.5, Y - 34, 5, 5, OUT); ellipseF(X + 0.5, Y - 34, 4, 4, s.used ? '#4a5a52' : '#7dff9a'); if (!s.used) px(X - 1, Y - 36, '#ffffff');
    rectF(X - 2, Y - 20, 5, 8, '#3a4a44'); for (let i = 0; i < 3; i++) rectF(X - 1, Y - 19 + i * 3, 3, 1, s.used ? '#4a5a52' : ((this.t / 8 | 0) % 3 === i ? '#ffffff' : '#7dff9a'));
    if (!s.used && (this.t % 60) < 40) { const bob = Math.sin(this.t * 0.1) * 2; polyF([X - 3, Y - 48 + bob, X + 4, Y - 48 + bob, X + 0.5, Y - 43 + bob], '#7dff9a'); }
  },
  drawNpc(ox, oy) {
    const n = ROOM.npc, X = Math.round(n.x - ox), Y = Math.round(n.y - oy);
    const c = tint('#9fb09a'), cd = tint('#7a8a78'), dk = tint('#4a5250');
    R.begin(X, Y, -1);
    R.rect(-14, -6, 12, 6, cd); R.rect(4, -5, 14, 5, cd);
    R.ell(0, -18, 12, 13, c); R.ell(-1, -34, 7, 6, c);
    const wv = n.wave; const arm = -1.2 - wv * (0.9 + Math.sin(n.t * 0.2) * 0.4);
    R.line(8, -24, 8 + Math.cos(arm) * 12, -24 + Math.sin(arm) * 12, cd, 3);
    R.line(-8, -20, -14, -10, cd, 3);
    R.flush(OUT);
    R.drect(-10, -24, 20, 2, tint('#b8c8b0')); R.drect(-6, -14, 10, 6, dk); for (let i = 0; i < 3; i++) R.drect(-5 + i * 3, -13, 2, 4, tint('#5a6460'));
    R.dell(2, -35, 2.5, 2.5, OUT); R.dell(2, -35, 1.5, 1.5, (n.t % 240) < 8 ? OUT : '#ffd28a'); R.px(-6, -40, dk); R.dline(-3, -40, -6, -46, dk); R.px(-6, -47, '#ff9a5a');
    // little plant on its lap
    R.drect(-4, -9, 6, 4, tint('#b8634f')); R.px(-2, -11, tint('#7dbb5a')); R.px(-1, -12, tint('#9dd06a')); R.px(0, -11, tint('#7dbb5a'));
    for (let i = 0; i < 4; i++) R.px(-12 + hash2(i, 3) * 20, -26 + hash2(3, i) * 16, tint(ROOM.st.rust));
    glow(X - 2, Y - 35, 8, '#ffd28a', 0.3);
  },
  drawBird(b, ox, oy) {
    const X = Math.round(b.x - ox), Y = Math.round(b.y - oy); const c = ROOM.st.key === 'dusk' ? '#2a2030' : '#4a4e5c';
    if (!b.fly) { const peck = Math.sin(b.t * 0.08) > 0.8 ? 1 : 0; rectF(X - 2, Y - 3, 4, 2, c); rectF(X + (b.f > 0 ? 1 : -2), Y - 4 + peck, 2, 2, c); px(X + (b.f > 0 ? 3 : -3), Y - 3 + peck, '#c8a05a'); px(X - (b.f > 0 ? 3 : -3), Y - 3, c); px(X, Y - 1, c); }
    else { const up = ((b.t / 4) | 0) % 2; rectF(X - 1, Y - 1, 3, 2, c); if (up) { px(X - 3, Y - 3, c); px(X - 2, Y - 2, c); px(X + 3, Y - 3, c); px(X + 2, Y - 2, c); } else { px(X - 3, Y + 1, c); px(X - 2, Y, c); px(X + 3, Y + 1, c); px(X + 2, Y, c); } }
  },
  drawPickup(k, ox, oy) {
    const X = k.x - ox, Y = k.y - oy;
    if (k.kind === 'scrap') { const s = ((k.t / 6) | 0) % 4; rectF(X - 1, Y - 2, 3, 3, OUT); px(X, Y - 1, s < 2 ? '#e8e2d4' : '#b5b0a4'); if (s === 0) px(X, Y - 1, '#ffffff'); rectF(X - 1, Y - 1, 1, 1, '#9aa0ad'); }
    else if (k.kind === 'oil') { rectF(X - 3, Y - 7, 7, 8, OUT); rectF(X - 2, Y - 6, 5, 6, '#e0415a'); rectF(X - 2, Y - 4, 5, 2, '#fbf7f0'); rectF(X - 1, Y - 8, 3, 2, '#9aa0ad'); if ((k.t | 0) % 30 < 4) px(X - 2, Y - 6, '#ffffff'); }
    else if (k.kind === 'chip') {
      const b = Math.sin(k.t * 0.08) * 2; const r = k.t * 0.05;
      const pts = []; for (let i = 0; i < 4; i++) { const a = r + i * Math.PI / 2; pts.push(X + Math.cos(a) * 7, Y + b + Math.sin(a) * 7 * 0.6); }
      polyF(offPts(pts, 0, -1), OUT); polyF(offPts(pts, 0, 1), OUT); polyF(offPts(pts, -1, 0), OUT); polyF(offPts(pts, 1, 0), OUT); polyF(pts, '#ffd23f');
      ellipseF(X, Y + b, 2, 2, '#fff8d0'); ringF(X, Y + b, 10 + Math.sin(k.t * 0.1) * 2, 1, '#ffe07a');
    }
  },
  drawProj(p, ox, oy) {
    const X = p.x - ox, Y = p.y - oy;
    switch (p.kind) {
      case 'bolt': { const a = p.rot; R.begin(X, Y, 1, 1, 1, a, 0, 0); R.rect(-3, -1, 6, 2, '#c7ccd6'); R.rect(2, -2, 2, 4, '#9aa0ad'); R.flush(OUT); break; }
      case 'orb': { const c = p.c || '#ff5fa2'; ellipseF(X, Y, p.r + 1, p.r + 1, OUT); ellipseF(X, Y, p.r, p.r, c); ellipseF(X - 0.5, Y - 0.5, p.r - 1.5, p.r - 1.5, '#ffffff'); if ((this.t | 0) % 4 < 2) ringF(X, Y, p.r + 2, 1, c); break; }
      case 'can': { R.begin(X, Y, 1, 1, 1, p.rot, 0, 0); R.rect(-2, -3, 4, 6, '#e8e4dc'); R.flush(OUT); R.drect(-2, -1, 4, 2, p.c); break; }
      case 'wave': { const h = p.h; for (let i = 0; i < 3; i++) { const hh = h - i * 4 + Math.sin(this.t * 0.8 + i) * 2; rectF(X - 3 + i * 2 * -sgn(p.vx), Y - hh, 2, hh, i === 0 ? '#ffffff' : '#ffe7a8'); } rectF(X - 6, Y - 2, 12, 2, '#ffffff'); break; }
      case 'missile': {
        if (p.phase === 0) { R.begin(X, Y, 1, 1, 1, Math.atan2(p.vy, p.vx), 0, 0); R.rect(-5, -2, 9, 4, '#d8d4c8'); R.rect(3, -2, 3, 4, '#e0415a'); R.flush(OUT); }
        else {
          const ty = p.ty - oy, tx = p.tx - ox; const u = p.phase === 1 ? clamp(p.warn / 46, 0, 1) : 1; const on = ((this.t / 3) | 0) % 2;
          ringF(tx, ty, 18 * (1.4 - u * 0.4), 1, on ? '#ff4d5a' : '#ffd23f', 18 * (1.4 - u * 0.4) * 0.3); ditherEllipse(tx, ty, 14 * u, 3 * u, '#ff4d5a', 0.4);
          if (on) polyF([tx - 4, ty - 12, tx + 4, ty - 12, tx, ty - 6], '#ff4d5a');
          if (p.phase === 2) { R.begin(X, Y, 1, 1, 1, Math.PI / 2, 0, 0); R.rect(-5, -2, 9, 4, '#d8d4c8'); R.rect(3, -2, 3, 4, '#e0415a'); R.flush(OUT); }
        }
        break;
      }
      case 'flame': {
        const u = p.t / p.dur; const hgt = 70 * Math.min(1, p.t / 6) * (u > 0.8 ? (1 - u) / 0.2 : 1); const w0 = 11 + Math.sin(this.t * 0.9) * 2;
        for (let y = 0; y < hgt; y += 2) { const k = y / hgt; const w = w0 * (1 - k * 0.6) + Math.sin(y * 0.4 + this.t * 0.7) * 2; const c = k < 0.15 ? '#fff6c8' : k < 0.45 ? '#ffd23f' : k < 0.75 ? '#ff7a2c' : '#e0415a'; rectF(X - w / 2 + Math.sin(y * 0.2 + this.t * 0.3) * 2, Y - y - 2, w, 2, c); }
        rectF(X - 3, Y - hgt * 0.9, 6, hgt * 0.7, '#fffbe6');
        break;
      }
    }
  },
  drawProjGlow(p, ox, oy) {
    const X = p.x - ox, Y = p.y - oy;
    if (p.kind === 'orb') glow(X, Y, 14, p.c || '#ff5fa2', 0.7);
    else if (p.kind === 'flame') glow(X, Y - 30, 50, '#ff8a3c', 0.6);
    else if (p.kind === 'wave') glow(X, Y - 6, 16, '#fff2c0', 0.5);
    else if (p.kind === 'missile' && p.phase !== 1) glow(X, Y, 12, '#ff8a3c', 0.6);
    else if (p.kind === 'bolt' && ROOM.st.key === 'night') glow(X, Y, 6, '#ffffff', 0.3);
  },
  drawGrass(ox, oy) {
    const cols = ROOM.st.grass;
    for (const g of ROOM.grass) {
      const X = g.x - ox; if (X < -4 || X > lo.width + 4) continue; const Y = g.y - oy;
      const tipX = X + g.b * g.h * 0.5;
      lineF(X, Y - 1, tipX, Y - g.h, cols[g.c], 1);
    }
  },
  drawFg(ox, oy) {
    const st = ROOM.st; const c = st.fg; const f = 1.3;
    for (const o of ROOM.fg) {
      const X = Math.round(o.x - Cam.x * f + MG); if (X < -120 || X > lo.width + 120) continue;
      const Bt = lo.height - Math.round((Cam.y - (ROOM.ph - H)) * 0.3);
      switch (o.kind) {
        case 'pole': rectF(X, -10, 12, lo.height + 20, c); rectF(X + 1, -10, 2, lo.height + 20, mix(c, st.haze, 0.15)); rectF(X - 14, 20 + o.v * 30, 40, 4, c); break;
        case 'grass': for (let i = 0; i < 16; i++) { const h = 20 + hash2(i, o.x | 0) * 36; const sw = Math.sin(this.t * 0.03 + i) * 3; lineF(X + i * 3, Bt, X + i * 3 + sw + (i % 3 - 1) * 4, Bt - h, c, 2); } rectF(X - 4, Bt - 8, 54, 12, c); break;
        case 'leaves': {
          ellipseF(X + 20, -8, 40, 12, c);
          for (let i = 0; i < 9; i++) {
            const L = 14 + hash2(i, o.x | 0) * 46, x0 = X - 14 + i * 8 + hash2(o.x | 0, i) * 4; const sw = Math.sin(this.t * 0.02 + i * 0.7) * 2.5;
            for (let k = 0; k < L; k++) { const xx = x0 + sw * k / L; rectF(xx, k, 1, 1, c); if (k % 5 === 2) { rectF(xx + (k % 10 < 5 ? 1 : -2), k, 2, 2, c); } }
            rectF(x0 + sw - 1, L, 3, 3, c);
          }
          break;
        }
        case 'fence': { const Hh = 60; rectF(X, Bt - Hh, 3, Hh, c); rectF(X + 70, Bt - Hh, 3, Hh, c); rectF(X, Bt - Hh, 73, 2, c); for (let j = 0; j < Hh; j += 4) for (let i = 0; i < 70; i += 4) if (((i + j) >> 2) % 2 === 0) rectF(X + i + (j % 8 ? 2 : 0), Bt - Hh + j, 1, 1, c); break; }
        case 'cable': { let lx = X - 60, ly = -4; for (let s = 1; s <= 30; s++) { const u = s / 30; const x = X - 60 + u * 200, y = -4 + Math.sin(u * Math.PI) * (40 + o.v * 30) + Math.sin(this.t * 0.02) * 2; lineF(lx, ly, x, y, c, 2); lx = x; ly = y; } break; }
        case 'pipe': rectF(X - 40, Bt - 14, 160, 14, c); rectF(X - 40, Bt - 14, 160, 1, mix(c, st.haze, 0.2)); rectF(X + 30, Bt - 18, 8, 18, c); break;
      }
    }
  },
  // ---------------------------------------------------- overlay (HUD layer)
  drawOverlay() {
    const st = this.state;
    // letterbox (HUD slides down with it so it never gets covered)
    const lb = Math.round(Scr.lb * 22); if (lb > 0) { rectI(0, 0, W, lb, '#0d0c14'); rectI(0, H - lb, W, lb, '#0d0c14'); }
    if (st === 'play' || st === 'dead' || st === 'pick' || st === 'pause') { HX.save(); HX.translate(0, lb); this.drawHud(); HX.restore(); resetFs(); }
    if (this.superT >= 0 && this.superT < 60) this.drawCutin();
    if (st === 'pick') this.drawPick();
    if (st === 'road') this.drawRoadUI();
    if (st === 'dead') this.drawDeath();
    if (st === 'pause') this.drawPause();
    if (st === 'title') this.drawTitleUI();
    // flash
    if (Scr.flashA > 0.02) { HX.globalAlpha = Scr.flashA; rectI(0, 0, W, H, Scr.flashC); HX.globalAlpha = 1; }
    // wipe
    if (this.trans) { const tr = this.trans; const u = tr.t < tr.dur ? tr.t / tr.dur : 1 - (tr.t - tr.dur) / tr.dur; this.drawWipe(u, tr.t >= tr.dur); }
  },
  drawWipe(u, rev) {
    const S = 8;
    for (let y = 0; y < H; y += S) for (let x = 0; x < W; x += S) {
      const d = (x / W) * 0.7 + (y / H) * 0.3; const th = rev ? 1 - d : d;
      const k = u * 1.6 - th * 0.6;
      if (k >= 1) rectI(x, y, S, S, '#0d0c14');
      else if (k > 0) { const s = Math.round(S * k); rectI(x + (S - s) / 2 | 0, y + (S - s) / 2 | 0, s, s, '#0d0c14'); }
    }
  },
  drawHud() {
    const P = this.player, r = this.run; if (!P) return;
    const x0 = 8, y0 = 7;
    // eye badge
    ellipseF(x0 + 5.5, y0 + 5.5, 6, 6, OUT); ellipseF(x0 + 5.5, y0 + 5.5, 5, 5, '#ece6d6'); ellipseF(x0 + 6.5, y0 + 5.5, 3, 3, PC.sock);
    ellipseF(x0 + 6.5, y0 + 5.5, 2, 2, P.hp < P.maxhp * 0.3 && (this.t % 30) < 15 ? '#ff4d5a' : PC.eye); px(x0 + 5, y0 + 4, '#ffffff');
    // hp bar
    const bw = Math.round(P.maxhp * 0.6), bx = x0 + 15, by = y0 + 1;
    rectI(bx - 1, by - 1, bw + 2, 7, OUT); rectI(bx, by, bw, 5, '#3a3550');
    rectI(bx, by, Math.round(bw * P.lagHp / P.maxhp), 5, '#ffffff');
    const hw = Math.round(bw * Math.max(0, P.hp) / P.maxhp); rectI(bx, by, hw, 5, '#ff5d73'); rectI(bx, by, hw, 1, '#ffb3bf'); rectI(bx, by + 4, hw, 1, '#c83a55');
    for (let i = 1; i < P.maxhp / 25; i++) rectI(bx + Math.round(bw * i * 25 / P.maxhp), by, 1, 5, OUT);
    text(String(Math.ceil(P.hp)), bx + bw + 4, by, '#ffffff');
    // meter
    const my = by + 8; const mw = 60; const full = P.meter >= 100;
    rectI(bx - 1, my - 1, mw + 2, 4, OUT); rectI(bx, my, mw, 2, '#3a3550');
    const mc = full ? ((this.t >> 2) % 2 ? '#ffffff' : '#ffd23f') : '#ffd23f'; rectI(bx, my, Math.round(mw * P.meter / 100), 2, mc);
    if (full) { glow(bx + mw + 4, my + 1, 8, '#ffd23f', 0.6); polyF([bx + mw + 3, my - 3, bx + mw + 6, my + 1, bx + mw + 3, my + 5, bx + mw + 4, my + 1], '#ffd23f'); }
    if (this.hudMeterFlash > 0) { HX.globalAlpha = this.hudMeterFlash / 30; rectI(bx - 1, my - 1, mw + 2, 4, '#ffffff'); HX.globalAlpha = 1; }
    // dash pips & ammo
    const py = my + 5;
    for (let i = 0; i < P.dashMax; i++) { const on = i < P.dash; rectI(bx + i * 7 - 1, py - 1, 7, 4, OUT); rectI(bx + i * 7, py, 5, 2, on ? '#7fe0ff' : '#3a3550'); if (!on && i === P.dash) rectI(bx + i * 7, py, Math.round(5 * P.dashRe / PL.dashRegen), 2, '#3f7f9a'); }
    const ax = bx + P.dashMax * 7 + 4;
    for (let i = 0; i < P.ammoMax; i++) { const on = i < P.ammo; rectI(ax + i * 4, py - 1, 3, 4, OUT); rectI(ax + i * 4 + 1, py, 1, 2, on ? '#e8e2d4' : '#3a3550'); }
    // scrap
    const s = String(r.scrap); const sx = W - 10 - textW(s, true);
    ellipseF(sx - 7.5, y0 + 4.5, 4, 4, OUT); ellipseF(sx - 7.5, y0 + 4.5, 3, 3, '#c7ccd6'); ellipseF(sx - 7.5, y0 + 4.5, 1, 1, OUT);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + this.t * 0.01; px(sx - 8 + Math.cos(a) * 4, y0 + 4 + Math.sin(a) * 4, '#c7ccd6'); }
    textO(s, sx, y0 + 1, '#ffffff', OUT, true);
    // floor nodes
    const plan = PLANS[r.stage]; const nx0 = W / 2 - (plan.length - 1) * 7;
    rectI(nx0, y0 + 4, (plan.length - 1) * 14, 1, '#6a6680');
    for (let i = 0; i < plan.length; i++) {
      const x = nx0 + i * 14, y = y0 + 4, cur = i === r.room, done = i < r.room, tp = plan[i];
      const c = cur ? '#ffffff' : done ? '#8a86a0' : '#4a4660';
      if (tp === 'boss') { polyF([x - 4, y - 4, x + 5, y - 4, x + 0.5, y + 5], OUT); polyF([x - 3, y - 3, x + 4, y - 3, x + 0.5, y + 3], cur ? '#e0415a' : c); }
      else if (tp === 'elite') { polyF([x + 0.5, y - 4, x + 5, y + 0.5, x + 0.5, y + 5, x - 4, y + 0.5], OUT); polyF([x + 0.5, y - 3, x + 4, y + 0.5, x + 0.5, y + 4, x - 3, y + 0.5], cur ? '#ffd23f' : c); }
      else if (tp === 'rest') { ellipseF(x + 0.5, y + 0.5, 4, 4, OUT); ellipseF(x + 0.5, y + 0.5, 3, 3, cur ? '#7dff9a' : c); }
      else { rectI(x - 2, y - 2, 5, 5, OUT); rectI(x - 1, y - 1, 3, 3, c); }
      if (cur) { const bb = (this.t >> 3) % 2; px(x, y - 7 - bb, '#ffffff'); px(x - 1, y - 8 - bb, '#ffffff'); px(x + 1, y - 8 - bb, '#ffffff'); }
    }
    text(String(r.stage + 1) + (r.loop ? '+' + r.loop : ''), nx0 - 14, y0 + 2, '#8a86a0');
    // combo
    if (this.combo >= 3) {
      const cs = String(this.combo); const pop = this.comboT > 124 ? 1 : 0; const scale = this.combo >= 20 ? 2 : 1;
      const cx = W - 12 - textW(cs, true) * scale, cy = 40 - pop;
      textO(cs, cx, cy, this.combo >= 20 ? '#ffd23f' : '#ffffff', OUT, true, scale);
      textO('HIT', W - 12 - 11, cy + 8 * scale + 2, '#ff9fb0', OUT, false);
      const w = Math.round(30 * this.comboT / 130); rectI(W - 12 - 30, cy + 8 * scale + 9, w, 1, '#ffffff');
    }
    // boss bar
    const b = this.bossRef;
    if (b && !b.dead && b.state !== 'intro') {
      const bw2 = 220, bx2 = (W - bw2) / 2, by2 = H - 16 - 2 * Math.round(Scr.lb * 22);
      rectI(bx2 - 2, by2 - 2, bw2 + 4, 8, OUT); rectI(bx2, by2, bw2, 4, '#3a3550');
      rectI(bx2, by2, Math.round(bw2 * b.hp / b.maxhp), 4, '#e0415a'); rectI(bx2, by2, Math.round(bw2 * b.hp / b.maxhp), 1, '#ff9fb0');
      rectI(bx2 + bw2 / 2, by2, 1, 4, OUT);
      polyF([bx2 - 12, by2 - 3, bx2 - 3, by2 - 3, bx2 - 7.5, by2 + 6], OUT); polyF([bx2 - 11, by2 - 2, bx2 - 4, by2 - 2, bx2 - 7.5, by2 + 4], '#e0415a');
    }
    // door hint arrow
    if (this.cleared === true && ROOM.door.open && this.state === 'play') {
      const X = (ROOM.w - 2) * TILE - Cam.x; if (X > W - 4) { const y = H / 2 + Math.sin(this.t * 0.15) * 2; const on = (this.t >> 4) % 2; polyF([W - 12, y - 6, W - 4, y, W - 12, y + 6], on ? '#ffffff' : '#fff2c0'); }
    }
    if (Snd.muted) text('MUTE', W - 20, H - 8, '#8a86a0');
  },
  drawCutin() {
    const t = this.superT; const P = this.player;
    HX.globalAlpha = Math.min(0.6, t / 10); rectI(0, 0, W, H, '#0d0c14'); HX.globalAlpha = 1;
    const inU = easeOut(clamp(t / 10, 0, 1)), outU = t > 48 ? easeIn((t - 48) / 10) : 0;
    const bandH = 84, cy = H / 2, sk = 30; const off = (1 - inU) * W * 1.2 + outU * -W * 1.4;
    const R0 = W + off + 120;
    const pts = [off - sk, cy - bandH / 2 + 8, R0, cy - bandH / 2 - 10, R0, cy + bandH / 2 - 10, off + sk - 40, cy + bandH / 2 + 8];
    polyF(offPts(pts, 0, -3), '#ffffff'); polyF(offPts(pts, 0, 3), '#ffffff'); polyF(pts, ROOM.st.accent);
    const inner = [off - sk + 6, cy - bandH / 2 + 12, R0, cy - bandH / 2 - 6, R0, cy + bandH / 2 - 14, off + sk - 34, cy + bandH / 2 + 4];
    polyF(inner, '#1d1a2a');
    // speed lines
    for (let i = 0; i < 26; i++) { const y = cy - 36 + hash2(i, 1) * 72; const x = ((hash2(1, i) * W * 2 - t * 22 * (0.6 + hash2(i, 2))) % (W * 1.3) + W * 1.3) % (W * 1.3) - 40 + off * 0.3; rectI(x | 0, y | 0, 20 + (hash2(i, 3) * 40 | 0), 1, i % 3 ? '#4a4660' : '#ffffff'); }
    // close-up of the robot's face (drawn small, scaled up = camera zoom)
    const tc = tmpC.getContext('2d'); tc.clearRect(0, 0, tmpC.width, tmpC.height);
    useCtx(tc);
    const fx = 30, fy = 34;
    ellipseF(fx, fy, 23, 20, OUT); ellipseF(fx, fy, 22, 19, '#ece6d6'); rectF(fx - 22, fy, 45, 20, '#ece6d6'); rectF(fx - 23, fy, 1, 20, OUT); rectF(fx + 23, fy, 1, 20, OUT);
    rectF(fx + 12, fy - 8, 6, 28, '#cbc2ae'); rectF(fx - 18, fy - 12, 2, 20, '#fffcf2');
    ellipseF(fx + 3, fy + 2, 13, 13, PC.sock); ellipseF(fx + 3, fy + 2, 10, 10, '#ffd23f'); ellipseF(fx + 3, fy + 5, 9, 7, '#f0a020'); ellipseF(fx + 3, fy + 2, 5, 5, '#fff3b0');
    ellipseF(fx - 2, fy - 3, 2.5, 2.5, '#ffffff'); px(fx + 7, fy + 7, '#ffffff');
    rectF(fx - 12, fy - 13, 30, 5, PC.sock);
    const e = PC.scarf; for (let i = 0; i < 8; i++) rectF(fx - 30 + i * 4, fy + 18 + Math.sin(i + t * 0.6) * 2, 5, 4, i % 2 ? e : PC.scarf2);
    useCtx(HX);
    const s = 3; const px0 = Math.round(W / 2 - 30 * s + off * 0.9 + (t - 30) * 0.8), py0 = Math.round(cy - 34 * s + 8);
    HX.save(); HX.beginPath(); HX.moveTo(inner[0], inner[1]); for (let i = 2; i < inner.length; i += 2) HX.lineTo(inner[i], inner[i + 1]); HX.closePath(); HX.clip();
    HX.imageSmoothingEnabled = false; HX.drawImage(tmpC, px0, py0, tmpC.width * s, tmpC.height * s); HX.restore(); resetFs();
    if (t > 26 && t < 40) { const u = (t - 26) / 14; const gx = px0 + 28 * s, gy = py0 + 31 * s; useCtx(HX); Fx; const sz = 30 * Math.sin(u * Math.PI); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.3; polyF([gx + Math.cos(a) * sz, gy + Math.sin(a) * sz, gx + Math.cos(a + 1.4) * 3, gy + Math.sin(a + 1.4) * 3, gx + Math.cos(a - 1.4) * 3, gy + Math.sin(a - 1.4) * 3], '#ffffff'); } }
    // slam text-free gauge flash
    if (t > 40 && (t >> 1) % 2) { rectI(0, cy + bandH / 2 + 6, W, 2, '#ffffff'); rectI(0, cy - bandH / 2 - 8, W, 2, '#ffffff'); }
  },
  drawCards(cards, sel, chosen, t, ct, baseY) {
    const n = cards.length, cw = 78, chH = 96, gap = 12; const x0 = Math.round(W / 2 - (n * cw + (n - 1) * gap) / 2);
    for (let i = 0; i < n; i++) {
      const u = cards[i]; const appear = easeOutBack(clamp((t - 6 - i * 6) / 16, 0, 1));
      let x = x0 + i * (cw + gap), y = Math.round(baseY + (1 - appear) * 90);
      const isSel = i === sel; if (isSel && chosen < 0) y -= 5 + Math.round(Math.sin(t * 0.12));
      if (chosen >= 0) { if (i === chosen) { y -= Math.round(easeOut(clamp(ct / 12, 0, 1)) * 12); } else { y += Math.round(easeIn(clamp(ct / 18, 0, 1)) * 140); } }
      const lvl = (this.run.ups[u.id] || 0);
      rectI(x - 2, y - 2, cw + 4, chH + 4, OUT);
      rectI(x, y, cw, chH, isSel ? '#2d2940' : '#221f30');
      for (let j = 0; j < chH; j += 2) if (dth(x, y + j, 0.3)) rectI(x, y + j, cw, 1, '#2a2640');
      const edge = isSel ? ((t >> 3) % 2 && chosen < 0 ? '#ffffff' : '#ffd23f') : '#5a5670';
      rectI(x, y, cw, 1, edge); rectI(x, y + chH - 1, cw, 1, edge); rectI(x, y, 1, chH, edge); rectI(x + cw - 1, y, 1, chH, edge);
      // icon 2x
      const ix = x + cw / 2 - 16, iy = y + 12;
      ellipseF(x + cw / 2, iy + 16, 20, 20, isSel ? '#3d3858' : '#2d2940');
      HX.save(); HX.translate(ix | 0, iy | 0); HX.scale(2, 2); drawIcon(u.id, 0, 0); HX.restore(); resetFs();
      const nw = textW(u.name, true); textO(u.name, x + (cw - nw) / 2, y + 54, '#ffffff', OUT, true);
      const dw = textW(u.desc); text(u.desc, x + (cw - dw) / 2, y + 66, '#bdb6d8');
      if (u.id !== 'repair') for (let k = 0; k < Math.min(u.max, 5); k++) { const on = k < lvl, nx = k === lvl; rectI(x + cw / 2 - Math.min(u.max, 5) * 4 + k * 8, y + 80, 6, 4, OUT); rectI(x + cw / 2 - Math.min(u.max, 5) * 4 + k * 8 + 1, y + 81, 4, 2, on ? '#ffd23f' : nx ? ((t >> 3) % 2 ? '#ffffff' : '#5a5670') : '#3a3550'); }
      if (chosen === i && ct < 10) { HX.globalAlpha = 1 - ct / 10; rectI(x, y, cw, chH, '#ffffff'); HX.globalAlpha = 1; }
    }
    // arrows
    if (chosen < 0 && t > 30) { const on = (t >> 4) % 2; const y = baseY + chH / 2 - 6; polyF([x0 - 12, y, x0 - 18, y + 6, x0 - 12, y + 12], on ? '#ffffff' : '#8a86a0'); const xr = x0 + n * cw + (n - 1) * gap + 12; polyF([xr, y, xr + 6, y + 6, xr, y + 12], on ? '#ffffff' : '#8a86a0'); }
  },
  drawPick() {
    const pk = this.pick; HX.globalAlpha = 0.55; rectI(0, 0, W, H, '#0d0c14'); HX.globalAlpha = 1;
    this.drawCards(pk.cards, pk.sel, pk.chosen, pk.t, pk.ct || 0, 58);
  },
  drawDeath() {
    const u = clamp((this.deadT - 60) / 30, 0, 1); if (u <= 0) return; const r = this.run;
    HX.globalAlpha = 0.6 * u; rectI(0, 0, W, H, '#0d0c14'); HX.globalAlpha = 1;
    const y = Math.round(60 + (1 - easeOut(u)) * 20);
    const tw = textW('SHUTDOWN', true) * 2; textO('SHUTDOWN', W / 2 - tw / 2, y, '#ff5d73', OUT, true, 2);
    const rows = [['time', fmtTime(r.time)], ['kill', String(r.kills)], ['scrap', String(r.scrap)], ['floor', (r.stage + 1) + '-' + (r.room + 1) + (r.loop ? ' +' + r.loop : '')]];
    rows.forEach(([k, v], i) => {
      const yy = y + 30 + i * 14, x = W / 2 - 40;
      this.statIcon(k, x, yy); textO(v, x + 20, yy, '#ffffff', OUT, true);
    });
    if (this.deadT > 110 && (this.t >> 4) % 2) { const s = 'CLICK / SPACE'; textO(s, W / 2 - textW(s, true) / 2, y + 96, '#ffd23f', OUT, true); }
  },
  statIcon(k, x, y) {
    if (k === 'time') { ellipseF(x + 4, y + 3.5, 4, 4, '#ffffff'); ellipseF(x + 4, y + 3.5, 3, 3, OUT); rectI(x + 4, y + 1, 1, 3, '#ffffff'); rectI(x + 4, y + 3, 2, 1, '#ffffff'); }
    else if (k === 'kill') { ellipseF(x + 4, y + 3, 4, 3.5, '#ffffff'); rectI(x + 2, y + 6, 5, 2, '#ffffff'); rectI(x + 2, y + 2, 2, 2, OUT); rectI(x + 5, y + 2, 2, 2, OUT); }
    else if (k === 'scrap') { ellipseF(x + 4, y + 3.5, 4, 4, '#c7ccd6'); ellipseF(x + 4, y + 3.5, 1.5, 1.5, OUT); }
    else { polyF([x, y + 7, x + 4, y, x + 8, y + 7], '#ffffff'); }
  },
  drawPause() {
    HX.globalAlpha = 0.8; rectI(0, 0, W, H, '#0d0c14'); HX.globalAlpha = 1;
    const s = 'PAUSE'; textO(s, W / 2 - textW(s, true), 40, '#ffffff', OUT, true, 2);
    this.drawControls(W / 2 - 118, 72);
    const q = 'ESC: RESUME   Q: TITLE   M: MUTE'; text(q, W / 2 - textW(q) / 2, 178, '#8a86a0');
  },
  // keycap / mouse glyphs shared by the title and pause screens
  keycap(k, x, y, face = '#3a3550', ink = '#ffffff', lip = '#1d1a2a') {
    const w = Math.max(9, textW(k) + 5); rectI(x - 1, y - 1, w + 2, 11, OUT); rectI(x, y, w, 9, face); rectI(x, y + 8, w, 1, lip);
    text(k, x + Math.round((w - textW(k)) / 2), y + 2, ink); return w;
  },
  mouseGlyph(x, y, btn, face = '#3a3550', hi = '#ffd23f') {
    rectI(x, y - 1, 8, 11, OUT); rectI(x - 1, y, 10, 9, OUT);
    rectI(x, y, 8, 9, face);
    rectI(btn === 'L' ? x : x + 4, y, 4, 4, hi); rectI(x + 3, y, 1, 4, OUT); rectI(x + 4, y, 1, 4, OUT); rectI(x, y + 4, 8, 1, OUT);
    return 9;
  },
  drawControls(x, y) {
    // column 1: WASD + mouse, column 2: arrow keys
    const cols = [x + 52, x + 150];
    text('MOUSE + WASD', cols[0], y - 12, '#bdb6d8'); text('ARROWS', cols[1], y - 12, '#bdb6d8');
    const rows = [
      ['MOVE', [['k', 'W A S D']], [['k', '<'], ['k', '>']]],
      ['JUMP X2', [['k', 'SPACE']], [['k', 'Z']]],
      ['ATTACK', [['m', 'L']], [['k', 'X']]],
      ['DASH', [['k', 'SHIFT'], ['k', 'F']], [['k', 'C']]],
      ['SHOT', [['k', 'E'], ['m', 'R']], [['k', 'V']]],
    ];
    rows.forEach((r, i) => {
      const yy = y + i * 15; text(r[0], x, yy + 2, '#ffd23f');
      for (let c = 0; c < 2; c++) { let xx = cols[c]; for (const [kind, k] of r[1 + c]) xx += (kind === 'm' ? this.mouseGlyph(xx + 1, yy, k) + 1 : this.keycap(k, xx, yy, '#3a3550', c ? '#bdb6d8' : '#ffffff')) + 3; }
    });
    const tips = ['HOLD ATTACK: CHARGE', 'S + ATTACK IN AIR: SLAM', 'W + ATTACK: LAUNCH'];
    tips.forEach((s, i) => text(s, x, y + 80 + i * 8, '#bdb6d8'));
  },
  // ---------------------------------------------------- title
  drawTitle() {
    const st = STAGES[0], A = buildStageAssets(0); const t = this.t;
    const camX = 40 + Math.sin(t * 0.002) * 30;
    this.drawBackdrop(st, A, camX, 10, t);
    drawNearLayer(st, camX * 1.2, 10, t);
    // foreground guardrail across the bottom (low angle)
    const gy = 176 + MG;
    rectI(0, gy + 8, lo.width, lo.height - gy, '#9a917f');
    for (let x = 0; x < lo.width; x += 3) if (hash2(x, 1) < 0.5) rectI(x, gy + 8, 1, 2 + (hash2(x, 2) * 3 | 0), '#8db35d');
    for (let x = 14; x < lo.width; x += 34) { rectI(x - 1, gy - 2, 6, 20, OUT); rectI(x, gy - 2, 4, 20, '#98a2ac'); rectI(x, gy - 2, 1, 20, '#c3cad0'); }
    rectI(0, gy - 13, lo.width, 12, OUT); rectI(0, gy - 12, lo.width, 1, '#f4f4ee'); rectI(0, gy - 11, lo.width, 3, '#d6dade'); rectI(0, gy - 8, lo.width, 1, '#9ea6ad'); rectI(0, gy - 7, lo.width, 4, '#c7ccd0'); rectI(0, gy - 3, lo.width, 1, '#838b93');
    // the robot, close & big (camera zoomed)
    const b = this.titleBot; if (b) {
      const tc = tmpC.getContext('2d'); tc.clearRect(0, 0, tmpC.width, tmpC.height); useCtx(tc);
      const ox = -56, oy = -46; b.draw(ox, oy); useCtx(LX);
      const s = 4; LX.imageSmoothingEnabled = false; LX.drawImage(tmpC, 318 + MG - 56 * s, gy - 12 - 46 * s, tmpC.width * s, tmpC.height * s);
    }
    // birds on rail
    for (let i = 0; i < 3; i++) { const x = 60 + i * 13 + MG, y = gy - 13; const fly = (t % 900) > 700 + i * 20; const c = '#4a4e5c'; if (!fly) { rectI(x - 2, y - 3, 4, 2, c); rectI(x + 1, y - 4, 2, 2, c); } else { const k = (t % 900) - 700 - i * 20; const X = x + k * 1.3, Y = y - k * 0.9; const up = ((t / 4) | 0) % 2; rectI(X - 1, Y - 1, 3, 2, c); px(X - 3, Y - 2 - up, c); px(X + 3, Y - 2 - up, c); } }
    updateParts(1); if (Math.random() < 0.15) Fx.add({ k: 'mote', x: rnd(0, lo.width), y: rnd(0, lo.height), vx: rnd(0.1, 0.5), vy: -rnd(0.02, 0.1), ph: rnd(TAU), life: 300 });
    drawParts(0, 0);
    this.vignette();
  },
  drawTitleUI() {
    const t = this.titleT;
    // logo
    const s = 'TOMARE'; const sc = 4; const lw = textW(s, true) * sc; const lx = 22, ly = 26;
    for (const [dx, dy] of [[0, 3], [2, 3]]) text(s, lx + dx, ly + dy, '#1d1a2a', true, sc);
    textO(s, lx, ly, '#fbf7f0', OUT, true, sc);
    for (let i = 0; i < s.length; i++) rectI(lx + i * 6 * sc, ly, 5 * sc, 2, '#ffffff');
    // sign icon
    const ix = lx + lw + 12, iy = ly + 2; polyF([ix - 1, iy - 1, ix + 23, iy - 1, ix + 11, iy + 22], OUT); polyF([ix + 1, iy, ix + 21, iy, ix + 11, iy + 19], '#fbf7f0'); polyF([ix + 4, iy + 2, ix + 18, iy + 2, ix + 11, iy + 15], '#e0415a'); rectI(ix + 7, iy + 6, 8, 1, '#fbf7f0'); rectI(ix + 9, iy + 9, 4, 1, '#fbf7f0');
    rectI(lx, ly + 34, lw, 1, '#1d1a2a'); rectI(lx, ly + 36, Math.round(lw * 0.4), 1, '#e0415a');
    if ((t >> 5) % 2 === 0 && !this.trans) { const p = 'CLICK / SPACE'; textO(p, lx, 150, '#ffd23f', OUT, true); }
    this.drawControlsMini(lx, 172);
  },
  drawControlsMini(x, y) {
    const cap = (k, xx) => this.keycap(k, xx, y, '#fbf7f0', '#1d1a2a', '#9a917f');
    const label = (l, xx) => { textO(l, xx, y + 2, '#ffffff', OUT); return textW(l); };
    let xx = x;
    xx += cap('WASD', xx) + 3; xx += label('MOVE', xx) + 10;
    xx += cap('SPACE', xx) + 3; xx += label('JUMP', xx) + 10;
    xx += this.mouseGlyph(xx + 1, y, 'L', '#fbf7f0', '#e0415a') + 4; xx += label('ATK', xx) + 10;
    xx += cap('SHIFT', xx) + 2; xx += cap('F', xx) + 3; xx += label('DASH', xx) + 10;
    xx += cap('E', xx) + 2; xx += this.mouseGlyph(xx + 1, y, 'R', '#fbf7f0', '#e0415a') + 4; label('SHOT', xx);
    text('ARROWS + Z X C V ALSO WORK   ESC: PAUSE', x, y + 16, '#e8eef0');
    const fic = 'A WORK OF FICTION'; text(fic, W - 8 - textW(fic), H - 10, '#c9c3b4');
  },
  // ---------------------------------------------------- road interlude (pseudo-3D)
  drawRoad() {
    const rd = this.road; const st = STAGES[rd.next]; const A = Assets[rd.next]; const t = this.t;
    const LW = lo.width, LH = lo.height; const hy = 104 + MG; const cxm = LW / 2;
    LX.drawImage(rd.sky, 0, -8);
    const cxo = Math.round((t * 0.1) % 1024); LX.drawImage(A.clouds, -cxo, 0); LX.drawImage(A.clouds, 1024 - cxo, 0);
    LX.drawImage(A.land, Math.round(cxm - A.land.width / 2 + 40), hy - A.land.height + 12);
    LX.drawImage(A.far, -200, hy - 150 + 18); LX.drawImage(A.far, 568, hy - 150 + 18);
    this.haze(st, hy + 6, 30, 0.8);
    // ground rows
    const camH = 40, F = 150, roadW = 70; const sway = Math.sin(t * 0.01) * 20;
    const g = st.grass, c = st.curb;
    for (let y = hy + 1; y < LH; y++) {
      const z = camH * F / (y - hy); const band = Math.floor((z + rd.scroll) / 40) % 2;
      const k = (y - hy) / (LH - hy); const curve = sway * (1 - k) * (1 - k);
      const hw = roadW * F / z; const cx = cxm + curve;
      rectI(0, y, LW, 1, band ? mix(g[1], st.haze, 0.5 * (1 - k)) : mix(g[3], st.haze, 0.5 * (1 - k)));
      const sw = hw * 1.18; rectI(Math.round(cx - sw), y, Math.round(sw * 2), 1, band ? mix(c[1], st.haze, 0.4 * (1 - k)) : mix(c[2], st.haze, 0.4 * (1 - k)));
      rectI(Math.round(cx - hw), y, Math.round(hw * 2), 1, mix(st.key === 'night' ? '#2a2f4d' : '#6d7179', st.haze, 0.45 * (1 - k)));
      const dash = Math.floor((z + rd.scroll) / 18) % 3 === 0; if (dash) rectI(Math.round(cx - hw * 0.03), y, Math.max(1, Math.round(hw * 0.06)), 1, mix('#e8e4d6', st.haze, 0.4 * (1 - k)));
      rectI(Math.round(cx - hw), y, Math.max(1, Math.round(hw * 0.03)), 1, '#d9d4c8'); rectI(Math.round(cx + hw - hw * 0.03), y, Math.max(1, Math.round(hw * 0.03)), 1, '#d9d4c8');
    }
    // poles
    const spacing = 120; const poles = [];
    for (let i = 12; i >= 0; i--) { const z = i * spacing - (rd.scroll % spacing) + 10; if (z < 12) continue; poles.push(z); }
    const proj = (X, Y, z) => { const k = clamp((F * camH / z) / (LH - hy), 0, 1); const curve = sway * (1 - k) * (1 - k); return [cxm + curve + X * F / z, hy + (camH - Y) * F / z]; };
    let prev = null;
    for (const z of poles) {
      for (const side of [-1, 1]) {
        const [bx, by] = proj(side * (roadW + 40), 0, z), [tx, ty] = proj(side * (roadW + 40), 110, z);
        const w = Math.max(1, Math.round(5 * F / z / 3)); rectI(Math.round(bx - w / 2), Math.round(ty), w, Math.round(by - ty), st.near[0]);
        const aw = Math.round(22 * F / z / 3); rectI(Math.round(tx - aw), Math.round(ty + 6 * F / z / 3), aw * 2, Math.max(1, Math.round(F / z)), st.near[0]);
        if (prev) { const [px0, py0] = proj(side * (roadW + 40), 108, prev), [px1, py1] = [tx, ty + 2]; let lx = px0, ly = py0; for (let s = 1; s <= 12; s++) { const u = s / 12; const x = lerp(px0, px1, u), y = lerp(py0, py1, u) + Math.sin(u * Math.PI) * 10 * F / z / 3; lineF(lx, ly, x, y, st.wire); lx = x; ly = y; } }
      }
      prev = z;
    }
    // robot from behind, big
    const tc = tmpC.getContext('2d'); tc.clearRect(0, 0, tmpC.width, tmpC.height); useCtx(tc);
    drawBotBack(48, 58, t, rd.chosen >= 0 && rd.ct > 30);
    useCtx(LX); LX.imageSmoothingEnabled = false; const s = 3; const bob = Math.round(Math.abs(Math.sin(t * 0.12)) * 2);
    LX.drawImage(tmpC, Math.round(cxm - 48 * s + sway * 0.1), LH - MG - 20 - 58 * s + bob, tmpC.width * s, tmpC.height * s);
    if (st.key === 'night') { LX.globalCompositeOperation = 'multiply'; LX.fillStyle = 'rgba(120,130,200,0.45)'; LX.fillRect(0, 0, LW, LH); LX.globalCompositeOperation = 'source-over'; resetFs(); }
    if (rd.dawn) { glow(LW * 0.78, 40, 90, '#ffd9b0', 0.25); }
    this.vignette();
  },
  drawRoadUI() {
    const rd = this.road; const t = rd.t;
    const u = clamp(t / 40, 0, 1);
    const title = rd.dawn ? 'DAWN' : 'FLOOR ' + (rd.next + 1); const tw = textW(title, true) * 2;
    if (rd.chosen < 0 || rd.ct < 40) textO(title, W / 2 - tw / 2, Math.round(28 - (1 - easeOut(u)) * 20), '#ffffff', OUT, true, 2);
    if (t > 40) this.drawCards(rd.cards, rd.sel, rd.chosen, t - 40, rd.ct || 0, 48);
  },
};
function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function drawBotBack(x, y, t, run) {
  const ph = t * (run ? 0.3 : 0.12);
  const l1 = Math.max(0, Math.sin(ph)) * 2, l2 = Math.max(0, -Math.sin(ph)) * 2; const bob = Math.round(Math.abs(Math.sin(ph)));
  R.begin(x, y, 1);
  // scarf fluttering to the side
  for (let i = 0; i < 7; i++) { const a = i / 7; R.line(-1 + i * 2.6, -9 - bob + Math.sin(t * 0.3 - i) * 1.5 * a, 1 + (i + 1) * 2.6, -9 - bob + Math.sin(t * 0.3 - i - 1) * 1.5 * a, i % 3 === 2 ? PC.scarf2 : PC.scarf, i < 4 ? 2 : 1); }
  R.rect(-4, -4 - l1, 3, 4, PC.leg); R.rect(1, -4 - l2, 3, 4, PC.leg);
  R.rect(-5, -12 - bob, 11, 9, PC.body); R.ell(0.5, -12 - bob, 5.5, 4.6, PC.body);
  R.line(-1.5, -16 - bob, -2 + Math.sin(t * 0.1), -21 - bob, PC.dark, 1);
  // sign over shoulder (seen from behind: grey back plate)
  R.line(3, -7 - bob, 11, -24 - bob, PC.pole, 2);
  R.poly([6, -26 - bob, 17, -27 - bob, 12, -18 - bob], '#9aa0ad');
  R.flush(OUT);
  R.drect(-5, -6 - bob, 11, 2, PC.skirt); R.drect(3, -12 - bob, 2, 6, PC.shade); R.drect(-4, -12 - bob, 1, 5, PC.hi);
  R.drect(-2, -11 - bob, 5, 4, PC.shade); for (let i = 0; i < 3; i++) R.drect(-1, -10 - bob + i * 1, 3, 0.5, PC.dark);
  R.px(-2, -22 - bob, (t % 60) < 30 ? PC.led : '#ff99aa'); R.drect(8, -24 - bob, 6, 1, '#7d838f');
}

// ============================================================ main loop
In.init();
buildStageAssets(0);
let _last = performance.now(), _acc = 0;
// the loop keeps running even if a frame throws; the error is shown on screen instead of freezing the game
let _err = null;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - _last) / 1000; _last = now; if (dt > 0.1) dt = 0.1;
  _acc += dt; let n = 0;
  try {
    while (_acc >= 1 / 60 && n < 4) { _acc -= 1 / 60; Game.update(); n++; }
    if (n === 4) _acc = 0;
  } catch (e) { _acc = 0; reportErr(e); }
  try { Game.render(); } catch (e) { reportErr(e); try { SC.setTransform(1, 0, 0, 1, 0, 0); SC.globalAlpha = 1; SC.globalCompositeOperation = 'source-over'; SC.filter = 'none'; } catch (_) { } }
  if (_err && performance.now() - _err.t < 8000) {
    SC.setTransform(1, 0, 0, 1, 0, 0); SC.fillStyle = 'rgba(13,12,20,.85)'; SC.fillRect(0, 0, screenCv.width, 22 * K / 2 + 8);
    SC.fillStyle = '#ff9fb0'; SC.font = `${Math.max(11, 6 * K)}px monospace`; SC.fillText('ERROR: ' + _err.msg, 8, Math.max(14, 7 * K));
  }
}
function reportErr(e) { console.error(e); const msg = String(e && e.message || e).slice(0, 90); if (!_err || _err.msg !== msg) _err = { msg, t: performance.now() }; }
addEventListener('error', e => reportErr(e.error || e.message));
requestAnimationFrame(frame);
screenCv.focus();
if (/dbg/.test(location.search)) { const s = document.createElement('script'); s.src = 'js/debug.js'; document.body.appendChild(s); }
