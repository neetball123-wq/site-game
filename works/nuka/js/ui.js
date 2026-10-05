/* ぬか床、百年 — 画面（台所・まぜる・帳場のタブ・知らせ・はがき） */
(function () {
  const A = NK.art, VEG = NK.VEG, VEGI = NK.VEGI;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const F = NK.fmt;
  const UI = NK.UI = { tab: 'tsukeru', sub: 'notes', dirty: true, sceneKey: '' };
  let S = null;
  const save = () => NK.save && NK.save();

  /* ---- タブ ---- */
  const TABS = [
    { id: 'tsukeru', name: '漬ける' },
    { id: 'dougu', name: '道具' },
    { id: 'chumon', name: '注文' },
    { id: 'chomen', name: '帳面' },
    { id: 'keifu', name: '系譜', when: (s) => s.pres.count > 0 || NK.presReady(s) || s.repMax >= 1300 },
  ];
  const badge = (id) => {
    if (id === 'chumon') return S.orders.some((o) => !S.seen['o' + o.id]);
    if (id === 'chomen') return Object.keys(S.cards).some((k) => !S.seen[k]) || Object.keys(S.notes).some((k) => !S.seen[k]);
    if (id === 'keifu') return NK.presReady(S) && !S.seen['ready' + S.pres.count];
    if (id === 'dougu') return NK.UP.some((u) => NK.upAvail(S, u.id) === 'ok' && !S.seen['u' + u.id]) || (NK.contNext(S) && S.repMax >= NK.contNext(S).rep && !S.seen['c' + S.cont]);
    return false;
  };
  UI.drawTabs = () => {
    $('#tabs').innerHTML = TABS.filter((t) => !t.when || t.when(S)).map((t) => `<button type="button" role="tab" class="tab${UI.tab === t.id ? ' on' : ''}" data-tab="${t.id}" aria-selected="${UI.tab === t.id}">${t.name}${badge(t.id) ? '<i class="dot" aria-label="新しい知らせ"></i>' : ''}</button>`).join('');
  };

  /* ---- 見出しの数 ---- */
  UI.header = () => {
    const d = NK.derive(S);
    $('#v-coins').textContent = F(S.coins);
    const rate = NK.incomeRate(S, d);
    $('#v-rate').textContent = rate > 0 ? `+${F(rate, true)}/秒` : '';
    $('#v-rep').textContent = F(S.rep);
    $('#v-mic').textContent = F(S.C);
    $('#genki-b').style.width = (S.O * 100).toFixed(0) + '%';
    $('#genki').classList.toggle('low', S.O < 0.15);
    const pv = VEG[VEGI[S.pick || 'kyuri']];
    const pc = NK.vegCost(S, pv.id, d);
    $('#pick').innerHTML = `<span class="pk-ic">${A.vegIcon(pv.id)}</span><span><span class="pk-l">いま漬ける：</span><b>${pv.name}</b><small>¥${F(pc)}</small></span>`;
    $('#pick').classList.toggle('poor', S.coins < pc);
    const ripe = S.slots.filter((x) => x.veg && NK.stageOf(x.p, d)).length;
    $('#b-take').textContent = ripe ? `取り出す（${ripe}）` : '取り出す';
    $('#b-take').disabled = !ripe;
    const empty = S.slots.filter((x) => !x.veg).length;
    $('#b-fill').disabled = !empty || S.coins < pc;
  };

  /* ---- 台所 ---- */
  UI.scene = (force) => {
    const now = new Date();
    const key = [S.cont, ['konbu', 'kara', 'tetsu', 'sansho', 'beer', 'kaki', 'togarashi', 'mise', 'mina', 'haitatsu', 'mazebo'].map((k) => NK.lv(S, k) > 0 ? 1 : 0).join(''), S.pres.count > 0, now.getHours(), now.getMinutes() >> 2, now.getDate()].join('|');
    if (!force && key === UI.sceneKey) return;
    UI.sceneKey = key;
    $('#sc').innerHTML = A.kitchen(S, now) + (NK.lv(S, 'mazebo') ? A.mazebo(S.cont) : '');
    UI.bed = A.BED[S.cont];
    UI.veg(true);
  };
  UI.veg = (force) => {
    const d = NK.derive(S);
    NK.ensureSlots(S, d);
    const pos = A.slotPos(S.slots.length, S.cont);
    const key = S.slots.map((sl) => sl.veg ? sl.veg + (NK.stageOf(sl.p, d) || '') + Math.min(18, Math.floor(sl.p * 10)) : '_').join(',') + S.cont + (NK.lv(S, 'tetsu') || 0);
    if (!force && key === UI.vegKey) { UI.rings(d, pos); return; }
    UI.vegKey = key;
    const order = pos.map((p, i) => [p, i]).sort((a, b) => a[0].y - b[0].y);
    let o = '';
    for (const [p, i] of order) {
      const sl = S.slots[i];
      const st = sl.veg ? NK.stageOf(sl.p, d) : null;
      o += `<g class="vg${sl.veg ? '' : ' empty'}${st ? ' ripe st-' + st : ''}" data-slot="${i}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(2)})">`;
      o += `<ellipse cx="0" cy="2" rx="20" ry="7" fill="#7a5630" opacity=".55"/>`;
      if (sl.veg) {
        o += `<ellipse class="ring" cx="0" cy="2" rx="22" ry="8" fill="none" stroke-width="3" pathLength="100"/>`;
        o += A.veg(sl.veg, Math.min(1.8, sl.p), { tetsu: NK.lv(S, 'tetsu') });
        o += `<ellipse cx="0" cy="3" rx="18" ry="5" fill="#c49a5e"/>`;
        if (st) o += `<g class="spark"><path d="M-14-30l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#fff6c0"/></g>`;
      } else {
        o += `<g class="plus"><circle cx="0" cy="-6" r="11" fill="#fff" opacity=".22"/><path d="M-5-6h10M0-11v10" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
      }
      o += `<rect x="-26" y="-44" width="52" height="56" fill="transparent"/></g>`;
    }
    $('#sc-veg').innerHTML = `<ellipse id="bran-hit" cx="400" cy="${UI.bed.cy}" rx="${UI.bed.rx}" ry="${UI.bed.ry + 10}" fill="transparent"/>` + o;
    UI.rings(d, pos);
  };
  UI.rings = (d) => {
    for (const g of document.querySelectorAll('#sc-veg .vg')) {
      const sl = S.slots[+g.dataset.slot]; if (!sl || !sl.veg) continue;
      const r = g.querySelector('.ring'); if (!r) continue;
      const p = sl.p, st = NK.stageOf(p, d);
      const frac = p < 1 ? p : p < d.tabeEnd ? 1 : 1;
      r.setAttribute('stroke', !st ? '#f6efe0' : st === 'asa' ? '#9fd37a' : st === 'tabe' ? '#ffb43a' : '#a0622a');
      r.setAttribute('stroke-dasharray', `${(frac * 100).toFixed(1)} 100`);
    }
  };

  /* ---- 浮かぶ文字・ぬかのかけら ---- */
  UI.float = (x, y, text, cls = '') => {
    const el = document.createElement('div');
    el.className = 'fl ' + cls; el.textContent = text;
    el.style.left = (x / 8) + '%'; el.style.top = (y / 6) + '%';
    $('#sc-fx').appendChild(el);
    setTimeout(() => el.remove(), 1400);
  };

  /* ---- まぜる（なぞる） ---- */
  const cv = () => $('#sc-cv');
  const trail = [], crumbs = [];
  let drag = null;
  const toSvg = (e) => {
    const r = $('#sc-veg').getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 800, y: ((e.clientY - r.top) / r.height) * 600 };
  };
  const inBed = (p) => { const b = UI.bed; return ((p.x - 400) / b.rx) ** 2 + ((p.y - b.cy) / (b.ry + 8)) ** 2 <= 1.15; };
  UI.stirFx = (p, n = 6) => {
    for (let i = 0; i < n; i++) crumbs.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2.5, t: 0, c: Math.random() < 0.5 ? '#e6c890' : '#a88050' });
  };
  UI.stirAt = (p) => {
    NK.stir(S);
    NK.snd.stir();
    UI.stirFx(p);
    if (S.tut === 1 && S.stats.stirs >= 3) { S.tut = 2; UI.tip(); }
  };
  UI.bindStir = () => {
    const el = $('#sc-veg');
    el.addEventListener('pointerdown', (e) => {
      const p = toSvg(e);
      const g = e.target.closest('.vg');
      drag = { start: p, last: p, ang: null, acc: 0, moved: 0, slot: g ? +g.dataset.slot : null, id: e.pointerId, stirred: false };
      if (inBed(p) && !g) { try { el.setPointerCapture(e.pointerId); } catch (x) { } }
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const p = toSvg(e);
      drag.moved += Math.hypot(p.x - drag.last.x, p.y - drag.last.y);
      if (drag.moved > 10 && inBed(p)) {
        if (drag.slot != null) { drag.slot = null; try { el.setPointerCapture(e.pointerId); } catch (x) { } }
        const b = UI.bed;
        const a = Math.atan2((p.y - b.cy) / b.ry, (p.x - 400) / b.rx);
        if (drag.ang != null) {
          let da = a - drag.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
          drag.acc += Math.abs(da);
          // まっすぐ往復でもまぜたことにする
          drag.acc += Math.hypot(p.x - drag.last.x, p.y - drag.last.y) / (b.rx * 2.2);
        }
        drag.ang = a;
        trail.push({ x: p.x, y: p.y, t: 0 });
        while (drag.acc >= 2.1) { drag.acc -= 2.1; UI.stirAt(p); drag.stirred = true; }
        e.preventDefault();
      }
      drag.last = p;
    });
    const end = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const p = drag.last;
      if (drag.moved < 10) {
        if (drag.slot != null) UI.slotTap(drag.slot);
        else if (inBed(p)) { UI.stirAt(p); trail.push({ x: p.x, y: p.y, t: 0, dot: 1 }); }
      }
      drag = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', (e) => { drag = null; });
    el.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); UI.stirAt({ x: 400, y: UI.bed.cy }); } });
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'ぬか床。なぞるとまぜる。空いている所や漬かった野菜はタップ。スペースキーでもまぜられる');
  };
  UI.slotTap = (i) => {
    const sl = S.slots[i]; if (!sl) return;
    const d = NK.derive(S), pos = A.slotPos(S.slots.length, S.cont)[i];
    if (!sl.veg) {
      const id = S.pick || 'kyuri';
      if (NK.plant(S, i, id)) { NK.snd.plant(); UI.float(pos.x, pos.y - 30, `-¥${F(NK.vegCost(S, id, d))}`, 'minus'); if (S.tut === 2) { S.tut = 3; UI.tip(); } }
      else UI.toast(S.coins < NK.vegCost(S, id, d) ? `小銭がたりない（${VEG[VEGI[id]].name} ¥${F(NK.vegCost(S, id, d))}）` : 'まだ漬けられない', 'warn');
      UI.veg(true); UI.header(); UI.dirty = true;
      return;
    }
    const st = NK.stageOf(sl.p, d);
    if (!st) { const v = VEG[VEGI[sl.veg]]; UI.float(pos.x, pos.y - 40, `あと${NK.fmtTime((0.5 - sl.p) * v.t / d.F)}`, 'info'); return; }
    const res = NK.harvest(S, i);
    if (res) UI.onHarvest(i, res, pos);
    UI.veg(true); UI.header(); UI.dirty = true;
  };
  UI.onHarvest = (i, res, pos) => {
    pos = pos || A.slotPos(S.slots.length, S.cont)[i];
    if (!pos) return;
    UI.float(pos.x, pos.y - 40, `+¥${F(res.val)}`, res.done ? 'big' : '');
    UI.float(pos.x, pos.y - 14, NK.STAGE[res.st].name + (res.q >= 1.1 ? ' ★' : ''), 'st');
    NK.snd.pop();
    if (res.done) { NK.snd.bell(); const w = NK.WHO.find((x) => x.id === res.done.who); UI.toast(`${w ? w.name : ''}に届けた。お礼 ¥${F(res.done.reward)}`, 'good'); }
    else if (res.order) UI.toast(`注文に回した（${res.order.got}/${res.order.n}）`);
    if (res.newZukan) UI.toast(`図鑑に「${zName(res.newZukan)}」`, 'note');
    if (S.tut === 3) { S.tut = 4; UI.tip(); }
    if (S.tut === 4 && S.stats.orders >= 1) { S.tut = 5; UI.tip(); }
  };
  const zName = (k) => { if (NK.SPECIAL[k]) return NK.SPECIAL[k].name; const [v, st] = k.split(':'); return `${VEG[VEGI[v]].name}の${NK.STAGE[st].name}`; };

  /* ---- 絵を動かす（毎コマ） ---- */
  UI.frame = (t) => {
    const c = cv(); if (!c) return;
    const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext('2d');
    x.setTransform((w * dpr) / 800, 0, 0, (h * dpr) / 600, 0, 0);
    x.clearRect(0, 0, 800, 600);
    // なぞったあと（ぬかの面だけに）
    if (UI.bed && (trail.length || crumbs.length)) {
      x.save();
      x.beginPath(); x.ellipse(400, UI.bed.cy, UI.bed.rx, UI.bed.ry, 0, 0, Math.PI * 2); x.clip();
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]; p.t += 1;
        if (p.t > 50) { trail.splice(i, 1); continue; }
        const a = 1 - p.t / 50;
        x.fillStyle = `rgba(110,70,32,${0.35 * a})`;
        x.beginPath(); x.ellipse(p.x, p.y, p.dot ? 12 : 9, p.dot ? 5 : 4, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = `rgba(240,214,160,${0.3 * a})`;
        x.beginPath(); x.ellipse(p.x + 2, p.y - 2, 5, 2, 0, 0, Math.PI * 2); x.fill();
      }
      x.restore();
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const p = crumbs[i]; p.t++; p.x += p.vx; p.y += p.vy; p.vy += 0.18;
        if (p.t > 40) { crumbs.splice(i, 1); continue; }
        x.fillStyle = p.c; x.globalAlpha = 1 - p.t / 40;
        x.beginPath(); x.arc(p.x, p.y, 2, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
      }
    }
    // まぜ棒がゆれる
    const mz = document.querySelector('.nk-mzb');
    if (mz && UI.mzT) { const k = Math.max(0, 1 - (performance.now() - UI.mzT) / 900); mz.setAttribute('transform', `rotate(${(Math.sin(performance.now() / 60) * 14 * k).toFixed(1)})`); }
    if (!$('#lens').hidden) UI.lensFrame(t);
  };

  /* ---- 虫めがね ---- */
  const bugs = [];
  UI.lensFrame = (t) => {
    const c = $('#lens-cv'), w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (!w) return;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(6, Math.min(220, Math.round((Math.log10(Math.max(1e6, S.C)) - 5) * 14)));
    const bad = Math.round((1 - S.O) * 10 * (S.O < 0.3 ? 1 : 0.3));
    while (bugs.length < n + bad) bugs.push({ x: Math.random() * w, y: Math.random() * h, a: Math.random() * 6.28, k: bugs.length % 9 === 0 ? 'y' : 'l' });
    bugs.length = Math.min(bugs.length, n + bad);
    x.fillStyle = '#3a2814'; x.fillRect(0, 0, w, h);
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); g.addColorStop(0, 'rgba(240,210,150,.25)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const hr = new Date().getHours(), heart = hr < 4 && Math.floor(t / 5000) % 4 === 0;
    const sp = 0.25 + S.O * 0.9;
    bugs.forEach((b, i) => {
      if (heart) {
        const u = (i / bugs.length) * Math.PI * 2, hx = w / 2 + 16 * Math.pow(Math.sin(u), 3) * (w / 50), hy = h / 2 - (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * (w / 50);
        b.x += (hx - b.x) * 0.05; b.y += (hy - b.y) * 0.05;
      } else {
        b.a += (Math.random() - 0.5) * 0.4; b.x += Math.cos(b.a) * sp; b.y += Math.sin(b.a) * sp;
        if (b.x < 0) b.x += w; if (b.x > w) b.x -= w; if (b.y < 0) b.y += h; if (b.y > h) b.y -= h;
      }
      const isBad = i >= n;
      x.save(); x.translate(b.x, b.y); x.rotate(b.a);
      if (isBad) { x.strokeStyle = 'rgba(90,110,60,.9)'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(-6, 0); x.quadraticCurveTo(0, 4, 6, 0); x.stroke(); }
      else if (b.k === 'y') { x.fillStyle = 'rgba(255,250,235,.85)'; x.beginPath(); x.arc(0, 0, 3.6, 0, 6.28); x.fill(); x.beginPath(); x.arc(3.4, 0, 1.8, 0, 6.28); x.fill(); }
      else { x.fillStyle = 'rgba(250,226,170,.9)'; x.beginPath(); x.ellipse(0, 0, 5, 1.8, 0, 0, 6.28); x.fill(); }
      x.restore();
    });
    const d = NK.derive(S);
    $('#lens-t').innerHTML = `乳酸菌 <b>${F(S.C)}</b> ／ 住める数 ${F(d.Cap)}<br>漬かる速さ ×${d.F.toFixed(2)}　まぜたて ${(S.O * 100).toFixed(0)}%${S.O < 0.3 ? '<br><span class="warn">くさみの菌が出てきた。まぜよう。</span>' : ''}${heart ? '<br><span class="nite">（菌たちが、なにか話している）</span>' : ''}`;
  };

  /* ---- 知らせ ---- */
  UI.toast = (text, cls = '', act) => {
    const box = $('#toasts');
    const el = document.createElement(act ? 'button' : 'div');
    if (act) { el.type = 'button'; el.addEventListener('click', () => { act(); el.remove(); }); }
    el.className = 'toast ' + cls; el.innerHTML = esc(text) + (act ? '<span class="t-go">ひらく</span>' : '');
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, act ? 7000 : 3200);
  };
  UI.events = () => {
    const evs = S.ev || []; S.ev = [];
    for (const e of evs) {
      if (e.k === 'harvest') UI.onHarvest(e.i, e.res);
      else if (e.k === 'autoStir') { UI.mzT = performance.now(); const b = UI.bed; if (b && !document.hidden) { UI.stirFx({ x: 400 + b.rx * 0.6, y: b.cy - 6 }, 4); NK.snd.stir(0.4); } }
      else if (e.k === 'order') { UI.toast(`${(NK.WHO.find((w) => w.id === e.o.who) || {}).name}から注文`, 'order'); UI.dirty = true; }
      else if (e.k === 'card') { NK.snd.paper(); UI.toast('ばあちゃんから、はがきが届いた', 'card', () => UI.openCard(e.id)); UI.dirty = true; }
      else if (e.k === 'note') UI.toast('ぬか床帳に、書き足しがあった', 'note', () => { UI.tab = 'chomen'; UI.sub = 'notes'; UI.openNote(e.id); UI.dirty = true; });
      else if (e.k === 'soko') { NK.snd.bell(); UI.modal(`<div class="md-in md-paper"><h2>底の底</h2><p>まぜていた手の先が、壺の底の、さらに底に、こつんと当たった。</p><p>ぬかをかきわけると、黒い小さなかたまりと、釘で彫ったような字。</p><p class="hand">「百年たったら　だれかが　ここまで　まぜてくれますように　ハツ」</p><p class="sm">図鑑に「百年の古漬け」がくわわった。これから、売り値がいつも ×1.2。</p><div class="md-acts"><button type="button" class="pri" data-md="close">ふたをしめる</button></div></div>`); }
      else if (e.k === 'tree') { UI.toast(`ぬか床が、あたらしく${e.n}軒にひろがった`, 'good'); UI.dirty = true; }
      else if (e.k === 'endReady') UI.dirty = true;
    }
  };

  /* ---- 帳場（右・下のパネル） ---- */
  UI.panel = () => {
    const pn = $('#pn');
    const keep = pn.scrollTop;
    const d = NK.derive(S);
    let h = '';
    if (UI.tab === 'tsukeru') h = tabTsukeru(d);
    else if (UI.tab === 'dougu') h = tabDougu(d);
    else if (UI.tab === 'chumon') h = tabChumon(d);
    else if (UI.tab === 'chomen') h = tabChomen(d);
    else if (UI.tab === 'keifu') h = tabKeifu(d);
    pn.innerHTML = h;
    pn.scrollTop = keep;
    if (UI.tab === 'chumon') for (const o of S.orders) S.seen['o' + o.id] = 1;
    if (UI.tab === 'dougu') { for (const u of NK.UP) if (NK.upAvail(S, u.id) === 'ok') S.seen['u' + u.id] = 1; S.seen['c' + S.cont] = 1; }
    if (UI.tab === 'keifu' && NK.presReady(S)) S.seen['ready' + S.pres.count] = 1;
    UI.drawTabs();
  };
  const cost = (n) => `¥${F(n)}`;
  const tabTsukeru = (d) => {
    let h = `<div class="sec"><h3>いま漬ける野菜</h3><p class="hint">選んだ野菜を、ぬか床の空いている所（＋）をタップして漬ける。光ったら、タップで取り出し。</p><ul class="vlist">`;
    let shownLock = 0;
    for (const v of VEG) {
      const un = NK.unlocked(S, v);
      if (!un) {
        if (shownLock >= 2) continue; shownLock++;
        const why = NK.lockWhy(S, v);
        h += `<li class="vrow lock"><span class="v-ic">${shownLock === 1 ? A.vegIcon(v.id) : '<b>？</b>'}</span><span class="v-n">${shownLock === 1 ? v.name : '？？？'}</span><span class="v-why">${why === 'rep' ? `評判 ${F(v.rep)} で` : `${NK.CONT[v.cont].name}で漬けられる`}</span></li>`;
        continue;
      }
      const c = NK.vegCost(S, v.id, d), tt = v.t / d.F, val = v.val * d.value * (v.id === 'nasu' && NK.lv(S, 'tetsu') ? 3 : 1);
      h += `<li><button type="button" class="vrow${(S.pick || 'kyuri') === v.id ? ' on' : ''}${S.coins < c ? ' poor' : ''}" data-pick="${v.id}"><span class="v-ic">${A.vegIcon(v.id, 0, NK.lv(S, 'tetsu'))}</span><span class="v-n">${v.name}</span><span class="v-d">仕入れ ${cost(c)}<br>食べごろまで ${NK.fmtTime(tt)}</span><span class="v-p">${cost(val)}</span></button></li>`;
    }
    h += `</ul></div>`;
    if (NK.lv(S, 'mina')) h += `<div class="sec"><h3>ミナが取り出すころあい</h3><div class="seg">${['asa', 'tabe', 'furu'].map((k) => `<button type="button" class="${S.auto === k ? 'on' : ''}" data-auto="${k}">${NK.STAGE[k].name}</button>`).join('')}</div><p class="hint">注文で、ちがう漬かり具合がほしいときは、自分で取り出そう。</p></div>`;
    const q = 0.85 + 0.3 * S.O + d.qBonus;
    h += `<div class="sec toko"><h3>床のようす</h3><dl class="kv">`
      + `<div><dt>入れもの</dt><dd>${d.cont.name}（${S.slots.length}か所）</dd></div>`
      + `<div><dt>床の量</dt><dd>${S.kg.toFixed(1)}kg ／ ${d.kgMax}kg</dd></div>`
      + `<div><dt>乳酸菌</dt><dd>${F(S.C)} ／ 住める数 ${F(d.Cap)}</dd></div>`
      + `<div><dt>漬かる速さ</dt><dd>×${d.F.toFixed(2)}</dd></div>`
      + `<div><dt>まぜたて</dt><dd>${(S.O * 100).toFixed(0)}%${S.O < 0.2 ? '（まぜよう）' : ''}</dd></div>`
      + `<div><dt>できばえ</dt><dd>×${Math.min(1.6, q).toFixed(2)}</dd></div>`
      + `<div><dt>季節</dt><dd>${d.se.name}${d.se.id === 'natsu' ? '（よく漬かるけど、すぐへたる）' : d.se.id === 'fuyu' ? '（ゆっくり、味がよくなる）' : ''}</dd></div>`
      + `</dl></div>`;
    return h;
  };
  const upRow = (u, d) => {
    const st = NK.upAvail(S, u.id), lv = NK.lv(S, u.id), c = NK.upCost(S, u.id);
    if (st === 'lock') return `<li class="up lock"><div class="u-h"><b>？？？</b></div><p class="u-why">評判 ${F(u.rep)} で、何か思いつきそう</p></li>`;
    const can = st === 'ok' && S.coins >= c;
    return `<li class="up${st === 'max' ? ' max' : ''}"><div class="u-h"><b>${u.name}</b>${u.max === 1 ? (lv ? '<em>そろえた</em>' : '') : `<em>Lv ${lv}</em>`}</div><p class="u-d">${esc(u.desc)}</p><p class="u-e">${esc(u.eff(lv))}</p>`
      + (st === 'max' ? '' : st === 'full' ? `<p class="u-why">いまの入れものでは、もう足せない</p>` : `<button type="button" class="buy${can ? '' : ' poor'}" data-up="${u.id}" ${can ? '' : 'aria-disabled="true"'}>${cost(c)}</button>`) + `</li>`;
  };
  const tabDougu = (d) => {
    let h = `<div class="sec"><h3>床</h3><ul class="ups">` + upRow(NK.UPI.bran, d);
    const nx = NK.contNext(S);
    if (nx) {
      const can = S.repMax >= nx.rep && S.coins >= nx.cost;
      h += S.repMax < nx.rep ? `<li class="up lock"><div class="u-h"><b>？？？</b></div><p class="u-why">評判 ${F(nx.rep)} で、もっと大きな入れものが見つかりそう</p></li>`
        : `<li class="up cont"><div class="u-h"><b>${nx.name}</b><em>入れもの</em></div><p class="u-d">${esc(nx.desc)}</p><p class="u-e">漬けられる数 ${d.cont.slots}→${nx.slots}・床の上限 ${nx.kg}kg・菌の住める広さ ×${nx.cap / d.cont.cap}</p><button type="button" class="buy${can ? '' : ' poor'}" data-cont="1">${cost(nx.cost)}</button></li>`;
    }
    h += `</ul></div>`;
    for (const [cat, name] of [['yakumi', '薬味'], ['tetsudai', '手伝い']]) {
      const list = NK.UP.filter((u) => u.cat === cat);
      let lockShown = false;
      h += `<div class="sec"><h3>${name}</h3><ul class="ups">`;
      for (const u of list) { const st = NK.upAvail(S, u.id); if (st === 'lock') { if (lockShown) continue; lockShown = true; } h += upRow(u, d); }
      h += `</ul></div>`;
    }
    return h;
  };
  const tabChumon = (d) => {
    let h = `<div class="sec"><h3>勝手口のメモ</h3><p class="hint">注文の野菜を、その漬かり具合で取り出すと、そのまま届けられる。数がそろうと、お礼がもらえる。</p>`;
    if (!S.orders.length) h += `<p class="empty">いまは、注文がない。そのうち、だれかが来る。</p>`;
    for (const o of S.orders) {
      const w = NK.WHO.find((x) => x.id === o.who) || NK.WHO[0], v = VEG[VEGI[o.veg]];
      h += `<div class="order st-${o.st}"><div class="o-who">${esc(w.name)}</div><p class="o-say">「${esc(w.say[o.st])}」</p><div class="o-req"><span class="v-ic">${A.vegIcon(o.veg, o.st === 'asa' ? 0.7 : o.st === 'tabe' ? 1.2 : 1.8, NK.lv(S, 'tetsu'))}</span><b>${v.name}の${NK.STAGE[o.st].name}</b><span class="o-n">${o.got}/${o.n}</span></div>`
        + `<div class="o-rw">お礼 ${cost(o.reward)}・評判 +${F(o.rep)}</div><button type="button" class="o-skip" data-skip="${o.id}">ことわる</button></div>`;
    }
    return h + '</div>';
  };
  const tabChomen = (d) => {
    const subs = [['notes', 'ぬか床帳'], ['cards', 'はがき'], ['zukan', '図鑑'], ['rec', '記録']];
    let h = `<div class="seg sub">${subs.map(([k, n]) => `<button type="button" class="${UI.sub === k ? 'on' : ''}" data-sub="${k}">${n}${k === 'cards' && Object.keys(S.cards).some((x) => !S.seen[x]) ? '<i class="dot"></i>' : ''}${k === 'notes' && Object.keys(S.notes).some((x) => !S.seen[x]) ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>`;
    if (UI.sub === 'notes') {
      h += `<ul class="notes">${NK.NOTES.map((n) => S.notes[n.id] ? `<li><button type="button" class="note${S.seen[n.id] ? '' : ' new'}" data-note="${n.id}">${esc(n.title)}</button></li>` : `<li><span class="note lock">……</span></li>`).join('')}</ul>`;
    } else if (UI.sub === 'cards') {
      h += `<div class="cards">${NK.CARDS.map((c) => S.cards[c.id] ? `<button type="button" class="cardth${S.seen[c.id] ? '' : ' new'}" data-card="${c.id}">${A.card(c.id)}<span>${esc(c.from)}</span></button>` : `<span class="cardth lock"><span>まだ届いていない</span></span>`).join('')}</div>`;
    } else if (UI.sub === 'zukan') {
      const total = VEG.length * 3 + 2, got = Object.keys(S.zukan).length;
      h += `<p class="hint">漬けた野菜の、浅漬け・食べごろ・古漬け。${got} / ${total}</p><div class="zk">`;
      for (const v of VEG) for (const [k, i] of [['asa', 0], ['tabe', 1], ['furu', 2]]) {
        const has = S.zukan[v.id + ':' + k];
        h += `<button type="button" class="zc${has ? '' : ' lock'}" data-zk="${v.id}:${k}" ${has ? '' : 'disabled'}>${has ? A.vegIcon(v.id, [0.7, 1.2, 1.8][i]) : '<b>？</b>'}<span>${has ? NK.STAGE[k].name : ''}</span></button>`;
      }
      for (const k of ['tetsunasu', 'hyakunen']) { const has = S.zukan[k]; h += `<button type="button" class="zc sp${has ? '' : ' lock'}" data-zk="${k}" ${has ? '' : 'disabled'}>${has ? (k === 'tetsunasu' ? A.vegIcon('nasu', 1.2, true) : '<svg viewBox="-20 -20 40 40"><path d="M-10 6q-4-14 8-16q14 0 12 12q-2 10-12 8q-6-1-8-4z" fill="#2a1a10"/><circle cx="2" cy="-2" r="2" fill="#5a3a20"/></svg>') : '<b>？</b>'}<span>${has ? NK.SPECIAL[k].name : ''}</span></button>`; }
      h += '</div>';
    } else {
      const st = S.stats;
      h += `<dl class="kv">`
        + `<div><dt>ぬか床をまぜた回数</dt><dd>${F(st.stirs)}回</dd></div><div><dt>漬けて取り出した数</dt><dd>${F(st.harvests)}本</dd></div><div><dt>届けた注文</dt><dd>${F(st.orders)}件</dd></div>`
        + `<div><dt>いちばん高く売れた一本</dt><dd>¥${F(st.bestHarvest)}</dd></div><div><dt>これまでの売り上げ</dt><dd>¥${F(st.earnedAll)}</dd></div><div><dt>のれん分け</dt><dd>${S.pres.count}回</dd></div><div><dt>ぬか床のある家</dt><dd>${NK.households(S)}軒</dd></div>`
        + `<div><dt>ばあちゃんが旅に出てから</dt><dd>${NK.fmtTime((Date.now() - S.born) / 1000)}</dd></div></dl>`;
      h += `<div class="sec"><h3>よく漬けた野菜</h3><ul class="byveg">${VEG.filter((v) => st.by[v.id]).map((v) => `<li><span class="v-ic">${A.vegIcon(v.id, 1.2)}</span>${v.name}<b>${F(st.by[v.id])}</b></li>`).join('') || '<li>まだない</li>'}</ul></div>`;
    }
    return h;
  };
  const tabKeifu = (d) => {
    const H = NK.households(S);
    let h = `<div class="sec"><h3>ぬか床の系譜</h3><p class="hint">昭和元年の壺から、わけた床が、それぞれの家でまぜられている。いま <b>${H}</b>軒。</p>${UI.treeSvg()}</div>`;
    const ready = NK.presReady(S), need = NK.presNeed(S);
    h += `<div class="sec pres"><h3>のれん分け</h3>`;
    if (S.repMax < 3800) h += `<p class="hint">町で評判になったら（評判 ${F(3800)}）、だれかが「わけてほしい」と言ってくるかもしれない。</p><div class="bar"><i style="width:${Math.min(100, S.repMax / 3800 * 100).toFixed(1)}%"></i></div>`;
    else {
      h += `<p class="hint">床を半分わけて、入れものも道具も、はじめからやりなおす。わけた先の家の味が、ずっと力をかしてくれる。評判・図鑑・はがき・帳面・系譜は、そのまま。</p>`
        + `<p>この床での売り上げ：¥${F(S.earned)} ／ ¥${F(need)}</p><div class="bar"><i style="width:${Math.min(100, S.earned / need * 100).toFixed(1)}%"></i></div>`
        + `<p>いまわけると、菌の系譜 <b>✦${NK.presPoints(S)}</b></p>`
        + `<button type="button" class="buy big${ready ? '' : ' poor'}" data-pres="1" ${ready ? '' : 'aria-disabled="true"'}>のれん分けする</button>`;
    }
    h += `</div>`;
    if (S.pres.count > 0) {
      h += `<div class="sec"><h3>家伝 <small>菌の系譜 ✦${NK.kadenFree(S)}</small></h3><ul class="ups">`;
      for (const k of NK.KADEN) {
        const l = NK.kl(S, k.id), c = NK.kadenCost(S, k.id);
        h += `<li class="up"><div class="u-h"><b>${k.name}</b><em>${l}/${k.cost.length}</em></div><p class="u-d">${esc(k.desc)}</p>${c == null ? '<p class="u-why">きわめた</p>' : `<button type="button" class="buy${NK.kadenFree(S) >= c ? '' : ' poor'}" data-kaden="${k.id}">✦${c}</button>`}</li>`;
      }
      h += `</ul></div><div class="sec"><h3>わけた家</h3><ul class="recips">${S.pres.recip.map((id) => { const r = NK.RECIPI[id]; return `<li><b>${esc(r.name)}</b><span>${esc(r.desc)}</span></li>`; }).join('')}</ul></div>`;
    }
    return h;
  };
  UI.treeSvg = () => {
    const W = 360, Hh = 300, cx = W / 2, cy = Hh / 2;
    const nodes = S.tree, byId = new Map(nodes.map((n) => [n.id, n]));
    const pos = new Map([[0, [cx, cy]]]);
    const kids = (pid) => nodes.filter((n) => n.parent === pid);
    const lay = (pid, a0, a1, depth) => {
      const ks = kids(pid); if (!ks.length) return;
      ks.forEach((n, i) => {
        const a = a0 + ((i + 0.5) / ks.length) * (a1 - a0), r = 46 + depth * 38;
        pos.set(n.id, [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82]);
        lay(n.id, a0 + (i / ks.length) * (a1 - a0), a0 + ((i + 1) / ks.length) * (a1 - a0), depth + 1);
      });
    };
    lay(0, -Math.PI / 2, Math.PI * 1.5, 0);
    let o = '';
    for (const n of nodes) { const a = pos.get(n.parent), b = pos.get(n.id); if (a && b) o += `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="#b8956a" stroke-width="${n.depth === 1 ? 2 : 1}"/>`; }
    for (const n of nodes) { const b = pos.get(n.id); o += `<g class="tn" transform="translate(${b[0].toFixed(1)} ${b[1].toFixed(1)})"><title>${esc(n.name)}</title><circle r="${n.depth === 1 ? 9 : 6 - n.depth}" fill="${n.depth === 1 ? '#c9602a' : n.depth === 2 ? '#d99a4a' : '#e6c890'}" stroke="#6e4a2a" stroke-width="1"/>${n.depth === 1 ? `<text y="22" text-anchor="middle" font-size="9" fill="#4a3424">${esc(n.name.length > 8 ? n.name.slice(0, 8) + '…' : n.name)}</text>` : ''}</g>`; }
    o += `<g transform="translate(${cx} ${cy})"><path d="M-14 8q-4-18 0-22h28q4 4 0 22z" fill="#8a5228"/><ellipse cy="-14" rx="14" ry="4" fill="#c49a5e"/><text y="26" text-anchor="middle" font-size="9" fill="#4a3424">ばあちゃんの壺</text></g>`;
    if (!nodes.length) o += `<text x="${cx}" y="${cy + 60}" text-anchor="middle" font-size="11" fill="#8a7458">まだ、どこにもわけていない</text>`;
    return `<svg class="tree" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="ぬか床の系譜 ${NK.households(S)}軒">${o}</svg>`;
  };

  /* ---- 重なる紙（モーダル） ---- */
  UI.modal = (html) => { const m = $('#modal'); m.innerHTML = html; m.hidden = false; const b = m.querySelector('button'); if (b) b.focus({ preventScroll: true }); };
  UI.closeModal = () => { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; if (UI.after) { const f = UI.after; UI.after = null; f(); } };
  UI.openCard = (id) => {
    const c = NK.CARDS.find((x) => x.id === id); if (!c) return;
    S.seen[id] = 1; UI.dirty = true;
    UI.modal(`<div class="md-in md-card"><div class="pc">${A.card(id)}</div><div class="pc-back"><p class="pc-from">${esc(c.from)}</p><p class="hand">${esc(c.text)}</p><p class="pc-sign">ばあちゃん</p></div><div class="md-acts"><button type="button" class="pri" data-md="close">しまう</button></div></div>`);
  };
  UI.openNote = (id) => {
    const n = NK.NOTES.find((x) => x.id === id); if (!n) return;
    S.seen[id] = 1; UI.dirty = true;
    UI.modal(`<div class="md-in md-note"><p class="nt-k">ばあちゃんのぬか床帳</p><h2>${esc(n.title)}</h2><p class="hand">${esc(n.text).replace(/\n/g, '<br>')}</p><div class="md-acts"><button type="button" class="pri" data-md="close">とじる</button></div></div>`);
  };
  UI.openZukan = (k) => {
    let name, text, ic;
    if (NK.SPECIAL[k]) { name = NK.SPECIAL[k].name; text = NK.SPECIAL[k].text; ic = k === 'tetsunasu' ? A.vegIcon('nasu', 1.2, true) : ''; }
    else { const [v, st] = k.split(':'), i = { asa: 0, tabe: 1, furu: 2 }[st]; name = `${VEG[VEGI[v]].name}の${NK.STAGE[st].name}`; text = NK.TASTE[v][i]; ic = A.vegIcon(v, [0.7, 1.2, 1.8][i]); }
    UI.modal(`<div class="md-in md-paper md-zk"><div class="zk-ic">${ic}</div><h2>${esc(name)}</h2><p>${esc(text)}</p><div class="md-acts"><button type="button" class="pri" data-md="close">とじる</button></div></div>`);
  };
  UI.openPres = () => {
    if (!NK.presReady(S)) return;
    const ch = NK.presChoices(S);
    UI.modal(`<div class="md-in md-paper"><h2>だれに、わけようか</h2><p class="sm">床を半分、手ぬぐいに包んでわたす。わけた先の味が、これからずっと力をかしてくれる。もらえる菌の系譜：<b>✦${NK.presPoints(S)}</b></p><div class="rcp">${ch.map((r) => `<button type="button" class="rc" data-recip="${r.id}"><b>${esc(r.name)}</b><span class="rc-who">${esc(r.who)}</span><span class="rc-b">${esc(r.desc)}</span><span class="rc-s">${esc(r.story)}</span></button>`).join('')}</div><div class="md-acts"><button type="button" data-md="close">まだ、わけない</button></div></div>`);
  };
  UI.confirmPres = (rid) => {
    const r = NK.RECIPI[rid];
    UI.modal(`<div class="md-in md-paper"><h2>${esc(r.name)}に、わける</h2><p>入れもの・道具・小銭・床の量は、はじめにもどる。評判・図鑑・はがき・帳面・家伝・系譜は、そのまま。</p><p class="sm">${esc(r.desc)}</p><div class="md-acts"><button type="button" class="pri" data-presgo="${rid}">わける</button><button type="button" data-md="close">やめる</button></div></div>`);
  };
  UI.okaeri = (sm) => {
    if (!sm) return;
    const by = Object.entries(sm.by).map(([id, n]) => `${VEG[VEGI[id]].name} ${F(n)}本`).join('、');
    UI.modal(`<div class="md-in md-paper md-back"><p class="nt-k">おかえり</p><h2>${NK.fmtTime(sm.away)}、留守にしていた</h2><ul class="back">`
      + `<li>乳酸菌が <b>${sm.Cx >= 1.05 ? '×' + sm.Cx.toFixed(sm.Cx < 10 ? 1 : 0) : 'おなじくらい'}</b></li>`
      + (sm.harv ? `<li>取り出した野菜 <b>${F(sm.harv)}本</b>${by ? `<br><small>${esc(by)}</small>` : ''}</li>` : '')
      + (sm.earned > 0 ? `<li>売り上げ <b>¥${F(sm.earned)}</b></li>` : '')
      + (sm.orders ? `<li>届けた注文 <b>${sm.orders}件</b></li>` : '')
      + (sm.rep > 0.5 ? `<li>評判 <b>+${F(sm.rep)}</b></li>` : '')
      + (sm.tree ? `<li>ぬか床がひろがった <b>+${sm.tree}軒</b></li>` : '')
      + (sm.ripe ? `<li>漬かって待っている野菜 <b>${sm.ripe}本</b></li>` : '')
      + `</ul>${sm.capped ? `<p class="sm">（留守のあいだに進むのは、${NK.fmtTime(sm.dt)}まで）</p>` : ''}${!NK.lv(S, 'mina') && sm.ripe ? '<p class="sm">漬かりすぎた野菜は、古漬けになっている。古漬けにも、ほしい人がいる。</p>' : ''}<div class="md-acts"><button type="button" class="pri" data-md="close">ぬか床をまぜる</button></div></div>`);
  };
  UI.settings = () => {
    UI.modal(`<div class="md-in md-paper"><h2>設定</h2><div class="md-acts col"><button type="button" data-set="snd">音：${S.snd ? 'あり' : 'なし'}</button><button type="button" data-set="export">記録を書き出す（控えをとる）</button><button type="button" data-set="import">記録を読みこむ</button><button type="button" data-set="reset">はじめから</button><button type="button" class="pri" data-md="close">とじる</button></div><p class="sm">記録はこのブラウザに保存されます。本作品はフィクションです。</p></div>`);
  };

  /* ---- ばあちゃんのメモ（はじめの手ほどき） ---- */
  const TIPS = {
    1: 'ぬか床を、指（マウス）でぐるぐるなぞって、まぜてみよう。',
    2: 'ぬかの上の「＋」をタップして、きゅうりを漬けよう。',
    3: '漬かるまで、少し待とう。野菜のまわりの輪が光ったら、タップで取り出せる。',
    4: '「注文」に、近所の人から頼みごとが届いている。その漬かり具合で取り出すと、そのまま届く。',
    5: '小銭がたまったら「道具」の足しぬか。床がふえると菌がふえて、早く漬かるようになる。',
  };
  UI.tip = () => {
    const el = $('#tip');
    if (S.tut === 5 && NK.lv(S, 'bran') >= 1) S.tut = 6;
    const t = TIPS[S.tut];
    if (!t) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<span class="tp-k">ばあちゃんのメモ</span><p>${t}</p><button type="button" class="tp-x" data-tipx="1" aria-label="メモをしまう">しまう</button>`;
  };

  /* ---- タップ ---- */
  UI.bind = () => {
    document.addEventListener('click', (e) => {
      NK.snd.wake();
      const t = e.target;
      const q = (sel) => t.closest(sel);
      let b;
      if ((b = q('[data-tab]'))) { UI.tab = b.dataset.tab; UI.dirty = true; return; }
      if ((b = q('[data-pick]'))) { S.pick = b.dataset.pick; UI.dirty = true; UI.header(); return; }
      if ((b = q('[data-auto]'))) { S.auto = b.dataset.auto; UI.dirty = true; return; }
      if ((b = q('[data-up]'))) { if (NK.buyUp(S, b.dataset.up)) { NK.snd.coin(); if (b.dataset.up === 'bran' && S.tut === 5) { S.tut = 6; } UI.tip(); UI.scene(true); save(); } else UI.toast('小銭がたりない', 'warn'); UI.dirty = true; return; }
      if ((b = q('[data-cont]'))) { if (NK.buyCont(S)) { NK.snd.bell(); UI.toast(`${NK.CONT[S.cont].name}にうつした`, 'good'); UI.scene(true); save(); } else UI.toast('まだ買えない', 'warn'); UI.dirty = true; return; }
      if ((b = q('[data-skip]'))) { NK.skipOrder(S, +b.dataset.skip); UI.dirty = true; return; }
      if ((b = q('[data-sub]'))) { UI.sub = b.dataset.sub; UI.dirty = true; return; }
      if ((b = q('[data-note]'))) { UI.openNote(b.dataset.note); return; }
      if ((b = q('[data-card]'))) { UI.openCard(b.dataset.card); return; }
      if ((b = q('[data-zk]'))) { UI.openZukan(b.dataset.zk); return; }
      if ((b = q('[data-pres]'))) { if (NK.presReady(S)) UI.openPres(); else UI.toast('まだ、わけられない', 'warn'); return; }
      if ((b = q('[data-recip]'))) { UI.confirmPres(b.dataset.recip); return; }
      if ((b = q('[data-presgo]'))) {
        const rid = b.dataset.presgo, r = NK.RECIPI[rid];
        if (NK.prestige(S, rid)) { UI.closeModal(); NK.snd.bell(); S.ev = []; UI.scene(true); UI.tab = 'keifu'; UI.dirty = true; save(); UI.modal(`<div class="md-in md-paper"><h2>のれん分け</h2><p>${esc(r.name)}に、ぬか床をわけた。</p><p class="hand">${esc(r.story)}</p><p class="sm">床は、また小さな壺から。家伝を覚えて、まぜなおそう。</p><div class="md-acts"><button type="button" class="pri" data-md="close">まぜなおす</button></div></div>`); }
        return;
      }
      if ((b = q('[data-kaden]'))) { if (NK.buyKaden(S, b.dataset.kaden)) { NK.snd.coin(); save(); } UI.dirty = true; return; }
      if ((b = q('[data-md]'))) { UI.closeModal(); return; }
      if ((b = q('[data-tipx]'))) { S.tut = 6; UI.tip(); return; }
      if ((b = q('[data-set]'))) return UI.setAct(b.dataset.set);
      if ((b = q('[data-end]'))) return NK.ending.next(b.dataset.end);
      if (t.closest('#b-set')) return UI.settings();
      if (t.closest('#b-lens')) { $('#lens').hidden = !$('#lens').hidden; return; }
      if (t.closest('#lens-x')) { $('#lens').hidden = true; return; }
      if (t.closest('#pick')) { UI.tab = 'tsukeru'; UI.dirty = true; return; }
      if (t.closest('#b-fill')) { let n = 0; for (let i = 0; i < S.slots.length; i++) if (!S.slots[i].veg && NK.plant(S, i, S.pick || 'kyuri')) n++; if (n) { NK.snd.plant(); if (S.tut === 2) { S.tut = 3; UI.tip(); } } else UI.toast('小銭がたりない', 'warn'); UI.veg(true); UI.header(); UI.dirty = true; return; }
      if (t.closest('#b-take')) { const d = NK.derive(S); for (let i = 0; i < S.slots.length; i++) { const sl = S.slots[i]; if (sl.veg && NK.stageOf(sl.p, d)) { const res = NK.harvest(S, i); if (res) UI.onHarvest(i, res); } } UI.veg(true); UI.header(); UI.dirty = true; return; }
      if (t.closest('[data-cat]')) { UI.toast(['にゃあ。', 'ごろごろ……', '（しっぽで返事をした）', 'にゃ。'][Math.floor(Math.random() * 4)]); return; }
    });
  };
  UI.setAct = (k) => {
    if (k === 'snd') { S.snd = !S.snd; NK.snd.setOn(S.snd); UI.settings(); return; }
    if (k === 'export') {
      const str = NK.exportSave();
      UI.modal(`<div class="md-in md-paper"><h2>記録の控え</h2><p class="sm">この文字の列をコピーして、どこかに保存しておけます。</p><textarea class="ta" readonly>${esc(str)}</textarea><div class="md-acts"><button type="button" class="pri" data-set="copy">コピーする</button><button type="button" data-md="close">とじる</button></div></div>`);
      return;
    }
    if (k === 'copy') { const ta = $('#modal .ta'); ta.select(); try { navigator.clipboard.writeText(ta.value); UI.toast('コピーした', 'good'); } catch (e) { document.execCommand && document.execCommand('copy'); } return; }
    if (k === 'import') { UI.modal(`<div class="md-in md-paper"><h2>記録を読みこむ</h2><p class="sm">控えの文字の列を、ここに貼りつけてください。いまの記録は上書きされます。</p><textarea class="ta" id="imp"></textarea><div class="md-acts"><button type="button" class="pri" data-set="doimport">読みこむ</button><button type="button" data-md="close">やめる</button></div></div>`); return; }
    if (k === 'doimport') { const v = $('#imp').value.trim(); if (NK.importSave(v)) { UI.closeModal(); location.reload(); } else UI.toast('読みこめなかった', 'warn'); return; }
    if (k === 'reset') { UI.modal(`<div class="md-in md-paper"><h2>はじめから</h2><p>ぬか床の記録を、すべて消します。のれん分けも、はがきも、帳面も消えます。</p><div class="md-acts"><button type="button" class="pri warn" data-set="doreset">消して、はじめから</button><button type="button" data-md="close">やめる</button></div></div>`); return; }
    if (k === 'doreset') { NK.resetSave(); location.reload(); }
  };

  UI.init = (s) => { S = s; UI.bind(); UI.bindStir(); UI.scene(true); UI.tip(); UI.dirty = true; };
  UI.setState = (s) => { S = s; };
})();
