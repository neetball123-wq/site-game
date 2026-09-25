'use strict';
// ============================================================
//  meta: run state, map generation, rewards, shop, events, save, unlocks
// ============================================================
const SAVE_KEY = 'tomaredeck.v1';
const LEVEL_XP = [0, 60, 150, 280, 450, 650, 900, 1200, 1600, 2100];
const UNLOCKS = {
  2: { name: '危険標識', cards: ['rockfall', 'deer', 'merge', 'crosswalk'] },
  3: { name: '踏切', cards: ['crossing', 'slippery', 'mirror', 'signal'] },
  4: { name: 'パーツ追加', relics: ['triangle', 'jumper', 'hazardlamp', 'mechanic', 'lantern'] },
  5: { name: '工事キット', kit: 'roadwork' },
  6: { name: '雨の標識', cards: ['acidrain', 'jam', 'roundabout', 'convoy'] },
  7: { name: 'レアパーツ', relics: ['airbag', 'cruise', 'supercharger', 'navi'] },
  8: { name: '高速キット', kit: 'highway' },
  9: { name: '自販機の新商品', cans: ['extinguisher', 'sports'] },
  10: { name: '最高レベル', title: 1 },
};
const LOCKED = { cards: new Set(), relics: new Set(), cans: new Set(), kits: new Set() };
for (const k in UNLOCKS) { const u = UNLOCKS[k]; (u.cards || []).forEach(i => LOCKED.cards.add(i)); (u.relics || []).forEach(i => LOCKED.relics.add(i)); (u.cans || []).forEach(i => LOCKED.cans.add(i)); if (u.kit) LOCKED.kits.add(u.kit); }

const Meta = {
  d: { v: 1, xp: 0, level: 1, runs: 0, wins: 0, bestFloor: 0, kills: 0, alertMax: 0, seen: { c: {}, r: {}, e: {} }, mute: false, hist: [] },
  run: null, playMs: 0,
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (s && s.meta) { Object.assign(this.d, s.meta); this.run = s.run || null; this.playMs = s.playMs || 0; }
    } catch (e) { }
  },
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ meta: this.d, run: Run.cur && !Run.cur.done ? Run.toJSON(Run.cur) : null, playMs: this.playMs, best: this.d.bestFloor, wins: this.d.wins, runs: this.d.runs, level: this.d.level })); } catch (e) { }
  },
  unlocked(kind, id) {
    if (!LOCKED[kind].has(id)) return true;
    for (let l = 2; l <= this.d.level; l++) { const u = UNLOCKS[l]; if (!u) continue; if ((u[kind] || []).includes(id) || (kind === 'kits' && u.kit === id)) return true; }
    return false;
  },
  levelOf(xp) { let l = 1; for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) l = i + 1; return Math.min(l, LEVEL_XP.length); },
  see(kind, id) { if (!this.d.seen[kind][id]) { this.d.seen[kind][id] = 1; } },
};

// ============================================================
//  run
// ============================================================
const Run = {
  cur: null,
  create(kit, alert, seed) {
    seed = seed || ((Math.random() * 1e9) | 0);
    const K = KITS[kit] || KITS.tomare;
    const r = {
      v: 1, seed, rng: new RNG(seed), kit, alert: alert || 0, hp: 70, maxhp: 70, scrap: 99, deck: K.deck.map(id => newCard(id)), relics: [K.relic], cans: [null, null, null],
      act: 0, floor: 0, map: null, pos: null, stats: { kills: 0, elites: 0, bosses: 0, cards: 0, maxHit: 0, stops: 0, hazards: 0, floors: 0, t0: Date.now() }, removeCost: 75, airbagUsed: false, done: false,
    };
    if (r.alert >= 5) { r.maxhp -= 10; r.hp -= 10; r.deck.push(newCard('pothole')); }
    for (const c of r.deck) Meta.see('c', c.id); Meta.see('r', K.relic);
    r.map = genMap(r.rng, 0);
    this.cur = r; Meta.d.runs++; Meta.save();
    return r;
  },
  toJSON(r) { const o = Object.assign({}, r); o.rngS = r.rng.s; delete o.rng; return o; },
  fromJSON(o) { const r = Object.assign({}, o); r.rng = new RNG(1); r.rng.s = o.rngS; for (const c of r.deck) UID = Math.max(UID, c.uid + 1); return r; },
  heal(n) { const r = this.cur; r.hp = Math.min(r.maxhp, r.hp + n); },
  addCard(id, up) { const c = newCard(id, up); this.cur.deck.push(c); Meta.see('c', id); return c; },
  removeCard(uid) { const r = this.cur; const i = r.deck.findIndex(c => c.uid === uid); if (i >= 0) r.deck.splice(i, 1); },
  addRelic(id) { const r = this.cur; if (r.relics.includes(id)) return; r.relics.push(id); Meta.see('r', id); const d = RELICS[id]; if (d.onPickup) d.onPickup(r); },
  addCan(id) { const r = this.cur; const i = r.cans.indexOf(null); if (i < 0) return false; r.cans[i] = id; return true; },
  gainScrap(n) { const r = this.cur; if (r.relics.includes('purse')) n = Math.round(n * 1.3); r.scrap += n; return n; },
};

