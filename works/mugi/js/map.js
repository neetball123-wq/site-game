/* さんぽみちの地図：年ごとのコースを描き、むぎがその上を歩く */
(() => {
  const S = MG.spots;
  const pt = id => [S[id].x, S[id].y];

  // 点列をなめらかな曲線に（Catmull-Rom → ベジェ）
  function smooth(ids) {
    const p = ids.map(pt);
    if (p.length < 2) return '';
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
      const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0]} ${c[1]}`;
    }
    return d;
  }

  const ICON = {
    gate: '<path d="M-9 8V-4h18V8M-11 -4h22M-6 -4v-5h12v5" fill="none"/>',
    bakery: '<path d="M-10 -2c0-7 20-7 20 0v8h-20z" fill="none"/><path d="M-5 -3v8M0 -4v9M5 -3v8"/>',
    park: '<circle cx="0" cy="-3" r="7" fill="none"/><path d="M0 4v6"/>',
    shrine: '<path d="M-11 -7h22M-8 -3h16M-6 -7v15M6 -7v15"/>',
    river: '<path d="M-11 -3q5-5 11 0t11 0M-11 4q5-5 11 0t11 0" fill="none"/>',
    sea: '<path d="M-3 9V-8h6V9M-6 9h12M-5 -8h10l-5-4z" fill="none"/>',
    bus: '<rect x="-2" y="-11" width="4" height="21"/><rect x="-8" y="-11" width="16" height="9" rx="4" fill="none"/>'
  };

  function base(id) {
    const houses = [[430, 290], [590, 300], [600, 395], [440, 400], [800, 400], [860, 300], [280, 400], [650, 250], [400, 250], [900, 420], [690, 440]]
      .map(([x, y], i) => `<g transform="translate(${x} ${y})"><path d="M-14 0l14-11l14 11z" fill="${i % 3 ? '#C98C6B' : '#8FA7B5'}"/><rect x="-11" y="0" width="22" height="14" fill="#FBF6EC"/></g>`).join('');
    const sakura = [[705, 150], [728, 136], [752, 132], [776, 140], [792, 160], [716, 205], [790, 205]]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 15 : 12}" fill="${i === 2 ? '#EFB7B9' : '#F3CDCD'}"/>`).join('');
    const trees = [[300, 150], [330, 175], [640, 120], [880, 180], [920, 230], [80, 380], [60, 150], [290, 470], [560, 470], [820, 480]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#A9BE8A"/><circle cx="${x + 9}" cy="${y + 5}" r="9" fill="#97AF78"/>`).join('');
    return `
      <rect width="1000" height="640" fill="var(--land)"/>
      <path d="M380 160C400 70 470 40 520 40s130 30 150 120z" fill="#DCE0BD"/>
      <path d="M0 520C180 500 380 548 600 526S880 505 1000 522V640H0z" fill="var(--sea)"/>
      <path d="M60 560q20-8 40 0M420 590q20-8 40 0M700 560q20-8 40 0M860 600q20-8 40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
      <path d="M235 -10C205 120 140 190 172 290S118 440 112 530" stroke="var(--river)" stroke-width="40" fill="none" stroke-linecap="round"/>
      <g class="roads" stroke="#FBF6EA" stroke-width="16" fill="none" stroke-linecap="round">
        <path d="M60 345H980"/><path d="M520 345V92"/><path d="M730 345L745 175"/><path d="M355 345C350 430 340 500 330 575"/><path d="M190 250C260 280 300 330 355 345"/>
      </g>
      <rect x="140" y="236" width="70" height="16" rx="3" fill="#B7A48A"/>
      ${trees}${sakura}${houses}
      <g transform="translate(470 575)"><rect x="-6" y="-38" width="12" height="38" fill="#fff" stroke="#8C7A66" stroke-width="2"/><path d="M-9 -38h18l-9 -10z" fill="#C8553D"/></g>
      <g class="compass" transform="translate(920 80)" font-family="Kiwi Maru" font-size="16" fill="var(--ink)" text-anchor="middle">
        <circle r="34" fill="#FBF6EC" stroke="var(--ink)" stroke-width="1.5"/>
        <path d="M0 -26L7 0L0 26L-7 0z" fill="#E7DCC6"/><path d="M0 -26L7 0H-7z" fill="#C8553D"/>
        <text y="-40">北</text><text y="54">南</text><text x="-48" y="6">西</text><text x="48" y="6">東</text>
      </g>`;
  }

  function markers(year, opts) {
    const counts = {};
    MG.diary.forEach(e => { if (+e.d.slice(0, 4) === year) counts[e.s] = (counts[e.s] || 0) + 1; });
    const course = MG.course(year), on = new Set([...course.c, ...(course.b || [])]);
    return Object.entries(S).map(([id, s]) => {
      const far = !opts.pick && !on.has(id) && !counts[id];
      const tag = opts.pick ? `<g class="spot${far ? ' far' : ''}" data-pick="${id}" tabindex="0" role="button" aria-label="${s.name}">` : `<a class="spot${far ? ' far' : ''}" href="#/spot/${id}" aria-label="${s.name}">`;
      return `${tag}<g transform="translate(${s.x} ${s.y})">
        <circle class="hit" r="46" fill="transparent"/><circle class="ring" r="24"/><g class="ico" stroke-width="2.2" stroke-linecap="round">${ICON[id]}</g>
        ${counts[id] && !opts.pick ? `<g transform="translate(18 -18)"><circle r="10" fill="var(--red)"/><text y="4" text-anchor="middle" font-size="11" fill="#fff">${counts[id]}</text></g>` : ''}
        <text class="lbl" y="46" text-anchor="middle">${s.name}</text></g>${opts.pick ? '</g>' : '</a>'}`;
    }).join('');
  }

  // 地図を描く。opts: { pick: bool（行き先選び）, evening: bool, dog: 'puppy'|'adult'|'senior'|null }
  function render(el, year, opts = {}) {
    const course = MG.course(year);
    const main = smooth(course.c), bday = course.b ? smooth(course.b) : '';
    const eve = opts.evening && MG.evening(year) ? smooth(['gate', 'bus']) : '';
    el.innerHTML = `<svg class="map" viewBox="0 0 1000 640" role="img" aria-label="${year}年の さんぽみち">
      <defs><mask id="mg-draw"><path class="draw" d="${main}" stroke="#fff" stroke-width="14" fill="none"/></mask></defs>
      ${base()}
      ${bday ? `<path class="route bday" d="${bday}"/>` : ''}
      ${eve ? `<path class="route eve" d="${eve}"/>` : ''}
      <path class="route main" d="${main}" mask="url(#mg-draw)"/>
      ${markers(year, opts)}
      ${opts.dog === null ? '' : `<g class="mapdog ${opts.dog || dogAge(year)}"><g class="flip"><use href="#mg-dog" x="-30" y="-44" width="60" height="45"/></g></g>`}
    </svg>`;
    const svg = el.firstElementChild, draw = svg.querySelector('.draw');
    const len = draw.getTotalLength();
    draw.style.strokeDasharray = len; draw.style.setProperty('--len', len);
    if (opts.dog !== null) walk(svg, svg.querySelector('.route.main'), opts);
    // 横にスクロールする狭い画面では、まん中から見せる
    const center = () => { if (el.scrollWidth > el.clientWidth && !el.dataset.centered) { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; el.dataset.centered = '1'; } };
    setTimeout(center, 60); setTimeout(center, 400);
    return svg;
  }

  const dogAge = y => y <= 2011 ? 'puppy' : y >= 2021 ? 'senior' : 'adult';

  // むぎを道の上で歩かせる（年をとるほどゆっくり）
  let raf = 0;
  function walk(svg, path, opts) {
    cancelAnimationFrame(raf);
    const dog = svg.querySelector('.mapdog'), flip = dog.querySelector('.flip');
    const len = path.getTotalLength();
    if (opts.still || len < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const p = path.getPointAtLength(opts.at || 0);
      dog.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (opts.face === 'left') flip.setAttribute('transform', 'scale(-1 1)');
      return;
    }
    const speed = dog.classList.contains('senior') ? 26 : dog.classList.contains('puppy') ? 60 : 70;
    let t0 = performance.now(), px = null;
    const step = now => {
      if (!svg.isConnected) return;
      const d = ((now - t0) / 1000 * speed) % len, p = path.getPointAtLength(d);
      if (px !== null && Math.abs(p.x - px) > .05) flip.setAttribute('transform', p.x < px ? 'scale(-1 1)' : '');
      px = p.x;
      dog.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  MG.map = { render, smooth, dogAge, stop: () => cancelAnimationFrame(raf) };
})();
