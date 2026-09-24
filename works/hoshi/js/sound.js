/* みなと天文館 — 音（音源ファイルは持たず、その場で合成する） */
(() => {
  let ctx = null, master = null, verb = null, humGain = null, padGain = null, started = false, muted = false;

  function reverb() {
    const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const cv = ctx.createConvolver(); cv.buffer = buf;
    const g = ctx.createGain(); g.gain.value = .5;
    cv.connect(g); g.connect(master);
    return cv;
  }
  function noiseBuf(sec, brown) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w;
    }
    return b;
  }
  /* 投影機のうなり */
  function hum() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(3, true); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 6;
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 58;
    const og = ctx.createGain(); og.gain.value = .05;
    humGain = ctx.createGain(); humGain.gain.value = 0;
    src.connect(lp); lp.connect(humGain); osc.connect(og); og.connect(humGain); humGain.connect(master);
    src.start(); osc.start();
    // ゆらぎ
    const lfo = ctx.createOscillator(); lfo.frequency.value = .07;
    const lg = ctx.createGain(); lg.gain.value = 14;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  }
  /* 底に流れる和音（ドームの空気） */
  const PAD = [[130.81, 196.00, 329.63], [146.83, 220.00, 349.23], [123.47, 185.00, 311.13], [110.00, 164.81, 277.18]];
  let padOsc = [];
  function pad() {
    padGain = ctx.createGain(); padGain.gain.value = 0;
    padGain.connect(master);
    const send = ctx.createGain(); send.gain.value = .6; padGain.connect(send); send.connect(verb);
    padOsc = PAD[0].map((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 2 ? .05 : .09;
      const trem = ctx.createOscillator(); trem.frequency.value = .05 + i * .03;
      const tg = ctx.createGain(); tg.gain.value = .03;
      trem.connect(tg); tg.connect(g.gain); trem.start();
      o.connect(g); g.connect(padGain); o.start();
      return o;
    });
  }
  function chordTo(n) {
    if (!started || !padOsc.length) return;
    const c = PAD[n % PAD.length];
    padOsc.forEach((o, i) => o.frequency.exponentialRampToValueAtTime(c[i], ctx.currentTime + 6));
  }
  /* 星をつないだときの、ひとつぶの音 */
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function bell(i = 0, base = 523.25) {
    if (!started) return;
    const f = base * Math.pow(2, SCALE[i % SCALE.length] / 12);
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.004;
    const g = ctx.createGain(), g2 = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + 2.2);
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(.05, t + .008); g2.gain.exponentialRampToValueAtTime(.0005, t + 1.1);
    o.connect(g); o2.connect(g2); g.connect(master); g2.connect(master); g.connect(verb); g2.connect(verb);
    o.start(t); o2.start(t); o.stop(t + 2.4); o2.stop(t + 1.3);
  }
  function chord(kind = 'up') {
    if (!started) return;
    const seq = kind === 'up' ? [0, 2, 4, 7] : [7, 4, 2, 0];
    seq.forEach((n, i) => setTimeout(() => bell(n, 523.25), i * 150));
    setTimeout(() => bell(0, 261.63), 80);
  }
  /* 流れ星 */
  function whoosh() {
    if (!started) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(1.2, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.4;
    bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .12); g.gain.exponentialRampToValueAtTime(.0005, t + .9);
    src.connect(bp); bp.connect(g); g.connect(master); g.connect(verb);
    src.start(t); src.stop(t + 1.1);
  }
  /* 字幕が一行進む（紙のような小さな音） */
  function tick() {
    if (!started) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(.06, false);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
    const g = ctx.createGain(); g.gain.setValueAtTime(.035, t); g.gain.exponentialRampToValueAtTime(.0004, t + .06);
    src.connect(hp); hp.connect(g); g.connect(master);
    src.start(t); src.stop(t + .08);
  }
  /* 終幕：客席の明かり */
  function warm() {
    if (!started) return;
    const t = ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * .25); g.gain.linearRampToValueAtTime(.07, t + i * .25 + 1.6); g.gain.linearRampToValueAtTime(0, t + 9);
      o.connect(g); g.connect(master); g.connect(verb);
      o.start(t + i * .25); o.stop(t + 9.5);
    });
    if (humGain) humGain.gain.linearRampToValueAtTime(0, t + 5);
    if (padGain) padGain.gain.linearRampToValueAtTime(0, t + 7);
  }
  /* 投影機が止まる（封じ直すときの、かちり） */
  function clack() {
    if (!started) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + .08);
    const g = ctx.createGain(); g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.0005, t + .12);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .14);
  }

  HS.snd = {
    start() {
      if (started) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      verb = reverb();
      hum(); pad();
      started = true;
      const t = ctx.currentTime;
      master.gain.linearRampToValueAtTime(muted ? 0 : .9, t + 3);
      humGain.gain.linearRampToValueAtTime(.5, t + 4);
      padGain.gain.linearRampToValueAtTime(.35, t + 8);
    },
    mute(on) {
      muted = on;
      if (started) master.gain.linearRampToValueAtTime(on ? 0 : .9, ctx.currentTime + .6);
    },
    muted: () => muted,
    ready: () => started,
    bell, chord, whoosh, tick, warm, clack, chordTo
  };
})();
