/* ぬか床、百年 — はじまり（読みこみ・保存・時間・エンディング） */
(function () {
  const KEY = 'nuka.v1';
  const UI = NK.UI;
  const Q = new URLSearchParams(location.search);
  let S;

  /* ---- 保存 ---- */
  const strip = (s) => { const o = Object.assign({}, s); delete o.ev; return o; };
  NK.save = () => { try { S.t = Date.now(); localStorage.setItem(KEY, JSON.stringify(strip(S))); } catch (e) { } };
  const merge = (base, o) => { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], o[k]); else base[k] = o[k]; } return base; };
  const load = () => {
    try { const t = localStorage.getItem(KEY); if (t) return merge(NK.fresh(Date.now()), JSON.parse(t)); } catch (e) { }
    return null;
  };
  NK.exportSave = () => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(strip(S))))); } catch (e) { return ''; } };
  NK.importSave = (str) => { try { const o = JSON.parse(decodeURIComponent(escape(atob(str)))); if (!o || !o.v || !o.slots) return false; localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; } };
  NK.resetSave = () => { try { localStorage.removeItem(KEY); } catch (e) { } };

  if (Q.has('reset')) NK.resetSave();
  S = load();
  const first = !S;
  if (!S) { S = NK.fresh(Date.now()); S.tut = 0; S.pick = 'kyuri'; }
  NK.seed((Date.now() % 100000) + 7);
  NK.ensureSlots(S, NK.derive(S));
  NK.snd.setOn(S.snd !== false);

  /* 試験用 */
  if (Q.has('cheat')) { S.coins += 1e9; S.rep = S.repMax = Math.max(S.repMax, 3e4); }
  window.__nk = { S: () => S, NK, UI, save: NK.save, tick: (sec) => { NK.tick(S, sec, Date.now()); UI.events(); UI.dirty = true; }, away: (sec) => { S.t -= sec * 1000; const sm = NK.offline(S, Date.now()); UI.events(); UI.okaeri(sm); UI.dirty = true; return sm; }, end: () => { S.tree = Array.from({ length: 49 }, (_, i) => ({ id: i + 1, name: 'x', parent: 0, depth: 3, at: 0, acc: 0, kids: 3 })); S.treeSeq = 50; } };

  UI.init(S);

  /* ---- 留守のあいだ ---- */
  let sum = null;
  if (!first) { sum = NK.offline(S, Date.now()); }
  S.t = Date.now();

  /* ---- はじめての日：ばあちゃんの置き手紙 ---- */
  if (first || S.tut === 0) {
    UI.modal(`<div class="md-in md-letter"><p class="lt-k">台所のテーブルに、手紙が一枚。</p><div class="lt-paper"><p class="hand">ちょっと、世界を見てくる。<br>しばらく帰らないから、ぬか床をたのむよ。<br><br>昭和元年に、ひいばあちゃんがはじめた床。<br>今年で、ちょうど百年になる。<br><br>毎日、底からまぜること。<br>漬けて、取り出して、近所にくばること。<br>それだけ。<br><br>旅先から、はがきを出すからね。</p><p class="lt-sign">ばあちゃん</p></div><div class="md-acts"><button type="button" class="pri" data-md="close">壺のふたをあける</button></div><p class="sm">本作品はフィクションです。記録はこのブラウザに保存され、閉じているあいだも、ぬか床の時間は進みます。</p></div>`);
    UI.after = () => { S.tut = 1; UI.tip(); NK.save(); };
  } else if (sum) { UI.events(); UI.okaeri(sum); }

  /* ---- エンディング ---- */
  NK.ending = {
    pages: [
      () => `<div class="md-in md-end"><div class="pc">${NK.art.card('c18')}</div><p class="hand">あした、帰るよ。お土産は、世界じゅうの漬物の話。<br>それと、あんたのぬか漬けが食べたい。いちばんのを、ひとつ。</p><div class="md-acts"><button type="button" class="pri" data-end="1">朝を待つ</button></div></div>`,
      () => `<div class="md-in md-end dark"><p>次の朝。</p><p>玄関の戸が、がらりとあいた。</p><p class="big">「ただいま」</p><div class="md-acts"><button type="button" class="pri" data-end="2">台所へ</button></div></div>`,
      () => `<div class="md-in md-end"><p>ばあちゃんは、荷物も置かずに台所に来て、壺……ではなく、${NK.CONT[S.cont].name}のふたをあけた。</p><p>「ずいぶん、大きくなったねえ」</p><p>ぬかに手を入れて、底から大きく、ひっくり返す。</p><p class="big">「いい床だ」</p><div class="md-acts"><button type="button" class="pri" data-end="3">きゅうりを出す</button></div></div>`,
      () => `<div class="md-in md-end"><p>食べごろのきゅうりを、ひと切れ。</p><p>ばあちゃんは口に入れて、しばらく、何も言わなかった。</p><p>それから、目をほそくして、</p><p class="big">「……あんたの味だね」</p><p class="sm">ぬか床は、まぜる人の手で、味が変わる。</p><div class="md-acts"><button type="button" class="pri" data-end="4">　</button></div></div>`,
      () => `<div class="md-in md-end title"><p class="t-k">昭和元年から、百年目の秋。</p><h2>ぬか床、百年</h2><p>壺は、ひとつ。のれんは、${NK.households(S)}軒。</p><dl class="kv"><div><dt>まぜた回数</dt><dd>${NK.fmt(S.stats.stirs)}回</dd></div><div><dt>漬けた野菜</dt><dd>${NK.fmt(S.stats.harvests)}本</dd></div><div><dt>届けた注文</dt><dd>${NK.fmt(S.stats.orders)}件</dd></div><div><dt>のれん分け</dt><dd>${S.pres.count}回</dd></div></dl><p class="sm">ぬか床帳に、最後のページが書き足された。これからも、まぜつづけることができます。</p><div class="md-acts"><button type="button" class="pri" data-end="9">まぜつづける</button></div></div>`,
    ],
    i: 0,
    start() { this.i = 0; UI.modal(this.pages[0]()); },
    next(k) {
      if (k === '9') { S.ended = true; S.endAt = Date.now(); NK.checkStory(S); UI.closeModal(); UI.events(); UI.dirty = true; NK.save(); return; }
      this.i = +k; NK.snd.paper(); UI.modal(this.pages[this.i]());
    },
  };

  /* ---- 時間を進める ---- */
  let last = Date.now(), saveT = 0, panelT = 0;
  const step = () => {
    const now = Date.now();
    const gap = now - last; last = now;
    if (now - S.t > 20000) {
      const sm = NK.offline(S, now);
      UI.events();
      if (sm && sm.away > 60 && document.getElementById('modal').hidden) UI.okaeri(sm);
    } else {
      NK.tick(S, Math.max(0, (now - S.t) / 1000), now);
      S.t = now;
      UI.events();
    }
    if (!document.hidden) S.playMs = (S.playMs || 0) + Math.min(gap, 1000);
    if (S.endReady && !S.ended && document.getElementById('modal').hidden && !NK.ending.on) { NK.ending.on = true; NK.ending.start(); }
    saveT += gap; if (saveT > 5000) { saveT = 0; NK.save(); }
  };
  setInterval(step, 100);
  setInterval(() => {
    UI.header(); UI.veg(); UI.scene();
    if (UI.dirty || (panelT += 1) >= 4) { UI.dirty = false; panelT = 0; UI.panel(); }
  }, 250);
  const loop = (t) => { UI.frame(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) NK.save(); else { last = Date.now(); step(); } });
  addEventListener('pagehide', NK.save);
  UI.header(); UI.panel();
})();
