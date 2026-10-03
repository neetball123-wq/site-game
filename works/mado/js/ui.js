/* ふたつの窓 — 画面（部屋ごとの窓・手もと・ことば・重なる画面） */
(() => {
  const G = MD.G, A = MD.art, I = MD.ITEMS;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const UI = { panes: [] };
  let uid = 0;

  /* ---- 状態を変えて、画面の指示を受けとる ---- */
  const run = (fn) => { let out; MD.act((S) => { out = fn(S); }); return out; };

  /* ---- 部屋の窓（ペイン）を作る ---- */
  UI.makePane = (room, host) => {
    const R = MD.ROOMS[room];
    const el = document.createElement('section');
    el.className = `pane pane-${room}`;
    el.dataset.room = room;
    el.innerHTML = `<header class="ph"><div class="ph-t"><b>${R.name}</b><small>${R.sub}</small></div>`
      + `<div class="ph-r">${room === 'a' ? '<span class="ph-clock" title="目覚まし時計"></span>' : ''}<span class="ph-peer"></span>`
      + `<button type="button" class="ph-b" data-ui="hint" aria-label="ヒント">ヒント</button>`
      + `${room !== 'c' ? '<button type="button" class="ph-b ph-other" data-ui="other"><span class="l">むかいの窓</span><span class="s">むかい</span></button>' : ''}`
      + `<button type="button" class="ph-b" data-ui="menu" aria-label="メニュー">≡</button></div></header>`
      + `<div class="stage"><div class="box"><svg class="scene" viewBox="0 0 600 540" aria-label="${R.name}"></svg><canvas class="rain rain-s"></canvas><div class="ov" hidden></div><div class="fl"></div></div></div>`
      + `<div class="acts" hidden></div><div class="talk" hidden></div>`
      + `<div class="bar"><div class="items" role="list"></div></div><p class="msg" aria-live="polite"></p>`
      + `<div class="sheet" hidden></div>`;
    host.appendChild(el);
    const P = {
      room, el, pre: room + (++uid),
      scene: $('.scene', el), box: $('.box', el), ov: $('.ov', el), sheet: $('.sheet', el), talk: $('.talk', el),
      items: $('.items', el), msg: $('.msg', el), acts: $('.acts', el), rainS: $('.rain-s', el), fl: $('.fl', el),
      L: { sel: null, view: null, sheet: null, photo: 0, clock: 192, lastMsg: -1, local: null },
      drops: new Map(), lastFx: MD.S.fx.n, fx: null,
    };
    el.addEventListener('click', (e) => onClick(P, e));
    UI.panes.push(P);
    return P;
  };

  /* ---- ことば（下の文） ---- */
  const localSay = (P, text) => { P.L.local = { text, t: Date.now() }; drawMsg(P, true); };
  const drawMsg = (P, force) => {
    const S = MD.S, m = S.msg[P.room];
    let text = m.text;
    if (P.L.local && (m.n === P.L.localN || force)) text = P.L.local.text;
    if (m.n !== P.L.lastMsg) { P.L.lastMsg = m.n; P.L.localN = m.n; if (!force) { P.L.local = null; text = m.text; } }
    if (P.L.local && force) P.L.localN = m.n;
    if (!text) text = firstText(P.room, S);
    if (P.msg.textContent !== text) { P.msg.textContent = text; P.msg.classList.remove('in'); void P.msg.offsetWidth; P.msg.classList.add('in'); }
  };
  const firstText = (r, S) => {
    if (r === 'a') return S.f.torchOn ? '' : '停電した。まっくらな部屋で、机の上のラジオだけが、小さな明かりをつけて鳴っている。';
    if (r === 'b') return S.f.bCur ? 'ひっこしの段ボールでいっぱいの部屋。今夜が、この部屋のさいごの夜だ。' : 'まっくらだ。ひっこしの段ボールのにおいがする。窓には、カーテンが閉まったまま。';
    return 'だれもいない部屋。カチ、とも、コチ、とも言わない。';
  };

  /* ---- 描く ---- */
  UI.render = (P) => {
    const S = MD.S, r = P.room;
    // 部屋
    const svg = r === 'a' ? A.roomA(S, P.pre) : r === 'b' ? A.roomB(S, P.pre) : A.roomC(S, P.pre);
    P.scene.innerHTML = svg;
    if (P.L.sel) { const h = P.scene.querySelectorAll('.hs'); h.forEach((x) => x.classList.add('can')); }
    // 雨の窓の位置
    const rc = P.scene.querySelector('.raincv');
    if (rc) { const [x, y, w, h] = rc.dataset.r.split(',').map(Number); Object.assign(P.rainS.style, { left: `${x / 6}%`, top: `${y / 5.4}%`, width: `${w / 6}%`, height: `${h / 5.4}%` }); }
    P.rainS.style.display = (r === 'a' && !S.f.aCur) || (r === 'b' && !S.f.bCur) ? 'none' : '';
    // 見出し
    const clk = $('.ph-clock', P.el); if (clk) clk.textContent = MD.fmtTime(S.time);
    const peer = $('.ph-peer', P.el);
    if (peer) {
      if (r === 'c' || MD.mode === 'ab') peer.textContent = '';
      else { const on = MD.others()[G.other(r)]; peer.textContent = on ? 'むかいの窓 ●' : 'むかいの窓 ○'; peer.classList.toggle('on', !!on); peer.title = on ? 'むかいの部屋は、べつのタブで開いています' : 'むかいの部屋は、まだ開いていません'; }
    }
    // 手もと
    const inv = S.ended && r !== 'a' ? [] : S.inv[r];
    P.items.innerHTML = S.ended && r === 'b' ? '<p class="it-none">荷物は、みんなトラックの中。</p>' : inv.length ? inv.map((id) => `<button type="button" class="it${P.L.sel === id ? ' sel' : ''}" data-it="${id}" role="listitem" aria-pressed="${P.L.sel === id}">${A.icon(id)}<span>${esc(I[id].name)}${id === 'photos' ? `（${S.photos.length}）` : ''}</span></button>`).join('') : '<p class="it-none">手もとには、何もない。</p>';
    if (P.L.sel && !inv.includes(P.L.sel)) P.L.sel = null;
    drawMsg(P);
    drawTalk(P);
    drawOv(P);
    drawSheet(P);
    P.el.classList.toggle('ended', !!S.ended);
    P.el.classList.toggle('eye', !!S.f.eye && !S.ended);
  };

  /* ---- 会話 ---- */
  const drawTalk = (P) => {
    const T = MD.S.talk;
    if (!T || P.room === 'c' || MD.S.ended) { P.talk.hidden = true; return; }
    const line = T.lines[T.i]; if (!line) { P.talk.hidden = true; return; }
    const me = P.room === 'a' ? 'so' : 'ito';
    const who = line.who === 'n' ? '' : line.who === me ? (me === 'so' ? 'ソウ' : 'イト') : (line.who === 'so' ? 'ソウ' : 'イト');
    const far = line.who !== 'n' && line.who !== me;
    P.talk.hidden = false;
    const bar = P.el.querySelector('.bar');
    P.talk.style.minHeight = Math.max(100, bar.offsetHeight + P.msg.offsetHeight + 12) + 'px';
    P.talk.className = `talk ${line.who === 'n' ? 'tk-n' : far ? 'tk-far' : 'tk-me'}`;
    P.talk.innerHTML = `${who ? `<b class="tk-who">${who}${far && MD.S.f.phone && !MD.S.f.eye ? '<i>（糸電話）</i>' : ''}</b>` : ''}<p class="tk-text">${esc(line.text)}</p><span class="tk-next">${T.i + 1}/${T.lines.length}　▼</span>`;
  };

  /* ---- 窓の外・写真・幻灯 ---- */
  const drawOv = (P) => {
    const v = P.L.view, S = MD.S;
    P.acts.hidden = !(v === 'win' || v === 'photos');
    if (!v) { P.ov.hidden = true; P.ov.innerHTML = ''; P.ov.dataset.v = ''; P.acts.innerHTML = ''; return; }
    P.ov.hidden = false;
    if (v === 'win') {
      const f = P.room === 'a' ? A.viewA : P.room === 'b' ? A.viewB : A.viewC;
      if (P.ov.dataset.v !== 'win') {
        P.ov.innerHTML = `<div class="ov-win"><svg class="v-back" viewBox="0 0 600 540"></svg><canvas class="rain rain-v"></canvas><svg class="v-front" viewBox="0 0 600 540"></svg></div><button type="button" class="ov-x" data-ui="close" aria-label="部屋にもどる">部屋にもどる</button>`;
        P.ov.dataset.v = 'win';
      }
      $('.v-back', P.ov).innerHTML = f(S, P.pre + 'v', 'back');
      $('.v-front', P.ov).innerHTML = f(S, P.pre + 'v', 'front');
      if (P.L.sel) P.ov.querySelectorAll('.hs').forEach((x) => x.classList.add('can'));
      P.acts.innerHTML = winActs(P);
      return;
    }
    if (v === 'photos') {
      const n = S.photos.length, i = Math.min(P.L.photo, n - 1);
      P.ov.dataset.v = v;
      P.ov.innerHTML = n ? `<div class="ov-photo">${A.photo(S.photos[i], P.pre + 'ph' + i)}</div><button type="button" class="ov-x" data-ui="close">とじる</button>` : '<p class="ov-empty">写真はまだない。</p><button type="button" class="ov-x" data-ui="close">とじる</button>';
      P.acts.innerHTML = n ? `<button type="button" data-do="ph-1" ${i <= 0 ? 'disabled' : ''}>◀ まえ</button><span class="ov-count">${i + 1} / ${n}</span><button type="button" data-do="ph+1" ${i >= n - 1 ? 'disabled' : ''}>つぎ ▶</button>` : '';
      return;
    }
    if (v === 'proj' || v === 'projA') {
      const side = v === 'proj' ? 'b' : 'a';
      if (P.ov.dataset.v !== v) {
        P.ov.dataset.v = v;
        P.ov.innerHTML = `<div class="ov-proj"><div class="pj-scr"></div><p class="pj-msg"></p>`
          + (side === 'b' ? `<div class="pj-ctl"><label class="pj-focus">ピント<input type="range" min="0" max="100" step="1" value="${S.focus}" data-in="focus"></label><div class="pj-btns"><button type="button" data-do="fr-1">◀ コマ</button><button type="button" data-do="fr+1">コマ ▶</button><button type="button" data-do="flipV">フィルムの上下を入れかえる</button><button type="button" data-do="flipH">フィルムをうら返す</button></div></div>` : '<p class="pj-note">ソウの窓から見た、イトの部屋のシーツ。（ピントとコマは、イトが動かす）</p>')
          + `</div><button type="button" class="ov-x" data-ui="close">とじる</button>`;
      }
      projUpdate(P, side);
      return;
    }
    if (v === 'clockset') {
      const m = P.L.clock, ha = ((m / 60) % 12) * 30, ma = (m % 60) * 6, rad = (d) => d * Math.PI / 180;
      P.ov.dataset.v = v;
      P.ov.innerHTML = `<div class="ov-clock"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#efe6d2" stroke="#3a2a1a" stroke-width="8"/>${Array.from({ length: 12 }, (_, k) => `<text x="${100 + 72 * Math.sin(rad(k * 30 || 360))}" y="${106 - 72 * Math.cos(rad(k * 30 || 360))}" text-anchor="middle" font-size="16" font-family="serif" fill="#3a2a1a">${['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][k]}</text>`).join('')}`
        + `<path d="M100 100l${(44 * Math.sin(rad(ha))).toFixed(1)} ${(-44 * Math.cos(rad(ha))).toFixed(1)}" stroke="#222" stroke-width="6" stroke-linecap="round"/><path d="M100 100l${(66 * Math.sin(rad(ma))).toFixed(1)} ${(-66 * Math.cos(rad(ma))).toFixed(1)}" stroke="#222" stroke-width="3.5" stroke-linecap="round"/><circle cx="100" cy="100" r="5" fill="#222"/></svg>`
        + `<p class="ov-cl-t">${MD.fmtClock(m)}</p><div class="ov-acts"><button type="button" data-do="ck-60">時 −</button><button type="button" data-do="ck+60">時 ＋</button><button type="button" data-do="ck-10">分 −10</button><button type="button" data-do="ck+10">分 ＋10</button><button type="button" class="pri" data-do="ckset">この時刻に合わせる</button></div></div><button type="button" class="ov-x" data-ui="close">とじる</button>`;
      return;
    }
  };
  const projOK = (S, side) => S.f.filmOn && S.f.screen && S.aim === 'glass' && G.torchA(S) && !S.f.candle;
  const projUpdate = (P, side) => {
    const S = MD.S, scr = $('.pj-scr', P.ov), msg = $('.pj-msg', P.ov);
    if (!scr) return;
    let note = '';
    if (!S.f.screen) note = 'スクリーンがない。白い布を、光の通り道に。';
    else if (!S.f.filmOn) note = 'シーツは白いまま。フィルムが、まだ窓にはられていない。';
    else if (!(S.aim === 'glass' && G.torchA(S))) note = side === 'b' ? 'シーツはまっくら。フィルムに、強い光が当たっていない。' : 'シーツはまっくら。（フィルムを照らしていない）';
    else if (S.f.candle) note = 'ろうそくの灯りで、シーツの上の絵がうすくて、ほとんど見えない。';
    if (note) { scr.innerHTML = `<svg viewBox="0 0 360 240"><rect width="360" height="240" fill="${S.f.candle && S.f.filmOn ? '#e8dcc8' : '#121212'}"/></svg>`; msg.textContent = note; return; }
    scr.innerHTML = `<svg viewBox="0 0 360 240">${A.projOn(S, 0, 0, 360, 240, P.pre + 'pj', side)}</svg>`;
    const err = Math.abs(S.focus - 62), up = A.projUpright(S, side), how = A.projHow(S, side);
    const k = S.frame + 1;
    msg.textContent = err > 7 ? `${k}コマめ。……ぼやけている。${side === 'b' ? '虫めがねを動かして、ピントを合わせよう。' : ''}` : !up ? `${k}コマめ。うつってはいる。……でも、${side === 'b' ? '' : 'こちらから見ると、'}${how}。` : `${k}コマめ。${MD.FRAMES[S.frame].date ? '……' + MD.FRAMES[S.frame].date : ''}`;
    if (err <= 7 && up && !S.frames[S.frame] && !S.talk) {
      const i = S.frame;
      MD.act((S2) => {
        if (S2.frames[i] || S2.talk || S2.frame !== i) return false;
        S2.frames[i] = true;
        G.startTalk(S2, 'f' + i, MD.FRAMES[i].lines.map(([who, text]) => ({ who, text })));
      });
    }
  };

  /* 窓の外のボタン */
  const winActs = (P) => {
    const S = MD.S, r = P.room;
    if (S.ended) return '<span class="ov-note">雨あがりの朝。</span>';
    let h = '';
    if (r === 'a') {
      h += `<button type="button" data-do="win">${S.f.aWin ? '窓をしめる' : '窓をあける'}</button>`;
      if (G.torchA(S) && S.aim) h += `<button type="button" data-do="off">光を消す</button><button type="button" data-do="blink">点滅</button>`;
      if (G.has(S, 'a', 'weighted')) h += `<button type="button" class="pri" data-do="throw" ${S.f.aWin ? '' : 'disabled'}>糸を投げる${S.f.aWin ? '' : '（窓をあけて）'}</button>`;
      if (G.torchA(S) && !S.aim) h += '<span class="ov-note">照らしたい所をタップ</span>';
    }
    if (r === 'b') {
      h += `<button type="button" data-do="win">${S.f.bWin ? '窓をしめる' : '窓をあける'}</button>`;
      if (G.has(S, 'b', 'camera')) h += '<button type="button" data-do="shoot">写真を撮る</button>';
    }
    if (S.f.basket && r !== 'c') {
      const B = S.basket, here = B.at === r, there = B.at === G.other(r);
      const what = B.item ? (B.item === 'cat' ? 'ボタン' : I[B.item].name) : 'からっぽ';
      h += `<span class="bk-st">かご：${B.at === 'move' ? '移動中' : here ? `こちら（${what}）` : `むこう（${what}）`}</span>`;
      if (here) {
        if (B.item) h += '<button type="button" data-do="bk-take">とり出す</button>';
        else if (S.cat === r && S.f.eye) h += '<button type="button" data-do="bk-cat">ボタンを入れる</button>';
        if (!B.item) h += `<button type="button" data-do="bk-put" ${P.L.sel ? '' : 'disabled'}>${P.L.sel ? `${esc(I[P.L.sel].name)}を入れる` : '入れる（手もとの物を選ぶ）'}</button>`;
        h += '<button type="button" class="pri" data-do="bk-send">送る</button>';
      } else if (there) h += '<button type="button" data-do="bk-pull">たぐりよせる</button>';
    }
    return h;
  };

  /* ---- 手もとの物・読みもの・ヒント・メニュー（上に重なる紙） ---- */
  const drawSheet = (P) => {
    const v = P.L.sheet, S = MD.S;
    if (!v) { P.sheet.hidden = true; P.sheet.innerHTML = ''; return; }
    const keep = P.sheet.dataset.v === v ? (P.sheet.querySelector('.sh-in') || {}).scrollTop || 0 : 0;
    P.sheet.hidden = false; P.sheet.dataset.v = v;
    let h = '';
    if (v.startsWith('item:')) {
      const id = v.slice(5);
      if (!S.inv[P.room].includes(id)) { P.L.sheet = null; P.sheet.hidden = true; return; }
      const acts = G.itemActions(S, P.room, id);
      h = `<div class="sh-item"><div class="sh-ic">${A.icon(id)}</div><h3>${esc(I[id].name)}</h3><p>${esc(G.itemDesc(S, P.room, id))}</p>`
        + `<div class="sh-acts">${acts.map(([k, l]) => `<button type="button" data-do="it:${k}">${esc(l)}</button>`).join('')}</div>`
        + `<p class="sh-tip">使うときは、これを選んだまま部屋の中をタップ。ほかの物をタップすると組み合わせる。</p></div>`;
    } else if (v.startsWith('read:')) {
      const R = A.read(v.slice(5), S);
      h = `<div class="sh-read"><h3>${esc(R.title)}</h3>${R.html}</div>`;
    } else if (v === 'hint') h = hintHTML(P);
    else if (v === 'menu') h = menuHTML(P);
    else if (v === 'sleep') h = sleepHTML(P);
    else if (v === 'reset') h = '<div class="sh-conf"><h3>はじめから</h3><p>ふたつの窓の記録を消して、停電した夜の最初にもどります。ほかのタブで開いている部屋も、最初にもどります。</p><div class="sh-acts"><button type="button" class="pri" data-do="reset">はじめからにする</button><button type="button" data-ui="closeSheet">やめる</button></div></div>';
    else if (v === 'end') h = endHTML(P);
    else if (v === 'about') h = '<div class="sh-read"><h3>ふたつの窓</h3><p>路地をはさんでむかいあう、ふたつの部屋。ひとつのタブにひとつの部屋を開いて、行き来しながら遊びます。</p><p>パソコンなら、ふたつのウィンドウを左右にならべると、窓どうしが見えやすくなります。スマホは「ひとつの画面にならべる」がおすすめです。</p><p class="r-n">本作品はフィクションです。登場する人物・店・台風は、実在のものとは関係ありません。</p></div>';
    else if (v === 'popup') h = `<div class="sh-conf"><h3>むかいの窓を開く</h3><p>新しいタブを開けませんでした。下のリンクから開いてください。</p><p><a class="lnk" href="${esc(MD.urlFor(G.other(P.room)))}" target="_blank" rel="opener">${P.room === 'a' ? 'イト' : 'ソウ'}の部屋を、新しいタブで開く</a></p><p>うまくいかないときは、ひとつの画面にならべて遊べます。</p><div class="sh-acts"><button type="button" data-do="mode:ab">ひとつの画面にならべる</button><button type="button" data-ui="closeSheet">とじる</button></div></div>`;
    P.sheet.innerHTML = `<div class="sh-in">${h}</div>${v === 'end' ? '' : '<button type="button" class="sh-x" data-ui="closeSheet" aria-label="とじる">とじる</button>'}`;
    const inn = P.sheet.querySelector('.sh-in'); if (inn && keep) inn.scrollTop = keep;
  };
  const fmtLeft = (ms) => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const hintHTML = (P) => {
    const S = MD.S, st = G.stage(S);
    if (st === 'end') return '<div class="sh-read"><h3>こまったときは</h3><p>夜は、明けた。</p></div>';
    const D = MD.STAGES[st], lv = S.hintLv[st] || 0, t = S.clock[st] || 0;
    let h = `<div class="sh-read sh-hint"><h3>こまったときは</h3><p class="hn-goal">いまの目当て：<b>${esc(D.goal)}</b></p>`;
    for (let k = 0; k < lv; k++) h += `<p class="hn-l"><span>${k < 2 ? `ひらめき ${k + 1}` : 'こたえ'}</span>${esc(D.hints[k])}</p>`;
    if (lv < 3) {
      const left = G.HINT_AT[lv] - t;
      h += left > 0 ? `<p class="hn-wait">もう少し、自分たちで考えてみよう。（${lv < 2 ? 'つぎのひらめき' : 'こたえ'}まで、あと${fmtLeft(left)}）<br><small>画面が見えているあいだだけ、時間が進みます。</small></p>` : `<div class="sh-acts"><button type="button" class="pri" data-do="hint+">${lv < 2 ? `ひらめき ${lv + 1} を見る` : 'こたえを見る'}</button></div>`;
    }
    return h + '<p class="r-n">ヒントは、ふたつの部屋で共通です。</p></div>';
  };
  const menuHTML = (P) => {
    const m = MD.mode, snd = MD.snd && MD.snd.on();
    return `<div class="sh-menu"><h3>メニュー</h3><div class="sh-acts col">`
      + `<button type="button" data-do="snd">音：${snd ? 'あり' : 'なし'}</button>`
      + (m !== 'ab' ? '<button type="button" data-do="mode:ab">ひとつの画面に、ふたつの部屋をならべる</button>' : '<button type="button" data-do="mode:a">この窓を、ソウの部屋だけにする</button><button type="button" data-do="mode:b">この窓を、イトの部屋だけにする</button>')
      + (m === 'a' ? '<button type="button" data-do="mode:b">この窓を、イトの部屋にかえる</button>' : m === 'b' ? '<button type="button" data-do="mode:a">この窓を、ソウの部屋にかえる</button>' : '')
      + '<button type="button" data-ui="about">この作品について</button><button type="button" data-ui="reset">はじめから</button></div></div>';
  };
  const sleepHTML = (P) => {
    const S = MD.S;
    const catAt = S.cat === 'a' ? 'ソウの部屋' : S.cat === 'b' ? 'イトの部屋' : 'かごの中';
    const ga = S.inv.a.filter((id) => (S.from[id] || I[id].from) === 'b').map((id) => I[id].name);
    const gb = S.inv.b.filter((id) => (S.from[id] || I[id].from) === 'a').map((id) => I[id].name);
    const busy = S.cat === 'basket' || S.basket.at === 'move';
    return `<div class="sh-conf"><h3>朝まで、ねむる</h3><p>ボタンは、いま<b>${catAt}</b>にいる。</p>`
      + `<p>イトからソウへ：${ga.length ? esc(ga.join('、')) : '（なし）'}<br>ソウからイトへ：${gb.length ? esc(gb.join('、')) : '（なし）'}</p>`
      + (busy ? '<p class="warn">かごが、まだ路地の上にある。</p>' : '<p>ねむると、朝になります。</p>')
      + `<div class="sh-acts"><button type="button" class="pri" data-do="sleep" ${busy ? 'disabled' : ''}>ねむる</button><button type="button" data-ui="closeSheet">まだ起きている</button></div></div>`;
  };

  /* ---- 朝（結末） ---- */
  const GIFT_A = { photos: (S) => `手もとには、イトが撮った写真が残った。${S.f.starPhoto ? '星の下の、ソウの窓。' : '雨の夜の、ソウの窓。'}`, letter: (S) => `封筒の中の手紙。いちばん最後に、「三回。」と書いてあった。${S.f.cNote ? '……三回は、「ごめんね」。時計屋のノートの、さいごのページの端に書いてあった。' : 'ソウは、三回の意味を知らない。'}`, camera: () => 'イトのカメラが、ソウの手もとに残った。', mirror: () => '丸い手鏡。角のむこうを、また見るときのために。', album: () => '写真館のアルバム。最後のページは、空いている。', film: () => 'じいちゃんのフィルムは、ソウがあずかることになった。', lens: () => '虫めがね。', canB: () => '「いと」の缶。' };
  const GIFT_B = { torch: () => 'ソウの懐中電灯は、イトのかばんに入った。むこうでも、夜になったら、つけるつもりだ。', clock: () => 'じいちゃんが直した目覚まし時計が、かばんの中で、チクタク鳴っている。', coins: () => '五円玉が、ひとつかみ。ご縁が、ありますように。', reel: () => '凧糸の糸巻き。' };
  UI.endText = (S, r) => {
    const stay = S.ending === 'stay';
    const title = stay ? 'ここで、まってる' : 'いっしょに、いく';
    const g = (S.gifts || {})[r] || [];
    const p = [];
    if (r === 'a') {
      p.push('目がさめると、雨はあがっていた。窓の外は、洗ったみたいな青空だった。');
      p.push('九時。路地に、大きなトラックが入ってきた。写真館から、段ボールが、鏡台が、ベッドが運び出されていく。');
      p.push(stay ? 'ボタンは、ソウの窓ぎわでまるくなっていた。トラックが角を曲がるまで、ソウとボタンは、窓から見送った。' : 'トラックの窓から、イトが手をふった。イトのひざの上で、ボタンがあくびをした。');
      p.push('むかいの窓は、からっぽになった。くもったガラスに、内がわから指で書いた字が残っていた。外から読むと、ちゃんと読めた。<b class="en-big">またね</b>');
      for (const id of g) p.push((GIFT_A[id] || (() => `${I[id].name}も、ソウの手もとに残った。`))(S));
      if (S.f.phone) p.push('窓ぎわの缶から、糸が一本、まだ路地のほうへのびている。その先は、もうだれにもつながっていない。……でも、ソウは糸を切らなかった。');
      if (S.f.cDone) p.push('その朝、かごの中に、小さな包みがひとつ入っていた。「時田時計店」の包み紙。中には、裏に「そう」と彫られた懐中時計。カチ、コチと、動いていた。');
    } else if (r === 'b') {
      p.push('朝。段ボールも、鏡台も、ベッドも、トラックに積まれていった。');
      p.push('からっぽになった部屋で、イトは最後に窓をあけた。むかいの窓で、ソウが手をあげた。');
      p.push('くもったガラスに、指で字を書いた。外から読めるように、さかさまに。<b class="en-big">またね</b>');
      for (const id of g) p.push((GIFT_B[id] || (() => `${I[id].name}は、イトのかばんに入った。`))(S));
      p.push(stay ? 'ボタンは、ソウの窓ぎわで、こちらを見ていた。' : 'ボタンは、イトの腕のなかにいた。');
      if (S.f.cDone) p.push('イトのかばんにも、同じ包みがひとつ。いつ入れたのか、だれにもわからなかった。懐中時計の裏には、「いと」。');
      p.push('階段をおりる前に、一度だけふりかえった。窓は、むかいあったままだった。');
    } else {
      p.push(`朝。時計屋の二階には、だれもいない。柱時計だけが${S.f.cDone ? '、カチ、コチと時をきざんでいる' : '、三時十二分のまま止まっている'}。`);
      p.push('窓の外を、トラックが通りすぎていった。');
    }
    return { title, p };
  };
  const endHTML = (P) => {
    const S = MD.S, E = UI.endText(S, P.room);
    const min = Math.max(1, Math.round((S.playMs || 0) / 60000));
    return `<div class="sh-end"><p class="en-k">ふたつの窓　${P.room === 'a' ? 'ソウの朝' : P.room === 'b' ? 'イトの朝' : '三つめの窓'}</p><h3>${E.title}</h3>${E.p.map((t) => `<p>${t}</p>`).join('')}`
      + `<p class="en-stat">遊んだ時間 約${min}分　撮った写真 ${S.photos.length}枚　かごの往復 ${S.trips}回${S.f.cDone ? '　時計店の灯り' : ''}</p>`
      + `<p class="r-n">${P.room === 'c' ? '' : `もうひとつの窓（${P.room === 'a' ? 'イト' : 'ソウ'}の部屋）にも、朝が来ています。`}</p>`
      + '<div class="sh-acts"><button type="button" class="pri" data-ui="closeSheet">朝の部屋を見る</button><button type="button" data-ui="reset">はじめから</button></div></div>';
  };

  /* ---- タップ ---- */
  const onClick = (P, e) => {
    if (UI.compactTap && UI.compactTap(P, e)) return;
    MD.snd && MD.snd.wake();
    const t = e.target;
    const ui = t.closest('[data-ui]'), it = t.closest('[data-it]'), dd = t.closest('[data-do]'), h = t.closest('[data-h]');
    if (t.closest('[data-in]')) return;
    if (ui) return uiCmd(P, ui.dataset.ui);
    if (dd) return doCmd(P, dd.dataset.do);
    if (t.closest('.talk')) { MD.act((S) => (S.talk ? G.talkNext(S) : false)); return; }
    if (it) return itemTap(P, it.dataset.it);
    if (h) return hotTap(P, h.dataset.h);
    if (P.L.sel && t.closest('.box')) { P.L.sel = null; localSay(P, '手をはなした。'); UI.render(P); }
  };
  const uiCmd = (P, c) => {
    if (c === 'close') { P.L.view = null; UI.render(P); return; }
    if (c === 'closeSheet') { P.L.sheet = null; UI.render(P); return; }
    if (['hint', 'menu', 'about', 'reset'].includes(c)) { P.L.sheet = c; UI.render(P); return; }
    if (c === 'other') return UI.openOther(P);
  };
  const itemTap = (P, id) => {
    if (MD.S.talk) return;
    if (P.L.sel === id) { P.L.sheet = 'item:' + id; UI.render(P); return; }
    if (P.L.sel && P.L.sel !== id) { const a = P.L.sel; P.L.sel = null; MD.act((S) => G.combine(S, P.room, a, id)); return; }
    P.L.sel = id;
    localSay(P, `${I[id].name}を手にとった。使う所をタップ。（もう一度タップで、よく見る）`);
    UI.render(P);
  };
  const hotTap = (P, h) => {
    const S0 = MD.S;
    if (S0.talk && P.room !== 'c') { MD.act((S) => (S.talk ? G.talkNext(S) : false)); return; }
    const item = P.L.sel;
    if (/_basket$/.test(h)) { localSay(P, S0.basket.at === 'move' ? 'かごが、糸をすべっている。' : 'お菓子の缶のかご。下のボタンで、入れたり送ったりできる。'); return; }
    // 幻灯（ソウの側）：照らしているフィルムをもう一度さわると、よく見る
    if (h === 'va_glass' && S0.aim === 'glass' && S0.f.screen && !item) { P.L.view = 'projA'; UI.render(P); return; }
    let out;
    if (/^v[abc]_/.test(h)) out = run((S) => G.viewTap(S, P.room, h, item));
    else out = run((S) => G.tap(S, P.room, h, item));
    // 使った物は手をはなす（窓を開いただけのときは、持ったまま）
    if (item && (!MD.S.inv[P.room].includes(item) || out !== 'win')) P.L.sel = null;
    if (out) openOut(P, out);
    else UI.render(P);
  };
  const openOut = (P, out) => {
    if (out === 'win' || out === 'proj' || out === 'projA' || out === 'clockset') P.L.view = out;
    else if (out.startsWith('read:') || out === 'sleep') P.L.sheet = out;
    else if (out === 'photos') { P.L.view = 'photos'; P.L.photo = Math.max(0, MD.S.photos.length - 1); checkPhoto(P); }
    UI.render(P);
  };
  const checkPhoto = (P) => {
    const S = MD.S, p = S.photos[P.L.photo];
    if (p && p.subj === 'room' && !S.f.sawKey && !p.snap.f.keyTaken) MD.act((S2) => G.viewPhoto(S2, P.room, P.L.photo));
  };
  const doCmd = (P, c) => {
    const r = P.room;
    if (c.startsWith('it:')) {
      const id = P.L.sheet.slice(5), k = c.slice(3);
      P.L.sel = null;
      if (k.startsWith('read:')) { P.L.sheet = k; UI.render(P); return; }
      if (k === 'photos') { P.L.sheet = null; openOut(P, 'photos'); return; }
      if (k === 'proj') { P.L.sheet = null; P.L.sel = null; openOut(P, 'proj'); return; }
      P.L.sheet = null; P.L.sel = null;
      MD.act((S) => G.itemDo(S, r, id, k));
      if (k === 'shootRoom' || k === 'shootOut') { /* 写真は手もとの「写真」で見る */ }
      return;
    }
    if (c === 'win') return void MD.act((S) => G.winToggle(S, r));
    if (c === 'off') return void MD.act((S) => { S.aim = null; G.say(S, 'a', '懐中電灯を、窓の外からもどした。'); G.say(S, 'b', 'ソウの窓の光が、こちらを照らすのをやめた。'); });
    if (c === 'blink') return blink(P);
    if (c === 'throw') return void MD.act((S) => G.throwLine(S));
    if (c === 'shoot') return void MD.act((S) => G.shoot(S, 'b', 'out'));
    if (c === 'bk-put') { const id = P.L.sel; if (!id) return; P.L.sel = null; return void MD.act((S) => G.basketPut(S, r, id)); }
    if (c === 'bk-cat') return void MD.act((S) => G.basketPut(S, r, 'cat'));
    if (c === 'bk-take') return void MD.act((S) => G.basketTake(S, r));
    if (c === 'bk-send') return void MD.act((S) => G.basketSend(S, r));
    if (c === 'bk-pull') return void MD.act((S) => G.basketPull(S, r));
    if (c === 'ph-1' || c === 'ph+1') { P.L.photo += c === 'ph-1' ? -1 : 1; UI.render(P); checkPhoto(P); return; }
    if (c === 'fr-1' || c === 'fr+1') return void MD.act((S) => { S.frame = (S.frame + (c === 'fr-1' ? 5 : 1)) % 6; });
    if (c === 'flipV') return void MD.act((S) => { S.film.v = !S.film.v; G.say(S, 'b', 'フィルムをはがして、上下を入れかえてはりなおした。'); });
    if (c === 'flipH') return void MD.act((S) => { S.film.h = !S.film.h; G.say(S, 'b', 'フィルムをはがして、うら返してはりなおした。'); });
    if (c.startsWith('ck')) {
      if (c === 'ckset') { const m = P.L.clock; MD.act((S) => G.setClock(S, r, m)); if (MD.S.f.cSet) P.L.view = null; UI.render(P); return; }
      P.L.clock = (P.L.clock + Number(c.slice(2)) + 720) % 720; UI.render(P); return;
    }
    if (c === 'hint+') return void MD.act((S) => { const st = G.stage(S), lv = S.hintLv[st] || 0; if (lv >= 3 || (S.clock[st] || 0) < G.HINT_AT[lv]) return false; S.hintLv[st] = lv + 1; });
    if (c === 'sleep') { P.L.sheet = null; MD.act((S) => G.sleep(S)); return; }
    if (c === 'reset') { P.L.sheet = null; MD.reset(); return; }
    if (c === 'snd') { MD.snd && MD.snd.toggle(); UI.render(P); return; }
    if (c.startsWith('mode:')) { P.L.sheet = null; MD.switchMode(c.slice(5)); return; }
  };
  /* 点滅：続けて押した回数を、少し待ってから合図にする */
  const blink = (P) => {
    const now = Date.now();
    P.blinkN = (P.blinkT && now - P.blinkT < 1500 ? P.blinkN : 0) + 1;
    P.blinkT = now;
    MD.act((S) => G.fx(S, 'blink1', 'a'));
    clearTimeout(P.blinkTO);
    P.blinkTO = setTimeout(() => { const n = P.blinkN; P.blinkN = 0; MD.act((S) => G.blink(S, n)); }, 1500);
  };
  /* 幻灯のピント（つまみ） */
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t.matches || !t.matches('[data-in="focus"]')) return;
    MD.S.focus = +t.value;
    for (const P of UI.panes) if (P.L.view === 'proj') projUpdate(P, 'b');
    clearTimeout(UI.focusTO);
    UI.focusTO = setTimeout(() => { const v = +t.value; MD.act((S) => { S.focus = v; }); }, 250);
  });

  /* ---- 毎コマ：雨・稲光・かご・猫・揺れ・光の演出 ---- */
  const rain = (P, cv, strong) => {
    const S = MD.S;
    const ctx = cv.getContext('2d');
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (S.ended || S.f.eye) return;
    const now = performance.now(), W = G.wind(Date.now(), S);
    let D = P.drops.get(cv);
    const n = Math.round((strong ? 150 : 46) * (w * h) / (strong ? 300000 : 12000));
    if (!D || D.n !== n) { D = { n, a: Array.from({ length: Math.max(8, Math.min(260, n)) }, () => [Math.random() * w, Math.random() * h, 0.6 + Math.random() * 0.8]), t: now }; P.drops.set(cv, D); }
    const dt = Math.min(0.05, (now - D.t) / 1000); D.t = now;
    const vx = W.w * 520 + 30, vy = 760 + W.w * 300;
    const L = strong ? 0.035 : 0.02;
    ctx.strokeStyle = 'rgba(200,214,235,.42)'; ctx.lineWidth = strong ? 1.2 : 0.8;
    ctx.beginPath();
    for (const d of D.a) {
      d[0] += vx * dt * d[2] * (strong ? 1 : 0.35); d[1] += vy * dt * d[2] * (strong ? 1 : 0.35);
      if (d[1] > h) { d[1] = -10; d[0] = Math.random() * (w + 80) - 80; }
      if (d[0] > w + 20) d[0] = -20;
      ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0] - vx * L * (strong ? 1 : 0.4), d[1] - vy * L * (strong ? 1 : 0.4));
    }
    ctx.stroke();
  };
  UI.frame = (P, t) => {
    const S = MD.S, now = Date.now();
    const fl = G.lightning(now, S);
    P.el.style.setProperty('--flash', fl.toFixed(3));
    rain(P, P.rainS, false);
    const rv = P.ov.querySelector('.rain-v'); if (rv) rain(P, rv, true);
    // かご
    if (S.f.basket) {
      const p = G.basketPos(S, now);
      P.el.querySelectorAll('.bk').forEach((g) => {
        const d = g.dataset, x = +d.x0 + (d.x1 - d.x0) * p, y = +d.y0 + (d.y1 - d.y0) * p, s = +d.s0 + (d.s1 - d.s0) * p;
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
      });
    }
    // 猫が板を渡る
    if (S.f.catGo && S.cat === 'eave') {
      const p = Math.min(1, (now - S.f.catGo) / 2800);
      P.el.querySelectorAll('.catx').forEach((g) => { const d = g.dataset; g.setAttribute('transform', `translate(${((d.x1 - d.x0) * p).toFixed(1)} ${((d.y1 - d.y0) * p).toFixed(1)})`); });
    }
    // 風で揺れるもの
    const W = G.wind(now, S);
    P.el.querySelectorAll('.sway').forEach((g, i) => {
      const a = (+g.dataset.amp) * W.w * Math.sin(t / 260 + i * 1.7) + (+g.dataset.amp) * W.w * 0.4;
      g.setAttribute('transform', `rotate(${a.toFixed(2)} ${g.dataset.ox} ${g.dataset.oy})`);
    });
    // 光の演出
    if (S.fx.n !== P.lastFx) {
      P.lastFx = S.fx.n;
      if (now - S.fx.t < 2500) P.fx = { name: S.fx.name, t0: performance.now() - (now - S.fx.t), room: S.fx.room, k: S.fx.k, out: S.fx.out };
    }
    let flash = 0, fxwin = { a: 0, b: 0 }, shake = 0;
    if (P.fx) {
      const e = (t - P.fx.t0) / 1000, f = P.fx;
      if (f.name === 'flash') {
        const v = e < 0.08 ? 1 : Math.max(0, 1 - (e - 0.08) / 0.5);
        if (P.room === 'b') flash = v; else fxwin.b = v;
        if (P.room === 'a' && f.out) flash = v * 0.35;
        if (e > 0.7) P.fx = null;
      } else if (f.name === 'blink1') {
        const off = e < 0.3;
        P.el.querySelectorAll('.glare').forEach((g) => { g.style.opacity = off ? 0.05 : ''; });
        if (!off) P.fx = null;
      } else if (f.name === 'bonk' || f.name === 'throw') {
        if (P.room === 'b') shake = Math.max(0, 1 - e / 0.4);
        if (e > 0.5) P.fx = null;
      } else P.fx = null;
    }
    P.fl.style.opacity = flash.toFixed(3);
    P.el.querySelectorAll('.fxwin').forEach((r) => r.setAttribute('opacity', (fxwin[r.dataset.fx] || 0).toFixed(3)));
    P.box.style.transform = shake ? `translateX(${(Math.sin(t / 18) * 5 * shake).toFixed(1)}px)` : '';
    if (P.L.view === 'proj' || P.L.view === 'projA') { /* ピントの更新は input で */ }
  };

  MD.UI = UI;
})();
