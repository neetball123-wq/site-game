/* ぬか床、百年 — 中身（画面なし。Node でも動く）
   時間は秒。菌はロジスティックにふえ、菌が多いほど野菜が早く漬かる。 */
(function (root) {
  const NK = root.NK;
  const VEG = NK.VEG, VEGI = NK.VEGI, CONT = NK.CONT, UPI = NK.UPI;

  NK.fresh = (now) => ({
    v: 1, t: now || Date.now(), born: now || Date.now(),
    coins: 60, rep: 0, repMax: 0, earned: 0,
    kg: 1, cont: 0, C: 1e6, O: 0.5, mzT: 0, pick: 'kyuri', replant: 'pick',
    slots: [], up: {}, auto: 'tabe',
    orders: [], orderCd: 3, orderN: 0,
    stats: { stirs: 0, harvests: 0, orders: 0, furu: 0, by: {}, earnedAll: 0, bestHarvest: 0 },
    zukan: {}, cards: {}, notes: {}, seen: {},
    pres: { count: 0, points: 0, kaden: {}, recip: [] },
    tree: [], treeSeq: 0,
    secret: { soko: false },
    ended: false, endAt: 0,
    playMs: 0, snd: true,
  });

  /* ---- 数の書きかた（万・億・兆…） ---- */
  const UNITS = ['', '万', '億', '兆', '京', '垓', '秭', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];
  NK.fmt = (n, dec) => {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + NK.fmt(-n, dec);
    if (n < 1e4) return dec && n < 100 ? (Math.round(n * 10) / 10).toString() : Math.floor(n).toLocaleString('ja-JP');
    const k = Math.min(UNITS.length - 1, Math.floor(Math.log10(n) / 4));
    if (k >= UNITS.length - 1 && n >= 1e72) return n.toExponential(2).replace('e+', '×10^');
    const v = n / Math.pow(10, 4 * k);
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v).toString()) + UNITS[k];
  };
  NK.fmtTime = (sec) => {
    sec = Math.max(0, Math.ceil(sec));
    if (sec < 60) return sec + '秒';
    if (sec < 3600) return Math.floor(sec / 60) + '分' + (sec % 60 ? (sec % 60) + '秒' : '');
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h + '時間' + (m ? m + '分' : '');
  };

  /* ---- 効き目の計算 ---- */
  NK.lv = (s, id) => s.up[id] || 0;
  NK.kl = (s, id) => (s.pres.kaden[id] || 0);
  NK.households = (s) => 1 + s.tree.length;
  NK.recipBonus = (s) => {
    const b = { growth: 1, value: 1, rep: 1, konbu: 0, offline: 0, quality: 0, order: 1, mazebo: 1, cost: 1, window: 1, stir: 1, spread: 1 };
    for (const id of s.pres.recip) {
      const r = NK.RECIPI[id]; if (!r) continue;
      if (['konbu', 'offline', 'quality'].includes(r.bonus)) b[r.bonus] += r.amt; else b[r.bonus] *= r.amt;
    }
    return b;
  };
  NK.derive = (s, now) => {
    const c = CONT[s.cont], rb = NK.recipBonus(s), L = (id) => NK.lv(s, id), K = (id) => NK.kl(s, id);
    const se = NK.season(now ? new Date(now) : undefined);
    const H = NK.households(s);
    const d = {};
    d.cont = c; d.se = se; d.rb = rb; d.H = H;
    d.slots = c.slots + K('waku');
    d.kgMax = c.kg;
    d.capMult = c.cap * Math.pow(1.4, L('beer'));
    d.Cap = 1e8 * s.kg * s.kg * d.capMult;
    d.growth = Math.pow(1.4, K('ikioi')) * rb.growth * Math.pow(1.25, L('beer'));
    d.value = Math.pow(1.15 + rb.konbu, L('konbu')) * Math.pow(1.3, K('mekiki')) * rb.value * (L('mise') ? 1.5 : 1) * (1 + 0.02 * (H - 1)) * (s.secret.soko ? 1.2 : 1);
    d.stirPow = Math.pow(1.5, K('te')) * rb.stir;
    d.order = Math.pow(1.25, L('kaki')) * Math.pow(1.4, K('joren')) * rb.order * (L('mise') ? 1.3 : 1);
    d.repM = Math.pow(1.2, K('joren')) * rb.rep;
    d.tabeEnd = 1 + 0.8 * (1 + 0.15 * L('kara')) * rb.window;
    d.furu = 0.55 + 0.08 * L('kara');
    d.qBonus = 0.06 * L('sansho') + rb.quality + se.q;
    d.decay = 600 * (1 + 0.3 * L('togarashi')) / se.decay;
    d.mazeboInt = L('mazebo') > 0 ? 45 / (1 + 0.6 * (L('mazebo') - 1)) / rb.mazebo : Infinity;
    d.cost = rb.cost;
    d.offlineH = 8 + 6 * K('rusu') + rb.offline;
    d.spread = Math.pow(1.35, K('hirogari')) * rb.spread;
    d.F = Math.pow(Math.max(1, s.C) / 1e6, 0.2) * (0.85 + 0.3 * s.O) * se.speed;
    d.r = 0.012 * (0.4 + 0.8 * s.O) * d.growth;
    return d;
  };
  NK.stageOf = (p, d) => (p < 0.5 ? null : p < 1 ? 'asa' : p < d.tabeEnd ? 'tabe' : 'furu');
  NK.quality = (sl, d) => Math.max(0.5, Math.min(1.6, 0.85 + 0.3 * (sl.tAcc > 0 ? sl.oAcc / sl.tAcc : 0.5) + d.qBonus));
  NK.vegCost = (s, id, d) => Math.ceil(VEG[VEGI[id]].cost * (d || NK.derive(s)).cost);
  NK.harvestValue = (s, sl, d) => {
    const v = VEG[VEGI[sl.veg]], st = NK.stageOf(sl.p, d);
    if (!st) return 0;
    const sm = st === 'furu' ? d.furu : NK.STAGE[st].mult;
    return v.val * sm * NK.quality(sl, d) * d.value * (sl.veg === 'nasu' && NK.lv(s, 'tetsu') ? 3 : 1);
  };
  NK.unlocked = (s, v) => s.repMax >= v.rep && s.cont >= (v.cont || 0);
  NK.lockWhy = (s, v) => (s.repMax < v.rep ? 'rep' : s.cont < (v.cont || 0) ? 'cont' : '');
  NK.ensureSlots = (s, d) => { while (s.slots.length < d.slots) s.slots.push({ veg: null, p: 0, oAcc: 0, tAcc: 0, last: null }); };

  const ev = (s, e) => { (s.ev = s.ev || []).push(e); };
  NK.ev = ev;

  /* ---- まぜる ---- */
  NK.stir = (s, auto) => {
    const d = NK.derive(s);
    const pow = auto ? 1 : d.stirPow;
    s.O = Math.min(1, s.O + 0.06 * pow);
    s.C = Math.min(d.Cap, s.C + (d.Cap - s.C) * 0.0006 * pow);
    if (!auto) {
      s.stats.stirs++;
      if (!s.secret.soko && s.stats.stirs >= 1000) { s.secret.soko = true; s.zukan.hyakunen = true; ev(s, { k: 'soko' }); }
    }
  };

  /* ---- 漬ける・取り出す ---- */
  NK.plant = (s, i, id) => {
    const d = NK.derive(s), sl = s.slots[i], v = VEG[VEGI[id]];
    if (!sl || sl.veg || !v || !NK.unlocked(s, v)) return false;
    const cost = NK.vegCost(s, id, d);
    if (s.coins < cost) return false;
    s.coins -= cost;
    Object.assign(sl, { veg: id, p: 0, oAcc: 0, tAcc: 0, last: id });
    return true;
  };
  NK.harvest = (s, i, auto) => {
    const d = NK.derive(s), sl = s.slots[i];
    if (!sl || !sl.veg) return null;
    const st = NK.stageOf(sl.p, d);
    if (!st) return null;
    const vi = VEGI[sl.veg], v = VEG[vi];
    let val = NK.harvestValue(s, sl, d);
    let repG = 0.003 * Math.pow(v.val, 0.8) * (st === 'tabe' ? 1 : 0.6) * d.repM;
    const res = { veg: sl.veg, st, val, q: NK.quality(sl, d), order: null };
    // 注文にあう物なら、注文に回す
    const o = s.orders.find((o) => o.veg === sl.veg && o.st === st && o.got < o.n);
    if (o) {
      o.got++; res.order = o;
      if (o.got >= o.n) {
        val += o.reward; repG += o.rep; s.stats.orders++;
        s.orders = s.orders.filter((x) => x !== o);
        s.orderCd = 12;
        res.done = o;
      }
    }
    s.coins += val; s.earned += val; s.stats.earnedAll += val;
    s.rep += repG; s.repMax = Math.max(s.repMax, s.rep);
    s.stats.harvests++; s.stats.by[sl.veg] = (s.stats.by[sl.veg] || 0) + 1;
    if (st === 'furu') s.stats.furu++;
    s.stats.bestHarvest = Math.max(s.stats.bestHarvest, val);
    const zk = sl.veg + ':' + st;
    if (!s.zukan[zk]) { s.zukan[zk] = true; res.newZukan = zk; }
    if (sl.veg === 'nasu' && st === 'tabe' && NK.lv(s, 'tetsu') && !s.zukan.tetsunasu) { s.zukan.tetsunasu = true; res.newZukan = 'tetsunasu'; }
    const again = sl.veg;
    Object.assign(sl, { veg: null, p: 0, oAcc: 0, tAcc: 0 });
    if (NK.lv(s, 'haitatsu') && auto !== 'noReplant') {
      const want = s.replant === 'same' ? again : (s.pick || again);
      if (!NK.plant(s, i, want) && want !== again) NK.plant(s, i, again);
    }
    res.val = val;
    return res;
  };
  NK.autoTarget = (s, d) => (s.auto === 'asa' ? 0.75 : s.auto === 'furu' ? d.tabeEnd + 0.15 : Math.min(d.tabeEnd - 0.05, 1.15));

  /* ---- 入れかえる：漬かっていれば取り出し、まだなら仕入れ値の半分を返して抜く ---- */
  NK.swapSlot = (s, i, id) => {
    const d = NK.derive(s), sl = s.slots[i];
    if (!sl) return null;
    let res = null;
    if (sl.veg) {
      if (sl.veg === id) return null;
      if (NK.stageOf(sl.p, d)) res = NK.harvest(s, i, 'noReplant');
      else { s.coins += Math.floor(NK.vegCost(s, sl.veg, d) / 2); Object.assign(sl, { veg: null, p: 0, oAcc: 0, tAcc: 0 }); }
    }
    const ok = NK.plant(s, i, id);
    return { res, ok };
  };
  NK.swapAll = (s, id) => {
    let n = 0;
    const out = [];
    for (let i = 0; i < s.slots.length; i++) {
      const sl = s.slots[i];
      if (sl.veg === id) continue;
      const r = NK.swapSlot(s, i, id);
      if (r) { out.push([i, r.res]); if (r.ok) n++; }
    }
    return { n, out };
  };

  /* ---- 道具 ---- */
  NK.upCost = (s, id, lv) => { const u = UPI[id]; const l = lv == null ? NK.lv(s, id) : lv; return Math.ceil(u.cost * Math.pow(u.grow, l)); };
  NK.upAvail = (s, id) => {
    const u = UPI[id];
    if (s.repMax < u.rep) return 'lock';
    if (u.max && NK.lv(s, id) >= u.max) return 'max';
    if (id === 'bran' && s.kg >= CONT[s.cont].kg - 1e-9) return 'full';
    return 'ok';
  };
  NK.buyUp = (s, id) => {
    if (NK.upAvail(s, id) !== 'ok') return false;
    const c = NK.upCost(s, id);
    if (s.coins < c) return false;
    s.coins -= c; s.up[id] = NK.lv(s, id) + 1;
    if (id === 'bran') s.kg = Math.min(CONT[s.cont].kg, s.kg + 0.5);
    return true;
  };
  NK.contNext = (s) => CONT[s.cont + 1] || null;
  NK.buyCont = (s) => {
    const c = NK.contNext(s);
    if (!c || s.repMax < c.rep || s.coins < c.cost) return false;
    s.coins -= c.cost; s.cont++;
    NK.ensureSlots(s, NK.derive(s));
    return true;
  };

  /* ---- 注文 ---- */
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  NK.seed = (n) => { seed = (n % 2147483646) + 1; };
  NK.newOrder = (s) => {
    const d = NK.derive(s);
    const un = VEG.filter((v) => NK.unlocked(s, v));
    if (!un.length) return null;
    const w = un.map((v, i) => (i >= un.length - 1 ? 4 : i >= un.length - 3 ? 2.2 : 1));
    let x = rnd() * w.reduce((a, b) => a + b, 0), vi = 0;
    for (; vi < w.length - 1; vi++) { x -= w[vi]; if (x <= 0) break; }
    const v = un[vi];
    const used = new Set(s.orders.map((o) => o.who));
    const whoPool = NK.WHO.filter((w) => !used.has(w.id));
    const who = whoPool[Math.floor(rnd() * whoPool.length)] || NK.WHO[0];
    const r = rnd();
    const st = s.stats.harvests < 3 ? 'tabe' : r < 0.58 ? 'tabe' : r < 0.84 ? 'asa' : 'furu';
    const n = 1 + Math.floor(rnd() * (v.val < 1000 ? 3 : 2));
    const sm = st === 'furu' ? d.furu : NK.STAGE[st].mult;
    const reward = Math.ceil(v.val * n * sm * 3 * d.order * d.value);
    const rep = 0.12 * Math.pow(v.val * n, 0.75) * d.repM;
    return { id: ++s.orderN, who: who.id, veg: v.id, st, n, got: 0, reward, rep };
  };
  NK.maxOrders = (s) => (NK.lv(s, 'mise') ? 4 : 3);
  NK.skipOrder = (s, id) => {
    const o = s.orders.find((x) => x.id === id); if (!o) return;
    s.orders = s.orders.filter((x) => x !== o);
    s.orderCd = Math.max(s.orderCd, 30);
  };

  /* ---- のれん分け ---- */
  NK.presNeed = (s) => 4e6 * Math.pow(9, s.pres.count);
  NK.presReady = (s) => s.repMax >= 3800 && s.earned >= NK.presNeed(s);
  NK.presPoints = (s) => Math.floor(2 * Math.cbrt(s.earned / 1e6));
  NK.presChoices = (s) => {
    const used = new Set(s.pres.recip);
    const pool = NK.RECIP.filter((r) => !used.has(r.id));
    // 毎回同じ回なら同じ三人（その回の数で決める）
    const out = [], base = s.pres.count * 7 + 3;
    for (let i = 0; i < pool.length && out.length < 3; i++) out.push(pool[(base + i * 5) % pool.length]);
    return [...new Set(out)];
  };
  NK.prestige = (s, rid, now) => {
    if (!NK.presReady(s)) return false;
    const r = NK.RECIPI[rid]; if (!r || s.pres.recip.includes(rid)) return false;
    const pts = NK.presPoints(s);
    s.pres.count++; s.pres.points += pts; s.pres.recip.push(rid);
    s.tree.push({ id: ++s.treeSeq, name: r.name, recip: rid, parent: 0, depth: 1, at: now || Date.now(), acc: 0, kids: 0 });
    const keep = { replant: s.replant, rep: s.rep, repMax: s.repMax, pres: s.pres, tree: s.tree, treeSeq: s.treeSeq, stats: s.stats, zukan: s.zukan, cards: s.cards, notes: s.notes, seen: s.seen, secret: s.secret, ended: s.ended, endAt: s.endAt, playMs: s.playMs, snd: s.snd, born: s.born, orderN: s.orderN, auto: s.auto };
    const f = NK.fresh(now);
    Object.assign(s, f, keep);
    const h = NK.kl(s, 'hajime');
    s.coins = 60 + (h ? 400 * Math.pow(6, h) : 0);
    if (h) { s.up.bran = Math.min(4, 2 * h); s.kg = Math.min(CONT[0].kg, 1 + 0.5 * s.up.bran); }
    s.orders = []; s.orderCd = 2; s.slots = [];
    NK.ensureSlots(s, NK.derive(s, now));
    ev(s, { k: 'pres', rid, pts });
    return true;
  };
  NK.kadenCost = (s, id) => { const k = NK.KADENI[id], l = NK.kl(s, id); return l < k.cost.length ? k.cost[l] : null; };
  NK.kadenFree = (s) => s.pres.points - Object.entries(s.pres.kaden).reduce((a, [id, l]) => a + NK.KADENI[id].cost.slice(0, l).reduce((x, y) => x + y, 0), 0);
  NK.buyKaden = (s, id) => {
    const c = NK.kadenCost(s, id);
    if (c == null || NK.kadenFree(s) < c) return false;
    s.pres.kaden[id] = NK.kl(s, id) + 1;
    if (id === 'waku') NK.ensureSlots(s, NK.derive(s));
    return true;
  };

  /* ---- 系譜がひろがる（実際の時間で） ---- */
  NK.growTree = (s, dt, now) => {
    const d = NK.derive(s, now);
    const per = 21600 / d.spread;
    let made = 0;
    for (let guard = 0; guard < 200; guard++) {
      let any = false;
      for (const n of s.tree.slice()) {
        if (n.depth >= 3 || n.kids >= 3) continue;
        n.acc += dt / per;
        while (n.acc >= 1 && n.kids < 3 && s.tree.length < 300) {
          n.acc -= 1; n.kids++;
          const name = NK.PLACE[(s.treeSeq * 7 + n.id * 3) % NK.PLACE.length];
          s.tree.push({ id: ++s.treeSeq, name, parent: n.id, depth: n.depth + 1, at: now || Date.now(), acc: 0, kids: 0 });
          made++; any = true;
        }
      }
      dt = 0; // 新しくできた家は、次の時間から数える
      if (!any) break;
    }
    if (made) ev(s, { k: 'tree', n: made });
    return made;
  };

  /* ---- 時間を進める ---- */
  NK.tick = (s, dt, now, opt = {}) => {
    if (dt <= 0) return;
    let d = NK.derive(s, now);
    NK.ensureSlots(s, d);
    // まぜたて度：オフラインでは、まぜ棒が保つ高さに落ち着く
    if (opt.offline) {
      const ss = d.mazeboInt < Infinity ? Math.min(1, (0.06 * d.decay) / d.mazeboInt) : 0;
      s.O = Math.max(ss, s.O - dt / d.decay);
    } else {
      s.O = Math.max(0, s.O - dt / d.decay);
      if (d.mazeboInt < Infinity) {
        s.mzT += dt;
        while (s.mzT >= d.mazeboInt) { s.mzT -= d.mazeboInt; NK.stir(s, true); ev(s, { k: 'autoStir' }); }
      }
    }
    d = NK.derive(s, now);
    // 菌：ロジスティック（この区間は r を一定とみなす）
    const Cap = d.Cap, r = d.r;
    if (s.C > Cap) s.C = Cap;
    else s.C = Cap / (1 + (Cap / s.C - 1) * Math.exp(-r * dt));
    // 野菜
    const auto = NK.lv(s, 'mina') > 0, tgt = NK.autoTarget(s, d);
    for (let i = 0; i < s.slots.length; i++) {
      const sl = s.slots[i]; if (!sl.veg) continue;
      const v = VEG[VEGI[sl.veg]];
      const rate = d.F / v.t;
      let left = dt;
      for (let guard = 0; guard < 500 && left > 0 && sl.veg; guard++) {
        if (auto && sl.p < tgt) {
          const need = (tgt - sl.p) / rate;
          const use = Math.min(need, left);
          sl.p += use * rate; sl.oAcc += s.O * use; sl.tAcc += use; left -= use;
          if (sl.p >= tgt - 1e-9) { const res = NK.harvest(s, i, true); if (res) ev(s, { k: 'harvest', i, res, auto: true }); }
        } else {
          sl.p += left * rate; sl.oAcc += s.O * left; sl.tAcc += left; left = 0;
          if (auto && sl.p >= tgt) { const res = NK.harvest(s, i, true); if (res) ev(s, { k: 'harvest', i, res, auto: true }); }
        }
      }
      if (sl.veg && sl.p > 6) sl.p = 6;
    }
    // 注文
    if (s.orders.length < NK.maxOrders(s)) {
      s.orderCd -= dt;
      if (s.orderCd <= 0) { const o = NK.newOrder(s); if (o) { s.orders.push(o); ev(s, { k: 'order', o }); } s.orderCd = opt.offline ? 0 : 18 + Math.random() * 10; }
    }
    // 系譜
    if (s.tree.length) NK.growTree(s, dt, now);
    // はがき・帳面
    NK.checkStory(s);
  };
  NK.checkStory = (s) => {
    for (const c of NK.CARDS) if (!s.cards[c.id] && c.when(s)) { s.cards[c.id] = Date.now(); ev(s, { k: 'card', id: c.id }); }
    for (const n of NK.NOTES) if (!s.notes[n.id] && n.when(s)) { s.notes[n.id] = Date.now(); if (n.id !== 'n1') ev(s, { k: 'note', id: n.id }); }
    if (!s.ended && NK.households(s) >= 50 && !s.endReady) { s.endReady = true; ev(s, { k: 'endReady' }); }
  };

  /* ---- 留守のあいだ ---- */
  NK.offline = (s, now) => {
    const d = NK.derive(s, now);
    const away = Math.max(0, (now - s.t) / 1000);
    const dt = Math.min(away, d.offlineH * 3600);
    s.t = now;
    if (dt < 20) return null;
    const before = { coins: s.coins, rep: s.rep, C: s.C, harv: s.stats.harvests, orders: s.stats.orders, tree: s.tree.length, by: Object.assign({}, s.stats.by), earned: s.earned };
    const steps = Math.min(1500, Math.max(10, Math.ceil(dt / 5)));
    const h = dt / steps;
    const evs = [];
    for (let k = 0; k < steps; k++) {
      NK.tick(s, h, now - (dt - k * h) * 1000, { offline: true });
      if (s.ev) { for (const e of s.ev) if (e.k !== 'autoStir' && e.k !== 'harvest' && e.k !== 'order') evs.push(e); s.ev = []; }
    }
    const by = {};
    for (const id in s.stats.by) { const n = s.stats.by[id] - (before.by[id] || 0); if (n > 0) by[id] = n; }
    s.ev = evs;
    return { away, dt, capped: away > dt, coins: s.coins - before.coins, earned: s.earned - before.earned, rep: s.rep - before.rep, Cx: s.C / before.C, harv: s.stats.harvests - before.harv, orders: s.stats.orders - before.orders, tree: s.tree.length - before.tree, by, ripe: s.slots.filter((x) => x.veg && x.p >= 0.5).length };
  };

  /* ---- 一秒あたりのめやす（表示用） ---- */
  NK.incomeRate = (s, d) => {
    d = d || NK.derive(s);
    let sum = 0;
    for (const sl of s.slots) if (sl.veg) { const v = VEG[VEGI[sl.veg]]; sum += v.val * d.value * (sl.veg === 'nasu' && NK.lv(s, 'tetsu') ? 3 : 1) * d.F / (v.t * Math.min(d.tabeEnd - 0.05, 1.15)); }
    return sum;
  };
})(typeof window !== 'undefined' ? window : globalThis);
