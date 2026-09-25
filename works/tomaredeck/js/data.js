'use strict';
// ============================================================
//  data: cards, statuses, enemies, parts, drinks, events, unlocks
//  card effects are generators run by the battle queue (battle.js: A.*)
// ============================================================

// ---------- statuses ----------
const STATUS = {
  str: { jp: '馬力', icon: 'str', good: true, desc: n => `攻撃のダメージが ${n} 増える。` },
  dex: { jp: '装甲', icon: 'dex', good: true, desc: n => `カードで得るブロックが ${n} 増える。` },
  slow: { jp: '徐行', icon: 'slow', turns: true, desc: n => `与える攻撃ダメージが 25% 減る。あと ${n} ターン。` },
  dent: { jp: 'へこみ', icon: 'dent', turns: true, desc: n => `受ける攻撃ダメージが 50% 増える。あと ${n} ターン。` },
  rust: { jp: 'サビ', icon: 'rust', desc: n => `ターンのはじめに ${n} ダメージ。そのあと 1 減る。` },
  nopark: { jp: '駐車禁止', icon: 'nopark', turns: true, desc: n => `ブロックを得られない。あと ${n} ターン。` },
  thorns: { jp: 'トゲ', icon: 'thorns', good: true, desc: n => `攻撃されるたびに、相手に ${n} ダメージ。` },
  grow: { jp: '暖機', icon: 'grow', good: true, desc: n => `ターンの終わりに 馬力 +${n}。` },
  plated: { jp: '装甲板', icon: 'plated', good: true, desc: n => `ターンの終わりに ブロック ${n}。攻撃を受けると 1 減る。` },
  explode: { jp: '引火', icon: 'explode', desc: n => `倒されると爆発して、全員に ${n} ダメージ。` },
  redlight: { jp: '赤信号', icon: 'redlight', desc: n => `このあいだに攻撃カードを使うと ${n} ダメージを受ける（信号無視）。` },
  dark: { jp: '暗がり', icon: 'dark', desc: n => `次のターン、引くカードが ${n} 枚減る。` },
  grab: { jp: 'つかみ', icon: 'grab', desc: n => `カードを ${n} 枚つかんでいる。倒すと戻る。` },
  // player powers
  oneway: { jp: '一方通行', icon: 'oneway', good: true, desc: n => `毎ターン、最初の攻撃カードが 2 回発動する。` },
  highway: { jp: '高速道路', icon: 'highway', good: true, desc: n => `ターンのはじめに カードを ${n} 枚多く引く。` },
  signal: { jp: '信号機', icon: 'signal', good: true, desc: n => `毎ターン 青→黄→赤 と切り替わる。青：エネルギー+1　黄：2枚引く　赤：ブロック8。` },
  roadwork: { jp: '工事中', icon: 'roadwork', good: true, desc: n => `ターンのはじめに ブロックを得る（あと ${n} 回）。` },
  convoy: { jp: '車間距離', icon: 'convoy', good: true, desc: n => `攻撃カードを使うたびに ブロック ${n}。` },
  parking: { jp: '駐車中', icon: 'parking', good: true, desc: n => `次のターン、ブロックが消えない。` },
  mirror: { jp: 'カーブミラー', icon: 'mirror', good: true, desc: n => `次に使うカードが 2 回発動する。` },
};
const KEYWORDS = {
  exhaust: ['使い切り', '使うと、この戦闘ではもう戻ってこない。'],
  retain: ['保持', 'ターンの終わりに捨てられず、手札に残る。'],
  innate: ['初手', '戦闘のはじめに必ず手札にくる。'],
  ethereal: ['はかない', 'ターンの終わりに手札にあると、使い切りになる。'],
  unplayable: ['使えない', 'このカードは使えない。'],
  hazard: ['危険標識', '地面に標識を立てる。数字のターンが経つと発動する。'],
  stop: ['止まれ', '敵は次の行動をしない。強い敵ほど、止めるのに何枚も必要。'],
};

