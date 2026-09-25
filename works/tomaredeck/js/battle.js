'use strict';
// ============================================================
//  battle: state, action queue (generators), player & enemy actions
// ============================================================
let B = null;                         // current battle
const SIM = { on: false };            // headless simulation (balance tests): no waits, no sound
let UID = 1;
function newCard(id, up = false) { return { uid: UID++, id, up: !!up }; }
function cardDef(c) { return CARDS[c.id]; }
function cardVals(c) { const d = CARDS[c.id]; return Object.assign({}, d.v, c.up ? d.u || {} : {}); }
function cardKw(c, k) { const d = CARDS[c.id], v = cardVals(c); return (d.kw && d.kw.includes(k)) || (k === 'innate' && v.innate); }
function hasRelic(id) { return B ? B.run.relics.includes(id) : (Run.cur && Run.cur.relics.includes(id)); }

// ---------- action queue ----------
const Q = {
  list: [], stack: [], wait: 0,
  push(g) { this.list.push(g); }, front(g) { this.list.unshift(g); },
  busy() { return this.stack.length > 0 || this.list.length > 0 || this.wait > 0; },
  clear() { this.list.length = 0; this.stack.length = 0; this.wait = 0; },
  tick(ts) {
    let guard = 0;
    while (guard++ < 2000) {
      if (this.wait > 0) { if (SIM.on) this.wait = 0; else { this.wait -= ts; return; } }
      let g = this.stack[this.stack.length - 1];
      if (!g) { const n = this.list.shift(); if (!n) return; this.stack.push(n); g = n; }
      let r;
      try { r = g.next(); } catch (e) { console.error(e); if (typeof reportErr === 'function') reportErr(e); this.stack.pop(); continue; }
      if (r.done) { this.stack.pop(); continue; }
      const v = r.value;
      if (typeof v === 'number') this.wait = v;
      else if (v && typeof v.next === 'function') this.stack.push(v);
    }
  },
};

// ---------- damage / block math ----------
function dmgCalc(base, src, tgt) {
  let d = base + ((src && src.st.str) || 0);
  if (src && src.st.slow) d *= 0.75;
  if (tgt && tgt.st.dent) d *= 1.5;
  return Math.max(0, Math.floor(d));
}
function hazardDmg(base, tgt) { let d = base * (hasRelic('triangle') ? 1.5 : 1); if (tgt.st.dent) d *= 1.5; return Math.floor(d); }
function blockCalc(n, who) { if (who.st.nopark) return 0; return Math.max(0, n + (who.st.dex || 0)); }

// ---------- battle construction ----------
class Battle {
  constructor(run, group, kind) {
    this.run = run; this.kind = kind; this.rng = new RNG(run.rng.int(1, 1e9));
    this.turn = 0; this.played = 0; this.totalPlayed = 0; this.energy = 0; this.maxEnergy = 3; this.phase = 'start';
    this.hazards = []; this.vis = []; this.after = []; this.over = false; this.result = null; this.choose = null; this.banner = null;
    this.draw = []; this.hand = []; this.discard = []; this.exhaust = []; this.powers = []; this.limbo = [];
    this.stats = { dmg: 0, maxHit: 0 };
    this.firstCardFree = hasRelicIn(run, 'wakaba');
    this.odo = 0; this.grabbed = [];
    // player
    const spr = Game.robot || new Robot(); spr.x = 108; spr.y = GY; spr.face = 1; spr.pose = 'idle'; spr.dead = false; spr.rot = 0;
    this.P = { isP: true, hp: run.hp, maxhp: run.maxhp, block: 0, st: {}, fresh: {}, x: 108, y: GY, w: 26, h: 36, spr, walls: [], alive: true };
    // enemies
    this.enemies = [];
    for (const id of group) this.addEnemy(id, false);
    this.layout(true);
    // deck
    this.draw = run.deck.map(c => ({ uid: c.uid, id: c.id, up: c.up }));
    this.rng.shuffle(this.draw);
    const inn = this.draw.filter(c => cardKw(c, 'innate')); this.draw = this.draw.filter(c => !cardKw(c, 'innate')).concat(inn);
    if (hasRelicIn(run, 'bigtank')) { this.draw.splice(this.rng.int(0, this.draw.length), 0, newCard('noise')); this.draw.splice(this.rng.int(0, this.draw.length), 0, newCard('noise')); }
  }
  addEnemy(id, fresh = true) {
    const d = ENEMIES[id], run = this.run, act = run.act;
    const alert = run.alert || 0;
    let hp = this.rng.int(d.hp[0], d.hp[1]);
    if (d.tier === 'elite' && alert >= 1) hp = Math.round(hp * 1.25);
    if (d.tier === 'boss' && alert >= 4) hp = Math.round(hp * 1.2);
    const e = {
      uid: UID++, id, def: d, hp, maxhp: hp, hpLag: hp, block: 0, st: Object.assign({}, d.start || {}), fresh: {}, x: 360, y: GY - (d.fly ? 0 : 0), w: d.w, h: d.h,
      alive: true, dying: 0, last: null, next: null, rng: new RNG(this.rng.int(1, 1e9)), stopCount: 0, stopNeed: d.tier === 'boss' ? 3 : d.tier === 'elite' ? 2 : 1, stopped: false,
      pose: 'idle', pt: 0, sx: 1, sy: 1, flash: 0, phase: 1, variant: d.variant || 0, t: rnd(100), tier: d.tier || 'normal', ix: 0, enter: fresh ? 1 : 0,
    };
    if (alert >= 2) e.dmgBonus = 1;
    if (d.tier === 'boss' && alert >= 4) e.st.str = (e.st.str || 0) + 2;
    this.enemies.push(e);
    if (fresh) { e.next = d.ai(e, this); this.intent(e); this.layout(false); e.x = e.tx; e.dropT = 22; }
    return e;
  }
  alive() { return this.enemies.filter(e => e.alive); }
  layout(snap) {
    const list = this.enemies.filter(e => e.alive || e.dying > 0);
    const tot = list.reduce((s, e) => s + e.w, 0) + (list.length - 1) * 16;
    let x = Math.max(250, 356 - tot / 2) + (list.length === 1 ? 0 : 0);
    if (x + tot > W - 22) x = W - 22 - tot;
    for (const e of list) { e.tx = x + e.w / 2; if (snap) e.x = e.tx; x += e.w + 16; }
  }
  intent(e) {
    if (!e.alive) return;
    const mv = e.def.moves[e.next]; const it = mv.it;
    e.intent = { type: it.type, d: it.d != null ? dmgCalc(it.d + (e.dmgBonus || 0), e, this.P) : 0, base: it.d, n: it.n || 1, deb: it.deb, note: it.note, move: e.next };
  }
  refreshIntents() { for (const e of this.alive()) this.intent(e); }
}
function hasRelicIn(run, id) { return run.relics.includes(id); }

