/* =========================================================
   ヤドカリと七つの灯台 — 進行と画面
   ========================================================= */
(() => {
  'use strict';
  const E = window.YE, K = window.YK, A = window.YA, S = window.YS, L = window.YL;
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => Array.from((r || document).querySelectorAll(q));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'yadokari.v1';
  const HINT_MIN = K.HINT_MIN;

  /* ---------- 盤面の一覧 ---------- */
  const ALL = [], BY = {};
  L.isles.forEach((isl) => isl.levels.forEach((lv, k) => { lv.isle = isl.n; lv.k = k; lv.last = k === isl.levels.length - 1; ALL.push(lv); BY[lv.id] = lv; }));
  const MAIN = ALL.filter((l) => l.isle <= 7);
  const ISLE = (n) => K.ISLES[n - 1];
  const levelsOf = (n) => ALL.filter((l) => l.isle === n);

  /* ---------- 保存 ---------- */
  const fresh = () => ({ v: 1, playMs: 0, intro: false, solved: {}, best: {}, glass: {}, ms: {}, peek: {}, seen: {}, tips: {}, bottles: [], ended: false, mute: false, cur: 1, lastLv: null, golden: false, secretDone: false, whale: 0 });
  let st = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) st = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };

  const solvedIn = (n) => levelsOf(n).filter((l) => st.solved[l.id]).length;
  const isleLit = (n) => { const ls = levelsOf(n); return !!st.solved[ls[ls.length - 1].id]; };
  const isleOpen = (n) => (n === 8 ? allGlass() : n === 1 || isleLit(n - 1));
  const lvOpen = (lv) => isleOpen(lv.isle) && (lv.k === 0 || !!st.solved[levelsOf(lv.isle)[lv.k - 1].id]);
  const glassLevels = MAIN.filter((l) => (l.feat || []).some((r) => r.includes('*')));
  const allGlass = () => glassLevels.length > 0 && glassLevels.every((l) => st.glass[l.id]);
  const shells = () => MAIN.filter((l) => st.best[l.id] != null && st.best[l.id] <= l.sol.length && !st.peek[l.id]).length;

  /* ---------- 画面の切りかえ ---------- */
  let screen = 'title';
  function show(id) {
    $$('.scr').forEach((s) => { s.hidden = s.id !== id; });
    screen = id;
    active = id === 'title' ? titleBoard : id === 'play' ? board : null;
    if (id === 'play') requestAnimationFrame(() => { board.resize(); });
    if (S.muted === false) { S.ambience(id !== 'title' || true, false); S.music(id === 'chart' || id === 'isle' || id === 'title'); }
  }
  function sndBtn(el) { el.innerHTML = st.mute ? A.ICON.mute : A.ICON.sound; el.setAttribute('aria-label', st.mute ? '音：切' : '音：入'); }
  function toggleMute() { st.mute = !st.mute; S.mute(st.mute); save(); $$('#c-snd,#p-snd').forEach(sndBtn); }
  function wake() { S.init(); S.mute(st.mute); S.ambience(true); }

  /* ---------- 描画ループ ---------- */
  const board = window.YD.Board($('#cv'), { maxCell: 92 });
  let titleBoard = null, active = null;
  function loop(ms) {
    if (active) active.frame(ms);
    if (screen === 'title' && titleBoard) placeTitleCrab();
    pump();
    requestAnimationFrame(loop);
  }

  /* ---------- タイトル ---------- */
  function initTitle() {
    titleBoard = window.YD.Board($('#title-cv'), { maxCell: 96, dy: 0.2 });
    const S0 = E.load(L.title);
    titleBoard.load(S0, S0.start, K.PALS.asa);
    const V = titleBoard.view(); S0.lamps.forEach((li) => { V.lampT[li] = 1; });
    $('#t-cont').hidden = !st.intro;
    $('#t-start').textContent = st.intro ? 'はじめから' : 'はじめる';
  }
  let crabTaps = 0;
  function placeTitleCrab() {
    const p = titleBoard.playerScreen(), c = $('#title-cv').getBoundingClientRect(), b = $('#t-crab');
    b.style.left = (c.left + p.x - 45) + 'px'; b.style.top = (c.top + p.y - 60) + 'px';
  }
  $('#t-crab').addEventListener('click', () => {
    wake(); crabTaps++;
    titleBoard.bump(crabTaps % 2 ? 1 : 3, 'high'); S.sfx('climb');
    if (crabTaps === 5) { S.sfx('star'); titleBoard.view().p.face *= -1; say2('貝がらの星は、だれかが描いたものらしい。'); }
  });
  function say2(t) { let el = $('#t-say'); if (!el) { el = document.createElement('p'); el.id = 't-say'; el.className = 'say'; $('#title').appendChild(el); } el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 3200); }
  $('#t-start').addEventListener('click', () => {
    wake(); S.sfx('tap');
    if (st.intro) { askFresh(); return; }
    st.intro = true; save(); prologue();
  });
  function prologue() {
    const ov = $('#bottle');
    const lines = ['むかし、この海には七つの灯台があった。', '灯台守がいなくなってから、どれも灯っていない。', '貝がらに星の描かれたヤドカリが、灯台の火を守っていた。'];
    let k = 0;
    ov.innerHTML = `<div class="btl"><p class="cap pro" id="pro"></p><p class="tap">（押すと、つづく）</p></div>`;
    ov.hidden = false;
    const nx = () => {
      if (k >= lines.length) { ov.hidden = true; ov.onclick = null; openLevel(MAIN[0].id); return; }
      const el = $('#pro'); el.classList.remove('on'); void el.offsetWidth; el.textContent = lines[k++]; el.classList.add('on'); S.sfx('page');
    };
    ov.onclick = nx; nx();
  }
  $('#t-cont').addEventListener('click', () => { wake(); S.sfx('tap'); openChart(); });
  function askFresh() {
    const ov = $('#clear');
    ov.innerHTML = `<div class="card"><h2 style="font-size:20px">はじめから？</h2><p>灯した灯台と、拾ったびんの絵が、すべて消えます。</p><div class="row"><button type="button" class="btn" data-k="no">やめる</button><button type="button" class="btn big" data-k="yes">はじめから</button></div></div>`;
    ov.hidden = false;
    ov.onclick = (e) => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      ov.hidden = true; ov.onclick = null;
      if (k.dataset.k === 'yes') { const m = st.mute; st = fresh(); st.mute = m; st.intro = true; save(); gold(); prologue(); }
    };
  }

  /* ---------- 海図 ---------- */
  function openChart(msg) {
    const lit = K.ISLES.map((i) => isleLit(i.n));
    let unlocked = 1; for (let n = 2; n <= 7; n++) if (isleOpen(n)) unlocked = n;
    const count = K.ISLES.map((i) => `${solvedIn(i.n)} / ${levelsOf(i.n).length}`);
    $('#chart-wrap').innerHTML = A.chart(K.ISLES, { unlocked, lit, cur: st.cur, secret: allGlass(), beams: true, count });
    const litN = lit.slice(0, 7).filter(Boolean).length;
    const gN = glassLevels.filter((l) => st.glass[l.id]).length;
    $('#c-prog').innerHTML = `<i>${A.ICON.lamp(true)}${litN} / 7</i><i>${A.ICON.shell}${shells()}</i>${gN ? `<i>${A.ICON.glass}${gN}</i>` : ''}`;
    $('#c-bn').textContent = st.bottles.length;
    $('#c-bottle').innerHTML = A.ICON.bottle + `<span id="c-bn">${st.bottles.length}</span>`;
    $('#c-bottle').hidden = !st.bottles.length;
    $('#c-hint').textContent = msg || '';
    show('chart');
    $$('.isle.open', $('#chart-wrap')).forEach((g) => {
      const go = () => { S.sfx('tap'); openIsle(+g.dataset.n); };
      g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    const wh = $('.whale', $('#chart-wrap'));
    wh.addEventListener('click', () => { wh.classList.remove('go'); void wh.getBBox(); wh.classList.add('go'); S.sfx('spout'); st.whale = (st.whale || 0) + 1; save(); if (st.whale === 7) $('#c-hint').textContent = 'くじらは、灯台の光が好きらしい。'; });
    // 横に長い海図は、いまの島が見えるところまでずらす
    requestAnimationFrame(() => {
      const w = $('#chart-wrap'), svg = $('svg', w); if (!svg) return;
      const sc = svg.getBoundingClientRect().width / 1000, p = A.SPOTS[Math.max(0, st.cur - 1)];
      w.scrollLeft = Math.max(0, p.x * sc - w.clientWidth / 2);
    });
  }
  $('#c-title').innerHTML = A.ICON.back;
  $('#c-title').addEventListener('click', () => { S.sfx('tap'); initTitleBtns(); show('title'); });
  function initTitleBtns() { $('#t-cont').hidden = !st.intro; $('#t-start').textContent = st.intro ? 'はじめから' : 'はじめる'; }
  $('#c-snd').addEventListener('click', toggleMute);
  $('#c-bottle').addEventListener('click', () => { S.sfx('tap'); openGallery(); });

  /* ---------- 島 ---------- */
  let curIsle = 1;
  function openIsle(n) {
    curIsle = n; st.cur = n; save();
    const isl = ISLE(n), ls = levelsOf(n);
    document.documentElement.style.setProperty('--sky', isl.sky);
    $('#isle').classList.toggle('dk', n >= 6);
    $('#i-time').textContent = `${isl.n <= 7 ? `${isl.n}つめの島` : 'ひみつの島'}・${isl.ja}`;
    $('#i-name').textContent = isl.name;
    const g = ls.filter((l) => l.feat && l.feat.some((r) => r.includes('*')));
    $('#i-cnt').innerHTML = `<i>${A.ICON.lamp(true)}${solvedIn(n)} / ${ls.length}</i>`;
    const box = $('#coves'); box.innerHTML = '';
    const nextId = (ls.find((l) => !st.solved[l.id] && lvOpen(l)) || {}).id;
    ls.forEach((lv) => {
      const open = lvOpen(lv), done = !!st.solved[lv.id];
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'cove' + (lv.last ? ' big' : '') + (lv.id === nextId ? ' now' : '');
      b.disabled = !open;
      const hasG = (lv.feat || []).some((r) => r.includes('*'));
      const shell = st.best[lv.id] != null && st.best[lv.id] <= lv.sol.length && !st.peek[lv.id];
      b.innerHTML = `<canvas></canvas><span class="cl">${done ? A.ICON.lamp(true) : ''}${lv.last ? `${esc(lv.id)}　灯台` : esc(lv.id)}<span class="sp">${shell ? `<span class="sh">${A.ICON.shell}</span>` : ''}${hasG && st.glass[lv.id] ? `<span class="gl">${A.ICON.glass}</span>` : ''}</span></span>${open ? '' : `<span class="lk">${A.ICON.lock}</span>`}`;
      b.setAttribute('aria-label', `${lv.id}${lv.last ? ' 灯台' : ''}${done ? '（灯った）' : open ? '' : '（まだ行けない）'}`);
      b.addEventListener('click', () => { S.sfx('tap'); openLevel(lv.id); });
      box.appendChild(b);
    });
    show('isle');
    requestAnimationFrame(() => {
      $$('.cove', box).forEach((b, k) => {
        const cv = $('canvas', b), r = cv.getBoundingClientRect();
        if (!r.width) return;
        const lv = ls[k], Sx = E.load(lv), tb = window.YD.Board(cv, { fixed: { width: r.width, height: r.height }, maxCell: 40 });
        tb.big = !!lv.last;
        tb.load(Sx, Sx.start, K.PALS[ISLE(n).time]);
        if (st.solved[lv.id]) { const V = tb.view(); Sx.lamps.forEach((li) => { V.lampT[li] = 1; }); }
        tb.frame(performance.now());
      });
    });
  }
  $('#i-back').innerHTML = A.ICON.map;
  $('#i-back').addEventListener('click', () => { S.sfx('tap'); openChart(); });

  /* ---------- 遊ぶ ---------- */
  let lv = null, SS = null, cur = null, stack = [], undoReset = null, won = false, auto = false, queue = [], hintOn = 0;
  function openLevel(id) {
    lv = BY[id]; SS = E.load(lv); cur = SS.start; stack = []; undoReset = null; won = false; auto = false; queue = []; hintOn = 0;
    st.lastLv = id; st.cur = lv.isle; save();
    board.big = !!lv.last;
    show('play');
    board.load(SS, cur, K.PALS[ISLE(lv.isle).time]);
    board.hl = []; board.ghost = null;
    document.documentElement.style.setProperty('--sky', ISLE(lv.isle).sky);
    $('#play').style.background = K.PALS[ISLE(lv.isle).time].deep;
    $('#p-id').textContent = lv.last ? `${lv.id} 灯台` : lv.id;
    $('#p-conch').hidden = !SS.conch;
    updHud();
    const tips = (lv.tip || []).filter((k) => !st.tips[k]);
    if (tips.length) { $('#tip').innerHTML = tips.map((k) => esc(K.TIPS[k])).join('<br>') + '<small>（ここを押すと消えます）</small>'; $('#tip').hidden = false; tips.forEach((k) => { st.tips[k] = 1; }); save(); }
    else $('#tip').hidden = true;
    if (SS.conch && tips.includes('conch')) $('#p-conch').classList.add('pulse'); else $('#p-conch').classList.remove('pulse');
    gullDot();
  }
  function updHud() {
    $('#p-moves').textContent = `${stack.length}手`;
    const hi = cur.T === 1;
    $('#p-tide').textContent = hi ? '満ち潮' : '引き潮';
    $('#p-conch').classList.toggle('hi', hi);
  }
  const DIRN = { U: 0, R: 1, D: 2, L: 3 };
  function act(a, fromQueue) {
    if (screen !== 'play' || won || !lv) return;
    if (!fromQueue && auto) return;
    if (board.busy()) { if (queue.length < 2) queue.push(a); return; }
    if (!$('#tip').hidden && stack.length >= 2) $('#tip').hidden = true;
    const ev = [], n = E.act(SS, cur, a, ev);
    if (!n) {
      const b = ev.find((e) => e.t === 'bump' || e.t === 'nope');
      if (a === 'T') { board.nope(); S.sfx('nope'); say('いまの場所だと、満ち潮に沈んでしまう。'); }
      else { board.bump(DIRN[a], b && b.why); S.sfx('bump'); if (b && b.why === 'high') say('段差が高すぎる。'); else if (b && b.why === 'low') say('段差が深すぎる。'); }
      return;
    }
    stack.push(cur); cur = n; undoReset = null;
    board.apply(ev, n, queue.length > 0 || auto);
    sounds(ev);
    if (a === 'T') { const c = $('#p-conch'); c.classList.remove('blow', 'pulse'); void c.offsetWidth; c.classList.add('blow'); }
    updHud();
    if (E.won(SS, n)) onWin(ev);
  }
  function sounds(ev) {
    let delay = 0;
    const at = (name, ms, arg) => setTimeout(() => S.sfx(name, arg), ms);
    for (const e of ev) {
      if (e.t === 'move') { at(e.climb ? (e.board ? 'board' : 'climb') : 'step', delay); }
      else if (e.t === 'push') { at(e.o === 1 ? 'push' : 'pushwood', delay); if (e.fill) at('fill', delay + 180); else if (e.float) at('float', delay + 150); }
      else if (e.t === 'tide') { at('conch', 0, e.T); delay += 250; }
      else if (e.t === 'drift') { at('drift', delay + 200); }
      else if (e.t === 'lit') { at('lit', delay + 200); }
      else if (e.t === 'glass') { at('glass', delay + 150); }
    }
    if ((SS.gates[0].length || SS.gates[1].length)) {
      const before = stack[stack.length - 1];
      const ch = [...SS.gates[0], ...SS.gates[1]].some((g) => E.gateOpen(SS, before, g) !== E.gateOpen(SS, cur, g));
      if (ch) at('gate', 200);
    }
  }
  function pump() {
    if (screen !== 'play' || !queue.length || board.busy()) return;
    act(queue.shift(), true);
  }
  function undo() {
    if (won || auto) return;
    board.skip(); queue = [];
    if (!stack.length) {
      if (undoReset) { stack = undoReset.stack; cur = undoReset.cur; undoReset = null; board.snap(cur); updHud(); S.sfx('undo'); }
      return;
    }
    cur = stack.pop(); board.snap(cur); updHud(); S.sfx('undo');
  }
  function reset() {
    if (won || auto) return;
    board.skip(); queue = [];
    if (stack.length) undoReset = { stack, cur };
    stack = []; cur = SS.start; board.snap(cur); updHud(); S.sfx('undo');
    board.ghost = hintOn === 2 ? board.ghost : null;
  }
  let sayT = null;
  function say(t) { const el = $('#say'); el.textContent = t; el.classList.add('on'); clearTimeout(sayT); sayT = setTimeout(() => el.classList.remove('on'), 1800); }

  function onWin(ev) {
    won = true; queue = [];
    const id = lv.id, moves = stack.length;
    const first = !st.solved[id];
    st.solved[id] = true;
    if (!auto) { if (st.best[id] == null || moves < st.best[id]) st.best[id] = moves; }
    else st.peek[id] = Math.max(st.peek[id] || 0, 3);
    if (cur.gl) st.glass[id] = true;
    if (!st.golden && MAIN.every((l) => st.best[l.id] != null && st.best[l.id] <= l.sol.length && !st.peek[l.id])) { st.golden = true; gold(); setTimeout(() => say('ヤドカリの貝がらが、金色になった。'), 1600); }
    save();
    board.hl = []; board.ghost = null;
    const wait = () => (board.busy() ? setTimeout(wait, 120) : setTimeout(() => showClear(first, moves), 500));
    wait();
    setTimeout(() => S.sfx('win'), 700);
  }
  function showClear(first, moves) {
    const ov = $('#clear'), id = lv.id, par = lv.sol.length;
    const shell = !auto && moves <= par;
    const nxt = levelsOf(lv.isle)[lv.k + 1];
    const g = cur.gl ? `<p class="stat"><i>${A.ICON.glass}ガラスのかけらを拾った</i></p>` : '';
    let btns;
    if (lv.last && lv.isle === 7 && first) btns = `<button type="button" class="btn big" data-k="end">灯台の上へ</button>`;
    else if (lv.last && lv.isle < 7 && first) btns = `<button type="button" class="btn big" data-k="bottle">灯室をのぞく</button>`;
    else if (lv.last && lv.isle === 8 && first) btns = `<button type="button" class="btn big" data-k="bottle">灯室をのぞく</button>`;
    else btns = `<button type="button" class="btn" data-k="isle">島へもどる</button>${nxt ? '<button type="button" class="btn big" data-k="next">つぎの入り江へ</button>' : '<button type="button" class="btn big" data-k="chart">海図へ</button>'}`;
    ov.innerHTML = `<div class="card"><svg class="lampbig" viewBox="0 0 24 32">${A.ICON.lamp(true).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
      <h2>${lv.last ? '灯台が灯った' : '灯った'}</h2>
      <p class="stat"><i>${moves}手</i>${shell ? `<i>${A.ICON.shell}いちばん少ない手数</i>` : `<i style="opacity:.75">いちばん少なくて ${par}手</i>`}</p>${g}
      <div class="row">${btns}</div>${!lv.last || !first ? `<p style="margin-top:10px"><button type="button" class="btn ghost" data-k="again">もう一度</button></p>` : ''}</div>`;
    ov.hidden = false;
    ov.onclick = (e) => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      S.sfx('tap'); ov.hidden = true; ov.onclick = null;
      const w = k.dataset.k;
      if (w === 'next') openLevel(nxt.id);
      else if (w === 'isle') openIsle(lv.isle);
      else if (w === 'chart') openChart();
      else if (w === 'again') openLevel(lv.id);
      else if (w === 'bottle') {
        const pic = lv.isle === 8 ? A.OLD : A.PICS[lv.isle - 1];
        const key = lv.isle === 8 ? 'old' : 'p' + lv.isle;
        if (!st.bottles.includes(key)) st.bottles.push(key);
        if (lv.isle === 8) st.secretDone = true;
        save();
        openBottle(pic, () => openChart(lv.isle < 7 ? `「${ISLE(lv.isle + 1).name}」へ行けるようになった。` : ''));
      } else if (w === 'end') ending();
    };
  }

  /* ---------- カモメ（ヒント） ---------- */
  const lvl = (id) => { const ms = st.ms[id] || 0; return HINT_MIN.filter((m) => ms >= m * 60000).length; };
  function gullDot() { if (!lv) return; const n = lvl(lv.id); $('#p-dot').hidden = !(n > (st.seen[lv.id] || 0)); $('#p-gull').classList.toggle('awake', n > (st.seen[lv.id] || 0)); }
  function keyCells() {
    if (lv.hint) return lv.hint.map(([x, y]) => y * SS.W + x);
    let s0 = SS.start; const out = [];
    for (const a of lv.sol) {
      const ev = []; const n = E.act(SS, s0, a, ev);
      for (const e of ev) {
        if (e.t === 'push') out.push(e.from, e.to);
        else if (e.t === 'tide') out.push(s0.p);
        else if (e.t === 'move' && e.climb) out.push(e.to);
      }
      s0 = n; if (out.length >= 3) break;
    }
    return [...new Set(out)].slice(0, 3);
  }
  function ghostPts(len) {
    let s0 = SS.start; const pts = [{ x: s0.p % SS.W, y: (s0.p / SS.W) | 0, z: E.standAt(s0, s0.p) }];
    for (const a of lv.sol.slice(0, len)) { s0 = E.act(SS, s0, a, null); pts.push({ x: s0.p % SS.W, y: (s0.p / SS.W) | 0, z: E.standAt(s0, s0.p), tide: a === 'T' }); }
    return pts;
  }
  function openHint() {
    if (!lv) return;
    S.sfx('gull');
    const n = lvl(lv.id), ms = st.ms[lv.id] || 0;
    st.seen[lv.id] = Math.max(st.seen[lv.id] || 0, n); save(); gullDot();
    const rows = [
      ['見る', 'だいじなところに、しるしをつける。'],
      ['はじめから', '盤をはじめの形にもどして、途中まで道すじを見せる。'],
      ['見せてもらう', 'はじめから終わりまで、歩いてみせる。'],
    ].map(([b, d], i) => {
      if (i < n) return `<div class="hl"><span class="n">${i + 1}</span><span class="t">${esc(K.GULL[i])}<small>${esc(d)}</small></span><button type="button" data-h="${i + 1}">${b}</button></div>`;
      const left = Math.max(1, Math.ceil((HINT_MIN[i] * 60000 - ms) / 60000));
      return `<div class="hl"><span class="n">${i + 1}</span><span class="t" style="opacity:.6">カモメはまだ眠っている。<small>この入り江で、あと${left}分ほど考えたら起きる。</small></span><button type="button" disabled>…</button></div>`;
    }).join('');
    const isl = lv.isle;
    const rules = [
      '歩く：矢印キー・WASD・画面をなぞる・十字ボタン。',
      '段差は一段ずつなら上り下りできる（砂→岩→草の高台）。',
      '石を押して水に落とすと、うまってその場所が一段高くなる。',
      '押しても動かない石や箱には、のぼれる。石や箱は、高いほうへは押せない。',
      isl >= 2 ? 'ほら貝（スペースキー）：潮が満ちる／引く。満ち潮では砂も水の下になる。足もとが沈む場所ではふけない。' : '',
      isl >= 2 ? '流木の箱は水に浮き、浮いた箱には乗れる。満ち潮になると、浮いた箱ごと一段高くなる。' : '',
      isl >= 2 ? '水につかった石は動かせないが、上には乗れる。浮いた箱は押せない。' : '',
      isl >= 4 ? '潮の流れの上に浮いた箱は、流れの先まで流されていく（乗っていれば、いっしょに）。流れが輪になった「うず」では、ひと回りしたところで止まる。' : '',
      isl >= 5 ? '貝の板の上に何かがあるか、板が水に沈んでいるあいだ、同じ色の杭が沈んで通れる。' : '',
      'もどす：Z　はじめから：R　カモメ：H',
    ].filter(Boolean).map((t) => `<li>${esc(t).replace(/(Z|R|H|WASD)/g, '<kbd>$1</kbd>')}</li>`).join('');
    const ov = $('#hint');
    ov.innerHTML = `<div class="card hintc"><button type="button" class="x" data-h="x" aria-label="とじる">×</button>
      <div class="gh">${A.ICON.gull}<p>杭の上で、カモメが一羽ねている。</p></div>${rows}
      <details class="rules"${n ? '' : ' open'}><summary>島のきまり</summary><ul>${rules}</ul></details></div>`;
    ov.hidden = false;
    ov.onclick = (e) => {
      if (e.target === ov) { ov.hidden = true; return; }
      const h = e.target.closest('[data-h]'); if (!h) return;
      ov.hidden = true; const k = h.dataset.h;
      if (k === 'x') return;
      st.peek[lv.id] = Math.max(st.peek[lv.id] || 0, +k); save();
      if (k === '1') { board.hl = keyCells(); hintOn = 1; say('カモメが、しるしをつけてくれた。'); }
      else if (k === '2') { reset(); board.ghost = { pts: ghostPts(Math.ceil(lv.sol.length / 2)) }; hintOn = 2; say('光る道のとおりに、はじめてみよう。'); }
      else if (k === '3') autoplay();
    };
  }
  function autoplay() {
    board.skip(); queue = []; stack = []; cur = SS.start; board.snap(cur); updHud();
    board.hl = []; board.ghost = null; auto = true;
    let k = 0;
    const next = () => {
      if (screen !== 'play' || !auto || won) return;
      if (board.busy()) { setTimeout(next, 60); return; }
      if (k >= lv.sol.length) { auto = false; return; }
      act(lv.sol[k++], true);
      setTimeout(next, 90);
    };
    setTimeout(next, 400);
  }

  /* ---------- びんの絵 ---------- */
  let bottleN = 0;
  function openBottle(pic, done) {
    const ov = $('#bottle'), id = 'b' + (++bottleN);
    ov.innerHTML = `<div class="btl"><div class="bt">${A.ICON.bottle}</div><p class="tap">びんが一本、灯室の棚に置いてある。</p></div>`;
    ov.hidden = false; S.sfx('page');
    let stage = 0;
    const adv = () => {
      if (stage === 0) {
        stage = 1; S.sfx('cork');
        ov.innerHTML = `<div class="btl"><div class="pic">${pic.draw(id)}</div><p class="cap">${esc(pic.cap)}</p><p class="tap">（押すと、しまう）</p></div>`;
        setTimeout(() => { stage = 2; }, 900);
      } else if (stage === 2) { ov.hidden = true; ov.onclick = null; done && done(); }
    };
    ov.onclick = adv;
    setTimeout(() => { if (stage === 0) adv(); }, 2400);
  }
  function openGallery() {
    const ov = $('#gallery');
    const items = [...A.PICS.map((p, i) => ['p' + (i + 1), p]), ['last', A.LAST], ...(allGlass() || st.bottles.includes('old') ? [['old', A.OLD]] : [])];
    ov.innerHTML = `<div class="gal"><button type="button" class="x" style="position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.06);font-size:18px" data-k="x" aria-label="とじる">×</button><h2>びんの絵</h2><div class="grid">${items.map(([k, p], i) => st.bottles.includes(k) ? `<button type="button" class="it" data-i="${i}">${p.draw('g' + i)}<span>${esc(p.cap)}</span></button>` : '<div class="it no">？</div>').join('')}</div></div>`;
    ov.hidden = false;
    ov.onclick = (e) => {
      if (e.target === ov || e.target.closest('[data-k="x"]')) { ov.hidden = true; return; }
      const it = e.target.closest('[data-i]'); if (!it) return;
      const p = items[+it.dataset.i][1]; ov.hidden = true;
      openBottle(p, () => openGallery());
    };
  }

  /* ---------- おしまい ---------- */
  function ending() {
    const ov = $('#ending');
    const lit = K.ISLES.map((i) => i.n <= 7);
    ov.innerHTML = `<div class="endv"><div class="chartbox" id="e-chart">${A.chart(K.ISLES, { unlocked: 7, lit: lit.map(() => false), cur: 7, secret: false, beams: true, count: [], pre: 'en', night: true })}</div><p class="line" id="e-line"></p></div>`;
    ov.hidden = false;
    S.music(false); S.ambience(true, true);
    const lines = ['その夜、七つの灯台に、ひさしぶりの灯りがそろった。', '光をたどって、最後の船が島へ帰ってくる。'];
    const box = $('#e-chart');
    let k = 0;
    const lightOne = () => {
      if (k >= 7) return setTimeout(ferry, 1200);
      A.nightLamp($('svg', box), k, 'en');
      S.sfx('lit'); k++;
      if (k === 1) $('#e-line').textContent = lines[0];
      setTimeout(lightOne, 700);
    };
    const ferry = () => {
      $('#e-line').textContent = lines[1];
      const svg = $('svg', box);
      $('.top', svg).insertAdjacentHTML('beforeend', `<g id="e-ferry" transform="translate(1040 600)"><path d="M-30 0 L30 0 L22 12 L-22 12Z" fill="#f4efe6" stroke="#333" stroke-width="2"/><rect x="-12" y="-14" width="22" height="14" fill="#e0564a" stroke="#333" stroke-width="2"/><circle cx="-2" cy="-7" r="3" fill="#ffd24a"/><path d="M-40 14 q20 6 40 0 q20 -6 40 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/></g>`);
      const fe = $('#e-ferry', svg), P0 = A.SPOTS[0];
      const t0 = performance.now(), dur = 6500;
      const path = [[1040, 600], [760, 580], [480, 600], [P0.x + 70, P0.y + 40]];
      const step = (ms) => {
        const u = Math.min(1, (ms - t0) / dur), f = u * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), v = f - i;
        const x = path[i][0] + (path[i + 1][0] - path[i][0]) * v, y = path[i][1] + (path[i + 1][1] - path[i][1]) * v;
        fe.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        if (u < 1) requestAnimationFrame(step); else setTimeout(finalPic, 1200);
      };
      requestAnimationFrame(step);
    };
    const finalPic = () => {
      if (!st.bottles.includes('last')) st.bottles.push('last');
      st.ended = true; save();
      openBottle(A.LAST, () => { ov.hidden = true; openChart(); endCard(); });
      $('#bottle .tap').textContent = '船から降りてきた人が、灯台の前で何かを描いている。';
    };
    setTimeout(lightOne, 1400);
  }
  function endCard() {
    const ov = $('#clear');
    const mins = Math.max(1, Math.round(st.playMs / 60000));
    const peeked = MAIN.filter((l) => st.peek[l.id] >= 3).length;
    const gN = glassLevels.filter((l) => st.glass[l.id]).length;
    ov.innerHTML = `<div class="card endc"><h2>おしまい</h2><p>七つの灯台が、また毎晩灯るようになった。</p>
      <p class="stat"><i>遊んだ時間 約${mins}分</i><i>${A.ICON.shell}${shells()} / ${MAIN.length}</i></p>
      <p class="stat"><i>${A.ICON.glass}${gN} / ${glassLevels.length}</i><i>カモメに見せてもらった入り江 ${peeked}</i></p>
      ${allGlass() ? '<p style="font-size:14px">海図のすみに、見たことのない島がある。</p>' : '<p style="font-size:13px;color:var(--ink2)">入り江のどこかに、ガラスのかけらが落ちているらしい。</p>'}
      <div class="row"><button type="button" class="btn" data-k="gal">びんの絵</button><button type="button" class="btn big" data-k="chart">海図へ</button></div></div>`;
    ov.hidden = false;
    ov.onclick = (e) => { const k = e.target.closest('[data-k]'); if (!k) return; ov.hidden = true; ov.onclick = null; if (k.dataset.k === 'gal') { openChart(); openGallery(); } else openChart(); };
  }

  /* ---------- 操作 ---------- */
  $('#p-back').innerHTML = A.ICON.back;
  $('#p-back').addEventListener('click', () => { S.sfx('tap'); auto = false; openIsle(lv ? lv.isle : curIsle); });
  $('#p-gull').innerHTML = A.ICON.gull + '<i class="dot" id="p-dot" hidden></i>';
  $('#p-gull').addEventListener('click', openHint);
  $('#p-snd').addEventListener('click', toggleMute);
  $('#p-undo span').innerHTML = A.ICON.undo; $('#p-undo').addEventListener('click', undo);
  $('#p-reset span').innerHTML = A.ICON.reset; $('#p-reset').addEventListener('click', reset);
  $('#p-conch span').innerHTML = A.ICON.conch; $('#p-conch').addEventListener('click', () => { wake(); act('T'); });
  $('#tip').addEventListener('click', () => { $('#tip').hidden = true; });
  $$('#pad button').forEach((b) => {
    b.innerHTML = A.ICON.up;
    let rep = null;
    const go = (e) => { e.preventDefault(); wake(); act(b.dataset.a); clearInterval(rep); rep = setInterval(() => act(b.dataset.a), 210); b.classList.add('on'); };
    const stop = () => { clearInterval(rep); rep = null; b.classList.remove('on'); };
    b.addEventListener('pointerdown', go); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  });
  // なぞる
  let sw = null;
  $('#cv').addEventListener('pointerdown', (e) => { wake(); sw = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  $('#cv').addEventListener('pointerup', (e) => {
    if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
  });
  const KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ovOpen = $$('.ov').some((o) => !o.hidden);
    if (ovOpen) {
      if (e.key === 'Escape') { const h = $('#hint'); if (!h.hidden) h.hidden = true; const g = $('#gallery'); if (!g.hidden) g.hidden = true; }
      if ((e.key === 'Enter' || e.key === ' ') && !$('#clear').hidden) { const b = $('#clear .btn.big'); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    if (screen !== 'play') return;
    wake();
    if (KEYS[e.key]) { e.preventDefault(); act(KEYS[e.key]); }
    else if (e.key === ' ' || e.key === 'Enter' || e.key === 't' || e.key === 'T') { e.preventDefault(); act('T'); }
    else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace' || e.key === 'u') { e.preventDefault(); undo(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reset(); }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); openHint(); }
    else if (e.key === 'Escape') { openIsle(lv.isle); }
  });
  addEventListener('resize', () => { board.resize(); if (titleBoard) titleBoard.resize(); });

  /* ---------- 時間 ---------- */
  setInterval(() => {
    if (document.hidden) return;
    if (screen === 'play' && lv && !won && !auto && $('#hint').hidden) {
      st.ms[lv.id] = (st.ms[lv.id] || 0) + 1000;
      if ((st.ms[lv.id] / 1000) % 30 === 0) gullDot();
    }
  }, 1000);
  setInterval(() => { if (document.hidden || !st.intro) return; st.playMs += 5000; save(); }, 5000);
  document.addEventListener('visibilitychange', () => S.suspend(document.hidden));

  /* ---------- はじまり ---------- */
  sndBtn($('#c-snd')); sndBtn($('#p-snd'));
  function gold() { board.golden = !!st.golden; if (titleBoard) titleBoard.golden = !!st.golden; }
  initTitle(); gold();
  show('title');
  requestAnimationFrame(loop);
  const q = new URLSearchParams(location.search);
  if (q.has('lv') && BY[q.get('lv')]) openLevel(q.get('lv'));
  else if (q.has('chart')) openChart();

  /* ---------- 検証用 ---------- */
  window.__yk = {
    get st() { return st; }, BY, ALL, MAIN, board,
    go: (id) => openLevel(id), isle: (n) => openIsle(n), chart: () => openChart(),
    act: (s) => { for (const a of s) { board.skip(); act(a); } board.skip(); return { p: cur.p, T: cur.T, won }; },
    sol: () => { board.skip(); for (const a of lv.sol) { board.skip(); act(a); } board.skip(); return won; },
    skip: () => board.skip(), frame: () => { const a = active; if (a) a.frame(performance.now()); },
    cur: () => cur, lv: () => lv, won: () => won,
    solveAll: (n) => { for (const l of ALL.filter((x) => !n || x.isle === n)) { st.solved[l.id] = true; if (st.best[l.id] == null) st.best[l.id] = l.sol.length; } save(); },
    hint: openHint, ending, openBottle, endCard, ms: (id, m) => { st.ms[id] = m * 60000; gullDot(); },
  };
})();