// ---------- cards ----------
// face(): list of chips shown on the card: { i: icon, n: number, dmg: apply attack modifiers, blk: apply block modifiers, all: hits all, x: repeat }
const CARDS = {
  swing: {
    en: 'SWING', jp: '標識スイング', type: 'atk', rar: 's', cost: 1, tgt: 'enemy', v: { d: 6 }, u: { d: 9 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }], desc: v => `${v.d} ダメージ。`,
    *play(c, v, t) { yield* A.attack(t, v.d, { pose: 'swing' }); },
  },
  guard: {
    en: 'GUARD', jp: 'ガードレール', type: 'def', rar: 's', cost: 1, tgt: 'self', v: { b: 5 }, u: { b: 8 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }], desc: v => `ブロック ${v.b}。`,
    *play(c, v) { yield* A.block(v.b, 'rail'); },
  },
  tomare: {
    en: 'TOMARE', jp: '止まれ', type: 'skl', rar: 's', cost: 2, tgt: 'enemy', v: { s: 1 }, u: { s: 1, cost: 1 },
    face: v => [{ i: 'stop', n: v.s }], desc: v => `止まれ ${v.s}。`, kws: ['stop'],
    *play(c, v, t) { yield* A.stop(t, v.s); },
  },
  // ---- common attacks
  double: {
    en: 'DOUBLE', jp: '二段振り', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: { d: 4 }, u: { d: 5 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1, x: 2 }], desc: v => `${v.d} ダメージを 2 回。`,
    *play(c, v, t) { yield* A.attack(t, v.d, { pose: 'swing', hits: 2 }); },
  },
  sweep: {
    en: 'SWEEP', jp: 'なぎ払い', type: 'atk', rar: 'c', cost: 1, tgt: 'all', v: { d: 5 }, u: { d: 8 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1, all: 1 }], desc: v => `敵全体に ${v.d} ダメージ。`,
    *play(c, v) { yield* A.attackAll(v.d, { pose: 'sweep' }); },
  },
  slam: {
    en: 'SLAM', jp: '叩きつけ', type: 'atk', rar: 'c', cost: 2, tgt: 'enemy', v: { d: 13, s: 1 }, u: { d: 17, s: 2 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }, { i: 'dent', n: v.s }], desc: v => `${v.d} ダメージ。へこみ ${v.s}。`,
    *play(c, v, t) { yield* A.attack(t, v.d, { pose: 'heavy', heavy: 1 }); if (t.alive) yield* A.status(t, 'dent', v.s); },
  },
  rearend: {
    en: 'REAR END', jp: '追突', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: { d: 6 }, u: { d: 8 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }, { i: 'stop', t: 'x3' }], desc: v => `${v.d} ダメージ。止まっている敵には 3 倍。`, kws: ['stop'],
    *play(c, v, t) { yield* A.attack(t, t.stopped ? v.d * 3 : v.d, { pose: 'thrust', dash: 1, heavy: t.stopped ? 1 : 0 }); },
  },
  bolt: {
    en: 'BOLT', jp: 'ボルト投げ', type: 'atk', rar: 'c', cost: 0, tgt: 'enemy', v: { d: 3 }, u: { d: 5 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }], desc: v => `${v.d} ダメージ。`,
    *play(c, v, t) { yield* A.throwAt(t, v.d, 'bolt'); },
  },
  scrape: {
    en: 'SCRAPE', jp: '擦る', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: { d: 5, r: 3 }, u: { d: 7, r: 4 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }, { i: 'rust', n: v.r }], desc: v => `${v.d} ダメージ。サビ ${v.r}。`,
    *play(c, v, t) { yield* A.attack(t, v.d, { pose: 'thrust', dash: 1 }); if (t.alive) yield* A.status(t, 'rust', v.r); },
  },
  speeding: {
    en: 'SPEEDING', jp: '速度超過', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: { d: 2, p: 2 }, u: { d: 3, p: 3 },
    face: (v, c) => [{ i: 'atk', n: v.d + v.p * (B ? B.played : 0), dmg: 1 }], desc: v => `${v.d} ダメージ。このターンに使ったカード 1 枚ごとに +${v.p}。`,
    *play(c, v, t) { yield* A.attack(t, v.d + v.p * (B.played - 1), { pose: 'thrust', dash: 1 }); },
  },
  conetoss: {
    en: 'CONE TOSS', jp: 'コーン投げ', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: { d: 5, b: 4 }, u: { d: 7, b: 5 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }, { i: 'blk', n: v.b, blk: 1 }], desc: v => `${v.d} ダメージ。ブロック ${v.b}。`,
    *play(c, v, t) { yield* A.throwAt(t, v.d, 'cone'); yield* A.block(v.b, 'cone'); },
  },
  ram: {
    en: 'RAM', jp: '体当たり', type: 'atk', rar: 'c', cost: 1, tgt: 'enemy', v: {}, u: { cost: 0 },
    face: () => [{ i: 'atk', n: B ? B.P.block : 0, dmg: 1 }], desc: () => `今のブロックと同じだけのダメージ。`,
    *play(c, v, t) { yield* A.attack(t, B.P.block, { pose: 'dash', dash: 1, heavy: B.P.block >= 15 ? 1 : 0 }); },
  },
  // ---- common skills
  noentry: {
    en: 'NO ENTRY', jp: '進入禁止', type: 'def', rar: 'c', cost: 1, tgt: 'self', v: { b: 8 }, u: { b: 11 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }], desc: v => `ブロック ${v.b}。`,
    *play(c, v) { yield* A.block(v.b, 'sign'); },
  },
  slow: {
    en: 'SLOW', jp: '徐行', type: 'skl', rar: 'c', cost: 1, tgt: 'enemy', v: { s: 2, b: 3 }, u: { s: 3, b: 5 },
    face: v => [{ i: 'slow', n: v.s }, { i: 'blk', n: v.b, blk: 1 }], desc: v => `徐行 ${v.s}。ブロック ${v.b}。`,
    *play(c, v, t) { yield* A.status(t, 'slow', v.s); yield* A.block(v.b); },
  },
  detour: {
    en: 'DETOUR', jp: '迂回', type: 'skl', rar: 'c', cost: 1, tgt: 'self', v: { n: 2 }, u: { n: 3 },
    face: v => [{ i: 'draw', n: v.n }], desc: v => `カードを ${v.n} 枚引く。`,
    *play(c, v) { yield* A.draw(v.n); },
  },
  cone: {
    en: 'CONE', jp: '三角コーン', type: 'def', rar: 'c', cost: 0, tgt: 'self', v: { b: 3 }, u: { b: 5 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }], desc: v => `ブロック ${v.b}。`,
    *play(c, v) { yield* A.block(v.b, 'cone'); },
  },
  refuel: {
    en: 'REFUEL', jp: '給油', type: 'skl', rar: 'c', cost: 0, tgt: 'self', v: { e: 1 }, u: { e: 2 }, kw: ['exhaust'],
    face: v => [{ i: 'nrg', n: v.e }], desc: v => `エネルギー +${v.e}。`,
    *play(c, v) { yield* A.energy(v.e); },
  },
  caution: {
    en: 'CAUTION', jp: 'その他の危険', type: 'skl', rar: 'c', cost: 0, tgt: 'self', v: { n: 3 }, u: { n: 5 },
    face: v => [{ i: 'look', n: v.n }], desc: v => `山札の上から ${v.n} 枚を見て、1 枚を手札に加える。`,
    *play(c, v) { yield* A.peekPick(v.n); },
  },
  wind: {
    en: 'WIND', jp: '横風注意', type: 'skl', rar: 'c', cost: 1, tgt: 'all', v: { n: 1 }, u: { n: 1, cost: 0 },
    face: v => [{ i: 'unblk', all: 1 }, { i: 'draw', n: v.n }], desc: v => `敵全体のブロックを吹き飛ばす。カードを ${v.n} 枚引く。`,
    *play(c, v) { yield* A.gust(); yield* A.draw(v.n); },
  },
  bump: {
    en: 'BUMP', jp: '段差あり', type: 'skl', rar: 'c', cost: 1, tgt: 'enemy', v: { a: 2, s: 1 }, u: { a: 3, s: 2 },
    face: v => [{ i: 'dent', n: v.a }, { i: 'slow', n: v.s }], desc: v => `へこみ ${v.a}。徐行 ${v.s}。`,
    *play(c, v, t) { yield* A.status(t, 'dent', v.a); yield* A.status(t, 'slow', v.s); },
  },
  // ---- uncommon
  rockfall: {
    en: 'ROCKFALL', jp: '落石注意', type: 'skl', rar: 'u', cost: 1, tgt: 'self', v: { d: 12, t: 2 }, u: { d: 16, t: 2 }, kws: ['hazard'],
    face: v => [{ i: 'hazard', n: v.t }, { i: 'atk', n: v.d, all: 1, haz: 1 }], desc: v => `危険標識：${v.t} ターン後、落石が敵全体に ${v.d} ダメージ。`,
    *play(c, v) { yield* A.hazard('rock', v.t, v.d); },
  },
  deer: {
    en: 'DEER', jp: '動物注意', type: 'skl', rar: 'u', cost: 1, tgt: 'self', v: { d: 14, t: 1 }, u: { d: 18, t: 1 }, kws: ['hazard'],
    face: v => [{ i: 'hazard', n: v.t }, { i: 'atk', n: v.d, haz: 1 }, { i: 'dent', n: 2 }], desc: v => `危険標識：${v.t} ターン後、シカが飛び出してランダムな敵に ${v.d} ダメージ、へこみ 2。`,
    *play(c, v) { yield* A.hazard('deer', v.t, v.d); },
  },
  mirror: {
    en: 'MIRROR', jp: 'カーブミラー', type: 'skl', rar: 'u', cost: 1, tgt: 'self', v: {}, u: { cost: 0 },
    face: () => [{ i: 'mirror' }], desc: () => `次に使うカードが 2 回発動する。`,
    *play() { yield* A.status(B.P, 'mirror', 1); },
  },
  parking: {
    en: 'PARKING', jp: '駐車場', type: 'def', rar: 'u', cost: 1, tgt: 'self', v: { b: 6 }, u: { b: 9 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }, { i: 'parking' }], desc: v => `ブロック ${v.b}。次のターン、ブロックが消えない。`,
    *play(c, v) { yield* A.block(v.b, 'sign'); yield* A.status(B.P, 'parking', 1); },
  },
  roadwork: {
    en: 'ROADWORK', jp: '道路工事中', type: 'def', rar: 'u', cost: 2, tgt: 'self', v: { b: 5, n: 2 }, u: { b: 7, n: 2 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }, { i: 'roadwork', n: v.n }], desc: v => `ブロック ${v.b}。次の ${v.n} ターンも、はじめにブロック ${v.b}。`,
    *play(c, v) { yield* A.block(v.b, 'rail'); B.P.rwAmt = Math.max(B.P.rwAmt || 0, v.b); yield* A.status(B.P, 'roadwork', v.n); },
  },
  oneway: {
    en: 'ONE WAY', jp: '一方通行', type: 'pwr', rar: 'u', cost: 1, tgt: 'self', v: {}, u: { innate: 1 },
    face: () => [{ i: 'oneway' }], desc: () => `毎ターン、最初の攻撃カードが 2 回発動する。`,
    *play() { yield* A.power('oneway', 1); },
  },
  highway: {
    en: 'HIGHWAY', jp: '高速道路', type: 'pwr', rar: 'u', cost: 1, tgt: 'self', v: { n: 1 }, u: { n: 1, cost: 0 },
    face: v => [{ i: 'draw', n: v.n, pwr: 1 }], desc: v => `ターンのはじめに カードを ${v.n} 枚多く引く。`,
    *play(c, v) { yield* A.power('highway', v.n); },
  },
  toll: {
    en: 'TOLL', jp: '料金所', type: 'skl', rar: 'u', cost: 0, tgt: 'self', v: { e: 2, h: 4 }, u: { e: 2, h: 2 }, kw: ['exhaust'],
    face: v => [{ i: 'nrg', n: v.e }, { i: 'hp', n: -v.h }], desc: v => `エネルギー +${v.e}。HP を ${v.h} 失う。`,
    *play(c, v) { yield* A.loseHP(v.h); yield* A.energy(v.e); },
  },
  nopark: {
    en: 'NO PARKING', jp: '駐停車禁止', type: 'atk', rar: 'u', cost: 1, tgt: 'enemy', v: { d: 7 }, u: { d: 10 },
    face: v => [{ i: 'unblk' }, { i: 'atk', n: v.d, dmg: 1 }, { i: 'nopark', n: 1 }], desc: v => `ブロックを消してから ${v.d} ダメージ。駐車禁止 1（ブロックを得られない）。`,
    *play(c, v, t) { t.block = 0; Fx.sparks(t.x, t.y - t.h / 2, 6, 0, '#9ff0ff'); yield* A.attack(t, v.d, { pose: 'thrust', dash: 1 }); if (t.alive) yield* A.status(t, 'nopark', 1); },
  },
  slippery: {
    en: 'ICY', jp: '路面凍結', type: 'skl', rar: 'u', cost: 1, tgt: 'all', v: { s: 1 }, u: { s: 2 },
    face: v => [{ i: 'slow', n: v.s, all: 1 }, { i: 'hazard', t: '-1' }], desc: v => `敵全体に徐行 ${v.s}。危険標識の発動が 1 ターン早まる。`,
    *play(c, v) { yield* A.statusAll('slow', v.s); yield* A.advanceHazards(1); },
  },
  barricade: {
    en: 'BARRICADE', jp: 'バリケード', type: 'def', rar: 'u', cost: 2, tgt: 'self', v: { b: 16 }, u: { b: 21 },
    face: v => [{ i: 'blk', n: v.b, blk: 1 }], desc: v => `ブロック ${v.b}。`,
    *play(c, v) { yield* A.block(v.b, 'barricade'); },
  },
  stopline: {
    en: 'STOP LINE', jp: '停止線', type: 'skl', rar: 'u', cost: 0, tgt: 'enemy', v: { s: 1 }, u: { s: 1, draw: 1 }, kw: ['exhaust'],
    face: v => v.draw ? [{ i: 'stop', n: v.s }, { i: 'draw', n: 1 }] : [{ i: 'stop', n: v.s }], desc: v => `止まれ ${v.s}。${v.draw ? 'カードを 1 枚引く。' : ''}`, kws: ['stop'],
    *play(c, v, t) { yield* A.stop(t, v.s); if (v.draw) yield* A.draw(1); },
  },
  merge: {
    en: 'MERGE', jp: '合流注意', type: 'skl', rar: 'u', cost: 0, tgt: 'self', v: { n: 1 }, u: { n: 2 },
    face: v => [{ i: 'hazard', t: '-1' }, { i: 'draw', n: v.n }], desc: v => `危険標識の発動が 1 ターン早まる。カードを ${v.n} 枚引く。`,
    *play(c, v) { yield* A.advanceHazards(1); yield* A.draw(v.n); },
  },
  rustspray: {
    en: 'RUST SPRAY', jp: 'サビスプレー', type: 'skl', rar: 'u', cost: 1, tgt: 'enemy', v: { r: 6 }, u: { r: 9 },
    face: v => [{ i: 'rust', n: v.r }], desc: v => `サビ ${v.r}。`,
    *play(c, v, t) { yield* A.spray(t); yield* A.status(t, 'rust', v.r); },
  },
  crosswalk: {
    en: 'CROSSWALK', jp: '横断歩道', type: 'def', rar: 'u', cost: 1, tgt: 'self', v: { b: 4, p: 4 }, u: { b: 6, p: 6 },
    face: v => [{ i: 'blk', n: v.b + v.p * (B ? B.hazards.length : 0), blk: 1 }], desc: v => `ブロック ${v.b}。立っている危険標識 1 本ごとに +${v.p}。`,
    *play(c, v) { yield* A.block(v.b + v.p * B.hazards.length, 'sign'); },
  },
  horn: {
    en: 'HORN', jp: 'クラクション', type: 'atk', rar: 'u', cost: 1, tgt: 'all', v: { d: 4, s: 1 }, u: { d: 6, s: 1 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1, all: 1 }, { i: 'slow', n: v.s, all: 1 }], desc: v => `敵全体に ${v.d} ダメージと 徐行 ${v.s}。`,
    *play(c, v) { yield* A.honk(); yield* A.attackAll(v.d, { pose: 'none' }); yield* A.statusAll('slow', v.s); },
  },
  convoy: {
    en: 'CONVOY', jp: '車間距離', type: 'pwr', rar: 'u', cost: 1, tgt: 'self', v: { n: 2 }, u: { n: 3 },
    face: v => [{ i: 'convoy' }, { i: 'blk', n: v.n }], desc: v => `攻撃カードを使うたびに ブロック ${v.n}。`,
    *play(c, v) { yield* A.power('convoy', v.n); },
  },
  // ---- rare
  crossing: {
    en: 'CROSSING', jp: '踏切あり', type: 'skl', rar: 'r', cost: 2, tgt: 'self', v: { d: 40, t: 3 }, u: { d: 55, t: 3 }, kws: ['hazard'],
    face: v => [{ i: 'hazard', n: v.t }, { i: 'atk', n: v.d, all: 1, haz: 1 }], desc: v => `危険標識：${v.t} ターン後、電車が通過して敵全体に ${v.d} ダメージ。`,
    *play(c, v) { yield* A.hazard('train', v.t, v.d); },
  },
  allstop: {
    en: 'ALL STOP', jp: '全方向一時停止', type: 'skl', rar: 'r', cost: 3, tgt: 'all', v: { s: 1 }, u: { s: 1, cost: 2 }, kw: ['exhaust'],
    face: v => [{ i: 'stop', n: v.s, all: 1 }], desc: v => `敵全体に 止まれ ${v.s}。`, kws: ['stop'],
    *play(c, v) { for (const e of B.alive()) yield* A.stop(e, v.s, true); },
  },
  signal: {
    en: 'SIGNAL', jp: '信号機', type: 'pwr', rar: 'r', cost: 2, tgt: 'self', v: {}, u: { cost: 1 },
    face: () => [{ i: 'signal' }], desc: () => `毎ターンのはじめに 青→黄→赤 と切り替わる。青：エネルギー+1　黄：2 枚引く　赤：ブロック 8。`,
    *play() { yield* A.power('signal', 1); },
  },
  deadend: {
    en: 'DEAD END', jp: '行き止まり', type: 'atk', rar: 'r', cost: 2, tgt: 'enemy', v: { d: 22 }, u: { d: 28 },
    face: v => [{ i: 'atk', n: v.d, dmg: 1 }, { i: 'solo', t: 'x2' }], desc: v => `${v.d} ダメージ。敵が 1 体だけなら 2 倍。`,
    *play(c, v, t) { yield* A.attack(t, B.alive().length === 1 ? v.d * 2 : v.d, { pose: 'heavy', dash: 1, heavy: 1 }); },
  },
  turbo: {
    en: 'TURBO', jp: 'ターボ', type: 'pwr', rar: 'r', cost: 1, tgt: 'self', v: { n: 2 }, u: { n: 3 },
    face: v => [{ i: 'str', n: v.n }], desc: v => `馬力 +${v.n}。`,
    *play(c, v) { yield* A.status(B.P, 'str', v.n); },
  },
  heavyduty: {
    en: 'HEAVY DUTY', jp: '大型車', type: 'pwr', rar: 'r', cost: 1, tgt: 'self', v: { n: 2 }, u: { n: 3 },
    face: v => [{ i: 'dex', n: v.n }], desc: v => `装甲 +${v.n}。`,
    *play(c, v) { yield* A.status(B.P, 'dex', v.n); },
  },
  roundabout: {
    en: 'ROUNDABOUT', jp: '環状交差点', type: 'skl', rar: 'r', cost: 1, tgt: 'self', v: { n: 4 }, u: { n: 4, cost: 0 }, kw: ['exhaust'],
    face: v => [{ i: 'shuffle' }, { i: 'draw', n: v.n }], desc: v => `捨て札を山札に戻して切り直し、${v.n} 枚引く。`,
    *play(c, v) { yield* A.reshuffle(); yield* A.draw(v.n); },
  },
  acidrain: {
    en: 'ACID RAIN', jp: '酸性雨', type: 'skl', rar: 'r', cost: 2, tgt: 'all', v: { r: 5 }, u: { r: 7 },
    face: v => [{ i: 'rust', n: v.r, all: 1 }], desc: v => `敵全体にサビ ${v.r}。すぐに 1 回サビが効く。`,
    *play(c, v) { yield* A.acidRain(v.r); },
  },
  jam: {
    en: 'JAM', jp: '渋滞', type: 'skl', rar: 'r', cost: 2, tgt: 'all', v: { n: 2 }, u: { n: 2, cost: 1 },
    face: v => [{ i: 'unblk', all: 1 }, { i: 'slow', n: v.n, all: 1 }, { i: 'dent', n: v.n, all: 1 }], desc: v => `敵全体のブロックを消し、徐行 ${v.n}、へこみ ${v.n}。`,
    *play(c, v) { yield* A.gust(); yield* A.statusAll('slow', v.n); yield* A.statusAll('dent', v.n); },
  },
  // ---- junk (added by enemies / events)
  noise: { en: 'NOISE', jp: 'ノイズ', type: 'junk', rar: 'x', cost: -1, tgt: 'none', v: {}, kw: ['unplayable', 'ethereal'], face: () => [], desc: () => `使えない。はかない。` },
  pothole: { en: 'POTHOLE', jp: '穴ぼこ', type: 'junk', rar: 'x', cost: -1, tgt: 'none', v: {}, kw: ['unplayable'], face: () => [{ i: 'hp', n: -2 }], desc: () => `使えない。引いたとき HP を 2 失う。`, onDraw: 'pothole' },
  rustcard: { en: 'RUST', jp: 'サビついた標識', type: 'junk', rar: 'x', cost: -1, tgt: 'none', v: {}, kw: ['unplayable'], face: () => [], art: 'rustcard', desc: () => `使えない。ターンの終わりに手札にあると HP を 2 失う。`, onEndInHand: 2 },
};
for (const id in CARDS) CARDS[id].id = id;
const CARD_POOL = Object.keys(CARDS).filter(id => ['c', 'u', 'r'].includes(CARDS[id].rar));