// ---------- visuals helper objects in B.vis ----------
function vis(o) { o.t = 0; if (B) B.vis.push(o); return o; }
function label(x, y, s, c) { Fx.label(x, y, s, c); }

// ============================================================
//  player-side actions (used by card/drink/relic generators)
// ============================================================
const A = {
  *wait(n) { yield n; },
  *attack(t, base, o = {}) {
    if (!t || !t.alive) { t = B.rng.pick(B.alive()); if (!t) return; }
    const P = B.P, hits = o.hits || 1;
    const melee = o.pose !== 'none' && o.pose !== 'throw';
    const dx = melee ? clamp(t.x - t.w / 2 - 30 - P.x, 0, 260) : 0;
    for (let i = 0; i < hits; i++) {
      if (!t.alive) break;
      if (o.pose !== 'none') { const imp = P.spr.act(o.pose || 'swing', { dx, from: i > 0 ? dx : 0, stay: i < hits - 1 }); yield imp; }
      const d = dmgCalc(base, P, t);
      deal(P, t, d, { heavy: o.heavy || d >= 18, src: 'atk' });
      yield* afterHit();
      yield i < hits - 1 ? 7 : 10;
    }
  },
  *attackAll(base, o = {}) {
    const P = B.P;
    if (o.pose !== 'none') { const imp = P.spr.act(o.pose || 'sweep', { dx: 60 }); yield imp; }
    Cam.shake(0.15);
    for (const e of B.alive()) { deal(P, e, dmgCalc(base, P, e), { heavy: base >= 12, src: 'atk', quiet: true }); yield 3; }
    yield* afterHit(); yield 10;
  },
  *throwAt(t, base, kind) {
    if (!t || !t.alive) { t = B.rng.pick(B.alive()); if (!t) return; }
    const P = B.P; P.spr.act('throw'); yield 6; Snd.play('throw', { x: P.x });
    const sx = P.x + 16, sy = P.y - 26, ex = t.x, ey = t.y - t.h * 0.55; const dur = 12;
    vis({ k: 'proj', kind, sx, sy, ex, ey, life: dur, arc: kind === 'cone' ? 26 : 8 });
    yield dur;
    deal(P, t, dmgCalc(base, P, t), { src: 'atk' }); yield* afterHit(); yield 6;
  },
  *block(n, style = 'rail', silent) {
    const P = B.P; const amt = blockCalc(n, P); if (amt <= 0) { label(P.x, P.y - 48, 'NO BLOCK', '#ff9fb0'); yield 8; return; }
    if (!silent) P.spr.act('guard');
    P.block += amt;
    Snd.play('shield', { x: P.x }); Fx.num(P.x + 6, P.y - 50, '+' + amt, { c: '#9fd0ff' });
    if (style !== 'relic') { P.walls.push({ kind: style, t: 0, x: 0 }); if (P.walls.length > 3) P.walls.shift(); }
    Fx.ring(P.x + 18, P.y - 16, 3, 18, 12, '#bfe0ff', 2);
    yield 12;
  },
  *status(t, id, n) {
    if (!t) return;
    if (t.isP && id === 'slow' && hasRelic('chains')) { label(t.x, t.y - 50, 'IMMUNE', '#9ff0ff'); yield 6; return; }
    if (!t.isP && !t.alive) return;
    t.st[id] = (t.st[id] || 0) + n;
    const good = STATUS[id] && STATUS[id].good; const y = t.isP ? t.y - 46 : t.y - t.h - 8;
    Fx.label(t.x, y, (STATUS[id] ? STATUS[id].jpEn || '' : '') + (n > 0 ? '+' + n : n), good ? '#ffd23f' : '#c8a8ff');
    vis({ k: 'stpop', id, x: t.x, y: y - 4, life: 26 });
    Snd.play(good ? 'buff' : id === 'rust' ? 'rust' : 'debuff', { x: t.x });
    if (id === 'rust') Fx.rust(t.x, t.y - (t.h || 30) / 2, 10);
    if (id === 'dent') { Fx.sparks(t.x, t.y - (t.h || 30) / 2, 5, 0, '#c7ccd6'); }
    if (!t.isP) B.refreshIntents(); else B.refreshIntents();
    yield 8;
  },
  *statusAll(id, n) { for (const e of B.alive()) { e.st[id] = (e.st[id] || 0) + n; vis({ k: 'stpop', id, x: e.x, y: e.y - e.h - 12, life: 26 }); if (id === 'rust') Fx.rust(e.x, e.y - e.h / 2, 8); } Snd.play(id === 'rust' ? 'rust' : 'debuff'); B.refreshIntents(); yield 14; },
  *stop(t, n, quick) {
    if (!t || !t.alive) { t = B.rng.pick(B.alive()); if (!t) return; }
    const P = B.P;
    if (!quick) { P.spr.act('stop'); yield 10; }
    vis({ k: 'stopsign', x: t.x, y: t.y, h: t.h, life: 46 }); yield 6;
    Snd.play('stop', { x: t.x }); Cam.shake(0.3); Cam.kick(0, 3); Scr.stop(4); Fx.dust(t.x - 10, t.y, 5, 1.2); Fx.dust(t.x + 10, t.y, 5, 1.2); Fx.ring(t.x, t.y - t.h / 2, 4, 30, 14, '#ffffff', 2);
    t.stopCount += n;
    if (t.stopCount >= t.stopNeed) {
      t.stopCount = 0; t.stopped = true; t.flash = 6; label(t.x, t.y - t.h - 20, 'STOP!', '#ff4d5a');
      if (hasRelic('jumper')) B.after.push(A.draw(1));
      B.run.stats.stops = (B.run.stats.stops || 0) + 1;
    } else label(t.x, t.y - t.h - 20, `${t.stopCount}/${t.stopNeed}`, '#ffb0b0');
    yield quick ? 10 : 16;
    while (B.after.length) yield* B.after.shift();
  },
  *draw(n) {
    for (let i = 0; i < n; i++) {
      if (B.hand.length >= 10) { label(W / 2, 190, 'HAND FULL', '#ffb0b0'); break; }
      if (!B.draw.length) { if (!B.discard.length) break; yield* A.reshuffle(); }
      const c = B.draw.pop(); B.hand.push(c); c.fly = { from: 'draw', t: 0 };
      Snd.play('draw', { pitch: 0.9 + i * 0.05, gap: 0.01 });
      if (CARDS[c.id].onDraw === 'pothole') { yield 4; yield* A.loseHP(2, true); }
      yield SIM.on ? 0 : 3;
    }
    yield 4;
  },
  *reshuffle() {
    if (!B.discard.length) return;
    Snd.play('shuffle'); vis({ k: 'shuffle', n: Math.min(8, B.discard.length), life: 24 });
    B.draw = B.draw.concat(B.rng.shuffle(B.discard.splice(0)));
    yield 18;
  },
  *energy(n) { B.energy += n; Snd.play('energy', { pitch: 1 + n * 0.1 }); vis({ k: 'nrgpop', life: 24 }); yield 10; },
  *heal(n) { const P = B.P; const h = Math.min(n, P.maxhp - P.hp); P.hp += h; Snd.play('heal', { x: P.x }); Fx.num(P.x, P.y - 48, '+' + h, { c: '#7dff9a' }); Fx.ring(P.x, P.y - 18, 3, 26, 16, '#7dff9a', 2); yield 14; },
  *loseHP(n, quiet) { const P = B.P; P.hp -= n; Fx.num(P.x, P.y - 48, '-' + n, { c: '#ff9fb0' }); P.spr.flash = 6; Snd.play('hurt', { x: P.x }); if (!quiet) P.spr.act('hurt'); yield 10; checkPlayerDeath(); },
  *hazard(kind, turns, d) {
    const P = B.P; P.spr.act('cast'); yield 8;
    const slots = [196, 222, 176, 240, 158]; const used = B.hazards.map(h => h.slot);
    const slot = slots.find(s => !used.includes(s)) || slots[B.hazards.length % slots.length];
    const h = { kind, turns, d, slot, x: slot, drop: 0 }; B.hazards.push(h);
    Snd.play('land', { x: slot, p: 0.6 }); Snd.play('clink', { x: slot, pitch: 0.8 }); Fx.dust(slot, GY, 5, 1); Cam.shake(0.08);
    if (hasRelic('hazardlamp')) B.after.push(A.block(4, 'relic', true));
    yield 16;
    while (B.after.length) yield* B.after.shift();
  },
  *advanceHazards(n) {
    for (const h of B.hazards) { h.turns = Math.max(0, h.turns - n); vis({ k: 'hzpulse', h, life: 18 }); }
    Snd.play('tick', { pitch: 0.8 }); yield 10;
    const due = B.hazards.filter(h => h.turns <= 0);
    for (const h of due) { yield* triggerHazard(h); if (B.over) return; }
  },
  *gust() { Snd.play('whoosh', { p: 0.8 }); for (let i = 0; i < 16; i++) Fx.streak(rnd(100, W), rnd(40, GY), -7, 0.4, 3, '#ffffff', 12); for (const e of B.alive()) { if (e.block > 0) { Fx.sparks(e.x, e.y - e.h / 2, 6, 1, '#9ff0ff'); label(e.x, e.y - e.h - 12, 'BREAK', '#9ff0ff'); } e.block = 0; } yield 14; },
  *honk() { Snd.play('honk'); for (let i = 1; i <= 3; i++) Fx.ring(B.P.x + 20, B.P.y - 24, 4, 20 + i * 30, 18 + i * 4, '#fff3a0', 2); Cam.shake(0.1); yield 10; },
  *spray(t) { Snd.play('rust', { x: t.x }); const P = B.P; for (let i = 0; i < 20; i++) Fx.add({ k: 'dust', x: P.x + 16, y: P.y - 24, vx: (t.x - P.x) / rnd(14, 22), vy: rnd(-0.6, 0.4), r: rnd(1.5, 3), life: 24, c: pick(['#b8643a', '#d88a50']) }); yield 14; },
  *acidRain(r) {
    Snd.play('rust'); Scr.tintA = 0.3; Scr.tint = '#3a5a2a';
    for (let i = 0; i < 60; i++) Fx.add({ k: 'drop', x: rnd(220, W + 40), y: rnd(-40, 0), vx: -1, vy: rnd(6, 8), gy: GY, life: 50 });
    yield 16; yield* A.statusAll('rust', r);
    for (const e of B.alive()) { yield* rustTick(e); } yield* afterHit();
  },
  *power(id, n) { B.P.spr.act('cast'); yield 8; B.P.st[id] = (B.P.st[id] || 0) + n; if (id === 'signal') B.P.sigPhase = B.P.sigPhase || 0; vis({ k: 'stpop', id, x: B.P.x, y: B.P.y - 50, life: 30 }); Snd.play('buff', { x: B.P.x }); Fx.ring(B.P.x, B.P.y - 18, 4, 30, 18, '#ffd23f', 2); yield 14; },
  *peekPick(n) {
    if (!B.draw.length && B.discard.length) yield* A.reshuffle();
    const cards = B.draw.slice(-n).reverse(); if (!cards.length) return;
    if (SIM.on) { const c = cards[0]; B.draw.splice(B.draw.indexOf(c), 1); B.hand.push(c); return; }
    B.choose = { cards, title: '1枚えらぶ', pick: null };
    while (!B.choose.pick) yield 1;
    const c = B.choose.pick; B.choose = null; B.draw.splice(B.draw.indexOf(c), 1);
    if (B.hand.length < 10) { B.hand.push(c); c.fly = { from: 'center', t: 0 }; } else B.discard.push(c);
    Snd.play('card'); yield 8;
  },
};

