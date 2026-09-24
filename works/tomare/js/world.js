'use strict';
// ============================================================
//  world: rooms, tiles, collision, terrain/prop rendering, objects
// ============================================================
let ROOM = null;

function tileAt(tx, ty) {
  const r = ROOM; if (tx < 0 || tx >= r.w) return 1; if (ty < 0) return 0; if (ty >= r.h) return 1;
  return r.tiles[ty * r.w + tx];
}
function solidPx(x, y) { return tileAt(Math.floor(x / TILE), Math.floor(y / TILE)) === 1; }
function standPx(x, y) { const t = tileAt(Math.floor(x / TILE), Math.floor(y / TILE)); return t === 1 || t === 2; }
function groundBelow(x, y, max = 200) { // returns y of first standable surface at/below y
  let ty = Math.floor(y / TILE); const tx = Math.floor(x / TILE);
  for (let i = 0; i < max / TILE; i++, ty++) { const t = tileAt(tx, ty); if (t === 1 || t === 2) return ty * TILE; }
  return null;
}

// generic AABB body mover. e: {x (center), y (feet), w, h, vx, vy}
function moveBody(e, ts, opt = {}) {
  e.hitWall = 0; e.hitCeil = false;
  const dxT = e.vx * ts, steps = Math.max(1, Math.ceil(Math.abs(dxT) / 3)), sx = dxT / steps;
  for (let i = 0; i < steps && sx !== 0; i++) {
    e.x += sx;
    const l = e.x - e.w / 2, r = e.x + e.w / 2, t = e.y - e.h + 0.01, b = e.y - 0.01;
    const tx = sx > 0 ? Math.floor(r / TILE) : Math.floor(l / TILE);
    let blocked = false, stepTop = 1e9;
    for (let ty = Math.floor(t / TILE); ty <= Math.floor(b / TILE); ty++) if (tileAt(tx, ty) === 1) { blocked = true; stepTop = Math.min(stepTop, ty * TILE); }
    if (blocked) {
      // step-up for small ledges
      if (opt.step && e.onGround && e.y - stepTop <= 8.5 && e.y - stepTop > 0) {
        let free = true; const ny = stepTop;
        for (let ty = Math.floor((ny - e.h) / TILE); ty <= Math.floor((ny - 0.01) / TILE); ty++) if (tileAt(tx, ty) === 1) free = false;
        if (free) { e.y = ny; e.stepped = 6; continue; }
      }
      if (sx > 0) e.x = tx * TILE - e.w / 2 - 0.001; else e.x = (tx + 1) * TILE + e.w / 2 + 0.001;
      e.hitWall = sgn(sx); e.vx = 0; break;
    }
  }
  const was = e.onGround; e.onGround = false;
  const dyT = e.vy * ts, vs = Math.max(1, Math.ceil(Math.abs(dyT) / 3)), sy = dyT / vs;
  for (let i = 0; i < vs; i++) {
    const prevB = e.y; e.y += sy;
    const l = e.x - e.w / 2 + 0.01, r = e.x + e.w / 2 - 0.01;
    if (sy > 0) {
      const ty = Math.floor(e.y / TILE); let land = false;
      for (let tx = Math.floor(l / TILE); tx <= Math.floor(r / TILE); tx++) {
        const tt = tileAt(tx, ty);
        if (tt === 1 || (tt === 2 && !opt.drop && prevB <= ty * TILE + 0.5)) { land = true; break; }
      }
      if (land) { e.y = ty * TILE; e.landV = e.vy; e.vy = 0; e.onGround = true; break; }
    } else if (sy < 0) {
      const ty = Math.floor((e.y - e.h) / TILE); let hit = false;
      for (let tx = Math.floor(l / TILE); tx <= Math.floor(r / TILE); tx++) if (tileAt(tx, ty) === 1) { hit = true; break; }
      if (hit) { e.y = (ty + 1) * TILE + e.h; e.vy = 0; e.hitCeil = true; break; }
    }
  }
  if (!e.onGround && e.vy >= 0) {
    const ty = Math.floor((e.y + 0.5) / TILE), l = e.x - e.w / 2 + 0.01, r = e.x + e.w / 2 - 0.01;
    if (Math.abs(e.y - ty * TILE) < 0.6) for (let tx = Math.floor(l / TILE); tx <= Math.floor(r / TILE); tx++) {
      const tt = tileAt(tx, ty); if (tt === 1 || (tt === 2 && !opt.drop)) { e.onGround = true; e.y = ty * TILE; break; }
    }
  }
  e.justLanded = !was && e.onGround;
}

