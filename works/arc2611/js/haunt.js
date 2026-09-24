/* ARC-2611 — 曝露と、その後：同意画面、既読化、送信者、記憶処理、返信、結末 */
(() => {
  'use strict';
  const A = window.A, X = A.X;
  const { $, $$, esc, hms, hm, norm, reduced } = A;
  const S = () => A.state;
  const BASE = '保全機構 記録閲覧端末';

  /* ---------- 演出の道具 ---------- */
  function glitch(ms = 1000) {
    document.body.classList.add('glitch');
    clearTimeout(glitch.t);
    glitch.t = setTimeout(() => document.body.classList.remove('glitch'), reduced ? 120 : ms);
  }
  function flash() { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function title() {
    const s = S();
    document.title = (s.unread ? `(${s.unread}) ` : '') + (s.replied ? '未読 — ' : s.exposed ? '既読 — ' : '') + BASE;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && S().exposed) document.title = S().replied ? '未読 1' : '既読';
    else title();
  });
  function flicker() {
    if (reduced || flicker.t) return;
    flicker.t = setInterval(() => {
      if (!S().exposed || document.hidden) return;
      const items = $$('.ix-title'), el = items[Math.floor(Math.random() * items.length)];
      if (!el) return;
      el.dataset.alt = S().replied ? '未読' : '既読';
      el.classList.add('flick');
      setTimeout(() => el.classList.remove('flick'), 240);
    }, 2400);
  }

  /* ---------- 同意画面 ---------- */
  A.showGate = () => {
    $('#app').hidden = true;
    $('#gate').hidden = false;
    $('#gate-id').textContent = S().id;
    if (S().ghost) { const p = $('#gate-prev'); p.hidden = false; p.innerHTML = '前回の閲覧記録　<b>1件</b>（削除できません）'; }
  };
  $('#gate-btn').addEventListener('click', () => {
    const s = S();
    s.agreed = true;
    if (s.ghost) { // 記憶処理のあと：忘れたはずのものが、最初から戻ってくる
      s.log.unshift({ t: s.ghost.at, kind: 'prev', doc: 'arc2611', note: '' });
      s.exposed = true;
      s.exposedAt = s.ghost.at;
    }
    A.save();
    A.renderBar();
    A.renderAudit();
    if (location.hash !== '#/doc/guide') location.hash = '#/doc/guide'; else A.route();
    if (s.ghost && !s.ghostShown) {
      setTimeout(() => {
        openChat();
        say(X.sender.ghost, 1500).then(() => { s.ghostShown = true; A.save(); setTimeout(() => endcard('forget'), 1400); });
      }, 1600);
      flicker();
    }
  });

  /* ---------- 送信者 ---------- */
  const chat = $('#chat'), logEl = $('#chat-log'), pill = $('#chat-pill');
  function renderChat() {
    logEl.innerHTML = S().chat.map(m => (m.from === 's'
      ? `<li class="s"><p>${esc(m.text)}</p><small>既読 ${hm(m.t)}</small></li>`
      : `<li class="me"><p>${esc(m.text)}</p>${m.unread ? '<small>未読</small>' : ''}</li>`)).join('');
    logEl.scrollTop = logEl.scrollHeight;
    $('#chat-sub').textContent = S().replied ? `あなた（${S().id}）の番です` : '不明';
  }
  function openChat() {
    chat.hidden = false;
    pill.hidden = true;
    S().unread = 0;
    A.save();
    title();
    logEl.scrollTop = logEl.scrollHeight;
  }
  $('#chat-min').addEventListener('click', () => { chat.hidden = true; pill.hidden = false; $('#chat-unread').textContent = S().unread || ''; });
  pill.addEventListener('click', openChat);
  let queue = Promise.resolve();
  function say(lines, gap = 1300) {
    lines.forEach(line => {
      queue = queue.then(() => new Promise(res => {
        logEl.insertAdjacentHTML('beforeend', '<li class="s typing"><p><i></i><i></i><i></i></p></li>');
        logEl.scrollTop = logEl.scrollHeight;
        setTimeout(() => {
          const s = S();
          s.chat.push({ from: 's', text: A.fill(line), t: Date.now() });
          if (chat.hidden) { s.unread += 1; pill.hidden = false; $('#chat-unread').textContent = s.unread; }
          A.save();
          renderChat();
          title();
          res();
        }, reduced ? 60 : gap);
      }));
    });
    return queue;
  }

  /* ---------- 閲覧の確認と、既読化 ---------- */
  A.confirmExpose = pane => {
    pane.innerHTML = '<article class="paper denied confirm"><span class="stamp ban">閲覧禁止</span><header class="p-head"><p class="p-org">保全機構　特異記録管理システム</p>'
      + `<h1 class="p-title">ARC-2611　${A.redact('<r k>既読</r>')}</h1></header><div class="p-body"><p>この記録を閲覧すると、閲覧記録が残ります。</p><p>閲覧記録は、いかなる理由があっても削除されません。</p><p>閲覧しますか。</p>`
      + '<div class="confirm-btns"><button type="button" class="danger" id="c-yes">閲覧する</button><button type="button" id="c-no">やめる</button></div></div></article>';
    $('#c-no').addEventListener('click', () => {
      A.log('stop', 'arc2611');
      $('.p-body', pane).insertAdjacentHTML('beforeend', '<p class="after-no">閲覧を中止しました。……中止したことも、記録されました。</p>');
    });
    $('#c-yes').addEventListener('click', () => expose(pane));
  };

  function expose(pane) {
    const d = A.doc('arc2611');
    pane.innerHTML = A.docHtml(d, { clean: true });
    $('#back', pane).addEventListener('click', () => history.back());
    // 本文を一文字ずつに分けて、「読まれていく」ように灰色にしていく
    const chars = [];
    $$('.p-body p', pane).forEach(p => {
      const text = p.textContent;
      p.textContent = '';
      [...text].forEach(ch => { const sp = document.createElement('span'); sp.textContent = ch; p.appendChild(sp); chars.push(sp); });
    });
    let i = 0;
    const step = () => {
      const n = reduced ? chars.length : 3;
      for (let k = 0; k < n && i < chars.length; k++, i++) { chars[i].className = 'swept'; }
      $$('.p-body .head', pane).forEach(h => h.classList.remove('head'));
      if (chars[i]) { chars[i].classList.add('head'); setTimeout(step, 28); } else setTimeout(done, 600);
    };
    const done = () => {
      const s = S();
      s.exposed = true;
      s.exposedAt = Date.now();
      A.save();
      A.log('kidoku', 'arc2611');
      $('.p-title', pane).innerHTML = `ARC-2611　${A.redact('<r k>既読</r>')}`;
      $('#paper').insertAdjacentHTML('beforeend', `<p class="receipt">既読　${hm(s.exposedAt)}</p>`);
      flash();
      glitch(1600);
      A.renderBar();
      A.renderIndex('arc2611');
      title();
      flicker();
      setTimeout(() => { openChat(); say(X.sender.first, 1500); }, 2000);
    };
    setTimeout(step, reduced ? 0 : 900);
  }

  // 曝露のあと、文書を開くたびに
  A.afterOpen = d => {
    const s = S();
    if (!s.exposed || s.seenAfter[d.id]) return;
    s.seenAfter[d.id] = Date.now();
    A.save();
    if (Object.keys(s.seenAfter).length === 3 && !s.replied) say([X.sender.order]);
    if (s.readOrder.includes(d.id)) glitch(350);
  };

  /* ---------- 結末1：記憶処理 ---------- */
  A.bindForget = form => form.addEventListener('submit', e => {
    e.preventDefault();
    const s = S(), msg = $('#forget-msg', form);
    if (!s.exposed) { msg.textContent = '曝露の記録がありません。記憶処理の対象外です。'; return; }
    const v = $('#forget-t', form).value.replace(/\D/g, ''), want = hms(s.exposedAt).replace(/\D/g, '');
    if (v !== want) { msg.textContent = '曝露時刻が一致しません。監査記録の「既読」の行を確かめてください。'; return; }
    msg.textContent = '';
    A.log('forget');
    const ov = $('#endcard');
    ov.hidden = false;
    ov.className = 'endcard white';
    ov.innerHTML = '<div class="ec-inner"><p class="ec-type" id="ec-type">記憶処理を実行しています</p><div class="ec-bar"><i></i></div></div>';
    setTimeout(() => { $('#ec-type').textContent = '完了しました。あなたは、何も読んでいません。'; }, reduced ? 200 : 4200);
    setTimeout(() => {
      const keep = { id: s.id, endings: [...new Set([...s.endings, 'forget'])], ghost: { at: s.exposedAt } };
      A.state = A.fresh(keep);
      A.save();
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    }, reduced ? 800 : 7000);
  });

  /* ---------- 結末2：返信 ---------- */
  $('#chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const s = S(), inp = $('#chat-in'), text = inp.value.trim();
    if (!text || !s.exposed) return;
    inp.value = '';
    s.chat.push({ from: 'me', text, t: Date.now() });
    A.save();
    renderChat();
    if (s.replied) { say(X.help.reply); return; }
    if (!s.replyUnlocked) {
      if (norm(text) === norm('へんじをして')) { s.replyUnlocked = true; A.save(); say(X.sender.unlock); }
      else say([X.sender.locked]);
      return;
    }
    s.replied = true;
    s.message = text.slice(0, 80);
    s.ending = 'reply';
    s.endings = [...new Set([...s.endings, 'reply'])];
    s.chat[s.chat.length - 1].unread = true;
    A.save();
    A.log('reply', 'reply');
    renderChat();
    say(X.sender.replied, 1600).then(() => {
      A.renderBar();
      A.renderIndex(A.currentId);
      glitch(900);
      title();
      setTimeout(() => endcard('reply'), 1400);
    });
  });

  A.renderReply = pane => {
    const s = S(), n = Math.max(1, [...s.message].length);
    A.log('view', 'reply');
    pane.innerHTML = '<article class="paper"><span class="stamp ban">閲覧禁止</span><header class="p-head"><p class="p-org">保全機構　特異記録管理システム</p>'
      + `<h1 class="p-title">ARC-2611-${s.id}　未読</h1><dl class="p-fields"><div><dt>記録番号</dt><dd>ARC-2611-${s.id}</dd></div><div><dt>名称</dt><dd>未読</dd></div><div><dt>等級</dt><dd>閲覧禁止</dd></div><div><dt>送信者</dt><dd>${s.id}</dd></div></dl></header>`
      + `<div class="p-body"><section><h3>本文</h3><p><span class="rd" style="--n:${n}"></span></p><p>（まだ、誰にも読まれていません）</p></section>`
      + `<section><h3>概要</h3><p>${s.id} から送信されたメッセージ一件。受信者は、次にこの端末を開いた人物である。</p><p>送信者本人も、本文を読み返すことはできない。</p></section></div></article>`;
  };

  /* ---------- 結末の札 ---------- */
  function endcard(kind) {
    const ov = $('#endcard');
    const E = {
      forget: ['END 1', 'わすれても、既読', '記憶処理は成功しました。あなたは何も覚えていません。それでも、文章を読むたびに、送信者はあなたを見つけます。', 'もうひとつの結末は、送信者への返信から。'],
      reply: ['END 2', '未読 1', 'あなたのメッセージは、まだ誰にも読まれていません。次にこの端末を開いた人が、最初の読者になります。', 'もうひとつの結末は、記憶処理の手順書から。']
    }[kind];
    const other = S().endings.length >= 2 ? '二つの結末を、どちらも見ました。どちらを選んでも、戻れませんでしたね。' : E[3];
    ov.hidden = false;
    ov.className = 'endcard';
    ov.innerHTML = `<div class="ec-inner"><p class="ec-no">${E[0]}</p><h2 class="ec-title">${E[1]}</h2><p>${E[2]}</p><p class="ec-other">${other}</p><button type="button" id="ec-close">端末に戻る</button></div>`;
    $('#ec-close').addEventListener('click', () => { ov.hidden = true; });
    $('#ec-close').focus();
  }

  /* ---------- 起動 ---------- */
  A.renderBar();
  A.renderAudit();
  renderChat();
  title();
  if (S().exposed && S().agreed) {
    flicker();
    if (S().chat.length) { pill.hidden = false; $('#chat-unread').textContent = S().unread || ''; }
  }
  A.route();
})();
