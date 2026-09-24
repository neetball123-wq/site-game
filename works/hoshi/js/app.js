/* みなと天文館 — 進行・字幕・星をつなぐ・ロビー */
(() => {
  const KEY = 'hoshi.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, calm ? Math.min(ms, 120) : ms));
  const fresh = () => ({ act: 0, done: [], name: '', ended: false, hint: {}, seen: {}, mute: false, started: Date.now() });

  let st;
  try { st = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { st = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 保存できなくても遊べる */ } };
  const ACTS = () => [...HS.acts, HS.last];
  const act = () => ACTS()[Math.min(st.act, ACTS().length - 1)];

  /* ---------- 字幕 ---------- */
  let waiting = null;
  function showLine(t) {
    const el = $('#sub-line');
    el.innerHTML = [...String(t)].map((c, i) => `<span class="ch" style="animation-delay:${(i * 42)}ms">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
    return (String(t).length * 42) + 700;
  }
  function next() { if (waiting) { const w = waiting; waiting = null; if (HS.snd) HS.snd.tick(); w(); } }
  $('#sub-next').addEventListener('click', next);
  addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { if (waiting) { e.preventDefault(); next(); } } });
  $('#sub').addEventListener('click', next);
  async function lines(arr) {
    $('#sub').hidden = false;
    for (const t of arr) {
      const d = showLine(t);
      $('#sub-next').classList.remove('on');
      await sleep(Math.min(d, 2600));
      $('#sub-next').classList.add('on');
      await new Promise(r => { waiting = r; setTimeout(() => { if (waiting === r) { waiting = null; r(); } }, calm ? 200 : 9000); });
    }
    $('#sub-next').classList.remove('on');
    $('#sub-line').innerHTML = '';
  }

  /* ---------- 星を描く ---------- */
  function drawStars() {
    const g = $('#stars');
    g.innerHTML = Object.entries(HS.stars).map(([id, [x, y, mag, name]]) => {
      const r = mag === 1 ? 3.6 : mag === 2 ? 2.6 : 1.7;
      return `<g class="st${mag === 1 ? ' twinkle' : ''}" data-id="${id}" tabindex="0" role="button" aria-label="${esc(name || HS.num(id))}">
        <circle class="hit" cx="${x}" cy="${y}" r="18"/>
        <circle class="halo" cx="${x}" cy="${y}" r="${r + 7}"/>
        <circle class="dot" cx="${x}" cy="${y}" r="${r}"/>
        <text x="${x + 10}" y="${y - 8}">${HS.num(id)}${name ? '・' + esc(name) : ''}</text></g>`;
    }).join('');
  }

  /* ---------- つなぐ ---------- */
  let pick = null, drawn = [], target = [], onDone = null, tempLine = null;
  const key = (a, b) => [a, b].sort().join('-');
  /* ---------- 縦長の画面では、投影機がいまの星座のほうへ向く ----------
     空は横長（1000×620）。横幅の足りない画面では、その幕の星だけが収まるように寄る。 */
  const FULL = [0, 0, 1000, 620];
  let vb = FULL.slice(), vbRun = 0, curIds = null;
  /* 空は横長（1000×620）で、画面いっぱいに敷く（はみ出したぶんは切れる）。
     幕ごとに、その星座の星がぜんぶ「字幕と操作盤より上」に入るよう、必要なぶんだけ空をずらす。
     星の大きさは変えない。どうしても入りきらないときだけ、少し引いて広く見せる。寄ることはしない。 */
  const narrow = () => innerWidth / innerHeight < 1.6;
  function setVB(v) { vb = v; $('#chart').setAttribute('viewBox', v.map(n => n.toFixed(1)).join(' ')); }
  function baseVB() {
    const ar = innerWidth / innerHeight;
    return ar >= 1000 / 620 ? [0, (620 - 1000 / ar) / 2, 1000, 1000 / ar] : [(1000 - 620 * ar) / 2, 0, 620 * ar, 620];
  }
  function calcVB(ids) {
    const W = innerWidth, H = innerHeight, ar = W / H;
    let [vx, vy, vw, vh] = baseVB();
    if (!ids) return [vx, vy, vw, vh];
    const pts = ids.map(k => HS.stars[k]), pad = 34;
    const x0 = Math.min(...pts.map(p => p[0])) - pad, x1 = Math.max(...pts.map(p => p[0])) + pad;
    const y0 = Math.min(...pts.map(p => p[1])) - pad, y1 = Math.max(...pts.map(p => p[1])) + pad;
    const mt = 0.06, mx = 0.04, mb = Math.min(0.42, (H * (W <= 720 ? 0.16 : 0.13) + 84) / H);   // 下は字幕と操作盤のぶん
    const uw = 1 - 2 * mx, uh = 1 - mt - mb;
    if (x1 - x0 > vw * uw) { vw = (x1 - x0) / uw; vh = vw / ar; }
    if (y1 - y0 > vh * uh) { vh = (y1 - y0) / uh; vw = vh * ar; }
    vx = (1000 - vw) / 2; vy = (620 - vh) / 2;
    const clamp = (v, lo, hi) => lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi);
    vx = clamp(vx, x1 - vw * (1 - mx), x0 - vw * mx);
    vy = clamp(vy, y1 - vh * (1 - mb), y0 - vh * mt);
    return [vx, vy, vw, vh];
  }

  /* 空は、指やマウスでつかんで動かせる（星のないところを押したまま動かす） */
  let drag = null, dragged = false;
  $('#chart').addEventListener('pointerdown', e => {
    if (e.target.closest('.st')) return;
    drag = { x: e.clientX, y: e.clientY, vb: vb.slice() }; dragged = false;
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragged && Math.hypot(dx, dy) < 6) return;
    dragged = true; vbRun++;
    const k = drag.vb[2] / innerWidth, [, , w, h] = drag.vb;
    setVB([Math.min(Math.max(drag.vb[0] - dx * k, -200), 1200 - w), Math.min(Math.max(drag.vb[1] - dy * k, -160), 780 - h), w, h]);
  });
  addEventListener('pointerup', () => { drag = null; setTimeout(() => { dragged = false; }, 0); });
  addEventListener('pointercancel', () => { drag = null; dragged = false; });
  setVB(baseVB());
  function frameTo(ids, dur) {
    curIds = ids;
    const to = calcVB(ids), from = vb.slice(), t0 = performance.now(), me = ++vbRun;
    if (!dur) { setVB(to); return; }
    const step = () => {
      if (me !== vbRun) return;
      const k = Math.min(1, (performance.now() - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setVB(from.map((f, i) => f + (to[i] - f) * e));
      if (k < 1) setTimeout(step, 16);
    };
    step();
  }
  addEventListener('resize', () => frameTo(curIds, 0));

  function startAct(a) {
    frameTo([...new Set(a.edges.flat())], 1800);
    target = a.edges.map(([x, y]) => key(x, y));
    drawn = []; pick = null;
    $('#lines').innerHTML = ''; $('#figure').innerHTML = '';
    $$('.st').forEach(s => s.classList.remove('used', 'pick'));
    $('#c-year').textContent = a.year;
    $('#c-title').textContent = a.title ? '「' + a.title + '」' : '（なまえのない星座）';
  }
  function lineEl(x1, y1, x2, y2, cls = '') {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    if (cls) l.setAttribute('class', cls);
    l.style.setProperty('--len', Math.hypot(x2 - x1, y2 - y1).toFixed(1));
    $('#lines').append(l);
    return l;
  }
  function pointIn(e) {
    const svg = $('#chart'), p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  $('#chart').addEventListener('pointermove', e => {
    if (!pick || !tempLine) return;
    const p = pointIn(e);
    tempLine.setAttribute('x2', p.x); tempLine.setAttribute('y2', p.y);
  });
  function tap(id) {
    if (!target.length) return;
    const [x, y] = HS.stars[id];
    if (!pick) {
      pick = id;
      $(`.st[data-id="${id}"]`).classList.add('pick');
      tempLine = lineEl(x, y, x, y, 'temp');
      return;
    }
    if (pick === id) { clearPick(); return; }
    const k = key(pick, id);
    const [px, py] = HS.stars[pick];
    if (tempLine) { tempLine.remove(); tempLine = null; }
    if (target.includes(k) && !drawn.includes(k)) {
      drawn.push(k);
      lineEl(px, py, x, y);
      if (HS.snd) HS.snd.bell(drawn.length - 1);
      $(`.st[data-id="${pick}"]`).classList.add('used');
      $(`.st[data-id="${id}"]`).classList.add('used');
      msg('');
      if (drawn.length === target.length && onDone) { const f = onDone; onDone = null; setTimeout(f, 500); }
    } else {
      const bad = lineEl(px, py, x, y, 'bad');
      if (HS.snd) HS.snd.clack();
      setTimeout(() => bad.remove(), 700);
      msg(drawn.includes(k) ? 'その線は、もう 引いてあります。' : 'その二つは、つながりません。');
    }
    clearPick();
  }
  function clearPick() {
    if (tempLine) { tempLine.remove(); tempLine = null; }
    if (pick) $(`.st[data-id="${pick}"]`).classList.remove('pick');
    pick = null;
  }
  $('#stars').addEventListener('click', e => { const g = e.target.closest('.st'); if (g) tap(g.dataset.id); });
  // 星のないところを押すと、選びかけを やめる
  $('#chart').addEventListener('click', e => { if (dragged) return; if (!e.target.closest('.st')) clearPick(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') clearPick(); });
  $('#stars').addEventListener('keydown', e => { const g = e.target.closest('.st'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tap(g.dataset.id); } });
  const msg = t => { $('#c-msg').textContent = t; };
  let connecting = false;
  const waitConnect = () => new Promise(r => {
    if (target.length && drawn.length === target.length) return setTimeout(r, 400);
    connecting = true;
    onDone = () => { connecting = false; r(); };
  });

  /* ---------- 考えている時間（補助字幕は、時間がたつと一段ずつ出せる） ----------
     星をつなぐ待ち時間だけを、画面が見えているあいだ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const hintLeft = a => {
    const seen = st.hint[a.id] || 0, hs = HS.hints[a.id] || [];
    if (!hs.length || seen >= hs.length) return 0;
    return Math.max(0, HINT_AT[Math.min(seen, HINT_AT.length - 1)] - ((st.clock || {})[a.id] || 0));
  };
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !/show|last/.test(document.body.dataset.scene || '')) return;
    st.playMs = (st.playMs || 0) + 5000;
    if (connecting) { const a = act(); st.clock = st.clock || {}; st.clock[a.id] = (st.clock[a.id] || 0) + 5000; }
    save();
    const a = act(), hs = HS.hints[a.id] || [];
    $('#b-hint').classList.toggle('ready', connecting && hs.length > (st.hint[a.id] || 0) && hintLeft(a) === 0);
  }, 5000);

  /* ---------- 星座が決まったときの演出 ---------- */
  async function figure(a) {
    const g = $('#figure');
    const d = a.edges.map(([p, q]) => `M${HS.stars[p][0]} ${HS.stars[p][1]}L${HS.stars[q][0]} ${HS.stars[q][1]}`).join('');
    g.innerHTML = `<path d="${d}"/>`;
    $$('#lines line').forEach((l, i) => { l.style.transition = 'opacity .8s'; setTimeout(() => l.style.opacity = '1', i * 90); });
    if (a.title) {
      const f = $('#figname');
      f.textContent = a.title;
      f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    }
    HS.sky.meteor();
    if (HS.snd) { HS.snd.chord('up'); HS.snd.whoosh(); }
    await sleep(2200);
  }

  /* ---------- ロビー ---------- */
  const sketch = () => {
    const pts = HS.last.edges;
    const line = ([p, q]) => {
      const a = HS.stars[p], b = HS.stars[q];
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    };
    const dots = [...new Set(HS.last.edges.flat())].map(id => `<circle cx="${HS.stars[id][0]}" cy="${HS.stars[id][1]}" r="4"/>`).join('');
    return `<svg class="sketch" viewBox="420 60 240 300" aria-label="鉛筆の下絵">${pts.map(line).join('')}${dots}
      <text x="430" y="350">まだ なまえは ない</text></svg>`;
  };
  function lobbyBody(id) {
    const d = HS.docs[id];
    let body = '';
    if (d.note) body += `<p class="note">${esc(d.note)}</p>`;
    if (d.table) body += `<div class="startable">${Object.entries(HS.stars).filter(([, v]) => v[3]).map(([k, v]) => `<div>${HS.num(k)}<span>${esc(v[3])}</span></div>`).join('')}</div>
      <p class="note" style="margin-top:14px">※ 番号は、ドームの「番号灯」を 点けると 星のそばに 出ます。</p>`;
    if (d.draw) body += sketch();
    if (d.body) body += `<pre>${esc(d.body)}</pre>`;
    st.seen[id] = true; save();
    return `<h3>${esc(d.title)}</h3><p class="kind">${esc(d.kind)}</p>${body}`;
  }
  function lobby(on) {
    $('#lobby').hidden = !on;
    if (!on) return;
    const ids = Object.keys(HS.docs).filter(id => id !== 'draw' || st.act >= 5);
    $('#lb-tabs').innerHTML = ids.map((id, i) => `<button type="button" data-doc="${id}" aria-pressed="${i === 0}">${esc(HS.docs[id].kind)}</button>`).join('');
    $('#lb-body').innerHTML = lobbyBody(ids[0]);
  }
  $('#b-lobby').addEventListener('click', () => lobby(true));
  $('#lb-close').addEventListener('click', () => lobby(false));
  $('#lb-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-doc]');
    if (!b) return;
    $$('#lb-tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#lb-body').innerHTML = lobbyBody(b.dataset.doc);
  });
  $('#b-snd').addEventListener('click', e => {
    st.mute = !st.mute; save();
    if (HS.snd) HS.snd.mute(st.mute);
    e.currentTarget.setAttribute('aria-pressed', String(!st.mute));
    msg(st.mute ? '音を 止めました。' : '音を 出します。');
  });
  $('#b-num').addEventListener('click', e => {
    const on = !document.body.classList.contains('nums');
    document.body.classList.toggle('nums', on);
    e.currentTarget.setAttribute('aria-pressed', String(on));
  });
  $('#b-hint').addEventListener('click', () => {
    const a = act(), hs = HS.hints[a.id] || [];
    if (!hs.length) return;
    const seen = st.hint[a.id] || 0, left = hintLeft(a);
    if (left > 0) {
      msg((seen ? hs[seen - 1] + '　' : '') + '（' + (seen ? 'つぎの' : '') + '補助字幕は、もうすこし あとで 出ます。あと ' + fmtLeft(left) + '）');
      return;
    }
    msg(hs[Math.min(seen, hs.length - 1)]);
    st.hint[a.id] = Math.min(seen + 1, hs.length); save();
    $('#b-hint').classList.remove('ready');
  });

  /* ---------- 進行 ---------- */
  async function runAct(a) {
    startAct(a);
    await lines(a.open);
    if (a.guide) { msg('解説：' + a.guide.split('\n')[0]); await lines([a.guide]); }
    else msg('（解説は ありません。ロビーの 下絵を ご覧ください）');
    await waitConnect();
    await figure(a);
    await lines(a.done);
    msg('');
  }
  async function turnSky() {
    /* 星図そのものは回さない（端の星が画面の外や字幕の下へ逃げて、押せなくなるので）。回るのは背景の空だけ */
    $('#chart').style.transform = 'none';
    HS.sky.rotate(0.55);
    if (HS.snd) HS.snd.chordTo(st.act);
    await sleep(2400);
  }
  async function show() {
    document.body.dataset.scene = 'show';
    for (; st.act < HS.acts.length; st.act++) {
      save();
      await runAct(HS.acts[st.act]);
      if (!st.done.includes(HS.acts[st.act].id)) st.done.push(HS.acts[st.act].id);
      save();
      await turnSky();
    }
    document.body.dataset.scene = 'last';
    save();
    await runAct(HS.last);
    if (!st.done.includes('a6')) st.done.push('a6');
    save();
    await lines(HS.last.done);
    await finale();
  }
  async function finale() {
    await lines(HS.finale);
    $('#ask').hidden = false;
    $('#ask-name').focus();
    const name = await new Promise(r => {
      $('#ask-form').addEventListener('submit', e => {
        e.preventDefault();
        r(($('#ask-name').value || '').trim() || 'なまえのない星座');
      }, { once: true });
    });
    $('#ask').hidden = true;
    st.name = name; save();
    const f = $('#figname');
    f.textContent = name;
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    if (HS.snd) HS.snd.chord('up');
    await sleep(1800);
    await lines(HS.after.map(t => t.replace('{NAME}', name)));
    if (HS.snd) HS.snd.warm();
    document.body.classList.add('lit');
    document.body.dataset.scene = 'end';
    await sleep(4200);
    st.ended = true; save();
    endcard(name);
  }
  function endcard(name) {
    $('#end').innerHTML = `<div class="end-in">
      <p class="kind">みなと天文館　最終投影</p>
      <h2>本日の投影は、以上です</h2>
      <p>ご来館、ありがとうございました。<br>四十一年間の 投影記録は、閉館後、市の 図書館に 移されます。</p>
      <div class="rec">
        <p style="margin:0 0 8px">投影記録票（最終行）</p>
        <p style="margin:0">2026.03.31　閉館。最終投影「あなたのための星座」。入館 1名。<br>
        同日　命名：<b>${esc(name)}</b>　解説：高梨　立会：あなた</p>
      </div>
      <div class="end-btns"><button type="button" id="again">もう一度 見る</button></div>
    </div>`;
    $('#end').hidden = false;
    $('#again').addEventListener('click', () => { localStorage.removeItem(KEY); location.reload(); });
  }

  /* ---------- 開演 ---------- */
  $('#start').addEventListener('click', async () => {
    $('#title').style.transition = 'opacity 1.6s';
    $('#title').style.opacity = '0';
    HS.sky.start();
    if (HS.snd) { HS.snd.start(); HS.snd.mute(!!st.mute); $('#b-snd').setAttribute('aria-pressed', String(!st.mute)); }
    await sleep(1400);
    $('#title').hidden = true;
    document.body.classList.add('opened');
    await sleep(1600);
    $('#console').hidden = false;
    drawStars();
    show();
  });

  addEventListener('DOMContentLoaded', () => {
    // 途中からでは演出が成立しないので、上映は毎回はじめから。見終えた記録だけは残す
    if (st.ended || st.act > 0) {
      const keep = st.ended ? { ended: true, name: st.name, done: st.done, playMs: st.playMs || 0 } : { playMs: st.playMs || 0 };
      st = Object.assign(fresh(), keep); save();
    }
    drawStars();
  });
  window.HOSHI = { st: () => st };
})();
