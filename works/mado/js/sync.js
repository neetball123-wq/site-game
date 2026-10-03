/* ふたつの窓 — タブどうしで同じ夜を共有する
   ・状態はひとつ（localStorage の mado.v1）。どのタブも、変えるときは読み直してから書く。
   ・ほかのタブには storage イベント（と BroadcastChannel）で知らせる。
   ・どのタブがどの部屋かは sessionStorage（タブごと）に持つ。開いている部屋は mado.v1.p に。 */
(() => {
  const KEY = 'mado.v1', PKEY = 'mado.v1.p', RKEY = 'mado.room';
  MD.KEY = KEY;

  const fresh = () => ({
    v: 1, rev: 0, started: false,
    f: {},                       // 起きたこと
    inv: { a: [], b: [], c: [] },
    from: {},                    // 物の、もとの持ち主
    photos: [],                  // 撮った写真
    aim: null,                   // ソウの懐中電灯が照らしている場所
    basket: { at: 'b', item: null, from: null, to: null, t0: 0 },
    trips: 0,
    cat: 'eave',
    film: { v: false, h: false }, focus: 18, frame: 0, frames: {},
    talk: null, talks: {},
    time: MD.TIME.start,
    msg: { a: { n: 0, text: '' }, b: { n: 0, text: '' }, c: { n: 0, text: '' } },
    log: { a: [], b: [], c: [] },
    fx: { n: 0, name: '', t: 0, room: '' },
    playMs: 0, clock: {}, hintLv: {},
    giftLog: { a: [], b: [] }, gifts: { a: [], b: [] },
    ended: false, ending: null,
  });
  MD.fresh = fresh;

  const merge = (base, o) => {
    for (const k in o) {
      if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], o[k]);
      else base[k] = o[k];
    }
    return base;
  };
  const load = () => {
    try { const s = localStorage.getItem(KEY); if (s) return merge(fresh(), JSON.parse(s)); } catch (e) { }
    return fresh();
  };
  let memo = null;   // localStorage が使えないときの控え
  const save = (S) => { memo = S; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  MD.load = () => { try { if (localStorage.getItem(KEY) == null && memo) return memo; } catch (e) { if (memo) return memo; } return load(); };
  MD.S = MD.load();

  let bc = null;
  try { bc = new BroadcastChannel('mado'); } catch (e) { }
  const listeners = [];
  MD.onChange = (fn) => listeners.push(fn);
  const emit = (remote) => { for (const fn of listeners) { try { fn(remote); } catch (e) { console.error(e); } } };

  /* 状態を変える：読み直す → fn で書きかえ → 保存して知らせる。fn が false を返したら何もしない */
  MD.act = (fn, quiet) => {
    const S = MD.load();
    let r;
    try { r = fn(S); } catch (e) { console.error(e); return MD.S; }
    if (r === false) { MD.S = S; return S; }
    if (!quiet) S.rev++;
    save(S);
    MD.S = S;
    if (!quiet) { try { bc && bc.postMessage({ t: 's', rev: S.rev }); } catch (e) { } emit(false); }
    return S;
  };
  const pull = () => {
    const S = MD.load();
    const changed = S.rev !== MD.S.rev;
    MD.S = S;
    if (changed) emit(true);
  };
  addEventListener('storage', (e) => { if (e.key === KEY || e.key === null) pull(); if (e.key === PKEY) emit(true); });
  if (bc) bc.onmessage = (e) => { if (e.data && e.data.t === 's') pull(); if (e.data && e.data.t === 'p') emit(true); };
  // スマホでは裏のタブが止まることがあるので、戻ってきたら読み直す
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
  addEventListener('pageshow', pull);
  addEventListener('focus', pull);

  MD.reset = () => {
    const S = fresh();
    S.rev = (MD.S.rev || 0) + 1;
    save(S); MD.S = S;
    try { bc && bc.postMessage({ t: 's', rev: S.rev }); } catch (e) { }
    emit(false);
  };

  /* ---- このタブの部屋 ---- */
  MD.getRoom = () => { try { return sessionStorage.getItem(RKEY) || ''; } catch (e) { return ''; } };
  MD.setRoom = (r) => { try { sessionStorage.setItem(RKEY, r); } catch (e) { } };

  /* ---- 開いている部屋（ほかのタブ） ---- */
  const TAB = Math.random().toString(36).slice(2, 9);
  MD.TAB = TAB;
  let mine = [];
  const readP = () => { try { return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; } };
  const writeP = (open) => {
    const p = readP(), now = Date.now();
    for (const k of Object.keys(p)) if (p[k].tab === TAB || now - p[k].t > 180000) delete p[k];
    if (open) for (const r of mine) p[r + ':' + TAB] = { room: r, tab: TAB, t: now };
    try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) { }
    try { bc && bc.postMessage({ t: 'p' }); } catch (e) { }
  };
  MD.present = (rooms) => { mine = rooms.slice(); writeP(true); };
  /* ほかのタブで開いている部屋 */
  MD.others = () => {
    const p = readP(), now = Date.now(), out = {};
    for (const k of Object.keys(p)) { const v = p[k]; if (v.tab !== TAB && now - v.t < 120000) out[v.room] = true; }
    return out;
  };
  setInterval(() => { if (mine.length) writeP(true); }, 15000);
  addEventListener('pagehide', () => { const m = mine; mine = []; writeP(false); mine = m; });
  addEventListener('pageshow', (e) => { if (e.persisted && mine.length) writeP(true); });
})();
