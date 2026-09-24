/* =========================================================
   告知事項あり — 資料・スレ・数字
   ========================================================= */
window.KD = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  /* 和暦（令和・平成） */
  function wareki(d) {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    if (y >= 2019 && !(y === 2019 && m < 5)) return '令和' + (y === 2019 ? '元' : (y - 2018)) + '年' + m + '月' + day + '日';
    return '平成' + (y - 1988) + '年' + m + '月' + day + '日';
  }
  const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const kusumiIn = () => { const d = today(); d.setDate(d.getDate() - 48); return d; };

  /* 測れるところ（図面の数字と、じっさいの数字） */
  const MEASURE = [
    { k: 'rw', label: '洋室の幅', plan: 2730, real: 2730, at: ['room'] },
    { k: 'rd', label: '洋室の奥行', plan: 3640, real: 3640, at: ['room'] },
    { k: 'ch', label: '天井の高さ', plan: 2400, real: 2400, at: ['room', 'genkan'] },
    { k: 'cw', label: 'クローゼットの幅', plan: 1820, real: 1820, at: ['closet', 'room'] },
    { k: 'cd', label: 'クローゼットの奥行', plan: 910, real: 455, at: ['closet'] },
    { k: 'kw', label: 'キッチンの幅', plan: 1820, real: 1820, at: ['kitchen'] },
    { k: 'hl', label: '廊下の長さ', plan: 1820, real: 1820, at: ['genkan'] }
  ];

  /* 物件チラシの写真（昼間の、明るすぎる写真） */
  const PH = {
    room: `<svg viewBox="0 0 160 110" aria-label="洋室の写真"><rect width="160" height="110" fill="#F4F1EA"/><path d="M0 110L30 78h100l30 32z" fill="#C9A77E"/><path d="M30 78V14h100v64z" fill="#FBFAF6"/><rect x="48" y="20" width="64" height="52" fill="#DDEBF6" stroke="#B9C2CA" stroke-width="2"/><path d="M80 20v52" stroke="#B9C2CA" stroke-width="2"/><rect x="40" y="18" width="10" height="56" fill="#EDE6D8"/><rect x="110" y="18" width="10" height="56" fill="#EDE6D8"/><ellipse class="ph-face" cx="97" cy="41" rx="3.2" ry="4.2" fill="#E9E4DA" opacity=".55"/><circle cx="96" cy="40.5" r=".7" fill="#555" opacity=".5"/><circle cx="98.2" cy="40.5" r=".7" fill="#555" opacity=".5"/><path d="M0 0l30 14v64L0 110z" fill="#EFEBE3"/><path d="M160 0l-30 14v64l30 32z" fill="#EAE5DB"/><rect x="136" y="30" width="18" height="60" fill="#E2DCCF" stroke="#CFC7B8"/></svg>`,
    kitchen: `<svg viewBox="0 0 160 110" aria-label="キッチンの写真"><rect width="160" height="110" fill="#F6F3EC"/><rect x="10" y="56" width="140" height="40" fill="#E9E5DC" stroke="#CFC8BA"/><rect x="10" y="50" width="140" height="8" fill="#C8CCD0"/><rect x="26" y="52" width="40" height="4" rx="2" fill="#9EA4AA"/><circle cx="104" cy="54" r="5" fill="#333"/><circle cx="124" cy="54" r="5" fill="#333"/><rect x="10" y="10" width="140" height="26" fill="#EFEBE3" stroke="#D6CFC1"/>${[0, 1, 2].map(i => `<rect x="${16 + i * 46}" y="64" width="40" height="26" fill="#F3F0E9" stroke="#D6CFC1"/><rect x="${31 + i * 46}" y="70" width="10" height="2" fill="#A9A399"/>`).join('')}</svg>`,
    bath: `<svg viewBox="0 0 160 110" aria-label="浴室の写真"><rect width="160" height="110" fill="#EEF1F2"/><rect x="14" y="60" width="132" height="44" rx="8" fill="#FFFFFF" stroke="#CDD5D8"/><rect x="24" y="66" width="112" height="32" rx="6" fill="#E3EAEC"/><rect x="58" y="12" width="44" height="34" fill="#B8C4CA" stroke="#9AA6AC"/><path d="M62 16l12 12" stroke="#DDE6EA" stroke-width="3"/><rect x="74" y="48" width="12" height="6" fill="#A9B3B8"/></svg>`
  };

  function flyer() {
    return `<div class="fly">
      <p class="fly-cat">賃貸アパート ／ 1K</p>
      <h3 class="fly-t">コーポ柊 <b>204</b><small>号室</small></h3>
      <div class="fly-row"><p class="fly-price"><span>1.9</span>万円<small>管理費込</small></p><p class="fly-burst">敷金0<br>礼金0</p></div>
      <div class="fly-photos">${Object.entries({ room: '洋室', kitchen: 'キッチン', bath: '浴室' }).map(([k, t]) => `<button type="button" class="fly-ph" data-ph="${k}">${PH[k]}<span>${t}</span></button>`).join('')}</div>
      <table class="fly-tb">
        <tr><th>所在地</th><td>鷺ノ森3丁目</td></tr><tr><th>交通</th><td>鷺ノ森駅 徒歩5分</td></tr>
        <tr><th>間取り</th><td>1K（洋室6.0帖・クローゼット）</td></tr><tr><th>専有面積</th><td>21.06㎡</td></tr>
        <tr><th>所在階</th><td>2階 ／ 角部屋</td></tr><tr><th>築年月</th><td>平成7年3月</td></tr>
        <tr><th>入居</th><td>即入居可</td></tr><tr><th>備考</th><td><b class="fly-k">告知事項あり</b>（詳細はお問い合わせください）</td></tr>
      </table>
      <button type="button" class="fly-apply" data-act="apply">この部屋に申し込む</button>
      <p class="fly-foot">取扱：ひいらぎ不動産　担当：真壁<br>宅地建物取引業　知事（3）第08204号</p></div>`;
  }

  /* 間取り図（寸法はmm） */
  const PLAN = `<svg class="plan" viewBox="-40 -30 360 800" role="img" aria-label="間取り図">
    <defs><pattern id="kk-tile" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0h8v8" fill="none" stroke="#B9C4D0" stroke-width=".6"/></pattern>
    <pattern id="kk-wood" width="12" height="4" patternUnits="userSpaceOnUse"><path d="M0 4h12" stroke="#D8C9AE" stroke-width=".6"/></pattern></defs>
    <rect x="0" y="0" width="273" height="728" fill="#fff"/>
    <rect x="0" y="0" width="91" height="91" fill="url(#kk-tile)"/>
    <rect x="0" y="273" width="273" height="364" fill="url(#kk-wood)"/>
    <g fill="none" stroke="#2B3542" stroke-width="3"><path d="M0 0h273v637H0z"/><path d="M91 0v273M91 91h182M91 182h182M0 273h91M91 273h182"/></g>
    <path d="M0 637h273v91H0z" fill="#F1F4F6" stroke="#2B3542" stroke-width="2"/>
    <rect x="180" y="656" width="58" height="50" fill="none" stroke="#2B3542" stroke-width="1.6" stroke-dasharray="4 3"/>
    <text x="209" y="686" text-anchor="middle" font-size="9" fill="#2B3542">避難ハッチ</text>
    <path d="M28 637h70M175 637h70" stroke="#6FA4CF" stroke-width="5"/>
    <path d="M10 0h72" stroke="#fff" stroke-width="4"/><path d="M12 0a70 70 0 0 1 70 70" fill="none" stroke="#8A96A3" stroke-width="1.2"/>
    <path d="M10 273h72" stroke="#fff" stroke-width="4"/><path d="M12 273a60 60 0 0 0 60 60" fill="none" stroke="#8A96A3" stroke-width="1.2"/>
    <path d="M100 273h164" stroke="#fff" stroke-width="4"/><path d="M100 271h82M182 275h82" stroke="#8A96A3" stroke-width="2"/>
    <path d="M91 20v52" stroke="#fff" stroke-width="4"/>
    <rect x="96" y="96" width="172" height="26" fill="#E8EDF1" stroke="#8A96A3"/><circle cx="150" cy="109" r="7" fill="none" stroke="#8A96A3"/>
    <g font-size="12" font-weight="700" fill="#2B3542" text-anchor="middle">
      <text x="45" y="50">玄関</text><text x="182" y="50">UB</text><text x="182" y="160">K</text><text x="182" y="232">CL</text>
      <text x="136" y="455">洋室</text><text x="136" y="472" font-size="10">6.0帖</text><text x="136" y="690" font-size="10" font-weight="400">バルコニー</text>
    </g>
    <g font-size="9" fill="#C0392B" text-anchor="middle">
      <path d="M-18 273v364M-22 273h8M-22 637h8" stroke="#C0392B"/><text x="-26" y="459" transform="rotate(-90 -26 459)">3640</text>
      <path d="M0 752h273M0 748v8M273 748v8" stroke="#C0392B"/><text x="136" y="766">2730</text>
      <path d="M91 -14h182M91 -18v8M273 -18v8" stroke="#C0392B"/><text x="182" y="-19">1820（K・CL）</text>
      <path d="M290 182v91M286 182h8M286 273h8" stroke="#C0392B"/><text x="303" y="231" transform="rotate(90 303 231)">910</text>
      <path d="M-18 91v182M-22 91h8M-22 273h8" stroke="#C0392B"/><text x="-26" y="186" transform="rotate(-90 -26 186)">1820</text>
    </g>
    <text x="136" y="790" text-anchor="middle" font-size="9" fill="#5B6674">天井高 2400 ／ 単位：mm ／ 図面と現況が異なる場合は現況を優先</text>
  </svg>`;

  /* 重要事項説明書（黒塗りは、なぞると読める） */
  const K = (t) => `<span class="kuro">${t}</span>`;
  const SOLID = (n) => `<span class="kuro solid" aria-hidden="true">${'■'.repeat(n)}</span>`;
  const JUSETSU = `<div class="doc">
    <p class="doc-h">重要事項説明書（抜粋）</p><p class="doc-sub">物件：コーポ柊 204号室 ／ 作成：ひいらぎ不動産</p>
    <h4>1．建物</h4><p>木造2階建　平成7年3月新築　所有者：柊 繁</p>
    <h4>2．増改築等の履歴</h4><p>平成11年4月9日　${K('204号室 クローゼット（押入れ）部分を改装。奥行を910mmから455mmに変更。')}施主：${K('柊 繁（所有者）')}</p>
    <h4>3．告知事項（心理的瑕疵）</h4>
    <p>${K('平成11年3月、所有者の長女・柊 ナナエ（当時19歳）が、当該住戸より所在不明となり、捜索願が提出された。')}</p>
    <p>${K('平成21年以降、当該住戸において入居者の所在不明が4件発生している。')}</p>
    <p>${SOLID(24)}</p>
    <p class="doc-note">※上記について、当社は告知の義務はないものと判断しております。</p>
    <h4>4．備考</h4><p>${K('【社内用】夜間の内見は必ずオンラインで行うこと。担当者以外の者を室内に入れないこと。')}</p>
    <p class="doc-sign">宅地建物取引士　柊 誠一</p></div>`;

  function ledger() {
    const rows = [
      ['森本 アキラ', '平成21年4月2日', '平成21年5月20日', '連絡とれず・残置物あり'],
      ['大西 ハルカ', '平成24年9月1日', '平成24年10月19日', '同上'],
      ['滝 ソウスケ', '平成27年6月11日', '平成27年7月29日', '同上'],
      ['宮部 リツ', '令和元年11月3日', '令和元年12月21日', '同上'],
      ['久住 サキ', wareki(kusumiIn()), '―', '契約中']
    ];
    return `<div class="doc ledger"><p class="doc-h">入居者台帳（写し）　コーポ柊 204</p><p class="doc-sub">キッチンの引き出しにあった紙。折り目が何本もついている。</p>
      <table class="lg"><tr><th>No.</th><th>氏名</th><th>入居日</th><th>退去日</th><th>備考</th></tr>
      ${rows.map((r, i) => `<tr${i === 4 ? ' class="now"' : ''}><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>
      <p class="doc-note">※平成21年より前の記録は、所有者の意向により保管していない。</p></div>`;
  }

  /* スレ（考えている時間がのびると、書き込みがふえる） */
  const THREAD_T = '【告知事項あり】コーポ柊204【家賃1.9万】';
  const AMBIENT = [
    { s: 1, t: '家賃1.9万ってマジ？　駅5分だぞ' },
    { s: 1, t: '事故物件サイトに載ってないのが逆にこわい' },
    { s: 1, t: 'オンライン内見しかやってないらしい。担当しか部屋に入れないんだと' },
    { s: 2, t: '隣の家のやつ、夜中にずっと壁が鳴るって言ってた。コン、コン、って' },
    { s: 3, t: '四十九日って、死んだ人がこの世にいられる最後の日なんだっけ' },
    { s: 4, t: 'さむい', name: '＿＿＿', odd: true },
    { s: 4, t: 'くらい　せまい　{NAME}さん　きて', name: '＿＿＿', odd: true },
    { s: 5, t: 'にげて', name: '＿＿＿', odd: true }
  ];
  const HINTS = {
    1: ['あの部屋、なんか狭いんだよな。図面のわりに', '担当にメジャーで測らせろ。図面の数字と、1か所だけ合わない', 'クローゼットの奥行、図面は910なのに実際は455。「気づいたことを伝える」で「クローゼットの奥行」「455」'],
    2: ['重要事項説明書の黒塗り、あれ手抜きだぞ', '黒いところを指でなぞる（ドラッグで選択する）と読める。スマホは長押しして選択範囲をのばす', '大家の娘の名前は「ナナエ」（柊 ナナエ）。「気づいたことを伝える」に入れろ'],
    3: ['前の住人たち、入ってすぐ消えてる。何日で消えたか数えてみ。台帳はキッチンの引き出し', '入居日を1日目として数えると、みんな退去日がちょうど49日目。四十九日', '久住の入居日は、今日の48日前。つまり今夜で「49」日目'],
    4: ['停電したら、ナイトモードでクローゼットの奥の壁をよく見ろ。手のあとがある', '手のあとの「指の本数」が、ネジをはずす順番', '左下（指1本）→ 右上（2本）→ 左上（3本）→ 右下（4本）'],
    5: ['玄関はダメだ。あいつが立ってる', '間取り図のバルコニー、点線の四角があるだろ', 'バルコニーへ → 避難ハッチを開ける'],
    6: ['告知は4つとも、資料とあの夜のことで埋まる', '名前は黒塗りの下、場所は壁の中、年は改装の年。いなくなった入居者は台帳の人数（助かった人は数えない）', '柊 ナナエ ／ クローゼットの奥の壁の中 ／ 平成11年 ／ 4人']
  };

  return { wareki, today, kusumiIn, MEASURE, PH, flyer, PLAN, JUSETSU, ledger, THREAD_T, AMBIENT, HINTS, pad };
})();
