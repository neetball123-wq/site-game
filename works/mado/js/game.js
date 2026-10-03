/* ふたつの窓 — 決まりごと（さわったとき・使ったとき・時間で起きること） */
(() => {
  const I = MD.ITEMS;
  const other = (r) => (r === 'a' ? 'b' : 'a');
  const has = (S, r, id) => S.inv[r].includes(id);
  const give = (S, r, id) => { if (!S.inv[r].includes(id)) S.inv[r].push(id); if (!S.from[id]) S.from[id] = (I[id] && I[id].from) || r; };
  const drop = (S, r, id) => { const i = S.inv[r].indexOf(id); if (i >= 0) S.inv[r].splice(i, 1); };
  const say = (S, r, text) => {
    S.msg[r] = { n: (S.msg[r].n || 0) + 1, text };
    const L = S.log[r]; L.push(text); if (L.length > 40) L.splice(0, L.length - 40);
  };
  const fx = (S, name, room, extra) => { S.fx = Object.assign({ n: (S.fx.n || 0) + 1, name, room, t: Date.now() }, extra || {}); };
  const at = (S, k) => { S.time = Math.max(S.time, MD.TIME[k]); };
  const torchA = (S) => has(S, 'a', 'torch');
  const INSIDE = ['boxes', 'dresser', 'ceiling', 'glass'];
  const beamIn = (S) => torchA(S) && S.f.bCur && INSIDE.includes(S.aim);
  const boxOpen = (S) => ['kit', 'pho', 'boo', 'ito'].filter((k) => S.f['box_' + k]).length;

  const G = {};
  G.has = has; G.other = other; G.say = say; G.beamIn = beamIn; G.torchA = torchA; G.fx = fx;

  /* ---- 天気（どのタブでも同じ時刻なら同じ値） ---- */
  const hash = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  G.wind = (t, S) => {
    S = S || MD.S;
    if (S.ended || S.f.eye) return { w: 0, lull: true, calm: true };
    const ph = t % 13000;
    let w;
    if (ph < 900) w = 0.12 + 0.88 * (ph / 900);
    else if (ph < 8300) w = 0.82 + 0.18 * Math.sin(ph / 470);
    else if (ph < 9100) w = 0.12 + 0.7 * ((9100 - ph) / 800);
    else w = 0.12 + 0.03 * Math.sin(ph / 300);
    return { w, lull: w < 0.3, calm: false };
  };
  G.lightning = (t, S) => {
    S = S || MD.S;
    if (S.ended || S.f.eye) return 0;
    const slot = Math.floor(t / 7000);
    if (hash(slot) > 0.55) return 0;
    const dt = (t % 7000) - hash(slot + 999) * 5200;
    if (dt < 0) return 0;
    if (dt < 110) return 1;
    if (dt < 210) return 0.2;
    if (dt < 320) return 0.85;
    if (dt < 900) return 0.85 * (1 - (dt - 320) / 580);
    return 0;
  };

  /* ---- 明るさ（そこが見えるか） ---- */
  G.lit = (S, r, region) => {
    if (S.ended) return true;
    if (r === 'a') return torchA(S);
    if (r === 'b') {
      if (S.f.candle || has(S, 'b', 'torch')) return true;
      if (!beamIn(S)) return false;
      if (region === 'win') return true;
      if (region === 'box') return S.aim === 'boxes' ? true : S.aim === 'ceiling' ? 'dim' : false;
      if (region === 'dress') return S.aim === 'dresser' ? true : S.aim === 'ceiling' ? 'dim' : false;
      if (region === 'mid') return S.aim === 'glass' || S.aim === 'ceiling' ? 'dim' : S.aim === 'boxes' ? 'dim' : false;
      return S.aim === 'ceiling' ? 'dim' : false;
    }
    if (r === 'c') return !!S.f.cLamp;
    return false;
  };

  /* ---- 段階（ヒント） ---- */
  G.stage = (S) => {
    if (S.ended) return 'end';
    if (!S.f.torchOn) return 'dark';
    if (!S.f.beamed) return 'beam';
    if (!S.f.contact) return 'camera';
    if (S.f.lineB !== 2) return 'line';
    if (!boxOpen(S)) return 'basket';
    if (!S.f.candleEver) return 'candle';
    if (!S.f.phone || !S.talks.t1) return 'phone';
    if (S.cat === 'eave' || !S.talks.t2) return 'cat';
    if (!S.f.eye) return 'film';
    if (!S.talks.t3) return 'eye';
    return 'sleep';
  };

  /* ---- 物を組み合わせる ---- */
  const pair = (a, b, x, y) => (a === x && b === y) || (a === y && b === x);
  G.combine = (S, r, a, b) => {
    if (a === b) return;
    if (pair(a, b, 'torch0', 'batt')) {
      drop(S, r, 'torch0'); drop(S, r, 'batt'); give(S, r, 'torch');
      S.f.torchOn = true; at(S, 'torch');
      say(S, r, r === 'a' ? 'カチッ。懐中電灯がついた。白い光の輪の中に、ひさしぶりの自分の部屋がうかんだ。' : '懐中電灯がついた。');
      return;
    }
    if (pair(a, b, 'reel', 'coins')) { drop(S, r, 'reel'); drop(S, r, 'coins'); give(S, r, 'weighted'); say(S, r, '五円玉の穴に凧糸を通して、何枚もかたく結んだ。これなら、雨の中でも飛ばせる。'); return; }
    if (pair(a, b, 'tin', 'pins')) { drop(S, r, 'tin'); drop(S, r, 'pins'); give(S, r, 'basketItem'); say(S, r, '空き缶のふちに、洗濯ばさみを二つ。糸にひっかければ、すべらせて運べる。缶のかごができた。'); return; }
    if (pair(a, b, 'catcan', 'pins')) { say(S, r, '中に煮干しが入ったままだ。先に、中身を出そう。'); return; }
    if (pair(a, b, 'candle', 'jar')) { drop(S, r, 'candle'); drop(S, r, 'jar'); give(S, r, 'lantern'); say(S, r, 'ジャムの瓶の底に、ろうそくを立てた。瓶のランタンだ。これなら、風で消えない。'); return; }
    if (pair(a, b, 'candle', 'wetmatch') || pair(a, b, 'lantern', 'wetmatch')) { say(S, r, 'シュッ……シュッ。マッチがしけっていて、火がつかない。頭がぼろりと崩れた。'); return; }
    if (pair(a, b, 'candle', 'matches') || pair(a, b, 'candle', 'match3')) { say(S, r, r === 'b' && S.f.bWin ? '火がついた……と思ったら、窓からの風で、ふっと消えた。風よけがほしい。' : '火をつけても、すきま風で炎がたおれて、すぐ消えてしまう。風よけになるものがほしい。'); return; }
    if (pair(a, b, 'lantern', 'matches') || pair(a, b, 'lantern', 'match3')) {
      if (r !== 'b') { say(S, r, 'ここで灯すより、イトの部屋で灯したほうがいい。'); return; }
      drop(S, r, 'lantern'); S.f.lantern = true; S.f.candle = true; S.f.candleEver = true; at(S, 'candle');
      say(S, r, 'シュッ。瓶の中で、小さな火がゆれた。あたたかい灯りが、段ボールだらけの部屋を照らした。');
      say(S, 'a', 'イトの窓が、ぽっとオレンジ色になった。ろうそくの灯りだ。');
      return;
    }
    if (pair(a, b, 'canA', 'reel') || pair(a, b, 'canB', 'reel')) {
      const can = a === 'reel' ? b : a;
      drop(S, r, can);
      if (can === 'canA') S.f.canATied = r; else S.f.canBTied = r;
      if (S.f.canATied && S.f.canBTied) return finishPhone(S, r);
      say(S, r, `「${can === 'canA' ? 'そう' : 'いと'}」の缶の穴に凧糸を通して、中でかたく結んだ。糸巻きのほうを、むこうへ送れば……。`);
      return;
    }
    if (pair(a, b, 'film', 'tape')) { say(S, r, 'フィルムをはるなら、光の通る窓ガラスがいい。（フィルムを選んで、窓に使う）'); return; }
    if (pair(a, b, 'film', 'lens') || pair(a, b, 'film', 'candle') || pair(a, b, 'film', 'torch')) { say(S, r, '近くで見ても、小さくて暗い。人の形のようなものがあるけれど、わからない。……もっと大きくうつせたら。'); return; }
    if (pair(a, b, 'torch', 'film')) { say(S, r, 'すかしても、小さすぎる。'); return; }
    if (pair(a, b, 'board', 'niboshi')) { say(S, r, '板と煮干し。ボタンの通り道に置けば……。（窓に使う）'); return; }
    say(S, r, 'うまく組み合わせられない。');
  };
  const finishPhone = (S, r) => {
    drop(S, 'a', 'reel'); drop(S, 'b', 'reel');
    S.f.phone = true; at(S, 'phone');
    say(S, 'a', '凧糸が路地をまたいで、ふたつの缶をつないだ。窓ぎわの缶を耳にあてれば、話せる。');
    say(S, 'b', '凧糸が路地をまたいで、ふたつの缶をつないだ。窓ぎわの缶を耳にあてれば、話せる。');
  };

  /* ---- 物を見る（手もとで、もう一度さわったとき）。buttons は作品画面のボタン ---- */
  G.itemActions = (S, r, id) => {
    const o = [];
    if (id === 'camera') { o.push(['shootRoom', '部屋を撮る']); o.push(['shootOut', '窓の外を撮る']); }
    if (id === 'catcan') o.push(['empty', '中身を出す']);
    if (id === 'tincans') o.push(['split', 'ふたつに分ける']);
    if (id === 'filmcan') o.push(['openFilm', 'フィルムを出す']);
    if (id === 'book2') o.push(['read:book2', 'しおりのページを読む']);
    if (id === 'album') o.push(['read:album', 'ひらく']);
    if (id === 'letter') o.push(['read:letter', '読む']);
    if (id === 'photos') o.push(['photos', '見る']);
    if (id === 'lens' && r === 'b' && S.f.screen) o.push(['proj', 'スクリーンにかざす']);
    return o;
  };
  G.itemDesc = (S, r, id) => {
    const it = I[id]; if (!it) return '';
    if (id === 'photos') return `撮った写真が${S.photos.length}枚。`;
    if (id === 'reel' && (S.f.canATied || S.f.canBTied)) return '凧糸の糸巻き。糸の先は、缶につながっている。';
    return it.desc;
  };
  G.itemDo = (S, r, id, act) => {
    if (act === 'empty' && id === 'catcan') { drop(S, r, 'catcan'); give(S, r, 'niboshi'); give(S, r, 'tin'); say(S, r, '缶から煮干しを出した。からっぽの缶が残った。'); return; }
    if (act === 'split' && id === 'tincans') { drop(S, r, 'tincans'); give(S, r, 'canA'); give(S, r, 'canB'); say(S, r, '切れた糸をはずして、缶をふたつに分けた。「そう」と「いと」。一年生の字だ。'); return; }
    if (act === 'openFilm' && id === 'filmcan') { drop(S, r, 'filmcan'); give(S, r, 'film'); say(S, r, '缶から、細長いネガを出した。六コマ。光にかざしても、小さくて何が写っているかわからない。'); return; }
    if (act === 'shootRoom' || act === 'shootOut') return G.shoot(S, r, act === 'shootRoom' ? 'room' : 'out');
  };

  /* ---- 写真 ---- */
  const snap = (S) => JSON.parse(JSON.stringify({ f: S.f, cat: S.cat, aim: S.aim, inv: S.inv, basket: S.basket, film: S.film, time: S.time, ended: false, talks: S.talks, frames: S.frames, photos: [] }));
  G.shoot = (S, r, what) => {
    if (r !== 'b') { say(S, r, 'このカメラは、イトのほうが上手に使える。'); return; }
    let subj = what;
    if (what === 'out' && !S.f.bCur) subj = 'curtain';
    const n = S.photos.length + 1;
    S.photos.push({ n, subj, t: S.time, snap: snap(S), stars: !!S.f.eye });
    give(S, 'b', 'photos');
    fx(S, 'flash', 'b', { out: subj !== 'room' });
    const now = Date.now();
    // フラッシュの合図（三回つづけて窓の外へ）
    S.f.flashes = (S.f.flashes || []).filter((t) => now - t < 4000).concat(subj === 'out' ? [now] : []);
    if (subj === 'room') {
      say(S, 'b', 'パシャッ！　フラッシュの白い光で、部屋が一瞬だけ見えた。ジーッと音がして、写真が出てきた。（手もとの写真で見られる）');
      return;
    }
    if (subj === 'curtain') { say(S, 'b', 'パシャッ。……カーテンを撮っても、カーテンしか写らない。'); return; }
    if (S.f.eye) {
      say(S, 'b', 'パシャッ。星の下の、ソウの窓。写真がジーッと出てきた。');
      S.f.starPhoto = true;
      say(S, 'a', 'イトの窓が、白く光った。星の下で、フラッシュ。');
      return;
    }
    if (S.f.flashes.length >= 3 && !S.f.contact3) {
      S.f.contact3 = true;
      say(S, 'a', 'イトの窓が、三回つづけて光った。……三回って、なんの合図だっけ。');
    } else if (S.f.beamed && !S.f.contact) {
      S.f.contact = true; at(S, 'contact');
      say(S, 'b', 'パシャッ！　フラッシュが、ソウの窓にむかって光った。……光が、かえった。');
      say(S, 'a', 'むかいの窓が、パッと白く光った。……イトだ。イトが、光をかえしてきた。');
      return;
    } else if (!S.f.contact) {
      say(S, 'a', 'むかいの窓が、一瞬白く光った……？');
    } else say(S, 'a', 'イトの窓が、パッと光った。');
    say(S, 'b', 'パシャッ。窓の外を撮った。ジーッと写真が出てきた。');
  };
  /* 写真を見たとき（部屋の写真に鍵が写っていたら覚える） */
  G.viewPhoto = (S, r, i) => {
    const p = S.photos[i]; if (!p) return false;
    if (p.subj === 'room' && !p.snap.f.keyTaken && !S.f.sawKey) {
      S.f.sawKey = true;
      say(S, r, '写真の中の部屋。……ドアの横のフックに、小さな鍵がぶらさがっている。補助錠の鍵だ！');
      return;
    }
    return false;
  };

  /* ---- かご ---- */
  G.basketPut = (S, r, id) => {
    const B = S.basket;
    if (B.at !== r || B.item) return;
    if (id === 'cat') {
      if (S.cat !== r) return;
      if (!S.f.eye) { say(S, r, 'この嵐のなかで、ボタンを外に出すなんて、できない。'); return; }
      S.cat = 'basket'; B.item = 'cat';
      say(S, r, 'ボタンを、そっとかごに入れた。ボタンは、星を見上げている。');
      return;
    }
    if (!has(S, r, id)) return;
    drop(S, r, id); B.item = id;
    say(S, r, `${I[id].name}を、かごに入れた。`);
  };
  G.basketTake = (S, r) => {
    const B = S.basket;
    if (B.at !== r || !B.item) return;
    if (B.item === 'cat') { S.cat = r; B.item = null; say(S, r, 'かごから、ボタンをだきあげた。あたたかい。'); return; }
    give(S, r, B.item); say(S, r, `かごから、${I[B.item].name}をとり出した。`); B.item = null;
  };
  G.basketSend = (S, r) => {
    const B = S.basket;
    if (B.at !== r) return;
    if (r === 'b' && !S.f.bWin) { say(S, r, '窓をしめていたら、かごが出せない。'); return; }
    if (r === 'a' && !S.f.aWin) { say(S, r, '窓をしめていたら、かごが出せない。'); return; }
    B.from = r; B.to = other(r); B.t0 = Date.now(); B.at = 'move';
    S.trips++;
    say(S, r, B.item ? 'かごを送り出した。糸をすべって、雨の中をむこうへ。' : 'からっぽのかごを送り出した。');
    fx(S, 'basket', r);
  };
  G.basketPull = (S, r) => {
    const B = S.basket;
    if (B.at !== other(r)) return;
    if (r === 'b' && !S.f.bWin) { say(S, r, '窓をあけないと、かごをたぐりよせられない。'); return; }
    if (r === 'a' && !S.f.aWin) { say(S, r, '窓をあけないと、かごをたぐりよせられない。'); return; }
    B.from = other(r); B.to = r; B.t0 = Date.now(); B.at = 'move';
    S.trips++;
    say(S, r, '糸をたぐって、かごをこちらへよせた。');
  };
  G.basketPos = (S, now) => {
    const B = S.basket;
    if (B.at === 'a') return 0;
    if (B.at === 'b') return 1;
    const p = Math.max(0, Math.min(1, (now - B.t0) / 2600));
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    return B.from === 'a' ? e : 1 - e;
  };

  /* ---- 投げる ---- */
  G.throwLine = (S) => {
    if (!has(S, 'a', 'weighted') || !S.f.aWin) return;
    const w = G.wind(Date.now(), S);
    if (!S.f.bWin) {
      fx(S, 'bonk', 'b');
      say(S, 'a', 'えいっ。……コツン！　五円玉はイトの窓ガラスに当たって、はね返った。イトの窓が、閉まっている。');
      say(S, 'b', 'コツン、と窓ガラスに何かが当たった。外から……？');
      return;
    }
    if (!w.lull) {
      fx(S, 'blown', 'a');
      say(S, 'a', 'えいっ。……投げたとたん、強い風にあおられて、糸は横に流された。糸を巻きもどす。風が弱まる「息つぎ」を待とう。');
      return;
    }
    drop(S, 'a', 'weighted'); give(S, 'a', 'reel');
    S.f.lineB = 1; fx(S, 'throw', 'a');
    say(S, 'a', 'えいっ！　風がやんだ一瞬、五円玉は雨の中をまっすぐ飛んで、イトの窓に吸いこまれた！　糸巻きのほうを、物干しの手すりに結んだ。');
    say(S, 'b', 'チャリン！　五円玉のついた糸が、窓から飛びこんできた！　床に落ちている。');
  };

  /* ---- 窓に使う（イト） ---- */
  const useOnWindowB = (S, item) => {
    const r = 'b';
    if (item === 'key') {
      if (S.f.bLock) { say(S, r, '補助錠は、もうあいている。'); return; }
      drop(S, r, 'key'); S.f.bLock = true; say(S, r, 'カチャ。補助錠があいた。これで窓があけられる。'); return;
    }
    if (item === 'camera') return G.shoot(S, r, 'out');
    if (!S.f.bCur) { say(S, r, 'カーテンが閉まっている。'); return; }
    if (item === 'basketItem') {
      if (S.f.lineB !== 2) { say(S, r, 'ひっかける糸が、まだない。'); return; }
      if (!S.f.bWin) { say(S, r, '窓をあけないと。'); return; }
      drop(S, r, 'basketItem'); S.f.basket = true; at(S, 'basket');
      say(S, r, '窓の外の糸に、缶のかごをひっかけた。ぴんと張った糸をすべって、むこうまで行けそうだ。');
      say(S, 'a', 'イトの窓から、糸に何かがひっかけられた。……缶だ。かごだ。');
      return;
    }
    if (item === 'film') {
      if (!has(S, r, 'tape')) { say(S, r, '手で押さえていたら、ほかに何もできない。何かで、ガラスにはりつけたい。'); return; }
      drop(S, r, 'film'); S.f.filmOn = true;
      say(S, r, 'ガムテープで、ネガを窓ガラスにはりつけた。外からの光が、ネガを通るはずだ。');
      say(S, 'a', 'イトの窓ガラスに、細長いものがはられた。……フィルム？');
      return;
    }
    if (item === 'mirror') {
      if (!S.f.bWin) { say(S, r, '窓をあけないと、外に鏡を出せない。'); return; }
      drop(S, r, 'mirror'); S.f.mirror = true;
      say(S, r, '手鏡を窓の外に出して、角度を変えた。……鏡に、となりの時計屋さんのひさしがうつった。手鏡を窓わくに立てかけておく。（窓を見ると、鏡が見える）');
      return;
    }
    if (item === 'board') {
      if (S.cat !== 'eave') { say(S, r, 'もう、板はいらない。'); return; }
      if (!S.f.bWin) { say(S, r, '窓をあけないと。'); return; }
      if (!S.f.mirror) { say(S, r, 'となりのひさしがどこにあるのか、ここからは見えない。見えないと、板をわたせない。'); return; }
      if (S.aim !== 'tokei' || !torchA(S)) { say(S, r, '鏡にうつるひさしは、まっくらだ。どこに板をのせればいいか、わからない。'); return; }
      drop(S, r, 'board'); S.f.bridge = true;
      say(S, r, '鏡を見ながら、窓わくから時計屋さんのひさしへ、段ボールの板をそっとわたした。ボタンの通り道だ。');
      say(S, 'a', 'イトの窓から、時計屋さんのひさしへ、板がのびた。');
      return;
    }
    if (item === 'niboshi' || item === 'catcan') {
      if (S.cat !== 'eave') { say(S, r, 'ボタンはもう、部屋の中にいる。'); return; }
      if (!S.f.bridge) { say(S, r, '窓わくに置いても、ボタンのいるところからは届かない。'); return; }
      drop(S, r, item); S.f.bait = true;
      say(S, r, '板の先に、煮干しをならべた。……ボタン、おいで。');
      return;
    }
    if (item === 'lantern') { say(S, r, '窓ぎわに置いたら、すぐ雨にぬれてしまう。'); return; }
    if (item === 'tape') { say(S, r, 'ガムテープで窓に何かをはるなら、はるものを選ぼう。'); return; }
    if (item === 'sheet') { say(S, r, '窓にかけたら、外が見えなくなる。シーツは、部屋の中で光を受けるのに使えそうだ。'); return; }
    if (item === 'lens') { say(S, r, '虫めがねで、外の光を集めてみた。……光の点が、ぼんやりゆれる。'); return; }
    if (item === 'torch') { say(S, r, 'こっちから照らしても、ソウの部屋が少し明るくなるだけだ。'); return; }
    say(S, r, 'それは、窓では使えない。');
  };
  const useOnWindowA = (S, item) => {
    const r = 'a';
    if (item === 'torch') { say(S, r, '窓の外を見て、照らす場所を選ぼう。（窓をタップ）'); return 'win'; }
    if (item === 'weighted') { say(S, r, '投げるなら、窓をあけて外を見てから。（窓をタップ）'); return 'win'; }
    if (item === 'basketItem') { say(S, r, 'かごは、むこうの窓からかけてもらおう。'); return; }
    say(S, r, 'それは、窓では使えない。');
  };

  /* ---- 部屋のものにさわる ---- */
  const T = {};
  // ソウの部屋
  T.a_cur = (S, r) => {
    if (S.ended) { say(S, r, 'カーテンは、あけたままにしておく。'); return; }
    if (!S.f.aCur) { S.f.aCur = true; say(S, r, '二週間ぶりに、カーテンをあけた。雨つぶの流れるガラスのむこうに、イトの窓がある。……まっくらだ。'); return; }
    say(S, r, 'カーテンは、あけてある。');
  };
  T.a_win = (S, r, item) => {
    if (item) return useOnWindowA(S, item);
    if (!S.f.aCur) { say(S, r, 'カーテンが閉まっている。二週間前に閉めてから、一度もあけていない。'); return; }
    return 'win';
  };
  T.a_drawer = (S, r) => {
    if (!S.f.drawerA) { S.f.drawerA = true; give(S, r, 'torch0'); say(S, r, torchA(S) ? '引き出しをあけた。懐中電灯があった。' : '手さぐりで、机の引き出しをあけた。……つめたい筒のようなものが、手にふれた。懐中電灯だ。'); return; }
    if (!G.lit(S, 'a')) { say(S, r, '暗くて、引き出しの奥に何があるかわからない。'); return; }
    if (!S.f.cutterTaken) { S.f.cutterTaken = true; give(S, r, 'cutter'); say(S, r, '引き出しの奥に、お父さんのカッター。店の段ボールをあけるのに使っているやつだ。もらっておこう。'); return; }
    say(S, r, '引き出しには、えんぴつと消しゴムと、去年の通知表。');
  };
  T.a_radio = (S, r, item) => {
    if (S.f.radioOff) { say(S, r, item === 'batt' ? 'ラジオに電池をもどしても、懐中電灯のほうが今はだいじだ。' : '電池をぬいたラジオ。しんとしている。'); return; }
    if (!S.f.radioHeard) {
      S.f.radioHeard = true;
      say(S, r, 'ラジオだけが、小さな明かりをつけて鳴っている。「……ザザ……台風十七号は……今夜二時ごろ、この地方の上を、台風の目が……通過する見こみ……」');
      return;
    }
    S.f.radioOff = true; give(S, r, 'batt');
    say(S, r, 'ラジオの裏ぶたをあけて、単三電池を二本ぬいた。ラジオの明かりが消えて、部屋はほんとうにまっくらになった。');
  };
  T.a_clock = (S, r, item) => {
    const hm = MD.fmtTime(S.time);
    if (S.f.eye && !S.ended && !S.f.clockTaken) {
      S.f.clockTaken = true; give(S, r, 'clock');
      say(S, r, `目覚まし時計を手にとった。${hm}。じいちゃんが直してくれた時計。……イトに、わたそうか。`);
      return;
    }
    say(S, r, G.lit(S, 'a') ? `時田のじいちゃんが直してくれた目覚まし時計。チクタク動いている。いまは、${hm}。` : 'チクタク、チクタク。暗やみで、目覚まし時計の音だけがする。');
  };
  T.a_oshi = (S, r) => {
    if (!G.lit(S, 'a')) { say(S, r, '押し入れ。暗くて、どこに何があるかわからない。手を入れると、ふとんばかりだ。'); return; }
    if (!S.f.reelTaken) { S.f.reelTaken = true; give(S, r, 'reel'); say(S, r, '押し入れの奥に、去年イトと作った凧。凧糸がたっぷり巻いてある。凧糸の糸巻きを持っていこう。'); return; }
    say(S, r, '押し入れの奥に、凧。「そう」と「いと」の字が、ならんで書いてある。');
  };
  T.a_bank = (S, r) => {
    if (!G.lit(S, 'a')) { say(S, r, '本棚の上に、つるつるした丸いもの。……貯金箱かな。暗くてよくわからない。'); return; }
    if (!S.f.coinsTaken) { S.f.coinsTaken = true; give(S, r, 'coins'); say(S, r, 'ブタの貯金箱。中身は五円玉ばかりだ。「ご縁がありますように」って、じいちゃんが言ってた。底のふたをあけて、ひとつかみ出した。'); return; }
    say(S, r, 'ブタの貯金箱。まだ五円玉が入っている。');
  };
  T.a_kayari = (S, r) => {
    if (!G.lit(S, 'a')) { say(S, r, '窓ぎわに、陶器の何か。暗くてよく見えない。'); return; }
    if (!S.f.matchesTaken) { S.f.matchesTaken = true; give(S, r, 'matches'); say(S, r, '夏の蚊やりぶた。となりにマッチ箱がある。部屋の中にあったから、乾いている。'); return; }
    say(S, r, '蚊やりぶた。夏の終わりのにおいがする。');
  };
  T.a_shelf = (S, r) => {
    if (!G.lit(S, 'a')) { say(S, r, '本棚。暗くて、背表紙が読めない。'); return; }
    return 'read:weather';
  };
  T.a_cal = (S, r) => {
    if (!G.lit(S, 'a')) { say(S, r, '壁の、紙の何か。暗くて見えない。'); return; }
    say(S, r, '九月のカレンダー。三十日に「イト　ひっこし」と書いて、えんぴつでぐしゃぐしゃに消してある。……今日は、二十九日だ。');
  };
  T.a_futon = (S, r) => {
    if (S.ended) { say(S, r, 'たたんだふとん。'); return; }
    if (S.talks.t3) return 'sleep';
    say(S, r, S.f.eye ? 'ふとん。……まだ、ねむれない。イトと話してから。' : 'まるめたふとん。……今夜は、ねむれそうにない。');
  };
  T.a_phone = (S, r) => phoneTap(S, r);
  T.a_cat = (S, r, item) => {
    if (item === 'niboshi') { say(S, r, 'ボタンは、煮干しをぺろりと食べた。'); drop(S, r, 'niboshi'); return; }
    say(S, r, S.f.eye ? 'ボタンが、窓ぎわで星を見ている。（かごに入れれば、イトのところへ送れる）' : 'ボタンが、のどを鳴らしている。');
  };

  // イトの部屋
  T.b_cur = (S, r) => {
    if (S.ended) { say(S, r, 'カーテンは、もう荷物の中だ。'); return; }
    if (!S.f.bCur) {
      S.f.bCur = true;
      say(S, r, G.torchA(S) && S.aim === 'curtain' ? 'まぶしい光がカーテンをすかしている。カーテンをあけた。……光が、部屋の中に差しこんできた！' : '手さぐりで、カーテンをあけた。二週間ぶりだ。窓の外も、まっくら。……むかいは、ソウの窓だ。');
      if (S.aim === 'curtain') { S.aim = 'boxes'; S.f.beamed = true; say(S, 'a', 'イトのカーテンがあいた。懐中電灯の光が、イトの部屋の奥まで差しこんだ。'); }
      return;
    }
    say(S, r, 'カーテンは、あけてある。');
  };
  T.b_win = (S, r, item) => {
    if (item) return useOnWindowB(S, item);
    if (!S.f.bCur) { say(S, r, 'カーテンが閉まっている。'); return; }
    return 'win';
  };
  const BOX = { kit: { label: 'だいどころ', items: ['candle', 'wetmatch', 'jar', 'tape'], text: '台所の箱。ろうそくと、マッチと、ジャムのあき瓶と、ガムテープ。' },
    pho: { label: 'しゃしん', items: ['album', 'filmcan'], text: '写真の箱。アルバムと、黒いフィルムの缶。' },
    boo: { label: 'ほん', items: ['book2', 'lens'], text: '本の箱。図鑑の間に、虫めがねがはさまっていた。' },
    ito: { label: 'いと　たからもの', items: ['tincans', 'letter'], text: '「いと　たからもの」の箱。……缶の糸電話と、封筒。' } };
  const boxTap = (k) => (S, r, item) => {
    const B = BOX[k], lv = G.lit(S, 'b', 'box');
    if (!lv) { say(S, r, '段ボールの山。暗くて、何も読めない。手でさわると、ガムテープでぐるぐる巻きだ。'); return; }
    if (lv === 'dim' && !S.f['box_' + k]) { say(S, r, '段ボールの影。うす明かりで、字までは読めない。'); return; }
    if (item === 'sheet') return hangSheet(S, r);
    if (!S.f['box_' + k]) {
      if (item !== 'cutter') { say(S, r, `段ボールに、マジックで「${B.label}」。ガムテープでぐるぐる巻きだ。手じゃあかない。`); return; }
      S.f['box_' + k] = true; for (const id of B.items) give(S, r, id);
      say(S, r, `カッターでガムテープを切った。${B.text}`);
      return;
    }
    if (item === 'board' || item === 'tape') { say(S, r, 'それは、ここでは使わない。'); return; }
    if (!S.f['flat_' + k]) {
      if (k === 'kit' || k === 'pho') { say(S, r, `からっぽの「${B.label}」の箱。床に置いたまま、台にしておこう。`); return; }
      S.f['flat_' + k] = true; give(S, r, 'board');
      say(S, r, `からっぽになった「${B.label}」の箱。……たたんで、板にした。`);
      if (S.f.bridge) say(S, r, `からっぽになった「${B.label}」の箱を、たたんでおいた。`);
      return;
    }
    say(S, r, 'たたんだ段ボール。');
  };
  T.b_box1 = boxTap('kit'); T.b_box2 = boxTap('pho'); T.b_box3 = boxTap('boo'); T.b_box4 = boxTap('ito');
  T.b_camera = (S, r) => {
    const lv = G.lit(S, 'b', 'box');
    if (lv === true) { S.f.cameraTaken = true; give(S, r, 'camera'); say(S, r, '光の輪の中に、お父さんのおさがりのインスタントカメラ。フラッシュつきだ。……そうだ、フラッシュなら、光をかえせる。'); return; }
    const L = G.lightning(Date.now(), S);
    if (L > 0.3) { S.f.sawCamera = true; say(S, r, '（いなずまで一瞬だけ見えた）段ボールの上に、カメラがある！　……でも、また真っ暗になって、どこだかわからない。'); return; }
    say(S, r, lv === 'dim' ? '段ボールの上に、何か黒い四角いものがある……？　暗くて、よくわからない。' : 'まっくらで、何も見えない。');
  };
  T.b_dresser = (S, r, item) => {
    const lv = G.lit(S, 'b', 'dress');
    if (item === 'sheet' && lv === true) return hangSheet(S, r);
    if (lv !== true) {
      if (G.lightning(Date.now(), S) > 0.3) { say(S, r, '（いなずまで一瞬）鏡台の鏡が、ぎらりと光った。'); return; }
      say(S, r, lv === 'dim' ? '鏡台の影。鏡がにぶく光っている。' : 'まっくらで、何も見えない。'); return;
    }
    if (!S.f.mirrorTaken) { S.f.mirrorTaken = true; give(S, r, 'mirror'); say(S, r, 'ひっこしで持っていく鏡台。引き出しに、丸い手鏡があった。'); return; }
    say(S, r, '鏡台。鏡の中に、ゆれる灯りがうつっている。');
  };
  T.b_door = (S, r) => {
    if (S.f.keyTaken) { say(S, r, 'ドア。下ではおばあちゃんが寝ている。階段は、まっくらだ。'); return; }
    if (S.f.candle || has(S, 'b', 'torch') || S.f.sawKey) {
      S.f.keyTaken = true; give(S, r, 'key');
      say(S, r, S.f.sawKey && !S.f.candle ? '写真で見たとおりの場所を、手さぐりで……あった。ドアの横のフックに、補助錠の鍵。' : 'ドアの横のフックに、小さな鍵。補助錠の鍵だ。');
      return;
    }
    if (G.lightning(Date.now(), S) > 0.3) { say(S, r, '（いなずまで一瞬）ドアのあたりに、何か小さく光るものが……？　また暗くなった。'); return; }
    say(S, r, 'ドアのあたり。まっくらで、手さぐりしても、何もつかめない。……ソウの光も、ここまでは届かない。');
  };
  const hangSheet = (S, r) => {
    if (S.f.screen) { say(S, r, 'シーツは、もうかけてある。'); return; }
    drop(S, r, 'sheet'); S.f.screen = true;
    say(S, r, '段ボールを積んで、シーツを広げてかけた。窓とむきあう、白いスクリーンができた。');
  };
  T.b_bed = (S, r, item) => {
    if (S.ended) return;
    if (item === 'sheet') return hangSheet(S, r);
    if (S.talks.t3) return 'sleep';
    if (!S.f.sheetTaken) { S.f.sheetTaken = true; give(S, r, 'sheet'); say(S, r, G.lit(S, 'b') === true ? 'マットレスだけのベッド。たたんだシーツがのっている。もらっておこう。' : '手さぐりで、ベッドの上のシーツをつかんだ。'); return; }
    say(S, r, S.f.eye ? 'ベッド。……まだ、ねむれない。' : 'マットレスだけのベッド。今夜で、さいごだ。');
  };
  T.b_can = (S, r) => {
    if (G.lit(S, 'b', 'win') !== true) { say(S, r, S.f.bCur ? '窓ぎわに、丸い缶のようなもの。暗くてよく見えない。' : 'カーテンのむこうの窓ぎわ。'); return; }
    S.f.canTaken = true; give(S, r, 'catcan'); say(S, r, 'ボタンのごはん用の、お菓子の缶。煮干しが少し入っている。');
  };
  T.b_pins = (S, r) => {
    if (G.lit(S, 'b', 'win') !== true) { say(S, r, 'カーテンレールのはしに、何かぶらさがっている。暗くてよく見えない。'); return; }
    S.f.pinsTaken = true; give(S, r, 'pins'); say(S, r, 'カーテンレールにかけたハンガーから、洗濯ばさみを二つはずした。');
  };
  T.b_string = (S, r) => {
    if (S.f.lineB !== 1) return;
    S.f.lineB = 2; at(S, 'line');
    say(S, r, '五円玉の糸をひろって、窓の手すりにかたく結んだ。路地をまたいで、凧糸が一本、ぴんと張った。');
    say(S, 'a', 'イトが、糸を結んだ。路地をまたいで、凧糸が一本、ぴんと張った。');
  };
  T.b_lantern = (S, r, item) => {
    if (S.f.candle) { S.f.candle = false; say(S, r, 'ふっ。ランタンの火を消した。部屋がまた暗くなった。'); say(S, 'a', 'イトの窓の灯りが、消えた。'); return; }
    if (item === 'matches' || item === 'match3') { S.f.candle = true; say(S, r, 'シュッ。ランタンに、また火をともした。'); say(S, 'a', 'イトの窓に、また灯りがついた。'); return; }
    if (item === 'wetmatch') { say(S, r, 'しけったマッチでは、つかない。'); return; }
    say(S, r, '火の消えたランタン。マッチがあれば、またつけられる。');
  };
  T.b_screen = (S, r, item) => {
    if (item === 'lens') return 'proj';
    say(S, r, '段ボールにかけたシーツのスクリーン。' + (S.f.filmOn && S.aim === 'glass' && torchA(S) ? (S.f.candle ? '光が当たっているけど、ろうそくの灯りで、ぼんやりしている。' : '光が当たって、ぼんやり何かがうつっている。虫めがねで、ピントを合わせれば……。') : '白くて、うすい。'));
  };
  T.b_phone = (S, r) => phoneTap(S, r);
  T.b_cat = (S, r, item) => {
    if (item === 'niboshi') { say(S, r, 'ボタンは、煮干しをぺろりと食べた。'); drop(S, r, 'niboshi'); return; }
    say(S, r, S.f.eye ? 'ボタンが、ベッドの上でまるくなっている。（かごに入れれば、ソウのところへ送れる）' : 'ボタンが、ベッドの上で毛づくろいをしている。');
  };

  // 時計店の二階
  T.c_drawer = (S, r) => {
    if (!S.f.cDrawer) { S.f.cDrawer = true; give(S, r, 'match3'); give(S, r, 'winder'); say(S, r, S.f.cLamp ? '作業台の引き出し。マッチと、柱時計のねじ巻き。' : '手さぐりで、作業台の引き出しをあけた。……マッチの箱と、金具のようなもの。'); return; }
    say(S, r, '引き出しには、小さなねじと、ピンセット。');
  };
  T.c_lamp = (S, r, item) => {
    if (S.f.cLamp) { say(S, r, '石油ランプの灯り。作業台の上の、ルーペや歯車がうかびあがる。'); return; }
    if (item === 'match3' || item === 'matches') {
      S.f.cLamp = true;
      say(S, r, 'シュッ。石油ランプに火が入った。……時計だらけの部屋。作業台、柱時計、小さな座布団。だれもいないのに、さっきまで誰かがいたみたいだ。');
      say(S, 'a', '……時計屋さんの二階の窓に、ぼうっと灯りがついた。春から、ずっと真っ暗だったのに。');
      return;
    }
    say(S, r, '作業台の上の、石油ランプ。手さぐりでわかる。火をつけるものがあれば。');
  };
  T.c_note = (S, r) => { if (!S.f.cLamp) { say(S, r, '作業台の上に、ノートのようなもの。暗くて読めない。'); return; } S.f.cNote = true; return 'read:diary'; };
  T.c_clock = (S, r, item) => {
    if (!S.f.cLamp) { say(S, r, '背の高い影。……柱時計だ。音はしない。'); return; }
    if (!S.f.cWound) {
      if (item !== 'winder') { say(S, r, '大きな柱時計。三時十二分で止まっている。文字盤の穴に、ねじ巻きをさすところがある。'); return; }
      S.f.cWound = true;
      say(S, r, 'ねじ巻きをさして、ギリ、ギリと巻いた。振り子が、ゆれはじめた。カチ、コチ、カチ、コチ。……でも、針は三時十二分のままだ。');
      say(S, 'b', 'となりの時計屋さんから、カチ、コチ、と小さな音がする……？');
      return;
    }
    if (S.f.cSet) { say(S, r, '柱時計が、カチ、コチと時をきざんでいる。'); return; }
    return 'clockset';
  };
  T.c_box = (S, r) => {
    if (!S.f.cLamp) { say(S, r, '棚の上に、小さな箱のようなもの。'); return; }
    if (S.f.cSet) { S.f.cBox = true; say(S, r, '「ソウとイトへ」と書いた小箱のふたが、あいている。中には、ちいさな懐中時計がふたつ。裏に、「そう」「いと」と彫ってある。どちらも、柱時計と同じ時刻をさしている。'); return; }
    say(S, r, '「ソウとイトへ」と書いた小箱。ふたが、あかない。鍵穴のかわりに、ふたに柱時計の絵が彫ってある。');
  };
  T.c_cushion = (S, r) => { say(S, r, S.f.cLamp ? '小さな座布団。三毛の毛が、たくさんついている。ボタンの場所だ。' : '床に、やわらかいもの。'); };
  T.c_wall = (S, r) => { say(S, r, !S.f.cLamp ? 'カチ……とも、コチ……とも言わない。' : S.f.cWound ? '壁いっぱいの時計。柱時計だけが、動いている。' : '壁いっぱいの時計。どれも、止まっている。'); };
  T.c_win = () => 'win';

  /* 糸電話 */
  const pendingTalk = (S) => {
    if (S.f.phone && !S.talks.t1) return 't1';
    if (S.talks.t1 && S.cat !== 'eave' && !S.talks.t2) return 't2';
    if (S.f.eye && !S.talks.t3) return 't3';
    return null;
  };
  const phoneTap = (S, r) => {
    if (!S.f.phone) { say(S, r, '糸の先は、まだむこうの缶につながっていない。'); return; }
    const id = pendingTalk(S);
    if (id) return G.startTalk(S, id);
    const st = G.stage(S);
    const pool = MD.TALK.chat[st] || MD.TALK.chat.any;
    const k = (S.f.chatN = (S.f.chatN || 0) + 1);
    const lines = pool[k % pool.length].map(([who, text]) => ({ who, text }));
    S.talk = { id: 'chat', i: 0, lines };
  };
  G.startTalk = (S, id, lines) => {
    lines = lines || MD.TALK[id].filter((l) => !l.if || l.if(S)).map((l) => ({ who: l.who, text: l.text }));
    S.talk = { id, i: 0, lines };
  };
  G.talkNext = (S) => {
    if (!S.talk) return false;
    S.talk.i++;
    if (S.talk.i < S.talk.lines.length) return;
    const id = S.talk.id;
    S.talk = null;
    S.talks[id] = true;
    if (id === 't1') { S.time = Math.max(S.time, MD.TIME.phone + 10); }
    if (id === 't2' && S.f.filmDone && !S.f.eyeAt) S.f.eyeAt = Date.now() + 2500;
    if (id[0] === 'f') {
      if (Object.keys(S.frames).length >= 6 && !S.f.filmDone) {
        S.f.filmDone = Date.now(); at(S, 'film');
        if (S.talks.t2) S.f.eyeAt = Date.now() + 2500;
        say(S, 'a', 'ソウは、しばらく何も言えなかった。'); say(S, 'b', 'イトは、シーツの上の白い光を、しばらく見ていた。');
      }
    }
    if (id === 't3') {
      S.f.canSleep = true;
      say(S, 'a', '（わたしたいものがあれば、かごで。ボタンは、朝いる部屋の家の子になる。ねむるときは、ふとんへ）');
      say(S, 'b', '（わたしたいものがあれば、かごで。ボタンは、朝いる部屋の家の子になる。ねむるときは、ベッドへ）');
    }
  };

  /* ---- 窓の外（近くで見る）でさわる ---- */
  const AIMTXT = {
    boxes: 'イトの部屋の、段ボールの山を照らした。',
    dresser: 'イトの部屋の、鏡台のあたりを照らした。鏡がぎらりと光った。',
    ceiling: 'イトの部屋の天井を照らした。部屋じゅうが、うすぼんやり明るくなった。',
    glass: 'イトの窓にはられたフィルムを、まっすぐ照らした。',
    tokei: 'となりの時計屋さんのひさしを照らした。',
    curtain: 'イトの窓を照らした。……カーテンが閉まっている。光が、カーテンにまるくうつった。',
  };
  const BTXT = {
    boxes: 'まぶしい光が、窓から差しこんで、段ボールの山を照らしている。',
    dresser: '光が、鏡台を照らしている。鏡がぎらりと光った。',
    ceiling: '光が天井に当たって、部屋じゅうがうすぼんやり明るい。……でも、細かいものまでは見えない。',
    glass: '光が、窓にはったフィルムを通りぬけている。',
  };
  G.aim = (S, target) => {
    if (!torchA(S)) { say(S, 'a', '照らすものがない。'); return; }
    if (target !== 'curtain' && target !== 'tokei' && !S.f.bCur) target = 'curtain';
    if (target === 'glass' && !S.f.filmOn) target = 'boxes';
    if (S.aim === target && target !== 'tokei') { say(S, 'a', AIMTXT[target].replace('照らした', '照らしている')); return; }
    S.aim = target;
    let t = AIMTXT[target];
    if (target === 'curtain') { if (!S.f.bCurGlow) { S.f.bCurGlow = true; } say(S, 'b', 'カーテンのむこうが、ぼうっと明るい……？　だれかが、外から照らしている。'); }
    else if (target === 'tokei') {
      if (S.cat === 'eave') { t += ' ……ひさしの奥で、ふたつの目が光った。三毛の猫。ずぶぬれでまるくなっている。ボタンだ！'; S.f.catSeen = true; }
      else t += ' ……もう、ボタンはいない。';
      if (S.f.mirror) say(S, 'b', '窓わくの鏡に、光に照らされた時計屋さんのひさしがうつった。');
    } else {
      if (!S.f.beamed) { S.f.beamed = true; t += ' 光の輪が、イトの部屋の中を動いた。'; }
      say(S, 'b', BTXT[target]);
    }
    say(S, 'a', t);
  };
  G.blink = (S, n) => {
    if (!torchA(S) || !S.aim) return;
    const txt = n === 1 ? 'ソウの窓の光が、一回またたいた。……「おやすみ」の合図だ。' : n === 2 ? 'ソウの窓の光が、二回またたいた。……「まだ起きてる？」の合図。' : n === 3 ? 'ソウの窓の光が、三回またたいた。……三回。ソウは、三回の意味を知らないはずなのに。' : `ソウの窓の光が、${n}回またたいた。`;
    say(S, 'b', txt);
    say(S, 'a', `懐中電灯を、${n}回つけたり消したりした。`);
  };
  G.winToggle = (S, r) => {
    if (r === 'a') {
      S.f.aWin = !S.f.aWin;
      say(S, r, S.f.aWin ? (S.f.eye ? '窓をあけた。しずかな夜の空気が入ってきた。' : '窓をあけた。ゴウッと風が吹きこんで、雨つぶが顔にあたる。') : '窓をしめた。雨の音が、少し遠くなった。');
      return;
    }
    if (r === 'b') {
      if (!S.f.bLock) { say(S, r, '窓があかない。補助錠がかかっている。鍵は……荷づくりのとき、どこかにかけたはず。'); return; }
      S.f.bWin = !S.f.bWin;
      say(S, r, S.f.bWin ? (S.f.eye ? '窓をあけた。' : '窓をあけた。ゴウッと風が吹きこんだ。むかいのソウの窓が、雨のむこうに見える。') : '窓をしめた。');
      if (S.f.bWin) say(S, 'a', 'イトの窓が、あいた。');
    }
  };
  G.viewTap = (S, r, h, item) => {
    if (r === 'a') {
      if (item === 'torch' || !item) {
        if (['va_cur', 'va_boxes', 'va_dresser', 'va_ceiling', 'va_glass', 'va_tokei'].includes(h)) {
          if (!torchA(S)) {
            if (h === 'va_tokei') { say(S, r, 'となりの時計屋さん。ひさしの奥は、まっくらだ。……何か、鳴き声がしたような。'); return; }
            say(S, r, S.f.bCur ? 'イトの窓は、まっくらだ。何も見えない。' : 'イトの窓は、カーテンが閉まったまま。二週間、ずっと。'); return;
          }
          return G.aim(S, h.slice(3));
        }
      }
      if (h === 'va_cwin') { say(S, r, MD.others().c || S.f.cLamp ? '時計屋さんの二階の窓に、灯りがゆれている。……だれか、いるのかな。' : '時田のじいちゃんの店。春から、ずっと真っ暗だ。……三つめの窓。'); return; }
      if (h === 'va_sign') { say(S, r, '「ひかり写真館」の看板。イトのお父さんの店。明日には、もう……。'); return; }
      if (h === 'va_frame') {
        if (item === 'weighted') return G.throwLine(S);
        if (item) return useOnWindowA(S, item);
        say(S, r, S.f.aWin ? '物干しの手すり。雨でつめたい。' : '窓は閉まっている。'); return;
      }
    }
    if (r === 'b') {
      if (h === 'vb_mirror') {
        if (item) return useOnWindowB(S, item);
        if (S.cat !== 'eave') { say(S, r, '鏡に、時計屋さんのひさしがうつっている。板と、煮干しのかけらだけ。'); return; }
        const lit = S.aim === 'tokei' && torchA(S);
        if (!lit) { say(S, r, '鏡の中は、まっくらだ。……ニャア、と小さな声。'); return; }
        if (!S.f.bridge) { say(S, r, '鏡の中に、ずぶぬれのボタン！　ひさしの上でまるくなっている。窓わくまでは、少しはなれている。渡れる道があれば……。'); return; }
        if (!S.f.bait) { say(S, r, '板のむこうで、ボタンがこちらを見ている。でも、動かない。……何か、さそうものがあれば。'); return; }
        say(S, r, '板の先の煮干しを、ボタンがじっと見ている。風が強くて、身をふせている。……風がやむのを待とう。'); return;
      }
      if (h === 'vb_awin') { say(S, r, !S.f.aCur ? 'ソウの窓。カーテンが閉まったまま。' : torchA(S) && S.aim ? 'ソウの窓から、まっすぐな光がこちらを照らしている。まぶしい。' : 'ソウの窓。暗い。'); return; }
      if (h === 'vb_edge') { say(S, r, S.f.mirror ? '窓のはしから、となりの時計屋さんのひさしのはしが、ほんの少しだけ見える。' : '窓のはしから、となりの時計屋さんのひさしのはしが、ほんの少しだけ見える。でも、その先は角のむこうで見えない。'); return; }
      if (h === 'vb_tree') { say(S, r, S.f.eye ? '空き地の木が、しずかに立っている。' : '空き地の木が、風で大きくしなっている。ときどき、ふっと止まる。'); return; }
      if (h === 'vb_sign') { say(S, r, '「みなもと酒店」。ソウの家。シャッターに、雨がたたきつけている。'); return; }
      if (h === 'vb_frame' || h === 'vb_glass') {
        if (item) return useOnWindowB(S, item);
        if (!S.f.bLock) { say(S, r, '補助錠がかかっていて、窓があかない。'); return; }
        say(S, r, S.f.bWin ? '窓わく。糸を結ぶ手すりがある。' : '窓は閉まっている。'); return;
      }
    }
    if (r === 'c') {
      if (h === 'vc_awin') { say(S, r, 'むかいの酒屋の二階。ソウの窓。' + (torchA(S) ? '懐中電灯の光が見える。' : '')); return; }
      if (h === 'vc_line') { say(S, r, S.f.lineB === 2 ? '路地をまたいで、凧糸が一本。となりの窓まで。' : '雨。'); return; }
    }
    say(S, r, item ? 'それは、ここでは使えない。' : '雨が、たたきつけている。');
  };

  /* ---- 部屋のものにさわる（入口） ---- */
  G.tap = (S, r, h, item) => {
    const f = T[h];
    if (!f) return;
    // 使い道のない物を持ってさわったときは、そう言う
    if (item && /^(a_cur|b_cur|a_oshi|a_bank|a_cal|a_shelf|a_drawer|b_door|b_can|b_pins|b_camera|c_drawer|c_note|c_cushion|c_wall|c_box|a_futon)$/.test(h)) { say(S, r, `${I[item] ? I[item].name : 'それ'}は、ここでは使えない。`); return; }
    return f(S, r, item);
  };

  /* ---- 時計を合わせる（三つめの窓） ---- */
  G.setClock = (S, r, mins) => {
    const diff = Math.abs(((mins - (S.time + 22 * 60)) % 720 + 720) % 720);
    const d = Math.min(diff, 720 - diff);
    if (d > 10) { say(S, r, `柱時計の針を${MD.fmtClock(mins)}に合わせた。……何も起きない。いまは、何時だろう。この店の時計は、どれも止まっている。`); return; }
    S.f.cSet = true;
    say(S, r, `柱時計の針を${MD.fmtClock(mins)}に合わせた。……ボーン、ボーン。柱時計が鳴った。棚の小箱で、カチリと音がした。`);
    say(S, 'a', '時計屋さんのほうから、ボーン、ボーン……と、柱時計の鳴る音がした。春から止まっていたはずの。');
    say(S, 'b', 'となりから、ボーン、ボーン……と、柱時計の音。じいちゃんの時計だ。');
    fx(S, 'chime', 'c');
  };

  /* ---- 時間で起きること（どのタブが進めてもよい。二重には起きない） ---- */
  G.tick = (S, now) => {
    let ch = false;
    const B = S.basket;
    if (B.at === 'move' && now >= B.t0 + 2600) {
      B.at = B.to; ch = true;
      if (B.item === 'cat') {
        S.cat = B.to; B.item = null;
        say(S, B.to, 'かごがとどいた。……ボタンが、ぴょんと窓から飛びこんできた。');
        say(S, B.from, 'かごがむこうにとどいた。ボタンが、むこうの部屋に飛びおりた。');
      } else {
        say(S, B.to, B.item ? `かごがとどいた。中に、${I[B.item].name}。` : 'からっぽのかごが、とどいた。');
        if (S.talks.t3 && B.item) { S.giftLog = S.giftLog || { a: [], b: [] }; S.giftLog[B.to].push(B.item); }
      }
    }
    if (S.cat === 'eave' && !S.f.catGo && S.f.bridge && S.f.bait && S.aim === 'tokei' && torchA(S) && G.wind(now, S).lull) {
      S.f.catGo = now; ch = true;
      say(S, 'b', '風がやんだ。……鏡の中で、ボタンが立ちあがった。板の上を、一歩、また一歩。');
      say(S, 'a', '光の中で、ボタンが立ちあがった。板の上を、イトの窓へ歩いていく。');
    }
    if (S.f.catGo && S.cat === 'eave' && now >= S.f.catGo + 2800) {
      S.cat = 'b'; S.f.catSaved = true; at(S, 'cat'); ch = true;
      S.f.mirror = false; give(S, 'b', 'mirror');
      say(S, 'b', '窓わくに飛びのって、ボタンが部屋に入ってきた！　ずぶぬれだ。……おかえり、ボタン。（手鏡は、しまっておいた）');
      say(S, 'a', 'ボタンが、イトの窓に飛びこんだ。……よかった。');
    }
    if (S.f.eyeAt && !S.f.eye && now >= S.f.eyeAt) {
      S.f.eye = true; at(S, 'eye'); ch = true;
      G.startTalk(S, 't3');
    }
    return ch;
  };

  /* ---- ねむる ---- */
  G.sleep = (S) => {
    if (S.ended || !S.talks.t3) return false;
    if (S.cat === 'basket' || S.basket.at === 'move') return false;
    const L = S.giftLog || { a: [], b: [] };
    const giftsA = S.inv.a.filter((id) => (S.from[id] || I[id].from) === 'b' && L.a.includes(id));
    const giftsB = S.inv.b.filter((id) => (S.from[id] || I[id].from) === 'a' && L.b.includes(id));
    if (S.basket.item && S.basket.item !== 'cat') { const id = S.basket.item, to = S.basket.at; if ((S.from[id] || I[id].from) !== to && L[to].includes(id)) (to === 'a' ? giftsA : giftsB).push(id); }
    S.gifts = { a: giftsA, b: giftsB };
    S.ending = S.cat === 'a' ? 'stay' : 'go';
    S.ended = true; S.endAt = Date.now();
    S.time = MD.TIME.morning;
    S.talk = null;
    S.f.cDone = !!S.f.cSet;
    say(S, 'a', '……朝。雨の音は、もうしない。');
    say(S, 'b', '……朝。からっぽの部屋に、日が差している。');
    say(S, 'c', '……朝。');
  };

  /* ---- ヒント ---- */
  G.HINT_AT = [2, 5, 8].map((m) => m * 60000);

  /* ---- 試験用：段階を飛ばす ---- */
  G.skipTo = (S, st) => {
    const order = ['dark', 'beam', 'camera', 'line', 'basket', 'candle', 'phone', 'cat', 'film', 'eye', 'sleep', 'end'];
    const n = order.indexOf(st); if (n < 0) return;
    S.started = true;
    const set = (k) => order.indexOf(k) < n;
    if (set('dark')) { S.inv.a = ['torch']; S.f.drawerA = true; S.f.radioHeard = true; S.f.radioOff = true; S.f.torchOn = true; S.f.aCur = true; }
    if (set('beam')) { S.f.bCur = true; S.aim = 'boxes'; S.f.beamed = true; }
    if (set('camera')) { S.inv.b = ['camera']; S.f.cameraTaken = true; S.f.contact = true; }
    if (set('line')) { S.f.keyTaken = true; S.f.bLock = true; S.f.bWin = true; S.f.aWin = true; S.f.reelTaken = true; S.f.coinsTaken = true; S.inv.a.push('reel', 'cutter'); S.f.cutterTaken = true; S.f.lineB = 2; }
    if (set('basket')) { S.f.canTaken = true; S.f.pinsTaken = true; S.inv.b.push('niboshi'); S.f.basket = true; S.inv.a = S.inv.a.filter((x) => x !== 'cutter'); S.inv.b.push('cutter'); for (const k of ['kit', 'pho', 'boo', 'ito']) { S.f['box_' + k] = true; S.inv.b.push(...BOX[k].items); } }
    if (set('candle')) { S.inv.b = S.inv.b.filter((x) => !['candle', 'jar', 'wetmatch'].includes(x)); S.f.matchesTaken = true; S.inv.b.push('matches'); S.f.lantern = true; S.f.candle = true; S.f.candleEver = true; }
    if (set('phone')) { S.inv.b = S.inv.b.filter((x) => x !== 'tincans'); S.inv.a = S.inv.a.filter((x) => x !== 'reel'); S.f.canATied = 'a'; S.f.canBTied = 'b'; S.f.phone = true; S.talks.t1 = true; }
    if (set('cat')) { S.f.mirrorTaken = true; S.f.mirror = true; S.f.bridge = true; S.f.bait = true; S.f.flat_boo = true; S.inv.b = S.inv.b.filter((x) => x !== 'niboshi'); S.cat = 'b'; S.f.catSaved = true; S.talks.t2 = true; S.aim = 'boxes'; }
    if (set('film')) { S.inv.b = S.inv.b.filter((x) => !['filmcan', 'tape'].includes(x)); S.f.filmOn = true; S.f.sheetTaken = true; S.f.screen = true; S.film = { v: true, h: true }; for (let i = 0; i < 6; i++) S.frames[i] = true; S.f.filmDone = 1; S.f.eye = true; S.f.eyeAt = 1; }
    if (set('eye')) { S.talks.t3 = true; S.f.canSleep = true; }
    if (set('sleep')) G.sleep(S);
    const TK = { dark: 'torch', beam: 'torch', camera: 'contact', line: 'line', basket: 'basket', candle: 'candle', phone: 'phone', cat: 'cat', film: 'film', eye: 'eye', sleep: 'eye' };
    for (const k of Object.keys(TK)) if (set(k)) at(S, TK[k]);
  };

  MD.fmtTime = (m) => { const t = (22 * 60 + m) % 1440; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  MD.fmtClock = (m) => { const h = Math.floor(m / 60) % 12 || 12; return `${h}時${String(m % 60).padStart(2, '0')}分`; };
  MD.G = G;
})();
