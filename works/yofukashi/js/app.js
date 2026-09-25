/* =========================================================
   深夜ラジオの投稿職人 — 進行と道具
   ========================================================= */
(() => {
  'use strict';
  const D = window.YD;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const KEY = 'yofukashi.v1';
  const FLAT = /[?&]flat\b/.test(location.search);
  const EXTRAS = ['stamp', 'stamps', 'mori', 'pocket', 'dial', 'talkback', 'mic'];
  const HINT_MIN = [2, 5, 8];

  const fresh = () => ({ v: 1, playMs: 0, intro: false, stage: 0, phase: 'intro', done: {}, stageMs: {}, peek: {}, peeled: {}, found: {}, circled: [],
    heard: {}, env: { to: '', name: '' }, tb: 0, mute: false, ended: false, tab: 'rundown', noteTab: 'front' });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) st = Object.assign(fresh(), r); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }

  const U = { sayGen: 0, capNext: null, capSkip: null, capT: 0, tape: { side: 'A', pos: 0, mode: 'stop' }, radio: false, dial: 900, lcdI: 0, lcdT: 0, view: {}, busy: false };
  const CARD = {}; D.CARDS.forEach((c) => { CARD[c.id] = c; });
  const stage = () => D.STAGES[Math.min(st.stage, D.STAGES.length - 1)];
  const working = (id) => !st.ended && st.phase === 'work' && stage().id === id;

  /* =========================================================
     字幕（放送・トークバック・電話）
     ========================================================= */
  const WHO = { T: 'ON AIR　辻本コウ', Tb: 'トークバック　辻本コウ', D: 'トークバック　佐伯ディレクター', M: '電話　森さん', N: '', E: 'メール' };
  const HOSTFX = ['talk', 'read', 'laugh', 'still', 'moved', 'listen', 'bow'];
  function showLine(who, text, fx) {
    const cap = $('#cap'); cap.hidden = false; cap.className = 'cap w-' + who;
    $('#cap-who').textContent = WHO[who] || ''; $('#cap-t').textContent = text;
    if (HOSTFX.includes(fx)) BB.set({ host: fx });
    else if (who === 'Tb') BB.set({ host: 'still' });
    if (fx === 'pips') { YA.pips(); setTimeout(() => setOnair(true), 3000); }
    if (fx === 'jingle') { YA.jingle(); YA.bed(true); }
    if (fx === 'phone') { YA.ring(true); setTimeout(() => YA.ring(false), 4200); }
    if (fx === 'song') { YA.bed(false); YA.sfx('needle'); setTimeout(() => YA.song({ vol: 0.85 }), 900); }
    if (fx === 'bow') BB.set({ phones: false });
    if (fx === 'offair') { YA.pips(); YA.bed(false); setTimeout(() => setOnair(false), 3000); }
    if (who === 'M' || who === 'D' || who === 'Tb') YA.sfx('talk');
  }
  function say(lines) {
    const g = ++U.sayGen;
    return new Promise((res) => {
      let i = 0;
      const next = () => {
        if (g !== U.sayGen) { res(); return; }
        clearTimeout(U.capT);
        if (i >= lines.length) { $('#cap').hidden = true; U.capNext = null; U.capSkip = null; res(); return; }
        const [who, text, fx] = lines[i++];
        showLine(who, text, fx);
        U.capT = setTimeout(next, Math.max(2800, text.length * 115 + 1500));
      };
      U.capNext = next;
      U.capSkip = () => { i = lines.length; next(); };
      next();
    });
  }
  function sayOne(line) { if (U.busy) return; say([line]); }
  $('#cap-next').addEventListener('click', () => U.capNext && U.capNext());
  $('#cap-skip').addEventListener('click', () => U.capSkip && U.capSkip());
  $('#cap-t').addEventListener('click', () => U.capNext && U.capNext());

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function find(k) {
    if (st.found[k]) return; st.found[k] = Date.now(); save();
  }

  /* =========================================================
     壁の時計・ランプ
     ========================================================= */
  function buildClock() {
    let s = '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="#0a0a0c" stroke="#333" stroke-width="3"/>';
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 - Math.PI / 2; s += `<circle class="sd" cx="${(60 + Math.cos(a) * 48).toFixed(1)}" cy="${(60 + Math.sin(a) * 48).toFixed(1)}" r="${i % 5 ? 2.2 : 3.2}" fill="#3a1210"/>`; }
    s += '<text id="sc-t" x="60" y="68" text-anchor="middle" font-family="Share Tech Mono, monospace" font-size="24" fill="#ff3b2a">25:00</text></svg>';
    $('#sclock').innerHTML = s;
  }
  function tickClock() {
    const sec = new Date().getSeconds(); $$('#sclock .sd').forEach((c, i) => c.setAttribute('fill', i <= sec ? '#ff3b2a' : '#3a1210'));
  }
  function setClock(t) { const e = $('#sc-t'); if (e) e.textContent = t; BB.set({ clock: t }); }
  function setOnair(on) { $('#onair').classList.toggle('on', !!on); BB.set({ onair: !!on }); }

  /* =========================================================
     ハガキの絵
     ========================================================= */
  function pmSVG(pm) {
    const ink = '#2a2a3a';
    if (pm.t === 'fuukei') {
      return `<svg viewBox="0 0 64 64"><g fill="none" stroke="#7a3226" stroke-width="1.6"><rect x="4" y="4" width="56" height="56" rx="10"/></g>
        <g fill="#7a3226"><path d="M29 16 L35 16 L37 40 L27 40 Z"/><rect x="28" y="12" width="8" height="4"/><path d="M14 44 Q32 38 50 44 L50 46 L14 46 Z"/></g>
        <text x="32" y="10.5" text-anchor="middle" font-size="7" fill="#7a3226" font-family="Zen Kaku Gothic New">${esc(pm.office)}</text>
        <text x="32" y="55" text-anchor="middle" font-size="7.4" fill="#7a3226" font-family="Share Tech Mono, monospace">${esc(pm.date)}</text></svg>`;
    }
    const smudge = pm.smudge;
    return `<svg viewBox="0 0 64 64"${smudge ? ' style="filter:blur(1.6px)"' : ''}><g fill="none" stroke="${ink}" stroke-width="1.6"><circle cx="32" cy="32" r="28"/><path d="M6 24 H58 M6 40 H58"/></g>
      <text x="32" y="19" text-anchor="middle" font-size="10" fill="${ink}" font-family="Zen Kaku Gothic New" font-weight="700">${esc(pm.office)}</text>
      <text x="32" y="36" text-anchor="middle" font-size="10.5" fill="${ink}" font-family="Share Tech Mono, monospace">${esc(pm.date)}${smudge ? '?' : ''}</text>
      <text x="32" y="52" text-anchor="middle" font-size="9" fill="${ink}" font-family="Share Tech Mono, monospace">${esc(pm.slot || '')}</text></svg>`;
  }
  function stampSVG(s) {
    const pic = {
      toudai: '<rect x="3" y="3" width="16" height="20" fill="#7fb6d8"/><rect x="3" y="17" width="16" height="6" fill="#2d5f8a"/><path d="M9.5 7 H12.5 L13.4 18 H8.6 Z" fill="#fff"/><rect x="9.2" y="5.4" width="3.6" height="2" fill="#c8372d"/><path d="M12.5 6.4 L19 4.5 L19 8 Z" fill="#fff6c8" opacity=".8"/>',
      kamome: '<rect x="3" y="3" width="16" height="20" fill="#cfe6f2"/><path d="M6 11 Q8.5 8.6 11 11 Q13.5 8.6 16 11" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M8 15 Q9.5 13.6 11 15 Q12.5 13.6 14 15" fill="none" stroke="#5a7a8a" stroke-width="1"/><rect x="3" y="19" width="16" height="4" fill="#6aa4c4"/>',
      sakura: '<rect x="3" y="3" width="16" height="20" fill="#fbeef0"/>' + [[8, 9], [14, 12], [9, 16]].map(([x, y]) => `<g fill="#f1a7b8"><circle cx="${x}" cy="${y - 1.6}" r="1.6"/><circle cx="${x + 1.6}" cy="${y}" r="1.6"/><circle cx="${x}" cy="${y + 1.6}" r="1.6"/><circle cx="${x - 1.6}" cy="${y}" r="1.6"/></g><circle cx="${x}" cy="${y}" r=".8" fill="#c8372d"/>`).join(''),
      yamabuki: '<rect x="3" y="3" width="16" height="20" fill="#dfe9d4"/><g fill="#f2c230"><circle cx="11" cy="9.6" r="2"/><circle cx="13.2" cy="11.8" r="2"/><circle cx="11" cy="14" r="2"/><circle cx="8.8" cy="11.8" r="2"/></g><circle cx="11" cy="11.8" r="1.1" fill="#b88a10"/><path d="M11 15 V21" stroke="#4a7a3a" stroke-width="1"/>',
    }[s.pic] || '';
    return `<svg viewBox="0 0 22 26"><rect x=".5" y=".5" width="21" height="25" fill="#fff" stroke="#ddd" stroke-dasharray="1.2 1"/>${pic}<text x="4" y="25" font-size="3.6" fill="#333" font-family="Share Tech Mono, monospace">${s.v}</text><text x="18" y="25" text-anchor="end" font-size="2.6" fill="#333" font-family="Zen Kaku Gothic New">郵便</text></svg>`;
  }
  const LEG = '<svg viewBox="0 0 40 40" class="pc-doodle"><path d="M14 4 Q12 16 16 24 Q18 30 12 34 L26 34 Q24 28 24 22 Q22 12 24 4" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round"/><path d="M28 14 l5 -3 M29 19 l6 0 M28 24 l5 3" stroke="#c8372d" stroke-width="1.4" stroke-linecap="round"/></svg>';
  // 文の途中の改行はつなげて、段落ごとに流しこむ（句読点のあとで折り返す）
  function paras(lines) {
    const out = []; let cur = '';
    lines.forEach((l) => {
      if (l === '') { if (cur) out.push(cur); out.push(''); cur = ''; return; }
      cur += l;
      if (/[。」】：）!！？]$/.test(l) || /^【/.test(l)) { out.push(cur); cur = ''; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function msgHTML(c) {
    const body = paras(c.body).map((l) => `<p>${esc(l)}</p>`).join('');
    return `<div class="pc-msg" style="font-family:${D.HANDS[c.hand]};color:${c.ink}">${body}<p class="pc-rn">RN　${esc(c.rn)}</p></div>${c.doodle === 'leg' ? LEG : ''}`;
  }
  function addrHTML(c, big) {
    const zip = '0001062'.split('').map((d) => `<i>${d}</i>`).join('');
    const to = D.TO.slice(1).map((l, i) => `<span${i === 2 ? ' class="sama"' : ''}>${esc(l)}</span>`).join('');
    let stp = '';
    if (c.stamp.kansei) stp = `<div class="kansei"><svg viewBox="0 0 22 26"><rect x="1" y="1" width="20" height="24" fill="none" stroke="#c8372d" stroke-width=".8"/><circle cx="11" cy="11" r="5" fill="none" stroke="#c8372d" stroke-width=".8"/><path d="M11 6 V16 M6 11 H16" stroke="#c8372d" stroke-width=".5"/><text x="11" y="23" text-anchor="middle" font-size="4" fill="#c8372d" font-family="Share Tech Mono, monospace">${c.stamp.v}</text></svg></div>`;
    else {
      const peeled = st.peeled[c.id];
      stp = `<button type="button" class="stp${c.stamp.inv ? ' inv' : ''}${peeled ? ' peeled' : ''}" data-peel="${c.id}" aria-label="切手"${big ? '' : ' tabindex="-1"'}>${peeled ? `<span class="under">${esc(c.stamp.under || '')}</span>` : ''}${stampSVG(c.stamp)}</button>`;
    }
    return `<div class="pc-addr" style="font-family:${D.HANDS[c.hand]};color:${c.ink}">
      <div class="zip">${zip}</div>${stp}<div class="pm">${pmSVG(c.pm)}</div>
      <div class="pc-to">${to}</div>
      <div class="pc-from"><span>${esc(c.from.addr)}</span><span>${esc(c.rn)}</span><span class="real">本名</span></div></div>`;
  }
  function cardHTML(c, side, big) {
    return `<div class="pc${c.copy ? ' copy' : ''}">${side === 'addr' ? addrHTML(c, big) : msgHTML(c)}${big && c.note && side !== 'addr' ? `<div class="pc-note">${esc(c.note)}</div>` : ''}</div>`;
  }
  function cardBtn(c) { return `<button type="button" class="cardbtn" data-card="${c.id}">${cardHTML(c, 'msg')}<span class="rnl">${esc(c.rn)}</span></button>`; }

  /* =========================================================
     机の上のもの
     ========================================================= */
  const ITEMS = [
    ['rundown', '進行表'], ['box', 'ハガキ箱'], ['hall', '殿堂ファイル'], ['deck', 'ラジカセ'], ['shelf', 'レコード棚'], ['ledger', '台帳'], ['note', '森ノート'],
  ];
  function hintLevel(id) { const ms = st.stageMs[id] || 0; return HINT_MIN.filter((m) => ms >= m * 60000).length; }
  function renderItems() {
    const cur = stage().id, lv = st.ended ? 0 : hintLevel(cur), seen = st.peek[cur] || 0;
    $('#items').innerHTML = ITEMS.map(([k, name]) => {
      const lock = k === 'ledger' && st.stage < 4 && !st.ended;
      const dot = (k === 'note' && lv > seen) || (k === 'ledger' && working('sticker')) || (k === 'box' && working('open')) || (k === 'shelf' && working('req'));
      return `<button type="button" class="item${U.tab === k ? ' on' : ''}${lock ? ' lock' : ''}" data-tab="${k}"><span class="ico ${k}"></span>${name}${dot ? '<span class="dot"></span>' : ''}</button>`;
    }).join('');
  }
  $('#items').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    YA.sfx('click'); if (U.tab === 'deck' && b.dataset.tab !== 'deck') stopDeck();
    U.tab = b.dataset.tab; st.tab = U.tab; save(); renderItems(); renderOpen();
  });
  function renderOpen() {
    const o = $('#open');
    const f = { rundown: vRundown, box: vBox, hall: vHall, deck: vDeck, shelf: vShelf, ledger: vLedger, note: vNote }[U.tab] || vRundown;
    o.innerHTML = f();
    if (U.tab === 'deck') deckAfter();
  }

  /* ---------- 進行表 ---------- */
  function vRundown() {
    const rows = D.STAGES.map((s, i) => {
      const cur = !st.ended && i === st.stage, done = st.done[s.id] || st.ended;
      const reached = i <= st.stage || st.ended;
      return `<tr class="${cur ? 'cur' : ''}${done ? ' done' : ''}"><td class="t">${s.time.replace(/:\d+$/, (m) => m)}</td><td class="c">${esc(s.title)}${cur ? `<span class="note">${esc(s.cue)}</span>` : reached ? '' : ''}</td></tr>`;
    }).join('') + `<tr class="${st.ended ? 'done' : ''}"><td class="t">27:00</td><td class="c">時報・放送終了</td></tr>`;
    let h = `<h2>進行表　よふかし通信（最終回）</h2><div class="clip"><table class="rd"><thead><tr><th>時刻</th><th>コーナー／メモ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if (st.stage >= 1 || st.ended) {
      const canEdit = working('rank');
      const circ = st.done.rank ? D.HER : st.circled;
      h += `<div class="sheet"><h3 style="margin-top:0">集計の紙　「いちばん好きなハガキ職人」（ラジオネームごと）</h3>
        <p class="lead">${canEdit ? '名前を押すと、赤ペンで丸をつける（もう一度押すと消す）。' : st.done.rank ? '丸をつけて、ブースに入れた。' : ''}</p>
        <ol class="votes">${D.VOTES.map(([n, v], i) => `<li><button type="button" data-vote="${esc(n)}" class="${circ.includes(n) ? 'on' : ''}"${canEdit ? '' : ' disabled'}><span class="n">${i + 1}</span><span class="rn">${esc(n)}</span><span class="num">${v}票</span></button></li>`).join('')}</ol>
        ${canEdit ? `<div class="row-act"><button type="button" class="btn hot" id="send-votes"${st.circled.length ? '' : ' disabled'}>この紙をブースへ</button><span class="msg">丸：${st.circled.length}つ</span></div>` : ''}</div>`;
    }
    h += `<div class="sheet"><h3 style="margin-top:0">番組のあゆみ</h3><p class="lead">パーソナリティ：辻本コウ（潮見市出身）／構成：森ハルエ（二〇〇三〜二〇二六年八月）</p><ul class="hist">${D.HISTORY.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul></div>`;
    return h;
  }
  $('#open').addEventListener('click', (e) => {
    const v = e.target.closest('[data-vote]');
    if (v && working('rank')) { const n = v.dataset.vote, i = st.circled.indexOf(n); if (i >= 0) st.circled.splice(i, 1); else st.circled.push(n); YA.sfx('pen'); save(); renderOpen(); return; }
    if (e.target.closest('#send-votes')) { submit('votes', st.circled.slice()); return; }
    const c = e.target.closest('[data-card]'); if (c) { openCard(c.dataset.card); return; }
    if (e.target.closest('#deep')) { find('pocket'); YA.sfx('card'); renderOpen(); return; }
    const sl = e.target.closest('[data-rec]'); if (sl) { openRecord(sl.dataset.rec); return; }
    const ch = e.target.closest('[data-env]'); if (ch && working('sticker')) { st.env[ch.dataset.env] = ch.dataset.v; YA.sfx('pen'); save(); renderOpen(); return; }
    if (e.target.closest('#send-env')) { submit('env', Object.assign({}, st.env)); return; }
    const nt = e.target.closest('[data-nt]'); if (nt) { st.noteTab = nt.dataset.nt; YA.sfx('page'); save(); renderOpen(); renderItems(); return; }
    deckClick(e);
  });

  /* ---------- ハガキ箱 ---------- */
  function vBox() {
    const cs = D.CARDS.filter((c) => c.box === 'tonight');
    return `<h2>ハガキ箱　今週のぶん（最終回）</h2><p class="lead">押すと大きく見られる。${working('open') ? '選んだハガキは「ブースへ」でツジモトさんにわたる。' : ''}</p><div class="cards">${cs.map(cardBtn).join('')}</div>`;
  }
  /* ---------- 殿堂ファイル ---------- */
  function vHall() {
    const cs = D.CARDS.filter((c) => c.box === 'hall'), yrs = [...new Set(cs.map((c) => c.ind))].sort((a, b) => a - b);
    const pk = D.CARDS.filter((c) => c.box === 'pocket' && (!c.deep || st.found.pocket));
    return `<h2>殿堂ファイル　二〇〇三 — 二〇二五</h2><p class="lead">年に一度、スタッフが選んだ名作ハガキ。見出しの年は「殿堂に入った年」。</p>
      <div class="binder">${yrs.map((y) => `<div class="yr">${y}年の殿堂</div><div class="cards">${cs.filter((c) => c.ind === y).map(cardBtn).join('')}</div>`).join('')}
      <div class="pocket"><h3>裏表紙のポケット</h3><div class="cards">${pk.map(cardBtn).join('')}</div>${st.found.pocket ? '' : '<button type="button" class="deep" id="deep">ポケットの奥を、指でさぐる</button>'}</div></div>`;
  }
  /* ---------- カードを見る ---------- */
  function openCard(id) {
    const c = CARD[id]; if (!c) return; YA.sfx('card');
    let side = 'msg';
    const draw = () => {
      const canHand = working('open');
      modal(`<div class="viewer">${cardHTML(c, side, true)}
        <div class="vbar"><button type="button" class="btn ghost" id="flip">${side === 'msg' ? '表（宛名の面）を見る' : '裏（文面）を見る'}</button>${canHand ? '<button type="button" class="btn hot" id="hand">このハガキをブースへ</button>' : ''}</div>
        ${side === 'addr' ? '<p class="vhint">本名には、番組の決まりでふせんが貼ってある。</p>' : ''}</div>`);
      $('#flip').onclick = () => { side = side === 'msg' ? 'addr' : 'msg'; YA.sfx('card'); draw(); };
      if ($('#hand')) $('#hand').onclick = () => { closeModal(); submit('card', id); };
      const p = $('[data-peel]', $('#modal'));
      if (p) p.onclick = () => peel(c, draw);
    };
    draw();
  }
  function peel(c, redrawFn) {
    if (st.peeled[c.id]) return;
    if (!c.stamp.inv) { toast('切手は、はがさないでおいた。'); return; }
    st.peeled[c.id] = 1; YA.sfx('peel'); save();
    const hers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'];
    if (hers.includes(c.id) || c.id === 't7') find('stamp');
    if (hers.every((k) => st.peeled[k])) find('stamps');
    redrawFn();
    setTimeout(() => toast(c.stamp.under ? `逆さの切手の下に、小さく「${c.stamp.under}」と書いてあった。` : '逆さの切手の下には、なにもなかった。'), 500);
  }

  /* ---------- レコード棚 ---------- */
  function sleeveSVG(r) {
    const [bg, fg, k] = r.art;
    const art = {
      snow: `<rect x="60" y="30" width="80" height="100" fill="#fff" opacity=".7"/><path d="M100 30 V130 M60 80 H140" stroke="${fg}" stroke-width="3"/>` + [...Array(22)].map((_, i) => `<circle cx="${(i * 37) % 200}" cy="${(i * 53) % 200}" r="${i % 3 ? 2 : 3.5}" fill="#fff"/>`).join(''),
      harbor: `<rect y="120" width="200" height="80" fill="#0e1628"/>` + [30, 70, 110, 150].map((x) => `<rect x="${x}" y="${80 + (x % 30)}" width="24" height="${40 - (x % 30)}" fill="#26324e"/><rect x="${x + 6}" y="${92 + (x % 30)}" width="6" height="5" fill="${fg}"/>`).join('') + `<circle cx="150" cy="50" r="18" fill="${fg}" opacity=".9"/>`,
      post: `<rect x="70" y="50" width="60" height="110" rx="8" fill="${fg}"/><rect x="80" y="70" width="40" height="8" fill="${bg}"/><text x="100" y="125" text-anchor="middle" font-size="28" fill="${bg}" font-weight="900">〒</text>`,
      sakura: [...Array(16)].map((_, i) => `<circle cx="${(i * 47) % 200}" cy="${(i * 29) % 200}" r="7" fill="#fff" opacity=".8"/>`).join('') + `<path d="M40 170 Q100 120 160 170" stroke="${fg}" stroke-width="4" fill="none"/>`,
      moon: `<circle cx="120" cy="70" r="30" fill="${fg}"/><circle cx="132" cy="62" r="28" fill="${bg}"/><path d="M0 150 L200 120 L200 200 L0 200 Z" fill="#1c2638"/><path d="M0 170 L200 140" stroke="#f2c94c" stroke-width="2" stroke-dasharray="10 8"/>`,
      lighthouse: `<rect y="130" width="200" height="70" fill="#2e7fa8"/><path d="M92 60 H108 L112 130 H88 Z" fill="${fg}"/><rect x="90" y="50" width="20" height="10" fill="#c8372d"/><path d="M110 55 L200 35 L200 70 Z" fill="#fff" opacity=".4"/>`,
      lamp: `<circle cx="100" cy="80" r="40" fill="${fg}" opacity=".25"/><rect x="97" y="80" width="6" height="100" fill="#111"/><rect x="88" y="70" width="24" height="12" fill="${fg}"/>` + [...Array(14)].map((_, i) => `<circle cx="${(i * 41) % 200}" cy="${(i * 31) % 140}" r="2.4" fill="#fff"/>`).join(''),
      choir: [40, 80, 120, 160].map((x) => `<circle cx="${x}" cy="100" r="14" fill="${fg}"/><rect x="${x - 16}" y="116" width="32" height="50" rx="10" fill="${fg}"/>`).join(''),
    }[k];
    return `<svg viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/>${art}<rect y="160" width="200" height="40" fill="rgba(0,0,0,.35)"/><text x="10" y="178" font-size="14" font-weight="700" fill="#fff" font-family="Zen Kaku Gothic New">${esc(r.a)}</text><text x="10" y="193" font-size="10" fill="#eee" font-family="Zen Kaku Gothic New">${esc(r.artist)}</text></svg>`;
  }
  function vShelf() {
    return `<h2>レコード棚</h2><p class="lead">番組でよくかけたシングル盤。ジャケットを押すと、裏も見られる。${working('req') ? '決めたら、そのまま針を落とす。' : ''}</p>
      <div class="shelf">${D.RECORDS.map((r) => `<button type="button" class="sleeve" data-rec="${r.id}"><span class="art">${sleeveSVG(r)}</span><b>${esc(r.a)}</b><small>${esc(r.artist)}</small></button>`).join('')}</div>`;
  }
  function openRecord(id) {
    const r = D.RECORDS.find((x) => x.id === id); YA.sfx('card');
    let back = false;
    const draw = () => {
      const live = working('req');
      modal(`<h2 style="margin:0 0 12px">${esc(r.a)}　<small style="font-weight:400;font-size:13px">${esc(r.artist)}</small></h2>
        <div class="sv">${back ? `<div class="back"><b>${esc(r.artist)}</b><dl><dt>A面</dt><dd>${esc(r.a)}</dd><dt>B面</dt><dd>${esc(r.b)}</dd><dt>発売</dt><dd>${esc(r.date)}</dd></dl><small style="color:#8a7a60">潮見レコード　EP盤　45回転</small></div>` : `<div class="art">${sleeveSVG(r)}</div>`}
        <div class="sv-act"><button type="button" class="btn ghost" id="sv-flip">${back ? 'ジャケットの表を見る' : 'ジャケットの裏を見る'}</button>
          <button type="button" class="btn${live ? ' hot' : ''}" data-play="A">A面をかける</button>
          <button type="button" class="btn${live ? ' hot' : ''}" data-play="B"${r.b === '（なし）' ? ' disabled' : ''}>B面をかける</button>
          <p class="vhint" style="text-align:left">${live ? '針を落とすと、そのまま電波にのる。' : 'いまは副調整室のスピーカーで、少しだけ試し聞き。'}</p></div></div>`);
      $('#sv-flip').onclick = () => { back = !back; YA.sfx('card'); draw(); };
      $$('[data-play]', $('#modal')).forEach((b) => { b.onclick = () => {
        const side = b.dataset.play;
        if (live) { closeModal(); submit('record', [r.id, side]); return; }
        YA.sfx('needle'); const isAns = r.id === D.ANSWER_RECORD[0] && side === D.ANSWER_RECORD[1];
        setTimeout(() => YA.song(isAns ? { bars: 2, vol: 0.6 } : { seed: r.id.charCodeAt(1) * 3 + (side === 'B' ? 7 : 1), bars: 2, vol: 0.6 }), 500);
      }; });
    };
    draw();
  }

  /* ---------- ラジカセ ---------- */
  function vDeck() {
    const t = U.tape;
    return `<h2>ラジカセ</h2><p class="lead">森さんのエアチェックのテープが入っている。ラジオも聞ける（ラジオを入れると、テープは止まる）。</p>
      <div class="rk" id="rk">
        <div class="rk-deck"><h3>カセット</h3>
          <div class="cas"><div class="cas-label">第1回　2003.4.8　エアチェック（森）<br>A面 25:00〜　／　B面 26:00〜</div><div class="cas-win"><span class="reel"></span><span class="reel"></span></div><span class="side" id="t-side">${t.side}</span></div>
          <span class="counter" id="t-cnt">${String(Math.floor(t.pos)).padStart(3, '0')}</span>
          <div class="keys"><button type="button" data-tk="rew" aria-label="まきもどし">◀◀</button><button type="button" data-tk="play" aria-label="再生">▶</button><button type="button" data-tk="stop" aria-label="停止">■</button><button type="button" data-tk="ff" aria-label="早送り">▶▶</button><button type="button" data-tk="flip" aria-label="裏返す">⏏ 裏返す</button></div>
        </div>
        <div class="rk-radio"><h3>ラジオ　AM</h3>
          <div class="scale"><div class="ticks"></div><div class="glow"></div><div class="needle" id="needle"></div><div class="nums"><span>530</span><span>700</span><span>900</span><span>1100</span><span>1300</span><span>1500</span><span>1600</span></div></div>
          <input type="range" class="dial-in" id="dial" min="531" max="1602" step="9" value="${U.dial}" aria-label="ダイヤル">
          <div class="tune"><button type="button" class="pw${U.radio ? ' on' : ''}" id="pw">${U.radio ? 'ラジオ：入' : 'ラジオ：切'}</button><button type="button" data-dt="-9">◀</button><button type="button" data-dt="9">▶</button><span class="freq" id="freq">${U.dial} kHz</span></div>
        </div>
      </div>
      <div class="lcd" id="lcd"><small>聞こえてくる音</small><span id="lcd-t">（止まっている）</span></div>`;
  }
  function deckAfter() {
    const d = $('#dial'); if (!d) return;
    d.oninput = () => { U.dial = +d.value; tuned(); };
    paintDeck(); tuned(true);
  }
  function paintDeck() {
    const rk = $('#rk'); if (!rk) return;
    rk.className = 'rk ' + U.tape.mode;
    $$('[data-tk]').forEach((b) => b.classList.toggle('on', b.dataset.tk === U.tape.mode));
    $('#t-cnt').textContent = String(Math.floor(U.tape.pos)).padStart(3, '0'); $('#t-side').textContent = U.tape.side;
    const n = $('#needle'); if (n) n.style.left = ((U.dial - 531) / (1602 - 531) * 100) + '%';
    $('#freq').textContent = U.dial + ' kHz';
  }
  function lcd(html) { const e = $('#lcd-t'); if (e) e.innerHTML = html; }
  function deckClick(e) {
    const k = e.target.closest('[data-tk]');
    if (k) {
      const m = k.dataset.tk; YA.init(); YA.sfx('clunk');
      if (m === 'flip') { stopTape(); U.tape.side = U.tape.side === 'A' ? 'B' : 'A'; U.tape.pos = 0; YA.sfx('eject'); lcd('（テープを裏返して、頭まで巻きもどした）'); paintDeck(); return; }
      if (m === 'stop') { stopTape(); lcd('（止まっている）'); paintDeck(); return; }
      if (U.radio) setRadio(false);
      U.tape.mode = m; YA.duck(0.3); YA.tape(m, false); paintDeck(); runTape(); return;
    }
    if (e.target.closest('#pw')) { YA.init(); setRadio(!U.radio); return; }
    const dt = e.target.closest('[data-dt]'); if (dt) { U.dial = Math.max(531, Math.min(1602, U.dial + +dt.dataset.dt)); const d = $('#dial'); if (d) d.value = U.dial; tuned(); }
  }
  let tapeTimer = null, tapeLast = 0, tapeSeg = null;
  function runTape() {
    clearInterval(tapeTimer); tapeLast = performance.now();
    tapeTimer = setInterval(() => {
      const now = performance.now(), dt = (now - tapeLast) / 1000; tapeLast = now;
      const t = U.tape, rate = t.mode === 'play' ? 4 : t.mode === 'ff' ? 45 : t.mode === 'rew' ? -45 : 0;
      t.pos = Math.max(0, Math.min(D.TAPE_LEN, t.pos + rate * dt));
      if ((t.pos >= D.TAPE_LEN && rate > 0) || (t.pos <= 0 && rate < 0)) { stopTape(); lcd(t.pos <= 0 ? '（頭まで巻きもどした）' : '（テープが終わった）'); paintDeck(); return; }
      if (t.mode === 'play') {
        const seg = D.TAPE[t.side].find(([a, b]) => t.pos >= a && t.pos < b) || null;
        if (seg !== tapeSeg) {
          tapeSeg = seg;
          YA.tape('play', !!(seg && seg[2] === 'song'));
          if (!seg) lcd('（ざー……）');
          else { const who = { old: '2003年のツジモトさん', mori: '森さん', fx: '音', song: '曲' }[seg[2]]; lcd(`<span class="who">${who}</span>　${esc(seg[3])}`); if (seg[2] === 'mori') find('mori'); }
        }
      } else if (tapeSeg !== 'fast') { tapeSeg = 'fast'; lcd(t.mode === 'ff' ? '（キュルキュルキュル……早送り）' : '（キュルキュルキュル……巻きもどし）'); }
      const c = $('#t-cnt'); if (c) c.textContent = String(Math.floor(t.pos)).padStart(3, '0');
    }, 100);
  }
  function stopTape() { clearInterval(tapeTimer); tapeTimer = null; tapeSeg = null; U.tape.mode = 'stop'; YA.tape('stop'); if (!U.radio) YA.duck(1); paintDeck(); }
  function setRadio(on) {
    U.radio = on; if (on) { stopTape(); YA.duck(0.3); } else { YA.radio(false); YA.duck(1); lcd('（止まっている）'); }
    const p = $('#pw'); if (p) { p.classList.toggle('on', on); p.textContent = on ? 'ラジオ：入' : 'ラジオ：切'; }
    tuned(true);
  }
  function stationAt(f) {
    let best = null, bd = 1e9; D.STATIONS.forEach((s) => { const d = Math.abs(s.f - f); if (d < bd) { bd = d; best = s; } });
    return { s: best, d: bd };
  }
  function tuned(force) {
    paintDeck(); if (!U.radio) return;
    const { s, d } = stationAt(U.dial), noise = Math.min(1, d / 20), clear = d <= 4;
    YA.radio(true, noise, d > 2 && d < 16 ? d / 16 : 0, d <= 9 ? s.kind : '');
    clearInterval(U.lcdT);
    if (d > 9) { lcd('（ざー…………）'); return; }
    const lines = s.f === 1062 && st.ended ? ['よふかし通信は、終わりました。つぎの放送は、朝五時の「おはよう潮見」です。'] : s.lines;
    const show = () => {
      const l = lines[U.lcdI % lines.length]; U.lcdI++;
      const txt = clear ? l : l.replace(/[^、。…（）]/g, (ch, i) => (i % 3 ? ch : '…'));
      lcd(`<span class="who">${esc(s.name)}</span>${clear ? '' : '（雑音がまざる）'}<br>${esc(txt)}`);
    };
    U.lcdI = 0; show(); U.lcdT = setInterval(show, 4200);
    if (clear) { st.heard[s.f] = 1; if (D.STATIONS.filter((x) => x.x && st.heard[x.f]).length >= 4) find('dial'); save(); }
  }
  function stopDeck() { stopTape(); if (U.radio) { U.radio = false; YA.radio(false); YA.duck(1); } clearInterval(U.lcdT); }

  /* ---------- 台帳 ---------- */
  function vLedger() {
    if (st.stage < 4 && !st.ended) return '<h2>台帳</h2><div class="locked"><p>森さんの引き出し。「ステッカー発送台帳」と書いてある。<br>鍵がかかっていて、森さんの許しがないと開けられない。</p></div>';
    const live = working('sticker'), done = st.done.sticker;
    const env = st.stage >= 4 || st.ended ? `<div class="env"><h3>番組最後のステッカー　送り先</h3>
      <p class="lead" style="margin:0">宛先</p><div class="chips">${D.ENVELOPE.to.map((v) => `<button type="button" data-env="to" data-v="${esc(v)}" class="${(done ? D.ENVELOPE.answer[0] : st.env.to) === v ? 'on' : ''}"${live ? '' : ' disabled'}>${esc(v)}</button>`).join('')}</div>
      <p class="lead" style="margin:0">宛名</p><div class="chips">${D.ENVELOPE.name.map((v) => `<button type="button" data-env="name" data-v="${esc(v)}" class="${(done ? D.ENVELOPE.answer[1] : st.env.name) === v ? 'on' : ''}"${live ? '' : ' disabled'}>${esc(v)}　様</button>`).join('')}</div>
      ${live ? `<div class="row-act"><button type="button" class="btn hot" id="send-env"${st.env.to && st.env.name ? '' : ' disabled'}>封をして出す</button></div>` : done ? '<p class="lead" style="margin:0">封をして、佐伯さんにわたした。</p>' : ''}</div>` : '';
    return `<h2>ステッカー発送台帳（森）</h2><p class="lead">ハガキを読んだ人に、番組のステッカーを送った記録。名前は森さんの略し方。</p>${env}
      <div class="ledger"><table class="lg"><thead><tr><th>送った日</th><th>名前</th><th>宛先</th><th>宛名</th><th>メモ</th></tr></thead><tbody>
      ${D.LEDGER.map(([d, n, to, nm, memo]) => `<tr><td class="d">${esc(d)}</td><td>${esc(n)}</td><td>${esc(to)}</td><td>${nm ? esc(nm) + ' 様' : '<span class="stain">しみ</span>'}</td><td class="memo">${esc(memo)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  /* ---------- 森ノート ---------- */
  function vNote() {
    const tabs = [['front', 'はじめに']];
    D.STAGES.forEach((s, i) => { if (i <= st.stage || st.ended) tabs.push([s.id, s.title]); });
    if (st.ended) tabs.push(['last', 'さいごのページ']);
    if (!tabs.find((t) => t[0] === st.noteTab)) st.noteTab = 'front';
    let body = '';
    if (st.noteTab === 'front') body = `<div class="pg"><h3>${esc(D.NOTE_FRONT[0])}</h3>${D.NOTE_FRONT.slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    else if (st.noteTab === 'last') body = `<div class="pg"><h3>${esc(D.NOTE_LAST[0])}</h3>${D.NOTE_LAST.slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    else {
      const id = st.noteTab, s = D.STAGES.find((x) => x.id === id), done = st.done[id] || st.ended;
      const lv = done ? 3 : hintLevel(id), ms = st.stageMs[id] || 0;
      if (!done && lv > (st.peek[id] || 0)) { st.peek[id] = lv; save(); }
      body = `<div class="pg"><h3>${esc(s.title)}</h3>` + D.HINTS[id].map((h, i) => {
        if (i < lv) return `<p>${i === 2 ? '' : `その${i + 1}　`}${esc(h)}</p>`;
        const left = Math.max(1, Math.ceil((HINT_MIN[i] * 60000 - ms) / 60000));
        return `<p class="lk">${i === 2 ? '答え' : `その${i + 1}`}：（まだ白い。あと${left}分くらい考えたら、読めるようにしておく）</p>`;
      }).join('') + '</div>';
    }
    return `<h2>森ノート</h2><div class="mori"><div class="tabs">${tabs.map(([k, n]) => `<button type="button" data-nt="${k}" class="${st.noteTab === k ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>${body}</div>`;
  }

  /* =========================================================
     モーダル
     ========================================================= */
  function modal(html) {
    const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><button type="button" class="x" aria-label="とじる">×</button>${html}</div>`;
    $('.x', m).onclick = closeModal;
  }
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  /* ---------- カンペ ---------- */
  $('#kb').addEventListener('click', () => {
    YA.init(); YA.sfx('page');
    modal(`<h2 style="margin:0 0 10px">カンペ（スケッチブック）</h2><div class="sketch"><p>書いて、ガラスごしにツジモトさんに見せる。</p><input id="kp" autocomplete="off" maxlength="30" placeholder="ここに書く"></div><div class="row-act"><button type="button" class="btn hot" id="kp-go">ガラスに見せる</button></div>`);
    const i = $('#kp'); setTimeout(() => i.focus(), 50);
    const go = () => { const v = i.value.trim(); if (!v) return; closeModal(); showKanpe(v); submit('kanpe', v); };
    $('#kp-go').onclick = go; i.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) go(); });
  });
  function showKanpe(v) { const k = $('#kanpe-show'); k.textContent = v; k.hidden = false; YA.sfx('pen'); clearTimeout(U.kpT); U.kpT = setTimeout(() => { k.hidden = true; }, 3800); }
  const norm = (s) => String(s).normalize('NFKC').replace(/[\s　、。．.,!！?？「」『』・〜~ー-]/g, (c) => (c === 'ー' ? 'ー' : '')).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/(さん|様|さま)$/, '').replace(/灯台/g, 'とうだい');

  /* =========================================================
     こたえ合わせ
     ========================================================= */
  function submit(kind, val) {
    YA.init();
    if (st.ended) { toast('放送は、もう終わった。'); return; }
    if (st.phase !== 'work') { toast('いまは、放送の途中。ひと区切りつくまで待って。'); return; }
    const s = stage(), W = D.WRONG[s.id] || {};
    const expect = { open: 'card', rank: 'votes', req: 'record', last: 'kanpe', sticker: 'env', end: 'kanpe' }[s.id];
    if (kind !== expect) {
      if (kind === 'kanpe') sayOne(['N', '（ガラスの向こうで、ツジモトさんが首をかしげた。いまは、カンペの出番じゃないらしい）']);
      return;
    }
    let ok = false, w = null;
    if (s.id === 'open') { ok = val === 't1'; if (!ok) { const c = CARD[val]; w = W[val] || (c && c.box !== 'tonight' ? W.hall : W._); } }
    if (s.id === 'rank') {
      const set = new Set(val), her = new Set(D.HER);
      ok = set.size === her.size && [...her].every((n) => set.has(n));
      if (!ok) {
        if (set.has('月曜の遺失物係')) w = W.kaishitsu;
        else if (set.has('深夜のこむら返り') && [...set].filter((n) => her.has(n)).length < 4) w = W.komura;
        else if ([...set].every((n) => her.has(n)) && set.size >= 2) w = W.partial;
        else if (set.size === 1) w = W.single; else w = W._;
      }
    }
    if (s.id === 'req') { ok = val[0] === D.ANSWER_RECORD[0] && val[1] === D.ANSWER_RECORD[1]; if (!ok) { w = W[val[0] + val[1]] || W._; YA.sfx('needle'); YA.song({ seed: val[0].charCodeAt(1) * 3 + (val[1] === 'B' ? 7 : 1), bars: 2, vol: 0.7 }); } }
    if (s.id === 'last') { const n = norm(val); ok = n === 'みんながいるから'; if (!ok) w = n === 'みいら' ? W.miira : W._; }
    if (s.id === 'sticker') { ok = val.to === D.ENVELOPE.answer[0] && val.name === D.ENVELOPE.answer[1]; if (!ok) w = val.to !== D.ENVELOPE.answer[0] ? W.place : val.name === '浜野 灯' ? W.old : val.name === '浜野 修' ? W.osamu : W._; }
    if (s.id === 'end') {
      const n = norm(val); ok = n === 'ねむれないとうだい';
      if (!ok) {
        if (n.includes('さいしょのりすなー')) w = W.first;
        else if (/三上|浜野|あかり|灯$/.test(val) || n.includes('みかみ') || n.includes('はまの')) w = W.real;
        else if (['ねこ背の郵便屋', '3丁目の夕刊', '左ききのカモメ'].some((x) => norm(x) === n)) w = W.other;
        else w = W._;
      }
    }
    if (!ok) { YA.sfx('no'); say([w]); return; }
    YA.sfx('ok');
    success(s);
  }

  async function success(s) {
    st.phase = 'ok'; st.done[s.id] = true; save(); renderAll();
    U.busy = true;
    if (s.id === 'open' || s.id === 'rank') BB.hand();
    if (s.id === 'req') { YA.bed(false); }
    await wait(s.id === 'open' || s.id === 'rank' ? 1300 : 400);
    await say(s.ok);
    if (s.id === 'req') { YA.stopSong(); YA.bed(true); }
    if (s.id === 'last') { setOnair(false); YA.bed(false); }
    if (s.id === 'sticker') { setOnair(true); YA.bed(true); }
    U.busy = false;
    if (s.id === 'end') { ending(); return; }
    enterStage(st.stage + 1);
  }

  /* =========================================================
     進行
     ========================================================= */
  async function enterStage(i, resume) {
    st.stage = i; const s = stage();
    setClock(s.time); $('#now-t').textContent = s.title;
    if (resume && st.phase === 'work') { renderAll(); BB.set({ host: 'idle' }); return; }
    st.phase = 'intro'; save(); renderAll();
    U.busy = true;
    if (s.id !== 'open') YA.bed(s.id !== 'sticker');
    if (s.id === 'sticker') setOnair(false);
    await say(s.intro);
    U.busy = false;
    st.phase = 'work'; save(); renderAll();
    BB.set({ host: 'idle' });
    if (s.id === 'rank') { U.tab = 'rundown'; renderItems(); renderOpen(); }
    if (s.id === 'sticker') { U.tab = 'ledger'; renderItems(); renderOpen(); }
  }
  async function ending() {
    U.busy = true;
    setOnair(false); YA.bed(false);
    await wait(2500);
    YA.sfx('mail');
    const m = $('#mail'), E = D.ENDMAIL;
    m.innerHTML = `<header><span>番組のメール　受信 26:59</span><span>1通</span></header><h3>件名：${esc(E.subject)}</h3>${E.body.map((l) => `<p>${esc(l)}</p>`).join('')}<div class="mail-b"><button type="button" id="mail-x">閉じる</button></div>`;
    m.hidden = false;
    await new Promise((r) => { const t = setTimeout(r, 30000); $('#mail-x').onclick = () => { clearTimeout(t); r(); }; });
    m.hidden = true;
    BB.ending();
    await say([['N', '（ヘッドホンをはずしたツジモトさんが、窓の外を見ている。港の向こうに、郵便局の窓の明かりがひとつ）', 'bow']]);
    await wait(1200);
    BB.blink();
    await say([['N', '（明かりが、三回またたいた）', '']]);
    await wait(2000);
    $('#fade').classList.add('on');
    await wait(2300);
    st.ended = true; st.stage = D.STAGES.length - 1; st.phase = 'done'; save();
    $('#now-t').textContent = '放送終了'; setClock('27:00');
    U.busy = false;
    renderAll(); showEnd();
  }
  function showEnd() {
    const ec = $('#endcard'), mins = Math.max(1, Math.round(st.playMs / 60000)), peek = Object.values(st.peek).reduce((a, b) => a + b, 0), n = EXTRAS.filter((k) => st.found[k]).length;
    ec.hidden = false;
    ec.innerHTML = `<div class="ec"><div class="moon"></div><h2>よふかし通信</h2><p class="yrs">2003.4.8 — 2026.9.29</p><p class="bye">おやすみなさい。</p>
      <dl><dt>副調整室にいた時間</dt><dd>約${mins}分</dd><dt>森ノートのヒント</dt><dd>${peek}回</dd><dt>見つけたもの</dt><dd>${n} / ${EXTRAS.length}</dd></dl>
      <div class="row-act"><button type="button" class="btn" id="ec-back">副調整室にもどる</button><button type="button" class="btn ghost" id="ec-reset">最初からやり直す</button></div><div id="ec-ask"></div></div>`;
    $('#ec-back').onclick = () => { ec.hidden = true; $('#fade').classList.remove('on'); BB.reset(); BB.set({ host: 'still', phones: false }); };
    $('#ec-reset').onclick = () => {
      $('#ec-ask').innerHTML = '<div class="ask">記録を消して、最初からやり直しますか？<div class="row-act"><button type="button" class="btn hot" id="ec-yes">消してやり直す</button><button type="button" class="btn ghost" id="ec-no">やめておく</button></div></div>';
      $('#ec-yes').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); };
      $('#ec-no').onclick = () => { $('#ec-ask').innerHTML = ''; };
    };
  }

  /* =========================================================
     卓のボタン
     ========================================================= */
  $('#tb').addEventListener('click', () => {
    YA.init(); YA.sfx('talk'); const b = $('#tb'); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 300);
    st.tb++; save();
    if (st.tb === 10) { find('talkback'); sayOne(['Tb', '（トークバック）作家さん、押しすぎ（笑）。……森さんも、最初の週はそうだった。', '']); return; }
    if (U.busy) return;
    if (st.ended) { sayOne(['Tb', '（トークバック）おつかれさま。……今夜は、ありがとう。', '']); return; }
    if (st.phase === 'work') sayOne(['D', '（トークバック）' + stage().cue, '']);
  });
  $('#f-mic').addEventListener('input', (e) => {
    if (+e.target.value < 65 && !U.micWarn) {
      U.micWarn = true; find('mic');
      if (!U.busy) sayOne(['D', 'ちょっと！　ツジモトさんのマイク、さわらないで！', '']);
      setTimeout(() => { e.target.value = 80; U.micWarn = false; }, 900);
    }
  });
  $('#f-bgm').addEventListener('input', (e) => { YA.duck(+e.target.value / 60); });
  $('#snd').addEventListener('click', () => { st.mute = !st.mute; YA.init(); YA.mute(st.mute); $('#snd').textContent = st.mute ? '音：切' : '音：入'; save(); });
  let lampN = 0;
  $('#onair').addEventListener('click', () => { lampN++; YA.sfx('click'); if (lampN === 5) toast('ランプをたたいても、放送は止まらない。'); });

  /* =========================================================
     入館証（はじまり・つづき）
     ========================================================= */
  function showGate() {
    const g = $('#gate'); g.hidden = false;
    const again = st.intro;
    g.innerHTML = `<div class="pass"><div class="pass-h"><small>潮見放送　臨時入館証</small><b>構成作家（代理）</b></div><div class="pass-b">
      <dl><dt>日付</dt><dd>2026年9月28日（月）深夜</dd><dt>番組</dt><dd>よふかし通信（最終回）</dd><dt>入室</dt><dd>第2スタジオ　副調整室</dd><dt>担当</dt><dd>ハガキ選び・カンペ</dd></dl>
      <p class="pass-memo">${again ? (st.ended ? '放送は終わった。副調整室は、まだ開いている。——佐伯' : 'おかえり。放送は、まだつづいてる。——佐伯') : '森さんの代わり、ありがとう。今夜は最終回。ハガキはあなたが選んで、ブースに入れてください。ツジモトさんが読みます。わからないことは、森さんのノートに。——佐伯'}</p>
      <button type="button" class="btn hot" id="enter">${again ? '副調整室にもどる' : '副調整室に入る'}</button>
      <p class="pass-f">音が出ます（あとで消せます）。目安は約30分。この作品はフィクションです。</p></div></div>`;
    $('#enter').onclick = () => {
      YA.init(); YA.mute(st.mute); g.hidden = true;
      if (!st.intro) { st.intro = true; save(); enterStage(0); return; }
      if (st.ended) { setOnair(false); $('#now-t').textContent = '放送終了'; setClock('27:00'); BB.set({ host: 'still', phones: false }); renderAll(); return; }
      if (st.done[stage().id] && st.stage < D.STAGES.length - 1) { enterStage(st.stage + 1); return; }
      if (st.done[stage().id]) { ending(); return; }
      setOnair(stage().id !== 'sticker'); YA.bed(stage().id !== 'sticker');
      if (st.phase === 'work') { enterStage(st.stage, true); say([['N', '（放送は、つづいている）', '']]); }
      else enterStage(st.stage);
    };
  }

  /* =========================================================
     描きなおし・時間
     ========================================================= */
  function renderAll() {
    const s = stage();
    $('#cue-t').textContent = st.ended ? 'おつかれさま。今夜はありがとう。' : st.phase === 'work' ? s.cue : st.phase === 'intro' ? '（放送中。ツジモトさんの話を聞く）' : '（放送中）';
    $('#kb').classList.toggle('want', working('last') || working('end'));
    $('#snd').textContent = st.mute ? '音：切' : '音：入';
    renderItems(); if (U.tab !== 'deck') renderOpen();
  }
  setInterval(() => {
    tickClock();
    if (document.hidden || !st.intro || st.ended || $('#gate').hidden === false) return;
    if (st.phase === 'work') {
      const id = stage().id, before = hintLevel(id); st.stageMs[id] = (st.stageMs[id] || 0) + 1000;
      if (hintLevel(id) > before) { renderItems(); if (U.tab === 'note') renderOpen(); toast('森ノートに、読めるページが増えた。'); }
    }
  }, 1000);
  setInterval(() => { if (document.hidden || !st.intro || st.ended || !$('#gate').hidden) return; st.playMs += 5000; save(); }, 5000);
  document.addEventListener('visibilitychange', () => { YA.suspend(document.hidden); });

  /* =========================================================
     はじめる
     ========================================================= */
  U.tab = st.tab || 'rundown';
  buildClock(); tickClock();
  const mode = BB.init($('#cv'), { flat: FLAT });
  $('#cv').dataset.mode = mode;
  setClock(st.ended ? '27:00' : stage().time);
  $('#now-t').textContent = st.ended ? '放送終了' : st.intro ? stage().title : '放送前';
  renderAll();
  showGate();

  window.__yf = {
    st: () => st, U, BB,
    go(i) { st.stage = i; st.phase = 'work'; st.intro = true; $('#gate').hidden = true; U.busy = false; ++U.sayGen; $('#cap').hidden = true; setClock(stage().time); $('#now-t').textContent = stage().title; renderAll(); },
    submit, skip: () => U.capSkip && U.capSkip(), step: (n) => BB._step(n), tab(k) { U.tab = k; renderItems(); renderOpen(); }, openCard, openRecord,
  };
})();