// ============================================================
//  room generation
// ============================================================
function genRoom(stageIdx, type, seed, loop) {
  const rng = mulberry32(seed);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const st = STAGES[stageIdx];
  const w = type === 'boss' ? 58 : type === 'rest' ? 52 : type === 'start' ? 64 : type === 'elite' ? 62 : ri(66, 92);
  const h = 30;
  const tiles = new Uint8Array(w * h), ground = new Int16Array(w);
  let gy = 25, x = 0;
  const flat = type === 'boss' || type === 'rest' || type === 'elite';
  while (x < w) {
    const len = ri(9, 18);
    if (!flat && x > 10 && x < w - 14 && rng() < 0.6) gy = clamp(gy + (rng() < 0.5 ? -1 : 1), 23, 26);
    for (let i = 0; i < len && x < w; i++) ground[x++] = gy;
  }
  for (let i = 0; i < 9; i++) ground[i] = ground[9];
  for (let i = w - 12; i < w; i++) ground[i] = ground[w - 13];
  for (let i = 0; i < w; i++) for (let y = ground[i]; y < h; y++) tiles[y * w + i] = 1;
  for (let y = 0; y < h; y++) { tiles[y * w] = tiles[y * w + 1] = 1; tiles[y * w + w - 1] = tiles[y * w + w - 2] = 1; }
  const room = { w, h, pw: w * TILE, ph: h * TILE, tiles, ground, type, stage: stageIdx, st, seed, props: [], objs: [], deco: [], lights: [], fg: [], grass: [], loop };
  // door (exit) in right wall
  const dg = ground[w - 3]; room.door = { tx: w - 2, top: dg - 6, bot: dg, open: false, t: 0, lamp: 0 };
  for (let y = dg - 6; y < dg; y++) { tiles[y * w + w - 2] = 1; tiles[y * w + w - 1] = 1; }
  room.doorTop = (dg - 6) * TILE;
  // platforms & solid props
  const used = [];
  const free = (a, b) => used.every(([u, v]) => b < u - 2 || a > v + 2);
  const nPlat = type === 'rest' ? 1 : type === 'boss' ? 2 : ri(2, 4);
  const platKind = ['rail', 'scaffold', 'pipe'][stageIdx];
  for (let k = 0; k < nPlat * 4 && room.props.filter(p => p.plat).length < nPlat; k++) {
    const pw = ri(6, 10), px0 = ri(8, w - 14 - pw); if (!free(px0, px0 + pw)) continue;
    let gmin = 99; for (let i = px0; i < px0 + pw; i++) gmin = Math.min(gmin, ground[i]);
    const row = gmin - ri(5, 7);
    for (let i = px0; i < px0 + pw; i++) tiles[row * w + i] = 2;
    used.push([px0, px0 + pw]);
    room.props.push({ kind: platKind, plat: true, tx: px0, ty: row, tw: pw, gy: gmin });
  }
  if (type !== 'boss') {
    const nSolid = type === 'rest' ? 0 : ri(0, 2);
    for (let k = 0; k < nSolid * 5 && room.props.filter(p => p.solid).length < nSolid; k++) {
      const car = rng() < 0.6; const pw = car ? 6 : 7, ph = car ? 2 : 3; const px0 = ri(10, w - 16 - pw);
      if (!free(px0, px0 + pw)) continue;
      const g = ground[px0]; let ok = true; for (let i = px0; i < px0 + pw; i++) if (ground[i] !== g) ok = false; if (!ok) continue;
      for (let y = g - ph; y < g; y++) for (let i = px0; i < px0 + pw; i++) tiles[y * w + i] = 1;
      used.push([px0, px0 + pw]);
      room.props.push({ kind: car ? 'car' : 'container', solid: true, tx: px0, ty: g - ph, tw: pw, th: ph, v: rng() });
    }
  }
  // grass blades on top surfaces
  for (let i = 2; i < w - 2; i++) {
    const g = ground[i]; if (tiles[(g - 1) * w + i]) continue;
    for (let k = 0; k < 8; k++) { if (rng() < (stageIdx === 2 ? 0.25 : 0.55)) room.grass.push({ x: i * TILE + k + 0.5, y: g * TILE + 1, h: 2 + Math.floor(rng() * rng() * 6), c: Math.floor(rng() * 3), b: 0, bv: 0 }); }
  }
  // objects: crates & kickables
  if (type !== 'boss') {
    const nObj = ri(2, 5);
    for (let k = 0; k < nObj; k++) {
      const i = ri(8, w - 12), g = ground[i];
      const kind = rng() < 0.45 ? 'crate' : pick(['cone', 'cone', 'can', 'tire']);
      room.objs.push(makeObj(kind, i * TILE + 4, g * TILE));
    }
  }
  // birds
  if (stageIdx < 2 && type !== 'boss') for (let k = 0; k < ri(1, 4); k++) { const i = ri(12, w - 12); room.deco.push({ kind: 'bird', x: i * TILE, y: ground[i] * TILE, vx: 0, vy: 0, fly: false, t: rng() * 100, f: rng() < 0.5 ? 1 : -1 }); }
  // foreground silhouettes (parallax 1.3)
  const fgW = (room.pw - W) * 1.3 + W;
  if (type !== 'boss') for (let fx = ri(60, 160); fx < fgW; fx += ri(200, 380)) {
    const kinds = stageIdx === 2 ? ['pole', 'cable', 'grass', 'pipe', 'grass'] : ['pole', 'grass', 'grass', 'leaves', 'fence', 'leaves'];
    room.fg.push({ x: fx, kind: kinds[Math.floor(rng() * kinds.length)], v: rng() });
  }
  // rest room station
  if (type === 'rest') { room.station = { x: Math.floor(w / 2) * TILE, y: ground[Math.floor(w / 2)] * TILE, used: false, t: 0 }; }
  if (type === 'rest' || type === 'start') room.npc = { x: (type === 'rest' ? Math.floor(w / 2) + 8 : 18) * TILE, y: ground[type === 'rest' ? Math.floor(w / 2) + 8 : 18] * TILE, wave: 0, t: 0 };
  renderTerrain(room);
  renderBack(room, rng);
  return room;
}

