/* =========================================================
   女神課 転生窓口 — 進行
   ========================================================= */
(() => {
  'use strict';
  const D = window.TD, A = window.TA, S = window.TS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const KEY = 'tensei.v1';
  const HINT_MIN = [2, 5, 8];
  const EXTRAS = ['ticket', 'clock', 'foot', 'old', 'haibara', 'suzu'];
  const K = D.KANJI_NUM;
  const KJ = '〇一二三四五六七八九';
  const num = (n) => { n = +n; if (n < 10) return KJ[n]; if (n < 100) return (n >= 20 ? KJ[Math.floor(n / 10)] : '') + '十' + (n % 10 ? KJ[n % 10] : ''); return String(n); };
  const pts = (n) => (n < 0 ? '−' : '') + Math.abs(n) + '点';

  const fresh = () => ({ v: 1, playMs: 0, intro: false, ci: 0, phase: 'orient', forms: {}, spec: {}, filed: [], found: {}, caseMs: {}, peek: {}, miss: 0, ended: false, ending: '', mute: false, tab: 'rec', drawer: false, me: { name: '', y: '', m: '', d: '', ok: false }, fails: {}, noteTab: 'front' });
  let st = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1) { st = Object.assign(fresh(), r); st.me = Object.assign(fresh().me, r.me || {}); } } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const U = { gen: 0, next: null, skip: null, talking: false, busy: false, clockN: 0, haiN: 0, cur5: 'a' };

  const CASE = () => D.CASES[st.ci] || null;
  const isMe = () => st.ci >= D.CASES.length;
  const cid = () => (isMe() ? 'me' : CASE().id);
  const lock = { spec: () => st.ci >= 1, en: () => st.ci >= 3, att: () => st.ci >= 5 };
  const find = (k) => { if (!st.found[k]) { st.found[k] = Date.now(); save(); } };
  function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
  const soulOf = (no) => { for (const c of D.CASES) { if (c.pair) { const s = c.souls.find((x) => x.no === no); if (s) return Object.assign({ caseId: c.id }, s); } else if (c.no === no) return Object.assign({ caseId: c.id }, c); } return no === D.ME.no ? Object.assign({ caseId: 'me' }, D.ME) : null; };
  const filedOf = (no) => st.filed.find((f) => f.nos.includes(no));

  /* =========================================================
     会話
     ========================================================= */
  function whoName(w) {
    const c = CASE();
    if (w === 'S') return c ? c.name : '';
    if (w === 'S1') return c && c.souls ? c.souls[0].name : '';
    if (w === 'S2') return c && c.souls ? c.souls[1].name : '';
    return { H: '灰原（となりの窓口）', M: '女神課長', Y: 'あなた', N: '' }[w] || '';
  }
  function say(lines) {
    const g = ++U.gen; U.talking = true; renderLock();
    return new Promise((res) => {
      let i = 0; const box = $('#dlg');
      const next = () => {
        if (g !== U.gen) { res(); return; }
        if (i >= lines.length) { box.hidden = true; U.talking = false; U.next = U.skip = null; renderLock(); res(); return; }
        const [w, t] = lines[i++];
        box.hidden = false; box.className = 'dlg w-' + w.replace(/\d/, '');
        const n = whoName(w); $('#dlg-who').textContent = n; $('#dlg-who').hidden = !n;
        $('#dlg-t').textContent = t;
        if (w === 'S' && CASE() && CASE().kind === 'animal') S.sfx('nyaa'); else S.sfx('click');
      };
      U.next = next; U.skip = () => { i = lines.length; next(); };
      next();
    });
  }
  $('#dlg').addEventListener('click', (e) => {
    if (e.target.closest('#dlg-skip')) { U.skip && U.skip(); return; }
    if (e.target.closest('#dlg-who') && $('#dlg').classList.contains('w-H')) { haibaraTap(); return; }
    U.next && U.next();
  });
  addEventListener('keydown', (e) => {
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && U.next && !$('#dlg').hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); U.next(); }
  });
  function renderLock() { document.body.classList.toggle('talking', U.talking); }

  /* =========================================================
     窓口（場面）
     ========================================================= */
  function showSoul(c, how) {
    const s = $('#soul');
    if (!c) { s.innerHTML = ''; s.className = 'soul'; return; }
    s.innerHTML = A.soul(c); s.className = 'soul ' + (how || '');
  }
  function leaveSoul(down) { const s = $('#soul'); s.className = 'soul ' + (down ? 'down' : 'out'); S.sfx(down ? 'suzu' : 'rise'); return wait(1700).then(() => { s.innerHTML = ''; s.className = 'soul'; }); }
  function setDisp(n) { $('#disp-n').textContent = n ? String(n).padStart(3, '0') : '---'; }

  /* =========================================================
     進行
     ========================================================= */
  const ORIENT = [
    ['H', 'おはよう。となりの窓口の、灰原です。今日からだよね。よろしく。'],
    ['H', '仕事はかんたん。番号を呼んで、来た魂の書類を読んで、行き先を決めて、印を押す。'],
    ['H', '書類は右の机。「生前記録票」と「転生希望票」。規定集も置いてある。'],
    ['H', '決めたら「決定通知書」に書いて、いちばん下に「承認」の印。受け付けられない魂には「差戻」。'],
    ['H', 'わからなかったら、上の「灰原の付箋」を見て。考えた時間のぶん、書き足しておくから。'],
    ['H', '……きみ、待合室のベンチで見かけた気がするな。気のせいかな。——じゃあ、呼び出しボタンを押して。'],
  ];
  const BETWEEN = {
    c1: [['H', 'うん、いい書類。次、呼んで。']],
    c2: [['H', '特例、よく見つけたね。規定集って、けっこう読みごたえあるでしょ。']],
    c3: [['H', 'たまにいるんだ、まだ来ちゃいけない人。……次、呼んで。']],
    c4: [['H', 'さっきのおじいさんの猫か。縁って、あるもんだね。']],
    c5: [['H', '家族の書類は、いちばんむずかしい。おつかれさま。']],
    c6: [['H', '……次で、今日は最後だよ。']],
  };
  async function orient() { st.phase = 'orient'; save(); await say(ORIENT); st.phase = 'call'; save(); renderAll(); }
  async function call() {
    if (U.talking || U.busy || st.phase !== 'call' || st.ended) return;
    U.busy = true; S.init(); S.sfx('call');
    if (isMe()) { await callMe(); U.busy = false; return; }
    const c = CASE(); setDisp(c.no);
    await wait(700);
    showSoul(c, 'in'); st.phase = 'greet'; save(); renderAll();
    await say(c.greet);
    st.phase = 'work'; st.tab = 'rec'; save(); renderAll(); U.busy = false;
  }
  async function callMe() {
    setDisp(D.ME.no); await wait(900);
    st.phase = 'me1'; st.tab = 'rec'; save();
    await say([['N', '番号表示が「108」に変わった。……窓口の向こうには、だれも来ない。']]);
    $('#scene').classList.add('me');
    await say([['H', '……来てるよ。窓の、こっち側に。'], ['N', 'ガラスに、自分の姿がうつっている。——人の形ではなく、小さな光が。'], ['H', 'きみの記録は、白紙で届いてる。第十六条。自分で書いて、印を押してごらん。']]);
    renderAll();
  }
  async function afterOk(c) {
    if (c.alive) { await say(c.ok.slice(0, 2)); await leaveSoul(true); await say(c.ok.slice(2)); } else { await say(c.ok); await leaveSoul(); }
    st.filed.push(fileEntry(c)); st.ci++; st.phase = 'call'; st.tab = 'file'; save();
    setDisp(0); renderAll();
    await say(BETWEEN[c.id] || []);
    st.tab = 'rec'; save(); renderAll();
  }
  function fileEntry(c) {
    if (c.pair) { const a = st.forms[105], b = st.forms[106]; return { id: c.id, nos: [105, 106], res: `承認　ちさと：${wn(a.world)}／${sn(a.species)}　そら：${wn(b.world)}／${sn(b.species)}` }; }
    if (c.alive) return { id: c.id, nos: [c.no], res: '差戻（現世へ返送）' };
    const f = st.forms[c.no];
    return { id: c.id, nos: [c.no], res: `承認　${wn(f.world)}／${sn(f.species)}${f.skills.length ? '／' + f.skills.map(skn).join('・') : ''}／記憶${f.mem ? 'あり' : 'なし'}${f.en ? '／縁結び' + f.en : ''}` };
  }
  const wn = (k) => (D.WORLDS[k] ? D.WORLDS[k].name : '—');
  const sn = (k) => (D.SPECIES[k] ? D.SPECIES[k].name : '—');
  const skn = (k) => (D.SKILLS.find((x) => x[0] === k) || [0, k])[1];

  /* =========================================================
     書類
     ========================================================= */
  const TABS = [['rec', '生前記録票'], ['wish', '転生希望票'], ['rules', '規定集'], ['file', '綴り'], ['form', '決定通知書']];
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, n]) => `<button type="button" data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${n}</button>`).join('') + `<button type="button" class="drawer" id="drawer">引き出し</button>`;
  }
  $('#tabs').addEventListener('click', (e) => {
    if (e.target.closest('#drawer')) { openDrawer(); return; }
    const b = e.target.closest('[data-tab]'); if (!b) return; st.tab = b.dataset.tab; save(); S.sfx('page'); renderTabs(); renderDoc();
  });
  function renderDoc() {
    const d = $('#doc');
    const f = { rec: vRec, wish: vWish, rules: vRules, file: vFile, form: vForm }[st.tab] || vRec;
    d.innerHTML = f(); d.scrollTop = 0;
    if (st.tab === 'form') bindForm();
    if (st.tab === 'rec' && isMe()) bindMe();
  }
  const noSoul = () => `<div class="empty"><p>いまは、窓口にだれもいない。</p><p class="tiny">${st.ended ? '今日の受付は、終わった。' : '上の「呼び出し」ボタンで、次の番号を呼ぶ。'}</p></div>`;
  function recHTML(s, title) {
    const sum = s.items.reduce((a, b) => a + b[1], 0);
    return `<div class="sheet rec"><div class="sh-h"><b>${title || '生前記録票'}</b><span>受付番号　${s.no}</span></div>
      <table class="ft"><tr><th>氏名</th><td class="big">${esc(s.name)}</td><th>年齢</th><td>${s.kind === 'animal' ? '' : ''}${num(s.age)}${s.kind === 'animal' ? '歳（猫）' : '歳'}</td></tr>
      <tr><th>死亡日</th><td>${esc(s.date)}</td><th>死亡確認時刻</th><td class="${s.time ? '' : 'blank'}">${s.time ? esc(s.time) : '―――'}</td></tr>
      <tr><th>死因</th><td colspan="3">${esc(s.cause)}</td></tr>
      <tr><th>家族</th><td colspan="3">${esc(s.family)}</td></tr>
      <tr><th>功徳の内訳</th><td colspan="3"><ul class="items">${s.items.map(([t, p]) => `<li><span>${esc(t)}</span><b class="${p < 0 ? 'neg' : ''}">${p > 0 ? '＋' : p < 0 ? '−' : '±'}${Math.abs(p)}</b></li>`).join('')}</ul></td></tr>
      <tr><th>功徳点</th><td colspan="3" class="merit">${pts(s.merit)}${sum !== s.merit ? '' : ''}</td></tr>
      <tr><th>生前のおもな出来事</th><td colspan="3"><ul class="ev">${s.events.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></td></tr>
      <tr><th>備考</th><td colspan="3" class="note">${esc(s.note || '')}</td></tr></table></div>`;
  }
  function vRec() {
    if (isMe() && st.phase !== 'call') return meRec();
    const c = CASE(); if (!c || st.phase === 'call' || st.phase === 'orient') return noSoul();
    return c.pair ? c.souls.map((s) => recHTML(s)).join('') : recHTML(c);
  }
  function wishHTML(s) {
    const w = s.wish;
    return `<div class="sheet wish"><div class="sh-h"><b>転生希望票</b><span>受付番号　${s.no}　${esc(s.name)}</span></div>
      <table class="ft"><tr><th>行きたい世界</th><td class="hand">${esc(w.world)}</td></tr><tr><th>なりたいもの</th><td class="hand">${esc(w.species)}</td></tr>
      <tr><th>ほしい力</th><td class="hand">${esc(w.skills)}</td></tr><tr><th>記憶</th><td class="hand">${esc(w.memory)}</td></tr>
      <tr><th>ひとこと</th><td class="hand">${esc(w.comment)}</td></tr></table><p class="tiny">※本人の記入。規定に合わない希望は、窓口で調整すること。</p></div>`;
  }
  function vWish() {
    if (isMe()) return `<div class="empty"><p>きみの転生希望票は、まだ書かれていない。</p></div>`;
    const c = CASE(); if (!c || st.phase === 'call' || st.phase === 'orient') return noSoul();
    return c.pair ? c.souls.map(wishHTML).join('') : wishHTML(c);
  }
  function vRules() {
    return `<div class="book"><h2>転生規定集</h2><p class="tiny">天界合同庁舎 女神課 編</p>
      <ol class="rules">${D.RULES.map(([n, t, b]) => `<li><b>第${K[n]}条（${esc(t)}）</b><p>${esc(b)}</p></li>`).join('')}</ol>
      <h3>別表一　転生先の世界</h3><table class="tb"><tr><th>世界</th><th>費用</th><th>危険度</th><th>住む種族</th></tr>${D.WORLD_ORDER.map((k) => { const w = D.WORLDS[k]; return `<tr><td><b>${esc(w.name)}</b><small>${esc(w.sub)}${w.note ? '<br>' + esc(w.note) : ''}</small></td><td>${w.cost}</td><td>${w.danger}</td><td>${w.species.map(sn).join('・')}</td></tr>`; }).join('')}</table>
      <p class="tiny">危険度　Ａ：きびしい　Ｂ：ふつう　Ｃ：おだやか</p>
      <h3>別表二　種族</h3><table class="tb">${D.SPECIES_ORDER.map((k) => `<tr><td>${sn(k)}</td><td>${D.SPECIES[k].cost}</td></tr>`).join('')}</table>
      <h3>別表三　スキル</h3><table class="tb two">${D.SKILLS.map(([, n, c]) => `<tr><td>${esc(n)}</td><td>${c}</td></tr>`).join('')}<tr><td>（記憶の持ち越し）</td><td>${D.MEMORY_COST}</td></tr></table>
      <details class="foot" id="rfoot"><summary>付則</summary><p>${esc(D.RULE_FOOT)}</p></details></div>`;
  }
  function vFile() {
    const rows = st.filed.map((f) => {
      const names = f.nos.map((n) => soulOf(n).name).join('・');
      return `<button type="button" class="fr" data-file="${f.nos[0]}"><span class="no">${f.nos.join('・')}</span><span class="nm">${esc(names)}</span><span class="rs">${esc(f.res)}</span></button>`;
    }).join('');
    return `<div class="binder"><h2>処理ずみの綴り</h2><p class="tiny">押すと、生前記録票が見られる。</p>${rows || '<p class="tiny">まだ、なにもない。</p>'}
      <details class="old" id="oldf"><summary>昔の綴り（書庫）</summary>${D.OLD.map((o) => `<div class="oldr"><span class="no">${esc(o.no)}</span><b>${esc(o.name)}（${num(o.age)}）</b><small>${esc(o.cause)}</small><p>${esc(o.result)}</p><p class="tiny">${esc(o.note)}</p></div>`).join('')}</details></div>`;
  }
  $('#doc').addEventListener('click', (e) => {
    const f = e.target.closest('[data-file]');
    if (f) { const no = +f.dataset.file, fe = filedOf(no); S.sfx('page'); modal(fe.nos.map((n) => recHTML(soulOf(n))).join('') + `<div class="res"><b>処理</b>${esc(fe.res)}</div>`); return; }
  });
  $('#doc').addEventListener('toggle', (e) => { if (e.target.id === 'rfoot' && e.target.open) find('foot'); if (e.target.id === 'oldf' && e.target.open) find('old'); }, true);

  /* =========================================================
     決定通知書
     ========================================================= */
  const blank = () => ({ world: '', species: '', skills: [], mem: 0, en: '', att: '' });
  const F = (no) => (st.forms[no] = st.forms[no] || blank());
  const SP = () => (st.spec[cid()] = st.spec[cid()] || []);
  function sheetFields(no, s, label) {
    const f = F(no);
    return `<div class="fcol" data-no="${no}">${label ? `<p class="who">${esc(label)}</p>` : ''}
      <label class="fl"><span>転生先の世界</span><select data-k="world"><option value="">―　えらぶ　―</option>${D.WORLD_ORDER.map((k) => `<option value="${k}"${f.world === k ? ' selected' : ''}>${D.WORLDS[k].name}（${D.WORLDS[k].cost}点・危険度${D.WORLDS[k].danger}）</option>`).join('')}</select></label>
      <label class="fl"><span>種族</span><select data-k="species"><option value="">―　えらぶ　―</option>${D.SPECIES_ORDER.map((k) => `<option value="${k}"${f.species === k ? ' selected' : ''}>${sn(k)}（${D.SPECIES[k].cost}点）</option>`).join('')}</select></label>
      <div class="fl"><span>授けるスキル</span><div class="skills">${D.SKILLS.map(([k, n, c]) => `<label class="${f.skills.includes(k) ? 'on' : ''}"><input type="checkbox" data-k="skill" value="${k}"${f.skills.includes(k) ? ' checked' : ''}>${n}<i>${c}</i></label>`).join('')}</div></div>
      <div class="fl"><span>記憶の持ち越し</span><div class="rad"><label><input type="radio" name="mem${no}" data-k="mem" value="1"${f.mem ? ' checked' : ''}>あり（300点）</label><label><input type="radio" name="mem${no}" data-k="mem" value="0"${f.mem ? '' : ' checked'}>なし</label></div></div>
      ${lock.en() ? `<label class="fl"><span>縁結び（相手の受付番号）</span><input type="text" data-k="en" inputmode="numeric" maxlength="3" value="${esc(f.en)}" placeholder="―――"></label>` : ''}
      ${lock.att() ? `<label class="fl"><span>再審査の添付</span><select data-k="att"><option value="">―　なし　―</option>${st.filed.flatMap((x) => x.nos).map((n) => `<option value="${n}"${String(f.att) === String(n) ? ' selected' : ''}>${n}　${esc(soulOf(n).name)}</option>`).join('')}</select></label>` : ''}
    </div>`;
  }
  function vForm() {
    let souls, pair = false;
    if (isMe()) { if (!st.me.ok) return `<div class="empty"><p>まず、生前記録票（白紙）を書き入れる。</p></div>`; souls = [Object.assign({}, D.ME)]; }
    else { const c = CASE(); if (!c || st.phase === 'call' || st.phase === 'orient') return noSoul(); pair = !!c.pair; souls = pair ? c.souls : [c]; }
    const names = souls.map((s) => s.name).join('・');
    return `<div class="sheet form"><div class="sh-h"><b>転生決定通知書</b><span>受付番号　${souls.map((s) => s.no).join('・')}</span></div>
      <p class="to">${esc(names)}　殿</p>
      <div class="fcols${pair ? ' pair' : ''}">${souls.map((s) => sheetFields(s.no, s, pair ? `${s.no}　${s.name}` : '')).join('')}</div>
      ${lock.spec() ? `<div class="fl"><span>適用する特例</span><div class="spec">${D.SPECIALS.map((n) => `<label class="${SP().includes(n) ? 'on' : ''}"><input type="checkbox" data-k="spec" value="${n}"${SP().includes(n) ? ' checked' : ''}>第${K[n]}条</label>`).join('')}</div></div>` : ''}
      <div class="calc" id="calc"></div>
      <div class="inkan"><span class="lbl">印欄</span><div class="seal" id="seal"></div>
        <div class="stamps"><button type="button" class="stp" data-stamp="ok" aria-label="承認の印を押す">${A.stamp('ok')}<span>承認</span></button><button type="button" class="stp" data-stamp="ng" aria-label="差戻の印を押す">${A.stamp('ng')}<span>差戻</span></button></div>
        ${isMe() ? '<button type="button" class="btn ghost" id="stay">決めない（第十七条）</button>' : ''}</div></div>`;
  }
  function bindForm() {
    const d = $('#doc');
    d.onchange = d.oninput = (e) => {
      const el = e.target, k = el.dataset.k; if (!k) return;
      if (k === 'spec') { const n = +el.value, a = SP(), i = a.indexOf(n); if (el.checked && i < 0) a.push(n); if (!el.checked && i >= 0) a.splice(i, 1); el.parentElement.classList.toggle('on', el.checked); }
      else {
        const no = +el.closest('[data-no]').dataset.no, f = F(no);
        if (k === 'skill') { const i = f.skills.indexOf(el.value); if (el.checked && i < 0) f.skills.push(el.value); if (!el.checked && i >= 0) f.skills.splice(i, 1); el.parentElement.classList.toggle('on', el.checked); }
        else if (k === 'mem') f.mem = +el.value;
        else if (k === 'en') { el.value = el.value.replace(/[^\d０-９]/g, '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)); f.en = el.value; }
        else f[k] = el.value;
      }
      if (e.type === 'change') S.sfx('pen');
      save(); calc();
    };
    $$('[data-stamp]', d).forEach((b) => b.onclick = () => stamp(b.dataset.stamp));
    const sy = $('#stay'); if (sy) sy.onclick = () => stay();
    calc();
  }

  /* ---------- 計算 ---------- */
  function specOk(n, souls, forms) {
    if (n === 7) return souls.some((s) => s.kind === 'human' && s.age < 20);
    if (n === 8) return souls.some((s) => s.overwork);
    if (n === 13) return souls.length > 1;
    if (n === 15) return souls.some((s, i) => attOk(s, forms[i]));
    return false;
  }
  function attOk(s, f) { return s.no === 107 && String(f.att) === '102'; }
  function enTarget(f, soulsHere) {
    const n = parseInt(f.en, 10); if (!n) return null;
    const here = soulsHere.find((s) => s.no === n);
    if (here) return { no: n, here: true };
    const fe = filedOf(n); if (!fe) return { no: n, missing: true };
    const tf = st.forms[n] || {}; return { no: n, world: tf.world };
  }
  function budgetOf(souls, forms, spec) {
    const base = souls.map((s) => s.merit), add = souls.map(() => 0);
    souls.forEach((s, i) => {
      if (spec.includes(7) && s.kind === 'human' && s.age < 20) add[i] += 200;
      if (spec.includes(8) && s.overwork) add[i] += 500;
      if (spec.includes(15) && attOk(s, forms[i])) add[i] += 800;
    });
    return { base, add };
  }
  function costOf(s, f, souls, forms) {
    const w = D.WORLDS[f.world], sp = D.SPECIES[f.species];
    const t = enTarget(f, souls);
    let wc = w ? w.cost : 0;
    if (t && !t.missing && ((t.here && forms[souls.findIndex((x) => x.no === t.no)].world === f.world) || (!t.here && t.world === f.world))) wc = 0;
    const sk = f.skills.reduce((a, k) => a + (D.SKILLS.find((x) => x[0] === k) || [0, 0, 0])[2], 0);
    return { w: wc, s: sp ? sp.cost : 0, k: sk, m: f.mem ? D.MEMORY_COST : 0, get t() { return this.w + this.s + this.k + this.m; } };
  }
  function current() {
    if (isMe()) return { souls: [D.ME], forms: [F(D.ME.no)], spec: SP() };
    const c = CASE(), souls = c.pair ? c.souls : [c];
    return { souls, forms: souls.map((s) => F(s.no)), spec: SP() };
  }
  function calc() {
    const el = $('#calc'); if (!el) return;
    const { souls, forms, spec } = current(), b = budgetOf(souls, forms, spec), cs = souls.map((s, i) => costOf(s, forms[i], souls, forms));
    const pooled = souls.length > 1 && spec.includes(13);
    const rows = souls.map((s, i) => `<tr><td>${souls.length > 1 ? esc(s.name) : '持ち点'}</td><td>${pts(b.base[i])}</td><td>${b.add[i] ? '＋' + b.add[i] : '―'}</td><td>世界 ${cs[i].w}／種族 ${cs[i].s}／スキル ${cs[i].k}／記憶 ${cs[i].m}</td><td><b>${cs[i].t}</b></td></tr>`).join('');
    let foot;
    if (souls.length === 1 || !pooled) foot = souls.map((s, i) => { const r = b.base[i] + b.add[i] - cs[i].t; return `<span class="${r < 0 ? 'over' : ''}">${souls.length > 1 ? esc(s.name) + '　' : ''}使える点 ${pts(b.base[i] + b.add[i])}　使う点 ${cs[i].t}点　のこり ${pts(r)}</span>`; }).join('');
    else { const tot = b.base.reduce((a, x, i) => a + x + b.add[i], 0), use = cs.reduce((a, x) => a + x.t, 0); foot = `<span class="${tot - use < 0 ? 'over' : ''}">合算（第十三条）　使える点 ${pts(tot)}　使う点 ${use}点　のこり ${pts(tot - use)}</span>`; }
    el.innerHTML = `<p class="lbl">功徳点の計算</p><table><tr><th></th><th>持ち点</th><th>特例</th><th>内訳</th><th>使う点</th></tr>${rows}</table><p class="sum">${foot}</p>`;
  }

  /* ---------- 判定 ---------- */
  function generic(souls, forms, spec) {
    for (const n of spec) if (!specOk(n, souls, forms)) return n === 7 ? '第七条は、二十歳未満で亡くなった「人」の魂だけだよ。' : n === 8 ? '第八条は、過労で労災の認定を受けた人だけ。' : n === 13 ? '第十三条は、家族がいっしょに亡くなったときだけだよ。' : '第十五条は、減点のまちがいを示す記録を「再審査の添付」に入れたときに使うんだ。';
    for (let i = 0; i < souls.length; i++) {
      const s = souls[i], f = forms[i], w = D.WORLDS[f.world], who = souls.length > 1 ? s.name + 'さんの' : '';
      if (!w) return who + '転生先の世界が、空欄だよ。';
      if (!f.species) return who + '種族が、空欄だよ。';
      if (!w.species.includes(f.species)) return `${sn(f.species)}は、${w.name}には住んでいない。第四条と別表一。`;
      if (s.kind === 'animal' && ['human', 'elf', 'dragon', 'mer'].includes(f.species)) return '動物の魂は、その種族にはなれない。第九条。';
      if (f.world === 'gensei' && f.mem) return '現世には、記憶を持っていけない。第六条。';
      const t = enTarget(f, souls);
      if (t && t.missing) return `受付番号${t.no}の記録は、綴りにないよ。縁結びは、先に手続きをした魂とだけ。`;
      if (t && !t.here && t.world !== f.world) return `縁結びの相手（${t.no}）は、${wn(t.world)}へ行った。世界がちがうと、縁は結べない。`;
      if (t && t.here && forms[souls.findIndex((x) => x.no === t.no)].world !== f.world) return '縁を結ぶなら、ふたりとも同じ世界に。';
      if (s.age < 10 && w.danger === 'A') return '十歳未満の魂は、危険度Ａの世界へは行けない。第十二条。';
      if (s.age < 10 && w.danger === 'B') { const g = souls.find((x) => x !== s); const tg = t && g && t.no === g.no; const gt = g && parseInt(forms[souls.indexOf(g)].en, 10) === s.no; if (!tg && !gt) return '十歳未満の魂が危険度Ｂの世界へ行くには、保護者との縁結びがいる。第十二条。'; }
    }
    const b = budgetOf(souls, forms, spec), cs = souls.map((s, i) => costOf(s, forms[i], souls, forms));
    for (let i = 0; i < souls.length; i++) if (b.base[i] + b.add[i] < 0 && forms[i].world !== 'haiiro') return '功徳点がマイナスの魂は、灰の荒野へのみ。第五条。';
    if (souls.length > 1 && spec.includes(13)) { const tot = b.base.reduce((a, x, i) => a + x + b.add[i], 0), use = cs.reduce((a, x) => a + x.t, 0); if (use > tot) return `合算しても、${use - tot}点たりない。第二条。`; }
    else for (let i = 0; i < souls.length; i++) { const av = b.base[i] + b.add[i]; if (av < 0) { if (cs[i].t > 0) return '功徳点がマイナスの魂は、灰の荒野へ、なにも持たずに行くことになる。スキルも記憶も、つけられない。'; continue; } const r = av - cs[i].t; if (r < 0) return `${souls.length > 1 ? souls[i].name + 'さんの' : ''}合計が、功徳点を${-r}点こえてる。第二条。`; }
    return null;
  }
  function check(kind) {
    const { souls, forms, spec } = current(), id = cid(), f = forms[0];
    if (id === 'c3') { if (kind === 'ng') return null; const n = (st.fails.c3 = (st.fails.c3 || 0) + 1); return n < 2 ? '待って。記録票、上から下まで、ぜんぶ読んだ？' : '死亡確認時刻の欄を見て。空欄だよね。規定集の第一条。'; }
    if (kind === 'ng') return id === 'me' ? 'きみ自身を差し戻す先は、もうないよ。' : '差し戻す理由は？　この方の記録に、受け付けられない理由は見あたらないよ。';
    const over = (m) => m && /こえてる|たりない/.test(m);
    if (id === 'c1') {
      const g = generic(souls, forms, spec);
      if (over(g) && f.skills.includes('allmagic')) return g + '　……全属性魔法、九〇〇点もするよ。面談で「予算の話」をしてみたら？';
      if (g) return g;
      if (f.world !== 'arstella') return '田中さんの希望は「剣と魔法の世界」だよ。';
      if (f.species !== 'human') return '田中さんは「人間」を希望してる。';
      if (!f.skills.includes('sword') || !f.skills.includes('tough')) return '希望のスキルが、たりないよ。剣術と、頑丈な体。';
      if (!f.mem) return '記憶のこと、面談で聞いてみた？';
      return null;
    }
    if (id === 'c2') {
      const g = generic(souls, forms, spec);
      if (over(g) && !spec.includes(8)) return g + '　佐藤さんの点、もっと増える条文はない？　記録票の死因の欄もよく読んで。';
      if (g) return g;
      if (f.world !== 'lulucia') return '佐藤さんの希望は「海の見えるところ」。いちばん海らしい世界は？';
      if (f.species !== 'human') return '佐藤さんは「人間」を希望してる。';
      if (!f.skills.includes('farm')) return '万能農耕は、ぜったい入れてあげたいね。';
      return null;
    }
    if (id === 'c4') {
      const g = generic(souls, forms, spec);
      if (over(g) && !f.en) return g + '　飼い主と同じ世界へ行く方法、規定集にない？　第十一条。';
      if (g) return g;
      if (f.en !== '101') return 'タマさんの飼い主は、田中さん。綴りで番号をたしかめて、縁結びに。';
      if (f.species === 'slime') return 'スライム……ひざには乗れるけど、おじいちゃん、気づくかな。';
      if (f.species !== 'animal') return 'タマさんは、ひざに乗りたいんだよね。';
      if (!f.mem) return 'タマさん、おじいちゃんのこと忘れたくないって。';
      return null;
    }
    if (id === 'c5') {
      const [a, b] = forms;
      if (a.world && b.world && a.world !== b.world) return '同じ日に亡くなった家族は、同じ世界へ。第十条。';
      const g = generic(souls, forms, spec);
      if (over(g)) { if (a.mem) return g + '　ちさとさんの記憶……第十一条の最後の一文を読んでみて。'; if (b.mem) return g + '　そらちゃんは、こわいのを忘れたいって。'; if (!spec.includes(13)) return g + '　家族の点は、合わせられないかな。第十三条。'; if (!spec.includes(7)) return g + '　そらちゃんは六歳。第七条。'; if (!a.en && !b.en) return g + '　縁結びをすると、世界の費用はひとりぶんですむ。第十一条。'; }
      if (g) return g;
      if (a.world !== 'lulucia') return 'ちさとさんの希望は「いちばん安全な世界」。別表一の危険度を見て。';
      if (b.species !== 'mer') return 'そらちゃんの「およげるようになりたい」は？';
      if (a.species !== 'human') return 'ちさとさんは「人間」を希望してる。';
      return null;
    }
    if (id === 'c6') {
      if (f.world === 'haiiro' && !spec.includes(15)) { const g = generic(souls, forms, spec); if (!g) return '規定どおりなら、それで受理できる。……でも、黒木さんの質問、気にならない？　綴りを見てみて。'; }
      if (f.att && f.att !== '102') return 'その記録、黒木さんの件と関係ある？　日付・時刻・場所をくらべて。';
      const g = generic(souls, forms, spec); if (g) return g;
      if (f.world !== 'gearnold') return '黒木さんは「汽車の走る世界」がいいって。';
      if (!['human', 'doll'].includes(f.species)) return '黒木さん、制服を着てホームに立ちたいんだって。';
      return null;
    }
    if (id === 'me') return generic(souls, forms, spec);
    return null;
  }
  async function stamp(kind) {
    if (U.talking || U.busy || st.ended) return;
    if (!(st.phase === 'work' || (isMe() && st.phase === 'me2'))) return;
    S.init();
    const err = check(kind);
    const seal = $('#seal');
    if (err) { S.sfx('miss'); st.miss++; save(); seal.classList.remove('shake'); void seal.offsetWidth; seal.classList.add('shake'); await say([['H', err]]); return; }
    U.busy = true;
    seal.innerHTML = A.stamp(kind); seal.className = 'seal on'; S.sfx('stamp');
    await wait(900); S.sfx('ok');
    if (isMe()) { await meDone(); U.busy = false; return; }
    const c = CASE(); try { await afterOk(c); } finally { U.busy = false; renderAll(); }
  }

  /* =========================================================
     白紙の記録（あなた）
     ========================================================= */
  function meRec() {
    if (st.me.ok) return recHTML(D.ME, '生前記録票（本人記入）');
    const yy = [1, 2, 3, 4, 5, 6, 7, 8], mm = [...Array(12)].map((_, i) => i + 1), dd = [...Array(31)].map((_, i) => i + 1);
    const sel = (k, arr, v) => `<select data-me="${k}"><option value="">―</option>${arr.map((n) => `<option value="${n}"${String(v) === String(n) ? ' selected' : ''}>${num(n)}</option>`).join('')}</select>`;
    return `<div class="sheet rec white"><div class="sh-h"><b>生前記録票（白紙交付）</b><span>受付番号　108</span></div>
      <p class="tiny">第十六条により、白紙で交付する。本人が書き入れること。</p>
      <table class="ft"><tr><th>氏名</th><td><input type="text" data-me="name" maxlength="12" value="${esc(st.me.name)}" placeholder="　　　　" autocomplete="off"></td></tr>
      <tr><th>命日</th><td class="date">令和${sel('y', yy, st.me.y)}年${sel('m', mm, st.me.m)}月${sel('d', dd, st.me.d)}日</td></tr>
      <tr><th>死因</th><td class="blank">　</td></tr><tr><th>家族</th><td class="blank">　</td></tr><tr><th>功徳点</th><td class="blank">　</td></tr><tr><th>未練</th><td class="blank">　</td></tr></table>
      <div class="inkan"><span class="lbl">本人印</span><div class="seal" id="seal"></div><div class="stamps"><button type="button" class="stp" id="me-ok">${A.stamp('ok')}<span>押す</span></button></div></div></div>`;
  }
  function bindMe() {
    const d = $('#doc');
    d.oninput = d.onchange = (e) => { const k = e.target.dataset.me; if (!k) return; st.me[k] = e.target.value; save(); };
    const b = $('#me-ok'); if (b) b.onclick = meCheck;
  }
  const normName = (s) => String(s).normalize('NFKC').replace(/[\s　・]/g, '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  async function meCheck() {
    if (U.talking || U.busy || st.phase !== 'me1') return;
    S.init();
    const n = normName(st.me.name), okName = ['小野寺湊', '湊', 'みなと', 'おのでらみなと', '小野寺みなと', 'おのでら湊'].includes(n);
    const okDate = +st.me.y === 5 && +st.me.m === 9 && +st.me.d === 28;
    if (!okName || !okDate) {
      S.sfx('miss'); st.miss++; save();
      const seal = $('#seal'); seal.classList.remove('shake'); void seal.offsetWidth; seal.classList.add('shake');
      if (!okName) await say([['H', n ? 'その名前、しっくりくる？' : '名前が、空欄だよ。'], ['H', st.drawer ? '今日の記録のなかに、きみの名前、あったと思うんだけどな。' : '机の引き出し、開けてみた？']]);
      else await say([['H', '名前は、それだね。……命日は？　あの子の記録に、書いてあったはず。']]);
      return;
    }
    U.busy = true; S.sfx('stamp'); const seal = $('#seal'); seal.innerHTML = A.stamp('ok'); seal.className = 'seal on';
    await wait(800); S.sfx('suzu');
    st.me.ok = true; st.phase = 'me2'; save();
    $('#badge-name').innerHTML = A.badge('小野寺 湊');
    await say(D.ME_MEMORY);
    await say([['N', '白紙だった欄に、文字が浮かびあがった。'], ['H', '功徳点、五八〇点。……十九歳だったんだね。特例も、忘れずに。'], ['H', '行き先を決めたら、決定通知書に書いて、印を。……決められないなら、第十七条もある。ぼくみたいにね。']]);
    st.tab = 'rec'; U.busy = false; renderAll();
  }
  async function meDone() {
    const f = F(D.ME.no); st.ending = f.world; save();
    await say([['M', '小野寺 湊さん。三年と一日、おつかれさまでした。いってらっしゃい。——女神課長'], ['H', 'いってらっしゃい。……ぼくは、もう少しここにいるよ。待ってる人がいるんだ。']]);
    $('#scene').classList.remove('me'); $('#soul').innerHTML = A.soul({ orb: ['#fdf1d6', '#e8b85a', 0.8] }); $('#soul').className = 'soul';
    await leaveSoul();
    await epilogue(f.world);
  }
  async function stay() {
    if (U.talking || U.busy || st.phase !== 'me2') return;
    U.busy = true; st.ending = 'stay'; save();
    await say([['H', '……そっか。きみも、待つんだね。'], ['H', 'じゃあ、明日からもよろしく。となりの窓口の、灰原です。']]);
    U.busy = false;
    await epilogue('stay');
  }
  async function epilogue(k) {
    const E = D.ENDINGS[k] || D.ENDINGS.stay, ep = $('#epi');
    ep.hidden = false; ep.innerHTML = `<div class="ep-art">${A.vignette(k)}</div><div class="ep-t"><p class="ep-h">${esc(E.title)}</p><p id="ep-line"></p><button type="button" class="btn" id="ep-next">つぎへ</button></div>`;
    S.ambience(false);
    for (const l of E.lines) {
      $('#ep-line').textContent = l; $('#ep-line').className = 'fadein';
      await new Promise((r) => { const b = $('#ep-next'); const t = setTimeout(r, Math.max(3500, l.length * 140)); b.onclick = () => { clearTimeout(t); r(); }; });
      $('#ep-line').className = '';
    }
    if (k === 'gensei' || k === 'stay') S.sfx('suzu');
    ep.hidden = true;
    st.ended = true; st.phase = 'done'; save(); renderAll(); showEnd();
  }
  function showEnd() {
    const e = $('#endc'), mins = Math.max(1, Math.round(st.playMs / 60000)), peek = Object.values(st.peek).reduce((a, b) => a + b, 0), n = EXTRAS.filter((k) => st.found[k]).length;
    const other = st.ending === 'stay' ? '行き先を決めると、別の結末が見られます。' : '「決めない（第十七条）」を選ぶと、別の結末が見られます。';
    e.hidden = false;
    e.innerHTML = `<div class="ec"><p class="ec-s">本日の受付は、終了しました</p><h2>女神課 転生窓口</h2><p class="ec-e">結末：${esc((D.ENDINGS[st.ending] || D.ENDINGS.stay).title)}</p>
      <dl><dt>窓口にいた時間</dt><dd>約${mins}分</dd><dt>灰原の付箋</dt><dd>${peek}回</dd><dt>印のやりなおし</dt><dd>${st.miss}回</dd><dt>見つけたもの</dt><dd>${n} / ${EXTRAS.length}</dd></dl>
      <p class="tiny">${other}</p>
      <div class="row"><button type="button" class="btn" id="ec-again">最後の窓口からやりなおす</button><button type="button" class="btn ghost" id="ec-close">窓口を見る</button></div>
      <div id="ec-ask"></div><p class="tiny"><button type="button" class="link" id="ec-reset">記録を消して、はじめから</button></p></div>`;
    $('#ec-close').onclick = () => { e.hidden = true; };
    $('#ec-again').onclick = () => { e.hidden = true; st.ended = false; st.phase = 'me2'; st.ending = ''; st.tab = 'form'; save(); $('#scene').classList.add('me'); S.ambience(true); renderAll(); };
    $('#ec-reset').onclick = () => {
      $('#ec-ask').innerHTML = '<div class="ask">記録を消して、はじめからにしますか？<div class="row"><button type="button" class="btn" id="ec-yes">消してはじめる</button><button type="button" class="btn ghost" id="ec-no">やめておく</button></div></div>';
      $('#ec-yes').onclick = () => { try { localStorage.removeItem(KEY); } catch (x) { } location.reload(); };
      $('#ec-no').onclick = () => { $('#ec-ask').innerHTML = ''; };
    };
  }

  /* =========================================================
     引き出し・職員証・時計・整理券
     ========================================================= */
  function openDrawer() {
    S.init(); S.sfx('drawer'); st.drawer = true; save();
    modal(`<div class="drw"><h2>机の引き出し</h2><div class="drw-in"><button type="button" class="suzu" id="suzu" aria-label="鈴のキーホルダー"><svg viewBox="0 0 120 160"><path d="M60 8 v34" stroke="#8a6a3a" stroke-width="3"/><circle cx="60" cy="8" r="6" fill="none" stroke="#b8943e" stroke-width="3"/><circle cx="60" cy="80" r="36" fill="#e6c257" stroke="#9a7a24" stroke-width="3"/><path d="M30 76 H90" stroke="#9a7a24" stroke-width="3"/><circle cx="60" cy="92" r="6" fill="#6a5010"/><path d="M60 98 v14" stroke="#6a5010" stroke-width="3"/><path d="M70 120 l30 26 l-44 -6 z" fill="#f3ead7" stroke="#b8a888"/></svg></button>
      <div class="drw-t"><p>鈴のキーホルダー。小さな紙の札が、ひもで結んである。</p><p class="hand">「ひなと、おそろい」</p><p class="tiny">いつから入っていたのか、思い出せない。</p></div></div>
      <p class="tiny">ほかには、使いかけのボールペンと、朱肉。</p></div>`);
    $('#suzu').onclick = () => { S.sfx('suzu'); find('suzu'); toast('ちりん。……どこかで聞いた音。'); };
  }
  $('#b-badge').addEventListener('click', () => { S.init(); S.sfx('page'); modal(`<div class="bdg">${A.badge(st.me.ok ? '小野寺 湊' : '')}<p class="tiny">臨時職員証。氏名の欄が、空いている。${st.me.ok ? '……いまは、書いてある。' : ''}</p></div>`); });
  $('#clock').addEventListener('click', async () => {
    S.init(); U.clockN++; S.sfx('click');
    if (U.clockN === 5 && !U.talking) { find('clock'); await say([['H', 'その時計、止まってるよ。ずっと九時十二分。'], ['H', '止まってるほうが、みんな落ち着くんだって。課長の方針。']]); }
  });
  $('#ticket').addEventListener('click', () => {
    S.init(); S.sfx('click'); find('ticket');
    const t = st.ended ? '本日の受付は終了しました。おつかれさまでした。' : st.me.ok ? '整理券 108番 — あなたの番です。' : '整理券 108番 — あなたの番は、まだです。';
    toast(`<b>整理券</b>　${t}`);
  });
  async function haibaraTap() {
    U.haiN++;
    if (U.haiN === 5) {
      find('haibara'); U.skip && U.skip(); await wait(50);
      await say([['H', 'ぼく？　ここに三百年いる。'], ['H', '「先に行って、待ってて」って言われたんだ。でも、どこで待てばいいのか、わからなくて。'], ['H', 'ここなら、いつかその人が、番号を呼ばれて来るでしょ。']]);
    }
  }

  /* =========================================================
     付箋（ヒント）
     ========================================================= */
  const lv = (id) => { const ms = st.caseMs[id] || 0; return HINT_MIN.filter((m) => ms >= m * 60000).length; };
  function working() { return !st.ended && (st.phase === 'work' || st.phase === 'me1'); }
  $('#b-note').addEventListener('click', () => { S.init(); if (working() && lv(cid()) > (st.peek[cid()] || 0)) st.noteTab = cid(); openNote(); });
  function openNote() {
    S.sfx('page');
    const tabs = [['front', 'はじめに']];
    D.CASES.forEach((c, i) => { if (i <= st.ci) tabs.push([c.id, String(c.no)]); });
    if (isMe()) tabs.push(['me', '108']);
    if (!tabs.find((t) => t[0] === st.noteTab)) st.noteTab = 'front';
    let body = '';
    if (st.noteTab === 'front') body = `<h3>${esc(D.NOTE_FRONT[0])}</h3>${D.NOTE_FRONT.slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}`;
    else {
      const id = st.noteTab, done = st.ended || (id === 'me' ? st.me.ok : D.CASES.findIndex((c) => c.id === id) < st.ci), L = done ? 3 : lv(id), ms = st.caseMs[id] || 0;
      if (!done && L > (st.peek[id] || 0)) { st.peek[id] = L; save(); }
      body = `<h3>受付番号 ${id === 'me' ? '108' : D.CASES.find((c) => c.id === id).no}</h3>` + D.HINTS[id].map((h, i) => i < L ? `<p class="${i === 2 ? 'ans' : ''}">${esc(h)}</p>` : `<p class="lk">（${i === 2 ? '答え' : '付箋' + K[i + 1]}：あと${Math.max(1, Math.ceil((HINT_MIN[i] * 60000 - ms) / 60000))}分ほど考えたら、書き足しておくね）</p>`).join('');
    }
    modal(`<div class="note"><div class="ntabs">${tabs.map(([k, n]) => `<button type="button" data-nt="${k}" class="${st.noteTab === k ? 'on' : ''}">${esc(n)}</button>`).join('')}</div><div class="npage">${body}</div></div>`);
    $$('[data-nt]', $('#modal')).forEach((b) => b.onclick = () => { st.noteTab = b.dataset.nt; save(); openNote(); });
    renderDot();
  }
  function renderDot() { $('#note-dot').hidden = !(working() && lv(cid()) > (st.peek[cid()] || 0)); }

  /* =========================================================
     モーダル
     ========================================================= */
  function modal(html) { const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><button type="button" class="x" aria-label="とじる">×</button>${html}</div>`; $('.x', m).onclick = closeModal; }
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  /* =========================================================
     面談
     ========================================================= */
  function renderAsks() {
    const a = $('#asks'), c = CASE();
    if (st.ended || !c || isMe() || st.phase !== 'work') {
      a.innerHTML = st.phase === 'call' && !st.ended ? `<button type="button" class="callbtn" id="call2">呼び出す（受付番号 ${isMe() ? 108 : c.no}）</button>` : '';
      const c2 = $('#call2'); if (c2) c2.onclick = call; return;
    }
    a.innerHTML = `<span class="lbl">面談</span>` + c.ask.map((q, i) => `<button type="button" data-ask="${i}">${esc(q.q)}</button>`).join('');
    $$('[data-ask]', a).forEach((b) => b.onclick = () => { if (U.talking) return; S.init(); say(c.ask[+b.dataset.ask].lines); });
  }

  /* =========================================================
     入庁（はじまり）
     ========================================================= */
  function gate() {
    const g = $('#gate'); g.hidden = false;
    const again = st.intro;
    g.innerHTML = `<div class="gt"><p class="gt-top">天界合同庁舎　二階</p><h1>女神課 転生窓口</h1>
      <div class="gt-badge">${A.badge(st.me.ok ? '小野寺 湊' : '')}</div>
      <p class="gt-sub">本日付で、女神課 転生係 第三窓口に配属になりました。<br>亡くなった人の書類を読んで、転生先を決めるお仕事です。</p>
      <div class="row">${again ? '<button type="button" class="btn" id="gt-go">窓口にもどる</button><button type="button" class="btn ghost" id="gt-new">はじめから</button>' : '<button type="button" class="btn" id="gt-go">窓口につく</button>'}</div>
      <div id="gt-ask"></div><p class="tiny">書類パズル・約三十分。音が出ます（あとで消せます）。この作品はフィクションです。</p></div>`;
    $('#gt-go').onclick = () => {
      S.init(); S.mute(st.mute); S.ambience(true); g.hidden = true;
      if (!st.intro) { st.intro = true; save(); renderAll(); orient(); return; }
      if (st.phase === 'orient') { renderAll(); orient(); return; }
      if (st.phase === 'greet') st.phase = 'work';
      if (st.phase === 'work' && CASE()) { showSoul(CASE()); setDisp(CASE().no); }
      if (st.phase === 'me1' || st.phase === 'me2') { $('#scene').classList.add('me'); setDisp(108); }
      save(); renderAll();
    };
    const nw = $('#gt-new'); if (nw) nw.onclick = () => { $('#gt-ask').innerHTML = '<div class="ask">記録を消して、はじめからにしますか？<div class="row"><button type="button" class="btn" id="gt-yes">消してはじめる</button><button type="button" class="btn ghost" id="gt-no">やめておく</button></div></div>'; $('#gt-yes').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); }; $('#gt-no').onclick = () => { $('#gt-ask').innerHTML = ''; }; };
  }

  /* =========================================================
     描画・時間
     ========================================================= */
  function renderAll() {
    renderTabs(); renderDoc(); renderAsks(); renderDot();
    $('#call').classList.toggle('want', st.phase === 'call' && !st.ended);
    $('#call').disabled = !(st.phase === 'call' && !st.ended);
    $('#b-snd').textContent = st.mute ? '音：切' : '音：入';
    $('#badge-name').innerHTML = A.badge(st.me.ok ? '小野寺 湊' : '');
    $('#done-n').textContent = st.filed.length;
  }
  $('#call').addEventListener('click', call);
  $('#b-snd').addEventListener('click', () => { st.mute = !st.mute; S.init(); S.mute(st.mute); $('#b-snd').textContent = st.mute ? '音：切' : '音：入'; save(); });
  setInterval(() => {
    if (document.hidden || !st.intro || st.ended || !$('#gate').hidden) return;
    if (working() && !U.talking) { const id = cid(), b = lv(id); st.caseMs[id] = (st.caseMs[id] || 0) + 1000; if (lv(id) > b) { renderDot(); toast('灰原の付箋が、一枚ふえた。'); } }
  }, 1000);
  setInterval(() => { if (document.hidden || !st.intro || st.ended || !$('#gate').hidden) return; st.playMs += 5000; save(); }, 5000);
  document.addEventListener('visibilitychange', () => S.suspend(document.hidden));

  /* ---------- はじめる ---------- */
  $('#scene-bg').innerHTML = A.office();
  setDisp(0);
  renderAll(); gate();

  window.__ts = {
    st: () => st, U, call, stamp, skip: () => U.skip && U.skip(), check,
    go(ci, phase) { st.ci = ci; st.phase = phase || 'work'; st.intro = true; $('#gate').hidden = true; ++U.gen; U.talking = false; U.busy = false; $('#dlg').hidden = true; if (CASE() && st.phase === 'work') { showSoul(CASE()); setDisp(CASE().no); } renderAll(); },
    fileAll() { st.filed = []; D.CASES.slice(0, st.ci).forEach((c) => { st.filed.push(c.alive ? { id: c.id, nos: [c.no], res: '差戻（現世へ返送）' } : { id: c.id, nos: c.pair ? [105, 106] : [c.no], res: '承認' }); }); renderAll(); },
    set(no, o) { Object.assign(F(no), o); save(); renderDoc(); },
    spec(a) { st.spec[cid()] = a.slice(); save(); renderDoc(); },
    tab(k) { st.tab = k; renderTabs(); renderDoc(); },
    me(name, y, m, d) { Object.assign(st.me, { name, y, m, d }); return meCheck(); },
    stay,
  };
})();
