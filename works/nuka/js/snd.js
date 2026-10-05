/* ぬか床、百年 — 音（その場で合成） */
(function () {
  let ctx = null, on = true, master = null, noiseBuf = null;
  const init = () => {
    if (ctx || !on) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };
  const noise = (t, dur, f, q, vol) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  };
  const tone = (f, t, dur, vol, type = 'sine', f2) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const ok = () => on && ctx && !document.hidden;
  let lastStir = 0;
  NK.snd = {
    setOn: (v) => { on = v; if (!on && ctx) ctx.suspend(); if (on && ctx) ctx.resume(); },
    wake: () => { if (!on) return; init(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    stir: (k = 1) => { if (!ok()) return; const t = ctx.currentTime; if (t - lastStir < 0.05) return; lastStir = t; noise(t, 0.09, 700 + Math.random() * 600, 1.4, 0.18 * k); noise(t + 0.03, 0.06, 1800 + Math.random() * 400, 2, 0.06 * k); },
    pop: () => { if (!ok()) return; const t = ctx.currentTime; tone(520, t, 0.12, 0.18, 'sine', 260); noise(t, 0.05, 2500, 3, 0.05); },
    plant: () => { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.12, 500, 1, 0.12); tone(180, t, 0.1, 0.08, 'sine', 120); },
    coin: () => { if (!ok()) return; const t = ctx.currentTime; tone(1320, t, 0.12, 0.1); tone(1760, t + 0.07, 0.18, 0.1); },
    bell: () => { if (!ok()) return; const t = ctx.currentTime; [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.09, 0.5, 0.09)); },
    paper: () => { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.18, 4000, 0.8, 0.06); noise(t + 0.12, 0.14, 3000, 0.8, 0.04); },
  };
})();
