/* ことだま短冊 — 文のしくみ
   並べた短冊と助詞から、文として通るかを調べ、だれが・何を・どうしたかを読みとる。
   AI は使わない。品詞のつながりと、言葉のタグ（性質）だけで決める。
   「、」と改行（↵）は、文をいったん区切ってよい場所（体言止めや言い切りのあとに、次の文を始められる）。 */
(function (G) {
  'use strict';
  const KD = G.KD;
  const { verb, adj, voiced, count, SOLID, ANIM, opp } = KD;

  /* ---------- 札（何枚でも使える） ----------
     case 格助詞 / conj つなぐ / aux 助動詞 / end 終わり / soft 区切り / fv 自由に使える動詞 */
  const T_ = (c, o) => Object.assign({ c }, o || {});
  const TILES = KD.TILES = {
    'が': T_('case'), 'は': T_('case', { ph: 'わ' }), 'を': T_('case', { ph: 'お' }), 'に': T_('case'), 'で': T_('case'), 'と': T_('case'), 'の': T_('case'),
    'も': T_('case'), 'へ': T_('case', { ph: 'え' }), 'や': T_('case'), 'から': T_('case'), 'まで': T_('case'), 'より': T_('case'), 'だけ': T_('case'),
    'て': T_('conj'), 'ば': T_('conj'), 'たら': T_('conj'), 'ながら': T_('conj'), 'ので': T_('conj'), 'けど': T_('conj'),
    'ない': T_('aux'), 'た': T_('aux'), 'だ': T_('aux'), 'ように': T_('aux'), 'けり': T_('aux'), 'たい': T_('aux'), 'う': T_('aux'), '命令': T_('aux'), 'だろう': T_('aux'),
    'よ': T_('end'), 'ね': T_('end'), 'か': T_('end'), 'ぞ': T_('end'), 'かな': T_('end'),
    '、': T_('soft'), '↵': T_('soft'),
    'いる': T_('fv'), 'ある': T_('fv'), 'する': T_('fv'), 'なる': T_('fv'),
  };
  // 自由に使える動詞（力は0。文をつなぐための言葉）
  const FV = {
    'いる': { id: 'fv:いる', s: 'いる', y: 'いる', pos: 'v', vt: '1', pow: 0, tags: [], vi: 1, free: 1 },
    'ある': { id: 'fv:ある', s: 'ある', y: 'ある', pos: 'v', vt: '5', pow: 0, tags: [], vi: 1, free: 1, aru: 1 },
    'する': { id: 'fv:する', s: 'する', y: 'する', pos: 'v', vt: 's', pow: 0, tags: [], free: 1 },
    'なる': { id: 'fv:なる', s: 'なる', y: 'なる', pos: 'v', vt: '5', pow: 0, tags: [], vi: 1, free: 1 },
  };
  KD.FV = FV;
  KD.PALETTE = [
    ['が', 'は', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', 'や', 'から', 'まで', 'より', 'だけ'],
    ['、', 'て', 'た', 'ない', 'たい', 'う', '命令', 'ば', 'たら', 'ながら', 'ので', 'けど', 'だ', 'だろう', 'ように', 'いる', 'ある', 'する', 'なる', 'けり', 'よ', 'ね', 'か', 'ぞ', 'かな'],
  ];
  // 助詞が二つ重なってよい組み合わせ
  const DOUBLE = ['には', 'にも', 'では', 'でも', 'とは', 'とも', 'へは', 'へも', 'への', 'へと', 'からは', 'からも', 'からの', 'までは', 'までも', 'までの', 'までに', 'での', 'との', 'よりも', 'よりは'];
  const CAT = { n: 'N', num: 'N', v: 'V', a: 'A', na: 'NA', adv: 'ADV', rt: 'RT', cj: 'CJ', it: 'IT', oto: 'OTO' };
  const SKIP = ['OTO', 'BR', 'CM'];
  const hasAny = (tags, list) => !!list && tags.some((t) => list.includes(t));
  const solid = (w) => hasAny(w.tags, SOLID);
  const anim = (w) => hasAny(w.tags, ANIM);

  /* items: [{k:'w', w:言葉}, {k:'p', p:'を'}] → 解析結果 */
  function analyze(items, ctx = {}) {
    const T = items.map((it, i) => {
      if (it.k !== 'p') return { i, k: 'w', cat: CAT[it.w.pos] || 'N', w: it.w, s: it.w.s, y: it.w.y, uid: it.uid };
      const d = TILES[it.p] || { c: 'case' };
      if (d.c === 'fv') return { i, k: 'f', cat: 'V', p: it.p, w: FV[it.p], s: it.p, y: it.p };
      if (d.c === 'soft') return { i, k: 'p', cat: it.p === '↵' ? 'BR' : 'CM', p: it.p, c: 'soft', s: it.p === '↵' ? '' : '、', y: '' };
      return { i, k: 'p', cat: 'P', p: it.p, c: d.c, s: it.p, y: it.p };
    });
    const errs = [];
    const err = (i, msg) => { if (!errs.some((e) => e.i === i)) errs.push({ i, msg }); if (T[i]) T[i].bad = msg; };
    const real = T.filter((t) => !SKIP.includes(t.cat));
    const nx = (t) => { if (!t) return null; for (let j = t.i + 1; j < T.length; j++) if (!SKIP.includes(T[j].cat)) return T[j]; return null; };
    const pv = (t) => { if (!t) return null; for (let j = t.i - 1; j >= 0; j--) if (!SKIP.includes(T[j].cat)) return T[j]; return null; };
    const soft = (a, b) => { if (!a || !b) return false; for (let j = a.i + 1; j < b.i; j++) if (T[j].cat === 'BR' || T[j].cat === 'CM') return true; return false; };
    const isP = (t, ...ps) => !!t && t.cat === 'P' && (!ps.length || ps.includes(t.p));
    const isCase = (t) => !!t && t.cat === 'P' && t.c === 'case';
    const content = T.filter((t) => t.k === 'w' && t.cat !== 'OTO');

    /* ---- 1. 形を決める（活用） ---- */
    const toNoun = (t) => { let n = nx(t); while (n && (n.cat === 'A' || n.cat === 'NA')) n = nx(n); return !!n && n.cat === 'N'; };
    const set = (t, s, y) => { t.s = s; t.y = y === undefined ? s : y; };
    for (const t of T) {
      if (t.cat !== 'V' && t.cat !== 'A' && t.cat !== 'NA' && t.cat !== 'N') continue;
      const n = nx(t), w = t.w;
      if (t.cat === 'V') {
        let f = 'base';
        if (isP(n, 'ない')) f = 'nai'; else if (isP(n, 'て')) f = 'te'; else if (isP(n, 'た', 'たら')) f = 'ta'; else if (isP(n, 'ば')) f = 'ba';
        else if (isP(n, 'けり', 'たい', 'ながら')) f = 'ren'; else if (isP(n, 'う')) f = 'vol'; else if (isP(n, '命令')) f = 'imp';
        else if (isP(n, 'に') && nx(n) && nx(n).cat === 'V') f = 'ren';
        const r = verb(w, f); set(t, r.s, r.y); t.form = f;
        if (w.aru && f === 'nai') set(t, '', '');
        if (f === 'te' || f === 'ta') { const v = voiced(w); if (n.p === 'て') set(n, v ? 'で' : 'て'); if (n.p === 'た') set(n, v ? 'だ' : 'た'); if (n.p === 'たら') set(n, v ? 'だら' : 'たら'); }
        if (f === 'vol') set(n, w.vt === '5' ? 'う' : 'よう');
        if (f === 'imp') set(n, '！', '');
      } else if (t.cat === 'A') {
        let f = 'base';
        if (isP(n, 'ない')) f = 'nai'; else if (isP(n, 'て')) f = 'te'; else if (isP(n, 'た', 'たら')) f = 'ta'; else if (isP(n, 'ば')) f = 'ba';
        else if (n && (n.cat === 'V' || n.cat === 'ADV')) f = 'ku';
        else if (n && (n.cat === 'A' || n.cat === 'NA') && !toNoun(t)) f = 'ku';
        const r = adj(w, f); set(t, r.s, r.y); t.form = f;
        if (f === 'ta') set(n, n.p === 'たら' ? 'ったら' : 'った');
      } else if (t.cat === 'NA') {
        let suf = '', f = 'stem';
        if (n && n.cat === 'N') { suf = 'な'; f = 'att'; }
        else if (n && (n.cat === 'A' || n.cat === 'NA')) { if (toNoun(t)) { suf = 'な'; f = 'att'; } else { suf = 'に'; f = 'ku'; } }
        else if (n && (n.cat === 'V' || n.cat === 'ADV')) { suf = 'に'; f = 'ku'; }
        else if (isP(n, 'の', 'ので')) suf = 'な';
        else if (isP(n, 'ない')) set(n, 'でない'); else if (isP(n, 'て')) set(n, 'で'); else if (isP(n, 'た')) set(n, 'だった'); else if (isP(n, 'たら')) set(n, 'だったら');
        else if (isP(n, 'ば')) set(n, 'なら'); else if (isP(n, 'けど')) set(n, 'だけど');
        set(t, w.s + suf, w.y + suf); t.form = f;
      } else if (t.cat === 'N') {
        if (isP(n, 'ので')) set(n, 'なので');
      }
    }
    // 形容詞のようにかわる助動詞（ない・たい）と、だ
    for (const t of T) {
      if (t.cat !== 'P') continue;
      const n = nx(t);
      if (t.p === 'ない' || t.p === 'たい') {
        const st = t.p === 'ない' ? 'な' : 'た';
        if (isP(n, 'て')) set(t, st + 'く'); else if (isP(n, 'た', 'たら')) { set(t, st + 'か'); set(n, n.p === 'たら' ? 'ったら' : 'った'); } else if (isP(n, 'ば')) set(t, st + 'けれ');
      }
      if (t.p === 'だ' && isP(n, 'た', 'たら')) { set(t, 'だっ'); set(n, n.p === 'たら' ? 'たら' : 'た'); }
    }
    for (const t of T) { t.ph = (TILES[t.p] && TILES[t.p].ph && t.s === t.p) ? TILES[t.p].ph : t.y; t.m = count(t.y); }

    /* ---- 2. つながりを調べる ---- */
    const clauses = []; let cl = { from: 0, toks: [] };
    let pend = [], advs = [], like = [], wo = null;
    const rhet = [], mods = {}, links = [];
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
    // 述語が来たら、待っている助詞と副詞をひきとる。「を」は動詞だけがひきとれる
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
    const takeAdvs = (t) => { for (const a of advs) links.push({ pred: t.i, adv: a }); advs = []; };
    // 助詞の「受け手」の名詞（「雪だけが」なら雪、「咲くのを」なら の）
    const headOf = (t) => { let p = pv(t); while (p && isP(p, 'だけ')) p = pv(p); return p && (p.cat === 'N' || p.nomi) ? p.i : -1; };
    const nounish = (p) => !!p && (p.cat === 'N' || p.nomi);
    const predish = (p) => !!p && (p.cat === 'V' || p.pred || (p.cat === 'A' && p.form !== 'ku') || (p.cat === 'NA' && p.form === 'stem'));
    const ENDOK = (n) => !n || n.cat === 'CJ' || n.cat === 'IT';
    // 次の名詞にかかる形容詞（連体詞）か
    const attr = (a) => a.cat === 'RT' || (a.cat === 'NA' && a.form === 'att') || (a.cat === 'A' && a.form === 'base' && !!nx(a) && (nx(a).cat === 'N' || ((nx(a).cat === 'A' || nx(a).cat === 'NA') && toNoun(a))));

    if (!content.length) err(-1, 'まだ言葉がない');
    const oto = T.filter((t) => t.cat === 'OTO').length;
    if (oto && oto > content.length) err(-1, '音ばかりで、意味がない');

    for (const t of real) {
      cl.toks.push(t.i);
      const n = nx(t), p = pv(t), sN = soft(t, n);
      if (ctx.ban && t.cat === 'P' && ctx.ban.includes(t.p)) err(t.i, ctx.banMsg || `「${t.p}」は使えない`);
      switch (t.cat) {
        case 'N': {
          // 時の言葉は、助詞なしで副詞のように使える（今 花が咲く／夜 星が光る）
          if (t.w.tags.includes('時') && n && ['N', 'RT', 'A', 'NA', 'ADV', 'V'].includes(n.cat) && !sN) { t.advn = true; break; }
          if (n && (n.cat === 'N' || n.cat === 'RT')) { if (sN) { t.tai = true; close(t.i, true); } else err(t.i, `「${t.s}」と「${n.s}」のあいだに助詞がいる（「、」や改行で区切るのでもよい）`); }
          // 「白い雪 赤い花」：名詞のあとに、次の名詞にかかる形容詞が来たら、そこで区切る
          else if (n && attr(n)) { t.tai = true; close(t.i, true); }
          else if (n && (n.cat === 'V' || n.cat === 'A' || n.cat === 'NA' || n.cat === 'ADV')) { pend.push({ i: t.i, p: 'が', head: t.i, implied: true }); t.implied = true; }
          else if (ENDOK(n)) { t.tai = true; close(t.i, true); }
          break;
        }
        case 'V': {
          resolve(t, true);
          if (isP(n, 'ない', 'た', 'て', 'たら', 'ば', 'けり', 'ように', 'から', 'まで', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな', 'たい', 'う', '命令', 'ながら', 'ので', 'けど', 'だろう', 'の')) break;
          if (isP(n, 'に') && nx(n) && nx(n).cat === 'V') break;
          // 「散るを待つ」：言い切りの形のまま名詞のように使う（古い言い方・うたでよく使う）
          if (isP(n, 'を', 'が', 'は', 'も') && t.form === 'base' && !t.w.free) { t.nomi = true; break; }
          if (n && n.cat === 'N' && !sN) { t.rel = true; break; }
          if (ENDOK(n) || sN) { close(t.i); break; }
          err(n.i, `「${t.s}」のあとに「${n.s}」は続かない`);
          break;
        }
        case 'A': case 'NA': {
          if (t.form === 'ku') { advs.push(t.i); break; }
          if (t.form === 'att' || (t.cat === 'A' && t.form === 'base' && n && !sN && (n.cat === 'N' || ((n.cat === 'A' || n.cat === 'NA') && toNoun(t))))) {
            let h = n; while (h && h.cat !== 'N') h = nx(h);
            if (h) { addMod(h.i, t.i, 'adj'); takeAdvs(t); } else err(t.i, `「${t.s}」がかかる名詞がない`);
            break;
          }
          resolve(t, false); t.pred = true;
          if (isP(n, 'から', 'まで', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな', 'ない', 'た', 'たら', 'て', 'ば', 'ので', 'けど', 'だろう', 'の', 'だ')) break;
          if (t.cat === 'NA' && isP(n, 'で')) break;
          if (ENDOK(n) || sN) { close(t.i); break; }
          err(n.i, `「${t.s}」のあとに「${n.s}」は続かない`);
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
          if (!h || h.cat !== 'N') err(t.i, `「${t.s}」のあとには名詞が来る`); else { addMod(h.i, t.i, 'rt'); takeAdvs(t); }
          break;
        }
        case 'CJ': {
          if (cl.toks.length > 1) err(t.i, '接続詞は、文と文のあいだに置く');
          if (!n) err(t.i, `「${t.s}」で終わっている`);
          cl.toks.pop(); clauses.push({ from: t.i, to: t.i, toks: [t.i], cj: true }); cl = { from: t.i + 1, toks: [] };
          break;
        }
        case 'IT': {
          if (cl.toks.length > 1) err(t.i, `「${t.s}」は、文のはじめに置く`);
          cl.toks.pop(); clauses.push({ from: t.i, to: t.i, toks: [t.i], it: true }); cl = { from: t.i + 1, toks: [] };
          break;
        }
        case 'P': particle(t, p, n, sN); break;
        default: break;
      }
    }
    function particle(t, p, n, sN) {
      const c = t.c, P = t.p;
      if (!p) { err(t.i, `「${t.s}」で始まっている`); return; }
      if (c === 'case') {
        // 述語のあとの「の」は「〜こと」（咲くのを待つ）
        if (P === 'の' && (predish(p) || isP(p, 'ない', 'た', 'たい'))) {
          if (p.cat === 'A' || p.cat === 'NA') resolve(p, false);
          t.nomi = true;
          if (!n || isCase(n) || isP(n, 'だ', 'か', 'よ', 'ね', 'かな')) return;
          err(t.i, '「の」のあとに助詞がいる'); return;
        }
        if (nounish(p)) {
          if (P === 'の') {
            if (n && ['N', 'A', 'NA', 'RT'].includes(n.cat)) { let h = n; while (h && h.cat !== 'N') h = nx(h); if (h && p.cat === 'N') addMod(h.i, p.i, 'no'); return; }
            if (isP(n, 'ように')) return;
            // 「雪の降る夜」「火のない所」：の が「が」のかわり
            if (n && (n.cat === 'V' || isP(n, 'ない'))) { pend.push({ i: t.i, p: 'が', head: headOf(t) }); return; }
            err(t.i, '「の」のあとに名詞がない'); return;
          }
          if (P === 'だけ') {
            t.nomi = true;
            if (!n || ENDOK(n)) { close(t.i, true); return; }
            if (isCase(n) || isP(n, 'だ', 'か', 'よ', 'ね', 'かな')) return;
            if (['V', 'A', 'NA', 'ADV'].includes(n.cat)) { pend.push({ i: t.i, p: 'が', head: headOf(t), implied: true }); return; }
            err(n.i, `「だけ」のあとに「${n.s}」は続かない`); return;
          }
          if (P === 'と' && n && (n.cat === 'N' || n.cat === 'RT' || n.cat === 'A' || n.cat === 'NA')) { t.coord = true; return; }
          if (P === 'や') { if (!n) err(t.i, '「や」で終わっている'); else if (n.cat === 'N' && !nx(n)) t.coord = true; else { t.kire = true; close(t.i); } return; }
          if (!n) { err(t.i, `「${P}」で終わっている`); return; }
          if (P === 'を') { if (wo !== null) { err(t.i, '「を」が二つある'); return; } wo = t.i; }
          pend.push({ i: t.i, p: P, head: headOf(t) });
          return;
        }
        if (p.cat === 'P' && DOUBLE.includes(p.p + P)) {
          if (P === 'の') { const k = pend.findIndex((x) => x.i === p.i); if (k >= 0) pend.splice(k, 1); let h = n; while (h && h.cat !== 'N') h = nx(h); const hd = headOf(p); if (h && hd >= 0 && T[hd].w) addMod(h.i, hd, 'no'); else if (!h) err(t.i, '「の」のあとに名詞がない'); }
          else if (!n) err(t.i, `「${P}」で終わっている`);
          return;
        }
        if (P === 'と' && p.cat === 'ADV') return;
        if (P === 'に' && p.cat === 'V') return; // 見に行く
        if (P === 'で' && p.cat === 'NA') { if (!n) { err(t.i, '「で」で終わっている'); return; } close(t.i); return; }
        // 述語のあとの「から」「まで」「と」は、文と文をつなぐ
        if (['から', 'まで', 'と'].includes(P) && (predish(p) || isP(p, 'ない', 'た', 'だ', 'たい', 'う', 'だろう'))) {
          if (!n) { err(t.i, `「${P}」で終わっている`); return; }
          close(t.i); return;
        }
        err(t.i, `「${p.s || p.p}」のあとに「${P}」はつかない`);
        return;
      }
      if (c === 'end') {
        if (!(predish(p) || nounish(p) || p.cat === 'NA' || p.cat === 'A' || isP(p, 'ない', 'た', 'だ', 'けり', 'たい', 'う', '命令', 'だろう'))) { err(t.i, `「${p.s}」のあとに「${P}」はつかない`); return; }
        if (n && n.cat === 'P') { err(n.i, `「${P}」のあとに「${n.s}」は続かない`); return; }
        t.fin = true; close(t.i, nounish(p));
        return;
      }
      if (c === 'conj') {
        const okPrev = {
          'て': p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない', 'たい'),
          'ば': p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない', 'たい'),
          'たら': p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない', 'たい', 'だ'),
          'ながら': p.cat === 'V',
          'ので': predish(p) || p.cat === 'NA' || nounish(p) || isP(p, 'ない', 'た', 'たい'),
          'けど': predish(p) || p.cat === 'NA' || isP(p, 'ない', 'た', 'たい', 'だ', 'う', 'だろう'),
        }[P];
        if (!okPrev) { err(t.i, P === 'けど' && nounish(p) ? '名詞のあとは「だけど」（「だ」を入れる）' : `「${p.s || p.p}」のあとに「${P}」はつかない`); return; }
        if (p.cat === 'A' || p.cat === 'NA') resolve(p, false);
        if (P === 'ので' && nounish(p)) resolve(t, false);
        if (!n) { err(t.i, `「${t.s}」で終わっている`); return; }
        close(t.i);
        return;
      }
      if (c === 'aux') {
        const after = (list) => { if (n && n.cat === 'N' && list.includes('N') && !sN) return; if (ENDOK(n) || sN) { close(t.i); return; } if (!isP(n, ...list)) err(n.i, `「${t.s || P}」のあとに「${n.s}」は続かない`); };
        if (P === 'ない') {
          if (p.cat === 'V' || p.cat === 'A' || p.cat === 'NA') { if (p.cat !== 'V') resolve(p, false); p.neg = true; }
          else if (isCase(p) && ['が', 'は', 'も', 'の', 'に', 'で', 'と'].includes(p.p) || isP(p, 'だけ')) { resolve(t, false); t.exist = true; }
          else { err(t.i, `「${p.s}」に「ない」は直接つかない`); return; }
          t.pred = true; after(['N', 'て', 'た', 'たら', 'ば', 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな', 'ので', 'けど', 'だろう', 'の']); return;
        }
        if (P === 'た') {
          if (!(p.cat === 'V' || p.cat === 'A' || p.cat === 'NA' || isP(p, 'ない', 'だ', 'たい'))) { err(t.i, `「${p.s}」に「た」は直接つかない`); return; }
          if (p.cat === 'A' || p.cat === 'NA') resolve(p, false);
          t.pred = true; after(['N', 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな', 'ので', 'けど', 'だろう', 'の']); return;
        }
        if (P === 'だ') {
          if (!(nounish(p) || p.cat === 'NA')) { err(t.i, `「${p.s || p.p}」に「だ」は直接つかない`); return; }
          resolve(t, false); t.pred = true; t.copula = p.nomi ? -1 : p.i;
          after(['た', 'たら', 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'けど']); return;
        }
        if (P === 'たい') {
          if (p.cat !== 'V') { err(t.i, '「たい」は動詞のあとにつく'); return; }
          t.pred = true; after(['N', 'ない', 'て', 'た', 'たら', 'ば', 'から', 'と', 'よ', 'ね', 'か', 'ぞ', 'かな', 'ので', 'けど', 'の', 'だろう']); return;
        }
        if (P === 'う') { if (p.cat !== 'V') { err(t.i, '「う（よう）」は動詞のあとにつく'); return; } t.pred = true; after(['と', 'か', 'よ', 'ね', 'ぞ', 'けど']); return; }
        if (P === '命令') { if (p.cat !== 'V') { err(t.i, '命令の形にできるのは動詞だけ'); return; } t.pred = true; after(['よ']); return; }
        if (P === 'だろう') {
          if (!(predish(p) || nounish(p) || p.cat === 'NA' || isP(p, 'ない', 'た', 'たい'))) { err(t.i, `「${p.s}」に「だろう」はつかない`); return; }
          resolve(t, false); t.pred = true; after(['か', 'よ', 'ね', 'ぞ', 'と', 'けど']); return;
        }
        if (P === 'ように') {
          if (!(isP(p, 'の') || p.cat === 'V' || isP(p, 'た', 'ない'))) { err(t.i, '「ように」は「の」か動詞のあとにつく'); return; }
          if (!n || n.cat === 'P' || n.cat === 'CJ') { err(t.i, '「ように」がかかる先がない'); return; }
          like.push(t.i);
          if (isP(p, 'の')) { const k = pend.findIndex((x) => x.i === p.i); if (k >= 0) pend.splice(k, 1); }
          return;
        }
        if (P === 'けり') { if (p.cat !== 'V') { err(t.i, '「けり」は動詞のあとにつく'); return; } t.pred = true; t.kire = true; after(['かな', 'よ']); return; }
      }
    }
    if (cl.toks.length) close(T.length - 1, real.length && real[real.length - 1].cat === 'N');

    /* ---- 3. だれが・何を（述語ごとの役わり） ---- */
    const preds = {};
    const PR = (i) => (preds[i] = preds[i] || { i, subj: [], obj: [], inst: [], targ: [], src: [], with: [], cmp: [], advs: [], like: [] });
    const ROLE = { 'が': 'subj', 'は': 'subj', 'も': 'subj', 'を': 'obj', 'で': 'inst', 'に': 'targ', 'へ': 'targ', 'から': 'src', 'まで': 'targ', 'と': 'with', 'より': 'cmp', 'の': 'subj', 'だけ': 'subj' };
    // 「AとBを」の A も同じ役わりにする
    const coordOf = (h) => { const out = [h]; let q = pv(T[h]); while (q && q.cat === 'P' && q.coord) { const a = pv(q); if (!a || a.cat !== 'N') break; out.push(a.i); q = pv(a); } return out; };
    for (const l of links) {
      const r = PR(l.pred);
      if (l.adv !== undefined) { r.advs.push(l.adv); continue; }
      if (l.like !== undefined) { const lp = pv(T[l.like]); if (lp && isP(lp, 'の')) { const h = pv(lp); if (h) r.like.push(h.i); } else if (lp) r.like.push(lp.i); continue; }
      if (l.head < 0 || !T[l.head].w) continue;
      const role = ROLE[l.p] || 'subj';
      for (const h of coordOf(l.head)) r[role].push(h);
    }
    for (const t of T) if (t.cat === 'V') { const r = PR(t.i); r.verb = true; r.neg = !!t.neg; }

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
      } else if (t.cat === 'P' && t.copula !== undefined && t.copula >= 0) {
        const b = T[t.copula];
        for (const s of r.subj) {
          if (b.cat !== 'N') { if (opp(b.w.tags, W(s).tags)) rhet.push({ t: '撞着語法', i: s, j: b.i }); continue; }
          if (s === b.i) continue;
          if (W(s).id === b.w.id) rhet.push({ t: 'くりかえし', i: s, j: b.i });
          else rhet.push({ t: '隠喩', i: s, j: b.i });
        }
      }
      for (const h of r.like) if (T[h].w) rhet.push({ t: '直喩', i: h, j: r.i });
    }
    // 形容詞が名詞とぶつかる（熱い雪）
    for (const n in mods) for (const m of mods[n]) if (m.kind === 'adj' && T[m.i].w && opp(T[m.i].w.tags, W(+n).tags)) rhet.push({ t: '撞着語法', i: m.i, j: +n });

    /* ---- 5. 改行（句） ---- */
    let lines = null;
    if (T.some((t) => t.cat === 'BR')) {
      lines = []; let from = 0;
      for (let j = 0; j <= T.length; j++) {
        if (j === T.length || T[j].cat === 'BR') {
          const seg = T.slice(from, j);
          if (seg.some((x) => x.cat !== 'BR' && x.cat !== 'CM')) lines.push({ from, to: j - 1, m: seg.reduce((a, x) => a + x.m, 0) });
          from = j + 1;
        }
      }
    }

    errs.sort((a, b) => a.i - b.i);
    const last = real[real.length - 1];
    return {
      T, ok: !errs.length, errs, clauses: clauses.filter((c) => c.toks.length), preds: Object.values(preds), mods, rhet, lines,
      mora: T.reduce((a, t) => a + t.m, 0), content, oto,
      tai: !!(last && last.cat === 'N'), q: !!(last && isP(last, 'か')), kire: T.filter((t) => t.kire || isP(t, 'かな')).map((t) => t.i),
    };
  }

  KD.lines = (an) => an.lines;
  Object.assign(KD, { analyze, hasAny, solid, anim });
})(typeof window !== 'undefined' ? window : globalThis);
