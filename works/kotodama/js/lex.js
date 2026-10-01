/* ことだま短冊 — 音と形
   かなを拍に分ける・母音をとる・活用させる・辞書を読みこむ。
   画面には触らない（Node でもそのまま動く）。 */
(function (G) {
  'use strict';
  const KD = G.KD = G.KD || {};

  /* ---------- かな ---------- */
  const SMALL = 'ぁぃぅぇぉゃゅょゎ';
  const BIG = { 'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ', 'っ': 'つ' };
  const ROWS = {
    a: 'あかさたなはまやらわがざだばぱぁゃゎ',
    i: 'いきしちにひみりぎじぢびぴぃ',
    u: 'うくすつぬふむゆるぐずづぶぷぅゅゔ',
    e: 'えけせてねへめれげぜでべぺぇ',
    o: 'おこそとのほもよろをごぞどぼぽぉょ',
  };
  const VOW = {};
  for (const v in ROWS) for (const c of ROWS[v]) VOW[c] = v;
  // 濁点・半濁点をはずす（しりとり・頭韻でゆるく見るとき）
  const DAK = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ', SEI = 'かきくけこさしすせそたちつてとはひふへほはひふへほう';
  const plain = (c) => { const i = DAK.indexOf(c); return i < 0 ? c : SEI[i]; };
  const toHira = (s) => String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  // 拍に分ける。小さい「ゃゅょ」などは前の拍にくっつく。「っ」「ん」「ー」は一拍
  function morae(s) {
    const out = [];
    for (const ch of toHira(s)) {
      if (SMALL.includes(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }
  const count = (s) => morae(s).length;
  // 拍ごとの母音（ん=n, っ=q）。「よう」「えい」のような伸ばす音は前の母音にそろえる
  function vowels(s) {
    const out = [];
    for (const m of morae(s)) {
      const last = m[m.length - 1];
      let v = last === 'ん' ? 'n' : last === 'っ' ? 'q' : last === 'ー' ? (out[out.length - 1] || '') : (VOW[last] || '');
      const p = out[out.length - 1];
      if (m === 'う' && (p === 'o' || p === 'u')) v = p;
      if (m === 'い' && p === 'e') v = 'e';
      out.push(v);
    }
    return out;
  }
  // 回文やだじゃれで見るための形（小さい字は大きく、「ー」は消す）
  const flat = (s) => [...toHira(s)].filter((c) => c !== 'ー').map((c) => BIG[c] || c).join('');
  // だじゃれ用：「っ」「ー」を消して、小さい字は大きく（ふっとんだ → ふとんだ）
  const loose = (s) => [...toHira(s)].filter((c) => c !== 'っ' && c !== 'ー').map((c) => BIG[c] || c).join('');
  const head = (s) => { const m = morae(s)[0] || ''; return plain(BIG[m[0]] || m[0] || ''); };
  // しりとりの「おしり」。「ー」なら母音、小さい字は大きく
  function tail(s) {
    const ms = morae(s);
    let m = ms[ms.length - 1] || '';
    if (m === 'ー' && ms.length > 1) { const v = vowels(s); m = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' }[v[v.length - 1]] || 'あ'; }
    const c = m[m.length - 1];
    return plain(BIG[c] || c);
  }

  /* ---------- 活用 ----------
     動詞 vt: '5'（五段）'1'（一段）'s'（する）'k'（来る）
     形は base（言い切り・名詞の前）/ nai（ない の前）/ te / ta / ba / ren（連用形・けり の前） */
  const G5 = { 'う': ['わ', 'い', 'え', 'っ'], 'く': ['か', 'き', 'け', 'い'], 'ぐ': ['が', 'ぎ', 'げ', 'い'], 'す': ['さ', 'し', 'せ', 'し'], 'つ': ['た', 'ち', 'て', 'っ'],
    'ぬ': ['な', 'に', 'ね', 'ん'], 'ぶ': ['ば', 'び', 'べ', 'ん'], 'む': ['ま', 'み', 'め', 'ん'], 'る': ['ら', 'り', 'れ', 'っ'] };
  // 書き（s）と読み（y）を同じように変える。末尾 n 文字を k に取りかえる
  const swap = (w, n, ks, ky) => ({ s: w.s.slice(0, w.s.length - n) + ks, y: w.y.slice(0, w.y.length - n) + (ky === undefined ? ks : ky) });
  // 動詞を活用させる。戻り値の aux は、うしろにつく「て」「た」「ば」が実際にどう書かれるか
  function verb(w, form) {
    const end = w.y.slice(-1);
    if (form === 'base') return { s: w.s, y: w.y };
    if (w.vt === 's') {
      const st = w.s.slice(0, -2), sy = w.y.slice(0, -2);
      const t = { nai: ['し', 'し'], te: ['し', 'し'], ta: ['し', 'し'], ren: ['し', 'し'], ba: ['すれ', 'すれ'] }[form];
      return { s: st + t[0], y: sy + t[1] };
    }
    if (w.vt === 'k') {
      const t = { nai: 'こ', te: 'き', ta: 'き', ren: 'き', ba: 'くれ' }[form];
      const kanji = w.s.endsWith('来る');
      return { s: kanji ? w.s.slice(0, -2) + (form === 'ba' ? '来れ' : '来') : w.s.slice(0, -2) + t, y: w.y.slice(0, -2) + t };
    }
    if (w.vt === '1') {
      if (form === 'ba') return swap(w, 1, 'れ');
      return swap(w, 1, '');
    }
    const row = G5[end];
    if (!row) return { s: w.s, y: w.y };
    if (form === 'nai') return swap(w, 1, row[0]);
    if (form === 'ren') return swap(w, 1, row[1]);
    if (form === 'ba') return swap(w, 1, row[2]);
    // て・た
    if (w.y === 'いく' || w.y.endsWith('ゆく') && w.iku) return swap(w, 1, 'っ');
    return swap(w, 1, row[3]);
  }
  // 五段の「て」「た」が濁るか（泳いで・死んで・遊んで・読んで）
  const voiced = (w) => w.vt === '5' && 'ぐぬぶむ'.includes(w.y.slice(-1));
  // 形容詞（い）：base / ku / nai（くない の く）/ te（くて）/ ta（かった）/ ba（ければ）
  function adj(w, form) {
    if (form === 'base') return { s: w.s, y: w.y };
    if (w.y === 'いい') w = { s: '良い', y: 'よい' };
    const t = { ku: 'く', nai: 'く', te: 'く', ta: 'か', ba: 'けれ' }[form];
    return swap(w, 1, t);
  }

  /* ---------- 辞書 ----------
     1行1語：「よみ 表記 品詞 力 タグ,タグ キー=値;キー=値」
     品詞：n 名詞 / v5 v1 vs vk 動詞 / a 形容詞 / na 形容動詞 / adv 副詞 / rt 連体詞 / cj 接続詞 / it 感動詞 / num 数
     キー：op 働き / o を にとれるもの / sb が にとれるもの（anim＝生き物）/ vi「を」をとらない / mo 道を「を」でとる
           m 形容詞がかかった名詞の力の倍率 / am 副詞の働き / p=0 店に出さない / r まれさ 1〜3 */
  const DICT = KD.DICT = KD.DICT || {};
  const BY_Y = KD.BY_Y = KD.BY_Y || {};
  const BY_S = KD.BY_S = KD.BY_S || {};
  let seq = 0;
  function addWords(text, pack) {
    const out = [];
    for (let line of String(text).split('\n')) {
      line = line.replace(/#.*$/, '').trim();
      if (!line) continue;
      const [y, s0, pos, pow, tags = '', ext = ''] = line.split(/\s+/);
      // 「空/から」のように / のあとは見分け用（表記は / の前だけ）
      const s = s0.split('/')[0];
      const w = { y, s, pos: pos.replace(/^v[15sk]$/, 'v'), pow: +pow, tags: tags && tags !== '-' ? tags.split(',') : [], pack: pack || 'base' };
      if (pos[0] === 'v' && pos !== 'v') w.vt = pos[1];
      for (const kv of ext ? ext.split(';') : []) {
        const [k, v = '1'] = kv.split('=');
        if (k === 'o' || k === 'sb') w[k] = v === 'anim' ? 'anim' : v.split(',');
        else if (k === 'p' || k === 'r' || k === 'm') w[k] = +v;
        else w[k] = v;
      }
      if (w.p === undefined) w.p = 1;
      if (!w.r) w.r = w.pow >= 8 ? 3 : w.pow >= 5 ? 2 : 1;
      // 同じ表記が二度あれば（読みちがい）読みでわける
      let id = s0;
      if (DICT[id] && DICT[id].y !== y) id = w.s + '/' + y;
      if (DICT[id]) continue;
      w.id = id; w.n = seq++;
      DICT[id] = w;
      (BY_Y[flat(y)] = BY_Y[flat(y)] || []).push(w);
      (BY_S[s] = BY_S[s] || []).push(w);
      out.push(w);
    }
    return out;
  }

  // 形のあるもの（これ以外は、たとえとして何にでもなれる）
  const SOLID = ['物', '生', '人', '獣', '鳥', '魚', '虫', '草', '食', '液', '具', '武', '布', '紙', '金', '石', '木', '所', '家', '体'];
  const ANIM = ['生', '人', '獣', '鳥', '魚', '虫', '妖', '神'];
  // 反対の性質（形容詞と名詞がぶつかると「撞着語法」）
  const OPP = [['熱', '冷'], ['大', '小'], ['硬', '柔'], ['明', '暗'], ['速', '遅'], ['古', '新'], ['静', '騒'], ['重', '軽'], ['甘', '苦'], ['白', '黒'], ['長', '短'], ['高', '低'], ['光', '闇'], ['火', '水'], ['火', '氷'], ['生', '死']];
  const opp = (a, b) => OPP.some(([x, y]) => (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x)));
  const ELEM = ['火', '水', '風', '土', '雷', '氷', '光', '闇'];
  const SEASON = ['春', '夏', '秋', '冬'];

  Object.assign(KD, { morae, count, vowels, flat, loose, head, tail, plain, toHira, verb, adj, voiced, addWords, SOLID, ANIM, OPP, opp, ELEM, SEASON });
})(typeof window !== 'undefined' ? window : globalThis);
