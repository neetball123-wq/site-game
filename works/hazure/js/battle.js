/* ハズレスキル【合成】 — 戦い
   ターンごとに自動で進む。乱数は使わない（同じ構成なら同じ結果になるので、試算がそのまま当たる）。
   スキルの発動は「出来事」の列で順に処理する：ある効果が出来事（ダメージ・燃焼・くしゃみ…）を起こし、
   それをきっかけにほかのスキルが発動する（連鎖）。同じターンに同じスキルが発動するたび効き目は0.7倍になり、
   1%を下回るとそのターンは止まる（疲れ）。上限はないが、連鎖が世界の処理をこえると「∞」になる。 */
(function (G) {
  'use strict';
  const HZ = G.HZ;
  const LIMIT = 6000;   // 1ターンにこれだけ発動したら「理の外」

  /* ---------- 魔物をつくる ---------- */
  HZ.foeStats = (id, k, extra) => {
    const b = HZ.FOES[id];
    const hp = Math.round(b.hp * HZ.scale(k));
    return {
      id, name: b.name, hp, max: hp, atk: b.atk * Math.pow(HZ.GROW.atk, k), sh: 0,
      act: b.act, ai: 0, weak: b.weak, res: b.res, tr: Object.assign({}, b.tr, (extra && extra.tr) || {}),
      st: {}, boss: !!b.boss, elite: !!b.elite, mist: 0, k, alive: true,
    };
  };

  /* ---------- 戦いのはじまり ---------- */
  HZ.newBattle = (run, foes, opt) => {
    opt = opt || {};
    const law = { el: {}, tough: 0, combo: 1, react: 1, gold: 1 };
    const L = opt.law || null;
    if (L) { Object.assign(law.el, L.el || {}); law.tough = L.tough || 0; law.combo = L.combo || 1; law.react = L.react || 1; law.gold = L.gold || 1; }
    const mods = { combo: 0, react: 0, el: {}, str: 0, mag: 0 };
    for (const t of run.titles || []) {
      const T = HZ.TITLES[t]; if (!T) continue;
      mods.combo += T.combo || 0; mods.react += T.react || 0; mods.str += T.str || 0; mods.mag += T.mag || 0;
      for (const e in T.el || {}) mods.el[e] = (mods.el[e] || 0) + T.el[e];
    }
    const B = {
      run, t: 0, over: null, law, mods,
      p: { hp: run.hp, max: run.max, sh: 0, st: {}, 力: mods.str, 魔: mods.mag, 硬: 0, 鑑: 0, last: 0 },
      foes: foes.map((f) => Object.assign({}, f, { st: Object.assign({}, f.st), tr: Object.assign({}, f.tr) })),
      sk: run.eq.map((u) => run.skills.find((s) => s.u === u)).filter(Boolean).map((s) => ({ s, n: 0, cnt: 0, grow: 0, sealed: false, dmg: 0, fires: 0 })),
      q: [], log: [], combo: 0, charge: 1, counter: 0, last: -1, fires: 0, inf: false,
      stat: { maxHit: 0, maxCombo: 0, reacts: {}, kills: {}, oneHit: false, dmg: 0 },
      gold: 0, silent: false,
    };
    for (const f of B.foes) if (f.tr.wet) f.st.濡れ = 1;
    B.silent = B.foes.some((f) => f.tr.silent);
    // 封印：いちばん強いスキルを封じる
    if (B.foes.some((f) => f.tr.seal) && B.sk.length > 1) {
      let bi = 0; B.sk.forEach((k, i) => { if (HZ.power(k.s) > HZ.power(B.sk[bi].s)) bi = i; });
      B.sk[bi].sealed = 2;   // 最初の2ターンだけ
      B.log.push({ t: 'seal', i: bi });
    }
    return B;
  };

  const alive = (B) => B.foes.filter((f) => f.alive);
  const front = (B) => B.foes.find((f) => f.alive);
  const log = (B, e) => { B.log.push(e); };
  const emit = (B, ev, d) => { B.q.push(Object.assign({ ev }, d || {})); };

  function targets(B, to) {
    const a = alive(B);
    if (!a.length) return [];
    if (to === 'a') return a;
    if (to === 'l') return [a.reduce((m, f) => (f.hp / f.max < m.hp / m.max ? f : m), a[0])];
    if (to === 'b') return [a[a.length - 1]];
    return [a[0]];
  }

  /* ---------- 状態 ---------- */
  function addSt(B, f, st, n, quiet) {
    if (!(n > 0) || !f.alive) return;
    if (st === '燃焼' && f.tr.noburn) return;
    if (st === '燃焼' && f.st.油 > 0) {
      n *= 2 * (1 + B.mods.react) * B.law.react; f.st.油 = 0;
      react(B, f, '炎上');
    }
    f.st[st] = (f.st[st] || 0) + n;
    if (st === '冷え' && f.st.冷え >= 3) { const k = Math.floor(f.st.冷え / 3); f.st.冷え -= k * 3; f.st.凍結 = (f.st.凍結 || 0) + k; react(B, f, '凍結'); }
    log(B, { t: 'st', to: B.foes.indexOf(f), st, n, v: f.st[st] });
    if (!quiet) emit(B, 'st', { st });
  }
  function react(B, f, r) {
    B.stat.reacts[r] = (B.stat.reacts[r] || 0) + 1;
    log(B, { t: 'react', to: B.foes.indexOf(f), r });
    emit(B, 'react', { r });
  }
  const rm = (B, m) => 1 + (m - 1) * (1 + B.mods.react) * B.law.react;

  /* ---------- ダメージ（こちら → 敵） ---------- */
  function hitFoe(B, f, el, raw, src, opt) {
    if (!f.alive) return 0;
    opt = opt || {};
    const p = B.p;
    let amt = raw + p.力;
    amt *= 1 + p.魔 / 100;
    amt *= 1 + 0.05 * B.combo * (1 + B.mods.combo) * B.law.combo;
    amt *= (B.law.el[el] || 1) * (1 + (B.mods.el[el] || 0));
    if (f.weak.includes(el)) amt *= 2 + 0.5 * p.鑑;
    if (el in f.res) amt *= f.res[el];
    amt *= 1 + 0.1 * (f.st.呪い || 0);
    // 反応
    let r = null;
    if (!opt.noReact && amt > 0) {
      const s = f.st;
      if (el === '火' && s.濡れ > 0) { amt *= rm(B, 2); s.濡れ = 0; r = '蒸発'; }
      else if (el === '火' && s.凍結 > 0) { amt *= rm(B, 2); s.凍結 = 0; s.濡れ = 1; r = '融解'; }
      else if (el === '土' && s.凍結 > 0) { amt *= rm(B, 3); s.凍結 = 0; r = '粉砕'; }
      else if (el === '雷' && s.濡れ > 0) r = '感電';
      else if (el === '氷' && s.濡れ > 0) { s.濡れ = 0; s.凍結 = (s.凍結 || 0) + 1; r = '凍結'; }
      else if (el === '水' && s.燃焼 > 0) { s.燃焼 = 0; r = '消火'; }
      if (el === '光') amt *= 1 + 0.25 * HZ.STAT.filter((k) => s[k] > 0).length;
      if (f.tr.wet && !(s.濡れ > 0)) s.濡れ = 1;
    }
    amt *= B.charge;
    if (f.tr.hard) amt = Math.max(0, amt - f.tr.hard);
    if (f.tr.wall) amt = Math.min(amt, f.max * f.tr.wall / 100);
    if (f.tr.mist) { f.mist++; if (f.mist % 2 === 0) { log(B, { t: 'miss', to: B.foes.indexOf(f) }); return 0; } }
    if (!isFinite(amt)) amt = Infinity;
    let left = amt;
    if (f.sh > 0) { const a = Math.min(f.sh, left); f.sh -= a; left -= a; }
    f.hp -= left;
    B.stat.dmg += amt;
    if (amt > B.stat.maxHit) B.stat.maxHit = amt;
    if (amt >= f.max) B.stat.oneHit = true;
    if (src >= 0) B.sk[src].dmg += amt;
    log(B, { t: 'dmg', to: B.foes.indexOf(f), amt, el, r, src, hp: Math.max(0, f.hp), sh: f.sh });
    if (r) react(B, f, r);
    // 属性のなごり
    if (amt > 0) {
      if (el === '火') addSt(B, f, '燃焼', amt * 0.3);
      else if (el === '水' && r !== '消火') addSt(B, f, '濡れ', 1);
      else if (el === '毒') addSt(B, f, '毒', amt * 0.5);
      else if (el === '氷' && r !== '凍結') addSt(B, f, '冷え', 1);
      else if (el === '風') {
        const o = alive(B).filter((x) => x !== f); let any = false;
        for (const k of ['燃焼', '毒', '濡れ', '油']) if (f.st[k] > 0) for (const x of o) if (!(x.st[k] >= f.st[k])) { x.st[k] = f.st[k]; any = true; }
        if (any) react(B, f, '拡散');
      }
    }
    if (opt.drain) heal(B, amt * opt.drain);
    if (f.tr.reflect) hurt(B, amt * f.tr.reflect / 100, 'reflect');
    if (f.tr.thorn) hurt(B, f.tr.thorn * f.atk * 0.1, 'thorn');
    emit(B, 'hit', { el });
    if (r === '感電') for (const x of alive(B)) if (x !== f) hitFoe(B, x, '雷', raw, src, { noReact: true });
    if (f.hp <= 0) kill(B, f);
    return amt;
  }
  function kill(B, f) {
    if (!f.alive) return;
    f.alive = false; f.hp = 0;
    B.stat.kills[f.id] = (B.stat.kills[f.id] || 0) + 1;
    log(B, { t: 'kill', to: B.foes.indexOf(f) });
    emit(B, 'kill', {});
    if (f.tr.split && f.k !== undefined) {
      for (let i = 0; i < 2; i++) {
        const c = HZ.foeStats('slime', f.k);
        c.name = 'ちびスライム'; c.hp = c.max = Math.max(1, Math.round(f.max * 0.3));
        B.foes.push(c); log(B, { t: 'spawn', to: B.foes.length - 1 });
      }
    }
    if (f.tr.phase === 1) {
      // 魔王の第二形態
      f.alive = true; f.hp = f.max = Math.round(f.max * 1.2); f.tr.phase = 2; f.atk *= 1.4; f.name = '魔王（真の姿）'; f.tr.silent = 1; B.silent = true;
      f.st = {};
      log(B, { t: 'phase', to: B.foes.indexOf(f) });
    }
  }

  /* ---------- 回復・盾・こちらが受けるダメージ ---------- */
  function heal(B, n) {
    if (!(n > 0)) return;
    const p = B.p, before = p.hp;
    p.hp = Math.min(p.max, p.hp + n);
    log(B, { t: 'heal', amt: p.hp - before, hp: p.hp, max: p.max });
    emit(B, 'heal', {});
  }
  function shield(B, n) {
    if (!(n > 0)) return;
    B.p.sh += n;
    log(B, { t: 'sh', amt: n, sh: B.p.sh });
    emit(B, 'sh', {});
  }
  function hurt(B, n, kind) {
    const p = B.p;
    if (!(n > 0)) return;
    n *= 1 + 0.1 * (p.st.呪い || 0);
    if (kind === 'atk') n = Math.max(n * 0.2, n - p.硬);
    p.last = n;
    let left = n;
    if (kind !== 'poison' && p.sh > 0) { const a = Math.min(p.sh, left); p.sh -= a; left -= a; }
    p.hp -= left;
    log(B, { t: 'hurt', amt: n, blocked: n - left, kind, hp: p.hp, sh: p.sh });
    emit(B, 'hurt', {});
  }

  /* ---------- スキルの発動 ---------- */
  function matches(B, k, i, e) {
    if (k.sealed && B.t <= k.sealed) return false;
    const [ev, sub] = k.s.trig.split(':');
    if (ev !== e.ev) return false;
    if (ev === 'skill' && (e.i === i || B.silent)) return false;
    if (sub) {
      if (ev === 'hit' && e.el !== sub) return false;
      if (ev === 'st' && e.st !== sub) return false;
      if (ev === 'react' && e.r !== sub) return false;
    }
    if (k.s.low && B.p.hp > B.p.max / 2) return false;
    return true;
  }
  const toughOf = (B, s) => Math.min(1, Math.max(HZ.TOUGH, s.tough || 0) + B.law.tough + (B.run.tonic || 0) * 0.01);
  function fire(B, i, viaEcho) {
    const k = B.sk[i], s = k.s;
    const f = Math.pow(toughOf(B, s), k.n);
    if (f < HZ.STOP) return false;
    k.n++; k.fires++;
    B.combo++; B.fires++;
    if (B.combo > B.stat.maxCombo) B.stat.maxCombo = B.combo;
    const prev = B.last;
    B.last = i;
    log(B, { t: 'fire', i, combo: B.combo, f });
    emit(B, 'skill', { i });
    const m = HZ.mul(s) * f;
    for (let r = 0; r <= s.rep; r++) {
      for (const e of s.fx) {
        if (!alive(B).length) return true;
        apply(B, i, k, e, m, f, prev, viaEcho);
      }
    }
    return true;
  }
  function apply(B, i, k, e, m, f, prev, viaEcho) {
    const s = k.s, p = B.p;
    switch (e.k) {
      case 'dmg': {
        const raw = (e.p * HZ.mul(s) + (s.pg || 0) + k.grow) * f;
        for (const t of targets(B, e.to)) hitFoe(B, t, e.el, raw, i, { drain: s.drain });
        B.charge = 1;
        break;
      }
      case 'st': for (const t of targets(B, e.to)) addSt(B, t, e.st, e.p * m); break;
      case 'heal': heal(B, e.p * m); break;
      case 'sh': shield(B, e.p * m); break;
      case 'buf': p[e.s] = (p[e.s] || 0) + e.p * m; log(B, { t: 'buf', s: e.s, n: e.p * m, v: p[e.s] }); break;
      case 'emit': for (let n = 0; n < (e.n || 1); n++) { emit(B, e.ev, {}); log(B, { t: 'emit', ev: e.ev }); } break;
      case 'gold': { const g = e.p * m * B.law.gold; B.gold += g; log(B, { t: 'gold', n: g }); emit(B, 'gold', {}); break; }
      // 溜めは足し算で重なる（かけ算だと、自分で自分を呼ぶ連鎖で桁があふれるため）
      case 'charge': B.charge += (e.p - 1) * HZ.mul(s) * f; log(B, { t: 'charge', x: B.charge }); break;
      case 'echo': if (prev >= 0 && prev !== i && !viaEcho) for (let n = 0; n < (e.n || 1); n++) fire(B, prev, true); break;
      case 'count': {
        B.counter += e.p * m;
        while (B.counter >= 10) { B.counter -= 10; emit(B, 'count', {}); log(B, { t: 'emit', ev: 'count' }); }
        break;
      }
      case 'self': hurt(B, e.p * m, 'self'); break;
      case 'grow': k.grow += e.p * m; break;
      case 'pgrow': s.pg = (s.pg || 0) + e.p * m; break;
      case 'maxhp': { const n = e.p * m; B.run.max += n; p.max += n; p.hp += n; log(B, { t: 'maxhp', n, hp: p.hp, max: p.max }); break; }
      case 'atk': for (let n = 0; n < (e.n || 1); n++) basicAtk(B); break;
      case 'ret': { const t = front(B); if (t && p.last > 0) hitFoe(B, t, '無', p.last * e.p * m, i); B.charge = 1; break; }
      case 'exe': for (const t of alive(B)) { const th = t.boss ? e.p * 0.5 : e.p; if (t.hp <= t.max * th) { log(B, { t: 'exe', to: B.foes.indexOf(t) }); kill(B, t); } } break;
      case 'amp': for (const t of alive(B)) if (t.st[e.st] > 0) { t.st[e.st] *= 1 + (e.p - 1) * HZ.mul(s) * f; log(B, { t: 'st', to: B.foes.indexOf(t), st: e.st, n: 0, v: t.st[e.st] }); } break;
      case 'bufgold': { const n = (B.run.gold + B.gold) * e.p * m; p.魔 += n; log(B, { t: 'buf', s: '魔', n, v: p.魔 }); break; }
      case 'spread': {
        const t = front(B); if (!t) break;
        let any = false;
        for (const x of alive(B)) if (x !== t) for (const st of HZ.STAT) if (t.st[st] > 0 && !(x.st[st] >= t.st[st])) { x.st[st] = t.st[st]; any = true; }
        if (any) react(B, t, '拡散');
        break;
      }
    }
  }
  function basicAtk(B) {
    const t = front(B);
    if (!t) return;
    log(B, { t: 'atk' });
    hitFoe(B, t, '無', B.run.atk, -1);
    B.charge = 1;
    emit(B, 'atk', {});
  }
  function process(B) {
    while (B.q.length) {
      if (B.fires > LIMIT) { B.inf = true; B.q.length = 0; break; }
      const e = B.q.shift();
      if (!alive(B).length) { B.q.length = 0; break; }
      for (let i = 0; i < B.sk.length; i++) {
        if (!matches(B, B.sk[i], i, e)) continue;
        const k = B.sk[i];
        if (k.s.ev > 1) { k.cnt++; if (k.cnt % k.s.ev !== 0) continue; }
        fire(B, i);
      }
    }
    if (B.inf) {
      log(B, { t: 'inf' });
      for (const f of alive(B)) { f.hp = 0; log(B, { t: 'dmg', to: B.foes.indexOf(f), amt: Infinity, el: '無' }); kill(B, f); if (f.alive) { f.hp = 0; f.alive = false; } }
    }
  }

  /* ---------- 敵の行動 ---------- */
  HZ.intent = (f) => {
    const a = f.act[f.ai % f.act.length];
    const [k, n] = a.split(':');
    const A = f.atk;
    switch (k) {
      case 'atk': return { k, text: '攻撃', dmg: A };
      case 'big': return { k, text: '大技', dmg: A * 2.5 };
      case 'multi': return { k, text: `${n}回攻撃`, dmg: A * 0.5, n: +n };
      case 'sh': return { k, text: '身を守る' };
      case 'heal': return { k, text: '回復' };
      case 'burn': return { k, text: '火を吐く', dmg: A * 0.5 };
      case 'poison': return { k, text: '毒', dmg: A * 0.5 };
      case 'curse': return { k, text: '呪い', dmg: A * 0.5 };
      case 'buff': return { k, text: '力をためる' };
      case 'steal': return { k, text: 'お金を盗む', dmg: A * 0.6 };
      case 'summon': return { k, text: '仲間を呼ぶ', id: n };
    }
    return { k, text: '？' };
  };
  function foeAct(B, f) {
    const i = HZ.intent(f);
    f.ai++;
    const fi = B.foes.indexOf(f);
    if (f.st.凍結 > 0) { f.st.凍結 = Math.max(0, f.st.凍結 - 1); log(B, { t: 'frozen', to: fi }); return; }
    log(B, { t: 'act', f: fi, k: i.k, text: i.text });
    const p = B.p;
    switch (i.k) {
      case 'atk': case 'big': case 'steal': hurt(B, i.dmg, 'atk'); break;
      case 'multi': for (let n = 0; n < i.n; n++) { hurt(B, i.dmg, 'atk'); process(B); if (B.p.hp <= 0) break; } break;
      case 'sh': f.sh += f.atk * 2.5; log(B, { t: 'fsh', to: fi, sh: f.sh }); break;
      case 'heal': f.hp = Math.min(f.max, f.hp + f.max * 0.1); log(B, { t: 'fheal', to: fi, hp: f.hp }); break;
      case 'burn': p.st.燃焼 = (p.st.燃焼 || 0) + f.atk * 0.8; hurt(B, i.dmg, 'atk'); break;
      case 'poison': p.st.毒 = (p.st.毒 || 0) + f.atk * 0.4; hurt(B, i.dmg, 'atk'); break;
      case 'curse': p.st.呪い = (p.st.呪い || 0) + 1; hurt(B, i.dmg, 'atk'); break;
      case 'buff': f.atk *= 1.3; log(B, { t: 'fbuff', to: fi }); break;
      case 'summon': if (alive(B).length < 4) { const c = HZ.foeStats(i.id, f.k); B.foes.push(c); log(B, { t: 'spawn', to: B.foes.length - 1 }); } break;
    }
    if (i.k === 'steal') { const g = Math.min(B.run.gold, 4 + Math.round(f.k)); B.run.gold -= g; log(B, { t: 'steal', n: g }); }
    process(B);
  }

  /* ---------- 1ターン ---------- */
  HZ.turn = (B) => {
    if (B.over) return B;
    B.t++;
    B.combo = 0; B.fires = 0;
    for (const k of B.sk) k.n = 0;
    B.p.sh *= 0.5;
    log(B, { t: 'turn', n: B.t });
    if (B.t === 1) emit(B, 'start', {});
    emit(B, 'turn', {});
    process(B);
    if (alive(B).length) { basicAtk(B); process(B); }
    if (check(B)) return B;
    for (const f of B.foes.slice()) {
      if (!f.alive) continue;
      foeAct(B, f);
      if (check(B)) return B;
    }
    emit(B, 'end', {});
    process(B);
    if (check(B)) return B;
    // 状態のダメージ・再生
    for (const f of alive(B)) {
      const fi = B.foes.indexOf(f);
      if (f.st.燃焼 > 0.5) { const d = f.st.燃焼; f.hp -= d; B.stat.dmg += d; f.st.燃焼 = d * 0.5; log(B, { t: 'dot', to: fi, st: '燃焼', amt: d, hp: Math.max(0, f.hp), v: f.st.燃焼 }); }
      if (f.st.毒 > 0.5) { const d = f.st.毒 * (B.law.el.毒 || 1); f.hp -= d; B.stat.dmg += d; log(B, { t: 'dot', to: fi, st: '毒', amt: d, hp: Math.max(0, f.hp), v: f.st.毒 }); }
      if (f.tr.regen && f.hp > 0) f.hp = Math.min(f.max, f.hp + f.max * f.tr.regen / 100);
      f.sh *= 0.5;
      if (f.hp <= 0) kill(B, f);
    }
    process(B);
    const p = B.p;
    if (p.st.燃焼 > 0.5) { hurt(B, p.st.燃焼, 'burn'); p.st.燃焼 *= 0.5; }
    if (p.st.毒 > 0.5) { hurt(B, p.st.毒, 'poison'); p.st.毒 *= 0.75; }
    process(B);
    if (check(B)) return B;
    // 長引くと敵がいきり立つ
    if (B.t >= 10) { for (const f of alive(B)) f.atk *= 1.25; log(B, { t: 'rage' }); }
    return B;
  };
  function check(B) {
    if (!alive(B).length) { B.over = 'win'; log(B, { t: 'win' }); return true; }
    if (B.p.hp <= 0) { B.over = 'lose'; log(B, { t: 'lose' }); return true; }
    return false;
  }

  // 試算：1ターン目だけを、今の構成で計算する（元の旅は変えない）
  HZ.preview = (run, foes, opt) => {
    const r = HZ.clone({ hp: run.hp, max: run.max, atk: run.atk, gold: run.gold, titles: run.titles, eq: run.eq, skills: run.skills, tonic: run.tonic });
    const B = HZ.newBattle(r, foes.map((f) => HZ.clone(f)), opt);
    HZ.turn(B);
    return B;
  };
  // 戦いを最後まで（自動プレイ・テスト用）
  HZ.fight = (run, foes, opt, maxT) => {
    const B = HZ.newBattle(run, foes, opt);
    while (!B.over && B.t < (maxT || 60)) { B.log = []; HZ.turn(B); }
    if (!B.over) B.over = 'lose';
    return B;
  };
})(typeof window !== 'undefined' ? window : globalThis);
