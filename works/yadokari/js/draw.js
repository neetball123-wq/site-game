/* =========================================================
   ヤドカリと七つの灯台 — 盤面の描画（canvas）
   斜め上から見た島。行ごとに奥から手前へ描く
   ========================================================= */
(function (G) {
  'use strict';
  const E = G.YE;
  const TAU = Math.PI * 2;
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  function hex(c, a) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  function mix(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16 & 255, b >> 16 & 255, t)), g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  /* ---------- ヤドカリ ---------- */
  function crab(ctx, x, y, s, face, t, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); if (face < 0) ctx.scale(-1, 1);
    const bob = o.still ? 0 : Math.sin(t * 3.2) * s * 0.012;
    const lw = Math.max(1, s * 0.035);
    // 影
    ctx.fillStyle = 'rgba(20,30,40,.22)'; ctx.beginPath(); ctx.ellipse(0, s * 0.02, s * 0.36, s * 0.09, 0, 0, TAU); ctx.fill();
    // あし
    ctx.strokeStyle = '#b8432f'; ctx.lineWidth = lw * 1.1; ctx.lineCap = 'round';
    const walk = o.walk || 0;
    for (let k = 0; k < 3; k++) {
      const lx = s * (0.1 + k * 0.08), ph = Math.sin(walk * TAU + k * 2) * s * 0.03;
      ctx.beginPath(); ctx.moveTo(lx, -s * 0.1 + bob); ctx.quadraticCurveTo(lx + s * 0.1, -s * 0.12 + bob, lx + s * 0.12 + ph, s * 0.01); ctx.stroke();
    }
    // からだ
    ctx.fillStyle = '#d85a3e'; ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.13 + bob, s * 0.15, s * 0.1, -0.2, 0, TAU); ctx.fill();
    // はさみ
    ctx.fillStyle = '#e0674a'; ctx.strokeStyle = '#a63a28'; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.ellipse(s * 0.36, -s * 0.07 + bob, s * 0.1, s * 0.075, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.08 + bob); ctx.lineTo(s * 0.47, -s * 0.12 + bob); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * 0.3, -s * 0.16 + bob, s * 0.06, s * 0.045, 0.2, 0, TAU); ctx.fill();
    // 目
    ctx.strokeStyle = '#a63a28'; ctx.lineWidth = lw;
    for (const ex of [0.24, 0.31]) {
      const blink = o.blink ? 0.2 : 1;
      ctx.beginPath(); ctx.moveTo(s * ex, -s * 0.2 + bob); ctx.lineTo(s * (ex + 0.02), -s * 0.33 + bob); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(s * (ex + 0.02), -s * 0.35 + bob, s * 0.04, s * 0.04 * blink, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1c2228'; ctx.beginPath(); ctx.ellipse(s * (ex + 0.03), -s * 0.35 + bob, s * 0.022, s * 0.022 * blink, 0, 0, TAU); ctx.fill();
    }
    // 貝がら（うずまき）
    const sy = -s * 0.24 + bob * 1.5;
    const g = ctx.createRadialGradient(-s * 0.1, sy - s * 0.12, s * 0.02, -s * 0.05, sy, s * 0.34);
    g.addColorStop(0, '#fff4e6'); g.addColorStop(0.55, o.shell || '#f2b99a'); g.addColorStop(1, o.shell2 || '#c77a62');
    ctx.fillStyle = g; ctx.strokeStyle = '#9a5845'; ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(s * 0.14, sy + s * 0.14);
    ctx.bezierCurveTo(s * 0.2, sy - s * 0.12, s * 0.02, sy - s * 0.32, -s * 0.18, sy - s * 0.2);
    ctx.bezierCurveTo(-s * 0.34, sy - s * 0.1, -s * 0.36, sy + s * 0.1, -s * 0.2, sy + s * 0.16);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,70,55,.55)'; ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    for (let a = 0; a < 9.5; a += 0.2) { const r = s * (0.2 - a * 0.019); const px = -s * 0.08 + Math.cos(a + 2.2) * r, py = sy - s * 0.04 + Math.sin(a + 2.2) * r * 0.85; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
    // 描かれた星
    ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#d9a91a'; ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    const cx = s * 0.02, cy = sy + s * 0.04, R = s * 0.075;
    for (let k = 0; k < 10; k++) { const r = k % 2 ? R * 0.45 : R, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 灯り（貝の口の小さな火）
    if (o.glow) {
      const gg = ctx.createRadialGradient(s * 0.12, sy + s * 0.08, 0, s * 0.12, sy + s * 0.08, s * 0.5);
      gg.addColorStop(0, hex('#ffd98a', 0.55 * o.glow)); gg.addColorStop(1, hex('#ffd98a', 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(s * 0.12, sy + s * 0.08, s * 0.5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 盤面 ---------- */
  function Board(canvas, opt) {
    opt = opt || {};
    const ctx = canvas.getContext('2d');
    const B = { canvas, ctx, S: null, st: null, pal: null, big: false, t0: performance.now(), hl: [], ghost: null, anim: [], fx: [] };
    let cs = 40, D = 26, HU = 14, ox = 0, oy = 0, padX = 3, padY = 3, dpr = 1, cw = 0, ch = 0;
    // 画面上の姿（動かすためのもの）
    let V = null;

    function layout() {
      const r = opt.fixed || canvas.getBoundingClientRect();
      dpr = Math.min(2.5, G.devicePixelRatio || 1);
      cw = Math.max(50, r.width); ch = Math.max(50, r.height);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      if (!B.S) return;
      const S = B.S, ratioD = 0.66, ratioH = 0.36;
      const needW = S.W + 0.6, needH = S.H * ratioD + 4.2 * ratioH + 0.6;
      cs = Math.min(cw / needW, ch / needH, opt.maxCell || 96);
      D = cs * ratioD; HU = cs * ratioH;
      ox = (cw - S.W * cs) / 2;
      oy = (ch - S.H * D) / 2 + 2.2 * HU * 0.5 + (opt.dy || 0) * cs;
      padX = Math.ceil(ox / cs) + 1; padY = Math.ceil(oy / D) + 2;
    }
    const sx = (x) => ox + x * cs;
    const sy = (y, z) => oy + y * D - z * HU;

    function snap(st) {
      B.st = st; const S = B.S;
      V = { h: Array.from(st.h, (v) => v), w: st.T + 0.55, objs: [], p: { x: st.p % S.W, y: (st.p / S.W) | 0, z: E.standAt(st, st.p), face: V ? V.p.face : 1, hop: 0, walk: 0 }, gate: {}, plate: {}, lit: st.lit, gl: st.gl, lampT: {} };
      let id = 0;
      for (const i of st.s) V.objs.push({ id: id++, k: 1, i, x: i % S.W, y: (i / S.W) | 0, z: st.h[i], a: 1 });
      for (const i of st.c) V.objs.push({ id: id++, k: 2, i, x: i % S.W, y: (i / S.W) | 0, z: E.wet(st, i) ? st.T + 0.0 : st.h[i], a: 1 });
      for (const gi of [...S.gates[0], ...S.gates[1]]) V.gate[gi] = E.gateOpen(S, st, gi) ? 0 : 1;
      for (const pi of [...S.plates[0], ...S.plates[1]]) V.plate[pi] = pressedAt(st, pi) ? 1 : 0;
      S.lamps.forEach((li, k) => { V.lampT[li] = st.lit & (1 << k) ? 1 : 0; });
      B.anim = [];
    }
    function pressedAt(st, i) { return st.p === i || E.wet(st, i) || E.objAt(st, i) > 0; }

    B.load = function (S, st, pal) { B.S = S; B.pal = pal; V = null; layout(); snap(st); };
    B.resize = layout;
    B.snap = snap;
    B.busy = () => B.anim.length > 0;
    B.cell = () => ({ cs, D, HU, ox, oy });

    // 動きの予約
    function tween(dur, fn, done) { B.anim.push({ t0: null, dur, fn, done }); }

    // エンジンのイベントを動きに変える
    B.apply = function (evs, st, fast) {
      const S = B.S, k = fast ? 0.45 : 1, prev = B.st;
      let pNow = prev.p;
      const seq = [];
      for (const e of evs) {
        if (e.t === 'move') {
          pNow = e.to;
          const P = V.p, fx = e.from % S.W, fy = (e.from / S.W) | 0, tx = e.to % S.W, ty = (e.to / S.W) | 0;
          const z0 = P.z, z1 = E.standAt(st, e.to);
          if (tx !== fx) P.face = tx > fx ? 1 : -1;
          const up = Math.abs(z1 - z0) > 0.01 || e.climb;
          seq.push({ dur: (up ? 210 : 140) * k, fn: (t) => { const u = ease(t); P.x = lerp(fx, tx, u); P.y = lerp(fy, ty, u); P.z = lerp(z0, z1, u); P.hop = Math.sin(Math.PI * t) * (up ? 0.55 : 0.22); P.walk = t; }, par: true });
        } else if (e.t === 'push') {
          const o = V.objs.find((q) => q.i === e.from && q.k === e.o && q.a > 0);
          if (!o) continue;
          const fx = e.from % S.W, fy = (e.from / S.W) | 0, tx = e.to % S.W, ty = (e.to / S.W) | 0;
          const z0 = o.z, zt = e.o === 2 && e.float ? st.T : prev.h[e.to];
          o.i = e.to;
          seq.push({ dur: 140 * k, fn: (t) => { const u = ease(t); o.x = lerp(fx, tx, u); o.y = lerp(fy, ty, u); o.z = e.drop || e.float || e.fill ? lerp(z0, Math.max(z0, zt), u) : z0; }, par: true, tag: 'push' });
          if (e.fill) {
            const hi = e.to, h0 = prev.h[hi];
            seq.push({ dur: 260 * k, fn: (t) => { o.z = lerp(Math.max(z0, zt), h0 - 0.6, ease(t)); o.a = 1 - t * 0.6; }, done: () => { o.a = 0; V.h[hi] = h0 + 1; B.fx.push({ k: 'splash', i: hi, t0: now(), z: B.st.T + 0.55 }); } });
          } else if (e.o === 2 && e.float) {
            seq.push({ dur: 200 * k, fn: (t) => { o.z = lerp(Math.max(z0, zt), st.T, ease(t)); }, done: () => { B.fx.push({ k: 'splash', i: e.to, t0: now(), z: B.st.T + 0.55, small: 1 }); } });
          } else if (e.drop) {
            seq.push({ dur: 160 * k, fn: (t) => { o.z = lerp(z0, prev.h[e.to], t * t); } });
          }
        } else if (e.t === 'tide') {
          const w0 = V.w, w1 = e.T + 0.55;
          const floats = V.objs.filter((o) => o.k === 2 && o.a > 0 && E.wet(st, o.i) || (o.k === 2 && o.a > 0 && E.wet(prev, o.i)));
          const pz0 = V.p.z, pz1 = E.standAt(st, st.p);
          seq.push({ dur: 760 * (fast ? 0.6 : 1), fn: (t) => {
            const u = ease(t); V.w = lerp(w0, w1, u);
            for (const o of floats) { const base = B.st.h[o.i]; o.z = Math.max(base, V.w - 0.55); }
            V.p.z = lerp(pz0, pz1, u);
          } });
        } else if (e.t === 'drift') {
          for (const pth of e.paths) {
            const o = V.objs.find((q) => q.k === 2 && q.i === pth[0] && q.a > 0);
            if (!o) continue;
            const withP = pNow === pth[0];
            if (withP) pNow = pth[pth.length - 1];
            o.i = pth[pth.length - 1];
            const n = pth.length - 1;
            seq.push({ dur: 170 * n * k, fn: (t) => {
              const f = t * n, a = Math.min(n - 1, Math.floor(f)), u = f - a;
              const A = pth[a], Bc = pth[a + 1];
              o.x = lerp(A % S.W, Bc % S.W, u); o.y = lerp((A / S.W) | 0, (Bc / S.W) | 0, u);
              if (withP) { V.p.x = o.x; V.p.y = o.y; }
            } });
          }
        } else if (e.t === 'lit') {
          const li = e.i; seq.push({ dur: 650, fn: (t) => { V.lampT[li] = t; } });
        } else if (e.t === 'glass') {
          B.fx.push({ k: 'spark', i: e.i, t0: now() + 150 });
        }
      }
      // 門と踏み板は最後にそろえる
      const gates = [...S.gates[0], ...S.gates[1]], plates = [...S.plates[0], ...S.plates[1]];
      seq.push({ dur: 220 * k, fn: (t) => {
        for (const gi of gates) { const to = E.gateOpen(S, st, gi) ? 0 : 1; V.gate[gi] = lerp(V.gate[gi], to, t); }
        for (const pi of plates) { const to = pressedAt(st, pi) ? 1 : 0; V.plate[pi] = lerp(V.plate[pi], to, t); }
      }, par: true });
      B.st = st; V.lit = st.lit; V.gl = st.gl;
      // 並べる：par は直前と同時
      let group = [];
      const flush = () => { if (!group.length) return; const g = group; group = []; B.anim.push({ t0: null, dur: Math.max(...g.map((q) => q.dur)), fn: (t, ms) => { for (const q of g) q.fn(Math.min(1, ms / q.dur)); }, done: () => { for (const q of g) q.done && q.done(); } }); };
      for (const q of seq) { if (!q.par) flush(); group.push(q); if (!q.par) flush(); }
      flush();
      B.anim.push({ t0: null, dur: 1, fn: () => {}, done: () => { settleView(st); } });
    };
    function settleView(st) {
      const S = B.S;
      for (let i = 0; i < S.N; i++) V.h[i] = st.h[i];
      V.w = st.T + 0.55;
      V.objs = V.objs.filter((o) => o.a > 0);
      const P = V.p; P.x = st.p % S.W; P.y = (st.p / S.W) | 0; P.z = E.standAt(st, st.p); P.hop = 0;
      for (const o of V.objs) { o.x = o.i % S.W; o.y = (o.i / S.W) | 0; o.z = o.k === 2 && E.wet(st, o.i) ? st.T : st.h[o.i]; }
    }
    B.bump = function (d, why) {
      const P = V.p, dx = E.DX[d] * 0.18, dy = E.DY[d] * 0.18, x0 = P.x, y0 = P.y;
      if (dx) P.face = dx > 0 ? 1 : -1;
      B.anim.push({ t0: null, dur: 170, fn: (t) => { const u = Math.sin(Math.PI * t); P.x = x0 + dx * u; P.y = y0 + dy * u; P.hop = why === 'high' ? u * 0.18 : 0; }, done: () => { P.x = x0; P.y = y0; P.hop = 0; } });
    };
    B.nope = function () {
      const P = V.p, x0 = P.x;
      B.anim.push({ t0: null, dur: 320, fn: (t) => { P.x = x0 + Math.sin(t * Math.PI * 4) * 0.06 * (1 - t); }, done: () => { P.x = x0; } });
    };
    const now = () => performance.now();

    function step(ms) {
      while (B.anim.length) {
        const a = B.anim[0];
        if (a.t0 === null) a.t0 = ms;
        const el = ms - a.t0;
        a.fn(Math.min(1, el / a.dur), Math.min(el, a.dur));
        if (el >= a.dur) { B.anim.shift(); a.done && a.done(); continue; }
        break;
      }
    }
    B.skip = function () { let guard = 0; while (B.anim.length && guard++ < 200) { const a = B.anim.shift(); a.fn(1, a.dur); a.done && a.done(); } };

    /* ---------- 描く ---------- */
    function terrainColors(h, filled) {
      const P = B.pal;
      if (h <= 0) return P.bed;
      if (h === 1) return filled ? P.fill1 : P.sand;
      if (h === 2) return filled ? P.fill2 : P.rock;
      if (h === 3) return P.high;
      return P.cliff;
    }
    function drawBlock(x, y, z, kind, i, inGrid) {
      const X = sx(x), Y = sy(y, z), top = kind.top, front = kind.front;
      const zb = 0, fh = (z - zb) * HU;
      ctx.fillStyle = front; ctx.fillRect(X - 0.4, Y + D - 0.4, cs + 0.8, fh + 0.8);
      ctx.fillStyle = top; ctx.fillRect(X - 0.4, Y - 0.4, cs + 0.8, D + 0.8);
      if (z > 0.5 && kind.lip) { ctx.fillStyle = kind.lip; ctx.fillRect(X, Y + D - Math.max(1, D * 0.08), cs, Math.max(1, D * 0.08)); }
      // 前面の地層
      if (z > 0.5 && kind.strata) {
        ctx.fillStyle = kind.strata;
        for (let k = 1; k <= Math.floor(z - zb); k++) { const yy = Y + D + k * HU - HU * 0.5; if (hash(x, y, k) < 0.7) ctx.fillRect(X + cs * hash(x, k, 3) * 0.3, yy, cs * (0.4 + hash(k, y, 5) * 0.5), Math.max(1, HU * 0.08)); }
      }
      // 上面の模様
      if (kind.dots) {
        const n = kind.n || 5;
        for (let k = 0; k < n; k++) {
          const u = hash(x, y, k * 7 + 1), v = hash(x, y, k * 7 + 2), r = hash(x, y, k * 7 + 3);
          ctx.fillStyle = r < 0.5 ? kind.dots : kind.dots2 || kind.dots;
          const w = cs * (kind.dw || 0.06) * (0.6 + r), hh = D * (kind.dh || 0.06) * (0.6 + r);
          ctx.beginPath(); ctx.ellipse(X + cs * (0.12 + u * 0.76), Y + D * (0.15 + v * 0.7), w, hh, 0, 0, TAU); ctx.fill();
        }
      }
      if (kind.grass) {
        ctx.strokeStyle = kind.grass; ctx.lineWidth = Math.max(1, cs * 0.025);
        for (let k = 0; k < 4; k++) { const u = hash(x, y, k + 40), v = hash(x, y, k + 50); const gx = X + cs * (0.15 + u * 0.7), gy = Y + D * (0.3 + v * 0.6); ctx.beginPath(); ctx.moveTo(gx - cs * 0.03, gy); ctx.lineTo(gx, gy - D * 0.2); ctx.lineTo(gx + cs * 0.03, gy); ctx.stroke(); }
      }
    }
    function shadowEdges(x, y, z) {
      // 上の段が隣にあるとき、その影を落とす
      const S = B.S, h = (xx, yy) => (xx < 0 || yy < 0 || xx >= S.W || yy >= S.H ? 0 : Math.min(4, V.h[yy * S.W + xx]));
      const X = sx(x), Y = sy(y, z);
      const L = h(x - 1, y), U = h(x, y - 1);
      ctx.fillStyle = 'rgba(30,40,60,.16)';
      if (L > z + 0.1) ctx.fillRect(X, Y, cs * 0.16, D);
      if (U > z + 0.1) ctx.fillRect(X, Y, cs, D * 0.2);
    }

    function draw(ms) {
      const S = B.S, P = B.pal, t = (ms - B.t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 海の底（島のまわりは浅く明るい）
      ctx.fillStyle = P.deep; ctx.fillRect(0, 0, cw, ch);
      if (!S) return;
      const W = S.W, H = S.H, wl = V.w;
      const cxm = sx(W / 2), cym = sy(H / 2, 0), rr = Math.max(cw, ch) * 0.75;
      const bg = ctx.createRadialGradient(cxm, cym, cs * 1.5, cxm, cym, rr);
      bg.addColorStop(0, P.bed.top); bg.addColorStop(0.45, mix(P.bed.top, P.deep, 0.55)); bg.addColorStop(1, P.deep);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
      // 岸ぞいの浅瀬
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (V.h[i] <= 0) continue;
        const X = sx(x) + cs / 2, Y = sy(y, 0) + D / 2, R = cs * 1.1;
        const g = ctx.createRadialGradient(X, Y, cs * 0.2, X, Y, R);
        g.addColorStop(0, hex(P.bed.top, 0.9)); g.addColorStop(1, hex(P.bed.top, 0));
        ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
      }
      // 夜は水面に星がうつる
      if (P.night) {
        for (let k = 0; k < 70; k++) {
          const x = hash(k, 3, 1) * cw, y = hash(k, 5, 2) * ch, tw = 0.5 + 0.5 * Math.sin(t * (1 + hash(k, 7, 3) * 2) + k);
          ctx.fillStyle = `rgba(255,248,220,${0.15 + 0.45 * tw})`;
          ctx.fillRect(x, y, 1.6 + hash(k, 9, 4) * 1.4, 1.6 + hash(k, 9, 4) * 1.4);
        }
      }
      const objsByRow = {};
      for (const o of V.objs) { if (o.a <= 0) continue; const r = Math.ceil(o.y - 0.001); (objsByRow[r] = objsByRow[r] || []).push(o); }
      const pRow = Math.ceil(V.p.y - 0.001);
      for (let y = -padY; y < H + padY; y++) {
        // 1) 地形（海のマスは描かない）
        for (let x = 0; x < W && y >= 0 && y < H; x++) {
          const i = y * W + x, hv = V.h[i];
          if (hv >= 9) { drawBlock(x, y, 3.8, P.cliff, i, true); continue; }
          if (hv > 0) { drawBlock(x, y, hv, terrainColors(hv, hv !== S.h0[i]), i, true); shadowEdges(x, y, hv); }
          // 地面の上の印（踏み板・ガラス・砂の流れ模様）
          const f = S.feat[i];
          if (f === E.PLATE) plate(x, y, hv, V.plate[i], S.grp[i]);
          if (S.flow[i] >= 0) flowMark(x, y, hv, S.flow[i], t, hv < wl);
          const gk = S.glass.indexOf(i);
          if (gk >= 0 && !(V.gl & (1 << gk))) glass(x, y, hv, t);
        }
        // 2) 水面（盤の外も同じ濃さで一枚につながるように）
        const y0 = Math.round(sy(y, wl)), y1 = Math.round(sy(y + 1, wl));
        for (let x = -padX; x < W + padX; x++) {
          const inG = x >= 0 && y >= 0 && x < W && y < H, i = y * W + x;
          const hv = inG ? V.h[i] : 0;
          if (hv >= wl || hv >= 9) continue;
          const x0 = Math.round(sx(x)), x1 = Math.round(sx(x + 1));
          water(x, y, x0, y0, x1 - x0, y1 - y0, wl, t, inG ? i : -1, hv);
        }
        // 3) 立っているもの
        const list = [];
        for (let x = 0; x < W && y >= 0 && y < H; x++) {
          const i = y * W + x;
          if (S.feat[i] === E.LAMP) list.push({ x, z: V.h[i], k: 'lamp', i });
          if (S.feat[i] === E.GATE) list.push({ x, z: V.h[i], k: 'gate', i });
        }
        for (const o of objsByRow[y] || []) list.push({ x: o.x, z: o.z, k: o.k === 1 ? 'stone' : 'crate', o });
        if (pRow === y) list.push({ x: V.p.x, z: V.p.z, k: 'crab' });
        list.sort((a, b) => a.x - b.x);
        for (const it of list) {
          if (it.k === 'lamp') lamp(it.x, y, it.z, V.lampT[it.i] || 0, t, it.i);
          else if (it.k === 'gate') gate(it.x, y, it.z, V.gate[it.i], S.grp[it.i]);
          else if (it.k === 'stone') stone(it.o, wl);
          else if (it.k === 'crate') crate(it.o, wl, t);
          else {
            const P2 = V.p;
            const onLamp = S.feat[Math.round(P2.y) * W + Math.round(P2.x)] === E.LAMP && Math.abs(P2.x - Math.round(P2.x)) < 0.01 && Math.abs(P2.y - Math.round(P2.y)) < 0.01;
            const px = sx(P2.x) + cs * (onLamp ? 0.2 : 0.5), py = sy(P2.y, P2.z + P2.hop) + D * (onLamp ? 0.95 : 0.62);
            crab(ctx, px, py, cs * 0.92, P2.face, t, { walk: P2.walk, glow: B.pal.night ? 1 : 0.4, blink: (t % 4.3) < 0.12, shell: B.golden ? '#f6d57a' : undefined, shell2: B.golden ? '#c08a22' : undefined });
          }
        }
      }
      // 夜や夕方の色
      if (P.tint) { ctx.fillStyle = P.tint; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(0, 0, cw, ch); ctx.globalCompositeOperation = 'source-over'; }
      // 灯りの光（重ねて明るく）
      ctx.globalCompositeOperation = 'lighter';
      S.lamps.forEach((li) => {
        const k = V.lampT[li] || 0; if (!k) return;
        const x = li % W, y = (li / W) | 0, X = sx(x) + cs / 2, Y = sy(y, V.h[li] + 1.9) + D / 2;
        const R = cs * (P.night ? 3.4 : 2.0) * (0.9 + 0.1 * Math.sin(t * 2.3 + li));
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
        g.addColorStop(0, hex('#ffcf7a', 0.55 * k)); g.addColorStop(0.35, hex('#ffb35a', 0.18 * k)); g.addColorStop(1, hex('#ff9a40', 0));
        ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
      });
      if (P.night) {
        const X = sx(V.p.x) + cs / 2, Y = sy(V.p.y, V.p.z + 0.6) + D / 2, R = cs * 1.3;
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(255,214,150,.22)'); g.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      // 効果（しぶき・きらめき）
      B.fx = B.fx.filter((f) => ms - f.t0 < 900);
      for (const f of B.fx) {
        const u = (ms - f.t0) / 900; if (u < 0) continue;
        const x = f.i % W, y = (f.i / W) | 0, X = sx(x) + cs / 2, Y = sy(y, f.z || V.h[f.i] + 0.3) + D / 2;
        if (f.k === 'splash') {
          ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - u)})`; ctx.lineWidth = Math.max(1, cs * 0.04);
          ctx.beginPath(); ctx.ellipse(X, Y, cs * (0.2 + u * (f.small ? 0.35 : 0.55)), D * (0.15 + u * (f.small ? 0.3 : 0.45)), 0, 0, TAU); ctx.stroke();
          if (!f.small) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = cs * 0.3 * u; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - u)})`; ctx.beginPath(); ctx.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.6 - Math.sin(u * Math.PI) * cs * 0.4, cs * 0.035, 0, TAU); ctx.fill(); }
        } else if (f.k === 'spark') {
          for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r = cs * 0.5 * u; ctx.fillStyle = `rgba(210,255,240,${1 - u})`; ctx.beginPath(); ctx.arc(X + Math.cos(a) * r, Y - cs * 0.3 + Math.sin(a) * r, cs * 0.04 * (1 - u), 0, TAU); ctx.fill(); }
        }
      }
      // ヒントの印
      if (B.hl.length) {
        for (const i of B.hl) {
          const x = i % W, y = (i / W) | 0, z = V.h[i] >= 9 ? 3.8 : Math.max(V.h[i], wl);
          const X = sx(x), Y = sy(y, z), pulse = 0.5 + 0.5 * Math.sin(t * 5);
          ctx.strokeStyle = `rgba(255,250,210,${0.55 + 0.4 * pulse})`; ctx.lineWidth = Math.max(2, cs * 0.06);
          ctx.setLineDash([cs * 0.12, cs * 0.08]); ctx.strokeRect(X + cs * 0.08, Y + D * 0.08, cs * 0.84, D * 0.84); ctx.setLineDash([]);
        }
      }
      if (B.ghost) ghostPath(B.ghost, t);
    }

    function water(x, y, X, Y, w, h, wl, t, i, hv) {
      const P = B.pal;
      ctx.fillStyle = hex(P.water, hv > 0 ? 0.42 : 0.62);
      ctx.fillRect(X, Y, w, h);
      // さざなみ
      const ph = t * 1.1 + x * 0.9 + y * 1.7;
      if (hash(x, y, 11) < 0.55) {
        ctx.strokeStyle = hex('#ffffff', 0.08 + 0.07 * Math.sin(ph));
        ctx.lineWidth = Math.max(1, cs * 0.02);
        ctx.beginPath();
        const yy = Y + h * (0.3 + 0.4 * hash(x, y, 9)), xx = X + w * (0.1 + 0.5 * hash(x, y, 8)) + Math.sin(ph) * cs * 0.06;
        ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + cs * 0.12, yy - h * 0.06, xx + cs * 0.26, yy); ctx.stroke();
      }
      if (i < 0) return;
      // 岸の白い泡（奥の段にあたる水ぎわ）
      const S = B.S;
      if (y > 0) {
        const j = i - S.W;
        if (V.h[j] >= wl && V.h[j] < 9 || V.h[j] >= 9) {
          ctx.strokeStyle = hex(P.foam, 0.55 + 0.25 * Math.sin(t * 2 + x + y));
          ctx.lineWidth = Math.max(1.2, cs * 0.04); ctx.lineCap = 'round';
          ctx.beginPath();
          for (let k = 0; k <= 8; k++) { const u = k / 8; const yy = Y + D * 0.04 + Math.sin(t * 2.2 + u * 6 + x * 2) * D * 0.025; if (k) ctx.lineTo(X + u * w, yy); else ctx.moveTo(X + u * w, yy); }
          ctx.stroke();
        }
      }
    }
    function flowMark(x, y, hv, d, t, wetNow) {
      const X = sx(x) + cs / 2, z = wetNow ? V.w : hv, Y = sy(y, z) + D / 2;
      const dx = E.DX[d], dy = E.DY[d];
      ctx.save(); ctx.translate(X, Y); ctx.scale(1, D / cs);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.lineWidth = Math.max(1.2, cs * 0.05); ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const u = wetNow ? ((t * 0.9 + k * 0.5) % 1) : 0.25 + k * 0.4;
        const px = (u - 0.5) * cs * 0.8;
        ctx.strokeStyle = wetNow ? `rgba(235,250,255,${0.7 * Math.sin(u * Math.PI)})` : 'rgba(120,95,60,.35)';
        ctx.beginPath(); ctx.moveTo(px - cs * 0.12, -cs * 0.14); ctx.lineTo(px, 0); ctx.lineTo(px - cs * 0.12, cs * 0.14); ctx.stroke();
      }
      ctx.restore();
    }
    function stone(o, wl) {
      const X = sx(o.x) + cs / 2, Y = sy(o.y, o.z) + D * 0.55;
      ctx.save(); ctx.globalAlpha = o.a;
      ctx.fillStyle = 'rgba(20,30,40,.25)'; ctx.beginPath(); ctx.ellipse(X, Y + D * 0.12, cs * 0.36, D * 0.2, 0, 0, TAU); ctx.fill();
      const r = cs * 0.38, top = Y - HU * 0.95;
      const g = ctx.createRadialGradient(X - r * 0.35, top + r * 0.2, r * 0.1, X, top + r * 0.6, r * 1.2);
      g.addColorStop(0, '#d7dbdc'); g.addColorStop(0.5, '#9aa2a6'); g.addColorStop(1, '#5e666b');
      ctx.fillStyle = g; ctx.strokeStyle = '#4c5458'; ctx.lineWidth = Math.max(1, cs * 0.025);
      ctx.beginPath();
      ctx.moveTo(X - r, Y + D * 0.05);
      ctx.bezierCurveTo(X - r * 1.05, top + r * 0.1, X - r * 0.3, top - r * 0.15, X + r * 0.2, top);
      ctx.bezierCurveTo(X + r * 0.9, top + r * 0.1, X + r * 1.05, Y - r * 0.2, X + r, Y + D * 0.05);
      ctx.quadraticCurveTo(X, Y + D * 0.2, X - r, Y + D * 0.05);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(X - r * 0.35, top + r * 0.35, r * 0.25, r * 0.12, -0.4, 0, TAU); ctx.fill();
      // 水につかった部分
      if (wl > o.z + 0.05) waterline(X, o.y, o.z, wl, r);
      ctx.restore();
    }
    function waterline(X, y, z, wl, r) {
      const P = B.pal, Yw = sy(y, wl) + D * 0.55, Yb = sy(y, z) + D * 0.7;
      if (Yb > Yw) { ctx.fillStyle = hex(P.water, 0.55); ctx.fillRect(X - r * 1.1, Yw, r * 2.2, Yb - Yw); }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(1, cs * 0.03);
      ctx.beginPath(); ctx.ellipse(X, Yw, r * 1.1, D * 0.12, 0, 0, Math.PI); ctx.stroke();
    }
    function crate(o, wl, t) {
      const floating = wl > o.z + 0.3 && Math.abs(o.z - (wl - 0.55)) < 0.3;
      const bob = floating ? Math.sin(t * 2.2 + o.id) * 0.05 : 0;
      const w = cs * 0.7, X = sx(o.x) + (cs - w) / 2, z = o.z + bob, dd = D * 0.66, fh = HU * 0.98;
      const Yt = sy(o.y, z + 1) + (D - dd) * 0.55;
      ctx.save(); ctx.globalAlpha = o.a;
      if (!floating) { ctx.fillStyle = 'rgba(20,30,40,.28)'; ctx.fillRect(X + cs * 0.05, Yt + dd + fh - D * 0.04, w, D * 0.13); }
      // 前面（横板）
      const g = ctx.createLinearGradient(0, Yt + dd, 0, Yt + dd + fh);
      g.addColorStop(0, '#a3744a'); g.addColorStop(1, '#6f4b2d');
      ctx.fillStyle = g; ctx.fillRect(X, Yt + dd, w, fh);
      ctx.strokeStyle = 'rgba(60,35,15,.55)'; ctx.lineWidth = Math.max(1, cs * 0.018);
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(X, Yt + dd + fh * k / 3); ctx.lineTo(X + w, Yt + dd + fh * k / 3); ctx.stroke(); }
      // 上面
      const g2 = ctx.createLinearGradient(0, Yt, 0, Yt + dd);
      g2.addColorStop(0, '#e2bd8a'); g2.addColorStop(1, '#c79a66');
      ctx.fillStyle = g2; ctx.fillRect(X, Yt, w, dd);
      ctx.strokeStyle = 'rgba(120,80,45,.55)';
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(X + w * k / 3, Yt + 1); ctx.lineTo(X + w * k / 3, Yt + dd - 1); ctx.stroke(); }
      // ふち
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = Math.max(1.2, cs * 0.028);
      ctx.strokeRect(X, Yt, w, dd + fh);
      ctx.beginPath(); ctx.moveTo(X, Yt + dd); ctx.lineTo(X + w, Yt + dd); ctx.stroke();
      // 縄（たすき）
      ctx.strokeStyle = '#efe0b4'; ctx.lineWidth = Math.max(1.2, cs * 0.03);
      ctx.beginPath(); ctx.moveTo(X + w * 0.18, Yt + dd); ctx.lineTo(X + w * 0.82, Yt + dd + fh); ctx.moveTo(X + w * 0.82, Yt + dd); ctx.lineTo(X + w * 0.18, Yt + dd + fh); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(X + 2, Yt + 2, w - 4, dd * 0.22);
      if (wl > z + 0.02) waterline(X + w / 2, o.y, z, wl, w * 0.58);
      ctx.restore();
    }
    function plate(x, y, hv, pr, grp) {
      const X = sx(x) + cs / 2, Y = sy(y, hv - pr * 0.08) + D / 2, r = cs * 0.34;
      const col = grp ? ['#8fc6e0', '#5b8fb0'] : ['#f3b3a4', '#c9786a'];
      ctx.fillStyle = col[1]; ctx.beginPath(); ctx.ellipse(X, Y + D * 0.06, r, r * 0.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(X, Y, r * 0.95, r * 0.55, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = col[1]; ctx.lineWidth = Math.max(1, cs * 0.02);
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(X, Y + r * 0.5); ctx.lineTo(X + k * r * 0.28, Y - r * 0.45); ctx.stroke(); }
      if (pr > 0.5) { ctx.fillStyle = `rgba(255,255,220,${0.35 * pr})`; ctx.beginPath(); ctx.ellipse(X, Y, r * 1.1, r * 0.7, 0, 0, TAU); ctx.fill(); }
    }
    function gate(x, y, hv, closed, grp) {
      const X = sx(x), Yb = sy(y, hv) + D * 0.62, hgt = HU * (0.2 + 1.3 * closed);
      const col = grp ? '#5b8fb0' : '#c9786a';
      for (let k = 0; k < 3; k++) {
        const px = X + cs * (0.2 + k * 0.3);
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(px - cs * 0.06, Yb - hgt, cs * 0.12, hgt);
        ctx.fillStyle = '#9c7650'; ctx.fillRect(px - cs * 0.06, Yb - hgt, cs * 0.05, hgt);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, Yb - hgt, cs * 0.065, 0, TAU); ctx.fill();
      }
      if (closed > 0.3) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, cs * 0.04); ctx.beginPath(); ctx.moveTo(X + cs * 0.14, Yb - hgt * 0.7); ctx.quadraticCurveTo(X + cs * 0.5, Yb - hgt * 0.5, X + cs * 0.86, Yb - hgt * 0.7); ctx.stroke(); }
    }
    function glass(x, y, hv, t) {
      const X = sx(x) + cs / 2, Y = sy(y, hv) + D / 2 - cs * 0.05 * Math.sin(t * 2 + x);
      ctx.fillStyle = 'rgba(120,220,200,.85)'; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(1, cs * 0.02);
      ctx.beginPath(); ctx.moveTo(X, Y - cs * 0.13); ctx.lineTo(X + cs * 0.1, Y - cs * 0.02); ctx.lineTo(X + cs * 0.04, Y + cs * 0.1); ctx.lineTo(X - cs * 0.09, Y + cs * 0.06); ctx.lineTo(X - cs * 0.1, Y - cs * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + y);
      ctx.fillStyle = `rgba(255,255,255,${tw})`; ctx.beginPath(); ctx.arc(X - cs * 0.03, Y - cs * 0.05, cs * 0.025, 0, TAU); ctx.fill();
    }
    function lamp(x, y, hv, k, t, i) {
      const big = B.big, X = sx(x) + cs / 2, Yb = sy(y, hv) + D * 0.6;
      const hgt = HU * (big ? 3.4 : 2.1), w = cs * (big ? 0.42 : 0.3);
      ctx.fillStyle = 'rgba(20,30,40,.25)'; ctx.beginPath(); ctx.ellipse(X, Yb + D * 0.05, w * 1.1, D * 0.16, 0, 0, TAU); ctx.fill();
      // 塔（白と赤の帯）
      const top = Yb - hgt;
      ctx.fillStyle = '#f4efe6';
      ctx.beginPath(); ctx.moveTo(X - w, Yb); ctx.lineTo(X - w * 0.7, top + hgt * 0.22); ctx.lineTo(X + w * 0.7, top + hgt * 0.22); ctx.lineTo(X + w, Yb); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9493b';
      for (const [a, b] of [[0.45, 0.6], [0.78, 0.92]]) {
        const y1 = top + hgt * a, y2 = top + hgt * b, w1 = lerp(w * 0.7, w, (a - 0.22) / 0.78), w2 = lerp(w * 0.7, w, (b - 0.22) / 0.78);
        ctx.beginPath(); ctx.moveTo(X - w1, y1); ctx.lineTo(X + w1, y1); ctx.lineTo(X + w2, y2); ctx.lineTo(X - w2, y2); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(X + w * 0.2, Yb); ctx.lineTo(X + w * 0.15, top + hgt * 0.22); ctx.lineTo(X + w * 0.7, top + hgt * 0.22); ctx.lineTo(X + w, Yb); ctx.closePath(); ctx.fill();
      // 灯室
      ctx.fillStyle = '#39424a'; ctx.fillRect(X - w * 0.85, top + hgt * 0.18, w * 1.7, hgt * 0.05);
      const gl = ctx.createLinearGradient(0, top + hgt * 0.02, 0, top + hgt * 0.18);
      gl.addColorStop(0, k ? '#fff7cf' : '#9fb3bd'); gl.addColorStop(1, k ? '#ffc760' : '#6f8792');
      ctx.fillStyle = gl; ctx.fillRect(X - w * 0.5, top + hgt * 0.02, w, hgt * 0.16);
      ctx.fillStyle = '#39424a'; ctx.beginPath(); ctx.moveTo(X - w * 0.62, top + hgt * 0.03); ctx.lineTo(X, top - hgt * 0.08); ctx.lineTo(X + w * 0.62, top + hgt * 0.03); ctx.closePath(); ctx.fill();
      if (k > 0) {
        // 回る光
        const a = t * 1.3 + i, len = cs * (big ? 3.2 : 1.8) * k;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const s of [0, Math.PI]) {
          const ang = a + s, c = Math.cos(ang);
          const g = ctx.createLinearGradient(X, top + hgt * 0.1, X + c * len, top + hgt * 0.1);
          g.addColorStop(0, `rgba(255,236,170,${0.5 * k})`); g.addColorStop(1, 'rgba(255,236,170,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X, top + hgt * 0.1); ctx.lineTo(X + c * len, top + hgt * 0.1 - cs * 0.28); ctx.lineTo(X + c * len, top + hgt * 0.1 + cs * 0.28); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }
    function ghostPath(g, t) {
      ctx.save();
      const P = (pt) => [sx(pt.x) + cs / 2, sy(pt.y, pt.z) + D / 2];
      const n = g.pts.length, head = (t * 5) % (n + 4);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(30,50,70,.35)'; ctx.lineWidth = Math.max(4, cs * 0.16);
      ctx.beginPath(); g.pts.forEach((pt, k) => { const [x, y] = P(pt); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,244,190,.95)'; ctx.lineWidth = Math.max(2.5, cs * 0.08);
      ctx.setLineDash([cs * 0.14, cs * 0.1]); ctx.lineDashOffset = -t * cs * 0.6;
      ctx.beginPath(); g.pts.forEach((pt, k) => { const [x, y] = P(pt); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
      ctx.setLineDash([]);
      g.pts.forEach((pt) => {
        const [x, y] = P(pt);
        if (pt.tide) {
          ctx.fillStyle = 'rgba(90,170,230,.95)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x + cs * 0.22, y - cs * 0.32, cs * 0.16, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, cs * 0.03);
          ctx.beginPath(); ctx.moveTo(x + cs * 0.12, y - cs * 0.3); ctx.quadraticCurveTo(x + cs * 0.17, y - cs * 0.36, x + cs * 0.22, y - cs * 0.3); ctx.quadraticCurveTo(x + cs * 0.27, y - cs * 0.24, x + cs * 0.32, y - cs * 0.3); ctx.stroke();
        }
      });
      const hk = Math.min(n - 1, Math.floor(head));
      const [hx, hy] = P(g.pts[hk]);
      ctx.fillStyle = 'rgba(255,250,215,1)'; ctx.strokeStyle = 'rgba(30,50,70,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hx, hy, cs * 0.12, 0, TAU); ctx.fill(); ctx.stroke();
      const [lx, ly] = P(g.pts[n - 1]);
      ctx.strokeStyle = 'rgba(255,250,215,.95)'; ctx.lineWidth = Math.max(2, cs * 0.05);
      ctx.beginPath(); ctx.arc(lx, ly, cs * 0.22 + Math.sin(t * 4) * cs * 0.03, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    B.frame = function (ms) { step(ms); draw(ms); };
    B.cellAt = function (px, py) {
      // 画面の点 → マス（いちばん手前で当たるもの）
      const S = B.S; if (!S) return -1;
      for (let y = S.H - 1; y >= 0; y--) for (let x = 0; x < S.W; x++) {
        const i = y * S.W + x, z = Math.max(Math.min(V.h[i], 4), V.w);
        const X = sx(x), Y = sy(y, z);
        if (px >= X && px < X + cs && py >= Y && py < Y + D) return i;
      }
      return -1;
    };
    B.playerScreen = () => ({ x: sx(V.p.x) + cs / 2, y: sy(V.p.y, V.p.z) + D / 2 });
    B.view = () => V;
    return B;
  }

  G.YD = { Board, crab, mix, hex };
})(window);
