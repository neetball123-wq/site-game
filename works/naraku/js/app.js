/* =========================================================
   奈落の証人 — 進行
   ========================================================= */
(() => {
  'use strict';
  const D = window.ND, A = window.NA, S = window.NS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const KEY = 'naraku.v1';
  const EXTRAS = ['ads', 'mask', 'tube', 'seat', 'curtain', 'note'];
  const HINT_MIN = [2, 5, 8];
  const KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const kn = (n) => n < 10 ? KANJI[n] : n < 20 ? '十' + (n % 10 ? KANJI[n % 10] : '') : KANJI[Math.floor(n / 10)] + '十' + (n % 10 ? KANJI[n % 10] : '');

  const fresh = () => ({ v: 1, playMs: 0, intro: false, stage: 0, step: 0, ev: [], spots: {}, round: {}, stageMs: {}, peek: {}, found: {}, miss: 0, ended: false, mute: false, measured: 0, noteTab: 'front', tube: 0 });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) st = Object.assign(fresh(), r); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const U = { gen: 0, next: null, skip: null, talking: false, pick: null, photo: 0, busy: false };
  const SG = () => D.STAGES[Math.min(st.stage, D.STAGES.length - 1)];
  const STEP = () => SG().steps[Math.min(st.step, SG().steps.length - 1)];
  const find = (k) => { if (!st.found[k]) { st.found[k] = Date.now(); save(); } };
  function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

  /* =========================================================
     舞台（背景・名札）
     ========================================================= */
  const EMB = { A: 'fan', I: 'mask', M: 'watch' };
  function scene(key) {
    const s = $('#scene');
    const k = key || SG().scene;
    if (s.dataset.k === k + (st.stage === 4 ? 'C' : '')) return;
    s.dataset.k = k + (st.stage === 4 ? 'C' : '');
    s.innerHTML = k === 'house' ? A.house(false) : k === 'stage' ? A.house(true) : k === 'naraku' ? A.naraku({ hiC: st.stage === 4 }) : k === 'corridor' ? A.corridor() : k === 'props' ? A.props() : k === 'wings' ? A.wings() : k === 'prompt' ? A.prompt() : k === 'photo' ? A.photoSheet() : k === 'foot' ? A.footClose() : '';
    s.className = 'scene sc-' + k;
  }
  function plate(who) {
    const p = $('#plate'), w = D.WHO[who];
    if (!w || !w.role) { p.hidden = true; return; }
    p.hidden = false;
    p.innerHTML = `${EMB[who] ? `<div class="emb">${A.emblem(EMB[who])}</div>` : ''}<div class="board"><small>${esc(w.role)}</small><b>${esc(w.name)}</b></div>`;
  }

  /* =========================================================
     会話
     ========================================================= */
  function say(lines, keepPlate) {
    const g = ++U.gen; U.talking = true; renderWork();
    return new Promise((res) => {
      let i = 0;
      const box = $('#dlg');
      const next = () => {
        if (g !== U.gen) { res(); return; }
        if (i >= lines.length) { box.hidden = true; U.talking = false; U.next = U.skip = null; if (!keepPlate) plate(STEP().type === 'cross' ? D.CROSS[STEP().id].who : ''); renderWork(); res(); return; }
        const [who, text, opt] = lines[i++];
        box.hidden = false; box.className = 'dlg w-' + who;
        const w = D.WHO[who] || { name: '' };
        $('#dlg-who').textContent = w.name; $('#dlg-who').hidden = !w.name;
        $('#dlg-t').textContent = text;
        if (w.role) plate(who);
        if (opt === 'scream') S.sfx('sting');
        if (opt && opt.ev) opt.ev.forEach(give);
        S.sfx('click');
      };
      U.next = next;
      U.skip = () => { while (i < lines.length) { const o = lines[i++][2]; if (o && o.ev) o.ev.forEach(give); } next(); };
      next();
    });
  }
  $('#dlg').addEventListener('click', (e) => { if (e.target.closest('#dlg-skip')) { U.skip && U.skip(); return; } U.next && U.next(); });
  addEventListener('keydown', (e) => {
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && U.next && !$('#dlg').hidden) { e.preventDefault(); U.next(); }
  });
  function give(id) {
    if (st.ev.includes(id)) return; st.ev.push(id); save(); S.sfx('get');
    toast(`<b>証拠品に追加</b>　${esc(D.EV[id].name)}`); renderEv();
  }

  /* =========================================================
     進行
     ========================================================= */
  async function run() {
    if (U.busy) return; U.busy = true;
    while (!st.ended) {
      const sg = SG(), sp = STEP();
      $('#act').textContent = `${sg.act}　${sg.place}`;
      scene(sp.scene || (sp.type === 'photo' ? 'photo' : sp.type === 'measure' ? 'foot' : sg.scene));
      S.pad(sg.id === 'final' ? 'warm' : sp.type === 'cross' ? 'tense' : sg.id === 'naraku' || sg.id === 'foot' ? 'dark' : 'calm');
      if (sp.type !== 'measure') { const n = $('#nudge'); if (n) n.remove(); }
      if (sp.type === 'talk') { await say(sp.lines); if (advance()) return; continue; }
      renderWork(); plate(sp.type === 'cross' ? D.CROSS[sp.id].who : '');
      break;   // 操作を待つ
    }
    U.busy = false;
  }
  // 幕が変わる・終わるときは true
  function advance() {
    st.step++;
    if (st.step >= SG().steps.length) {
      if (st.stage >= D.STAGES.length - 1) { save(); U.busy = false; finish(); return true; }
      st.stage++; st.step = 0; save(); intermission(); return true;
    }
    save(); return false;
  }
  function done() { if (!advance()) setTimeout(run, 50); }
  async function intermission() {
    U.inter = true;
    const c = $('#curtain'), sg = SG();
    c.innerHTML = `<div class="ct"><small>${esc(sg.act)}</small><b>${esc(sg.place)}</b></div>`;
    c.classList.add('on'); S.sfx('curtain'); S.sfx('hyoshigi');
    await wait(1900);
    $('#scene').dataset.k = ''; scene(sg.steps[0].scene || sg.scene); renderEv();
    c.classList.remove('on');
    await wait(700);
    U.inter = false; U.busy = false; run();
  }

  /* =========================================================
     右の机（手もとの作業）
     ========================================================= */
  function renderWork() {
    const w = $('#work'), sp = STEP();
    if (st.ended) { w.innerHTML = `<div class="card"><h3>閉幕</h3><p>事件は解決した。証拠品や手帳は、いつでも読み返せる。</p><button class="btn" id="w-end">カーテンコールを見る</button></div>`; $('#w-end').onclick = showEnd; return; }
    if (U.talking || sp.type === 'talk') { w.innerHTML = `<div class="card dim"><p class="muted">（話を聞いている）</p><p class="tiny">画面の下の文を押すと、次へ進みます。</p></div>`; return; }
    const f = { explore: wExplore, clock: wClock, cross: wCross, photo: wPhoto, measure: wMeasure, select: wSelect, board: wBoard }[sp.type];
    if (f) f(w, sp);
  }

  /* ---------- 調べる ---------- */
  function wExplore(w, sp) {
    const spots = D[sp.spots], need = Object.keys(spots).filter((k) => spots[k].need), seen = need.filter((k) => st.spots[k]).length;
    w.innerHTML = `<div class="card"><h3>現場を調べる</h3><p>図の<span class="ring"></span>を押すと、そこを調べる。</p>
      <ul class="checks">${Object.entries(spots).map(([k, v]) => `<li class="${st.spots[k] ? 'on' : ''}${v.need ? '' : ' opt'}"><button data-spot="${k}">${esc(v.label)}</button></li>`).join('')}</ul>
      <div class="row"><span class="muted">調べた：${seen} / ${need.length}</span><button class="btn hot" id="ex-go"${seen >= need.length ? '' : ' disabled'}>話を聞きに行く</button></div></div>`;
    $$('[data-spot]', w).forEach((b) => b.onclick = () => look(b.dataset.spot));
    $('#ex-go').onclick = () => { S.sfx('click'); done(); };
    // 図の上の印
    const svg = $('#scene svg'); if (!svg || $('#hot', svg)) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'hot';
    Object.entries(A.NARAKU_SPOTS).forEach(([k, [x, y, r]]) => {
      if (!spots[k]) return;
      g.insertAdjacentHTML('beforeend', `<g class="hs${st.spots[k] ? ' seen' : ''}" data-spot="${k}" transform="translate(${x} ${y})"><circle r="${r}" fill="transparent"/><circle class="rg" r="${Math.min(40, r * 0.5)}"/><text class="ck" y="10" text-anchor="middle">✓</text></g>`);
    });
    svg.appendChild(g);
    g.addEventListener('click', (e) => { const h = e.target.closest('[data-spot]'); if (h) look(h.dataset.spot); });
  }
  async function look(k) {
    if (U.talking) return;
    const sp = D.SPOTS1[k]; S.sfx('press');
    if (k === 'tube') { st.tube++; save(); if (st.tube >= 5) { find('tube'); S.sfx('voice'); await say([['N', '伝声管に耳をあてる。……管の奥から、かすかに、だれかの声がした気がした。'], ['N', '「……幕を、あげてくれ」']]); st.tube = 0; return; } S.sfx('tube'); }
    st.spots[k] = 1; save();
    const h = $(`#hot [data-spot="${k}"]`); if (h) h.classList.add('seen');
    await say(sp.lines.concat(sp.ev ? [] : []).map((l, i, a) => (i === a.length - 1 && sp.ev ? [l[0], l[1], { ev: [sp.ev] }] : l)));
  }

  /* ---------- 時計 ---------- */
  let clockMin = 0;
  function clockSVG(m) {
    const ha = ((9 + m / 60) / 12) * 360, ma = m / 60 * 360;
    let ticks = ''; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r1 = i % 5 ? 88 : 80; ticks += `<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * 94}" y2="${100 - Math.cos(a) * 94}" stroke="#3a2a14" stroke-width="${i % 5 ? 1 : 2.5}"/>`; }
    const nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => { const a = i / 12 * Math.PI * 2; return `<text x="${100 + Math.sin(a) * 66}" y="${106 - Math.cos(a) * 66}" text-anchor="middle" font-size="15" font-family="Shippori Mincho B1, serif" fill="#3a2a14">${n}</text>`; }).join('');
    return `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" fill="#f3e9d0" stroke="#b8943e" stroke-width="4"/>${ticks}${nums}
      <line x1="100" y1="100" x2="${100 + Math.sin(ha * Math.PI / 180) * 44}" y2="${100 - Math.cos(ha * Math.PI / 180) * 44}" stroke="#1d1a17" stroke-width="6" stroke-linecap="round"/>
      <line x1="100" y1="100" x2="${100 + Math.sin(ma * Math.PI / 180) * 76}" y2="${100 - Math.cos(ma * Math.PI / 180) * 76}" stroke="#1d1a17" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" fill="#b8943e"/></svg>`;
  }
  function wClock(w, sp) {
    w.innerHTML = `<div class="card"><h3>倒れた時刻は？</h3><p>懐中時計の針を合わせる。</p><div class="clock" id="clock">${clockSVG(clockMin)}</div>
      <p class="ctime" id="ctime">二十一時${kn(clockMin)}分</p>
      <div class="cbtns"><button data-m="-5">−5分</button><button data-m="-1">−1分</button><button data-m="1">＋1分</button><button data-m="5">＋5分</button></div>
      <div class="row"><button class="btn hot" id="c-go">この時刻で推理する</button></div></div>`;
    $$('[data-m]', w).forEach((b) => b.onclick = () => { clockMin = (clockMin + +b.dataset.m + 60) % 60; S.sfx('tick'); $('#clock').innerHTML = clockSVG(clockMin); $('#ctime').textContent = `二十一時${clockMin ? kn(clockMin) + '分' : 'ちょうど'}`; });
    $('#c-go').onclick = async () => {
      if (clockMin >= sp.ans[0] && clockMin <= sp.ans[1]) { S.sfx('ok'); done(); return; }
      S.sfx('miss'); st.miss++; save();
      const m = clockMin;
      await say([m === 5 ? ['H', '二十一時五分は、ワルツが始まった時刻ですね。音がしたのは、三番に入ったときでした。'] : m === 17 ? ['H', '二十一時十七分はワルツの終わりです。その前ですね。'] : m < 5 || m > 17 ? ['H', 'ワルツのあいだのはずです。進行台本と楽譜を見くらべてみましょう。'] : ['H', 'うーん……三番に入るのは、始まってから何分後でしたっけ。楽譜を見てみましょう。']]);
    };
  }

  /* ---------- 証言 ---------- */
  function wCross(w, sp) {
    const C = D.CROSS[sp.id], r = st.round[sp.id] || 0, R = C.rounds[r];
    w.innerHTML = `<div class="card test"><h3>${esc(C.title)}${C.rounds.length > 1 ? `<small>その${kn(r + 1)}</small>` : ''}</h3>
      <ol class="tl">${R.lines.map((l, i) => `<li><p>${esc(l.t)}</p><div class="tb"><button data-press="${i}">ゆさぶる</button><button class="hot" data-show="${i}">つきつける</button></div></li>`).join('')}</ol>
      <p class="tiny">証拠とぶつかる言葉に、証拠品を「つきつける」。</p></div>`;
    $$('[data-press]', w).forEach((b) => b.onclick = async () => { S.sfx('press'); await say(R.lines[+b.dataset.press].press, true); });
    $$('[data-show]', w).forEach((b) => b.onclick = () => openEv({ pick: (ev) => present(sp.id, +b.dataset.show, ev) }));
  }
  async function present(cid, line, ev) {
    closeModal();
    const C = D.CROSS[cid], r = st.round[cid] || 0, R = C.rounds[r];
    const ok = R.ok.some((o) => o.line === line && o.ev === ev);
    await objection(ok);
    if (!ok) {
      st.miss++; save(); S.sfx('miss');
      const h = R.hint && R.hint[`${line}-${ev}`];
      const miss = D.MISS[C.who];
      await say([['Y', `「${R.lines[line].t}」——${D.EV[ev].name}を見せる。`], h || miss[st.miss % miss.length]], true);
      return;
    }
    S.sfx('ok');
    if (R.after) await say(R.after, true);
    if (r + 1 < C.rounds.length) { st.round[cid] = r + 1; save(); renderWork(); return; }
    done();
  }
  async function objection(ok) {
    const o = $('#obj'); o.textContent = 'つきつける！'; o.className = 'obj on'; S.sfx('objection');
    $('#stage').classList.add('shake'); await wait(700); $('#stage').classList.remove('shake'); o.className = 'obj'; await wait(120);
  }

  /* ---------- 写真 ---------- */
  function wPhoto(w) {
    w.innerHTML = `<div class="card"><h3>写真をくらべる</h3><p>ベタ焼きのコマを押すと、大きく見られる。</p><p><b>第三場（21:08）</b>の仮面の男で、<b>第一場（20:48）</b>とちがうところを、大きくした写真の上で押す。</p>
      <div class="row">${U.photo ? '<button class="btn ghost" id="ph-back">ベタ焼きにもどる</button>' : ''}</div></div>`;
    if ($('#ph-back')) $('#ph-back').onclick = () => { U.photo = 0; $('#scene').dataset.k = ''; scene('photo'); bindPhoto(); renderWork(); };
    bindPhoto();
  }
  function bindPhoto() {
    const s = $('#scene');
    s.onclick = async (e) => {
      if (STEP().type !== 'photo' || U.talking) return;
      const fr = e.target.closest('[data-fr]');
      if (fr && !U.photo) { U.photo = +fr.dataset.fr; S.sfx('page'); s.dataset.k = 'p' + U.photo; s.innerHTML = A.photoOne(U.photo); s.className = 'scene sc-photo1'; renderWork(); return; }
      const hot = e.target.closest('[data-hot]');
      if (U.photo && hot) {
        const k = hot.dataset.hot;
        if (k === 'head') { S.sfx('ok'); U.photo = 0; s.onclick = null; done(); return; }
        if (k === 'sill') { await say([['H', '奥の大窓の下枠……。第一場の写真にも、同じ窓がありますね。仮面の男の頭と、くらべてみては？']]); return; }
        if (k === 'head1') { await say([['H', 'これは第一場の仮面の男。頭が、大窓の下枠より上に出ています。']]); return; }
        if (k === 'fan') { await say([['H', '白石さんの扇。骨が一本、垂れていますね。']]); return; }
        if (k === 'seat') { find('seat'); await say([['Y', '八列十番のあたりに、見おぼえのある帽子。——わたしだ。']]); return; }
      }
      if (U.photo && U.photo !== 2) { await say([['H', 'このコマではないかも。第三場（21:08）を見てみましょう。']]); }
    };
  }

  /* ---------- ものさし ---------- */
  function wMeasure(w, sp) {
    w.innerHTML = `<div class="card"><h3>足跡Cを測る</h3><p>ものさしを左右に動かして、目盛りの0を<b>かかと</b>に合わせ、<b>つま先</b>までの長さを読む。</p>
      <label class="inp">長さ　<input type="number" id="ms-v" step="0.1" min="0" max="40" inputmode="decimal" placeholder="00.0">　センチ</label>
      <div class="row"><button class="btn hot" id="ms-go">この長さで記録する</button></div></div>`;
    bindRuler();
    const go = async () => {
      const v = parseFloat(($('#ms-v').value || '').replace(/[^\d.]/g, ''));
      if (!(v > 0)) return;
      if (v >= sp.ans[0] && v <= sp.ans[1]) { st.measured = v; save(); S.sfx('ok'); done(); return; }
      S.sfx('miss'); st.miss++; save();
      await say([v < 20 || v > 30 ? ['H', '目盛りの0が、かかとの端に合っているか、たしかめてみましょう。'] : ['H', 'もう少しだけ、ずれているかも。0の線をかかとの端にぴったり合わせて。']]);
    };
    $('#ms-go').onclick = go; $('#ms-v').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }
  function bindRuler() {
    const svg = $('#scene svg'), r = $('#ruler'); if (!svg || !r) return;
    let x = U.rx || 520, y = 620, drag = null;
    const put = () => r.setAttribute('transform', `translate(${x} ${y})`); put();
    const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    r.addEventListener('pointerdown', (e) => { drag = { sx: pt(e).x, x0: x }; r.setPointerCapture(e.pointerId); r.style.cursor = 'grabbing'; });
    r.addEventListener('pointermove', (e) => { if (!drag) return; x = Math.max(-300, Math.min(900, drag.x0 + pt(e).x - drag.sx)); U.rx = x; put(); });
    r.addEventListener('pointerup', () => { drag = null; r.style.cursor = 'grab'; });
    const nudge = (d) => { x += d; U.rx = x; put(); };
    if (!$('#nudge')) $('#stage').insertAdjacentHTML('beforeend', '<div class="nudge" id="nudge"><button data-n="-40">◀◀</button><button data-n="-4">◀</button><button data-n="4">▶</button><button data-n="40">▶▶</button></div>');
    $$('#nudge [data-n]').forEach((b) => b.onclick = () => nudge(+b.dataset.n));
  }

  /* ---------- えらぶ ---------- */
  function wSelect(w, sp) {
    w.innerHTML = `<div class="card"><h3>足跡Cをつけたのは？</h3><p>長さ：約${st.measured || 25}センチ。地下足袋の支給表と、鍵の管理表を見よう。</p>
      <div class="names">${sp.opts.map((n, i) => `<button data-sel="${i}"><b>${esc(n)}</b></button>`).join('')}</div></div>`;
    $$('[data-sel]', w).forEach((b) => b.onclick = async () => {
      const i = +b.dataset.sel;
      if (i === sp.ans) { S.sfx('ok'); done(); return; }
      S.sfx('miss'); st.miss++; save();
      const n = sp.opts[i];
      await say([n === '小松 直也' ? ['H', '小松さんの足袋は十文。二十四センチです。それに二十一時十分、小松さんは舞台で踊っていました。'] : n === '熊田 勝' ? ['H', '熊田さんは十一文三分。二十七センチをこえます。足跡よりずいぶん大きい。'] : n === '老田 修一' ? ['H', '老田さんは裏方じゃないので、地下足袋は持っていません。花道下の扉も使われていませんでした。'] : ['H', `${n}さんの足袋は、足跡Cより小さいはずです。支給表の「文」をセンチに直してみましょう。`]]);
    });
  }

  /* ---------- 推理の組み立て ---------- */
  const pick = [];
  function wBoard(w) {
    w.innerHTML = `<div class="card board"><h3>最後の推理</h3>${D.BOARD.map((b, i) => `<div class="bq${U.bad && U.bad.includes(i) ? ' bad' : ''}"><p>${esc(b.pre)}<span class="blank">${pick[i] != null ? esc(b.opts[pick[i]]) : '　　　'}</span>${esc(b.post)}</p><div class="chips">${b.opts.map((o, j) => `<button data-b="${i}-${j}" class="${pick[i] === j ? 'on' : ''}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
      <div class="bq last"><p>だから、鷺沢さんを突き落としたのは——</p><div class="row"><button class="btn hot" id="bd-go"${pick.filter((x) => x != null).length === D.BOARD.length ? '' : ' disabled'}>この推理を話す</button></div></div></div>`;
    $$('[data-b]', w).forEach((b) => b.onclick = () => { const [i, j] = b.dataset.b.split('-').map(Number); pick[i] = j; S.sfx('pen'); if (U.bad) U.bad = U.bad.filter((x) => x !== i); renderWork(); });
    $('#bd-go').onclick = async () => {
      const bad = D.BOARD.map((b, i) => (pick[i] === b.ans ? -1 : i)).filter((i) => i >= 0);
      if (!bad.length) { await objection(true); S.sfx('ok'); done(); return; }
      U.bad = bad; st.miss++; save(); S.sfx('miss');
      await say([['H', `${kn(D.BOARD.length - bad.length)}つは、合っていると思います。……赤いところを、もう一度たしかめましょう。`]]);
    };
  }

  /* =========================================================
     証拠品
     ========================================================= */
  function renderEv() {
    $('#ev-n').textContent = st.ev.length;
    $('#evbar').innerHTML = st.ev.length ? st.ev.map((id) => `<button class="tag" data-ev="${id}"><span class="ic">${A.icon(D.EV[id].icon)}</span><span>${esc(D.EV[id].name)}</span></button>`).join('') : '<span class="muted">証拠品は、まだない。</span>';
  }
  $('#evbar').addEventListener('click', (e) => { const b = e.target.closest('[data-ev]'); if (b) openEv({ id: b.dataset.ev }); });
  $('#b-ev').addEventListener('click', () => { S.init(); openEv({}); });
  function openEv(o) {
    U.pick = o.pick || null; S.sfx('page');
    let cur = o.id || null;
    const draw = () => {
      const list = st.ev.map((id) => `<button class="ev${cur === id ? ' on' : ''}" data-e="${id}"><span class="ic">${A.icon(D.EV[id].icon)}</span><span><b>${esc(D.EV[id].name)}</b><small>${esc(D.EV[id].sum)}</small></span></button>`).join('');
      modal(`<div class="evm${U.pick ? ' picking' : ''}"><div class="evl"><h3>${U.pick ? 'つきつける証拠品を選ぶ' : '証拠品'}</h3>${list}</div><div class="evd">${cur ? doc(cur) + (U.pick ? `<div class="row"><button class="btn hot" id="ev-show">これをつきつける</button></div>` : '') : '<p class="muted">左の証拠品を押すと、ここに出る。</p>'}</div></div>`);
      $$('[data-e]', $('#modal')).forEach((b) => b.onclick = () => { cur = b.dataset.e; S.sfx('page'); draw(); });
      if ($('#ev-show')) $('#ev-show').onclick = () => { const p = U.pick; U.pick = null; p(cur); };
      bindDoc(cur, draw);
    };
    draw();
  }
  function doc(id) {
    const e = D.EV[id];
    let h = `<h2>${esc(e.name)}</h2>`;
    if (id === 'pamph') {
      h += U.back ? `<div class="pamph back"><p class="ad"><b>霞野線</b>準急「かすみ」で行く、秋の高原。<small>灘浜〜霧ヶ原　二時間十分</small></p><p class="ad"><b>潮見放送</b>ラジオ劇場　毎週土曜　夜八時<small>AM　潮見放送</small></p><p class="ad"><b>ナクシタ堂</b>なくしたもの、あります。<small>通信販売・御用命は葉書にて</small></p><button class="btn ghost" data-back>表にもどす</button></div>`
        : `<div class="pamph"><p class="pt">劇団月見座　秋季公演<b>仮面舞踏会の夜</b>作・老田修一　演出・鷺沢雅臣</p><table class="t"><tr><th>役</th><th>俳優</th><th>身長</th></tr>${[['令嬢エリザ', '白石 澪', '一六二'], ['仮面の男（ドミノ伯爵）', '犬飼 透', '一八〇'], ['執事／踊り手', '小松 直也', '一七〇'], ['老婆／踊り手', '岡部 千代', '一五八']].map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>
          <p class="small">舞台監督・真柴耕三／衣装・梅本トキ／大道具・熊田勝／小道具・七瀬ひばり／記録・大友伸</p><p class="small">〈新人紹介〉七瀬ひばり（十九）。小道具係。身長百五十六センチ、劇団いちばんの小柄。「いつか、あの舞台に」。</p><button class="btn ghost" data-back>裏表紙を見る</button></div>`;
    } else if (id === 'kouban') {
      h += `<table class="t k"><tr><th></th>${D.KOUBAN.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>${D.KOUBAN.rows.map((r) => `<tr><td><b>${esc(r[0])}</b><small>${esc(r[1])}${r[3] ? '<br>' + esc(r[3]) : ''}</small></td>${r[2].map((x) => `<td class="c">${x ? '○' : ''}</td>`).join('')}</tr>`).join('')}</table>`;
    } else if (id === 'cue') {
      h += `<div class="cue">${D.CUE.map((r) => `<p><span class="tm">${esc(r[0])}</span><span class="q">${esc(r[1])}</span><span>${esc(r[2])}</span></p>`).join('')}</div>`;
    } else if (id === 'score') {
      h += `<div class="score"><svg viewBox="0 0 600 120">${[0, 1, 2, 3, 4].map((i) => `<line x1="10" y1="${30 + i * 12}" x2="590" y2="${30 + i * 12}" stroke="#555"/>`).join('')}${[...Array(24)].map((_, i) => `<circle cx="${40 + i * 23}" cy="${54 - Math.round(Math.sin(i * 0.9) * 3) * 6}" r="5" fill="#222"/>`).join('')}${[150, 300, 450].map((x) => `<line x1="${x}" y1="30" x2="${x}" y2="78" stroke="#222" stroke-width="2"/>`).join('')}</svg>
        <table class="t">${D.SCORE.map((r) => `<tr><td>${esc(r[0])}</td><td>始まってから ${esc(r[1])}</td></tr>`).join('')}</table><p class="small">「月見のワルツ」。全部で十二分。三番の頭で、エリザと仮面の男が手をとって回る。</p><button class="btn ghost" data-play>オルゴールで鳴らしてみる</button></div>`;
    } else if (id === 'shiraishi') h += quote('白石 澪', ['第三場のワルツの途中。足もとで「ドン」と重い音がして、床がふるえた。', 'ちょうど、ワルツが三番に入った瞬間。三番の頭で仮面の男の手をとってまわるので、よく覚えている。']);
    else if (id === 'oida') h += quote('老田 修一', ['第二場の途中（二十時五十八分ごろ）から、ロビーで煙草を吸っていた。', '客席に戻ったのは第四場の頭。'], '売店のおかみ：「老田先生なら、ずっとそこの長椅子に。煙草を三本」');
    else if (id === 'bulb') h += quote('七瀬 ひばり', ['二十一時三十五分。上手の階段を降りるとき、もう明かりが点いていました。', '電球の下に、鷺沢さんが……。'], '奈落の電球は引き紐式。点けるにも消すにも、電球の下まで行かなければならない。');
    else if (id === 'hanamichi') h += quote('羽柴刑事', ['花道下の扉のかんぬきにも、取っ手にも、埃がつもったまま。', '何年も開けられていない。客席から奈落へ来るには、使えない。']);
    else if (id === 'plan') h += `<div class="plan">${A.naraku({ hiC: st.stage >= 4 })}</div><p class="small">A：革靴（鷺沢）。上手の階段からせりへ。<br>B：かかとの高い舞台用の靴。上手の階段と、倒れていた場所を行き来。<br>C：つま先が二つに分かれた足跡（地下足袋）。下手の階段と、倒れていた場所を行き来。${st.measured ? `<b>長さ約${st.measured}センチ＝十文半。</b>` : '長さは未計測。'}</p>`;
    else if (id === 'photo') h += `<div class="photo" id="dphoto">${U.dph ? A.photoOne(U.dph) : A.photoSheet()}</div><p class="small">${U.dph ? '<button class="btn ghost" data-dph="0">ベタ焼きにもどる</button>' : 'コマを押すと大きくなる。記録係・大友が、客席のうしろから撮った。'}</p>`;
    else if (id === 'memo') h += `<div class="paper hand">七瀬くんへ<br><br>第三場の仮面の男を、代わってくれないか。台詞はない。ワルツだけだ。<br>予備の衣装は、衣装箱の二段目。<br>鷺沢さんの、千秋楽のサプライズだ。だれにも言わないこと。<br><br>　　　　　　　　　犬飼</div>`;
    else if (id === 'letter') h += `<div class="paper hand ink">犬飼へ<br><br>第三場の仮面は、七瀬に踊らせる。あの子の初舞台だ。<br>お前には話がある。ワルツのあいだに、奈落へ来い。<br>だれにも言うな。<br><br>　　　　　　　　　鷺沢</div><p class="small">くしゃくしゃに丸めて、くずかごに捨ててあった。</p>`;
    else if (id === 'costume') h += `<div class="mask">${A.emblem('mask')}</div><p class="small">仮面の男の予備の衣装。マントの裾が、床につくほど長い。七瀬が着て、衣装箱に返していた。</p><button class="btn ghost" data-wear>仮面を、かぶってみる</button>`;
    else if (id === 'inukai') h += quote('犬飼 透', ['二十一時十二分、上手の階段から奈落へ降りた。鷺沢さんに呼ばれていた。', '奈落は真っ暗だった。手さぐりで、電球の引き紐を引いた。', '鷺沢さんが倒れていた。……こわくなって、明かりもそのままに上がった。', '二十一時十七分、袖で七瀬くんと入れかわり、第四場に出た。']);
    else if (id === 'tabi') h += `<table class="t">${D.TABI.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td><b>${esc(r[2])}</b></td></tr>`).join('')}</table><p class="small">※一文は約二・四センチ。「分」は文の十分の一。役者は地下足袋をはかない。</p>`;
    else if (id === 'keys') h += `<table class="t">${D.KEYS.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table><p class="small">鷺沢の鍵束（遺体のポケット）には、上手・下手・操作盤の鍵が一本ずつ入っていた。</p>`;
    else if (id === 'envelope') h += `<div class="paper hand ink">真柴君<br><br>次の公演から、君に舞台監督はたのまない。演出を、たのみたい。<br>私の目は、もう舞台の奥まで見えない。月見座の時間を三十年数えてきた君になら、まかせられる。<br>千秋楽のあとで話す。<br><br>　　　　　　　　　鷺沢</div>`;
    return h;
  }
  const quote = (who, lines, note) => `<div class="quote"><p class="qw">${esc(who)}</p>${lines.map((l) => `<p>「${esc(l)}」</p>`).join('')}${note ? `<p class="small">${esc(note)}</p>` : ''}</div>`;
  function bindDoc(id, redraw) {
    const m = $('#modal');
    const b = $('[data-back]', m); if (b) b.onclick = () => { U.back = !U.back; if (U.back) find('ads'); S.sfx('page'); redraw(); };
    const p = $('[data-play]', m); if (p) p.onclick = () => { S.init(); S.waltz({ loops: 1 }); };
    const w = $('[data-wear]', m); if (w) w.onclick = () => { closeModal(); wear(); };
    const ph = $('#dphoto', m);
    if (ph) ph.onclick = (e) => {
      const f = e.target.closest('[data-fr]'); if (f) { U.dph = +f.dataset.fr; S.sfx('page'); redraw(); return; }
      const h = e.target.closest('[data-hot]'); if (h && h.dataset.hot === 'seat') { find('seat'); toast('八列十番のあたりに、見おぼえのある帽子。——あなただ。'); }
      if (h && h.dataset.hot === 'fan') toast('白石の扇。骨が一本、垂れている。');
    };
    const bk = $('[data-dph]', m); if (bk) bk.onclick = () => { U.dph = 0; redraw(); };
  }
  async function wear() {
    find('mask'); const p = $('#peep'); p.hidden = false; S.init(); S.waltz({ loops: 1, vol: 0.4 });
    await wait(5200); p.classList.add('off'); await wait(900); p.hidden = true; p.classList.remove('off');
  }

  /* =========================================================
     手帳（ヒント）
     ========================================================= */
  function lv(id) { const ms = st.stageMs[id] || 0; return HINT_MIN.filter((m) => ms >= m * 60000).length; }
  $('#b-note').addEventListener('click', () => { S.init(); const id = SG().id; if (!st.ended && st.stage > 0 && lv(id) > (st.peek[id] || 0)) st.noteTab = id; openNote(); });
  function openNote() {
    S.sfx('page');
    const tabs = [['front', 'はじめに']];
    D.STAGES.forEach((s, i) => { if (i > 0 && (i <= st.stage || st.ended)) tabs.push([s.id, s.act]); });
    if (st.ended) tabs.push(['last', '最後のページ']);
    if (!tabs.find((t) => t[0] === st.noteTab)) st.noteTab = tabs[tabs.length - 1][0];
    let body = '';
    if (st.noteTab === 'front') body = `<h3>${esc(D.NOTE_FRONT[0])}</h3>${D.NOTE_FRONT.slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}`;
    else if (st.noteTab === 'last') { find('note'); body = `<h3>${esc(D.NOTE_LAST[0])}</h3>${D.NOTE_LAST.slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}`; }
    else {
      const id = st.noteTab, s = D.STAGES.find((x) => x.id === id), idx = D.STAGES.indexOf(s), past = idx < st.stage || st.ended, L = past ? 3 : lv(id), ms = st.stageMs[id] || 0;
      if (!past && L > (st.peek[id] || 0)) { st.peek[id] = L; save(); }
      body = `<h3>${esc(s.act)}　${esc(s.place)}</h3>` + D.HINTS[id].map((h, i) => i < L ? `<p>${i === 2 ? '' : `メモ${kn(i + 1)}　`}${esc(h)}</p>` : `<p class="lk">${i === 2 ? '答え' : 'メモ' + kn(i + 1)}：（まだ書いていない。あと${kn(Math.max(1, Math.ceil((HINT_MIN[i] * 60000 - ms) / 60000)))}分ほど考えたら、書き足しておきます）</p>`).join('');
    }
    modal(`<div class="note"><div class="ntabs">${tabs.map(([k, n]) => `<button data-nt="${k}" class="${st.noteTab === k ? 'on' : ''}">${esc(n)}</button>`).join('')}</div><div class="npage">${body}</div></div>`);
    $$('[data-nt]', $('#modal')).forEach((b) => b.onclick = () => { st.noteTab = b.dataset.nt; save(); openNote(); });
    renderNoteDot();
  }
  function renderNoteDot() { const id = SG().id, has = !st.ended && lv(id) > (st.peek[id] || 0); $('#note-dot').hidden = !has; }

  /* =========================================================
     モーダル
     ========================================================= */
  function modal(html) { const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><button class="x" aria-label="とじる">×</button>${html}</div>`; $('.x', m).onclick = closeModal; }
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; U.pick = null; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  /* =========================================================
     はじまり・おわり
     ========================================================= */
  function flyer() {
    const f = $('#flyer'); f.hidden = false;
    const again = st.intro && !st.ended;
    f.innerHTML = `<div class="fl"><p class="fl-top">劇団月見座　秋季公演　千秋楽</p><p class="fl-play">仮面舞踏会の夜</p><div class="fl-line"></div>
      <h1>奈落の証人</h1><p class="fl-sub">昭和三十六年十一月二十六日。千秋楽の夜、舞台の真下で、演出家が死んでいた。</p>
      <div class="fl-b">${again ? '<button class="btn hot" id="fl-go">つづきから</button><button class="btn ghost" id="fl-new">はじめから</button>' : st.ended ? '<button class="btn hot" id="fl-go">劇場にもどる</button><button class="btn ghost" id="fl-new">はじめから</button>' : '<button class="btn hot" id="fl-go">開演</button>'}</div>
      <div id="fl-ask"></div><p class="fl-note">推理もの・約三十五分。音が出ます（あとで消せます）。<br>この作品はフィクションです。</p></div>`;
    $('#fl-go').onclick = () => { S.init(); S.mute(st.mute); S.sfx('hyoshigi'); f.hidden = true; if (!st.intro) { st.intro = true; save(); } if (st.ended) { renderAll(); return; } $('#scene').dataset.k = ''; run(); };
    const nw = $('#fl-new'); if (nw) nw.onclick = () => { $('#fl-ask').innerHTML = '<div class="ask">記録を消して、はじめからにしますか？<div class="fl-b"><button class="btn hot" id="fl-yes">消してはじめる</button><button class="btn ghost" id="fl-no">やめておく</button></div></div>'; $('#fl-yes').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); }; $('#fl-no').onclick = () => { $('#fl-ask').innerHTML = ''; }; };
  }
  async function finish() {
    st.ended = true; save(); S.pad(''); S.waltz({ loops: 2, vol: 0.5 });
    $('#act').textContent = '閉幕'; renderAll();
    await wait(600); showEnd();
  }
  function showEnd() {
    const e = $('#endc'), mins = Math.max(1, Math.round(st.playMs / 60000)), peek = Object.values(st.peek).reduce((a, b) => a + b, 0), n = EXTRAS.filter((k) => st.found[k]).length;
    e.hidden = false;
    e.innerHTML = `<div class="ec"><p class="ec-s">閉　幕</p><h2>奈落の証人</h2><div class="fl-line"></div>
      <dl><dt>推理にかかった時間</dt><dd>約${kn(mins)}分</dd><dt>羽柴の手帳</dt><dd>${kn(peek)}回</dd><dt>つきつけの空振り</dt><dd>${kn(st.miss)}回</dd><dt>見つけたもの</dt><dd>${kn(n)}／${kn(EXTRAS.length)}</dd></dl>
      <div class="fl-b"><button class="btn hot" id="ec-back">劇場にもどる</button></div></div>`;
    $('#ec-back').onclick = () => { e.hidden = true; S.stopWaltz(); };
  }
  let curtN = 0;
  $('#valance').addEventListener('click', async () => {
    curtN++; S.init(); S.sfx('ki');
    if (curtN === 7) { curtN = 0; find('curtain'); S.sfx('hyoshigi'); const c = $('#curtain'); c.innerHTML = '<div class="ct"><small>幻の</small><b>第三幕</b></div>'; c.classList.add('on'); await wait(1600); c.classList.remove('on'); }
  });
  $('#b-snd').addEventListener('click', () => { st.mute = !st.mute; S.init(); S.mute(st.mute); $('#b-snd').textContent = st.mute ? '音：切' : '音：入'; save(); });

  function renderAll() { renderEv(); renderWork(); renderNoteDot(); $('#b-snd').textContent = st.mute ? '音：切' : '音：入'; if (st.ended) { $('#act').textContent = '閉幕'; $('#scene').dataset.k = ''; scene('stage'); $('#dlg').hidden = true; plate(''); } }
  setInterval(() => {
    if (document.hidden || !st.intro || st.ended || !$('#flyer').hidden) return;
    const sp = STEP();
    if (sp.type !== 'talk' && !U.talking) { const id = SG().id, b = lv(id); st.stageMs[id] = (st.stageMs[id] || 0) + 1000; if (lv(id) > b) { renderNoteDot(); toast('羽柴の手帳に、メモが書き足された。'); } }
  }, 1000);
  setInterval(() => { if (document.hidden || !st.intro || st.ended || !$('#flyer').hidden) return; st.playMs += 5000; save(); }, 5000);
  document.addEventListener('visibilitychange', () => S.suspend(document.hidden));

  /* ---------- はじめる ---------- */
  scene(st.ended ? 'stage' : 'house');
  renderAll(); flyer();

  window.__nk = {
    st: () => st, U, run, skip: () => U.skip && U.skip(), present, look, give,
    go(stage, step) { st.stage = stage; st.step = step || 0; st.intro = true; $('#flyer').hidden = true; ++U.gen; U.talking = false; U.busy = false; $('#dlg').hidden = true; $('#scene').dataset.k = ''; run(); },
    all() { Object.keys(D.EV).forEach((k) => { if (!st.ev.includes(k)) st.ev.push(k); }); renderEv(); },
  };
})();
