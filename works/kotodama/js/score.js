/* ことだま短冊 — 点の計算
   点 ＝ 力（言葉の力の合計）×（1＋足す倍）× かける倍。上限はない。
   大きくなりすぎても困らないように、合計は 10 を底にした対数（log10）でも持つ。 */
(function (G) {
  'use strict';
  const KD = G.KD;
  const { head, flat } = KD;

  // 使いこむほど、言葉はかすれる（3回目まではそのまま、そのあと 1回ごとに 0.88 倍）
  KD.fade = (n) => Math.pow(0.88, Math.max(0, (n || 0) - 3));

  /* ---------- 大きな数の書き方 ---------- */
  const UNITS = ['', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];
  KD.fmt = (lg) => {
    if (lg === -Infinity || lg === undefined || isNaN(lg)) return '0';
    if (lg < 4) return String(Math.round(Math.pow(10, lg)));
    const u = Math.floor(lg / 4);
    if (u < UNITS.length) {
      const top = Math.pow(10, lg - u * 4);
      if (top >= 1000 || u === 0) return Math.floor(top) + UNITS[u];
      const lowLg = lg - (u - 1) * 4;
      const big = Math.floor(top), rest = Math.floor(Math.pow(10, lowLg) - big * 10000);
      return big + UNITS[u] + (rest > 0 ? rest + UNITS[u - 1] : '');
    }
    // 無量大数より先は「10の◯乗」
    return `10の${Math.floor(lg)}乗`;
  };
  KD.lg = (x) => (x > 0 ? Math.log10(x) : -Infinity);
  KD.lgAdd = (a, b) => { if (a === -Infinity) return b; if (b === -Infinity) return a; const m = Math.max(a, b); return m + Math.log10(Math.pow(10, a - m) + Math.pow(10, b - m)); };
  const round = (x) => Math.round(x * 10) / 10;

  // 形容詞・の・隠喩・で・ように から、その言葉が帯びるタグ
  function effTags(an, ctx) {
    const fx = {};
    for (const t of an.T) if (t.k === 'w') fx[t.i] = [...t.w.tags];
    for (const n in an.mods) for (const m of an.mods[n]) { const w = an.T[m.i].w; if (w && fx[n]) fx[n].push(...w.tags); }
    const defs = (ctx.fight && ctx.fight.defs) || {};
    for (const t of an.T) if (t.k === 'w' && defs[t.w.id]) fx[t.i].push(...defs[t.w.id]);
    for (const p of an.preds) {
      if (!fx[p.i]) continue;
      for (const j of [...p.inst, ...p.like, ...p.advs]) if (an.T[j].w) fx[p.i].push(...an.T[j].w.tags);
    }
    for (const r of an.rhet) if (r.t === '隠喩' && fx[r.i] && an.T[r.j].w) fx[r.i].push(...an.T[r.j].w.tags);
    for (const k in fx) fx[k] = [...new Set(fx[k])];
    return fx;
  }

  /* an：解析結果、ctx：{ run, enemy, fight, season, roll, rand } */
  function score(an, ctx) {
    const run = ctx.run || { wear: {}, wl: {}, relics: [], cnt: {} };
    const relics = (run.relics || []).map((id) => KD.RELICS.find((r) => r.id === id)).filter(Boolean);
    const e = ctx.enemy, trick = e && e.trick && !(ctx.fight && ctx.fight.sealed) ? e.trick : null;
    const res = { ok: an.ok, steps: [], chips: 0, add: 0, mul: 1, lg: -Infinity, found: [], effects: [], cards: {} };
    if (!an.ok) return res;
    const fx = effTags(an, ctx);
    for (const t of an.T) if (t.k === 'w') t.fx = fx[t.i];
    const used = (ctx.fight && ctx.fight.used) || {};
    const weak = e ? (ctx.fight && ctx.fight.weak) || (Array.isArray(e.weak) ? e.weak : []) : [];
    const resist = e && Array.isArray(e.resist) ? e.resist : [];
    let small = 0;

    /* ---- 1. 言葉の力 ---- */
    for (const t of an.T) {
      if (t.k !== 'w') continue;
      const notes = [];
      let x = t.cat === 'OTO' ? 0 : t.w.pow;
      const f = KD.fade(run.wear[t.w.id]);
      if (f < 1 && x) { x *= f; notes.push('かすれ'); }
      if (t.cat === 'N' && an.mods[t.i]) for (const m of an.mods[t.i]) { const mw = an.T[m.i].w; if (mw && mw.m) { x *= mw.m; if (mw.m < 1) small++; notes.push(`${mw.s}×${mw.m}`); } }
      if (t.cat === 'V') { const p = an.preds.find((q) => q.i === t.i); if (p) for (const a of p.advs) if (an.T[a].w && an.T[a].w.am === 'amp') { x *= 1.5; notes.push(`${an.T[a].w.s}×1.5`); } }
      if (trick) {
        if (trick.id === 'ban_tag' && t.fx.includes(trick.tag)) { x = 0; notes.push('はじかれた'); }
        if (trick.id === 'long_half' && t.m >= trick.n) { x *= 0.5; notes.push('切り裂かれた'); }
        if (trick.id === 'min_pow' && t.w.pow < trick.n) { x = 0; notes.push('数えない'); }
        if (trick.id === 'dup_zero' && used[t.w.id]) { x = 0; notes.push('糸'); }
      }
      if (x && weak.some((w) => t.fx.includes(w))) { x *= 2; notes.push('苦手'); }
      if (x && resist.some((w) => t.fx.includes(w))) { x *= 0.5; notes.push('得意'); }
      if (x && ctx.season !== undefined && t.fx.includes(KD.SEASON[ctx.season])) { x += 3; notes.push('季節'); }
      if (x && ctx.rand && ctx.rand.row && ctx.rand.row.includes(head(t.w.y))) { x *= 2; notes.push('吉の行'); }
      for (const r of relics) if (r.card && x) { const o = r.card(t, ctx); if (o) { if (o.x) x *= o.x; if (o.a) x += o.a; notes.push(r.name); } }
      if (ctx.mod && ctx.mod.card) x = ctx.mod.card(t, x, notes) ?? x;
      x = Math.max(0, x);
      res.cards[t.i] = { v: round(x), notes };
      res.steps.push({ k: 'card', i: t.i, v: round(x), notes });
      res.chips += x;
    }

    /* ---- 2. 技 ---- */
    const rw = (ctx.rand && ctx.rand.wz) || {};
    const relW = (id) => relics.reduce((a, r) => a * ((r.wz && r.wz[id]) || 1), 1);
    for (const wz of KD.WAZA) {
      const d = wz.detect(an, ctx);
      if (!d) continue;
      res.found.push({ t: 'waza', id: wz.id, key: d.key });
      const lv = (run.wl && run.wl[wz.id]) || 0;
      if (d.over) { res.mul *= 0.8; res.steps.push({ k: 'waza', id: wz.id, name: '季重なり', mul: 0.8, hl: d.hl, note: d.note }); continue; }
      if (d.lost) { res.steps.push({ k: 'waza', id: wz.id, name: 'しりとり負け', add: 0, hl: d.hl, note: d.note }); continue; }
      let v = KD.wazaVal(wz, lv, d.n, an);
      const f = relW(wz.id) * (rw[wz.id] || 1);
      if (wz.kind === 'add') { v *= f; res.add += v; res.steps.push({ k: 'waza', id: wz.id, name: wz.name, add: round(v), hl: d.hl, note: d.note, rf: rw[wz.id] }); }
      else { v = 1 + (v - 1) * f; res.mul *= v; res.steps.push({ k: 'waza', id: wz.id, name: wz.name, mul: Math.round(v * 100) / 100, hl: d.hl, note: d.note, rf: rw[wz.id] }); }
    }
    if (small) { res.add += small; res.steps.push({ k: 'waza', id: 'small', name: '小さきもの', add: small }); }

    /* ---- 3. 気まぐれ（ランダム） ---- */
    if (ctx.rand) {
      const R = ctx.rand, ax = relics.reduce((a, r) => a * (r.aisho || 1), 1);
      for (const p of R.pairs || []) {
        const ta = an.T.filter((t) => t.fx && t.fx.includes(p.a)), tb = an.T.filter((t) => t.fx && t.fx.includes(p.b));
        if (!ta.length || !tb.length || (ta.length === 1 && tb.length === 1 && ta[0] === tb[0])) continue;
        const v = 1 + (p.x - 1) * ax;
        res.mul *= v; res.found.push({ t: 'pair', id: p.a + p.b });
        res.steps.push({ k: 'waza', id: 'aisho', name: `相性　${p.a}×${p.b}`, mul: Math.round(v * 100) / 100, hl: [...ta, ...tb].map((t) => t.i) });
      }
      if (R.moraN && an.mora === R.moraN) { const v = 1 + R.moraN / 6; res.mul *= v; res.found.push({ t: 'mora', id: R.moraN }); res.steps.push({ k: 'waza', id: 'moraN', name: `今宵の音数（${R.moraN}音）`, mul: Math.round(v * 100) / 100 }); }
    }

    /* ---- 4. 御守り ---- */
    for (const r of relics) {
      if (r.add) { const v = r.add(an, ctx); if (v) { res.add += v; res.steps.push({ k: 'relic', id: r.id, name: r.name, add: round(v) }); } }
      if (r.mul) { const v = r.mul(an, ctx); if (v && v !== 1) { res.mul *= v; res.steps.push({ k: 'relic', id: r.id, name: r.name, mul: v }); } }
    }
    if (ctx.fight && ctx.fight.bless > 1) { res.mul *= ctx.fight.bless; res.steps.push({ k: 'bless', name: '祈り', mul: Math.round(ctx.fight.bless * 100) / 100 }); }

    /* ---- 5. 物の怪の技 ---- */
    if (trick) {
      if (trick.id === 'min_mora' && an.mora < trick.n) { res.zero = trick.text; res.steps.push({ k: 'trick', name: e.name, text: `${an.mora}音。呑みこまれた`, zero: true }); }
      if ((trick.id === 'shift_kata' && !KD.form(an)) || (trick.id === 'kaibun_only' && !res.found.some((f) => f.id === 'kaibun'))) { res.mul *= 0.5; res.steps.push({ k: 'trick', name: e.name, text: trick.id === 'kaibun_only' ? '鏡に映って半分' : '型がない。半分', mul: 0.5 }); }
    }

    const lg = res.zero ? -Infinity : KD.lg(res.chips) + KD.lg(1 + res.add) + KD.lg(res.mul);
    res.lg = lg;
    res.add = round(res.add);
    res.chips = round(res.chips);
    res.effects = effects(an, ctx);
    return res;
  }

  /* ---------- 動詞の働き ----------
     「を」の言葉があればそれに、なければ「が」の言葉に効く。打ち消し（ない）だと働かない。
     何度も・また などがかかると、くり返す。 */
  function effects(an, ctx) {
    const out = [];
    for (const p of an.preds) {
      if (!p.verb || p.neg) continue;
      const v = an.T[p.i].w;
      if (!v.op || v.op === 'atk') continue;
      const rep = 1 + p.advs.filter((a) => an.T[a].w && an.T[a].w.am === 'rep').length;
      let tg = (p.obj.length ? p.obj : p.subj).filter((i) => an.T[i].k === 'w');
      const tags = [];
      if (v.op === 'dye') {
        for (const j of [...p.inst, ...p.targ, ...p.like]) if (an.T[j].w) tags.push(...an.T[j].w.tags);
        for (const a of p.advs) if (an.T[a].w && (an.T[a].cat === 'A' || an.T[a].cat === 'NA')) tags.push(...an.T[a].w.tags);
        tags.push(...v.tags);
        if (!p.obj.length && p.targ.length) tg = p.subj;
      }
      out.push({ op: v.op, verb: p.i, pow: v.pow, rep, targets: tg, tags: [...new Set(tags)] });
    }
    if (an.q) out.push({ op: 'call', verb: -1, pow: 0, rep: 1, targets: [], q: true });
    for (const r of an.rhet) if (r.t === '隠喩') out.push({ op: 'meta', a: r.i, b: r.j });
    return out;
  }

  Object.assign(KD, { score, effTags });
})(typeof window !== 'undefined' ? window : globalThis);
