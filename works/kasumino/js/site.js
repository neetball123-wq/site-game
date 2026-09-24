/* 霞野線アーカイブ — 公式サイト：トップ、路線図、駅、時刻表、スタンプ帳、リンク、資料室 */
(() => {
  'use strict';
  const { D, $, $$, esc, state, save, fact, toast, modal, station, hasStamp, addStamp, page, norm, routes, leave, go, ymd } = K;
  const art = K.art;

  // ページを離れるときの後片付け（モールス信号の停止など）
  const cleanups = [];
  const clearPage = () => { while (cleanups.length) cleanups.pop()(); };
  K.clearPage = clearPage;
  K.onCleanup = fn => cleanups.push(fn);
  leave.site = clearPage;

  const allStops = () => (state.tsuki ? [...D.stations, D.tsukimino] : [...D.stations]).sort((a, b) => a.km - b.km);

  /* ---------- トップ ---------- */
  const heroArt = '<svg class="hero-art" viewBox="0 0 800 220" role="img" aria-label="鉄橋をわたるナダ100形の絵"><defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1CFA2"/><stop offset="1" stop-color="#F6E9D0"/></linearGradient></defs>'
    + '<rect width="800" height="220" fill="url(#dusk)"/><circle cx="628" cy="84" r="30" fill="#EFA96E" opacity=".75"/><path d="M0 138C120 108 220 128 320 106S520 80 620 108S760 98 800 90V220H0Z" fill="#CDB791"/>'
    + '<rect y="176" width="800" height="44" fill="#A9BDBF"/><path d="M0 188q20-5 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke="#C9D6D5" fill="none" stroke-width="2"/>'
    + '<rect y="160" width="800" height="7" fill="#4E4034"/>' + Array.from({ length: 20 }, (_, i) => `<path d="M${i * 40} 167l20 12l20-12" stroke="#4E4034" stroke-width="3" fill="none"/>`).join('')
    + '<g transform="translate(300 116)"><rect width="170" height="42" rx="6" fill="#EFE3C8"/><rect y="26" width="170" height="16" fill="#D0552E"/><rect y="-6" width="170" height="7" rx="3" fill="#8D8A84"/>'
    + [10, 36, 62, 88, 114, 140].map(x => `<rect x="${x}" y="7" width="18" height="14" rx="2" fill="#56626B"/>`).join('') + '<circle cx="4" cy="16" r="3" fill="#FFF1C2"/></g></svg>';

  routes[''] = () => {
    clearPage();
    const upd = [...(state.ended ? [[ymd(new Date(state.endedAt)), '管理人が戻りました。路線図に13番目の駅を追加しました']] : []), ...D.updates];
    const notice = state.ended
      ? '<p>ご心配をおかけしました。管理人のミナトです。戻りました。くわしくは日記に書きました。</p><p><a href="#/diary">管理人日記へ</a></p>'
      : '<p>9月5日から、管理人の更新が止まっています。最後の日記は「限定公開」になっています。</p><p><a href="#/diary">管理人日記へ</a>　<a href="#/bbs">掲示板へ</a></p>';
    page(`<section class="hero">${heroArt}<div class="hero-text"><div class="sabo"><span>灘浜</span><i>⇔</i><span>霞野</span></div>`
      + '<p class="hero-sub">北灘鉄道 霞野線　1931 – 1987</p><p class="hero-lead">海辺の町から、ダム湖と峠を越えて、霧の高原まで。<br>24.6kmの小さな鉄道の記録です。</p></div></section>'
      + (state.ended ? '' : '<p class="intro-note"><b>はじめに</b>このサイトは、ページの中を調べながら進める体験型の謎解きです（目安：約25分）。わかったことは右下の「調査ノート」に自動で記録されます。</p>')
      + `<div class="top-grid"><section class="box"><h2>更新履歴</h2><ul class="upd">${upd.map(([d, t]) => `<li><time>${d}</time><span>${esc(t)}</span></li>`).join('')}</ul></section>`
      + `<section class="box notice${state.ended ? ' is-back' : ''}"><h2>管理人より</h2>${notice}</section></div>`
      + '<section class="box"><h2>霞野線について</h2><dl class="spec"><div><dt>区間</dt><dd>灘浜 〜 霞野</dd></div><div><dt>営業キロ</dt><dd>24.6 km</dd></div>'
      + `<div><dt>駅数</dt><dd>${state.ended ? '12（＋1）' : '12'}</dd></div><div><dt>開業</dt><dd>1931年4月1日</dd></div><div><dt>廃止</dt><dd>1987年3月31日</dd></div><div><dt>線路</dt><dd>1067mm・単線・非電化</dd></div></dl></section>`
      + '<nav class="sitemap" aria-label="コンテンツ">'
      + [['#/route', '路線図', '12の駅と距離標'], ['#/timetable', '時刻表', '1987年3月 最後のダイヤ'], ['#/gallery', '写真館', '走っていたころの風景'],
        ['#/car', '保存車両', 'ナダ101の車内へ'], ['#/stamps', 'スタンプ帳', '駅スタンプを集める'], ['#/bbs', '掲示板', '思い出話と情報交換']]
        .map(([h, t, s]) => `<a href="${h}"><b>${t}</b><span>${s}</span></a>`).join('') + '</nav>');
  };

  /* ---------- 路線図 ---------- */
  const PATH = 'M60 372C150 370 205 334 262 322S382 336 432 292S522 204 602 208S742 172 792 132S902 82 950 72';
  routes.route = () => {
    clearPage();
    const p = page('<h1 class="page-title">路線図</h1><p class="lead">駅を押すと、駅の案内とスタンプのページが開きます。</p>'
      + `<div class="map-tools"><button type="button" id="km-toggle" class="toggle" aria-pressed="${state.kmMode}">距離標表示</button><span id="km-read" class="km-read" aria-live="polite">${state.kmMode ? '線路の上を押すと、その地点のキロ程がわかります。' : ''}</span></div>`
      + `<div class="map-wrap"><svg id="map" class="map${state.kmMode ? ' km' : ''}" viewBox="0 0 1000 440" role="img" aria-label="霞野線 路線図">`
      + '<rect width="1000" height="440" class="land"/><g id="map-deco"></g>'
      + `<path id="map-line" d="${PATH}" class="bed"/><path d="${PATH}" class="rail"/><g id="map-ticks"></g><path id="map-hit" d="${PATH}" class="hit"/><g id="map-st"></g><g id="map-mark"></g></svg></div>`
      + `<ol class="st-list">${allStops().map(s => `<li><a href="#/station/${s.id}"><span>${esc(s.name)}</span><small>${s.km.toFixed(1)} km</small></a></li>`).join('')}</ol>`);
    const svg = $('#map', p), line = $('#map-line', p), L = line.getTotalLength();
    const at = km => line.getPointAtLength(L * Math.min(1, Math.max(0, km / 24.6)));
    const normal = km => { const a = at(km - 0.05), b = at(km + 0.05), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; };

    // 海・ダム湖・山
    const lake = at(11.0), n = normal(11.0), mt = at(19.5);
    $('#map-deco', p).innerHTML = '<path d="M0 300C50 300 96 336 118 440H0Z" class="sea"/><text x="18" y="420" class="deco-t">灘浜湾</text>'
      + `<ellipse cx="${lake.x + n.x * 52}" cy="${lake.y + n.y * 52}" rx="70" ry="30" class="lake"/><text x="${lake.x + n.x * 52}" y="${lake.y + n.y * 52 + 5}" text-anchor="middle" class="deco-t">霞ダム湖</text>`
      + [[-60, 0], [-10, -26], [44, -8], [110, -40]].map(([dx, dy]) => `<path d="M${mt.x + dx - 34} ${mt.y + dy - 36}l34-44l34 44z" class="mt"/>`).join('');

    // 距離標
    if (state.kmMode) {
      let ticks = '';
      for (let k = 0; k <= 24.5; k += 0.5) {
        const pt = at(k), nn = normal(k), big = Number.isInteger(k), len = big ? 10 : 6;
        ticks += `<path d="M${pt.x - nn.x * len} ${pt.y - nn.y * len}L${pt.x + nn.x * len} ${pt.y + nn.y * len}" class="tick"/>`;
        if (big) ticks += `<text x="${pt.x - nn.x * 22}" y="${pt.y - nn.y * 22 + 4}" text-anchor="middle" class="tick-t">${k}</text>`;
      }
      $('#map-ticks', p).innerHTML = ticks;
    }

    // 駅
    $('#map-st', p).innerHTML = allStops().map((s, i) => {
      const pt = at(s.km), nn = normal(s.km), side = i % 2 ? 1 : -1, off = state.kmMode ? 40 : 26;
      const lx = pt.x + nn.x * off * side, ly = pt.y + nn.y * off * side + 5;
      return `<a href="#/station/${s.id}" class="st${s.id === 'tsukimino' ? ' ghost' : ''}${hasStamp(s.id) ? ' got' : ''}"><circle cx="${pt.x}" cy="${pt.y}" r="${s.staffed ? 9 : 7}"/><text x="${lx}" y="${ly}" text-anchor="middle">${esc(s.name)}</text></a>`;
    }).join('');

    $('#km-toggle', p).addEventListener('click', () => { state.kmMode = !state.kmMode; save(); routes.route(); });

    // 線路を押した地点のキロ程
    const samples = Array.from({ length: 700 }, (_, i) => line.getPointAtLength((L * i) / 699));
    $('#map-hit', p).addEventListener('click', e => {
      if (!state.kmMode) { toast('路線図', '右上の「距離標表示」を押すと、線路の上の地点のキロ程がわかります。'); return; }
      const m = svg.getScreenCTM().inverse(), q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
      let best = 0, bd = Infinity;
      samples.forEach((s, i) => { const d = (s.x - q.x) ** 2 + (s.y - q.y) ** 2; if (d < bd) { bd = d; best = i; } });
      const km = Math.round((best / 699) * 24.6 * 10) / 10, pt = samples[best];
      $('#map-mark', p).innerHTML = `<circle cx="${pt.x}" cy="${pt.y}" r="6" class="mark"/><text x="${pt.x}" y="${pt.y - 16}" text-anchor="middle" class="mark-t">${km.toFixed(1)}km</text>`;
      const read = $('#km-read', p);
      if (Math.abs(km - D.tsukimino.km) <= 0.21 && !state.tsuki) {
        read.textContent = `${km.toFixed(1)}km地点 ―― ……霧の向こうに、灯りが見える。`;
        state.tsuki = true;
        save();
        fact('tsuki');
        $('#map-mark', p).innerHTML += `<circle cx="${pt.x}" cy="${pt.y}" r="10" class="found"/>`;
        setTimeout(() => go('#/station/tsukimino'), 1800);
      } else if (km > 8.4 && km < 11.6 && !state.tsuki) {
        read.textContent = `${km.toFixed(1)}km地点 ―― 霧が深い。何も見えない。`;
      } else {
        read.textContent = `${km.toFixed(1)}km地点`;
      }
    });
  };

  /* ---------- 駅のページ ---------- */
  function neighbors(s) {
    const list = allStops(), i = list.findIndex(x => x.id === s.id);
    return [list[i - 1], list[i + 1]];
  }
  routes.station = ([id]) => {
    clearPage();
    const s = station(id);
    if (!s || (id === 'tsukimino' && !state.tsuki)) { go('#/route'); return; }
    const [prev, next] = neighbors(s), tsuki = id === 'tsukimino';
    let stampHtml;
    if (s.staffed || tsuki) {
      stampHtml = `<div class="st-stamp">${art.stamp(s)}<div><p>${tsuki ? '待合室の窓口に、見たことのないスタンプが置いてあった。' : '駅の窓口に置かれていたスタンプです。'}</p>`
        + `<button type="button" class="btn" id="press"${hasStamp(s.id) ? ' disabled' : ''}>${hasStamp(s.id) ? '押しました' : 'スタンプ帳に押す'}</button></div></div>`;
    } else {
      const where = { gallery: '写真館のどこかに写り込んでいるそうです。', bbs: '掲示板のスタンプ職人さんが、写しを貼ってくれています。', car: '保存車両ナダ101の車内に移設されたそうです。' }[s.stampAt];
      stampHtml = `<div class="st-stamp none"><p>無人駅のため、駅にスタンプは置かれていませんでした。</p><p class="small">${state.facts.includes('unmanned') ? esc(where) : 'スタンプのありかは、掲示板で聞いてみると分かるかもしれません。'}</p></div>`;
    }
    const p = page(`<a class="back" href="#/route">← 路線図にもどる</a><div class="${tsuki ? 'st-page night' : 'st-page'}">`
      + `<div class="ekimei"><p class="ek-kana">${s.kana}</p><p class="ek-name">${esc(s.name)}</p><p class="ek-roma">${s.roma}</p>`
      + `<div class="ek-bar"><span>${prev ? '← ' + prev.kana : ''}</span><span>${next ? next.kana + ' →' : ''}</span></div></div>`
      + `<dl class="st-info"><div><dt>キロ程</dt><dd>${s.km.toFixed(1)} km</dd></div><div><dt>電略</dt><dd>${s.code}</dd></div><div><dt>開業</dt><dd>${s.opened}</dd></div><div><dt>種別</dt><dd>${tsuki ? '――' : s.staffed ? '有人駅' : '無人駅'}</dd></div></dl>`
      + `<p class="st-note">${esc(s.note)}</p>${tsuki ? signalBlock() : ''}${stampHtml}`
      + `<nav class="st-nav">${prev ? `<a href="#/station/${prev.id}">← ${esc(prev.name)}</a>` : '<span></span>'}${next ? `<a href="#/station/${next.id}">${esc(next.name)} →</a>` : '<span></span>'}</nav></div>`);
    const press = $('#press', p);
    if (press) press.addEventListener('click', () => { if (addStamp(s.id)) { press.disabled = true; press.textContent = '押しました'; } });
    if (tsuki) startSignal(p);
  };

  /* ---------- 月見野の信号機（和文モールス） ---------- */
  function signalBlock() {
    return '<section class="sig-box"><div class="sig-art">' + art.signal() + '</div><div class="sig-side">'
      + '<p>ホームの端で、出発信号機が瞬いている。短く、長く。同じ調子を、ずっとくり返している。</p>'
      + '<div class="sig-ctrl"><button type="button" class="toggle" id="sig-slow" aria-pressed="false">ゆっくり</button><button type="button" class="toggle" id="sig-sound" aria-pressed="false">音を出す</button></div>'
      + `<label class="memo-l" for="sig-memo">書き取りメモ（この端末にだけ保存）</label><textarea id="sig-memo" rows="3" placeholder="例：・－・・ ／ －・－－－ ／ ……">${esc(state.morseNote)}</textarea></div></section>`;
  }
  function startSignal(p) {
    fact('morse');
    const table = Object.fromEntries(D.old.morse);
    const seq = [];
    [...D.signalWord].forEach((ch, i, arr) => {
      const code = table[ch];
      [...code].forEach((sym, j) => { seq.push([true, sym === '・' ? 1 : 3]); if (j < code.length - 1) seq.push([false, 1]); });
      seq.push([false, i < arr.length - 1 ? 5 : 14]);
    });
    let idx = 0, timer = 0, slow = false, sound = false, ac = null, osc = null, gain = null;
    const lamp = $('#lamp', p), glow = $('#lamp-glow', p);
    function tone(on) {
      if (!sound) return;
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC(); osc = ac.createOscillator(); gain = ac.createGain();
        osc.frequency.value = 640; gain.gain.value = 0; osc.connect(gain).connect(ac.destination); osc.start();
      }
      gain.gain.setTargetAtTime(on ? 0.12 : 0, ac.currentTime, 0.008);
    }
    function step() {
      const [on, units] = seq[idx];
      idx = (idx + 1) % seq.length;
      lamp.setAttribute('fill', on ? '#FFD27A' : '#3A342C');
      glow.setAttribute('opacity', on ? '0.45' : '0');
      tone(on);
      timer = setTimeout(step, units * (slow ? 380 : 230));
    }
    step();
    $('#sig-slow', p).addEventListener('click', e => { slow = !slow; e.currentTarget.setAttribute('aria-pressed', String(slow)); });
    $('#sig-sound', p).addEventListener('click', e => {
      sound = !sound;
      e.currentTarget.setAttribute('aria-pressed', String(sound));
      if (ac) ac.resume();
      if (!sound && gain) gain.gain.value = 0;
    });
    $('#sig-memo', p).addEventListener('input', e => { state.morseNote = e.target.value.slice(0, 400); save(); });
    K.onCleanup(() => { clearTimeout(timer); if (ac) ac.close(); });
  }

  /* ---------- 時刻表 ---------- */
  const addMin = (t, m) => { const [h, mm] = t.split(':').map(Number); const v = h * 60 + mm + m; return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
  function ttTable(title, order, trains, offsets) {
    const head = trains.map(([no]) => `<th scope="col">${no}</th>`).join('');
    const rows = order.map((id, i) => {
      const s = station(id);
      return `<tr><th scope="row">${esc(s.name)}<small>${s.km.toFixed(1)}</small></th>${trains.map(([, t]) => `<td>${addMin(t, offsets[i])}</td>`).join('')}</tr>`;
    }).join('');
    return `<section class="tt"><h2>${title}</h2><div class="tt-wrap"><table><thead><tr><th scope="col">駅 <small>キロ程</small></th>${head}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  routes.timetable = () => {
    clearPage();
    const downOrder = [...D.upOrder].reverse();
    page('<h1 class="page-title">時刻表</h1><p class="lead">1987年3月、霞野線最後のダイヤです。上段が発車時刻、終着駅は到着時刻です。</p>'
      + ttTable('上り　霞野 → 灘浜', D.upOrder, D.upTrains, D.upOffsets)
      + ttTable('下り　灘浜 → 霞野', downOrder, D.downTrains, D.downOffsets)
      + '<ul class="notes"><li>列車番号の「D」は気動車（ディーゼルカー）の列車を表します。</li><li>147D・148D は、廃止日の最終列車です。147Dの車両は霞野で折り返し、148Dになりました。</li>'
      + '<li>汐入駅で上下列車の行き違いを行います。</li><li>霧ノ台駅のスタンプは、保存車両ナダ101の車内に移設しました。</li></ul>');
  };

  /* ---------- スタンプ帳 ---------- */
  routes.stamps = () => {
    clearPage();
    const slots = [...D.stations, D.tsukimino].sort((a, b) => a.km - b.km).map(s => {
      if (hasStamp(s.id)) return `<button type="button" class="sb-slot filled" data-id="${s.id}" style="--r:${(s.km * 7) % 11 - 5}deg">${art.stamp(s)}<span>${esc(s.name)}</span></button>`;
      if (s.id === 'tsukimino') return `<div class="sb-slot empty ghost" aria-label="名前のない欄"><span>${state.tsuki ? esc(s.name) : '　'}</span></div>`;
      return `<div class="sb-slot empty"><span>${esc(s.name)}</span></div>`;
    }).join('');
    const p = page(`<h1 class="page-title">スタンプ帳</h1><p class="lead">駅のページで押したスタンプが、ここに集まります。押したスタンプを押すと、大きく見られます。（${K.stampCount()}/12）</p>`
      + `<div class="stampbook">${state.diary ? '<p class="sb-memo">合言葉は、スタンプの中の小さな文字を、灘浜から順に。</p>' : ''}<div class="sb-grid">${slots}</div>`
      + `${state.stamps.includes('tsukimino') ? '<p class="sb-memo end">13個目。見つけてくれて、ありがとう。</p>' : ''}</div>`);
    $$('.sb-slot.filled', p).forEach(b => b.addEventListener('click', () => {
      const s = station(b.dataset.id);
      modal(`<div class="stamp-zoom">${art.stamp(s, { cls: 'big' })}<p>${esc(s.name)}駅（${s.km.toFixed(1)}km）</p></div>`, 'm-stamp');
    }));
  };

  /* ---------- リンク ---------- */
  routes.links = () => {
    clearPage();
    page('<h1 class="page-title">リンク</h1><p class="lead">霞野線にゆかりのあるサイトです。</p><ul class="links">'
      + '<li><a href="#/old">ミナトの秘密基地</a><span>管理人が中学生のころに作っていたホームページです（2006〜2009・更新停止中）。</span></li>'
      + '<li><s>北灘市観光協会</s><span>リンク切れ</span></li><li><s>霞ダム管理事務所</s><span>リンク切れ</span></li>'
      + '<li><s>全国鉄道保存団体ネットワーク</s><span>サイト閉鎖</span></li></ul>');
  };

  /* ---------- 資料室 ---------- */
  routes.archive = () => {
    clearPage();
    const p = page('<h1 class="page-title">資料室（会員専用）</h1><p class="lead">保存会の資料室にあるパソコンへ接続します。会員IDまたは乗務員番号と、パスワードを入力してください。</p>'
      + '<form id="arc-form" class="arc-form"><div class="field"><label for="arc-id">会員ID／乗務員番号</label><input id="arc-id" autocomplete="off" placeholder="例：A-0001"></div>'
      + '<div class="field"><label for="arc-pw">パスワード</label><input id="arc-pw" autocomplete="off" type="password"></div><button class="btn" type="submit">接続する</button><p id="arc-msg" class="form-msg" aria-live="polite"></p></form>');
    $('#arc-form', p).addEventListener('submit', e => {
      e.preventDefault();
      const id = norm($('#arc-id', p).value).replace(/[-‐ー－]/g, ''), pw = norm($('#arc-pw', p).value);
      const msg = $('#arc-msg', p);
      if (!['K0731', '0731'].includes(id)) { msg.textContent = 'その会員ID・乗務員番号は登録されていません。'; return; }
      if (!['カエリミチ', 'KAERIMICHI', '帰リ道', '帰道'].includes(pw)) { msg.textContent = 'パスワードが違います。'; return; }
      state.archive = true;
      save();
      fact('kaerimichi');
      fact('tms');
      msg.textContent = '資料室のパソコンに接続しています……';
      setTimeout(() => go('#/tms'), 1400);
    });
  };
})();
