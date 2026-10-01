/* ことだま短冊 — 音（合成）
   琴のはじく音、拍子木、鈴、太鼓、紙。音源ファイルは使わない。 */
(function (G) {
  'use strict';
  let ac = null, master = null, on = true, noiseBuf = null;
  const init = () => {
    if (ac) return ac;
    const C = G.AudioContext || G.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  };
  const env = (g, t, a, v, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
  const noise = (t, dur, f, q, v, type = 'bandpass') => {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q;
    const g = ac.createGain(); env(g, t, 0.002, v, dur);
    s.connect(b); b.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  };
  const tone = (t, f, type, v, dec, a = 0.004, bend) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(f * bend, t + dec);
    const g = ac.createGain(); env(g, t, a, v, dec);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + a + dec + 0.05);
  };
  // 都節（みやこぶし）の音階
  const SCALE = [0, 1, 5, 7, 8, 12, 13, 17, 19, 20, 24];
  const note = (k, base = 293.66) => base * Math.pow(2, SCALE[((k % SCALE.length) + SCALE.length) % SCALE.length] / 12);
  function koto(t, f, v = 0.22) {
    tone(t, f, 'triangle', v, 1.4, 0.003);
    tone(t, f * 2.005, 'sine', v * 0.35, 0.7, 0.003);
    tone(t, f * 3.01, 'sine', v * 0.12, 0.35, 0.002);
    noise(t, 0.03, f * 4, 3, v * 0.4);
  }
  const SFX = {
    tap: (t) => noise(t, 0.05, 3200, 1.2, 0.12, 'highpass'),
    paper: (t) => { noise(t, 0.14, 2600, 0.8, 0.16, 'highpass'); },
    pick: (t, o) => koto(t, note(o && o.k !== undefined ? o.k : 4, 587.33), 0.12),
    put: (t) => { noise(t, 0.06, 1800, 2, 0.12); tone(t, 220, 'sine', 0.06, 0.08); },
    back: (t) => noise(t, 0.08, 1200, 1.5, 0.1),
    bad: (t) => { tone(t, 180, 'square', 0.04, 0.18); tone(t + 0.06, 150, 'square', 0.035, 0.2); },
    mora: (t, o) => koto(t, note(o.k), 0.16),
    clack: (t) => { noise(t, 0.05, 1900, 9, 0.5); noise(t + 0.045, 0.06, 1700, 9, 0.4); tone(t, 1250, 'sine', 0.08, 0.05); },
    bell: (t) => { tone(t, 1760, 'sine', 0.12, 0.9); tone(t, 2637, 'sine', 0.06, 0.6); tone(t + 0.08, 2093, 'sine', 0.08, 0.8); },
    seal: (t) => { tone(t, 90, 'sine', 0.35, 0.22, 0.002, 0.6); noise(t, 0.06, 900, 1, 0.25); },
    taiko: (t) => { tone(t, 80, 'sine', 0.55, 0.6, 0.002, 0.55); noise(t, 0.12, 400, 0.8, 0.3, 'lowpass'); },
    coin: (t) => { tone(t, 1975, 'square', 0.04, 0.08); tone(t + 0.07, 2637, 'square', 0.04, 0.16); },
    win: (t) => { [0, 2, 4, 5, 7].forEach((k, i) => koto(t + i * 0.11, note(k + 3, 440), 0.15)); SFX.bell(t + 0.6); },
    lose: (t) => { [4, 3, 1, 0].forEach((k, i) => koto(t + i * 0.22, note(k, 220), 0.16)); },
    found: (t) => { SFX.bell(t); koto(t + 0.1, note(7, 587.33), 0.14); },
    cut: (t) => { noise(t, 0.05, 4200, 4, 0.25); noise(t + 0.09, 0.05, 3800, 4, 0.22); },
    glue: (t) => { noise(t, 0.2, 700, 0.7, 0.12, 'lowpass'); },
    gone: (t) => { noise(t, 1.2, 500, 0.5, 0.18, 'lowpass'); tone(t, 440, 'sine', 0.06, 1.2, 0.3, 0.5); },
  };
  G.SND = {
    get on() { return on; },
    set on(v) { on = !!v; },
    unlock() { if (init() && ac.state === 'suspended') ac.resume(); },
    play(name, o) {
      if (!on || !init() || !SFX[name]) return;
      if (ac.state === 'suspended') ac.resume();
      SFX[name](ac.currentTime + 0.01 + ((o && o.at) || 0), o || {});
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
