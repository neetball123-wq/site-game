/* 霞野線アーカイブ — 写真集としての見せ方：表紙、目次、路線のしおり、写真、奥付 */
(() => {
  'use strict';
  const { D, $, $$, esc, state, routes, station, addStamp, hasStamp, modal, ymd } = K;
  const art = K.art;

  const TOC = [
    ['', '序', 'この本について', 1], ['route', '一', '路線図', 12], ['timetable', '二', '時刻表', 24],
    ['gallery', '三', '写真', 36], ['car', '四', '保存車両', 58], ['stamps', '五', 'スタンプ帳', 64],
    ['bbs', '六', '掲示板', 72], ['diary', '七', '管理人日記', 88], ['links', '付', 'リンク', 96]
  ];
  const CHAP = Object.fromEntries(TOC.map(t => [t[0], t]));
  CHAP.station = ['station', '一', '駅', 14];
  CHAP.archive = ['archive', '付', '資料室', 99];

  /* ---------- 写真（画像ファイルがなければ、今までの絵に戻す） ---------- */
  const SPOTS = {
    'p-enden': '<button type="button" class="hotspot spot" data-stamp="enden" style="left:59.4%;top:21%;width:8.4%;height:17.6%" aria-label="壁に掛かった小さな木の箱"></button>',
    'p-post': '<span class="km-face" aria-hidden="true" style="left:48.2%;top:64.5%;width:4.1%"><b>10</b><i>.</i><s></s></span>',
    'p-last': '<span class="dest-plate" aria-hidden="true" style="left:31.9%;top:22.7%;width:7.8%;height:3.9%">灘浜</span>'
  };
  const HERO_FB = '<svg class="hero-fb" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="bk-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E95A6"/><stop offset=".55" stop-color="#E8A27A"/><stop offset="1" stop-color="#6C5A55"/></linearGradient></defs>'
    + '<rect width="1536" height="1024" fill="url(#bk-dusk)"/><circle cx="1226" cy="626" r="18" fill="#FFD9A0"/><path d="M0 640c160-60 260-40 360 30h1176v354H0z" fill="#3B3431"/><rect y="700" width="1536" height="324" fill="#7E6E6B"/>'
    + '<path d="M0 716h1536" stroke="#2A2422" stroke-width="10"/>' + Array.from({ length: 26 }, (_, i) => `<path d="M${i * 60} 720l30 44l30-44" stroke="#2A2422" stroke-width="5" fill="none"/>`).join('')
    + '<rect x="416" y="684" width="152" height="30" rx="4" fill="#E9D6B4"/><rect x="416" y="702" width="152" height="12" fill="#C0582F"/></svg>';
  K.print = (id, alt, spots = true) => `<div class="print" data-photo="${id}"><img src="img/${id}.jpg" alt="${esc(alt)}" decoding="async">${spots ? SPOTS[id] || '' : ''}</div>`;
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const box = img.closest('.print');
    if (!box || box.classList.contains('fb')) return;
    box.classList.add('fb');
    box.innerHTML = box.dataset.photo === 'hero' ? HERO_FB : art.photo(box.dataset.photo);
  }, true);

  // 写真の中の隠れたスタンプ（塩田駅）
  function stampFound(id) {
    const s = station(id);
    const body = modal(`<div class="stamp-zoom">${art.stamp(s, { cls: 'big' })}<p>${esc(s.name)}駅のスタンプを見つけた。</p>`
      + `<button type="button" class="btn" id="copy-stamp"${hasStamp(id) ? ' disabled' : ''}>${hasStamp(id) ? '写しました' : 'スタンプ帳に写す'}</button></div>`, 'm-stamp');
    $('#copy-stamp', body).addEventListener('click', e => { if (addStamp(id)) { e.currentTarget.disabled = true; e.currentTarget.textContent = '写しました'; } });
  }
  const spotHit = e => e.target.closest('.lightbox .hotspot[data-stamp], .print .hotspot[data-stamp]');
  document.addEventListener('click', e => { const h = spotHit(e); if (h) { e.stopPropagation(); closeLightbox(); stampFound(h.dataset.stamp); } });
  document.addEventListener('keydown', e => { const h = spotHit(e); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); closeLightbox(); stampFound(h.dataset.stamp); } });

  /* ---------- 序：表紙 ---------- */
  routes[''] = () => {
    K.clearPage();
    const upd = [...(state.ended ? [[ymd(new Date(state.endedAt)), '第十三刷。十三番目の駅を追補しました']] : []), ...D.updates];
    const slip = state.ended
      ? '<p>管理人です。戻りました。ご心配をおかけしました。</p><p>くわしくは、七章の日記に書きました。</p><p class="slip-sign">ミナト</p>'
      : '<p>管理人のミナトさんと、九月五日の夜から連絡がとれません。</p><p>最後の日記は、限定公開のままになっています。お心当たりのある方は、六章「掲示板」まで。</p><p class="slip-sign">会員有志</p>';
    K.page('<section class="cover">'
      + `<div class="cover-photo">${K.print('hero', '夕暮れの鉄橋をわたる一両の気動車')}</div>`
      + '<div class="cover-title"><h1 class="ct-name">霞野線</h1><p class="ct-sub">海から、霧の高原まで</p></div>'
      + '<p class="cover-foot"><span>北灘鉄道 霞野線　写真と記録</span><span>1931 — 1987</span></p></section>'
      + `<aside class="slip${state.ended ? ' back' : ''}" aria-label="はさみこみ"><p class="slip-head">はさみこみ</p>${slip}</aside>`
      + (state.ended ? '' : '<section class="howto"><h2>この本の読み方</h2><p>このサイトは、ページの中を調べながら進める体験型の謎解きです（目安：約25分）。わかったことは、右下の「調査ノート」に自動で書き留められます。</p></section>')
      + '<section class="preface"><h2 class="ch"><span>序</span>この本について</h2><div class="prose">'
      + '<p>灘浜の魚市場の声を背中に聞きながら、一両きりの気動車は海沿いを走り出す。汐入で上りの列車とすれ違い、霞沢で湖の霧をくぐり、峠口で息を切らし、雲井を越える。終点の霞野に着くころには、窓の外はもう高原の空気だった。</p>'
      + `<p>二十四・六キロ。${state.ended ? '十二と、もうひとつの駅' : '十二の駅'}。一九三一年から一九八七年まで、五十六年。</p>`
      + '<p>この本は、その小さな鉄道を覚えている人たちの写真と記憶を、少しずつ集めたものです。</p></div>'
      + '<dl class="spec-mini"><div><dt>区間</dt><dd>灘浜 — 霞野</dd></div><div><dt>営業キロ</dt><dd>24.6 km</dd></div><div><dt>線路</dt><dd>1067mm 単線・非電化</dd></div><div><dt>廃止</dt><dd>1987.3.31</dd></div></dl></section>'
      + '<section class="toc-inline"><h2 class="ch"><span>目</span>目次</h2>' + tocList() + '</section>'
      + `<section class="revisions"><h2>改訂の記録</h2><ul>${upd.map(([d, t]) => `<li><time>${d}</time><span>${esc(t)}</span></li>`).join('')}</ul></section>`);
  };
  const tocList = () => '<ol class="toc-list">' + TOC.map(([h, no, t, pg], i) => `<li style="--i:${i}"><a href="#/${h}"><span class="toc-no">${no}</span><span class="toc-t">${t}</span><span class="toc-dots"></span><span class="toc-pg">${pg}</span></a></li>`).join('') + '</ol>';

  /* ---------- 三：写真（写真集の見開き） ---------- */
  const SIZES = ['wide', 'half', 'half', 'tall', 'wide', 'half', 'half'];
  routes.gallery = () => {
    K.clearPage();
    const p = K.page('<h1 class="page-title">写真</h1><p class="lead">会員のみなさんから寄せられた写真です。写真を押すと大きく見られます。</p>'
      + '<div class="album">' + D.gallery.map((g, i) => `<figure class="plate plate--${SIZES[i % SIZES.length]}"><button type="button" class="plate-btn" data-i="${i}" aria-label="${esc(g.title)}を大きく見る">${K.print(g.id, g.title, false)}</button>`
        + `<figcaption><span class="pl-no">図 3-${i + 1}</span><b>${esc(g.title)}</b><small>${esc(g.year)}</small></figcaption></figure>`).join('') + '</div>');
    $$('.plate-btn', p).forEach(b => b.addEventListener('click', () => openLightbox(+b.dataset.i)));
  };
  let lbIndex = 0;
  function openLightbox(i) {
    lbIndex = (i + D.gallery.length) % D.gallery.length;
    const g = D.gallery[lbIndex];
    let lb = $('#lightbox');
    if (!lb) { lb = document.createElement('div'); lb.id = 'lightbox'; lb.className = 'lightbox'; document.body.appendChild(lb); }
    lb.innerHTML = `<div class="lb-inner">${K.print(g.id, g.title)}<div class="lb-cap"><span class="pl-no">図 3-${lbIndex + 1}</span><b>${esc(g.title)}</b><small>${esc(g.year)}</small><p>${esc(g.caption)}</p></div></div>`
      + '<button type="button" class="lb-x" aria-label="閉じる">×</button><button type="button" class="lb-prev" aria-label="前の写真">‹</button><button type="button" class="lb-next" aria-label="次の写真">›</button>';
    lb.hidden = false;
    document.body.classList.add('lb-open');
    $('.lb-x', lb).onclick = closeLightbox;
    $('.lb-prev', lb).onclick = () => openLightbox(lbIndex - 1);
    $('.lb-next', lb).onclick = () => openLightbox(lbIndex + 1);
    lb.onclick = e => { if (e.target === lb) closeLightbox(); };
    $('.lb-x', lb).focus({ preventScroll: true });
  }
  function closeLightbox() { const lb = $('#lightbox'); if (lb) { lb.hidden = true; lb.innerHTML = ''; } document.body.classList.remove('lb-open'); }
  addEventListener('keydown', e => {
    const lb = $('#lightbox');
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(lbIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(lbIndex + 1);
  });

  /* ---------- 駅のページに写真を添える ---------- */
  const STATION_PHOTO = { nadahama: 'p-nada', sakurazaka: 'p-sakura', kasumisawa: 'p-kasumi', kirinodai: 'p-kiri', kasumino: 'p-last' };
  const baseStation = routes.station;
  routes.station = args => {
    baseStation(args);
    const id = args[0], ph = STATION_PHOTO[id], pg = $('.st-page');
    if (!ph || !pg) return;
    const g = D.gallery.find(x => x.id === ph);
    pg.classList.add('has-photo');
    $('.ekimei', pg).insertAdjacentHTML('afterend', `<figure class="st-photo">${K.print(ph, g.title)}<figcaption>${esc(g.title)}　${esc(g.year)}</figcaption></figure>`);
  };

  /* ---------- 目次・路線のしおり・奥付 ---------- */
  const toc = $('#gnav'), menu = $('#bk-menu');
  toc.innerHTML = `<div class="toc-inner"><p class="toc-head">目次</p>${tocList()}<p class="toc-foot"><a href="#/archive">資料室（会員専用）</a></p></div>`;
  const setToc = open => { toc.hidden = !open; menu.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('toc-open', open); };
  menu.addEventListener('click', () => setToc(toc.hidden));
  toc.addEventListener('click', e => { if (e.target === toc) setToc(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setToc(false); });

  function rail() {
    const stops = (state.tsuki ? [...D.stations, D.tsukimino] : D.stations).slice().sort((a, b) => a.km - b.km);
    $('#rail').innerHTML = '<span class="rail-line"></span><span class="rail-train" aria-hidden="true"></span>'
      + stops.map(s => `<a class="rail-st${s.id === 'tsukimino' ? ' ghost' : ''}${hasStamp(s.id) ? ' got' : ''}" href="#/station/${s.id}" style="top:${(s.km / 24.6) * 100}%"><i></i><span>${esc(s.name)}</span></a>`).join('');
  }

  K.afterRoute = (head, view) => {
    setToc(false);
    closeLightbox();
    if (view !== 'site') return;
    const c = CHAP[head] || CHAP[''];
    $('#bk-folio').textContent = head === '' ? '' : `${c[1]}　${c[2]}　p.${c[3]}`;
    const t = $('#page .page-title');
    if (t && !t.querySelector('.chap-no')) t.insertAdjacentHTML('afterbegin', `<span class="chap-no">${c[1]}</span>`);
    document.body.dataset.page = head || 'cover';
    rail();
    $('#colo-rev').textContent = state.ended ? `${ymd(new Date(state.endedAt), '年').replace(/年(\d+)年/, '年$1月')}日　第十三刷` : '2026年9月5日　第十二刷';
  };
})();
