/* ぬか床、百年 — 絵（台所・入れもの・野菜・はがき） 台所は 800×600 */
(function (root) {
  const NK = root.NK;
  const A = NK.art = {};
  const R = (x, y, w, h, fill, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${ex}/>`;
  const P = (pts, fill, ex = '') => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" ${ex}/>`;
  const lerpC = (a, b, t) => {
    t = Math.max(0, Math.min(1, t));
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
    return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  A.lerpC = lerpC;

  /* ---- 空（実際の時刻） ---- */
  A.skyOf = (d) => {
    const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 5 && h < 8) return { id: 'asa', top: '#9fb8d8', bot: '#f6c9a0', light: 0.85 };
    if (h >= 8 && h < 16) return { id: 'hiru', top: '#7fb4e2', bot: '#d4e8f4', light: 1 };
    if (h >= 16 && h < 19) return { id: 'yu', top: '#6a6fa8', bot: '#f2a26a', light: 0.8 };
    return { id: 'yoru', top: '#0e1530', bot: '#2a3558', light: 0.55 };
  };

  /* ---- 入れもの（ぬかの面の位置） ---- */
  A.K = [1.45, 1.32, 1.2, 1.1, 1.08, 1.08];
  A.RAW = [
    { cy: 404, rx: 98, ry: 25 },
    { cy: 378, rx: 128, ry: 33 },
    { cy: 352, rx: 160, ry: 42 },
    { cy: 336, rx: 188, ry: 50 },
    { cy: 336, rx: 196, ry: 52 },
    { cy: 336, rx: 196, ry: 52 },
  ];
  A.BED = A.RAW.map((b, c) => ({ cy: 570 - (570 - b.cy) * A.K[c], rx: b.rx * A.K[c], ry: b.ry * A.K[c] }));
  /* 漬ける場所（奥から手前の順） */
  A.slotPos = (n, cont) => {
    const b = A.BED[cont], out = [];
    const rings = n <= 5 ? [[0.62, n]] : n <= 11 ? [[0.32, Math.max(2, Math.round(n * 0.3))], [0.74, 0]] : [[0.22, 3], [0.52, Math.round((n - 3) * 0.4)], [0.82, 0]];
    let left = n;
    rings.forEach((rg, k) => { if (k === rings.length - 1) rg[1] = left; left -= rg[1]; });
    rings.forEach(([f, m], k) => {
      for (let i = 0; i < m; i++) {
        const a = (i / m) * Math.PI * 2 + (k % 2 ? Math.PI / m : 0) + 0.3;
        out.push({ x: 400 + Math.cos(a) * b.rx * f, y: b.cy + Math.sin(a) * b.ry * f, s: (n > 11 ? 0.82 : n > 5 ? 0.95 : 1.12) * Math.min(1.2, 0.75 + b.rx / 400) });
      }
    });
    return out;
  };

  /* ---- 野菜（ぬかから顔を出したところ）。t=漬かり具合 0〜1.8 ---- */
  A.veg = (id, t, ex = {}) => {
    const v = NK.VEG[NK.VEGI[id]];
    const c = ex.tetsu && id === 'nasu' ? lerpC(v.col, '#1f2a6b', t / 1.4) : lerpC(v.col, v.pick, t / 1.6);
    const shine = t < 1.2 ? 0.35 : 0.15;
    switch (id) {
      case 'kyuri': return `<g transform="rotate(-25)"><rect x="-7" y="-26" width="14" height="30" rx="7" fill="${c}"/><rect x="-5" y="-24" width="3" height="24" rx="1.5" fill="#fff" opacity="${shine}"/>${[-18, -10, -2].map((y) => `<circle cx="4" cy="${y}" r="1" fill="#2f5a22" opacity=".6"/>`).join('')}<path d="M0-26v-5" stroke="#8a7a3a" stroke-width="2"/></g>`;
      case 'kabu': return `<g><path d="M-2-14q-6-14-2-22M2-14q4-12 10-18M0-14q0-12-2-20" stroke="#6aa04a" stroke-width="3" fill="none"/><ellipse cx="0" cy="-6" rx="12" ry="10" fill="${c}"/><ellipse cx="-4" cy="-9" rx="4" ry="3" fill="#fff" opacity="${shine + 0.2}"/></g>`;
      case 'nasu': return `<g transform="rotate(15)"><path d="M0-30q12 8 10 22q-2 10-10 10q-8 0-10-10q-2-14 10-22z" fill="${c}"/><path d="M-7-27q7-6 14 0l-2 4h-10z" fill="#4a6a2a"/><path d="M0-31v-5" stroke="#4a6a2a" stroke-width="2.5"/><ellipse cx="-4" cy="-14" rx="2.5" ry="7" fill="#fff" opacity="${shine}"/></g>`;
      case 'ninjin': return `<g transform="rotate(-10)"><path d="M-7-22h14l-5 24h-4z" fill="${c}"/><path d="M-5-16h6M-4-8h5" stroke="#a84a1a" stroke-width="1" opacity=".5"/><path d="M-2-22q-6-10-4-16M2-22q4-10 2-16M0-22v-14" stroke="#5f9a3a" stroke-width="2.5" fill="none"/></g>`;
      case 'cabbage': return `<g><path d="M-16 0q2-20 16-22q14 2 16 22z" fill="${c}"/><path d="M-10 0q2-14 10-16M10 0q-2-14-10-16M0 0v-20" stroke="#7a9a4a" stroke-width="1.5" fill="none"/><path d="M-12-2q12-6 24 0" stroke="#e9f0c8" stroke-width="2" fill="none" opacity=".6"/></g>`;
      case 'daikon': return `<g transform="rotate(8)"><rect x="-10" y="-26" width="20" height="30" rx="5" fill="${c}"/><rect x="-7" y="-24" width="4" height="26" rx="2" fill="#fff" opacity="${shine}"/><path d="M-4-26q-8-10-4-18M4-26q8-10 4-18M0-26v-16" stroke="#5f9a3a" stroke-width="3" fill="none"/></g>`;
      case 'myoga': return `<g transform="rotate(-8)"><path d="M0-26q9 6 8 20q-1 6-8 6q-7 0-8-6q-1-14 8-20z" fill="${c}"/><path d="M-4-20q4 4 8 0M-5-12q5 4 10 0" stroke="#fff" stroke-width="1" opacity=".5" fill="none"/></g>`;
      case 'celery': return `<g>${[-7, 0, 7].map((x, i) => `<path d="M${x} 2q${i - 1} -16 ${x * 0.3} -30" stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"/>`).join('')}<path d="M-4-30q4-6 8 0" stroke="#7ab04a" stroke-width="4" fill="none"/></g>`;
      case 'goya': return `<g transform="rotate(-20)"><rect x="-8" y="-28" width="16" height="32" rx="8" fill="${c}"/>${[-22, -14, -6].map((y) => `<circle cx="-4" cy="${y}" r="2" fill="#3e6a22"/><circle cx="4" cy="${y + 4}" r="2" fill="#3e6a22"/>`).join('')}</g>`;
      case 'nagaimo': return `<g transform="rotate(12)"><rect x="-9" y="-28" width="18" height="32" rx="6" fill="${c}"/>${[-22, -14, -6].map((y) => `<path d="M-9 ${y}l-3-1M9 ${y + 3}l3-1" stroke="#9a8460" stroke-width="1"/>`).join('')}</g>`;
      case 'egg': return `<g><ellipse cx="0" cy="-10" rx="11" ry="14" fill="${c}"/><ellipse cx="-4" cy="-15" rx="3" ry="5" fill="#fff" opacity="${shine + 0.2}"/></g>`;
      case 'avocado': return `<g><path d="M0-26q12 2 12 14q0 12-12 12q-12 0-12-12q0-12 12-14z" fill="${c}"/><path d="M0-20q8 2 8 9q0 8-8 8q-8 0-8-8q0-7 8-9z" fill="${lerpC('#c9d46a', '#b8a84a', t / 1.6)}"/><circle cx="0" cy="-11" r="4.5" fill="#7a4a2a"/><path d="M-12-12h24M-10-4h20" stroke="#efe9dc" stroke-width="1" opacity=".5"/></g>`;
      case 'cheese': return `<g><path d="M-14 0l14-24l14 24z" fill="${c}"/><circle cx="-3" cy="-8" r="2.5" fill="#d9b04a"/><circle cx="5" cy="-4" r="2" fill="#d9b04a"/><path d="M-12-6h24M-8-14h16" stroke="#f3efe2" stroke-width="1.2" opacity=".6"/></g>`;
    }
    return '';
  };
  /* 手もとの絵（パネル用） */
  A.vegIcon = (id, t = 0, tetsu) => `<svg viewBox="-22 -38 44 44" aria-hidden="true">${A.veg(id, t, { tetsu })}</svg>`;

  /* ---- 棚の薬味 ---- */
  const shelfItem = {
    konbu: () => `<g transform="translate(528 128)"><rect x="-14" y="-20" width="28" height="22" rx="3" fill="#cfe0e6" opacity=".7" stroke="#9fb6bf"/><path d="M-10-14q10 6 20-2M-10-6q10 6 20-2" stroke="#2f3b2a" stroke-width="4" fill="none"/><rect x="-15" y="-24" width="30" height="5" rx="1" fill="#7a5a3a"/></g>`,
    togarashi: () => `<g transform="translate(566 154)"><path d="M0 0v10" stroke="#8a6a3a" stroke-width="2"/>${[-10, -4, 2, 8].map((x, i) => `<path d="M${x / 2} 10q${x} 14 ${x * 1.4} 30" stroke="#c9302c" stroke-width="5" stroke-linecap="round" fill="none"/>`).join('')}<path d="M-4 10h8" stroke="#5a8a3a" stroke-width="3"/></g>`,
    kara: () => `<g transform="translate(606 130)"><path d="M-14-6q14 14 28 0z" fill="#e8dcc6"/>${[-6, 0, 6].map((x) => `<path d="M${x - 3}-6l3-5 3 5" fill="#f6f1e6" stroke="#e0d4bc"/>`).join('')}</g>`,
    tetsu: () => `<g transform="translate(642 126)"><ellipse cx="0" cy="0" rx="7" ry="9" fill="#3a3d42"/><ellipse cx="-2" cy="-3" rx="2" ry="3" fill="#7a7f86" opacity=".7"/></g>`,
    sansho: () => `<g transform="translate(674 128)"><rect x="-10" y="-18" width="20" height="20" rx="4" fill="#cfe0e6" opacity=".7" stroke="#9fb6bf"/>${[[-4, -10], [2, -8], [-2, -4], [4, -2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#5a7a2a"/>`).join('')}<rect x="-11" y="-22" width="22" height="4" fill="#c9302c"/></g>`,
    beer: () => `<g transform="translate(708 128)"><path d="M-6 2v-20q0-6 3-8v-6h6v6q3 2 3 8v20z" fill="#7a4a1a"/><rect x="-6" y="-12" width="12" height="9" fill="#e9dcb8"/><rect x="-3" y="-36" width="6" height="4" fill="#d9b04a"/></g>`,
    kaki: () => `<g transform="translate(742 130)"><path d="M-14-4h28l-4 8h-20z" fill="#b98b4f"/>${[-7, 0, 7].map((x) => `<path d="M${x - 4}-4q4-6 8 0" stroke="#e8823a" stroke-width="3" fill="none"/>`).join('')}</g>`,
  };

  /* ---- 台所（変わらない部分＋状態で変わる部分） ---- */
  A.kitchen = (s, now) => {
    const d = now || new Date();
    const sk = A.skyOf(d), se = NK.season(d);
    const c = s.cont;
    let o = `<defs>
      <pattern id="nk-pl" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#efe4cc"/><circle cx="4" cy="5" r=".8" fill="#e0d2b4"/><circle cx="16" cy="11" r=".7" fill="#f6eedc"/><circle cx="9" cy="19" r=".8" fill="#ddcfb0"/><circle cx="22" cy="22" r=".6" fill="#e6d9be"/></pattern>
      <linearGradient id="nk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.top}"/><stop offset="1" stop-color="${sk.bot}"/></linearGradient>
      <linearGradient id="nk-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5f3b"/><stop offset="1" stop-color="#6e4a2c"/></linearGradient>
      <radialGradient id="nk-lt" cx=".22" cy=".25" r=".9"><stop offset="0" stop-color="#fff6dc" stop-opacity="${0.35 * sk.light}"/><stop offset="1" stop-color="#000" stop-opacity="${0.42 - 0.3 * sk.light}"/></radialGradient>
      <linearGradient id="nk-glz" x1="0" x2="1"><stop offset="0" stop-color="#4a2a16"/><stop offset=".35" stop-color="#8a5228"/><stop offset=".55" stop-color="#a5683a"/><stop offset="1" stop-color="#3e2312"/></linearGradient>
      <linearGradient id="nk-kame" x1="0" x2="1"><stop offset="0" stop-color="#4f4a44"/><stop offset=".4" stop-color="#8a8070"/><stop offset=".6" stop-color="#9a8f7c"/><stop offset="1" stop-color="#3e3a35"/></linearGradient>
      <linearGradient id="nk-wood" x1="0" x2="1"><stop offset="0" stop-color="#6e4a2a"/><stop offset=".4" stop-color="#b48a58"/><stop offset=".6" stop-color="#c49a66"/><stop offset="1" stop-color="#5e3e22"/></linearGradient>
      <radialGradient id="nk-bran" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#d8b67c"/><stop offset=".7" stop-color="#c49a5e"/><stop offset="1" stop-color="#9a7444"/></radialGradient>
    </defs>`;
    // 壁・腰板・床
    o += R(0, 0, 800, 440, 'url(#nk-pl)') + R(0, 352, 800, 88, '#7a5232') + Array.from({ length: 20 }, (_, i) => `<path d="M${i * 42} 352v88" stroke="#5e3e22" stroke-width="2"/><path d="M${i * 42 + 2} 352v88" stroke="#9a6e44" stroke-width=".8"/>`).join('') + R(0, 348, 800, 6, '#5e3e22');
    o += R(0, 440, 800, 160, 'url(#nk-fl)') + [452, 470, 494, 524, 562].map((y) => `<path d="M0 ${y}h800" stroke="#5a3a20" stroke-width="1.6"/>`).join('') + Array.from({ length: 14 }, (_, i) => `<path d="M${(i * 97) % 800} ${[440, 452, 470, 494, 524, 562][i % 5]}v${[12, 18, 24, 30, 38][i % 5]}" stroke="#5a3a20" stroke-width="1.2"/>`).join('');
    // 窓
    o += R(42, 42, 256, 206, '#5e3e22') + R(52, 52, 236, 186, 'url(#nk-sky)');
    if (sk.id === 'yoru') o += Array.from({ length: 22 }, (_, i) => `<circle cx="${60 + (i * 53) % 220}" cy="${58 + (i * 37) % 100}" r="${i % 4 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('') + `<circle cx="236" cy="86" r="14" fill="#f6efd0"/><circle cx="242" cy="82" r="12" fill="${sk.top}"/>`;
    else o += `<circle cx="${sk.id === 'yu' ? 90 : 230}" cy="${sk.id === 'asa' ? 150 : sk.id === 'yu' ? 160 : 80}" r="16" fill="${sk.id === 'yu' ? '#ffb070' : '#fff6d0'}" opacity=".9"/>`;
    o += `<path d="M52 196q30-18 60-6t50-8t60 4t66-6V238H52z" fill="${sk.id === 'yoru' ? '#141a2e' : '#7a8f9e'}" opacity=".85"/><path d="M52 214h236" stroke="${sk.id === 'yoru' ? '#0e1322' : '#5f7280'}" stroke-width="10"/>`;
    o += A.seasonWin(se.id, sk);
    o += R(52, 52, 236, 186, 'none', 'stroke="#5e3e22" stroke-width="2"') + `<path d="M170 52v186M52 145h236M111 52v186M229 52v186" stroke="#5e3e22" stroke-width="4"/>` + R(36, 246, 268, 12, '#8a5f3b') + R(36, 256, 268, 4, '#000', 'opacity=".2"');
    // 流し台
    o += R(24, 296, 316, 14, '#c9cdd1') + R(24, 296, 316, 3, '#eef0f2') + R(30, 310, 304, 160, '#8a5f3b') + R(30, 310, 304, 6, '#000', 'opacity=".2"');
    o += [36, 186].map((x) => R(x, 322, 140, 140, '#9a6e44', 'rx="2"') + `<path d="M${x + 6} 328h128v128h-128z" fill="none" stroke="#6e4a2a" stroke-width="1.5"/><rect x="${x + 60}" y="380" width="20" height="5" rx="2" fill="#d9c9a0"/>`).join('');
    o += `<path d="M170 296v-34q0-10 12-10h16" stroke="#aeb4ba" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M198 252v10" stroke="#aeb4ba" stroke-width="5"/><circle cx="170" cy="282" r="5" fill="#c0392b"/>`;
    o += `<g transform="translate(272 292)"><rect x="-28" y="-8" width="56" height="8" rx="2" fill="#e8d9b8"/><path d="M-20-8q20-20 40 0z" fill="#f2efe8" stroke="#d9d2c4"/></g><g transform="translate(86 292)"><path d="M-22-14h44l-6 14h-32z" fill="#3a6a8a"/><path d="M-20-12h40" stroke="#fff" stroke-width="1" opacity=".5"/></g>`;
    // 水屋箪笥
    o += `<g transform="translate(606 318)"><rect x="0" y="0" width="180" height="152" fill="#7a5232"/><rect x="0" y="-6" width="186" height="8" fill="#5e3e22" transform="translate(-3 0)"/><rect x="8" y="8" width="78" height="70" fill="#cfdfe4" opacity=".55" stroke="#5e3e22" stroke-width="3"/><rect x="94" y="8" width="78" height="70" fill="#cfdfe4" opacity=".55" stroke="#5e3e22" stroke-width="3"/>`
      + `<ellipse cx="34" cy="60" rx="18" ry="5" fill="#f2efe8"/><ellipse cx="34" cy="54" rx="18" ry="5" fill="#e9e4d8"/><path d="M60 64q10-16 20 0z" fill="#c9502b"/><path d="M104 66h24v-10h-24z" fill="#f2efe8"/><path d="M136 66q10-18 22 0z" fill="#2d4a6b"/><path d="M8 40h164" stroke="#5e3e22" stroke-width="2"/><ellipse cx="128" cy="30" rx="14" ry="4" fill="#e9e4d8"/>`
      + `<rect x="8" y="86" width="164" height="26" fill="#8a5f3b" stroke="#5e3e22" stroke-width="2"/><rect x="8" y="116" width="164" height="30" fill="#8a5f3b" stroke="#5e3e22" stroke-width="2"/><rect x="80" y="96" width="20" height="5" rx="2" fill="#d9c9a0"/><rect x="80" y="128" width="20" height="5" rx="2" fill="#d9c9a0"/></g>`;
    o += `<g transform="translate(700 300)"><path d="M-18 6q18-22 36 0z" fill="#c9cdd1"/><path d="M-20 6h40v12h-40z" fill="#aeb4ba"/><path d="M18 2q14-4 14 8" stroke="#aeb4ba" stroke-width="4" fill="none"/><path d="M-10-12q10-10 20 0" stroke="#5e3e22" stroke-width="3" fill="none"/></g>`;
    // 日めくり
    o += `<g transform="translate(330 70)"><path d="M0 0h76v100h-76z" fill="#fbf8f0" stroke="#d6cdb8"/><rect width="76" height="18" fill="${d.getDay() === 0 ? '#c0392b' : '#2d4a6b'}"/><text x="38" y="13" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif">${d.getMonth() + 1}月</text><text x="38" y="66" text-anchor="middle" font-size="40" font-weight="700" fill="${d.getDay() === 0 ? '#c0392b' : '#2b2b2b'}" font-family="serif">${d.getDate()}</text><text x="38" y="88" text-anchor="middle" font-size="11" fill="#777">${'日月火水木金土'[d.getDay()]}曜日</text><circle cx="38" cy="-4" r="3" fill="#999"/></g>`;
    // 時計
    const hh = d.getHours() % 12 + d.getMinutes() / 60, mm = d.getMinutes();
    o += `<g transform="translate(456 104)"><circle r="34" fill="#6e4a2a"/><circle r="28" fill="#fbf7ec"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0-25v4" stroke="#555" stroke-width="${i % 3 ? 1 : 2}" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0L${(15 * Math.sin(hh * Math.PI / 6)).toFixed(1)} ${(-15 * Math.cos(hh * Math.PI / 6)).toFixed(1)}" stroke="#222" stroke-width="3" stroke-linecap="round"/><path d="M0 0L${(22 * Math.sin(mm * Math.PI / 30)).toFixed(1)} ${(-22 * Math.cos(mm * Math.PI / 30)).toFixed(1)}" stroke="#222" stroke-width="2" stroke-linecap="round"/><circle r="2.5" fill="#c0392b"/></g>`;
    // 棚と薬味
    o += R(500, 136, 270, 8, '#7a5232') + R(500, 144, 270, 3, '#000', 'opacity=".2"') + `<path d="M520 144l10 18M750 144l-10 18" stroke="#5e3e22" stroke-width="4"/>`;
    for (const id of ['konbu', 'kara', 'tetsu', 'sansho', 'beer', 'kaki', 'togarashi']) if (NK.lv(s, id) > 0) o += shelfItem[id]();
    // 割烹着
    o += `<g transform="translate(752 168) scale(.78)"><circle cx="0" cy="0" r="4" fill="#888"/><path d="M-30 10q30-14 60 0l8 150q-38 10-76 0z" fill="#f6f2e8"/><path d="M-30 10q30-14 60 0" stroke="#d9d2c2" stroke-width="2" fill="none"/><path d="M-16 60h32v34h-32z" fill="#efe8da" stroke="#d9d2c2"/><path d="M-30 12l-12 70M30 12l12 70" stroke="#e9e3d6" stroke-width="10" stroke-linecap="round"/><path d="M-14 4q14 10 28 0" stroke="#c9c2b2" stroke-width="2" fill="none"/></g>`;
    // 店の札
    if (NK.lv(s, 'mise')) o += `<g transform="translate(650 420) rotate(-4)"><rect width="90" height="44" rx="3" fill="#2d4a6b"/><rect x="4" y="4" width="82" height="36" rx="2" fill="none" stroke="#e9dcc0" stroke-width="1"/><text x="45" y="20" text-anchor="middle" font-size="11" fill="#fbf7ec">ぬか漬け</text><text x="45" y="34" text-anchor="middle" font-size="11" fill="#fbf7ec">あります</text><path d="M20 0l25-18 25 18" stroke="#8a6a3a" stroke-width="2" fill="none"/></g>`;
    // ミナの帽子と踏み台
    if (NK.on(s, 'mina')) o += `<g transform="translate(330 214)"><circle r="3" fill="#888"/><path d="M-18 16q18-26 36 0z" fill="#f2c938"/><path d="M-24 16h48" stroke="#e0b32a" stroke-width="4" stroke-linecap="round"/><path d="M-6 6q6 4 12 0" stroke="#c9302c" stroke-width="2" fill="none"/></g><g transform="translate(560 520)"><rect x="-26" y="-22" width="52" height="8" rx="2" fill="#a87a4a"/><path d="M-22-14l-4 30M22-14l4 30" stroke="#8a5f3b" stroke-width="5"/></g>`;
    // 蔵：うしろの樽
    if (c >= 4) for (const x of [120, 680]) o += `<g transform="translate(${x} 420)"><ellipse cx="0" cy="-90" rx="70" ry="18" fill="#9a7444"/><path d="M-70-90v120q70 20 140 0v-120" fill="url(#nk-wood)"/>${[-60, -10, 30].map((y) => `<path d="M-70 ${y}q70 18 140 0" stroke="#3e5a2a" stroke-width="5" fill="none"/>`).join('')}<ellipse cx="0" cy="-90" rx="70" ry="18" fill="none" stroke="#5e3e22" stroke-width="3"/></g>`;
    if (c >= 5) o += `<g transform="translate(560 0)"><path d="M0 0h200v44l-10 6h-180l-10-6z" fill="#2d4a6b"/><path d="M66 0v50M134 0v50" stroke="#24405e" stroke-width="2"/><text x="100" y="32" text-anchor="middle" font-size="20" fill="#fbf7ec" font-family="serif">ぬか床</text></g>`;
    // 配達の木箱
    if (NK.on(s, 'haitatsu')) o += `<g transform="translate(700 530)"><path d="M-50-30h100l-6 46h-88z" fill="#c49a5e"/><path d="M-50-30h100M-48-14h96M-46 2h92" stroke="#9a7444" stroke-width="2"/><g transform="translate(-24 -36) scale(.7)">${A.veg('daikon', 0)}</g><g transform="translate(4 -34) scale(.7)">${A.veg('nasu', 0)}</g><g transform="translate(28 -32) scale(.7)">${A.veg('ninjin', 0)}</g><text x="0" y="-6" text-anchor="middle" font-size="10" fill="#6e4a2a">八百松</text></g>`;
    // 猫（のれん分けのあと）
    const half = A.BED[c].rx + 24;
    if (s.pres.count >= 1) o += `<g class="nk-cat" data-cat="1" transform="translate(${Math.max(96, 400 - half - 70).toFixed(0)} ${c >= 2 ? 520 : 548})"><ellipse cx="0" cy="8" rx="60" ry="14" fill="#7a3b4a"/><ellipse cx="0" cy="4" rx="52" ry="10" fill="#8d4a5a"/><ellipse cx="0" cy="-6" rx="30" ry="15" fill="#3a3530"/><path d="M-6-20a10 8 0 0 1 16 2l-6 8z" fill="#e8823a"/><circle cx="-22" cy="-10" r="11" fill="#3a3530"/><path d="M-30-16l2-9 6 6zM-18-19l5-7 1 9z" fill="#3a3530"/><path d="M-27-10q3 2 6 0M-21-10q3 2 6 0" stroke="#e8d5a6" stroke-width="1.4" fill="none"/><path d="M28 0q14 8 4 14q-14 4-30-2" stroke="#3a3530" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    // 入れもの
    o += A.container(c);
    // ふた（昭和元年）
    o += `<g transform="translate(62 470) rotate(-74)"><ellipse cx="0" cy="0" rx="${[56, 66, 80, 90, 90, 90][c]}" ry="12" fill="#6e4a2a"/><ellipse cx="0" cy="-3" rx="${[56, 66, 80, 90, 90, 90][c]}" ry="12" fill="#8a5f3b"/><rect x="-6" y="-12" width="12" height="9" rx="2" fill="#5e3e22"/><rect x="-26" y="-1" width="52" height="10" rx="1" fill="#f3ead2" transform="rotate(14)"/><text x="0" y="7" text-anchor="middle" font-size="7" fill="#3a2a1a" transform="rotate(14)">昭和元年</text></g>`;
    // 薄暗さ（時刻）
    o += R(0, 0, 800, 600, 'url(#nk-lt)', 'pointer-events="none"');
    if (sk.id === 'yoru') o += `<circle cx="400" cy="0" r="10" fill="#fff6d0"/><path d="M400 0v20" stroke="#555"/><path d="M386 20h28l-6 12h-16z" fill="#f2e3b8"/><ellipse cx="400" cy="360" rx="330" ry="260" fill="#fff6d0" opacity=".1" pointer-events="none"/>`;
    return o;
  };
  /* 窓の外の季節 */
  A.seasonWin = (id, sk) => {
    if (id === 'haru') return `<path d="M288 60q-50 10-90 40" stroke="#5e3e22" stroke-width="5" fill="none"/>` + [[250, 70], [226, 82], [204, 94], [262, 92], [236, 104]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="3" ry="4.5" fill="#f6c9d4" transform="rotate(${a})"/>`).join('')}<circle r="1.5" fill="#e87a9a"/></g>`).join('') + `<g class="nk-petals">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${80 + i * 40}" cy="${80 + (i % 3) * 30}" rx="2.5" ry="1.6" fill="#f6c9d4"/>`).join('')}</g>`;
    if (id === 'natsu') return `<path d="M288 56q-40 14-80 30" stroke="#5e3e22" stroke-width="5" fill="none"/>` + [[250, 66], [222, 78], [262, 82], [236, 90], [210, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="6" fill="#4f8a3c" transform="rotate(-20 ${x} ${y})"/>`).join('') + `<g transform="translate(140 52)"><path d="M0 0v18" stroke="#ccc"/><path d="M-10 28a10 10 0 0 1 20 0z" fill="#bfe3ef" opacity=".85"/><rect x="-4" y="30" width="8" height="18" fill="#f6efd8"/></g>`;
    if (id === 'aki') return `<path d="M288 56q-46 14-90 44" stroke="#5e3e22" stroke-width="5" fill="none"/>` + [[252, 70, '#d9532c'], [226, 84, '#e8823a'], [204, 96, '#c9402c'], [262, 90, '#e8a23a']].map(([x, y, c]) => `<path d="M${x} ${y}l6-8 2 8 8-2-6 6 6 6-8-2-2 8-6-8z" fill="${c}"/>`).join('') + `<g transform="translate(236 100)"><circle r="10" fill="#e8742a"/><path d="M-5-9h10l-5-4z" fill="#4a6a2a"/></g><g transform="translate(212 112)"><circle r="8" fill="#e8742a"/></g>`;
    return `<path d="M52 200q118-10 236 0V238H52z" fill="#f6f8fa" opacity=".9"/><path d="M288 56q-40 14-80 34" stroke="#5e3e22" stroke-width="5" fill="none"/><path d="M288 52q-40 14-80 34" stroke="#fbfcfd" stroke-width="3" fill="none"/>` + `<g class="nk-snow">${Array.from({ length: 16 }, (_, i) => `<circle cx="${60 + (i * 47) % 220}" cy="${60 + (i * 29) % 150}" r="${i % 3 ? 1.6 : 2.4}" fill="#fff"/>`).join('')}</g>` + R(36, 238, 268, 8, '#fbfcfd');
  };
  /* 入れもの */
  A.container = (c) => {
    const b = A.RAW[c], k = A.K[c];
    let o = `<ellipse cx="400" cy="574" rx="${(b.rx + 40) * k}" ry="16" fill="#000" opacity=".25"/><g transform="translate(400 570) scale(${k}) translate(-400 -570)">`;
    if (c === 0) {
      o += `<path d="M300 404q-30 60 -8 130q8 30 108 34q100-4 108-34q22-70-8-130z" fill="url(#nk-glz)"/><path d="M308 470q92 22 184 0" stroke="#3e2312" stroke-width="1.5" fill="none" opacity=".5"/><path d="M330 420q-14 50 -4 100" stroke="#c9905a" stroke-width="6" fill="none" opacity=".35"/>`;
      o += [[350, 420, 40], [420, 418, 56], [468, 424, 34]].map(([x, y, h]) => `<path d="M${x} ${y}q-3 ${h / 2} 2 ${h}" stroke="#2a160a" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`).join('');
      o += `<ellipse cx="400" cy="404" rx="108" ry="29" fill="#5a3216"/><ellipse cx="400" cy="402" rx="106" ry="27" fill="#7a4a24"/>`;
    } else if (c === 1) {
      o += `<path d="M262 378q-36 80 -6 168q10 26 144 30q134-4 144-30q30-88-6-168z" fill="url(#nk-kame)"/>${[430, 470, 510].map((y) => `<path d="M${264 - (y - 430) * 0.1} ${y}q136 26 272 0" stroke="#5a544a" stroke-width="2" fill="none" opacity=".6"/>`).join('')}<path d="M300 400q-16 60 -4 130" stroke="#bfb4a0" stroke-width="7" fill="none" opacity=".3"/>`;
      o += `<ellipse cx="400" cy="378" rx="140" ry="38" fill="#3e3a35"/><ellipse cx="400" cy="376" rx="137" ry="35" fill="#6a6258"/>`;
    } else {
      const top = b.cy, rx = b.rx + 10;
      o += `<path d="M${400 - rx} ${top}L${400 - rx + 14} 566q${rx - 14} 24 ${2 * (rx - 14)} 0L${400 + rx} ${top}z" fill="url(#nk-wood)"/>`;
      for (let i = 1; i < 14; i++) { const x = 400 - rx + (2 * rx * i) / 14; o += `<path d="M${x} ${top + 8}L${400 + (x - 400) * 0.93} 572" stroke="#5e3e22" stroke-width="1.4" opacity=".55"/>`; }
      for (const f of [0.18, 0.55, 0.88]) { const y = top + (566 - top) * f, w = rx - 14 * f; o += `<path d="M${400 - w} ${y}q${w} ${b.ry * 0.9} ${2 * w} 0" stroke="#3e5a2a" stroke-width="7" fill="none"/><path d="M${400 - w} ${y - 3}q${w} ${b.ry * 0.9} ${2 * w} 0" stroke="#6a8a4a" stroke-width="2" fill="none"/>`; }
      if (c >= 3) o += `<g transform="translate(400 ${top + 110})"><circle r="26" fill="none" stroke="#3a2412" stroke-width="3" opacity=".7"/><text x="0" y="8" text-anchor="middle" font-size="22" fill="#3a2412" opacity=".7" font-family="serif">百</text></g>`;
      o += `<ellipse cx="400" cy="${top}" rx="${rx}" ry="${b.ry + 8}" fill="#5e3e22"/><ellipse cx="400" cy="${top - 2}" rx="${rx - 4}" ry="${b.ry + 5}" fill="#8a5f3b"/>`;
    }
    // ぬかの面
    o += `<ellipse cx="400" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="url(#nk-bran)"/>`;
    o += Array.from({ length: Math.round(b.rx / 3) }, (_, i) => { const a = i * 2.4, r = ((i * 37) % 100) / 100; return `<circle cx="${(400 + Math.cos(a) * b.rx * r * 0.95).toFixed(1)}" cy="${(b.cy + Math.sin(a) * b.ry * r * 0.9).toFixed(1)}" r="${(0.8 + (i % 3) * 0.5).toFixed(1)}" fill="${i % 2 ? '#a88050' : '#e6c890'}" opacity=".7"/>`; }).join('');
    return o + '</g>';
  };

  /* ---- まぜ棒 ---- */
  A.mazebo = (c) => { const b = A.BED[c]; return `<g class="nk-mazebo" transform="translate(${400 + b.rx * 0.62} ${b.cy - 4})"><g class="nk-mzb"><rect x="-4" y="-120" width="8" height="100" rx="3" fill="#c49a66"/><rect x="-3" y="-118" width="2" height="96" fill="#e0bc88"/><path d="M-12-24h24l-4 26h-16z" fill="#b48a58"/></g></g>`; };

  /* ---- はがきの絵 300×190 ---- */
  const CARD = {
    port: ['#9cc6e0', '#3e6a8a', (o) => o + `<path d="M0 130h300v60H0z" fill="#2e5a7a"/><path d="M40 130l20-40h60l14 40z" fill="#c9302c"/><path d="M60 90v-30M60 60l30 10-30 10" stroke="#333" stroke-width="2" fill="#fff"/><path d="M180 130v-70h40v70z" fill="#efe6d0"/><path d="M176 60h48l-24-20z" fill="#7a3b2e"/><circle cx="250" cy="44" r="16" fill="#fff6d0"/>`],
    onsen: ['#d9e4ea', '#5a7a8a', (o) => o + `<path d="M0 120q80-60 150-20t150-30v120H0z" fill="#6a8a6a"/><ellipse cx="150" cy="160" rx="110" ry="22" fill="#9fc6d8"/><path d="M110 140q-8-14 0-24t0-24M150 136q-8-14 0-24t0-24M190 140q-8-14 0-24t0-24" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/>`],
    castle: ['#bcd8ea', '#3a4a5a', (o) => o + `<path d="M0 160h300v30H0z" fill="#8a9a8a"/><path d="M100 160v-50h100v50z" fill="#efe9dc"/><path d="M90 112h120l-20-22h-80z" fill="#2e3a48"/><path d="M118 92v-26h64v26z" fill="#efe9dc"/><path d="M108 68h84l-14-18h-56z" fill="#2e3a48"/><path d="M130 50h40l-20-14z" fill="#2e3a48"/>`],
    kyoto: ['#f2d9c0', '#6a3a2a', (o) => o + `<path d="M0 150h300v40H0z" fill="#9a8a6a"/><path d="M120 150v-90h60v90z" fill="#c9402c"/>${[60, 80, 100].map((y, i) => `<path d="M${100 + i * 4} ${y}h${100 - i * 8}l-10-12h-${80 - i * 8}z" fill="#2e2a28"/>`).join('')}<path d="M150 40v-20" stroke="#c9a85a" stroke-width="3"/>`],
    island: ['#a8d8ea', '#2a6a9a', (o) => o + `<path d="M0 120h300v70H0z" fill="#3a8ab8"/><path d="M60 120q50-60 110 0z" fill="#5a9a4a"/><path d="M180 120q30-30 60 0z" fill="#6aaa5a"/><path d="M20 150h40M220 160h50" stroke="#fff" stroke-width="2" opacity=".6"/>`],
    okinawa: ['#7fd0e8', '#1f8ab0', (o) => o + `<path d="M0 130h300v60H0z" fill="#f2e6c0"/><path d="M0 120h300v14H0z" fill="#2ab0c8"/><path d="M220 130q-6-60 4-90" stroke="#7a5a3a" stroke-width="6" fill="none"/>${[-40, -10, 20, 50].map((a) => `<path d="M224 40q30 ${a / 3} 50 ${20 + a / 2}" stroke="#3a8a3a" stroke-width="6" fill="none" transform="rotate(${a} 224 40)"/>`).join('')}<path d="M60 150q10-30 30 0z" fill="#c9402c"/>`],
    taiwan: ['#f2c9a0', '#8a3a2a', (o) => o + `<path d="M0 160h300v30H0z" fill="#6a4a3a"/>${[40, 110, 180, 250].map((x, i) => `<g transform="translate(${x} 70)"><path d="M0 0v20" stroke="#333"/><ellipse cx="0" cy="34" rx="16" ry="20" fill="${['#c9302c', '#e8a23a', '#c9302c', '#e8a23a'][i]}"/><path d="M-6 54h12" stroke="#c9a85a" stroke-width="3"/></g>`).join('')}`],
    seoul: ['#d8e4f0', '#3a4a6a', (o) => o + `<path d="M0 150h300v40H0z" fill="#8a8a8a"/><path d="M90 150v-40h120v40z" fill="#9a3a2a"/><path d="M70 112h160l-20-20h-120z" fill="#2a4a3a"/><path d="M86 92q64-20 128 0" stroke="#2a4a3a" stroke-width="6" fill="none"/>`],
    vietnam: ['#f6e0a0', '#7a6a2a', (o) => o + `<path d="M0 140h300v50H0z" fill="#6aa04a"/>${[70, 150, 230].map((x) => `<path d="M${x - 30} 120l30-22 30 22z" fill="#e8d8a0" stroke="#b8a060"/>`).join('')}<path d="M0 160q150-20 300 0" stroke="#9ac8d8" stroke-width="8" fill="none"/>`],
    india: ['#f6c890', '#a05a2a', (o) => o + `<path d="M0 160h300v30H0z" fill="#d8b890"/><path d="M110 160v-60h80v60z" fill="#f6f1e6"/><path d="M110 102q40-70 80 0z" fill="#f6f1e6"/><path d="M150 40v-14" stroke="#c9a85a" stroke-width="3"/><path d="M90 160v-80M210 160v-80" stroke="#f6f1e6" stroke-width="8"/>`],
    turkey: ['#c8d8f0', '#3a5a8a', (o) => o + `<path d="M0 150h300v40H0z" fill="#8a7a6a"/><path d="M100 150v-40q50-50 100 0v40z" fill="#d8ccb8"/><path d="M80 150v-90M220 150v-90" stroke="#d8ccb8" stroke-width="6"/><path d="M80 60l0-14M220 60l0-14" stroke="#c9a85a" stroke-width="3"/>`],
    germany: ['#d0dce8', '#4a5a6a', (o) => o + `<path d="M0 160h300v30H0z" fill="#6a8a5a"/>${[40, 110, 180, 240].map((x, i) => `<path d="M${x} 160v-60h50v60z" fill="${['#efe6d0', '#e8d0b0', '#efe6d0', '#d8c0a0'][i]}"/><path d="M${x - 4} 100h58l-29-34z" fill="#9a3a2a"/>`).join('')}`],
    france: ['#d8e8f4', '#4a6a8a', (o) => o + `<path d="M0 170h300v20H0z" fill="#8a9a7a"/><path d="M150 30l-40 140h80z" fill="none" stroke="#5a5a5a" stroke-width="5"/><path d="M128 110h44M120 140h60" stroke="#5a5a5a" stroke-width="4"/>`],
    morocco: ['#f6d8a8', '#a0602a', (o) => o + `<path d="M0 150q150-30 300 0v40H0z" fill="#e0b070"/><path d="M110 150v-60q40-40 80 0v60z" fill="#c9602a"/><path d="M130 150v-40q20-20 40 0v40z" fill="#3a5a8a"/>`],
    egypt: ['#f6e0b0', '#b0802a', (o) => o + `<path d="M0 160h300v30H0z" fill="#e0c080"/><path d="M60 160l60-90 60 90z" fill="#d8b070"/><path d="M160 160l45-66 45 66z" fill="#c8a060"/><path d="M120 70l60 90" stroke="#b08850" stroke-width="2"/>`],
    mexico: ['#a8d0f0', '#3a6a9a', (o) => o + `<path d="M0 160h300v30H0z" fill="#d8b070"/><path d="M70 160v-60h20v60zM60 110h14v-20h-14z" fill="#5a9a4a"/><path d="M200 160v-50h60v50z" fill="#e8823a"/><path d="M196 110h68l-34-24z" fill="#c9402c"/>`],
    ny: ['#c8d0e0', '#3a4050', (o) => o + `<path d="M0 170h300v20H0z" fill="#4a5060"/>${[[30, 80], [70, 50], [120, 100], [170, 30], [220, 70], [260, 90]].map(([x, y]) => `<path d="M${x} 170v-${170 - y}h30v${170 - y}z" fill="#5a6070"/>${Array.from({ length: 5 }, (_, k) => `<rect x="${x + 6}" y="${y + 10 + k * 16}" width="6" height="6" fill="#f6e0a0" opacity=".7"/>`).join('')}`).join('')}`],
    ship: ['#f6d0a0', '#a05a3a', (o) => o + `<path d="M0 130h300v60H0z" fill="#3a6a8a"/><path d="M60 130l20 26h140l20-26z" fill="#efe6d0"/><path d="M110 130v-30h80v30z" fill="#efe6d0"/><path d="M140 100v-24h20v24z" fill="#c9302c"/><circle cx="250" cy="70" r="20" fill="#fff0c0"/><path d="M20 160q20-6 40 0M240 170q20-6 40 0" stroke="#fff" stroke-width="2" opacity=".6"/>`],
  };
  A.card = (id) => {
    const c = NK.CARDS.find((x) => x.id === id), [bg, ink, f] = CARD[c.art];
    let o = `<rect width="300" height="190" fill="${bg}"/>`;
    o = f(o);
    return `<svg viewBox="0 0 300 190" aria-hidden="true">${o}<g transform="translate(262 22)"><rect x="-18" y="-16" width="36" height="34" fill="#fbf7ec" stroke="${ink}" stroke-dasharray="2 2"/><circle r="10" fill="none" stroke="${ink}" stroke-width="2"/><text x="0" y="4" text-anchor="middle" font-size="9" fill="${ink}">〒</text></g><circle cx="232" cy="38" r="20" fill="none" stroke="#7a3b2e" stroke-width="1.5" opacity=".6"/></svg>`;
  };

  /* ---- 菌（虫めがね）：数に応じた形 ---- */
  A.microbeShapes = ['rod', 'rod', 'rod', 'ball', 'rod', 'yeast'];
})(typeof window !== 'undefined' ? window : globalThis);
