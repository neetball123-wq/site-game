/* NEMURE — 公式サイト側の描画と、夢の欠片のしくみ */
(() => {
  'use strict';
  const S = window.STORY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
  const KEY = 'nemure.v1';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = n => String(n).padStart(2, '0');
  const ymd = (d = new Date(), sep = '.') => `${d.getFullYear()}${sep}${pad(d.getMonth() + 1)}${sep}${pad(d.getDate())}`;
  // 深夜0〜4時は「25時表記」にする
  const clock25 = (d = new Date()) => { const h = d.getHours(); return `${pad(h < 5 ? h + 24 : h)}:${pad(d.getMinutes())}`; };

  /* ---------- 観測記録（この端末だけに保存） ---------- */
  const defaults = { frags: [], unlocked: false, restored: false, ending: null, endedAt: null, endVisit: 0, visits: 0, observer: '', fails: 0, night: null };
  const state = (() => {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { ...defaults }; }
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 保存できなくても遊べる */ } };
  if (!state.observer) state.observer = Math.random().toString(36).slice(2, 7);
  state.visits += 1;
  save();

  const members = () => (state.ending === 'awake' ? [...S.members, S.mioAwake] : S.members);
  const memberById = id => [...S.members, S.mioAwake].find(m => m.id === id);
  const firstName = m => m.name.split(' ')[1];

  /* ---------- シルエットの似顔絵 ---------- */
  const ORN = {
    moon: {
      back: '<path d="M33 66C29 30 91 30 87 66L86 84H34Z"/>',
      front: '<path d="M80 33a9 9 0 1 0 7 13a7 7 0 1 1-7-13z" fill="#F6E7A8"/>'
    },
    sheep: {
      back: '<circle cx="40" cy="44" r="10"/><circle cx="52" cy="36" r="10"/><circle cx="68" cy="36" r="10"/><circle cx="80" cy="44" r="10"/>',
      front: '<path d="M35 50c-10-2-12 12-2 12M85 50c10-2 12 12 2 12" fill="none" stroke="#F4E6C8" stroke-width="3" stroke-linecap="round"/>'
    },
    bell: {
      back: '<path d="M38 48C22 58 20 86 28 104C36 88 40 72 42 60Z"/><path d="M82 48C98 58 100 86 92 104C84 88 80 72 78 60Z"/>',
      front: '<circle cx="60" cy="91" r="5" fill="#F3D27A"/><path d="M57 93h6" stroke="#8A6A1F" stroke-width="1"/>'
    },
    ribbon: {
      back: '<path d="M34 60C30 30 90 30 86 60L92 112H28Z"/>',
      front: '<path d="M60 33L44 24L45 40ZM60 33L76 24L75 40Z" fill="#F7E0B5"/><circle cx="60" cy="33" r="3.5" fill="#F7E0B5"/>'
    },
    long: {
      back: '<path d="M33 62C29 28 91 28 87 62L96 124H24Z"/>',
      front: '<path d="M36 53C40 36 80 36 84 53L80 51L74 56L66 50L58 56L50 50L42 56Z"/><path d="M42 98q2 5 0 8q-2-3 0-8zM77 104q2 5 0 8q-2-3 0-8z" fill="#9FB3E0"/>'
    }
  };
  let pid = 0;
  function portrait(m, opts = {}) {
    const id = 'p' + (++pid);
    const o = ORN[m.ornament] || {};
    const pupil = opts.blank ? 'var(--eye-white)' : m.color;
    const eye = x => `<g class="eye"><ellipse cx="${x}" cy="60" rx="4" ry="5" fill="var(--eye-white)"/><circle class="pupil" cx="${x}" cy="60.5" r="2.3" fill="${pupil}"/></g>`;
    return `<svg class="portrait${opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 120 120" role="img" aria-label="${esc(m.name)}">`
      + `<defs><radialGradient id="${id}g" cx="50%" cy="38%" r="62%"><stop offset="0" stop-color="${m.glow}"/><stop offset="1" stop-color="${m.color}"/></radialGradient>`
      + `<clipPath id="${id}c"><circle cx="60" cy="60" r="56"/></clipPath></defs>`
      + (opts.ghost ? '' : `<circle cx="60" cy="60" r="56" fill="url(#${id}g)"/>`
        + `<g clip-path="url(#${id}c)" fill="var(--silhouette)">${o.back || ''}<path d="M14 124C18 94 38 88 60 88C82 88 102 94 106 124Z"/><circle cx="60" cy="58" r="24"/>${o.front || ''}</g>`)
      + `<g class="lids">${eye(51)}${eye(69)}</g></svg>`;
  }

  // 目がカーソルを追う
  let portraits = [];
  let px = innerWidth / 2, py = innerHeight / 3, eyeQueued = false;
  const refreshEyes = () => { portraits = $$('.portrait'); updateEyes(); };
  function updateEyes() {
    eyeQueued = false;
    for (const svg of portraits) {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || !r.width) continue;
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      const tx = (dx / d) * 1.7 * k, ty = (dy / d) * 1.5 * k;
      svg.querySelectorAll('.pupil').forEach(p => p.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`));
    }
  }
  addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    if (!eyeQueued) { eyeQueued = true; requestAnimationFrame(updateEyes); }
  }, { passive: true });
  if (!reduced) {
    setInterval(() => {
      const live = portraits.filter(p => p.isConnected);
      const p = live[Math.floor(Math.random() * live.length)];
      if (!p) return;
      p.classList.add('blink');
      setTimeout(() => p.classList.remove('blink'), 220);
    }, 900);
  }

  /* ---------- 夜空 ---------- */
  const sky = (() => {
    const c = $('#sky'), ctx = c.getContext('2d');
    let w = 0, h = 0, stars = [], night = false, raf = 0, inView = true;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 4200);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.85, r: Math.random() * 1.2 + 0.3,
        p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.4, eye: Math.random() < 0.1
      }));
      draw(performance.now());
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const rect = c.getBoundingClientRect(), mx = px - rect.left, my = py - rect.top;
      for (const s of stars) {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((t / 1000) * s.s + s.p));
        if (night && s.eye) {
          const open = Math.min(1, Math.abs(Math.sin((t / 1000) * 0.3 + s.p)) * 4);
          const rx = 4 + s.r * 2, ry = Math.max(0.3, (2 + s.r) * open);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#EDE6FF';
          ctx.beginPath(); ctx.ellipse(s.x, s.y, rx, ry, 0, 0, 6.29); ctx.fill();
          const dx = mx - s.x, dy = my - s.y, d = Math.hypot(dx, dy) || 1;
          ctx.fillStyle = '#6F86B8';
          ctx.beginPath(); ctx.arc(s.x + (dx / d) * rx * 0.4, s.y + (dy / d) * ry * 0.3, Math.min(ry, 1.4 + s.r * 0.8), 0, 6.29); ctx.fill();
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = '#F4EEFF';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function run() {
      cancelAnimationFrame(raf);
      if (!reduced && inView && !document.hidden) raf = requestAnimationFrame(loop);
    }
    new ResizeObserver(resize).observe(c);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; run(); }).observe(c);
    document.addEventListener('visibilitychange', run);
    return { setNight(v) { night = v; draw(performance.now()); } };
  })();

  /* ---------- オルゴール（きらきら星・パブリックドメイン） ---------- */
  const music = (() => {
    const TUNE = [0, 0, 7, 7, 9, 9, 7, null, 5, 5, 4, 4, 2, 2, 0, null, 7, 7, 5, 5, 4, 4, 2, null, 7, 7, 5, 5, 4, 4, 2, null];
    let ac = null, out = null, timer = 0, nextT = 0, idx = 0, on = false, night = false;
    const beat = () => (night ? 0.64 : 0.44);
    function note(semi, t) {
      if (night && Math.random() < 0.14) semi -= 1; // 夜はときどき音を外す
      const f = 523.25 * Math.pow(2, semi / 12) * (night ? 0.94 : 1);
      [[1, 0.22, 1.9], [2.01, 0.06, 0.8], [3.98, 0.025, 0.35]].forEach(([mul, peak, len]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f * mul;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(out);
        o.start(t); o.stop(t + len + 0.05);
      });
    }
    function tick() {
      while (nextT < ac.currentTime + 0.3) {
        const s = TUNE[idx % TUNE.length];
        if (s !== null) note(s, nextT);
        nextT += beat();
        idx++;
      }
    }
    function start() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ac) {
        ac = new AC();
        out = ac.createGain(); out.gain.value = 0.5;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
        out.connect(lp).connect(ac.destination);
      }
      ac.resume();
      nextT = ac.currentTime + 0.1;
      timer = setInterval(tick, 90);
      return (on = true);
    }
    function stop() { clearInterval(timer); on = false; }
    return { toggle() { return on ? (stop(), false) : start(); }, setNight(v) { night = v; }, stop, get on() { return on; } };
  })();

  /* ---------- 演出ユーティリティ ---------- */
  (function makeNoise() {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d'), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    $('#noise').style.backgroundImage = `url(${c.toDataURL()})`;
  })();
  function glitch(ms = 800) {
    document.body.classList.add('glitching');
    clearTimeout(glitch.t);
    glitch.t = setTimeout(() => document.body.classList.remove('glitching'), reduced ? 150 : ms);
  }
  function flash(dark) {
    const f = $('#flash');
    f.classList.toggle('dark', !!dark);
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  }
  function typeInto(node, text, done, speed = 55) {
    if (reduced) { node.textContent = text; if (done) done(); return; }
    let i = 0;
    const t = setInterval(() => {
      node.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(t); if (done) done(); }
    }, speed);
  }

  // ささやき（画面下のメッセージ）。順番に表示する
  const wq = [];
  let wBusy = false, wTimer = 0;
  function whisper(text, ms = 6500, from = '？？？') { wq.push([text, ms, from]); if (!wBusy) nextWhisper(); }
  function nextWhisper() {
    clearTimeout(wTimer);
    const el = $('#whisper'), item = wq.shift();
    if (!item) { wBusy = false; el.hidden = true; return; }
    wBusy = true;
    const [text, ms, from] = item;
    el.hidden = false;
    el.innerHTML = `<b>${esc(from)}</b><span></span>`;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    typeInto(el.querySelector('span'), text, () => { wTimer = setTimeout(nextWhisper, ms); });
  }
  $('#whisper').addEventListener('click', nextWhisper);

  /* ---------- 夢の欠片 ---------- */
  function collect(id, customWhisper) {
    if (state.ending || state.frags.includes(id)) return;
    state.frags.push(id);
    state.idle = 0;
    save();
    renderFrags(true);
    whisper(customWhisper || S.whispers[id]);
    if (state.frags.length === 5) whisper(S.whispers.all, 9000);
  }
  /* 考えている時間：新しい欠片が見つからないまま2分たつと、残りの欠片の手がかりが浮かぶ
     （画面が見えているあいだだけ数える） */
  const IDLE_HINT = 2 * 60000;
  setInterval(() => {
    if (document.visibilityState !== 'visible' || state.ending) return;
    const before = (state.idle || 0) >= IDLE_HINT;
    state.idle = (state.idle || 0) + 5000;
    state.playMs = (state.playMs || 0) + 5000;
    save();
    if (state.frags.length && ((state.idle >= IDLE_HINT) !== before || !$('#frag-panel').hidden)) renderFrags(false);
  }, 5000);
  function renderFrags(pulse) {
    const pill = $('#frag-pill'), n = state.frags.length;
    pill.hidden = n === 0 || !!state.ending;
    if (pill.hidden) { $('#frag-panel').hidden = true; return; }
    const entries = Object.entries(S.fragments).sort((a, b) => a[1].no - b[1].no);
    $('#frag-gems').innerHTML = entries.map(([id]) => `<i class="${state.frags.includes(id) ? 'on' : ''}"></i>`).join('');
    $('#frag-count').textContent = `夢の欠片 ${n}/5`;
    $('#frag-list').innerHTML = entries.map(([id, f]) => (state.frags.includes(id)
      ? `<li><span class="no">${ROMAN[f.no]}</span><span class="sym">${f.sym}</span><span class="ln">${esc(f.line)}</span></li>`
      : `<li class="missing"><span class="no">${ROMAN[f.no]}</span><span class="sym">？</span><span class="ln">……${(state.idle || 0) >= IDLE_HINT ? esc(f.hint) : 'まだ、ぼんやりしている。'}</span></li>`)).join('')
      + ((state.idle || 0) >= IDLE_HINT || n === 5 ? '' : `<li class="missing"><span class="ln" style="opacity:.7">（思い出せないまま しばらくたつと、欠片の手がかりが 浮かんできます。あと ${Math.ceil((IDLE_HINT - (state.idle || 0)) / 60000)}分）</span></li>`);
    $('#frag-door').innerHTML = n === 5
      ? '<p class="ln">欠片の番号どおりに、扉の鍵をあけて。</p><a href="#/staff">扉をひらく</a>'
      : '<p class="hint">欠片の番号は、扉をあける順番。</p>';
    if (pulse) { pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse'); }
  }
  $('#frag-pill').addEventListener('click', e => {
    e.stopPropagation();
    const panel = $('#frag-panel');
    panel.hidden = !panel.hidden;
    $('#frag-pill').setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.addEventListener('click', e => {
    const panel = $('#frag-panel');
    if (!panel.hidden && !panel.contains(e.target)) { panel.hidden = true; $('#frag-pill').setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- 公式サイトの各セクション ---------- */
  function renderLineup() {
    let html = members().map(m => `<li>${portrait(m)}<span>${m.roman.split(' ')[1]}</span></li>`).join('');
    if (state.ending === 'asleep') html += `<li class="ghost" aria-hidden="true">${portrait(S.mioCorrupt, { ghost: true })}<span>&nbsp;</span></li>`;
    $('#hero-lineup').innerHTML = html;
    $('#about-count').textContent = state.ending === 'awake' ? '5人組' : '4人組';
  }

  function newsItems() {
    const list = [...S.news];
    if (state.ending === 'awake') list.unshift({ ...S.newsAwake, date: ymd(new Date(state.endedAt || Date.now())) });
    return list;
  }
  function renderNews() {
    $('#news-list').innerHTML = newsItems().map((n, i) =>
      `<li><a href="#/news/${n.id}"${i === 0 ? ' class="is-new"' : ''}><time class="news-date">${n.date}</time><span class="chip ${n.cat}">${n.label}</span><span class="news-title">${esc(n.title)}</span></a></li>`).join('');
  }
  function openNews(id) {
    const n = newsItems().find(x => x.id === id);
    if (!n) { closeNews(); return; }
    $('#news-modal-meta').innerHTML = `<time>${n.date}</time><span class="chip ${n.cat}">${n.label}</span>`;
    $('#news-modal-title').textContent = n.title;
    $('#news-modal-body').innerHTML = n.body;
    const modal = $('#news-modal');
    if (modal.hidden) { modal.hidden = false; $('#news-close').focus({ preventScroll: true }); }
  }
  function closeNews() { $('#news-modal').hidden = true; }
  $('#news-close').addEventListener('click', () => { location.hash = '#news'; });
  $('#news-modal').addEventListener('click', e => { if (e.target.id === 'news-modal') location.hash = '#news'; });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#news-modal').hidden) location.hash = '#news';
    $('#frag-panel').hidden = true;
  });
  // お知らせの「白いところ」を選択すると読める
  let selT = 0;
  document.addEventListener('selectionchange', () => {
    const blank = $('#blank-msg');
    if (!blank || $('#news-modal').hidden) return;
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.containsNode(blank, true)) return;
    clearTimeout(selT);
    selT = setTimeout(() => collect('f_news'), 700);
  });

  let currentMember = 'luu';
  function renderMemberTabs() {
    const list = members();
    let tabs = list.map(m => `<button class="member-tab" role="tab" type="button" data-id="${m.id}" style="--m:${m.color}" aria-selected="${m.id === currentMember}">${m.roman}</button>`).join('');
    let dots = list.map(m => `<button type="button" data-id="${m.id}" style="--m:${m.color}" aria-label="${esc(m.name)}"${m.id === currentMember ? ' aria-current="true"' : ''}></button>`).join('');
    if (state.ending !== 'awake') {
      tabs += `<button class="member-tab empty" role="tab" type="button" data-id="mio" aria-selected="${currentMember === 'mio'}" aria-label="空席">？？？</button>`;
      dots += `<button type="button" class="hollow" data-id="mio" aria-label="空席"${currentMember === 'mio' ? ' aria-current="true"' : ''}></button>`;
    }
    $('#member-tabs').innerHTML = tabs;
    $('#member-dots').innerHTML = dots;
  }
  function showMember(id) {
    currentMember = id;
    const corrupt = id === 'mio' && state.ending !== 'awake';
    const m = corrupt ? S.mioCorrupt : memberById(id);
    const card = $('#member-card');
    card.className = 'member-card' + (corrupt ? ' corrupt' : '');
    card.style.setProperty('--m', m.color);
    card.innerHTML = `${portrait(m, { blank: corrupt })}<div class="m-info">`
      + `<h3 class="m-name">${esc(m.name)}</h3><p class="m-roman">${esc(m.roman)}</p><p class="m-catch">${esc(m.catch)}</p>`
      + `<dl class="m-stats">${m.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
      + `<p class="m-bio">${esc(m.bio)}</p><p class="m-dream"><b>${corrupt ? '夢日記 #0707' : '夢日記'}</b>${esc(m.dream)}</p></div>`;
    renderMemberTabs();
    refreshEyes();
    if (corrupt) { glitch(900); collect('f_member'); }
  }
  const onPick = e => { const b = e.target.closest('button[data-id]'); if (b) showMember(b.dataset.id); };
  $('#member-tabs').addEventListener('click', onPick);
  $('#member-dots').addEventListener('click', onPick);

  function renderSchedule() {
    const now = new Date(), base = new Date(now);
    if (now.getHours() < 5) base.setDate(base.getDate() - 1); // 深夜は前日の25時枠
    const W = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      let slot = S.schedule[d.getDay()];
      if (d.getDay() === 5 && state.ending === 'awake') slot = S.scheduleMio;
      const empty = !slot.title;
      html += `<li class="${i === 0 ? 'today' : ''}${empty ? ' void' : ''}">`
        + `<span class="d">${pad(d.getMonth() + 1)}.${pad(d.getDate())}<small>${W[d.getDay()]}</small></span><span class="t">25:00</span>`
        + `<span class="ttl">${empty ? '――――' : esc(slot.title)}</span>`
        + `<span class="who">${slot.who.map(id => { const m = memberById(id); return `<i style="--m:${m.color}">${esc(firstName(m))}</i>`; }).join('')}</span></li>`;
    }
    $('#sched').innerHTML = html;
  }

  function renderLetterTo() {
    $('#letter-to').innerHTML = members().map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('') + '<option value="all">みんなへ</option>';
  }
  $('#letter-form').addEventListener('submit', e => {
    e.preventDefault();
    const to = $('#letter-to').value, body = $('#letter-body').value;
    const text = (body + ' ' + $('#letter-name').value).toLowerCase();
    const reply = $('#letter-reply');
    const called = S.mioNames.some(n => text.includes(n.toLowerCase()));
    $('#letter-body').value = '';
    if (called && state.ending !== 'awake') {
      reply.hidden = true;
      glitch(1300);
      setTimeout(() => {
        reply.className = 'letter-reply dark';
        reply.innerHTML = '<b>FROM ？？？</b><span></span>';
        reply.hidden = false;
        typeInto(reply.querySelector('span'), 'この手紙は、わたしがもらうね。……ずっと、呼んでほしかった。');
        collect('f_letter');
      }, 1300);
      return;
    }
    const m = memberById(to);
    const msg = to === 'mio' ? 'わたしにも手紙をくれるんだ。……うれしい。枕の下に入れて眠るね。' : S.letterReplies[to];
    reply.className = 'letter-reply';
    reply.innerHTML = `<b>FROM ${m ? esc(m.roman.split(' ')[1]) : 'NEMURE'}</b>${esc(msg)}`;
    reply.hidden = false;
  });

  /* ---------- おやすみモード・時計 ---------- */
  function setNight(on) {
    document.body.classList.toggle('is-night', on);
    const b = $('#btn-night');
    b.setAttribute('aria-pressed', String(on));
    b.title = on ? 'おはようモードに戻す' : 'おやすみモード';
    $('#secret-night').tabIndex = on ? 0 : -1;
    sky.setNight(on);
    music.setNight(on);
  }
  $('#btn-night').addEventListener('click', () => {
    const on = !document.body.classList.contains('is-night');
    state.night = on; save();
    if (on) flash(true);
    setNight(on);
  });
  const secret = $('#secret-night');
  secret.addEventListener('click', () => collect('f_night'));
  secret.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect('f_night'); } });
  $('#btn-music').addEventListener('click', () => { $('#btn-music').setAttribute('aria-pressed', String(music.toggle())); });
  const tickClock = () => { $('#clock').textContent = clock25(); };
  tickClock(); setInterval(tickClock, 10000);

  /* ---------- よそ見と放置（欠片Ⅱ） ---------- */
  const baseTitle = document.title;
  let hiddenAt = 0, lastActive = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      document.title = state.ending === 'asleep' ? '25:00' : '……いかないで';
      return;
    }
    document.title = baseTitle;
    if (Date.now() - hiddenAt < 1500 || NM.view !== 'site') return;
    if (state.ending === 'asleep') whisper(S.whispers.asleepReturn);
    else collect('f_leave');
  });
  ['pointerdown', 'keydown', 'scroll', 'pointermove'].forEach(ev => addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (NM.view === 'site' && !document.hidden && Date.now() - lastActive > 45000) {
      lastActive = Date.now();
      collect('f_leave', '……うごかないね。寝ちゃった？ ひつじ、数えてあげる。……Ⅱは、羊。');
    }
  }, 5000);

  /* ---------- リセット（2回押し） ---------- */
  let resetArmed = 0;
  $('#btn-reset').addEventListener('click', e => {
    const b = e.currentTarget;
    if (Date.now() - resetArmed < 4000) {
      try { localStorage.removeItem(KEY); } catch (err) { /* noop */ }
      location.hash = '';
      location.reload();
      return;
    }
    resetArmed = Date.now();
    b.textContent = 'もう一度押すと、すべて忘れます';
    setTimeout(() => { b.textContent = '観測記録をリセット'; }, 4000);
  });

  /* ---------- 画面の切り替え ---------- */
  const views = { site: $('#view-site'), staff: $('#view-staff'), admin: $('#view-admin'), wake: $('#view-wake') };
  const hooks = {};
  function show(name) {
    const prev = NM.view;
    for (const [k, el] of Object.entries(views)) el.hidden = k !== name;
    NM.view = name;
    document.body.dataset.view = name;
    if (prev !== name && hooks['leave_' + prev]) hooks['leave_' + prev]();
    if (prev !== name && hooks[name]) hooks[name]();
    return prev !== name;
  }
  function route() {
    const h = location.hash;
    if (h.startsWith('#/staff')) { if (show('staff')) scrollTo(0, 0); return; }
    if (h.startsWith('#/admin')) {
      if (!state.unlocked) { location.replace('#/staff'); return; }
      if (show('admin')) scrollTo(0, 0);
      return;
    }
    if (h.startsWith('#/wake')) {
      if (!state.restored) { location.replace('#/admin'); return; }
      show('wake');
      return;
    }
    const prev = NM.view;
    const changed = show('site');
    const m = h.match(/^#\/news\/(\w+)/);
    if (m) openNews(m[1]); else closeNews();
    if (changed && prev && !h.startsWith('#/')) {
      const target = h.length > 1 ? document.getElementById(h.slice(1)) : null;
      (target || $('#top')).scrollIntoView();
    }
  }
  addEventListener('hashchange', route);

  function rerender() {
    renderLineup();
    renderNews();
    renderSchedule();
    renderLetterTo();
    showMember(currentMember === 'mio' && state.ending !== 'awake' ? 'luu' : currentMember);
    renderFrags(false);
    refreshEyes();
  }

  function boot() {
    rerender();
    const h = new Date().getHours();
    const late = h < 5;
    setNight(state.night === null ? late : state.night);
    NM.view = null;
    route();
    if (!location.hash.startsWith('#/')) {
      if (state.ending && state.visits > state.endVisit) whisper(state.ending === 'awake' ? S.whispers.awakeReturn : S.whispers.asleepReturn);
      else if (late && !state.ending) setTimeout(() => whisper(S.whispers.lateNight), 2500);
    }
    console.log('%cNEMURE', 'font:28px Georgia,serif;letter-spacing:.2em;color:#7E6AD0');
    console.log('%c夢見坂プロダクション 開発者各位：本サイトのソースは関係者以外閲覧禁止です。', 'color:#888');
    console.log('%c……ねえ、そこから見えてる？ 欠片は5つ。わたしの名前は、みお。', 'color:#6F86B8;font-size:14px');
  }

  const NM = window.NM = {
    S, state, save, $, $$, esc, pad, ymd, clock25, reduced, ROMAN,
    glitch, flash, whisper, typeInto, collect, rerender, route, hooks, music, setNight, boot, view: null
  };
})();
