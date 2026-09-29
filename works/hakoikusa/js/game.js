/* =========================================================
   ハコイクサ — 遊びの流れ・操作・画面
   ========================================================= */
(function (G) {
  'use strict';
  const HK = G.HK, D = HK.data, RU = HK.rules, V = HK.view, A = HK.audio;
  const { DEF, RAR, TAGS, SCHOOLS, RECIPES, ITEMS } = D;
  const EC = RU.ECON;
  const $ = (s) => document.querySelector(s);
  const KEY = 'hakoikusa.v1';
  const touch = G.matchMedia && G.matchMedia('(pointer: coarse)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sec = (v) => (Math.round(v * 10) / 10).toFixed(1) + '秒';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- 保存 ---------------- */
  const SV = { meta: { v: 1, clears: 0, runs: 0, bestWins: 0, found: {}, hints: {}, mute: false, speed: 1, best: null, lastBox: null }, run: null, playMs: 0 };
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) { Object.assign(SV.meta, s.meta || {}); SV.run = s.run || null; SV.playMs = s.playMs || 0; }
    } catch (e) { /* 保存がなくても遊べる */ }
  }
  let saveT = 0;
  function persist(now) {
    if (!now) { clearTimeout(saveT); saveT = setTimeout(() => persist(true), 250); return; }
    try { localStorage.setItem(KEY, JSON.stringify({ meta: SV.meta, run: SV.run, playMs: SV.playMs })); } catch (e) { /* 容量など */ }
  }
  setInterval(() => { if (document.visibilityState === 'visible' && phase !== 'boot') { SV.playMs += 5000; persist(true); } }, 5000);

  /* ---------------- 状態 ---------------- */
  let phase = 'boot';
  let run = null;          // SV.run
  let hand = null;         // 手に持っているピース
  let pend = null;         // 押したけれどまだ動かしていない
  let hoverUid = null, selUid = null, selShop = -1, selBench = -1;
  let battle = null;
  const ptr = { x: 0, y: 0, down: false, sx: 0, sy: 0, moved: false, onCanvas: false, button: 0 };

  /* ---------------- 小物 ---------------- */
  let sayT = 0;
  function say(html, ms) {
    const el = $('#say');
    el.innerHTML = html;
    el.classList.add('on');
    clearTimeout(sayT);
    if (ms !== 0) sayT = setTimeout(() => el.classList.remove('on'), ms || 5200);
  }
  function hint(key, html, ms) {
    if (SV.meta.hints[key]) return false;
    SV.meta.hints[key] = 1;
    persist();
    say(html, ms || 7000);
    return true;
  }
  let askCb = null;
  function ask(text, yes, yesLabel) {
    resetAsk();
    $('#ask-t').innerHTML = text;
    $('#ask-yes').textContent = yesLabel || 'はい';
    $('#ask').hidden = false;
    askCb = yes;
  }
  $('#ask').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'ask-no') { $('#ask').hidden = true; askCb = null; A.play('tap'); }
    else if (t.id === 'ask-yes') { $('#ask').hidden = true; const f = askCb; askCb = null; A.play('tap'); if (f) f(); }
  });

  function rarColor(id) { return RAR[DEF[id].rar].color; }
  function schoolOf(id) { return SCHOOLS.find((s) => s.id === id) || SCHOOLS[0]; }

  /* ---------------- 札（説明カード） ---------------- */
  function ruleHTML(s) {
    return esc(s)
      .replace(/(↑∞|↑\d|↓∞|↓\d|◇|⇄|↕|▭)/g, (m) => `<span class="rg ${m[0] === '↑' ? 'up' : m[0] === '↓' ? 'down' : m === '◇' ? 'adj' : m === '⇄' ? 'side' : m === '↕' ? 'col' : 'layer'}">${m}</span>`)
      .replace(/\[([^\]]+)\]/g, (m, t) => `<span class="tg" style="--tc:${TAGS[t] || '#aaa'}">${t}</span>`);
  }
  function statRows(def, st, grow) {
    const base = RU.baseStats(def, { grow: grow || 0 });
    const cur = st || base;
    const out = [];
    const row = (label, b, c, f, lower) => {
      if (!b && !c) return;
      f = f || ((v) => v);
      const ch = st && Math.abs(c - b) > 1e-6;
      const good = lower ? c < b : c > b;
      out.push(`<dt>${label}</dt><dd>${ch ? `<s>${f(b)}</s><span class="${good ? 'up' : 'dn'}">${f(c)}</span>` : f(c)}</dd>`);
    };
    if (def.cd) row('間隔', def.cd, st ? st.cdEff : def.cd, sec, true);
    row('威力', base.dmg + base.grow, cur.dmg + (st ? 0 : base.grow), (v) => (cur.hits > 1 ? `${v}×${cur.hits}` : v));
    row('雷', base.boltDmg, cur.boltDmg, (v) => (cur.boltN > 1 ? `${v}×${cur.boltN}列` : v));
    row('電', base.zapDmg, cur.zapDmg);
    row('しびれ', base.stun, cur.stun, sec);
    row('盾', base.block, cur.block);
    row('はじめの盾', base.startBlock, cur.startBlock);
    row('回復', base.heal, cur.heal);
    row('燃焼', base.burn, cur.burn);
    row('錆', base.rust, cur.rust);
    row('油', base.oil, cur.oil);
    row('消火', base.cleanse, cur.cleanse);
    row('早める', base.kick, cur.kick, sec);
    if (def.gear) row('歯車', def.gear, st ? st.gear || def.gear : def.gear, (v) => v + '枚');
    if (def.econ) out.push(`<dt>銭</dt><dd>+${def.econ}文</dd>`);
    if (def.win) out.push(`<dt>勝つと</dt><dd>+${def.win}文</dd>`);
    if (!def.cd && !def.gear && !def.econ && !def.win) out.push('<dt>発動</dt><dd>しない（まわりに効く）</dd>');
    return out.join('');
  }
  function recipeLines(id) {
    const out = [];
    for (const r of RECIPES) {
      const ingr = recipeIngredients(r.id);
      if (!ingr.includes(id) && r.to !== id) continue;
      if (SV.meta.found[r.id]) out.push(`<b>合体「${esc(r.title)}」</b>：${ruleHTML(r.text)}`);
      else if (r.to !== id) out.push(`<b>？？？</b>：${esc(r.hint)}……`);
    }
    return out;
  }
  function recipeIngredients(rid) {
    return { homura: ['katana', 'ro', 'toishi'], ooguruma: ['haguruma'], kashi: ['ita'], horokuzutsu: ['ozutsu', 'horoku'], wakatake: ['takeyari', 'oke'], kazaguruma: ['shuriken'] }[rid] || [];
  }
  /* ctx: { id, st, mods, src, price, sale, grow, enemy } */
  function cardHTML(ctx) {
    const d = DEF[ctx.id];
    const rc = RAR[d.rar].color;
    const img = V.thumb(ctx.id);
    let h = `<div class="c-head"><span class="c-mark" style="--rc:${rc};background:${d.color}">${esc(d.mark)}</span><div class="c-nm"><b>${esc(d.name)}</b><small>${esc(d.yomi)}・${d.shape.length ? RU.shapeOf(ctx.id).length : 1}マス</small></div><span class="c-rar" style="--rc:${rc}">${RAR[d.rar].name}</span></div>`;
    h += `<div class="c-tags">${d.tags.map((t) => `<span class="tag" style="--tc:${TAGS[t] || '#888'}">${t}</span>`).join('')}</div>`;
    h += `<div class="c-body"><img src="${img}" alt=""><dl class="c-stats">${statRows(d, ctx.st, ctx.grow)}</dl></div>`;
    if (d.rule) h += `<p class="c-rule">${ruleHTML(d.rule)}</p>`;
    if (ctx.mods && ctx.mods.length) {
      h += `<ul class="c-mods"><li class="h">いま受けている効果</li>${ctx.mods.map((m) => `<li class="${m.neg ? 'neg' : m.gear ? 'gear' : m.height ? 'height' : m.fill ? 'fill' : ''}">${esc(m.text)}</li>`).join('')}</ul>`;
    }
    if (d.grows) h += `<p class="c-flavor">育ち：+${Math.min(ctx.grow || 0, d.growMax)}（最大+${d.growMax}）</p>`;
    if (d.text) h += `<p class="c-flavor">${esc(d.text)}</p>`;
    const rl = recipeLines(ctx.id);
    if (rl.length && !ctx.enemy) h += `<div class="c-recipe">${rl.join('<br>')}</div>`;
    if (ctx.src === 'shop') h += `<p class="c-price">値段：${ctx.price}文${ctx.sale ? '（半額）' : ''}　売ると ${RU.sellPrice(ctx.id)}文</p>`;
    else if (ctx.src === 'box' || ctx.src === 'bench') h += `<p class="c-price">売ると ${RU.sellPrice(ctx.id)}文</p>`;
    if (ctx.acts) h += `<div class="c-act">${ctx.acts}</div>`;
    return h;
  }
  function showCard(ctx) {
    const c = $('#card');
    if (!ctx) {
      c.className = 'card empty';
      c.innerHTML = touch
        ? '<p>道具を<b>タップ</b>すると、ここに説明が出ます。<br>品書きから<b>ドラッグ</b>して、箱に積もう。</p>'
        : '<p>道具に<b>マウスをのせる</b>と、ここに説明が出ます。<br>品書きから<b>ドラッグ</b>（またはクリック）して、箱に積もう。</p>';
      $('#info').classList.remove('show');
      return;
    }
    c.className = 'card';
    c.innerHTML = cardHTML(ctx);
    if (touch && ctx.acts) $('#info').classList.add('show');
  }

  /* ---------------- 箱の力 ---------------- */
  let powCache = null, fullCache = null;
  function renderPow(preview, pvRes) {
    if (!run) return;
    if (!powCache) { const res = RU.resolve(run.box, run.school); powCache = RU.power(res); fullCache = res; }
    const cur = powCache;
    const pv = preview || null;
    const rows = [['攻め', 'atk', '#C8452D'], ['守り', 'def', '#2F7FB8'], ['回復', 'heal', '#3F9A5C'], ['妨害', 'dis', '#7D55C8']];
    const scale = Math.max(12, 6 + run.round * 3.2);
    let h = `<h3>箱の力（毎秒）<span>${RU.usedCells(run.box)}/${RU.cellsOf(run.box)}マス</span></h3>`;
    for (const [nm, k, c] of rows) {
      const v = cur[k], p = pv ? pv[k] : v, dv = p - v;
      h += `<div class="pw" style="--c:${c}"><span>${nm}</span><span class="bar"><i style="width:${Math.min(100, v / scale * 100)}%"></i>${pv && dv > 0.05 ? `<i class="pv" style="width:${Math.min(100, p / scale * 100)}%"></i>` : ''}</span><span class="v">${v.toFixed(1)}${pv && Math.abs(dv) >= 0.05 ? ` <em class="${dv > 0 ? 'up' : 'dn'}">${dv > 0 ? '+' : ''}${dv.toFixed(1)}</em>` : ''}</span></div>`;
    }
    const fr = pvRes || fullCache;
    const nf = fr.full.length;
    h += `<p class="pw-fill${nf ? ' on' : ''}">段そろい <b>${nf}段</b>${nf ? `：はじめの盾+${fr.fillBlock}・その段の速さ+${Math.round(RU.FILL_SPD * 100)}%` : '：ひとつの段を全部うめると、盾と速さ'}</p>`;
    $('#pow').innerHTML = h;
  }
  const dirtyPow = () => { powCache = null; };

  /* ---------------- 上の帯 ---------------- */
  function renderTop() {
    if (!run) return;
    const boss = run.wins >= EC.winsToBoss;
    $('#h-round').textContent = boss ? '天守戦' : `第${run.round}戦`;
    $('#h-school').textContent = schoolOf(run.school).name;
    let t = '';
    for (let i = 0; i < EC.winsToBoss; i++) t += `<i class="${i < run.wins ? 'w' : ''}">${i < run.wins ? '勝' : ''}</i>`;
    t += `<i class="boss ${boss ? 'near' : ''}">城</i>`;
    $('#h-track').innerHTML = t;
    let l = '';
    for (let i = 0; i < EC.lives; i++) l += `<i class="${i < run.lives ? 'on' : ''}"></i>`;
    $('#h-lives').innerHTML = l;
    $('#h-gold').textContent = run.gold;
    $('#h-snd').classList.toggle('off', SV.meta.mute);
  }
  function bumpGold(short) {
    const el = $('#h-coin');
    el.classList.remove('bump', 'short');
    void el.offsetWidth;
    el.classList.add(short ? 'short' : 'bump');
  }

  /* ---------------- 品書き ---------------- */
  function renderShop(flip) {
    const L = $('#shop-list');
    let h = '';
    run.shop.forEach((s, i) => {
      if (!s) { h += `<div class="it sold">売り切れ</div>`; return; }
      const d = DEF[s.id];
      const poor = s.price > run.gold;
      const held = hand && hand.src === 'shop' && hand.si === i;
      h += `<div class="it${poor ? ' poor' : ''}${held ? ' held' : ''}${selShop === i ? ' sel' : ''}${flip ? ' flip' : ''}" data-shop="${i}" style="--rc:${RAR[d.rar].color};--ic:${d.color};animation-delay:${i * 50}ms">`
        + `<img src="${V.thumb(s.id)}" alt="">`
        + `<div class="n"><b><span class="mk">${esc(d.mark)}</span>${esc(d.name)}</b><small>${ruleShort(d)}</small></div>`
        + `<div class="p">${s.sale ? `<s>${d.cost}</s>` : ''}${s.price}<small>文</small></div>`
        + (s.sale ? '<span class="sale">半額</span>' : '')
        + `<button type="button" class="lock${s.lock ? ' on' : ''}" data-lock="${i}" title="取り置き（入れ替えても残す）">留</button>`
        + '</div>';
    });
    L.innerHTML = h;
    $('#b-reroll').disabled = run.gold < EC.reroll;
    const ec = expandCost();
    $('#b-expand-p').textContent = ec == null ? '最大' : ec + '文';
    $('#b-expand').disabled = ec == null || run.gold < ec;
  }
  function ruleShort(d) {
    const a = d.act || {};
    const bits = [];
    if (a.dmg) bits.push(`威力${a.dmg}${a.hits > 1 ? '×' + a.hits : ''}`);
    if (a.bolt) bits.push(`雷${a.bolt.dmg}`);
    if (a.zap) bits.push('しびれ');
    if (a.block) bits.push(`盾${a.block}`);
    if (a.heal) bits.push(`回復${a.heal}`);
    if (a.burn) bits.push(`燃焼${a.burn}`);
    if (a.rust) bits.push(`錆${a.rust}`);
    if (a.oil) bits.push(`油${a.oil}`);
    if (a.kick) bits.push('上を早める');
    if (a.tick) bits.push('全部を早める');
    if (d.start) bits.push(`はじめ盾${d.start.block}`);
    if (d.cd) bits.push(`${d.cd}秒`);
    if (d.gear) bits.push(`歯車${d.gear}`);
    if (d.aura) {
      const a0 = d.aura[0];
      bits.push({ up: '上に効く', down: '下に効く', adj: 'となりに効く', col: '縦一列に効く', side: '横に効く', layer: '同じ段に効く' }[a0.range]);
    }
    if (d.econ) bits.push('銭がふえる');
    return bits.join('・');
  }
  function expandCost() {
    const b = run.box;
    if (b.W >= EC.maxDim && b.D >= EC.maxDim && b.H >= EC.maxDim) return null;
    return EC.expand[Math.min(EC.expand.length - 1, run.expands)];
  }

  /* ---------------- 仮置き台 ---------------- */
  function renderBench() {
    const B = $('#bench');
    let h = '<span class="bench-lbl">仮置き台</span>';
    run.bench.forEach((b, i) => {
      if (!b) { h += `<div class="slot" data-bench="${i}"></div>`; return; }
      const d = DEF[b.id];
      const held = hand && hand.src === 'bench' && hand.bi === i;
      h += `<div class="slot has${held ? ' held' : ''}${selBench === i ? ' sel' : ''}" data-bench="${i}" style="--ic:${d.color}"><img src="${V.thumb(b.id)}" alt=""><span class="mk">${esc(d.mark)}</span></div>`;
    });
    B.innerHTML = h;
  }

  /* ---------------- 段（断面） ---------------- */
  function renderSlice() {
    const el = $('#slice');
    const H = run ? run.box.H : 2;
    const cur = V.getSlice();
    let h = `<button type="button" class="cb${!cur ? ' on' : ''}" data-slice="0">全</button>`;
    for (let y = 1; y < H; y++) h += `<button type="button" class="cb${cur === y ? ' on' : ''}" data-slice="${y}">${y}</button>`;
    el.innerHTML = h;
  }
  function setSlice(k) {
    if (!run) return;
    k = Math.max(0, Math.min(run.box.H - 1, k));
    V.setSlice(k);
    renderSlice();
    A.play('tap');
    if (hand) updateHand();
  }

  function renderAll(flip) {
    if (!run) return;
    renderTop(); renderShop(flip); renderBench(); renderSlice(); renderPow();
    $('#b-go').classList.toggle('ready', run.box.pieces.length >= 2);
    document.body.classList.toggle('holding', !!hand);
    document.body.classList.toggle('touch', !!touch);
  }

  /* ---------------- 範囲と関係 ---------------- */
  function rangesFor(box, p) {
    const d = DEF[p.id], out = [];
    if (d.aura) for (const a of d.aura) {
      let r = a.reach || 1;
      if (run && run.school === 'kamado' && a.range === 'up' && d.tags.includes('火') && r < 99) r += 1;
      out.push({ cells: RU.rangeCells(box, p, a.range, r), kind: a.range });
    }
    if (d.see) for (const [k, r] of d.see) out.push({ cells: RU.rangeCells(box, p, k, r), kind: k });
    if (d.gear) out.push({ cells: RU.rangeCells(box, p, 'side', 1), kind: 'gear' });
    return out;
  }
  function relMap(res, uid) {
    const e = res.by[uid];
    const m = {};
    if (!e) return m;
    m[uid] = 'self';
    for (const o of e.out) if (o.to !== uid) m[o.to] = o.neg ? 'neg' : 'to';
    for (const x of res.items) for (const o of x.out) if (o.to === uid && x.p.uid !== uid && !m[x.p.uid]) m[x.p.uid] = o.neg ? 'neg' : o.gear ? 'gear' : 'from';
    if (e.st.gear) {
      const t = res.trains.find((tt) => tt.uids.includes(uid));
      if (t) { t.uids.forEach((u) => { if (!m[u]) m[u] = 'gear'; }); t.touch.forEach((u) => { if (!m[u]) m[u] = 'to'; }); }
    }
    return m;
  }
  function chipsDiff(a, b) {
    const c = [];
    const n = (v) => (v > 0 ? '+' : '') + v;
    if (b.dmg !== a.dmg) c.push(['威' + n(b.dmg - a.dmg), b.dmg > a.dmg]);
    if (b.boltDmg !== a.boltDmg) c.push(['雷' + n(b.boltDmg - a.boltDmg), b.boltDmg > a.boltDmg]);
    if (a.cdEff && b.cdEff && Math.abs(b.cdEff - a.cdEff) > 0.004) { const p = Math.round((a.cdEff / b.cdEff - 1) * 100); if (p) c.push(['速' + n(p) + '%', p > 0, (b.gearSpd || 0) !== (a.gearSpd || 0)]); }
    for (const [k, lb] of [['block', '盾'], ['heal', '癒'], ['burn', '燃'], ['rust', '錆'], ['oil', '油'], ['startBlock', '初盾'], ['cleanse', '消']]) if (b[k] !== a[k]) c.push([lb + n(b[k] - a[k]), b[k] > a[k]]);
    if (Math.abs((b.stun || 0) - (a.stun || 0)) > 0.01) c.push(['痺' + n(Math.round((b.stun - a.stun) * 10) / 10) + '秒', b.stun > a.stun]);
    if ((b.gear || 0) !== (a.gear || 0)) c.push(['歯' + n(b.gear - a.gear), b.gear > a.gear, true]);
    return c;
  }
  const chipHTML = (list) => `<span>${list.map(([t, up, g]) => `<i class="${up ? (g ? 'gear' : '') : 'dn'}">${esc(t)}</i>`).join('')}</span>`;

  /* ---------------- 手に持つ ---------------- */
  function heldCells() { return hand ? hand.rel : null; }
  function takeFromShop(i, drag) {
    const s = run.shop[i];
    if (!s) return;
    if (s.price > run.gold) { A.play('bad'); bumpGold(true); say(`${esc(DEF[s.id].name)}は ${s.price}文。銭が足りない。`, 2400); return; }
    hand = { src: 'shop', si: i, id: s.id, uid: 0, rel: RU.shapeOf(s.id), grow: 0, drag, price: s.price };
    startHand();
  }
  function takeFromBench(i, drag) {
    const b = run.bench[i];
    if (!b) return;
    hand = { src: 'bench', bi: i, id: b.id, uid: b.uid, rel: b.rel ? RU.norm(b.rel) : RU.shapeOf(b.id), grow: b.grow || 0, drag };
    startHand();
  }
  function takeFromBox(uid, drag) {
    const p = run.box.pieces.find((q) => q.uid === uid);
    if (!p) return;
    run.box.pieces = run.box.pieces.filter((q) => q !== p);
    hand = { src: 'box', uid, id: p.id, rel: RU.norm(p.cells), grow: p.grow || 0, orig: p.cells.map((c) => c.slice()), drag };
    hand.pass = RU.floating(run.box);
    V.syncBox(0, run.box);
    V.setWobble(0, hand.pass);
    dirtyPow();
    // はじめは元の場所を指す
    const [sx, , sz] = RU.extent(hand.rel);
    const mn = [Math.min(...p.cells.map((c) => c[0])), Math.min(...p.cells.map((c) => c[2]))];
    hand.target = { ax: mn[0], az: mn[1] };
    void sx; void sz;
    startHand();
  }
  function startHand() {
    A.init();
    A.play('pick');
    selUid = null; selShop = -1; selBench = -1;
    $('#info').classList.remove('show');
    renderAll();
    hint('rot', touch ? '箱の上をなぞって場所を決め、<b>置く</b>。「回す」「倒す」で向きを変えられる。光るマスが効果範囲。' : '<kbd>R</kbd>で回す・<kbd>F</kbd>で倒す（ホイールでも回る）。光るマスが<b>効果範囲</b>、緑の数字が置いたときの変化。', 8000);
    if (hand.drag) showDragChip();
    updateHand();
  }
  function showDragChip() {
    const d = $('#drag');
    d.querySelector('img').src = V.thumb(hand.id);
    d.hidden = false;
    moveDragChip();
  }
  function moveDragChip() {
    const d = $('#drag');
    d.style.transform = `translate(${ptr.x}px, ${ptr.y - (touch ? 50 : 0)}px)`;
  }
  function overCanvas(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && (el.id === 'cv' || el.classList.contains('lbl') || el.closest('.labels'));
  }
  function aimAt(x, y) {
    if (!hand) return;
    const pk = V.pick(x, y - (touch ? 56 : 0), { margin: 1.6 });
    if (!pk) { hand.target = null; V.setArrowFrom(null); updateHand(); return; }
    // 矢印は、指（マウス）のところから落ちる先へ
    const fp = touch ? V.pick(x, y, { margin: 6 }) : pk;
    V.setArrowFrom(fp && fp.point ? fp.point : pk.point);
    let tx, tz;
    if (pk.floor) { tx = pk.floor[0]; tz = pk.floor[1]; }
    else {
      const [cx, , cz] = pk.cell, [nx, ny, nz] = pk.normal;
      if (ny === 0) { tx = cx + nx; tz = cz + nz; } else { tx = cx; tz = cz; }
    }
    const [sx, , sz] = RU.extent(hand.rel);
    hand.target = { ax: tx - Math.floor((sx - 1) / 2), az: tz - Math.floor((sz - 1) / 2) };
    updateHand();
  }
  let lastGhostKey = '';
  function updateHand() {
    if (!hand) return;
    document.body.classList.toggle('holding', true);
    if (!hand.target) {
      V.clearGhost(); V.clearRange(); V.setLabels([]); V.highlight(0, null);
      hand.drop = null;
      renderPow();
      if (!touch || !hand.drag) showCard({ id: hand.id, src: hand.src, price: hand.price, grow: hand.grow });
      return;
    }
    const dr = RU.drop(run.box, hand.rel, hand.target.ax, hand.target.az, hand.pass);
    hand.drop = dr;
    const key = dr.cells.map((c) => c.join(',')).join(';') + dr.ok;
    V.setGhost(hand.id, dr.cells, dr.ok);
    if (key !== lastGhostKey && lastGhostKey) A.play('rot');
    lastGhostKey = key;
    // 置いたらどうなるか
    const temp = { uid: -7, id: hand.id, cells: dr.cells, grow: hand.grow };
    const before = RU.resolve(run.box, run.school);
    const tb = { W: run.box.W, D: run.box.D, H: run.box.H, pieces: run.box.pieces.concat(dr.ok ? [temp] : []) };
    const after = RU.resolve(tb, run.school);
    const labels = [];
    if (dr.ok) {
      for (const e of before.items) {
        const a2 = after.by[e.p.uid];
        if (!a2) continue;
        const c = chipsDiff(e.st, a2.st);
        if (c.length) labels.push({ si: 0, uid: e.p.uid, html: chipHTML(c) });
      }
      const me = after.by[-7];
      const c2 = chipsDiff(RU.baseStats(DEF[hand.id], temp), me.st);
      const topC = dr.cells.reduce((a, c) => (c[1] > a[1] ? c : a), dr.cells[0]);
      if (c2.length) labels.push({ si: 0, cell: [topC[0], topC[1] + 0.9, topC[2]], html: chipHTML(c2), cls: 'me' });
      V.setRange(rangesFor(tb, temp));
      V.highlight(0, relMap(after, -7));
      renderPow(RU.power(after), after);
      const newly = after.full.filter((y) => !before.full.includes(y));
      for (const y of newly) labels.push({ si: 0, cell: [Math.floor(run.box.W / 2), y + 0.2, run.box.D - 1], html: `<span><i class="fill">段そろい！ 盾+${run.box.W * run.box.D * RU.FILL_BLOCK}・速さ+${Math.round(RU.FILL_SPD * 100)}%</i></span>` });
      showCard({ id: hand.id, st: me.st, mods: me.mods, src: hand.src, price: hand.price, grow: hand.grow });
    } else {
      V.setRange([]);
      V.highlight(0, null);
      renderPow();
      showCard({ id: hand.id, src: hand.src, price: hand.price, grow: hand.grow });
    }
    V.setLabels(labels);
  }
  function rotateHand(kind) {
    if (!hand) return;
    if (kind === 'yaw') hand.rel = RU.rotY(hand.rel);
    else {
      const [ax, s] = V.tipAxis();
      if (ax === 'x') { hand.rel = s > 0 ? RU.rotX(hand.rel) : RU.rotX(RU.rotX(RU.rotX(hand.rel))); }
      else { hand.rel = s > 0 ? RU.rotZ(hand.rel) : RU.rotZ(RU.rotZ(RU.rotZ(hand.rel))); }
    }
    A.play('rot');
    lastGhostKey = '';
    updateHand();
  }
  function endHand() {
    hand = null;
    lastGhostKey = '';
    V.setArrowFrom(null);
    V.clearGhost(); V.clearRange(); V.setLabels([]); V.highlight(0, null); V.setWobble(0, null);
    $('#drag').hidden = true;
    $('#shop').classList.remove('selling', 'over');
    document.body.classList.remove('holding');
    dirtyPow();
    renderAll();
    showCard(null);
  }
  function cancelHand() {
    if (!hand) return;
    if (hand.src === 'box') {
      run.box.pieces.push({ uid: hand.uid, id: hand.id, cells: hand.orig, grow: hand.grow });
      V.syncBox(0, run.box, { placed: hand.uid, lift: 0.25 });
    }
    A.play('tap');
    endHand();
  }
  function commitSource() {
    // 手に取った元から取り除く（お金もここで）
    if (hand.src === 'shop') {
      run.gold -= hand.price;
      run.shop[hand.si] = null;
      bumpGold();
      A.play('buy');
      SV.meta.seen = SV.meta.seen || {};
      SV.meta.seen[hand.id] = 1;
      return RU.newUid();
    }
    if (hand.src === 'bench') { run.bench[hand.bi] = null; return hand.uid; }
    return hand.uid;
  }
  function placeHand() {
    if (!hand || !hand.drop || !hand.drop.ok) {
      A.play('bad');
      if (hand && hand.drop && hand.drop.over) say('そこは<b>箱の高さをこえる</b>。「倒す」で寝かせるか、ほかの列へ。', 2600);
      else if (hand && hand.drop) say('ほかの道具とぶつかる。', 1800);
      return false;
    }
    const uid = commitSource();
    const p = { uid, id: hand.id, cells: hand.drop.cells.map((c) => c.slice()), grow: hand.grow };
    run.box.pieces.push(p);
    const from = hand.src;
    const drops = from === 'box' ? RU.settle(run.box) : {};
    // 置いたピース自身が落ちた場合は、その分も落下に
    V.syncBox(0, run.box, { placed: uid, drops, lift: 0.5 });
    endHand();
    doRecipes();
    afterChange();
    placedCount++;
    if (placedCount === 2) hint('go', '準備ができたら右下の<b>出陣</b>。箱どうしが自動で戦う。', 6000);
    return true;
  }
  let placedCount = 0;
  function toBench(i) {
    if (!hand) return false;
    if (run.bench[i] && !(hand.src === 'bench' && hand.bi === i)) { A.play('bad'); say('その台はふさがっている。', 1500); return false; }
    const uid = commitSource();
    run.bench[i] = { uid, id: hand.id, rel: hand.rel, grow: hand.grow };
    if (hand.src === 'box') { const drops = RU.settle(run.box); V.syncBox(0, run.box, { drops }); }
    A.play('drop', 2);
    endHand();
    afterChange();
    return true;
  }
  function sellHand() {
    if (!hand) return;
    if (hand.src === 'shop') { cancelHand(); return; }
    const price = RU.sellPrice(hand.id);
    if (hand.src === 'bench') run.bench[hand.bi] = null;
    run.gold += price;
    bumpGold();
    A.play('sell');
    if (hand.src === 'box') { const drops = RU.settle(run.box); V.syncBox(0, run.box, { drops }); }
    say(`${esc(DEF[hand.id].name)}を売った（+${price}文）`, 1800);
    endHand();
    afterChange();
  }
  function afterChange() {
    dirtyPow();
    renderAll();
    persist();
    checkEmpty();
    syncLevels(true);
    if (run.box.H >= 3) hint('slice', '段が増えた。下の<b>段</b>ボタン（1〜4キー）で上を隠すと、中まで見える。', 6000);
  }
  /* そろった段（金色）。新しくそろった段は光らせる */
  let lastFull = [];
  function syncLevels(flash) {
    if (!run) return;
    const res = RU.resolve(run.box, run.school);
    const newly = flash ? res.full.filter((y) => !lastFull.includes(y)) : [];
    V.setLevels(0, res.full, newly);
    if (newly.length) {
      A.play('merge');
      V.shake(0.35);
      setTimeout(() => {
        for (const y of newly) { const p = V.project(0, new THREE.Vector3(0, y + 1.1, run.box.D / 2)); V.pop(p[0], p[1], `段そろい！ ${y + 1}段目`, 'merge'); }
      }, 60);
      if (!SV.meta.hints.fill) { SV.meta.hints.fill = 1; say(`<b>段そろい</b>：段のマスが全部うまった。その段の道具が<b>${Math.round(RU.FILL_SPD * 100)}%速く</b>なり、戦いのはじめに<b>盾+${run.box.W * run.box.D * RU.FILL_BLOCK}</b>。`, 7000); persist(); }
    }
    lastFull = res.full.slice();
  }
  /* ひみつ：箱をからっぽにすると、底に焼き印 */
  let emptyShown = false;
  function checkEmpty() {
    const empty = phase === 'shop' && run && run.box.pieces.length === 0 && !hand;
    if (empty && !emptyShown) {
      emptyShown = true;
      V.setFloorMark(['からっぽの箱が', 'いちばん広い', '— 箱師 初代 —']);
      if (!SV.meta.found.soko) { SV.meta.found.soko = 1; persist(); }
    } else if (!empty && emptyShown) { emptyShown = false; V.setFloorMark(null); }
  }
  function doRecipes() {
    let r, guard = 0;
    const merged = [];
    while ((r = RU.findRecipe(run.box)) && guard++ < 8) {
      const np = RU.applyRecipe(run.box, r);
      merged.push(np.uid);
      const first = !SV.meta.found[r.rid];
      SV.meta.found[r.rid] = 1;
      const rec = RECIPES.find((x) => x.id === r.rid);
      setTimeout(() => {
        const sp = V.badgeScreen(0, np.uid);
        if (sp) V.pop(sp[0], sp[1] - 20, `合体！${esc(DEF[np.id].name)}`, 'merge');
        if (first) say(`<b>合体「${esc(rec.title)}」</b>を見つけた。${esc(DEF[np.id].name)}になった。（からくり帖に記録）`, 5200);
      }, 380);
    }
    if (merged.length) {
      setTimeout(() => {
        V.syncBox(0, run.box, { merged });
        A.play('merge');
        V.shake(0.5);
        for (const u of merged) { const M = V.mesh(0, u); if (M) V.spark(M.group.getWorldPosition(new THREE.Vector3()), 0xffd98a, 18, { speed: 3, up: 3, top: true }); }
        dirtyPow(); renderAll(); persist(); syncLevels(true);
      }, 320);
      // 先に位置だけそろえる（合体前の見た目は残す）
    }
  }

  /* ---------------- 選択（タッチ） ---------------- */
  function selectBoxPiece(uid) {
    selUid = uid; selShop = -1; selBench = -1;
    const res = RU.resolve(run.box, run.school);
    const e = res.by[uid];
    if (!e) return;
    V.setRange(rangesFor(run.box, e.p));
    V.highlight(0, relMap(res, uid));
    showCard({ id: e.p.id, st: e.st, mods: e.mods, src: 'box', grow: e.p.grow, acts: `<button type="button" class="btn" data-act="move">動かす</button><button type="button" class="btn" data-act="sell">売る +${RU.sellPrice(e.p.id)}文</button>` });
    renderAll();
  }
  function selectShop(i) {
    const s = run.shop[i];
    if (!s) return;
    selShop = i; selUid = null; selBench = -1;
    clearHover();
    showCard({ id: s.id, src: 'shop', price: s.price, sale: s.sale, acts: `<button type="button" class="btn red" data-act="buy"${s.price > run.gold ? ' disabled' : ''}>買って持つ（${s.price}文）</button><button type="button" class="btn" data-act="close">閉じる</button>` });
    renderAll();
  }
  function selectBench(i) {
    const b = run.bench[i];
    if (!b) return;
    selBench = i; selShop = -1; selUid = null;
    clearHover();
    showCard({ id: b.id, src: 'bench', grow: b.grow, acts: `<button type="button" class="btn red" data-act="bmove">持つ</button><button type="button" class="btn" data-act="bsell">売る +${RU.sellPrice(b.id)}文</button>` });
    renderAll();
  }
  function clearSel() {
    selUid = null; selShop = -1; selBench = -1;
    clearHover();
    showCard(null);
    renderAll();
  }
  $('#card').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !run) return;
    const act = b.dataset.act;
    if (act === 'buy' && selShop >= 0) { const i = selShop; selShop = -1; takeFromShop(i, false); }
    else if (act === 'close') clearSel();
    else if (act === 'move' && selUid) { const u = selUid; selUid = null; takeFromBox(u, false); }
    else if (act === 'sell' && selUid) { const u = selUid; selUid = null; takeFromBox(u, false); sellHand(); }
    else if (act === 'bmove' && selBench >= 0) { const i = selBench; selBench = -1; takeFromBench(i, false); }
    else if (act === 'bsell' && selBench >= 0) { const i = selBench; selBench = -1; takeFromBench(i, false); sellHand(); }
  });

  /* ---------------- ホバー（マウス） ---------------- */
  function clearHover() {
    hoverUid = null;
    V.clearRange(); V.highlight(0, null); V.setLabels([]);
  }
  function hoverBox(uid) {
    if (hoverUid === uid) return;
    hoverUid = uid;
    if (uid == null) { clearHover(); showCard(null); return; }
    const res = RU.resolve(run.box, run.school);
    const e = res.by[uid];
    if (!e) return;
    V.setRange(rangesFor(run.box, e.p));
    V.highlight(0, relMap(res, uid));
    showCard({ id: e.p.id, st: e.st, mods: e.mods, src: 'box', grow: e.p.grow });
    hint('range', '光るマスがその道具の<b>効果範囲</b>。緑に光る道具に効き、金色の道具から効果を受けている。', 7000);
  }

  /* ---------------- 入力 ---------------- */
  const cv = $('#cv');
  function onDown(e, kind, idx) {
    A.init();
    ptr.down = true; ptr.moved = false; ptr.sx = e.clientX; ptr.sy = e.clientY; ptr.x = e.clientX; ptr.y = e.clientY; ptr.button = e.button;
    pend = { kind, idx, t: performance.now() };
  }
  let titleTaps = 0, titleBusy = false;
  cv.addEventListener('pointerdown', (e) => {
    cv.focus({ preventScroll: true });
    if (phase === 'title' && !titleBusy) {
      A.init();
      const pk = V.pick(e.clientX, e.clientY);
      if (pk && pk.uid) {
        V.fire(0, pk.uid); V.hitPiece(0, pk.uid); A.play('drop', 3 + titleTaps);
        if (++titleTaps >= 12) {
          titleBusy = true; titleTaps = 0;
          V.burst(0); A.play('boom'); V.shake(0.8);
          setTimeout(() => { if (phase === 'title') { V.clearBox(0); V.syncBox(0, demo.box, { intro: 1.2 }); } titleBusy = false; }, 1500);
        }
      }
      return;
    }
    if (phase === 'battle') { onDown(e, 'bcanvas'); return; }
    if (phase !== 'shop') { onDown(e, 'none'); return; }
    if (e.button === 2) { e.preventDefault(); if (hand) cancelHand(); return; }
    if (hand) { onDown(e, 'aim'); if (touch || hand.drag) aimAt(e.clientX, e.clientY); return; }
    const pk = V.pick(e.clientX, e.clientY);
    if (pk && pk.uid) onDown(e, 'box', pk.uid);
    else onDown(e, 'empty');
  });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  $('#shop-list').addEventListener('pointerdown', (e) => {
    if (phase !== 'shop') return;
    if (e.target.closest('[data-lock]')) return;
    const it = e.target.closest('[data-shop]');
    if (!it) return;
    if (hand) { onDown(e, 'shopdrop'); return; }
    onDown(e, 'shop', +it.dataset.shop);
  });
  $('#shop-list').addEventListener('pointerover', (e) => {
    if (touch || hand || phase !== 'shop' || !run) return;
    const it = e.target.closest('[data-shop]');
    if (!it) return;
    const s = run.shop[+it.dataset.shop];
    if (s) { clearHover(); showCard({ id: s.id, src: 'shop', price: s.price, sale: s.sale }); }
  });
  $('#bench').addEventListener('pointerover', (e) => {
    if (touch || hand || phase !== 'shop' || !run) return;
    const sl = e.target.closest('[data-bench]');
    const b = sl && run.bench[+sl.dataset.bench];
    if (b) { clearHover(); showCard({ id: b.id, src: 'bench', grow: b.grow }); }
  });
  $('#shop-list').addEventListener('click', (e) => {
    const l = e.target.closest('[data-lock]');
    if (!l || !run) return;
    const s = run.shop[+l.dataset.lock];
    if (!s) return;
    s.lock = !s.lock;
    A.play('tap');
    renderShop();
    persist();
    if (s.lock) say('取り置きした。入れ替えても、次の品書きにも残る。', 2200);
  });
  $('#bench').addEventListener('pointerdown', (e) => {
    if (phase !== 'shop') return;
    const sl = e.target.closest('[data-bench]');
    if (!sl) return;
    const i = +sl.dataset.bench;
    if (hand) { onDown(e, 'benchdrop', i); return; }
    if (run.bench[i]) onDown(e, 'bench', i);
  });
  $('#shop').addEventListener('pointerdown', (e) => {
    if (phase !== 'shop' || !hand) return;
    if (e.target.closest('[data-shop]') || e.target.closest('button')) return;
    onDown(e, 'shopdrop');
  });

  let wheelT = 0;
  cv.addEventListener('wheel', (e) => {
    if (phase !== 'shop' || !hand) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wheelT < 110) return;
    wheelT = now;
    rotateHand('yaw');
  }, { passive: false });

  G.addEventListener('pointermove', (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    if (ptr.down && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 7) ptr.moved = true;
    if (phase === 'battle') { battleHover(e); return; }
    if (phase !== 'shop') return;
    // 押してから動かしたら、ドラッグで持つ
    if (pend && ptr.moved && !hand) {
      const p = pend; pend = null;
      if (p.kind === 'shop') takeFromShop(p.idx, true);
      else if (p.kind === 'bench') takeFromBench(p.idx, true);
      else if (p.kind === 'box') takeFromBox(p.idx, true);
      else if (p.kind === 'empty') { pend = p; }
    }
    if (hand) {
      if (hand.drag) moveDragChip();
      const onC = overCanvas(e.clientX, e.clientY - (touch && hand.drag ? 50 : 0));
      const shopEl = $('#shop');
      const r = shopEl.getBoundingClientRect();
      const overShop = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      shopEl.classList.toggle('selling', hand.src !== 'shop' && (hand.drag || overShop));
      shopEl.classList.toggle('over', overShop && hand.src !== 'shop');
      if (hand.src !== 'shop') $('#sell-price').textContent = `+${RU.sellPrice(hand.id)}文`;
      document.querySelectorAll('.slot').forEach((s) => s.classList.remove('drop'));
      const sl = document.elementFromPoint(e.clientX, e.clientY);
      const slot = sl && sl.closest && sl.closest('[data-bench]');
      if (slot) slot.classList.add('drop');
      if (hand.drag) $('#drag').hidden = !!onC;
      if (onC && (!touch || ptr.down)) aimAt(e.clientX, e.clientY);
      else if (!onC && hand.drag && hand.target) { hand.target = null; updateHand(); }
      return;
    }
    // ホバー
    if (!touch && !ptr.down) {
      if (overCanvas(e.clientX, e.clientY)) {
        const pk = V.pick(e.clientX, e.clientY);
        hoverBox(pk && pk.uid ? pk.uid : null);
        cv.style.cursor = pk && pk.uid ? 'grab' : 'default';
      }
    }
  });
  G.addEventListener('pointerup', (e) => {
    const wasDown = ptr.down;
    ptr.down = false;
    const p = pend; pend = null;
    if (!wasDown) return;
    if (phase === 'battle') return;
    if (phase !== 'shop') return;
    const moved = ptr.moved;
    // 空いているところを横になぞる → 箱を回す
    if (p && p.kind === 'empty') {
      const dx = e.clientX - ptr.sx;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - ptr.sy)) { V.rotate(dx > 0 ? -1 : 1); A.play('rot'); if (hand) setTimeout(updateHand, 30); }
      else if (!moved && touch) clearSel();
      return;
    }
    if (hand && hand.drag) {
      // ドラッグの終わり
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slot = el && el.closest && el.closest('[data-bench]');
      const shopEl = el && el.closest && el.closest('#shop');
      if (slot) { toBench(+slot.dataset.bench); return; }
      if (shopEl) { if (hand.src === 'shop') cancelHand(); else sellHand(); return; }
      if (overCanvas(e.clientX, e.clientY - (touch ? 50 : 0)) && hand.drop && hand.drop.ok) { placeHand(); return; }
      if (overCanvas(e.clientX, e.clientY - (touch ? 50 : 0)) && hand.drop) { placeHand(); if (hand) { hand.drag = false; $('#drag').hidden = true; } return; }
      cancelHand();
      return;
    }
    if (hand && !hand.drag) {
      if (p && p.kind === 'benchdrop') { toBench(p.idx); return; }
      if (p && p.kind === 'shopdrop') { if (hand.src === 'shop') cancelHand(); else sellHand(); return; }
      if (p && p.kind === 'aim') {
        if (touch) {
          // 同じところをもう一度タップしたら置く
          const key = hand.drop ? hand.drop.cells.join('|') : '';
          if (!moved && hand._lastTap === key && key) placeHand();
          else if (hand) hand._lastTap = key;
        } else if (!moved) placeHand();
      }
      return;
    }
    if (!p || moved) return;
    // クリック（動かさずに離した）
    if (p.kind === 'shop') { if (touch) selectShop(p.idx); else takeFromShop(p.idx, false); }
    else if (p.kind === 'bench') { if (touch) selectBench(p.idx); else takeFromBench(p.idx, false); }
    else if (p.kind === 'box') { if (touch) selectBoxPiece(p.idx); else takeFromBox(p.idx, false); }
  });

  G.addEventListener('pointercancel', () => {
    ptr.down = false;
    pend = null;
    if (hand && hand.drag) cancelHand();
  });
  G.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (!$('#ask').hidden) { if (k === 'escape') { askCb = null; resetAsk(); } return; }
    if (!$('#book').hidden) { if (k === 'escape') closeBook(); return; }
    if (phase === 'battle') {
      if (k === ' ') { e.preventDefault(); togglePause(); }
      if (k === 'q') V.rotate(1);
      if (k === 'e') V.rotate(-1);
      return;
    }
    if (phase !== 'shop') return;
    if (k === 'r') rotateHand('yaw');
    else if (k === 'f') rotateHand('tip');
    else if (k === 'q') { V.rotate(1); A.play('rot'); if (hand) setTimeout(updateHand, 30); }
    else if (k === 'e') { V.rotate(-1); A.play('rot'); if (hand) setTimeout(updateHand, 30); }
    else if (k === 'escape') { if (hand) cancelHand(); else if ($('#expand-pop').hidden === false) closeExpand(); else clearSel(); }
    else if (k === 's' && hand) sellHand();
    else if (k >= '0' && k <= '4') setSlice(+k);
    else if (k === 'enter' && !hand) tryGo();
  });

  /* ---------------- ボタン ---------------- */
  $('#c-rl').addEventListener('click', () => { V.rotate(1); A.play('rot'); if (hand) setTimeout(updateHand, 30); });
  $('#c-rr').addEventListener('click', () => { V.rotate(-1); A.play('rot'); if (hand) setTimeout(updateHand, 30); });
  $('#c-yaw').addEventListener('click', () => rotateHand('yaw'));
  $('#c-tip').addEventListener('click', () => rotateHand('tip'));
  $('#c-put').addEventListener('click', () => placeHand());
  $('#c-cancel').addEventListener('click', () => cancelHand());
  $('#slice').addEventListener('click', (e) => { const b = e.target.closest('[data-slice]'); if (b) setSlice(+b.dataset.slice); });
  $('#b-reroll').addEventListener('click', () => {
    if (!run || hand || run.gold < EC.reroll) return;
    run.gold -= EC.reroll;
    run.rerolls++;
    rollShop();
    A.play('reroll');
    bumpGold();
    renderAll(true);
    persist();
  });
  $('#b-expand').addEventListener('click', () => { if (!run || hand) return; openExpand(); });
  $('#b-go').addEventListener('click', () => tryGo());
  $('#h-snd').addEventListener('click', () => { SV.meta.mute = !SV.meta.mute; A.setMuted(SV.meta.mute); renderTop(); persist(); });
  $('#h-book').addEventListener('click', () => openBook('items'));
  $('#h-menu').addEventListener('click', () => {
    A.play('tap');
    const box = $('#ask');
    $('#ask-t').innerHTML = 'メニュー';
    const bb = box.querySelector('.ask-b');
    bb.classList.add('col');
    bb.innerHTML = '<button type="button" class="btn" data-m="book">からくり帖</button><button type="button" class="btn" data-m="how">遊び方</button><button type="button" class="btn" data-m="title">タイトルへ（合戦は保存されます）</button><button type="button" class="btn ghost" data-m="x">閉じる</button>';
    box.hidden = false;
  });
  $('#ask').addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]');
    if (!m) return;
    const k = m.dataset.m;
    resetAsk();
    A.play('tap');
    if (k === 'book') openBook('items');
    else if (k === 'how') openBook('how');
    else if (k === 'title') { cancelHand(); showTitle(); }
  });
  function resetAsk() {
    const box = $('#ask');
    box.hidden = true;
    const bb = box.querySelector('.ask-b');
    if (bb.classList.contains('col')) {
      bb.classList.remove('col');
      bb.innerHTML = '<button type="button" class="btn" id="ask-no">やめる</button><button type="button" class="btn red" id="ask-yes">はい</button>';
    }
  }

  /* ---------------- 箱を広げる ---------------- */
  function openExpand() {
    const pop = $('#expand-pop');
    const b = run.box, c = expandCost();
    if (c == null) return;
    const opt = (k, lb, cur) => `<button type="button" class="btn" data-exp="${k}"${cur >= EC.maxDim || run.gold < c ? ' disabled' : ''}>${lb}<small>${cur} → ${Math.min(EC.maxDim, cur + 1)}</small></button>`;
    pop.innerHTML = `<h4>箱を広げる（${c}文）</h4>${opt('W', '横に広げる', b.W)}${opt('D', '奥に広げる', b.D)}${opt('H', '高さを足す', b.H)}<p>いまは 横${b.W}×奥${b.D}×高さ${b.H}（${RU.cellsOf(b)}マス）。高くすると上下の効果が活きる。</p><button type="button" class="btn ghost" data-exp="x">やめる</button>`;
    pop.hidden = false;
    A.play('tap');
  }
  function closeExpand() { $('#expand-pop').hidden = true; V.clearRange(); }
  /* 広げたときに増えるマスを見せる */
  $('#expand-pop').addEventListener('pointerover', (e) => {
    const bt = e.target.closest('[data-exp]');
    if (!bt || !run || hand) return;
    const k = bt.dataset.exp, b = run.box, cells = [];
    if (k === 'W' && b.W < EC.maxDim) for (let y = 0; y < b.H; y++) for (let z = 0; z < b.D; z++) cells.push([b.W, y, z]);
    if (k === 'D' && b.D < EC.maxDim) for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++) cells.push([x, y, b.D]);
    if (k === 'H' && b.H < EC.maxDim) for (let x = 0; x < b.W; x++) for (let z = 0; z < b.D; z++) cells.push([x, b.H, z]);
    V.setRange(cells.length ? [{ cells, kind: 'layer' }] : []);
  });
  $('#expand-pop').addEventListener('pointerleave', () => { V.clearRange(); });
  $('#expand-pop').addEventListener('click', (e) => {
    const b = e.target.closest('[data-exp]');
    if (!b) return;
    const k = b.dataset.exp;
    if (k === 'x') { closeExpand(); return; }
    const c = expandCost();
    if (c == null || run.gold < c) return;
    run.gold -= c;
    run.expands++;
    run.box[k] = Math.min(EC.maxDim, run.box[k] + 1);
    closeExpand();
    V.syncBox(0, run.box);
    lastFull = RU.resolve(run.box, run.school).full;
    V.setLevels(0, lastFull);
    A.play('expand');
    bumpGold();
    V.shake(0.3);
    afterChange();
    say(`箱が ${run.box.W}×${run.box.D}×${run.box.H} になった。`, 2200);
  });

  /* ---------------- 品書きの補充 ---------------- */
  function rollShop() {
    const R = RU.rng((run.seed ^ (run.round * 7919) ^ (run.rerolls * 104729)) >>> 0);
    const fresh = RU.rollShop(R, run.round + (run.wins >= EC.winsToBoss ? 1 : 0), run.school, EC.shop);
    run.shop = run.shop.map((s, i) => (s && s.lock ? s : fresh[i]));
    // ひみつ：0文で出陣した次の品書きに、まれに招き猫
    if (run.zeroGo && run.rerolls === 0 && R() < 0.5) {
      const i = run.shop.findIndex((s) => !s || !s.lock);
      if (i >= 0) run.shop[i] = { id: 'maneki', price: DEF.maneki.cost, sale: false };
      run.zeroGo = false;
    }
  }

  /* ---------------- 流れ ---------------- */
  function hideAll() {
    document.body.classList.remove('inbattle');
    if (emptyShown) { emptyShown = false; V.setFloorMark(null); }
    ['#title', '#school', '#hud', '#bhud', '#result', '#book', '#expand-pop'].forEach((s) => { $(s).hidden = true; });
    $('#tip') && ($('#tip').hidden = true);
  }
  function viewRect() {
    const el = phase === 'shop' ? $('#view') : null;
    const cr = cv.getBoundingClientRect();
    if (el && !$('#hud').hidden) {
      const r = el.getBoundingClientRect();
      return { x: r.left - cr.left, y: r.top - cr.top + (touch ? 0 : 30), w: r.width, h: r.height - (touch ? 0 : 30) };
    }
    if (phase === 'battle') { const top = cr.width < 760 ? 90 : 110; return { x: 0, y: top, w: cr.width, h: cr.height - top - (cr.width < 760 ? 70 : 60) }; }
    if (phase === 'title' || phase === 'school') {
      if (cr.width > 900) { const l = Math.min(620, cr.width * 0.45); return { x: l, y: 0, w: cr.width - l, h: cr.height }; }
      return { x: 0, y: 0, w: cr.width, h: cr.height * 0.5 };
    }
    return { x: 0, y: 0, w: cr.width, h: cr.height };
  }
  function relayout() { V.resize(); V.setRect(viewRect()); }
  G.addEventListener('resize', () => { relayout(); setTimeout(relayout, 60); });

  let demo = null;
  function showTitle() {
    phase = 'title';
    hideAll();
    battle = null;
    V.setSlice(0);
    V.setCrest(0, null); V.setCrest(1, null);
    V.setCharge(0, new Map()); V.setCharge(1, new Map());
    V.setStunned(0, new Set()); V.setStunned(1, new Set());
    if (!demo) { demo = RU.aiBuild(20260927, 7, { arch: 'fire', dims: [4, 4, 3], factor: 1 }); }
    V.clearBox(0);
    V.syncBox(0, demo.box, { intro: 1.4 });
    V.setMode('title');
    $('#title').hidden = false;
    $('#t-cont').hidden = !SV.run;
    const m = SV.meta;
    $('#t-note').innerHTML = (m.clears ? `天守を落とした回数：${m.clears}　` : m.bestWins ? `いちばん多く勝った合戦：${m.bestWins}勝　` : '') + '音が出ます。　この作品はフィクションです。';
    relayout();
  }
  $('#t-new').addEventListener('click', () => {
    A.init(); A.play('tap');
    if (SV.run) ask('いまの合戦を捨てて、新しくはじめますか？', () => showSchool(), '新しくはじめる');
    else showSchool();
  });
  $('#t-cont').addEventListener('click', () => { A.init(); A.play('tap'); resumeRun(); });
  $('#t-book').addEventListener('click', () => { A.init(); openBook('items'); });
  $('#t-how').addEventListener('click', () => { A.init(); openBook('how'); });

  function showSchool() {
    phase = 'school';
    hideAll();
    const L = $('#sc-list');
    L.innerHTML = SCHOOLS.map((s, i) => {
      const locked = s.locked && !SV.meta.clears;
      return `<button type="button" class="sc" data-school="${s.id}"${locked ? ' disabled' : ''} style="animation-delay:${i * 70}ms"><span class="mk" style="background:${s.color}">${s.mark}</span><b>${s.name}</b><p>${esc(s.desc)}</p><div class="perk">${ruleHTML(s.perk)}</div><div class="kit">${s.start.map((id) => `<img src="${V.thumb(id)}" alt="${esc(DEF[id].name)}" title="${esc(DEF[id].name)}">`).join('')}</div><div class="dims">はじめの道具：${s.start.map((id) => DEF[id].name).join('・')}</div></button>`;
    }).join('');
    $('#school').hidden = false;
    relayout();
  }
  $('#sc-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-school]');
    if (!b || b.disabled) return;
    A.play('stamp');
    newRun(b.dataset.school);
  });
  $('#sc-back').addEventListener('click', () => { A.play('tap'); showTitle(); });

  function newRun(school) {
    const seed = (Math.random() * 2 ** 31) >>> 0;
    const s = schoolOf(school);
    run = SV.run = { seed, round: 1, wins: 0, lives: EC.lives, gold: EC.startGold, school, box: RU.newBox(3, 3, 2), bench: Array(EC.bench).fill(null), shop: Array(EC.shop).fill(null), expands: 0, rerolls: 0, log: [], zeroGo: false, bonus: 0, started: Date.now() };
    // はじめの道具を積む
    for (const id of s.start) {
      const bp = RU.bestPlacement(run.box, id, school, RU.rng(seed), null, 9);
      if (bp) run.box.pieces.push({ uid: RU.newUid(), id, cells: bp.cells, grow: 0 });
    }
    SV.meta.runs++;
    placedCount = 0;
    enterShop(true);
  }
  function resumeRun() {
    run = SV.run;
    let mx = 0;
    for (const p of run.box.pieces) mx = Math.max(mx, p.uid);
    for (const b of run.bench) if (b) mx = Math.max(mx, b.uid);
    RU.syncUid(mx);
    enterShop(false, run.phase !== 'result');
  }
  function enterShop(first, resumed) {
    phase = 'shop';
    hideAll();
    battle = null;
    V.setMode('shop');
    V.setCrest(0, null); V.setCrest(1, null);
    V.setCharge(0, new Map()); V.setCharge(1, new Map());
    V.setStunned(0, new Set()); V.setStunned(1, new Set());
    V.clearBox(1);
    V.clearBox(0);
    V.setSlice(0);
    if (!resumed) {
      if (!first) {
        const zeni = run.box.pieces.filter((p) => DEF[p.id].econ).length;
        const inc = RU.income(run.round) + zeni + (run.bonus || 0);
        run.gold += inc;
        run.bonus = 0;
        setTimeout(() => { say(`銭が入った：<b>+${inc}文</b>${zeni ? `（銭箱+${zeni}）` : ''}`, 2600); bumpGold(); }, 400);
      }
      run.rerolls = 0;
      rollShop();
    }
    run.phase = 'shop';
    V.syncBox(0, run.box, { intro: first ? 0.6 : 0.25 });
    lastFull = [];
    syncLevels(false);
    $('#hud').hidden = false;
    showCard(null);
    renderAll(true);
    relayout();
    setTimeout(relayout, 50);
    persist();
    if (first) setTimeout(() => hint('buy', touch ? '品書きの道具を<b>箱へドラッグ</b>して積む（タップで説明）。道具は上から落ちて重なる。' : '品書きの道具を<b>箱へドラッグ</b>して積む。道具は上から落ちて、下のものに乗る。', 8000), 700);
    else if (run.round === 2) setTimeout(() => hint('dir', '<b>火は上へ</b>、<b>水は下へ</b>、<b>歯車は同じ段の横</b>に効く。置き場所しだいで同じ道具が強くなる。', 8000), 2800);
    else if (run.round === 3) setTimeout(() => hint('expand', '箱が狭くなったら<b>箱を広げる</b>。横・奥・高さのどれを伸ばすかも作戦のうち。', 7000), 2800);
  }

  function tryGo() {
    if (phase !== 'shop' || !run) return;
    if (hand) cancelHand();
    if (!run.box.pieces.some((p) => DEF[p.id].cd)) { A.play('bad'); say('箱に、発動する道具（武器や盾など）が一つもない。', 2600); return; }
    const benchN = run.bench.filter(Boolean).length;
    if (benchN && !SV.meta.hints.benchWarn) { SV.meta.hints.benchWarn = 1; ask(`仮置き台の道具（${benchN}つ）は、戦いでは使われません。<br>このまま出陣しますか？`, () => startBattle(), '出陣する'); return; }
    startBattle();
  }

  /* ---------------- 合戦 ---------------- */
  function makeEnemy() {
    const boss = run.wins >= EC.winsToBoss;
    const seed = (run.seed ^ (run.round * 2654435761) ^ (run.lives * 97)) >>> 0;
    if (boss) {
      const R = RU.rng(seed);
      const arch = RU.pick(R, ['fire', 'gear', 'bolt', 'blade', 'guard', 'water']);
      const e = RU.aiBuild(seed, run.round + 1, { arch, dims: [5, 5, 5], factor: 0.8, boss: true });
      e.name = '天守'; e.crest = '城'; e.boss = true;
      return e;
    }
    const e = RU.aiBuild(seed, run.round);
    // ひみつ：前の合戦のあなたの箱が、ふらりと現れることがある
    const lb = SV.meta.lastBox;
    if (lb && !run.mirrorDone && run.round >= 5 && run.round <= 8 && RU.rng(seed)() < 0.4) {
      const pe = RU.power(RU.resolve(e.box, e.school)).total, pm = RU.power(RU.resolve(lb.box, lb.school)).total;
      if (pm <= pe * 1.3 && pm >= pe * 0.6) {
        run.mirrorDone = true;
        let mx = 0; const b = clone(lb.box); b.pieces.forEach((p) => { p.uid = 900000 + (++mx); });
        return { box: b, school: lb.school, arch: 'mirror', name: 'むかしのあなたの箱', crest: '昔', mirror: true };
      }
    }
    return e;
  }
  function startBattle() {
    closeExpand();
    const E = makeEnemy();
    const boss = !!E.boss;
    const hp = RU.hpFor(run.round, false), ehp = RU.hpFor(run.round, boss);
    const me = { name: 'あなたの箱', hp, box: clone(run.box), school: run.school };
    const sim = RU.simulate([me, { name: E.name, hp: ehp, box: E.box, school: E.school }], (run.seed ^ (run.round * 31337)) >>> 0);
    run.zeroGo = run.gold === 0;
    battle = { E, sim, boss, t: -1.5, ei: 0, snapI: 0, paused: false, done: false, finished: false, hp: [hp, ehp], speed: SV.meta.speed || 1, fat: 0 };
    phase = 'battle';
    hideAll();
    document.body.classList.add('inbattle');
    $('#bhud').hidden = false;
    V.setSlice(0);
    V.setMode('battle');
    V.syncBox(0, run.box);
    V.syncBox(1, E.box, { intro: 1.0 });
    V.setLevels(0, RU.resolve(run.box, run.school).full);
    V.setLevels(1, RU.resolve(E.box, E.school).full);
    const sc = schoolOf(run.school);
    V.setCrest(0, sc.mark, sc.color);
    V.setCrest(1, E.crest, boss ? '#2a211b' : '#7a6552');
    $('#nm0').textContent = 'あなたの箱';
    $('#nm1').textContent = E.name + (boss ? '（ぬし）' : '');
    $('#cr0').textContent = sc.mark; $('#cr0').style.background = sc.color;
    $('#cr1').textContent = E.crest; $('#cr1').style.background = boss ? '#2a211b' : '#7a6552';
    setSpeedBtns();
    updateBars(0);
    relayout();
    A.play('go');
    hint('battle', '道具の札のまわりの<b>輪がたまると発動</b>。箱の色がせり上がるのも同じ合図。', 6500);
    persist();
  }
  function setSpeedBtns() { document.querySelectorAll('[data-spd]').forEach((b) => b.classList.toggle('on', +b.dataset.spd === battle.speed && !battle.paused)); $('#b-pause').classList.toggle('on', battle.paused); }
  document.querySelectorAll('[data-spd]').forEach((b) => b.addEventListener('click', () => { if (!battle) return; battle.speed = +b.dataset.spd; battle.paused = false; SV.meta.speed = battle.speed; setSpeedBtns(); A.play('tap'); }));
  function togglePause() { if (!battle) return; battle.paused = !battle.paused; setSpeedBtns(); A.play('tap'); }
  $('#b-pause').addEventListener('click', togglePause);
  $('#b-skip').addEventListener('click', () => { if (!battle || battle.finished) return; skipBattle(); });

  function snapAt(t) {
    const S = battle.sim.snaps;
    let i = battle.snapI;
    while (i + 1 < S.length && S[i + 1].t <= t) i++;
    while (i > 0 && S[i].t > t) i--;
    battle.snapI = i;
    return S[i];
  }
  function updateBars(t) {
    const sn = snapAt(Math.max(0, t - 0.15));
    for (let si = 0; si < 2; si++) {
      const s = sn.s[si], max = battle.hp[si];
      const bar = $('#bar' + si);
      const pct = Math.max(0, s.hp) / max * 100;
      bar.querySelector('.fill').style.width = pct + '%';
      bar.querySelector('.fillb').style.width = pct + '%';
      bar.querySelector('.shield').style.width = Math.min(100, s.block / max * 100) + '%';
      bar.querySelector('.num').textContent = `${Math.max(0, Math.ceil(s.hp))} / ${max}`;
      const chips = [];
      if (s.block > 0) chips.push(`<span class="chip blk">盾 ${Math.round(s.block)}</span>`);
      if (s.burn > 0) chips.push(`<span class="chip burn">燃焼 ${s.burn}</span>`);
      if (s.rust > 0) chips.push(`<span class="chip rust">錆 ${s.rust}</span>`);
      if (s.oil > 0) chips.push(`<span class="chip oil">油 ${s.oil}</span>`);
      const st = bar.querySelector('.st');
      const html = chips.join('');
      if (st._h !== html) { st.innerHTML = html; st._h = html; }
    }
    // 輪としびれ
    const sn2 = snapAt(Math.max(0, t));
    for (let si = 0; si < 2; si++) {
      const uids = battle.sim.uids[si];
      const m = new Map(), st = new Set();
      uids.forEach((u, k) => { m.set(u, sn2.s[si].ch[k]); if (sn2.s[si].stun[k]) st.add(u); });
      V.setCharge(si, m);
      V.setStunned(si, st);
    }
    $('#b-time').textContent = Math.max(0, t).toFixed(1);
    $('#b-fat').textContent = t >= RU.FATIGUE_AT ? 'ほころび' : '';
  }
  function crestPos(si) { const p = V.crestScreen(si); return p || [si ? innerWidth * 0.7 : innerWidth * 0.3, innerHeight * 0.3]; }
  function popAt(si, html, cls) { const p = crestPos(si); V.pop(p[0] + (Math.random() - 0.5) * 50, p[1] + 36 + (Math.random() - 0.5) * 20, html, cls); }
  function worldOfBadge(si, uid) {
    const M = V.mesh(si, uid);
    if (!M) return V.side(si).root.localToWorld(new THREE.Vector3(0, 1, 0));
    return M.badge.getWorldPosition(new THREE.Vector3());
  }
  function crestWorld(si) { const S = V.side(si); return S.crest ? S.crest.getWorldPosition(new THREE.Vector3()) : S.root.localToWorld(new THREE.Vector3(0, 3, 0)); }
  const COLORS = { fire: 0xff8a3d, steel: 0xdfe8f5, wood: 0xf2d29b, bolt: 0xc9b6ff, water: 0x7cc4ff };
  function bulletColor(id) {
    const d = DEF[id];
    if (d.tags.includes('火')) return COLORS.fire;
    if (d.tags.includes('雷')) return COLORS.bolt;
    if (d.tags.includes('木')) return COLORS.wood;
    return COLORS.steel;
  }
  function uidDef(si, uid) { const b = si === 0 ? run.box : battle.E.box; const p = b.pieces.find((q) => q.uid === uid); return p ? DEF[p.id] : null; }
  function playEvent(ev, fast) {
    const s = ev.s;
    switch (ev.k) {
      case 'fire': {
        V.fire(s, ev.u);
        if (fast) break;
        const d = uidDef(s, ev.u);
        if (d && d.act && (d.act.dmg || d.act.burn || d.act.rust)) A.play(d.tags.includes('飛') ? 'shoot' : 'swing');
        if (d && d.act && d.act.block) A.play('block');
        break;
      }
      case 'dmg': {
        if (fast) break;
        const big = ev.a >= 12;
        if (ev.kind === 'hit' || ev.kind === 'zap') {
          const from = worldOfBadge(1 - s, ev.u), to = crestWorld(s);
          const d = uidDef(1 - s, ev.u);
          V.shoot(from, to, bulletColor(d ? d.id : 'katana'), 0.2 / Math.sqrt(battle.speed), () => {
            V.crestHit(s, big);
            popAt(s, ev.a > 0 ? String(ev.a) : '0', big ? 'big' : '');
            if (ev.b) popAt(s, `盾−${ev.b}`, 'blk');
            A.play(ev.b && !ev.a ? 'block' : 'hit', ev.a);
            if (big) V.shake(0.35);
            if (s === 0 && ev.a >= battle.hp[0] * 0.08) flashHit();
          }, { arc: d && d.tags.includes('飛') ? 1.8 : 0.9, size: big ? 1.5 : 1 });
        } else if (ev.kind === 'burn') {
          V.crestHit(s, false);
          popAt(s, String(ev.a), 'burn');
          V.spark(crestWorld(s), 0xff8a3d, 5, { up: 2.5, speed: 0.8, g: -1, top: true, add: true });
          A.play('burn');
        } else if (ev.kind === 'bolt') {
          setTimeout(() => { V.crestHit(s, true); popAt(s, String(ev.a), 'big'); }, 60);
        } else if (ev.kind === 'fat') {
          popAt(s, String(ev.a), '');
          V.crestHit(s, false);
        }
        break;
      }
      case 'block': if (!fast) { popAt(s, ev.fill ? `段そろい 盾+${ev.a}` : `盾+${ev.a}`, 'blk'); if (ev.start) A.play('block'); } break;
      case 'heal': if (!fast && ev.a > 0) { popAt(s, `+${ev.a}`, 'heal'); V.spark(crestWorld(s), 0x7fe39a, 8, { up: 2.2, speed: 1, g: -0.5, top: true, add: true }); A.play('heal'); } break;
      case 'burn': if (!fast) { popAt(s, `燃焼+${ev.a}`, 'burn'); A.play('fire'); } break;
      case 'rust': if (!fast) popAt(s, `錆+${ev.a}`, 'rust'); break;
      case 'oil': if (!fast) popAt(s, `油+${ev.a}`, 'oil'); break;
      case 'cleanse': if (!fast) popAt(s, `消火−${ev.a}`, 'heal'); break;
      case 'kick': if (!fast) { for (const u of ev.us) V.fire(s, u); A.play('spring'); } break;
      case 'tick': if (!fast) { for (const u of battle.sim.uids[s]) V.hitPiece(s, u); A.play('gear'); } break;
      case 'bolt': if (!fast) { V.bolt(s, ev.col); A.play('bolt'); V.shake(0.4); if (ev.rod) popAt(s, '避雷針が受けた', 'stun'); else if (ev.us.length) popAt(s, `しびれ ${ev.us.length}つ`, 'stun'); } break;
      case 'zap': if (!fast) { for (const u of ev.us) V.hitPiece(s, u); A.play('zap'); } break;
      case 'fatigue': if (!fast && ev.a === 1) say('<b>ほころび</b>：長引いたので、両方の箱が少しずつ壊れていく。', 2600); break;
      case 'end': break;
    }
  }
  function flashHit() {
    const el = document.createElement('div');
    el.className = 'hit-flash';
    $('#bhud').appendChild(el);
    setTimeout(() => el.remove(), 400);
  }
  V.onFrame((dt) => {
    if (phase !== 'battle' || !battle || battle.finished) return;
    if (battle.paused) return;
    battle.t += dt * (battle.t < 0 ? 1 : battle.speed);
    const evs = battle.sim.events;
    while (battle.ei < evs.length && evs[battle.ei].t <= battle.t) { playEvent(evs[battle.ei], false); battle.ei++; }
    updateBars(battle.t);
    if (battle.ei >= evs.length && !battle.done) {
      battle.done = true;
      const w = battle.sim.winner;
      setTimeout(() => {
        if (w === 0 || w === 1) { V.burst(w === 0 ? 1 : 0); A.play('boom'); V.shake(0.8); }
        A.play(w === 0 ? 'win' : 'lose');
      }, 250);
      setTimeout(() => finishBattle(), 1600);
    }
  });
  function skipBattle() {
    const evs = battle.sim.events;
    while (battle.ei < evs.length) { playEvent(evs[battle.ei], true); battle.ei++; }
    battle.t = battle.sim.time + 0.2;
    updateBars(battle.t + 1);
  }
  function battleHover(e) {
    if (touch) return;
    const pk = V.pick(e.clientX, e.clientY, { sides: [0, 1] });
    const tip = ensureTip();
    if (!pk || !pk.uid) { tip.hidden = true; V.highlight(1, null); V.highlight(0, null); return; }
    const box = pk.si === 0 ? run.box : battle.E.box;
    const res = RU.resolve(box, pk.si === 0 ? run.school : battle.E.school);
    const en = res.by[pk.uid];
    if (!en) { tip.hidden = true; return; }
    tip.innerHTML = cardHTML({ id: en.p.id, st: en.st, mods: en.mods, grow: en.p.grow, enemy: pk.si === 1 });
    tip.hidden = false;
    const w = 280;
    tip.style.left = Math.min(innerWidth - w - 10, e.clientX + 18) + 'px';
    tip.style.top = Math.min(innerHeight - tip.offsetHeight - 10, Math.max(10, e.clientY - 40)) + 'px';
    V.highlight(pk.si, relMap(res, pk.uid));
  }
  function ensureTip() {
    let t = $('#tip');
    if (!t) { t = document.createElement('div'); t.id = 'tip'; t.className = 'card tipcard'; t.hidden = true; $('#app').appendChild(t); }
    return t;
  }

  function finishBattle() {
    if (!battle || battle.finished) return;
    battle.finished = true;
    const w = battle.sim.winner;
    const boss = battle.boss;
    const lines = [];
    const prevGold = run.gold;
    void prevGold;
    if (w === 0) {
      run.wins++;
      const cats = run.box.pieces.filter((p) => DEF[p.id].win).length;
      if (cats) { run.bonus = (run.bonus || 0) + 2 * cats; lines.push(['招き猫', `次の品書きで +${2 * cats}文`]); }
    } else if (w === 1) run.lives--;
    // 育つ道具
    const grown = [];
    for (const p of run.box.pieces) { const d = DEF[p.id]; if (d.grows) { const g0 = p.grow || 0; p.grow = Math.min(d.growMax, g0 + d.grows); if (p.grow > g0) grown.push(d.name); } }
    if (grown.length) lines.push(['育った', grown.join('・') + ' 威力+1']);
    run.log.push({ r: run.round, w, e: battle.E.name, t: Math.round(battle.sim.time * 10) / 10 });
    run.phase = 'result';
    SV.meta.bestWins = Math.max(SV.meta.bestWins, run.wins);
    const E = battle.E;
    run.round++;
    let kind = w === 0 ? 'win' : w === 1 ? 'lose' : 'draw';
    if (boss && w === 0) kind = 'clear';
    if (run.lives <= 0) kind = 'over';
    const r = $('#r-card');
    const stamp = { win: '勝', lose: '負', draw: '分', clear: '落', over: '終' }[kind];
    const title = { win: `${esc(E.name)}に勝った`, lose: `${esc(E.name)}に負けた`, draw: '引き分け', clear: '天守、陥落', over: '合戦おわり' }[kind];
    const sub = { win: `戦いは ${battle.sim.time.toFixed(1)}秒`, lose: '命がひとつ減った', draw: '命は減らない', clear: 'あなたの箱が、いちばん強い箱になった。', over: `${run.wins}勝で、この合戦は幕` }[kind];
    if (kind === 'clear' || kind === 'over') for (let i = lines.length - 1; i >= 0; i--) if (lines[i][0] === '招き猫') lines.splice(i, 1);
    const wl = kind === 'clear' ? `${EC.winsToBoss}勝＋天守` : `${run.wins} / ${EC.winsToBoss}${run.wins >= EC.winsToBoss && kind !== 'over' ? '（次は天守）' : ''}`;
    lines.unshift(['勝ち星', wl], ['命', `${'●'.repeat(Math.max(0, run.lives))}${'○'.repeat(EC.lives - Math.max(0, run.lives))}`]);
    let btns = '';
    if (kind === 'clear' || kind === 'over') {
      if (kind === 'clear') {
        SV.meta.clears++;
        SV.meta.best = { wins: run.wins, lives: run.lives, rounds: run.round - 1, school: run.school, at: Date.now() };
      }
      SV.meta.lastBox = { box: clone(run.box), school: run.school };
      SV.run = null;
      btns = `<button type="button" class="btn big red" data-r="title">タイトルへ</button><button type="button" class="btn big" data-r="again">もう一度</button>`;
    } else {
      btns = `<button type="button" class="btn big red" data-r="next">工房へもどる</button>`;
    }
    const note = kind === 'clear' ? (SV.meta.clears === 1 ? '新しい流派「かみなり流」がえらべるようになった。' : 'もう一度、別の流派でも。') : kind === 'over' ? 'からくり帖の「合体」をもう一度読んでみよう。' : w === 1 && !touch ? '戦いの最中、相手の道具にマウスをのせると中身が見える（スペースで一時停止）。' : '';
    r.innerHTML = `<div class="r-stamp ${kind === 'lose' || kind === 'over' ? 'lose' : kind}">${stamp}</div><h2>${title}</h2><p class="sub">${esc(sub)}</p><ul class="r-lines">${lines.map(([a, b]) => `<li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('')}</ul><div class="btns">${btns}</div>${note ? `<p class="note">${esc(note)}</p>` : ''}`;
    $('#result').hidden = false;
    A.play('stamp');
    persist(true);
  }
  $('#r-card').addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    A.play('tap');
    const k = b.dataset.r;
    $('#result').hidden = true;
    if (k === 'next') enterShop(false);
    else if (k === 'title') { run = null; showTitle(); }
    else if (k === 'again') { run = null; showSchool(); }
  });

  /* ---------------- からくり帖 ---------------- */
  let bookTab = 'items';
  function openBook(tab) {
    bookTab = tab || bookTab;
    $('#book').hidden = false;
    renderBook();
    A.play('tap');
  }
  function closeBook() { $('#book').hidden = true; A.play('tap'); }
  $('#bk-close').addEventListener('click', closeBook);
  $('#book').addEventListener('click', (e) => { if (e.target.id === 'book') closeBook(); const t = e.target.closest('[data-tab]'); if (t) { bookTab = t.dataset.tab; renderBook(); A.play('tap'); } });
  function renderBook() {
    const tabs = [['items', '道具'], ['recipes', '合体'], ['how', '遊び方'], ['log', '記録']];
    $('#bk-tabs').innerHTML = tabs.map(([k, n]) => `<button type="button" data-tab="${k}" class="${bookTab === k ? 'on' : ''}">${n}</button>`).join('');
    const B = $('#bk-body');
    if (bookTab === 'items') {
      const list = ITEMS.filter((d) => !d.only || SV.meta.found[d.id] || (d.only === 'secret' && SV.meta.seen && SV.meta.seen[d.id]));
      B.innerHTML = `<div class="bk-grid">${list.map((d) => `<div class="bk-it" style="--rc:${RAR[d.rar].color}"><img src="${V.thumb(d.id)}" alt=""><div><b>${esc(d.name)}</b> <span class="meta">${RAR[d.rar].name}・${d.cost}文・${RU.shapeOf(d.id).length}マス${d.cd ? '・' + d.cd + '秒' : ''}</span><p>${ruleHTML(d.rule || ruleShort(d))}</p></div></div>`).join('')}</div>`;
    } else if (bookTab === 'recipes') {
      B.innerHTML = `<div class="bk-grid">${RECIPES.map((r) => {
        const f = SV.meta.found[r.id];
        return `<div class="bk-it${f ? '' : ' unk'}" style="--rc:${f ? RAR[DEF[r.to].rar].color : '#aaa'}">${f ? `<img src="${V.thumb(r.to)}" alt="">` : '<div></div>'}<div><b>${f ? esc(r.title) + '　→ ' + esc(DEF[r.to].name) : '？？？'}</b><p>${f ? ruleHTML(r.text) : esc(r.hint) + '……'}</p></div></div>`;
      }).join('')}</div><p style="font-size:13px;color:#8b7662;margin-top:12px">合体は、条件どおりに積んだ瞬間に起こる。見つけた合体は、道具の説明にも出るようになる。</p>`;
    } else if (bookTab === 'how') {
      B.innerHTML = howHTML();
    } else {
      const m = SV.meta;
      const lg = SV.run ? SV.run.log : [];
      B.innerHTML = `<div class="bk-how"><h3>これまで</h3><p>合戦をはじめた回数：${m.runs}　／　天守を落とした回数：${m.clears}　／　いちばん多い勝ち星：${m.bestWins}</p><p>見つけた合体：${Object.keys(m.found).filter((k) => RECIPES.some((r) => r.id === k)).length} / ${RECIPES.length}</p>${lg.length ? `<h3>いまの合戦</h3><p>${lg.map((l) => `第${l.r}戦 ${esc(l.e)}：${l.w === 0 ? '勝ち' : l.w === 1 ? '負け' : '引き分け'}（${l.t}秒）`).join('<br>')}</p>` : ''}<p style="margin-top:14px;font-size:12.5px;color:#8b7662">遊んだ時間：${Math.round(SV.playMs / 60000)}分</p></div>`;
    }
  }
  function howHTML() {
    return `<div class="bk-how">
      <h3>ながれ</h3>
      <p>工房で<b>品書き</b>から道具を買い、<b>箱に積む</b>。準備ができたら<b>出陣</b>。箱どうしが自動で戦う。勝ち星を${EC.winsToBoss}つ集めると<b>天守</b>との合戦。命（ちょうちん）が${EC.lives}つなくなったら終わり。</p>
      <h3>積み方</h3>
      <p>道具は<b>上から落ちて</b>、下にあるものに乗る。置く前に、半透明の影が落ちる先を見せる。宙に浮いたものは、支えを抜くと落ちる。</p>
      <p>${touch ? '品書きや箱の道具を<b>ドラッグ</b>して動かす。タップすると説明と「動かす」「売る」。持っている間は「回す」「倒す」で向きを変え、箱の上をなぞって場所を決め、「置く」（同じ場所をもう一度タップでも置ける）。' : '<b>ドラッグ</b>か<b>クリック</b>で持ち、箱の上でクリックして置く。<kbd>R</kbd>かホイールで回す、<kbd>F</kbd>で倒す、<kbd>Esc</kbd>か右クリックでやめる。<kbd>Q</kbd><kbd>E</kbd>で箱を回し、<kbd>1</kbd>〜<kbd>4</kbd>で上の段を隠して中を見る（<kbd>0</kbd>で全部）。持ったまま品書きの上に落とすと売れる。'}</p>
      <h3>効果範囲</h3>
      <div class="bk-legend">
        <span><span class="rg up">↑</span>上に効く（熱は上へ）</span>
        <span><span class="rg down">↓</span>下に効く（水は下へ）</span>
        <span><span class="rg side">⇄</span>同じ段の前後左右（歯車）</span>
        <span><span class="rg adj">◇</span>となり（6方向）</span>
        <span><span class="rg col">↕</span>縦一列（上も下も）</span>
        <span><span class="rg layer">▭</span>同じ段ぜんぶ</span>
      </div>
      <p style="margin-top:8px">道具を持つと、効果範囲のマスが光り、置いたときに変わる数字が<b>緑（上がる）・赤（下がる）</b>で浮かぶ。<b>最上段</b>・<b>最下段</b>・<b>立てて置く</b>で強くなる道具もある。</p>
      <h3>高さと段そろい</h3>
      <p>道具は<b>高い段にあるほど効き目が上がる</b>（1段上がるごとに威力・盾・回復などが+${Math.round(RU.HEIGHT_STEP * 100)}%。段の番号の下に出ている）。ただし上に積むには、下に支えがいる。</p>
      <p>ひとつの段のマスが<b>全部うまる</b>と「段そろい」。その段の道具が<b>${Math.round(RU.FILL_SPD * 100)}%速く</b>なり、戦いのはじめに<b>盾（1マスにつき${RU.FILL_BLOCK}）</b>がつく。そろった段は金色の枠で光る。</p>
      <p>下の段を安い道具や支えで埋めてそろえ、その上に武器を高く積む——が基本の形。</p>
      <h3>歯車</h3>
      <p>歯車は<b>同じ段で前後左右</b>にくっつくと「歯車列」になる。列にふれた道具は、列の枚数×6%速くなる。上下に重ねただけではかみ合わない。<b>縦に立てた軸</b>や水車は、上下の段の列をつなぐ。</p>
      <h3>戦い</h3>
      <p>道具は間隔ごとに発動する（札のまわりの輪がたまると発動）。威力は相手の<b>盾</b>を先にけずる。<b>燃焼</b>は盾を無視して毎0.8秒けずり、1ずつ減る。<b>錆</b>は相手の箱ぜんぶを遅くし、<b>油</b>は自分を速くする。<b>雷</b>は相手の縦一列をしびれさせる。${RU.FATIGUE_AT}秒をこえると<b>ほころび</b>で両方けずれていく。</p>
      <h3>合体</h3>
      <p>決まった積み方をすると、道具がひとつになって強くなる。からくり帖の「合体」にヒントがある。</p>
    </div>`;
  }

  /* ---------------- ほかのタブへ移ったら、合戦を止めて音も止める ---------------- */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (A.ctx && A.ctx.state === 'running') A.ctx.suspend();
      if (battle && !battle.finished && !battle.paused && battle.t > 0) togglePause();
    } else if (A.ctx && !SV.meta.mute) A.ctx.resume();
  });

  /* ---------------- テスト用の口 ---------------- */
  G.__hk = {
    get state() { return { phase, run, hand, battle: battle && { t: battle.t, ei: battle.ei, n: battle.sim.events.length, winner: battle.sim.winner } }; },
    newRun: (s) => newRun(s || 'kamado'),
    buy(i, ax, az, rots) { takeFromShop(i, false); if (!hand) return false; for (let k = 0; k < (rots || 0); k++) rotateHand('yaw'); hand.target = { ax, az }; updateHand(); return placeHand(); },
    give(id, ax, az) { hand = { src: 'box', uid: RU.newUid(), id, rel: RU.shapeOf(id), grow: 0, orig: null, drag: false }; hand.target = { ax, az }; updateHand(); const ok = hand.drop && hand.drop.ok; if (ok) placeHand(); else endHand(); return ok; },
    go: () => tryGo(),
    skip: () => { if (battle) skipBattle(); },
    finish: () => finishBattle(),
    next: () => { $('#result').hidden = true; enterShop(false); },
    gold(n) { run.gold = n; renderAll(); },
    step: (n) => V.step(n || 60),
    rot: (d) => V.rotate(d || 1),
    slice: (k) => setSlice(k),
    hover: (uid) => hoverBox(uid),
    title: () => showTitle(),
    /* 自動で買って積む（通しの確認用） */
    auto() {
      if (phase !== 'shop') return 0;
      let n = 0;
      const c = expandCost();
      if (c != null && run.gold >= c + 6 && RU.usedCells(run.box) > RU.cellsOf(run.box) * 0.6) {
        const M = EC.maxDim, k = run.box.H < 3 ? 'H' : run.box.W <= run.box.D && run.box.W < M ? 'W' : run.box.D < M ? 'D' : 'H';
        run.gold -= c; run.expands++; run.box[k] = Math.min(M, run.box[k] + 1); V.syncBox(0, run.box);
      }
      const order = run.shop.map((s, i) => [s, i]).filter(([s]) => s).sort((a, b) => DEF[b[0].id].rar - DEF[a[0].id].rar);
      for (const [s, i] of order) {
        if (s.price > run.gold) continue;
        const bp = RU.bestPlacement(run.box, s.id, run.school, Math.random);
        if (!bp) continue;
        run.gold -= s.price; run.shop[i] = null;
        run.box.pieces.push({ uid: RU.newUid(), id: s.id, cells: bp.cells, grow: 0 });
        let r; while ((r = RU.findRecipe(run.box))) { RU.applyRecipe(run.box, r); SV.meta.found[r.rid] = 1; }
        n++;
      }
      V.syncBox(0, run.box); dirtyPow(); renderAll(); persist();
      return n;
    },
  };

  /* ---------------- 表紙の撮影用（?cover=front|back|art） ---------------- */
  function coverMode(kind) {
    document.body.classList.add('cover');
    A.setMuted(true);
    V.noSpin = true;
    phase = 'cover';
    const cr = cv.getBoundingClientRect();
    if (kind === 'back') {
      const P = RU.aiBuild(77, 7, { arch: 'fire', dims: [4, 4, 3], factor: 1.1 });
      const E = RU.aiBuild(91, 7, { arch: 'bolt', dims: [4, 4, 3], factor: 1.1 });
      run = { box: P.box, school: 'kamado' };
      V.setMode('battle');
      V.syncBox(0, P.box); V.syncBox(1, E.box);
      V.setCrest(0, '炎', '#E4582F'); V.setCrest(1, '鳴', '#7a6552');
      const sim = RU.simulate([{ hp: 240, box: P.box, school: 'kamado' }, { hp: 240, box: E.box, school: null }], 5);
      const sn = sim.snaps[Math.min(sim.snaps.length - 1, 52)];
      for (let si = 0; si < 2; si++) { const m = new Map(); sim.uids[si].forEach((u, k) => m.set(u, sn.s[si].ch[k])); V.setCharge(si, m); }
      V.setRect({ x: 0, y: cr.height * 0.06, w: cr.width, h: cr.height * 0.94 });
      const cols = E.box.pieces.map((p) => [p.cells[0][0], p.cells[0][2]]);
      setInterval(() => { V.bolt(1, cols[Math.floor(Math.random() * cols.length)]); V.crestHit(1, true); V.shoot(V.side(0).crest.getWorldPosition(new THREE.Vector3()), V.side(1).crest.getWorldPosition(new THREE.Vector3()), 0xff8a3d, 0.5); }, 280);
    } else {
      const d = RU.aiBuild(20260927, 7, { arch: 'fire', dims: [4, 4, 3], factor: 1 });
      V.syncBox(0, d.box);
      V.setMode('title');
      if (kind === 'front') {
        $('#title').hidden = false;
        V.setRect({ x: cr.width * 0.47, y: -cr.height * 0.02, w: cr.width * 0.55, h: cr.height * 1.04 });
      } else V.setRect({ x: cr.width * 0.2, y: -cr.height * 0.08, w: cr.width * 0.8, h: cr.height * 1.14 });
    }
    setTimeout(() => { V.fit(true); document.title = 'ready'; }, 900);
  }

  /* ---------------- 起動 ---------------- */
  function boot() {
    load();
    A.setMuted(SV.meta.mute);
    if (!G.THREE) { $('#nogl').hidden = false; return; }
    try {
      V.init(cv, $('#labels'));
    } catch (e) {
      $('#nogl').hidden = false;
      return;
    }
    cv.tabIndex = 0;
    V.onLand = (si, uid, imp) => { if (phase === 'shop' || phase === 'title') { A.play('drop', imp); if (imp > 4) V.dust(si, uid); } };
    const Q = new URLSearchParams(location.search);
    const go = () => {
      $('#boot').classList.add('done');
      if (Q.has('cover')) { coverMode(Q.get('cover')); return; }
      showTitle();
      setTimeout(relayout, 100);
    };
    const f = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('400 40px "Dela Gothic One"'), document.fonts.load('700 16px "Zen Kaku Gothic New"')]) : Promise.resolve();
    Promise.race([f, new Promise((r) => setTimeout(r, 2500))]).then(go, go);
  }
  boot();
})(typeof window !== 'undefined' ? window : globalThis);
