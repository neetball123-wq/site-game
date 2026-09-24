/* 霞野線アーカイブ — ミナトの秘密基地（2006〜2009の個人ホームページ） */
(() => {
  'use strict';
  const { D, $, $$, esc, state, save, fact, norm, routes, go } = K;
  const art = K.art;
  const O = D.old;
  const root = () => $('#v-old');

  function frame(content) {
    root().innerHTML = '<div class="oh"><div class="oh-banner"><p class="oh-title">★ミナトの秘密基地★</p><p class="oh-sub">～霞野線と、おじいちゃんと、わたし～</p></div>'
      + '<div class="oh-body"><nav class="oh-menu" aria-label="秘密基地メニュー"><p class="oh-mh">MENU</p>'
      + [['top', 'TOP'], ['profile', 'プロフィール'], ['diary', '日記'], ['lab', '研究室'], ['bbs', '掲示板']].map(([k, t]) => `<a href="#/old/${k}" data-k="${k}">${t}</a>`).join('')
      + '<a href="#/links" class="oh-exit">語り継ぐ会へもどる</a></nav>'
      + `<div class="oh-main">${content}</div></div><p class="oh-foot">(C) 2006-2009 ミナト ／ 無断転載禁止！ ／ このHPは 1024×768 で見てね</p></div>`;
    // TOP をもう一度押したら、読み込み直しと同じ扱い（カウンターが回る）
    $('.oh-menu a[data-k="top"]', root()).addEventListener('click', e => {
      if (location.hash === '#/old/top') { e.preventDefault(); routes.old(['top']); }
    });
  }

  function gate() {
    root().innerHTML = '<div class="oh-gate"><p class="oh-title blink">★ ミナトの秘密基地 ★</p><p>ここは ひみつの ばしょ です。<br>合言葉を 入れてね♪</p>'
      + '<form id="gate-form"><label class="sr" for="gate-pw">合言葉</label><input id="gate-pw" autocomplete="off" maxlength="12"><button type="submit">ENTER</button></form>'
      + '<p id="gate-msg" class="oh-msg" aria-live="polite"></p><p class="oh-small">since 2006.4.1 ／ リンクフリー（でも一言くれるとうれしい）</p><a class="oh-back" href="#/links">もどる</a></div>';
    $('#gate-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = norm($('#gate-pw').value);
      if (['ユウナギ', '夕凪', 'YUUNAGI', 'YUNAGI'].includes(v)) {
        state.old = true;
        save();
        fact('password');
        go('#/old/top');
        return;
      }
      $('#gate-msg').textContent = v ? 'ちがうよ～ (>_<)　ヒント：語り継ぐ会のスタンプ帳！' : '合言葉を入れてね！';
    });
  }

  const PAGES = {
    top() {
      state.counter += 1;
      const kiri = state.counter === 10000 && !state.lab;
      if (kiri) state.lab = true;
      save();
      fact('kiriban');
      const digits = String(state.counter).padStart(5, '0').split('').map(d => `<i>${d}</i>`).join('');
      return '<div class="oh-marquee" aria-hidden="true"><span>ようこそ！ミナトの秘密基地へ！ 霞野線と、おじいちゃんと、月見野のことを調べています☆ キリ番10000を踏んだ人には研究室のカギをあげるよ！ 踏み逃げ禁止！</span></div>'
        + `<p class="oh-counter">あなたは <span class="digits">${digits}</span> 人目のお客さまです</p>`
        + (kiri ? '<div class="kiriban"><p class="blink">☆★☆ キリ番 10000 ゲット！ ☆★☆</p><p>おめでとう！！ 研究室のカギを開けたよ♪ → <a href="#/old/lab">研究室へGO！</a></p><p class="oh-small">（踏み逃げ禁止だよ！ 掲示板に報告してね）</p></div>'
          : state.lab ? '' : `<p class="oh-note">★ キリ番 <b>10000</b> を踏んだ人は、研究室に入れます！ あと <b>${10000 - state.counter}</b> 人！</p>`)
        + `<h2>更新履歴</h2><table class="oh-table">${O.updates.map(([d, t]) => `<tr><th>${d}</th><td>${esc(t)}</td></tr>`).join('')}</table>`
        + '<p class="oh-small">このHPは Internet Explorer 6 で動作確認しています。</p>';
    },
    profile() {
      return '<h2>★プロフィール★</h2><table class="oh-table"><tr><th>なまえ</th><td>ミナト</td></tr><tr><th>学年</th><td>中1（2006年）</td></tr>'
        + '<tr><th>すきなもの</th><td>霞野線、ナダ100形、夕凪の海</td></tr><tr><th>きらいなもの</th><td>ピーマン、テスト</td></tr>'
        + '<tr><th>夢</th><td>月見野駅を見つけること！</td></tr><tr><th>ひとこと</th><td>おじいちゃんは霞野線の運転士でした。会ったことはないけど、いつか会える気がしてる。</td></tr></table>';
    },
    diary() {
      return `<h2>★日記★</h2>${O.diary.map(([d, t]) => `<div class="oh-entry"><p class="oh-date">${d}</p><p>${esc(t)}</p></div>`).join('')}`;
    },
    lab() {
      if (!state.lab) {
        return `<h2>◆研究室◆</h2><p class="oh-lock">※研究室にはカギがかかっています。<br>キリ番 <b>10000</b> を踏んだ人だけ入れます！（いまのカウンター：${state.counter}）</p>`;
      }
      fact('lab');
      const morse = O.morse.map(([k, c]) => `<div><b>${k}</b><span>${c}</span></div>`).join('');
      return '<h2>◆研究室◆ 月見野駅のひみつ</h2>'
        + `<section class="oh-sec"><h3>その1　月見野駅（予定）</h3>${art.planMap()}<p>図書館で見つけた昭和6年の計画図。汐入と霞沢のあいだに「月見野（予定）」って書いてある！ でも昭和37年に霞ダムができて、月見野の村は湖の底に沈んだ。だから駅は作られなかった……らしい。</p></section>`
        + '<section class="oh-sec"><h3>その2　おじいちゃんの最後の列車</h3><p>おばあちゃんが一度だけ話してくれた。おじいちゃんの日誌には「霞沢を出て2分で月見野に停まった」って書いてあるらしい（見せてくれないけど）。</p>'
        + '<p>2分でどこまで行けるか計算すれば、場所がわかるはず。でも、おじいちゃんがどれくらいの速さで走ってたのかがわからない。<br>→ きょり ＝ はやさ × じかん！（数学でやった）</p><p>場所がわかったら、線路跡の距離標を目印にして行ってみたい。</p></section>'
        + '<section class="oh-sec"><h3>その3　信号のはなし</h3><p>灘浜のじいさんが言ってた。「あの晩、霞沢の先で、信号がずっと同じ調子で瞬いておった」。もしかして、モールス信号？</p>'
        + `<p>おじいちゃんの形見の『無線通信の手引き』に、和文モールスの表がはさまってた。写しておく。</p><div class="oh-morse">${morse}</div>`
        + '<p>・＝短い光　－＝長い光（短いの3つぶん）。1文字の中の休みは短く、文字と文字のあいだは長めに休む。「゛」は前の文字にくっつける。</p></section>'
        + '<section class="oh-sec"><h3>その4　古いパソコン</h3><p>灘浜駅の倉庫にある古いパソコンに、北灘鉄道の運行管理システム「TMS-87」の端末が残ってるらしい。いつか保存会を作ったら、資料室に置きたい！</p>'
        + '<p>ログインIDは乗務員番号。パスワードは誰も知らない。もし月見野の信号が何かを言ってるなら、それがパスワードかも。……なんてね。</p></section>';
    },
    bbs() {
      return `<h2>★掲示板★</h2><p class="oh-small">※現在、書き込みは停止中です。</p>${O.bbs.map(([d, n, t]) => `<div class="oh-post${n === '148D' ? ' strange' : ''}"><p class="oh-ph"><b>${esc(n)}</b>　${d}</p><p>${esc(t)}</p></div>`).join('')}`;
    }
  };

  routes.old = ([sub]) => {
    if (!state.old) { gate(); return; }
    if (!sub || !PAGES[sub]) { location.replace('#/old/top'); return; }
    frame(PAGES[sub]());
    $$('.oh-menu a', root()).forEach(a => a.classList.toggle('on', a.dataset.k === sub));
    scrollTo(0, 0);
  };
})();
