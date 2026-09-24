'use strict';
// ============================================================
//  audio: procedural sfx + generative music (WebAudio)
// ============================================================
const Snd = {
  A: null, ok: false, muted: false, last: {},
  unlock() {
    if (!this.A) { try { this.build(); } catch (e) { this.A = null; this.ok = false; return; } }
    try { if (this.A.state === 'suspended') this.A.resume().catch(() => { }); } catch (e) { }
  },
  build() {
    const A = this.A = new (window.AudioContext || window.webkitAudioContext)();
    const comp = A.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    comp.connect(A.destination);
    this.master = A.createGain(); this.master.gain.value = 0.85; this.master.connect(comp);
    this.sfx = A.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.master);
    this.mus = A.createGain(); this.mus.gain.value = 0.55; this.mus.connect(this.master);
    const conv = A.createConvolver(); conv.buffer = this.ir(2.4);
    this.rev = A.createGain(); this.rev.gain.value = 1; this.rev.connect(conv);
    const rg = A.createGain(); rg.gain.value = 0.32; conv.connect(rg); rg.connect(this.master);
    const len = A.sampleRate * 2, b = A.createBuffer(1, len, A.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.nb = b;
    // brown-ish noise for wind/rain
    const b2 = A.createBuffer(1, len, A.sampleRate), d2 = b2.getChannelData(0); let l = 0;
    for (let i = 0; i < len; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d2[i] = l * 3.5; }
    this.bb = b2;
    this.ok = true;
    this.amb = {};
    if (this.muted) this.master.gain.value = 0;
  },
  ir(sec) {
    const A = this.A, len = Math.floor(A.sampleRate * sec), b = A.createBuffer(2, len, A.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  },
  toggleMute() { this.muted = !this.muted; if (this.ok) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.A.currentTime, 0.05); },
  panOf(x) { if (x == null || typeof Cam === 'undefined') return 0; return clamp((x - Cam.x - W / 2) / (W * 0.65), -0.85, 0.85); },
  route(g, pan, rev) {
    const A = this.A; let n = g;
    if (pan && A.createStereoPanner) { const p = A.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; }
    n.connect(this.sfx);
    if (rev) { const s = A.createGain(); s.gain.value = rev; n.connect(s); s.connect(this.rev); }
  },
  env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  o(type, f0, f1, dur, vol, op = {}) {
    const A = this.A, t = A.currentTime + (op.dl || 0);
    const o = A.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 10), t + dur);
    if (op.det) o.detune.value = op.det;
    const g = A.createGain(); this.env(g, t, op.a || 0.002, dur, vol);
    let n = o;
    if (op.lp) { const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = op.lp; o.connect(f); n = f; }
    n.connect(g); this.route(g, op.pan, op.rev);
    o.start(t); o.stop(t + (op.a || 0.002) + dur + 0.05);
  },
  n(dur, vol, op = {}) {
    const A = this.A, t = A.currentTime + (op.dl || 0);
    const s = A.createBufferSource(); s.buffer = op.brown ? this.bb : this.nb;
    const f = A.createBiquadFilter(); f.type = op.ft || 'lowpass'; f.Q.value = op.q || 0.8;
    f.frequency.setValueAtTime(op.f0 || 3000, t);
    if (op.f1) f.frequency.exponentialRampToValueAtTime(op.f1, t + dur);
    const g = A.createGain(); this.env(g, t, op.a || 0.002, dur, vol);
    s.connect(f); f.connect(g); this.route(g, op.pan, op.rev);
    s.start(t, Math.random() * 1.5); s.stop(t + (op.a || 0.002) + dur + 0.05);
  },
  play(name, op = {}) {
    if (!this.ok || this.muted) return;
    const A = this.A, now = A.currentTime;
    const gap = op.gap != null ? op.gap : 0.035;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const pan = this.panOf(op.x), p = op.p != null ? op.p : 1, pt = op.pitch || 1;
    const S = this.fx[name]; if (S) { try { S.call(this, pan, p, pt, op); } catch (e) { console.warn('sfx', name, e); } }
  },
  // ---------- ambient loops ----------
  ambient(kind) {
    if (!this.ok) return;
    const A = this.A;
    for (const k in this.amb) { const a = this.amb[k]; if (k !== kind) { a.g.gain.setTargetAtTime(0.0001, A.currentTime, 0.6); setTimeout(() => { try { a.s.stop(); } catch (e) { } }, 3000); delete this.amb[k]; } }
    if (!kind || this.amb[kind]) return;
    const s = A.createBufferSource(); s.buffer = kind === 'rain' ? this.nb : this.bb; s.loop = true;
    const f = A.createBiquadFilter(); const g = A.createGain(); g.gain.value = 0.0001;
    if (kind === 'rain') { f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.4; g.gain.setTargetAtTime(0.06, A.currentTime, 1); }
    else { f.type = 'lowpass'; f.frequency.value = 500; g.gain.setTargetAtTime(kind === 'wind2' ? 0.16 : 0.11, A.currentTime, 1.5);
      const lfo = A.createOscillator(); lfo.frequency.value = 0.09; const lg = A.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); }
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start();
    this.amb[kind] = { s, g };
  },
};
Snd.fx = {
  swing(pan, p, pt) { this.n(0.09 + p * 0.08, 0.16 + p * 0.14, { ft: 'bandpass', f0: 2600 * pt, f1: 500 * pt, q: 1.4, pan }); },
  hit(pan, p, pt) {
    this.o('sine', 170 * pt, 42, 0.11 + p * 0.06, 0.42 + p * 0.25, { pan });
    this.n(0.07, 0.32 + p * 0.2, { f0: 5200, f1: 700, pan });
    const b = 560 * pt * rnd(0.92, 1.1);
    this.o('triangle', b, b * 0.98, 0.16 + p * 0.1, 0.07, { pan, rev: 0.25 });
    this.o('triangle', b * 2.37, b * 2.3, 0.12, 0.05, { pan });
    this.o('square', b * 3.91, b * 3.9, 0.05, 0.02, { pan });
  },
  heavy(pan, p, pt) {
    this.o('sine', 110 * pt, 28, 0.42, 0.75, { pan });
    this.n(0.34, 0.55, { f0: 2600, f1: 120, pan, rev: 0.45 });
    this.o('triangle', 380 * pt, 360, 0.3, 0.09, { pan, rev: 0.4 });
    this.o('triangle', 910 * pt, 880, 0.22, 0.05, { pan });
  },
  jump(pan) { this.o('square', 210, 520, 0.08, 0.05, { pan, lp: 2400 }); this.n(0.05, 0.08, { ft: 'highpass', f0: 1500, pan }); },
  djump(pan) { this.n(0.16, 0.2, { ft: 'bandpass', f0: 900, f1: 2400, q: 0.8, pan }); this.o('square', 330, 760, 0.1, 0.045, { pan, lp: 2600 }); },
  land(pan, p) { this.n(0.07 + p * 0.06, 0.12 + p * 0.25, { f0: 700, f1: 160, pan }); if (p > 0.6) this.o('sine', 90, 40, 0.12, 0.3 * p, { pan }); },
  step(pan, p, pt) { this.n(0.025, 0.035, { ft: 'bandpass', f0: 1500 * pt, q: 2, pan }); },
  dash(pan) { this.n(0.18, 0.26, { ft: 'bandpass', f0: 500, f1: 3600, q: 1.2, pan }); this.o('sine', 220, 70, 0.12, 0.12, { pan }); },
  shot(pan) { this.o('square', 1300, 320, 0.07, 0.05, { pan, lp: 3000 }); this.n(0.04, 0.12, { ft: 'highpass', f0: 3200, pan }); },
  clink(pan, p, pt) { this.o('triangle', 2400 * pt, 2300, 0.07, 0.05, { pan, rev: 0.2 }); this.o('triangle', 3350 * pt, 3300, 0.05, 0.03, { pan }); },
  explode(pan, p) {
    this.n(0.9 * p + 0.2, 0.55 * p + 0.15, { f0: 3200, f1: 70, pan, rev: 0.55 });
    this.o('sine', 72, 24, 0.7 * p + 0.2, 0.6 * p + 0.1, { pan });
    this.n(0.4, 0.2, { brown: true, f0: 500, f1: 80, pan, dl: 0.05 });
  },
  pickup(pan, p, pt) { const f = 880 * pt; this.o('triangle', f, f, 0.06, 0.07, { pan }); this.o('triangle', f * 1.5, f * 1.5, 0.08, 0.05, { pan, dl: 0.035, rev: 0.2 }); },
  heal(pan) { [523, 659, 784, 1046].forEach((f, i) => this.o('triangle', f, f, 0.14, 0.07, { pan, dl: i * 0.06, rev: 0.4 })); },
  hurt(pan) { this.o('square', 420, 80, 0.22, 0.13, { pan, lp: 2200 }); this.n(0.18, 0.35, { f0: 2400, f1: 300, pan }); this.o('sine', 120, 40, 0.2, 0.4, { pan }); },
  charge(pan) { this.o('sine', 180, 900, 0.5, 0.05, { pan }); this.o('triangle', 360, 1800, 0.5, 0.025, { pan }); },
  ding(pan) { this.o('triangle', 1320, 1320, 0.35, 0.09, { pan, rev: 0.5 }); this.o('sine', 1980, 1980, 0.5, 0.05, { pan, rev: 0.5, dl: 0.02 }); },
  cutin() { this.n(0.5, 0.3, { ft: 'bandpass', f0: 300, f1: 5000, q: 1, rev: 0.4 }); this.o('sawtooth', 110, 880, 0.55, 0.05, { lp: 3000 }); this.o('triangle', 1760, 1760, 0.6, 0.06, { dl: 0.45, rev: 0.6 }); },
  mega(pan) {
    this.o('sine', 90, 20, 1.3, 0.9, { pan }); this.n(1.4, 0.7, { f0: 4000, f1: 60, pan, rev: 0.7 });
    this.n(0.8, 0.4, { brown: true, f0: 900, f1: 60, pan, dl: 0.08 }); this.o('triangle', 220, 200, 0.8, 0.1, { rev: 0.7 });
  },
  laserCharge(pan) { this.o('sine', 260, 1300, 0.7, 0.045, { pan }); },
  laser(pan) { this.o('sawtooth', 190, 170, 0.32, 0.09, { pan, lp: 2400 }); this.o('square', 95, 90, 0.32, 0.07, { pan, lp: 1200 }); this.n(0.3, 0.12, { ft: 'highpass', f0: 4000, pan }); },
  orb(pan) { this.o('sine', 700, 260, 0.12, 0.06, { pan }); },
  reflect(pan) { this.o('triangle', 1400, 3200, 0.09, 0.09, { pan, rev: 0.3 }); this.o('square', 2800, 2800, 0.04, 0.03, { pan }); },
  gate(pan) { this.n(0.32, 0.5, { f0: 700, f1: 90, pan, rev: 0.3 }); this.o('sine', 70, 38, 0.3, 0.5, { pan }); this.o('triangle', 300, 290, 0.3, 0.06, { pan, rev: 0.4 }); },
  gateOpen(pan) { this.n(0.7, 0.16, { ft: 'bandpass', f0: 500, f1: 1400, q: 2, pan }); this.o('triangle', 440, 660, 0.25, 0.05, { pan, dl: 0.5, rev: 0.4 }); },
  spawn(pan) { this.n(0.16, 0.28, { f0: 900, f1: 150, pan }); this.o('sine', 110, 45, 0.14, 0.3, { pan }); },
  beep(pan, p, pt) { this.o('square', 1050 * pt, 1050 * pt, 0.045, 0.035, { pan }); this.o('square', 1050 * pt, 1050 * pt, 0.045, 0.035, { pan, dl: 0.09 }); },
  ui() { this.o('square', 660, 660, 0.035, 0.04, { lp: 3000 }); },
  uiok() { this.o('square', 660, 990, 0.08, 0.05, { lp: 3000 }); this.o('triangle', 1320, 1320, 0.2, 0.05, { dl: 0.06, rev: 0.4 }); },
  perfect() { this.o('triangle', 2400, 600, 0.45, 0.08, { rev: 0.6 }); this.o('sine', 3200, 3200, 0.6, 0.03, { rev: 0.6, dl: 0.03 }); this.n(0.3, 0.12, { ft: 'highpass', f0: 5000, f1: 9000 }); },
  crate(pan) { this.n(0.12, 0.3, { ft: 'bandpass', f0: 1100, f1: 500, q: 1.2, pan }); this.o('square', 180, 120, 0.05, 0.08, { pan, lp: 900 }); },
  kick(pan) { this.o('triangle', 320, 140, 0.07, 0.08, { pan }); this.n(0.05, 0.08, { ft: 'bandpass', f0: 1200, pan }); },
  roar(pan) {
    this.o('sawtooth', 58, 44, 1.8, 0.16, { pan, lp: 500, rev: 0.6 }); this.o('sawtooth', 87, 60, 1.8, 0.1, { pan, lp: 700, rev: 0.6 });
    this.n(1.6, 0.35, { brown: true, f0: 400, f1: 100, pan, rev: 0.5 });
  },
  thunder() { this.n(2.6, 0.5, { brown: true, f0: 700, f1: 50, a: 0.05, rev: 0.8 }); this.n(0.4, 0.25, { f0: 2500, f1: 200 }); },
  death() { this.o('square', 520, 45, 1.1, 0.12, { lp: 1800, rev: 0.6 }); this.n(0.6, 0.3, { f0: 2000, f1: 100, rev: 0.5 }); },
  chirp(pan) { const f = rnd(2800, 3600); for (let i = 0; i < 3; i++) this.o('sine', f, f * 1.25, 0.05, 0.02, { pan, dl: i * 0.09 }); },
  flap(pan) { for (let i = 0; i < 4; i++) this.n(0.04, 0.05, { ft: 'bandpass', f0: 900, q: 1, pan, dl: i * 0.06 }); },
  drop(pan) { this.o('sine', 900, 500, 0.3, 0.04, { pan }); },
  whoosh(pan, p) { this.n(0.4 + p * 0.3, 0.2, { ft: 'bandpass', f0: 300, f1: 2400, q: 0.8, pan }); },
  missile(pan) { this.n(0.5, 0.12, { ft: 'bandpass', f0: 1200, f1: 400, q: 1, pan }); },
  flame(pan) { this.n(0.6, 0.3, { brown: true, f0: 1400, f1: 300, pan, rev: 0.3 }); this.n(0.5, 0.15, { ft: 'highpass', f0: 2000, pan }); },
  shutter(pan) { for (let i = 0; i < 6; i++) this.n(0.03, 0.06, { ft: 'bandpass', f0: 1800, q: 3, pan, dl: i * 0.05 }); },
};

