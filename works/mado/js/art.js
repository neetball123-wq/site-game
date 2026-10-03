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

  /* ---- 描きこみの道具 ---- */
  // 木目：箱の中に、ゆれる細い線を n 本
  const grain = (x, y, w, h, color, n, vert, op = 0.35) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      if (vert) { const xx = x + w * t; s += `<path d="M${xx.toFixed(1)} ${y}q${(w / n * 0.5).toFixed(1)} ${(h * 0.25).toFixed(1)} 0 ${(h * 0.5).toFixed(1)}t0 ${(h * 0.5).toFixed(1)}" stroke="${color}" stroke-width=".8" fill="none" opacity="${op}"/>`; }
      else { const yy = y + h * t; s += `<path d="M${x} ${yy.toFixed(1)}q${(w * 0.25).toFixed(1)} ${(h / n * 0.45).toFixed(1)} ${(w * 0.5).toFixed(1)} 0t${(w * 0.5).toFixed(1)} 0" stroke="${color}" stroke-width=".8" fill="none" opacity="${op}"/>`; }
    }
    return s;
  };
  // 雨どい（横の樋と、たての管）
  const gutter = (x0, x1, y, px) => rect(x0, y, x1 - x0, 5, '#3a3e44') + rect(x0, y, x1 - x0, 1.5, '#5a5f66') + rect(px, y + 5, 6, 540 - y, '#3a3e44') + rect(px + 1, y + 5, 1.5, 540 - y, '#565b62') + [y + 70, y + 190, y + 310, y + 430].map((yy) => rect(px - 2, yy, 10, 3, '#2c2f34')).join('');
  // 瓦の屋根のはし
  const roofEdge = (pts, x0, x1, y0, col, line) => poly(pts, col) + Array.from({ length: Math.floor((x1 - x0) / 12) }, (_, i) => `<path d="M${x0 + 6 + i * 12} ${y0}v${(pts[2][1] - y0) - 2}" stroke="${line}" stroke-width="1.4"/>`).join('') + `<path d="M${pts[3][0]} ${pts[3][1] - 1}H${pts[2][0]}" stroke="${line}" stroke-width="2.5"/>`;

  /* ---- 窓の外：ソウの窓から（イトの写真館と時計店） ---- */
  const BWIN = [154, 114, 212, 182]; // ソウから見たイトの窓ガラス
  A.viewA = (S, pre, layer) => {
    const E = S.ended;
    const back = () => {
      let s = sky(pre, S);
      // 左のすきま：奥の家並み
      s += poly([[0, 118], [22, 108], [44, 112], [44, 92], [66, 98], [90, 94], [90, 540], [0, 540]], E ? '#98a3aa' : '#121826');
      for (const [x, y] of [[8, 140], [52, 130], [8, 200], [52, 196]]) s += rect(x, y, 22, 26, E ? '#c7d0d5' : '#0b0f18');
      // 写真館
      s += roofEdge([[70, 30], [450, 30], [440, 54], [80, 54]], 76, 446, 30, '#24272d', '#33373e');
      s += rect(90, 54, 340, 486, '#5f564b');
      for (let y = 66; y < 540; y += 14) s += `<path d="M90 ${y}h340" stroke="#4f473e" stroke-width="1.6"/><path d="M90 ${y + 2}h340" stroke="#6c6256" stroke-width=".8"/>`;
      s += gutter(76, 444, 54, 94);
      // 戸袋（雨戸の入れもの）
      s += rect(378, 104, 30, 204, '#4d453b') + Array.from({ length: 4 }, (_, i) => `<path d="M${384 + i * 7} 104v204" stroke="#3f3830" stroke-width="1.2"/>`).join('') + rect(376, 100, 34, 6, '#3a332b');
      // 窓
      s += rect(146, 106, 228, 198, '#3a2c20');
      s += A.interior(S, 'b', ...BWIN, pre + 'ib', 'a');
      s += rect(258, 114, 4, 182, '#3a2c20') + rect(154, 204, 212, 3, '#3a2c20');
      s += `<path d="M156 116l50 0l-40 60z" fill="#fff" opacity=".04"/>`;
      s += rect(140, 300, 240, 10, '#4a392a') + rect(140, 310, 240, 3, '#000', 'opacity=".25"') + `<path d="M150 296h220" stroke="#8c9096" stroke-width="2"/>`;
      // 電気のメーター
      s += rect(104, 250, 24, 34, '#7d8186', 'rx="2"') + `<circle cx="116" cy="263" r="7" fill="${E ? '#e9eef0' : '#3a3e44'}"/><rect x="108" y="275" width="16" height="4" fill="#55595e"/>`;
      // 看板
      s += rect(124, 324, 272, 54, '#2a2620', 'rx="3"') + rect(130, 330, 260, 42, E ? '#efe8d6' : '#3d3a33', 'rx="2"');
      s += `<g transform="translate(152 351)" opacity="${E ? 1 : 0.6}"><rect x="-11" y="-7" width="22" height="15" rx="2" fill="${E ? '#2b2b2b' : '#8d8778'}"/><circle r="4.5" fill="${E ? '#efe8d6' : '#3d3a33'}"/><rect x="-7" y="-10" width="6" height="3" fill="${E ? '#2b2b2b' : '#8d8778'}"/></g>`;
      s += `<text x="272" y="360" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="22" letter-spacing="6" fill="${E ? '#2b2b2b' : '#8d8778'}">ひかり写真館</text>`;
      // 一階：シャッターと、張り紙
      s += rect(110, 384, 300, 156, '#43474d') + rect(110, 384, 300, 8, '#33363b');
      for (let y = 396; y < 540; y += 10) s += `<path d="M110 ${y}h300" stroke="#383b40" stroke-width="2"/><path d="M110 ${y + 2}h300" stroke="#50545a" stroke-width=".7"/>`;
      s += rect(318, 412, 46, 36, E ? '#efe9d8' : '#5d5e5e', 'opacity=".8"') + `<text x="341" y="428" text-anchor="middle" font-size="8" fill="${E ? '#a3361f' : '#3a3a3a'}">七五三</text><text x="341" y="440" text-anchor="middle" font-size="7" fill="${E ? '#555' : '#3a3a3a'}">記念撮影</text>`;
      s += rect(250, 528, 40, 6, '#2c2e32');
      // 時計店
      s += roofEdge([[424, 52], [600, 52], [600, 72], [432, 72]], 430, 600, 52, '#2b2620', '#3a342c');
      s += rect(430, 72, 170, 468, '#4d463f');
      for (let x = 442; x < 600; x += 12) s += `<path d="M${x} 72v468" stroke="#433c35" stroke-width="1.3"/>`;
      s += rect(458, 116, 112, 148, '#2e271f');
      s += A.interior(S, 'c', 468, 126, 92, 128, pre + 'ic', 'a');
      for (let x = 476; x < 560; x += 9) s += `<path d="M${x} 126v128" stroke="#2e271f" stroke-width="2.4"/>`;
      s += rect(458, 260, 112, 8, '#3a3129');
      // 看板時計（腕木つき）
      s += `<path d="M432 282h70" stroke="#2b2620" stroke-width="4"/><path d="M440 282l20-14" stroke="#2b2620" stroke-width="2"/>`;
      s += `<g><circle cx="520" cy="296" r="21" fill="#2b2620"/><circle cx="520" cy="296" r="17" fill="${E ? '#f4f1ea' : '#bfbab0'}"/>${[0, 90, 180, 270].map((a) => `<path d="M520 281v3" stroke="#2b2620" stroke-width="2" transform="rotate(${a} 520 296)"/>`).join('')}<path d="M520 296v-11M520 296l7 4" stroke="#2b2620" stroke-width="2.4" stroke-linecap="round"/></g>`;
      s += poly([[424, 328], [600, 328], [600, 352], [416, 358]], '#6a6c6f') + `<path d="M440 330l-6 26M470 330l-5 25M500 330l-4 24M530 330l-3 23M560 330l-2 23M590 330l-1 22" stroke="#55575a" stroke-width="2"/><path d="M416 358L600 352" stroke="#4a4c4f" stroke-width="3"/>`;
      s += rect(446, 362, 146, 30, '#2b2620', 'rx="2"') + `<text x="519" y="383" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="17" letter-spacing="4" fill="${E ? '#e9dcc0' : '#8f877a'}">時田時計店</text>`;
      // 一階のかざり窓（時計が並ぶ）
      s += rect(432, 396, 168, 144, '#3c3e42') + rect(442, 402, 150, 104, E ? '#55626a' : '#121316');
      for (const [x, y, r] of [[466, 440, 14], [506, 432, 10], [540, 446, 16], [576, 436, 9], [486, 482, 9], [560, 488, 8]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${E ? '#d8d2c4' : '#1d1f24'}"/><path d="M${x} ${y}v-${r * 0.6}" stroke="${E ? '#333' : '#121316'}" stroke-width="1.2"/>`;
      s += `<path d="M446 404l40 0l-30 44z" fill="#fff" opacity=".05"/>` + rect(432, 506, 168, 34, '#33353a');
      // 板と煮干し・ボタン
      if (S.f.bridge && !E) s += poly([[360, 302], [370, 298], [438, 330], [430, 337]], '#b48a55') + `<path d="M364 301L434 333" stroke="#8a6638" stroke-width="1" stroke-dasharray="3 3"/>`;
      if (S.f.bait && S.cat === 'eave') s += `<path d="M424 327l8-2M418 324l7-2" stroke="#c9ccd1" stroke-width="2.5" stroke-linecap="round"/>`;
      const tokeiLit = S.aim === 'tokei' && G.torchA(S);
      if (S.cat === 'eave') s += `<g class="catx" data-x0="452" data-y0="330" data-x1="372" data-y1="300">${A.cat(452, 330, 0.62, S.f.catGo ? 'walk' : 'curl', { eyes: true, wet: true })}</g>`;
      // 電柱と電線
      s += rect(26, 0, 9, 540, E ? '#8a8378' : '#24211c') + rect(8, 52, 46, 5, E ? '#6f6a62' : '#1c1a16') + rect(36, 72, 14, 26, E ? '#7a7f84' : '#1d2026', 'rx="3"');
      s += [12, 24, 40, 50].map((x) => `<circle cx="${x}" cy="50" r="2.4" fill="${E ? '#e9e4d8' : '#3a3e44'}"/>`).join('');
      s += `<path d="M34 168q26-8 40-4" stroke="${E ? '#6f6a62' : '#24211c'}" stroke-width="3" fill="none"/><ellipse cx="76" cy="166" rx="9" ry="4" fill="${E ? '#cfd6d8' : '#1d2026'}"/>`;
      s += `<g class="sway" data-amp="2" data-ox="30" data-oy="50"><path d="M12 50Q220 92 446 60" stroke="#0f1218" stroke-width="1.4" fill="none"/><path d="M50 50Q300 100 600 74" stroke="#0f1218" stroke-width="1.4" fill="none"/></g>`;
      // 光の円錐
      if (G.torchA(S) && S.aim && S.f.aCur && !E) {
        const tg = { curtain: [260, 205], boxes: [205, 255], dresser: [330, 215], ceiling: [260, 130], glass: [260, 196], tokei: [460, 330] }[S.aim];
        s += `<defs><linearGradient id="${pre}-cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffbe6" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe6" stop-opacity=".12"/></linearGradient></defs>`
          + `<polygon points="${pt([[286, 520], [314, 520], [tg[0] + 44, tg[1] + 20], [tg[0] - 44, tg[1] - 20]])}" fill="url(#${pre}-cone)"/>`;
        if (S.aim === 'tokei') s += `<ellipse cx="465" cy="334" rx="62" ry="26" fill="#fff6d0" opacity=".35"/>`;
      }
      if (!tokeiLit && S.cat === 'eave' && !E) s += rect(400, 296, 200, 76, '#05070c', 'opacity=".8"');
      // 糸とかご
      if (S.f.lineB >= 1 && !E) s += S.f.lineB === 2 ? `<path d="M300 466L340 298" stroke="#e8e0cc" stroke-width="1.6"/>` : `<path d="M300 466Q330 420 340 300" stroke="#e8e0cc" stroke-width="1.3" fill="none"/>`;
      if (S.f.phone && !E) s += `<path d="M200 490L176 296" stroke="#d9c9a8" stroke-width="1.1"/>`;
      if (E && S.f.phone) s += `<path d="M200 490q-6 -20 -4 -40" stroke="#d9c9a8" stroke-width="1.1" fill="none"/>`;
      s += basketG(pre, S, 300, 452, 1.5, 340, 290, 0.55, 'va_basket');
      return s;
    };
    const front = () => {
      let s = '';
      // 風鈴（ソウの家の軒下）
      s += `<g class="sway" data-amp="22" data-ox="96" data-oy="0"><path d="M96 0v40" stroke="#ddd" stroke-width="1"/><path d="M84 52a12 12 0 0 1 24 0z" fill="#bfe3ef" opacity=".85"/><path d="M88 46q8-6 16 0" stroke="#e8483b" stroke-width="1.5" fill="none" opacity=".7"/><path d="M96 52v20" stroke="#ddd" stroke-width="1"/><rect x="90" y="72" width="12" height="26" fill="#f1e7c9"/><path d="M93 78h6M93 84h6" stroke="#5b8bbf" stroke-width="1"/></g>`;
      // 自分の窓わく
      s += rect(0, 0, 600, 16, '#4a321f') + rect(0, 14, 600, 3, '#2e1f13') + rect(0, 0, 18, 540, '#4a321f') + rect(582, 0, 18, 540, '#4a321f') + rect(16, 0, 3, 540, '#2e1f13', 'opacity=".6"') + rect(580, 0, 3, 540, '#6a4a30', 'opacity=".6"');
      s += `<path d="M0 470h600" stroke="#9aa0a7" stroke-width="5"/><path d="M0 468h600" stroke="#c4c9cf" stroke-width="1"/><path d="M60 470v40M300 470v40M540 470v40" stroke="#80868d" stroke-width="4"/>`;
      s += [130, 150, 420].map((x, i) => `<rect x="${x}" y="462" width="5" height="12" rx="1" fill="${['#e87a7a', '#7ab8e8', '#f0d36a'][i]}"/>`).join('');
      s += rect(0, 496, 600, 44, '#5b3f27') + rect(0, 496, 600, 5, '#7a5739') + grain(0, 502, 600, 38, '#3e2a18', 4, false, 0.4);
      if (S.f.phone || S.f.canATied) s += `<g><rect x="188" y="482" width="22" height="26" rx="3" fill="#b9c0c6" stroke="#7a8288"/><path d="M190 488h18M190 500h18" stroke="#8d959b"/></g>`;
      if (G.torchA(S) && S.aim && !S.ended) s += `<g transform="translate(300 506)"><rect x="-10" y="-8" width="20" height="26" rx="3" fill="#b44"/><rect x="-10" y="2" width="20" height="4" fill="#922"/><rect x="-3" y="8" width="6" height="5" fill="#ddd"/><ellipse cx="0" cy="-9" rx="13" ry="5" fill="#fff8d8"/></g>`;
      if (S.cat === 'a' && !S.ended) s += A.cat(420, 500, 1.1, 'sit');
      if (S.ended && S.ending === 'stay') s += A.cat(430, 502, 1.2, 'curl');
      // さわれる所
      if (!S.f.bCur && !S.ended) s += hsR('va_cur', 154, 114, 212, 182, 'イトの窓');
      else if (!S.ended) {
        s += hsR('va_ceiling', 154, 114, 212, 40, 'イトの部屋の天井') + hsR('va_boxes', 154, 200, 110, 96, 'イトの部屋の段ボールの山') + hsR('va_dresser', 280, 150, 86, 146, 'イトの部屋の鏡台');
        if (S.f.filmOn) s += hsR('va_glass', 164, 182, 192, 30, 'イトの窓のフィルム');
      }
      s += hsR('va_tokei', 410, 296, 190, 72, '時計屋さんのひさし') + hsR('va_cwin', 458, 116, 112, 148, '時計屋さんの二階の窓') + hsR('va_sign', 124, 324, 272, 54, '写真館の看板');
      s += hsR('va_frame', 18, 476, 564, 64, '物干しの手すりと窓わく');
      return s;
    };
    return layer === 'back' ? back() : front();
  };

  /* ---- ソウの家（酒屋）の正面。ox だけ横にずらして描く ---- */
  const sakaya = (S, pre, ox) => {
    const E = S.ended;
    let s = `<g transform="translate(${ox} 0)">`;
    s += roofEdge([[90, 30], [490, 30], [480, 54], [100, 54]], 96, 486, 30, '#26231f', '#36322c');
    s += rect(110, 54, 360, 486, '#55493c');
    for (let x = 122; x < 470; x += 16) s += `<path d="M${x} 54v270" stroke="#463b30" stroke-width="1.6"/><path d="M${x + 2} 54v270" stroke="#5f5245" stroke-width=".7"/>`;
    s += gutter(96, 484, 54, 462);
    s += rect(110, 322, 360, 7, '#463b30');
    // 窓
    s += rect(186, 106, 228, 198, '#33261a');
    s += A.interior(S, 'a', ...AWIN, pre + 'ia', 'b');
    s += rect(298, 114, 4, 182, '#33261a') + rect(194, 204, 212, 3, '#33261a');
    s += `<path d="M196 116l46 0l-36 54z" fill="#fff" opacity=".04"/>`;
    // 物干し（手すり）と洗濯ばさみ
    s += `<path d="M170 316h260M170 330h260" stroke="#8a9096" stroke-width="3"/><path d="M170 314h260" stroke="#b9bec4" stroke-width="1"/><path d="M180 304v30M300 304v30M420 304v30" stroke="#7a8086" stroke-width="3"/>`;
    s += [206, 218, 384, 396].map((x, i) => `<rect x="${x}" y="309" width="4" height="10" rx="1" fill="${['#e87a7a', '#7ab8e8', '#f0d36a', '#9bd18a'][i]}"/>`).join('');
    // 朝顔の鉢とネット
    s += `<path d="M138 300h26l-4 22h-18z" fill="${E ? '#b0643c' : '#3b2a20'}"/><path d="M142 300V150M160 300V150M142 180h18M142 220h18M142 260h18" stroke="${E ? '#cfd4d6' : '#2f343a'}" stroke-width="1"/>`;
    s += `<path d="M151 300q-10-30 4-60t-6-60" stroke="${E ? '#5c8a4e' : '#1c2a1f'}" stroke-width="2" fill="none"/>` + [[146, 262], [158, 232], [144, 204], [156, 176]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="${E ? '#6aa05a' : '#1e2d21'}"/>`).join('') + (E ? '<circle cx="160" cy="214" r="4" fill="#6f7fd8"/><circle cx="146" cy="190" r="3.5" fill="#d86fa8"/>' : '');
    // 看板
    s += rect(144, 336, 312, 54, '#120f0c', 'rx="3"') + rect(150, 342, 300, 42, E ? '#1d2c4c' : '#18202e', 'rx="2"') + rect(154, 346, 292, 34, 'none', `stroke="${E ? '#c9a85a' : '#3a4250'}" stroke-width="1" rx="1"`);
    s += `<text x="300" y="372" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="23" letter-spacing="7" fill="${E ? '#f3efe6' : '#6f7684'}">みなもと酒店</text>`;
    // たばこの看板
    s += rect(116, 400, 26, 58, E ? '#c0392b' : '#3a2120', 'rx="2"') + ['た', 'ば', 'こ'].map((c, i) => `<text x="129" y="${417 + i * 15}" text-anchor="middle" font-size="12" font-weight="700" fill="${E ? '#fff' : '#6b5552'}">${c}</text>`).join('');
    // シャッター
    s += rect(150, 392, 280, 148, '#42464c') + rect(150, 392, 280, 8, '#33363b');
    for (let y = 404; y < 540; y += 10) s += `<path d="M150 ${y}h280" stroke="#373a3f" stroke-width="2"/><path d="M150 ${y + 2}h280" stroke="#51555b" stroke-width=".7"/>`;
    s += `<text x="270" y="470" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="20" letter-spacing="10" fill="${E ? '#6c7178' : '#4c5056'}">酒・米・たばこ</text>`;
    // ビールのケース
    for (const [x, y] of [[364, 500], [364, 470], [398, 500]]) {
      s += rect(x, y, 32, 30, E ? '#e3b23c' : '#3d3420', 'rx="2"');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += rect(x + 4 + i * 9, y + 6 + j * 11, 6, 7, E ? '#a77c1f' : '#2a2416');
      s += [0, 1, 2].map((i) => `<circle cx="${x + 7 + i * 9}" cy="${y - 2}" r="3" fill="${E ? '#6b4a1e' : '#221d15'}"/>`).join('');
    }
    // 自動販売機
    s += rect(436, 420, 60, 120, E ? '#c9302c' : '#3a2322', 'rx="3"') + rect(442, 428, 48, 40, E ? '#e9f2f6' : '#1b1c20');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s += rect(445 + i * 11, 432 + j * 18, 8, 13, E ? ['#2c6db0', '#e8b23c', '#3a9a5a', '#d84a3a'][i] : '#26272c', 'rx="2"');
    s += Array.from({ length: 4 }, (_, i) => `<circle cx="${448 + i * 11}" cy="476" r="2.4" fill="${E ? '#f4e9a8' : '#2a2a2e'}"/>`).join('');
    s += rect(482, 486, 6, 12, '#222') + rect(446, 516, 40, 12, '#1a1a1e', 'rx="2"');
    s += '</g>';
    return s;
  };

  /* ---- 窓の外：イトの窓から（ソウの酒屋） ---- */
  const AWIN = [194, 114, 212, 182];
  A.viewB = (S, pre, layer) => {
    const E = S.ended;
    const back = () => {
      let s = sky(pre, S);
      s += sakaya(S, pre, 0);
      // 空き地：電柱・板べい・木
      s += rect(572, 0, 8, 470, E ? '#8a8378' : '#24211c') + rect(556, 40, 40, 4, E ? '#6f6a62' : '#1c1a16');
      s += `<path d="M470 0q60 30 130 26" stroke="#1b1f2a" stroke-width="2" fill="none"/><path d="M470 10q60 32 130 30" stroke="#1b1f2a" stroke-width="2" fill="none"/>`;
      s += `<g class="sway" data-amp="9" data-ox="548" data-oy="540"><path d="M548 540V250" stroke="#2c241c" stroke-width="16"/><path d="M548 540V250" stroke="#3a2f24" stroke-width="5"/><path d="M548 330l-30-40M548 300l26-36M548 380l20-20" stroke="#2c241c" stroke-width="7"/>`
        + [[540, 210, 70, 70, 0], [500, 262, 44, 40, 1], [584, 262, 40, 44, 1], [520, 168, 40, 36, 0], [570, 176, 36, 34, 1], [548, 240, 46, 30, 0]].map(([x, y, rx, ry, k]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${E ? (k ? '#4f7c43' : '#5c8a4e') : (k ? '#142019' : '#18241c')}"/>`).join('')
        + (E ? '<ellipse cx="528" cy="190" rx="20" ry="10" fill="#7fae6a" opacity=".6"/>' : '') + '</g>';
      s += rect(470, 446, 130, 94, E ? '#7a6248' : '#2a221b') + rect(468, 440, 134, 8, E ? '#5a4632' : '#1f1914');
      for (let x = 480; x < 600; x += 12) s += `<path d="M${x} 448v92" stroke="${E ? '#64503a' : '#211b15'}" stroke-width="1.5"/>`;
      s += `<path d="M470 540q10-20 14-6q6-18 10-2q8-14 12 4" stroke="${E ? '#6aa05a' : '#18241c'}" stroke-width="2" fill="none"/>`;
      // 糸とかご・糸電話
      if (S.f.lineB >= 1 && !E) s += S.f.lineB === 2 ? `<path d="M300 470L300 318" stroke="#e8e0cc" stroke-width="1.6"/>` : `<path d="M300 318Q280 420 270 520" stroke="#e8e0cc" stroke-width="1.3" fill="none"/>`;
      if (S.f.phone && !E) s += `<path d="M222 490L232 300" stroke="#d9c9a8" stroke-width="1.1"/>`;
      s += basketG(pre, S, 300, 306, 0.55, 300, 456, 1.5, 'vb_basket');
      return s;
    };
    const front = () => {
      let s = '';
      // 時計店のひさしのはし（左下）
      s += poly([[0, 452], [64, 452], [58, 470], [0, 474]], '#6a6c6f') + `<path d="M10 452l-2 20M26 452l-2 19M42 452l-2 18" stroke="#55575a" stroke-width="2"/>`;
      if (S.f.bridge && !E) s += poly([[30, 486], [96, 480], [96, 490], [24, 498]], '#b48a55');
      // 自分の窓わく（洋風の白）
      s += rect(0, 0, 600, 14, '#d9d1c3') + rect(0, 12, 600, 3, '#b8ae9e') + rect(0, 0, 16, 540, '#d9d1c3') + rect(584, 0, 16, 540, '#d9d1c3') + rect(14, 0, 3, 540, '#b8ae9e');
      s += `<path d="M16 474h568" stroke="#5f646b" stroke-width="4"/><path d="M16 472h568" stroke="#8a9097" stroke-width="1"/>`;
      s += rect(0, 498, 600, 42, '#e6dfd2') + rect(0, 498, 600, 4, '#fff') + rect(0, 536, 600, 4, '#c9c0b0');
      if (!S.f.bLock) s += `<g transform="translate(300 512)"><rect x="-16" y="-8" width="32" height="14" rx="3" fill="#b8a780" stroke="#7d6c4b"/><circle cx="0" cy="-1" r="3" fill="#5a4a2b"/><path d="M0-1v4" stroke="#5a4a2b" stroke-width="1.6"/></g>`;
      if (S.f.phone || S.f.canBTied) s += `<g><rect x="210" y="482" width="22" height="26" rx="3" fill="#b9c0c6" stroke="#7a8288"/><path d="M212 488h18M212 500h18" stroke="#8d959b"/></g>`;
      if (S.cat === 'b' && !E && S.f.eye) s += A.cat(400, 502, 1.1, 'sit');
      if (S.f.mirror && !E) s += A.mirror(S, pre);
      // さわれる所
      s += hsR('vb_awin', 186, 106, 228, 198, 'ソウの窓') + hsR('vb_sign', 144, 336, 312, 54, '酒屋の看板') + hsR('vb_tree', 470, 140, 130, 300, '空き地の木');
      s += hsR('vb_edge', 0, 440, 80, 40, '時計屋さんのひさしのはし');
      if (S.f.mirror && !E) s += `<circle class="hs" data-h="vb_mirror" cx="118" cy="372" r="92" aria-label="手鏡"/>`;
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
    m += rect(30, 280, 180, 60, lit ? '#3e3830' : '#08090c');
    for (let x = 36; x < 210; x += 12) m += `<path d="M${x} 280v60" stroke="${lit ? '#332e28' : '#060709'}" stroke-width="1.3"/>`;
    m += poly([[30, 400], [210, 370], [210, 410], [30, 456]], lit ? '#8a8c8f' : '#121316');
    for (let i = 0; i < 7; i++) m += `<path d="M${40 + i * 26} ${398 - i * 4}l4 ${40}" stroke="${lit ? '#6f7174' : '#0d0e10'}" stroke-width="2"/>`;
    m += `<path d="M78 330h40" stroke="${lit ? '#2b2620' : '#0a0a0c'}" stroke-width="4"/><circle cx="78" cy="330" r="22" fill="#2b2620"/><circle cx="78" cy="330" r="18" fill="${lit ? '#d8d3c8' : '#141517'}"/><path d="M78 330v-13M78 330l-8 4" stroke="#2b2620" stroke-width="2.4"/>`;
    if (S.f.bridge) m += poly([[150, 384], [214, 404], [214, 414], [146, 392]], lit ? '#b48a55' : '#1a140c');
    if (S.f.bait && S.cat === 'eave') m += `<path d="M150 388l9 3M156 393l8 3" stroke="${lit ? '#c9ccd1' : '#222'}" stroke-width="3" stroke-linecap="round"/>`;
    if (S.cat === 'eave') m += `<g class="catx" data-x0="108" data-y0="396" data-x1="200" data-y1="404">${lit ? A.cat(108, 396, 1.05, S.f.catGo ? 'walk' : 'curl', { eyes: true, wet: true }) : `<g transform="translate(108 396)"><circle cx="-14" cy="-6" r="1.8" fill="#ffe27a" style="opacity:calc(.25 + var(--flash, 0))"/><circle cx="-8" cy="-6" r="1.8" fill="#ffe27a" style="opacity:calc(.25 + var(--flash, 0))"/></g>`}</g>`;
    if (lit) m += `<ellipse cx="96" cy="390" rx="90" ry="50" fill="#fff6d0" opacity=".22"/>`;
    m += `<ellipse cx="80" cy="320" rx="40" ry="18" fill="#fff" opacity=".12" transform="rotate(-30 80 320)"/></g></g>`;
    m += `<circle cx="118" cy="372" r="88" fill="none" stroke="#e7a0b4" stroke-width="9"/><circle cx="118" cy="372" r="92" fill="none" stroke="#c97f95" stroke-width="2"/><path d="M178 436l40 50" stroke="#e7a0b4" stroke-width="16" stroke-linecap="round"/><path d="M182 440l34 42" stroke="#f3c3d0" stroke-width="4" stroke-linecap="round"/>`;
    return m;
  };

  /* ---- 窓の外：時計店の二階から ---- */
  A.viewC = (S, pre, layer) => {
    const E = S.ended;
    if (layer === 'back') {
      let s = sky(pre, S);
      s += sakaya(S, pre, -134);
      s += `<g class="sway" data-amp="9" data-ox="470" data-oy="540"><path d="M470 540V260" stroke="#2c241c" stroke-width="16"/>`
        + [[462, 226, 80, 84, 0], [420, 270, 44, 40, 1], [510, 272, 44, 40, 1], [470, 170, 46, 40, 1]].map(([x, y, rx, ry, k]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${E ? (k ? '#4f7c43' : '#5c8a4e') : (k ? '#142019' : '#18241c')}"/>`).join('') + '</g>';
      s += rect(350, 446, 250, 94, E ? '#7a6248' : '#2a221b') + rect(348, 440, 254, 8, E ? '#5a4632' : '#1f1914');
      for (let x = 360; x < 600; x += 12) s += `<path d="M${x} 448v92" stroke="${E ? '#64503a' : '#211b15'}" stroke-width="1.5"/>`;
      if (S.f.lineB === 2 && !E) s += `<path d="M166 322L600 470" stroke="#e8e0cc" stroke-width="1.6"/>`;
      s += basketG(pre, S, 172, 316, 0.6, 640, 480, 1.4);
      return s;
    }
    let s = rect(0, 0, 600, 18, '#3a2a1a') + rect(0, 0, 20, 540, '#3a2a1a') + rect(580, 0, 20, 540, '#3a2a1a') + rect(0, 494, 600, 46, '#4a3522') + rect(0, 494, 600, 4, '#5e4630') + grain(0, 500, 600, 40, '#2e2014', 3, false, 0.5);
    s += `<path d="M300 18v476" stroke="#3a2a1a" stroke-width="6"/>`;
    for (let y = 60; y < 494; y += 48) s += `<path d="M20 ${y}h560" stroke="#3a2a1a" stroke-width="2" opacity=".8"/>`;
    s += `<g transform="translate(520 470)"><path d="M-14 24h28l-4-18h-20z" fill="#8a4a2a"/><path d="M0 6c-10-10-14-26-2-34M0 6c8-12 16-22 6-34M0 6c-2-14 4-24 0-30" stroke="#3f6a3a" stroke-width="3" fill="none"/></g>`;
    s += hsR('vc_awin', 52, 102, 226, 206, 'ソウの窓') + hsR('vc_line', 300, 330, 300, 140, '糸');
    return s;
  };

  /* ---- 部屋の箱（奥の壁・左右の壁・床・天井） ---- */
  const LW = [[0, 0], [110, 70], [110, 350], [0, 540]], RW = [[600, 0], [490, 70], [490, 350], [600, 540]];
  const FL = [[110, 350], [490, 350], [600, 540], [0, 540]], CE = [[0, 0], [600, 0], [490, 70], [110, 70]];
  const shadeDefs = (pre) => `<linearGradient id="${pre}-lw" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity=".04"/></linearGradient>`
    + `<linearGradient id="${pre}-rw" x1="1" x2="0"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity=".04"/></linearGradient>`
    + `<radialGradient id="${pre}-bw" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>`
    + `<linearGradient id="${pre}-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".24"/><stop offset=".5" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>`
    + `<linearGradient id="${pre}-ce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="${pre}-gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity=".07"/><stop offset=".9" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  // 隅の暗がり（壁と壁のつなぎめ）
  const corners = () => `<path d="M110 70V350M490 70V350" stroke="#000" stroke-opacity=".18" stroke-width="6"/><path d="M110 350H490M110 70H490" stroke="#000" stroke-opacity=".12" stroke-width="4"/>`;
  // 横の壁の高さ（奥の y → 手前の y）
  const sideY = (yb) => ((yb - 70) / 280) * 540;

  /* ---- 部屋：ソウ（和室） ---- */
  A.roomA = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    let s = `<defs>${shadeDefs(pre)}`
      + `<pattern id="${pre}-sp" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#c9b48c"/><circle cx="3" cy="4" r=".9" fill="#b39d74"/><circle cx="14" cy="9" r=".7" fill="#dac8a2"/><circle cx="8" cy="16" r=".8" fill="#b6a078"/><circle cx="19" cy="19" r=".6" fill="#d8c59e"/><circle cx="17" cy="2" r=".5" fill="#ab956d"/><circle cx="11" cy="20" r=".5" fill="#bfa982"/><circle cx="1" cy="12" r=".6" fill="#d4c098"/></pattern>`
      + `<pattern id="${pre}-tt" width="7" height="5" patternUnits="userSpaceOnUse"><rect width="7" height="5" fill="#bdb27a"/><path d="M0 1.2h7M0 3.7h7" stroke="#ada26b" stroke-width=".9"/></pattern>`
      + `<pattern id="${pre}-fs" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="#ece1c7"/><path d="M0 14a14 14 0 0 1 28 0M5 14a9 9 0 0 1 18 0M10 14a4 4 0 0 1 8 0M-14 7a14 14 0 0 1 28 0M14 7a14 14 0 0 1 28 0M-9 7a9 9 0 0 1 18 0M19 7a9 9 0 0 1 18 0" stroke="#d9cba6" fill="none" stroke-width="1"/></pattern>`
      + `<linearGradient id="${pre}-cu" x1="0" x2=".1" spreadMethod="repeat"><stop offset="0" stop-color="#5b6e8f"/><stop offset=".5" stop-color="#43557a"/><stop offset="1" stop-color="#5b6e8f"/></linearGradient>`
      + `<linearGradient id="${pre}-wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5f3b"/><stop offset="1" stop-color="#6b4729"/></linearGradient>`
      + `<linearGradient id="${pre}-fu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>`
      + `</defs>`;
    // 天井（竿縁天井）
    s += poly(CE, '#7d6649');
    for (const x of [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550]) s += `<path d="M${x} 0L${110 + (x / 600) * 380} 70" stroke="#6c5639" stroke-width="1.4"/>`;
    for (const y of [22, 48]) { const xl = (110 * y) / 70, xr = 600 - xl; s += `<path d="M${xl.toFixed(1)} ${y}H${xr.toFixed(1)}" stroke="#55432d" stroke-width="4"/><path d="M${xl.toFixed(1)} ${y + 2.5}H${xr.toFixed(1)}" stroke="#94795a" stroke-width="1"/>`; }
    s += poly(CE, `url(#${pre}-ce)`);
    // 壁（砂壁）
    s += poly(LW, `url(#${pre}-sp)`) + poly(LW, `url(#${pre}-lw)`) + poly(RW, `url(#${pre}-sp)`) + poly(RW, `url(#${pre}-rw)`);
    s += rect(110, 70, 380, 280, `url(#${pre}-sp)`) + rect(110, 70, 380, 280, `url(#${pre}-bw)`);
    // 長押・柱・畳寄せ
    s += rect(110, 90, 380, 10, `url(#${pre}-wd)`) + `<path d="M110 90.5h380" stroke="#a5805a" stroke-width="1"/><path d="M110 101h380" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`;
    s += poly([[110, 90], [110, 100], [0, sideY(100)], [0, sideY(90)]], `url(#${pre}-wd)`) + poly([[490, 90], [490, 100], [600, sideY(100)], [600, sideY(90)]], `url(#${pre}-wd)`);
    s += rect(103, 70, 8, 280, `url(#${pre}-wd)`) + rect(489, 70, 8, 280, `url(#${pre}-wd)`) + `<path d="M104.5 70v280M495.5 70v280" stroke="#a5805a" stroke-width="1" opacity=".6"/>` + grain(103, 70, 8, 280, '#4e331d', 2, true, 0.5) + grain(489, 70, 8, 280, '#4e331d', 2, true, 0.5);
    s += rect(110, 343, 380, 7, '#5a3f26') + poly([[110, 343], [110, 350], [0, 540], [0, sideY(343)]], '#5a3f26') + poly([[490, 343], [490, 350], [600, 540], [600, sideY(343)]], '#5a3f26');
    s += corners();
    // 床（畳）
    s += poly(FL, `url(#${pre}-tt)`) + poly(FL, `url(#${pre}-fl)`);
    const heri = (d) => `<path d="${d}" stroke="#36412a" stroke-width="5.5"/><path d="${d}" stroke="#5f6f47" stroke-width="1.1"/>`;
    for (const xb of [173, 300, 427]) { const xf = 300 + (xb - 300) * 2.267; s += heri(`M${xb} 350L${xf.toFixed(1)} 540`); }
    for (const y of [400, 470]) { const xl = 110 - ((y - 350) * 110) / 190; s += heri(`M${xl.toFixed(1)} ${y}H${(600 - xl).toFixed(1)}`); }
    // 丸い蛍光灯とひも
    s += `<path d="M300 0v30" stroke="#2a2a2a" stroke-width="2"/><ellipse cx="300" cy="40" rx="18" ry="5" fill="#d9d4c6"/><ellipse cx="300" cy="47" rx="50" ry="10" fill="none" stroke="#e9e5da" stroke-width="7"/><ellipse cx="300" cy="47" rx="50" ry="10" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/><ellipse cx="300" cy="47" rx="32" ry="6" fill="none" stroke="#d6d1c4" stroke-width="4"/>`;
    s += `<path d="M300 50v42" stroke="#c9c2b0" stroke-width="1"/><circle cx="300" cy="94" r="3" fill="#e8483b"/>`;
    // 押し入れ（左の壁）：ふすま
    s += poly([[20, 66], [100, 92], [100, 376], [20, 494]], '#2d2420');
    s += poly([[26, 76], [58, 87], [58, 428], [26, 480]], `url(#${pre}-fs)`) + poly([[62, 88], [94, 99], [94, 372], [62, 422]], `url(#${pre}-fs)`);
    s += poly([[26, 76], [58, 87], [58, 428], [26, 480]], `url(#${pre}-lw)`) + `<path d="M58 87v341M62 88v334" stroke="#2d2420" stroke-width="2.5"/>`;
    s += `<ellipse cx="53" cy="268" rx="3.5" ry="7" fill="#7a6236" stroke="#3b2d18"/><ellipse cx="67" cy="262" rx="3.5" ry="7" fill="#7a6236" stroke="#3b2d18"/>`;
    s += `<circle cx="40" cy="330" r="7" fill="#e8483b"/><path d="M36 330h8M40 326v8" stroke="#fff" stroke-width="1.6"/><path d="M70 196l12 4-2 8-12-4z" fill="#f3eee0" opacity=".85"/>`;
    // 時間割・スイッチ（奥の壁の右）
    s += rect(458, 114, 26, 42, '#f5f1e6') + rect(458, 114, 26, 7, '#e8c547') + `<path d="M461 128h20M461 136h20M461 144h20M461 152h20M468 121v35M475 121v35" stroke="#c4bcab" stroke-width=".8"/>`;
    s += rect(468, 194, 12, 18, '#efe9dc', 'rx="1.5"') + rect(472, 198, 4, 9, '#cfc8b8');
    // 窓
    s += rect(264, 104, 192, 168, '#4a321e') + rect(268, 108, 184, 160, '#5e4128');
    s += `<svg x="276" y="116" width="168" height="142" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewA(S, pre + 'w', 'back')}</svg>`;
    s += rect(276, 116, 168, 142, `url(#${pre}-gl)`);
    s += rect(357, 116, 6, 142, '#5e4128') + rect(363, 116, 1.5, 142, '#7a5838') + rect(276, 186, 168, 3, '#5e4128') + `<rect x="351" y="196" width="10" height="5" rx="1.5" fill="#cfc8b6"/><circle cx="356" cy="198.5" r="1.4" fill="#8a8370"/>`;
    s += `<rect class="raincv" data-r="276,116,168,142" x="276" y="116" width="168" height="142" fill="none"/>`;
    s += rect(256, 262, 208, 12, '#7a5636') + rect(256, 262, 208, 3, '#9a7650') + rect(256, 274, 208, 4, '#000', 'opacity=".22"') + grain(256, 265, 208, 9, '#4e331d', 2, false, 0.4);
    // 蚊やりぶた・マッチ
    s += `<g transform="translate(428 252)"><ellipse cx="0" cy="11" rx="18" ry="3" fill="#000" opacity=".2"/><ellipse cx="0" cy="0" rx="17" ry="12" fill="#7d8a5f"/><ellipse cx="-4" cy="-4" rx="9" ry="5" fill="#9aa87a" opacity=".6"/><ellipse cx="15" cy="0" rx="5" ry="7" fill="#6b774f"/><ellipse cx="17" cy="0" rx="2" ry="3.5" fill="#2e2e22"/><path d="M-12-9l-3-5M-4-11l0-5" stroke="#6b774f" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="-4" r="1.3" fill="#2e2e22"/><path d="M-17 0q-6 -2 -6 4" stroke="#6b774f" stroke-width="2" fill="none"/></g>`;
    if (!S.f.matchesTaken) s += rect(396, 253, 16, 9, '#d24b3c') + rect(396, 253, 16, 3, '#f0e2c4') + rect(399, 256, 8, 4, '#f6d64a');
    if (S.f.phone || S.f.canATied) s += `<g><rect x="286" y="244" width="16" height="18" rx="2" fill="#b9c0c6" stroke="#7a8288"/><path d="M287 248h14M287 256h14" stroke="#8d959b" stroke-width=".8"/><path d="M294 244L330 200" stroke="#e8e0cc" stroke-width="1"/></g>`;
    if (S.cat === 'a' && !S.ended) s += A.cat(382, 262, 0.75, 'sit');
    if (S.ended && S.ending === 'stay') s += A.cat(382, 262, 0.75, 'curl');
    // カーテンレールとカーテン
    s += rect(244, 98, 232, 5, '#cfc8b6', 'rx="2"') + `<circle cx="244" cy="100.5" r="4" fill="#a39b88"/><circle cx="476" cy="100.5" r="4" fill="#a39b88"/>`;
    if (!S.f.aCur) {
      s += rect(256, 103, 104, 168, `url(#${pre}-cu)`) + rect(360, 103, 104, 168, `url(#${pre}-cu)`) + rect(256, 103, 208, 168, `url(#${pre}-fu)`);
      s += `<path d="M256 266h208" stroke="#3a4a66" stroke-width="2"/><path d="M360 103v168" stroke="#2f3d56" stroke-width="2"/>` + Array.from({ length: 15 }, (_, i) => `<circle cx="${262 + i * 14}" cy="104" r="1.6" fill="#e9e3d2"/>`).join('');
    } else {
      s += `<path d="M248 103h38q-6 60 2 90q-10 40 -4 78h-34z" fill="url(#${pre}-cu)"/><path d="M434 103h38v168h-34q6-38 -4-78q8-30 0-90z" fill="url(#${pre}-cu)"/>`;
      s += `<path d="M248 103h38q-6 60 2 90q-10 40 -4 78h-34z" fill="url(#${pre}-fu)"/><path d="M434 103h38v168h-34q6-38 -4-78q8-30 0-90z" fill="url(#${pre}-fu)"/>`;
      s += `<path d="M250 190q20 6 38 0" stroke="#c9b48c" stroke-width="5" fill="none"/><path d="M432 190q20 6 38 0" stroke="#c9b48c" stroke-width="5" fill="none"/>`;
    }
    // 学習机：上の棚
    s += rect(120, 146, 144, 116, `url(#${pre}-wd)`) + rect(126, 152, 132, 42, '#4e331d') + rect(126, 204, 132, 58, '#5a3b22');
    const spines = ['#c0504d', '#4f81bd', '#9bbb59', '#e8c547', '#8064a2', '#f79646', '#4bacc6', '#2c4c74', '#c0504d'];
    spines.forEach((c, i) => { const h = 36 - (i % 3) * 4, x = 129 + i * 14; s += rect(x, 192 - h, 12, h, c) + rect(x, 192 - h + 5, 12, 2, '#fff', 'opacity=".45"') + rect(x + 2, 192 - h + 12, 8, 10, '#fff', 'opacity=".18"'); });
    s += rect(120, 192, 144, 4, '#7d532e');
    s += `<g transform="translate(244 136)"><path d="M-9 10h18" stroke="#555" stroke-width="2.5"/><path d="M0 10v-3" stroke="#555" stroke-width="2"/><circle r="10" fill="#4f81bd"/><path d="M-6-4q4-4 8 0t4 6M-8 3q5 2 7 6M3-9q3 2 5 0" stroke="#9bbb59" stroke-width="2.6" fill="none"/><ellipse cx="-3" cy="-4" rx="4" ry="2.5" fill="#fff" opacity=".35"/><path d="M-11-1a11 11 0 0 1 19 -7" stroke="#c9a85a" stroke-width="1.5" fill="none"/></g>`;
    s += rect(128, 196, 128, 6, '#ece8de') + rect(128, 202, 128, 2, '#9a958a');
    s += rect(134, 210, 62, 44, '#c39d6c') + Array.from({ length: 10 }, (_, i) => `<circle cx="${137 + (i * 13) % 58}" cy="${213 + (i * 7) % 38}" r=".8" fill="#9e7a4c"/>`).join('');
    s += rect(140, 214, 48, 34, '#f7f3ea') + `<path d="M140 222h48M140 230h48M140 238h48M152 214v34M164 214v34M176 214v34" stroke="#c9c1b0" stroke-width=".7"/><circle cx="164" cy="214" r="2" fill="#e8483b"/>`;
    s += `<g transform="translate(212 230) rotate(4)"><rect x="-12" y="-15" width="24" height="30" fill="#f2ede2"/><path d="M-6 6L6-8" stroke="#888" stroke-width=".8"/><path d="M6-8l4-3 2 4-4 2z" fill="#d9483b"/><circle cy="-15" r="1.8" fill="#4f81bd"/></g>`;
    // 天板とデスクマット
    s += poly([[114, 262], [270, 262], [276, 274], [108, 274]], '#9a6b3e') + poly([[124, 263], [258, 263], [262, 272], [120, 272]], '#b9c9cf', 'opacity=".35"') + rect(108, 274, 168, 7, '#7d532e') + rect(108, 274, 168, 1.5, '#a5784a');
    // 引き出し・脚
    s += rect(212, 281, 56, 66, `url(#${pre}-wd)`) + grain(212, 281, 56, 66, '#4e331d', 4, false, 0.35);
    for (const y of [300, 323]) s += `<path d="M213 ${y}h54" stroke="#4e331d" stroke-width="2"/><path d="M213 ${y + 1.5}h54" stroke="#a5784a" stroke-width=".8"/>`;
    for (const y of [290, 311, 335]) s += rect(232, y - 1.5, 16, 3, '#d9c9a0', 'rx="1.5"');
    s += `<circle cx="240" cy="296" r="1.4" fill="#3a2a1a"/>`;
    s += rect(110, 281, 12, 69, `url(#${pre}-wd)`);
    // ランドセル（机のフック）
    s += `<g transform="translate(146 286)"><path d="M-7-3v-6M7-3v-6" stroke="#333" stroke-width="2.2"/><rect x="-19" y="-3" width="38" height="46" rx="8" fill="#17171b"/><rect x="-19" y="-3" width="38" height="14" rx="6" fill="#222228"/><rect x="-15" y="10" width="30" height="30" rx="6" fill="#26262d"/><path d="M-15 20h30" stroke="#33333b" stroke-width="1"/><rect x="-3" y="22" width="6" height="9" rx="1" fill="#c9a85a"/><ellipse cx="-10" cy="10" rx="3" ry="9" fill="#fff" opacity=".1"/><path d="M-8 43v4M8 43v4" stroke="#17171b" stroke-width="3"/><rect x="10" y="26" width="7" height="7" rx="1" fill="#e8c547"/></g>`;
    // ラジオ
    s += `<g><rect x="134" y="232" width="54" height="30" rx="5" fill="#3b3f45"/><rect x="134" y="232" width="54" height="6" rx="3" fill="#4a4f56"/><path d="M142 232q19-12 38 0" stroke="#2a2d31" stroke-width="2.5" fill="none"/><path d="M146 232l-12-18" stroke="#999" stroke-width="1.4"/><circle cx="133" cy="213" r="1.6" fill="#bbb"/>`
      + `<circle cx="151" cy="249" r="10" fill="#26292d"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${151 + Math.cos(i / 12 * 6.283) * 6}" cy="${249 + Math.sin(i / 12 * 6.283) * 6}" r=".9" fill="#4a4f56"/>`).join('') + `<circle cx="151" cy="249" r="2.4" fill="#4a4f56"/>`
      + `<rect x="166" y="239" width="18" height="10" rx="1" fill="${S.f.radioOff ? '#26292d' : '#ffcf73'}" ${S.f.radioOff ? '' : 'class="dial"'}/><path d="M168 244h14" stroke="#7a5a2a" stroke-width=".6"/><path d="M174 239v10" stroke="#c0392b" stroke-width="1"/><circle cx="177" cy="255" r="3.6" fill="#777"/><circle cx="177" cy="255" r="1.2" fill="#444"/></g>`;
    // 目覚まし
    s += `<g transform="translate(209 249)"><circle cx="-7" cy="-12" r="5" fill="#c9302c"/><circle cx="7" cy="-12" r="5" fill="#c9302c"/><path d="M0-12v-4M-4-16h8" stroke="#888" stroke-width="1.5"/><circle r="11" fill="#c9302c"/><circle r="8.5" fill="#f6f1e6"/>${[0, 90, 180, 270].map((a) => `<path d="M0-7.5v1.8" stroke="#555" stroke-width="1" transform="rotate(${a})"/>`).join('')}<path d="M0 0v-6M0 0l4 2" stroke="#222" stroke-width="1.4"/><ellipse cx="-4" cy="-6" rx="3" ry="1.5" fill="#fff" opacity=".6"/><path d="M-7 10l-3 4M7 10l3 4" stroke="#7a1d1b" stroke-width="2"/></g>`;
    // 鉛筆立てとノート
    s += rect(230, 240, 13, 22, '#4f81bd', 'rx="2"') + `<path d="M233 240l-2-12M236 240v-14M240 240l3-11" stroke="#e8c547" stroke-width="2"/><path d="M231 228l0-2M236 226v-2M243 229l1-2" stroke="#d9483b" stroke-width="2"/>`;
    s += poly([[246, 262], [268, 257], [271, 261], [249, 266]], '#e9e4d8') + `<path d="M248 263l20-4" stroke="#c0504d" stroke-width="1"/>`;
    // 本棚（右）
    s += poly([[460, 250], [586, 250], [580, 256], [466, 256]], '#94693f') + rect(466, 256, 114, 138, `url(#${pre}-wd)`) + rect(472, 262, 102, 128, '#4e331d');
    for (const y of [300, 346]) s += rect(472, y, 102, 5, '#8a5f3b') + rect(472, y + 5, 102, 2, '#000', 'opacity=".25"');
    const top = ['#4f81bd', '#c0504d', '#e8c547', '#9bbb59', '#2c4c74', '#8064a2', '#f79646'];
    top.forEach((c, i) => { const h = 34 - (i % 3) * 5, x = 475 + i * 14; s += rect(x, 300 - h, 12, h, c) + rect(x, 300 - h + 4, 12, 2, '#fff', 'opacity=".4"'); });
    for (let i = 0; i < 8; i++) { const x = 475 + i * 12.5; s += rect(x, 314, 11, 32, i % 2 ? '#d9483b' : '#e0533f') + rect(x + 2, 318, 7, 9, '#fff', 'opacity=".75"') + `<text x="${x + 5.5}" y="${341}" text-anchor="middle" font-size="6" fill="#fff">${i + 1}</text>`; }
    s += rect(476, 360, 40, 26, '#5d8fc9') + rect(476, 360, 40, 6, '#e8c547') + `<text x="496" y="380" text-anchor="middle" font-size="7" fill="#fff">図鑑</text>` + rect(522, 362, 24, 24, '#9bbb59') + rect(550, 358, 20, 28, '#c0504d');
    // 貯金箱・トロフィー・ボール
    s += `<g transform="translate(503 240)"><ellipse cx="0" cy="11" rx="15" ry="2.5" fill="#000" opacity=".2"/><ellipse rx="15" ry="11" fill="#eba8ab"/><ellipse cx="-5" cy="-4" rx="7" ry="4" fill="#fff" opacity=".35"/><ellipse cx="13" cy="1" rx="4" ry="5" fill="#de9497"/><circle cx="12" cy="0" r=".9" fill="#7a4a4c"/><circle cx="14" cy="2" r=".9" fill="#7a4a4c"/><path d="M-8-9l-3-5 6 2zM2-10l2-5 3 5z" fill="#de9497"/><rect x="-4" y="-12" width="8" height="2" fill="#7a4a4c"/><circle cx="7" cy="-3" r="1.2" fill="#3a2a2a"/><path d="M-9 9v4M7 9v4" stroke="#de9497" stroke-width="3"/><path d="M-15 0q-5-2-4 3" stroke="#de9497" stroke-width="1.5" fill="none"/></g>`;
    s += `<g transform="translate(546 236)"><rect x="-8" y="10" width="16" height="5" fill="#5a3b22"/><path d="M-3 10v-4h6v4z" fill="#d6b04a"/><path d="M-8-8h16q0 12-8 14q-8-2-8-14z" fill="#e8c547"/><path d="M-8-5q-5 0-4 5M8-5q5 0 4 5" stroke="#e8c547" stroke-width="2" fill="none"/><ellipse cx="-3" cy="-4" rx="2" ry="3" fill="#fff" opacity=".5"/></g>`;
    s += `<g transform="translate(570 245)"><circle r="6" fill="#f4f1ea"/><path d="M-4-4q3 4 0 8M4-4q-3 4 0 8" stroke="#d9483b" stroke-width=".9" fill="none"/></g>`;
    // ポスター・カレンダー（右の壁）
    s += '<g transform="translate(0 40)">' + poly([[504, 40], [560, 16], [560, 94], [504, 112]], '#1c2b4a') + poly([[530, 90], [536, 32], [542, 88]], '#e9e4d8') + poly([[530, 90], [524, 100], [536, 94]], '#c0392b') + poly([[542, 88], [548, 96], [536, 94]], '#c0392b') + `<path d="M533 96q3 10 0 14" stroke="#f0a43a" stroke-width="3" fill="none"/>` + [[512, 52], [552, 34], [516, 86], [550, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('') + `<text x="508" y="106" font-size="7" fill="#e8c547" transform="rotate(-22 508 106)">うちゅうへ</text>` + poly([[502, 38], [510, 36], [510, 44], [502, 46]], '#e9e3c9', 'opacity=".8"') + '</g><g transform="translate(0 48)">';
    s += poly([[512, 118], [556, 100], [556, 178], [512, 190]], '#f3efe4') + poly([[512, 118], [556, 100], [556, 112], [512, 128]], '#c0504d') + `<text x="528" y="122" font-size="7" fill="#fff" transform="rotate(-22 528 122)">9</text>`;
    for (let i = 0; i < 5; i++) s += `<path d="M515 ${138 + i * 10}L553 ${123 + i * 10}" stroke="#c9c1b0" stroke-width=".7"/>`;
    for (let j = 1; j < 6; j++) s += `<path d="M${512 + j * 7.3} ${128 - j * 2.7}V${190 - j * 2}" stroke="#c9c1b0" stroke-width=".6"/>`;
    s += `<ellipse cx="545" cy="168" rx="6" ry="4" fill="none" stroke="#c0392b" stroke-width="1.2" transform="rotate(-22 545 168)"/><path d="M538 172l14-8M540 166l10 6" stroke="#333" stroke-width="1.4"/></g>`;
    // ふとん（手前左）
    s += `<g><ellipse cx="134" cy="530" rx="96" ry="9" fill="#000" opacity=".18"/><path d="M62 466L200 470L206 528L62 526z" fill="#c6544a"/>${[84, 108, 132, 156, 180].map((x) => `<path d="M${x} 467v60" stroke="#e8d9c0" stroke-width="7"/><path d="M${x + 3} 467v60" stroke="#f3e9d6" stroke-width="1.5"/>`).join('')}<path d="M62 470L200 474" stroke="#fff" stroke-width="2" opacity=".25"/>`
      + `<ellipse cx="62" cy="496" rx="22" ry="30" fill="#e8d9c0"/><path d="M62 476a12 18 0 1 1 -1 38a8 12 0 1 1 1 -24" stroke="#c6544a" stroke-width="3" fill="none"/><ellipse cx="204" cy="499" rx="14" ry="29" fill="#b4473e"/></g>`;
    // 座布団と、読みかけの漫画・グローブ（手前右）
    s += `<g><ellipse cx="490" cy="522" rx="80" ry="9" fill="#000" opacity=".18"/><path d="M424 478Q490 466 548 472Q566 498 562 520Q490 532 412 528Q410 500 424 478z" fill="#7a3b5a"/><path d="M432 484Q490 476 542 480Q554 498 552 514Q490 524 424 520Q422 500 432 484z" fill="none" stroke="#5e2a44" stroke-width="1.2" stroke-dasharray="3 3"/>`
      + [[424, 478], [548, 472], [562, 520], [412, 528]].map(([x, y]) => `<path d="M${x} ${y}l-4 4M${x} ${y}l4 4" stroke="#e8c547" stroke-width="2"/>`).join('')
      + `<g transform="translate(470 496) rotate(-8)"><rect x="-22" y="-14" width="44" height="28" fill="#f3efe4"/><rect x="-22" y="-14" width="22" height="28" fill="#e85a4a"/><rect x="-18" y="-10" width="14" height="10" fill="#fff" opacity=".7"/><path d="M0-14v28" stroke="#999"/></g>`
      + `<g transform="translate(528 494)"><path d="M-14 8q-4-18 6-22q4-6 10-2q6-4 10 2q6 2 4 10q2 10-8 14z" fill="#a8693a"/><path d="M-6 -12v14M0-14v14M6-12v12" stroke="#7a4a24" stroke-width="1.2"/><path d="M-12 8q12 4 20-2" stroke="#d9c9a0" stroke-width="2" fill="none"/></g></g>`;
    // 暗さ
    if (!lit) {
      const holes = [];
      let lv = 0.95;
      if (G.torchA(S)) { lv = 0.5; holes.push([300, 320, 330, 280, 1]); }
      else if (!S.f.radioOff) holes.push([160, 248, 70, 48, 0.7]);
      if (S.f.eye) { lv = Math.min(lv, 0.75); holes.push([360, 190, 140, 120, 0.8]); }
      if (S.f.aCur) holes.push([360, 187, 90, 80, 0.45]);
      s += dark(pre, lv, holes);
    }
    // さわれる所
    if (S.f.aCur) { s += hsR('a_win', 276, 116, 168, 142, '窓') + hsR('a_cur', 246, 104, 30, 166, 'カーテン') + hsR('a_cur', 444, 104, 30, 166, 'カーテン'); }
    else s += hsR('a_cur', 256, 104, 208, 166, 'カーテン');
    s += hsR('a_kayari', 394, 236, 56, 30, '蚊やりぶた');
    if (S.f.phone || S.f.canATied) s += hsR('a_phone', 282, 238, 26, 28, '糸電話の缶');
    if (S.cat === 'a' && !S.ended) s += hsR('a_cat', 362, 226, 40, 40, 'ボタン');
    s += hsR('a_radio', 130, 212, 60, 52, 'ラジオ') + hsR('a_clock', 194, 230, 32, 34, '目覚まし時計') + hsR('a_drawer', 210, 278, 60, 72, '机の引き出し');
    s += hsR('a_bag', 124, 280, 46, 54, 'ランドセル');
    s += hsP('a_oshi', [[20, 66], [100, 92], [100, 376], [20, 494]], '押し入れ');
    s += hsR('a_bank', 484, 224, 40, 30, '貯金箱') + hsR('a_shelf', 466, 256, 114, 138, '本棚') + hsP('a_cal', [[512, 166], [556, 148], [556, 226], [512, 238]], 'カレンダー') + hsP('a_poster', [[504, 80], [560, 56], [560, 134], [504, 152]], 'ポスター');
    s += hsR('a_futon', 40, 462, 182, 72, 'ふとん') + hsR('a_zabu', 410, 466, 160, 66, '座布団');
    return s;
  };

  /* ---- 部屋：イト（洋室・ひっこし前夜） ---- */
  const BOXES = {
    kit: { f: [34, 388, 134, 82], d: 12, c: '#c89a5e', label: 'だいどころ' },
    boo: { f: [50, 318, 106, 58], d: 10, c: '#c39457', label: 'ほん', on: 'kit' },
    pho: { f: [176, 404, 110, 66], d: 10, c: '#c69a60', label: 'しゃしん' },
    ito: { f: [192, 344, 78, 50], d: 8, c: '#cfa36a', label: 'いと たからもの', on: 'pho' },
  };
  const PEEK = {
    kit: (x, y, w) => rect(x + 14, y - 16, 5, 14, '#f3ead2') + rect(x + 22, y - 14, 5, 12, '#f3ead2') + rect(x + 40, y - 18, 22, 14, '#cfe0e6', 'opacity=".8" rx="3"') + rect(x + 40, y - 20, 22, 4, '#c9302c') + `<circle cx="${x + w - 30}" cy="${y - 8}" r="9" fill="#b98b4f"/>`,
    pho: (x, y) => rect(x + 12, y - 18, 40, 16, '#7a3b2e') + rect(x + 60, y - 16, 12, 14, '#222', 'rx="2"') + rect(x + 60, y - 16, 12, 4, '#555'),
    boo: (x, y) => ['#4f81bd', '#c0504d', '#e8c547', '#9bbb59', '#8064a2'].map((c, i) => rect(x + 10 + i * 12, y - 16 - (i % 2) * 3, 10, 16, c)).join(''),
    ito: (x, y) => rect(x + 10, y - 14, 14, 16, '#b9c0c6', 'rx="2"') + rect(x + 28, y - 14, 14, 16, '#b9c0c6', 'rx="2"') + rect(x + 48, y - 10, 20, 10, '#f3efe4'),
  };
  const box = (k, S, pre) => {
    const B = BOXES[k], [x, y, w, h] = B.f, d = B.d;
    if (S.f['flat_' + k]) return '';
    const open = S.f['box_' + k];
    let s = `<ellipse cx="${x + w / 2 + 4}" cy="${y + h}" rx="${w / 2 + 8}" ry="5" fill="#000" opacity=".22"/>`;
    s += rect(x, y, w, h, B.c) + rect(x, y, w, h, `url(#${pre}-cb)`) + poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], '#a87d48');
    s += `<path d="M${x} ${y + 1}h${w}M${x + w + 1} ${y}v${h}" stroke="#e0b97e" stroke-width="1" opacity=".7"/><path d="M${x} ${y + h - 1}h${w}" stroke="#8a6436" stroke-width="1.5"/>`;
    if (!open) {
      s += poly([[x, y], [x + w, y], [x + w + d, y - d], [x + d, y - d]], '#d8ad72') + `<path d="M${x + d / 2} ${y - d / 2}h${w}" stroke="#b98b4f" stroke-width="1"/>`;
      s += rect(x + w / 2 - 8, y - d, 16, h + d, '#b38449', 'opacity=".6"') + rect(x + w / 2 - 6, y - d, 2, h + d, '#fff', 'opacity=".25"') + rect(x, y + h / 2 - 6, w, 12, '#b38449', 'opacity=".55"') + rect(x, y + h / 2 - 5, w, 2, '#fff', 'opacity=".25"');
    } else {
      s += poly([[x, y], [x + w, y], [x + w + d, y - d], [x + d, y - d]], '#3e2c1a') + PEEK[k](x, y, w);
      s += poly([[x, y], [x + w * 0.5, y], [x + w * 0.42, y - 26], [x - 8, y - 20]], '#d8ad72') + poly([[x + w * 0.5, y], [x + w, y], [x + w + 14, y - 22], [x + w * 0.56, y - 28]], '#cda065');
      s += `<path d="M${x - 8} ${y - 20}l${w * 0.42 + 8} -6" stroke="#b98b4f" stroke-width="1"/>`;
    }
    s += `<text x="${x + 8}" y="${y + h - 10}" font-family="'Tsukimi Rounded', sans-serif" font-size="${k === 'ito' ? 10 : 13}" font-weight="700" fill="#2a2a2a" opacity=".85">${B.label}</text>`;
    if (k === 'kit') s += `<g fill="#7a5a32" opacity=".7"><path d="M${x + w + 4} ${y + 30}l4-6 4 6h-2.5v8h-3v-8z"/></g><text x="${x + w - 30}" y="${y + 16}" font-size="7" fill="#7a5a32" opacity=".8">天地無用</text>`;
    if (k === 'pho') s += rect(x + w - 40, y + 8, 34, 14, '#d9483b', 'rx="2"') + `<text x="${x + w - 23}" y="${y + 18}" text-anchor="middle" font-size="8" fill="#fff" font-weight="700">こわれもの</text>`;
    if (k === 'ito' && !open) s += `<text x="${x + 10}" y="${y + 16}" font-family="'Tsukimi Rounded', sans-serif" font-size="9" fill="#c0392b">あけるな！</text><path d="M${x + w - 16} ${y + 12}c-3-4-8 0-4 4l4 4 4-4c4-4-1-8-4-4z" fill="#e87a8a"/>`;
    return s;
  };
  A.roomB = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    const end = S.ended;
    let s = `<defs>${shadeDefs(pre)}`
      + `<pattern id="${pre}-wp" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#dccbb2"/><path d="M0 0v26M13 0v26" stroke="#d3c0a4" stroke-width="2"/><g transform="translate(6.5 7)"><circle r="1.6" fill="#d2a3a0"/><circle cx="2.4" r="1.2" fill="#d8b0ac"/><circle cx="-2.4" r="1.2" fill="#d8b0ac"/><circle cy="2.4" r="1.2" fill="#d8b0ac"/><circle cy="-2.4" r="1.2" fill="#d8b0ac"/><circle r=".8" fill="#e6c96e"/></g><path d="M18 19q2 -4 4 0q-2 2 -4 0z" fill="#b9b48c"/><g transform="translate(19.5 6)"><circle r="1" fill="#d8b0ac"/></g></pattern>`
      + `<pattern id="${pre}-tk" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(10)"><rect width="9" height="9" fill="#e3dccd"/><rect width="3" height="9" fill="#c7bda7"/><rect x="5" width="1" height="9" fill="#d4cab4"/></pattern>`
      + `<pattern id="${pre}-gh" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f1e6d6"/><rect width="4" height="8" fill="#e7b9b0" opacity=".6"/><rect width="8" height="4" fill="#e7b9b0" opacity=".6"/></pattern>`
      + `<linearGradient id="${pre}-wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b07a4e"/><stop offset="1" stop-color="#8f5f39"/></linearGradient>`
      + `<linearGradient id="${pre}-mr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4e3ea"/><stop offset=".45" stop-color="#93abb9"/><stop offset="1" stop-color="#6b8494"/></linearGradient>`
      + `<linearGradient id="${pre}-cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>`
      + `<linearGradient id="${pre}-cu" x1="0" x2=".09" spreadMethod="repeat"><stop offset="0" stop-color="#efe4cf"/><stop offset=".5" stop-color="#dccdb1"/><stop offset="1" stop-color="#efe4cf"/></linearGradient>`
      + `<linearGradient id="${pre}-fu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>`
      + `</defs>`;
    // 天井と回り縁
    s += poly(CE, '#b3ada3') + poly(CE, `url(#${pre}-ce)`) + `<path d="M110 72H490" stroke="#ece6da" stroke-width="5"/><path d="M0 2L110 72M600 2L490 72" stroke="#ece6da" stroke-width="4"/>`;
    // 壁紙
    s += poly(LW, `url(#${pre}-wp)`) + poly(LW, `url(#${pre}-lw)`) + poly(RW, `url(#${pre}-wp)`) + poly(RW, `url(#${pre}-rw)`);
    s += rect(110, 70, 380, 280, `url(#${pre}-wp)`) + rect(110, 70, 380, 280, `url(#${pre}-bw)`);
    // はがした写真のあと（日焼けしていない四角・テープ・画びょうの穴）
    for (const [x, y, w, h] of [[360, 92, 46, 36], [420, 86, 40, 52], [116, 120, 24, 30], [466, 150, 18, 22], [400, 140, 26, 20]]) {
      s += rect(x, y, w, h, '#ebdfc9') + rect(x, y, w, h, 'none', 'stroke="#d6c5a8" stroke-width=".8"');
      s += rect(x - 2, y - 2, 7, 4, '#efe7cc', 'opacity=".9" transform="rotate(-12 ' + x + ' ' + y + ')"') + `<circle cx="${x + w - 3}" cy="${y + 3}" r=".9" fill="#7a6a58"/>`;
    }
    s += poly([[30, 160], [80, 172], [80, 220], [30, 214]], '#e6d9c2') + `<circle cx="36" cy="166" r="1" fill="#7a6a58"/><circle cx="74" cy="176" r="1" fill="#7a6a58"/>`;
    // 巾木
    s += rect(110, 340, 380, 10, '#ece6da') + rect(110, 340, 380, 2, '#fff') + poly([[110, 340], [110, 350], [0, 540], [0, sideY(340)]], '#e2dbcd') + poly([[490, 340], [490, 350], [600, 540], [600, sideY(340)]], '#e2dbcd');
    s += corners();
    // 床（フローリング）
    s += poly(FL, '#9b7350');
    const lanes = [150, 205, 260, 315, 370, 425];
    for (const xb of lanes) { const xf = 300 + (xb - 300) * 2.267; s += `<path d="M${xb} 350L${xf.toFixed(1)} 540" stroke="#7d5838" stroke-width="2"/><path d="M${xb + 1.5} 350L${(xf + 3).toFixed(1)} 540" stroke="#b08860" stroke-width=".7"/>`; }
    const allL = [110, ...lanes, 490];
    for (let i = 0; i < allL.length - 1; i++) {
      for (const [k, yy] of [[0, 372], [1, 402], [0, 440], [1, 488], [0, 520]]) {
        if ((i + k) % 2) continue;
        const f = (yy - 350) / 190, xa = allL[i] + (300 + (allL[i] - 300) * 2.267 - allL[i]) * f, xb2 = allL[i + 1] + (300 + (allL[i + 1] - 300) * 2.267 - allL[i + 1]) * f;
        s += `<path d="M${xa.toFixed(1)} ${yy}H${xb2.toFixed(1)}" stroke="#7d5838" stroke-width="1.4"/>`;
      }
    }
    s += poly(FL, `url(#${pre}-fl)`);
    if (!end) s += `<polygon points="${pt([[156, 350], [324, 350], [380, 470], [110, 470]])}" fill="#fff" opacity=".04"/>`;
    // 吊りランプ（ギンガムのかさ）
    s += `<path d="M300 0v26" stroke="#555" stroke-width="2"/><path d="M276 46l10-18h28l10 18z" fill="url(#${pre}-gh)"/><path d="M276 46l10-18h28l10 18z" fill="url(#${pre}-fu)"/><path d="M276 46h48" stroke="#c9a3a0" stroke-width="2"/><ellipse cx="300" cy="47" rx="7" ry="3" fill="#f6f1e2"/>`;
    // 丸めたラグ（左奥のすみ）
    if (!end) s += `<g><rect x="116" y="236" width="24" height="116" rx="11" fill="#8a4b5c"/>${[250, 270, 290, 310, 330].map((y) => `<path d="M116 ${y}h24" stroke="#c9a85a" stroke-width="3"/>`).join('')}<ellipse cx="128" cy="238" rx="12" ry="5" fill="#a65e72"/><path d="M128 238a8 3 0 1 1 -.1 0" stroke="#6e3a48" fill="none"/><path d="M116 284h24M116 324h24" stroke="#e8e0cc" stroke-width="1.5"/></g>`;
    // 窓
    s += rect(144, 104, 192, 168, '#d6cfc1') + rect(148, 108, 184, 160, '#ece6da');
    s += `<svg x="156" y="116" width="168" height="142" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewB(S, pre + 'w', 'back')}</svg>`;
    s += rect(156, 116, 168, 142, `url(#${pre}-gl)`);
    s += rect(237, 116, 6, 142, '#ece6da') + rect(243, 116, 1.5, 142, '#bdb4a4') + rect(156, 186, 168, 3, '#ece6da') + `<rect x="231" y="196" width="10" height="5" rx="1.5" fill="#cfc8b6"/>`;
    if (!S.f.bLock && !end) s += `<g transform="translate(240 254)"><rect x="-7" y="-4" width="14" height="8" rx="2" fill="#c9a85a" stroke="#7d6c4b"/><circle r="1.6" fill="#5a4a2b"/></g>`;
    s += `<rect class="raincv" data-r="156,116,168,142" x="156" y="116" width="168" height="142" fill="none"/>`;
    if (end) s += `<text transform="translate(240 200) scale(-1 1)" text-anchor="middle" font-family="'Kaisei HarunoUmi', serif" font-size="30" fill="#fff" opacity=".85">またね</text>` + rect(156, 116, 168, 142, '#eef4f6', 'opacity=".25"');
    if (S.f.filmOn && !end) {
      const lt = S.aim === 'glass' && G.torchA(S);
      s += rect(168, 174, 144, 26, lt ? '#e2a25c' : '#4a2d16', 'opacity=".95"');
      for (let i = 0; i < 6; i++) s += rect(171 + i * 23.5, 178, 20, 18, lt ? '#f7d49b' : '#5d3a1d');
      for (let i = 0; i < 18; i++) s += rect(170 + i * 8, 175, 3, 2, lt ? '#fff1d6' : '#2a1a0c') + rect(170 + i * 8, 197, 3, 2, lt ? '#fff1d6' : '#2a1a0c');
      s += rect(166, 172, 10, 30, '#c9b48a', 'opacity=".85"') + rect(304, 172, 10, 30, '#c9b48a', 'opacity=".85"');
    }
    s += rect(138, 262, 204, 12, '#efe9dd') + rect(138, 262, 204, 3, '#fff') + rect(138, 274, 204, 4, '#000', 'opacity=".18"');
    if (!S.f.canTaken && !end) s += `<g transform="translate(298 252)"><ellipse cx="0" cy="10" rx="14" ry="3" fill="#000" opacity=".2"/><ellipse cx="0" cy="8" rx="13" ry="4" fill="#2e5d82"/><rect x="-13" y="-4" width="26" height="12" fill="#3d7fa8"/><rect x="-13" y="0" width="26" height="4" fill="#e9c35a"/><ellipse cx="0" cy="-4" rx="13" ry="4" fill="#5a9cc4"/><ellipse cx="-4" cy="-5" rx="5" ry="1.5" fill="#fff" opacity=".4"/><circle cx="0" cy="2" r="2.6" fill="#f4efe4"/><path d="M-1.5 1l-1-2M1.5 1l1-2" stroke="#2b2622" stroke-width=".8"/></g>`;
    if ((S.f.phone || S.f.canBTied) && !end) s += `<g><rect x="168" y="244" width="16" height="18" rx="2" fill="#b9c0c6" stroke="#7a8288"/><path d="M169 248h14M169 256h14" stroke="#8d959b" stroke-width=".8"/><path d="M176 244L210 196" stroke="#e8e0cc" stroke-width="1"/></g>`;
    if (S.f.mirror && !end) s += `<g transform="translate(320 240)"><ellipse rx="9" ry="13" fill="url(#${pre}-mr)" stroke="#e7a0b4" stroke-width="3"/></g>`;
    if (S.f.bridge && !end) s += poly([[156, 252], [176, 250], [176, 262], [150, 264]], '#b48a55');
    if (S.f.lineB === 2 && !end) s += `<path d="M240 262L250 236" stroke="#e8e0cc" stroke-width="1.5"/>`;
    if (end && S.f.lineB === 2) s += `<path d="M228 266q4 14 -2 24" stroke="#e8e0cc" stroke-width="1.5" fill="none"/><rect x="220" y="288" width="12" height="8" fill="#f3efe4" transform="rotate(10 226 292)"/>`;
    // カーテン
    s += rect(124, 98, 232, 5, '#d8d0c0', 'rx="2"') + `<circle cx="124" cy="100.5" r="4.5" fill="#c9a85a"/><circle cx="356" cy="100.5" r="4.5" fill="#c9a85a"/>`;
    if (!end) {
      if (!S.f.bCur) {
        const g = G.torchA(S) && S.aim === 'curtain';
        s += rect(136, 103, 104, 168, `url(#${pre}-cu)`) + rect(240, 103, 104, 168, `url(#${pre}-cu)`) + rect(136, 103, 208, 168, `url(#${pre}-fu)`);
        for (let i = 0; i < 26; i++) { const cx = 146 + (i * 37) % 190, cy = 118 + (i * 53) % 142; s += `<g transform="translate(${cx} ${cy})"><circle r="2.6" fill="#e3a3a8"/><circle cx="2" cy="2" r="1.5" fill="#e9b7ba"/><path d="M-3 3q-3 2-4 0" stroke="#a9b48c" stroke-width="1.2" fill="none"/></g>`; }
        s += `<path d="M136 266h208" stroke="#cbbb9c" stroke-width="2"/><path d="M240 103v168" stroke="#c4b393" stroke-width="2"/>`;
        if (g) s += `<defs><radialGradient id="${pre}-cg"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="236" cy="188" rx="90" ry="80" fill="url(#${pre}-cg)"/>`;
      } else {
        s += `<path d="M128 103h38q-6 60 2 90q-10 40 -4 78h-34z" fill="url(#${pre}-cu)"/><path d="M314 103h38v168h-34q6-38 -4-78q8-30 0-90z" fill="url(#${pre}-cu)"/>`;
        s += `<path d="M128 103h38q-6 60 2 90q-10 40 -4 78h-34z" fill="url(#${pre}-fu)"/><path d="M314 103h38v168h-34q6-38 -4-78q8-30 0-90z" fill="url(#${pre}-fu)"/>`;
        s += `<path d="M130 190q20 6 38 0M312 190q20 6 38 0" stroke="#e87a8a" stroke-width="4" fill="none"/><circle cx="149" cy="193" r="3" fill="#e87a8a"/><circle cx="331" cy="193" r="3" fill="#e87a8a"/>`;
      }
      if (!S.f.pinsTaken) s += `<g><path d="M346 103v8" stroke="#8a8070" stroke-width="1.6"/><path d="M346 111l-14 10h28z" stroke="#a7a094" stroke-width="2" fill="none"/>${[336, 346, 356].map((x, i) => `<g transform="translate(${x} 121)"><rect x="-2.5" width="5" height="14" rx="1" fill="${['#e87a7a', '#7ab8e8', '#f0d36a'][i]}"/><circle cy="5" r=".9" fill="#fff"/></g>`).join('')}</g>`;
    }
    // たたんだ段ボール（窓と鏡台のあいだ）
    if ((S.f.flat_boo || S.f.flat_ito) && !end) s += poly([[338, 262], [364, 258], [368, 346], [340, 348]], '#c89a5e') + `<path d="M342 270l2 74M350 268l2 78M358 266l2 78" stroke="#a87d48" stroke-width="1"/>` + (S.f.flat_boo && S.f.flat_ito ? poly([[344, 270], [370, 266], [372, 348], [346, 349]], '#cfa36a', 'opacity=".9"') : '');
    // 鏡台
    if (!end) {
      s += rect(372, 236, 96, 104, `url(#${pre}-wd)`) + grain(372, 240, 96, 100, '#6e4428', 5, false, 0.3) + poly([[366, 232], [474, 232], [468, 238], [372, 238]], '#c08c5e');
      for (const y of [262, 290, 318]) s += `<path d="M375 ${y}h90" stroke="#6e4428" stroke-width="2"/><path d="M375 ${y + 1.5}h90" stroke="#c9976a" stroke-width=".8"/>`;
      for (const y of [250, 276, 304, 330]) s += `<path d="M412 ${y}h16" stroke="#e3c38a" stroke-width="3" stroke-linecap="round"/>`;
      s += rect(374, 340, 8, 8, '#6e4428') + rect(458, 340, 8, 8, '#6e4428');
      s += `<path d="M384 188a36 46 0 0 1 72 0q0 4 -2 8" fill="none" stroke="#7b5232" stroke-width="2"/><ellipse cx="420" cy="188" rx="32" ry="42" fill="#7b5232"/><path d="M406 146q14-10 28 0" stroke="#9a6a40" stroke-width="3" fill="none"/>`;
      s += `<ellipse cx="420" cy="188" rx="26" ry="36" fill="url(#${pre}-mr)"/><path d="M404 168q8 -12 20 -10" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/><path d="M430 210q6 -4 8 -12" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/><path d="M410 230v6M430 230v6" stroke="#7b5232" stroke-width="4"/>`;
      s += rect(382, 220, 18, 12, '#d9b38a', 'rx="1"') + rect(382, 218, 18, 4, '#c49a6e') + `<circle cx="391" cy="226" r="1.6" fill="#8a5c38"/>` + poly([[436, 228], [458, 226], [460, 232], [438, 234]], '#5a3b22') + `<path d="M446 222l8-6" stroke="#e8c0c8" stroke-width="3" stroke-linecap="round"/>`;
    }
    // ドア（右の壁）と、柱の身長の線
    s += poly([[506, 92], [574, 58], [574, 454], [506, 394]], '#e6dfd2') + poly([[512, 96], [568, 66], [568, 448], [512, 390]], '#8c6a4a');
    s += poly([[518, 104], [562, 80], [562, 230], [518, 240]], '#7d5d40') + poly([[518, 262], [562, 254], [562, 430], [518, 382]], '#7d5d40') + `<path d="M518 104l44-24M518 262l44-8" stroke="#a58460" stroke-width="1"/>`;
    s += `<circle cx="524" cy="252" r="4.5" fill="#d9b67a"/><circle cx="523" cy="251" r="1.5" fill="#fff" opacity=".6"/><rect x="522" y="257" width="4" height="7" fill="#b8955a"/>`;
    if (!end) s += `<g transform="translate(540 150) rotate(-14)"><path d="M0 -12v4" stroke="#999" stroke-width="1"/><path d="M0 -8c-6-6-14 1-8 7l8 8 8-8c6-6-2-13-8-7z" fill="#f3d6d9" stroke="#d9a0a8"/><text x="0" y="4" text-anchor="middle" font-size="7" fill="#a3365a">いと</text></g>`;
    for (let i = 0; i < 6; i++) { const y = 330 - i * 15; s += `<path d="M504 ${y}l7 -1" stroke="#5a4a3a" stroke-width="1"/><text x="498" y="${y + 2}" text-anchor="end" font-size="5" fill="#5a4a3a" opacity=".85">${6 + i}</text>`; }
    s += `<path d="M498 206a3 3 0 1 1 0.1 0" stroke="#999" stroke-width="2" fill="none"/>`;
    if (!S.f.keyTaken && !end) s += `<g transform="translate(498 214)"><path d="M0-4v6" stroke="#bbb" stroke-width="1.5"/><circle cy="6" r="3.5" fill="none" stroke="#d9c06a" stroke-width="2"/><path d="M0 9v10l3 2M0 16h3" stroke="#d9c06a" stroke-width="2"/></g>`;
    // 段ボール
    if (!end) {
      s += box('kit', S, pre) + box('pho', S, pre) + box('boo', S, pre) + box('ito', S, pre);
      if (!S.f.cameraTaken) s += `<g transform="translate(100 ${S.f.flat_boo ? 372 : 302})"><path d="M-18-8q18-12 36 0" stroke="#3a3a3e" stroke-width="1.5" fill="none"/><rect x="-20" y="-10" width="40" height="22" rx="3" fill="#2a2a2e"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${-17 + (i % 6) * 3}" cy="${-6 + Math.floor(i / 6) * 12}" r=".6" fill="#3d3d42"/>`).join('') + `<rect x="-16" y="-14" width="12" height="5" rx="1" fill="#2a2a2e"/><rect x="-14" y="-13" width="8" height="3" fill="#7f9fb0"/><circle cx="2" cy="1" r="8" fill="#55595f"/><circle cx="2" cy="1" r="6" fill="#3a3d42"/><circle cx="2" cy="1" r="4" fill="#1b1d22"/><circle cx="0.5" cy="-0.5" r="1.4" fill="#fff" opacity=".5"/><rect x="10" y="-7" width="8" height="5" fill="#e3ebf0"/><rect x="14" y="5" width="4" height="3" fill="#c0392b"/></g>`;
    }
    // ベッド
    if (!end) {
      s += poly([[540, 368], [600, 356], [600, 404], [540, 412]], `url(#${pre}-wd)`) + `<path d="M546 372l50-10M546 384l50-10" stroke="#6e4428" stroke-width="1"/>`;
      s += poly([[352, 414], [600, 404], [600, 540], [322, 540]], `url(#${pre}-tk)`) + poly([[352, 414], [600, 404], [600, 420], [350, 430]], '#fff', 'opacity=".15"');
      s += poly([[352, 414], [600, 404], [600, 396], [356, 404]], '#8b6a4a') + `<path d="M322 540L352 414" stroke="#6e4428" stroke-width="4"/>`;
      if (!S.f.sheetTaken) s += poly([[436, 426], [520, 422], [524, 446], [432, 452]], '#f8f6f0') + `<path d="M436 436l86-3M434 444l88-3" stroke="#e0ddd4" stroke-width="1.5"/>`;
      s += `<g transform="translate(572 392)"><circle cx="-7" cy="-14" r="4" fill="#c49a6e"/><circle cx="7" cy="-14" r="4" fill="#c49a6e"/><circle cy="-8" r="9" fill="#c49a6e"/><ellipse cy="6" rx="10" ry="11" fill="#c49a6e"/><ellipse cy="-5" rx="4" ry="3" fill="#e3c9a6"/><circle cx="-3" cy="-10" r="1" fill="#2b2622"/><circle cx="3" cy="-10" r="1" fill="#2b2622"/><path d="M-6 0q6 4 12 0" stroke="#e87a8a" stroke-width="2" fill="none"/></g>`;
      if (S.cat === 'b') s += A.cat(478, 444, 0.9, 'curl');
    }
    // ランタン
    if (S.f.lantern && !end) {
      s += `<g transform="translate(318 452)"><ellipse cx="0" cy="5" rx="14" ry="3" fill="#000" opacity=".25"/><rect x="-12" y="-26" width="24" height="30" rx="5" fill="#cfe0e6" opacity=".55" stroke="#9fb6bf"/><rect x="-12" y="-28" width="24" height="5" rx="1" fill="#c9302c"/><rect x="-4" y="-16" width="8" height="18" fill="#f3ead2"/><path d="M-9-22v20" stroke="#fff" stroke-width="1.5" opacity=".5"/>`
        + (S.f.candle ? `<path class="flame" d="M0-30q6 8 0 13q-6-5 0-13z" fill="#ffcf5a"/><path d="M0-27q2 4 0 7q-2-3 0-7z" fill="#fff6d0"/>` : '<path d="M0-18v-4" stroke="#333" stroke-width="1.5"/>') + '</g>';
    }
    if (S.f.lineB === 1 && !end) s += `<g transform="translate(246 366)" class="glint"><path d="M-30 4q20-14 40 0t30-4" stroke="#e8e0cc" stroke-width="1.5" fill="none"/>${[0, 6, 12].map((d) => `<circle cx="${18 + d}" cy="${2 - d / 4}" r="4" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="${18 + d}" cy="${2 - d / 4}" r="1.2" fill="#3a2a1a"/>`).join('')}</g>`;
    // スクリーン（シーツ）
    if (S.f.screen && !end) {
      const show = lens(S) && !S.f.candle;
      s += `<path d="M156 300L406 292" stroke="#ddd" stroke-width="1.5"/><path d="M220 298h176l-6 116q-80 10 -166 0z" fill="${show ? '#d8d2c6' : '#f2eee6'}" opacity="${show ? 0.97 : 0.9}"/><path d="M250 300q4 50 -2 110M330 298q-4 60 2 112" stroke="#d9d3c6" stroke-width="2" fill="none" opacity=".6"/>`;
      if (show) s += A.projOn(S, 228, 304, 160, 104, pre + 'pb', 'b');
    }
    // 朝：がらんとした部屋
    if (end) {
      s += `<polygon points="${pt([[156, 258], [324, 258], [420, 540], [60, 540]])}" fill="#fff4d6" opacity=".35"/>`;
      s += rect(420, 330, 40, 6, '#b08a62', 'opacity=".4"') + rect(372, 336, 96, 6, '#000', 'opacity=".06"');
      for (let i = 0; i < 14; i++) s += `<circle cx="${180 + (i * 47) % 180}" cy="${300 + (i * 31) % 180}" r="1" fill="#fff" opacity=".6"/>`;
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
      if (S.f.lineB === 1) s += `<g transform="translate(246 366)" class="glint">${[0, 6, 12].map((d) => `<circle cx="${18 + d}" cy="${2 - d / 4}" r="4" fill="#d6b04a" opacity=".85"/>`).join('')}</g>`;
      if (G.beamIn(S)) {
        const tg = { boxes: [110, 330], dresser: [420, 260], ceiling: [300, 40], glass: [300, 350] }[S.aim];
        s += `<polygon points="${pt([[226, 170], [254, 170], [tg[0] + 50, tg[1] + 40], [tg[0] - 50, tg[1] - 30]])}" fill="#fffbe6" opacity=".12"/>`;
      }
    }
    // さわれる所
    if (!end) {
      if (S.f.bCur) s += hsR('b_win', 156, 116, 168, 142, '窓') + hsR('b_cur', 126, 104, 30, 166, 'カーテン') + hsR('b_cur', 324, 104, 30, 166, 'カーテン');
      else s += hsR('b_cur', 136, 104, 208, 166, 'カーテン');
      if (!S.f.pinsTaken) s += hsR('b_pins', 328, 104, 34, 40, '洗濯ばさみ');
      if (!S.f.canTaken) s += hsR('b_can', 282, 238, 32, 28, 'お菓子の缶');
      if (S.f.phone || S.f.canBTied) s += hsR('b_phone', 162, 236, 28, 30, '糸電話の缶');
      s += hsR('b_rug', 112, 230, 30, 124, '丸めたラグ');
      s += hsR('b_dresser', 368, 144, 104, 202, '鏡台') + hsP('b_door', [[506, 92], [574, 58], [574, 454], [506, 394]], 'ドア') + hsR('b_marks', 490, 250, 22, 92, 'ドアのわく') + hsR('b_door', 486, 196, 22, 44, '鍵のフック');
      s += hsR('b_bed', 340, 400, 260, 140, 'ベッド');
      if (S.f.screen) s += hsR('b_screen', 220, 296, 176, 120, 'シーツのスクリーン');
      if (S.f.lantern) s += hsR('b_lantern', 298, 414, 40, 50, 'ランタン');
      for (const k of ['kit', 'pho', 'boo', 'ito']) {
        if (S.f['flat_' + k]) continue;
        const B = BOXES[k], [x, y, w, h] = B.f, d = B.d;
        s += hsP({ kit: 'b_box1', pho: 'b_box2', boo: 'b_box3', ito: 'b_box4' }[k], [[x, y + h], [x, y - d], [x + d, y - d - (S.f['box_' + k] ? 20 : 0)], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], `段ボール「${B.label}」`);
      }
      if (!S.f.cameraTaken) s += hsR('b_camera', 76, S.f.flat_boo ? 356 : 286, 50, 30, 'カメラ');
      if (S.f.lineB === 1) s += hsR('b_string', 206, 340, 88, 46, '五円玉の糸');
      if (S.cat === 'b') s += hsR('b_cat', 446, 418, 70, 40, 'ボタン');
    }
    return s;
  };

  /* ---- 部屋：時計店の二階 ---- */
  A.roomC = (S, pre, opt = {}) => {
    const lit = opt.lit || S.ended;
    let s = `<defs>${shadeDefs(pre)}`
      + `<pattern id="${pre}-pn" width="24" height="40" patternUnits="userSpaceOnUse"><rect width="24" height="40" fill="#4f3d2c"/><path d="M0 0v40" stroke="#3a2c1f" stroke-width="2"/><path d="M8 0q3 20 0 40M16 4q-2 16 0 32" stroke="#5e4935" stroke-width=".8" fill="none"/></pattern>`
      + `<linearGradient id="${pre}-wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a3c"/><stop offset="1" stop-color="#5a412a"/></linearGradient>`
      + `</defs>`;
    s += poly(CE, '#33261a') + [140, 300, 460].map((x) => `<path d="M${x} 0L${110 + (x / 600) * 380} 70" stroke="#241a10" stroke-width="7"/>`).join('') + poly(CE, `url(#${pre}-ce)`);
    s += poly(LW, `url(#${pre}-pn)`) + poly(LW, `url(#${pre}-lw)`) + poly(RW, `url(#${pre}-pn)`) + poly(RW, `url(#${pre}-rw)`);
    s += rect(110, 70, 380, 280, `url(#${pre}-pn)`) + rect(110, 70, 380, 280, `url(#${pre}-bw)`) + rect(110, 340, 380, 10, '#3a2a1a') + corners();
    s += poly(FL, '#6b5038');
    for (const xb of [170, 240, 300, 360, 430]) { const xf = 300 + (xb - 300) * 2.267; s += `<path d="M${xb} 350L${xf.toFixed(1)} 540" stroke="#58412c" stroke-width="2"/>`; }
    s += poly(FL, `url(#${pre}-fl)`);
    // 窓（格子）
    s += rect(126, 100, 180, 168, '#2e2114') + rect(130, 104, 172, 160, '#3a2a1a');
    s += `<svg x="138" y="112" width="156" height="144" viewBox="0 30 600 470" preserveAspectRatio="xMidYMid slice">${A.viewC(S, pre + 'w', 'back')}</svg>`;
    s += rect(138, 112, 156, 144, `url(#${pre}-gl)`) + rect(214, 112, 4, 144, '#3a2a1a') + `<rect class="raincv" data-r="138,112,156,144" x="138" y="112" width="156" height="144" fill="none"/>`;
    s += rect(124, 262, 184, 10, '#4a3522');
    // 壁の時計
    s += `<g transform="translate(346 112)"><rect x="-16" y="-24" width="32" height="64" rx="3" fill="#6b4a2c"/><path d="M-16-24l16-10 16 10" fill="#5a3b22"/><circle cy="-8" r="12" fill="#ece4d2"/><path d="M0-8v-8M0-8l5 3" stroke="#222" stroke-width="1.5"/><rect x="-10" y="8" width="20" height="28" fill="#2a1a0e"/><path d="M0 8v20" stroke="#c9a85a" stroke-width="1.5"/><circle cy="30" r="4" fill="#d9b85e"/></g>`;
    for (const [x, y, r, sq] of [[396, 100, 13, 1], [338, 196, 12, 1], [390, 170, 22, 0], [342, 238, 15, 0], [394, 230, 12, 1]]) {
      s += sq ? rect(x - r, y - r, r * 2, r * 2.4, '#6b4a2c', 'rx="2"') + `<circle cx="${x}" cy="${y}" r="${r * 0.75}" fill="#ece4d2"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b4a2c"/><circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="#ece4d2"/><circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="none" stroke="#c9a85a" stroke-width="1"/>`;
      s += `<path d="M${x} ${y}v-${(r * 0.55).toFixed(1)}M${x} ${y}l${(r * 0.4).toFixed(1)} ${(r * 0.2).toFixed(1)}" stroke="#222" stroke-width="1.4"/>`;
    }
    // 柱時計
    s += rect(428, 100, 56, 246, `url(#${pre}-wd)`) + `<path d="M428 100l28-14 28 14z" fill="#4a2f1a"/>` + grain(428, 104, 56, 240, '#3a2412', 3, true, 0.4);
    s += `<circle cx="456" cy="146" r="22" fill="#2d1d10"/><circle cx="456" cy="146" r="19" fill="#efe6d2"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M456 129v3" stroke="#3a2a1a" stroke-width="1.2" transform="rotate(${i * 30} 456 146)"/>`).join('');
    const mm = S.f.cSet ? (S.time + 22 * 60) % 720 : 3 * 60 + 12;
    const ha = ((mm / 60) % 12) * 30, ma = (mm % 60) * 6;
    s += `<path d="M456 146l${(9 * Math.sin(ha * Math.PI / 180)).toFixed(1)} ${(-9 * Math.cos(ha * Math.PI / 180)).toFixed(1)}M456 146l${(15 * Math.sin(ma * Math.PI / 180)).toFixed(1)} ${(-15 * Math.cos(ma * Math.PI / 180)).toFixed(1)}" stroke="#222" stroke-width="2" stroke-linecap="round"/>`;
    s += rect(440, 184, 32, 126, '#2a1a0e') + rect(440, 184, 32, 126, 'none', 'stroke="#c9a85a" stroke-width="1.5"') + `<g class="${S.f.cWound ? 'pend' : ''}" style="transform-origin:456px 190px"><path d="M456 190v80" stroke="#c9a85a" stroke-width="2"/><circle cx="456" cy="278" r="9" fill="#d9b85e"/><circle cx="453" cy="275" r="3" fill="#fff" opacity=".4"/></g>`;
    s += `<path d="M444 188l8 0l-6 40z" fill="#fff" opacity=".06"/>`;
    // 左の壁：棚と小箱、帽子、カレンダー
    s += poly([[16, 182], [100, 168], [100, 176], [16, 192]], '#3a2a1a') + poly([[30, 150], [86, 140], [86, 170], [30, 182]], '#b5834a') + poly([[30, 150], [86, 140], [90, 136], [34, 146]], '#c99558') + `<text x="36" y="168" font-size="8" fill="#3a2a1a" transform="rotate(-9 36 168)">ソウとイトへ</text>`;
    if (S.f.cBox) s += poly([[30, 150], [86, 140], [80, 120], [26, 130]], '#c99558');
    s += rect(20, 176, 8, 14, '#cfe0e6', 'opacity=".6"') + rect(90, 160, 8, 12, '#cfe0e6', 'opacity=".6"');
    s += `<g transform="translate(70 92)"><circle r="2.5" fill="#888"/><path d="M-18 12q2-14 18-14q16 0 18 14z" fill="#6b5a44"/><path d="M-22 12h30q4 0 6 3h-36z" fill="#5a4a36"/><path d="M-14 8q10-4 22 0" stroke="#7d6a50" stroke-width="1" fill="none"/></g>`;
    s += poly([[20, 230], [70, 220], [70, 290], [20, 300]], '#efe6d0') + poly([[20, 230], [70, 220], [70, 232], [20, 242]], '#8a3324') + `<text x="30" y="270" font-size="7" fill="#3a2a1a" transform="rotate(-11 30 270)">平成6年3月</text>`;
    // 右の壁：工具の板
    s += poly([[504, 118], [560, 94], [560, 222], [504, 238]], '#7a6a52') + Array.from({ length: 20 }, (_, i) => `<circle cx="${510 + (i % 5) * 11}" cy="${126 - (i % 5) * 4.5 + Math.floor(i / 5) * 26}" r="1" fill="#4a3d2c"/>`).join('');
    s += `<path d="M514 140v40M526 134v46M538 130v34M550 126v40" stroke="#c9ccd1" stroke-width="2.5"/><rect x="511" y="174" width="6" height="16" rx="2" fill="#c0392b"/><rect x="523" y="174" width="6" height="16" rx="2" fill="#e8c547"/><path d="M536 164l-4 8M540 164l4 8" stroke="#8a8f96" stroke-width="2"/><circle cx="550" cy="196" r="6" fill="none" stroke="#c9a85a" stroke-width="2"/>`;
    // 作業台
    s += poly([[150, 330], [470, 330], [500, 362], [120, 362]], '#7a5a3c') + grain(130, 334, 360, 26, '#4e3824', 3, false, 0.4) + rect(120, 362, 380, 56, '#5f442c') + rect(256, 372, 100, 30, '#4e3824') + `<path d="M266 387h80" stroke="#3a2a1a" stroke-width="1"/><circle cx="306" cy="387" r="3" fill="#c9a85a"/>`;
    s += rect(130, 418, 12, 80, '#5f442c') + rect(478, 418, 12, 80, '#5f442c');
    s += `<g transform="translate(450 322)"><rect x="-12" y="0" width="24" height="10" fill="#555b62"/><rect x="-16" y="-8" width="10" height="10" fill="#6c737b"/><rect x="6" y="-8" width="10" height="10" fill="#6c737b"/><path d="M0 5h24" stroke="#888" stroke-width="2"/></g>`;
    s += `<g transform="translate(200 320)"><ellipse cx="0" cy="8" rx="16" ry="5" fill="#8a6a2a"/><rect x="-10" y="-6" width="20" height="14" fill="#a9852f"/><rect x="-10" y="-6" width="20" height="3" fill="#c9a85a"/><path d="M-8-6q-4-24 8-34q12 10 8 34z" fill="#e6efe9" opacity=".55"/><path d="M-4-10q-2-14 4-22" stroke="#fff" stroke-width="1.5" opacity=".5" fill="none"/>${S.f.cLamp ? '<path class="flame" d="M0-26q5 7 0 12q-5-5 0-12z" fill="#ffcf5a"/>' : ''}</g>`;
    s += poly([[276, 326], [340, 322], [346, 340], [270, 344]], '#efe6d0') + `<path d="M308 323l2 19" stroke="#c9bfa8"/>` + [0, 1, 2, 3].map((i) => `<path d="M${280 + (i % 2) * 34} ${330 + Math.floor(i / 2) * 5}h20" stroke="#8a8070" stroke-width=".7"/>`).join('');
    s += `<circle cx="380" cy="336" r="9" fill="none" stroke="#c9a85a" stroke-width="3"/><circle cx="380" cy="336" r="6" fill="#cfe0e6" opacity=".4"/><path d="M386 342l10 8" stroke="#3a2a1a" stroke-width="4"/><circle cx="420" cy="342" r="6" fill="none" stroke="#c9a85a" stroke-width="2"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M420 342l${(7 * Math.cos(i * 0.785)).toFixed(1)} ${(7 * Math.sin(i * 0.785)).toFixed(1)}" stroke="#c9a85a" stroke-width="1.5"/>`).join('');
    s += `<g transform="translate(244 336)"><ellipse cx="0" cy="6" rx="9" ry="3" fill="#000" opacity=".2"/><path d="M-7-4h14l-2 10h-10z" fill="#e9e4d8"/><path d="M7-1q5 0 4 4t-5 2" stroke="#e9e4d8" stroke-width="2" fill="none"/><ellipse cx="0" cy="-4" rx="7" ry="2" fill="#7a5a2a"/></g>`;
    // 椅子と、かけたままのカーディガン
    s += `<g transform="translate(-122 14)"><rect x="280" y="420" width="64" height="10" fill="#5a3b22"/><rect x="284" y="430" width="6" height="70" fill="#4a2f1a"/><rect x="334" y="430" width="6" height="70" fill="#4a2f1a"/><path d="M282 420v-34h60v34" fill="none" stroke="#5a3b22" stroke-width="6"/><path d="M288 384q24-8 48 0l4 40q-30 8 -56 0z" fill="#6a7a5a"/><path d="M312 382v40" stroke="#56654a" stroke-width="1.5"/>${[392, 402, 412].map((y) => `<circle cx="315" cy="${y}" r="1.5" fill="#d9c9a0"/>`).join('')}</g>`;
    s += `<g><ellipse cx="472" cy="470" rx="50" ry="18" fill="#7a3b2e"/><ellipse cx="472" cy="466" rx="42" ry="13" fill="#8d4636"/><path d="M450 462l4 2M470 466l5-1M488 462l3 3" stroke="#e8d3b0" stroke-width="1.5"/></g>`;
    if (!lit) {
      const holes = [];
      let lv = 0.95;
      if (S.f.cLamp) { lv = 0.35; holes.push([200, 330, 320, 250, 1]); }
      holes.push([216, 184, 90, 80, 0.45]);
      s += dark(pre, lv, holes);
    }
    s += hsR('c_win', 138, 112, 156, 144, '窓') + hsR('c_wall', 318, 80, 100, 176, '壁の時計') + hsR('c_clock', 426, 86, 60, 262, '柱時計');
    s += hsP('c_box', [[24, 120], [90, 130], [90, 176], [24, 186]], '小箱') + hsR('c_hat', 46, 84, 50, 30, '帽子') + hsP('c_tools', [[504, 118], [560, 94], [560, 222], [504, 238]], '工具の板') + hsR('c_lamp', 178, 276, 44, 56, '石油ランプ') + hsR('c_note', 266, 316, 84, 32, 'ノート');
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
    torch0: '<rect x="6" y="15" width="22" height="11" rx="3" fill="#b8423c"/><rect x="6" y="15" width="22" height="3" rx="1.5" fill="#d8625a"/><rect x="12" y="25" width="10" height="1.5" fill="#7a2a26"/><rect x="15" y="12" width="5" height="4" rx="1" fill="#555"/><path d="M28 13l7-3v21l-7-3z" fill="#bfc4c9"/><ellipse cx="35" cy="20.5" rx="1.6" ry="10" fill="#8a9096"/>',
    torch: '<rect x="6" y="15" width="22" height="11" rx="3" fill="#b8423c"/><rect x="6" y="15" width="22" height="3" rx="1.5" fill="#d8625a"/><rect x="15" y="12" width="5" height="4" rx="1" fill="#e8c547"/><path d="M28 13l7-3v21l-7-3z" fill="#d9dde1"/><ellipse cx="35" cy="20.5" rx="2" ry="10" fill="#fff6c8"/><path d="M37 12l3-3M37 29l3 3M38 20.5h2" stroke="#ffd85a" stroke-width="2" stroke-linecap="round"/>',
    batt: '<g><rect x="7" y="10" width="11" height="23" rx="2" fill="#2b2b2e"/><rect x="10" y="7" width="5" height="3" rx="1" fill="#c9ccd1"/><rect x="7" y="22" width="11" height="11" rx="1" fill="#d9483b"/><rect x="8" y="11" width="2" height="21" fill="#fff" opacity=".2"/><text x="12.5" y="19" text-anchor="middle" font-size="5" fill="#e8c547">単3</text></g><g transform="translate(14 0)"><rect x="7" y="10" width="11" height="23" rx="2" fill="#2b2b2e"/><rect x="10" y="7" width="5" height="3" rx="1" fill="#c9ccd1"/><rect x="7" y="22" width="11" height="11" rx="1" fill="#d9483b"/><rect x="8" y="11" width="2" height="21" fill="#fff" opacity=".2"/><text x="12.5" y="19" text-anchor="middle" font-size="5" fill="#e8c547">単3</text></g>',
    cutter: '<path d="M4 23l22-8 6 6-22 8z" fill="#f0c43c"/><path d="M4 23l22-8 2 2-22 8z" fill="#f8da6a"/><path d="M26 15l11-3-5 8z" fill="#d9dee3"/><path d="M28 14.5l2 2M31 13.5l2 2" stroke="#9aa0a6" stroke-width=".8"/><rect x="12" y="19" width="6" height="3" rx="1" fill="#333" transform="rotate(-20 15 20)"/>',
    reel: '<rect x="9" y="7" width="22" height="5" rx="1.5" fill="#9a6b3e"/><rect x="9" y="28" width="22" height="5" rx="1.5" fill="#9a6b3e"/><rect x="12" y="12" width="16" height="16" fill="#f1e8d2"/><path d="M12 14.5h16M12 17.5h16M12 20.5h16M12 23.5h16M12 26.5h16" stroke="#d9cdb0" stroke-width="1"/><path d="M28 20q6 2 9 9" stroke="#efe6d0" stroke-width="1.2" fill="none"/>',
    coins: '<g><circle cx="15" cy="19" r="9" fill="#d6b04a" stroke="#9c7c2a" stroke-width="1.2"/><circle cx="15" cy="19" r="2.8" fill="#2b2622"/><path d="M9 14q-2 5 1 10M21 14q2 5-1 10" stroke="#b38f34" stroke-width="1" fill="none"/></g><g><circle cx="26" cy="25" r="9" fill="#e0bb55" stroke="#9c7c2a" stroke-width="1.2"/><circle cx="26" cy="25" r="2.8" fill="#2b2622"/><path d="M20 20q-2 5 1 10M32 20q2 5-1 10" stroke="#b38f34" stroke-width="1" fill="none"/><ellipse cx="23" cy="20" rx="3" ry="1.5" fill="#fff" opacity=".4"/></g>',
    weighted: '<path d="M5 6q12 4 14 15" stroke="#efe6d0" stroke-width="1.6" fill="none"/>' + [[19, 24], [24, 28], [28, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#d6b04a" stroke="#9c7c2a"/><circle cx="${x}" cy="${y}" r="1.8" fill="#2b2622"/>`).join(''),
    matches: '<rect x="7" y="11" width="26" height="18" rx="1" fill="#d24b3c"/><rect x="7" y="11" width="26" height="5" fill="#f0e2c4"/><rect x="12" y="18" width="16" height="8" rx="1" fill="#f6d64a"/><circle cx="20" cy="22" r="2.5" fill="#d24b3c"/><path d="M30 8l5-4" stroke="#c8a77a" stroke-width="2"/><circle cx="35.5" cy="3.5" r="2" fill="#a32d24"/>',
    match3: '<rect x="7" y="11" width="26" height="18" rx="1" fill="#46698c"/><rect x="7" y="11" width="26" height="5" fill="#e6dccb"/><rect x="12" y="18" width="16" height="8" fill="#e6dccb" opacity=".8"/><text x="20" y="25" text-anchor="middle" font-size="6" fill="#46698c">時田</text>',
    clock: '<circle cx="13" cy="10" r="4.5" fill="#c9302c"/><circle cx="27" cy="10" r="4.5" fill="#c9302c"/><path d="M20 8v-4M16 4h8" stroke="#888" stroke-width="1.5"/><circle cx="20" cy="22" r="12" fill="#c9302c"/><circle cx="20" cy="22" r="9" fill="#f6f1e6"/><path d="M20 22v-6M20 22l4 2" stroke="#222" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="16" cy="17" rx="3" ry="1.5" fill="#fff" opacity=".7"/><path d="M13 33l-2 3M27 33l2 3" stroke="#7a1d1b" stroke-width="2"/>',
    camera: '<path d="M8 12q12-8 24 0" stroke="#555" stroke-width="1.2" fill="none"/><rect x="4" y="12" width="32" height="21" rx="3" fill="#2a2a2e"/><rect x="4" y="12" width="32" height="4" rx="2" fill="#3a3a40"/><rect x="7" y="9" width="9" height="4" rx="1" fill="#2a2a2e"/><rect x="8" y="10" width="6" height="2" fill="#7f9fb0"/><circle cx="20" cy="23" r="7.5" fill="#55595f"/><circle cx="20" cy="23" r="5.5" fill="#33363b"/><circle cx="20" cy="23" r="3.5" fill="#111"/><circle cx="18.5" cy="21.5" r="1.2" fill="#fff" opacity=".6"/><rect x="28" y="15" width="6" height="4" fill="#e3ebf0"/><rect x="30" y="27" width="4" height="3" fill="#c0392b"/>',
    photos: '<rect x="8" y="9" width="22" height="26" fill="#f7f4ec" stroke="#b9b2a4" transform="rotate(-9 19 22)"/><rect x="11" y="11" width="16" height="15" fill="#2c3e5a" transform="rotate(-9 19 22)"/><rect x="11" y="7" width="22" height="26" fill="#f7f4ec" stroke="#b9b2a4" transform="rotate(7 22 20)"/><rect x="14" y="9" width="16" height="15" fill="#3f5a78" transform="rotate(7 22 20)"/><circle cx="25" cy="13" r="3" fill="#ffd36b" transform="rotate(7 22 20)"/><path d="M14 22l5-5 4 4 3-2 4 4" stroke="#8fa9c0" stroke-width="1.2" fill="none" transform="rotate(7 22 20)"/>',
    key: '<circle cx="13" cy="20" r="7" fill="none" stroke="#d9c06a" stroke-width="3.2"/><circle cx="13" cy="20" r="2" fill="#d9c06a"/><path d="M20 20h15M30 20v6M34 20v5" stroke="#d9c06a" stroke-width="3.2" stroke-linecap="round"/><path d="M8 16a6 6 0 0 1 6-3" stroke="#fff" stroke-width="1" opacity=".6" fill="none"/>',
    catcan: '<ellipse cx="20" cy="31" rx="14" ry="4.5" fill="#2e5d82"/><rect x="6" y="14" width="28" height="17" fill="#3d7fa8"/><rect x="6" y="19" width="28" height="5" fill="#e9c35a"/><ellipse cx="20" cy="14" rx="14" ry="4.5" fill="#5a9cc4"/><ellipse cx="15" cy="13" rx="6" ry="1.5" fill="#fff" opacity=".4"/><circle cx="20" cy="27" r="3" fill="#f4efe4"/><path d="M18 26l-1-2M22 26l1-2" stroke="#2b2622" stroke-width=".8"/>',
    tin: '<ellipse cx="20" cy="31" rx="14" ry="4.5" fill="#2e5d82"/><rect x="6" y="14" width="28" height="17" fill="#3d7fa8"/><rect x="6" y="19" width="28" height="5" fill="#e9c35a"/><ellipse cx="20" cy="14" rx="14" ry="4.5" fill="#1d3f58"/><ellipse cx="20" cy="14" rx="11" ry="3" fill="#163246"/>',
    niboshi: '<path d="M5 22q15-12 30 0q-15 7-30 0z" fill="#c9ccd1"/><path d="M5 22q15-12 30 0" stroke="#9fa5ac" stroke-width="1" fill="none"/><path d="M5 22l-3-4v8z" fill="#aeb3b9"/><circle cx="31" cy="20" r="1.5" fill="#222"/><path d="M12 19q3 3 0 6M17 18q3 4 0 7" stroke="#a9aeb4" stroke-width=".8" fill="none"/><path d="M8 31q12-6 24 0" stroke="#b9bec4" stroke-width="3" fill="none" stroke-linecap="round"/>',
    pins: '<g transform="rotate(-12 13 20)"><rect x="10" y="7" width="7" height="26" rx="2" fill="#e87a7a"/><rect x="10" y="7" width="2" height="26" fill="#fff" opacity=".3"/><circle cx="13.5" cy="18" r="1.5" fill="#fff"/></g><g transform="rotate(12 27 20)"><rect x="23" y="7" width="7" height="26" rx="2" fill="#7ab8e8"/><rect x="23" y="7" width="2" height="26" fill="#fff" opacity=".3"/><circle cx="26.5" cy="18" r="1.5" fill="#fff"/></g>',
    basketItem: '<path d="M10 13l-3-7M30 13l3-7" stroke="#bbb" stroke-width="2"/><rect x="6" y="5" width="6" height="4" rx="1" fill="#e87a7a"/><rect x="28" y="5" width="6" height="4" rx="1" fill="#7ab8e8"/><rect x="6" y="13" width="28" height="20" rx="4" fill="#3d7fa8"/><rect x="6" y="17" width="28" height="4" fill="#e9c35a"/><circle cx="20" cy="27" r="3" fill="#f4efe4"/>',
    candle: '<rect x="15" y="13" width="10" height="22" rx="1" fill="#f6efd8"/><rect x="15" y="13" width="3" height="22" fill="#fff" opacity=".6"/><path d="M15 15q-1 4 1 6" stroke="#ece2c4" stroke-width="2" fill="none"/><path d="M20 13v-4" stroke="#333" stroke-width="1.4"/><ellipse cx="20" cy="35" rx="8" ry="2" fill="#000" opacity=".15"/>',
    wetmatch: '<rect x="7" y="11" width="26" height="18" rx="1" fill="#8a6a5a"/><rect x="7" y="11" width="26" height="5" fill="#bfb2a0"/><rect x="12" y="18" width="16" height="8" fill="#a99a6a" opacity=".7"/><path d="M13 30q2 4 0 6M24 30q2 4 0 6M18 31q1.5 3 0 4" stroke="#7ab8e8" stroke-width="2" stroke-linecap="round"/>',
    jar: '<rect x="10" y="8" width="20" height="6" rx="1.5" fill="#c9302c"/><path d="M10 11h20" stroke="#fff" stroke-width=".8" opacity=".4"/><rect x="9" y="14" width="22" height="21" rx="5" fill="#d6e6ec" opacity=".85" stroke="#9fb6bf"/><rect x="13" y="20" width="14" height="9" rx="1" fill="#f3efe4"/><path d="M12 16v16" stroke="#fff" stroke-width="2" opacity=".7"/>',
    lantern: '<rect x="10" y="7" width="20" height="5" rx="1.5" fill="#c9302c"/><rect x="9" y="12" width="22" height="23" rx="5" fill="#d6e6ec" opacity=".75" stroke="#9fb6bf"/><rect x="17" y="20" width="6" height="14" fill="#f6efd8"/><path d="M20 20v-3" stroke="#333" stroke-width="1.2"/><path d="M12 15v16" stroke="#fff" stroke-width="2" opacity=".6"/>',
    tape: '<circle cx="20" cy="20" r="14" fill="#b98b4f"/><circle cx="20" cy="20" r="14" fill="none" stroke="#a37840" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#efe8da"/><circle cx="20" cy="20" r="6" fill="none" stroke="#c9b48a" stroke-width="1.5"/><path d="M33 23l5 7-6 2-3-6z" fill="#c69a5c"/><path d="M9 12a12 12 0 0 1 8-4" stroke="#fff" stroke-width="1.5" opacity=".35" fill="none"/>',
    album: '<rect x="8" y="6" width="25" height="30" rx="2" fill="#7a3b2e"/><rect x="8" y="6" width="4" height="30" fill="#5e2a20"/><rect x="15" y="11" width="15" height="11" fill="#e8d9b0"/><rect x="17" y="13" width="11" height="7" fill="#9fb4c0"/><path d="M15 28h15" stroke="#c9a85a" stroke-width="1.2"/><text x="22.5" y="33" text-anchor="middle" font-size="4" fill="#e8d9b0">ALBUM</text>',
    filmcan: '<rect x="11" y="10" width="18" height="25" rx="3" fill="#222"/><rect x="11" y="8" width="18" height="6" rx="2" fill="#555"/><rect x="13" y="18" width="14" height="10" fill="#e8c547"/><text x="20" y="25" text-anchor="middle" font-size="5" fill="#222">時田</text><rect x="12" y="11" width="2" height="22" fill="#fff" opacity=".15"/>',
    film: '<rect x="3" y="12" width="34" height="16" fill="#7a3f14"/>' + Array.from({ length: 8 }, (_, i) => `<rect x="${4 + i * 4.2}" y="13" width="2" height="2" fill="#2a160a"/><rect x="${4 + i * 4.2}" y="25" width="2" height="2" fill="#2a160a"/>`).join('') + '<rect x="6" y="16" width="8" height="8" fill="#e2a25c"/><rect x="16" y="16" width="8" height="8" fill="#d99b55"/><rect x="26" y="16" width="8" height="8" fill="#e2a25c"/><path d="M8 22l3-3 2 2M18 23l2-4 3 3" stroke="#7a3f14" stroke-width=".8" fill="none"/>',
    book2: '<rect x="8" y="6" width="25" height="30" rx="2" fill="#4f81bd"/><rect x="8" y="6" width="4" height="30" fill="#3a6aa0"/><rect x="15" y="10" width="15" height="10" rx="1" fill="#fff"/><circle cx="22.5" cy="15" r="3" fill="#e8c547"/><path d="M15 25h14M15 29h10" stroke="#cfe0f2" stroke-width="1.2"/><path d="M27 6v10l2-2 2 2V6" fill="#d9483b"/>',
    lens: '<circle cx="16" cy="16" r="11" fill="#d6e8ee" opacity=".7" stroke="#2f3338" stroke-width="3"/><path d="M10 11a8 8 0 0 1 6-3" stroke="#fff" stroke-width="2" opacity=".8" fill="none"/><path d="M24 24l10 10" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/><path d="M24 24l3 3" stroke="#2f3338" stroke-width="6" stroke-linecap="round"/>',
    tincans: '<rect x="4" y="15" width="14" height="19" rx="2" fill="#b9c0c6"/><rect x="4" y="15" width="14" height="3" fill="#d6dbe0"/><rect x="22" y="15" width="14" height="19" rx="2" fill="#b9c0c6"/><rect x="22" y="15" width="14" height="3" fill="#d6dbe0"/><path d="M11 15q9-12 18 0" stroke="#efe6d0" stroke-width="1.4" fill="none" stroke-dasharray="3 2"/><text x="11" y="29" text-anchor="middle" font-size="5.5" fill="#444">そう</text><text x="29" y="29" text-anchor="middle" font-size="5.5" fill="#444">いと</text>',
    canA: '<rect x="11" y="11" width="18" height="23" rx="2" fill="#b9c0c6"/><rect x="11" y="11" width="18" height="4" fill="#d6dbe0"/><rect x="12" y="15" width="2" height="18" fill="#fff" opacity=".4"/><text x="20" y="28" text-anchor="middle" font-size="7" fill="#333">そう</text><circle cx="20" cy="34" r="1" fill="#555"/>',
    canB: '<rect x="11" y="11" width="18" height="23" rx="2" fill="#b9c0c6"/><rect x="11" y="11" width="18" height="4" fill="#d6dbe0"/><rect x="12" y="15" width="2" height="18" fill="#fff" opacity=".4"/><text x="20" y="28" text-anchor="middle" font-size="7" fill="#333">いと</text><circle cx="20" cy="34" r="1" fill="#555"/>',
    letter: '<rect x="6" y="11" width="28" height="19" rx="1" fill="#f6f1e4" stroke="#b9b0a0"/><path d="M6 11l14 10 14-10" stroke="#b9b0a0" fill="none"/><text x="12" y="28" font-size="5" fill="#5a5348">ソウへ</text><path d="M27 24c-1-1.5-3 0-1.5 1.5l1.5 1.5 1.5-1.5c1.5-1.5-.5-3-1.5-1.5z" fill="#e87a8a"/>',
    mirror: '<ellipse cx="16" cy="15" rx="11" ry="12" fill="#f3c3d0"/><ellipse cx="16" cy="15" rx="8.5" ry="9.5" fill="#cfe2ec"/><path d="M11 11q3-4 7-4" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/><path d="M23 25l9 11" stroke="#e7a0b4" stroke-width="5.5" stroke-linecap="round"/>',
    board: '<path d="M3 26l31-14 4 6-31 14z" fill="#c89a5e"/><path d="M3 26l31-14" stroke="#e0b97e" stroke-width="1"/><path d="M8 25l28-12M12 27l26-11" stroke="#a87d48" stroke-width=".8"/><path d="M7 32l31-14" stroke="#8a6436" stroke-width="1.5"/>',
    sheet: '<path d="M7 11h26v18q-13 5-26 0z" fill="#fbfaf6" stroke="#cfcac0"/><path d="M7 17h26M7 23h26" stroke="#e3dfd6" stroke-width="1.2"/><path d="M28 11v20" stroke="#e3dfd6"/>',
    winder: '<circle cx="13" cy="13" r="7" fill="none" stroke="#c9a85a" stroke-width="3.2"/><path d="M8 13h10M13 8v10" stroke="#c9a85a" stroke-width="1.6"/><path d="M18 18l15 15" stroke="#c9a85a" stroke-width="4" stroke-linecap="round"/><rect x="29" y="29" width="6" height="6" fill="#a8873f" transform="rotate(45 32 32)"/>',
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
