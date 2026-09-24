/* =========================================================
   つづきから — ゲーム機の中身
   画面（160×144）・入力・島を歩く・文字の窓・タイトル・とけい・サウンドテスト
   ========================================================= */
window.TGM = (() => {
  const W = 160, H = 144, T = 16, STEP = 12;
  const DIR = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  let host = null;
  let cv, cx, idata, out, prev, lcd, ov, fadeEl;
  const IDX = new Uint8Array(W * H), PB = new Uint8Array(W * H);
  let reduce = false;

  /* ---------- 状態 ---------- */
  let mode = 'off', gen = 0, tick = 0, busy = 0, fading = false;
  let colorOn = false, uraOn = false, uraBack = null;
  let pal = null, palKey = '';
  const sv = () => host.st.game;
  const gnow = () => new Date(Date.now() + (host.st.offset || 0));

  /* =========================================================
     入力
     ========================================================= */
  const held = { u: 0, d: 0, l: 0, r: 0, a: 0, b: 0, start: 0, select: 0 };
  let stickySel = 0, lastDir = null;
  function down(btn, src) {
    if (held[btn]) return;
    held[btn] = 1;
    if (DIR[btn]) lastDir = btn;
    if (btn === 'select' && src !== 'key') stickySel = performance.now() + 2600;
    if (btn !== 'select' && btn !== 'b' && !DIR[btn] && src !== 'key') stickySel = 0;
    if (mode !== 'off' && mode !== 'crash' && held.a && held.b && held.start && held.select) { softReset(); return; }
    press(btn);
  }
  function up(btn) {
    held[btn] = 0;
    if (lastDir === btn) lastDir = ['u', 'd', 'l', 'r'].find(k => held[k]) || null;
  }
  const selHeld = () => held.select || performance.now() < stickySel;
  function press(b) {
    if (mode === 'off' || mode === 'crash' || mode === 'nocart' || mode === 'boot') return;
    const top = uiTop();
    if (top) { top.key(b); return; }
    const h = KEYS[mode];
    if (h) h(b);
  }

  /* =========================================================
     文字の窓（会話・選択・名前入力など）
     ========================================================= */
  const ui = [];
  const uiTop = () => ui[ui.length - 1];
  function pushUI(w) { ui.push(w); ov.appendChild(w.el); }
  function popUI(w) { const i = ui.indexOf(w); if (i >= 0) ui.splice(i, 1); if (w.el) w.el.remove(); if (w.done) w.done(); }
  function clearUI() { ui.splice(0).forEach(w => { if (w.el) w.el.remove(); if (w.done) w.done(); }); }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const msPer = () => [58, 30, 10][host.st.speed == null ? 1 : host.st.speed];
  const dead = () => new Promise(() => { });

  function typeBox(text, opt) {
    const box = el('div', 'tb' + (opt && opt.top ? ' top' : ''));
    const p = el('p'); p.setAttribute('aria-live', 'polite'); box.appendChild(p);
    const more = el('i', 'tb-more'); more.hidden = true; box.appendChild(more);
    let ci = 0, full = false, timer = null, onFull = null;
    const step = () => {
      if (ci >= text.length) { full = true; if (!opt || !opt.nomore) more.hidden = false; if (onFull) onFull(); return; }
      ci++; p.textContent = text.slice(0, ci);
      if (ci % 2 === 0 && text[ci - 1] !== ' ') TSN.sfx('blip');
      timer = setTimeout(step, msPer());
    };
    return {
      el: box, start() { step(); }, get full() { return full; },
      finish() { clearTimeout(timer); ci = text.length; p.textContent = text; full = true; if (!opt || !opt.nomore) more.hidden = false; if (onFull) onFull(); },
      set(t) { clearTimeout(timer); text = t; ci = 0; full = false; more.hidden = true; p.textContent = ''; step(); },
      onFull(fn) { onFull = fn; }, stop() { clearTimeout(timer); }
    };
  }
  function say(pages, opt) {
    const g = gen;
    pages = [].concat(pages).filter(p => p != null && p !== '');
    if (!pages.length || g !== gen) return Promise.resolve();
    return new Promise((res) => {
      let i = 0;
      const tb = typeBox(pages[0], opt);
      const w = {
        el: tb.el, done: () => tb.stop(),
        key(b) {
          if (b !== 'a' && b !== 'b') return;
          if (!tb.full) { tb.finish(); return; }
          i++;
          if (i >= pages.length) { popUI(w); if (g === gen) res(); }
          else tb.set(pages[i]);
        }
      };
      pushUI(w); tb.start();
    });
  }
  function menuWin(items, opt) {
    opt = opt || {};
    const g = gen;
    return new Promise((res) => {
      const box = el('div', 'mw ' + (opt.cls || ''));
      if (opt.title) box.appendChild(el('p', 'mw-t', esc(opt.title)));
      const ul = el('ul'); box.appendChild(ul);
      const lis = items.map((it) => { const li = el('li', null, esc(typeof it === 'string' ? it : it.label)); ul.appendChild(li); return li; });
      let cur = opt.start || 0;
      const paint = () => lis.forEach((li, i) => li.classList.toggle('sel', i === cur));
      const w = {
        el: box,
        key(b) {
          if (b === 'u') { cur = (cur + items.length - 1) % items.length; TSN.sfx('cursor'); paint(); if (opt.onMove) opt.onMove(cur, lis); }
          else if (b === 'd') { cur = (cur + 1) % items.length; TSN.sfx('cursor'); paint(); if (opt.onMove) opt.onMove(cur, lis); }
          else if (b === 'a') { TSN.sfx('ok'); popUI(w); if (g === gen) res(cur); }
          else if (b === 'b' && opt.cancel !== false) { TSN.sfx('cancel'); popUI(w); if (g === gen) res(-1); }
        }
      };
      pushUI(w); paint();
    });
  }
  async function ask(q, opts, opt) {
    const g = gen;
    const tb = typeBox(q, { nomore: true });
    const holder = { el: tb.el, key(b) { if ((b === 'a' || b === 'b') && !tb.full) tb.finish(); } };
    pushUI(holder);
    await new Promise(r => { tb.onFull(r); tb.start(); });
    if (g !== gen) return dead();
    const i = await menuWin(opts || ['はい', 'いいえ'], Object.assign({ cls: 'ask' }, opt));
    popUI(holder);
    return i;
  }
  const H_ROWS = ['あいうえおなにぬねの', 'かきくけこはひふへほ', 'さしすせそまみむめも', 'たちつてとやゆよゃゅ', 'らりるれろわをんょっ', 'がぎぐげござじずぜぞ', 'だぢづでどばびぶべぼ', 'ぱぴぷぺぽー！？…　'];
  const toKata = (c) => (c >= 'ぁ' && c <= 'ゖ') ? String.fromCharCode(c.charCodeAt(0) + 0x60) : c;
  function nameEntry(title, max, init) {
    const g = gen;
    return new Promise((res) => {
      let name = init || '', cx = 0, cy = 0, kata = false;
      const box = el('div', 'nm');
      const head = el('p', 'nm-t', esc(title)); const line = el('p', 'nm-v'); const grid = el('div', 'nm-g'); const foot = el('div', 'nm-f');
      box.append(head, line, grid, foot);
      const cells = [];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) { const c = el('span'); grid.appendChild(c); cells.push(c); }
      const btns = ['カナ', 'けす', 'おわり'].map(t => { const s = el('span', null, t); foot.appendChild(s); return s; });
      const paint = () => {
        H_ROWS.forEach((row, y) => [...row].forEach((ch, x) => { const c = cells[y * 10 + x]; c.textContent = kata ? toKata(ch) : ch; c.classList.toggle('sel', cy === y && cx === x); }));
        btns[0].textContent = kata ? 'かな' : 'カナ';
        btns.forEach((b, i) => b.classList.toggle('sel', cy === 8 && Math.min(2, Math.floor(cx / 3.4)) === i));
        line.innerHTML = [...Array(max)].map((_, i) => '<b>' + esc(name[i] || '') + '</b>').join('');
      };
      const add = (ch) => { if (name.length < max && ch !== '　') { name += ch; TSN.sfx('cursor'); } else TSN.sfx('bump'); };
      const finish = () => { popUI(w); if (g === gen) res(name.trim()); };
      const w = {
        el: box,
        key(b) {
          if (b === 'u') cy = (cy + 8) % 9; else if (b === 'd') cy = (cy + 1) % 9;
          else if (b === 'l') cx = (cx + 9) % 10; else if (b === 'r') cx = (cx + 1) % 10;
          else if (b === 'b') { if (name.length) { name = name.slice(0, -1); TSN.sfx('cancel'); } }
          else if (b === 'start') { TSN.sfx('ok'); finish(); return; }
          else if (b === 'a') {
            if (cy < 8) add(kata ? toKata(H_ROWS[cy][cx]) : H_ROWS[cy][cx]);
            else { const i = Math.min(2, Math.floor(cx / 3.4)); if (i === 0) { kata = !kata; TSN.sfx('cursor'); } else if (i === 1) { name = name.slice(0, -1); TSN.sfx('cancel'); } else { TSN.sfx('ok'); finish(); return; } }
          }
          if (DIR[b]) TSN.sfx('cursor');
          paint();
        }
      };
      pushUI(w); paint();
    });
  }
  function panel(html, cls) {
    const g = gen;
    return new Promise((res) => {
      const box = el('div', 'full ' + (cls || ''), html);
      const w = { el: box, key(b) { if (b === 'a' || b === 'b' || b === 'start') { TSN.sfx('cancel'); popUI(w); if (g === gen) res(); } } };
      pushUI(w);
    });
  }
  let toastT = null;
  function toast(html) {
    let t = ov.querySelector('.toast');
    if (!t) { t = el('div', 'toast'); ov.appendChild(t); }
    t.innerHTML = html; clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 2200);
  }
  const wait = (ms) => { const g = gen; return new Promise(r => setTimeout(() => { if (g === gen) r(); }, ms)); };
  async function fade(outIn, ms) {
    fadeEl.style.transitionDuration = (ms || 180) + 'ms';
    fadeEl.classList.toggle('on', outIn === 'out');
    await wait(ms || 180);
  }

  /* =========================================================
     描く（色番号の画面 → 実際の色）
     ========================================================= */
  function clr(c, p) { IDX.fill(c); PB.fill(p || 0); }
  function put(x, y, c, p) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < W && y < H) { const i = y * W + x; IDX[i] = c; PB[i] = p || 0; } }
  function rectF(x, y, w, h, c, p) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c, p); }
  function discF(cx0, cy0, r, c, p) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) put(cx0 + x, cy0 + y, c, p); }
  function blit(a, x, y, p, cut) {
    x |= 0; y |= 0;
    const w = a.w, h = a.h;
    for (let j = 0; j < h; j++) {
      const yy = y + j; if (yy < 0 || yy >= H) continue;
      if (cut && yy >= cut) continue;
      for (let i = 0; i < w; i++) {
        const xx = x + i; if (xx < 0 || xx >= W) continue;
        const v = a[j * w + i]; if (v === 255) continue;
        const k = yy * W + xx; IDX[k] = v; PB[k] = p || 0;
      }
    }
  }
  const mirrors = new Map();
  const mir = (a) => { if (!mirrors.has(a)) mirrors.set(a, TPX.mirror(a)); return mirrors.get(a); };

  function palName() {
    if (mode !== 'field' && mode !== 'credits') return 'day';
    if (uraOn) return 'ura';
    if (colorOn || (sv() && sv().d32)) return 'color';
    if (mode === 'credits') return 'day';
    if (M && M.set === 'in' && mapName !== 'lh2' && mapName !== 'cave') return 'day';
    return (isle && isle.tod) || 'day';
  }
  function usePal() {
    const name = palName(), con = host.con();
    const key = name + ':' + con;
    if (key === palKey) return;
    palKey = key; pal = TPX.build(name, con);
    const base = pal.color ? pal.pal[0] : pal.pal;
    const css = (c) => 'rgb(' + c.join(',') + ')';
    ['--c0', '--c1', '--c2', '--c3'].forEach((v, i) => lcd.style.setProperty(v, css(base[i])));
    lcd.style.setProperty('--ghost', css(base[4]));
    lcd.style.setProperty('--glow', css(base[5]));
  }
  function present() {
    usePal();
    const P = pal, ghost = !reduce && mode !== 'crash';
    for (let i = 0, j = 0; i < W * H; i++, j += 4) {
      const c = IDX[i];
      const col = P.color ? (P.pal[PB[i]] || P.pal[0])[c] || P.pal[0][0] : P.pal[c] || P.pal[0];
      if (ghost) {
        prev[j] = prev[j] * 0.3 + col[0] * 0.7; prev[j + 1] = prev[j + 1] * 0.3 + col[1] * 0.7; prev[j + 2] = prev[j + 2] * 0.3 + col[2] * 0.7;
        out[j] = prev[j]; out[j + 1] = prev[j + 1]; out[j + 2] = prev[j + 2];
      } else { out[j] = prev[j] = col[0]; out[j + 1] = prev[j + 1] = col[1]; out[j + 2] = prev[j + 2] = col[2]; }
      out[j + 3] = 255;
    }
    cx.putImageData(idata, 0, 0);
  }

  /* 灯台の光りかた：4つ・2つ・3つ（むれせんこう） */
  const LH = (() => {
    const on = 240, off = 300, gap = 1150, tail = 2600, spans = []; let t = 0;
    [4, 2, 3].forEach((n) => { for (let i = 0; i < n; i++) { spans.push([t, t + on]); t += on + off; } t += gap - off; });
    return { spans, total: t + tail };
  })();
  const lhOn = (ms) => { const x = ms % LH.total; return LH.spans.some(([a, b]) => x >= a && x < b); };

  /* =========================================================
     タイトルまわり
     ========================================================= */
  let titleMsg = '', bootT = 0;
  function drawTitleArt(dim) {
    clr(0, 17);
    for (let x = 0; x < W; x += 2) put(x + (tick >> 3) % 2, 70, 1, 17);
    discF(124, 40, 13, 1, 16); discF(124, 40, 10, 0, 16);
    [[20, 26, 18], [70, 18, 12], [96, 34, 10]].forEach(([x0, y0, w0], i) => { const x = (x0 + (tick >> (5 + i))) % 180 - 10; rectF(x, y0, w0, 3, 1, 17); rectF(x + 3, y0 - 2, w0 - 6, 2, 1, 17); });
    rectF(0, 76, W, H - 76, 2, 2);
    for (let y = 82; y < H; y += 7) for (let x = ((y * 7 + (tick >> 3)) % 20) - 20; x < W; x += 20) { rectF(x, y, 6, 1, 1, 2); put(x + 2, y - 1, 0, 2); }
    const hill = (x) => 76 - Math.max(0, Math.round(16 * Math.sin((x - 12) / 96 * Math.PI)) + (x > 40 && x < 60 ? 2 : 0));
    for (let x = 12; x < 112; x++) for (let y = hill(x); y < 80; y++) put(x, y, 3, 1);
    [[30, 3], [46, 4], [58, 3]].forEach(([x, r]) => discF(x, hill(x) - r, r, 3, 13));
    rectF(96, 50, 6, 16, 0, 6); rectF(95, 50, 1, 16, 3, 6); rectF(102, 50, 1, 16, 3, 6); rectF(96, 56, 6, 2, 2, 6);
    rectF(95, 45, 8, 5, 3, 6); rectF(96, 46, 6, 3, lhOn(performance.now()) ? 5 : 1, 6); rectF(97, 43, 4, 2, 3, 6);
    if (dim) for (let i = 0; i < W * H; i += 2) if (((i / W | 0) + i) % 4 === 0) IDX[i] = Math.min(3, IDX[i] + 1);
  }
  function showTitle() {
    mode = 'title'; clearUI(); colorOn = false;
    ov.querySelectorAll('.scr').forEach(n => n.remove());
    const s = host.st;
    const t = el('div', 'scr title-scr',
      '<p class="t-logo">とこなつ島</p><p class="t-sub">〜なつやすみの ひみつ〜</p>'
      + '<p class="t-ghost" aria-hidden="true">ミケの ともだち まこと</p>'
      + '<p class="t-push">PUSH START</p><p class="t-copy">©1999 ヒバリソフト</p>'
      + '<p class="t-bat">でんち　よわい</p>'
      + (titleMsg ? '<p class="t-msg">' + esc(titleMsg) + '</p>' : ''));
    ov.appendChild(t);
    titleMsg = '';
    if (s.crash && !s.crashSeen) { s.crashSeen = true; host.save(); toast('……さっき、カセット ぬいたでしょ'); }
    TSN.mode('normal'); TSN.play(0);
    comboB = 0;
  }
  let comboB = 0, comboT = 0;
  async function titleMenu() {
    mode = 'menu';
    const g = gen;
    const i = await menuWin(['つづきから', 'はじめから', 'せってい'], { cls: 'title-menu', title: '' });
    if (g !== gen) return;
    if (i === 0) showSlot();
    else if (i === 1) {
      const s = sv();
      if (s.d32) await say(['この なつやすみは、もう おわりました。', '……また いつか。']);
      else {
        const a = await ask('この カセットには、まだ だれかの なつやすみが のこっています。けして はじめますか？', ['はい', 'いいえ']);
        if (a === 0) {
          const b = await ask('……ほんとうに？', ['はい', 'いいえ']);
          if (b === 0) await say(['……', 'けせませんでした。', '（カセットが、いやがっている きがする）']);
        }
      }
      if (g === gen) titleMenu();
    }
    else if (i === 2) settings();
    else if (g === gen) showTitle();
  }
  async function settings() {
    mode = 'menu';
    const g = gen;
    const sp = ['おそい', 'ふつう', 'はやい'];
    const i = await menuWin(['サウンドテスト', 'もじの はやさ：' + sp[host.st.speed == null ? 1 : host.st.speed], 'もどる'], { title: 'せってい' });
    if (g !== gen) return;
    if (i === 0) soundTest();
    else if (i === 1) { host.st.speed = ((host.st.speed == null ? 1 : host.st.speed) + 1) % 3; host.save(); settings(); }
    else titleMenu();
  }
  /* とけいあわせ（ひみつの画面） */
  let clk = null;
  function showClock() {
    mode = 'clock'; clearUI();
    ov.querySelectorAll('.scr').forEach(n => n.remove());
    const d = gnow();
    clk = { f: [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()], i: 1 };
    ov.appendChild(el('div', 'scr full clk', '<p class="clk-t">とけい あわせ</p><p class="clk-v"></p><p class="clk-h">←→ えらぶ　↑↓ かえる<br>A けってい　B やめる<br>SELECT ほんとうの じかん</p>'));
    paintClock();
    TSN.sfx('sparkle');
  }
  const dim = (y, m) => new Date(y, m, 0).getDate();
  function paintClock() {
    const [Y, Mo, D, h, m] = clk.f;
    const v = ov.querySelector('.clk-v');
    const seg = [String(Y), String(Mo), String(D), String(h).padStart(2, '0'), String(m).padStart(2, '0')];
    v.innerHTML = seg.map((s, i) => '<span class="' + (clk.i === i ? 'on' : '') + '">' + s + '</span>' + ['ねん', 'がつ', 'にち<br>', ':', ''][i]).join('');
  }
  function clockKey(b) {
    const f = clk.f;
    if (b === 'l') clk.i = (clk.i + 4) % 5;
    else if (b === 'r') clk.i = (clk.i + 1) % 5;
    else if (b === 'u' || b === 'd') {
      const s = b === 'u' ? 1 : -1, i = clk.i;
      const lim = [[1999, 2099], [1, 12], [1, dim(f[0], f[1])], [0, 23], [0, 59]][i];
      f[i] += s; if (f[i] > lim[1]) f[i] = lim[0]; if (f[i] < lim[0]) f[i] = lim[1];
      f[2] = Math.min(f[2], dim(f[0], f[1]));
    }
    else if (b === 'a') {
      const target = new Date(f[0], f[1] - 1, f[2], f[3], f[4], 0).getTime();
      host.st.offset = target - Date.now(); host.st.clockSet = true; host.save(); host.emit('progress');
      TSN.sfx('ok'); titleMsg = 'とけいを あわせました'; showTitle(); return;
    }
    else if (b === 'b') { TSN.sfx('cancel'); showTitle(); return; }
    else if (b === 'select') { host.st.offset = 0; host.save(); TSN.sfx('ok'); titleMsg = 'ほんとうの じかんに もどしました'; showTitle(); return; }
    if (DIR[b]) TSN.sfx('cursor');
    paintClock();
  }
  /* サウンドテスト */
  let snum = 0;
  function soundTest() {
    mode = 'sound'; clearUI();
    ov.querySelectorAll('.scr').forEach(n => n.remove());
    ov.appendChild(el('div', 'scr full snd', '<p class="snd-t">サウンドテスト</p><p class="snd-n"></p><p class="snd-name"></p><p class="snd-h">←→ えらぶ　A ならす<br>B もどる</p>'));
    TSN.stop(); paintSound();
  }
  function paintSound() {
    const s = host.st;
    ov.querySelector('.snd-n').textContent = '◀ ' + String(snum).padStart(2, '0') + ' ▶';
    ov.querySelector('.snd-name').textContent = snum === 16 ? (s.heard16 ? 'とうだいの うた' : '？？？') : TK.TRACKS[snum].n;
  }
  function soundKey(b) {
    const s = host.st, max = s.unlock16 ? 16 : 15;
    if (b === 'l') { snum = (snum + max) % (max + 1); TSN.sfx('cursor'); }
    else if (b === 'r') { snum = (snum + 1) % (max + 1); TSN.sfx('cursor'); }
    else if (b === 'a') {
      TSN.play(snum, { restart: true });
      s.sq = (s.sq || []).concat(snum).slice(-3);
      if (!s.unlock16 && s.sq.join(',') === '4,2,3') {
        s.unlock16 = true; host.save();
        setTimeout(() => { TSN.sfx('sparkle'); toast('……？？？が ふえた'); }, 300);
      }
      if (snum === 16 && !s.heard16) { s.heard16 = true; host.save(); host.emit('progress'); }
      host.save();
    }
    else if (b === 'b') { TSN.stop(); TSN.sfx('cancel'); showTitle(); ov.querySelectorAll('.scr').forEach(n => n.remove()); settings(); return; }
    paintSound();
  }
  /* つづきから（セーブデータ） */
  const yearBug = (y) => y < 2000 ? String(y) : '19' + (y - 1900);
  const fmtPlay = (ms) => { const m = Math.floor(ms / 60000); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  function showSlot() {
    mode = 'slot'; clearUI();
    ov.querySelectorAll('.scr').forEach(n => n.remove());
    const s = sv(), d = new Date(s.last);
    const n = s.secrets.filter(Boolean).length;
    const cnt = s.d32 ? '8' : (n || s.touched ? String(n) : '<i class="bad">■</i>');
    ov.appendChild(el('div', 'scr full slot', '<p class="slot-t">つづきから</p><div class="slot-c">'
      + '<p class="slot-n">' + esc(s.d32 ? (host.st.finder || s.name) : s.name) + '</p>'
      + '<p>' + (s.d32 ? '8がつ32にち' : yearBug(d.getFullYear()) + '/' + (d.getMonth() + 1) + '/' + d.getDate() + '　' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')) + '</p>'
      + '<p>プレイ　' + fmtPlay(s.pt) + '</p><p>ひみつ　' + cnt + '/8</p></div><p class="slot-h">A はじめる　B もどる</p>'));
  }
  function slotKey(b) {
    if (b === 'a') { TSN.sfx('ok'); startField(); }
    else if (b === 'b') { TSN.sfx('cancel'); showTitle(); titleMenu(); }
  }

  /* =========================================================
     島
     ========================================================= */
  let M = null, mapName = '', P = null, ents = [], deco = [], isle = null, isleKey = '', cam = { x: 0, y: 0 };
  let fx = { fireworks: [], meteors: [], sparks: [], meteor: null, wishes: 0 };
  function loadMap(name) {
    const def = TK.MAPS[name];
    M = { name, def, set: def.set, rows: def.rows, w: def.rows[0].length, h: def.rows.length };
    mapName = name;
  }
  const tileAt = (x, y) => (M && y >= 0 && x >= 0 && y < M.h && x < M.w) ? M.rows[y][x] : null;
  const tdef = (ch) => (M.set === 'in' ? TPX.INSIDE : TPX.WORLD)[ch];

  function isleNow() {
    const s = sv();
    if (s && s.d32) return { season: 'd32', tod: 'day', ev: {}, m: 8, d: 32, h: 6, mi: 0, y: 1999, dow: 0 };
    const d = gnow(), m = d.getMonth() + 1, day = d.getDate(), h = d.getHours(), mi = d.getMinutes(), hm = h * 60 + mi;
    const summer = m === 8;
    const tod = (h >= 20 || h < 5) ? 'night' : h >= 17 ? 'evening' : h < 9 ? 'morning' : 'day';
    const ev = {
      tanabata: summer && day === 7,
      perseid: summer && day === 13 && h >= 1 && h < 5,
      lowtide: summer && day === 27 && hm >= 12 * 60 && hm <= 13 * 60 + 40,
      festival: summer && day === 31 && h >= 18 && h < 22,
      fireworks: summer && day === 31 && hm >= 20 * 60 && hm < 20 * 60 + 20,
      lastnight: summer && day === 31 && h >= 22
    };
    return { season: summer ? 'summer' : 'after', tod, ev, m, d: day, h, mi, y: d.getFullYear(), dow: d.getDay() };
  }
  const keyOf = (I) => I.season + '|' + I.tod + '|' + Object.keys(I.ev).filter(k => I.ev[k]).join(',');
  function refresh(force) {
    const I = isleNow();
    const k = keyOf(I);
    const changed = k !== isleKey;
    isle = I; isleKey = k;
    if (changed || force) {
      if (uraOn) { ents = TST.uraNpcs(); deco = []; }
      else { ents = TST.npcs(mapName, I, sv()); deco = TST.decor(mapName, I, sv()); }
      ents.forEach(e => { if (e.x === P.x && e.y === P.y) e.hidden = true; });
    }
    music();
  }
  function music() {
    if (mode !== 'field' || TSN.current() === 13) return;
    const id = uraOn ? 11 : TST.musicFor(G);
    if (id !== TSN.current()) TSN.play(id);
  }
  function walkable(x, y) {
    const ch = tileAt(x, y);
    if (ch == null) return false;
    const d = tdef(ch);
    let ok = !!d && !d.b;
    const o = TST.walk ? TST.walk(mapName, x, y, ch, isle) : null;
    if (o != null) ok = o;
    if (!ok) return false;
    return !ents.some(e => !e.hidden && e.block !== false && e.x === x && e.y === y);
  }
  function startField() {
    const s = sv();
    mode = 'field'; clearUI();
    ov.querySelectorAll('.scr').forEach(n => n.remove());
    colorOn = !!s.d32;
    const pos = s.pos;
    loadMap(pos.map); P = { x: pos.x, y: pos.y, dir: pos.dir || 'd', moving: false, t: 0, n: 0, tx: 0, ty: 0 };
    s.touched = true; host.save();
    refresh(true);
    run(async () => { await TST.load(G); });
  }
  function savePos() {
    if (uraOn || !P || !M) return;
    const s = sv(); s.pos = { map: mapName, x: P.x, y: P.y, dir: P.dir };
    s.last = gnow().getTime();
    host.save();
  }
  async function warp(name, x, y, dir) {
    fading = true;
    TSN.sfx('door');
    await fade('out', 160);
    loadMap(name);
    P.x = x; P.y = y; P.dir = dir || P.dir; P.moving = false;
    fx.meteors = []; fx.fireworks = []; fx.meteor = null;
    refresh(true);
    await fade('in', 160);
    fading = false;
    savePos();
    if (TST.enter) run(() => TST.enter(G, name));
  }
  function run(fn) {
    const g = gen; busy++;
    return Promise.resolve().then(() => fn(G)).catch((e) => { console.error(e); }).then(() => { if (g === gen) busy = Math.max(0, busy - 1); });
  }

  const KEYS = {
    title(b) {
      if (b === 'b' && selHeld()) {
        const now = performance.now();
        if (now - comboT > 3000) comboB = 0;
        comboT = now; comboB++;
        if (comboB >= 3) { comboB = 0; stickySel = 0; showClock(); }
        return;
      }
      if (b === 'start' || b === 'a') { TSN.sfx('ok'); ov.querySelectorAll('.scr').forEach(n => n.remove()); titleMenu(); }
    },
    clock: clockKey, sound: soundKey, slot: slotKey,
    field(b) {
      if (busy || fading || !P) return;
      if (b === 'a') { if (P.moving) return; if (TST.onA && TST.onA(G)) return; interact(); }
      else if (b === 'start') { if (!P.moving) run(startMenu); }
      else if (b === 'select') { const d = gnow(); toast(uraOn ? '？？：？？' : sv().d32 ? '8/32　0:00' : (d.getMonth() + 1) + '/' + d.getDate() + '　' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')); }
    },
    credits(b) { if (b === 'a' || b === 'b') credSpeed = 4; }
  };
  function interact() {
    const [dx, dy] = DIR[P.dir];
    let fx0 = P.x + dx, fy0 = P.y + dy;
    let e = ents.find(n => !n.hidden && n.x === fx0 && n.y === fy0);
    const ch = tileAt(fx0, fy0);
    if (!e && ch === 'c' && M.set === 'in') e = ents.find(n => n.x === fx0 + dx && n.y === fy0 + dy);
    if (e && e.talk) {
      const back = { u: 'd', d: 'u', l: 'r', r: 'l' }[P.dir];
      if (e.turn !== false) e.dir = back;
      run(async () => { await e.talk(G, e); });
      return;
    }
    if (TST.check) run(async () => { await TST.check(G, mapName, fx0, fy0, ch); });
  }
  async function startMenu(G) {
    const s = sv();
    const i = await menuWin(['ひみつノート', 'もちもの', 'とけい', 'とじる'], { cls: 'start-menu' });
    if (i === 0) await notebook();
    else if (i === 1) await TST.items(G);
    else if (i === 2) {
      const d = gnow(), I = isleNow();
      const wd = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];
      const date = uraOn ? '？？？？ねん ？？がつ ？？にち' : s.d32 ? '8がつ　32にち' : yearBug(d.getFullYear()) + 'ねん　' + (d.getMonth() + 1) + 'がつ' + d.getDate() + 'にち（' + wd[d.getDay()] + '）';
      const tm = s.d32 ? '0:00' : d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
      const left = s.d32 ? 'なつやすみ：さいごの いちにち' : I.season === 'summer' ? 'なつやすみ：あと ' + (31 - I.d) + 'にち' : 'なつやすみ：おわりました';
      await panel('<p class="pn-t">とけい</p><p class="pn-big">' + esc(date) + '<br>' + esc(tm) + '</p><p>' + esc(left) + '</p>', 'clockpanel');
    }
  }
  function notebook() {
    const s = sv();
    const n = s.secrets.filter(Boolean).length;
    const glyph = '▓▒░■□◆◇▚▞';
    const junk = (len) => [...Array(len)].map(() => glyph[(Math.random() * glyph.length) | 0]).join('');
    const rows = () => TK.SECRETS.map((x, i) => s.secrets[i]
      ? '<li class="ok"><b>' + (i + 1) + '. ' + esc(x.name) + '</b><small>' + esc(x.note) + '</small></li>'
      : '<li class="ng"><b>' + (i + 1) + '. ' + junk(x.name.length) + '</b><small>' + junk(10) + '</small></li>').join('');
    const p = panel('<p class="pn-t">ひみつノート　' + n + '/8</p><ol class="nb">' + rows() + '</ol>', 'notebook');
    const box = ov.querySelector('.notebook ol');
    const iv = setInterval(() => { if (!box.isConnected) { clearInterval(iv); return; } box.innerHTML = rows(); }, 180);
    return p;
  }

  /* ---------- 1コマぶん（島） ---------- */
  function fieldStep() {
    if (!P) return;
    if (tick % 30 === 0) { refresh(false); if (TST.tick && !busy) TST.tick(G); }
    if (P.moving) {
      P.t++;
      if (P.t >= STEP) {
        P.x = P.tx; P.y = P.ty; P.moving = false; P.t = 0; P.n++;
        arrive();
      }
    }
    if (!P.moving && !busy && !fading && !ui.length && lastDir) {
      const d = lastDir;
      if (P.dir !== d) { P.dir = d; P.turn = 5; }
      if (P.turn > 0) { P.turn--; }
      else {
        const [dx, dy] = DIR[d];
        const nx = P.x + dx, ny = P.y + dy;
        if (walkable(nx, ny)) { P.moving = true; P.t = 0; P.tx = nx; P.ty = ny; }
        else bump(nx, ny);
      }
    }
    fxStep();
  }
  let bumpT = 0;
  function bump(nx, ny) {
    if (tick < bumpT) return;
    bumpT = tick + 16;
    const ch = tileAt(nx, ny);
    if (mapName === 'world' && !uraOn) {
      const door = TK.DOORS['world:' + nx + ',' + ny];
      if (door) { run(() => TST.door(G, door, nx, ny)); return; }
    }
    if (TST.bump && TST.bump(G, mapName, nx, ny, ch, P.dir)) return;
    TSN.sfx('bump');
  }
  function arrive() {
    const ch = tileAt(P.x, P.y);
    if (M.set === 'in') {
      const ex = TK.EXITS[mapName];
      if ((ch === 'd' || ch === 'E') && ex) { run(() => warp(ex.to, ex.x, ex.y, ex.dir)); return; }
      if (ch === 'u' && mapName === 'lh1') { run(() => warp('lh2', 4, 6, 'u')); return; }
      if (ch === 'j' && mapName === 'lh2') { run(() => warp('lh1', 7, 2, 'd')); return; }
    }
    if (tick % 4 === 0 || true) savePos();
    if (TST.step) TST.step(G, mapName, P.x, P.y);
  }
  function playerXY() {
    const k = P.moving ? P.t / STEP : 0;
    return [(P.x + (P.tx - P.x) * k) * T, (P.y + (P.ty - P.y) * k) * T];
  }

  /* ---------- 効果（花火・流れ星・火花） ---------- */
  function fxStep() {
    const I = isle;
    if (!I || uraOn) return;
    // 花火（8/31 20:00〜20:20、浜の沖）
    if (mapName === 'world' && I.ev.fireworks && tick % 70 === 0 && fx.fireworks.length < 4) {
      const x = (10 + Math.random() * 12) * T, y = (21.5 + Math.random() * 2.5) * T;
      fx.fireworks.push({ x, y, t: 0, r: 26 + Math.random() * 16, n: 12 + ((Math.random() * 6) | 0) });
      const [px, py] = playerXY();
      if (Math.abs(px - x) < 120 && Math.abs(py - y) < 110) TSN.sfx('boom');
    }
    fx.fireworks.forEach(f => f.t++); fx.fireworks = fx.fireworks.filter(f => f.t < 70);
    // 流れ星（8/13 よあけまえ、ひがしの おか）
    const onHill = mapName === 'world' && P.x >= 21 && P.x <= 26 && P.y >= 8 && P.y <= 17;
    if (I.ev.perseid && onHill && !fx.meteor && tick % 20 === 0 && Math.random() < 0.28) {
      fx.meteor = { x: 40 + Math.random() * 100, y: 6 + Math.random() * 30, t: 0, life: 62 + ((Math.random() * 20) | 0), hits: 0 };
      TSN.sfx('meteor');
    }
    if (fx.meteor) { fx.meteor.t++; if (fx.meteor.t > fx.meteor.life) fx.meteor = null; }
    fx.sparks.forEach(s => s.t++); fx.sparks = fx.sparks.filter(s => s.t < s.life);
  }
  function drawFx() {
    // 花火
    fx.fireworks.forEach(f => {
      const k = Math.min(1, f.t / 24), r = f.r * (0.2 + 0.8 * k);
      const sx = f.x - cam.x, sy = f.y - cam.y - f.r * 0.2;
      if (f.t < 10) { rectF(sx, sy + (10 - f.t) * 3, 1, 3, 5, 16); return; }
      for (let i = 0; i < f.n; i++) {
        const a = (i / f.n) * Math.PI * 2, x = sx + Math.cos(a) * r, y = sy + Math.sin(a) * r * 0.9 + (f.t > 40 ? (f.t - 40) * 0.3 : 0);
        const c = f.t < 44 ? 5 : f.t < 58 ? 0 : 1;
        put(x, y, c, 16); put(x + 1, y, c, 16); put(x, y + 1, c, 16);
        if (f.t < 50) put(sx + Math.cos(a) * r * 0.6, sy + Math.sin(a) * r * 0.55, 1, 16);
      }
    });
    // 流れ星（画面の空に描く）
    if (fx.meteor) {
      const m = fx.meteor, k = m.t / m.life;
      const hx = m.x + k * 60, hy = m.y + k * 30;
      for (let i = 0; i < 18; i++) put(hx - i * 1.8, hy - i * 0.9, i < 3 ? 5 : i < 9 ? 0 : 1, 17);
    }
    fx.sparks.forEach(s => { const a = s.a, r = s.t * s.v; put(s.x + Math.cos(a) * r - cam.x, s.y + Math.sin(a) * r - cam.y, s.t < s.life * 0.6 ? 5 : 1, 16); });
  }
  function darkness(r) {
    const [px, py] = playerXY();
    const cx0 = px - cam.x + 8, cy0 = py - cam.y + 8;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx0, y - cy0);
      if (d > r + 6 || (d > r && ((x + y) & 1))) { IDX[y * W + x] = 3; PB[y * W + x] = 19; }
    }
  }

  function drawField() {
    const I = isle || isleNow();
    const [ppx, ppy] = playerXY();
    const mw = M.w * T, mh = M.h * T;
    cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, ppx + 8 - W / 2));
    cam.y = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, ppy + 8 - H / 2));
    cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
    const night = I.tod === 'night' || I.tod === 'evening';
    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
    const set = M.set === 'in' ? 'in' : 'world';
    const lampLit = I.season === 'd32' || (night && lhOn(performance.now()));
    for (let ty = y0; ty <= y0 + 9; ty++) for (let tx = x0; tx <= x0 + 10; tx++) {
      let ch = tileAt(tx, ty); if (ch == null) ch = M.def.out;
      const def = (set === 'in' ? TPX.INSIDE : TPX.WORLD)[ch] || {};
      const o = { v: (tx * 7 + ty * 13) & 1 };
      if (def.anim) o.f = ((tick >> 5) + (tx & 1)) & 1;
      if (def.lit) o.lit = set === 'in' ? I.tod === 'night' : night;
      if (def.tide) o.low = !!I.ev.lowtide;
      if (def.g === 'auto') o.g = around(tx, ty);
      if (ch === 'P') o.e = [sea(tx - 1, ty), sea(tx + 1, ty), sea(tx, ty + 1)].map(b => b ? 1 : 0).join('');
      if (ch === ':' && set === 'in') o.e = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => ':f'.includes(tileAt(tx + dx, ty + dy) || '#') ? 0 : 1).join('');
      if (ch === 'O') { o.half = tileAt(tx + 1, ty) === 'O' ? 'L' : 'R'; o.lit = lampLit; }
      if (ch === 'k' && set === 'in') o.v = (tx + (tick >> 6)) % 3;
      const img = TPX.tile(set, ch, o);
      blit(img, tx * T - cam.x, ty * T - cam.y, def.pid || 0);
    }
    // 床の飾り（ランプなど）
    deco.filter(d => d.floor).forEach(d => blit(d.img(I, lampLit), d.x - cam.x, d.y - cam.y, d.pid || 0));
    // 人と飾りを、下にあるものほど手前に
    const list = [];
    ents.forEach(e => {
      if (e.hidden) return;
      list.push({ y: e.y * T + 15, f: () => {
        let a = e.img || TPX.SP[e.spr + '_' + (e.dir || 'd')] || TPX.SP[e.spr + '_d'] || TPX.SP[e.spr];
        if (e.spr === 'cat') a = TPX.SP[(tick >> 5) % 5 === 0 ? 'cat_2' : 'cat_1'];
        if (!a) return;
        const oy = a.h - 16 + (e.img ? 0 : 2);
        blit(e.flip ? mir(a) : a, e.x * T - cam.x + ((16 - a.w) >> 1), e.y * T - cam.y - oy, e.pid || 11);
      } });
    });
    deco.filter(d => !d.floor).forEach(d => list.push({ y: d.y + (d.h || 16), f: () => blit(d.img(I, lampLit), d.x - cam.x, d.y - cam.y, d.pid || 0) }));
    list.push({ y: ppy + 15.5, f: () => {
      const walk = P.moving && P.t < STEP / 2;
      let a;
      if (P.dir === 'l' || P.dir === 'r') a = TPX.SP['hero_' + P.dir + (walk ? 'w' : '')];
      else { a = TPX.SP['hero_' + P.dir + (walk ? 'w' : '')]; if (walk && P.n % 2) a = mir(a); }
      blit(a, ppx - cam.x, ppy - cam.y - 2, uraOn ? ((tick >> 3) % 20) : 9);
    } });
    list.sort((a, b) => a.y - b.y).forEach(o => o.f());
    drawFx();
    if (M.def.dark) darkness(sv().items.batt ? 30 : 6);
    if (uraOn) glitchNoise(4);
  }
  const sea = (x, y) => { const c = tileAt(x, y); return c == null || c === '~'; };
  function around(x, y) {
    const n = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => tileAt(x + dx, y + dy));
    if (n.includes(',')) return 'sand';
    if (n.filter(c => c === '~' || c == null).length >= 2) return 'sea';
    if (n.includes('=')) return 'road';
    return 'grass';
  }
  function glitchNoise(k) {
    for (let n = 0; n < k; n++) {
      if (Math.random() > 0.5) continue;
      const bx = (Math.random() * 20 | 0) * 8, by = (Math.random() * 18 | 0) * 8;
      const c = Math.random() * 4 | 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x ^ y ^ tick) & 1) put(bx + x, by + y, c, 19);
    }
  }

  /* =========================================================
     エンディングの船とスタッフロール
     ========================================================= */
  let cred = null, credSpeed = 1;
  function credits(lines) {
    const g = gen;
    return new Promise((res) => {
      mode = 'credits'; clearUI(); fadeEl.classList.remove('on');
      const box = el('div', 'scr cr');
      const inner = el('div', 'cr-in');
      lines.forEach(([k, t]) => { const p = el('p', 'cr-' + (k || 'n'), esc(t || '')); inner.appendChild(p); });
      box.appendChild(inner); ov.appendChild(box);
      cred = { y: 0, inner, box, t: 0, done: () => { if (g === gen) res(); } };
      credSpeed = 1;
    });
  }
  function drawCredits() {
    const t = cred ? cred.t : 0;
    clr(0, 17);
    for (let y = 0; y < 60; y++) if (y % 6 === 0) for (let x = 0; x < W; x += 3) put(x + ((y / 6) % 2), y + 40, 1, 17);
    discF(30, 34, 11, 1, 17); discF(30, 34, 9, 0, 16);
    rectF(0, 84, W, H - 84, 2, 2);
    for (let y = 88; y < H; y += 6) for (let x = ((y * 5 + (tick >> 2)) % 18) - 18; x < W; x += 18) { rectF(x, y, 5, 1, 1, 2); put(x + 2, y - 1, 0, 2); }
    const ix = 100 + t * 0.05;
    for (let x = 0; x < 60; x++) { const hgt = Math.max(0, Math.round(10 * Math.sin(x / 60 * Math.PI))); for (let y = 84 - hgt; y < 84; y++) put(ix + x, y, 3, 13); }
    rectF(ix + 50, 70, 3, 12, 0, 6); put(ix + 51, 69, lhOn(performance.now()) ? 5 : 3, 6);
    const bob = Math.sin(tick / 20) > 0 ? 1 : 0;
    blit(TPX.DECO.boat, 44, 76 + bob, 8);
  }
  function creditsStep() {
    if (!cred) return;
    cred.t += credSpeed;
    const inner = cred.inner;
    const hh = inner.scrollHeight, bh = cred.box.clientHeight;
    const y = bh - cred.t * 0.22;
    inner.style.transform = 'translateY(' + y + 'px)';
    if (y + hh < bh * 0.42 && !cred.ending) {
      cred.ending = true; const c = cred;
      setTimeout(() => { if (cred === c) { cred = null; c.box.remove(); c.done(); } }, 3200);
    }
  }

  /* =========================================================
     毎コマ
     ========================================================= */
  let last = 0, acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    acc += Math.min(100, ts - last); last = ts;
    while (acc >= 1000 / 60) { acc -= 1000 / 60; update(); }
    render();
  }
  function update() {
    tick++;
    if (mode === 'field') fieldStep();
    if (mode === 'credits') creditsStep();
    if (mode === 'boot') bootStep();
  }
  function render() {
    if (mode === 'off') return;
    if (mode === 'crash') return;
    if (mode === 'field' && M) { clr(3); drawField(); }
    else if (mode === 'credits') drawCredits();
    else if (mode === 'boot' || mode === 'nocart') clr(0);
    else drawTitleArt(mode !== 'title');
    present();
  }

  /* =========================================================
     電源・カセット
     ========================================================= */
  let cartState = 'in';
  function power(on) {
    gen++; busy = 0; fading = false; clearUI(); cred = null;
    ov.querySelectorAll('.scr,.toast').forEach(n => n.remove());
    fadeEl.classList.remove('on');
    TSN.stop();
    if (!on) {
      if (mode === 'field') savePos();
      mode = 'off'; uraOn = false; colorOn = false; TSN.mode('normal');
      return;
    }
    TSN.init(); TSN.setVol(host.vol());
    mode = 'boot'; bootT = 0; palKey = '';
    prev.fill(0);
    const kind = cartState === 'in' ? 'ok' : cartState === 'half' ? 'half' : 'none';
    const b = el('div', 'scr boot' + (kind === 'none' ? ' nocart' : kind === 'half' ? ' glitch' : ''), kind === 'none' ? '<p class="boot-logo">■■■■■■</p>' : '<p class="boot-logo">HIBARI</p>');
    ov.appendChild(b);
    bootKind = kind;
  }
  let bootKind = 'ok';
  function bootStep() {
    bootT++;
    const logo = ov.querySelector('.boot-logo');
    if (logo) logo.style.transform = 'translateY(' + Math.min(0, (bootT - 60) * 1.2) + 'px)';
    if (bootT === 60) { if (bootKind === 'half') TSN.sfx('glitch'); else TSN.sfx('ding'); }
    if (bootT === 150) {
      ov.querySelectorAll('.boot').forEach(n => n.remove());
      if (bootKind === 'none') { mode = 'nocart'; ov.appendChild(el('div', 'scr boot nocart', '<p class="boot-logo" style="transform:none">■■■■■■</p>')); return; }
      if (bootKind === 'half') { enterUra(null); return; }
      showTitle();
    }
  }
  function softReset() { if (mode === 'field') savePos(); power(true); }
  function cart(state) {
    const was = cartState; cartState = state;
    if (mode === 'off') return;
    if (state === 'out') {
      if (mode === 'field') savePos();
      gen++; clearUI(); TSN.stop(); TSN.sfx('buzz');
      mode = 'crash'; host.st.crash = (host.st.crash || 0) + 1; host.st.crashSeen = false; host.save();
      for (let i = 0; i < W * H; i++) if (((i % W) >> 2) % 3 === 0) IDX[i] = 3; else if (Math.random() < 0.08) IDX[i] = (Math.random() * 4) | 0;
      present();
      return;
    }
    if (mode === 'crash' || mode === 'nocart' || mode === 'boot') return;
    if (state === 'half' && was === 'in') enterUra(mode === 'field' ? { map: mapName, x: P.x, y: P.y, dir: P.dir } : 'title');
    if (state === 'in' && was === 'half' && uraOn) exitUra();
  }
  function enterUra(back) {
    gen++; busy = 0; clearUI(); ov.querySelectorAll('.scr').forEach(n => n.remove());
    uraBack = back; uraOn = true; TSN.mode('ura'); TSN.sfx('glitch');
    mode = 'field'; loadMap('ura');
    P = { x: 10, y: 8, dir: 'u', moving: false, t: 0, n: 0, tx: 0, ty: 0 };
    palKey = '';
    refresh(true);
    host.st.ura = true; host.save(); host.emit('progress');
    run(async () => { await wait(700); await say(['……', 'ここは、どこだろう。']); });
  }
  function exitUra() {
    gen++; busy = 0; clearUI();
    uraOn = false; TSN.mode('normal'); palKey = '';
    const back = uraBack; uraBack = null;
    if (back && back !== 'title' && back.map) {
      mode = 'field'; loadMap(back.map); P = { x: back.x, y: back.y, dir: back.dir, moving: false, t: 0, n: 0, tx: 0, ty: 0 };
      refresh(true);
      run(async () => { await wait(400); await say(['……いま、なにか へんな ゆめを みていた きがする。']); });
    } else showTitle();
  }

  /* =========================================================
     物語の側に渡す道具
     ========================================================= */
  const G = {
    get s() { return sv(); }, get st() { return host.st; }, get map() { return mapName; }, get P() { return P; },
    get ents() { return ents; }, get fx() { return fx; }, get tick() { return tick; }, get ura() { return uraOn; },
    isle: () => isle || isleNow(), gnow, say, ask, menu: menuWin, name: nameEntry, panel, wait, toast,
    vol: () => host.vol(), save: () => { savePos(); host.save(); }, emit: (n, d) => host.emit(n, d),
    sfx: (n) => TSN.sfx(n), music: (id, opt) => TSN.play(id, opt), refresh: () => refresh(true),
    warp, run, fade, lhOn,
    color(on) { colorOn = on; palKey = ''; },
    async found(i) {
      const s = sv(); if (s.secrets[i]) return;
      s.secrets[i] = true; host.save(); host.emit('progress');
      const back = TST.musicFor(G);
      TSN.play(13, { then: back });
      const [px, py] = playerXY();
      for (let k = 0; k < 14; k++) fx.sparks.push({ x: px + 8, y: py + 4, a: k / 14 * Math.PI * 2, v: 0.9, t: 0, life: 34 });
      await say(['ひみつノートに かきこんだ！', '『' + TK.SECRETS[i].name + '』']);
    },
    credits, toTitle() { mode = 'title'; showTitle(); },
    sparkle(x, y, n) { for (let k = 0; k < (n || 12); k++) fx.sparks.push({ x, y, a: Math.random() * Math.PI * 2, v: 0.4 + Math.random() * 0.8, t: 0, life: 30 + Math.random() * 20 }); }
  };

  /* =========================================================
     はじめる
     ========================================================= */
  function init(opt) {
    host = opt.host;
    lcd = opt.lcd; cv = opt.canvas; ov = opt.overlay;
    cx = cv.getContext('2d');
    idata = cx.createImageData(W, H); out = idata.data; prev = new Float32Array(W * H * 4);
    fadeEl = el('div', 'fade'); lcd.appendChild(fadeEl);
    reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    requestAnimationFrame(frame);
  }
  return {
    init, power, down, up, cart,
    setVol(v) { TSN.setVol(v); },
    contrast() { palKey = ''; },
    get mode() { return mode; }, get uraOn() { return uraOn; }, G,
    _run(n) { for (let i = 0; i < (n || 1); i++) update(); render(); }
  };
})();
