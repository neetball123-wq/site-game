/* ことづて — 未来便（三つの封）、開封の演出、伏線の回収 */
(() => {
  'use strict';
  const { $, $$, esc, reduced, state, save, seedify, markSeen, toast, routes } = K;

  const kanaHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const norm = s => kanaHira(String(s).normalize('NFKC')).replace(/[\s、。，．,.・「」『』！!？?ー－\-]/g, '').toLowerCase();

  const SEAL = (n, broken) => `<span class="seal${broken ? ' broken' : ''}" aria-hidden="true"><svg viewBox="0 0 100 100">`
    + '<path class="wax" d="M50 6c10 0 14 6 22 8s16 8 18 18-2 14 2 22-4 18-12 24-14 4-22 10-18 4-26-2-18-6-22-14 0-14-4-22 2-18 10-24 12-6 18-12 12-8 26-8z"/>'
    + '<circle cx="50" cy="52" r="26" class="rim"/>'
    + `<text x="50" y="62" text-anchor="middle" class="glyph">${n}</text></svg></span>`;

  const ENVELOPE = () => '<div class="envelope" id="envelope"><div class="env-flap"></div>'
    + '<p class="env-to">いつか、この店を継ぐ人へ</p><p class="env-from">Ｋ・Ｍ</p>'
    + '<span class="env-stamp" aria-hidden="true"><svg viewBox="0 0 60 72"><rect x="2" y="2" width="56" height="68" fill="#F6F1E8" stroke="#B8432F" stroke-width="2" stroke-dasharray="3 3"/><path d="M24 60l4-32h6l4 32z" fill="none" stroke="#2B4C8C" stroke-width="2"/><path d="M34 32l16-6M34 35l16 3" stroke="#2B4C8C" stroke-width="1.6"/><text x="30" y="16" text-anchor="middle" font-size="8" fill="#B8432F">84</text></svg></span>'
    + '<span class="env-postmark" aria-hidden="true">汐見坂<br>1.10.17</span>'
    + `<div class="env-seals">${['一', '二', '三'].map((n, i) => SEAL(n, state.seals['s' + (i + 1)])).join('')}</div></div>`;

  /* ---------- 三つの問い ---------- */
  const QUESTIONS = [
    { k: 's1', label: '封 一　受取人', q: '「いつか、この店を継ぐ人」とは、だれのこと？',
      form: '<div class="qrow"><label for="q1-year">生まれた年</label><input id="q1-year" inputmode="numeric" placeholder="例：1990" autocomplete="off"></div>'
        + '<div class="qrow"><label for="q1-rel">店主との関係</label><select id="q1-rel"><option value="">えらぶ</option><option value="regular">常連のお客さま</option><option value="pupil">弟子</option><option value="daughter">娘</option><option value="sister">妹</option><option value="friend">古い友人</option></select></div>'
        + '<div class="qrow"><label for="q1-name">名前</label><input id="q1-name" placeholder="ひらがなでも" autocomplete="off"></div>',
      check(root) {
        const y = norm($('#q1-year', root).value), rel = $('#q1-rel', root).value, n = norm($('#q1-name', root).value);
        const ok = [['1994', '94', '平成6', '平成六'].includes(y), rel === 'daughter', ['あかり', '灯', '真白灯', 'ましろあかり', 'akari'].includes(n)];
        const c = ok.filter(Boolean).length;
        return c === 3 ? true : `三つのうち、${c}つが合っているようです。`;
      } },
    { k: 's2', label: '封 二　五通目', q: '見本の五通目「亡き母へ」を、本当に書いたのは誰？',
      form: '<div class="qrow"><label for="q2">書いた人</label><input id="q2" autocomplete="off" placeholder="名前"></div>',
      check(root) {
        const v = norm($('#q2', root).value);
        if (['一葉', 'かずは', '真白一葉', 'ましろかずは', 'km', '店主', '母', 'お母さん', '母親', '初代', '初代店主', 'kazuha'].includes(v)) return true;
        if (['あかり', '灯', '真白灯', '娘'].includes(v)) return '……いいえ。その人は、五通目をまだ一度も読めていません。';
        if (v.includes('三十代') || v.includes('30代') || v.includes('依頼人')) return 'それは、依頼人として書かれている人です。';
        return 'ちがうようです。五通目の便箋を、もっとよく見てください。';
      } },
    { k: 's3', label: '封 三　合言葉', q: 'ふたりの、おわりの言葉は？',
      form: '<div class="qrow"><label for="q3">合言葉</label><input id="q3" autocomplete="off" placeholder="ことば"></div>',
      check(root) {
        const v = norm($('#q3', root).value).replace(/続き/g, 'つづき').replace(/今度/g, 'こんど').replace(/又/g, 'また');
        if (v === 'つづきはまたこんど') return true;
        if (v === 'ではまた') return 'それは、今の店主の結びの言葉です。';
        if (v.startsWith('つづき')) return 'あと少し。最後まで、ぴったりと。';
        return 'ちがうようです。';
      } }
  ];

  routes.future = (_, page) => {
    if (!state.futureVisited) { state.futureVisited = true; save(); }
    const all = ['s1', 's2', 's3'].every(k => state.seals[k]);
    page.innerHTML = '<header class="page-head"><h1 class="title mask"><span class="ml"><span>未来便</span></span></h1>'
      + '<p class="lead rv">お預かりした手紙を、決められた日にお届けしています。</p></header>'
      + '<p class="alert rv">【2026.09.01】2019年にお預かりしたお手紙のうち一通について、受取人さまを確認できておりません。宛名に心当たりのある方は、差出人さまの問いにお答えください。</p>'
      + `<div class="env-stage rv">${ENVELOPE()}</div>`
      + '<dl class="meta rv"><div><dt>お預かり日</dt><dd>2019.10.17</dd></div><div><dt>差出人</dt><dd>Ｋ・Ｍ</dd></div>'
      + '<div><dt>配達</dt><dd><span class="seed" data-seed="envcond">わたしがいなくなってから、二度目の金木犀のころ</span></dd></div>'
      + `<div><dt>状態</dt><dd>${state.done ? 'お渡し済み' : '受取人さま未確認'}</dd></div></dl>`
      + (state.done
        ? '<div class="done-actions rv"><a class="btn" href="#/letter">手紙を、もう一度読む</a><a class="btn ghost" href="#/fukusen">伏線を、たどる</a></div>'
        : '<p class="note rv">差出人さまのご指定により、このお手紙は、次の三つの問いにお答えいただいた方にお渡しします。問いはどの順番でもかまいません。</p>'
          + `<div class="questions">${QUESTIONS.map(qCard).join('')}</div>`
          + `<div class="open-wrap"><button type="button" class="btn open" id="open"${all ? '' : ' hidden'}>封を開ける</button></div>`);
    if (state.done) return;
    QUESTIONS.forEach(q => {
      const card = $(`.qcard[data-k="${q.k}"]`, page);
      if (state.seals[q.k]) return;
      $('form', card).addEventListener('submit', e => {
        e.preventDefault();
        const r = q.check(card), msg = $('.qmsg', card);
        if (r === true) {
          state.seals[q.k] = true; save();
          breakSeal(q.k, page, card);
        } else {
          msg.textContent = r;
          card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        }
      });
    });
    $('#open', page).addEventListener('click', finale);
  };
  const qCard = q => `<section class="qcard rv${state.seals[q.k] ? ' solved' : ''}" data-k="${q.k}"><p class="qlabel">${q.label}</p><h2 class="qtext">${esc(q.q)}</h2>`
    + (state.seals[q.k] ? '<p class="qdone">封は、もう切られている。</p>' : `<form>${q.form}<button class="btn small" type="submit">封を切る</button><p class="qmsg" aria-live="polite"></p></form>`) + '</section>';

  function breakSeal(k, page, card) {
    const i = +k.slice(1) - 1;
    const seal = $$('.env-seals .seal', page)[i];
    seal.classList.add('breaking');
    setTimeout(() => seal.classList.add('broken'), reduced ? 0 : 60);
    card.classList.add('solved');
    $('form', card).outerHTML = '<p class="qdone">封が、割れた。</p>';
    toast(['一つ目', '二つ目', '三つ目'][['s1', 's2', 's3'].filter(x => state.seals[x]).length - 1] + 'の封が割れました。');
    if (['s1', 's2', 's3'].every(x => state.seals[x])) {
      const open = $('#open', page);
      open.hidden = false;
      open.classList.add('appear');
      setTimeout(() => open.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 600);
    }
  }

  /* ---------- 開封：封筒が開き、手紙が広がり、一行ずつ現れる ---------- */
  let timers = [];
  function finale(replay) {
    timers.forEach(clearTimeout); timers = [];
    const ov = $('#finale');
    ov.innerHTML = `<div class="fin-stage"><div class="fin-env">${ENVELOPE()}</div>`
      + '<div class="fin-paper"><div class="fold top"></div><div class="fold mid"><div class="letter-lines" id="letter-lines"></div></div><div class="fold bottom"></div></div></div>'
      + '<div class="fin-bar"><button type="button" class="text-btn" id="fin-skip">すべて表示する</button><button type="button" class="btn" id="fin-next" hidden>伏線を、たどる</button><button type="button" class="text-btn" id="fin-close">閉じる</button></div>';
    ov.hidden = false;
    document.body.classList.add('no-scroll');
    const stage = $('.fin-stage', ov), lines = $('#letter-lines', ov);
    if (!state.opened) { state.opened = true; save(); }
    const later = (fn, ms) => timers.push(setTimeout(fn, reduced ? 0 : ms));
    later(() => stage.classList.add('flap'), 500);
    later(() => stage.classList.add('rise'), 1500);
    later(() => stage.classList.add('unfold'), 2600);
    let t = replay === true ? 3000 : 3900;
    KT.letter.forEach((l, i) => {
      later(() => {
        const p = document.createElement('p');
        p.className = l ? 'ln' : 'gap';
        if (i === 0) p.classList.add('to');
        if (i >= KT.letter.length - 2) p.classList.add('from');
        p.innerHTML = l ? `<span>${esc(l)}</span>` : '';
        lines.appendChild(p);
        lines.parentElement.scrollTop = lines.parentElement.scrollHeight;
      }, t);
      t += l ? (replay === true ? 380 : 1150) : 300;
    });
    later(finish, t + 600);
    function finish() {
      timers.forEach(clearTimeout); timers = [];
      if (lines.children.length < KT.letter.length) {
        lines.innerHTML = KT.letter.map((l, i) => `<p class="${l ? 'ln' : 'gap'}${i === 0 ? ' to' : ''}${i >= KT.letter.length - 2 ? ' from' : ''} now">${l ? `<span>${esc(l)}</span>` : ''}</p>`).join('');
        stage.classList.add('flap', 'rise', 'unfold');
      }
      $('#fin-skip', ov).hidden = true;
      $('#fin-next', ov).hidden = false;
      if (!state.done) { state.done = true; state.endedAt = Date.now(); save(); }
    }
    $('#fin-skip', ov).addEventListener('click', finish);
    $('#fin-next', ov).addEventListener('click', () => { closeFinale(); K.go('#/fukusen'); });
    $('#fin-close', ov).addEventListener('click', () => { closeFinale(); if (location.hash === '#/letter') K.go('#/future'); else K.dispatch(); });
  }
  function closeFinale() {
    timers.forEach(clearTimeout); timers = [];
    $('#finale').hidden = true;
    $('#finale').innerHTML = '';
    document.body.classList.remove('no-scroll');
  }
  routes.letter = (_, page) => {
    if (!state.done) { K.go('#/future'); return; }
    routes.future([], page);
    finale(true);
  };

  /* ---------- 伏線を、たどる ---------- */
  routes.fukusen = (_, page) => {
    if (!state.done) { K.go('#/future'); return; }
    const seeds = KT.seeds, seen = seeds.filter(s => state.seen[s[0]]).length;
    const mins = Math.max(1, Math.round((state.endedAt - state.started) / 60000));
    page.innerHTML = '<header class="page-head fk-head"><p class="eyebrow">回収</p><h1 class="title big mask"><span class="ml"><span>伏線</span></span></h1>'
      + `<p class="fk-count rv">あなたが目にしていた伏線　<b class="count" data-to="${seen}">0</b><span>／${seeds.length}</span></p>`
      + `<p class="lead rv">このサイトには、最初から全部書いてありました。プレイ時間　約${mins}分。<br>「その場所へ」を押すと、今はどのページでも伏線に印がついています。印に触れると、回収の一言が出ます。</p></header>`
      + '<ol class="fk-list">' + seeds.map(([id, where, go, quote, reveal], i) => `<li class="fk rv${state.seen[id] ? ' seen' : ''}" style="--d:${i % 4}">`
        + `<span class="fk-no">${String(i + 1).padStart(2, '0')}</span><div class="fk-body"><p class="fk-quote"><mark>${esc(quote)}</mark></p>`
        + `<p class="fk-reveal">${esc(reveal)}</p><p class="fk-meta"><span class="chip">${state.seen[id] ? '目にしていた' : '見逃していた'}</span><span>${esc(where)}</span><a class="ul" href="${go}">その場所へ</a></p></div></li>`).join('') + '</ol>'
      + '<div class="done-actions rv"><a class="btn" href="#/diary/dhello">新しい日記を読む</a><a class="btn ghost" href="#/">トップへ</a></div>';
    const c = $('.count', page);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const to = +c.dataset.to, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1400); c.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      reduced ? (c.textContent = to) : requestAnimationFrame(step);
    });
    io.observe(c);
  };

  K.dispatch();
})();