// ---------- enemies ----------
// ai(e, B) returns the id of the next move; intents are shown during the player's turn.
const ENEMIES = {
  mw: {
    jp: '電子レンジ', hp: [22, 26], w: 34, h: 28, draw: 'mw',
    moves: {
      bite: { it: { type: 'atk', d: 7 }, *act(e) { yield* EA.lunge(e, 'bite'); } },
      heat: { it: { type: 'buff' }, *act(e) { yield* EA.pose(e, 'buff', 16); yield* EA.buff(e, 'str', 2); yield* EA.block(e, 4); } },
    },
    ai(e) { if (e.last === 'heat') return 'bite'; return e.rng.chance(0.3) ? 'heat' : 'bite'; },
  },
  cone: {
    jp: 'コーン', hp: [9, 11], w: 14, h: 20, draw: 'cone',
    moves: {
      poke: { it: { type: 'atk', d: 3 }, *act(e) { yield* EA.lunge(e, 'poke'); } },
      huddle: { it: { type: 'def' }, *act(e) { yield* EA.pose(e, 'buff', 10); for (const o of B.alive()) yield* EA.block(o, 3, true); } },
    },
    ai(e) { return e.last === 'huddle' || e.rng.chance(0.7) ? 'poke' : 'huddle'; },
  },
  fan: {
    jp: '扇風機', hp: [18, 22], w: 30, h: 44, draw: 'fan', fly: 1,
    moves: {
      gust: { it: { type: 'atk', d: 3, deb: 1 }, *act(e) { yield* EA.shoot(e, 'gust'); if (!B.over) yield* EA.debuff(B.P, 'slow', 1); } },
      spin: { it: { type: 'atk', d: 3, n: 2 }, *act(e) { yield* EA.shoot(e, 'orb'); } },
    },
    ai(e) { return e.last === 'gust' ? 'spin' : e.last === 'spin' ? 'gust' : e.rng.pick(['gust', 'spin']); },
  },
  drum: {
    jp: 'ドラム缶', hp: [24, 28], w: 24, h: 32, draw: 'drum', start: { explode: 5 },
    moves: {
      rev: { it: { type: 'charge', note: '次のターン 突進' }, *act(e) { yield* EA.pose(e, 'buff', 18); Snd.play('charge', { x: e.x }); yield* EA.block(e, 5); } },
      roll: { it: { type: 'atk', d: 11 }, *act(e) { yield* EA.lunge(e, 'roll'); } },
    },
    ai(e, B) { if (e.last == null) return B && B.enemies.filter(x => x.def === e.def).indexOf(e) % 2 ? 'roll' : 'rev'; return e.last === 'rev' ? 'roll' : 'rev'; },
  },
  cam: {
    jp: '監視カメラ', hp: [20, 24], w: 20, h: 48, draw: 'cam',
    moves: {
      aim: { it: { type: 'charge', note: '次のターン レーザー' }, *act(e) { yield* EA.pose(e, 'buff', 16); Snd.play('charge', { x: e.x }); } },
      laser: { it: { type: 'atk', d: 14 }, *act(e) { yield* EA.laser(e); } },
    },
    ai(e) { return e.last === 'aim' ? 'laser' : 'aim'; },
  },
  vend: {
    jp: '自販機', hp: [72, 76], w: 42, h: 68, draw: 'vend', tier: 'elite',
    moves: {
      dispense: { it: { type: 'atk', d: 6, n: 2 }, *act(e) { yield* EA.shoot(e, 'can'); } },
      charge: { it: { type: 'charge', note: '次のターン 大突進' }, *act(e) { yield* EA.pose(e, 'buff', 20); Snd.play('roar', { x: e.x }); Cam.shake(0.15); } },
      slam: { it: { type: 'atk', d: 20, deb: 1 }, *act(e) { yield* EA.lunge(e, 'slam', 26); if (!B.over) yield* EA.debuff(B.P, 'dent', 1); } },
      restock: { it: { type: 'buff' }, *act(e) { yield* EA.pose(e, 'buff', 18); yield* EA.block(e, 12); yield* EA.buff(e, 'str', 2); } },
    },
    ai(e) { return ({ dispense: 'charge', charge: 'slam', slam: 'restock', restock: 'dispense' })[e.last] || 'dispense'; },
  },
  roller: {
    jp: 'ロードローラー', hp: [110, 110], w: 96, h: 86, draw: 'roller', tier: 'boss',
    moves: {
      press: { it: { type: 'atk', d: 7, n: 2 }, *act(e) { yield* EA.lunge(e, 'press', 26); } },
      pave: { it: { type: 'def', deb: 1, note: '穴ぼこを混ぜる' }, *act(e) { yield* EA.pose(e, 'buff', 20); yield* EA.block(e, 15); yield* EA.addCards('pothole', 'discard', 1); } },
      rev: { it: { type: 'charge', note: '次のターン ぺしゃんこ' }, *act(e) { yield* EA.pose(e, 'buff', 24); Snd.play('roar', { x: e.x }); Cam.shake(0.3); } },
      flatten: { it: { type: 'atk', d: 25 }, *act(e) { yield* EA.lunge(e, 'flatten', 30); } },
    },
    ai(e) { return ({ press: 'pave', pave: 'rev', rev: 'flatten', flatten: 'press' })[e.last] || 'press'; },
    onHalf(e) { return EA.phase2(e, 2); },
  },
};
for (const id in ENEMIES) ENEMIES[id].id = id;

