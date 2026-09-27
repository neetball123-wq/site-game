/* =========================================================
   ハコイクサ — ルール
   箱・重力・回転・効果範囲・歯車列・合体・戦闘・相手づくり。
   DOMを使わない（Node で検証できる）。
   ========================================================= */
(function (G) {
  'use strict';
  const HK = G.HK || (G.HK = {});
  const { SHAPES, ITEMS, DEF, SCHOOLS, RIVALS } = HK.data;

  const DIRS6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const HEIGHT_STEP = 0.1;   // 1段高くなるごとの効き目
  const FILL_SPD = 0.2;      // 段そろい：その段の道具の速さ
  const FILL_BLOCK = 2;      // 段そろい：1マスにつき、はじめの盾
  const DIRS4 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];

  /* ---------------- 乱数 ---------------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
  function wpick(R, list, wf) {
    let s = 0; for (const x of list) s += wf(x);
    if (s <= 0) return null;
    let v = R() * s;
    for (const x of list) { v -= wf(x); if (v <= 0) return x; }
    return list[list.length - 1];
  }

  /* ---------------- 形と回転 ---------------- */
  function norm(cells) {
    let mx = Infinity, my = Infinity, mz = Infinity;
    for (const c of cells) { if (c[0] < mx) mx = c[0]; if (c[1] < my) my = c[1]; if (c[2] < mz) mz = c[2]; }
    return cells.map((c) => [c[0] - mx, c[1] - my, c[2] - mz]).sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
  }
  const shapeKey = (cells) => norm(cells).map((c) => c.join(',')).join(';');
  const rotY = (cells) => norm(cells.map(([x, y, z]) => [-z, y, x]));
  const rotYi = (cells) => norm(cells.map(([x, y, z]) => [z, y, -x]));
  const rotX = (cells) => norm(cells.map(([x, y, z]) => [x, -z, y]));
  const rotZ = (cells) => norm(cells.map(([x, y, z]) => [-y, x, z]));
  function extent(cells) {
    let a = 0, b = 0, c = 0;
    for (const p of cells) { if (p[0] > a) a = p[0]; if (p[1] > b) b = p[1]; if (p[2] > c) c = p[2]; }
    return [a + 1, b + 1, c + 1];
  }
  const orientCache = {};
  function orients(cells) {
    const k = shapeKey(cells);
    if (orientCache[k]) return orientCache[k];
    const seen = new Map(), q = [norm(cells)];
    while (q.length) {
      const s = q.shift(), key = shapeKey(s);
      if (seen.has(key)) continue;
      seen.set(key, s);
      q.push(rotY(s), rotX(s), rotZ(s));
    }
    return (orientCache[k] = [...seen.values()]);
  }
  const shapeOf = (id) => norm(SHAPES[DEF[id].shape]);

  /* ---------------- 箱 ---------------- */
  // box = { W, D, H, pieces: [{ uid, id, cells:[[x,y,z]], grow }] }
  let UID = 1;
  const newUid = () => UID++;
  function syncUid(n) { if (n >= UID) UID = n + 1; }
  function newBox(W, D, H) { return { W, D, H, pieces: [] }; }
  const idx = (b, x, y, z) => x + b.W * (z + b.D * y);
  const inb = (b, x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < b.W && y < b.H && z < b.D;

  function occ(b, skip) {
    const o = new Int32Array(b.W * b.D * b.H).fill(-1);
    b.pieces.forEach((p, i) => { if (skip && skip.has(p.uid)) return; for (const c of p.cells) if (inb(b, c[0], c[1], c[2])) o[idx(b, c[0], c[1], c[2])] = i; });
    return o;
  }

  /* 上から落としたときの着地。rel は正規化済みの形、(ax, az) は置く列。
     pass: 通りぬけてよい（宙に浮いている）ピースの uid 集合 */
  function drop(b, rel, ax, az, pass) {
    const [sx, sy, sz] = extent(rel);
    const x0 = Math.max(0, Math.min(b.W - sx, ax)), z0 = Math.max(0, Math.min(b.D - sz, az));
    const top = new Int32Array(b.W * b.D);
    for (const p of b.pieces) {
      if (pass && pass.has(p.uid)) continue;
      for (const c of p.cells) { const k = c[0] + b.W * c[2]; if (c[1] + 1 > top[k]) top[k] = c[1] + 1; }
    }
    let y0 = 0;
    for (const c of rel) { const t = top[(x0 + c[0]) + b.W * (z0 + c[2])] - c[1]; if (t > y0) y0 = t; }
    const cells = rel.map((c) => [x0 + c[0], y0 + c[1], z0 + c[2]]);
    let ok = y0 + sy <= b.H;
    if (ok) {
      const o = occ(b);
      for (const c of cells) if (o[idx(b, c[0], c[1], c[2])] >= 0) { ok = false; break; }
    }
    return { cells, y: y0, x: x0, z: z0, ok, over: y0 + sy > b.H };
  }

  /* 支えのないピースを落とす。戻り値：{uid: 落ちた段数} */
  function settle(b) {
    const moved = {};
    let again = true, guard = 0;
    while (again && guard++ < 64) {
      again = false;
      const order = b.pieces.slice().sort((p, q) => minY(p) - minY(q));
      for (const p of order) {
        const o = occ(b, new Set([p.uid]));
        let d = 0;
        for (;;) {
          const nd = d + 1;
          let can = true;
          for (const c of p.cells) { const y = c[1] - nd; if (y < 0 || o[idx(b, c[0], y, c[2])] >= 0) { can = false; break; } }
          if (!can) break;
          d = nd;
        }
        if (d > 0) { p.cells = p.cells.map((c) => [c[0], c[1] - d, c[2]]); moved[p.uid] = (moved[p.uid] || 0) + d; again = true; }
      }
    }
    return moved;
  }
  const minY = (p) => Math.min(...p.cells.map((c) => c[1]));
  /* いま支えがなくて、落ちるはずのピース */
  function floating(b) {
    const cp = { W: b.W, D: b.D, H: b.H, pieces: b.pieces.map((p) => ({ uid: p.uid, cells: p.cells.map((c) => c.slice()) })) };
    return new Set(Object.keys(settle(cp)).map(Number));
  }
  const cellsOf = (b) => b.W * b.D * b.H;
  const usedCells = (b) => b.pieces.reduce((s, p) => s + p.cells.length, 0);

  /* ---------------- 効果範囲 ---------------- */
  function rangeCells(b, p, kind, reach) {
    const own = new Set(p.cells.map((c) => idx(b, ...c)));
    const out = new Map();
    const add = (x, y, z) => { if (!inb(b, x, y, z)) return false; const k = idx(b, x, y, z); if (!own.has(k)) out.set(k, [x, y, z]); return true; };
    const r = reach || 1;
    if (kind === 'adj') for (const c of p.cells) for (const d of DIRS6) add(c[0] + d[0], c[1] + d[1], c[2] + d[2]);
    else if (kind === 'side') for (const c of p.cells) for (const d of DIRS4) add(c[0] + d[0], c[1], c[2] + d[2]);
    else if (kind === 'up' || kind === 'down' || kind === 'col') {
      const dirs = kind === 'up' ? [1] : kind === 'down' ? [-1] : [1, -1];
      for (const s of dirs) for (const c of p.cells) {
        if (own.has(idx(b, c[0], c[1] + s, c[2])) && inb(b, c[0], c[1] + s, c[2])) continue;
        for (let i = 1; i <= r; i++) if (!add(c[0], c[1] + s * i, c[2])) break;
      }
    } else if (kind === 'layer') {
      const ys = new Set(p.cells.map((c) => c[1]));
      for (const y of ys) for (let x = 0; x < b.W; x++) for (let z = 0; z < b.D; z++) add(x, y, z);
    }
    return [...out.values()];
  }

  /* ---------------- 能力の計算 ---------------- */
  function baseStats(def, p) {
    const a = def.act || {};
    return {
      cd: def.cd || 0, dmg: a.dmg || 0, hits: a.hits || 1, block: a.block || 0, heal: a.heal || 0,
      burn: a.burn || 0, rust: a.rust || 0, oil: a.oil || 0, cleanse: a.cleanse || 0, kick: a.kick || 0, tick: a.tick || 0,
      boltDmg: a.bolt ? a.bolt.dmg : 0, boltN: a.bolt ? a.bolt.n : 0, zap: !!a.zap, zapDmg: a.zap ? a.zap.dmg : 0,
      stun: a.bolt ? a.bolt.stun : a.zap ? a.zap.stun : 0,
      startBlock: def.start ? def.start.block : 0,
      spd: 0, gearSpd: 0, dmgPct: 0, gear: 0, grow: def.grows ? Math.min(p.grow || 0, def.growMax || 99) : 0, hMul: 1, top: 0,
    };
  }
  const MODKEYS = ['dmg', 'block', 'heal', 'burn', 'rust', 'oil', 'cleanse', 'kick', 'spd', 'dmgPct', 'stun', 'startBlock'];

  /* resolve(box, school) → { items:[{p, def, st, mods, links}], by:{uid:entry}, trains:[...] } */
  function resolve(b, school) {
    const o = occ(b);
    const E = b.pieces.map((p, i) => ({ p, i, def: DEF[p.id], st: baseStats(DEF[p.id], p), mods: [], out: [] }));
    const by = {};
    E.forEach((e) => { by[e.p.uid] = e; });
    const at = (x, y, z) => (inb(b, x, y, z) ? o[idx(b, x, y, z)] : -1);
    const piecesIn = (cells) => { const s = new Set(); for (const c of cells) { const i = at(c[0], c[1], c[2]); if (i >= 0) s.add(i); } return [...s].map((i) => b.pieces[i]); };
    const kamado = school === 'kamado';
    const c = {
      def: (q) => DEF[q.id],
      has: (q, tag) => DEF[q.id].tags.includes(tag),
      inRange: (q, kind, reach) => piecesIn(rangeCells(b, q, kind, reach)),
      below: (q) => piecesIn(rangeCells(b, q, 'down', 1)),
      above: (q) => piecesIn(rangeCells(b, q, 'up', 1)),
      isTop: (q) => q.cells.some((cc) => cc[1] === b.H - 1),
      isBottom: (q) => q.cells.some((cc) => cc[1] === 0),
      standing: (q) => q.cells.length >= 2 && q.cells.every((cc) => cc[0] === q.cells[0][0] && cc[2] === q.cells[0][2]),
    };
    const apply = (e, mod, text, from, neg) => {
      for (const k in mod) e.st[k] += mod[k];
      e.mods.push({ text, from: from == null ? null : from, neg: !!neg });
    };
    // 1) 置き方で変わる自分の能力
    for (const e of E) if (e.def.self) for (const r of e.def.self(e.p, c)) {
      apply(e, r.mod, r.text, null, r.neg);
      if (r.from) for (const q of r.from) if (by[q.uid]) by[q.uid].out.push({ to: e.p.uid, neg: !!r.neg });
    }
    // 2) まわりへの効果
    for (const e of E) {
      if (!e.def.aura) continue;
      for (const a of e.def.aura) {
        let reach = a.reach || 1;
        if (kamado && a.range === 'up' && e.def.tags.includes('火') && reach < 99) reach += 1;
        const cells = rangeCells(b, e.p, a.range, reach);
        for (const q of piecesIn(cells)) {
          const d = DEF[q.id];
          if (a.tag && !d.tags.includes(a.tag)) continue;
          if (a.not && d.tags.includes(a.not)) continue;
          if (a.id && q.id !== a.id) continue;
          if (a.test && !a.test(d)) continue;
          const t = by[q.uid];
          apply(t, a.mod, `${e.def.name}｜${a.text}`, e.p.uid, a.neg);
          e.out.push({ to: q.uid, neg: !!a.neg });
        }
      }
    }
    // 3) 歯車列
    const trains = gearTrains(b, E, c, o, school);
    // 4) 高さの補正と、段そろい（その段のマスが全部うまった）
    const full = [];
    for (let y = 0; y < b.H; y++) {
      let all = true;
      for (let x = 0; x < b.W && all; x++) for (let z = 0; z < b.D; z++) if (o[idx(b, x, y, z)] < 0) { all = false; break; }
      if (all) full.push(y);
    }
    const fullSet = new Set(full);
    for (const e of E) {
      const top = Math.max(...e.p.cells.map((cc) => cc[1]));
      e.st.hMul = 1 + HEIGHT_STEP * top;
      e.st.top = top;
      const acts = e.def.cd || e.def.start;
      if (top > 0 && acts) e.mods.push({ text: `高さ${top + 1}段目｜効き目+${Math.round(HEIGHT_STEP * top * 100)}%`, from: null, height: true });
      const nf = [...new Set(e.p.cells.map((cc) => cc[1]))].filter((y) => fullSet.has(y)).length;
      if (nf && e.def.cd) { e.st.spd += FILL_SPD * nf; e.mods.push({ text: `段そろい｜速さ+${Math.round(FILL_SPD * nf * 100)}%`, from: null, fill: true }); }
    }
    const fillBlock = full.length * b.W * b.D * FILL_BLOCK;
    // 5) 仕上げ
    const healMul = school === 'izumi' ? 1.3 : 1;
    for (const e of E) {
      const s = e.st;
      const pct = 1 + s.dmgPct, h = s.hMul;
      s.dmg = Math.max(0, Math.round((s.dmg + s.grow) * pct * h));
      s.boltDmg = Math.round(s.boltDmg * pct * h);
      s.zapDmg = Math.round(s.zapDmg * pct * h);
      s.heal = Math.round(s.heal * healMul * h);
      s.block = Math.round(s.block * h);
      s.burn = Math.round(s.burn * h);
      s.startBlock = Math.round(s.startBlock * h);
      if (school === 'kaminari' && (s.boltN || s.zap)) s.stun += 0.4;
      s.stun = Math.round(s.stun * 10) / 10;
      s.gearSpd = Math.min(0.7, s.gearSpd);
      s.spdTotal = s.spd + s.gearSpd;
      s.cdEff = s.cd ? s.cd / Math.max(0.3, 1 + s.spdTotal) : 0;
    }
    return { items: E, by, trains, full, fillBlock };
  }

  function gearValue(e, c) {
    const d = e.def;
    if (!d.gear) return 0;
    if (d.gearWet && c.above(e.p).some((q) => c.has(q, '水'))) return d.gearWet;
    return d.gear;
  }
  function gearTrains(b, E, c, o, school) {
    const per = school === 'karakuri' ? 0.08 : 0.06;
    const parent = new Map();
    const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
    const union = (a, z) => { a = find(a); z = find(z); if (a !== z) parent.set(a, z); };
    const gv = new Map();
    for (const e of E) {
      const v = gearValue(e, c);
      if (!v) continue;
      e.st.gear = v;
      gv.set(e.p.uid, v);
      const ks = e.p.cells.map((cc) => idx(b, ...cc));
      ks.forEach((k) => parent.set(k, k));
      for (let i = 1; i < ks.length; i++) union(ks[0], ks[i]);
    }
    for (const k of [...parent.keys()]) {
      const x = k % b.W, z = Math.floor(k / b.W) % b.D, y = Math.floor(k / (b.W * b.D));
      for (const d of DIRS4) {
        const nx = x + d[0], nz = z + d[2];
        if (!inb(b, nx, y, nz)) continue;
        const nk = idx(b, nx, y, nz);
        if (parent.has(nk)) union(k, nk);
      }
    }
    const comps = new Map();
    for (const k of parent.keys()) {
      const r = find(k);
      if (!comps.has(r)) comps.set(r, { cells: [], uids: new Set(), value: 0, touch: [] });
      comps.get(r).cells.push(k);
      const pi = o[k];
      if (pi >= 0) comps.get(r).uids.add(b.pieces[pi].uid);
    }
    const trains = [];
    for (const t of comps.values()) {
      t.value = [...t.uids].reduce((s, u) => s + (gv.get(u) || 0), 0);
      t.uids = [...t.uids];
      trains.push(t);
    }
    // 列にふれている道具（同じ段の前後左右）
    for (const e of E) {
      if (e.st.gear) continue;
      const hit = new Set();
      for (const cc of e.p.cells) for (const d of DIRS4) {
        const nx = cc[0] + d[0], nz = cc[2] + d[2];
        if (!inb(b, nx, cc[1], nz)) continue;
        const nk = idx(b, nx, cc[1], nz);
        if (parent.has(nk)) hit.add(find(nk));
      }
      for (const r of hit) {
        const t = comps.get(r);
        t.touch.push(e.p.uid);
        if (!e.def.cd) continue;
        const v = per * t.value * (e.def.gearTwice ? 2 : 1);
        e.st.gearSpd += v;
        e.mods.push({ text: `歯車列（${t.value}枚）｜速さ+${Math.round(v * 100)}%`, from: t.uids[0], gear: true });
        for (const u of t.uids) { const ge = E.find((x) => x.p.uid === u); if (ge) ge.out.push({ to: e.p.uid, gear: true }); }
      }
    }
    return trains;
  }

  /* 箱の力（ざっくり毎秒） */
  function power(res) {
    let atk = 0, def = (res.fillBlock || 0) / 12, heal = 0, dis = 0;
    for (const e of res.items) {
      const s = e.st;
      def += s.startBlock / 12;
      if (!s.cdEff) continue;
      const r = 1 / s.cdEff;
      atk += r * (s.dmg * s.hits + s.burn * 2.4 + s.boltDmg * s.boltN + s.zapDmg);
      def += r * s.block;
      heal += r * (s.heal + s.cleanse * 1.5);
      dis += r * (s.rust * 1.6 + s.stun * (s.boltN * 2.4 + (s.zap ? 1.6 : 0)) + s.oil * 1.4 + s.kick * 2.2 + s.tick * 6);
    }
    return { atk, def, heal, dis, total: atk + def * 0.8 + heal * 0.85 + dis };
  }

  /* ---------------- 合体 ---------------- */
  function findRecipe(b) {
    const o = occ(b);
    const at = (x, y, z) => (inb(b, x, y, z) && o[idx(b, x, y, z)] >= 0 ? b.pieces[o[idx(b, x, y, z)]] : null);
    const res = resolveLite(b);
    for (const p of b.pieces) {
      const id = p.id;
      if (id === 'katana') {
        if (res.below(p).some((q) => q.id === 'ro') && res.adj(p).some((q) => q.id === 'toishi')) return { rid: 'homura', from: [p.uid], cells: p.cells, to: 'homura' };
      }
      if (id === 'haguruma') {
        const [x, y, z] = p.cells[0];
        const a = at(x + 1, y, z), bq = at(x, y, z + 1), cq = at(x + 1, y, z + 1);
        if ([a, bq, cq].every((q) => q && q.id === 'haguruma')) return { rid: 'ooguruma', from: [p.uid, a.uid, bq.uid, cq.uid], cells: [p, a, bq, cq].map((q) => q.cells[0]), to: 'ooguruma' };
      }
      if (id === 'ita') {
        const up = p.cells.map((cc) => at(cc[0], cc[1] + 1, cc[2]));
        const q = up[0];
        if (q && q.id === 'ita' && q.uid !== p.uid && up.every((u) => u === q) && q.cells.length === p.cells.length) return { rid: 'kashi', from: [p.uid, q.uid], cells: p.cells.concat(q.cells), to: 'kashi' };
      }
      if (id === 'ozutsu') {
        const h = res.adj(p).find((q) => q.id === 'horoku');
        if (h) return { rid: 'horokuzutsu', from: [p.uid, h.uid], cells: p.cells.concat(h.cells), to: 'horokuzutsu' };
      }
      if (id === 'takeyari') {
        if (res.standing(p) && res.above(p).some((q) => q.id === 'oke')) return { rid: 'wakatake', from: [p.uid], cells: p.cells, to: 'wakatake' };
      }
      if (id === 'shuriken') {
        const [x, y, z] = p.cells[0];
        const a = at(x, y + 1, z), c2 = at(x, y + 2, z);
        if (a && c2 && a.id === 'shuriken' && c2.id === 'shuriken') return { rid: 'kazaguruma', from: [p.uid, a.uid, c2.uid], cells: [p.cells[0], a.cells[0], c2.cells[0]], to: 'kazaguruma' };
      }
    }
    return null;
  }
  function resolveLite(b) {
    const o = occ(b);
    const piecesIn = (cells) => { const s = new Set(); for (const c of cells) { const i = o[idx(b, c[0], c[1], c[2])]; if (i >= 0) s.add(i); } return [...s].map((i) => b.pieces[i]); };
    return {
      below: (q) => piecesIn(rangeCells(b, q, 'down', 1)),
      above: (q) => piecesIn(rangeCells(b, q, 'up', 1)),
      adj: (q) => piecesIn(rangeCells(b, q, 'adj', 1)),
      standing: (q) => q.cells.length >= 2 && q.cells.every((cc) => cc[0] === q.cells[0][0] && cc[2] === q.cells[0][2]),
    };
  }
  function applyRecipe(b, r) {
    const grow = 0;
    b.pieces = b.pieces.filter((p) => !r.from.includes(p.uid));
    const np = { uid: newUid(), id: r.to, cells: r.cells.map((c) => c.slice()), grow };
    b.pieces.push(np);
    return np;
  }

  /* ---------------- 戦闘 ---------------- */
  const DT = 0.05;
  const FATIGUE_AT = 22;
  function hpFor(round, boss) { return Math.round((70 + 36 * (round - 1)) * (boss ? 1.3 : 1)); }

  /* sides: [{ name, hp, box, school }] → { events, snaps, winner, time } */
  function simulate(sides, seed) {
    const R = rng(seed || 1);
    const S = sides.map((sd, si) => {
      const res = resolve(sd.box, sd.school);
      const items = [];
      for (const e of res.items) {
        const it = { uid: e.p.uid, st: e.st, def: e.def, ch: 0, stun: 0, cols: new Set(e.p.cells.map((c) => c[0] + ',' + c[2])), kick: [] };
        if (e.st.kick) it.kickTo = new Set(resolveLite(sd.box).above(e.p).map((q) => q.uid));
        items.push(it);
      }
      const rod = res.items.find((e) => e.p.id === 'hiraishin' && e.p.cells.some((c) => c[1] === sd.box.H - 1));
      return { fillBlock: res.fillBlock, si, name: sd.name, hp: sd.hp, max: sd.hp, block: 0, burn: 0, rust: 0, oil: 0, items, act: items.filter((i) => i.st.cdEff > 0), rod: rod ? rod.p : null, box: sd.box, burnT: 0 };
    });
    const ev = [], snaps = [];
    let t = 0;
    const log = (o) => { o.t = Math.round(t * 1000) / 1000; ev.push(o); };
    // 戦いのはじめ
    for (const s of S) {
      let sb = 0;
      for (const it of s.items) if (it.st.startBlock) { sb += it.st.startBlock; log({ k: 'block', s: s.si, a: it.st.startBlock, u: it.uid, start: 1 }); }
      if (s.fillBlock) { sb += s.fillBlock; log({ k: 'block', s: s.si, a: s.fillBlock, u: 0, start: 1, fill: 1 }); }
      s.block += sb;
    }
    const hurt = (s, a, kind, u, ignoreBlock) => {
      let blocked = 0;
      if (!ignoreBlock && s.block > 0) { blocked = Math.min(s.block, a); s.block -= blocked; a -= blocked; }
      s.hp -= a;
      log({ k: 'dmg', s: s.si, a, b: blocked, kind, u });
    };
    const fire = (s, o, it) => {
      const st = it.st;
      log({ k: 'fire', s: s.si, u: it.uid });
      if (st.dmg) for (let h = 0; h < st.hits; h++) hurt(o, st.dmg, 'hit', it.uid);
      if (st.burn) { o.burn += st.burn; log({ k: 'burn', s: o.si, a: st.burn, u: it.uid }); }
      if (st.rust) { o.rust = Math.min(20, o.rust + st.rust); log({ k: 'rust', s: o.si, a: st.rust, u: it.uid }); }
      if (st.block) { s.block += st.block; log({ k: 'block', s: s.si, a: st.block, u: it.uid }); }
      if (st.heal) { const a = Math.max(0, Math.min(s.max - s.hp, st.heal)); s.hp += a; log({ k: 'heal', s: s.si, a, u: it.uid }); }
      if (st.cleanse && s.burn) { const a = Math.min(s.burn, st.cleanse); s.burn -= a; log({ k: 'cleanse', s: s.si, a, u: it.uid }); }
      if (st.oil) { s.oil = Math.min(20, s.oil + st.oil); log({ k: 'oil', s: s.si, a: st.oil, u: it.uid }); }
      if (st.kick && it.kickTo) {
        const us = [];
        for (const x of s.act) if (it.kickTo.has(x.uid)) { x.ch += st.kick; us.push(x.uid); }
        if (us.length) log({ k: 'kick', s: s.si, us, u: it.uid });
      }
      if (st.tick) { for (const x of s.act) if (x !== it) x.ch += st.tick; log({ k: 'tick', s: s.si, u: it.uid }); }
      if (st.boltN) {
        const used = new Set();
        for (let n = 0; n < st.boltN; n++) {
          let col, us;
          if (o.rod) {
            col = o.rod.cells[0][0] + ',' + o.rod.cells[0][2];
            us = [];
            hurt(o, Math.ceil(st.boltDmg / 2), 'bolt', it.uid);
          } else {
            const cnt = new Map();
            for (const x of o.act) for (const k of x.cols) if (!used.has(k)) cnt.set(k, (cnt.get(k) || 0) + 1);
            let best = -1, list = [];
            for (const [k, v] of cnt) { if (v > best) { best = v; list = [k]; } else if (v === best) list.push(k); }
            if (!list.length) { for (let x = 0; x < o.box.W; x++) for (let z = 0; z < o.box.D; z++) if (!used.has(x + ',' + z)) list.push(x + ',' + z); }
            col = pick(R, list);
            us = [];
            for (const x of o.act) if (x.cols.has(col)) { x.stun = Math.max(x.stun, st.stun); us.push(x.uid); }
            hurt(o, st.boltDmg, 'bolt', it.uid);
          }
          used.add(col);
          const [cx, cz] = col.split(',').map(Number);
          log({ k: 'bolt', s: o.si, col: [cx, cz], us, d: st.stun, u: it.uid, rod: o.rod ? o.rod.uid : 0 });
        }
      }
      if (st.zap) {
        const cand = o.act.filter((x) => x.stun <= 0);
        const tg = cand.length ? pick(R, cand) : o.act.length ? pick(R, o.act) : null;
        if (tg) tg.stun = Math.max(tg.stun, st.stun);
        if (st.zapDmg) hurt(o, st.zapDmg, 'zap', it.uid);
        log({ k: 'zap', s: o.si, us: tg ? [tg.uid] : [], d: st.stun, u: it.uid });
      }
    };
    const factor = (s) => (1 + 0.04 * s.oil) / (1 + 0.04 * s.rust);
    let winner = null, fat = 0, fatT = FATIGUE_AT, snapT = 0, tick = 0;
    const snap = () => snaps.push({ t: Math.round(t * 100) / 100, s: S.map((s) => ({ hp: s.hp, block: s.block, burn: s.burn, rust: s.rust, oil: s.oil, ch: s.act.map((x) => Math.min(1, x.ch / x.st.cdEff)), stun: s.act.map((x) => (x.stun > 0 ? 1 : 0)) })) });
    snap();
    while (t < 90 && winner === null) {
      t += DT; tick++;
      const order = tick % 2 ? [S[0], S[1]] : [S[1], S[0]];
      for (const s of order) {
        const o = S[1 - s.si], f = factor(s);
        for (const it of s.act) {
          if (it.stun > 0) { it.stun -= DT; continue; }
          it.ch += DT * f;
          let guard = 0;
          while (it.ch >= it.st.cdEff && guard++ < 4) { it.ch -= it.st.cdEff; fire(s, o, it); }
        }
      }
      for (const s of S) {
        s.burnT += DT;
        if (s.burnT >= 0.8) { s.burnT -= 0.8; if (s.burn > 0) { hurt(s, s.burn, 'burn', 0, true); s.burn -= 1; } }
      }
      if (t >= fatT) { fat += 1; fatT += 1; for (const s of S) hurt(s, fat, 'fat', 0, true); log({ k: 'fatigue', a: fat }); }
      const d0 = S[0].hp <= 0, d1 = S[1].hp <= 0;
      if (d0 || d1) winner = d0 && d1 ? (S[0].hp === S[1].hp ? -1 : S[0].hp > S[1].hp ? 0 : 1) : d0 ? 1 : 0;
      if (t - snapT >= 0.1 - 1e-9 || winner !== null) { snapT = t; snap(); }
    }
    if (winner === null) winner = S[0].hp === S[1].hp ? -1 : S[0].hp > S[1].hp ? 0 : 1;
    log({ k: 'end', w: winner });
    return { events: ev, snaps, winner, time: t, uids: S.map((s) => s.act.map((x) => x.uid)), max: S.map((s) => s.max) };
  }

  /* ---------------- 品書き ---------------- */
  const ECON = { startGold: 10, reroll: 1, bench: 6, shop: 5, expand: [3, 4, 5, 6, 8, 10, 12], maxDim: 5, lives: 3, winsToBoss: 7 };
  const income = (round) => 9 + round;
  function rarWeights(r) {
    if (r <= 2) return [0, 80, 20, 0, 0];
    if (r <= 4) return [0, 58, 34, 8, 0];
    if (r <= 6) return [0, 44, 36, 17, 3];
    return [0, 34, 36, 22, 8];
  }
  const shopPool = ITEMS.filter((d) => !d.only);
  function schoolTag(school) { const s = SCHOOLS.find((x) => x.id === school); return s ? s.tag : null; }
  function rollShop(R, round, school, n) {
    const w = rarWeights(round), tag = schoolTag(school), out = [];
    for (let i = 0; i < n; i++) {
      const rar = wpick(R, [1, 2, 3, 4], (k) => w[k]);
      const pool = shopPool.filter((d) => d.rar === rar);
      const d = wpick(R, pool, (x) => (tag && x.tags.includes(tag) ? 1.7 : 1) * (out.some((o) => o.id === x.id) ? 0.35 : 1));
      const sale = R() < 0.12;
      out.push({ id: d.id, price: sale ? Math.ceil(d.cost / 2) : d.cost, sale });
    }
    return out;
  }
  const sellPrice = (id) => (DEF[id].sell != null ? DEF[id].sell : Math.max(1, Math.floor(DEF[id].cost / 2)));

  /* ---------------- 相手づくり ---------------- */
  function budgetFor(round) {
    let g = ECON.startGold;
    for (let r = 2; r <= round; r++) g += income(r);
    return g;
  }
  function dimsFor(round) {
    if (round <= 2) return [3, 3, 2];
    if (round <= 4) return [4, 3, 2];
    if (round <= 6) return [4, 4, 3];
    if (round <= 8) return [5, 4, 3];
    return [5, 5, 4];
  }
  const ARCH_START = { fire: ['hibachi', 'bokken'], water: ['kyusu', 'takeyari'], gear: ['haguruma', 'haguruma', 'shuriken'], bolt: ['hiraishin', 'kugi'], blade: ['toishi', 'bokken'], guard: ['ita', 'bokken'] };
  const ARCH_SCHOOL = { fire: 'kamado', water: 'izumi', gear: 'karakuri', bolt: 'kaminari', blade: null, guard: null };
  // 置く順番（下に置きたいもの→武器→上に置きたいもの）
  function placeRank(id) {
    const d = DEF[id];
    if (d.aura && d.aura.some((a) => a.range === 'up')) return 0;
    if (['ozutsu', 'tatami', 'horokuzutsu', 'teppan', 'bane'].includes(id)) return 1;
    if (d.gear) return 2;
    if (['yumi', 'rendo', 'hiraishin'].includes(id)) return 5;
    if (d.aura && d.aura.some((a) => a.range === 'down')) return 6;
    if (d.tags.includes('武器')) return 3;
    return 4;
  }
  function bestPlacement(b, id, school, R, rot, holePen) {
    const shape = rot || shapeOf(id);
    let best = null;
    const base = power(resolve(b, school)).total;
    const o = occ(b);
    for (const rel of orients(shape)) {
      const [sx, , sz] = extent(rel);
      for (let ax = 0; ax <= b.W - sx; ax++) for (let az = 0; az <= b.D - sz; az++) {
        const d = drop(b, rel, ax, az);
        if (!d.ok) continue;
        // 下にすき間（あとから埋められない穴）をつくる置き方は避ける
        let holes = 0;
        const own = new Set(d.cells.map((c) => c.join(',')));
        for (const c of d.cells) {
          if (own.has(c[0] + ',' + (c[1] - 1) + ',' + c[2])) continue;
          for (let y = c[1] - 1; y >= 0; y--) if (o[idx(b, c[0], y, c[2])] < 0) holes++;
        }
        const p = { uid: -1, id, cells: d.cells, grow: 0 };
        b.pieces.push(p);
        const sc = power(resolve(b, school)).total - base - d.y * 0.05 - holes * (holePen == null ? 0.35 : holePen) + R() * 0.02;
        b.pieces.pop();
        if (!best || sc > best.sc) best = { sc, cells: d.cells };
      }
    }
    return best;
  }
  /* round: 戦の番号 / opts: { boss, arch, factor } */
  function aiBuild(seed, round, opts) {
    opts = opts || {};
    const R = rng(seed);
    const archs = Object.keys(RIVALS);
    const arch = opts.arch || pick(R, archs);
    const school = ARCH_SCHOOL[arch];
    const [W, Dd, H] = opts.dims || dimsFor(round);
    const b = newBox(W, Dd, H);
    const favor = RIVALS[arch].tags;
    const f = opts.factor != null ? opts.factor : [0, 0.55, 0.62, 0.7, 0.77, 0.84][round] || 0.9;
    let gold = Math.round(budgetFor(round) * f - (opts.boss ? 0 : [0, 0, 3, 3, 12, 12, 18, 18, 26, 26][Math.min(9, round - 1)] * 0.6));
    const bag = (ARCH_START[arch] || []).slice();
    const cap = W * Dd * H;
    let cells = bag.reduce((s, id) => s + SHAPES[DEF[id].shape].length, 0);
    let guard = 0;
    while (gold >= 2 && guard++ < 30) {
      const shop = rollShop(R, round + (opts.boss ? 3 : 0), school, 5);
      const cand = shop.filter((s) => s.price <= gold && cells + SHAPES[DEF[s.id].shape].length <= cap * 0.9);
      if (!cand.length) { gold -= 1; continue; }
      const val = (s) => {
        const d = DEF[s.id];
        let v = d.rar * 2.2 + d.cost * 0.4;
        if (d.tags.some((t) => favor.includes(t))) v += 3;
        const weapons = bag.filter((id) => DEF[id].tags.includes('武器') || DEF[id].act && (DEF[id].act.bolt || DEF[id].act.zap || DEF[id].act.burn)).length;
        if (!d.cd && weapons < 2) v -= 4;
        if (d.tags.includes('武器') && weapons < 3) v += 2;
        if (d.gear && !bag.some((id) => DEF[id].gear)) v -= 1.5;
        return v + R() * 2;
      };
      cand.sort((a, z) => val(z) - val(a));
      const s = cand[0];
      bag.push(s.id);
      gold -= s.price;
      cells += SHAPES[DEF[s.id].shape].length;
    }
    bag.sort((a, z) => placeRank(a) - placeRank(z) || SHAPES[DEF[z].shape].length - SHAPES[DEF[a].shape].length);
    for (const id of bag) {
      const bp = bestPlacement(b, id, school, R);
      if (!bp) continue;
      b.pieces.push({ uid: newUid(), id, cells: bp.cells, grow: 0 });
      let r, g = 0;
      while ((r = findRecipe(b)) && g++ < 8) applyRecipe(b, r);
    }
    const nm = pick(R, RIVALS[arch].names);
    return { box: b, school, arch, name: nm[0], crest: nm[1] };
  }

  HK.rules = {
    rng, pick, wpick, norm, shapeKey, rotY, rotYi, rotX, rotZ, extent, orients, shapeOf,
    newBox, newUid, syncUid, idx, inb, occ, drop, settle, floating, cellsOf, usedCells, minY,
    rangeCells, resolve, power, findRecipe, applyRecipe, resolveLite, baseStats,
    simulate, hpFor, DT, FATIGUE_AT,
    ECON, income, HEIGHT_STEP, FILL_SPD, FILL_BLOCK, rarWeights, rollShop, sellPrice, budgetFor, dimsFor, aiBuild, bestPlacement, placeRank, ARCH_START,
    DIRS6, DIRS4,
  };
})(typeof window !== 'undefined' ? window : globalThis);
