/* =========================================================
   ツブのとっておき — 育ちかたのきまり（画面とは別。Node でも動く）
   数値は画面に出さない。缶の中身・ツブの箱・できごとの「こころ」・成長のときの髪型で決まる。
   ========================================================= */
(function (G) {
  'use strict';
  const TI = G.TI || (typeof require !== 'undefined' ? require('./items.js') : null);
  const MAIN = ['sora', 'mido', 'hono', 'hosi', 'uta', 'hina'];
  const ALL = MAIN.concat(['yoru']);
  const SEASON = ['spring', 'summer', 'autumn', 'winter'];

  // 時期ごと：ターン数・缶の大きさ（列×行）・年齢
  const STAGES = [null,
    { turns: 4, cols: 2, rows: 2, age0: 0, span: 4 },
    { turns: 8, cols: 3, rows: 3, age0: 4, span: 6 },
    { turns: 8, cols: 4, rows: 3, age0: 10, span: 6 },
    { turns: 4, cols: 4, rows: 4, age0: 16, span: 3 },
  ];
  const slots = (st) => STAGES[st].cols * STAGES[st].rows;

  // できごと（when: before=朝の前、after=夜）
  const EVENTS = {
    yonaki: { st: 1, turn: 1, when: 'after', choices: [{ k: { uta: 2 } }, { k: { sora: 2 } }, { k: { hina: 2 } }, { k: { hosi: 2 } }] },
    tatta: { st: 1, turn: 3, when: 'before', choices: [{ k: { hono: 2 } }, { k: { mido: 2 } }, { k: { hina: 1, uta: 1 } }] },
    nyugaku: { st: 2, turn: 2, when: 'before', choices: MAIN.map((t) => ({ k: { [t]: 2 }, set: { randoseru: t } })) },
    matsuri: { st: 2, turn: 5, when: 'after', choices: [{ item: 'yoyo' }, { item: 'omen' }, { item: 'ringoame' }, { item: 'senko' }, { item: 'hoshikuji' }, {}] },
    kaze: { st: 2, turn: 7, when: 'before', choices: [{ k: { hosi: 2 } }, { k: { hina: 2 } }, { k: { uta: 2 } }, { k: { sora: 1, yoru: 1 } }] },
    bukatsu: { st: 3, turn: 1, when: 'before', choices: [{ k: { hono: 3 }, set: { club: 'hono' } }, { k: { hosi: 3 }, set: { club: 'hosi' } }, { k: { uta: 3 }, set: { club: 'uta' } }, { k: { mido: 3 }, set: { club: 'mido' } }, { k: { hina: 3 }, set: { club: 'hina' } }, { k: { sora: 3 }, set: { club: 'sora' } }] },
    hanko: { st: 3, turn: 4, when: 'after', choices: [{ drop: true }, { k: { hina: 1 }, set: { heldOn: 1 } }] },
    ryoko: { st: 3, turn: 6, when: 'before', choices: [{ souvenir: true }] },
    shinro: { st: 4, turn: 1, when: 'before', choices: 'dreams' },
    zenya: { st: 4, turn: 3, when: 'after', choices: [{}] },
    hikaru: { when: 'night', choices: [{ k: { yoru: 2 }, set: { callYoru: 1 } }, { k: { yoru: -1 } }] },
  };
  const SOUVENIR = { sora: 'badge', mido: 'shikasenbei', hono: 'bokuto', hosi: 'planeta', uta: 'keyholder', hina: 'omamori', yoru: 'planeta' };
  const PURE = { sora: 'A', mido: 'B', hono: 'C', hosi: 'D', uta: 'E', hina: 'F' };
  const COMBO = { 'hosi+sora': 'G', 'mido+uta': 'H', 'hono+uta': 'I' };

  /* ---- 乱数（保存して続きから同じになるように） ---- */
  function rnd(run) {
    let t = (run.rs = (run.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pickW = (run, w) => { let s = 0; for (const k in w) s += Math.max(0, w[k]); let r = rnd(run) * s; for (const k in w) { r -= Math.max(0, w[k]); if (r <= 0) return k; } return Object.keys(w)[0]; };

  function newRun(seed) {
    return {
      v: 1, rs: (seed >>> 0) || 1, st: 0, turn: 0, phase: 'prologue',
      tin: [], mine: [], bag: [], seen: {}, kokoro: {}, hairs: [], flags: {},
      held: null, lent: 0, kept: 0, released: 0, dest: null, offer: null, ev: null, log: [], history: [],
    };
  }

  const it = (id) => TI.get(id);
  const addK = (sc, t, n) => { for (const k in t) sc[k] = (sc[k] || 0) + t[k] * n; };
  const zero = () => { const o = {}; ALL.forEach((k) => (o[k] = 0)); return o; };

  // いまの色（見た目・行き先に使う）
  function now(run) {
    const sc = zero();
    run.tin.forEach((id) => id && addK(sc, it(id).t, 1));
    run.mine.forEach((id) => addK(sc, it(id).t, 1));
    for (const k in run.kokoro) sc[k] += run.kokoro[k] * 0.6;
    run.hairs.forEach((h) => { if (sc[h] !== undefined) sc[h] += 1; });
    return sc;
  }
  // 結末の色
  function score(run) {
    const sc = zero();
    run.tin.forEach((id) => id && addK(sc, it(id).t, 1));
    run.mine.forEach((id) => addK(sc, it(id).t, 1));
    run.bag.forEach((id) => addK(sc, it(id).t, 2));
    for (const k in run.kokoro) sc[k] += run.kokoro[k];
    run.hairs.forEach((h) => { if (sc[h] !== undefined) sc[h] += 3; });
    return sc;
  }
  const rank = (sc, keys) => (keys || MAIN).slice().sort((a, b) => sc[b] - sc[a] || MAIN.indexOf(a) - MAIN.indexOf(b));

  // 見た目：髪型（成長のときに決まる）・服・粒の色・小物
  function look(run) {
    const sc = now(run), r = rank(sc, ALL), top = r[0], sec = r[1];
    const total = MAIN.reduce((s, k) => s + Math.max(0, sc[k]), 0) + Math.max(0, sc.yoru);
    let outfit = 'fu';
    if (sc[top] > 0.5 && (sc[top] >= sc[sec] * 1.25 || sc[top] >= total * 0.34)) outfit = top;
    let tint = sc[top] > 0.5 ? top : 'fu';
    // 物をひとつも持っていない子は、なにものにも染まらない
    if (!run.tin.some(Boolean) && !run.mine.length) { outfit = 'fu'; tint = 'fu'; }
    const hair = run.hairs[Math.max(0, run.st - 2)] || 'fu';
    const yoruN = [...run.tin, ...run.mine].filter((id) => id && it(id).t.yoru).length;
    const acc = [], slotsUsed = {};
    const SLOT = { feather: 'side', ribbon: 'top', crown: 'top', headband: 'brow', glasses: 'eyes', headphones: 'top', goggles: 'brow', scarf: 'neck', bandage: 'cheek' };
    const order = run.history.filter((id) => run.tin.indexOf(id) >= 0 || run.mine.indexOf(id) >= 0).reverse();
    for (const id of order) {
      const a = it(id).acc; if (!a || slotsUsed[SLOT[a]]) continue;
      if (a === 'headphones' && slotsUsed.brow) continue;
      slotsUsed[SLOT[a]] = 1; acc.push(a); if (acc.length >= 2) break;
    }
    return { hair, outfit, tint, yoru: yoruN, acc };
  }

  function timeOf(run) {
    const S = STAGES[run.st]; if (!S) return { age: 0, season: 'spring' };
    return { age: Math.floor(S.age0 + run.turn * S.span / S.turns), season: SEASON[run.turn % 4] };
  }

  /* ---- すすめかた ---- */
  // プロローグ：ひかりのかけらを とっておくか
  function prologue(run, keepLight) {
    if (keepLight) { run.tin.push('hikari'); run.kept++; run.history.push('hikari'); run.flags.hikari = 1; }
    run.seen.hikari = 1;
    run.st = 1; run.turn = 0; fitTin(run);
    return begin(run);
  }
  function fitTin(run) {
    const n = slots(run.st), items = run.tin.filter(Boolean);
    run.tin = items.concat(Array(Math.max(0, n - items.length)).fill(null)).slice(0, Math.max(n, items.length));
  }
  function schedEvent(run, when) {
    for (const id in EVENTS) {
      const e = EVENTS[id];
      if (e.st === run.st && e.turn === run.turn && e.when === when && !run.flags['ev_' + id]) return id;
    }
    // よるの光：ひかりをとっておいた子は、時期の真ん中の夜に光る
    if (when === 'after' && run.st >= 1 && !run.flags['hikaru' + run.st]) {
      const yoruN = [...run.tin, ...run.mine].filter((id) => id && it(id).t.yoru).length;
      const mid = Math.floor(STAGES[run.st].turns / 2) - (run.st === 1 ? 1 : 0);
      if (yoruN > 0 && run.turn === mid) return 'hikaru';
    }
    return null;
  }
  function begin(run) {
    const e = schedEvent(run, 'before');
    if (e) { run.phase = 'event'; run.ev = { id: e, when: 'before' }; return run.phase; }
    run.phase = 'morning'; run.held = null;
    return run.phase;
  }
  function give(run, id) {
    if (run.phase !== 'morning' || run.st < 2) return false;
    if (id && run.tin.indexOf(id) < 0) return false;
    run.held = id || null;
    return true;
  }
  function release(run, id) {
    const k = run.tin.indexOf(id); if (k < 0) return false;
    run.tin[k] = null; run.released++;
    if (run.held === id) run.held = null;
    return true;
  }

  // 出かける：行き先を決めて、もち帰る物をそろえる
  function goOut(run) {
    const sc = now(run), w = {};
    MAIN.forEach((k) => (w[k] = 1 + Math.max(0, sc[k]) * 0.7));
    if (run.held) addK(w, it(run.held).t, 2.2);
    if (run.held) run.lent++;
    delete w.yoru;
    const dest = pickW(run, w);
    run.dest = dest;
    const offer = [];
    const ok = (x) => !run.seen[x.id] && offer.indexOf(x.id) < 0;
    const draw = (p) => { if (!p.length) return null; const x = p[Math.floor(rnd(run) * p.length)]; offer.push(x.id); return x.id; };
    // 色 theme の物：同じ時期 → となりの時期 → 同じ時期のほかの色
    const take = (theme, rare) => {
      if (theme === 'yoru') return draw(TI.LIST.filter((x) => ok(x) && x.t.yoru && x.st && x.st <= run.st));
      return draw(TI.LIST.filter((x) => ok(x) && x.st === run.st && (x.t[theme] || 0) >= 2 && !x.rare))
        || draw(TI.LIST.filter((x) => ok(x) && x.st && Math.abs(x.st - run.st) === 1 && (x.t[theme] || 0) >= 2 && !x.rare))
        || draw(TI.LIST.filter((x) => ok(x) && x.st === run.st && !x.rare && offer.every((id) => rank(it(id).t)[0] !== rank(x.t)[0])))
        || draw(TI.LIST.filter((x) => ok(x) && x.st === run.st && !x.rare));
    };
    take(dest);
    // 2つめ：いまの色の上のほうから（行き先とちがう色）
    const r = rank(sc).filter((k) => k !== dest);
    take(rnd(run) < 0.55 ? r[0] : r[1 + Math.floor(rnd(run) * 4)]);
    // 3つめ：まだの色から（よるの子には、ときどき夜のもの）
    const yoruN = [...run.tin, ...run.mine].filter((id) => id && it(id).t.yoru).length;
    if (run.st >= 2 && (run.flags.callYoru || (yoruN > 0 && rnd(run) < Math.min(0.7, 0.14 + 0.12 * yoruN))) && take('yoru')) run.flags.callYoru = 0;
    else {
      const rest = MAIN.filter((k) => offer.every((id) => (it(id).t[k] || 0) < 2));
      take(rest[Math.floor(rnd(run) * rest.length)] || r[3]);
    }
    if (run.st === 1) while (offer.length > 3) offer.pop();
    if (run.st === 4) { while (offer.length > 2) offer.splice(1 + Math.floor(rnd(run) * (offer.length - 1)), 1); }
    // 順番をまぜる
    for (let i = offer.length - 1; i > 0; i--) { const j = Math.floor(rnd(run) * (i + 1)); [offer[i], offer[j]] = [offer[j], offer[i]]; }
    offer.forEach((id) => (run.seen[id] = 1));
    const o = { items: offer, hidden: null, hers: null };
    // 少女期：ときどき、ひとつは ないしょ（ツブがいちばん好きな色のもの）
    const mineTop = rank(now(run), ALL)[0];
    const fav = (list) => list.slice().sort((a, b) => (it(b).t[mineTop] || 0) - (it(a).t[mineTop] || 0))[0];
    if (run.st === 3 && offer.length === 3 && (run.turn % 2 === 1 || rnd(run) < 0.25)) {
      o.hidden = fav(offer); o.items = offer.filter((id) => id !== o.hidden);
    }
    if (run.st === 4 && offer.length === 2) {
      o.hers = fav(offer); o.items = offer.filter((id) => id !== o.hers);
    }
    run.offer = o; run.phase = 'evening';
    return o;
  }

  // 夕方：ひとつ とっておく（id=null で何も とっておかない）。缶がいっぱいなら out を手放す
  function keep(run, id, out) {
    const o = run.offer; if (!o || run.phase !== 'evening') return false;
    if (id && o.items.indexOf(id) < 0) return false;
    if (id) {
      if (out) release(run, out);
      const k = run.tin.indexOf(null);
      if (k < 0) return false;
      run.tin[k] = id; run.kept++; run.history.push(id);
    }
    if (o.hidden) { run.mine.push(o.hidden); run.history.push(o.hidden); }
    if (o.hers) { run.mine.push(o.hers); run.history.push(o.hers); }
    run.log.push({ st: run.st, turn: run.turn, dest: run.dest, offer: o.items.concat(o.hidden ? [o.hidden] : [], o.hers ? [o.hers] : []), kept: id || null });
    run.offer = null; run.held = null;
    return night(run);
  }
  const full = (run) => run.tin.indexOf(null) < 0;

  function night(run) {
    const e = schedEvent(run, 'after');
    if (e) { run.phase = 'event'; run.ev = { id: e, when: 'after' }; return run.phase; }
    return next(run);
  }
  function next(run) {
    run.turn++;
    if (run.turn >= STAGES[run.st].turns) {
      if (run.st === 4) { run.phase = 'depart'; return run.phase; }
      run.phase = 'growth'; return run.phase;
    }
    return begin(run);
  }
  // 成長：いまの色で髪型が決まり、缶が大きくなる
  function grow(run) {
    if (run.phase !== 'growth') return false;
    const sc = now(run), r = rank(sc, ALL);
    const top = sc[r[0]] > 0.5 ? r[0] : 'fu';
    const total = ALL.reduce((s, k) => s + Math.max(0, sc[k]), 0);
    const own = run.tin.some(Boolean) || run.mine.length;
    run.hairs.push(own && (sc[r[0]] >= sc[r[1]] * 1.15 || sc[r[0]] >= total * 0.34) ? top : 'fu');
    run.st++; run.turn = 0; fitTin(run);
    return begin(run);
  }

  // できごとの選択肢（id ごと）。shinro は、ツブの上位の色から
  function choices(run) {
    const e = run.ev && EVENTS[run.ev.id]; if (!e) return [];
    if (e.choices === 'dreams') {
      const r = rank(now(run)).slice(0, 3);
      return r.map((t) => ({ k: { [t]: 4 }, dream: t })).concat([{ k: {}, free: 1 }]);
    }
    if (run.ev.id === 'hanko') {
      const top = rank(now(run), ALL)[0];
      const items = run.tin.filter(Boolean).filter((id) => it(id).st && it(id).st < 3 && !it(id).t.yoru);
      const drop = items.sort((a, b) => (it(a).t[top] || 0) - (it(b).t[top] || 0))[0] || null;
      return drop ? [{ drop }, { k: { hina: 1 }, set: { heldOn: 1 } }] : [{ k: { [top]: 1 } }];
    }
    if (run.ev.id === 'ryoko') {
      const top = rank(now(run), ALL)[0];
      const id = SOUVENIR[top] || 'planeta';
      return [{ item: id }, { mine: id }];
    }
    return e.choices;
  }
  // できごとを決める。item のときは keepOut で缶の空きをつくる
  function choose(run, i, out) {
    if (run.phase !== 'event') return false;
    const id = run.ev.id, c = choices(run)[i]; if (!c) return false;
    if (c.k) for (const k in c.k) run.kokoro[k] = (run.kokoro[k] || 0) + c.k[k];
    if (c.set) Object.assign(run.flags, c.set);
    if (c.free) { const t = rank(now(run))[0]; run.kokoro[t] = (run.kokoro[t] || 0) + 2; }
    if (c.drop) release(run, c.drop);
    if (c.mine) { run.mine.push(c.mine); run.history.push(c.mine); run.seen[c.mine] = 1; }
    if (c.item) {
      if (out) release(run, out);
      const k = run.tin.indexOf(null);
      if (k >= 0) { run.tin[k] = c.item; run.kept++; run.history.push(c.item); }
      run.seen[c.item] = 1;
    }
    run.flags['ev_' + id] = 1;
    if (id === 'hikaru') run.flags['hikaru' + run.st] = 1;
    const when = run.ev.when; run.ev = null;
    if (when === 'before') { run.phase = 'morning'; run.held = null; return run.phase; }
    return next(run);
  }

  // 旅立ち：缶から3つまで持たせる
  function depart(run, ids) {
    if (run.phase !== 'depart') return false;
    ids = (ids || []).filter((id, i, a) => run.tin.indexOf(id) >= 0 && a.indexOf(id) === i).slice(0, 3);
    ids.forEach((id) => { run.tin[run.tin.indexOf(id)] = null; run.bag.push(id); });
    run.end = ending(run); run.phase = 'end';
    return run.end;
  }

  function ending(run) {
    const sc = score(run), r = rank(sc), top = r[0], sec = r[1];
    const tinN = run.tin.filter(Boolean).length;
    if (!tinN && !run.bag.length && run.kept <= 2) return { id: 'L', top, sec, sc };
    const yoruN = [...run.tin, ...run.mine, ...run.bag].filter((id) => id && it(id).t.yoru).length;
    if (yoruN >= 4 && (sc.yoru >= sc[top] || yoruN >= 5 && (run.kokoro.yoru || 0) >= 2)) return { id: 'K', top, sec, sc };
    const pair = [top, sec].sort().join('+');
    if (COMBO[pair] && sc[sec] >= sc[top] * 0.72) return { id: COMBO[pair], top, sec, sc };
    const total = MAIN.reduce((s, k) => s + Math.max(0, sc[k]), 0);
    const spread = MAIN.filter((k) => sc[k] >= total * 0.1).length;
    if (spread >= 5 && sc[top] <= total * 0.27) return { id: 'J', top, sec, sc };
    return { id: PURE[top], top, sec, sc };
  }

  const API = { MAIN, ALL, STAGES, EVENTS, SOUVENIR, slots, newRun, now, score, rank, look, timeOf, prologue, begin, give, release, goOut, keep, full, night, next, grow, choices, choose, depart, ending, rnd };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.TR = API;
})(typeof window !== 'undefined' ? window : globalThis);
