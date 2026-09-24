/* =========================================================
   告知事項あり — 進行（予約 → オンライン内見 → 告知）
   ========================================================= */
(() => {
  const KEY = 'kokuchi.v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const HINT_AT = [2, 5, 8].map(m => m * 60000);

  /* ---------- 記録 ---------- */
  const fresh = () => ({ v: 1, playMs: 0, name: '', weak: false, mute: false, fast: false, stage: 0, sm: {}, f: {}, docs: { jusetsu: false, ledger: false }, ends: [], ending: '', seen: 0, lvSeen: {} });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) { st = Object.assign(fresh(), r); st.docs = Object.assign(fresh().docs, r.docs || {}); } } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const NAME = () => st.name || 'あなた';
  const fill = (s) => s.replace(/\{NAME\}/g, NAME());

  /* ---------- 画面の切り替え ---------- */
  const scr = (id) => { ['book', 'call', 'page'].forEach(k => { $('#' + k).hidden = k !== id; }); document.body.classList.toggle('in-call', id === 'call'); const dk = $('#docs'), home = id === 'call' ? $('.cmain') : document.body; if (dk.parentNode !== home) home.appendChild(dk); if (id !== 'call') $('#docs').classList.remove('open'); window.scrollTo(0, 0); };

  /* ---------- 待つ（やり直したら古い処理は止まる） ---------- */
  let gen = 0;
  const dead = () => new Promise(() => { });
  const wait = (ms) => { const g = gen; return new Promise((res) => setTimeout(() => { if (g === gen) res(); }, ms)); };

  /* ---------- チャット ---------- */
  const log = $('#log');
  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  function bubble(cls, html) { const d = el('div', 'msg ' + cls, html); log.appendChild(d); scrollLog(); return d; }
  async function mina(text) {
    const g = gen;
    const ty = bubble('mina typing', '<i></i><i></i><i></i>');
    await wait(Math.min(1900, 320 + text.length * 32) * (st.fast ? .4 : 1));
    if (g !== gen) return dead();
    ty.className = 'msg mina'; ty.innerHTML = '<b>真壁</b><p>' + esc(fill(text)) + '</p>';
    KA.sfx('ping'); scrollLog();
    await wait(st.fast ? 120 : 260);
  }
  async function says(list) { for (const t of list) await mina(t); }
  const me = (t) => bubble('me', '<p>' + esc(t) + '</p>');
  const sys = (t) => bubble('sys', esc(fill(t)));
  const odd = (t) => { bubble('mina odd', '<b>＿＿＿</b><p>' + esc(fill(t)) + '</p>'); KA.sfx('whisper', { dur: 1.4 }); };

  /* ---------- 映像まわり ---------- */
  let here = 'door_out', stageT0 = Date.now();
  const CAP = { wall2: '？？？', door_out: '2階外廊下', genkan: '玄関', breaker: '玄関・ブレーカー', kitchen: 'キッチン', bath: '浴室', room: '洋室', closet: 'クローゼット', behind: '洋室', wall: '？？？', corridor: '廊下', balcony: 'バルコニー', side: 'バルコニー', down: 'バルコニー', outside: '外' };
  async function go(v, o) {
    here = v; $('#cap').textContent = CAP[v] || '';
    const walk = !(o && (o.cut || o.walk === false));
    const iv = walk ? setInterval(() => KA.sfx('step'), 380) : null;
    await KW.go(v, o);
    if (iv) clearInterval(iv);
  }
  const BASE = { 1: 23 * 3600 + 10 * 60, 2: 23 * 3600 + 21 * 60, 3: 23 * 3600 + 33 * 60, 4: 23 * 3600 + 48 * 60, 5: 23 * 3600 + 59 * 60 + 40 };
  const BATT = { 1: 41, 2: 33, 3: 26, 4: 12, 5: 4 };
  let timer = null, timerLeft = 0;
  function hud() {
    const s = st.stage;
    if (s < 1 || s > 5) return;
    let sec = BASE[s] + Math.floor((Date.now() - stageT0) / 1000);
    if (s < 5) sec = Math.min(sec, BASE[s + 1] - 20);
    if (s === 5) sec = BASE[5] + (20 - Math.max(0, timerLeft));
    const hh = Math.floor(sec / 3600) % 24, mm = Math.floor(sec / 60) % 60, ss = sec % 60;
    $('#h-time').textContent = KD.pad(hh) + ':' + KD.pad(mm) + ':' + KD.pad(ss);
    $('#h-batt').textContent = BATT[s] + '%';
    const c = Math.floor((Date.now() - stageT0) / 1000) + (s - 1) * 600;
    $('#ctime').textContent = '通話 ' + KD.pad(Math.floor(c / 60) % 100) + ':' + KD.pad(c % 60);
  }
  setInterval(hud, 500);

  /* ---------- 指示のボタン ---------- */
  const acts = $('#acts');
  let busy = false;
  function setActs(list, sub) {
    acts.innerHTML = '';
    list.forEach((a, i) => {
      const b = el('button', 'act' + (a.c ? ' ' + a.c : ''), '<span class="k">' + (i + 1) + '</span>' + esc(a.t));
      b.type = 'button';
      b.addEventListener('click', () => doAct(a));
      acts.appendChild(b);
    });
    if (sub) { const b = el('button', 'act back', '<span class="k">0</span>もどる'); b.type = 'button'; b.addEventListener('click', refresh); acts.appendChild(b); }
  }
  async function doAct(a) {
    if (busy) return;
    if (a.sub) { setActs(a.sub, true); return; }
    busy = true; acts.classList.add('off');
    if (!a.silent) me(a.say || a.t);
    const g = gen;
    try { await a.f(); } catch (e) { console.error(e); }
    if (g !== gen) return;
    busy = false; acts.classList.remove('off');
    refresh();
  }
  window.addEventListener('keydown', (e) => {
    if ($('#call').hidden || e.target.closest('input, select, textarea') || !$('#modal').hidden) return;
    if (/^[0-9]$/.test(e.key)) { const bs = [...acts.querySelectorAll('.act')]; const n = e.key === '0' ? bs.length : +e.key; const b = bs.find(x => x.querySelector('.k').textContent === e.key) || bs[n - 1]; if (b) { e.preventDefault(); b.click(); } }
  });

  /* ---------- 測る ---------- */
  async function measure(k) {
    const m = KD.MEASURE.find(x => x.k === k);
    KA.sfx('click');
    await mina('レーザーで測りますね……');
    await wait(700);
    st.f['m_' + k] = 1; save();
    await mina(m.label + '、' + m.real.toLocaleString() + 'ミリです。');
    if (k === 'cd') await mina('……思ってたより、浅いですね。手のひら2つぶんくらいしかないです。');
  }
  const measureMenu = (at) => ({ t: '測ってください', sub: KD.MEASURE.filter(m => m.at.includes(at)).map(m => ({ t: m.label + 'を測って', f: () => measure(m.k) })) });

  /* ---------- 移動 ---------- */
  const MOVE = [['genkan', '玄関へ'], ['kitchen', 'キッチンへ'], ['bath', '浴室へ'], ['room', '洋室へ'], ['balcony', 'バルコニーへ']];
  async function moveTo(v) {
    if (v === 'balcony' && here !== 'room' && here !== 'closet') await go('room', { dur: 1300 });
    await go(v, { dur: 1600 });
    const s = st.stage;
    if (v === 'room' && !st.f.room1) { st.f.room1 = 1; save(); await mina('洋室です。6帖、角部屋なので窓が大きいです。'); await wait(900); KA.sfx('knock', { n: 1, loud: .25 }); await mina('……いま、なにか鳴りました？　上の階かな。'); return; }
    if (v === 'bath' && !st.f.bath1) { st.f.bath1 = 1; save(); await mina('浴室です。ユニットバスで、お風呂とトイレがいっしょのタイプですね。'); return; }
    if (v === 'kitchen' && !st.f.kit1) { st.f.kit1 = 1; save(); await mina('キッチンです。コンロは2口。……ちょっと、においがこもってますね。'); return; }
    if (v === 'balcony' && !st.f.bal1) { st.f.bal1 = 1; save(); await mina('バルコニーです。夜景、きれいですね。'); return; }
    if (s === 4) await mina(['……まっくら。', '足もと、見えないです……', 'ナイトモードでも、奥までは見えないです。'][Math.floor(Math.random() * 3)]);
  }

  /* ---------- 場所ごとの指示 ---------- */
  function placeActs() {
    const s = st.stage, L = [];
    if (here === 'genkan') {
      L.push({ t: 'ブレーカーを見せて', f: async () => { await go('breaker', { dur: 900, walk: false }); await mina(s >= 4 ? '主幹、入ってます。……なのに、電気がつかない。' : 'ブレーカーです。主幹と、洋室・キッチン・浴室・エアコン……いちばん右だけ、名前が書いてないですね。'); await go('genkan', { dur: 800, walk: false }); } });
      L.push(measureMenu('genkan'));
    }
    if (here === 'kitchen') {
      L.push({ t: '引き出しを開けて', f: async () => {
        KW.set('drawer', true); KA.sfx('creak');
        if (!st.docs.ledger) {
          st.docs.ledger = true; save(); paintDocs();
          await mina('なにか入ってます……紙？　『入居者台帳』……前の人たちの記録です。');
          sys('資料が増えました：入居者台帳（写し）');
          if (s >= 3) await kusumiTalk(); else await mina('なんでこんなところに……。送っておきますね。');
        } else await mina('ほかには、なにも入ってないです。');
        await wait(400); KW.set('drawer', false);
      } });
      L.push({ t: 'シンクを照らして', f: async () => { KA.sfx('drip'); await mina('排水口に……長い髪の毛が、たくさん。'); await mina('……前の人の、ですよね。'); } });
      L.push({ t: '奥の壁を叩いて', f: async () => { KA.sfx('hollow'); await mina(s >= 2 ? 'コン、コン……' : 'コン、コン……なんか、軽い音。奥が空っぽみたいな。'); if (s >= 2) { await wait(900); KA.sfx('knock', { n: 2, loud: .45 }); KW.hit('shake', .4); await mina('……返ってきた。'); } } });
      L.push(measureMenu('kitchen'));
    }
    if (here === 'bath') {
      L.push({ t: '鏡を見せて', f: async () => {
        if (s >= 2 && !st.f.mirror) {
          st.f.mirror = 1; save();
          await wait(500); KW.set('mirror', true); KA.sfx('sting'); KW.hit('glitch', 1); KW.hit('shake', .8);
          await wait(st.weak ? 700 : 320); KW.set('mirror', false);
          await says(['……いま、なにか映りました？', 'わたしのうしろ……だれも、いないですよね。']);
        } else await mina('鏡です。……ちょっと、くもってますね。');
      } });
      L.push({ t: '浴槽を見せて', f: async () => { KA.sfx('drip'); await mina('空っぽです。……底に、少しだけ水が残ってる。'); } });
    }
    if (here === 'room') {
      L.push({ t: 'クローゼットを開けて', f: openCloset });
      L.push({ t: '窓を見せて', f: async () => { await mina(s >= 3 ? '窓に……手のあとが。内がわから。' : '南向きです。……あ、月が出てますね。'); } });
      L.push({ t: '天井を見せて', f: async () => { await mina('天井に、しみがあります。……顔みたいに見えますね。気のせいです、たぶん。'); } });
      L.push({ t: '部屋のすみを見せて', f: async () => { await says(['……盛り塩です。前の人が置いたのかな。', '四すみ……じゃない。3つしかない。', 'クローゼットの前のすみだけ、ないです。']); } });
      L.push(measureMenu('room'));
    }
    if (here === 'closet') {
      if (s < 4) {
        L.push({ t: '奥の壁を叩いて', f: async () => {
          KA.sfx('hollow');
          if (s < 2) { await mina('コン、コン……ちょっと、軽い音がします。'); return; }
          await mina('コン、コン……'); await wait(700);
          KA.sfx('knock', { n: 3, loud: .8 }); KW.hit('shake', .9);
          await mina('……また、叩きかえしてくる。');
        } });
        L.push({ t: 'スーツケースを見せて', f: async () => { st.f.suit = 1; save(); await mina(s >= 3 ? '久住さんの荷物……ぜんぶ、ここに置いたまま？' : '前の方の忘れ物ですかね。名札がついてます。『久住』。'); } });
        L.push(measureMenu('closet'));
      }
      L.push({ t: '洋室にもどって', f: () => go('room', { dur: 900 }) });
    }
    if (here === 'balcony') {
      L.push({ t: '床を照らして', f: async () => { st.f.hatch = 1; save(); await mina('避難ハッチです。下の階に降りるはしごが入ってます。'); } });
      L.push({ t: 'となりを見せて', f: async () => { await go('side', { dur: 800, walk: false }); await mina('となりとの仕切り板です。『非常の際は、ここを破って隣戸へ避難できます』。'); if (s >= 2) await mina('……板の向こうで、いま何か動きました？'); await go('balcony', { dur: 700, walk: false }); } });
      L.push({ t: '下を見せて', f: async () => { await go('down', { dur: 900, walk: false }); await mina('2階なので、けっこう高いです。'); await go('balcony', { dur: 700, walk: false }); } });
    }
    return L;
  }
  async function openCloset() {
    KW.set('closet', true); KA.sfx('creak');
    await go('closet', { dur: 1100 });
    if (!st.f.cl1) { st.f.cl1 = 1; save(); await mina('クローゼットです。折れ戸なので、ぜんぶ開きます。'); await mina('……スーツケースが置きっぱなし。'); }
  }

  /* ---------- 気づいたことを伝える ---------- */
  const TELL = {
    1: { q: '図面とちがうところは、どこ？　何ミリちがう？', kind: 'measure' },
    2: { q: '黒塗りの下にあった、大家さんの娘さんの名前は？', kind: 'text' },
    3: { q: '久住さんは、今夜で入居して何日目？', kind: 'num' }
  };
  function openTell() {
    const T = TELL[st.stage]; if (!T || busy) return;
    const m = $('#modal');
    let body = '';
    if (T.kind === 'measure') body = '<label>場所<select id="tl-a">' + KD.MEASURE.map(x => '<option value="' + x.k + '">' + x.label + '</option>').join('') + '</select></label><label>ちがい<input id="tl-b" inputmode="numeric" autocomplete="off" placeholder="ミリ"></label>';
    if (T.kind === 'text') body = '<label>名前<input id="tl-a" autocomplete="off" placeholder="カタカナで"></label>';
    if (T.kind === 'num') body = '<label>日数<input id="tl-a" inputmode="numeric" autocomplete="off" placeholder="日目"></label>';
    m.innerHTML = '<div class="mbox"><p class="mq">' + esc(T.q) + '</p><div class="mf">' + body + '</div><div class="mb"><button type="button" class="ghost" id="tl-x">やめる</button><button type="button" id="tl-ok">真壁さんに送る</button></div></div>';
    m.hidden = false;
    const f = m.querySelector('input,select'); if (f) f.focus();
    const close = () => { m.hidden = true; m.innerHTML = ''; };
    $('#tl-x').onclick = close;
    m.onkeydown = (e) => { if (e.key === 'Enter') $('#tl-ok').click(); if (e.key === 'Escape') close(); };
    $('#tl-ok').onclick = () => {
      const a = ($('#tl-a') || {}).value || '', b = ($('#tl-b') || {}).value || '';
      close();
      answer(T.kind, a, b);
    };
  }
  const zen = (s) => String(s).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\s|　/g, '');
  const kata = (s) => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  async function answer(kind, a, b) {
    if (busy) return;
    busy = true; acts.classList.add('off');
    const g = gen;
    let ok = false;
    if (kind === 'measure') { me((KD.MEASURE.find(x => x.k === a) || {}).label + '、' + b + 'ミリ'); ok = a === 'cd' && /^(455|４５５)$/.test(zen(b).replace(/mm|ミリ/g, '')); }
    if (kind === 'text') { me(a); const n = kata(zen(a)).replace(/柊|ヒイラギ|さん|サン/g, ''); ok = n === 'ナナエ'; }
    if (kind === 'num') { me(a); ok = /^(49|四十九)(日|日目)?$/.test(zen(a)); }
    try {
      if (!ok) { await mina(['うーん……ちがうかも、です。', 'えっと……それは、たぶんちがいます。', '……ごめんなさい、よくわからないです。'][Math.floor(Math.random() * 3)]); }
      else if (st.stage === 1) await stage2();
      else if (st.stage === 2) await stage3();
      else if (st.stage === 3) await stage4();
    } catch (e) { console.error(e); }
    if (g !== gen) return;
    busy = false; acts.classList.remove('off'); refresh();
  }
  $('#tell').addEventListener('click', openTell);

  /* ---------- 段階 ---------- */
  function setStage(n) { st.stage = n; save(); stageT0 = Date.now(); paintDocs(); paintThread(); }
  async function stage1() {
    setStage(1);
    KW.mode('on'); KW.set('door', false); KW.set('closet', false); KW.set('panel', false); KW.nanae(null);
    await go('door_out', { cut: true });
    const late = new Date().getHours() < 4;
    if (late) KW.nanae([-3.1, 0, -.65], true);
    KA.ambient(true); KA.tension(0);
    sys('内見の通話に接続しました');
    await says(['こんばんは！　ひいらぎ不動産の真壁です。{NAME}様ですね。', 'すみません、マイクの調子が悪くて……今日はチャットでご案内しますね。']);
    if (late) await mina('……こんな時間の内見、わたし、はじめてです。');
    await says(['こちらが、コーポ柊の204号室です。', '鍵、あけますね。']);
    KA.sfx('key'); await wait(600); KW.set('door', true); KA.sfx('door');
    KW.nanae(null);
    await go('genkan', { dur: 1800 });
    await says(['玄関です。右がわの上にブレーカーがあります。', '見たいところを、下のボタンで言ってください。図面は「資料」から見られます。', '気になることがあったら「気づいたことを伝える」で教えてくださいね。']);
  }
  async function stage2() {
    await says(['455ミリ……じゃあ、クローゼットの奥に、すきまがあるってことですか？', 'ちょっと、叩いてみますね。']);
    if (here !== 'closet') { KW.set('closet', true); await go(here === 'room' ? 'closet' : 'room', { dur: 1200 }); if (here !== 'closet') await go('closet', { dur: 1000 }); }
    KA.sfx('hollow'); await wait(1600);
    KA.tension(1);
    KA.sfx('knock', { n: 3, loud: .9, iv: .45 }); KW.hit('shake', 1); KW.hit('glitch', .5);
    await wait(1500);
    await says(['……いま、なかから……', '叩きかえされました、よね……？']);
    setStage(2);
    await mina('会社に確認します。ちょっと待ってください。');
    await wait(1400);
    st.docs.jusetsu = true; save(); paintDocs();
    sys('資料が届きました：重要事項説明書（一部）');
    await says(['重要事項説明書……黒塗りだらけ。これ、お客さんにちゃんと見せなきゃいけない書類なのに。', '大家さん……柊さんのご家族のことが書いてあるみたいなんですけど、名前が塗られてて。']);
    await wait(1200);
    sys('＿＿＿ さんが通話に参加しました'); KA.sfx('static', { dur: .5 });
    await wait(2200);
    sys('＿＿＿ さんが退出しました');
    await mina('……いまの、だれですか？');
  }
  async function stage3() {
    await says(['柊……ナナエさん。大家さんの、娘さん。', '平成11年にいなくなって……クローゼットを改装したのも、同じ年。', '……いなくなった、次の月に。']);
    setStage(3); KA.tension(1);
    if (!st.docs.ledger) await mina('そういえば社長が、キッチンの引き出しに書類があるって言ってました。');
    else await kusumiTalk();
  }
  async function kusumiTalk() {
    await says(['入居者台帳……平成21年から、5人。', 'みんな、入ってすぐ出ていってる……？', '……いちばん下。久住サキさん。「契約中」になってる。空室って聞いてたのに。']);
    if (st.f.suit) await mina('クローゼットのスーツケース……久住さんのでしたよね。');
    sys('＿＿＿ さんが通話に参加しました'); KA.sfx('whisper', { dur: 2 });
    await wait(1800); sys('＿＿＿ さんが退出しました');
  }
  async function stage4() {
    await says(['49日目……みんな、ちょうど49日目に、いなくなってる。', 'じゃあ、久住さんは……今夜が……']);
    setStage(4);
    KA.tension(2); KA.heart(true, 96);
    KA.sfx('knock', { n: 4, iv: .32, loud: .7 }); KW.hit('shake', .6);
    await mina('壁の中から……ずっと……');
    KA.sfx('knock', { n: 7, iv: .2, loud: .9 }); KW.hit('shake', 1);
    await wait(1600);
    KW.mode('black'); KA.sfx('static', { dur: 1.2 }); KW.hit('static', 1); KA.ambient(false);
    await wait(1800);
    await says(['停電……？', 'ライトつけます。']);
    KW.mode('torch'); await go('genkan', { dur: 1400 });
    await go('breaker', { dur: 800, walk: false });
    await mina('主幹、入ってます。……なのに、電気がつかない。');
    await mina('カメラ、ナイトモードにします。');
    KW.mode('nv'); KA.sfx('click');
    await go('genkan', { dur: 700, walk: false });
    odd('さむい');
    await mina('……いま、チャットに何か書かれました？');
  }
  /* ネジ（指の本数の順） */
  const ORDER = ['lb', 'rt', 'lt', 'rb'];
  const SCREW = { lt: '左上', rt: '右上', lb: '左下', rb: '右下' };
  function screwActs() {
    const got = st.f.screws || [];
    const L = Object.keys(SCREW).filter(k => !got.includes(k)).map(k => ({ t: SCREW[k] + 'のネジをはずして', f: () => screw(k) }));
    if (!st.f.back) L.push({ t: 'うしろを照らして', f: lookBack });
    L.push({ t: '洋室にもどって', f: () => go('room', { dur: 900 }) });
    return L;
  }
  async function screw(k) {
    const got = st.f.screws || [];
    if (ORDER[got.length] !== k) {
      KA.sfx('thud'); KW.hit('shake', 1.3); KW.hit('glitch', .8); if (!st.weak) KA.sfx('sting');
      st.f.screws = []; save();
      await says(['きゃっ……！　壁の向こうから、叩かれた……！', '……はずしたネジが、もどってる。']);
      return;
    }
    KA.sfx('screw'); got.push(k); st.f.screws = got; save();
    await mina(SCREW[k] + '、はずれました。（' + got.length + '/4）');
    if (got.length === 4) await openWall();
  }
  async function lookBack() {
    st.f.back = 1; save();
    KW.nanae([1.84, 0, 4.25, 0], true);
    await go('behind', { dur: st.weak ? 700 : 280, walk: false });
    KA.sfx('sting'); KW.hit('shake', 1.2); KW.hit('flash', st.weak ? .2 : .5);
    await wait(st.weak ? 900 : 500);
    KW.nanae(null); KW.hit('glitch', 1);
    await go('closet', { dur: 400, walk: false });
    await says(['……だれか、いました、よね。', 'いまの、うしろ……']);
  }
  async function openWall() {
    await mina('ぜんぶ、はずれました。……板、外します。');
    KA.sfx('fall'); KW.hit('shake', .8);
    KW.set('panel', true);
    await go('wall', { dur: 1500 });
    KA.tension(3);
    await says(['……うそ。', '人が……！　久住さん！？', '息、してる……！　つめたいけど、息してる……！']);
    await go('wall2', { dur: 1400, walk: false });
    await says(['奥に……もう一人……', '……ちがう、これ……骨……']);
    await wait(700);
    KA.sfx('chain'); await mina('……玄関のほうで、チェーンの音。');
    await stage5();
  }
  async function stage5() {
    setStage(5);
    busy = true; acts.classList.add('off');
    KW.mode('nv'); KW.set('closet', true); KW.set('panel', true);
    KW.nanae([.45, 0, .7, 0], true);
    KA.heart(true, 128); KA.tension(3);
    await go('corridor', { dur: 380, walk: false });
    KA.sfx('sting'); KW.hit('glitch', 1); KW.hit('shake', 1);
    await says(['玄関に……だれか、立ってる。', '久住さん抱えて……どっちに逃げれば……！？']);
    busy = false; acts.classList.remove('off');
    startTimer(20);
    setActs([
      { t: '玄関から出て！', f: () => caught('玄関') },
      { t: 'バルコニーへ！', f: toBalcony },
      { t: 'クローゼットに隠れて！', f: () => caught('クローゼット') }
    ]);
  }
  function startTimer(sec) {
    stopTimer(); timerLeft = sec;
    const t = $('#timer'); t.hidden = false; t.textContent = timerLeft;
    timer = setInterval(() => {
      if (busy && timerLeft > 3) return;
      timerLeft = Math.max(0, timerLeft - 1); t.textContent = timerLeft; KA.sfx('click');
      if (timerLeft <= 0) { stopTimer(); if (!busy) { busy = true; caught('時間'); } }
    }, 1000);
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; $('#timer').hidden = true; }
  async function toBalcony() {
    KW.nanae([.5, 0, 2.3, 0], true);
    await go('balcony', { dur: 900 });
    await mina('バルコニー……！　でも、行き止まり……！');
    setActs([
      { t: '飛び降りて！', f: () => caught('飛び降り') },
      { t: '仕切り板を破って！', f: async () => { await go('side', { dur: 500, walk: false }); KA.sfx('thud'); await mina('かたい……！　向こうから、押さえられてる……！'); timerLeft = Math.max(1, timerLeft - 6); await go('balcony', { dur: 500, walk: false }); } },
      { t: '避難ハッチを開けて！', f: escaped }
    ]);
  }
  async function caught(where) {
    gen++; stopTimer(); busy = true; acts.innerHTML = ''; acts.classList.add('off');
    const v = KW.view;
    if (KW.ok) { const dx = v.l.x - v.p.x, dz = v.l.z - v.p.z, len = Math.hypot(dx, dz) || 1; KW.nanae([v.p.x + dx / len * .62, 0, v.p.z + dz / len * .62], true); }
    KA.sfx('sting'); KW.hit('red', 1); KW.hit('shake', 1.5); KW.hit('glitch', 1);
    await wait(900);
    KW.mode('black'); KA.heart(false); KA.tension(0);
    await wait(900);
    await mina('……');
    odd('さむい');
    odd('{NAME}さん、いっしょに いよう');
    sys('通話が終了しました');
    if (!st.ends.includes('caught')) st.ends.push('caught'); save();
    endCard('BAD END', '四十九日目', where === '時間' ? '0時に、なった。' : where + 'は、だめだった。', [{ t: '逃げるところから、やり直す', f: () => resume(5) }]);
  }
  async function escaped() {
    stopTimer();
    await go('down', { dur: 800, walk: false });
    KA.sfx('creak');
    await says(['はしご、下ります……久住さん、しっかり……！']);
    KW.mode('street'); KW.set('panel', true);
    KW.nanae([1.55, 0, 6.18, 0], true);
    KA.heart(false); KA.tension(1);
    await go('outside', { cut: true });
    await says(['出られた……！', '救急車、呼びました。久住さん……手、あったかい。', '……{NAME}さん。', '204の窓……だれか、こっち見てる。']);
    KA.sfx('whisper', { dur: 2.6 });
    await wait(2400);
    KW.hit('static', 1.2); KW.mode('black'); KA.stopAll();
    sys('通話が終了しました');
    setStage(6);
    await wait(1600);
    setActs([{ t: '……', f: async () => { toPage(); } }]);
    busy = false; acts.classList.remove('off');
  }

  /* ---------- 結末のカード ---------- */
  function endCard(kind, title, sub, btns) {
    const m = $('#modal');
    m.innerHTML = '<div class="mbox end ' + (kind.startsWith('BAD') ? 'bad' : 'true') + '"><p class="ek">' + esc(kind) + '</p><p class="et">' + esc(title) + '</p><p class="es">' + esc(fill(sub)) + '</p><div class="mb"></div></div>';
    const mb = m.querySelector('.mb');
    btns.forEach(b => { const x = el('button', null, esc(b.t)); x.type = 'button'; x.onclick = () => { m.hidden = true; m.innerHTML = ''; b.f(); }; mb.appendChild(x); });
    m.hidden = false;
  }

  /* ---------- 指示の組み立て ---------- */
  function refresh() {
    if (busy) return;
    const s = st.stage;
    $('#tell').hidden = !TELL[s];
    if (s === 5) return;
    if (s === 6) { setActs([{ t: '……（メールが届いた）', f: async () => toPage(), silent: true }]); return; }
    if (s < 1 || s > 4) { acts.innerHTML = ''; return; }
    let L = [];
    if (s === 4) {
      if (here === 'closet') L = screwActs();
      else {
        if (here === 'room') L.push({ t: 'クローゼットを見せて', f: async () => { KW.set('closet', true); await go('closet', { dur: 1000 }); if (!st.f.nvhands) { st.f.nvhands = 1; save(); await says(['……壁に、手のあと。', 'ナイトモードだと見える……4つ。ネジのところに、ひとつずつ。', '指の数が、ぜんぶちがう……', 'ネジ、はずせます。マルチツール持ってるので。']); } } });
        MOVE.filter(([v]) => v !== here && (v === 'room' || v === 'genkan' || v === 'kitchen')).forEach(([v, t]) => L.push({ t, f: () => moveTo(v) }));
        if (here === 'genkan') L.push({ t: 'ブレーカーを見せて', f: async () => { await go('breaker', { dur: 800, walk: false }); await mina('主幹、入ってます。……なのに、電気がつかない。'); await go('genkan', { dur: 700, walk: false }); } });
      }
      setActs(L); return;
    }
    L = placeActs();
    MOVE.filter(([v]) => v !== here).forEach(([v, t]) => L.push({ t, f: () => moveTo(v), c: 'mv' }));
    setActs(L);
  }

  /* ---------- 資料 ---------- */
  let tab = 'flyer';
  const TABS = [['flyer', 'チラシ'], ['plan', '間取り図'], ['jusetsu', '重要事項'], ['ledger', '台帳'], ['thread', 'スレ']];
  function paintDocs() {
    const tb = $('#dtabs');
    tb.innerHTML = TABS.map(([k, t]) => {
      const lock = (k === 'jusetsu' && !st.docs.jusetsu) || (k === 'ledger' && !st.docs.ledger);
      return '<button type="button" data-t="' + k + '" class="' + (tab === k ? 'on' : '') + (lock ? ' lock' : '') + '"' + (lock ? ' disabled' : '') + '>' + t + (k === 'thread' && newPosts() ? '<i class="nb">新</i>' : '') + '</button>';
    }).join('');
    const b = $('#dbody');
    if (tab === 'flyer') b.innerHTML = KD.flyer();
    if (tab === 'plan') b.innerHTML = '<div class="doc plan-wrap">' + KD.PLAN + '</div>';
    if (tab === 'jusetsu') b.innerHTML = st.docs.jusetsu ? KD.JUSETSU : '';
    if (tab === 'ledger') b.innerHTML = st.docs.ledger ? KD.ledger() : '';
    if (tab === 'thread') { b.innerHTML = threadHTML(); markSeen(); }
    const n = newPosts(); ['#docs-btn', '#p-docs'].forEach(s => { const x = $(s); if (x) x.classList.toggle('new', !!n); });
  }
  $('#dtabs').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b || b.disabled) return; tab = b.dataset.t; paintDocs(); $('#dbody').scrollTop = 0; });
  $('#dbody').addEventListener('click', (e) => {
    const ph = e.target.closest('[data-ph]');
    if (ph) { const m = $('#modal'); m.innerHTML = '<div class="mbox photo"><div class="ph-big">' + KD.PH[ph.dataset.ph] + '</div><div class="mb"><button type="button">とじる</button></div></div>'; m.hidden = false; m.querySelector('button').onclick = () => { m.hidden = true; m.innerHTML = ''; }; return; }
    if (e.target.closest('[data-act="apply"]')) apply();
  });
  function openDocs() { $('#docs').classList.add('open'); paintDocs(); }
  $('#docs-btn').addEventListener('click', () => { $('#docs').classList.contains('open') ? $('#docs').classList.remove('open') : openDocs(); });
  $('#docs-x').addEventListener('click', () => $('#docs').classList.remove('open'));
  function apply() {
    const m = $('#modal');
    m.innerHTML = '<div class="mbox"><p class="mq">コーポ柊 204号室に申し込みますか？</p><div class="mb"><button type="button" class="ghost" id="ap-no">やめる</button><button type="button" id="ap-ok">申し込む</button></div></div>';
    m.hidden = false;
    $('#ap-no').onclick = () => { m.hidden = true; m.innerHTML = ''; };
    $('#ap-ok').onclick = async () => {
      m.innerHTML = '<div class="mbox"><p class="mq">お申し込みを受け付けました。</p><p>' + esc(NAME()) + '様のご入居日：<b>本日</b><br>鍵は、郵便受けに入っております。</p></div>';
      KA.init(); KA.sfx('knock', { n: 3, loud: .8 });
      await new Promise(r => setTimeout(r, 2600));
      if (!st.ends.includes('apply')) st.ends.push('apply'); save();
      endCard('BAD END', '入居', '{NAME}さん、おかえりなさい。', [{ t: 'なかったことにする', f: () => { } }]);
    };
  }

  /* ---------- スレ（時間で書き込みがふえる） ---------- */
  const lv = (s) => HINT_AT.filter(t => (st.sm[s] || 0) >= t).length;
  function posts() {
    const cur = Math.max(1, Math.min(6, st.stage || 1));
    const P = [];
    for (let s = 1; s <= cur; s++) {
      KD.AMBIENT.filter(a => a.s === s).forEach(a => P.push({ t: a.t, name: a.name, odd: a.odd }));
      const n = s < cur || st.stage > 6 ? 3 : lv(s);
      KD.HINTS[s].slice(0, n).forEach(h => P.push({ t: h, hint: true }));
    }
    return P;
  }
  const newPosts = () => Math.max(0, posts().length - (st.seen || 0));
  function markSeen() { st.seen = posts().length; save(); }
  function threadHTML() {
    const P = posts(), cur = Math.max(1, Math.min(6, st.stage || 1)), n = lv(cur);
    const d = new Date(), ds = d.getFullYear() + '/' + KD.pad(d.getMonth() + 1) + '/' + KD.pad(d.getDate());
    let h = '<div class="th"><p class="th-t">' + KD.THREAD_T + '</p>';
    P.forEach((p, i) => { h += '<div class="po' + (p.odd ? ' odd' : '') + '"><p class="po-h">' + (i + 1) + '：<b>' + esc(p.name || '名無しの住人') + '</b>　' + ds + '</p><p class="po-b">' + esc(fill(p.t)) + '</p></div>'; });
    if (st.stage >= 1 && st.stage <= 6 && n < 3) {
      const left = Math.max(1, Math.ceil((HINT_AT[n] - (st.sm[cur] || 0)) / 60000));
      h += '<p class="th-wait">……だれかが書き込んでいます（あと' + left + '分くらい）</p>';
    }
    return h + '</div>';
  }
  function paintThread() { paintDocs(); }

  /* ---------- 告知（最後のページ） ---------- */
  function toPage() {
    gen++; busy = false; stopTimer(); KA.stopAll();
    scr('page');
    const done = st.ending === 'true';
    $('#page').innerHTML = pageHTML(done);
    if (!done) $('#kf').addEventListener('submit', submitKokuchi);
    const pd = $('#p-docs'); if (pd) pd.addEventListener('click', openDocs);
  }
  function pageHTML(done) {
    const kokuchi = done
      ? '平成11年3月、当該住戸のクローゼット奥の壁内において、所有者の長女（柊 ナナエ）が死亡。遺体は長期間、壁内にあった。また、平成21年以降、当該住戸の入居者4名が所在不明となっている。'
      : '詳細はお問い合わせください';
    return '<header class="pg-h"><span class="logo"><i></i>ひいらぎ不動産</span><span class="pg-s">物件情報</span>' + (done ? '' : '<button type="button" class="pg-docs" id="p-docs">資料</button>') + '</header>'
      + (done ? '<p class="pg-closed">この物件は、掲載を終了しました。</p>' : '')
      + '<section class="pg-card"><p class="pg-new">' + (done ? '掲載終了' : '募集中') + '</p><h2>コーポ柊 204号室</h2><p class="pg-meta">1K ／ 21.06㎡ ／ 2階・角部屋 ／ 家賃 1.9万円</p>'
      + '<dl class="pg-dl"><dt>告知事項</dt><dd' + (done ? ' class="fixed"' : '') + '>' + esc(kokuchi) + '</dd></dl></section>'
      + (done ? doneHTML() : '<section class="pg-mail"><p class="pg-from">真壁 ミナ（ひいらぎ不動産）からのメール</p>'
        + '<p>' + esc(NAME()) + '様</p><p>昨夜は、本当にありがとうございました。久住さんは病院で、命に別状はないそうです。</p><p>壁の中からは、女の人の骨と、4人ぶんの荷物が見つかりました。</p><p>でも社長は「告知は出さない」と言っています。あの部屋は、またすぐ募集に出されると思います。</p><p>おねがいです。ちゃんと、告知してください。訂正の依頼は、わたしの名前で出せるようにしておきました。</p><p class="pg-sign">真壁</p></section>'
        + '<form class="pg-form" id="kf"><p class="pg-ft">告知事項の訂正依頼</p>'
        + '<label>亡くなった方（所在不明になった方）<input name="who" autocomplete="off" placeholder="氏名"></label>'
        + '<label>場所<select name="where"><option value="">選んでください</option><option value="genkan">玄関</option><option value="kitchen">キッチン</option><option value="bath">浴室</option><option value="room">洋室</option><option value="wall">クローゼットの奥の壁の中</option><option value="balcony">バルコニー</option></select></label>'
        + '<label>いつ<select name="when"><option value="">選んでください</option><option value="h7">平成7年</option><option value="h11">平成11年</option><option value="h21">平成21年</option><option value="r1">令和元年</option><option value="now">昨夜</option></select></label>'
        + '<label>この部屋で所在不明になった入居者<select name="n"><option value="">選んでください</option>' + [0, 1, 2, 3, 4, 5, 6].map(n => '<option value="' + n + '">' + n + '人</option>').join('') + '</select></label>'
        + '<p class="pg-err" id="kf-err" aria-live="polite"></p><button type="submit">訂正を依頼する</button></form>');
  }
  function doneHTML() {
    return '<section class="pg-news"><p class="nw-src">地域ニュース</p><h3>アパート壁内から白骨遺体　27年前に不明の女性か</h3>'
      + '<p>鷺ノ森3丁目のアパートで、2階の一室のクローゼットの奥から、女性とみられる白骨遺体が見つかった。警察は、平成11年に行方がわからなくなっていた所有者の長女とみて調べている。</p>'
      + '<p>壁の中からは、同じ部屋で所在不明になっていた4人の所持品も見つかった。また、壁の中で衰弱していた23歳の女性が保護されたが、命に別状はないという。</p></section>'
      + '<section class="pg-mail"><p class="pg-from">真壁 ミナからのメール</p><p>ひいらぎ不動産は、やめました。</p><p>ナナエさん、やっと、見つけてもらえましたね。</p><p>' + esc(NAME()) + 'さん、ありがとうございました。</p></section>'
      + '<div class="pg-last" id="pg-last"></div><div class="pg-acts"><button type="button" id="pg-back">予約ページにもどる</button></div>';
  }
  async function submitKokuchi(e) {
    e.preventDefault();
    const f = e.target, who = kata(zen(f.who.value)).replace(/柊|ヒイラギ|さん|サン/g, '');
    const ok = [who === 'ナナエ', f.where.value === 'wall', f.when.value === 'h11', f.n.value === '4'];
    const bad = ok.filter(x => !x).length;
    KA.init();
    if (bad) {
      $('#kf-err').textContent = '受理できませんでした。（' + bad + 'か所、確認が必要です）';
      KA.sfx('knock', { n: bad, loud: .6 }); document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
      return;
    }
    st.ending = 'true'; st.stage = 7; if (!st.ends.includes('true')) st.ends.push('true'); save();
    KA.sfx('end');
    $('#page').innerHTML = pageHTML(true);
    $('#pg-back').addEventListener('click', () => { toBook(); });
    await new Promise(r => setTimeout(r, 4200));
    const last = $('#pg-last'); if (!last) return;
    last.innerHTML = '<div class="msg mina odd"><b>＿＿＿</b><p>ありがとう</p></div>';
    KA.sfx('whisper', { dur: 1.2 });
    await new Promise(r => setTimeout(r, 3000));
    if (!$('#pg-last')) return;
    last.insertAdjacentHTML('beforeend', '<div class="msg mina odd"><b>＿＿＿</b><p>' + esc(NAME()) + 'さんの へやの かべ、うすいね</p></div>');
    KA.sfx('knock', { n: 3, loud: .5 });
    await new Promise(r => setTimeout(r, 2200));
    endCard('TRUE END', '告知', '204号室は、もう募集されない。……たぶん。', [{ t: 'とじる', f: () => { } }]);
  }

  /* ---------- 予約の画面 ---------- */
  function toBook() {
    gen++; busy = false; stopTimer(); KA.stopAll();
    scr('book');
    const done = st.ending === 'true';
    $('#bk-new').hidden = !done;
    $('#bk-name').value = st.name || '';
    $('#bk-weak').checked = !!st.weak;
    const s = st.stage;
    $('#bk-go').textContent = done ? 'もう一度、内見する' : (s >= 1 && s <= 5) ? '内見を再開する' : s === 6 ? '真壁さんのメールを見る' : '内見をはじめる';
    $('#bk-restart').hidden = !(s >= 1 && s <= 6);
    $('#bk-date').textContent = '本日（' + (new Date().getMonth() + 1) + '月' + new Date().getDate() + '日）23:10〜';
  }
  $('#bk-go').addEventListener('click', () => {
    st.name = $('#bk-name').value.trim().slice(0, 10); st.weak = $('#bk-weak').checked; save();
    KA.init(); KA.setWeak(st.weak); KA.mute(st.mute);
    if (st.ending === 'true') { const e = st.ends, p = st.playMs, n = st.name, w = st.weak; st = fresh(); st.ends = e; st.playMs = p; st.name = n; st.weak = w; save(); }
    if (st.stage === 6) { toPage(); return; }
    startCall();
  });
  $('#bk-restart').addEventListener('click', () => {
    const m = $('#modal');
    m.innerHTML = '<div class="mbox"><p class="mq">いまの内見の記録を消して、最初からはじめますか？</p><div class="mb"><button type="button" class="ghost" id="rs-no">やめる</button><button type="button" id="rs-ok">最初から</button></div></div>';
    m.hidden = false;
    $('#rs-no').onclick = () => { m.hidden = true; m.innerHTML = ''; };
    $('#rs-ok').onclick = () => { m.hidden = true; m.innerHTML = ''; const e = st.ends, p = st.playMs, n = st.name, w = st.weak; st = fresh(); st.ends = e; st.playMs = p; st.name = n; st.weak = w; save(); toBook(); };
  });
  $('#bk-205').addEventListener('click', () => { const m = $('#modal'); m.innerHTML = '<div class="mbox"><p class="mq">コーポ柊 205号室</p><p>このお部屋は、平成11年から募集を停止しています。</p><div class="mb"><button type="button">とじる</button></div></div>'; m.hidden = false; m.querySelector('button').onclick = () => { m.hidden = true; m.innerHTML = ''; }; });

  let started = false;
  function startCall() {
    scr('call'); $('#call').classList.remove('docs-only');
    if (!started) { started = true; KW.init($('#cv'), NAME()); } else KW.set('name', NAME());
    $('#nofeed').hidden = KW.ok;
    const s = st.stage;
    if (s >= 1 && s <= 5) resume(s); else run(stage1);
  }
  async function run(fn) {
    gen++; busy = true; acts.classList.add('off'); acts.innerHTML = '';
    const g = gen;
    try { await fn(); } catch (e) { console.error(e); }
    if (g !== gen) return;
    busy = false; acts.classList.remove('off'); refresh();
  }
  /* 途中から（段階のはじめの状態にもどす） */
  function resume(s) {
    gen++; busy = false; stopTimer();
    log.innerHTML = '';
    KA.ambient(s < 4); KA.tension(s >= 4 ? 2 : s >= 2 ? 1 : 0); KA.heart(false);
    KW.nanae(null); KW.set('door', true); KW.set('drawer', false);
    sys('内見の通話に、再接続しました');
    stageT0 = Date.now();
    if (s === 1) { run(stage1); return; }
    if (s === 2 || s === 3) {
      KW.mode('on'); KW.set('closet', true); KW.set('panel', false);
      run(async () => { await go('closet', { cut: true }); await mina(s === 2 ? 'つづき、はじめますね。黒塗りの書類、見られますか？' : 'つづき、はじめますね。……台帳、見てもらえました？'); });
      return;
    }
    if (s === 4) {
      KW.mode('nv'); KW.set('closet', true); KW.set('panel', false); st.f.screws = []; save();
      KA.heart(true, 96);
      run(async () => { await go('room', { cut: true }); await mina('まっくらです。ナイトモードで見てます。……クローゼット、見ますね。'); });
      return;
    }
    if (s === 5) { KW.set('closet', true); KW.set('panel', true); run(async () => { await go('wall', { cut: true }); await mina('久住さん、息してます。……玄関のほうで、音が。'); await stage5(); }); }
  }

  /* ---------- ヘッダーの切り替え ---------- */
  const paintToggles = () => { $('#snd').textContent = st.mute ? '音：切' : '音：入'; $('#fast').textContent = st.fast ? '文字：速' : '文字：ふつう'; };
  $('#snd').addEventListener('click', () => { st.mute = !st.mute; save(); KA.mute(st.mute); paintToggles(); });
  $('#fast').addEventListener('click', () => { st.fast = !st.fast; save(); paintToggles(); });
  paintToggles();

  /* ---------- 時間（遊んだ時間・考えている時間） ---------- */
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    st.playMs = (st.playMs || 0) + 5000;
    const s = st.stage;
    if (s >= 1 && s <= 6) {
      const before = lv(s);
      st.sm[s] = (st.sm[s] || 0) + 5000;
      if (lv(s) !== before) { paintDocs(); }
      else if (tab === 'thread' && $('#dbody')) { const w = $('.th-wait'); if (w) paintDocs(); }
    }
    save();
  }, 5000);
  document.addEventListener('visibilitychange', () => {
    KA.suspend(document.hidden);
    if (st.stage >= 1 && st.stage <= 5) document.title = document.hidden ? '……どこいくの' : '告知事項あり';
  });
  try { console.log('%c……みてるの？', 'color:#a00;font-size:22px;font-weight:bold'); } catch (e) { }

  /* ---------- はじめ ---------- */
  paintDocs();
  if (st.stage === 6) { toBook(); } else toBook();
  window.__kk = { get st() { return st; }, resume, toPage, refresh, stage: (n) => { setStage(n); } };
})();