// ============================================================
//  map
// ============================================================
const MAP_ROWS = 6, MAP_COLS = 4;
function genMap(rng, act) {
  const nodes = []; for (let r = 0; r < MAP_ROWS; r++) nodes.push(new Array(MAP_COLS).fill(null));
  const edges = [];
  const ensure = (r, c) => nodes[r][c] || (nodes[r][c] = { r, c, type: null, next: [] });
  const starts = rng.shuffle([0, 1, 2, 3]).slice(0, 3); starts.push(rng.int(0, 3));
  for (const s of starts) {
    let col = s;
    for (let r = 0; r < MAP_ROWS; r++) {
      const n = ensure(r, col);
      if (r === MAP_ROWS - 1) break;
      let nc = clamp(col + rng.int(-1, 1), 0, MAP_COLS - 1);
      for (const [r0, a, b] of edges) if (r0 === r && ((col < a && nc > b) || (col > a && nc < b))) nc = b;
      if (!edges.some(([r0, a, b]) => r0 === r && a === col && b === nc)) edges.push([r, col, nc]);
      if (!n.next.includes(nc)) n.next.push(nc);
      col = nc;
    }
  }
  // types
  const roll = (r) => {
    if (r === 0) return 'battle';
    if (r === 1) return rng.weighted([['battle', 70], ['event', 30]]);
    if (r === 2) return rng.weighted([['battle', 45], ['event', 30], ['shop', 25]]);
    if (r === 3) return rng.weighted([['elite', 55], ['battle', 25], ['event', 20]]);
    if (r === 4) return rng.weighted([['treasure', 45], ['shop', 30], ['event', 25]]);
    return 'rest';
  };
  for (let r = 0; r < MAP_ROWS; r++) {
    const row = nodes[r].filter(Boolean);
    for (const n of row) n.type = roll(r);
    if (r === 3 && row.length > 1) { if (!row.some(n => n.type === 'elite')) rng.pick(row).type = 'elite'; if (row.every(n => n.type === 'elite')) rng.pick(row).type = 'battle'; }
    if (r === 3 && row.length === 1) row[0].type = 'elite';
  }
  // layout positions (bottom to top)
  for (let r = 0; r < MAP_ROWS; r++) for (const n of nodes[r]) if (n) { n.x = 120 + n.c * 80 + rng.int(-10, 10); n.y = H - 40 - r * 28 + rng.int(-3, 3); }
  const boss = { r: MAP_ROWS, c: 1.5, type: 'boss', next: [], x: 240, y: H - 40 - MAP_ROWS * 28 - 10 };
  return { nodes, boss, act };
}
function mapNode(map, r, c) { return r === MAP_ROWS ? map.boss : map.nodes[r] && map.nodes[r][c]; }
function reachable(run) {
  const m = run.map;
  if (!run.pos) return m.nodes[0].filter(Boolean);
  if (run.pos.r === MAP_ROWS - 1) return [m.boss];
  if (run.pos.r >= MAP_ROWS) return [];
  const n = mapNode(m, run.pos.r, run.pos.c); return n.next.map(c => m.nodes[run.pos.r + 1][c]).filter(Boolean);
}
const NODE_JP = { battle: '戦闘', elite: '強敵', rest: '休憩所', shop: 'お店', treasure: '宝箱', event: '？', boss: 'ボス' };
const NODE_DESC = { battle: '敵と戦う。勝つとカードとスクラップ。', elite: '手ごわい敵。勝つとパーツが手に入る。', rest: 'HP を回復するか、カードを磨く。', shop: 'カード・パーツ・飲み物を買える。カードの廃棄も。', treasure: 'パーツが入った箱。', event: '何かがある。', boss: 'この区間の主。' };

