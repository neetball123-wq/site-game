/* 霞野線アーカイブ — 運行管理システム TMS-87（最終章） */
(() => {
  'use strict';
  const { D, $, $$, esc, state, save, fact, routes, leave, go, reduced } = K;
  const art = K.art;
  const T = state.tms;
  const MIN = (h, m) => h * 60 + m;
  const fmt = v => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;

  let out = null, queue = [], busy = false, history = [], hIdx = 0, clockT = 0;

  /* ---------- 出力 ---------- */
  function flush() {
    if (busy) return;
    const item = queue.shift();
    if (!item) return;
    busy = true;
    const [html, delay] = item;
    setTimeout(() => {
      if (out) { out.insertAdjacentHTML('beforeend', html); out.scrollTop = out.scrollHeight; }
      busy = false;
      flush();
    }, reduced ? 0 : delay);
  }
  const put = (text, cls = '', delay = 0) => { queue.push([`<pre class="${cls}">${esc(text)}</pre>`, delay]); flush(); };
  const putHTML = (html, delay = 0) => { queue.push([html, delay]); flush(); };
  const err = t => put('エラー：' + t, 'err');
  const tg = (t, delay = 900) => put(t, 'tg', delay);

  /* ---------- データ ---------- */
  const upStops = D.upOrder.map(id => K.station(id));
  const tsukiRow = () => ({ name: '月見野', code: 'ツミ', km: 10.3 });
  function timetable() {
    const rows = [];
    const base = MIN(22, 47);
    upStops.forEach((s, i) => {
      let t = base + D.upOffsets[i];
      if (T.tt && s.km < 10.3) t += 1;
      rows.push([s.name, s.code, s.km.toFixed(1), i === 0 ? '  --' : fmt(t), i === upStops.length - 1 ? '  --' : fmt(t)]);
      if (s.id === 'kasumisawa') rows.push(['月見野', 'ツミ', '10.3', T.tt ? '23:08' : '--:--', T.tt ? '23:09' : '--:--']);
    });
    return rows;
  }
  const routeTo = () => (T.sw[21] === 'N' ? 'side' : T.sw[22] === 'R' ? 'lake' : 'main');
  const routeName = { side: '安全側線（車止め）', lake: '旧線（湖底へ）', main: '汐入方 本線' };
  const stationToken = t => {
    const v = K.norm(t);
    if (['ツミ', '月見野', 'TSUKIMINO'].includes(v)) return 'ツミ';
    const s = D.stations.find(x => x.code === v || x.name === v);
    return s ? s.code : null;
  };
  const timeToken = t => { const m = K.norm(t).match(/^(\d{1,2}):?(\d{2})$/); return m ? MIN(+m[1], +m[2]) : null; };

  /* ---------- コマンド ---------- */
  const CMD = {
    HELP() {
      put(['コマンド一覧',
        '  HELP        この一覧',
        '  STATUS      列車と設備の状態',
        '  STATIONS    駅と電略の一覧',
        '  LOG 148D    電報の受信記録',
        '  TT 148D     列車時刻表',
        '  RULES       運転取扱心得',
        '  SET         駅の時刻を登録（例：SET シリ 2311 2311）',
        '  ROUTE       配線図と進路',
        '  SWITCH      分岐器の転換（例：SWITCH 21 R）',
        '  SIGNAL      出発信号機の操作',
        '  SEND        列車へ電報を送る（例：SEND 148D ...）',
        '  CLEAR       画面を消去　　EXIT  資料室へ戻る'].join('\n'));
    },
    STATUS() {
      put(['TMS-87 状態表示　1987/03/31 ' + (T.signal ? '23:09:00' : '23:08:00（時計停止中）'),
        '列車      位置                 状態',
        '147D      霞野 着              運用終了（148Dへ折り返し）',
        '回9147D   汐入 1番線           148Dとの行き違い待ち',
        '148D      ツミ（未登録駅）     ' + (T.signal ? '発車' : '停車中・電報応答あり'),
        '          乗客 2名：女児 1／成人女性 1（※2026/09/05 23:08 乗車）',
        '',
        '月見野 時刻 ：' + (T.tt ? '登録済（着 23:08 発 23:09）' : '未登録'),
        '月見野 進路 ：' + routeName[routeTo()] + '（分岐器 21:' + T.sw[21] + ' ／ 22:' + T.sw[22] + '）',
        '出発信号機  ：' + (T.signal ? '進行' : '停止')].join('\n'));
    },
    STATIONS() {
      const rows = [...D.stations].sort((a, b) => a.km - b.km).flatMap(s => {
        const line = [`  ${s.code}   ${s.name.padEnd(4, '　')}  ${s.km.toFixed(1).padStart(4)} km`];
        if (s.id === 'shioiri') line.push(`  ツミ   ${'月見野'.padEnd(4, '　')}  10.3 km  ※未登録（観測値）`);
        return line;
      });
      put('電略  駅名        キロ程\n' + rows.join('\n'));
    },
    LOG([no]) {
      if (!no) { put('記録のある列車：148D（未処理 1件）　例：LOG 148D'); return; }
      if (K.norm(no) !== '148D') { put(`${no}：受信記録はありません。`); return; }
      T.log = true; save();
      put('━━ 電報受信記録 ━━━━━━━━━━━━━━━━━━━━\n受信 1987/03/31 23:08　発信 148D（運転士 K-0731）\n宛先 ナハシレイ（灘浜指令）　種別 ウナ（至急）', 'dim');
      tg('ウナ ナハシレイ 148D カサ ヲ 2306 ハツ\nツミ ニテ テイシヤ ス  ツミ ハ ダイヤ ニ ナシ\nジコク ナキタメ ハツシヤ デキズ\nジヨウキヤク 1  ウミ ヘ イキタシ ト イウ\nシキユウ ツミ ノ ジコク ヲ タノム  マシバ', 500);
      put('処理状況：未返信（39年と5か月）', 'err', 400);
      put('━━ 電報受信記録 ━━━━━━━━━━━━━━━━━━━━\n受信 2026/09/05 23:08　発信 148D（運転士 K-0731）', 'dim', 900);
      tg('ジヨウキヤク 2 ニ ナル  ミナト ト ナノル\nワシ ノ マゴ ダ ト イウ  ワシ ハ マダ カエレヌ\nダレカ ツミ ノ ジコク ヲ  マシバ', 500);
      put('処理状況：未返信　→ 列車への返信は SEND、時刻の登録は SET', 'err', 400);
    },
    TT([no]) {
      if (no && K.norm(no) !== '148D') { put(`${no}：本日の運行は終了しています。`); return; }
      const rows = timetable().map(([n, c, k, a, d]) => `  ${n.padEnd(4, '　')} ${c}  ${k.padStart(4)}   ${a.padStart(5)}  ${d.padStart(5)}${c === 'ツミ' && !T.tt ? '  ← 未設定' : ''}`);
      put('148D 列車時刻表（1987/03/31）\n  駅名       電略 キロ程   着      発\n' + rows.join('\n')
        + '\n\n※汐入にて 回9147D と行き違い。148D の汐入着は 23:12 以前とすること。\n※運転時分・停車時分は RULES を参照。');
    },
    RULES() {
      put(['運転取扱心得（抜粋）',
        '第一条　運転時分は「区間距離 ÷ 速度 40km/h」で求め、1分未満は切り上げる。',
        '第二条　停車時分は 1分以上とする。',
        '第三条　単線区間では、行き違い列車との約束の時刻を必ず守ること。',
        '第四条　出発信号機は、時刻が定められ、進路が構成された列車に対してのみ進行を現示する。'].join('\n'));
    },
    SET(args) {
      const a = args.filter(x => K.norm(x) !== '148D');
      if (a.length < 3) { err('書式：SET 駅 着時刻 発時刻（例：SET シリ 2311 2311）'); return; }
      const code = stationToken(a[0]), arr = timeToken(a[1]), dep = timeToken(a[2]);
      if (!code) { err(`駅「${a[0]}」が見つかりません。電略か駅名で指定してください（STATIONS）。`); return; }
      if (arr === null || dep === null) { err('時刻は 2308 または 23:08 の形で入力してください。'); return; }
      if (code !== 'ツミ') { err('その駅の時刻は確定済みです。変更できるのは未登録の駅だけです。'); return; }
      if (T.tt) { put('月見野の時刻は、すでに登録されています。'); return; }
      if (arr !== MIN(23, 8)) { err(`着時刻 ${fmt(arr)} は運転時分と合いません。前駅 霞沢 23:06 発、区間距離をもとに計算してください（RULES 第一条）。`); return; }
      if (dep - arr < 1) { err('停車時分が不足しています（RULES 第二条）。'); return; }
      if (dep + 3 > MIN(23, 12)) { err(`この発時刻では汐入着が ${fmt(dep + 3)} となり、回9147D との行き違いに間に合いません（RULES 第三条）。`); return; }
      T.tt = true; save();
      put('月見野（ツミ）　着 23:08　発 23:09　― 登録しました。', 'ok');
      put('以降の時刻を修正しました：汐入 23:12 ／ 桜坂 23:15 ／ 塩田 23:19 ／ 港町 23:22 ／ 灘浜 23:26', 'dim', 300);
      tg('148D ヨリ：ジコク ウケトル  カンシヤ ス\nアトハ シンロ ト シンゴウ ヲ タノム', 1400);
    },
    ROUTE() {
      putHTML(`<div class="track-wrap">${art.track(T.sw)}</div>`);
      put(`現在の進路：148D → ${routeName[routeTo()]}\nN＝定位、R＝反位。「SWITCH 21 R」のように転換します。`, routeTo() === 'main' ? 'ok' : '');
    },
    SWITCH([no, pos]) {
      if (T.signal) { err('進路は鎖錠されています。'); return; }
      const n = String(K.norm(no || ''));
      if (!['21', '22'].includes(n)) { err('分岐器番号は 21 または 22 です（ROUTE で確認）。'); return; }
      const p = K.norm(pos || '');
      const v = p === 'R' || p === '反位' ? 'R' : p === 'N' || p === '定位' ? 'N' : null;
      if (!v) { err('位置は N（定位）または R（反位）で指定してください。'); return; }
      T.sw[n] = v; save();
      put(`分岐器 ${n} を ${v === 'R' ? '反位（R）' : '定位（N）'} に転換しました。`, 'ok');
      CMD.ROUTE();
    },
    SIGNAL() {
      if (T.signal) { put('148D は 23:09 に月見野を発車しました。'); return; }
      if (!T.tt) { err('148D の月見野の時刻が定められていません（RULES 第四条）。'); return; }
      if (routeTo() !== 'main') { err(`出発進路が構成されていません。現在の進路は「${routeName[routeTo()]}」です（ROUTE）。`); return; }
      T.signal = true; save();
      put('月見野 出発信号機：進行', 'ok big');
      tg('148D ヨリ：シンゴウ シンコウ カクニン', 1400);
      tg('ミナト モ イツシヨ ダ\nコレヨリ ハツシヤ ス  アリガトウ  シレイ', 1800);
      put('システム時刻が再開しました　1987/03/31 23:08:59 → 23:09:00', 'dim', 1600);
      startClock();
      setTimeout(() => go('#/end'), reduced ? 1500 : 9500);
    },
    SEND(args) {
      const a = args[0] && K.norm(args[0]) === '148D' ? args.slice(1) : args;
      const msg = a.join(' ');
      if (!msg) { err('書式：SEND 148D 本文'); return; }
      put('送信しました。', 'dim');
      const v = K.norm(msg);
      let r;
      if (/ミナト|湊|MINATO/.test(v)) r = 'ミナト ハ ブジ ダ  ワシ ノ マゴ ダソウダ\nオオキク ナツタ  ワシヨリ トシウエ ニ ミエル';
      else if (T.signal) r = 'ハツシヤ ス';
      else if (!T.tt) r = 'ジコク ヲ タノム  ジコク ナクバ ウゴケヌ';
      else if (routeTo() !== 'main') r = 'ジコク カクニン  シンロ ト シンゴウ ヲ マツ';
      else r = 'シンロ カクニン  アトハ シンゴウ ダケ';
      tg('148D ヨリ：' + r, 1500);
    },
    CLEAR() { if (out) out.innerHTML = ''; },
    EXIT() { go('#/archive'); }
  };
  const ALIAS = { '?': 'HELP', 'ヘルプ': 'HELP', ST: 'STATUS', STA: 'STATIONS', TIMETABLE: 'TT', SW: 'SWITCH', SIG: 'SIGNAL', CLS: 'CLEAR', QUIT: 'EXIT', LOGOUT: 'EXIT' };

  function run(line) {
    const raw = line.trim();
    if (!raw) return;
    put('TMS> ' + raw, 'echo');
    history.push(raw); hIdx = history.length;
    const tokens = raw.normalize('NFKC').split(/\s+/);
    const head = tokens[0].toUpperCase();
    const fn = CMD[ALIAS[head] || head];
    if (!fn) { err(`コマンドが見つかりません：${tokens[0]}　HELP で一覧を表示します。`); return; }
    fn(tokens.slice(1));
  }

  /* ---------- 時計 ---------- */
  function startClock() {
    let s = MIN(23, 8) * 60 + 59;
    clearInterval(clockT);
    const el = $('#tms-clock');
    const tick = () => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; if (el) el.textContent = `1987/03/31 ${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; s++; };
    tick();
    clockT = setInterval(tick, 1000);
    if (el) el.classList.remove('stopped');
  }

  /* ---------- 画面 ---------- */
  routes.tms = () => {
    if (!state.archive) { go('#/archive'); return; }
    queue = []; busy = false;
    $('#v-tms').innerHTML = '<div class="crt"><div class="crt-head"><span>TMS-87　北灘鉄道 運行管理システム</span><span id="tms-clock" class="stopped">1987/03/31 23:08:00 ■停止</span></div>'
      + '<div class="crt-out" id="tms-out"></div>'
      + '<form class="crt-in" id="tms-form"><label for="tms-cmd">TMS&gt;</label><input id="tms-cmd" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send"></form>'
      + '<div class="crt-chips">' + ['HELP', 'STATUS', 'LOG 148D', 'TT 148D', 'RULES', 'ROUTE'].map(c => `<button type="button" data-cmd="${c}">${c}</button>`).join('')
      + '<button type="button" data-cmd="EXIT" class="exit">資料室へ戻る</button></div></div>';
    out = $('#tms-out');
    const input = $('#tms-cmd');
    $('#tms-form').addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' && hIdx > 0) { e.preventDefault(); input.value = history[--hIdx]; }
      if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; }
    });
    $$('.crt-chips button', $('#v-tms')).forEach(b => b.addEventListener('click', () => { run(b.dataset.cmd); input.focus({ preventScroll: true }); }));
    $('.crt-out', $('#v-tms')).addEventListener('click', () => input.focus({ preventScroll: true }));
    fact('tms', true);
    put('TMS-87 北灘鉄道 運行管理システム  Ver.2.1  (C)1984 北灘鉄道 電算室', 'dim');
    put('接続先：灘浜指令所 端末03', 'dim', 300);
    put('利用者：K-0731（運転士 真柴 恭一）　※指令権限で接続しました', 'dim', 300);
    put('……', 'dim', 500);
    if (T.signal) {
      put('148D は 23:09 に月見野を発車しました。', 'ok', 400);
      putHTML('<p class="crt-link"><a href="#/end">▶ 帰り道をもう一度見る</a></p>', 200);
      startClock();
    } else {
      put('システム時刻：1987/03/31 23:08:00　※時計が停止しています', 'err', 500);
      put('未処理の電報が 1 件あります（至急）。', 'tg', 400);
      put('HELP でコマンド一覧を表示します。', '', 300);
    }
    setTimeout(() => input.focus({ preventScroll: true }), 300);
  };
  leave.tms = () => { clearInterval(clockT); queue = []; busy = false; out = null; };
})();
