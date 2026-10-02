/* ハズレスキル【合成】 — 音（WebAudio で合成。ファイルは使わない） */
(function (G) {
  'use strict';
  const SND = (G.HZ.SND = { on: true });
  let ac = null, master = null, last = {};
  function ctx() {
    if (!ac) {
      const A = G.AudioContext || G.webkitAudioContext;
      if (!A) return null;
      ac = new A(); master = ac.createGain(); master.gain.value = 0.22; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, t0, dur, type, vol, f2) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, vol, hp) {
    const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 800;
    s.buffer = b; g.gain.value = vol || 0.3; s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const P = {
    sys: (t) => { tone(1320, t, 0.09, 'sine', 0.35); tone(1760, t + 0.07, 0.14, 'sine', 0.3); },
    tap: (t) => tone(880, t, 0.05, 'triangle', 0.25),
    fire: (t) => tone(660, t, 0.06, 'square', 0.08, 990),
    hit: (t) => { noise(t, 0.08, 0.25, 1200); tone(180, t, 0.08, 'triangle', 0.3, 90); },
    big: (t) => { noise(t, 0.25, 0.4, 300); tone(120, t, 0.3, 'sawtooth', 0.25, 50); },
    hurt: (t) => { tone(220, t, 0.12, 'square', 0.15, 110); },
    react: (t) => { tone(523, t, 0.18, 'triangle', 0.3); tone(784, t + 0.04, 0.2, 'triangle', 0.25); tone(1046, t + 0.08, 0.24, 'triangle', 0.2); },
    lvup: (t) => { [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.2, 'square', 0.12)); },
    coin: (t) => { tone(1568, t, 0.06, 'square', 0.12); tone(2093, t + 0.05, 0.12, 'square', 0.1); },
    fuse: (t) => { tone(220, t, 0.5, 'sawtooth', 0.12, 1760); tone(330, t + 0.1, 0.45, 'sine', 0.2, 1320); noise(t + 0.45, 0.2, 0.2, 2000); },
    win: (t) => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.1, 0.3, 'triangle', 0.22)); },
    lose: (t) => { [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.16, 0.36, 'sine', 0.25)); },
    bad: (t) => tone(160, t, 0.15, 'square', 0.12),
    inf: (t) => { for (let i = 0; i < 8; i++) tone(200 + i * 180, t + i * 0.05, 0.6, 'sine', 0.12, 40 + i * 900); noise(t, 0.8, 0.3, 200); },
  };
  SND.play = (k) => {
    if (!SND.on || !P[k]) return;
    const c = ctx(); if (!c) return;
    // 同じ音を短い間に何度も鳴らさない（連鎖で何百回も発動するため）
    const now = c.currentTime;
    if (last[k] && now - last[k] < (k === 'fire' || k === 'hit' ? 0.05 : 0.02)) return;
    last[k] = now;
    try { P[k](now + 0.005); } catch (e) { /* noop */ }
  };
})(typeof window !== 'undefined' ? window : globalThis);
