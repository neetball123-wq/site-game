/* =========================================================
   ツブのとっておき — 音（WebAudio で合成。ファイルは使わない）
   効果音と、オルゴールの子守うた（時期ごとに速さと音色が変わる）
   ========================================================= */
(function (G) {
  'use strict';
  let ac = null, out = null, musGain = null, on = true, cur = null, timer = null;
  const KEY = 'tsubu.snd';
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = G.AudioContext || G.webkitAudioContext; if (!AC) return false;
    ac = new AC();
    out = ac.createGain(); out.gain.value = on ? 0.9 : 0; out.connect(ac.destination);
    musGain = ac.createGain(); musGain.gain.value = 0.32; musGain.connect(out);
    return true;
  }
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const N = (s) => { // 'C5' → midi
    const m = /^([A-G])(#|b)?(\d)$/.exec(s); if (!m) return 60;
    return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };

  // 音ひとつ
  function tone(f, t, d, o) {
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
    const v = o.v || 0.12;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(o.dest || out); osc.start(t); osc.stop(t + d + 0.02);
  }
  function noise(t, d, o) {
    o = o || {};
    const len = Math.max(1, Math.floor(ac.sampleRate * d)), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.frequency.value = o.f || 1200;
    const g = ac.createGain(); g.gain.value = o.v || 0.2;
    s.connect(f); f.connect(g); g.connect(out); s.start(t);
  }
  // オルゴールの一音（明るい倍音つき）
  function bell(f, t, d, v) {
    tone(f, t, d, { type: 'sine', v: v, a: 0.004, dest: musGain });
    tone(f * 2, t, d * 0.6, { type: 'sine', v: v * 0.35, a: 0.004, dest: musGain });
    tone(f * 3.01, t, d * 0.25, { type: 'sine', v: v * 0.12, a: 0.002, dest: musGain });
  }

  const SFX = {
    tap(t) { tone(880, t, 0.05, { v: 0.05 }); },
    pick(t) { tone(660, t, 0.07, { v: 0.06 }); tone(990, t + 0.06, 0.09, { v: 0.06 }); },
    keep(t) { [72, 76, 79, 84].forEach((n, i) => tone(hz(n), t + i * 0.07, 0.25, { type: 'triangle', v: 0.1 })); tone(hz(96), t + 0.3, 0.4, { type: 'sine', v: 0.05 }); },
    none(t) { tone(hz(67), t, 0.18, { type: 'triangle', v: 0.08 }); tone(hz(62), t + 0.14, 0.3, { type: 'triangle', v: 0.07 }); },
    swap(t) { tone(hz(79), t, 0.1, { type: 'triangle', v: 0.08, to: hz(67) }); SFX.keep(t + 0.12); },
    release(t) { tone(hz(76), t, 0.5, { type: 'sine', v: 0.08, to: hz(64) }); },
    door(t) { noise(t, 0.08, { f: 900, v: 0.25 }); tone(110, t, 0.15, { type: 'sine', v: 0.18, to: 70 }); },
    step(t) { noise(t, 0.03, { f: 600, v: 0.08 }); },
    card(t) { noise(t, 0.12, { ft: 'bandpass', f: 2400, v: 0.12 }); },
    held(t) { tone(hz(79), t, 0.1, { type: 'triangle', v: 0.08 }); tone(hz(84), t + 0.08, 0.16, { type: 'triangle', v: 0.08 }); },
    glow(t) { [88, 91, 95].forEach((n, i) => tone(hz(n), t + i * 0.09, 0.4, { type: 'sine', v: 0.05 })); },
    event(t) { [67, 72].forEach((n, i) => tone(hz(n), t + i * 0.12, 0.35, { type: 'triangle', v: 0.08 })); },
    grow(t) {
      for (let i = 0; i < 14; i++) tone(hz(60 + [0, 4, 7, 12, 16, 19, 24][i % 7] + (i >= 7 ? 12 : 0)), t + i * 0.09, 0.5, { type: 'sine', v: 0.06 });
      noise(t, 1.4, { ft: 'highpass', f: 5000, v: 0.05 });
    },
    season(t) { tone(hz(84), t, 0.5, { type: 'sine', v: 0.05 }); tone(hz(91), t + 0.1, 0.6, { type: 'sine', v: 0.04 }); },
    pulse(t) { tone(hz(72), t, 0.6, { type: 'sine', v: 0.1 }); tone(hz(79), t + 0.02, 0.6, { type: 'sine', v: 0.05 }); },
    fall(t) { tone(hz(96), t, 1.2, { type: 'sine', v: 0.05, to: hz(84) }); },
    roll(t) { noise(t, 0.03, { f: 380, v: 0.05 }); },
    notice(t) { tone(hz(86), t, 0.06, { type: 'square', v: 0.03 }); tone(hz(93), t + 0.06, 0.09, { type: 'square', v: 0.03 }); },
    hop(t) { tone(hz(70), t, 0.11, { type: 'square', v: 0.03, to: hz(82) }); },
    rustle(t) { for (let i = 0; i < 5; i++) noise(t + i * 0.08, 0.07, { ft: 'bandpass', f: 2600 + (i % 2) * 900, v: 0.09 }); },
    whoosh(t) { noise(t, 0.7, { ft: 'bandpass', f: 900, v: 0.08 }); tone(hz(84), t + 0.5, 0.4, { type: 'sine', v: 0.04 }); },
    dig(t) { for (let i = 0; i < 3; i++) noise(t + i * 0.14, 0.07, { f: 520, v: 0.14 }); },
    hello(t) { tone(hz(81), t, 0.55, { type: 'sine', v: 0.08 }); tone(hz(77), t + 0.3, 0.8, { type: 'sine', v: 0.08 }); },
    tune(t, v) { const k = v === undefined ? 1 : v; [84, 88, 91, 88, 86, 83, 84].forEach((n, i) => tone(hz(n), t + i * 0.15, 0.4, { type: 'sine', v: 0.06 * k })); },
    giggle(t) { [84, 88, 84, 91].forEach((n, i) => tone(hz(n), t + i * 0.06, 0.08, { type: 'square', v: 0.035 })); },
  };
  function play(name, v) {
    if (!on || !init() || !SFX[name]) return;
    try { SFX[name](ac.currentTime + 0.01, v); } catch (e) { }
  }

  /* ---- 子守うた（オリジナル） ---- */
  // [音名, 拍]  '-' は休み
  const A = [['E5', 1], ['G5', 1], ['C6', 1], ['B5', 1], ['A5', 1], ['G5', 1], ['A5', 1], ['F5', 1], ['D5', 1], ['G5', 3],
    ['E5', 1], ['G5', 1], ['C6', 1], ['D6', 1], ['C6', 1], ['B5', 1], ['A5', 1], ['B5', 1], ['D6', 1], ['C6', 3]];
  const B = [['A5', 1], ['C6', 1], ['E6', 1], ['D6', 1], ['C6', 1], ['B5', 1], ['C6', 1], ['A5', 1], ['F5', 1], ['E5', 3],
    ['F5', 1], ['A5', 1], ['C6', 1], ['B5', 1], ['G5', 1], ['E5', 1], ['F5', 1], ['G5', 1], ['B5', 1], ['C6', 3]];
  const BASS_A = ['C4', 'G3', 'F3', 'G3', 'C4', 'G3', 'F3', 'C4'];
  const BASS_B = ['A3', 'G3', 'F3', 'A3', 'F3', 'C4', 'D4', 'C4'];
  const SONGS = {
    s1: { bpm: 66, parts: [[A, BASS_A]], v: 0.09, oct: 0 },
    s2: { bpm: 92, parts: [[A, BASS_A], [B, BASS_B]], v: 0.08, oct: 0 },
    s3: { bpm: 80, parts: [[B, BASS_B], [A, BASS_A]], v: 0.08, oct: -12 },
    s4: { bpm: 72, parts: [[A, BASS_A], [B, BASS_B]], v: 0.085, oct: -12 },
    night: { bpm: 54, parts: [[A, BASS_A]], v: 0.06, oct: 12, sparse: 1 },
    end: { bpm: 60, parts: [[A, BASS_A], [B, BASS_B], [A, BASS_A]], v: 0.09, oct: 0 },
  };
  function music(name) {
    if (cur === name) return;
    cur = name; clearTimeout(timer);
    if (!name || !on || !init()) return;
    const sg = SONGS[name]; if (!sg) return;
    const beat = 60 / sg.bpm;
    let t = ac.currentTime + 0.3;
    const loop = () => {
      if (cur !== name) return;
      for (const [mel, bass] of sg.parts) {
        let bt = 0;
        mel.forEach(([n, d], i) => {
          if (n !== '-' && !(sg.sparse && i % 2)) bell(hz(N(n) + sg.oct), t + bt * beat, Math.min(2.4, d * beat * 1.8), sg.v);
          bt += d;
        });
        bass.forEach((n, i) => bell(hz(N(n) - 12 + sg.oct), t + i * 3 * beat, 3 * beat * 1.2, sg.v * 0.55));
        t += 24 * beat;
      }
      timer = setTimeout(loop, Math.max(200, (t - ac.currentTime - 1.5) * 1000));
    };
    loop();
  }
  function setOn(v) {
    on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { }
    if (ac) out.gain.setTargetAtTime(v ? 0.9 : 0, ac.currentTime, 0.05);
    if (v) { const c = cur; cur = null; music(c); } else clearTimeout(timer);
  }
  function fadeMusic(to, sec) { if (ac) musGain.gain.setTargetAtTime(to, ac.currentTime, sec || 0.5); }

  G.TSND = { play, music, init, setOn, isOn: () => on, fadeMusic, cur: () => cur };
})(window);
