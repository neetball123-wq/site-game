'use strict';
// ============================================================
//  main: canvases, state machine, compose, loop
// ============================================================
const screenCv = document.getElementById('screen');
const SC = screenCv.getContext('2d');
const lo = mkCanvas(W + MG * 2, H + MG * 2); const LX = lo.getContext('2d');
// the HUD is kept at screen resolution and drawn with a K× transform: pixel art stays crisp and
// Japanese text can be interleaved with the pixel UI in the right order
const hud = mkCanvas(W, H); const HX = hud.getContext('2d'); JCTX = HX;
const tmpC = mkCanvas(96, 96);
let K = 1;
function resize() {
  const dpr = window.devicePixelRatio || 1; const fit = Math.min(innerWidth / W, innerHeight / H);
  K = clamp(Math.ceil(fit * dpr), 1, 8);
  screenCv.width = W * K; screenCv.height = H * K; hud.width = W * K; hud.height = H * K;
  screenCv.style.width = Math.floor(W * fit) + 'px'; screenCv.style.height = Math.floor(H * fit) + 'px';
  SC.imageSmoothingEnabled = false; HX.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

const Game = {
  state: 'boot', scene: null, t: 0, stage: null, stageIdx: -1, robot: new Robot(), trans: null, deckView: null, pickView: null, toast: null,
  go(name, arg) { this.state = name; this.scene = SCENES[name]; In.eat(); if (this.scene.enter) this.scene.enter(arg); },
  goWipe(name, arg) { if (this.trans) return; this.trans = { t: 0, dur: 18, mid: () => this.go(name, arg) }; Snd.play('page'); },
  setStage(idx, seed) {
    if (this.stageIdx !== idx || !this.stage || seed != null) { this.stage = makeStage(idx, seed != null ? seed : idx * 97 + 3); this.stageIdx = idx; }
    PSTAGE = STAGES[idx]; Snd.ambient(STAGES[idx].amb);
  },
  update() {
    In.update(); this.t++;
    if (In.key('KeyM')) { Meta.d.mute = !Meta.d.mute; Snd.setMute(Meta.d.mute); Meta.save(); }
    if (this.trans) { this.trans.t++; if (this.trans.t === this.trans.dur) this.trans.mid(); if (this.trans.t >= this.trans.dur * 2) this.trans = null; }
    if (this.pickView) PickView.input();
    else if (this.deckView) DeckView.input();
    else if (this.scene && this.scene.update && !(this.trans && this.trans.t < this.trans.dur)) this.scene.update();
    else if (this.scene && this.scene.tick) this.scene.tick();
    if (!this.pickView && !this.deckView && In.key('KeyD') && Run.cur && this.state !== 'battle' && this.state !== 'title') DeckView.open(Run.cur.deck, 'DECK');
    Scr.update(); Cam.update(this.t);
    if (Snd.ok && !Music.on) Music.start();
  },
  render() {
    JT.length = 0;
    useCtx(LX); LX.setTransform(1, 0, 0, 1, 0, 0); LX.globalAlpha = 1; LX.globalCompositeOperation = 'source-over';
    LX.fillStyle = '#0d0c14'; LX.fillRect(0, 0, lo.width, lo.height); resetFs();
    if (this.scene && this.scene.drawWorld) this.scene.drawWorld(this.t);
    // grade + vignette
    if (PSTAGE && PSTAGE.key === 'dusk') { LX.globalCompositeOperation = 'soft-light'; LX.fillStyle = 'rgba(255,150,110,0.3)'; LX.fillRect(0, 0, lo.width, lo.height); LX.globalCompositeOperation = 'source-over'; resetFs(); }
    if (PSTAGE && PSTAGE.key === 'night') { LX.globalCompositeOperation = 'multiply'; LX.fillStyle = 'rgba(130,140,210,0.5)'; LX.fillRect(0, 0, lo.width, lo.height); LX.globalCompositeOperation = 'source-over'; resetFs(); }
    if (Scr.tintA > 0.01 && Scr.tint) { LX.globalAlpha = Scr.tintA; LX.fillStyle = Scr.tint; LX.fillRect(0, 0, lo.width, lo.height); LX.globalAlpha = 1; resetFs(); }
    vignette();
    // hud
    useCtx(HX); HX.setTransform(1, 0, 0, 1, 0, 0); HX.clearRect(0, 0, hud.width, hud.height); HX.setTransform(K, 0, 0, K, 0, 0); HX.imageSmoothingEnabled = false; HX.globalAlpha = 1; resetFs();
    if (this.scene && this.scene.drawHud) this.scene.drawHud(this.t);
    if (this.deckView) DeckView.draw(this.t);
    if (this.pickView) PickView.draw(this.t);
    if (this.toast) this.drawToast();
    Tip.draw();
    const lb = Math.round(Scr.lb * 20); if (lb > 0) { rectI(0, 0, W, lb, '#0d0c14'); rectI(0, H - lb, W, lb, '#0d0c14'); }
    if (Scr.flashA > 0.02) { HX.globalAlpha = Scr.flashA; rectI(0, 0, W, H, Scr.flashC); HX.globalAlpha = 1; }
    if (this.trans) { const tr = this.trans; const u = tr.t < tr.dur ? tr.t / tr.dur : 1 - (tr.t - tr.dur) / tr.dur; drawWipe(u, tr.t >= tr.dur); }
    drawCursor();
    // compose
    SC.setTransform(1, 0, 0, 1, 0, 0); SC.fillStyle = '#0d0c14'; SC.fillRect(0, 0, screenCv.width, screenCv.height);
    const z = Cam.zoom + Math.abs(Cam.tilt) * 1.9;
    SC.save(); SC.scale(K, K); SC.translate(W / 2, H / 2); SC.rotate(Cam.tilt); SC.translate(-W / 2, -H / 2);
    SC.translate(Cam.fx, Cam.fy); SC.scale(z, z); SC.translate(-Cam.fx, -Cam.fy);
    SC.imageSmoothingEnabled = false;
    if (this.state === 'over' && SCENES.over.gray) SC.filter = `grayscale(${SCENES.over.gray})`;
    SC.drawImage(lo, -MG + Cam.sx, -MG + Cam.sy); SC.filter = 'none';
    SC.restore();
    SC.setTransform(1, 0, 0, 1, 0, 0); SC.imageSmoothingEnabled = false; SC.drawImage(hud, 0, 0);
    // queued (world-layer) Japanese text, screen resolution
    SC.setTransform(K, 0, 0, K, 0, 0); SC.textBaseline = 'top';
    for (const j of JT) {
      SC.font = `${j.size}px ${JFONT}`; SC.textAlign = j.align;
      if (j.shadow) { SC.fillStyle = j.shadow; SC.fillText(j.str, j.x + 0.5, j.y + 0.5); SC.fillText(j.str, j.x + 0.5, j.y); }
      SC.fillStyle = j.color; SC.fillText(j.str, j.x, j.y);
    }
    SC.textAlign = 'left';
    if (_err && performance.now() - _err.t < 8000) { SC.fillStyle = 'rgba(13,12,20,.85)'; SC.fillRect(0, 0, W, 12); SC.fillStyle = '#ff9fb0'; SC.font = `7px monospace`; SC.fillText('ERROR: ' + _err.msg, 3, 2); }
    SC.setTransform(1, 0, 0, 1, 0, 0);
  },
  toastMsg(s, c = '#ffffff') { this.toast = { s, c, t: 0 }; },
  drawToast() { const t = this.toast; t.t++; if (t.t > 120) { this.toast = null; return; } const w = jmeasure(t.s, 8) + 16; const y = 26 - (t.t < 8 ? (8 - t.t) * 2 : 0); panel(W / 2 - w / 2, y, w, 16, '#1d1a2a', '#5a5670'); jtext(t.s, W / 2, y + 4, 8, t.c, 'center'); },
};
let _vig = null;
function vignette() {
  if (!_vig) { const c = mkCanvas(lo.width, lo.height); const x = c.getContext('2d'); const cx = c.width / 2, cy = c.height / 2; x.translate(cx, cy); x.scale(1, c.height / c.width); const g = x.createRadialGradient(0, 0, cx * 0.55, 0, 0, cx * 1.08); g.addColorStop(0, 'rgba(13,12,20,0)'); g.addColorStop(1, 'rgba(13,12,20,0.4)'); x.fillStyle = g; x.fillRect(-cx, -cx, c.width, c.width); _vig = c; }
  LX.drawImage(_vig, 0, 0);
}
function drawWipe(u, rev) {
  const S = 10;
  for (let y = 0; y < H; y += S) for (let x = 0; x < W; x += S) {
    const d = (x / W) * 0.7 + (y / H) * 0.3; const th = rev ? 1 - d : d; const k = u * 1.6 - th * 0.6;
    if (k >= 1) rectI(x, y, S, S, '#0d0c14'); else if (k > 0) { const s = Math.round(S * k); rectI(x + (S - s) / 2 | 0, y + (S - s) / 2 | 0, s, s, '#0d0c14'); }
  }
}
function drawCursor() {
  if (In.mx < 0 || In.lastPointer !== 'mouse') return;
  const x = Math.round(In.mx), y = Math.round(In.my);
  const grab = BV.drag && BV.drag.moved;
  if (grab) { rectI(x - 3, y - 2, 7, 6, OUT); rectI(x - 2, y - 1, 5, 4, '#f6f4ee'); return; }
  const p = [x, y, x, y + 9, x + 2.5, y + 6.5, x + 5, y + 11, x + 6.5, y + 10, x + 4.5, y + 6, x + 7, y + 6];
  polyF(offPts(p, -1, 0), OUT); polyF(offPts(p, 1, 0), OUT); polyF(offPts(p, 0, -1), OUT); polyF(offPts(p, 0, 1), OUT); polyF(p, '#f6f4ee'); px(x + 1, y + 2, '#ffffff');
}

// ---------- error reporting (never freeze on an exception) ----------
let _err = null;
function reportErr(e) { console.error(e); const msg = String(e && e.message || e).slice(0, 100); if (!_err || _err.msg !== msg) _err = { msg, t: performance.now() }; }
addEventListener('error', e => reportErr(e.error || e.message));

// ---------- loop ----------
In.init(screenCv);
Meta.load(); Snd.muted = !!Meta.d.mute;
let _last = performance.now(), _acc = 0;
setInterval(() => { if (!document.hidden) { Meta.playMs += 5000; if (Game.t % 2 === 0) Meta.save(); } }, 5000);
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - _last) / 1000; _last = now; if (dt > 0.1) dt = 0.1;
  _acc += dt; let n = 0;
  try { while (_acc >= 0.9 / 60 && n < 4) { _acc -= 1 / 60; Game.update(); n++; } if (n === 4) _acc = 0; if (_acc < -0.001) _acc = -0.001; } catch (e) { _acc = 0; reportErr(e); }
  if (!n) return; // render at the simulation rate (render-time easing stays 60fps on high-refresh displays)
  try { Game.render(); } catch (e) { reportErr(e); try { SC.setTransform(1, 0, 0, 1, 0, 0); SC.filter = 'none'; } catch (_) { } }
}
Game.go('title');
requestAnimationFrame(frame);
screenCv.focus();
if (/dbg/.test(location.search)) { const s = document.createElement('script'); s.src = 'js/debug.js'; document.body.appendChild(s); }
