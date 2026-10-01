/* ことだま短冊 — 文のしくみ
   並べた短冊と助詞から、文として通るかを調べ、だれが・何を・どうしたかを読みとる。
   AI は使わない。品詞のつながりと、言葉のタグ（性質）だけで決める。 */
(function (G) {
  'use strict';
  const KD = G.KD;
  const { verb, adj, voiced, count, SOLID, ANIM, opp } = KD;

  /* ---------- 助詞・助動詞の札（何枚でも使える） ---------- */
  const TILES = KD.TILES = {
    'が': { c: 'case' }, 'は': { c: 'case', ph: 'わ' }, 'を': { c: 'case', ph: 'お' }, 'に': { c: 'case' }, 'で': { c: 'case' },
    'と': { c: 'case' }, 'の': { c: 'case' }, 'も': { c: 'case' }, 'へ': { c: 'case', ph: 'え' }, 'や': { c: 'case' },
    'から': { c: 'case' }, 'まで': { c: 'case' }, 'より': { c: 'case' },
    'て': { c: 'conj' }, 'ば': { c: 'conj' },
    'ない': { c: 'aux' }, 'た': { c: 'aux' }, 'だ': { c: 'aux' }, 'ように': { c: 'aux' }, 'けり': { c: 'aux' },
    'よ': { c: 'end' }, 'ね': { c: 'end' }, 'か': { c: 'end' }, 'ぞ': { c: 'end' }, 'かな': { c: 'end' },
  };
  KD.PALETTE = [['が', 'は', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', 'や', 'から', 'まで', 'より'], ['て', 'ば', 'ない', 'た', 'だ', 'ように'], ['よ', 'ね', 'か', 'ぞ', 'かな', 'けり']];
  // 助詞が二つ重なってよい組み合わせ
  const DOUBLE = ['には', 'にも', 'では', 'でも', 'とは', 'とも', 'へは', 'へも', 'への', 'からは', 'からも', 'からの', 'までは', 'までも', 'までの', 'での', 'との', 'よりも', 'よりは', 'にの'.slice(0, 0)];
  const CASE_NEED = ['が', 'は', 'も', 'を', 'に', 'で', 'へ', 'から', 'まで', 'より'];
  const CAT = { n: 'N', num: 'N', v: 'V', a: 'A', na: 'NA', adv: 'ADV', rt: 'RT', cj: 'CJ', it: 'IT', oto: 'OTO' };
  const hasAny = (tags, list) => !!list && tags.some((t) => list.includes(t));
  const solid = (w) => hasAny(w.tags, SOLID);
  const anim = (w) => hasAny(w.tags, ANIM);

  /* items: [{k:'w', w:言葉}, {k:'p', p:'を'}] → 解析結果 */
  function analyze(items, ctx = {}) {
    const T = items.map((it, i) => it.k === 'p'
      ? { i, k: 'p', cat: 'P', p: it.p, c: (TILES[it.p] || {}).c || 'case', s: it.p, y: it.p }
      : { i, k: 'w', cat: CAT[it.w.pos] || 'N', w: it.w, s: it.w.s, y: it.w.y, uid: it.uid });
    const errs = [];
    const err = (i, msg) => { if (!errs.some((e) => e.i === i)) errs.push({ i, msg }); if (T[i]) T[i].bad = msg; };
    const real = T.filter((t) => t.cat !== 'OTO');
    const nx = (t) => { for (let j = t.i + 1; j < T.length; j++) if (T[j].cat !== 'OTO') return T[j]; return null; };
    const pv = (t) => { for (let j = t.i - 1; j >= 0; j--) if (T[j].cat !== 'OTO') return T[j]; return null; };
    const isP = (t, ...ps) => t && t.cat === 'P' && (!ps.length || ps.includes(t.p));
    const content = T.filter((t) => t.k === 'w' && t.cat !== 'OTO');

    /* ---- 1. 形を決める（活用） ---- */
    // 形容詞が「かかる先」を見る：形容詞・形容動詞をとばして、名詞なら連体、ほかは連用
    const toNoun = (t) => { let n = nx(t); while (n && (n.cat === 'A' || n.cat === 'NA')) n = nx(n); return !!n && n.cat === 'N'; };
    for (const t of T) {
      if (t.k !== 'w') continue;
      const n = nx(t), w = t.w;
      if (t.cat === 'V') {
        const f = isP(n, 'ない') ? 'nai' : isP(n, 'て') ? 'te' : isP(n, 'た') ? 'ta' : isP(n, 'ば') ? 'ba' : isP(n, 'けり') ? 'ren' : 'base';
        const r = verb(w, f); t.s = r.s; t.y = r.y; t.form = f;
        if ((f === 'te' || f === 'ta') && voiced(w)) n.s = n.y = f === 'te' ? 'で' : 'だ';
      } else if (t.cat === 'A') {
        let f = 'base';
        if (isP(n, 'ない')) f = 'nai'; else if (isP(n, 'て')) f = 'te'; else if (isP(n, 'た')) f = 'ta'; else if (isP(n, 'ば')) f = 'ba';
        else if (n && (n.cat === 'V' || n.cat === 'ADV')) f = 'ku';
        else if (n && (n.cat === 'A' || n.cat === 'NA') && !toNoun(t)) f = 'ku';
        const r = adj(w, f); t.s = r.s; t.y = r.y; t.form = f;
        if (f === 'ta') { n.s = n.y = 'った'; }
      } else if (t.cat === 'NA') {
        let suf = '', f = 'stem';
        if (n && n.cat === 'N') { suf = 'な'; f = 'att'; } else if (n && (n.cat === 'A' || n.cat === 'NA')) { if (toNoun(t)) { suf = 'な'; f = 'att'; } else { suf = 'に'; f = 'ku'; } } else if (n && (n.cat === 'V' || n.cat === 'ADV')) { suf = 'に'; f = 'ku'; } else if (isP(n, 'ない')) { n.s = n.y = 'でない'; } else if (isP(n, 'て')) { n.s = n.y = 'で'; } else if (isP(n, 'た')) { n.s = n.y = 'だった'; } else if (isP(n, 'ば')) { n.s = n.y = 'なら'; }
        t.s = w.s + suf; t.y = w.y + suf; t.form = f;
      }
    }
    for (const t of T) {
      if (t.cat !== 'P') continue;
      const n = nx(t);
      if (t.p === 'ない') { if (isP(n, 'て')) t.s = t.y = 'なく'; else if (isP(n, 'た')) { t.s = t.y = 'なか'; n.s = n.y = 'った'; } else if (isP(n, 'ば')) t.s = t.y = 'なけれ'; }
      if (t.p === 'だ' && isP(n, 'た')) { t.s = t.y = 'だっ'; }
      t.ph = (TILES[t.p] || {}).ph && t.s === t.p ? TILES[t.p].ph : t.y;
    }
    for (const t of T) { if (t.ph === undefined) t.ph = t.y; t.m = count(t.y); }

    /* ---- 2. つながりを調べる ---- */
    const clauses = []; let cl = { from: 0, toks: [] };
    let pend = [], advs = [], like = [], wo = null;
    const verbs = [], rhet = [], mods = {}, links = [];
    const addMod = (n, m, kind) => { (mods[n] = mods[n] || []).push({ i: m, kind }); };
    // 名詞で言い切ったときは「猫に小判」のような省略を認める（「を」だけは動詞がいる）
    const close = (at, tai) => {
      if (tai) pend = pend.filter((p) => { if (p.p === 'を' || p.implied) return true; T[p.i].ellip = true; return false; });
      for (const p of pend) err(p.i, p.implied ? `「${T[p.head].s}」を受ける言葉がない` : `「${T[p.i].p}」を受ける言葉がない`);
      for (const a of advs) err(a, `「${T[a].s}」がかかる先がない`);
      for (const l of like) err(l, '「ように」がかかる先がない');
      pend = []; advs = []; like = []; wo = null;
      cl.to = at; clauses.push(cl); cl = { from: at + 1, toks: [] };
    };
    // 述語が来たら、待っている助詞と副詞をひきとる。を は動詞だけがひきとれる
    const resolve = (t, isVerb) => {
      const keep = [];
      for (const p of pend) {
        if (p.p === 'を' && !isVerb) { keep.push(p); continue; }
        links.push({ pred: t.i, head: p.head, p: p.p, at: p.i });
        if (p.p === 'を') wo = null;
      }
      pend = keep;
      for (const a of advs) links.push({ pred: t.i, adv: a });
      advs = [];
      for (const l of like) links.push({ pred: t.i, like: l });
      like = [];
    };
    const headOf = (t) => { const p = pv(t); return p && p.cat === 'N' ? p.i : -1; };

    if (!content.length) err(-1, 'まだ言葉がない');
    const oto = T.filter((t) => t.cat === 'OTO').length;
    if (oto && oto > content.length) err(-1, '音ばかりで、意味がない');

    for (const t of real) {
      cl.toks.push(t.i);
      const n = nx(t), p = pv(t);
      if (ctx.ban && t.cat === 'P' && ctx.ban.includes(t.p)) err(t.i, ctx.banMsg || `「${t.p}」は使えない`);
      switch (t.cat) {
        case 'N': {
          if (n && (n.cat === 'N' || n.cat === 'RT')) err(t.i, `「${t.s}」と「${n.s}」のあいだに助詞がいる`);
          else if (n && (n.cat === 'V' || n.cat === 'A' || n.cat === 'NA' || n.cat === 'ADV')) { pend.push({ i: t.i, p: 'が', head: t.i, implied: true }); t.implied = true; }
          else if (!n || n.cat === 'CJ' || n.cat === 'IT') { t.tai = true; close(t.i, true); }
          break;
        }
        case 'V': {
          resolve(t, true);
          if (isP(n, 'ない', 'た', 'て', 'ば', 'けり', 'ように', 'から', 'まで', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな')) break;
          if (n && n.cat === 'N') { t.rel = true; break; }
          if (!n || n.cat === 'CJ' || n.cat === 'IT') { close(t.i); break; }
          err(n.i, `「${t.s}」のあとに「${n.s}」は続かない`);
          break;
        }
        case 'A': case 'NA': {
          if (t.form === 'ku') { advs.push(t.i); break; }
          if (t.form === 'att' || (t.cat === 'A' && t.form === 'base' && n && (n.cat === 'N' || ((n.cat === 'A' || n.cat === 'NA') && toNoun(t))))) {
            let h = n; while (h && h.cat !== 'N') h = nx(h);
            if (h) addMod(h.i, t.i, 'adj'); else err(t.i, `「${t.s}」がかかる名詞がない`);
            break;
          }
          resolve(t, false); t.pred = true;
          if (n && n.cat === 'P' && TILES[n.p] && TILES[n.p].c === 'case' && !['から', 'まで', 'と'].includes(n.p)) { err(n.i, `「${t.s}」のあとに「${n.p}」はつかない`); break; }
          if (!n || n.cat === 'CJ' || n.cat === 'IT') close(t.i);
          break;
        }
        case 'ADV': {
          if (isP(n, 'と')) { advs.push(t.i); break; }
          if (!n) { err(t.i, `「${t.s}」で終わっている`); break; }
          if (n.cat === 'CJ' || n.cat === 'P') { err(t.i, `「${t.s}」のあとに「${n.s}」は続かない`); break; }
          advs.push(t.i);
          break;
        }
        case 'RT': {
          let h = n; while (h && (h.cat === 'A' || h.cat === 'NA')) h = nx(h);
          if (!h || h.cat !== 'N') err(t.i, `「${t.s}」のあとには名詞が来る`); else addMod(h.i, t.i, 'rt');
          break;
        }
        case 'CJ': {
          if (cl.toks.length > 1) { err(t.i, '接続詞は、文と文のあいだに置く'); }
          if (!n) err(t.i, `「${t.s}」で終わっている`);
          cl.toks.pop(); clauses.push({ from: t.i, to: t.i, toks: [t.i], cj: true }); cl = { from: t.i + 1, toks: [] };
          break;
        }
        case 'IT': {
          if (cl.toks.length > 1) err(t.i, `「${t.s}」は、文のはじめに置く`);
          cl.toks.pop(); clauses.push({ from: t.i, to: t.i, toks: [t.i], it: true }); cl = { from: t.i + 1, toks: [] };
          break;
        }
        case 'P': {
          const c = t.c, P = t.p;
          if (!p) { err(t.i, `「${P}」で始まっている`); break; }
          if (c === 'case') {
            if (p.cat === 'N') {
              if (P === 'の') { if (!n || !(['N', 'A', 'NA', 'RT'].includes(n.cat) || isP(n, 'ように'))) { err(t.i, '「の」のあとに名詞がない'); break; } if (n.cat !== 'P') { let h = n; while (h && h.cat !== 'N') h = nx(h); if (h) addMod(h.i, p.i, 'no'); } break; }
              if (P === 'と' && n && (n.cat === 'N' || n.cat === 'RT' || n.cat === 'A' || n.cat === 'NA')) { t.coord = true; break; }
              if (P === 'や') { if (!n) err(t.i, '「や」で終わっている'); else if (n.cat === 'N' && !nx(n)) t.coord = true; else { t.kire = true; if (!t.coord) close(t.i); } break; }
              if (!n) { err(t.i, `「${P}」で終わっている`); break; }
              if (P === 'を') { if (wo !== null) { err(t.i, '「を」が二つある'); break; } wo = t.i; }
              pend.push({ i: t.i, p: P, head: p.i });
              break;
            }
            if (p.cat === 'P' && DOUBLE.includes(p.p + P)) {
              if (P === 'の') { const k = pend.findIndex((x) => x.i === p.i); if (k >= 0) pend.splice(k, 1); let h = n; while (h && h.cat !== 'N') h = nx(h); if (h) addMod(h.i, headOf(p), 'no'); else err(t.i, '「の」のあとに名詞がない'); }
              else if (!n) err(t.i, `「${P}」で終わっている`);
              break;
            }
            if (P === 'と' && p.cat === 'ADV') break;
            // 述語のあとの「から」「まで」「と」は、文と文をつなぐ
            if (['から', 'まで', 'と'].includes(P) && (p.cat === 'V' || p.pred || isP(p, 'ない', 'た', 'だ'))) {
              if (!n) { err(t.i, `「${P}」で終わっている`); break; }
              close(t.i); break;
            }
            err(t.i, `「${p.s}」のあとに「${P}」はつかない`);
            break;
          }
          if (c === 'end') {
            if (!(p.cat === 'V' || p.cat === 'N' || p.pred || p.cat === 'NA' || p.cat === 'A' || isP(p, 'ない', 'た', 'だ', 'けり'))) { err(t.i, `「${p.s}」のあとに「${P}」はつかない`); break; }
            if (p.cat === 'N') resolve(p, false);
            if (n && n.cat === 'P') { err(n.i, `「${P}」のあとに「${n.s}」は続かない`); break; }
            t.fin = true; close(t.i);
            break;
          }
          if (c === 'conj') {
            if (!(p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない'))) { err(t.i, `「${P}」は動詞や形容詞のあとにつく`); break; }
            if (p.cat === 'A' || p.cat === 'NA') { resolve(p, false); }
            if (!n) { err(t.i, `「${P}」で終わっている`); break; }
            close(t.i);
            break;
          }
          // aux
          if (P === 'ない') {
            if (!(p.cat === 'V' || p.cat === 'A' || p.cat === 'NA')) { err(t.i, `「${p.s}」に「ない」は直接つかない`); break; }
            if (p.cat !== 'V') resolve(p, false);
            p.neg = true; t.pred = true;
            if (n && n.cat === 'N') break;
            if (!n || n.cat === 'CJ' || n.cat === 'IT') { close(t.i); break; }
            if (!isP(n, 'て', 'た', 'ば', 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな')) err(n.i, `「ない」のあとに「${n.s}」は続かない`);
            break;
          }
          if (P === 'た') {
            if (!(p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない', 'だ'))) { err(t.i, `「${p.s}」に「た」は直接つかない`); break; }
            if (p.cat === 'A' || p.cat === 'NA') resolve(p, false);
            t.pred = true;
            if (n && n.cat === 'N') break;
            if (!n || n.cat === 'CJ' || n.cat === 'IT') { close(t.i); break; }
            if (!isP(n, 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな')) err(n.i, `「た」のあとに「${n.s}」は続かない`);
            break;
          }
          if (P === 'だ') {
            if (!(p.cat === 'N' || p.cat === 'NA')) { err(t.i, `「${p.s}」に「だ」は直接つかない`); break; }
            resolve(t, false); t.pred = true; t.copula = p.i;
            if (!n || n.cat === 'CJ' || n.cat === 'IT') { close(t.i); break; }
            if (!isP(n, 'た', 'から', 'と', 'よ', 'ね', 'か', 'ぞ')) err(n.i, `「だ」のあとに「${n.s}」は続かない`);
            break;
          }
          if (P === 'ように') {
            const ok = isP(p, 'の') || p.cat === 'V' || isP(p, 'た', 'ない');
            if (!ok) { err(t.i, '「ように」は「の」か動詞のあとにつく'); break; }
            if (!n || n.cat === 'P' || n.cat === 'CJ') { err(t.i, '「ように」がかかる先がない'); break; }
            like.push(t.i);
            if (isP(p, 'の')) { const k = pend.findIndex((x) => x.i === p.i); if (k >= 0) pend.splice(k, 1); }
            break;
          }
          if (P === 'けり') {
            if (p.cat !== 'V') { err(t.i, '「けり」は動詞のあとにつく'); break; }
            t.pred = true; t.kire = true;
            if (!n || n.cat === 'CJ' || n.cat === 'IT') { close(t.i); break; }
            if (!isP(n, 'かな', 'よ')) err(n.i, `「けり」のあとに「${n.s}」は続かない`);
            break;
          }
          break;
        }
        default: break;
      }
    }
    if (cl.toks.length) close(T.length - 1);

    /* ---- 3. だれが・何を（述語ごとの役わり） ---- */
    const preds = {};
    const P = (i) => (preds[i] = preds[i] || { i, subj: [], obj: [], inst: [], targ: [], src: [], with: [], cmp: [], advs: [], like: [] });
    const ROLE = { 'が': 'subj', 'は': 'subj', 'も': 'subj', 'を': 'obj', 'で': 'inst', 'に': 'targ', 'へ': 'targ', 'から': 'src', 'まで': 'targ', 'と': 'with', 'より': 'cmp' };
    // 「AとBを」の A も同じ役わりにする
    const coordOf = (h) => { const out = [h]; let q = pv(T[h]); while (q && q.cat === 'P' && q.coord) { const a = pv(q); if (!a || a.cat !== 'N') break; out.push(a.i); q = pv(a); } return out; };
    for (const l of links) {
      const r = P(l.pred);
      if (l.adv !== undefined) { r.advs.push(l.adv); continue; }
      if (l.like !== undefined) { const lp = pv(T[l.like]); if (lp && isP(lp, 'の')) { const h = pv(lp); if (h) r.like.push(h.i); } else if (lp) r.like.push(lp.i); continue; }
      const role = ROLE[l.p] || 'subj';
      for (const h of coordOf(l.head)) r[role].push(h);
    }
    for (const t of T) if (t.cat === 'V') { const r = P(t.i); r.verb = true; r.neg = !!t.neg; }

    /* ---- 4. 意味を調べる（ちぐはぐ・たとえ） ---- */
    const W = (i) => T[i].w;
    for (const k in preds) {
      const r = preds[k], t = T[r.i];
      if (t.cat === 'V') {
        const v = t.w;
        for (const o of r.obj) {
          const n = W(o);
          if (v.vi && !v.mo) { err(o, `「${v.s}」は「を」をとらない`); continue; }
          if (v.vi && v.mo) { if (solid(n) && !hasAny(n.tags, ['所', '道', '水'])) err(o, `「${n.s}を ${v.s}」は、意味がとおらない`); continue; }
          if (v.o && !hasAny(n.tags, v.o)) { if (solid(n)) err(o, `「${n.s}を ${v.s}」は、意味がとおらない`); else rhet.push({ t: '比喩', i: o, j: r.i }); }
        }
        for (const s of r.subj) {
          const n = W(s);
          if (v.sb === 'anim') { if (!anim(n)) rhet.push({ t: '擬人法', i: s, j: r.i }); }
          else if (Array.isArray(v.sb) && !hasAny(n.tags, v.sb)) { if (solid(n) || anim(n)) err(s, `「${n.s}が ${v.s}」は、意味がとおらない`); else rhet.push({ t: '比喩', i: s, j: r.i }); }
        }
      } else if (t.cat === 'A' || t.cat === 'NA') {
        for (const s of r.subj) if (opp(t.w.tags, W(s).tags)) rhet.push({ t: '撞着語法', i: s, j: r.i });
      } else if (t.cat === 'P' && t.copula !== undefined) {
        const b = T[t.copula];
        for (const s of r.subj) {
          if (b.cat !== 'N') { if (opp(b.w.tags, W(s).tags)) rhet.push({ t: '撞着語法', i: s, j: b.i }); continue; }
          if (W(s).id === b.w.id) rhet.push({ t: 'くりかえし', i: s, j: b.i });
          else rhet.push({ t: '隠喩', i: s, j: b.i });
        }
      }
      for (const h of r.like) rhet.push({ t: '直喩', i: h, j: r.i });
    }
    // 形容詞が名詞とぶつかる（熱い雪）
    for (const n in mods) for (const m of mods[n]) if (m.kind === 'adj' && T[m.i].w && opp(T[m.i].w.tags, W(+n).tags)) rhet.push({ t: '撞着語法', i: m.i, j: +n });

    errs.sort((a, b) => a.i - b.i);
    const last = real[real.length - 1];
    return {
      T, ok: !errs.length, errs, clauses: clauses.filter((c) => c.toks.length), preds: Object.values(preds), mods, rhet,
      mora: T.reduce((a, t) => a + t.m, 0), content, oto,
      tai: !!(last && last.cat === 'N'), q: !!(last && isP(last, 'か')), kire: T.filter((t) => t.kire || isP(t, 'かな')).map((t) => t.i),
    };
  }

  Object.assign(KD, { analyze, hasAny, solid, anim });
})(typeof window !== 'undefined' ? window : globalThis);
