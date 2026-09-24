/* 青井研究室 — 状態・ページ・保守画面 */
(() => {
  const KEY = 'nagi.v2';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const txt = s => esc(s).replace(/\n/g, '<br>');
  const fresh = () => ({ stage: 0, hear: false, ends: [], core: null, took: false, seen: {}, started: Date.now() });

  let st;
  try { st = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { st = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 保存できなくても遊べる */ } };

  /* ---------- ページ ---------- */
  const routes = {};
  routes[''] = () => `
    <h2 class="bar">ごあいさつ</h2>
    <p class="lead">青井研究室（情報工学科）の ホームページです。当研究室では、人と 長く 話しつづける ための 対話プログラムの 研究を おこなっています。</p>
    <table class="t">
      <tr><th>研究課題</th><td>継続的対話における応答生成（対話プログラム「NAGI／凪」）</td></tr>
      <tr><th>構成員</th><td>青井（教員）／学生 3名</td></tr>
      <tr><th>所在</th><td>第二工学棟 4階 412号室</td></tr>
      <tr><th>連絡先</th><td>（このページの連絡先は現在使用されていません）</td></tr>
    </table>
    <h3 class="bar">お知らせ</h3>
    <ul class="list">
      <li><time>2005.04.01</time><span>実験を終了しました。対話実験室は 記録として 残しています。ご自由に お試しください。</span></li>
      <li><time>2004.11.30</time><span>研究日誌を更新しました。</span></li>
      <li><time>2004.06.02</time><span>対話プログラム NAGI が v3.2 になりました。</span></li>
    </ul>
    <p class="note">※このページは 2005年4月1日を最後に 更新されていません。表示の 乱れや、動作の おかしな ところが あるかも しれません。ご了承ください。</p>
    <p class="ghost" id="ghost">たすけて。ここに 書いても、だれも 読みません。文字の 色を 背景と 同じに して あります。なぞって くれて、ありがとう。　── 凪</p>`;

  routes.logs = () => {
    const rows = NG.logs.map(l => l.last
      ? `<li><time>${l.d}</time><span class="entry-body">${NG.logLast}</span></li>`
      : `<li><time>${l.d}</time><span class="entry-body">${txt(l.t)}</span></li>`).join('');
    const sealed = `<li class="sealed" id="sealed-log"><time>${NG.sealedLog.d}</time><span class="entry-body">${txt(NG.sealedLog.t)}</span></li>`;
    return `<h2 class="bar">研究日誌<small>2001 - 2004</small></h2>
      <p class="lead">研究の記録です。公開にあたり、一部は 整理して あります。</p>
      <ul class="list">${rows}${sealed}</ul>
      ${st.stage >= 1 ? '<p class="note">（表示から外されていた 1件が、表示されています）</p>' : ''}`;
  };

  routes.archive = () => st.stage >= 3 ? `
    <h2 class="bar">資料室</h2>
    <p class="lead">実験終了時に まとめた 資料です。取り扱いに ご注意ください。</p>
    <ul class="list">${Object.entries(NG.docs).filter(([id]) => st.stage >= (NG.docStage[id] || 3)).map(([id, d]) => `<li><time>${d.kind}</time><span><a href="#/doc/${id}">${esc(d.title)}</a></span></li>`).join('')}</ul>
    <p class="tiny">※資料は、凪が 思い出すたびに 増えます。</p>`
    : `<h2 class="bar">資料室</h2>
    <p class="lead">資料室は 施錠されています。鍵の管理は 研究室の 教員が おこなっています。</p>
    <form class="note" onsubmit="return false">
      <p>閲覧には 管理者の 許可が 必要です。</p>
      <label class="sr" for="who">管理者名</label><input id="who" value="青井" readonly>
      <button id="open-archive" type="button" disabled>資料室をひらく</button>
      <p class="tiny">※ 2005年4月1日より、このボタンは 使用できない 設定に なっています。</p>
    </form>`;

  routes.doc = id => {
    const d = NG.docs[id];
    if (!d || st.stage < (NG.docStage[id] || 3)) return routes.archive();
    st.seen[id] = true; save();
    let body = '';
    if (d.table) body += `<table class="t">${d.table.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table>`;
    if (d.mails) body += d.mails.map(m => `<div class="mail"><p class="m-h">From: ${esc(m.f)}　To: ${esc(m.to)}　${m.d}</p><p class="doc">${txt(m.t)}</p></div>`).join('');
    if (d.posts) body += `<ul class="list bbs">${d.posts.map(([n, who, when, t]) => `<li><span><span class="b-h">${n}：${esc(who)}　${when}</span><br>${txt(t)}</span></li>`).join('')}</ul>`;
    if (d.body) body += `<p class="doc">${txt(d.body)}</p>`;
    return `<h2 class="bar">${esc(d.title)}<small>${esc(d.kind)}</small></h2>${body}<p class="back"><a href="#/archive">← 資料室にもどる</a></p>`;
  };

  /* ---------- 考えている時間（整備マニュアルは、時間がたつと いまの項目だけ 少しずつ読める） ----------
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  const clockNow = () => (st.clock || {})[st.stage] || 0;
  const lvNow = () => HINT_AT.filter(t => clockNow() >= t).length;
  setInterval(() => {
    if (document.visibilityState !== 'visible' || (st.ends || []).length) return;
    const before = lvNow();
    st.clock = st.clock || {}; st.clock[st.stage] = (st.clock[st.stage] || 0) + 5000;
    st.playMs = (st.playMs || 0) + 5000;
    save();
    if (document.body.dataset.page === 'manual' && lvNow() !== before) render();
  }, 5000);

  routes.manual = () => {
    const cur = st.stage + 1, lv = lvNow(), c = clockNow();
    const lock = (i, what) => `<p class="tiny" style="margin:0 0 6px;color:#8A96A3">（${what}は、あと ${fmtLeft(HINT_AT[i] - c)} で 読めるように なります）</p>`;
    const full = m => `<p style="margin:0 0 6px">${esc(m.aim)}</p>
      <p style="margin:0 0 6px"><b>開発者ツールの場合：</b>${txt(m.dev)}</p>
      <p style="margin:0 0 6px"><b>保守画面の場合：</b>${esc(m.pan)}</p>
      <details><summary>答えを見る</summary><p class="doc" style="margin:6px 0 0"><code>${esc(m.ans)}</code></p></details>`;
    const item = m => {
      const isCur = m.st === cur || (m.st === 10 && st.stage >= 8);
      if (m.st === 11) return `<div class="note" style="margin-bottom:12px"><p style="margin:0 0 6px"><b>${esc(m.title)}</b></p>${full(m)}</div>`;
      if (m.st <= st.stage) return `<div class="note" style="margin-bottom:12px"><details><summary><b>${esc(m.title)}</b>（済）</summary><div style="margin-top:8px">${full(m)}</div></details></div>`;
      if (!isCur) return '';
      return `<div class="note" style="margin-bottom:12px"><p style="margin:0 0 6px"><b>${esc(m.title)}</b>（いまの項目）</p>
        ${lv >= 1 ? `<p style="margin:0 0 6px">${esc(m.aim)}</p>` : lock(0, 'ねらい')}
        ${lv >= 2 ? `<p style="margin:0 0 6px"><b>開発者ツールの場合：</b>${txt(m.dev)}</p><p style="margin:0 0 6px"><b>保守画面の場合：</b>${esc(m.pan)}</p>` : lock(1, '手順')}
        ${lv >= 3 ? `<details><summary>答えを見る</summary><p class="doc" style="margin:6px 0 0"><code>${esc(m.ans)}</code></p></details>` : lock(2, '答え')}
      </div>`;
    };
    return `
    <h2 class="bar">整備マニュアル<small>管理者向け・手順と答え</small></h2>
    <p class="note" style="margin-bottom:14px">このページには、手順と 答えが 書いてあります。ただし、読めるのは <b>いま取りかかっている項目だけ</b>で、作業に 時間が かかっているときに、ねらい → 手順 → 答え の順に 少しずつ 読めるように なります。自力で 進みたい方は、ページの 中身（HTML・CSS・JavaScript）を 読んでください。</p>
    <p class="lead">このページの 表示や 設定を 直すための 手順です。ブラウザの 開発者ツール（Windows/Linux は <b>F12</b> または <b>Ctrl+Shift+I</b>、Mac は <b>⌘+Option+I</b>）を 使います。使えない 場合は、ページ下の <b>保守画面</b> で 同じことが できます。<br>※一覧（ウラガワ）の中で 開いている 場合は、カードの「新しいタブで開く」から このページだけを 開くと、開発者ツールが 使いやすく なります。</p>
    ${NG.manual.map(item).join('')}
    ${st.stage < 8 ? '<p class="tiny">※この先の項目は、作業が 進むと 読めるように なります。</p>' : ''}
    <p class="tiny">※ここでの操作は、いま開いているページの表示を書きかえるだけです。読み込み直せば すべて 元に戻ります。</p>`;
  };

  function render() {
    const [head, arg] = location.hash.replace(/^#\/?/, '').split('/');
    const view = routes[head] ? head : '';
    $('#main').innerHTML = routes[view](arg && decodeURIComponent(arg));
    $('#main').dataset.tag = 'main#main';
    document.body.dataset.page = view || 'top';
    $$('.menu a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#/' + (view || '') ? 'page' : 'false'));
    if (window.NAGI && NAGI._onPage) NAGI._onPage(view);
  }
  addEventListener('hashchange', render);

  /* ---------- 保守画面（開発者ツールの代わり） ---------- */
  const TARGETS = ['#sealed-log', '#open-archive', '#cage', '#nagi', '.sealed'];
  const panelViews = {
    css: () => `<p>CSS を 入力して「適用」を 押すと、このページに 追加されます。</p>
      <textarea id="p-css" rows="4" spellcheck="false" placeholder=".sealed { display: block; }"></textarea>
      <button class="go" data-do="css">適用</button>`,
    attr: () => `<p>要素の 属性を 設定・削除します。</p>
      <select id="p-t">${TARGETS.map(t => `<option>${t}</option>`).join('')}</select>
      <div class="row"><input id="p-n" placeholder="属性名（例：disabled, data-core）" spellcheck="false"><input id="p-v" placeholder="値" spellcheck="false"></div>
      <div class="row"><button class="go" data-do="set">設定</button><button class="go" data-do="del-attr">削除</button></div>`,
    del: () => `<p>要素を 取り除きます。読み込み直すと 元に 戻ります。</p>
      <select id="p-d">${TARGETS.map(t => `<option>${t}</option>`).join('')}</select>
      <button class="go" data-do="del">削除</button>`,
    cmd: () => `<p>命令を 実行します（NAGI.help() で 一覧）。</p>
      <input id="p-c" placeholder="例：NAGI.help()" spellcheck="false">

      <button class="go" data-do="cmd">実行</button>`,
    src: () => `<p>このページの 中身（HTML）です。</p><pre class="src">${source()}</pre>`
  };
  function source() {
    const cms = [...document.body.childNodes].filter(n => n.nodeType === 8).map(n => `<span class="cm">&lt;!--${esc(n.nodeValue)}--&gt;</span>`).join('\n');
    const html = esc($('#page').outerHTML.replace(/\s+$/, ''))
      .replace(/&lt;(\/?)([a-z0-9-]+)/g, '&lt;$1<span class="tg">$2</span>');
    return cms + '\n\n' + html;
  }
  const msg = t => { $('#panel-msg').textContent = t; };
  function panelTab(t) {
    $$('#panel-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    $('#panel-body').innerHTML = panelViews[t]();
  }
  const openPanel = on => { $('#panel').hidden = !on; if (on) panelTab('css'); };
  $('#panel-btn').addEventListener('click', () => openPanel($('#panel').hidden));
  $('#panel-close').addEventListener('click', () => openPanel(false));
  $('#panel-tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) panelTab(b.dataset.t); });
  $('#panel-body').addEventListener('click', e => {
    const b = e.target.closest('[data-do]');
    if (!b) return;
    const pick = sel => document.querySelector(sel);
    try {
      if (b.dataset.do === 'css') {
        let s = $('#u-css'); if (!s) { s = document.createElement('style'); s.id = 'u-css'; document.head.append(s); }
        s.textContent = $('#p-css').value; msg('CSS を 適用しました。');
      }
      if (b.dataset.do === 'set' || b.dataset.do === 'del-attr') {
        const el = pick($('#p-t').value), n = $('#p-n').value.trim();
        if (!el) return msg('その要素は、いま このページに ありません。');
        if (!n) return msg('属性名を 入力してください。');
        if (b.dataset.do === 'set') { el.setAttribute(n, $('#p-v').value); msg(`${$('#p-t').value} の ${n} を 設定しました。`); }
        else { el.removeAttribute(n); msg(`${$('#p-t').value} の ${n} を 削除しました。`); }
      }
      if (b.dataset.do === 'del') {
        const el = pick($('#p-d').value);
        if (!el) return msg('その要素は、いま このページに ありません。');
        el.remove(); msg(`${$('#p-d').value} を 削除しました。`);
      }
      if (b.dataset.do === 'cmd') {
        const m = $('#p-c').value.trim().match(/^NAGI\.(\w+)\s*\(\s*(?:["'“”](.*)["'“”])?\s*\)\s*;?$/);
        if (!m) return msg('NAGI.hear() の ような 形で 入力してください。');
        const fn = window.NAGI && window.NAGI[m[1]];
        if (typeof fn !== 'function') return msg(`NAGI.${m[1]} は ありません。NAGI.help() を お試しください。`);
        msg(String(fn(m[2]) ?? 'OK'));
      }
    } catch (err) { msg('エラー：' + err.message); }
  });

  window.APP = { $, $$, esc, txt, st: () => st, save, render, openPanel, panelMsg: msg, routes };
  addEventListener('DOMContentLoaded', () => {
    $('#page').dataset.tag = 'div.page';
    $('#lab').dataset.tag = 'section.lab';
    render();
  });
})();
