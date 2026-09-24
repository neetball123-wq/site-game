/* =========================================================
   つづきから — 島の地図・机の上の紙・ヒント・曲
   ========================================================= */
window.TK = (() => {

  /* ---------- 島のひみつ（ユウのメモと同じ順） ---------- */
  const SECRETS = [
    { name: 'いどの ほし', note: 'よるの いどの そこに、そらに ない ほしが ひとつ' },
    { name: 'ミケの ことば', note: '「まこと」と なのると、ミケが こたえる' },
    { name: 'とうだいの うた', note: 'ひかりの かずは、うたの はじまりの かず' },
    { name: 'しおだまりの どうくつ', note: 'いちばん しおが ひいた ひ、にしの いわばに あなが あく' },
    { name: 'ねがいぼし', note: '13にちの よあけまえ、ひがしの おかで 3かい ねがう' },
    { name: 'たなばたの ささ', note: 'この島の たなばたは、ひとつき おくれ' },
    { name: 'ひみつきちの こえ', note: 'しずかに すると、なつが はなしかけてくる' },
    { name: '8がつ32にち', note: 'ななつの ひかりと、0じの とうだい' }
  ];

  /* ---------- 地図 ---------- */
  const MAPS = {
    world: {
      set: 'world', out: '~', rows: [
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '~~~~###########~~~~~~~#####~~~',
        '~~~#YY.rrrrr.YY#~~~~~#..KK.#~~',
        '~~~#Y.qhhohhq.Y#~~~~~#..kk.#~~',
        '~~~#Y.::...::eY#~~~~~#..kL.#~~',
        '~~~#Y...gGg...Y##~~~#..S.=.#~~',
        '~~#.YYYYY^YYYYY.,,,,.....=.#~~',
        '~~YTTTTTT=======.....TT..=.#~~',
        '~~TTTTTTT=.rrrr..rrrr.:::=.#~~',
        '~~YT...TT=.hndh..hdnh....=:#~~',
        '~~TT.W.===....M.S...S....=.#~~',
        '~~Y....TT=================.#~~',
        '~~T.TTTTT.rrrr.=.rrrrrS...T#~~',
        '~~Y..TTTT.hdnh.=.hndnh.:b..#~~',
        '~~TTBBTTT......=.....:.....#~~',
        '~~YTBBTST.xxxx.=..:.::....T#~~',
        '~~TTTTT...FFFF.=.....T....T#~~',
        '~~ccTTT,T,,,,,,=,,,,,......#~~',
        '~~cCc,,,,,,,,,S=,b,,,,,,,,#~~~',
        '~~ccc,,,,,,,,,,PP,,,,,,,,,#~~~',
        '~~~ccc,,,,,,,,,PP,,,,,,,,#~~~~',
        '~~~~,,,,,,,,,,,PP,,,,,,,#~~~~~',
        '~~~~~~~~~~~~~~~PP~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~PP~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
      ]
    },
    house: {
      set: 'in', out: 'X', rows: [
        '#w#C##p#w#',
        '#v.......#',
        '#.::::...#',
        '#.:f::.n.#',
        '#.::::...#',
        '#........#',
        '#........#',
        '#...dd...#',
        '##########'
      ]
    },
    shop: {
      set: 'in', out: 'X', rows: [
        '#ss#w##ss#',
        '#........#',
        '#.cccc...#',
        '#........#',
        '#.......s#',
        '#........#',
        '#........#',
        '#...dd...#',
        '##########'
      ]
    },
    school: {
      set: 'in', out: 'X', rows: [
        '#kkkkk#w##',
        '#........#',
        '#.D.D.D..#',
        '#........#',
        '#.D.D.D..#',
        '#........#',
        '#........#',
        '#...dd...#',
        '##########'
      ]
    },
    lh1: {
      set: 'in', out: 'X', rows: [
        '##w####w##',
        '#......u.#',
        '#.t......#',
        '#........#',
        '#........#',
        '#.s......#',
        '#........#',
        '#...dd...#',
        '##########'
      ]
    },
    lh2: {
      set: 'in', out: 'X', rows: [
        'rrrrrrrrrr',
        'r,,,,,,,,r',
        'r,,,,,,,,r',
        'r,,,OO,,,r',
        'r,,,,,,,,r',
        'r,,,,,,,,r',
        'r,,,,,,,,r',
        'r,,,j,,,,r',
        'rrrrrrrrrr'
      ]
    },
    base: {
      set: 'in', out: 'X', rows: [
        '#a#a##w###',
        '#......R.#',
        '#.x......#',
        '#...mm...#',
        '#...mm...#',
        '#........#',
        '#........#',
        '#...dd...#',
        '##########'
      ]
    },
    cave: {
      set: 'in', out: 'X', dark: true, rows: [
        '%%%%%%%%%%%%%%%%%%%%',
        '%E;;;;%%%%%%;;;;;%%%',
        '%;;;;;;%%%%;;;;;;;%%',
        '%%;;;;;;;;;;;%%;;;;%',
        '%%%;;;%%;;;;%%%;;Q;%',
        '%%%;;;%%%%;;;;;;;;;%',
        '%%;;;;%%%%%%;;;Z;%%%',
        '%%;;%%%%%%%%%%;;;%%%',
        '%%%%%%%%%%%%%%%%%%%%'
      ]
    },
    ura: {
      set: 'world', out: '~', ura: true, rows: [
        '~~~~~~~~~~~~~~~~~~~~',
        '~~,,,,,,~~~~,,,,,,~~',
        '~,,S,,S,,~~,,S,,S,,~',
        '~,,,,,,,,,,,,,,,,,,~',
        '~~,S,,,,,,,,,,,,S,~~',
        '~~,,,,,.......,,,,~~',
        '~~~,S,,.......,,S,~~',
        '~~~,,,,.......,,,,~~',
        '~~~~,,,S,,,,S,,,~~~~',
        '~~~~~,,,,,,,,,,~~~~~',
        '~~~~~~~~~~~~~~~~~~~~'
      ]
    }
  };

  /* 入口と出口。world の戸口は「ぶつかると入る」、室内の d・u・j・E は「踏むと出る」 */
  const DOORS = {
    'world:13,10': { to: 'house', x: 4, y: 6, dir: 'u' },
    'world:18,10': { to: 'shop', x: 4, y: 6, dir: 'u' },
    'world:19,14': { to: 'school', x: 4, y: 6, dir: 'u' },
    'world:25,5': { to: 'lh1', x: 4, y: 6, dir: 'u', gate: 'lighthouse' },
    'world:11,14': { locked: 'natsu' }
  };
  const EXITS = {
    house: { to: 'world', x: 13, y: 11, dir: 'd' },
    shop: { to: 'world', x: 18, y: 11, dir: 'd' },
    school: { to: 'world', x: 19, y: 15, dir: 'd' },
    lh1: { to: 'world', x: 25, y: 6, dir: 'd' },
    base: { to: 'world', x: 4, y: 14, dir: 'u' },
    cave: { to: 'world', x: 4, y: 19, dir: 'r' }
  };

  /* ---------- 潮見表（桟橋の看板） ---------- */
  const TIDE = [
    ['3にち', '10:40', '+38cm'], ['7にち', '14:20', '+25cm'], ['12にち', '13:40', '+ 6cm'], ['16にち', '16:50', '+31cm'],
    ['20にち', ' 8:10', '+44cm'], ['24にち', '11:05', '+12cm'], ['27にち', '12:50', '− 8cm'], ['30にち', '14:30', '+ 3cm']
  ];

  /* ---------- ウラガワの看板（ほかの場所の、うらがわ） ---------- */
  const URA_SIGNS = {
    '3,2': 'ねむれない よるの ばんぐみが、ここでも ながれている。……チャンネルは、そのままで。',
    '6,2': '1987ねんに とまった でんしゃの きっぷが おちている。『かすみの ゆき』',
    '13,2': 'みなとの さかの だいひつやの ふうとう。……あてなが、かきかけの まま。',
    '16,2': 'えつらん きろく：あなた。この きろくは、けせません。',
    '3,4': 'しばっぽい いぬの あしあとが、どこかへ つづいている。……さんぽの とちゅう かな。',
    '16,4': '2005ねんで とまった けんきゅうしつの ページが、こちらを みている。',
    '4,6': 'さいごの とうえいで ながれた ほしが、いくつか ここに おちている。',
    '16,6': 'めいじの むすめの ふみが、まちがえて ここに とどいた。……へんじは、コメントらんへ。',
    '7,8': 'しおみちょうの とばの こま が ひとつ。……この カセットも、しおみちょうから きた らしい。',
    '12,8': 'うせもの つうはんの はこが おちている。なかみは『なつやすみ（ひとつぶん）』。'
  };

  /* ---------- 曲（ミニMML） ----------
     a・b＝矩形波、c＝三角波（ベース）、d＝打楽器（k キック・s スネア・h ハイハット） */
  const TRACKS = [
    { n: 'タイトル', t: 126, a: '@1 o5 l8 e g >c4< b a g4 a g e4 d e c4 f a >c4< b a g4 e2. r4 e g >c4 d c< b4 a b >c4< g4 e4 f e d c d4 g4 c2. r4',
      b: '@2 o4 l4 c e g e c e a e c f a f c e g e c e g e c f a f d g b g c e g2', c: 'o3 l2 c g a e f c c g c g f c g d c1', d: 'l4 k h s h k h s h k h s h k h s k8 k8 k h s h k h s h k h s h k s k2' },
    { n: 'しまの あさ', t: 96, a: '@2 l4 o5 d. o4 b8 g b a. g8 e d e g b o5 d c2 o4 b2 o5 d. o4 b8 g b a. b8 o5 c o4 a b a g f+ g1',
      b: '@1 o4 l2 b g a f+ g e e d b g a f+ g f+ g1', c: 'o3 l2 g d d a c g a d g d d a c d g1', d: 'l4 k h h h k h h h k h h h k h h h k h h h k h h h k h h h k h k h' },
    { n: 'むら', t: 116, a: '@1 o5 l8 c c e g a g e4 f f a >c< b a g4 e e g >c< a g e c d e f d g2 c c e g a g e4 f f a >c< b a g4 a g f e d e f d c2 r2',
      b: '@2 o4 l4 e g e g f a f a e g e a f d f g e g e g f a f a f a g b e2 r2', c: 'o3 l4 c g c g f c f c c g a e d a g d c g c g f c f c f c g d c2 r2', d: 'l8 k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k4 r4' },
    { n: 'もり', t: 92, a: '@2 o5 l8 a4 e a >c4< b a g4 e4 d2 f4 a >c< b4 a g e1 a4 e a >c4 d e d4 c< b a2 g f e d e4 g+4 a1',
      b: '@0 o4 l4 a e a e g e g d f a f a e g+ b g+ a e a >c< a f d f e d e g+ a2 e2', c: 'o3 l2 a e c g f c e g+ a e d a e b a1', d: 'l4 k r h r k r h r k r h r k r h r k r h r k r h r k r h r k r h r' },
    { n: 'うみ', t: 104, a: '@1 o5 l4 f+ a >d< a g. f+8 e2 d f+ a b a2. r4 b >d< b a g. a8 b2 a g f+ e d2. r4',
      b: '@2 o4 l8 d f+ a f+ d f+ a f+ d g b g d g b g d f+ a f+ d f+ a f+ c+ e a e c+ e a e d g b g d g b g e g b g e g b g c+ e a e c+ e a e d f+ a f+ d2', c: 'o3 l2 d a g d d f+ a e g d e b a e d1', d: 'l8 k h h h s h h h k h h h s h h h k h h h s h h h k h h h s h h h k h h h s h h h k h h h s h h h k h h h s h h h k h h h s h h h' },
    { n: 'じんじゃ', t: 80, a: '@2 o5 l4 d f g. a8 g f d2 f g a >c< a2 g2 d f g. a8 >c< a g2 f d f g d1',
      b: '@0 o4 l2 a >c< g f a >c< f e a >c< g f a g f1', c: 'o3 l1 d g f c d g a d', d: 'l2 k r r r k r r h k r r r k r r h' },
    { n: 'なつや', t: 138, a: '@1 o5 l8 c f a f >c< a f4 d g b- g >d< b- g4 c f a >c d c< a f g e c e f2 c f a f >c< a f4 d g b- g >d< b- g4 a b- >c< a g e c e f2 r2',
      b: '@2 o4 l4 a >c< a >c< b- >d< b- >d< a >c< a f e g a2 a >c< a >c< b- >d< b- >d< f g e g a2 r2', c: 'o3 l4 f c f c b- f b- f f c f a c e f2 f c f c b- f b- f f c c e f2 r2', d: 'l8 k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k4 r4' },
    { n: 'よる', t: 72, a: '@2 o5 l4 e g b a g2 f+2 e d e g b1 >c< b a g f+2 d2 e f+ g a b1',
      b: '@0 o4 l2 g b e d+ c e g f+ e g d a c e d+1', c: 'o3 l1 e b c e a d c b', d: 'l2 h r h r h r h r h r h r h r h r' },
    { n: 'なつまつり', t: 144, a: '@1 o5 l8 a a >c< a g e g4 a a >c d c< a g4 e g a g e d e4 d e g e d c d4 a a >c< a g e g4 a a >c d c< a g4 e g a >c< a g e g a2 r2',
      b: '@2 o4 l2 e c e d c d c d e c e d c e e1', c: 'o3 l4 a e a e d a d a c g c g d a d g a e a e d a d a c g e g a2 r2', d: 'l8 k r k k s r k r k r k k s r k r k r k k s r k r k r k k s r k r k r k k s r k r k r k k s r k r k r k k s r k r k k s s k4 r4' },
    { n: 'はなび', t: 84, a: '@2 o5 l4 e g o6 c2 o5 b a g2 a o6 c e2 d1 c o5 a o6 c e d c o5 b2 a g a b o6 c1',
      b: '@0 o4 l2 e g d g c f b g c e d b c d e1', c: 'o3 l1 c g f g a g f c', d: 'l2 k r r r k r r r k r r r k r r r' },
    { n: 'とうだい', t: 88, a: '@1 o5 l4 e a b >c< b. a8 g2 f a >c< b a2 e2 d f a g e. f8 g2 f e d e a1',
      b: '@2 o4 l2 c e d d c f e e d f c e d g+ a1', c: 'o3 l1 a e f a d c d a', d: 'l4 k r h r k r h r k r h r k r h r k r h r k r h r k r h r k r h r' },
    { n: 'ひみつ', t: 76, a: '@0 o4 l8 a >c e< a >c e d c< b >d f< b >d f e d< a >c e< a >c e g f< e1',
      b: '@2 o3 l1 a g+ a e', c: 'o2 l1 a e f e', d: 'l2 h r h r h r s r' },
    { n: 'さびしい', t: 60, a: '@2 o5 l2 e a g e f d e1 c e d o4 b o5 c o4 a o5 e1', b: '', c: 'o3 l1 a c d e a g f e', d: '' },
    { n: 'ファンファーレ', t: 150, once: true, a: '@1 o5 l8 c e g >c4. < g8 >c2', b: '@2 o4 l8 e g >c e4. < b8 >e2', c: 'o3 l8 c r c r c4. g8 c2', d: '' },
    { n: 'エンディング', t: 96, a: '@1 o5 l4 g e g o6 c o5 b a g2 a f a o6 c o5 b1 g e g o6 c d e f2 e d c o5 b o6 c1',
      b: '@2 o4 l2 e g d g f a g d e g f a g f e1', c: 'o3 l2 c e g d f c g d c e f d g g c1', d: 'l4 k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s s' },
    { n: 'おやすみ', t: 66, a: '@2 o5 l4 g e g e f d d2 e c e g f1 g e g o6 c o5 b g a f e d c d c1',
      b: '@0 o4 l2 e c d o3 b o4 c e d1 e c d d c o3 b o4 c1', c: 'o3 l1 c g a f c g c c', d: '' },
    { n: 'とうだいの うた', t: 84, a: '@2 o5 l4 e g a g e2 d2 c2 d e g1 a g e d c2 d2 e d o4 a o5 c c1',
      b: '@0 o4 l2 c e g g e f g1 f e e f c f e1', c: 'o3 l1 c g a g f a f c', d: '' }
  ];

  /* ---------- ふくろとじ（時間がたつと開くヒント） ---------- */
  const HINTS = [
    { k: 'clock', t: 'まずは ここから：とけい', h: [
      'いまの 島は「なつやすみが おわった あと」。8がつに もどる ほうほうが、どこかに かいてないかな？',
      'ピコマガの きりぬきの「◎ほんと！」の ウラ技を よもう。タイトル画面で ためす ものだよ。',
      'タイトル画面（PUSH STARTが でているとき）で、SELECTを おしたまま Bを 3かい。マウスなら SELECTを クリックして すぐ Bを 3かい。とけいを 8がつの ひに あわせて Aで けってい。'] },
    { k: 's0', t: 'ひみつ①　いどの ほし', h: [
      'ユウの メモの ①。いどは もりの なかの ひろばに ある。',
      '「よる」に しらべるのが だいじ。島の じかんは、ゲーム機の とけいで きまるよ。',
      'とけいを 20じ〜あさ4じ の あいだに して、もりの いどを Aで しらべる。'] },
    { k: 's1', t: 'ひみつ②　ミケの ことば', h: [
      'ミケは じんじゃの ねこ。ピコマガでは「ひばり」は ガセだった。ユウは「なまえが ちがうだけ！」と かいている。',
      'せつめいしょの スタッフの ページと、じんじゃの えまを くらべて みよう。ミケの かいぬしは だれ？　なまえは 4もじまで。',
      'おじいちゃんの いえの ノートで なまえを「まこと」に かきなおして、ミケに はなしかける（あとで ユウに もどしても だいじょうぶ）。'] },
    { k: 's2', t: 'ひみつ③　とうだいの うた', h: [
      'トメさんは「ひかりの かずを かぞえてごらん」と いう。よるの とうだいを、しばらく ながめて みよう。',
      'ひかりは いくつかの かたまりに なって くりかえす。その かずを、サウンドテストの きょくばんごうに してみたら……？',
      'よるの とうだいは 4・2・3 の じゅんに ひかる。タイトルの「せってい」→ サウンドテストで 04 → 02 → 03 の じゅんに Aで ならすと 16が でる。16を きいてから トメさんに はなしかける。'] },
    { k: 's3', t: 'ひみつ④　しおだまりの どうくつ', h: [
      'さんばしの しおみひょうと、つりの おじさんの はなしを きこう。',
      '「しおの たかさ」が いちばん ひくいのは なんにち なんじ？　どうくつの なかは まっくら。かいちゅうでんとうの でんちは、なつやで うっている。',
      'なつやで でんちを かってから、とけいを 8がつ27にち 12:50ごろ（12じ〜13じ40ぷん）に して、にしの いわばの あなへ。おくの しおだまりを しらべる。'] },
    { k: 's4', t: 'ひみつ⑤　ねがいぼし', h: [
      'ぶんこうの こくばんに、8がつの よぞらの ことが かいてある。',
      'ペルセウスざ りゅうせいぐんの ピークは「13にちの よあけまえ」。ばしょは ひがしの おか。ながれぼしが きえるまでに……？',
      'とけいを 8がつ13にち 3じごろ（1じ〜4じ59ふん）に して、ひがしの おかへ。ながれぼしが みえている あいだに Aを 3かい。'] },
    { k: 's5', t: 'ひみつ⑥　たなばたの ささ', h: [
      'ナツは「この島の たなばたは ○○○○ おくれ」と いっていた（なつの ひるに はなしかけてみて）。',
      'ほんどの たなばたは 7がつ7にち（ぶんこうの こくばん）。ひとつき おくれると……？　ささは じんじゃに たつ。',
      'とけいを 8がつ7にち に して じんじゃへ。ささを しらべて、まっしろな たんざくに ねがいを かく。'] },
    { k: 's6', t: 'ひみつ⑦　ひみつきちの こえ', h: [
      'ひみつきちは、もりの おおきな きの「うしろ」。いどの ひろばの ひだりから まわりこめる。',
      'ピコマガに「ひみつきちで おとを けすと……」という うわさ。ゲーム機の よこに ある ボリュームは？',
      'おおきな きの きたがわ（うしろ）から、したに むかって きに はいる。なかで ボリュームを 0 に する。'] },
    { k: 's7', t: '＋1　8がつ32にち（？）', h: [
      'ななつの ひみつが そろったら。トメさんの いいつたえと、ユウの とうこう（ピコマガ）を よみかえそう。',
      '8がつ31にちの よる、とうだいの いちばん うえで、0じに なる しゅんかんを まつ。',
      'ひみつを 7つ そろえてから、とけいを 8がつ31にち 23:59 に して、とうだいの うえ（なかの かいだんを のぼった ところ）で 0じを まつ。'] }
  ];

  /* ---------- 机の上の紙（HTML） ---------- */
  const mapSVG = `<svg class="mn-map" viewBox="0 0 300 250" role="img" aria-label="とこなつ島の地図">
    <rect width="300" height="250" fill="#D5E6EA"/>
    <path d="M40 30h110l12 40h54l6-40h62l6 60-2 130-40 20H60l-38-20-4-70 12-60z" fill="#F4EDD2" stroke="#5B6B55" stroke-width="2"/>
    <path d="M22 88h70v100H22z" fill="#9FC08A" opacity=".9"/><circle cx="55" cy="112" r="6" fill="#fff" stroke="#3B4B35" stroke-width="2"/>
    <path d="M44 30h104v38H44z" fill="#B9CFA4"/><path d="M88 58h16M90 52v14M102 52v14" stroke="#B3281F" stroke-width="3"/>
    <rect x="80" y="36" width="36" height="12" fill="#8E5E38"/>
    <path d="M226 30h52v40h-52z" fill="#B9CFA4"/><rect x="243" y="30" width="12" height="28" fill="#fff" stroke="#3B4B35" stroke-width="2"/><rect x="243" y="30" width="12" height="7" fill="#D24B4B"/>
    <path d="M90 120h170M150 120v70M96 84h54M96 84v36M250 60v60" stroke="#C9A36A" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="110" y="96" width="30" height="16" fill="#C54E3C"/><rect x="170" y="96" width="30" height="16" fill="#C54E3C"/>
    <rect x="100" y="134" width="30" height="16" fill="#C54E3C"/><rect x="170" y="134" width="40" height="16" fill="#C54E3C"/>
    <path d="M22 186h240l-10 40H56z" fill="#F2DCA2"/><rect x="150" y="196" width="18" height="50" fill="#8E5E38"/>
    <circle cx="30" cy="196" r="10" fill="#7C7468"/><circle cx="44" cy="206" r="8" fill="#7C7468"/>
    <path d="M216 88h46v34h-46zM216 130h46v40h-46z" fill="#C8DDA0"/>
    <g font-size="10" font-weight="700" fill="#2A3326" font-family="'Kosugi Maru',sans-serif">
      <text x="94" y="24" text-anchor="middle">じんじゃ</text><text x="252" y="22" text-anchor="middle">とうだい</text>
      <text x="40" y="84" text-anchor="middle">もり</text><text x="55" y="130" text-anchor="middle">いど</text>
      <text x="125" y="92" text-anchor="middle" font-size="8">おじいちゃんの いえ</text><text x="185" y="92" text-anchor="middle" font-size="8">なつや</text>
      <text x="115" y="162" text-anchor="middle" font-size="8">ナツの いえ</text><text x="190" y="162" text-anchor="middle" font-size="8">ぶんこう</text>
      <text x="240" y="150" text-anchor="middle">ひがしの おか</text><text x="100" y="214" text-anchor="middle">はま</text>
      <text x="186" y="240" text-anchor="middle">さんばし</text><text x="36" y="226" text-anchor="middle" font-size="8">にしの いわば</text>
    </g></svg>`;

  const MANUAL = [
    { t: 'ひょうし', h: `<div class="mn-cover"><p class="mn-maker">ポケピコ専用カートリッジ</p><h2 class="mn-logo">とこなつ島</h2><p class="mn-sub">〜なつやすみの ひみつ〜</p>
      <svg class="mn-art" viewBox="0 0 200 110" aria-hidden="true"><rect width="200" height="110" fill="#FFE9B8"/><circle cx="150" cy="38" r="18" fill="#FFB347"/><rect y="70" width="200" height="40" fill="#5AA0C8"/><path d="M20 72q40-34 80-20t70 20z" fill="#3E7A45"/><rect x="138" y="36" width="8" height="30" fill="#fff" stroke="#2A2A2A"/><rect x="138" y="36" width="8" height="6" fill="#D24B4B"/><path d="M40 90h40M110 96h30" stroke="#E8F6FF" stroke-width="3" stroke-linecap="round"/></svg>
      <p class="mn-note">とりあつかい せつめいしょ</p><p class="mn-co">ヒバリソフト</p></div>` },
    { t: 'おはなし', h: `<h3>おはなし</h3><p>なつやすみ。きみは、おじいちゃんの すむ 小さな島——<b>とこなつ島</b>へ やってきた。</p>
      <p>この島の なつは、<b>ほんとうの なつと いっしょに すすみます</b>。あさが きて、よるが きて、8月31日には なつまつり。</p>
      <p>島の ひとたちは いう。「この島には、だれも しらない ひみつが ある」と……。</p>
      <p class="mn-box">ぼうけんの きろくは、島の たてものに 入るたびや、ひみつを みつけるたびに、カセットの 中に じどうで のこります。</p>` },
    { t: 'そうさ', h: `<h3>そうさの しかた</h3><dl class="mn-keys"><dt>十字ボタン</dt><dd>あるく・えらぶ</dd><dt>Aボタン</dt><dd>はなす・しらべる・けってい</dd><dt>Bボタン</dt><dd>もどる・やめる</dd>
      <dt>START</dt><dd>メニュー（ひみつノート・もちもの・とけい）</dd><dt>SELECT</dt><dd>いまの じかんを みる</dd></dl>
      <p class="mn-small">※A・B・START・SELECTを いっしょに おすと、さいしょの 画面に もどります。</p>` },
    { t: '島の とけい', h: `<h3>島の とけい</h3><p>この カセットには <b>とけい</b> が 入っていて、ゲームを していない あいだも うごいています。</p>
      <p>島の じかんは、<b>ほんとうの じかんと おなじ</b>。よるに なれば 島も よるに。8月の あいだが「なつやすみ」です。</p>
      <p>……9月に なると？　それは あそんでからの おたのしみ。</p>
      <p class="mn-box">※とけいは こうじょうで あわせてあります。じぶんで あわせる ことは できません。</p>` },
    { t: '島の ちず', h: `<h3>島の ちず</h3>${mapSVG}` },
    { t: '島の なかまたち', h: `<h3>島の なかまたち</h3><ul class="mn-people">
      <li><b>ナツ</b>　島の 女の子。げんきで、ちょっと いじっぱり。</li><li><b>おじいちゃん</b>　きみを あずかってくれる。</li>
      <li><b>トメさん</b>　とうだいもり。むかしばなしに くわしい。</li><li><b>せんせい</b>　ぶんこうの せんせい。しゅくだいに きびしい。</li>
      <li><b>なつやの おばちゃん</b>　だがしやさん。</li><li><b>つりの おじさん</b>　いつも さんばしに いる。</li>
      <li><b>ミケ</b>　じんじゃの ねこ。ときどき なにか いいたそう。</li></ul>` },
    { t: '島の カレンダー', h: `<h3>島の 8月</h3><table class="mn-cal"><tr><th>13日〜15日</th><td>おぼん</td></tr><tr><th>31日</th><td>なつまつり（はなびは 20じ から）</td></tr></table>
      <p>ほかにも 島には、いろいろな「ひ」が あります。島の ひとに きいて みよう。</p>` },
    { t: 'おんがく', h: `<h3>おんがく</h3><p class="mn-small">タイトルの「せってい」→ サウンドテスト で きけます。</p><ol class="mn-tracks" start="0">
      ${TRACKS.slice(0, 16).map((t, i) => `<li><span>${String(i).padStart(2, '0')}</span>${t.n}</li>`).join('')}</ol>` },
    { t: 'ちゅうい', h: `<h3>ごちゅうい</h3><ul class="mn-warn">
      <li>でんげんが 入っている ときに カセットを ぬきさし しないでください。データが こわれたり、<b>ふしぎな ことが おこる</b> ことが あります。</li>
      <li>カセットの 中の <b>バックアップ電池</b> が なくなると、セーブデータは きえます。</li>
      <li>画面が みにくい ときは、本体の よこの <b>コントラスト</b> で ちょうせい してください。</li>
      <li>ながい じかん あそぶ ときは、ときどき やすみましょう。</li></ul>` },
    { t: 'スタッフ', h: `<h3>スタッフ</h3><dl class="mn-staff"><dt>プログラム</dt><dd>ひばり まこと</dd><dt>グラフィック</dt><dd>さえき あや</dd><dt>サウンド</dt><dd>くどう しんご</dd>
      <dt>ディレクター</dt><dd>もりやま けい</dd><dt>スペシャルサンクス</dt><dd>ミケ（ひばりけの ねこ）</dd></dl>
      <p class="mn-co2">©1999 ヒバリソフト</p><p class="mn-small">この作品はフィクションです。登場する人物・会社・製品・雑誌は、実在のものとは関係ありません。</p>` }
  ];

  const MAGAZINE = {
    front: `<div class="mg-head"><span class="mg-logo">ピコマガ</span><span class="mg-issue">1999年11月号　P.86</span></div>
      <h3 class="mg-title">ウラ技 ほんと？ ガセ？<small>読者のウラ技 大けんしょう！</small></h3>
      <div class="mg-list">
      <div class="mg-item"><p class="mg-game">【とこなつ島】とけいが あわせられる！</p><p>タイトル画面で SELECTを おしたまま、Bを 3かい おすと、とけいあわせの 画面が でるよ！<span class="mg-by">（ヒロシ・12さい・北海道）</span></p><p class="mg-v ok">◎ ほんと！</p><p class="mg-ed">編集部：ためしたら でた！ でも とけいを いじりすぎると 島の みんなが こまるかも？</p></div>
      <div class="mg-item"><p class="mg-game">【とこなつ島】ミケが しゃべる？</p><p>しゅじんこうの なまえを「ひばり」に すると、じんじゃの ミケが しゃべるって うわさ。<span class="mg-by">（マイ・9さい・大阪府）</span></p><p class="mg-v ng">✕ ガセ</p><p class="mg-ed">編集部：ひばりに したけど「にゃあ」だったよ。</p><p class="mg-pen p1">なまえが ちがうだけ！</p></div>
      <div class="mg-item"><p class="mg-game">【とこなつ島】サウンドテストの かくし曲</p><p>15の つぎに、もう1曲 あるって きいた。<span class="mg-by">（タクヤ・11さい・福岡県）</span></p><p class="mg-v q">？ なぞ</p><p class="mg-ed">編集部：00から15まで 何回きいても、16は でなかった。じゅんばんが あるのかな？</p></div>
      <div class="mg-item"><p class="mg-game">【とこなつ島】ひみつきちの こえ</p><p>ひみつきちで 音を けすと、だれかが はなしかけてくる。<span class="mg-by">（アキ・10さい・宮城県）</span></p><p class="mg-v ng">✕ ガセ</p><p class="mg-ed">編集部：音を けしたら 聞こえるわけ ないよね（笑）</p></div>
      <div class="mg-item"><p class="mg-game">【ポケピコ】カセットを はんぶん ぬくと……</p><p>でんげんを 入れたまま カセットを はんぶん ぬくと、ウラの せかいに いける。<span class="mg-by">（とくめい）</span></p><p class="mg-v warn">⚠ ぜったい マネしないで！</p><p class="mg-ed">編集部：こわれても しらないよ！</p></div>
      <div class="mg-item"><p class="mg-game">【ポケピコ】2000年に なったら こわれる？</p><p>2000年 もんだいで ゲームの とけいが くるうって パパが いってた。<span class="mg-by">（ケンジ・11さい・愛知県）</span></p><p class="mg-v q">？ なぞ</p><p class="mg-ed">編集部：ヒバリさんに きいたら「……たぶん だいじょうぶです」だって。たぶん？</p></div>
      <div class="mg-item mg-yu"><p class="mg-game">【とこなつ島】8月32日が ある！</p><p>8月31日の よる、とうだいの うえで 0じを まつと、9月1日じゃなくて 8月32日に なる。トメさんが そう いってた。<span class="mg-by">（ユウ・10さい・潮見町）</span></p><p class="mg-v ng big" id="mg-yu-v">✕ ガセ</p><p class="mg-ed">編集部：とけいを あわせて ためしたけど、ふつうに 9月1日に なったよ。ユウくん、ゆめでも みたのかな？</p><p class="mg-pen p2">ゆめじゃない！</p><p class="mg-red" id="mg-red" hidden>◎ ほんとうでした</p></div>
      </div><p class="mg-foot">きみの ウラ技を まってるよ！　あてさき：ピコマガ ウラ技係／ふろく ふくろとじ「とこなつ島 7つの ひみつ」は 128ページ！</p>`,
    back: `<div class="mg-back"><div class="mg-ad"><p class="mg-ad-t">あたらしい ポケピコ、でる！？</p><p>うわさの「ポケピコ ライト」は 光る画面？　12月号で ついに 発表！</p></div>
      <div class="mg-art"><p class="mg-art-t">読者イラスト コーナー</p><div class="mg-draw"><svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#fff"/><path d="M20 80q40-40 80 0" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="34" r="16" fill="none" stroke="#333" stroke-width="2"/><path d="M44 30q16-18 32 0" fill="#333"/><circle cx="54" cy="36" r="2"/><circle cx="66" cy="36" r="2"/><path d="M55 44q5 4 10 0" stroke="#333" fill="none" stroke-width="1.5"/><path d="M90 60l6-10 6 10" fill="none" stroke="#333" stroke-width="2"/><circle cx="96" cy="66" r="6" fill="none" stroke="#333" stroke-width="2"/><path d="M16 20l4 4M24 16l2 5M104 18l-4 5" stroke="#E0A800" stroke-width="2"/></svg></div>
      <p class="mg-art-c">「ナツと ミケ」（とこなつ島）<br>ユウ・10さい・潮見町</p><p class="mg-art-ed">編集部：ナツちゃん かわいい！ ミケの しっぽが ポイントだね。</p></div>
      <div class="mg-next"><p class="mg-next-t">12月号 よこく</p><p>ウラ技 さいけんしょう！<br><b>「8月32日」は ほんとうに ないのか！？</b><br>……編集部も ちょっと 気になってます。</p></div></div>`
  };

  const MEMO = `<div class="memo-in"><p class="memo-t">とこなつ島 ひみつ メモ　<span>ユウ</span></p><ol class="memo-l">
    <li><s>いど よる → ほし</s> <i class="ck">✓</i></li>
    <li><s>ミケ しゃべる → なまえを ま<span class="smudge">こと</span> に</s> <i class="ck">✓</i></li>
    <li><s>とうだい ひかり かぞえる → サウンドテスト <span class="smudge">4・2・3</span></s> <i class="ck">✓</i></li>
    <li><s>にしの いわば しお いちばん ひくい とき → どうくつ（でんち いる！）</s> <i class="ck">✓</i></li>
    <li><s>ひがしの おか ながれぼし 3かい ねがう</s> <i class="ck">✓</i></li>
    <li><s>たなばた（ナツが いってた ひ）</s> <i class="ck">✓</i></li>
    <li><s>ひみつきち（きの うしろ）……しーっ</s> <i class="ck">✓</i></li>
    <li class="star">8がつ32にち（トメさんが いってた）→ とうだいの うえ 0じ ☆</li></ol>
    <div class="memo-d"><p><b>8/30</b> ぜんぶ そろった！ あしたは まつり。0じまで おきてる</p>
    <p><b>8/31</b> しゅくだい やってないのが ばれて ゲーム ぼっしゅう。さいあく</p>
    <p><b>9/1</b> かえして もらった。もう 9がつ。まつり おわってた</p>
    <p><b>11/5</b> ピコマガに のった！！ でも ✕ だって。うそじゃないのに</p>
    <p class="memo-last">とけいを いじるのは ずる。らいねんの ほんとうの 8/31 に いく。</p></div></div>`;

  const NOTE = `<div class="note-in"><p class="note-a">ユウへ<br>しゅくだいが おわったら かえします。<br><span class="note-sign">ママ　8/31</span></p>
    <p class="note-b">ユウ、ごめんね。<br>あの日が ゲームの 中の おまつりの日 だったって、あとで ユウの メモを みて しりました。<br>らいねんは いっしょに 0じまで おきてようか。<br><span class="note-sign">ママ</span></p></div>`;

  const BOX = `<div class="box-art"><p class="box-logo">ポケピコ</p><p class="box-sub">ポケット ピコ ステーション ／ ヒバリ</p><div class="box-pic"><span></span></div><p class="box-soft">ソフト『とこなつ島』つき</p>
    <div class="box-name">4ねん1くみ　やまもと ゆう</div>
    <button type="button" class="tag" id="tag" aria-label="値札"><b>ジャンク品</b><span>本体・ソフト・せつめいしょ</span><span>動作未確認</span><em>¥500</em><small>リサイクル ハナマル 潮見店</small></button></div>`;

  const CART_BACK = `<div class="cart-back"><p>ポケピコ専用カートリッジ</p><p>とこなつ島</p><p class="cb-yu">ユウ</p><p class="cb-small">©1999 HIBARI SOFT　MADE IN JAPAN<br>でんげんを 入れたまま ぬきささないでね</p></div>`;

  const CREDITS = (f) => [
    ['big', 'とこなつ島'], ['', '〜なつやすみの ひみつ〜'], ['gap'],
    ['h', 'プログラム'], ['', 'ひばり まこと'], ['h', 'グラフィック'], ['', 'さえき あや'], ['h', 'サウンド'], ['', 'くどう しんご'],
    ['h', 'ディレクター'], ['', 'もりやま けい'], ['h', 'スペシャルサンクス'], ['', 'ミケ'], ['gap'],
    ['h', '8がつ32にちを しんじた ひと'], ['', 'ユウ（10さい）'], ['h', '8がつ32にちを みつけた ひと'], ['', f.name],
    ...(f.fair ? [['h', 'ほんとうの 8がつ31にちを こえた ひと'], ['', f.name]] : []),
    ...(f.wish ? [['h', 'たんざくの ねがい'], ['', f.wish]] : []),
    ['gap'], ['h', '――― このひを みつけた きみへ ―――'],
    ['', '8がつ32にちは、バグでは ありません。'], ['', 'なつやすみに ちゃんと さよならが'], ['', 'できるように、ぼくが こっそり つくった ひ です。'],
    ['', 'もしも きみが、もう おとなに なっていたら'], ['', 'あの なつを おもいだして くれて、ありがとう。'], ['', 'しゅくだいは、おわった？'], ['r', 'ひばり まこと　1999.7'],
    ['gap'], ['big', 'なつやすみ　おわり']
  ];

  return { SECRETS, MAPS, DOORS, EXITS, TIDE, URA_SIGNS, TRACKS, HINTS, MANUAL, MAGAZINE, MEMO, NOTE, BOX, CART_BACK, CREDITS };
})();
