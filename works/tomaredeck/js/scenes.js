'use strict';
// ============================================================
//  scenes: title, kits, map, battle, reward, shop, rest, treasure, event, result, collection
// ============================================================
// ---------- retained-mode buttons (hit-tested in update, drawn in draw) ----------
const UIB = {
  hov: null,
  hit(list) {
    let h = null; for (const b of list) if (!b.hidden && In.in(b.x, b.y, b.w, b.h)) h = b;
    if (h && h.id !== this.hov && !h.disabled) Snd.play('hover', { pitch: 1.3 }); this.hov = h ? h.id : null;
    if (In.pressed && h) { if (h.disabled) { Snd.play('error'); return null; } Snd.play(h.snd || 'ui'); return h.id; }
    return null;
  },
  draw(list, t) {
    for (const b of list) {
      if (b.hidden) continue;
      const hov = this.hov === b.id && !b.disabled; const dn = hov && In.down ? 1 : 0;
      const base = b.disabled ? '#26222f' : hov ? (b.hc || '#4a4468') : (b.c || '#2f2a42');
      if (!b.bare) panel(b.x, b.y + dn, b.w, b.h, base, OUT, b.disabled ? '#2e2a38' : hov ? '#7a74a0' : '#4a4460');
      if (b.label) textC(b.label, b.x + b.w / 2, b.y + (b.sub ? 4 : Math.round(b.h / 2 - 3)) + dn, b.disabled ? '#5a5670' : hov ? '#ffe07a' : (b.lc || '#ffffff'), true, 1, OUT);
      if (b.sub) jtext(b.sub, b.x + b.w / 2, b.y + 14 + dn, 8, b.disabled ? '#5a5670' : '#bdb6d8', 'center');
      if (b.draw) b.draw(b, hov);
      if (hov && b.tip) Tip.set(b.x, b.y + b.h + 2, b.tip[0], b.tip.slice(1));
    }
  },
};
function bigIcon(fn, x, y, s = 2) { G.save(); G.translate(Math.round(x), Math.round(y)); G.scale(s, s); resetFs(); fn(0, 0); G.restore(); resetFs(); }
function scrapIcon(x, y) { ellipseF(x + 4.5, y + 4.5, 4, 4, OUT); ellipseF(x + 4.5, y + 4.5, 3, 3, '#c7ccd6'); ellipseF(x + 4.5, y + 4.5, 1, 1, OUT); }
function miniBot(x, y, t, f = 1, walk = 0) {
  x = Math.round(x); y = Math.round(y); const b = walk ? Math.round(Math.abs(Math.sin(walk)) * 1) : 0;
  rectI(x - 3, y - 2, 2, 2, PC.leg); rectI(x + 1, y - 2 - (walk ? (Math.sin(walk) > 0 ? 1 : 0) : 0), 2, 2, PC.leg);
  ellipseF(x + 0.5, y - 7 - b, 5, 5, OUT); ellipseF(x + 0.5, y - 7 - b, 4, 4, PC.body); rectI(x - 3, y - 5 - b, 8, 3, PC.body);
  ellipseF(x + 1.5 + f, y - 8 - b, 1.8, 1.8, PC.eye); px(x + 1 + f, y - 9 - b, '#ffffff');
  lineF(x - f * 2, y - 11 - b, x - f * 3, y - 16 - b, PC.pole); polyF([x - f * 3 - 3, y - 19 - b, x - f * 3 + 3, y - 19 - b, x - f * 3, y - 15 - b], '#e0415a');
  lineF(x - f * 3, y - 6 - b, x - f * 7, y - 5 - b + Math.sin(t * 0.2), PC.scarf);
}
function heartIcon(x, y) { ellipseF(x + 2.5, y + 2.5, 2.5, 2.5, '#ff5d73'); ellipseF(x + 6.5, y + 2.5, 2.5, 2.5, '#ff5d73'); polyF([x, y + 3, x + 9, y + 3, x + 4.5, y + 8.5], '#ff5d73'); px(x + 2, y + 1, '#ffd0d8'); }

// ---------- deck view / card picker overlays ----------
const DeckView = {
  list: [], title: '', scroll: 0,
  open(list, title) { Game.deckView = true; this.list = list.slice().sort((a, b) => (CARDS[a.id].type + a.id).localeCompare(CARDS[b.id].type + b.id)); this.title = title; this.scroll = 0; Snd.play('page'); },
  input() { this.scroll = clamp(this.scroll + In.wheel * 24, 0, Math.max(0, Math.ceil(this.list.length / 7) * 84 - 180)); if (In.pressed || In.rpressed || In.key('Escape') || In.key('KeyD')) { Game.deckView = false; Snd.play('back'); In.eat(); } },
  draw(t) { G.globalAlpha = 0.88; rectI(0, 0, W, H, '#0d0c14'); G.globalAlpha = 1; textC(`${this.title}  ${this.list.length}`, W / 2, 10, '#ffe07a', true, 1, OUT); drawCardGrid(this.list, 26, this.scroll, t, null); textC('CLICK TO CLOSE', W / 2, H - 10, '#8a86a0'); },
};
const PickView = {
  // mode: 'upgrade' | 'remove' | 'copy'; cb(card) called on confirm
  open(mode, cb, cancelable = true) {
    const run = Run.cur; let list = run.deck.slice();
    if (mode === 'upgrade') list = list.filter(c => !c.up && CARDS[c.id].u && CARDS[c.id].type !== 'junk');
    this.mode = mode; this.cb = cb; this.list = list.sort((a, b) => (CARDS[a.id].type + a.id).localeCompare(CARDS[b.id].type + b.id)); this.scroll = 0; this.hov = -1; this.cancelable = cancelable; Game.pickView = true; Snd.play('page');
  },
  input() {
    this.scroll = clamp(this.scroll + In.wheel * 24, 0, Math.max(0, Math.ceil(this.list.length / 7) * 84 - 170));
    if ((In.rpressed || In.key('Escape')) && this.cancelable) { Game.pickView = false; Snd.play('back'); In.eat(); return; }
    if (In.pressed && this.cancelable && In.in(W / 2 - 30, H - 16, 60, 14)) { Game.pickView = false; Snd.play('back'); In.eat(); return; }
    if (In.pressed && this.hov >= 0) { const c = this.list[this.hov]; Game.pickView = false; In.eat(); this.cb(c); }
  },
  draw(t) {
    G.globalAlpha = 0.9; rectI(0, 0, W, H, '#0d0c14'); G.globalAlpha = 1;
    const title = { upgrade: 'POLISH A CARD', remove: 'REMOVE A CARD', copy: 'COPY A CARD' }[this.mode];
    textC(title, W / 2, 6, '#ffe07a', true, 1, OUT); jtext({ upgrade: '磨くカードを選ぶ（強化）', remove: '取り除くカードを選ぶ', copy: '写しを作るカードを選ぶ' }[this.mode], W / 2, 15, 8, '#bdb6d8', 'center');
    const shown = this.list.map(c => (this.mode === 'upgrade' && this.list.indexOf(c) === this.hov) ? { uid: c.uid, id: c.id, up: true } : c);
    this.hov = drawCardGrid(shown, 28, this.scroll, t, null);
    if (this.cancelable) { const hv = In.in(W / 2 - 30, H - 16, 60, 14); panel(W / 2 - 30, H - 16, 60, 14, hv ? '#4a4468' : '#2f2a42'); textC('CANCEL', W / 2, H - 12, hv ? '#ffe07a' : '#ffffff'); }
  },
};