// ============================================================
//  terrain pre-render
// ============================================================
function renderTerrain(room) {
  const st = room.st, A = Assets[room.stage];
  const c = mkCanvas(room.pw, room.ph); room.terrain = c;
  const cx = c.getContext('2d'); const w = room.w;
  const T = (x, y) => (x < 0 || x >= w || y < 0) ? 0 : y >= room.h ? 1 : room.tiles[y * w + x];
  const isWall = x => x < 2 || x >= w - 2;
  paint(c, () => {
    // wall texture fill via pattern
    const pat = cx.createPattern(A.wall, 'repeat');
    for (let y = 0; y < room.h; y++) for (let x = 0; x < w; x++) {
      if (T(x, y) !== 1 || isWall(x)) continue;
      cx.fillStyle = pat; cx.fillRect(x * TILE, y * TILE, TILE, TILE); resetFs();
    }
    // depth darkening: stepped bands (reads as looking down into the embankment)
    const deep = hex2rgb(st.wall[4]);
    for (let x = 2; x < w - 2; x++) {
      let top = -1; for (let y = 0; y < room.h; y++) if (T(x, y) === 1) { top = y; break; }
      if (top < 0) continue;
      for (let k = 0; k < 8; k++) {
        const y0 = top * TILE + 10 + k * 5; if (y0 >= room.ph) break;
        cx.fillStyle = `rgba(${deep},${Math.min(0.78, 0.1 + k * 0.1)})`; cx.fillRect(x * TILE, y0, TILE, k === 7 ? room.ph - y0 : 5);
      }
      resetFs();
    }
    // curb tops, side edges
    for (let y = 0; y < room.h; y++) for (let x = 2; x < w - 2; x++) {
      if (T(x, y) !== 1) continue;
      const X = x * TILE, Y = y * TILE;
      const solidProp = room.props.some(p => p.solid && x >= p.tx && x < p.tx + p.tw && y >= p.ty && y < p.ty + p.th);
      if (solidProp) continue;
      if (T(x, y - 1) !== 1) {
        rectI(X, Y, TILE, 1, st.curb[0]); rectI(X, Y + 1, TILE, 3, st.curb[1]); rectI(X, Y + 4, TILE, 1, st.curb[2]); rectI(X, Y + 5, TILE, 1, st.curb[3]);
        if (hash2(x, y) < 0.3) px(X + (hash2(y, x) * 7 | 0), Y + 2, st.curb[2]);
        if (x % 4 === 0) rectI(X, Y + 1, 1, 3, st.curb[2]);
        if (T(x - 1, y) !== 1 && T(x - 1, y - 1) !== 1) { rectI(X, Y, 1, 6, st.curb[0]); }
        if (T(x + 1, y) !== 1) rectI(X + TILE - 1, Y + 1, 1, 5, st.curb[3]);
      }
      if (T(x - 1, y) !== 1 && T(x, y - 1) === 1) { rectI(X, Y, 1, TILE, st.wall[1]); }
      if (T(x + 1, y) !== 1 && T(x, y - 1) === 1) { rectI(X + TILE - 1, Y, 1, TILE, st.wall[3]); }
    }
    // grass / moss overhangs on curb edges
    const r = mulberry32(room.seed + 5);
    for (let x = 2; x < w - 2; x++) {
      const g = room.ground[x]; if (T(x, g - 1) === 1) continue;
      if (r() < 0.35) { const n = 2 + (r() * 6 | 0); for (let i = 0; i < n; i++) { const X = x * TILE + (r() * 8 | 0), L = 1 + (r() * 5 | 0); for (let k = 0; k < L; k++) px(X, g * TILE + 4 + k, k === 0 ? st.grass[0] : st.grass[k % 2 ? 1 : 3]); } }
      if (r() < 0.2) { const X = x * TILE + (r() * 6 | 0); rectI(X, g * TILE - 1, 3, 2, st.grass[1]); px(X + 1, g * TILE - 2, st.grass[2]); }
      if (room.stage === 2 && r() < 0.15) { const X = x * TILE; rectI(X, g * TILE, 6 + (r() * 10 | 0), 1, '#7d8ac0'); }
    }
    // boundary walls: concrete building faces
    for (const side of [0, 1]) {
      const X0 = side === 0 ? 0 : (w - 2) * TILE;
      rectI(X0, 0, 16, room.ph, st.curb[2]);
      rectI(side === 0 ? X0 + 14 : X0, 0, 2, room.ph, OUT);
      rectI(side === 0 ? X0 + 12 : X0 + 2, 0, 2, room.ph, st.curb[1]);
      for (let y = 0; y < room.ph; y += 24) { rectI(X0, y, 16, 1, st.curb[3]); if (hash2(side, y) < 0.5) rectI(X0 + 4, y + 6, 6, 8, st.curb[3]); }
      for (let k = 0; k < 6; k++) { const yy = hash2(side, k) * room.ph; for (let s = 0; s < 20; s++) px(X0 + 3 + ((hash2(k, s) * 9) | 0), yy + s, st.wall[3]); }
    }
    // left entrance shutter (closed, decorative)
    const lg = room.ground[2] * TILE; rectI(0, lg - 48, 16, 48, st.curb[3]);
    for (let y = lg - 46; y < lg; y += 3) { rectI(1, y, 12, 2, '#8d939c'); rectI(1, y + 2, 12, 1, '#646a75'); }
    // solid props & platforms
    for (const p of room.props) drawPlatProp(p, st);
  });
}

