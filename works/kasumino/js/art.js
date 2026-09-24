/* 霞野線アーカイブ — SVGの絵：駅スタンプ、写真、車両、配線図 */
(() => {
  'use strict';
  const { esc } = K;

  /* ---------- 駅スタンプ ---------- */
  const MOTIF = {
    wave: '<path d="M-22-4q5.5-7 11 0t11 0t11 0t11 0M-22 7q5.5-7 11 0t11 0t11 0t11 0"/>',
    anchor: '<circle cy="-16" r="4"/><path d="M0-12v26M-9-6h18M-16 3q2 13 16 13q14 0 16-13"/>',
    salt: '<path d="M-24 12h48M-18 12l8-13l6 7l7-15l13 21"/>',
    sakura: '<g>' + [0, 72, 144, 216, 288].map(r => `<ellipse cy="-9" rx="5" ry="8" transform="rotate(${r})"/>`).join('') + '<circle r="2.5"/></g>',
    boat: '<path d="M-20 4h40l-7 9h-26zM0 4v-22l14 18h-14M-24 18q6-4 12 0t12 0t12 0t12 0"/>',
    lake: '<ellipse rx="22" ry="7" cy="8"/><path d="M-14 0v-14M-10 0v-9M14 0v-16M18 0v-8"/>',
    torii: '<path d="M-22-15q22-6 44 0M-17-8h34M-11-15v28M11-15v28"/>',
    dam: '<path d="M-18-12h30l8 26h-46zM-24 18h48M-10-4h18M-12 5h24"/>',
    mountain: '<path d="M-24 14l16-24l8 10l10-16l14 30zM-12-4l4-6l4 5"/>',
    cloud: '<path d="M-18 8a8 8 0 0 1 2-15a10 10 0 0 1 18-4a9 9 0 0 1 16 8a7 7 0 0 1-2 11z"/>',
    star: '<path d="M0-20l5 13h13l-10 8l4 13l-12-8l-12 8l4-13l-10-8h13z"/>',
    lantern: '<path d="M-8-16h16v26h-16zM-11-16h22M-11 10h22M0-22v6M-4-8h8M-4 0h8"/>',
    moon: '<path d="M6-19a16 16 0 1 0 9 27a13 13 0 1 1-9-27z"/><path d="M-22 16q4-7 8 0q4-7 8 0q4-7 8 0"/>'
  };
  function stamp(st, opts = {}) {
    const c = st.ink;
    const hidden = st.hidden ? `<text x="${st.hx}" y="${st.hy}" font-size="7" font-weight="700" fill="${c}" stroke="none">${st.hidden}</text>` : '';
    const date = st.id === 'tsukimino' ? '62.3.31 23:08' : '62.3.31';
    return `<svg class="stamp${opts.cls ? ' ' + opts.cls : ''}" viewBox="-60 -60 120 120" role="img" aria-label="${esc(st.name)}駅のスタンプ">`
      + `<g filter="url(#ink)" stroke="${c}" fill="none" stroke-linecap="round" stroke-linejoin="round">`
      + `<circle r="55" stroke-width="3.2"/><circle r="49" stroke-width="1"/>`
      + `<text y="-33" text-anchor="middle" font-size="8" letter-spacing="2" fill="${c}" stroke="none">北灘鉄道 霞野線</text>`
      + `<g stroke-width="2.2" transform="translate(0 -4) scale(.95)">${MOTIF[st.motif] || ''}</g>${hidden}`
      + `<text y="31" text-anchor="middle" font-size="14" font-weight="700" fill="${c}" stroke="none">${esc(st.name)}駅</text>`
      + `<text y="43" text-anchor="middle" font-size="6.5" letter-spacing="1" fill="${c}" stroke="none">${date}</text>`
      + `</g></svg>`;
  }

  /* ---------- 写真（セピア調の絵） ---------- */
  const car = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect width="140" height="40" rx="5" fill="#E8D9BC"/><rect y="25" width="140" height="15" fill="#A5553A"/>`
    + [8, 30, 52, 74, 96, 118].map(wx => `<rect x="${wx}" y="7" width="15" height="13" rx="1.5" fill="#6D6152"/>`).join('')
    + '<rect x="0" y="-5" width="140" height="6" rx="3" fill="#7D7466"/><circle cx="30" cy="44" r="5" fill="#3E342A"/><circle cx="110" cy="44" r="5" fill="#3E342A"/></g>';
  const PHOTO = {
    'p-nada': '<rect width="320" height="210" fill="#E8D9BA"/><rect y="112" width="320" height="22" fill="#BDB39B"/><path d="M0 134h320v76H0z" fill="#CFBD98"/>'
      + '<path d="M22 84l70-32l70 32z" fill="#6B5642"/><rect x="32" y="82" width="120" height="58" fill="#9C8262"/><rect x="64" y="86" width="56" height="12" fill="#F2E8D5"/>'
      + '<text x="92" y="95.5" font-size="8" text-anchor="middle" fill="#3A2E22">灘浜駅</text><rect x="44" y="104" width="16" height="20" fill="#E8DCC2"/><rect x="124" y="104" width="16" height="20" fill="#E8DCC2"/><rect x="82" y="106" width="22" height="34" fill="#4A3B2A"/>'
      + '<rect x="160" y="146" width="160" height="8" fill="#B5A07E"/>' + car(172, 104)
      + '<g fill="#5C4A38"><circle cx="190" cy="152" r="3"/><rect x="187" y="155" width="6" height="12" rx="2"/><circle cx="204" cy="150" r="3"/><rect x="201" y="153" width="6" height="14" rx="2"/></g>',
    'p-sakura': '<rect width="320" height="210" fill="#E9DCC4"/><path d="M160 120L60 210h40l60-90l60 90h40z" fill="#BBA888"/><path d="M150 210l8-90M170 210l-8-90" stroke="#6E5E4B" stroke-width="2"/>'
      + Array.from({ length: 46 }, (_, i) => { const a = Math.PI * (i / 45); const r = 130 + (i % 3) * 14; return `<circle cx="${160 - Math.cos(a) * r}" cy="${150 - Math.sin(a) * r * 0.8}" r="${22 + (i % 4) * 5}" fill="${i % 2 ? '#D9B6A8' : '#E6C8BC'}"/>`; }).join('')
      + car(128, 104, 0.45),
    'p-enden': '<rect width="320" height="210" fill="#CDB892"/><rect y="160" width="320" height="50" fill="#8E7A5E"/><rect x="24" y="40" width="130" height="80" fill="#EFE6D2" stroke="#6B5642" stroke-width="5"/>'
      + '<path d="M28 96h122M28 104h122" stroke="#D9CBAE" stroke-width="3"/><path d="M89 40v80M24 80h130" stroke="#6B5642" stroke-width="3"/>'
      + '<rect x="176" y="36" width="44" height="58" fill="#F3EBDA"/><path d="M182 46h32M182 54h26M182 62h32M182 70h22M182 78h30" stroke="#8C7A60" stroke-width="2"/><text x="198" y="32" font-size="7" text-anchor="middle" fill="#4A3B2A">時刻表</text>'
      + '<rect x="18" y="138" width="210" height="10" fill="#6B5642"/><rect x="26" y="148" width="8" height="14" fill="#5A4836"/><rect x="210" y="148" width="8" height="14" fill="#5A4836"/>'
      + '<g class="hotspot" data-stamp="enden" tabindex="0" role="button" aria-label="壁に掛かった小さな箱"><path d="M258 52l14-10l14 10" stroke="#4A3B2A" fill="none"/><rect x="250" y="52" width="44" height="34" rx="2" fill="#9C6B45" stroke="#5A3E28" stroke-width="2"/><text x="272" y="72" font-size="7" text-anchor="middle" fill="#F2E8D5">スタンプ</text></g>',
    'p-kasumi': '<rect width="320" height="210" fill="#E4DBCB"/><path d="M0 92l50-40l40 26l50-44l60 50l50-30l70 38v18H0z" fill="#A89A82"/><rect y="110" width="320" height="100" fill="#B7AE9C"/>'
      + '<g opacity=".85" fill="#F1EBDD"><rect y="100" width="320" height="16" rx="8"/><rect x="40" y="130" width="240" height="12" rx="6"/><rect x="-20" y="156" width="200" height="10" rx="5"/></g>'
      + '<path d="M214 150q14-4 28 0M218 154h20M222 150v14M234 150v14" stroke="#7A6C58" stroke-width="2" fill="none" opacity=".7"/>',
    'p-post': '<rect width="320" height="210" fill="#DCD3C2"/><rect y="150" width="320" height="60" fill="#9C8F74"/><path d="M0 170q40-14 80 0t80 0t80 0t80 0v40H0z" fill="#86795F"/>'
      + '<g opacity=".7" fill="#EDE7DA"><rect y="60" width="320" height="30" rx="15"/><rect x="60" y="112" width="240" height="18" rx="9"/></g>'
      + '<rect x="140" y="70" width="40" height="100" fill="#F4F0E6" stroke="#6B5E4A" stroke-width="2"/><path d="M140 70l20-12l20 12" fill="#F4F0E6" stroke="#6B5E4A" stroke-width="2"/>'
      + '<text x="160" y="104" font-size="18" font-weight="700" text-anchor="middle" fill="#2E2720" font-family="sans-serif">10</text><text x="160" y="130" font-size="18" font-weight="700" text-anchor="middle" fill="#2E2720" font-family="sans-serif">.</text>'
      + '<rect x="148" y="136" width="24" height="22" fill="#B9AE98"/><path d="M150 140l20 14M152 154l16-12" stroke="#8C806B" stroke-width="3"/>',
    'p-last': '<rect width="320" height="210" fill="#2A241E"/><g fill="#F2DDA4"><circle cx="50" cy="40" r="4"/><circle cx="160" cy="36" r="4"/><circle cx="270" cy="40" r="4"/></g>'
      + '<g fill="#F2DDA4" opacity=".12"><circle cx="50" cy="40" r="28"/><circle cx="160" cy="36" r="28"/><circle cx="270" cy="40" r="28"/></g><rect y="160" width="320" height="50" fill="#4A4036"/>'
      + '<rect x="100" y="62" width="120" height="104" rx="10" fill="#D8C8A8"/><rect x="100" y="124" width="120" height="42" fill="#8E4630"/><rect x="112" y="76" width="40" height="34" rx="3" fill="#3E3A34"/><rect x="168" y="76" width="40" height="34" rx="3" fill="#3E3A34"/>'
      + '<circle cx="132" cy="92" r="7" fill="#221E19"/><rect x="124" y="98" width="16" height="12" rx="3" fill="#221E19"/><rect x="123" y="84" width="18" height="5" rx="2" fill="#221E19"/>'
      + '<rect x="132" y="66" width="56" height="10" fill="#F4EAD2"/><text x="160" y="74" font-size="7" text-anchor="middle" fill="#2A241E">灘浜</text><rect x="146" y="130" width="28" height="12" fill="#F4EAD2"/><text x="160" y="139" font-size="8" text-anchor="middle" fill="#2A241E">148D</text>'
      + '<circle cx="116" cy="150" r="6" fill="#FFF3C8"/><circle cx="204" cy="150" r="6" fill="#FFF3C8"/><circle cx="116" cy="150" r="16" fill="#FFF3C8" opacity=".2"/><circle cx="204" cy="150" r="16" fill="#FFF3C8" opacity=".2"/>',
    'p-kiri': '<rect width="320" height="210" fill="#1E1B22"/>' + Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 53) % 320}" cy="${(i * 29) % 110}" r="${i % 5 ? 0.8 : 1.4}" fill="#EDE3CC"/>`).join('')
      + '<path d="M0 150q80-20 160-6t160-4v70H0z" fill="#2C2620"/>' + Array.from({ length: 90 }, (_, i) => `<circle cx="${(i * 37) % 320}" cy="${160 + ((i * 17) % 44)}" r="1.1" fill="#F2D38E"/>`).join('')
      + '<path d="M0 124h320M0 138h320M20 124v26M100 124v26M180 124v26M260 124v26" stroke="#5A5046" stroke-width="3"/>'
  };
  const photo = id => `<svg class="photo-svg" viewBox="0 0 320 210" role="img" aria-label="写真">${PHOTO[id] || ''}</svg>`;

  /* ---------- 保存車両 ナダ101 ---------- */
  const railcar = () => '<svg class="railcar" viewBox="0 0 640 200" role="img" aria-label="保存車両ナダ101の側面">'
    + '<defs><clipPath id="carbody"><rect x="20" y="40" width="600" height="112" rx="12"/></clipPath></defs>'
    + '<rect x="30" y="28" width="580" height="16" rx="7" fill="#8D8A84"/><g clip-path="url(#carbody)"><rect x="20" y="40" width="600" height="112" fill="#EFE3C8"/><rect x="20" y="108" width="600" height="44" fill="#D0552E"/></g>'
    + [60, 96, 212, 248, 284, 320, 356, 392, 428, 544].map(x => `<rect x="${x}" y="58" width="30" height="32" rx="3" fill="#56626B"/>`).join('')
    + [['door1', 150], ['door2', 480]].map(([id, x]) => `<g class="hotspot" data-act="door" tabindex="0" role="button" aria-label="扉を開けて車内に入る"><rect x="${x}" y="50" width="42" height="100" rx="2" fill="#E6D8BB" stroke="#6B5A45" stroke-width="2"/><rect x="${x + 7}" y="60" width="28" height="34" rx="2" fill="#56626B"/><rect x="${x}" y="108" width="42" height="42" fill="#C24E2A" stroke="#6B5A45" stroke-width="2"/></g>`).join('')
    + '<text x="585" y="136" font-size="15" font-weight="700" text-anchor="end" fill="#FBF3E2">ナダ101</text><circle cx="26" cy="70" r="6" fill="#FFF1C2" stroke="#6B5A45"/>'
    + '<g fill="#3B342D"><rect x="70" y="152" width="110" height="12" rx="3"/><rect x="460" y="152" width="110" height="12" rx="3"/><circle cx="95" cy="170" r="12"/><circle cx="155" cy="170" r="12"/><circle cx="485" cy="170" r="12"/><circle cx="545" cy="170" r="12"/></g>'
    + '<rect x="0" y="182" width="640" height="5" fill="#6D655A"/></svg>';

  function interior(stationNames) {
    const cells = stationNames.map((n, i) => `<rect x="${306 + (i % 7) * 44}" y="${36 + Math.floor(i / 7) * 22}" width="42" height="20" fill="#F7F1E3" stroke="#6B5A45" stroke-width=".8"/><text x="${327 + (i % 7) * 44}" y="${50 + Math.floor(i / 7) * 22}" font-size="8" text-anchor="middle" fill="#2E2720">${esc(n)}</text>`).join('');
    return '<svg class="interior" viewBox="0 0 640 300" role="img" aria-label="ナダ101の車内">'
      + '<rect width="640" height="300" fill="#DCCFB3"/><rect y="236" width="640" height="64" fill="#8E7A5E"/><rect y="20" width="640" height="10" fill="#B9A988"/>'
      + [40, 150, 480].map(x => `<rect x="${x}" y="96" width="96" height="70" rx="4" fill="#9FA8A3" stroke="#6B5A45" stroke-width="3"/><path d="M${x} 122h96" stroke="#B9C0BB" stroke-width="2"/>`).join('')
      + '<rect x="20" y="176" width="600" height="18" rx="4" fill="#4F6F6A"/><rect x="20" y="194" width="600" height="30" rx="6" fill="#5E807A"/>'
      + '<path d="M0 60h640" stroke="#A89878" stroke-width="3"/>' + [70, 130, 190, 250, 390, 450, 510, 570].map(x => `<path d="M${x} 60v16" stroke="#A89878" stroke-width="2"/><circle cx="${x}" cy="82" r="6" fill="none" stroke="#6B5A45" stroke-width="2"/>`).join('')
      + '<rect x="296" y="12" width="330" height="84" fill="#EDE3CB" stroke="#6B5A45" stroke-width="1.5"/><text x="461" y="28" font-size="9" text-anchor="middle" fill="#2E2720">運　賃　表</text>' + cells
      + '<g class="hotspot" data-stamp="kirinodai" tabindex="0" role="button" aria-label="扉の横の小さな箱"><rect x="262" y="150" width="30" height="26" rx="2" fill="#9C6B45" stroke="#5A3E28" stroke-width="2"/><text x="277" y="166" font-size="5.5" text-anchor="middle" fill="#F2E8D5">スタンプ</text></g>'
      + '<rect x="248" y="96" width="4" height="140" fill="#6B5A45"/><rect x="560" y="236" width="80" height="10" fill="#6D5A44"/></svg>';
  }

  /* ---------- 昭和6年の計画図 ---------- */
  const planMap = () => '<svg class="planmap" viewBox="0 0 520 220" role="img" aria-label="昭和6年 霞野線計画図">'
    + '<rect width="520" height="220" fill="#EFE2C4"/><path d="M0 0h520v220H0z" fill="none" stroke="#B59C72" stroke-width="6"/>'
    + '<text x="20" y="28" font-size="13" fill="#5A4430">昭和六年　霞野線 線路予定図（部分）</text>'
    + '<path d="M40 170C120 168 150 130 210 128S300 150 340 110S420 60 480 56" fill="none" stroke="#3E3024" stroke-width="3" stroke-dasharray="10 4"/>'
    + [[40, 170, '灘浜'], [150, 140, '汐入'], [300, 138, '霞沢'], [480, 56, '霞野']].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="5" fill="#3E3024"/><text x="${x}" y="${y + 20}" font-size="12" text-anchor="middle" fill="#3E3024">${n}</text>`).join('')
    + '<circle cx="222" cy="128" r="7" fill="none" stroke="#9E2F1F" stroke-width="2.5"/><text x="222" y="112" font-size="12" text-anchor="middle" fill="#9E2F1F">月見野（予定）</text>'
    + '<text x="240" y="170" font-size="10" fill="#5A4430">月見野村</text><path d="M232 176l6-8l6 8z" fill="#5A4430"/>'
    + '<ellipse cx="250" cy="150" rx="70" ry="32" fill="none" stroke="#3B6A8E" stroke-width="1.5" stroke-dasharray="4 3"/><text x="336" y="190" font-size="10" fill="#3B6A8E">← 昭和37年 霞ダム湖（あとから書き込み）</text></svg>';

  /* ---------- 月見野の信号機 ---------- */
  const signal = () => '<svg class="signal" viewBox="0 0 120 220" role="img" aria-label="月見野の出発信号機">'
    + '<rect x="56" y="80" width="8" height="140" fill="#5B5750"/><rect x="30" y="16" width="60" height="78" rx="10" fill="#26231F"/>'
    + '<circle cx="60" cy="42" r="14" fill="#3A342C"/><circle id="lamp-glow" cx="60" cy="42" r="30" fill="#FFD27A" opacity="0"/><circle id="lamp" cx="60" cy="42" r="14" fill="#3A342C"/>'
    + '<circle cx="60" cy="74" r="10" fill="#332E28"/><rect x="36" y="196" width="48" height="10" fill="#4B463F"/></svg>';

  /* ---------- 月見野 配線図（端末用） ---------- */
  function track(sw) {
    const r21 = sw[21] === 'R', r22 = sw[22] === 'R';
    const seg = (d, on) => `<path d="${d}" class="${on ? 'on' : 'off'}"/>`;
    return '<svg class="track" viewBox="0 0 760 170" role="img" aria-label="月見野駅の配線図">'
      + seg('M300 70H620', true)
      + seg('M300 70L250 115H150', !r21)
      + seg('M300 70H220', r21)
      + seg('M220 70H20', r21 && !r22)
      + seg('M220 70L175 25H60', r21 && r22)
      + seg('M620 70H740', false)
      + '<rect x="146" y="105" width="6" height="20" class="stop"/><rect x="330" y="80" width="260" height="10" class="plat"/>'
      + '<rect x="380" y="58" width="180" height="24" rx="4" class="train"/><text x="470" y="75" text-anchor="middle" class="tlabel">← 148D</text>'
      + `<text x="300" y="52" text-anchor="middle" class="sw">21:${r21 ? 'R' : 'N'}</text><text x="220" y="98" text-anchor="middle" class="sw">22:${r22 ? 'R' : 'N'}</text>`
      + '<text x="460" y="110" text-anchor="middle" class="lb">月見野 ホーム</text><text x="30" y="60" class="lb">汐入方 本線 →灘浜</text><text x="160" y="140" class="lb">安全側線（車止め）</text>'
      + '<text x="64" y="16" class="lb">旧線（湖底へ）</text><path d="M60 34q8-5 16 0t16 0t16 0" class="wave"/><text x="740" y="60" text-anchor="end" class="lb">霞沢方</text></svg>';
  }

  K.art = { stamp, photo, railcar, interior, planMap, signal, track, MOTIF };
})();
