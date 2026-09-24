/* NEMURE — 夢見坂TVの見せ方：速報テロップ、リモコン、ON AIR 表示 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // お知らせ一覧が描き変わるたびに、速報テロップも作り直す（切れ目なく流すため2周ぶん）
  const list = $('#news-list'), track = $('#ticker');
  function buildTicker() {
    const items = $$('a', list).map(a => `<a href="${a.getAttribute('href')}"><time>${a.querySelector('.news-date').textContent}</time>${a.querySelector('.news-title').textContent}</a>`).join('');
    track.innerHTML = items + items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
  }
  new MutationObserver(buildTicker).observe(list, { childList: true });
  buildTicker();

  // リモコン：チャンネルを変えると一瞬だけ砂嵐
  $$('#remote a').forEach(a => a.addEventListener('click', () => {
    if (reduced) return;
    document.body.classList.add('chswitch');
    setTimeout(() => document.body.classList.remove('chswitch'), 260);
  }));
  const links = Object.fromEntries($$('#remote a').map(a => [a.dataset.ch, a]));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    Object.values(links).forEach(a => a.removeAttribute('aria-current'));
    if (links[en.target.id]) links[en.target.id].setAttribute('aria-current', 'true');
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main .sec').forEach(s => io.observe(s));

  // 25時台（午前1時台）だけ ON AIR
  function onair() {
    const h = new Date().getHours(), el = $('#onair');
    const live = h === 1;
    el.classList.toggle('live', live);
    $('span', el).textContent = live ? 'ON AIR' : h >= 2 && h < 5 ? '放送終了' : 'NEXT 25:00';
  }
  onair();
  setInterval(onair, 30000);
})();
