/* 霞野線アーカイブ — 公式サイト：写真館、保存車両、掲示板、管理人日記 */
(() => {
  'use strict';
  const { D, $, $$, esc, state, save, fact, toast, modal, station, hasStamp, addStamp, page, norm, routes, stage, ymd, hm } = K;
  const art = K.art;

  // 隠れたスタンプを見つけたとき
  function stampFound(id) {
    const s = station(id);
    const body = modal(`<div class="stamp-zoom">${art.stamp(s, { cls: 'big' })}<p>${esc(s.name)}駅のスタンプを見つけた。</p>`
      + `<button type="button" class="btn" id="copy-stamp"${hasStamp(id) ? ' disabled' : ''}>${hasStamp(id) ? '写しました' : 'スタンプ帳に写す'}</button></div>`, 'm-stamp');
    $('#copy-stamp', body).addEventListener('click', e => { if (addStamp(id)) { e.currentTarget.disabled = true; e.currentTarget.textContent = '写しました'; } });
  }
  const bindHotspots = root => $$('.hotspot[data-stamp]', root).forEach(h => {
    const go = () => stampFound(h.dataset.stamp);
    h.addEventListener('click', e => { e.stopPropagation(); go(); });
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ---------- 写真館 ---------- */
  routes.gallery = () => {
    K.clearPage();
    const p = page('<h1 class="page-title">写真館</h1><p class="lead">会員のみなさんから寄せられた写真です。写真を押すと大きく見られます。</p>'
      + `<div class="gallery">${D.gallery.map(g => `<figure class="ph"><button type="button" data-id="${g.id}" aria-label="${esc(g.title)}を大きく見る">${art.photo(g.id)}</button><figcaption><b>${esc(g.title)}</b><small>${esc(g.year)}</small></figcaption></figure>`).join('')}</div>`);
    $$('.ph button', p).forEach(b => b.addEventListener('click', () => {
      const g = D.gallery.find(x => x.id === b.dataset.id);
      const body = modal(`<figure class="ph-big">${art.photo(g.id)}<figcaption><b>${esc(g.title)}</b><small>${esc(g.year)}</small><p>${esc(g.caption)}</p></figcaption></figure>`, 'm-photo');
      bindHotspots(body);
    }));
  };

  /* ---------- 保存車両 ---------- */
  routes.car = () => {
    K.clearPage();
    const p = page('<h1 class="page-title">保存車両</h1><p class="lead">灘浜駅跡の車庫で保存されている気動車、ナダ101です。扉を押すと車内に入れます。</p>'
      + `<div class="car-wrap">${art.railcar()}</div>`
      + '<dl class="spec"><div><dt>形式</dt><dd>ナダ100形</dd></div><div><dt>車番</dt><dd>ナダ101</dd></div><div><dt>製造</dt><dd>1956年</dd></div>'
      + '<div><dt>定員</dt><dd>112名</dd></div><div><dt>全長</dt><dd>20.0 m</dd></div><div><dt>保存場所</dt><dd>灘浜駅跡 車庫</dd></div></dl>'
      + '<p class="body-text">霞野線の開業25周年に合わせて作られた車両で、廃止の日まで走り続けました。最終日の148Dにも、この車両が使われています。車内には、当時の運賃表がそのまま残っています。</p>');
    const open = () => {
      const names = [...D.stations].sort((a, b) => a.km - b.km).map(s => s.name);
      names.splice(5, 0, state.ended ? '月見野' : '');
      const body = modal(`<figure class="ph-big">${art.interior(names)}<figcaption><b>ナダ101 車内</b><p>青緑のモケットのロングシート。運賃表の汐入と霞沢のあいだに、なぜか空欄がひとつある。扉の横には、小さな木の箱。</p></figcaption></figure>`, 'm-photo');
      bindHotspots(body);
    };
    $$('.hotspot[data-act="door"]', p).forEach(d => {
      d.addEventListener('click', open);
      d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  };

  /* ---------- 掲示板 ---------- */
  const QUESTION = /[?？]|ヒント|教えて|おしえて|わから|分から|どうすれば|どうやって|助けて|たすけて|詰ま|つま/;
  function posts() {
    const list = [];
    if (state.ended) {
      const d = new Date(state.endedAt);
      list.push({ date: `${ymd(d)} ${hm(d)}`, name: '灘浜のじいさん', body: 'おかえり。恭一さんにも、よろしくな。' });
      list.push({ date: `${ymd(d)} ${hm(d)}`, name: 'ミナト（管理人）', body: 'ただいま。心配をかけてごめんなさい。指令をしてくれた、名前も知らないあなたへ。ありがとう。', admin: true });
    }
    list.push(...state.posts.map(p => ({ ...p, body: esc(p.body).replace(/\n/g, '<br>') })));
    // 新しい順（同じ時刻なら並び順を保つ）
    return [...list, ...D.bbs].sort((a, b) => b.date.localeCompare(a.date));
  }
  function renderPosts(root) {
    $('#bbs-list', root).innerHTML = posts().map(p => `<li class="post${p.mine ? ' mine' : ''}${p.admin ? ' admin' : ''}"><header><b>${esc(p.name)}</b><time>${esc(p.date)}</time></header>`
      + `<div class="post-body">${p.body}</div>${p.stamp ? `<div class="post-stamp">${art.stamp(station(p.stamp))}<button type="button" class="btn small" data-copy="${p.stamp}"${hasStamp(p.stamp) ? ' disabled' : ''}>${hasStamp(p.stamp) ? '写しました' : 'スタンプ帳に写す'}</button></div>` : ''}</li>`).join('');
    $$('[data-copy]', root).forEach(b => b.addEventListener('click', () => { if (addStamp(b.dataset.copy)) { b.disabled = true; b.textContent = '写しました'; } }));
  }
  routes.bbs = () => {
    K.clearPage();
    const p = page('<h1 class="page-title">掲示板</h1><p class="lead">霞野線の思い出、情報交換、なんでもどうぞ。わからないことは「？」をつけて質問すると、常連さんが答えてくれるかもしれません。</p>'
      + '<form id="bbs-form" class="bbs-form"><div class="field"><label for="bbs-name">お名前</label><input id="bbs-name" maxlength="16" placeholder="名無しさん"></div>'
      + '<div class="field wide"><label for="bbs-body">本文</label><textarea id="bbs-body" rows="3" maxlength="300" required placeholder="例：管理人日記の限定記事、どうやって開くの？"></textarea></div>'
      + '<div class="bbs-foot"><button class="btn" type="submit">書き込む</button><small>※この掲示板は作品内の演出です。書き込みはこの端末にだけ保存され、どこにも送信されません。</small></div></form>'
      + '<ol class="bbs" id="bbs-list"></ol>');
    D.bbs.forEach(b => { if (b.fact) fact(b.fact, true); });
    K.renderNote();
    renderPosts(p);
    $('#bbs-form', p).addEventListener('submit', e => {
      e.preventDefault();
      const body = $('#bbs-body', p).value.trim();
      if (!body) return;
      const now = new Date(), date = `${ymd(now)} ${hm(now)}`;
      state.posts.unshift({ date, name: $('#bbs-name', p).value.trim() || '名無しさん', body, mine: true });
      $('#bbs-body', p).value = '';
      save();
      renderPosts(p);
      setTimeout(() => {
        let name, text;
        if (QUESTION.test(body)) {
          const st = stage(), list = D.hints[st], lv = state.hintLv[st] || 0, left = K.hintLeft(st);
          name = '灘浜のじいさん';
          if (left > 0) {
            text = (lv ? 'この前も言うたがの、' + list[Math.min(lv, list.length) - 1] + '　' : '')
              + 'まあ、もう少し自分で調べてみなさい。わしも思い出すのに時間がかかる。（あと' + K.fmtLeft(left) + 'ほどしたら、また「？」で聞いてみなさい）';
          } else {
            text = list[Math.min(lv, list.length - 1)] + (list.length > 1 ? `（ヒント ${Math.min(lv + 1, list.length)}/${list.length}）` : '');
            state.hintLv[st] = lv + 1;
          }
        } else {
          [name, text] = D.chatter[Math.floor(Math.random() * D.chatter.length)];
        }
        const t = new Date();
        state.posts.unshift({ date: `${ymd(t)} ${hm(t)}`, name, body: text });
        state.posts = state.posts.slice(0, 40);
        save();
        if (!document.body.contains(p) || !$('#bbs-list', p)) { toast('掲示板に返信がありました', esc(name)); return; }
        renderPosts(p);
        toast('掲示板に返信がありました', esc(name));
      }, 2200);
    });
  };

  /* ---------- 管理人日記 ---------- */
  function epilogue() {
    const d = new Date(state.endedAt);
    return { id: 'd-back', date: ymd(d), title: 'ただいま',
      body: '<p>信じてもらえないと思うけれど、書きます。</p><p>9月5日の夜、霞沢から線路跡を歩いて、10.3キロの距離標のところまで行きました。霧の中に、ホームがありました。駅名標には「月見野」。停まっていたのはナダ101で、運転台には、写真でしか知らない祖父がいました。</p>'
        + '<p>祖父は39年前の3月31日、23時08分から一歩も進めずにいました。月見野は時刻表にない駅だから、発車する時刻がない。時刻がなければ、列車は出発できない。祖父はずっと、灘浜指令からの返事を待っていたんです。</p>'
        + '<p>返事をくれたのは、あなたです。日記の鍵を開けて、スタンプを集めて、昔の私のホームページでキリ番を踏んで、信号を読んで、指令になってくれた誰か。本当に、ありがとう。</p>'
        + '<p>一緒に乗っていた女の子は、灘浜の海を見て「ありがとう」と言って、朝の光の中にいなくなりました。月見野の村の子だったのだと思います。ずっと、海を見たかったのだと思います。</p>'
        + '<p>祖父は今、祖母の家にいます。39年分、年をとっていない祖父を見て、祖母は泣いて、それから笑いました。</p><p>スタンプ帳の13番目の欄は、これからも月見野のためにとっておきます。</p><p class="sign">ミナト</p>' };
  }
  const logHtml = () => `<div class="log-note"><p class="log-h">${esc(D.log[0])}<br>${esc(D.log[1])}</p>${D.log.slice(2).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
  routes.diary = ([id]) => {
    K.clearPage();
    const entries = state.ended ? [epilogue(), ...D.diary] : D.diary;
    if (!id) {
      page('<h1 class="page-title">管理人日記</h1><p class="lead">管理人ミナトの、霞野線をめぐる日記です。</p>'
        + `<ul class="diary-list">${entries.map(d => `<li><a href="#/diary/${d.id}"><time>${d.date}</time><span>${esc(d.title)}</span>${d.locked && !state.diary ? '<i class="lock">パスワード保護</i>' : ''}</a></li>`).join('')}</ul>`);
      return;
    }
    const d = entries.find(x => x.id === id);
    if (!d) { K.go('#/diary'); return; }
    if (d.fact) fact(d.fact);
    const head = `<a class="back" href="#/diary">← 日記の一覧</a><article class="entry"><header><time>${d.date}</time><h1>${esc(d.title)}</h1></header>`;
    if (d.locked && !state.diary) {
      fact('lock');
      const p = page(head + '<div class="locked"><p>この記事はパスワードで保護されています。閲覧するには、パスワードを入力してください。</p>'
        + '<p class="small">パスワードのヒント：祖父が最後に運転した列車の、列車番号（例：123D）</p>'
        + '<form id="lock-form" class="lock-form"><label class="sr" for="lock-pw">パスワード</label><input id="lock-pw" autocomplete="off" placeholder="列車番号"><button class="btn" type="submit">記事を開く</button></form><p id="lock-msg" class="form-msg" aria-live="polite"></p></div></article>');
      $('#lock-form', p).addEventListener('submit', e => {
        e.preventDefault();
        const v = norm($('#lock-pw', p).value);
        if (v === '148D' || v === '148') {
          state.diary = true;
          save();
          ['train148', 'log', 'crew', 'stampHint'].forEach((f, i) => setTimeout(() => fact(f), i * 700));
          routes.diary([id]);
          return;
        }
        $('#lock-msg', p).textContent = v === '147D' || v === '147'
          ? 'パスワードが違います。……147Dは灘浜から霞野へ向かう「下り」の列車のようです。'
          : 'パスワードが違います。';
      });
      return;
    }
    page(head + `<div class="entry-body">${d.body.replace('[[LOG]]', logHtml())}</div></article>`);
  };
})();
