/* =========================================================
   ツブのとっておき — おさんぽ（あかちゃん・こどもの時期）
   押しているあいだ、いっしょに歩く。はなすと、止まる。
   止まったそばの物を、ツブがひろう。物の色で、見つかりかたがちがう。
     そら：風にのって流れてくる（真下で止まると、手に落ちてくる）
     みどり：しげみに かくれている（そばで じっと待つと、出てくる）
     ほのお：近づくと にげる（押しつづけると、走って つかまえる）
     ほし：土のなかで ときどき光る（そこで止まると、ほりだす）
     うた：音がきこえる（止まると、ツブがおどりだす）
     ひだまり：家の窓から、手わたされる（前で止まる）
     よる：夕ぐれにだけ、あらわれる
   ========================================================= */
(function (G) {
  'use strict';
  const PX = G.PX, TI = G.TI, TA = G.TA;
  const KIND = { sora: 'float', mido: 'hide', hono: 'hop', hosi: 'glint', uta: 'tune', hina: 'give' };
  const PLACE = { sora: '風の丘', mido: 'うら山', hono: '川原の公園', hosi: '図書館の広場', uta: '商店街', hina: 'おばあちゃんちの ほう' };
  const SKY = {
    sora: ['#58b4ec', '#d6f1ff'], mido: ['#83c6d8', '#e6f4d8'], hono: ['#6fbdea', '#e0f4ff'],
    hosi: ['#86b6e2', '#eceffa'], uta: ['#90c2e4', '#fde8de'], hina: ['#96c9e8', '#fff0da'],
  };
  const DUSK = ['#6a5ca4', '#ffb27a'];
  const SEA = {
    spring: { g: '#98d27f', g2: '#7cbf68', lf: '#86c96f', lf2: '#64ad5a', bl: '#f7bfd3', bl2: '#ea9dbb', snow: 0 },
    summer: { g: '#72c05c', g2: '#58a84b', lf: '#58ab52', lf2: '#3f8d46', bl: '#fff2a0', bl2: '#f1cf62', snow: 0 },
    autumn: { g: '#cfba68', g2: '#b69e53', lf: '#eba24e', lf2: '#d4713b', bl: '#f2c14e', bl2: '#d98a3a', snow: 0 },
    winter: { g: '#eef4fb', g2: '#d2ddec', lf: '#e6edf7', lf2: '#c2d0e3', bl: '#ffffff', bl2: '#dfe8f4', snow: 1 },
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const INK = '#3a2030';
  function hs(a, b) { let h = (Math.imul(a | 0, 374761393) + Math.imul((b | 0) + 7, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- 描く道具 ---------- */
  function paint(b) {
    const W = b.w, H = b.h;
    const P = (x, y, c, a) => b.put(Math.round(x), Math.round(y), c, a);
    const R = (x0, y0, x1, y1, c, a) => {
      x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0)); x1 = Math.min(W, Math.round(x1)); y1 = Math.min(H, Math.round(y1));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) b.put(x, y, c, a);
    };
    const D = (cx, cy, r, c, a) => {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) b.put(x, y, c, a);
      }
    };
    const L = (x0, y0, x1, y1, c, r, a) => {
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (r) D(x, y, r, c, a); else P(x, y, c, a); }
    };
    return { P, R, D, L, W, H };
  }
  const M = (a, c, t) => PX.mix(a, c, t);

  // 格子の小さな絵（音符・びっくり）
  const NOTE = ['..#', '..#', '.##', '##.', '#..'];
  const NOTE_S = ['.#', '.#', '##'];

  /* ---------- 景色 ---------- */
  // 色ごとの場所。cam：歩いた距離（画素）、dp：夕ぐれの濃さ
  function scene(b, o, cam, dp, t) {
    const { P, R, D, L, W, H } = paint(b);
    const th = o.dest, se = SEA[o.season] || SEA.spring, seed = o.seed;
    const pt = Math.round(H * 0.76), pb = Math.round(H * 0.94), gy = Math.round(H * 0.87);
    const big = W >= 60;
    const dim = (c, k) => M(c, '#2a2350', (k === undefined ? 0.35 : k) * dp);
    // 空（ディザでぼかしたグラデーション）
    const [s0, s1] = SKY[th] || SKY.sora;
    const w0 = o.season === 'winter' ? M(s0, '#dfe8f2', 0.35) : o.season === 'autumn' ? M(s0, '#f3d9b0', 0.12) : s0;
    for (let y = 0; y < pt; y++) for (let x = 0; x < W; x++) {
      const v = y / pt, q = Math.min(1, Math.floor(v * 6 + BAYER[(y % 4) * 4 + (x % 4)] / 16) / 6);
      P(x, y, M(M(w0, s1, q), M(DUSK[0], DUSK[1], q), dp));
    }
    // 雲
    if (th !== 'mido') for (let k = 0; k < 4; k++) {
      const span = W * 1.8, r = W * (0.045 + hs(k, seed + 3) * 0.035);
      const cx = ((k * 0.47 + hs(k, seed) * 0.3) * span - cam * 0.07 - t * W * 0.004) % span; const x = (cx + span) % span - W * 0.35;
      const y = H * (0.08 + hs(k + 9, seed) * 0.2);
      const cw = M('#ffffff', '#ffd9c6', dp), cs = M('#dcecf8', '#e7a996', dp);
      D(x - r * 0.9, y + r * 0.35, r * 0.7, cw); D(x + r * 0.95, y + r * 0.3, r * 0.75, cw); D(x, y, r, cw);
      R(x - r * 1.5, y + r * 0.62, x + r * 1.6, y + r * 1.02, cs);
    }
    const lay = (par, sp, fn) => { const off = cam * par; for (let k = Math.floor((off - W) / sp); k * sp - off < W * 1.6; k++) fn(k, k * sp - off + hs(k, seed + Math.round(par * 100)) * sp * 0.3, hs(k, seed + 51 + Math.round(par * 10))); };
    const grass = (y0, y1, c) => R(0, y0, W, y1, dim(c, 0.3));

    if (th === 'sora') { // 風の丘：遠い山、ゆるい丘、木の柵、風車
      for (let x = 0; x < W; x++) {
        const u = (x + cam * 0.08) / W;
        const hm = H * (0.4 + 0.07 * Math.sin(u * 2.1 + seed % 7) + 0.03 * Math.sin(u * 5.3));
        for (let y = Math.round(hm); y < pt; y++) P(x, y, dim(y - hm < 1.2 && o.season !== 'summer' ? '#eef5fb' : o.season === 'winter' ? '#d8e4f1' : '#b3cde4', 0.4));
        const u2 = (x + cam * 0.3) / W, h2 = H * (0.56 + 0.045 * Math.sin(u2 * 3.1 + 1) + 0.02 * Math.sin(u2 * 7.7));
        for (let y = Math.round(h2); y < pt; y++) P(x, y, dim(se.g2, 0.3));
        const u3 = (x + cam * 0.55) / W, h3 = H * (0.65 + 0.035 * Math.sin(u3 * 2.3 + 2));
        for (let y = Math.round(h3); y < pt; y++) P(x, y, dim(M(se.g, se.g2, 0.3), 0.3));
      }
      lay(0.3, W * 2.4, (k, x, r) => { // 風車
        if (r < 0.45) return;
        const by = H * 0.6, ty = H * 0.36, cx = x;
        for (let y = Math.round(ty); y < by; y++) { const hw = 0.6 + (y - ty) / (by - ty) * (big ? 2 : 1.2); R(cx - hw, y, cx + hw + 1, y + 1, dim('#f4efe6', 0.4)); }
        const a = t * 0.0012 * (1 + r), bl = big ? W * 0.1 : W * 0.09;
        for (let i = 0; i < 4; i++) { const an = a + i * Math.PI / 2; L(cx + 0.5, ty, cx + 0.5 + Math.cos(an) * bl, ty + Math.sin(an) * bl, dim('#e7dccb', 0.4)); }
        P(cx, ty, dim('#b5846a', 0.4));
      });
      grass(pt, pb, se.g);
      const fence = Math.max(3, Math.round(H * 0.1));
      lay(1, W * 0.16, (k, x) => { R(x, pt - fence, x + 1, pt + 1, dim('#b98d62')); });
      R(0, pt - fence + 1, W, pt - fence + 2, dim('#c9a077')); if (big) R(0, pt - 2, W, pt - 1, dim('#c9a077'));
    } else if (th === 'mido') { // うら山：霧の森、太い木、どんぐりの道
      lay(0.12, W * 0.07, (k, x, r) => { const h = H * (0.2 + r * 0.14), by = H * 0.64; for (let y = Math.round(by - h); y < pt; y++) { const hw = Math.max(0, (y - (by - h)) * 0.42); R(x - hw, y, x + hw + 1, y + 1, dim(o.season === 'winter' ? '#c9d7e4' : '#9dbfa4', 0.4)); } });
      lay(0.38, W * 0.1, (k, x, r) => { const h = H * (0.28 + r * 0.16), by = H * 0.74; for (let y = Math.round(by - h); y < pt; y++) { const hw = Math.max(0, (y - (by - h)) * 0.4); R(x - hw, y, x + hw + 1, y + 1, dim(o.season === 'winter' && (y - (by - h)) < 3 ? '#f2f6fb' : '#5e8f69', 0.4)); } });
      lay(0.75, W * 0.42, (k, x, r) => { // 手前の木
        const tw = Math.max(2, Math.round(W * 0.045));
        R(x, 0, x + tw, pt + 1, dim('#7b5a43')); R(x, 0, x + 1, pt + 1, dim('#95715a'));
        const cy = H * (0.1 + r * 0.12), cr = W * (0.12 + r * 0.05);
        if (o.season !== 'winter') { D(x + tw / 2 - cr * 0.6, cy + cr * 0.3, cr * 0.8, dim(se.lf2)); D(x + tw / 2 + cr * 0.6, cy + cr * 0.2, cr * 0.85, dim(se.lf2)); D(x + tw / 2, cy, cr, dim(se.lf)); if (o.season === 'spring' && r > 0.6) for (let i = 0; i < 6; i++) P(x + tw / 2 + (hs(i, k) - 0.5) * cr * 1.6, cy + (hs(i + 5, k) - 0.5) * cr, dim(se.bl)); }
        else { L(x + tw / 2, cy + cr * 0.6, x + tw / 2 - cr * 0.8, cy - cr * 0.2, dim('#7b5a43')); L(x + tw / 2, cy + cr * 0.5, x + tw / 2 + cr * 0.9, cy - cr * 0.3, dim('#7b5a43')); }
      });
      if (dp < 0.6) lay(0.5, W * 0.9, (k, x) => { for (let i = 0; i < pt; i++) P(x + i * 0.45, i, '#fff6c8', 0.1 * (1 - dp)); });
      grass(pt, pb, o.season === 'winter' ? '#e9eff7' : '#b48a5c');
      lay(1, W * 0.07, (k, x, r) => { P(x, pt + 1 + Math.floor(r * (gy - pt)), dim(o.season === 'autumn' ? (r > 0.5 ? '#e0823e' : '#c9582f') : o.season === 'winter' ? '#d2ddec' : '#99704a')); });
      R(0, pt, W, pt + 1, dim(se.g2));
      lay(1, W * 0.55, (k, x, r) => { if (r < 0.5) return; P(x, pt - 1, dim('#fff4e6')); P(x - 1, pt - 2, dim('#e8574a')); P(x, pt - 2, dim('#e8574a')); P(x + 1, pt - 2, dim('#e8574a')); P(x, pt - 2, dim('#ffffff')); });
    } else if (th === 'hono') { // 川原の公園：遠くの町、橋、川、すべり台
      lay(0.06, W * 0.13, (k, x, r) => { const h = H * (0.06 + r * 0.12); R(x, H * 0.56 - h, x + W * 0.1, H * 0.57, dim('#c9d8e7', 0.4)); if (big) for (let i = 0; i < 3; i++) P(x + 2 + i * 3, H * 0.56 - h + 2, dim('#e8f0f8', 0.4)); });
      R(0, H * 0.44, W, H * 0.46, dim('#d67d5c', 0.4)); R(0, H * 0.43, W, H * 0.44, dim('#b85f45', 0.4));
      lay(0.2, W * 0.45, (k, x) => { R(x, H * 0.46, x + Math.max(2, W * 0.035), H * 0.58, dim('#c46a4e', 0.4)); });
      R(0, H * 0.56, W, H * 0.68, dim(o.season === 'winter' ? '#8fb6d6' : '#6fb4de', 0.35));
      for (let i = 0; i < (big ? 14 : 8); i++) { const y = H * 0.575 + hs(i, 7) * H * 0.09, x = ((hs(i, 3) * W * 2 - cam * 0.5 - t * W * 0.01 * (0.4 + hs(i, 9))) % (W * 2) + W * 2) % (W * 2) - W * 0.5; if (Math.floor(t / 300 + i) % 3) R(x, y, x + (big ? 3 : 2), y + 1, dim('#d8f1ff', 0.35)); }
      R(0, H * 0.68, W, pt, dim(se.g2, 0.3));
      grass(pt, pb, M('#d9ccad', se.g, 0.25));
      lay(1, W * 0.06, (k, x, r) => { P(x, pt + 1 + r * (pb - pt - 2), dim('#b9ab8e')); });
      lay(1, W * 1.3, (k, x, r) => { // すべり台 or ぶらんこ
        const h = Math.round(H * 0.24);
        if (r < 0.5) { R(x, pt - h, x + 1, pt, dim('#e8574a')); R(x + 3, pt - h, x + 4, pt, dim('#e8574a')); for (let y = pt - h + 2; y < pt; y += 2) R(x, y, x + 4, y + 1, dim('#f2c14e')); L(x + 4, pt - h, x + 4 + h * 0.9, pt - 1, dim('#56a8d8'), 0); L(x + 4, pt - h + 1, x + 4 + h * 0.9, pt, dim('#3f8cc0'), 0); }
        else { const w = Math.round(W * 0.16); L(x, pt, x + 2, pt - h, dim('#7f93b5')); L(x + w, pt, x + w - 2, pt - h, dim('#7f93b5')); R(x + 1, pt - h, x + w, pt - h + 1, dim('#7f93b5')); const sw = Math.sin(t / 500) * 2; L(x + w / 2, pt - h + 1, x + w / 2 + sw, pt - 3, dim('#9a8f86')); R(x + w / 2 - 2 + sw, pt - 3, x + w / 2 + 2 + sw, pt - 2, dim('#e8574a')); }
      });
    } else if (th === 'hosi') { // 図書館の広場：大きな図書館、街灯、石だたみ
      for (let x = 0; x < W; x++) { const u = (x + cam * 0.08) / W; const h = H * (0.52 + 0.04 * Math.sin(u * 3)); for (let y = Math.round(h); y < pt; y++) P(x, y, dim(se.g2, 0.4)); }
      const lx = W * 0.35 - cam * 0.1, lw = W * 2.4, top = H * 0.2, base = H * 0.72;
      R(lx, top, lx + lw, base, dim('#ece2cf', 0.4));
      for (let y = Math.round(top - H * 0.1); y < top; y++) { const k = (top - y) / (H * 0.1); R(lx + lw / 2 - lw * 0.28 * (1 - k), y, lx + lw / 2 + lw * 0.28 * (1 - k), y + 1, dim('#e2d6bf', 0.4)); }
      R(lx, top, lx + lw, top + 1, dim('#c9b89a', 0.4)); R(lx - 1, base - 2, lx + lw + 1, base, dim('#d6c9b0', 0.4));
      const col = Math.max(4, Math.round(W * 0.09));
      for (let x = lx + col / 2; x < lx + lw - 2; x += col) {
        R(x, top + 1, x + 2, base - 2, dim('#f8f3ea', 0.4)); R(x + 2, top + 1, x + 3, base - 2, dim('#d9cdb6', 0.4));
        R(x + 4, top + H * 0.12, x + col - 1, base - H * 0.12, dim(M('#6a7ca6', '#ffd98a', dp * 0.9), 0.1));
      }
      R(lx + lw / 2 - W * 0.05, base - H * 0.2, lx + lw / 2 + W * 0.05, base - 2, dim('#6d5140', 0.4));
      lay(0.6, W * 0.62, (k, x, r) => { const cr = W * 0.07; R(x - 1, H * 0.64, x + 1, H * 0.73, dim('#7b5a43')); D(x, H * 0.6, cr, dim(r > 0.5 ? se.lf : se.lf2)); if (o.season === 'spring' && r > 0.5) D(x - cr * 0.3, H * 0.58, cr * 0.5, dim(se.bl)); R(x - 3, H * 0.72, x + 3, H * 0.75, dim('#b8b2a6')); });
      grass(pt, pb, '#d9d3c6');
      const tile = Math.max(3, Math.round(W / 12));
      for (let x = ((-cam) % tile + tile) % tile; x < W; x += tile) R(x, pt, x + 1, pb, dim('#c4bcab'));
      for (let y = pt + tile - 1; y < pb; y += tile) R(0, y, W, y + 1, dim('#c4bcab'));
      lay(1, W * 0.85, (k, x) => { const h = Math.round(H * 0.34); R(x, pt - h, x + 1, pt + 1, dim('#4a4f66')); R(x - 1, pt - h - 2, x + 2, pt - h, dim(dp > 0.3 ? '#ffe7a3' : '#e9eef7')); if (dp > 0.3) D(x + 0.5, pt - h - 1, 3, '#ffe7a3', 0.25 * dp); });
    } else if (th === 'uta') { // 商店街：ならんだお店、日よけ、旗
      R(0, H * 0.1, W, pt, dim('#d7d0e2', 0.4));
      const cols = [['#f3d9c8', '#e8574a'], ['#e6e0f2', '#6aa9d8'], ['#f7ecc9', '#7fc47a'], ['#d9ecef', '#f59ac8'], ['#f5d1d8', '#f2c14e']];
      const sw = W * 0.62, off = cam * 0.8;
      for (let k = Math.floor((off - W) / sw); k * sw - off < W * 1.5; k++) {
        const x0 = k * sw - off, x1 = x0 + sw - 1, c = cols[Math.floor(hs(k, seed) * cols.length)];
        R(x0, H * 0.16, x1, pt, dim(c[0]));
        R(x0, H * 0.16, x1, H * 0.18, dim(M(c[0], INK, 0.2)));
        R(x0 + sw * 0.2, H * 0.22, x0 + sw * 0.7, H * 0.3, dim(c[1])); if (big) R(x0 + sw * 0.25, H * 0.25, x0 + sw * 0.65, H * 0.26, dim('#fffdf5'));
        const ay = H * 0.4, ah = Math.max(3, Math.round(H * 0.08));
        for (let x = Math.round(x0); x < x1; x++) for (let y = Math.round(ay); y < ay + ah + (x % 2); y++) P(x, y, dim(Math.floor((x - x0) / Math.max(2, W / 21)) % 2 ? '#fffdf5' : c[1]));
        R(x0 + 2, ay + ah + 2, x0 + sw * 0.62, pt - 1, dim(M('#6f7da0', '#ffd98a', 0.25 + dp * 0.7)));
        for (let i = 0; i < 4; i++) D(x0 + 4 + i * sw * 0.13, pt - 3, big ? 1.4 : 0.9, dim(['#f2c14e', '#e8574a', '#7fc47a', '#f59ac8'][i]));
        R(x0 + sw * 0.7, ay + ah + 1, x0 + sw * 0.9, pt, dim('#8a5a44'));
        R(x1, H * 0.16, x1 + 1, pt, dim(M(c[0], INK, 0.35)));
      }
      const fy = H * 0.07;
      for (let x = 0; x < W; x++) P(x, fy + Math.sin((x + off) / W * Math.PI * 3) * 1.2, dim('#9a8f86'));
      lay(0.8, W * 0.09, (k, x, r) => { const y = fy + Math.sin((x + off) / W * Math.PI * 3) * 1.2; const c = ['#e8574a', '#f2c14e', '#6aa9d8', '#7fc47a', '#f59ac8'][k % 5 < 0 ? -k % 5 : k % 5]; for (let i = 0; i < 3; i++) R(x - 1 + i * 0.5, y + i, x + 2 - i * 0.5, y + i + 1, dim(c)); });
      grass(pt, pb, '#d8a68a');
      const bw = Math.max(4, Math.round(W / 10));
      for (let y = pt, j = 0; y < pb; y += 2, j++) { R(0, y, W, y + 1, dim('#c78e72')); for (let x = ((-cam + j * bw / 2) % bw + bw) % bw; x < W; x += bw) P(x, y + 1, dim('#c78e72')); }
    } else { // hina：住宅地。家、生けがき、電柱と電線
      for (let x = 0; x < W; x++) { const u = (x + cam * 0.1) / W; const h = H * (0.44 + 0.05 * Math.sin(u * 2.4 + 1)); for (let y = Math.round(h); y < pt; y++) P(x, y, dim(se.g2, 0.45)); }
      const roofs = ['#c8594a', '#8a5a44', '#6f7f99', '#6c9a6a', '#b8644e'], walls = ['#fbf3e3', '#f3e6d0', '#e9eef3', '#fff6ec'];
      lay(0.55, W * 0.72, (k, x, r) => {
        const w = W * 0.5, h = H * 0.26, by = H * 0.72, x0 = x - w / 2;
        const rc = roofs[Math.floor(r * roofs.length)], wc = walls[Math.floor(hs(k, 99) * walls.length)];
        R(x0, by - h, x0 + w, by, dim(wc));
        for (let i = 0; i < H * 0.12; i++) R(x0 - 2 + i * 0.9, by - h - i, x0 + w + 2 - i * 0.9, by - h - i + 1, dim(o.season === 'winter' && i > H * 0.08 ? '#f4f8fc' : i === 0 ? M(rc, INK, 0.3) : rc));
        const ww = Math.max(3, w * 0.22), wy = by - h * 0.7;
        [x0 + w * 0.15, x0 + w * 0.6].forEach((wx) => { R(wx - 1, wy - 1, wx + ww + 1, wy + h * 0.36 + 1, dim('#8a5a44')); R(wx, wy, wx + ww, wy + h * 0.36, dim(M('#bfe3f2', '#ffd98a', dp))); });
      });
      R(0, H * 0.66, W, pt, dim(se.lf2, 0.25));
      lay(0.7, W * 0.05, (k, x, r) => D(x, H * 0.66, W * 0.03 + r * W * 0.01, dim(r > 0.6 && o.season === 'spring' ? se.bl : se.lf2, 0.25)));
      const poles = []; lay(0.85, W * 1.05, (k, x) => poles.push(x));
      poles.forEach((x) => { R(x, H * 0.06, x + 1, pt, dim('#9a8f86')); R(x - 2, H * 0.1, x + 3, H * 0.1 + 1, dim('#9a8f86')); });
      for (let i = 0; i + 1 < poles.length; i++) { const a = poles[i], c = poles[i + 1]; for (let x = Math.round(a); x <= c; x++) { const u = (x - a) / (c - a); P(x, H * 0.1 + Math.sin(u * Math.PI) * H * 0.06, dim('#5a5260'), 0.8); } }
      grass(pt, pb, '#a9a7af');
      R(0, pt + 1, W, pt + 2, dim('#f4f1ea'));
      if (big) lay(1, W * 1.4, (k, x) => { D(x, gy + 1, 2.2, dim('#8d8b93')); D(x, gy + 1, 1.2, dim('#9f9da5')); });
    }
    if (se.snow) { R(0, pt, W, pt + 1, dim('#ffffff', 0.3)); lay(1, W * 0.1, (k, x, r) => R(x, pt, x + 2 + r * 4, pt + 2, dim('#f6f9fd', 0.3))); }
    return { pt, pb, gy };
  }

  // 手前の草・ふち（歩くと速く流れる）
  function front(b, o, cam, dp) {
    const { P, R, W, H } = paint(b);
    const pb = Math.round(H * 0.94), se = SEA[o.season] || SEA.spring, seed = o.seed;
    const street = o.dest === 'uta' || o.dest === 'hosi' || o.dest === 'hina';
    const dim = (c) => M(c, '#2a2350', 0.3 * dp);
    R(0, pb, W, H, dim(street ? '#bdb3a6' : se.g2));
    if (street) R(0, pb, W, pb + 1, dim('#d8d0c4'));
    const off = cam * 1.25, sp = W * 0.11;
    for (let k = Math.floor((off - W) / sp); k * sp - off < W * 1.2; k++) {
      const x = k * sp - off + hs(k, seed + 5) * sp, r = hs(k, seed + 6);
      if (street) { if (r > 0.7) R(x, pb - 1, x + 2, pb, dim(se.g2)); continue; }
      const h = 2 + Math.floor(r * (W >= 60 ? 4 : 2));
      for (let i = 0; i < h; i++) { P(x, pb - i, dim(se.g2)); if (i < h - 1) P(x + 1, pb - i + 1, dim(se.g)); }
      if (r > 0.75 && o.season !== 'winter') P(x, pb - h, dim(r > 0.87 ? se.bl : '#ffffff'));
    }
  }

  // 季節の舞いもの（花びら・葉っぱ・雪）
  function weather(b, o, cam, t) {
    const { P, W, H } = paint(b);
    const s = o.season;
    if (s === 'summer') return;
    const n = W >= 60 ? 12 : 7;
    for (let k = 0; k < n; k++) {
      const sy = s === 'winter' ? 0.004 : 0.003, sx = s === 'winter' ? 0.001 : 0.004;
      const y = (k * 37 + t * sy * H * 0.05 * (1 + (k % 3) * 0.3)) % H;
      const x = (((k * 53 + Math.sin(t / 700 + k) * 3 - t * sx * W * 0.05 - cam * 0.9) % W) + W) % W;
      const c = s === 'winter' ? '#ffffff' : s === 'spring' ? (k % 2 ? '#ffc4d8' : '#ffe2ea') : (k % 2 ? '#e0823e' : '#c9582f');
      P(x, y, c, 0.9);
      if (s === 'autumn' && W >= 60) P(x + 1, y, c, 0.6);
    }
    if (o.dest === 'sora') for (let k = 0; k < 3; k++) { // 風のすじ
      const y = H * (0.2 + k * 0.17), x = W - ((t * W * 0.0006 * (1 + k * 0.4) + k * W * 0.7 + cam * 0.3) % (W * 2));
      for (let i = 0; i < W * 0.12; i++) P(x + i, y + Math.sin((x + i) / 5) * 0.8, '#ffffff', 0.35 * (1 - i / (W * 0.12)));
    }
  }

  // 形を変える：しゃがむ（ひざの段をつめる）・足ぶみ（片足を上げる）
  function squash(g, n) {
    const r0 = Math.round(g.h * 0.64), o = new PX.Bmp(g.w, g.h - n);
    for (let y = 0; y < o.h; y++) { const sy = y < r0 ? y : y + n; o.d.set(g.d.subarray(sy * g.w * 4, (sy + 1) * g.w * 4), y * g.w * 4); }
    return o;
  }
  function stepPose(g, ph) {
    const o = g.clone(), k = Math.max(2, Math.round(g.h * 0.13)), half = g.w >> 1;
    for (let y = g.h - k; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if ((x < half) !== (ph === 0)) continue;
      const i = (y * g.w + x) * 4, j = ((y - 1) * g.w + x) * 4;
      for (let c = 0; c < 4; c++) o.d[j + c] = g.d[i + c];
      if (y === g.h - 1) for (let c = 0; c < 4; c++) o.d[i + c] = 0;
    }
    return o;
  }

  /* ---------- おさんぽ ---------- */
  // o: { W, H, st, dest, season, seed, things, toddle, alone, grabby, likes(id), refuse(id), held, sprite(), hooks }
  function create(o) {
    const W = o.W, H = o.H, st = o.st;
    const pram = st === 1 && !o.toddle;
    const gy = Math.round(H * 0.87);
    const home = Math.round(W * (pram ? 0.36 : 0.34));
    const SPD = W * (o.toddle ? 0.17 : pram ? 0.22 : 0.26), RUN = W * 0.48, FLEE = W * 0.26;
    const REACH = W * 0.2, N = st === 1 ? 8 : 10;
    const gap = o.toddle ? 0.68 : 0.74;
    const hk = o.hooks || {};
    const call = (k, ...a) => (hk[k] ? hk[k](...a) : undefined);
    const things = o.things.map((id, i) => {
      const t = TI.get(id).t, th = TI.main(id);
      const x = Math.round(W * (0.98 + i * gap) + (hs(i, o.seed) - 0.5) * W * 0.12);
      return { id, i, th, kind: (t.yoru || 0) >= 2 ? 'dusk' : (KIND[th] || 'lie'), x, bx: x, y: 0, st: 'idle', liked: !!(o.likes && o.likes(id)), refuse: !!(o.refuse && o.refuse(id)), ph: hs(i, o.seed + 1) * 6 };
    });
    const len = Math.max(W * 3, (things.length ? things[things.length - 1].x : W) + W * 0.8 - home);
    const w = {
      W, H, st, pram, len, cam: 0, gx: home, hold: false, lock: false, pocket: [], mode: 'walk', t: 0, done: null,
      things, parts: [], still: 0, stepT: 0, jump: 0, moving: false, run: false, dusk: 0, holding: !pram, hand: null, said: {}, act: null, cur: null,
    };
    const her = () => w.cam + w.gx;
    // 物に「届く」基準の場所：ベビーカーは車体の前、家は その左に立つ
    const ref = (th) => her() + (pram ? (th.kind === 'float' && th.st === 'idle' ? W * 0.06 : W * 0.25) : (th.kind === 'give' && th.st === 'idle' ? W * 0.19 : 0));
    w.prog = () => Math.max(w.dusk, Math.min(1, w.cam / len));
    const full = () => w.pocket.length >= 3;
    const vis = (th) => th.kind !== 'dusk' || w.prog() > 0.58;
    const free = (th) => (th.st === 'idle' || th.st === 'rest' || th.st === 'out') && vis(th);
    const groundY = () => gy - 2;
    // 手の位置（ベビーカーはかごの中）
    const handPos = () => (pram ? { x: w.gx + 1, y: gy - 10 } : { x: w.gx + (st === 1 ? 3 : 5), y: gy - Math.round(TA.S[st].h * 0.42) });
    const thingPos = (th) => {
      const sx = th.x - w.cam;
      if (th.kind === 'float' && th.st === 'idle') return { x: sx, y: H * 0.3 + Math.sin(w.t * 1.7 + th.ph) * 2 - N / 2 };
      return { x: sx, y: groundY() - N / 2 + 1 };
    };
    const spark = (x, y, n, c) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = W * (0.04 + Math.random() * 0.08); w.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - W * 0.03, life: 0.7 + Math.random() * 0.5, age: -Math.random() * 0.15, c: c || '#fff3c4' }); } };
    const dust = (x, y, n) => { for (let i = 0; i < n; i++) w.parts.push({ k: 'dust', x: x + (Math.random() - 0.5) * 4, y, vx: (Math.random() - 0.5) * W * 0.12, vy: -W * (0.05 + Math.random() * 0.08), life: 0.5 + Math.random() * 0.3, age: 0, c: o.dest === 'hosi' ? '#b9b0a0' : '#a98563' }); };
    const note = (x, y) => w.parts.push({ k: 'note', x, y, vx: (Math.random() - 0.5) * W * 0.06, vy: -W * 0.09, life: 1.4, age: 0, c: ['#f59ac8', '#e8574a', '#9b6ae6'][Math.floor(Math.random() * 3)] });

    /* --- かかわる --- */
    function begin(th, forced) {
      w.cur = th; w.lock = true; w.forced = !!forced;
      const sx = th.x - w.cam;
      if (th.refuse && !th.refused && !forced) { th.refused = 1; w.mode = 'sulk'; w.sulk = 0; call('refuse', th.id); return; }
      if (th.kind === 'float' && th.st === 'idle') return act(th, 'catch', 1.0);
      if (th.kind === 'hide' && th.st === 'idle') { w.mode = 'wait'; w.waitT = 0; return; }
      if (th.kind === 'give' && th.st === 'idle') return pram ? act(th, 'give', 1.5) : go(sx - W * 0.19, 'give', 1.5);
      if (th.kind === 'tune' && th.st === 'idle') return pram ? act(th, 'dance', 1.6) : go(sx - W * 0.07, 'dance', 1.6);
      if (th.kind === 'glint' && th.st === 'idle') return pram ? act(th, 'lift', 0.7, 1) : go(sx - W * 0.06, 'dig', 0.9);
      return pram ? act(th, 'lift', 0.6) : go(sx - W * 0.06, 'pick', 0.5);
    }
    function go(tx, k, dur) { w.mode = 'go'; w.tx = clamp(tx, W * 0.1, W * 0.9); w.next = [k, dur]; }
    function act(th, k, dur, dig) {
      w.mode = 'act'; w.act = { k, dur, t: 0, th, dig: !!dig, from: thingPos(th) };
      if (k === 'give') call('sfx', 'hello');
      if (k === 'dance') call('tune', 1);
      if (k === 'catch') { call('face', 'wow', 900); call('sfx', 'whoosh'); }
      if (k === 'dig' || dig) { call('sfx', 'dig'); }
    }
    function collect(th) {
      if (th.st === 'taken') return;
      th.st = 'taken'; w.pocket.push(th.id);
      const hp = handPos();
      spark(hp.x, hp.y, 6, th.kind === 'dusk' ? '#c9b8ff' : '#fff3c4');
      call('face', 'joy', 1000); call('pick', th.id, hp);
    }
    function done() { // かかわり終わり → 手をつなぎなおす
      w.act = null; w.cur = null; w.jump = 0;
      if (!pram && Math.abs(w.gx - home) > 0.5) { w.mode = 'back'; return; }
      w.gx = home; w.mode = 'walk'; w.lock = false; w.forced = false; w.still = 0;
    }
    // ポケットから出して、道に置く
    w.drop = (i) => {
      if (w.mode !== 'walk' || w.lock) return null;
      const id = w.pocket[i]; if (!id) return null;
      w.pocket.splice(i, 1);
      const th = things.find((x) => x.id === id);
      th.st = 'left'; th.pop = 1; th.x = her() - W * (pram ? 0.02 : 0.14); th.refuse = false;
      dust(th.x - w.cam, groundY(), 3);
      return id;
    };
    w.finish = (why) => { if (w.done) return; w.done = why || 'end'; call('done', w.done); };
    // ひとりで行く（こども期のさいご）
    w.away = () => { w.mode = 'away'; w.holding = false; w.lock = true; };

    /* --- すすめる --- */
    w.update = (dt) => {
      dt = Math.min(0.05, dt); w.t += dt;
      // 物のようす
      for (const th of things) {
        const sx = th.x - w.cam;
        if (th.kind === 'float' && th.st === 'idle' && sx < W * 1.2) { th.x -= W * (w.moving ? 0.045 : 0.075) * dt; if (sx < -W * 0.25) th.st = 'gone'; }
        if (th.st === 'flee') { th.x += FLEE * dt; th.ft += dt; if (th.ft > 2.6) { th.st = 'rest'; call('sfx', 'hop'); } else if (Math.floor(th.ft * 3.2) !== th.fb) { th.fb = Math.floor(th.ft * 3.2); call('sfx', 'hop'); } }
        if (th.kind === 'tune' && th.st === 'idle' && Math.abs(sx - w.gx) < W * 0.6) {
          th.nt = (th.nt || 0) - dt;
          if (th.nt <= 0) { th.nt = 2.6; call('tune', clamp(1 - Math.abs(sx - w.gx) / (W * 0.6), 0.1, 0.8)); }
          if (Math.random() < dt * 1.6) note(sx + (Math.random() - 0.5) * 3, groundY() - N);
        }
        if (th.pop !== undefined && th.pop < 1) th.pop = Math.min(1, th.pop + dt * 2.6);
      }
      if (w.mode === 'walk') {
        const chase = things.some((th) => th.st === 'flee' && th.x - ref(th) > -W * 0.05 && th.x - ref(th) < W * 0.9);
        const moving = w.hold && !w.lock && w.cam < len;
        w.moving = moving; w.run = moving && chase;
        if (moving) {
          const v = chase ? RUN : SPD;
          w.cam = Math.min(len, w.cam + v * dt);
          const s0 = Math.floor(w.stepT * 2); w.stepT += dt * (chase ? 3.6 : pram ? 1.6 : 2.2) * (o.toddle ? 0.8 : 1); if (Math.floor(w.stepT * 2) !== s0) call('sfx', pram ? 'roll' : 'step');
          if (chase && Math.random() < dt * 8) dust(w.gx - 2, gy, 1);
          w.still = 0;
        } else w.still += dt;
        // にげる物
        for (const th of things) if (th.kind === 'hop' && th.st === 'idle' && moving && th.x - ref(th) < W * 0.42 && th.x - ref(th) > -W * 0.02) { th.st = 'flee'; th.ft = 0; th.fb = -1; call('face', 'wow', 800); }
        // 走ってつかまえる
        if (moving && !full()) { const th = things.find((x) => x.st === 'flee' && Math.abs(x.x - ref(x)) < W * 0.07); if (th) { act(th, pram ? 'lift' : 'snatch', pram ? 0.5 : 0.35); w.lock = true; call('sfx', 'hop'); return; } }
        // 好きな物のそばを通ると、ツブが自分から（こども期の後半）
        if (moving && o.grabby && !full()) {
          const th = things.find((x) => x.liked && free(x) && !x.grabbed && Math.abs(x.x - ref(x)) < W * 0.06);
          if (th) { th.grabbed = 1; call('grab', th.id); begin(th, true); return; }
        }
        // 止まったそばの物
        if (!w.lock && !moving && w.still > 0.18) {
          let best = null, bd = 1e9;
          for (const th of things) {
            if (!free(th)) continue;
            const d = Math.abs(th.x - ref(th)), r = th.kind === 'float' && th.st === 'idle' ? W * 0.16 : pram ? W * 0.15 : REACH;
            if (d < r && d < bd) { best = th; bd = d; }
          }
          if (best) {
            if (full()) { if (!w.said.full) { w.said.full = 1; call('full'); } }
            else { begin(best); return; }
          }
        }
        // 気づく・ふりかえる
        let bub = null;
        for (const th of things) {
          if (!th.liked || !free(th)) continue;
          const d = th.x - ref(th);
          if (d > -W * 0.12 && d < W * 0.5) { bub = th; if (!th.noticed) { th.noticed = 1; call('face', 'wow', 700); call('sfx', 'notice'); } }
          if (d < -W * 0.24 && !th.pouted && moving) { th.pouted = 1; call('pout', th.id); }
        }
        w.bubble = bub && !full() ? 1 : 0;
        if (o.alone && !w.aloneAsked && w.prog() > 0.3) { w.aloneAsked = 1; w.mode = 'letgo'; w.lock = true; w.bubble = 0; call('alone'); }
        if (w.cam >= len) w.finish('end');
      } else if (w.mode === 'go' || w.mode === 'back') {
        const tx = w.mode === 'go' ? w.tx : home, v = RUN * 0.8 * dt;
        const s0 = Math.floor(w.t * 7); if (Math.floor((w.t + dt) * 7) !== s0) call('sfx', 'step');
        if (Math.abs(tx - w.gx) <= v) {
          w.gx = tx;
          if (w.mode === 'go') act(w.cur, w.next[0], w.next[1]); else { w.mode = 'walk'; w.lock = false; w.forced = false; w.still = 0; }
        } else w.gx += Math.sign(tx - w.gx) * v;
      } else if (w.mode === 'wait') { // しげみの前で、じっと
        if (w.hold && !w.forced) { w.mode = 'walk'; w.lock = false; w.cur = null; return; }
        w.waitT += dt;
        if (w.waitT > 1.1) { act(w.cur, 'rustle', 0.6); call('sfx', 'rustle'); }
      } else if (w.mode === 'sulk') { // 「それは、いいや」
        if (w.hold) { w.mode = 'walk'; w.lock = false; w.cur = null; return; }
        w.sulk += dt;
        if (w.sulk > 2.4) { const th = w.cur; th.refuse = false; call('giveIn', th.id); begin(th, true); }
      } else if (w.mode === 'act') {
        const a = w.act; a.t += dt; const p = Math.min(1, a.t / a.dur), th = a.th;
        if (a.k === 'dance' && Math.floor(a.t * 5) !== Math.floor((a.t - dt) * 5)) note(w.gx + (Math.random() - 0.5) * 6, gy - TA.S[st].h);
        if (a.k === 'catch') w.jump = p > 0.7 && p < 0.95 ? (st === 1 ? 1 : 2) : 0;
        if (a.k === 'snatch') w.jump = p < 0.8 ? Math.round(Math.sin(p * Math.PI) * (st === 1 ? 2 : 3)) : 0;
        if ((a.k === 'dig' || a.dig) && Math.random() < dt * 14 && p < 0.6) dust(th.x - w.cam, groundY(), 1);
        if (a.k === 'give' && p > 0.62 && !a.faced) { a.faced = 1; call('face', 'joy', 900); }
        if (p >= 1) {
          if (a.k === 'rustle') { th.st = 'out'; th.pop = 0; th.x = th.bx + W * 0.06; w.act = null; call('sfx', 'hop'); begin(th, true); return; }
          collect(th); done();
        }
      } else if (w.mode === 'away') { // 走っていく
        w.gx += RUN * 0.9 * dt; w.stepT += dt * 3.6;
        for (const th of things) if (free(th) && Math.abs(th.x - her()) < W * 0.08) { th.st = 'gone'; spark(th.x - w.cam, groundY() - N / 2, 5); }
        const s0 = Math.floor((w.stepT - dt * 3.6) * 2); if (Math.floor(w.stepT * 2) !== s0) call('sfx', 'step');
        if (w.gx > W + 14) { w.mode = 'gone'; call('gone'); }
      }
      // 粒
      w.parts = w.parts.filter((q) => (q.age += dt) < q.life);
      for (const q of w.parts) if (q.age > 0) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === 'dust') q.vy += W * 0.3 * dt; }
    };

    /* --- 描く --- */
    const ico = (id) => TI.mini(id, N);
    function drawThing(b, th, t) {
      const { P, R, D, L } = paint(b);
      const sx = th.x - w.cam, bx = th.bx - w.cam;
      if ((sx < -W * 0.3 || sx > W * 1.3) && (bx < -W * 0.3 || bx > W * 1.3)) return;
      const beingDone = w.act && w.act.th === th ? w.act : null;
      const g = groundY(), dp = sstep(0.55, 1, w.prog());
      const dim = (c) => M(c, '#2a2350', 0.3 * dp);
      if (th.kind === 'give') { // 小さな家と、窓（物がなくなっても、家はのこる）
        const hw = Math.round(W * 0.1), hh = Math.round(H * (st === 1 ? 0.3 : 0.28)), c = Math.round(bx), x0 = c - hw, x1 = c + hw, y1 = Math.round(H * 0.77), y0 = y1 - hh;
        R(x0, y0, x1, y1, dim('#fbf1dd'));
        R(x0, y1 - 1, x1, y1, dim('#d8c4a0'));
        const rh = Math.round(hh * 0.45);
        for (let i = 0; i <= rh; i++) R(x0 - 2 + i * (hw + 2) / rh, y0 - i, x1 + 2 - i * (hw + 2) / rh, y0 - i + 1, dim(o.season === 'winter' && i > rh * 0.5 ? '#f4f8fc' : i === 0 ? '#9c4336' : '#c8594a'));
        const wx0 = Math.round(c - hw * 0.55), wx1 = Math.round(c + hw * 0.55), wy0 = y0 + Math.round(hh * 0.18), wy1 = y0 + Math.round(hh * 0.62);
        const open = beingDone ? clamp(beingDone.t / beingDone.dur / 0.3, 0, 1) : th.st === 'taken' ? 0 : 0;
        R(wx0 - 1, wy0 - 1, wx1 + 1, wy1 + 1, dim('#8a5a44'));
        R(wx0, wy0, wx1, wy1, open > 0 ? M('#ffe7a3', '#6b4a3a', open * 0.5) : M('#ffe7a3', '#ffd07a', dp));
        if (!open) {
          if (th.st === 'idle') { const q = (t / 1600 + th.ph) % 5; if (q < 1) { const cx = wx0 + Math.floor(q * (wx1 - wx0)); R(cx, wy0 + 1, cx + 2, wy1, '#e3b56f'); } }
          R(Math.round((wx0 + wx1) / 2), wy0, Math.round((wx0 + wx1) / 2) + 1, wy1, '#8a5a44');
        }
        R(x1 - Math.max(2, hw * 0.5), y1 - Math.round(hh * 0.45), x1 - 1, y1 - 1, dim('#b07a55'));
        if (beingDone && beingDone.k === 'give') { // 窓から手がのびる
          const p = beingDone.t / beingDone.dur;
          const hp = handPos(), wxm = (wx0 + wx1) / 2, wym = (wy0 + wy1) / 2;
          const k = clamp((p - 0.3) / 0.3, 0, 1), k2 = clamp((p - 0.6) / 0.4, 0, 1);
          const ex = wxm + (hp.x - wxm) * 0.35 * k, ey = wym + (hp.y - wym) * 0.35 * k;
          if (k > 0) { L(wxm, wym, ex, ey, '#8f6aa8', st === 1 ? 0.8 : 1.2); D(ex, ey, st === 1 ? 0.9 : 1.3, '#ffe3cf'); }
          if (k > 0 && k2 < 1) { const ix = ex + (hp.x - ex) * ease(k2), iy = ey + (hp.y - ey) * ease(k2) - Math.sin(k2 * Math.PI) * 3; b.blit(ico(th.id), Math.round(ix - N / 2), Math.round(iy - N / 2)); }
          return;
        }
        if (th.st === 'idle' || th.st === 'taken' || th.st === 'gone') return;
      }
      if (th.kind === 'hide') { // しげみ（物が出たあとも、のこる）
        const shake = beingDone && beingDone.k === 'rustle' ? (Math.floor(t / 60) % 2 ? 1 : -1) : (th.st === 'idle' && Math.floor(t / 90) % 40 === Math.floor(th.ph * 6) ? 1 : 0);
        const cx = Math.round(bx) + shake, r = W * (st === 1 ? 0.075 : 0.065), cy = g - r * 0.35;
        const se = SEA[o.season] || SEA.spring;
        if (w.mode === 'wait' && w.cur === th && Math.floor(t / 400) % 2) P(cx + r * 0.8, cy - r * 1.1, '#fff6c8');
        D(cx - r * 0.7, cy + r * 0.2, r * 0.75, dim(se.lf2)); D(cx + r * 0.7, cy + r * 0.25, r * 0.7, dim(se.lf2)); D(cx, cy - r * 0.1, r * 0.9, dim(se.lf));
        P(cx - r * 0.3, cy - r * 0.5, M(se.g, '#ffffff', 0.3)); if (o.season === 'spring' || o.season === 'summer') { P(cx + r * 0.4, cy - r * 0.2, se.bl); P(cx - r * 0.6, cy + r * 0.3, se.bl); }
        if (th.st === 'idle' || th.st === 'taken' || th.st === 'gone') return;
      }
      if (th.st === 'taken' || th.st === 'gone') return;
      if (th.kind === 'glint' && th.st === 'idle' && !(beingDone && beingDone.t / beingDone.dur > 0.5)) { // 土のもり上がりと、ときどきの光
        R(sx - 2, g + 1, sx + 3, g + 2, '#a98563'); R(sx - 1, g, sx + 2, g + 1, '#bf9a72');
        const tw = (t / 1000 + th.ph) % 1.8;
        if (tw < 0.28) { const a = 1 - Math.abs(tw - 0.14) / 0.14; P(sx, g - 1, '#ffffff', a); if (st >= 2) { P(sx - 1, g - 1, '#fff6c8', a * 0.7); P(sx + 1, g - 1, '#fff6c8', a * 0.7); P(sx, g - 2, '#fff6c8', a * 0.7); } }
        else if (Math.floor(t / 400 + th.ph) % 4 === 0) P(sx, g, '#fff6c8', 0.5);
        return;
      }
      let x = sx, y = g - N / 2 + 1, alpha = 1;
      if (th.kind === 'hide' && th.pop !== undefined && th.pop < 1) { const p = th.pop; x = bx + (sx - bx) * p; y -= Math.sin(p * Math.PI) * N; }
      if (th.kind === 'float' && th.st === 'idle') {
        const p = thingPos(th); x = p.x; y = p.y;
        for (let i = 0; i < 3; i++) { const a = t / 300 + i * 2.1 + th.ph; P(x + Math.cos(a) * (N * 0.8), y + Math.sin(a) * (N * 0.5), '#ffffff', 0.5); }
      }
      if (th.st === 'flee') y -= Math.abs(Math.sin(th.ft * 10)) * H * 0.08;
      if (th.kind === 'hop' && th.st === 'idle' && Math.floor(t / 150 + th.ph) % 12 === 0) y -= 1;
      if (th.kind === 'tune' && th.st === 'idle') { R(x - N * 0.6, g - 1, x + N * 0.6, g + 1, '#a8774f'); R(x - N * 0.6, g - 2, x + N * 0.6, g - 1, '#c79466'); y -= 2; }
      if (th.kind === 'dusk') {
        alpha = clamp((w.prog() - 0.58) / 0.1, 0, 1);
        for (let r = N; r >= 2; r -= 2) D(x, y, r * 0.8, '#b9a4ff', 0.06 * alpha);
        y += Math.sin(t / 400 + th.ph);
      }
      if (beingDone && beingDone.k !== 'dance') { // 手もとへ
        const p = ease(clamp(beingDone.t / beingDone.dur, 0, 1)), f = beingDone.from, hp = handPos();
        const k = beingDone.k, lift = k === 'lift' || k === 'catch';
        if (lift || k === 'dig' || k === 'pick') {
          const q = k === 'dig' || beingDone.dig ? clamp((p - 0.45) / 0.55, 0, 1) : k === 'pick' ? clamp((p - 0.5) / 0.5, 0, 1) : p;
          x = f.x + (hp.x - f.x) * q; y = f.y + (hp.y - f.y) * q - (lift ? Math.sin(q * Math.PI) * H * 0.12 : 0);
        }
      }
      if (alpha <= 0) return;
      if (th.st !== 'idle' || th.kind !== 'float') R(x - N * 0.35, g + 1, x + N * 0.35, g + 2, '#000000', 0.12);
      const im = ico(th.id);
      if (alpha >= 1) b.blit(im, Math.round(x - N / 2), Math.round(y - N / 2));
      else for (let yy = 0; yy < im.h; yy++) for (let xx = 0; xx < im.w; xx++) { const c = im.get(xx, yy); if (c) b.put(Math.round(x - N / 2) + xx, Math.round(y - N / 2) + yy, [c[0], c[1], c[2]], alpha); }
    }

    function drawPram(b, cx, g, bounce) {
      const { R, D, L, P } = paint(b);
      const Lx = cx - 7, Rx = cx + 7, top = gy - 8, bot = gy - 3;
      L(Lx, top, -1, top - 8, '#5d4a62'); L(Lx, top + 1, -1, top - 7, '#6d5a70');
      D(0.5, top - 7.2, 1.6, INK); D(0.5, top - 7.2, 1.1, '#ffe3cf');
      b.blit(g, cx - 5, gy - 17 - bounce);
      for (let y = top - 7; y <= top; y++) for (let x = Lx - 1; x <= cx - 2; x++) {
        const dx = x - (cx - 2), dy = y - top, d = dx * dx + dy * dy;
        if (d <= 49 && x <= cx - 2) P(x, y, d > 36 ? '#c9738b' : (dx + dy) % 3 === 0 ? '#f7c9d4' : '#f4b0c2');
      }
      for (let y = top; y <= bot; y++) for (let x = Lx; x <= Rx; x++) {
        if (y === bot && (x === Lx || x === Rx)) continue;
        P(x, y, y === top ? '#fff4f6' : y === bot ? '#c9738b' : x === Lx || x === Rx ? '#d98ea3' : y === top + 2 ? '#fbd6df' : '#f5b3c2');
      }
      R(Lx + 2, bot + 1, Rx - 1, bot + 2, '#6d5a70');
      const spin = Math.floor(w.stepT * 4) % 2;
      for (const wx of [Lx + 3, Rx - 3]) { D(wx + 0.5, gy - 0.5, 1.9, '#3f3246'); P(wx + (spin ? 1 : 0), gy - 1, '#c9bcd4'); P(wx + (spin ? 0 : 1), gy, '#8f829a'); }
    }

    // あなたの腕：画面の上から、ツブの手まで（袖・袖口・手）
    function drawArm(b, hx, hy, open, part) {
      const sx = hx - W * 0.2, sy = -3, n = Math.max(4, Math.round(hy - sy));
      const r0 = st === 1 ? 1.5 : 3.6, r1 = st === 1 ? 1 : 2;
      if (part !== 'hand') for (let i = 0; i <= n - 1; i++) {
        const k = i / n, cx = sx + (hx - sx) * k, hw = r0 + (r1 - r0) * k, y = sy + i;
        const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw), cuff = i >= n - (st === 1 ? 2 : 3);
        for (let x = x0; x <= x1; x++) {
          const base = cuff ? '#f4ecdc' : (x - x0) <= (x1 - x0) * 0.3 ? '#a9bbd6' : '#8a9dbf';
          b.put(x, y, x === x0 || x === x1 ? M(base, INK, 0.55) : base);
        }
        if (!cuff && i % 5 === 2) b.put(Math.round(cx + hw * 0.2), y, '#7b8db0');
      }
      if (part === 'sleeve') return;
      const { D } = paint(b), hr = r1 + 0.2;
      D(hx, hy, hr + 1, INK); D(hx, hy, hr, '#ffe3cf');
      b.put(Math.round(hx + (open ? 1 : 0)), Math.round(hy + hr - 0.5), '#f3bea3');
      if (open) b.put(Math.round(hx + hr), Math.round(hy), '#ffe3cf');
    }

    function bubble(b, x, y) {
      const rows = st === 1 ? ['###', '#r#', '#r#', '###', '#r#', '###'] : ['#####', '##r##', '##r##', '##r##', '#####', '##r##', '#####'];
      rows.forEach((r, j) => [...r].forEach((c, i) => b.put(x + i, y + j, c === 'r' ? '#e8574a' : '#fffdf5')));
      for (let j = -1; j <= rows.length; j++) { b.put(x - 1, y + j, INK); b.put(x + rows[0].length, y + j, INK); }
      for (let i = 0; i < rows[0].length; i++) { b.put(x + i, y - 1, INK); b.put(x + i, y + rows.length, INK); }
    }

    // 全体を描く。sprite(face) はアプリから（顔はアプリが決める）
    w.draw = (t, sprite) => {
      const b = new PX.Bmp(W, H);
      const dp = sstep(0.55, 1, w.prog());
      const so = { dest: o.dest, season: o.season, seed: o.seed };
      scene(b, so, w.cam, dp, t);
      for (const th of things) if (!(w.act && w.act.th === th && w.act.k !== 'dance' && w.act.k !== 'give' && w.act.k !== 'rustle')) drawThing(b, th, t);
      // ツブ
      const a = w.act ? w.act.k : '';
      const walking = w.moving || w.mode === 'go' || w.mode === 'back' || w.mode === 'away';
      const ph = Math.floor(w.mode === 'go' || w.mode === 'back' ? w.t * 7 : w.stepT * 2) % 2;
      let g = sprite();
      let flip = false, bob = 0;
      const crouch = a === 'pick' || a === 'dig' || w.mode === 'wait';
      if (crouch && !pram) g = squash(g, st === 1 ? 1 : 2);
      else if (walking && !pram) { g = stepPose(g, ph); bob = ph; }
      if (a === 'dance') { flip = Math.floor(t / 260) % 2 === 1; bob = Math.floor(t / 130) % 2; }
      if (o.toddle && walking) bob += Math.floor(t / 330) % 3 === 0 ? 1 : 0;
      let pos, arm = null;
      if (pram) {
        const bnc = (w.moving ? ph : 0) + w.jump + (a === 'dance' ? Math.floor(t / 150) % 2 : 0);
        drawPram(b, Math.round(w.gx), g, bnc);
        pos = { x: Math.round(w.gx) - 5, y: gy - 17 - bnc, w: g.w, h: g.h, flip: false };
      } else {
        // 腕（つないだ手）は からだの うしろ。手だけ 手前に
        const x = Math.round(w.gx - g.w / 2), y = gy - g.h - bob - w.jump;
        const near = Math.abs(w.gx - home) < 1;
        const holding = w.holding && w.mode !== 'gone' && w.mode !== 'away' && (near || w.mode === 'walk');
        if (holding) { const an = TA.S[st].anchor.hand; w.hand = { x: x + g.w - 1 - (an[0] + 1) - 1, y: y + an[1] + 1 }; }
        const h = w.hand || { x: home - 6, y: gy - 10 };
        arm = holding ? [h.x, h.y, false] : [h.x - 1, h.y + 1, true];
        drawArm(b, arm[0], arm[1], arm[2], 'sleeve');
        if (w.mode !== 'gone') {
          b.blit(g, x, y, flip);
          pos = { x, y, w: g.w, h: g.h, flip };
          if (o.held) { const an = TA.S[st].anchor.hand, n = st === 1 ? 5 : 7, m = TI.mini(o.held, n); b.blit(m, x + (flip ? g.w - 1 - an[0] - 2 : an[0] + 1) - (n >> 1) + 1, y + an[1] + 1 - (n >> 1)); }
        }
        drawArm(b, arm[0], arm[1], arm[2], 'hand');
      }
      if (w.bubble && pos && w.mode === 'walk') bubble(b, pos.x + pos.w - 2, pos.y - (st === 1 ? 7 : 9) + (Math.floor(t / 300) % 2));
      for (const th of things) if (w.act && w.act.th === th && (w.act.k === 'lift' || w.act.k === 'catch' || w.act.k === 'pick' || w.act.k === 'dig' || w.act.k === 'snatch')) drawThing(b, th, t);
      // 粒
      for (const q of w.parts) {
        if (q.age < 0) continue;
        const al = 1 - q.age / q.life;
        if (q.k === 'note') { const rows = W >= 60 ? NOTE : NOTE_S; rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') b.put(Math.round(q.x) + i, Math.round(q.y) + j, q.c, al); })); }
        else b.put(Math.round(q.x), Math.round(q.y), q.c, q.k === 'spark' ? (Math.floor(q.age * 12) % 3 ? al : 0) : al);
      }
      front(b, so, w.cam, dp);
      weather(b, so, w.cam, t);
      // 夕ぐれの色
      if (dp > 0) { const d = b.d, k = 0.16 * dp; for (let i = 0; i < d.length; i += 4) { d[i] = d[i] * (1 - k) + 255 * k * 0.9; d[i + 1] = d[i + 1] * (1 - k * 1.3) + 150 * k * 0.6; d[i + 2] = d[i + 2] * (1 - k * 1.1) + 120 * k * 0.5; } }
      return { b, pos };
    };
    return w;
  }

  G.TW = { create, PLACE, KIND };
})(window);
