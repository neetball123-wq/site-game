/* =========================================================
   奈落の証人 — 音（すべてその場で合成）
   ========================================================= */
window.NS = (() => {
  'use strict';
  let ac = null, master = null, nbuf = null, muted = false, padG = null, padNodes = [], mood = '';
  const T = () => ac.currentTime;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
    const n = ac.sampleRate * 2; nbuf = ac.createBuffer(1, n, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    padG = ac.createGain(); padG.gain.value = 0; padG.connect(master);
  }
  function tone(type, f, t0, dur, peak, dest, att, slide) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function burst(t0, dur, type, f, peak, q, dest, att) {
    const s = ac.createBufferSource(); s.buffer = nbuf; const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(dest || master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  // オルゴール
  function box(m, t0, v, dest) { tone('sine', hz(m), t0, 1.6, v, dest, 0.004); tone('sine', hz(m) * 2.01, t0, 0.5, v * 0.25, dest, 0.004); tone('triangle', hz(m) * 4.2, t0, 0.12, v * 0.08, dest, 0.002); }
  // ピアノふう
  function pno(m, t0, dur, v, dest) { tone('triangle', hz(m), t0, dur, v, dest, 0.008); tone('sine', hz(m) * 2, t0, dur * 0.6, v * 0.3, dest, 0.008); }

  /* ---------- 効果音 ---------- */
  function sfx(name) {
    if (!ac || muted) return; const t = T();
    switch (name) {
      case 'hyoshigi': [0, 0.34].forEach((d) => { burst(t + d, 0.09, 'bandpass', 2300, 0.5, 9); tone('sine', 1850, t + d, 0.16, 0.14); tone('sine', 3100, t + d, 0.06, 0.05); }); break;
      case 'ki': burst(t, 0.07, 'bandpass', 2600, 0.35, 10); tone('sine', 2100, t, 0.1, 0.1); break;
      case 'thud': tone('sine', 70, t, 0.6, 0.5, null, 0.004, 32); burst(t, 0.25, 'lowpass', 400, 0.25); break;
      case 'sting': [[50, 0.18], [53, 0.14], [56, 0.12], [62, 0.1]].forEach(([m, v]) => { tone('sawtooth', hz(m), t, 1.6, v * 0.25, null, 0.02); }); tone('sine', hz(86), t, 1.2, 0.04); break;
      case 'objection': burst(t, 0.12, 'highpass', 1800, 0.35); [36, 43, 48, 51].forEach((m) => pno(m, t + 0.02, 1.6, 0.12)); tone('sine', hz(84), t + 0.02, 0.9, 0.05); break;
      case 'ok': [60, 64, 67, 72, 76].forEach((m, i) => pno(m, t + i * 0.07, 1.4, 0.06)); break;
      case 'miss': pno(40, t, 0.6, 0.12); pno(39, t + 0.12, 0.8, 0.1); break;
      case 'press': burst(t, 0.2, 'bandpass', 1200, 0.08, 1.2, null, 0.03); tone('sine', 660, t, 0.18, 0.04); break;
      case 'page': burst(t, 0.28, 'bandpass', 2800, 0.06, 0.8, null, 0.06); break;
      case 'pen': for (let i = 0; i < 8; i++) burst(t + i * 0.06 + Math.random() * 0.02, 0.05, 'bandpass', 3800 + Math.random() * 900, 0.04, 3); break;
      case 'click': burst(t, 0.02, 'bandpass', 2400, 0.06, 2); break;
      case 'tick': tone('square', 1800, t, 0.02, 0.03); break;
      case 'get': [79, 84, 88].forEach((m, i) => box(m, t + i * 0.08, 0.06)); break;
      case 'curtain': burst(t, 2.2, 'lowpass', 600, 0.12, 0.6, null, 0.8); break;
      case 'tube': burst(t, 0.8, 'bandpass', 420, 0.1, 3, null, 0.1); tone('sine', 210, t, 0.7, 0.03, null, 0.1); break;
      case 'voice': burst(t, 1.8, 'bandpass', 700, 0.03, 5, null, 0.4); tone('sine', 180, t + 0.2, 1.2, 0.012, null, 0.3, 150); break;
    }
  }

  /* ---------- 月見のワルツ（オルゴール） ---------- */
  const WALTZ = [[0, 72], [1, 76], [2, 79], [3, 84], [4, 83], [5, 79], [6, 81], [7, 77], [8, 74], [9, 76], [10, 72], [11, 71], [12, 72], [13, 76], [14, 79], [15, 81], [16, 79], [17, 76], [18, 77], [19, 74], [20, 71], [21, 72]];
  const BASS = [48, 43, 45, 41, 43, 48, 41, 43];
  let waltzStop = null;
  function waltz(opt) {
    if (!ac) return; stopWaltz(); opt = opt || {};
    const g = ac.createGain(); g.gain.value = opt.vol || 0.8; g.connect(master);
    const beat = 60 / 150, t0 = T() + 0.1, loops = opt.loops || 1;
    for (let L = 0; L < loops; L++) {
      const off = L * 24 * beat;
      WALTZ.forEach(([b, m]) => box(m, t0 + off + b * beat, 0.07, g));
      for (let b = 0; b < 24; b += 3) { const r = BASS[(b / 3) % 8]; box(r, t0 + off + b * beat, 0.05, g); box(r + 7, t0 + off + (b + 1) * beat, 0.025, g); box(r + 12, t0 + off + (b + 2) * beat, 0.025, g); }
    }
    let th = null;
    if (opt.thudAt != null) th = setTimeout(() => sfx('thud'), (opt.thudAt * beat) * 1000 + 100);
    const tm = setTimeout(() => stopWaltz(), loops * 24 * beat * 1000 + 1800);
    waltzStop = () => { clearTimeout(tm); if (th) clearTimeout(th); try { g.gain.setTargetAtTime(0, T(), 0.2); setTimeout(() => g.disconnect(), 800); } catch (e) { } waltzStop = null; };
  }
  function stopWaltz() { if (waltzStop) waltzStop(); }

  /* ---------- うしろの持続音 ---------- */
  const MOODS = { calm: [45, 52, 57, 60], tense: [40, 46, 52, 55], dark: [38, 45, 50, 53], warm: [48, 55, 60, 64] };
  function pad(m) {
    if (!ac || m === mood) return; mood = m;
    padNodes.forEach((n) => { try { n.g.gain.setTargetAtTime(0, T(), 1.2); n.o.stop(T() + 4); } catch (e) { } }); padNodes = [];
    if (!m) { padG.gain.setTargetAtTime(0, T(), 0.8); return; }
    padG.gain.setTargetAtTime(0.16, T(), 1.5);
    (MOODS[m] || MOODS.calm).forEach((n, i) => {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = (i - 1.5) * 6; f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0; g.gain.setTargetAtTime(0.06, T(), 2);
      l.frequency.value = 0.07 + i * 0.03; lg.gain.value = 160; l.connect(lg); lg.connect(f.frequency); l.start();
      o.connect(f); f.connect(g); g.connect(padG); o.start(); padNodes.push({ o, g });
    });
  }
  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : 0.8, T(), 0.05); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, sfx, waltz, stopWaltz, pad, mute, suspend };
})();
