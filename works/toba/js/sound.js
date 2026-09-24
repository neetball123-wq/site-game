/* 六夜の賭場 — 音（すべて合成。賽・壺・札・駒・拍子木） */
(() => {
  let ctx = null, master = null, verb = null, on = false, muted = false, room = null;

  const noise = (sec, brown) => {
    const len = Math.max(1, Math.floor(ctx.sampleRate * sec));
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w;
    }
    return b;
  };

  function reverb() {
    const len = Math.floor(ctx.sampleRate * 1.3), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const cv = ctx.createConvolver(); cv.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.3; cv.connect(g); g.connect(master);
    return cv;
  }

  const env = (g, t, peak, dec) => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dec);
  };

  /* 部屋の気配（ごく低い唸り） */
  function roomTone() {
    const src = ctx.createBufferSource(); src.buffer = noise(4, true); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(lp); lp.connect(g); g.connect(master); src.start();
    return g;
  }

  /* 賽が壺の中で鳴る */
  function rattle(sec) {
    if (!on) return;
    const t0 = ctx.currentTime, n = Math.round((sec || 0.7) * 26);
    for (let i = 0; i < n; i++) {
      const t = t0 + Math.random() * (sec || 0.7);
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(900 + Math.random() * 1500, t);
      o.frequency.exponentialRampToValueAtTime(260 + Math.random() * 200, t + 0.035);
      const g = ctx.createGain(); env(g, t, 0.022 + Math.random() * 0.02, 0.05);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 1.2;
      o.connect(bp); bp.connect(g); g.connect(master); g.connect(verb);
      o.start(t); o.stop(t + 0.07);
    }
  }

  /* 壺を伏せる（ごとり） */
  function thud() {
    if (!on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
    const g = ctx.createGain(); env(g, t, 0.24, 0.32);
    o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 0.4);
    const s = ctx.createBufferSource(); s.buffer = noise(0.09, false);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const g2 = ctx.createGain(); env(g2, t, 0.1, 0.1);
    s.connect(lp); lp.connect(g2); g2.connect(master); s.start(t); s.stop(t + 0.11);
  }

  /* 札を置く・めくる */
  function card() {
    if (!on) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noise(0.14, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3400; bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.075, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.14);
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.16);
  }

  /* 駒（ちゃり） */
  function chip(many) {
    if (!on) return;
    const t0 = ctx.currentTime, n = many ? 6 : 2;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * (0.035 + Math.random() * 0.03);
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(1500 + Math.random() * 900, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
      const g = ctx.createGain(); env(g, t, 0.035, 0.08);
      o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 0.1);
    }
  }

  /* 当たり（鈴） */
  function win() {
    if (!on) return;
    const t = ctx.currentTime;
    [1, 2.02, 3.01].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 988 * m;
      const g = ctx.createGain(); env(g, t + i * 0.02, i ? 0.03 : 0.085, i ? 1.1 : 2.2);
      o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 2.4);
    });
  }

  /* 外れ（低い木） */
  function lose() {
    if (!on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(74, t + 0.5);
    const g = ctx.createGain(); env(g, t, 0.13, 0.62);
    o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 0.7);
  }

  /* 拍子木（場面転換） */
  function hyoshigi(n) {
    if (!on) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < (n || 1); i++) {
      const t = t0 + i * 0.36;
      const s = ctx.createBufferSource(); s.buffer = noise(0.05, false);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 3.5;
      const g = ctx.createGain(); env(g, t, 0.22, 0.2);
      s.connect(bp); bp.connect(g); g.connect(master); g.connect(verb); s.start(t); s.stop(t + 0.22);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(420, t + 0.09);
      const g2 = ctx.createGain(); env(g2, t, 0.09, 0.16);
      o.connect(g2); g2.connect(master); g2.connect(verb); o.start(t); o.stop(t + 0.2);
    }
  }

  /* 咳 */
  function seki() {
    if (!on) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noise(0.3, true);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.13, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.28);
    s.connect(bp); bp.connect(g); g.connect(master); g.connect(verb); s.start(t); s.stop(t + 0.32);
  }

  /* 鼠が走る（小さな足音の連なり） */
  function run(sec) {
    if (!on) return;
    const t0 = ctx.currentTime, n = Math.round((sec || 2) * 22);
    for (let i = 0; i < n; i++) {
      const t = t0 + (i / n) * (sec || 2) + Math.random() * 0.02;
      const s = ctx.createBufferSource(); s.buffer = noise(0.02, false);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const g = ctx.createGain(); env(g, t, 0.016, 0.03);
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.04);
    }
  }

  window.TSND = {
    start() {
      if (on) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
      verb = reverb(); on = true; room = roomTone();
    },
    mute(m) {
      muted = m;
      if (!on) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(m ? 0 : 0.9, t + 0.35);
    },
    muted: () => muted,
    ready: () => on,
    rattle, thud, card, chip, win, lose, hyoshigi, seki, run
  };
})();
