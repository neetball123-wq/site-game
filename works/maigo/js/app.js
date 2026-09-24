/* =========================================================
   迷子の天気予報 — 進行・画面・一日のアニメーション
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'maigo.v1';
  const DAYS = MD.DAYS, ALL = DAYS.concat([MD.XMAS]), XI = 7;
  const SLOT = ['朝', '昼', '夕', '夜'];
  const WN = { '0': ['無風', '雲はとまる'], u: ['南風', '雲は北へ'], r: ['西風', '雲は東へ'], d: ['北風', '雲は南へ'], l: ['東風', '雲は西へ'] };
  const DIRJ = { u: '北', r: '東', d: '南', l: '西' };
  const HINT_AT = [2, 5, 8];

  const fresh = () => ({ v: 1, playMs: 0, name: '', intro: false, unlocked: 0, cur: 0, solved: {}, winds: {}, teru: {}, dayMs: {}, peek: {}, frags: [], placed: {},
    ended: false, xmas: { open: false, solved: false }, found: {}, mute: false, view: 'tilt', seenRules: {} });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) { st = Object.assign(fresh(), r); st.xmas = Object.assign(fresh().xmas, r.xmas || {}); } } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };

  const ui = { phase: 'plan', res: null, checks: null, gen: 0, teruMode: false, sel: null, slot: 3, skip: null };
  const D = () => ALL[st.cur];
  const isSun = () => st.cur === 6;
  const placedN = () => Object.keys(st.placed).length;
  const sunLost = () => isSun() && placedN() < 6;
  const hintKey = () => sunLost() ? 'sunlost' : D().id;
  const winds = () => (st.winds[D().id] = st.winds[D().id] || ['0', '0', '0', '0']);
  const teruOf = () => st.teru[D().id] || null;
  const snowDay = () => !!(D().rules && D().rules.snow);

  /* ---------- 天気の絵 ---------- */
  function wi(w, t, snow) {
    const night = t === 3;
    if (w === 'R' && snow && night) w = 'X';
    const cloud = (c, dy) => `<g transform="translate(0 ${dy || 0})"><circle cx="15" cy="20" r="7" fill="${c}"/><circle cx="23" cy="16" r="9" fill="${c}"/><circle cx="29" cy="21" r="6" fill="${c}"/><rect x="12" y="20" width="22" height="7" rx="3.5" fill="${c}"/></g>`;
    let g = '';
    if (w === 'S' && !night) g = `<circle cx="20" cy="20" r="8" fill="#f2a93b"/>` + [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<line x1="${20 + Math.cos(a) * 11}" y1="${20 + Math.sin(a) * 11}" x2="${20 + Math.cos(a) * 15}" y2="${20 + Math.sin(a) * 15}" stroke="#f2a93b" stroke-width="2.4" stroke-linecap="round"/>`; }).join('');
    else if (w === 'S') g = `<path d="M24 9a11 11 0 1 0 7 19a9 9 0 1 1 -7 -19z" fill="#f2c94e"/><circle cx="10" cy="10" r="1.6" fill="#f2c94e"/><circle cx="32" cy="8" r="1.2" fill="#f2c94e"/>`;
    else if (w === 'C') g = cloud('#a7b0bc');
    else if (w === 'R') g = cloud('#7f8a99', -3) + [13, 20, 27].map(x => `<line x1="${x}" y1="29" x2="${x - 2}" y2="35" stroke="#4a8fd8" stroke-width="2.4" stroke-linecap="round"/>`).join('');
    else if (w === 'X') g = cloud('#9aa3b0', -3) + [13, 20, 27].map((x, i) => `<circle cx="${x}" cy="${31 + (i % 2) * 3}" r="2" fill="#fff" stroke="#9aa3b0"/>`).join('');
    else if (w === 'B') g = ['#e0584a', '#f2a93b', '#f2d14e', '#6ac47a', '#4aa3d8'].map((c, i) => `<path d="M${5 + i * 2.2} 30a${15 - i * 2.2} ${15 - i * 2.2} 0 0 1 ${30 - i * 4.4} 0" fill="none" stroke="${c}" stroke-width="2.2"/>`).join('');
    return `<svg class="wi" viewBox="0 0 40 40" aria-hidden="true">${g}</svg>`;
  }
  const wname = (w, t, snow) => w === 'S' ? (t === 3 ? '晴れ（星）' : '晴れ') : w === 'C' ? 'くもり' : w === 'R' ? (snow && t === 3 ? '雪' : '雨') : w === 'B' ? '虹' : '？';
  const arrow = (k) => k === '0' ? '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="5" fill="#b8ad96"/></svg>'
    : `<svg viewBox="0 0 40 40" style="transform:rotate(${{ r: 0, d: 90, l: 180, u: -90 }[k]}deg)"><path d="M6 20h22" stroke="#2b7fb8" stroke-width="5" stroke-linecap="round"/><path d="M22 11l11 9-11 9z" fill="#2b7fb8"/></svg>`;
  const cellName = (x, y) => `${MD.cell(x, y)} ${MD.tile(x, y).name}`;

  /* ---------- 日めくり ---------- */
  function renderCal() {
    const d = D();
    const [m, dd] = d.date.match(/(\d+)月(\d+)日/).slice(1);
    $('#cal-m').textContent = m + '月'; $('#cal-d').textContent = dd; $('#cal-w').textContent = d.wd + '曜日';
    $('#cal-page').classList.toggle('sun', d.wd === '日');
    $('#cal-tabs').innerHTML = DAYS.map((x, i) => `<button type="button" data-day="${i}" class="${i === st.cur ? 'on' : ''} ${st.solved[x.id] ? 'done' : ''}" ${i > st.unlocked ? 'disabled' : ''} aria-label="${x.date}（${x.wd}）">${x.wd}</button>`).join('');
    $('#cal-ear').hidden = !st.ended;
  }

  /* ---------- 予報ノート ---------- */
  let noteTab = 'fc';
  function renderNote() {
    $$('#note-tabs button').forEach(b => b.classList.toggle('on', b.dataset.nt === noteTab));
    const d = D(), p = $('#note-page');
    if (noteTab === 'rules') {
      const upto = st.cur === XI ? 6 : st.cur;
      const list = MD.RULES.filter(r => r.day <= upto);
      p.innerHTML = `<p class="np-date">天気のしくみ</p><ol class="rules">${list.map(r => `<li class="${r.day === st.cur ? 'new' : ''}">${r.t}${r.s ? `<small>${r.s}</small>` : ''}</li>`).join('')}${st.cur === XI ? '<li class="new">十二月の夜の雨は、<b>雪</b>になる。</li>' : ''}</ol>`
        + `<p class="rules-legend">ジオラマの上が北。A〜Fは西から東、1〜5は北から南。<br>風見盤の矢印は、雲が流れていく向き。</p>`
        + (st.cur >= 4 ? `<p class="rules-legend" style="opacity:.55">（ノートのすみに、さかさまのてるてる坊主の落書き。「？」）</p>` : '');
      return;
    }
    if (noteTab === 'frag') {
      const got = st.frags.filter(f => f !== 'f' || st.frags.includes('f'));
      p.innerHTML = `<p class="np-date">切れ端 <small>${got.length}/6</small></p><p class="np-h">風で飛んでいった、日曜のページ。</p>`
        + `<div class="frag-tray">${MD.FRAG_ORDER.map(f => got.includes(f) ? `<div class="fr">${fragHTML(f)}<small>${MD.FRAGS[f].from}</small></div>` : '').join('') || '<p class="np-h">まだ、ひとつも見つかっていない。</p>'}</div>`;
      return;
    }
    if (sunLost()) { renderAssemble(p); return; }
    const res = ui.phase === 'done' ? ui.res : null;
    const fcq = d.reqs[0];
    p.innerHTML = `<p class="np-date">${d.date}（${d.wd}）<small>ひなた町</small></p>`
      + `<p class="np-h">観測所（D2）の予報</p>`
      + `<div class="np-fc">${[0, 1, 2, 3].map(t => {
        const w = fcq.want[t]; let cls = '', got = '';
        if (res) { const a = MS.at(res, t, 3, 1); const ok = a === w || (w === 'S' && a === 'B'); cls = ok ? 'ok' : 'ng'; if (!ok) got = `<span class="got">→ ${wname(a, t, snowDay())}</span>`; }
        return `<div class="${cls}"><b>${SLOT[t]}</b>${wi(w, t, snowDay())}<span>${wname(w, t, snowDay())}</span>${got}</div>`;
      }).join('')}</div>`
      + (isSun() ? `<div class="page-board done">${MD.FRAG_ORDER.map((f, i) => `<div class="slot ${i >= 4 ? 'wide' : ''}"><div class="fr">${fragHTML(f)}</div></div>`).join('')}</div>`
        : `<p class="np-note">${d.note}</p><p class="np-sign">日和</p>`);
  }
  function fragHTML(f) { return MD.FRAGS[f].html.replace(/<i data-w="(\w)"><\/i>/g, (_, w) => wi(w, w === 'C' && f === 'c' ? 3 : 0)); }
  function renderAssemble(p) {
    const have = st.frags.slice(), placed = Object.values(st.placed);
    const tray = MD.FRAG_ORDER.filter(f => have.includes(f) && !placed.includes(f));
    p.innerHTML = `<p class="np-date">10月11日（日）<small>ページがない</small></p>`
      + `<p class="np-h">ノートの日曜のページは、破れて飛んでいった。拾い集めた切れ端を、もとの場所へ。</p>`
      + `<div class="page-board">${MD.FRAG_ORDER.map((f, i) => { const pl = st.placed[i]; return `<button type="button" class="slot ${i >= 4 ? 'wide' : ''}" data-slot="${i}">${pl ? `<div class="fr">${fragHTML(pl)}</div>` : '　'}</button>`; }).join('')}</div>`
      + `<div class="frag-tray">${tray.map(f => `<button type="button" class="fr ${ui.sel === f ? 'sel' : ''}" data-frag="${f}">${fragHTML(f)}</button>`).join('')}`
      + (have.includes('f') ? '' : `<div class="fr none">？<small>最後の一枚が、見あたらない</small></div>`) + `</div>`;
  }

  /* ---------- 付箋（ヒント） ---------- */
  function hintsOf() {
    if (sunLost()) return ['風に飛ばされた紙は、高いところにひっかかるもの。', 'ジオラマの観測所（D2）の、屋根の上をよく見て。', '観測所の屋根に、紙きれがはさまっている。屋根を押すと取れる。切れ端は、書いてあることの順に並べる。'];
    return D().hints;
  }
  function renderFusen() {
    const k = hintKey(), solved = !sunLost() && st.solved[D().id], ms = st.dayMs[k] || 0, peek = st.peek[k] || 0;
    const hs = hintsOf();
    $('#fusen').innerHTML = hs.map((h, i) => {
      const open = solved || ms >= HINT_AT[i] * 60000, shown = solved ? false : peek > i;
      const lab = i === 2 ? '付箋 ③　こたえ' : `付箋 ${'①②'[i]}`;
      if (!open) return `<button type="button" class="fs lock" disabled><span class="fs-h">${lab}</span>のりが、まだかたい（あと${Math.max(1, Math.ceil((HINT_AT[i] * 60000 - ms) / 60000))}分）</button>`;
      if (shown || (solved && ui.peekSolved === i)) return `<button type="button" class="fs" data-fs="${i}"><span class="fs-h">${lab}</span>${h}</button>`;
      return `<button type="button" class="fs" data-fs="${i}"><span class="fs-h">${lab}</span>はがせそう。（押すと読む）</button>`;
    }).join('');
  }

  /* ---------- はがき ---------- */
  function renderCards() {
    const d = D(), res = ui.phase === 'done' ? ui.checks : null;
    const reqs = d.reqs.slice(1).filter(q => !(q.page && sunLost()));
    let h = '';
    if (sunLost()) h += `<div class="card lostcard"><div class="c-from">日曜のページ</div><p class="c-text">予報が書いてあるはずのページが、見つからない。</p></div>`;
    h += reqs.map(q => {
      const r = res && res.find(z => z.id === q.id);
      const cls = r ? (r.ok ? 'ok' : 'ng') : '';
      const cell = q.kind === 'wind' ? '' : `<span class="c-cell">${MD.cell(q.at[0], q.at[1])}</span>`;
      const pm = q.stamp ? `<span class="c-postmark kotozute">代筆<br>${q.stamp}</span>` : q.page ? '' : `<span class="c-postmark">ひなた<br>${d.date.replace(/(\d+)月(\d+)日/, '$1.$2')}</span>`;
      return `<button type="button" class="card ${cls} ${q.page ? 'page' : ''}" data-req="${q.id}" data-x="${q.at ? q.at[0] : ''}" data-y="${q.at ? q.at[1] : ''}">${pm}`
        + `<div class="c-from">${q.from}<small>${q.where}</small></div><p class="c-text">${q.text}</p><span class="c-need">${cell}${q.need}</span><span class="c-stamp">${r ? (r.ok ? '済' : '×') : ''}</span></button>`;
    }).join('');
    $('#cards').innerHTML = h;
  }

  /* ---------- 風見盤 ---------- */
  function renderVanes(now) {
    const w = winds();
    $('#vanes').innerHTML = [0, 1, 2, 3].map(t => {
      const k = w[t], n = WN[k];
      return `<button type="button" class="vane ${k === '0' ? 'calm' : ''} ${now === t ? 'now' : ''}" data-slot="${t}" aria-label="${SLOT[t]}の風：${n[0]}"><span class="v-t">${MD.SLOT_T[t]}</span><span class="v-dial">${arrow(k)}</span><span class="v-n">${n[0]}</span><span class="v-s">${n[1]}</span></button>`;
    }).join('');
    const tb = $('#teru-btn'), d = D();
    tb.hidden = !(d.rules && d.rules.teru);
    const te = teruOf();
    tb.classList.toggle('on', ui.teruMode);
    tb.textContent = ui.teruMode ? 'マスを押して つるす' : te ? `てるてる坊主：${MD.cell(te[0], te[1])}` : 'てるてる坊主';
    $('#dio').classList.toggle('teru-mode', ui.teruMode);
    const run = $('#run');
    run.disabled = sunLost();
    run.lastChild.textContent = ui.phase === 'running' ? 'とばす' : 'ハンドルをまわす';
    run.classList.toggle('spin', ui.phase === 'running');
  }
  let popSlot = -1;
  function openPop(t, btn) {
    const k = winds()[t]; popSlot = t;
    const opts = [['u', 'p-u'], ['l', 'p-l'], ['0', 'p-0'], ['r', 'p-r'], ['d', 'p-d']];
    const P = $('#pop');
    P.innerHTML = opts.map(([o, c]) => `<button type="button" class="${c} ${o === k ? 'on' : ''}" data-w="${o}"><b>${o === '0' ? '・' : { u: '↑', r: '→', d: '↓', l: '←' }[o]}</b>${WN[o][0]}</button>`).join('');
    P.hidden = false;
    const r = btn.getBoundingClientRect(), pw = 190, ph = 170;
    P.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + 'px';
    P.style.top = (r.top > ph + 16 ? r.top - ph - 6 : r.bottom + 6) + 'px';
    P.querySelector('.on').focus();
  }
  function closePop() { $('#pop').hidden = true; popSlot = -1; }

  /* ---------- ジオラマの様子 ---------- */
  function marks(checks) {
    const d = D(), out = [];
    if (sunLost()) return out;
    const r0 = checks && checks.find(z => z.id === 'fc');
    out.push({ x: 3, y: 1, kind: checks ? (r0.ok ? 'ok' : 'ng') : 'obs' });
    for (const q of d.reqs.slice(1)) {
      if (!q.at || (q.page && sunLost())) continue;
      const r = checks && checks.find(z => z.id === q.id);
      out.push({ x: q.at[0], y: q.at[1], kind: r ? (r.ok ? 'ok' : 'ng') : 'req' });
    }
    return out;
  }
  function teruS() { const te = teruOf(); return te ? { x: te[0], y: te[1], furu: !!te[2] } : null; }
  function planView() {
    const d = D();
    Object.assign(MT.S, { tod: -0.5, clouds: d.clouds.map((c, i) => ({ id: i, x: c[0], y: c[1], gray: c[2] === 'r' ? 1 : 0, a: 1, s: 1 })), rain: [], bows: [], wind: null, steam: 0,
      marks: marks(null), teru: teruS(), fragOnRoof: isSun() && !st.frags.includes('f'), day: st.cur, snow: st.cur === XI && st.xmas.solved ? 1 : 0, hiyori: 0 });
    MA.setTod(-0.5);
  }
  function slotView(t) {
    const res = ui.res; if (!res) return planView();
    if (t < 0) { Object.assign(MT.S, { tod: -0.5, clouds: res.dawn.map(c => ({ id: c.id, x: c.x, y: c.y, gray: c.r ? 1 : 0 })), rain: [], bows: [], wind: null, steam: 0 }); return; }
    const s = res.slots[t];
    const pos = s.steps.length ? s.steps[s.steps.length - 1].after : (t ? res.slots[t - 1].after : res.dawn);
    Object.assign(MT.S, {
      tod: t, wind: s.wind === '0' ? null : s.wind, steam: 0,
      clouds: pos.map(c => ({ id: c.id, x: c.x, y: c.y, gray: c.r ? 1 : 0 })),
      rain: s.wx.map((w, k) => w === 'R' ? { x: k % 6, y: Math.floor(k / 6), a: 1, snow: snowDay() && t === 3 } : null).filter(Boolean),
      bows: s.bow.map(k => ({ x: k % 6, y: Math.floor(k / 6), a: 1 })),
    });
    MA.setTod(t);
  }
  function renderChips() {
    const c = $('#chips');
    c.hidden = ui.phase !== 'done';
    if (c.hidden) return;
    c.innerHTML = ['夜明け', ...SLOT].map((n, i) => `<button type="button" data-cs="${i - 1}" class="${ui.slot === i - 1 ? 'on' : ''}">${n}</button>`).join('');
  }

  /* ---------- 一日をまわす ---------- */
  function simOpt() { const te = teruOf(); if (!te) return {}; return te[2] ? { furu: [te[0], te[1]] } : { teru: [te[0], te[1]] }; }
  function buildTL(res) {
    const segs = []; let cur = new Map(res.dawn.map(c => [c.id, Object.assign({}, c)])); let prevBows = [];
    const snow = snowDay();
    res.slots.forEach((s, t) => {
      const w = s.wind === '0' ? null : s.wind;
      const ev = { block: 0, merge: 0, edge: 0 };
      s.steps.forEach(stp => stp.moves.forEach(m => { if (m.fate in ev) ev[m.fate]++; }));
      let cap = `${SLOT[t]}　${w ? `${WN[w][0]}。白い雲は${DIRJ[w]}へ2マス、雨雲は1マス。` : '風がやんだ。'}`;
      if (s.steps.length) s.steps.forEach((stp, i) => { segs.push({ k: 'move', t, i, n: s.steps.length, dur: 0.62, from: cur, moves: stp.moves, wind: w, fadeBows: i === 0 ? prevBows : [], cap: i === 0 ? cap : null }); cur = new Map(stp.after.map(c => [c.id, Object.assign({}, c)])); });
      else segs.push({ k: 'calm', t, dur: 0.5, from: cur, fadeBows: prevBows, cap });
      const rainIds = []; for (const c of cur.values()) if (s.wx[c.y * 6 + c.x] === 'R') rainIds.push(c.id);
      const notes = [];
      if (ev.block) notes.push('雲が山にぶつかって、雨雲になった');
      if (ev.merge) notes.push('雲が重なって、雨雲になった');
      if (ev.edge) notes.push('雲が町の外へ出ていった');
      const rt = s.wx.map((x, k) => x === 'R' ? k : -1).filter(k => k >= 0);
      if (rt.length) notes.push(rt.map(k => MD.tile(k % 6, Math.floor(k / 6)).name).join('・') + (snow && t === 3 ? 'に雪' : 'に雨'));
      if (s.bow.length) notes.push(s.bow.map(k => MD.tile(k % 6, Math.floor(k / 6)).name).join('・') + 'に虹');
      if (s.born.length) notes.push('沖に、雲が生まれた');
      segs.push({ k: 'wx', t, dur: rt.length || s.bow.length || s.born.length ? 1.25 : 0.55, from: cur, wx: s.wx, bow: s.bow, born: s.born, rainIds, after: new Map(s.after.map(c => [c.id, Object.assign({}, c)])),
        cap: notes.length ? `${SLOT[t]}　${notes.join('。')}。` : null, ev, snow: snow && t === 3 });
      cur = new Map(s.after.map(c => [c.id, Object.assign({}, c)]));
      prevBows = s.bow;
    });
    return segs;
  }
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  function segStart(s) {
    if (s.cap) $('#cap').textContent = s.cap;
    renderVanes(s.t);
    if (s.k === 'move') { MA.wind(1); if (s.moves.some(m => m.fate === 'block')) setTimeout(() => MA.sfx('bump'), 250); if (s.moves.some(m => m.fate === 'merge')) setTimeout(() => MA.sfx('merge'), 380); }
    if (s.k === 'calm') MA.wind(0);
    if (s.k === 'wx') { MA.wind(0); if (s.rainIds.length || s.wx.includes('R')) MA.rain(1, s.snow); if (s.bow.length) setTimeout(() => MA.sfx('bow'), 500); if (s.born.length) setTimeout(() => MA.sfx('pop'), 800); }
  }
  function applySeg(s, u) {
    const S = MT.S, e = ease(u), clouds = [];
    let tod = s.t, rain = [], bows = [], steam = 0;
    if (s.k === 'move' || s.k === 'calm') {
      tod = s.t - 0.5 + 0.5 * (s.k === 'move' ? (s.i + u) / s.n : u);
      for (const c of s.from.values()) {
        const m = s.k === 'move' && s.moves.find(q => q.id === c.id);
        let x = c.x, y = c.y, a = 1, sc = 1, gray = c.r ? 1 : 0;
        if (m) {
          if (m.fate === 'block') { const k = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.38; x = c.x + (m.bx - c.x) * k; y = c.y + (m.by - c.y) * k; gray = c.r ? 1 : Math.min(1, u * 1.6); }
          else {
            x = m.fx + (m.tx - m.fx) * e; y = m.fy + (m.ty - m.fy) * e;
            if (m.fate === 'edge') a = 1 - Math.max(0, (u - 0.3) / 0.7);
            if (m.fate === 'merge') a = 1 - Math.max(0, (u - 0.6) / 0.4);
            if (m.merged) { gray = c.r ? 1 : Math.max(0, (u - 0.55) / 0.45); sc = 1 + Math.sin(Math.PI * Math.max(0, (u - 0.5) / 0.5)) * 0.25; }
          }
        }
        clouds.push({ id: c.id, x, y, a, s: sc, gray });
      }
      bows = s.fadeBows.map(k => ({ x: k % 6, y: Math.floor(k / 6), a: 1 - u }));
      S.wind = s.k === 'move' ? s.wind : null;
    } else {
      for (const c of s.from.values()) clouds.push({ id: c.id, x: c.x, y: c.y, a: 1, s: 1, gray: s.rainIds.includes(c.id) ? (c.r ? 1 - Math.max(0, (u - 0.55) / 0.45) : 0) : (c.r ? 1 : 0) });
      for (const c of s.after.values()) if (!s.from.has(c.id)) { const k = Math.max(0, (u - 0.55) / 0.45); clouds.push({ id: c.id, x: c.x, y: c.y, a: k, s: k, gray: 0 }); steam = Math.sin(Math.PI * u); }
      const ra = u < 0.12 ? u / 0.12 : u > 0.82 ? (1 - u) / 0.18 : 1;
      s.wx.forEach((w, k) => { if (w === 'R') rain.push({ x: k % 6, y: Math.floor(k / 6), a: ra, snow: s.snow }); });
      bows = s.bow.map(k => ({ x: k % 6, y: Math.floor(k / 6), a: Math.max(0, (u - 0.45) / 0.55) }));
      S.wind = null;
      if (u >= 1) MA.rain(0);
    }
    Object.assign(S, { tod, clouds, rain, bows, steam });
    MA.setTod(tod);
  }
  function run() {
    if (ui.phase === 'running') { if (ui.skip) ui.skip(); return; }
    if (sunLost()) return;
    MA.init(); MA.sfx('crank'); closePop(); ui.teruMode = false;
    const d = D(), w = winds().slice();
    const res = MS.run(d, w, simOpt());
    ui.res = res; ui.checks = MS.check(d, res, w); ui.phase = 'running';
    MT.S.marks = marks(null); MT.S.teru = teruS();
    renderVanes(); renderChips(); $('#result').hidden = true; renderCards(); renderNote();
    const segs = buildTL(res), g = ++ui.gen;
    let i = 0, t0 = performance.now();
    const done = () => { if (g !== ui.gen) return; ui.gen++; MA.wind(0); MA.rain(0); finish(); };
    ui.skip = () => { i = segs.length; done(); };
    const step = (now) => {
      if (g !== ui.gen) return;
      if (i >= segs.length) { done(); return; }
      const s = segs[i];
      if (!s.started) { s.started = true; t0 = now; segStart(s); }
      const u = Math.min(1, (now - t0) / 1000 / s.dur);
      applySeg(s, u);
      if (u >= 1) i++;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function finish() {
    ui.phase = 'done'; ui.slot = 3; ui.skip = null;
    slotView(3);
    const ok = ui.checks.every(z => z.ok);
    MT.S.marks = marks(ui.checks);
    renderVanes(); renderChips(); renderCards(); renderNote();
    showResult(ok);
    if (ok) { MA.sfx('ok'); setTimeout(() => MA.sfx('stamp'), 350); $('#cap').textContent = '一日が終わった。予報どおりの空だった。'; success(); }
    else { MA.sfx('ng'); $('#cap').textContent = '予報どおりに、ならなかった。'; }
  }
  function showResult(ok) {
    const d = D(), box = $('#result');
    if (ok) { box.innerHTML = `<h3>予報、的中。お願いも、ぜんぶかなった。</h3>`; box.hidden = false; return; }
    const bad = [];
    for (const r of ui.checks) {
      if (r.ok) continue;
      const q = d.reqs.find(z => z.id === r.id);
      if (q.kind === 'fc') { q.want.forEach((w, t) => { const a = r.got[t]; if (!(a === w || (w === 'S' && a === 'B'))) bad.push(`観測所（D2）の${SLOT[t]}：予報は${wname(w, t, snowDay())} → 実際は${wname(a, t, snowDay())}`); }); }
      else if (q.kind === 'wind') bad.push(`${q.from}（${q.where}）：${q.need} → 実際は${q.slots.map(t => WN[winds()[t]][0]).join('・')}`);
      else bad.push(`${q.from}（${MD.cell(q.at[0], q.at[1])} ${q.where}）：${q.need} → 実際は${q.slots.map((t, i) => `${SLOT[t]} ${wname(r.got[i], t, snowDay())}`).join('、')}`);
    }
    box.innerHTML = `<h3 class="bad">うまくいかなかったところ</h3><ul>${bad.map(b => `<li>${b}</li>`).join('')}</ul><p style="margin:6px 0 0;color:var(--sub)">上の「朝・昼・夕・夜」を押すと、その時間の空を見返せる。</p>`;
    box.hidden = false;
  }
  function toPlan() {
    ui.gen++; ui.phase = 'plan'; ui.res = null; ui.checks = null; ui.skip = null;
    MA.wind(0); MA.rain(0);
    $('#result').hidden = true; $('#cap').textContent = '';
    planView(); renderVanes(); renderChips(); renderCards(); renderNote();
  }

  /* ---------- クリア ---------- */
  function success() {
    const d = D(), first = !st.solved[d.id];
    st.solved[d.id] = true;
    if (st.cur < 6) st.unlocked = Math.max(st.unlocked, st.cur + 1);
    const newFrag = d.frag && !st.frags.includes(d.frag);
    if (newFrag) st.frags.push(d.frag);
    const furu = !!(teruOf() && teruOf()[2]);
    save(); renderCal(); renderFusen();
    if (st.cur === 6) { setTimeout(ending, 900); return; }
    if (st.cur === XI) { setTimeout(xmasEnd, 900); return; }
    setTimeout(() => {
      const next = st.cur + 1;
      let th = d.thanks.slice();
      if (furu) th.push(['源', '……さかさのてるてる坊主か。昔、日和さんもよくそうやって、畑に雨を呼んでくれた。']);
      modal(`<div class="mbox nippo"><div class="n-h"><b>日報　${d.date}（${d.wd}）</b><span class="n-stamp">的中</span></div>`
        + th.map(([f, t]) => `<p class="n-t"><b>${f}</b>${t}</p>`).join('')
        + (newFrag ? `<div class="n-frag"><div class="fr">${fragHTML(d.frag)}</div><div>日曜のページの切れ端を見つけた。<br><small>（${st.frags.length}/6　ノートの「切れ端」に入れた）</small></div></div>` : '')
        + `<div class="mb"><button type="button" class="sub" data-m="stay">この日を見る</button><button type="button" data-m="next">${next === 6 ? '日曜日へ' : DAYS[next].wd + '曜日へ'}</button></div></div>`, (a) => { if (a === 'next') go(next); });
      if (newFrag) MA.sfx('found');
    }, first ? 1100 : 700);
  }
  function go(i) {
    if (i < 0 || (i > st.unlocked && i !== XI)) return;
    st.cur = i; ui.teruMode = false; ui.sel = null; noteTab = 'fc'; save();
    MA.sfx('page');
    toPlan(); renderAll();
    const d = D();
    const hasNew = MD.RULES.some(r => r.day === i) || i === XI;
    if (hasNew && !st.seenRules[d.id]) { st.seenRules[d.id] = 1; save(); noteTab = 'rules'; renderNote(); $('#cap').textContent = 'ノートの「しくみ」に、新しい書きこみがある。'; }
    if (i === 6 && sunLost()) $('#cap').textContent = '日曜日。……予報のページが、ない。';
  }

  /* ---------- 日曜：切れ端をはめる ---------- */
  function placeFrag(slot) {
    if (!ui.sel) return;
    const want = MD.FRAG_ORDER[slot];
    if (want === ui.sel && !st.placed[slot]) {
      st.placed[slot] = ui.sel; ui.sel = null; MA.sfx('tap'); save();
      if (placedN() === 6) {
        MA.sfx('found');
        setTimeout(() => {
          toPlan(); renderAll();
          $('#cap').textContent = '日曜のページが、もどった。「夕方、丘に虹が出たら、帰ります。」';
        }, 300);
      }
      renderNote(); renderFusen();
    } else {
      const el = $(`.slot[data-slot="${slot}"]`); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
      MA.sfx('ng');
    }
  }
  function roofClick() {
    MA.init();
    if (isSun() && !st.frags.includes('f')) {
      st.frags.push('f'); save(); MA.sfx('found');
      MT.S.fragOnRoof = false;
      $('#cap').textContent = '観測所の屋根に、紙きれがはさまっていた。最後の一枚だ。';
      renderNote(); renderFusen();
      return;
    }
    MT.S.roofOpen = true; MA.sfx('tap');
    const first = !st.found.roof; st.found.roof = true; save();
    setTimeout(() => photo(first), 500);
  }
  function photo() {
    const front = `<svg viewBox="0 0 300 200" aria-label="古い写真"><defs><filter id="mg-sep"><feColorMatrix type="matrix" values=".39 .77 .19 0 0 .35 .69 .17 0 0 .27 .53 .13 0 0 0 0 0 1 0"/></filter></defs>
      <rect width="300" height="200" fill="#f4ecd8"/><g filter="url(#mg-sep)"><rect x="10" y="10" width="280" height="180" fill="#9fc7e0"/>
      ${['#e0584a', '#f2a93b', '#f2d14e', '#6ac47a', '#4aa3d8'].map((c, i) => `<path d="M${40 + i * 6} 150a${110 - i * 6} ${110 - i * 6} 0 0 1 ${220 - i * 12} 0" fill="none" stroke="${c}" stroke-width="6" opacity=".7"/>`).join('')}
      <path d="M10 190 Q150 110 290 190Z" fill="#7faa5a"/><rect x="186" y="112" width="6" height="30" fill="#6a4a30"/><circle cx="189" cy="104" r="18" fill="#4f8a48"/>
      <rect x="132" y="128" width="9" height="22" rx="4" fill="#5a5a6a"/><circle cx="136.5" cy="123" r="5" fill="#e8c8a8"/><rect x="146" y="130" width="9" height="20" rx="4" fill="#c86a6a"/><circle cx="150.5" cy="125" r="5" fill="#e8c8a8"/></g>
      <rect x="0" y="0" width="300" height="200" fill="none" stroke="#fff" stroke-width="10"/></svg>`;
    modal(`<div class="mbox"><h2>屋根の下に、古い写真がはさまっていた</h2><div class="photo" id="photo">${front}</div><div class="mb"><button type="button" class="sub" data-m="back">うらを見る</button><button type="button" data-m="close">もどす</button></div></div>`, (a) => {
      if (a === 'back') { $('#photo').innerHTML = `<div class="mbox letter" style="box-shadow:none;padding:16px 18px;width:100%">昭和四十九年十月　丘の上で。<br>「虹が出たら、言う」って、晴彦さん。<br>……ほんとうに、出た。</div>`; return false; }
      MT.S.roofOpen = false;
    });
  }
  function teruFlip() {
    if (ui.phase === 'running') return;
    const te = teruOf(); if (!te) return;
    te[2] = te[2] ? 0 : 1; st.teru[D().id] = te;
    if (te[2] && !st.found.furu) { st.found.furu = true; }
    save(); MA.sfx('tap');
    $('#cap').textContent = te[2] ? '……てるてる坊主を、さかさまにした。' : 'てるてる坊主を、もとにもどした。';
    if (ui.phase === 'done') toPlan(); else { MT.S.teru = teruS(); renderVanes(); }
  }
  function placeTeru(x, y) {
    if (MD.MAP[y][x] === 'M') { $('#cap').textContent = '山には、つるせない。'; return; }
    const te = teruOf();
    if (te && te[0] === x && te[1] === y) { delete st.teru[D().id]; $('#cap').textContent = 'てるてる坊主を、はずした。'; }
    else { st.teru[D().id] = [x, y, te ? te[2] : 0]; $('#cap').textContent = `てるてる坊主を、${cellName(x, y)}につるした。`; }
    ui.teruMode = false; save(); MA.sfx('tap');
    toPlan(); MT.S.teru = teruS();
  }

  /* ---------- おわり ---------- */
  function ending() {
    ui.phase = 'ending';
    slotView(2); ui.slot = 2; renderChips();
    $('#cap').textContent = '夕方。町に、虹が三つ。';
    MA.sfx('bow');
    let k = 0; const iv = setInterval(() => { k += 0.05; MT.S.hiyori = Math.min(1, k); if (k >= 1) clearInterval(iv); }, 60);
    setTimeout(() => { $('#cap').textContent = '……丘の上に、だれかいる。'; }, 2200);
    setTimeout(() => {
      modal(`<div class="mbox letter"><p>天気係さんへ</p>
        <p>虹、見えました。丘の上から、三つも。</p>
        <p>五十二年前、夫とあの丘で虹を見ました。<br>「虹が出たら言う」って、あの人、決めていたんですって。<br>それからずっと、ふたりでこの町の空を見てきました。</p>
        <p>ひとりになってからは、わたしも少し、迷子みたいな気持ちでした。<br>日曜のページが飛んでいったと聞いて、ああ、あれでよかったのかも、と思いました。<br>迷子の予報を、あなたが見つけて、連れて帰ってくれたから。</p>
        <p>一週間、町の空をありがとう。<br>来週からのページは、白いままです。<br>よかったら、あなたの字で書いてください。</p>
        <p style="text-align:right">日和</p><div class="mb"><button type="button" data-m="name">ノートに名前を書く</button></div></div>`, () => { setTimeout(nameBox, 200); });
    }, 4200);
  }
  function nameBox() {
    modal(`<div class="mbox letter"><p>来週の予報ノート</p><p>10月12日（月）　天気係：</p><input class="name-in" id="name-in" maxlength="12" autocomplete="off" placeholder="なまえ" value="${esc(st.name)}"><div class="mb"><button type="button" data-m="write">書く</button></div></div>`, () => {
      const v = ($('#name-in') || { value: '' }).value.trim();
      st.name = v; st.ended = true; save(); MA.sfx('write');
      setTimeout(() => {
        modal(`<div class="mbox letter"><p>10月12日（月）　天気係：${esc(v || '（なまえなし）')}</p><p>観測所の予報　朝　　昼　　夕　　夜</p><p style="color:var(--sub)">——ページは、まだ白い。</p><p style="text-align:center;margin-top:18px;font-family:var(--f);font-weight:700">迷子の天気予報　おしまい</p><div class="mb"><button type="button" data-m="close">とじる</button></div></div>`, () => { ui.phase = 'done'; renderCal(); });
      }, 250);
      return true;
    });
    setTimeout(() => { const i = $('#name-in'); if (i) i.focus(); }, 60);
  }
  function xmasEnd() {
    let k = 0; const iv = setInterval(() => { k += 0.04; MT.S.snow = Math.min(1, k); if (k >= 1) clearInterval(iv); }, 60);
    st.xmas.solved = true; save();
    setTimeout(() => {
      modal(`<div class="mbox nippo"><div class="n-h"><b>日報　12月24日（木）</b><span class="n-stamp">的中</span></div>`
        + D().thanks.map(([f, t]) => `<p class="n-t"><b>${f}</b>${t}</p>`).join('')
        + `<p class="n-t"><b>日和</b>メリークリスマス。来年の予報ノートも、よろしくね。</p><div class="mb"><button type="button" data-m="close">とじる</button></div></div>`);
    }, 1800);
  }

  /* ---------- はじまり ---------- */
  function intro() {
    modal(`<div class="mbox flyer"><h2>急募</h2><p class="fl-big">天気係（アルバイト）</p><p>一週間だけ。未経験、大歓迎。</p>
      <dl><dt>場所</dt><dd>ひなた町 観測所（丘の手前）</dd><dt>期間</dt><dd>10月5日（月）〜11日（日）</dd><dt>仕事</dt><dd>町の天気を、予報どおりにすること</dd><dt>時給</dt><dd>晴れ</dd></dl>
      <div class="mb"><button type="button" data-m="ok">応募する</button></div></div>`, () => {
      setTimeout(() => modal(`<div class="mbox letter"><p>天気係さんへ</p>
        <p>はじめまして。観測所の日和（ひより）です。<br>腰をいためて、一週間ほど入院することになりました。<br>そのあいだ、町の天気をお願いします。</p>
        <p>やりかたは、かんたん。<br>ジオラマの風見盤で、朝・昼・夕・夜の風を決めて、ハンドルをまわすだけ。<br>ジオラマの空は、そのまま町の空になります。</p>
        <p>一週間ぶんの予報は、ノートに書いておきました。<br>予報は、町のみんなとの約束です。<br>はがきで届くお願いも、できるだけかなえてあげてね。</p>
        <p style="text-align:right">日和</p><div class="mb"><button type="button" data-m="ok">ひきうける</button></div></div>`, () => {
        MA.init(); MA.sfx('gust');
        $('#note').classList.add('shake');
        setTimeout(() => {
          $('#note').classList.remove('shake');
          modal(`<div class="mbox"><h2>……あっ。</h2><p>窓から吹きこんだ風で、ノートがぱらぱらとめくれた。<br><b>日曜日のページ</b>が一枚、ちぎれて外へ飛んでいった。</p><p>迷子になった予報は、きっと町のどこかにある。</p><div class="mb"><button type="button" data-m="ok">月曜日をはじめる</button></div></div>`, () => {
            st.intro = true; save(); go(0);
          });
        }, 1300);
      }), 200);
    });
  }

  /* ---------- 箱 ---------- */
  let mgen = 0;
  function modal(html, cb) {
    const m = $('#modal'), my = ++mgen; m.innerHTML = html; m.hidden = false;
    const b = m.querySelector('.mb button:last-child'); if (b) setTimeout(() => b.focus(), 30);
    m.onclick = (e) => {
      const btn = e.target.closest('[data-m]'); if (!btn) return;
      MA.init(); MA.sfx('tap');
      const r = cb ? cb(btn.dataset.m) : undefined;
      if (r === false) return;
      if (mgen === my) { m.hidden = true; m.innerHTML = ''; }
    };
  }
  const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- まとめて描く ---------- */
  function renderAll() { renderCal(); renderNote(); renderFusen(); renderCards(); renderVanes(); renderChips(); $('#snd').textContent = st.mute ? '音：切' : '音：入'; $('#viewbtn').textContent = st.view === 'top' ? 'ななめから見る' : '真上から見る'; }

  /* ---------- 操作 ---------- */
  $('#cal-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b && !b.disabled) go(+b.dataset.day); });
  $('#cal-ear').addEventListener('click', () => { MA.init(); st.xmas.open = true; save(); go(XI); $('#cap').textContent = 'めくれた日めくりの奥に、十二月のページがあった。'; });
  $('#note-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-nt]'); if (!b) return; noteTab = b.dataset.nt; MA.init(); MA.sfx('page'); renderNote(); });
  $('#note-page').addEventListener('click', (e) => {
    const f = e.target.closest('[data-frag]'); if (f) { ui.sel = ui.sel === f.dataset.frag ? null : f.dataset.frag; MA.init(); MA.sfx('tap'); renderNote(); return; }
    const s = e.target.closest('[data-slot]'); if (s) placeFrag(+s.dataset.slot);
  });
  $('#fusen').addEventListener('click', (e) => {
    const b = e.target.closest('[data-fs]'); if (!b) return;
    const i = +b.dataset.fs, k = hintKey(); MA.init(); MA.sfx('page');
    if (st.solved[D().id] && !sunLost()) ui.peekSolved = ui.peekSolved === i ? -1 : i;
    else { st.peek[k] = Math.max(st.peek[k] || 0, i + 1); save(); }
    renderFusen();
  });
  $('#vanes').addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (!b || ui.phase === 'running' || ui.phase === 'ending') return; MA.init(); MA.sfx('dial'); openPop(+b.dataset.slot, b); });
  $('#pop').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]'); if (!b || popSlot < 0) return;
    winds()[popSlot] = b.dataset.w; save(); MA.sfx('dial'); closePop();
    if (ui.phase !== 'plan') toPlan(); else renderVanes();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
  document.addEventListener('pointerdown', (e) => { if (!$('#pop').hidden && !e.target.closest('#pop') && !e.target.closest('.vane')) closePop(); });
  $('#run').addEventListener('click', run);
  $('#reset').addEventListener('click', () => { MA.init(); MA.sfx('page'); toPlan(); });
  $('#teru-btn').addEventListener('click', () => { if (ui.phase === 'running') return; ui.teruMode = !ui.teruMode; MA.init(); MA.sfx('tap'); if (ui.teruMode) $('#cap').textContent = 'てるてる坊主をつるすマスを、ジオラマで押す。（同じマスをもう一度押すと、はずす）'; renderVanes(); });
  $('#chips').addEventListener('click', (e) => { const b = e.target.closest('[data-cs]'); if (!b) return; ui.slot = +b.dataset.cs; slotView(ui.slot); renderChips(); MA.sfx('tap'); });
  $('#cards').addEventListener('pointerover', (e) => { const c = e.target.closest('[data-x]'); MT.S.hover = c && c.dataset.x !== '' ? [+c.dataset.x, +c.dataset.y] : null; });
  $('#cards').addEventListener('pointerleave', () => { MT.S.hover = null; });
  $('#cards').addEventListener('focusin', (e) => { const c = e.target.closest('[data-x]'); MT.S.hover = c && c.dataset.x !== '' ? [+c.dataset.x, +c.dataset.y] : null; });
  $('#snd').addEventListener('click', () => { st.mute = !st.mute; MA.init(); MA.mute(st.mute); save(); renderAll(); });
  $('#viewbtn').addEventListener('click', () => { st.view = st.view === 'top' ? 'tilt' : 'top'; MT.setView(st.view); save(); renderAll(); MA.init(); MA.sfx('tap'); });
  const cv = $('#cv');
  cv.addEventListener('click', (e) => {
    MA.init();
    if (ui.phase === 'running') { if (ui.skip) ui.skip(); return; }
    const p = MT.pick(e.clientX, e.clientY); if (!p) return;
    if (p.teru) { teruFlip(); return; }
    if (p.roof && !ui.teruMode) { roofClick(); return; }
    if (ui.teruMode) { placeTeru(p.x, p.y); return; }
    const reqs = D().reqs.filter(q => q.at && q.at[0] === p.x && q.at[1] === p.y && !(q.page && sunLost()));
    $('#cap').textContent = `${cellName(p.x, p.y)}` + (reqs.length ? `　——　${reqs.map(q => q.kind === 'fc' ? '予報を出す場所' : q.need).join('／')}` : '');
    MA.sfx('tap');
  });
  let tipT = 0;
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now(); if (now - tipT < 50) return; tipT = now;
    const p = MT.pick(e.clientX, e.clientY), tip = $('#tip');
    if (!p) { tip.hidden = true; MT.S.hover = null; return; }
    const r = $('#dio').getBoundingClientRect();
    tip.textContent = p.roof ? '観測所の屋根' : p.teru ? 'てるてる坊主' : cellName(p.x, p.y);
    tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.hidden = false;
    MT.S.hover = [p.x, p.y];
  });
  cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; MT.S.hover = null; });

  /* 遊んだ時間（見えているあいだだけ、5秒ずつ） */
  setInterval(() => {
    if (document.hidden || !st.intro) return;
    st.playMs += 5000;
    const k = hintKey(), solved = !sunLost() && st.solved[D().id];
    if (!solved) st.dayMs[k] = (st.dayMs[k] || 0) + 5000;
    save(); renderFusen();
  }, 5000);
  document.addEventListener('visibilitychange', () => MA.suspend(document.hidden));

  /* ---------- 起動 ---------- */
  if (/[?&]flat(&|$)/.test(location.search)) window.THREE = undefined;   // 2Dの地図で遊ぶ（確認用）
  MT.init(cv);
  MT.setView(st.view);
  MA.mute(st.mute);
  renderAll(); planView();
  if (!st.intro) intro();
  else if (st.cur === 6 && sunLost()) $('#cap').textContent = '日曜日。……予報のページが、ない。';
  try { console.log('%cひなた町 観測所%c\nてるてる坊主は、さかさにすると……？', 'font:700 14px sans-serif;color:#2b7fb8', 'color:#7a6f64'); } catch (e) { }
  window.__mg = { st: () => st, ui, run, skip: () => ui.skip && ui.skip(), go, setWinds: (w) => { st.winds[D().id] = w.slice(); toPlan(); }, teru: (x, y, f) => { st.teru[D().id] = [x, y, f ? 1 : 0]; toPlan(); }, roof: roofClick, place: (s, f) => { ui.sel = f; placeFrag(s); }, step: (n) => MT._step(n) };
})();
