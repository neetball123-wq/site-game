/* 霞野線アーカイブ — 終章：帰り道（車窓のアニメーション）と起動 */
(() => {
  'use strict';
  const { $, state, save, routes, leave, go, reduced, ymd, hm, esc } = K;

  const LINES = now => [
    [1, '23:09。月見野、発車。'],
    [5, '警笛が、ひとつ鳴った。'],
    [9.5, '窓の外を、汐入の灯りが流れていく。'],
    [14, '「ほんとうに、海まで行くの？」'],
    [18, '「ああ。終点は灘浜。海のすぐそばだ」'],
    [23, '運転台のうしろで、ミナトは祖父の背中を見ていた。写真でしか知らなかった背中。'],
    [29, '「おじいちゃん。わたし、39年ぶんの話があるの」'],
    [34, '「……そうか。じゃあ、ゆっくり走らんとな」'],
    [39.5, '空が、少しずつ白んでいく。'],
    [45, '灘浜、終点です。'],
    [50, `ホームの時計は、${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${hm(now)} を指していた。`],
    [55.5, '女の子は朝の海を見て、少しだけ笑った。「ありがとう」'],
    [61, '振り返ると、女の子はもう、どこにもいなかった。'],
    [66, '148D、灘浜着。乗務員 K-0731、乗務終了。']
  ];
  const FINAL_AT = 71;

  let raf = 0, timers = [];
  function clear() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = []; }

  function scene(cv, getT) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0;
    const V = 300;
    const stars = Array.from({ length: 140 }, () => [Math.random(), Math.random() * 0.55, Math.random() * 1.3 + 0.3]);
    const plats = [[10.5, '汐入', 'しおいり'], [25.5, '桜坂', 'さくらざか'], [32.5, '塩田', 'えんでん'], [39, '港町', 'みなとまち']];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener('resize', resize);
    // 42秒から47秒で減速して停車
    const posAt = t => (t < 42 ? V * t : t < 47 ? V * 42 + V * ((t - 42) - ((t - 42) ** 2) / 10) : V * 42 + V * 2.5);
    const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
    function platform(x, name, kana) {
      const y = H * 0.7, len = 620;
      ctx.fillStyle = '#2B2A2E'; ctx.fillRect(x, y, len, 18);
      ctx.fillStyle = '#4A4850'; ctx.fillRect(x, y, len, 3);
      for (let i = 0; i < 4; i++) {
        const lx = x + 70 + i * 160;
        ctx.fillStyle = '#1E1D22'; ctx.fillRect(lx - 2, y - 90, 4, 90);
        const g = ctx.createRadialGradient(lx, y - 92, 0, lx, y - 92, 60);
        g.addColorStop(0, 'rgba(255,221,150,.55)'); g.addColorStop(1, 'rgba(255,221,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, y - 92, 60, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#FFE6B0'; ctx.beginPath(); ctx.arc(lx, y - 92, 4, 0, 6.3); ctx.fill();
      }
      const sx = x + len / 2 - 70;
      ctx.fillStyle = '#F4F1E8'; ctx.fillRect(sx, y - 70, 140, 50);
      ctx.fillStyle = '#2F5D8A'; ctx.fillRect(sx, y - 34, 140, 8);
      ctx.fillStyle = '#1E1D22'; ctx.textAlign = 'center';
      ctx.font = '700 22px "Zen Maru Gothic", sans-serif'; ctx.fillText(name, sx + 70, y - 42);
      ctx.font = '10px "BIZ UDPGothic", sans-serif'; ctx.fillText(kana, sx + 70, y - 60);
      ctx.fillRect(sx + 20, y - 20, 4, 20); ctx.fillRect(sx + 116, y - 20, 4, 20);
    }
    function draw() {
      const t = getT(), pos = posAt(t);
      const dawn = Math.min(1, Math.max(0, (t - 38) / 14));
      const top = mix([8, 12, 28], [96, 128, 170], dawn), bot = mix([26, 32, 58], [246, 204, 160], dawn);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,248,230,${0.9 * (1 - dawn)})`;
      stars.forEach(([sx, sy, r]) => { const x = ((sx * W * 1.4 - pos * 0.02) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2; ctx.beginPath(); ctx.arc(x, sy * H, r, 0, 6.3); ctx.fill(); });
      // 遠くの山並み、そして海
      ctx.fillStyle = rgb(mix([20, 22, 36], [92, 100, 120], dawn));
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) { const wx = x + pos * 0.15; ctx.lineTo(x, H * 0.58 - Math.sin(wx / 190) * 26 - Math.sin(wx / 71) * 9); }
      ctx.lineTo(W, H); ctx.fill();
      if (t > 43) {
        const k = Math.min(1, (t - 43) / 5);
        ctx.fillStyle = `rgba(${mix([40, 60, 90], [120, 160, 190], dawn).join(',')},${k})`;
        ctx.fillRect(0, H * 0.6, W, H * 0.12);
        ctx.fillStyle = `rgba(255,236,200,${0.5 * k * dawn})`;
        for (let i = 0; i < 18; i++) ctx.fillRect(W * 0.5 - 90 + Math.sin(t * 2 + i) * 40 + (i % 5) * 30, H * 0.61 + i * 4, 40 + (i % 3) * 20, 1.5);
      }
      ctx.fillStyle = rgb(mix([10, 10, 16], [58, 52, 50], dawn)); ctx.fillRect(0, H * 0.72, W, H * 0.28);
      // 電信柱と電線
      ctx.strokeStyle = rgb(mix([4, 4, 8], [40, 36, 36], dawn)); ctx.lineWidth = 5;
      const gap = 260, off = -(pos % gap);
      for (let x = off - gap; x < W + gap; x += gap) {
        ctx.beginPath(); ctx.moveTo(x, H * 0.22); ctx.lineTo(x, H * 0.74); ctx.stroke();
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, H * 0.25); ctx.quadraticCurveTo(x + gap / 2, H * 0.3, x + gap, H * 0.25); ctx.stroke(); ctx.lineWidth = 5;
      }
      plats.forEach(([at, n, k]) => { const x = V * at - pos + W; if (x > -700 && x < W + 50) platform(x, n, k); });
      const endX = V * 44.5 + W / 2 - 310 - pos; // 停車したとき画面の中央に来る
      if (endX < W + 50) platform(endX, '灘浜', 'なだはま');
      if (!reduced) raf = requestAnimationFrame(draw);
    }
    draw();
    return () => removeEventListener('resize', resize);
  }

  routes.end = () => {
    if (!state.tms.signal) { go(state.archive ? '#/tms' : '#/'); return; }
    clear();
    if (!state.ended) { state.ended = true; state.endedAt = Date.now(); save(); K.renderNote(); }
    const now = new Date(state.endedAt);
    const mins = Math.max(1, Math.round((state.endedAt - state.started) / 60000));
    $('#v-end').innerHTML = '<div class="end"><canvas id="end-cv" aria-hidden="true"></canvas><div class="end-frame" aria-hidden="true"></div>'
      + '<div class="end-text" id="end-text" aria-live="polite"></div><button type="button" class="end-skip" id="end-skip">スキップ</button>'
      + `<div class="end-card" id="end-card" hidden><p class="end-title">霞野線アーカイブ</p><p class="end-fin">― 終 ―</p><p class="end-time">プレイ時間　約 ${mins} 分</p>`
      + '<p class="end-thanks">148D を帰してくれて、ありがとう。</p><div class="end-btns"><a href="#/diary/d-back">管理人日記「ただいま」を読む</a><a href="#/">語り継ぐ会のサイトへ戻る</a></div></div></div>';
    const start = performance.now();
    let skipT = 0;
    const getT = () => (performance.now() - start) / 1000 + skipT;
    const stopScene = scene($('#end-cv'), getT);
    const box = $('#end-text');
    const show = text => {
      const p = document.createElement('p');
      p.textContent = text;
      box.appendChild(p);
      while (box.children.length > 2) box.firstElementChild.remove();
    };
    const finish = () => {
      timers.forEach(clearTimeout);
      timers = [];
      box.innerHTML = '';
      $('#end-skip').hidden = true;
      $('#end-card').hidden = false;
    };
    LINES(now).forEach(([at, text]) => timers.push(setTimeout(() => show(text), at * 1000)));
    timers.push(setTimeout(finish, FINAL_AT * 1000));
    $('#end-skip').addEventListener('click', () => { skipT = 60; finish(); });
    leave.end = () => { clear(); stopScene(); };
  };

  K.boot();
})();
