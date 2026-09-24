/* むぎのさんぽみち — 状態・ルーター・年めくり・なふだメニュー・むぎのヒント */
(() => {
  const KEY = 'mugi.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fresh = () => ({ started: Date.now(), year: 2025, himitsu: false, rusuban: false, walk: { step: 0 }, ended: false, endedAt: null, hintLv: {}, notes: [] });

  let st;
  try { st = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { st = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 保存できなくても遊べる */ } };
  save();

  const stage = () => st.ended ? 3 : st.rusuban ? 2 : st.himitsu ? 1 : 0;
  // カタカナ→ひらがな、空白や記号を落とす
  const norm = s => String(s || '').normalize('NFKC').toLowerCase()
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s、。，．,.!！?？「」『』（）()・〜~ー-]/g, '');
  const fmt = d => { const [y, m, dd] = d.split('-'); return { y: +y, md: `${+m}月${+dd}日`, full: `${y}.${+m}.${+dd}` }; };
  const era = y => y <= 2012 ? 'kid' : y <= 2017 ? 'teen' : 'adult';
  const text = t => esc(t).replace(/\n/g, '<br>');

  /* ---------- 写真（ファイルが無ければ絵に戻る） ---------- */
  const SKY = {
    'spot-gate': ['#F4D6AE', '#EFE3CB'], 'spot-bakery': ['#F7DDB8', '#F3E9D6'], 'spot-park': ['#CFE3EC', '#F2E9D6'], 'spot-shrine': ['#D7E4E6', '#EEE7D6'],
    'spot-river': ['#C4DCE8', '#E9E6D3'], 'spot-sea': ['#F2C49B', '#F6E3C8'], 'spot-bus': ['#EFC39B', '#EFE0C8'], hero: ['#F2CFA4', '#F6EBD9'],
    'mugi-puppy': ['#E6E0D2', '#F4EFE4'], 'mugi-adult': ['#CFE3EC', '#F2E9D6'], 'mugi-senior': ['#F1D6B3', '#F5EBDC'], 'end-bus': ['#E59A7A', '#F4D2B0'], 'end-sea': ['#F0A77D', '#FAE0BF']
  };
  const SIL = {
    'spot-gate': '<rect x="120" y="150" width="160" height="80" fill="#C98C6B"/><path d="M110 150l90-60l90 60z" fill="#A86E52"/><rect x="60" y="190" width="70" height="40" fill="#8C6A4F"/><rect x="300" y="170" width="22" height="60" rx="4" fill="#C8553D"/>',
    'spot-bakery': '<rect x="110" y="120" width="190" height="110" fill="#F3E3C6"/><path d="M100 120h210l-12 26H112z" fill="#C8553D"/><path d="M112 146h186" stroke="#fff" stroke-width="6" stroke-dasharray="14 14"/><rect x="180" y="170" width="50" height="60" fill="#8C6A4F"/>',
    'spot-park': '<circle cx="120" cy="140" r="50" fill="#F1C6C6"/><circle cx="220" cy="120" r="62" fill="#EFB7B9"/><circle cx="320" cy="145" r="48" fill="#F3CDCD"/><rect x="215" y="170" width="10" height="60" fill="#8C6A4F"/><rect x="250" y="200" width="80" height="8" fill="#8C6A4F"/>',
    'spot-shrine': '<path d="M110 90h180M130 110h140" stroke="#C8553D" stroke-width="12"/><path d="M145 90v140M255 90v140" stroke="#C8553D" stroke-width="12"/><path d="M120 230h160l-20-12h-120z" fill="#B7A48A"/>',
    'spot-river': '<path d="M0 200q100-30 200 0t200 0v80H0z" fill="#9EC3D6"/><rect x="0" y="150" width="400" height="18" fill="#B7A48A"/><path d="M40 168v40M140 168v40M260 168v40M360 168v40" stroke="#B7A48A" stroke-width="10"/>',
    'spot-sea': '<path d="M0 180h400v100H0z" fill="#8FBCD0"/><circle cx="300" cy="170" r="30" fill="#FBE3B0"/><rect x="80" y="90" width="18" height="90" fill="#fff"/><path d="M76 90h26l-13-14z" fill="#C8553D"/>',
    'spot-bus': '<rect x="190" y="90" width="8" height="140" fill="#6E6258"/><rect x="160" y="80" width="68" height="36" rx="18" fill="#fff" stroke="#6E6258" stroke-width="4"/><rect x="240" y="190" width="100" height="10" fill="#8C6A4F"/>',
    'end-bus': '<rect x="180" y="100" width="8" height="130" fill="#4B3A2C"/><rect x="150" y="90" width="68" height="34" rx="17" fill="#FBEBD8"/><rect x="230" y="150" width="170" height="80" rx="10" fill="#FBEBD8" opacity=".9"/><circle cx="392" cy="210" r="8" fill="#FFE7A6"/>',
    'end-sea': '<path d="M0 190h400v90H0z" fill="#E7A27D"/><circle cx="200" cy="185" r="46" fill="#FDE3B2"/><path d="M0 190h400" stroke="#FFF1D8" stroke-width="2"/>'
  };
  MG.scene = (name) => {
    const g = SKY[name] || SKY.hero, id = 'mgs-' + name;
    const dog = /^(mugi|hero|end-sea)/.test(name) ? `<g class="scene-dog ${name === 'mugi-puppy' ? 'puppy' : name === 'mugi-senior' ? 'senior' : 'adult'}"><use href="#mg-dog" x="${name === 'end-sea' ? 150 : 120}" y="${name === 'end-sea' ? 150 : 110}" width="${name === 'end-sea' ? 70 : 160}" height="${name === 'end-sea' ? 52 : 120}"/></g>` : '';
    return `<svg class="scene" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><rect width="400" height="280" fill="url(#${id})"/><rect y="230" width="400" height="50" fill="#E3D5B8"/>${SIL[name] || ''}${dog}</svg>`;
  };
  MG.ph = (name, alt, cls = '', cap = '') => `<figure class="ph ${cls}"><img src="img/${name}.jpg" alt="${esc(alt)}" data-fb="${name}">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fb) img.outerHTML = MG.scene(img.dataset.fb);
  }, true);

  /* ---------- 年めくり ---------- */
  const YEARS = Array.from({ length: 15 }, (_, i) => 2011 + i);
  $('#dial-track').innerHTML = YEARS.map(y => `<button type="button" data-year="${y}"><span>${y}</span></button>`).join('');
  function setYear(y, rerender = true) {
    st.year = Math.max(2011, Math.min(2025, y)); save();
    $$('#dial-track button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.year === st.year)));
    const cur = $(`#dial-track [data-year="${st.year}"]`);
    const tr = $('#dial-track'); tr.scrollTo({ left: cur.offsetLeft - tr.clientWidth / 2 + cur.offsetWidth / 2, behavior: rerender ? 'smooth' : 'auto' });
    const a = MG.age(st.year);
    $('#dial-now').innerHTML = `<b>${st.year}</b>　むぎ ${a.mugi === 0 ? '0' : a.mugi}さい・ハル ${MG.grade(st.year)}`;
    document.body.dataset.era = era(st.year);
    if (rerender && MG.onYear) MG.onYear(st.year);
  }
  $('#dial').addEventListener('click', e => {
    const b = e.target.closest('[data-year]'), s = e.target.closest('[data-step]');
    if (b) setYear(+b.dataset.year); else if (s) setYear(st.year + +s.dataset.step);
  });

  /* ---------- なふだメニュー ---------- */
  function menu() {
    const items = [['', 'さんぽみち'], ['diary', 'さんぽ帳'], ['mugi', 'むぎの こと'], ['notes', 'こうかんノート']];
    if (st.himitsu) items.push(['himitsu', 'ひみつきち']);
    if (st.rusuban) items.push(['rusuban', 'るすばん帳']);
    items.push(['tsuzuki', 'つづきの さんぽ']);
    if (st.ended) items.push(['end', 'てがみ']);
    $('#menu-list').innerHTML = items.map(([h, t]) => `<li><a href="#/${h}">${t}</a></li>`).join('');
  }
  const toggleMenu = on => { $('#menu').hidden = !on; $('#collar').setAttribute('aria-expanded', String(on)); document.body.classList.toggle('menu-open', on); };
  $('#collar').addEventListener('click', () => toggleMenu($('#menu').hidden));
  $('#menu').addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleMenu(false); $('#buddy-say').hidden = true; } });

  /* ---------- むぎのヒント（クンクン） ---------- */
  /* 考えている時間（ヒントは、時間がたつと一段ずつ教えてくれる）
     いまの段階にいる時間を、画面が見えているあいだだけ数える。 */
  const HINT_AT = [2, 5, 8].map(m => m * 60000);
  setInterval(() => {
    if (document.visibilityState !== 'visible' || st.ended) return;
    const k = stage();
    st.clock = st.clock || {}; st.clock[k] = (st.clock[k] || 0) + 5000;
    st.playMs = (st.playMs || 0) + 5000;
    save();
  }, 5000);
  const fmtLeft = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.ceil(s / 60) + 'ふん' : s + 'びょう'; };
  function sniff(more) {
    const s = stage(), hs = MG.hints[s];
    const seen = st.hintLv[s] == null ? -1 : st.hintLv[s];      // いままでに 教えてもらった段（-1 は まだ）
    const want = more || seen < 0 ? Math.min(hs.length - 1, seen + 1) : seen;
    const left = hs.length > 1 && want > seen ? Math.max(0, HINT_AT[Math.min(want, 2)] - ((st.clock || {})[s] || 0)) : 0;
    let lv = want;
    if (left > 0) {
      lv = seen;
      $('#buddy-text').innerHTML = `<span class="kun">クンクン…</span>${seen >= 0 ? esc(hs[seen]) + '<br>' : ''}（むぎは まだ においを たどっている。あと ${fmtLeft(left)}くらい まってみよう）`;
    } else {
      st.hintLv[s] = lv; save();
      $('#buddy-text').innerHTML = `<span class="kun">クンクン…</span>${esc(hs[lv])}`;
    }
    $('#buddy-more').hidden = lv >= hs.length - 1 || left > 0;
    $('#buddy-say').hidden = false;
    const b = $('#buddy'); b.classList.remove('sniff'); void b.offsetWidth; b.classList.add('sniff');
  }
  $('#buddy').addEventListener('click', () => $('#buddy-say').hidden ? sniff(false) : ($('#buddy-say').hidden = true));
  $('#buddy-more').addEventListener('click', () => sniff(true));
  $('#buddy-close').addEventListener('click', () => { $('#buddy-say').hidden = true; });

  /* ---------- ふわっと出す ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  const reveal = root => $$('.rv', root).forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- ルーター ---------- */
  const routes = {};
  let cur = null;
  /* 画面の切りかえ演出（View Transitions）。画面が見えていないときや、途中で次の切りかえが来たときは
     失敗の知らせ（Promise の reject）が来るので、握りつぶして中身だけは必ず切りかえる */
  const viewTransit = (fn) => {
    if (!document.startViewTransition || document.hidden) { fn(); return; }
    try {
      const t = document.startViewTransition(fn);
      [t.ready, t.finished, t.updateCallbackDone].forEach(p => p && p.catch(() => {}));
    } catch (e) { fn(); }
  };
  function dispatch() {
    const [head, ...args] = location.hash.replace(/^#\/?/, '').split('/');
    const view = routes[head] ? head : '';
    const go = () => {
      MG.map.stop();
      const page = $('#page');
      page.innerHTML = routes[view](...args.map(decodeURIComponent)) || '';
      document.body.dataset.page = view || 'top';
      menu();
      reveal(page);
      if (MG.after) MG.after(view, args);
      if (cur !== null) { window.scrollTo(0, 0); page.focus({ preventScroll: true }); }
      cur = view;
    };
    if (cur !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches) viewTransit(go); else go();
  }
  addEventListener('hashchange', dispatch);

  const toast = msg => {
    let t = $('.toast');
    if (!t) { t = document.createElement('p'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  };

  Object.assign(MG, { $, $$, esc, norm, fmt, era, text, st: () => st, save, stage, routes, dispatch, setYear, reveal, toast, menu });
  addEventListener('DOMContentLoaded', () => { setYear(st.year, false); dispatch(); });
})();
