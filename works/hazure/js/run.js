/* ハズレスキル【合成】 — 一回の旅（ローグライク）
   道（行き先えらび）・戦いの前後・報酬・ギルド・宿・出来事・合成・装備・称号・ラノベ題名。画面には触らない。 */
(function (G) {
  'use strict';
  const HZ = G.HZ;
  const R = (HZ.R = {});

  /* ---------- 乱数（種から決まる） ---------- */
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  function rng(run) {
    let t = (run.rs = (run.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pick = (run, a) => a[Math.floor(rng(run) * a.length)];
  const shuffle = (run, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng(run) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  R.rng = rng;

  const sk = (run, u) => run.skills.find((s) => s.u === u);
  R.sk = sk;
  R.eqSkills = (run) => run.eq.map((u) => sk(run, u)).filter(Boolean);
  R.chap = (run) => HZ.CHAPTERS[Math.min(run.ch, HZ.CHAPTERS.length - 1)];
  R.deep = (run) => run.ch >= HZ.CHAPTERS.length;
  R.k = (run) => run.ch * HZ.STEPS + run.step;     // 何歩目か（魔物の強さ）
  R.chapName = (run) => R.deep(run) ? `深淵 第${run.ch - HZ.CHAPTERS.length + 1}層` : R.chap(run).name;

  /* ---------- 旅のはじまり ---------- */
  R.create = (meta, seed) => {
    seed = seed || String(Math.floor(Math.random() * 900000) + 100000);
    const run = {
      v: 1, seed, rs: hash(seed), uid: 0,
      hp: HZ.START.hp, max: HZ.START.hp, atk: HZ.START.atk, gold: HZ.START.gold, slots: HZ.START.slots, lv: 1, exp: 0,
      skills: [], eq: [], ch: 0, step: 0, phase: 'start', opts: [], node: null,
      reward: null, shop: null, event: null, titles: [], newTitles: [], fuses: 0, tonic: 0,
      up: { book: 0, slot: 0, tonic: 0, reroll: 0 }, law: null,
      stats: { kills: {}, maxHit: 0, maxCombo: 0, reacts: {}, dmgBy: {}, nameBy: {}, wins: 0, fuses: 0 },
      starter: null, cleared: false, inf: false, unlock: ((meta && meta.unlock) || []).slice(),
    };
    const pool = HZ.HAZURE.slice();
    run.starters = shuffle(run, pool).slice(0, 3);
    return run;
  };
  R.pickStarter = (run, id) => {
    const s = HZ.make(run, id);
    run.skills.push(s); run.eq.push(s.u);
    run.starter = id;
    // もうひとつ、ふつうのスキルを選ぶ（ダメージの出るものから）
    const pool = Object.values(HZ.SKILLS).filter((x) => x.rare === 1 && /^(turn|atk)$/.test(x.trig) && x.fx.some((e) => e[0] === 'dmg') && !x.ev);
    run.seconds = shuffle(run, pool.map((x) => x.id)).slice(0, 3);
    run.phase = 'start2';
  };
  R.pickSecond = (run, id) => {
    R.gain(run, id);
    run.phase = 'map';
    genOpts(run);
  };

  /* ---------- 道：次の行き先 ---------- */
  const KIND = { battle: '魔物', elite: '強敵', shop: 'ギルド', rest: '宿', event: '出来事', boss: '主' };
  R.KIND = KIND;
  function foeGroup(run, kind) {
    const deep = R.deep(run), C = R.chap(run);
    const all = HZ.CHAPTERS.flatMap((c) => c.foes);
    const pool = deep ? all : C.foes;
    if (kind === 'boss') {
      if (!deep) return [C.boss];
      return [pick(run, HZ.CHAPTERS.map((c) => c.boss))];
    }
    if (kind === 'elite') {
      const e = deep ? pick(run, HZ.CHAPTERS.flatMap((c) => c.elite)) : pick(run, C.elite);
      return run.step >= 4 || deep ? [e, pick(run, pool)] : [e];
    }
    const n = run.step < 2 && !deep ? 1 + Math.floor(rng(run) * 2) : 2 + Math.floor(rng(run) * 2);
    const g = [];
    for (let i = 0; i < n; i++) g.push(pick(run, pool));
    return g;
  }
  function genOpts(run) {
    const last = run.step === HZ.STEPS - 1;
    const opts = [];
    if (last) opts.push({ kind: 'boss', foes: foeGroup(run, 'boss') });
    else if (run.step === 0) { opts.push({ kind: 'battle', foes: foeGroup(run, 'battle') }); opts.push({ kind: 'battle', foes: foeGroup(run, 'battle') }); }
    else {
      const W = [['battle', 40], ['elite', run.step >= 2 ? 16 : 0], ['shop', 16], ['rest', 10], ['event', 18]];
      const used = {};
      while (opts.length < 3) {
        let r = rng(run) * W.reduce((a, w) => a + (used[w[0]] && w[0] !== 'battle' ? 0 : w[1]), 0);
        let kind = 'battle';
        for (const [k, w] of W) { const ww = used[k] && k !== 'battle' ? 0 : w; if (r < ww) { kind = k; break; } r -= ww; }
        used[kind] = 1;
        const o = { kind };
        if (kind === 'battle' || kind === 'elite') o.foes = foeGroup(run, kind);
        if (kind === 'event') o.ev = pickEvent(run);
        opts.push(o);
      }
      // ギルドに一度も寄れない章にしない
      if (run.step === 4 && !run.shopSeen && !opts.some((o) => o.kind === 'shop')) opts[2] = { kind: 'shop' };
    }
    run.opts = opts;
  }
  function pickEvent(run) {
    const ch = Math.min(run.ch, 4);
    const pool = HZ.EVENTS.filter((e) => e.ch.includes(ch) && !(run.seenEv || []).includes(e.id));
    return (pool.length ? pick(run, pool) : pick(run, HZ.EVENTS)).id;
  }
  R.lawOf = (run) => (R.deep(run) ? run.law : R.chap(run).law);
  R.foesOf = (run, ids, kind) => {
    const k = R.k(run);
    const deep = R.deep(run);
    return ids.map((id, i) => {
      const extra = {};
      if (deep && (kind === 'boss' || kind === 'elite') && i === 0) {
        const g = [{ hard: 4 + run.ch }, { regen: 5 }, { mist: 1 }, { reflect: 15 }, { wall: 10 }, { silent: 1 }, { thorn: 1 }];
        extra.tr = g[(run.ch * 7 + run.step) % g.length];
      }
      return HZ.foeStats(id, k, extra);
    });
  };

  R.choose = (run, i) => {
    const o = run.opts[i];
    if (!o) return;
    run.node = o;
    if (o.kind === 'battle' || o.kind === 'elite' || o.kind === 'boss') run.phase = 'battle';
    else if (o.kind === 'shop') { run.shopSeen = true; openShop(run); run.phase = 'shop'; }
    else if (o.kind === 'rest') run.phase = 'rest';
    else if (o.kind === 'event') { run.event = { id: o.ev, done: null }; (run.seenEv = run.seenEv || []).push(o.ev); run.phase = 'event'; }
  };
  R.battleFoes = (run) => R.foesOf(run, run.node.foes, run.node.kind);
  R.startBattle = (run) => HZ.newBattle(run, R.battleFoes(run), { law: R.lawOf(run) });

  /* ---------- 戦いのあと ---------- */
  R.endBattle = (run, B) => {
    const kind = run.node.kind;
    const st = run.stats;
    for (const k in B.stat.kills) st.kills[k] = (st.kills[k] || 0) + B.stat.kills[k];
    for (const r in B.stat.reacts) st.reacts[r] = (st.reacts[r] || 0) + B.stat.reacts[r];
    st.maxHit = Math.max(st.maxHit, B.stat.maxHit);
    st.maxCombo = Math.max(st.maxCombo, B.stat.maxCombo);
    for (const k of B.sk) { st.dmgBy[k.s.u] = (st.dmgBy[k.s.u] || 0) + k.dmg; st.nameBy[k.s.u] = HZ.name(k.s); }
    run.gold = Math.max(0, Math.round(run.gold + B.gold));
    if (B.inf) run.inf = true;
    const got = [];
    const title = (id) => { if (!run.titles.includes(id)) { run.titles.push(id); got.push(id); } };
    if (B.over !== 'win') {
      run.hp = 0; run.phase = 'over'; run.lastFoe = B.foes.find((f) => f.alive) ? B.foes.find((f) => f.alive).name : '';
      checkTitles(run, B, title); run.newTitles = got;
      return { lose: true };
    }
    st.wins++;
    run.hp = Math.max(1, Math.min(run.max, B.p.hp));
    if (run.hp <= run.max * 0.1) title('narrow');
    checkTitles(run, B, title);
    // お金・経験
    const mult = kind === 'boss' ? 3 : kind === 'elite' ? 2 : 1;
    const law = R.lawOf(run);
    const gold = Math.round((8 + run.step + run.ch * 3) * mult * (law && law.gold ? law.gold : 1) * Math.pow(1.06, Math.max(0, run.ch - 4) * HZ.STEPS));
    run.gold += gold;
    run.exp += mult;
    const lvUp = [];
    while (run.exp >= 2) { run.exp -= 2; run.lv++; run.max += 8; run.hp += 8; run.atk += 1; lvUp.push(run.lv); }
    run.hp = Math.min(run.max, run.hp + Math.round(run.max * 0.15));
    run.newTitles = got;
    const res = { gold, lvUp, titles: got, kind };
    if (kind === 'boss') {
      run.slots++; res.slot = true;
      if (run.node.foes.includes('maou') && !run.cleared) { run.cleared = true; res.clear = true; }
    }
    run.reward = { kind, choices: rewardChoices(run, kind), res };
    run.phase = 'reward';
    return res;
  };
  function checkTitles(run, B, title) {
    if (B.stat.maxCombo >= 20) title('combo20');
    if (B.stat.maxCombo >= 100) title('combo100');
    if (Object.keys(B.stat.reacts).length >= 5) title('react5');
    if (B.stat.oneHit) title('onehit');
    if (B.stat.maxHit >= 1e6) title('dmg1m');
    if (B.stat.maxHit >= 1e12) title('dmg1t');
    if (run.gold >= 200) title('rich');
    if ((run.stats.kills.slime || 0) >= 10) title('slime');
    if (B.stat.kills.endragon) title('dragon');
    if (B.stat.kills.maou) title('maou');
    if (B.inf) title('inf');
    if (run.skills.some((s) => s.lv >= 10)) title('lv10');
  }

  /* ---------- 報酬：スキルを1つ選ぶ ---------- */
  function rarePool(run, minRare) {
    return Object.values(HZ.SKILLS).filter((s) => s.rare >= Math.max(1, minRare) && (!s.lock || (run.unlock || []).includes(s.lock)));
  }
  // 持っているスキルの「出来事」に反応するスキルは出やすい
  function weightOf(run, s) {
    const emits = new Set();
    for (const x of run.skills) for (const e of x.fx) if (e.k === 'emit') emits.add(e.ev); else if (e.k === 'count') emits.add('count'); else if (e.k === 'gold') emits.add('gold');
    const [ev] = s.trig.split(':');
    let w = s.rare === 1 ? 10 : s.rare === 2 ? 4 + run.ch * 1.2 : 0.6 + run.ch * 0.4;
    if (emits.has(ev)) w *= 4;
    if (run.skills.some((x) => x.parts.length === 1 && x.core === s.id)) w *= 1.4;
    return w;
  }
  function drawSkills(run, n, minRare) {
    const pool = rarePool(run, minRare);
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const tot = pool.reduce((a, s) => a + (out.includes(s.id) ? 0 : weightOf(run, s)), 0);
      let r = rng(run) * tot;
      for (const s of pool) { if (out.includes(s.id)) continue; const w = weightOf(run, s); if (r < w) { out.push(s.id); break; } r -= w; }
    }
    return out;
  }
  function rewardChoices(run, kind) {
    return drawSkills(run, 3, kind === 'boss' ? 2 : kind === 'elite' ? (rng(run) < 0.6 ? 2 : 1) : 1);
  }
  R.drawSkills = drawSkills;
  // 同じスキル（合成していないもの）を持っていれば Lv が上がる
  R.sameOf = (run, id) => run.skills.find((s) => s.parts.length === 1 && s.core === id && !s.recipe);
  R.gain = (run, id) => {
    const same = R.sameOf(run, id);
    if (same) { same.lv++; return { s: same, up: true }; }
    const s = HZ.make(run, id);
    run.skills.push(s);
    if (run.eq.length < run.slots) run.eq.push(s.u);
    return { s, up: false };
  };
  R.takeReward = (run, i) => {
    const id = run.reward.choices[i];
    const r = R.gain(run, id);
    afterReward(run);
    return r;
  };
  R.skipReward = (run) => { run.gold += 6; afterReward(run); };
  function afterReward(run) {
    const wasBoss = run.reward && run.reward.kind === 'boss';
    const clear = run.reward && run.reward.res && run.reward.res.clear;
    run.reward = null;
    if (clear) { run.phase = 'clear'; return; }
    advance(run, wasBoss);
  }
  function advance(run, chapterDone) {
    if (chapterDone) {
      run.ch++; run.step = 0; run.hp = run.max; run.shopSeen = false;
      if (R.deep(run)) run.law = HZ.LAWS[hash(run.seed + run.ch) % HZ.LAWS.length];
    } else run.step++;
    run.node = null; run.phase = 'map';
    genOpts(run);
  }
  R.advance = advance;
  R.endless = (run) => { advance(run, true); };

  /* ---------- 合成・装備 ---------- */
  R.fusePreview = (run, ua, ub) => {
    const a = sk(run, ua), b = sk(run, ub);
    if (!a || !b || a === b) return null;
    return HZ.fuse(run, a, b, 0);
  };
  R.fuse = (run, ua, ub) => {
    const a = sk(run, ua), b = sk(run, ub);
    if (!a || !b || a === b) return null;
    const c = HZ.fuse(run, a, b, ++run.uid);
    const got = [];
    const title = (id) => { if (!run.titles.includes(id)) { run.titles.push(id); got.push(id); } };
    const newRecipe = c.newRecipe; delete c.newRecipe; delete c.reso;
    // 装備の位置：土台の位置をひきつぐ
    const ia = run.eq.indexOf(ua), ib = run.eq.indexOf(ub);
    run.skills = run.skills.filter((s) => s !== a && s !== b);
    run.skills.push(c);
    const eq = run.eq.slice();
    if (ia >= 0) eq[ia] = c.u; else if (ib >= 0) eq[ib] = c.u;
    run.eq = eq.filter((u) => u === c.u || (u !== ua && u !== ub));
    if (ia < 0 && ib < 0 && run.eq.length < run.slots) run.eq.push(c.u);
    run.fuses++; run.stats.fuses++;
    const da = run.stats.dmgBy[ua] || 0, db = run.stats.dmgBy[ub] || 0;
    run.stats.dmgBy[c.u] = da + db;
    title('fuse1');
    if (run.fuses >= 10) title('fuse10');
    if (c.rank >= 4) title('rank5');
    if (newRecipe) title('recipe');
    run.newTitles = got;
    return { s: c, recipe: newRecipe, titles: got };
  };
  R.equip = (run, u) => {
    if (run.eq.includes(u)) { run.eq = run.eq.filter((x) => x !== u); return 'off'; }
    if (run.eq.length >= run.slots) return 'full';
    run.eq.push(u); return 'on';
  };
  R.move = (run, u, d) => {
    const i = run.eq.indexOf(u), j = i + d;
    if (i < 0 || j < 0 || j >= run.eq.length) return;
    [run.eq[i], run.eq[j]] = [run.eq[j], run.eq[i]];
  };
  R.forget = (run, u) => {
    run.skills = run.skills.filter((s) => s.u !== u);
    run.eq = run.eq.filter((x) => x !== u);
  };

  /* ---------- ギルド（店） ---------- */
  const disc = (run) => 1 - (run.titles.includes('rich') ? 0.1 : 0);
  const PRICE = { 1: 18, 2: 38, 3: 80 };
  function openShop(run) {
    const ids = drawSkills(run, 4, 1);
    run.shop = { items: ids.map((id) => ({ id, sold: false })), heal: false };
  }
  R.price = (run, kind, i) => {
    const d = disc(run), c = 1 + 0.15 * Math.min(run.ch, 8) + Math.max(0, run.ch - 8) * 0.3;
    if (kind === 'skill') return Math.round(PRICE[HZ.SKILLS[run.shop.items[i].id].rare] * c * d);
    if (kind === 'book') return Math.round(28 * Math.pow(1.4, run.up.book) * d * (run.titles.includes('lv10') ? 0.9 : 1));
    if (kind === 'slot') return Math.round(45 * Math.pow(1.5, run.up.slot) * d);
    if (kind === 'heal') return Math.round(12 * c * d);
    if (kind === 'tonic') return Math.round(40 * Math.pow(1.25, run.up.tonic) * d);
    if (kind === 'reroll') return 5 + run.up.reroll * 2;
    return 0;
  };
  R.buy = (run, kind, i, target) => {
    const p = R.price(run, kind, i);
    if (run.gold < p) return null;
    let r = true;
    if (kind === 'skill') { const it = run.shop.items[i]; if (it.sold) return null; it.sold = true; r = R.gain(run, it.id); }
    else if (kind === 'book') { const s = sk(run, target); if (!s) return null; s.lv++; run.up.book++; r = s; }
    else if (kind === 'slot') { run.slots++; run.up.slot++; }
    else if (kind === 'heal') { if (run.hp >= run.max) return null; run.hp = run.max; }
    else if (kind === 'tonic') { run.tonic++; run.up.tonic++; }
    else if (kind === 'reroll') { run.up.reroll++; const ids = drawSkills(run, 4, 1); run.shop.items = ids.map((id) => ({ id, sold: false })); }
    run.gold -= p;
    if (run.skills.some((s) => s.lv >= 10) && !run.titles.includes('lv10')) { run.titles.push('lv10'); run.newTitles = ['lv10']; }
    return r;
  };
  R.sellPrice = (run, u) => { const s = sk(run, u); return s ? 4 + s.rank * 4 + (s.lv - 1) * 3 : 0; };
  R.sell = (run, u) => { const g = R.sellPrice(run, u); R.forget(run, u); run.gold += g; return g; };
  R.leaveShop = (run) => { run.shop = null; advance(run, false); };

  /* ---------- 宿 ---------- */
  R.rest = (run, how, u) => {
    if (how === 'sleep') run.hp = run.max;
    else if (how === 'train') { const s = sk(run, u); if (s) s.lv++; run.hp = Math.min(run.max, run.hp + Math.round(run.max * 0.3)); }
    advance(run, false);
  };

  /* ---------- 出来事 ---------- */
  R.eventOf = (run) => HZ.EVENTS.find((e) => e.id === run.event.id);
  R.canOpt = (run, o) => (!o.need || run.skills.some((s) => s.parts.includes(o.need))) && (!o.cost || run.gold >= o.cost);
  R.resolve = (run, i) => {
    const E = R.eventOf(run), o = E.opts[i];
    if (!o || !R.canOpt(run, o)) return null;
    const fx = o.fx, out = { text: o.r, battle: false, skill: 0 };
    if (o.cost) run.gold -= o.cost;
    if (fx.gold) run.gold = Math.max(0, run.gold + fx.gold);
    if (fx.maxhp) { run.max += fx.maxhp; run.hp += fx.maxhp; }
    if (fx.heal) run.hp = Math.min(run.max, run.hp + Math.round(run.max * fx.heal));
    if (fx.hurt) run.hp = Math.max(1, run.hp - Math.round(run.max * fx.hurt));
    if (fx.slot) run.slots += fx.slot;
    if (fx.lvup) { const e = R.eqSkills(run); if (e.length) { const s = e.reduce((m, x) => (HZ.power(x) > HZ.power(m) ? x : m), e[0]); s.lv++; out.text += `（${HZ.name(s)} → Lv.${s.lv}）`; } }
    if (fx.mimic) {
      if (rng(run) < 0.5) { run.gold += 35; out.text = '中身はお金だった。+35'; }
      else { out.text = '宝箱に、牙が生えた。——ミミックだ！'; out.battle = true; run.node = { kind: 'elite', foes: ['mimic'] }; }
    }
    if (fx.skill) { out.skill = fx.skill; run.reward = { kind: 'event', choices: drawSkills(run, 3, fx.skill), res: { gold: 0, lvUp: [], titles: [] } }; }
    run.event.done = out;
    return out;
  };
  R.leaveEvent = (run) => {
    const d = run.event && run.event.done;
    run.event = null;
    if (d && d.battle) { run.phase = 'battle'; return; }
    if (d && d.skill) { run.phase = 'reward'; return; }
    advance(run, false);
  };

  /* ---------- ラノベの題名（旅の記録から） ---------- */
  const REACT_END = { 蒸発: '魔王軍が蒸発していた', 感電: '魔王城が停電した', 炎上: '魔王城が炎上した', 凍結: '世界が凍りついた', 粉砕: '魔王を粉砕していた', 拡散: '状態異常が世界中に広がった', 融解: '何もかも溶けた', 消火: '火の用心が身についた' };
  R.topSkill = (run) => {
    let best = null, v = -1;
    for (const u in run.stats.dmgBy) if (run.stats.dmgBy[u] > v) { v = run.stats.dmgBy[u]; best = u; }
    const live = best && sk(run, +best);
    return { name: live ? HZ.name(live) : (run.stats.nameBy[best] || ''), dmg: v };
  };
  R.lnTitle = (run) => {
    const hz = HZ.SKILLS[run.starter] ? HZ.SKILLS[run.starter].name : '合成';
    const top = R.topSkill(run).name;
    let topR = null, rv = 0;
    for (const r in run.stats.reacts) if (run.stats.reacts[r] > rv && r !== '消火') { rv = run.stats.reacts[r]; topR = r; }
    const big = run.stats.maxHit;
    let main, sub;
    if (run.inf) {
      main = `ハズレスキル【${hz}】を合成しつづけたら、世界の理が壊れました`;
      sub = '女神課から苦情が来ています';
    } else if (run.phase === 'over' && !run.cleared) {
      main = `ハズレスキル【${hz}】で追放されて、${R.chapName(run)}で力尽きた話`;
      sub = top ? `【${top}】は、わりと強かった` : 'つぎは、もう少しうまくやる';
    } else if (R.deep(run)) {
      main = `ハズレスキル【${hz}】で追放されたので、【${top || hz}】で深淵の${run.ch - HZ.CHAPTERS.length + 1}層まで来てしまいました`;
      sub = big >= 1e8 ? `一撃${HZ.fmt(big)}ダメージ、まだ底が見えない` : '帰り道は、もう覚えていない';
    } else {
      main = `ハズレスキル【${hz}】で追放されたけど、【${top || hz}】を合成したら魔王を倒せました`;
      sub = topR && rv >= 5 ? `気づけば${REACT_END[topR]}` : big >= 1e4 ? `一撃${HZ.fmt(big)}ダメージって、何かの間違いですよね？` : 'いまさら戻ってこいと言われても、もう遅い';
    }
    return { main, sub };
  };
})(typeof window !== 'undefined' ? window : globalThis);
