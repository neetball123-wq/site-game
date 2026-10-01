/* ことだま短冊 — 技（ことば遊び）
   技はこの WAZA に1つずつ並んでいる。足すときは KD.addWaza({...}) を呼ぶ。
   detect(an, ctx) は見つからなければ null、見つかれば { n: 回数や強さ, hl: [光らせる短冊], note: ひとこと } を返す。
   kind:'add' は「＋倍」（base＋per×段位）×n、kind:'mul' は「×倍」。
   hide:true の技は、はじめて出るまで帖に名前が出ない。 */
(function (G) {
  'use strict';
  const KD = G.KD;
  const { flat, loose, vowels, head, tail, morae } = KD;
  const WAZA = KD.WAZA = [];
  KD.addWaza = (w) => { WAZA.push(w); return w; };

  /* ---------- 音の区切り（句） ----------
     改行があれば、その行がそのまま句。なければ、短冊のさかいめで区切れる場所をさがす。
     ぴったりなら満点、各句が少しずれていれば「字余り／字足らず」（効き目は半分）。 */
  const FORMS = [
    { id: 'tanka', pat: [5, 7, 5, 7, 7] },
    { id: 'sedoka', pat: [5, 7, 7, 5, 7, 7] },
    { id: 'dodoitsu', pat: [7, 7, 7, 5] },
    { id: 'haiku', pat: [5, 7, 5] },
    { id: 'katauta', pat: [5, 7, 7] },
  ];
  const chokaPat = (k) => { const p = []; for (let i = 0; i < k; i++) p.push(5, 7); p.push(7); return p; };
  const dev = (cs, pat) => cs.reduce((a, c, i) => a + Math.abs(c - pat[i]), 0);
  // 短冊のさかいめ（音の数の累計）で、pat に近い区切りを探す（各句 ±tol、ずれの合計が最小のもの）
  function split(an, pat, tol) {
    const T = an.T, at = [0]; let s = 0;
    for (const t of T) { s += t.m; at.push(s); }
    const n = T.length;
    let best = null;
    const go = (line, k, acc, cs) => {
      if (best && acc >= best.d) return;
      if (line === pat.length) { if (k === n) best = { d: acc, cuts: cs.slice() }; return; }
      for (let j = k + 1; j <= n; j++) {
        const m = at[j] - at[k];
        if (m > pat[line] + tol) break;
        if (m < pat[line] - tol) continue;
        if (line === pat.length - 1 && j !== n) continue;
        // 句の頭が助詞になる区切りは、なるべく選ばない
        const head = T.slice(k, j).find((x) => x.m > 0);
        const pen = head && head.cat === 'P' ? 0.5 : 0;
        cs.push(j); go(line + 1, j, acc + Math.abs(m - pat[line]) + pen, cs); cs.pop();
      }
    };
    go(0, 0, 0, []);
    if (!best) return null;
    const lines = []; let from = 0;
    best.d = Math.floor(best.d);
    for (const j of best.cuts) { lines.push([from, j - 1]); from = j; }
    return { d: best.d, lines, counts: lines.map(([a, b]) => T.slice(a, b + 1).reduce((x, t) => x + t.m, 0)) };
  }
  function form(an) {
    if (an._form !== undefined) return an._form;
    let f = null;
    if (an.lines) {
      // 改行で区切った句：句の数が同じ型と見くらべる（各句 ±2、合計のずれ3まで）
      const cs = an.lines.map((l) => l.m), L = an.lines.map((l) => [l.from, l.to]);
      const cands = FORMS.map((F) => F.pat);
      if (cs.length >= 7 && cs.length % 2) cands.push(chokaPat((cs.length - 1) / 2));
      for (const pat of cands) {
        if (pat.length !== cs.length || cs.some((c, i) => Math.abs(c - pat[i]) > 2)) continue;
        const d = dev(cs, pat);
        if (d > 3) continue;
        const id = pat.length >= 7 ? 'choka' : FORMS.find((F) => F.pat === pat).id;
        if (!f || d < f.over) f = { id, lines: L, counts: cs, pat, over: d, k: (pat.length - 1) / 2, short: cs.reduce((a, b) => a + b, 0) < pat.reduce((a, b) => a + b, 0) };
      }
    } else {
      // 改行なし：まずぴったり、なければ各句 ±1・ずれ合計2まで
      const total = an.mora;
      const cands = FORMS.map((F) => ({ id: F.id, pat: F.pat }));
      for (let k = 3; k <= 12; k++) if (Math.abs(total - (12 * k + 7)) <= 2) cands.unshift({ id: 'choka', pat: chokaPat(k), k });
      for (const tol of [0, 1]) {
        for (const c of cands) {
          const sum = c.pat.reduce((a, b) => a + b, 0);
          if (Math.abs(total - sum) > (tol ? 2 : 0)) continue;
          const r = split(an, c.pat, tol);
          if (r && r.d <= (tol ? 2 : 0)) { f = { id: c.id, lines: r.lines, counts: r.counts, pat: c.pat, over: r.d, k: c.k, short: total < sum }; break; }
        }
        if (f) break;
      }
    }
    an._form = f;
    return f;
  }
  KD.form = form;
  KD.FORMNAME = { haiku: '俳句', tanka: '短歌', katauta: '片歌', dodoitsu: '都々逸', sedoka: '旋頭歌', choka: '長歌' };
  KD.FORMPAT = { haiku: '五・七・五', tanka: '五・七・五・七・七', katauta: '五・七・七', dodoitsu: '七・七・七・五', sedoka: '五・七・七・五・七・七' };

  const words = (an) => an.T.filter((t) => t.k === 'w' && t.cat !== 'OTO');
  const rhet = (an, k) => an.rhet.filter((r) => r.t === k);

  /* ---------- 型 ---------- */
  // ぴったりなら満点。字余り・字足らずなら、効き目は半分
  const FORM_W = [
    ['haiku', '俳句', '五・七・五', 3, 1, false],
    ['tanka', '短歌', '五・七・五・七・七', 5, 1.5, false],
    ['katauta', '片歌', '五・七・七', 2, 0.5, true],
    ['dodoitsu', '都々逸', '七・七・七・五', 4, 1, true],
    ['sedoka', '旋頭歌', '五・七・七／五・七・七', 5, 1.5, true],
  ];
  const half = (full, f) => (f.over ? 1 + (full - 1) * 0.5 : full);
  const tag = (f) => (f.over ? (f.short ? '（字足らず）' : '（字余り）') : '');
  for (const [id, name, desc, base, per, hide] of FORM_W) {
    WAZA.push({ id, name, desc: `音の数が ${desc} に区切れる（改行で区切るか、短冊のさかいめで）。少しずれると字余り・字足らずで半分`, kind: 'mul', base, per, hide, group: '型',
      val: (lv, n, an) => half(base + per * lv, form(an)),
      detect: (an) => { const f = form(an); return f && f.id === id ? { n: 1, note: f.counts.join('・'), label: name + tag(f) } : null; } });
  }
  WAZA.push({ id: 'choka', name: '長歌', desc: '五・七を三回以上くりかえし、七で結ぶ。くりかえすほど強い', kind: 'mul', base: 1, per: 0.25, hide: true, group: '型',
    val: (lv, n, an) => half(1 + n * (1 + 0.25 * lv), form(an)),
    detect: (an) => { const f = form(an); return f && f.id === 'choka' ? { n: f.k, note: `五七×${f.k}`, label: '長歌' + tag(f) } : null; } });

  /* ---------- 音あそび ---------- */
  WAZA.push({ id: 'rhyme', name: '韻', desc: 'おしりの母音（二音）がそろう言葉が二つ以上。三音そろえばもっと強い', kind: 'add', base: 2, per: 1, group: '音',
    detect: (an) => {
      const ws = words(an).filter((t) => t.m >= 2);
      const g = {};
      for (const t of ws) { const v = vowels(t.y).slice(-2).join(''); if (v.length === 2 && !/^[nq]+$/.test(v)) (g[v] = g[v] || []).push(t); }
      let n = 0; const hl = [];
      for (const k in g) {
        const ids = [...new Set(g[k].map((t) => t.y))];
        if (ids.length < 2) continue;
        n += ids.length - 1; hl.push(...g[k].map((t) => t.i));
        const v3 = {}; for (const t of g[k]) if (t.m >= 3) { const kk = vowels(t.y).slice(-3).join(''); (v3[kk] = v3[kk] || new Set()).add(t.y); }
        for (const kk in v3) if (v3[kk].size >= 2) n += v3[kk].size - 1;
      }
      return n ? { n, hl } : null;
    } });
  WAZA.push({ id: 'toin', name: '頭韻', desc: '続けて並んだ言葉の頭の音がそろう', kind: 'add', base: 1, per: 0.5, group: '音',
    detect: (an) => {
      const ws = words(an); let n = 0, run = 1; const hl = new Set();
      for (let k = 1; k < ws.length; k++) {
        if (head(ws[k].y) && head(ws[k].y) === head(ws[k - 1].y) && ws[k].y !== ws[k - 1].y) { run++; n++; hl.add(ws[k].i); hl.add(ws[k - 1].i); } else run = 1;
      }
      return n ? { n, hl: [...hl] } : null;
    } });
  WAZA.push({ id: 'shiritori', name: 'しりとり', desc: '言葉のおしりと、次の言葉の頭がつながる（三つ以上）', kind: 'add', base: 2, per: 1, group: '音',
    detect: (an) => {
      const ws = words(an); let best = [], cur = ws.length ? [ws[0]] : [];
      for (let k = 1; k < ws.length; k++) {
        if (tail(ws[k - 1].w.y) === head(ws[k].w.y)) cur.push(ws[k]); else { if (cur.length > best.length) best = cur; cur = [ws[k]]; }
      }
      if (cur.length > best.length) best = cur;
      if (best.length < 3) return null;
      const lost = tail(best[best.length - 1].w.y) === 'ん';
      return { n: lost ? 0 : best.length - 1, hl: best.map((t) => t.i), note: lost ? '「ん」がついた……' : `${best.length}つ`, lost };
    } });
  WAZA.push({ id: 'kaibun', name: '回文', desc: '上から読んでも下から読んでも同じ（五音以上）', kind: 'mul', base: 2, per: 1, hide: true, group: '音',
    val: (lv, n) => 2 + lv + n / 4,
    detect: (an) => {
      const a = flat(an.T.map((t) => t.y).join('')), b = flat(an.T.map((t) => t.ph).join(''));
      const pal = (s) => s.length >= 5 && s === [...s].reverse().join('');
      return pal(a) || pal(b) ? { n: morae(a).length, hl: an.T.map((t) => t.i) } : null;
    } });
  WAZA.push({ id: 'dajare', name: 'だじゃれ', desc: '同じ音が、別の意味でもう一度あらわれる', kind: 'add', base: 4, per: 2, hide: true, group: '音',
    detect: (an) => {
      const starts = []; let full = '';
      for (const t of an.T) { starts.push(full.length); full += loose(t.y); }
      let n = 0; const hl = new Set();
      for (const A of words(an)) {
        if (A.cat !== 'N') continue;
        const key = loose(A.y);
        if (key.length < 2) continue;
        let pos = full.indexOf(key), hit = false;
        while (pos >= 0 && !hit) {
          if (pos !== starts[A.i]) {
            const k = starts.indexOf(pos), B = k >= 0 ? an.T[k] : null;
            const whole = B && B.k === 'w' && loose(B.y) === key;
            if (whole && B.w.id === A.w.id) { /* 同じ言葉のくりかえし */ } else if (whole || key.length >= 3) { hit = true; hl.add(A.i); if (B) hl.add(B.i); }
          }
          pos = full.indexOf(key, pos + 1);
        }
        if (hit) n++;
      }
      return n ? { n, hl: [...hl] } : null;
    } });
  WAZA.push({ id: 'onoma', name: 'オノマトペ', desc: '「きらきら」のような音の言葉。切れはしをくり返した音（「るまるま」）も', kind: 'add', base: 2, per: 1, group: '音',
    detect: (an) => {
      const hl = an.T.filter((t) => (t.k === 'w' && t.w.tags.includes('擬')) || (t.cat === 'OTO' && (() => { const m = morae(t.y); const h = m.length / 2; return m.length >= 2 && m.length % 2 === 0 && m.slice(0, h).join('') === m.slice(h).join(''); })())).map((t) => t.i);
      return hl.length ? { n: hl.length, hl } : null;
    } });

  /* ---------- 文のかたち ---------- */
  const R = (id, name, desc, base, per, hide) => WAZA.push({ id, name, desc, kind: 'add', base, per, hide, group: 'あや',
    detect: (an) => { const rs = rhet(an, name); return rs.length ? { n: rs.length, hl: rs.flatMap((r) => [r.i, r.j]) } : null; } });
  R('hiyu', '比喩', '形のないものを、形あるもののように扱う（「悲しみを投げる」）', 1.5, 0.5);
  R('gijin', '擬人法', '人や生き物でないものが、生き物のようにふるまう（「月が笑う」）', 2, 1);
  R('dochaku', '撞着語法', '反対の性質をぶつける（「熱い雪」）', 3, 1, true);
  R('inyu', '隠喩', '「AはBだ」。この戦いのあいだ、A は B の性質を帯びる', 2, 1);
  R('chokuyu', '直喩', '「〜のように」。たとえたものの性質が乗る', 1.5, 0.5);
  WAZA.push({ id: 'taigen', name: '体言止め', desc: '名詞で言い切る（言葉三つ以上）', kind: 'add', base: 2, per: 1, group: 'あや',
    detect: (an) => (an.tai && words(an).length >= 3 ? { n: 1, hl: [an.T.length - 1] } : null) });
  WAZA.push({ id: 'kireji', name: '切れ字', desc: '「や」「かな」「けり」。型（俳句など）と組むと「×倍」になる', kind: 'mul', base: 1.5, per: 0.25, group: 'あや',
    val: (lv, n, an) => (form(an) ? 1.5 + 0.25 * lv : 1 + 0.1 * (lv + 1)),
    detect: (an) => (an.kire.length ? { n: 1, hl: an.kire } : null) });
  WAZA.push({ id: 'kigo', name: '季語', desc: 'ひとつの季節の言葉。季節がまざると「季重なり」で弱くなる', kind: 'add', base: 1, per: 0.5, group: 'あや',
    detect: (an) => {
      const ss = {}; const hl = [];
      for (const t of words(an)) { const s = KD.SEASON.filter((x) => t.w.tags.includes(x)); if (s.length === 1) { ss[s[0]] = 1; hl.push(t.i); } }
      const n = Object.keys(ss).length;
      if (!n) return null;
      if (n >= 2) return { n: 0, hl, note: '季重なり', over: true };
      return { n: hl.length, hl, note: Object.keys(ss)[0] };
    } });
  WAZA.push({ id: 'tsuiku', name: '対句', desc: '同じ形の文を二つ並べる（言葉三つ以上の文）', kind: 'mul', base: 2, per: 0.5, hide: true, group: 'あや',
    detect: (an) => {
      const sig = an.clauses.filter((c) => !c.cj && !c.it).map((c) => c.toks.map((i) => an.T[i]).filter((t) => t.cat !== 'OTO'))
        .filter((ts) => ts.filter((t) => t.k === 'w').length >= 2 && ts.length >= 3).map((ts) => ({ s: ts.map((t) => t.cat === 'P' ? t.p : t.cat).join(','), ts }));
      for (let a = 0; a < sig.length; a++) for (let b = a + 1; b < sig.length; b++) if (sig[a].s === sig[b].s) return { n: 1, hl: [...sig[a].ts, ...sig[b].ts].map((t) => t.i) };
      return null;
    } });
  WAZA.push({ id: 'kazoe', name: '数え歌', desc: '数が小さいほうから順に並ぶ', kind: 'add', base: 2, per: 1, hide: true, group: 'あや',
    detect: (an) => {
      const ns = words(an).filter((t) => t.w.pos === 'num');
      let best = 0, cur = 0, prev = -1; const hl = [];
      for (const t of ns) { const v = t.w.pow; if (v > prev) { cur++; hl.push(t.i); } else cur = 1; prev = v; best = Math.max(best, cur); }
      return best >= 2 ? { n: best, hl } : null;
    } });
  WAZA.push({ id: 'nagabun', name: '長文', desc: '文を二つ以上つなぐ。つなぐほど強い（上限なし）', kind: 'add', base: 1, per: 0.5, group: '文',
    detect: (an) => { const n = an.clauses.filter((c) => !c.cj && !c.it && c.toks.some((i) => an.T[i].k === 'w')).length - 1; return n > 0 ? { n } : null; } });
  WAZA.push({ id: 'sanbyoshi', name: '三拍子', desc: '「だれが・何を・どうする」がそろった文', kind: 'add', base: 1, per: 0.5, group: '文',
    detect: (an) => { const ps = an.preds.filter((p) => p.verb && p.subj.length && p.obj.length); return ps.length ? { n: ps.length, hl: ps.flatMap((p) => [p.i, ...p.subj, ...p.obj]) } : null; } });
  WAZA.push({ id: 'toi', name: '問いかけ', desc: '「か」で終わる。答えを探して、短冊を一枚引く', kind: 'add', base: 1, per: 0.5, hide: true, group: '文',
    detect: (an) => (an.q ? { n: 1, hl: [an.T.length - 1] } : null) });
  WAZA.push({ id: 'yobi', name: '呼びかけ', desc: '名詞に「よ」をつけて呼ぶ', kind: 'add', base: 1, per: 0.5, hide: true, group: '文',
    detect: (an) => { const hl = an.T.filter((t, i) => t.cat === 'P' && t.p === 'よ' && an.T[i - 1] && an.T[i - 1].cat === 'N').map((t) => t.i - 1); return hl.length ? { n: hl.length, hl } : null; } });

  /* ---------- 物の怪と、言い伝え ---------- */
  WAZA.push({ id: 'nazashi', name: '名指し', desc: '物の怪の名を、その言葉で呼ぶ', kind: 'mul', base: 3, per: 1, hide: true, group: '言霊',
    detect: (an, ctx) => { const e = ctx.enemy; if (!e) return null; const hl = words(an).filter((t) => flat(t.w.y) === flat(e.y)).map((t) => t.i); return hl.length ? { n: 1, hl } : null; } });
  // ことわざ・名句：言葉（短冊）がこの順で続けば成立（助詞はなんでもよい）
  WAZA.push({ id: 'kotowaza', name: 'ことわざ', desc: 'むかしからの言い伝えを、そのまま詠む', kind: 'mul', base: 8, per: 2, hide: true, group: '言霊',
    detect: (an) => saying(an, 'ことわざ') });
  WAZA.push({ id: 'meiku', name: '名句', desc: 'むかしの名句を、そのまま詠む', kind: 'mul', base: 20, per: 5, hide: true, group: '言霊',
    detect: (an) => saying(an, '名句') });
  function saying(an, kind) {
    const ws = words(an), keys = ws.map((t) => t.w.id);
    for (const k of KD.SAYINGS || []) {
      if (k.kind !== kind) continue;
      const seq = k.seq.map((x) => x.split('|'));
      for (let s = 0; s + seq.length <= keys.length; s++) {
        if (seq.every((alts, j) => alts.includes(keys[s + j]) || alts.includes(ws[s + j].w.s))) return { n: 1, hl: ws.slice(s, s + seq.length).map((t) => t.i), note: k.text, key: k.id };
      }
    }
    return null;
  }

  /* ---------- 技の値 ---------- */
  KD.wazaVal = (wz, lv, n, an) => (wz.val ? wz.val(lv, n, an) : wz.kind === 'mul' ? wz.base + wz.per * lv : (wz.base + wz.per * lv) * n);
  KD.wazaById = (id) => WAZA.find((w) => w.id === id);
})(typeof window !== 'undefined' ? window : globalThis);
