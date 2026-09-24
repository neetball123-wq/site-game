/* =========================================================
   六夜の賭場 — 進行
   ========================================================= */
(() => {
  const KEY = 'toba.v1';
  const stage = document.getElementById('stage');
  const obi = document.getElementById('obi');
  const fucho = document.getElementById('fucho');
  const S = FX.esc, K = FX.kan;

  /* ---------- 記録 ---------- */
  const fresh = () => ({ cleared: [false, false, false, false, false, false], fails: 0, ansUsed: false, muted: false, ending: '', top: 0 });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.cleared) st = Object.assign(fresh(), r); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };

  /* ---------- 今夜の盤面 ---------- */
  let cur = null;          // { n, koma, hands, log, logCols }
  let fuchoTab = 'ban';

  /* ---------- 確認（ブラウザの confirm は、埋め込み先で黙って無視されるので使わない） ---------- */
  function ask(text, okLabel) {
    return new Promise((res) => {
      const box = document.getElementById('ask');
      const ok = document.getElementById('ask-ok'), no = document.getElementById('ask-no');
      document.getElementById('ask-t').textContent = text;
      ok.textContent = okLabel || 'はい';
      box.hidden = false;
      ok.focus();
      const key = (e) => { if (e.key === 'Escape') done(false); };
      function done(v) {
        box.hidden = true;
        ok.onclick = no.onclick = box.onclick = null;
        document.removeEventListener('keydown', key);
        res(v);
      }
      ok.onclick = () => done(true);
      no.onclick = () => done(false);
      box.onclick = (e) => { if (e.target === box) done(false); };
      document.addEventListener('keydown', key);
    });
  }

  /* ---------- 音 ---------- */
  const sndBtn = document.getElementById('btn-snd');
  function sndInit() { if (window.TSND) { TSND.start(); TSND.mute(st.muted); paintSnd(); } }
  function paintSnd() {
    sndBtn.textContent = st.muted ? '音：切' : '音：入';
    sndBtn.setAttribute('aria-pressed', String(!st.muted));
  }
  sndBtn.addEventListener('click', () => {
    st.muted = !st.muted; save();
    if (window.TSND) { TSND.start(); TSND.mute(st.muted); }
    paintSnd();
  });
  paintSnd();
  document.addEventListener('pointerdown', () => { if (window.TSND && TSND.ready()) TSND.start(); });

  /* =========================================================
     玄関
     ========================================================= */
  function viewGate() {
    obi.hidden = true;
    document.body.dataset.scene = 'gate';
    const some = st.cleared.some(Boolean);
    stage.innerHTML =
      '<section class="gate">'
      + '<div class="noren"><i></i><i></i><i></i><i></i><i></i><b>六 夜</b></div>'
      + '<h1>六夜の<em>賭場</em></h1>'
      + '<p class="yomi">ろくやのとば</p>'
      + '<div class="lead fadein" style="animation-delay:.2s">' + TB.opening.slice(0, 6).map(l => l || '&nbsp;').join('<br>') + '</div>'
      + '<div class="lead fadein" style="animation-delay:.9s">' + TB.opening.slice(6).map(l => l || '&nbsp;').join('<br>') + '</div>'
      + '<p class="lead q fadein" style="animation-delay:1.6s">' + S(TB.openNote) + '</p>'
      + '<div class="acts fadein" style="animation-delay:2s">'
      + '<button type="button" class="btn shu" id="go">' + (some ? '格子戸を開ける（つづきから）' : '格子戸を開ける') + '</button>'
      + (some ? '<button type="button" class="btn ghost" id="reset">はじめからやり直す</button>' : '')
      + '</div>'
      + '<p class="tiny mt">※賭けるのは「駒」。金ではありません。</p>'
      + '</section>';
    document.getElementById('go').addEventListener('click', () => {
      sndInit();
      if (window.TSND) TSND.hyoshigi(2);
      viewBa();
    });
    const rs = document.getElementById('reset');
    if (rs) rs.addEventListener('click', async () => {
      if (!(await ask('六晩ぶんの記録を消して、はじめからやり直しますか。', '記録を消す'))) return;
      const muted = st.muted;
      st = fresh(); st.muted = muted; save(); viewGate();
    });
  }

  /* =========================================================
     語り
     ========================================================= */
  function viewScene(lines, acts) {
    obi.hidden = true;
    document.body.dataset.scene = 'kata';
    stage.innerHTML = '<div id="kata-host"></div><div class="kata-act" id="kata-act"></div>';
    FX.kataru(document.getElementById('kata-host'), lines);
    const a = document.getElementById('kata-act');
    a.style.animationDelay = '600ms';
    (acts || []).forEach(([label, fn, cls]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = cls || 'btn'; b.textContent = label;
      b.addEventListener('click', fn);
      a.appendChild(b);
      a.appendChild(document.createTextNode(' '));
    });
  }

  /* =========================================================
     賭場（夜えらび）
     ========================================================= */
  function viewBa() {
    obi.hidden = true;
    fucho.hidden = true;
    cur = null;
    TGAME.stop();
    document.body.dataset.scene = 'ba';
    const done = st.cleared.filter(Boolean).length;
    const next = st.cleared.findIndex(v => !v);
    stage.innerHTML =
      '<h2 class="mid center">六夜</h2>'
      + '<p class="sub center">' + (st.ending ? '——朝が来た。' : '潮見町　昭和五十四年 一月　' + (done ? K(done) + '枚　取り返した' : '証文　六枚')) + '</p>'
      + '<div class="chochin" id="chochin"></div>'
      + '<div class="rule"></div>'
      + '<p class="sub center" style="margin-bottom:12px">場の者に声をかける</p>'
      + '<div class="hitos">'
      + '<button type="button" class="hito" data-h="okou">お甲<small>壺振り</small></button>'
      + '<button type="button" class="hito" data-h="inosuke">亥之助<small>下足番</small></button>'
      + '<button type="button" class="hito" data-h="kyaku">常連<small>名は知らぬ</small></button>'
      + '</div>'
      + '<p class="serifu" id="serifu"></p>'
      + '<div class="rule"></div>'
      + '<p class="sub center" style="margin-bottom:12px">取り返した証文</p>'
      + '<div class="shomon" id="shomon"></div>'
      + '<div class="acts center mt">'
      + (next >= 0
        ? '<button type="button" class="btn shu" id="enter">' + K(next + 1) + 'の夜へ　—　' + S(TB.nights[next].name) + '</button>'
        : '<button type="button" class="btn" id="again">もう一度、終いを見る</button>')
      + ' <button type="button" class="btn ghost" id="open-fucho">符牒帳をひらく</button>'
      + '</div>';

    const ch = document.getElementById('chochin');
    TB.nights.forEach((nn, i) => {
      const doneN = st.cleared[i];
      const lock = !doneN && i !== next;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cho' + (doneN ? ' done' : '') + (lock ? ' lock' : '') + (i === next ? ' now' : '');
      b.innerHTML = '<i>' + nn.kanji + '</i><b>' + S(nn.name) + '</b><small>' + (doneN ? '済' : lock ? '——' : '今夜') + '</small>';
      if (!lock) b.addEventListener('click', () => {
        if (!doneN) startNight(i + 1);
        else if (i === 5) showEnd(st.endOk !== false, st.ending === 'pass' ? 0 : 1, false);
        else replay(i);
      });
      ch.appendChild(b);
    });

    const sr = document.getElementById('serifu');
    stage.querySelectorAll('.hito').forEach(b => b.addEventListener('click', () => {
      const who = b.dataset.h;
      const idx = Math.min(5, done);
      const nm = TB.people[who].name;
      sr.classList.remove('on'); void sr.offsetWidth; sr.classList.add('on');
      sr.innerHTML = '<b>' + nm + '</b>' + S(TB.talk[who][idx]);
      if (window.TSND && TSND.ready()) TSND.card();
    }));

    const sh = document.getElementById('shomon');
    TB.shomon.forEach((s, i) => {
      const got = st.cleared[i];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sho' + (got ? '' : ' empty');
      b.style.setProperty('--r', ((i % 3) - 1) * 1.6 + 'deg');
      b.innerHTML = '<i>' + (got ? S(s.head) : '——') + '</i>';
      if (got) b.addEventListener('click', () => {
        sr.classList.remove('on'); void sr.offsetWidth; sr.classList.add('on');
        sr.innerHTML = '<b>' + S(s.head) + '　欄外の書きこみ</b>' + S(s.side);
        if (window.TSND && TSND.ready()) TSND.card();
      });
      sh.appendChild(b);
    });

    const en = document.getElementById('enter');
    if (en) en.addEventListener('click', () => startNight(next + 1));
    const ag = document.getElementById('again');
    if (ag) ag.addEventListener('click', () => showEnd(st.endOk !== false, st.ending === 'pass' ? 0 : 1, false));
    document.getElementById('open-fucho').addEventListener('click', () => openFucho('ban'));
  }

  function replay(i) {
    viewScene([{ w: '', t: TB.nights[i].kanji + 'の夜は、もう流れた。' }].concat(TB.scenes.clear[i] || []), [
      ['賭場へもどる', viewBa]
    ]);
  }

  /* =========================================================
     夜のはじまり
     ========================================================= */
  let entering = false;
  async function startNight(n) {
    if (entering) return;
    entering = true;
    sndInit();
    try { await FX.maku(TB.nights[n - 1].kanji + 'の夜', 1600); } finally { entering = false; }
    const between = n > 1 ? [TB.scenes.between[(n - 2) % TB.scenes.between.length], ''] : [];
    viewScene(between.concat(TB.scenes.enter[n - 1]), [
      ['盆につく', () => sit(n), 'btn shu'],
      ['符牒帳をひらく', () => openFucho('ban'), 'btn ghost']
    ]);
  }

  function sit(n) {
    const nn = TB.nights[n - 1];
    cur = { n, koma: nn.seed, hands: nn.hands, log: [], logCols: [] };
    document.body.dataset.scene = 'yo';
    obi.hidden = false;
    stage.innerHTML =
      '<h2 class="mid center">' + nn.kanji + 'の夜　' + S(nn.name) + '</h2>'
      + '<p class="sub center">' + S(nn.kana ? nn.kana + '　／　' : '') + S(nn.by) + '</p>'
      + '<p class="tiny center" style="max-width:38em;margin:0 auto 4px">' + S(nn.lead) + '</p>'
      + '<div class="bon" id="bon"></div>'
      + '<p class="tiny center">元手 ' + nn.seed + ' 駒／目標 ' + nn.goal + ' 駒／手数 ' + nn.hands + '　—　懐が空になるか手数が尽きたら、この夜はやり直し。</p>';
    paintObi();
    TGAME.start(n, ctx());
  }

  function ctx() {
    return {
      bon: document.getElementById('bon'),
      log: cur.log, logCols: cur.logCols,
      get: () => ({ koma: cur.koma, hands: cur.hands }),
      spend(v) { cur.koma = Math.max(0, cur.koma - v); paintObi(true, -1); },
      pay(v) { cur.koma += v; paintObi(true, 1); },
      hand() { cur.hands = Math.max(0, cur.hands - 1); paintObi(); },
      setHands(v) { cur.hands = v; paintObi(); },
      sync() { cur.log = this.log; cur.logCols = this.logCols; if (!fucho.hidden) paintFucho(); },
      round() {
        const nn = TB.nights[cur.n - 1];
        if (cur.n < 6) {
          if (cur.koma >= nn.goal) { nightClear(); return 'clear'; }
          if (cur.koma <= 0 || cur.hands <= 0) { nightFail(); return 'fail'; }
          return '';
        }
        if (cur.koma <= 0) { nightFail(); return 'fail'; }
        return '';
      },
      bust() { nightFail(); },
      finale(ok, stake) { endNight6(ok, stake); }
    };
  }

  function paintObi(flash, dir) {
    if (!cur) return;
    const nn = TB.nights[cur.n - 1];
    const k = document.getElementById('o-koma');
    k.textContent = cur.koma;
    if (flash) { k.classList.remove('up', 'dn'); void k.offsetWidth; k.classList.add(dir > 0 ? 'up' : 'dn'); }
    document.getElementById('o-goal').textContent = nn.goal;
    document.getElementById('o-hands').textContent = cur.hands;
  }

  function nightClear() {
    const c = cur; c.over = true;
    const i = c.n - 1;
    st.cleared[i] = true;
    st.top = Math.max(st.top || 0, cur.koma);
    save();
    setTimeout(async () => {
      if (cur !== c) return;
      obi.hidden = true;
      if (window.TSND && TSND.ready()) TSND.hyoshigi(2);
      await FX.maku('', 700);
      viewScene((TB.scenes.clear[i] || []).concat([
        { w: '', t: '' },
        { w: '', t: '〈' + TB.shomon[i].head + '〉　欄外に、こう書いてある。' },
        { w: '', t: '「' + TB.shomon[i].side + '」' }
      ]), [['賭場へもどる', viewBa, 'btn shu']]);
    }, 1400);
  }

  function nightFail() {
    const c = cur;
    if (c.over) return;
    c.over = true;
    st.fails = (st.fails || 0) + 1; save();
    const n = c.n;
    setTimeout(async () => {
      if (cur !== c) return;
      obi.hidden = true;
      await FX.maku('', 600);
      viewScene((TB.scenes.fail[0] || []).concat([
        { w: '', t: '' },
        { w: '', t: '——' + TB.nights[n - 1].kanji + 'の夜。まだ終わっていない。' }
      ]), [
        ['もういっぺん座る', () => sit(n), 'btn shu'],
        ['符牒帳を読む', () => openFucho('kiku'), 'btn ghost'],
        ['今夜はやめる', viewBa, 'btn ghost']
      ]);
    }, 1300);
  }

  /* 六の夜の終わり */
  function endNight6(ok, stake) {
    if (cur) cur.over = true;
    st.cleared[5] = true;
    st.ending = (ok && stake === 0) ? 'pass' : 'bet';
    st.endOk = ok;
    save();
    showEnd(ok, stake, true);
  }

  /* ---------- 帯のボタン ---------- */
  document.getElementById('btn-fucho').addEventListener('click', () => openFucho(cur ? 'kon' : 'ban'));
  document.getElementById('btn-redo').addEventListener('click', async () => {
    if (!cur || cur.over) return;
    const c = cur;
    if (!(await ask('この夜を、元手からやり直しますか。', 'やり直す'))) return;
    if (cur !== c || c.over) return;          // 考えているあいだに勝負がついた
    sit(c.n);
  });

  /* =========================================================
     符牒帳
     ========================================================= */
  document.getElementById('fucho-close').addEventListener('click', () => { fucho.hidden = true; });
  function openFucho(tab) {
    fuchoTab = tab || 'ban';
    fucho.hidden = false;
    paintFucho();
    if (window.TSND && TSND.ready()) TSND.card();
  }

  function nightIdx() {
    if (cur) return cur.n - 1;
    const i = st.cleared.findIndex(v => !v);
    return i < 0 ? 5 : i;
  }

  function paintFucho() {
    const i = nightIdx();
    document.getElementById('fucho-sub').textContent = TB.nights[i].kanji + 'の夜　' + TB.nights[i].name;
    const tabs = [];
    if (cur) tabs.push(['kon', '今夜の盆']);
    tabs.push(['ban', '前の晩の帳面'], ['kiku', '亥之助に聞く'], ['te', '覚えた手']);
    if (!tabs.some(t => t[0] === fuchoTab)) fuchoTab = 'ban';
    const tb = document.getElementById('fucho-tab');
    tb.innerHTML = tabs.map(t => '<button type="button" data-t="' + t[0] + '" class="' + (t[0] === fuchoTab ? 'on' : '') + '">' + t[1] + '</button>').join('');
    tb.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { fuchoTab = b.dataset.t; paintFucho(); }));
    document.getElementById('fucho-b').innerHTML = fuchoBody(i);
    wireHints();
  }

  function tbl(cols, rows) {
    let s = '<div class="tw"><table><thead><tr>' + cols.map(c => '<th>' + S(c) + '</th>').join('') + '</tr></thead><tbody>';
    rows.forEach(r => {
      if (r && r.bar) { s += '<tr class="bar"><td colspan="' + cols.length + '">' + S(r.bar) + '</td></tr>'; return; }
      s += '<tr>' + r.map(v => '<td>' + S(v) + '</td>').join('') + '</tr>';
    });
    return s + '</tbody></table></div>';
  }

  function fuchoBody(i) {
    if (fuchoTab === 'kon') {
      if (!cur || !cur.log.length) return '<h3>今夜の盆</h3><p>まだ一度も勝負していない。</p>';
      return '<h3>今夜の盆</h3>' + tbl(cur.logCols, cur.log);
    }
    if (fuchoTab === 'kiku') {
      const done = st.cleared[i], c = (st.clock || {})[i] || 0;
      return '<h3>亥之助に聞く</h3>'
        + '<p class="memo">' + (done ? 'この夜は、もう流れた。三枚とも読んでかまわねえ。' : '考えこんでる奴にだけ、一枚ずつ見せてやる。三枚目まで読んでも、恥じゃねえよ。') + '</p>'
        + TB.hints[i].map((h, k) => {
          const left = done ? 0 : HINT_AT[k] - c;
          if (left > 0) return '<div class="hcard locked"><button type="button" disabled>' + S(h.t) + '<span>あと ' + fmtLeft(left) + '</span></button></div>';
          return '<div class="hcard"><button type="button" data-k="' + k + '">' + S(h.t) + '<span>ひらく</span></button>'
            + '<div class="hb" hidden>' + S(h.b) + '</div></div>';
        }).join('')
        + (done ? '' : '<p class="memo" style="margin-top:14px">亥之助は、あんたが盆についているか、この帳面を読んでいるあいだの様子を見ている。</p>');
    }
    if (fuchoTab === 'te') {
      const got = TB.nights.filter((n, k) => st.cleared[k] && k < 5);
      if (!got.length) return '<h3>覚えた手</h3><p>まだ、ひとつも見破っていない。</p>';
      const note = {
        1: '壺を置く場所（中／端）と、そのあと袖を直すかどうか。',
        2: '六回で札が一巡する。繰り直してから同じ数は二度出ない。',
        3: '山を置くとき底に見えた札が、そのまま親の伏せ札。',
        4: '樋の乾き・灯り・重り。二つ重なると決まって勝つ鼠がいる。',
        5: '盤を見た時点で、先手が勝つ盤か後手が勝つ盤かが決まっている。'
      };
      return '<h3>覚えた手</h3>' + got.map(n =>
        '<h4>' + S(n.te) + '（' + S(n.teKana) + '）　' + n.kanji + 'の夜／' + S(n.name) + '</h4><p>' + S(note[n.n]) + '</p>').join('');
    }
    /* 前の晩の帳面 */
    const R = TB.records;
    if (i === 0) return '<h3>前の晩の盆（丁半）</h3><p class="memo">お甲の所作と、出た目。十二回ぶん。</p>' + tbl(R.choohan.cols, R.choohan.rows);
    if (i === 1) {
      const rows = [];
      R.tehon.forEach(b => { rows.push({ bar: '——— ' + b.mark + ' ———' }); b.seq.forEach((v, k) => rows.push([K(k + 1) + '回目', K(v)])); });
      return '<h3>前の晩の盆（手本引き）</h3><p class="memo">卯之吉が伏せた札。繰り直しの区切りも書いてある。</p>' + tbl(['何回目', '親の札'], rows);
    }
    if (i === 2) return '<h3>前の晩の盆（かぶ）</h3><p class="memo">底に見えた札と、あとで開いた親の札。</p>' + tbl(R.kabu.cols, R.kabu.rows);
    if (i === 3) return '<h3>鼠の成績表</h3><p class="memo">二十四走りぶん。盆の具合も書いてある。</p>' + tbl(R.nezumi.cols, R.nezumi.rows.map(r => [r[0], r[1], r[2], K(r[3]) + '番']));
    if (i === 4) return '<h3>石取りの記録</h3><p class="memo">柊側が取った先後と、その結果。負けた記録は一つもない。</p>' + tbl(R.ishi.cols, R.ishi.rows);
    return '<h3>六の夜</h3><p class="memo">帳面はここで終わっている。あとの頁は白紙だ。</p>'
      + '<p>——これまでの五晩で見破った手を、そのまま使え。「覚えた手」の頁にまとめてある。</p>';
  }

  /* ---------- 考えている時間（符牒帳は、時間がたつと一枚ずつ見せてもらえる） ----------
     その夜の盆についているか、符牒帳を読んでいるあいだ、画面が見えているときだけ数える。 */
  const HINT_AT = [3, 6, 10].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const pagesOpen = i => HINT_AT.filter(t => ((st.clock || {})[i] || 0) >= t).length;
  setInterval(() => {
    if (document.visibilityState !== 'visible' || document.body.dataset.scene === 'gate') return;
    st.playMs = (st.playMs || 0) + 5000;
    const i = nightIdx();
    if ((cur || !fucho.hidden) && !st.cleared[i]) {
      const before = pagesOpen(i);
      st.clock = st.clock || {}; st.clock[i] = (st.clock[i] || 0) + 5000;
      if (!fucho.hidden && fuchoTab === 'kiku' && pagesOpen(i) !== before) {
        const open = [...document.querySelectorAll('#fucho-b .hcard .hb:not([hidden])')].map(b => b.previousElementSibling.dataset.k);
        paintFucho();
        open.forEach(k => { const b = document.querySelector('#fucho-b .hcard > button[data-k="' + k + '"]'); if (b) b.click(); });
      }
    }
    save();
  }, 5000);

  function wireHints() {
    document.querySelectorAll('#fucho-b .hcard > button').forEach(b => {
      b.addEventListener('click', () => {
        const body = b.nextElementSibling;
        const open = body.hidden;
        body.hidden = !open;
        b.querySelector('span').textContent = open ? 'とじる' : 'ひらく';
        if (open && +b.dataset.k === 2) { st.ansUsed = true; save(); }
        if (window.TSND && TSND.ready()) TSND.card();
      });
    });
  }

  /* =========================================================
     終幕
     ========================================================= */
  async function showEnd(ok, stake, first) {
    obi.hidden = true; fucho.hidden = true;
    const F = TB.finale;
    const veil = document.getElementById('veil');
    const end = document.getElementById('end');
    veil.hidden = false; end.hidden = false;
    end.innerHTML = '<div class="end-in" id="end-in"></div>';
    const host = document.getElementById('end-in');
    const add = (cls) => { const d = document.createElement('div'); d.className = cls || ''; host.appendChild(d); return d; };
    const follow = setInterval(() => {
      if (end.hidden) { clearInterval(follow); return; }
      if (end.scrollHeight - end.scrollTop - end.clientHeight < 260) end.scrollTo({ top: end.scrollHeight, behavior: 'smooth' });
    }, 450);
    /* とばす：残りの間（ま）をなくして、全部すぐに出す */
    let fast = false;
    const pend = new Set();
    const skip = document.createElement('button');
    skip.type = 'button'; skip.className = 'end-skip'; skip.textContent = 'とばす';
    skip.addEventListener('click', () => {
      fast = true;
      pend.forEach(f => f()); pend.clear();
      host.querySelectorAll('.kata p, .side').forEach(p => { p.style.animationDelay = '0ms'; });
      skip.remove();
    });
    end.appendChild(skip);
    const W = (ms) => fast ? Promise.resolve() : new Promise((r) => {
      const done = () => { clearTimeout(t); pend.delete(done); r(); };
      const t = setTimeout(done, ms);
      pend.add(done);
    });
    const seq = async (lines, wait) => {
      const d = add('');
      const ms = FX.kataru(d, lines, { step: fast ? 0 : 420 });
      if (fast) d.querySelectorAll('p').forEach(p => { p.style.animationDelay = '0ms'; });
      if (wait !== false) await W(Math.min(ms + 500, 7200));
    };

    if (window.TSND && TSND.ready()) { TSND.hyoshigi(1); }
    await W(400);
    await seq(F.common1);

    /* 証文の欄外、六枚 */
    const sl = add('side-list');
    TB.shomon.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'side'; d.style.animationDelay = (fast ? 0 : i * 260) + 'ms';
      d.textContent = s.side;
      sl.appendChild(d);
    });
    if (window.TSND && TSND.ready()) TSND.card();
    await W(TB.shomon.length * 260 + 900);

    await seq(F.common2);
    if (window.TSND && TSND.ready()) TSND.seki();
    await W(500);

    if (!ok) await seq([{ w: '柊', t: 'そこに手はなかったよ。……だが、それでいい。' }]);
    await seq((ok && stake === 0) ? F.passEnd : F.betEnd);
    await seq(F.tail);

    const t = add('');
    t.innerHTML = '<p class="end-title">六夜の賭場</p>'
      + '<p class="end-sub">' + ((ok && stake === 0) ? '終　「素（す）」' : '終　「勝ち逃げ」') + '</p>'
      + '<div class="hanko"><i>主人交代</i></div>';
    if (window.TSND && TSND.ready()) TSND.win();
    await W(900);
    skip.remove();

    const tags = [];
    tags.push(st.fails ? F.tags.someFail(K(st.fails)) : F.tags.noFail);
    tags.push(st.ansUsed ? F.tags.usedAnswer : F.tags.noAnswer);
    const g = add('');
    g.innerHTML = tags.map(x => '<p class="end-tag">' + S(x) + '</p>').join('')
      + '<p class="end-tag" style="color:#8A8170">' + ((ok && stake === 0)
        ? 'もうひとつの終いがある。最後の盆で、張って言い当てたとき。'
        : 'もうひとつの終いがある。最後の盆で、張らずに言い当てたとき。') + '</p>'
      + '<div class="end-acts">'
      + '<button type="button" class="btn" id="e-ba">賭場へもどる</button>'
      + '<button type="button" class="btn ghost" id="e-again">六の夜をやり直す</button>'
      + '</div>';
    setTimeout(() => clearInterval(follow), 1500);
    document.getElementById('e-ba').addEventListener('click', close);
    document.getElementById('e-again').addEventListener('click', () => { close(); sit(6); });

    function close() { veil.hidden = true; end.hidden = true; end.innerHTML = ''; viewBa(); }
  }

  /* =========================================================
     起動
     ========================================================= */
  const cv = document.getElementById('smoke');
  if (cv) FX.smoke(cv);
  viewGate();
})();
