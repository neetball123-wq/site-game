/* ハズレスキル【合成】 — スキルの中身
   スキル（持っている1枚）＝ { u, core, root, pre, rank, lv, trig, ev, low, tough, rep, drain, fx, pg, parts, recipe }
   レベル・合成・名前・説明文をここで決める。画面には触らない。 */
(function (G) {
  'use strict';
  const HZ = G.HZ;

  HZ.LV = 1.5;          // Lv が1上がるごとの倍率
  HZ.FUSE = 1.2;        // 合成のたびに効き目にかかる倍率（称号で増える）
  HZ.RESO = 1.2;        // 同じ属性どうしの合成（共鳴）でさらにかかる倍率
  HZ.TOUGH = 0.7;       // 同じターンに同じスキルが発動するたび、効き目がこの倍になる
  HZ.STOP = 0.01;       // 効き目がこれを下回ると、そのターンはもう発動しない
  const RANK = ['', '・改', '・極', '・真', '・神'];
  const SCALE = { dmg: 1, st: 1, heal: 1, sh: 1, buf: 1, gold: 1, count: 1, self: 1, grow: 1, pgrow: 1, maxhp: 1, ret: 1, bufgold: 1 };

  /* ---------- 大きな数の書き方 ---------- */
  const UNITS = ['', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];
  HZ.fmt = (x) => {
    if (x === Infinity) return '∞';
    if (!(x > 0)) return '0';
    if (x < 10 && Math.abs(x - Math.round(x)) > 0.05) return x.toFixed(1);
    if (x < 10000) return String(Math.round(x));
    const lg = Math.log10(x), u = Math.floor(lg / 4);
    if (u < UNITS.length) {
      const top = x / Math.pow(10, u * 4);
      if (top >= 1000) return Math.floor(top) + UNITS[u];
      const rest = Math.floor((top - Math.floor(top)) * 10000);
      return Math.floor(top) + UNITS[u] + (rest > 0 ? rest + UNITS[u - 1] : '');
    }
    return `10の${Math.floor(lg)}乗`;
  };

  /* ---------- スキルをつくる ---------- */
  const norm = (t) => {
    const [k, a, b, c] = t;
    if (k === 'dmg') return { k, el: a, p: b, to: c || 'f' };
    if (k === 'st') return { k, st: a, p: b, to: c || 'f' };
    if (k === 'buf') return { k, s: a, p: b };
    if (k === 'emit') return { k, ev: a };
    if (k === 'amp') return { k, st: a, p: b };
    if (k === 'echo' || k === 'atk' || k === 'spread') return { k };
    return { k, p: a };
  };
  HZ.make = (run, id) => {
    const b = HZ.SKILLS[id];
    return {
      u: ++run.uid, core: id, root: b.name, pre: [], rank: 0, lv: 1,
      trig: b.trig, ev: b.ev || 0, low: !!b.low, tough: b.tough || 0, rep: b.rep || 0, drain: b.drain || 0,
      fx: b.fx.map(norm), pg: 0, parts: [id], recipe: null,
    };
  };
  HZ.clone = (s) => JSON.parse(JSON.stringify(s));
  HZ.mul = (s) => Math.pow(HZ.LV, s.lv - 1);
  HZ.name = (s) => s.pre.slice(-2).join('') + s.root + (s.rank < RANK.length ? RANK[s.rank] : '・神+' + (s.rank - RANK.length + 1));
  HZ.els = (s) => [...new Set(s.fx.filter((e) => e.el).map((e) => e.el))];
  HZ.isHazure = (s) => s.parts.length === 1 && HZ.SKILLS[s.core].rare === 0;

  /* ---------- 合成 ----------
     きっかけ（いつ）は土台 a から、効き目（なにを）は a と b の両方から（a の効き目が先に起きる）。
     素材 b の効き目に合成の倍率 ×1.2（同じ属性をもつどうしは さらに ×1.2）。Lv は1にもどり、位（改・極・真・神…）が上がる。 */
  HZ.recipeOf = (a, b) => HZ.RECIPES.find((r) => (r[0] === a.core && r[1] === b.core) || (r[1] === a.core && r[0] === b.core)) || null;
  const keyOf = (e) => e.k + '|' + (e.el || e.st || e.s || e.ev || '') + '|' + (e.to || '');
  const REPEAT = { atk: 1, echo: 1, emit: 1, spread: 1 };   // 重ねると回数が増える
  const MERGE_SUM = { dmg: 1, st: 1, heal: 1, sh: 1, buf: 1, gold: 1, count: 1, self: 1, grow: 1, pgrow: 1, maxhp: 1, ret: 1, bufgold: 1 };
  function scaled(s) {
    const m = HZ.mul(s);
    return s.fx.map((e) => {
      const c = Object.assign({}, e);
      if (SCALE[e.k]) c.p = e.p * m;
      else if (e.k === 'charge' || e.k === 'amp') c.p = 1 + (e.p - 1) * m;
      return c;
    });
  }
  function merge(list) {
    const out = [], at = {};
    for (const e of list) {
      const key = keyOf(e);
      if (key in at && (MERGE_SUM[e.k] || REPEAT[e.k] || e.k === 'charge' || e.k === 'amp' || e.k === 'exe')) {
        const o = out[at[key]];
        if (REPEAT[e.k]) o.n = (o.n || 1) + (e.n || 1);
        else if (e.k === 'charge') o.p += e.p - 1;
        else if (e.k === 'amp') o.p *= e.p;
        else if (e.k === 'exe') o.p = Math.max(o.p, e.p);
        else o.p += e.p;
      } else { at[key] = out.length; out.push(Object.assign({}, e)); }
    }
    return out;
  }
  HZ.fuseRate = (run, a, b) => {
    let r = HZ.FUSE;
    for (const t of (run && run.titles) || []) if (HZ.TITLES[t] && HZ.TITLES[t].fuse) r += HZ.TITLES[t].fuse;
    const ea = HZ.els(a), eb = HZ.els(b);
    const reso = ea.some((x) => x !== '無' && eb.includes(x));
    return { rate: r * (reso ? HZ.RESO : 1), reso };
  };
  HZ.fuse = (run, a, b, uid) => {
    const { rate, reso } = HZ.fuseRate(run, a, b);
    const rc = HZ.recipeOf(a, b);
    // 倍率は素材（b）の効き目にだけかかる。土台の効き目は何度合成しても増えない（全部を1つにまとめるだけが正解にならないように）
    const add = [...scaled(b), ...(rc ? rc[3].map(norm) : [])].map((e) => {
      if (SCALE[e.k]) e.p *= rate;
      else if (e.k === 'charge' || e.k === 'amp') e.p = 1 + (e.p - 1) * rate;
      return e;
    });
    const fx = merge([...scaled(a), ...add]);
    const bPre = b.recipe ? b.recipe : HZ.SKILLS[b.core].pre;
    return {
      u: uid, core: a.core, root: rc ? rc[2] : a.root, pre: rc ? [] : [...a.pre, bPre], rank: Math.max(a.rank, b.rank) + 1, lv: 1,
      trig: a.trig, ev: a.ev, low: a.low, tough: Math.max(a.tough, b.tough), rep: a.rep + b.rep, drain: Math.max(a.drain, b.drain),
      fx, pg: (a.pg || 0) + (b.pg || 0), parts: [...a.parts, ...b.parts], recipe: rc ? rc[2] : a.recipe,
      reso, newRecipe: rc ? rc[2] : null,
    };
  };

  /* ---------- 説明文 ---------- */
  const ST_VERB = { 燃焼: '燃やした', 濡れ: '濡らした', 冷え: '冷やした', 凍結: '凍らせた', 油: '油まみれにした', 毒: '毒にした', 呪い: '呪った' };
  HZ.trigText = (s) => {
    const [ev, sub] = s.trig.split(':');
    let t;
    if (ev === 'hit' && sub) t = `〈${sub}〉のダメージを与えたとき`;
    else if (ev === 'st' && sub) t = `敵を${ST_VERB[sub] || sub}とき`;
    else if (ev === 'react' && sub) t = `「${sub}」が起きたとき`;
    else t = HZ.TRIG[ev] || ev;
    if (s.ev > 1) t = (ev === 'turn' ? `${s.ev}ターンに1回、` : `${s.ev}回に1回、`) + t;
    if (s.low) t = 'HPが半分以下なら、' + t;
    return t;
  };
  const N = (x) => HZ.fmt(x);
  const TO = { f: '', a: '敵全体に', l: '弱った敵に', b: '後ろの敵に' };
  HZ.fxText = (e, m, s) => {
    const t = fxText1(e, m, s);
    return e.n > 1 ? `${t} ×${e.n}` : t;
  };
  const fxText1 = (e, m, s) => {
    const v = SCALE[e.k] ? e.p * m : e.p;
    switch (e.k) {
      case 'dmg': return `${TO[e.to]}〈${e.el}〉${N(v + ((s && s.pg) || 0))}`;
      case 'st': return `${TO[e.to] || ''}〈${e.st}〉+${N(v)}`;
      case 'heal': return `HP +${N(v)}`;
      case 'sh': return `盾 +${N(v)}`;
      case 'buf': return e.s === '魔' ? `魔 +${N(v)}%` : e.s === '鑑' ? `見切り +${N(v)}（弱点へ +50%ずつ）` : `${e.s} +${N(v)}`;
      case 'emit': return HZ.EMIT[e.ev] || e.ev;
      case 'gold': return `お金 +${N(v)}`;
      case 'charge': return `次のダメージ ×${N(1 + (e.p - 1) * m)}`;
      case 'echo': return '直前のスキルをもう一度';
      case 'count': return `${N(v)}数える`;
      case 'self': return `自分に${N(v)}ダメージ`;
      case 'grow': return `このスキルのダメージ +${N(v)}（この戦いのあいだ）`;
      case 'pgrow': return `このスキルのダメージ +${N(v)}（ずっと）`;
      case 'maxhp': return `最大HP +${N(v)}（ずっと）`;
      case 'atk': return 'もう一度通常攻撃';
      case 'ret': return `受けたダメージの${N(v)}倍を返す`;
      case 'exe': return `HP${Math.round(e.p * 100)}%以下の敵にとどめ`;
      case 'amp': return `敵全体の〈${e.st}〉×${N(1 + (e.p - 1) * m)}`;
      case 'bufgold': return `持っているお金の${N(v)}%ぶん 魔 +`;
      case 'spread': return '前の敵の状態をほかの敵に広げる';
    }
    return e.k;
  };
  HZ.desc = (s) => {
    const m = HZ.mul(s);
    let t = HZ.trigText(s) + '：' + s.fx.map((e) => HZ.fxText(e, m, s)).join('、');
    const notes = [];
    if (s.rep) notes.push(`×${s.rep + 1}回`);
    if (s.drain) notes.push(`与えたダメージの${Math.round(s.drain * 100)}%を吸収`);
    if (s.tough) notes.push('疲れにくい');
    if (s.pg && !s.fx.some((e) => e.k === 'dmg')) notes.push(`育った力 +${N(s.pg)}`);
    if (notes.length) t += '（' + notes.join('・') + '）';
    return t;
  };
  // 図鑑など、持っていないスキルの説明
  HZ.descOf = (id) => HZ.desc(HZ.make({ uid: 0 }, id));
  // おおまかな強さ（並べ替え・自動プレイ用）
  HZ.power = (s) => {
    const m = HZ.mul(s);
    let v = 0;
    for (const e of s.fx) {
      if (e.k === 'dmg') v += (e.p * m + (s.pg || 0)) * (e.to === 'a' ? 2 : 1);
      else if (SCALE[e.k]) v += e.p * m * 0.6;
      else v += 2;
    }
    return v * (1 + s.rep) / Math.max(1, s.ev);
  };
})(typeof window !== 'undefined' ? window : globalThis);
