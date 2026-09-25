'use strict';
// ============================================================
//  act 2 & 3 enemies (definitions + drawings) and the two later bosses
// ============================================================
// ---------- extra enemy actions ----------
EA.steal = function* (e) {
  const it = e.def.moves[e.next].it; e.pose = 'atk'; e.pt = 0; yield 8;
  if (B.hand.length) {
    const c = B.rng.pick(B.hand); B.hand.splice(B.hand.indexOf(c), 1); (e.grab = e.grab || []).push(c); e.st.grab = e.grab.length;
    vis({ k: 'grabcard', c, e, life: 30 }); Snd.play('clink', { x: e.x, pitch: 0.7 }); label(e.x, e.y - e.h - 18, 'GRAB!', '#ffd23f'); yield 14;
  }
  if (it.d) yield* EA.hitP(e, it.d);
  e.pose = 'idle'; yield 8;
};
EA.summon = function* (e, id, n = 1) {
  for (let i = 0; i < n; i++) {
    if (B.alive().length >= 5) break;
    const s = B.addEnemy(id, true); s.enter = 1; s.y = GY; s.dropY = -60; Snd.play('land', { x: s.x, p: 0.6 }); Fx.dust(s.x, GY, 5, 1); yield 12;
  }
  B.layout(false); yield 10;
};
EA.healAlly = function* (e, n) {
  const t = B.alive().slice().sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0]; if (!t) return;
  const h = Math.min(n, t.maxhp - t.hp); t.hp += h; Fx.num(t.x, t.y - t.h - 8, '+' + h, { c: '#7dff9a' }); Fx.ring(t.x, t.y - t.h / 2, 3, 22, 14, '#7dff9a', 2); Snd.play('heal', { x: t.x }); yield 14;
};
EA.breakBlock = function* () { const P = B.P; if (P.block > 0) { Fx.sparks(P.x + 10, P.y - 20, 8, -1, '#9ff0ff'); label(P.x, P.y - 52, 'BREAK', '#9ff0ff'); for (const w of P.walls) w.fly = { vx: rnd(1, 4), vy: rnd(-5, -2), r: 0 }; P.brokenWalls = P.walls; P.walls = []; P.block = 0; Snd.play('heavy', { x: P.x, p: 0.5, pitch: 1.3 }); } yield 8; };

