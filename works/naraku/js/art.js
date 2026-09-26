/* =========================================================
   奈落の証人 — 絵（すべてSVG）
   ========================================================= */
window.NA = (() => {
  'use strict';
  const MINCHO = '"Shippori Mincho B1", "Zen Old Mincho", serif';
  const GOTH = '"Zen Kaku Gothic New", sans-serif';
  const HAND = '"Klee One", cursive';
  let sd = 3; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const grain = (id) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer></filter>`;
  const svg = (vb, body, cls) => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid ${cls === 'meet' ? 'meet' : 'slice'}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  /* ---------- 客席から見た舞台（幕） ---------- */
  function house(open) {
    sd = 5; let folds = '';
    for (let i = 0; i < 26; i++) { const x = 220 + i * 45; folds += `<rect x="${x}" y="120" width="46" height="610" fill="url(#hs-fold)" opacity="${0.75 + rnd() * 0.25}"/>`; }
    let seats = '';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const w = 110 + r * 18, x = -40 + i * (w - 6) + (r % 2) * 50, y = 850 + r * 70; seats += `<rect x="${x}" y="${y}" width="${w - 14}" height="200" rx="34" fill="${r === 2 ? '#0b0607' : '#140a0c'}" stroke="#2a1416" stroke-width="2"/>`; }
    const inner = open
      ? `<rect x="220" y="120" width="1160" height="610" fill="#0a0808"/><rect x="220" y="560" width="1160" height="170" fill="#2a1d16"/>${[...Array(12)].map((_, i) => `<rect x="${220 + i * 97}" y="560" width="2" height="170" fill="#1c130e"/>`).join('')}
         <line x1="800" y1="200" x2="800" y2="560" stroke="#6a6a6a" stroke-width="4"/><rect x="770" y="560" width="60" height="10" fill="#333"/><circle cx="800" cy="190" r="16" fill="#fff4d8"/><circle cx="800" cy="190" r="170" fill="url(#hs-ghost)"/>`
      : `${folds}<rect x="220" y="700" width="1160" height="30" fill="url(#hs-fringe)"/><ellipse cx="800" cy="420" rx="360" ry="300" fill="url(#hs-spot)"/>`;
    return svg('0 0 1600 1000', `<defs>
      <linearGradient id="hs-fold" x1="0" x2="1"><stop offset="0" stop-color="#3a0710"/><stop offset=".45" stop-color="#8e1a24"/><stop offset=".7" stop-color="#6b0f1a"/><stop offset="1" stop-color="#2c050b"/></linearGradient>
      <linearGradient id="hs-fringe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a45c"/><stop offset="1" stop-color="#5a4320"/></linearGradient>
      <radialGradient id="hs-spot"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".22"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="hs-ghost"><stop offset="0" stop-color="#fff0c8" stop-opacity=".45"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></radialGradient>
      <linearGradient id="hs-gold" x1="0" x2="1"><stop offset="0" stop-color="#7a5a26"/><stop offset=".5" stop-color="#e3c47e"/><stop offset="1" stop-color="#7a5a26"/></linearGradient>
      ${grain('hs-g')}</defs>
      <rect width="1600" height="1000" fill="#120a0c"/>
      ${inner}
      <path d="M160 60 H1440 V760 H1380 V120 H220 V760 H160 Z" fill="#1c0f0c"/>
      <path d="M160 60 H1440 V760 H1380 V120 H220 V760 H160 Z" fill="none" stroke="url(#hs-gold)" stroke-width="6"/>
      <path d="M220 120 ${[...Array(12)].map((_, i) => `Q${268 + i * 96.7} ${190} ${316 + i * 96.7} 120`).join(' ')} V120 Z" fill="#7a111c" stroke="#c9a45c" stroke-width="3"/>
      <text x="800" y="100" text-anchor="middle" font-family="${MINCHO}" font-size="34" font-weight="800" fill="#e3c47e" letter-spacing="18">月見座</text>
      <rect x="160" y="760" width="1280" height="26" fill="#241612"/>
      ${[...Array(14)].map((_, i) => `<circle cx="${250 + i * 84}" cy="775" r="5" fill="#ffd9a0"/><circle cx="${250 + i * 84}" cy="775" r="26" fill="#ffd9a0" opacity=".12"/>`).join('')}
      ${seats}
      <rect width="1600" height="1000" filter="url(#hs-g)"/>`);
  }

  /* ---------- 奈落の見取り図 ---------- */
  function footMark(k, x, y, a, s) {
    s = s || 1;
    const t = `translate(${x} ${y}) rotate(${a}) scale(${s})`;
    if (k === 'A') return `<g transform="${t}"><path d="M-7 -16 Q0 -22 7 -16 L6 8 Q0 14 -6 8 Z" fill="#e8e4d8" opacity=".75"/></g>`;
    if (k === 'B') return `<g transform="${t}"><path d="M-6 -16 Q0 -21 6 -16 L4 0 L-4 0 Z" fill="#e8e4d8" opacity=".75"/><circle cx="0" cy="10" r="3.4" fill="#e8e4d8" opacity=".75"/></g>`;
    return `<g transform="${t}"><path d="M-7 -8 Q-7 -20 -2 -21 L-1 -8 Z M1 -9 Q2 -21 6 -20 Q8 -12 7 -6 Z" fill="#e8e4d8" opacity=".8"/><path d="M-7 -6 H7 L6 10 Q0 15 -6 10 Z" fill="#e8e4d8" opacity=".8"/></g>`;
  }
  function trail(k, pts, back) {
    let o = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), n = Math.floor(d / 46), a = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, side = (j % 2 ? 1 : -1) * 9, nx = -dy / d * side, ny = dx / d * side; o += footMark(k, x1 + dx * u + nx, y1 + dy * u + ny, a + (back ? 180 : 0)); }
    }
    return o;
  }
  function naraku(opt) {
    opt = opt || {};
    sd = 9; let dust = '';
    for (let i = 0; i < 420; i++) dust += `<circle cx="${80 + rnd() * 1440}" cy="${80 + rnd() * 840}" r="${rnd() * 2.2}" fill="#dfe6f0" opacity="${0.05 + rnd() * 0.12}"/>`;
    const lab = (x, y, t, s, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${MINCHO}" font-size="${s || 26}" fill="${c || '#9fb2c8'}" letter-spacing="4">${t}</text>`;
    const stairs = (x, y, w, h) => { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#101a28" stroke="#6f86a4" stroke-width="3"/>`; for (let i = 1; i < 9; i++) s += `<line x1="${x}" y1="${y + i * h / 9}" x2="${x + w}" y2="${y + i * h / 9}" stroke="#6f86a4" stroke-width="2" opacity=".7"/>`; return s; };
    const C = opt.hiC;
    return svg('0 0 1600 1000', `<defs>
      <pattern id="nk-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 H0 V40" fill="none" stroke="#2a3a52" stroke-width="1"/></pattern>
      <pattern id="nk-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="16" stroke="#3d5372" stroke-width="3"/></pattern>
      <radialGradient id="nk-bulb"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/></radialGradient>
      ${grain('nk-g')}</defs>
      <rect width="1600" height="1000" fill="#0b121d"/><rect width="1600" height="1000" fill="url(#nk-grid)"/>
      <rect x="60" y="60" width="1480" height="880" fill="none" stroke="#8aa2c2" stroke-width="5"/><rect x="72" y="72" width="1456" height="856" fill="none" stroke="#8aa2c2" stroke-width="1.5" opacity=".6"/>
      ${dust}
      ${lab(800, 48, '客席の側（舞台の真下）', 22)}${lab(800, 975, '舞台の奥', 22)}
      <text x="30" y="500" font-family="${MINCHO}" font-size="24" fill="#9fb2c8" writing-mode="tb" letter-spacing="8">下手</text>
      <text x="1572" y="500" font-family="${MINCHO}" font-size="24" fill="#9fb2c8" writing-mode="tb" letter-spacing="8">上手</text>
      <!-- せり -->
      <rect x="620" y="330" width="280" height="280" fill="url(#nk-hatch)" stroke="#aebfd6" stroke-width="6"/><rect x="636" y="346" width="248" height="248" fill="none" stroke="#aebfd6" stroke-width="2"/>
      ${lab(760, 480, 'せ　り', 30, '#c7d4e4')}
      <!-- 電球 -->
      <circle cx="760" cy="200" r="120" fill="url(#nk-bulb)"/><circle cx="760" cy="200" r="16" fill="#ffe6a8"/><line x1="760" y1="216" x2="760" y2="262" stroke="#cfd8e4" stroke-width="2" stroke-dasharray="4 4"/><circle cx="760" cy="266" r="5" fill="#cfd8e4"/>
      ${lab(760, 150, '裸電球（引き紐）', 20)}
      <!-- 階段 -->
      ${stairs(90, 700, 220, 200)}${lab(200, 690, '下手の階段', 22)}
      <line x1="90" y1="900" x2="310" y2="900" stroke="#e8c16a" stroke-width="7"/><rect x="186" y="890" width="28" height="22" rx="4" fill="#e8c16a"/><path d="M192 890 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke="#e8c16a" stroke-width="4"/>
      ${stairs(1290, 700, 220, 200)}${lab(1400, 690, '上手の階段', 22)}
      <!-- 花道下の扉 -->
      <rect x="54" y="150" width="18" height="170" fill="#6f86a4"/><rect x="46" y="222" width="44" height="12" fill="#e8c16a"/>${lab(190, 245, '花道下の扉', 20)}
      <!-- 伝声管 -->
      <circle cx="380" cy="660" r="16" fill="none" stroke="#e8c16a" stroke-width="5"/><circle cx="380" cy="660" r="6" fill="#e8c16a"/>${lab(380, 630, '伝声管', 18)}
      <!-- 足跡 -->
      ${trail('A', [[1320, 760], [1100, 640], [930, 560], [700, 640]])}
      ${trail('B', [[1340, 820], [1080, 760], [760, 700]])}${trail('B', [[740, 730], [1060, 800], [1330, 860]], false)}
      <g opacity="${C ? 1 : 0.95}">${trail('C', [[300, 770], [450, 720], [600, 690]])}${trail('C', [[590, 730], [440, 770], [300, 820]])}</g>
      ${C ? '<circle cx="450" cy="745" r="90" fill="none" stroke="#ff6a4a" stroke-width="4" stroke-dasharray="10 8"/>' : ''}
      <!-- 倒れていた場所 -->
      <g transform="translate(560 720) rotate(-28)"><ellipse cx="0" cy="-96" rx="30" ry="34" fill="none" stroke="#f2f2f2" stroke-width="3" stroke-dasharray="8 6"/><path d="M-44 -60 Q-60 20 -40 120 L-24 190 M44 -60 Q60 20 40 120 L24 190 M-44 -60 Q0 -76 44 -60 M-44 -50 L-100 30 M44 -50 L96 40 M-40 120 Q0 130 40 120" fill="none" stroke="#f2f2f2" stroke-width="3" stroke-dasharray="8 6"/></g>
      <!-- 凡例 -->
      <g transform="translate(1120 90)"><rect width="390" height="150" fill="#0b121d" stroke="#6f86a4" stroke-width="2"/>
        ${footMark('A', 34, 40, 0, 1)}<text x="62" y="48" font-family="${GOTH}" font-size="20" fill="#cfd8e4">A　革靴（鷺沢）</text>
        ${footMark('B', 34, 82, 0, 1)}<text x="62" y="90" font-family="${GOTH}" font-size="20" fill="#cfd8e4">B　かかとの高い舞台靴</text>
        ${footMark('C', 34, 124, 0, 1)}<text x="62" y="132" font-family="${GOTH}" font-size="20" fill="#cfd8e4">C　つま先が二つに分かれる</text></g>
      <rect width="1600" height="1000" filter="url(#nk-g)"/>`, 'meet');
  }
  // 調べるところ（見取り図の座標）
  const NARAKU_SPOTS = {
    body: [560, 690, 110], bulb: [760, 205, 70], foot: [1080, 770, 80], shimote: [200, 820, 100], hanamichi: [110, 235, 80],
    kamite: [1400, 800, 100], seri: [790, 400, 70], tube: [380, 660, 44],
  };

  /* ---------- 楽屋廊下・小道具部屋・袖・プロンプト席・舞台 ---------- */
  function corridor() {
    let doors = '';
    [['白石 澪', 250], ['犬飼 透', 640], ['衣装部屋', 1030]].forEach(([n, x]) => {
      doors += `<rect x="${x}" y="300" width="260" height="520" fill="#2a1d18" stroke="#4a3528" stroke-width="6"/><rect x="${x + 20}" y="320" width="220" height="480" fill="#33241c"/><circle cx="${x + 220}" cy="570" r="10" fill="#c9a45c"/>
        <rect x="${x + 90}" y="340" width="80" height="150" fill="#e8dcc0"/><text x="${x + 130}" y="360" font-family="${MINCHO}" font-size="30" fill="#2a1d18" writing-mode="tb" font-weight="800">${n}</text>`;
    });
    return svg('0 0 1600 1000', `<defs><linearGradient id="co-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a22"/><stop offset="1" stop-color="#1a120e"/></linearGradient>
      <radialGradient id="co-l" cx=".5" cy=".1" r=".7"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>${grain('co-g')}</defs>
      <rect width="1600" height="1000" fill="url(#co-w)"/><rect y="820" width="1600" height="180" fill="#1a110c"/>${[...Array(16)].map((_, i) => `<rect x="${i * 100}" y="820" width="3" height="180" fill="#0f0a07"/>`).join('')}
      ${doors}<line x1="800" y1="0" x2="800" y2="90" stroke="#555" stroke-width="3"/><circle cx="800" cy="100" r="14" fill="#fff0c8"/><rect width="1600" height="1000" fill="url(#co-l)"/>
      <rect x="1360" y="330" width="170" height="240" fill="#d8ccb0" transform="rotate(3 1445 450)"/><text x="1445" y="400" text-anchor="middle" font-family="${MINCHO}" font-size="30" font-weight="800" fill="#6b0f1a" transform="rotate(3 1445 450)">千秋楽</text><text x="1445" y="450" text-anchor="middle" font-family="${MINCHO}" font-size="20" fill="#333" transform="rotate(3 1445 450)">仮面舞踏会の夜</text>
      <rect width="1600" height="1000" filter="url(#co-g)"/>`);
  }
  function props() {
    sd = 21; let shelf = '';
    for (let r = 0; r < 3; r++) { const y = 200 + r * 200; shelf += `<rect x="100" y="${y + 150}" width="700" height="14" fill="#4a3528"/>`; for (let i = 0; i < 6; i++) { const x = 130 + i * 110 + rnd() * 20, h = 60 + rnd() * 80; shelf += (i + r) % 3 === 0 ? `<rect x="${x}" y="${y + 150 - h}" width="60" height="${h}" rx="6" fill="#2e211a"/>` : (i + r) % 3 === 1 ? `<path d="M${x} ${y + 150} L${x + 30} ${y + 150 - h} L${x + 60} ${y + 150} Z" fill="#33251d"/>` : `<circle cx="${x + 30}" cy="${y + 150 - 34}" r="34" fill="#2a1e17"/>`; } }
    return svg('0 0 1600 1000', `<defs><radialGradient id="pr-l" cx=".68" cy=".45" r=".5"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>${grain('pr-g')}</defs>
      <rect width="1600" height="1000" fill="#171009"/>${shelf}
      <rect x="880" y="600" width="620" height="30" fill="#5d4330"/><rect x="900" y="630" width="30" height="300" fill="#3a2a1c"/><rect x="1450" y="630" width="30" height="300" fill="#3a2a1c"/>
      <path d="M1060 260 L1130 420 L1010 420 Z" fill="#2f5a4a"/><line x1="1070" y1="420" x2="1070" y2="600" stroke="#666" stroke-width="6"/><circle cx="1070" cy="430" r="16" fill="#fff0c8"/>
      <g transform="translate(1210 590)"><path d="M0 0 L-120 -110 A160 160 0 0 1 120 -110 Z" fill="#e8d6b0" stroke="#8a6a3a" stroke-width="3"/>${[-100, -60, -20, 20, 60].map((a) => `<line x1="0" y1="0" x2="${Math.sin(a * Math.PI / 180) * 160}" y2="${-Math.cos(a * Math.PI / 180) * 160}" stroke="#8a6a3a" stroke-width="3"/>`).join('')}<line x1="0" y1="0" x2="150" y2="-20" stroke="#8a6a3a" stroke-width="4"/></g>
      <rect x="1360" y="560" width="50" height="40" rx="6" fill="#6a4a2a"/><text x="1385" y="545" text-anchor="middle" font-family="${GOTH}" font-size="18" fill="#c9a45c">膠</text>
      <rect width="1600" height="1000" fill="url(#pr-l)"/><rect width="1600" height="1000" filter="url(#pr-g)"/>`);
  }
  function wings() {
    let ropes = '';
    for (let i = 0; i < 9; i++) ropes += `<line x1="${140 + i * 26}" y1="0" x2="${140 + i * 26}" y2="760" stroke="#6a5a44" stroke-width="5"/><rect x="${130 + i * 26}" y="${520 + (i % 3) * 30}" width="22" height="16" fill="#8a6a3a"/>`;
    return svg('0 0 1600 1000', `<defs><linearGradient id="wg-s" x1="1" x2="0"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset=".5" stop-color="#ffd9a0" stop-opacity=".08"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></linearGradient>${grain('wg-g')}</defs>
      <rect width="1600" height="1000" fill="#0d0a0a"/>${ropes}
      <rect x="1180" y="0" width="420" height="1000" fill="url(#wg-s)"/>
      <rect x="520" y="80" width="300" height="820" fill="#2a2018"/><path d="M520 80 L820 900 M820 80 L520 900" stroke="#3a2c20" stroke-width="10"/><text x="670" y="140" text-anchor="middle" font-family="${GOTH}" font-size="22" fill="#6a5a44">二幕・露台（裏）</text>
      <rect x="880" y="60" width="240" height="860" fill="#231a14"/><path d="M880 400 H1120" stroke="#3a2c20" stroke-width="10"/>
      <rect y="900" width="1600" height="100" fill="#1a130e"/>
      <circle cx="400" cy="860" r="10" fill="#4a7aff"/><circle cx="400" cy="860" r="60" fill="#4a7aff" opacity=".12"/>
      <rect x="360" y="820" width="120" height="30" fill="#222"/><rect x="300" y="760" width="16" height="140" fill="#333"/><rect x="286" y="740" width="44" height="30" rx="6" fill="#3a3a3a"/>
      <rect width="1600" height="1000" filter="url(#wg-g)"/>`);
  }
  function prompt() {
    return svg('0 0 1600 1000', `<defs><radialGradient id="pm-l" cx=".45" cy=".55" r=".45"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>${grain('pm-g')}</defs>
      <rect width="1600" height="1000" fill="#0e0b0a"/>
      <rect x="1220" y="0" width="380" height="1000" fill="#2a0d12"/>${[...Array(8)].map((_, i) => `<rect x="${1230 + i * 46}" y="0" width="30" height="1000" fill="#3a1118" opacity=".7"/>`).join('')}
      <rect x="300" y="620" width="820" height="30" fill="#4b3525"/><rect x="330" y="650" width="760" height="300" fill="#2c1f16"/>
      <path d="M560 380 L620 520 L500 520 Z" fill="#6b1a1a"/><line x1="560" y1="520" x2="560" y2="620" stroke="#777" stroke-width="6"/><circle cx="560" cy="528" r="14" fill="#fff0c8"/>
      <g transform="translate(700 560) rotate(-4)"><rect x="0" y="0" width="300" height="60" fill="#efe6cc"/><rect x="150" y="0" width="2" height="60" fill="#bba"/>${[...Array(5)].map((_, i) => `<rect x="${14 + (i % 2) * 150}" y="${10 + Math.floor(i / 2) * 16}" width="${100 - i * 8}" height="4" fill="#556"/>`).join('')}</g>
      <path d="M300 300 Q380 300 380 400 L380 620" fill="none" stroke="#b8943e" stroke-width="18"/><ellipse cx="300" cy="300" rx="40" ry="54" fill="#d8b45e"/><ellipse cx="300" cy="300" rx="24" ry="36" fill="#3a2a14"/>
      <circle cx="1060" cy="600" r="18" fill="#c9a45c"/><rect x="1052" y="612" width="16" height="10" fill="#8a6a3a"/>
      <circle cx="900" cy="200" r="70" fill="#1c1410" stroke="#c9a45c" stroke-width="5"/>${[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${900 + Math.sin(a) * 56}" y1="${200 - Math.cos(a) * 56}" x2="${900 + Math.sin(a) * 64}" y2="${200 - Math.cos(a) * 64}" stroke="#c9a45c" stroke-width="3"/>`; }).join('')}<line x1="900" y1="200" x2="900" y2="152" stroke="#e3c47e" stroke-width="5"/><line x1="900" y1="200" x2="938" y2="210" stroke="#e3c47e" stroke-width="4"/>
      <rect width="1600" height="1000" fill="url(#pm-l)"/><rect width="1600" height="1000" filter="url(#pm-g)"/>`);
  }

  /* ---------- 証言台の小道具（金の線画） ---------- */
  function emblem(k) {
    const g = '#e3c47e';
    if (k === 'fan') return `<svg viewBox="0 0 300 240"><g fill="none" stroke="${g}" stroke-width="3"><path d="M150 210 L30 90 A170 170 0 0 1 270 90 Z"/>${[-60, -35, -10, 15, 40].map((a) => `<line x1="150" y1="210" x2="${150 + Math.sin(a * Math.PI / 180) * 170}" y2="${210 - Math.cos(a * Math.PI / 180) * 170}"/>`).join('')}<line x1="150" y1="210" x2="286" y2="190" stroke-dasharray="6 5"/></g></svg>`;
    if (k === 'mask') return `<svg viewBox="0 0 300 240"><g fill="none" stroke="${g}" stroke-width="3"><path d="M30 100 Q60 60 150 80 Q240 60 270 100 Q260 170 190 160 Q160 150 150 130 Q140 150 110 160 Q40 170 30 100 Z"/><ellipse cx="100" cy="115" rx="28" ry="16"/><ellipse cx="200" cy="115" rx="28" ry="16"/><path d="M270 100 Q300 70 290 30"/></g></svg>`;
    return `<svg viewBox="0 0 300 240"><g fill="none" stroke="${g}" stroke-width="3"><circle cx="150" cy="130" r="80"/><circle cx="150" cy="130" r="70"/><circle cx="150" cy="40" r="10"/><path d="M160 36 Q230 10 270 60"/><line x1="150" y1="130" x2="150" y2="80"/><line x1="150" y1="130" x2="186" y2="138"/>${[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${150 + Math.sin(a) * 60}" y1="${130 - Math.cos(a) * 60}" x2="${150 + Math.sin(a) * 68}" y2="${130 - Math.cos(a) * 68}"/>`; }).join('')}</g></svg>`;
  }

  /* ---------- 記録写真（ベタ焼き） ---------- */
  const P = { floor: 380, sill: 232 };
  function person(x, top, kind, o) {
    o = o || {};
    const h = P.floor - top, head = h * 0.13, hy = top + head;
    if (kind === 'dress') return `<g fill="${o.c || '#2a2a2a'}"><circle cx="${x}" cy="${hy}" r="${head}"/><path d="M${x - head * 0.9} ${hy + head * 1.1} L${x + head * 0.9} ${hy + head * 1.1} L${x + h * 0.32} ${P.floor} L${x - h * 0.32} ${P.floor} Z"/><path d="M${x - head * 1.2} ${hy - head * 0.3} Q${x} ${hy - head * 1.8} ${x + head * 1.2} ${hy - head * 0.3}" fill="${o.hair || '#111'}"/></g>`;
    if (kind === 'mask') return `<g><path d="M${x - h * 0.2} ${hy + head} L${x + h * 0.2} ${hy + head} L${x + h * (o.drag ? 0.3 : 0.24)} ${P.floor + (o.drag ? 6 : 0)} L${x - h * (o.drag ? 0.3 : 0.24)} ${P.floor + (o.drag ? 6 : 0)} Z" fill="#141414"/><circle cx="${x}" cy="${hy}" r="${head}" fill="#1e1e1e"/><path d="M${x - head * 0.95} ${hy - head * 0.15} Q${x} ${hy - head * 0.7} ${x + head * 0.95} ${hy - head * 0.15} Q${x + head * 0.8} ${hy + head * 0.5} ${x} ${hy + head * 0.25} Q${x - head * 0.8} ${hy + head * 0.5} ${x - head * 0.95} ${hy - head * 0.15} Z" fill="#e8e8e8"/><path d="M${x - head * 1.1} ${hy - head * 0.6} L${x + head * 1.1} ${hy - head * 0.6} L${x + head * 0.8} ${hy - head * 1.6} L${x - head * 0.8} ${hy - head * 1.6} Z" fill="#0c0c0c"/></g>`;
    return `<g fill="${o.c || '#1c1c1c'}"><circle cx="${x}" cy="${hy}" r="${head}"/><path d="M${x - h * 0.16} ${hy + head} L${x + h * 0.16} ${hy + head} L${x + h * 0.14} ${P.floor} L${x - h * 0.14} ${P.floor} Z"/></g>`;
  }
  function set(ch) {
    return `<rect width="700" height="440" fill="#6c6c6c"/><rect x="0" y="0" width="700" height="${P.floor}" fill="#8a8a8a"/>
      <rect x="220" y="50" width="260" height="${P.sill - 50}" fill="#b8b8b8"/><rect x="220" y="50" width="260" height="${P.sill - 50}" fill="none" stroke="#3a3a3a" stroke-width="8"/><line x1="350" y1="50" x2="350" y2="${P.sill}" stroke="#3a3a3a" stroke-width="6"/><line x1="220" y1="150" x2="480" y2="150" stroke="#3a3a3a" stroke-width="4"/>
      <rect x="208" y="${P.sill}" width="284" height="12" fill="#2e2e2e"/>
      ${ch ? '<g><line x1="350" y1="0" x2="350" y2="30" stroke="#333" stroke-width="3"/><path d="M300 30 H400 L380 60 H320 Z" fill="#555"/>' + [310, 330, 350, 370, 390].map((x) => `<circle cx="${x}" cy="66" r="5" fill="#eee"/>`).join('') + '</g>' : ''}
      <rect x="0" y="${P.floor}" width="700" height="60" fill="#4a4a4a"/>`;
  }
  function frame(n) {
    let body = '';
    if (n === 1) body = set(false) + person(300, 218, 'dress', { c: '#3a3a3a' }) + person(430, 200, 'mask') + person(560, 210, 'man', { c: '#2a2a2a' });
    if (n === 2) body = set(true) + person(320, 218, 'dress', { c: '#3a3a3a' }) + person(410, 230, 'mask', { drag: 1 }) + person(120, 222, 'dress', { c: '#555', hair: '#333' }) + person(600, 210, 'man', { c: '#2a2a2a' });
    if (n === 3) body = `<rect width="700" height="440" fill="#5a5a5a"/><rect x="0" y="0" width="700" height="300" fill="#2a2a2a"/>${[...Array(40)].map((_, i) => `<circle cx="${(i * 97) % 700}" cy="${(i * 53) % 260}" r="1.6" fill="#ddd"/>`).join('')}<rect x="0" y="300" width="700" height="14" fill="#9a9a9a"/>${[...Array(12)].map((_, i) => `<rect x="${20 + i * 58}" y="314" width="8" height="66" fill="#9a9a9a"/>`).join('')}
      ${person(300, 218, 'dress', { c: '#3a3a3a' })}<g transform="translate(348 300)"><path d="M0 0 L-8 -40 L20 -44 Z" fill="#ddd"/><line x1="0" y1="0" x2="22" y2="18" stroke="#ddd" stroke-width="3"/></g>${person(450, 200, 'man', { c: '#1a1a1a' })}<path d="M500 300 Q520 290 540 300 Q530 312 520 306 Q510 312 500 300 Z" fill="#e8e8e8"/>`;
    if (n === 4) { body = `<rect width="700" height="440" fill="#2a2a2a"/>`; for (let r = 0; r < 6; r++) for (let i = 0; i < 14; i++) { const y = 90 + r * 58, x = 30 + i * 48 + (r % 2) * 20; body += `<circle cx="${x}" cy="${y}" r="${12 + r * 1.5}" fill="#111"/><rect x="${x - 18}" y="${y + 12}" width="36" height="30" fill="#141414"/>`; } body += '<text x="690" y="30" text-anchor="end" font-family="sans-serif" font-size="16" fill="#777">客席（下手から）</text>'; }
    return body;
  }
  const VIG = '<radialGradient id="ph-v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>';
  const FR = [
    { n: 1, t: '20:48', cap: '一場　月夜の庭園' },
    { n: 2, t: '21:08', cap: '三場　仮面舞踏会' },
    { n: 3, t: '21:22', cap: '四場　露台' },
    { n: 4, t: '21:25', cap: '客席　ためし撮り' },
  ];
  function photoSheet() {
    let o = `<rect width="1600" height="1000" fill="#0c0c0c"/>`;
    for (let i = 0; i < 26; i++) { o += `<rect x="${30 + i * 60}" y="18" width="30" height="20" rx="4" fill="#222"/><rect x="${30 + i * 60}" y="962" width="30" height="20" rx="4" fill="#222"/>`; }
    FR.forEach((f, i) => {
      const x = 60 + (i % 2) * 760, y = 60 + Math.floor(i / 2) * 460;
      o += `<g class="fr" data-fr="${f.n}" transform="translate(${x} ${y})" style="cursor:pointer"><rect x="-6" y="-6" width="712" height="452" fill="#000"/>${frame(f.n)}<rect width="700" height="440" filter="url(#ph-g)" pointer-events="none"/><rect width="700" height="440" fill="url(#ph-v)" pointer-events="none"/>
        <text x="10" y="432" font-family="${HAND}" font-size="22" fill="#fff" opacity=".9">${f.n}　${f.t}　${f.cap}</text></g>`;
    });
    return svg('0 0 1600 1000', `<defs>${grain('ph-g')}${VIG}</defs>${o}`, 'meet');
  }
  function photoOne(n) {
    const f = FR.find((x) => x.n === n);
    return svg('0 0 700 440', `<defs>${grain('ph-g1')}${VIG}</defs>${frame(n)}<rect width="700" height="440" filter="url(#ph-g1)" pointer-events="none"/><rect width="700" height="440" fill="url(#ph-v)" pointer-events="none"/><text x="12" y="30" font-family="${HAND}" font-size="20" fill="#fff" opacity=".9">${f.t}　${f.cap}</text>
      ${n === 2 ? '<rect data-hot="sill" x="208" y="222" width="284" height="22" fill="transparent" style="cursor:pointer"/><rect data-hot="head" x="372" y="196" width="76" height="84" fill="transparent" style="cursor:pointer"/>' : ''}
      ${n === 1 ? '<rect data-hot="head1" x="395" y="170" width="70" height="76" fill="transparent" style="cursor:pointer"/>' : ''}
      ${n === 3 ? '<rect data-hot="fan" x="330" y="250" width="60" height="70" fill="transparent" style="cursor:pointer"/>' : ''}
      ${n === 4 ? '<rect data-hot="seat" x="400" y="260" width="80" height="80" fill="transparent" style="cursor:pointer"/>' : ''}`, 'meet');
  }

  /* ---------- 足跡Cの拡大 ---------- */
  const FOOT = { x0: 250, px: 40, len: 25.2 };
  function footClose() {
    const L = FOOT.len * FOOT.px, x = FOOT.x0, cy = 520;
    sd = 13; let dust = '';
    for (let i = 0; i < 600; i++) dust += `<circle cx="${rnd() * 1600}" cy="${rnd() * 1000}" r="${rnd() * 3}" fill="#e8e4d8" opacity="${0.05 + rnd() * 0.18}"/>`;
    const sole = `M${x} ${cy} Q${x - 10} ${cy - 90} ${x + 120} ${cy - 100} L${x + L * 0.66} ${cy - 118} Q${x + L * 0.8} ${cy - 124} ${x + L * 0.84} ${cy - 110} L${x + L * 0.84} ${cy + 96} Q${x + L * 0.72} ${cy + 118} ${x + L * 0.6} ${cy + 104} L${x + 120} ${cy + 96} Q${x - 10} ${cy + 90} ${x} ${cy} Z`;
    const big = `M${x + L * 0.86} ${cy - 108} Q${x + L} ${cy - 104} ${x + L} ${cy - 50} Q${x + L} ${cy - 18} ${x + L * 0.87} ${cy - 22} Z`;
    const small = `M${x + L * 0.86} ${cy - 6} Q${x + L * 0.96} ${cy - 4} ${x + L * 0.95} ${cy + 50} Q${x + L * 0.93} ${cy + 96} ${x + L * 0.86} ${cy + 92} Z`;
    return svg('0 0 1600 1000', `<defs>${grain('ft-g')}<pattern id="ft-t" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#efe9da"/><rect width="18" height="4" fill="#d8d0bc"/></pattern></defs>
      <rect width="1600" height="1000" fill="#1d1712"/>${[...Array(9)].map((_, i) => `<rect x="0" y="${i * 120}" width="1600" height="3" fill="#120d09"/>`).join('')}${dust}
      <path d="${sole}" fill="url(#ft-t)" opacity=".92"/><path d="${big}" fill="url(#ft-t)" opacity=".92"/><path d="${small}" fill="url(#ft-t)" opacity=".92"/>
      <text x="80" y="80" font-family="${MINCHO}" font-size="34" fill="#e8e4d8" letter-spacing="6">足跡Ｃ（原寸の写し）</text>
      <text x="80" y="124" font-family="${GOTH}" font-size="22" fill="#b8b0a0">左がかかと、右がつま先。つま先が二つに分かれている。</text>
      <g id="ruler" style="cursor:grab">${ruler()}</g>
      <rect width="1600" height="1000" filter="url(#ft-g)" pointer-events="none"/>`, 'meet');
  }
  function ruler() {
    const px = FOOT.px, W = 32 * px;
    let t = `<rect x="0" y="0" width="${W}" height="110" rx="6" fill="#e6c77a" stroke="#6a5020" stroke-width="3" opacity=".96"/>`;
    for (let i = 0; i <= 30 * 10; i++) { const x = i * px / 10 + px, h = i % 10 === 0 ? 46 : i % 5 === 0 ? 30 : 16; if (x > W - 4) break; t += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#3a2a10" stroke-width="${i % 10 === 0 ? 3 : 1.4}"/>`; if (i % 10 === 0) t += `<text x="${x}" y="78" text-anchor="middle" font-family="${GOTH}" font-size="24" font-weight="700" fill="#3a2a10">${i / 10}</text>`; }
    t += `<text x="${W - 16}" y="100" text-anchor="end" font-family="${GOTH}" font-size="16" fill="#6a5020">センチ</text>`;
    return t;
  }

  /* ---------- 証拠品の小さな絵 ---------- */
  function icon(k) {
    const g = '#c9a45c';
    const m = {
      pamph: `<rect x="10" y="6" width="28" height="36" fill="#6b0f1a"/><rect x="14" y="12" width="20" height="4" fill="${g}"/>`,
      grid: `<rect x="8" y="8" width="32" height="32" fill="none" stroke="${g}" stroke-width="2"/><path d="M8 18 H40 M8 28 H40 M20 8 V40 M30 8 V40" stroke="${g}" stroke-width="1.5"/>`,
      book: `<path d="M8 10 Q16 6 24 10 Q32 6 40 10 V40 Q32 36 24 40 Q16 36 8 40 Z" fill="none" stroke="${g}" stroke-width="2"/><line x1="24" y1="10" x2="24" y2="40" stroke="${g}"/>`,
      score: `<path d="M6 14 H42 M6 20 H42 M6 26 H42 M6 32 H42" stroke="${g}" stroke-width="1.2"/><circle cx="18" cy="30" r="3.5" fill="${g}"/><line x1="21" y1="30" x2="21" y2="14" stroke="${g}" stroke-width="2"/><circle cx="32" cy="24" r="3.5" fill="${g}"/><line x1="35" y1="24" x2="35" y2="10" stroke="${g}" stroke-width="2"/>`,
      note: `<rect x="10" y="6" width="28" height="36" fill="#efe6cc"/><path d="M14 14 H34 M14 20 H34 M14 26 H30" stroke="#666" stroke-width="1.5"/>`,
      plan: `<rect x="6" y="8" width="36" height="32" fill="#12203a" stroke="#8aa2c2" stroke-width="2"/><rect x="18" y="16" width="12" height="12" fill="none" stroke="#8aa2c2" stroke-width="1.5"/>`,
      bulb: `<circle cx="24" cy="20" r="10" fill="#ffe6a8"/><rect x="20" y="30" width="8" height="8" fill="#999"/><line x1="24" y1="4" x2="24" y2="10" stroke="#999"/>`,
      door: `<rect x="14" y="6" width="20" height="36" fill="#3a2a1c" stroke="${g}" stroke-width="2"/><rect x="8" y="22" width="32" height="5" fill="${g}"/>`,
      photo: `<rect x="6" y="10" width="36" height="28" fill="#222" stroke="#999" stroke-width="2"/><rect x="10" y="14" width="28" height="20" fill="#777"/>`,
      memo: `<path d="M10 8 H38 V40 H10 Z" fill="#f6efdc"/><path d="M14 16 Q24 12 34 16 M14 24 Q24 20 32 24" stroke="#2b4c8c" stroke-width="1.6" fill="none"/>`,
      mask: `<path d="M6 20 Q12 12 24 16 Q36 12 42 20 Q40 32 30 30 Q26 28 24 25 Q22 28 18 30 Q8 32 6 20 Z" fill="#eee"/><ellipse cx="16" cy="22" rx="4" ry="2.5" fill="#222"/><ellipse cx="32" cy="22" rx="4" ry="2.5" fill="#222"/>`,
      key: `<circle cx="16" cy="24" r="8" fill="none" stroke="${g}" stroke-width="3"/><path d="M24 24 H42 M36 24 V30 M40 24 V29" stroke="${g}" stroke-width="3"/>`,
    };
    return `<svg viewBox="0 0 48 48">${m[k] || m.note}</svg>`;
  }

  return { house, naraku, NARAKU_SPOTS, corridor, props, wings, prompt, emblem, photoSheet, photoOne, FR, footClose, FOOT, icon };
})();
