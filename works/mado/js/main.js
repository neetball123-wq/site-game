/* ふたつの窓 — はじまり（どの部屋を開くか・時間を進める） */
(() => {
  const G = MD.G, UI = MD.UI;
  const $ = (s) => document.querySelector(s);
  const app = $('#app'), title = $('#title');
  const Q = new URLSearchParams(location.search);
  const ROOMS = ['a', 'b', 'c', 'ab'];

  MD.urlFor = (room) => `${location.pathname}?room=${room}`;
  MD.mode = '';

  /* 試験用：?stage=名前 で、その段階から */
  if (Q.has('reset')) MD.reset();
  if (Q.has('stage')) MD.act((S) => { Object.assign(S, MD.fresh()); G.skipTo(S, Q.get('stage')); });

  /* ---- 部屋を組み立てる ---- */
  const narrow = () => matchMedia('(max-width: 899px), (orientation: portrait)').matches;
  const build = (mode) => {
    MD.mode = mode; MD.here = mode;
    UI.panes.length = 0;
    app.innerHTML = '';
    app.className = `app ${mode === 'ab' ? 'split' : 'single'}`;
    title.hidden = true; app.hidden = false;
    const rooms = mode === 'ab' ? ['a', 'b'] : [mode];
    for (const r of rooms) UI.makePane(r, app);
    if (mode === 'ab') setFocus(app.dataset.focus || 'a');
    MD.present(rooms);
    document.title = document.title.replace(/^[^｜]*/, mode === 'ab' ? 'ふたつの窓' : `${MD.ROOMS[mode].name}（ふたつの窓）`);
    renderAll();
  };
  const setFocus = (r) => {
    app.dataset.focus = r;
    for (const P of UI.panes) { P.el.classList.toggle('focus', P.room === r); P.el.classList.toggle('compact', P.room !== r); }
  };
  UI.compactTap = (P, e) => {
    if (MD.mode !== 'ab' || !narrow() || !P.el.classList.contains('compact')) return false;
    e.preventDefault(); setFocus(P.room); renderAll(); return true;
  };
  addEventListener('resize', () => { if (MD.mode === 'ab') setFocus(app.dataset.focus || 'a'); });

  MD.switchMode = (m) => { MD.setRoom(m); build(m); };

  const renderAll = () => {
    if (!MD.mode) return;
    if (!MD.S.started) { showTitle(); return; }
    for (const P of UI.panes) {
      if (MD.S.ended && !P.L.endShown) { P.L.endShown = true; P.L.sheet = 'end'; P.L.view = null; }
      if (!MD.S.ended) P.L.endShown = false;
      try { UI.render(P); } catch (e) { console.error(e); }
    }
  };
  MD.onChange(renderAll);

  /* ---- むかいの窓を開く ---- */
  UI.openOther = (P) => {
    const o = G.other(P.room), name = o === 'a' ? 'ソウ' : 'イト';
    if (MD.others()[o]) {
      let w = null; try { w = window.open('', 'mado-' + o); } catch (e) { }
      if (w && w.location && w.location.href === 'about:blank') { try { w.close(); } catch (e) { } w = null; }
      P.L.local = { text: `${name}の部屋は、べつのタブで開いています。タブを切りかえてみて。` }; P.L.lastMsg = MD.S.msg[P.room].n; P.L.localN = P.L.lastMsg;
      UI.render(P);
      try { w && w.focus(); } catch (e) { }
      return;
    }
    openTab(P, o);
  };
  const openTab = (P, o) => {
    let w = null;
    try { w = window.open(MD.urlFor(o), 'mado-' + o); } catch (e) { }
    if (!w) { P.L.sheet = 'popup'; UI.render(P); return; }
    const name = o === 'a' ? 'ソウ' : 'イト';
    P.L.local = { text: `${name}の部屋が、新しいタブで開きました。ふたつのタブを行き来して遊びます。` }; P.L.lastMsg = MD.S.msg[P.room].n; P.L.localN = P.L.lastMsg;
    UI.render(P);
    setTimeout(() => {
      if (MD.mode === P.room && !MD.others()[o]) { P.L.local = { text: `${name}の部屋とつながっていないようです。うまくいかないときは、メニューから「ひとつの画面にならべる」をためしてください。` }; P.L.localN = MD.S.msg[P.room].n; UI.render(P); }
    }, 9000);
  };

  /* ---- 表紙 ---- */
  const showTitle = () => {
    MD.mode = ''; MD.present([]);
    app.hidden = true; app.innerHTML = ''; UI.panes.length = 0;
    title.hidden = false;
    const S = MD.S, o = MD.others();
    const cont = S.started ? `<div class="tt-cont"><p>つづきから</p><div class="tt-row"><button type="button" data-t="a">ソウの部屋</button><button type="button" data-t="b">イトの部屋</button><button type="button" data-t="ab">ならべる</button>${o.a && o.b ? '<button type="button" data-t="c" class="tt-c">……三つめの窓</button>' : ''}</div></div>` : '';
    $('#tt-go').innerHTML = (S.started ? '' : '<button type="button" class="pri" data-t="tabs">ふたつのタブで遊ぶ<small>この窓がソウの部屋、新しいタブがイトの部屋</small></button><button type="button" data-t="ab">ひとつの画面にならべる<small>スマホや、タブがうまく使えないときに</small></button>') + cont;
  };
  title.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    MD.snd && MD.snd.wake();
    const t = b.dataset.t;
    MD.act((S) => { S.started = true; });
    if (t === 'tabs') {
      MD.setRoom('a'); build('a');
      openTab(UI.panes[0], 'b');
      return;
    }
    MD.setRoom(t); build(t);
  });

  /* ---- どの部屋で開くか ---- */
  const pick = () => {
    const q = Q.get('room');
    if (ROOMS.includes(q)) { MD.setRoom(q); if (!MD.S.started) MD.act((S) => { S.started = true; }); return q; }
    const s = MD.getRoom();
    if (ROOMS.includes(s) && MD.S.started) return s;
    if (!MD.S.started) return '';
    const o = MD.others();
    if (o.a && o.b) return 'c';
    if (o.a) return 'b';
    if (o.b) return 'a';
    return '';
  };
  const first = pick();
  if (first) { MD.setRoom(first); build(first); } else showTitle();

  /* ---- 毎コマ ---- */
  const loop = (t) => {
    for (const P of UI.panes) { try { UI.frame(P, t); } catch (e) { console.error(e); } }
    MD.snd && MD.snd.update(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ---- 時間で起きること（かごの到着・猫・台風の目） ---- */
  setInterval(() => {
    if (document.hidden || !MD.mode) return;
    const S = MD.S, now = Date.now();
    const maybe = S.basket.at === 'move' || (S.cat === 'eave' && S.f.bait) || S.f.catGo || (S.f.eyeAt && !S.f.eye);
    if (!maybe) return;
    MD.act((S2) => (G.tick(S2, now) ? undefined : false));
  }, 250);

  /* ---- 遊んだ時間（見えていて、手前にあるときだけ） ---- */
  setInterval(() => {
    if (document.hidden || !MD.mode || !MD.S.started || MD.S.ended) return;
    if (MD.mode !== 'ab' && !document.hasFocus()) return;
    MD.act((S) => { S.playMs = (S.playMs || 0) + 5000; const st = G.stage(S); S.clock[st] = (S.clock[st] || 0) + 5000; }, true);
    for (const P of UI.panes) if (P.L.sheet === 'hint') UI.render(P);
  }, 5000);

  /* 試験用 */
  window.__md = { S: () => MD.S, act: MD.act, G, UI, build, skip: (st) => MD.act((S) => { Object.assign(S, MD.fresh()); G.skipTo(S, st); }), tap: (room, h, item) => { const P = UI.panes.find((p) => p.room === room); let out; MD.act((S) => { out = /^v[abc]_/.test(h) ? G.viewTap(S, room, h, item) : G.tap(S, room, h, item); }); return out; } };
})();