// ---------- definitions ----------
Object.assign(ENEMIES, {
  washer: {
    jp: '洗濯機', hp: [34, 38], w: 36, h: 44, draw: 'washer',
    moves: {
      spin: { it: { type: 'atk', d: 4, n: 3 }, *act(e) { Snd.play('spin', { x: e.x }); yield* EA.lunge(e, 'spin', 10); } },
      rinse: { it: { type: 'debuff', note: '水をかける' }, *act(e) { yield* EA.pose(e, 'buff', 12); for (let i = 0; i < 14; i++) Fx.add({ k: 'dust', x: e.x - 16, y: e.y - 24, vx: -rnd(2, 5), vy: rnd(-1.5, 0.5), r: rnd(1.5, 3), life: 24, c: '#9fd0ff' }); yield 10; yield* EA.debuff(B.P, 'slow', 2); yield* EA.debuff(B.P, 'dent', 1); } },
    },
    ai(e) { return e.last === 'spin' ? 'rinse' : e.last === 'rinse' ? 'spin' : e.rng.pick(['spin', 'rinse']); },
  },
  tv: {
    jp: 'テレビ', hp: [28, 32], w: 36, h: 38, draw: 'tv',
    moves: {
      static: { it: { type: 'debuff', note: 'ノイズを 2 枚混ぜる' }, *act(e) { yield* EA.pose(e, 'buff', 10); Snd.play('static', { x: e.x }); yield* EA.addCards('noise', 'discard', 2); } },
      beam: { it: { type: 'atk', d: 11 }, *act(e) { yield* EA.laser(e); } },
    },
    ai(e) { if (e.last === 'static') return 'beam'; return e.rng.chance(0.45) ? 'static' : 'beam'; },
  },
  cart: {
    jp: 'カート', hp: [24, 28], w: 38, h: 32, draw: 'cart',
    moves: {
      ready: { it: { type: 'charge', note: '次のターン 突進' }, *act(e) { yield* EA.pose(e, 'buff', 16); Snd.play('charge', { x: e.x }); } },
      rush: { it: { type: 'atk', d: 16 }, *act(e) { yield* EA.lunge(e, 'rush', 40); } },
      load: { it: { type: 'def' }, *act(e) { yield* EA.pose(e, 'buff', 10); yield* EA.block(e, 8); } },
    },
    ai(e) { return ({ ready: 'rush', rush: 'load', load: 'ready' })[e.last] || e.rng.pick(['ready', 'load']); },
  },
  cooker: {
    jp: '炊飯器', hp: [30, 34], w: 30, h: 28, draw: 'cooker',
    moves: {
      pinch: { it: { type: 'atk', d: 6 }, *act(e) { yield* EA.lunge(e, 'pinch'); } },
      steam: { it: { type: 'def', note: '仲間全員に ブロック 6' }, *act(e) { yield* EA.pose(e, 'buff', 10); Fx.smoke(e.x, e.y - e.h, 6, 0.8, '#f6f4ee'); for (const o of B.alive()) yield* EA.block(o, 6, true); } },
      warm: { it: { type: 'heal', note: 'いちばん弱った仲間を 8 回復' }, *act(e) { yield* EA.pose(e, 'buff', 10); yield* EA.healAlly(e, 8); } },
    },
    ai(e) { const opts = ['pinch', 'steam', 'warm'].filter(m => m !== e.last); return e.rng.pick(opts); },
  },
  claw: {
    jp: 'クレーンゲーム', hp: [88, 92], w: 56, h: 86, draw: 'claw', tier: 'elite',
    moves: {
      grab: { it: { type: 'steal', d: 8, note: '手札を 1 枚つかむ' }, *act(e) { yield* EA.steal(e); } },
      drop: { it: { type: 'atk', d: 18 }, *act(e) { yield* EA.lunge(e, 'drop', 8); } },
      tilt: { it: { type: 'buff', note: 'ブロック 14・馬力 +2' }, *act(e) { yield* EA.pose(e, 'buff', 14); yield* EA.block(e, 14); yield* EA.buff(e, 'str', 2); } },
    },
    ai(e) { return ({ grab: 'drop', drop: 'tilt', tilt: 'grab' })[e.last] || 'grab'; },
  },
  vend2: {
    jp: '自販機（大型）', hp: [96, 100], w: 42, h: 68, draw: 'vend', variant: 1, tier: 'elite',
    moves: {
      dispense: { it: { type: 'atk', d: 7, n: 2 }, *act(e) { yield* EA.shoot(e, 'can'); } },
      charge: { it: { type: 'charge', note: '次のターン 大突進' }, *act(e) { yield* EA.pose(e, 'buff', 20); Snd.play('roar', { x: e.x }); Cam.shake(0.15); } },
      slam: { it: { type: 'atk', d: 24, deb: 1 }, *act(e) { yield* EA.lunge(e, 'slam', 26); if (!B.over) yield* EA.debuff(B.P, 'dent', 2); } },
      restock: { it: { type: 'buff' }, *act(e) { yield* EA.pose(e, 'buff', 18); yield* EA.block(e, 16); yield* EA.buff(e, 'str', 3); } },
    },
    ai(e) { return ({ dispense: 'charge', charge: 'slam', slam: 'restock', restock: 'dispense' })[e.last] || 'dispense'; },
  },
  signal: {
    jp: '信号機ロボ', hp: [176, 176], w: 64, h: 122, draw: 'signal', tier: 'boss',
    moves: {
      red: { it: { type: 'def', note: '赤信号：攻撃カードを使うと 3 ダメージ' }, *act(e) { e.light = 0; yield* EA.pose(e, 'buff', 16); yield* EA.block(e, 16); e.st.redlight = 3; vis({ k: 'stpop', id: 'redlight', x: e.x, y: e.y - e.h - 12, life: 30 }); Snd.play('beep', { x: e.x, pitch: 0.5 }); yield 10; } },
      yellow: { it: { type: 'buff', note: '全員 馬力 +2・コーンを呼ぶ' }, *act(e) { e.light = 1; delete e.st.redlight; yield* EA.pose(e, 'buff', 16); for (const o of B.alive()) yield* EA.buff(o, 'str', 2); yield* EA.summon(e, 'cone', 1); } },
      green: { it: { type: 'atk', d: 5, n: 4 }, *act(e) { e.light = 2; delete e.st.redlight; yield* EA.lunge(e, 'green', 20); } },
    },
    ai(e) { return ({ red: 'yellow', yellow: 'green', green: 'red' })[e.last] || 'red'; },
    onHalf(e) { return EA.phase2(e, 3); },
  },
  fridge: {
    jp: '冷蔵庫', hp: [50, 56], w: 38, h: 62, draw: 'fridge',
    moves: {
      slam: { it: { type: 'atk', d: 15 }, *act(e) { yield* EA.lunge(e, 'slam', 14); } },
      freeze: { it: { type: 'debuff', note: '冷気' }, *act(e) { e.pose = 'buff'; e.pt = 0; for (let i = 0; i < 20; i++) Fx.add({ k: 'dust', x: e.x - 14, y: e.y - 30, vx: -rnd(1.5, 4), vy: rnd(-0.8, 0.8), r: rnd(2, 4), life: 30, c: '#dff4ff' }); yield 14; yield* EA.debuff(B.P, 'dent', 2); yield* EA.debuff(B.P, 'slow', 1); e.pose = 'idle'; } },
      chill: { it: { type: 'def' }, *act(e) { yield* EA.pose(e, 'buff', 10); yield* EA.block(e, 14); } },
    },
    ai(e) { const o = ['slam', 'freeze', 'chill'].filter(m => m !== e.last); return e.rng.pick(o); },
  },
  lamp: {
    jp: '街灯', hp: [36, 40], w: 20, h: 78, draw: 'lamp',
    moves: {
      flicker: { it: { type: 'atk', d: 5, deb: 1, note: '次のターン 引く枚数 -1' }, *act(e) { yield* EA.laser(e); if (!B.over) { B.P.st.dark = (B.P.st.dark || 0) + 1; vis({ k: 'stpop', id: 'dark', x: B.P.x, y: B.P.y - 50, life: 26 }); Snd.play('debuff'); yield 8; } } },
      zap: { it: { type: 'atk', d: 12 }, *act(e) { yield* EA.laser(e); } },
    },
    ai(e) { return e.last === 'flicker' ? 'zap' : 'flicker'; },
  },
  drone: {
    jp: 'ドローン', hp: [20, 23], w: 26, h: 44, draw: 'drone', fly: 1,
    moves: {
      shoot: { it: { type: 'atk', d: 4, n: 2 }, *act(e) { yield* EA.shoot(e, 'orb'); } },
      dive: { it: { type: 'atk', d: 10 }, *act(e) { yield* EA.lunge(e, 'dive', 30); } },
    },
    ai(e) { e.cnt = (e.cnt || 0) + 1; return e.cnt % 3 === 0 ? 'dive' : 'shoot'; },
  },
  truck: {
    jp: '軽トラ', hp: [125, 130], w: 104, h: 64, draw: 'truck', tier: 'elite',
    moves: {
      honk: { it: { type: 'debuff', note: 'クラクション' }, *act(e) { yield* EA.pose(e, 'buff', 8); Snd.play('honk', { x: e.x }); for (let i = 1; i <= 3; i++) Fx.ring(e.x - 50, e.y - 30, 4, 20 + i * 26, 18, '#fff3a0', 2); Cam.shake(0.2); yield 10; yield* EA.debuff(B.P, 'dent', 1); yield* EA.debuff(B.P, 'slow', 2); } },
      rev: { it: { type: 'charge', note: '次のターン 突っ込む' }, *act(e) { yield* EA.pose(e, 'buff', 20); Snd.play('roar', { x: e.x }); Cam.shake(0.25); } },
      crash: { it: { type: 'atk', d: 26 }, *act(e) { yield* EA.lunge(e, 'crash', 60); } },
      unload: { it: { type: 'summon', note: 'コーンを 2 つ降ろす・ブロック 10' }, *act(e) { yield* EA.pose(e, 'buff', 10); yield* EA.summon(e, 'cone', 2); yield* EA.block(e, 10); } },
    },
    ai(e) { return ({ honk: 'rev', rev: 'crash', crash: 'unload', unload: 'honk' })[e.last] || 'honk'; },
  },
  demolisher: {
    jp: '解体機', hp: [240, 240], w: 120, h: 118, draw: 'demolisher', tier: 'boss',
    moves: {
      sweep: { it: { type: 'atk', d: 12, note: 'ブロックを壊してから攻撃' }, *act(e) { e.arm = 'sweep'; e.pose = 'atk'; e.pt = 0; yield 10; yield* EA.breakBlock(); yield* EA.hitP(e, e.def.moves.sweep.it.d); yield 16; e.arm = null; e.pose = 'idle'; } },
      raise: { it: { type: 'charge', note: '次のターン 叩きつけ' }, *act(e) { e.arm = 'raise'; Snd.play('charge', { x: e.x }); Cam.shake(0.15); yield 24; } },
      slam: { it: { type: 'atk', d: 28 }, *act(e) { e.arm = 'slam'; e.pose = 'atk'; e.pt = 0; yield 12; Cam.shake(0.8); Cam.punch(0.05); Snd.play('mega', { x: B.P.x }); Fx.dust(B.P.x, GY, 12, 2); Fx.crack(B.P.x, GY, 12); yield* EA.hitP(e, e.def.moves.slam.it.d); yield 20; e.arm = null; e.pose = 'idle'; } },
      missiles: { it: { type: 'atk', d: 4, n: 5 }, *act(e) { e.pose = 'buff'; e.pt = 0; Snd.play('whoosh', { x: e.x, p: 0.6 }); yield 16; for (let i = 0; i < 5; i++) { vis({ k: 'missile', x: B.P.x + rnd(-14, 14), life: 16 }); yield 8; Snd.play('explode', { x: B.P.x, p: 0.4, gap: 0.01 }); Fx.fire(B.P.x, GY - 10, 4, 1.2); yield* EA.hitP(e, e.def.moves.missiles.it.d); if (B.over) break; } e.pose = 'idle'; } },
      summon: { it: { type: 'summon', note: 'ドラム缶を 2 つ落とす' }, *act(e) { yield* EA.pose(e, 'buff', 10); yield* EA.summon(e, 'drum', 2); } },
    },
    ai(e) { const seq = e.phase === 2 ? ['sweep', 'raise', 'slam', 'summon', 'missiles'] : ['sweep', 'raise', 'slam', 'missiles']; e.si = ((e.si == null ? -1 : e.si) + 1) % seq.length; return seq[e.si]; },
    onHalf(e) { return EA.phase2(e, 2); },
  },
});
for (const id in ENEMIES) ENEMIES[id].id = id;
ENCOUNTERS.push(
  { weak: [], normal: [['washer', 'cone'], ['tv', 'cart'], ['cart', 'cart'], ['cam', 'washer'], ['tv', 'cooker'], ['cooker', 'cart', 'cone'], ['washer', 'fan'], ['mw', 'mw', 'cooker']], elite: [['claw'], ['vend2']], boss: [['signal']] },
  { weak: [], normal: [['fridge'], ['lamp', 'drone', 'drone'], ['fridge', 'lamp'], ['drone', 'drone', 'drone'], ['tv', 'fridge'], ['cart', 'lamp'], ['washer', 'drone', 'cooker'], ['drum', 'drum', 'lamp']], elite: [['truck'], ['fridge', 'fridge']], boss: [['demolisher']] },
);

