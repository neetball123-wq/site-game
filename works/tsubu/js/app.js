/* =========================================================
   ツブのとっておき — 画面の流れ
   ========================================================= */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const PX = window.PX, TA = window.TA, TI = window.TI, TR = window.TR, R2 = window.TR2, TS = window.TS, TE = window.TE, SND = window.TSND;
  const KEY = 'tsubu.v1';
  const RES = [[40, 30], [40, 30], [64, 48], [88, 66], [104, 78]];
  const TIN_NAME = ['', 'ドロップの缶', 'クッキーの缶', '木の箱', '古いトランク'];
  const ABORT = { abort: 1 };
  let gen = 0, FAST = false;

  /* ---------- 保存 ---------- */
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.meta = Object.assign({ ends: {}, items: {}, kept: {}, runs: 0 }, S.meta || {});
  const persist = () => { if (document.body.classList.contains('cover')) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  setInterval(() => { if (!document.hidden) { S.playMs = (S.playMs || 0) + 5000; persist(); } }, 5000);
  const seen = (id) => { if (id) S.meta.items[id] = 1; };

  /* ---------- 画面 ---------- */
  function show(id) { document.querySelectorAll('.scr').forEach((e) => e.classList.toggle('on', e.id === id)); }
  function bodyTime(t) { const b = document.body; [...b.classList].filter((c) => c.startsWith('t-')).forEach((c) => b.classList.remove(c)); b.classList.add('t-' + t); }

  /* ---------- 待つ・動かす（タップで飛ばせる） ---------- */
  const waiters = new Set();
  function wait(ms) {
    return new Promise((res) => {
      if (FAST) return res();
      const w = () => { clearTimeout(id); waiters.delete(w); res(); };
      const id = setTimeout(w, ms); waiters.add(w);
    });
  }
  function tween(ms, fn) {
    return new Promise((res) => {
      if (FAST) { fn(1); return res(); }
      const t0 = performance.now(); let done = false;
      const fin = () => { if (done) return; done = true; waiters.delete(fin); fn(1); res(); };
      waiters.add(fin);
      const step = (t) => { if (done) return; const p = Math.min(1, (t - t0) / ms); fn(p); if (p >= 1) fin(); else requestAnimationFrame(step); };
      requestAnimationFrame(step);
      setTimeout(fin, ms + 400); // 画面が隠れていても止まらないように
    });
  }
  const skipNow = () => [...waiters].forEach((w) => w());
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  async function X(g, p) { const r = await p; if (g !== gen) throw ABORT; return r; }

  /* ---------- 入力（ボタン・札・缶の仕切り） ---------- */
  let inputRes = null;
  const input = () => new Promise((res) => (inputRes = res));
  function give(v) { if (inputRes) { const r = inputRes; inputRes = null; r(v); } }
  function setActs(list) {
    const el = $('#acts'); el.innerHTML = '';
    (list || []).forEach((b) => {
      const e = document.createElement('button'); e.type = 'button';
      e.className = 'btn' + (b.main ? ' main' : '') + (b.sm ? ' sm' : ''); e.textContent = b.label; e.disabled = !!b.dis;
      e.onclick = () => { SND.play('tap'); give({ t: 'act', k: b.k }); };
      el.appendChild(e);
    });
  }

  /* ---------- 語り ---------- */
  const sayBox = $('#say'), sayT = $('#say-t');
  let typing = null, sayWait = null;
  function say(text, hold) {
    return new Promise((res) => {
      if (typing) typing.fin();
      sayBox.classList.remove('wait');
      const s = String(text || ''); let i = 0; let done = false; let iv = null;
      const fin = () => { if (done) return; done = true; clearInterval(iv); sayT.textContent = s; typing = null; after(); };
      const after = () => {
        if (!hold) return res();
        sayBox.classList.add('wait');
        sayWait = () => { sayWait = null; sayBox.classList.remove('wait'); res(); };
        if (FAST) sayWait();
      };
      sayT.textContent = '';
      typing = { fin };
      if (FAST) return fin();
      iv = setInterval(() => { i++; sayT.textContent = s.slice(0, i); if (i >= s.length) fin(); }, 32);
    });
  }
  function tapAdvance() {
    if (typing) { typing.fin(); return; }
    if (sayWait) { SND.play('tap'); sayWait(); return; }
    skipNow();
  }
  sayBox.addEventListener('click', tapAdvance);

  /* ---------- 部屋とツブを描く ---------- */
  const cv = $('#view'), cx = cv.getContext('2d');
  const V = {
    st: 1, W: 40, H: 30, time: 'morning', season: 'spring', deco: {}, rand: null, tint: 'fu', door: false,
    look: { hair: 'fu', outfit: 'fu', tint: 'fu', yoru: 0, acc: [] }, face: 'n', faceT: 0, gx: 20, gy: 28,
    show: true, walk: 0, held: null, mode: 'room', pro: null, fade: null, mosaic: null, fx: [], sleep: false, bag: false, last: null,
  };
  let roomC = { key: '', b: null };
  const girlC = {};
  function roomBmp() {
    const key = [V.st, V.W, V.H, V.time, V.season, JSON.stringify(V.deco), V.rand, V.tint, V.door].join('|');
    if (roomC.key !== key) roomC = { key, b: R2.room(V.W, V.H, { st: V.st, time: V.time, season: V.season, deco: V.deco, randoseru: V.rand, tint: V.tint, doorOpen: V.door }) };
    return roomC.b;
  }
  function girlBmp(face) {
    const key = V.st + '|' + JSON.stringify(V.look) + '|' + face;
    if (!girlC[key]) girlC[key] = TA.build(V.st, V.look, face);
    return girlC[key];
  }
  const spot = () => R2.spot(V.W, V.H), doorAt = () => R2.door(V.W, V.H);
  function curFace(t) {
    if (V.faceT && t > V.faceT) { V.face = V.sleep ? 'zzz' : 'n'; V.faceT = 0; }
    if (V.face === 'n' && !V.sleep && (t % 3700) < 130) return 'blink';
    return V.face;
  }
  function face(f, ms) { V.face = f; V.faceT = ms ? performance.now() + ms : 0; }

  function compose(t) {
    const W = V.W, H = V.H;
    if (V.mode === 'pro') return proFrame(t);
    const room = roomBmp();
    const b = room.clone();
    let gpos = null;
    if (V.show) {
      const f = curFace(t), g = girlBmp(f);
      let bob = 0;
      if (V.walk) bob = Math.floor(t / 150) % 2;
      const fl = V.look.yoru >= 3 && V.st >= 2 && !V.walk ? -1 - (Math.floor(t / 800) % 2) : 0;
      const x = Math.round(V.gx - g.w / 2), y = Math.round(V.gy - g.h - bob + fl);
      if (V.bag) drawBag(b, x, y, g);
      b.blit(g, x, y);
      gpos = { x, y, w: g.w, h: g.h };
      if (V.held) {
        const a = TA.S[V.st].anchor.hand, n = [0, 5, 7, 8, 9][V.st];
        const m = TI.mini(V.held, n);
        b.blit(m, x + a[0] + 1 - (n >> 1) + 1, y + a[1] + 1 - (n >> 1));
      }
    }
    R2.light(b, room);
    if (gpos) {
      const d = TA.dot(V.st); const gc = (TA.TINT[V.look.tint] || TA.TINT.fu).g;
      const px = gpos.x + d[0], py = gpos.y + d[1];
      b.put(px, py, gc);
      if (V.time === 'night' || V.time === 'evening') {
        const a = 0.25 + 0.15 * Math.sin(t / 400);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => b.put(px + dx, py + dy, gc, a));
      }
    }
    drawFx(b, t, room);
    if (V.fade) {
      const p = Math.min(1, (t - V.fade.t0) / V.fade.dur), o = V.fade.old;
      if (o.w === W && o.h === H) { const d = b.d, od = o.d; for (let i = 0; i < d.length; i += 4) { d[i] = od[i] + (d[i] - od[i]) * p; d[i + 1] = od[i + 1] + (d[i + 1] - od[i + 1]) * p; d[i + 2] = od[i + 2] + (d[i + 2] - od[i + 2]) * p; } }
      if (p >= 1) V.fade = null;
    }
    if (V.mosaic) {
      const m = V.mosaic, p = Math.min(1, (t - m.t0) / m.dur);
      if (!m.old) m.old = PX.shrink(b, m.from[0], m.from[1]);
      const o = m.old;
      if (!m.r || m.r.length !== W * H) { m.r = new Float32Array(W * H); for (let i = 0; i < m.r.length; i++) m.r[i] = Math.random(); }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (m.r[i] < p * 1.15 - 0.1) continue;
        const c = o.get(Math.floor(x * o.w / W), Math.floor(y * o.h / H));
        const k = i * 4;
        if (c) { b.d[k] = c[0]; b.d[k + 1] = c[1]; b.d[k + 2] = c[2]; } else { b.d[k] = 7; b.d[k + 1] = 6; b.d[k + 2] = 13; }
        if (Math.abs(m.r[i] - (p * 1.15 - 0.1)) < 0.006) { b.d[k] = 255; b.d[k + 1] = 250; b.d[k + 2] = 220; }
      }
      if (p >= 1) V.mosaic = null;
    }
    if (V.white) { const k = V.white, d = b.d; for (let i = 0; i < d.length; i += 4) { d[i] += (255 - d[i]) * k; d[i + 1] += (250 - d[i + 1]) * k; d[i + 2] += (235 - d[i + 2]) * k; } }
    if (V.dark) { const k = 1 - V.dark; const d = b.d; for (let i = 0; i < d.length; i += 4) { d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } }
    return b;
  }
  // 旅立ちのかばん
  function drawBag(b, x, y, g) {
    const n = Math.max(4, Math.round(g.w * 0.45)), h = Math.max(3, Math.round(n * 0.75));
    const bx = x + g.w - 2, by = y + g.h - h - 1;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < n; xx++) b.put(bx + xx, by + yy, yy === 0 || xx === 0 || xx === n - 1 || yy === h - 1 ? '#5a3424' : yy === (h >> 1) ? '#d6b35a' : '#9c5f3f');
    b.put(bx + (n >> 1), by - 1, '#5a3424'); b.put(bx + (n >> 1) - 1, by - 1, '#5a3424');
  }
  function drawFx(b, t, room) {
    const m = room.meta;
    // 窓の外の雪・花びら
    if (V.season === 'winter' || V.season === 'spring') {
      const n = V.st >= 3 ? 10 : 6, w = m.x1 - m.x0, h = m.y1 - m.y0;
      for (let k = 0; k < n; k++) {
        const sp = V.season === 'winter' ? 0.004 : 0.0028;
        const yy = m.y0 + ((k * 37 + t * sp * (1 + k % 3 * 0.3)) % h);
        const xx = m.x0 + ((k * 53 + Math.sin(t / 900 + k) * 2 + t * 0.001 * (k % 2 ? 1 : -1)) % w + w) % w;
        b.put(Math.floor(xx), Math.floor(yy), V.season === 'winter' ? '#ffffff' : (k % 2 ? '#ffc4d8' : '#ffe2ea'), 0.9);
      }
    }
    // きらきら
    V.fx = V.fx.filter((f) => t - f.t0 < f.life);
    for (const f of V.fx) {
      const p = (t - f.t0) / f.life;
      if (f.k === 'spark') {
        const x = Math.round(f.x + f.vx * p), y = Math.round(f.y + f.vy * p);
        const on = Math.floor(t / 90 + f.x) % 3 !== 0;
        if (on) { b.put(x, y, f.c); if (V.st >= 3 && p < 0.5) { b.put(x + 1, y, f.c, 0.5); b.put(x - 1, y, f.c, 0.5); b.put(x, y + 1, f.c, 0.5); b.put(x, y - 1, f.c, 0.5); } }
      } else if (f.k === 'z') {
        const x = Math.round(f.x + Math.sin(p * 6) * 1.5), y = Math.round(f.y - p * 6);
        (V.W < 60 ? [[0, 0]] : [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]).forEach(([dx, dy]) => b.put(x + dx, y + dy, '#e8e0ff', (1 - p) * 0.8));
      }
    }
    if (V.sleep && V.show && Math.floor(t / 1400) !== V._zt) { V._zt = Math.floor(t / 1400); const d = TA.dot(V.st); V.fx.push({ k: 'z', x: Math.round(V.gx + 3), y: Math.round(V.gy - TA.S[V.st].h + d[1]), t0: t, life: 1400 }); }
  }
  function sparks(x, y, n, c) {
    const t = performance.now();
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * (V.W / 10); V.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * r, vy: Math.sin(a) * r - 2, t0: t + Math.random() * 200, life: 700 + Math.random() * 500, c: c || '#fff3c4' }); }
  }

  // プロローグ：黒い画面と、ひと粒の光
  function proFrame(t) {
    const P = V.pro, b = new PX.Bmp(V.W, V.H);
    b.fill(0, 0, V.W, V.H, '#07060d');
    [[5, 4], [33, 3], [12, 20], [30, 22], [22, 8], [3, 16], [37, 13]].forEach(([x, y], i) => { if ((Math.floor(t / 700) + i) % 4) b.put(x, y, '#2b2842'); });
    const s = P.size || 1, x = Math.round(P.x), y = Math.round(P.y);
    const pulse = 0.5 + 0.5 * Math.sin(t / 380);
    for (let r = 3; r >= 1; r--) for (let yy = -r - s; yy <= r + s; yy++) for (let xx = -r - s; xx <= r + s; xx++) {
      if (Math.abs(xx) + Math.abs(yy) <= r + s) b.put(x + xx, y + yy, '#fff3c4', (0.05 + pulse * 0.05) * (4 - r) * (P.glow || 1));
    }
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) b.put(x - (s >> 1) + xx, y - (s >> 1) + yy, '#fffbe6');
    return b;
  }

  let imgD = null;
  function frame(t) {
    requestAnimationFrame(frame);
    if (!$('#game').classList.contains('on')) return;
    const b = compose(t);
    V.last = b;
    if (cv.width !== b.w || cv.height !== b.h) { cv.width = b.w; cv.height = b.h; imgD = null; }
    if (!imgD) imgD = cx.createImageData(b.w, b.h);
    imgD.data.set(b.d); cx.putImageData(imgD, 0, 0);
  }
  requestAnimationFrame(frame);
  $('#view-box').addEventListener('click', (e) => {
    if (e.target.closest('.card')) return;
    if (V.mode === 'room' && V.show && V.last && !typing && !sayWait && !waiters.size) pokeGirl(e);
    else tapAdvance();
  });

  // ツブをつつく（隠し：何度もつつくと……）
  let pokes = [];
  function pokeGirl(e) {
    const r = $('#view-box').getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * V.W, y = (e.clientY - r.top) / r.height * V.H;
    const g = girlBmp('n'), gx = V.gx - g.w / 2, gy = V.gy - g.h;
    if (x < gx || x > gx + g.w || y < gy || y > gy + g.h) return;
    const d = TA.dot(V.st);
    if (Math.abs(x - (gx + d[0])) < 2.5 && Math.abs(y - (gy + d[1])) < 2.5) { SND.play('glow'); sparks(Math.round(gx + d[0]), Math.round(gy + d[1]), 6, (TA.TINT[V.look.tint] || TA.TINT.fu).g); return; }
    const now = performance.now(); pokes = pokes.filter((p) => now - p < 2500); pokes.push(now);
    if (pokes.length >= 6) { pokes = []; face('wow', 1400); SND.play('giggle'); sparks(Math.round(V.gx), Math.round(gy + 4), 5, '#ffb3de'); return; }
    face('joy', 700); SND.play('tap');
  }

  /* ---------- 時期・時間・見た目 ---------- */
  function setStage(st, old) {
    const [W, H] = RES[st];
    if (old) V.mosaic = { from: [old.w, old.h], t0: performance.now(), dur: FAST ? 1 : 2600 };
    $('#season').classList.remove('on');
    V.st = st; V.W = W; V.H = H; V.mode = 'room';
    const sp = spot(); V.gx = sp.x; V.gy = sp.y;
    $('#tin').className = 'tin s' + st;
    $('#box-cap').textContent = TIN_NAME[st] || '';
  }
  function setTime(t, fadeMs) {
    if (fadeMs && V.last && V.last.w === V.W) V.fade = { old: V.last.clone(), t0: performance.now(), dur: FAST ? 1 : fadeMs };
    V.time = t; bodyTime(t);
  }
  function refreshLook(fx) {
    const r = S.run; if (!r) return;
    const before = JSON.stringify(V.look);
    V.look = TR.look(r);
    const sc = TR.now(r);
    const deco = {};
    TR.ALL.forEach((k) => { deco[k] = sc[k] >= 6 ? 2 : sc[k] >= 2.5 ? 1 : 0; });
    V.deco = deco; V.tint = V.look.tint; V.rand = r.flags.randoseru || null;
    if (fx && before !== JSON.stringify(V.look)) { SND.play('glow'); sparks(Math.round(V.gx), Math.round(V.gy - TA.S[V.st].h / 2), 10); }
  }
  function ageLabel() {
    const r = S.run; if (!r || !r.st) { $('#age').textContent = ''; return; }
    const tm = TR.timeOf(r);
    $('#age').textContent = `${tm.age}さい・${TS.SEASON[tm.season]}`;
  }
  async function seasonCard(g, season) {
    const el = $('#season'); el.textContent = TS.SEASON[season];
    el.classList.add('on'); SND.play('season');
    await X(g, wait(900)); el.classList.remove('on'); await X(g, wait(300));
  }
  async function walkTo(g, x, ms) {
    const x0 = V.gx; V.walk = 1;
    let lastStep = 0;
    await X(g, tween(ms || 900, (p) => { V.gx = x0 + (x - x0) * ease(p); const s = Math.floor(p * 6); if (s !== lastStep) { lastStep = s; SND.play('step'); } }));
    V.walk = 0;
  }

  /* ---------- 缶の中 ---------- */
  function iconCv(id) { const c = PX.toCanvas(TI.icon(id)); return c; }
  function tray(mode, sel) {
    const r = S.run, el = $('#tray');
    const st = TR.STAGES[Math.max(1, r.st)];
    el.style.setProperty('--cols', st.cols);
    el.innerHTML = '';
    el.classList.toggle('swap', mode === 'swap');
    r.tin.forEach((id, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'slot' + (id ? ' has' : ''); b.dataset.i = i;
      if (id) { b.appendChild(iconCv(id)); b.setAttribute('aria-label', TI.get(id).name); } else b.setAttribute('aria-label', 'からっぽ');
      if (id && r.held === id) b.classList.add('held');
      if (id && sel && sel.indexOf(id) >= 0) b.classList.add('pick');
      b.onclick = () => { if (id && mode !== 'none') { SND.play('tap'); give({ t: 'slot', id, i }); } };
      el.appendChild(b);
    });
  }
  function slotEl(i) { return $('#tray').children[i]; }

  /* ---------- 物の説明 ---------- */
  function peek(id, buttons) {
    return new Promise((res) => {
      const it = TI.get(id);
      const c = $('#peek-cv'), b = TI.icon(id);
      c.width = b.w; c.height = b.h; PX.toCanvas(b, c);
      $('#peek-n').textContent = it.name; $('#peek-s').textContent = it.say;
      const box = $('#peek-b'); box.innerHTML = '';
      buttons.forEach((x) => { const e = document.createElement('button'); e.type = 'button'; e.className = 'btn sm' + (x.main ? ' main' : ''); e.textContent = x.label; e.onclick = () => { SND.play('tap'); $('#peek').hidden = true; res(x.k); }; box.appendChild(e); });
      $('#peek').hidden = false;
      $('#peek').onclick = (e) => { if (e.target.id === 'peek') { $('#peek').hidden = true; res('close'); } };
    });
  }
  function confirmBox(text, yes, no) {
    return new Promise((res) => {
      $('#ask-t').textContent = text;
      const b = $('#ask-b'); b.innerHTML = '';
      [[yes || 'はい', true, 1], [no || 'やめる', false, 0]].forEach(([l, v, m]) => { const e = document.createElement('button'); e.type = 'button'; e.className = 'btn sm' + (m ? ' main' : ''); e.textContent = l; e.onclick = () => { SND.play('tap'); $('#ask').hidden = true; res(v); }; b.appendChild(e); });
      $('#ask').hidden = false;
    });
  }

  /* ---------- もち帰った物の札 ---------- */
  function showCards(o, sel) {
    let box = $('#cards');
    if (!box) { box = document.createElement('div'); box.className = 'cards'; box.id = 'cards'; $('#view-box').appendChild(box); }
    box.innerHTML = '';
    const list = [];
    if (o.hers) list.push({ id: o.hers, hers: 1 });
    o.items.forEach((id) => list.push({ id }));
    if (o.hidden) list.splice(1, 0, { back: 1 });
    list.forEach((c) => {
      const e = document.createElement('button'); e.type = 'button';
      e.className = 'card' + (c.back ? ' back' : '') + (c.hers ? ' hers' : '') + (sel && sel === c.id ? ' sel' : '');
      if (c.back) { e.innerHTML = '<b>？</b>'; e.onclick = () => give({ t: 'card', back: 1 }); } else {
        e.appendChild(iconCv(c.id)); const n = document.createElement('b'); n.textContent = TI.get(c.id).name; e.appendChild(n);
        e.dataset.id = c.id;
        e.onclick = () => give({ t: 'card', id: c.id, hers: c.hers });
      }
      box.appendChild(e);
    });
    return box;
  }
  function clearCards() { const b = $('#cards'); if (b) b.remove(); }
  function markCard(id) { document.querySelectorAll('#cards .card').forEach((e) => e.classList.toggle('sel', e.dataset.id === id)); }
  async function flyCard(g, id, target) {
    const c = document.querySelector(`#cards .card[data-id="${id}"]`); if (!c) return;
    const a = c.getBoundingClientRect(), bR = target.getBoundingClientRect();
    c.classList.add('fly'); c.style.zIndex = 5;
    void c.offsetWidth;
    c.style.transform = `translate(${bR.left + bR.width / 2 - (a.left + a.width / 2)}px, ${bR.top + bR.height / 2 - (a.top + a.height / 2)}px) scale(${Math.max(0.25, bR.width / a.width)})`;
    c.style.opacity = '0.2';
    await X(g, wait(560));
    c.style.visibility = 'hidden';
  }
  function girlRect() {
    const vb = $('#view-box').getBoundingClientRect(), g = girlBmp('n');
    const k = vb.width / V.W;
    return { left: vb.left + (V.gx - g.w / 2) * k, top: vb.top + (V.gy - g.h) * k, width: g.w * k, height: g.h * k, getBoundingClientRect() { return this; } };
  }

  /* ---------- できごとの重ね ---------- */
  function overlay(html) { $('#ov-in').innerHTML = html; $('#ov').hidden = false; }
  function overlayOff() { $('#ov').hidden = true; $('#ov-in').innerHTML = ''; }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function overlayLines(g, title, lines, choices, grid) {
    overlay(`<p class="ev-t">${esc(title)}</p><div id="ev-body"></div><div class="ev-c${grid ? ' grid' : ''}" id="ev-c"></div>`);
    const body = $('#ev-body');
    for (const l of lines) {
      const p = document.createElement('p'); p.className = 'ev-l'; p.textContent = l; body.appendChild(p);
      if (!FAST) await X(g, wait(420));
    }
    const box = $('#ev-c');
    return new Promise((res) => {
      choices.forEach((c, i) => {
        const e = document.createElement('button'); e.type = 'button'; e.className = 'btn';
        if (c.sw) { const s = document.createElement('span'); s.className = 'sw'; s.style.background = c.sw; e.appendChild(s); }
        if (c.icon) { const ic = iconCv(c.icon); ic.style.cssText = 'width:26px;display:inline-block;vertical-align:middle;margin-right:6px'; e.appendChild(ic); }
        e.appendChild(document.createTextNode(c.label));
        e.onclick = () => { SND.play('tap'); res(i); };
        box.appendChild(e);
      });
    });
  }

  /* =========================================================
     すすめかた
     ========================================================= */
  async function play() {
    const g = ++gen;
    try {
      while (S.run) {
        const r = S.run;
        if (r.phase === 'prologue') await doPrologue(g);
        else if (r.phase === 'morning') await doMorning(g);
        else if (r.phase === 'evening') await doEvening(g);
        else if (r.phase === 'event') await doEvent(g);
        else if (r.phase === 'growth') await doGrowth(g);
        else if (r.phase === 'depart') await doDepart(g);
        else if (r.phase === 'end') { await doEnding(g); return; }
        persist();
      }
    } catch (e) { if (e !== ABORT) console.error(e); }
  }

  /* ---- プロローグ ---- */
  async function doPrologue(g) {
    const r = S.run;
    show('game'); setActs([]); $('#age').textContent = '';
    $('#tin').className = 'tin s1 pro'; $('#tray').innerHTML = ''; $('#box-cap').textContent = '';
    bodyTime('night'); SND.music(null);
    V.mode = 'pro'; V.W = 40; V.H = 30; V.pro = { x: 20, y: -2, size: 1, glow: 1 };
    say('');
    SND.play('fall');
    const fall = tween(3200, (p) => { V.pro.x = 20 + Math.sin(p * 7) * 3 * (1 - p); V.pro.y = -2 + (15 + 2) * ease(p); });
    await X(g, say(TS.PROLOGUE[0], true));
    await X(g, fall);
    await X(g, say(TS.PROLOGUE[1], true));
    await X(g, say(TS.PROLOGUE[2]));
    setActs([{ k: 'touch', label: 'そっと ふれる', main: true }]);
    await X(g, input()); setActs([]);
    SND.play('pulse');
    for (const s of [2, 3, 4]) { V.pro.size = s; V.pro.glow = 1 + s * 0.3; await X(g, wait(420)); }
    // 光が、部屋と女の子になる
    const old = compose(performance.now());
    SND.play('grow');
    V.st = 1; setStage(1, old); setTime('night');
    V.mosaic.old = PX.shrink(old, 8, 6);
    V.look = { hair: 'fu', outfit: 'fu', tint: 'fu', yoru: 0, acc: [] }; V.deco = {}; V.tint = 'fu';
    face('zzz'); V.sleep = true;
    SND.music('night');
    await X(g, wait(2600));
    $('#tin').className = 'tin s1';
    for (const l of TS.PROLOGUE2) await X(g, say(l, true));
    V.sleep = false; face('n');
    r.tin = [null, null, null, null];
    tray('none');
    await X(g, say(TS.PROLOGUE3[0]));
    showCards({ items: ['hikari'] });
    seen('hikari');
    setActs([{ k: 'keep', label: 'とっておく', main: true }, { k: 'no', label: 'そのままにする' }]);
    let v;
    do { v = await X(g, input()); if (v.t === 'card') { markCard('hikari'); say(TI.get('hikari').say); } } while (v.t !== 'act');
    setActs([]);
    if (v.k === 'keep') {
      await flyCard(g, 'hikari', slotEl(0));
      TR.prologue(r, true); S.meta.kept.hikari = 1;
      SND.play('keep'); tray('none'); slotEl(0).classList.add('new');
      await X(g, say('光のかけらを、ちいさな缶に しまった。', true));
    } else {
      TR.prologue(r, false);
      await X(g, say('光のかけらは、朝になると 消えていた。', true));
    }
    clearCards();
    persist();
  }

  /* ---- 朝 ---- */
  function morningLine(r) {
    const M = TS.MORNING[r.st] || TS.MORNING[2];
    const empty = !r.tin.some(Boolean) && r.kept <= 1;
    let list = empty && M.empty ? M.empty : (M[V.look.tint] || M.fu);
    if (r.turn % 3 === 2 && !empty) list = M.fu;
    return list[(r.turn + r.st) % list.length];
  }
  async function doMorning(g) {
    const r = S.run;
    show('game'); setStage(r.st);
    const tm = TR.timeOf(r);
    V.season = tm.season; setTime('morning'); refreshLook();
    V.show = true; V.gx = spot().x; V.sleep = false; face('n'); V.held = r.held; V.bag = false;
    ageLabel(); tray('none'); setActs([]);
    SND.music('s' + r.st);
    if (!r.flags['sc' + r.st + '_' + r.turn]) { r.flags['sc' + r.st + '_' + r.turn] = 1; await seasonCard(g, tm.season); }
    const line = morningLine(r);
    say(line + (r.st === 2 && !S.meta.guideHold && r.tin.some(Boolean) ? '\n（缶の中のものを、ひとつ 持たせられる）' : ''));
    if (r.st === 2) S.meta.guideHold = 1;
    for (;;) {
      tray('morning');
      setActs([{ k: 'go', label: TS.OUT[r.st], main: true }]);
      const v = await X(g, input());
      if (v.t === 'act' && v.k === 'go') break;
      if (v.t !== 'slot') continue;
      const it = TI.get(v.id);
      if (r.st < 2) { await X(g, peek(v.id, [{ k: 'close', label: 'とじる' }])); continue; }
      const held = r.held === v.id;
      const k = await X(g, peek(v.id, [{ k: 'hold', label: held ? 'かえしてもらう' : 'もたせる', main: true }, { k: 'rel', label: 'てばなす' }, { k: 'close', label: 'とじる' }]));
      if (k === 'hold') {
        TR.give(r, held ? null : v.id); V.held = r.held;
        if (r.held) { face('joy', 1000); SND.play('held'); say(TS.HELD[r.st](it.name)); } else say(line);
        persist();
      } else if (k === 'rel') {
        const ok = await X(g, confirmBox(`「${it.name}」を 手放しますか？\nもう もどってきません。`, '手放す', 'やめる'));
        if (!ok) continue;
        const i = r.tin.indexOf(v.id);
        slotEl(i).classList.add('gone');
        SND.play('release'); await X(g, wait(450));
        TR.release(r, v.id); V.held = r.held;
        refreshLook(true); face('sad', 1300);
        say(TS.RELEASE[r.st](it.name));
        persist();
      }
    }
    setActs([]); tray('none');
    TR.goOut(r); persist();
    await outing(g);
  }
  async function outing(g) {
    const r = S.run, d = doorAt();
    face('n');
    say(r.st === 1 ? 'ツブを だっこして、おさんぽへ。' : r.st === 2 ? 'いってきまーす！' : 'いってきます。');
    await walkTo(g, d.x, 1000);
    V.door = true; SND.play('door');
    await X(g, wait(260));
    V.show = false;
    await X(g, wait(300));
    V.door = false;
    say('');
    await X(g, wait(500));
    setTime('day', 700); await X(g, wait(1300));
    setTime('evening', 900); await X(g, wait(1100));
    V.door = true; SND.play('door'); V.gx = d.x; V.show = true;
    await X(g, wait(260)); V.door = false;
    await walkTo(g, spot().x, 1000);
  }

  /* ---- 夕方 ---- */
  async function doEvening(g) {
    const r = S.run, o = r.offer;
    show('game'); setStage(r.st);
    V.season = TR.timeOf(r).season; setTime('evening'); refreshLook();
    V.show = true; V.gx = spot().x; V.sleep = false; face('n'); V.bag = false;
    ageLabel(); tray('none'); setActs([]);
    SND.music('s' + r.st);
    if (V.held) { await X(g, say(TS.HELD_BACK[r.st](TI.get(V.held).name), true)); V.held = null; }
    await X(g, say(TS.BACK[r.st][r.dest], true));
    o.items.forEach(seen); if (o.hers) seen(o.hers);
    showCards(o); SND.play('card'); face('joy', 1200);
    say(TS.SHOW[r.st] + (!S.meta.guideKeep ? '\n（ひとつだけ、缶に とっておける）' : ''));
    S.meta.guideKeep = 1;
    if (o.hers) {
      await X(g, wait(1500));
      await flyCard(g, o.hers, girlRect());
      showCards({ items: o.items });
    }
    let sel = null;
    for (;;) {
      setActs([{ k: 'keep', label: 'とっておく', main: true, dis: !sel }, { k: 'none', label: r.st === 4 || o.items.length === 1 ? 'とっておかない' : 'どれも とっておかない' }]);
      tray('look');
      const v = await X(g, input());
      if (v.t === 'card') {
        if (v.back) { SND.play('tap'); face('n'); say(TS.HIDDEN); continue; }
        sel = v.id; markCard(sel); SND.play('pick'); say(TI.get(sel).say);
        face(TI.main(sel) === V.look.tint ? 'joy' : 'n', 900);
        continue;
      }
      if (v.t === 'slot') { await X(g, peek(v.id, [{ k: 'close', label: 'とじる' }])); continue; }
      if (v.k === 'none') {
        setActs([]); clearCards();
        TR.keep(r, null); persist();
        SND.play('none'); face(r.st <= 2 ? 'sad' : 'n', 1400);
        const L = TS.NONE[r.st]; await X(g, say(L[r.turn % L.length], true));
        break;
      }
      if (v.k === 'keep' && sel) {
        let out = null;
        if (TR.full(r)) {
          say('缶が いっぱい。どれと 入れかえる？');
          tray('swap'); setActs([{ k: 'cancel', label: 'やめる' }]);
          const w = await X(g, input());
          if (w.t !== 'slot') { say(TI.get(sel).say); continue; }
          out = w.id;
        }
        setActs([]);
        const i = out ? r.tin.indexOf(out) : r.tin.indexOf(null);
        if (out) { slotEl(i).classList.add('gone'); await X(g, wait(300)); }
        await flyCard(g, sel, slotEl(i));
        clearCards();
        TR.keep(r, sel, out); S.meta.kept[sel] = 1; persist();
        SND.play(out ? 'swap' : 'keep');
        tray('none'); slotEl(r.tin.indexOf(sel)).classList.add('new');
        face('joy', 1600);
        refreshLook(true);
        const L = TS.KEEP[r.st];
        await X(g, say((out ? TS.SWAP[r.st](TI.get(out).name) + '\n' : '') + L[(r.turn + r.kept) % L.length], true));
        break;
      }
    }
    clearCards(); setActs([]);
    if (r.phase === 'morning' || r.phase === 'growth') await nightFall(g);
  }
  async function nightFall(g) {
    setTime('night', 900); V.sleep = true; face('zzz');
    say('');
    await X(g, wait(1500));
    V.dark = 0;
    await X(g, tween(500, (p) => (V.dark = p * 0.9)));
    V.dark = 0; V.sleep = false; face('n');
  }

  /* ---- できごと ---- */
  const RAND_COL = { sora: '#8fd0f2', mido: '#7fc47a', hono: '#e8574a', hosi: '#2f3b7a', uta: '#f59ac8', hina: '#f2c14e' };
  async function doEvent(g) {
    const r = S.run, id = r.ev.id, E = TS.EV[id], cs = TR.choices(r);
    show('game'); setStage(r.st);
    V.season = TR.timeOf(r).season; setTime(E.time || 'night'); refreshLook();
    V.show = true; V.gx = spot().x; V.sleep = E.face === 'zzz'; face(E.face || 'n'); V.bag = false;
    ageLabel(); tray('none'); setActs([]); say('');
    if (E.time === 'night') SND.music('night'); else SND.music('s' + r.st);
    SND.play('event');
    await X(g, wait(700));
    let lines = E.lines, labels = (E.choices || []).map((l) => ({ label: l }));
    if (id === 'hanko') {
      if (cs.length === 1) { lines = E.only; labels = E.onlyChoice.map((l) => ({ label: l })); } else { const n = TI.get(cs[0].drop).name; lines = lines.map((l) => (typeof l === 'function' ? l(n) : l)); }
    }
    if (id === 'zenya' && !r.tin.some(Boolean)) lines = E.linesEmpty;
    if (id === 'shinro') labels = cs.map((c) => ({ label: c.free ? E.free : E.dreams[c.dream] }));
    if (id === 'ryoko') { lines = lines.concat([`（${TI.get(cs[0].item).name}）`]); labels = labels.map((l, i) => Object.assign(l, i === 0 ? { icon: cs[0].item } : {})); seen(cs[0].item); }
    if (id === 'matsuri') labels = labels.map((l, i) => Object.assign(l, cs[i] && cs[i].item ? { icon: cs[i].item } : {}));
    if (id === 'nyugaku') labels = labels.map((l, i) => Object.assign(l, { sw: RAND_COL[TR.MAIN[i]] }));
    const i = await X(g, overlayLines(g, E.title, lines, labels, labels.length >= 5));
    const c = cs[i];
    let out = null;
    if (c.item && TR.full(r)) {
      overlayOff();
      say(`缶が いっぱい。「${TI.get(c.item).name}」と、どれを 入れかえる？`);
      tray('swap'); setActs([{ k: 'cancel', label: 'とっておかない' }]);
      const w = await X(g, input());
      if (w.t === 'slot') out = w.id;
      setActs([]);
    }
    const hadItem = c.item && (out || !TR.full(r));
    TR.choose(r, i, out); persist();
    if (c.item) { seen(c.item); if (hadItem) S.meta.kept[c.item] = 1; }
    if (c.mine) seen(c.mine);
    if (c.drop) SND.play('release');
    let after = E.after[i] !== undefined ? E.after[i] : E.after[0];
    if (id === 'shinro') after = c.free ? E.afterFree[0] : E.after[0];
    if (id === 'hanko' && cs.length === 1) after = 'ふたりで、しばらく 缶をながめていた。';
    if (id === 'hikaru') { SND.play(i === 0 ? 'glow' : 'none'); }
    overlay(`<p class="ev-t">${esc(E.title)}</p><p class="ev-l">${esc(after)}</p><div class="ev-c"><button type="button" class="btn main" id="ev-ok">つぎへ</button></div>`);
    await X(g, new Promise((res) => { $('#ev-ok').onclick = () => { SND.play('tap'); res(); }; if (FAST) res(); }));
    overlayOff();
    tray('none');
    if (hadItem) { const k = r.tin.indexOf(c.item); if (k >= 0) { slotEl(k).classList.add('new'); SND.play('keep'); } }
    refreshLook(true);
    if (E.time === 'night' && (r.phase === 'morning' || r.phase === 'growth')) { V.sleep = true; face('zzz'); await X(g, wait(900)); }
  }

  /* ---- 成長 ---- */
  async function doGrowth(g) {
    const r = S.run;
    show('game'); setStage(r.st); V.season = 'winter'; setTime('night'); refreshLook();
    V.show = true; V.gx = spot().x; V.sleep = true; face('zzz'); V.bag = false; V.held = null;
    ageLabel(); tray('none'); setActs([]);
    SND.music('night');
    for (const l of TS.GROW_NIGHT) await X(g, say(l, true));
    const old = (V.last || compose(performance.now())).clone();
    TR.grow(r); persist();
    SND.fadeMusic(0.05, 0.3);
    SND.play('grow');
    await X(g, tween(700, (p) => (V.white = p)));
    V.season = 'spring'; setStage(r.st, old); setTime('morning'); refreshLook();
    V.sleep = false; face('n');
    $('#tin').classList.add('grow');
    tray('none');
    await X(g, tween(600, (p) => (V.white = 1 - p)));
    V.white = 0;
    await X(g, wait(2200));
    SND.fadeMusic(0.32, 1);
    SND.music('s' + r.st);
    face('joy', 1500); sparks(Math.round(V.gx), Math.round(V.gy - TA.S[V.st].h / 2), 14);
    ageLabel();
    for (const l of TS.GROW[r.st]) await X(g, say(l, true));
    const top = r.hairs[r.hairs.length - 1];
    if (top && top !== 'fu') await X(g, say(`（髪型が、変わった）`, true));
  }

  /* ---- 旅立ち ---- */
  async function doDepart(g) {
    const r = S.run;
    show('game'); setStage(r.st); V.season = 'spring'; setTime('morning'); refreshLook();
    V.show = true; V.gx = spot().x; V.sleep = false; face('n'); V.bag = true; V.held = null;
    $('#age').textContent = '18さい・はる'; tray('none'); setActs([]);
    SND.music('s4');
    const has = r.tin.filter(Boolean);
    let ids = [];
    if (!has.length) {
      for (const l of TS.DEPART.empty) await X(g, say(l, true));
    } else {
      for (const l of TS.DEPART.lines) await X(g, say(l, true));
      let sel = [];
      $('#box-cap').textContent = 'みっつまで えらんで';
      for (;;) {
        tray('depart', sel);
        setActs([{ k: 'give', label: sel.length ? `これを わたす（${sel.length}）` : 'えらんでね', main: true, dis: !sel.length }, { k: 'none', label: 'なにも わたさない' }]);
        const v = await X(g, input());
        if (v.t === 'slot') {
          const k = sel.indexOf(v.id);
          if (k >= 0) sel.splice(k, 1); else if (sel.length < 3) sel.push(v.id); else { say('みっつまで、だよ。'); continue; }
          SND.play('pick'); say(TI.get(v.id).say); continue;
        }
        if (v.k === 'none') {
          const ok = await X(g, confirmBox('なにも わたさずに、見送りますか？', '見送る', 'やめる'));
          if (!ok) continue;
          ids = []; break;
        }
        if (v.k === 'give' && sel.length) { ids = sel.slice(); break; }
      }
      setActs([]);
      for (const id of ids) {
        const i = r.tin.indexOf(id), el = slotEl(i);
        const c = el.querySelector('canvas');
        if (c) { c.style.transition = 'transform .5s, opacity .5s'; c.style.transform = 'translateY(-30px) scale(.5)'; c.style.opacity = '0'; }
        SND.play('held'); await X(g, wait(260));
      }
    }
    TR.depart(r, ids); persist();
    tray('none'); $('#box-cap').textContent = TIN_NAME[4];
    face('joy', 1500);
    await X(g, say(ids.length ? 'ありがと。……だいじにする。' : (r.end.id === 'L' ? '……' : 'うん。手ぶらで、行ってくる。'), true));
    await X(g, say('いってきます。', true));
    await walkTo(g, doorAt().x, 1600);
    V.door = true; SND.play('door'); await X(g, wait(400)); V.show = false; await X(g, wait(500)); V.door = false; V.bag = false;
    SND.music(null);
    await X(g, wait(1200));
  }

  /* ---- むすび ---- */
  async function doEnding(g) {
    const r = S.run, e = r.end;
    S.meta.ends[e.id] = S.meta.ends[e.id] || new Date().toISOString().slice(0, 10);
    S.meta.last = e.id;
    r.mine.forEach(seen); r.bag.forEach(seen);
    const look = TR.look(r);
    const sc = TR.now(r), deco = {}; TR.ALL.forEach((k) => { deco[k] = sc[k] >= 6 ? 2 : sc[k] >= 2.5 ? 1 : 0; });
    const done = { id: e.id, look, deco, tin: r.tin.filter(Boolean), mine: r.mine.slice(), bag: r.bag.slice(), lent: r.lent, top: e.top, sec: e.sec, hairs: r.hairs.slice() };
    if (r.lent >= 5 && done.mine.indexOf('nigaoe') < 0 && done.tin.indexOf('nigaoe') < 0 && done.bag.indexOf('nigaoe') < 0) done.mine.push('nigaoe');
    if (e.id === 'L') { S.meta.tonari = 1; S.meta.tonariLook = Object.assign({}, look, { hair: r.hairs[2] || look.hair }); }
    S.lastEnd = done; S.run = null; persist();
    await showEnding(g, done, true);
  }
  async function showEnding(g, d, first) {
    show('end'); bodyTime('night');
    SND.music('end');
    const c = $('#end-cv'), b = TE.draw(d.id, d);
    c.classList.remove('on'); c.width = b.w; c.height = b.h; PX.toCanvas(b, c);
    await X(g, wait(300)); c.classList.add('on');
    const txt = $('#end-txt'); txt.innerHTML = '';
    const btn = $('#end-b'); btn.innerHTML = '';
    const n = TE.ORDER.indexOf(d.id) + 1;
    const add = (html, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; txt.appendChild(p); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return p; };
    await X(g, wait(1400));
    add(`むすび　${n} / 12`, 'end-no');
    add(esc(TE.NAMES[d.id]), 'end-h');
    const tap = () => new Promise((res) => { if (FAST) return res(); const f = () => { $('#end').removeEventListener('click', f); res(); }; setTimeout(() => $('#end').addEventListener('click', f), 50); });
    for (const l of TE.lines(d.id, d)) { add(esc(l)); await X(g, first ? tap() : wait(60)); }
    if (d.id === 'L') { await stepOut(g, d); add('「これからは、ずっと となりに いるね」'); await X(g, first ? tap() : wait(60)); }
    const letter = TE.letter(d.id, d);
    if (letter.length) { add(letter.map(esc).join('<br>'), 'letter'); await X(g, first ? tap() : wait(60)); }
    const boxes = document.createElement('div'); boxes.className = 'end-boxes';
    const box = (h, ids) => { const e = document.createElement('div'); e.className = 'end-box'; e.innerHTML = `<h4>${esc(h)}</h4><div></div>`; ids.forEach((id) => e.lastChild.appendChild(iconCv(id))); if (!ids.length) e.lastChild.textContent = '（なにもない）'; boxes.appendChild(e); };
    box('あなたの缶に のこったもの', d.tin);
    box('ツブの とっておき', d.bag.concat(d.mine));
    txt.appendChild(boxes);
    const e = document.createElement('button'); e.type = 'button'; e.className = 'btn'; e.textContent = 'タイトルへ';
    e.onclick = () => { SND.play('tap'); gen++; toTitle(); };
    btn.appendChild(e);
  }

  // 画面の外へ出てくるツブ（あなたのとなり）
  function tonariCanvas(look, face) {
    const b = TA.build(4, Object.assign({ hair: 'fu', outfit: 'fu', tint: 'fu', yoru: 0, acc: [] }, look || {}), face || 'n');
    const d = TA.dot(4); b.put(d[0], d[1], (TA.TINT[(look && look.tint) || 'fu'] || TA.TINT.fu).g);
    return PX.toCanvas(b);
  }
  async function stepOut(g, d) {
    const cvE = $('#end-cv'), r = cvE.getBoundingClientRect(), host = $('#end');
    const k = r.width / TE.W;
    const c = tonariCanvas(d.look, 'n'); c.className = 'tonari-walk';
    c.style.width = Math.round(26 * k) + 'px';
    const hr = host.getBoundingClientRect();
    let x = r.left - hr.left + TE.W * 0.84 * k, y = r.top - hr.top + host.scrollTop + TE.H * 0.73 * k - 42 * k;
    c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.opacity = '0';
    host.appendChild(c);
    SND.play('door');
    await X(g, tween(700, (p) => { c.style.opacity = p; }));
    const tx = r.right - hr.left + 6, ty = y + 26 * k;
    await X(g, tween(1600, (p) => { c.style.left = x + (tx - x) * p + 'px'; c.style.top = y + (ty - y) * p - Math.abs(Math.sin(p * Math.PI * 6)) * 6 + 'px'; if (Math.floor(p * 12) % 2) SND.play('step'); }));
    c.style.width = Math.round(26 * Math.min(4, k)) + 'px';
    SND.play('giggle');
  }

  /* ---------- タイトル ---------- */
  const tsky = $('#t-sky'), tcx = tsky.getContext('2d');
  let tStars = [];
  function titleSky(t) {
    if (!$('#title').classList.contains('on')) return requestAnimationFrame(titleSky);
    const w = Math.ceil(innerWidth / 6), h = Math.ceil(innerHeight / 6);
    if (tsky.width !== w || tsky.height !== h) { tsky.width = w; tsky.height = h; tStars = Array.from({ length: Math.round(w * h / 90) }, () => [Math.random() * w | 0, Math.random() * h | 0, Math.random() * 6]); }
    tcx.fillStyle = '#07060d'; tcx.fillRect(0, 0, w, h);
    tStars.forEach(([x, y, p]) => { const a = 0.25 + 0.25 * Math.sin(t / 900 + p); tcx.fillStyle = `rgba(200,190,255,${a})`; tcx.fillRect(x, y, 1, 1); });
    const px = w >> 1, fallP = tFall ? Math.min(1, (t - tFall) / 2600) : 0, py = Math.round(h * 0.26 + fallP * h * 0.8);
    if (fallP >= 1) tFall = 0;
    const a = 0.55 + 0.45 * Math.sin(t / 500);
    tcx.fillStyle = `rgba(255,243,196,${0.12 * a})`; tcx.fillRect(px - 2, py, 5, 1); tcx.fillRect(px, py - 2, 1, 5); tcx.fillRect(px - 1, py - 1, 3, 3);
    tcx.fillStyle = '#fffbe6'; tcx.fillRect(px, py, 1, 1);
    requestAnimationFrame(titleSky);
  }
  requestAnimationFrame(titleSky);
  let tTaps = 0, tFall = 0;
  tsky.addEventListener('click', (e) => {
    const r = tsky.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * tsky.width, y = (e.clientY - r.top) / r.height * tsky.height;
    if (Math.abs(x - (tsky.width >> 1)) > 4 || Math.abs(y - Math.round(tsky.height * 0.26)) > 4) return;
    SND.init(); SND.play('glow'); tTaps++;
    if (tTaps >= 7) { tTaps = 0; tFall = performance.now(); SND.play('fall'); const m = document.createElement('p'); m.className = 't-secret'; m.textContent = '（ひと粒の光は、なんどでも 落ちてくる）'; $('.t-box').appendChild(m); setTimeout(() => m.remove(), 4200); }
  });
  function drawLogo() {
    const c = $('#t-logo'), W = 132, H = 26;
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const t = tmp.getContext('2d');
    t.fillStyle = '#000'; t.textBaseline = 'middle'; t.textAlign = 'center';
    t.font = '17px "Mochiy Pop P One", "Kiwi Maru", sans-serif';
    t.fillText('ツブのとっておき', W / 2, H / 2 + 1);
    const im = t.getImageData(0, 0, W, H).data;
    const b = new PX.Bmp(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (im[(y * W + x) * 4 + 3] > 110) b.put(x, y, PX.mix('#fffbe6', '#ffd978', y / H));
    const o = PX.pad(b, 2); PX.outline(o, '#3a2030', 0.9); PX.outline(o, '#1a1024', 0.6);
    c.width = o.w; c.height = o.h; PX.toCanvas(o, c);
  }
  function toTitle() {
    gen++; overlayOff(); $('#peek').hidden = true; clearCards(); setActs([]);
    show('title'); bodyTime('night');
    SND.music(null);
    $('#t-cont').hidden = !S.run;
    const mk = $('#t-mark'); mk.innerHTML = '';
    const got = TE.ORDER.filter((k) => S.meta.ends[k]);
    TE.ORDER.forEach((k) => { const s = document.createElement('span'); s.style.cssText = `width:9px;height:9px;display:inline-block;background:${S.meta.ends[k] ? '#ffd978' : '#2b2842'};box-shadow:0 0 ${S.meta.ends[k] ? 6 : 0}px #ffd978`; s.title = S.meta.ends[k] ? TE.NAMES[k] : ''; mk.appendChild(s); });
    mk.style.visibility = got.length ? 'visible' : 'hidden';
    const old = $('#t-tonari'); if (old) old.remove();
    if (S.meta.tonari) {
      const w = document.createElement('button'); w.type = 'button'; w.id = 't-tonari'; w.className = 't-tonari'; w.setAttribute('aria-label', 'ツブ');
      const c1 = tonariCanvas(S.meta.tonariLook, 'n'), c2 = tonariCanvas(S.meta.tonariLook, 'blink'), c3 = tonariCanvas(S.meta.tonariLook, 'joy');
      [c1, c2, c3].forEach((c, i) => { c.dataset.f = i; w.appendChild(c); });
      const bub = document.createElement('span'); bub.className = 't-bub'; w.appendChild(bub);
      const LINES = ['おかえり。', 'つぎは、なにを とっておく？', 'ここ、あったかいね。', 'ずっと となりに いるよ。', 'ねえ、また 育ててくれる？', '……えへへ。'];
      let n = 0;
      w.onclick = () => { SND.init(); SND.play('giggle'); w.dataset.f = 2; bub.textContent = LINES[n++ % LINES.length]; bub.classList.add('on'); clearTimeout(w._t); w._t = setTimeout(() => { bub.classList.remove('on'); w.dataset.f = 0; }, 2200); };
      w.dataset.f = 0;
      clearInterval(toTitle._iv); toTitle._iv = setInterval(() => { if (w.dataset.f === '0') { w.dataset.f = 1; setTimeout(() => { if (w.dataset.f === '1') w.dataset.f = 0; }, 140); } }, 3200);
      $('.t-box').appendChild(w);
    }
    requestAnimationFrame(() => $('.t-box').classList.add('on'));
  }
  $('#t-new').onclick = async () => {
    SND.init(); SND.play('tap');
    if (S.run) { const ok = await confirmBox('はじめから 育てなおしますか？\nいまのツブとは、お別れになります。', 'はじめから', 'やめる'); if (!ok) return; }
    S.run = TR.newRun((Date.now() ^ (Math.random() * 1e9)) >>> 0); S.meta.runs++; persist();
    play();
  };
  $('#t-cont').onclick = () => { SND.init(); SND.play('tap'); if (S.run) play(); };
  $('#snd').onclick = () => { SND.init(); SND.setOn(!SND.isOn()); $('#snd').classList.toggle('off', !SND.isOn()); };
  $('#snd').classList.toggle('off', !SND.isOn());

  /* ---------- 図鑑・むすび ---------- */
  function book(kind) {
    show('book'); bodyTime('day');
    const grid = $('#book-grid'); grid.innerHTML = ''; $('#book-d').textContent = '';
    grid.className = 'book-grid' + (kind === 'ends' ? ' ends' : '');
    if (kind === 'items') {
      const list = TI.LIST;
      const got = list.filter((it) => S.meta.items[it.id]).length;
      $('#book-h').textContent = 'たからもの'; $('#book-p').textContent = `見つけたもの　${got} / ${list.length}`;
      list.forEach((it) => {
        const e = document.createElement('button'); e.type = 'button'; const has = !!S.meta.items[it.id];
        e.className = 'bk' + (has ? '' : ' no'); e.appendChild(iconCv(it.id));
        e.onclick = () => { if (!has) return; SND.play('tap'); grid.querySelectorAll('.bk').forEach((x) => x.classList.remove('sel')); e.classList.add('sel'); $('#book-d').textContent = `${it.name}\n${it.say}`; $('#book-d').style.whiteSpace = 'pre-wrap'; };
        grid.appendChild(e);
      });
    } else {
      const got = TE.ORDER.filter((k) => S.meta.ends[k]).length;
      $('#book-h').textContent = 'むすび'; $('#book-p').textContent = `見とどけた むすび　${got} / 12`;
      TE.ORDER.forEach((k, i) => {
        const e = document.createElement('div'); const has = !!S.meta.ends[k];
        e.className = 'bke' + (has ? '' : ' no');
        if (has) { const c = PX.toCanvas(TE.draw(k, S.lastEnd && S.lastEnd.id === k ? S.lastEnd : null)); e.appendChild(c); } else { const l = document.createElement('div'); l.className = 'bke-lock'; l.textContent = '？'; e.appendChild(l); }
        const s = document.createElement('span'); s.textContent = `${i + 1}. ${has ? TE.NAMES[k] : '？？？'}`; e.appendChild(s);
        grid.appendChild(e);
      });
      if (got === 12) { // ぜんぶの ツブ
        const b = new PX.Bmp(200, 60);
        for (let y = 0; y < 60; y++) for (let x = 0; x < 200; x++) b.put(x, y, PX.mix('#151a45', '#3a2f6a', y / 60));
        for (let i = 0; i < 70; i++) b.put((i * 53) % 200, (i * 29) % 40, '#fff6c9', 0.7);
        const OUT = { A: ['sora', 'sora'], B: ['mido', 'mido'], C: ['hono', 'hono'], D: ['hosi', 'hosi'], E: ['uta', 'uta'], F: ['hina', 'hina'], G: ['space', 'sora'], H: ['mido', 'uta'], I: ['circus', 'uta'], J: ['fu', 'fu'], K: ['yoru', 'yoru'], L: ['fu', 'fu'] };
        TE.ORDER.forEach((k, i) => { const sp = TA.build(4, { hair: OUT[k][1] === 'fu' ? 'fu' : OUT[k][1], outfit: OUT[k][0], tint: OUT[k][1], yoru: k === 'K' ? 3 : 0, acc: [] }, i % 3 ? 'n' : 'joy'); b.blit(sp, 4 + i * 16 - (i % 2) * 2, 60 - sp.h - (i % 2 ? 0 : 3)); });
        const e = document.createElement('div'); e.className = 'bke all'; const c = PX.toCanvas(b); e.appendChild(c);
        const s = document.createElement('span'); s.textContent = 'ぜんぶの ツブ'; e.appendChild(s); grid.appendChild(e);
      }
    }
  }
  $('#t-zukan').onclick = () => { SND.init(); SND.play('tap'); book('items'); };
  $('#t-musubi').onclick = () => { SND.init(); SND.play('tap'); book('ends'); };
  $('#book-back').onclick = () => { SND.play('tap'); toTitle(); };

  /* ---------- 表紙の撮影用（?cover=front|back） ---------- */
  function coverMode(kind) {
    document.body.classList.add('cover');
    const keep = S; S = { meta: { ends: {}, items: {}, kept: {}, runs: 0 } };
    window.addEventListener('beforeunload', () => { S = keep; });
    if (kind === 'og') {
      document.body.innerHTML = '';
      const b = new PX.Bmp(128, 68), room = R2.room(128, 96, { st: 3, time: 'evening', season: 'spring', deco: { uta: 2, hosi: 1, mido: 1 }, tint: 'uta' });
      b.blit(room, 0, -24);
      const g = TA.build(3, { hair: 'uta', outfit: 'uta', tint: 'uta', yoru: 0, acc: ['headphones'] }, 'joy');
      b.blit(g, 86 - (g.w >> 1), 66 - g.h);
      const f = b.clone(); const rm = { glow: new Uint8Array(128 * 68), meta: Object.assign({}, room.meta, { y0: room.meta.y0 - 24, y1: room.meta.y1 - 24, wallBot: room.meta.wallBot }) };
      const d = TA.dot(3); b.put(86 - (g.w >> 1) + d[0], 66 - g.h + d[1], TA.TINT.uta.g);
      const c = PX.toCanvas(b); c.style.cssText = 'width:1200px;height:638px;display:block;image-rendering:pixelated'; document.body.style.cssText = 'margin:0;background:#000'; document.body.appendChild(c);
      setTimeout(() => (document.title = 'ready'), 300); return;
    }
    if (kind === 'back') { toTitle(); $('.t-box').classList.add('on'); setTimeout(() => (document.title = 'ready'), 1500); return; }
    const r = TR.newRun(11); S.run = r;
    TR.prologue(r, false);
    const want = ['kureyon', 'suzu', 'rappa', 'ribbon', 'harmonica', 'tsuru', 'hikouki'];
    r.st = 2; r.turn = 3; r.phase = 'morning';
    r.tin = want.concat([null, null]); r.history = want.slice(); r.hairs = ['uta'];
    show('game'); setStage(2); V.season = 'spring'; setTime('morning'); refreshLook();
    V.show = true; V.gx = spot().x; face('joy'); V.faceT = 0;
    tray('none'); setActs([]); FAST = true; say('あなたの かお、また かいてあげるね。'); FAST = false; $('#age').textContent = '';
    setTimeout(() => (document.title = 'ready'), 1500);
  }

  /* ---------- はじまり ---------- */
  (document.fonts && document.fonts.load ? document.fonts.load('17px "Mochiy Pop P One"').catch(() => 0) : Promise.resolve()).then(drawLogo);
  drawLogo();
  const Q = new URLSearchParams(location.search);
  if (Q.has('cover')) coverMode(Q.get('cover')); else toTitle();

  // 検証用
  window.__tb = {
    S: () => S, V, TR,
    fast(on) { FAST = on !== false; },
    start(seed) { S.run = TR.newRun(seed || 1); persist(); play(); },
    // 規則だけで先へ進める（見た目の確認用）
    jump(st, pref) {
      const r = S.run || (S.run = TR.newRun(7));
      if (r.phase === 'prologue') TR.prologue(r, !!(pref && pref.yoru));
      const val = (id) => { const t = TI.get(id).t; let v = Math.random() * 0.5; for (const k in pref || {}) v += (t[k] || 0) * pref[k]; return v; };
      let guard = 0;
      while (r.st < st && guard++ < 400) {
        if (r.phase === 'morning') TR.goOut(r);
        else if (r.phase === 'evening') { const best = r.offer.items.slice().sort((a, b) => val(b) - val(a))[0]; const out = TR.full(r) ? r.tin.filter(Boolean).sort((a, b) => val(a) - val(b))[0] : null; TR.keep(r, best, out); }
        else if (r.phase === 'event') { const cs = TR.choices(r); TR.choose(r, Math.floor(Math.random() * cs.length), TR.full(r) ? r.tin.filter(Boolean)[0] : null); }
        else if (r.phase === 'growth') TR.grow(r);
        else break;
      }
      persist(); play();
    },
    ending(id) { gen++; const d = S.lastEnd || { id, look: { hair: 'fu', outfit: 'fu', tint: 'fu', yoru: 0, acc: [] }, tin: [], mine: [], bag: [] }; d.id = id; showEnding(gen, d, false); },
    give, skipNow, tap: () => tapAdvance(), resume: () => play(),
    toPhase(ph) { const r = S.run; let k = 0; while (r.phase !== ph && k++ < 300) { if (r.phase === 'morning') TR.goOut(r); else if (r.phase === 'evening') TR.keep(r, r.offer.items[0], TR.full(r) ? r.tin[0] : null); else if (r.phase === 'event') TR.choose(r, 0, TR.full(r) ? r.tin[0] : null); else if (r.phase === 'growth') TR.grow(r); else break; } persist(); play(); return r.phase; },
    async autoplay(n, mode) {
      FAST = true;
      const sl = (ms) => new Promise((r) => setTimeout(r, ms));
      const q = (s) => [...document.querySelectorAll(s)];
      for (let i = 0; i < (n || 4000); i++) {
        await sl(12);
        if ($('#end').classList.contains('on') && $('#end-b .btn')) return S.lastEnd && S.lastEnd.id;
        if (!$('#ask').hidden) { $('#ask-b .btn').click(); continue; }
        if (!$('#peek').hidden) { q('#peek-b .btn').pop().click(); continue; }
        if ($('#ev-ok')) { $('#ev-ok').click(); continue; }
        const evs = q('#ev-c .btn'); if (evs.length) { (mode === 'none' ? evs[evs.length - 1] : evs[Math.floor(Math.random() * evs.length)]).click(); continue; }
        const r = S.run; if (!r) continue;
        const cards = q('#cards .card[data-id]');
        if (mode === 'none') { const en0 = q('#acts .btn').filter((b) => !b.disabled); const nb = en0.find((b) => /とっておかない|そのまま|ふれる|おさんぽ|いって/.test(b.textContent)); if (nb) { nb.click(); continue; } }
        if ((r.phase === 'evening' || r.phase === 'prologue') && cards.length && !q('#cards .card.sel').length) { cards[Math.floor(Math.random() * cards.length)].click(); continue; }
        if ($('#tray').classList.contains('swap')) { const s = q('#tray .slot.has'); if (s.length) { s[Math.floor(Math.random() * s.length)].click(); continue; } }
        if (r.phase === 'depart' && q('#tray .slot.pick').length < 3) { const s = q('#tray .slot.has:not(.pick)'); if (s.length) { s[0].click(); continue; } }
        const en = q('#acts .btn').filter((b) => !b.disabled);
        if (en.length) { (en.find((b) => /とっておく|わたす|いって|おさんぽ|ふれる/.test(b.textContent)) || en[0]).click(); continue; }
      }
      return 'timeout:' + (S.run && S.run.phase);
    },
  };
})();