function drawPlatProp(p, st) {
  const X = p.tx * TILE, Y = p.ty * TILE, Wd = p.tw * TILE;
  if (p.kind === 'rail') {
    const gyY = p.gy * TILE;
    for (let x = X + 5; x < X + Wd - 2; x += 18) { rectF(x - 1, Y + 6, 5, gyY - Y - 6, OUT); rectF(x, Y + 6, 3, gyY - Y - 6, '#98a2ac'); rectF(x, Y + 6, 1, gyY - Y - 6, '#c3cad0'); px(x + 1, Y + 9, '#5e6670'); }
    rectF(X - 1, Y - 1, Wd + 2, 9, OUT);
    rectF(X, Y, Wd, 1, '#f4f4ee'); rectF(X, Y + 1, Wd, 2, '#d6dade'); rectF(X, Y + 3, Wd, 1, '#9ea6ad'); rectF(X, Y + 4, Wd, 2, '#c7ccd0'); rectF(X, Y + 6, Wd, 1, '#838b93');
    for (let x = X + 3; x < X + Wd; x += 18) { px(x, Y + 2, '#6e767e'); px(x + 3, Y + 2, '#6e767e'); }
    for (let k = 0; k < 4; k++) { const x = X + hash2(p.tx, k) * Wd; rectF(x, Y + 4, 3, 2, st.rust); px(x + 1, Y + 6, st.rust); }
    rectF(X - 3, Y + 1, 3, 5, '#aeb5bb'); rectF(X + Wd, Y + 1, 3, 5, '#aeb5bb');
  } else if (p.kind === 'scaffold') {
    const gyY = p.gy * TILE;
    for (let x = X + 2; x < X + Wd; x += Math.max(10, (Wd - 4) / 2)) { rectF(x - 1, Y, 4, gyY - Y, OUT); rectF(x, Y, 2, gyY - Y, '#8f8a86'); }
    lineF(X + 3, Y + 6, X + Wd - 3, gyY - 2, '#77716e'); lineF(X + Wd - 3, Y + 6, X + 3, gyY - 2, '#77716e');
    rectF(X - 1, Y - 1, Wd + 2, 6, OUT);
    for (let x = X; x < X + Wd; x += 8) { rectF(x, Y, 7, 4, hash2(x, 1) < 0.5 ? '#c39468' : '#b08258'); rectF(x, Y, 7, 1, '#dcb083'); rectF(x + 7, Y, 1, 4, '#7a563c'); }
    // hanging cloth
    const cx0 = X + Wd * 0.3; for (let i = 0; i < 12; i++) for (let k = 0; k < 6 + Math.sin(i * 0.8) * 3; k++) px(cx0 + i, Y + 4 + k, k === 0 ? '#e9d3b8' : i % 3 === 0 ? '#c9a78c' : '#dcc0a2');
  } else if (p.kind === 'pipe') {
    const gyY = p.gy * TILE;
    for (let x = X + 6; x < X + Wd - 4; x += 26) { rectF(x - 1, Y + 6, 6, gyY - Y - 6, OUT); rectF(x, Y + 6, 4, gyY - Y - 6, '#2f3556'); rectF(x, Y + 6, 1, gyY - Y - 6, '#4a5282'); }
    rectF(X - 1, Y - 1, Wd + 2, 9, OUT);
    rectF(X, Y, Wd, 7, '#48507c'); rectF(X, Y, Wd, 1, '#8b95c8'); rectF(X, Y + 1, Wd, 1, '#6570a4'); rectF(X, Y + 5, Wd, 2, '#343b62');
    for (let x = X + 10; x < X + Wd; x += 22) { rectF(x, Y - 1, 3, 9, '#5d6699'); rectF(x, Y - 1, 3, 1, '#9aa4d6'); }
    for (let k = 0; k < 5; k++) { const x = X + hash2(p.tx, k) * Wd; px(x, Y + 3, '#7fe6d4'); }
  } else if (p.kind === 'car') {
    const H0 = p.th * TILE, bY = Y + H0; const cols = [['#8fb0c9', '#6f8ea8'], ['#d9d4c8', '#b3ad9f'], ['#c98a7a', '#a56a5f'], ['#9fb58d', '#7e9670']][Math.floor(p.v * 4)];
    const B = st.key === 'night' ? cols.map(c => mix(c, '#1a1e3b', 0.6)) : st.key === 'dusk' ? cols.map(c => mix(c, '#b8607a', 0.25)) : cols;
    // body
    polyF([X - 1, bY - 4, X - 1, Y + 5, X + 8, Y + 4, X + 14, Y - 3, X + 34, Y - 3, X + 41, Y + 4, X + Wd + 1, Y + 6, X + Wd + 1, bY - 4], OUT);
    polyF([X, bY - 4, X, Y + 6, X + 9, Y + 5, X + 15, Y - 2, X + 33, Y - 2, X + 40, Y + 5, X + Wd, Y + 7, X + Wd, bY - 4], B[0]);
    rectF(X, Y + 9, Wd, 5, B[1]); rectF(X, Y + 6, Wd, 1, mix(B[0], '#ffffff', 0.35));
    polyF([X + 11, Y + 5, X + 16, Y, X + 23, Y, X + 23, Y + 5], '#2b2d3c'); polyF([X + 25, Y + 5, X + 25, Y, X + 32, Y, X + 37, Y + 5], '#2b2d3c');
    lineF(X + 17, Y + 1, X + 21, Y + 4, '#6d7486'); px(X + 30, Y + 2, '#6d7486');
    for (const wx of [X + 9, X + Wd - 10]) { ellipseF(wx, bY - 3, 5, 4, OUT); ellipseF(wx, bY - 3, 4, 3, '#3a3a44'); ellipseF(wx, bY - 3, 1.5, 1.5, '#8a8f99'); }
    for (let k = 0; k < 7; k++) { const x = X + hash2(p.tx, k + 3) * Wd, y = Y + 6 + hash2(k, p.tx) * 7; rectF(x, y, 2 + (k % 3), 1 + (k % 2), st.rust); }
    for (let i = 0; i < 14; i++) { const vx = X + 30 + (i % 7) * 2, L = 2 + hash2(i, 9) * 8; for (let k = 0; k < L; k++) px(vx + (k % 2), Y + 7 + k, k < 2 ? st.vine[2] : st.vine[0]); }
    rectF(X + 1, Y + 7, 3, 2, st.key === 'night' ? '#ffe7a0' : '#fff2cf'); rectF(X + Wd - 3, Y + 8, 2, 2, '#d9534f');
  } else if (p.kind === 'container') {
    const H0 = p.th * TILE; const base = [st.accent === '#ff4f9a' ? '#5a3a6a' : '#b8634f', '#4f8a8b', '#c49a4a'][Math.floor(p.v * 3)];
    const B = st.key === 'night' ? mix(base, '#1a1e3b', 0.55) : st.key === 'dusk' ? mix(base, '#9a5a78', 0.2) : base;
    rectF(X - 1, Y - 1, Wd + 2, H0 + 1, OUT); rectF(X, Y, Wd, H0, B);
    for (let x = X + 2; x < X + Wd - 1; x += 3) { rectF(x, Y + 2, 1, H0 - 4, mix(B, '#000000', 0.25)); rectF(x + 1, Y + 2, 1, H0 - 4, mix(B, '#ffffff', 0.12)); }
    rectF(X, Y, Wd, 2, mix(B, '#ffffff', 0.3)); rectF(X, Y + H0 - 2, Wd, 2, mix(B, '#000000', 0.35));
    rectF(X + Wd - 14, Y + 4, 1, H0 - 6, OUT); rectF(X + Wd - 8, Y + 4, 1, H0 - 6, OUT);
    for (let k = 0; k < 10; k++) { const x = X + hash2(p.tx, k) * Wd, y = Y + hash2(k, p.tx) * H0; rectF(x, y, 2, 3 + k % 4, st.rust); }
    for (let i = 0; i < 10; i++) { const L = 3 + hash2(i, 2) * 10; for (let k = 0; k < L; k++) px(X + 3 + i * 2 + (k % 2), Y + k, k < 2 ? st.vine[2] : st.vine[i % 2]); }
  }
}

