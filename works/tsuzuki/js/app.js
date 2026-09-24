/* =========================================================
   つづきから — 机とゲーム機の本体
   電源・ボタン・ダイヤル・カセット・うらがわ・紙もの・ふくろとじ
   ========================================================= */
(() => {
  const KEY = 'tsuzuki.v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const HINT_AT = [2, 5, 8].map(m => m * 60000);

  /* ---------- 記録 ---------- */
  const freshGame = () => ({
    name: 'ユウ', pos: { map: 'house', x: 3, y: 3, dir: 'd' }, last: new Date(1999, 7, 30, 21, 47).getTime(), pt: (41 * 60 + 7) * 60000,
    money: 830, items: { batt: false, ramune: 0, hanabi: 0, stone: false }, secrets: [false, false, false, false, false, false, false, false],
    f: {}, c: {}, wish: '', d32: false, touched: false
  });
  const fresh = () => ({
    v: 1, playMs: 0, stuck: 0, hl: {}, ho: {}, offset: 0, clockSet: false, speed: 1, vol: 5, con: 5, sq: [], unlock16: false, heard16: false,
    ura: false, uraTalk: false, crash: 0, crashSeen: true, ending: '', finder: '', fair: false, redpen: false, peeled: false, bay: false, bought: Date.now(),
    game: freshGame()
  });
  let st = fresh();
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (r && r.game) {
      st = Object.assign(fresh(), r);
      st.game = Object.assign(freshGame(), r.game);
      st.game.items = Object.assign(freshGame().items, r.game.items || {});
    }
  } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  save();

  /* ---------- 本体 ---------- */
  const lcd = $('#lcd'), led = $('#led'), pwr = $('#pwr'), con = $('#console'), cart = $('#cart');
  let on = false;
  const host = { get st() { return st; }, save, vol: () => st.vol, con: () => st.con, emit };
  TGM.init({ host, lcd, canvas: $('#cv'), overlay: $('#ov') });
  function setPower(v) {
    on = v;
    pwr.setAttribute('aria-pressed', String(v));
    lcd.classList.toggle('off', !v); led.classList.toggle('on', v);
    TGM.power(v);
  }
  pwr.addEventListener('mousedown', (e) => e.preventDefault());
  pwr.addEventListener('click', () => setPower(!on));

  function emit(name) {
    if (name === 'progress') { st.stuck = 0; save(); paintBadge(); if (curDoc === 'fuku') refreshDoc(); }
    if (name === 'ending') { paintPen(); }
  }

  /* ---------- ボタン ---------- */
  const BTN = {};
  document.querySelectorAll('[data-b]').forEach((b) => {
    const k = b.dataset.b; BTN[k] = b;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { } b.classList.add('on'); TGM.down(k, e.pointerType === 'mouse' ? 'mouse' : 'touch'); });
    const upf = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); TGM.up(k); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, upf));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('click', (e) => e.preventDefault());
  });
  const dpad = $('#dpad');
  let dpDir = null, dpId = null;
  function dpFrom(e) {
    const r = dpad.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < 7) return dpDir;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'l' : 'r') : (y < 0 ? 'u' : 'd');
  }
  function dpSet(d) {
    if (d === dpDir) return;
    if (dpDir) TGM.up(dpDir);
    dpDir = d; dpad.className = 'dpad' + (d ? ' ' + d : '');
    if (d) TGM.down(d, 'touch');
  }
  dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); dpId = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (_) { } dpSet(dpFrom(e)); });
  dpad.addEventListener('pointermove', (e) => { if (e.pointerId === dpId) dpSet(dpFrom(e)); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => dpad.addEventListener(t, (e) => { if (e.pointerId !== dpId) return; dpId = null; dpSet(null); }));
  dpad.addEventListener('contextmenu', (e) => e.preventDefault());

  const KMAP = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', z: 'a', Z: 'a', ' ': 'a', k: 'a', K: 'a', x: 'b', X: 'b', j: 'b', J: 'b', Enter: 'start', Shift: 'select' };
  const keyHeld = {};
  const overlayOpen = () => reader.classList.contains('open') && getComputedStyle(reader).position === 'fixed';
  window.addEventListener('keydown', (e) => {
    if (!dlg.hidden) { if (e.key === 'Escape') closeDlg(false); return; }
    if (e.key === 'Escape') { closeReader(); return; }
    const k = KMAP[e.key];
    if (!k) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable], .wheel, .cart')) return;
    if (overlayOpen()) return;
    if ((e.key === 'Enter' || e.key === ' ') && t && t !== document.body && t.matches && t.matches('button, a, [tabindex]')) return;
    e.preventDefault();
    if (e.repeat || keyHeld[k]) return;
    keyHeld[k] = true;
    if (BTN[k]) BTN[k].classList.add('on');
    if (!BTN[k]) dpad.className = 'dpad ' + k;
    TGM.down(k, 'key');
  });
  window.addEventListener('keyup', (e) => {
    const k = KMAP[e.key];
    if (!k || !keyHeld[k]) return;
    keyHeld[k] = false;
    if (BTN[k]) BTN[k].classList.remove('on');
    if (!BTN[k] && dpDir == null) dpad.className = 'dpad';
    TGM.up(k);
  });
  window.addEventListener('blur', () => { Object.keys(keyHeld).forEach(k => { if (keyHeld[k]) { keyHeld[k] = false; TGM.up(k); if (BTN[k]) BTN[k].classList.remove('on'); } }); dpad.className = 'dpad'; });

  /* ---------- ダイヤル（ボリューム・コントラスト） ---------- */
  function wheel(el, key, onChange, lb, name) {
    let showT = null;
    const show = () => { lb.textContent = name + ' ' + st[key]; lb.classList.add('show'); clearTimeout(showT); showT = setTimeout(() => { lb.classList.remove('show'); lb.textContent = name; }, 1300); };
    const paint = () => { el.setAttribute('aria-valuenow', st[key]); el.style.setProperty('--wp', (st[key] * 3) + 'px'); };
    const set = (n) => { n = Math.max(0, Math.min(10, n)); if (n !== st[key]) { st[key] = n; save(); paint(); onChange(n); } show(); };
    let y0 = null, v0 = 0, id = null, moved = false;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; try { el.setPointerCapture(id); } catch (_) { } y0 = e.clientY; v0 = st[key]; moved = false; show(); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId !== id || y0 == null) return; const d = Math.round((y0 - e.clientY) / 7); if (d) moved = true; set(v0 + d); });
    el.addEventListener('pointerup', (e) => {
      if (e.pointerId !== id) return;
      if (!moved) { const r = el.getBoundingClientRect(); set(st[key] + (e.clientY < r.top + r.height / 2 ? 1 : -1)); }
      y0 = null; id = null;
    });
    el.addEventListener('pointercancel', () => { y0 = null; id = null; });
    el.addEventListener('wheel', (e) => { e.preventDefault(); set(st[key] + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(st[key] + 1); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(st[key] - 1); }
    });
    paint();
  }
  wheel($('#w-vol'), 'vol', (n) => TGM.setVol(n), $('#lb-vol'), 'VOL');
  wheel($('#w-con'), 'con', () => TGM.contrast(), $('#lb-con'), 'CONTRAST');

  /* ---------- カセット ---------- */
  let cartState = 'in', drag = null;
  function paintCart() {
    cart.classList.toggle('half', cartState === 'half');
    cart.classList.toggle('out', cartState === 'out');
    cart.style.removeProperty('--pull');
    $('#cart-btn').hidden = cartState !== 'out';
    $('#cart-flip').hidden = cartState !== 'out';
    cart.setAttribute('aria-valuenow', cartState === 'in' ? '0' : cartState === 'half' ? '50' : '100');
    cart.setAttribute('aria-label', cartState === 'out' ? 'カセット（ぬいてある。おすと さしこむ）' : 'カセット（上に引くと抜ける）');
  }
  function setCart(s) {
    if (s === cartState) { paintCart(); return; }
    cartState = s;
    if (s !== 'out') cart.classList.toggle('turn', con.classList.contains('flipped'));
    paintCart();
    TGM.cart(s);
  }
  cart.addEventListener('pointerdown', (e) => {
    if (cartState === 'out') return;
    e.preventDefault();
    try { cart.setPointerCapture(e.pointerId); } catch (_) { }
    drag = { id: e.pointerId, y: e.clientY, h: cart.offsetHeight, base: cartState === 'half' ? 0.2 : 0, moved: false, pull: null };
    cart.classList.add('drag');
  });
  cart.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = drag.y - e.clientY;
    if (Math.abs(dy) > 5) drag.moved = true;
    drag.pull = drag.base + dy / drag.h;
    cart.classList.remove('half');
    cart.style.setProperty('--pull', Math.max(0, Math.min(0.38, drag.pull)));
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = drag.pull == null ? drag.base : drag.pull, moved = drag.moved;
    drag = null; cart.classList.remove('drag');
    if (!moved) { if (cartState === 'half') setCart('in'); else paintCart(); return; }
    if (on) setCart(p >= 0.7 ? 'out' : p >= 0.12 ? 'half' : 'in');
    else setCart(p >= 0.3 ? 'out' : 'in');
  };
  cart.addEventListener('pointerup', endDrag);
  cart.addEventListener('pointercancel', endDrag);
  cart.addEventListener('click', () => { if (cartState === 'out') insertCart(); });
  cart.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); setCart(cartState === 'in' ? (on ? 'half' : 'out') : 'out'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); insertCart(); }
    if ((e.key === 'Enter' || e.key === ' ') && cartState === 'out') { e.preventDefault(); insertCart(); }
  });
  function insertCart() { cart.classList.remove('turn'); setCart('in'); }
  $('#cart-btn').addEventListener('click', insertCart);
  $('#cart-flip').addEventListener('click', () => cart.classList.toggle('turn'));

  /* ---------- 本体のうらがわ ---------- */
  const flipBtn = $('#flip'), bay = $('#bk-bay');
  flipBtn.addEventListener('click', () => {
    const f = con.classList.toggle('flipped');
    flipBtn.textContent = f ? '本体を おもてに もどす' : '本体を うらがえす';
    $('.c-back').setAttribute('aria-hidden', String(!f));
    $('.c-front').setAttribute('aria-hidden', String(f));
    if (cartState !== 'out') cart.classList.toggle('turn', f);
  });
  if (st.bay) bay.classList.add('open');
  $('#bk-cover').addEventListener('click', () => { bay.classList.add('open'); st.bay = true; save(); });
  $('#bk-note').addEventListener('click', () => openDoc('note'));

  /* =========================================================
     机の上のもの（読むところ）
     ========================================================= */
  const reader = $('#reader'), rdDoc = $('#rd-doc'), rdEmpty = $('#rd-empty'), rdT = $('#rd-t'), rdB = $('#rd-body');
  let curDoc = null, page = 0, magBack = false, penMode = false;
  const DOCS = {
    manual: { t: 'せつめいしょ（とこなつ島）', r: () => '<div class="mn">' + TK.MANUAL[page].h + '</div><div class="rd-nav"><button type="button" data-nav="-1"' + (page ? '' : ' disabled') + '>← まえ</button><span>' + (page + 1) + ' / ' + TK.MANUAL.length + '　' + esc(TK.MANUAL[page].t) + '</span><button type="button" data-nav="1"' + (page < TK.MANUAL.length - 1 ? '' : ' disabled') + '>つぎ →</button></div>' },
    mag: { t: 'ピコマガ 1999年11月号の きりぬき', r: () => '<div class="mg">' + (magBack ? TK.MAGAZINE.back : TK.MAGAZINE.front) + '</div><div class="rd-flip"><button type="button" data-flip>' + (magBack ? 'おもてを みる' : 'うらを みる') + '</button></div>' },
    memo: { t: 'ユウの メモ', r: () => '<div class="memo">' + TK.MEMO + '</div>' },
    note: { t: 'でんちの ところに はさまっていた紙', r: () => '<div class="note">' + TK.NOTE + '</div>' },
    box: { t: 'ゲーム機の はこ', r: () => TK.BOX },
    fuku: { t: 'ふくろとじ', r: renderFuku }
  };
  function openDoc(k) {
    if (k === 'pen') { penMode = true; k = 'mag'; magBack = false; }
    else if (k === 'mag') penMode = false;
    curDoc = k;
    rdT.textContent = DOCS[k].t;
    rdEmpty.hidden = true; rdDoc.hidden = false;
    rdDoc.style.animation = 'none'; void rdDoc.offsetWidth; rdDoc.style.animation = '';
    reader.classList.add('open');
    refreshDoc(true);
    document.querySelectorAll('.item').forEach(i => i.classList.toggle('on', i.dataset.doc === k || (k === 'mag' && penMode && i.dataset.doc === 'pen')));
  }
  function refreshDoc(top) {
    if (!curDoc) return;
    const y = rdB.scrollTop;
    rdB.innerHTML = DOCS[curDoc].r();
    rdB.scrollTop = top ? 0 : y;
    if (curDoc === 'mag') {
      const red = $('#mg-red'), yu = rdB.querySelector('.mg-yu');
      if (red) red.hidden = !st.redpen;
      if (yu && penMode && !st.redpen) yu.classList.add('can');
    }
    if (curDoc === 'box') {
      const tag = $('#tag');
      if (st.peeled) tag.classList.add('peel');
    }
  }
  function closeReader() {
    reader.classList.remove('open');
    rdDoc.hidden = true; rdEmpty.hidden = false; curDoc = null; penMode = false;
    document.querySelectorAll('.item.on').forEach(i => i.classList.remove('on'));
  }
  $('#rd-x').addEventListener('click', closeReader);
  reader.addEventListener('click', (e) => { if (e.target === reader) closeReader(); });
  document.querySelectorAll('.item').forEach(b => b.addEventListener('click', () => { openDoc(b.dataset.doc); b.blur(); }));
  rdB.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { page = Math.max(0, Math.min(TK.MANUAL.length - 1, page + +nav.dataset.nav)); refreshDoc(true); return; }
    if (e.target.closest('[data-flip]')) { magBack = !magBack; refreshDoc(true); return; }
    if (curDoc === 'mag' && penMode && !st.redpen && e.target.closest('#mg-yu-v')) {
      st.redpen = true; save(); refreshDoc(false); paintPen(); return;
    }
    const tag = e.target.closest('#tag');
    if (tag && !st.peeled) {
      if (!tag.classList.contains('half')) { tag.classList.add('half'); return; }
      tag.classList.add('peel'); st.peeled = true; save(); paintPen(); return;
    }
    const seal = e.target.closest('[data-k]');
    if (seal && !seal.disabled) { st.ho[seal.dataset.k + seal.dataset.j] = true; save(); refreshDoc(false); paintBadge(); return; }
    if (e.target.closest('#fk-reset')) {
      ask('ユウの セーブデータも、机の上も、ぜんぶ さいしょに もどします。いいですか？', 'さいしょから').then((ok) => {
        if (!ok) return;
        try { localStorage.removeItem(KEY); } catch (_) { }
        location.reload();
      });
    }
  });

  /* ---------- ふくろとじ ---------- */
  const solved = (k) => k === 'clock' ? !!st.clockSet : !!st.game.secrets[+k.slice(1)];
  const avail = (k) => {
    if (k === 'clock' || k === 's0' || k === 's1' || k === 's2' || k === 's6') return true;
    if (k === 's7') return st.game.secrets.slice(0, 7).every(Boolean);
    return !!st.clockSet;
  };
  const lockWhy = (k) => k === 's7' ? 'ななつ そろってから' : 'とけいを あわせてから';
  function tickHints() {
    const n = HINT_AT.filter(t => st.stuck >= t).length;
    TK.HINTS.forEach(h => { if (!solved(h.k) && avail(h.k)) st.hl[h.k] = Math.max(st.hl[h.k] || 0, n); });
  }
  function renderFuku() {
    const left = (j) => Math.max(1, Math.ceil((HINT_AT[j] - st.stuck) / 60000));
    let html = '<div class="fk"><p class="fk-h">ピコマガ とくべつふろく<br>とこなつ島 7つの ひみつ（＋1？）</p>'
      + '<p class="fk-lead">こまったら、ここを きりひらこう。……でも、すぐには あけられないよ。かんがえている じかんが ながくなるほど、あけられる ふくろとじが ふえていく。</p>';
    TK.HINTS.forEach((h) => {
      const done = solved(h.k), av = avail(h.k), lv = done ? 3 : (st.hl[h.k] || 0);
      html += '<div class="fk-sec' + (done ? ' done' : '') + (av || done ? '' : ' lock') + '"><p class="fk-t">' + esc(h.t) + (done ? '<span>✔ みつけた！</span>' : '') + '</p>';
      if (!av && !done) { html += '<div class="fk-s"><button type="button" disabled>まだ ふうが かたい（' + lockWhy(h.k) + '）</button></div></div>'; return; }
      h.h.forEach((tx, j) => {
        const name = j < 2 ? 'ヒント' + (j + 1) : 'こたえ';
        if (st.ho[h.k + j]) html += '<div class="fk-s"><p><b>' + name + '</b>　' + esc(tx) + '</p></div>';
        else if (done) html += '<div class="fk-s"><button type="button" data-k="' + h.k + '" data-j="' + j + '">' + name + '（もう みつけた ひみつ）</button></div>';
        else {
          const can = lv > j;
          html += '<div class="fk-s"><button type="button" data-k="' + h.k + '" data-j="' + j + '"' + (can ? '' : ' disabled') + '>'
            + (can ? '✂ ' + name + 'の ふくろとじを ひらく' : name + '：あと ' + left(j) + 'ぷん かんがえたら あけてね') + '</button></div>';
        }
      });
      html += '</div>';
    });
    html += '<div class="fk-reset"><p>さいしょから あそびなおす（ユウの セーブデータも、机の上も、もとに もどります）</p><button type="button" id="fk-reset">きろくを けして、さいしょから</button></div></div>';
    return html;
  }
  function paintBadge() {
    const b = $('#fuku-badge');
    let n = 0;
    TK.HINTS.forEach(h => { if (solved(h.k) || !avail(h.k)) return; const lv = st.hl[h.k] || 0; for (let j = 0; j < lv; j++) if (!st.ho[h.k + j]) n++; });
    b.hidden = !n; b.textContent = n;
  }
  function paintPen() { $('.it-pen').hidden = !st.ending; document.body.classList.toggle('peeled', !!st.peeled); document.body.classList.toggle('redpen', !!st.redpen); }

  /* ---------- 確認の箱 ---------- */
  const dlg = $('#dlg');
  let dlgRes = null;
  function ask(text, okLabel) {
    return new Promise((res) => {
      $('#dlg-t').textContent = text; $('#dlg-ok').textContent = okLabel || 'はい';
      dlg.hidden = false; dlgRes = res; $('#dlg-ok').focus();
    });
  }
  function closeDlg(v) { dlg.hidden = true; if (dlgRes) { const r = dlgRes; dlgRes = null; r(v); } }
  $('#dlg-ok').addEventListener('click', () => closeDlg(true));
  $('#dlg-no').addEventListener('click', () => closeDlg(false));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(false); });

  /* ---------- 時間（遊んだ時間・考えている時間） ---------- */
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    st.playMs = (st.playMs || 0) + 5000;
    if (!st.ending) st.stuck = (st.stuck || 0) + 5000;
    if (on && TGM.mode === 'field' && !TGM.uraOn) st.game.pt += 5000;
    const before = JSON.stringify(st.hl);
    tickHints();
    save();
    if (JSON.stringify(st.hl) !== before || curDoc === 'fuku') { paintBadge(); if (curDoc === 'fuku') refreshDoc(false); }
  }, 5000);
  document.addEventListener('visibilitychange', () => TSN.suspend(document.hidden));

  /* ---------- はじめ ---------- */
  const d = new Date(st.bought || Date.now());
  $('#rc-date').textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日　' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (matchMedia('(hover: none)').matches) $('#keys').hidden = true;
  tickHints(); paintBadge(); paintPen(); paintCart();
})();