// ============================================================
//  encounters & rewards
// ============================================================
function pickEncounter(run, kind) {
  const E = ENCOUNTERS[Math.min(run.act, ENCOUNTERS.length - 1)];
  run.fights = run.fights || { n: 0, last: [] };
  let pool = kind === 'boss' ? E.boss : kind === 'elite' ? E.elite : (run.fights.n < 2 && run.act === 0 ? E.weak : E.normal);
  const keyOf = g => g.join(',');
  let opts = pool.filter(g => !run.fights.last.includes(keyOf(g))); if (!opts.length) opts = pool;
  const g = run.rng.pick(opts); run.fights.last = [keyOf(g), ...run.fights.last].slice(0, 3); if (kind === 'battle') run.fights.n++;
  return g.slice();
}
function cardPool(run) { return CARD_POOL.filter(id => Meta.unlocked('cards', id)); }
function rollCardReward(run, kind) {
  let n = 3 + (run.relics.includes('navi') ? 1 : 0) - (run.relics.includes('v8') ? 1 : 0);
  const pool = cardPool(run); const out = [];
  const w = kind === 'boss' ? [['r', 1]] : kind === 'elite' ? [['c', 40], ['u', 45], ['r', 15]] : [['c', 60], ['u', 34], ['r', 6]];
  let guard = 0;
  while (out.length < n && guard++ < 100) {
    const rar = run.rng.weighted(w); const cand = pool.filter(id => CARDS[id].rar === rar && !out.some(o => o.id === id));
    if (!cand.length) continue;
    const id = run.rng.pick(cand); const up = run.rng.chance(run.act === 0 ? 0 : run.act === 1 ? 0.12 : 0.25);
    out.push({ id, up });
  }
  return out;
}
function rollRelic(run, rar) {
  const owned = new Set(run.relics);
  const pool = rar === 'b' ? Object.keys(RELICS).filter(id => RELICS[id].rar === 'b' && !owned.has(id)) : Object.keys(RELICS).filter(id => ['c', 'u', 'r'].includes(RELICS[id].rar) && !owned.has(id) && Meta.unlocked('relics', id));
  if (!pool.length) return null;
  if (rar === 'b') return run.rng.pick(pool);
  const want = rar || run.rng.weighted([['c', 50], ['u', 35], ['r', 15]]);
  const p2 = pool.filter(id => RELICS[id].rar === want); return run.rng.pick(p2.length ? p2 : pool);
}
function rollCan(run) { const pool = Object.keys(CANS).filter(id => Meta.unlocked('cans', id)); return run.rng.pick(pool); }
function makeReward(run, kind) {
  const R = { items: [], kind };
  const base = kind === 'boss' ? run.rng.int(80, 95) : kind === 'elite' ? run.rng.int(28, 36) : run.rng.int(12, 18);
  R.items.push({ k: 'scrap', n: base });
  if (kind === 'elite') R.items.push({ k: 'relic', id: rollRelic(run) });
  if (run.rng.chance(kind === 'elite' ? 0.5 : kind === 'boss' ? 0 : 0.35)) R.items.push({ k: 'can', id: rollCan(run) });
  R.items.push({ k: 'card', opts: rollCardReward(run, kind) });
  if (kind === 'boss') R.items.push({ k: 'bossrelic', opts: [rollRelic(run, 'b'), rollRelic(run, 'b'), rollRelic(run, 'b')].filter((v, i, a) => v && a.indexOf(v) === i) });
  R.items = R.items.filter(it => it.k !== 'relic' || it.id);
  return R;
}
function genShop(run) {
  const pool = cardPool(run); const rng = run.rng; const disc = run.relics.includes('keychain') ? 0.8 : 1;
  const priceOf = id => Math.round({ c: rng.int(48, 56), u: rng.int(72, 82), r: rng.int(140, 160) }[CARDS[id].rar] * disc);
  const cards = []; const types = ['atk', 'atk', 'skl', 'def', 'pwr'];
  for (const tp of types) { const cand = pool.filter(id => (CARDS[id].type === tp || (tp === 'skl' && CARDS[id].type === 'skl')) && !cards.some(c => c.id === id)); const id = cand.length ? rng.pick(cand) : rng.pick(pool); cards.push({ id, up: false, price: priceOf(id) }); }
  const sale = rng.int(0, cards.length - 1); cards[sale].price = Math.round(cards[sale].price / 2); cards[sale].sale = true;
  const relics = []; for (let i = 0; i < 2; i++) { const id = rollRelic(run); if (id && !relics.some(r => r.id === id)) relics.push({ id, price: Math.round({ c: rng.int(150, 170), u: rng.int(210, 240), r: rng.int(270, 300) }[RELICS[id].rar] * disc) }); }
  const cans = []; for (let i = 0; i < 2; i++) { const id = rollCan(run); cans.push({ id, price: Math.round(rng.int(50, 70) * disc) }); }
  return { cards, relics, cans, remove: { price: Math.round(run.removeCost * disc), used: false } };
}

