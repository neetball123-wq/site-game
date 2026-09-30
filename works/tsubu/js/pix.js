/* =========================================================
   ツブのとっておき — ドット絵の道具（画面とは別。Node でも動く）
   絵は「文字の格子」で書く。1文字＝1画素、'.' は透明。
   文字→色は、その都度わたす色表（pal）で決める。
   ========================================================= */
(function (G) {
  'use strict';
  const memo = {};
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (memo[c]) return memo[c];
    const n = parseInt(c.slice(1), 16);
    return (memo[c] = [n >> 16 & 255, n >> 8 & 255, n & 255]);
  }
  const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };

  function Bmp(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  Bmp.prototype.put = function (x, y, c, a) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    c = rgb(c); const i = (y * this.w + x) * 4, d = this.d;
    if (a === undefined || a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    if (a <= 0) return;
    const b = d[i + 3] / 255, oa = a + b * (1 - a);
    d[i] = (c[0] * a + d[i] * b * (1 - a)) / oa; d[i + 1] = (c[1] * a + d[i + 1] * b * (1 - a)) / oa; d[i + 2] = (c[2] * a + d[i + 2] * b * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  };
  Bmp.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4, d = this.d;
    return d[i + 3] ? [d[i], d[i + 1], d[i + 2], d[i + 3]] : null;
  };
  Bmp.prototype.on = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[(y * this.w + x) * 4 + 3] > 0; };
  Bmp.prototype.fill = function (x0, y0, w, h, c, a) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.put(x, y, c, a); };
  Bmp.prototype.blit = function (src, ox, oy, flip) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + (flip ? src.w - 1 - x : x)) * 4, s = src.d;
      if (!s[i + 3]) continue;
      this.put(ox + x, oy + y, [s[i], s[i + 1], s[i + 2]], s[i + 3] / 255);
    }
  };
  Bmp.prototype.clone = function () { const b = new Bmp(this.w, this.h); b.d.set(this.d); return b; };

  // 格子を描く。rows: 文字列の配列。pal: 文字→色（null/undefined は描かない）
  function layer(b, rows, pal, ox, oy, flip) {
    ox = ox || 0; oy = oy || 0;
    const w = Math.max(...rows.map((r) => r.length));
    for (let y = 0; y < rows.length; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c) b.put(ox + (flip ? w - 1 - x : x), oy + y, c);
      }
    }
    return b;
  }

  // ふちどり：透明な画素のうち、となりに色がある所を、そのとなりの色を暗くして塗る
  function outline(b, dark, t) {
    dark = rgb(dark || '#2b1d2e'); t = t === undefined ? 0.72 : t;
    const add = [];
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      if (b.on(x, y)) continue;
      let n = null;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const c = b.get(x + dx, y + dy); if (c && c[3] > 200) { n = c; break; } }
      if (n) add.push([x, y, mix([n[0], n[1], n[2]], dark, t)]);
    }
    for (const [x, y, c] of add) b.put(x, y, c);
    return b;
  }

  function pad(b, m) { const n = new Bmp(b.w + m * 2, b.h + m * 2); n.blit(b, m, m); return n; }

  // 色あわせ（夜・夕方）。fn(r,g,b,x,y) → [r,g,b]
  function tone(b, fn) {
    const d = b.d;
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const i = (y * b.w + x) * 4;
      if (!d[i + 3]) continue;
      const c = fn(d[i], d[i + 1], d[i + 2], x, y);
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    return b;
  }

  // 画面へ（ブラウザのみ）
  function toCanvas(b, cv) {
    cv = cv || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    cv.width = b.w; cv.height = b.h;
    const ctx = cv.getContext('2d');
    const im = ctx.createImageData(b.w, b.h); im.data.set(b.d); ctx.putImageData(im, 0, 0);
    return cv;
  }

  // 同じ絵の小さい版（面積平均＋よく出る色に寄せる）
  function shrink(b, w, h) {
    const n = new Bmp(w, h), sx = b.w / w, sy = b.h / h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const cnt = {}; let best = null, bn = 0, tot = 0;
      for (let yy = Math.floor(y * sy); yy < Math.ceil((y + 1) * sy); yy++) for (let xx = Math.floor(x * sx); xx < Math.ceil((x + 1) * sx); xx++) {
        const c = b.get(xx, yy); tot++;
        if (!c) continue;
        const k = c[0] + ',' + c[1] + ',' + c[2]; cnt[k] = (cnt[k] || 0) + 1;
        if (cnt[k] > bn) { bn = cnt[k]; best = c; }
      }
      let on = 0; for (const k in cnt) on += cnt[k];
      if (best && on * 2 >= tot) n.put(x, y, [best[0], best[1], best[2]]);
    }
    return n;
  }

  const API = { rgb, hex, mix, Bmp, layer, outline, pad, tone, toCanvas, shrink };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.PX = API;
})(typeof window !== 'undefined' ? window : globalThis);
