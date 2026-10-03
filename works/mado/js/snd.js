/* ふたつの窓 — 音（雨・風・雷・柱時計・朝の鳥）。すべてその場で合成する */
(() => {
  const G = MD.G;
  const KEY = 'mado.snd';
  let on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { }
  let ctx = null, master, rainG, windG, windF, noise, lastFl = 0, lastFx = MD.S.fx.n, nextBird = 0;

  const mkNoise = () => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; return s;
  };
  const init = () => {
    if (ctx || !on) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    noise = mkNoise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.5;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
    rainG = ctx.createGain(); rainG.gain.value = 0;
    noise.connect(hp); hp.connect(bp); bp.connect(rainG); rainG.connect(master);
    windF = ctx.createBiquadFilter(); windF.type = 'lowpass'; windF.frequency.value = 380; windF.Q.value = 4;
    windG = ctx.createGain(); windG.gain.value = 0;
    noise.connect(windF); windF.connect(windG); windG.connect(master);
    noise.start();
  };
  const thunder = (delay) => {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const s = mkNoise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(70, t + 2.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.75, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 3.4);
  };
  const tone = (freq, t, dur, vol, type = 'sine') => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  };
  const chime = () => { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 2; i++) { tone(392, t + i * 1.6, 2.4, 0.25); tone(784, t + i * 1.6, 1.6, 0.08); tone(588, t + i * 1.6, 2, 0.06); } };
  const shutter = () => { if (!ctx) return; const t = ctx.currentTime; tone(2400, t, 0.04, 0.12, 'square'); tone(900, t + 0.05, 0.08, 0.08, 'square'); };
  const bird = () => { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(2600, t + i * 0.18); o.frequency.exponentialRampToValueAtTime(3800, t + i * 0.18 + 0.08); g.gain.setValueAtTime(0.0001, t + i * 0.18); g.gain.exponentialRampToValueAtTime(0.05, t + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.12); o.connect(g); g.connect(master); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.15); } };

  MD.snd = {
    on: () => on,
    toggle: () => {
      on = !on;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { }
      if (on) { init(); ctx && ctx.resume(); } else if (ctx) ctx.suspend();
    },
    wake: () => { if (!on) return; init(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    update: () => {
      if (!ctx || !on || !MD.mode) return;
      const S = MD.S, now = Date.now(), t = ctx.currentTime;
      const vis = !document.hidden;
      const focus = MD.mode === 'ab' || document.hasFocus();
      const vol = !vis ? 0 : focus ? 1 : 0.3;
      const storm = S.started && !S.ended && !S.f.eye;
      const W = G.wind(now, S);
      rainG.gain.setTargetAtTime(storm ? 0.16 * vol * (0.6 + W.w * 0.5) : 0, t, 0.4);
      windG.gain.setTargetAtTime(storm ? 0.22 * vol * W.w : 0, t, 0.3);
      windF.frequency.setTargetAtTime(260 + W.w * 380, t, 0.5);
      const fl = G.lightning(now, S);
      if (fl > 0.6 && lastFl <= 0.6 && vol > 0) thunder(0.5 + Math.random() * 1.2);
      lastFl = fl;
      if (S.fx.n !== lastFx) {
        lastFx = S.fx.n;
        if (vol > 0 && now - S.fx.t < 2000) {
          if (S.fx.name === 'chime') chime();
          if (S.fx.name === 'flash' && MD.mode !== 'a') shutter();
        }
      }
      if (S.ended && vol > 0 && now > nextBird) { if (nextBird) bird(); nextBird = now + 4000 + Math.random() * 7000; }
    },
  };
  // 隠れたら止める
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
})();
