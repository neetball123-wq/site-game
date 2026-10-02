/* ハズレスキル【合成】 — 絵（すべてコードのSVG）
   魔物の絵（100×100）と、地方の背景。グラデーションの id は呼ぶたびに番号をつけてかぶらないようにする。 */
(function (G) {
  'use strict';
  const HZ = G.HZ;
  const ART = (HZ.ART = {});
  let uid = 0;
  const id = (p) => `hz-${p}${++uid}`;

  // 立体っぽい丸いグラデーション
  const rg = (i, a, b) => `<radialGradient id="${i}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const lg = (i, a, b, v) => `<linearGradient id="${i}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const shadow = (w) => `<ellipse cx="50" cy="92" rx="${w || 30}" ry="5" fill="#000" opacity=".28"/>`;
  const eyes = (x1, x2, y, r, pupil, white) => [x1, x2].map((x) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${white || '#fff'}"/><circle cx="${x + r * 0.15}" cy="${y + r * 0.15}" r="${r * 0.55}" fill="${pupil || '#1a1420'}"/><circle cx="${x - r * 0.25}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff"/>`).join('');
  const glow = (x1, x2, y, r, c) => [x1, x2].map((x) => `<circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
  const angry = (x1, x2, y) => `<path d="M${x1 - 6} ${y - 9}l11 4M${x2 + 6} ${y - 9}l-11 4" stroke="#1a1420" stroke-width="3" stroke-linecap="round"/>`;

  const SPR = {
    slime(c) {
      const g = id('s');
      const col = c || ['#8ff0d2', '#2aa58a'];
      return `<defs>${rg(g, col[0], col[1])}</defs>${shadow(32)}<path d="M18 86C14 62 30 30 50 26 70 30 86 62 82 86Z" fill="url(#${g})"/><ellipse cx="38" cy="42" rx="9" ry="5" fill="#fff" opacity=".5" transform="rotate(-25 38 42)"/>${eyes(40, 60, 60, 6)}<path d="M44 72q6 5 12 0" stroke="#1a1420" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    },
    chibi() { return `<g transform="translate(20 30) scale(.6)">${SPR.slime(['#bff7e6', '#45bfa0'])}</g>`; },
    bigslime() { return `<g transform="translate(-6 -10) scale(1.12)">${SPR.slime(['#7fd0ff', '#2b62b8'])}</g><path d="M36 30l6-10 8 8 8-8 6 10z" fill="#ffd34a" stroke="#a87a10" stroke-width="1.5"/>`; },
    usagi() {
      const g = id('u');
      return `<defs>${rg(g, '#fff8f0', '#d8c8b8')}</defs>${shadow(26)}<ellipse cx="36" cy="22" rx="6" ry="20" fill="#efe2d4" transform="rotate(-12 36 22)"/><ellipse cx="64" cy="22" rx="6" ry="20" fill="#efe2d4" transform="rotate(12 64 22)"/><ellipse cx="36" cy="24" rx="3" ry="14" fill="#f5b8c4" transform="rotate(-12 36 24)"/><ellipse cx="64" cy="24" rx="3" ry="14" fill="#f5b8c4" transform="rotate(12 64 24)"/><ellipse cx="50" cy="70" rx="28" ry="22" fill="url(#${g})"/><circle cx="50" cy="50" r="20" fill="url(#${g})"/><path d="M47 34l3-16 3 16z" fill="#ffe08a" stroke="#b08a2a" stroke-width="1"/>${eyes(42, 58, 50, 4.5, '#c0283a')}<path d="M47 59q3 3 6 0" stroke="#7a5a50" stroke-width="2" fill="none"/>`;
    },
    goblin(k) {
      const g = id('g');
      return `<defs>${rg(g, '#a6dd7a', '#4f8a32')}</defs>${shadow(26)}<path d="M20 40L6 30 26 50zM80 40l14-10-20 20z" fill="#7ab656"/><rect x="34" y="62" width="32" height="26" rx="10" fill="#6b4a32"/><circle cx="50" cy="50" r="22" fill="url(#${g})"/>${angry(42, 58, 47)}${eyes(42, 58, 48, 4.5, '#d8a020', '#fff6c8')}<path d="M40 60q10 7 20 0" stroke="#2a3a18" stroke-width="2.5" fill="none"/><path d="M44 61l2 4 2-3M54 61l-2 4-2-3" fill="#fff"/><path d="M76 60l12-22" stroke="#8a5a2a" stroke-width="6" stroke-linecap="round"/><circle cx="88" cy="36" r="7" fill="#9a6a3a"/>${k ? '<path d="M32 30l4-12 7 8 7-10 7 10 7-8 4 12z" fill="#ffd34a" stroke="#a87a10" stroke-width="1.5"/><circle cx="50" cy="22" r="2.5" fill="#e33"/>' : ''}`;
    },
    gobking() { return SPR.goblin(true); },
    wolf(c) {
      const g = id('w');
      const col = c || ['#9aa3ad', '#4c5560'];
      return `<defs>${rg(g, col[0], col[1])}</defs>${shadow(28)}<path d="M24 46L22 14 42 32zM76 46l2-32-20 18z" fill="${col[1]}"/><path d="M27 40l-1-18 10 12zM73 40l1-18-10 12z" fill="#e8a0a8" opacity=".7"/><path d="M20 50C20 30 80 30 80 50 80 70 64 86 50 88 36 86 20 70 20 50Z" fill="url(#${g})"/><path d="M38 64C38 56 62 56 62 64 62 76 50 84 50 84 50 84 38 76 38 64Z" fill="#e6e8ea"/>${glow(39, 61, 52, 3.6, c && c[2] ? c[2] : '#ffd23f')}<ellipse cx="50" cy="66" rx="5" ry="3.5" fill="#1a1420"/><path d="M44 76l3 4 3-4 3 4 3-4" stroke="#fff" stroke-width="1.5" fill="none"/>`;
    },
    wolfking() { return `${SPR.wolf(['#6a6f88', '#2a2e44', '#ff5a3a'])}<path d="M18 56C10 40 14 30 22 26M82 56c8-16 4-26-4-30" stroke="#1c1f30" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M58 40l8 14" stroke="#e8e0d0" stroke-width="2"/>`; },
    yukiookami() { return SPR.wolf(['#ffffff', '#b8d4ea', '#4ab8ff']); },
    kinoko() {
      const g = id('k');
      return `<defs>${rg(g, '#ff8a7a', '#b8282a')}</defs>${shadow(24)}<path d="M38 56h24l4 32H34z" fill="#f4ead8"/><path d="M12 58C12 26 88 26 88 58Z" fill="url(#${g})"/><circle cx="34" cy="42" r="6" fill="#fff4e8"/><circle cx="56" cy="34" r="5" fill="#fff4e8"/><circle cx="72" cy="48" r="4" fill="#fff4e8"/><circle cx="46" cy="52" r="3" fill="#fff4e8"/>${eyes(44, 56, 70, 3.6)}<path d="M46 80q4-3 8 0" stroke="#5a3a2a" stroke-width="2" fill="none"/><circle cx="30" cy="22" r="3" fill="#b7f04a" opacity=".6"/><circle cx="74" cy="18" r="2" fill="#b7f04a" opacity=".6"/>`;
    },
    seirei() {
      const g = id('sr');
      return `<defs>${rg(g, '#c6ffb0', '#3a9a4a')}</defs>${shadow(20)}<circle cx="50" cy="50" r="34" fill="#bfffa0" opacity=".15"/><path d="M50 14C74 30 76 60 50 86 24 60 26 30 50 14Z" fill="url(#${g})"/><path d="M50 22V80" stroke="#2a7a3a" stroke-width="1.5" opacity=".5"/><path d="M20 40c6-2 12 2 14 8-6 2-12-2-14-8zM80 40c-6-2-12 2-14 8 6 2 12-2 14-8z" fill="#6acb5a"/>${glow(43, 57, 50, 3, '#fffbe0')}`;
    },
    treant() {
      const g = id('t');
      return `<defs>${lg(g, '#8a6038', '#4a3018', true)}</defs>${shadow(36)}<circle cx="30" cy="26" r="20" fill="#3f7a3a"/><circle cx="70" cy="24" r="22" fill="#356e32"/><circle cx="50" cy="14" r="18" fill="#4a8a42"/><path d="M30 92C34 70 32 46 38 34h24c6 12 4 36 8 58H58l-4-10-4 10-4-10-4 10z" fill="url(#${g})"/><path d="M38 34L22 22M62 34l18-14" stroke="#5a3a1e" stroke-width="5" stroke-linecap="round"/><ellipse cx="44" cy="52" rx="4" ry="5" fill="#1a1008"/><ellipse cx="57" cy="52" rx="4" ry="5" fill="#1a1008"/><circle cx="44" cy="53" r="1.6" fill="#ffd23f"/><circle cx="57" cy="53" r="1.6" fill="#ffd23f"/><path d="M42 66q8 6 16 0" stroke="#1a1008" stroke-width="3" fill="none"/>`;
    },
    honoo() {
      const g = id('h');
      return `<defs><radialGradient id="${g}" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#ffb030"/><stop offset="1" stop-color="#e83a1a"/></radialGradient></defs>${shadow(22)}<path d="M50 8C58 24 76 32 76 58 76 76 64 88 50 88 36 88 24 76 24 58 24 44 32 40 34 28 40 36 42 40 44 42 44 30 46 18 50 8Z" fill="url(#${g})"/>${eyes(42, 58, 62, 4.2, '#7a1a08', '#fffbe8')}<path d="M45 73q5 3 10 0" stroke="#7a1a08" stroke-width="2" fill="none"/>`;
    },
    sasori() {
      const g = id('sa');
      return `<defs>${rg(g, '#c87a3a', '#6a3418')}</defs>${shadow(34)}<path d="M64 62C80 60 86 40 78 26 72 16 62 18 60 26" stroke="url(#${g})" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M56 22l6-10 4 12z" fill="#2a1a10"/><ellipse cx="46" cy="70" rx="26" ry="14" fill="url(#${g})"/><path d="M22 64C10 60 8 48 16 44M20 72C8 74 6 84 12 86" stroke="#7a4220" stroke-width="5" fill="none"/><path d="M10 40l10 2-4 8zM6 84l10-4 0 8z" fill="#8a4a24"/>${eyes(36, 46, 64, 3)}<path d="M30 82l-6 8M40 84l-4 8M52 84l2 8M62 82l6 8" stroke="#5a2a14" stroke-width="3"/>`;
    },
    lavagolem() {
      const g = id('lg');
      return `<defs>${lg(g, '#4a3a36', '#1e1614', true)}</defs>${shadow(36)}<path d="M22 40l8-18h40l8 18 6 30-10 20H26L16 70z" fill="url(#${g})"/><path d="M30 34l10 10-4 12 14 6M70 30l-8 16 8 10-12 10M40 74l10 6 12-6" stroke="#ff7a2a" stroke-width="2.5" fill="none"/><path d="M30 34l10 10-4 12 14 6M70 30l-8 16 8 10-12 10" stroke="#ffd23f" stroke-width="1" fill="none"/>${glow(40, 60, 42, 3.5, '#ffb030')}<rect x="8" y="48" width="14" height="22" rx="4" fill="#2e2420"/><rect x="78" y="48" width="14" height="22" rx="4" fill="#2e2420"/>`;
    },
    salamander() {
      const g = id('sl');
      return `<defs>${rg(g, '#ff9a5a', '#b8381a')}</defs>${shadow(34)}<path d="M20 70C10 66 6 56 12 50 14 60 22 62 28 62" fill="#ffb030"/><path d="M14 56c-4-10 0-18 6-20-2 8 2 12 4 14" fill="#ffe08a"/><path d="M26 64C30 54 52 50 66 54 78 44 92 50 90 60 88 70 76 72 66 70 54 76 34 76 26 64Z" fill="url(#${g})"/><circle cx="80" cy="56" r="3.4" fill="#fff6b0"/><circle cx="80.6" cy="56.4" r="1.6" fill="#2a1008"/><path d="M36 72l-4 12M48 74l-2 12M60 72l2 12M70 70l4 10" stroke="#a8301a" stroke-width="4" stroke-linecap="round"/><path d="M40 56l4-6 4 6 4-6 4 6" stroke="#ffd23f" stroke-width="2" fill="none"/>`;
    },
    endragon() {
      const g = id('d');
      return `<defs>${rg(g, '#ff6a4a', '#7a1010')}</defs>${shadow(38)}<path d="M28 30L14 4 36 22zM72 30L86 4 64 22z" fill="#3a1410"/><path d="M8 50L2 20 26 40zM92 50l6-30-24 20z" fill="#5a1a14" opacity=".8"/><path d="M22 44C22 24 78 24 78 44 80 60 70 70 66 84H34C30 70 20 60 22 44Z" fill="url(#${g})"/><path d="M34 70C34 62 66 62 66 70 66 82 50 90 50 90 50 90 34 82 34 70Z" fill="#c83a24"/><circle cx="44" cy="72" r="2" fill="#2a0808"/><circle cx="56" cy="72" r="2" fill="#2a0808"/><path d="M36 46l14 6 14-6" stroke="#2a0808" stroke-width="3" fill="none"/>${glow(38, 62, 46, 4, '#ffe066')}<path d="M40 86l3 6 3-6 4 6 4-6 3 6 3-6" stroke="#fff6e0" stroke-width="2" fill="none"/><circle cx="50" cy="12" r="4" fill="#888" opacity=".35"/><circle cx="58" cy="6" r="3" fill="#888" opacity=".25"/>`;
    },
    koorisei() {
      const g = id('ko');
      return `<defs>${lg(g, '#f0fcff', '#6ac4f0', true)}</defs>${shadow(20)}<circle cx="50" cy="50" r="36" fill="#bfefff" opacity=".18"/><path d="M50 8L74 46 50 92 26 46Z" fill="url(#${g})" stroke="#ffffff" stroke-width="1.5"/><path d="M50 8V92M26 46h48" stroke="#ffffff" stroke-width="1" opacity=".6"/>${eyes(43, 57, 48, 3.6, '#1a4a7a')}<path d="M18 22l4 4M82 20l-4 4M14 70l5-2M86 72l-5-2" stroke="#e8faff" stroke-width="2" stroke-linecap="round"/>`;
    },
    kagami() {
      const g = id('kg');
      return `<defs>${lg(g, '#e8f2ff', '#8aa0c8')}</defs>${shadow(22)}<ellipse cx="50" cy="48" rx="28" ry="38" fill="#6a4a8a"/><ellipse cx="50" cy="48" rx="22" ry="32" fill="url(#${g})"/><path d="M36 30l10-8M34 40l18-14" stroke="#fff" stroke-width="2.5" opacity=".6"/><ellipse cx="50" cy="50" rx="12" ry="8" fill="#fff"/><circle cx="50" cy="50" r="6" fill="#7a2a9a"/><circle cx="50" cy="50" r="3" fill="#120818"/><path d="M38 86h24l-4 6H42z" fill="#4a2a6a"/>`;
    },
    hyoukai() {
      const g = id('hk');
      return `<defs>${lg(g, '#e8f8ff', '#6aa8d8', true)}</defs>${shadow(38)}<path d="M26 28h48l8 18-4 28-10 18H32L22 74l-4-28z" fill="url(#${g})" stroke="#fff" stroke-width="1.5"/><path d="M26 28l14 18h20l14-18M40 46l-6 46M60 46l6 46" stroke="#fff" stroke-width="1" opacity=".5"/>${glow(40, 60, 40, 3.4, '#2a7aff')}<path d="M6 44h14v30H8zM80 44h14l-2 30H80z" fill="#9ad0f0" stroke="#fff"/>`;
    },
    kyozou() {
      const g = id('kz');
      return `<defs>${lg(g, '#dff2ff', '#5a7aa8', true)}</defs>${shadow(42)}<path d="M24 22l8-14 8 10 10-14 10 14 8-10 8 14v66H24z" fill="url(#${g})" stroke="#fff" stroke-width="1.5"/><path d="M24 40h52M24 70h52" stroke="#fff" stroke-width="1" opacity=".4"/><path d="M34 50h12M54 50h12" stroke="#1a2a4a" stroke-width="5" stroke-linecap="round"/>${glow(40, 60, 50, 2.6, '#7ad8ff')}<path d="M40 64h20" stroke="#1a2a4a" stroke-width="3" stroke-linecap="round"/><path d="M50 22v-8" stroke="#fff" stroke-width="2"/>`;
    },
    yoroi() {
      const g = id('y');
      return `<defs>${lg(g, '#b8c0cc', '#4a5260', true)}</defs>${shadow(34)}<path d="M14 54c0-10 10-16 20-16h32c10 0 20 6 20 16l-6 6H20z" fill="#5a6270"/><path d="M30 20C30 6 70 6 70 20V58C70 70 30 70 30 58Z" fill="url(#${g})"/><path d="M50 8v52" stroke="#2a3038" stroke-width="2"/><rect x="34" y="34" width="32" height="8" rx="2" fill="#0a0c10"/>${glow(42, 58, 38, 2.4, '#7affd8')}<path d="M34 66h32l6 26H28z" fill="#4a5260"/><path d="M62 4l10-2-4 10" fill="#c83a3a"/>`;
    },
    grimoire() {
      const g = id('gr');
      return `<defs>${lg(g, '#7a2a4a', '#3a0e22', true)}</defs>${shadow(28)}<path d="M18 24h64v58H18z" fill="url(#${g})" stroke="#c8a24a" stroke-width="2"/><path d="M24 24v58M76 24v58" stroke="#c8a24a" stroke-width="1" opacity=".6"/><circle cx="50" cy="44" r="12" fill="#f8f0e0"/><circle cx="50" cy="44" r="6" fill="#d8283a"/><circle cx="50" cy="44" r="3" fill="#120808"/><path d="M34 66h32l-4 8H38z" fill="#120808"/><path d="M38 66l3 5 3-5 3 5 3-5 3 5 3-5 3 5 3-5" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M14 30c-8 4-8 14 0 18M86 30c8 4 8 14 0 18" stroke="#b98cff" stroke-width="2" fill="none" opacity=".7"/>`;
    },
    gargoyle() {
      const g = id('ga');
      return `<defs>${rg(g, '#9aa0a8', '#3e444c')}</defs>${shadow(30)}<path d="M30 44C14 30 6 34 2 46 10 44 14 50 12 58 20 52 26 56 28 62zM70 44c16-14 24-10 28 2-8-2-12 4-10 12-8-6-14-2-16 4z" fill="#4a5058"/><path d="M34 26l-4-14 10 10zM66 26l4-14-10 10z" fill="#3a3e46"/><path d="M30 40C30 24 70 24 70 40V70C70 82 30 82 30 70Z" fill="url(#${g})"/>${glow(42, 58, 42, 3, '#ff4a3a')}<path d="M40 58q10 6 20 0" stroke="#1a1c20" stroke-width="3" fill="none"/><path d="M42 59l2 5 2-4M58 59l-2 5-2-4" fill="#e8e8e8"/>`;
    },
    shitennou() {
      const g = id('st');
      return `<defs>${lg(g, '#4a2a6a', '#120a1e', true)}</defs>${shadow(32)}<circle cx="50" cy="50" r="40" fill="#7a3aff" opacity=".12"/><path d="M50 8C70 8 78 30 78 46L88 92H12L22 46C22 30 30 8 50 8Z" fill="url(#${g})"/><path d="M36 34C36 20 64 20 64 34V52H36z" fill="#05030a"/>${glow(43, 57, 40, 2.6, '#c08aff')}<path d="M34 92l8-30M66 92l-8-30" stroke="#2a1640" stroke-width="2"/>`;
    },
    maou() {
      const g = id('m'), h = id('mh');
      return `<defs>${lg(g, '#3a1440', '#0a040e', true)}<radialGradient id="${h}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff2a4a" stop-opacity=".45"/><stop offset="1" stop-color="#ff2a4a" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="46" r="48" fill="url(#${h})"/>${shadow(40)}<path d="M34 24C24 18 18 6 22 0 28 10 34 14 40 18zM66 24C76 18 82 6 78 0 72 10 66 14 60 18z" fill="#d8c8a8"/><path d="M50 14C68 14 76 30 76 42L94 94H6L24 42C24 30 32 14 50 14Z" fill="url(#${g})"/><path d="M34 36C34 24 66 24 66 36V54C66 60 34 60 34 54Z" fill="#05020a"/>${glow(42, 58, 42, 3.4, '#ff2a3a')}<path d="M44 52l6 3 6-3" stroke="#ff2a3a" stroke-width="1.5" fill="none" opacity=".8"/><path d="M6 94l22-40M94 94L72 54" stroke="#5a1a6a" stroke-width="2"/><path d="M38 16l4-8 8 6 8-6 4 8" fill="none" stroke="#ffd34a" stroke-width="2"/>`;
    },
    mimic() {
      const g = id('mi');
      return `<defs>${lg(g, '#b87a3a', '#6a3a14', true)}</defs>${shadow(32)}<path d="M18 52h64v34H18z" fill="url(#${g})" stroke="#3a2008" stroke-width="2"/><path d="M18 52C18 30 82 30 82 52" fill="#c8884a" stroke="#3a2008" stroke-width="2" transform="rotate(-12 18 52)"/><path d="M22 52l4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8" fill="#fff" stroke="#3a2008" stroke-width="1"/><path d="M36 56C40 72 60 72 64 56" fill="#d8384a"/><rect x="44" y="64" width="12" height="10" rx="2" fill="#ffd34a" stroke="#8a6010"/>${glow(36, 54, 38, 2.6, '#ff3a3a')}`;
    },
    kakashi() {
      return `${shadow(16)}<path d="M50 30V92" stroke="#8a6a3a" stroke-width="5"/><path d="M18 46h64" stroke="#8a6a3a" stroke-width="5"/><circle cx="50" cy="26" r="13" fill="#e8d8a8"/><path d="M34 18h32l-6-10H40z" fill="#c8a24a"/><path d="M44 26l4 0M54 26l4 0M45 32q5 3 10 0" stroke="#5a3a1a" stroke-width="2"/><path d="M36 44h28v26H36z" fill="#7a9ac8"/><path d="M16 46l-4 6M84 46l4 6" stroke="#e8d08a" stroke-width="3"/>`;
    },
  };
  const ALIAS = { koorisei: 'koorisei' };
  ART.foe = (fid, name) => {
    const k = name === 'ちびスライム' ? 'chibi' : (ALIAS[fid] || fid);
    const f = SPR[k] || SPR.slime;
    return `<svg viewBox="0 0 100 100" aria-hidden="true" class="spr">${f()}</svg>`;
  };

  /* ---------- 背景 ---------- */
  const hills = (y, col, amp, seed) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 800; x += 50) d += ` Q${x + 25} ${y - amp * (0.5 + 0.5 * Math.sin((x + seed) * 0.013))} ${x + 50} ${y + amp * 0.15 * Math.cos((x + seed) * 0.02)}`;
    return `<path d="${d} V500 H0Z" fill="${col}"/>`;
  };
  const stars = (n, seed, h) => {
    let s = '';
    for (let i = 0; i < n; i++) { const x = (i * 97 + seed * 31) % 800, y = (i * 53 + seed * 17) % (h || 260); s += `<circle cx="${x}" cy="${y}" r="${(i % 3) * 0.5 + 0.6}" fill="#fff" opacity="${0.3 + (i % 5) * 0.12}"/>`; }
    return s;
  };
  const trees = (y, col, n, seed, hgt) => {
    let s = '';
    for (let i = 0; i < n; i++) { const x = (i * 800 / n + (seed * 37 + i * 23) % 40) - 20, h = hgt * (0.7 + ((i * 7 + seed) % 5) * 0.1); s += `<path d="M${x} ${y}l${h * 0.28} -${h}l${h * 0.28} ${h}z" fill="${col}"/>`; }
    return s;
  };
  ART.scene = (ch) => {
    const g = id('sky');
    const deep = ch >= HZ.CHAPTERS.length;
    const C = deep ? { sky: ['#05030c', '#2a1240'] } : HZ.CHAPTERS[ch];
    let body = '';
    if (deep) {
      body = stars(90, ch, 500) + `<g opacity=".5"><circle cx="400" cy="250" r="160" fill="none" stroke="#7a3aff" stroke-width="1"/><circle cx="400" cy="250" r="110" fill="none" stroke="#b98cff" stroke-width=".6" stroke-dasharray="4 6"/><circle cx="400" cy="250" r="60" fill="#120624"/></g>` + hills(440, '#0c0616', 30, ch * 13);
    } else if (C.id === 'sougen') {
      body = `<circle cx="640" cy="90" r="42" fill="#fff6d8" opacity=".9"/><g fill="#fff" opacity=".85"><ellipse cx="160" cy="90" rx="60" ry="16"/><ellipse cx="200" cy="80" rx="40" ry="18"/><ellipse cx="520" cy="150" rx="50" ry="12"/></g>`
        + hills(330, '#a8cfe8', 40, 2) + `<g fill="#8fb4d0"><rect x="566" y="262" width="60" height="40"/><rect x="556" y="246" width="14" height="56"/><rect x="622" y="246" width="14" height="56"/><rect x="588" y="232" width="16" height="70"/><path d="M553 248l10-20 10 20zM619 248l10-20 10 20zM585 234l11-26 11 26z"/><path d="M596 208v-12l9 4-9 4" /></g>` + hills(370, '#8cc46a', 30, 40) + hills(420, '#6fae5a', 26, 90) + hills(470, '#5a9a48', 20, 150);
    } else if (C.id === 'mori') {
      body = `<g opacity=".25" fill="#fffbe0"><path d="M300 0l40 0 -120 500 -60 0z"/><path d="M480 0l24 0 -40 500 -50 0z"/></g>` + trees(330, '#3e6e52', 22, 1, 160) + trees(390, '#2a5038', 18, 2, 190) + hills(440, '#1f3d28', 18, 30) + trees(500, '#13281a', 12, 3, 240);
    } else if (C.id === 'kazan') {
      body = `<circle cx="400" cy="160" r="160" fill="#ff7a3a" opacity=".18"/><path d="M220 360L360 150h80l140 210z" fill="#3b1c18"/><path d="M360 150h80l-20 30-20-10-20 14z" fill="#ff8a2a"/><path d="M392 160c-10 60 6 120-8 200" stroke="#ff6a1a" stroke-width="6" fill="none" opacity=".8"/>`
        + `<g fill="#ffb04a">${[...Array(18)].map((_, i) => `<circle cx="${(i * 61) % 800}" cy="${(i * 37) % 300 + 40}" r="${1 + (i % 3)}" opacity=".7"/>`).join('')}</g>` + hills(400, '#2a1614', 30, 7) + hills(460, '#1a0e0c', 20, 60);
    } else if (C.id === 'hyoukyou') {
      body = `<path d="M0 360L80 120 160 300 240 80 330 320 420 140 520 340 600 100 700 300 800 160V500H0z" fill="#dfeefa"/><path d="M80 120l20 60-30 0zM240 80l24 70-36 0zM600 100l22 64-34 0z" fill="#fff"/>` + hills(420, '#c8dcec', 24, 11) + hills(470, '#e8f4ff', 16, 50)
        + `<g fill="#fff" opacity=".8">${[...Array(30)].map((_, i) => `<circle cx="${(i * 83) % 800}" cy="${(i * 47) % 420}" r="${1 + (i % 2)}"/>`).join('')}</g>`;
    } else {
      body = stars(50, 4, 240) + `<circle cx="620" cy="100" r="46" fill="#f4e8ff"/><circle cx="604" cy="92" r="46" fill="#1a1030" opacity=".2"/>`
        + `<path d="M260 380V200l20-40 20 40v40h30v-80l24-50 24 50v80h30v-40l20-40 20 40v180z" fill="#120a1e"/><g fill="#ffcc4a" opacity=".8"><rect x="346" y="200" width="6" height="10"/><rect x="276" y="230" width="5" height="8"/><rect x="426" y="240" width="5" height="8"/></g>` + hills(420, '#1e1630', 24, 21) + hills(470, '#140e20', 18, 70);
    }
    return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>${lg(g, C.sky[0], C.sky[1], true)}</defs><rect width="800" height="500" fill="url(#${g})"/>${body}</svg>`;
  };

  /* ---------- ラノベの表紙（クリア・力尽きたとき） ---------- */
  ART.cover = (el) => {
    const g = id('cv'), c = HZ.ELCOL[el] || '#6fd6ff';
    let rings = '';
    for (let i = 0; i < 3; i++) rings += `<circle cx="150" cy="150" r="${40 + i * 30}" fill="none" stroke="${c}" stroke-width="${1.6 - i * 0.4}" opacity="${0.8 - i * 0.2}" stroke-dasharray="${i === 1 ? '3 5' : 'none'}"/>`;
    let rays = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `<path d="M${150 + Math.cos(a) * 44} ${150 + Math.sin(a) * 44}L${150 + Math.cos(a) * 130} ${150 + Math.sin(a) * 130}" stroke="${c}" stroke-width=".8" opacity=".5"/>`; }
    // 魔法陣：六角形と、まわりの小さな印
    const hex = (r, rot) => [...Array(6)].map((_, i) => { const a = rot + i * Math.PI / 3; return `${(150 + Math.cos(a) * r).toFixed(1)},${(150 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    let marks = '';
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; marks += `<rect x="${(150 + Math.cos(a) * 100 - 2).toFixed(1)}" y="${(150 + Math.sin(a) * 100 - 2).toFixed(1)}" width="4" height="4" fill="${c}" opacity=".7" transform="rotate(${i * 15 + 45} ${(150 + Math.cos(a) * 100).toFixed(1)} ${(150 + Math.sin(a) * 100).toFixed(1)})"/>`; }
    return `<svg viewBox="0 0 300 300" aria-hidden="true"><defs><radialGradient id="${g}" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="#0a1020" stop-opacity="0"/></radialGradient></defs><rect width="300" height="300" fill="url(#${g})"/>${rays}${rings}${marks}<polygon points="${hex(78, -Math.PI / 2)}" fill="none" stroke="${c}" stroke-width="1.4"/><polygon points="${hex(78, 0)}" fill="none" stroke="${c}" stroke-width=".8" opacity=".6"/><circle cx="150" cy="150" r="22" fill="${c}" opacity=".35"/><circle cx="150" cy="150" r="8" fill="#fff" opacity=".8"/></svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