// ============================================================
const SCENES = {};
// ---------------------------------------------------------- title
SCENES.title = {
  enter() { Game.setStage(0); Music.setSong('title'); Music.intensity(0); Cam.reset(); this.t = 0; Game.robot = new Robot(); PGROUND = GY; Parts.length = 0; },
  buttons() {
    const has = !!Meta.run; const x = 34, w = 108;
    return [
      { id: 'cont', x, y: 120, w, h: 26, label: 'CONTINUE', sub: '続きから', hidden: !has },
      { id: 'new', x, y: has ? 150 : 120, w, h: 26, label: 'NEW RUN', sub: 'はじめから' },
      { id: 'coll', x, y: has ? 180 : 150, w, h: 26, label: 'COLLECTION', sub: '図鑑' },
      { id: 'snd', x: W - 30, y: H - 24, w: 22, h: 18, label: '', draw: (b, h) => { const m = Meta.d.mute; polyF([b.x + 5, b.y + 7, b.x + 8, b.y + 7, b.x + 12, b.y + 4, b.x + 12, b.y + 14, b.x + 8, b.y + 11, b.x + 5, b.y + 11], h ? '#ffe07a' : '#ffffff'); if (m) lineF(b.x + 14, b.y + 5, b.x + 19, b.y + 13, '#ff4d5a', 2); else { px(b.x + 15, b.y + 7, '#ffffff'); px(b.x + 15, b.y + 10, '#ffffff'); px(b.x + 17, b.y + 8, '#ffffff'); } }, tip: ['音', 'オン・オフ（M）'] },
    ];
  },
  update() {
    this.t++; Game.robot.update(1); updateParts(1); weather(PSTAGE, 1);
    if (this.t % 300 === 150) Game.robot.act(this.t % 600 === 150 ? 'swing' : 'stop', { stay: 1 });
    const id = UIB.hit(this.buttons());
    if (id === 'cont') { Run.cur = Run.fromJSON(Meta.run); Game.goWipe('map'); }
    if (id === 'new') Game.goWipe('kit');
    if (id === 'coll') Game.goWipe('coll');
    if (id === 'snd') { Meta.d.mute = !Meta.d.mute; Snd.setMute(Meta.d.mute); Meta.save(); }
  },
  drawWorld(t) {
    drawStage(Game.stage, 40 + Math.sin(t * 0.002) * 30, 0, t);
    const r = Game.robot; r.face = -1;
    const tc = tmpC.getContext('2d'); tc.clearRect(0, 0, 96, 96); useCtx(tc); const rx = r.x, ry = r.y; r.x = 60; r.y = 80; r.draw(0, 0); r.x = rx; r.y = ry; useCtx(LX);
    LX.imageSmoothingEnabled = false; LX.drawImage(tmpC, 396 + MG - 60 * 3, GY + MG + 6 - 80 * 3, 96 * 3, 96 * 3);
    drawParts(-MG, -MG);
  },
  drawHud(t) {
    // logo
    const lx = 30, ly = 22; const s = 'TOMARE';
    text(s, lx + 2, ly + 3, '#1d1a2a', true, 4); textO(s, lx, ly, '#fbf7f0', OUT, true, 4);
    for (let i = 0; i < s.length; i++) rectI(lx + i * 24, ly, 20, 2, '#ffffff');
    // DECK card badge
    const bx = lx + 150, by = ly + 24; const wob = Math.sin(t * 0.04) * 1.5;
    panel(bx, by + wob, 52, 22, '#c8404f'); rectI(bx + 2, by + 2 + wob, 48, 1, '#ef7080'); textC('DECK', bx + 26, by + 8 + wob, '#ffffff', true, 1, OUT);
    ellipseF(bx + 4, by + 4 + wob, 5, 5, OUT); ellipseF(bx + 4, by + 4 + wob, 4, 4, '#ffd23f'); text('3', bx + 2, by + 1 + wob, OUT, false);
    // fanned cards (hero art)
    const fan = ['guard', 'crossing', 'tomare', 'noentry', 'swing'];
    fan.forEach((id, i) => { const c = { id, up: false, uid: -1 - i }; const x = 158 + i * 32, y = 150 + Math.abs(i - 2) * 6 + Math.sin(t * 0.03 + i) * 2; if (i === 2) return; G.drawImage(cardFace(c, null, true), x, y); });
    G.drawImage(cardFace({ id: 'tomare', up: false, uid: -9 }, null, true), 158 + 2 * 32 - 4, 138 + Math.sin(t * 0.03 + 2) * 2);
    UIB.draw(this.buttons(), t);
    // level
    const lv = Meta.d.level, xp = Meta.d.xp, a = LEVEL_XP[lv - 1] || 0, b2 = LEVEL_XP[lv] || a + 1;
    textO(`LV ${lv}`, 34, H - 24, '#ffe07a', OUT, true);
    rectI(66, H - 22, 80, 5, OUT); rectI(67, H - 21, 78, 3, '#3a3550'); rectI(67, H - 21, Math.round(78 * clamp((xp - a) / (b2 - a), 0, 1)), 3, '#ffd23f');
    if (UNLOCKS[lv + 1]) jtext(`次：${UNLOCKS[lv + 1].name}`, 150, H - 25, 8, '#bdb6d8');
    if (Meta.d.wins) text(`WINS ${Meta.d.wins}`, 34, H - 12, '#8a86a0');
  },
};
// ---------------------------------------------------------- kit & alert select
SCENES.kit = {
  enter() { this.kit = 'tomare'; this.alert = Math.min(Meta.d.alertMax, Meta.d.lastAlert || 0); },
  buttons() {
    const L = [];
    const ids = Object.keys(KITS); ids.forEach((id, i) => { const un = Meta.unlocked('kits', id); L.push({ id: 'k_' + id, x: 40 + i * 136, y: 34, w: 128, h: 132, kit: id, locked: !un, c: this.kit === id ? '#3a3458' : '#26222f', hc: '#3a3458', disabled: !un }); });
    if (Meta.d.alertMax > 0) { L.push({ id: 'al-', x: 176, y: 178, w: 16, h: 16, label: '<' }); L.push({ id: 'al+', x: 288, y: 178, w: 16, h: 16, label: '>' }); }
    L.push({ id: 'back', x: 40, y: H - 36, w: 70, h: 24, label: 'BACK', snd: 'back' });
    L.push({ id: 'go', x: W - 150, y: H - 40, w: 110, h: 30, label: 'START', sub: '出発', c: '#2f6a4a', hc: '#3f8a5a' });
    return L;
  },
  update() {
    const id = UIB.hit(this.buttons()); if (!id) return;
    if (id.startsWith('k_')) this.kit = id.slice(2);
    if (id === 'al-') this.alert = Math.max(0, this.alert - 1);
    if (id === 'al+') this.alert = Math.min(Meta.d.alertMax, this.alert + 1);
    if (id === 'back') Game.goWipe('title');
    if (id === 'go') { Meta.d.lastAlert = this.alert; Run.create(this.kit, this.alert); Game.goWipe('map'); }
  },
  drawWorld(t) { drawStage(Game.stage, 60, 0, t); G.globalAlpha = 0.45; rectI(0, 0, lo.width, lo.height, '#0d0c14'); G.globalAlpha = 1; },
  drawHud(t) {
    textC('CHOOSE A KIT', W / 2, 12, '#ffe07a', true, 1, OUT); jtext('スタートのカード一式を選ぶ', W / 2, 21, 8, '#bdb6d8', 'center');
    const L = this.buttons(); UIB.draw(L, t);
    for (const b of L) {
      if (!b.kit) continue; const K = KITS[b.kit]; const x = b.x, y = b.y;
      textC(K.en, x + b.w / 2, y + 6, b.locked ? '#5a5670' : '#ffffff', true, 1, OUT); jtext(K.jp, x + b.w / 2, y + 15, 8, b.locked ? '#5a5670' : '#ffd88a', 'center');
      if (b.locked) { const lv = Object.keys(UNLOCKS).find(k => UNLOCKS[k].kit === b.kit); const cx = x + b.w / 2; rectI(cx - 9, y + 44, 18, 14, OUT); rectI(cx - 8, y + 45, 16, 12, '#5a5670'); rectI(cx - 1, y + 49, 2, 4, OUT); rectI(cx - 7, y + 34, 3, 11, OUT); rectI(cx + 4, y + 34, 3, 11, OUT); rectI(cx - 7, y + 32, 14, 3, OUT); rectI(cx - 6, y + 35, 1, 9, '#8a86a0'); rectI(cx + 5, y + 35, 1, 9, '#8a86a0'); rectI(cx - 5, y + 33, 10, 1, '#8a86a0'); textC(`LV ${lv}`, cx, y + 68, '#8a86a0', true, 2, OUT); continue; }
      drawRIcon(K.relic, x + 8, y + 28); jtext(RELICS[K.relic].jp, x + 26, y + 30, 8, '#bdb6d8');
      const counts = {}; K.deck.forEach(i => counts[i] = (counts[i] || 0) + 1);
      let yy = y + 48; for (const id in counts) { const T = TYPEC[CARDS[id].type]; rectI(x + 10, yy + 1, 5, 7, T.f); jtext(`${CARDS[id].jp} ×${counts[id]}`, x + 19, yy, 8, '#e8e4f0'); yy += 10; }
      const lines = jwrap(K.desc, b.w - 16, 8); lines.slice(0, 2).forEach((l, i) => jtext(l, x + 8, y + b.h - 24 + i * 10, 8, '#9a96b0'));
      if (this.kit === b.kit) { const on = (t / 8 | 0) % 2; rectI(x - 2, y - 2, b.w + 4, 1, on ? '#ffe07a' : '#ffffff'); rectI(x - 2, y + b.h + 1, b.w + 4, 1, on ? '#ffe07a' : '#ffffff'); }
    }
    if (Meta.d.alertMax > 0) {
      const a = this.alert; textC(`ALERT ${a}`, 240, 182, a ? '#ff8a3c' : '#ffffff', true, 1, OUT);
      if (In.in(196, 176, 88, 20)) Tip.set(196, 198, `警戒レベル ${a}`, a ? ALERT_DESC.slice(0, a) : ['ふつうの難しさ。'], { w: 190, anchor: 'above' });
    }
  },
};
const ALERT_DESC = ['強敵の HP +25%', '敵の攻撃 +1', '休憩の回復量が 20% に', 'ボスの HP +20% と 馬力 +2', '最大HP -10、穴ぼこ 1 枚からスタート'];
// ---------------------------------------------------------- map
SCENES.map = {
  enter() {
    const run = Run.cur; Game.setStage(run.act); Music.setSong('map'); Music.intensity(0); Cam.reset(); Parts.length = 0;
    this.walk = null; this.hov = null; this.ground = null; this.tokenX = null;
    Meta.save();
  },
  groundCanvas(run) {
    if (this.ground && this.groundAct === run.act) return this.ground;
    const act = run.act; const c = mkCanvas(lo.width, lo.height); const rng = mulberry32(run.seed + act * 11);
    const pal = [['#b8d098', '#a8c488', '#c8dcaa', '#8fb070', '#6a8a58'], ['#d8b2a0', '#caa090', '#e6c4b0', '#b88a80', '#8a5a5a'], ['#2a2e4a', '#242840', '#343858', '#1c2038', '#141729']][act];
    paint(c, () => {
      rectF(0, 0, c.width, c.height, pal[0]);
      for (let i = 0; i < 140; i++) { const x = rng() * c.width, y = rng() * c.height, w = 10 + rng() * 40, h = 6 + rng() * 20; ditherRect(x, y, w, h, pal[rng() < 0.5 ? 1 : 2], 0.5); }
      // river / railway band
      if (act === 0) { for (let x = 0; x < c.width; x++) { const y = 150 + Math.sin(x * 0.02) * 20 + x * 0.1; rectF(x, y, 1, 10, '#8fc0d8'); px(x, y, '#bfe0ee'); } }
      if (act === 2) { for (let x = 0; x < c.width; x += 1) { rectF(x, 120, 1, 3, '#4a4e64'); } for (let x = 0; x < c.width; x += 6) rectF(x, 119, 2, 5, '#6a5a48'); }
      // blocks / trees
      for (let i = 0; i < 70; i++) {
        const x = rng() * c.width, y = 20 + rng() * (c.height - 30);
        if (act === 0 ? rng() < 0.7 : rng() < 0.35) { ellipseF(x + 1, y + 2, 5, 3, pal[4]); ellipseF(x, y, 5, 4, pal[3]); px(x - 2, y - 2, pal[2]); }
        else { const w = 8 + rng() * 12, h = 6 + rng() * 8; rectF(x, y, w, h, pal[4]); rectF(x, y, w, 2, act === 2 ? '#3a3e5a' : mix(pal[3], '#ffffff', 0.2)); if (act === 2) for (let k = 0; k < 3; k++) px(x + 2 + rng() * (w - 4), y + 3 + rng() * (h - 4), '#ffcf73'); }
      }
    });
    this.ground = c; this.groundAct = act; return c;
  },
  roadPts(a, b) {
    const pts = []; const mx = (a.x + b.x) / 2 + (a.c !== undefined && b.c !== undefined ? (b.c - a.c) * 4 : 0), my = (a.y + b.y) / 2;
    for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push([(1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * mx + k * k * b.x, (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * (my + 6) + k * k * b.y]); }
    return pts;
  },
  edges(run) {
    const m = run.map, E = [];
    for (let r = 0; r < MAP_ROWS; r++) for (const n of m.nodes[r]) if (n) { if (r < MAP_ROWS - 1) for (const c of n.next) E.push([n, m.nodes[r + 1][c]]); else E.push([n, m.boss]); }
    return E;
  },
  update() {
    const run = Run.cur; const t = Game.t; Game.robot.update(1);
    if (this.walk) {
      this.walk.t++; const k = clamp(this.walk.t / 34, 0, 1);
      if (Game.t % 8 === 0) Snd.play('step', { pitch: rnd(0.8, 1.2) });
      if (k >= 1) { const n = this.walk.to; this.walk = null; this.enterNode(n); }
      return;
    }
    const reach = reachable(run);
    this.hov = null; for (const n of reach) if (dist(In.mx, In.my, n.x, n.y) < 11) this.hov = n;
    if (In.pressed && this.hov) { Snd.play('uiok'); this.walk = { from: this.curPos(run), to: this.hov, t: 0 }; }
    if (In.pressed && In.in(W - 18, 2, 15, 16)) DeckView.open(run.deck, 'DECK');
  },
  curPos(run) { if (!run.pos) return { x: W / 2, y: H - 14 }; return mapNode(run.map, run.pos.r, run.pos.c); },
  enterNode(n) {
    const run = Run.cur; run.pos = { r: n.r, c: n.c }; run.floor++; run.stats.floors++;
    run.visited = run.visited || []; run.visited.push(n.r + ':' + n.c);
    Meta.save();
    const tp = n.type;
    if (tp === 'battle' || tp === 'elite' || tp === 'boss') Game.goWipe('battle', tp);
    else if (tp === 'rest') Game.goWipe('rest');
    else if (tp === 'shop') Game.goWipe('shop');
    else if (tp === 'treasure') Game.goWipe('treasure');
    else Game.goWipe('event');
  },
  drawWorld(t) {
    const run = Run.cur; if (!run) return;
    LX.drawImage(this.groundCanvas(run), 0, 0);
    const ox = -MG, oy = -MG; const reach = reachable(run); const vis = run.visited || [];
    // roads
    const asph = run.act === 2 ? '#3a3e58' : '#6d7179', line = run.act === 2 ? '#8a90b8' : '#f2f0e6';
    for (const [a, b] of this.edges(run)) {
      const pts = this.roadPts(a, b); const done = vis.includes(a.r + ':' + a.c) && (vis.includes(b.r + ':' + b.c) || b.type === 'boss' && false);
      for (let i = 1; i < pts.length; i++) lineF(pts[i - 1][0] - ox, pts[i - 1][1] - oy, pts[i][0] - ox, pts[i][1] - oy, OUT, 7);
      for (let i = 1; i < pts.length; i++) lineF(pts[i - 1][0] - ox, pts[i - 1][1] - oy, pts[i][0] - ox, pts[i][1] - oy, done ? mix(asph, '#ffe07a', 0.25) : asph, 5);
      for (let i = 1; i < pts.length; i += 2) lineF(pts[i - 1][0] - ox, pts[i - 1][1] - oy, pts[i][0] - ox, pts[i][1] - oy, line, 1);
    }
    // start road
    const s0 = { x: W / 2, y: H - 6 };
    for (const n of run.map.nodes[0]) if (n) { const pts = this.roadPts(s0, n); for (let i = 1; i < pts.length; i++) lineF(pts[i - 1][0] - ox, pts[i - 1][1] - oy, pts[i][0] - ox, pts[i][1] - oy, OUT, 7); for (let i = 1; i < pts.length; i++) lineF(pts[i - 1][0] - ox, pts[i - 1][1] - oy, pts[i][0] - ox, pts[i][1] - oy, asph, 5); }
    // nodes
    const all = []; for (const row of run.map.nodes) for (const n of row) if (n) all.push(n); all.push(run.map.boss);
    for (const n of all) {
      const isR = reach.includes(n), done = vis.includes(n.r + ':' + n.c), cur = run.pos && run.pos.r === n.r && run.pos.c === n.c;
      const bob = isR ? Math.round(Math.sin(t * 0.12 + n.x) * 1.5) : 0; const X = n.x - ox, Y = n.y - oy + bob;
      ditherEllipse(X, n.y - oy + 9, n.type === 'boss' ? 12 : 7, 2, '#000000', 0.35);
      rectF(X - 1, Y + 2, 3, 8, OUT); rectF(X, Y + 2, 1, 8, SC_.pole);
      if (isR) glow(X, Y, 20, '#ffe07a', 0.35 + 0.15 * Math.sin(t * 0.15));
      if (done && !cur) { G.globalAlpha = 0.45; drawNodeIcon(n.type, X, Y - 4, t); G.globalAlpha = 1; }
      else drawNodeIcon(n.type, X, Y - 4, t);
      if (this.hov === n) { ringF(X, Y - 4, 13 + (t / 6 | 0) % 2, 1, '#ffe07a'); }
    }
    // token
    let tp;
    if (this.walk) { const a = this.walk.from, b = this.walk.to; const pts = this.roadPts(a, b); const k = clamp(this.walk.t / 34, 0, 1) * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(k)); const f = k - i; tp = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
    else { const p = this.curPos(run); tp = [p.x, p.y]; }
    miniBot(tp[0] - ox, tp[1] - oy - 2, t, 1, this.walk ? this.walk.t * 0.5 : 0);
  },
  drawHud(t) {
    const run = Run.cur; if (!run) return;
    drawTopBar(run, t, run.hp, run.maxhp);
    const names = ['昼の国道', '夕暮れの商店街', '雨の夜の高架下'];
    textO(`ACT ${run.act + 1}`, 8, 24, '#ffe07a', OUT, true); jtext(names[run.act], 44, 24, 8, '#ffffff');
    if (this.hov) Tip.set(this.hov.x + 14, this.hov.y - 20, NODE_JP[this.hov.type], [NODE_DESC[this.hov.type]], { w: 140 });
    if (!run.pos) { const on = (t / 20 | 0) % 2; if (on) jtext('道を選んで出発', W / 2, H - 22, 8, '#ffe07a', 'center'); }
  },
};
// ---------------------------------------------------------- battle
SCENES.battle = {
  enter(kind) {
    const run = Run.cur; this.kind = kind; this.endT = 0;
    const group = pickEncounter(run, kind);
    for (const id of group) Meta.see('e', id);
    Game.setStage(run.act, run.seed + run.floor * 13);
    Cam.reset(); Parts.length = 0; Q.clear(); BV.reset(); PGROUND = GY;
    Game.robot = Game.robot || new Robot(); Game.robot.x = 108; Game.robot.pose = 'idle'; Game.robot.dead = false; Game.robot.rot = 0;
    B = new Battle(run, group, kind);
    Q.push(battleStart());
    Music.setSong(kind === 'boss' ? 'boss' : STAGES[run.act].song); Music.intensity(kind === 'normal' || kind === 'battle' ? 0.6 : 1);
  },
  update() {
    if (!B) return;
    const ts = Scr.ts;
    weather(PSTAGE, ts);
    if (Scr.hitstop > 0) { Scr.hitstop--; updateParts(0.15); BV.input(); return; }
    Q.tick(ts); BV.stepVis(ts);
    // actors
    B.P.spr.update(ts); B.P.x = B.P.spr.x;
    for (const e of B.enemies) {
      e.t += ts; e.pt += ts; e.flash = Math.max(0, e.flash - ts); e.sx = lerp(e.sx, 1, 0.2); e.sy = lerp(e.sy, 1, 0.2);
      if (e.tx != null) e.x = lerp(e.x, e.tx, 0.12);
      if (e.dropT > 0) { e.dropT -= ts; if (e.dropT <= 0) { e.dropT = 0; e.sy = 0.6; e.sx = 1.35; Fx.dust(e.x, GY, 6, 1.2); Cam.shake(0.1); Snd.play('land', { x: e.x, p: 0.8 }); } }
      if (e.pose === 'hurt' && e.pt > 14) e.pose = 'idle';
      if (e.launch) { e.launch += 0.035 * ts; if (e.launch >= 1) { e.launch = 0; Fx.dust(e.x, GY, 6, 1.2); Snd.play('land', { x: e.x, p: 1 }); } }
      if (e.dying > 0) { e.dying += ts; if (e.dying > 26) { e.dying = -1; B.layout(false); } }
    }
    updateParts(ts);
    if (!B.over) { if (!BV.canInput()) BV.input(); }
    else {
      this.endT += 1;
      if (B.result === 'win' && this.endT === 30) { B.P.spr.act('win'); Snd.play('unlock'); Music.intensity(0.2); }
      if (B.result === 'win' && this.endT > 90 && !Q.busy()) { this.finishWin(); return; }
      if (B.result === 'lose' && this.endT > 130) Game.goWipe('over', { won: false });
    }
  },
  finishWin() {
    if (this.done) return; this.done = true;
    const run = Run.cur; run.hp = Math.max(1, B.P.hp);
    if (this.kind === 'elite') run.stats.elites++; if (this.kind === 'boss') run.stats.bosses++;
    for (const id of run.relics) { const r = RELICS[id]; if (r && r.onWin) r.onWin(Run); }
    const kind = this.kind; B = null; Q.clear();
    Game.goWipe('reward', kind);
  },
  drawWorld(t) { if (B) BV.drawWorld(t); },
  drawHud(t) { if (B) BV.drawHud(t); else drawTopBar(Run.cur, t, Run.cur.hp, Run.cur.maxhp); },
};
SCENES.battle.enter = (function (orig) { return function (k) { this.done = false; orig.call(this, k); }; })(SCENES.battle.enter);
// ---------------------------------------------------------- reward
SCENES.reward = {
  enter(kind) {
    const run = Run.cur; this.kind = kind; this.R = makeReward(run, kind); this.coins = []; this.choose = null; this.t = 0; this.msg = null;
    const sc = this.R.items.find(i => i.k === 'scrap'); const gained = Run.gainScrap(sc.n); sc.n = gained; run.scrap -= gained; this.pending = gained;
    for (let i = 0; i < Math.min(18, gained); i++) this.coins.push({ x: W / 2 + rnd(-30, 30), y: 110 + rnd(-10, 10), vx: rnd(-2, 2), vy: rnd(-4, -1), t: -i * 2, v: 0 });
    this.coinVal = gained / Math.max(1, Math.min(18, gained)); this.given = 0;
    Game.setStage(run.act); Music.setSong('map'); Music.intensity(0);
    Meta.save();
  },
  rows() { return this.R.items.filter(i => i.k !== 'scrap' && !i.taken); },
  buttons() {
    const L = []; const rows = this.rows(); const x = W / 2 - 110, w = 220;
    rows.forEach((it, i) => L.push({ id: 'r' + i, it, x, y: 70 + i * 26, w, h: 22 }));
    L.push({ id: 'next', x: W / 2 - 50, y: H - 44, w: 100, h: 26, label: 'NEXT', sub: '先へ進む', c: '#2f6a4a', hc: '#3f8a5a' });
    return L;
  },
  update() {
    this.t++; Game.robot.update(1); updateParts(1); weather(PSTAGE, 1);
    const run = Run.cur;
    // coin flight to the counter
    for (const c of this.coins) { c.t++; if (c.t < 0) continue; if (c.t < 16) { c.x += c.vx; c.y += c.vy; c.vy += 0.3; } else { const tx = 70, ty = 9; c.x = lerp(c.x, tx, 0.22); c.y = lerp(c.y, ty, 0.22); if (!c.done && dist(c.x, c.y, tx, ty) < 6) { c.done = true; const add = Math.min(this.pending - this.given, Math.round(this.coinVal)); this.given += add; run.scrap += add; Snd.play('coin', { pitch: 1 + this.coins.filter(q => q.done).length * 0.04, gap: 0.01 }); } } }
    if (this.coins.length && this.coins.every(c => c.done) && this.given < this.pending) { run.scrap += this.pending - this.given; this.given = this.pending; }
    if (this.choose) { this.chooseUpdate(); return; }
    const id = UIB.hit(this.buttons()); if (!id) return;
    if (id === 'next') { if (this.given < this.pending) { run.scrap += this.pending - this.given; this.given = this.pending; } this.leave(); return; }
    const b = this.buttons().find(b => b.id === id); const it = b.it;
    if (it.k === 'can') { if (Run.addCan(it.id)) { it.taken = true; Snd.play('clink'); Meta.see('c', it.id); } else { Game.toastMsg('飲み物がいっぱい（3 本まで）', '#ff9fb0'); Snd.play('error'); } }
    else if (it.k === 'relic') { Run.addRelic(it.id); it.taken = true; Snd.play('chest'); Scr.flash('#fff3a0', 0.2); }
    else if (it.k === 'card') { this.choose = { it, opts: it.opts, hov: -1, t: 0 }; Snd.play('page'); }
    else if (it.k === 'bossrelic') { this.choose = { it, relics: it.opts, hov: -1, t: 0 }; Snd.play('page'); }
  },
  chooseUpdate() {
    const ch = this.choose; ch.t++; const n = ch.opts ? ch.opts.length : ch.relics.length;
    const cw = ch.opts ? CW * 2 : 90, gap = 12; const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2; const y = 40;
    ch.hov = -1; for (let i = 0; i < n; i++) if (In.in(x0 + i * (cw + gap), y, cw, ch.opts ? CH * 2 : 110)) ch.hov = i;
    if (In.pressed && ch.hov >= 0) {
      if (ch.opts) { const o = ch.opts[ch.hov]; Run.addCard(o.id, o.up); Snd.play('uiok'); Fx.pixelBurst(x0 + ch.hov * (cw + gap) + cw / 2 + MG, y + CH + MG, typeColors(CARDS[o.id].type), 30); }
      else { Run.addRelic(ch.relics[ch.hov]); Snd.play('chest'); Scr.flash('#fff3a0', 0.3); }
      ch.it.taken = true; this.choose = null; return;
    }
    if (In.pressed && In.in(W / 2 - 40, H - 38, 80, 22) && ch.opts) { this.choose = null; Snd.play('back'); }
    if (In.rpressed || In.key('Escape')) { this.choose = null; Snd.play('back'); }
  },
  leave() {
    const run = Run.cur;
    if (this.kind === 'boss') {
      if (run.act >= ENCOUNTERS.length - 1 || run.act >= 2) { Game.goWipe('over', { won: true }); return; }
      run.act++; run.pos = null; run.floor = 0; run.map = genMap(run.rng, run.act); run.hp = run.maxhp; run.fights = { n: 2, last: [] }; run.visited = [];
      Game.toastMsg('HP が全回復した', '#7dff9a');
    }
    Game.goWipe('map');
  },
  drawWorld(t) { drawStage(Game.stage, 60, 0, t); const r = Game.robot; r.x = 90; r.face = 1; r.draw(-MG, -MG); drawParts(-MG, -MG); G.globalAlpha = 0.35; rectI(0, 0, lo.width, lo.height, '#0d0c14'); G.globalAlpha = 1; },
  drawHud(t) {
    const run = Run.cur; drawTopBar(run, t, run.hp, run.maxhp);
    for (const c of this.coins) if (c.t >= 0 && !c.done) scrapIcon(c.x - 4, c.y - 4);
    textC(this.kind === 'boss' ? 'BOSS CLEAR' : 'CLEAR', W / 2, 30, '#ffe07a', true, 2, OUT);
    const sc = this.R.items.find(i => i.k === 'scrap'); jtext(`スクラップ +${sc.n}`, W / 2, 50, 8, '#ffe07a', 'center');
    const L = this.buttons(); UIB.draw(L, t);
    for (const b of L) {
      if (!b.it) continue; const it = b.it; const x = b.x + 8, y = b.y + 4;
      if (it.k === 'can') { drawCIcon(it.id, x, y); jtext(CANS[it.id].jp, x + 18, y + 3, 8, '#ffffff'); if (UIB.hov === b.id) Tip.set(b.x + b.w + 4, b.y, CANS[it.id].jp, [CANS[it.id].desc]); }
      if (it.k === 'relic') { drawRIcon(it.id, x, y); jtext(RELICS[it.id].jp, x + 18, y + 3, 8, '#ffe07a'); if (UIB.hov === b.id) Tip.set(b.x + b.w + 4, b.y, RELICS[it.id].jp, [RELICS[it.id].desc]); }
      if (it.k === 'card') { rectI(x, y, 10, 14, OUT); rectI(x + 1, y + 1, 8, 12, '#f6f4ee'); rectI(x + 1, y + 1, 8, 3, '#c8404f'); jtext('カードを 1 枚えらぶ', x + 18, y + 3, 8, '#ffffff'); }
      if (it.k === 'bossrelic') { drawRIcon('v8', x, y); jtext('ボスのパーツを えらぶ', x + 18, y + 3, 8, '#ff9fb0'); }
    }
    if (this.choose) this.drawChoose(t);
  },
  drawChoose(t) {
    const ch = this.choose; G.globalAlpha = 0.8; rectI(0, 0, W, H, '#0d0c14'); G.globalAlpha = 1;
    const n = ch.opts ? ch.opts.length : ch.relics.length; const cw = ch.opts ? CW * 2 : 90, gap = 12; const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2; const y = 40;
    textC(ch.opts ? 'CHOOSE A CARD' : 'CHOOSE A PART', W / 2, 20, '#ffe07a', true, 1, OUT);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cw + gap); const hv = ch.hov === i; const ap = easeOutBack(clamp((ch.t - i * 4) / 14, 0, 1)); const yy = y + (1 - ap) * 60 - (hv ? 4 : 0);
      if (ch.opts) {
        const o = ch.opts[i]; const c = { id: o.id, up: o.up, uid: -100 - i }; G.drawImage(cardFace(c, null, true), Math.round(x), Math.round(yy), CW * 2, CH * 2);
        if (CARDS[o.id].rar === 'r' && (t / 10 | 0) % 2) { rectI(x - 2, yy - 2, cw + 4, 1, '#ffe07a'); }
        if (hv) Tip.set(x + cw + 2 > W - 150 ? x - 152 : x + cw + 2, yy, CARDS[o.id].jp + (o.up ? '＋' : ''), [{ h: 1, s: `${TYPEJP[CARDS[o.id].type]}　${RARJP[CARDS[o.id].rar]}`, c: '#9a96b0' }, cardDesc(c), ...kwLines(c)], { w: 150 });
      } else {
        const id = ch.relics[i]; panel(x, yy, cw, 110, hv ? '#3a3458' : '#26222f');
        G.save(); G.translate(Math.round(x + cw / 2 - 14), Math.round(yy + 12)); G.scale(2, 2); drawRIcon(id, 0, 0); G.restore(); resetFs();
        jtext(RELICS[id].jp, x + cw / 2, yy + 46, 8, '#ffe07a', 'center'); jwrap(RELICS[id].desc, cw - 10, 8).slice(0, 4).forEach((l, k) => jtext(l, x + 5, yy + 60 + k * 10, 8, '#e8e4f0'));
      }
    }
    if (ch.opts) { const hv = In.in(W / 2 - 40, H - 38, 80, 22); panel(W / 2 - 40, H - 38, 80, 22, hv ? '#4a4468' : '#2f2a42'); textC('SKIP', W / 2, H - 34, hv ? '#ffe07a' : '#ffffff', true); jtext('取らない', W / 2, H - 25, 8, '#9a96b0', 'center'); }
  },
};
// ---------------------------------------------------------- shop (vending machine street)
SCENES.shop = {
  enter() { const run = Run.cur; this.S = genShop(run); Game.setStage(run.act); Music.setSong('shop'); Music.intensity(0); Game.robot.x = 38; Game.robot.face = 1; },
  buttons() {
    const L = []; const S = this.S; const run = Run.cur;
    const col = i => 76 + i * 68;
    S.cards.forEach((c, i) => { if (!c.sold) L.push({ id: 'c' + i, k: 'card', it: c, x: col(i), y: 34, w: CW, h: CH + 12 }); });
    S.relics.forEach((r, i) => { if (!r.sold) L.push({ id: 'r' + i, k: 'relic', it: r, x: col(i), y: 142, w: CW, h: 48 }); });
    S.cans.forEach((r, i) => { if (!r.sold) L.push({ id: 'n' + i, k: 'can', it: r, x: col(2 + i), y: 142, w: CW, h: 48 }); });
    if (!S.remove.used) L.push({ id: 'rm', k: 'remove', it: S.remove, x: col(4), y: 142, w: CW, h: 48 });
    L.push({ id: 'leave', x: W - 100, y: H - 38, w: 84, h: 26, label: 'LEAVE', sub: '店を出る', snd: 'back' });
    for (const b of L) if (b.it && b.it.price != null) b.poor = run.scrap < b.it.price;
    return L;
  },
  update() {
    Game.robot.update(1); updateParts(1);
    const id = UIB.hit(this.buttons()); if (!id) return; const b = this.buttons().find(q => q.id === id); const run = Run.cur;
    if (id === 'leave') { Game.goWipe('map'); return; }
    if (b.poor) { Snd.play('error'); Game.toastMsg('スクラップが足りない', '#ff9fb0'); return; }
    if (b.k === 'card') { run.scrap -= b.it.price; Run.addCard(b.it.id, b.it.up); b.it.sold = true; Snd.play('buy'); Fx.pixelBurst(b.x + CW / 2 + MG, b.y + 40 + MG, typeColors(CARDS[b.it.id].type), 26); }
    if (b.k === 'relic') { run.scrap -= b.it.price; Run.addRelic(b.it.id); b.it.sold = true; Snd.play('buy'); }
    if (b.k === 'can') { if (!run.cans.includes(null)) { Snd.play('error'); Game.toastMsg('飲み物がいっぱい', '#ff9fb0'); return; } run.scrap -= b.it.price; Run.addCan(b.it.id); b.it.sold = true; Snd.play('buy'); }
    if (b.k === 'remove') { PickView.open('remove', c => { run.scrap -= this.S.remove.price; Run.removeCard(c.uid); this.S.remove.used = true; run.removeCost += 25; Snd.play('exhaust'); Game.toastMsg(`${CARDS[c.id].jp} を取り除いた`); }); }
    Meta.save();
  },
  drawWorld(t) {
    drawStage(Game.stage, 30, 0, t);
    // row of glowing vending machines
    for (let i = 0; i < 4; i++) { const x = 250 + i * 50 + MG, y = GY + MG; const col = ['#d4524e', '#3f78c2', '#e8e2d6', '#2f9a58'][i];
      rectF(x - 1, y - 71, 44, 71, OUT); rectF(x, y - 70, 42, 70, col); rectF(x, y - 70, 42, 3, mix(col, '#ffffff', 0.3)); rectF(x + 3, y - 64, 36, 30, '#e6f6ff');
      for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) rectF(x + 5 + k * 5.6, y - 62 + r * 9, 3, 6, ['#e8534f', '#4f8fe8', '#f2c14e', '#6ac47a', '#ffffff'][(k + r + i) % 5]);
      rectF(x + 3, y - 30, 36, 5, mix(col, '#000000', 0.35)); rectF(x + 6, y - 16, 22, 8, OUT); glow(x + 21, y - 50, 40, '#bfe8ff', PSTAGE.key === 'day' ? 0.25 : 0.6);
    }
    const r = Game.robot; r.draw(-MG, -MG); drawParts(-MG, -MG);
    G.globalAlpha = 0.35; rectI(0, 0, lo.width, lo.height, '#0d0c14'); G.globalAlpha = 1;
  },
  drawHud(t) {
    const run = Run.cur; drawTopBar(run, t, run.hp, run.maxhp);
    textC('SHOP', W / 2, 23, '#ffe07a', true, 1, OUT);
    const L = this.buttons();
    for (const b of L) {
      if (b.k === 'card') {
        const hv = UIB.hov === b.id; const c = { id: b.it.id, up: b.it.up, uid: -200 - b.x }; G.drawImage(cardFace(c, null, true), b.x, b.y - (hv ? 3 : 0));
        this.price(b.x + CW / 2, b.y + CH + 3, b.it.price, b.poor, b.it.sale);
        if (hv) Tip.set(b.x + CW + 2 > W - 150 ? b.x - 152 : b.x + CW + 2, b.y, CARDS[c.id].jp + (c.up ? '＋' : ''), [{ h: 1, s: `${TYPEJP[CARDS[c.id].type]}　${RARJP[CARDS[c.id].rar]}`, c: '#9a96b0' }, cardDesc(c), ...kwLines(c)], { w: 150 });
      } else if (b.k === 'relic' || b.k === 'can' || b.k === 'remove') {
        const hv = UIB.hov === b.id; const lift = hv ? 2 : 0; const y = b.y - lift;
        panel(b.x, y, b.w, 36, hv ? '#3a3458' : '#26222f', OUT, hv ? '#7a74a0' : '#4a4460');
        if (hv) { G.globalAlpha = 0.18 + 0.08 * Math.sin(t * 0.2); rectI(b.x + 2, y + 2, b.w - 4, 32, '#fff3a0'); G.globalAlpha = 1; }
        const tipX = b.x + b.w + 2 > W - 150 ? b.x - 152 : b.x + b.w + 2;
        if (b.k === 'relic') { bigIcon((x, yy) => drawRIcon(b.it.id, x, yy), b.x + b.w / 2 - 14, y + 4); if (hv) Tip.set(tipX, b.y, RELICS[b.it.id].jp, [RELICS[b.it.id].desc], { w: 150 }); }
        if (b.k === 'can') { bigIcon((x, yy) => drawCIcon(b.it.id, x, yy), b.x + b.w / 2 - 12, y + 4); if (hv) Tip.set(tipX, b.y, CANS[b.it.id].jp, [CANS[b.it.id].desc], { w: 150 }); }
        if (b.k === 'remove') {
          const cx = b.x + b.w / 2; rectI(cx - 7, y + 8, 14, 18, OUT); rectI(cx - 6, y + 9, 12, 16, '#f6f4ee'); rectI(cx - 6, y + 9, 12, 5, '#8a86a0');
          lineF(cx - 11, y + 6, cx + 11, y + 29, '#ff4d5a', 3);
          if (hv) Tip.set(tipX, b.y, 'カード廃棄', ['デッキのカードを 1 枚取り除く。', '使うたびに値段が上がる。'], { w: 150 });
        }
        this.price(b.x + b.w / 2, b.y + 38, b.it.price, b.poor);
      }
    }
    UIB.draw(L.filter(b => b.id === 'leave'), t);
  },
  price(cx, y, p, poor, sale) {
    const s = String(p); const w = textW(s, true) + 12; const x = Math.round(cx - w / 2);
    panel(x, y, w, 11, sale ? '#6a2a3a' : '#1d1a2a'); scrapIcon(x + 1, y + 1); text(s, x + 11, y + 2, poor ? '#ff6b7a' : sale ? '#ffb0c0' : '#ffe07a', true);
  },
};
// ---------------------------------------------------------- rest (parking area)
SCENES.rest = {
  enter() { const run = Run.cur; Game.setStage(run.act); Music.setSong('map'); Music.intensity(0); this.done = false; Game.robot.x = 226; Game.robot.face = 1; this.msg = null; },
  buttons() {
    const run = Run.cur; const noheal = run.relics.includes('navipro');
    const amt = Math.round(run.maxhp * (run.alert >= 3 ? 0.2 : 0.3)) + (run.relics.includes('tire') ? 15 : 0);
    return this.done ? [{ id: 'go', x: W / 2 - 50, y: H - 46, w: 100, h: 26, label: 'NEXT', sub: '出発', c: '#2f6a4a', hc: '#3f8a5a' }] : [
      { id: 'heal', x: W / 2 - 150, y: 60, w: 130, h: 64, label: 'REPAIR', sub: noheal ? '（ナビPROで不可）' : `HP を ${amt} 回復`, disabled: noheal || run.hp >= run.maxhp, amt, draw: (b) => { G.globalAlpha = b.disabled ? 0.35 : 1; bigIcon(heartIcon, b.x + b.w / 2 - 9, b.y + 32); G.globalAlpha = 1; } },
      { id: 'up', x: W / 2 + 20, y: 60, w: 130, h: 64, label: 'POLISH', sub: 'カードを 1 枚磨く', disabled: !run.deck.some(c => !c.up && CARDS[c.id].u && CARDS[c.id].type !== 'junk'), draw: (b) => { G.globalAlpha = b.disabled ? 0.35 : 1; bigIcon((x, y) => chipIcon('nrg', x, y), b.x + b.w / 2 - 7, b.y + 34); G.globalAlpha = 1; } },
    ];
  },
  update() {
    Game.robot.update(1); updateParts(1); weather(PSTAGE, 1);
    if (Game.t % 3 === 0) Fx.fire(260, GY - 22, 1, 0.9);
    const id = UIB.hit(this.buttons()); if (!id) return; const run = Run.cur;
    if (id === 'heal') { const b = this.buttons().find(q => q.id === 'heal'); Run.heal(b.amt); Snd.play('heal'); Fx.ring(Game.robot.x, GY - 18, 4, 40, 20, '#7dff9a', 2); Game.robot.act('win'); this.done = true; this.msg = `HP を ${b.amt} 回復した`; Meta.save(); }
    if (id === 'up') PickView.open('upgrade', c => { c.up = true; Snd.play('unlock'); Scr.flash('#fff3a0', 0.25); this.msg = `${CARDS[c.id].jp} を磨いた`; if (run.relics.includes('mechanic')) { const o = run.deck.filter(x => !x.up && CARDS[x.id].u && CARDS[x.id].type !== 'junk'); if (o.length) { const x = run.rng.pick(o); x.up = true; this.msg += `（工具セット：${CARDS[x.id].jp} も）`; } } this.done = true; Meta.save(); });
    if (id === 'go') Game.goWipe('map');
  },
  drawWorld(t) {
    drawStage(Game.stage, 20, 0, t);
    const X = 262 + MG, Y = GY + MG;
    // parking sign + oil-drum fire
    sPole(X + 80, Y - 70, Y); sSquare(X + 80, Y - 76, 18, 18); textC('P', X + 81, Y - 82, SC_.white, true);
    rectF(X - 9, Y - 22, 18, 22, OUT); rectF(X - 8, Y - 21, 16, 21, '#6a4a3a'); rectF(X - 8, Y - 21, 16, 2, '#8a6a5a'); rectF(X - 8, Y - 12, 16, 1, '#4a3228');
    glow(X, Y - 28, 70, '#ff9a4a', 0.55 + 0.1 * Math.sin(t * 0.3)); glow(X, Y - 26, 24, '#fff0a0', 0.5);
    const r = Game.robot; r.draw(-MG, -MG);
    drawParts(-MG, -MG); drawParts(-MG, -MG, 'glow');
  },
  drawHud(t) {
    const run = Run.cur; drawTopBar(run, t, run.hp, run.maxhp);
    textC('REST', W / 2, 30, '#ffe07a', true, 2, OUT); jtext('休憩所', W / 2, 46, 8, '#bdb6d8', 'center');
    UIB.draw(this.buttons(), t);
    if (this.msg) jtext(this.msg, W / 2, 140, 8, '#ffffff', 'center');
  },
};
// ---------------------------------------------------------- treasure
SCENES.treasure = {
  enter() { const run = Run.cur; Game.setStage(run.act); this.open = 0; this.id = rollRelic(run); this.taken = false; Game.robot.x = 130; },
  update() {
    Game.robot.update(1); updateParts(1);
    const run = Run.cur;
    if (this.open > 0) this.open++;
    const L = this.buttons(); const id = UIB.hit(L);
    if (id === 'box' && !this.open) { this.open = 1; Snd.play('chest'); Scr.flash('#fff3a0', 0.3); Cam.shake(0.2); Fx.pixelBurst(300, GY - 30, ['#ffd23f', '#fff3a0', '#ffffff'], 40); }
    if (id === 'take') { if (this.id) Run.addRelic(this.id); this.taken = true; Snd.play('uiok'); Meta.save(); }
    if (id === 'go') Game.goWipe('map');
  },
  buttons() {
    const L = [];
    if (!this.open) L.push({ id: 'box', x: 270, y: GY - 50, w: 60, h: 52, bare: true });
    else if (!this.taken && this.id) L.push({ id: 'take', x: W / 2 - 50, y: H - 46, w: 100, h: 26, label: 'TAKE', sub: '手に入れる', c: '#6a5a2a', hc: '#8a7a3a' });
    if (this.open && (this.taken || !this.id)) L.push({ id: 'go', x: W / 2 - 50, y: H - 46, w: 100, h: 26, label: 'NEXT', sub: '出発', c: '#2f6a4a', hc: '#3f8a5a' });
    return L;
  },
  drawWorld(t) {
    drawStage(Game.stage, 40, 0, t); const r = Game.robot; r.draw(-MG, -MG);
    const X = 300 + MG, Y = GY + MG; const lid = this.open ? Math.min(1, this.open / 12) : 0;
    if (!this.open) { const hv = UIB.hov === 'box'; glow(X, Y - 14, hv ? 46 : 30, '#fff3a0', hv ? 0.45 : 0.15 + 0.1 * Math.sin(t * 0.08)); }
    rectF(X - 22, Y - 26, 44, 26, OUT); rectF(X - 21, Y - 25, 42, 25, '#b98c60'); for (let i = 0; i < 3; i++) rectF(X - 21, Y - 25 + i * 8, 42, 1, '#8a6440'); rectF(X - 3, Y - 20, 6, 8, '#ffd23f');
    G.save(); G.translate(X, Y - 26); G.rotate(-lid * 1.2); rectF(-23, -6 - lid * 6, 46, 7, OUT); rectF(-22, -5 - lid * 6, 44, 5, '#dcb083'); G.restore(); resetFs();
    if (this.open) { glow(X, Y - 30, 50, '#fff3a0', 0.5); if (this.id && !this.taken) { const yy = Y - 40 - Math.min(20, this.open); G.save(); G.translate(X - 14, yy - 14); G.scale(2, 2); drawRIcon(this.id, 0, 0); G.restore(); resetFs(); } }
    drawParts(-MG, -MG); drawParts(-MG, -MG, 'glow');
  },
  drawHud(t) {
    const run = Run.cur; drawTopBar(run, t, run.hp, run.maxhp);
    textC('TREASURE', W / 2, 30, '#ffe07a', true, 2, OUT);
    if (!this.open) { const on = (t / 20 | 0) % 2; if (on) jtext('箱をクリック', 300, GY + 10, 8, '#ffe07a', 'center'); }
    else if (this.open > 14) { const a = clamp((this.open - 14) / 10, 0, 1); G.globalAlpha = a; const msg = this.id ? RELICS[this.id].desc : '空っぽだった。'; const w = Math.max(120, jmeasure(msg, 8) + 20); panel(W / 2 - w / 2, 52, w, this.id ? 32 : 20, '#1d1a2a', OUT, '#5a5670'); if (this.id) { jtext(RELICS[this.id].jp, W / 2, 56, 10, '#ffe07a', 'center'); jtext(msg, W / 2, 70, 8, '#ffffff', 'center'); } else jtext(msg, W / 2, 58, 8, '#ffffff', 'center'); G.globalAlpha = 1; }
    UIB.draw(this.buttons(), t);
  },
};
// ---------------------------------------------------------- event
SCENES.event = {
  enter() { const run = Run.cur; this.id = rollEvent(run); this.E = EVENTS[this.id]; this.res = null; Game.setStage(run.act); Game.robot.x = 110; Music.setSong('map'); },
  buttons() {
    const run = Run.cur;
    if (this.res) return [{ id: 'go', x: W / 2 - 50, y: H - 44, w: 100, h: 26, label: 'NEXT', sub: '先へ進む', c: '#2f6a4a', hc: '#3f8a5a' }];
    return this.E.opts.map((o, i) => ({ id: 'o' + i, o, x: 250, y: 60 + i * 30, w: 200, h: 26, disabled: o.need && !o.need(run) }));
  },
  update() {
    Game.robot.update(1); updateParts(1); weather(PSTAGE, 1);
    const id = UIB.hit(this.buttons()); if (!id) return; const run = Run.cur;
    if (id === 'go') { Game.goWipe('map'); return; }
    const o = this.buttons().find(b => b.id === id).o;
    if (o.pick) {
      PickView.open(o.pick === 'copy' ? 'copy' : o.pick, c => {
        if (o.pick === 'remove') { Run.removeCard(c.uid); Snd.play('exhaust'); }
        else if (o.pick === 'upgrade') { c.up = true; Snd.play('unlock'); }
        else if (o.pick === 'copy') { Run.addCard(c.id, c.up); Snd.play('unlock'); }
        this.res = o.run(run); this.res.msg = this.res.msg || ''; Meta.save();
      });
      return;
    }
    this.res = o.run(run); Snd.play('uiok'); Meta.save();
  },
  drawWorld(t) { drawStage(Game.stage, 50, 0, t); drawEventPic(this.E.pic, 190 + MG, GY + MG, t); const r = Game.robot; r.draw(-MG, -MG); drawParts(-MG, -MG); drawParts(-MG, -MG, 'glow'); },
  drawHud(t) {
    const run = Run.cur; drawTopBar(run, t, run.hp, run.maxhp);
    panel(240, 26, 220, 20, '#1d1a2a', '#5a5670'); jtext(this.E.jp, 350, 30, 10, '#ffe07a', 'center');
    const L = this.buttons(); UIB.draw(L, t);
    if (!this.res) for (const b of L) {
      const o = b.o; if (!o) continue; jtext(o.label, b.x + 8, b.y + 9, 8, b.disabled ? '#5a5670' : '#ffffff');
      let x = b.x + b.w - 8; for (let i = o.chips.length - 1; i >= 0; i--) { const [k, v] = o.chips[i]; const s = typeof v === 'number' ? (v > 0 ? '+' + v : String(v)) : String(v); x -= textW(s) + 12; this.chip(k, x, b.y + 9); text(s, x + 10, b.y + 10, typeof v === 'number' && v < 0 ? '#ff9fb0' : '#ffe07a'); }
      if (UIB.hov === b.id) Tip.set(b.x, b.y + b.h + 2, o.label, [o.desc]);
    }
    if (this.res && this.res.msg) { panel(250, 70, 200, 40, '#1d1a2a', '#5a5670'); jwrap(this.res.msg, 186, 8).slice(0, 3).forEach((l, i) => jtext(l, 258, 76 + i * 10, 8, '#ffffff')); }
  },
  chip(k, x, y) {
    if (k === 'hp') heartIcon(x, y); else if (k === 'scrap') scrapIcon(x, y - 1); else if (k === 'card' || k === 'copy') { rectI(x + 1, y - 1, 7, 10, OUT); rectI(x + 2, y, 5, 8, '#f6f4ee'); } else if (k === 'can') drawCIcon('cola', x - 2, y - 3); else if (k === 'relic') drawRIcon('omamori', x - 3, y - 4);
    else if (k === 'up') chipIcon('nrg', x + 1, y); else if (k === 'remove') { rectI(x + 1, y, 7, 8, '#6d7380'); rectI(x, y - 1, 9, 2, '#9aa0ad'); } else if (k === 'junk') { rectI(x + 1, y - 1, 7, 10, OUT); rectI(x + 2, y, 5, 8, '#8a5a3a'); }
  },
};
function drawEventPic(pic, X, Y, t) {
  switch (pic) {
    case 'junk': for (let i = 0; i < 26; i++) { const x = X - 30 + hash2(i, 1) * 60, h = hash2(1, i) * 30; const y = Y - h * (1 - Math.abs(x - X) / 40); rectF(x, y - 8, 6 + hash2(i, 3) * 10, 6 + hash2(3, i) * 6, pick ? ['#9aa0ad', '#b98c60', '#6d6577', '#d8d4c8', '#8a5a3a'][i % 5] : '#999'); } ART.cone(X + 26, Y - 18); break;
    case 'vending': { rectF(X - 21, Y - 66, 42, 66, OUT); rectF(X - 20, Y - 65, 40, 65, '#d4524e'); rectF(X - 16, Y - 60, 32, 26, (t / 6 | 0) % 7 ? '#4a4e64' : '#e6f6ff'); lineF(X - 10, Y - 58, X + 4, Y - 40, '#1e1c28'); rectF(X - 16, Y - 28, 32, 5, '#8a2a2a'); if ((t | 0) % 40 < 6) Fx.sparks(X + 10 - MG, Y - 50 - MG, 2, 0); break; }
    case 'oldbot': { const c = '#9fb09a', cd = '#7a8a78'; R.begin(X, Y, -1); R.rect(-24, -10, 20, 10, cd); R.rect(6, -9, 24, 9, cd); R.ell(0, -30, 22, 22, c); R.ell(-2, -58, 12, 10, c); const arm = -1.2 - (0.9 + Math.sin(t * 0.2) * 0.4); R.line(14, -40, 14 + Math.cos(arm) * 20, -40 + Math.sin(arm) * 20, cd, 5); R.flush(OUT); R.dell(3, -59, 4, 4, OUT); R.dell(3, -59, 2.5, 2.5, '#ffd28a'); R.drect(-10, -24, 18, 10, '#4a5250'); R.drect(-6, -16, 10, 6, '#b8634f'); R.px(-2, -19, '#7dbb5a'); glow(X - 3, Y - 59, 10, '#ffd28a', 0.4); break; }
    case 'jizo': { R.begin(X, Y, 1); R.rect(-12, -6, 24, 6, '#8a8a90'); R.ell(0, -18, 9, 12, '#a8a8ae'); R.ell(0, -34, 7, 7, '#b0b0b6'); R.flush(OUT); R.dpoly([-8, -26, 8, -26, 0, -16], '#d8363f'); R.drect(-3, -35, 1, 1, OUT); R.drect(2, -35, 1, 1, OUT); rectF(X + 16, Y - 6, 6, 6, '#e8e2d6'); rectF(X + 17, Y - 9, 4, 3, '#6ac47a'); break; }
    case 'signyard': { const ids = ['noentry', 'tomare', 'rockfall', 'parking', 'oneway', 'deer', 'nopark']; ids.forEach((id, i) => { G.save(); G.translate(0, 0); resetFs(); const x = X - 50 + i * 17, y = Y - 16 - (i % 2) * 6; ART[id](x, y); G.restore(); resetFs(); }); break; }
    case 'crossing': { const on = (t / 10 | 0) % 2; sPole(X, Y - 60, Y); rectF(X - 14, Y - 66, 28, 8, OUT); ellipseF(X - 8, Y - 62, 3, 3, on ? '#ff4d3a' : '#5a1a1a'); ellipseF(X + 8, Y - 62, 3, 3, on ? '#5a1a1a' : '#ff4d3a'); glow(X + (on ? -8 : 8), Y - 62, 16, '#ff4d3a', 0.7); ART.crossing(X, Y - 82); lineF(X, Y - 36, X + 60, Y - 36, OUT, 5); for (let k = 0; k < 6; k++) lineF(X + k * 10, Y - 36, X + k * 10 + 10, Y - 36, k % 2 ? '#e0415a' : '#f6f4ee', 3); if ((t / 60 | 0) % 2 === 0) Snd.play('bell', { gap: 1.3 }); break; }
    case 'gacha': { rectF(X - 15, Y - 58, 30, 58, OUT); rectF(X - 14, Y - 57, 28, 57, '#e0415a'); ellipseF(X, Y - 42, 12, 12, OUT); ellipseF(X, Y - 42, 11, 11, '#e6f6ff'); for (let i = 0; i < 8; i++) ellipseF(X - 6 + (i % 3) * 6, Y - 46 + ((i / 3) | 0) * 6, 2.5, 2.5, ['#ffd23f', '#4f8fe8', '#6ac47a', '#ff9fb0'][i % 4]); ellipseF(X, Y - 16, 5, 5, '#c7ccd6'); lineF(X - 4, Y - 16, X + 4, Y - 16, OUT, 2); break; }
    case 'puddle': { ditherEllipse(X, Y + 2, 40, 5, '#8fb8e8', 0.8); ellipseF(X, Y + 2, 34, 3, '#bfe0f0'); G.save(); G.translate(X, Y + 2); G.scale(1, -0.6); resetFs(); ART.tomare(0, -18); G.restore(); resetFs(); break; }
  }
}
// ---------------------------------------------------------- run end (both outcomes)
SCENES.over = {
  enter(arg) {
    const run = Run.cur; this.won = arg && arg.won; this.t = 0; this.gray = 0;
    const xp = runXP(run, this.won); this.xp0 = Meta.d.xp; this.xp1 = this.xp0 + xp; this.gain = xp; this.shown = this.xp0;
    const l0 = Meta.d.level; Meta.d.xp = this.xp1; Meta.d.level = Meta.levelOf(this.xp1); this.levels = []; for (let l = l0 + 1; l <= Meta.d.level; l++) this.levels.push(l);
    this.prevBest = Meta.d.bestFloor || 0; this.newBest = (run.stats.floors || 0) > this.prevBest && !this.won;
    Meta.d.kills += run.stats.kills || 0; Meta.d.bestFloor = Math.max(Meta.d.bestFloor, run.stats.floors || 0);
    const r = Game.robot; r.x = 120; r.y = GY; r.face = 1; if (!this.won) r.act('dead');
    if (this.won) { Meta.d.wins++; Meta.d.alertMax = Math.max(Meta.d.alertMax, Math.min(5, (run.alert || 0) + 1)); }
    Meta.d.hist = [{ won: this.won, act: run.act, floor: run.floor, kit: run.kit, alert: run.alert, t: Date.now() }, ...(Meta.d.hist || [])].slice(0, 20);
    run.done = true; Meta.run = null; Meta.save(); Run.cur = run;
    Music.setSong(this.won ? 'win' : 'off'); Music.intensity(0); this.reveal = 0;
  },
  update() {
    this.t++; if (!this.won) this.gray = Math.min(0.85, this.t / 60);
    const r = Game.robot; r.update(1); updateParts(1);
    if (this.won) { if (this.t % 120 === 0) r.act('win'); }
    else if (this.t % 7 === 0) Fx.smoke(r.x + rnd(-6, 6), GY - 10, 1, 0.5, '#6a6a74');
    if (!this.won && this.t % 90 === 30) { Fx.sparks(r.x + 4, GY - 12, 3, -1); Snd.play('static', { p: 0.15 }); }
    if (this.t > 40) { const step = Math.max(1, Math.round(this.gain / 60)); if (this.shown < this.xp1) { this.shown = Math.min(this.xp1, this.shown + step); if (this.t % 3 === 0) Snd.play('tick', { pitch: 1 + (this.shown - this.xp0) / Math.max(1, this.gain) }); for (const l of this.levels) if (this.shown >= LEVEL_XP[l - 1] && !this['lv' + l]) { this['lv' + l] = true; Snd.play('levelUp'); Scr.flash('#fff3a0', 0.3); this.reveal = l; } } }
    const id = UIB.hit(this.buttons()); if (id === 'title') { Run.cur = null; Game.goWipe('title'); }
  },
  buttons() { return this.t > 60 ? [{ id: 'title', x: W / 2 - 55, y: H - 38, w: 110, h: 26, label: 'TITLE', sub: 'タイトルへ' }] : []; },
  drawWorld(t) { drawStage(Game.stage, 40, 0, t); G.globalAlpha = 0.5; rectI(0, 0, lo.width, lo.height, '#0d0c14'); G.globalAlpha = 1; Game.robot.draw(-MG, -MG); drawParts(-MG, -MG); },
  drawHud(t) {
    const run = Run.cur; const s = this.won ? 'ARRIVED' : 'SHUTDOWN';
    textC(s, W / 2, 22, this.won ? '#ffe07a' : '#ff6b7a', true, 3, OUT);
    // route track: how far this run got (3 acts x 7 stops) + best record flag
    const st = run.stats; const per = 7, tot = per * 3, fl = Math.min(tot, st.floors || 0);
    const tx0 = W / 2 - 150, tx1 = W / 2 + 150, ty = 60; const sx = i => tx0 + (tx1 - tx0) * i / tot;
    rectI(tx0 - 4, ty - 3, tx1 - tx0 + 8, 7, OUT); rectI(tx0 - 3, ty - 2, tx1 - tx0 + 6, 5, '#3a3a44');
    const grow = clamp((this.t - 10) / 50, 0, 1); const fx = sx(fl * easeOut(grow));
    rectI(tx0 - 3, ty - 2, Math.round(fx - tx0 + 3), 5, this.won ? '#ffd23f' : '#c8a040');
    for (let i = 0; i <= tot; i += 2) if (sx(i) > fx) rectI(Math.round(sx(i)), ty, 3, 1, '#8a8a94');
    for (let a = 1; a <= 3; a++) { const x = sx(a * per); G.save(); G.translate(Math.round(x), ty); G.scale(0.6, 0.6); resetFs(); drawNodeIcon('boss', 0, 0, t); G.restore(); resetFs(); }
    if (this.prevBest > 0 && this.prevBest < tot) { const bx = Math.round(sx(this.prevBest)); rectI(bx, ty - 16, 1, 14, '#e8e2d6'); polyF([bx + 1, ty - 16, bx + 8, ty - 13, bx + 1, ty - 10], this.newBest ? '#8a86a0' : '#ff6b7a'); }
    miniBot(fx, ty - 3, t, 1, this.won || grow < 1 ? t * 0.3 : 0);
    if (this.newBest && grow >= 1 && (t / 16 | 0) % 2) textC('BEST', fx, ty - 22, '#ffe07a', true, 1, OUT);
    // stat tiles (icon + number; hover for the name)
    const tiles = [['kills', '撃破', st.kills || 0], ['elite', '強敵', st.elites || 0], ['stop', '止めた回数', st.stops || 0], ['hz', '危険標識', st.hazards || 0], ['hit', '最大ダメージ', st.maxHit || 0], ['cards', '使ったカード', st.cards || 0]];
    const tw = 40, tg = 6, tx = Math.round(W / 2 - (tiles.length * (tw + tg) - tg) / 2), tyy = 84;
    tiles.forEach(([k, name, v], i) => {
      const x = tx + i * (tw + tg), a = clamp((this.t - 30 - i * 5) / 10, 0, 1); if (a <= 0) return;
      const y = tyy + Math.round((1 - easeOut(a)) * 8); G.globalAlpha = a;
      const hv = In.in(x, tyy, tw, 38); panel(x, y, tw, 38, hv ? '#3a3458' : '#1d1a2a', OUT, hv ? '#7a74a0' : '#4a4460');
      const cx = x + tw / 2, cy = y + 12;
      if (k === 'kills') drawIntent('atk', cx - 6, cy - 6, t, true);
      else if (k === 'elite') { G.save(); G.translate(cx, cy); G.scale(0.8, 0.8); resetFs(); drawNodeIcon('elite', 0, 0, t); G.restore(); resetFs(); }
      else if (k === 'stop') drawIntent('stopped', cx - 6, cy - 6, t, true);
      else if (k === 'hz') drawNodeIcon('battle', cx, cy, t);
      else if (k === 'hit') { const star = (r1, r2) => { const P = []; for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2 - Math.PI / 2, rr = q % 2 ? r2 : r1; P.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } return P; }; polyF(star(9, 5), OUT); polyF(star(7.5, 4), '#ff8a3a'); polyF(star(4, 2.2), '#fff3a0'); }
      else if (k === 'cards') { rectI(cx - 5, cy - 7, 10, 14, OUT); rectI(cx - 4, cy - 6, 8, 12, '#f6f4ee'); rectI(cx - 4, cy - 6, 8, 3, '#d8363f'); rectI(cx - 8, cy - 5, 4, 12, OUT); rectI(cx - 7, cy - 4, 3, 10, '#c7ccd6'); }
      textC(String(Math.round(v * clamp((this.t - 40 - i * 5) / 30, 0, 1))), cx, y + 26, '#ffffff', true);
      G.globalAlpha = 1; if (hv) Tip.set(x, tyy + 40, name, [String(v)]);
    });
    // xp bar
    const lv = Meta.levelOf(this.shown); const a = LEVEL_XP[lv - 1] || 0, b2 = LEVEL_XP[lv] || a + 1;
    textO(`LV ${lv}`, W / 2 - 80, 150, '#ffe07a', OUT, true); rectI(W / 2 - 50, 152, 130, 6, OUT); rectI(W / 2 - 49, 153, 128, 4, '#3a3550'); rectI(W / 2 - 49, 153, Math.round(128 * clamp((this.shown - a) / (b2 - a), 0, 1)), 4, '#ffd23f');
    text(`+${this.gain} XP`, W / 2 + 84, 152, '#ffe07a');
    if (this.reveal && UNLOCKS[this.reveal]) {
      const u = UNLOCKS[this.reveal]; panel(W / 2 - 110, 166, 220, 50, '#2a2440', '#ffe07a'); jtext(`UNLOCK：${u.name}`, W / 2, 170, 8, '#ffe07a', 'center');
      const items = (u.cards || []).map(id => ({ c: id })).concat((u.relics || []).map(id => ({ r: id })));
      items.slice(0, 6).forEach((it, i) => { const x = W / 2 - items.length * 13 + i * 26; if (it.c) { const T = TYPEC[CARDS[it.c].type]; panel(x, 184, 22, 28, T.f); G.save(); G.beginPath(); G.rect(x + 1, 185, 20, 26); G.clip(); resetFs(); ART[it.c](x + 11, 198, t); G.restore(); resetFs(); } else drawRIcon(it.r, x + 4, 190); });
      if (u.kit) jtext(`${KITS[u.kit].jp} が使えるようになった`, W / 2, 192, 8, '#ffffff', 'center');
    }
    UIB.draw(this.buttons(), t);
  },
};
// ---------------------------------------------------------- collection
SCENES.coll = {
  enter() { this.tab = 'c'; this.scroll = 0; Game.setStage(0); },
  buttons() { return [{ id: 'tc', x: 20, y: 22, w: 70, h: 18, label: 'CARDS', c: this.tab === 'c' ? '#3a3458' : null }, { id: 'tr', x: 94, y: 22, w: 70, h: 18, label: 'PARTS', c: this.tab === 'r' ? '#3a3458' : null }, { id: 'back', x: W - 80, y: 22, w: 64, h: 18, label: 'BACK', snd: 'back' }]; },
  update() {
    this.scroll = clamp(this.scroll + In.wheel * 24, 0, 900);
    const id = UIB.hit(this.buttons()); if (id === 'tc') { this.tab = 'c'; this.scroll = 0; } if (id === 'tr') { this.tab = 'r'; this.scroll = 0; } if (id === 'back') Game.goWipe('title');
  },
  drawWorld(t) { drawStage(Game.stage, 60, 0, t); G.globalAlpha = 0.7; rectI(0, 0, lo.width, lo.height, '#0d0c14'); G.globalAlpha = 1; },
  drawHud(t) {
    textC('COLLECTION', W / 2, 8, '#ffe07a', true, 1, OUT); UIB.draw(this.buttons(), t);
    if (this.tab === 'c') {
      const ids = Object.keys(CARDS).filter(id => CARDS[id].rar !== 'x'); const seen = Meta.d.seen.c;
      const n = ids.filter(id => seen[id]).length; text(`${n}/${ids.length}`, 176, 28, '#bdb6d8');
      const cols = 7, gap = 6, x0 = W / 2 - (cols * (CW + gap) - gap) / 2, y0 = 46; let hov = -1;
      G.save(); G.beginPath(); G.rect(0, y0 - 2, W, H - y0); G.clip(); resetFs();
      ids.forEach((id, i) => {
        const x = x0 + (i % cols) * (CW + gap), y = y0 + Math.floor(i / cols) * (CH + 6) - this.scroll; if (y > H || y + CH < 0) return;
        const un = Meta.unlocked('cards', id);
        if (seen[id]) { G.drawImage(cardFace({ id, up: false, uid: -500 - i }, null, true), x, y); if (In.in(x, y, CW, CH) && In.my > y0) hov = i; }
        else { panel(x, y, CW, CH, '#26222f', '#3a3550'); textC(un ? '?' : 'LOCK', x + CW / 2, y + 34, '#5a5670', true); if (!un) { const lv = Object.keys(UNLOCKS).find(k => (UNLOCKS[k].cards || []).includes(id)); textC(`LV ${lv}`, x + CW / 2, y + 46, '#5a5670'); } }
      });
      G.restore(); resetFs();
      if (hov >= 0) { const id = ids[hov]; const x = x0 + (hov % cols) * (CW + gap); const c = { id, up: false }; Tip.set(x + CW + 2 > W - 150 ? x - 152 : x + CW + 2, y0 + Math.floor(hov / cols) * (CH + 6) - this.scroll, CARDS[id].jp, [cardDesc(c)], { w: 150 }); }
    } else {
      const ids = Object.keys(RELICS); const seen = Meta.d.seen.r; let i = 0;
      for (const id of ids) {
        const x = 30 + (i % 12) * 36, y = 50 + Math.floor(i / 12) * 40; i++;
        panel(x, y, 30, 30, '#26222f', '#3a3550');
        if (seen[id]) { drawRIcon(id, x + 8, y + 8); if (In.in(x, y, 30, 30)) Tip.set(x + 32, y, RELICS[id].jp, [RELICS[id].desc]); }
        else textC(Meta.unlocked('relics', id) ? '?' : 'X', x + 15, y + 12, '#5a5670', true);
      }
    }
  },
};
