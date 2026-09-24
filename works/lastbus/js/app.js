/* =========================================================
   最終バスの車掌 — 運行・会話・乗り降り・乗務日誌
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'lastbus.v1';
  const ST = LD.STOPS, PAX = LD.PAX, P = (id) => PAX.find(p => p.id === id);
  const HINT_AT = [2, 5, 8];
  const fresh = () => ({ v: 1, playMs: 0, intro: false, stop: 0, lap: 1, delivered: {}, found: {}, boarded: {}, wrong: {}, stubs: [], goalMs: {}, peek: {}, ended: false, peeled: false, mute: false, fast: false, extra: {} });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) st = Object.assign(fresh(), r); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const W = BW.S;
  const U = { phase: 'stopped', from: 0, toIdx: 1, to: 0, v: 0, halt: null, busy: false, talk: null, line: 0, item: -1, script: null, rings: 0, ringT: 0, yawT: 0, fx: [], req: false, endDepart: false, gen: 0, kaisou: 0, lastMin: -1, tab: 'route', dots: {} };

  const allDone = () => PAX.every(p => st.delivered[p.id]);
  const onboard = (id) => { const p = P(id); if (st.delivered[id]) return false; if (p.hidden) return true; if (p.board === -2) return !!st.found.taku; if (p.board === 1) return !!st.boarded.genzo; return true; };
  const known = (id) => { const p = P(id); if (p.hidden) return !!st.found.yuko; return onboard(id) || !!st.delivered[id]; };
  function goals() {
    const g = [];
    if (!st.found.yuko && !st.ended) g.push('find');
    for (const p of PAX) if (known(p.id) && !st.delivered[p.id]) g.push(p.id);
    if (allDone() && !st.ended) g.push('final');
    return g;
  }
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- 小さな道具 ---------- */
  function tween(obj, key, to, dur, done) {
    const from = obj[key]; let t = 0;
    U.fx = U.fx.filter(f => !(f.obj === obj && f.key === key));
    U.fx.push({ obj, key, step(dt) { t += dt; const u = Math.min(1, t / dur); obj[key] = from + (to - from) * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2); if (u >= 1) { if (done) done(); return true; } return false; } });
  }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let capT = 0;
  function cap(t, hold) { const c = $('#cap'); c.textContent = t || ''; c.style.opacity = t ? 1 : 0; clearTimeout(capT); if (t && !hold) capT = setTimeout(() => { c.style.opacity = 0; }, 6500); }

  /* ---------- 顔の絵 ---------- */
  function face(look, ghost, asleep) {
    const L = look || {};
    const op = ghost ? 0.72 : 1, sk = L.skin || '#e8ccb0';
    let hair = `<path d="M30 44 Q50 18 70 44 Q70 30 50 26 Q30 30 30 44Z" fill="${L.hair}"/>`;
    if (L.long) hair += `<rect x="29" y="40" width="42" height="34" rx="8" fill="${L.hair}"/>`;
    const eyes = asleep ? `<path d="M40 52h7M53 52h7" stroke="#2a2222" stroke-width="2" stroke-linecap="round"/>` : `<circle cx="43" cy="52" r="2.4" fill="#2a2222"/><circle cx="57" cy="52" r="2.4" fill="#2a2222"/>`;
    let hat = '';
    if (L.cap) hat = `<path d="M30 40 Q50 22 70 40Z" fill="#1c1c20"/><rect x="36" y="38" width="36" height="4" rx="2" fill="#111"/><circle cx="50" cy="32" r="3" fill="#c8a45a"/>`;
    if (L.uniform) hat = `<path d="M30 40 Q50 20 70 40Z" fill="#2a3550"/><rect x="28" y="38" width="44" height="5" rx="2" fill="#1a1f2e"/><circle cx="50" cy="31" r="3" fill="#c8a45a"/>`;
    if (L.towel) hat = `<rect x="30" y="36" width="40" height="7" rx="3" fill="#f2f0ea"/>`;
    const glow = ghost ? `<ellipse cx="50" cy="70" rx="44" ry="48" fill="url(#gh)" opacity=".6"/>` : '';
    return `<svg viewBox="0 0 100 115" aria-hidden="true"><defs><radialGradient id="gh"><stop offset="0" stop-color="#8aa8e0" stop-opacity=".5"/><stop offset="1" stop-color="#8aa8e0" stop-opacity="0"/></radialGradient></defs>${glow}
      <g opacity="${op}"><path d="M14 115 Q16 80 50 76 Q84 80 86 115Z" fill="${L.body}"/><rect x="44" y="64" width="12" height="14" fill="${sk}"/>
      <ellipse cx="50" cy="50" rx="20" ry="23" fill="${sk}"/>${hair}${eyes}${hat}</g></svg>`;
  }
  const PICS = {
    icho: `<svg viewBox="0 0 240 150" width="240"><rect width="240" height="150" fill="#fbf8ee"/><path d="M110 150 L114 92 L126 92 L130 150Z" fill="#7a5a3a"/>${[...Array(18)].map((_, i) => `<circle cx="${120 + Math.cos(i * 1.7) * (20 + i * 2.2)}" cy="${62 + Math.sin(i * 1.3) * 26}" r="${16 + (i % 4) * 3}" fill="${i % 3 ? '#f2c230' : '#f6d860'}" opacity=".9"/>`).join('')}<circle cx="170" cy="118" r="7" fill="#f0d0b0"/><path d="M162 150 L166 126 L176 126 L180 150Z" fill="#8a6a9a"/><path d="M178 128 L190 114" stroke="#8a6a9a" stroke-width="4"/><path d="M30 20 L60 30" stroke="#f2c230" stroke-width="3"/><text x="16" y="142" font-size="12" fill="#c83a2a" font-family="Yomogi">おばあちゃんち</text></svg>`,
    teiki: `<svg viewBox="0 0 260 150" width="260"><rect x="4" y="4" width="252" height="142" rx="10" fill="#e8f0f4" stroke="#8aa0b0"/><text x="16" y="30" font-size="14" font-family="Zen Kaku Gothic New" font-weight="700" fill="#2a4a6a">夜ノ森交通　通勤定期券</text><text x="16" y="62" font-size="18" font-family="Zen Kaku Gothic New" font-weight="900" fill="#1a1a1a">夜ノ森駅前 ⇔ 夜ノ森</text><rect x="192" y="44" width="52" height="24" fill="#c8ccd0"/><rect x="196" y="50" width="44" height="10" fill="#b0b4b8"/><text x="16" y="94" font-size="14" font-family="Zen Kaku Gothic New" fill="#1a1a1a">1か月　10,530円</text><text x="16" y="120" font-size="12" font-family="Zen Kaku Gothic New" fill="#5a5a5a">令和8年10月31日まで　ハヤミ　様</text></svg>`,
    ticket: `<svg viewBox="0 0 260 120" width="260"><rect x="4" y="4" width="252" height="112" rx="4" fill="#d8c8a0" stroke="#8a7a5a"/><text x="16" y="28" font-size="13" font-family="Zen Old Mincho" fill="#3a2a1a">夜ノ森線　乗車券</text><text x="16" y="62" font-size="20" font-family="Zen Old Mincho" font-weight="700" fill="#1a1a1a">夜ノ森駅前 → 魚市場前</text><text x="16" y="92" font-size="13" font-family="Zen Old Mincho" fill="#3a2a1a">昭和62年10月11日　180円</text><circle cx="222" cy="86" r="16" fill="none" stroke="#b83a2a" stroke-width="2"/><text x="222" y="91" text-anchor="middle" font-size="11" fill="#b83a2a" font-family="Zen Old Mincho">入鋏</text></svg>`,
    nafuda: `<svg viewBox="0 0 220 90" width="220"><rect x="4" y="4" width="212" height="82" rx="6" fill="#f4f4f0" stroke="#3a6aa0" stroke-width="3"/><text x="16" y="32" font-size="13" font-family="Zen Kaku Gothic New" fill="#3a6aa0">夜ノ森小学校　4年2組</text><text x="16" y="70" font-size="30" font-family="Zen Kaku Gothic New" font-weight="900" fill="#1a1a1a">タクト</text></svg>`,
    fog: `<svg viewBox="0 0 200 200" width="200"><rect width="200" height="200" fill="#9aa8b8"/><rect width="200" height="200" fill="#dfe6ee" opacity=".7"/><g stroke="#3a4a60" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M50 90 L100 40 L150 90"/><path d="M62 90 V160 M138 90 V160"/><path d="M80 138 Q80 104 100 104 Q120 104 120 138 Z"/><path d="M36 166 H164"/></g><circle cx="100" cy="146" r="5" fill="#3a4a60"/></svg>`,
  };

  /* ---------- 運賃表示器 ---------- */
  function clockMin() {
    if (U.phase === 'moving' && !U.kaisou) {
      const a = ST[U.from], b = ST[U.toIdx], xa = a.x, xb = b.x;
      if (xa === xb) return b.t + LD.DELAY;
      const u = Math.max(0, Math.min(1, (W.s - xa) / (xb - xa)));
      return Math.round(a.t + (b.t - a.t) * u) + LD.DELAY;
    }
    return ST[st.stop].t + LD.DELAY;
  }
  function led() {
    const moving = U.phase === 'moving', i = moving ? U.toIdx : st.stop;
    const name = U.kaisou ? '回送' : ST[i].name;
    $('#led-k').textContent = U.kaisou ? '' : moving ? 'つぎは' : 'ここは';
    $('#led-n').textContent = name;
    const m = clockMin(); $('#led-c').textContent = U.kaisou ? '--:--' : `0:${pad(m)}`;
    $('#led-f').innerHTML = ST.map((s, k) => { const f = LD.fare(k + 1, i); return `<span class="${f == null ? 'cur' : ''}"><i>${k + 1}</i>${f == null ? '---' : f}</span>`; }).join('');
    BW.drawLed([(moving ? 'つぎは ' : '') + name, U.kaisou ? '' : `0:${pad(m)}　約5分遅れ`]);
    if (m !== U.lastMin) { U.lastMin = m; BW.setClock(m); }
    BW.drawRoute(moving ? U.toIdx : st.stop, st.peeled);
  }

  /* ---------- 状態 ---------- */
  function renderState() {
    const s = $('#state');
    if (st.ended) { s.innerHTML = `<b>終点・車庫前</b><span class="st-s">夜が明けた。</span>`; return; }
    if (U.phase === 'moving') s.innerHTML = U.kaisou ? `<b>回送中</b><span class="st-s">駅前へもどる</span>` : `<b>走行中</b><span class="st-s">つぎは ${ST[U.toIdx].name}${U.halt != null && U.halted ? '　（踏切で一時停止）' : ''}</span>`;
    else s.innerHTML = `<b>停車中　${ST[st.stop].name}</b><span class="st-s">${st.stop + 1}番目の停留所・${st.lap}周目　合図ひも2回で発車</span>`;
  }

  /* ---------- 乗客の一覧 ---------- */
  function tagOf(p) {
    if (st.delivered[p.id]) return `${ST[p.dest].name}で降車`;
    if (st.wrong[p.id] === st.lap) return 'この一周は降りない';
    if (p.hidden) return '窓にうつる';
    if (p.asleep) return '眠っている';
    if (p.silent) return 'なにも言わない';
    return '乗車中';
  }
  let seatNew = '';
  function renderSeats() {
    const list = PAX.filter(p => known(p.id)).sort((a, b) => a.seat - b.seat);
    $('#seats').innerHTML = `<h3>乗客</h3>` + list.map(p => `<button type="button" class="pax ${st.delivered[p.id] ? 'gone' : ''} ${U.talk === p.id ? 'on' : ''} ${seatNew === p.id ? 'new' : ''}" data-pax="${p.id}"><span class="p-face">${face(p.look, !p.alive, p.asleep)}</span><span><span class="p-n">${p.name}</span><span class="p-s">${p.age || '　'}</span></span><span class="p-tag">${tagOf(p)}</span></button>`).join('')
      + (list.length < 6 && !st.ended ? `<p class="st-s" style="color:var(--sub);font-size:12px;margin:2px 4px">${list.length}人。……ほかにも、だれか乗っている気がする。</p>` : '');
    seatNew = '';
  }

  /* ---------- 会話 ---------- */
  function openTalk(id) { if (U.script) return; U.talk = id; U.line = 0; U.item = -1; W.hover = id; BA.sfx('tap'); renderTalk(); renderSeats(); }
  function closeTalk() { U.talk = null; U.item = -1; W.hover = null; $('#talk').hidden = true; $('#view').classList.remove('talking'); renderSeats(); }
  function canAlight(id) { return U.phase === 'stopped' && !U.busy && onboard(id) && st.wrong[id] !== st.lap && !st.ended && st.stop !== 8; }
  function renderTalk() {
    const T = $('#talk');
    $('#view').classList.toggle('talking', !!(U.script || U.talk));
    if (U.script) {
      const [n, text, look, ghost] = U.script.lines[U.script.i];
      T.innerHTML = `<div class="t-face">${look ? face(look, ghost) : ''}</div><div class="t-name">${n}</div><p class="t-line">${text}</p><div class="t-b"><button type="button" data-t="next" class="go">${U.script.i < U.script.lines.length - 1 ? 'つぎ' : (U.script.last || 'とじる')}</button></div>`;
      T.hidden = false; return;
    }
    const id = U.talk; if (!id) { T.hidden = true; return; }
    const p = P(id);
    const line = p.lines[U.line % p.lines.length];
    const items = p.items.map((it, k) => `<button type="button" data-it="${k}" class="${U.item === k ? 'on' : ''}">${it.n}</button>`).join('');
    const it = U.item >= 0 ? p.items[U.item] : null;
    const ok = canAlight(id);
    const note = st.delivered[id] ? `${ST[p.dest].name}で降りた。` : st.wrong[id] === st.lap ? '（この一周は、もう降りてくれない）' : U.phase === 'moving' ? '（停車中なら「ここで降ろす」を選べる）' : '';
    T.innerHTML = `<div class="t-face">${face(p.look, !p.alive, p.asleep)}</div>
      <div class="t-name">${p.name}<small>${p.age || ''}</small></div>
      <div><p class="t-line">${line}</p><div class="t-items">${items}</div>${it ? `<div class="t-item">${it.d}${it.pic ? PICS[it.pic] : ''}</div>` : ''}
      <div class="t-b"><button type="button" data-t="next">${p.lines.length > 1 ? '話を聞く' : '……'}</button><button type="button" data-t="off" class="go" ${ok ? '' : 'disabled'}>ここで降ろす</button><button type="button" data-t="close">とじる</button></div>
      ${note ? `<p class="t-note">${note}</p>` : ''}</div>`;
    T.hidden = false;
  }
  function script(lines, last) { return new Promise(res => { closeTalk(); U.script = { lines, i: 0, res, last }; renderTalk(); }); }

  /* ---------- 降ろす ---------- */
  const BYE_POS = {
    kana: (x) => ({ to: [x + 0.45, -4.4], dur: 2.6, face: 0.6, flag: 'kana' }),
    tome: (x) => ({ to: [x + 0.25, -7.2], dur: 5.0, face: Math.PI, flag: 'tome' }),
    hayami: (x) => ({ to: [x - 0.45, -4.6], dur: 2.4, face: -0.8, flag: 'hayami' }),
    genzo: (x) => ({ to: [x + 1.2, -5.8], dur: 3.4, fadeAt: 3.6, flag: 'boat' }),
    yuko: (x) => ({ to: [x + 0.1, -4.4], dur: 2.8, face: 0.2, fadeAt: 6.5, flag: 'yukoMan' }),
    taku: (x) => ({ to: [x + 0.8, -5.6], dur: 2.2, face: 0.3, fadeAt: 3.0, flag: 'taku' }),
  };
  async function alight(id) {
    if (!canAlight(id)) return;
    const p = P(id), here = st.stop;
    if (p.dest !== here) {
      st.wrong[id] = st.lap; save(); BA.sfx('no');
      cap(`${p.name}：「${p.wrong.replace(/^「|」$/g, '')}」`); renderTalk(); renderSeats();
      return;
    }
    U.busy = true; closeTalk();
    const g = ++U.gen;
    const b = BYE_POS[id](ST[here].x);
    if (p.hidden) tween(W, 'refl', 0, 1.2); else tween(W.pax[id], 'a', 0, 1.0);
    if (id === 'taku') { W.bell = 1; BA.sfx('kan'); tween(W, 'bell', 0, 3.5); }
    if (b.flag) tween(W, b.flag, 1, 1.6);
    await wait(700);
    BW.walkOut(id, ST[here].x, b.to, { dur: b.dur, face: b.face, fadeAt: b.fadeAt });
    for (const line of p.bye) { if (g !== U.gen) return; cap(line, true); await wait(2600); }
    st.delivered[id] = true; st.stubs.push(id); delete st.wrong[id]; save();
    BA.sfx('pickup');
    cap(`整理券を受けとった。……${p.stub}　うらに、鉛筆で一文字。`);
    U.dots.bag = true; U.busy = false;
    renderSeats(); renderTabs(); renderState();
    if (allDone()) { await wait(3500); cap('6枚目の整理券。うらの文字を、降りた順に並べてみる。'); U.dots.bag = true; U.dots.log = true; renderTabs(); }
  }

  /* ---------- 走る ---------- */
  function depart() {
    if (U.phase !== 'stopped' || U.busy || st.ended) return;
    if (st.stop === 8 && allDone() && !U.endDepart) return;
    closeTalk();
    const i = st.stop;
    BA.sfx('door'); tween(W, 'door', 0, 0.9);
    ['kana', 'tome', 'hayami', 'yukoMan', 'boat', 'taku'].forEach(f => { if (W[f] > 0) setTimeout(() => tween(W, f, 0, 2), 6000); });
    setTimeout(() => {
      U.phase = 'moving'; U.from = i; U.halt = null; U.halted = false; U.kaisou = 0;
      if (i === 9) { U.kaisou = 1; U.toIdx = 0; U.to = ST[9].x + 38; }
      else { U.toIdx = i === 7 ? (U.req ? 8 : 9) : i + 1; U.to = ST[U.toIdx].x; }
      if (i === 1) U.halt = BW.FX().crossX - 7.5;
      U.legT = 0; U.legCap = false; U.req = false;
      if (U.endDepart) { tween(W, 'dawn', 1, 14); BA.sfx('dawn'); }
      BA.sfx('chime');
      cap(U.kaisou ? '「回送」。' : `つぎは、${ST[U.toIdx].name}です。`);
      led(); renderState(); renderTalk();
    }, 900);
  }
  function arrive(i) {
    U.phase = 'stopped'; U.v = 0; W.speed = 0; W.stopReq = 0; $('#cord').classList.remove('req');
    st.stop = i; save();
    BA.sfx('brake'); setTimeout(() => { BA.sfx('door'); tween(W, 'door', 1, 0.9); }, 400);
    led(); renderState(); renderTalk(); renderSeats();
    if (i === 8) { hoshimi(); return; }
    if (i === 9 && U.endDepart) { finale(); return; }
    let c = ST[i].cap;
    if (i === 0 && st.lap > 1) c = '駅前。……時計が、また0時17分をさしている。';
    cap(c);
    if (i === 1 && !st.boarded.genzo && !st.delivered.genzo) {
      setTimeout(() => { st.boarded.genzo = true; save(); W.pax.genzo = { a: 0 }; tween(W.pax.genzo, 'a', 1, 1.2); seatNew = 'genzo'; cap('古い長靴のおじいさんが、乗ってきた。潮のにおいがする。'); renderSeats(); }, 1800);
    }
  }
  async function hoshimi() {
    if (!allDone()) { cap('……だれもいない。ベンチの上に、しおれた花が一輪。'); return; }
    U.busy = true;
    const cl = { body: '#2a3550', skin: '#ecd4c0', hair: '#4a3a34', uniform: true };
    cap('古いバス停の下に、車掌の制服を着た女の人が立っている。', true);
    await wait(2200);
    await script([['女の人', 'あら。今夜は、車掌さんがいるのね。', cl, true], ['女の人', '十七年、ここで待っていたの。この停留所がなくなった日の、最終便を。', cl, true]]);
    tween(W, 'chiyo', 0, 1.6); await wait(1300); tween(W, 'chiyoIn', 1, 1.4); await wait(1400);
    await script([
      ['運転手', '……千代。', { body: '#2a3550', skin: '#d8b89a', hair: '#bcbcbc', uniform: true }, false],
      ['千代', 'おそいわよ、あなた。', cl, true],
      ['千代', '整理券、ちゃんと集めてくれたのね。うらの字は、わたしが書いたの。乗りおくれたお客さんに、一枚ずつ。', cl, true],
      ['千代', 'わたしの時代はね、車掌がいたの。あの人が運転して、わたしが合図して。', cl, true],
      ['千代', 'さあ。最後の合図は、あなたが。', cl, true],
    ], 'はい');
    U.busy = false; U.endDepart = true; st.extra.chiyo = 1; save();
    cap('合図ひもを、2回。', true);
  }
  async function finale() {
    U.busy = true;
    cap('空が、白んできた。', true); await wait(2400);
    $('#led-k').textContent = ''; $('#led-n').textContent = 'ご乗車ありがとうございました'; BW.drawLed(['ご乗車ありがとうございました', '']);
    await wait(2600);
    const cl = { body: '#2a3550', skin: '#ecd4c0', hair: '#4a3a34', uniform: true };
    await script([['千代', 'ありがとう。今夜の車掌さん。', cl, true], ['千代', 'またいつか、乗りおくれた夜に。', cl, true]], 'おりる');
    $('#fade').classList.add('on'); await wait(1500);
    st.ended = true; st.stop = 9; save();
    tween(W, 'chiyoIn', 0, 0.1);
    modal(`<div class="mbox end"><h2>朝</h2>
      <p>……気がつくと、車庫前のバス停に、ひとりで立っていた。</p>
      <p>さびた標識。始発までは、まだ少しある。車庫のシャッターは、しまったままだ。</p>
      <p>手のひらに、整理券が一枚。番号のところに、星のかたちの穴があいている。</p>
      <p style="text-align:center;margin-top:18px;font-weight:900">最終バスの車掌　おしまい</p>
      <div class="mb"><button type="button" data-m="close">とじる</button></div></div>`, () => { $('#fade').classList.remove('on'); U.busy = false; renderAll(); cap('夜ノ森線は、もう走っていない。……たぶん。'); });
  }

  /* ---------- 合図ひも ---------- */
  function ring() {
    BA.init(); BA.sfx('bell');
    const c = $('#cord'); c.classList.add('pull'); setTimeout(() => c.classList.remove('pull'), 150);
    U.rings++; clearTimeout(U.ringT);
    U.ringT = setTimeout(() => { const n = U.rings; U.rings = 0; signal(n); }, 850);
  }
  function signal(n) {
    if (st.ended) { cap('バスは、もう来ない。'); return; }
    if (n >= 3) { W.mirror = 1; BA.sfx('honk'); st.extra.mirror = 1; save(); cap('ルームミラーごしに、運転手がじろりとこちらを見た。……合図は、ていねいに。'); setTimeout(() => { W.mirror = 0; }, 3500); return; }
    if (U.busy || U.script) return;
    if (n === 2) { if (U.phase === 'stopped') depart(); else cap('（もう走っている）'); return; }
    if (U.phase === 'stopped') {
      if (st.stop === 7) { U.req = true; W.stopReq = 1; $('#cord').classList.add('req'); cap('「つぎ、止めてください」……運転手が、帽子のつばに手をやった。'); }
      else cap('（もう止まっている。発車は2回）');
      return;
    }
    if (U.from === 7 && U.toIdx === 9 && W.s < ST[8].x - 7) {
      U.toIdx = 8; U.to = ST[8].x; W.stopReq = 1; $('#cord').classList.add('req');
      cap('「つぎ、止めてください」……名前のないバス停の前で、バスがゆっくり速度を落とす。'); led(); renderState();
    } else cap('（つぎの停留所には、どのみち止まる）');
  }

  /* ---------- 毎フレーム ---------- */
  function tick(dt) {
    U.fx = U.fx.filter(f => !f.step(dt));
    W.yaw += (U.yawT - W.yaw) * Math.min(1, dt * 4);
    if (U.phase === 'moving' && !U.halted) {
      const tgt = U.halt != null ? U.halt : U.to;
      const rem = tgt - W.s, vmax = st.fast ? 22 : 9, brake = st.fast ? 6 : 3.2, accel = st.fast ? 5 : 2.2;
      const vt = Math.min(vmax, Math.sqrt(Math.max(0, 2 * brake * rem)));
      const prev = U.v;
      U.v = vt > U.v ? Math.min(vt, U.v + accel * dt) : vt;
      W.s += U.v * dt; W.speed = U.v; W.acc = (U.v - prev) / Math.max(dt, 1e-3) * 0.15;
      U.legT += dt;
      legEvents();
      if (rem < 0.05 && U.v < 0.35) {
        W.s = tgt; U.v = 0; W.speed = 0;
        if (U.halt != null) crossing();
        else if (U.kaisou === 1) kaisouTurn();
        else arrive(U.toIdx);
      }
      if (Math.floor(U.legT * 2) !== Math.floor((U.legT - dt) * 2)) led();
    } else { W.acc *= 0.9; }
    // 星見坂で待つ人
    const near = Math.abs(W.s - ST[8].x) < 70;
    if (allDone() && !st.ended && !st.extra.chiyo && near && !U.busy) W.chiyo = Math.min(1, W.chiyo + dt * 0.6);
    else if (!U.busy && !st.extra.chiyo) W.chiyo = Math.max(0, W.chiyo - dt);
    const tn = BW.FX().tunnel || [0, 0];
    BA.drive(U.v / 9, W.s > tn[0] && W.s < tn[1], W.s > ST[7].x - 20 && W.s < ST[9].x - 10);
    BA.bugsOn(U.phase === 'stopped' && [2, 4, 5, 8].includes(st.stop));
  }
  function legEvents() {
    const FX = BW.FX(), s = W.s;
    if (!U.legCap && U.legT > 2.6) { U.legCap = true; const L = LD.LEGS[U.from]; if (L && L.kind !== 'crossing' && !U.kaisou) cap(L.cap); }
    const hitAt = (x) => (U.lastS || 0) < x && s >= x;
    if (FX.bridge && (hitAt(FX.bridge - 7) || hitAt(FX.bridge + 7))) { W.bump = 1; BA.sfx('bump'); }
    const bb = ST[4].x + 35; for (const k of [-16, -8, 0, 8, 16]) if (hitAt(bb + k)) { W.bump = 0.6; BA.sfx('bump'); }
    if (hitAt(ST[8].x - 30) && U.toIdx === 9 && !U.kaisou) cap(allDone() ? '道ばたの、名前の消えたバス停に……だれか、立っている。' : '道ばたに、名前の消えたバス停がひとつ。');
    U.lastS = s;
  }
  function crossing() {
    U.halted = true; renderState();
    const g = U.gen;
    W.cross = 1; BA.crossing(true); cap(LD.LEGS[1].cap, true);
    setTimeout(() => { BA.sfx('train'); tween(W, 'train', 0, 0); W.train = 0; tween(W, 'train', 1, st.fast ? 2.2 : 3.4, () => { W.train = -1; }); }, 700);
    setTimeout(() => { W.cross = 0; BA.crossing(false); cap(''); }, st.fast ? 3400 : 4600);
    setTimeout(() => { U.halt = null; U.halted = false; renderState(); }, st.fast ? 4000 : 5400);
  }
  function kaisouTurn() {
    U.halted = true; $('#fade').classList.add('on');
    setTimeout(() => {
      W.s = -40; st.lap++; st.wrong = {}; save();
      U.kaisou = 2; U.from = 0; U.toIdx = 0; U.to = ST[0].x;
      $('#fade').classList.remove('on');
      setTimeout(() => { U.halted = false; U.kaisou = 0; U.from = 0; led(); }, 700);
    }, 1400);
  }

  /* ---------- 道具 ---------- */
  const TABS = [['route', '路線図'], ['time', '時刻表'], ['notice', '車内掲示'], ['rules', '車掌心得'], ['log', '乗務日誌'], ['bag', '車掌かばん']];
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, n]) => `<button type="button" data-tab="${k}" class="${U.tab === k ? 'on' : ''}">${n}${U.dots[k] && U.tab !== k ? '<span class="dot"></span>' : ''}</button>`).join('');
    const b = $('#tabbody');
    if (U.tab === 'route') {
      b.innerHTML = `<h4>夜ノ森循環　路線図</h4><div class="route">${ST.map((s, i) => `<div class="r-s ${(U.phase === 'stopped' ? st.stop : U.toIdx) === i ? 'cur' : ''} ${s.gone ? 'gone' : ''}"><i></i><span>${s.gone && !st.peeled ? '　' : s.name}</span><span class="r-n">${s.gone && !st.peeled ? '' : (i + 1)}</span>${s.gone && !st.peeled ? '<button type="button" class="sticker" data-peel aria-label="白いシール"></button>' : ''}</div>`).join('')}</div>`
        + `<p class="sub">赤い丸が、いまの場所（停車中）か、つぎの停留所（走行中）。車庫前のあとは、回送で駅前にもどる。</p>`;
    } else if (U.tab === 'time') {
      b.innerHTML = `<h4>時刻表　最終便（夜ノ森循環）</h4><table>${ST.map((s, i) => `<tr><th>${i + 1}</th><td class="${s.gone ? 'gone' : ''}">${s.name}</td><td class="${s.gone ? 'gone' : ''}">0:${pad(s.t)}</td></tr>`).join('')}</table><p class="sub">※星見坂は、平成21年3月をもって廃止しました。<br>※道路状況により、遅れることがあります。</p>`;
    } else if (U.tab === 'notice') {
      b.innerHTML = LD.NOTICES.map(n => `<div class="notice"><h4>${n.t}</h4>${n.rows ? `<table>${n.rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>` : `<p>${n.text}</p>`}</div>`).join('');
    } else if (U.tab === 'rules') {
      b.innerHTML = `<h4>車掌心得</h4><ol class="rules">${LD.RULES.map(r => `<li>${r}</li>`).join('')}</ol>
        <div class="help">乗客を押すと、話ができる（映像の中の人や、下の一覧から）。停車中に「ここで降ろす」。<br>映像はドラッグか ◀ ▶ で、車内を見まわせる。前には運転席、うしろには最後部の席。<br>スペースキーでも、合図ひもを引ける。</div>`;
    } else if (U.tab === 'log') {
      U.dots.log = false;
      const gs = goals();
      b.innerHTML = `<div class="log"><div class="lg-h">乗務日誌　昭和五十八年　車掌 辻千代（前の車掌の、古いノート。ページのあいだに、書きこみがはさまっている）</div>`
        + (gs.length ? gs.map(g => {
          const G = LD.GOALS[g], p = P(g), title = G ? G.t : `${p.name}さん`, hs = G ? G.hints : p.hints;
          const ms = st.goalMs[g] || 0, peek = st.peek[g] || 0;
          return `<div class="lg-g"><b>${title}</b>${hs.map((h, k) => {
            const open = ms >= HINT_AT[k] * 60000;
            if (!open) return `<span class="lg-e lock">ページがくっついている（あと${Math.max(1, Math.ceil((HINT_AT[k] * 60000 - ms) / 60000))}分）</span>`;
            if (peek > k) return `<span class="lg-e">${k === 2 ? 'こたえ：' : ''}${h}</span>`;
            return `<button type="button" class="lg-e" data-peek="${g}" data-k="${k}">${k === 2 ? 'こたえのページ' : 'めくる'}</button>`;
          }).join('')}</div>`;
        }).join('') : '<p>……今夜の書きこみは、もうない。</p>') + `</div>`;
    } else if (U.tab === 'bag') {
      U.dots.bag = false;
      const order = PAX.slice().sort((a, b) => a.dest - b.dest);
      b.innerHTML = `<h4>車掌かばん</h4><p class="sub">降りたお客さまから受けとった整理券。押すと、うらを見る（降りた停留所の順）。</p>`
        + `<div class="bag">${order.map(p => st.delivered[p.id] ? `<button type="button" class="stub have ${U.flip && U.flip[p.id] ? 'flip' : ''}" data-flip="${p.id}">${U.flip && U.flip[p.id] ? `<span class="sb-l">${p.letter}</span>` : `<span><span class="sb-n">${p.board === 1 ? 2 : 1}</span><br>${ST[p.dest].name}</span>`}</button>` : `<div class="stub">？</div>`).join('')}</div>`
        + (allDone() ? `<div class="bag-word">${order.map(p => p.letter).join('')}</div>` : '')
        + `<p class="sub" style="margin-top:10px">${order.filter(p => st.delivered[p.id]).map(p => `${p.name}：${p.stub}`).join('<br>')}</p>`
        + (st.ended ? `<div class="mb"><button type="button" data-reset>最初から乗る</button></div>` : '');
    }
  }

  /* ---------- 箱 ---------- */
  let mgen = 0;
  function modal(html, cb) {
    const m = $('#modal'), my = ++mgen; m.innerHTML = html; m.hidden = false;
    const b = m.querySelector('.mb button:last-child'); if (b) setTimeout(() => b.focus(), 30);
    m.onclick = (e) => { const bt = e.target.closest('[data-m]'); if (!bt) return; BA.init(); BA.sfx('tap'); const r = cb ? cb(bt.dataset.m) : undefined; if (r === false) return; if (mgen === my) { m.hidden = true; m.innerHTML = ''; } };
  }
  function intro() {
    modal(`<div class="mbox flyer"><h2>車掌募集</h2><p class="fl-b">一夜かぎり</p><dl><dt>路線</dt><dd>夜ノ森循環　最終便</dd><dt>発車</dt><dd>夜ノ森駅前　0時12分</dd><dt>仕事</dt><dd>お客さまを、正しい停留所で降ろすこと</dd><dt>資格</dt><dd>問いません。制服・かばん貸与</dd></dl><p style="text-align:center;font-size:12px;color:#6a6254">駅の掲示板に、画びょうで一枚だけ。</p><div class="mb"><button type="button" data-m="ok">引き受ける</button></div></div>`, () => {
      setTimeout(() => modal(`<div class="mbox"><p>0時17分。約5分おくれて、バスが来た。</p><p>行先表示は「夜ノ森循環　最終」。</p><p>運転手は、ふり返らずに、帽子のつばに手をやった。運転席のうしろに、古い車掌かばんが掛けてある。</p><div class="mb"><button type="button" data-m="ok">乗る</button></div></div>`, () => {
        BA.init();
        setTimeout(() => modal(`<div class="mbox ticket"><h2 style="margin:0 0 8px">車掌心得</h2><ol class="rules">${LD.RULES.map(r => `<li>${r}</li>`).join('')}</ol><p style="font-size:13px;margin-top:10px">乗客を押すと、話ができる。映像はドラッグで見まわせる。</p><div class="mb"><button type="button" data-m="ok">かばんを肩にかける</button></div></div>`, () => {
          st.intro = true; save(); U.tab = 'rules'; renderAll();
          cap('夜ノ森駅前。乗客は3人。……合図ひもを2回引けば、発車。', true);
        }), 150);
      }), 150);
    });
  }

  /* ---------- まとめて描く ---------- */
  function syncWorld() {
    for (const p of PAX) { if (!W.pax[p.id]) W.pax[p.id] = { a: 0 }; if (!U.busy) W.pax[p.id].a = !p.hidden && onboard(p.id) ? 1 : 0; }
    W.refl = onboard('yuko') && !st.ended ? 1 : 0;
    W.fog = st.found.taku && !st.delivered.taku ? 1 : (st.delivered.taku ? 0.4 : 0);
    W.chiyoIn = st.extra.chiyo && !st.ended ? 1 : 0;
    W.dawn = st.ended ? 1 : (st.extra.chiyo && U.endDepart ? W.dawn : 0);
    BW.drawRoute(U.phase === 'stopped' ? st.stop : U.toIdx, st.peeled);
  }
  function renderAll() { renderState(); renderSeats(); renderTabs(); renderTalk(); led(); $('#fast').textContent = st.fast ? '早送り：入' : '早送り：切'; $('#snd').textContent = st.mute ? '音：切' : '音：入'; }

  /* ---------- 操作 ---------- */
  $('#cord').addEventListener('click', ring);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); ring(); }
    if (e.key === 'ArrowLeft') U.yawT = Math.max(-0.95, U.yawT - 0.35);
    if (e.key === 'ArrowRight') U.yawT = Math.min(0.95, U.yawT + 0.35);
  });
  $('#look-l').addEventListener('click', () => { U.yawT = Math.max(-0.95, U.yawT - 0.45); });
  $('#look-r').addEventListener('click', () => { U.yawT = Math.min(0.95, U.yawT + 0.45); });
  $('#look-c').addEventListener('click', () => { U.yawT = 0; });
  $('#fast').addEventListener('click', () => { st.fast = !st.fast; save(); renderAll(); });
  $('#snd').addEventListener('click', () => { st.mute = !st.mute; BA.init(); BA.mute(st.mute); save(); renderAll(); });
  $('#seats').addEventListener('click', (e) => { const b = e.target.closest('[data-pax]'); if (!b) return; BA.init(); if (st.delivered[b.dataset.pax]) { openTalk(b.dataset.pax); return; } openTalk(b.dataset.pax); });
  $('#talk').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; BA.init();
    if (U.script) { if (b.dataset.t === 'next') { BA.sfx('tap'); if (U.script.i < U.script.lines.length - 1) { U.script.i++; renderTalk(); } else { const r = U.script.res; U.script = null; $('#talk').hidden = true; $('#view').classList.remove('talking'); r(); } } return; }
    if (b.dataset.it != null) { const k = +b.dataset.it; U.item = U.item === k ? -1 : k; BA.sfx('page'); renderTalk(); return; }
    if (b.dataset.t === 'next') { U.line++; BA.sfx('tap'); renderTalk(); }
    if (b.dataset.t === 'close') closeTalk();
    if (b.dataset.t === 'off') alight(U.talk);
  });
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; U.tab = b.dataset.tab; BA.init(); BA.sfx('page'); renderTabs(); });
  $('#tabbody').addEventListener('click', (e) => {
    const pk = e.target.closest('[data-peek]'); if (pk) { st.peek[pk.dataset.peek] = Math.max(st.peek[pk.dataset.peek] || 0, +pk.dataset.k + 1); save(); BA.sfx('page'); renderTabs(); return; }
    const fl = e.target.closest('[data-flip]'); if (fl) { U.flip = U.flip || {}; U.flip[fl.dataset.flip] = !U.flip[fl.dataset.flip]; BA.sfx('tap'); renderTabs(); return; }
    if (e.target.closest('[data-peel]')) { peel(); return; }
    if (e.target.closest('[data-reset]')) { localStorage.removeItem(KEY); location.reload(); }
  });
  function peel() { if (st.peeled) return; st.peeled = true; save(); BA.sfx('page'); cap('路線図の白いシールを、そっとはがした。下に、小さく「星見坂」。'); syncWorld(); renderTabs(); }
  const cv = $('#cv');
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: U.yawT, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) U.yawT = Math.max(-0.95, Math.min(0.95, drag.yaw - dx / cv.clientWidth * 1.8)); return; }
    if (e.pointerType !== 'mouse') return;
    const p = BW.pick(e.clientX, e.clientY), tip = $('#tip');
    cv.classList.toggle('hot', !!p);
    const names = { refl: '窓にうつる人', fog: 'くもった窓', mirror: 'ルームミラー', sticker: '路線図の白いシール' };
    if (p) { const r = cv.getBoundingClientRect(); tip.textContent = p.kind === 'pax' ? P(p.id).name : names[p.kind] || ''; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.hidden = !tip.textContent; if (!U.talk) W.hover = p.kind === 'pax' ? p.id : null; }
    else { tip.hidden = true; if (!U.talk) W.hover = null; }
  });
  cv.addEventListener('pointerup', (e) => {
    const d = drag; drag = null; if (!d || d.moved) return;
    BA.init();
    const p = BW.pick(e.clientX, e.clientY); if (!p) return;
    if (p.kind === 'pax') openTalk(p.id);
    else if (p.kind === 'refl') { if (!st.found.yuko) { st.found.yuko = true; save(); seatNew = 'yuko'; cap('窓にうつった女の人と、目が合った。……向かいの席には、だれもいない。'); } openTalk('yuko'); }
    else if (p.kind === 'fog') { if (st.found.taku) { openTalk('taku'); U.item = 1; renderTalk(); } }
    else if (p.kind === 'mirror') { W.mirror = 1; st.extra.mirror = 1; save(); cap('ルームミラーに、運転手の目がうつっている。……前を見たまま、少しだけ笑った気がした。'); setTimeout(() => { W.mirror = 0; }, 3000); }
    else if (p.kind === 'sticker') peel();
  });
  cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; if (!U.talk) W.hover = null; });

  /* 遊んだ時間（見えているあいだだけ、5秒ずつ） */
  setInterval(() => {
    if (document.hidden || !st.intro || st.ended) return;
    st.playMs += 5000;
    let newly = false;
    for (const g of goals()) { const before = st.goalMs[g] || 0; st.goalMs[g] = before + 5000; if (HINT_AT.some(m => before < m * 60000 && st.goalMs[g] >= m * 60000)) newly = true; }
    if (newly) U.dots.log = true;
    save(); renderTabs();
  }, 5000);
  document.addEventListener('visibilitychange', () => BA.suspend(document.hidden));

  /* タクトは、最初の発車のあとに現れる */
  const appearTaku = () => { if (st.found.taku || U.phase !== 'moving' || U.from !== 0 || U.legT < 3) return; st.found.taku = true; save(); W.pax.taku = { a: 0 }; tween(W.pax.taku, 'a', 1, 2.5); W.fog = 0; tween(W, 'fog', 1, 9); seatNew = 'taku'; cap('……いつのまにか、いちばんうしろの席に、学生帽の男の子が座っている。', true); setTimeout(() => cap(''), 6000); renderSeats(); };

  /* ---------- 起動 ---------- */
  let last = performance.now();
  function frame(now) { requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; tick(dt); appearTaku(); }
  const start = () => {
    if (/[?&]flat(&|$)/.test(location.search)) window.THREE = undefined;   // 2Dで遊ぶ（確認用）
    BW.init(cv);
    if (st.stop === 8) st.stop = 7;
    W.s = st.ended ? ST[9].x : ST[st.stop].x; W.door = st.ended ? 0 : 1;
    syncWorld(); renderAll();
    requestAnimationFrame(frame);
    BA.mute(st.mute);
    if (!st.intro) intro();
    else if (st.ended) cap('夜ノ森線は、もう走っていない。……たぶん。');
    else cap(`${ST[st.stop].name}。停車中。`);
    try { console.log('%c夜ノ森交通%c\n合図は、1回で止めて、2回で発車。……3回は、運転手に怒られる。', 'font:700 14px sans-serif;color:#ff8a1a', 'color:#8a93a6'); } catch (e) { }
  };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(2500)]) : wait(0)).then(start);
  window.__lb = {
    st: () => st, U, W, ring, depart, alight, openTalk, peel,
    fly(max) { let n = 0; while (U.phase === 'moving' && n++ < (max || 4000)) { tick(1 / 30); appearTaku(); } BW._step(2); return U.phase + ':' + st.stop; },
    step(n) { for (let i = 0; i < (n || 1); i++) { tick(1 / 30); appearTaku(); } BW._step(1); },
    go(i) { st.stop = i; W.s = ST[i].x; U.phase = 'stopped'; W.door = 1; save(); renderAll(); },
  };
})();
