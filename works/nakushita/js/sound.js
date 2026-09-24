/* ナクシタ堂 — 音（合成。ピコン・チャリン・文字の落ちる音） */
(() => {
  let ctx = null, master = null, on = false, muted = false;
  const tone = (f, t, dur, type, vol, slide) => {
    const o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const S = {
    pico() { if (!on) return; const t = ctx.currentTime; tone(1320, t, 0.08, 'square', 0.04); tone(1980, t + 0.07, 0.12, 'square', 0.04); },
    buy() { if (!on) return; const t = ctx.currentTime; [1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.07, 0.5, 'triangle', 0.06)); },
    ok() { if (!on) return; const t = ctx.currentTime; tone(880, t, 0.1, 'sine', 0.06); tone(1175, t + 0.08, 0.18, 'sine', 0.06); },
    ng() { if (!on) return; const t = ctx.currentTime; tone(220, t, 0.18, 'square', 0.05, 160); },
    fall() { if (!on) return; const t = ctx.currentTime; for (let i = 0; i < 7; i++) tone(900 - i * 90, t + i * 0.05, 0.09, 'square', 0.025); },
    drain() {
      if (!on) return; const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 2.4), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = ctx.createBufferSource(); s.buffer = b;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(200, t + 2.4);
      const g = ctx.createGain(); g.gain.value = 0.06;
      s.connect(f); f.connect(g); g.connect(master); s.start(t);
    },
    night() { if (!on) return; const t = ctx.currentTime; [392, 523, 659].forEach((f, i) => tone(f, t + i * 0.25, 2.2, 'sine', 0.05)); },
    melody() {
      if (!on) return; const t = ctx.currentTime;
      [659, 587, 523, 587, 659, 659, 659, 0, 587, 587, 587, 0, 659, 784, 784].forEach((f, i) => { if (f) tone(f, t + i * 0.26, 0.3, 'triangle', 0.06); });
    },
    glitch() { if (!on) return; const t = ctx.currentTime; for (let i = 0; i < 10; i++) tone(200 + Math.random() * 1800, t + i * 0.03, 0.03, 'sawtooth', 0.02); }
  };
  window.NSND = Object.assign({
    start() {
      if (on) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); if (ctx.state === 'suspended') ctx.resume();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination); on = true;
    },
    mute(m) {
      muted = m; if (!on) return;
      const t = ctx.currentTime; master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(m ? 0 : 0.9, t + 0.3);
    },
    ready: () => on
  }, S);
})();