// ---------- core damage application ----------
function deal(src, tgt, d, o = {}) {
  if (!tgt.alive && !tgt.isP) return 0;
  let blocked = Math.min(tgt.block, d); tgt.block -= blocked; const hpLoss = d - blocked;
  tgt.hp -= hpLoss;
  const x = tgt.x, y = tgt.isP ? tgt.y - 20 : tgt.y - tgt.h * 0.55; const dir = src && src.x < tgt.x ? 1 : -1;
  // fx
  if (!SIM.on) {
    if (hpLoss > 0) {
      tgt.flash = 7; tgt.sx = 1.25; tgt.sy = 0.8; if (!tgt.isP) { tgt.pose = 'hurt'; tgt.pt = 0; } else { tgt.spr.act('hurt'); tgt.spr.eyeRed = 30; tgt.spr.flash = 7; }
      const big = o.heavy || hpLoss >= 15;
      Scr.stop(big ? 7 : 4); Cam.shake(big ? 0.38 : 0.18); Cam.kick(dir * (big ? 4 : 2), big ? 1.5 : 0.5); if (big) Cam.punch(0.035, 0.012 * dir);
      Fx.star(x - dir * 4, y, big ? 18 : 12, '#ffffff', big ? 7 : 5); Fx.sparks(x, y, big ? 12 : 7, dir, '#fff2c0'); Fx.ring(x, y, 2, big ? 22 : 14, 10, '#ffffff', 2);
      if (!tgt.isP) Fx.bits(x, y, big ? 6 : 3, ['#d8d4c8', '#9aa0ad', '#6d6577']);
      Fx.num(x + rnd(-5, 5), y - 18, hpLoss, { big: hpLoss >= 20, c: tgt.isP ? '#ff6b7a' : hpLoss >= 20 ? '#ffd23f' : '#ffffff' });
      Snd.play(big ? 'heavy' : 'hit', { x, p: Math.min(1, 0.3 + hpLoss / 30), pitch: tgt.isP ? 0.8 : 1 });
      if (tgt.isP) { Scr.flash('#ff3050', 0.25); Snd.play('hurt', { x }); }
    }
    if (blocked > 0) {
      Snd.play('block', { x, pitch: tgt.isP ? 1 : 1.2 }); Fx.sparks(x - dir * 8, y, 6, -dir, '#bfe0ff');
      if (hpLoss === 0) { Fx.num(x, y - 16, 'BLOCK', { c: '#9fd0ff' }); Cam.shake(0.1); Scr.stop(3); }
      if (tgt.isP && tgt.block <= 0 && tgt.walls.length) { for (const w of tgt.walls) w.fly = { vx: rnd(1, 4), vy: rnd(-5, -2), r: rnd(-0.3, 0.3) }; tgt.brokenWalls = tgt.walls; tgt.walls = []; Snd.play('heavy', { x, p: 0.4, pitch: 1.4 }); }
      else if (tgt.isP) for (const w of tgt.walls) w.shake = 8;
    }
  }
  // bookkeeping
  if (!tgt.isP) {
    B.stats.dmg += hpLoss; B.stats.maxHit = Math.max(B.stats.maxHit, hpLoss); B.run.stats.maxHit = Math.max(B.run.stats.maxHit || 0, hpLoss);
    if (hpLoss > 0 && tgt.st.plated) tgt.st.plated = Math.max(0, tgt.st.plated - 1);
    if (o.src === 'atk' && tgt.st.thorns && src && src.isP) B.after.push(thornsBack(tgt));
    if (tgt.hp <= 0) killEnemy(tgt);
    else if (tgt.def.onHalf && !tgt.halfDone && tgt.hp <= tgt.maxhp / 2) { tgt.halfDone = true; B.after.push(tgt.def.onHalf(tgt)); }
  } else {
    if (hpLoss > 0 && o.src === 'atk' && src && !src.isP && hasRelic('reflector')) B.after.push(reflectBack(src));
    checkPlayerDeath();
  }
  B.refreshIntents();
  return hpLoss;
}
function* thornsBack(e) { yield 4; const P = B.P; Fx.sparks(P.x, P.y - 20, 5, -1, '#c7ccd6'); deal(e, P, e.st.thorns, { src: 'thorns' }); yield 8; }
function* reflectBack(e) { if (!e.alive) return; yield 4; Fx.star(e.x, e.y - e.h / 2, 10, '#ff8a3c', 5); deal(B.P, e, 3, { src: 'relic' }); yield 6; }
function* afterHit() { while (B.after.length) yield* B.after.shift(); checkWin(); }
function killEnemy(e) {
  if (!e.alive) return;
  e.alive = false; e.hp = 0; e.dying = 1; e.stopped = false;
  B.run.stats.kills = (B.run.stats.kills || 0) + 1;
  const x = e.x, y = e.y - e.h / 2, s = e.tier === 'boss' ? 3 : e.tier === 'elite' ? 2 : 1;
  if (!SIM.on) {
    Snd.play('explode', { x, p: Math.min(1, 0.35 + s * 0.2) });
    Fx.ring(x, y, 3, 16 + s * 10, 14, '#ffffff', 3); Fx.star(x, y, 12 + s * 4, '#fff6d0', 6);
    for (let i = 0; i < 6 + s * 5; i++) Fx.chunk(x + rnd(-e.w / 2, e.w / 2), y + rnd(-e.h / 3, e.h / 3));
    Fx.sparks(x, y, 10 + s * 5, 0, '#ffd27a', 1.2); Fx.smoke(x, y, 4 + s * 2, 0.8 + s * 0.3); Fx.fire(x, y, 4 + s * 2, 1); Fx.glowP(x, y, 30 + s * 12, '#ffb060', 14);
    Cam.shake(0.2 + s * 0.1);
  }
  if (e.st.explode) B.after.push(explodeSeq(e));
  if (e.grab && e.grab.length) { for (const c of e.grab) { B.hand.length < 10 ? (B.hand.push(c), c.fly = { from: 'enemy', ex: e.x, ey: e.y - e.h / 2, t: 0 }) : B.discard.push(c); } e.grab = []; }
  if (B.alive().length === 0 && !SIM.on) { Scr.slow(0.2, 50); Cam.hold(1.12, 50, x, y); Scr.flash('#ffffff', 0.3); }
}
function* explodeSeq(e) {
  yield 6; const x = e.x, y = e.y - e.h / 2;
  Snd.play('explode', { x, p: 1 }); Fx.ring(x, y, 4, 60, 16, '#ffffff', 3); Fx.fire(x, y, 12, 1.4); Fx.smoke(x, y, 8, 1.3); Fx.glowP(x, y, 80, '#ffb060', 18); Cam.shake(0.45); Scr.flash('#fff2d0', 0.2);
  for (const o of B.alive()) deal(null, o, e.st.explode, { src: 'boom', heavy: 1 });
  deal(e, B.P, e.st.explode, { src: 'boom' });
  yield 14;
}
function checkWin() {
  if (B.over) return;
  if (B.alive().length === 0 && B.enemies.every(e => !e.summoning)) { B.over = true; B.result = 'win'; }
}
function checkPlayerDeath() {
  const P = B.P; if (P.hp > 0 || B.over) return;
  if (hasRelic('airbag') && !B.run.airbagUsed) {
    B.run.airbagUsed = true; P.hp = Math.ceil(P.maxhp * 0.3); label(P.x, P.y - 60, 'AIRBAG!', '#ffffff'); Snd.play('mega', { x: P.x }); Scr.flash('#ffffff', 0.6); Fx.ring(P.x, P.y - 18, 6, 50, 20, '#ffffff', 3); return;
  }
  P.hp = 0; B.over = true; B.result = 'lose'; P.spr.pose = 'dead'; P.spr.dead = true; Snd.play('death'); Scr.slow(0.25, 80); Cam.hold(1.15, 90, P.x, P.y - 20);
}
function* rustTick(t) {
  const n = t.st.rust; if (!n) return;
  if (!t.isP && !t.alive) return;
  Fx.rust(t.x, t.y - (t.h || 30) / 2, 10); Snd.play('rust', { x: t.x });
  const hp = n; t.hp -= hp; t.flash = 5; Fx.num(t.x, (t.isP ? t.y - 40 : t.y - t.h) - 6, hp, { c: '#ffa060' });
  t.st.rust = n - 1; if (t.st.rust <= 0) delete t.st.rust;
  if (!t.isP && t.hp <= 0) killEnemy(t); if (t.isP) checkPlayerDeath();
  else if (t.def.onHalf && !t.halfDone && t.hp <= t.maxhp / 2) { t.halfDone = true; B.after.push(t.def.onHalf(t)); }
  yield 10;
}

