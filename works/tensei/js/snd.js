/* =========================================================
   女神課 転生窓口 — 音（すべてその場で合成）
   ========================================================= */
window.TS = (() => {
  'use strict';
  let ac = null, master = null, nbuf = null, muted = false, room = null;
  const T = () => ac.currentTime;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
    const n = ac.sampleRate * 2; nbuf = ac.createBuffer(1, n, ac.sampleRate); const d = nbuf.getChannelData(0); let l = 0;
    for (let i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = Math.random() * 2 - 1; }
  }
  function tone(type, f, t0, dur, peak, att, dest) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function burst(t0, dur, type, f, peak, q, att) {
    const s = ac.createBufferSource(); s.buffer = nbuf; const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  const bell = (m, t, v, d) => { tone('sine', hz(m), t, d || 2.2, v); tone('sine', hz(m) * 2.76, t, 0.6, v * 0.18); tone('sine', hz(m) * 5.4, t, 0.2, v * 0.06); };
  function sfx(name) {
    if (!ac || muted) return; const t = T();
    switch (name) {
      case 'call': bell(79, t, 0.12, 1.4); bell(76, t + 0.45, 0.12, 2); break;
      case 'stamp': tone('sine', 120, t, 0.18, 0.3, 0.002); burst(t, 0.08, 'lowpass', 900, 0.25); burst(t + 0.02, 0.05, 'bandpass', 2400, 0.06, 2); break;
      case 'page': burst(t, 0.26, 'bandpass', 2800, 0.06, 0.8, 0.05); break;
      case 'click': burst(t, 0.02, 'bandpass', 2600, 0.05, 2); break;
      case 'pen': for (let i = 0; i < 7; i++) burst(t + i * 0.05 + Math.random() * 0.02, 0.05, 'bandpass', 3800 + Math.random() * 900, 0.035, 3); break;
      case 'ok': [72, 76, 79, 84].forEach((m, i) => bell(m, t + i * 0.09, 0.05, 1.6)); break;
      case 'miss': tone('triangle', hz(57), t, 0.4, 0.07); tone('triangle', hz(55), t + 0.14, 0.5, 0.06); break;
      case 'rise': for (let i = 0; i < 14; i++) bell(84 + [0, 2, 4, 7, 9, 12, 14][i % 7] + (i > 6 ? 12 : 0), t + i * 0.09, 0.025, 1.4); break;
      case 'suzu': [0, 0.13, 0.22].forEach((d, i) => { tone('sine', 2900 + i * 90, t + d, 0.9, 0.05); tone('sine', 4300 + i * 60, t + d, 0.5, 0.025); }); break;
      case 'nyaa': { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 3; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(780, t + 0.15); o.frequency.linearRampToValueAtTime(460, t + 0.45); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.55); break; }
      case 'drawer': burst(t, 0.35, 'lowpass', 500, 0.12, 1, 0.05); tone('sine', 90, t + 0.3, 0.1, 0.08); break;
    }
  }
  // 待合室のしずかな響き
  function ambience(on) {
    if (!ac) return;
    if (on && !room) {
      const g = ac.createGain(); g.gain.value = 0; g.connect(master); g.gain.setTargetAtTime(0.09, T(), 2);
      const ns = [60, 64, 67, 71, 74].map((m, i) => { const o = ac.createOscillator(), og = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); o.type = 'sine'; o.frequency.value = hz(m); og.gain.value = 0.12; l.frequency.value = 0.05 + i * 0.02; lg.gain.value = 0.1; l.connect(lg); lg.connect(og.gain); o.connect(og); og.connect(g); o.start(); l.start(); return o; });
      room = { g, ns };
    } else if (!on && room) { const r = room; room = null; r.g.gain.setTargetAtTime(0, T(), 0.8); setTimeout(() => r.ns.forEach((o) => { try { o.stop(); } catch (e) { } }), 3000); }
  }
  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : 0.8, T(), 0.05); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, sfx, ambience, mute, suspend };
})();
