/* 六夜の賭場 — 見た目の仕掛け（煙・賽・鼠・転換幕） */
window.FX = (() => {

  /* rAFが止まる環境でも進むフレーム */
  const frame = (cb) => {
    let done = false;
    const go = () => { if (done) return; done = true; cb(); };
    requestAnimationFrame(go); setTimeout(go, 50);
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------- 煙 ---------- */
  function smoke(cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, parts = [];
    const resize = () => {
      w = cv.width = Math.floor(innerWidth * Math.min(devicePixelRatio || 1, 1.5));
      h = cv.height = Math.floor(innerHeight * Math.min(devicePixelRatio || 1, 1.5));
    };
    const make = () => ({
      x: Math.random() * w,
      y: h * (0.55 + Math.random() * 0.6),
      r: (36 + Math.random() * 86) * (w / 1400),
      a: 0.012 + Math.random() * 0.03,
      vx: (Math.random() - 0.5) * 0.19,
      vy: -(0.09 + Math.random() * 0.2),
      t: Math.random() * 6.28
    });
    resize();
    parts = Array.from({ length: 26 }, make);
    addEventListener('resize', resize);
    let run = true;
    const tick = () => {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.t += 0.006;
        p.x += p.vx + Math.sin(p.t) * 0.26;
        p.y += p.vy;
        if (p.y + p.r < -20) Object.assign(p, make(), { y: h + p.r });
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(226,214,190,' + p.a + ')');
        g.addColorStop(0.55, 'rgba(210,196,168,' + (p.a * 0.42) + ')');
        g.addColorStop(1, 'rgba(200,186,160,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    tick();
    return { stop() { run = false; } };
  }

  /* ---------- 賽 ---------- */
  const PIPS = {
    1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]
  };
  function die(v) {
    const on = PIPS[v] || [];
    let s = '';
    for (let i = 1; i <= 9; i++) {
      s += on.includes(i) ? '<u class="' + (v === 1 ? 'r' : '') + '"></u>' : '<span></span>';
    }
    return '<div class="d">' + s + '</div>';
  }

  /* ---------- 鼠 ---------- */
  function mouse(col) {
    return '<svg viewBox="0 0 26 18" width="22" height="16" aria-hidden="true">'
      + '<ellipse cx="12" cy="11" rx="8.5" ry="5" fill="' + col + '"/>'
      + '<circle cx="20" cy="9" r="4" fill="' + col + '"/>'
      + '<circle cx="18.5" cy="5.5" r="2.6" fill="' + col + '" opacity=".8"/>'
      + '<circle cx="22.3" cy="8.4" r=".9" fill="#1B1714"/>'
      + '<path d="M4 11q-4 1-3 5" stroke="' + col + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>'
      + '</svg>';
  }

  /* ---------- 転換幕 ---------- */
  async function maku(text, hold) {
    const el = document.getElementById('maku'), t = document.getElementById('maku-t');
    if (!el) return;
    t.textContent = text || '';
    el.classList.add('on');
    if (window.TSND && TSND.ready()) TSND.hyoshigi(text ? 2 : 1);
    await sleep(hold || 1500);
    el.classList.remove('on');
    await sleep(420);
  }

  /* ---------- 文字をゆっくり出す ---------- */
  function kataru(host, lines, opt) {
    opt = opt || {};
    const step = opt.step || 340;
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'kata';
    host.appendChild(wrap);
    let d = 0;
    lines.forEach((l) => {
      const p = document.createElement('p');
      if (typeof l === 'string') {
        if (!l) { p.className = 'gap'; } else { p.textContent = l; }
      } else if (l.w) {
        p.className = 'who';
        p.innerHTML = '<b>' + esc(l.w) + '</b><span>' + esc(l.t) + '</span>';
      } else {
        p.textContent = l.t;
      }
      p.style.animationDelay = d + 'ms';
      d += (p.className === 'gap') ? 90 : step;
      wrap.appendChild(p);
    });
    return d;
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- 表を組む ---------- */
  function table(cols, rows, mark) {
    let s = '<div class="scroll"><table class="cho-table"><thead><tr>';
    cols.forEach(c => { s += '<th>' + esc(c) + '</th>'; });
    s += '</tr></thead><tbody>';
    rows.forEach((r, i) => {
      if (r && r.bar) { s += '<tr class="bar"><td colspan="' + cols.length + '">' + esc(r.bar) + '</td></tr>'; return; }
      s += '<tr>';
      r.forEach((v, j) => {
        const cls = mark ? (mark(v, j, i, r) || '') : '';
        s += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(v) + '</td>';
      });
      s += '</tr>';
    });
    return s + '</tbody></table></div>';
  }

  const KAN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
  const kan = (n) => KAN[n] != null ? KAN[n] : String(n);

  return { frame, sleep, smoke, die, mouse, maku, kataru, table, esc, kan };
})();
