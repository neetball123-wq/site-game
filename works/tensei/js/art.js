/* =========================================================
   女神課 転生窓口 — 絵（すべてSVG）
   ========================================================= */
window.TA = (() => {
  'use strict';
  const GOTH = '"Zen Kaku Gothic New", sans-serif';
  const MIN = '"BIZ UDPMincho", "Shippori Mincho", serif';
  let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };

  /* ---------- 窓口（背景） ---------- */
  function office() {
    sd = 11;
    let clouds = '';
    [[160, 150, 1], [520, 110, 1.3], [980, 160, 0.9], [1340, 120, 1.2]].forEach(([x, y, s]) => {
      clouds += `<g transform="translate(${x} ${y}) scale(${s})" opacity=".9"><ellipse cx="0" cy="0" rx="70" ry="26" fill="#fff"/><ellipse cx="-40" cy="8" rx="46" ry="20" fill="#fff"/><ellipse cx="44" cy="10" rx="52" ry="18" fill="#fff"/><ellipse cx="10" cy="-14" rx="40" ry="22" fill="#fff"/></g>`;
    });
    let benches = '';
    [[250, 590], [640, 610], [1030, 590], [1380, 610]].forEach(([x, y]) => {
      benches += `<rect x="${x - 120}" y="${y}" width="240" height="18" rx="6" fill="#b9c4cf"/><rect x="${x - 120}" y="${y - 50}" width="240" height="14" rx="6" fill="#c8d1da"/><rect x="${x - 110}" y="${y + 18}" width="10" height="40" fill="#a9b4bf"/><rect x="${x + 100}" y="${y + 18}" width="10" height="40" fill="#a9b4bf"/>`;
    });
    let waiting = '';
    [[190, 560, 14], [300, 566, 11], [700, 584, 13], [1090, 562, 12], [1330, 584, 10], [1440, 580, 13]].forEach(([x, y, r], i) => {
      waiting += `<g class="wt" style="animation-delay:${-i * 0.9}s"><circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#of-wg)"/><circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="#fff"/></g>`;
    });
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>
      <linearGradient id="of-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d0ec"/><stop offset="1" stop-color="#eaf4fb"/></linearGradient>
      <linearGradient id="of-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f5"/><stop offset="1" stop-color="#dfe6ec"/></linearGradient>
      <linearGradient id="of-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e0" stop-opacity=".55"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></linearGradient>
      <radialGradient id="of-rf"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset=".45" stop-color="#e8b85a" stop-opacity=".35"/><stop offset="1" stop-color="#e8b85a" stop-opacity="0"/></radialGradient><radialGradient id="of-wg"><stop offset="0" stop-color="#fff6d8" stop-opacity=".8"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <linearGradient id="of-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".04"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".56" stop-color="#ffffff" stop-opacity=".03"/><stop offset="1" stop-color="#ffffff" stop-opacity=".12"/></linearGradient>
      <linearGradient id="of-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d9c2"/><stop offset=".08" stop-color="#d9c8aa"/><stop offset="1" stop-color="#bfa988"/></linearGradient>
      <linearGradient id="of-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3dbe2"/><stop offset="1" stop-color="#bfc9d2"/></linearGradient>
    </defs>
      <rect width="1600" height="1000" fill="url(#of-wall)"/>
      <!-- 高窓と雲 -->
      ${[0, 1, 2, 3].map((i) => `<rect x="${90 + i * 370}" y="60" width="310" height="240" rx="140" ry="140" fill="url(#of-sky)"/>`).join('')}
      <g clip-path="url(#of-cl)">${clouds}</g>
      <clipPath id="of-cl">${[0, 1, 2, 3].map((i) => `<rect x="${90 + i * 370}" y="60" width="310" height="240" rx="140" ry="140"/>`).join('')}</clipPath>
      ${[0, 1, 2, 3].map((i) => `<rect x="${90 + i * 370}" y="60" width="310" height="240" rx="140" ry="140" fill="none" stroke="#c9d3dc" stroke-width="10"/><line x1="${245 + i * 370}" y1="60" x2="${245 + i * 370}" y2="300" stroke="#c9d3dc" stroke-width="6"/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<path d="M${120 + i * 370} 300 L${370 + i * 370} 300 L${440 + i * 370} 700 L${60 + i * 370} 700 Z" fill="url(#of-ray)" opacity=".5"/>`).join('')}
      <!-- 待合室 -->
      <rect y="660" width="1600" height="340" fill="url(#of-floor)"/>
      ${benches}${waiting}
      <rect x="1180" y="350" width="170" height="80" rx="6" fill="#2d3b48"/><text x="1265" y="386" text-anchor="middle" font-family="${GOTH}" font-size="20" fill="#9fe0a8" letter-spacing="2">お呼び出し</text><text x="1265" y="416" text-anchor="middle" font-family="monospace" font-size="24" fill="#9fe0a8">→ 3番</text>
      <rect x="200" y="360" width="190" height="60" rx="4" fill="#fff" stroke="#c9d3dc" stroke-width="3"/><text x="295" y="398" text-anchor="middle" font-family="${GOTH}" font-size="22" fill="#4a5a68" letter-spacing="3">待合室</text>
      <!-- 窓口のガラスとわく -->
      <rect x="330" y="140" width="940" height="640" fill="url(#of-glass)"/>
      <rect x="330" y="140" width="940" height="640" fill="none" stroke="#9aa6b2" stroke-width="16"/>
      <line x1="800" y1="140" x2="800" y2="780" stroke="#9aa6b2" stroke-width="10"/>
      <ellipse cx="800" cy="700" rx="110" ry="34" fill="#e6ecf1" stroke="#9aa6b2" stroke-width="6" opacity=".9"/>
      ${[...Array(9)].map((_, i) => `<circle cx="${720 + i * 20}" cy="700" r="4" fill="#9aa6b2"/>`).join('')}
      <rect x="690" y="72" width="220" height="70" rx="8" fill="#2f5d8a"/><text x="800" y="112" text-anchor="middle" font-family="${GOTH}" font-size="30" font-weight="700" fill="#fff" letter-spacing="6">３番窓口</text><text x="800" y="134" text-anchor="middle" font-family="${GOTH}" font-size="14" fill="#cfe0f0" letter-spacing="4">転生のご相談</text>
      <!-- カウンター -->
      <rect x="0" y="780" width="1600" height="220" fill="url(#of-desk)"/><rect x="0" y="780" width="1600" height="10" fill="#f3ead8"/>
      <g transform="translate(1210 830)"><rect x="-90" y="0" width="180" height="46" rx="4" fill="#fff" stroke="#c9b894" stroke-width="3"/><text x="0" y="31" text-anchor="middle" font-family="${MIN}" font-size="22" fill="#3a3a3a" letter-spacing="3">女神課 転生係</text></g>
      <g transform="translate(360 850)"><rect x="-40" y="-8" width="80" height="16" rx="8" fill="#c2332a"/><rect x="-10" y="-40" width="20" height="36" rx="4" fill="#6b4a32"/></g>
      <g id="refl" opacity="0"><rect x="338" y="148" width="924" height="624" fill="#1f2a33" opacity=".28"/><circle cx="560" cy="560" r="150" fill="url(#of-rf)"/><circle cx="560" cy="560" r="46" fill="#fff4d8" opacity=".85"/><circle cx="560" cy="560" r="18" fill="#fff"/></g>
    </svg>`;
  }

  /* ---------- 魂（光） ---------- */
  function orb(o, extra) {
    const [c1, c2, s] = o;
    extra = extra || {};
    const id = 'ob' + Math.floor(Math.random() * 1e6);
    const ears = extra.ears ? `<path d="M-46 -40 L-30 -86 L-10 -48 Z M46 -40 L30 -86 L10 -48 Z" fill="${c2}" opacity=".85"/>` : '';
    const flames = [0, 1, 2].map((i) => `<path class="fl f${i}" d="M${-24 + i * 24} -30 Q${-30 + i * 24} -80 ${-8 + i * 24} -${104 - i * 8} Q${-2 + i * 24} -60 ${6 + i * 24} -30 Z" fill="${c1}" opacity=".75"/>`).join('');
    let dust = ''; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; dust += `<circle class="dp" style="animation-delay:${-i * 0.5}s" cx="${Math.cos(a) * 90}" cy="${Math.sin(a) * 70}" r="${2 + (i % 3)}" fill="#fff"/>`; }
    return `<g transform="scale(${s})"><defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c1}"/><stop offset=".75" stop-color="${c2}" stop-opacity=".5"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient><radialGradient id="${id}h"><stop offset="0" stop-color="${c1}" stop-opacity=".55"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient></defs>
      <circle r="190" fill="url(#${id}h)"/>${flames}${ears}<circle r="78" fill="url(#${id})"/><circle r="30" fill="#fff" opacity=".9"/>${dust}</g>`;
  }
  function soul(c) {
    let body = '';
    if (c.pair) body = `<g transform="translate(-70 -10)">${orb(c.orb)}</g><g transform="translate(90 50)">${orb(c.orb2)}</g>`;
    else body = orb(c.orb, { ears: c.ears });
    const thread = c.thread ? `<path class="thread" d="M0 60 C 30 180, -30 300, 10 420 S 0 560, 20 700" fill="none" stroke="#dfe8ff" stroke-width="3" stroke-dasharray="6 10"/>` : '';
    return `<svg viewBox="-280 -250 560 560" xmlns="http://www.w3.org/2000/svg">${thread}<g class="bob">${body}</g></svg>`;
  }

  /* ---------- 職員証 ---------- */
  function badge(name) {
    return `<svg viewBox="0 0 340 214" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="338" height="212" rx="12" fill="#fbfcfd" stroke="#b8c4cf" stroke-width="2"/>
      <rect x="1" y="1" width="338" height="44" rx="12" fill="#2f5d8a"/><rect x="1" y="30" width="338" height="15" fill="#2f5d8a"/>
      <text x="20" y="30" font-family="${GOTH}" font-size="16" font-weight="700" fill="#fff" letter-spacing="3">天界合同庁舎　臨時職員証</text>
      <rect x="20" y="62" width="92" height="118" rx="4" fill="#e9eef2" stroke="#c9d3dc"/>${name ? '<circle cx="66" cy="112" r="26" fill="#fff6d8"/><circle cx="66" cy="112" r="10" fill="#fff"/>' : '<text x="66" y="126" text-anchor="middle" font-family="' + GOTH + '" font-size="12" fill="#9aa6b2">写真なし</text>'}
      <text x="128" y="80" font-family="${GOTH}" font-size="12" fill="#6a7886">所属</text><text x="128" y="100" font-family="${MIN}" font-size="16" fill="#233">女神課 転生係 第三窓口</text>
      <text x="128" y="128" font-family="${GOTH}" font-size="12" fill="#6a7886">氏名</text><text x="128" y="152" font-family="${MIN}" font-size="20" fill="#233">${name || '　　　　　　'}</text><line x1="128" y1="158" x2="318" y2="158" stroke="#c9d3dc"/>
      <text x="128" y="182" font-family="${GOTH}" font-size="12" fill="#6a7886">採用　令和八年九月二十八日</text>
      <circle cx="298" cy="188" r="16" fill="none" stroke="#c2332a" stroke-width="2" opacity=".8"/><text x="298" y="193" text-anchor="middle" font-family="${MIN}" font-size="12" fill="#c2332a">女神</text></svg>`;
  }

  /* ---------- 印 ---------- */
  function stamp(kind) {
    const t = kind === 'ok' ? '承認' : '差戻';
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="52" fill="none" stroke="#c2332a" stroke-width="6"/><circle cx="60" cy="60" r="44" fill="none" stroke="#c2332a" stroke-width="2"/>
      <text x="60" y="76" text-anchor="middle" font-family="${MIN}" font-size="40" font-weight="700" fill="#c2332a">${t}</text><text x="60" y="30" text-anchor="middle" font-family="${GOTH}" font-size="11" fill="#c2332a" letter-spacing="2">女神課</text></svg>`;
  }

  /* ---------- 結びの絵 ---------- */
  function vignette(k) {
    const wrap = (b, sky1, sky2) => `<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vg-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs><rect width="800" height="400" fill="url(#vg-s)"/>${b}</svg>`;
    if (k === 'arstella') return wrap(`<circle cx="620" cy="120" r="46" fill="#fff4d0" opacity=".9"/><path d="M0 300 Q200 230 400 280 T800 260 V400 H0 Z" fill="#8fbf7a"/><path d="M0 330 Q260 290 520 330 T800 320 V400 H0 Z" fill="#6ea45e"/>
      <g fill="#6b7c8f"><rect x="120" y="170" width="70" height="120"/><rect x="110" y="150" width="20" height="30"/><rect x="180" y="150" width="20" height="30"/><path d="M150 100 L180 170 H120 Z"/></g>
      <g transform="translate(520 285)"><line x1="0" y1="0" x2="0" y2="-60" stroke="#333" stroke-width="5"/><line x1="-6" y1="-44" x2="34" y2="-78" stroke="#ccd" stroke-width="4"/><circle cx="0" cy="-70" r="10" fill="#333"/><path d="M-6 -80 Q-14 -94 -2 -92 Z M6 -80 Q14 -94 2 -92 Z" fill="#b8742a"/></g>`, '#ffd9b0', '#fff4e6');
    if (k === 'gearnold') return wrap(`<rect y="260" width="800" height="140" fill="#3a3430"/>${[...Array(9)].map((_, i) => `<rect x="${i * 100}" y="250" width="60" height="12" fill="#6a5a4a"/>`).join('')}<path d="M0 250 H800" stroke="#8a7a6a" stroke-width="4"/>
      <g fill="#2a2420"><rect x="180" y="180" width="260" height="70" rx="8"/><rect x="420" y="150" width="60" height="100"/><rect x="200" y="140" width="30" height="40"/><circle cx="230" cy="255" r="22"/><circle cx="310" cy="255" r="22"/><circle cx="390" cy="255" r="22"/></g>
      <circle cx="215" cy="110" r="26" fill="#e8e0d8" opacity=".7"/><circle cx="250" cy="80" r="34" fill="#e8e0d8" opacity=".5"/><circle cx="300" cy="50" r="40" fill="#e8e0d8" opacity=".35"/>
      <rect x="600" y="170" width="16" height="80" fill="#2a2420"/><circle cx="608" cy="160" r="12" fill="#2a2420"/>`, '#e8a070', '#f6d8b0');
    if (k === 'lulucia') return wrap(`<circle cx="600" cy="90" r="40" fill="#fffbe8"/><rect y="220" width="800" height="180" fill="#3a8fb8"/>${[...Array(12)].map((_, i) => `<path d="M${i * 70} ${250 + (i % 3) * 30} q15 -8 30 0" stroke="#bfe6f5" stroke-width="3" fill="none"/>`).join('')}
      <path d="M0 220 Q120 150 260 200 L300 220 Z" fill="#6ea45e"/><g fill="#f0a030">${[[80, 190], [120, 180], [160, 196], [200, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g>
      <g transform="translate(520 300)"><circle cx="-30" cy="0" r="12" fill="#fff" opacity=".9"/><path d="M-30 12 q-6 20 -20 30 q20 -2 30 -10" fill="#7fd0c0"/><circle cx="10" cy="6" r="8" fill="#fff" opacity=".9"/><path d="M10 14 q-4 14 -14 20 q14 -2 20 -8" fill="#f0a0c0"/></g>`, '#bfe6ff', '#eaf8ff');
    if (k === 'gensei') return wrap(`<rect x="120" y="60" width="560" height="300" fill="#f4f7fa" stroke="#c9d3dc" stroke-width="6"/><line x1="400" y1="60" x2="400" y2="360" stroke="#c9d3dc" stroke-width="5"/>
      ${[...Array(24)].map((_, i) => `<circle cx="${140 + (i * 53) % 540}" cy="${80 + (i * 37) % 260}" r="5" fill="#f6c6d4" opacity=".85"/>`).join('')}<path d="M620 60 Q560 160 600 360" stroke="#8a6a5a" stroke-width="10" fill="none"/>
      <g transform="translate(300 300)"><ellipse cx="0" cy="0" rx="60" ry="26" fill="#fff"/><circle cx="-40" cy="-6" r="16" fill="#ffe8d8"/><circle cx="36" cy="-2" r="6" fill="#e8c05a"/></g>`, '#fbeff2', '#fff');
    if (k === 'haiiro') return wrap(`<rect y="260" width="800" height="140" fill="#8a8580"/><path d="M0 260 Q200 240 400 262 T800 250" fill="none" stroke="#6a6560" stroke-width="3"/>
      <g transform="translate(400 262)"><line x1="0" y1="0" x2="0" y2="-50" stroke="#4a7a3a" stroke-width="4"/><path d="M0 -50 l-10 -20 l10 6 l10 -6 Z" fill="#4a6ad8"/><path d="M0 -24 q-16 -6 -18 -16" stroke="#4a7a3a" stroke-width="3" fill="none"/></g>`, '#b8b0a8', '#e0d8d0');
    return wrap(`<rect x="160" y="60" width="480" height="260" fill="none" stroke="#9aa6b2" stroke-width="10"/><rect x="330" y="20" width="140" height="50" rx="6" fill="#2d3b48"/><text x="400" y="54" text-anchor="middle" font-family="monospace" font-size="26" fill="#9fe0a8">5812</text>
      <circle cx="400" cy="200" r="70" fill="#fde6ee" opacity=".5"/><circle cx="400" cy="200" r="26" fill="#fff"/><rect y="320" width="800" height="80" fill="#d9c8aa"/>`, '#eef2f5', '#dfe6ec');
  }

  return { office, soul, badge, stamp, vignette };
})();
