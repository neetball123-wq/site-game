/* =========================================================
   つづきから — 島の物語（人・しらべもの・ひみつ・8月32日）
   ========================================================= */
window.TST = (() => {
  const T = 16;
  const n7 = (s) => s.secrets.slice(0, 7).every(Boolean);
  const nFound = (s) => s.secrets.filter(Boolean).length;
  const rot = (s, key, arr) => { s.c = s.c || {}; const i = (s.c[key] = (s.c[key] || 0) + 1); return arr[(i - 1) % arr.length]; };
  const flag = (s, k) => { s.f = s.f || {}; if (s.f[k]) return true; s.f[k] = 1; return false; };
  const onHill = (P) => P.x >= 21 && P.x <= 26 && P.y >= 8 && P.y <= 17;

  /* =========================================================
     人（場所と時間で、いる人が変わる）
     ========================================================= */
  const npc = (id, spr, x, y, talk, o) => Object.assign({ id, spr, x, y, dir: 'd', talk }, o || {});
  function npcs(map, I, s) {
    const L = [];
    const summer = I.season === 'summer', after = I.season === 'after', d32 = I.season === 'd32';
    const late = I.h >= 0 && I.h < 5;
    if (map === 'world') {
      if (d32) {
        L.push(npc('natsu', 'natsu', 15, 23, natsu), npc('grandpa', 'grandpa', 13, 21, grandpa), npc('tome', 'tome', 18, 21, tome),
          npc('teacher', 'teacher', 12, 20, teacher), npc('shop', 'shop', 19, 20, shopTalk), npc('fisher', 'fisher', 16, 21, fisher),
          npc('kida', 'kida', 11, 21, kidA), npc('kidb', 'kidb', 20, 21, kidB), npc('cat', 'cat', 14, 22, cat, { pid: 12, turn: false }));
        return L;
      }
      L.push(npc('cat', 'cat', 11, 5, cat, { pid: 12, turn: false }));
      if (after) {
        L.push(npc('natsu', 'natsu', 16, 24, natsu, { pid: 10 }), npc('tome', 'tome', 24, 6, tome), npc('fisher', 'fisher', 16, 21, fisher));
        return L;
      }
      if (I.ev.tanabata) L.push(npc('bamboo', 'bamboo', 6, 5, bamboo, { img: TPX.DECO.bamboo, turn: false, pid: 13 }));
      if (I.ev.festival) {
        L.push(npc('natsu', 'yukata', 13, 19, natsu, { pid: 10, turn: false }));
        [10, 12, 18, 20].forEach((x, i) => L.push(npc('stall' + i, 'stall', x, 18, stall, { img: TPX.DECO.stall, turn: false, pid: 16 })));
        L.push(npc('kida', 'kida', 11, 20, kidA), npc('kidb', 'kidb', 19, 20, kidB), npc('grandpa', 'grandpa', 17, 21, grandpa),
          npc('shop', 'shop', 18, 19, shopTalk), npc('teacher', 'teacher', 21, 19, teacher), npc('fisher', 'fisher', 16, 22, fisher));
        return L;
      }
      if (I.ev.lastnight) { L.push(npc('natsu', 'natsu', 11, 15, natsu, { pid: 10 })); return L; }
      if (late) return L;
      L.push(npc('fisher', 'fisher', 16, 21, fisher));
      if (I.tod === 'night' || I.tod === 'evening') {
        if (I.ev.tanabata) L.push(npc('natsu', 'yukata', 7, 6, natsu, { pid: 10 }));
        else L.push(npc('natsu', 'natsu', 11, 15, natsu, { pid: 10 }));
        return L;
      }
      L.push(npc('natsu', 'natsu', 12, 11, natsu, { pid: 10 }), npc('kida', 'kida', 22, 10, kidA), npc('kidb', 'kidb', 17, 16, kidB));
      return L;
    }
    if (d32) {
      if (map === 'lh2') L.push(npc('tome', 'tome', 7, 5, tome));
      return L;
    }
    if (map === 'house') L.push(npc('grandpa', 'grandpa', 7, 5, grandpa));
    if (map === 'shop') L.push(npc('shop', 'shop', 3, 1, shopTalk));
    if (map === 'school') L.push(npc('teacher', 'teacher', 7, 1, teacher));
    if (map === 'lh1' && summer && !I.ev.lastnight) L.push(npc('tome', 'tome', 4, 3, tome));
    if (map === 'lh2' && ((summer && I.ev.lastnight) || (I.m === 9 && I.d === 1 && I.h === 0))) L.push(npc('tome', 'tome', 7, 5, tome));
    return L;
  }
  function uraNpcs() { return [npc('ghost', 'ghost', 10, 6, ghost, { pid: 19 })]; }

  /* 飾り（灯台・大きな木・船・ちょうちん・灯台の上のランプ） */
  function decor(map, I, s) {
    const D = [];
    if (map === 'world') {
      D.push({ x: 24 * T, y: 3 * T, h: 48, pid: 6, img: (I, lit) => lit ? TPX.DECO.lighthouseLit : TPX.DECO.lighthouse });
      D.push({ x: 4 * T, y: 17 * T - 56, h: 56, pid: 13, img: () => TPX.DECO.bigtree });
      if (I.season !== 'after' && !(I.h >= 0 && I.h < 5 && I.season === 'summer')) D.push({ x: 17 * T, y: 23 * T, h: 16, pid: 8, img: () => TPX.DECO.boat });
      if (I.ev.festival) for (let x = 9; x <= 21; x += 2) if (x !== 15) D.push({ x: x * T + 4, y: 17 * T + 2, h: 26, pid: 16, img: () => TPX.DECO.chochin });
    }
    if (map === 'lh2') {
      for (let k = 0; k < 8; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 4;
        const x = Math.round(80 + Math.cos(a) * 46 - 4), y = Math.round(58 + Math.sin(a) * 34 - 4);
        D.push({ floor: true, x, y, h: 8, pid: 16, img: () => (s.secrets[k] ? TPX.DECO.lampOn : TPX.DECO.lampOff) });
      }
    }
    return D;
  }

  /* =========================================================
     会話
     ========================================================= */
  async function natsu(G, e) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return natsuD32(G, e);
    if (I.season === 'after') {
      if (!flag(s, 'na1')) {
        G.save();
        await G.say(['……', '……ユウくん？']);
        await G.say(['ナツ：……おまつり、こなかったね。', 'ナツ：わたし、ゆかた きて、ずっと まってたんだよ。', 'ナツ：……ずーっと。']);
        return;
      }
      return G.say(rot(s, 'na', [
        ['ナツ：ことしの なつは、もう こないのかな。'],
        ['ナツ：9がつの うみは、ちょっと つめたいね。'],
        ['ナツ：トメさんが いってたよ。なつを たいせつに した こには……', 'ナツ：……ううん、なんでもない。'],
        ['ナツ：ユウくん、しゅくだい おわった？']
      ]));
    }
    if (I.ev.festival) {
      if (I.ev.fireworks) {
        if (!flag(s, 'fw')) {
          G.save();
          return G.say(['ナツ：……きれい。', 'ナツ：ねえ ユウくん。なつやすみ、おわっちゃうね。', 'ナツ：ことしも らいねんも、ずっと なつだったら いいのにね。',
            'ナツ：トメさんが いってた。なつを たいせつに した こには、8がつ32にちが くるんだって。', 'ナツ：……ほんとう かな。']);
        }
        return G.say(['ナツ：……あ、また あがった！']);
      }
      if (!flag(s, 'fe1')) { G.save(); return G.say(['ナツ：ユウくん！ ……きてくれたんだ。', 'ナツ：ゆかた、へんじゃない？', 'ナツ：20じに はなびが あがるよ。いっしょに みよう。']); }
      return G.say(rot(s, 'nf', [['ナツ：わたあめ、はんぶん こ しよう。'], ['ナツ：はなびは 20じ から だよ。はまの ほうで みよう。'], ['ナツ：……ずっと、きょうが いいな。']]));
    }
    if (I.ev.lastnight) return G.say(['ナツ：とうだい、いくの？', 'ナツ：……わたしも いきたかったな。おかあさんに おこられるから。', 'ナツ：0じに なったら、どうなるのかな。']);
    if (I.ev.tanabata && (I.tod === 'night' || I.tod === 'evening')) return G.say(['ナツ：ささ、みた？ たんざく、ユウくんの ぶんも あるよ。']);
    if (I.tod === 'night' || I.tod === 'evening') {
      return G.say(rot(s, 'nn', [
        ['ナツ：よるの うみ、こわいけど きれい。'],
        ['ナツ：ながれぼし、みた こと ある？ 13にちごろが いいんだって。せんせいが いってた。'],
        ['ナツ：とうだいの ひかり、ずっと みてると、うたってる みたい。']
      ]));
    }
    if (!flag(s, 'ns1')) { G.save(); return G.say(['ナツ：ユウくん！ きょうは なにする？', 'ナツ：あ、そうだ。しってる？', 'ナツ：この島の たなばたは、ひとつき おくれ なんだよ。', 'ナツ：ほんどより、ずっと ほしが よく みえるから。']); }
    if (s.name !== 'ユウ' && s.name && !flag(s, 'nsname')) { G.save(); return G.say(['ナツ：……' + s.name + '？ なまえ かえたの？', 'ナツ：へんなの。わたしは ユウくんって よぶからね。']); }
    if (I.d === 30) return G.say(['ナツ：あしたは まつりだね。', 'ナツ：ぜったい きてね。やくそく！']);
    if (I.d === 31) return G.say(['ナツ：きょうは まつり！ 18じに はまに きてね。']);
    return G.say(rot(s, 'nd', [
      ['ナツ：トメさんの とうだい、よるに なると ひかりかたに リズムが あるの。', 'ナツ：かぞえた こと ある？'],
      ['ナツ：この島の たなばたは、ひとつき おくれ。……わすれないでね。'],
      ['ナツ：ユウくんと いると、なつやすみが みじかく かんじる。'],
      ['ナツ：もりの いど、よるに のぞくと なにか みえるって。……こわくない？']
    ]));
  }

  async function natsuD32(G, e) {
    const s = G.s, st = G.st;
    if (st.ending) {
      await G.say(['ナツ：またね、' + (st.finder || 'きみ') + '。']);
      const i = await G.ask('ふねに のる？', ['のる', 'まだ いる']);
      if (i === 0) await leave(G, true);
      return;
    }
    await G.say(['ナツ：ユウくん。……ううん。', 'ナツ：きみ、ユウくんじゃ ないよね。', 'ナツ：わかるよ。あるきかたが ちがうもん。',
      'ナツ：ユウくんは あの なつ、31にちに こられなかった。', 'ナツ：でも、きみが かわりに きてくれた。', 'ナツ：ユウくんの なつやすみの、つづきから。']);
    if (st.fair) await G.say(['ナツ：……しかも、とけいを いじらないで きたんだね。', 'ナツ：それ、ユウくんが いちばん したかった やりかた だよ。']);
    await G.say(['ナツ：ありがとう。', 'ナツ：……ねえ。きみの ほんとうの なまえ、おしえて？']);
    let nm = await G.name('きみの なまえ', 5, '');
    if (!nm) nm = 'きみ';
    st.finder = nm; G.save();
    const lines = ['ナツ：' + nm + '。……うん、おぼえた。', 'ナツ：この島の なつは、きょうで おしまい。', 'ナツ：なつやすみは、おわるから たのしいんだって。トメさんが いってた。'];
    if (s.wish) lines.push('ナツ：たなばたの たんざく、よんだよ。『' + s.wish + '』', 'ナツ：……かなうと いいね。');
    lines.push('ナツ：ユウくんに あったら、つたえてね。', 'ナツ：うわさは、ほんとうだったよ って。', 'ナツ：……またね、' + nm + '。');
    await G.say(lines);
    await leave(G, false);
  }
  async function leave(G, again) {
    const st = G.st, s = G.s;
    if (!again) { st.ending = st.fair ? 'fair' : 'd32'; G.save(); G.emit('progress'); G.emit('ending'); }
    G.sfx('ok');
    await G.fade('out', 700);
    G.music(14);
    await G.credits(TK.CREDITS({ name: st.finder || 'きみ', fair: !!st.fair, wish: s.wish || '' }));
    G.toTitle();
  }

  async function grandpa(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['おじいちゃん：なつやすみ、たのしかったかい。', 'おじいちゃん：いつでも かえって おいで。']);
    if (s.name && s.name !== 'ユウ' && !flag(s, 'gpname')) { G.save(); return G.say(['おじいちゃん：……ユウ？ いや、' + s.name + ' だったかな。', 'おじいちゃん：としを とると いけないねえ。']); }
    if (I.ev.festival) return G.say(['おじいちゃん：まつりは いいねえ。わしも わかい ころは……', 'おじいちゃん：……いや、なんでもない。はなびを みておいで。']);
    if (I.season === 'after') return G.say(rot(s, 'gp', [['おじいちゃん：なつやすみは おわったよ。', 'おじいちゃん：……でも、ここに いて いいんだ。'], ['おじいちゃん：あきの うみも、わるくないさ。'], ['おじいちゃん：ユウ。むりに おとなに ならなくても いいんだよ。']]));
    if (nFound(s) >= 7) return G.say(['おじいちゃん：なんだか 島じゅうが、そわそわ しているねえ。']);
    const left = 31 - I.d;
    if (I.tod === 'night') return G.say(['おじいちゃん：よふかしも、なつやすみの うちさ。']);
    return G.say(rot(s, 'gs', [['おじいちゃん：きょうは 8がつ' + I.d + 'にち。', 'おじいちゃん：なつやすみは、あと ' + left + 'にちだ。'], ['おじいちゃん：ナツちゃんが さがしてたよ。'], ['おじいちゃん：まつりの ひは、げたを はいて いきなさい。']]));
  }

  async function tome(G) {
    const s = G.s, I = G.isle(), st = G.st;
    if (I.season === 'd32') return G.say(G.map === 'lh2' ? ['トメ：さあ、した へ おりて ごらん。みんな、まってるよ。'] : ['トメ：とうだいは ずっと ひかってるよ。', 'トメ：……みえなくても ね。']);
    if (st.heard16 && !s.secrets[2]) {
      await G.say(['（' + (s.name || 'ユウ') + 'は、さっき きいた うたを はなうたで うたった）', 'トメ：……その うた。どこで きいたんだい。', 'トメ：それは この とうだいの うただよ。わたしの ばあさまが、よく うたって いた。', 'トメ：ひかりの かずは、うたの はじまりの かず。……よく みつけたね。']);
      await G.found(2);
      return;
    }
    if (I.season === 'after') {
      return G.say(rot(s, 'ta', [['トメ：なつが おわったからね。とうだいの うえは しめたよ。', 'トメ：……ひかりは、まいばん つけてるけどね。'], ['トメ：ひかりの かずを かぞえて ごらん。とうだいは、うたって いるんだよ。']]));
    }
    if (G.map === 'lh2') {
      if (n7(s)) return G.say(['トメ：きたね。……0じまで、いっしょに まとうか。', 'トメ：ななつの ひかりが、ちゃんと ともってる。']);
      return G.say(['トメ：まだ ひかりが たりない みたいだね。', 'トメ：……それでも、まつかい？']);
    }
    if (!flag(s, 'tm1')) {
      G.save();
      return G.say(['トメ：おや ユウ。うえに のぼるかい？', 'トメ：この島には、むかしから いいつたえが あってね。',
        'トメ：なつを いっしょうけんめい すごした こどもの ところには、8がつに 32にちめが くるんだって。',
        'トメ：ななつの ひかりが そろった よる、とうだいの いちばん うえで 0じを まつと……ね。']);
    }
    if (n7(s)) return G.say(['トメ：ななつ そろったね。……31にちの よるを おまち。']);
    return G.say(rot(s, 'tm', [['トメ：ひかりの かずを かぞえて ごらん。とうだいは、うたって いるんだよ。'], ['トメ：うえの ランプは、島の ひみつの かずだけ ともる って いうよ。'], ['トメ：わたしの ばあさまも、この とうだいで うたを うたってた。']]));
  }

  async function teacher(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['せんせい：しゅくだいは……まあ、いいか。', 'せんせい：きょうは とくべつだ。']);
    await G.say(['せんせい：しゅくだいは おわったかい？']);
    if (I.season === 'after') return G.say(['せんせい：2がっきが はじまったのに、ユウくんの しゅくだいが まだ でてないんだ。']);
    if (s.secrets[4]) return G.say(['せんせい：ながれぼしに ねがいごと、できたかい？']);
    return G.say(['せんせい：こくばんを みてごらん。8がつの よぞらの ことを かいておいたよ。']);
  }
  async function shopTalk(G) {
    const s = G.s, I = G.isle(), it = s.items;
    if (I.season === 'd32') {
      if (!flag(s, 'ramuneGift')) { it.ramune = (it.ramune || 0) + 1; G.save(); return G.say(['おばちゃん：ラムネ、おまけ しとくよ！', 'ラムネを もらった。']); }
      return G.say(['おばちゃん：また おいでね！']);
    }
    if (G.map !== 'shop') return G.say(['おばちゃん：まつりの ときは、やたいも だしてるのよ。']);
    const after = I.season === 'after';
    await G.say([after ? 'おばちゃん：なつものは もう しまっちゃったよ。でんちなら あるけどね。' : 'おばちゃん：いらっしゃい！ なにに する？']);
    const goods = after ? [['でんち', 100, 'batt']] : [['でんち', 100, 'batt'], ['ラムネ', 80, 'ramune'], ['せんこうはなび', 150, 'hanabi']];
    for (; ;) {
      const i = await G.menu(goods.map(g => g[0] + '　' + g[1] + 'えん').concat(['やめる']), { title: 'なつや　' + s.money + 'えん' });
      if (i < 0 || i === goods.length) return G.say(['おばちゃん：まいど！']);
      const [nm, pr, k] = goods[i];
      if (k === 'batt' && it.batt) { await G.say(['おばちゃん：でんちは もう はいってるよ。だいじに つかいな。']); continue; }
      if (s.money < pr) { await G.say(['おばちゃん：あら、おかねが たりないみたい。']); continue; }
      s.money -= pr; G.sfx('coin');
      if (k === 'batt') { it.batt = true; G.save(); await G.say([nm + 'を かった！', 'かいちゅうでんとうに でんちを いれた。あかるく ついた！']); }
      else { it[k] = (it[k] || 0) + 1; G.save(); await G.say([nm + 'を かった！']); }
    }
  }
  async function fisher(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['つりの おじさん：ふねは でるぞー。のりおくれるなよ。']);
    if (I.season === 'after') return G.say(['つりの おじさん：ふねは もう でねえよ。8がつに また おいで。']);
    if (I.ev.festival) return G.say(['つりの おじさん：まつりの ひだけは、さかなも やすみさ。']);
    if (I.tod === 'night' || I.tod === 'evening') return G.say(['つりの おじさん：よづりさ。……とうだいの ひかり、きれいだろ。']);
    return G.say(rot(s, 'fi', [
      ['つりの おじさん：しおみひょうを みたかい。しおが ひくと、にしの いわばが よく みえる。', 'つりの おじさん：いちばん しおが ひいた ひにゃ、いわばに あなが ひらくって はなしだ。', 'つりの おじさん：わしは みた ことが ねえがな。'],
      ['つりの おじさん：きょうも ボウズだ。……つれない ひも、なつやすみさ。']
    ]));
  }
  async function kidA(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['こども：8がつ32にち、ほんとに あった！', 'こども：……だれにも いうなよ。']);
    if (I.ev.festival) return G.say(['こども：きんぎょすくい、ぜんぶ やぶれた！']);
    return G.say(rot(s, 'ka', [['こども：8がつ32にちって しってる？', 'こども：そんな ひ、あるわけ ないよな！'], ['こども：もりの おおきな き、うしろが あやしいんだよな。'], ['こども：むしとり しようぜ！ ……ユウ、きいてる？']]));
  }
  async function kidB(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['こども：また らいねんも きてね。']);
    if (I.ev.festival) return G.say(['こども：ゆかた、にあう？']);
    return G.say(rot(s, 'kb', [['こども：いどの そこに、よるに なると ほしが みえるんだって。', 'こども：こわーい。'], ['こども：ミケって、ときどき ひとの ことば しゃべりそうな かお するよね。']]));
  }
  async function cat(G) {
    const s = G.s, I = G.isle();
    if (I.season === 'd32') return G.say(['ミケ：……まことに、よろしくね。']);
    if (s.name === 'まこと' && !s.secrets[1]) {
      await G.say(['ミケ：……まこと？', 'ミケ：……ずいぶん、ちいさく なったね。', 'ミケ：……ううん、ちがう。きみは まことじゃ ない。',
        'ミケ：でも、その なまえを しってるって ことは、まことの いたずらを さがしに きたんだね。', 'ミケ：まことは この島を つくった ひと。わたしの かいぬし。',
        'ミケ：この島の ひみつは、ぜんぶで やっつ。さいごの ひとつは、とうだいの いちばん うえ。', 'ミケ：……まことに あったら いっといて。ミケは まだ ここに いるよ って。']);
      await G.found(1);
      return;
    }
    if (s.name === 'まこと') return G.say(['ミケ：……また きたの。まことに にてない こ。']);
    if (s.name === 'ひばり') return G.say(['ミケ：……にゃ？', '（ミケは なにか いいたそうに、こちらを みている）']);
    if (s.name === 'ナツ') return G.say(['ミケ：にゃあ。', '（ナツは ふたりも いらない、と いいたげだ）']);
    return G.say(rot(s, 'ct', [['ミケ：にゃあ。'], ['ミケは おおきな あくびを した。'], ['ミケ：……にゃ。', '（だれかを まっている みたいだ）']]));
  }
  async function stall(G) { return G.say(['やたいだ。', rot(G.s, 'st', ['わたあめの あまい においが する。', 'きんぎょが ゆらゆら およいでいる。', 'やきそばの ソースが こげる におい。', 'かたぬき 1かい 50えん。'])]); }
  async function bamboo(G) {
    const s = G.s;
    await G.say(['ささに たんざくが たくさん さがっている。', '『およげるように なりますように　タケシ』', '『ミケが ずっと げんきで いますように　まこと』', '『8がつ32にちに いけますように　ユウ』']);
    if (s.secrets[5]) return G.say(['『' + (s.wish || '……') + '』', '……じぶんの たんざくも、ちゃんと ゆれている。']);
    const i = await G.ask('まっしろな たんざくが 1まい のこっている。ねがいごとを かく？', ['かく', 'やめる']);
    if (i !== 0) return;
    const w = await G.name('ねがいごと', 8, '');
    if (!w) return G.say(['……なにも かかなかった。']);
    s.wish = w; G.save();
    G.sfx('sparkle');
    await G.say(['たんざくを ささに むすんだ。', '『' + w + '』']);
    await G.found(5);
  }
  async function ghost(G) {
    const st = G.st;
    await G.say(['？？？：……ここは ウラガワ。', '？？？：カセットの、うらがわ。ぜんぶの ばしょの、うらがわ。', '？？？：きみ、ほんとうに うらわざが すきなんだね。',
      '？？？：ひとつ おしえて あげる。', '？？？：いちばん かくれた うらわざは、ほんとうの 8がつ31にちの よるに ある。', '？？？：……カセットは、ちゃんと さしてね。']);
    st.uraTalk = true; G.save();
  }

  /* =========================================================
     しらべる（Aボタン）
     ========================================================= */
  const SIGNS = {
    'world:16,11': ['とこなつ島へ ようこそ！', '← じんじゃ・もり　↑ とうだい\n→ ひがしの おか　↓ さんばし'],
    'world:20,11': ['だがしや なつや', '「でんち あります」'],
    'world:22,13': ['ひがしの おか', 'よぞらが いちばん よく みえる ばしょ。'],
    'world:7,16': ['もりの おくは ふかいよ。', 'おおきな きの うしろに、まわりこんでは いけません。\n（しまの こども かい）'],
    'world:23,6': ['とこなつ島 とうだい', 'ひかりかた：むれせんこう\n（いくつかの ひかりが ひとかたまりに なって ひかります）']
  };
  async function check(G, map, x, y, ch) {
    const s = G.s, I = G.isle(), st = G.st;
    const key = map + ':' + x + ',' + y;
    if (G.ura) {
      const t = TK.URA_SIGNS[x + ',' + y];
      if (t) return G.say([t]);
      return;
    }
    if (SIGNS[key]) return G.say(SIGNS[key]);
    if (key === 'world:14,19') {
      return G.say(['しおみひょう（8がつ）', 'ひ　　かんちょう　しおの たかさ', ...chunk(TK.TIDE.map(r => r[0].padEnd(4, '　') + ' ' + r[1] + '　' + r[2]), 2).map(a => a.join('\n'))]);
    }
    if (map === 'world') {
      if (ch === 'W') {
        if (I.tod === 'night' || I.season === 'd32') {
          if (s.secrets[0]) return G.say(['いどの そこで、ほしが ひとつ ひかっている。']);
          await G.say(['いどを のぞきこんだ。', '……そこに、ほしが ひとつ うつっている。', 'そらを みあげた。', '……おなじ ほしは、どこにも ない。']);
          return G.found(0);
        }
        return G.say(['ふかい いどだ。', 'そこは まっくらで、なにも みえない。']);
      }
      if (ch === 'M') return G.say(['ポストだ。', '……からっぽ。']);
      if (ch === 'e') return G.say(['えまが たくさん かかっている。', '『ミケが ずっと げんきで いますように　まこと』', '『およげるように なりたい　タケシ』', '『しゅくだいが おわりますように　ユウ』']);
      if (ch === 'o') {
        const i = await G.ask('おさいせんばこだ。5えん いれる？', ['いれる', 'やめる']);
        if (i === 0) { if (s.money >= 5) { s.money -= 5; G.save(); G.sfx('coin'); return G.say(['チャリン。', '……なにか いいことが ありそうだ。']); } return G.say(['おかねが たりない。']); }
        return;
      }
      if (ch === 'q') return G.say(['いしどうろうだ。']);
      if (ch === 'x') return G.say([I.season === 'after' ? 'スイカばたけ。……スイカは もう ぜんぶ たべられた。' : 'スイカばたけだ。まるまると ふとっている。']);
      if (ch === 'b') {
        if (onHill(G.P) && I.ev.perseid) return G.say(['ベンチに すわった。', 'ながれぼしが ながれている！', '……きえるまでに、ねがいごとを。']);
        return G.say(['ベンチに すわって、そらを みあげた。', I.tod === 'night' ? 'ほしが こぼれそうだ。' : 'くもが ゆっくり ながれていく。']);
      }
      if (ch === 'B') return G.say(['おおきな きだ。', '……みきの うしろがわに、なにか ありそうな きが する。']);
      if (ch === 'T' || ch === 'Y') return G.say([rot(s, 'tr', ['きだ。', 'セミが ないている。', 'きの みきに、カブトムシの あと。'])]);
      if (ch === 'c' || ch === 'C') return G.say(['いわに なみが うちよせている。']);
      if (ch === '~') return G.say(['うみだ。', I.season === 'after' ? '……なつの いろが ぬけた うみ。' : 'きらきら ひかっている。']);
      if (ch === 'n') return G.say(['まどだ。']);
      if (ch === 'F') return G.say(['さくだ。']);
      if (ch === 'g') return G.say(['とりいだ。']);
      return;
    }
    if (map === 'house') {
      if (ch === 'n') {
        const i = await G.ask('ノートに「' + s.name + '」と かいてある。なまえを かきなおす？', ['かきなおす', 'やめる']);
        if (i !== 0) return;
        const nm = await G.name('あたらしい なまえ（4もじまで）', 4, '');
        if (!nm) return G.say(['……やっぱり やめた。']);
        s.name = nm; G.save();
        await G.say(['なまえを『' + nm + '』に かきなおした。']);
        if (nm === 'ひばり') return G.say(['……なんだか、どこかで きいた なまえだ。']);
        return;
      }
      if (ch === 'C') {
        if (I.season === 'after') return G.say(['9がつの カレンダーだ。', '……8がつの ページは、やぶって とってある。']);
        return G.say(['8がつの カレンダーだ。', '7にち・13にち・27にちに ☆が かいてある。', '31にちには おおきな まる。……「0じ」と かいてある。']);
      }
      if (ch === 'p') return G.say(['しゃしんだ。ユウと ナツが うつっている。', 'うらに「1999.8.1」。']);
      if (ch === 'v') {
        if (I.season === 'after') return G.say(['テレビ：「……2がっきが はじまりました。こどもたちが げんきに……」']);
        if (I.tod === 'night') return G.say(['テレビ：「よるの ニュースです。ペルセウスざ りゅうせいぐんが、13にちの よあけまえに ピークを……」']);
        return G.say(['テレビ：「なつやすみ こども アニメまつり！」', '……みている ばあいじゃない。']);
      }
      if (ch === 'w') return G.say([I.season === 'after' ? 'まどの そとは、すっかり あきの そらだ。' : 'まどの そとで、セミが ないている。']);
      if (ch === 'f' || ch === ':') {
        const i = await G.ask('ユウの ふとんだ。ねる？', ['ねる', 'やめる']);
        if (i !== 0) return;
        await G.fade('out', 500); G.sfx('save'); await G.wait(700); await G.fade('in', 500);
        return G.say(['ぐっすり ねむった……', '……とけいは、すすまなかった。', 'この島の じかんは、ゲーム機の とけいが きめている。']);
      }
      return;
    }
    if (map === 'shop') { if (ch === 's') return G.say([rot(s, 'sh', ['だがしが ならんでいる。', 'ビーだまが ひとつ 10えん。', 'でんちの はこが つんである。'])]); return; }
    if (map === 'school') {
      if (ch === 'k') return G.say(['こくばんに かいてある。', '8がつの よぞら\nペルセウスざ りゅうせいぐん', 'いちばん おおく ながれるのは\n13にちの よあけまえ（3じごろ）', 'ひがしの おかが よく みえるよ。\nながれぼしが きえるまでに ねがいごとを 3かい！',
        'しゅくだい：えにっき・ドリル・じゆうけんきゅう', '7がつ7にち　たなばた（ほんど）']);
      if (ch === 'D') return G.say([rot(s, 'dk', ['だれかの つくえ。らくがきが ある。', 'つくえの なかに、ドリルが はいったまま だ。'])]);
      if (ch === 'w') return G.say(['まどの そとに、うみが みえる。']);
      return;
    }
    if (map === 'lh1') {
      if (ch === 's') return G.say(['とうだいの にっしだ。', '「1999ねん 8がつ30にち　はれ」', '「ユウが きた。31にちの よるを、たのしみに している」']);
      if (ch === 't') return G.say(['トメさんの ちゃぶだい。おちゃが さめている。']);
      if (ch === 'w') return G.say(['まどの そとで、なみが ひかっている。']);
      return;
    }
    if (map === 'lh2') {
      if (ch === 'O') return G.say(['おおきな レンズだ。', I.tod === 'night' || I.tod === 'evening' ? 'ひかりが、ゆっくり まわっている。' : 'ひるまは、ねむっている みたいだ。']);
      if (ch === 'r') return G.say(['てすりから、島が みわたせる。', I.tod === 'night' ? 'ほしが、てを のばせば とどきそうだ。' : 'はまで だれかが てを ふっている。']);
      return;
    }
    if (map === 'base') {
      if (ch === 'R') return G.say(G.vol() > 0 ? ['ラジオ：ザー……ザザ……', '（おとが おおきくて、よく きこえない）'] : ['ラジオは、なにも いわない。']);
      if (ch === 'x') {
        if (s.d32) {
          if (!flag(s, 'env')) G.save();
          return G.say(['ユウの たからばこ。', '「8がつ32にちに あけること」と かいた ふうとうを あけた。', '「8がつ32にちの ぼくへ。やっぱり ほんとうだったでしょ？　ユウ」']);
        }
        return G.say(['ユウの たからばこ だ。', 'ビーだま、セミの ぬけがら、つりばり、しゃしん（ナツと ミケ）。', '……「8がつ32にちに あけること」と かいた ふうとうが はいっている。', 'まだ あけられない。……32にちって、いつだろう。']);
      }
      if (ch === 'a') return G.say(['ユウの えだ。', rot(s, 'dr', ['ナツと ミケと、とうだい。', 'だいきらいな ドリルに、バツが ついている。'])]);
      if (ch === 'w') return G.say(['きの あなから、もりの ひかりが さしこんでいる。']);
      return;
    }
    if (map === 'cave') {
      if (ch === 'Z') return G.say(['かべに なにか ほってある。', '「ユウ 8/27 ここまで きた！」']);
      if (ch === 'Q') {
        if (s.secrets[3]) return G.say(['しおだまりが、しずかに ひかっている。']);
        await G.say(['しおだまりの そこで、なにかが ひかっている。', '……島の かたちを した、ちいさな いしだ。', 'しまの いしを ひろった！']);
        s.items.stone = true; G.save();
        return G.found(3);
      }
      return;
    }
  }
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

  /* =========================================================
     ぶつかる・入口・歩ける場所
     ========================================================= */
  function walk(map, x, y, ch, I) {
    if (map === 'world' && ch === 'c') return !!(I && I.ev.lowtide);
    return null;
  }
  function bump(G, map, x, y, ch, dir) {
    const I = G.isle(), s = G.s;
    if (G.ura) return false;
    if (map === 'world' && x === 4 && y === 15 && dir === 'd') { G.run(() => G.warp('base', 4, 6, 'u')); return true; }
    if (map === 'world' && ch === 'C') {
      if (!I.ev.lowtide) { G.run(() => G.say(['いわの すきまに、なみが うちよせている。'])); return true; }
      if (!s.items.batt) { G.run(() => G.say(['いわばに、ぽっかり あなが あいている！', '……おくは まっくらだ。あかりが ないと はいれない。', '（かいちゅうでんとうは、でんちが きれている）'])); return true; }
      G.run(() => G.warp('cave', 2, 1, 'r'));
      return true;
    }
    return false;
  }
  async function door(G, d, x, y) {
    const I = G.isle();
    if (d.locked === 'natsu') return G.say([I.tod === 'night' || I.tod === 'evening' ? 'ナツの いえ。まどに あかりが ついている。' : 'ナツの いえだ。……しずかだ。']);
    if (d.gate === 'lighthouse' && I.season === 'after') return G.say(['とうだいの とびらには、かぎが かかっている。']);
    return G.warp(d.to, d.x, d.y, d.dir);
  }

  /* =========================================================
     入ったとき・毎秒
     ========================================================= */
  let baseHint = false, baseBusy = false, lastDay = null, meteorGone = false;
  async function enter(G, map) {
    const s = G.s;
    if (map === 'base') {
      baseHint = false;
      if (!s.secrets[6] && G.vol() === 0) return baseVoice(G);
      if (!s.secrets[6]) {
        await G.wait(1800);
        if (G.map === 'base' && G.vol() > 0 && !baseHint) { baseHint = true; await G.say(['ラジオから ザーッと ノイズが きこえる。', '……その むこうで、だれかが ちいさな こえで なにか いっている きが する。']); }
      }
    }
    if (map === 'cave' && !flag(s, 'cave1')) { G.save(); await G.say(['ひんやりと つめたい どうくつだ。', 'かいちゅうでんとうの ひかりが、かべを なめていく。']); }
    if (map === 'lh2' && G.isle().ev.lastnight) await G.say(['とうだいの いちばん うえ。', 'よるの うみが、どこまでも くろい。']);
  }
  async function baseVoice(G) {
    if (baseBusy) return; baseBusy = true;
    await G.wait(1200);
    if (G.map !== 'base' || G.vol() > 0) { baseBusy = false; return; }
    await G.say(['…………', '……しずかに してくれて、ありがとう。', '……ぼくは、おおきな おとが にがて なんだ。', 'ぼくは この島の なつ。みんなが「とこなつ」って よんでいる もの。',
      'ユウは まいにち きてくれた。でも、8がつ31にちだけ、こなかった。', 'だから この島の なつは、ずっと おわれないで いる。',
      'ななつの ひみつを ぜんぶ みつけて。そしたら 8がつ31にちの よる、とうだいの いちばん うえで まってて。', '0じに なったら、ぼくが さいごの いちにちを あげる。']);
    baseBusy = false;
    await G.found(6);
  }
  function tick(G) {
    if (G.ura) return;
    const s = G.s, I = G.isle();
    if (s.d32) return;
    const d = G.gnow();
    const key = (d.getMonth() + 1) * 100 + d.getDate();
    if (lastDay != null && key !== lastDay) {
      const was = lastDay; lastDay = key;
      if (was === 831 && key === 901) { G.run(() => midnight(G)); return; }
      G.refresh();
    }
    lastDay = key;
    if (G.map === 'lh2' && I.season === 'summer' && I.d === 31 && d.getHours() === 23 && d.getMinutes() >= 57) {
      G.toast('23:' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'));
    }
    if (G.map === 'base' && !s.secrets[6] && G.vol() === 0 && !baseBusy) G.run(() => baseVoice(G));
    if (G.fx.meteor == null && meteorGone === false) meteorGone = true;
  }
  async function midnight(G) {
    const s = G.s, st = G.st;
    if (G.map !== 'lh2') {
      G.refresh();
      return G.say(['……0じ。', '9がつに なった。', 'なつやすみが、おわった。']);
    }
    if (!n7(s)) {
      await G.say(['……0じ。', '……9がつ1にちに なった。']);
      G.refresh();
      return G.say(['トメ：……ひかりが、たりなかったね。', 'トメ：ななつの ひみつを さがして おいで。そしたら また、31にちの よるに。']);
    }
    const fair = Math.abs(st.offset || 0) < 120000;
    st.fair = fair;
    G.music(-1);
    await G.say(['……0じ。']);
    G.sfx('ding');
    await G.fade('out', 600);
    s.secrets[7] = true; s.d32 = true; G.save(); G.emit('progress');
    G.color(true); G.refresh();
    await G.wait(400);
    await G.fade('in', 1200);
    G.music(16);
    G.sparkle(80, 60, 30); G.sfx('sparkle');
    G.toast('8/32　0:00');
    await G.say(['……8がつ、32にち。']);
    await G.say(['トメ：……ほんとうに、きたんだね。', 'トメ：ごらん。島が、あさに なっていく。', 'トメ：した へ おりて ごらん。みんな、まってるよ。']);
  }

  /* 流れ星に願う（Aボタン） */
  function onA(G) {
    const I = G.isle(), P = G.P, fx = G.fx, s = G.s;
    if (G.map !== 'world' || G.ura || !I.ev.perseid || s.secrets[4] || !onHill(P) || !fx.meteor) return false;
    const m = fx.meteor;
    m.hits++;
    G.sfx('sparkle'); G.toast('ねがいごと ' + m.hits + '/3');
    if (m.hits >= 3) {
      m.life = m.t + 6;
      G.run(async () => { await G.say(['ねがいごとを 3かい となえた！', '……ながれぼしが ひとつ、こちらに むかって ひかった きが した。']); await G.found(4); });
    }
    return true;
  }

  /* つづきから（はじめて読みこんだとき） */
  async function load(G) {
    const s = G.s;
    lastDay = null;
    if (s.d32) { await G.say(['……8がつ32にち。', 'この島の なつは、ここで とまっている。']); return; }
    if (!flag(s, 'loaded')) {
      G.save();
      const from = new Date(1999, 7, 30, 21, 47).getTime();
      const days = Math.floor((G.gnow().getTime() - from) / 86400000);
      if (days >= 1) await G.say(['8がつ30にちの つづきから はじめます。', '……さいごに あそんでから、' + days + 'にち たちました。']);
      else if (days < 0) await G.say(['8がつ30にちの つづきから はじめます。', '……とけいが、まきもどっている？']);
      else await G.say(['8がつ30にちの つづきから はじめます。']);
      const I = G.isle();
      await G.say(['おじいちゃん：……おや、ユウ。やっと おきたかい。', 'おじいちゃん：ずいぶん ながい ひるね だったねえ。',
        I.season === 'after' ? 'おじいちゃん：なつやすみは、もう おわっちまったよ。' : 'おじいちゃん：きょうも いい てんきだ。']);
      return;
    }
  }

  /* もちもの */
  async function items(G) {
    const s = G.s, it = s.items;
    const list = [{ k: 'light', t: 'かいちゅうでんとう' + (it.batt ? '' : '（でんちぎれ）') }];
    if (it.ramune) list.push({ k: 'ramune', t: 'ラムネ ×' + it.ramune });
    if (it.hanabi) list.push({ k: 'hanabi', t: 'せんこうはなび ×' + it.hanabi });
    if (it.stone) list.push({ k: 'stone', t: 'しまの いし' });
    list.push({ k: 'money', t: 'おこづかい ' + s.money + 'えん' });
    const i = await G.menu(list.map(x => x.t), { title: 'もちもの' });
    if (i < 0) return;
    const k = list[i].k;
    if (k === 'light') return G.say(it.batt ? ['かいちゅうでんとう。あかるく ひかる。'] : ['かいちゅうでんとう。……でんちが きれている。', '（なつやで でんちを うっていた きが する）']);
    if (k === 'ramune') { it.ramune--; G.save(); return G.say(['ラムネを のんだ。', 'ビーだまが、カランと なった。']); }
    if (k === 'hanabi') {
      const I = G.isle();
      if (G.map !== 'world' || (I.tod !== 'night' && I.tod !== 'evening')) return G.say(['よるに なってから に しよう。']);
      it.hanabi--; G.save();
      G.sparkle(G.P.x * T + 8, G.P.y * T + 6, 26); G.sfx('pop');
      return G.say(['せんこうはなびに ひを つけた。', 'パチパチ……ちいさな ひばなが おちていく。']);
    }
    if (k === 'stone') return G.say(['島の かたちを した、ちいさな いし。', 'ひかりに かざすと、なかで なみが ゆれている。']);
    return G.say(['おこづかいは ' + s.money + 'えん。']);
  }

  /* 場所ごとの曲 */
  function musicFor(G) {
    const I = G.isle(), m = G.map, P = G.P, s = G.s;
    if (s.d32) return 16;
    if (m === 'house') return I.season === 'after' ? 12 : 1;
    if (m === 'shop') return 6;
    if (m === 'school') return 2;
    if (m === 'lh1' || m === 'lh2') return 10;
    if (m === 'base') return 15;
    if (m === 'cave') return 11;
    if (I.season === 'after') return 12;
    if (I.ev.fireworks) return 9;
    if (I.ev.festival) return 8;
    if (I.tod === 'night') return 7;
    if (P.x >= 20 && P.y <= 7) return 10;
    if (I.tod === 'morning') return 1;
    if (P.y <= 7 && P.x <= 15) return 5;
    if (P.x <= 8 && P.y >= 8 && P.y <= 18) return 3;
    if (P.y >= 18) return 4;
    if (onHill(P)) return 1;
    return 2;
  }

  return { npcs, uraNpcs, decor, check, walk, bump, door, enter, tick, onA, load, items, musicFor, midnight };
})();
