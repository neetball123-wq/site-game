/* =========================================================
   ヤドカリと七つの灯台 — 音（すべてその場で合成）
   ========================================================= */
window.YS = (() => {
  'use strict';
  let ac = null, master = null, sfxBus = null, amb = null, nbuf = null, muted = false, musicT = null;
  const T = () => ac.currentTime;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(comp);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    const n = ac.sampleRate * 2; nbuf = ac.createBuffer(1, n, ac.sampleRate); const d = nbuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(type, f, t0, dur, peak, att, dest, f1) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxBus); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, type, f, peak, q, att, f1) {
    const s = ac.createBufferSource(); s.buffer = nbuf; const x = ac.createBiquadFilter(); x.type = type; x.frequency.setValueAtTime(f, t0); if (f1) x.frequency.exponentialRampToValueAtTime(f1, t0 + dur); if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(sfxBus); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  const bell = (m, t, v, d) => { tone('sine', hz(m), t, d || 1.8, v); tone('sine', hz(m) * 2.76, t, 0.5, v * 0.16); tone('triangle', hz(m) * 4.1, t, 0.15, v * 0.05); };

  function sfx(name, arg) {
    if (!ac || muted) return; const t = T();
    switch (name) {
      case 'step': noise(t, 0.05, 'bandpass', 2400 + Math.random() * 600, 0.05, 2); tone('sine', 520 + Math.random() * 80, t, 0.04, 0.025); break;
      case 'climb': tone('triangle', 420, t, 0.12, 0.06, 0.005, null, 700); noise(t, 0.06, 'bandpass', 2000, 0.05, 2); break;
      case 'board': noise(t, 0.2, 'lowpass', 900, 0.1, 0, 0.01); tone('sine', 180, t, 0.18, 0.08, 0.01, null, 120); break;
      case 'bump': tone('sine', 150, t, 0.1, 0.1, 0.004, null, 90); break;
      case 'push': noise(t, 0.16, 'lowpass', 500, 0.14, 0, 0.01, 260); tone('sine', 90, t, 0.12, 0.08); break;
      case 'pushwood': noise(t, 0.14, 'bandpass', 700, 0.14, 1.2, 0.01); tone('triangle', 200, t, 0.08, 0.06, 0.004, null, 150); break;
      case 'splash': noise(t, 0.5, 'lowpass', 2600, 0.24, 0, 0.005, 400); noise(t + 0.02, 0.25, 'highpass', 3000, 0.08, 0, 0.004); tone('sine', 300, t, 0.22, 0.08, 0.004, null, 90); break;
      case 'float': noise(t, 0.35, 'lowpass', 1400, 0.14, 0, 0.01, 300); break;
      case 'fill': noise(t, 0.4, 'lowpass', 700, 0.2, 0, 0.01, 200); tone('sine', 110, t + 0.08, 0.3, 0.12, 0.01, null, 70); break;
      case 'conch': {
        const up = arg !== 0; const base = up ? hz(55) : hz(52);
        const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = base; o2.frequency.value = base * 1.005;
        f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1300, t + 0.35); f.frequency.linearRampToValueAtTime(600, t + 1.1); f.Q.value = 3;
        lfo.frequency.value = 5.2; lg.gain.value = 3; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
        o.frequency.setValueAtTime(base * 0.94, t); o.frequency.linearRampToValueAtTime(base, t + 0.15);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.12); g.gain.setValueAtTime(0.11, t + 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o2.start(t); lfo.start(t); o.stop(t + 1.3); o2.stop(t + 1.3); lfo.stop(t + 1.3);
        noise(t + 0.2, 1.1, 'bandpass', up ? 500 : 900, 0.06, 0.7, 0.3, up ? 900 : 400);
        break;
      }
      case 'drift': noise(t, 0.6, 'bandpass', 800, 0.08, 0.8, 0.1, 1600); break;
      case 'gate': tone('triangle', 160, t, 0.18, 0.08, 0.004, null, 110); noise(t, 0.12, 'bandpass', 600, 0.08, 2); break;
      case 'lit': [0, 4, 7, 12].forEach((m, k) => bell(76 + m, t + k * 0.09, 0.07, 1.6)); break;
      case 'win': [0, 4, 7, 11, 14].forEach((m, k) => bell(72 + m, t + 0.15 + k * 0.12, 0.06, 2.2)); break;
      case 'glass': [0, 7, 12].forEach((m, k) => bell(88 + m, t + k * 0.06, 0.05, 0.8)); break;
      case 'gull': for (let k = 0; k < 3; k++) tone('sawtooth', 1600 - k * 90, t + k * 0.13, 0.1, 0.018, 0.01, null, 1100); break;
      case 'nope': tone('sine', 220, t, 0.1, 0.06); tone('sine', 196, t + 0.11, 0.12, 0.06); break;
      case 'undo': tone('sine', 660, t, 0.06, 0.035, 0.004, null, 500); break;
      case 'tap': tone('sine', 880, t, 0.05, 0.035); break;
      case 'page': noise(t, 0.3, 'bandpass', 3000, 0.06, 0.8, 0.05); break;
      case 'cork': tone('sine', 700, t, 0.08, 0.1, 0.002, null, 300); noise(t, 0.05, 'highpass', 2000, 0.08); break;
      case 'star': [0, 5, 9, 12, 16].forEach((m, k) => bell(79 + m, t + k * 0.05, 0.04, 0.6)); break;
      case 'spout': noise(t, 0.7, 'bandpass', 1200, 0.1, 0.6, 0.02, 3000); break;
    }
  }

  // 波の音（ずっと）
  function ambience(on, night) {
    if (!ac) return;
    if (!on) { if (amb) { const a = amb; amb = null; a.g.gain.setTargetAtTime(0.0001, T(), 0.4); setTimeout(() => { try { a.s.stop(); a.l.stop(); } catch (e) { } }, 1600); } return; }
    if (amb) return;
    const s = ac.createBufferSource(); s.buffer = nbuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
    const g = ac.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(night ? 0.05 : 0.07, T(), 1.2);
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 0.11; lg.gain.value = 260; l.connect(lg); lg.connect(f.frequency);
    s.connect(f); f.connect(g); g.connect(master); s.start(); l.start();
    amb = { s, g, l };
  }

  // 海図のオルゴール（ときどき鳴る）
  function music(on) {
    clearTimeout(musicT); musicT = null;
    if (!on || !ac) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const play = () => {
      if (!ac || muted) { musicT = setTimeout(play, 3000); return; }
      const t = T() + 0.05, root = 67;
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) bell(root + scale[Math.floor(Math.random() * scale.length)], t + k * 0.42, 0.028, 2.4);
      musicT = setTimeout(play, 4200 + Math.random() * 3500);
    };
    musicT = setTimeout(play, 800);
  }

  function mute(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, T(), 0.05); }
  function suspend(h) { if (!ac) return; if (h) ac.suspend(); else ac.resume(); }
  return { init, sfx, ambience, music, mute, suspend, get muted() { return muted; } };
})();
