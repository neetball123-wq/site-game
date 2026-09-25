'use strict';
// ============================================================
//  ui: card faces, hand interaction, battle HUD, tooltips, overlays
// ============================================================
const CW = 56, CH = 78;
const TYPEC = {
  atk: { f: '#c8404f', l: '#ef7080', d: '#8a2432', bg: ['#ffd6c8', '#f4a08e'] },
  def: { f: '#3a6ec8', l: '#78a6f0', d: '#23488a', bg: ['#d8ecff', '#a6c8ee'] },
  skl: { f: '#2f9a78', l: '#62c8a4', d: '#1d6a52', bg: ['#dcf6e8', '#a4dcc4'] },
  pwr: { f: '#d89a1c', l: '#f6c850', d: '#9a6a10', bg: ['#fff2c8', '#f6d88a'] },
  junk: { f: '#6a5a5a', l: '#8a7a78', d: '#3a3036', bg: ['#b8aaa4', '#8a7a78'] },
};
const TYPEJP = { atk: 'こうげき', def: 'ぼうぎょ', skl: 'わざ', pwr: 'パワー', junk: 'ガラクタ' };
const RARJP = { s: 'はじまり', c: 'ふつう', u: 'めずらしい', r: 'レア', x: '' };

// ---------- chip icons on card faces (7x7) ----------
function chipIcon(i, x, y) {
  switch (i) {
    case 'atk': rectI(x + 1, y + 1, 5, 5, OUT); rectI(x + 2, y + 2, 3, 3, '#ff6b6b'); rectI(x, y + 2, 2, 2, OUT); px(x + 2, y + 2, '#ffd0d0'); break;
    case 'blk': polyF([x + 0.5, y, x + 6.5, y, x + 6.5, y + 3.5, x + 3.5, y + 7, x + 0.5, y + 3.5], OUT); polyF([x + 1.5, y + 1, x + 5.5, y + 1, x + 5.5, y + 3.2, x + 3.5, y + 5.6, x + 1.5, y + 3.2], '#7fb8ff'); px(x + 2, y + 1, '#ffffff'); break;
    case 'draw': rectI(x + 1, y, 5, 7, OUT); rectI(x + 2, y + 1, 3, 5, '#f6f4ee'); rectI(x, y + 1, 2, 5, OUT); rectI(x + 1, y + 2, 1, 3, '#c7ccd6'); break;
    case 'nrg': polyF([x + 4, y, x + 1, y + 4, x + 3, y + 4, x + 2, y + 7, x + 6, y + 3, x + 4, y + 3, x + 5, y], '#ffd23f'); px(x + 3, y + 3, '#ffffff'); break;
    case 'hp': ellipseF(x + 2, y + 2.5, 2, 2, '#ff5d73'); ellipseF(x + 5, y + 2.5, 2, 2, '#ff5d73'); polyF([x + 0.3, y + 3, x + 6.7, y + 3, x + 3.5, y + 6.8], '#ff5d73'); break;
    case 'look': ellipseF(x + 3.5, y + 3.5, 3.5, 2.5, '#f6f4ee'); ellipseF(x + 3.5, y + 3.5, 1.6, 1.6, OUT); break;
    case 'unblk': polyF([x + 0.5, y, x + 6.5, y, x + 6.5, y + 3.5, x + 3.5, y + 7, x + 0.5, y + 3.5], '#7fb8ff'); lineF(x, y + 6, x + 6, y, '#ff4d5a', 1); break;
    case 'shuffle': rectI(x, y + 1, 4, 5, '#f6f4ee'); rectI(x + 3, y, 4, 5, '#c7ccd6'); break;
    case 'solo': ellipseF(x + 3.5, y + 2, 1.6, 1.6, '#ffd23f'); rectI(x + 2, y + 4, 3, 3, '#ffd23f'); break;
    default: if (SICON[i]) SICON[i](x, y); else rectI(x, y, 7, 7, '#ff00ff');
  }
}
// numbers on faces use the 5x7 font; value colour shows modifiers
function faceChips(c, tgt) {
  const d = CARDS[c.id], v = cardVals(c); const chips = d.face ? d.face(v, c) : [];
  const P = B ? B.P : null;
  return chips.map(ch => {
    let n = ch.n, col = '#1e1c28';
    if (ch.dmg && P && n != null) { const m = dmgCalc(n, P, tgt && tgt.alive ? tgt : null); col = m > n ? '#1f8a3a' : m < n ? '#c8323f' : col; n = m; }
    else if (ch.haz && n != null) { const m = Math.floor(n * (hasRelic('triangle') ? 1.5 : 1)); if (m > n) col = '#1f8a3a'; n = m; }
    else if (ch.blk && P && n != null) { const m = blockCalc(n, P); col = m > n ? '#1f8a3a' : m < n ? '#c8323f' : col; n = m; }
    return Object.assign({}, ch, { n, col });
  });
}
const _faceCache = new Map();
function cardFace(c, tgt, playable = true) {
  const d = CARDS[c.id]; const chips = faceChips(c, tgt); const cost = B ? cardCost(c) : (CARDS[c.id].u && c.up && CARDS[c.id].u.cost != null ? CARDS[c.id].u.cost : d.cost);
  const tick = (d.id === 'signal' || d.id === 'crossing' || d.id === 'wind' || d.id === 'jam' || d.id === 'barricade' || d.id === 'noise') ? ((Game.t / 20) | 0) % 6 : 0;
  const key = c.id + (c.up ? '+' : '') + '|' + cost + '|' + playable + '|' + chips.map(ch => ch.i + ch.n + ch.col + (ch.t || '')).join(',') + '|' + tick;
  let cv = _faceCache.get(key); if (cv) return cv;
  if (_faceCache.size > 600) _faceCache.clear();
  cv = mkCanvas(CW, CH); _faceCache.set(key, cv);
  paint(cv, () => drawCardFaceRaw(c, chips, cost, playable, tick * 20));
  return cv;
}
function drawCardFaceRaw(c, chips, cost, playable, t) {
  const d = CARDS[c.id], T = TYPEC[d.type] || TYPEC.skl, v = cardVals(c);
  // body & frame
  rectI(1, 0, CW - 2, CH, OUT); rectI(0, 1, CW, CH - 2, OUT);
  rectI(1, 1, CW - 2, CH - 2, T.f); rectI(2, 2, CW - 4, 1, T.l); rectI(2, CH - 3, CW - 4, 1, T.d); rectI(1, 2, 1, CH - 4, T.l); rectI(CW - 2, 2, 1, CH - 4, T.d);
  if (d.rar === 'r') { rectI(3, 3, CW - 6, 1, '#ffe07a'); rectI(3, CH - 4, CW - 6, 1, '#ffe07a'); }
  // name band
  rectI(3, 3, CW - 6, 9, T.d); const nm = d.en + (c.up ? '+' : ''); const nw = textW(nm);
  const ncx = nw > 30 ? 34 : CW / 2 + 3; // keep long names clear of the cost badge
  text(d.en, Math.round(ncx - nw / 2), 5, '#ffffff'); if (c.up) text('+', Math.round(ncx + nw / 2) - 3, 5, '#ffd23f');
  // art window
  const ax = 4, ay = 13, aw = CW - 8, ah = 32;
  rectI(ax - 1, ay - 1, aw + 2, ah + 2, OUT);
  const [b0, b1] = T.bg; for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i += 1) if (true) { const k = j / ah; px(ax + i, ay + j, dth(i, j, k) ? b1 : b0); }
  rectI(ax, ay + ah - 5, aw, 5, mix(b1, '#6d6577', 0.35)); rectI(ax, ay + ah - 5, aw, 1, mix(b1, '#ffffff', 0.3));
  G.save(); G.beginPath(); G.rect(ax, ay, aw, ah); G.clip(); resetFs();
  drawArt(d.art || c.id, ax + aw / 2, ay + ah / 2 - 1, t);
  G.restore(); resetFs();
  // effect plate
  rectI(3, 47, CW - 6, 26, '#f6f4ee'); rectI(3, 47, CW - 6, 1, '#ffffff'); rectI(3, 72, CW - 6, 1, '#c8c4b8');
  layoutChips(chips, CW / 2, 49, CW - 8);
  // keyword strip
  const kw = [];
  if (cardKw(c, 'exhaust')) kw.push('EXHAUST'); if (cardKw(c, 'retain')) kw.push('RETAIN'); if (cardKw(c, 'innate')) kw.push('INNATE'); if (cardKw(c, 'ethereal')) kw.push('FADE'); if (cardKw(c, 'unplayable')) kw.push('JUNK');
  if (d.type === 'pwr') kw.push('POWER');
  if (kw.length) { const s = kw.slice(0, 2).join(' '); textC(s, CW / 2, 67, T.d, false); }
  // rivets (rarity)
  const rc = d.rar === 'r' ? '#ffd23f' : d.rar === 'u' ? '#8fd8ff' : '#c7ccd6';
  for (const [x, y] of [[3, CH - 4], [CW - 4, CH - 4]]) { px(x, y, rc); }
  // cost badge
  if (cost >= 0) {
    ellipseF(7.5, 7.5, 7, 7, OUT); ellipseF(7.5, 7.5, 6, 6, playable ? '#ffd23f' : '#8a86a0'); ellipseF(6.5, 6.5, 3, 3, playable ? '#fff3a0' : '#aaa6c0');
    text(String(cost), 5, 4, OUT, true);
  }
  if (!playable) { G.globalAlpha = 0.35; rectI(1, 1, CW - 2, CH - 2, '#1a1824'); G.globalAlpha = 1; }
}
function layoutChips(chips, cx, y, maxW) {
  if (!chips.length) return;
  const widths = chips.map(ch => 8 + (ch.n != null ? textW(String(ch.n), true) + 1 : 0) + (ch.x ? textW('x' + ch.x) + 2 : 0) + (ch.t ? textW(ch.t, true) + 1 : 0) + (ch.all ? 13 : 0));
  // up to 2 rows
  const rows = [[]]; let w = 0;
  chips.forEach((ch, i) => { if (w + widths[i] > maxW && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(i); w += widths[i] + 3; });
  rows.forEach((r, ri) => {
    const tw = r.reduce((s, i) => s + widths[i] + 3, -3); let x = Math.round(cx - tw / 2); const yy = y + ri * 10 + (rows.length === 1 ? 4 : 0);
    for (const i of r) {
      const ch = chips[i]; chipIcon(ch.i, x, yy); x += 8;
      if (ch.n != null) { const s = String(ch.n); text(s, x, yy, ch.col || '#1e1c28', true); x += textW(s, true) + 1; }
      if (ch.t) { text(ch.t, x, yy, '#1e1c28', true); x += textW(ch.t, true) + 1; }
      if (ch.x) { text('x' + ch.x, x + 1, yy + 2, '#1e1c28'); x += textW('x' + ch.x) + 2; }
      if (ch.all) { text('ALL', x + 1, yy + 2, '#c8404f'); x += 13; }
      x += 3;
    }
  });
}
// descriptions for tooltips
function cardDesc(c) { const d = CARDS[c.id], v = cardVals(c); return d.desc ? d.desc(v) : ''; }
function cardKws(c) {
  const d = CARDS[c.id], v = cardVals(c); const ks = [];
  for (const k of ['exhaust', 'retain', 'innate', 'ethereal', 'unplayable']) if (cardKw(c, k)) ks.push(k);
  if (d.kws) ks.push(...d.kws);
  const ids = new Set(); for (const ch of (d.face ? d.face(v, c) : [])) if (STATUS[ch.i]) ids.add(ch.i);
  return { kws: ks, sts: [...ids].filter(i => !['oneway', 'highway', 'signal', 'roadwork', 'convoy', 'parking', 'mirror'].includes(i) || d.type === 'pwr' || i === 'parking' || i === 'mirror' || i === 'roadwork') };
}

// ---------- tooltip ----------
const Tip = {
  cur: null,
  set(x, y, title, body, opt = {}) { this.cur = { x, y, title, body, opt }; },
  draw() {
    const t = this.cur; this.cur = null; if (!t) return;
    const maxW = t.opt.w || 150; const lines = [];
    for (const para of [].concat(t.body)) { if (para == null) continue; if (typeof para === 'object') { lines.push(para); continue; } for (const l of jwrap(para, maxW - 10, 8)) lines.push({ s: l }); }
    const titleW = t.title ? jmeasure(t.title, 10) : 0;
    let w = Math.max(titleW, ...lines.map(l => l.h ? jmeasure(l.s, 8) : jmeasure(l.s || '', 8))) + 12; w = Math.min(Math.max(w, 60), maxW);
    let h = (t.title ? 15 : 4) + lines.reduce((s, l) => s + (l.h ? 12 : 10), 0) + 4;
    let x = Math.round(t.x), y = Math.round(t.y);
    if (t.opt.anchor === 'above') y -= h; if (t.opt.anchor === 'left') x -= w;
    x = clamp(x, 2, W - w - 2); y = clamp(y, 2, H - h - 2);
    G.globalAlpha = 0.94; panel(x, y, w, h, '#1d1a2a', t.opt.edge || '#5a5670'); G.globalAlpha = 1;
    let yy = y + 3;
    if (t.title) { jtext(t.title, x + 6, yy + 1, 10, t.opt.tc || '#ffe9a8'); yy += 15; rectI(x + 5, yy - 3, w - 10, 1, '#3a3550'); }
    for (const l of lines) {
      if (l.h) { if (l.icon) { drawSIcon(l.icon, x + 5, yy + 2); jtext(l.s, x + 15, yy, 8, l.c || '#ffd88a'); } else jtext(l.s, x + 6, yy, 8, l.c || '#ffd88a'); yy += 12; }
      else { jtext(l.s, x + 6, yy, 8, l.c || '#e8e4f0'); yy += 10; }
    }
  },
};
function intentText(e) {
  const it = e.intent; if (!it) return '';
  switch (it.type) {
    case 'atk': return it.n > 1 ? `攻撃：${it.d} ダメージ × ${it.n}` : `攻撃：${it.d} ダメージ` + (it.deb ? '＋弱体' : '');
    case 'def': return '守りをかためる';
    case 'buff': return '強くなる';
    case 'debuff': return 'じゃまをする';
    case 'charge': return 'ためている…';
    case 'summon': return '仲間を呼ぶ';
    case 'heal': return '回復する';
    case 'steal': return `カードをつかむ（${it.d} ダメージ）`;
  }
  return '？';
}
function statusLines(st) { const out = []; for (const id in st) { const S = STATUS[id]; if (!S || !st[id]) continue; out.push({ h: 1, s: `${S.jp} ${st[id]}`, icon: S.icon, c: S.good ? '#ffd88a' : '#d8b8ff' }); out.push(S.desc(st[id])); } return out; }
function kwLines(c) { const k = cardKws(c); const out = []; for (const id of k.kws) { const K = KEYWORDS[id]; if (K) { out.push({ h: 1, s: K[0] }); out.push(K[1]); } } for (const id of k.sts) { const S = STATUS[id]; if (S && id !== 'stop') { out.push({ h: 1, s: S.jp, icon: S.icon }); out.push(S.desc('N').replace(/N ?/g, '')); } } return out; }

// ============================================================
//  battle view: world rendering + HUD + input
// ============================================================
const BV = {
  hover: -1, drag: null, sel: null, hovEnemy: null, hovCan: -1, endHover: false, lastHoverSnd: -1, shake: {},
  reset() { this.hover = -1; this.drag = null; this.sel = null; this.hovEnemy = null; this.view = null; },
  handPos(i, n) {
    const span = Math.min(330, n * 58); const sp = n > 1 ? Math.min(60, (span - CW) / (n - 1)) : 0; const x0 = W / 2 - ((n - 1) * sp + CW) / 2 + 4;
    const k = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
    return [x0 + i * sp, H - 62 + k * k * 5];
  },
  enemyAt(mx, my) { if (!B) return null; for (const e of B.alive().slice().reverse()) { const X = e.x - Cam.x, Y = e.y - Cam.y - (e.def.fly ? 20 : 0); if (mx > X - e.w / 2 - 4 && mx < X + e.w / 2 + 4 && my > Y - e.h - 6 && my < Y + 12) return e; } return null; },
  // --- input ---
  input() {
    if (!B) return;
    const n = B.hand.length; const mx = In.mx, my = In.my;
    this.endHover = In.in(W - 50, H - 106, 44, 56);
    this.hovCan = -1; for (let i = 0; i < 3; i++) if (In.in(118 + i * 16, 1, 15, 16)) this.hovCan = i;
    if (this.view) { this.viewInput(); return; }
    if (B.choose) { this.chooseInput(); return; }
    this.hovEnemy = this.enemyAt(mx, my);
    // hovered card (topmost)
    let hov = -1;
    if (!this.drag) for (let i = n - 1; i >= 0; i--) { const [x, y] = this.handPos(i, n); const lift = i === this.hover ? 16 : 0; if (mx >= x && mx < x + CW && my >= y - lift && my < H) { hov = i; break; } }
    if (hov !== this.hover && hov >= 0 && !this.drag && !this.sel) Snd.play('hover', { pitch: 1 + hov * 0.03, gap: 0.02 });
    if (!this.sel) this.hover = hov;
    // keyboard: numbers select, E ends turn
    const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
    for (let i = 0; i < keys.length; i++) if (In.key(keys[i]) && B.hand[i]) {
      const c = B.hand[i];
      if (this.sel && this.sel.c === c) { this.tryPlay(c, this.hovEnemy || B.alive()[0]); } else this.select(c);
    }
    if (In.anyKey('KeyE', 'Space') && !this.sel) { if (endTurn()) { Snd.play('uiok'); this.hover = -1; } }
    if (In.key('Tab') && this.sel) { const al = B.alive(); if (al.length) { const i = (al.indexOf(this.selTarget) + 1) % al.length; this.selTarget = al[i]; } }
    if ((In.rpressed || In.key('Escape')) && (this.sel || this.drag)) { this.sel = null; this.drag = null; Snd.play('back'); return; }
    // mouse
    if (In.pressed) {
      if (this.sel) {
        const c = this.sel.c, d = CARDS[c.id];
        if (d.tgt === 'enemy') { const e = this.hovEnemy; if (e) this.tryPlay(c, e); else if (my > H - 80) { this.sel = null; } }
        else { if (my < H - 84 || hov >= 0 && B.hand[hov] === c) this.tryPlay(c, null); else this.sel = null; }
        return;
      }
      if (hov >= 0) { this.drag = { c: B.hand[hov], sx: mx, sy: my, moved: false }; return; }
      if (this.endHover) { if (endTurn()) { Snd.play('uiok'); } else Snd.play('error'); return; }
      if (this.hovCan >= 0 && B.run.cans[this.hovCan]) { const id = B.run.cans[this.hovCan]; if (CANS[id].tgt === 'enemy') this.sel = { can: this.hovCan, c: null }; else if (!useCan(this.hovCan, null)) Snd.play('error'); return; }
      if (In.in(4, H - 36, 30, 32)) { this.openView('draw'); return; }
      if (In.in(W - 34, H - 36, 30, 32)) { this.openView('discard'); return; }
    }
    if (this.sel && this.sel.can != null && In.pressed) { }
    if (this.drag) {
      const dr = this.drag; if (Math.abs(mx - dr.sx) + Math.abs(my - dr.sy) > 6) dr.moved = true;
      if (In.released) {
        const c = dr.c, d = CARDS[c.id]; this.drag = null;
        if (!dr.moved) { this.select(c); return; }
        if (my < H - 84) { if (d.tgt === 'enemy') { const e = this.enemyAt(mx, my); if (e) this.tryPlay(c, e); else Snd.play('back'); } else this.tryPlay(c, null); }
      }
    }
  },
  canInput() {
    if (this.sel && this.sel.can != null) {
      if (In.pressed) { const e = this.enemyAt(In.mx, In.my); if (e) useCan(this.sel.can, e); this.sel = null; }
      if (In.rpressed) this.sel = null;
      return true;
    }
    return false;
  },
  select(c) {
    if (!canPlay(c)) { this.shake[c.uid] = 10; Snd.play('error'); if (B.phase === 'player' && !Q.busy() && cardCost(c) > B.energy) Fx.label(W / 2, H - 100, 'NO ENERGY', '#ff9fb0'); else if (CARDS[c.id].cost < 0) Fx.label(W / 2, H - 100, 'UNPLAYABLE', '#ff9fb0'); return; }
    this.sel = { c }; this.hover = B.hand.indexOf(c); Snd.play('card', { pitch: 1.2 });
  },
  tryPlay(c, t) {
    if (!canPlay(c)) { this.shake[c.uid] = 10; Snd.play('error'); this.sel = null; return; }
    const d = CARDS[c.id]; if (d.tgt === 'enemy' && !t) { Snd.play('error'); return; }
    if (playCard(c, t)) { this.sel = null; this.hover = -1; this.drag = null; }
  },
  openView(pile) { const list = pile === 'draw' ? B.draw.slice().sort((a, b) => a.id.localeCompare(b.id)) : pile === 'discard' ? B.discard.slice() : B.exhaust.slice(); this.view = { pile, list, scroll: 0 }; Snd.play('page'); },
  viewInput() { const v = this.view; v.scroll = clamp(v.scroll + In.wheel * 20, 0, Math.max(0, Math.ceil(v.list.length / 7) * 84 - 180)); if (In.pressed || In.rpressed || In.key('Escape')) { this.view = null; Snd.play('back'); } },
  chooseInput() {
    const ch = B.choose; const n = ch.cards.length; const x0 = W / 2 - (n * 62 - 6) / 2;
    ch.hover = -1; for (let i = 0; i < n; i++) if (In.in(x0 + i * 62, 90, CW, CH)) ch.hover = i;
    if (In.pressed && ch.hover >= 0) { ch.pick = ch.cards[ch.hover]; Snd.play('uiok'); }
  },

  // --- world (lo canvas) ---
  drawWorld(t) {
    const ox = Cam.x - MG, oy = Cam.y - MG;
    drawStage(Game.stage, Cam.x, Cam.y, t);
    if (!B) return;
    // hazards (planted signs)
    for (const h of B.hazards) this.drawHazard(h, ox, oy, t);
    // shadows
    for (const e of B.enemies) if (e.alive || e.dying > 0) ditherEllipse(e.x - ox, GY - oy + 1, e.w * 0.5, 2, '#000000', e.def.fly ? 0.18 : 0.35);
    ditherEllipse(B.P.x + B.P.spr.ox - ox, GY - oy + 1, 13, 2, '#000000', 0.35);
    // player block props (in front of the robot)
    this.drawWalls(ox, oy, t);
    // enemies
    const tgtHi = (this.sel && this.sel.c && CARDS[this.sel.c.id].tgt === 'enemy') || (this.drag && this.drag.moved && CARDS[this.drag.c.id].tgt === 'enemy') || (this.sel && this.sel.can != null);
    for (const e of B.enemies) {
      if (!e.alive && e.dying <= 0) continue;
      const lift = (e.launch ? -Math.sin(Math.min(1, e.launch) * Math.PI) * 30 : 0) - (e.dropT > 0 ? Math.pow(e.dropT / 22, 2) * 160 : 0);
      const X = e.x - ox, Y = e.y - oy + lift;
      if (e.dying > 0) { G.globalAlpha = Math.max(0, 1 - e.dying / 26); }
      if (e.flash > 0 && (e.flash | 0) % 3 !== 2) SIL = '#ffffff';
      if (e.stopped && !SIL) { /* drawn greyed below */ }
      (EDRAW[e.def.draw] || drawEnemyGeneric)(e, X, Y, e.t);
      SIL = null; G.globalAlpha = 1;
      if (e.stopped && e.alive) { G.globalAlpha = 0.35; SIL = '#8a8aa8'; (EDRAW[e.def.draw] || drawEnemyGeneric)(e, X, Y, e.t); SIL = null; G.globalAlpha = 1; }
      if (tgtHi && e.alive && this.hovEnemy === e) this.drawBrackets(X, Y - (e.def.fly ? 20 : 0), e.w, e.h, t);
    }
    // player
    B.P.spr.draw(ox, oy);
    // visuals
    this.drawVis(ox, oy, t);
    drawParts(ox, oy);
    // enemy UI (bars, intents, statuses)
    for (const e of B.enemies) if (e.alive) this.drawEnemyUI(e, ox, oy, t);
    this.drawPlayerUI(ox, oy, t);
    // glows
    for (const e of B.enemies) if (e.alive && e._eye) glow(e._eye[0], e._eye[1], 10, e.stopped ? '#8a8aa8' : '#ffd23f', PSTAGE.key === 'night' ? 0.5 : 0.2);
    drawParts(ox, oy, 'glow');
  },
  drawBrackets(X, Y, w, h, t) {
    const b = 3 + Math.round(Math.sin(t * 0.2)); const x0 = X - w / 2 - b - 2, x1 = X + w / 2 + b + 2, y0 = Y - h - b - 2, y1 = Y + b;
    const c = '#ffe07a';
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { rectF(x, y, 5 * dx, 1, c); rectF(x, y, 1, 5 * dy, c); rectF(x + dx, y + dy, 3 * dx, 1, OUT); }
  },
  drawHazard(h, ox, oy, t) {
    const X = h.x - ox, Y = GY - oy; h.drop = Math.min(1, (h.drop || 0) + 0.1); const dy = (1 - easeOutBack(h.drop)) * -40;
    const bob = Math.sin(t * 0.05 + h.x) * 0.5;
    rectF(X - 2, Y - 30 + dy, 4, 30, OUT); rectF(X - 1, Y - 30 + dy, 2, 30, SC_.pole);
    const icon = h.kind === 'rock' ? 'rockfall' : h.kind === 'deer' ? 'deer' : 'crossing';
    G.save(); G.translate(0, dy + bob); resetFs(); ART[icon](X, Y - 36); G.restore(); resetFs();
    // countdown bubble
    const urgent = h.turns <= 1; const bx = X + 9, by = Y - 50 + dy;
    ellipseF(bx, by, 6, 6, OUT); ellipseF(bx, by, 5, 5, urgent ? ((t / 8 | 0) % 2 ? '#ff4d5a' : '#ffd23f') : '#f6f4ee');
    textC(String(Math.max(0, h.turns)), bx + 0.5, by - 3, OUT, true);
  },
  drawWalls(ox, oy, t) {
    const P = B.P; const X = P.x + 24 - ox, Y = GY - oy;
    P.walls.forEach((w, i) => {
      w.t += 1; const rise = Math.min(1, w.t / 8); const sh = w.shake > 0 ? (w.shake-- % 2 ? 1 : -1) : 0;
      const x = X + i * 5 + sh, y = Y + (1 - easeOutBack(rise)) * 20;
      this.drawWall(w.kind, x, y);
    });
    if (P.brokenWalls) { P.brokenWalls.forEach((w, i) => { const f = w.fly; if (!f) return; f.t = (f.t || 0) + 1; const x = X + i * 5 + f.vx * f.t, y = Y + f.vy * f.t + 0.15 * f.t * f.t; G.save(); G.globalAlpha = Math.max(0, 1 - f.t / 30); this.drawWall(w.kind, x, y); G.restore(); resetFs(); }); if (P.brokenWalls.every(w => w.fly && w.fly.t > 30)) P.brokenWalls = null; }
  },
  drawWall(kind, x, y) {
    if (kind === 'cone') { sCone(x, y, 16); return; }
    if (kind === 'sign') { sPole(x, y - 24, y); sCircle(x, y - 28, 7, SC_.white, SC_.red, 1); rectF(x - 5, y - 29, 10, 2, SC_.white); return; }
    if (kind === 'barricade') { ART.barricade(x, y - 12, Game.t); return; }
    // guardrail
    rectF(x - 2, y - 14, 4, 14, OUT); rectF(x - 1, y - 14, 2, 14, '#98a2ac');
    rectF(x - 9, y - 17, 18, 8, OUT); rectF(x - 8, y - 16, 16, 1, '#f4f4ee'); rectF(x - 8, y - 15, 16, 2, '#d6dade'); rectF(x - 8, y - 13, 16, 1, '#9ea6ad'); rectF(x - 8, y - 12, 16, 2, '#c7ccd0');
  },
  drawEnemyUI(e, ox, oy, t) {
    const X = Math.round(e.x - ox), Y = Math.round(e.y - oy);
    // hp bar
    const bw = clamp(e.w + 6, 30, 64); const bx = X - bw / 2, by = Y + 5;
    e.hpLag = e.hpLag > e.hp ? Math.max(e.hp, e.hpLag - Math.max(0.3, (e.hpLag - e.hp) * 0.08)) : e.hp;
    rectF(bx - 1, by - 1, bw + 2, 5, OUT); rectF(bx, by, bw, 3, '#3a3550');
    rectF(bx, by, bw * e.hpLag / e.maxhp, 3, '#ffffff'); rectF(bx, by, bw * Math.max(0, e.hp) / e.maxhp, 3, e.st.rust ? '#e08a3a' : '#ff5d73'); rectF(bx, by, bw * Math.max(0, e.hp) / e.maxhp, 1, '#ffb3bf');
    if (e.st.rust && e.st.rust >= e.hp) { const on = (t / 10 | 0) % 2; if (on) rectF(bx, by, bw * e.hp / e.maxhp, 3, '#ffa060'); }
    const hs = `${Math.max(0, e.hp)}/${e.maxhp}`; textO(hs, X - textW(hs) / 2, by + 5, '#ffffff', OUT);
    // block
    if (e.block > 0) { const sx = bx - 9, sy = by - 3; polyF([sx, sy, sx + 9, sy, sx + 9, sy + 5, sx + 4.5, sy + 10, sx, sy + 5], OUT); polyF([sx + 1, sy + 1, sx + 8, sy + 1, sx + 8, sy + 5, sx + 4.5, sy + 8.5, sx + 1, sy + 5], '#7fb8ff'); textC(String(e.block), sx + 5, sy + 2, OUT); }
    // statuses
    let sx = bx; const sy = by + 12;
    const stl = []; for (const id in e.st) if (e.st[id] && STATUS[id]) stl.push(id);
    if (e.stopNeed > 1 && e.stopCount > 0) stl.unshift('stopm');
    for (const id of stl) {
      if (id === 'stopm') { drawSIcon('stop', sx, sy); text(`${e.stopCount}/${e.stopNeed}`, sx + 8, sy + 1, '#ffb0b0'); sx += 8 + textW(`${e.stopCount}/${e.stopNeed}`) + 2; continue; }
      drawSIcon(STATUS[id].icon, sx, sy); const s = String(e.st[id]); textO(s, sx + 7, sy + 3, '#ffffff', OUT); sx += 8 + textW(s) + 1;
    }
    // intent
    const top = Y - e.h - (e.def.fly ? 26 : 8) - 12 + Math.round(Math.sin(t * 0.08 + e.uid) * 1.5);
    if (e.stopped) { drawIntent('stopped', X - 6, top, t); text('SKIP', X + 8, top + 4, '#ffb0b0'); }
    else if (e.intent && B.phase !== 'enemy' || e.intent && !e.acting) {
      const it = e.intent; const big = it.type === 'atk' && it.d * it.n >= 15;
      let s = ''; if (it.type === 'atk') s = it.n > 1 ? `${it.d}x${it.n}` : `${it.d}`;
      const w = 12 + (s ? textW(s, true) + 2 : 0) + (it.deb ? 8 : 0); const ix = X - w / 2;
      if (it.type === 'charge') { const pul = (t / 6 | 0) % 2; if (pul) ellipseF(X, top + 6, 10, 8, '#ffd23f33'); }
      drawIntent(it.type, ix, top, t, big);
      if (s) textO(s, ix + 13, top + 3, it.type === 'atk' ? (big ? '#ffd23f' : '#ffffff') : '#ffffff', OUT, true);
      if (it.deb) drawIntent('debuff', ix + w - 9, top + 2, t);
      if (this.hovEnemy === e && e.acting) { }
    }
  },
  drawPlayerUI(ox, oy, t) {
    const P = B.P; const X = Math.round(P.x - ox), Y = Math.round(P.y - oy);
    const bw = 44, bx = X - bw / 2, by = Y + 5;
    P.hpLag = P.hpLag == null ? P.hp : P.hpLag > P.hp ? Math.max(P.hp, P.hpLag - Math.max(0.3, (P.hpLag - P.hp) * 0.08)) : P.hp;
    rectF(bx - 1, by - 1, bw + 2, 5, OUT); rectF(bx, by, bw, 3, '#3a3550'); rectF(bx, by, bw * P.hpLag / P.maxhp, 3, '#ffffff'); rectF(bx, by, bw * Math.max(0, P.hp) / P.maxhp, 3, P.block > 0 ? '#7fb8ff' : '#7dff9a'); rectF(bx, by, bw * Math.max(0, P.hp) / P.maxhp, 1, '#ffffff');
    const hs = `${Math.max(0, P.hp)}/${P.maxhp}`; textO(hs, X - textW(hs) / 2, by + 5, '#ffffff', OUT);
    if (P.block > 0) { const sx = bx - 11, sy = by - 4; polyF([sx, sy, sx + 10, sy, sx + 10, sy + 6, sx + 5, sy + 11, sx, sy + 6], OUT); polyF([sx + 1, sy + 1, sx + 9, sy + 1, sx + 9, sy + 6, sx + 5, sy + 9.5, sx + 1, sy + 6], '#7fb8ff'); textC(String(P.block), sx + 5.5, sy + 2, OUT); }
    let sx = bx; const sy = by + 12;
    for (const id in P.st) { if (!P.st[id] || !STATUS[id]) continue; drawSIcon(STATUS[id].icon, sx, sy); const s = String(P.st[id]); textO(s, sx + 7, sy + 3, '#ffffff', OUT); sx += 8 + textW(s) + 1; }
  },
  drawVis(ox, oy, t) {
    const L = B.vis;
    for (let i = 0; i < L.length; i++) {
      const v = L[i]; const u = v.t / v.life;
      switch (v.k) {
        case 'stopsign': {
          const X = v.x - ox, Y = GY - oy; const drop = Math.min(1, v.t / 6); const yy = lerp(-120, 0, easeIn(drop));
          const s = v.small ? 0.7 : 1; const fade = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
          if ((u < 0.75 || (v.t | 0) % 2) && fade > 0) { sPole(X, Y - 46 * s + yy, Y + yy); sStopSign(X, Y - 54 * s + yy, 14 * s); }
          break;
        }
        case 'proj': {
          const k = clamp(v.t / v.life, 0, 1); const x = lerp(v.sx, v.ex, k) - ox, y = lerp(v.sy, v.ey, k) - Math.sin(k * Math.PI) * v.arc - oy;
          if (v.kind === 'cone') { G.save(); resetFs(); sCone(x, y + 7, 12); G.restore(); resetFs(); }
          else { R.begin(x, y, 1, 1, 1, v.t * 0.6); R.rect(-4, -1.5, 8, 3, '#c7ccd6'); R.rect(2, -3, 3, 6, '#9aa0ad'); R.flush(OUT); }
          break;
        }
        case 'eproj': {
          const k = clamp(v.t / v.life, 0, 1); const x = lerp(v.sx, v.ex, k) - ox, y = lerp(v.sy, v.ey, k) - Math.sin(k * Math.PI) * (v.kind === 'can' ? 30 : 4) - oy;
          if (v.kind === 'can') { R.begin(x, y, 1, 1, 1, v.t * 0.5); R.rect(-3, -4, 6, 8, '#e8534f'); R.flush(OUT); R.drect(-3, -1, 6, 2, '#f6f4ee'); }
          else if (v.kind === 'gust') { for (let q = 0; q < 3; q++) lineF(x + q * 5, y - 4 + q * 4, x + q * 5 + 10, y - 4 + q * 4, '#e6f2ff'); }
          else { ellipseF(x, y, 4, 4, OUT); ellipseF(x, y, 3, 3, '#ff5fa2'); ellipseF(x - 1, y - 1, 1.5, 1.5, '#ffffff'); glow(x, y, 12, '#ff5fa2', 0.6); }
          break;
        }
        case 'laser': { const e = v.e; if (!e._eye) break; const x0 = e._eye[0], y0 = e._eye[1], x1 = B.P.x - ox + 4, y1 = B.P.y - 22 - oy; const w = v.t < 4 ? 7 : Math.max(1, 6 - v.t * 0.3); lineF(x0, y0, x1, y1, '#ff4f9a', Math.round(w) + 2); lineF(x0, y0, x1, y1, '#ffd0e8', Math.max(1, Math.round(w) - 1)); for (let q = 0; q <= 6; q++) glow(lerp(x0, x1, q / 6), lerp(y0, y1, q / 6), 16, '#ff4f9a', 0.4); break; }
        case 'rock': {
          const X = v.x - ox, Y = v.y - oy; if (u < 0.9) { ellipseF(X, Y, v.r + 1, v.r, OUT); ellipseF(X, Y, v.r, v.r - 1, '#8a7a68'); px(X - 1, Y - 2, '#b8a888'); }
          break;
        }
        case 'deer': {
          const X = lerp(-40, v.tx, easeIn(clamp(v.t / 26, 0, 1))) - ox, Y = GY - oy - Math.abs(Math.sin(v.t * 0.5)) * 6;
          if (v.t < 30) { const b = '#8a5a3a'; rectF(X - 10, Y - 16, 18, 8, OUT); rectF(X - 9, Y - 15, 16, 6, b); rectF(X + 6, Y - 24, 4, 10, b); rectF(X + 6, Y - 25, 7, 4, b); lineF(X + 8, Y - 25, X + 5, Y - 31, '#6a3a22'); lineF(X + 10, Y - 25, X + 13, Y - 31, '#6a3a22'); const ph = (v.t / 3 | 0) % 2; for (const lx of [-8, -4, 2, 6]) rectF(X + lx + (ph ? 1 : -1), Y - 9, 2, 9, b); px(X + 11, Y - 24, '#1e1c28'); }
          break;
        }
        case 'gate': {
          const X = v.x - ox, Y = GY - oy; v.down = clamp(v.t / 12, 0, 1) * (v.t > v.life - 16 ? (v.life - v.t) / 16 : 1); const on = (v.t / 8 | 0) % 2;
          rectF(X - 3, Y - 44, 6, 44, OUT); rectF(X - 2, Y - 44, 4, 44, '#f6f4ee'); for (let k = 0; k < 44; k += 8) rectF(X - 2, Y - 44 + k, 4, 4, '#1e1c28');
          rectF(X - 14, Y - 48, 28, 8, OUT); ellipseF(X - 8, Y - 44, 3, 3, on ? '#ff4d3a' : '#5a1a1a'); ellipseF(X + 8, Y - 44, 3, 3, on ? '#5a1a1a' : '#ff4d3a');
          glow(X + (on ? -8 : 8), Y - 44, 14, '#ff4d3a', 0.7);
          const a = lerp(-1.4, 0, easeOut(v.down)); const bx1 = X + Math.cos(a) * 50, by1 = Y - 26 + Math.sin(a) * 50;
          lineF(X, Y - 26, bx1, by1, OUT, 5); for (let k = 0; k < 6; k++) { const k0 = k / 6, k1 = (k + 1) / 6; lineF(lerp(X, bx1, k0), lerp(Y - 26, by1, k0), lerp(X, bx1, k1), lerp(Y - 26, by1, k1), k % 2 ? '#e0415a' : '#f6f4ee', 3); }
          break;
        }
        case 'train': {
          const X = v.x - ox, Y = GY - oy + 6;
          for (let car = 0; car < 4; car++) {
            const cx = X - car * 92; if (cx > W + MG * 2 + 100 || cx < -120) continue;
            rectF(cx - 2, Y - 56, 90, 54, OUT); rectF(cx, Y - 54, 86, 50, car === 0 ? '#e8e2d4' : '#dcd6c8'); rectF(cx, Y - 30, 86, 6, '#2f9a58'); rectF(cx, Y - 22, 86, 2, '#e0a030');
            for (let w = 0; w < 5; w++) rectF(cx + 6 + w * 16, Y - 48, 12, 12, PSTAGE.key === 'night' ? '#ffe7a0' : '#3a4a6a');
            if (car === 0) { rectF(cx + 76, Y - 50, 8, 16, '#3a4a6a'); ellipseF(cx + 82, Y - 14, 3, 3, '#fff3b0'); glow(cx + 86, Y - 14, 30, '#fff3b0', 0.6); }
            for (const wx of [cx + 12, cx + 30, cx + 56, cx + 74]) { ellipseF(wx, Y - 3, 5, 5, OUT); ellipseF(wx, Y - 3, 3, 3, '#6d7380'); }
          }
          for (let q = 0; q < 6; q++) lineF(X - 380 + rnd(0, 380), Y - rnd(4, 54), X - 380 + rnd(0, 380) - 40, Y - rnd(4, 54), '#ffffff');
          break;
        }
        case 'stpop': { const X = v.x - ox, Y = v.y - oy - u * 10; if (u < 0.85 || (v.t | 0) % 2) { const s = STATUS[v.id]; if (s) { ellipseF(X, Y + 3, 7, 7, OUT); ellipseF(X, Y + 3, 6, 6, s.good ? '#fff3a0' : '#e8dcff'); drawSIcon(s.icon, X - 3, Y); } } break; }
        case 'hzpulse': { const h = v.h; const X = h.x + 9 - ox, Y = GY - 50 - oy; ringF(X, Y, 6 + u * 8, 1, '#ffd23f'); break; }
        case 'hzfire': { const X = v.x - ox, Y = GY - 36 - oy; ringF(X, Y, 8 + u * 20, 2, '#ffd23f'); break; }
        case 'missile': { const X = v.x - ox, k = clamp(v.t / 8, 0, 1), Y = lerp(-20, GY - 14, easeIn(k)) - oy; if (v.t <= 8) { R.begin(X, Y, 1, 1, 1, Math.PI / 2); R.rect(-7, -2, 12, 4, '#d8d4c8'); R.rect(4, -2, 3, 4, '#e0415a'); R.flush(OUT); Fx.fire(v.x, lerp(-20, GY - 14, easeIn(k)) - 8, 1, 0.8); } break; }
        case 'signal': { const X = B.P.x - ox, Y = B.P.y - 70 - oy; const cols = ['#2fd07a', '#ffc23c', '#ff4d5a']; rectF(X - 13, Y - 5, 26, 10, OUT); for (let q = 0; q < 3; q++) ellipseF(X - 8 + q * 8, Y, 3, 3, q === v.ph ? cols[q] : '#3a3a44'); glow(X - 8 + v.ph * 8, Y, 18, cols[v.ph], 0.8 * (1 - u)); break; }
      }
    }
  },
  // advance visual objects in update time (so speed never depends on the display rate)
  stepVis(ts) {
    for (const v of B.vis) {
      v.t += ts;
      if (v.k === 'rock') {
        if (!v.done) { v.vy += 0.5 * ts; v.y += v.vy * ts; const e = v.e; const top = e.y - e.h * (e.def.fly ? 1.4 : 1); if (v.y >= top) { v.done = true; v.vy = -3; v.vx = rnd(-2, 2); Fx.dust(v.x, top, 4, 1.2); Fx.bits(v.x, top, 5, ['#8a7a68', '#6a5a4a', '#b8a888']); Snd.play('land', { x: v.x, p: 0.8 }); } }
        else { v.vy += 0.4 * ts; v.y += v.vy * ts; v.x += v.vx * ts; }
      }
    }
    B.vis = B.vis.filter(v => v.t < v.life);
    if (B.banner) { B.banner.t += ts; if (B.banner.t >= B.banner.life) B.banner = null; }
  },

  // --- HUD (hud canvas) ---
  drawHud(t) {
    const run = Run.cur; if (!run) return;
    drawTopBar(run, t, B ? B.P.hp : run.hp, B ? B.P.maxhp : run.maxhp);
    if (!B) return;
    // energy battery
    const ex = 10, ey = H - 102; const full = B.energy > 0;
    panel(ex, ey, 40, 38, '#2d2940', OUT);
    rectI(ex + 7, ey + 5, 26, 28, OUT); rectI(ex + 8, ey + 6, 24, 26, '#15121c'); rectI(ex + 14, ey + 2, 12, 4, OUT);
    const mx = Math.max(B.maxEnergy + (hasRelic('v8') ? 1 : 0) + (hasRelic('bigtank') ? 1 : 0), B.energy);
    for (let i = 0; i < mx; i++) { const cy = ey + 28 - i * (24 / mx); rectI(ex + 10, Math.round(cy - 24 / mx + 2), 20, Math.max(1, Math.round(24 / mx - 2)), i < B.energy ? ((t / 10 | 0) % 8 === i ? '#fff3a0' : '#ffd23f') : '#3a3550'); }
    const es = `${B.energy}/${B.maxEnergy + (hasRelic('v8') ? 1 : 0) + (hasRelic('bigtank') ? 1 : 0)}`; textO(es, ex + 20 - textW(es, true) / 2, ey + 40, full ? '#ffd23f' : '#8a86a0', OUT, true);
    // piles
    this.drawPile(6, H - 34, B.draw.length, 'draw', t); this.drawPile(W - 32, H - 34, B.discard.length, 'discard', t);
    if (B.exhaust.length) { text('X' + B.exhaust.length, W - 30, H - 42, '#b58cff'); }
    // end turn: traffic signal
    this.drawEndButton(t);
    // hover info for enemies / the robot (only when not aiming or dragging)
    if (!this.sel && !this.drag && this.hover < 0 && !B.choose && !this.view) {
      const e = this.hovEnemy;
      if (e) {
        const it = e.intent; const lines = [];
        if (e.stopped) lines.push({ h: 1, s: '止まっている：次の行動をしない', c: '#ff9fb0' });
        else if (it) lines.push({ h: 1, s: intentText(e), c: it.type === 'atk' ? '#ff9fb0' : '#9fd0ff' });
        if (it && it.note && !e.stopped) lines.push(it.note);
        if (e.stopNeed > 1) lines.push({ h: 1, s: `止まれ ${e.stopCount}/${e.stopNeed}`, icon: 'stop', c: '#ffb0b0' }, `止まれを ${e.stopNeed} 回当てると止まる。`);
        lines.push(...statusLines(e.st));
        const X = e.x - Cam.x; Tip.set(X > W / 2 ? X - e.w / 2 - 158 : X + e.w / 2 + 6, e.y - Cam.y - e.h - 30, `${e.def.jp}　${Math.max(0, e.hp)}/${e.maxhp}`, lines, { w: 150 });
      } else if (Math.abs(In.mx - (B.P.x - Cam.x)) < 16 && In.my > B.P.y - Cam.y - 40 && In.my < B.P.y - Cam.y + 20) {
        const lines = [`HP ${B.P.hp}/${B.P.maxhp}　ブロック ${B.P.block}`, ...statusLines(B.P.st)];
        if (B.hazards.length) lines.push({ h: 1, s: `危険標識 ${B.hazards.length} 本`, icon: 'hazard' });
        Tip.set(B.P.x - Cam.x + 20, B.P.y - Cam.y - 60, 'ロボット', lines, { w: 150 });
      } else {
        for (const h of B.hazards) if (Math.abs(In.mx - (h.x - Cam.x)) < 10 && In.my > GY - Cam.y - 60 && In.my < GY - Cam.y) {
          const nm = { rock: '落石注意', deer: '動物注意', train: '踏切あり' }[h.kind]; const d = Math.floor(h.d * (hasRelic('triangle') ? 1.5 : 1));
          Tip.set(h.x - Cam.x + 12, GY - Cam.y - 70, nm, [`あと ${h.turns} ターンで発動。`, h.kind === 'deer' ? `ランダムな敵に ${d} ダメージ。` : `敵全体に ${d} ダメージ。`], { w: 140 });
        }
      }
    }
    // hand
    this.drawHand(t);
    this.drawHudVis(t);
    // choose overlay (peek)
    if (B.choose) this.drawChoose(t);
    if (this.view) this.drawView(t);
    // banner
    if (B.banner) this.drawBanner(t);
  },
  // HUD-space animations that live in B.vis (aged by stepVis)
  drawHudVis(t) {
    for (const v of B.vis) {
      const u = clamp(v.t / v.life, 0, 1);
      switch (v.k) {
        case 'shuffle': for (let i = 0; i < v.n; i++) { const k = clamp(u * 1.6 - i * 0.08, 0, 1); if (k <= 0 || k >= 1) continue; const x = lerp(W - 30, 8, easeInOut(k)), y = H - 34 - Math.sin(k * Math.PI) * 40; panel(x, y, 20, 28, '#6a4a5a'); } break;
        case 'cardto': { const k = easeInOut(u); const x = lerp(v.sx - Cam.x, v.pile === 'draw' ? 8 : W - 30, k), y = lerp(v.sy - Cam.y, H - 34, k) - Math.sin(k * Math.PI) * 30; if (u < 1) G.drawImage(cardFace({ id: v.id, up: false, uid: -1 }, null, false), Math.round(x), Math.round(y), 28, 39); break; }
        case 'grabcard': { const e = v.e; const k = easeIn(u); const x = lerp(W / 2 - 28, e.x - Cam.x - 14, k), y = lerp(H - 80, e.y - Cam.y - e.h * 0.7, k); if (u < 1) G.drawImage(cardFace(v.c, null, false), Math.round(x), Math.round(y), Math.round(CW * (1 - k * 0.5)), Math.round(CH * (1 - k * 0.5))); break; }
        case 'relicpop': { const i = B.run.relics.indexOf(v.id); if (i < 0) break; const x = W - 22 - B.run.relics.length * 15 + i * 15, y = 2 + Math.sin(u * Math.PI) * 6; ringF(x + 7, y + 7, 6 + u * 10, 1, '#ffe07a'); drawRIcon(v.id, x, y + 4); break; }
        case 'canpop': { const y = 30 - u * 10; drawCIcon(v.id, W / 2 - 6, y); ringF(W / 2, y + 7, 6 + u * 14, 1, '#ffffff'); break; }
        case 'nrgpop': { ringF(30, H - 83, 14 + u * 14, 2, '#ffd23f'); break; }
        case 'exhaust': { if (u < 1) { const x = W / 2 - CW / 2, y = 60 - u * 20; G.globalAlpha = 1 - u; G.drawImage(cardFace(v.c, null, true), x, y); G.globalAlpha = 1; for (let i = 0; i < 3; i++) Fx.add({ k: 'fire', x: x + rnd(0, CW) + Cam.x, y: y + rnd(0, CH) + Cam.y, vx: 0, vy: -1, r: 2, life: 12 }); } break; }
      }
    }
  },
  drawPile(x, y, n, kind, t) {
    const hov = In.in(x - 2, y - 2, 30, 32);
    for (let i = 2; i >= 0; i--) { const o = i * 2; panel(x + o, y - o, 20, 28, kind === 'draw' ? '#3a4a8a' : '#6a4a5a', OUT); rectI(x + o + 2, y - o + 2, 16, 24, kind === 'draw' ? '#4a5aa8' : '#8a5a6a'); }
    polyF([x + 10, y + 6, x + 17, y + 14, x + 10, y + 22, x + 3, y + 14], kind === 'draw' ? '#f6f4ee' : '#ffd0d8');
    textO(String(n), x + 22 - textW(String(n), true) / 2, y + 20, hov ? '#ffe07a' : '#ffffff', OUT, true);
    if (hov) Tip.set(x + (kind === 'draw' ? 30 : -150), y - 40, kind === 'draw' ? '山札' : '捨て札', [`${n} 枚。クリックで中身を見る。`, kind === 'draw' ? '（順番はわからない）' : '山札がなくなると、切り直して山札に戻る。']);
  },
  drawEndButton(t) {
    const x = W - 50, y = H - 106; const can = B.phase === 'player' && !Q.busy() && !B.over;
    const hov = this.endHover && can; const anyPlayable = B.hand.some(c => canPlay(c));
    const ph = !can ? 2 : anyPlayable ? 1 : 0; // 0 green, 1 yellow, 2 red
    panel(x + 10, y, 24, 50, '#2a2d38', OUT); rectI(x + 20, y + 50, 4, 8, OUT);
    const cols = [['#2fd07a', '#123a24'], ['#ffc23c', '#4a3a12'], ['#ff4d5a', '#4a1418']];
    for (let i = 0; i < 3; i++) { const cy = y + 9 + i * 15; ellipseF(x + 22, cy, 6, 6, OUT); const on = (2 - i) === ph; ellipseF(x + 22, cy, 5, 5, on ? cols[2 - i][0] : cols[2 - i][1]); if (on) { px(x + 20, cy - 2, '#ffffff'); glow(x + 22, cy, hov ? 22 : 16, cols[2 - i][0], hov ? 0.9 : 0.5); } }
    const s = can ? 'GO' : 'WAIT'; textO(s, x + 22 - textW(s, true) / 2, y + 60, hov ? '#ffe07a' : can ? '#ffffff' : '#8a86a0', OUT, true);
    if (hov) Tip.set(x - 100, y + 4, 'ターン終了', ['敵のターンになる。', ph === 1 ? 'まだ使えるカードがある。' : '', '（E / Space）'].filter(Boolean), { w: 110 });
  },
  drawHand(t) {
    const n = B.hand.length; const tgt = this.hovEnemy || (this.sel && this.selTarget) || null;
    // cards leaving (limbo / discard)
    for (const c of B.limbo) if (c.play) { c.play.t++; const k = easeIn(clamp(c.play.t / 9, 0, 1)); const x = lerp(c._x || W / 2, c.play.tx - Cam.x, k) - CW / 2 * (1 - k * 0.6), y = lerp(c._y || H - 70, c.play.ty - Cam.y - 30, k); G.globalAlpha = 1 - k * 0.3; const s = 1 - k * 0.5; G.drawImage(cardFace(c, tgt, true), Math.round(x), Math.round(y), Math.round(CW * s), Math.round(CH * s)); G.globalAlpha = 1; if (k > 0.8) { G.globalAlpha = (k - 0.8) * 4; rectI(Math.round(x), Math.round(y), Math.round(CW * s), Math.round(CH * s), '#ffffff'); G.globalAlpha = 1; } }
    const hovIdx = this.sel ? B.hand.indexOf(this.sel.c) : this.hover;
    for (let i = 0; i < n; i++) {
      const c = B.hand[i]; let [x, y] = this.handPos(i, n);
      if (hovIdx >= 0 && i !== hovIdx) x += (i < hovIdx ? -1 : 1) * Math.max(0, 12 - Math.abs(i - hovIdx) * 3);
      if (c._x == null) { c._x = 10; c._y = H - 40; }
      if (c.fly && c.fly.t === 0) { if (c.fly.from === 'draw') { c._x = 8; c._y = H - 30; } else if (c.fly.from === 'enemy') { c._x = c.fly.ex - Cam.x; c._y = c.fly.ey - Cam.y; } else { c._x = W / 2 - CW / 2; c._y = 90; } }
      if (c.fly) { c.fly.t++; if (c.fly.t > 20) c.fly = null; }
      const isDrag = this.drag && this.drag.c === c && this.drag.moved, isSel = this.sel && this.sel.c === c;
      let tx = x, ty = y;
      if (i === hovIdx) ty = H - 80;
      if (isDrag) { tx = In.mx - CW / 2; ty = In.my - CH / 2; }
      const sh = this.shake[c.uid] > 0 ? (this.shake[c.uid]-- % 2 ? 2 : -2) : 0;
      c._x = lerp(c._x, tx, 0.35); c._y = lerp(c._y, ty + Math.sin(t * 0.05 + i * 0.8) * (i === hovIdx ? 0 : 0.6), 0.35);
      const playable = canPlay(c) || (B.phase !== 'player' && cardCost(c) <= B.energy && CARDS[c.id].cost >= 0);
      if (i === hovIdx && !isDrag && !isSel) continue; // drawn last (zoomed)
      if (isDrag && CARDS[c.id].tgt === 'enemy' && In.my < H - 84) { G.globalAlpha = 0.5; G.drawImage(cardFace(c, tgt, playable), Math.round(x), Math.round(H - 80)); G.globalAlpha = 1; continue; }
      G.drawImage(cardFace(c, tgt, playable), Math.round(c._x + sh), Math.round(c._y));
      if (i < 10 && In.lastPointer === 'mouse' && !isDrag) text(String((i + 1) % 10), Math.round(c._x + CW - 7), Math.round(c._y + 3), '#ffffff');
    }
    // hovered / selected card zoomed
    if (hovIdx >= 0 && hovIdx < n) {
      const c = B.hand[hovIdx]; const isDrag = this.drag && this.drag.c === c && this.drag.moved;
      if (!isDrag) {
        const playable = canPlay(c) || (B.phase !== 'player' && CARDS[c.id].cost >= 0);
        const zx = clamp(Math.round(c._x + CW / 2 - CW), 2, W - CW * 2 - 2), zy = H - CH * 2 - 2 + (this.sel && this.sel.c === c ? -6 : 0);
        G.drawImage(cardFace(c, tgt, playable), zx, zy, CW * 2, CH * 2);
        if (this.sel && this.sel.c === c) { const on = (t / 6 | 0) % 2; rectI(zx - 2, zy - 2, CW * 2 + 4, 2, on ? '#ffe07a' : '#ffffff'); rectI(zx - 2, zy + CH * 2, CW * 2 + 4, 2, on ? '#ffe07a' : '#ffffff'); rectI(zx - 2, zy, 2, CH * 2, on ? '#ffe07a' : '#ffffff'); rectI(zx + CW * 2, zy, 2, CH * 2, on ? '#ffe07a' : '#ffffff'); }
        const d = CARDS[c.id]; const tipX = zx + CW * 2 + 4 > W - 160 ? zx - 154 : zx + CW * 2 + 4;
        Tip.set(tipX, zy + 4, d.jp + (c.up ? '＋' : ''), [{ h: 1, s: `${TYPEJP[d.type] || ''}　${RARJP[d.rar] || ''}`, c: '#9a96b0' }, cardDesc(c), ...kwLines(c)], { w: 150 });
      }
    }
    // targeting arrow
    const selC = this.sel && this.sel.c; const dragC = this.drag && this.drag.moved && this.drag.c;
    if ((selC && CARDS[selC.id].tgt === 'enemy') || (dragC && CARDS[dragC.id].tgt === 'enemy' && In.my < H - 84) || (this.sel && this.sel.can != null)) {
      const c = selC || dragC; const sx = c ? c._x + CW / 2 : 118 + this.sel.can * 16 + 7, sy = c ? (selC ? H - CH * 2 - 6 : H - 80) : 16;
      this.drawArrow(sx, sy, In.mx, In.my, !!this.hovEnemy, t);
    }
    if (this.sel && this.sel.can != null) text('TARGET?', In.mx + 6, In.my + 6, '#ffe07a');
  },
  drawArrow(x0, y0, x1, y1, hit, t) {
    const n = 14; const midx = (x0 + x1) / 2, midy = Math.min(y0, y1) - 40;
    let px0 = x0, py0 = y0;
    for (let i = 1; i <= n; i++) {
      const k = i / n; const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * midx + k * k * x1, y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * midy + k * k * y1;
      if ((i + (t / 4 | 0)) % 2 === 0 || i === n) { rectF(x - 2, y - 2, 4, 4, OUT); rectF(x - 1, y - 1, 2, 2, hit ? '#ffe07a' : '#ffffff'); }
      px0 = x; py0 = y;
    }
    const a = Math.atan2(y1 - midy, x1 - midx);
    polyO([x1 + Math.cos(a) * 5, y1 + Math.sin(a) * 5, x1 + Math.cos(a + 2.4) * 6, y1 + Math.sin(a + 2.4) * 6, x1 + Math.cos(a - 2.4) * 6, y1 + Math.sin(a - 2.4) * 6], hit ? '#ffe07a' : '#ffffff');
  },
  drawChoose(t) {
    const ch = B.choose; G.globalAlpha = 0.7; rectI(0, 0, W, H, '#0d0c14'); G.globalAlpha = 1;
    textC(ch.title === '1枚えらぶ' ? 'PICK 1' : 'PICK', W / 2, 70, '#ffe07a', true, 1, OUT);
    const n = ch.cards.length; const x0 = W / 2 - (n * 62 - 6) / 2;
    ch.cards.forEach((c, i) => { const y = 90 - (ch.hover === i ? 4 : 0); G.drawImage(cardFace(c, null, true), Math.round(x0 + i * 62), y); });
    if (ch.hover >= 0) { const c = ch.cards[ch.hover]; Tip.set(x0 + ch.hover * 62, 172, CARDS[c.id].jp + (c.up ? '＋' : ''), [cardDesc(c)]); }
  },
  drawView(t) {
    const v = this.view; G.globalAlpha = 0.85; rectI(0, 0, W, H, '#0d0c14'); G.globalAlpha = 1;
    textC(v.pile === 'draw' ? 'DRAW PILE' : v.pile === 'discard' ? 'DISCARD' : 'EXHAUSTED', W / 2, 8, '#ffe07a', true, 1, OUT);
    drawCardGrid(v.list, 30, v.scroll, t, null);
    textC('CLICK TO CLOSE', W / 2, H - 10, '#8a86a0');
  },
  drawBanner(t) {
    const b = B.banner; const u = b.t / b.life; if (u >= 1) return;
    const inU = easeOut(clamp(b.t / 8, 0, 1)), outU = u > 0.75 ? easeIn((u - 0.75) / 0.25) : 0;
    const y = 96, hgt = b.k === 'fight' ? 34 : 24; const x = (1 - inU) * W - outU * W;
    const col = b.k === 'go' ? '#2fb06a' : b.k === 'stop' ? '#d8363f' : '#1e1c28';
    G.globalAlpha = 0.9; polyF([x - 20, y, x + W + 20, y - 6, x + W + 20, y + hgt - 6, x - 20, y + hgt], col); G.globalAlpha = 1;
    rectF(x - 20, y + hgt, W + 40, 1, '#ffffff');
    if (b.k === 'fight') { textC(B.kind === 'boss' ? 'BOSS' : B.kind === 'elite' ? 'ELITE' : 'ENCOUNTER', W / 2 + x, y + 9, '#ffffff', true, 2, OUT); }
    else { const s = b.k === 'go' ? 'YOUR TURN' : 'ENEMY TURN'; textC(s, W / 2 + x, y + 5, '#ffffff', true, 2, OUT); }
  },
};

// ---------- shared: top bar, card grid ----------
function drawTopBar(run, t, hp, maxhp) {
  G.globalAlpha = 0.82; rectI(0, 0, W, 18, '#15121c'); G.globalAlpha = 1; rectI(0, 18, W, 1, '#3a3550');
  // hp
  ellipseF(9.5, 9, 6, 6, OUT); ellipseF(9.5, 9, 5, 5, '#ece6d6'); ellipseF(10.5, 9, 3, 3, PC.sock); ellipseF(10.5, 9, 2, 2, hp < maxhp * 0.3 && (t % 30) < 15 ? '#ff4d5a' : PC.eye);
  const hs = `${Math.max(0, hp)}/${maxhp}`; textO(hs, 19, 5, hp < maxhp * 0.3 ? '#ff8a9a' : '#ffffff', OUT, true);
  // scrap
  const sx = 19 + textW(hs, true) + 10;
  ellipseF(sx + 4.5, 9, 4, 4, OUT); ellipseF(sx + 4.5, 9, 3, 3, '#c7ccd6'); ellipseF(sx + 4.5, 9, 1, 1, OUT); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.01; px(sx + 4 + Math.cos(a) * 4, sx * 0 + 8.5 + Math.sin(a) * 4, '#c7ccd6'); }
  const ss = String(run.scrap); textO(ss, sx + 11, 5, '#ffe07a', OUT, true);
  // cans
  for (let i = 0; i < 3; i++) {
    const x = 118 + i * 16, y = 2; const id = run.cans[i]; const hov = typeof BV !== 'undefined' && BV.hovCan === i && Game.state === 'battle';
    rectI(x, y, 15, 15, hov ? '#4a4660' : '#2a2638'); rectI(x, y + 14, 15, 1, '#3a3550');
    if (id) { drawCIcon(id, x + 1, y); if (hov || (Game.state !== 'battle' && In.in(x, y, 15, 16))) Tip.set(x, 20, CANS[id].jp, [CANS[id].desc, Game.state === 'battle' ? 'クリックで使う。' : '戦闘中に使える。']); }
  }
  // act / floor
  const fs2 = `${run.act + 1}-${run.floor}`; textO(fs2, W / 2 - textW(fs2, true) / 2, 5, '#bdb6d8', OUT, true);
  if (run.alert) { const as = `!${run.alert}`; textO(as, W / 2 + textW(fs2, true) / 2 + 6, 5, '#ff8a3c', OUT, true); }
  // relics
  const rx0 = W - 22 - run.relics.length * 15;
  run.relics.forEach((id, i) => {
    const x = rx0 + i * 15, y = 2; drawRIcon(id, x, y);
    if (In.in(x, y, 15, 16)) Tip.set(Math.min(x, W - 150), 20, RELICS[id].jp, [RELICS[id].desc]);
  });
  // deck button
  const dx = W - 18; panel(dx, 2, 15, 15, '#3a3550', OUT); rectI(dx + 4, 4, 7, 10, '#f6f4ee'); rectI(dx + 3, 5, 7, 10, OUT); rectI(dx + 4, 6, 5, 8, '#c7ccd6');
  text(String(run.deck.length), dx - textW(String(run.deck.length)) - 2, 7, '#bdb6d8');
  if (In.in(dx, 2, 15, 16)) Tip.set(W - 120, 20, 'デッキ', [`${run.deck.length} 枚。クリックで見る（D）。`]);
}
function drawCardGrid(list, y0, scroll, t, hl) {
  const cols = 7, gap = 6, x0 = W / 2 - (cols * (CW + gap) - gap) / 2; let hov = -1;
  G.save(); G.beginPath(); G.rect(0, y0 - 4, W, H - y0 - 14); G.clip(); resetFs();
  list.forEach((c, i) => {
    const x = x0 + (i % cols) * (CW + gap), y = y0 + Math.floor(i / cols) * (CH + 6) - scroll; if (y > H || y + CH < 0) return;
    const h = In.in(x, y, CW, CH) && In.my > y0 - 4 && In.my < H - 14; if (h) hov = i;
    const face = cardFace(c, null, true); G.drawImage(face, x, y - (h ? 2 : 0));
    if (hl && hl(c)) { rectI(x - 1, y - 3, CW + 2, 1, '#ffe07a'); }
  });
  G.restore(); resetFs();
  if (hov >= 0) { const c = list[hov]; const x = x0 + (hov % cols) * (CW + gap); Tip.set(x + CW + 2 > W - 150 ? x - 152 : x + CW + 2, y0 + Math.floor(hov / cols) * (CH + 6) - scroll, CARDS[c.id].jp + (c.up ? '＋' : ''), [cardDesc(c), ...kwLines(c)], { w: 150 }); }
  return hov;
}
