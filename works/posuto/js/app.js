/* ポスト百景 — 進行・手紙・活字棚・調べもの */
(() => {
  const KEY = 'posuto.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, calm ? Math.min(ms, 120) : ms));
  const fresh = () => ({ got: 1, sent: 0, replies: [], found: {}, ended: false, mute: false, seen: {}, started: Date.now() });

  let st;
  try { st = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { st = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 保存できなくても遊べる */ } };
  const L = i => PS.letters[i];

  /* ---------- 外側のページ ---------- */
  const routes = {};
  const artCard = p => `<article class="art">
    <h2><a href="#/post/${p.id}">No.${p.no}　${esc(p.title)}</a></h2>
    <p class="meta"><span>${p.date}</span><span class="tag">${esc(p.tag)}</span>${p.id === 'p087' && unread() ? '<span class="tag" style="background:#F3E3DF;color:#9C3B33">コメント ' + unread() + '</span>' : ''}</p>
    <p class="body">${esc(p.body.split('\n')[0])}</p></article>`;
  routes[''] = () => `<p class="note-box">全国の 郵便ポストの 写真を 載せています。古いもの、消えたもの、塗り直されたもの。<br>2019年11月を最後に、更新を止めています。</p>
    ${PS.posts.map(artCard).join('')}`;
  routes.about = () => `<article class="art"><h2>このサイトについて</h2>
    <p class="body">2003年から、日本各地の 郵便ポストを 撮り歩いています。とくに 丸型（郵便差出箱1号丸型）が 好きです。
写真と、そこで 聞いた 話を 載せているだけの ページです。
コメント欄は 開けたままにしてあります。情報を ご存じの方は どうぞ。

管理人：中根</p></article>`;
  routes.post = id => {
    const p = PS.posts.find(x => x.id === id) || PS.posts[0];
    const shot = p.photo ? `<div class="shot">${photo(p.photo)}</div>` : '';
    return `<article class="art"><h2>No.${p.no}　${esc(p.title)}</h2>
      <p class="meta"><span>${p.date}</span><span class="tag">${esc(p.tag)}</span></p>${shot}
      <p class="body">${esc(p.body)}</p></article>
      ${p.open ? comments() : '<p class="back"><a href="#/">← 記事一覧</a></p>'}`;
  };
  routes.box = () => {
    const ids = Object.keys(PS.docs).filter(k => k !== 'links' || st.links);
    const cur = st.doc && ids.includes(st.doc) ? st.doc : ids[0];
    return `<p class="note-box">管理人の 保存箱です。この 記事を 書くために 集めた 資料が 入っています。</p>
      ${quizBox()}
      <div class="docnav">${ids.map(k => `<button type="button" data-doc="${k}" aria-pressed="${k === cur}">${esc(PS.docs[k].kind)}</button>`).join('')}</div>
      <div class="doc">${docBody(cur)}</div>`;
  };
  routes.links = () => `<p class="note-box">管理人が 巡回していた 個人サイトの 一覧です。</p>
    <div class="doc">${docBody('links')}</div>`;
  routes.family = () => '';

  function docBody(k) {
    const d = PS.docs[k];
    let b = '';
    if (d.note) b += `<p class="note">${esc(d.note)}</p>`;
    if (d.table) b += `<table>${d.table.map((row, i) => `<tr>${row.map(c => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table>`;
    if (d.photo) b += grave();
    if (d.body) b += `<pre>${esc(d.body)}</pre>`;
    if (d.links) b += d.links.map(([t, y, s, isIt]) => `<div class="linkrow"><b>${esc(t)}</b><button type="button" data-link="${isIt ? 'yes' : 'no'}">ひらく</button><small>${y}　${esc(s)}</small></div>`).join('');
    return `<h3>${esc(d.title)}</h3><p class="kind">${esc(d.kind)}</p>${b}`;
  }
  function quizBox() {
    if (st.found.brother) return `<div class="quiz"><p class="q">${esc(PS.find.brother.q)}</p><p class="msg" style="color:#3C6E4B">${esc(PS.find.brother.ok)}　みさをさんへの 返事が 書けます（記事 No.087 の コメント欄）。</p></div>`;
    if (st.sent < 3) return '';
    return `<div class="quiz"><p class="q">${esc(PS.find.brother.q)}</p>
      ${PS.find.brother.choices.map(([t], i) => `<label><input type="radio" name="bro" value="${i}"> ${esc(t)}</label>`).join('')}
      <p class="msg" id="quiz-msg"></p><button type="button" id="quiz-go">これで 送る</button></div>`;
  }

  /* 写真（img/*.jpg があれば使い、無ければ絵） */
  function photoSvg(k) {
    const sky = k === 'snow' ? '#DDE6EC' : k === 'round' ? '#CFE0EA' : '#D9E0DC';
    const post = k === 'post' ? '' : `<rect x="182" y="70" width="36" height="120" rx="18" fill="#B24B3E"/><rect x="176" y="62" width="48" height="20" rx="10" fill="#B24B3E"/><rect x="190" y="96" width="20" height="6" fill="#2E3238"/>`;
    return `<svg viewBox="0 0 400 225" aria-hidden="true" style="display:block;width:100%;height:100%">
      <rect width="400" height="225" fill="${sky}"/><rect y="150" width="400" height="75" fill="${k === 'snow' ? '#F2F5F7' : '#C9C3B4'}"/>
      <rect x="0" y="140" width="400" height="14" fill="#A9A395"/>${post}
      <rect x="176" y="186" width="48" height="14" rx="2" fill="#9A9486"/>
      ${k === 'post' ? '<text x="200" y="120" text-anchor="middle" font-size="12" fill="#6B665C">（台座のみ・ポストは現存せず）</text>' : ''}
      <circle cx="330" cy="46" r="18" fill="#F4EFD9" opacity=".8"/></svg>`;
  }
  const graveSvg = () => `<svg class="grave" viewBox="0 0 220 200" aria-hidden="true">
    <rect width="220" height="200" fill="#DFE3DE"/><rect y="150" width="220" height="50" fill="#BFC4BB"/>
    <rect x="86" y="58" width="48" height="104" fill="#A8ABA2"/><rect x="74" y="150" width="72" height="14" fill="#989C93"/>
    <text x="110" y="92" text-anchor="middle" font-size="11" fill="#4A4E48" writing-mode="tb">日向長太郎之墓</text></svg>`;
  const FB = { post: photoSvg, round: photoSvg, snow: photoSvg, grave: () => graveSvg(), letters: photoSvg };
  /* img/ にある写真だけを読みにいく（ない写真は、最初から絵にする。写真を足したら、ここにも名前を足す） */
  const HAVE = new Set(['yuno', 'naramachi', 'snow', 'umi', 'yamate', 'kyokumae', 'suginami', 'ie', 'genkan', 'shugo']);
  const photo = k => HAVE.has(k)
    ? `<img src="img/${k}.jpg" alt="" data-fb="${k}" style="display:block;width:100%;height:100%;object-fit:cover">`
    : (FB[k] || photoSvg)(k);
  const grave = () => HAVE.has('grave') ? `<img src="img/grave.jpg" alt="砂川の共同墓地" class="grave" data-fb="grave">` : graveSvg();
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fb) img.outerHTML = (FB[img.dataset.fb] || photoSvg)(img.dataset.fb);
  }, true);

  /* ---------- コメント欄 ---------- */
  const unread = () => (st.got > st.sent && !st.ended) ? 1 : 0;
  function comments() {
    const rows = PS.board0.map(c => `<div class="cm"><p class="who">${esc(c.who)}　${c.d}</p><p>${esc(c.t)}</p></div>`);
    for (let i = 0; i < st.got; i++) {
      const l = L(i);
      if (!l) break;
      rows.push(`<div class="cm her${i === st.got - 1 && st.sent < st.got ? ' new' : ''}"><p class="who">名前なし　${l.d}</p>
        <p class="snip">${esc(l.t.split('\n')[0])}……</p>
        <button type="button" class="open" data-letter="${i}">${st.seen['l' + i] ? 'もう一度 読む' : '文を ひらく'}</button></div>`);
      if (st.replies[i]) rows.push(`<div class="cm me"><p class="who">あなた　（返事）</p><p>${esc(st.replies[i])}</p></div>`);
    }
    if (st.ended) rows.push('<div class="cm"><p class="who">システム</p><p>このコメント欄は 閉じられました。</p></div>');
    else if (st.sent >= 3 && !st.found.brother && st.got === 3) rows.push('<div class="cm"><p class="who">（返事は まだ ありません）</p><p class="tiny">保存箱の 資料で、調べものを 済ませてください。</p></div>');
    return `<section class="comments"><h3>コメント（${rows.length}）</h3>${rows.join('')}
      <p class="tiny" style="margin-top:12px">※この記事のコメント欄には、日付のおかしい書き込みが続いています。管理人は 2019年から 来ていません。</p></section>
      <p class="back" style="margin-top:14px"><a href="#/">← 記事一覧</a></p>`;
  }

  function render() {
    const [head, arg] = location.hash.replace(/^#\/?/, '').split('/');
    const view = routes[head] ? head : '';
    if (view === 'family') {
      document.body.dataset.view = 'family';
      $('#site').hidden = true;
      famMount();
      return;
    }
    document.body.dataset.view = 'blog';
    $('#site').hidden = false;
    const f = $('#fam'); if (f) f.remove();
    $('#main').innerHTML = routes[view](arg && decodeURIComponent(arg));
    $('#nav-box').hidden = st.sent < 3;
    $('#nav-links').hidden = !st.links;
    scrollTo(0, 0);
  }
  addEventListener('hashchange', render);

  /* ---------- 手紙を ひらく ---------- */
  let cur = 0;
  function vert(t) {
    return t.split('\n').map(p => p ? `<p>${[...p].map((c, i) => `<span class="ch" style="animation-delay:${i * 38}ms">${esc(c)}</span>`).join('')}</p>` : '<p>&nbsp;</p>').join('');
  }
  async function openLetter(i) {
    cur = i;
    const l = L(i);
    st.seen['l' + i] = true; save();
    $('#fumi').hidden = false;
    $('#fumi-date').textContent = l.d;
    $('#fumi-body').innerHTML = '';
    $('#fumi-reply').hidden = !!st.replies[i];
    PS.snd.paper(true);
    await sleep(900);
    $('#fumi-body').innerHTML = vert(l.t);
    const n = Math.min(24, l.t.length / 8);
    for (let k = 0; k < n; k++) { setTimeout(() => PS.snd.ink(), k * 260); }
  }
  $('#fumi-close').addEventListener('click', () => { $('#fumi').hidden = true; PS.snd.paper(false); });
  $('#fumi-reply').addEventListener('click', () => { $('#fumi').hidden = true; openCase(cur); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-letter]');
    if (b) openLetter(+b.dataset.letter);
  });

  /* ---------- 活字棚 ---------- */
  let picked = [];
  function openCase(i) {
    const l = L(i);
    picked = [];
    $('#case').hidden = false;
    $('#case-ask').textContent = l.ask;
    $('#case-grid').innerHTML = l.reply.map(r => `<button type="button" class="tile${r.mod ? ' mod' : ''}" data-k="${r.k}" aria-pressed="false">${esc(r.t)}</button>`).join('');
    $('#case-msg').textContent = `札は ${l.max} 枚まで。`;
    drawCompose(i);
  }
  function drawCompose(i) {
    const l = L(i);
    const html = picked.map(k => {
      const r = l.reply.find(x => x.k === k);
      return r.mod ? `<span class="garble">${[...r.t].map(() => '虫').join('')}</span>` : esc(r.t);
    }).join('、');
    $('#compose').innerHTML = `<div class="cline">${html || '　'}</div>`;
  }
  $('#case-grid').addEventListener('click', e => {
    const b = e.target.closest('.tile');
    if (!b) return;
    const l = L(cur), k = b.dataset.k;
    if (picked.includes(k)) picked = picked.filter(x => x !== k);
    else {
      if (picked.length >= l.max) { $('#case-msg').textContent = `札は ${l.max} 枚までです。`; return; }
      picked.push(k);
    }
    b.setAttribute('aria-pressed', String(picked.includes(k)));
    PS.snd.type();
    drawCompose(cur);
    $('#case-msg').textContent = '';
  });
  $('#case-close').addEventListener('click', () => { $('#case').hidden = true; });
  $('#case-send').addEventListener('click', async () => {
    const l = L(cur);
    if (!picked.length) { $('#case-msg').textContent = '札が 入っていません。'; return; }
    const mods = picked.filter(k => (l.reply.find(x => x.k === k) || {}).mod);
    if (mods.length) { $('#case-msg').textContent = 'この棚には、その言葉の 活字が ありません。刷っても 虫食いに なります。'; return; }
    const banned = picked.filter(k => (l.ban || []).includes(k));
    if (banned.length) {
      const t = l.reply.find(x => x.k === banned[0]) || {};
      $('#case-msg').textContent = t.cruel ? 'まだ 何も 調べていません。確かでない ことを、この人に 書くことは できません。' : 'その札は、いまは 入れられません。';
      return;
    }
    const missing = (l.need || []).filter(k => !picked.includes(k));
    if (missing.length) { $('#case-msg').textContent = 'まだ 足りないことが あります。相手の 問いを もう一度 読んでください。'; return; }
    const text = picked.map(k => l.reply.find(x => x.k === k).t).join('、') + '。';
    st.replies[cur] = text; st.sent = Math.max(st.sent, cur + 1); save();
    $('#case').hidden = true;
    PS.snd.drop();
    await post(cur);
  });

  /* ---------- 返事のあと ---------- */
  async function post(i) {
    const l = L(i);
    render();
    if (l.last) return closing();
    // 第4通は、調べものが 済むまで 来ない
    if (l.unlock === 'archive') { $('#nav-box').hidden = false; }
    const nxt = L(i + 1);
    if (nxt && nxt.needFind && !st.found[nxt.needFind]) { render(); return; }
    await deliver(i + 1);
  }
  async function deliver(i) {
    if (st.got > i) return;
    await sleep(1600);
    st.got = i + 1; save();
    PS.snd.bell(false);
    render();
    const el = $('.cm.her.new');
    if (el) el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
  }

  /* ---------- 調べもの ---------- */
  document.addEventListener('click', async e => {
    if (e.target.id === 'quiz-go') {
      const v = $('input[name="bro"]:checked');
      if (!v) { $('#quiz-msg').textContent = 'どれか 選んでください。'; return; }
      if (!PS.find.brother.choices[+v.value][1]) { $('#quiz-msg').textContent = PS.find.brother.ng; PS.snd.type(); return; }
      st.found.brother = true; save();
      $('#quiz-msg').style.color = '#3C6E4B';
      $('#quiz-msg').textContent = PS.find.brother.ok;
      PS.snd.bell(true);
      await sleep(1200);
      render();
      await deliver(3);
    }
    const lk = e.target.closest('[data-link]');
    if (lk) {
      if (lk.dataset.link === 'yes') { st.found.family = true; save(); location.hash = '#/family'; }
      else { lk.closest('.linkrow').insertAdjacentHTML('beforeend', '<small style="color:#B24B3E">このページは 見つかりません（404）</small>'); lk.disabled = true; }
    }
  });

  /* ---------- 手紙が 途切れる ---------- */
  async function closing() {
    $('#veil').classList.add('on');
    await sleep(2200);
    st.ended = true; st.links = true; save();
    $('#veil').classList.remove('on');
    render();
    const box = $('.comments');
    if (box) {
      box.insertAdjacentHTML('beforeend', `<div class="cm new"><p class="who">システム　${new Date().toLocaleDateString('ja-JP')}</p>
        <p>送信できませんでした。（この記事の コメント欄は 閉じられています）</p></div>
        <div class="cm new"><p class="who">あなた</p><p class="tiny">……それきり、書き込みは 増えなくなった。<br>
        明治三十七年四月、柚野の ポストは 取りかえられた。道は、そこで 閉じたらしい。<br><br>
        彼女は「紙に 書いて 残す」と 言っていた。<br>
        百二十年。どこかに 残っているとすれば、誰かが 拾い上げているはずだ。<br>
        管理人の <a href="#/links">リンク集</a> を 見てみよう。</p></div>`);
      $('#nav-links').hidden = false;
      PS.snd.paper(true);
    }
  }

  /* ---------- 子孫のページ ---------- */
  async function famMount() {
    if ($('.fam')) return;
    const f = PS.family;
    document.body.insertAdjacentHTML('beforeend', `<div class="fam" id="fam">
      <h1>${esc(f.title)}</h1><p class="sub">${esc(f.sub)}</p>
      <p class="head-note">${esc(f.head)}</p>
      <div class="shot" style="aspect-ratio:16/9;margin:16px 0">${photo('letters')}</div>
      <ol>${f.posts.map(p => `<li><time>${p.d}</time>${esc(p.t)}</li>`).join('')}</ol>
      <div class="famletter"><p class="to">${esc(f.letter.head)}</p><div class="bd" id="fam-bd"></div>
      <p class="ft">${esc(f.letter.foot)}</p></div>
      <p style="margin-top:26px"><button type="button" id="fam-end">とじる</button></p></div>`);
    PS.snd.paper(true);
    const bd = $('#fam-bd'), t = f.letter.body;
    // 墨がにじむように、一行ずつ
    const rows = t.split('\n');
    for (let i = 0; i < rows.length; i++) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0 0 .2em;opacity:0;filter:blur(6px);transition:opacity 1.2s,filter 1.2s';
      p.textContent = rows[i] || ' ';
      bd.append(p);
      requestAnimationFrame(() => { p.style.opacity = '1'; p.style.filter = 'none'; });
      if (rows[i]) PS.snd.ink();
      await sleep(calm ? 20 : 420);
    }
    await sleep(1200);
    PS.snd.bell(true);
    $('#fam-end').addEventListener('click', endcard);
  }
  function endcard() {
    $('#end').innerHTML = `<div class="end-in">
      <p class="kind">ポスト百景　No.087</p>
      <h2>のちの世の、名のわからぬ人へ</h2>
      <p>明治三十六年五月から、三十七年三月まで。<br>柚野の ポストを 通って、七通の 手紙が 届きました。</p>
      <div class="box">あなたが 送った 返事
${st.replies.filter(Boolean).map((r, i) => `${i + 1}通目　${r}`).join('\n')}</div>
      <p style="margin-top:16px">手紙は 百二十年 残り、曾孫の 手で 世に 出ました。<br>道が 閉じても、時は 前にしか 進みません。</p>
      <button type="button" id="again">はじめから 読む</button></div>`;
    $('#end').hidden = false;
    $('#again').addEventListener('click', () => { localStorage.removeItem(KEY); location.hash = '#/'; location.reload(); });
  }

  /* ---------- 覚え書き・音 ---------- */
  /* 考えている時間（覚え書きは、時間がたつと いまの項目だけ ヒント → 答え の順に読める）
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HELP_AT = [2, 6].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const helpStep = () => (st.ended && st.found && st.found.family) ? 9 : st.ended ? 4 : (st.sent || 0) >= 3 ? 3 : (st.sent || 0) === 2 ? 2 : 1;
  const helpLv = () => HELP_AT.filter(x => ((st.clock || {})[helpStep()] || 0) >= x).length;
  function paintHelp() {
    const cur = helpStep(), lv = helpLv(), c = (st.clock || {})[cur] || 0;
    const wait = (i, what) => `<p class="wait">（${what}は、あと ${fmtLeft(HELP_AT[i] - c)} で 読めます）</p>`;
    $('#help-body').innerHTML = '<p class="wait" style="padding:10px 16px 0">いま 取りかかっている 項目だけ、時間が かかっているときに ヒント → 答え の順で 読めるように なります。</p>'
      + PS.help.map(h => {
        if (!h.step || h.step < cur) return `<details><summary>${esc(h.t)}</summary>${h.h ? `<p>${esc(h.h)}</p>` : ''}<p>${esc(h.a)}</p></details>`;
        if (h.step > cur) return '';
        return `<details open><summary>${esc(h.t)}（いまの 項目）</summary>${lv >= 1 ? `<p>${esc(h.h)}</p>` : wait(0, 'ヒント')}${lv >= 2 ? `<p>答え：${esc(h.a)}</p>` : wait(1, '答え')}</details>`;
      }).join('') + (cur < 4 ? '<p class="wait" style="padding:10px 16px">（この先の 覚え書きは、話が 進むと 読めます）</p>' : '');
  }
  setInterval(() => {
    if (document.visibilityState !== 'visible' || (st.ended && st.found && st.found.family)) return;
    const before = helpLv(), k = helpStep();
    st.clock = st.clock || {}; st.clock[k] = (st.clock[k] || 0) + 5000;
    st.playMs = (st.playMs || 0) + 5000;
    save();
    if (!$('#help').hidden && helpLv() !== before) paintHelp();
  }, 5000);
  $('#help-btn').addEventListener('click', () => {
    $('#help').hidden = false;
    paintHelp();
  });
  $('#help-close').addEventListener('click', () => { $('#help').hidden = true; });
  $('#snd-btn').addEventListener('click', e => {
    st.mute = !st.mute; save();
    PS.snd.mute(st.mute);
    e.currentTarget.setAttribute('aria-pressed', String(!st.mute));
  });
  document.addEventListener('click', e => {
    if (!PS.snd.ready()) { PS.snd.start(); PS.snd.mute(!!st.mute); }
    const d = e.target.closest('[data-doc]');
    if (d) { st.doc = d.dataset.doc; save(); render(); }
  }, true);

  addEventListener('DOMContentLoaded', () => {
    $('#snd-btn').setAttribute('aria-pressed', String(!st.mute));
    render();
  });
  window.POS = { st: () => st, render, openLetter };
})();
