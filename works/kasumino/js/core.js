/* 霞野線アーカイブ — 共通処理：状態、画面切り替え、調査ノート、スタンプ */
(() => {
  'use strict';
  const D = window.DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = n => String(n).padStart(2, '0');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'kasumino.v1';

  /* ---------- 状態（この端末だけに保存） ---------- */
  const fresh = () => ({
    started: Date.now(), diary: false, stamps: [], old: false, counter: 9996, lab: false, tsuki: false, archive: false,
    tms: { tt: false, sw: { 21: 'N', 22: 'R' }, signal: false, log: false },
    ended: false, endedAt: 0, facts: [], hintLv: {}, posts: [], kmMode: false, morseNote: ''
  });
  const state = (() => {
    const base = fresh();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) return { ...base, ...saved, tms: { ...base.tms, ...(saved.tms || {}), sw: { ...base.tms.sw, ...((saved.tms || {}).sw || {}) } } };
    } catch (e) { /* 保存できない環境でも遊べる */ }
    return base;
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* noop */ } };

  const stage = () => (state.ended ? 6 : state.archive ? 5 : state.tsuki ? 4 : state.lab ? 3 : state.old ? 2 : state.diary ? 1 : 0);

  /* ---------- 考えている時間（掲示板のヒントは、時間がたつと一段ずつ答えてもらえる） ----------
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  setInterval(() => {
    if (document.visibilityState !== 'visible' || state.ended) return;
    const k = stage();
    state.clock = state.clock || {}; state.clock[k] = (state.clock[k] || 0) + 5000;
    state.playMs = (state.playMs || 0) + 5000;
    save();
  }, 5000);
  const hintLeft = k => {
    const lv = state.hintLv[k] || 0, list = D.hints[k] || [];
    if (!list.length || lv >= list.length) return 0;
    return Math.max(0, HINT_AT[Math.min(lv, HINT_AT.length - 1)] - ((state.clock || {})[k] || 0));
  };
  const fmtLeft = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };

  /* ---------- 文字の正規化 ---------- */
  const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const norm = s => toKata(String(s).normalize('NFKC')).replace(/\s+/g, '').toUpperCase();
  const ymd = (d = new Date(), sep = '.') => `${d.getFullYear()}${sep}${pad(d.getMonth() + 1)}${sep}${pad(d.getDate())}`;
  const hm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  /* ---------- 通知 ---------- */
  function toast(title, body = '', ms = 4600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${esc(title)}</b>${body ? `<span>${body}</span>` : ''}`;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 600);
  }

  /* ---------- 調査ノート ---------- */
  function fact(id, quiet) {
    if (!D.facts[id] || state.facts.includes(id)) return;
    state.facts.push(id);
    save();
    renderNote();
    if (!quiet) {
      toast('調査ノートに書き留めました', esc(D.facts[id]));
      const b = $('#note-btn');
      b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    }
  }
  let resetArmed = 0;
  function renderNote() {
    $('#note-count').textContent = state.facts.length;
    const panel = $('#note-panel');
    panel.innerHTML = `<p class="note-chapter">${esc(D.chapters[stage()])}</p>`
      + `<ol class="note-list">${state.facts.map(id => `<li>${esc(D.facts[id])}</li>`).join('')}</ol>`
      + `<p class="note-tip">行き詰まったら、掲示板で「？」をつけて質問してみてください。常連さんが、進み具合に合わせて答えてくれます。</p>`
      + `<div class="note-foot"><span>スタンプ ${stampCount()}/12${state.stamps.includes('tsukimino') ? '＋1' : ''}</span><button type="button" id="note-reset" class="text-btn">記録を消して最初から</button></div>`;
    $('#note-reset').addEventListener('click', e => {
      if (Date.now() - resetArmed < 4000) {
        try { localStorage.removeItem(KEY); } catch (err) { /* noop */ }
        location.hash = '#/';
        location.reload();
        return;
      }
      resetArmed = Date.now();
      e.currentTarget.textContent = 'もう一度押すと、すべて消えます';
    });
  }
  function toggleNote(force) {
    const panel = $('#note-panel');
    const open = force === undefined ? panel.hidden : force;
    panel.hidden = !open;
    $('#note-btn').setAttribute('aria-expanded', String(open));
    if (open) renderNote();
  }
  $('#note-btn').addEventListener('click', e => { e.stopPropagation(); toggleNote(); });
  document.addEventListener('click', e => {
    const panel = $('#note-panel');
    if (!panel.hidden && !panel.contains(e.target) && e.target.id !== 'note-btn') toggleNote(false);
  });

  /* ---------- モーダル ---------- */
  let modalClose = null;
  function modal(html, cls = '', onClose = null) {
    const m = $('#modal');
    $('#modal-body').innerHTML = html;
    m.className = 'modal' + (cls ? ' ' + cls : '');
    m.hidden = false;
    modalClose = onClose;
    $('#modal-x').focus({ preventScroll: true });
    return $('#modal-body');
  }
  function closeModal() {
    const m = $('#modal');
    if (m.hidden) return;
    m.hidden = true;
    $('#modal-body').innerHTML = '';
    const cb = modalClose;
    modalClose = null;
    if (cb) cb();
  }
  $('#modal-x').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeModal();
    toggleNote(false);
  });

  /* ---------- 駅とスタンプ ---------- */
  const station = id => (id === 'tsukimino' ? D.tsukimino : D.stations.find(s => s.id === id));
  const hasStamp = id => state.stamps.includes(id);
  const stampCount = () => state.stamps.filter(id => id !== 'tsukimino').length;
  function addStamp(id) {
    if (hasStamp(id)) { toast('スタンプ帳', 'このスタンプは、もう押してあります。'); return false; }
    state.stamps.push(id);
    save();
    const st = station(id);
    if (id === 'tsukimino') toast('13番目のスタンプ', '月見野駅のスタンプを押しました。');
    else toast('スタンプを押しました', `${esc(st.name)}駅（${stampCount()}/12）`);
    if (id !== 'tsukimino' && stampCount() === 12) setTimeout(() => toast('12駅のスタンプがそろいました', 'スタンプ帳で、ひとつずつ大きくして見てみましょう。'), 900);
    renderNote();
    return true;
  }

  /* ---------- 画面の切り替え ---------- */
  const routes = {};
  const leave = {};
  let currentView = null;
  const views = { site: '#v-site', old: '#v-old', tms: '#v-tms', end: '#v-end' };
  function showView(name) {
    if (currentView === name) return;
    if (currentView && leave[currentView]) leave[currentView]();
    for (const [k, sel] of Object.entries(views)) $(sel).hidden = k !== name;
    currentView = name;
    document.body.dataset.view = name;
  }
  function dispatch() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const head = parts[0] || '';
    const view = ['old', 'tms', 'end'].includes(head) ? head : 'site';
    closeModal();
    toggleNote(false);
    showView(view);
    (routes[head] || routes[''])(parts.slice(1));
    if (view === 'site') {
      $$('#gnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + head));
      scrollTo(0, 0);
    }
    if (window.K.afterRoute) window.K.afterRoute(head, view, parts.slice(1));
  }
  const page = html => { const p = $('#page'); p.innerHTML = html; return p; };

  function boot() {
    fact('missing', true);
    renderNote();
    addEventListener('hashchange', dispatch);
    dispatch();
  }

  window.K = {
    hintLeft, fmtLeft,
    D, $, $$, esc, pad, reduced, state, save, stage, toKata, norm, ymd, hm,
    toast, fact, renderNote, modal, closeModal, station, hasStamp, stampCount, addStamp,
    routes, leave, page, dispatch, boot, go: h => { location.hash = h; }
  };
})();