// ============================================================
//  hazards (road signs planted on the field)
// ============================================================
function* triggerHazard(h) {
  const i = B.hazards.indexOf(h); if (i >= 0) B.hazards.splice(i, 1);
  if (!B.alive().length) return;
  B.run.stats.hazards = (B.run.stats.hazards || 0) + 1;
  if (h.kind === 'rock') {
    Snd.play('rock'); vis({ k: 'hzfire', x: h.x, life: 20 });
    for (const e of B.alive()) for (let k = 0; k < 3; k++) vis({ k: 'rock', e, x: e.x + rnd(-e.w / 2, e.w / 2), y: -20 - k * 30 - rnd(0, 20), vy: 2, r: rnd(3, 6), first: k === 0, d: h.d, life: 90 });
    yield 34; Cam.shake(0.35);
    for (const e of B.alive()) deal(null, e, hazardDmg(h.d, e), { heavy: 1, src: 'hazard' });
    yield* afterHit(); yield 20;
  } else if (h.kind === 'deer') {
    const t = B.rng.pick(B.alive()); Snd.play('hoof');
    const o = vis({ k: 'deer', x: -30, y: GY, tx: t.x, life: 40 }); yield 26;
    if (t.alive) { deal(null, t, hazardDmg(h.d, t), { heavy: 1, src: 'hazard' }); yield* afterHit(); if (t.alive) { t.st.dent = (t.st.dent || 0) + 2; vis({ k: 'stpop', id: 'dent', x: t.x, y: t.y - t.h - 12, life: 26 }); } }
    yield 18;
  } else if (h.kind === 'train') {
    Scr.lbT = 0.8; Snd.play('bell'); const g = vis({ k: 'gate', x: 176, life: 150, down: 0 }); yield 44;
    Snd.play('train'); const tr = vis({ k: 'train', x: -360, life: 72, hit: new Set() }); yield 1;
    for (let f = 0; f < 70; f++) {
      Cam.shake(0.08); tr.x = -360 + 17 * f;
      for (const e of B.alive()) if (!tr.hit.has(e) && tr.x + 88 > e.x - e.w / 2) { tr.hit.add(e); deal(null, e, hazardDmg(h.d, e), { heavy: 1, src: 'hazard' }); e.launch = 1; }
      yield 1;
    }
    yield* afterHit(); Scr.lbT = 0; yield 20;
  }
  B.refreshIntents();
}

