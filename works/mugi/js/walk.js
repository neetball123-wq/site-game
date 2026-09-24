/* むぎのさんぽみち — つづきのさんぽ と、おわかれ */
(() => {
  const { $, esc, norm, routes } = MG;
  const st = () => MG.st();
  const sleep = ms => new Promise(r => setTimeout(r, MG.fast ? Math.min(ms, 120) : ms));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 描画が止まっている（裏に回った）ときでも進むように、タイマーとも競争させる
  const frame = cb => { let done = false; const f = () => { if (!done) { done = true; cb(performance.now()); } }; requestAnimationFrame(f); setTimeout(f, 50); };

  const WRONG_DEST = {
    gate: 'むぎは、門の 外を 見ている。ここじゃ ないみたい。',
    bakery: 'こむぎ堂の ほうへ リードを ひいても、むぎは 動かない。西の 空を 見ている。',
    park: '公園の ほうへ 歩きだしても、むぎの 耳は 西を むいたまま。',
    shrine: 'むぎは、首を かしげた。（なに？）',
    river: 'むぎは 河川敷の ほうへ 少しだけ 歩いて、とちゅうで 止まった。まだ、その 先じゃ ないみたい。',
    sea: 'むぎは、ふせて しまった。そこは まだ、遠すぎる。……今は、まだ。'
  };

  routes.tsuzuki = () => {
    const s = st(), step = s.ended ? 3 : s.walk.step || 0;
    const labels = ['行き先', '時間', 'ことば'];
    return `<section class="tsuzuki">
      <header class="tz-head rv"><p class="d-label">つづきの さんぽ</p><h1>10月11日　夕方</h1>
        <p class="tz-lead">いえの もんの 前。西の 空が、赤く なりはじめている。<br>むぎは リードの 先で、じっと どこかを 見ている。</p></header>
      <ol class="tz-steps">${labels.map((l, i) => `<li class="${i < step ? 'done' : i === step ? 'now' : ''}">${l}</li>`).join('')}</ol>
      <div class="tz-body" id="tz-body">${body(step)}</div>
      <p class="tz-say" id="tz-say" aria-live="polite"></p>
    </section>`;
  };

  function body(step) {
    if (step === 0) return `<p class="tz-q">むぎと、どこへ 行く？ <small>地図の 場所を おしてね</small></p><div class="map-wrap" id="tz-map"></div>`;
    if (step === 1) return `<p class="tz-q">川原口の バス停へ。むぎが、ゆっくり 歩きだした。<br>何時の バスを 待つ？</p>
      <div class="clock" aria-hidden="true"><svg viewBox="-50 -50 100 100"><circle r="46" fill="#FBF6EC" stroke="var(--ink)" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 -40v6" stroke="var(--ink)" stroke-width="2" transform="rotate(${i * 30})"/>`).join('')}<path id="hh" d="M0 0v-22" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><path id="mm" d="M0 0v-34" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"/><circle r="3" fill="var(--ink)"/></svg></div>
      <form class="lock-form" id="tz-time"><label for="tz-t">じこく</label><input id="tz-t" inputmode="numeric" autocomplete="off" placeholder="16:00"><button class="btn" type="submit">待つ</button></form>`;
    if (step === 2) return `<div class="busstop" aria-hidden="true">
        <svg viewBox="0 0 600 260"><rect width="600" height="260" fill="url(#mg-dusk)"/><defs><linearGradient id="mg-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9A27E"/><stop offset="1" stop-color="#F6DDBF"/></linearGradient></defs>
        <rect y="210" width="600" height="50" fill="#D9C7A8"/><rect x="120" y="80" width="7" height="132" fill="#4B3A2C"/><rect x="92" y="66" width="62" height="30" rx="15" fill="#FBEBD8" stroke="#4B3A2C" stroke-width="3"/><text x="123" y="86" font-size="11" text-anchor="middle" fill="#4B3A2C">川原口</text>
        <g class="bus"><rect x="0" y="118" width="230" height="86" rx="12" fill="#F4EEE2" stroke="#4B3A2C" stroke-width="3"/><rect x="0" y="160" width="230" height="10" fill="#C8553D"/>${[18, 62, 106, 150].map(x => `<rect x="${x}" y="130" width="36" height="24" rx="3" fill="#BFD6E0"/>`).join('')}<rect class="door" x="190" y="130" width="30" height="66" fill="#8FA7B5"/><circle cx="46" cy="206" r="15" fill="#4B3A2C"/><circle cx="180" cy="206" r="15" fill="#4B3A2C"/><rect x="0" y="126" width="8" height="12" fill="#FFE7A6"/></g>
        <g class="bs-dog"><use href="#mg-dog" x="250" y="160" width="70" height="52"/></g></svg></div>
      <p class="tz-q">16時12分。もう 走って いないはずの バスが、角を まがってきた。<br>ドアが ひらく。おりて、むぎに 声を かける。</p>
      <form class="lock-form" id="tz-word"><label for="tz-w">ことば</label><input id="tz-w" autocomplete="off" placeholder="むぎに かける ことば"><button class="btn" type="submit">声を かける</button></form>`;
    return `<p class="tz-q">むぎとの さんぽは、もう おわりました。</p><p><a class="btn" href="#/end">てがみを よむ</a>　<button type="button" class="btn ghost" id="tz-replay">もういちど 見る</button></p>`;
  }

  const say = (t, cls = '') => { const el = $('#tz-say'); el.className = 'tz-say ' + cls; el.textContent = t; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
  const next = step => { const s = st(); s.walk.step = step; MG.save(); MG.dispatch(); };

  const prevAfter = MG.after;
  MG.after = (view, args) => {
    prevAfter(view, args);
    if (view !== 'tsuzuki') return;
    const step = st().ended ? 3 : st().walk.step || 0;
    if (step === 0) MG.map.render($('#tz-map'), 2025, { pick: true, still: true, at: 0, face: 'left', dog: 'senior' });
    if (step === 1) $('#tz-t').addEventListener('input', e => clock(e.target.value));
    if (step === 2 && !calm) requestAnimationFrame(() => $('.busstop').classList.add('arrive'));
  };

  function clock(v) {
    const m = String(v).normalize('NFKC').match(/(\d{1,2})\D?(\d{2})/);
    if (!m) return;
    const h = +m[1] % 12, mi = +m[2];
    $('#hh').setAttribute('transform', `rotate(${h * 30 + mi / 2})`);
    $('#mm').setAttribute('transform', `rotate(${mi * 6})`);
  }

  const pick = id => {
    if (id === 'bus') { say('むぎが、立ちあがった。耳を ぴんと 立てて、西へ。', 'ok'); setTimeout(() => next(1), 1600); }
    else say(WRONG_DEST[id]);
  };
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-pick]');
    if (p) pick(p.dataset.pick);
    if (e.target.id === 'tz-replay') ending();
  });
  document.addEventListener('keydown', e => {
    const p = e.target.closest && e.target.closest('[data-pick]');
    if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(p.dataset.pick); }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'tz-time') {
      e.preventDefault();
      const m = $('#tz-t').value.normalize('NFKC').match(/(\d{1,2})\D?(\d{2})/);
      if (!m) { say('「16:00」の ように 書いてね。'); return; }
      const t = (+m[1] % 12) * 60 + +m[2], goal = 4 * 60 + 12;
      if (t === goal) { say('むぎは、バス停の ベンチの よこで おすわりした。西の 道を じっと 見ている。', 'ok'); setTimeout(() => next(2), 1800); }
      else if (t === 4 * 60 + 10) say('バス停には、まだ だれも いない。むぎは 時刻表の 前で おすわりしている。あと 少し、なのかな。');
      else if (t < goal) say('バス停の ベンチで 待った。来たのは、ちがう バスだった。むぎは おりてくる 人を 一人ずつ 見て、耳を さげた。');
      else say('バスは、もう 行って しまった あとだった。むぎは、角の むこうを ずっと 見ていた。');
    }
    if (e.target.id === 'tz-word') {
      e.preventDefault();
      const v = norm($('#tz-w').value);
      if (v.includes('ただいま')) { MG.save(); ending(); return; }
      say(v.includes('いってきます') ? 'むぎの 耳が、ぺたんと なった。（かなしい）'
        : v.includes('おかえり') ? 'むぎは 首を かしげた。それは、むぎの ほうが 言いたい ことばみたい。'
        : v.includes('またあした') ? 'むぎは、まだ だよ、という 顔を した。'
        : v === 'むぎ' ? 'むぎは、しっぽを ゆっくり ふって、待っている。つぎの ことばを。'
        : 'むぎは 首を かしげた。（なに？）');
    }
  });

  /* ---------- おわかれ ---------- */
  const MEM = [
    ['gate', 2025, '10月11日。門の 前で、ずっと 西を 見ていた。'],
    ['bakery', 2024, 'パンのみみ、小さく ちぎってもらったね。'],
    ['park', 2019, 'さくらの 三本目の 木の下の、まつぼっくり。'],
    ['shrine', 2013, 'まけた日、ずっと となりに いてくれた。'],
    ['river', 2011, 'あめの日、はしの 下で。'],
    ['sea', 2011, 'まいとし、ここに こようね。']
  ];
  const line = (box, t, cls = '') => { const p = document.createElement('p'); p.className = 'ln ' + cls; p.textContent = t; box.append(p); return p; };

  let running = false;
  async function ending() {
    if (running) return;
    running = true;
    const stage = $('#stage');
    stage.hidden = false; stage.className = 'stage'; document.body.classList.add('staging');
    stage.innerHTML = `<button type="button" class="skip" id="skip">とばす</button><div class="sc sc-bus">${MG.ph('end-bus', '夕暮れの バス停', 'sc-bg')}<div class="sc-dog senior"><svg viewBox="0 0 120 90"><use href="#mg-dog"/></svg></div><div class="sc-text" id="sc-text"></div></div>`;
    $('#skip').onclick = () => { MG.fast = true; };
    const tx = $('#sc-text');
    await sleep(900);
    line(tx, '「ただいま、むぎ」', 'big'); await sleep(2200);
    $('.sc-dog').classList.add('wag');
    line(tx, 'むぎの しっぽが、ぐるぐる まわった。'); await sleep(2200);
    line(tx, '（うれしい！）', 'kid'); await sleep(2000);
    line(tx, 'おかえり、って 言われた 気が した。'); await sleep(2800);

    // 地図の上で、14年を さかのぼって 歩く
    stage.innerHTML = `<button type="button" class="skip" id="skip">とばす</button><div class="sc sc-map"><p class="sc-year" id="sc-year">2025</p><div class="sc-mapbox" id="sc-map"></div><div class="sc-text low" id="sc-text"></div></div>`;
    $('#skip').onclick = () => { MG.fast = true; };
    const svg = MG.map.render($('#sc-map'), 2012, { dog: null });
    svg.querySelectorAll('.route').forEach(r => r.style.opacity = '.12');
    const ids = ['bus', 'gate', 'bakery', 'park', 'shrine', 'river', 'sea'];
    svg.insertAdjacentHTML('beforeend', `<path class="route final" d="${MG.map.smooth(ids)}"/><g class="mapdog senior" id="fd"><g class="flip"><use href="#mg-dog" x="-30" y="-44" width="60" height="45"/></g></g>`);
    const path = svg.querySelector('.route.final'), len = path.getTotalLength(), dog = svg.querySelector('#fd'), flip = dog.querySelector('.flip');
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    const marks = ids.slice(1).map((id, i) => {
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      sub.setAttribute('d', MG.map.smooth(ids.slice(0, i + 2))); return sub;
    });
    marks.forEach(m => svg.append(m));
    const at = marks.map(m => m.getTotalLength()); marks.forEach(m => m.remove());
    const tx2 = $('#sc-text'), yr = $('#sc-year');
    const dur = MG.fast || calm ? 1500 : 16000;
    let shown = -1, px = null;
    await new Promise(done => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / (MG.fast ? 800 : dur)), d = len * k;
        const p = path.getPointAtLength(d);
        if (px !== null && Math.abs(p.x - px) > .05) flip.setAttribute('transform', p.x < px ? 'scale(-1 1)' : '');
        px = p.x;
        dog.setAttribute('transform', `translate(${p.x} ${p.y})`);
        path.style.strokeDashoffset = len - d;
        const y = Math.round(2025 - 14 * k);
        yr.textContent = y;
        dog.setAttribute('class', `mapdog ${y >= 2021 ? 'senior' : y >= 2012 ? 'adult' : 'puppy'}`);
        const idx = at.findIndex(a => d < a - 1);
        const reached = idx === -1 ? MEM.length - 1 : idx;
        if (reached !== shown) {
          shown = reached;
          tx2.innerHTML = '';
          line(tx2, MEM[reached][2], 'mem');
        }
        if (k < 1) frame(step); else done();
      };
      frame(step);
    });
    await sleep(2000);

    // 浜
    stage.innerHTML = `<div class="sc sc-sea">${MG.ph('end-sea', '夕焼けの 浜', 'sc-bg')}<div class="sc-dog puppy run" id="sea-dog"><svg viewBox="0 0 120 90"><use href="#mg-dog"/></svg></div><div class="sc-text" id="sc-text"></div></div>`;
    const tx3 = $('#sc-text'), sd = $('#sea-dog');
    await sleep(1200);
    line(tx3, '灯台の 見える 浜に ついた。'); await sleep(2400);
    sd.classList.add('look');
    line(tx3, 'むぎは 波うちぎわで、いちどだけ ふりかえった。'); await sleep(2400);
    line(tx3, '（ついてきてる？）', 'kid'); await sleep(2200);
    line(tx3, 'うん。ついてきてるよ。ずっと。'); await sleep(2800);
    tx3.innerHTML = '';
    line(tx3, 'リードが、ふっと かるく なった。'); await sleep(2400);
    sd.classList.remove('look'); sd.classList.add('away');
    line(tx3, 'むぎは 光の ほうへ、走っていった。子いぬの ころ みたいに。'); await sleep(3600);
    tx3.innerHTML = '';
    line(tx3, 'むぎ、', 'big'); await sleep(1800);
    line(tx3, 'またあした。', 'big'); await sleep(3200);
    stage.classList.add('white'); await sleep(1800);

    const s = st(); s.ended = true; s.endedAt = s.endedAt || Date.now(); s.walk.step = 3; MG.save();
    MG.fast = false; running = false;
    stage.hidden = true; stage.innerHTML = ''; stage.className = 'stage'; document.body.classList.remove('staging');
    location.hash = '#/end';
  }

  routes.end = () => st().ended ? `<section class="letter-end">
      <div class="paper">
        <p class="to">ハルへ</p>
        ${['あめの日、はしの したで、みつけてくれて ありがとう。', 'まいにち いっしょに あるいてくれて、ありがとう。', '', 'ハルが バスから おりてきて、「ただいま」って いうのが、', 'いちばん すきでした。', 'だから まいにち、まってました。', 'ハルが とおくへ いっても、まってました。', '', 'まってるのは、さみしく なかったよ。', 'ハルは、かならず かえってくるから。', '', 'さいごの日、ハルは となりに いたのに、ごめんね。', 'やっぱり、あそこで ききたかったんだ。', '', '……きこえたよ。', 'おかえり、ハル。', '', 'またあした。']
          .map((l, i) => l ? `<p class="ll" style="--i:${i}">${esc(l)}</p>` : `<p class="ll gap" style="--i:${i}"></p>`).join('')}
        <p class="from ll" style="--i:19">むぎ</p>
      </div>
      <p class="end-count">おさんぽ <b>5,279</b> かいめ</p>
      <p class="end-links"><a class="btn" href="#/">さんぽみちへ もどる</a></p>
    </section>` : routes.tsuzuki();
})();