// ============================================================
//  room back layer (parallax 0.85), pre-rendered with props
// ============================================================
const BACK_F = 0.85;
function renderBack(room, rng) {
  const st = room.st;
  const bw = Math.ceil((room.pw - W) * BACK_F + W) + MG * 2 + 20;
  const c = mkCanvas(bw, room.ph); room.back = c; room.backW = bw;
  const baseY = 25 * TILE - 12;
  const hz = st.haze;
  const dim = cc => mix(cc, hz, st.key === 'night' ? 0.15 : 0.32);
  paint(c, () => {
    // back sidewalk / road strip
    rectF(0, baseY, bw, room.ph - baseY, dim(st.curb[2]));
    rectF(0, baseY, bw, 2, dim(st.curb[0])); rectF(0, baseY + 2, bw, 1, dim(st.curb[3]));
    for (let x = 0; x < bw; x += 26) rectF(x, baseY + 7, 12, 1, dim(st.curb[1]));
    let x = 10;
    while (x < bw - 20) {
      const k = rng();
      let adv = 30 + rng() * 40;
      if (st.key === 'day') {
        if (k < 0.22) adv = backGuardrail(x, baseY, 60 + rng() * 80, dim, st);
        else if (k < 0.36) adv = backVending(x, baseY, dim, st, rng, room);
        else if (k < 0.48) adv = backSign(x, baseY, dim, st, rng);
        else if (k < 0.6) adv = backBush(x, baseY, dim, st, rng);
        else if (k < 0.7) adv = backBusStop(x, baseY, dim, st, rng);
        else if (k < 0.8) adv = backFence(x, baseY, 50 + rng() * 60, dim, st);
        else if (k < 0.88) adv = backTrafficLight(x, baseY, dim, st, room);
        else adv = backTires(x, baseY, dim, st, rng);
      } else if (st.key === 'dusk') {
        if (k < 0.34) adv = backShop(x, baseY, dim, st, rng, room);
        else if (k < 0.46) adv = backVending(x, baseY, dim, st, rng, room);
        else if (k < 0.58) adv = backBush(x, baseY, dim, st, rng);
        else if (k < 0.7) adv = backBike(x, baseY, dim, st, rng);
        else if (k < 0.8) adv = backSign(x, baseY, dim, st, rng);
        else adv = backFence(x, baseY, 50 + rng() * 40, dim, st);
      } else {
        if (k < 0.34) adv = backShop(x, baseY, dim, st, rng, room);
        else if (k < 0.52) adv = backVending(x, baseY, dim, st, rng, room);
        else if (k < 0.66) adv = backLamp(x, baseY, dim, st, room);
        else if (k < 0.78) adv = backFence(x, baseY, 50 + rng() * 60, dim, st);
        else adv = backTires(x, baseY, dim, st, rng);
      }
      x += adv + 8 + rng() * 26;
    }
  });
}
function backGuardrail(x, y, len, dim, st) {
  for (let i = x + 4; i < x + len; i += 16) { rectF(i, y - 12, 2, 12, dim('#8e98a2')); }
  rectF(x, y - 15, len, 5, dim('#cdd2d6')); rectF(x, y - 15, len, 1, dim('#f0f0ea')); rectF(x, y - 12, len, 1, dim('#9aa2a8'));
  return len;
}
function backFence(x, y, len, dim, st) {
  const hgt = 34; const c = dim(st.key === 'night' ? '#3a4068' : '#8b949e');
  for (let i = x; i <= x + len; i += 20) rectF(i, y - hgt, 2, hgt, c);
  rectF(x, y - hgt, len, 1, c);
  for (let j = 0; j < hgt; j += 3) for (let i = x; i < x + len; i += 3) if (((i + j) / 3) % 2 === 0) px(i + ((j / 3) % 2), y - hgt + j, c);
  return len;
}
function backVending(x, y, dim, st, rng, room) {
  const lit = st.key === 'night' || (st.key === 'dusk' && rng() < 0.5);
  const body = pick(['#d45a55', '#e8e2d6', '#4f7fb8']);
  const B = lit ? body : dim(body);
  rectF(x - 1, y - 33, 20, 33, OUT); rectF(x, y - 32, 18, 32, B); rectF(x, y - 32, 18, 2, mix(B, '#ffffff', 0.3));
  const win = lit ? '#e6f6ff' : dim('#a9c1d3');
  rectF(x + 2, y - 29, 14, 12, win);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) rectF(x + 3 + i * 3.5, y - 28 + r * 4, 2, 3, pick(['#e8534f', '#4f8fe8', '#f2c14e', '#6ac47a', '#ffffff']));
  rectF(x + 2, y - 15, 14, 3, mix(B, '#000000', 0.3)); rectF(x + 12, y - 10, 3, 5, mix(B, '#000000', 0.2)); rectF(x + 3, y - 6, 8, 3, OUT);
  if (lit) room.lights.push({ x: x + 9, y: y - 22, r: 30, c: '#bfe8ff', a: 0.55, flick: rng() < 0.3 });
  return 20;
}
function backSign(x, y, dim, st, rng) {
  const pc = dim('#9aa3ad'); rectF(x, y - 40, 2, 40, pc);
  const k = rng();
  if (k < 0.33) { ellipseF(x + 1, y - 44, 6, 6, dim('#ffffff')); ellipseF(x + 1, y - 44, 5, 5, dim('#d8453e')); rectF(x - 2, y - 45, 7, 2, dim('#ffffff')); }
  else if (k < 0.66) { ellipseF(x + 1, y - 44, 6, 6, dim('#ffffff')); ellipseF(x + 1, y - 44, 5, 5, dim('#3a6fc2')); polyF([x - 1, y - 42, x + 1, y - 47, x + 3, y - 42], dim('#ffffff')); }
  else { polyF([x - 6, y - 49, x + 8, y - 49, x + 1, y - 38], dim('#ffffff')); polyF([x - 4, y - 48, x + 6, y - 48, x + 1, y - 40], dim('#d8453e')); }
  return 12;
}
function backBush(x, y, dim, st, rng) {
  const w = 16 + rng() * 26; const g = st.grass;
  for (let i = 0; i < 5; i++) ellipseF(x + i * w / 5 + 4, y - 6 - rng() * 6, 6 + rng() * 5, 5 + rng() * 4, dim(g[1]));
  for (let i = 0; i < 4; i++) ellipseF(x + i * w / 4 + 5, y - 9 - rng() * 6, 4 + rng() * 3, 3 + rng() * 3, dim(g[0]));
  for (let i = 0; i < 8; i++) px(x + rng() * w, y - 8 - rng() * 10, dim(g[2]));
  if (rng() < 0.4) { const tx = x + w / 2; rectF(tx - 1, y - 50, 3, 45, dim(st.key === 'night' ? '#23213a' : '#6d5a4a')); for (let i = 0; i < 6; i++) ellipseF(tx + rnd(-14, 14), y - 50 + rnd(-10, 8), 8 + rng() * 6, 6 + rng() * 5, dim(i % 2 ? g[0] : g[1])); }
  return w;
}
function backBusStop(x, y, dim, st, rng) {
  const c = dim('#8f99a3'), roof = dim('#6f8ea8');
  rectF(x, y - 30, 2, 30, c); rectF(x + 34, y - 30, 2, 30, c); rectF(x - 3, y - 33, 42, 4, roof); rectF(x - 3, y - 33, 42, 1, dim('#a7c2d6'));
  rectF(x + 2, y - 28, 30, 16, dim('#c9d8e0')); rectF(x + 3, y - 27, 28, 14, dim('#dfe8ec')); lineF(x + 6, y - 26, x + 12, y - 16, dim('#ffffff'));
  rectF(x + 6, y - 9, 22, 2, dim('#a07a58')); rectF(x + 8, y - 7, 1, 7, c); rectF(x + 26, y - 7, 1, 7, c);
  rectF(x + 40, y - 40, 2, 40, c); ellipseF(x + 41, y - 42, 5, 5, dim('#e8e2d6')); ellipseF(x + 41, y - 42, 3, 3, dim('#3a6fc2'));
  return 46;
}
function backTrafficLight(x, y, dim, st, room) {
  const c = dim('#7d8791'); rectF(x, y - 56, 2, 56, c); rectF(x, y - 56, 26, 2, c);
  rectF(x + 12, y - 60, 20, 8, dim('#5d666f')); for (let i = 0; i < 3; i++) ellipseF(x + 16 + i * 6, y - 56, 2, 2, dim('#3a4048'));
  room.lights.push({ x: x + 28, y: y - 56, r: 12, c: '#ffcf3a', a: 0.8, blink: 1, dot: true });
  return 34;
}
function backTires(x, y, dim, st, rng) {
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) { ellipseF(x + 6, y - 3 - i * 5, 7, 3, dim('#2f3038')); ellipseF(x + 6, y - 3 - i * 5, 3, 1, dim('#505260')); }
  rectF(x + 16, y - 10, 12, 10, dim('#a78662')); rectF(x + 16, y - 10, 12, 1, dim('#c6a47c')); lineF(x + 16, y - 10, x + 27, y - 1, dim('#8a6a4c'));
  return 30;
}
function backShop(x, y, dim, st, rng, room) {
  const w = 56 + rng() * 40, h = 64 + rng() * 30;
  const wall = dim(st.key === 'night' ? '#2a2f55' : '#c9a393');
  rectF(x, y - h, w, h, wall); rectF(x, y - h, w, 2, mix(wall, '#ffffff', 0.2)); rectF(x + w - 2, y - h, 2, h, mix(wall, '#000000', 0.25));
  // shutter
  const sh = 34, sx = x + 6, sw = w - 12;
  const scol = dim(st.key === 'night' ? '#3d4470' : '#a9a7a3');
  const open = rng() < 0.35;
  rectF(sx, y - sh, sw, sh, open ? dim(st.key === 'night' ? '#0c0e20' : '#5a4a48') : scol);
  if (!open) for (let j = y - sh; j < y; j += 3) rectF(sx, j + 2, sw, 1, mix(scol, '#000000', 0.2));
  else { const lit = st.key === 'night' && rng() < 0.6; if (lit) { rectF(sx + 2, y - sh + 4, sw - 4, sh - 4, '#ffd59a'); room.lights.push({ x: sx + sw / 2, y: y - sh / 2, r: 34, c: '#ffc27a', a: 0.45 }); rectF(sx + 6, y - 14, 10, 14, '#b88a5a'); } }
  // awning
  const ac = pick(['#d86b6b', '#6b9ad8', '#6fb88a', '#d8a85a']);
  for (let i = 0; i < sw + 8; i += 6) { polyF([sx - 4 + i, y - sh - 10, sx + 2 + i, y - sh - 10, sx + 2 + i, y - sh - 2, sx - 1 + i, y - sh, sx - 4 + i, y - sh - 2], dim(i / 6 % 2 ? '#f2e2d0' : ac)); }
  // sign board
  const sgc = st.key === 'night' ? pick(['#ff4f9a', '#43e3ff', '#ffd23f']) : dim(pick(['#3f6fa8', '#b84a48', '#4f8a6a']));
  rectF(x + 8, y - h + 8, w - 16, 12, sgc); rectF(x + 9, y - h + 9, w - 18, 10, st.key === 'night' ? mix(sgc, '#10132a', 0.7) : mix(sgc, '#ffffff', 0.1));
  for (let i = x + 12; i < x + w - 14; i += 7) rectF(i, y - h + 11, 4, 6, st.key === 'night' ? sgc : mix(sgc, '#ffffff', 0.55));
  if (st.key === 'night') room.lights.push({ x: x + w / 2, y: y - h + 14, r: 26, c: sgc, a: 0.6, flick: rng() < 0.5 });
  // upper windows
  for (let i = x + 8; i < x + w - 12; i += 14) { const lit = st.key === 'night' && hash2(i, 3) < 0.3; rectF(i, y - h + 26, 8, 10, lit ? '#ffcf73' : dim(st.key === 'night' ? '#141730' : '#7d6a70')); rectF(i, y - h + 26, 8, 1, mix(wall, '#000000', 0.3)); }
  if (rng() < 0.5) { const L = 10 + rng() * 20; for (let i = 0; i < 14; i++) for (let k = 0; k < L * hash2(i, 5); k++) px(x + w - 16 + i, y - h + k, dim(k < 2 ? st.vine[2] : st.vine[i % 2])); }
  return w;
}
function backBike(x, y, dim, st) {
  const c = dim('#5d6f8a'); ringF(x + 5, y - 5, 5, 1, dim('#3a3a44')); ringF(x + 21, y - 5, 5, 1, dim('#3a3a44'));
  lineF(x + 5, y - 5, x + 12, y - 12, c); lineF(x + 12, y - 12, x + 21, y - 5, c); lineF(x + 12, y - 12, x + 12, y - 5, c); lineF(x + 12, y - 5, x + 5, y - 5, c); lineF(x + 18, y - 14, x + 21, y - 5, c); rectF(x + 16, y - 15, 5, 1, c); rectF(x + 10, y - 13, 5, 1, dim('#3a3a44'));
  return 28;
}
function backLamp(x, y, dim, st, room) {
  const c = dim('#3a4068'); rectF(x, y - 64, 2, 64, c); lineF(x + 1, y - 64, x + 10, y - 68, c, 2); rectF(x + 8, y - 68, 8, 3, c); rectF(x + 9, y - 65, 6, 1, '#ffe7b0');
  room.lights.push({ x: x + 12, y: y - 64, r: 44, c: '#ffd08a', a: 0.5, cone: true, flick: Math.random() < 0.3 });
  return 20;
}

