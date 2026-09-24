/* ウラガワ — 一覧の表示、進行状況の読み取り、作品を遊ぶ画面 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const BASE_TITLE = document.title;

  // 新しい順。同じ日付なら works.js に書いた順
  const works = window.WORKS.map((w, i) => ({ ...w, _i: i })).sort((a, b) => b.added.localeCompare(a.added) || a._i - b._i);
  const byId = id => works.find(w => w.id === id);
  const isNew = w => (Date.now() - new Date(w.added + 'T00:00:00').getTime()) / 864e5 <= 14;

  /* ---------- 進行状況（各作品の保存データを読む） ---------- */
  function readState(w) {
    try { return JSON.parse(localStorage.getItem(w.storageKey) || 'null'); } catch (e) { return null; }
  }
  function progress(w) {
    const s = readState(w);
    if (!s || !w.progress) return { started: false, pct: 0, label: '未プレイ', cleared: false };
    try { return { started: true, ...w.progress(s) }; } catch (e) { return { started: true, pct: 0, label: 'プレイ中', cleared: false }; }
  }

  /* ---------- 遊んだ時間と「答えを見る」 ----------
     答えは最初は閉じていて、その作品を遊んだ時間に応じて上から順に開く（クリアするとすべて）。
     遊んだ時間は、作品が自分で数えている playMs と、この一覧の中で開いていた時間の、長いほう。 */
  const PLAY_KEY = 'uragawa.play';
  const hubPlay = () => { try { return JSON.parse(localStorage.getItem(PLAY_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const playMin = w => Math.max((readState(w) || {}).playMs || 0, hubPlay()[w.id] || 0) / 60000;
  const spoilAt = (w, i) => Math.max(3, Math.round(w.minutes * (i + 1) / w.spoilers.length));
  const spoilOpen = w => {
    if (!w.spoilers || !w.spoilers.length) return 0;
    if (progress(w).cleared) return w.spoilers.length;
    const m = playMin(w);
    return w.spoilers.filter((_, i) => m >= spoilAt(w, i)).length;
  };
  function spoilerHTML(w) {
    if (!w.spoilers || !w.spoilers.length) return '';
    const n = w.spoilers.length, k = spoilOpen(w), m = playMin(w);
    return `<details class="spoiler"><summary>答えを見る（ネタバレ注意）<small>${k}/${n}</small></summary>`
      + `<p class="spoil-note">答えは、遊んだ時間に応じて上から順に見られるようになります（クリアするとすべて）。</p><ol>`
      + w.spoilers.map((t, i) => i < k ? `<li>${esc(t)}</li>` : `<li class="locked">あと ${Math.max(1, Math.ceil(spoilAt(w, i) - m))}分 遊ぶと見られます</li>`).join('')
      + '</ol></details>';
  }
  const sig = w => { const p = progress(w); return [p.pct, p.label, p.cleared, spoilOpen(w)].join('|'); };
  const lastSig = {};

  /* ---------- 表紙（写真があれば写真、なければ絵） ---------- */
  const face = (w, side) => (w.images && w.images[side] ? `<img src="${esc(w.images[side])}" alt="" data-side="${side}">` : w.cover[side]);
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.side) return;
    const w = byId(img.closest('.work').dataset.id);
    img.parentElement.innerHTML = w.cover[img.dataset.side];
  }, true);

  /* ---------- 一覧 ---------- */
  let filter = 'すべて';
  const armed = { id: null, at: 0 };
  function card(w) {
    const p = progress(w);
    const verb = p.cleared ? 'もう一度遊ぶ' : p.started ? '続きから遊ぶ' : '遊ぶ';
    const diff = Array.from({ length: 5 }, (_, i) => `<i class="${i < w.difficulty ? '' : 'off'}">●</i>`).join('');
    return `<li class="work" style="--wa:${w.accent}" data-id="${w.id}">`
      + `<div class="cover"><div class="face front">${face(w, 'front')}</div><div class="face back">${face(w, 'back')}</div>`
      + `<div class="badges">${isNew(w) ? '<span class="badge">NEW</span>' : ''}${p.cleared ? '<span class="badge clear">CLEAR</span>' : ''}</div>`
      + '<button type="button" class="flip" data-flip aria-pressed="false">裏を見る</button></div>'
      + '<div class="work-body">'
      + `<p class="meta"><span class="tags">${w.genre.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</span><span class="mins">約${w.minutes}分</span><span class="diff" aria-label="難しさ ${w.difficulty}／5">${diff}</span></p>`
      + `<h2 class="work-title">${esc(w.title)}</h2><p class="catch">${esc(w.catch)}</p>`
      + `<ul class="features">${w.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      + `<div class="prog"><div class="bar"><i style="width:${p.pct}%"></i></div><span class="prog-label">${esc(p.label)}</span><span class="prog-pct">${p.pct}%</span></div>`
      + `<div class="actions"><button type="button" class="play" data-play>${verb}</button><a class="sub-link" href="${esc(w.path)}" target="_blank" rel="noopener">新しいタブで開く</a>`
      + (p.started ? `<button type="button" class="reset${armed.id === w.id ? ' armed' : ''}" data-reset>${armed.id === w.id ? 'もう一度押すと消えます' : '記録を消す'}</button>` : '') + '</div>'
      + spoilerHTML(w)
      + '</div></li>';
  }
  function render() {
    const open = new Set([...document.querySelectorAll('.work')].filter(li => li.querySelector('.spoiler[open]')).map(li => li.dataset.id));
    const list = filter === 'すべて' ? works : works.filter(w => w.genre.includes(filter));
    $('#works').innerHTML = list.map(card).join('');
    open.forEach(id => { const d = $(`.work[data-id="${id}"] .spoiler`); if (d) d.open = true; });
    haunt();
    works.forEach(w => { lastSig[w.id] = sig(w); });
    const all = works.map(progress);
    $('#st-works').textContent = works.length;
    $('#st-clear').textContent = all.filter(p => p.cleared).length;
    $('#st-min').textContent = works.reduce((n, w) => n + w.minutes, 0) + '分';
    // ジャンルでの絞り込みは、作品が4つ以上になったら出す
    const f = $('#filters');
    f.hidden = works.length < 4;
    if (!f.hidden) {
      const genres = ['すべて', ...new Set(works.flatMap(w => w.genre))];
      f.innerHTML = genres.map(g => `<button type="button" data-filter="${esc(g)}" aria-pressed="${g === filter}">${esc(g)}</button>`).join('');
    }
  }

  // 作品の中で「見てしまった」ものが、この一覧にも漏れ出す（works.js の haunt が返す内容を当てる）
  function haunt() {
    const hs = works.map(w => { const s = readState(w); return s && w.haunt ? w.haunt(s) : null; }).filter(Boolean);
    const tag = $('.tagline');
    if (!tag.dataset.orig) tag.dataset.orig = tag.textContent;
    tag.textContent = hs.length ? hs[0].tagline : tag.dataset.orig;
    document.body.classList.toggle('haunted', hs.length > 0);
    if (!hs.length) return;
    const d = new Date(), t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    $$('.work .cover').forEach(c => c.insertAdjacentHTML('beforeend', `<span class="haunt-mark">${esc(hs[0].mark)} ${t}</span>`));
  }

  $('#works').addEventListener('click', e => {
    const li = e.target.closest('.work');
    if (!li) return;
    const w = byId(li.dataset.id);
    if (e.target.closest('[data-play]')) { location.hash = 'play/' + w.id; return; }
    const flip = e.target.closest('[data-flip]');
    if (flip) {
      const on = flip.getAttribute('aria-pressed') !== 'true';
      flip.setAttribute('aria-pressed', String(on));
      flip.textContent = on ? '表にもどす' : '裏を見る';
      li.querySelector('.cover').classList.toggle('flipped', on);
      return;
    }
    if (e.target.closest('[data-reset]')) {
      if (armed.id === w.id && Date.now() - armed.at < 4000) {
        try { localStorage.removeItem(w.storageKey); const t = hubPlay(); delete t[w.id]; localStorage.setItem(PLAY_KEY, JSON.stringify(t)); } catch (err) { /* noop */ }
        armed.id = null;
      } else {
        armed.id = w.id; armed.at = Date.now();
        setTimeout(() => { if (armed.id === w.id) { armed.id = null; render(); } }, 4000);
      }
      render();
    }
  });
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (b) { filter = b.dataset.filter; render(); }
  });

  /* ---------- 作品を遊ぶ画面 ---------- */
  let playing = null, scrollY0 = 0;
  function openPlayer(w) {
    if (playing === w.id) return;
    if (!playing) scrollY0 = scrollY;
    playing = w.id;
    $('#player-title').textContent = w.title;
    $('#player-prog').textContent = progress(w).label;
    $('#player-newtab').href = w.path;
    $('#player-frame').title = w.title;
    $('#player-frame').src = w.path;
    $('#player').hidden = false;
    document.body.classList.add('playing');
    document.title = `${w.title} ｜ ${BASE_TITLE}`;
    $('#player-back').focus({ preventScroll: true });
  }
  function closePlayer() {
    if (!playing) return;
    const id = playing;
    playing = null;
    $('#player').hidden = true;
    $('#player-frame').src = 'about:blank';
    document.body.classList.remove('playing');
    document.title = BASE_TITLE;
    render();
    scrollTo(0, scrollY0);
    const btn = $(`.work[data-id="${id}"] [data-play]`);
    if (btn) btn.focus({ preventScroll: true });
  }
  $('#player-back').addEventListener('click', () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    closePlayer();
  });
  function route() {
    const m = location.hash.match(/^#play\/([\w-]+)/);
    const w = m && byId(m[1]);
    if (w) openPlayer(w); else closePlayer();
  }
  addEventListener('hashchange', route);

  // 作品の中で進んだら、一覧と上のバーにもすぐ反映する（同じ保存場所を共有しているため）
  addEventListener('storage', e => {
    const w = works.find(x => x.storageKey === e.key);
    if (!w) return;
    if (playing === w.id) $('#player-prog').textContent = progress(w).label;
    // 作品は5秒ごとに遊んだ時間を保存する。見た目が変わるときだけ描き直す（裏返した表紙などが戻らないように）
    if (!playing && sig(w) !== lastSig[w.id]) render();
  });

  // この一覧の中で作品を開いているあいだの時間も数える（作品が数えられなかったときの控え）
  setInterval(() => {
    if (!playing || document.visibilityState !== 'visible') return;
    const t = hubPlay(); t[playing] = (t[playing] || 0) + 5000;
    try { localStorage.setItem(PLAY_KEY, JSON.stringify(t)); } catch (e) { /* noop */ }
  }, 5000);

  /* ---------- 今夜の行き先（収録作の“場所”を順に出す。押すとその作品へ） ---------- */
  const dest = $('#dest');
  const pool = works.filter(w => w.place);
  let di = Math.floor(Math.random() * Math.max(1, pool.length));
  function showDest() {
    if (!dest || !pool.length) return;
    const w = pool[di % pool.length]; di++;
    dest.classList.remove('in'); void dest.offsetWidth;
    dest.innerHTML = `<span class="dest-k">今夜の行き先</span><a class="dest-v" href="#play/${w.id}" style="--wa:${w.accent}">${esc(w.place)}</a>`;
    dest.classList.add('in');
  }
  showDest();
  setInterval(() => { if (!playing && document.visibilityState === 'visible' && !(dest && dest.matches(':hover, :focus-within'))) showDest(); }, 4200);

  render();
  route();
})();
