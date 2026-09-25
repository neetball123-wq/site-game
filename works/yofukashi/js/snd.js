/* =========================================================
   深夜ラジオの投稿職人 — 音（すべてその場で合成）
   ========================================================= */
window.YA = (() => {
  'use strict';
  let ac = null, master = null, nbuf = null, muted = false;
  let bedG = null, bedOn = false, bedT = null, bedStep = 0, bedNext = 0, bedDuck = 1;
  let radioG = null, statN = null, statG = null, statF = null, whis = null, whisG = null, radioOn = false, stT = null, stKind = '';
  let hissN = null, hissG = null, tapeMode = '', songStop = null, ringT = null;
  const T = () => ac.currentTime;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
    const n = ac.sampleRate * 2; nbuf = ac.createBuffer(1, n, ac.sampleRate); const d = nbuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    bedG = ac.createGain(); bedG.gain.value = 0; bedG.connect(master);
    radioG = ac.createGain(); radioG.gain.value = 0; radioG.connect(master);
    // ラジオの雑音
    statN = ac.createBufferSource(); statN.buffer = nbuf; statN.loop = true;
    statF = ac.createBiquadFilter(); statF.type = 'bandpass'; statF.frequency.value = 2400; statF.Q.value = 0.6;
    statG = ac.createGain(); statG.gain.value = 0; statN.connect(statF); statF.connect(statG); statG.connect(radioG); statN.start();
    whis = ac.createOscillator(); whis.type = 'sine'; whis.frequency.value = 1200; whisG = ac.createGain(); whisG.gain.value = 0; whis.connect(whisG); whisG.connect(radioG); whis.start();
    // テープのヒス
    hissN = ac.createBufferSource(); hissN.buffer = nbuf; hissN.loop = true;
    const hf = ac.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 3500;
    hissG = ac.createGain(); hissG.gain.value = 0; hissN.connect(hf); hf.connect(hissG); hissG.connect(master); hissN.start();
  }

  function tone(type, f, t0, dur, peak, dest, att, slide) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05); return o;
  }
  function burst(t0, dur, type, f, peak, q, dest, att) {
    const s = ac.createBufferSource(); s.buffer = nbuf; const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(x); x.connect(g); g.connect(dest || master); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  // エレピ風のひとつの音
  function ep(f, t0, dur, v, dest, wow) {
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = f; o2.frequency.value = f * 2.001;
    if (wow) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 0.6 + Math.random() * 0.3; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); l.start(t0); l.stop(t0 + dur + 0.1); }
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.012); g.gain.exponentialRampToValueAtTime(v * 0.35, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest || master); o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- 放送のBGM（うしろで流れる、やわらかいコード） ---------- */
  const BED = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  function bed(on) {
    if (!ac) return; bedOn = on;
    bedG.gain.setTargetAtTime(on ? 0.5 * bedDuck : 0, T(), 0.6);
    if (on && !bedT) { bedNext = T() + 0.1; bedT = setInterval(bedTick, 120); }
  }
  function duck(v) { bedDuck = v; if (ac && bedOn) bedG.gain.setTargetAtTime(0.5 * v, T(), 0.4); }
  function bedTick() {
    if (!ac) return;
    if (!bedOn && bedG.gain.value < 0.002) { clearInterval(bedT); bedT = null; return; }
    const beat = 60 / 68;
    while (bedNext < T() + 0.4) {
      const ch = BED[Math.floor(bedStep / 4) % 4], k = bedStep % 4;
      if (k === 0) { ep(hz(ch[0] - 12), bedNext, beat * 3.6, 0.05, bedG); ch.forEach((m, i) => ep(hz(m), bedNext + i * 0.03, beat * 3.4, 0.028, bedG)); }
      else if (k === 2) ep(hz(ch[(bedStep >> 2) % 3 + 1] + 12), bedNext, beat * 1.6, 0.018, bedG);
      bedNext += beat; bedStep++;
    }
  }

  /* ---------- ジングル・時報・効果音 ---------- */
  function jingle() { if (!ac || muted) return; const t = T() + 0.05; [67, 71, 74, 79].forEach((m, i) => ep(hz(m), t + i * 0.16, 0.9, 0.09)); [55, 62, 71, 74].forEach((m) => ep(hz(m), t + 0.7, 2.2, 0.05)); tone('sine', hz(86), t + 0.7, 1.6, 0.02); }
  function pips() { if (!ac || muted) return; const t = T() + 0.05; [0, 1, 2].forEach((i) => tone('sine', 440, t + i, 0.12, 0.12)); tone('sine', 880, t + 3, 1.1, 0.13); }
  function sfx(name) {
    if (!ac || muted) return; const t = T();
    switch (name) {
      case 'card': burst(t, 0.18, 'bandpass', 3200, 0.05, 0.9); burst(t + 0.06, 0.12, 'highpass', 5000, 0.02); break;
      case 'page': burst(t, 0.3, 'bandpass', 2600, 0.05, 0.7, null, 0.08); break;
      case 'peel': burst(t, 0.35, 'bandpass', 1800, 0.05, 2, null, 0.02); for (let i = 0; i < 6; i++) burst(t + i * 0.05, 0.03, 'highpass', 4000, 0.03); break;
      case 'pen': for (let i = 0; i < 9; i++) burst(t + i * 0.07 + Math.random() * 0.03, 0.06, 'bandpass', 3800 + Math.random() * 900, 0.03, 3); break;
      case 'talk': tone('sine', 1000, t, 0.09, 0.05); tone('sine', 1000, t + 0.12, 0.05, 0.03); break;
      case 'click': burst(t, 0.025, 'bandpass', 2000, 0.07, 2); break;
      case 'clunk': tone('sine', 120, t, 0.12, 0.12, null, 0.003, 70); burst(t, 0.05, 'lowpass', 900, 0.08); break;
      case 'ok': [79, 84].forEach((m, i) => ep(hz(m), t + i * 0.12, 0.8, 0.05)); break;
      case 'no': tone('sine', 330, t, 0.25, 0.04); tone('sine', 294, t + 0.12, 0.35, 0.04); break;
      case 'mail': [84, 88, 91].forEach((m, i) => ep(hz(m), t + i * 0.1, 0.9, 0.04)); break;
      case 'needle': burst(t, 0.08, 'lowpass', 600, 0.2); for (let i = 0; i < 10; i++) burst(t + 0.1 + Math.random() * 1.2, 0.012, 'highpass', 3000, 0.05); break;
      case 'eject': tone('sine', 200, t, 0.1, 0.08, null, 0.003, 120); burst(t, 0.1, 'bandpass', 1400, 0.06, 1.5); break;
      case 'stamp': burst(t, 0.06, 'lowpass', 700, 0.1); break;
    }
  }
  function ring(on) {
    if (!ac) return;
    if (on && !ringT) { const r = () => { if (muted) return; const t = T(); for (let i = 0; i < 16; i++) { tone('square', i % 2 ? 1300 : 1600, t + i * 0.05, 0.05, 0.02); tone('square', i % 2 ? 1300 : 1600, t + 0.5 + i * 0.05, 0.05, 0.02); } }; r(); ringT = setInterval(r, 2600); }
    if (!on && ringT) { clearInterval(ringT); ringT = null; }
  }

  /* ---------- 曲 ---------- */
  // となりの窓の雪（G長調）。[拍, MIDI, 長さ]
  const MEL = [[0, 71, 1], [1, 69, 1], [2, 67, 1], [3, 69, 1], [4, 71, 2], [6, 74, 2], [8, 72, 1], [9, 71, 1], [10, 69, 1], [11, 67, 1], [12, 69, 4],
    [16, 71, 1], [17, 69, 1], [18, 67, 1], [19, 64, 1], [20, 62, 2], [22, 67, 2], [24, 69, 1], [25, 71, 1], [26, 72, 1], [27, 71, 1], [28, 67, 4]];
  const SONG_CH = [[43, 59, 62, 66], [40, 55, 59, 62], [36, 55, 59, 64], [38, 57, 62, 66], [43, 59, 62, 66], [40, 55, 59, 62], [36, 55, 60, 64], [38, 54, 57, 62]];
  function recMel(seed) { // ほかのレコードの試し聞き用
    let s = seed * 97 + 13; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const sc = [0, 2, 4, 5, 7, 9, 11, 12], root = 60 + Math.floor(r() * 5); const out = []; let p = 3;
    for (let b = 0; b < 12; b++) { p = Math.max(0, Math.min(7, p + Math.floor(r() * 3) - 1)); out.push([b, root + sc[p], 1]); }
    return { mel: out, root };
  }
  function song(opt) {
    if (!ac) return () => { };
    stopSong();
    opt = opt || {}; const g = ac.createGain(); g.gain.value = opt.vol || 0.9; g.connect(master);
    const beat = 60 / (opt.bpm || 76), t0 = T() + 0.3, wow = !!opt.tape;
    let mel = MEL, chords = SONG_CH, len = 32;
    if (opt.seed) { const m = recMel(opt.seed); mel = m.mel; chords = [[m.root - 24, m.root, m.root + 4, m.root + 7], [m.root - 19, m.root + 5, m.root + 9, m.root + 12], [m.root - 17, m.root + 7, m.root + 11, m.root + 14]]; len = 12; }
    const lim = opt.bars ? opt.bars * 4 : len;
    mel.forEach(([b, m, d]) => { if (b < lim) { ep(hz(m + 12), t0 + b * beat, d * beat * 1.4, 0.07, g, wow); tone('sine', hz(m + 24), t0 + b * beat, 0.5, 0.008, g); } });
    for (let b = 0; b < lim; b += 4) { const ch = chords[(b / 4) % chords.length]; ep(hz(ch[0]), t0 + b * beat, beat * 4, 0.06, g, wow); ch.slice(1).forEach((m, i) => { ep(hz(m), t0 + b * beat + i * 0.04, beat * 3.8, 0.025, g, wow); ep(hz(m), t0 + (b + 2) * beat, beat * 1.8, 0.014, g, wow); }); }
    // レコードのぷちぷち
    let crT = null; if (!opt.tape) { crT = setInterval(() => { if (!ac) return; const t = T(); for (let i = 0; i < 3; i++) if (Math.random() < 0.6) burst(t + Math.random() * 0.2, 0.01, 'highpass', 2500 + Math.random() * 3000, 0.02 + Math.random() * 0.03, 0, g); }, 200); }
    const dur = (lim + 3) * beat;
    const stop = () => { if (crT) clearInterval(crT); crT = null; try { g.gain.setTargetAtTime(0, T(), 0.4); setTimeout(() => g.disconnect(), 1500); } catch (e) { } };
    const tm = setTimeout(stop, dur * 1000 + 400);
    songStop = () => { clearTimeout(tm); stop(); songStop = null; };
    return songStop;
  }
  function stopSong() { if (songStop) songStop(); }

  /* ---------- テープ ---------- */
  let tapeSong = null, chirpT = null;
  function tape(mode, songPart) {
    if (!ac) return; tapeMode = mode;
    hissG.gain.setTargetAtTime(mode === 'play' ? 0.012 : 0, T(), 0.05);
    if (chirpT) { clearInterval(chirpT); chirpT = null; }
    if (mode === 'ff' || mode === 'rew') { chirpT = setInterval(() => { if (muted) return; const t = T(); for (let i = 0; i < 5; i++) tone('square', 700 + Math.random() * 1600, t + i * 0.04, 0.035, 0.008); burst(t, 0.2, 'bandpass', 5000, 0.01, 1); }, 200); }
    if (mode === 'play' && songPart && !tapeSong) { tapeSong = song({ tape: true, bpm: 70, vol: 0.55, bars: 4 }); }
    if ((mode !== 'play' || !songPart) && tapeSong) { tapeSong(); tapeSong = null; }
  }

  /* ---------- ラジオ（ダイヤル） ---------- */
  function radio(on, noise, whistle, kind) {
    if (!ac) return; radioOn = on; noise = noise || 0; whistle = whistle || 0;
    radioG.gain.setTargetAtTime(on ? 1 : 0, T(), 0.05);
    statG.gain.setTargetAtTime(on ? 0.02 + noise * 0.07 : 0, T(), 0.05);
    statF.frequency.setTargetAtTime(1800 + noise * 1500, T(), 0.1);
    whisG.gain.setTargetAtTime(on && whistle > 0 ? 0.012 * (1 - noise * 0.5) : 0, T(), 0.05);
    if (whistle > 0) whis.frequency.setTargetAtTime(300 + whistle * 2600, T(), 0.05);
    if (kind !== stKind) { stKind = kind; if (stT) { clearInterval(stT); stT = null; } if (on && kind) { stationTick(kind, noise); stT = setInterval(() => stationTick(kind), 1600); } }
    if (!on && stT) { clearInterval(stT); stT = null; stKind = ''; }
  }
  function stationTick(kind) {
    if (!ac || muted || !radioOn) return; const t = T(), d = radioG;
    const voice = (n) => { for (let i = 0; i < n; i++) { const f = 160 + Math.random() * 90; tone('sawtooth', f, t + i * 0.16, 0.14, 0.006, d, 0.03); burst(t + i * 0.16, 0.12, 'bandpass', 700 + Math.random() * 1400, 0.012, 4, d); } };
    if (kind === 'ship') { voice(7); if (Math.random() < 0.5) tone('sine', 92, t + 1.1, 0.9, 0.03, d, 0.2); }
    else if (kind === 'weather') { if (Math.random() < 0.3) [76, 81, 88].forEach((m, i) => ep(hz(m), t + i * 0.15, 0.6, 0.02, d)); else voice(8); }
    else if (kind === 'talk') voice(9);
    else if (kind === 'cm') { [72, 76, 79, 84].forEach((m, i) => ep(hz(m), t + i * 0.1, 0.4, 0.025, d)); voice(4); }
    else if (kind === 'self') { ep(hz(65), t, 1.4, 0.02, d); ep(hz(69), t + 0.4, 1.2, 0.015, d); }
  }

  function mute(v) { muted = v; if (master) master.gain.setTargetAtTime(v ? 0 : 0.8, T(), 0.05); if (v) ring(false); }
  function suspend(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  return { init, bed, duck, jingle, pips, sfx, ring, song, stopSong, tape, radio, mute, suspend, get ok() { return !!ac; } };
})();
