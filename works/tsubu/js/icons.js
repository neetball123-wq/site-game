/* =========================================================
   ツブのとっておき — たからものの絵（16×16 までの格子。ふちどりは自動）
   ICON[id] = [色表, 格子]。色表は '文字:色' をスペースでつなぐ
   ========================================================= */
(function (G) {
  'use strict';
  const PX = G.PX, TI = G.TI;
  const ICON = {};
  const COL = { sora: '#8fd0f2', mido: '#7fc47a', hono: '#ec6b54', hosi: '#5563b8', uta: '#f59ac8', hina: '#f2c14e', yoru: '#8a6bd6' };

  function parsePal(s) { const p = {}; s.split(/\s+/).filter(Boolean).forEach((kv) => { const [k, v] = kv.split(':'); p[k] = v; }); return p; }
  const cache = {};
  function icon(id) {
    if (cache[id]) return cache[id];
    const def = ICON[id];
    let b;
    if (def) {
      const pal = parsePal(def[0]), rows = def[1];
      const w = Math.max(...rows.map((r) => r.length));
      b = new PX.Bmp(16, 16);
      PX.layer(b, rows, pal, Math.floor((16 - w) / 2), Math.floor((16 - rows.length) / 2));
    } else {
      // まだ絵のない物：色の粒
      const it = TI.get(id), t = it ? Object.keys(it.t).sort((a, c) => it.t[c] - it.t[a])[0] : 'sora';
      b = new PX.Bmp(16, 16);
      const c = COL[t] || '#ccc', hi = PX.hex(PX.mix(c, '#ffffff', 0.5)), sh = PX.hex(PX.mix(c, '#000000', 0.25));
      for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) { const d = Math.abs(x - 7.5) + Math.abs(y - 7.5); if (d < 6) b.put(x, y, d < 2.5 && x < 8 && y < 8 ? hi : x + y > 16 ? sh : c); }
    }
    const o = PX.pad(b, 1); PX.outline(o, '#3a2030', 0.78);
    return (cache[id] = o);
  }
  // 小さな版（手に持つ・部屋の棚）
  const small = {};
  function mini(id, n) { const k = id + '@' + n; if (!small[k]) small[k] = PX.shrink(icon(id), n, n); return small[k]; }
  function main(id) { const it = TI.get(id); return it ? Object.keys(it.t).sort((a, c) => it.t[c] - it.t[a])[0] : 'fu'; }

  TI.ICON = ICON; TI.icon = icon; TI.mini = mini; TI.main = main; TI.COL = COL;
})(window);
