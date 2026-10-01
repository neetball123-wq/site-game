/* ことだま短冊 — 一回の旅（ローグライク）
   束（デッキ）・手札・戦い・店・道具・気まぐれモード。画面には触らない。 */
(function (G) {
  'use strict';
  const KD = G.KD;
  const { flat, morae, lg, lgAdd } = KD;

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

  /* ---------- 言葉と短冊 ---------- */
  const base = (run, id) => KD.DICT[id] || (run.custom && run.custom[id]);
  // 短冊（card）＝ { u: 番号, id: 言葉, pow: 今の力, add: 足されたタグ }
  function wordOf(run, c) {
    const b = base(run, c.id);
    if (!b) return null;
    return Object.assign({}, b, { pow: c.pow, tags: [...new Set([...b.tags, ...(c.add || [])])], u: c.u });
  }
  function newCard(run, id, extra) {
    const b = base(run, id);
    const c = { u: ++run.us, id, pow: b ? b.pow : 0, add: [] };
    if (extra) Object.assign(c, extra);
    run.deck.push(c);
    return c;
  }
  const card = (run, u) => run.deck.find((c) => c.u === u);
  // 文（[{u}|{p}]）→ 解析用の items
  const items = (run, sen) => sen.map((x) => (x.p ? { k: 'p', p: x.p } : { k: 'w', w: wordOf(run, card(run, x.u)), uid: x.u }));

  /* ---------- 旅のはじまり ---------- */
  function create(mode, seed) {
    seed = seed || String(Math.floor(Math.random() * 900000) + 100000);
    const run = {
      v: 1, mode, seed, rs: hash(seed + mode), us: 0, ch: 0, tier: 0,
      deck: [], custom: {}, pile: [], hand: [], disc: [],
      zeni: 4, tools: { hasami: 2, nori: 1 }, relics: [], wl: {}, wear: {}, cnt: {},
      phase: 'fight', fight: null, shop: null, reward: null,
      best: null, stats: { plays: 0, words: 0, fights: 0 }, found: { pairs: {}, waza: {} }, flags: {}, cleared: false,
    };
    for (const id of KD.START) newCard(run, id);
    if (mode === 'random') run.rand = makeRand(run);
    startFight(run);
    return run;
  }

  /* ---------- 気まぐれモード：この旅だけの相性 ---------- */
  function makeRand(run) {
    const cnt = {};
    for (const id in KD.DICT) for (const t of KD.DICT[id].tags) cnt[t] = (cnt[t] || 0) + 1;
    // どこにでもある性質（物・生 など）は外す。でないと毎回あたってしまう
    const tags = Object.keys(cnt).filter((t) => cnt[t] >= 4 && cnt[t] <= 40 && t !== '擬');
    const pairs = [], seen = {};
    while (pairs.length < 15) {
      const a = pick(run, tags), b = pick(run, tags);
      if (a === b || seen[a + b] || seen[b + a]) continue;
      seen[a + b] = 1;
      const r = rng(run);
      const x = r < 0.6 ? 1.3 + rng(run) * 0.7 : r < 0.85 ? 2.5 + rng(run) * 1.5 : r < 0.95 ? 0.5 : 6 + rng(run) * 4;
      pairs.push({ a, b, x: Math.round(x * 10) / 10 });
    }
    const wz = {};
    for (const w of KD.WAZA) wz[w.id] = Math.round(Math.pow(10, -0.5 + rng(run) * 1.1) * 10) / 10;
    const ROWS = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'やゆよ', 'らりるれろ'];
    const weak = {};
    for (const e of KD.ENEMIES) weak[e.id] = shuffle(run, [...KD.ELEM]).slice(0, 2);
    return { pairs, wz, moraN: 6 + Math.floor(rng(run) * 19), row: pick(run, ROWS), weak };
  }

  /* ---------- 物の怪 ---------- */
  function enemyFor(run) {
    const { ch, tier } = run;
    let e;
    if (ch < 4) {
      e = KD.ENEMIES.find((x) => x.ch === ch && x.tier === tier && !x.secret);
      if (ch === 2 && tier === 1 && run.flags.kaibun) e = KD.ENEMIES.find((x) => x.id === 'ungaikyo');
    } else {
      const c = KD.ENEMIES.filter((x) => x.tier === tier && !x.secret && x.ch === ch % 4);
      e = pick(run, c.length ? c : KD.ENEMIES.filter((x) => x.tier === tier && !x.secret));
    }
    return e;
  }
  // 戦いで使う物の怪（気まぐれなら苦手が入れかわる）
  function enemyOf(run) {
    const f = run.fight; if (!f) return null;
    const e = Object.assign({}, KD.ENEMIES.find((x) => x.id === f.eid));
    if (run.rand && run.rand.weak[e.id] && e.weak !== 'shift') e.weak = run.rand.weak[e.id];
    return e;
  }
  const relicSum = (run, k) => run.relics.reduce((a, id) => a + ((KD.RELICS.find((r) => r.id === id) || {})[k] || 0), 0);
  const hasRelic = (run, id) => run.relics.includes(id);
  const handSize = (run) => 8 + relicSum(run, 'hand');

  function startFight(run) {
    const e = enemyFor(run);
    run.fight = {
      eid: e.id, target: lg(KD.target(run.ch, run.tier) * (run.mode === 'random' ? 3 : 1)), got: -Infinity,
      plays: 4 + relicSum(run, 'plays'), discards: 3 + relicSum(run, 'discards'),
      sealed: false, bless: 1, defs: {}, used: {}, weak: null, eaten: [], log: [], n: 0,
    };
    const f = run.fight;
    if (e.trick && e.trick.id === 'no_discard') f.discards = 0;
    if (e.weak === 'shift') f.weak = shuffle(run, [...KD.ELEM]).slice(0, 2);
    run.pile = shuffle(run, run.deck.map((c) => c.u));
    run.hand = []; run.disc = [];
    if (e.trick && e.trick.id === 'eat') eat(run);
    draw(run, handSize(run));
    run.phase = 'fight';
  }
  // 言霊喰い：いちばん使いこんだ言葉を喰う
  function eat(run) {
    const f = run.fight;
    const ids = [...new Set(run.deck.map((c) => c.id))].filter((id) => !f.eaten.includes(id));
    if (!ids.length) return null;
    ids.sort((a, b) => (run.wear[b] || 0) - (run.wear[a] || 0) || (base(run, b).pow - base(run, a).pow));
    f.eaten.push(ids[0]);
    return ids[0];
  }
  function draw(run, n) {
    const got = [];
    for (let i = 0; i < n; i++) {
      if (!run.pile.length) { if (!run.disc.length) break; run.pile = shuffle(run, run.disc); run.disc = []; }
      const u = run.pile.pop();
      if (!card(run, u)) { i--; continue; }
      run.hand.push(u); got.push(u);
    }
    return got;
  }
  const isEaten = (run, u) => { const c = card(run, u); return !!(c && run.fight && run.fight.eaten.includes(c.id)); };

  /* ---------- 詠む ---------- */
  function ctxOf(run, roll) {
    const e = enemyOf(run), f = run.fight;
    if (e && f && f.weak) e.weak = f.weak;
    return { run, enemy: e, fight: f, season: run.ch % 4, roll: roll === undefined ? 0.5 : roll, rand: run.rand };
  }
  function check(run, sen) {
    const e = enemyOf(run);
    const ban = e && e.trick && e.trick.id === 'ban_p' && !run.fight.sealed ? e.trick.p : null;
    const an = KD.analyze(items(run, sen), { ban, banMsg: ban ? `「${ban[0]}」は波にさらわれた` : '' });
    for (const x of sen) if (x.u && isEaten(run, x.u)) { an.ok = false; an.errs.push({ i: -1, msg: '喰われた言葉は使えない' }); }
    return an;
  }
  function preview(run, sen) {
    const an = check(run, sen);
    return { an, res: KD.score(an, ctxOf(run, 0.99)) };
  }
  const textOf = (an) => an.T.map((t) => t.s).join('');

  function play(run, sen) {
    const f = run.fight, an = check(run, sen);
    if (!an.ok || f.plays <= 0) return { an, res: null };
    const roll = rng(run);
    const res = KD.score(an, ctxOf(run, roll));
    const before = f.got;
    f.got = lgAdd(f.got, res.lg);
    f.plays--; f.n++;
    run.stats.plays++;
    const wearX = hasRelic(run, 'fudezuka') ? 0.5 : 1;
    const used = sen.filter((x) => x.u).map((x) => x.u);
    for (const u of used) { const c = card(run, u); if (c) { run.wear[c.id] = (run.wear[c.id] || 0) + wearX; f.used[c.id] = 1; run.stats.words++; } }
    f.bless = 1;
    // 発見
    const newly = [];
    for (const fd of res.found) {
      if (fd.t === 'waza') { if (fd.id === 'kaibun') run.flags.kaibun = true; if (!run.found.waza[fd.id]) newly.push(fd); run.found.waza[fd.id] = (run.found.waza[fd.id] || 0) + 1; }
      if (fd.t === 'pair') { if (!run.found.pairs[fd.id]) newly.push(fd); run.found.pairs[fd.id] = 1; }
    }
    // 動詞の働き
    const log = applyEffects(run, an, res, used);
    // 使った短冊は捨て札へ（守るなら手札に戻る）
    run.hand = run.hand.filter((u) => !used.includes(u));
    if (log.guard) run.hand.push(...used.filter((u) => card(run, u))); else run.disc.push(...used.filter((u) => card(run, u)));
    for (const r of run.relics) { const R = KD.RELICS.find((x) => x.id === r); if (R && R.onPlay) R.onPlay(run); }
    // 物の怪の技
    const e = enemyOf(run), tr = e.trick && !f.sealed ? e.trick : null;
    if (tr && tr.id === 'fall' && run.hand.length) { const k = Math.floor(rng(run) * run.hand.length); log.fell = run.hand[k]; run.disc.push(...run.hand.splice(k, 1)); }
    if (tr && tr.id === 'eat') log.ate = eat(run);
    if (tr && tr.id === 'shift_kata') f.weak = shuffle(run, [...KD.ELEM]).slice(0, 2);
    // 引く
    const need = Math.max(0, handSize(run) - run.hand.length);
    log.drew = draw(run, need + (log.call || 0));
    // いちばんの一句
    const text = textOf(an);
    if (!run.best || res.lg > run.best.lg) run.best = { lg: res.lg, text, lines: lines(an), ch: run.ch, enemy: e.name };
    f.log.push({ text, lg: res.lg });
    const won = f.got >= f.target - 1e-9;
    const lost = !won && f.plays <= 0;
    if (won) { run.phase = 'cash'; run.stats.fights++; run.reward = cashOut(run); }
    else if (lost) run.phase = 'over';
    return { an, res, log, won, lost, before, newly };
  }
  // 型にはまっていれば、句ごとに分けた書き方
  function lines(an) {
    const f = KD.form(an);
    if (!f) return [textOf(an)];
    return f.lines.map(([a, b]) => an.T.slice(a, b + 1).map((t) => t.s).join(''));
  }

  function applyEffects(run, an, res, used) {
    const f = run.fight, log = { list: [], call: 0 };
    const cardAt = (i) => (an.T[i] && an.T[i].uid ? card(run, an.T[i].uid) : null);
    for (const ef of res.effects) {
      const rep = ef.rep || 1;
      const tg = (ef.targets || []).map(cardAt).filter(Boolean);
      const names = tg.map((c) => base(run, c.id).s).join('・');
      switch (ef.op) {
        case 'grow': { const d = Math.max(1, Math.round(ef.pow / 2)) * rep; for (const c of tg) c.pow += d; if (tg.length) log.list.push(`${names} の力 +${d}`); break; }
        case 'copy': { for (const c of tg) for (let k = 0; k < rep; k++) { const n = newCard(run, c.id, { pow: c.pow, add: [...c.add] }); run.disc.push(n.u); } if (tg.length) log.list.push(`${names} が束に${rep > 1 ? rep + '枚' : ''}増えた`); break; }
        case 'call': { const n = Math.max(1, tg.length) * rep; log.call += n; log.list.push(ef.q ? '答えを探して、一枚引く' : `${n}枚引く`); break; }
        case 'heal': { const ws = tg.length ? tg : used.map((u) => card(run, u)).filter(Boolean); for (const c of ws) run.wear[c.id] = Math.max(0, (run.wear[c.id] || 0) - 3 * rep); log.list.push('言葉のかすれが戻った'); break; }
        case 'gain': { const z = Math.max(1, Math.ceil(tg.reduce((a, c) => a + c.pow, 0) / 2)) * rep; run.zeni += z; log.list.push(`${z}銭`); break; }
        case 'sell': { let z = 0; for (const c of tg) { z += Math.max(1, Math.round(c.pow * 2)); removeCard(run, c.u); } if (tg.length) { run.zeni += z; log.list.push(`${names} を売って ${z}銭`); } break; }
        case 'del': { for (const c of tg) removeCard(run, c.u); if (tg.length) log.list.push(`${names} が束から消えた`); break; }
        case 'dye': { const add = ef.tags.filter((t) => t !== '数'); for (const c of tg) c.add = [...new Set([...(c.add || []), ...add])]; if (tg.length && add.length) log.list.push(`${names} が ${add.slice(0, 4).join('・')} を帯びた`); break; }
        case 'guard': { log.guard = true; log.list.push('使った短冊が手札に戻る'); break; }
        case 'seal': { if (!f.sealed) { f.sealed = true; log.list.push('物の怪の技を封じた'); } break; }
        case 'bless': { f.bless *= 1 + 0.25 * ef.pow * rep; log.list.push(`次の一句 ×${Math.round(f.bless * 100) / 100}`); break; }
        case 'meta': { const a = an.T[ef.a], b = an.T[ef.b]; if (a && b && a.w && b.w) { f.defs[a.w.id] = [...new Set([...(f.defs[a.w.id] || []), ...b.w.tags])]; log.list.push(`この戦いのあいだ、${a.w.s} は ${b.w.s} になる`); } break; }
        default: break;
      }
    }
    return log;
  }
  function removeCard(run, u) {
    run.deck = run.deck.filter((c) => c.u !== u);
    for (const k of ['pile', 'hand', 'disc']) run[k] = run[k].filter((x) => x !== u);
  }

  /* ---------- 書き直し ---------- */
  function discard(run, us) {
    const f = run.fight;
    if (f.discards <= 0 || !us.length) return false;
    f.discards--;
    run.hand = run.hand.filter((u) => !us.includes(u));
    run.disc.push(...us);
    draw(run, Math.max(0, handSize(run) - run.hand.length));
    return true;
  }

  /* ---------- 道具 ---------- */
  const useTool = (run, id) => { if (!run.tools[id]) return false; run.tools[id]--; return true; };
  // はさみ：切れ目ごとに、左右がどんな言葉になるか
  function cutOptions(run, u) {
    const c = card(run, u), w = base(run, c.id), ms = morae(w.y), out = [];
    for (let k = 1; k < ms.length; k++) {
      const L = ms.slice(0, k).join(''), R = ms.slice(k).join('');
      out.push({ k, L: { y: L, ws: KD.BY_Y[flat(L)] || [] }, R: { y: R, ws: KD.BY_Y[flat(R)] || [] } });
    }
    return out;
  }
  const otoWord = (run, y) => { const id = 'oto:' + y; if (!run.custom[id]) run.custom[id] = { id, y, s: y, pos: 'oto', pow: 0, tags: [], oto: true }; return id; };
  function cut(run, u, k, li, ri) {
    if (!useTool(run, 'hasami')) return null;
    const opt = cutOptions(run, u).find((o) => o.k === k);
    const mk = (side, i) => (side.ws.length ? side.ws[Math.min(i || 0, side.ws.length - 1)].id : otoWord(run, side.y));
    const at = run.hand.indexOf(u);
    removeCard(run, u);
    const a = newCard(run, mk(opt.L, li)), b = newCard(run, mk(opt.R, ri));
    run.hand.splice(Math.max(0, at), 0, a.u, b.u);
    return [a, b];
  }
  // のり：二枚 → 一枚。辞書にあればその言葉、なければ新しい言葉（造語）
  function glueResult(run, ua, ub) {
    const A = wordOf(run, card(run, ua)), B = wordOf(run, card(run, ub));
    const s = A.s + B.s, y = A.y + B.y;
    const hit = (KD.BY_S[s] || [])[0] || (KD.BY_Y[flat(y)] || []).find((w) => w.pos === 'n') || (KD.BY_Y[flat(y)] || [])[0];
    if (hit) return { id: hit.id, w: hit, pow: hit.pow, known: true };
    const oto = A.pos === 'oto' && B.pos === 'oto';
    const id = (oto ? 'oto:' : 'c:') + s;
    const w = { id, s, y, pos: oto ? 'oto' : 'n', pow: oto ? 0 : Math.round((A.pow + B.pow) * 1.2), tags: oto ? [] : [...new Set([...A.tags, ...B.tags])], coined: !oto, oto };
    return { id, w, pow: w.pow, known: false };
  }
  function glue(run, ua, ub) {
    if (!useTool(run, 'nori')) return null;
    const r = glueResult(run, ua, ub);
    if (!r.known) run.custom[r.id] = r.w;
    const at = Math.min(run.hand.indexOf(ua), run.hand.indexOf(ub));
    const add = [...new Set([...(card(run, ua).add || []), ...(card(run, ub).add || [])])];
    removeCard(run, ua); removeCard(run, ub);
    const c = newCard(run, r.id, { add });
    run.hand.splice(Math.max(0, at), 0, c.u);
    return c;
  }
  const homophones = (run, u) => { const w = base(run, card(run, u).id); return (KD.BY_Y[flat(w.y)] || []).filter((x) => x.id !== w.id); };
  function rewrite(run, u, id) {
    if (!useTool(run, 'fude')) return null;
    const c = card(run, u), old = base(run, c.id), nw = KD.DICT[id];
    c.pow = Math.max(0, nw.pow + (c.pow - old.pow)); c.id = id;
    return c;
  }
  function erase(run, u) { if (!useTool(run, 'keshigomu')) return false; removeCard(run, u); return true; }
  function copy(run, u) { if (!useTool(run, 'utsushi')) return null; const c = card(run, u); const n = newCard(run, c.id, { pow: c.pow, add: [...c.add] }); run.disc.push(n.u); return n; }
  function stamp(run, u, tag) { if (!useTool(run, 'shuniku')) return null; const c = card(run, u); c.add = [...new Set([...(c.add || []), tag])]; return c; }
  function sumi(run) { if (!useTool(run, 'sumi')) return false; for (const u of run.hand) { const c = card(run, u); if (c) run.wear[c.id] = 0; } return true; }
  function shiori(run) { if (!useTool(run, 'shiori')) return false; run.fight.plays++; return true; }

  /* ---------- 戦いのあと ---------- */
  function cashOut(run) {
    const f = run.fight, e = enemyOf(run);
    const rows = [];
    let base0 = [3, 4, 5][run.tier] + Math.floor(run.ch / 4);
    if (run.tier === 2 && hasRelic(run, 'takarabune')) base0 *= 2;
    rows.push([`${e.name}を祓った`, base0]);
    if (f.plays > 0) rows.push([`残りの詠む ${f.plays}回`, f.plays]);
    const rate = hasRelic(run, 'kobanyama') ? 5 : 10;
    const intr = Math.floor(run.zeni / rate);
    if (intr > 0) rows.push([`利子（${rate}銭ごとに1銭）`, intr]);
    const total = rows.reduce((a, r) => a + r[1], 0);
    // 言葉のご褒美：三つから一つ（中物・大物は名の短冊も混じる）
    const opts = shopWords(run, 3, true);
    if (run.tier >= 1) opts[2] = { id: KD.ENEMIES.find((x) => x.id === f.eid).name, price: 0 };
    return { rows, total, opts, taken: false, paid: false };
  }
  function takeCash(run) {
    const r = run.reward; if (!r || r.paid) return;
    r.paid = true; run.zeni += r.total;
  }
  function takeReward(run, k) {
    const r = run.reward; if (!r || r.taken) return null;
    r.taken = true;
    if (k === null || k === undefined) return null;
    const o = r.opts[k]; if (!o) return null;
    return newCard(run, o.id);
  }
  // 季節がかわる（大物のあと）と、言葉は少し休まる
  function nextFight(run) {
    if (run.tier === 2) {
      for (const id in run.wear) run.wear[id] = Math.floor(run.wear[id] / 2);
      if (run.ch === 3 && !run.cleared) { run.cleared = true; run.phase = 'clear'; return 'clear'; }
      run.ch++; run.tier = 0;
    } else run.tier++;
    run.shop = null; run.reward = null;
    startFight(run);
    return 'fight';
  }

  // 冬の大物のあと：百鬼夜行（上限なし）
  function endless(run) { run.ch++; run.tier = 0; run.shop = null; run.reward = null; startFight(run); }

  /* ---------- 店 ---------- */
  const priceOf = (w) => 2 + w.r + Math.floor(w.pow / 4);
  function shopWords(run, n, free) {
    const pool = Object.values(KD.DICT).filter((w) => w.p && w.pack === 'base');
    const out = [], seen = {};
    let guard = 0;
    while (out.length < n && guard++ < 500) {
      const w = pick(run, pool);
      if (seen[w.id]) continue;
      // 一音の言葉・感動詞・力の弱い言葉は、あまり並ばない（はさみで作るもの）
      if (morae(w.y).length === 1 && rng(run) < 0.85) continue;
      if ((w.pos === 'it' || w.pos === 'cj') && rng(run) < 0.7) continue;
      if (w.pow <= 1 && rng(run) < 0.6) continue;
      // まれな言葉は、旅が進むほど出やすい
      if (w.r === 3 && rng(run) > 0.15 + run.ch * 0.15) continue;
      if (w.r === 2 && rng(run) > 0.45 + run.ch * 0.15) continue;
      seen[w.id] = 1;
      out.push({ id: w.id, price: free ? 0 : priceOf(w) });
    }
    return out;
  }
  function openShop(run) {
    const rel = KD.RELICS.filter((r) => !run.relics.includes(r.id) && (!r.rand || run.mode === 'random'));
    const scrollable = KD.WAZA.filter((w) => !w.hide || run.found.waza[w.id]);
    const sc = pick(run, scrollable);
    run.shop = {
      words: shopWords(run, 4 + relicSum(run, 'shop')),
      relics: shuffle(run, [...rel]).slice(0, 2).map((r) => ({ id: r.id, price: r.price })),
      tools: shuffle(run, [...KD.TOOLS]).slice(0, 2).map((t) => ({ id: t.id, price: t.price })),
      scroll: { id: sc.id, price: 4 + ((run.wl[sc.id] || 0) * 2) },
      rerolls: 0,
    };
    run.phase = 'shop';
    return run.shop;
  }
  function buy(run, kind, k) {
    const s = run.shop; if (!s) return false;
    const it = kind === 'scroll' ? s.scroll : s[kind][k];
    if (!it || it.sold || run.zeni < it.price) return false;
    run.zeni -= it.price; it.sold = true;
    if (kind === 'words') newCard(run, it.id);
    if (kind === 'relics') run.relics.push(it.id);
    if (kind === 'tools') run.tools[it.id] = (run.tools[it.id] || 0) + 1;
    if (kind === 'scroll') run.wl[it.id] = (run.wl[it.id] || 0) + 1;
    return true;
  }
  function reroll(run) {
    const s = run.shop, cost = 2 + s.rerolls;
    if (run.zeni < cost) return false;
    run.zeni -= cost; s.rerolls++;
    s.words = shopWords(run, 4 + relicSum(run, 'shop'));
    return true;
  }

  KD.Run = {
    create, rng, wordOf, card, items, enemyOf, ctxOf, check, preview, play, discard, draw, textOf, lines, handSize, isEaten,
    cutOptions, cut, glueResult, glue, homophones, rewrite, erase, copy, stamp, sumi, shiori,
    takeCash, takeReward, nextFight, endless, openShop, buy, reroll, priceOf, base, relicSum, hasRelic, startFight,
  };
})(typeof window !== 'undefined' ? window : globalThis);
