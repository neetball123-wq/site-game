/* =========================================================
   ヤドカリと七つの灯台 — 盤面のきまり（画面とは別。Node でも動く）
   地形の高さ：海0・砂1・岩2・高台3・崖（通れない）
   潮：引き潮 T=0（海だけ水）／満ち潮 T=1（砂も水）
   ========================================================= */
(function (G) {
  'use strict';
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const ACT = { U: 0, R: 1, D: 2, L: 3 };
  const TER = { '~': 0, '.': 1, '#': 2, '^': 3, 'X': 9 };
  const LAMP = 1, PLATE = 2, GATE = 3, WALL = 9;

  function load(def) {
    const rows = def.map, fl = def.feat || [], ol = def.obj || [];
    const H = rows.length, W = Math.max(...rows.map((r) => r.length));
    const N = W * H, h0 = new Int8Array(N), flow = new Int8Array(N).fill(-1), feat = new Int8Array(N), grp = new Int8Array(N).fill(-1);
    const lamps = [], glass = [], plates = [[], []], gates = [[], []], s = [], c = [];
    let p = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = rows[y][x] || 'X', f = (fl[y] || '')[x] || ' ', o = (ol[y] || '')[x] || ' ';
      h0[i] = t in TER ? TER[t] : WALL;
      switch (f) {
        case 'L': feat[i] = LAMP; lamps.push(i); break;
        case '*': glass.push(i); break;
        case 'p': feat[i] = PLATE; grp[i] = 0; plates[0].push(i); break;
        case 'q': feat[i] = PLATE; grp[i] = 1; plates[1].push(i); break;
        case 'g': feat[i] = GATE; grp[i] = 0; gates[0].push(i); break;
        case 'h': feat[i] = GATE; grp[i] = 1; gates[1].push(i); break;
        case '^': flow[i] = 0; break; case '>': flow[i] = 1; break;
        case 'v': flow[i] = 2; break; case '<': flow[i] = 3; break;
      }
      if (o === '@') p = i; else if (o === 'o') s.push(i); else if (o === 'c') c.push(i);
    }
    if (p < 0) throw new Error('no player: ' + (def.id || ''));
    const stage = { id: def.id, W, H, N, h0, flow, feat, grp, lamps, glass, plates, gates, conch: !!def.conch, all: (1 << lamps.length) - 1 };
    stage.start = { p, T: def.tide ? 1 : 0, h: Int8Array.from(h0), s: s.sort((a, b) => a - b), c: c.sort((a, b) => a - b), lit: 0, gl: 0 };
    settle(stage, stage.start, null);
    return stage;
  }

  const wet = (st, i) => st.h[i] <= st.T;
  const objAt = (st, i) => (st.s.indexOf(i) >= 0 ? 1 : st.c.indexOf(i) >= 0 ? 2 : 0);
  function pressed(S, st, g) {
    const ps = S.plates[g];
    for (let k = 0; k < ps.length; k++) { const i = ps[k]; if (st.p === i || wet(st, i) || objAt(st, i)) return true; }
    return false;
  }
  function gateOpen(S, st, i) { return pressed(S, st, S.grp[i]) || st.p === i || objAt(st, i) > 0; }
  function blocked(S, st, i) { return st.h[i] >= WALL || (S.feat[i] === GATE && !gateOpen(S, st, i)); }
  // その場に立ったときの高さ（水に沈むなら -1）
  function standAt(st, i) {
    const o = objAt(st, i);
    if (o === 2) return wet(st, i) ? st.T + 1 : st.h[i] + 1;
    if (o === 1) return st.h[i] + 1;
    return wet(st, i) ? -1 : st.h[i];
  }
  function nb(S, i, d) {
    const x = i % S.W + DX[d], y = (i / S.W | 0) + DY[d];
    return x < 0 || y < 0 || x >= S.W || y >= S.H ? -1 : y * S.W + x;
  }
  function clone(st) { return { p: st.p, T: st.T, h: Int8Array.from(st.h), s: st.s.slice(), c: st.c.slice(), lit: st.lit, gl: st.gl }; }
  const ins = (arr, v) => { arr.push(v); arr.sort((a, b) => a - b); };
  const rem = (arr, v) => { const k = arr.indexOf(v); if (k >= 0) arr.splice(k, 1); };

  // 潮の流れで浮いた箱が流れる／灯り・ガラスを拾う
  function settle(S, st, ev) {
    let guard = 0, moved = true;
    const paths = ev ? {} : null;
    // うず（輪になった流れ）を一周した箱は、そこで止まる
    const seen = st.c.map((i) => [i]), done = st.c.map(() => false);
    while (moved && guard++ < 300) {
      moved = false;
      for (let k = 0; k < st.c.length; k++) {
        if (done[k]) continue;
        const i = st.c[k], f = S.flow[i];
        if (f < 0 || !wet(st, i)) continue;
        const j = nb(S, i, f);
        if (j < 0 || !wet(st, j) || blocked(S, st, j) || objAt(st, j) || S.feat[j] === LAMP) continue;
        if (seen[k].indexOf(j) >= 0) done[k] = true; else seen[k].push(j);
        st.c[k] = j; moved = true;
        if (paths) { const pth = paths[i] || [i]; delete paths[i]; pth.push(j); paths[j] = pth; }
        if (st.p === i) st.p = j;
      }
    }
    if (guard >= 300 && ev) ev.push({ t: 'loop' });
    st.c.sort((a, b) => a - b);
    if (paths && ev) { const list = Object.values(paths).filter((pp) => pp.length > 1); if (list.length) ev.push({ t: 'drift', paths: list }); }
    const li = S.lamps.indexOf(st.p);
    if (li >= 0 && !(st.lit & (1 << li))) { st.lit |= 1 << li; if (ev) ev.push({ t: 'lit', i: st.p, k: li }); }
    const gi = S.glass.indexOf(st.p);
    if (gi >= 0 && !(st.gl & (1 << gi))) { st.gl |= 1 << gi; if (ev) ev.push({ t: 'glass', i: st.p, k: gi }); }
    return st;
  }

  // a: 'U' 'R' 'D' 'L' 'T'（ほら貝＝潮）。動けなければ null（ev に理由）
  function act(S, st, a, ev) {
    if (a === 'T') {
      if (!S.conch) return null;
      const n = clone(st); n.T = 1 - st.T;
      if (standAt(n, n.p) < 0) { if (ev) ev.push({ t: 'nope', why: 'drown' }); return null; }
      if (ev) ev.push({ t: 'tide', T: n.T });
      return settle(S, n, ev);
    }
    const d = ACT[a], t = nb(S, st.p, d);
    if (t < 0 || blocked(S, st, t)) { if (ev) ev.push({ t: 'bump', d }); return null; }
    const from = standAt(st, st.p), o = objAt(st, t);
    const reach = (lv) => lv >= 0 && Math.abs(lv - from) <= 1;
    if (o) {
      if (!wet(st, t) && reach(st.h[t])) {
        const u = nb(S, t, d);
        if (u >= 0 && !blocked(S, st, u) && !objAt(st, u) && S.feat[u] !== LAMP && st.h[u] <= st.h[t]) {
          const n = clone(st);
          if (o === 1) {
            rem(n.s, t);
            if (wet(st, u)) { n.h[u] += 1; if (ev) ev.push({ t: 'push', o: 1, from: t, to: u, fill: true }); }
            else { ins(n.s, u); if (ev) ev.push({ t: 'push', o: 1, from: t, to: u, drop: st.h[u] < st.h[t] }); }
          } else {
            rem(n.c, t); ins(n.c, u);
            if (ev) ev.push({ t: 'push', o: 2, from: t, to: u, float: wet(st, u), drop: st.h[u] < st.h[t] });
          }
          n.p = t;
          if (ev) ev.push({ t: 'move', from: st.p, to: t, d });
          return settle(S, n, ev);
        }
      }
      const top = standAt(st, t);
      if (reach(top)) {
        const n = clone(st); n.p = t;
        if (ev) ev.push({ t: 'move', from: st.p, to: t, d, climb: o, board: o === 2 && wet(st, t) });
        return settle(S, n, ev);
      }
      if (ev) ev.push({ t: 'bump', d, why: 'high' });
      return null;
    }
    const lv = standAt(st, t);
    if (lv < 0) { if (ev) ev.push({ t: 'bump', d, why: 'water' }); return null; }
    if (!reach(lv)) { if (ev) ev.push({ t: 'bump', d, why: lv > from ? 'high' : 'low' }); return null; }
    const n = clone(st); n.p = t;
    if (ev) ev.push({ t: 'move', from: st.p, to: t, d });
    return settle(S, n, ev);
  }

  const won = (S, st) => st.lit === S.all;
  function key(S, st) {
    let f = '';
    for (let i = 0; i < S.N; i++) if (st.h[i] !== S.h0[i]) f += i + ':' + st.h[i] + ',';
    return st.p + '|' + st.T + '|' + st.lit + '|' + st.s.join('.') + '|' + st.c.join('.') + '|' + f;
  }

  // 幅優先で最短手順（ガラスは無視）。opts.max で打ち切り
  function solve(S, opts) {
    opts = opts || {};
    const max = opts.max || 2e6, acts = S.conch ? ['U', 'R', 'D', 'L', 'T'] : ['U', 'R', 'D', 'L'];
    const start = S.start, seen = new Map();
    seen.set(key(S, start), null);
    let q = [[start, key(S, start)]], depth = 0;
    const par = new Map();
    while (q.length) {
      const nq = [];
      for (const [st, k] of q) {
        for (const a of acts) {
          const n = act(S, st, a, null);
          if (!n) continue;
          const nk = key(S, n);
          if (seen.has(nk)) continue;
          seen.set(nk, [k, a]);
          if (won(S, n)) {
            const path = [a]; let cur = k;
            while (seen.get(cur)) { const [pk, pa] = seen.get(cur); path.push(pa); cur = pk; }
            path.reverse();
            return { path: path.join(''), explored: seen.size, depth: depth + 1 };
          }
          nq.push([n, nk]);
          if (seen.size > max) return { path: null, explored: seen.size, cut: true };
        }
      }
      q = nq; depth++;
    }
    return { path: null, explored: seen.size };
  }

  function run(S, path, st) {
    st = st || S.start;
    for (const a of path) { const n = act(S, st, a, null); if (!n) return null; st = n; }
    return st;
  }

  const API = { load, act, won, key, solve, run, standAt, wet, objAt, gateOpen, pressed, nb, DX, DY, LAMP, PLATE, GATE, WALL };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.YE = API;
})(typeof window !== 'undefined' ? window : globalThis);
