/* =========================================================
   告知事項あり — 音（部屋の空気・ノック・心音・ささやき）
   ========================================================= */
window.KA = (() => {
  let ac = null, master = null, nbuf = null, amb = null, drone = null, beat = null;
  let muted = false, weak = false;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : .9; master.connect(comp);
    nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = nbuf.getChannelData(0); let b = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = i % 2 ? w : b * 3.5; }
  }
  const T = () => ac.currentTime;
  function src(loop) { const s = ac.createBufferSource(); s.buffer = nbuf; s.loop = !!loop; return s; }
  function filt(type, f, q) { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
  function gain(v) { const g = ac.createGain(); g.gain.value = v; return g; }
  function tone(type, f, t0, dur, peak, slideTo, dest) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + .05);
  }
  function burst(t0, dur, type, f, peak, q) {
    const s = src(), x = filt(type, f, q), g = ac.createGain();
    g.gain.setValueAtTime(peak, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + dur + .05);
  }

  /* 部屋の空気（ずっと鳴っている） */
  function ambient(on, level) {
    if (!ac) return;
    if (!amb) {
      const s = src(true), x = filt('lowpass', 160), g = gain(0);
      s.connect(x); x.connect(g); g.connect(master); s.start();
      const h = ac.createOscillator(), hg = gain(0); h.type = 'sine'; h.frequency.value = 50; h.connect(hg); hg.connect(master); h.start();
      amb = { g, hg };
    }
    amb.g.gain.setTargetAtTime(on ? .08 * (level || 1) : 0, T(), .6);
    amb.hg.gain.setTargetAtTime(on ? .012 : 0, T(), .6);
  }
  /* 緊張（0〜3） */
  function tension(lv) {
    if (!ac) return;
    if (!drone) {
      const g = gain(0), x = filt('lowpass', 300); x.connect(g); g.connect(master);
      const os = [55, 55.8, 82.6, 116.5].map((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(x); o.start(); return o; });
      const lfo = ac.createOscillator(), lg = gain(90); lfo.frequency.value = .09; lfo.connect(lg); lg.connect(x.frequency); lfo.start();
      drone = { g, x, os };
    }
    drone.g.gain.setTargetAtTime([0, .025, .05, .085][lv] || 0, T(), 1.5);
    drone.x.frequency.setTargetAtTime([200, 260, 420, 700][lv] || 200, T(), 1.5);
  }
  function heart(on, bpm) {
    if (!ac) return;
    if (beat) { clearInterval(beat); beat = null; }
    if (!on) return;
    const one = () => { const t = T(); tone('sine', 60, t, .18, .5, 38); tone('sine', 55, t + .2, .16, .35, 36); };
    one(); beat = setInterval(one, 60000 / (bpm || 90));
  }

  /* 効果音 */
  function sfx(name, opt) {
    if (!ac) return;
    const t = T(), k = weak ? .35 : 1;
    switch (name) {
      case 'ping': tone('sine', 1320, t, .12, .08); tone('sine', 1760, t + .07, .14, .06); break;
      case 'type': burst(t, .03, 'highpass', 3000, .04); break;
      case 'step': burst(t, .09, 'lowpass', 500, .18); break;
      case 'key': burst(t, .05, 'highpass', 4000, .2); burst(t + .12, .06, 'highpass', 3000, .22); tone('square', 900, t + .14, .04, .05); break;
      case 'door': { const o = ac.createOscillator(), x = filt('bandpass', 700, 8), g = gain(0); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(140, t + .5); o.frequency.linearRampToValueAtTime(80, t + 1.1); g.gain.linearRampToValueAtTime(.12, t + .1); g.gain.linearRampToValueAtTime(0, t + 1.2); o.connect(x); x.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3); break; }
      case 'knock': { const n = (opt && opt.n) || 3, iv = (opt && opt.iv) || .38, loud = (opt && opt.loud) || .7; for (let i = 0; i < n; i++) { tone('sine', 78, t + i * iv, .22, loud, 52); burst(t + i * iv, .08, 'lowpass', 900, loud * .5); } break; }
      case 'hollow': for (let i = 0; i < 3; i++) { tone('triangle', 190, t + i * .3, .25, .3, 150); burst(t + i * .3, .06, 'bandpass', 1400, .15, 3); } break;
      case 'static': burst(t, (opt && opt.dur) || .8, 'highpass', 1200, .25 * k + .05); break;
      case 'click': burst(t, .02, 'highpass', 2000, .3); break;
      case 'whisper': { const d = (opt && opt.dur) || 2.2; for (let i = 0; i < 7; i++) { const s = src(), x = filt('bandpass', 1800 + Math.random() * 1600, 6), g = gain(0); const t0 = t + i * d / 7; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.07, t0 + .08); g.gain.linearRampToValueAtTime(0, t0 + d / 7); s.connect(x); x.connect(g); g.connect(master); s.start(t0, Math.random()); s.stop(t0 + d / 7 + .05); } break; }
      case 'sting': {
        const d = 1.6;
        [0, 1, 6, 11, 13].forEach((st) => { const o = ac.createOscillator(), g = gain(0); o.type = 'sawtooth'; o.frequency.value = 220 * Math.pow(2, st / 12) * (1 + (Math.random() - .5) * .01); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09 * k, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05); });
        burst(t, .5, 'highpass', 800, .35 * k); tone('sine', 45, t, 1.2, .6 * k, 30); break;
      }
      case 'thud': tone('sine', 50, t, .5, .8 * k + .1, 30); burst(t, .2, 'lowpass', 400, .5 * k); break;
      case 'drip': tone('sine', 1500, t, .08, .06, 900); break;
      case 'chain': for (let i = 0; i < 5; i++) burst(t + i * .07, .05, 'bandpass', 3500 + Math.random() * 1500, .15, 5); break;
      case 'creak': { const o = ac.createOscillator(), x = filt('bandpass', 500, 10), g = gain(0); o.type = 'sawtooth'; o.frequency.setValueAtTime(60, t); o.frequency.linearRampToValueAtTime(90, t + .8); g.gain.linearRampToValueAtTime(.1, t + .1); g.gain.linearRampToValueAtTime(0, t + .9); o.connect(x); x.connect(g); g.connect(master); o.start(t); o.stop(t + 1); break; }
      case 'screw': for (let i = 0; i < 6; i++) burst(t + i * .08, .03, 'bandpass', 2500, .12, 8); break;
      case 'fall': burst(t, .7, 'lowpass', 300, .6); tone('sine', 70, t, .5, .5, 40); break;
      case 'breath': { const s = src(), x = filt('bandpass', 900, 1.2), g = gain(0); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .7); g.gain.linearRampToValueAtTime(0, t + 1.6); s.connect(x); x.connect(g); g.connect(master); s.start(t); s.stop(t + 1.7); break; }
      case 'end': tone('sine', 440, t, .4, .1); tone('sine', 330, t + .3, .6, .1); break;
    }
  }
  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : .9, T(), .05); }
  function setWeak(v) { weak = v; }
  function stopAll() { heart(false); tension(0); ambient(false); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, ambient, tension, heart, sfx, mute, setWeak, stopAll, suspend };
})();
