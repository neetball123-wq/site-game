/* =========================================================
   ヤドカリと七つの灯台 — 絵（アイコン・海図・びんの中のクレヨン画）
   ========================================================= */
window.YA = (() => {
  'use strict';

  /* ---------- アイコン ---------- */
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 7H4V2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 7.2A8 8 0 1 1 5 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19 2v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    conch: '<svg viewBox="0 0 48 48"><path d="M19 25L4 41q1 4 5 3l19-11z" fill="#f2d3bb" stroke="#8e5a43" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 35l4 4M14 30l5 5" stroke="#c98d70" stroke-width="1.8" stroke-linecap="round"/><circle cx="30" cy="20" r="14" fill="#f7e2cf" stroke="#8e5a43" stroke-width="2.2"/><path d="M30 20m-3 0a3 3 0 1 1 6 0a6.5 6.5 0 1 1-13 0a10 10 0 1 1 20 0" fill="none" stroke="#c98d70" stroke-width="2.2" stroke-linecap="round"/><path d="M37 32q8-4 8-13" fill="none" stroke="#e39a7c" stroke-width="3.4" stroke-linecap="round"/></svg>',
    gull: '<svg viewBox="0 0 48 48"><ellipse cx="22" cy="30" rx="14" ry="9" fill="#fff" stroke="#46545e" stroke-width="2"/><circle cx="33" cy="21" r="7" fill="#fff" stroke="#46545e" stroke-width="2"/><path d="M39 21l7 2-7 2z" fill="#f2b33d" stroke="#b27a14" stroke-width="1.2"/><circle cx="35" cy="19.5" r="1.4" fill="#222"/><path d="M10 27c4-6 12-7 18-4-6 2-11 5-13 9z" fill="#c9d3da" stroke="#46545e" stroke-width="1.6"/><path d="M18 39v5M25 39v5" stroke="#f2b33d" stroke-width="2" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="2"/></svg>',
    bottle: '<svg viewBox="0 0 24 40"><rect x="9" y="1" width="6" height="5" rx="1" fill="#b9854e"/><path d="M8.5 6h7v5c4 2 6 5 6 9v14a4 4 0 0 1-4 4h-11a4 4 0 0 1-4-4V20c0-4 2-7 6-9z" fill="rgba(150,210,200,.55)" stroke="#5c8f88" stroke-width="1.6"/><rect x="7" y="18" width="10" height="12" rx="1" fill="#fbf2dc" transform="rotate(-8 12 24)"/></svg>',
    lamp: (on) => `<svg viewBox="0 0 24 32"><path d="M8 30l1.5-18h5L16 30z" fill="#f4efe6" stroke="#6b7680" stroke-width="1.2"/><path d="M8.7 22h6.6l.4 4H8.3z" fill="#c9493b"/><rect x="7" y="7" width="10" height="5" fill="${on ? '#ffd46b' : '#8fa3ad'}" stroke="#39424a" stroke-width="1.2"/><path d="M6 7l6-5 6 5z" fill="#39424a"/>${on ? '<circle cx="12" cy="9.5" r="9" fill="#ffd46b" opacity=".28"/>' : ''}</svg>`,
    shell: '<svg viewBox="0 0 24 24"><path d="M12 3C6 3 2 8 2 14l10 7 10-7c0-6-4-11-10-11z" fill="#f7d7c6" stroke="#b56d56" stroke-width="1.4"/><path d="M12 21V4M12 21L6 5M12 21l6-16M12 21L3 10M12 21l9-11" stroke="#d99a83" stroke-width="1.1" fill="none"/></svg>',
    glass: '<svg viewBox="0 0 24 24"><path d="M12 3l7 7-3 9-9 1-4-9z" fill="rgba(110,215,195,.85)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9.5" cy="9" r="1.6" fill="#fff"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ---------- 小さな乱数（絵が毎回同じになるように） ---------- */
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- クレヨンの道具 ---------- */
  const DEFS = (id) => `<defs>
    <filter id="${id}-c" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="9" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.1" result="ga"/>
      <feComposite in="d" in2="ga" operator="in"/>
    </filter>
    <filter id="${id}-p"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 0.08 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>`;

  // 塗りつぶし：ぐしゃぐしゃの往復線
  function scrib(x, y, w, h, col, o) {
    o = o || {}; const r = rng(o.seed || (x * 7 + y * 13 + w)); const step = o.step || 7, sw = o.sw || 7;
    let d = `M${x} ${y + r() * step}`; let up = false;
    for (let xx = x; xx <= x + w; xx += step * (0.7 + r() * 0.6)) {
      d += ` L${xx.toFixed(1)} ${(up ? y + r() * 4 : y + h - r() * 4).toFixed(1)}`; up = !up;
    }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.op || 0.85}"${o.clip ? ` clip-path="url(#${o.clip})"` : ''}/>`;
  }
  function scribH(x, y, w, h, col, o) {
    o = o || {}; const r = rng(o.seed || (x * 5 + y * 11 + h)); const step = o.step || 7, sw = o.sw || 7;
    let d = `M${x + r() * step} ${y}`; let lf = false;
    for (let yy = y; yy <= y + h; yy += step * (0.7 + r() * 0.6)) { d += ` L${(lf ? x + r() * 4 : x + w - r() * 4).toFixed(1)} ${yy.toFixed(1)}`; lf = !lf; }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.op || 0.85}"${o.clip ? ` clip-path="url(#${o.clip})"` : ''}/>`;
  }
  const line = (d, col, sw, op) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw || 5}" stroke-linecap="round" stroke-linejoin="round" opacity="${op || 0.95}"/>`;
  const fillShape = (d, col, op) => `<path d="${d}" fill="${col}" opacity="${op || 0.85}"/>`;
  const txt = (x, y, s, size, col, rot) => `<text x="${x}" y="${y}" font-family="Yomogi, 'Klee One', cursive" font-size="${size}" fill="${col}" transform="rotate(${rot || 0} ${x} ${y})">${s}</text>`;

  // ひとびと（子どもの絵）
  function grandpa(x, y, s, o) {
    o = o || {}; const k = s / 100;
    const P = (a, b) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`;
    return [
      fillShape(`M${P(-24, 10)} L${P(24, 10)} L${P(30, 80)} L${P(-30, 80)}Z`, o.coat || '#3d5f9a', 0.8),
      line(`M${P(-24, 10)} L${P(24, 10)} L${P(30, 80)} L${P(-30, 80)}Z`, '#27406e', 4),
      line(`M${P(-12, 80)} L${P(-14, 110)} M${P(12, 80)} L${P(14, 110)}`, '#4a3a2e', 6),
      line(`M${P(-24, 18)} L${P(-48, 44 + (o.wave ? -40 : 0))} M${P(24, 18)} L${P(46, 46)}`, '#27406e', 6),
      `<circle cx="${x}" cy="${y - 12 * k}" r="${22 * k}" fill="#f6d2b0" stroke="#b8805a" stroke-width="4" opacity=".95"/>`,
      fillShape(`M${P(-18, -6)} Q${P(0, 30)} ${P(18, -6)} Q${P(0, 6)} ${P(-18, -6)}Z`, '#e8e8e8', 0.95),
      line(`M${P(-18, -6)} Q${P(0, 30)} ${P(18, -6)}`, '#9a9a9a', 3),
      `<circle cx="${x - 8 * k}" cy="${y - 18 * k}" r="${3 * k}" fill="#222"/><circle cx="${x + 8 * k}" cy="${y - 18 * k}" r="${3 * k}" fill="#222"/>`,
      fillShape(`M${P(-26, -26)} L${P(26, -26)} L${P(20, -44)} L${P(-20, -44)}Z`, '#1f2c4d', 0.95),
      fillShape(`M${P(-32, -24)} L${P(32, -24)} L${P(28, -30)} L${P(-28, -30)}Z`, '#111a30', 0.95),
      `<circle cx="${x}" cy="${y - 36 * k}" r="${4 * k}" fill="#f2c94c"/>`,
    ].join('');
  }
  function girl(x, y, s, o) {
    o = o || {}; const k = s / 100; const P = (a, b) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`;
    const dress = o.dress || '#e0564a';
    return [
      fillShape(`M${P(-6, 8)} L${P(6, 8)} L${P(26, 62)} L${P(-26, 62)}Z`, dress, 0.85),
      line(`M${P(-6, 8)} L${P(6, 8)} L${P(26, 62)} L${P(-26, 62)}Z`, '#a3322a', 3.5),
      line(`M${P(-9, 62)} L${P(-10, 88)} M${P(9, 62)} L${P(10, 88)}`, '#4a3a2e', 5),
      line(`M${P(-5, 16)} L${P(-30, 36 + (o.wave ? -34 : 0))} M${P(5, 16)} L${P(30, 30 + (o.reach ? 8 : 0))}`, '#a3322a', 5),
      `<circle cx="${x}" cy="${y - 10 * k}" r="${18 * k}" fill="#f6d2b0" stroke="#b8805a" stroke-width="3.5"/>`,
      fillShape(`M${P(-19, -12)} Q${P(0, -40)} ${P(19, -12)} Q${P(10, -22)} ${P(-19, -12)}Z`, '#3b2a20', 0.95),
      `<circle cx="${x - 24 * k}" cy="${y - 8 * k}" r="${7 * k}" fill="#3b2a20"/><circle cx="${x + 24 * k}" cy="${y - 8 * k}" r="${7 * k}" fill="#3b2a20"/>`,
      `<circle cx="${x - 6 * k}" cy="${y - 10 * k}" r="${2.6 * k}" fill="#222"/><circle cx="${x + 6 * k}" cy="${y - 10 * k}" r="${2.6 * k}" fill="#222"/>`,
      line(`M${P(-6, -1)} Q${P(0, 5)} ${P(6, -1)}`, '#b8452f', 3),
      o.hat ? fillShape(`M${P(-22, -24)} L${P(22, -24)} L${P(17, -40)} L${P(-17, -40)}Z`, '#1f2c4d', 0.95) + fillShape(`M${P(-27, -22)} L${P(27, -22)} L${P(24, -28)} L${P(-24, -28)}Z`, '#111a30', 0.95) + `<circle cx="${x}" cy="${y - 33 * k}" r="${3.5 * k}" fill="#f2c94c"/>` : '',
    ].join('');
  }
  function woman(x, y, s, o) {
    o = o || {}; const k = s / 100; const P = (a, b) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`;
    return [
      fillShape(`M${P(-14, 6)} L${P(14, 6)} L${P(24, 86)} L${P(-24, 86)}Z`, '#e7dcc4', 0.9),
      line(`M${P(-14, 6)} L${P(14, 6)} L${P(24, 86)} L${P(-24, 86)}Z`, '#8f7f63', 3.5),
      fillShape(`M${P(-14, 6)} L${P(14, 6)} L${P(16, 40)} L${P(-16, 40)}Z`, '#3d5f9a', 0.85),
      line(`M${P(-9, 86)} L${P(-10, 118)} M${P(9, 86)} L${P(10, 118)}`, '#4a3a2e', 5),
      line(`M${P(-14, 14)} L${P(-34, 52)} M${P(14, 14)} L${P(36, 30)}`, '#3d5f9a', 5.5),
      fillShape(`M${P(-20, -8)} Q${P(-24, 26)} ${P(-10, 30)} L${P(10, 30)} Q${P(24, 26)} ${P(20, -8)}Z`, '#3b2a20', 0.9),
      `<circle cx="${x}" cy="${y - 12 * k}" r="${17 * k}" fill="#f6d2b0" stroke="#b8805a" stroke-width="3"/>`,
      `<circle cx="${x - 6 * k}" cy="${y - 13 * k}" r="${2.3 * k}" fill="#222"/><circle cx="${x + 6 * k}" cy="${y - 13 * k}" r="${2.3 * k}" fill="#222"/>`,
      line(`M${P(-6, -4)} Q${P(0, 2)} ${P(6, -4)}`, '#b8452f', 2.8),
      fillShape(`M${P(-24, -24)} L${P(24, -24)} L${P(18, -42)} L${P(-18, -42)}Z`, '#1f2c4d', 0.95),
      fillShape(`M${P(-30, -22)} L${P(30, -22)} L${P(26, -28)} L${P(-26, -28)}Z`, '#111a30', 0.95),
      `<circle cx="${x}" cy="${y - 34 * k}" r="${3.8 * k}" fill="#f2c94c"/>`,
    ].join('');
  }
  function crabC(x, y, s, o) {
    o = o || {}; const k = s / 100; const P = (a, b) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`;
    const star = (cx, cy, R) => { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.45 : R, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1); } return d + 'Z'; };
    return [
      line(`M${P(10, 10)} L${P(30, 30)} M${P(20, 6)} L${P(42, 22)} M${P(-6, 12)} L${P(-20, 32)}`, '#c8432c', 5),
      `<ellipse cx="${x + 26 * k}" cy="${y}" rx="${22 * k}" ry="${14 * k}" fill="#e0563a" opacity=".9"/>`,
      `<ellipse cx="${x + 50 * k}" cy="${y + 4 * k}" rx="${12 * k}" ry="${9 * k}" fill="#e0563a" stroke="#a3322a" stroke-width="3"/>`,
      line(`M${P(28, -12)} L${P(30, -34)} M${P(40, -10)} L${P(44, -32)}`, '#a3322a', 4),
      `<circle cx="${x + 30 * k}" cy="${y - 36 * k}" r="${6 * k}" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="${x + 44 * k}" cy="${y - 34 * k}" r="${6 * k}" fill="#fff" stroke="#222" stroke-width="2"/>`,
      `<circle cx="${x + 31 * k}" cy="${y - 36 * k}" r="${2.6 * k}" fill="#222"/><circle cx="${x + 45 * k}" cy="${y - 34 * k}" r="${2.6 * k}" fill="#222"/>`,
      `<path d="M${P(20, 8)} C${P(28, -30)} ${P(-10, -56)} ${P(-34, -34)} C${P(-50, -18)} ${P(-40, 10)} ${P(-18, 14)}Z" fill="#f4b99c" stroke="#a45a44" stroke-width="4" opacity=".95"/>`,
      line(`M${P(-12, -6)} Q${P(-26, -26)} ${P(-4, -32)} Q${P(12, -30)} ${P(6, -14)}`, '#c77a62', 3.5),
      o.nostar ? '' : `<path d="${star(x - 6 * k, y - 8 * k, 11 * k)}" fill="#ffd13b" stroke="#d99a12" stroke-width="2"/>`,
    ].join('');
  }
  function tower(x, y, s, o) {
    o = o || {}; const k = s / 100; const P = (a, b) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`;
    return [
      o.lit ? `<path d="M${P(0, -82)} L${P(-170, -120)} L${P(-170, -44)}Z M${P(0, -82)} L${P(170, -120)} L${P(170, -44)}Z" fill="#ffe27a" opacity=".55"/>` : '',
      fillShape(`M${P(-24, 0)} L${P(-16, -70)} L${P(16, -70)} L${P(24, 0)}Z`, '#fbfbf5', 0.95),
      fillShape(`M${P(-20.5, -30)} L${P(-18.3, -48)} L${P(18.3, -48)} L${P(20.5, -30)}Z`, '#d9443a', 0.9),
      fillShape(`M${P(-23.4, -4)} L${P(-22.2, -16)} L${P(22.2, -16)} L${P(23.4, -4)}Z`, '#d9443a', 0.9),
      line(`M${P(-24, 0)} L${P(-16, -70)} L${P(16, -70)} L${P(24, 0)}`, '#555', 3.5),
      `<rect x="${x - 13 * k}" y="${y - 90 * k}" width="${26 * k}" height="${20 * k}" fill="${o.lit ? '#ffd84a' : '#9fb3bd'}" stroke="#333" stroke-width="3"/>`,
      fillShape(`M${P(-18, -90)} L${P(0, -106)} L${P(18, -90)}Z`, '#333', 0.95),
    ].join('');
  }
  function sea(y, w, col, seed) { return scrib(0, y, w, 400 - y, col || '#5ab4d6', { seed: seed || 3, step: 9, sw: 9, op: 0.55 }) + line(`M0 ${y} ${Array.from({ length: 12 }, (_, i) => `Q${i * 80 + 20} ${y - 12} ${i * 80 + 40} ${y} T${i * 80 + 80} ${y}`).join(' ')}`, '#2f86b8', 4); }
  function sun(x, y, r) { let rays = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; rays += `M${(x + Math.cos(a) * r * 1.3).toFixed(1)} ${(y + Math.sin(a) * r * 1.3).toFixed(1)} L${(x + Math.cos(a) * r * 1.8).toFixed(1)} ${(y + Math.sin(a) * r * 1.8).toFixed(1)} `; } return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc93c" opacity=".9"/>` + line(rays, '#f2a51a', 5); }
  function paper(id, inner, o) {
    o = o || {};
    return `<svg viewBox="0 0 600 420" class="kureyon" role="img" aria-label="${o.label || 'クレヨンの絵'}">${DEFS(id)}
      <rect width="600" height="420" fill="${o.bg || '#fbf6ea'}"/><rect width="600" height="420" filter="url(#${id}-p)" fill="#fff"/>
      <g filter="url(#${id}-c)">${inner}</g></svg>`;
  }

  /* ---------- びんの中の絵 ---------- */
  const PICS = [
    { age: '7さい', cap: 'じいちゃんと ほしのヤドカリ', draw: (id) => paper(id, [
      scrib(0, 0, 600, 190, '#9ed3f0', { seed: 1, step: 10, sw: 10, op: 0.5 }), sun(520, 70, 34),
      sea(250, 600, '#5ab4d6', 5),
      scrib(0, 220, 360, 40, '#e9cf8f', { seed: 6, step: 8, sw: 9, op: 0.8 }),
      tower(90, 230, 120, {}),
      grandpa(230, 130, 90),
      girl(340, 160, 80, { reach: true }),
      line('M370 190 L398 214', '#6b4a2b', 5), `<circle cx="400" cy="216" r="6" fill="#ffd13b"/>`,
      crabC(430, 238, 60),
      txt(40, 390, 'じいちゃんと ほしのヤドカリ', 34, '#2c3e70', -2), txt(470, 395, 'みお 7さい', 24, '#c0392b', -3),
    ].join(''), { label: 'じいちゃんとヤドカリと女の子のクレヨン画' }) },
    { age: '8さい', cap: 'またね なつやすみ', draw: (id) => paper(id, [
      scrib(0, 0, 600, 200, '#bfe3f5', { seed: 2, step: 11, sw: 10, op: 0.5 }),
      sea(210, 600, '#4fa6d0', 8),
      fillShape('M40 210 Q120 150 230 210Z', '#8cc46b', 0.85), tower(120, 190, 80, {}), grandpa(190, 150, 50, { wave: true }), crabC(60, 205, 30),
      fillShape('M330 250 L540 250 L510 290 L360 290Z', '#e9e1d0', 0.95), line('M330 250 L540 250 L510 290 L360 290Z', '#555', 4),
      `<rect x="400" y="215" width="70" height="35" fill="#e0564a" opacity=".9"/>`, line('M470 215 L470 180 L500 190', '#555', 4),
      girl(430, 200, 45, { wave: true }),
      line('M60 120 q10 -10 20 0 q10 -10 20 0 M300 90 q8 -8 16 0 q8 -8 16 0', '#555', 3.5),
      txt(40, 385, 'またね！ なつやすみに くるね', 34, '#2c3e70', 1), txt(470, 395, 'みお 8さい', 24, '#c0392b', -2),
    ].join(''), { label: 'フェリーから手をふる女の子のクレヨン画' }) },
    { age: '9さい', cap: 'とうだいの ひかり ぐるぐる', draw: (id) => paper(id, [
      scrib(0, 0, 600, 260, '#26335f', { seed: 4, step: 8, sw: 11, op: 0.85 }),
      ...Array.from({ length: 14 }, (_, i) => { const r = rng(i + 30); return `<path d="M${(r() * 580).toFixed(0)} ${(r() * 200).toFixed(0)} l4 10 l10 2 l-8 6 l2 10 l-8 -6 l-8 6 l2 -10 l-8 -6 l10 -2z" fill="#ffe27a" opacity=".9"/>`; }),
      sea(270, 600, '#2b5d8c', 9),
      fillShape('M120 290 Q250 210 380 290Z', '#4a6b3a', 0.9),
      tower(250, 250, 150, { lit: true }),
      girl(330, 230, 45, {}), grandpa(180, 222, 55, {}), crabC(250, 270, 26),
      txt(40, 390, 'とうだいの ひかり ぐるぐる', 34, '#fff3c4', -1), txt(470, 395, 'みお 9さい', 24, '#ffb3a8', -2),
    ].join(''), { label: '夜の灯台のクレヨン画', bg: '#e8e4d8' }) },
    { age: '11さい', cap: 'ここからは みえない', draw: (id) => paper(id, [
      scrib(0, 0, 600, 300, '#c9ccd6', { seed: 5, step: 12, sw: 10, op: 0.5 }),
      ...[[20, 90, 70, 210], [100, 40, 80, 260], [190, 120, 60, 180], [410, 60, 90, 240], [510, 110, 70, 190]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${['#8e96a8', '#747d92', '#9aa1b1', '#7a8397', '#8b93a6'][i]}" opacity=".85"/>` + Array.from({ length: 6 }, (_, k) => `<rect x="${x + 10 + (k % 2) * (w / 2 - 6)}" y="${y + 18 + Math.floor(k / 2) * 40}" width="${w / 2 - 20}" height="18" fill="#f4e8a8" opacity=".85"/>`).join('')),
      `<rect x="260" y="130" width="130" height="120" fill="#f6efe0" stroke="#6b4a2b" stroke-width="6"/>`, line('M325 130 L325 250 M260 190 L390 190', '#6b4a2b', 4),
      scrib(265, 205, 120, 40, '#7bbde0', { seed: 12, step: 6, sw: 6, op: 0.7 }), `<circle cx="352" cy="200" r="3" fill="#ffd84a"/>`,
      girl(320, 300, 60, { dress: '#3d5f9a' }),
      txt(30, 390, 'ここからは みえない', 36, '#2c3e70', -1), txt(460, 395, 'みお 11さい', 24, '#c0392b', -2),
    ].join(''), { label: '町の窓から海をさがす女の子のクレヨン画' }) },
    { age: '13さい', cap: 'レンズをみがく じいちゃん', draw: (id) => paper(id, [
      `<circle cx="300" cy="180" r="120" fill="none" stroke="#6d6d6d" stroke-width="5" opacity=".8"/>`,
      ...Array.from({ length: 7 }, (_, i) => `<ellipse cx="300" cy="180" rx="${110 - i * 14}" ry="${110 - i * 14}" fill="none" stroke="#8a8a8a" stroke-width="3" opacity="${0.35 + i * 0.05}"/>`),
      scrib(230, 110, 140, 140, '#fff2b0', { seed: 13, step: 6, sw: 5, op: 0.5 }),
      line('M130 330 Q170 250 230 240 Q250 236 262 250 M470 330 Q430 250 370 240 Q350 236 338 252', '#7a5b45', 6),
      line('M255 250 q-10 -30 10 -40 q20 -6 30 20 M345 252 q10 -30 -10 -40 q-20 -6 -30 20', '#7a5b45', 5),
      scribH(262, 208, 76, 36, '#e3e3e3', { seed: 16, step: 5, sw: 5, op: 0.8 }),
      txt(40, 395, 'レンズをみがく じいちゃんの手', 32, '#555', -1), txt(460, 398, 'みお 13さい', 22, '#777', -2),
    ].join(''), { label: '灯台のレンズを磨く手の鉛筆画', bg: '#f3f1ea' }) },
    { age: '16さい', cap: 'はやく げんきになってね', draw: (id) => paper(id, [
      `<rect x="70" y="40" width="460" height="260" fill="#eef4f6" stroke="#9fb3bd" stroke-width="6"/>`,
      line('M300 40 L300 300 M70 170 L530 170', '#9fb3bd', 5),
      scrib(80, 50, 210, 110, '#a9d6ee', { seed: 21, step: 9, sw: 8, op: 0.55 }), scrib(310, 50, 210, 110, '#a9d6ee', { seed: 22, step: 9, sw: 8, op: 0.55 }),
      scrib(80, 180, 440, 110, '#6cb2d8', { seed: 23, step: 9, sw: 8, op: 0.6 }),
      tower(420, 190, 60, {}),
      fillShape('M40 330 L560 330 L560 380 L40 380Z', '#f2f2f2', 0.9), line('M40 330 L560 330', '#999', 4),
      `<path d="M120 318 q10 -30 30 -10 q20 -20 30 10 q-20 30 -30 30 q-10 0 -30 -30z" fill="#f28fa0" opacity=".9"/>`,
      crabC(470, 322, 30),
      txt(40, 405, 'じいちゃん、はやく げんきになってね', 30, '#2c3e70', -1), txt(470, 408, 'みお 16さい', 20, '#c0392b', -2),
    ].join(''), { label: '病院の窓から見える海と灯台の絵' }) },
  ];
  // 最後の一枚（エンディング）
  const LAST = { age: '24さい', cap: 'ただいま', draw: (id) => paper(id, [
    scrib(0, 0, 600, 250, '#1f2d5a', { seed: 31, step: 8, sw: 11, op: 0.85 }),
    ...Array.from({ length: 18 }, (_, i) => { const r = rng(i + 50); return `<circle cx="${(r() * 590).toFixed(0)}" cy="${(r() * 200).toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="#fff4c0"/>`; }),
    sea(260, 600, '#2b5d8c', 32),
    ...[[40, 235, 34], [110, 246, 30], [180, 240, 32], [420, 244, 30], [490, 238, 32], [555, 246, 28]].map(([x, y, s]) => tower(x, y, s, { lit: true })),
    fillShape('M200 300 Q300 220 420 300Z', '#3d5e36', 0.9), tower(310, 270, 110, { lit: true }),
    woman(250, 250, 62, {}), crabC(340, 318, 34),
    txt(40, 395, 'ただいま。ほしのヤドカリ', 36, '#fff3c4', -1), txt(470, 398, 'みお 24さい', 22, '#ffb3a8', -2),
  ].join(''), { label: '七つの灯台が灯った夜の絵', bg: '#e8e4d8' }) };
  // 星砂の島のびん（じいちゃんの絵）
  const OLD = { age: '', cap: 'いつか かえってくる みおへ', draw: (id) => paper(id, [
    scrib(0, 0, 600, 230, '#c6e3ef', { seed: 41, step: 14, sw: 7, op: 0.45 }),
    sea(240, 600, '#6fb6d4', 42),
    fillShape('M60 260 Q300 180 540 260Z', '#b9c98a', 0.8),
    line('M150 210 q5 -40 25 -40 q20 0 20 40 M175 170 v-12 M168 180 h14 M160 212 h40', '#333', 3),
    line('M300 205 q-6 -30 14 -34 q20 4 14 34 M300 205 h28 M314 171 q-4 -10 6 -14', '#333', 3),
    crabC(420, 220, 34),
    txt(60, 380, 'いつか かえってくる みおへ', 32, '#333', 0), txt(420, 400, '灯台守 じいちゃん', 22, '#333', 0),
  ].join(''), { label: 'じいちゃんの描いたへたな絵', bg: '#f6f1e2' }) };

  /* ---------- 海図 ---------- */
  const SPOTS = [
    { x: 150, y: 520 }, { x: 330, y: 470 }, { x: 250, y: 330 }, { x: 440, y: 250 }, { x: 640, y: 330 }, { x: 760, y: 190 }, { x: 900, y: 100 }, { x: 870, y: 520 },
  ];
  const BLOB = [
    'M-60 10 C-58 -30 -10 -48 30 -38 C62 -30 70 0 58 22 C44 46 -8 50 -34 40 C-50 34 -61 24 -60 10Z',
    'M-54 -4 C-46 -34 6 -44 42 -28 C66 -16 62 20 36 34 C6 48 -42 40 -52 20Z',
    'M-40 -30 C-10 -52 48 -40 56 -8 C62 18 36 40 4 42 C-30 44 -62 24 -58 -2 C-56 -16 -50 -24 -40 -30Z',
    'M-62 0 C-60 -28 -26 -42 8 -38 C36 -36 64 -20 60 8 C58 32 20 44 -14 40 C-44 36 -63 22 -62 0Z',
    'M-50 -20 C-30 -46 30 -46 52 -20 C70 4 52 34 22 40 C-10 46 -48 36 -58 12 C-62 0 -58 -10 -50 -20Z',
    'M-58 8 C-62 -20 -30 -44 4 -44 C40 -44 62 -22 58 4 C54 30 24 44 -8 42 C-36 40 -56 30 -58 8Z',
    'M-66 6 C-66 -30 -24 -52 18 -46 C52 -40 72 -14 64 16 C56 42 16 52 -20 46 C-48 40 -66 28 -66 6Z',
    'M-36 -10 C-30 -30 14 -34 30 -18 C44 -4 36 20 12 26 C-12 32 -40 14 -36 -10Z',
  ];
  function chart(isles, prog) {
    const P = prog.pre || 'ch';
    // prog: { unlocked:n, lit:[bool], cur:n, secret:bool, beams:bool }
    const route = SPOTS.slice(0, 7).map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
    let s = `<svg viewBox="0 0 1000 640" class="chart-svg" aria-label="海図">
      <defs>
        <filter id="${P}-p"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .34  0 0 0 0 .2  0 0 0 .12 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
        <filter id="${P}-w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>
        <radialGradient id="${P}-v" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5b4020" stop-opacity=".35"/></radialGradient>
        <radialGradient id="${P}-b"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1000" height="640" fill="#efe2c4"/><rect width="1000" height="640" fill="#fff" filter="url(#${P}-p)"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${60 + i * 70} H1000" stroke="#c9b58c" stroke-width="1" opacity=".5"/>`).join('')}
      ${Array.from({ length: 13 }, (_, i) => `<path d="M${40 + i * 80} 0 V640" stroke="#c9b58c" stroke-width="1" opacity=".5"/>`).join('')}
      ${Array.from({ length: 26 }, (_, i) => { const r = rng(i + 7); const x = r() * 1000, y = r() * 640; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#9fb6b0" stroke-width="2" opacity=".7"/>`; }).join('')}
      <path d="${route}" fill="none" stroke="#8c6a45" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
      <g class="rose" transform="translate(96 176)"><circle r="54" fill="none" stroke="#8c6a45" stroke-width="2"/><circle r="44" fill="none" stroke="#8c6a45" stroke-width="1" stroke-dasharray="3 5"/>
        <path d="M0 -62 L9 -9 L0 0 L-9 -9Z" fill="#b5483a"/><path d="M0 62 L9 9 L0 0 L-9 9Z" fill="#8c6a45"/><path d="M-62 0 L-9 -9 L0 0 L-9 9Z" fill="#8c6a45"/><path d="M62 0 L9 -9 L0 0 L9 9Z" fill="#8c6a45"/>
        <text y="-70" text-anchor="middle" font-size="16" fill="#5b4020" font-family="serif">北</text></g>
      <g class="whale" transform="translate(560 560)"><path d="M-40 0 C-36 -20 10 -24 30 -10 L48 -22 L44 0 L50 16 L30 6 C12 16 -30 18 -40 0Z" fill="#9fb6c8" stroke="#5f7688" stroke-width="2"/><circle cx="-24" cy="-4" r="2.5" fill="#333"/><path class="spout" d="M-18 -18 q-4 -14 0 -20 q4 6 0 20 M-18 -30 q-10 -4 -12 -12 M-18 -30 q10 -4 12 -12" fill="none" stroke="#7fb4d0" stroke-width="3" stroke-linecap="round"/></g>`;
    isles.forEach((isl, i) => {
      const p = SPOTS[i]; if (isl.secret && !prog.secret) return;
      const open = i < prog.unlocked || (isl.secret && prog.secret), lit = prog.lit[i];
      s += `<g class="isle ${open ? 'open' : 'locked'} ${lit ? 'lit' : ''}" data-n="${isl.n}" transform="translate(${p.x} ${p.y})" tabindex="${open ? 0 : -1}" role="button" aria-label="${open ? isl.name : 'まだ行けない島'}">
        <circle r="78" fill="transparent"/>
        ${lit && prog.beams ? `<g class="beam"><path d="M0 -40 L-150 -70 L-150 -10Z M0 -40 L150 -70 L150 -10Z" fill="url(#${P}-b)"/></g>` : ''}
        <path d="${BLOB[i]}" transform="scale(1.15)" fill="#e7d3a4" stroke="#b39463" stroke-width="3" filter="url(#${P}-w)"/>
        <path d="${BLOB[i]}" transform="scale(.8)" fill="${isl.secret ? '#c9c2e6' : '#c3d69c'}" opacity=".85" filter="url(#${P}-w)"/>
        <g transform="translate(6 -14)"><path d="M-8 20 L-5 -12 L5 -12 L8 20Z" fill="#fbf7ee" stroke="#5b4020" stroke-width="2"/><path d="M-6 4 L6 4 L7 10 L-7 10Z" fill="#c24a3a"/><rect x="-7" y="-20" width="14" height="8" fill="${lit ? '#ffd24a' : '#9aa7ad'}" stroke="#5b4020" stroke-width="2"/><path d="M-9 -20 L0 -28 L9 -20Z" fill="#5b4020"/>${lit ? '<circle cx="0" cy="-16" r="18" fill="#ffd24a" opacity=".3"/>' : ''}</g>
        <text y="66" text-anchor="middle" class="nm">${open ? isl.name : '？'}</text>
        ${open ? `<text y="86" text-anchor="middle" class="cnt">${prog.count[i] || ''}</text>` : ''}
      </g>`;
    });
    const cp = SPOTS[Math.max(0, prog.cur - 1)];
    s += `<g class="here" transform="translate(${cp.x - 40} ${cp.y + 14})"><circle r="15" fill="#fff8e8" stroke="#b5483a" stroke-width="2.5"/><path d="M-7 3 q2 -10 10 -8 q6 2 3 9z" fill="#f4b99c" stroke="#a45a44" stroke-width="1.5"/><circle cx="-1" cy="-1" r="2" fill="#ffd13b"/></g>`;
    s += `<rect width="1000" height="640" fill="url(#${P}-v)" pointer-events="none"/>`;
    if (prog.night) s += `<rect width="1000" height="640" fill="#0b1633" opacity=".74" pointer-events="none"/><g class="top"></g>`;
    s += '</svg>';
    return s;
  }

  function nightLamp(svg, i, pre) {
    const p = SPOTS[i], top = svg.querySelector('.top'); if (!top) return;
    top.insertAdjacentHTML('beforeend', `<g transform="translate(${p.x + 6} ${p.y - 30})" class="nl"><g class="beam"><path d="M0 0 L-170 -34 L-170 30Z M0 0 L170 -34 L170 30Z" fill="url(#${pre}-b)"/></g><circle r="34" fill="#ffd24a" opacity=".28"/><circle r="12" fill="#ffe89a" opacity=".85"/><rect x="-7" y="-4" width="14" height="8" fill="#ffd24a"/></g>`);
  }
  return { ICON, PICS, LAST, OLD, chart, SPOTS, nightLamp };
})();
