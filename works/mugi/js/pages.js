/* むぎのさんぽみち — 各ページ */
(() => {
  const { $, $$, esc, norm, fmt, era, text, routes } = MG;
  const st = () => MG.st();
  const S = MG.spots;
  const COUNT = 5278;

  const entry = (e, opts = {}) => {
    const f = fmt(e.d), cls = `entry rv ${era(f.y)}${e.key ? ' ' + e.key : ''}`;
    const lock = e.lock ? `<a class="entry-lock" href="#/${e.lock}">${st()[e.lock] ? 'ひみつきちへ いく' : 'ひみつきちの とびら'}</a>` : '';
    return `<article class="${cls}">
      <header><time datetime="${e.d}">${opts.year ? f.y + '.' : ''}${f.md}</time>${opts.spot === false ? '' : `<a class="chip" href="#/spot/${e.s}">${S[e.s].name}</a>`}</header>
      ${e.ph ? MG.ph(e.ph, 'むぎの しゃしん', 'polaroid') : ''}
      <p>${text(e.t)}</p>${lock}</article>`;
  };
  const ofYear = y => MG.diary.filter(e => +e.d.slice(0, 4) === y);
  const courseText = y => {
    const c = MG.course(y), names = [...new Set(c.c)].map(id => S[id].name);
    return `${y}年の いつもの コース：${names.join(' → ')}${c.b ? '（たんじょうびは 浜まで）' : ''}`;
  };

  /* ---------- さんぽみち（トップ） ---------- */
  routes[''] = () => {
    const s = st(), y = s.year;
    return `
    <section class="hero">
      ${MG.ph('hero', '門の前で、こちらを見上げる こむぎ色の いぬ', 'hero-ph')}
      <div class="hero-txt">
        <p class="since">since 2011.5.3</p>
        <h1 class="title"><span>むぎの</span><span>さんぽみち</span></h1>
        <p class="count">おさんぽ <b id="count">${(COUNT + (s.ended ? 1 : 0)).toLocaleString()}</b> かいめ</p>
      </div>
    </section>
    ${s.ended ? `<section class="notice last rv"><span class="tape" aria-hidden="true"></span><p class="n-date">2025.12.31</p>
      <p>12月31日。16時12分。川原口の バス停の 前に 立ちました。あのバスは もう 走っていないけれど、東京から 持ってきた かばんを さげて、言いました。<br>「ただいま」<br>むぎ、14年間 ずっと 待っててくれて、ありがとう。このサイトは 今日で おしまいです。<br>またあしたね。　ハル</p></section>` : ''}
    <section class="notice rv"><span class="tape" aria-hidden="true"></span>
      <p class="n-date">2025.11.20　おしらせ</p>
      <p>このサイトは、2025年12月31日で おしまいに します。14年間、むぎと わたしの さんぽを 見に来てくれて、ありがとうございました。</p>
      <p>さいごに、ひとつだけ。<a href="#/diary" data-year="2025">10月11日の にっき</a>の つづきを 歩ける ページを つくりました。むぎが どこに 行きたかったのか、わかった人は、むぎを 連れていってあげてください。わたしには、まだ わからないから。</p>
      <p class="n-link"><a class="btn" href="#/tsuzuki">つづきの さんぽ</a></p>
    </section>
    <section class="mapsec rv">
      <h2><span>さんぽみち</span><small id="map-year">${y}</small></h2>
      <p class="lead">下の 年を めくると、その年の さんぽみちに なります。場所を おすと、そこで 書いた にっきが 読めます。</p>
      <div class="map-wrap" id="map"></div>
      <p class="map-cap" id="map-cap">${courseText(y)}</p>
      <ul class="legend"><li><i class="lg main"></i>いつもの コース</li><li><i class="lg bday"></i>たんじょうびの 道</li>${s.rusuban ? '<li><i class="lg eve"></i>ゆうがたの 道</li>' : ''}</ul>
    </section>
    <section class="recent rv">
      <h2>${y}年の にっき</h2>
      <div class="entries" id="recent">${ofYear(y).slice(-3).reverse().map(e => entry(e)).join('')}</div>
      <p><a class="btn ghost" href="#/diary">さんぽ帳を ひらく</a></p>
    </section>
    ${foot()}`;
  };
  const foot = () => `<footer class="foot"><p>むぎのさんぽみち　2011–2025　管理人：ハル</p><p class="fic">※本作はフィクションです。登場する人物・動物・場所は架空のものです。</p></footer>`;

  /* ---------- さんぽ帳 ---------- */
  routes.diary = () => {
    const y = st().year, a = MG.age(y), list = ofYear(y);
    return `<section class="diary">
      <header class="d-head rv"><p class="d-label">さんぽ帳</p><h1>${y}</h1><p>むぎ ${a.mugi}さい　ハル ${MG.grade(y)}（${a.haru}さい）</p></header>
      <div class="entries trail">${list.length ? list.map(e => entry(e)).join('') : '<p class="none rv">この年の にっきは ありません。</p>'}</div>
      <nav class="d-nav">${y > 2011 ? `<button type="button" class="btn ghost" data-go="${y - 1}">← ${y - 1}</button>` : '<span></span>'}${y < 2025 ? `<button type="button" class="btn ghost" data-go="${y + 1}">${y + 1} →</button>` : ''}</nav>
    </section>${foot()}`;
  };

  /* ---------- 場所 ---------- */
  routes.spot = id => {
    const s = S[id];
    if (!s) return routes['']();
    const list = MG.diary.filter(e => e.s === id);
    const board = id === 'bus' ? `<div class="board rv"><p class="b-head">川原口　のりば２　<small>市内・学校前 方面（2021年4月 改正）</small></p>
      <table><tr><th>15</th><td>20　50</td></tr><tr><th>16</th><td>05　38</td></tr><tr><th>17</th><td>10　45</td></tr><tr><th>18</th><td>20</td></tr></table>
      <p class="b-note">※ 学校前 → 川原口 の 便は、反対がわの のりばに とまります。</p></div>` : '';
    return `<section class="spot">
      ${MG.ph(s.img, s.name, 'spot-ph')}
      <header class="spot-head rv"><p class="dir">${s.dir}</p><h1>${s.name}</h1><p>${esc(s.desc)}</p></header>
      ${board}
      <div class="entries trail">${list.map(e => entry(e, { year: true, spot: false })).join('')}</div>
      <p><a class="btn ghost" href="#/">さんぽみちに もどる</a></p>
    </section>${foot()}`;
  };

  /* ---------- むぎのこと ---------- */
  const W = { 2011: 3.2, 2012: 8.6, 2013: 9.8, 2014: 10.1, 2015: 10.4, 2016: 10.3, 2017: 10.2, 2018: 9.9, 2019: 10.0, 2020: 9.8, 2021: 9.5, 2022: 9.0, 2023: 8.4, 2024: 7.6, 2025: 6.9 };
  routes.mugi = () => `<section class="profile">
    <div class="pf-top rv">${MG.ph('mugi-adult', '河原を走る むぎ', 'polaroid tilt')}
      <div><p class="d-label">むぎの こと</p><h1>むぎ</h1>
      <dl class="pf">
        <dt>ひろった日</dt><dd>2011年4月29日（この日を たんじょうびに した）</dd>
        <dt>しゅるい</dt><dd>しばいぬっぽい ミックス</dd>
        <dt>いろ</dt><dd>こむぎいろ（なまえの ゆらい）</dd>
        <dt>すき</dt><dd>パンのみみ、ボール、さくらの 三本目の 木の下、バスの 音</dd>
        <dt>にがて</dt><dd>かみなり、花火、そうじき、「いってきます」</dd>
      </dl></div></div>
    <section class="rv"><h2>たいじゅう</h2><div class="chart">${Object.entries(W).map(([y, w]) => `<div style="--h:${w / 10.4}"><i></i><b>${w}</b><span>${String(y).slice(2)}</span></div>`).join('')}</div><p class="small">（kg。19は 2019年）</p></section>
    <section class="rv"><h2>むぎ語じてん <small>2011年版</small></h2>
      <p class="small">むぎの きもちを、わたし（ハル・小6）が しらべました。</p>
      <dl class="dict">${MG.dict.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      <p class="small">※ 2012年に「かんぜんばん」を つくったけど、ひみつきちに しまってあります。</p></section>
  </section>${foot()}`;

  /* ---------- こうかんノート ---------- */
  routes.notes = () => {
    const mine = st().notes.map(n => ({ d: n.d, a: n.a, t: n.t, me: true }));
    const all = [...MG.notes, ...mine];
    return `<section class="notebook">
      <header class="nb-head rv"><p class="d-label">こうかんノート</p><h1>おたより</h1><p>むぎに あった人、むぎを 見かけた人、なんでも 書いてください。</p></header>
      <ol class="nb">${all.map(n => `<li class="rv${n.w ? ' ' + n.w : ''}${n.me ? ' me' : ''}"><p class="nb-meta"><b>${esc(n.a)}</b><time>${n.d.replace(/-/g, '.')}</time></p>
        <p>${text(n.t).replace('「るすばん帳」', '「<a href="#/rusuban">るすばん帳</a>」')}</p></li>`).join('')}</ol>
      <form class="nb-form rv" id="nb-form"><label>おなまえ<input name="a" maxlength="20" required autocomplete="off"></label><label>メッセージ<textarea name="t" rows="3" maxlength="200" required></textarea></label><button class="btn" type="submit">ノートに かく</button></form>
    </section>${foot()}`;
  };

  /* ---------- ひみつきち ---------- */
  routes.himitsu = () => st().himitsu ? `<section class="himitsu">
      <p class="marquee"><span>☆ようこそ ハルと むぎの ひみつきちへ☆　あいことばを しってる人だけの ページだよ！　☆</span></p>
      <h1 class="hm-title">ひみつきち</h1>
      <p class="hm-count">あなたは <b>4</b> 人目の おきゃくさん！</p>
      <section class="hm-box rv"><h2>むぎ語じてん かんぜんばん</h2><p class="small">2012.11.3 こうしん</p>
        <dl class="dict full">${MG.dictFull.map(([a, b, n]) => `<div><dt>${a}</dt><dd>${b}${n ? `<small>${n}</small>` : ''}</dd></div>`).join('')}</dl></section>
      <section class="hm-box rv"><h2>むぎとの やくそく</h2><ol class="promise"><li>まいにち さんぽ に いく。</li><li>かえったら『ただいま』って いう。</li><li>ねるまえに『またあした』って いう。</li></ol></section>
      <section class="hm-box letter rv"><h2>10ねんごの わたしへ</h2>
        <p>10ねんごの わたしへ。<br>げんきですか。23さいの わたしは、なにを していますか。<br>むぎは 11さいです。おばあちゃんに なってるかな。<br>わたしは たぶん、とおくに いってると おもう（おかあさんが そう いってた）。<br>でも、ひとつだけ やくそくしてね。<br>かえってきたら、ぜったい むぎに『ただいま』って いうこと。<br>むぎは、わたしが ただいまって いうまで、しっぽを ふらないで、ずっと まってるから。<br>ずっと、まってるから。<br><span class="sign">13さいの ハルより</span></p></section>
    </section>` : `<section class="hm-lock">
      <p class="marquee"><span>☆ひみつきち☆　かんけいしゃ いがい たちいりきんし！　☆</span></p>
      <h1 class="hm-title">ひみつきち</h1>
      <p>あいことばを いれてね。<br><small>ヒント：むぎが うめた たからものの、さいしょの もじ。うめた じゅんばんに ならべてね（2011〜2012ねん）。</small></p>
      <form class="lock-form" id="hm-form"><input id="hm-in" autocomplete="off" aria-label="あいことば" placeholder="ひらがなで"><button class="btn" type="submit">はいる</button></form>
      <p class="lock-msg" id="hm-msg" aria-live="polite"></p>
    </section>`;

  /* ---------- るすばん帳 ---------- */
  routes.rusuban = () => st().rusuban ? `<section class="rusuban">
      <div class="rb-cover open" aria-hidden="true"><b>るすばん帳</b><small>むぎと ハハ</small></div>
      <div class="rb-pages">${MG.rusuban.map(r => `<article class="rb rv"><time>${r.d.replace(/-/g, '.')}</time><p>${text(r.t)}</p></article>`).join('')}
      <p class="rb-end rv"><a class="btn" href="#/tsuzuki">つづきの さんぽへ</a></p></div>
    </section>` : `<section class="rusuban locked">
      <div class="rb-cover"><b>るすばん帳</b><small>むぎと ハハ</small><span class="rb-lock" aria-hidden="true"></span></div>
      <form class="lock-form" id="rb-form"><label for="rb-in">鍵</label><input id="rb-in" autocomplete="off" placeholder="むぎの きもち"><button class="btn" type="submit">あける</button></form>
      <p class="lock-msg" id="rb-msg" aria-live="polite"></p>
    </section>`;

  /* ---------- 描いたあとの処理 ---------- */
  MG.after = view => {
    const s = st();
    if (view === '') MG.map.render($('#map'), s.year, { evening: s.rusuban });
    if (view === 'himitsu' && s.himitsu) sparkle();
  };
  MG.onYear = y => {
    const v = document.body.dataset.page;
    if (v === 'top') {
      MG.map.render($('#map'), y, { evening: st().rusuban });
      $('#map-year').textContent = y; $('#map-cap').textContent = courseText(y);
      $('#recent').innerHTML = ofYear(y).slice(-3).reverse().map(e => entry(e)).join('');
      $('.recent h2').textContent = `${y}年の にっき`;
      MG.reveal($('#recent'));
    } else if (v === 'diary') { $('#page').innerHTML = routes.diary(); MG.reveal($('#page')); }
  };

  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { MG.setYear(+go.dataset.go); scrollTo(0, 0); }
    const yl = e.target.closest('a[data-year]');
    if (yl) MG.setYear(+yl.dataset.year, false);
  });

  document.addEventListener('submit', e => {
    const s = st();
    if (e.target.id === 'hm-form') {
      e.preventDefault();
      const v = norm($('#hm-in').value);
      if (v === 'またあした') { s.himitsu = true; MG.save(); MG.toast('ひみつきちの とびらが ひらいた！'); MG.dispatch(); }
      else $('#hm-msg').textContent = v === 'またあたし' ? 'ちがうよ〜。うめた「日」を、もういちど たしかめてね。' : 'ちがうよ〜（むぎが 首を かしげてる）';
    }
    if (e.target.id === 'rb-form') {
      e.preventDefault();
      const v = norm($('#rb-in').value);
      if (v === 'あいたい' || v === '会いたい') {
        s.rusuban = true; MG.save();
        $('.rb-cover').classList.add('open');
        setTimeout(() => MG.dispatch(), 900);
      } else $('#rb-msg').textContent = v === 'あいない' ? 'ちがうみたい。ボールの ところ、ハルの じてんは 書きなおされて いなかったかな。'
        : v === 'たいあい' || v === 'ないあい' ? 'ちがうみたい。一日の じゅんばんに、ならべてみて。' : 'ちがうみたい。';
    }
    if (e.target.id === 'nb-form') {
      e.preventDefault();
      const f = new FormData(e.target), d = new Date();
      s.notes.push({ d: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, a: String(f.get('a')).slice(0, 20), t: String(f.get('t')).slice(0, 200) });
      MG.save(); MG.dispatch();
    }
  });

  // ひみつきち：マウスのあとに星がちらばる（小学生の手づくりページ）
  function sparkle() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('.himitsu');
    let last = 0;
    box.addEventListener('pointermove', e => {
      if (e.timeStamp - last < 45) return; last = e.timeStamp;
      const s = document.createElement('i');
      s.className = 'star'; s.textContent = ['☆', '★', '✦'][Math.random() * 3 | 0];
      s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.style.color = ['#F6A5C0', '#8FC9E8', '#F7D26A', '#A8D98A'][Math.random() * 4 | 0];
      document.body.append(s); setTimeout(() => s.remove(), 900);
    });
  }
})();
