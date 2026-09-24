/* =========================================================
   最終バスの車掌 — 音（すべてその場で合成）
   ========================================================= */
window.BA = (() => {
  let ac = null, master = null, nbuf = null, bbuf = null, muted = false;
  let eng = null, road = null, cross = null, sea = null, bugs = null, crossT = null;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(comp);
    const n = ac.sampleRate * 2;
    nbuf = ac.createBuffer(1, n, ac.sampleRate); bbuf = ac.createBuffer(1, n, ac.sampleRate);
    const a = nbuf.getChannelData(0), b = bbuf.getChannelData(0); let l = 0;
    for (let i = 0; i < n; i++) { a[i] = Math.random() * 2 - 1; l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = l * 3.5; }
    // エンジン
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 38; o2.frequency.value = 57;
    const ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 180; const eg = ac.createGain(); eg.gain.value = 0;
    o1.connect(ef); o2.connect(ef); ef.connect(eg); eg.connect(master); o1.start(); o2.start();
    eng = { o1, o2, ef, eg };
    road = loop(bbuf, 'lowpass', 300, 0);
    sea = loop(bbuf, 'lowpass', 600, 0);
    bugs = setInterval(() => { if (!ac || muted || document.hidden || !bugOn) return; const t = ac.currentTime; const f = 3800 + Math.random() * 600; for (let i = 0; i < 3; i++) tone('sine', f, t + i * 0.07, 0.05, 0.01); }, 700);
  }
  let bugOn = false;
  function loop(buf, type, f, v) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; const g = ac.createGain(); g.gain.value = v; s.connect(x); x.connect(g); g.connect(master); s.start(); return { s, x, g }; }
  const T = () => ac.currentTime;
  function tone(type, f, t0, dur, peak, slide, q) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (q || 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function burst(t0, dur, type, f, peak, q, att) {
    const s = ac.createBufferSource(); s.buffer = nbuf; const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  /* 走る速さ（0〜1）とトンネル */
  function drive(v, tunnel, seaNear) {
    if (!ac) return; const t = T();
    eng.eg.gain.setTargetAtTime(0.05 + v * 0.07, t, 0.3);
    eng.o1.frequency.setTargetAtTime(34 + v * 30, t, 0.4); eng.o2.frequency.setTargetAtTime(51 + v * 45, t, 0.4);
    eng.ef.frequency.setTargetAtTime(tunnel ? 260 : 170 + v * 90, t, 0.3);
    road.g.gain.setTargetAtTime(v * (tunnel ? 0.22 : 0.1), t, 0.3); road.x.frequency.setTargetAtTime(tunnel ? 700 : 320 + v * 200, t, 0.3);
    sea.g.gain.setTargetAtTime(seaNear ? 0.06 : 0, t, 1.2);
  }
  function bugsOn(v) { bugOn = v; }
  function crossing(on) {
    if (!ac) return;
    if (on && !crossT) { let k = 0; crossT = setInterval(() => { if (muted) return; const t = T(); tone('square', k++ % 2 ? 740 : 880, t, 0.22, 0.035); tone('sine', k % 2 ? 740 : 880, t, 0.3, 0.03); }, 330); }
    if (!on && crossT) { clearInterval(crossT); crossT = null; }
  }
  function sfx(name, v) {
    if (!ac || muted) return; const t = T();
    switch (name) {
      case 'bell': tone('sine', 1568, t, 1.2, 0.12); tone('sine', 3136, t, 0.6, 0.03); tone('triangle', 1568 * 2.76, t, 0.3, 0.02); break;
      case 'door': burst(t, 0.9, 'bandpass', 1400, 0.16, 0.8, 0.05); burst(t + 0.05, 0.4, 'lowpass', 300, 0.1); tone('sine', 90, t + 0.7, 0.2, 0.08, 60); break;
      case 'chime': tone('sine', 988, t, 0.5, 0.07); tone('sine', 784, t + 0.28, 0.7, 0.07); break;
      case 'bump': tone('sine', 70, t, 0.25, 0.25, 40); burst(t, 0.12, 'lowpass', 500, 0.12); break;
      case 'brake': burst(t, 1.1, 'bandpass', 2400, 0.05, 6, 0.2); break;
      case 'kan': tone('sine', 523, t, 3.5, 0.18); tone('sine', 523 * 2.4, t, 2, 0.06); tone('sine', 523 * 3.9, t, 1, 0.03); break;
      case 'pickup': [1175, 1568, 2093].forEach((f, i) => tone('sine', f, t + i * 0.07, 0.5, 0.04)); break;
      case 'no': tone('sine', 330, t, 0.3, 0.05); tone('sine', 294, t + 0.15, 0.4, 0.05); break;
      case 'tap': burst(t, 0.04, 'bandpass', 2200, 0.08, 3); break;
      case 'page': burst(t, 0.25, 'bandpass', 3000, 0.06, 0.8, 0.06); break;
      case 'train': burst(t, 3.2, 'lowpass', 400, 0.22, 0.7, 0.8); for (let i = 0; i < 12; i++) tone('sine', 60, t + 0.3 + i * 0.22, 0.12, 0.12, 40); break;
      case 'honk': tone('sawtooth', 330, t, 0.6, 0.04); tone('sawtooth', 415, t, 0.6, 0.03); break;
      case 'wind': burst(t, 1.8, 'bandpass', 700, 0.08, 0.6, 0.5); break;
      case 'dawn': [523, 659, 784, 1047, 1319].forEach((f, i) => tone('sine', f, t + i * 0.18, 1.6, 0.04)); break;
    }
  }
  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : 0.85, T(), 0.05); if (v) crossing(false); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, drive, crossing, bugsOn, sfx, mute, suspend };
})();