// encounters per act
const ENCOUNTERS = [
  { weak: [['mw'], ['cone', 'cone', 'cone'], ['fan'], ['drum']], normal: [['mw', 'fan'], ['cone', 'cone', 'mw'], ['drum', 'cone', 'cone'], ['fan', 'fan'], ['mw', 'drum'], ['cam', 'cone', 'cone']], elite: [['vend'], ['drum', 'drum', 'drum']], boss: [['roller']] },
];

// ---------- parts (relics) ----------
const RELICS = {
  battery: { jp: '古い電池', rar: 's', desc: '戦闘に勝つと HP を 6 回復。', onWin: r => r.heal(6) },
  hardhat: { jp: 'ヘルメット', rar: 'c', desc: '戦闘のはじめに ブロック 8。', *onCombatStart() { yield* A.block(8, 'relic'); } },
  omamori: { jp: '交通安全お守り', rar: 'c', desc: '最大HP +10。', onPickup: r => { r.maxhp += 10; r.hp += 10; } },
  purse: { jp: 'がま口', rar: 'c', desc: 'スクラップを 30% 多くもらえる。' },
  flare: { jp: '発炎筒', rar: 'c', desc: '戦闘のはじめに 敵全体にサビ 3。', *onCombatStart() { yield* A.statusAll('rust', 3); } },
  conehat: { jp: 'コーンの帽子', rar: 'c', desc: 'ターンの終わりにブロックが 0 なら ブロック 5。' },
  tire: { jp: 'スペアタイヤ', rar: 'c', desc: '休憩での回復量 +15。' },
  wakaba: { jp: '若葉マーク', rar: 'c', desc: '各戦闘で最初に使うカードのコストが 0。' },
  reflector: { jp: '反射板', rar: 'c', desc: '攻撃でHPを削られるたびに、相手に 3 ダメージ。' },
  thermos: { jp: '水筒', rar: 'c', desc: '戦闘の最初のターン、カードを 2 枚多く引く。' },
  jumper: { jp: 'ジャンパーケーブル', rar: 'u', desc: '敵を止めるたびに カードを 1 枚引く。' },
  triangle: { jp: '三角表示板', rar: 'u', desc: '危険標識のダメージ +50%。' },
  dashcam: { jp: 'ドラレコ', rar: 'u', desc: '戦闘のはじめに 敵全体にへこみ 1。', *onCombatStart() { yield* A.statusAll('dent', 1); } },
  horn: { jp: 'ホーン', rar: 'u', desc: '戦闘のはじめに 敵全体に徐行 1。', *onCombatStart() { yield* A.statusAll('slow', 1); } },
  odometer: { jp: '走行距離計', rar: 'u', desc: 'カードを 10 枚使うごとに エネルギー +1。' },
  wiper: { jp: 'ワイパー', rar: 'u', desc: 'ターンのはじめに、手札の使えないカードを 1 枚取り除く。' },
  navi: { jp: 'カーナビ', rar: 'u', desc: 'カード報酬の選択肢が 1 枚増える。' },
  keychain: { jp: '鍵束', rar: 'u', desc: 'お店の値段が 20% 安くなる。' },
  chains: { jp: 'タイヤチェーン', rar: 'u', desc: '徐行を受けない。' },
  mechanic: { jp: '工具セット', rar: 'u', desc: '休憩で磨いたとき、ランダムなカードをもう 1 枚磨く。' },
  supercharger: { jp: '過給機', rar: 'r', desc: '戦闘のはじめに 馬力 +1。', *onCombatStart() { yield* A.status(B.P, 'str', 1); } },
  airbag: { jp: 'エアバッグ', rar: 'r', desc: '一度だけ、HP が 0 になる代わりに HP 30% で立ち上がる。' },
  cruise: { jp: 'クルコン', rar: 'r', desc: 'ターンの終わりに、手札のカード 1 枚を保持する。' },
  hazardlamp: { jp: 'ハザードランプ', rar: 'r', desc: '危険標識を立てるたびに ブロック 4。' },
  lantern: { jp: 'ランタン', rar: 'r', desc: '戦闘のはじめに エネルギー +1（最初のターンだけ）。' },
  v8: { jp: 'V8エンジン', rar: 'b', desc: '毎ターン エネルギー +1。カード報酬の選択肢が 1 枚減る。' },
  bigtank: { jp: '大容量タンク', rar: 'b', desc: '毎ターン エネルギー +1。戦闘のはじめに ノイズ 2 枚が山札に混ざる。' },
  navipro: { jp: 'ナビPRO', rar: 'b', desc: '毎ターン カードを 1 枚多く引く。休憩で回復できない。' },
};
for (const id in RELICS) RELICS[id].id = id;

