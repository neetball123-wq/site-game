/* ハズレスキル【合成】 — 画面
   タイトル・語り・道・戦い（記録を順に再生）・報酬・ギルド・宿・出来事・ステータス（装備・合成・試算）・図鑑。 */
(function (G) {
  'use strict';
  const HZ = G.HZ, R = HZ.R, ART = HZ.ART, SND = HZ.SND;
  const KEY = 'hazure.v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let TURBO = false;   // テスト用：待ち時間を0にして、演出の処理だけを通す
  const wait = (ms) => (TURBO ? new Promise((r) => setTimeout(r, 0)) : new Promise((r) => setTimeout(r, ms)));
  const N = HZ.fmt;
  // 戦いの表示は整数で（HPは切り上げ、ダメージは四捨五入。1未満だけ小数）
  const NH = (x) => (x > 0 && x < 1 ? '1' : N(Math.ceil(x - 1e-9)));
  const ND = (x) => (x === Infinity ? '∞' : x < 1 ? N(x) : N(Math.round(x)));
  const view = $('#view'), sheet = $('#sheet'), app = $('#app');

  /* ---------- 保存 ---------- */
  const fresh = () => ({ meta: { clears: 0, far: 0, runs: 0, titles: [], recipes: [], seen: [], best: { hit: 0, combo: 0, deep: 0 }, unlock: [], sound: true, intro: false, infSeen: false }, run: null, pre: null, playMs: 0 });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  S.meta = Object.assign(fresh().meta, S.meta || {});
  let run = S.run || null;
  // 戦いの途中で閉じたら、戦いの前からやりなおす
  if (run && run.phase === 'battle' && S.pre) run = S.pre;
  SND.on = S.meta.sound !== false;
  const save = () => { try { S.run = run; localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* noop */ } };
  setInterval(() => { if (!document.hidden) { S.playMs = (S.playMs || 0) + 5000; save(); } }, 5000);
  const seen = (ids) => { for (const id of ids) if (!S.meta.seen.includes(id)) S.meta.seen.push(id); };

  /* ---------- 小物 ---------- */
  function toast(html, cls) {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }
  const elTag = (s) => s.replace(/〈([^〉]+)〉/g, (m, e) => `<span class="el" style="--c:${HZ.ELCOL[e] || (HZ.STAT.includes(e) ? '#c8d0e0' : '#cfd8e6')}">${esc(e)}</span>`);
  const mainEl = (s) => { const e = HZ.els(s).filter((x) => x !== '無'); return e[0] || HZ.els(s)[0] || '無'; };
  const rankOf = (s) => Math.min(4, s.rank);
  function card(s, opt) {
    opt = opt || {};
    const m = HZ.mul(s);
    const fx = s.fx.map((e) => HZ.fxText(e, m, s)).join('、');
    const notes = [];
    if (s.rep) notes.push(`×${s.rep + 1}回`);
    if (s.drain) notes.push(`吸収${Math.round(s.drain * 100)}%`);
    if (s.tough) notes.push('疲れにくい');
    const base = HZ.SKILLS[s.core];
    const tag = HZ.isHazure(s) ? '<span class="skc-tag hz">ハズレ</span>' : s.parts.length === 1 && base.rare >= 2 ? `<span class="skc-tag r${base.rare}">${base.rare >= 3 ? '伝説' : 'レア'}</span>` : s.parts.length > 1 ? `<span class="skc-tag">合成 ${s.parts.length}</span>` : '';
    const say = opt.say && s.parts.length === 1 && base.say ? `<p class="skc-say">${esc(base.say)}</p>` : opt.say && s.recipeSay ? `<p class="skc-say">${esc(s.recipeSay)}</p>` : '';
    const inner = `<div class="skc-top"><span class="skc-name">${esc(HZ.name(s))}</span>${s.lv > 1 ? `<span class="skc-lv">Lv.${s.lv}</span>` : ''}${tag}</div>
      <p class="skc-trig">${esc(HZ.trigText(s))}</p>
      <p class="skc-fx${fx.length > 120 && !opt.full ? ' long' : ''}">${elTag(esc(fx))}${notes.length ? `<span class="note">（${notes.join('・')}）</span>` : ''}</p>${say}${opt.up ? `<p class="skc-up">${opt.up}</p>` : ''}${opt.ctl || ''}`;
    const attrs = `class="skc ${opt.cls || ''}" data-rank="${rankOf(s)}" style="--el:${HZ.ELCOL[mainEl(s)]}" ${opt.data || ''}`;
    return opt.btn ? `<button type="button" ${attrs}>${inner}</button>` : `<div ${attrs}>${inner}</div>`;
  }
  const cardOf = (id, opt) => card(HZ.make({ uid: 0 }, id), opt);
  const brk = (t) => esc(t).replace(/【([^】]+)】/g, '<span class="br">【$1】</span>');

  /* ---------- 背景・HUD ---------- */
  let bgCh = -1;
  function setBg(ch) {
    if (ch === bgCh) return;
    bgCh = ch;
    $('#bg').innerHTML = ART.scene(ch);
  }
  function hud() {
    const on = run && !['start', 'start2'].includes(run.phase) && view.dataset.s !== 'title';
    $('#hud').hidden = !on;
    if (!on) return;
    $('#h-ch').textContent = R.chapName(run);
    const law = R.lawOf(run);
    $('#h-law').textContent = law ? law.text.replace(/^.*?：/, '') : '';
    $('#h-steps').innerHTML = [...Array(HZ.STEPS)].map((_, i) => `<i class="${i < run.step ? 'done' : ''}${i === run.step ? ' now' : ''}${i === HZ.STEPS - 1 ? ' boss' : ''}"></i>`).join('');
    $('#h-lv').textContent = run.lv;
    $('#h-hp').textContent = `${NH(Math.max(0, run.hp))}/${NH(run.max)}`;
    $('#h-gold').textContent = N(run.gold);
  }

  /* ---------- 画面の切りかえ ---------- */
  let lockUntil = 0;
  const lock = (ms) => { lockUntil = Math.max(lockUntil, performance.now() + ms); };
  const guard = (e) => { if (performance.now() < lockUntil && !TURBO) { e.stopPropagation(); e.preventDefault(); } };
  view.addEventListener('click', guard, true);
  sheet.addEventListener('click', guard, true);
  function show(name, html) {
    lock(300);
    view.dataset.s = name;
    view.innerHTML = html;
    view.scrollTop = 0;
    hud();
  }
  function go() {
    try { route(); }
    catch (err) { report(err); try { title(); } catch (e2) { /* noop */ } }
  }
  function route() {
    closeSheet();
    app.classList.remove('dark');
    if (!run) return title();
    if (run.phase === 'battle' && !(run.node && run.node.foes)) { run.phase = 'map'; R.advance(run, false); }
    setBg(Math.min(run.ch, 99));
    switch (run.phase) {
      case 'start': return pickStart();
      case 'start2': return pickSecond();
      case 'map': return map();
      case 'battle': return preBattle();
      case 'reward': return reward();
      case 'shop': return shop();
      case 'rest': return rest();
      case 'event': return event();
      case 'clear': return ending(true);
      case 'over': return ending(false);
    }
    title();
  }

  /* ---------- タイトル ---------- */
  function title() {
    setBg(0);
    const can = run && run.phase !== 'over';
    show('title', `<section class="title">
      <div class="win title-win">
        <p class="title-kicker">STATUS OPEN</p>
        <h1>ハズレスキル<br><span class="br">【合成】</span></h1>
        <p class="title-sub">異世界アルステラで授かったのは、<br>役に立たないと言われたスキルだった。</p>
      </div>
      <div class="title-btns">
        ${can ? `<button type="button" class="btn" id="t-cont">つづきから <small>${esc(R.chapName(run))}</small></button>` : ''}
        <button type="button" class="btn ${can ? 'ghost' : ''}" id="t-new">はじめから</button>
        <button type="button" class="btn ghost" id="t-dex">図鑑・記録</button>
        <button type="button" class="btn ghost" id="t-how">遊び方</button>
      </div>
      <p class="fiction">本作品はフィクションです。実在の人物・団体・異世界とは関係ありません。</p>
    </section>`);
    if (can) $('#t-cont').onclick = () => { SND.play('sys'); go(); };
    $('#t-new').onclick = () => {
      SND.play('tap');
      if (can) return askBox('いまの旅を捨てて、はじめからにしますか？', 'はじめから', () => newRun());
      newRun();
    };
    $('#t-dex').onclick = () => dex();
    $('#t-how').onclick = () => howTo();
  }
  function newRun(seed) {
    gen++;
    run = R.create(S.meta, seed);
    S.meta.runs++; S.pre = null;
    save();
    if (!S.meta.intro) return prologue();
    go();
  }

  /* ---------- 確認の箱（confirm の代わり） ---------- */
  function askBox(text, ok, fn) {
    openSheet(`<p class="win-h">確認</p><p class="sysmsg">${esc(text)}</p><div class="row end" style="margin-top:14px"><button type="button" class="btn ghost" data-x>やめる</button><button type="button" class="btn" id="ask-ok">${esc(ok)}</button></div>`);
    $('#ask-ok').onclick = () => { closeSheet(); fn(); };
  }

  /* ---------- 語り ---------- */
  async function talk(lines, opt) {
    opt = opt || {};
    show('talk', `<section class="page mid"><div class="win talk"><p class="win-h">${esc(opt.head || 'SYSTEM')}<em><button type="button" class="sysbtn" id="tk-skip">とばす</button></em></p><div id="tk"></div><div class="row end" style="margin-top:12px"><button type="button" class="btn" id="tk-next">つぎへ</button></div></div></section>`);
    $('#hud').hidden = true;
    const box = $('#tk');
    let skip = false;
    $('#tk-skip').onclick = () => { skip = true; next && next(); };
    let next = null;
    const tap = () => new Promise((r) => { next = r; });
    $('#tk-next').onclick = () => next && next();
    for (const L of lines) {
      if (skip) break;
      const p = document.createElement('div');
      if (L.paper) { p.innerHTML = L.paper; SND.play('sys'); }
      else {
        p.className = 'talk-line ' + (L.who === 'sys' ? 'sys' : L.who ? '' : 'narr');
        p.innerHTML = L.who && L.who !== 'sys' ? `<span class="who">${esc(L.who)}</span>${esc(L.t)}` : esc(L.t);
        if (L.who === 'sys') SND.play('sys');
      }
      box.appendChild(p);
      if (L.clear) { await tap(); box.innerHTML = ''; continue; }
      if (!L.go) await tap();
      else await wait(500);
    }
  }
  async function prologue() {
    setBg(0);
    app.classList.add('dark');
    await talk([
      { who: 'sys', t: '魂の転送を確認しました', go: 1 },
      { who: 'sys', t: '転生先：アルステラ（剣と魔法の世界）' },
      { paper: `<div class="paper has-fusen"><h3>決定通知書</h3><dl><dt>世界</dt><dd>アルステラ</dd><dt>種族</dt><dd>人間</dd><dt>スキル</dt><dd>【合成】</dd><dt>記憶</dt><dd>持ち越しあり</dd></dl><div class="stamp">承認</div><div class="fusen">【合成】は別表にないスキルです。規定集にも書いてないので、たぶん大丈夫。いってらっしゃい。<br>——第三窓口 灰原</div></div>`, clear: 1 },
      { t: '目をあけると、石造りのギルドの中だった。' },
      { who: '鑑定士', t: 'ユニークスキル……【合成】？　聞いたことがないな。薬草を混ぜるくらいしかできんだろう。' },
      { who: '剣士', t: '悪いが、役に立たないスキルの持ち主は連れていけない。今日でパーティから外れてくれ。' },
      { t: '仲間たちは振りかえらずに出ていった。手もとには【合成】と、もうひとつ、だれも欲しがらないスキルだけが残った。' },
      { who: 'sys', t: 'ハズレスキルを、ひとつ選んでください' },
    ], { head: 'PROLOGUE' });
    S.meta.intro = true; save();
    go();
  }

  /* ---------- はじめのスキル ---------- */
  function pickStart() {
    setBg(0);
    app.classList.add('dark');
    show('start', `<section class="page mid"><div class="win"><p class="win-h">初期スキルの付与</p><p class="sysmsg">ハズレスキルを、ひとつ選んでください</p><p class="note" style="margin:6px 0 12px">どれも弱い。でも、【合成】すれば話は別。</p>
      <div class="pick3">${run.starters.map((id, i) => cardOf(id, { btn: 1, say: 1, data: `data-i="${i}"` })).join('')}</div></div></section>`);
    $$('[data-i]').forEach((b) => (b.onclick = () => { SND.play('sys'); R.pickStarter(run, run.starters[+b.dataset.i]); seen([run.starter]); save(); go(); }));
  }
  function pickSecond() {
    setBg(0);
    app.classList.add('dark');
    show('start2', `<section class="page mid"><div class="win"><p class="win-h">初期スキルの付与</p><p class="sysmsg">もうひとつ、ふつうのスキルを選べます</p><p class="note" style="margin:6px 0 12px">ギルドが餞別にくれた、駆け出し向けのスキル書。</p>
      <div class="pick3">${run.seconds.map((id, i) => cardOf(id, { btn: 1, data: `data-i="${i}"` })).join('')}</div></div></section>`);
    $$('[data-i]').forEach((b) => (b.onclick = () => {
      SND.play('sys'); R.pickSecond(run, run.seconds[+b.dataset.i]); seen(run.seconds); save();
      if (!S.meta.howSeen) { S.meta.howSeen = true; save(); howTo(true); } else go();
    }));
  }

  /* ---------- 道 ---------- */
  const NODE_IC = { battle: '戦', elite: '強', boss: '主', shop: 'G', rest: '宿', event: '？' };
  const foeNote = (id) => {
    const f = HZ.FOES[id], t = [];
    if (f.weak.length) t.push('弱点 ' + f.weak.join('・'));
    for (const e in f.res) t.push(`${e}${f.res[e] === 0 ? '無効' : '半減'}`);
    return t.join(' ');
  };
  function trText(tr) {
    const t = [];
    if (tr.hard) t.push(`硬さ${tr.hard}（1回ごとに${tr.hard}減らす）`);
    if (tr.split) t.push('分裂する');
    if (tr.regen) t.push(`再生（毎ターン${tr.regen}%）`);
    if (tr.reflect) t.push(`反射（受けたダメージの${tr.reflect}%を返す）`);
    if (tr.mist) t.push('霧（2回に1回よける）');
    if (tr.wet) t.push('いつも濡れている');
    if (tr.seal) t.push('封印（最初の2ターン、いちばん強いスキルを封じる）');
    if (tr.silent) t.push('静寂（「ほかのスキルが発動したとき」が働かない）');
    if (tr.wall) t.push(`鉄壁（1回のダメージは最大HPの${tr.wall}%まで）`);
    if (tr.noburn) t.push('燃えない');
    if (tr.thorn) t.push('とげ（攻撃されるたびに返す）');
    return t;
  }
  function map() {
    const unEq = run.skills.filter((s) => !run.eq.includes(s.u)).length;
    const law = R.lawOf(run);
    const desc = (o) => {
      if (o.foes) return o.foes.map((id) => `${HZ.FOES[id].name}${foeNote(id) ? `<small>（${foeNote(id)}）</small>` : ''}`).join('・');
      if (o.kind === 'shop') return 'スキルの売り買い・スキル書・装備枠の拡張';
      if (o.kind === 'rest') return 'ぐっすり眠るか、スキルを鍛えるか';
      if (o.kind === 'event') return '何かが起きる';
      return '';
    };
    const label = (o) => o.kind === 'boss' ? `主：${HZ.FOES[o.foes[0]].name}` : R.KIND[o.kind];
    show('map', `<section class="page">
      <div class="win"><p class="win-h">QUEST<em>${run.step + 1} / ${HZ.STEPS}</em></p><p class="sysmsg">行き先を選んでください</p>
        ${law ? `<p class="note" style="margin-top:4px;color:var(--gold)">${esc(law.text)}</p>` : ''}
        ${unEq ? `<p class="note" style="margin-top:6px">装備していないスキルが ${unEq} つあります。<button type="button" class="sysbtn" id="m-stat" style="margin-left:6px">ステータスで装備・合成</button></p>` : ''}
        <div class="route" style="margin-top:12px">${run.opts.map((o, i) => `<button type="button" class="node" data-k="${o.kind}" data-i="${i}"><span class="node-ic">${NODE_IC[o.kind]}</span><span class="node-b"><span class="node-k">${esc(label(o))}</span><span class="node-d">${desc(o)}</span></span>${o.foes ? `<span class="node-foes">${o.foes.slice(0, 3).map((id) => ART.foe(id)).join('')}</span>` : ''}</button>`).join('')}</div>
      </div>
      ${tipLine()}
    </section>`);
    $$('.node').forEach((b) => (b.onclick = () => {
      SND.play('tap');
      const o = run.opts[+b.dataset.i];
      R.choose(run, +b.dataset.i);
      save(); go();
    }));
    if ($('#m-stat')) $('#m-stat').onclick = () => statusFresh();
  }
  const TIPS = [
    'スキルは「きっかけ」で自動に発動する。発動がほかのスキルのきっかけになると、連鎖する。',
    '同じターンに同じスキルが発動するたび、効き目は0.7倍。1%を下回るとそのターンは止まる。',
    '合成：きっかけは土台から、効き目は両方から。土台の効き目が先に起きる。',
    '水で濡らしてから火で「蒸発」（2倍）。順番が逆だと「消火」になる。',
    'ステータス画面の「試算」で、装備と合成の結果を先に確かめられる。',
    '連鎖するたびダメージ +5%。スキルを分けておくと、連鎖が長くなる。',
    'ハズレスキルの「くしゃみ」「眠る」「土下座」「食べる」「歌う」は、仲間のスキルのきっかけになる。',
    '装備枠はギルドで増やせる。上限はない。',
  ];
  const tipLine = () => `<p class="tip"><b>TIPS</b>${esc(TIPS[(run.step + run.ch * 3) % TIPS.length])}</p>`;

  /* ---------- 戦いの前 ---------- */
  function preBattle() {
    const foes = R.battleFoes(run);
    const pv = HZ.preview(run, foes, { law: R.lawOf(run) });
    const t1 = pv.stat.dmg, first = foes[0];
    const head = run.node.kind === 'boss' ? 'BOSS' : run.node.kind === 'elite' ? 'ELITE' : 'ENCOUNTER';
    show('pre', `<section class="page mid"><div class="win"><p class="win-h">${head}</p><p class="sysmsg">${run.node.kind === 'boss' ? '主が現れた' : '魔物が現れた'}</p>
      <div class="sk-list" style="margin-top:12px">${foes.map((f) => `<div class="node" style="cursor:default" data-k="${run.node.kind === 'battle' ? 'battle' : run.node.kind}"><span class="node-foes" style="margin:0">${ART.foe(f.id)}</span><span class="node-b"><span class="node-k">${esc(f.name)}</span><span class="node-d">HP ${N(f.hp)}・攻撃 ${N(f.atk)}${foeNote(f.id) ? '・' + foeNote(f.id) : ''}</span>${trText(f.tr).length ? `<span class="node-d" style="color:var(--gold)">${esc(trText(f.tr).join('／'))}</span>` : ''}</span></div>`).join('')}</div>
      <div class="preview" style="margin-top:12px"><p class="note">1ターン目の試算（いまの装備）</p><p><span class="big">${N(t1)}</span> <span class="note">ダメージ・連鎖 ${pv.stat.maxCombo}</span></p><p class="note">${pv.over === 'win' ? '1ターンで倒しきれる見こみ。' : `前の敵の残りHP ${N(Math.max(0, pv.foes.find((f) => f.alive) ? pv.foes.find((f) => f.alive).hp : 0))}`}</p></div>
      <div class="row end" style="margin-top:14px"><button type="button" class="btn ghost" id="pb-stat">ステータス</button><button type="button" class="btn" id="pb-go">戦う</button></div></div></section>`);
    $('#pb-stat').onclick = () => statusFresh(() => preBattle());
    $('#pb-go').onclick = () => { SND.play('sys'); battle(); };
  }

  /* ---------- 戦い（記録を再生する） ---------- */
  let B = null, speed = +(S.meta.speed || 1), gen = 0, skipAll = false;
  let disp = null;
  function battle() {
    S.pre = HZ.clone(run); save();
    B = R.startBattle(run);
    skipAll = false;
    const my = ++gen;
    disp = { foes: B.foes.map((f) => ({ hp: f.hp, max: f.max, sh: 0, st: Object.assign({}, f.st), alive: true })), hp: B.p.hp, max: B.p.max, sh: 0, buf: { 力: B.p.力, 魔: B.p.魔, 硬: 0 } };
    show('battle', `<section class="bt">
      <div class="foes" id="foes"></div>
      <div class="fx" id="fx"></div>
      <div class="combo" id="combo"><b>0</b><span>CHAIN</span></div>
      <div class="me" id="me">
        <div class="me-top"><div class="me-hp"><div class="bar me"><i id="me-bar"></i><b id="me-sh"></b></div><p class="me-num"><span id="me-hp"></span><span class="sh" id="me-shn"></span></p></div>
          <div class="me-buf"><span>力<b id="b-str">0</b></span><span>魔<b id="b-mag">0</b>%</span><span>硬<b id="b-def">0</b></span></div></div>
        <div class="strip" id="strip">${B.sk.map((k, i) => `<span class="sk-mini${k.sealed ? ' sealed' : ''}" data-i="${i}" style="--el:${HZ.ELCOL[mainEl(k.s)]}">${esc(HZ.name(k.s))}</span>`).join('') || '<span class="note">装備しているスキルがない。通常攻撃だけで戦う。</span>'}</div>
        <div class="bt-ctl"><span class="turn" id="bt-turn">TURN 0</span>
          ${[1, 2, 4].map((x) => `<button type="button" class="sysbtn${speed === x ? ' on' : ''}" data-sp="${x}">×${x}</button>`).join('')}
          <button type="button" class="sysbtn" id="bt-skip">結果へ</button><button type="button" class="sysbtn" id="bt-log">記録</button></div>
        <div class="blog" id="blog"></div>
      </div>
    </section>`);
    $('#hud').hidden = false;
    renderFoes(); renderMe();
    $$('[data-sp]').forEach((b) => (b.onclick = () => { speed = +b.dataset.sp; S.meta.speed = speed; $$('[data-sp]').forEach((x) => x.classList.toggle('on', x === b)); }));
    $('#bt-skip').onclick = () => { skipAll = true; };
    $('#bt-log').onclick = () => $('#blog').classList.toggle('open');
    if (B.log.length) { for (const e of B.log) if (e.t === 'seal') blog(`【${HZ.name(B.sk[e.i].s)}】が封印された（2ターン）`); B.log = []; }
    loop(my);
  }
  // 表示用の敵の状態。分裂・召喚で増えた敵のぶんがまだなければ、その場で作る（ないまま読むと戦いが止まる）
  function dOf(i) {
    if (!disp.foes[i]) { const f = B.foes[i]; disp.foes[i] = { hp: f ? f.max : 0, max: f ? f.max : 1, sh: 0, st: {}, alive: !!f }; }
    return disp.foes[i];
  }
  function renderFoes() {
    const box = $('#foes');
    if (!box) return;
    box.innerHTML = B.foes.map((f, i) => {
      const d = dOf(i);
      return `<div class="foe${f.boss ? ' boss' : ''}${d.alive ? '' : ' dead'}" data-f="${i}"><p class="foe-intent"></p>${ART.foe(f.id, f.name)}<p class="foe-name">${esc(f.name)}</p><div class="bar"><i></i><b></b></div><p class="foe-hp"></p><div class="chips"></div></div>`;
    }).join('');
    B.foes.forEach((f, i) => { updFoe(i); intent(i); });
  }
  function updFoe(i) {
    const el = $(`[data-f="${i}"]`);
    if (!el || !B.foes[i]) return;
    const d = dOf(i);
    $('.bar i', el).style.width = Math.max(0, Math.min(100, d.hp / d.max * 100)) + '%';
    $('.bar b', el).style.width = Math.min(100, d.sh / d.max * 100) + '%';
    $('.foe-hp', el).textContent = `${NH(Math.max(0, d.hp))} / ${NH(d.max)}`;
    $('.chips', el).innerHTML = HZ.STAT.filter((k) => d.st[k] > 0.05).map((k) => `<span class="chip ${k}">${k}${k === '凍結' || k === '濡れ' && d.st[k] <= 1 ? '' : ' ' + N(d.st[k])}</span>`).join('');
    el.classList.toggle('frozen', d.st.凍結 > 0);
    el.classList.toggle('dead', !d.alive);
  }
  function intent(i) {
    const el = $(`[data-f="${i}"] .foe-intent`), f = B.foes[i];
    if (!el) return;
    if (!f || !f.alive || !dOf(i).alive) { el.textContent = ''; return; }
    const it = HZ.intent(f);
    el.textContent = it.text + (it.dmg ? ' ' + ND(it.dmg) + (it.n ? '×' + it.n : '') : '');
  }
  function renderMe() {
    const d = disp;
    $('#me-bar').style.width = Math.max(0, Math.min(100, d.hp / d.max * 100)) + '%';
    $('#me-sh').style.width = Math.min(100, d.sh / d.max * 100) + '%';
    $('#me-hp').textContent = `HP ${NH(Math.max(0, d.hp))} / ${NH(d.max)}`;
    $('#me-shn').textContent = d.sh >= 0.5 ? `盾 ${ND(d.sh)}` : '';
    $('#b-str').textContent = N(d.buf.力 || 0);
    $('#b-mag').textContent = N(d.buf.魔 || 0);
    $('#b-def').textContent = N(d.buf.硬 || 0);
  }
  function blog(t) {
    const b = $('#blog');
    if (!b) return;
    const p = document.createElement('p');
    p.textContent = t;
    b.appendChild(p);
    while (b.children.length > 80) b.firstChild.remove();
    b.scrollTop = b.scrollHeight;
  }
  function pos(i) {
    const fx = $('#fx'), el = i === 'p' ? $('#me') : $(`[data-f="${i}"] .spr`);
    if (!fx || !el) return { x: 50, y: 50 };
    const a = fx.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - a.left + b.width / 2 + (Math.random() - 0.5) * b.width * 0.5, y: b.top - a.top + (i === 'p' ? -10 : b.height * 0.25 + (Math.random() - 0.5) * 20) };
  }
  const stack = {};
  // 1ターンに画面へ出す数字・文字の数（連鎖が数千回になっても重くならないように）
  let popBudget = 60, wordBudget = 14;
  function pop(i, text, cls, col) {
    const fx = $('#fx');
    if (!fx || popBudget-- <= 0) return;
    const p = pos(i), n = document.createElement('div');
    const now = performance.now(), st = stack[i] && now - stack[i].t < 450 ? stack[i] : { k: 0 };
    p.y -= (st.k % 4) * 22; stack[i] = { t: now, k: st.k + 1 };
    n.className = 'num ' + (cls || '');
    n.style.left = p.x + 'px'; n.style.top = p.y + 'px';
    if (col) n.style.setProperty('--c', col);
    n.textContent = text;
    fx.appendChild(n);
    setTimeout(() => n.remove(), 950);
  }
  function word(i, text, col, cls) {
    const fx = $('#fx');
    if (!fx || wordBudget-- <= 0) return;
    const p = pos(i), n = document.createElement('div');
    n.className = cls || 'react';
    n.style.left = p.x + 'px'; n.style.top = (p.y - 20) + 'px';
    n.style.setProperty('--c', col || '#fff');
    n.textContent = text;
    fx.appendChild(n);
    setTimeout(() => n.remove(), 1600);
  }
  function banner(text, col) {
    const bt = $('.bt');
    if (!bt) return;
    const n = document.createElement('div');
    n.className = 'banner'; n.textContent = text; n.style.setProperty('--c', col || 'var(--cy)');
    bt.appendChild(n);
    setTimeout(() => n.remove(), 1700);
  }
  const RCOL = { 蒸発: '#ffb04a', 融解: '#ffd0a0', 炎上: '#ff5a2a', 感電: '#ffe04a', 凍結: '#bfefff', 粉砕: '#d2a565', 拡散: '#6fe3a1', 消火: '#8fb0c8' };
  const BASE = { turn: 260, fire: 70, dmg: 60, react: 200, kill: 220, act: 240, hurt: 120, heal: 50, sh: 40, st: 15, frozen: 260, miss: 60, spawn: 200, phase: 900, exe: 250, dot: 90, emit: 30, inf: 1600 };
  async function playLog(log, my) {
    const n = log.length;
    const scale = n > 70 ? 70 / n : 1;
    popBudget = 60; wordBudget = 14;
    let debt = 0;
    for (let k = 0; k < n; k++) {
      if (my !== gen) return;
      const e = log[k];
      const fast = skipAll;
      try { apply(e, fast, scale, k, n); } catch (err) { report(err); }
      if (fast) continue;
      debt += (BASE[e.t] || 0) * (scale < 1 && e.t !== 'react' && e.t !== 'kill' && e.t !== 'phase' && e.t !== 'inf' ? scale : 1) / speed;
      if (debt >= 16) { await wait(debt); debt = 0; }
    }
    if (debt > 0 && !skipAll) await wait(debt);
  }
  function apply(e, fast, scale, k, n) {
    const d = disp;
    switch (e.t) {
      case 'turn':
        if (!fast) { const c = $('#combo'); c.classList.remove('on'); $('#bt-turn').textContent = 'TURN ' + e.n; }
        blog(`― ターン ${e.n} ―`);
        break;
      case 'fire': {
        if (fast) break;
        const el = $(`.sk-mini[data-i="${e.i}"]`);
        if (el) { el.classList.add('lit'); setTimeout(() => el.classList.remove('lit'), 180); }
        const c = $('#combo');
        if (e.combo >= 2) { $('b', c).textContent = e.combo; c.classList.add('on'); c.classList.remove('pump'); void c.offsetWidth; c.classList.add('pump'); }
        SND.play('fire');
        if (scale >= 0.5 || k % 10 === 0) blog(`【${HZ.name(B.sk[e.i].s)}】${e.f < 0.99 ? `（疲れ ${Math.round(e.f * 100)}%）` : ''}`);
        break;
      }
      case 'atk': if (!fast && scale >= 0.5) blog('通常攻撃'); break;
      case 'dmg': {
        const f = d.foes[e.to]; if (!f) break;
        f.hp = e.hp !== undefined ? e.hp : f.hp - e.amt; if (e.sh !== undefined) f.sh = e.sh;
        if (fast) break;
        updFoe(e.to);
        const ratio = e.amt / f.max;
        if (e.amt < 0.05) { if (scale >= 0.5 && !(B.foes[e.to].tr.hard)) pop(e.to, '無効', 'miss'); break; }   // 効かない攻撃は数字を出さない
        if (scale >= 0.4 || ratio > 0.04 || k % Math.ceil(1 / scale) === 0) {
          pop(e.to, ND(e.amt), ratio >= 0.5 || e.amt >= 1e6 ? 'huge' : ratio >= 0.15 ? 'big' : '', HZ.ELCOL[e.el]);
          const el = $(`[data-f="${e.to}"]`); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
          SND.play(ratio >= 0.3 ? 'big' : 'hit');
        }
        break;
      }
      case 'miss': if (!fast) pop(e.to, 'MISS', 'miss'); break;
      case 'react': if (!fast) { word(e.to, e.r, RCOL[e.r]); SND.play('react'); } blog(`反応「${e.r}」`); break;
      case 'st': { const f = d.foes[e.to]; if (f) { f.st[e.st] = e.v !== undefined ? e.v : (f.st[e.st] || 0) + e.n; if (!fast) updFoe(e.to); } break; }
      case 'dot': { const f = d.foes[e.to]; if (f) { f.hp = e.hp; f.st[e.st] = e.v; if (!fast) { updFoe(e.to); pop(e.to, ND(e.amt), '', e.st === '毒' ? HZ.ELCOL.毒 : HZ.ELCOL.火); } } break; }
      case 'kill': { const f = d.foes[e.to]; if (f) { f.alive = false; f.hp = 0; if (!fast) updFoe(e.to); } blog(`${B.foes[e.to].name}を倒した`); break; }
      case 'spawn': d.foes[e.to] = { hp: B.foes[e.to].max, max: B.foes[e.to].max, sh: 0, st: {}, alive: true }; if (!fast) renderFoes(); blog(`${B.foes[e.to].name}が現れた`); break;
      case 'phase': d.foes[e.to] = { hp: B.foes[e.to].max, max: B.foes[e.to].max, sh: 0, st: {}, alive: true }; if (!fast) { renderFoes(); banner('真の姿', '#ff3a5a'); SND.play('big'); } blog('魔王が、真の姿を現した'); break;
      case 'exe': if (!fast) word(e.to, 'とどめ', '#b98cff'); break;
      case 'act': {
        if (!fast) { const el = $(`[data-f="${e.f}"] .foe-intent`); if (el) el.textContent = e.text; }
        blog(`${B.foes[e.f].name}の${e.text}`);
        break;
      }
      case 'frozen': if (!fast) word(e.to, '動けない', '#bfefff', 'num miss'); blog(`${B.foes[e.to].name}は凍って動けない`); break;
      case 'hurt': {
        d.hp = e.hp; d.sh = e.sh;
        if (fast) break;
        renderMe();
        if (e.amt - e.blocked >= 0.5) { pop('p', '-' + ND(e.amt - e.blocked), '', '#ff5a6a'); const m = $('#me'); m.classList.remove('hurt'); void m.offsetWidth; m.classList.add('hurt'); SND.play('hurt'); }
        else if (e.blocked > 0) pop('p', '防いだ', 'miss');
        break;
      }
      case 'heal': d.hp = e.hp; if (e.max) d.max = e.max; if (!fast) { renderMe(); if (e.amt >= 0.5 && scale >= 0.4) pop('p', '+' + ND(e.amt), 'heal'); } break;
      case 'sh': d.sh = e.sh; if (!fast) renderMe(); break;
      case 'buf': if (e.v !== undefined) d.buf[e.s] = e.v; if (!fast) renderMe(); break;
      case 'maxhp': d.hp = e.hp; d.max = e.max; if (!fast) renderMe(); break;
      case 'emit': if (!fast && scale >= 0.5) { const t = { sneeze: 'くしゃみ！', sleep: 'すやぁ', bow: '土下座', eat: 'もぐもぐ', song: '♪', pick: '拾った', count: '10！' }[e.ev]; if (t) word('p', t, '#e9f5ff', 'num miss'); } blog(HZ.EMIT[e.ev] ? HZ.EMIT[e.ev].replace(/する$/, 'した').replace(/う$/, 'った') : e.ev === 'count' ? '10数えた' : e.ev); break;
      case 'steal': if (!fast) toast(`お金を ${N(e.n)} 盗まれた`); break;
      case 'fheal': { const f = d.foes[e.to]; if (f) { f.hp = e.hp; if (!fast) updFoe(e.to); } break; }
      case 'fsh': { const f = d.foes[e.to]; if (f) { f.sh = e.sh; if (!fast) updFoe(e.to); } break; }
      case 'rage': blog('敵がいきり立っている（攻撃力 1.25倍）'); break;
      case 'inf': if (!fast) { banner('∞', '#fff'); SND.play('inf'); app.classList.add('inf'); setTimeout(() => app.classList.remove('inf'), 1200); } blog('連鎖が、世界の処理をこえた'); break;
      case 'win': case 'lose': break;
    }
  }
  function sync() {
    // ターンの終わりに、表示を本当の状態にそろえる
    B.foes.forEach((f, i) => { disp.foes[i] = { hp: Math.max(0, f.hp), max: f.max, sh: f.sh, st: Object.assign({}, f.st), alive: f.alive }; });
    disp.hp = B.p.hp; disp.max = B.p.max; disp.sh = B.p.sh; disp.buf = { 力: B.p.力, 魔: B.p.魔, 硬: B.p.硬 };
    if ($('#foes')) { if ($$('.foe').length !== B.foes.length) renderFoes(); else B.foes.forEach((f, i) => { updFoe(i); intent(i); }); }
    if ($('#me')) renderMe();
    B.sk.forEach((k, i) => { const el = $(`.sk-mini[data-i="${i}"]`); if (el) el.classList.toggle('sealed', !!(k.sealed && B.t < k.sealed)); });
  }
  async function loop(my) {
    await wait(350);
    while (!B.over && B.t < 60) {
      if (my !== gen) return;
      B.log = [];
      try { HZ.turn(B); }
      catch (err) {
        // 計算の不具合で止まらないように、この戦いは勝ちとして先へ進める
        report(err); B.over = 'win'; B.log = []; toast('処理に失敗したため、この戦いは勝ちとして進めます'); break;
      }
      await playLog(B.log, my);
      if (my !== gen) return;
      try { sync(); } catch (err) { report(err); }
      if (!skipAll && !B.over) await wait(380 / speed);
    }
    if (my !== gen) return;
    if (!B.over) B.over = 'lose';
    finish(my);
  }
  async function finish(my) {
    const win = B.over === 'win';
    try { sync(); } catch (err) { report(err); }
    banner(win ? '勝利' : '敗北', win ? '#ffd36b' : '#ff5a6a');
    SND.play(win ? 'win' : 'lose');
    let res = {};
    try { res = R.endBattle(run, B) || {}; } catch (err) { report(err); if (run.phase === 'battle') { run.phase = 'map'; R.advance(run, false); } }
    S.pre = null;
    const m = S.meta;
    m.best.hit = Math.max(m.best.hit, run.stats.maxHit);
    m.best.combo = Math.max(m.best.combo, run.stats.maxCombo);
    m.far = Math.max(m.far, R.k(run) + (win ? 1 : 0));
    for (const t of run.titles) if (!m.titles.includes(t)) m.titles.push(t);
    if (res.clear) { m.clears++; if (!m.unlock.includes('clear1')) m.unlock.push('clear1'); }
    if (R.deep(run)) m.best.deep = Math.max(m.best.deep || 0, run.ch - HZ.CHAPTERS.length + 1);
    if (run.reward) seen(run.reward.choices);
    save();
    await wait(1300);
    if (my !== gen) return;
    if (B.inf) await infTalk();
    go();
  }
  async function infTalk() {
    if (S.meta.infSeen) { toast('称号【理の外】'); return; }
    S.meta.infSeen = true; save();
    await talk([
      { who: 'sys', t: '警告：この世界の処理が、追いつきません' },
      { t: '景色が、白いまま止まった。風も、魔物も、落ちていく火の粉も。' },
      { who: '灰原', t: '……あ、つながった。女神課 転生係、第三窓口の灰原です。' },
      { who: '灰原', t: 'そっちの世界の処理が止まってるって、上から連絡があって。……スキル、いくつ合成したの？' },
      { who: '灰原', t: '規定集には「合成は二つまで」なんて書いてないから、違反ではないんだけど。課長は、いい顔しないと思うな。' },
      { who: '灰原', t: 'まあ、いいか。きみが楽しそうだから。——処理、もどしておくね。' },
      { who: 'sys', t: '称号【理の外】を獲得しました' },
    ], { head: 'CALL' });
  }

  /* ---------- 報酬 ---------- */
  function reward() {
    const rw = run.reward, res = rw.res || {};
    const lines = [];
    if (rw.kind !== 'event') {
      if (res.gold) lines.push(`お金 +${N(res.gold)}`);
      for (const lv of res.lvUp || []) lines.push(`<span class="t">レベルが ${lv} に上がりました（最大HP +8・攻撃 +1）</span>`);
      if (res.slot) lines.push('<span class="t">装備枠が 1 増えました</span>');
      for (const t of res.titles || []) lines.push(`<span class="t">称号【${esc(HZ.TITLES[t].name)}】を獲得しました</span>　<small class="note">${esc(HZ.TITLES[t].perk)}</small>`);
    }
    if ((res.lvUp || []).length) setTimeout(() => SND.play('lvup'), 200);
    show('reward', `<section class="page">
      ${rw.kind !== 'event' ? `<div class="win"><p class="win-h">RESULT</p><p class="sysmsg">戦闘に勝利しました</p><div class="gain" style="margin-top:8px">${lines.map((l) => `<p>${l}</p>`).join('')}</div></div>` : ''}
      <div class="win"><p class="win-h">SKILL</p><p class="sysmsg">スキルをひとつ選んでください</p>
        <div class="pick3" style="margin-top:10px">${rw.choices.map((id, i) => { const same = R.sameOf(run, id); return cardOf(id, { btn: 1, say: 1, data: `data-i="${i}"`, up: same ? `持っている【${esc(HZ.name(same))}】が Lv.${same.lv} → ${same.lv + 1}` : '' }); }).join('')}</div>
        <div class="row end" style="margin-top:12px"><button type="button" class="btn ghost" id="rw-skip">受け取らない（お金 +6）</button></div></div>
    </section>`);
    $$('[data-i]').forEach((b) => (b.onclick = () => {
      const r = R.takeReward(run, +b.dataset.i);
      if (!r) return;
      SND.play('sys');
      toast(r.up ? `【${esc(HZ.name(r.s))}】が Lv.${r.s.lv} になりました` : `スキル【${esc(HZ.name(r.s))}】を習得しました${run.eq.includes(r.s.u) ? '' : '<br><small>装備枠がいっぱい。ステータスで装備か合成を</small>'}`);
      save(); go();
    }));
    $('#rw-skip').onclick = () => { R.skipReward(run); SND.play('coin'); save(); go(); };
  }

  /* ---------- ギルド ---------- */
  function shop() {
    const sh = run.shop;
    const pr = (k, i) => R.price(run, k, i);
    show('shop', `<section class="page">
      <div class="win"><p class="win-h">GUILD<em>所持金 ${N(run.gold)} G</em></p><p class="sysmsg">ギルド売店へようこそ</p>
        <div class="sk-list" style="margin-top:10px">${sh.items.map((it, i) => { const same = R.sameOf(run, it.id); return `<div class="shop-item">${cardOf(it.id, { up: same ? `持っている【${esc(HZ.name(same))}】が Lv.${same.lv} → ${same.lv + 1}` : '' })}<button type="button" class="price" data-buy="${i}" ${it.sold || run.gold < pr('skill', i) ? 'disabled' : ''}>${it.sold ? '売り切れ' : N(pr('skill', i)) + '<small>G</small>'}</button></div>`; }).join('')}</div>
        <p class="sec-h">サービス</p>
        <div class="svc">
          <button type="button" data-svc="book" ${run.gold < pr('book') ? 'disabled' : ''}><b>スキル書</b><span>好きなスキルを Lv +1（効き目 1.5倍）</span><i>${N(pr('book'))} G</i></button>
          <button type="button" data-svc="slot" ${run.gold < pr('slot') ? 'disabled' : ''}><b>装備枠の拡張</b><span>装備できるスキル +1（いま ${run.slots}）。何度でも</span><i>${N(pr('slot'))} G</i></button>
          <button type="button" data-svc="heal" ${run.gold < pr('heal') || run.hp >= run.max ? 'disabled' : ''}><b>回復薬</b><span>HP を全回復</span><i>${N(pr('heal'))} G</i></button>
          <button type="button" data-svc="tonic" ${run.gold < pr('tonic') ? 'disabled' : ''}><b>疲れ知らずの薬</b><span>すべてのスキルが疲れにくくなる（+1%）。何度でも</span><i>${N(pr('tonic'))} G</i></button>
          <button type="button" data-svc="reroll" ${run.gold < pr('reroll') ? 'disabled' : ''}><b>品ぞろえを入れかえる</b><span>並んでいるスキル書を新しくする</span><i>${N(pr('reroll'))} G</i></button>
          <button type="button" data-svc="stat"><b>ステータス</b><span>装備・合成・スキルを売る</span></button>
        </div>
        <div class="row end" style="margin-top:14px"><button type="button" class="btn" id="sh-out">ギルドを出る</button></div></div>
    </section>`);
    $$('[data-buy]').forEach((b) => (b.onclick = () => {
      const r = R.buy(run, 'skill', +b.dataset.buy);
      if (!r) { SND.play('bad'); return; }
      SND.play('coin'); seen([sh.items[+b.dataset.buy].id]);
      toast(r.up ? `【${esc(HZ.name(r.s))}】が Lv.${r.s.lv} になりました` : `スキル【${esc(HZ.name(r.s))}】を習得しました`);
      save(); shop();
    }));
    $$('[data-svc]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.svc;
      if (k === 'stat') return statusFresh(() => shop());
      if (k === 'book') return chooseSkill('スキル書を使うスキルを選んでください', (u) => { const s = R.buy(run, 'book', 0, u); if (s) { SND.play('lvup'); toast(`【${esc(HZ.name(s))}】が Lv.${s.lv} になりました`); save(); } shop(); });
      const r = R.buy(run, k);
      if (!r) { SND.play('bad'); return; }
      SND.play(k === 'reroll' ? 'tap' : 'coin');
      if (k === 'slot') toast(`装備枠が ${run.slots} になりました`);
      if (k === 'tonic') toast(`疲れにくさ ${Math.round(Math.min(1, HZ.TOUGH + run.tonic * 0.01) * 100)}%`);
      save(); shop();
    }));
    $('#sh-out').onclick = () => { R.leaveShop(run); SND.play('tap'); save(); go(); };
  }
  function chooseSkill(text, fn, list) {
    const sks = list || run.skills;
    openSheet(`<p class="win-h">SELECT</p><p class="sysmsg">${esc(text)}</p><div class="sk-list" style="margin-top:10px">${sks.map((s) => card(s, { btn: 1, data: `data-u="${s.u}"` })).join('')}</div><div class="row end" style="margin-top:12px"><button type="button" class="btn ghost" data-x>やめる</button></div>`);
    $$('[data-u]', sheet).forEach((b) => (b.onclick = () => { closeSheet(); fn(+b.dataset.u); }));
  }

  /* ---------- 宿 ---------- */
  function rest() {
    show('rest', `<section class="page mid"><div class="win"><p class="win-h">INN</p><p class="sysmsg">宿屋に泊まった</p><p class="note" style="margin:6px 0 12px">HP ${N(run.hp)} / ${N(run.max)}</p>
      <div class="svc"><button type="button" id="r-sleep"><b>ぐっすり眠る</b><span>HP を全回復する</span></button><button type="button" id="r-train"><b>鍛錬する</b><span>スキルをひとつ Lv +1。HP は3割だけ回復</span></button></div></div></section>`);
    $('#r-sleep').onclick = () => { R.rest(run, 'sleep'); SND.play('sys'); toast('HP が全回復した'); save(); go(); };
    $('#r-train').onclick = () => chooseSkill('鍛えるスキルを選んでください', (u) => { R.rest(run, 'train', u); SND.play('lvup'); const s = R.sk(run, u); toast(`【${esc(HZ.name(s))}】が Lv.${s.lv} になりました`); save(); go(); });
  }

  /* ---------- 出来事 ---------- */
  function event() {
    const E = R.eventOf(run), done = run.event.done;
    show('event', `<section class="page mid"><div class="win"><p class="win-h">EVENT</p><p class="sysmsg">${esc(E.title)}</p><p class="talk-line" style="margin-top:8px">${esc(E.text)}</p>
      ${done ? `<p class="talk-line" style="color:var(--gold)">${esc(done.text)}</p><div class="row end" style="margin-top:12px"><button type="button" class="btn" id="ev-go">${done.battle ? '戦う' : done.skill ? 'スキルを選ぶ' : '進む'}</button></div>`
        : `<div class="sk-list" style="margin-top:12px">${E.opts.map((o, i) => { const ok = R.canOpt(run, o); const why = !ok ? (o.need && !run.skills.some((s) => s.parts.includes(o.need)) ? `【${HZ.SKILLS[o.need].name}】が必要` : 'お金が足りない') : ''; return `<button type="button" class="node" data-i="${i}" ${ok ? '' : 'disabled'}><span class="node-b"><span class="node-k">${esc(o.t)}</span>${why ? `<span class="node-d">${why}</span>` : ''}</span></button>`; }).join('')}</div>`}
    </div></section>`);
    if (done) $('#ev-go').onclick = () => { R.leaveEvent(run); save(); go(); };
    else $$('[data-i]').forEach((b) => (b.onclick = () => { const r = R.resolve(run, +b.dataset.i); if (!r) return; SND.play('sys'); save(); hud(); event(); }));
  }

  /* ---------- 終わり（クリア・力尽きた） ---------- */
  function ending(clear) {
    app.classList.add('dark');
    const ln = R.lnTitle(run);
    const top = R.topSkill(run);
    const topS = run.skills.find((s) => HZ.name(s) === top.name);
    const el = topS ? mainEl(topS) : '無';
    const kills = Object.values(run.stats.kills).reduce((a, b) => a + b, 0);
    const deep = R.deep(run);
    show('end', `<section class="page">
      <div class="win"><p class="win-h">${clear ? 'CLEAR' : 'GAME OVER'}</p><p class="sysmsg">${clear ? (deep ? '深淵の主を倒しました' : '魔王を倒しました') : 'HPが0になりました'}</p>
        <p class="note" style="margin:6px 0 12px">${clear ? 'この冒険は、書籍化が決まったらしい。' : 'この冒険も、本になるらしい。'}</p>
        <div class="ln"><div class="ln-art">${ART.cover(el)}</div><p class="ln-main">${brk(ln.main)}</p><p class="ln-sub">〜${esc(ln.sub)}〜</p><div class="ln-foot"><span>著：あなた</span><span>Lv.${run.lv}</span></div><p class="ln-obi">${clear ? '書籍化決定！　続刊（深淵編）も好評連載中' : run.cleared ? '深淵編、ここで打ち切り' : '次の巻が出るかは、未定'}</p></div>
        <div class="row center" style="margin-top:10px"><button type="button" class="sysbtn" id="en-copy">題名をコピー</button></div>
        <p class="sec-h">この旅の記録</p>
        <div class="rec"><div>最大ダメージ<b>${ND(run.stats.maxHit)}</b></div><div>最大連鎖<b>${run.stats.maxCombo}</b></div><div>合成した回数<b>${run.stats.fuses}</b></div><div>倒した魔物<b>${kills}</b></div><div>いちばん働いたスキル<b style="font-size:12px;font-family:var(--body)">【${esc(top.name || '―')}】</b></div><div>到達<b style="font-size:12px;font-family:var(--body)">${esc(R.chapName(run))}</b></div></div>
        <div class="row end" style="margin-top:14px">
          <button type="button" class="btn ghost" id="en-title">タイトルへ</button>
          ${clear ? '<button type="button" class="btn gold" id="en-deep">深淵へ進む（上限なし）</button>' : '<button type="button" class="btn" id="en-new">もう一度</button>'}
        </div></div>
    </section>`);
    $('#en-copy').onclick = () => {
      const t = `${ln.main}　〜${ln.sub}〜`;
      const done = () => toast('題名をコピーしました');
      try { navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t)); } catch (e) { fallbackCopy(t); }
    };
    $('#en-title').onclick = () => { if (!clear) { run = null; save(); } title(); };
    if (clear) $('#en-deep').onclick = () => { R.endless(run); SND.play('sys'); save(); toast('<b>深淵</b>。ここから先に、上限はない。', 'gold'); go(); };
    else $('#en-new').onclick = () => newRun();
  }
  function fallbackCopy(t) {
    openSheet(`<p class="win-h">COPY</p><p class="note">長押しして、コピーしてください。</p><textarea readonly style="width:100%;height:90px;margin-top:8px;font-size:16px;background:#0a1424;color:#e9f5ff;border:1px solid var(--line)">${esc(t)}</textarea><div class="row end" style="margin-top:10px"><button type="button" class="btn ghost" data-x>閉じる</button></div>`);
    const ta = $('textarea', sheet); ta.focus(); ta.select();
  }

  /* ---------- 下の窓 ---------- */
  let onClose = null;
  function openSheet(html, after) {
    lock(200);
    sheet.innerHTML = `<div class="win sheet-in">${html}</div>`;
    sheet.hidden = false;
    onClose = after || null;
    $$('[data-x]', sheet).forEach((b) => (b.onclick = () => closeSheet(true)));
  }
  function closeSheet(user) {
    if (sheet.hidden) return;
    sheet.hidden = true; sheet.innerHTML = '';
    const f = onClose; onClose = null;
    if (user && f) f();
  }
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(true); });

  /* ---------- ステータス（装備・合成・試算） ---------- */
  const dummies = () => {
    const k = R.k(run);
    return [0, 1].map(() => { const f = HZ.foeStats('slime', k); f.name = 'かかし'; f.id = 'kakashi'; f.hp = f.max = 1e300; f.weak = []; f.act = ['sh']; return f; });
  };
  function trial(r) {
    const B2 = HZ.preview(r, dummies(), {});
    const per = B2.sk.map((k) => ({ s: k.s, dmg: k.dmg, fires: k.fires })).sort((a, b) => b.dmg - a.dmg);
    // 3ターン
    const B3 = HZ.newBattle(HZ.clone({ hp: r.hp, max: r.max, atk: r.atk, gold: r.gold, titles: r.titles, eq: r.eq, skills: r.skills, tonic: r.tonic }), dummies(), {});
    B3.p.hp = 1e300;
    for (let i = 0; i < 3; i++) { B3.log = []; HZ.turn(B3); }
    return { t1: B2.stat.dmg, combo: B2.stat.maxCombo, reacts: Object.keys(B2.stat.reacts), per, t3: B3.stat.dmg, inf: B2.inf || B3.inf };
  }
  let fz = null;   // 合成の選択中 { a: 土台, b: 素材 }
  // 外から開くときは、選びかけの合成を取り消す
  const statusFresh = (back) => { fz = null; openStatus(back); };
  function openStatus(back) {
    // 選びかけの合成のスキルが、もう手元にないとき（売った・合成した・旅が変わった）は取り消す
    if (fz && (!R.sk(run, fz.a) || (fz.b && !R.sk(run, fz.b)))) fz = null;
    const after = back || (() => go());
    const tr = trial(run);
    const eq = R.eqSkills(run), box = run.skills.filter((s) => !run.eq.includes(s.u));
    const ctl = (s, on) => fz ? '' : `<div class="skc-ctl">${on ? `<button type="button" class="sysbtn" data-up="${s.u}">↑</button><button type="button" class="sysbtn" data-dn="${s.u}">↓</button><button type="button" class="sysbtn" data-eq="${s.u}">外す</button>` : `<button type="button" class="sysbtn" data-eq="${s.u}" ${run.eq.length >= run.slots ? 'disabled' : ''}>装備する</button>`}<button type="button" class="sysbtn" data-fz="${s.u}">合成の土台にする</button>${!on ? `<button type="button" class="sysbtn" data-sell="${s.u}">売る（${R.sellPrice(run, s.u)}G）</button>` : ''}</div>`;
    const pick = (s) => fz ? `data-pk="${s.u}"` : '';
    const cls = (s) => fz && fz.a === s.u ? 'base' : fz && fz.b === s.u ? 'sel' : '';
    const titles = run.titles.map((t) => HZ.TITLES[t]).filter(Boolean);
    let fuseHtml = '';
    if (fz) {
      const a = R.sk(run, fz.a);
      if (fz.b) {
        const pv = R.fusePreview(run, fz.a, fz.b);
        const c = HZ.clone(run); R.fuse(c, fz.a, fz.b);
        const tr2 = trial(c);
        const d = tr2.t3 - tr.t3;
        const rate = HZ.fuseRate(run, a, R.sk(run, fz.b));
        const rc = HZ.recipeOf(a, R.sk(run, fz.b));
        if (rc) pv.recipeSay = rc[4];
        if (rc && !S.meta.recipes.includes(rc[2])) pv.root = '？？？';   // はじめての隠しレシピは、合成するまで名前を伏せる
        fuseHtml = `<div class="fuse-bar"><p class="fuse-steps">土台 <b>【${esc(HZ.name(a))}】</b> ＋ 素材 <b>【${esc(HZ.name(R.sk(run, fz.b)))}】</b>${rate.reso ? '　<span style="color:var(--gold)">属性共鳴 ×1.2</span>' : ''}${rc && !S.meta.recipes.includes(rc[2]) ? '　<span style="color:var(--r3)">……なにか起きそうだ</span>' : ''}</p>
          ${card(pv, { full: 1, say: !!rc && S.meta.recipes.includes(rc[2]) })}
          <p class="note" style="margin-top:6px">3ターンの試算：${N(tr.t3)} → <b class="${d >= 0 ? 'diff-up' : 'diff-dn'}">${N(tr2.t3)}</b>（${d >= 0 ? '+' : '−'}${N(Math.abs(d))}）　連鎖 ${tr.combo} → ${tr2.combo}</p>
          <div class="row end" style="margin-top:8px"><button type="button" class="sysbtn" id="fz-cancel">やめる</button><button type="button" class="sysbtn" id="fz-swap">土台と素材を入れかえる</button><button type="button" class="btn gold" id="fz-go">合成する</button></div></div>`;
      } else fuseHtml = `<div class="fuse-bar"><p class="fuse-steps">土台 <b>【${esc(HZ.name(a))}】</b>　——　素材にするスキルを選んでください。</p><p class="note">きっかけは土台から、効き目は両方から（土台が先）。素材の効き目は ×1.2。</p><div class="row end" style="margin-top:8px"><button type="button" class="sysbtn" id="fz-cancel">やめる</button></div></div>`;
    }
    openSheet(`<button type="button" class="sysbtn sheet-close" data-x>閉じる</button><p class="win-h">STATUS</p>
      <div class="stat-grid"><div><span>レベル</span><b>${run.lv}</b></div><div><span>HP</span><b>${N(run.hp)}/${N(run.max)}</b></div><div><span>攻撃</span><b>${N(run.atk)}</b></div><div><span>お金</span><b>${N(run.gold)}</b></div></div>
      <div class="preview" style="margin-top:10px"><p class="note">試算（かかし2体・いまの装備）</p><div class="row"><p><span class="big">${tr.inf ? '∞' : N(tr.t1)}</span> <span class="note">1ターン目</span></p><p><b>${tr.inf ? '∞' : N(tr.t3)}</b> <span class="note">3ターン合計</span></p><p><b>${tr.combo}</b> <span class="note">連鎖</span></p></div>
        ${tr.reacts.length ? `<p class="note">反応：${tr.reacts.join('・')}</p>` : ''}
        ${tr.per.slice(0, 4).filter((x) => x.fires).map((x) => `<p class="pv-sk"><span>【${esc(HZ.name(x.s))}】 ${x.fires}回</span><b>${N(x.dmg)}</b></p>`).join('')}</div>
      <p class="sec-h">装備中<small>${run.eq.length} / ${run.slots}　上から順に発動</small></p>
      <div class="sk-list">${eq.map((s) => card(s, { btn: !!fz, data: pick(s), cls: cls(s), ctl: ctl(s, true) })).join('') || '<p class="note">なし</p>'}</div>
      <p class="sec-h">アイテムボックス<small>装備していないスキル</small></p>
      <div class="sk-list">${box.map((s) => card(s, { btn: !!fz, data: pick(s), cls: cls(s), ctl: ctl(s, false) })).join('') || '<p class="note">なし</p>'}</div>
      ${titles.length ? `<p class="sec-h">称号</p><div class="dex">${titles.map((t) => `<div>【${esc(t.name)}】<small>${esc(t.perk)}</small></div>`).join('')}</div>` : ''}
      <p class="note" style="margin-top:10px">疲れにくさ ${Math.round(Math.min(1, HZ.TOUGH + (run.tonic || 0) * 0.01) * 100)}%（同じターンに同じスキルが発動するたび、この倍になる）</p>
      ${fuseHtml}`, after);
    const re = () => { save(); hud(); const y = $('.sheet-in') ? $('.sheet-in').scrollTop : 0; openStatus(back); if ($('.sheet-in')) $('.sheet-in').scrollTop = y; };
    $$('[data-up]', sheet).forEach((b) => (b.onclick = () => { R.move(run, +b.dataset.up, -1); SND.play('tap'); re(); }));
    $$('[data-dn]', sheet).forEach((b) => (b.onclick = () => { R.move(run, +b.dataset.dn, 1); SND.play('tap'); re(); }));
    $$('[data-eq]', sheet).forEach((b) => (b.onclick = () => { const r = R.equip(run, +b.dataset.eq); SND.play(r === 'full' ? 'bad' : 'tap'); if (r === 'full') toast('装備枠がいっぱい'); re(); }));
    $$('[data-sell]', sheet).forEach((b) => (b.onclick = () => { const u = +b.dataset.sell, s = R.sk(run, u); const g = R.sell(run, u); SND.play('coin'); toast(`【${esc(HZ.name(s))}】を売った（+${g}G）`); re(); }));
    $$('[data-fz]', sheet).forEach((b) => (b.onclick = () => { fz = { a: +b.dataset.fz, b: null }; SND.play('tap'); re(); }));
    $$('[data-pk]', sheet).forEach((b) => (b.onclick = () => { const u = +b.dataset.pk; if (u === fz.a) return; fz.b = u; SND.play('tap'); re(); if ($('.fuse-bar')) $('.fuse-bar').scrollIntoView({ block: 'end' }); }));
    if ($('#fz-cancel')) $('#fz-cancel').onclick = () => { fz = null; re(); };
    if ($('#fz-swap')) $('#fz-swap').onclick = () => { fz = { a: fz.b, b: fz.a }; SND.play('tap'); re(); };
    if ($('#fz-go')) $('#fz-go').onclick = () => {
      const r = R.fuse(run, fz.a, fz.b);
      fz = null;
      SND.play('fuse');
      if (r.recipe && !S.meta.recipes.includes(r.recipe)) { S.meta.recipes.push(r.recipe); toast(`隠しレシピ発見！　【${esc(r.recipe)}】`, 'gold'); }
      toast(`《合成成功》【${esc(HZ.name(r.s))}】`);
      for (const t of r.titles) toast(`称号【${esc(HZ.TITLES[t].name)}】を獲得しました`, 'gold');
      for (const t of run.titles) if (!S.meta.titles.includes(t)) S.meta.titles.push(t);
      re();
    };
  }
  $('#h-stat').onclick = () => { if (view.dataset.s === 'battle') return; statusFresh(curBack()); };
  const curBack = () => (view.dataset.s === 'pre' ? () => preBattle() : view.dataset.s === 'shop' ? () => shop() : () => go());

  /* ---------- メニュー ---------- */
  $('#h-menu').onclick = () => {
    const inBattle = view.dataset.s === 'battle';
    openSheet(`<button type="button" class="sysbtn sheet-close" data-x>閉じる</button><p class="win-h">MENU</p><div class="title-btns" style="margin:10px auto 0">
      <button type="button" class="btn ghost" id="mn-how">遊び方</button><button type="button" class="btn ghost" id="mn-dex">図鑑・記録</button>
      <button type="button" class="btn ghost" id="mn-snd">音：${SND.on ? 'あり' : 'なし'}</button>
      ${inBattle ? '' : '<button type="button" class="btn ghost" id="mn-title">タイトルへ</button>'}
      ${inBattle ? '' : '<button type="button" class="btn ghost" id="mn-quit">この旅をやめる</button>'}</div>`);
    $('#mn-how').onclick = () => howTo();
    $('#mn-dex').onclick = () => dex();
    $('#mn-snd').onclick = () => { SND.on = !SND.on; S.meta.sound = SND.on; save(); $('#mn-snd').textContent = '音：' + (SND.on ? 'あり' : 'なし'); };
    if ($('#mn-title')) $('#mn-title').onclick = () => { closeSheet(); title(); };
    if ($('#mn-quit')) $('#mn-quit').onclick = () => askBox('この旅をやめますか？（記録は図鑑に残ります）', 'やめる', () => { run = null; S.pre = null; save(); title(); });
  };

  /* ---------- 遊び方 ---------- */
  function howTo(first) {
    openSheet(`<button type="button" class="sysbtn sheet-close" data-x>閉じる</button><p class="win-h">HOW TO PLAY</p>
      <p class="sysmsg">スキルは、自動で発動する</p>
      <p class="note">戦いはターンごとに自動で進みます。スキルにはそれぞれ「きっかけ」（ターンのはじめ・ダメージを与えたとき・くしゃみをしたとき……）があり、きっかけが起きると発動します。</p>
      <p class="sysmsg" style="margin-top:10px">発動が、次のきっかけになる（連鎖）</p>
      <p class="note">火のダメージを与えると、「火のダメージを与えたとき」のスキルが発動する。くしゃみをすると、「くしゃみをしたとき」のスキルが発動する。つながるほど連鎖が伸び、連鎖1回ごとにダメージ +5%。<br>同じターンに同じスキルが発動するたび効き目は0.7倍になり、1%を下回るとそのターンは止まります（疲れ）。</p>
      <p class="sysmsg" style="margin-top:10px">【合成】</p>
      <p class="note">ステータス画面で、2つのスキルを1つにできます。<b>きっかけは土台から、効き目は両方から</b>。土台の効き目が先に起き、素材の効き目は1.2倍（同じ属性どうしなら、さらに1.2倍）。装備枠を節約できるうえ、ハズレスキルの効き目を強いきっかけに乗せかえられます。決まった組み合わせで、名前の変わる「隠しレシピ」も。</p>
      <p class="sysmsg" style="margin-top:10px">属性と反応</p>
      <p class="note">${Object.entries(HZ.REACT).map(([k, v]) => `「${k}」${esc(v)}`).join('<br>')}<br>効き目は書かれた順に起きるので、「水→火」なら蒸発、「火→水」なら消火です。</p>
      <p class="sysmsg" style="margin-top:10px">上限はない</p>
      <p class="note">スキルのLv・装備枠・ダメージに上限はありません。魔王を倒すと、その先の「深淵」へ進めます。迷ったら「試算」で結果を先に確かめてください。</p>
      ${first ? '<div class="row end" style="margin-top:14px"><button type="button" class="btn" data-x>旅に出る</button></div>' : ''}`, first ? () => go() : null);
    if (first) $$('[data-x]', sheet).forEach((b) => (b.onclick = () => { closeSheet(); go(); }));
  }

  /* ---------- 図鑑 ---------- */
  function dex(tab) {
    tab = tab || 'skill';
    const m = S.meta;
    const all = Object.values(HZ.SKILLS);
    let body = '';
    if (tab === 'skill') body = `<p class="note">見つけたスキル ${all.filter((s) => m.seen.includes(s.id)).length} / ${all.length}</p><div class="dex" style="margin-top:8px">${all.map((s) => m.seen.includes(s.id) ? `<div>【${esc(s.name)}】${s.rare === 0 ? '<small style="color:#ff9aa8">ハズレ</small>' : ''}<small>${elTag(esc(HZ.descOf(s.id)))}</small></div>` : '<div class="no">？？？</div>').join('')}</div>`;
    if (tab === 'recipe') body = `<p class="note">隠しレシピ ${m.recipes.length} / ${HZ.RECIPES.length}</p><div class="dex" style="margin-top:8px">${HZ.RECIPES.map((r) => m.recipes.includes(r[2]) ? `<div>【${esc(r[2])}】<small>${esc(HZ.SKILLS[r[0]].name)} ＋ ${esc(HZ.SKILLS[r[1]].name)}${r[4] ? '<br>' + esc(r[4]) : ''}</small></div>` : `<div class="no">？？？<small>${m.runs >= 3 ? esc(HZ.SKILLS[r[0]].name) + ' ＋ ？？？' : '？？？ ＋ ？？？'}</small></div>`).join('')}</div>`;
    if (tab === 'title') body = `<div class="dex">${Object.entries(HZ.TITLES).map(([k, t]) => m.titles.includes(k) ? `<div>【${esc(t.name)}】<small>${esc(t.how)}<br>${esc(t.perk)}</small></div>` : `<div class="no">？？？<small>${k === 'inf' ? '？？？' : esc(t.how)}</small></div>`).join('')}</div>`;
    if (tab === 'rec') body = `<div class="rec"><div>魔王を倒した回数<b>${m.clears}</b></div><div>旅に出た回数<b>${m.runs}</b></div><div>最大ダメージ<b>${ND(m.best.hit)}</b></div><div>最大連鎖<b>${m.best.combo}</b></div><div>深淵の最深<b>${m.best.deep ? m.best.deep + '層' : '―'}</b></div><div>遊んだ時間<b>${Math.round((S.playMs || 0) / 60000)}分</b></div></div>`;
    openSheet(`<button type="button" class="sysbtn sheet-close" data-x>閉じる</button><p class="win-h">LIBRARY</p><div class="row" style="margin-bottom:10px">${[['skill', 'スキル'], ['recipe', '隠しレシピ'], ['title', '称号'], ['rec', '記録']].map(([k, t]) => `<button type="button" class="sysbtn${k === tab ? ' on' : ''}" data-tab="${k}" style="${k === tab ? 'border-color:var(--cy);background:rgba(127,220,255,.25)' : ''}">${t}</button>`).join('')}</div>${body}`);
    $$('[data-tab]', sheet).forEach((b) => (b.onclick = () => dex(b.dataset.tab)));
  }

  /* ---------- 不具合の知らせ ---------- */
  const errs = [];
  function report(err) {
    const m = (err && (err.stack || err.message)) || String(err);
    errs.push(m);
    if (G.console) console.error(err);
    if (errs.length <= 3) toast('不具合が起きました（' + esc(String((err && err.message) || err).slice(0, 60)) + '）');
  }
  G.addEventListener && G.addEventListener('error', (e) => report(e.error || e.message));
  G.addEventListener && G.addEventListener('unhandledrejection', (e) => report(e.reason));

  /* ---------- テスト用の口 ---------- */
  G.__hz = {
    get run() { return run; }, get B() { return B; }, S: () => S,
    newRun: (seed, hz, second) => { gen++; run = R.create(S.meta, String(seed || 1)); S.meta.intro = true; S.meta.howSeen = true; if (hz) { R.pickStarter(run, hz); R.pickSecond(run, second || run.seconds[0]); } save(); go(); return run; },
    give: (id) => { const r = R.gain(run, id); save(); return r; },
    fuse: (a, b) => { const r = R.fuse(run, a, b); save(); return r; },
    fast: () => { skipAll = true; },
    turbo: (on) => { TURBO = on !== false; }, errs,
    go, status: () => statusFresh(), title,
    to: (ch, step) => { run.ch = ch; run.step = step || 0; R.advance(run, false); run.step = step || 0; save(); go(); },
  };
  const q = new URLSearchParams(location.search);
  if (q.has('autostart')) { G.__hz.newRun(q.get('seed') || 1, q.get('hz') || 'kushami', q.get('second') || 'kakyu'); }
  else go();
})(typeof window !== 'undefined' ? window : globalThis);