// ============================================================
//  dynamic objects: crates, cones, cans, tires
// ============================================================
function makeObj(kind, x, y) {
  const d = { crate: [12, 10], cone: [7, 9], can: [6, 7], tire: [10, 10] }[kind];
  return { kind, x, y, w: d[0], h: d[1], vx: 0, vy: 0, rot: 0, vr: 0, onGround: true, hp: kind === 'crate' ? 1 : 99, dead: false, hitId: -1, rest: 0 };
}
function updateObj(o, ts) {
  if (o.dead) return;
  if (!o.onGround || Math.abs(o.vx) > 0.01 || o.vy !== 0) {
    o.vy = Math.min(o.vy + 0.3 * ts, 6);
    const vx0 = o.vx, vy0 = o.vy;
    moveBody(o, ts);
    if (o.hitWall) { o.vx = -vx0 * 0.5; o.vr *= -0.6; Snd.play('kick', { x: o.x, gap: 0.08 }); }
    if (o.justLanded) { if (vy0 > 1.6) { o.vy = -vy0 * 0.42; o.onGround = false; o.vr *= 0.7; Snd.play('kick', { x: o.x, gap: 0.08, pitch: 0.8 }); Fx.dust(o.x, o.y, 2, 0.5); } }
    if (o.onGround) { o.vx *= Math.pow(0.8, ts); o.vr *= Math.pow(0.8, ts); if (Math.abs(o.vx) < 0.05) o.vx = 0; }
    o.rot += o.vr * ts;
  }
  if (o.onGround && Math.abs(o.vr) < 0.05) { const q = Math.PI / 2; const tgt = o.kind === 'tire' ? o.rot : Math.round(o.rot / q) * q; o.rot = lerp(o.rot, tgt, 0.2); }
}
function hitObj(o, dir, power) {
  if (o.dead) return;
  if (o.kind === 'crate') {
    o.dead = true; Snd.play('crate', { x: o.x });
    for (let i = 0; i < 9; i++) Fx.debris(o.x + rnd(-5, 5), o.y - rnd(2, 9), dir * rnd(0.5, 3) , rnd(-4, -1.5), pick(['#c39468', '#a67a50', '#dcb083']), rndi(2, 4));
    Fx.dust(o.x, o.y - 4, 5, 1);
    if (Math.random() < 0.6) Game.spawnScrap(o.x, o.y - 6, rndi(2, 5));
    if (Math.random() < 0.18) Game.spawnPickup('oil', o.x, o.y - 8);
    return;
  }
  o.vx = dir * (2.4 + power * 2.2) * (o.kind === 'tire' ? 0.8 : 1); o.vy = -2.2 - power * 2.4; o.vr = dir * rnd(0.25, 0.5); o.onGround = false;
  Snd.play('kick', { x: o.x });
  Fx.sparks(o.x, o.y - o.h / 2, 3, dir, '#fff2c0');
}
function drawObj(o) {
  if (o.dead) return;
  const st = ROOM.st; const nightDim = c => st.key === 'night' ? mix(c, '#20264a', 0.45) : c;
  R.begin(o.x, o.y - o.h / 2, 1, 1, 1, o.rot, 0, 0);
  if (o.kind === 'crate') {
    R.rect(-6, -5, 12, 10, nightDim('#b98c60')); R.flush(OUT);
    R.drect(-6, -5, 12, 1, nightDim('#dcb083')); R.drect(-6, 4, 12, 1, nightDim('#8a6440')); R.dline(-5, -4, 4, 3, nightDim('#8a6440')); R.drect(-6, -1, 12, 1, nightDim('#9a7048'));
  } else if (o.kind === 'cone') {
    R.poly([-3.5, 3.5, -1, -4.5, 1, -4.5, 3.5, 3.5], nightDim('#f07a3a')); R.rect(-4, 3, 8, 2, nightDim('#e0602a')); R.flush(OUT);
    R.drect(-2, -1, 4, 2, nightDim('#f4f0e6')); R.px(-1, -4, nightDim('#ffb07a'));
  } else if (o.kind === 'can') {
    R.rect(-3, -3.5, 6, 7, nightDim('#d8d4cc')); R.flush(OUT); R.drect(-3, -1, 6, 3, nightDim('#e0415a')); R.drect(-3, -3.5, 6, 1, nightDim('#f4f2ee'));
  } else {
    R.ell(0, 0, 5, 5, nightDim('#2f3038')); R.flush(OUT); R.dell(0, 0, 2, 2, nightDim('#5a5c68')); R.px(-3, -3, nightDim('#555766')); R.px(2, 3, nightDim('#1d1e24'));
  }
}
