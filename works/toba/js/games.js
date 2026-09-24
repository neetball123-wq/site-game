/* =========================================================
   六夜の賭場 — 六つの盆
   どの盆にも「手」が入っている。運で勝てる盆はひとつもない。
   ========================================================= */
window.TGAME = (() => {
  let C = null;            // app から渡される文脈
  const S = FX.esc, K = FX.kan;
  const $ = (s) => C.bon.querySelector(s);
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const snd = (fn, ...a) => { if (window.TSND && TSND.ready() && TSND[fn]) TSND[fn](...a); };

  /* やり直したり席を立ったりしたら、前の勝負の続きは二度と動かない */
  let gen = 0, last = 1;
  const wait = (ms) => { const g = gen; return new Promise(r => setTimeout(() => { if (g === gen) r(); }, ms)); };
  const later = (fn, ms) => { const g = gen; setTimeout(() => { if (g === gen) fn(); }, ms); };

  /* ---------- 盆の外枠 ---------- */
  function shell(title, sub, note) {
    C.bon.innerHTML =
      '<div class="bon-h"><b>' + S(title) + '</b><small>' + S(sub || '') + '</small></div>'
      + (note ? '<p class="bon-note">' + note + '</p>' : '')
      + '<div id="g-area"></div>'
      + '<p class="deki" id="g-msg" aria-live="polite"></p>'
      + '<div id="g-ctl"></div>';
  }
  const area = () => $('#g-area');
  const ctl = () => $('#g-ctl');
  function msg(html, kind) {
    const m = $('#g-msg');
    m.innerHTML = kind ? '<span class="' + kind + '">' + html + '</span>' : html;
    m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop');
  }

  /* ---------- 賭け金の操作盤 ---------- */
  function makeStake(cap) {
    const el = document.createElement('div');
    el.className = 'stake';
    let v = last;
    const max = () => Math.max(0, Math.min(cap, C.get().koma));
    const draw = () => {
      const m = max();
      v = Math.max(m > 0 ? 1 : 0, Math.min(m, v));
      el.innerHTML = '<span>賭け</span>'
        + '<button type="button" data-d="-10">−十</button>'
        + '<button type="button" data-d="-1">−一</button>'
        + '<b>' + v + '</b>'
        + '<button type="button" data-d="1">＋一</button>'
        + '<button type="button" data-d="10">＋十</button>'
        + '<button type="button" data-s="half">半分</button>'
        + '<button type="button" data-s="max">上限</button>';
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const m = max();
      if (b.dataset.d) v += +b.dataset.d;
      else if (b.dataset.s === 'half') v = Math.floor(m / 2);
      else v = m;
      v = Math.max(1, Math.min(m, v));
      last = v;
      draw(); snd('chip');
    });
    draw();
    return { el, get: () => Math.min(max(), Math.max(1, v)), refresh: draw };
  }

  function btn(label, cls, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls || 'btn'; b.innerHTML = label;
    b.addEventListener('click', fn);
    return b;
  }
  function row(...els) {
    const d = document.createElement('div');
    d.className = 'hari';
    els.forEach(e => e && d.appendChild(e));
    return d;
  }

  /* 一回ぶんの決着を app に伝える。戻り値が空でなければ夜は終わり */
  function settle() { return C.round(); }
  function nextBtn(fn, label) {
    ctl().innerHTML = '';
    ctl().appendChild(row(btn(label || '次の勝負', 'btn', fn)));
  }

  /* =========================================================
     一の夜　丁半 —— 手「袖引き」
     置き（中／端）と袖（直す／直さず）の、どちらか片方だけが
     当てはまれば丁。煙管は関係ない。
     ========================================================= */
  function g1() {
    const n = TB.nights[0];
    let cur = null;

    function stand() {
      shell('丁半', n.by, n.how.map(h => S(h)).join('<br>'));
      area().innerHTML =
        '<div class="tsubo-wrap">'
        + '<div class="tsubo" id="tsubo"><i></i></div>'
        + '<div class="shosa" id="shosa"></div>'
        + '<div class="sai" id="sai"></div>'
        + '</div>';
      msg('お甲が壺を持った。');
      nextBtn(shake, '壺を振らせる');
    }

    async function shake() {
      ctl().innerHTML = '';
      const t = $('#tsubo');
      t.className = 'tsubo shake';
      snd('rattle', 0.72);
      await wait(740);
      t.className = 'tsubo';
      snd('thud');
      /* 所作を決め、そこから出目を決める */
      const oki = Math.random() < 0.5 ? '中' : '端';
      const sode = Math.random() < 0.5 ? '直す' : '直さず';
      const kiseru = Math.random() < 0.5 ? '吸う' : '吸わず';
      const cho = ((oki === '端') !== (sode === '直す'));   // 片方だけ真なら丁
      let a, b;
      do { a = rnd(6) + 1; b = rnd(6) + 1; } while (((a + b) % 2 === 0) !== cho);
      cur = { oki, sode, kiseru, a, b, cho };
      const sh = $('#shosa');
      sh.className = 'shosa on';
      sh.innerHTML =
        '<span>壺を<b>' + oki + '</b>に置いた</span>'
        + '<span>袖を<b>' + sode + '</b></span>'
        + '<span>煙管を<b>' + kiseru + '</b></span>';
      await wait(560);
      msg('さあ、張った張った。');
      bet();
    }

    function bet() {
      const st = makeStake(n.cap);
      const p = (label, v) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pick';
        b.innerHTML = label + '<small>' + (v === 'k' ? '張らずに見る' : '当たれば同額') + '</small>';
        b.addEventListener('click', () => open(v, v === 'k' ? 0 : st.get()));
        return b;
      };
      ctl().innerHTML = '';
      ctl().appendChild(row(st.el));
      const picks = document.createElement('div');
      picks.className = 'picks';
      picks.append(p('丁', 'cho'), p('半', 'han'), p('見（けん）', 'k'));
      ctl().appendChild(picks);
    }

    async function open(pick, stake) {
      ctl().innerHTML = '';
      if (stake > 0) { C.spend(stake); snd('chip', true); }
      C.hand();
      const t = $('#tsubo');
      t.className = 'tsubo open';
      await wait(360);
      const sai = $('#sai');
      sai.innerHTML = FX.die(cur.a) + FX.die(cur.b);
      [...sai.children].forEach((d, i) => { setTimeout(() => d.classList.add('on'), i * 150); });
      snd('card');
      await wait(620);
      const label = cur.cho ? '丁' : '半';
      const sum = cur.a + cur.b;
      let res;
      if (pick === 'k') { res = '見送り。' + K(cur.a) + '・' + K(cur.b) + '＝' + K(sum) + 'の<b>' + label + '</b>。'; msg(res); }
      else if ((pick === 'cho') === cur.cho) {
        C.pay(stake * 2); snd('win');
        msg(K(cur.a) + '・' + K(cur.b) + '＝' + K(sum) + 'の<b>' + label + '</b>。当たり。＋' + stake + '駒', 'win');
      } else {
        snd('lose');
        msg(K(cur.a) + '・' + K(cur.b) + '＝' + K(sum) + 'の<b>' + label + '</b>。外れ。−' + stake + '駒', 'lose');
      }
      C.log.push([cur.oki, cur.sode, cur.kiseru, K(cur.a) + '・' + K(cur.b), label]);
      C.logCols = ['置き', '袖', '煙管', '出目', ''];
      C.sync();
      if (settle()) return;
      nextBtn(() => { $('#tsubo').className = 'tsubo'; $('#shosa').innerHTML = ''; $('#sai').innerHTML = ''; msg('お甲が壺を持った。'); nextBtn(shake, '壺を振らせる'); });
    }

    stand();
  }

  /* =========================================================
     二の夜　手本引き —— 手「一巡」
     六回で札が一巡する。繰り直しから同じ数は二度出ない。
     ========================================================= */
  function g2() {
    const n = TB.nights[1];
    let deck = [], at = 6, picked = new Set();
    const MULT = { 1: 5, 2: 2.5, 3: 1.5 };

    function newBlock() { deck = shuffle([1, 2, 3, 4, 5, 6]); at = 0; }

    function stand() {
      shell('手本引き', n.by, n.how.map(h => S(h)).join('<br>'));
      draw();
    }

    function draw() {
      if (at >= 6) { newBlock(); C.log.push({ bar: '——— 繰り直し ———' }); }
      picked = new Set();
      area().innerHTML =
        '<p class="junmark">繰り直しから <b>' + K(at + 1) + '</b> 回目</p>'
        + '<div class="kuri" id="kuri">'
        + [1, 2, 3, 4, 5, 6].map(v => '<div class="fuda" data-v="' + v + '" role="button" tabindex="0">' + K(v) + '</div>').join('')
        + '</div>'
        + '<div class="kuri" id="oya" style="margin-top:18px"><div class="fuda back" id="oyafuda"></div></div>';
      $('#kuri').addEventListener('click', (e) => {
        const f = e.target.closest('.fuda'); if (!f) return;
        const v = +f.dataset.v;
        if (picked.has(v)) picked.delete(v);
        else { if (picked.size >= 3) { msg('張れるのは三本までだ。', 'lose'); return; } picked.add(v); }
        f.classList.toggle('on', picked.has(v));
        snd('card');
        info();
      });
      $('#kuri').addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.fuda')) { e.preventDefault(); e.target.click(); }
      });
      msg('札を選べ。一本＝五倍、二本＝二倍半、三本＝一倍半。');
      bet();
    }

    let stakeBox = null;
    function info() {
      const k = picked.size;
      const m = $('#g-msg');
      if (!k) { msg('札を選べ。一本＝五倍、二本＝二倍半、三本＝一倍半。'); return; }
      msg([...picked].sort().map(K).join('・') + ' の' + K(k) + '本張り　配当 <b>' + MULT[k] + '倍</b>');
    }

    function bet() {
      stakeBox = makeStake(n.cap);
      ctl().innerHTML = '';
      ctl().appendChild(row(stakeBox.el));
      const picks = document.createElement('div');
      picks.className = 'picks';
      picks.append(
        btn('張る', 'pick wide', () => { if (!picked.size) { msg('札を選んでいない。', 'lose'); return; } go(stakeBox.get()); }),
        btn('見送る<small>張らずに次へ</small>', 'pick', () => go(0))
      );
      ctl().appendChild(picks);
    }

    async function go(stake) {
      ctl().innerHTML = '';
      const set = new Set(picked);
      if (stake > 0) { C.spend(stake); snd('chip', true); }
      C.hand();
      const ans = deck[at]; at++;
      const f = $('#oyafuda');
      f.classList.add('flip');
      await wait(250);
      f.classList.remove('back'); f.textContent = K(ans);
      snd('card');
      await wait(420);
      const hit = set.has(ans);
      if (stake === 0) msg('見送り。親の札は <b>' + K(ans) + '</b>。');
      else if (hit) {
        const back = Math.round(stake * MULT[set.size]);
        C.pay(back); snd('win');
        msg('親の札は <b>' + K(ans) + '</b>。当たり。＋' + (back - stake) + '駒', 'win');
      } else { snd('lose'); msg('親の札は <b>' + K(ans) + '</b>。外れ。−' + stake + '駒', 'lose'); }
      C.log.push([K(at) + '回目', K(ans), set.size ? [...set].sort().map(K).join('・') : '—', stake ? stake + '駒' : '見送り']);
      C.logCols = ['何回目', '親の札', '張った札', '賭け'];
      C.sync();
      if (settle()) return;
      nextBtn(draw);
    }

    stand();
  }

  /* =========================================================
     三の夜　おいちょかぶ —— 手「底札」
     山を置くとき底に見えた札が、そのまま親の伏せ札。
     親は二枚の合計（一の位）が二以下なら引く。
     ========================================================= */
  function g3() {
    const n = TB.nights[2];
    let deck = [], mine = [], oyaUp = 0, oyaHole = 0, soko = 0, stakeBox = null;
    const mod = (a) => a % 10;
    const sum = (arr) => mod(arr.reduce((x, y) => x + y, 0));

    function build() {
      deck = [];
      for (let v = 1; v <= 10; v++) for (let i = 0; i < 4; i++) deck.push(v);
      shuffle(deck);
    }

    function stand() {
      shell('おいちょかぶ', n.by, n.how.map(h => S(h)).join('<br>'));
      deal();
    }

    async function deal() {
      ctl().innerHTML = '';
      build();
      soko = deck.pop();            // 切るとき底に見えた札 ＝ 親の伏せ札
      oyaHole = soko;
      mine = [deck.pop(), deck.pop()];
      oyaUp = deck.pop();
      area().innerHTML =
        '<p class="soko">山を置くとき、底がちらと見えた——<b id="soko">' + K(soko) + '</b></p>'
        + '<div class="kabu-row"><span class="te-l">親</span>'
        + '<div class="te" id="oya-te"><div class="fuda sm deal">' + K(oyaUp) + '</div><div class="fuda sm back deal" id="oya-hole"></div></div>'
        + '<div class="kabu-sum" id="oya-sum">？<small>親の出来</small></div></div>'
        + '<div class="kabu-row"><span class="te-l">こちら</span>'
        + '<div class="te" id="my-te">' + mine.map(v => '<div class="fuda sm deal">' + K(v) + '</div>').join('') + '</div>'
        + '<div class="kabu-sum" id="my-sum">' + sum(mine) + '<small>こちらの出来</small></div></div>';
      snd('card'); await wait(160); snd('card');
      msg('引くか、止めるか。それとも見（けん）か。');
      bet();
    }

    function bet() {
      stakeBox = makeStake(n.cap);
      ctl().innerHTML = '';
      ctl().appendChild(row(stakeBox.el));
      const picks = document.createElement('div');
      picks.className = 'picks';
      picks.append(
        btn('引く<small>山の上から一枚</small>', 'pick', () => go(stakeBox.get(), true)),
        btn('そのまま勝負<small>二枚で勝負</small>', 'pick', () => go(stakeBox.get(), false)),
        btn('見（けん）<small>この回は降りる</small>', 'pick', () => go(0, false))
      );
      ctl().appendChild(picks);
    }

    async function go(stake, hit) {
      ctl().innerHTML = '';
      if (stake > 0) { C.spend(stake); snd('chip', true); }
      C.hand();
      if (stake === 0) {
        msg('見送り。札を伏せた。');
        C.log.push([K(soko), K(oyaUp), '—', '—', '見']);
        C.logCols = ['底の札', '親の表', '親の出来', 'こちらの出来', '結果'];
        C.sync();
        if (settle()) return;
        nextBtn(deal); return;
      }
      if (hit) {
        const c = deck.pop(); mine.push(c);
        const el = document.createElement('div');
        el.className = 'fuda sm deal'; el.textContent = K(c);
        $('#my-te').appendChild(el); snd('card');
        $('#my-sum').innerHTML = sum(mine) + '<small>こちらの出来</small>';
        await wait(520);
      }
      /* 親 */
      const hole = $('#oya-hole');
      hole.classList.add('flip'); await wait(240);
      hole.classList.remove('back'); hole.textContent = K(oyaHole); snd('card');
      let oya = [oyaUp, oyaHole];
      await wait(480);
      if (sum(oya) <= 2) {
        const c = deck.pop(); oya.push(c);
        const el = document.createElement('div');
        el.className = 'fuda sm deal'; el.textContent = K(c);
        $('#oya-te').appendChild(el); snd('card');
        await wait(460);
      }
      const my = sum(mine), oy = sum(oya);
      $('#oya-sum').innerHTML = oy + '<small>親の出来</small>';
      await wait(300);
      const win = my > oy;
      if (win) { C.pay(stake * 2); snd('win'); msg('こちら <b>' + my + '</b>　親 <b>' + oy + '</b>。勝ち。＋' + stake + '駒', 'win'); }
      else { snd('lose'); msg('こちら <b>' + my + '</b>　親 <b>' + oy + '</b>。' + (my === oy ? '同目は親の勝ち。' : '負け。') + '−' + stake + '駒', 'lose'); }
      C.log.push([K(soko), K(oyaUp), String(oy), String(my), win ? '勝ち' : '負け']);
      C.logCols = ['底の札', '親の表', '親の出来', 'こちらの出来', '結果'];
      C.sync();
      if (settle()) return;
      nextBtn(deal);
    }

    stand();
  }

  /* =========================================================
     四の夜　鼠競べ —— 手「盆濡らし」
     三番は〈濡＋暗〉で必ず勝つ。五番は〈乾＋重りあり〉で必ず勝つ。
     ========================================================= */
  function g4() {
    const n = TB.nights[3];
    let at = 0, pick = 0, stakeBox = null;
    const COL = ['#E8DCC3', '#C9A227', '#DA4A3B', '#8FB7A0', '#9FC3E8', '#C6A0D8'];

    function winner(r) {
      if (r.hi === '濡' && r.akari === '暗') return 3;
      if (r.hi === '乾' && r.omori === '有') return 5;
      return [1, 2, 4, 6][rnd(4)];     // 条件の外では、三番も五番も勝たない
    }

    function stand() {
      shell('鼠競べ', n.by, n.how.map(h => S(h)).join('<br>'));
      draw();
    }

    function draw() {
      const r = TB.races[at];
      pick = 0;
      area().innerHTML =
        '<p class="junmark">第 ' + K(at + 1) + ' 走　（全八走）</p>'
        + '<div class="jouken"><span>樋は <u>' + (r.hi === '濡' ? '濡れて' : '乾いて') + '</u>いる</span><span>灯りは <u>' + (r.akari === '明' ? '明るい' : '暗い') + '</u></span><span>重りは <u>' + (r.omori === '有' ? 'あり' : 'なし') + '</u></span></div>'
        + '<div class="toi' + (r.hi === '濡' ? ' wet' : '') + (r.akari === '暗' ? ' dark' : '') + '" id="toi">'
        + TB.mice.map((m, i) =>
          '<div class="lane"><span class="nm"><i>' + K(m.n) + '</i>' + m.name + '</span>'
          + '<span class="track"><span class="mz" id="mz' + m.n + '">' + FX.mouse(COL[i]) + '</span></span>'
          + '<span class="od">' + r.odds[i].toFixed(1) + '倍</span></div>').join('')
        + '</div>';
      msg('どの鼠に張る。配当は貼り出してあるとおりだ。');
      bet(r);
    }

    function bet(r) {
      stakeBox = makeStake(n.cap);
      ctl().innerHTML = '';
      ctl().appendChild(row(stakeBox.el));
      const picks = document.createElement('div');
      picks.className = 'picks';
      TB.mice.forEach((m, i) => {
        picks.appendChild(btn(K(m.n) + '番 ' + m.name + '<small>' + r.odds[i].toFixed(1) + '倍</small>', 'pick', (e) => {
          pick = m.n; snd('chip');
          [...picks.children].forEach(c => c.classList.remove('on'));
          e.currentTarget.classList.add('on');
          msg(K(m.n) + '番「' + m.name + '」に ' + stakeBox.get() + ' 駒。');
        }));
      });
      ctl().appendChild(picks);
      ctl().appendChild(row(
        btn('走らせる', 'btn shu', () => { if (!pick) { msg('鼠を選んでいない。', 'lose'); return; } go(stakeBox.get()); }),
        btn('見送る', 'btn ghost', () => go(0))
      ));
    }

    async function go(stake) {
      ctl().innerHTML = '';
      const r = TB.races[at];
      if (stake > 0) { C.spend(stake); snd('chip', true); }
      C.hand();
      const w = winner(r);
      msg('——用意。');
      await wait(500);
      snd('run', 2.3);
      /* 走らせる。勝ち鼠が最初に端へ着くように速さを割り振る */
      const dur = 2300;
      const t0 = performance.now();
      const speeds = TB.mice.map(m => m.n === w ? 1 : 0.72 + Math.random() * 0.2);
      const wob = TB.mice.map(() => Math.random() * 6.28);
      for (;;) {
        const k = Math.min(1, (performance.now() - t0) / dur);
        TB.mice.forEach((m, i) => {
          const el = C.bon.querySelector('#mz' + m.n);
          if (!el) return;
          const base = Math.min(1, k * speeds[i] * 1.04);
          const j = k < 1 ? Math.sin(k * 26 + wob[i]) * 0.012 : 0;
          el.style.left = 'calc(' + Math.max(0, Math.min(1, base + j)) * 100 + '% - ' + (base * 20) + 'px)';
        });
        if (k >= 1) break;
        await wait(16);
      }
      await wait(220);
      const mm = TB.mice[w - 1];
      if (stake === 0) msg('見送り。<b>' + K(w) + '番「' + mm.name + '」</b>の勝ち。');
      else if (pick === w) {
        const back = Math.round(stake * r.odds[w - 1]);
        C.pay(back); snd('win');
        msg('<b>' + K(w) + '番「' + mm.name + '」</b>の勝ち。当たり。＋' + (back - stake) + '駒', 'win');
      } else { snd('lose'); msg('<b>' + K(w) + '番「' + mm.name + '」</b>の勝ち。外れ。−' + stake + '駒', 'lose'); }
      C.log.push([r.hi, r.akari, r.omori, K(w) + '番', stake ? K(pick) + '番に' + stake + '駒' : '見送り']);
      C.logCols = ['樋', '灯り', '重り', '勝ち', '張り'];
      C.sync(); at++;
      if (at >= TB.races.length) { C.setHands(0); }
      if (settle()) return;
      nextBtn(draw, '次の走り');
    }

    stand();
  }

  /* =========================================================
     五の夜　石取り —— 手「先後」
     三山崩し（最後の一個を取ったら負け＝逆取り）。
     排他的論理和が0なら後手、0でなければ先手。
     ただし山がすべて一個以下のときだけ逆になる。
     ========================================================= */
  function moverLoses(p) {
    const big = p.filter(x => x > 1).length;
    if (big === 0) return p.filter(x => x === 1).length % 2 === 1;
    return (p[0] ^ p[1] ^ p[2]) === 0;
  }
  function bestMove(p) {
    const big = p.filter(x => x > 1).length;
    if (big === 0) {
      const i = p.findIndex(x => x === 1);
      return i >= 0 ? [i, 1] : null;
    }
    if (big === 1) {
      const i = p.findIndex(v => v > 1);
      const ones = p.filter((v, j) => j !== i && v === 1).length;
      return (ones % 2 === 1) ? [i, p[i]] : [i, p[i] - 1];
    }
    const x = p[0] ^ p[1] ^ p[2];
    if (x !== 0) {
      for (let i = 0; i < 3; i++) { const t = p[i] ^ x; if (t < p[i]) return [i, p[i] - t]; }
    }
    let m = 0;
    for (let i = 1; i < 3; i++) if (p[i] > p[m]) m = i;
    return p[m] > 0 ? [m, 1] : null;
  }

  function g5() {
    const n = TB.nights[4];
    let at = 0, piles = [], stake = 0, myTurn = true, sel = null, stakeBox = null;

    function stand() {
      shell('石取り', n.by, n.how.map(h => S(h)).join('<br>'));
      setup();
    }

    function setup() {
      piles = TB.boards[at].slice();
      sel = null;
      area().innerHTML =
        '<p class="junmark">第 ' + K(at + 1) + ' 勝負　（全六勝負）　盤 ' + piles.map(K).join('・') + '</p>'
        + board()
        + '<p class="teban" id="teban">先手か、後手か。</p>';
      msg('先に打つか、後に打つか。決めてから張れ。');
      stakeBox = makeStake(n.cap);
      ctl().innerHTML = '';
      ctl().appendChild(row(stakeBox.el));
      const picks = document.createElement('div');
      picks.className = 'picks';
      picks.append(
        btn('先手をとる<small>こちらから打つ</small>', 'pick wide', () => begin(true)),
        btn('後手をとる<small>相手から打たせる</small>', 'pick wide', () => begin(false))
      );
      ctl().appendChild(picks);
    }

    function board() {
      return '<div class="yama" id="yama">' + piles.map((c, i) =>
        '<div class="yama-col"><span class="cnt" id="cnt' + i + '">' + c + '</span>'
        + '<div class="ishi-row" data-p="' + i + '">'
        + Array.from({ length: c }, (_, k) => '<span class="ishi' + (i === 1 ? ' kuro' : '') + '" data-i="' + k + '"></span>').join('')
        + '</div><b>' + ['一の山', '二の山', '三の山'][i] + '</b></div>').join('') + '</div>';
    }

    function redraw() {
      const y = $('#yama');
      y.outerHTML = board();
      wire();
      piles.forEach((c, i) => { const e = $('#cnt' + i); if (e) e.textContent = c; });
    }

    function wire() {
      const y = $('#yama'); if (!y) return;
      y.addEventListener('click', (e) => {
        if (!myTurn) return;
        const s = e.target.closest('.ishi'); if (!s) return;
        const p = +s.closest('.ishi-row').dataset.p, i = +s.dataset.i;
        sel = [p, piles[p] - i];
        [...y.querySelectorAll('.ishi')].forEach(el => el.classList.remove('mark'));
        const rowEl = y.querySelector('.ishi-row[data-p="' + p + '"]');
        [...rowEl.children].forEach((el, k) => { if (k >= i) el.classList.add('mark'); });
        snd('chip');
        msg(['一', '二', '三'][p] + 'の山から <b>' + K(sel[1]) + '</b> 個 取る。');
        ctl().innerHTML = '';
        ctl().appendChild(row(btn('これで取る', 'btn shu', () => take(sel[0], sel[1]))));
      });
    }

    function begin(first) {
      stake = stakeBox.get();
      C.spend(stake); snd('chip', true);
      ctl().innerHTML = '';
      redraw();
      myTurn = first;
      $('#teban').textContent = first ? '先手をとった。' : '後手をとった。';
      msg(first ? '先手。取る石を押して、「これで取る」。' : '後手。相手が先に打つ。');
      if (first) { turnYou(); } else { later(turnHim, 800); }
    }

    function turnYou() {
      myTurn = true;
      const t = $('#teban'); t.className = 'teban you'; t.textContent = 'こちらの番。取る石を押せ。';
      ctl().innerHTML = '';
    }

    async function take(p, cnt) {
      if (!myTurn) return;
      myTurn = false;
      ctl().innerHTML = '';
      const tb = $('#teban'); tb.className = 'teban'; tb.textContent = '相手の番。';
      const y = $('#yama');
      const rowEl = y.querySelector('.ishi-row[data-p="' + p + '"]');
      [...rowEl.children].slice(piles[p] - cnt).forEach((el, i) => setTimeout(() => el.classList.add('take'), i * 60));
      snd('card');
      await wait(340 + cnt * 60);
      piles[p] -= cnt;
      redraw(); ctl().innerHTML = '';
      if (piles.every(v => v === 0)) { return end(false); }  // 最後を取った＝負け
      later(turnHim, 700);
    }

    async function turnHim() {
      const t = $('#teban'); t.className = 'teban'; t.textContent = '相手の番。';
      await wait(650);
      const mv = bestMove(piles);
      if (!mv) return end(true);
      const [p, cnt] = mv;
      const y = $('#yama');
      const rowEl = y.querySelector('.ishi-row[data-p="' + p + '"]');
      [...rowEl.children].slice(piles[p] - cnt).forEach((el, i) => setTimeout(() => el.classList.add('take'), i * 60));
      snd('card');
      msg('相手は' + ['一', '二', '三'][p] + 'の山から <b>' + K(cnt) + '</b> 個 取った。');
      await wait(400 + cnt * 60);
      piles[p] -= cnt;
      redraw();
      if (piles.every(v => v === 0)) return end(true);       // 相手が最後を取った＝こちらの勝ち
      turnYou();
    }

    function end(win) {
      myTurn = false;
      const tb = $('#teban'); tb.className = 'teban'; tb.textContent = '——勝負あり。';
      if (win) { C.pay(stake * 2); snd('win'); msg('最後の石は相手が取った。<b>勝ち</b>。＋' + stake + '駒', 'win'); }
      else { snd('lose'); msg('最後の石を取ってしまった。<b>負け</b>。−' + stake + '駒', 'lose'); }
      C.log.push([TB.boards[at].map(K).join('・'), '—', win ? '勝ち' : '負け', stake + '駒']);
      C.logCols = ['盤', '', '結果', '賭け'];
      C.hand(); C.sync(); at++;
      if (at >= TB.boards.length) C.setHands(0);
      if (settle()) return;
      ctl().innerHTML = '';
      ctl().appendChild(row(btn('次の勝負', 'btn', setup)));
    }

    stand();
  }

  /* =========================================================
     六の夜　見立て —— 手「素」
     並んだ記録に、覚えた手のどれが当てはまるか。
     ========================================================= */
  function g6() {
    const n = TB.nights[5];
    let at = 0, sel = null, stakeBox = null;

    function stand() {
      shell('見立て', n.by, n.how.map(h => S(h)).join('<br>'));
      draw();
    }

    function draw() {
      const r = TB.mitate.rounds[at];
      sel = null;
      const last = at === 5;
      area().innerHTML =
        '<p class="junmark">' + r.no + '　〈' + r.ba + '〉' + (last ? '　——勘定には入らない' : '') + '</p>'
        + '<p class="bon-note">' + S(r.lead) + '</p>'
        + FX.table(r.cols, r.rows);
      msg(last ? 'これで終いだ。何の手が入っている。' : 'この盆に入っている手は。');
      stakeBox = makeStake(n.cap);
      ctl().innerHTML = '';
      const picks = document.createElement('div');
      picks.className = 'picks mita-grid';
      TB.mitate.choices.forEach(c => {
        picks.appendChild(btn(c.label, 'pick', (e) => {
          sel = c.k; snd('chip');
          [...picks.children].forEach(x => x.classList.remove('on'));
          e.currentTarget.classList.add('on');
          msg('「' + c.label + '」と見た。');
        }));
      });
      ctl().appendChild(picks);
      ctl().appendChild(row(stakeBox.el));
      ctl().appendChild(row(
        btn('張って言い当てる', 'btn shu', () => { if (!sel) { msg('手を選んでいない。', 'lose'); return; } go(stakeBox.get()); }),
        btn('張らずに言う', 'btn ghost', () => { if (!sel) { msg('手を選んでいない。', 'lose'); return; } go(0); })
      ));
    }

    async function go(stake) {
      ctl().innerHTML = '';
      const r = TB.mitate.rounds[at];
      if (stake > 0) { C.spend(stake); snd('chip', true); }
      C.hand();
      await wait(700);
      const ok = sel === r.ans;
      const label = (TB.mitate.choices.find(c => c.k === r.ans) || {}).label;
      if (stake === 0) { msg('張らなかった。——この盆の手は <b>' + label + '</b>。' + (ok ? '見立ては合っていた。' : '見立ては外れていた。'), ok ? 'win' : 'lose'); if (ok) snd('win'); else snd('lose'); }
      else if (ok) { C.pay(stake * 2); snd('win'); msg('この盆の手は <b>' + label + '</b>。言い当てた。＋' + stake + '駒', 'win'); }
      else { snd('lose'); msg('この盆の手は <b>' + label + '</b>。外れ。−' + stake + '駒', 'lose'); }
      C.log.push([r.no, r.ba, (TB.mitate.choices.find(c => c.k === sel) || {}).label, label, ok ? '当たり' : '外れ']);
      C.logCols = ['番', '盆', '見立て', '本当の手', ''];
      C.sync();
      if (at === 5) { await wait(900); C.finale(ok, stake); return; }
      if (settle()) return;                /* 懐が空になったら、そこで終い */
      at++;
      if (at === 5 && C.get().koma < n.goal) { C.bust(); return; }   /* 五番まで終わった時点で勘定 */
      nextBtn(draw, '次の盆');
    }

    stand();
  }

  const LIST = [g1, g2, g3, g4, g5, g6];
  function start(nightNo, context) { gen++; last = 1; C = context; C.log = []; C.logCols = []; LIST[nightNo - 1](); }
  function stop() { gen++; }

  return { start, stop, moverLoses, bestMove };
})();