// ============================================================
//  enemy actions
// ============================================================
const EA = {
  *pose(e, p, f) { e.pose = p; e.pt = 0; yield f; e.pose = 'idle'; },
  *lunge(e, kind, dist = 18) {
    const it = e.def.moves[e.next].it; e.pose = 'atk'; e.pt = 0; e.lungeD = dist;
    Snd.play('swing', { x: e.x, p: 0.5, pitch: 0.8 }); yield 9;
    for (let i = 0; i < (it.n || 1); i++) { yield* EA.hitP(e, it.d); if (B.over) break; if (i < (it.n || 1) - 1) { e.pt = 3; yield 8; } }
    yield 10; e.pose = 'idle';
  },
  *hitP(e, base) { const d = dmgCalc(base + (e.dmgBonus || 0), e, B.P); deal(e, B.P, d, { src: 'atk', heavy: d >= 18 }); yield* afterHitE(); },
  *shoot(e, kind) {
    const it = e.def.moves[e.next].it; e.pose = 'atk'; e.pt = 0; yield 6;
    for (let i = 0; i < (it.n || 1); i++) {
      Snd.play(kind === 'can' ? 'throw' : 'laser', { x: e.x, pitch: kind === 'orb' ? 1.6 : 1 });
      vis({ k: 'eproj', kind, sx: e.x - e.w / 2, sy: e._cy || e.y - e.h * 0.6, ex: B.P.x + 6, ey: B.P.y - 22, life: 12 }); yield 12;
      yield* EA.hitP(e, it.d); if (B.over) break; yield 6;
    }
    e.pose = 'idle'; yield 6;
  },
  *laser(e) {
    const it = e.def.moves[e.next].it; e.pose = 'atk'; e.pt = 0; Snd.play('laser', { x: e.x });
    vis({ k: 'laser', e, life: 22 }); yield 6; yield* EA.hitP(e, it.d); yield 16; e.pose = 'idle';
  },
  *block(e, n, quiet) { if (!e.alive) return; const amt = e.st.nopark ? 0 : n; e.block += amt; if (amt) { Fx.num(e.x, e.y - e.h - 6, '+' + amt, { c: '#9fd0ff' }); Fx.ring(e.x, e.y - e.h / 2, 3, 16, 10, '#bfe0ff', 1); Snd.play('shield', { x: e.x }); } yield quiet ? 3 : 10; },
  *buff(e, id, n) { e.st[id] = (e.st[id] || 0) + n; vis({ k: 'stpop', id, x: e.x, y: e.y - e.h - 12, life: 26 }); Snd.play('buff', { x: e.x }); Fx.ring(e.x, e.y - e.h / 2, 4, 26, 14, '#ffd23f', 2); B.refreshIntents(); yield 12; },
  *debuff(t, id, n) {
    if (t.isP && id === 'slow' && hasRelic('chains')) { label(t.x, t.y - 50, 'IMMUNE', '#9ff0ff'); yield 6; return; }
    t.st[id] = (t.st[id] || 0) + n; if (t.isP) t.fresh[id] = true;
    vis({ k: 'stpop', id, x: t.x, y: t.y - 50, life: 26 }); Snd.play('debuff', { x: t.x }); B.refreshIntents(); yield 12;
  },
  *addCards(id, pile, n) {
    for (let i = 0; i < n; i++) { const c = newCard(id); (pile === 'draw' ? B.draw.splice(B.rng.int(0, B.draw.length), 0, c) : B.discard.push(c)); vis({ k: 'cardto', id, pile, life: 26, sx: 330, sy: 100 }); Snd.play('card', { pitch: 0.7 }); yield 8; }
    yield 10;
  },
  *phase2(e, str) {
    yield 10; e.phase = 2; Snd.play('roar', { x: e.x }); Cam.shake(0.5); Scr.flash('#ff3050', 0.25); label(e.x, e.y - e.h - 24, 'OVERHEAT', '#ff6b6b');
    e.st.str = (e.st.str || 0) + str; vis({ k: 'stpop', id: 'str', x: e.x, y: e.y - e.h - 12, life: 30 }); B.refreshIntents(); yield 30;
  },
};
function* afterHitE() { while (B.after.length) yield* B.after.shift(); }

