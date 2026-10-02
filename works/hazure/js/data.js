/* ハズレスキル【合成】 — データ
   スキル・合成の隠しレシピ・魔物・地方・称号・出来事。画面には触らない。
   スキルを足すときは SKILLS に1行足すだけでよい（説明文は部品から自動で作る）。 */
(function (G) {
  'use strict';
  const HZ = (G.HZ = G.HZ || {});

  /* ---------- 属性と状態 ---------- */
  HZ.ELEM = ['火', '水', '雷', '氷', '風', '土', '光', '闇', '毒', '無'];
  HZ.ELCOL = { 火: '#ff6b4a', 水: '#4aa8ff', 雷: '#ffd23f', 氷: '#9be8ff', 風: '#6fe3a1', 土: '#d2a565', 光: '#fff1a8', 闇: '#b98cff', 毒: '#a6e04a', 無: '#cfd8e6' };
  HZ.STAT = ['燃焼', '濡れ', '冷え', '凍結', '油', '毒', '呪い'];
  // 状態の説明（図鑑・鑑定に出す）
  HZ.STAT_HELP = {
    燃焼: 'ターンの終わりに、その数だけ火のダメージ。そのあと半分に減る。',
    濡れ: '火で「蒸発」（2倍）、雷で「感電」（全体へ）、氷で「凍結」。',
    冷え: '3つたまると凍結する。',
    凍結: '次の行動を1回休む。火で「融解」（2倍）、土で「粉砕」（3倍）。',
    油: '燃焼を2倍にする（炎上）。',
    毒: 'ターンの終わりに、その数だけダメージ。減らない。盾も硬さも通りぬける。',
    呪い: '1つにつき、受けるダメージ +10%。',
  };
  // 反応（属性 × 状態）。説明は図鑑用
  HZ.REACT = {
    蒸発: '火 × 濡れ：ダメージ2倍',
    融解: '火 × 凍結：ダメージ2倍、濡れる',
    炎上: '火 × 油：燃焼が2倍',
    感電: '雷 × 濡れ：同じダメージをほかの敵全員にも',
    凍結: '氷 × 濡れ：凍らせる（1回休み）',
    粉砕: '土 × 凍結：ダメージ3倍',
    拡散: '風：前の敵の燃焼・毒・濡れを、ほかの敵にも広げる',
    消火: '水 × 燃焼：燃焼が消える（もったいない）',
  };

  /* ---------- きっかけ（いつ発動するか） ---------- */
  HZ.TRIG = {
    start: '戦いのはじめに', turn: 'ターンのはじめに', end: 'ターンの終わりに',
    atk: '通常攻撃のあとに', hit: 'ダメージを与えたとき', hurt: 'ダメージを受けたとき',
    kill: '敵を倒したとき', heal: '回復したとき', sh: '盾を得たとき', st: '敵に状態をつけたとき',
    react: '反応が起きたとき', skill: 'ほかのスキルが発動したとき', gold: 'お金を得たとき',
    sneeze: 'くしゃみをしたとき', count: '数を10数えるたびに', pick: 'なにか拾ったとき',
    sleep: '眠ったとき', bow: '土下座したとき', eat: '食べたとき', song: '歌ったとき',
  };
  // ふしぎな行動（ハズレスキルが起こす出来事）。emit の説明に使う
  HZ.EMIT = { sneeze: 'くしゃみをする', pick: 'なにか拾う', sleep: '眠る', bow: '土下座する', eat: '食べる', song: '歌う' };

  /* ---------- スキル ----------
     [id, 名前, 珍しさ(0ハズレ 1ふつう 2レア 3伝説), 合成の素材になったときの形容, きっかけ, 効果, 付記]
     効果：['dmg',属性,力,対象] 対象 f=前(省略) a=全体 l=いちばん弱っている敵 b=後ろ
           ['st',状態,数,対象] ['heal',数] ['sh',数] ['buf','力'|'魔'|'硬'|'鑑',数]
           ['emit',出来事] ['gold',数] ['charge',倍] ['echo'] ['count',数] ['self',数]
           ['grow',数] ['pgrow',数] ['maxhp',数] ['atk'] ['ret',倍] ['exe',割合] ['amp',状態,倍]
           ['bufgold',数] ['spread']
     付記：ev=n回に1回 low=HPが半分以下のときだけ tough=疲れにくさ rep=連撃の回数 drain=吸収の割合 */
  const SK = [
    // ── ハズレスキル（はじめに選ぶ。ふしぎな出来事を起こす） ──
    ['kushami', 'くしゃみ', 0, 'くしゃみの', 'turn', [['emit', 'sneeze'], ['dmg', '無', 1]], { say: '止まらない。' }],
    ['kazoeru', '数を数える', 0, '数えあげる', 'skill', [['count', 2]], { say: '何の役に立つのかは、数えた本人にもわからない。' }],
    ['mizuyari', '水やり', 0, '潤いの', 'turn', [['dmg', '水', 1], ['heal', 1]], { say: '花壇向け。' }],
    ['gomi', 'ゴミ拾い', 0, '拾いものの', 'end', [['gold', 1], ['emit', 'pick']], { say: '落ちているものは、だいたい拾える。' }],
    ['hirune', '昼寝', 0, '眠れる', 'turn', [['heal', 6], ['emit', 'sleep']], { ev: 3, say: '戦闘中でも寝られる。' }],
    ['dogeza', '土下座', 0, '平伏の', 'hurt', [['sh', 2], ['emit', 'bow']], { say: '角度には自信がある。' }],
    ['ryouri', '料理', 0, '手料理の', 'end', [['heal', 2], ['emit', 'eat']], { say: '野営飯なら任せてほしい。' }],
    ['uta', '歌', 0, '歌う', 'turn', [['emit', 'song'], ['buf', '魔', 4]], { say: 'うまいとは言っていない。' }],
    ['kantei', '鑑定', 0, '見通す', 'start', [['buf', '鑑', 1]], { say: '弱点が見える。それだけ。' }],

    // ── 火 ──
    ['kakyu', '火球', 1, '燃える', 'turn', [['dmg', '火', 4]]],
    ['chakka', '着火', 1, '火をつける', 'atk', [['dmg', '火', 2]]],
    ['hinoko', '火の粉', 1, '火の粉まじりの', 'hit:火', [['dmg', '火', 1, 'a']]],
    ['abura', '油まき', 1, '油まみれの', 'turn', [['st', '油', 1, 'a']], { ev: 2 }],
    ['tanehi', '種火', 1, '燻る', 'end', [['st', '燃焼', 3]]],
    ['bakuhatsu', '爆発', 2, '爆ぜる', 'react', [['dmg', '無', 4, 'a']]],
    ['kaen', '火炎旋風', 2, '紅蓮の', 'turn', [['dmg', '火', 4, 'a'], ['dmg', '風', 2, 'a']], { ev: 2 }],
    ['shakunetsu', '灼熱', 2, '灼熱の', 'st:燃焼', [['buf', '魔', 2]]],
    ['fushichou', '不死鳥', 3, '不死の', 'kill', [['dmg', '火', 8, 'a'], ['heal', 6]]],

    // ── 水 ──
    ['suidan', '水弾', 1, '水の', 'turn', [['dmg', '水', 3]]],
    ['kirisame', '霧雨', 1, '霧雨の', 'turn', [['st', '濡れ', 1, 'a']]],
    ['shiosai', '潮騒', 1, '潮の', 'st:濡れ', [['heal', 1]]],
    ['izumi', '癒しの泉', 1, '癒しの', 'end', [['heal', 3]]],
    ['uzushio', '渦潮', 2, '渦巻く', 'turn', [['dmg', '水', 3, 'a'], ['charge', 1.5]], { ev: 2 }],
    ['ooame', '大雨', 2, '土砂降りの', 'hit:水', [['st', '濡れ', 1, 'a']]],

    // ── 雷 ──
    ['raigeki', '雷撃', 1, '雷の', 'turn', [['dmg', '雷', 8]], { ev: 2 }],
    ['seidenki', '静電気', 1, 'ぱちぱちする', 'hurt', [['dmg', '雷', 3]]],
    ['chikuden', '蓄電', 1, '帯電した', 'turn', [['charge', 2]]],
    ['jinrai', '迅雷', 2, '迅雷の', 'react:感電', [['dmg', '雷', 3, 'a']]],
    ['tenbatsu', '天罰', 2, '天罰の', 'kill', [['dmg', '雷', 10, 'a']]],

    // ── 氷 ──
    ['tsurara', '氷柱', 1, '凍てつく', 'turn', [['dmg', '氷', 3]]],
    ['reiki', '冷気', 1, '冷たい', 'atk', [['st', '冷え', 1]]],
    ['hyouka', '氷の鎧', 1, '氷の', 'start', [['sh', 8], ['buf', '硬', 1]]],
    ['fubuki', '吹雪', 2, '吹雪の', 'turn', [['dmg', '氷', 2, 'a'], ['st', '冷え', 1, 'a']], { ev: 2 }],
    ['zettai', '絶対零度', 3, '零度の', 'react:凍結', [['dmg', '氷', 10, 'a']]],

    // ── 風 ──
    ['shippuu', '疾風', 1, '疾風の', 'atk', [['dmg', '風', 1]], { rep: 1 }],
    ['senpuu', '旋風', 1, 'つむじ風の', 'turn', [['dmg', '風', 2, 'a']]],
    ['oikaze', '追い風', 1, '追い風の', 'start', [['buf', '力', 2]]],
    ['kamaitachi', 'かまいたち', 2, '鎌鼬の', 'hit:風', [['dmg', '風', 1, 'l']], { tough: 0.85 }],
    ['arashi', '嵐', 2, '嵐の', 'turn', [['spread'], ['dmg', '風', 3, 'a']], { ev: 3 }],

    // ── 土 ──
    ['ganseki', '岩石落とし', 1, '岩の', 'turn', [['dmg', '土', 14]], { ev: 3 }],
    ['ishihada', '石の肌', 1, '頑丈な', 'start', [['buf', '硬', 2]]],
    ['teppeki', '鉄壁', 1, '鉄壁の', 'turn', [['sh', 4]]],
    ['jishin', '地震', 2, '大地の', 'turn', [['dmg', '土', 8, 'a']], { ev: 3 }],
    ['suna', '砂かけ', 1, '砂まみれの', 'hurt', [['dmg', '土', 2], ['sh', 1]]],

    // ── 光 ──
    ['seikou', '聖光', 1, '聖なる', 'turn', [['dmg', '光', 3], ['heal', 1]]],
    ['senkou', '閃光', 1, '閃く', 'kill', [['dmg', '光', 6, 'a']]],
    ['kago', '加護', 2, '加護の', 'heal', [['sh', 2]]],
    ['sabaki', '裁き', 2, '裁きの', 'st', [['dmg', '光', 2]]],

    // ── 闇 ──
    ['kyuuketsu', '吸血', 1, '血を吸う', 'atk', [['dmg', '闇', 2]], { drain: 0.3 }],
    ['juso', '呪詛', 1, '呪われた', 'turn', [['st', '呪い', 1]]],
    ['kage', '影法師', 2, '影の', 'skill', [['echo']], { ev: 4 }],
    ['shinigami', '死神の鎌', 3, '死神の', 'turn', [['exe', 0.15], ['dmg', '闇', 4]]],

    // ── 毒 ──
    ['dokubari', '毒針', 1, '毒の', 'atk', [['dmg', '毒', 1]]],
    ['dokugiri', '毒霧', 1, '毒霧の', 'turn', [['st', '毒', 1, 'a']]],
    ['moudoku', '猛毒', 2, '猛毒の', 'end', [['amp', '毒', 1.3]]],

    // ── 無（体術・心得） ──
    ['kenjutsu', '剣術', 1, '剣の', 'atk', [['dmg', '無', 3]]],
    ['nitou', '二刀流', 2, '二刀の', 'atk', [['atk']], { ev: 2 }],
    ['tame', '溜め', 1, '溜めた', 'turn', [['charge', 3]], { ev: 2 }],
    ['kaishin', '会心', 1, '会心の', 'hit', [['charge', 2]], { ev: 5 }],
    ['kodama', 'こだま', 2, '響く', 'skill', [['echo']], { ev: 3 }],
    ['rensa', '連鎖の心得', 2, '連なる', 'skill', [['buf', '力', 0.5]]],
    ['baigaeshi', '倍返し', 2, '倍返しの', 'hurt', [['ret', 2]]],
    ['konjou', '根性', 1, '根性の', 'turn', [['buf', '力', 2]], { low: true }],
    ['jidou', '自動回復', 1, '再生する', 'end', [['heal', 3]]],
    ['mamori', '守りの型', 1, '守りの', 'turn', [['sh', 3]]],
    ['hangeki', '反撃', 1, '反撃の', 'sh', [['dmg', '無', 2]]],
    ['kyousen', '狂戦士', 2, '狂った', 'turn', [['self', 2], ['buf', '力', 1.5]]],
    ['ikari', '怒り', 1, '怒れる', 'hurt', [['buf', '力', 1]]],
    ['shuuchuu', '集中', 1, '集中した', 'turn', [['buf', '魔', 5]]],
    ['shousai', '商才', 1, '商売上手な', 'gold', [['buf', '魔', 3]]],
    ['narikin', '成金', 2, '成金の', 'start', [['bufgold', 1]]],
    ['seichou', '成長', 2, '伸び盛りの', 'kill', [['pgrow', 0.5]]],
    ['hoshoku', '捕食', 2, '喰らう', 'kill', [['maxhp', 2], ['heal', 4]]],
    ['tanren', '鍛錬', 1, '鍛えた', 'turn', [['grow', 1]]],

    // ── ハズレスキルの仲間（ふしぎな出来事で動く） ──
    ['kafun', '花粉症', 1, 'むずむずする', 'sneeze', [['emit', 'sneeze'], ['dmg', '風', 1]]],
    ['hifuki', '火吹き芸', 1, '火を吹く', 'sneeze', [['dmg', '火', 3]]],
    ['kaze', '風邪', 1, '風邪ひきの', 'sneeze', [['st', '毒', 1, 'a']]],
    ['kuku', '九九', 1, '九九の', 'count', [['dmg', '無', 9]]],
    ['soroban', 'そろばん', 1, '算盤の', 'count', [['gold', 3]]],
    ['hyakuretsu', '百裂', 2, '百裂の', 'count', [['atk']], { rep: 1 }],
    ['saiyou', '再利用', 1, 'リサイクルの', 'pick', [['buf', '魔', 4]]],
    ['nagesen', '投げ銭', 1, '投げ銭の', 'gold', [['dmg', '無', 2]]],
    ['negoto', '寝言', 1, '寝言の', 'sleep', [['dmg', '闇', 6, 'a']]],
    ['yumemi', '夢見', 1, '夢見る', 'sleep', [['buf', '力', 3]]],
    ['nidone', '二度寝', 2, '二度寝の', 'sleep', [['emit', 'sleep'], ['heal', 3]]],
    ['gyakugire', '逆ギレ', 1, '逆ギレの', 'bow', [['dmg', '無', 5]]],
    ['shazai', '菓子折り', 1, '菓子折りの', 'bow', [['gold', 2], ['heal', 2]]],
    ['oogui', '大食い', 1, '大食いの', 'eat', [['maxhp', 0.5]]],
    ['gekikara', '激辛', 1, '激辛の', 'eat', [['dmg', '火', 4, 'a']]],
    ['tsumami', 'つまみ食い', 1, 'つまみ食いの', 'turn', [['emit', 'eat']]],
    ['onchi', '音痴', 1, '音痴な', 'song', [['dmg', '無', 2, 'a']]],
    ['encore', 'アンコール', 2, 'アンコールの', 'song', [['echo']]],
    ['ouen', '応援歌', 1, '応援の', 'song', [['sh', 2]]],

    // ── 伝説（手に入りにくい・条件で解放） ──
    ['truck', '転生トラック', 3, '異世界行きの', 'start', [['dmg', '無', 99]], { say: 'どこかで見たことがある。', lock: 'clear1' }],
    ['muchi', '無限の知恵', 3, '無限の', 'skill', [['buf', '魔', 1]], { tough: 0.92 }],
  ];

  HZ.SKILLS = {};
  for (const [id, name, rare, pre, trig, fx, opt] of SK) {
    HZ.SKILLS[id] = Object.assign({ id, name, rare, pre, trig, fx }, opt || {});
  }
  HZ.HAZURE = SK.filter((s) => s[2] === 0).map((s) => s[0]);

  /* ---------- 合成の隠しレシピ（組み合わせると名前と効果が変わる） ----------
     [素材A, 素材B, 名前, 足される効果, ひとこと]（順番は問わない） */
  HZ.RECIPES = [
    ['mizuyari', 'kakyu', '温泉', [['heal', 4]], 'いいお湯。'],
    ['hirune', 'ryouri', 'スローライフ', [['gold', 2], ['heal', 4]], '戦わなくていいなら、それがいちばん。'],
    ['kushami', 'hifuki', '火炎くしゃみ', [['dmg', '火', 6, 'a']], '鼻の奥が熱い。'],
    ['gomi', 'narikin', '錬金術', [['bufgold', 1]], 'ゴミは、見方を変えれば金になる。'],
    ['dogeza', 'baigaeshi', '逆転土下座', [['ret', 1]], '頭を上げる角度にも、自信がある。'],
    ['uta', 'raigeki', 'ライブ', [['dmg', '雷', 6, 'a']], '客席まで痺れた。'],
    ['kazoeru', 'kenjutsu', '千本素振り', [['pgrow', 0.3]], '九百九十九、千。'],
    ['kantei', 'shinigami', '見切り', [['exe', 0.1]], '寿命の線が見える。'],
    ['kenjutsu', 'nitou', '二天一流', [['atk']], ''],
    ['kakyu', 'suidan', '水蒸気爆発', [['dmg', '無', 8, 'a']], '理科でやったやつ。'],
    ['tsurara', 'ganseki', '氷河', [['st', '凍結', 1, 'a']], ''],
    ['seikou', 'kyuuketsu', '堕天', [['dmg', '闇', 6, 'a']], ''],
    ['hirune', 'nidone', '三度寝', [['heal', 10], ['emit', 'sleep']], 'あと五分。'],
    ['ryouri', 'gekikara', '地獄鍋', [['dmg', '火', 8, 'a']], '食べた人から倒れていく。'],
    ['dokubari', 'ryouri', '毒味役', [['st', '毒', 3, 'a']], ''],
    ['uta', 'onchi', 'リサイタル', [['dmg', '無', 6, 'a'], ['self', 1]], '本人がいちばん楽しそう。'],
    ['kushami', 'kaze', 'インフルエンザ', [['amp', '毒', 1.5]], '学級閉鎖。'],
    ['gomi', 'saiyou', 'もったいない精神', [['gold', 3]], ''],
    ['teppeki', 'hangeki', 'カウンター', [['dmg', '無', 4]], ''],
    ['kyousen', 'konjou', '火事場の馬鹿力', [['buf', '力', 4]], ''],
  ];

  /* ---------- 魔物 ----------
     hp・atk は「その地方のはじめ」の値。act は行動のくり返し。
     act：atk 攻撃 / big 大技（2.5倍） / multi:n n回攻撃（1回0.5倍） / sh 盾 / heal 回復 / burn 燃やす /
          poison 毒 / curse 呪う / buff 攻撃力アップ / steal お金を盗む / summon:id 仲間を呼ぶ
     tr：hard 硬さ / split 分裂 / regen 再生（毎ターン最大HPのn%） / reflect 反射（受けたダメージのn%を返す） /
         mist 霧（偶数回目のダメージを受けない） / wet いつも濡れている / seal 封印（いちばん強いスキルを封じる） /
         silent 静寂（「ほかのスキルが発動したとき」が働かない） / wall 鉄壁（1回のダメージは最大HPのn%まで） /
         noburn 燃えない / thorn とげ（攻撃した回数だけ1ダメージを返す）*/
  const FOE = [
    // 草原
    ['slime', 'スライム', 14, 3, ['atk'], { weak: ['火'] }],
    ['usagi', '角うさぎ', 10, 3, ['atk', 'multi:2'], { weak: ['氷'] }],
    ['goblin', 'ゴブリン', 20, 4, ['atk', 'atk', 'steal'], { weak: ['光'] }],
    ['bigslime', '大スライム', 34, 4, ['atk', 'atk', 'big'], { weak: ['火'], tr: { split: 1 }, elite: true }],
    ['gobking', 'ゴブリン隊長', 60, 5, ['atk', 'summon:goblin', 'atk', 'big'], { weak: ['光'], boss: true }],
    // 森
    ['wolf', '灰色狼', 22, 4, ['multi:2', 'atk'], { weak: ['火'] }],
    ['kinoko', '毒キノコ', 20, 3, ['poison', 'atk'], { weak: ['火'], res: { 毒: 0 } }],
    ['seirei', '木の精', 30, 3, ['atk', 'heal'], { weak: ['火'], res: { 水: 0.5, 土: 0.5 }, tr: { regen: 5 } }],
    ['wolfking', '狼王', 60, 5, ['multi:3', 'atk', 'buff'], { weak: ['火'], elite: true }],
    ['treant', '古樹トレント', 120, 6, ['atk', 'heal', 'big', 'poison'], { weak: ['火'], res: { 水: 0, 土: 0.5 }, boss: true, tr: { regen: 2, hard: 1 } }],
    // 火山
    ['honoo', '炎の精', 28, 5, ['burn', 'atk'], { weak: ['水', '氷'], res: { 火: 0 }, tr: { noburn: 1 } }],
    ['sasori', '大サソリ', 30, 5, ['poison', 'atk', 'atk'], { weak: ['氷'], tr: { hard: 3 } }],
    ['lavagolem', '溶岩ゴーレム', 44, 6, ['atk', 'big'], { weak: ['水', '氷'], res: { 火: 0 }, tr: { hard: 6, noburn: 1 } }],
    ['salamander', '火蜥蜴', 80, 6, ['burn', 'multi:2', 'big'], { weak: ['水'], res: { 火: 0 }, elite: true, tr: { noburn: 1, thorn: 1 } }],
    ['endragon', '炎竜', 260, 8, ['burn', 'atk', 'multi:3', 'big'], { weak: ['氷'], res: { 火: 0 }, boss: true, tr: { hard: 4, noburn: 1 } }],
    // 氷の峡谷
    ['yukiookami', '雪狼', 34, 6, ['multi:2', 'atk'], { weak: ['火'], res: { 氷: 0 } }],
    ['koorisei', '氷の精', 30, 5, ['atk', 'sh'], { weak: ['火', '土'], res: { 氷: 0 }, tr: { mist: 1, wet: 1 } }],
    ['kagami', '鏡の魔物', 40, 5, ['atk', 'curse'], { weak: ['土'], tr: { reflect: 20 } }],
    ['hyoukai', '氷塊ゴーレム', 100, 7, ['sh', 'big', 'atk'], { weak: ['火', '土'], res: { 氷: 0 }, elite: true, tr: { hard: 8 } }],
    ['kyozou', '氷の巨像', 380, 9, ['sh', 'atk', 'big', 'multi:2'], { weak: ['火', '土'], res: { 氷: 0, 水: 0.5 }, boss: true, tr: { wall: 8, wet: 1 } }],
    // 魔王城
    ['yoroi', '生きた鎧', 50, 7, ['atk', 'sh', 'big'], { weak: ['雷'], res: { 毒: 0 }, tr: { hard: 10 } }],
    ['grimoire', '魔導書', 40, 6, ['curse', 'atk', 'burn'], { weak: ['火'], res: { 闇: 0.5 } }],
    ['gargoyle', 'ガーゴイル', 46, 7, ['multi:2', 'atk'], { weak: ['雷', '土'], tr: { mist: 1 } }],
    ['shitennou', '四天王・沈黙のバルザ', 130, 8, ['curse', 'big', 'atk', 'multi:3'], { weak: ['光'], res: { 闇: 0 }, elite: true, tr: { silent: 1 } }],
    ['mimic', 'ミミック', 26, 5, ['big', 'atk', 'atk'], { weak: ['雷'], elite: true, tr: { hard: 2 } }],
    ['maou', '魔王', 520, 9, ['curse', 'big', 'multi:3', 'atk', 'buff'], { weak: ['光'], res: { 闇: 0 }, boss: true, tr: { seal: 1, hard: 5, phase: 1 } }],  // 封印は最初の2ターン
  ];
  HZ.FOES = {};
  for (const [id, name, hp, atk, act, opt] of FOE) HZ.FOES[id] = Object.assign({ id, name, hp, atk, act, weak: [], res: {}, tr: {} }, opt || {});

  /* ---------- 地方（章） ----------
     law：その地方の理（属性の強さの倍率など） */
  HZ.CHAPTERS = [
    { id: 'sougen', name: 'はじまりの草原', foes: ['slime', 'usagi', 'goblin'], elite: ['bigslime'], boss: 'gobking', law: null, sky: ['#7cc4ff', '#cfeaff'], ground: '#6fae5a' },
    { id: 'mori', name: '迷いの森', foes: ['wolf', 'kinoko', 'seirei'], elite: ['wolfking'], boss: 'treant', law: { el: { 毒: 1.3 }, text: '森の理：毒の力 1.3倍' }, sky: ['#2e5a4a', '#8fbf8a'], ground: '#2f5b34' },
    { id: 'kazan', name: '灼熱の火山', foes: ['honoo', 'sasori', 'lavagolem'], elite: ['salamander'], boss: 'endragon', law: { el: { 火: 1.3, 水: 0.8 }, text: '火山の理：火 1.3倍、水 0.8倍' }, sky: ['#5a1e1e', '#e8784a'], ground: '#3b2420' },
    { id: 'hyoukyou', name: '氷の峡谷', foes: ['yukiookami', 'koorisei', 'kagami'], elite: ['hyoukai'], boss: 'kyozou', law: { el: { 氷: 1.3, 火: 0.9 }, text: '峡谷の理：氷 1.3倍、火 0.9倍' }, sky: ['#6f8fb8', '#e6f2ff'], ground: '#cfe0ee' },
    { id: 'maoujou', name: '魔王城', foes: ['yoroi', 'grimoire', 'gargoyle'], elite: ['shitennou'], boss: 'maou', law: { el: { 光: 1.3, 闇: 0.8 }, text: '魔王城の理：光 1.3倍、闇 0.8倍' }, sky: ['#1a1030', '#5a3a7a'], ground: '#2a2036' },
  ];
  // 深淵（魔王のあと。上限なし）でかわるがわる出る理
  HZ.LAWS = [
    { el: { 火: 1.5 }, text: '火が燃えやすい' }, { el: { 水: 1.5 }, text: '水があふれる' }, { el: { 雷: 1.5 }, text: '雷雲が低い' },
    { el: { 氷: 1.5 }, text: '空気が凍る' }, { el: { 風: 1.5 }, text: '風が強い' }, { el: { 土: 1.5 }, text: '大地が鳴る' },
    { el: { 光: 1.5 }, text: '白夜' }, { el: { 闇: 1.5 }, text: '新月' }, { el: { 毒: 1.5 }, text: '瘴気' },
    { tough: 0.05, text: '疲れにくい（同じスキルの効き目が落ちにくい）' }, { combo: 2, text: '連鎖の力が2倍' },
    { react: 1.5, text: '反応が1.5倍' }, { gold: 2, text: 'お金が2倍' },
  ];

  /* ---------- 称号（旅の途中で手に入る。小さな加護つき） ---------- */
  HZ.TITLES = {
    fuse1: { name: '合成士見習い', how: 'はじめて合成する', perk: '合成の倍率 +5%', fuse: 0.05 },
    fuse10: { name: '合成狂', how: '1回の旅で10回合成する', perk: '合成の倍率 +10%', fuse: 0.1 },
    rank5: { name: '神の領域', how: '「神」のつくスキルを作る', perk: '合成の倍率 +10%', fuse: 0.1 },
    combo20: { name: '連鎖の申し子', how: '1ターンに20回連鎖する', perk: '連鎖の力 +20%', combo: 0.2 },
    combo100: { name: '連鎖の極み', how: '1ターンに100回連鎖する', perk: '連鎖の力 +30%', combo: 0.3 },
    react5: { name: '反応マニア', how: '1回の戦いで5種類の反応を起こす', perk: '反応の倍率 +20%', react: 0.2 },
    onehit: { name: '一撃必殺', how: '1回のダメージで敵の最大HPをこえる', perk: '力 +2（戦いのはじめ）', str: 2 },
    dmg1m: { name: '百万の一撃', how: '1回で100万ダメージ', perk: '魔 +20%（戦いのはじめ）', mag: 20 },
    dmg1t: { name: '一兆の一撃', how: '1回で1兆ダメージ', perk: '魔 +50%（戦いのはじめ）', mag: 50 },
    rich: { name: '小金持ち', how: 'お金を200持つ', perk: 'ギルドの値段 10%引き', disc: 0.1 },
    narrow: { name: '九死に一生', how: 'HP1割以下で勝つ', perk: '最大HP +10', hp: 10 },
    slime: { name: 'スライムの天敵', how: 'スライムを10匹倒す', perk: '火 +10%', el: { 火: 0.1 } },
    dragon: { name: '竜殺し', how: '炎竜を倒す', perk: '力 +3（戦いのはじめ）', str: 3 },
    maou: { name: '魔王討伐', how: '魔王を倒す', perk: '最大HP +30', hp: 30 },
    lv10: { name: '熟練', how: 'スキルをLv.10にする', perk: 'スキル書が10%安い', book: 0.1 },
    recipe: { name: '隠し味', how: '隠しレシピを見つける', perk: '合成の倍率 +5%', fuse: 0.05 },
    inf: { name: '理の外', how: '???', perk: 'あなたの連鎖は、もう誰にも止められない', combo: 1 },
  };

  /* ---------- 出来事（道中） ---------- */
  HZ.EVENTS = [
    { id: 'party', title: '元パーティ', text: 'あなたを追放したパーティが、ぼろぼろで倒れていた。「た、助けてくれ……戻ってきてくれ……！」', ch: [1, 2, 3],
      opts: [{ t: '「もう遅い」', fx: { gold: 30 }, r: '去りぎわに、落ちていた財布を拾った。お金 +30' }, { t: '手当てだけする', fx: { heal: 1, title: null, maxhp: 5 }, r: '礼に、薬草の束をもらった。最大HP +5、全回復' }] },
    { id: 'shrine', title: '古い祠', text: 'しめ縄の切れた祠がある。供え物を置くと、スキルがひとつ鍛えられるという。', ch: [0, 1, 2, 3, 4],
      opts: [{ t: 'お金 25 を供える', cost: 25, fx: { lvup: 1 }, r: '装備中のスキルがひとつ、Lv が上がった。' }, { t: '手を合わせるだけ', fx: { heal: 0.3 }, r: '少し、気持ちが落ちついた。HP を3割回復' }] },
    { id: 'chest', title: '宝箱', text: '道のまんなかに、あやしい宝箱がある。', ch: [0, 1, 2, 3, 4],
      opts: [{ t: '開ける', fx: { mimic: 1 }, r: '' }, { t: '鑑定してから開ける', need: 'kantei', fx: { skill: 2 }, r: '中身は本物。スキルの書が入っていた。' }, { t: 'やめておく', fx: {}, r: '宝箱は、さみしそうに見えた。' }] },
    { id: 'slimeking', title: 'スライムの行列', text: 'スライムが一列にならんで、どこかへ向かっている。', ch: [0, 1],
      opts: [{ t: 'ついていく', fx: { gold: 15, heal: 0.5 }, r: '湧き水のほとりに出た。HP 半分回復、拾ったお金 +15' }, { t: '数を数える', need: 'kazoeru', fx: { gold: 40 }, r: 'ちょうど百匹。行列の最後のスライムが、お礼にお金を吐きだした。+40' }] },
    { id: 'merchant', title: '行商人', text: '荷車を引いた行商人。「旦那、珍しい書が入ってますぜ」', ch: [1, 2, 3, 4],
      opts: [{ t: 'お金 40 で買う', cost: 40, fx: { skill: 2 }, r: 'レアなスキルを手に入れた。' }, { t: '値切る', fx: { skill: 1, gold: -10 }, r: 'ふつうの書を、10で売ってくれた。' }] },
    { id: 'spring', title: '女神の泉', text: '泉の底で、なにかが光っている。「落としたのは、この金のスキルですか？　それとも銀の──」', ch: [2, 3, 4],
      opts: [{ t: '正直に「落としていません」', fx: { slot: 1 }, r: '「正直者には、枠をひとつ」——装備できるスキルが +1' }, { t: '「金のほうです」', fx: { gold: 60, hurt: 0.3 }, r: 'お金 +60。泉から石が飛んできた。HP −3割' }] },
  ];

  /* ---------- 進み方 ----------
     1章 ＝ 7歩（最後がボス）。歩ごとに2〜3の行き先から選ぶ。 */
  HZ.STEPS = 7;
  // 魔物の強さの伸び（1歩ごと）。最初の章だけゆるやか
  HZ.GROW = { hp: 1.30, atk: 1.055, hp0: 1.17 };
  HZ.scale = (k) => Math.pow(HZ.GROW.hp0, Math.min(k, HZ.STEPS)) * Math.pow(HZ.GROW.hp, Math.max(0, k - HZ.STEPS));
  HZ.START = { hp: 50, atk: 3, slots: 4, gold: 10 };
})(typeof window !== 'undefined' ? window : globalThis);
