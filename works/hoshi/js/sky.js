/* 星空（canvas）— またたき・視差・流れ星・日周運動 */
(() => {
  const cv = document.getElementById('sky'), ctx = cv.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, stars = [], meteors = [], angle = 0, target = 0, px = 0, py = 0, tx = 0, ty = 0, on = false;

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function make() {
    const n = Math.round((W * H) / 5200);
    stars = Array.from({ length: Math.max(220, Math.min(900, n)) }, () => {
      const d = Math.random();
      return {
        a: Math.random() * Math.PI * 2,
        r: Math.pow(Math.random(), .6) * Math.max(W, H) * .78,
        s: (d < .82 ? .5 + Math.random() * .8 : 1.1 + Math.random() * 1.3),
        depth: .2 + d * .8,
        ph: Math.random() * Math.PI * 2,
        sp: .6 + Math.random() * 1.6,
        hue: Math.random() < .12 ? (Math.random() < .5 ? 25 : 205) : 0
      };
    });
  }
  addEventListener('resize', () => { size(); make(); });
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 26; ty = (e.clientY / innerHeight - .5) * 18; }, { passive: true });

  function meteor() {
    const fromLeft = Math.random() < .5;
    meteors.push({
      x: fromLeft ? -60 : W + 60, y: Math.random() * H * .55,
      vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 6), vy: 2.4 + Math.random() * 2.2,
      life: 0, max: 60 + Math.random() * 40
    });
  }
  function loop(t) {
    if (!on) return;
    ctx.clearRect(0, 0, W, H);
    angle += (target - angle) * .02;
    px += (tx - px) * .04; py += (ty - py) * .04;
    const cx = W / 2, cy = H * .42;
    for (const s of stars) {
      const a = s.a + angle * s.depth;
      const x = cx + Math.cos(a) * s.r * (W > H ? 1 : .8) + px * s.depth;
      const y = cy + Math.sin(a) * s.r * .62 + py * s.depth;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const tw = calm ? 1 : .55 + .45 * Math.sin(t / 900 * s.sp + s.ph);
      ctx.globalAlpha = Math.min(1, (.25 + s.depth * .75) * tw);
      ctx.fillStyle = s.hue === 25 ? '#FFE7C2' : s.hue === 205 ? '#CFE4FF' : '#FFFDF6';
      ctx.beginPath(); ctx.arc(x, y, s.s, 0, 6.283); ctx.fill();
      if (s.s > 1.4) {
        ctx.globalAlpha *= .25;
        ctx.beginPath(); ctx.arc(x, y, s.s * 3.4, 0, 6.283); ctx.fill();
      }
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life++;
      const k = 1 - m.life / m.max;
      if (k <= 0) { meteors.splice(i, 1); continue; }
      const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
      g.addColorStop(0, `rgba(255,253,246,${.9 * k})`); g.addColorStop(1, 'rgba(255,253,246,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }

  let timer = 0;
  HS.sky = {
    start() {
      if (on) return;
      size(); make(); on = true;
      requestAnimationFrame(loop);
      clearInterval(timer);
      if (!calm) timer = setInterval(() => { if (Math.random() < .45) meteor(); }, 9000);
    },
    stop() { on = false; clearInterval(timer); },
    rotate(d) { target += d; },
    meteor,
    angle: () => angle
  };
})();
