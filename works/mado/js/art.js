/* ふたつの窓 — 絵（部屋・窓の外・写真・フィルム・手もとの物）
   部屋と窓の外は 600×540。暗さは、部屋ぜんたいを黒でおおい、光のあたる所だけ穴をあけて表す。 */
(() => {
  const G = MD.G;
  const A = {};
  const pt = (a) => a.map((p) => p.join(',')).join(' ');
  const poly = (a, fill, extra = '') => `<polygon points="${pt(a)}" fill="${fill}" ${extra}/>`;
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const hs = (id, shape, label) => shape.replace(/^<(\w+)/, `<$1 class="hs" data-h="${id}" aria-label="${label || ''}"`);
  const hsR = (id, x, y, w, h, label) => `<rect class="hs" data-h="${id}" x="${x}" y="${y}" width="${w}" height="${h}" aria-label="${label || ''}"/>`;
  const hsP = (id, a, label) => `<polygon class="hs" data-h="${id}" points="${pt(a)}" aria-label="${label || ''}"/>`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  A.hs = hs;

  /* ---- 暗さ ---- */
  // holes: [cx, cy, rx, ry, a]
  const dark = (pre, level, holes) => {
    if (level <= 0) return '';
    let defs = '', g = '';
    holes.forEach(([cx, cy, rx, ry, a], i) => {
      defs += `<radialGradient id="${pre}-h${i}"><stop offset="0" stop-color="#000" stop-opacity="${a}"/><stop offset=".55" stop-color="#000" stop-opacity="${a * 0.75}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
      g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${pre}-h${i})"/>`;
    });
    return `<defs>${defs}<mask id="${pre}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="540"><rect width="600" height="540" fill="#fff"/>${g}</mask></defs>`
      + `<rect class="dk" width="600" height="540" fill="#03050b" mask="url(#${pre}-m)" style="opacity:calc(${level} * (1 - var(--flash, 0)))"/>`;
  };

  /* ---- 猫（三毛） ---- */
  A.cat = (x, y, s, pose, opt = {}) => {
    const eyes = opt.eyes ? `<circle cx="${pose === 'curl' ? -14 : 9}" cy="${pose === 'curl' ? -6 : -21}" r="1.6" fill="#ffe27a"/><circle cx="${pose === 'curl' ? -9 : 14}" cy="${pose === 'curl' ? -6 : -21}" r="1.6" fill="#ffe27a"/>` : '';
    const wet = opt.wet ? ' opacity=".92"' : '';
    if (pose === 'curl') {
      return `<g transform="translate(${x} ${y}) scale(${s})"${wet}><ellipse cx="0" cy="0" rx="20" ry="11" fill="#f1ece2"/><path d="M-6-10a9 7 0 0 1 16 2l-4 6z" fill="#d9833c"/><path d="M8 4a7 6 0 0 1 10-6l2 6z" fill="#2b2622"/>`
        + `<circle cx="-12" cy="-5" r="8" fill="#f1ece2"/><path d="M-18-10l2-7 4 5zM-9-12l4-6 1 7z" fill="#2b2622"/><path d="M-17-8a5 4 0 0 1 6-2" fill="#d9833c"/><path d="M18 2q8 6 0 9q-12 2-22-2" stroke="#2b2622" stroke-width="3" fill="none" stroke-linecap="round"/>${eyes}</g>`;
    }
    if (pose === 'walk') {
      return `<g transform="translate(${x} ${y}) scale(${s})"${wet}><path d="M-16 0l-2 10M-8 2l1 9M8 2l-1 9M15 0l2 10" stroke="#e8e2d6" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="0" cy="-4" rx="18" ry="9" fill="#f1ece2"/><path d="M-4-12a8 6 0 0 1 12 3l-6 4z" fill="#d9833c"/><path d="M-18-6q-10-6-8-16" stroke="#2b2622" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + `<circle cx="18" cy="-12" r="8" fill="#f1ece2"/><path d="M13-18l1-7 5 5zM21-19l5-5 0 8z" fill="#2b2622"/><path d="M14-16a5 4 0 0 1 7-2" fill="#d9833c"/>${opt.eyes ? '<circle cx="20" cy="-13" r="1.5" fill="#ffe27a"/><circle cx="24" cy="-13" r="1.5" fill="#ffe27a"/>' : ''}</g>`;
    }
    // sit
    return `<g transform="translate(${x} ${y}) scale(${s})"${wet}><path d="M8 0q14 2 14-10" stroke="#2b2622" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-10 0q-2-22 10-26q12 4 10 26z" fill="#f1ece2"/><path d="M-9-6q2-12 8-14l2 14z" fill="#d9833c"/><path d="M3-24q7 2 7 10l-6-2z" fill="#2b2622"/>`
      + `<circle cx="1" cy="-28" r="9" fill="#f1ece2"/><path d="M-7-31l1-8 6 5zM4-35l6-5 1 8z" fill="#2b2622"/><path d="M-6-31a6 4 0 0 1 7-3" fill="#d9833c"/>${opt.eyes ? '<circle cx="-2" cy="-28" r="1.5" fill="#ffe27a"/><circle cx="5" cy="-28" r="1.5" fill="#ffe27a"/>' : '<path d="M-4-28h3M3-28h3" stroke="#2b2622" stroke-width="1"/>'}</g>`;
  };

  /* ---- 空 ---- */
  const sky = (pre, S, h = 540) => {
    if (S.ended) return `<defs><linearGradient id="${pre}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fbfe0"/><stop offset=".7" stop-color="#e6dcc6"/><stop offset="1" stop-color="#f4d6ad"/></linearGradient></defs>${rect(0, 0, 600, h, `url(#${pre}-sky)`)}`
      + `<g fill="#fff" opacity=".7"><ellipse cx="120" cy="70" rx="70" ry="14"/><ellipse cx="420" cy="40" rx="90" ry="12"/></g>`;
    if (S.f.eye) {
      let st = '';
      for (let i = 0; i < 70; i++) { const x = (i * 97) % 600, y = (i * 53) % 150, r = (i % 5 === 0) ? 1.6 : 0.9; st += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.5 + (i % 3) * 0.2}"/>`; }
      return `<defs><linearGradient id="${pre}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060c22"/><stop offset="1" stop-color="#1c2a52"/></linearGradient></defs>${rect(0, 0, 600, h, `url(#${pre}-sky)`)}${st}`
        + `<path d="M0 150q90-30 170 0t180-6t250 10v-30H0z" fill="#0d1430" opacity=".6"/>`;
    }
    return `<defs><linearGradient id="${pre}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f1e"/><stop offset="1" stop-color="#1d2640"/></linearGradient></defs>${rect(0, 0, 600, h, `url(#${pre}-sky)`)}`
      + `<g fill="#2a3352" opacity=".8"><ellipse cx="90" cy="40" rx="140" ry="34"/><ellipse cx="380" cy="24" rx="200" ry="36"/><ellipse cx="560" cy="70" rx="120" ry="30"/></g>`
      + `<rect class="skyflash" width="600" height="${h}" fill="#dfe8ff" style="opacity:calc(var(--flash, 0) * .55)"/>`;
  };

  /* ---- 窓の中（外から見た部屋） ---- */
  const lens = (S) => S.f.filmOn && S.f.screen && S.aim === 'glass' && G.torchA(S);
  A.interior = (S, of, x, y, w, h, pre, from) => {
    const X = (u) => x + u * w, Y = (v) => y + v * h;
    let s = `<g><clipPath id="${pre}-ic"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${pre}-ic)">`;
    if (of === 'b') {
      if (S.ended) {
        s += rect(x, y, w, h, '#efe4d0') + rect(x, Y(0.82), w, h * 0.18, '#c9a77c') + rect(X(0.15), Y(0.2), w * 0.2, h * 0.22, '#f6eedd') + rect(X(0.55), Y(0.15), w * 0.15, h * 0.28, '#f6eedd');
        s += `<polygon points="${pt([[X(0.6), y], [X(1), y], [X(0.8), Y(1)], [X(0.25), Y(1)]])}" fill="#fff6dc" opacity=".55"/>`;
        s += `</g><text x="${X(0.5)}" y="${Y(0.56)}" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="${h * 0.2}" fill="#fff" opacity=".85" stroke="#cfd8dc" stroke-width=".6">またね</text>`;
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e8f0f4" opacity=".28"/></g>`;
        return s;
      }
      const glow = S.f.candle;
      s += rect(x, y, w, h, glow ? '#3a2416' : '#080a11');
      if (glow) s += `<defs><radialGradient id="${pre}-cg" cx=".35" cy=".85" r=".8"><stop offset="0" stop-color="#ffb35c" stop-opacity=".95"/><stop offset=".5" stop-color="#b8612a" stop-opacity=".6"/><stop offset="1" stop-color="#3a2416" stop-opacity="0"/></radialGradient></defs>${rect(x, y, w, h, `url(#${pre}-cg)`)}`;
      // 奥の段ボール（左下）・鏡台（右）・天井の灯り
      const sil = glow ? '#6e4627' : '#14161f';
      s += rect(X(0.04), Y(0.62), w * 0.36, h * 0.4, sil) + rect(X(0.1), Y(0.46), w * 0.26, h * 0.18, sil);
      s += rect(X(0.64), Y(0.62), w * 0.34, h * 0.4, sil) + `<ellipse cx="${X(0.81)}" cy="${Y(0.46)}" rx="${w * 0.1}" ry="${h * 0.12}" fill="${glow ? '#d8c4a6' : '#2a3548'}" stroke="${glow ? '#8a6a4a' : '#3a4558'}" stroke-width="3"/><path d="M${X(0.76)} ${Y(0.41)}q${w * 0.03} -${h * 0.05} ${w * 0.07} -${h * 0.04}" stroke="#9fb4c8" stroke-width="2" fill="none" opacity=".6"/>`;
      s += `<path d="M${X(0.5)} ${y}v${h * 0.08}" stroke="${sil}" stroke-width="2"/><ellipse cx="${X(0.5)}" cy="${Y(0.1)}" rx="${w * 0.08}" ry="${h * 0.035}" fill="${sil}"/>`;
      if (S.cat === 'b') s += A.cat(X(0.62), Y(0.92), w / 300, 'curl');
      // 光の輪（ソウの懐中電灯）
      if (G.beamIn(S)) {
        const spot = { boxes: [0.24, 0.66, 0.26, 0.26], dresser: [0.8, 0.6, 0.22, 0.34], ceiling: [0.5, 0.08, 0.5, 0.16], glass: [0.5, 0.5, 0.45, 0.4] }[S.aim];
        s += `<defs><radialGradient id="${pre}-bs"><stop offset="0" stop-color="#fffbe8" stop-opacity=".95"/><stop offset=".6" stop-color="#fff3c4" stop-opacity=".5"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs><ellipse cx="${X(spot[0])}" cy="${Y(spot[1])}" rx="${w * spot[2]}" ry="${h * spot[3]}" fill="url(#${pre}-bs)"/>`;
        if (S.aim === 'ceiling') s += rect(x, y, w, h, '#fff3c4', 'opacity=".12"');
        if (S.aim === 'dresser') s += `<ellipse cx="${X(0.81)}" cy="${Y(0.46)}" rx="${w * 0.06}" ry="${h * 0.07}" fill="#fff" opacity=".9"/>`;
      }
      // スクリーン（シーツ）
      if (S.f.screen) {
        s += `<path d="M${X(0.3)} ${Y(0.36)}h${w * 0.42}l-2 ${h * 0.5}q-${w * 0.2} 6 -${w * 0.4} 0z" fill="${glow ? '#d9c6a8' : lens(S) ? '#cfc8bb' : '#20232c'}" opacity=".95"/>`;
        if (lens(S) && !glow) s += A.projOn(S, X(0.31), Y(0.38), w * 0.4, h * 0.44, pre + 'pa', 'a');
      }
      s += '</g>';
      // フィルム（ガラスにはってある）
      if (S.f.filmOn) {
        const lit = S.aim === 'glass' && G.torchA(S);
        s += rect(X(0.08), Y(0.4), w * 0.84, h * 0.13, lit ? '#e2a25c' : '#3a2412', 'opacity=".92"');
        for (let i = 0; i < 6; i++) s += rect(X(0.1 + i * 0.137), Y(0.415), w * 0.12, h * 0.1, lit ? '#f6cf92' : '#4d3018');
      }
      // 窓わくの物
      if (S.f.phone || S.f.canBTied) s += `<rect x="${X(0.06)}" y="${Y(0.86)}" width="${w * 0.07}" height="${h * 0.11}" rx="2" fill="#b9c0c6"/>`;
      if (S.f.mirror) s += `<ellipse cx="${X(0.93)}" cy="${Y(0.86)}" rx="${w * 0.04}" ry="${h * 0.07}" fill="#cfe2ec" stroke="#e7a0b4" stroke-width="2"/>`;
      // カーテン
      if (!S.f.bCur) {
        const g = G.torchA(S) && S.aim === 'curtain';
        s += rect(x, y, w, h, g ? '#f4e6c8' : '#2b2722');
        for (let i = 0; i < 7; i++) s += rect(X(i / 7 + 0.03), y, w * 0.035, h, g ? '#e4d2ae' : '#221f1b');
        if (g) s += `<defs><radialGradient id="${pre}-cu"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${X(0.42)}" cy="${Y(0.5)}" rx="${w * 0.3}" ry="${h * 0.32}" fill="url(#${pre}-cu)"/>`;
      }
      s += `<rect class="fxwin" data-fx="b" x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" opacity="0"/>`;
      s += '</g>';
      return s;
    }
    if (of === 'a') {
      if (S.ended) {
        s += rect(x, y, w, h, '#e9dcc0') + rect(x, Y(0.8), w, h * 0.2, '#b7ad78') + rect(X(0.05), Y(0.2), w * 0.3, h * 0.6, '#ddd0b1');
        if (S.ending === 'stay') s += A.cat(X(0.6), Y(0.97), w / 260, 'curl');
        s += '</g></g>';
        return s;
      }
      const on = G.torchA(S);
      s += rect(x, y, w, h, on ? '#3b3a3e' : '#07090f');
      if (on) s += `<defs><radialGradient id="${pre}-tg" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#e9ecf5" stop-opacity=".55"/><stop offset="1" stop-color="#3b3a3e" stop-opacity="0"/></radialGradient></defs>${rect(x, y, w, h, `url(#${pre}-tg)`)}`;
      const sil = on ? '#5b5650' : '#121520';
      s += rect(X(0.04), Y(0.18), w * 0.24, h * 0.82, sil) + `<path d="M${X(0.16)} ${Y(0.18)}v${h * 0.82}" stroke="${on ? '#4a4540' : '#0c0e15'}" stroke-width="1.5"/>`;
      s += rect(X(0.66), Y(0.5), w * 0.3, h * 0.5, sil) + `<path d="M${X(0.7)} ${Y(0.5)}l${w * 0.05}-${h * 0.16}h${w * 0.08}" stroke="${sil}" stroke-width="3" fill="none"/>`;
      s += `<path d="M${X(0.5)} ${y}v${h * 0.07}" stroke="${sil}" stroke-width="2"/><ellipse cx="${X(0.5)}" cy="${Y(0.09)}" rx="${w * 0.12}" ry="${h * 0.025}" fill="none" stroke="${sil}" stroke-width="3"/>`;
      if (S.cat === 'a') s += A.cat(X(0.62), Y(0.97), w / 260, 'sit');
      s += '</g>';
      // 窓わく：蚊やりぶた・缶
      s += `<ellipse cx="${X(0.86)}" cy="${Y(0.93)}" rx="${w * 0.05}" ry="${h * 0.04}" fill="${on ? '#7d8a5f' : '#151a14'}"/>`;
      if (S.f.phone || S.f.canATied) s += `<rect x="${X(0.12)}" y="${Y(0.86)}" width="${w * 0.07}" height="${h * 0.11}" rx="2" fill="#b9c0c6"/>`;
      // 懐中電灯のまぶしさ（こちらを照らしているとき）
      if (on && S.aim && S.f.aCur && from === 'b') {
        const off = S.aim === 'tokei' ? -0.18 : 0;
        s += `<defs><radialGradient id="${pre}-gl"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".25" stop-color="#fffbe2" stop-opacity=".85"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>`
          + `<ellipse class="glare" cx="${X(0.5 + off)}" cy="${Y(0.8)}" rx="${w * (S.aim === 'tokei' ? 0.18 : 0.42)}" ry="${h * (S.aim === 'tokei' ? 0.16 : 0.38)}" fill="url(#${pre}-gl)"/>`
          + (S.aim !== 'tokei' ? `<path d="M${X(0.5)} ${Y(0.8)}m-${w * 0.55} 0h${w * 1.1}M${X(0.5)} ${Y(0.8)}m0 -${h * 0.4}v${h * 0.6}" stroke="#fff" stroke-width="1.2" opacity=".6"/>` : '');
      }
      if (!S.f.aCur) {
        s += rect(x, y, w, h, on ? '#4c5d78' : '#141a26');
        for (let i = 0; i < 7; i++) s += rect(X(i / 7 + 0.03), y, w * 0.035, h, on ? '#3f4e66' : '#10151f');
        if (on) s += rect(x, y, w, h, '#fff', 'opacity=".08"');
      }
      s += `<rect class="fxwin" data-fx="a" x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" opacity="0"/>`;
      s += '</g>';
      return s;
    }
    if (of === 'c') {
      const here = MD.others().c || MD.here === 'c';
      const lamp = S.f.cLamp;
      if (S.ended) { s += rect(x, y, w, h, '#d9cdb5') + rect(X(0.2), Y(0.25), w * 0.12, w * 0.12, '#bfae90', 'rx="20"') + '</g></g>'; return s; }
      s += rect(x, y, w, h, lamp ? '#5a3b1c' : here ? '#1a1712' : '#06070b');
      if (lamp) s += `<defs><radialGradient id="${pre}-lg" cx=".3" cy=".75" r=".8"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".9"/><stop offset="1" stop-color="#5a3b1c" stop-opacity="0"/></radialGradient></defs>${rect(x, y, w, h, `url(#${pre}-lg)`)}`;
      const c2 = lamp ? '#8a6a44' : '#0d0e13';
      for (const [u, v, r] of [[0.25, 0.3, 0.1], [0.55, 0.22, 0.07], [0.75, 0.4, 0.09], [0.45, 0.55, 0.06]]) s += `<circle cx="${X(u)}" cy="${Y(v)}" r="${w * r}" fill="${c2}"/>`;
      s += rect(X(0.85), Y(0.15), w * 0.12, h * 0.85, c2);
      s += '</g></g>';
      return s;
    }
    return s + '</g></g>';
  };

  /* ---- かご ---- */
  const basketG = (pre, S, x0, y0, s0, x1, y1, s1, id) => {
    if (!S.f.basket) return '';
    const p = G.basketPos(S, Date.now());
    const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p, sc = s0 + (s1 - s0) * p;
    const item = S.basket.item;
    const inside = item === 'cat' ? A.cat(0, -6, 0.45, 'sit') : item ? '<rect x="-6" y="-12" width="12" height="9" rx="2" fill="#e8d8b0"/>' : '';
    return `<g class="bk"${id ? ` data-h="${id}"` : ''} data-x0="${x0}" data-y0="${y0}" data-s0="${s0}" data-x1="${x1}" data-y1="${y1}" data-s1="${s1}" transform="translate(${x} ${y}) scale(${sc})">`
      + `${inside}<path d="M-12-14l-4-8M12-14l4-8" stroke="#d9d0bf" stroke-width="2"/><rect x="-14" y="-14" width="28" height="22" rx="4" fill="#3d7fa8" stroke="#1d4a66" stroke-width="1.5"/><rect x="-14" y="-11" width="28" height="4" fill="#e9c35a"/><circle cx="0" cy="0" r="4" fill="#f4efe4"/>`
      + `${id ? '<rect x="-26" y="-34" width="52" height="50" fill="transparent"/>' : ''}</g>`;
  };

  /* ---- 窓の外：ソウの窓から（イトの写真館と時計店） ---- */
  const BWIN = [154, 114, 212, 182]; // ソウから見たイトの窓ガラス
  A.viewA = (S, pre, layer) => {
    const back = () => {
      let s = sky(pre, S);
      // 写真館
      s += poly([[70, 30], [450, 30], [440, 54], [80, 54]], '#24272d') + `<path d="M80 40h360M78 47h364" stroke="#34383f" stroke-width="2"/>`;
      s += rect(90, 54, 340, 486, '#5f564b');
      for (let y = 66; y < 540; y += 14) s += `<path d="M90 ${y}h340" stroke="#544c42" stroke-width="1.5"/>`;
      s += rect(146, 106, 228, 198, '#3a2c20');
      s += A.interior(S, 'b', ...BWIN, pre + 'ib', 'a');
      s += rect(258, 114, 4, 182, '#3a2c20') + rect(154, 204, 212, 3, '#3a2c20');
      s += rect(140, 300, 240, 10, '#4a392a') + `<path d="M150 296h220" stroke="#8c9096" stroke-width="2"/>`;
      s += rect(130, 330, 260, 42, S.ended ? '#efe8d6' : '#3d3a33', 'rx="2"') + `<text x="260" y="360" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="22" letter-spacing="6" fill="${S.ended ? '#2b2b2b' : '#8d8778'}">ひかり写真館</text>`;
      s += rect(110, 384, 300, 156, '#43474d');
      for (let y = 392; y < 540; y += 10) s += `<path d="M110 ${y}h300" stroke="#383b40" stroke-width="2"/>`;
      // 時計店
      s += poly([[424, 52], [600, 52], [600, 72], [432, 72]], '#2b2620');
      s += rect(430, 72, 170, 468, '#4d463f');
      s += rect(462, 120, 104, 140, '#2e271f');
      s += A.interior(S, 'c', 468, 126, 92, 128, pre + 'ic', 'a');
      s += rect(512, 126, 3, 128, '#2e271f');
      s += `<g><circle cx="520" cy="296" r="19" fill="${S.ended ? '#f4f1ea' : '#bfbab0'}" stroke="#2b2620" stroke-width="3"/><path d="M520 296v-12M520 296l7 4" stroke="#2b2620" stroke-width="2.4" stroke-linecap="round"/></g>`;
      s += poly([[424, 328], [600, 328], [600, 352], [416, 358]], '#6a6c6f') + `<path d="M440 330l-6 26M470 330l-5 25M500 330l-4 24M530 330l-3 23M560 330l-2 23M590 330l-1 22" stroke="#55575a" stroke-width="2"/>`;
      s += rect(446, 362, 146, 30, '#2b2620', 'rx="2"') + `<text x="519" y="383" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="17" letter-spacing="4" fill="#8f877a">時田時計店</text>`;
      s += rect(432, 396, 168, 144, '#3c3e42');
      // 板と煮干し・ボタン
      if (S.f.bridge && !S.ended) s += poly([[360, 302], [370, 298], [438, 330], [430, 337]], '#b48a55');
      if (S.f.bait && S.cat === 'eave') s += `<path d="M424 327l8-2M418 324l7-2" stroke="#c9ccd1" stroke-width="2.5" stroke-linecap="round"/>`;
      const tokeiLit = S.aim === 'tokei' && G.torchA(S);
      if (S.cat === 'eave') s += `<g class="catx" data-x0="452" data-y0="330" data-x1="372" data-y1="300">${A.cat(452, 330, 0.62, S.f.catGo ? 'walk' : 'curl', { eyes: true, wet: true })}</g>`;
      // 光の円錐
      if (G.torchA(S) && S.aim && S.f.aCur && !S.ended) {
        const tg = { curtain: [260, 205], boxes: [205, 255], dresser: [330, 215], ceiling: [260, 130], glass: [260, 196], tokei: [460, 330] }[S.aim];
        s += `<defs><linearGradient id="${pre}-cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffbe6" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe6" stop-opacity=".12"/></linearGradient></defs>`
          + `<polygon points="${pt([[286, 520], [314, 520], [tg[0] + 44, tg[1] + 20], [tg[0] - 44, tg[1] - 20]])}" fill="url(#${pre}-cone)"/>`;
        if (S.aim === 'tokei') s += `<ellipse cx="465" cy="334" rx="62" ry="26" fill="#fff6d0" opacity=".35"/>`;
      }
      if (!tokeiLit && S.cat === 'eave' && !S.ended) s += rect(400, 296, 200, 76, '#05070c', 'opacity=".8"');
      // 糸とかご
      if (S.f.lineB >= 1 && !S.ended) s += S.f.lineB === 2 ? `<path d="M300 466L340 298" stroke="#e8e0cc" stroke-width="1.6"/>` : `<path d="M300 466Q330 420 340 300" stroke="#e8e0cc" stroke-width="1.3" fill="none"/>`;
      if (S.f.phone && !S.ended) s += `<path d="M200 490L176 296" stroke="#d9c9a8" stroke-width="1.1"/>`;
      if (S.ended && S.f.phone) s += `<path d="M200 490q-6 -20 -4 -40" stroke="#d9c9a8" stroke-width="1.1" fill="none"/>`;
      s += basketG(pre, S, 300, 452, 1.5, 340, 290, 0.55, 'va_basket');
      return s;
    };
    const front = () => {
      let s = '';
      // 風鈴（ソウの家の軒下）
      s += `<g class="sway" data-amp="22" data-ox="96" data-oy="0"><path d="M96 0v40" stroke="#ddd" stroke-width="1"/><path d="M84 52a12 12 0 0 1 24 0z" fill="#bfe3ef" opacity=".85"/><path d="M96 52v20" stroke="#ddd" stroke-width="1"/><rect x="90" y="72" width="12" height="26" fill="#f1e7c9"/></g>`;
      // 自分の窓わく
      s += rect(0, 0, 600, 16, '#4a321f') + rect(0, 0, 18, 540, '#4a321f') + rect(582, 0, 18, 540, '#4a321f');
      s += `<path d="M0 470h600" stroke="#9aa0a7" stroke-width="5"/><path d="M60 470v40M300 470v40M540 470v40" stroke="#80868d" stroke-width="4"/>`;
      s += rect(0, 496, 600, 44, '#5b3f27') + rect(0, 496, 600, 5, '#7a5739');
      if (S.f.phone || S.f.canATied) s += `<rect x="188" y="482" width="22" height="26" rx="3" fill="#b9c0c6" stroke="#7a8288"/>`;
      if (G.torchA(S) && S.aim && !S.ended) s += `<g transform="translate(300 506)"><rect x="-10" y="-8" width="20" height="26" rx="3" fill="#b44" /><ellipse cx="0" cy="-9" rx="13" ry="5" fill="#fff8d8"/></g>`;
      if (S.cat === 'a' && !S.ended) s += A.cat(420, 500, 1.1, 'sit');
      if (S.ended && S.ending === 'stay') s += A.cat(430, 502, 1.2, 'curl');
      // さわれる所
      if (!S.f.bCur && !S.ended) s += hsR('va_cur', 154, 114, 212, 182, 'イトの窓');
      else if (!S.ended) {
        s += hsR('va_ceiling', 154, 114, 212, 40, 'イトの部屋の天井') + hsR('va_boxes', 154, 200, 110, 96, 'イトの部屋の段ボールの山') + hsR('va_dresser', 280, 150, 86, 146, 'イトの部屋の鏡台');
        if (S.f.filmOn) s += hsR('va_glass', 164, 182, 192, 30, 'イトの窓のフィルム');
      }
      s += hsR('va_tokei', 410, 296, 190, 72, '時計屋さんのひさし') + hsR('va_cwin', 462, 120, 104, 140, '時計屋さんの二階の窓') + hsR('va_sign', 130, 330, 260, 42, '写真館の看板');
      s += hsR('va_frame', 18, 476, 564, 64, '物干しの手すりと窓わく');
      return s;
    };
    return layer === 'back' ? back() : front();
  };

  /* ---- 窓の外：イトの窓から（ソウの酒屋） ---- */
  const AWIN = [194, 114, 212, 182];
  A.viewB = (S, pre, layer) => {
    const back = () => {
      let s = sky(pre, S);
      s += poly([[90, 30], [490, 30], [480, 54], [100, 54]], '#26231f') + `<path d="M100 40h380M98 47h384" stroke="#36322c" stroke-width="2"/>`;
      s += rect(110, 54, 360, 486, '#55493c');
      for (let x = 122; x < 470; x += 16) s += `<path d="M${x} 54v270" stroke="#4b4035" stroke-width="1.5"/>`;
      s += rect(186, 106, 228, 198, '#33261a');
      s += A.interior(S, 'a', ...AWIN, pre + 'ia', 'b');
      s += rect(298, 114, 4, 182, '#33261a') + rect(194, 204, 212, 3, '#33261a');
      s += `<path d="M170 316h260M170 330h260" stroke="#8a9096" stroke-width="3"/><path d="M180 304v30M300 304v30M420 304v30" stroke="#7a8086" stroke-width="3"/>`;
      s += rect(150, 342, 300, 42, S.ended ? '#1d2c4c' : '#18202e', 'rx="2"') + `<text x="300" y="372" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="23" letter-spacing="7" fill="${S.ended ? '#f3efe6' : '#6f7684'}">みなもと酒店</text>`;
      s += rect(130, 392, 300, 148, '#42464c');
      for (let y = 400; y < 540; y += 10) s += `<path d="M130 ${y}h300" stroke="#373a3f" stroke-width="2"/>`;
      s += rect(436, 420, 60, 120, S.ended ? '#c9302c' : '#3a2322', 'rx="3"') + rect(444, 432, 44, 40, S.ended ? '#e9f2f6' : '#1b1c20');
      // 空き地の木と電線
      s += `<path d="M470 0q60 30 130 26" stroke="#1b1f2a" stroke-width="2" fill="none"/><path d="M470 10q60 32 130 30" stroke="#1b1f2a" stroke-width="2" fill="none"/>`;
      s += `<g class="sway" data-amp="9" data-ox="548" data-oy="540"><path d="M548 540V250" stroke="#2c241c" stroke-width="16"/><path d="M548 330l-30-40M548 300l26-36" stroke="#2c241c" stroke-width="7"/>`
        + `<ellipse cx="540" cy="220" rx="70" ry="80" fill="${S.ended ? '#5c8a4e' : '#18241c'}"/><ellipse cx="500" cy="270" rx="44" ry="40" fill="${S.ended ? '#4f7c43' : '#142019'}"/><ellipse cx="580" cy="270" rx="40" ry="44" fill="${S.ended ? '#4f7c43' : '#142019'}"/></g>`;
      // 糸とかご・糸電話
      if (S.f.lineB >= 1 && !S.ended) s += S.f.lineB === 2 ? `<path d="M300 470L300 318" stroke="#e8e0cc" stroke-width="1.6"/>` : `<path d="M300 318Q280 420 270 520" stroke="#e8e0cc" stroke-width="1.3" fill="none"/>`;
      if (S.f.phone && !S.ended) s += `<path d="M222 490L232 300" stroke="#d9c9a8" stroke-width="1.1"/>`;
      s += basketG(pre, S, 300, 306, 0.55, 300, 456, 1.5, 'vb_basket');
      return s;
    };
    const front = () => {
      let s = '';
      // 時計店のひさしのはし（左下）
      s += poly([[0, 452], [64, 452], [58, 470], [0, 474]], '#6a6c6f');
      if (S.f.bridge && !S.ended) s += poly([[30, 486], [96, 480], [96, 490], [24, 498]], '#b48a55');
      // 自分の窓わく（洋風の白）
      s += rect(0, 0, 600, 14, '#d9d1c3') + rect(0, 0, 16, 540, '#d9d1c3') + rect(584, 0, 16, 540, '#d9d1c3');
      s += `<path d="M16 474h568" stroke="#5f646b" stroke-width="4"/>`;
      s += rect(0, 498, 600, 42, '#e6dfd2') + rect(0, 498, 600, 4, '#fff');
      if (!S.f.bLock) s += `<g transform="translate(300 512)"><rect x="-16" y="-8" width="32" height="14" rx="3" fill="#a9a194" stroke="#7d766b"/><circle cx="0" cy="-1" r="3" fill="#5a544b"/></g>`;
      if (S.f.phone || S.f.canBTied) s += `<rect x="210" y="482" width="22" height="26" rx="3" fill="#b9c0c6" stroke="#7a8288"/>`;
      if (S.cat === 'b' && !S.ended && S.f.eye) s += A.cat(400, 502, 1.1, 'sit');
      // 手鏡（窓わくに立てかけた）
      if (S.f.mirror && !S.ended) s += A.mirror(S, pre);
      // さわれる所
      s += hsR('vb_awin', 186, 106, 228, 198, 'ソウの窓') + hsR('vb_sign', 150, 342, 300, 42, '酒屋の看板') + hsR('vb_tree', 470, 140, 130, 300, '空き地の木');
      s += hsR('vb_edge', 0, 440, 80, 40, '時計屋さんのひさしのはし');
      if (S.f.mirror && !S.ended) s += `<circle class="hs" data-h="vb_mirror" cx="118" cy="372" r="92" aria-label="手鏡"/>`;
      s += hsR('vb_frame', 140, 478, 444, 62, '窓わく');
      return s;
    };
    return layer === 'back' ? back() : front();
  };
  /* 手鏡の中：時計店のひさし（左右が逆） */
  A.mirror = (S, pre) => {
    const lit = S.aim === 'tokei' && G.torchA(S);
    let m = `<g><clipPath id="${pre}-mc"><circle cx="118" cy="372" r="84"/></clipPath><g clip-path="url(#${pre}-mc)">`;
    m += rect(30, 280, 180, 190, lit ? '#2d3340' : '#07080c');
    m += poly([[30, 400], [210, 370], [210, 410], [30, 456]], lit ? '#8a8c8f' : '#121316');
    for (let i = 0; i < 7; i++) m += `<path d="M${40 + i * 26} ${398 - i * 4}l4 ${40}" stroke="${lit ? '#6f7174' : '#0d0e10'}" stroke-width="2"/>`;
    m += `<circle cx="78" cy="330" r="22" fill="${lit ? '#d8d3c8' : '#141517'}" stroke="#2b2620" stroke-width="3"/><path d="M78 330v-13M78 330l-8 4" stroke="#2b2620" stroke-width="2.4"/>`;
    if (S.f.bridge) m += poly([[150, 384], [214, 404], [214, 414], [146, 392]], lit ? '#b48a55' : '#1a140c');
    if (S.f.bait && S.cat === 'eave') m += `<path d="M150 388l9 3M156 393l8 3" stroke="${lit ? '#c9ccd1' : '#222'}" stroke-width="3" stroke-linecap="round"/>`;
    if (S.cat === 'eave') m += `<g class="catx" data-x0="108" data-y0="396" data-x1="200" data-y1="404">${lit ? A.cat(108, 396, 1.05, S.f.catGo ? 'walk' : 'curl', { eyes: true, wet: true }) : `<g transform="translate(108 396)"><circle cx="-14" cy="-6" r="1.8" fill="#ffe27a" style="opacity:calc(.25 + var(--flash, 0))"/><circle cx="-8" cy="-6" r="1.8" fill="#ffe27a" style="opacity:calc(.25 + var(--flash, 0))"/></g>`}</g>`;
    if (lit) m += `<ellipse cx="96" cy="390" rx="90" ry="50" fill="#fff6d0" opacity=".22"/>`;
    m += `<ellipse cx="80" cy="320" rx="40" ry="18" fill="#fff" opacity=".12" transform="rotate(-30 80 320)"/></g></g>`;
    m += `<circle cx="118" cy="372" r="88" fill="none" stroke="#e7a0b4" stroke-width="9"/><path d="M178 436l40 50" stroke="#e7a0b4" stroke-width="16" stroke-linecap="round"/>`;
    return m;
  };

  /* ---- 窓の外：時計店の二階から ---- */
  A.viewC = (S, pre, layer) => {
    if (layer === 'back') {
      let s = sky(pre, S);
      s += poly([[0, 34], [340, 34], [330, 56], [0, 56]], '#26231f');
      s += rect(0, 56, 330, 484, '#55493c');
      s += rect(52, 102, 226, 206, '#33261a');
      s += A.interior(S, 'a', 60, 110, 210, 190, pre + 'ia', 'b');
      s += rect(163, 110, 4, 190, '#33261a');
      s += `<path d="M40 322h250M40 336h250" stroke="#8a9096" stroke-width="3"/>`;
      s += rect(30, 350, 280, 40, '#18202e', 'rx="2"') + `<text x="170" y="378" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="21" letter-spacing="6" fill="#6f7684">みなもと酒店</text>`;
      s += `<g class="sway" data-amp="9" data-ox="470" data-oy="540"><path d="M470 540V260" stroke="#2c241c" stroke-width="16"/><ellipse cx="462" cy="226" rx="80" ry="84" fill="${S.ended ? '#5c8a4e' : '#18241c'}"/></g>`;
      if (S.f.lineB === 2 && !S.ended) s += `<path d="M190 322L600 470" stroke="#e8e0cc" stroke-width="1.6"/>`;
      s += basketG(pre, S, 196, 316, 0.6, 640, 480, 1.4);
      return s;
    }
    let s = rect(0, 0, 600, 18, '#3a2a1a') + rect(0, 0, 20, 540, '#3a2a1a') + rect(580, 0, 20, 540, '#3a2a1a') + rect(0, 494, 600, 46, '#4a3522');
    s += `<path d="M300 18v476" stroke="#3a2a1a" stroke-width="6"/>`;
    s += hsR('vc_awin', 52, 102, 226, 206, 'ソウの窓') + hsR('vc_line', 300, 330, 300, 140, '糸');
    return s;
  };

  /* ---- 部屋：ソウ ---- */
  A.roomA = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    let s = '';
    s += poly([[0, 0], [600, 0], [490, 70], [110, 70]], '#6e5a40') + [140, 220, 300, 380, 460].map((x) => `<path d="M${x} 0L${110 + (x / 600) * 380} 70" stroke="#5f4d36" stroke-width="2"/>`).join('');
    s += poly([[0, 0], [110, 70], [110, 350], [0, 540]], '#b9a47d') + poly([[600, 0], [490, 70], [490, 350], [600, 540]], '#b29d77');
    s += rect(110, 70, 380, 280, '#cbb894') + rect(110, 90, 380, 9, '#6b4a2c') + rect(110, 342, 380, 8, '#5a3f26');
    s += poly([[110, 350], [490, 350], [600, 540], [0, 540]], '#b8af78');
    for (const xb of [173, 300, 427]) { const xf = 300 + (xb - 300) * 2.267; s += `<path d="M${xb} 350L${xf} 540" stroke="#4d5b3a" stroke-width="4"/>`; }
    s += `<path d="M86 400H514M40 470H560" stroke="#4d5b3a" stroke-width="4"/>`;
    s += rect(104, 70, 7, 280, '#7a5534') + rect(489, 70, 7, 280, '#7a5534');
    // 蛍光灯
    s += `<path d="M300 0v38" stroke="#333" stroke-width="2"/><ellipse cx="300" cy="46" rx="46" ry="9" fill="none" stroke="#e7e3d8" stroke-width="5"/>`;
    // 押し入れ（左の壁）
    s += poly([[22, 72], [98, 96], [98, 372], [22, 486]], '#4a3524') + poly([[26, 78], [58, 88], [58, 425], [26, 478]], '#e6d9bd') + poly([[62, 89], [94, 99], [94, 370], [62, 420]], '#e6d9bd');
    s += `<path d="M30 200q12 -10 24 2M66 190q12 -8 24 2M30 330q12-8 24 0" stroke="#d3c4a3" stroke-width="2" fill="none"/><ellipse cx="54" cy="270" rx="3" ry="6" fill="#6b5236"/><ellipse cx="66" cy="262" rx="3" ry="6" fill="#6b5236"/>`;
    // 窓
    s += rect(268, 108, 184, 160, '#5e4128');
    s += `<svg x="276" y="116" width="168" height="142" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewA(S, pre + 'w', 'back')}</svg>`;
    s += rect(358, 116, 5, 142, '#5e4128') + rect(276, 186, 168, 3, '#5e4128');
    s += `<rect class="raincv" data-r="276,116,168,142" x="276" y="116" width="168" height="142" fill="none"/>`;
    s += rect(258, 262, 204, 12, '#7a5636') + rect(258, 262, 204, 3, '#94704c');
    // 蚊やりぶた・マッチ
    s += `<g transform="translate(428 252)"><ellipse cx="0" cy="0" rx="17" ry="12" fill="#7d8a5f"/><ellipse cx="15" cy="0" rx="5" ry="7" fill="#6b774f"/><circle cx="16" cy="0" r="2.4" fill="#333"/><path d="M-12-9l-3-5M-4-11l0-5" stroke="#6b774f" stroke-width="3"/></g>`;
    if (!S.f.matchesTaken) s += rect(398, 254, 14, 8, '#d24b3c') + rect(398, 254, 14, 3, '#f0e2c4');
    if (S.f.phone || S.f.canATied) s += `<g><rect x="286" y="244" width="16" height="18" rx="2" fill="#b9c0c6" stroke="#7a8288"/><path d="M294 244L330 200" stroke="#e8e0cc" stroke-width="1"/></g>`;
    if (S.cat === 'a' && !S.ended) s += A.cat(382, 262, 0.75, 'sit');
    if (S.ended && S.ending === 'stay') s += A.cat(382, 262, 0.75, 'curl');
    // カーテン
    s += `<path d="M248 102h224" stroke="#3a2c20" stroke-width="4"/>`;
    if (!S.f.aCur) {
      s += rect(258, 104, 102, 166, '#4f6380') + rect(360, 104, 102, 166, '#4c607c');
      for (let x = 266; x < 460; x += 16) s += rect(x, 104, 6, 166, '#43566f');
    } else {
      s += `<path d="M250 104h34l-4 166h-30z" fill="#4f6380"/><path d="M436 104h34v166h-30z" fill="#4c607c"/><path d="M262 104v166M272 104v166M448 104v166M458 104v166" stroke="#43566f" stroke-width="4"/>`;
    }
    // 机
    s += rect(126, 150, 132, 112, '#7c5431') + rect(126, 194, 132, 6, '#6a4628');
    const books = ['#c0504d', '#4f81bd', '#9bbb59', '#e8c547', '#8064a2', '#f79646', '#4bacc6', '#c0504d'];
    books.forEach((c, i) => { s += rect(134 + i * 14, 160 - (i % 3) * 3, 11, 34 + (i % 3) * 3, c); });
    s += rect(132, 204, 60, 8, '#e3dccb');
    s += poly([[118, 262], [266, 262], [272, 274], [112, 274]], '#9a6b3e') + rect(112, 274, 160, 7, '#7d532e');
    s += rect(118, 281, 10, 69, '#7d532e') + rect(212, 281, 54, 66, '#8a5d34');
    for (const y of [302, 324]) s += `<path d="M214 ${y}h50" stroke="#6b4426" stroke-width="2"/>`;
    for (const y of [292, 313, 336]) s += `<circle cx="239" cy="${y}" r="2.5" fill="#d9b67a"/>`;
    // ラジオ
    s += rect(136, 234, 50, 28, '#3b3f45', 'rx="4"') + `<circle cx="150" cy="248" r="9" fill="#2a2d31"/><circle cx="150" cy="248" r="6" fill="none" stroke="#45494f" stroke-width="2"/>`;
    s += `<rect x="164" y="240" width="18" height="9" fill="${S.f.radioOff ? '#2a2d31' : '#ffcf73'}" ${S.f.radioOff ? '' : 'class="dial"'}/><path d="M146 234l-10-16" stroke="#888" stroke-width="1.5"/>`;
    // 目覚まし
    s += `<g transform="translate(209 249)"><circle cx="-7" cy="-12" r="5" fill="#c9302c"/><circle cx="7" cy="-12" r="5" fill="#c9302c"/><circle r="11" fill="#c9302c"/><circle r="8.5" fill="#f6f1e6"/><path d="M0 0v-6M0 0l4 2" stroke="#222" stroke-width="1.4"/><path d="M-7 10l-3 4M7 10l3 4" stroke="#7a1d1b" stroke-width="2"/></g>`;
    // 本棚と貯金箱
    s += rect(468, 258, 110, 134, '#7d5634') + poly([[462, 252], [584, 252], [578, 258], [468, 258]], '#916640');
    for (const y of [300, 346]) s += rect(468, y, 110, 5, '#6a4628');
    ['#4f81bd', '#c0504d', '#e8c547', '#9bbb59', '#2c4c74', '#8064a2', '#f79646'].forEach((c, i) => { s += rect(474 + i * 14, 266 + (i % 2) * 4, 11, 34 - (i % 2) * 4, c) + rect(474 + i * 14, 312, 11, 34, books[(i + 3) % 8]); });
    s += `<g transform="translate(503 241)"><ellipse rx="15" ry="11" fill="#eba8ab"/><ellipse cx="13" cy="1" rx="4" ry="5" fill="#de9497"/><path d="M-8-9l-3-5 6 2zM2-10l2-5 3 5z" fill="#de9497"/><rect x="-4" y="-12" width="8" height="2" fill="#7a4a4c"/><path d="M-9 9v4M7 9v4" stroke="#de9497" stroke-width="3"/></g>`;
    // カレンダー（右の壁）
    s += poly([[512, 118], [556, 100], [556, 178], [512, 190]], '#f3efe4') + poly([[512, 118], [556, 100], [556, 112], [512, 128]], '#c0504d');
    for (let i = 0; i < 4; i++) s += `<path d="M516 ${140 + i * 12}L552 ${126 + i * 12}" stroke="#bbb" stroke-width="1"/>`;
    s += `<path d="M538 166l10-4M540 160l8 6" stroke="#333" stroke-width="2"/>`;
    // 時間割
    s += rect(458, 116, 26, 40, '#f3efe4') + `<path d="M461 124h20M461 132h20M461 140h20M461 148h20" stroke="#b8b0a0" stroke-width="1"/>`;
    // ふとん
    s += `<g><ellipse cx="62" cy="496" rx="22" ry="30" fill="#e8d9c0"/><path d="M62 466L200 470L206 528L62 526z" fill="#c6544a"/>${[90, 120, 150, 180].map((x) => `<path d="M${x} 467v60" stroke="#e8d9c0" stroke-width="7"/>`).join('')}<ellipse cx="204" cy="499" rx="14" ry="29" fill="#b4473e"/></g>`;
    // 暗さ
    if (!lit) {
      const holes = [];
      let lv = 0.95;
      if (G.torchA(S)) { lv = 0.5; holes.push([300, 320, 330, 280, 1]); }
      else if (!S.f.radioOff) holes.push([160, 248, 70, 48, 0.7]);
      if (S.f.eye) { lv = Math.min(lv, 0.75); holes.push([360, 190, 140, 120, 0.8]); }
      holes.push([360, 187, 90, 80, 0.45]);
      s += dark(pre, lv, holes);
    }
    // さわれる所
    if (S.f.aCur) { s += hsR('a_win', 276, 116, 168, 142, '窓') + hsR('a_cur', 248, 104, 28, 166, 'カーテン') + hsR('a_cur', 444, 104, 28, 166, 'カーテン'); }
    else s += hsR('a_cur', 258, 104, 204, 166, 'カーテン');
    s += hsR('a_kayari', 396, 236, 54, 30, '蚊やりぶた');
    if (S.f.phone || S.f.canATied) s += hsR('a_phone', 282, 238, 26, 28, '糸電話の缶');
    if (S.cat === 'a' && !S.ended) s += hsR('a_cat', 362, 226, 40, 40, 'ボタン');
    s += hsR('a_radio', 132, 216, 56, 48, 'ラジオ') + hsR('a_clock', 194, 230, 32, 34, '目覚まし時計') + hsR('a_drawer', 210, 278, 58, 72, '机の引き出し');
    s += hsP('a_oshi', [[22, 72], [98, 96], [98, 372], [22, 486]], '押し入れ');
    s += hsR('a_bank', 484, 226, 40, 30, '貯金箱') + hsR('a_shelf', 468, 258, 110, 134, '本棚') + hsP('a_cal', [[512, 118], [556, 100], [556, 178], [512, 190]], 'カレンダー');
    s += hsR('a_futon', 40, 462, 182, 72, 'ふとん');
    return s;
  };

  /* ---- 部屋：イト ---- */
  const BOXES = {
    kit: { f: [34, 388, 134, 82], d: 12, c: '#c89a5e', label: 'だいどころ' },
    boo: { f: [50, 318, 106, 58], d: 10, c: '#c39457', label: 'ほん', on: 'kit' },
    pho: { f: [176, 404, 110, 66], d: 10, c: '#c69a60', label: 'しゃしん' },
    ito: { f: [192, 344, 78, 50], d: 8, c: '#cfa36a', label: 'いと たからもの', on: 'pho' },
  };
  const box = (k, S) => {
    const B = BOXES[k], [x, y, w, h] = B.f, d = B.d;
    if (S.f['flat_' + k]) return '';
    const open = S.f['box_' + k];
    let s = rect(x, y, w, h, B.c) + poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], '#a87d48');
    if (!open) {
      s += poly([[x, y], [x + w, y], [x + w + d, y - d], [x + d, y - d]], '#d8ad72');
      s += rect(x + w / 2 - 7, y - d, 14, h + d, '#b98b4f', 'opacity=".55"') + rect(x, y + h / 2 - 6, w, 12, '#b98b4f', 'opacity=".5"');
    } else {
      s += poly([[x, y], [x + w, y], [x + w + d, y - d], [x + d, y - d]], '#4a3420');
      s += poly([[x, y], [x + w * 0.5, y], [x + w * 0.42, y - 26], [x - 8, y - 20]], '#d8ad72') + poly([[x + w * 0.5, y], [x + w, y], [x + w + 14, y - 22], [x + w * 0.56, y - 28]], '#cda065');
    }
    s += `<text x="${x + 8}" y="${y + h - 10}" font-family="'Tsukimi Rounded', sans-serif" font-size="${k === 'ito' ? 10 : 13}" font-weight="700" fill="#2a2a2a" opacity=".85">${B.label}</text>`;
    if (k === 'ito' && !open) s += `<text x="${x + 10}" y="${y + 16}" font-family="'Tsukimi Rounded', sans-serif" font-size="9" fill="#c0392b">あけるな！</text>`;
    return s;
  };
  A.roomB = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    const end = S.ended;
    let s = '';
    s += poly([[0, 0], [600, 0], [490, 70], [110, 70]], '#a8a49c');
    s += poly([[0, 0], [110, 70], [110, 350], [0, 540]], '#cdbca2') + poly([[600, 0], [490, 70], [490, 350], [600, 540]], '#c6b498');
    s += `<defs><pattern id="${pre}-wp" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#d8c7ae"/><circle cx="9" cy="9" r="1.6" fill="#c9b596"/></pattern></defs>`;
    s += rect(110, 70, 380, 280, `url(#${pre}-wp)`) + rect(110, 342, 380, 8, '#8d6a48');
    for (const [x, y, w, h] of [[360, 92, 46, 36], [420, 86, 40, 52], [118, 120, 22, 30], [470, 150, 16, 22]]) s += rect(x, y, w, h, '#e7dac4');
    s += poly([[110, 350], [490, 350], [600, 540], [0, 540]], '#9b7350');
    for (const xb of [150, 205, 260, 315, 370, 425]) { const xf = 300 + (xb - 300) * 2.267; s += `<path d="M${xb} 350L${xf} 540" stroke="#8a6444" stroke-width="2"/>`; }
    s += `<path d="M300 0v30" stroke="#666" stroke-width="2"/><path d="M276 44l10-14h28l10 14z" fill="#e9e2d6"/>`;
    // 窓
    s += rect(148, 108, 184, 160, '#e9e2d4');
    s += `<svg x="156" y="116" width="168" height="142" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewB(S, pre + 'w', 'back')}</svg>`;
    s += rect(238, 116, 5, 142, '#e9e2d4') + rect(156, 186, 168, 3, '#e9e2d4');
    s += `<rect class="raincv" data-r="156,116,168,142" x="156" y="116" width="168" height="142" fill="none"/>`;
    if (end) s += `<text transform="translate(240 200) scale(-1 1)" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="30" fill="#fff" opacity=".85">またね</text>` + rect(156, 116, 168, 142, '#eef4f6', 'opacity=".25"');
    if (S.f.filmOn && !end) {
      const lt = S.aim === 'glass' && G.torchA(S);
      s += rect(168, 174, 144, 26, lt ? '#e2a25c' : '#4a2d16', 'opacity=".95"');
      for (let i = 0; i < 6; i++) s += rect(171 + i * 23.5, 178, 20, 18, lt ? '#f7d49b' : '#5d3a1d');
      s += rect(168, 172, 10, 30, '#c9b48a', 'opacity=".8"') + rect(302, 172, 10, 30, '#c9b48a', 'opacity=".8"');
    }
    s += rect(140, 262, 200, 12, '#efe9dd') + rect(140, 262, 200, 3, '#fff');
    if (!S.f.canTaken && !end) s += `<g transform="translate(298 252)"><ellipse cx="0" cy="8" rx="13" ry="4" fill="#2e5d82"/><rect x="-13" y="-4" width="26" height="12" fill="#3d7fa8"/><ellipse cx="0" cy="-4" rx="13" ry="4" fill="#5a9cc4"/><circle cx="0" cy="2" r="3" fill="#f4efe4"/></g>`;
    if ((S.f.phone || S.f.canBTied) && !end) s += `<g><rect x="168" y="244" width="16" height="18" rx="2" fill="#b9c0c6" stroke="#7a8288"/><path d="M176 244L210 196" stroke="#e8e0cc" stroke-width="1"/></g>`;
    if (S.f.mirror && !end) s += `<g transform="translate(320 240)"><ellipse rx="9" ry="13" fill="#cfe2ec" stroke="#e7a0b4" stroke-width="3"/></g>`;
    if (S.f.bridge && !end) s += poly([[156, 252], [176, 250], [176, 262], [150, 264]], '#b48a55');
    if (S.f.lineB === 2 && !end) s += `<path d="M240 262L250 236" stroke="#e8e0cc" stroke-width="1.5"/>`;
    if (end && S.f.lineB === 2) s += `<path d="M228 266q4 14 -2 24" stroke="#e8e0cc" stroke-width="1.5" fill="none"/>`;
    // カーテン
    s += `<path d="M128 102h224" stroke="#8d7a62" stroke-width="4"/>`;
    if (!end) {
      if (!S.f.bCur) {
        const g = G.torchA(S) && S.aim === 'curtain';
        s += rect(138, 104, 102, 166, '#e9dcc4') + rect(240, 104, 102, 166, '#e6d8be');
        for (let x = 146; x < 340; x += 16) s += rect(x, 104, 5, 166, '#dccdb0');
        for (let i = 0; i < 22; i++) s += `<circle cx="${148 + (i * 37) % 186}" cy="${120 + (i * 53) % 140}" r="2.6" fill="#e3a3a8"/>`;
        if (g) s += `<defs><radialGradient id="${pre}-cg"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="236" cy="188" rx="90" ry="80" fill="url(#${pre}-cg)"/>`;
      } else s += `<path d="M130 104h34l-4 166h-30z" fill="#e9dcc4"/><path d="M316 104h34v166h-30z" fill="#e6d8be"/><path d="M142 104v166M152 104v166M328 104v166M338 104v166" stroke="#dccdb0" stroke-width="4"/>`;
      if (!S.f.pinsTaken) s += `<g><path d="M346 104v10l-12 8h24z" stroke="#7a7066" stroke-width="2" fill="none"/>${[338, 346, 354].map((x, i) => `<rect x="${x - 2}" y="122" width="5" height="14" fill="${['#e87a7a', '#7ab8e8', '#f0d36a'][i]}"/>`).join('')}</g>`;
    }
    // 鏡台
    if (!end) {
      s += rect(372, 236, 96, 110, '#a7724a') + poly([[366, 232], [474, 232], [468, 238], [372, 238]], '#b98257');
      for (const y of [262, 290, 318]) s += `<path d="M376 ${y}h88" stroke="#8a5c38" stroke-width="2"/>`;
      for (const y of [250, 276, 304, 332]) s += `<circle cx="420" cy="${y}" r="2.5" fill="#e3c38a"/>`;
      s += `<ellipse cx="420" cy="188" rx="32" ry="42" fill="#7b5232"/><ellipse cx="420" cy="188" rx="26" ry="36" fill="#9fb4c0"/><path d="M406 166q8 -10 18 -8" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/><path d="M410 230v6M430 230v6" stroke="#7b5232" stroke-width="4"/>`;
    }
    // ドア（右の壁）と鍵
    s += poly([[512, 96], [568, 66], [568, 448], [512, 390]], '#8c6a4a') + poly([[518, 104], [562, 80], [562, 230], [518, 240]], '#7d5d40') + poly([[518, 262], [562, 254], [562, 430], [518, 382]], '#7d5d40') + `<circle cx="524" cy="252" r="4" fill="#d9b67a"/>`;
    s += `<path d="M500 206a3 3 0 1 1 0.1 0" stroke="#999" stroke-width="2" fill="none"/>`;
    if (!S.f.keyTaken && !end) s += `<g transform="translate(500 214)"><path d="M0-4v6" stroke="#bbb" stroke-width="1.5"/><circle cy="6" r="3.5" fill="none" stroke="#d9c06a" stroke-width="2"/><path d="M0 9v10l3 2M0 16h3" stroke="#d9c06a" stroke-width="2"/></g>`;
    // 段ボール
    if (!end) {
      s += box('kit', S) + box('pho', S) + box('boo', S) + box('ito', S);
      if (!S.f.cameraTaken) s += `<g transform="translate(100 302)"><rect x="-20" y="-10" width="40" height="22" rx="3" fill="#2a2a2e"/><rect x="-16" y="-14" width="12" height="5" fill="#2a2a2e"/><circle cx="2" cy="1" r="8" fill="#55595f"/><circle cx="2" cy="1" r="4.5" fill="#1b1d22"/><rect x="10" y="-7" width="7" height="4" fill="#d9e2e8"/></g>`;
    }
    // ベッド
    if (!end) {
      s += poly([[352, 414], [600, 404], [600, 540], [322, 540]], '#d9d2c2');
      for (let i = 0; i < 9; i++) s += `<path d="M${370 + i * 28} 412L${348 + i * 32} 540" stroke="#c3baa6" stroke-width="5"/>`;
      s += poly([[352, 414], [600, 404], [600, 396], [356, 404]], '#8b6a4a');
      if (!S.f.sheetTaken) s += poly([[436, 426], [520, 422], [524, 446], [432, 452]], '#f8f6f0') + `<path d="M436 436l86-3" stroke="#e0ddd4" stroke-width="2"/>`;
      if (S.cat === 'b') s += A.cat(478, 444, 0.9, 'curl');
    }
    // ランタン
    if (S.f.lantern && !end) {
      s += `<g transform="translate(318 452)"><rect x="-12" y="-26" width="24" height="30" rx="5" fill="#cfe0e6" opacity=".55" stroke="#9fb6bf"/><rect x="-4" y="-16" width="8" height="18" fill="#f3ead2"/>`
        + (S.f.candle ? `<path class="flame" d="M0-30q6 8 0 13q-6-5 0-13z" fill="#ffcf5a"/>` : '<path d="M0-18v-4" stroke="#333" stroke-width="1.5"/>') + '</g>';
    }
    // スクリーン（シーツ）
    if (S.f.screen && !end) {
      const show = lens(S) && !S.f.candle;
      s += `<path d="M156 300L406 292" stroke="#ddd" stroke-width="1.5"/><path d="M220 298h176l-6 116q-80 10 -166 0z" fill="${show ? '#d8d2c6' : '#f2eee6'}" opacity="${show ? 0.97 : 0.9}"/>`;
      if (show) s += A.projOn(S, 228, 304, 160, 104, pre + 'pb', 'b');
    }
    // 朝：がらんとした部屋
    if (end) {
      s += `<polygon points="${pt([[156, 258], [324, 258], [420, 540], [60, 540]])}" fill="#fff4d6" opacity=".35"/>`;
      s += rect(420, 330, 40, 6, '#b08a62', 'opacity=".4"');
    }
    // 暗さ
    if (!lit) {
      const holes = [];
      let lv = 0.96;
      if (S.f.candle) { lv = 0.32; holes.push([318, 430, 300, 240, 1]); }
      else if (G.has(S, 'b', 'torch')) { lv = 0.4; holes.push([300, 300, 320, 260, 1]); }
      else if (G.beamIn(S)) {
        holes.push([240, 190, 120, 100, 0.9]);
        if (S.aim === 'boxes') holes.push([120, 360, 150, 120, 1]);
        if (S.aim === 'dresser') holes.push([420, 250, 90, 130, 1]);
        if (S.aim === 'ceiling') { lv = 0.8; holes.push([300, 60, 300, 90, 0.9], [300, 330, 330, 240, 0.4]); }
        if (S.aim === 'glass') holes.push([300, 350, 140, 110, 0.6]);
      } else if (G.torchA(S) && S.aim === 'curtain' && !S.f.bCur) holes.push([240, 188, 110, 100, 0.85]);
      if (S.f.eye && !S.f.candle) { lv = Math.min(lv, 0.8); holes.push([240, 188, 130, 110, 0.8]); }
      s += dark(pre, lv, holes);
      if (S.f.candle) s += `<rect width="600" height="540" fill="#ff9a3c" opacity=".08" style="mix-blend-mode:multiply"/>`;
      // 光の筋（ソウの懐中電灯）
      if (G.beamIn(S)) {
        const tg = { boxes: [110, 330], dresser: [420, 260], ceiling: [300, 40], glass: [300, 350] }[S.aim];
        s += `<polygon points="${pt([[226, 170], [254, 170], [tg[0] + 50, tg[1] + 40], [tg[0] - 50, tg[1] - 30]])}" fill="#fffbe6" opacity=".12"/>`;
      }
    }
    if (S.f.lineB === 1 && !end) s += `<g transform="translate(246 366)" class="glint"><path d="M-30 4q20-14 40 0t30-4" stroke="#e8e0cc" stroke-width="1.5" fill="none"/>${[0, 6, 12].map((d) => `<circle cx="${18 + d}" cy="${2 - d / 4}" r="4" fill="#d6b04a" stroke="#9c7c2a"/>`).join('')}</g>`;
    // さわれる所
    if (!end) {
      if (S.f.bCur) s += hsR('b_win', 156, 116, 168, 142, '窓') + hsR('b_cur', 128, 104, 28, 166, 'カーテン') + hsR('b_cur', 324, 104, 28, 166, 'カーテン');
      else s += hsR('b_cur', 138, 104, 204, 166, 'カーテン');
      if (!S.f.pinsTaken) s += hsR('b_pins', 330, 104, 32, 40, '洗濯ばさみ');
      if (!S.f.canTaken) s += hsR('b_can', 282, 238, 32, 28, 'お菓子の缶');
      if (S.f.phone || S.f.canBTied) s += hsR('b_phone', 162, 236, 28, 30, '糸電話の缶');
      s += hsR('b_dresser', 368, 144, 104, 202, '鏡台') + hsP('b_door', [[496, 96], [568, 66], [568, 448], [496, 390]], 'ドア');
      s += hsR('b_bed', 340, 400, 260, 140, 'ベッド');
      if (S.f.screen) s += hsR('b_screen', 220, 296, 176, 120, 'シーツのスクリーン');
      if (S.f.lantern) s += hsR('b_lantern', 298, 414, 40, 50, 'ランタン');
      for (const k of ['kit', 'pho', 'boo', 'ito']) {
        if (S.f['flat_' + k]) continue;
        const B = BOXES[k], [x, y, w, h] = B.f, d = B.d;
        s += hsP({ kit: 'b_box1', pho: 'b_box2', boo: 'b_box3', ito: 'b_box4' }[k], [[x, y + h], [x, y - d], [x + d, y - d - (S.f['box_' + k] ? 20 : 0)], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], `段ボール「${B.label}」`);
      }
      if (!S.f.cameraTaken) s += hsR('b_camera', 76, 286, 50, 30, 'カメラ');
      if (S.f.lineB === 1) s += hsR('b_string', 210, 344, 80, 40, '五円玉の糸');
      if (S.cat === 'b') s += hsR('b_cat', 446, 418, 70, 40, 'ボタン');
    }
    return s;
  };

  /* ---- 部屋：時計店の二階 ---- */
  A.roomC = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    let s = '';
    s += poly([[0, 0], [600, 0], [490, 70], [110, 70]], '#3b2c1e');
    s += poly([[0, 0], [110, 70], [110, 350], [0, 540]], '#4a3828') + poly([[600, 0], [490, 70], [490, 350], [600, 540]], '#46352a');
    s += rect(110, 70, 380, 280, '#55402c') + poly([[110, 350], [490, 350], [600, 540], [0, 540]], '#6b5038');
    for (const xb of [170, 240, 300, 360, 430]) { const xf = 300 + (xb - 300) * 2.267; s += `<path d="M${xb} 350L${xf} 540" stroke="#5c432e" stroke-width="2"/>`; }
    // 窓
    s += rect(130, 104, 172, 160, '#3a2a1a');
    s += `<svg x="138" y="112" width="156" height="144" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewC(S, pre + 'w', 'back')}</svg>`;
    s += rect(214, 112, 4, 144, '#3a2a1a') + `<rect class="raincv" data-r="138,112,156,144" x="138" y="112" width="156" height="144" fill="none"/>`;
    // 壁の時計
    for (const [x, y, r, sq] of [[340, 110, 18, 0], [390, 100, 13, 1], [338, 168, 12, 1], [384, 160, 22, 0], [338, 222, 16, 0], [392, 226, 12, 1]]) {
      s += sq ? rect(x - r, y - r, r * 2, r * 2.4, '#6b4a2c') + `<circle cx="${x}" cy="${y}" r="${r * 0.75}" fill="#ece4d2"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b4a2c"/><circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="#ece4d2"/>`;
      s += `<path d="M${x} ${y}v-${r * 0.55}M${x} ${y}l${r * 0.4} ${r * 0.2}" stroke="#222" stroke-width="1.4"/>`;
    }
    // 柱時計
    s += rect(430, 104, 52, 240, '#4a2f1a') + `<circle cx="456" cy="146" r="21" fill="#efe6d2" stroke="#2d1d10" stroke-width="3"/>`;
    const mm = S.f.cSet ? (S.time + 22 * 60) % 720 : 3 * 60 + 12;
    const ha = ((mm / 60) % 12) * 30, ma = (mm % 60) * 6;
    s += `<path d="M456 146l${(9 * Math.sin(ha * Math.PI / 180)).toFixed(1)} ${(-9 * Math.cos(ha * Math.PI / 180)).toFixed(1)}M456 146l${(15 * Math.sin(ma * Math.PI / 180)).toFixed(1)} ${(-15 * Math.cos(ma * Math.PI / 180)).toFixed(1)}" stroke="#222" stroke-width="2" stroke-linecap="round"/>`;
    s += rect(442, 186, 28, 120, '#2a1a0e') + `<g class="${S.f.cWound ? 'pend' : ''}" style="transform-origin:456px 190px"><path d="M456 190v80" stroke="#c9a85a" stroke-width="2"/><circle cx="456" cy="278" r="9" fill="#d9b85e"/></g>`;
    // 棚と小箱（左の壁）
    s += poly([[16, 182], [100, 168], [100, 176], [16, 192]], '#3a2a1a') + poly([[30, 150], [86, 140], [86, 170], [30, 182]], '#b5834a') + `<text x="36" y="168" font-size="8" fill="#3a2a1a" transform="rotate(-9 36 168)">ソウとイトへ</text>`;
    if (S.f.cBox) s += poly([[30, 150], [86, 140], [80, 120], [26, 130]], '#c99558');
    // 作業台
    s += poly([[150, 330], [470, 330], [500, 362], [120, 362]], '#7a5a3c') + rect(120, 362, 380, 56, '#5f442c') + rect(256, 372, 100, 30, '#4e3824') + `<circle cx="306" cy="387" r="3" fill="#c9a85a"/>`;
    s += rect(130, 418, 12, 80, '#5f442c') + rect(478, 418, 12, 80, '#5f442c');
    s += `<g transform="translate(200 320)"><ellipse cx="0" cy="8" rx="16" ry="5" fill="#8a6a2a"/><rect x="-10" y="-6" width="20" height="14" fill="#a9852f"/><path d="M-8-6q-4-24 8-34q12 10 8 34z" fill="#e6efe9" opacity=".55"/>${S.f.cLamp ? '<path class="flame" d="M0-26q5 7 0 12q-5-5 0-12z" fill="#ffcf5a"/>' : ''}</g>`;
    s += poly([[276, 326], [340, 322], [346, 340], [270, 344]], '#efe6d0') + `<path d="M308 323l2 19" stroke="#c9bfa8"/>`;
    s += `<circle cx="380" cy="336" r="9" fill="none" stroke="#c9a85a" stroke-width="3"/><path d="M386 342l10 8" stroke="#3a2a1a" stroke-width="4"/><circle cx="420" cy="342" r="6" fill="none" stroke="#c9a85a" stroke-width="2"/>`;
    s += `<g><ellipse cx="472" cy="470" rx="50" ry="18" fill="#7a3b2e"/><ellipse cx="472" cy="466" rx="42" ry="13" fill="#8d4636"/><path d="M450 462l4 2M470 466l5-1M488 462l3 3" stroke="#e8d3b0" stroke-width="1.5"/></g>`;
    if (!lit) {
      const holes = [];
      let lv = 0.95;
      if (S.f.cLamp) { lv = 0.35; holes.push([200, 330, 320, 250, 1]); }
      holes.push([216, 184, 90, 80, 0.45]);
      s += dark(pre, lv, holes);
    }
    s += hsR('c_win', 138, 112, 156, 144, '窓') + hsR('c_wall', 318, 84, 100, 160, '壁の時計') + hsR('c_clock', 428, 100, 58, 248, '柱時計');
    s += hsP('c_box', [[24, 120], [90, 130], [90, 176], [24, 186]], '小箱') + hsR('c_lamp', 178, 276, 44, 56, '石油ランプ') + hsR('c_note', 266, 316, 84, 32, 'ノート');
    s += hsR('c_drawer', 252, 366, 108, 40, '作業台の引き出し') + hsR('c_cushion', 420, 448, 104, 40, '座布団');
    return s;
  };

  /* ---- フィルムの絵（ポジ） 360×240 ---- */
  A.frame = (i) => {
    const alley = (night, extra) => {
      let s = rect(0, 0, 360, 240, night ? '#1c2742' : '#bcd3e4');
      s += poly([[0, 0], [130, 30], [130, 240], [0, 240]], night ? '#b39c80' : '#7d6b58') + poly([[360, 0], [230, 30], [230, 240], [360, 240]], night ? '#a8927a' : '#86735f');
      s += poly([[130, 160], [230, 160], [360, 240], [0, 240]], night ? '#6c6c6c' : '#9a9a96');
      for (let k = 0; k < 6; k++) s += `<path d="M0 ${150 + k * 14}L130 ${160 + k * 6}M360 ${150 + k * 14}L230 ${160 + k * 6}" stroke="${night ? '#9c876d' : '#6b5a48'}" stroke-width="2"/>`;
      s += poly([[40, 70], [100, 82], [100, 140], [40, 136]], night ? '#2a2420' : '#4b3b2b') + poly([[320, 70], [260, 82], [260, 140], [320, 136]], night ? '#2a2420' : '#4b3b2b');
      return s + (extra || '');
    };
    if (i === 0) return alley(true, `<circle cx="78" cy="112" r="11" fill="#fff6d2"/><circle cx="282" cy="112" r="11" fill="#fff6d2"/><path d="M88 112L272 110" stroke="#fff6d2" stroke-width="5" opacity=".85"/>`);
    if (i === 1) return alley(false, `<path d="M70 150L230 40" stroke="#555" stroke-width="1.5"/><path d="M230 40l18-10 10 18-18 10z" fill="#d9483b"/><path d="M240 52q6 20 -4 40" stroke="#d9483b" stroke-width="2" fill="none"/><circle cx="66" cy="140" r="8" fill="#333"/><path d="M60 148h12v20h-12z" fill="#333"/><circle cx="292" cy="118" r="8" fill="#333"/><path d="M286 126h12v18h-12z" fill="#333"/>`);
    if (i === 2) return rect(0, 0, 360, 240, '#a8a39a') + poly([[0, 150], [360, 120], [360, 190], [0, 230]], '#7b7d80') + `<circle cx="250" cy="70" r="40" fill="#f4f1ea" stroke="#333" stroke-width="6"/><path d="M250 70v-26M250 70l18 8" stroke="#333" stroke-width="5"/>` + A.cat(150, 170, 1.9, 'curl');
    if (i === 3) return rect(0, 0, 360, 240, '#2a2a30') + rect(30, 40, 130, 150, '#b9c4cc') + rect(200, 40, 130, 150, '#b9c4cc') + rect(90, 40, 6, 150, '#2a2a2a') + rect(262, 40, 6, 150, '#2a2a2a')
      + `<path d="M60 120q10-30 30-20q20 -10 30 20q-30 26 -60 0zM62 104l6-14 8 10M108 100l8-12 4 14" stroke="#39404a" stroke-width="5" fill="none"/><path d="M265 80l10 30 32 2-26 18 10 30-26-18-26 18 10-30-26-18 32-2z" stroke="#39404a" stroke-width="5" fill="none"/>`;
    if (i === 4) return rect(0, 0, 360, 240, '#6b4a2c') + poly([[60, 30], [300, 18], [312, 210], [52, 224]], '#efe6d0')
      + MD.NOTE.map((t, k) => `<text x="${k === 3 ? 170 : 88}" y="${68 + k * 42}" font-family="'Kaisei HarunoUmi', serif" font-size="${k === 3 ? 17 : 24}" fill="#222" transform="rotate(-3 180 120)">${esc(t)}</text>`).join('')
      + `<circle cx="330" cy="200" r="16" fill="none" stroke="#c9a85a" stroke-width="4"/>`;
    return rect(0, 0, 360, 240, '#000');
  };
  /* スクリーンにうつった絵（ネガ・向き・ピント） */
  A.projOn = (S, x, y, w, h, pre, side) => {
    const fx = S.film.h ? -1 : 1, fy = S.film.v ? -1 : 1;
    const [sx, sy] = side === 'a' ? [-fx, -fy] : [fx, -fy];
    const err = Math.abs(S.focus - 62);
    const blur = Math.min(14, err * 0.32);
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 360 240" preserveAspectRatio="none">`
      + `<defs><filter id="${pre}-ng" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 .92  0 0 -1 0 .78  0 0 0 1 0"/><feGaussianBlur stdDeviation="${blur.toFixed(1)}"/></filter></defs>`
      + `<g filter="url(#${pre}-ng)"><g transform="translate(180 120) scale(${sx} ${sy}) translate(-180 -120)">${A.frame(S.frame)}</g></g>`
      + `<rect width="360" height="240" fill="#ffd9a0" opacity=".12"/></svg>`;
  };
  A.projHow = (S, side) => {
    const fx = S.film.h ? -1 : 1, fy = S.film.v ? -1 : 1;
    const [sx, sy] = side === 'a' ? [-fx, -fy] : [fx, -fy];
    return sx < 0 && sy < 0 ? '上下も左右も、さかさまだ' : sx < 0 ? '左右が逆だ' : sy < 0 ? '上下がさかさまだ' : '';
  };
  A.projUpright = (S, side) => {
    const fx = S.film.h ? -1 : 1, fy = S.film.v ? -1 : 1;
    const [sx, sy] = side === 'a' ? [-fx, -fy] : [fx, -fy];
    return sx === 1 && sy === 1;
  };

  /* ---- 写真 ---- */
  A.photo = (p, pre) => {
    const S2 = Object.assign(MD.fresh(), p.snap);
    S2.ended = false;
    let inner;
    if (p.subj === 'room') inner = A.roomB(S2, pre, { lit: true }).replace(/<(rect|polygon|circle) class="hs"[^>]*\/>/g, '') + rect(0, 0, 600, 540, '#fff', 'opacity=".12"');
    else if (p.subj === 'curtain') inner = rect(0, 0, 600, 540, '#e9dcc4') + Array.from({ length: 12 }, (_, i) => rect(i * 52, 0, 16, 540, '#dccdb0')).join('') + Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 71) % 600}" cy="${(i * 113) % 540}" r="6" fill="#e3a3a8"/>`).join('') + rect(0, 0, 600, 540, '#fff', 'opacity=".25"');
    else {
      inner = A.viewB(S2, pre, 'back') + rect(0, 0, 600, 540, '#000', `opacity="${p.stars ? 0.05 : 0.25}"`);
      if (!p.stars) for (let i = 0; i < 70; i++) { const x = (i * 83) % 600, y = (i * 137) % 540; inner += `<path d="M${x} ${y}l-3 12" stroke="#fff" stroke-width="2" opacity=".85"/>`; }
      inner += A.viewB(S2, pre + 'f', 'front').replace(/<(rect|polygon|circle) class="hs"[^>]*\/>/g, '');
    }
    return `<svg viewBox="0 0 640 680" class="photo"><rect width="640" height="680" rx="6" fill="#f7f4ec"/><svg x="20" y="20" width="600" height="540" viewBox="0 0 600 540">${inner}</svg>`
      + `<text x="40" y="620" font-family="'Tsukimi Rounded', sans-serif" font-size="26" fill="#555">${p.stars ? '星の下のソウの窓' : p.subj === 'room' ? 'わたしの部屋（さいごの夜）' : p.subj === 'curtain' ? 'カーテン' : 'ソウの窓'}</text>`
      + `<text x="600" y="652" text-anchor="end" font-family="'Tsukimi Rounded', sans-serif" font-size="22" fill="#999">9.${p.t >= 120 ? 30 : 29}  ${MD.fmtTime(p.t)}</text></svg>`;
  };

  /* ---- 手もとの物の絵 40×40 ---- */
  const IC = {
    torch0: '<rect x="8" y="16" width="22" height="9" rx="2" fill="#b44"/><path d="M30 13l6-3v21l-6-3z" fill="#ccc"/>',
    torch: '<rect x="8" y="16" width="22" height="9" rx="2" fill="#b44"/><path d="M30 13l6-3v21l-6-3z" fill="#fff6c8"/><path d="M36 14l4-2M36 27l4 2M37 20h3" stroke="#ffd85a" stroke-width="2"/>',
    batt: '<rect x="8" y="10" width="10" height="22" rx="2" fill="#333"/><rect x="11" y="7" width="4" height="3" fill="#aaa"/><rect x="22" y="10" width="10" height="22" rx="2" fill="#333"/><rect x="25" y="7" width="4" height="3" fill="#aaa"/><rect x="8" y="22" width="10" height="10" fill="#d9483b"/><rect x="22" y="22" width="10" height="10" fill="#d9483b"/>',
    cutter: '<rect x="6" y="17" width="24" height="8" rx="2" fill="#f0c43c"/><path d="M30 18l8 2-8 3z" fill="#ccd"/>',
    reel: '<rect x="10" y="8" width="20" height="4" fill="#9a6b3e"/><rect x="10" y="28" width="20" height="4" fill="#9a6b3e"/><rect x="13" y="12" width="14" height="16" fill="#efe6d0"/><path d="M13 15h14M13 19h14M13 23h14" stroke="#d6cbb0"/>',
    coins: '<circle cx="15" cy="20" r="8" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="15" cy="20" r="2.5" fill="#fff"/><circle cx="25" cy="24" r="8" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="25" cy="24" r="2.5" fill="#fff"/>',
    weighted: '<path d="M6 8q10 4 12 14" stroke="#efe6d0" stroke-width="2" fill="none"/><circle cx="20" cy="26" r="7" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="26" cy="30" r="7" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="23" cy="28" r="2" fill="#fff"/>',
    matches: '<rect x="8" y="12" width="24" height="16" fill="#d24b3c"/><rect x="8" y="12" width="24" height="5" fill="#f0e2c4"/><path d="M28 8l6-4" stroke="#c9a" stroke-width="2"/>',
    match3: '<rect x="8" y="12" width="24" height="16" fill="#4a6a8a"/><rect x="8" y="12" width="24" height="5" fill="#e6dccb"/>',
    clock: '<circle cx="14" cy="11" r="4" fill="#c9302c"/><circle cx="26" cy="11" r="4" fill="#c9302c"/><circle cx="20" cy="22" r="11" fill="#c9302c"/><circle cx="20" cy="22" r="8" fill="#f6f1e6"/><path d="M20 22v-5M20 22l3 2" stroke="#222" stroke-width="1.5"/>',
    camera: '<rect x="5" y="12" width="30" height="20" rx="3" fill="#2a2a2e"/><circle cx="20" cy="22" r="7" fill="#55595f"/><circle cx="20" cy="22" r="4" fill="#111"/><rect x="27" y="14" width="6" height="4" fill="#d9e2e8"/>',
    photos: '<rect x="9" y="9" width="22" height="26" fill="#f7f4ec" stroke="#aaa" transform="rotate(-8 20 22)"/><rect x="12" y="11" width="18" height="16" fill="#2c3e5a" transform="rotate(-8 20 22)"/><rect x="11" y="8" width="22" height="26" fill="#f7f4ec" stroke="#aaa" transform="rotate(6 20 20)"/><rect x="14" y="10" width="16" height="15" fill="#3f5a78" transform="rotate(6 20 20)"/>',
    key: '<circle cx="14" cy="20" r="6" fill="none" stroke="#d9c06a" stroke-width="3"/><path d="M20 20h14M30 20v5M34 20v4" stroke="#d9c06a" stroke-width="3"/>',
    catcan: '<ellipse cx="20" cy="30" rx="13" ry="4" fill="#2e5d82"/><rect x="7" y="14" width="26" height="16" fill="#3d7fa8"/><ellipse cx="20" cy="14" rx="13" ry="4" fill="#5a9cc4"/><circle cx="20" cy="22" r="3" fill="#f4efe4"/>',
    tin: '<ellipse cx="20" cy="30" rx="13" ry="4" fill="#2e5d82"/><rect x="7" y="14" width="26" height="16" fill="#3d7fa8"/><ellipse cx="20" cy="14" rx="13" ry="4" fill="#1d3f58"/>',
    niboshi: '<path d="M6 22q14-10 28 0q-14 6-28 0z" fill="#c9ccd1"/><circle cx="30" cy="20" r="1.4" fill="#222"/><path d="M8 28q12-6 24 0" stroke="#aeb2b8" stroke-width="3" fill="none"/>',
    pins: '<rect x="10" y="8" width="6" height="24" fill="#e87a7a"/><rect x="22" y="8" width="6" height="24" fill="#7ab8e8"/>',
    basketItem: '<path d="M10 12l-3-6M30 12l3-6" stroke="#ccc" stroke-width="2"/><rect x="7" y="12" width="26" height="20" rx="4" fill="#3d7fa8"/><rect x="7" y="15" width="26" height="4" fill="#e9c35a"/>',
    candle: '<rect x="16" y="14" width="8" height="20" fill="#f3ead2"/><path d="M20 6q4 5 0 8q-4-3 0-8z" fill="#ccc"/>',
    wetmatch: '<rect x="8" y="12" width="24" height="16" fill="#8a6a5a"/><rect x="8" y="12" width="24" height="5" fill="#bfb2a0"/><path d="M14 30q2 4 0 6M24 30q2 4 0 6" stroke="#7ab8e8" stroke-width="2"/>',
    jar: '<rect x="11" y="10" width="18" height="4" fill="#c9302c"/><rect x="10" y="14" width="20" height="20" rx="4" fill="#cfe0e6" opacity=".8" stroke="#9fb6bf"/>',
    lantern: '<rect x="10" y="10" width="20" height="24" rx="4" fill="#cfe0e6" opacity=".8" stroke="#9fb6bf"/><rect x="17" y="18" width="6" height="14" fill="#f3ead2"/>',
    tape: '<circle cx="20" cy="20" r="13" fill="#b98b4f"/><circle cx="20" cy="20" r="6" fill="#f4efe4"/>',
    album: '<rect x="8" y="7" width="24" height="28" rx="2" fill="#7a3b2e"/><rect x="12" y="12" width="16" height="10" fill="#e8d9b0"/>',
    filmcan: '<rect x="12" y="10" width="16" height="22" rx="3" fill="#222"/><rect x="12" y="10" width="16" height="5" fill="#555"/><rect x="14" y="18" width="12" height="8" fill="#e8c547"/>',
    film: '<rect x="4" y="13" width="32" height="14" fill="#8a4a1a"/><rect x="7" y="16" width="7" height="8" fill="#e2a25c"/><rect x="16" y="16" width="7" height="8" fill="#e2a25c"/><rect x="25" y="16" width="7" height="8" fill="#e2a25c"/>',
    book2: '<rect x="8" y="7" width="24" height="28" rx="2" fill="#4f81bd"/><rect x="12" y="12" width="16" height="8" fill="#fff"/><path d="M26 7v10l2-2 2 2V7" fill="#e8c547"/>',
    lens: '<circle cx="17" cy="17" r="10" fill="#cfe0e6" stroke="#333" stroke-width="3"/><path d="M24 24l9 9" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/>',
    tincans: '<rect x="5" y="14" width="13" height="18" rx="2" fill="#b9c0c6"/><rect x="22" y="14" width="13" height="18" rx="2" fill="#b9c0c6"/><path d="M12 14q8-10 16 0" stroke="#efe6d0" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>',
    canA: '<rect x="12" y="12" width="16" height="20" rx="2" fill="#b9c0c6"/><text x="20" y="27" text-anchor="middle" font-size="8" fill="#333">そう</text>',
    canB: '<rect x="12" y="12" width="16" height="20" rx="2" fill="#b9c0c6"/><text x="20" y="27" text-anchor="middle" font-size="8" fill="#333">いと</text>',
    letter: '<rect x="7" y="11" width="26" height="18" fill="#f3efe4" stroke="#aaa"/><path d="M7 11l13 10 13-10" stroke="#aaa" fill="none"/>',
    mirror: '<ellipse cx="17" cy="16" rx="10" ry="12" fill="#cfe2ec" stroke="#e7a0b4" stroke-width="3"/><path d="M23 26l8 10" stroke="#e7a0b4" stroke-width="5" stroke-linecap="round"/>',
    board: '<path d="M4 26l30-14 3 5-30 14z" fill="#c89a5e"/><path d="M4 26l30-14" stroke="#a87d48"/>',
    sheet: '<path d="M8 10h24v20q-12 4-24 0z" fill="#f8f6f0" stroke="#ccc"/>',
    winder: '<circle cx="14" cy="14" r="7" fill="none" stroke="#c9a85a" stroke-width="3"/><path d="M19 19l13 13" stroke="#c9a85a" stroke-width="4"/>',
    cat: '',
  };
  A.icon = (id) => `<svg viewBox="0 0 40 40" aria-hidden="true">${IC[id] || '<circle cx="20" cy="20" r="10" fill="#ccc"/>'}</svg>`;

  /* ---- 読みもの ---- */
  A.read = (id, S) => {
    if (id === 'weather') return { title: '『お天気のふしぎ』', html: '<p class="r-h">台風のひみつ</p><p>台風の風は、いつも同じ強さで吹いているわけではありません。強い風が吹いたあと、ふっと弱まる「息つぎ」のような瞬間が、くりかえしやってきます。雨がまっすぐに落ちるのは、そんなときです。</p><p>台風のまん中には、「目」とよばれる、風の弱いところがあります。目に入ると、それまでのあらしがうそのように、風も雨もやみ、星が見えることもあります。でも、目が通りすぎると、また強い風が吹きかえします。</p>' };
    if (id === 'book2') return { title: '『たのしい科学あそび』', html: '<p class="r-h">停電の夜に　手づくり幻灯機</p><svg viewBox="0 0 320 90" class="r-fig"><rect x="6" y="36" width="44" height="18" rx="3" fill="#b44"/><path d="M50 32l14-6v38l-14-6z" fill="#fff6c8"/><path d="M64 34L300 12M64 56L300 78" stroke="#e8d38a" stroke-dasharray="4 3"/><rect x="104" y="28" width="8" height="34" fill="#c47a3a"/><ellipse cx="170" cy="45" rx="6" ry="22" fill="#cfe0e6" stroke="#555"/><rect x="290" y="6" width="12" height="78" fill="#f2eee6" stroke="#aaa"/><text x="4" y="78" font-size="10">①強い光</text><text x="90" y="78" font-size="10">②フィルム</text><text x="150" y="78" font-size="10">③虫めがね</text><text x="250" y="78" font-size="10">④白い布</text></svg>'
      + '<p>①強い光を、フィルムのうしろから当てます。懐中電灯のような、まっすぐな光がいちばんです。②フィルムを通った光を、③虫めがねで受けて、④白い布やかべにうつします。虫めがねを前やうしろに動かすと、ピントが合います。</p><p class="r-n">※うつる絵は、上下も左右もさかさまになります。フィルムは、さかさまに入れましょう。<br>※まわりが明るいと、絵はうすくなります。部屋を暗くしましょう。<br>※ネガフィルムをうつすと、明るいところと暗いところが逆になります。</p>' };
    if (id === 'album') return { title: 'アルバム', html: '<div class="r-photos"><figure><svg viewBox="0 0 120 90"><rect width="120" height="90" fill="#c9b48a"/><rect x="10" y="10" width="100" height="56" fill="#6d5a44"/><circle cx="40" cy="44" r="10" fill="#e8d0b0"/><circle cx="72" cy="46" r="9" fill="#e8d0b0"/><rect x="88" y="24" width="14" height="40" fill="#3a2a1a"/></svg><figcaption>七五三　時計屋さんの前で（じいちゃんと）</figcaption></figure><figure><svg viewBox="0 0 120 90"><rect width="120" height="90" fill="#9fb4c0"/>' + A.cat(60, 60, 1.1, 'curl') + '</svg><figcaption>ボタン　ひさしの上</figcaption></figure><figure><svg viewBox="0 0 120 90"><rect width="120" height="90" fill="#bcd3e4"/><path d="M20 80L90 20" stroke="#555"/><path d="M90 20l8-6 6 8-8 6z" fill="#d9483b"/></svg><figcaption>お正月　凧あげ（ソウと）</figcaption></figure></div><p class="r-n">いちばん最後のページは、空いている。</p>' };
    if (id === 'letter') return { title: '出せなかった手紙', html: '<p class="r-letter">ソウへ<br><br>ひっこしのこと、だまっててごめん。<br>言ったら、窓がなくなる気がした。<br><br>むこうに行っても、夜、懐中電灯つけるから。<br>見えなくても、つけるから。<br><br>三回。<br><br>　　　　　　　　　イト</p>' };
    if (id === 'diary') return { title: '時田のノート', html: MD.DIARY.map(([d, t]) => `<p class="r-h">${esc(d)}</p><p>${esc(t)}</p>`).join('') };
    return { title: '', html: '' };
  };

  MD.art = A;
})();
