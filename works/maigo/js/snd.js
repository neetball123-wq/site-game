/* =========================================================
   迷子の天気予報 — 音（その場で合成する。音声ファイルは使わない）
   ========================================================= */
window.MA = (() => {
  let ac = null, master = null, nbuf = null, muted = false;
  let amb = null, rainN = null, windN = null, birdT = 0, bugT = 0, tod = 0;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
    nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = nbuf.getChannelData(0); let b = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.03 * w) / 1.03; d[i] = i % 3 ? w * 0.5 : b * 3; }
    loopBg();
  }
  const T = () => ac.currentTime;
  function tone(type, f, t0, dur, peak, slide, dest) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, type, f, peak, q, attack) {
    const s = ac.createBufferSource(); s.buffer = nbuf;
    const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  function loopSrc(type, f, q) {
    const s = ac.createBufferSource(); s.buffer = nbuf; s.loop = true;
    const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.value = 0; s.connect(x); x.connect(g); g.connect(master); s.start();
    return { g, x };
  }
  /* 背景：朝は鳥、夜は虫。ずっと小さく風 */
  function loopBg() {
    amb = loopSrc('lowpass', 420); rainN = loopSrc('bandpass', 2600, 0.6); windN = loopSrc('bandpass', 700, 0.9);
    amb.g.gain.value = 0.025;
    setInterval(() => {
      if (!ac || muted || document.hidden) return;
      const t = T();
      if (tod < 1.6 && Math.random() < 0.35) { const f = 2600 + Math.random() * 1400; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone('sine', f, t + i * 0.11, 0.08, 0.018, f * 1.25); }
      if (tod > 2.6 && Math.random() < 0.6) { const f = 4200 + Math.random() * 300; for (let i = 0; i < 4; i++) tone('sine', f, t + i * 0.06, 0.04, 0.008); }
    }, 900);
  }
  function setTod(t) { tod = t; }
  function rain(v, snow) { if (!ac) return; rainN.g.gain.setTargetAtTime(v ? (snow ? 0.012 : 0.07) * v : 0, T(), 0.25); rainN.x.frequency.setTargetAtTime(snow ? 5000 : 2600, T(), 0.2); }
  function wind(v) { if (!ac) return; windN.g.gain.setTargetAtTime(v ? 0.06 * v : 0, T(), 0.2); windN.x.frequency.setTargetAtTime(500 + v * 500, T(), 0.3); }
  function sfx(name) {
    if (!ac || muted) return;
    const t = T();
    switch (name) {
      case 'tap': noise(t, 0.05, 'bandpass', 1800, 0.12, 4); tone('sine', 520, t, 0.06, 0.04); break;
      case 'dial': noise(t, 0.03, 'highpass', 3500, 0.08); tone('triangle', 880, t, 0.05, 0.03); break;
      case 'crank': for (let i = 0; i < 6; i++) noise(t + i * 0.07, 0.03, 'bandpass', 2400, 0.1, 6); break;
      case 'page': noise(t, 0.28, 'bandpass', 3200, 0.07, 0.8, 0.08); break;
      case 'stamp': tone('sine', 110, t, 0.18, 0.35, 60); noise(t, 0.08, 'lowpass', 900, 0.2); break;
      case 'ok': [659, 784, 988, 1319].forEach((f, i) => { tone('sine', f, t + i * 0.09, 0.6, 0.06); tone('triangle', f * 2, t + i * 0.09, 0.25, 0.012); }); break;
      case 'ng': tone('sine', 392, t, 0.3, 0.06); tone('sine', 330, t + 0.18, 0.45, 0.06); break;
      case 'bow': for (let i = 0; i < 7; i++) tone('sine', 1047 * Math.pow(1.122, i), t + i * 0.05, 0.4, 0.025); break;
      case 'pop': tone('sine', 300, t, 0.15, 0.06, 620); break;
      case 'merge': tone('sine', 180, t, 0.25, 0.08, 120); noise(t, 0.2, 'lowpass', 500, 0.06); break;
      case 'bump': tone('sine', 140, t, 0.2, 0.1, 90); break;
      case 'found': [1568, 1976, 2349, 3136].forEach((f, i) => tone('sine', f, t + i * 0.07, 0.35, 0.03)); break;
      case 'write': for (let i = 0; i < 5; i++) noise(t + i * 0.09, 0.07, 'highpass', 5000, 0.035); break;
      case 'meow': { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(950, t + 0.12); o.frequency.linearRampToValueAtTime(600, t + 0.35);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45); break; }
      case 'gust': noise(t, 1.4, 'bandpass', 900, 0.14, 0.7, 0.3); break;
    }
  }
  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : 0.8, T(), 0.05); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, sfx, rain, wind, setTod, mute, suspend };
})();
