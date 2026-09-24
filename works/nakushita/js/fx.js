/* ナクシタ堂 — 仕掛け（文字が消える・色の中の番号・トースト） */
window.NFX = (() => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- 払った文字を、ページじゅうから消す ----------
     消えた文字は「穴」になる（.kake）。animate=true のときは、落ちてから穴になる。 */
  const SKIP = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SVG', 'CANVAS']);
  function holes(root, kana, animate) {
    if (!kana || !kana.length) return 0;
    const set = new Set(kana);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        let p = n.parentNode;
        while (p && p !== root.parentNode) {
          if (p.nodeType === 1 && (SKIP.has(p.nodeName.toUpperCase()) || p.hasAttribute('data-keep') || p.classList.contains('kfall'))) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        for (const ch of n.nodeValue) if (set.has(ch)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });
    const list = [];
    while (walker.nextNode()) list.push(walker.currentNode);
    let count = 0;
    list.forEach((node) => {
      const frag = document.createDocumentFragment();
      let buf = '';
      for (const ch of node.nodeValue) {
        if (set.has(ch)) {
          if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; }
          const s = document.createElement('span');
          if (animate) {
            s.className = 'kfall'; s.textContent = ch;
            s.style.animationDelay = (Math.random() * 500) + 'ms';
            setTimeout(() => { s.className = 'kake'; s.textContent = ''; s.style.animationDelay = ''; }, 1700);
          } else s.className = 'kake';
          s.setAttribute('aria-hidden', 'true');
          frag.appendChild(s); count++;
        } else buf += ch;
      }
      if (buf) frag.appendChild(document.createTextNode(buf));
      node.parentNode.replaceChild(frag, node);
    });
    return count;
  }
  const holeText = (s, kana) => { let o = s; (kana || []).forEach(k => { o = o.split(k).join('　'); }); return o; };

  /* ---------- 虹の写真（色の中の番号） ----------
     色があるうちは、色とりどりの点にまぎれて見えない。
     色を払うと、点の明るさだけが残り、番号が浮かぶ。 */
  const plateCache = {};
  function plate(canvas, code, gray) {
    const W = 400, H = 300;
    canvas.width = W; canvas.height = H;
    const key = code + (gray ? ':g' : ':c');
    if (!plateCache[key]) plateCache[key] = makePlate(W, H, code, gray);
    canvas.getContext('2d').drawImage(plateCache[key], 0, 0);
  }
  function makePlate(W, H, code, gray) {
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const c = out.getContext('2d');
    /* 型紙 */
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const mc = m.getContext('2d');
    mc.fillStyle = '#000'; mc.font = '800 140px "M PLUS Rounded 1c", sans-serif';
    mc.textAlign = 'center'; mc.textBaseline = 'middle';
    mc.lineWidth = 12; mc.lineJoin = 'round'; mc.strokeStyle = '#000';
    const chars = String(code).split(''), step = W / (chars.length + 0.4);
    chars.forEach((ch, i) => {
      const x = step * (i + 0.7);
      mc.fillText(ch, x, H / 2 + 6);
      mc.strokeText(ch, x, H / 2 + 6);
    });
    const mask = mc.getImageData(0, 0, W, H).data;
    const inside = (x, y) => { x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0)); return mask[(y * W + x) * 4 + 3] > 100; };
    /* 決まった並び（毎回同じ写真になるように） */
    let seed = 20160614;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    c.fillStyle = gray ? '#2A2A2A' : '#FFFDF6'; c.fillRect(0, 0, W, H);
    /* 点を詰める（近いものだけ調べる） */
    const CELL = 17, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
    const grid = Array.from({ length: GW * GH }, () => []);
    const dots = [];
    for (let tries = 0; tries < 20000 && dots.length < 2600; tries++) {
      const r = 2.4 + rnd() * 5.2, x = r + rnd() * (W - 2 * r), y = r + rnd() * (H - 2 * r);
      const gx = (x / CELL) | 0, gy = (y / CELL) | 0;
      let ok = true;
      for (let yy = Math.max(0, gy - 1); ok && yy <= Math.min(GH - 1, gy + 1); yy++) {
        for (let xx = Math.max(0, gx - 1); xx <= Math.min(GW - 1, gx + 1); xx++) {
          for (const d of grid[yy * GW + xx]) { const dx = d.x - x, dy = d.y - y; if (dx * dx + dy * dy < (d.r + r + 1.2) ** 2) { ok = false; break; } }
          if (!ok) break;
        }
      }
      if (ok) { const d = { x, y, r }; dots.push(d); grid[gy * GW + gx].push(d); }
    }
    dots.forEach((d) => {
      const inn = inside(d.x, d.y);
      let fill;
      if (gray) {
        const v = inn ? 215 + rnd() * 30 : 58 + rnd() * 34;
        fill = 'rgb(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ')';
      } else {
        const h = rnd() * 360, s = 55 + rnd() * 40, l = 50 + (rnd() - 0.5) * 22 + (inn ? 2 : 0);
        fill = 'hsl(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%)';
      }
      c.beginPath(); c.arc(d.x, d.y, d.r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    });
    return out;
  }

  /* ---------- トースト ---------- */
  function toast(html, ms) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = html;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms || 3600);
  }

  /* ---------- 星 ---------- */
  function stars(v) {
    if (!v) return '<span class="stars">－－－－－</span>';
    const n = Math.round(v);
    return '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>';
  }

  /* ---------- たぬきのスタンプ ---------- */
  const TANUKI = '<svg class="tanuki" viewBox="0 0 60 60" aria-label="たぬきのスタンプ"><circle cx="30" cy="30" r="27" fill="none" stroke="#C41E17" stroke-width="3"/>'
    + '<ellipse cx="30" cy="34" rx="15" ry="13" fill="#C41E17" opacity=".85"/><circle cx="19" cy="20" r="6" fill="#C41E17" opacity=".85"/><circle cx="41" cy="20" r="6" fill="#C41E17" opacity=".85"/>'
    + '<ellipse cx="24" cy="32" rx="5" ry="4" fill="#fff"/><ellipse cx="36" cy="32" rx="5" ry="4" fill="#fff"/><circle cx="24" cy="32" r="2" fill="#C41E17"/><circle cx="36" cy="32" r="2" fill="#C41E17"/><ellipse cx="30" cy="40" rx="3" ry="2" fill="#fff"/></svg>';

  return { sleep, esc, holes, holeText, plate, toast, stars, TANUKI };
})();