// ============================================================
//  events — pictures + short choices (effects are applied by the scene)
// ============================================================
const EVENTS = {
  junk: {
    jp: 'ガラクタの山', pic: 'junk',
    opts: [
      { label: '掘る', chips: [['hp', -6], ['card', 1]], desc: 'HP を 6 失い、ランダムなカードを 1 枚手に入れる。', run(r) { r.hp = Math.max(1, r.hp - 6); const id = r.rng.pick(cardPool(r)); Run.addCard(id); return { msg: `${CARDS[id].jp} を拾った。`, card: id }; } },
      { label: '調べる', chips: [['scrap', '?']], desc: '運がよければスクラップ。悪いと手をケガする。', run(r) { if (r.rng.chance(0.6)) { const n = Run.gainScrap(r.rng.int(25, 45)); return { msg: `スクラップを ${n} 見つけた。` }; } r.hp = Math.max(1, r.hp - 4); return { msg: '手をはさんだ。HP -4。' }; } },
      { label: '立ち去る', chips: [], desc: '何もしない。', run() { return { msg: '' }; } },
    ],
  },
  vending: {
    jp: '壊れた自販機', pic: 'vending',
    opts: [
      { label: '蹴る', chips: [['can', '?'], ['hp', '-?']], desc: '60% で飲み物が出てくる。40% で足を痛めて HP -5。', run(r) { if (r.rng.chance(0.6)) { const id = rollCan(r); const ok = Run.addCan(id); return { msg: ok ? `${CANS[id].jp} が出てきた。` : `${CANS[id].jp} が出てきたが、持ちきれない。` }; } r.hp = Math.max(1, r.hp - 5); return { msg: 'ガンッ。足を痛めた。HP -5。' }; } },
      { label: '20 払う', chips: [['scrap', -20], ['can', 2]], desc: 'スクラップ 20 で 飲み物 2 本。', need: r => r.scrap >= 20, run(r) { r.scrap -= 20; let n = 0; for (let i = 0; i < 2; i++) if (Run.addCan(rollCan(r))) n++; return { msg: n ? `飲み物を ${n} 本買った。` : '持ちきれなかった。' }; } },
      { label: '立ち去る', chips: [], desc: '何もしない。', run() { return { msg: '' }; } },
    ],
  },
  oldbot: {
    jp: '古いロボット', pic: 'oldbot',
    opts: [
      { label: '隣に座る', chips: [['hp', 15]], desc: 'しばらく一緒に街を眺める。HP を 15 回復。', run(r) { Run.heal(15); return { msg: '手を振ってくれた。HP +15。' }; } },
      { label: 'カードを預ける', chips: [['remove', 1]], desc: 'デッキのカードを 1 枚預ける（取り除く）。', pick: 'remove', run() { return { msg: 'カードを預けた。' }; } },
    ],
  },
  jizo: {
    jp: '道ばたのお地蔵さん', pic: 'jizo',
    opts: [
      { label: 'お供え 25', chips: [['scrap', -25], ['up', 2]], desc: 'スクラップ 25 を供える。ランダムなカード 2 枚が磨かれる。', need: r => r.scrap >= 25, run(r) { r.scrap -= 25; const c = r.rng.shuffle(r.deck.filter(c => !c.up && CARDS[c.id].type !== 'junk')).slice(0, 2); c.forEach(x => x.up = true); return { msg: c.length ? c.map(x => CARDS[x.id].jp).join('と') + ' が磨かれた。' : '磨けるカードがなかった。' }; } },
      { label: '手を合わせる', chips: [['hp', 5]], desc: '心が落ち着く。HP を 5 回復。', run(r) { Run.heal(5); return { msg: 'HP +5。' }; } },
    ],
  },
  signyard: {
    jp: '標識置き場', pic: 'signyard',
    opts: [
      { label: '持っていく', chips: [['card', 'R'], ['junk', 1]], desc: 'レアカードを 1 枚。ただしサビついた標識もついてくる。', run(r) { const cand = cardPool(r).filter(id => CARDS[id].rar === 'r'); const id = r.rng.pick(cand); Run.addCard(id); Run.addCard('rustcard'); return { msg: `${CARDS[id].jp} と サビついた標識 を手に入れた。`, card: id }; } },
      { label: '磨く', chips: [['up', 1]], desc: 'デッキのカードを 1 枚選んで磨く。', pick: 'upgrade', run() { return { msg: '磨いた。' }; } },
    ],
  },
  crossing: {
    jp: '開かずの踏切', pic: 'crossing',
    opts: [
      { label: '待つ', chips: [['hp', 8]], desc: '電車が通り過ぎるのを待つ。HP を 8 回復。', run(r) { Run.heal(8); return { msg: 'カンカンカン……。HP +8。' }; } },
      { label: 'くぐる', chips: [['card', 'R'], ['hp', '-?']], desc: '50% でレアカード。50% で HP -12。', run(r) { if (r.rng.chance(0.5)) { const id = r.rng.pick(cardPool(r).filter(i => CARDS[i].rar === 'r')); Run.addCard(id); return { msg: `向こう側で ${CARDS[id].jp} を拾った。`, card: id }; } r.hp = Math.max(1, r.hp - 12); return { msg: '遮断機に頭をぶつけた。HP -12。' }; } },
    ],
  },
  gacha: {
    jp: 'ガチャガチャ', pic: 'gacha',
    opts: [
      { label: '回す 30', chips: [['scrap', -30], ['relic', 1]], desc: 'スクラップ 30 で ランダムなパーツ。', need: r => r.scrap >= 30, run(r) { r.scrap -= 30; const id = rollRelic(r, 'c') || rollRelic(r); if (id) { Run.addRelic(id); return { msg: `${RELICS[id].jp} が出た。` }; } return { msg: '空っぽだった。' }; } },
      { label: '立ち去る', chips: [], desc: '何もしない。', run() { return { msg: '' }; } },
    ],
  },
  puddle: {
    jp: '水たまり', pic: 'puddle',
    opts: [
      { label: 'のぞく', chips: [['copy', 1]], desc: 'デッキのカードを 1 枚選んで、写しを作る。', pick: 'copy', run() { return { msg: '水面の標識が、ひとつ増えた。' }; } },
      { label: '立ち去る', chips: [], desc: '何もしない。', run() { return { msg: '' }; } },
    ],
  },
};
function rollEvent(run) { const seen = run.events || []; let ids = Object.keys(EVENTS).filter(id => !seen.includes(id)); if (!ids.length) ids = Object.keys(EVENTS); const id = run.rng.pick(ids); run.events = [...seen, id]; return id; }

// ---------- xp ----------
function runXP(run, won) { const s = run.stats; return (s.floors || 0) * 4 + (s.kills || 0) + (s.elites || 0) * 12 + (s.bosses || 0) * 40 + (won ? 100 : 0); }