// ============================================================
//  Music — soft generative loops, intensity-layered
// ============================================================
const SONGS = {
  day: { bpm: 88, prog: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]], bass: [38, 35, 31, 33], lp: 1300, arp: [0, 1, 2, 3, 2, 1, 3, 1] },
  dusk: { bpm: 80, prog: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], bass: [41, 40, 38, 36], lp: 1100, arp: [0, 2, 1, 3, 0, 2, 3, 1] },
  night: { bpm: 94, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 62]], bass: [33, 29, 38, 40], lp: 900, arp: [0, 1, 2, 3, 1, 2, 3, 2] },
  boss: { bpm: 138, prog: [[50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [45, 49, 52, 57]], bass: [38, 34, 36, 33], lp: 1600, arp: [0, 1, 2, 3, 2, 1, 0, 2], boss: true },
  dawn: { bpm: 72, prog: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], bass: [36, 33, 29, 31], lp: 1500, arp: [0, 1, 2, 3, 2, 3, 1, 2] },
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const Music = {
  on: false, step: 0, nextT: 0, song: 'day', want: 'day', inten: 0, intenT: 0, vol: 1, volT: 1,
  start() {
    if (!Snd.ok || this.on) return; this.on = true;
    const A = Snd.A;
    this.bus = A.createGain(); this.bus.gain.value = 0.9; this.bus.connect(Snd.mus);
    this.dly = A.createDelay(1); this.dly.delayTime.value = 60 / 88 * 0.75;
    const fb = A.createGain(); fb.gain.value = 0.33; const dg = A.createGain(); dg.gain.value = 0.35;
    this.dly.connect(fb); fb.connect(this.dly); this.dly.connect(dg); dg.connect(this.bus);
    const rs = A.createGain(); rs.gain.value = 0.5; this.bus.connect(rs); rs.connect(Snd.rev);
    this.nextT = A.currentTime + 0.1;
    this.timer = setInterval(() => { try { this.sched(); } catch (e) { console.warn('music', e); } }, 30);
  },
  setSong(s) { this.want = s; },
  intensity(v) { this.intenT = v; },
  sched() {
    const A = Snd.A; if (!A) return;
    this.inten = lerp(this.inten, this.intenT, 0.05);
    const tgt = this.want === 'off' ? 0 : 1;
    this.vol = approach(this.vol, this.want !== this.song ? 0 : tgt, 0.025);
    if (this.vol <= 0.001 && this.want !== this.song && this.want !== 'off') { this.song = this.want; this.step = 0; this.dly.delayTime.value = 60 / SONGS[this.song].bpm * 0.75; }
    this.bus.gain.setTargetAtTime(this.vol * 0.9, A.currentTime, 0.05);
    const S = SONGS[this.song]; if (!S) return;
    const spb = 60 / S.bpm / 4;
    if (this.nextT < A.currentTime - 0.3) this.nextT = A.currentTime + 0.05;
    while (this.nextT < A.currentTime + 0.16) { if (this.vol > 0.01) this.playStep(S, this.step, this.nextT, spb); this.nextT += spb; this.step++; }
  },
  note(t, type, f, dur, vol, dest, op = {}) {
    const A = Snd.A; const o = A.createOscillator(); o.type = type; o.frequency.value = f; if (op.det) o.detune.value = op.det;
    const g = A.createGain(); const a = op.a || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur * (op.sus || 0.3)));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o; if (op.lp) { const f2 = A.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = op.lp; f2.Q.value = op.q || 0.7; o.connect(f2); n = f2; }
    n.connect(g); g.connect(dest || this.bus); o.start(t); o.stop(t + dur + 0.05);
    return g;
  },
  drum(t, kind, v) {
    const A = Snd.A;
    if (kind === 'k') { const o = A.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.14); const g = A.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.2); return; }
    const s = A.createBufferSource(); s.buffer = Snd.nb; const f = A.createBiquadFilter();
    f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1700; f.Q.value = 0.8;
    const g = A.createGain(); const d = kind === 'h' ? 0.035 : 0.12;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.bus); s.start(t, Math.random()); s.stop(t + d + 0.02);
  },
  playStep(S, s, t, spb) {
    const bar = Math.floor(s / 16) % S.prog.length, st = s % 16, ch = S.prog[bar], I = this.inten;
    if (st === 0) for (const m of ch) {
      for (const det of [-7, 7]) this.note(t, 'sawtooth', mtof(m - 12), spb * 16 * 1.05, 0.012, null, { a: 0.5, sus: 0.7, det, lp: S.lp });
    }
    if (st % 2 === 0) {
      const k = S.arp[(s >> 1) % 8]; const m = ch[k % ch.length] + (k >= ch.length ? 12 : 0) + 12;
      const v = S.boss ? 0.035 : 0.03 + 0.012 * Math.sin(s * 0.3);
      const g = this.note(t, 'triangle', mtof(m), spb * 2.2, v, null, { a: 0.004, sus: 0.1 });
      g.connect(this.dly);
    }
    if (!S.boss && (st === 0 || st === 10) && Math.random() < 0.35) {
      const m = ch[Math.floor(Math.random() * ch.length)] + 24;
      const g = this.note(t, 'sine', mtof(m), spb * 6, 0.022, null, { a: 0.01, sus: 0.05 }); g.connect(this.dly);
    }
    const bv = (S.boss ? 0.13 : 0.03 + 0.08 * I);
    if (S.boss) { if (st % 2 === 0) this.note(t, 'square', mtof(S.bass[bar] + (st % 4 === 2 ? 12 : 0)), spb * 1.6, bv * 0.5, null, { lp: 700, sus: 0.3 }); }
    else if (st === 0 || st === 10 || (I > 0.5 && st === 6)) this.note(t, 'triangle', mtof(S.bass[bar]), spb * (st === 0 ? 7 : 3), bv, null, { sus: 0.4 });
    const D = S.boss ? 1 : clamp((I - 0.25) / 0.75, 0, 1);
    if (D > 0.02) {
      if (st === 0 || st === 8 || (S.boss && (st === 6 || st === 10))) this.drum(t, 'k', 0.32 * D);
      if (st === 4 || st === 12) this.drum(t, 's', 0.1 * D);
      if (st % 2 === 0) this.drum(t, 'h', (st % 4 === 2 ? 0.035 : 0.02) * D);
    }
  },
};
