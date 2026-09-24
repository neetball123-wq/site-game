/* =========================================================
   ナクシタ堂 — お店の本体
   ========================================================= */
(() => {
  const KEY = 'nakushita.v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const E = NFX.esc;
  const site = $('#site'), main = $('#main'), side = $('#side');

  /* ---------- 記録 ---------- */
  const fresh = () => ({
    bought: {}, paid: { iro: false, kino: false, name: false }, moji: [], kioku: 0,
    member: '', coupon: false, ura: false, hist: [], seen: [], cart: null,
    welcome: false, muted: false, ending: '', ends: [], snap: null, oldName: ''
  });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.bought) st = Object.assign(fresh(), r); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };

  const ITEM = (id) => NK.ITEMS.find(i => i.id === id) || NK.URA.find(u => u.id === id);
  const isName = (id) => /^n\d$/.test(id);
  const SINGLE = ['megane', 'niji', 'yoru', 'jubyo'];
  const today = new Date();
  const ymd = (d) => d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

  /* ---------- 音 ---------- */
  const snd = (k) => { if (window.NSND && NSND.ready() && NSND[k]) NSND[k](); };
  const sndBtn = $('#snd');
  const paintSnd = () => { sndBtn.textContent = st.muted ? '音：切' : '音：入'; };
  sndBtn.addEventListener('click', () => { st.muted = !st.muted; save(); NSND.start(); NSND.mute(st.muted); paintSnd(); });
  document.addEventListener('pointerdown', () => { if (window.NSND) { NSND.start(); NSND.mute(st.muted); } }, { passive: true });
  paintSnd();

  /* ---------- 文字の穴を、いま見えているところ全部に ---------- */
  const holesAll = (animate) => {
    const n = NFX.holes(site, st.moji, animate);
    NFX.holes($('#toasts'), st.moji, false);
    NFX.holes($('#modal'), st.moji, false);
    document.title = NFX.holeText('ナクシタ堂｜あなたがなくしたもの、ぜんぶあります。', st.moji);
    return n;
  };
  const note = (html, ms) => { NFX.toast(html, ms); NFX.holes($('#toasts'), st.moji, false); };

  /* ---------- 見た目の状態（色・夜・眼鏡） ---------- */
  function paintState() {
    document.body.classList.toggle('megane', !!st.bought.megane);
    document.body.classList.toggle('night', !!st.bought.yoru);
    site.classList.toggle('nocolor', st.paid.iro);
    document.body.classList.toggle('gray', st.paid.iro);
    $('#uraguchi').hidden = !st.bought.yoru;
    $('#stop').hidden = !st.bought.jubyo;
    $('#nav-join').hidden = !!st.member;
    const nm = st.ending === 'staff' ? '＿＿' : (st.member || 'ゲスト');
    $('#hello').textContent = nm;
    $('#weather').textContent = st.bought.yoru ? '今夜の天気：月夜' : st.bought.tenki ? '明日の天気：晴れ（お買い上げ済み）' : '今日の天気：くもり';
    $('#viewers').textContent = '只今の閲覧者：' + (st.bought.yoru ? '1' : '2') + '人';
    $('#cart-n').textContent = st.cart ? '1' : '0';
  }

  /* ---------- 新入荷テロップ ---------- */
  $('#ticker').innerHTML = [
    ['★新入荷★', '夕立（2022年8月・十五分）'], ['★新入荷★', '宿題の最終日'], ['★新入荷★', 'セミの声（一匹ぶん）'],
    ['★再入荷★', '明日の天気（晴れ）'], ['★予約受付中★', '母の声（一分）……入荷未定'], ['★店長より★', 'お支払いいただいたものは、お戻しできません♪']
  ].map(([a, b]) => '<span><b>' + a + '</b>' + b + '</span>').join('');

  /* =========================================================
     タイムセールの時計（十秒ごとにクーポンが一瞬だけ出る）
     ========================================================= */
  const timer = $('#timer'), stopBtn = $('#stop');
  const T0 = performance.now();
  let frozen = false;
  const fmt = (r) => '00:00:' + (r >= 10 ? '10.0' : '0' + r.toFixed(1));
  setInterval(() => {
    if (frozen) return;
    const e = (performance.now() - T0) / 1000, since = e % 10;
    if (e > 1 && since < 0.12) { timer.textContent = 'ツキヨ'; timer.className = 'timer flash'; }
    else { timer.textContent = fmt(10 - since); timer.className = 'timer'; }
  }, 40);
  stopBtn.addEventListener('click', () => {
    if (frozen) { frozen = false; stopBtn.classList.remove('on'); stopBtn.textContent = '■ 止める'; return; }
    frozen = true; stopBtn.classList.add('on'); stopBtn.textContent = '▶ 動かす';
    const e = (performance.now() - T0) / 1000, since = e % 10;
    if (e > 1 && (since < 0.8 || since > 9.85)) {
      timer.textContent = 'クーポン：ツキヨ'; timer.className = 'timer ghost'; snd('ok');
    } else { timer.className = 'timer frozen'; snd('pico'); }
  });

  /* =========================================================
     共通の部品
     ========================================================= */
  const priceLabel = (k) => ({ kioku: 'どうでもいい記憶 ×1', moji: '文字（ひらがな一字）', iro: '色', kino: '昨日', name: '名前' })[k] || '';
  const imgHTML = (it) => {
    if (isName(it.id)) return NK.ICON.name;
    if (it.plate) return '<canvas data-plate width="400" height="300" aria-label="虹の写真"></canvas>';
    return NK.ICON[it.id] || NK.ICON.name;
  };
  const cardHTML = (it) => {
    const got = !!st.bought[it.id] && SINGLE.includes(it.id);
    const cls = 'card' + (it.soldout ? ' soldout' : '') + (got ? ' bought' : '');
    const tag = it.members ? '<span class="tag lim">会員限定</span>' : (it.id === 'kyoku' || it.id === 'hitokoto') ? '<span class="tag">NEW</span>' : '';
    return '<a class="' + cls + '" href="#/item/' + it.id + '" data-id="' + it.id + '">' + tag
      + '<span class="img">' + imgHTML(it) + '</span><span class="cb"><span class="nm">' + E(it.name) + '</span>'
      + NFX.stars(it.star).replace('</span>', '<small>(' + it.reviews.length + ')</small></span>')
      + '<span class="pr">' + (it.soldout ? '売り切れ' : 'お支払い：' + priceLabel(it.price)) + '</span>'
      + '<span class="st">' + E(it.stock) + (it.sold ? '　' + it.sold + '件の注文' : '') + '</span></span></a>';
  };
  const crumb = (arr) => '<p class="crumb">' + (st.paid.kino ? '' : '<a href="#" data-act="back">← 前のページへ</a>　')
    + '<a href="#/">トップ</a>' + arr.map(a => ' ＞ ' + a).join('') + '</p>';
  const rvHTML = (r, withItem) => {
    const it = withItem ? NK.ITEMS.find(i => i.reviews.includes(r)) : null;
    return '<div class="rv' + (r.faded ? ' faded' : '') + '">'
      + '<div class="rv-h"><b>' + E(r.by) + '</b>' + NFX.stars(r.star) + '<span>' + r.date + '</span>'
      + (it ? '<a class="where" href="#/item/' + it.id + '">' + E(it.name) + '</a>' : '') + '</div>'
      + '<p class="rv-t">' + E(r.t) + '</p>' + (r.tanuki ? NFX.TANUKI : '')
      + (r.tanuki ? '<p class="reply">店長より：たぬきさんのスタンプ、かわいいですね！</p>' : '')
      + '</div>';
  };

  /* ---------- 左の欄 ---------- */
  function renderSide(cat) {
    const cats = ['おとしもの', 'じかん', 'てんき', 'きもち', 'おと', 'こえ'];
    const cnt = (c) => NK.ITEMS.filter(i => i.cat === c).length;
    const y = new Date(today); y.setDate(y.getDate() - 1);
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let cal = '<table class="cal"><tr><th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th></tr><tr>';
    for (let i = 0; i < first.getDay(); i++) cal += '<td></td>';
    for (let d = 1; d <= days; d++) {
      const dow = (first.getDay() + d - 1) % 7;
      const isT = d === today.getDate(), isY = y.getMonth() === today.getMonth() && d === y.getDate();
      cal += '<td class="' + (isT ? 'today' : '') + (isY && st.paid.kino ? ' gone' : '') + '">' + d + '</td>';
      if (dow === 6 && d < days) cal += '</tr><tr>';
    }
    cal += '</tr></table>';
    const staff = st.ending === 'staff';
    side.innerHTML =
      '<div class="box"><h3>カテゴリ</h3><ul><li><a href="#/" class="' + (!cat ? 'on' : '') + '">すべての商品<small>' + NK.ITEMS.length + '</small></a></li>'
      + cats.map(c => '<li><a href="#/cat/' + encodeURIComponent(c) + '" class="' + (cat === c ? 'on' : '') + '">' + c + '<small>' + cnt(c) + '</small></a></li>').join('') + '</ul></div>'
      + '<div class="box"><h3>店長のごあいさつ</h3><div class="pad"><div class="tencho">'
      + '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" fill="#FFE14D" stroke="#3A3330" stroke-width="3"/><circle cx="22" cy="27" r="3" fill="#3A3330"/><circle cx="38" cy="27" r="3" fill="#3A3330"/><path d="M21 38q9 8 18 0" fill="none" stroke="#3A3330" stroke-width="3" stroke-linecap="round"/></svg>'
      + '<div><b>店長：' + (staff ? '＿＿（新任）' : '（在庫切れ）') + '</b><br><small>いらっしゃいませ！ゆっくり見ていってくださいね。</small></div></div>'
      + '<p style="margin:8px 0 0"><a href="#/diary">店長日記を読む</a>　<a href="#/contact">お問い合わせ</a></p></div></div>'
      + '<div class="box"><h3>売れ筋ランキング</h3><ul class="rank">'
      + ['tenki', 'hitokoto', 'kyoku', 'megane', 'jubyo'].map(id => '<li><i></i><a href="#/item/' + id + '">' + E(ITEM(id).name) + '</a></li>').join('') + '</ul></div>'
      + '<div class="box"><h3>営業日カレンダー</h3><div class="pad">' + cal + '<small>毎日営業しております</small></div></div>';
    side.querySelectorAll('.rank li i').forEach((el, i) => { el.textContent = i + 1; });
  }

  /* =========================================================
     ページ
     ========================================================= */
  function pTop(cat) {
    const list = cat ? NK.ITEMS.filter(i => i.cat === cat) : NK.ITEMS;
    return '<div class="notice"><b>【お知らせ】</b>当店の商品は、すべてどなたかがなくしたものです。お支払いは現金以外で承ります。お手持ちの「使えるもの」は<a href="#/mypage">マイページ</a>でご確認ください。</div>'
      + (st.bought.yoru ? '<div class="notice"><b>【夜の営業中】</b>夜にしか開かない売り場がございます。</div>' : '')
      + '<h1 class="pt">' + (cat ? E(cat) + 'の棚' : '本日のおすすめ') + '</h1>'
      + '<div class="grid">' + list.map(cardHTML).join('') + '</div>';
  }

  function pItem(id) {
    const it = ITEM(id);
    if (!it || isName(id)) return pNotFound();
    const got = !!st.bought[id] && SINGLE.includes(id);
    let buyArea = '';
    if (it.soldout) buyArea = '<p class="msg">ただいま売り切れです。' + (id === 'koe' ? '次回の入荷は未定です。' : '') + '</p>';
    else if (got) buyArea = '<p class="msg ok">お買い上げ済みの商品です。</p>';
    else {
      let lock = '';
      if (it.members && !st.member) lock = '<p class="msg">会員様限定の商品です。<a href="#/join">会員登録（無料）</a>をお願いいたします。</p>';
      const coupon = it.coupon ? '<div class="field"><label for="coupon">クーポンコード</label><input id="coupon" maxlength="12" autocomplete="off" value="' + (st.coupon ? 'ツキヨ' : '') + '"' + (st.coupon ? ' disabled' : '') + '><button type="button" class="btn sm" data-act="coupon"' + (st.coupon ? ' disabled' : '') + '>適用</button></div><p class="msg' + (st.coupon ? ' ok' : '') + '" id="cmsg">' + (st.coupon ? 'クーポンを適用しました。' : '') + '</p>' : '';
      const can = !(it.members && !st.member) && !(it.coupon && !st.coupon);
      buyArea = lock + coupon + '<div class="buy"><button type="button" class="btn" data-act="cart" data-id="' + id + '"' + (can ? '' : ' disabled') + '>カートに入れる</button></div>';
    }
    const rv = it.reviews.slice().sort((a, b) => b.date.localeCompare(a.date));
    return crumb(['<a href="#/cat/' + encodeURIComponent(it.cat) + '">' + it.cat + '</a>', E(it.name)])
      + '<div class="item"><div class="img">' + imgHTML(it) + '</div><div>'
      + '<h1>' + E(it.name) + '</h1>' + NFX.stars(it.star) + ' <small>' + (it.sold || 0) + '件の注文　' + E(it.stock) + '</small>'
      + (it.soldout ? '' : '<div class="pricebox"><div class="lb">お支払い</div><div class="pv">' + priceLabel(it.price) + '</div><div class="pn">' + E(NK.PAY[it.price].note) + '</div></div>')
      + '<p class="desc">' + E(it.desc) + '</p>'
      + (it.fine ? '<p class="fine">' + E(it.fine) + '</p>' : '')
      + buyArea + '</div></div>'
      + '<h2 class="st">この商品のレビュー（' + rv.length + '件）</h2><div class="rvs">' + rv.map(r => rvHTML(r)).join('') + '</div>';
  }

  /* ---------- カートとレジ ---------- */
  let co = { pay: '', kana: '' };
  const cartItem = () => st.cart ? ITEM(st.cart) : null;
  const itemPrice = (it) => isName(it.id) ? 'name' : it.price;
  const steps = (n) => '<div class="steps">' + ['カート', 'お支払い', 'ご確認', '完了'].map((s, i) => '<span class="' + (i === n ? 'on' : '') + '">' + (i + 1) + '. ' + s + '</span>').join('') + '</div>';
  const nameOf = (it) => isName(it.id) ? it.label : it.name;

  function pCart() {
    const it = cartItem();
    if (!it) return '<h1 class="pt">カート</h1>' + steps(0) + '<p>カートに商品は入っていません。</p><p><a href="#/">お買い物をつづける</a></p>';
    return '<h1 class="pt">カート</h1>' + steps(0)
      + '<div class="cartrow"><div class="img">' + imgHTML(it) + '</div><div style="flex:1"><b>' + E(nameOf(it)) + '</b><br><small>お支払い：' + priceLabel(itemPrice(it)) + '　数量：1</small></div>'
      + '<button type="button" class="btn gray sm" data-act="uncart">削除</button></div>'
      + '<div class="buy"><button type="button" class="btn red" data-act="go" data-to="#/pay">レジに進む</button><a href="#/" style="align-self:center">お買い物をつづける</a></div>';
  }

  const avail = (k) => {
    if (k === 'kioku') return true;
    if (k === 'moji') return st.moji.length < NK.MOJI_MAX;
    if (k === 'iro') return !st.paid.iro;
    if (k === 'kino') return !st.paid.kino;
    if (k === 'name') return !!st.member && !st.paid.name;
    return false;
  };
  const walletNote = (k) => {
    if (k === 'kioku') return 'たくさん（これまでに' + st.kioku + '個お支払い）';
    if (k === 'moji') return st.moji.length ? 'お支払い済み：' + st.moji.map(m => '「' + m + '」').join('') + '　のこり' + (NK.MOJI_MAX - st.moji.length) + '字' : 'お選びいただいた文字は、お客様の世界から消えます';
    if (k === 'iro') return st.paid.iro ? 'お支払い済み' : 'ひとつだけ';
    if (k === 'kino') return st.paid.kino ? 'お支払い済み' : 'ひとつだけ';
    if (k === 'name') return st.paid.name ? 'お支払い済み' : st.member ? '「' + st.member + '」（会員登録のお名前）' : '会員登録をすると使えます';
    return '';
  };

  function pPay() {
    const it = cartItem();
    if (!it) return pCart();
    const need = itemPrice(it);
    return '<h1 class="pt">お支払い方法の選択</h1>' + steps(1)
      + '<p>「' + E(nameOf(it)) + '」は、<b>' + priceLabel(need) + '</b>でお支払いいただけます。</p>'
      + '<div class="pays">' + Object.keys(NK.PAY).map(k => {
        const ok = k === need && avail(k);
        return '<label class="pay' + (ok ? '' : ' off') + (co.pay === k && ok ? ' sel' : '') + '"><input type="radio" name="pay" value="' + k + '"' + (ok ? '' : ' disabled') + (co.pay === k && ok ? ' checked' : '') + '>'
          + '<span><b>' + NK.PAY[k].label + '</b><small>' + E(walletNote(k)) + (k !== need ? '　（この商品にはご利用いただけません）' : '') + '</small></span></label>';
      }).join('') + '</div>'
      + (need === 'moji' ? '<div class="field" id="kana-f"' + (co.pay === 'moji' ? '' : ' hidden') + '><label for="kana">お支払いにつかう文字（ひらがな一字）</label><input id="kana" maxlength="1" autocomplete="off" style="width:3.2em;text-align:center;font-size:20px" value="' + E(co.kana) + '"></div>' : '')
      + '<p class="msg" id="pmsg"></p>'
      + '<div class="buy"><button type="button" class="btn red" data-act="topay">ご確認画面へ</button><a href="#/cart" style="align-self:center">カートにもどる</a></div>';
  }

  function pConfirm() {
    const it = cartItem();
    if (!it || !co.pay) return pPay();
    const payTxt = co.pay === 'moji' ? '文字「' + co.kana + '」' : co.pay === 'name' ? '名前「' + st.member + '」' : co.pay === 'kioku' ? 'どうでもいい記憶 ×1' : priceLabel(co.pay);
    return '<h1 class="pt">ご注文内容のご確認</h1>' + steps(2)
      + '<div class="confirm"><dl><dt>商品</dt><dd>' + E(nameOf(it)) + '</dd><dt>お支払い</dt><dd data-keep>' + E(payTxt) + '</dd><dt>お届け</dt><dd>ただいま（送料無料）</dd></dl>'
      + (co.pay === 'name' ? '<p class="fine">※名前でお支払いいただいたお客様は、当店のスタッフとして登録されます。前のスタッフには、お帰りいただきます。</p>' : '')
      + '<label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" id="agree">お支払いいただいたものは、お戻しできないことに同意します</label>'
      + '<p class="msg" id="cfmsg"></p>'
      + '<div class="buy"><button type="button" class="btn red" data-act="order">注文を確定する</button><a href="#/pay" style="align-self:center">もどる</a></div></div>';
  }

  /* ---------- マイページ ---------- */
  function pMypage() {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    const seenRows = st.seen.slice(-8).reverse().map(s => '<tr><td>今日 ' + s.t + '</td><td>' + E(s.n) + '</td></tr>').join('');
    const yRows = st.paid.kino ? '' : [['23:41', '帰り道'], ['23:52', '母の声（一分）'], ['23:58', 'よくあるご質問']].map(([t, n]) => '<tr class="yest"><td>昨日 ' + t + '</td><td>' + n + '</td></tr>').join('');
    return '<h1 class="pt">マイページ</h1>'
      + '<h2 class="st">会員情報</h2>'
      + (st.member
        ? '<p>お名前：<b data-keep>' + E(st.ending === 'staff' ? '＿＿' : st.member) + '</b></p>'
          + (st.paid.name ? '<p class="msg">お名前は、お支払いに使われました。</p>'
            : '<div class="field"><label for="rename">お名前の変更</label><input id="rename" maxlength="20" autocomplete="off" value="' + E(st.member) + '"><button type="button" class="btn sm" data-act="rename">変更する</button></div><p class="msg" id="rmsg"></p>')
        : '<p>ゲスト様です。<a href="#/join">会員登録（無料）</a>をすると、「名前」がお支払いに使えるようになります。</p>')
      + '<h2 class="st">お支払いに使えるもの</h2><div class="wallet">'
      + Object.keys(NK.PAY).map(k => '<div class="wal' + (avail(k) ? '' : ' gone') + '"><b>' + NK.PAY[k].label + '</b><small>' + E(walletNote(k)) + '</small></div>').join('') + '</div>'
      + '<h2 class="st">ご購入履歴</h2>'
      + (st.hist.length ? '<table class="hist"><tr><th>日時</th><th>商品</th><th>お支払い</th></tr>' + st.hist.slice().reverse().map(h => '<tr><td>' + h.d + '</td><td>' + E(h.n) + '</td><td data-keep>' + E(h.p) + '</td></tr>').join('') + '</table>' : '<p>まだお買い物をされていません。</p>')
      + '<h2 class="st">閲覧履歴</h2><table class="hist">' + (seenRows + yRows || '<tr><td>—</td></tr>') + '</table>';
  }

  function pJoin() {
    if (st.member) return '<h1 class="pt">会員登録</h1><p>すでに会員登録がお済みです（' + E(st.member) + ' 様）。お名前は<a href="#/mypage">マイページ</a>で変更できます。</p>';
    return '<h1 class="pt">かんたん会員登録（無料）</h1>'
      + '<p>会員様限定の商品がお買い求めいただけます。ご登録のお名前は、お支払いにもご利用いただけます。</p>'
      + '<div class="field"><label for="jname">お名前</label><input id="jname" maxlength="20" autocomplete="off" placeholder="お名前"></div>'
      + '<p class="fine">利用規約：ご登録のお名前は、会員様の「名前」としてお支払いにご利用いただけます。名前でお支払いいただいたお客様は、当店のスタッフとして登録されます。お名前はマイページからいつでも変更できます。</p>'
      + '<label style="display:flex;gap:8px;align-items:center;font-weight:700;margin:8px 0"><input type="checkbox" id="jagree">利用規約に同意する</label>'
      + '<p class="msg" id="jmsg"></p><div class="buy"><button type="button" class="btn red" data-act="join">登録する</button></div>';
  }

  function pReviews() {
    const all = [];
    NK.ITEMS.forEach(it => it.reviews.forEach(r => all.push(r)));
    all.sort((a, b) => b.date.localeCompare(a.date));
    return '<h1 class="pt">みんなのレビュー</h1><p class="crumb">新しい順に並んでいます。</p><div class="rvs">' + all.map(r => rvHTML(r, true)).join('') + '</div>';
  }

  function pDiary() {
    const list = NK.DIARY.slice();
    if (st.ending === 'staff') list.push({ date: ymd(today), title: 'はじめまして！', body: NK.DIARY[0].body });
    return '<h1 class="pt">店長日記</h1>' + list.reverse().map(d =>
      '<div class="rv"><div class="rv-h"><b>' + E(d.title) + '</b><span>' + d.date + '</span></div><p class="rv-t">' + E(d.body) + '</p></div>').join('<div style="height:10px"></div>');
  }

  function pLaw() {
    return '<h1 class="pt">特定商取引法に基づく表記</h1><table class="law">' + NK.LAW.map(([a, b]) => '<tr><th>' + a + '</th><td>' + E(b) + '</td></tr>').join('') + '</table>'
      + '<p class="fine">※文字が小さくて読めないお客様は、おとしものの棚をご覧ください。</p>';
  }

  /* ---------- 考えている時間（よくあるご質問は、時間がたつと いまの質問だけ 開く） ----------
     いま取りかかっている段階（まだ解けていない最初の質問）にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const solvedQ = [
    () => !!st.bought.megane, () => st.moji.includes('た'), () => !!st.paid.iro,
    () => !!st.bought.yoru, () => !!st.ura, () => st.ends.length > 0, () => st.ends.length > 0
  ];
  const curStep = () => { for (let i = 0; i < 5; i++) if (!solvedQ[i]()) return i; return 5; };
  const faqLv = () => HINT_AT.filter(t => ((st.clock || {})[curStep()] || 0) >= t).length;
  setInterval(() => {
    if (document.visibilityState !== 'visible' || st.ending) return;
    const before = faqLv(), k = curStep();
    st.clock = st.clock || {}; st.clock[k] = (st.clock[k] || 0) + 5000;
    st.playMs = (st.playMs || 0) + 5000;
    save();
    if ((location.hash || '').startsWith('#/faq') && faqLv() !== before) {
      const open = [...document.querySelectorAll('.hint:not([hidden])')].map(e => e.id);
      render(); open.forEach(id => { const e = document.getElementById(id); if (e) e.hidden = false; });
    }
  }, 5000);

  function pFaq() {
    const cur = curStep(), lv = faqLv(), c = (st.clock || {})[cur] || 0;
    const isCur = (i) => i === cur || (cur === 5 && i === 6);
    return '<h1 class="pt">よくあるご質問</h1><p class="crumb">いま取りかかっている質問だけ、時間がかかっているときに「ヒント1 → ヒント2 → こたえ」の順で開けるようになります。</p>'
      + NK.FAQ.map((f, i) => {
        const done = solvedQ[i](), now = isCur(i);
        let body = '';
        if (done || now) {
          body = f.h.map((h, j) => {
            const open = done || lv > j, name = j < 2 ? 'ヒント' + (j + 1) : 'こたえ';
            return '<p style="margin:6px 0 0"><button type="button" class="btn gray sm" data-act="hint" data-i="' + i + '-' + j + '"' + (open ? '' : ' disabled') + '>'
              + name + (open ? '' : '（あと' + fmtLeft(HINT_AT[j] - c) + '）') + '</button> <span class="hint" id="h' + i + '-' + j + '" hidden>' + E(h) + '</span></p>';
          }).join('');
        } else body = '<p class="crumb" style="margin:6px 0 0">（先に進むと、この質問のヒントが開きます）</p>';
        return '<div class="rv"><div class="rv-h"><b>Q' + (i + 1) + '. ' + E(f.q) + '</b>' + (done ? '<span>解決済み</span>' : now ? '<span>いまの質問</span>' : '') + '</div>' + body + '</div>';
      }).join('<div style="height:10px"></div>')
      + '<h2 class="st">最初からやり直す</h2><p>お支払いいただいたものも、すべて元に戻ります（このブラウザの記録を消します）。</p><button type="button" class="btn gray" data-act="reset">記録を消して、最初からやり直す</button>';
  }

  /* ---------- お問い合わせ（店長とのおしゃべり） ---------- */
  let chatLog = [];
  function pContact() {
    if (!st.bought.hitokoto) return '<h1 class="pt">お問い合わせ</h1><div class="notice">お問い合わせには、「<a href="#/item/hitokoto">言いそびれた一言</a>」が必要です。一言もないお客様とは、お話しできないんです（ごめんなさい）。</div>';
    if (!chatLog.length) chatLog.push({ who: 'shop', t: 'いらっしゃいませ！　ナクシタ堂の店長です。なにかお探しですか？　気になる言葉を送ってくださいね。' });
    return '<h1 class="pt">お問い合わせ</h1><div class="chat" id="chat">' + chatLog.map(c => '<div class="bub ' + c.who + '">' + E(c.t) + '</div>').join('') + '</div>'
      + '<div class="field"><input id="ask" maxlength="40" autocomplete="off" placeholder="店長に聞きたいこと" style="flex:1"><button type="button" class="btn sm" data-act="chat">送る</button></div>';
  }
  let chatMiss = 0;
  function answer(q) {
    const s = q.replace(/\s/g, '');
    for (const c of NK.CHAT) if (c.k.some(k => s.includes(k))) return c.a;
    return NK.CHAT_DEFAULT[(chatMiss++) % NK.CHAT_DEFAULT.length];
  }

  /* ---------- 裏の棚 ---------- */
  let code = '';
  function pUra(id) {
    if (!st.bought.yoru) return '<div class="ura"><h1>裏の売り場</h1><p>この売り場は、夜だけ開いております。</p></div>';
    if (!st.ura) {
      return '<div class="ura"><h1>裏口</h1><p>番号をどうぞ。</p><div class="code" id="code">' + [0, 1, 2, 3].map(i => '<span>' + (code[i] || '') + '</span>').join('') + '</div>'
        + '<div class="keypad" id="keypad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '消', '0', '入'].map(k => '<button type="button" data-k="' + k + '">' + k + '</button>').join('') + '</div><p class="msg" id="kmsg"></p></div>';
    }
    if (id) {
      const it = NK.URA.find(u => u.id === id);
      if (!it) return pNotFound();
      return crumb(['<a href="#/ura">裏の棚</a>', E(it.label)])
        + '<div class="ura"><div class="item"><div class="img">' + NK.ICON.name + '</div><div><h1 data-keep>' + E(it.label) + '</h1>'
        + '<p class="fine" data-keep>受付 ' + it.date + '</p>'
        + '<div class="pricebox" style="background:#1B1B26;border-color:#3A3A4C"><div class="lb">お支払い</div><div class="pv" style="color:#C9A0FF">名前</div><div class="pn">会員登録のお名前でお支払いいただけます</div></div>'
        + '<p class="desc">どなたかがお支払いになった名前です。一点もの。</p>'
        + '<p class="fine">※名前でお支払いいただいたお客様は、当店のスタッフとして登録されます。</p>'
        + (st.ending ? '<p class="msg ok">この名前は、もう持ち主のもとへ帰りました。</p>' : '<div class="buy"><button type="button" class="btn" data-act="cart" data-id="' + it.id + '">カートに入れる</button></div>')
        + '</div></div></div>';
    }
    return '<div class="ura"><h1>裏の棚</h1><p>夜だけ開く売り場です。ここにあるのは、お客様がお支払いになったものです。</p>'
      + '<p class="fine" style="color:#8E8A9C">※裏の棚の商品は、お客様の世界の外にあります。消えた文字も、ここでは消えません。</p>'
      + '<div class="grid">' + NK.URA.map(u => '<a class="card" href="#/ura/' + u.id + '" data-keep><span class="img">' + NK.ICON.name + '</span><span class="cb"><span class="nm">' + E(u.label) + '</span><span class="pr">お支払い：名前</span><span class="st fine">受付 ' + u.date + '</span></span></a>').join('')
      + NK.URA_ETC.map(u => '<div class="card soldout"><span class="img">' + NK.ICON[u.icon] + '</span><span class="cb"><span class="nm">' + E(u.label) + '</span><span class="st">' + u.note + '</span></span></div>').join('') + '</div></div>';
  }

  function pNotFound() { return '<h1 class="pt">お探しのページは見つかりませんでした</h1><p><a href="#/">トップへもどる</a></p>'; }

  /* ---------- お買い上げ ---------- */
  function pThanks(it, payTxt) {
    return '<div class="thanks"><h1>ご注文ありがとうございました</h1><p>「' + E(nameOf(it)) + '」を、ただいまお届けしました。</p>'
      + '<p class="spent" data-keep>お支払い：' + E(payTxt) + '</p><p class="fine">※お支払いいただいたものは、当店の商品として棚に並びます。</p>'
      + '<p><a href="#/">お買い物をつづける</a>　<a href="#/mypage">マイページ</a></p></div>';
  }

  /* =========================================================
     描画
     ========================================================= */
  let lastHash = '', closing = false;
  function render() {
    if (st.ending === 'close' && !closing) { showClosed(false); return; }
    let h = (location.hash || '#/').slice(1);
    if (h.startsWith('/thanks')) { h = '/'; history.replaceState(null, '', '#/'); }
    const [, a, b] = h.split('/');
    let html, cat = '';
    switch (a) {
      case undefined: case '': html = pTop(); break;
      case 'cat': cat = decodeURIComponent(b || ''); html = pTop(cat); break;
      case 'item': html = pItem(b); if (NK.ITEMS.some(i => i.id === b)) track(ITEM(b).name); break;
      case 'cart': html = pCart(); break;
      case 'pay': html = pPay(); break;
      case 'confirm': html = pConfirm(); break;
      case 'mypage': html = pMypage(); break;
      case 'join': html = pJoin(); break;
      case 'reviews': html = pReviews(); break;
      case 'diary': html = pDiary(); break;
      case 'law': html = pLaw(); break;
      case 'faq': html = pFaq(); break;
      case 'contact': html = pContact(); break;
      case 'ura': html = pUra(b); break;
      default: html = pNotFound();
    }
    document.body.classList.toggle('ura-open', a === 'ura');
    main.innerHTML = html;
    renderSide(cat);
    paintState();
    drawPlates();
    holesAll(false);
    if (h !== lastHash) { window.scrollTo(0, 0); lastHash = h; }
    const chat = $('#chat'); if (chat) chat.scrollTop = chat.scrollHeight;
  }
  function track(n) { st.seen.push({ t: hm(new Date()), n }); if (st.seen.length > 30) st.seen = st.seen.slice(-30); save(); }
  function drawPlates() { document.querySelectorAll('canvas[data-plate]').forEach(c => NFX.plate(c, NK.CODE_URA, st.paid.iro)); }
  addEventListener('hashchange', render);

  /* =========================================================
     操作
     ========================================================= */
  const normKana = (s) => (s || '').trim();
  const isHira = (ch) => /^[ぁ-ゖゝゞ]$/.test(ch);

  main.addEventListener('change', (e) => {
    if (e.target.name === 'pay') {
      co.pay = e.target.value;
      main.querySelectorAll('.pay').forEach(l => l.classList.toggle('sel', l.querySelector('input').checked));
      const kf = $('#kana-f'); if (kf) kf.hidden = co.pay !== 'moji';
    }
  });

  main.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'ask') { e.preventDefault(); sendChat(); }
    if (e.target.id === 'coupon') { e.preventDefault(); applyCoupon(); }
  });

  main.addEventListener('click', async (e) => {
    const k = e.target.closest('#keypad button');
    if (k) { keypad(k.dataset.k); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'back') { e.preventDefault(); history.back(); return; }
    if (act === 'cart') {
      const id = b.dataset.id, it = ITEM(id);
      if (st.cart && st.cart !== id) note('カートの商品を入れかえました。');
      st.cart = id; co = { pay: '', kana: '' }; save(); snd('pico');
      $('#cart-n').classList.remove('bump'); void $('#cart-n').offsetWidth; $('#cart-n').classList.add('bump');
      note('「<b>' + E(nameOf(it)) + '</b>」をカートに入れました。');
      location.hash = '#/cart'; return;
    }
    if (act === 'uncart') { st.cart = null; save(); render(); return; }
    if (act === 'go') { location.hash = b.dataset.to; return; }
    if (act === 'topay') {
      const it = cartItem(); const need = itemPrice(it);
      const m = $('#pmsg');
      if (co.pay !== need || !avail(need)) { m.textContent = 'お支払い方法を選んでください。'; snd('ng'); return; }
      if (need === 'moji') {
        const ch = normKana($('#kana').value);
        if (!isHira(ch)) { m.textContent = 'ひらがなを一字、入れてください。'; snd('ng'); return; }
        if (st.moji.includes(ch)) { m.textContent = '「' + ch + '」は、もうお支払い済みです。'; snd('ng'); return; }
        co.kana = ch;
      }
      location.hash = '#/confirm'; return;
    }
    if (act === 'order') {
      if (!$('#agree').checked) { $('#cfmsg').textContent = '同意のチェックをお願いいたします。'; snd('ng'); return; }
      order(); return;
    }
    if (act === 'coupon') { applyCoupon(); return; }
    if (act === 'join') {
      const n = ($('#jname').value || '').trim();
      if (!n) { $('#jmsg').textContent = 'お名前を入れてください。'; snd('ng'); return; }
      if (!$('#jagree').checked) { $('#jmsg').textContent = '利用規約への同意をお願いいたします。'; snd('ng'); return; }
      st.member = n.slice(0, 20); save(); snd('ok');
      note('会員登録が完了しました。ようこそ、<b>' + E(st.member) + '</b> 様。');
      location.hash = '#/mypage'; return;
    }
    if (act === 'rename') {
      const n = ($('#rename').value || '').trim();
      if (!n) { $('#rmsg').textContent = 'お名前を入れてください。'; snd('ng'); return; }
      st.member = n.slice(0, 20); save(); snd('ok');
      note('お名前を「<b>' + E(st.member) + '</b>」に変更しました。');
      render(); return;
    }
    if (act === 'hint') { const el = $('#h' + b.dataset.i); el.hidden = !el.hidden; snd('pico'); return; }
    if (act === 'reset') {
      if (!(await ask('記録を消して、最初からやり直しますか？　お支払いいただいたものも、すべて元に戻ります。', '最初からやり直す'))) return;
      const m = st.muted; st = fresh(); st.muted = m; st.welcome = true; save(); location.hash = '#/'; location.reload(); return;
    }
    if (act === 'chat') { sendChat(); return; }
  });

  function applyCoupon() {
    const v = ($('#coupon').value || '').trim();
    const m = $('#cmsg');
    if (NK.COUPONS.includes(v)) { st.coupon = true; save(); snd('ok'); note('クーポン「ツキヨ」を適用しました。'); render(); }
    else { m.textContent = 'クーポンコードが正しくありません。'; m.className = 'msg'; snd('ng'); }
  }

  async function sendChat() {
    const inp = $('#ask'); const q = (inp.value || '').trim();
    if (!q) return;
    inp.value = '';
    chatLog.push({ who: 'me', t: q });
    const chat = $('#chat');
    const me = document.createElement('div'); me.className = 'bub me'; me.textContent = q; chat.appendChild(me);
    const dots = document.createElement('div'); dots.className = 'bub shop dots'; chat.appendChild(dots);
    chat.scrollTop = chat.scrollHeight;
    await NFX.sleep(700 + Math.random() * 500);
    const a = answer(q);
    chatLog.push({ who: 'shop', t: a });
    dots.className = 'bub shop'; dots.textContent = a;
    NFX.holes(dots, st.moji, false);
    snd('pico');
    chat.scrollTop = chat.scrollHeight;
  }

  function keypad(k) {
    const m = $('#kmsg');
    if (k === '消') code = code.slice(0, -1);
    else if (k === '入') {
      if (code === NK.CODE_URA) { st.ura = true; save(); snd('night'); code = ''; note('裏口が開きました。'); render(); return; }
      m.textContent = '番号がちがいます。'; snd('ng'); $('#code').classList.add('shake'); setTimeout(() => $('#code') && $('#code').classList.remove('shake'), 450); code = '';
    } else if (code.length < 4) { code += k; snd('pico'); }
    $('#code').innerHTML = [0, 1, 2, 3].map(i => '<span>' + (code[i] || '') + '</span>').join('');
  }

  /* =========================================================
     注文を確定する（ここでお店が変わる）
     ========================================================= */
  async function order() {
    const it = cartItem(); const pay = co.pay;
    if (!it || !pay) return;
    /* 名前の商品 */
    if (isName(it.id)) {
      if (!it.right) {
        st.cart = null; save(); snd('ng');
        history.replaceState(null, '', '#/thanks'); lastHash = '/thanks';
        main.innerHTML = '<div class="thanks"><h1>ご注文をお受けできませんでした</h1><p>「' + E(it.label) + '」の持ち主は、当店にはいらっしゃいません。</p><p>ご注文はキャンセルされました（お支払いはいただいておりません）。</p><p><a href="#/ura">裏の棚にもどる</a></p></div>';
        holesAll(false); paintState(); return;
      }
      const snap = Object.assign({}, st); delete snap.snap;
      st.snap = JSON.parse(JSON.stringify(snap));
      const shop = NK.SHOP_NAMES.includes(st.member.replace(/\s/g, ''));
      st.oldName = st.member;
      st.paid.name = true; st.cart = null;
      st.hist.push({ d: ymd(today) + ' ' + hm(new Date()), n: it.label, p: '名前「' + st.member + '」' });
      const kind = shop ? 'close' : 'staff';
      st.ending = kind; if (!st.ends.includes(kind)) st.ends.push(kind);
      save();
      history.replaceState(null, '', '#/thanks'); lastHash = '/thanks';
      main.innerHTML = pThanks(it, '名前「' + st.oldName + '」'); holesAll(false); snd('buy'); window.scrollTo(0, 0);
      await NFX.sleep(1800);
      if (kind === 'close') endClose(); else endStaff();
      return;
    }
    /* ふつうの商品 */
    let payTxt = '';
    const prevMoji = st.moji.slice();
    if (pay === 'kioku') { payTxt = 'どうでもいい記憶「' + NK.MEMORIES[st.kioku % NK.MEMORIES.length] + '」'; st.kioku++; }
    if (pay === 'moji') { payTxt = '文字「' + co.kana + '」'; st.moji.push(co.kana); }
    if (pay === 'iro') { payTxt = '色'; st.paid.iro = true; }
    if (pay === 'kino') { payTxt = '昨日'; st.paid.kino = true; }
    st.bought[it.id] = true; st.cart = null;
    st.hist.push({ d: ymd(today) + ' ' + hm(new Date()), n: it.name, p: payTxt });
    save();
    history.replaceState(null, '', '#/thanks'); lastHash = '/thanks';
    main.innerHTML = pThanks(it, payTxt);
    renderSide('');
    $('#cart-n').textContent = '0';
    NFX.holes(site, prevMoji, false);
    window.scrollTo(0, 0);
    snd('buy');
    await NFX.sleep(900);
    await effects(it, pay, payTxt);
  }

  async function effects(it, pay, payTxt) {
    /* 支払ったものが、消える */
    if (pay === 'kioku') note('どうでもいい記憶「<b>' + E(NK.MEMORIES[(st.kioku - 1) % NK.MEMORIES.length]) + '</b>」をお支払いいただきました。もう思い出せません。', 5200);
    if (pay === 'moji') {
      snd('fall');
      holesAll(true);
      await NFX.sleep(1200);
      note('文字「<b data-keep>' + E(st.moji[st.moji.length - 1]) + '</b>」をお支払いいただきました。お客様の世界から、この文字はなくなりました。', 5600);
    }
    if (pay === 'iro') {
      snd('drain'); site.classList.add('nocolor'); document.body.classList.add('gray');
      await NFX.sleep(2600);
      note('色をお支払いいただきました。お客様の世界は、灰色になりました。', 5600);
      drawPlates();
    }
    if (pay === 'kino') {
      note('昨日をお支払いいただきました。昨日のことは、もう誰も覚えていません。', 5600);
      renderSide('');
      holesAll(false);
    }
    await NFX.sleep(700);
    /* 届いたものが、効く */
    if (it.id === 'megane') { document.body.classList.add('megane'); snd('ok'); note('眼鏡をかけました。小さな字も、うすい字も、よく見えます。', 5200); }
    if (it.id === 'hitokoto') {
      const one = ['またね', 'ありがとう', 'ごめんね', 'だいじょうぶ', 'おかえり'][st.moji.length % 5];
      note('言いそびれた一言「<b>' + one + '</b>」をお届けしました。<a href="#/contact" style="color:#FFE14D">お問い合わせ</a>が使えるようになりました。', 6200);
    }
    if (it.id === 'niji') note('虹が届きました。……灰色の虹です。<a href="#/item/niji" style="color:#FFE14D">写真を見る</a>', 6000);
    if (it.id === 'jubyo') { $('#stop').hidden = false; note('タイムセールの時計を、止められるようになりました。', 5200); }
    if (it.id === 'tenki') { paintState(); note('明日は晴れます。', 4000); }
    if (it.id === 'kyoku') { snd('melody'); note('♪　……あ、この曲。　（聴き終わると、また忘れます）', 5200); }
    if (it.id === 'yoru') {
      snd('night'); document.body.classList.add('night');
      await NFX.sleep(900);
      $('#uraguchi').hidden = false;
      note('夜になりました。夜にしか開かない売り場がございます。', 6000);
    }
    paintState();
    holesAll(false);
  }

  /* =========================================================
     終わり①　店長交代（自分の名前で払った）
     ========================================================= */
  async function endStaff() {
    const hello = $('#hello');
    snd('glitch');
    for (let i = 0; i < 8; i++) { hello.textContent = i % 2 ? st.oldName : '＿'.repeat(Math.max(2, st.oldName.length)); await NFX.sleep(110); }
    hello.textContent = '＿＿';
    note('お支払いいただいた名前「<b>' + E(st.oldName) + '</b>」は、当店の棚に並びました。', 6000);
    await NFX.sleep(1600);
    const end = $('#end');
    end.className = 'endcard dark'; end.hidden = false;
    const lines = [
      '汐見みなみ様の名前を、お届けしました。',
      'お支払いいただいた名前は、新しい商品として、裏の棚に並びます。',
      '特定商取引法の定めにより、あなたは当店のスタッフとして登録されました。',
      '前のスタッフには、お帰りいただきました。'
    ];
    end.innerHTML = '<div class="end-in">' + lines.map((l, i) => '<p style="animation-delay:' + (i * 1.1) + 's">' + E(l) + '</p>').join('')
      + '<div class="letter" style="opacity:0;animation:line 1s ease forwards;animation-delay:5.2s">ありがとう。<br>わたしの名前、ひらがなの。ちゃんと、かえってきた。<br>お母さんの声も、だれの声だったか、思い出したよ。<br><br>……ごめんね。<br>あなたの名前、棚にならんでる。<br>だれかが買いにきてくれるまで、お店のこと、よろしくね。<br><br>　　　　　　　　　　　　　　　　汐見 みなみ</div>'
      + '<p style="animation-delay:8.4s;margin-top:22px">店長日記　' + ymd(today) + '「はじめまして！」</p>'
      + '<p style="animation-delay:9.2s">' + E(NK.DIARY[0].body) + '</p>'
      + '<p class="end-t" style="animation-delay:10.6s">終　店長交代</p>'
      + '<p class="end-s" style="opacity:0;animation:line 1s ease forwards;animation-delay:11s">もうひとつの終わりがあります。払う名前は、会員登録のお名前です。</p>'
      + '<div class="end-acts" style="opacity:0;animation:line 1s ease forwards;animation-delay:11.4s">'
      + '<button type="button" class="btn" data-e="back">最後のお会計の前にもどる</button><button type="button" class="btn gray" data-e="shop">お店にもどる</button></div></div>';
    NFX.holes(end, st.moji, false);
    wireEnd();
  }

  /* =========================================================
     終わり②　閉店（店の名前で払った）
     ========================================================= */
  async function endClose() {
    closing = true;
    history.replaceState(null, '', '#/'); lastHash = '/';
    main.innerHTML = pTop(); renderSide(''); paintState(); holesAll(false); window.scrollTo(0, 0);
    await NFX.sleep(300);
    note('屋号「<b>ナクシタ堂</b>」をお支払いいただきました。', 4000);
    await NFX.sleep(900);
    const letters = document.querySelectorAll('#logo span');
    for (const l of letters) { l.classList.add('drop'); snd('fall'); await NFX.sleep(380); }
    await NFX.sleep(500);
    $('.catch').textContent = '　'; $('.hd-sub').textContent = '　';
    $('#sale').style.visibility = 'hidden';
    const cards = [...document.querySelectorAll('#main .card')];
    for (const c of cards) {
      c.classList.add('fly'); snd('pico');
      const it = ITEM(c.dataset.id);
      if (it && cards.indexOf(c) % 3 === 0) note('「' + E(it.name) + '」を、持ち主にお返ししました。', 1800);
      await NFX.sleep(260);
    }
    await NFX.sleep(1400);
    closing = false;
    showClosed(true);
  }

  function showClosed(animate) {
    document.body.classList.toggle('gray', st.paid.iro);
    document.title = NFX.holeText('お探しのページは見つかりませんでした', st.moji);
    const end = $('#end');
    end.className = 'endcard white'; end.hidden = false;
    const paid = [];
    if (st.paid.iro) paid.push('「色」');
    if (st.paid.kino) paid.push('「昨日」');
    st.moji.forEach(m => paid.push('「' + m + '」'));
    const d = (s) => animate ? ' style="animation-delay:' + s + 's"' : ' style="opacity:1;animation:none"';
    end.innerHTML = '<div class="end-in">'
      + '<p class="e404"' + d(0.2) + '>404</p>'
      + '<p' + d(0.9) + '><b>お探しのページは見つかりませんでした。</b></p>'
      + '<p' + d(1.8) + '>このお店は、屋号を失ったため、営業を終了しました。お預かりしていたものは、すべて持ち主のもとへお返ししました。</p>'
      + '<div class="rv"' + d(3.2) + ' data-keep><div class="rv-h"><b>みなみ</b><span class="stars">★★★★★</span><span>' + ymd(today) + '</span></div><p class="rv-t">かえってきました。わたしの名前、ひらがなの。お母さんの声が、お母さんの声だってことも。</p></div>'
      + '<p' + d(5) + ' style="font-size:12px;color:#999;margin-top:26px">' + (paid.length ? 'なお、お客様がお支払いになった' + paid.join('') + 'は、返品期限を過ぎているため、お戻しできません。' : 'ご利用、ありがとうございました。') + '</p>'
      + '<p class="end-t"' + d(6.4) + '>終　閉店</p>'
      + (st.ends.length < 2 ? '<p class="end-s"' + d(7) + '>もうひとつの終わりがあります。自分の名前のままで払ったら？</p>' : '<p class="end-s"' + d(7) + '>終わり 2/2</p>')
      + '<div class="end-acts"' + d(7.4) + '><button type="button" class="btn" data-e="back">最後のお会計の前にもどる</button><button type="button" class="btn gray" data-e="reset">最初からやり直す</button></div></div>';
    NFX.holes(end, st.moji, false);
    wireEnd();
  }

  function wireEnd() {
    const end = $('#end');
    end.onclick = async (e) => {
      const b = e.target.closest('[data-e]'); if (!b) return;
      if (b.dataset.e === 'shop') { end.hidden = true; location.hash = '#/'; render(); return; }
      if (b.dataset.e === 'back') {
        if (!st.snap) return;
        const ends = st.ends, m = st.muted;
        st = Object.assign(fresh(), st.snap); st.ends = ends; st.muted = m; st.snap = null;
        save(); location.hash = '#/ura/n5'; location.reload(); return;
      }
      if (b.dataset.e === 'reset') {
        if (!(await ask('記録を消して、最初からやり直しますか？', '最初からやり直す'))) return;
        const m = st.muted; st = fresh(); st.muted = m; st.welcome = true; save(); location.hash = '#/'; location.reload();
      }
    };
  }

  /* =========================================================
     窓（はじめてのお客様へ／確認）
     ========================================================= */
  function ask(text, okLabel) {
    return new Promise((res) => {
      const m = $('#modal');
      m.innerHTML = '<div class="mbox" role="alertdialog" aria-modal="true"><h2>ご確認</h2><div class="mb">' + E(text) + '</div><div class="mf"><button type="button" class="btn gray sm" data-m="no">やめておく</button><button type="button" class="btn red sm" data-m="ok">' + E(okLabel || 'はい') + '</button></div></div>';
      m.hidden = false;
      const done = (v) => { m.hidden = true; m.innerHTML = ''; document.removeEventListener('keydown', key); res(v); };
      const key = (e) => { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', key);
      m.onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) done(b.dataset.m === 'ok'); else if (e.target === m) done(false); };
      $('[data-m="ok"]', m).focus();
    });
  }

  function welcome() {
    const m = $('#modal');
    m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true"><h2>はじめてのお客様へ</h2><div class="mb"><ul>'
      + '<li>当店の商品は、すべて<b>どなたかがなくしたもの</b>です。</li>'
      + '<li>お支払いは<b>現金以外</b>で承ります。お手持ちの「使えるもの」は、マイページでご確認いただけます。</li>'
      + '<li>お支払いいただいたものは、<b>お戻しできません</b>。</li>'
      + '<li>送料無料・即日お届け（ただいま）。</li></ul></div>'
      + '<div class="mf"><button type="button" class="btn red" data-m="ok">お買い物をはじめる</button></div></div>';
    m.hidden = false;
    m.onclick = (e) => { if (e.target.closest('[data-m]')) { m.hidden = true; m.innerHTML = ''; st.welcome = true; save(); NSND.start(); NSND.mute(st.muted); snd('pico'); } };
  }

  /* ---------- 起動 ---------- */
  document.body.classList.add('boot');
  render();
  setTimeout(() => document.body.classList.remove('boot'), 120);
  if (st.ending === 'staff') { /* 店長交代のあとは、そのまま営業がつづく */ }
  if (!st.welcome && !st.ending) welcome();
})();
