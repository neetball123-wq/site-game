/* ことだま短冊 — 物の怪・御守り・道具・言い伝え
   どれも配列に1件足せば増やせる。 */
(function (G) {
  'use strict';
  const KD = G.KD;

  // 言い伝えに出てくる言葉の追加（店には出ない）
  KD.addWords(`
まける 負ける v1 1 - op=atk;vi;sb=anim;p=0
とる 取る v5 3 - op=call;p=0
`, 'base');

  /* ---------- 言い伝え（ことわざ・名句） ----------
     seq は言葉（短冊）の並び。| はどれでもよい。助詞・活用はなんでもよい */
  KD.SAYINGS = [
    { id: 'neko', kind: 'ことわざ', text: '猫に小判', seq: ['猫', '小判'] },
    { id: 'hana', kind: 'ことわざ', text: '花より団子', seq: ['花', '団子'] },
    { id: 'oni', kind: 'ことわざ', text: '鬼に金棒', seq: ['鬼', '金棒'] },
    { id: 'saru', kind: 'ことわざ', text: '猿も木から落ちる', seq: ['猿', '木', '落ちる'] },
    { id: 'ishi', kind: 'ことわざ', text: '石の上にも三年', seq: ['石', '上', '三年'] },
    { id: 'inu', kind: 'ことわざ', text: '犬も歩けば棒に当たる', seq: ['犬', '歩く', '棒', '当たる'] },
    { id: 'ame', kind: 'ことわざ', text: '雨降って地固まる', seq: ['雨', '降る', '地', '固まる'] },
    { id: 'todai', kind: 'ことわざ', text: '灯台下暗し', seq: ['灯台', '下/もと|下', '暗い'] },
    { id: 'tsuki', kind: 'ことわざ', text: '月とすっぽん', seq: ['月', '鼈'] },
    { id: 'buta', kind: 'ことわざ', text: '豚に真珠', seq: ['豚', '真珠'] },
    { id: 'uma', kind: 'ことわざ', text: '馬の耳に念仏', seq: ['馬', '耳', '念仏'] },
    { id: 'chiri', kind: 'ことわざ', text: '塵も積もれば山となる', seq: ['塵', '積もる', '山', '成る'] },
    { id: 'kado', kind: 'ことわざ', text: '笑う門には福来る', seq: ['笑う', '門/かど|門', '福', '来る'] },
    { id: 'kemuri', kind: 'ことわざ', text: '火のないところに煙は立たぬ', seq: ['火', '所', '煙', '立つ'] },
    { id: 'isoga', kind: 'ことわざ', text: '急がば回れ', seq: ['急ぐ', '回る'] },
    { id: 'senri', kind: 'ことわざ', text: '千里の道も一歩から', seq: ['千里', '道', '一歩'] },
    { id: 'kawazu', kind: 'ことわざ', text: '井の中の蛙', seq: ['井', '中', '蛙|蛙/かわず'] },
    { id: 'kaeru', kind: 'ことわざ', text: '蛙の子は蛙', seq: ['蛙|蛙/かわず', '子', '蛙|蛙/かわず'] },
    { id: 'suzume', kind: 'ことわざ', text: '雀の涙', seq: ['雀', '涙'] },
    { id: 'toki', kind: 'ことわざ', text: '時は金なり', seq: ['時', '金'] },
    { id: 'take', kind: 'ことわざ', text: '竹に雀', seq: ['竹', '雀'] },
    { id: 'ume', kind: 'ことわざ', text: '梅に鶯', seq: ['梅', '鶯'] },
    { id: 'tsuru', kind: 'ことわざ', text: '鶴は千年、亀は万年', seq: ['鶴', '千', '亀', '万'] },
    { id: 'onime', kind: 'ことわざ', text: '鬼の目にも涙', seq: ['鬼', '目', '涙'] },
    { id: 'basho1', kind: '名句', text: '古池や 蛙飛び込む 水の音（芭蕉）', seq: ['古池', '蛙/かわず|蛙', '飛び込む', '水', '音'] },
    { id: 'basho2', kind: '名句', text: '閑かさや 岩にしみ入る 蝉の声（芭蕉）', seq: ['閑かさ|静けさ', '岩', '染み入る', '蝉', '声'] },
    { id: 'shiki', kind: '名句', text: '柿食へば 鐘が鳴るなり 法隆寺（子規）', seq: ['柿', '食う|食べる', '鐘', '鳴る', '法隆寺'] },
    { id: 'buson', kind: '名句', text: '菜の花や 月は東に 日は西に（蕪村）', seq: ['菜の花', '月', '東', '日', '西'] },
    { id: 'issa1', kind: '名句', text: 'やせ蛙 負けるな一茶 これにあり（一茶）', seq: ['蛙|蛙/かわず', '負ける', '一茶', 'これ'] },
    { id: 'issa2', kind: '名句', text: '名月を 取ってくれろと 泣く子かな（一茶）', seq: ['月', '取る', '泣く', '子'] },
  ];

  /* ---------- 物の怪 ----------
     ch 季節（0春 1夏 2秋 3冬）、tier 0小物 1中物 2大物。weak 苦手（力×2）、resist 得意（力×½）
     trick はその物の怪の技。tags は倒したあともらえる「名の短冊」の性質 */
  KD.ENEMIES = [
    { id: 'kitsunebi', name: '狐火', y: 'きつねび', ch: 0, tier: 0, weak: ['水', '氷'], resist: ['火'], tags: ['火', '妖', '闇'],
      lore: '野の向こうで、だれも持っていない灯がゆれる。' },
    { id: 'karakasa', name: '唐傘おばけ', y: 'からかさおばけ', ch: 0, tier: 1, weak: ['風', '火'], resist: ['雨', '水'], tags: ['妖', '雨', '布', '具'],
      trick: { id: 'ban_tag', tag: '雨', text: '雨の言葉は、傘にはじかれる（力0）' }, lore: '捨てられた傘は、百年たつと跳ねまわる。' },
    { id: 'bakezakura', name: '化け桜', y: 'ばけざくら', ch: 0, tier: 2, weak: ['風', '火'], resist: ['草', '春'], tags: ['妖', '草', '春', '美'],
      trick: { id: 'fall', n: 1, text: '詠むたびに、手札が一枚散る' }, lore: '満開のまま、もう何年も散らない桜。' },
    { id: 'chochin', name: '提灯おばけ', y: 'ちょうちんおばけ', ch: 1, tier: 0, weak: ['水', '風'], resist: ['火', '光'], tags: ['妖', '光', '紙', '夏'],
      lore: '祭りのあとの、消し忘れた提灯。' },
    { id: 'ogama', name: '大蝦蟇', y: 'おおがま', ch: 1, tier: 1, weak: ['火', '鳥'], resist: ['水'], tags: ['妖', '水', '獣', '大'],
      trick: { id: 'min_mora', n: 9, text: '九音より短い文は、ひと呑みにされる（0点）' }, lore: '池の主。声の小さい言葉は、みんな呑みこむ。' },
    { id: 'umibozu', name: '海坊主', y: 'うみぼうず', ch: 1, tier: 2, weak: ['光', '雷'], resist: ['水'], tags: ['妖', '水', '大', '闇'],
      trick: { id: 'ban_p', p: ['を'], text: '「を」が波にさらわれて、使えない' }, lore: '凪の夜、黒い頭が海からのぞく。' },
    { id: 'kamaitachi', name: '鎌鼬', y: 'かまいたち', ch: 2, tier: 0, weak: ['土', '石', '重'], resist: ['風', '鋭'], tags: ['妖', '風', '鋭', '獣'],
      trick: { id: 'long_half', n: 4, text: '四音以上の言葉は、切り裂かれて力が半分' }, lore: 'つむじ風の中に、見えない鎌。' },
    { id: 'tsuchigumo', name: '土蜘蛛', y: 'つちぐも', ch: 2, tier: 1, weak: ['火', '光'], resist: ['土', '闇'], tags: ['妖', '土', '虫', '怖'],
      trick: { id: 'dup_zero', text: 'この戦いで一度使った言葉は、糸にからめとられる（力0）' }, lore: '古い塚の下で、糸を張って待っている。' },
    { id: 'ungaikyo', name: '雲外鏡', y: 'うんがいきょう', ch: 2, tier: 1, secret: true, weak: ['光'], resist: [], tags: ['妖', '光', '具'],
      trick: { id: 'kaibun_only', text: '回文でない文は、鏡に映って半分' }, lore: '映したものを、さかさに返す古い鏡。回文を詠んだ者の前にだけ現れる。' },
    { id: 'nue', name: '鵺', y: 'ぬえ', ch: 2, tier: 2, weak: 'shift', resist: [], tags: ['妖', '雷', '闇', '獣'],
      trick: { id: 'shift_kata', text: '詠むたびに苦手が変わる。型のない文は半分' }, lore: '猿の顔、狸の胴、虎の手足、蛇の尾。正体の定まらないもの。' },
    { id: 'shirouneri', name: '白うねり', y: 'しろうねり', ch: 3, tier: 0, weak: ['火', '熱'], resist: ['氷', '冷'], tags: ['妖', '氷', '布', '冬'],
      trick: { id: 'no_discard', text: '書き直しができない' }, lore: '古い雑巾が、竜のようにうねる。' },
    { id: 'gashadokuro', name: 'がしゃどくろ', y: 'がしゃどくろ', ch: 3, tier: 1, weak: ['光', '火'], resist: ['闇', '死'], tags: ['妖', '死', '大', '怖'],
      trick: { id: 'min_pow', n: 3, text: '力が3に届かない言葉は、数えない' }, lore: '夜道に、骨の鳴る音がする。' },
    { id: 'kotodamagui', name: '言霊喰い', y: 'ことだまぐい', ch: 3, tier: 2, final: true, weak: ['言', '心', '神'], resist: ['闇'], tags: ['妖', '言', '闇'],
      trick: { id: 'eat', text: 'いちばん使いこんだ言葉から、喰われていく' }, lore: 'だれにも使われなくなった言葉を食べて、大きくなったもの。' },
  ];
  // 名の短冊（倒すともらえる）。はさみで切れば「かま」「いたち」にもなる
  KD.addWords(KD.ENEMIES.map((e) => `${e.y} ${e.name} n ${6 + e.tier * 3 + e.ch * 2} ${e.tags.join(',')} p=0`).join('\n'), 'mononoke');

  // 必要な点（季節×物の怪の格）。冬の大物のあとは「百鬼夜行」として上限なしに増える
  KD.TARGETS = [[100, 170, 280], [450, 750, 1250], [2600, 4400, 7300], [12600, 21000, 36400]];
  KD.target = (ch, tier) => {
    if (ch < 4) return KD.TARGETS[ch][tier];
    const k = (ch - 4) * 3 + tier + 1;
    return 36400 * Math.pow(2.6, k);
  };
  KD.SEASON_NAME = ['春', '夏', '秋', '冬'];

  /* ---------- 御守り ----------
     hand/plays/discards/shop：数をふやす。card(t, ctx)→{x:倍, a:足す}。add/mul(an,ctx)→数。wz：技ごとの倍率 */
  const tagX = (tag, x) => (t) => (t.w.tags.includes(tag) || (t.fx || []).includes(tag) ? { x } : null);
  KD.RELICS = [
    { id: 'kigocho', name: '季語帳', price: 6, desc: '季語の技が2倍', wz: { kigo: 2 } },
    { id: 'suzu', name: '韻の鈴', price: 7, desc: '韻の技が2倍', wz: { rhyme: 2 } },
    { id: 'makimono', name: '長い巻物', price: 7, desc: '文の音の数10ごとに +1倍（上限なし）', add: (an) => Math.floor(an.mora / 10) },
    { id: 'awasekagami', name: '合わせ鏡', price: 8, desc: '回文と対句の技が2倍', wz: { kaibun: 2, tsuiku: 2 } },
    { id: 'kitsune', name: '狐の尻尾', price: 6, desc: 'しりとりの技が2倍', wz: { shiritori: 2 } },
    { id: 'manekineko', name: '招き猫', price: 6, desc: '詠むたびに 1銭', onPlay: (run) => { run.zeni += 1; } },
    { id: 'fudezuka', name: '筆塚', price: 7, desc: '言葉がかすれにくくなる（かすれ半分）', wear: 0.5 },
    { id: 'furuike', name: '古池の石', price: 6, desc: '体言止めが2倍、切れ字が1.5倍', wz: { taigen: 2, kireji: 1.5 } },
    { id: 'kanabo', name: '鬼の金棒', price: 8, desc: '祓う動詞（切る・燃やす など）の力が2倍', card: (t) => (t.cat === 'V' && t.w.op === 'atk' ? { x: 2 } : null) },
    { id: 'men', name: '擬人の面', price: 6, desc: '擬人法が3倍', wz: { gijin: 3 } },
    { id: 'amanojaku', name: '天邪鬼', price: 7, desc: '「ない」を使った文は ×2倍', mul: (an) => (an.T.some((t) => t.p === 'ない') ? 2 : 1) },
    { id: 'tanabata', name: '七夕の短冊', price: 8, desc: '手札 +1枚', hand: 1 },
    { id: 'sumitsubo', name: '墨壺', price: 6, desc: '書き直し +1回', discards: 1 },
    { id: 'hyoshigi', name: '拍子木', price: 9, desc: '詠む +1回', plays: 1 },
    { id: 'kotodamaishi', name: '言霊石', price: 7, desc: 'まだ一度も使っていない言葉は、力×3', card: (t, ctx) => ((ctx.run.wear[t.w.id] || 0) === 0 ? { x: 3 } : null) },
    { id: 'tsuinoogi', name: '対の扇', price: 6, desc: '隠喩と対句が2倍', wz: { inyu: 2, tsuiku: 2 } },
    { id: 'daruma', name: '起き上がり達磨', price: 6, desc: 'その戦いの最後の一句は ×2倍', mul: (an, ctx) => (ctx.fight && ctx.fight.plays === 1 ? 2 : 1) },
    { id: 'senbazuru', name: '千羽鶴', price: 5, desc: '鳥の言葉の力 +8', card: (t) => (t.w.tags.includes('鳥') ? { a: 8 } : null) },
    { id: 'hibachi', name: '火鉢', price: 6, desc: '火の言葉の力×2', card: tagX('火', 2) },
    { id: 'furin', name: '風鈴', price: 6, desc: '風の言葉の力×2', card: tagX('風', 2) },
    { id: 'mizukagami', name: '水鏡', price: 6, desc: '水の言葉の力×2', card: tagX('水', 2) },
    { id: 'raidaiko', name: '雷太鼓', price: 6, desc: '雷の言葉の力×2', card: tagX('雷', 2) },
    { id: 'toro', name: '灯籠', price: 6, desc: '光の言葉の力×2', card: tagX('光', 2) },
    { id: 'yogi', name: '夜着', price: 6, desc: '闇の言葉の力×2', card: tagX('闇', 2) },
    { id: 'dorei', name: '土鈴', price: 6, desc: '土の言葉の力×2', card: tagX('土', 2) },
    { id: 'himuro', name: '氷室', price: 6, desc: '氷の言葉の力×2', card: tagX('氷', 2) },
    { id: 'jisho', name: '古い辞書', price: 6, desc: '店に並ぶ言葉 +1', shop: 1 },
    { id: 'mangekyo', name: '万華鏡', price: 7, desc: '気まぐれの「相性」が2倍', aisho: 2, rand: true },
    { id: 'kobanyama', name: '小判の山', price: 7, desc: '利子が 5銭ごとに1銭（ふだんは10銭ごと）', interest: 5 },
    { id: 'sugoroku', name: '双六', price: 8, desc: '詠むたびに、この御守りの倍が +0.2 ずつ増えていく（上限なし）', add: (an, ctx) => (ctx.run.cnt.sugoroku || 0) * 0.2, onPlay: (run) => { run.cnt.sugoroku = (run.cnt.sugoroku || 0) + 1; } },
    { id: 'suzumenoyado', name: '雀のお宿', price: 6, desc: '二音以下の言葉は、力×3', card: (t) => (t.m <= 2 ? { x: 3 } : null) },
    { id: 'odaiko', name: '大太鼓', price: 6, desc: '四音以上の言葉は、力×2', card: (t) => (t.m >= 4 ? { x: 2 } : null) },
    { id: 'chabashira', name: '茶柱', price: 5, desc: '四回に一回くらい、×4倍', mul: (an, ctx) => (ctx.roll < 0.25 ? 4 : 1) },
    { id: 'hyakumonogatari', name: '百物語', price: 6, desc: '怖・妖・闇の言葉ひとつにつき +1倍', add: (an) => an.T.filter((t) => t.w && ['怖', '妖', '闇'].some((x) => t.w.tags.includes(x))).length },
    { id: 'takarabune', name: '宝船', price: 7, desc: '大物を祓ったときの銭が2倍', bossZeni: 2 },
    { id: 'hagoromo', name: '羽衣', price: 5, desc: '軽い言葉の力 +5', card: (t) => (t.w.tags.includes('軽') ? { a: 5 } : null) },
    { id: 'kanzashi', name: '簪', price: 5, desc: '美しい言葉の力 +4', card: (t) => (t.w.tags.includes('美') ? { a: 4 } : null) },
    { id: 'sakazuki', name: '三つ組の盃', price: 6, desc: '言葉がちょうど三つの文は ×1.5倍', mul: (an) => (an.T.filter((t) => t.k === 'w').length === 3 ? 1.5 : 1) },
    { id: 'akaito', name: '赤い糸', price: 5, desc: '「と」でつないだ言葉ひとつにつき +2倍', add: (an) => an.T.filter((t) => t.coord).length * 2 },
    { id: 'kakejiku', name: '掛け軸', price: 8, desc: '型（俳句・短歌など）の技が1.5倍', wz: { haiku: 1.5, tanka: 1.5, katauta: 1.5, dodoitsu: 1.5, sedoka: 1.5, choka: 1.5 } },
    { id: 'mokugyo', name: '木魚', price: 6, desc: '助詞ひとつにつき +0.5倍', add: (an) => an.T.filter((t) => t.cat === 'P').length * 0.5 },
    { id: 'kotoage', name: '言挙げの笛', price: 7, desc: '名指しの技が2倍。物の怪の名の短冊の力×2', wz: { nazashi: 2 }, card: (t) => (t.w.pack === 'mononoke' ? { x: 2 } : null) },
  ];

  /* ---------- 道具 ---------- */
  KD.TOOLS = [
    { id: 'hasami', name: 'はさみ', price: 3, desc: '手札の短冊を、音のさかいめで二つに切る' },
    { id: 'nori', name: 'のり', price: 3, desc: '手札の短冊を二枚つなげて、一枚にする（辞書になければ新しい言葉になる）' },
    { id: 'fude', name: '筆', price: 3, desc: '同じ音の、別の言葉に書きかえる（はし→橋・箸）' },
    { id: 'keshigomu', name: '消しゴム', price: 2, desc: '束から短冊を一枚、消す' },
    { id: 'utsushi', name: '写し紙', price: 4, desc: '手札の短冊を一枚、写して束に足す' },
    { id: 'shuniku', name: '朱肉', price: 3, desc: '手札の短冊に、元素（火・水・風…）をひとつ押す' },
    { id: 'sumi', name: '墨', price: 2, desc: '手札の言葉のかすれを、すべて戻す' },
    { id: 'shiori', name: '栞', price: 4, desc: 'この戦いだけ、詠む +1回' },
  ];

  // はじめの束（24枚）
  KD.START = ['雪', '花', '月', '風', '火', '水', '石', '鳥', '夜', '心', '春', '空', '切る', '投げる', '燃やす', '咲く', '降る', '歌う', '光る', '白い', '赤い', '静か', '大きな', 'そっと'];
})(typeof window !== 'undefined' ? window : globalThis);
