/* ことづて — 各ページ */
(() => {
  'use strict';
  const { $, $$, esc, state, save, seedify, markSeen, toast, routes } = K;

  // 店の窓から見える港と灯台（灯りがまわる）
  const WINDOW = '<svg class="window-art" viewBox="0 0 360 440" role="img" aria-label="店の窓から見える港の灯台">'
    + '<defs><linearGradient id="kt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DFCF"/><stop offset="1" stop-color="#F5EDE0"/></linearGradient>'
    + '<clipPath id="kt-pane"><rect x="30" y="30" width="300" height="380" rx="150" ry="150"/></clipPath></defs>'
    + '<g clip-path="url(#kt-pane)"><rect width="360" height="440" fill="url(#kt-sky)"/><circle cx="96" cy="120" r="26" fill="#EBC99A" opacity=".7"/>'
    + '<path d="M0 290h360v150H0z" fill="#B8C4C2"/><path d="M0 300q30-6 60 0t60 0t60 0t60 0t60 0t60 0M0 322q30-6 60 0t60 0t60 0t60 0t60 0t60 0" stroke="#D6DDDA" stroke-width="2" fill="none"/>'
    + '<path d="M196 292l12-120h20l12 120z" fill="#F6F1E8" stroke="#2A2622" stroke-width="2"/><path d="M200 252h36M203 222h30" stroke="#B8432F" stroke-width="8"/>'
    + '<rect x="204" y="152" width="28" height="22" fill="#2A2622"/><path d="M200 152h36l-18-16z" fill="#2A2622"/><circle cx="218" cy="163" r="6" fill="#F4C76B"/>'
    + '<g class="beam"><path d="M218 163L380 120L380 206Z" fill="#F4C76B" opacity=".35"/></g>'
    + '<path d="M150 292q20-30 50-30h40q30 0 50 30z" fill="#8E9A93"/></g>'
    + '<rect x="30" y="30" width="300" height="380" rx="150" ry="150" fill="none" stroke="#2A2622" stroke-width="10"/>'
    + '<path d="M180 30v380M30 250h300" stroke="#2A2622" stroke-width="6"/><rect x="10" y="404" width="340" height="16" fill="#6B4A32"/></svg>';

  const LIGHTHOUSE_SIG = '<svg class="lh-sig" viewBox="0 0 60 90" role="img" aria-label="灯台の絵"><path d="M20 84l6-56h8l6 56z" fill="none" stroke="#2B4C8C" stroke-width="2.4" stroke-linejoin="round"/><path d="M23 62h14M25 44h10" stroke="#2B4C8C" stroke-width="2.4"/><path d="M22 28h16l-8-10z" fill="none" stroke="#2B4C8C" stroke-width="2.4"/><path d="M38 22l18-8M38 26l18 4" stroke="#2B4C8C" stroke-width="2" stroke-linecap="round"/></svg>';

  const mask = lines => lines.map((l, i) => `<span class="ml"><span style="--i:${i}">${l}</span></span>`).join('');

  /* ---------- 写真（ファイルがなければ、絵に戻すか外す） ---------- */
  const PH_FB = { shop: `<div class="ph-fb shop-fb">${WINDOW}</div>`, window: `<div class="ph-fb">${WINDOW}</div>` };
  const ph = (id, alt, cls = '') => `<figure class="ph ${cls}" data-ph="${id}"><img src="img/${id}.jpg" alt="${esc(alt)}" decoding="async"></figure>`;
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const f = img.closest('[data-ph]');
    if (!f || f.classList.contains('fb')) return;
    f.classList.add('fb');
    if (PH_FB[f.dataset.ph]) f.innerHTML = PH_FB[f.dataset.ph];
    else (f.closest('.ph-wrap') || f).remove();
  }, true);

  /* ---------- トップ ---------- */
  routes[''] = (_, page) => {
    const notices = state.done
      ? [[fmtDate(state.endedAt), '10月17日（土）も、通常どおり営業いたします', ''], [fmtDate(state.endedAt), '【未来便】受取人さまが見つかりました。ありがとうございました', '#/diary/dhello'], ...KT.notices.filter(n => !n[1].includes('臨時休業') && !n[1].includes('未来便'))]
      : KT.notices;
    const copy = ['<span class="seed" data-seed="tagline">言えなかった言葉を、</span>', '<span class="seed" data-seed="tagline">あなたの代わりに。</span>'];
    if (state.done) copy.push('<span class="after">――あなたの言葉は、あなたが。</span>');
    page.innerHTML = '<section class="hero">'
      + ph('shop', '夕暮れの坂道に建つ、代筆屋ことづての店先', 'hero-ph')
      + `<h1 class="hero-copy mask">${mask(copy)}</h1>`
      + '<p class="hero-sub">代筆屋　ことづて<span>汐見坂　since 1989</span></p></section>'
      + '<section class="greet rv" aria-label="ごあいさつ"><div class="greet-scroll"><div class="greet-paper">'
      + '<p>はじめまして。</p><p>港の見える坂の途中で、手紙の代筆をしております。</p><p>お礼の手紙、仲直りの手紙、もう会えない人への手紙。</p>'
      + '<p>うまく言葉にならない気持ちを伺って、便箋一枚に清書いたします。</p><p>どうぞ、お気軽にお立ち寄りください。</p><p class="greet-sign">店主</p></div></div></section>'
      + '<section class="block"><h2 class="eyebrow rv">お知らせ<small>NEWS</small></h2><ul class="postcards">'
      + notices.map(([d, t, h], i) => `<li class="rv" style="--d:${i}">${h ? `<a class="pc" href="${h}">` : '<div class="pc">'}<span class="pc-stamp" aria-hidden="true"></span><span class="pc-mark">${d.replace(/\./g, '・')}</span><span class="pc-text">${seedify(t)}</span>${h ? '</a>' : '</div>'}</li>`).join('') + '</ul></section>'
      + '<section class="block"><h2 class="eyebrow rv">店の風景<small>VIEWS</small></h2><div class="view-grid">'
      + `<div class="ph-wrap rv">${ph('window', '店の窓から見える港と灯台', 'curtain')}<p class="cap">窓から、港の灯台が見えます。</p></div>`
      + `<div class="ph-wrap rv" style="--d:1">${ph('hands', '青いインクの万年筆で便箋に書く手元', 'curtain')}<p class="cap">清書は、万年筆で。</p></div></div></section>`
      + '<section class="block rv"><h2 class="eyebrow">ご案内<small>GUIDE</small></h2><div class="cards">' + [['#/samples', '見本の手紙', 'これまでにお書きした手紙から'], ['#/service', 'ご依頼と料金', 'お菓子ひとつから承ります'], ['#/future', '未来便', '決めた日に、届ける手紙']]
        .map(([h, t, s2]) => `<a class="card" href="${h}"><b>${t}</b><span>${s2}</span></a>`).join('') + '</div></section>';
  };

  /* ---------- 見本の手紙 ---------- */
  routes.samples = ([id], page) => {
    if (id) { sample(id, page); return; }
    page.innerHTML = '<header class="page-head"><h1 class="title mask">' + mask(['見本の手紙']) + '</h1>'
      + '<p class="lead rv">ご依頼人さまのお許しをいただき、お名前などを伏せて掲載しています。便箋はすべて当店オリジナルで、<b class="hl">光にかざすと透かしが入っています</b>。</p></header>'
      + '<ol class="envelopes">' + KT.samples.map((s, i) => `<li class="rv" style="--d:${i}"><a class="env" href="#/samples/${s.id}">`
        + `<span class="env-no">${['一', '二', '三', '四', '五'][i]}通目</span><b class="env-title">${esc(s.title)}</b>`
        + `<dl><div><dt>ご依頼</dt><dd>${s.year}</dd></div><div><dt>ご依頼人</dt><dd>${esc(s.client)}${s.age ? `（${s.age}歳）` : ''}</dd></div><div><dt>お代</dt><dd>${esc(s.fee)}</dd></div></dl>`
        + `<span class="postmark">${s.posted.replace(/\./g, '・')}</span></a></li>`).join('') + '</ol>';
  };

  function sample(id, page) {
    const i = KT.samples.findIndex(s => s.id === id), s = KT.samples[i];
    if (!s) { K.go('#/samples'); return; }
    const posted = s.postedSeed ? `<span class="seed" data-seed="${s.postedSeed}">${s.posted}</span>` : s.posted;
    const sig = s.sig === 'lighthouse' ? `<p class="sig-lh"><span class="seed" data-seed="lhsig">${LIGHTHOUSE_SIG}</span><small>（お名前のかわりに、灯台の絵が描いてありました）</small></p>` : '';
    page.innerHTML = '<a class="back ul" href="#/samples">見本の手紙の一覧へ</a>'
      + `<header class="page-head"><p class="eyebrow">見本　${['一', '二', '三', '四', '五'][i]}通目</p><h1 class="title mask">${mask([esc(s.title)])}</h1>`
      + `<dl class="meta rv"><div><dt>ご依頼</dt><dd>${s.year}</dd></div><div><dt>ご依頼人</dt><dd>${esc(s.client)}${s.age ? `（${s.age}歳）` : ''}</dd></div><div><dt>お代</dt><dd>${esc(s.fee)}</dd></div><div><dt>掲載日</dt><dd>${posted}</dd></div></dl></header>`
      + '<div class="tools rv"><button type="button" class="lamp-btn" id="lamp-btn" aria-pressed="false">光にかざす</button><span class="tool-note">かざしている間は、便箋の上を指やマウスでなぞってください。</span></div>'
      + `<div class="paper-scroll"><div class="paper letter" id="paper"><div class="ink">${s.lines.map(l => `<p>${seedify(l)}</p>`).join('')}${sig}</div>`
      + `<div class="mark" aria-hidden="true">${s.mark.map(m => `<p>${seedify(m)}</p>`).join('')}</div></div></div>`
      + `<nav class="pager">${i > 0 ? `<a class="ul" href="#/samples/${KT.samples[i - 1].id}">← 前の見本</a>` : '<span></span>'}${i < 4 ? `<a class="ul" href="#/samples/${KT.samples[i + 1].id}">次の見本 →</a>` : '<span></span>'}</nav>`;
    lamp($('#paper', page), $('#lamp-btn', page));
  }

  // 光にかざす：光の輪の中だけ透かしが見える
  function lamp(paper, btn) {
    const marks = $$('.mark p', paper);
    btn.addEventListener('click', () => {
      const on = !paper.classList.contains('lit');
      paper.classList.toggle('lit', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '光からはなす' : '光にかざす';
      if (on && !state.lamp) { state.lamp = true; save(); }
      if (on) { const r = paper.getBoundingClientRect(); move(r.left + r.width / 2, r.top + r.height / 2); }
    });
    function move(x, y) {
      const r = paper.getBoundingClientRect();
      paper.style.setProperty('--x', `${x - r.left}px`);
      paper.style.setProperty('--y', `${y - r.top}px`);
      marks.forEach(m => {
        const b = m.getBoundingClientRect();
        const dx = Math.max(b.left - x, 0, x - b.right), dy = Math.max(b.top - y, 0, y - b.bottom);
        if (Math.hypot(dx, dy) < 40) { m.classList.add('found'); $$('.seed', m).forEach(s => markSeen(s.dataset.seed)); }
      });
    }
    paper.addEventListener('pointermove', e => { if (paper.classList.contains('lit')) move(e.clientX, e.clientY); });
    paper.addEventListener('pointerdown', e => { if (paper.classList.contains('lit')) move(e.clientX, e.clientY); });
  }

  /* ---------- 店主の日記 ---------- */
  const entries = () => (state.done ? [{ ...KT.epilogue, date: fmtDate(state.endedAt) }, ...KT.diary] : KT.diary);
  function fmtDate(t) { const d = new Date(t || Date.now()); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; }
  routes.diary = ([id], page) => {
    const list = entries();
    if (!id) {
      page.innerHTML = '<header class="page-head"><h1 class="title mask">' + mask(['店主のひとりごと']) + '</h1><p class="lead rv">店のこと、季節のこと、ポストのこと。</p></header>'
        + '<ul class="diary-list">' + list.map((d, i) => `<li class="rv" style="--d:${Math.min(i, 8)}"><a href="#/diary/${d.id}"><time>${d.date}</time><span class="ul">${esc(d.title)}</span></a></li>`).join('') + '</ul>';
      return;
    }
    const i = list.findIndex(d => d.id === id), d = list[i];
    if (!d) { K.go('#/diary'); return; }
    const off = d.era === 'daughter' ? KT.signoff.daughter : KT.signoff.mother;
    const sig = d.era === 'heir' ? '灯' : '一葉';
    const body = seedify(d.body).replace('[[DRAFT]]', draftHtml());
    page.innerHTML = '<a class="back ul" href="#/diary">日記の一覧へ</a>'
      + `<article class="entry ${d.era}"><header class="page-head"><time class="eyebrow">${d.date}</time><h1 class="title mask">${mask([esc(d.title)])}</h1></header>`
      + `<div class="entry-body rv">${body}<p class="signoff"><span class="seed" data-seed="signoff">${off}</span></p><p class="sig">${sig}</p></div></article>`
      + `<nav class="pager">${list[i + 1] ? `<a class="ul" href="#/diary/${list[i + 1].id}">← ${esc(list[i + 1].title)}</a>` : '<span></span>'}${list[i - 1] ? `<a class="ul" href="#/diary/${list[i - 1].id}">${esc(list[i - 1].title)} →</a>` : '<span></span>'}</nav>`;
    if (id === 'd190922') fold($('#draft', page));
  };

  /* ---------- 書き損じを折る ---------- */
  function draftHtml() {
    const cols = [0, 1, 2, 3].map(c => `<div class="dcol" data-c="${c}">${KT.draft.map(row => `<span>${row[c]}</span>`).join('')}</div>`);
    const crease = k => `<button type="button" class="crease" data-k="${k}" aria-label="${k}本目の折り目"></button>`;
    return `<figure class="draft" id="draft"><div class="draft-paper">${cols[0]}${crease(1)}${cols[1]}${crease(2)}${cols[2]}${crease(3)}${cols[3]}</div>`
      + '<figcaption><span id="fold-msg">うっすら、縦に三本の折り目がついている。折り目を二本えらぶと、そのあいだを折りたためそうだ。</span><button type="button" class="text-btn" id="unfold">ひろげる</button></figcaption></figure>';
  }
  function fold(fig) {
    let pick = [];
    const msg = $('#fold-msg', fig);
    const reset = () => { pick = []; $$('.dcol, .crease', fig).forEach(el => el.classList.remove('folded', 'picked')); fig.classList.remove('aligned'); };
    $$('.crease', fig).forEach(c => c.addEventListener('click', () => {
      if (fig.querySelector('.folded')) reset();
      const k = +c.dataset.k;
      if (pick.includes(k)) { pick = pick.filter(x => x !== k); c.classList.remove('picked'); return; }
      pick.push(k); c.classList.add('picked');
      if (pick.length < 2) { msg.textContent = 'もう一本、折り目をえらぶ。'; return; }
      const [a, b] = pick.sort();
      $$('.dcol', fig).forEach(col => { const i = +col.dataset.c; if (i >= a && i < b) col.classList.add('folded'); });
      $$('.crease', fig).forEach(cr => { const k2 = +cr.dataset.k; if (k2 > a && k2 < b) cr.classList.add('folded'); });
      if (a === 1 && b === 3) {
        fig.classList.add('aligned');
        msg.textContent = '……折り目が、ぴたりと重なった。';
        if (!state.folded) { state.folded = true; save(); }
      } else {
        msg.textContent = '折ってみたが、文字がうまくつながらない。';
      }
    }));
    $('#unfold', fig).addEventListener('click', () => { reset(); msg.textContent = 'ひろげた。'; });
  }

  /* ---------- 店とあゆみ ---------- */
  routes.about = (_, page) => {
    const hist = state.done ? [...KT.history.slice(0, 5), ['2024.10', '初代店主 真白一葉、永眠'], ...KT.history.slice(5), ['2026.10', '二代目 真白灯が店を継ぐ']] : KT.history;
    page.innerHTML = '<header class="page-head"><h1 class="title mask">' + mask(['店と、あゆみ']) + '</h1></header>'
      + `<div class="about-grid"><div class="about-art">${ph('hands', '店主の手元', 'curtain')}</div><div class="rv">`
      + '<h2 class="eyebrow">店主<small>OWNER</small></h2><p class="owner-name">真白 一葉<small>ましろ かずは</small></p>'
      + '<p>一九五八年、汐見坂生まれ。手紙を書くときは、いつも青いインクの万年筆で。</p>'
      + (state.done ? '<p class="owner-name second">真白 灯<small>ましろ あかり　二代目</small></p><p>一九九四年、汐見坂生まれ。店の窓から見える灯台から、名前をもらいました。</p>' : '')
      + '<h2 class="eyebrow">看板猫<small>CAT</small></h2><p>ポスト。二〇一六年から、郵便受けの上が定位置。</p></div></div>'
      + '<h2 class="eyebrow rv">あゆみ<small>HISTORY</small></h2><ol class="timeline">'
      + hist.map(([d, t], i) => `<li class="rv" style="--d:${i}"><time>${d}</time><p>${seedify(t)}</p></li>`).join('') + '</ol>';
  };

  /* ---------- ご依頼と料金 ---------- */
  routes.service = (_, page) => {
    page.innerHTML = '<header class="page-head"><h1 class="title mask">' + mask(['ご依頼と料金']) + '</h1></header>'
      + '<h2 class="eyebrow rv">ご依頼の流れ<small>FLOW</small></h2><ol class="steps">'
      + [['お話を伺う', '誰に、何を伝えたいのか。まとまっていなくて大丈夫です。'], ['下書き', '伺ったお話から、言葉を選んで下書きをお見せします。'], ['清書', '青いインクの万年筆で、便箋に清書します。'], ['お届け', 'お渡し、郵送、または未来便でお預かりします。']]
        .map(([t, s], i) => `<li class="rv" style="--d:${i}"><b>${t}</b><p>${s}</p></li>`).join('') + '</ol>'
      + '<h2 class="eyebrow rv">料金<small>PRICE</small></h2><table class="price rv"><tbody>'
      + '<tr><th>手紙　一通</th><td>三千円〜</td></tr><tr><th>長いお手紙</th><td>五千円〜</td></tr>'
      + '<tr><th>小学生以下のご依頼</th><td><span class="seed" data-seed="candy">お菓子ひとつ</span></td></tr>'
      + '<tr><th>未来便</th><td>五千円（最長十年お預かり）</td></tr></tbody></table>'
      + '<p class="note rv">未来便は、差出人さまが決めた「問い」と「合言葉」を受取人さまに確かめてから、お渡しします。</p>';
  };

  /* ---------- よくあるご質問 ---------- */
  routes.faq = (_, page) => {
    page.innerHTML = '<header class="page-head"><h1 class="title mask">' + mask(['よくあるご質問']) + '</h1></header>'
      + '<div class="faq">' + KT.faq.map(([q, a], i) => `<details class="rv" style="--d:${i}"><summary>${seedify(q)}</summary><p>${seedify(a)}</p></details>`).join('') + '</div>';
    $$('details', page).forEach(d => d.addEventListener('toggle', () => K.wire(d)));
  };
})();
