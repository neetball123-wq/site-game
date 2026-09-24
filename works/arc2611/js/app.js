/* ARC-2611 — 記録閲覧端末：保存、索引、文書、黒塗り、監査記録、権限申請、問い合わせ */
(() => {
  'use strict';
  const X = window.ARC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = n => String(n).padStart(2, '0');
  const hms = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const hm = t => hms(t).slice(0, 5);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'arc2611.v1';
  const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const norm = s => toHira(String(s).normalize('NFKC')).replace(/[\s、。，．,.・「」『』!?！？]/g, '').toLowerCase();

  /* ---------- 保存（この端末だけ。記憶処理でも一部は残る） ---------- */
  const rid = () => 'G-' + Array.from({ length: 4 }, () => 'ACDEFHJKLMNPQRTUVWXY34679'[Math.floor(Math.random() * 25)]).join('');
  const fresh = (keep = {}) => ({
    id: keep.id || rid(), started: Date.now(), agreed: false, level: 0, log: [], readOrder: [],
    exposed: false, exposedAt: 0, seenAfter: {}, replyUnlocked: false, replied: false, message: '',
    ending: null, endings: keep.endings || [], ghost: keep.ghost || null, ghostShown: false, helpLv: {}, chat: [], unread: 0
  });
  let state = (() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { ...fresh(s), ...s }; } catch (e) { /* 読めなくても遊べる */ }
    return fresh();
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* noop */ } };

  const doc = id => X.docs.find(d => d.id === id);
  const fill = s => s.replace(/\{ID\}/g, state.id).replace(/\{TIME\}/g, hm(Date.now()));

  // 黒塗り：文字数ぶんの帯。曝露したあとは、ARC-2611 の名前だけ帯が外れる
  const redact = html => html.replace(/<r( k)?>(.*?)<\/r>/g, (m, k, w) => {
    const n = [...w].length;
    if (k && state.exposed) return `<mark class="unred">${w}</mark>`;
    return `<span class="rd" style="--n:${n}" role="img" aria-label="黒塗り（${n}文字）"></span>`;
  });

  /* ---------- 監査記録 ---------- */
  const KIND = { view: '閲覧', deny: '閲覧拒否（権限不足）', level: '権限変更', miss: '権限申請（不一致）', stop: '閲覧を中止', kidoku: '既読', del: '削除を試行（拒否）', prev: '既読（前回）', reply: '返信', forget: '記憶処理' };
  function log(kind, id = '', note = '') {
    state.log.push({ t: Date.now(), kind, doc: id, note });
    if (state.log.length > 400) state.log = state.log.slice(-400);
    save();
    renderAudit();
  }
  function renderAudit() {
    const list = $('#audit');
    list.innerHTML = state.log.map(e => {
      const d = doc(e.doc), code = e.doc === 'reply' ? `ARC-2611-${state.id}` : d ? d.code : '―';
      return `<li class="k-${e.kind}"><time>${hms(e.t)}</time><span>${esc(code)}</span><b>${esc(e.note || KIND[e.kind] || e.kind)}</b></li>`;
    }).join('');
    list.scrollTop = list.scrollHeight;
  }
  $('#audit-del').addEventListener('click', () => {
    log('del');
    const b = $('#audit-del');
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  });

  /* ---------- 状態表示 ---------- */
  function renderBar() {
    $('#who-label').textContent = state.replied ? '送信者' : state.exposed ? '既読者' : '閲覧者';
    $('#who').textContent = state.id;
    $('#lvl').textContent = `LEVEL ${state.level}`;
    document.body.classList.toggle('exposed', state.exposed);
  }
  setInterval(() => {
    const s = Math.floor((Date.now() - state.started) / 1000);
    $('#elapsed').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }, 1000);

  /* ---------- 索引 ---------- */
  const viewed = () => new Set(state.log.filter(e => e.kind === 'view' || e.kind === 'kidoku').map(e => e.doc));
  const CLS = { 無害: 'safe', 要監視: 'watch', 隔離: 'iso', 閲覧禁止: 'ban' };
  function renderIndex(current) {
    const seen = viewed();
    const item = d => {
      const locked = d.level > state.level;
      return `<li><a href="#/doc/${d.id}" class="ix${locked ? ' locked' : ''}${d.id === current ? ' on' : ''}" data-id="${d.id}">`
        + `<span class="ix-code">${d.code}</span><span class="ix-title">${redact(d.title)}</span>`
        + `<span class="ix-tags">${d.cls ? `<i class="cls ${CLS[d.cls]}">${d.cls}</i>` : ''}${locked ? `<i class="lock">LEVEL ${d.level}</i>` : ''}${state.exposed && seen.has(d.id) ? '<i class="kd">既読</i>' : ''}</span></a></li>`;
    };
    const extra = state.replied ? `<li><a href="#/doc/reply" class="ix mine${current === 'reply' ? ' on' : ''}"><span class="ix-code">ARC-2611-${state.id}</span><span class="ix-title">未読</span><span class="ix-tags"><i class="cls ban">閲覧禁止</i></span></a></li>` : '';
    $('#index').innerHTML = ['特異記録', '通達・手順', '職員・事案'].map(g => `<h2>${g}</h2><ul>${g === '特異記録' ? extra : ''}${X.docs.filter(d => d.group === g).sort((a, b) => a.code.localeCompare(b.code)).map(item).join('')}</ul>`).join('');
  }

  /* ---------- 文書 ---------- */
  let currentId = null, prevId = null;
  function fragOf(id) {
    const i = state.readOrder.indexOf(id);
    return i >= 0 && i < X.fragments.length ? X.fragments[i] : '';
  }
  function docHtml(d, opts = {}) {
    const fields = [['記録番号', d.code], ['名称', redact(d.title)], ...(d.cls ? [['等級', d.cls]] : []), ['閲覧権限', `LEVEL ${d.level}`], ...(d.date ? [['発行', d.date]] : []), ...(d.fields || [])];
    const wasRead = state.exposed && state.readOrder.includes(d.id);
    const haunt = state.exposed && d.haunt && !opts.clean ? `<p class="haunt">${esc(fill(d.haunt))}${wasRead && fragOf(d.id) ? `〔${fragOf(d.id)}〕` : ''}</p>` : '';
    let placed = false;
    const sections = (d.body || []).map(([h, ps]) => {
      const paras = ps.map((p, i) => {
        let out = `<p>${redact(p)}</p>`;
        if (!placed && haunt && (h === '概要' || h === '経歴' || h === '手順' || h === '記') && i === 0) { out += haunt; placed = true; }
        return out;
      }).join('');
      return `<section>${h ? `<h3>${h}</h3>` : ''}${paras}</section>`;
    });
    if (haunt && !placed) sections.splice(Math.min(1, sections.length), 0, haunt);
    const table = d.table ? `<section><h3>${d.tableHead || '記録'}</h3><div class="tbl"><table><tbody>${d.table.map(r => `<tr>${r.map(c => `<td>${redact(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : '';
    const stamp = d.cls === '閲覧禁止' ? '<span class="stamp ban">閲覧禁止</span>' : d.level ? `<span class="stamp">LEVEL ${d.level}</span>` : '';
    return `<article class="paper${wasRead ? ' changed' : ''}" id="paper">${stamp}`
      + (wasRead && !opts.clean ? '<p class="diffbar"><b>この文書は、あなたが最後に閲覧した時点から変更されています。</b><button type="button" id="diff-btn">差分を表示</button></p>' : '')
      + `<header class="p-head"><p class="p-org">保全機構　特異記録管理システム</p><h1 class="p-title">${d.code}　${redact(d.title)}</h1>`
      + `<dl class="p-fields">${fields.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></header>`
      + (d.margin ? `<aside class="margin" aria-label="余白の鉛筆の書き込み">${d.margin}</aside>` : '')
      + `<div class="p-body">${table && d.id === 'log1' ? table : ''}${sections.join('')}${table && d.id !== 'log1' ? table : ''}</div>`
      + (d.forget ? '<form class="forget" id="forget"><label for="forget-t">記憶処理　曝露時刻（時:分:秒）</label><div><input id="forget-t" inputmode="numeric" placeholder="00:00:00" autocomplete="off"><button type="submit">記憶処理を実行する</button></div><p id="forget-msg" aria-live="polite"></p></form>' : '')
      + `<footer class="p-foot"><span>閲覧記録　${hms(Date.now())}　に記録されました。この記録は削除できません。</span><button type="button" class="back" id="back">← 前の文書へ戻る</button></footer></article>`;
  }

  function open(id) {
    const pane = $('#doc');
    prevId = currentId;
    currentId = id;
    document.body.dataset.tab = 'doc';
    if (id === 'reply' && state.replied) { A.renderReply(pane); renderIndex(id); return; }
    const d = doc(id);
    if (!d) { location.replace('#/doc/guide'); return; }
    if (d.level > state.level) {
      log('deny', id);
      pane.innerHTML = `<article class="paper denied"><span class="stamp ban">閲覧権限なし</span><header class="p-head"><p class="p-org">保全機構　特異記録管理システム</p><h1 class="p-title">${d.code}</h1></header>`
        + `<div class="p-body"><p>この記録の閲覧には、LEVEL ${d.level} の権限が必要です。現在の権限は LEVEL ${state.level} です。</p><p>閲覧を試みたことは、監査記録に残りました。</p></div></article>`;
      renderIndex(id);
      return;
    }
    if (id === 'arc2611' && !state.exposed) { A.confirmExpose(pane); renderIndex(id); return; }
    log('view', id);
    if (!state.exposed && id !== 'arc2611' && !state.readOrder.includes(id)) { state.readOrder.push(id); save(); }
    pane.innerHTML = docHtml(d);
    pane.scrollTop = 0;
    pane.focus({ preventScroll: true });
    const diff = $('#diff-btn', pane);
    if (diff) diff.addEventListener('click', () => { $('#paper').classList.toggle('diffmode'); diff.textContent = $('#paper').classList.contains('diffmode') ? '差分を隠す' : '差分を表示'; });
    $('#back', pane).addEventListener('click', () => history.back());
    if (d.forget) A.bindForget($('#forget', pane));
    renderIndex(id);
    if (A.afterOpen) A.afterOpen(d, prevId);
  }

  /* ---------- 権限申請 ---------- */
  const req = $('#req');
  $('#req-btn').addEventListener('click', () => {
    req.hidden = !req.hidden;
    $('#req-btn').setAttribute('aria-expanded', String(!req.hidden));
    if (!req.hidden) $('#req-code').focus();
  });
  req.addEventListener('submit', e => {
    e.preventDefault();
    const v = norm($('#req-code').value), msg = $('#req-msg');
    const alt = { 1: ['こしょうちゅうです'], 2: [], 3: ['きどく', 'kidoku'] };
    const lv = [1, 2, 3].find(n => v && (v === norm(X.codes[n]) || alt[n].includes(v)));
    if (!lv) { log('miss'); msg.textContent = '認証コードが一致しません。申請は記録されました。'; return; }
    if (lv <= state.level) { msg.textContent = `すでに LEVEL ${state.level} の権限があります。`; return; }
    state.level = lv;
    save();
    log('level', '', `LEVEL ${lv} を付与`);
    msg.textContent = lv === 3 ? 'LEVEL 3 の権限が付与されました。……名前を、知ってしまいましたね。' : `LEVEL ${lv} の権限が付与されました。`;
    $('#req-code').value = '';
    renderBar();
    renderIndex(currentId);
  });

  /* ---------- 監査課への問い合わせ ---------- */
  function helpStage() { return state.replied ? 'reply' : state.exposed ? 'exposed' : String(state.level); }
  /* 考えている時間（問い合わせの回答は、時間がたつと一段ずつ返ってくる）
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  const fmtLeft = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return s >= 60 ? Math.ceil(s / 60) + '分' : s + '秒'; };
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !state.agreed || state.replied) return;
    const k = helpStage();
    state.clock = state.clock || {}; state.clock[k] = (state.clock[k] || 0) + 5000;
    state.playMs = (state.playMs || 0) + 5000;
    save();
  }, 5000);
  $('#help-form').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#help-q').value.trim();
    if (!q) return;
    $('#help-q').value = '';
    const st = helpStage(), list = X.help[st], lv = state.helpLv[st] || 0;
    const left = list.length > 1 && lv < list.length ? Math.max(0, HINT_AT[Math.min(lv, 2)] - ((state.clock || {})[st] || 0)) : 0;
    if (!left) state.helpLv[st] = lv + 1;
    save();
    const box = $('#help-log');
    box.insertAdjacentHTML('beforeend', `<li class="me">${esc(q)}</li>`);
    setTimeout(() => {
      const who = state.exposed ? '？？？' : '監査課';
      const body = left
        ? (state.exposed ? `まだ だめ。もうすこし じぶんで さがして。（あと ${fmtLeft(left)}）` : `現在、確認中です。閲覧を続けてください。回答まで、およそ ${fmtLeft(left)}。`)
        : `${esc(list[Math.min(lv, list.length - 1)])}${list.length > 1 ? `<small>（${Math.min(lv + 1, list.length)}／${list.length}）</small>` : ''}`;
      box.insertAdjacentHTML('beforeend', `<li class="them"><b>${who}</b>${body}</li>`);
      box.scrollTop = box.scrollHeight;
    }, reduced ? 50 : 1100);
    box.scrollTop = box.scrollHeight;
  });

  /* ---------- 画面の切り替え ---------- */
  $$('.tabs button').forEach(b => b.addEventListener('click', () => { document.body.dataset.tab = b.dataset.tab; }));
  /* 画面の切りかえ演出（View Transitions）。画面が見えていないときや、途中で次の切りかえが来たときは
     失敗の知らせ（Promise の reject）が来るので、握りつぶして中身だけは必ず切りかえる */
  const viewTransit = (fn) => {
    if (!document.startViewTransition || document.hidden) { fn(); return; }
    try {
      const t = document.startViewTransition(fn);
      [t.ready, t.finished, t.updateCallbackDone].forEach(p => p && p.catch(() => {}));
    } catch (e) { fn(); }
  };
  function route() {
    if (!state.agreed) { A.showGate(); return; }
    $('#gate').hidden = true;
    $('#app').hidden = false;
    const m = location.hash.match(/^#\/doc\/([\w-]+)/);
    const id = m ? m[1] : 'guide';
    const go = () => open(id);
    if (!reduced && currentId) viewTransit(go); else go();
  }
  addEventListener('hashchange', route);

  window.A = {
    X, $, $$, esc, hms, hm, norm, reduced, KEY, fresh, save, log, doc, fill, redact, docHtml,
    renderAudit, renderBar, renderIndex, route, open,
    get state() { return state; }, set state(v) { state = v; },
    get currentId() { return currentId; }
  };
})();
