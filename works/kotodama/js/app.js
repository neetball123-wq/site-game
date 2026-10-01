/* ことだま短冊 — 画面
   懐紙に短冊と助詞を並べ、詠み、物の怪を祓う。店・道具・帖・タイトル。 */
(() => {
  'use strict';
  const KD = window.KD, R = KD.Run, SND = window.SND;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'kotodama.v1';
  const POSN = { n: '名', num: '数', v: '動', a: '形', na: '形', adv: '副', rt: '連', cj: '接', it: '感', oto: '音' };
  const POSFULL = { n: '名詞', num: '数', v: '動詞', a: '形容詞', na: '形容動詞', adv: '副詞', rt: '連体詞', cj: '接続詞', it: '感動詞', oto: 'ただの音（意味はないが、音の数と韻には数える）' };
  const OPNAME = {
    atk: '祓う', grow: '育てる ─「を」の言葉（なければ「が」）の力が、ずっと増える', copy: '増やす ─「を」の言葉が、束に一枚増える', call: '呼ぶ ─ 手札を引く',
    heal: '休める ─ 言葉のかすれが戻る', gain: '稼ぐ ─ 銭が入る', sell: '売る ─「を」の言葉を束から消して、力の2倍の銭', del: '消す ─「を」の言葉が束から消える',
    dye: '染める ─「で」「に」の言葉や、かかる形容詞の性質を「を」の言葉に足す', guard: '守る ─ 使った短冊が手札に戻る', seal: '封じる ─ 物の怪の技を止める', bless: '祈る ─ 次の一句が強くなる',
  };
  const TIER = ['小物', '中物', '大物'];
  const ELC = (t) => (KD.ELEM.includes(t) ? `var(--e-${t})` : null);

  /* ---------- 保存 ---------- */
  const enc = (o) => JSON.stringify(o, (k, v) => (v === -Infinity ? '-inf' : v));
  const dec = (s) => JSON.parse(s, (k, v) => (v === '-inf' ? -Infinity : v));
  const fresh = () => ({ meta: { clears: 0, runs: 0, best: null, maxLg: -Infinity, far: 0, book: { waza: {}, say: {}, foe: {} }, sound: true }, run: null, playMs: 0 });
  let S = (() => { try { const s = dec(localStorage.getItem(KEY) || 'null'); if (s && s.meta) return s; } catch (e) { /* 読めなくても遊べる */ } return fresh(); })();
  S.meta.book = Object.assign({ waza: {}, say: {}, foe: {} }, S.meta.book || {});
  const save = () => { try { S.run = run; localStorage.setItem(KEY, enc(S)); } catch (e) { /* noop */ } };
  let run = S.run;
  SND.on = S.meta.sound !== false;
  setInterval(() => { if (!document.hidden) { S.playMs = (S.playMs || 0) + 5000; save(); } }, 5000);

  /* ---------- 組み立て中の文 ---------- */
  let sen = [], cur = -1, mode = null, marks = [], busy = false, fast = false;
  const inSen = (u) => sen.some((x) => x.u === u);
  const W = (u) => R.wordOf(run, R.card(run, u));

  /* ---------- 短冊 ---------- */
  function cardEl(u, opt = {}) {
    const c = R.card(run, u), w = R.wordOf(run, c);
    const b = document.createElement('button');
    b.type = 'button';
    const len = [...w.s].length;
    const worn = KD.fade(run.wear[w.id]);
    b.className = `tz ${w.pos === 'v' ? 'v' : ''} ${w.pos === 'oto' ? 'oto' : ''} ${w.coined ? 'coined' : ''} ${worn < 1 ? 'worn' : ''} ${opt.sm ? 'sm' : ''} ${run.fight && run.phase === 'fight' && R.isEaten(run, u) ? 'eaten' : ''}`;
    b.dataset.u = u;
    const els = w.tags.filter((t) => KD.ELEM.includes(t)).slice(0, 4);
    b.innerHTML = `<i class="tz-pos">${POSN[w.pos] || ''}</i><span class="tz-dots">${els.map((t) => `<b style="--c:${ELC(t)}"></b>`).join('')}</span>`
      + `<span class="tz-w ${len >= 8 ? 's8' : len >= 6 ? 's6' : len >= 5 ? 's5' : ''}" style="opacity:${Math.max(0.32, worn).toFixed(2)}">${esc(w.s)}</span><b class="tz-pow">${Math.round(w.pow * 10) / 10}</b>`;
    b.setAttribute('aria-label', `${w.s}（${POSFULL[w.pos] || ''}・力${w.pow}）`);
    longPress(b, () => showInfo(u));
    return b;
  }
  // 長押し（右クリック）で言葉をしらべる
  let lpFired = false;
  function longPress(el, fn) {
    let tm = null;
    el.addEventListener('pointerdown', () => { lpFired = false; tm = setTimeout(() => { lpFired = true; fn(); }, 460); });
    const stop = () => clearTimeout(tm);
    el.addEventListener('pointerup', stop); el.addEventListener('pointerleave', stop); el.addEventListener('pointercancel', stop);
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); stop(); lpFired = true; fn(); });
  }
  function showInfo(u) {
    const w = W(u), b = R.base(run, w.id);
    const tags = w.tags.map((t) => `<span class="chip ${ELC(t) ? 'e' : ''}" style="${ELC(t) ? `--c:${ELC(t)}` : ''}">${esc(t)}</span>`).join('');
    const wear = run.wear[w.id] || 0, f = KD.fade(wear);
    let more = '';
    if (w.pos === 'v') {
      more += `<p><span class="k">働き</span>${esc(OPNAME[w.op] || '祓う')}</p>`;
      if (w.vi) more += `<p><span class="k">「を」</span>とらない${w.mo ? '（道や空は「を」でとれる）' : ''}</p>`;
      else if (w.o) more += `<p><span class="k">「を」にとれる</span>${w.o.join('・')} の性質のもの（形のないものは、たとえとして）</p>`;
      if (w.sb === 'anim') more += '<p><span class="k">「が」</span>生き物がふつう。ほかなら擬人法</p>';
      else if (Array.isArray(w.sb)) more += `<p><span class="k">「が」にとれる</span>${w.sb.join('・')}</p>`;
    }
    if (w.m) more += `<p><span class="k">かかると</span>名詞の力×${w.m}</p>`;
    if (w.am === 'rep') more += '<p><span class="k">かかると</span>動詞の働きをくり返す</p>';
    if (w.am === 'amp') more += '<p><span class="k">かかると</span>動詞の力×1.5</p>';
    if (w.coined) more += '<p><span class="k">造語</span>のりでつないだ、新しい言葉</p>';
    const grown = b && w.pow !== b.pow ? `（もとは ${b.pow}）` : '';
    pop(`<h4>${esc(w.s)}<small>${esc(w.y)}・${esc(POSFULL[w.pos] || '')}</small></h4><p><span class="k">力</span>${w.pow}${grown}　<span class="k">使った回数</span>${wear}${f < 1 ? `（かすれ ${Math.round(f * 100)}%）` : ''}</p>${tags ? `<p class="chips">${tags}</p>` : ''}${more}`);
  }
  let popT = null;
  function pop(html, ms = 0) {
    const p = $('#pop'); p.innerHTML = html; p.hidden = false;
    clearTimeout(popT); if (ms) popT = setTimeout(() => { p.hidden = true; }, ms);
  }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#pop') && !$('#pop').hidden && !lpFired) setTimeout(() => { if (!lpFired) $('#pop').hidden = true; }, 0); }, true);

  /* ---------- 描画 ---------- */
  const enemy = () => R.enemyOf(run);
  function renderBar() {
    const app = $('#app');
    app.dataset.season = run.ch % 4;
    $('#b-season').textContent = KD.SEASON_NAME[run.ch % 4] + (run.ch >= 4 ? `・${Math.floor(run.ch / 4) + 1}巡` : '');
    $('#b-fight').textContent = TIER[run.tier] + (run.mode === 'random' ? '　気まぐれ' : '');
    $('#b-zeni').textContent = run.zeni;
    $('#b-relic-n').textContent = run.relics.length;
  }
  function renderFoe(preLg) {
    const e = enemy(), f = run.fight;
    const art = $('#foe-art');
    if (art.dataset.id !== e.id) { art.innerHTML = KD.artOf(e.id); art.dataset.id = e.id; art.className = 'foe-art'; }
    $('#foe-name').textContent = e.name;
    const wk = (f.weak || (Array.isArray(e.weak) ? e.weak : []));
    const tagB = (t) => `<b style="background:${ELC(t) || '#6b6455'}">${esc(t)}</b>`;
    $('#foe-weak').innerHTML = `苦手 ${wk.map(tagB).join('') || 'なし'}${e.resist && e.resist.length ? `　得意 ${e.resist.map(tagB).join('')}` : ''}`;
    const tr = $('#foe-trick');
    if (e.trick) { tr.hidden = false; tr.textContent = (f.sealed ? '封じた：' : '') + e.trick.text; tr.classList.toggle('sealed', !!f.sealed); } else tr.hidden = true;
    const pct = (lgv) => (lgv === -Infinity ? 0 : Math.min(100, Math.pow(10, lgv - f.target) * 100));
    $('#g-fill').style.width = pct(f.got) + '%';
    $('#g-ghost').style.width = (preLg !== undefined && preLg !== -Infinity ? pct(KD.lgAdd(f.got, preLg)) : 0) + '%';
    $('#g-got').textContent = KD.fmt(f.got);
    $('#g-target').textContent = KD.fmt(f.target);
    $('#l-plays').textContent = f.plays;
    $('#l-disc').textContent = f.discards;
  }
  let lastPre = null;
  function renderComp() {
    sen = sen.filter((x) => x.p || (run.hand.includes(x.u)));
    if (cur >= sen.length) cur = sen.length - 1;
    const pre = sen.length ? R.preview(run, sen) : null;
    lastPre = pre;
    renderPaper(pre);
    renderJudge(pre);
    renderHand();
    renderPalette();
    renderActs(pre);
    renderFoe(pre && pre.an.ok ? pre.res.lg : undefined);
    fitCols();
  }
  // 一句が一列に収まるように、長い句は字を小さくする（ほかの欄を描いたあとの紙の高さで）
  function fitCols() {
    const P = $('#paper'), H = P.clientHeight - 34;
    $$('.col:not(.flow)', P).forEach((c) => {
      const tks = [...c.querySelectorAll('.tk')];
      const ch = tks.reduce((a, e) => a + Math.max(1, [...e.textContent].length) * (e.classList.contains('p') ? 0.75 : 1), 0);
      const fs = Math.max(11, Math.min(c.classList.contains('empty') ? 26 : 30, Math.floor((H - tks.length * 4) / (Math.max(1, ch) * 1.1))));
      c.style.fontSize = fs + 'px';
    });
  }
  addEventListener('resize', () => { if (run && run.phase === 'fight') fitCols(); });
  function renderPaper(pre) {
    const P = $('#paper');
    if (!sen.length) { P.innerHTML = `<p class="paper-hint">${run.stats.plays ? '短冊をえらんで、文をつくる' : '下の短冊をえらぶと、ここに書かれる'}</p>`; $('#cursor-bar').hidden = true; return; }
    const an = pre.an, form = KD.form(an);
    const span = (t) => {
      const cls = ['tk'];
      if (t.k !== 'w') cls.push('p');
      if (t.cat === 'OTO') cls.push('oto');
      if (t.cat === 'BR') cls.push('br');
      if (t.i === cur) cls.push('sel');
      if (t.bad) cls.push('bad');
      if (t.k === 'w' && pre.res && pre.res.cards[t.i] && pre.res.cards[t.i].notes.includes('苦手')) cls.push('weak');
      return `<span class="${cls.join(' ')}" data-i="${t.i}">${t.cat === 'BR' ? '↵' : esc(t.s)}</span>`;
    };
    // 句（列）に分ける：改行があればその行、なければ型の区切り
    let cols = null;
    if (an.lines) { cols = [[]]; for (const t of an.T) { cols[cols.length - 1].push(t); if (t.cat === 'BR') cols.push([]); } }
    else if (form) cols = form.lines.map(([a, b]) => an.T.slice(a, b + 1));
    let html = '';
    if (cols) {
      let k = 0;
      html = cols.map((ts) => {
        const real = ts.some((t) => t.cat !== 'BR');
        const m = ts.reduce((x, t) => x + t.m, 0), want = real && form && form.pat ? form.pat[k] : null;
        if (real) k++;
        const n = `<span class="col-n ${want && m !== want ? 'off' : ''}">${m}${want && m !== want ? `／${want}` : ''}</span>`;
        return `<div class="col ${real ? '' : 'empty'}">${ts.map(span).join('')}${n}</div>`;
      }).join('');
    } else html = `<div class="col flow">${an.T.map(span).join('')}<span class="col-n">${an.mora}</span></div>`;
    P.innerHTML = html;
    $('#cursor-bar').hidden = cur < 0;
    if (P.scrollWidth > P.clientWidth) P.scrollLeft = -P.scrollWidth;
  }
  const FORMNAME = KD.FORMNAME;
  // 音の数の見出し（句ごと）と、型へのひとこと
  function moraLine(an) {
    const f = KD.form(an);
    const counts = an.lines ? an.lines.map((l) => l.m) : f ? f.counts : null;
    let m = counts ? `${counts.join('・')}音` : `${an.mora}音`;
    if (f) m += `　<b>${FORMNAME[f.id]}${f.over ? (f.short ? '（字足らず）' : '（字余り）') : ''}</b>`;
    else if (an.lines) { const near = { 3: '俳句は 五・七・五', 4: '都々逸は 七・七・七・五', 5: '短歌は 五・七・五・七・七' }[an.lines.length]; if (near) m += `　<small>（${near}）</small>`; }
    else if (an.mora >= 13 && an.mora <= 21) m += '　<small>（「改行」で句を区切ると、五・七・五をねらいやすい）</small>';
    return m;
  }
  const TIPS = [
    '下の短冊をえらぶと、紙に書かれる。助詞の札（が・を・に…）は何度でも使える。',
    '意味が通らない文は詠めない。赤い波線の理由を見て、並べかえる。紙の言葉をえらぶと、前後に動かせる。',
    '紙の左下の「改行」で句を区切れる。句ごとの音の数が出るので、五・七・五（俳句×3倍）に合わせやすい。少しずれても字余りで半分。',
    '句に区切ると「うた」として読む。句の終わりで言いさしたり（〜ように）、句を名詞で切って景色を並べたりしても通り、余韻・取り合わせの技になる。',
    '短冊を長押しすると、言葉をしらべられる。物の怪の「苦手」の性質を入れると、その言葉の力×2。',
    '同じ言葉を使いすぎると、かすれて弱くなる。新しい言葉を店で仕入れよう。',
  ];
  function renderJudge(pre) {
    const msg = $('#j-msg'), wz = $('#j-waza'), calc = $('#j-calc');
    msg.className = 'j-msg';
    if (mode) { msg.innerHTML = modeText(); wz.innerHTML = ''; calc.innerHTML = ''; return; }
    if (!pre) { msg.textContent = TIPS[Math.min(run.stats.plays, TIPS.length - 1)] ; wz.innerHTML = ''; calc.innerHTML = ''; return; }
    const an = pre.an;
    if (!an.ok) {
      msg.className = 'j-msg bad';
      msg.textContent = an.errs[0] ? an.errs[0].msg : '';
      wz.innerHTML = ''; calc.innerHTML = `<small>${moraLine(an)}</small>`;
      return;
    }
    msg.innerHTML = moraLine(an);
    wz.innerHTML = pre.res.steps.filter((s) => s.k !== 'card').map(chip).join('');
    const r = pre.res;
    calc.innerHTML = r.zero ? `<span class="t">0</span><small>${esc(r.zero)}</small>` : `<small>力</small><span class="c">${r.chips}</span><small>×</small><span class="m">${fmtMul(r)}</span><small>＝</small><span class="t">${KD.fmt(r.lg)}</span>`;
  }
  const fmtMul = (r) => { const a = 1 + r.add, m = r.mul; const v = a * m; return v >= 10000 ? KD.fmt(KD.lg(v)) : Math.round(v * 10) / 10; };
  const chip = (s) => {
    if (s.k === 'trick') return `<span class="wz neg">${esc(s.text)}</span>`;
    const v = s.add !== undefined ? `<b>＋${s.add}</b>` : `<b>×${s.mul}</b>`;
    return `<span class="wz ${s.add !== undefined ? 'add' : 'mul'} ${(s.mul !== undefined && s.mul < 1) || s.add === 0 ? 'neg' : ''}">${esc(s.name)} ${v}</span>`;
  };
  function renderHand() {
    const H = $('#hand'); H.innerHTML = '';
    const us = run.hand.filter((u) => !inSen(u));
    for (const u of us) {
      const el = cardEl(u);
      if (marks.includes(u)) el.classList.add(mode === 'disc' ? 'mark' : 'pick');
      el.addEventListener('click', () => onCard(u));
      H.appendChild(el);
    }
    if (!us.length) H.innerHTML = `<p class="hand-empty">${run.hand.length ? '手札は、ぜんぶ紙の上' : '手札がない'}</p>`;
  }
  // 札の説明（長押し）
  const TILE_HELP = {
    'が': '「〜が」だれが・何が', 'は': '「〜は」話のテーマ', 'を': '「〜を」何を（動詞が受ける）', 'に': '「〜に」どこに・何に・何になる', 'で': '「〜で」何で・どこで', 'と': '「〜と」いっしょに・並べる',
    'の': '「〜の」持ち主・ようす。「雪の降る夜」の「の」、「咲くのを待つ」の「の」にも', 'も': '「〜も」', 'へ': '「〜へ」行き先', 'や': '「〜や」並べる。うたでは切れ字（古池や）', 'から': '「〜から」', 'まで': '「〜まで」', 'より': '「〜より」くらべる', 'だけ': '「〜だけ」',
    '、': '読点。文をいったん区切る（音には数えない）', 'て': '「〜て」つなぐ（咲いて・白くて）', 'た': '「〜た」過ぎたこと（咲いた）', 'ない': '「〜ない」打ち消し。「雪がない」のようにも使える', 'たい': '「〜たい」（会いたい）',
    'う': '「〜う／よう」さそい・つもり（行こう・見よう）', '命令': '命令の形にする（咲け・来い）', 'ば': '「〜ば」（降れば）', 'たら': '「〜たら」（咲いたら）', 'ながら': '「〜ながら」（歌いながら）', 'ので': '「〜ので」わけ', 'けど': '「〜けど」',
    'だ': '「〜だ」言い切る（雪は花だ）', 'だろう': '「〜だろう」', 'ように': '「〜のように」たとえる（直喩）', 'いる': '自由に使える動詞（咲いている・猫がいる）。力は0', 'ある': '自由に使える動詞（花がある）。力は0', 'する': '自由に使える動詞（音がする）。力は0', 'なる': '自由に使える動詞（雨になる・白くなる）。力は0',
    'けり': '「〜けり」切れ字（咲きけり）', 'よ': '文の終わり・呼びかけ（雪よ）', 'ね': '文の終わり', 'か': '問いかけ。答えを探して一枚引く', 'ぞ': '文の終わり', 'かな': '切れ字（〜かな）',
  };
  function renderPalette() {
    const P = $('#palette');
    const e = enemy(), ban = e.trick && e.trick.id === 'ban_p' && !run.fight.sealed ? e.trick.p : [];
    if (P.dataset.ban === ban.join() && P.childElementCount) return;
    P.dataset.ban = ban.join();
    const cls = (p) => { const c = (KD.TILES[p] || {}).c; return c === 'end' ? 'end' : c === 'fv' ? 'fv' : c === 'soft' ? 'soft' : c === 'case' ? '' : 'aux'; };
    P.innerHTML = KD.PALETTE.map((g) => `<div class="pal-row">${g.map((p) => `<button type="button" class="pt ${cls(p)} ${ban.includes(p) ? 'banned' : ''}" data-p="${p}">${p}</button>`).join('')}</div>`).join('');
    $$('.pt', P).forEach((b) => longPress(b, () => pop(`<h4>${esc(b.dataset.p)}<small>何度でも使える札</small></h4><p>${esc(TILE_HELP[b.dataset.p] || '')}</p>`, 3200)));
  }
  function renderActs(pre) {
    const f = run.fight;
    const d = $('#a-disc'), p = $('#a-play'), t = $('#a-tool'), c = $('#a-clear');
    if (mode) {
      d.innerHTML = 'やめる'; d.classList.add('on'); t.disabled = true; c.disabled = true;
      if (mode === 'disc') { p.innerHTML = `書き直す<small>${marks.length}枚</small>`; p.disabled = !marks.length || busy; }
      else { p.innerHTML = '──'; p.disabled = true; }
      return;
    }
    d.classList.remove('on'); t.disabled = busy; c.disabled = busy || !sen.length;
    d.innerHTML = `書き直し<small>のこり${f.discards}</small>`; d.disabled = busy || f.discards <= 0;
    p.innerHTML = '詠む';
    p.disabled = busy || !pre || !pre.an.ok || f.plays <= 0;
  }
  function renderAll() { if (!run) return; renderBar(); renderComp(); }

  /* ---------- 操作 ---------- */
  function insert(x) {
    if (cur >= 0) { sen.splice(cur + 1, 0, x); cur++; } else sen.push(x);
  }
  function onCard(u) {
    if (lpFired) { lpFired = false; return; }
    if (busy || run.phase !== 'fight') return;
    if (R.isEaten(run, u)) { toast('喰われた言葉は、使えない'); SND.play('bad'); return; }
    if (mode === 'disc') { marks = marks.includes(u) ? marks.filter((x) => x !== u) : [...marks, u]; SND.play('tap'); renderComp(); return; }
    if (mode && mode.tool) return toolPick(u);
    insert({ u }); SND.play('pick', { k: sen.length });
    renderComp();
  }
  $('#palette').addEventListener('click', (e) => {
    const b = e.target.closest('.pt'); if (!b || busy || mode) return;
    if (lpFired) { lpFired = false; return; }
    if (b.classList.contains('banned')) { toast(`「${b.dataset.p}」は、いまは使えない`); SND.play('bad'); return; }
    insert({ p: b.dataset.p }); SND.play('put'); renderComp();
  });
  $('#paper').addEventListener('click', (e) => {
    const t = e.target.closest('.tk'); if (!t || busy || mode) return;
    const i = +t.dataset.i;
    cur = cur === i ? -1 : i; SND.play('tap'); renderComp();
  });
  $('#cur-up').addEventListener('click', () => { if (cur > 0) { [sen[cur - 1], sen[cur]] = [sen[cur], sen[cur - 1]]; cur--; SND.play('tap'); renderComp(); } });
  $('#cur-down').addEventListener('click', () => { if (cur >= 0 && cur < sen.length - 1) { [sen[cur + 1], sen[cur]] = [sen[cur], sen[cur + 1]]; cur++; SND.play('tap'); renderComp(); } });
  $('#cur-del').addEventListener('click', () => { if (cur >= 0) { sen.splice(cur, 1); cur = Math.min(cur, sen.length - 1); if (!sen.length) cur = -1; SND.play('back'); renderComp(); } });
  $('#cur-off').addEventListener('click', () => { cur = -1; renderComp(); });
  // 改行：句を区切る（音には数えない）
  const addBreak = () => { if (busy || mode || !sen.length) return; insert({ p: '↵' }); SND.play('paper'); renderComp(); };
  $('#a-br').addEventListener('click', addBreak);
  $('#a-clear').addEventListener('click', () => { if (busy) return; sen = []; cur = -1; SND.play('paper'); renderComp(); });
  $('#a-disc').addEventListener('click', () => {
    if (busy) return;
    if (mode) { mode = null; marks = []; renderComp(); return; }
    if (run.fight.discards <= 0) return;
    mode = 'disc'; marks = []; sen = []; cur = -1; renderComp();
  });
  $('#a-play').addEventListener('click', () => {
    if (busy) return;
    if (mode === 'disc') { if (R.discard(run, marks)) { SND.play('paper'); toast(`${marks.length}枚を書き直した`); } mode = null; marks = []; save(); renderComp(); return; }
    doPlay();
  });
  $('#a-tool').addEventListener('click', () => { if (!busy) openTools(); });
  $('#b-relic').addEventListener('click', openRelics);
  $('#b-book').addEventListener('click', () => openBook());
  $('#b-menu').addEventListener('click', openMenu);
  document.addEventListener('pointerdown', () => SND.unlock(), { once: true });
  $('#app').addEventListener('pointerdown', () => { if (busy) fast = true; });
  addEventListener('keydown', (e) => {
    if (!$('#ov').hidden || !run || run.phase !== 'fight' || busy) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!$('#a-play').disabled) doPlay(); return; }
    if (e.key === 'Enter') { e.preventDefault(); addBreak(); }
    if (e.key === 'Backspace' && sen.length) { e.preventDefault(); if (cur >= 0) { sen.splice(cur, 1); cur = Math.min(cur, sen.length - 1); } else sen.pop(); renderComp(); }
  });

  let toastN = 0;
  function toast(html, cls = '') {
    const box = $('#toasts');
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = html;
    box.appendChild(t); toastN++;
    setTimeout(() => t.remove(), 3200);
    while (box.children.length > 4) box.firstChild.remove();
  }

  /* ---------- 詠む（演出） ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, fast || reduced ? Math.min(ms, 25) : ms));
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  function popNum(x, y, txt, m) { const d = document.createElement('div'); d.className = 'pop-num' + (m ? ' m' : ''); d.style.left = x + 'px'; d.style.top = y + 'px'; d.textContent = txt; $('#fx').appendChild(d); setTimeout(() => d.remove(), 1100); }
  function sealAt(x, y, name, val) { const d = document.createElement('div'); d.className = 'seal'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerHTML = `${esc(name)}<small>${esc(val)}</small>`; $('#fx').appendChild(d); setTimeout(() => d.remove(), 950); }
  async function doPlay() {
    if (busy || !sen.length) return;
    const pre = R.preview(run, sen);
    if (!pre.an.ok) { SND.play('bad'); return; }
    busy = true; fast = false; cur = -1;
    const keep = sen.slice();
    const out = R.play(run, keep);
    renderPaper({ an: out.an, res: out.res });
    renderActs(null);
    const P = $('#paper'), an = out.an, res = out.res;
    const tok = (i) => P.querySelector(`.tk[data-i="${i}"]`);
    // 1. 読み上げ（拍ごとに琴、句の切れ目で拍子木）
    const form = KD.form(an);
    const ends = an.lines ? an.lines.map((l) => l.to) : form ? form.lines.map((l) => l[1]) : [];
    let chips = 0, k = 0;
    const calc = $('#j-calc');
    $('#j-waza').innerHTML = '';
    SND.play('clack');
    await wait(260);
    for (const t of an.T) {
      const el = tok(t.i);
      if (el) el.classList.add('lit');
      for (let m = 0; m < t.m; m++) SND.play('mora', { k: (k++ % 7) + (t.k === 'p' ? 0 : 2), at: m * 0.075 });
      const c = res.cards[t.i];
      if (c && el) { const p = rectOf(el); popNum(p.x + 24, p.y, `+${c.v}${c.notes.length ? ' ' + c.notes.slice(0, 2).join('・') : ''}`); chips += c.v; calc.innerHTML = `<small>力</small><span class="c">${Math.round(chips * 10) / 10}</span>`; }
      await wait(Math.max(110, 75 * t.m));
      if (ends.includes(t.i)) { SND.play('clack'); await wait(200); }
    }
    // 2. 技（判子）
    const pr = P.getBoundingClientRect();
    let add = 0, mul = 1;
    for (const s of res.steps.filter((x) => x.k !== 'card')) {
      for (const i of s.hl || []) { const el = tok(i); if (el) el.classList.add('hl'); }
      const x = pr.left + pr.width * (0.3 + Math.random() * 0.4), y = pr.top + pr.height * (0.3 + Math.random() * 0.4);
      const val = s.k === 'trick' ? s.text : s.add !== undefined ? `＋${s.add}倍` : `×${s.mul}倍`;
      sealAt(x, y, s.name || '', val);
      SND.play(s.k === 'trick' ? 'bad' : 'seal');
      if (s.add !== undefined) add += s.add; if (s.mul !== undefined) mul *= s.mul;
      calc.innerHTML = `<small>力</small><span class="c">${res.chips}</span><small>×</small><span class="m">${Math.round((1 + add) * mul * 10) / 10}</span>`;
      $('#j-waza').insertAdjacentHTML('beforeend', chip(s));
      await wait(380);
      for (const i of s.hl || []) { const el = tok(i); if (el) el.classList.remove('hl'); }
    }
    // 3. 点
    calc.innerHTML = `<small>力</small><span class="c">${res.chips}</span><small>×</small><span class="m">${fmtMul(res)}</span><small>＝</small><span class="t">${KD.fmt(res.lg)}</span>`;
    const big = document.createElement('div'); big.className = 'big-score';
    big.innerHTML = `<b>${KD.fmt(res.lg)}</b><span>${res.zero ? esc(res.zero) : '祓い'}</span>`;
    $('#fx').appendChild(big); setTimeout(() => big.remove(), 1700);
    const ap = rectOf($('#foe-art'));
    const sp = document.createElement('div'); sp.className = 'ink-splash'; sp.style.left = ap.x + 'px'; sp.style.top = ap.y + 'px'; $('#fx').appendChild(sp); setTimeout(() => sp.remove(), 950);
    SND.play('taiko');
    const art = $('#foe-art'); art.classList.remove('hit'); void art.offsetWidth; if (res.lg > -Infinity) art.classList.add('hit');
    renderFoe();
    await wait(900);
    // 4. 働きと発見
    for (const l of out.log.list) toast(esc(l));
    if (out.log.fell) toast('手札が一枚、散った');
    if (out.log.ate) toast(`言霊喰いが「<b>${esc(R.base(run, out.log.ate).s)}</b>」を喰った`);
    book(res, out);
    sen = []; cur = -1; busy = false; fast = false;
    save();
    renderAll();
    if (out.won) {
      S.meta.book.foe[run.fight.eid] = 1;
      art.classList.add('gone'); SND.play('gone'); setTimeout(() => SND.play('win'), 500);
      await wait(1300);
      far();
      openCash();
    } else if (out.lost) {
      SND.play('lose');
      await wait(700);
      gameOver();
    }
  }
  // 帖への記録
  function book(res, out) {
    const B = S.meta.book;
    for (const f of res.found) {
      if (f.t === 'waza') {
        const wz = KD.wazaById(f.id);
        if (wz && !B.waza[f.id]) { B.waza[f.id] = 1; if (wz.hide || run.stats.plays > 1) toast(`${wz.hide ? '隠れた技' : '技'}「<b>${esc(wz.name)}</b>」を見つけた`, 'gold'); SND.play('found'); }
        if (f.key && !B.say[f.key]) { B.say[f.key] = 1; const k = KD.SAYINGS.find((x) => x.id === f.key); toast(`${esc(k.kind)}「<b>${esc(k.text)}</b>」を詠んだ`, 'gold'); }
      }
      if (f.t === 'pair' && out.newly.some((n) => n.t === 'pair' && n.id === f.id)) toast(`相性を見つけた：<b>${esc(f.id.slice(0, 1))}×${esc(f.id.slice(1))}</b>`, 'gold');
    }
    if (res.lg > (S.meta.maxLg === undefined ? -Infinity : S.meta.maxLg)) { S.meta.maxLg = res.lg; S.meta.best = { lg: res.lg, lines: run.best ? run.best.lines : [] }; }
  }
  const far = () => { const k = run.ch * 3 + run.tier + 1; if (k > (S.meta.far || 0)) S.meta.far = k; };

  /* ---------- 重ねる画面 ---------- */
  function sheet(html, opt = {}) {
    const ov = $('#ov'), inn = $('#ov-in');
    inn.innerHTML = `<div class="sheet">${opt.close === false ? '' : '<button type="button" class="x" data-x aria-label="とじる">×</button>'}${html}</div>`;
    ov.hidden = false;
    inn.querySelector('[data-x]') && inn.querySelector('[data-x]').addEventListener('click', () => { closeSheet(); opt.onClose && opt.onClose(); });
    ov.onclick = (e) => { if (e.target === ov && opt.close !== false) { closeSheet(); opt.onClose && opt.onClose(); } };
    return inn;
  }
  const closeSheet = () => { $('#ov').hidden = true; $('#ov-in').innerHTML = ''; };
  const zeniI = '<i>銭</i>';

  // 祓いの礼（銭）
  function openCash() {
    const r = run.reward, e = enemy();
    const inn = sheet(`<h2>${esc(e.name)}を祓った</h2><p class="lead">${esc(e.lore || '')}</p>
      <ul class="rows">${r.rows.map(([a, b]) => `<li><span>${esc(a)}</span><b>${b}銭</b></li>`).join('')}<li class="sum"><span>合計</span><b>${r.total}銭</b></li></ul>
      ${run.tier === 2 ? '<p class="lead">季節がめぐる。使いこんだ言葉のかすれが、半分もどる。</p>' : ''}
      <div class="btns end"><button type="button" class="btn red" id="c-ok">受けとる</button></div>`, { close: false });
    $('#c-ok', inn).addEventListener('click', () => { R.takeCash(run); SND.play('coin'); save(); renderBar(); openReward(); });
  }
  // ご褒美：短冊を一枚
  function openReward() {
    const r = run.reward;
    const tmp = r.opts.map((o) => ({ ...o, w: KD.DICT[o.id] }));
    const inn = sheet(`<h2>言葉をひとつ、持ち帰る</h2><p class="lead">三枚から一枚えらぶ。${run.tier >= 1 ? '左端は、いま祓った物の怪の名。' : ''}長押しでしらべられる。</p>
      <div class="picks" id="rw"></div><div class="btns end"><button type="button" class="btn" id="rw-skip">いらない</button></div>`, { close: false });
    const box = $('#rw', inn);
    tmp.slice().reverse().forEach((o) => {
      const k = tmp.indexOf(o);
      const fake = { u: -1 - k, id: o.id, pow: o.w.pow, add: [] };
      run.deck.push(fake);
      const el = cardEl(fake.u);
      run.deck.pop();
      el.addEventListener('click', () => { if (lpFired) { lpFired = false; return; } const c = R.takeReward(run, k); SND.play('pick'); toast(`「${esc(R.base(run, c.id).s)}」を束に入れた`); save(); goShop(); });
      const wrap = document.createElement('div'); wrap.className = 'pick-it'; wrap.appendChild(el); box.appendChild(wrap);
    });
    $('#rw-skip', inn).addEventListener('click', () => { R.takeReward(run, null); goShop(); });
  }
  function goShop() { if (!run.shop) R.openShop(run); save(); openShop(); }

  // 言の葉屋
  function openShop() {
    const s = run.shop;
    const nextE = (() => { const t = run.tier === 2 ? 0 : run.tier + 1; const ch = run.tier === 2 ? run.ch + 1 : run.ch; return { ch, t }; })();
    const nextLabel = run.tier === 2 && run.ch === 3 && !run.cleared ? '冬の大物を祓った。先へ' : `次へ（${KD.SEASON_NAME[nextE.ch % 4]}・${TIER[nextE.t]}　${KD.fmt(KD.lg(KD.target(nextE.ch, nextE.t)))}点）`;
    const inn = sheet(`<h2>言の葉屋</h2><p class="lead">夜の文机に、店があらわれた。手持ち ${zeniI.replace('<i>', '<i style="display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--gold);color:var(--night);font:700 10px/1 var(--f-text);font-style:normal">')} <b id="s-z">${run.zeni}</b>銭</p>
      <h3>言葉</h3><div class="picks" id="s-words"></div>
      <h3>御守り</h3><div class="goods" id="s-relics"></div>
      <h3>道具・巻物</h3><div class="goods" id="s-tools"></div>
      <div class="btns"><button type="button" class="btn" id="s-reroll">品替え（${2 + s.rerolls}銭）</button><button type="button" class="btn" id="s-deck">束を見る（${run.deck.length}枚）</button><button type="button" class="btn red" id="s-next">${esc(nextLabel)}</button></div>`, { close: false });
    const buy = (kind, k) => { if (R.buy(run, kind, k)) { SND.play('coin'); save(); renderBar(); openShop(); } else { SND.play('bad'); toast('銭が足りない'); } };
    const W1 = $('#s-words', inn);
    s.words.forEach((o, k) => {
      const fake = { u: -100 - k, id: o.id, pow: KD.DICT[o.id].pow, add: [] };
      run.deck.push(fake); const el = cardEl(fake.u); run.deck.pop();
      el.addEventListener('click', () => { if (lpFired) { lpFired = false; return; } if (!o.sold) buy('words', k); });
      const wrap = document.createElement('div'); wrap.className = `pick-it ${o.sold ? 'sold' : ''} ${!o.sold && run.zeni < o.price ? 'cant' : ''}`;
      wrap.appendChild(el); wrap.insertAdjacentHTML('beforeend', `<span class="price"><i>銭</i>${o.sold ? '売り切れ' : o.price}</span>`);
      W1.appendChild(wrap);
    });
    const good = (kind, k, o, ic, cls, name, desc) => `<button type="button" class="good ${o.sold ? 'sold' : ''}" data-kind="${kind}" data-k="${k}" ${o.sold ? 'disabled' : ''}><span class="gi ${cls}">${ic}</span><span><b>${esc(name)}</b><small>${esc(desc)}</small><span class="pr">${o.sold ? '売り切れ' : o.price + '銭'}</span></span></button>`;
    $('#s-relics', inn).innerHTML = s.relics.map((o, k) => { const r = KD.RELICS.find((x) => x.id === o.id); return good('relics', k, o, '守', 'relic', r.name, r.desc); }).join('') || '<p class="lead">もう並べるものがない</p>';
    const wz = KD.wazaById(s.scroll.id);
    $('#s-tools', inn).innerHTML = s.tools.map((o, k) => { const t = KD.TOOLS.find((x) => x.id === o.id); return good('tools', k, o, '具', 'tool', `${t.name}（手持ち${run.tools[t.id] || 0}）`, t.desc); }).join('')
      + good('scroll', 0, s.scroll, '巻', 'scroll', `巻物「${wz.name}」 段位${run.wl[wz.id] || 0}→${(run.wl[wz.id] || 0) + 1}`, `${wz.desc}。段位が上がるほど強い（上限なし）`);
    $$('.good', inn).forEach((b) => b.addEventListener('click', () => buy(b.dataset.kind, +b.dataset.k)));
    $('#s-reroll', inn).addEventListener('click', () => { if (R.reroll(run)) { SND.play('paper'); save(); renderBar(); openShop(); } else { SND.play('bad'); toast('銭が足りない'); } });
    $('#s-deck', inn).addEventListener('click', () => openDeck(openShop));
    $('#s-next', inn).addEventListener('click', () => {
      const r = R.nextFight(run);
      closeSheet(); save();
      if (r === 'clear') { openClear(); return; }
      sen = []; cur = -1; mode = null; marks = [];
      renderAll();
      const e = enemy();
      SND.play('clack');
      toast(`<b>${esc(e.name)}</b>があらわれた。${e.trick ? esc(e.trick.text) : ''}`);
    });
  }

  // 束を見る
  function openDeck(back, erase) {
    const order = ['n', 'num', 'v', 'a', 'na', 'rt', 'adv', 'cj', 'it', 'oto'];
    const cs = run.deck.slice().sort((a, b) => order.indexOf(R.base(run, a.id).pos) - order.indexOf(R.base(run, b.id).pos) || b.pow - a.pow);
    const inn = sheet(`<h2>束　${run.deck.length}枚</h2><p class="lead">${erase ? '消す短冊をえらぶ（消しゴム）' : '長押しでしらべる。かすれた言葉は、うすく見える。'}</p><div class="deck-grid" id="dk"></div>${back ? '<div class="btns end"><button type="button" class="btn" id="dk-back">もどる</button></div>' : ''}`, { onClose: back });
    const box = $('#dk', inn);
    for (const c of cs) {
      const el = cardEl(c.u, { sm: true });
      if (erase) el.addEventListener('click', () => { if (lpFired) { lpFired = false; return; } if (R.erase(run, c.u)) { SND.play('cut'); toast(`「${esc(R.base(run, c.id).s)}」を消した`); save(); renderAll(); } openDeck(back, false); });
      box.appendChild(el);
    }
    const b = $('#dk-back', inn); if (b) b.addEventListener('click', back);
  }

  // 御守り
  function openRelics() {
    const rs = run.relics.map((id) => KD.RELICS.find((r) => r.id === id));
    const tl = KD.TOOLS.filter((t) => run.tools[t.id]);
    sheet(`<h2>御守りと道具</h2><h3>御守り</h3>${rs.length ? `<div class="goods">${rs.map((r) => `<div class="good"><span class="gi relic">守</span><span><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></span></div>`).join('')}</div>` : '<p class="lead">まだない。言の葉屋で手に入る。</p>'}
      <h3>道具</h3>${tl.length ? `<div class="goods">${tl.map((t) => `<div class="good"><span class="gi tool">具</span><span><b>${esc(t.name)} ×${run.tools[t.id]}</b><small>${esc(t.desc)}</small></span></div>`).join('')}</div>` : '<p class="lead">なし</p>'}
      <h3>巻物（技の段位）</h3><p class="lead">${Object.keys(run.wl).length ? Object.entries(run.wl).map(([id, lv]) => `${esc(KD.wazaById(id).name)} 段位${lv}`).join('　') : 'まだない'}</p>`);
  }

  /* ---------- 道具 ---------- */
  const TOOL_NEED = { hasami: 1, nori: 2, fude: 1, utsushi: 1, shuniku: 1 };
  function modeText() {
    if (mode === 'disc') return '<b>書き直し</b>：捨てる短冊をえらんで「書き直す」。同じ数だけ引きなおす。';
    const t = KD.TOOLS.find((x) => x.id === mode.tool);
    const n = TOOL_NEED[mode.tool];
    return `<b>${esc(t.name)}</b>：${n === 2 ? `つなぐ短冊を順に二枚えらぶ（${marks.length}/2）` : '使う短冊をえらぶ'}`;
  }
  function openTools() {
    const ts = KD.TOOLS;
    const inn = sheet(`<h2>道具</h2><div class="tools">${ts.map((t) => `<button type="button" class="good" data-t="${t.id}" ${run.tools[t.id] ? '' : 'disabled'}><span class="gi tool">具</span><span><b>${esc(t.name)} ×${run.tools[t.id] || 0}</b><small>${esc(t.desc)}</small></span></button>`).join('')}</div>`);
    $$('[data-t]', inn).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.t; closeSheet();
      if (id === 'sumi') { R.sumi(run); SND.play('paper'); toast('手札の言葉のかすれが戻った'); save(); renderAll(); return; }
      if (id === 'shiori') { R.shiori(run); SND.play('paper'); toast('この戦いの詠む +1回'); save(); renderAll(); return; }
      if (id === 'keshigomu') { openDeck(null, true); return; }
      mode = { tool: id }; marks = []; sen = []; cur = -1; renderComp();
    }));
  }
  function toolPick(u) {
    const id = mode.tool;
    if (marks.includes(u)) { marks = marks.filter((x) => x !== u); renderComp(); return; }
    marks.push(u); SND.play('tap');
    if (marks.length < TOOL_NEED[id]) { renderComp(); return; }
    const us = marks.slice(); mode = null; marks = [];
    renderComp();
    if (id === 'hasami') return cutSheet(us[0]);
    if (id === 'nori') return glueSheet(us[0], us[1]);
    if (id === 'fude') return fudeSheet(us[0]);
    if (id === 'utsushi') { const c = R.copy(run, us[0]); SND.play('paper'); toast(`「${esc(R.base(run, c.id).s)}」を写して、束に足した`); save(); renderAll(); return; }
    if (id === 'shuniku') return stampSheet(us[0]);
  }
  function cutSheet(u) {
    const w = W(u), opts = R.cutOptions(run, u);
    if (!opts.length) { toast('一音の言葉は、切れない'); return; }
    const ms = KD.morae(w.y);
    let k = opts[Math.floor(opts.length / 2)].k, li = 0, ri = 0;
    const inn = sheet(`<h2>はさみ</h2><p class="lead">「${esc(w.s)}」を、音のさかいめで切る。辞書にある音なら言葉に、なければ「ただの音」になる。</p><div class="cut-y" id="cy"></div><div class="cut-res" id="cr"></div><div class="btns end"><button type="button" class="btn red" id="c-go">切る</button></div>`);
    const draw = () => {
      $('#cy', inn).innerHTML = ms.map((m, i) => (i ? `<button type="button" data-k="${i}" class="${i === k ? 'on' : ''}" aria-label="${i}音目のあと">✂</button>` : '') + `<span>${m}</span>`).join('');
      const o = opts.find((x) => x.k === k);
      const side = (s, sel, key) => `<div class="cut-side"><b>${s.ws.length ? esc(s.ws[sel].s) : esc(s.y)}</b><small>${s.ws.length ? `${esc(s.y)}・${POSFULL[s.ws[sel].pos] || ''}・力${s.ws[sel].pow}` : 'ただの音'}</small>${s.ws.length > 1 ? `<div class="alts">${s.ws.map((x, j) => `<button type="button" data-${key}="${j}" class="${j === sel ? 'on' : ''}">${esc(x.s)}</button>`).join('')}</div>` : ''}</div>`;
      $('#cr', inn).innerHTML = side(o.L, Math.min(li, Math.max(0, o.L.ws.length - 1)), 'l') + side(o.R, Math.min(ri, Math.max(0, o.R.ws.length - 1)), 'r');
      $$('#cy button', inn).forEach((b) => b.addEventListener('click', () => { k = +b.dataset.k; li = 0; ri = 0; SND.play('tap'); draw(); }));
      $$('[data-l]', inn).forEach((b) => b.addEventListener('click', () => { li = +b.dataset.l; draw(); }));
      $$('[data-r]', inn).forEach((b) => b.addEventListener('click', () => { ri = +b.dataset.r; draw(); }));
    };
    draw();
    $('#c-go', inn).addEventListener('click', () => { const r = R.cut(run, u, k, li, ri); closeSheet(); SND.play('cut'); if (r) toast(`「${esc(w.s)}」を「${esc(R.base(run, r[0].id).s)}」と「${esc(R.base(run, r[1].id).s)}」に切った`); save(); renderAll(); });
  }
  function glueSheet(a, b) {
    const A = W(a), B = W(b), r = R.glueResult(run, a, b);
    const inn = sheet(`<h2>のり</h2><p class="lead">「${esc(A.s)}」と「${esc(B.s)}」をつなぐ。</p><div class="cut-res"><div class="cut-side"><b>${esc(r.w.s)}</b><small>${esc(r.w.y)}・${r.known ? '辞書の言葉' : r.w.oto ? 'ただの音' : '造語（新しい言葉）'}・力${r.w.pow}</small></div><div class="cut-side"><small>性質</small><p class="chips" style="justify-content:center">${r.w.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('') || 'なし'}</p></div></div><div class="btns end"><button type="button" class="btn" id="g-sw">順番を入れかえる</button><button type="button" class="btn red" id="g-go">つなぐ</button></div>`);
    $('#g-sw', inn).addEventListener('click', () => glueSheet(b, a));
    $('#g-go', inn).addEventListener('click', () => { const c = R.glue(run, a, b); closeSheet(); SND.play('glue'); if (c) toast(`「${esc(R.base(run, c.id).s)}」${r.known ? '' : '（造語）'}ができた`); save(); renderAll(); });
  }
  function fudeSheet(u) {
    const w = W(u), hs = R.homophones(run, u);
    if (!hs.length) { toast(`「${esc(w.s)}」と同じ音の言葉は、辞書にない`); return; }
    const inn = sheet(`<h2>筆</h2><p class="lead">「${esc(w.s)}（${esc(w.y)}）」を、同じ音の別の言葉に書きかえる。</p><div class="goods">${hs.map((h) => `<button type="button" class="good" data-id="${esc(h.id)}"><span class="gi">${esc(h.s.slice(0, 1))}</span><span><b>${esc(h.s)}</b><small>${POSFULL[h.pos] || ''}・力${h.pow}・${esc(h.tags.join('・'))}</small></span></button>`).join('')}</div>`);
    $$('[data-id]', inn).forEach((b) => b.addEventListener('click', () => { R.rewrite(run, u, b.dataset.id); closeSheet(); SND.play('paper'); toast('書きかえた'); save(); renderAll(); }));
  }
  function stampSheet(u) {
    const w = W(u);
    const inn = sheet(`<h2>朱肉</h2><p class="lead">「${esc(w.s)}」に押す元素をえらぶ。</p><div class="chips" style="gap:8px">${KD.ELEM.map((t) => `<button type="button" class="btn" data-e="${t}" style="background:var(--e-${t});color:#fff;border:0;min-width:56px">${t}</button>`).join('')}</div>`);
    $$('[data-e]', inn).forEach((b) => b.addEventListener('click', () => { R.stamp(run, u, b.dataset.e); closeSheet(); SND.play('seal'); toast(`「${esc(w.s)}」に${b.dataset.e}を押した`); save(); renderAll(); }));
  }

  /* ---------- 帖 ---------- */
  function openBook(tab = 'waza') {
    const B = S.meta.book;
    const T = [['waza', '技'], ['say', '言い伝え'], ['foe', '物の怪'], ...(run && run.rand ? [['pair', '相性']] : []), ['rec', '記録']];
    let body = '';
    if (tab === 'waza') {
      const groups = [...new Set(KD.WAZA.map((w) => w.group))];
      body = groups.map((g) => `<h3>${esc(g)}</h3><ul class="book-list">${KD.WAZA.filter((w) => w.group === g).map((w) => {
        const known = !w.hide || B.waza[w.id];
        const lv = run && run.wl[w.id] ? `<span class="lv">段位${run.wl[w.id]}</span>` : '';
        return known ? `<li>${lv}<b>${esc(w.name)}</b>　${w.kind === 'mul' ? '×倍' : '＋倍'}${B.waza[w.id] ? '' : '（まだ）'}<br>${esc(w.desc)}</li>` : '<li class="unk"><b>？？？</b>　まだ見つけていない技</li>';
      }).join('')}</ul>`).join('');
    }
    if (tab === 'say') {
      const n = Object.keys(B.say).length;
      body = `<p class="lead">見つけた言い伝え ${n} / ${KD.SAYINGS.length}。言葉（短冊）がこの順に並べば成立する。助詞や活用はなんでもよい。</p><ul class="book-list">${KD.SAYINGS.map((k) => (B.say[k.id] ? `<li><b>${esc(k.text)}</b>　${esc(k.kind)}</li>` : `<li class="unk"><b>${'？'.repeat(Math.min(10, [...k.text].length))}</b>　${esc(k.kind)}・言葉${k.seq.length}つ</li>`)).join('')}</ul>`;
    }
    if (tab === 'foe') body = `<ul class="book-list">${KD.ENEMIES.map((e) => (B.foe[e.id] ? `<li><b>${esc(e.name)}</b>　${esc(KD.SEASON_NAME[e.ch])}・${TIER[e.tier]}<br>${esc(e.lore)}${e.trick ? `<br>技：${esc(e.trick.text)}` : ''}</li>` : `<li class="unk"><b>？？？</b>　${e.secret ? '？' : KD.SEASON_NAME[e.ch] + '・' + TIER[e.tier]}</li>`)).join('')}</ul>`;
    if (tab === 'pair') {
      const R0 = run.rand, fs = run.found.pairs;
      const got = R0.pairs.filter((p) => fs[p.a + p.b]);
      body = `<p class="lead">この旅（種 ${esc(run.seed)}）だけの相性。見つけたもの ${got.length} / ${R0.pairs.length}。</p><ul class="book-list">${got.map((p) => `<li><b>${esc(p.a)} × ${esc(p.b)}</b>　×${p.x}</li>`).join('') || '<li class="unk">まだ見つけていない。いろいろな性質の言葉を、同じ文に入れてみる。</li>'}${run.found.waza.moraN ? `<li><b>今宵の音数</b>　${R0.moraN}音</li>` : ''}</ul>`;
    }
    if (tab === 'rec') {
      const best = S.meta.best;
      body = `<ul class="rows"><li><span>旅に出た回数</span><b>${S.meta.runs || 0}</b></li><li><span>冬の大物を祓った回数</span><b>${S.meta.clears || 0}</b></li><li><span>いちばん大きな一句</span><b>${KD.fmt(S.meta.maxLg)}</b></li></ul>${best && best.lines && best.lines.length ? `<div class="shikishi">${best.lines.slice(0, 5).map((l) => `<p>${esc(l)}</p>`).join('')}<span class="sk-seal">詠</span></div>` : ''}`;
    }
    const inn = sheet(`<h2>言霊帖</h2><div class="tabs">${T.map(([k, n]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>${body}`);
    $$('[data-tab]', inn).forEach((b) => b.addEventListener('click', () => openBook(b.dataset.tab)));
  }

  /* ---------- メニュー・遊び方 ---------- */
  function openMenu() {
    const inn = sheet(`<h2>文机</h2><div class="btns" style="flex-direction:column;align-items:stretch">
      <button type="button" class="btn" id="m-snd">音：${SND.on ? 'あり' : 'なし'}</button>
      <button type="button" class="btn" id="m-help">遊び方</button>
      <button type="button" class="btn" id="m-deck">束を見る（${run ? run.deck.length : 0}枚）</button>
      <button type="button" class="btn" id="m-title">タイトルへ（旅は保存される）</button>
      <button type="button" class="btn" id="m-quit" style="color:var(--shu)">この旅をおわりにする</button></div>`);
    $('#m-snd', inn).addEventListener('click', () => { SND.on = !SND.on; S.meta.sound = SND.on; save(); openMenu(); });
    $('#m-help', inn).addEventListener('click', openHelp);
    $('#m-deck', inn).addEventListener('click', () => openDeck(openMenu));
    $('#m-title', inn).addEventListener('click', () => { closeSheet(); showTitle(); });
    $('#m-quit', inn).addEventListener('click', () => {
      const i2 = sheet('<h2>旅をおわりにする？</h2><p class="lead">いまの束も御守りも、なくなる。帖の記録は残る。</p><div class="btns end"><button type="button" class="btn" id="q-no">やめておく</button><button type="button" class="btn red" id="q-yes">おわりにする</button></div>');
      $('#q-no', i2).addEventListener('click', closeSheet);
      $('#q-yes', i2).addEventListener('click', () => { closeSheet(); gameOver(true); });
    });
  }
  function openHelp() {
    sheet(`<h2>遊び方</h2><div class="howto"><ol>
      <li>下の<b>短冊</b>（言葉）と、<b>札</b>（が・を・に、て・た・ない、いる・ある・する・なる…何度でも使える）を並べて、文をつくる。札を長押しすると使い方が出る。紙の上の言葉をえらぶと、前後に動かしたり、もどしたりできる。</li>
      <li>紙の左下の<b>改行</b>で句を区切れる（パソコンなら Enter。詠むのは Ctrl＋Enter）。句ごとの音の数が出る。五・七・五なら<b>俳句</b>、少しずれても<b>字余り・字足らず</b>で半分の効き目。「、」でも文を区切れる（音には数えない）。</li>
      <li>句に区切った文（五・七・五に近い文）は<b>うた</b>として読む。句の終わりで言いさしても（<span class="ex">空切るように／赤い鳥</span>）<b>余韻</b>として通り、句を名詞で切って別の景色を並べると<b>取り合わせ</b>。順番を入れかえても（<span class="ex">鳥が飛ぶ／赤い空を</span>）<b>倒置法</b>として通る。</li>
      <li><b>意味が通らない文は詠めない</b>。<span class="ex">石を燃やす</span>は×（石は燃えない）。ただし形のないものは、たとえとして通る：<span class="ex">悲しみを燃やす</span>は「比喩」。</li>
      <li>点 ＝ <b>力</b>（言葉の力の合計）×<b>倍</b>。技で倍が増える：五・七・五の<b>俳句</b>（×3）、<b>韻</b>、<b>比喩</b>、<b>擬人法</b>（<span class="ex">月が笑う</span>）、<b>隠喩</b>（<span class="ex">雪は花だ</span>）、<b>体言止め</b>、<b>季語</b>……。まだ隠れている技もある。</li>
      <li>物の怪には<b>苦手</b>がある。その性質を帯びた言葉は力×2。形容詞や「の」でつないだ言葉の性質も帯びる（<span class="ex">赤い石</span>は火を帯びる）。</li>
      <li>動詞には<b>働き</b>がある。<span class="ex">花を育てる</span>と花の力が増え、<span class="ex">鳥を呼ぶ</span>と手札を引く。長押しでしらべられる。</li>
      <li>同じ言葉を使いすぎると<b>かすれて</b>弱くなる。祓うと銭が入り、<b>言の葉屋</b>で言葉・御守り・道具が買える。</li>
      <li><b>はさみ</b>で言葉を切り（<span class="ex">雪だるま→雪・だるま</span>）、<b>のり</b>でつなぐ（辞書になければ新しい言葉）。</li>
      <li>春・夏・秋・冬の物の怪を祓えば旅は一区切り。その先は<b>上限なし</b>。文の長さにも、点にも、上限はない。</li>
      <li><b>気まぐれ</b>で始めると、旅ごとに隠れた「相性」や技の強さが変わる。どの組み合わせが強いか、詠んで見つけるしかない。</li>
    </ol><p class="lead">本作品はフィクションです。言い伝えや名句（芭蕉・蕪村・子規・一茶）は、むかしからのものを引いています。</p></div>`);
  }

  /* ---------- おわり ---------- */
  function shareText() {
    const b = run && run.best;
    const line = b ? b.lines.join(' ') : '';
    return `「${line}」${b ? KD.fmt(b.lg) + '点' : ''}で物の怪を祓った。\n#ことだま短冊 #ヨリミチ\nhttps://neetball123-wq.github.io/site-game/works/kotodama/`;
  }
  function gameOver(quit) {
    const r = run;
    S.meta.runs = (S.meta.runs || 0) + 1;
    const where = `${KD.SEASON_NAME[r.ch % 4]}${r.ch >= 4 ? `（${Math.floor(r.ch / 4) + 1}巡目）` : ''}・${TIER[r.tier]}`;
    const b = r.best;
    const inn = sheet(`<h2>${quit ? '筆をおいた' : '言葉が尽きた'}</h2><p class="lead">${esc(where)}の${esc(enemy().name)}の前で、旅はおわった。</p>
      ${b ? `<div class="shikishi">${b.lines.slice(0, 5).map((l) => `<p>${esc(l)}</p>`).join('')}<span class="sk-seal">詠</span><span class="sk-sig">${esc(KD.fmt(b.lg))}点</span></div><p class="lead" style="text-align:center">この旅でいちばんの一句</p>` : ''}
      <ul class="rows"><li><span>詠んだ数</span><b>${r.stats.plays}</b></li><li><span>祓った物の怪</span><b>${r.stats.fights}</b></li><li><span>束の枚数</span><b>${r.deck.length}</b></li></ul>
      <div class="btns end">${b ? `<a class="btn" id="o-x" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}" target="_blank" rel="noopener">Xに書く</a>` : ''}<button type="button" class="btn" id="o-title">タイトル</button><button type="button" class="btn red" id="o-again">もう一度</button></div>`, { close: false });
    const mode0 = r.mode;
    run = null; S.run = null; save();
    $('#o-title', inn).addEventListener('click', () => { closeSheet(); showTitle(); });
    $('#o-again', inn).addEventListener('click', () => { closeSheet(); newRun(mode0); });
  }
  function openClear() {
    S.meta.clears = (S.meta.clears || 0) + 1; save();
    const most = Object.entries(run.wear).sort((a, b) => b[1] - a[1])[0];
    const mw = most ? R.base(run, most[0]) : null;
    const lines = ['言霊喰いは、ほどけるように消えた。', mw ? `あとに、短冊が一枚だけ落ちていた。「${mw.s}」。この旅で、あなたがいちばん使った言葉だった。` : 'あとに、白い短冊が一枚だけ落ちていた。', 'かすれた言葉は、だれかに使われてきた言葉だ。', '季節は、また春にもどる。……まだ、詠みますか。'];
    const inn = sheet(`<h2>四季をめぐった</h2><div id="ep"></div>${run.best ? `<div class="shikishi">${run.best.lines.slice(0, 5).map((l) => `<p>${esc(l)}</p>`).join('')}<span class="sk-seal">詠</span><span class="sk-sig">${esc(KD.fmt(run.best.lg))}点</span></div>` : ''}
      <div class="btns end"><a class="btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}" target="_blank" rel="noopener">Xに書く</a><button type="button" class="btn" id="cl-end">ここで筆をおく</button><button type="button" class="btn red" id="cl-go">百鬼夜行へ（上限なし）</button></div>`, { close: false });
    const ep = $('#ep', inn);
    lines.forEach((l, i) => setTimeout(() => ep.insertAdjacentHTML('beforeend', `<p class="lead" style="animation:tin .8s ease-out">${esc(l)}</p>`), reduced ? 0 : i * 900));
    $('#cl-end', inn).addEventListener('click', () => { closeSheet(); gameOver(true); });
    $('#cl-go', inn).addEventListener('click', () => { R.endless(run); closeSheet(); save(); renderAll(); toast('<b>百鬼夜行</b>。ここから先に、上限はない。'); });
  }

  /* ---------- タイトル ---------- */
  function showTitle() {
    let t = $('#title');
    if (!t) { t = document.createElement('div'); t.id = 'title'; t.className = 'title'; document.body.appendChild(t); }
    const b = S.meta.best;
    t.innerHTML = `<span class="moon" aria-hidden="true"></span><div class="title-in">
      <div class="t-strip"><h1>ことだま短冊</h1><span class="t-seal">祓</span></div>
      <p class="t-lead">言葉をつないで、文にする。<br>文は言霊になって、物の怪を祓う。<br>五・七・五、韻、比喩、だじゃれ。上限は、ない。</p>
      <div class="t-btns">
        ${run ? `<button type="button" class="btn red" id="t-cont">つづきから<small>${esc(KD.SEASON_NAME[run.ch % 4])}${run.ch >= 4 ? `（${Math.floor(run.ch / 4) + 1}巡目）` : ''}・${TIER[run.tier]}${run.mode === 'random' ? '・気まぐれ' : ''}</small></button>` : ''}
        <button type="button" class="btn ${run ? '' : 'red'}" id="t-new">はじめから<small>ふつうの旅</small></button>
        <button type="button" class="btn" id="t-rand">気まぐれ<small>相性が旅ごとに変わる</small></button>
        <p class="t-seed"><label for="t-seed">種（ともだちと同じ気まぐれで遊ぶ）</label><input id="t-seed" inputmode="numeric" maxlength="8" placeholder="おまかせ"></p>
        <button type="button" class="btn" id="t-help">遊び方</button>
        <button type="button" class="btn" id="t-book">言霊帖</button>
      </div>
      ${b && b.lines && b.lines.length ? `<p class="t-best">いちばんの一句：${esc(b.lines.join(' '))}（${esc(KD.fmt(b.lg))}点）</p>` : ''}
      <p class="t-foot">本作品はフィクションです。物の怪・言葉の効き目は、すべて作り話です。</p></div>`;
    t.hidden = false;
    const go = (m) => {
      if (run && !confirmNew) { confirmNew = m; t.querySelector(m === 'random' ? '#t-rand' : '#t-new').innerHTML = 'もう一度押すと、いまの旅は消える'; return; }
      confirmNew = null; t.hidden = true; newRun(m, m === 'random' ? ($('#t-seed', t).value || '').replace(/\D/g, '') : '');
    };
    let confirmNew = null;
    $('#t-new', t).addEventListener('click', () => { SND.unlock(); go('normal'); });
    $('#t-rand', t).addEventListener('click', () => { SND.unlock(); go('random'); });
    const c = $('#t-cont', t); if (c) c.addEventListener('click', () => { SND.unlock(); t.hidden = true; resume(); });
    $('#t-help', t).addEventListener('click', openHelp);
    $('#t-book', t).addEventListener('click', () => openBook());
  }
  function newRun(m, seed) {
    run = R.create(m, seed || undefined);
    sen = []; cur = -1; mode = null; marks = [];
    save(); renderAll();
    const t = $('#title'); if (t) t.hidden = true;
    const e = enemy();
    SND.play('clack');
    toast(`${m === 'random' ? `気まぐれの旅（種 <b>${esc(run.seed)}</b>）。` : ''}<b>${esc(e.name)}</b>があらわれた。`);
  }
  function resume() {
    sen = []; cur = -1; mode = null; marks = [];
    renderAll();
    if (run.phase === 'cash') { if (run.reward && run.reward.paid) { if (run.reward.taken) goShop(); else openReward(); } else openCash(); }
    else if (run.phase === 'shop') openShop();
    else if (run.phase === 'clear') openClear();
    else if (run.phase === 'over') gameOver();
  }

  /* ---------- 検証用の口 ---------- */
  window.__kd = {
    get run() { return run; }, S, KD, R,
    say(str) { // "雪 が 降る" を手札から組む（なければ束に足して手札へ）
      sen = str.trim().split(/\s+/).map((x) => {
        if (KD.TILES[x] && x[0] !== '#') return { p: x };
        const id = x.replace(/^#/, '');
        let u = run.hand.find((h) => { const c = R.card(run, h); return c.id === id && !sen.some((s) => s.u === h); });
        if (!u) { const w = KD.DICT[id] || (KD.BY_Y[KD.flat(id)] || [])[0]; const c = { u: ++run.us, id: w.id, pow: w.pow, add: [] }; run.deck.push(c); run.hand.push(c.u); u = c.u; }
        return { u };
      });
      renderAll(); return lastPre && lastPre.an.ok;
    },
    play: () => doPlay(), fast(v) { fast = v; }, win() { run.fight.got = run.fight.target; },
    title: showTitle, newRun, shop() { R.takeCash(run); R.takeReward(run, null); goShop(); },
  };

  /* ---------- はじまり ---------- */
  if (run && run.phase !== 'over') { showTitle(); }
  else { run = null; showTitle(); }
  if (/[?&]autostart/.test(location.search)) { $('#title').hidden = true; newRun(/random/.test(location.search) ? 'random' : 'normal', (location.search.match(/seed=(\d+)/) || [])[1]); }
})();