// ============================================================
//  turn flow
// ============================================================
function* battleStart() {
  const P = B.P; B.phase = 'start';
  for (const e of B.enemies) { e.next = e.def.ai(e, B); }
  B.refreshIntents();
  B.banner = { k: 'fight', t: 0, life: 70 }; Snd.play('go'); yield SIM.on ? 0 : 40;
  for (const id of B.run.relics) { const r = RELICS[id]; if (r && r.onCombatStart) { vis({ k: 'relicpop', id, life: 30 }); yield* r.onCombatStart(); } }
  yield* startPlayerTurn(true);
}
function* startPlayerTurn(first) {
  const P = B.P; B.turn++; B.played = 0; B.onewayUsed = false;
  if (P.st.parking) { delete P.st.parking; } else if (P.block > 0) { P.block = 0; for (const w of P.walls) w.fly = { vx: rnd(-1, 1), vy: rnd(-2, -1), r: rnd(-0.2, 0.2), fade: 1 }; P.brokenWalls = P.walls; P.walls = []; }
  if (P.st.rust) { yield* rustTick(P); if (B.over) return; }
  // hazards count down
  for (const h of [...B.hazards]) { h.turns--; vis({ k: 'hzpulse', h, life: 16 }); }
  if (B.hazards.length) { Snd.play('tick', { pitch: 0.9 }); yield 10; }
  for (const h of B.hazards.filter(h => h.turns <= 0)) { yield* triggerHazard(h); if (B.over) return; }
  // energy & powers
  let e = B.maxEnergy + (hasRelic('v8') ? 1 : 0) + (hasRelic('bigtank') ? 1 : 0) + (first && hasRelic('lantern') ? 1 : 0);
  let drawN = 5 + (P.st.highway || 0) + (hasRelic('navipro') ? 1 : 0) + (first && hasRelic('thermos') ? 2 : 0) - (P.st.dark || 0);
  delete P.st.dark;
  if (P.st.roadwork) { yield* A.block(P.rwAmt || 5, 'rail', true); P.st.roadwork--; if (P.st.roadwork <= 0) delete P.st.roadwork; }
  if (P.st.signal) {
    const ph = P.sigPhase % 3; P.sigPhase++; vis({ k: 'signal', ph, life: 40 });
    if (ph === 0) { e += 1; Snd.play('energy'); } else if (ph === 1) drawN += 2; else yield* A.block(8, 'relic', true);
  }
  B.energy = e;
  if (hasRelic('wiper')) { const j = B.hand.find(c => CARDS[c.id].type === 'junk'); if (j) { B.hand.splice(B.hand.indexOf(j), 1); B.exhaust.push(j); } }
  B.phase = 'player';
  B.banner = { k: 'go', t: 0, life: 44 }; Snd.play('go'); yield SIM.on ? 0 : 16;
  yield* A.draw(Math.max(0, drawN));
}
function* endTurnSeq() {
  const P = B.P; B.phase = 'end';
  if (hasRelic('conehat') && P.block === 0) yield* A.block(5, 'cone', true);
  for (const c of B.hand) { const d = CARDS[c.id]; if (d.onEndInHand) { yield* A.loseHP(d.onEndInHand, true); if (B.over) return; } }
  // discard hand (retain stays; ethereal exhausts)
  let keep = hasRelic('cruise') ? 1 : 0;
  const stay = [];
  for (const c of B.hand) {
    if (cardKw(c, 'retain')) { stay.push(c); continue; }
    if (keep > 0 && CARDS[c.id].type !== 'junk') { keep--; stay.push(c); continue; }
    if (cardKw(c, 'ethereal')) { B.exhaust.push(c); c.gone = { to: 'exhaust', t: 0 }; }
    else { B.discard.push(c); c.gone = { to: 'discard', t: 0 }; }
  }
  B.limbo = B.hand.filter(c => !stay.includes(c)); B.hand = stay;
  if (B.limbo.length) { Snd.play('card', { pitch: 0.8 }); yield SIM.on ? 0 : 14; } B.limbo = [];
  yield* enemyTurn();
}
function* enemyTurn() {
  const P = B.P; B.phase = 'enemy';
  B.banner = { k: 'stop', t: 0, life: 40 }; Snd.play('stopTurn'); yield SIM.on ? 0 : 22;
  for (const e of B.alive()) { if (e.st.plated) {} e.block = 0; }
  for (const e of B.alive()) { if (e.st.rust) { yield* rustTick(e); yield* afterHit(); if (B.over) return; } }
  for (const e of [...B.alive()]) {
    if (!e.alive || B.over) continue;
    if (e.stopped) {
      e.stopped = false; e.last = 'stopped'; vis({ k: 'stopsign', x: e.x, y: e.y, h: e.h, life: 28, small: 1 }); label(e.x, e.y - e.h - 16, '...', '#c7ccd6'); Snd.play('beep', { x: e.x, pitch: 0.6 }); yield SIM.on ? 0 : 24;
      continue;
    }
    const mv = e.def.moves[e.next]; e.acting = true;
    yield* mv.act(e);
    e.acting = false; e.last = e.next; yield SIM.on ? 0 : 8;
    yield* afterHit();
    if (B.over) return;
  }
  // end of round: statuses tick
  for (const t of [P, ...B.alive()]) {
    for (const id of ['slow', 'dent', 'nopark']) { if (!t.st[id]) continue; if (t.fresh[id]) { t.fresh[id] = false; continue; } t.st[id]--; if (t.st[id] <= 0) delete t.st[id]; }
    if (!t.isP) { if (t.st.grow) t.st.str = (t.st.str || 0) + t.st.grow; if (t.st.plated) t.block += t.st.plated; }
  }
  for (const e of B.alive()) { e.next = e.def.ai(e, B); }
  B.refreshIntents();
  if (B.over) return;
  yield* startPlayerTurn(false);
}