// ---------- red light: attacking while the signal robot shows red costs HP ----------
const _playSeq0 = playSeq;
playSeq = function* (c, t) {
  const red = B.alive().find(e => e.st.redlight);
  if (red && CARDS[c.id].type === 'atk') { label(B.P.x, B.P.y - 60, '信号無視', '#ff4d5a'); yield* A.loseHP(red.st.redlight, true); if (B.over) return; }
  yield* _playSeq0(c, t);
};

// ============================================================
//  drawings
// ============================================================
EDRAW.washer = (e, X, Y, t) => {
  const spin = e.pose === 'atk'; const sh = spin ? Math.sin(t * 1.4) * 1.5 : 0;
  R.begin(X + sh, Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.15 : 0, 0, -20);
  R.rect(-15, -5, 5, 5, tint('#4b4658')); R.rect(10, -5, 5, 5, tint('#4b4658'));
  R.rect(-18, -44, 36, 39, tint('#e8e6e0'));
  R.flush(OUT);
  R.drect(-18, -44, 36, 2, tint('#ffffff')); R.drect(14, -44, 4, 39, tint('#c8c6c0')); R.drect(-18, -34, 36, 1, tint('#b8b6b0'));
  // panel
  R.drect(-16, -42, 20, 7, tint('#3a3e4a')); const ec = e.stopped ? '#6a6a78' : e.intent && e.intent.type === 'atk' ? '#ff4d5a' : '#7dff9a';
  R.drect(-13, -40, 3, 2, ec); R.drect(-7, -40, 3, 2, ec); R.dell(9, -38.5, 3, 3, tint('#9aa0ad')); R.dline(9, -38.5, 9 + Math.cos(t * 0.1) * 2, -38.5 + Math.sin(t * 0.1) * 2, OUT);
  // door
  R.dell(-1, -18, 13, 13, tint('#9aa0ad')); R.dell(-1, -18, 11, 11, OUT); R.dell(-1, -18, 10, 10, tint('#5a8ac8'));
  const a = t * (spin ? 0.5 : 0.05); for (let i = 0; i < 3; i++) { const b = a + i * TAU / 3; R.dline(-1 + Math.cos(b) * 3, -18 + Math.sin(b) * 3, -1 + Math.cos(b + 0.8) * 8, -18 + Math.sin(b + 0.8) * 8, tint('#9fd0ff')); }
  R.dell(-1, -12, 9, 3, tint('#3a6aa8')); R.px(-6, -24, '#ffffff'); R.px(-5, -23, '#ffffff');
  e._eye = R.tx(-9, -39).slice();
};
EDRAW.tv = (e, X, Y, t) => {
  const beam = e.pose === 'atk', stat = e.pose === 'buff' || (e.intent && e.intent.move === 'static' && (t / 20 | 0) % 3 === 0);
  R.begin(X, Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.15 : 0, 0, -18);
  R.rect(-12, -6, 3, 6, tint('#4b4658')); R.rect(9, -6, 3, 6, tint('#4b4658'));
  R.rect(-18, -32, 36, 26, tint('#8a6a4a')); R.line(-4, -32, -12, -44, tint('#6d6577'), 1); R.line(4, -32, 12, -44, tint('#6d6577'), 1);
  R.flush(OUT);
  R.drect(-18, -32, 36, 2, tint('#aa8a6a')); R.drect(9, -29, 7, 20, tint('#6a4a34')); R.dell(12.5, -24, 2, 2, tint('#c7ccd6')); R.dell(12.5, -17, 2, 2, tint('#c7ccd6'));
  R.drect(-16, -29, 24, 20, OUT);
  if (stat || e.stopped) { for (let j = 0; j < 18; j += 2) for (let i = 0; i < 22; i += 2) R.drect(-15 + i, -28 + j, 2, 2, Math.random() < 0.5 ? '#d8d8e0' : '#4a4a58'); }
  else {
    R.drect(-15, -28, 22, 18, beam ? '#fff0f8' : tint('#2a3a5a')); const ec = beam ? '#ff4f9a' : '#8fd8ff';
    R.drect(-11, -24, 4, 3, ec); R.drect(-3, -24, 4, 3, ec); if (e.intent && e.intent.type === 'atk') { R.dline(-12, -26, -7, -25, ec); R.dline(1, -26, -4, -25, ec); }
    R.drect(-9, -16, 8, 2, ec); for (let j = -27; j < -10; j += 2) R.drect(-15, j, 22, 1, 'rgba(0,0,0,0.18)');
  }
  R.px(-12, -44, '#ff4d5a'); R.px(12, -44, '#ff4d5a');
  e._eye = R.tx(-5, -20).slice(); e._cy = e.y - 20;
};
EDRAW.cart = (e, X, Y, t) => {
  const rush = e.pose === 'atk'; const k = rush ? Math.sin(clamp(e.pt / 22, 0, 1) * Math.PI) : 0; const rdy = e.intent && e.intent.type === 'charge';
  R.begin(X - k * 30, Y, -1, e.sx, e.sy, rdy ? Math.sin(t * 0.7) * 0.05 : rush ? 0.08 : 0, 0, -14);
  R.rect(-18, -28, 32, 18, tint('#c7ccd6')); R.line(14, -28, 22, -34, tint('#9aa0ad'), 2); R.rect(20, -36, 3, 4, tint('#e0415a'));
  R.ell(-12, -3, 3, 3, OUT); R.ell(8, -3, 3, 3, OUT);
  R.flush(OUT);
  for (let x = -16; x < 14; x += 4) R.drect(x, -27, 1, 16, tint('#8a909c')); for (let y = -24; y < -11; y += 4) R.drect(-18, y, 32, 1, tint('#8a909c'));
  R.dline(-16, -10, 10, -10, tint('#6d7380')); R.dline(-10, -10, -12, -5, tint('#6d7380')); R.dline(6, -10, 8, -5, tint('#6d7380'));
  R.drect(-14, -34, 6, 7, tint('#e8534f')); R.drect(-7, -32, 5, 5, tint('#4f8fe8')); R.drect(-2, -36, 6, 9, tint('#f2c14e'));
  const ec = e.stopped ? '#6a6a78' : rdy || rush ? '#ff4d5a' : '#ffd23f'; R.dell(-16, -20, 3, 3, OUT); R.dell(-16, -20, 2, 2, ec);
  R.dell(-12, -3, 2, 2, tint('#6d7380')); R.dell(8, -3, 2, 2, tint('#6d7380'));
  if (rush && (t | 0) % 2) Fx.dust(e.x - k * 30 + 12, e.y, 1, 0.6);
  e._eye = R.tx(-16, -20).slice();
};
EDRAW.cooker = (e, X, Y, t) => {
  R.begin(X, Y + (e.pose === 'atk' ? -Math.sin(clamp(e.pt / 18, 0, 1) * Math.PI) * 6 : 0), -1, e.sx, e.sy, e.pose === 'hurt' ? -0.2 : 0, 0, -12);
  R.ell(0, -12, 15, 12, tint('#f2e8ec')); R.rect(-15, -12, 30, 10, tint('#f2e8ec')); R.ell(0, -22, 13, 5, tint('#e8b8c8'));
  R.flush(OUT);
  R.drect(-15, -6, 30, 2, tint('#d8c8d0')); R.dell(-3, -21, 6, 2, tint('#f6d8e2')); R.drect(9, -26, 3, 3, tint('#9aa0ad'));
  R.drect(-6, -14, 12, 6, OUT); const ec = e.stopped ? '#6a6a78' : '#ff9a4a'; R.drect(-4, -12, 2, 2, ec); R.drect(2, -12, 2, 2, ec);
  if ((t | 0) % 20 === 0 && !SIM.on) Fx.smoke(e.x + 10, e.y - 28, 1, 0.4, '#f6f4ee');
  e._eye = R.tx(0, -11).slice();
};
EDRAW.claw = (e, X, Y, t) => {
  const grab = e.pose === 'atk';
  R.begin(X, Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.06 : 0, 0, -40);
  R.rect(-26, -30, 52, 30, tint('#e0415a')); R.rect(-28, -86, 56, 58, tint('#f2c14e')); R.rect(-30, -94, 60, 10, tint('#e0415a'));
  R.flush(OUT);
  R.drect(-24, -82, 48, 48, '#bfe8ff'); R.drect(-24, -82, 48, 2, '#ffffff');
  // prizes
  for (let i = 0; i < 7; i++) { const px2 = -20 + i * 6.5, py = -40 - (i % 2) * 4; R.dell(px2, py, 3.5, 3.5, tint(['#ff9fb0', '#8fd8ff', '#ffd23f', '#7dff9a', '#b58cff'][i % 5])); R.px(px2 - 1, py - 1, '#1e1c28'); R.px(px2 + 1, py - 1, '#1e1c28'); }
  // claw
  const cx0 = Math.sin(t * 0.03) * 12 + (grab ? -8 : 0), cyd = grab ? Math.sin(clamp(e.pt / 20, 0, 1) * Math.PI) * 26 : 4 + Math.sin(t * 0.05) * 2;
  R.dline(cx0, -82, cx0, -70 + cyd, OUT); R.drect(cx0 - 3, -71 + cyd, 6, 3, tint('#9aa0ad'));
  R.dline(cx0 - 2, -68 + cyd, cx0 - 5, -63 + cyd, tint('#6d7380'), 2); R.dline(cx0 + 2, -68 + cyd, cx0 + 5, -63 + cyd, tint('#6d7380'), 2);
  // marquee
  const on = (t / 10 | 0) % 2; for (let i = 0; i < 8; i++) R.px(-26 + i * 7.5, -90, (i + (on ? 1 : 0)) % 2 ? '#fff3a0' : tint('#8a2a3a'));
  R.drect(-10, -24, 20, 6, OUT); R.drect(-8, -22, 5, 2, '#ffd23f'); R.drect(3, -22, 5, 2, '#ffd23f');
  const ec = e.stopped ? '#6a6a78' : grab ? '#ff4d5a' : '#7dff9a'; R.drect(-14, -14, 4, 3, ec); R.drect(10, -14, 4, 3, ec);
  e._eye = R.tx(0, -60).slice(); e._glowFront = R.tx(0, -60).slice();
};
EDRAW.signal = (e, X, Y, t) => {
  const light = e.light != null ? e.light : ({ red: 0, yellow: 1, green: 2 })[e.intent && e.intent.move] ?? 0;
  const atk = e.pose === 'atk'; const armA = atk ? -0.3 + Math.sin(e.pt * 0.6) * 0.8 : 0.4 + Math.sin(t * 0.04) * 0.1;
  R.begin(X, Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.05 : 0, 0, -60);
  R.rect(-12, -10, 8, 10, tint('#4b4658')); R.rect(4, -10, 8, 10, tint('#4b4658'));
  R.rect(-6, -80, 12, 72, tint('#8d98a3'));
  R.rect(-26, -124, 52, 46, tint('#3a4048')); R.rect(-28, -126, 56, 4, tint('#2a2e36'));
  const sh = [-4, -66], hand = [sh[0] + Math.cos(armA + Math.PI) * 30, sh[1] + Math.sin(armA + Math.PI) * 24];
  R.line(sh[0], sh[1], hand[0], hand[1], tint('#6d7380'), 4); R.rect(hand[0] - 9, hand[1] - 9, 18, 18, tint('#2a2e36'));
  const sh2 = [4, -66], hand2 = [sh2[0] + Math.cos(-armA) * 24, sh2[1] + Math.sin(-armA) * 20];
  R.line(sh2[0], sh2[1], hand2[0], hand2[1], tint('#6d7380'), 4); R.rect(hand2[0] - 9, hand2[1] - 9, 18, 18, tint('#2a2e36'));
  R.flush(OUT);
  // three lamps
  const cols = [['#ff4d5a', '#4a1418'], ['#ffc23c', '#4a3a12'], ['#2fd07a', '#123a24']];
  for (let i = 0; i < 3; i++) { const lx = -14 + i * 14, ly = -101; R.dell(lx, ly, 6.5, 6.5, OUT); const on = i === light && !e.stopped; R.dell(lx, ly, 5.5, 5.5, on ? cols[i][0] : cols[i][1]); if (on) { R.drect(lx - 2, ly - 3, 2, 2, '#ffffff'); } R.drect(lx - 7, ly - 9, 14, 2, tint('#2a2e36')); }
  // pedestrian signal fists
  const man = (hx, hy, walk) => { R.drect(hx - 7, hy - 7, 14, 14, '#15121c'); const c = walk ? '#2fd07a' : '#ff4d5a'; R.dell(hx, hy - 4, 1.5, 1.5, c); R.drect(hx - 1, hy - 2, 2, 5, c); if (walk) { R.dline(hx, hy + 3, hx - 2, hy + 6, c); R.dline(hx, hy + 3, hx + 2, hy + 6, c); } else { R.drect(hx - 2, hy + 3, 1, 3, c); R.drect(hx + 1, hy + 3, 1, 3, c); } };
  man(hand[0], hand[1], light === 2); man(hand2[0], hand2[1], light === 2);
  for (let k = 0; k < 6; k++) R.px(-5 + hash2(k, 3) * 10, -76 + hash2(3, k) * 60, tint('#a4643a'));
  e._eye = R.tx(-14 + light * 14, -101).slice(); e._lightCol = cols[light][0];
};
EDRAW.fridge = (e, X, Y, t) => {
  const open = e.pose === 'buff' && e.intent && e.intent.move === 'freeze' || (e.pose === 'buff' && e.pt < 16);
  R.begin(X + (e.pose === 'atk' ? -Math.sin(clamp(e.pt / 20, 0, 1) * Math.PI) * 14 : 0), Y, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.1 : 0, 0, -30);
  R.rect(-16, -4, 5, 4, tint('#4b4658')); R.rect(11, -4, 5, 4, tint('#4b4658'));
  R.rect(-19, -62, 38, 58, tint('#dfe8ee'));
  if (open) R.poly([-19, -60, -30, -54, -30, -40, -19, -44], tint('#c8d4dc'));
  R.flush(OUT);
  R.drect(-19, -62, 38, 2, tint('#ffffff')); R.drect(15, -62, 4, 58, tint('#c0ccd4')); R.drect(-19, -44, 38, 2, tint('#9aa6b0'));
  R.drect(12, -58, 2, 10, tint('#9aa6b0')); R.drect(12, -38, 2, 18, tint('#9aa6b0'));
  if (open) { R.drect(-18, -60, 20, 15, '#1e2a3a'); for (let i = 0; i < 4; i++) R.px(-16 + i * 5, -58, '#ffffff'); }
  const ec = e.stopped ? '#6a6a78' : e.intent && e.intent.type === 'atk' ? '#ff4d5a' : '#8fd8ff';
  R.drect(-10, -55, 4, 3, ec); R.drect(-2, -55, 4, 3, ec);
  R.drect(-12, -30, 6, 6, tint('#e8534f')); R.drect(-4, -28, 5, 5, tint('#ffd23f')); R.dell(4, -24, 3, 3, tint('#4f8fe8'));
  for (let k = 0; k < 6; k++) R.px(-17 + hash2(k, 5) * 32, -60 + hash2(5, k) * 54, tint('#ffffff'));
  e._eye = R.tx(-4, -54).slice();
};
EDRAW.lamp = (e, X, Y, t) => {
  const on = e.stopped ? false : (t / 5 | 0) % 17 !== 0;
  rectF(X - 3, Y - 76, 6, 76, OUT); rectF(X - 2, Y - 76, 4, 76, tint('#5a6070')); rectF(X - 1, Y - 76, 1, 76, tint('#8a90a0')); rectF(X - 7, Y - 4, 14, 4, OUT);
  R.begin(X, Y - 76, -1, e.sx, e.sy, e.pose === 'hurt' ? -0.2 : 0, 0, 0);
  R.line(0, 0, 10, -6, tint('#5a6070'), 2); R.rect(6, -10, 16, 6, tint('#3a4048'));
  R.flush(OUT);
  R.drect(8, -5, 12, 2, on ? '#fff3b0' : '#4a4a58'); const ec = e.intent && e.intent.type === 'atk' ? '#ff9a4a' : '#fff3b0';
  e._eye = R.tx(14, -4).slice(); e._on = on; e._ec = ec;
  if (on) { const p = e._eye; glow(p[0], p[1] + 6, 30, '#ffe7a0', 0.35); }
};
EDRAW.drone = (e, X, Y, t) => {
  const cy = Y - 34 + Math.sin(t * 0.08 + e.uid) * 3 + (e.pose === 'atk' && e.intent && e.intent.move === 'dive' ? Math.sin(clamp(e.pt / 18, 0, 1) * Math.PI) * 24 : 0);
  R.begin(X, cy, -1, e.sx, e.sy, e.pose === 'hurt' ? 0.3 : Math.sin(t * 0.05) * 0.08, 0, 0);
  R.rect(-9, -3, 18, 6, tint('#3a4048')); R.line(-9, -2, -14, -6, tint('#6d7380'), 1); R.line(9, -2, 14, -6, tint('#6d7380'), 1);
  R.flush(OUT);
  const bl = t * 0.9; for (const rx of [-14, 14]) { const w = Math.abs(Math.cos(bl + rx)) * 7 + 1; R.drect(rx - w, -8, w * 2, 1, '#c7ccd6'); }
  R.dell(-3, 3, 3, 2.5, OUT); const ec = e.stopped ? '#6a6a78' : e.intent && e.intent.type === 'atk' ? '#ff4d5a' : '#8fd8ff'; R.dell(-3, 3, 2, 1.5, ec);
  R.px(6, -2, (t | 0) % 20 < 10 ? '#ff4d5a' : '#6a2030');
  e._eye = R.tx(-3, 3).slice(); e._cy = cy;
};
EDRAW.truck = (e, X, Y, t) => {
  const crash = e.pose === 'atk'; const k = crash ? Math.sin(clamp(e.pt / 26, 0, 1) * Math.PI) : 0; const rev = e.intent && e.intent.type === 'charge';
  const shake = rev ? Math.sin(t * 1.5) * 0.7 : 0;
  R.begin(X - k * 70 + shake, Y, -1, e.sx, e.sy, crash ? 0.03 : 0, 0, -20);
  R.ell(-30, -8, 8, 8, OUT); R.ell(34, -8, 8, 8, OUT);
  R.rect(-50, -40, 36, 30, tint('#f0eee8')); R.rect(-14, -30, 64, 20, tint('#dcd8cc')); R.rect(-14, -40, 64, 3, tint('#9aa0ad'));
  R.flush(OUT);
  R.drect(-46, -37, 22, 12, tint('#3a4a6a')); R.dline(-44, -36, -38, -27, '#6a7a9a');
  R.drect(-50, -40, 36, 2, '#ffffff'); R.drect(-50, -16, 36, 3, tint('#6d7380'));
  const ec = e.stopped ? '#6a6a78' : rev || crash ? '#ff4d3a' : '#fff3b0';
  R.drect(-52, -22, 5, 5, OUT); R.drect(-51, -21, 3, 3, ec);
  for (let i = 0; i < 3; i++) R.drect(-52, -14 + i * 2, 4, 1, OUT);
  // cargo junk
  R.drect(-8, -48, 12, 10, tint('#b98c60')); R.drect(8, -46, 10, 8, tint('#6d7380')); ART.cone(26, -40 + 0);
  R.dell(-30, -8, 5, 5, tint('#3a3a44')); R.dell(-30, -8, 2, 2, tint('#9aa0ad')); R.dell(34, -8, 5, 5, tint('#3a3a44')); R.dell(34, -8, 2, 2, tint('#9aa0ad'));
  if (rev && (t | 0) % 4 === 0 && !SIM.on) Fx.smoke(e.x + 48, e.y - 12, 1, 0.6);
  e._eye = R.tx(-50, -20).slice();
};
EDRAW.demolisher = (e, X, Y, t) => {
  const f = -1, hurt = e.phase === 2;
  const body = tint('#d8b24a'), bodyD = tint('#a88430'), bodyH = tint('#f2d27a'), steel = tint('#6d7380'), steelD = tint('#474b58'), dark = tint('#2e2c3a');
  // arm target in world space
  const P = B ? B.P : { x: 108 }; const sxw = e.x - 8, syw = e.y - 88;
  let ax, ay;
  if (e.arm === 'raise') { ax = P.x + 10; ay = GY - 150 + Math.sin(t * 0.3) * 3; }
  else if (e.arm === 'slam') { const k = clamp(e.pt / 12, 0, 1); ax = P.x + 6; ay = lerp(GY - 150, GY - 10, easeIn(k)); }
  else if (e.arm === 'sweep') { const k = clamp(e.pt / 26, 0, 1); ax = lerp(e.x - 40, P.x - 40, easeInOut(k)); ay = GY - 22; }
  else { ax = e.x - 70 + Math.sin(t * 0.03) * 6; ay = GY - 130 + Math.sin(t * 0.05) * 5; }
  e._arm = [ax, ay];
  const ox = e.x - X, oy = e.y - Y; // world->lo offset
  R.begin(X, Y, 1);
  R.rect(-44, -26, 88, 26, steelD); R.ell(-40, -13, 13, 13, steelD); R.ell(40, -13, 13, 13, steelD);
  R.flush(OUT);
  for (let i = -46; i < 48; i += 6) { const k2 = ((i + t * (e.pose === 'atk' ? 1 : 0.1)) % 6 + 6) % 6; R.drect(i + k2 - 3, -26, 3, 2, steel); R.drect(i + k2 - 3, -2, 3, 2, steel); }
  for (const wx of [-32, -11, 11, 32]) { R.dell(wx, -13, 8, 8, steel); R.dell(wx, -13, 3, 3, dark); }
  R.begin(X, Y, f, e.sx, e.sy, e.pose === 'hurt' ? 0.03 : 0, 0, -60);
  R.rect(-30, -90, 58, 64, body); R.rect(-36, -48, 68, 22, bodyD); R.rect(-28, -108, 36, 20, body); R.rect(-34, -118, 8, 32, steel);
  // arm (world coords -> lo)
  const Sx = sxw - ox, Sy = syw - oy, Ax = ax - ox, Ay = ay - oy;
  const L1 = 70, L2 = 70; const d = Math.min(dist(Sx, Sy, Ax, Ay), L1 + L2 - 1); const base = Math.atan2(Ay - Sy, Ax - Sx);
  const ca = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)); const e1 = base + ca; const Ex = Sx + Math.cos(e1) * L1, Ey = Sy + Math.sin(e1) * L1;
  R.wline(Sx, Sy, Ex, Ey, body, 10); R.wline(Ex, Ey, Ax, Ay, steel, 7); R.well(Ex, Ey, 7, 7, steelD); R.well(Sx, Sy, 8, 8, steelD);
  const ca2 = Math.atan2(Ay - Ey, Ax - Ex); const open = e.arm === 'raise' ? 0.8 : 0.25;
  for (const s of [-1, 0, 1]) { const a = ca2 + s * open; const mx = Ax + Math.cos(a) * 15, my = Ay + Math.sin(a) * 15; R.wline(Ax, Ay, mx, my, steelD, s ? 5 : 4); R.wline(mx, my, mx + Math.cos(a - (s || 1) * 1.3) * 8, my + Math.sin(a - (s || 1) * 1.3) * 8, steelD, 3); }
  R.well(Ax, Ay, 8, 8, steel);
  R.flush(OUT);
  R.drect(-30, -90, 58, 2, bodyH); R.drect(22, -90, 6, 42, bodyD);
  for (let i = -34; i < 32; i += 8) R.dpoly([i, -48, i + 4, -48, i + 8, -42, i + 4, -42], dark);
  R.drect(-26, -105, 32, 13, dark); R.dline(-22, -104, -15, -94, tint('#4a4e64'));
  const eg = e.stopped ? '#5a5a68' : hurt ? '#ff2a3a' : '#ff4d5a'; R.dell(0, -98, 7, 5, tint('#5a1a24')); R.dell(0, -98, 4, 3, eg); R.dell(0, -98, 1.5, 1.5, '#ffe0e0');
  for (let i = 0; i < 5; i++) R.drect(-26 + i * 10, -74, 6, 12, i % 2 ? tint('#4a4658') : tint('#5a5668'));
  const on2 = (t | 0) % 30 < 15; R.drect(-10, -112, 6, 4, on2 ? '#ff4d3a' : tint('#7a2a2a'));
  if (hurt) { R.dline(-20, -84, -10, -68, OUT); R.dline(10, -74, 18, -64, OUT); }
  e._eye = R.tx(0, -98).slice();
  if ((t | 0) % 6 === 0 && !SIM.on) Fx.smoke(e.x + 30, e.y - 120, 1, 0.8, PSTAGE && PSTAGE.key === 'night' ? '#3a3e62' : '#9a9aa0');
};
