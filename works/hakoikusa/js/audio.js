/* ハコイクサ — 音（WebAudio で合成。ファイルは使わない） */
(function (G) {
  'use strict';
  const HK = G.HK;
  const A = HK.audio = { muted: false, ctx: null };
  let master = null, noiseBuf = null;
  const last = {};

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = G.AudioContext || G.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    master = A.ctx.createGain();
    master.gain.value = A.muted ? 0 : 0.55;
    const comp = A.ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(A.ctx.destination);
    noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate * 0.6, A.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };
  A.setMuted = function (m) { A.muted = m; if (master) master.gain.value = m ? 0 : 0.55; };

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(type, f0, f1, dur, vol, when) {
    const c = A.ctx, t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, vol, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, filt, f0, f1, when, q) {
    const c = A.ctx, t = c.currentTime + (when || 0);
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = filt; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 1;
    const g = c.createGain();
    env(g, t, 0.003, vol, dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.2); s.stop(t + dur + 0.05);
  }

  const S = {
    tap: () => tone('triangle', 900, 700, 0.05, 0.12),
    pick: () => { tone('triangle', 520, 780, 0.07, 0.16); noise(0.04, 0.08, 'bandpass', 2400, 0, 0, 2); },
    drop: (v) => { const k = Math.min(1.4, 0.6 + (v || 4) / 10); tone('sine', 190 * (0.9 + Math.random() * 0.2), 90, 0.12, 0.35 * k); noise(0.06, 0.22 * k, 'bandpass', 1300 + Math.random() * 400, 500, 0, 1.5); },
    rot: () => { noise(0.03, 0.1, 'highpass', 3000); tone('square', 1400, 1200, 0.02, 0.03); },
    buy: () => { tone('sine', 1320, 0, 0.12, 0.14); tone('sine', 1980, 0, 0.18, 0.1, 0.05); },
    sell: () => { tone('sine', 1500, 0, 0.1, 0.12); tone('sine', 1100, 0, 0.14, 0.1, 0.06); },
    reroll: () => { noise(0.22, 0.16, 'bandpass', 900, 3200, 0, 1.2); for (let i = 0; i < 4; i++) tone('triangle', 600 + i * 90, 0, 0.03, 0.05, i * 0.04); },
    bad: () => { tone('square', 150, 120, 0.14, 0.08); },
    merge: () => { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, 0, 0.22, 0.12, i * 0.06)); noise(0.4, 0.08, 'highpass', 5000, 9000, 0.1); },
    expand: () => { tone('sine', 220, 440, 0.35, 0.18); noise(0.3, 0.1, 'bandpass', 500, 1500, 0, 1); },
    go: () => { tone('sine', 110, 60, 0.4, 0.5); noise(0.2, 0.25, 'lowpass', 800, 200); tone('sine', 110, 60, 0.4, 0.4, 0.22); },
    swing: () => noise(0.09, 0.18, 'bandpass', 1800, 700, 0, 2),
    shoot: () => { noise(0.07, 0.14, 'bandpass', 2600, 1200, 0, 3); tone('triangle', 700, 300, 0.07, 0.06); },
    boom: () => { tone('sine', 120, 40, 0.35, 0.5); noise(0.35, 0.3, 'lowpass', 1200, 150); },
    hit: (v) => { const k = Math.min(1.3, 0.5 + (v || 5) / 18); tone('sine', 150, 70, 0.1, 0.4 * k); noise(0.07, 0.25 * k, 'bandpass', 900, 400, 0, 1); },
    block: () => { [1180, 1570, 2210].forEach((f) => tone('sine', f, f * 0.98, 0.18, 0.06)); noise(0.05, 0.1, 'highpass', 4000); },
    heal: () => { tone('sine', 880, 1320, 0.18, 0.08); tone('sine', 1320, 1760, 0.2, 0.05, 0.05); },
    fire: () => noise(0.25, 0.14, 'bandpass', 400, 1600, 0, 0.8),
    burn: () => noise(0.12, 0.07, 'bandpass', 700, 300, 0, 1),
    bolt: () => { noise(0.3, 0.35, 'highpass', 1500, 400); tone('sawtooth', 90, 40, 0.3, 0.12); },
    zap: () => { tone('sawtooth', 1800, 400, 0.1, 0.05); noise(0.06, 0.1, 'highpass', 5000); },
    gear: () => tone('square', 2400, 0, 0.015, 0.03),
    spring: () => tone('triangle', 300, 900, 0.12, 0.1),
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, 0, 0.3, 0.13, i * 0.09)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, 0, 0.35, 0.12, i * 0.14)); },
    stamp: () => { tone('sine', 90, 50, 0.2, 0.5); noise(0.08, 0.3, 'lowpass', 1500, 300); },
  };
  A.play = function (name, v) {
    if (!A.ctx || A.muted || !S[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 35) return;
    last[name] = now;
    try { S[name](v); } catch (e) { /* 音が鳴らなくても遊べる */ }
  };
})(typeof window !== 'undefined' ? window : globalThis);