// ---------- drinks (cans) ----------
const CANS = {
  coffee: { jp: '缶コーヒー', tgt: 'self', desc: 'エネルギー +2。', *use() { yield* A.energy(2); } },
  cola: { jp: 'コーラ', tgt: 'self', desc: 'カードを 3 枚引く。', *use() { yield* A.draw(3); } },
  milk: { jp: '牛乳', tgt: 'self', desc: 'HP を 12 回復。', *use() { yield* A.heal(12); } },
  energy: { jp: 'エナジードリンク', tgt: 'self', desc: '馬力 +2（この戦闘）。', *use() { yield* A.status(B.P, 'str', 2); } },
  oil: { jp: 'オイル缶', tgt: 'self', desc: 'ブロック 12。', *use() { yield* A.block(12, 'relic', true); } },
  spray: { jp: 'スプレー缶', tgt: 'all', desc: '敵全体にへこみ 2。', *use() { yield* A.statusAll('dent', 2); } },
  extinguisher: { jp: '消火器', tgt: 'enemy', desc: '止まれ 2。', *use(t) { yield* A.stop(t, 2); } },
  sports: { jp: 'スポーツドリンク', tgt: 'self', desc: 'ブロック 6。カードを 1 枚引く。', *use() { yield* A.block(6, 'relic', true); yield* A.draw(1); } },
};
for (const id in CANS) CANS[id].id = id;

// ---------- starting kits ----------
const KITS = {
  tomare: { jp: '止まれキット', en: 'TOMARE', deck: ['swing', 'swing', 'swing', 'swing', 'swing', 'guard', 'guard', 'guard', 'guard', 'tomare'], relic: 'battery', desc: '止まれ 1 枚と基本のカード。敵の行動を止めて戦う。' },
  roadwork: { jp: '工事キット', en: 'ROADWORK', deck: ['swing', 'swing', 'swing', 'swing', 'guard', 'guard', 'guard', 'guard', 'rockfall', 'barricade'], relic: 'hardhat', desc: '落石注意とバリケード。守りながら危険標識で削る。' },
  highway: { jp: '高速キット', en: 'HIGHWAY', deck: ['swing', 'swing', 'swing', 'swing', 'guard', 'guard', 'guard', 'bolt', 'bolt', 'speeding'], relic: 'wakaba', desc: '0 コストのボルトと速度超過。たくさん使って加速する。' },
};
