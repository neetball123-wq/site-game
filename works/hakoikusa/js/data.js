/* =========================================================
   ハコイクサ — データ（形・道具・合体・流派・相手）
   DOMを使わない。Node からも読める。
   ---------------------------------------------------------
   座標は [x, y, z]。y が上。1マス＝1。
   効果範囲の記号（説明文の中で使う）
     ↑1 真上1マス / ↑2 上2マス / ↑∞ 上ぜんぶ
     ↓1 真下1マス / ↓∞ 下ぜんぶ
     ◇ となり（上下左右前後の6方向）
     ⇄ 同じ段の前後左右
     ↕ 縦一列（上も下も）
     ▭ 同じ段ぜんぶ
   ========================================================= */
(function (G) {
  'use strict';
  const HK = G.HK || (G.HK = {});

  const SHAPES = {
    o1: [[0, 0, 0]],
    i2: [[0, 0, 0], [1, 0, 0]],
    i2v: [[0, 0, 0], [0, 1, 0]],
    i3: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
    i3v: [[0, 0, 0], [0, 1, 0], [0, 2, 0]],
    l3: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
    o4: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]],
    o4v: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]],
    t4: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]],
    l4: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1]],
    s4: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]],
    tri: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]],
    scr: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1]],
  };

  /* 分類ごとの色（道具の色はここから） */
  const COL = {
    steel: '#6E8FB5', wood: '#C9975A', fire: '#E4582F', water: '#2F87CB', brass: '#D1A332',
    bolt: '#8C62D6', guard: '#4E9C68', stone: '#948D82', kara: '#D9803A', luck: '#DC6A86', legend: '#C23B3B',
  };

  /* タグの表示色 */
  const TAGS = {
    '武器': '#B8412F', '刃': '#5E7FA6', '飛': '#6C8A3C', '火': '#E4582F', '水': '#2F87CB', '木': '#A47340',
    '鉄': '#5F6F80', '石': '#7E776C', '歯車': '#B98E1E', 'からくり': '#C8702A', '守り': '#3F8A58', '雷': '#7D55C8', '薬': '#3AA59A', '縁起': '#C85478',
  };

  /*
    act: 発動したときの効果
      dmg 威力 / hits 回数 / block 盾 / heal 回復 / burn 燃焼 / rust 錆 / oil 油 / cleanse 燃焼を消す
      kick 真上のアイテムを早める秒数 / tick 自分の箱ぜんぶを早める秒数
      bolt {dmg, stun, n} 相手の縦一列に雷 / zap {dmg, stun} 相手のアイテム1つをしびれさせる
    start: 戦闘開始時（block）
    gear: 歯車としての枚数
    aura: まわりへの効果 [{range, reach, tag|test, mod, text}]
    self(p, c): 置き方で自分が変わる条件 → [{mod, text}]
  */
  const ITEMS = [
    // ---------------- 並 ----------------
    { id: 'bokken', name: '木剣', yomi: 'ぼっけん', mark: '剣', rar: 1, cost: 3, shape: 'i2', color: COL.wood, tags: ['武器', '刃', '木'],
      cd: 1.5, act: { dmg: 3 }, text: '軽くて速い、稽古用の木の剣。' },
    { see: [['layer', 1]], id: 'shuriken', name: '十字手裏剣', yomi: 'じゅうじしゅりけん', mark: '十', rar: 1, cost: 2, shape: 'o1', color: COL.steel, tags: ['武器', '飛', '鉄'],
      cd: 1.2, act: { dmg: 1 },
      self(p, c) { const qs = c.inRange(p, 'layer').filter((q) => c.def(q).id === 'shuriken'), n = Math.min(3, qs.length); return n ? [{ mod: { dmg: n }, text: `▭ 同じ段の手裏剣${n}つ：威力+${n}`, from: qs }] : []; },
      rule: '▭ 同じ段にある、ほかの十字手裏剣1つにつき威力+1（3つまで）' },
    { id: 'takeyari', name: '竹槍', yomi: 'たけやり', mark: '槍', rar: 1, cost: 3, shape: 'i3v', color: COL.wood, tags: ['武器', '刃', '木'],
      cd: 2.2, act: { dmg: 5 },
      self(p, c) { return c.standing(p) ? [{ mod: { spd: 0.4 }, text: '立てて置いた：速さ+40%' }] : []; },
      rule: '縦に立てて置くと、速さ+40%' },
    { id: 'kugi', name: '錆び釘', yomi: 'さびくぎ', mark: '釘', rar: 1, cost: 2, shape: 'o1', color: COL.stone, tags: ['武器', '鉄'],
      cd: 2.0, act: { dmg: 1, rust: 1 }, text: '刺さると、相手の箱を錆びつかせる。' },
    { id: 'ita', name: '木の板', yomi: 'きのいた', mark: '板', rar: 1, cost: 2, shape: 'i2', color: COL.guard, tags: ['守り', '木'],
      cd: 2.8, act: { block: 4 }, text: 'ただの板。だが、あると助かる。' },
    { see: [['down', 1]], id: 'kyusu', name: '急須', yomi: 'きゅうす', mark: '茶', rar: 1, cost: 3, shape: 'o1', color: COL.water, tags: ['水', '薬'],
      cd: 3.2, act: { heal: 3 },
      self(p, c) { const f = c.below(p).filter((q) => c.has(q, '火')); return f.length ? [{ mod: { heal: 3, cleanse: 2 }, text: '↓1 真下に火：お湯がわいて回復+3・燃焼を2消す', from: f }] : []; },
      rule: '↓1 真下に[火]があると、回復+3、自分の燃焼を2消す' },
    { id: 'haguruma', name: '歯車', yomi: 'はぐるま', mark: '歯', rar: 1, cost: 2, shape: 'o1', color: COL.brass, tags: ['歯車', '鉄'],
      gear: 1, rule: '歯車1枚。⇄ 同じ段の前後左右でかみ合って「歯車列」になる。列にふれた道具は、列の枚数×6%速くなる' },
    { id: 'jiku', name: '軸', yomi: 'じく', mark: '軸', rar: 1, cost: 2, shape: 'i2v', color: COL.brass, tags: ['歯車', '木'],
      gear: 1, rule: '歯車1枚。縦に立てると、上と下の段の歯車列をひとつにつなぐ' },
    { id: 'hibachi', name: '火鉢', yomi: 'ひばち', mark: '火', rar: 1, cost: 3, shape: 'o1', color: COL.fire, tags: ['火'],
      aura: [{ range: 'up', reach: 1, tag: '武器', mod: { dmg: 2 }, text: '熱：威力+2' }],
      rule: '↑1 真上の[武器]の威力+2（熱は上へ）' },
    { id: 'toishi', name: '砥石', yomi: 'といし', mark: '砥', rar: 1, cost: 2, shape: 'o1', color: COL.stone, tags: ['石'],
      aura: [{ range: 'adj', reach: 1, tag: '刃', mod: { dmg: 1 }, text: '研いだ：威力+1' }],
      rule: '◇ となりの[刃]の威力+1' },
    { id: 'omori', name: '錘', yomi: 'おもり', mark: '錘', rar: 1, cost: 2, shape: 'o1', color: COL.stone, tags: ['鉄'],
      aura: [{ range: 'down', reach: 1, tag: '守り', mod: { block: 3 }, text: '押さえ：盾+3' }, { range: 'down', reach: 1, id: 'bane', mod: { spd: 0.5 }, text: '押し込み：速さ+50%' }],
      rule: '↓1 真下の[守り]の盾+3。真下のばねは速さ+50%' },
    { id: 'zeni', name: '銭箱', yomi: 'ぜにばこ', mark: '銭', rar: 1, cost: 3, sell: 2, shape: 'o1', color: COL.luck, tags: ['木', '縁起'],
      econ: 1, rule: '箱に入れておくと、品書きのたびに1文ふえる（仮置き台ではふえない）' },

    // ---------------- 上 ----------------
    { id: 'katana', name: '刀', yomi: 'かたな', mark: '刀', rar: 2, cost: 6, shape: 'i3', color: COL.steel, tags: ['武器', '刃', '鉄'],
      cd: 1.8, act: { dmg: 6 }, text: '研ぎと熱で化ける。' },
    { id: 'yumi', name: 'からくり弓', yomi: 'からくりゆみ', mark: '弓', rar: 2, cost: 6, shape: 'l3', color: COL.wood, tags: ['武器', '飛', '木'],
      cd: 2.0, act: { dmg: 5 },
      self(p, c) { return c.isTop(p) ? [{ mod: { dmgPct: 0.6 }, text: '最上段：高みから射る 威力+60%' }] : []; },
      rule: '箱の最上段にあると、威力+60%' },
    { see: [['down', 1]], id: 'hifuki', name: '火吹き竹', yomi: 'ひふきだけ', mark: '吹', rar: 2, cost: 5, shape: 'i2', color: COL.fire, tags: ['火', '木'],
      cd: 1.8, act: { burn: 1 },
      self(p, c) { const f = c.below(p).filter((q) => c.has(q, '火')); return f.length ? [{ mod: { burn: 1 }, text: '↓1 真下に火：燃焼+1', from: f }] : []; },
      rule: '↓1 真下に[火]があると、燃焼+1' },
    { see: [['up', 1]], id: 'teppan', name: '鉄板', yomi: 'てっぱん', mark: '鉄', rar: 2, cost: 6, shape: 'o4', color: COL.guard, tags: ['守り', '鉄'],
      cd: 3.0, act: { block: 7 },
      self(p, c) { const a = c.above(p), n = a.length; return n ? [{ mod: { block: n }, text: `↑1 上に載った道具${n}つ：盾+${n}`, from: a }] : []; },
      rule: '↑1 上に載っている道具1つにつき、盾+1' },
    { see: [['up', 1]], id: 'bane', name: 'ばね', yomi: 'ばね', mark: '跳', rar: 2, cost: 5, shape: 'o1', color: COL.kara, tags: ['からくり', '鉄'],
      cd: 2.0, act: { kick: 0.5 }, rule: '↑1 発動すると、真上の道具を0.5秒ぶん早める' },
    { see: [['adj', 1]], id: 'abura', name: '油差し', yomi: 'あぶらさし', mark: '油', rar: 2, cost: 5, shape: 'o1', color: COL.kara, tags: ['からくり'],
      cd: 4.0, act: { oil: 1 },
      self(p, c) { const g = c.inRange(p, 'adj').filter((q) => c.has(q, '歯車')); return g.length ? [{ mod: { oil: 1 }, text: '◇ となりに歯車：油+1', from: g }] : []; },
      rule: '油を1さす（油1つにつき箱ぜんぶが4%速くなる）。◇ となりに[歯車]があると油+1' },
    { id: 'oke', name: '水桶', yomi: 'みずおけ', mark: '水', rar: 2, cost: 5, shape: 'i2', color: COL.water, tags: ['水', '木'],
      aura: [
        { range: 'down', reach: 99, tag: '木', mod: { spd: 0.25 }, text: 'しずく：速さ+25%' },
        { range: 'down', reach: 99, tag: '鉄', not: '木', mod: { spd: -0.15 }, text: '錆びる：速さ−15%', neg: true },
      ],
      rule: '↓∞ 下にある[木]の速さ+25%。[鉄]は錆びて速さ−15%。下の水車を回す' },
    { id: 'ro', name: '炉', yomi: 'ろ', mark: '炉', rar: 2, cost: 6, shape: 'o1', color: COL.fire, tags: ['火', '石'],
      aura: [{ range: 'up', reach: 2, tag: '武器', mod: { dmg: 2 }, text: '炉の熱：威力+2' }, { range: 'up', reach: 2, tag: '火', mod: { spd: 0.25 }, text: '炉の熱：速さ+25%' }],
      rule: '↑2 上2マスの[武器]の威力+2、[火]の速さ+25%' },
    { id: 'horoku', name: '焙烙玉', yomi: 'ほうろくだま', mark: '玉', rar: 2, cost: 5, shape: 'o1', color: COL.fire, tags: ['武器', '火', '飛'],
      cd: 2.6, act: { dmg: 3, burn: 2 }, text: '素焼きの玉に火薬をつめたもの。' },
    { id: 'hiraishin', name: '避雷針', yomi: 'ひらいしん', mark: '針', rar: 2, cost: 5, shape: 'i2v', color: COL.bolt, tags: ['雷', '鉄'],
      aura: [{ range: 'col', reach: 99, tag: '雷', mod: { dmgPct: 0.5, stun: 0.3 }, text: '↕ 避雷針：雷の威力+50%・しびれ+0.3秒' }],
      rule: '↕ 同じ縦一列の[雷]の威力+50%、しびれ+0.3秒。最上段にあると、相手の雷をここに引きよせる（ほかはしびれない）' },
    { see: [['adj', 1]], id: 'kusuri', name: '薬箱', yomi: 'くすりばこ', mark: '薬', rar: 2, cost: 6, shape: 'i2', color: COL.guard, tags: ['薬', '木'],
      cd: 3.5, act: { heal: 6 },
      self(p, c) { const w = c.inRange(p, 'adj').filter((q) => c.has(q, '水')), n = w.length; return n ? [{ mod: { heal: 2 * n }, text: `◇ となりの水${n}つ：回復+${2 * n}`, from: w }] : []; },
      rule: '◇ となりの[水]1つにつき、回復+2' },
    { see: [['up', 1]], id: 'suisha', name: '水車', yomi: 'すいしゃ', mark: '車', rar: 2, cost: 5, shape: 'o4v', color: COL.brass, tags: ['歯車', '木'],
      gear: 2, gearWet: 5, rule: '歯車2枚。↑1 真上に[水]があると回りだして、歯車5枚ぶん' },

    // ---------------- 特 ----------------
    { id: 'ozutsu', name: '大筒', yomi: 'おおづつ', mark: '砲', rar: 3, cost: 9, shape: 'l4', color: COL.steel, tags: ['武器', '飛', '鉄'],
      cd: 4.0, act: { dmg: 15 },
      self(p, c) { return c.isBottom(p) ? [{ mod: { spd: 0.3 }, text: '最下段：据え置き 速さ+30%' }] : []; },
      rule: '箱の最下段にあると、速さ+30%' },
    { id: 'raidaiko', name: '雷太鼓', yomi: 'かみなりだいこ', mark: '雷', rar: 3, cost: 10, shape: 't4', color: COL.bolt, tags: ['雷', '木'],
      cd: 3.6, act: { bolt: { dmg: 4, stun: 1.2, n: 1 } }, rule: '相手の箱の、道具がいちばん多い縦一列に雷。威力4、その列の道具を1.2秒しびれさせる' },
    { id: 'ereki', name: 'エレキテル', yomi: 'えれきてる', mark: '電', rar: 3, cost: 9, shape: 'tri', color: COL.bolt, tags: ['雷', 'からくり'],
      cd: 2.2, act: { zap: { dmg: 2, stun: 0.8 } }, gearTwice: true, rule: '相手の道具1つを0.8秒しびれさせ、威力2。歯車列から受ける速さが2倍' },
    { id: 'rendo', name: '連弩', yomi: 'れんど', mark: '弩', rar: 3, cost: 10, shape: 's4', color: COL.wood, tags: ['武器', '飛', '木'],
      cd: 0.9, act: { dmg: 2 },
      self(p, c) { return c.isTop(p) ? [{ mod: { dmg: 1 }, text: '最上段：威力+1' }] : []; },
      rule: '休まず撃つ。箱の最上段にあると威力+1' },
    { id: 'ooguruma', name: '大歯車', yomi: 'おおぐるま', mark: '輪', rar: 3, cost: 8, shape: 'o4', color: COL.brass, tags: ['歯車', '鉄'],
      gear: 6, rule: '歯車6枚ぶん。⇄ 同じ段でかみ合う' },
    { id: 'tatami', name: '畳', yomi: 'たたみ', mark: '畳', rar: 3, cost: 8, shape: 'i3', color: COL.guard, tags: ['守り', '木'],
      cd: 5.0, act: { block: 5 }, start: { block: 14 },
      self(p, c) { return c.isBottom(p) ? [{ mod: { startBlock: 6 }, text: '最下段：はじめの盾+6' }] : []; },
      rule: '戦いのはじめに盾14。箱の最下段にあると、はじめの盾+6' },
    { see: [['down', 1]], id: 'hanabi', name: '花火筒', yomi: 'はなびづつ', mark: '花', rar: 3, cost: 9, shape: 'i3v', color: COL.fire, tags: ['火', '飛'],
      cd: 3.5, act: { dmg: 4, burn: 2 },
      self(p, c) {
        const r = [];
        if (c.standing(p)) r.push({ mod: { burn: 2 }, text: '立てて置いた：燃焼+2' });
        const f = c.below(p).filter((q) => c.has(q, '火'));
        if (f.length) r.push({ mod: { spd: 0.4 }, text: '↓1 真下に火：速さ+40%', from: f });
        return r;
      },
      rule: '縦に立てると燃焼+2。↓1 真下に[火]があると速さ+40%' },

    // ---------------- 極 ----------------
    { id: 'kamado', name: '竈', yomi: 'かまど', mark: '竈', rar: 4, cost: 13, shape: 'o4', color: COL.fire, tags: ['火', '石'],
      aura: [{ range: 'up', reach: 99, tag: '武器', mod: { dmg: 3 }, text: '竈の熱：威力+3' }, { range: 'up', reach: 99, tag: '火', mod: { spd: 0.3 }, text: '竈の熱：速さ+30%' }],
      rule: '↑∞ 上にあるすべての[武器]の威力+3、[火]の速さ+30%' },
    { id: 'raijin', name: '雷神太鼓', yomi: 'らいじんだいこ', mark: '神', rar: 4, cost: 14, shape: 'scr', color: COL.bolt, tags: ['雷'],
      cd: 3.0, act: { bolt: { dmg: 5, stun: 1.2, n: 2 } }, rule: '相手の箱の縦二列に雷。それぞれ威力5、1.2秒しびれ' },
    { id: 'tokei', name: 'からくり時計', yomi: 'からくりどけい', mark: '時', rar: 4, cost: 13, shape: 'tri', color: COL.brass, tags: ['歯車', 'からくり'],
      gear: 3, cd: 6.0, act: { tick: 1.0 }, rule: '歯車3枚ぶん。6秒ごとに、自分の箱の道具ぜんぶを1秒ぶん早める' },

    // ---------------- 合体でしか手に入らない ----------------
    { id: 'homura', name: '名刀・火群', yomi: 'めいとう ほむら', mark: '焔', rar: 4, cost: 16, shape: 'i3', color: COL.legend, tags: ['武器', '刃', '鉄', '火'], only: 'recipe',
      cd: 1.6, act: { dmg: 10, burn: 1 }, text: '炉の熱と砥石で打ち直された刀。斬るたびに火がつく。' },
    { id: 'horokuzutsu', name: '焙烙砲', yomi: 'ほうろくづつ', mark: '爆', rar: 4, cost: 16, shape: 'l4', color: COL.legend, tags: ['武器', '飛', '火', '鉄'], only: 'recipe',
      cd: 3.8, act: { dmg: 15, burn: 3 },
      self(p, c) { return c.isBottom(p) ? [{ mod: { spd: 0.3 }, text: '最下段：据え置き 速さ+30%' }] : []; },
      rule: '箱の最下段にあると、速さ+30%', text: '大筒に焙烙玉をつめた。' },
    { id: 'kashi', name: '樫の大盾', yomi: 'かしのおおたて', mark: '樫', rar: 3, cost: 10, shape: 'o4v', color: COL.guard, tags: ['守り', '木'], only: 'recipe',
      cd: 2.6, act: { block: 11 }, text: '二枚の板を重ねて、樫の盾にした。' },
    { id: 'wakatake', name: '若竹槍', yomi: 'わかたけやり', mark: '竹', rar: 3, cost: 8, shape: 'i3v', color: COL.guard, tags: ['武器', '刃', '木'], only: 'recipe',
      cd: 2.0, act: { dmg: 5 }, grows: 1, growMax: 12,
      self(p, c) { return c.standing(p) ? [{ mod: { spd: 0.4 }, text: '立てて置いた：速さ+40%' }] : []; },
      rule: '戦うたびに威力+1ずつ育つ（+12まで）。縦に立てると速さ+40%' },
    { id: 'kazaguruma', name: '風車手裏剣', yomi: 'かざぐるましゅりけん', mark: '風', rar: 3, cost: 9, shape: 'i3v', color: COL.steel, tags: ['武器', '飛', '鉄'], only: 'recipe',
      cd: 1.0, act: { dmg: 2, hits: 2 }, text: '三枚重ねの手裏剣。一度に二度当たる。' },

    // ---------------- ひみつ ----------------
    { id: 'maneki', name: '招き猫', yomi: 'まねきねこ', mark: '猫', rar: 2, cost: 4, sell: 4, shape: 'o1', color: COL.luck, tags: ['縁起'], only: 'secret',
      aura: [{ range: 'adj', reach: 1, test: (d) => !!d.cd, mod: { spd: 0.05 }, text: '招き：速さ+5%' }],
      win: 2, rule: '箱に入れて勝つと、2文ふえる。◇ となりの道具の速さ+5%' },
  ];

  const DEF = {};
  ITEMS.forEach((d) => { DEF[d.id] = d; });

  /* 合体（積み合わせ）。見つけるまで、からくり帖では題だけが見える */
  const RECIPES = [
    { id: 'homura', to: 'homura', title: '焼き入れ', hint: '炉の上で、砥石のとなりにある刀', text: '刀の↓1 真下に炉、◇ となりに砥石があると、名刀になる（炉と砥石は残る）' },
    { id: 'ooguruma', to: 'ooguruma', title: '四枚合わせ', hint: '同じ段で、四角くならんだ歯車', text: '同じ段で2×2の四角にならべた歯車4つが、大歯車になる' },
    { id: 'kashi', to: 'kashi', title: '二枚重ね', hint: 'ぴったり重なった木の板', text: '木の板の真上に、同じ向きの木の板をぴったり重ねると、樫の大盾になる' },
    { id: 'horokuzutsu', to: 'horokuzutsu', title: '弾ごめ', hint: '大筒にふれた焙烙玉', text: '大筒の◇ となりに焙烙玉があると、ひとつになって焙烙砲になる' },
    { id: 'wakatake', to: 'wakatake', title: '水やり', hint: '立てた竹槍に、上から水', text: '縦に立てた竹槍の↑1 真上に水桶があると、若竹槍になる（水桶は残る）' },
    { id: 'kazaguruma', to: 'kazaguruma', title: '三枚重ね', hint: '縦に積んだ手裏剣', text: '十字手裏剣を縦に3つ積むと、風車手裏剣になる' },
  ];

  /* 流派（はじめに選ぶ） */
  const SCHOOLS = [
    { id: 'kamado', name: 'かまど流', mark: '炎', color: '#E4582F', start: ['hibachi', 'bokken'], tag: '火',
      perk: '[火]の熱（↑の効果）が、1マス高くまで届く', desc: '下に火を置き、その上に武器を積む。' },
    { id: 'izumi', name: 'いずみ流', mark: '泉', color: '#2F87CB', start: ['kyusu', 'takeyari'], tag: '水',
      perk: '回復の量が1.3倍', desc: '上から水をしたたらせ、木を育てて長く戦う。' },
    { id: 'karakuri', name: 'からくり流', mark: '歯', color: '#B98E1E', start: ['haguruma', 'haguruma', 'shuriken'], tag: '歯車',
      perk: '歯車列の速さが、1枚あたり6%→8%', desc: '同じ段に歯車をならべ、まわりをまとめて速くする。' },
    { id: 'kaminari', name: 'かみなり流', mark: '鳴', color: '#7D55C8', start: ['hiraishin', 'kugi'], tag: '雷', locked: true,
      perk: 'しびれの時間+0.4秒', desc: '相手の縦一列を止めて、そのすきに打つ。（一度天守に勝つとえらべる）' },
  ];

  /* 相手（人は出さない。箱と紋だけ） */
  const RIVALS = {
    fire: { tags: ['火', '武器'], names: [['かまど組', '竈'], ['火の見櫓', '櫓'], ['焔屋', '焔']] },
    water: { tags: ['水', '木', '薬'], names: [['井戸端の箱', '井'], ['しずく堂', '滴'], ['竹林庵', '竹']] },
    gear: { tags: ['歯車', 'からくり'], names: [['からくり長屋', '歯'], ['歯車座', '輪'], ['ぜんまい屋', '巻']] },
    bolt: { tags: ['雷'], names: [['鳴神屋', '鳴'], ['稲妻組', '稲']] },
    blade: { tags: ['刃', '石'], names: [['研ぎ師の箱', '砥'], ['刃物町', '刃'], ['鍛冶屋横丁', '鎚']] },
    guard: { tags: ['守り', '鉄'], names: [['蔵屋敷', '蔵'], ['亀甲組', '亀'], ['石垣屋', '垣']] },
  };

  const RAR = [
    null,
    { name: '並', color: '#8A8174' },
    { name: '上', color: '#2F7FB8' },
    { name: '特', color: '#8C4FC4' },
    { name: '極', color: '#C8372D' },
  ];

  HK.data = { SHAPES, ITEMS, DEF, RECIPES, SCHOOLS, RIVALS, RAR, TAGS, COL };
})(typeof window !== 'undefined' ? window : globalThis);
