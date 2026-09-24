/* ポスト百景 — 音（合成。紙・墨・活字・鈴） */
(() => {
  let ctx = null, master = null, verb = null, on = false, muted = false;
  const noise = (sec, brown) => {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3; } else d[i] = w; }
    return b;
  };
  function reverb() {
    const len = ctx.sampleRate * 1.8, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    const cv = ctx.createConvolver(); cv.buffer = buf;
    const g = ctx.createGain(); g.gain.value = .35; cv.connect(g); g.connect(master);
    return cv;
  }
  const env = (g, t, peak, dec) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .01); g.gain.exponentialRampToValueAtTime(.0004, t + dec); };
  /* 紙ずれ */
  function paper(long) {
    if (!on) return;
    const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noise(long ? 1.6 : .5, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(long ? .06 : .04, t + .18); g.gain.exponentialRampToValueAtTime(.0004, t + (long ? 1.5 : .45));
    src.connect(bp); bp.connect(g); g.connect(master); src.start(t); src.stop(t + (long ? 1.7 : .55));
  }
  /* 墨をおく（文字が出るとき） */
  function ink() {
    if (!on) return;
    const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noise(.12, true);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ctx.createGain(); env(g, t, .03, .12);
    src.connect(lp); lp.connect(g); g.connect(master); src.start(t); src.stop(t + .14);
  }
  /* 活字を置く */
  function type() {
    if (!on) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(90, t + .06);
    const g = ctx.createGain(); env(g, t, .05, .09);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .1);
  }
  /* 投函（ことん） */
  function drop() {
    if (!on) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + .2);
    const g = ctx.createGain(); env(g, t, .12, .35);
    o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + .4);
    paper(false);
  }
  /* 鈴（手紙が届く） */
  function bell(low) {
    if (!on) return;
    const t = ctx.currentTime, f = low ? 784 : 1174.7;
    [1, 2.76].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const g = ctx.createGain(); env(g, t, i ? .03 : .08, i ? 1.2 : 2.4);
      o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 2.6);
    });
  }
  PS.snd = {
    start() {
      if (on) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : .9; master.connect(ctx.destination);
      verb = reverb(); on = true;
    },
    mute(m) { muted = m; if (on) master.gain.linearRampToValueAtTime(m ? 0 : .9, ctx.currentTime + .4); },
    muted: () => muted, ready: () => on,
    paper, ink, type, drop, bell
  };
})();
