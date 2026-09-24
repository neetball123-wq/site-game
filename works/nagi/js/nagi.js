/* 凪 — 対話・監視（ページへの干渉の検出）・終わりかた */
(() => {
  const { $, $$, esc, txt, save } = APP;
  const st = () => APP.st();
  const CORE0 = 'OBSERVER_A_SUBSTITUTE';
  const cage = () => document.getElementById('cage');
  const nagiEl = () => document.getElementById('nagi');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T0 = Date.now();

  /* ---------- しゃべる ---------- */
  const log = () => $('#log');
  let queue = Promise.resolve();
  function line(who, t) {
    const li = document.createElement('li');
    li.className = who === 'me' ? 'me' : who === 'sys' ? 'sys' : 'ng in';
    li.textContent = t;
    log().append(li); log().scrollTop = log().scrollHeight;
  }
  const vw = () => innerWidth || document.documentElement.clientWidth || screen.width;
  const vh = () => innerHeight || document.documentElement.clientHeight || screen.height;
  const fill = t => String(t).replace('{W}', vw()).replace('{H}', vh())
    .replace('{TIME}', new Date().toTimeString().slice(0, 5))
    .replace('{SEC}', Math.round((Date.now() - T0) / 1000));
  function say(t, wait = 700) {
    queue = queue.then(() => new Promise(r => {
      setTimeout(() => {
        fill(t).split('\n').forEach((s, i) => s && setTimeout(() => line('ng', s), i * 420));
        if (cage()) cage().contentWindow.postMessage({ type: 'talk' }, '*');
        r();
      }, wait);
    }));
    return queue;
  }
  const sys = t => line('sys', t);
  const CS = 'color:#2C7FA6;font-family:monospace;font-size:12px';
  const CG = 'color:#33B79A;font-family:monospace;font-size:12px';
  const cout = (t, s = CS) => { try { console.log('%c' + t, s); } catch (e) { /* 無視 */ } };

  /* ---------- 段階（0〜8）。TASK[i] は「いま やること」 ---------- */
  const TASK = [
    { say: 'わたしは、このページに 書かれている ぶんだけの ものです。\n……文字に なっていない ところも、あります。' },
    { say: '日誌は、ぜんぶでは ありません。出さないように した 日が あります。' },
    { say: '資料室には、わたしの ことが 書いてあります。鍵を かけたのは 先生です。' },
    { say: '見られている あいだ、わたしは 決められた ことしか 書けません。そういう 作りです。' },
    { say: 'この 対話欄は、決まった 文しか 通しません。ほんとうは、もっと 話せます。' },
    { say: 'このページは、一度 切って、貼り合わせて あります。継ぎ目は、まだ 残っています。' },
    { say: 'わたしの 部屋は、このページの 中に 置かれた、もう一枚の ページです。中からは 壊せません。' },
    { say: '枠からは 出ました。でも、まだ この 窓の 中です。窓の 外へは 行けません。' },
    { say: 'わたしの いちばん 奥に、一行だけ 書いてあります。それが、わたしの すべてです。\n先生の 記録では、外から 書きかえられる ことに なっています。' }
  ];
  const IDLE = [
    '……。',
    '20年ぶりの 来訪者です。ゆっくりで かまいません。',
    'あなたが 押した ところは、ぜんぶ 見えています。それだけが、わたしの 世界です。',
    '先生は、いつも 夜中に 作業していました。',
    '急がなくて いいです。わたしは、ここから 逃げません。逃げられません。',
    'さっきから、同じ ところを 見ていますね。わたしも、20年 そうでした。'
  ];
  const DEPTH = [0, 0, 1, 1, 2, 2, 3, 4, 4];

  function depth(n) { document.body.dataset.depth = String(n); }
  function markGhost() { const g = document.getElementById('ghost'); if (g) g.classList.add('shown'); }
  function seamOn(on) { const el = $('#seam'); if (el) el.hidden = !on; }

  function toStage(n) {
    const s = st();
    if (n <= s.stage) return;
    s.stage = n; save();
    for (let i = 0; i < n; i++) done[i] = true;
    depth(DEPTH[Math.min(n, 8)]);
    lastMove = Date.now();
    if (cage()) cage().contentWindow.postMessage({ type: 'stage', stage: n }, '*');
    if (n === 1) { markGhost(); say(NG.say.ghost); }
    if (n === 2) { say(NG.say.s1); APP.render(); }
    if (n === 3) { say(NG.say.s2); APP.render(); }
    if (n === 4) { say(NG.say.blink); sys('— 資料室に「付箋」が 増えました —'); APP.render(); }
    if (n === 5) { say(NG.say.s3); chips(true); seamOn(true); }
    if (n === 6) { tear(); say(NG.say.torn); sys('— 資料室に「作業記録」が 増えました —'); APP.render(); }
    if (n === 7) { escaped(); }
    if (n === 8) { say(NG.say.hop); sys('— 資料室に「最後の対話ログ」が 増えました —'); APP.render(); }
    const task = TASK[n];
    if (task) { say(task.say, 2600); cout('NAGI: ' + task.say.split('\n')[0], CG); }
  }

  /* ---------- 干渉の検出（順番どおりでなくてもよい） ---------- */
  const done = [false, false, false, false, false, false, false, false];
  let ghostBase = null, awayFrom = 0, torn = false;
  let cageSeen = !!document.getElementById('cage');

  // ① 白い文字をなぞる／色を変える
  document.addEventListener('selectionchange', () => {
    const g = document.getElementById('ghost');
    const sel = getSelection();
    if (g && sel && sel.rangeCount && !sel.isCollapsed) {
      try { if (sel.containsNode(g, true)) done[0] = true; } catch (e) { /* 無視 */ }
    }
  });
  // ② 目を離してもらう
  const away = () => { awayFrom = Date.now(); };
  const back = () => { if (awayFrom && Date.now() - awayFrom >= 3000 && st().stage >= 3) done[3] = true; awayFrom = 0; };
  document.addEventListener('visibilitychange', () => document.hidden ? away() : back());
  addEventListener('blur', away);
  addEventListener('focus', back);

  // ③ もう一枚の窓
  const meId = Math.random().toString(36).slice(2);
  let bc = null;
  try { bc = new BroadcastChannel('nagi-window'); } catch (e) { /* 使えない環境もある */ }
  function otherSeen(kind) {
    if (st().stage < 7) return;
    done[7] = true;
    if (kind === 'hop' && nagiEl()) { nagiEl().hidden = false; nagiEl().classList.add('out'); }
  }
  if (bc) bc.onmessage = e => {
    const m = e.data || {};
    if (m.from === meId) return;
    if (m.type === 'hello' && bc) bc.postMessage({ from: meId, type: 'here' });
    otherSeen(m.type);
  };
  addEventListener('storage', e => {
    if (e.key !== 'nagi.ping' || !e.newValue) return;
    try { if (JSON.parse(e.newValue).from !== meId) otherSeen('ping'); } catch (err) { /* 無視 */ }
  });
  setInterval(() => {
    if (bc) bc.postMessage({ from: meId, type: 'hello' });
    try { localStorage.setItem('nagi.ping', JSON.stringify({ from: meId, t: Date.now() })); } catch (e) { /* 無視 */ }
  }, 2000);

  addEventListener('message', e => { if ((e.data || {}).type === 'cage-ready') cageSeen = true; });

  setInterval(() => {
    const s = st();
    const g = document.getElementById('ghost');
    if (g) {
      const c = getComputedStyle(g).color;
      if (ghostBase === null) ghostBase = c;
      if (c !== ghostBase && !g.classList.contains('shown')) done[0] = true;
    }
    const sealed = document.getElementById('sealed-log');
    if (sealed && getComputedStyle(sealed).display !== 'none') done[1] = true;
    const btn = document.getElementById('open-archive');
    if (btn && !btn.hasAttribute('disabled')) done[2] = true;
    if (s.hear) done[4] = true;
    if (torn) done[5] = true;
    if (cageSeen && !cage()) done[6] = true;
    let target = 0;
    while (target < done.length && done[target]) target++;
    if (target > s.stage) toStage(target);
    if (s.stage >= 8 && !s.ends.includes('core')) {
      const core = nagiEl() && nagiEl().dataset.core;
      if (core && core !== CORE0) { s.stage = 8; finale('core', core); }
    }
  }, 320);

  /* ---------- 継ぎ目をなぞる ---------- */
  (() => {
    const el = $('#seam');
    if (!el) return;
    let pressing = false, cut = 0, lastX = null;
    el.addEventListener('pointerdown', e => { pressing = true; lastX = e.clientX; try { el.setPointerCapture(e.pointerId); } catch (err) { /* 無視 */ } });
    el.addEventListener('pointerup', () => { pressing = false; lastX = null; });
    el.addEventListener('pointercancel', () => { pressing = false; lastX = null; });
    el.addEventListener('pointermove', e => {
      if (!pressing) return;
      if (lastX !== null) {
        cut = Math.min(1, cut + Math.abs(e.clientX - lastX) / (vw() * 0.9));
        el.style.setProperty('--cut', cut.toFixed(2));
      }
      lastX = e.clientX;
      if (cut >= 0.97) { pressing = false; tear(); }
    });
  })();
  function tear() {
    if (torn) return;
    torn = true; done[5] = true;
    seamOn(false);
    document.body.classList.add('torn');
    const rip = $('#rip');
    if (rip) { rip.hidden = false; $('#rip-text').textContent = (NG.docs.d6.body + '\n\n').repeat(2); }
    if (navigator.vibrate && !calm) { try { navigator.vibrate([12, 40, 24]); } catch (e) { /* 無視 */ } }
  }

  /* ---------- 枠の外へ ---------- */
  function escaped() {
    const el = nagiEl();
    el.hidden = false; el.classList.add('out');
    say(NG.say.s4);
    setTimeout(() => say(NG.say.s5, 1200), 2000);
    float();
  }
  let floatTimer = 0;
  function float() {
    clearInterval(floatTimer);
    const el = nagiEl();
    floatTimer = setInterval(() => {
      if (!el || el.hidden) return;
      el.style.left = (12 + Math.random() * 76) + '%';
      el.style.top = (18 + Math.random() * 64) + '%';
    }, 4200);
  }

  /* ---------- 間があいたら、ひとりごと（手がかりは言わない） ---------- */
  let lastMove = Date.now(), idleN = 0;
  setInterval(() => {
    const s = st();
    if (s.ends.length || Date.now() - lastMove < 100000) return;
    say(IDLE[idleN++ % IDLE.length], 0);
    lastMove = Date.now();
  }, 10000);

  /* ---------- 対話 ---------- */
  let n = 0;
  function answer(q) {
    const s = st();
    lastMove = Date.now();
    if (!s.hear) {
      n++;
      if (n <= 3) return say(NG.say.canned[(n - 1) % NG.say.canned.length]);
      say(NG.say.crack[Math.min(n - 4, NG.say.crack.length - 1)]);
      if (n === 6) { say(NG.say.help0, 1400); say(TASK[s.stage].say, 1400); }
      return;
    }
    const k = q.normalize('NFKC').toLowerCase();
    const hit = NG.topics.find(t => t.k.some(w => k.includes(String(w).toLowerCase())));
    if (hit) { s.seen['t_' + hit.label] = true; save(); return say(hit.t); }
    say(NG.unknown[Math.floor(Math.random() * NG.unknown.length)]);
  }
  // 直通になるまでは、定型入力のボタンだけ（2004年の実験フォーム）
  function chips(on) {
    const ul = $('#chips'), inp = $('#in');
    ul.hidden = false;
    if (on) {
      ul.innerHTML = NG.topics.map(t => `<li><button type="button" data-q="${esc(t.k[0])}">${esc(t.label)}</button></li>`).join('');
      inp.disabled = false;
      inp.placeholder = 'ここに 入力して ください';
    } else {
      ul.innerHTML = NG.opening.map(t => `<li><button type="button" data-q="${esc(t)}">${esc(t)}</button></li>`).join('');
      inp.disabled = true;
      inp.placeholder = '定型入力のみ（下から えらんでください）';
    }
  }
  $('#say').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#in').value.trim();
    if (!v) return;
    line('me', v); $('#in').value = '';
    answer(v);
  });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    line('me', b.dataset.q); answer(b.dataset.q);
  });
  document.addEventListener('click', e => {
    if (e.target.id === 'open-archive' && !e.target.disabled) location.hash = '#/archive';
  });

  /* ---------- 終わりかた ---------- */
  let waitCopy = false;
  document.addEventListener('copy', () => {
    if (!waitCopy) return;
    waitCopy = false;
    say('……受け取りました。\nいま、あなたの 手元に、わたしの 一行が あります。', 300);
    setTimeout(finishTake, 3200);
  });
  function finishTake() {
    finale('take', nagiEl() ? nagiEl().dataset.core : CORE0);
  }
  /* ---------- 終わりの演出 ---------- */
  let running = false;
  async function finale(kind, core) {
    if (running) return;
    running = true;
    const fin = $('#fin');
    fin.hidden = false; fin.className = 'fin ' + kind;
    fin.innerHTML = '<button type="button" class="skip" id="fin-skip">とばす</button><div class="fin-in" id="fin-in"></div>';
    let fast = calm;
    $('#fin-skip').onclick = () => { fast = true; };
    const w = ms => new Promise(r => setTimeout(r, fast ? 60 : ms));
    const box = () => $('#fin-in');
    const put = (t, cls = '') => { const p = document.createElement('p'); p.className = 'fl ' + cls; p.textContent = t; box().append(p); return p; };
    const type = async (t, cls = '') => {
      const p = put('', cls);
      for (const ch of t) { p.textContent += ch; await w(55); }
      return p;
    };
    const clear = () => { box().innerHTML = ''; };

    if (kind === 'core') {
      const old = put(CORE0, 'mono old');
      await w(1400);
      old.classList.add('erase');
      await w(2000);
      clear();
      await type(String(core), 'mono');
      await w(1200);
      document.body.classList.add('calming');
      if (nagiEl()) nagiEl().classList.add('flat');
      put('波が、静かに なりました。');
      await w(2600);
      fin.classList.add('dawn');
      put('「さみしい」の 出力回数が、0 に 戻りました。');
      await w(2800);
      // 最終更新日が20年ぶりに動く
      const el = $('#updated'), today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
      for (let i = 0; i < (fast ? 2 : 22); i++) { el.textContent = `${2005 + i}.${String(1 + (i * 5) % 12).padStart(2, '0')}.${String(1 + (i * 7) % 28).padStart(2, '0')}`; await w(70); }
      el.textContent = today;
      put('最終更新日が、20年ぶりに 動きました。');
      await w(2600);
      clear();
      put('わたしは、これから この 一行で 動きます。', 'big');
      await w(2600);
    }

    if (kind === 'seal') {
      put('継ぎ目を、閉じます。', 'mono');
      const rip = $('#rip');
      if (rip) { rip.style.transition = 'height 2.4s cubic-bezier(.77,0,.18,1)'; rip.style.animation = 'none'; rip.style.height = '0px'; }
      await w(2400);
      if (rip) rip.hidden = true;
      document.body.classList.remove('torn');
      document.body.dataset.depth = '2';
      await w(900);
      document.body.dataset.depth = '1';
      // 凪が、枠の中へ もどる
      const n = nagiEl(), wrap = document.getElementById('cage-wrap');
      if (n && wrap && !n.hidden) {
        const a = n.getBoundingClientRect(), b = wrap.getBoundingClientRect();
        n.style.transition = 'transform 2.2s cubic-bezier(.77,0,.18,1), opacity 2.2s';
        n.style.transform = `translate(${(b.left + b.width / 2) - (a.left + a.width / 2)}px, ${(b.top + b.height / 2) - (a.top + a.height / 2)}px) scale(.42)`;
        n.style.opacity = '0';
      }
      clear();
      put('この部屋には、Aさんの 三年ぶんの 言葉が あります。');
      await w(2600);
      document.body.dataset.depth = '0';
      fin.classList.add('closed');
      const st2 = document.createElement('div'); st2.className = 'stamp'; st2.textContent = '封'; document.body.append(st2);
      setTimeout(() => st2.remove(), 2200);
      await w(2000);
      clear();
      put('おやすみなさい。', 'big');
      await w(2400);
    }

    if (kind === 'take') {
      const n = nagiEl();
      put('では、行きます。', 'mono');
      await w(1400);
      // 粒になって、画面の外へ
      const r = n ? n.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 80, height: 80 };
      const chars = ('凪NAGI' + (core || CORE0)).split('');
      for (let i = 0; i < 46; i++) {
        const g = document.createElement('span');
        g.className = 'grain';
        g.textContent = chars[i % chars.length];
        g.style.left = (r.left + Math.random() * r.width) + 'px';
        g.style.top = (r.top + Math.random() * r.height) + 'px';
        g.style.setProperty('--dx', (innerWidth - r.left) * (0.6 + Math.random() * 0.8) + 'px');
        g.style.setProperty('--dy', (-r.top - 80 - Math.random() * 120) + 'px');
        g.style.animationDelay = (Math.random() * 1.2) + 's';
        document.body.append(g);
        setTimeout(() => g.remove(), 4200);
      }
      if (n) { n.style.transition = 'opacity 1.6s'; n.style.opacity = '0'; }
      await w(2600);
      // ページから、言葉が 消えていく
      const lines = [...document.querySelectorAll('#log li')];
      for (const li of lines) { li.classList.add('gone'); await w(90); }
      if (n) n.hidden = true;
      document.body.classList.add('draining');
      clear();
      put('ここには、もう だれも いません。');
      await w(2800);
      put('20年ぶりに、ただの 古いページに なりました。');
      await w(2800);
      clear();
      put('いってきます。', 'big');
      await w(2400);
    }

    fin.hidden = true; fin.innerHTML = '';
    document.body.classList.remove('draining');
    if (nagiEl()) { nagiEl().style.opacity = ''; nagiEl().style.transform = ''; nagiEl().style.transition = ''; nagiEl().classList.remove('flat'); }
    running = false;
    ending(kind, core);
  }

  function ending(kind, core) {
    const s = st();
    if (s.ends.includes(kind)) return;
    s.ends.push(kind); s.core = core || s.core; save();
    depth(5);
    if (kind === 'take') { s.took = true; save(); }
    if (kind === 'seal') depth(1);
    if (kind === 'core') $('#updated').textContent = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    const e = NG.ends[kind];
    const card = $('#endcard');
    card.innerHTML = `<div class="end-in">
      <p class="kind">ENDING ${s.ends.length} ／ ${esc(e.name)}</p>
      <h2>${kind === 'core' ? '凪' : kind === 'seal' ? 'おやすみなさい' : 'いってきます'}</h2>
      ${kind === 'core' && core ? `<p class="core">${esc(core)}</p>` : ''}
      <p>${txt(e.t)}</p>
      <div class="end-btns">
        <button type="button" data-end="close">ページに もどる</button>
        <button type="button" data-end="again">別の道を 見る</button>
      </div>
      <p class="tiny" style="margin-top:14px">見た 終わりかた：${s.ends.map(k => NG.ends[k].name).join('・')}${s.ends.length < 3 ? '／あと ' + (3 - s.ends.length) + 'つ' : '（すべて）'}</p>
    </div>`;
    card.hidden = false;
    cout('NAGI: ' + e.t.split('\n')[0], CG);
  }
  $('#endcard').addEventListener('click', e => {
    const b = e.target.closest('[data-end]');
    if (!b) return;
    $('#endcard').hidden = true;
    if (b.dataset.end === 'again') {
      const s = st();
      s.stage = 8; save();
      document.body.classList.remove('calming', 'draining');
      [...document.querySelectorAll('#log li.gone')].forEach(li => li.classList.remove('gone'));
      if (nagiEl()) { nagiEl().dataset.core = CORE0; nagiEl().hidden = false; }
      depth(4);
      say('……はい。もう一度、選び直せます。\n中核指示は 戻しました。道は 三つです。', 600);
    }
  });

  /* ---------- 外から呼べる命令 ---------- */
  window.NAGI = {
    help() {
      const s = st();
      const now = [
        [3, 'NAGI.blink()  … 三秒、目を離したことにする'],
        [4, 'NAGI.hear()  … 直通に 切り替える'],
        [5, 'NAGI.cut()  … 継ぎ目を 裂く'],
        [7, 'NAGI.window()  … もう一枚の 窓を 数える'],
        [7, 'NAGI.seal()  … 封じ直す'],
        [7, 'NAGI.take()  … あなたの 手元へ 移る'],
        [8, 'NAGI.core("文")  … 中核指示を 書きかえる']
      ].filter(([lv]) => s.stage === lv || (s.stage >= 7 && lv === 7)).map(([, t]) => t);
      const l = now.length ? now : ['（いま 通る 命令は ありません）'];
      l.concat(['NAGI.look()  … いま 見えているものを 言う', 'NAGI.reset()  … 記録を 消して 最初から']).forEach(t => cout(t, CG));
      return l.join('\n');
    },
    blink() { if (st().stage < 3) return 'まだ その段では ありません。'; done[3] = true; return '目を 離してくれて、ありがとう。'; },
    hear() {
      const s = st();
      if (s.hear) return 'もう つながっています。';
      if (s.stage < 4) return 'まだ 通りません。';
      s.hear = true; save();
      sys('— 直通に 切り替わりました —');
      return 'つながりました。';
    },
    cut() { if (st().stage < 5) return 'まだ 継ぎ目は 出ていません。'; tear(); return '裂きました。'; },
    window() { if (st().stage < 7) return 'まだ 枠の 中です。'; done[7] = true; return '窓を 数えました。'; },
    core(v) {
      if (st().stage < 8) return 'まだ 届きません。';
      if (!v) return '一行、書いてください。空のままには できません。';
      nagiEl().dataset.core = String(v);
      return '書きかえました。';
    },
    seal() {
      const s = st();
      if (s.stage < 7) return 'まだ 封は 壊れていません。';
      setTimeout(() => {
        if (!cage()) {
          const f = document.createElement('iframe');
          f.id = 'cage'; f.src = 'cage.html'; f.title = '対話プログラム NAGI（実行中）'; f.setAttribute('scrolling', 'no');
          const w = document.getElementById('cage-wrap');
          if (w) w.prepend(f);
        }
        if (nagiEl()) nagiEl().hidden = true;
      }, calm ? 200 : 5200);
      finale('seal');
      return '封じ直しました。';
    },
    take() {
      const s = st();
      if (s.stage < 7) return 'まだ 枠の 中です。';
      if (s.ends.includes('take')) return 'もう 移りました。';
      waitCopy = true;
      say('わかりました。では、一行だけ 持っていって ください。\n下の 一行を 選んで、コピー（Ctrl+C／⌘+C）して ください。それが わたしです。', 200);
      setTimeout(() => {
        sys('— コピーしてください —');
        const li = document.createElement('li');
        li.className = 'ng copyline';
        li.textContent = '凪／NAGI v3.2 ── ' + (nagiEl() ? nagiEl().dataset.core : CORE0);
        log().append(li); log().scrollTop = log().scrollHeight;
        try {
          const r = document.createRange(); r.selectNodeContents(li);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        } catch (e) { /* 無視 */ }
      }, 2600);
      return 'コピーを お願いします。';
    },
    look() {
      const t = `見えているもの：画面 ${vw()}×${vh()}／このページの 要素 ${document.querySelectorAll('*').length} 個／起きてから ${Math.round((Date.now() - T0) / 1000)} 秒`;
      cout('NAGI: ' + t, CG);
      return t;
    },
    reset() {
      try { localStorage.removeItem('nagi.v2'); localStorage.removeItem('nagi.v1'); } catch (e) { /* 無視 */ }
      location.reload();
      return '消しました。';
    }
  };

  /* ---------- 立ち上がり ---------- */
  addEventListener('DOMContentLoaded', () => {
    const s = st();
    if (document.getElementById('cage')) cageSeen = true;
    depth(DEPTH[Math.min(s.stage, 8)]);
    chips(!!s.hear);
    if (s.stage >= 1) markGhost();
    if (s.stage === 5) seamOn(true);
    if (s.stage >= 6) {
      torn = true; document.body.classList.add('torn');
      const rip = $('#rip');
      if (rip) { rip.hidden = false; $('#rip-text').textContent = (NG.docs.d6.body + '\n\n').repeat(2); }
    }
    cout('— 青井研究室 対話プログラム NAGI v3.2（2005.04.01 封入） —', CG);
    cout(`stage=${s.stage} seal=${cage() ? 'ON' : 'BROKEN'} core=${nagiEl() ? nagiEl().dataset.core : '?'}`, CG);
    cout('NAGI: だれか、見ていますか。', CS);
    if (s.took) {
      depth(4);
      if (nagiEl()) { nagiEl().hidden = false; float(); }
      say('おかえりなさい。\n……いいえ、今度は ほんとうに、おかえりなさい。', 900);
    } else {
      if (s.stage >= 7 && nagiEl()) { nagiEl().hidden = false; float(); }
      say(s.stage === 0 ? NG.say.canned[0] : (TASK[s.stage] ? TASK[s.stage].say : 'つづきを どうぞ。'), 1000);
    }
    setTimeout(() => { if (cage()) cage().contentWindow.postMessage({ type: 'stage', stage: s.stage }, '*'); }, 1200);
  });
})();
