/* =========================================================
   迷子の天気予報 — 天気のしくみ（雲・風・雨・虹）
   画面とは切りはなしてある（検算でも同じものを使う）
   ========================================================= */
(function (root) {
  'use strict';
  const W = 6, H = 5;
  const SLOTS = ['朝', '昼', '夕', '夜'];
  // 風は「雲が動く向き」で持つ。u=北へ（南風） r=東へ（西風） d=南へ（北風） l=西へ（東風）
  const DIRS = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0] };
  const WIND_NAME = { u: '南風', r: '西風', d: '北風', l: '東風' };
  const key = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && x < W && y >= 0 && y < H;

  // 白い雲は軽いので2マス、雨雲は重いので1マス流れる
  function parseWind(w) {
    if (!w || w === '0') return null;
    return { k: w[0], d: DIRS[w[0]], s: 2 };
  }
  const snap = (cs) => cs.map(c => ({ id: c.id, x: c.x, y: c.y, r: c.r }));

  /* 一日をまわす。winds は4つ（朝・昼・夕・夜）、opt.teru は [x,y]（てるてる坊主）、opt.furu は [x,y]（さかさ坊主） */
  function run(day, winds, opt) {
    opt = opt || {};
    const mt = new Set(), evap = [];
    day.map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'M') mt.add(key(x, y)); }));
    if (day.rules && day.rules.evap) (day.evap || []).forEach(([x, y]) => evap.push(key(x, y)));
    const teru = opt.teru ? key(opt.teru[0], opt.teru[1]) : -1;
    const furu = opt.furu ? key(opt.furu[0], opt.furu[1]) : -1;
    let nid = 0;
    let clouds = day.clouds.map(c => ({ id: nid++, x: c[0], y: c[1], r: c[2] === 'r' }));
    const dawn = snap(clouds);
    const slots = [];
    let prevW = null;
    for (let t = 0; t < 4; t++) {
      const wd = parseWind(winds[t]);
      const steps = [];
      if (wd) for (let s = 0; s < wd.s; s++) {
        const moves = [];
        const next = [];
        for (const c of clouds) {
          if (s === 1 && c.r) { next.push(c); continue; }
          const nx = c.x + wd.d[0], ny = c.y + wd.d[1];
          if (!inside(nx, ny)) { moves.push({ id: c.id, fx: c.x, fy: c.y, tx: nx, ty: ny, fate: 'edge' }); continue; }
          if (mt.has(key(nx, ny))) { c.r = true; moves.push({ id: c.id, fx: c.x, fy: c.y, tx: c.x, ty: c.y, fate: 'block', bx: nx, by: ny }); next.push(c); continue; }
          moves.push({ id: c.id, fx: c.x, fy: c.y, tx: nx, ty: ny, fate: 'ok' });
          c.x = nx; c.y = ny; next.push(c);
        }
        // 同じマスに集まった雲は、ひとつの雨雲になる
        const at = new Map();
        for (const c of next) { const k = key(c.x, c.y); if (!at.has(k)) at.set(k, []); at.get(k).push(c); }
        clouds = [];
        for (const [, g] of at) {
          g.sort((a, b) => a.id - b.id);
          const keep = g[0];
          if (g.length > 1) {
            keep.r = true;
            for (const o of g.slice(1)) { const m = moves.find(q => q.id === o.id); if (m) { m.fate = 'merge'; m.into = keep.id; } }
            const mk = moves.find(q => q.id === keep.id); if (mk) mk.merged = true;
          }
          clouds.push(keep);
        }
        steps.push({ moves, after: snap(clouds) });
      }
      // 天気を決める。風がやんでいる時間だけ、雨雲は雨を降らせる
      const wx = new Array(W * H).fill('S');
      const rained = [];
      for (const c of clouds) {
        const k = key(c.x, c.y);
        if (!wd && c.r && k !== teru) { wx[k] = 'R'; rained.push(c); }
        else if (!wd && !c.r && k === furu) { wx[k] = 'R'; rained.push(c); }
        else wx[k] = 'C';
      }
      const bow = [];
      if (prevW && (t === 1 || t === 2)) for (let k = 0; k < W * H; k++) if (prevW[k] === 'R' && wx[k] === 'S') bow.push(k);
      // 雨を降らせた雨雲は、ふつうの雲にもどる
      for (const c of rained) c.r = false;
      // 晴れた昼のあと、海から雲がひとつ生まれる
      const born = [];
      if (t === 1) for (const k of evap) {
        if (wx[k] === 'S' && !clouds.some(c => key(c.x, c.y) === k)) {
          const c = { id: nid++, x: k % W, y: Math.floor(k / W), r: false }; clouds.push(c); born.push(snap([c])[0]);
        }
      }
      slots.push({ wind: winds[t] || '0', steps, wx, bow, born, after: snap(clouds) });
      prevW = wx;
    }
    return { dawn, slots };
  }

  /* 天気の読み取り：'S' 晴れ／'C' くもり／'R' 雨／'B' 虹（晴れ＋虹） */
  function at(res, t, x, y) {
    const k = key(x, y), s = res.slots[t];
    if (s.wx[k] === 'S' && s.bow.includes(k)) return 'B';
    return s.wx[k];
  }

  /* お願いと予報を確かめる */
  function check(day, res, winds) {
    const out = [];
    for (const q of day.reqs) {
      let ok = true;
      const got = [];
      if (q.kind === 'wind') {
        for (const t of q.slots) {
          const w = parseWind(winds[t]);
          const g = q.calm ? !w : q.windy ? !!w : q.strong ? (w && w.s === 2) : q.dir ? (w && w.k === q.dir) : true;
          got.push(w ? w.k + w.s : '0'); if (!g) ok = false;
        }
      } else {
        const [x, y] = q.at;
        const ws = q.slots.map(t => at(res, t, x, y));
        got.push(...ws);
        if (q.kind === 'fc') ok = q.want.every((w, i) => w == null || w === ws[i] || (w === 'S' && ws[i] === 'B'));
        else if (q.kind === 'no') ok = ws.every(w => !q.w.includes(w === 'B' ? 'S' : w));
        else if (q.kind === 'is') ok = ws.every(w => q.w.includes(w) || (w === 'B' && q.w.includes('S')));
        else if (q.kind === 'any') ok = ws.some(w => q.w.includes(w));
      }
      out.push({ id: q.id, ok, got });
    }
    return out;
  }

  /* 検算用：ありうる風の組み合わせ */
  function windChoices() { return ['0', 'u', 'r', 'd', 'l']; }

  const api = { W, H, SLOTS, DIRS, WIND_NAME, key, run, at, check, parseWind, windChoices };
  if (typeof module !== 'undefined') module.exports = api; else root.MS = api;
})(this);
