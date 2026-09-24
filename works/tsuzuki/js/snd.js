/* =========================================================
   つづきから — 音（矩形波2つ・三角波・ノイズの、小さな音源）
   ========================================================= */
window.TSN = (() => {
  let ac = null, master = null, mus = null, fx = null, noise = null;
  let vol = 5, cur = null, timer = null, rate = 1, wobble = 0;
  const waves = [];
  const gainFor = (v) => v <= 0 ? 0 : 0.03 * v;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ac = new AC(); } catch (e) { return false; }
    master = ac.createGain(); master.gain.value = gainFor(vol); master.connect(ac.destination);
    mus = ac.createGain(); mus.gain.value = 0.85; mus.connect(master);
    fx = ac.createGain(); fx.gain.value = 1; fx.connect(master);
    [0.125, 0.25, 0.5].forEach((d) => {
      const n = 40, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d);
      waves.push(ac.createPeriodicWave(re, im));
    });
    const len = ac.sampleRate;
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const ch = noise.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return true;
  }
  const ready = () => !!ac;
  function setVol(v) {
    vol = v;
    if (master) master.gain.setTargetAtTime(gainFor(v), ac.currentTime, 0.03);
  }
  function suspend(on) { if (!ac) return; if (on) ac.suspend(); else ac.resume(); }

  /* ---------- 小さなMML ---------- */
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function parse(src) {
    const ev = []; const s = src.replace(/\|/g, ' ');
    let o = 4, l = 4, t = 0, duty = 2, v = 12, i = 0;
    const num = () => { let n = ''; while (i < s.length && /\d/.test(s[i])) n += s[i++]; return n ? +n : null; };
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (c === 'o') { i++; o = num(); continue; }
      if (c === 'l') { i++; l = num(); continue; }
      if (c === '@') { i++; duty = num(); continue; }
      if (c === 'v') { i++; v = num(); continue; }
      if (c === '>') { o++; i++; continue; }
      if (c === '<') { o--; i++; continue; }
      if ('cdefgabrksh'.includes(c)) {
        i++;
        let semi = 0;
        while ('+#-'.includes(s[i]) && s[i]) { semi += s[i] === '-' ? -1 : 1; i++; }
        const n = num(); let d = 4 / (n || l);
        if (s[i] === '.') { d *= 1.5; i++; }
        let kind = 'n', m = null;
        if (c === 'r') kind = 'r';
        else if (c === 'k' || c === 's' || c === 'h') kind = c;
        else m = 12 * (o + 1) + NOTE[c] + semi;
        if (kind !== 'r') ev.push({ t, d, m, kind, duty, v });
        t += d;
        continue;
      }
      i++;
    }
    return { ev, len: t };
  }
  const cacheP = {};
  const parsed = (id) => {
    if (cacheP[id]) return cacheP[id];
    const tr = TK.TRACKS[id];
    const ch = ['a', 'b', 'c', 'd'].map(k => tr[k] ? parse(tr[k]) : null);
    const len = Math.max(...ch.filter(Boolean).map(c => c.len));
    return (cacheP[id] = { tr, ch, len });
  };

  /* ---------- 鳴らす ---------- */
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12) * rate;
  function tone(freq, when, dur, duty, peak, dest, slide) {
    const o = ac.createOscillator(), g = ac.createGain();
    if (duty === 't') o.type = 'triangle'; else if (duty === 's') o.type = 'sine'; else o.setPeriodicWave(waves[duty == null ? 2 : duty]);
    o.frequency.setValueAtTime(freq, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, when + dur);
    if (wobble) o.detune.setValueAtTime((Math.random() - 0.5) * wobble, when);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.006);
    g.gain.setTargetAtTime(peak * 0.62, when + 0.02, 0.09);
    g.gain.setTargetAtTime(0, when + Math.max(0.02, dur * 0.92), 0.018);
    o.connect(g); g.connect(dest || fx);
    o.start(when); o.stop(when + dur + 0.12);
  }
  function hiss(when, dur, type, freq, peak, dest) {
    const src = ac.createBufferSource(); src.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(peak, when); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f); f.connect(g); g.connect(dest || fx);
    src.start(when, Math.random() * 0.5); src.stop(when + dur + 0.05);
  }
  function drum(kind, when) {
    if (kind === 'k') tone(150, when, 0.14, 's', 0.55, mus, 45);
    if (kind === 's') hiss(when, 0.12, 'bandpass', 1900, 0.32, mus);
    if (kind === 'h') hiss(when, 0.04, 'highpass', 7000, 0.14, mus);
  }

  function play(id, opt) {
    if (!ac) return;
    opt = opt || {};
    if (cur && cur.id === id && !opt.restart) return;
    stop();
    if (id == null || id < 0) return;
    const P = parsed(id);
    const beat = 60 / P.tr.t;
    cur = { id, P, beat, start: ac.currentTime + 0.06, pos: [0, 0, 0, 0], lp: [0, 0, 0, 0], once: !!P.tr.once, then: opt.then };
    timer = setInterval(pump, 40);
    pump();
  }
  function pump() {
    if (!cur) return;
    const C = cur, ahead = ac.currentTime + 0.3;
    let alive = false;
    C.P.ch.forEach((ch, k) => {
      if (!ch) return;
      for (let guard = 0; guard < 64; guard++) {
        let e = ch.ev[C.pos[k]];
        if (!e) {
          if (C.once) break;
          C.pos[k] = 0; C.lp[k]++; e = ch.ev[0];
          if (!e) break;
        }
        const when = C.start + (C.lp[k] * C.P.len + e.t) * C.beat;
        if (when > ahead) { alive = true; break; }
        const dur = e.d * C.beat;
        if (k === 3) drum(e.kind, when);
        else if (k === 2) tone(hz(e.m), when, dur, 't', 0.36, mus);
        else tone(hz(e.m), when, dur, e.duty, k === 0 ? 0.16 : 0.09, mus);
        C.pos[k]++;
        alive = true;
      }
    });
    if (C.once) {
      const end = C.start + C.P.len * C.beat;
      if (ac.currentTime > end + 0.1) { const then = C.then; stop(); if (then != null) play(then); }
    }
  }
  function stop() { if (timer) clearInterval(timer); timer = null; cur = null; }
  const current = () => cur ? cur.id : -1;
  function mode(kind) { rate = kind === 'ura' ? 0.943 : 1; wobble = kind === 'ura' ? 60 : 0; }

  /* ---------- 効果音 ---------- */
  function sfx(name) {
    if (!ac || vol <= 0) return;
    const t = ac.currentTime;
    switch (name) {
      case 'blip': tone(1318, t, 0.022, 1, 0.05); break;
      case 'cursor': tone(988, t, 0.035, 1, 0.1); break;
      case 'ok': tone(880, t, 0.05, 1, 0.1); tone(1318, t + 0.05, 0.08, 1, 0.1); break;
      case 'cancel': tone(660, t, 0.05, 1, 0.09); tone(440, t + 0.05, 0.08, 1, 0.09); break;
      case 'bump': tone(92, t, 0.08, 2, 0.18); break;
      case 'door': hiss(t, 0.18, 'bandpass', 800, 0.3); tone(294, t, 0.1, 2, 0.08); break;
      case 'ding': tone(1975.5, t, 0.08, 1, 0.14); tone(2637, t + 0.09, 0.9, 1, 0.14); break;
      case 'glitch': for (let i = 0; i < 16; i++) tone(120 + Math.random() * 1800, t + i * 0.028, 0.03, (Math.random() * 3) | 0, 0.1); hiss(t, 0.5, 'highpass', 2000, 0.2); break;
      case 'boom': hiss(t, 0.7, 'lowpass', 380, 0.7); tone(70, t, 0.3, 's', 0.4, fx, 40); break;
      case 'pop': hiss(t, 0.2, 'bandpass', 3000, 0.25); break;
      case 'sparkle': [0, 4, 7, 12, 16, 19].forEach((s, i) => tone(1046.5 * Math.pow(2, s / 12), t + i * 0.045, 0.06, 0, 0.07)); break;
      case 'coin': tone(1568, t, 0.05, 1, 0.1); tone(2093, t + 0.05, 0.14, 1, 0.1); break;
      case 'buzz': tone(55, t, 1.4, 2, 0.2); hiss(t, 1.2, 'lowpass', 300, 0.15); break;
      case 'wave': hiss(t, 1.1, 'lowpass', 600, 0.12); break;
      case 'meteor': tone(2400, t, 0.35, 0, 0.05, fx, 900); break;
      case 'save': tone(784, t, 0.06, 1, 0.08); tone(1046, t + 0.07, 0.06, 1, 0.08); tone(1318, t + 0.14, 0.12, 1, 0.08); break;
    }
  }

  return { init, ready, setVol, suspend, play, stop, current, sfx, mode, parse };
})();