// ============================================================
//  player commands (called by the UI)
// ============================================================
function cardCost(c) {
  const d = CARDS[c.id]; if (d.cost < 0) return -1;
  const v = cardVals(c); let k = v.cost != null ? v.cost : d.cost;
  if (c.tmpCost != null) k = c.tmpCost;
  if (B && B.firstCardFree && B.totalPlayed === 0) k = 0;
  return k;
}
function canPlay(c) {
  if (!B || B.over || B.phase !== 'player' || Q.busy() || B.choose) return false;
  const d = CARDS[c.id]; if (d.cost < 0 || cardKw(c, 'unplayable')) return false;
  return cardCost(c) <= B.energy;
}
function playCard(c, t) {
  if (!canPlay(c)) return false;
  const d = CARDS[c.id]; if (d.tgt === 'enemy' && (!t || !t.alive)) return false;
  B.energy -= cardCost(c); B.hand.splice(B.hand.indexOf(c), 1);
  c.play = { t: 0, tx: d.tgt === 'enemy' ? t.x : W / 2, ty: d.tgt === 'enemy' ? t.y - t.h / 2 : 120 }; B.limbo = [c];
  Snd.play('cardPlay', { p: 0.5 });
  Q.push(playSeq(c, t));
  return true;
}
function* playSeq(c, t) {
  const d = CARDS[c.id], v = cardVals(c), P = B.P;
  yield SIM.on ? 0 : 9;
  B.played++; B.totalPlayed++; B.run.stats.cards = (B.run.stats.cards || 0) + 1;
  if (!SIM.on) Fx.pixelBurst(c.play.tx, c.play.ty, typeColors(d.type), 22);
  B.limbo = [];
  let times = 1;
  if (P.st.mirror) { times++; delete P.st.mirror; label(P.x, P.y - 58, 'MIRROR', '#ffd0a0'); }
  if (d.type === 'atk' && P.st.oneway && !B.onewayUsed) { B.onewayUsed = true; times++; }
  for (let k = 0; k < times; k++) {
    let tgt = t;
    if (d.tgt === 'enemy' && (!tgt || !tgt.alive)) { tgt = B.rng.pick(B.alive()); if (!tgt) break; }
    if (d.play) yield* d.play(c, v, tgt);
    yield* afterHit();
    if (B.over) break;
    if (k < times - 1) yield 6;
  }
  if (d.type === 'atk' && P.st.convoy && !B.over) yield* A.block(P.st.convoy, 'relic', true);
  // odometer
  if (hasRelic('odometer')) { B.odo = (B.odo || 0) + 1; if (B.odo >= 10) { B.odo = 0; vis({ k: 'relicpop', id: 'odometer', life: 30 }); yield* A.energy(1); } }
  // destination
  if (d.type === 'pwr') { B.powers.push(c); }
  else if (cardKw(c, 'exhaust')) { B.exhaust.push(c); if (!SIM.on) { Snd.play('exhaust'); vis({ k: 'exhaust', c, life: 26 }); } }
  else B.discard.push(c);
  yield 4;
  B.refreshIntents();
}
function typeColors(t) { return t === 'atk' ? ['#ff6b7a', '#ffd0d8', '#ffffff'] : t === 'def' ? ['#7fb8ff', '#d8ecff', '#ffffff'] : t === 'pwr' ? ['#ffd23f', '#fff3b0', '#ffffff'] : ['#b58cff', '#e8dcff', '#ffffff']; }
function endTurn() {
  if (!B || B.over || B.phase !== 'player' || Q.busy() || B.choose) return false;
  Q.push(endTurnSeq()); return true;
}
function useCan(slot, t) {
  const id = B.run.cans[slot]; if (!id || B.over || B.phase !== 'player' || Q.busy()) return false;
  const d = CANS[id]; if (d.tgt === 'enemy' && (!t || !t.alive)) return false;
  B.run.cans[slot] = null; Snd.play('clink', { pitch: 1.2 });
  Q.push((function* () { vis({ k: 'canpop', id, life: 24 }); yield 8; yield* d.use(t); yield* afterHit(); B.refreshIntents(); })());
  return true;
}
