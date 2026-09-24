/* NEMURE — 裏側：関係者ログイン、管理画面、そして？？？ */
(() => {
  'use strict';
  const { S, state, save, $, esc, ymd, clock25, glitch, flash, hooks, reduced, music } = NM;

  /* ---------- 関係者ログイン ---------- */
  $('#auth-selects').innerHTML = [0, 1, 2, 3, 4].map(i =>
    `<select id="auth-${i}" aria-label="シーケンス ${i + 1}"><option value="">-- SELECT --</option>${S.authSymbols.map(s => `<option>${s}</option>`).join('')}</select>`).join('');

  hooks.staff = () => {
    const msg = $('#auth-msg');
    msg.className = 'auth-msg ok';
    msg.innerHTML = state.unlocked ? '前回の認証情報が残っています。<a href="#/admin">管理画面へ進む</a>' : '';
  };

  $('#auth-form').addEventListener('submit', e => {
    e.preventDefault();
    const vals = [0, 1, 2, 3, 4].map(i => $('#auth-' + i).value);
    const msg = $('#auth-msg');
    msg.className = 'auth-msg';
    if (vals.some(v => !v)) { msg.textContent = 'すべての項目を選択してください。'; return; }
    if (vals.join() === S.authAnswer.join()) { unlock(); return; }
    state.fails += 1;
    save();
    const f = state.fails;
    let html = `認証に失敗しました。シーケンスが一致しません。（試行 ${f}）`;
    if (f >= 5) html += `<br><span class="mio">……${S.authAnswer.slice(0, 3).join('、')}……。あとは、欠片を見て。</span>`;
    else if (f >= 3) html += `<br><span class="mio">……ちがうよ。はじまりは、${S.authAnswer[0]}。</span>`;
    msg.innerHTML = html;
    if (f >= 3) glitch(420);
  });

  function unlock() {
    const msg = $('#auth-msg');
    msg.className = 'auth-msg ok';
    msg.innerHTML = '認証しました。ようこそ producer_02 さん<div class="auth-bar"><i></i></div>';
    const bar = msg.querySelector('i');
    let p = 0;
    const t = setInterval(() => {
      p += 20;
      bar.style.width = p + '%';
      if (p < 100) return;
      clearInterval(t);
      state.unlocked = true;
      save();
      location.hash = '#/admin';
    }, reduced ? 60 : 280);
  }

  /* ---------- 管理画面 ---------- */
  let pane = 'talents', paneToken = 0, deletes = 0;
  const paneList = () => [
    ['talents', 'タレント一覧'],
    ['diary', '業務日誌'],
    ['logs', '配信ログ'],
    ['trash', `ゴミ箱 (${state.restored ? 0 : 1})`]
  ];
  function renderSide() {
    $('#adm-side').innerHTML = paneList().map(([id, label]) =>
      `<button type="button" data-pane="${id}"${id === pane ? ' aria-current="true"' : ''}>${label}</button>`).join('');
  }
  $('#adm-side').addEventListener('click', e => {
    const b = e.target.closest('[data-pane]');
    if (!b) return;
    pane = b.dataset.pane;
    renderSide();
    renderPane();
  });

  const table = (head, rows) => `<div class="tbl-wrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;

  function renderPane() {
    const main = $('#adm-main'), my = ++paneToken;
    if (pane === 'talents') {
      const rows = S.talents.map(([id, name, st, reg, memo]) => {
        const mio = id === 'T-005';
        const status = mio ? `<span class="red">${state.restored ? '活動中？' : st}</span>` : st;
        const nm = mio ? `<button type="button" class="lnk" id="open-mio">${esc(name)}</button>` : esc(name);
        return `<tr class="${mio && !state.restored ? 'deleted' : ''}"><td>${id}</td><td class="nm">${nm}</td><td>${status}</td><td>${reg}</td><td>${esc(memo)}</td></tr>`;
      }).join('');
      main.innerHTML = `<h2>タレント一覧</h2>${table(['ID', '名前', '状態', '登録日', '備考'], rows)}<div id="talent-note"></div>`;
      $('#open-mio').addEventListener('click', () => {
        $('#talent-note').innerHTML = state.restored
          ? '<p class="adm-note">このタレントのデータは、復元済みです。……いま、どこにいますか？</p>'
          : '<p class="adm-note">このタレントのデータは削除されています。削除データはゴミ箱に一時保管されます。</p>';
      });
    }
    if (pane === 'diary') {
      const now = new Date();
      const entries = [
        ...S.diary.map(([d, t]) => [d, t, false]),
        [ymd(now, '/'), `閲覧者 guest_${state.observer} が、この日誌を開いた。記録しておく。`, false],
        [`${ymd(now, '/')} ${clock25(now)}`, 'みつけた。', true]
      ];
      main.innerHTML = '<h2>業務日誌</h2><div class="adm-diary">' + entries.map(([d, t, m]) =>
        `<article class="${m ? 'mio' : ''}"><time>${d}</time><p>${esc(t)}</p></article>`).join('') + '</div>';
    }
    if (pane === 'logs') {
      const rows = S.logs.map((l, i) => `<tr><td>${l.date}</td><td>${esc(l.title)}</td><td>${l.viewers}</td><td>${l.transcript || l.broken ? `<button type="button" class="lnk" data-log="${i}">ログを開く</button>` : '<span style="color:#999">アーカイブ済</span>'}</td></tr>`).join('');
      main.innerHTML = `<h2>配信ログ</h2>${table(['日時', 'タイトル', '視聴者数', '操作'], rows)}<div class="adm-log" id="adm-log">ログを選択してください。</div>`;
      main.querySelectorAll('[data-log]').forEach(b => b.addEventListener('click', () => openLog(S.logs[b.dataset.log], my)));
    }
    if (pane === 'trash') renderTrash(main);
  }

  function openLog(log, token) {
    const out = $('#adm-log');
    if (log.broken) {
      out.innerHTML = '<span class="sys">ERROR: ファイルが破損しています (0x0707)</span>\n\n'
        + '<span class="m">■■■■ ずっと ■■■ 数えて ■■■■■■ 7月7日 ■■ ここは ■■ 水の ■■■■</span>';
      glitch(500);
      return;
    }
    out.innerHTML = '';
    let i = 0;
    const next = () => {
      if (token !== paneToken || i >= S.transcript.length) return;
      const [t, who, text] = S.transcript[i++];
      const line = document.createElement('div');
      line.className = who;
      line.textContent = who === 'sys' ? `[${t}] ${text}` : `[${t}] ？？？：${text}`;
      out.appendChild(line);
      if (i === S.transcript.length - 1) glitch(600);
      setTimeout(next, reduced ? 80 : 1100);
    };
    next();
  }

  function renderTrash(main) {
    if (state.restored) {
      main.innerHTML = '<h2>ゴミ箱</h2><p>ゴミ箱は空です。</p><p class="adm-note">mio_profile.bak は復元されました。復元先：<b>あなた</b></p>'
        + '<div class="adm-btns"><a class="win-btn" href="#/wake">もう一度、会いに行く</a></div>';
      return;
    }
    const fname = deletes >= 2 ? 'けさないで.bak' : 'mio_profile.bak';
    main.innerHTML = '<h2>ゴミ箱</h2>'
      + table(['ファイル名', 'サイズ', '削除日', '削除者'], `<tr><td>${fname}</td><td>4.2 KB</td><td>2026/07/08</td><td>producer_02</td></tr>`)
      + '<div class="adm-btns"><button type="button" class="win-btn" id="trash-del">完全に削除</button><button type="button" class="win-btn" id="trash-restore">復元</button></div><div id="trash-out"></div>';
    $('#trash-del').addEventListener('click', purge);
    $('#trash-restore').addEventListener('click', restore);
  }

  function progress(out, steps, label, done) {
    out.innerHTML = '<div class="adm-progress"><div class="bar"><i></i></div><p></p></div>';
    const bar = out.querySelector('i'), txt = out.querySelector('p');
    let i = 0;
    const t = setInterval(() => {
      const v = steps[i++];
      bar.style.width = v + '%';
      txt.textContent = `${label}… ${v}%`;
      if (i < steps.length) return;
      clearInterval(t);
      done(txt);
    }, reduced ? 120 : 650);
  }

  function purge() {
    deletes += 1;
    const out = $('#trash-out');
    $('#trash-del').disabled = $('#trash-restore').disabled = true;
    progress(out, [18, 42, 67, 88], '削除しています', txt => {
      txt.innerHTML = deletes >= 2
        ? '<span class="red">エラー：……けさないで。</span>'
        : '<span class="red">エラー：ファイルは使用中のため削除できません。（使用者：mio）</span>';
      glitch(deletes >= 2 ? 900 : 300);
      setTimeout(() => renderTrash($('#adm-main')), deletes >= 2 ? 1800 : 2600);
    });
  }

  function restore() {
    const out = $('#trash-out');
    $('#trash-del').disabled = $('#trash-restore').disabled = true;
    progress(out, [12, 31, 47, 68, 85, 99, 99, 99], '復元しています', txt => {
      txt.innerHTML = '復元先：<b>あなた</b>';
      glitch(1600);
      setTimeout(() => {
        flash(true);
        state.restored = true;
        save();
        location.hash = '#/wake';
      }, reduced ? 200 : 1500);
    });
  }

  const tickAdm = () => { $('#adm-time').textContent = `${ymd(new Date(), '/')} ${clock25()}`; };
  setInterval(tickAdm, 10000);
  hooks.admin = () => {
    $('#adm-observer').textContent = 'guest_' + state.observer;
    tickAdm();
    renderSide();
    renderPane();
  };
  hooks.leave_admin = () => { paneToken++; };

  /* ---------- ？？？（水の底） ---------- */
  const water = (() => {
    const c = $('#water'), ctx = c.getContext('2d');
    let w = 0, h = 0, raf = 0, bubbles = [];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bubbles = Array.from({ length: 26 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 3, v: 0.2 + Math.random() * 0.6, p: Math.random() * 6 }));
    }
    function draw(t) {
      ctx.fillStyle = '#050407';
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        ctx.strokeStyle = `rgba(111,134,184,${0.05 + 0.04 * Math.sin(t / 2000 + i)})`;
        ctx.beginPath();
        for (let x = 0; x <= w + 16; x += 16) {
          const y = h * (i / 14) + Math.sin(x / 140 + t / 1800 + i) * 18 + Math.sin(x / 53 - t / 1300 + i * 2) * 6;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(159,179,224,.28)';
      for (const b of bubbles) {
        if (!reduced) { b.y -= b.v; if (b.y < -10) { b.y = h + 10; b.x = Math.random() * w; } }
        ctx.beginPath();
        ctx.arc(b.x + Math.sin(t / 700 + b.p) * 4, b.y, b.r, 0, 6.29);
        ctx.stroke();
      }
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    addEventListener('resize', () => { if (raf) resize(); });
    return {
      start() { resize(); cancelAnimationFrame(raf); if (reduced) { draw(0); raf = 1; } else raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); raf = 0; }
    };
  })();

  let wakeToken = 0;
  function showLines(lines, token, done, gap = 2300) {
    const box = $('#wake-text');
    let i = 0;
    const next = () => {
      if (token !== wakeToken) return;
      if (i >= lines.length) { if (done) done(); return; }
      const p = document.createElement('p');
      p.textContent = lines[i++];
      box.appendChild(p);
      setTimeout(next, reduced ? 350 : gap);
    };
    next();
  }

  hooks.wake = () => {
    music.stop();
    $('#btn-music').setAttribute('aria-pressed', 'false');
    water.start();
    const my = ++wakeToken, d = new Date();
    $('#wake-text').innerHTML = '';
    $('#wake-choices').hidden = true;
    const lines = S.wakeLines({ visits: state.visits, time: clock25(d), hour: d.getHours() });
    setTimeout(() => showLines(lines, my, () => {
      $('#wake-choices').hidden = false;
      $('#choice-wake').focus({ preventScroll: true });
    }), reduced ? 0 : 1200);
  };
  hooks.leave_wake = () => { wakeToken++; water.stop(); };

  function ending(kind) {
    $('#wake-choices').hidden = true;
    $('#wake-text').innerHTML = '';
    const my = ++wakeToken;
    showLines(kind === 'awake' ? S.wakeYes : S.wakeNo, my, () => {
      setTimeout(() => {
        if (my !== wakeToken) return;
        state.ending = kind;
        state.endedAt = Date.now();
        state.endVisit = state.visits;
        save();
        flash(kind !== 'awake');
        NM.rerender();
        location.hash = '#top';
        const name = kind === 'awake' ? 'おはよう' : 'おやすみ';
        setTimeout(() => {
          NM.whisper(kind === 'awake' ? `おはよう、guest_${state.observer}。これからは、5人で。` : 'おやすみなさい。……またね。', 7000, kind === 'awake' ? 'FROM MIO' : '？？？');
          NM.whisper(`エンディング「${name}」に到達しました。もうひとつの結末は、管理画面のゴミ箱から。`, 9000, 'SYSTEM');
        }, 1400);
      }, reduced ? 300 : 2000);
    }, 2100);
  }
  $('#choice-wake').addEventListener('click', () => ending('awake'));
  $('#choice-sleep').addEventListener('click', () => ending('asleep'));

  NM.boot();
})();
