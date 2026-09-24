/* ことづて — 共通処理：保存、画面切り替え、伏線の記録、登場アニメ、ポストさん */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'kotozute.v1';

  /* ---------- 保存（この端末だけ） ---------- */
  const fresh = () => ({ started: Date.now(), seen: {}, seals: { s1: false, s2: false, s3: false }, lamp: false, folded: false, futureVisited: false, opened: false, done: false, endedAt: 0, hintLv: {} });
  const state = (() => {
    const base = fresh();
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) return { ...base, ...s, seals: { ...base.seals, ...(s.seals || {}) }, seen: s.seen || {}, hintLv: s.hintLv || {} };
    } catch (e) { /* 保存できなくても遊べる */ }
    return base;
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* noop */ } };

  // 本文中の <s data-seed="…"> を伏線の印（span）に置き換える
  const seedify = html => String(html).replace(/<s data-seed="([\w-]+)">/g, '<span class="seed" data-seed="$1">').replace(/<\/s>/g, '</span>');
  const markSeen = id => { if (!state.seen[id]) { state.seen[id] = Date.now(); save(); } };

  /* ---------- 伏線を「目にした」記録 ---------- */
  const seenTimers = new WeakMap();
  const seedIO = new IntersectionObserver(entries => entries.forEach(en => {
    const el = en.target;
    if (en.isIntersecting) seenTimers.set(el, setTimeout(() => markSeen(el.dataset.seed), 700));
    else clearTimeout(seenTimers.get(el));
  }), { threshold: 0.6 });

  /* ---------- 登場アニメ（見出しマスク・ブラーイン・カーテン） ---------- */
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
  }), { threshold: 0.15 });
  function wire(root) {
    $$('.rv, .mask, .curtain', root).forEach(el => (reduced ? el.classList.add('in') : revealIO.observe(el)));
    // 透かしの中の伏線は、光を当てたときにだけ数える
    $$('.seed', root).forEach(el => { if (!el.closest('.mark')) seedIO.observe(el); });
    if (state.done) $$('.seed', root).forEach(el => el.classList.add('lit'));
  }

  /* ---------- 通知 ---------- */
  function toast(text, ms = 4200) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = text;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 700);
  }

  /* ---------- ポストさん（ヒント） ---------- */
  function hintStage() {
    if (state.done) return 'done';
    if (!state.futureVisited) return 'start';
    const open = ['s1', 's2', 's3'].find(k => !state.seals[k]);
    return open || 'open';
  }
  /* 考えている時間（ヒントは、時間がたつと一段ずつ教えてもらえる）
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  setInterval(() => {
    if (document.visibilityState !== 'visible' || state.done) return;
    const k = hintStage();
    state.clock = state.clock || {}; state.clock[k] = (state.clock[k] || 0) + 5000;
    state.playMs = (state.playMs || 0) + 5000;
    save();
  }, 5000);
  const fmtLeft = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  function speak() {
    const st = hintStage(), list = KT.hints[st], lv = state.hintLv[st] || 0;
    const left = list.length > 1 && lv < list.length ? Math.max(0, HINT_AT[Math.min(lv, 2)] - ((state.clock || {})[st] || 0)) : 0;
    const b = $('#cat-say');
    if (left > 0) {
      b.innerHTML = `<b>……にゃ。</b>${lv ? esc(list[lv - 1]) + '<br>' : ''}（ポストさんは、まだ考えているようだ。あと${fmtLeft(left)}くらいしたら、また聞いてみよう）`;
    } else {
    const text = list[Math.min(lv, list.length - 1)];
    state.hintLv[st] = lv + 1;
    save();
    const step = list.length > 1 ? `<small>ヒント ${Math.min(lv + 1, list.length)}／${list.length}</small>` : '';
    b.innerHTML = `<b>にゃ。</b>${esc(text)}${step}`;
    }
    b.hidden = false;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(speak.t);
    speak.t = setTimeout(() => { b.hidden = true; }, 9000);
  }
  $('#cat').addEventListener('click', speak);

  /* ---------- 画面の切り替え（View Transitions） ---------- */
  const routes = {};
  let first = true;
  function render() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const head = parts[0] || '';
    const fn = routes[head] || routes[''];
    const page = $('#page');
    page.innerHTML = '';
    fn(parts.slice(1), page);
    $$('#gnav a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#/' + head ? 'page' : 'false'));
    $('#owner').textContent = state.done ? '店主　真白 灯' : '店主　真白 一葉';
    document.body.classList.toggle('reread', state.done);
    document.body.toggleAttribute('data-top', head === '');
    wire(page);
    if (!first) scrollTo(0, 0);
    first = false;
  }
  /* 画面の切りかえ演出（View Transitions）。画面が見えていないときや、途中で次の切りかえが来たときは
     失敗の知らせ（Promise の reject）が来るので、握りつぶして中身だけは必ず切りかえる */
  const viewTransit = (fn) => {
    if (!document.startViewTransition || document.hidden) { fn(); return; }
    try {
      const t = document.startViewTransition(fn);
      [t.ready, t.finished, t.updateCallbackDone].forEach(p => p && p.catch(() => {}));
    } catch (e) { fn(); }
  };
  function dispatch() {
    if (!reduced && !first) viewTransit(render);
    else render();
  }
  addEventListener('hashchange', dispatch);

  // 結末のあとは、伏線に触れると「回収」の一言が出る
  document.addEventListener('click', e => {
    const s = e.target.closest('.reread .seed');
    if (!s) return;
    const seed = KT.seeds.find(x => x[0] === s.dataset.seed);
    if (seed) toast(`<b>伏線：${esc(seed[3])}</b>${esc(seed[4])}`, 6000);
  });

  window.K = { $, $$, esc, reduced, state, save, seedify, markSeen, wire, toast, routes, dispatch, go: h => { location.hash = h; } };
})();
