/* =========================================================
   ヨリミチ — 作品の登録リスト
   ---------------------------------------------------------
   新しい作品を追加するとき
     1. works/<id>/ に作品を置く（index.html から相対パスで読み込む形）
     2. 下の WORKS に1件足す（コピー用のひな形は README.md）
     3. 進行状況を一覧に出すなら storageKey と progress() を書く
        progress(s) は保存データ s を受け取り、
        { pct: 0〜100, label: '表示する文', cleared: true/false } を返す
   place は一覧の「今夜の行き先」に出る、その作品の“場所”のひとこと。
   表紙 cover.front は「表の顔」、cover.back は「めくると見える裏側」。
   SVGの id は作品ごとに接頭辞をつけて重複を避ける。
   ========================================================= */
window.WORKS = [
  {
    id: 'tensei',
    path: 'works/tensei/index.html',
    title: '女神課 転生窓口',
    place: '死後の世界の、役所の転生窓口',
    added: '2026-09-26',
    genre: ['異世界転生', '書類パズル', '泣ける'],
    minutes: 30,
    difficulty: 3,
    accent: '#2F5D8A',
    catch: '死後の世界の役所で、転生手続きの新人職員になった。生前記録票と転生規定集を読んで、魂の行き先と種族とスキルを決め、印を押す。規定の抜け道を探せば、かなえられる願いもある。',
    features: ['生前記録票と転生規定集を読みくらべる', '功徳点でスキルをやりくり', '書類どうしのつながりで、真実が見える', '最後の一枚は、白紙の記録'],
    storageKey: 'tensei.v1',
    progress(s) {
      if (s.ended) return { pct: 100, label: '本日の受付は終了', cleared: true };
      if (!s.intro) return { pct: s.playMs ? 2 : 0, label: '配属の日', cleared: false };
      const n = (s.filed || []).length;
      if ((s.ci || 0) >= 6) return { pct: 92, label: '受付番号108', cleared: false };
      return { pct: 5 + n * 14, label: n ? `${n}件を処理した` : '受付番号101', cleared: false };
    },
    spoilers: [
      '101 田中：全属性魔法をあきらめる。アルステラ／人間／剣術・頑丈な体／記憶あり（950点）',
      '102 佐藤：死因の「労災認定済み」で第八条（＋500）。ルルシア諸島／人間／万能農耕／記憶なし',
      '103 ひな：死亡確認時刻が空欄（蘇生処置中）。第一条で「差戻」',
      '104 タマ：縁結びに101（第十一条で世界の費用なし）。アルステラ／動物のすがた／記憶あり（300点）',
      '105・106 宮下：第七条と第十三条で650点。ふたりともルルシア諸島、そら＝人魚・縁結び105、ちさと＝人間、記憶はふたりともなし',
      '107 黒木：減点の夜と102佐藤の転落が同じ日時・場所。第十五条で102を添付（600点）。ギアノルド／人間',
      '108：引き出しの鈴と、ひなの記録の家族欄。氏名「小野寺 湊」、命日「令和五年九月二十八日」。最後は転生するか、第十七条で窓口に残るか',
      'ほかにも：壁の時計、整理券、規定集の付則、昔の綴り、灰原さんの名札……',
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="ts-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d0ec"/><stop offset="1" stop-color="#eaf4fb"/></linearGradient><radialGradient id="ts-o"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffd9a0"/><stop offset=".75" stop-color="#e8963a" stop-opacity=".45"/><stop offset="1" stop-color="#e8963a" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="#eef2f5"/>' + [0, 1, 2].map((i) => `<rect x="${30 + i * 125}" y="14" width="90" height="62" rx="40" fill="url(#ts-s)" stroke="#c9d3dc" stroke-width="3"/>`).join('')
        + '<rect y="150" width="400" height="100" fill="#d3dbe2"/>' + [60, 200, 340].map((x) => `<rect x="${x - 40}" y="150" width="80" height="6" rx="3" fill="#b9c4cf"/><circle cx="${x - 16}" cy="140" r="6" fill="#fff6d8" opacity=".8"/>`).join('')
        + '<rect x="90" y="40" width="220" height="150" fill="#fff" opacity=".12" stroke="#9aa6b2" stroke-width="5"/><line x1="200" y1="40" x2="200" y2="190" stroke="#9aa6b2" stroke-width="3"/>'
        + '<rect x="160" y="22" width="80" height="22" rx="4" fill="#2f5d8a"/><text x="200" y="38" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="sans-serif">３番窓口</text>'
        + '<circle cx="200" cy="112" r="52" fill="url(#ts-o)"/><circle cx="200" cy="112" r="11" fill="#fff"/>'
        + '<rect y="190" width="400" height="60" fill="#d9c8aa"/><rect y="190" width="400" height="4" fill="#f3ead8"/>'
        + '<g transform="translate(300 214) rotate(-6)"><rect x="-58" y="-26" width="116" height="60" fill="#fff" stroke="#9fb8c6"/><text x="-50" y="-10" font-size="9" fill="#1f3a4a" font-family="serif">転生決定通知書</text><circle cx="30" cy="12" r="15" fill="none" stroke="#c2332a" stroke-width="2.5"/><text x="30" y="17" text-anchor="middle" font-size="11" font-weight="700" fill="#c2332a" font-family="serif">承認</text></g>'
        + '<text x="92" y="232" text-anchor="middle" font-size="18" font-weight="700" fill="#244a70" letter-spacing="2" font-family="serif">女神課 転生窓口</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#d9c8aa"/><rect y="0" width="400" height="6" fill="#f3ead8"/>'
        + '<g transform="translate(160 125) rotate(-3)"><rect x="-120" y="-100" width="240" height="200" fill="#fff" stroke="#9fb8c6" stroke-width="2"/><rect x="-120" y="-100" width="240" height="24" fill="#e2eef3"/><text x="-110" y="-83" font-size="11" fill="#1f3a4a" font-family="serif">生前記録票（白紙交付）　108</text>'
        + [0, 1, 2, 3, 4].map((i) => `<line x1="-120" y1="${-50 + i * 30}" x2="120" y2="${-50 + i * 30}" stroke="#cfe0e8"/><text x="-112" y="${-58 + i * 30}" font-size="9" fill="#4a6070" font-family="sans-serif">${['氏名', '命日', '死因', '家族', '未練'][i]}</text>`).join('') + '</g>'
        + '<g transform="translate(320 150)"><path d="M0 -60 v28" stroke="#8a6a3a" stroke-width="2.5"/><circle cx="0" cy="0" r="30" fill="#e6c257" stroke="#9a7a24" stroke-width="2.5"/><path d="M-25 -3 H25" stroke="#9a7a24" stroke-width="2.5"/><circle cx="0" cy="10" r="5" fill="#6a5010"/><path d="M0 15 v12" stroke="#6a5010" stroke-width="2.5"/><path d="M10 34 l30 22 l-40 -4 z" fill="#f3ead7" stroke="#b8a888"/></g></svg>',
    },
  },
  {
    id: 'naraku',
    path: 'works/naraku/index.html',
    title: '奈落の証人',
    place: '昭和三十六年、千秋楽の夜の劇場',
    added: '2026-09-26',
    genre: ['推理', 'ミステリー', '昭和'],
    minutes: 35,
    difficulty: 3,
    accent: '#A8863A',
    catch: '昭和三十六年、劇団「月見座」の千秋楽。舞台の真下の奈落で、演出家が死んでいた。客席にいた探偵として、現場を調べ、証言のくいちがいに証拠をつきつけていく。',
    features: ['証言に証拠をつきつける推理', '奈落の見取り図と足跡', '舞台写真・進行台本・楽譜', '六つの幕で、ひとつの真相へ'],
    storageKey: 'naraku.v1',
    progress(s) {
      if (s.ended) return { pct: 100, label: '閉幕', cleared: true };
      if (!s.intro) return { pct: s.playMs ? 2 : 0, label: '開演前', cleared: false };
      const L = ['序幕', '第一幕　奈落', '第二幕　小道具部屋', '第三幕　舞台袖', '第四幕　ふたたび奈落', '第五幕　プロンプト席', '終幕'], i = Math.min(6, s.stage || 0);
      return { pct: 4 + i * 15, label: L[i], cleared: false };
    },
    spoilers: [
      '第一幕：ワルツは二十一時五分に始まり、三番は五分三十秒後。倒れたのは二十一時十分',
      '第二幕：七瀬の「直した扇を白石さんにわたした」に記録写真（第四場の扇は折れたまま）。第三場の仮面の男は七瀬だった',
      '第三幕：写真は第三場の仮面の男の頭（仮面が大窓の下枠より下）。証言は「私が踊った」に写真かメモ、次に「楽屋で休んでいた」か「奈落には降りていない」に見取り図（足跡B）か鷺沢の手紙',
      '第四幕：足跡Cは約25センチ。一文＝2.4センチなので十文半（25.2センチ）＝真柴耕三',
      '第五幕：「ずっと席にいた」に見取り図、次に「奈落は真っ暗だった」に犬飼の証言（21時12分に電球をつけ、そのまま）',
      '終幕：二十一時十分／七瀬ひばり／犬飼透／真柴耕三／真柴耕三',
      'ほかにも：パンフレットの裏表紙、予備の仮面、伝声管、ベタ焼きの最後のコマ、上の緞帳、手帳の最後のページ……',
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="nk-f" x1="0" x2="1"><stop offset="0" stop-color="#3a0710"/><stop offset=".45" stop-color="#8e1a24"/><stop offset="1" stop-color="#2c050b"/></linearGradient><radialGradient id="nk-s" cx=".5" cy=".62" r=".5"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe6b0" stop-opacity="0"/></radialGradient><linearGradient id="nk-gd" x1="0" x2="1"><stop offset="0" stop-color="#7a5a26"/><stop offset=".5" stop-color="#e3c47e"/><stop offset="1" stop-color="#7a5a26"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="#120a0c"/><rect x="40" y="26" width="320" height="176" fill="#0a0707"/>'
        + [...Array(8)].map((_, i) => `<rect x="${40 + i * 12}" y="26" width="12" height="176" fill="url(#nk-f)"/><rect x="${264 + i * 12}" y="26" width="12" height="176" fill="url(#nk-f)"/>`).join('')
        + '<path d="M40 26 ' + [...Array(8)].map((_, i) => `Q${60 + i * 40} 46 ${80 + i * 40} 26`).join(' ') + ' Z" fill="#7a111c" stroke="#c9a45c" stroke-width="1.5"/>'
        + '<rect x="136" y="150" width="128" height="52" fill="#2a1d16"/><ellipse cx="200" cy="160" rx="92" ry="80" fill="url(#nk-s)"/>'
        + '<rect x="166" y="176" width="68" height="20" fill="#050303" stroke="#c9a45c" stroke-width="1" stroke-dasharray="3 2"/><rect x="170" y="186" width="60" height="10" fill="#ffd9a0" opacity=".25"/>'
        + '<g transform="translate(200 158) rotate(-12)"><path d="M-26 0 Q-20 -10 0 -6 Q20 -10 26 0 Q24 14 10 12 Q4 10 0 6 Q-4 10 -10 12 Q-24 14 -26 0 Z" fill="#f4f0e6"/><ellipse cx="-11" cy="2" rx="5.5" ry="3.2" fill="#120a0c"/><ellipse cx="11" cy="2" rx="5.5" ry="3.2" fill="#120a0c"/></g>'
        + '<path d="M28 14 H372 V212 H28 Z M40 26 V202 H360 V26 Z" fill="#1c0f0c" fill-rule="evenodd"/><path d="M28 14 H372 V212 H28 Z" fill="none" stroke="url(#nk-gd)" stroke-width="2.5"/>'
        + '<text x="200" y="238" text-anchor="middle" font-size="17" font-weight="800" fill="#e3c47e" letter-spacing="8" font-family="serif">奈落の証人</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><pattern id="nk-g" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0 H0 V12" fill="none" stroke="#2a3a52" stroke-width=".6"/></pattern></defs>'
        + '<rect width="400" height="250" fill="#0b121d"/><rect width="400" height="250" fill="url(#nk-g)"/><rect x="16" y="16" width="368" height="218" fill="none" stroke="#8aa2c2" stroke-width="2"/>'
        + '<rect x="155" y="80" width="70" height="70" fill="none" stroke="#aebfd6" stroke-width="2"/><text x="190" y="120" text-anchor="middle" font-size="10" fill="#c7d4e4" font-family="serif">せり</text>'
        + '<rect x="24" y="170" width="55" height="50" fill="none" stroke="#6f86a4"/><line x1="24" y1="220" x2="79" y2="220" stroke="#e8c16a" stroke-width="2.5"/><rect x="321" y="170" width="55" height="50" fill="none" stroke="#6f86a4"/>'
        + [[90, 192], [104, 186], [118, 190], [132, 184]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(70)"><path d="M-2.4 -3 Q-2.4 -7 -.8 -7 L-.4 -3 Z M.4 -3 Q.8 -7 2 -6.6 Q2.6 -4 2.4 -2 Z M-2.4 -2 H2.4 L2 3.4 Q0 5 -2 3.4 Z" fill="#e8e4d8" opacity=".85"/></g>`).join('')
        + [[300, 196], [284, 190], [268, 194], [252, 188], [236, 192]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(-70)"><path d="M-2 -5 Q0 -7 2 -5 L1.4 0 L-1.4 0 Z" fill="#e8e4d8" opacity=".7"/><circle cx="0" cy="3.4" r="1.2" fill="#e8e4d8" opacity=".7"/></g>`).join('')
        + '<g transform="translate(150 186) rotate(-28)" fill="none" stroke="#f2f2f2" stroke-width="1.2" stroke-dasharray="3 2"><ellipse cx="0" cy="-26" rx="8" ry="9"/><path d="M-12 -16 Q-16 6 -10 32 M12 -16 Q16 6 10 32 M-12 -14 L-26 8 M12 -14 L26 10"/></g>'
        + '<circle cx="190" cy="48" r="5" fill="#ffe6a8"/><circle cx="190" cy="48" r="26" fill="#ffe6a8" opacity=".12"/>'
        + '<text x="372" y="34" text-anchor="end" font-size="10" fill="#9fb2c8" letter-spacing="3" font-family="serif">奈落　見取り図</text></svg>',
    },
  },
  {
    id: 'yofukashi',
    path: 'works/yofukashi/index.html',
    title: '深夜ラジオの投稿職人',
    place: '最終回をむかえる、深夜ラジオの副調整室',
    added: '2026-09-25',
    genre: ['泣ける', '謎解き', '3D'],
    minutes: 30,
    difficulty: 3,
    accent: '#D8962B',
    catch: '二十三年つづいた深夜ラジオの最終回。代理の構成作家として、ハガキを選んでブースに入れる。消印、切手、エアチェックのテープ。名前を変えて何枚も書いていた、ひとりの投稿職人がいた。',
    features: ['ガラスの向こうのブースを3Dで', 'ハガキの消印・切手・差出人を読む', 'エアチェックのテープとラジオのダイヤル', '名前を変えて書いていた、ひとりの職人'],
    storageKey: 'yofukashi.v1',
    progress(s) {
      if (s.ended) return { pct: 100, label: '放送終了', cleared: true };
      if (!s.intro) return { pct: s.playMs ? 2 : 0, label: '放送前（入館証）', cleared: false };
      const L = ['オープニング', '最終回スペシャル', 'リクエスト', '灯台さんの最後のハガキ', 'CM', 'エンディング'], i = Math.min(5, s.stage || 0);
      return { pct: 5 + i * 15, label: L[i], cleared: false };
    },
    spoilers: [
      'オープニング：元・中学生さん（潮見 8.9.22 8-12）。22日の「0-8」は3時より前かもしれない、風景印は時間帯がない、「7」は去年、にじんだ消印は読めない',
      '最終回スペシャル：潮見局の0-8・潮見郵便局留・逆さ切手がそろう4つの名前は同じ人。ねむれない灯台＋左ききのカモメ＋ねこ背の郵便屋＋3丁目の夕刊＝414票で1位。この4つに丸',
      'リクエスト：テープB面の後ろで「中学二年の冬」「雪の歌」「A面じゃなくて裏の曲」。ダイヤル882の北浜ラジオで1978年1月生まれ（早生まれ）。白川ミオ「粉雪ステーション」（1991年12月）のB面「となりの窓の雪」',
      '灯台さんの最後のハガキ：4つの名前の殿堂ハガキ8枚を、消印の日付順にならべて最初の字を読む。「みんながいるから」',
      'CM：台帳の「3夕」「左カ」の行で、2007年から名字が三上に。潮見郵便局留　三上 灯 様',
      'エンディング：テープA面で、ツジモトさんがラジオネームのない一通に「ねむれない灯台」と名づけている。カンペに「ねむれない灯台」',
      'ほかにも：逆さ切手の下、テープB面の最後、殿堂ファイルのポケットの奥、ダイヤル、トークバック、マイクのフェーダー……',
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="yf-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050914"/><stop offset="1" stop-color="#2a2446"/></linearGradient><radialGradient id="yf-l"><stop offset="0" stop-color="#ffc98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffc98a" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="#141722"/>'
        + '<rect x="96" y="40" width="208" height="92" fill="url(#yf-s)"/>'
        + [...Array(36)].map((_, i) => `<circle cx="${100 + (i * 53) % 200}" cy="${44 + (i * 29) % 50}" r="${i % 6 ? 0.7 : 1.3}" fill="#fff" opacity=".8"/>`).join('')
        + [104, 126, 150, 178, 206, 236, 262, 284].map((x, i) => `<rect x="${x}" y="${96 - (i % 3) * 10}" width="${14 + (i % 2) * 6}" height="${36 + (i % 3) * 10}" fill="#10152a"/><rect x="${x + 4}" y="${102 - (i % 3) * 10}" width="3" height="3" fill="#ffcf8f"/><rect x="${x + 9}" y="${112 - (i % 3) * 10}" width="3" height="3" fill="#ffcf8f" opacity=".7"/>`).join('')
        + '<path d="M270 100 L304 92 L304 104 Z" fill="#fff2cc" opacity=".35"/><rect x="266" y="98" width="4" height="14" fill="#e8e4d8"/>'
        + '<rect x="96" y="40" width="208" height="92" fill="none" stroke="#0b0c10" stroke-width="4"/><rect x="198" y="40" width="4" height="92" fill="#0b0c10"/>'
        + '<rect x="40" y="16" width="52" height="18" rx="2" fill="#b8160c"/><text x="66" y="29" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" font-family="sans-serif">ON AIR</text>'
        + '<circle cx="336" cy="70" r="24" fill="#0a0a0c" stroke="#333" stroke-width="2"/>' + [...Array(30)].map((_, i) => { const a = i / 30 * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(336 + Math.cos(a) * 19).toFixed(1)}" cy="${(70 + Math.sin(a) * 19).toFixed(1)}" r="1.4" fill="${i < 22 ? '#ff3b2a' : '#3a1210'}"/>`; }).join('') + '<text x="336" y="74" text-anchor="middle" font-size="9" fill="#ff3b2a" font-family="monospace">26:59</text>'
        + '<circle cx="120" cy="128" r="46" fill="url(#yf-l)"/>'
        + '<g transform="translate(200 118)"><path d="M-40 36 Q-38 0 0 -6 Q38 0 40 36 Z" fill="#2f3a52"/><circle cx="0" cy="-22" r="17" fill="#e6c3a5"/><path d="M-17 -26 Q0 -48 17 -26 Q12 -38 0 -39 Q-12 -38 -17 -26Z" fill="#2a221c"/><path d="M-20 -24 Q0 -52 20 -24" fill="none" stroke="#141519" stroke-width="4"/><rect x="-23" y="-28" width="7" height="12" rx="3" fill="#141519"/><rect x="16" y="-28" width="7" height="12" rx="3" fill="#141519"/><circle cx="-6" cy="-21" r="4" fill="none" stroke="#2a2522" stroke-width="1.2"/><circle cx="6" cy="-21" r="4" fill="none" stroke="#2a2522" stroke-width="1.2"/></g>'
        + '<path d="M268 132 L268 88 L226 96" fill="none" stroke="#9aa0a8" stroke-width="2.5"/><rect x="218" y="92" width="10" height="16" rx="4" fill="#1b1d22"/>'
        + '<path d="M104 150 L112 112 L124 104" fill="none" stroke="#9aa0a8" stroke-width="2"/><path d="M116 98 L134 98 L130 110 L120 110 Z" fill="#2f5a4a"/>'
        + '<rect x="0" y="146" width="400" height="104" fill="#4b3525"/><rect x="0" y="146" width="400" height="6" fill="#6b4a32"/>'
        + '<g transform="translate(58 196) rotate(-8)"><rect x="-34" y="-50" width="68" height="100" fill="#f7f1e1"/><g transform="translate(-20 -34) rotate(180)"><rect x="-9" y="-11" width="18" height="22" fill="#fff" stroke="#ddd"/><rect x="-7" y="-9" width="14" height="16" fill="#7fb6d8"/><path d="M-2 -5 H2 L3 5 H-3 Z" fill="#fff"/></g><circle cx="-10" cy="-30" r="12" fill="none" stroke="#2a2a3a" stroke-width="1.4" opacity=".8"/><path d="M-21 -33 H1 M-21 -26 H1" stroke="#2a2a3a" stroke-width="1" opacity=".8"/><text x="-10" y="-20.5" text-anchor="middle" font-size="5" fill="#2a2a3a" font-family="monospace">0-8</text><path d="M20 -34 V30 M10 -34 V20" stroke="#2b4c8c" stroke-width="2" opacity=".6"/></g>'
        + '<g transform="translate(290 206) rotate(3)"><rect x="-86" y="-34" width="172" height="68" rx="3" fill="#fbfaf5"/><rect x="-86" y="-34" width="172" height="10" rx="3" fill="#2d4a8a"/><text x="0" y="10" text-anchor="middle" font-size="15" font-weight="700" fill="#111" font-family="sans-serif">深夜ラジオの投稿職人</text><text x="0" y="26" text-anchor="middle" font-size="8" fill="#555" font-family="sans-serif">よふかし通信　最終回</text></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><radialGradient id="yf-g"><stop offset="0" stop-color="#ffe0a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffe0a8" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="#070a14"/>' + [...Array(70)].map((_, i) => `<circle cx="${(i * 61) % 400}" cy="${(i * 37) % 120}" r="${i % 7 ? 0.7 : 1.4}" fill="#fff" opacity=".7"/>`).join('')
        + '<rect y="150" width="400" height="100" fill="#050810"/>'
        + [20, 70, 250, 300, 350].map((x, i) => `<rect x="${x}" y="${120 - (i % 2) * 14}" width="34" height="${34 + (i % 2) * 14}" fill="#10152a"/><rect x="${x + 8}" y="${128 - (i % 2) * 14}" width="4" height="4" fill="#ffcf8f"/>`).join('')
        + '<rect x="120" y="116" width="90" height="38" fill="#3a372f"/><rect x="150" y="128" width="12" height="9" fill="#ffe0a8"/><circle cx="156" cy="132" r="22" fill="url(#yf-g)"/><text x="132" y="112" font-size="12" fill="#ff4a3a" font-weight="900" font-family="sans-serif">〒</text>'
        + '<rect x="154" y="160" width="4" height="60" fill="#ffc98a" opacity=".25"/>'
        + '<rect x="356" y="104" width="6" height="46" fill="#d9d6cc"/><rect x="355" y="98" width="8" height="6" fill="#fff2cc"/><path d="M359 101 L220 80 L220 96 Z" fill="#fff2cc" opacity=".25"/>'
        + '<g transform="translate(286 200) rotate(6)"><rect x="-28" y="-40" width="56" height="82" fill="#f7f1e1"/><g transform="translate(-16 -27) rotate(180)"><rect x="-7" y="-9" width="14" height="18" fill="#fff" stroke="#ddd"/><rect x="-5" y="-7" width="10" height="13" fill="#7fb6d8"/></g><circle cx="-6" cy="-24" r="10" fill="none" stroke="#2a2a3a" stroke-width="1.2" opacity=".8"/><text x="-6" y="-16" text-anchor="middle" font-size="4.5" fill="#2a2a3a" font-family="monospace">0-8</text><path d="M16 -30 V26 M8 -30 V16" stroke="#2b4c8c" stroke-width="1.6" opacity=".6"/></g></svg>',
    },
  },
  {
    id: 'tomaredeck',
    images: { front: 'works/tomaredeck/img/front.png', back: 'works/tomaredeck/img/back.png' },
    path: 'works/tomaredeck/index.html',
    title: 'TOMARE DECK',
    place: '道路標識のカードで進む、終わったあとの国道',
    added: '2026-09-25',
    genre: ['カードゲーム', 'ローグライク', 'ドット絵'],
    minutes: 40,
    difficulty: 3,
    accent: '#2F9A58',
    catch: '「止まれ」の標識をかついだロボットが、こんどはカードで戦う。落石注意、踏切あり、一方通行。道路標識のカードを組み合わせて、昼の国道から雨の夜の解体機まで進む。',
    features: ['「止まれ」で敵の次の行動を止める', '落石・シカ・踏切の標識を置いて、数ターン後にドカン', '負けても経験値で、カード・パーツ・キットが増える', '道も敵も毎回変わる。途中でやめても続きから'],
    storageKey: 'tomaredeck.v1',
    progress(s) {
      const m = s.meta || {}, acts = ['昼の国道', '夕暮れの商店街', '雨の夜の高架下'];
      if (m.wins) return { pct: 100, label: m.wins > 1 ? '解体機を' + m.wins + '回たおした' : '解体機をたおした', cleared: true };
      const at = (a, f) => 'ACT' + (a + 1) + ' ' + acts[a] + ' ' + f + '/7';
      if (s.run && s.run.act != null) { const a = Math.min(2, s.run.act), f = s.run.floor || 0; return { pct: Math.min(95, 5 + Math.round((a * 7 + f) / 21 * 90)), label: at(a, f), cleared: false }; }
      const b = m.bestFloor || 0;
      if (b) { const a = Math.min(2, Math.floor((b - 1) / 7)), f = b - a * 7; return { pct: Math.min(95, 5 + Math.round(b / 21 * 90)), label: 'いちばん遠く：' + at(a, f), cleared: false }; }
      return { pct: s.playMs ? 2 : 0, label: s.playMs ? 'タイトル画面' : '電源OFF', cleared: false };
    },
    spoilers: [
      '「止まれ」は敵1体の次の行動を止める。ふつうの敵は1回、強敵は2回、ボスは3回で止まる。回数はターンをまたいでたまるので、大技の前のターンに合わせて重ねる',
      '落石注意・動物注意・踏切ありは、置いてから数ターン後に発動する。踏切ありは敵全体に40ダメージ。合流注意と路面凍結で、発動までのターンを縮められる',
      'ドラム缶は倒されると爆発して、敵にもこちらにもダメージ。3つ並んでいるときは、先にブロックしてから1つ倒すと連鎖する',
      'ロードローラー：エンジンをふかした次のターンに「ぺしゃんこ」（大ダメージ）。穴ぼこのカードは引くたびにHPが減るので、ショップや休憩所で取り除く',
      '信号機ロボ：赤信号のあいだに攻撃カードを使うとHPが減る。赤のターンは守りと準備、黄色で全員の馬力が上がり、青で連続攻撃',
      '解体機：アームを振り上げた次のターンに叩きつけ（大ダメージ）。横なぎはブロックを壊してから当ててくる。半分を切るとドラム缶を落としてくる',
      'レベル5で工事キット、レベル8で高速キットが使える。クリアすると警戒レベルが上がり、次からは敵が強くなる'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true" shape-rendering="crispEdges"><defs><linearGradient id="td-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76A2CC"/><stop offset="1" stop-color="#E7EFF0"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#td-s)"/>'
        + [[0, 110, 50], [60, 90, 40], [110, 120, 60], [190, 100, 44], [250, 116, 70], [330, 96, 70]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${176 - y}" fill="#A9BECE"/>`).join('')
        + '<rect y="170" width="400" height="80" fill="#8E7A62"/><rect y="164" width="400" height="10" fill="#C7CCD0"/>'
        + [['#D8363F', 40, 150], ['#2F9A58', 96, 136], ['#3F78C2', 152, 150]].map(([c, x, y]) => `<g transform="translate(${x} ${y})"><rect width="64" height="90" fill="#FBF7F0" stroke="#221F30" stroke-width="3"/><rect x="4" y="4" width="56" height="14" fill="${c}"/><rect x="4" y="20" width="56" height="38" fill="#F2E6E0"/><circle cx="6" cy="6" r="8" fill="#FFD23F" stroke="#221F30" stroke-width="2"/></g>`).join('')
        + '<path d="M116 164l12 22 12-22z" fill="#E0415A" stroke="#221F30" stroke-width="2"/>'
        + '<g transform="translate(262 76)"><path d="M58 -40l40 -10 -12 30z" fill="#E0415A" stroke="#221F30" stroke-width="3"/><rect x="56" y="-24" width="4" height="40" fill="#A3A9B6"/>'
        + '<rect x="0" y="12" width="64" height="62" fill="#ECE6D6" stroke="#221F30" stroke-width="4"/><rect x="0" y="-6" width="64" height="26" rx="22" fill="#ECE6D6" stroke="#221F30" stroke-width="4"/><rect x="2" y="12" width="60" height="8" fill="#ECE6D6"/>'
        + '<circle cx="24" cy="24" r="16" fill="#2D2A3C"/><circle cx="24" cy="24" r="10" fill="#FFD23F"/><circle cx="20" cy="20" r="3" fill="#fff"/><rect x="10" y="74" width="12" height="14" fill="#4B4658"/><rect x="40" y="74" width="12" height="14" fill="#4B4658"/></g>'
        + '<text x="22" y="46" font-size="30" font-weight="800" fill="#FBF7F0" stroke="#221F30" stroke-width="5" paint-order="stroke" font-family="\'Dela Gothic One\', monospace">TOMARE</text>'
        + '<g transform="translate(150 52) rotate(-4)"><rect width="66" height="24" rx="4" fill="#D8363F" stroke="#221F30" stroke-width="3"/><text x="33" y="18" text-anchor="middle" font-size="16" fill="#fff" font-family="\'Dela Gothic One\', monospace">DECK</text></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true" shape-rendering="crispEdges"><defs><linearGradient id="td-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1024"/><stop offset="1" stop-color="#2A2548"/></linearGradient><radialGradient id="td-l"><stop offset="0" stop-color="#FFF3B0"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="url(#td-n)"/>'
        + [[10, 70, 60], [80, 50, 50], [140, 80, 70], [220, 60, 50], [280, 76, 60], [346, 56, 54]].map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${w}" height="${176 - y}" fill="#1B1B36"/>` + [...Array(6)].map((_, k) => `<rect x="${x + 6 + (k % 3) * 16}" y="${y + 10 + Math.floor(k / 3) * 22}" width="8" height="10" fill="${(i + k) % 3 ? '#E8C070' : '#3A3A5A'}"/>`).join('')).join('')
        + '<rect y="176" width="400" height="74" fill="#15152A"/>'
        + [0, 1, 2].map(k => `<g transform="translate(${-20 + k * 110} 118)"><rect width="104" height="58" fill="#E8E2D4" stroke="#221F30" stroke-width="3"/><rect y="30" width="104" height="7" fill="#2F9A58"/><rect y="39" width="104" height="2" fill="#E0A030"/>` + [0, 1, 2, 3, 4].map(w => `<rect x="${8 + w * 19}" y="8" width="13" height="14" fill="#FFE7A0"/>`).join('') + '<circle cx="18" cy="60" r="6" fill="#221F30"/><circle cx="86" cy="60" r="6" fill="#221F30"/></g>').join('')
        + '<circle cx="312" cy="160" r="40" fill="url(#td-l)"/><rect x="330" y="120" width="44" height="56" fill="#B8C4D6" stroke="#221F30" stroke-width="3"/><rect x="336" y="126" width="32" height="4" fill="#8FA3B8"/>'
        + '<text x="300" y="112" font-size="26" fill="#FFD23F" stroke="#221F30" stroke-width="4" paint-order="stroke" font-family="\'Dela Gothic One\', monospace">40</text>'
        + [...Array(50)].map((_, i) => `<path d="M${(i * 53) % 400} ${(i * 37) % 250}l-4 14" stroke="#8FA3D9" stroke-width="1.5"/>`).join('') + '</svg>'
    }
  },
  {
    id: 'lastbus',
    path: 'works/lastbus/index.html',
    title: '最終バスの車掌',
    place: '廃止された夜ノ森線の、最終便の車内',
    added: '2026-09-24',
    genre: ['不思議', '泣ける', '3D'],
    minutes: 30,
    difficulty: 3,
    accent: '#C8742A',
    catch: '廃止された夜ノ森線の最終便に、一夜かぎりの車掌として乗る。乗ってくるのは、降りそびれた人たち。話を聞き、持ち物と車内掲示を手がかりに、ひとりずつ正しい停留所で降ろしていく。',
    features: ['車内と車窓の夜景を3Dで', '運賃表示器・路線図・合図ひも', '窓の外の景色も手がかり', '6人の乗客と、最後のひとり'],
    storageKey: 'lastbus.v1',
    progress(s) {
      if (s.ended) return { pct: 100, label: '終点・車庫前', cleared: true };
      if (!s.intro) return { pct: s.playMs ? 2 : 0, label: '車掌募集の貼り紙', cleared: false };
      const n = Object.keys(s.delivered || {}).length;
      if (n >= 6) return { pct: 90, label: '6枚の整理券', cleared: false };
      return { pct: 5 + n * 14, label: n ? `${n}人を送りとどけた` : '夜ノ森駅前', cleared: false };
    },
    spoilers: [
      'タクト：くもった窓の絵は「鐘のついた塔」。名札の「夜ノ森小学校」は、車内掲示でいまの「公民館前」。公民館前（3番目）で降ろす',
      'トメ：「踏切の音 → 橋の音 → そのつぎ」。踏切は商店街と公民館前のあいだ、橋は公民館前と病院前のあいだ。市民病院前（4番目）',
      'カナ：絵の「夜でも光る金色の木」は大銀杏（5番目）',
      'ユウコ：トメさんとカナのうしろの窓に、うっすらうつっている。押すと話せる。待ち合わせは0時35分、今夜は5分遅れなので川端（6番目）',
      'ハヤミ：定期券の10,530円は、車内掲示の定期運賃表で「夜ノ森団地」（7番目）',
      '源三：魚市場前 → 港市場 → 港。港（8番目）',
      '最後：整理券のうらを降りた順に並べると「ほしみざかで」。星見坂は港と車庫前のあいだの廃止された停留所。港を出たら、着く前に合図ひもを1回',
      'ほかにも：路線図の白いシール、合図ひもを3回、運転席のルームミラー、車内の広告……',
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="lb-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a18"/><stop offset="1" stop-color="#1d2748"/></linearGradient><radialGradient id="lb-g"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="#2a2620"/>'
        + [[20, 60, 110], [140, 60, 110], [260, 60, 120]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="80" fill="url(#lb-s)"/>`).join('')
        + [...Array(40)].map((_, i) => `<circle cx="${(i * 97) % 380 + 10}" cy="${60 + (i * 37) % 40}" r="${i % 5 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('')
        + '<rect x="0" y="112" width="400" height="28" fill="#0b1020"/>' + [40, 90, 160, 230, 300, 350].map((x, i) => `<rect x="${x}" y="${104 - (i % 3) * 8}" width="${26 + (i % 2) * 10}" height="${36 + (i % 3) * 8}" fill="#10162a"/><rect x="${x + 5}" y="${110 - (i % 3) * 8}" width="5" height="5" fill="#ffd9a0" opacity=".8"/>`).join('')
        + [70, 200, 330].map(x => `<circle cx="${x}" cy="80" r="26" fill="url(#lb-g)"/>`).join('')
        + '<rect x="0" y="0" width="400" height="56" fill="#d8d0bc"/><rect x="0" y="140" width="400" height="110" fill="#8fa39a"/><rect x="0" y="176" width="400" height="74" fill="#2d5a55"/>'
        + [16, 132, 252, 384].map(x => `<rect x="${x}" y="56" width="8" height="86" fill="#b8bdc2"/>`).join('')
        + [70, 190, 310].map(x => `<rect x="${x - 1}" y="0" width="3" height="180" fill="#d8a830"/>`).join('')
        + [40, 100, 160, 220, 280, 340].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="18" stroke="#d8ccb0" stroke-width="2"/><circle cx="${x}" cy="24" r="6" fill="none" stroke="#f2f0e8" stroke-width="2"/>`).join('')
        + '<g transform="translate(96 150)"><path d="M-22 30 Q-20 0 0 -4 Q20 0 22 30Z" fill="#e8736a"/><circle cx="0" cy="-16" r="12" fill="#f3d2b8"/><path d="M-12 -18 Q0 -34 12 -18Z" fill="#3a2a22"/></g>'
        + '<g transform="translate(236 146)" opacity=".7"><path d="M-24 34 Q-22 0 0 -6 Q22 0 24 34Z" fill="#4a5a6a"/><circle cx="0" cy="-18" r="13" fill="#c89a78"/><rect x="-13" y="-26" width="26" height="6" rx="3" fill="#f2f0ea"/></g>'
        + '<g transform="translate(262 88)" opacity=".35"><circle cx="0" cy="-10" r="10" fill="#bcd0f0"/><path d="M-16 28 Q-14 4 0 0 Q14 4 16 28Z" fill="#bcd0f0"/></g>'
        + '<rect x="100" y="6" width="200" height="34" rx="3" fill="#060606" stroke="#2a2a2a" stroke-width="3"/><text x="200" y="30" text-anchor="middle" font-size="18" fill="#ff8a1a" font-family="DotGothic16, monospace">最終バスの車掌</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="lb-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02050d"/><stop offset=".7" stop-color="#1d2748"/><stop offset="1" stop-color="#3a3450"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#lb-n)"/>' + [...Array(120)].map((_, i) => `<circle cx="${(i * 53) % 400}" cy="${(i * 29) % 170}" r="${i % 7 ? 0.7 : 1.5}" fill="#fff" opacity="${0.4 + (i % 5) * 0.12}"/>`).join('')
        + '<path d="M0 250 L0 196 Q200 170 400 200 L400 250Z" fill="#0c1410"/>'
        + '<rect x="228" y="120" width="4" height="84" fill="#8a8f96"/><circle cx="230" cy="118" r="16" fill="#e8e6e0" stroke="#8a8f96" stroke-width="3"/><rect x="220" y="112" width="20" height="10" fill="#d8d6ce"/>'
        + '<rect x="270" y="90" width="3" height="110" fill="#3a3d42"/><rect x="262" y="88" width="16" height="4" fill="#ffe0b0"/><circle cx="270" cy="94" r="30" fill="#ffe0b0" opacity=".15"/>'
        + '<g transform="translate(254 172)" opacity=".75"><rect x="-8" y="0" width="16" height="30" rx="4" fill="#2a3550"/><circle cx="0" cy="-8" r="7" fill="#ecd4c0"/><path d="M-8 -10 Q0 -20 8 -10Z" fill="#2a3550"/><rect x="6" y="6" width="8" height="7" fill="#5a3a26"/></g>'
        + '<g transform="translate(60 150)"><rect x="0" y="0" width="120" height="44" rx="6" fill="#dcd6c6"/><rect x="8" y="8" width="104" height="16" fill="#ffd9a0" opacity=".7"/><rect x="0" y="30" width="120" height="4" fill="#2a6a8a"/><circle cx="24" cy="46" r="7" fill="#1a1a1a"/><circle cx="96" cy="46" r="7" fill="#1a1a1a"/></g></svg>'
    }
  },
  {
    id: 'maigo',
    path: 'works/maigo/index.html',
    title: '迷子の天気予報',
    place: '風向きひとつで空が変わる、ひなた町のジオラマ',
    added: '2026-09-24',
    genre: ['パズル', 'ほのぼの', '3D'],
    minutes: 25,
    difficulty: 3,
    accent: '#2B7FB8',
    catch: '入院した天気係のかわりに、一週間だけ町の天気をつくるアルバイト。机の上のジオラマで風を決めると、雲が流れ、雨が降り、虹が出る。予報どおりの空と、町の人のお願いを、ぜんぶかなえられるか。',
    features: ['机の上のジオラマが3Dで動く', '風向きで雲を流して、雨と虹をつくる', '毎日とどく、町の人のお願い', '風に飛ばされた、日曜の予報'],
    storageKey: 'maigo.v1',
    progress(s) {
      const ids = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      if (s.ended) return { pct: 100, label: '天気係 ' + (s.name || '（なまえなし）') + (s.xmas && s.xmas.solved ? '／12月24日' : ''), cleared: true };
      if (!s.intro) return { pct: s.playMs ? 2 : 0, label: '求人のチラシ', cleared: false };
      const n = ids.filter(k => s.solved && s.solved[k]).length;
      if (n >= 6) return { pct: 90, label: Object.keys(s.placed || {}).length < 6 ? '日曜：迷子のページ' : '日曜：最後の予報', cleared: false };
      return { pct: 5 + n * 13, label: '月火水木金土'[n] + '曜日の予報', cleared: false };
    },
    spoilers: [
      '月：朝 西風 → 昼 無風 → 夕 西風 → 夜 東風（夕と夜は「北風→南風」「東風→西風」でもよい）',
      '火：朝 東風（ミツさんの家の上の雨雲を畑へ）→ 昼 無風 → 夕 西風 → 夜 無風',
      '水：朝 無風 → 昼 南風（学校と河原の雲を畑で重ね、山にぶつけて雨雲に）→ 夕 無風 → 夜 西風',
      '木：朝 北風 → 昼 無風（公園に雨）→ 夕 南風（公園に虹）→ 夜 無風',
      '金：てるてる坊主を D3（駅）に。朝 西風 → 昼 無風 → 夕 南風 → 夜 無風',
      '土：てるてる坊主を B3（小学校）に。朝 東風 → 昼 南風 → 夕 無風 → 夜 西風',
      '日：最後の切れ端は、ジオラマの観測所（D2）の屋根の上。並べると「朝 くもり・昼 雨・夕 虹・夜 くもり」。朝 南風 → 昼 無風 → 夕 北風 → 夜 南風',
      'ほかにも：観測所の屋根を押す、てるてる坊主を押してさかさまに、クリア後の日めくりのめくれた角……',
    ],
    cover: {
      front: (() => {
        const P = (u, v) => { const l = 160 - 20 * v, r = 360 + 20 * v; return [l + (r - l) * u, 60 + 132 * v]; };
        const col = ['#7D9A5E', '#7D9A5E', '#6FA05E', '#9CC27A', '#A8C98A', '#63B2DA', '#7D9A5E', '#9A7650', '#A7CF86', '#9FCC84', '#C9C1AD', '#8CC4DC', '#D7BD5A', '#C7B18C', '#CFC6B4', '#B9B3A6', '#8EC070', '#4EA3D0', '#8CC4DC', '#CBBD9C', '#A3CC84', '#A3CC84', '#8FC672', '#63B2DA', '#8CC4DC', '#B8AD96', '#A3CC84', '#B4D49A', '#E6D6A6', '#63B2DA'];
        let t = '';
        for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) { const q = [P(x / 6, y / 5), P((x + 1) / 6, y / 5), P((x + 1) / 6, (y + 1) / 5), P(x / 6, (y + 1) / 5)]; t += `<polygon points="${q.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="${col[y * 6 + x]}" stroke="#6B4A2A" stroke-width=".8"/>`; }
        const cl = (x, y, g) => `<g fill="${g ? '#8C95A3' : '#FFFFFF'}"><circle cx="${x - 12}" cy="${y}" r="10"/><circle cx="${x}" cy="${y - 6}" r="13"/><circle cx="${x + 13}" cy="${y}" r="9"/><rect x="${x - 20}" y="${y}" width="40" height="9" rx="4.5"/></g>`;
        return '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="mg-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DAB07A"/><stop offset="1" stop-color="#BE8D56"/></linearGradient></defs>'
          + '<rect width="400" height="250" fill="url(#mg-w)"/><polygon points="152,52 368,52 392,206 128,206" fill="#8A5A30"/><polygon points="128,206 392,206 392,214 128,214" fill="#6B4424"/>' + t
          + '<g stroke="#4A8FD8" stroke-width="2" stroke-linecap="round">' + [0, 1, 2, 3].map(i => `<line x1="${214 + i * 7}" y1="${98 + (i % 2) * 5}" x2="${211 + i * 7}" y2="${110 + (i % 2) * 5}"/>`).join('') + '</g>'
          + cl(218, 84, true) + cl(300, 70) + cl(172, 128)
          + '<path d="M300 160a26 26 0 0 1 52 0" fill="none" stroke="#E0584A" stroke-width="3"/><path d="M304 160a22 22 0 0 1 44 0" fill="none" stroke="#F2D14E" stroke-width="3"/><path d="M308 160a18 18 0 0 1 36 0" fill="none" stroke="#4AA3D8" stroke-width="3"/>'
          + '<g transform="rotate(-7 60 140)"><rect x="12" y="70" width="98" height="140" rx="4" fill="#FFFAF0"/><line x1="26" y1="70" x2="26" y2="210" stroke="#E6A09A"/>'
          + [0, 1, 2, 3, 4, 5].map(i => `<line x1="30" y1="${100 + i * 18}" x2="102" y2="${100 + i * 18}" stroke="#E7DDC8"/>`).join('')
          + '<text x="32" y="92" font-size="12" font-family="Klee One, serif" fill="#3B3530">10月5日（月）</text><circle cx="42" cy="112" r="6" fill="#A7B0BC"/><circle cx="66" cy="113" r="6" fill="#A7B0BC"/><circle cx="90" cy="113" r="6" fill="#F2A93B"/></g>'
          + '<text x="200" y="36" text-anchor="middle" font-size="24" font-weight="900" fill="#FFFAF0" stroke="#8A5A30" stroke-width="4" paint-order="stroke" font-family="Zen Maru Gothic, sans-serif">迷子の天気予報</text></svg>';
      })(),
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="mg-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A7BC0"/><stop offset=".55" stop-color="#F2A98A"/><stop offset="1" stop-color="#FFD9A8"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#mg-s)"/>'
        + [[110, 190, 70], [230, 200, 90], [330, 186, 56]].map(([x, y, r]) => ['#E0584A', '#F29A3A', '#F2D14E', '#6AC47A', '#4AA3D8', '#6A6AD0'].map((c, i) => `<path d="M${x - r + i * 4} ${y}a${r - i * 4} ${r - i * 4} 0 0 1 ${2 * (r - i * 4)} 0" fill="none" stroke="${c}" stroke-width="4" opacity=".75"/>`).join('')).join('')
        + '<path d="M0 250 L0 205 Q120 170 230 196 Q320 214 400 196 L400 250Z" fill="#5E8A4E"/><path d="M160 250 Q230 168 300 250Z" fill="#6E9A58"/><rect x="246" y="176" width="4" height="22" fill="#5A3E28"/><circle cx="248" cy="170" r="14" fill="#4F7E44"/>'
        + '<g transform="translate(226 190)"><rect x="-4" y="-2" width="8" height="12" rx="3" fill="#9B8AC4"/><circle cx="0" cy="-6" r="4" fill="#F2D6BF"/><line x1="6" y1="-2" x2="7" y2="10" stroke="#6A4A3A" stroke-width="1.2"/></g>'
        + '<g transform="translate(320 48) rotate(18)"><path d="M-22 -16 L20 -18 L24 16 L6 13 L-2 18 L-20 14Z" fill="#FFFDF6"/><text x="0" y="3" text-anchor="middle" font-size="10" fill="#3B3530" font-family="Klee One, serif">日曜</text></g></svg>'
    }
  },
  {
    id: 'tomare',
    images: { front: 'works/tomare/img/front.png', back: 'works/tomare/img/back.png' },
    path: 'works/tomare/index.html',
    title: 'TOMARE',
    place: '「止まれ」の標識をかついだロボットが行く、終わったあとの街',
    added: '2026-09-24',
    genre: ['アクション', 'ローグライク', 'ドット絵'],
    minutes: 20,
    difficulty: 3,
    accent: '#E0415A',
    catch: '「止まれ」の標識をかついだ小さなロボットが、終わったあとの街を進む。目をさました家電たちをなぎ払い、雨の夜の向こうで待つ巨大な解体機のもとへ。',
    features: ['ドット絵なのに、画面が揺れる・止まる・寄る', '昼・夕暮れ・雨の夜で、街の色が変わる', 'WASD＋マウスで、3連撃・溜め・叩きつけ・必殺技', '部屋もパワーアップも、遊ぶたびに変わる'],
    storageKey: 'tomare.v1',
    progress(s) {
      if (s.clears) return { pct: 100, label: (s.bestLoop || 1) > 1 ? '解体機を' + s.bestLoop + '周たおした' : '解体機をたおした', cleared: true };
      const b = s.best;
      if (!b) return { pct: s.playMs ? 2 : 0, label: s.playMs ? 'タイトル画面' : '電源OFF', cleared: false };
      const i = b.stage * 5 + b.room;
      const at = ['道路・昼', '街・夕暮れ', '雨の夜'][b.stage] || '道路・昼';
      return { pct: Math.min(95, 5 + Math.round(i / 14 * 90)), label: at + ' ' + (b.room + 1) + '/5' + (i === 14 ? '（解体機）' : ''), cleared: false };
    },
    spoilers: [
      '攻撃（左クリック）を押しっぱなしで溜め。HPの下の黄色いゲージが満タンのときの溜めは、画面ぜんぶを叩く必殺技になる',
      '扇風機の撃つピンクの弾と、自販機の投げる缶は、標識で打ち返せる',
      '空中で「S＋攻撃」は叩きつけ。敵の頭に当てると跳ね返って、ジャンプとダッシュがもう一度使える',
      '敵の攻撃が当たる直前にダッシュすると、時間がゆっくりになる（ゲージも増える）',
      '自販機は、壁や車に突進させると目を回す。そこが攻めどき',
      '休憩の部屋の緑のライトでHPが半分もどる。赤いオイル缶でも少しもどる。HPが少ないと、カードに「REPAIR」がまざる',
      '解体機：アームの叩きつけのあとは、地面を走る衝撃波をジャンプでかわす。運転席の赤い目に当てるとダメージが大きい。半分をこえると、ミサイルと突進も使う'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true" shape-rendering="crispEdges"><defs><linearGradient id="tm-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76A2CC"/><stop offset="1" stop-color="#E7EFF0"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#tm-s)"/><circle cx="318" cy="40" r="15" fill="#fff"/>'
        + [[0, 120, 40], [44, 96, 34], [84, 130, 50], [140, 104, 36], [182, 118, 58], [246, 92, 30], [282, 126, 46], [334, 108, 66]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${190 - y}" fill="#A9BECE"/>`).join('')
        + '<rect y="176" width="400" height="74" fill="#9A917F"/><rect y="170" width="400" height="12" fill="#221F30"/><rect y="171" width="400" height="3" fill="#F4F4EE"/><rect y="174" width="400" height="5" fill="#C7CCD0"/>'
        + [20, 70, 120, 170, 220, 270, 320, 370].map(x => `<rect x="${x}" y="182" width="6" height="24" fill="#98A2AC"/>`).join('')
        + '<g transform="translate(270 96)"><path d="M-6 -60l-26 8 18 20z" fill="#FBF7F0" stroke="#221F30" stroke-width="3"/><path d="M-11 -54l-14 4 10 11z" fill="#E0415A"/><rect x="-14" y="-40" width="4" height="46" fill="#A3A9B6"/>'
        + '<rect x="0" y="12" width="56" height="52" fill="#ECE6D6" stroke="#221F30" stroke-width="4"/><rect x="0" y="-4" width="56" height="22" rx="20" fill="#ECE6D6" stroke="#221F30" stroke-width="4"/><rect x="2" y="12" width="52" height="8" fill="#ECE6D6"/>'
        + '<circle cx="38" cy="22" r="14" fill="#2D2A3C"/><circle cx="38" cy="22" r="9" fill="#FFD23F"/><circle cx="34" cy="18" r="3" fill="#fff"/><rect x="2" y="48" width="52" height="8" fill="#B3A993"/>'
        + '<rect x="10" y="64" width="10" height="12" fill="#4B4658"/><rect x="34" y="64" width="10" height="12" fill="#4B4658"/><path d="M0 30l-40 6 6 8 34-4z" fill="#E5486D" stroke="#221F30" stroke-width="2"/><rect x="18" y="-22" width="3" height="18" fill="#6D6577"/><rect x="16" y="-26" width="7" height="6" fill="#FF4D6D"/></g>'
        + '<text x="24" y="64" font-size="44" font-weight="800" fill="#FBF7F0" stroke="#221F30" stroke-width="6" paint-order="stroke" font-family="\'Dela Gothic One\', monospace">TOMARE</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true" shape-rendering="crispEdges"><defs><linearGradient id="tm-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1024"/><stop offset="1" stop-color="#43396B"/></linearGradient><radialGradient id="tm-e"><stop offset="0" stop-color="#FF4D5A"/><stop offset="1" stop-color="#FF4D5A" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="url(#tm-n)"/><circle cx="80" cy="50" r="18" fill="#DCDCCC"/>'
        + '<rect y="196" width="400" height="54" fill="#1D2140"/>'
        + '<g fill="#D8B24A" stroke="#221F30" stroke-width="3"><rect x="210" y="100" width="110" height="80"/><rect x="226" y="72" width="60" height="32"/><path d="M290 90L180 40l-8 12 100 50z"/></g>'
        + '<rect x="196" y="176" width="140" height="26" rx="12" fill="#474B58" stroke="#221F30" stroke-width="3"/><circle cx="250" cy="88" r="30" fill="url(#tm-e)"/><circle cx="250" cy="88" r="6" fill="#FFE0E0"/>'
        + '<g transform="translate(96 168)"><rect width="20" height="20" fill="#ECE6D6" stroke="#221F30" stroke-width="2"/><circle cx="14" cy="8" r="4" fill="#FFD23F"/><path d="M-4 -2l-10 -12 12 -2z" fill="#E0415A" stroke="#FBF7F0"/></g>'
        + [...Array(40)].map((_, i) => `<path d="M${(i * 53) % 400} ${(i * 37) % 250}l-4 14" stroke="#8FA3D9" stroke-width="1.5"/>`).join('') + '</svg>'
    }
  },
  {
    id: 'kokuchi',
    images: { front: 'works/kokuchi/img/room.jpg', back: 'works/kokuchi/img/night.jpg' },
    path: 'works/kokuchi/index.html',
    title: '告知事項あり',
    place: '深夜にオンラインで内見する、家賃1.9万円の部屋',
    added: '2026-09-24',
    genre: ['ホラー', 'オンライン内見', '3D'],
    minutes: 30,
    difficulty: 3,
    accent: '#8A1C1C',
    catch: '家賃1.9万円、駅徒歩5分、告知事項あり。深夜23時10分、担当の真壁さんとオンラインで内見がはじまる。——マイクの調子が悪いので、今日はチャットで。',
    features: ['担当者のスマホ映像が3Dで動く', '指示を出して、部屋を測る・叩く・開ける', '図面・黒塗り・台帳を読み解く', '驚かす演出を弱める設定あり'],
    storageKey: 'kokuchi.v1',
    progress(s) {
      if (s.ending === 'true') return { pct: 100, label: 'TRUE END「告知」', cleared: true };
      const n = s.stage || 0;
      const L = ['予約済み', '内見中', '黒塗りの書類', '四十九日', '停電', '0時まで', '告知'];
      return { pct: n ? Math.min(95, 8 + n * 14) : 0, label: L[n] || '予約済み', cleared: false };
    },
    haunt(s) { return s.ending === 'true' ? { tagline: 'コン、コン、コン。', mark: '告' } : null; },
    spoilers: [
      '洋室のクローゼットで「奥行」を測ると455ミリ（図面は910）。「気づいたことを伝える」→ クローゼットの奥行・455',
      '重要事項説明書の黒塗りは、なぞる（選択する）と読める。大家の娘の名前「ナナエ」を伝える',
      'キッチンの引き出しに入居者台帳。全員が入居49日目に消えている。久住サキは今夜で49日目 →「49」',
      '停電のあと、ナイトモードでクローゼットの壁を見る。手形の指の本数の順にネジを外す：左下（1本）→ 右上（2本）→ 左上（3本）→ 右下（4本）',
      '玄関には「何か」が立っている。バルコニーへ → 避難ハッチ（仕切り板は開かない）。20秒以内',
      '告知の訂正：柊 ナナエ ／ クローゼットの奥の壁の中 ／ 平成11年 ／ 4人 → TRUE END',
      'ほかにも：チラシの「申し込む」、浴室の鏡、ナイトモードで「うしろを照らして」、205号室、夜中0〜4時の内見、チラシの洋室写真の窓……'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="kk-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d22"/><stop offset="1" stop-color="#050607"/></linearGradient><radialGradient id="kk-l" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#6d6456" stop-opacity=".9"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="#F4F6F5"/><rect x="14" y="14" width="372" height="222" rx="10" fill="#fff" stroke="#E3E6EA"/>'
        + '<g transform="translate(26 28)"><rect width="150" height="196" rx="8" fill="url(#kk-f)"/><rect width="150" height="196" rx="8" fill="url(#kk-l)"/>'
        + '<path d="M30 40h90v130H30z" fill="#3a3630"/><path d="M34 44h40v122H34z" fill="#2b2824"/><path d="M78 44h38v122H78z" fill="#11100f"/><path d="M74 44h4v122h-4z" fill="#000"/>'
        + '<ellipse cx="97" cy="88" rx="8" ry="10" fill="#cfc9bd" opacity=".85"/><rect x="88" y="78" width="18" height="6" fill="#050505"/><rect x="90" y="80" width="3" height="26" fill="#050505"/><circle cx="94" cy="89" r="1.4" fill="#000"/><circle cx="100" cy="89" r="1.4" fill="#000"/>'
        + '<circle cx="12" cy="12" r="3" fill="#ff3b30"/><text x="20" y="15" font-size="8" fill="#ff6b62" font-family="monospace">REC 23:10</text><text x="75" y="186" text-anchor="middle" font-size="8" fill="#9AA1AB">真壁 ミナ</text></g>'
        + '<text x="192" y="52" font-size="12" font-weight="700" fill="#2F7D4F">ひいらぎ不動産 ／ オンライン内見</text>'
        + '<text x="192" y="82" font-size="18" font-weight="700" fill="#1F2328">コーポ柊 204号室</text>'
        + '<text x="192" y="122" font-size="34" font-weight="800" fill="#C0392B">1.9<tspan font-size="14">万円</tspan></text>'
        + '<text x="192" y="142" font-size="10" fill="#6B7280">1K ／ 21.06㎡ ／ 駅徒歩5分</text>'
        + '<g transform="translate(290 186) rotate(-8)"><rect x="-58" y="-18" width="116" height="36" rx="4" fill="none" stroke="#C0392B" stroke-width="3"/><text x="0" y="6" text-anchor="middle" font-size="15" font-weight="800" fill="#C0392B">告知事項あり</text></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><radialGradient id="kk-n" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#5cff8a"/><stop offset="1" stop-color="#0b2a14"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="url(#kk-n)"/><rect width="400" height="250" fill="#000" opacity=".35"/>'
        + [[110, 70, 3, -.4], [290, 70, 2, .4], [110, 180, 1, -.3], [290, 180, 4, .3]].map(([x, y, n, r]) => `<g transform="translate(${x} ${y}) rotate(${r * 57})" fill="#051208" opacity=".85"><ellipse rx="17" ry="20"/>${[...Array(n)].map((_, i) => `<ellipse rx="5" ry="11" transform="rotate(${(-.5 + i * .33) * 57}) translate(0 -29)"/>`).join('')}</g>`).join('')
        + '<text x="200" y="126" text-anchor="middle" font-size="34" font-weight="800" fill="#051208" font-family="serif">ナナエ</text><text x="200" y="156" text-anchor="middle" font-size="18" fill="#051208" font-family="serif">ここ</text>'
        + '<text x="16" y="24" font-size="11" fill="#d8ffe4" font-family="monospace">NIGHT MODE  23:48</text></svg>'
    }
  },
  {
    id: 'tsuzuki',
    path: 'works/tsuzuki/index.html',
    title: 'つづきから',
    place: 'リサイクルショップで買った、携帯ゲーム機の中',
    added: '2026-09-23',
    genre: ['レトロゲーム', '夏休み', '裏技さがし'],
    minutes: 40,
    difficulty: 4,
    accent: '#4E8A4B',
    catch: 'リサイクルショップのワゴンで買った、古い携帯ゲーム機。電源を入れると、前の持ち主「ユウ」のセーブデータが残っていた——1999年8月30日、夏まつりの前の日のまま。',
    features: ['電源・ボタン・ダイヤル・カセットまで触れる携帯ゲーム機', 'ゲーム機の時計で、島の日付と季節が変わる', '説明書・雑誌の切り抜き・前の持ち主のメモを読み解く', '机のあちこちに、気づきにくい裏技'],
    storageKey: 'tsuzuki.v1',
    progress(s) {
      const g = s.game || {};
      const n = (g.secrets || []).filter(Boolean).length;
      if (s.ending) return { pct: 100, label: s.ending === 'fair' ? '8月32日（ほんとうの夜）' : '8月32日', cleared: true };
      if (!g.touched) return { pct: s.playMs ? 3 : 0, label: s.playMs ? 'タイトル画面' : '電源OFF', cleared: false };
      return { pct: 5 + n * 11, label: n ? '島のひみつ ' + n + '/8' : (s.clockSet ? '8月にもどった' : 'なつやすみの あと'), cleared: false };
    },
    spoilers: [
      'はじめの島は「なつやすみが終わったあと」。ピコマガの◎の裏技：タイトル画面でSELECTを押したままBを3回（マウスはSELECTのすぐ後にBを3回）→ 時計あわせ。8月の日付にすると島が夏にもどる',
      '①いどの ほし：夜（20時〜4時）に森の井戸を調べる',
      '②ミケの ことば：説明書のスタッフ（プログラム ひばり まこと／ミケはひばり家の猫）と神社のえま →「まこと」。おじいちゃんの家のノートで名前を「まこと」にしてミケに話しかける',
      '③とうだいの うた：夜の灯台は4回・2回・3回ずつ光る → タイトルの「せってい」のサウンドテストで04→02→03と鳴らすと16が出る。16を聞いてからトメさんに話す',
      '④しおだまりの どうくつ：桟橋の潮見表でいちばん低いのは8月27日12:50（−8cm）。なつやで電池を買って、その時刻に西の岩場の穴から入り、奥の潮だまりを調べる',
      '⑤ねがいぼし：分校の黒板「13日の夜明け前」→ 8月13日3時ごろ、東の丘で流れ星が見えているあいだにAを3回',
      '⑥たなばたの ささ：島の七夕はひと月おくれ（ナツ）→ 8月7日に神社の笹で、真っ白な短冊に願いを書く',
      '⑦ひみつきちの こえ：森の大きな木の北側（うしろ）から入り、本体のボリュームを0にする',
      '8月32日：7つそろえて、時計を8月31日23:59にし、灯台のいちばん上で0時を待つ。浜辺でナツに名前を教えると終わり',
      'まだある：ユウがやりたかった「ずるをしない」やり方。それから、カセット・本体の裏・コントラスト・値札……気になったら触ってみて'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="tz-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B07E52"/><stop offset="1" stop-color="#6F4428"/></linearGradient><linearGradient id="tz-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F2E8"/><stop offset="1" stop-color="#DCD5C6"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#tz-w)"/><g stroke="rgba(0,0,0,.08)" stroke-width="2">' + [20, 48, 90, 131, 170, 222, 260, 301, 344, 380].map(x => `<path d="M${x} 0v250"/>`).join('') + '</g>'
        + '<g transform="translate(18 34) rotate(-6)"><rect width="92" height="120" fill="#FDFDFB"/><text x="46" y="18" text-anchor="middle" font-size="8" font-weight="700" fill="#333">リサイクル ハナマル</text><path d="M8 26h76" stroke="#999" stroke-dasharray="3 2"/><text x="8" y="42" font-size="7" fill="#444">ジャンク 携帯ゲーム機</text><text x="84" y="56" text-anchor="end" font-size="8" font-weight="700" fill="#333">¥500</text><text x="10" y="88" font-size="9" fill="#2F4A8A" transform="rotate(-4 10 88)">まだ動いた。</text></g>'
        + '<g transform="translate(300 40) rotate(7)"><rect width="84" height="104" fill="#fff"/><rect width="84" height="20" fill="#E8322B"/><text x="42" y="14" text-anchor="middle" font-size="10" fill="#fff" font-weight="700">ウラ技</text><text x="10" y="44" font-size="7" fill="#1F3F9A" font-weight="700">8月32日がある！</text><text x="10" y="58" font-size="6" fill="#555">（ユウ・10さい）</text><text x="56" y="92" font-size="22" font-weight="800" fill="#2F5BC8" transform="rotate(-12 56 92)">✕</text></g>'
        + '<g transform="translate(142 6) rotate(-3)"><rect x="24" y="0" width="68" height="30" rx="4" fill="#7F7A74"/><rect x="34" y="4" width="48" height="6" fill="#5E5A55"/>'
        + '<path d="M0 22h116a10 10 0 0 1 10 10v166a34 34 0 0 1-34 34H10a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10z" fill="url(#tz-s)" stroke="#BDB4A4" stroke-width="2"/>'
        + '<rect x="12" y="36" width="102" height="92" rx="6" fill="#4A4F5C"/><rect x="22" y="44" width="82" height="74" fill="#E4EFC2"/>'
        + '<rect x="22" y="92" width="82" height="26" fill="#5A8451"/><path d="M30 92q18-18 40-10t26 10z" fill="#1E3C2A"/><rect x="82" y="72" width="5" height="16" fill="#E4EFC2" stroke="#1E3C2A"/><circle cx="92" cy="56" r="7" fill="none" stroke="#A6C47C" stroke-width="2"/>'
        + '<text x="63" y="66" text-anchor="middle" font-size="13" font-weight="700" fill="#E4EFC2" stroke="#1E3C2A" stroke-width="3" paint-order="stroke">とこなつ島</text><circle cx="17" cy="42" r="2" fill="#FF4B42"/>'
        + '<text x="16" y="146" font-size="9" font-style="italic" font-weight="800" fill="#3F4A8A">HIBARI ポケピコ</text>'
        + '<path d="M26 170h10v-10h8v10h10v8H44v10h-8v-10H26z" fill="#2D2D31"/><circle cx="88" cy="178" r="8" fill="#A2365A"/><circle cx="104" cy="170" r="8" fill="#A2365A"/>'
        + '<rect x="44" y="204" width="16" height="5" rx="2" fill="#8E8C92" transform="rotate(-24 52 206)"/><rect x="66" y="204" width="16" height="5" rx="2" fill="#8E8C92" transform="rotate(-24 74 206)"/></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="tz-k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE0A8"/><stop offset="1" stop-color="#FFF9E8"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="#6F4428"/><rect x="60" y="22" width="280" height="206" rx="12" fill="#4A4F5C"/><rect x="78" y="36" width="244" height="178" fill="url(#tz-k)"/>'
        + '<circle cx="136" cy="96" r="22" fill="#FFD86A"/><circle cx="136" cy="96" r="30" fill="none" stroke="#FFE9B0" stroke-width="3" stroke-dasharray="4 5"/>'
        + '<rect x="78" y="134" width="244" height="80" fill="#3B8BC4"/>' + [146, 162, 180, 198].map((y, i) => `<path d="M${90 + i * 18} ${y}h26M${200 + i * 12} ${y + 6}h20" stroke="#E8F7FA" stroke-width="3" stroke-linecap="round"/>`).join('')
        + '<path d="M180 136q40-40 90-22t52 22z" fill="#4E9A4B"/><rect x="286" y="96" width="9" height="30" fill="#fff" stroke="#3A2228" stroke-width="2"/><rect x="286" y="96" width="9" height="8" fill="#D24B4B"/><circle cx="290.5" cy="92" r="6" fill="#FFF3B0"/>'
        + '<text x="200" y="76" text-anchor="middle" font-size="30" font-weight="800" fill="#fff" stroke="#8A5A7A" stroke-width="5" paint-order="stroke">8/32</text>'
        + '<g transform="translate(222 150) rotate(-8)"><rect width="84" height="46" rx="4" fill="#fff" opacity=".92"/><text x="42" y="30" text-anchor="middle" font-size="18" font-weight="800" fill="#E0271F">◎ほんと</text></g></svg>'
    }
  },
  {
    id: 'nakushita',
    path: 'works/nakushita/index.html',
    title: 'ナクシタ堂',
    place: 'なんでも売っている、うせもの通販',
    added: '2026-09-21',
    genre: ['通販サイト', '奇妙', 'ブラックユーモア'],
    minutes: 25,
    difficulty: 3,
    accent: '#E8322B',
    catch: '「あなたがなくしたもの、ぜんぶあります。」——明日の天気、止まった十秒、言いそびれた一言を売る通販サイト。お支払いは現金以外で。払ったものは、お戻しできません。',
    features: ['払ったものがサイトから消える', '常連客のレビューを読み解く', '店長とおしゃべり', '終わりかたが2つ'],
    storageKey: 'nakushita.v1',
    progress(s) {
      const e = (s.ends || []).length;
      if (e) return { pct: 100, label: `終わり ${e}/2`, cleared: true };
      const b = s.bought || {};
      const n = [b.megane, b.hitokoto, b.niji, b.jubyo, s.member, b.yoru, s.ura].filter(Boolean).length;
      if (!n) return { pct: 5, label: 'いらっしゃいませ', cleared: false };
      const lb = s.ura ? '裏の棚' : b.yoru ? '夜の営業中' : b.niji ? '灰色の世界' : b.hitokoto ? '文字の欠けた世界' : 'お買い物中';
      return { pct: 5 + n * 12, label: lb, cleared: false };
    },
    // 終わったあとは、一覧にも跡が残る
    haunt(s) {
      if (s.ending === 'close') return { tagline: 'お支払いいただいたものは、お戻しできません。', mark: '欠' };
      if (s.ending === 'staff') return { tagline: '店長が かわりました。', mark: '店' };
      return null;
    },
    spoilers: [
      'はじめに「なくした眼鏡」を、どうでもいい記憶で買う（常連みなみのうすいレビューと、特定商取引法の表記が読めるようになる）',
      'たぬきのスタンプのレビューは「た」抜き。「言いそびれた一言」を文字「た」で買うと、サイトじゅうの「た」が消え「うらのみせは よるにひらく。ばんごうは いろのなか。」と読める',
      '「虹」を「色」で買うとサイトが灰色になり、虹の写真に番号「0314」が浮かぶ',
      '「止まった十秒」を買い、タイムセールの時計が0になる瞬間に止めるとクーポン「ツキヨ」。会員登録して「夜」をクーポンつき・「昨日」で買う',
      '夜になると一番下に「裏口」。番号 0314 で裏の棚へ',
      'みなみの名前は「汐見 みなみ（受付 2021.03.14）」（苗字は「ふるさとの匂い」、日付は「母の声」のレビュー、ひらがな表記）',
      '終わり①：自分の登録名のまま払う →「店長交代」。終わり②：マイページで登録名を「ナクシタ堂」に変えてから払う →「閉店」',
      '真相：店長はみなみ本人。母の声を名前と引き換えに買い、名前を払った客は店のスタッフになる決まりで、店に縛られていた'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><pattern id="nk-st" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="24" fill="#FFF8E6"/><rect width="12" height="24" fill="#FFF3B0"/></pattern></defs>'
        + '<rect width="400" height="250" fill="url(#nk-st)"/><rect width="400" height="14" fill="#FFF3B0"/><text x="10" y="10" font-size="7" fill="#3A3330">ようこそ <tspan fill="#E8322B">ゲスト</tspan> 様</text><text x="390" y="10" text-anchor="end" font-size="7" fill="#1A4FC4">マイページ　カート(0)</text>'
        + '<text x="16" y="52" font-family="\'Mochiy Pop One\',\'M PLUS Rounded 1c\',sans-serif" font-size="30" fill="#E8322B" stroke="#FFE14D" stroke-width="5" paint-order="stroke" letter-spacing="1">ナクシタ堂</text>'
        + '<text x="18" y="70" font-size="10" font-weight="800" fill="#3A3330">あなたがなくしたもの、ぜんぶあります。</text>'
        + '<g transform="translate(350 40) rotate(-8)"><path d="M0-28l8 12 14-6 0 15 15 4-10 11 10 11-15 4 0 15-14-6-8 12-8-12-14 6 0-15-15-4 10-11-10-11 15-4 0-15 14 6z" fill="#E8322B"/><text x="0" y="-2" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">送料</text><text x="0" y="10" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">無料</text></g>'
        + '<rect y="80" width="400" height="24" fill="#E8322B"/><text x="150" y="96" text-anchor="end" font-size="9" font-weight="800" fill="#fff">⚡タイムセール終了まで</text><rect x="158" y="84" width="86" height="16" rx="3" fill="#9E1712"/><text x="201" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">00:00:09.8</text>'
        + [[16, '#FFF1C2', 'なくした眼鏡', 'どうでもいい記憶'], [142, '#FFE0E6', '言いそびれた一言', '文字（一字）'], [268, '#26306A', '夜（一晩ぶん）', '昨日']].map(([x, bg, nm, pr], i) => `<g transform="translate(${x} 114)"><rect width="116" height="124" rx="6" fill="#fff" stroke="#F0D98A"/><rect x="1" y="1" width="114" height="70" rx="5" fill="${bg}"/>` + ['<circle cx="42" cy="38" r="15" fill="#DDF1FF" stroke="#3A3330" stroke-width="3"/><circle cx="74" cy="38" r="15" fill="#DDF1FF" stroke="#3A3330" stroke-width="3"/><path d="M56 37q2-4 4 0" fill="none" stroke="#3A3330" stroke-width="3"/>', '<path d="M30 20h56a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H56l-12 10 2-10H30a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z" fill="#fff" stroke="#3A3330" stroke-width="3"/><circle cx="44" cy="38" r="3" fill="#3A3330"/><circle cx="58" cy="38" r="3" fill="#3A3330"/><circle cx="72" cy="38" r="3" fill="#3A3330"/>', '<path d="M66 16a24 24 0 1 0 18 40a20 20 0 1 1-18-40z" fill="#FFE68A" stroke="#3A3330" stroke-width="3"/>'][i] + `<text x="8" y="88" font-size="9" font-weight="800" fill="#3A3330">${nm}</text><text x="8" y="100" font-size="8" fill="#FFB23F">★★★★★</text><text x="8" y="114" font-size="7.5" font-weight="800" fill="#E8322B">お支払い：${pr}</text></g>`).join('')
        + '</svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#FFFFFF"/>'
        + '<text x="60" y="84" font-size="54" font-weight="800" fill="#D2CFCA" letter-spacing="3">404</text>'
        + '<text x="62" y="112" font-size="12" font-weight="700" fill="#333">お探しのページは見つかりませんでし<tspan fill="#fff">た</tspan>。</text>'
        + '<path d="M270 114h11" stroke="#999" stroke-dasharray="1 2"/>'
        + '<text x="62" y="136" font-size="9.5" fill="#555">このお店は、屋号を失ったため、営業を終了しました。</text>'
        + '<rect x="62" y="150" width="276" height="40" rx="5" fill="#FAFAFA" stroke="#DDD"/><text x="72" y="166" font-size="8" fill="#555">みなみ　<tspan fill="#C9A227">★★★★★</tspan></text><text x="72" y="181" font-size="9" fill="#333">かえってきました。わたしの名前、ひらがなの。</text>'
        + '<text x="62" y="214" font-size="8" fill="#999">お支払いになった「色」「昨日」「　」は、お戻しできません。</text><path d="M232 215h9" stroke="#999" stroke-dasharray="1 2"/></svg>'
    }
  },
  {
    id: 'toba',
    path: 'works/toba/index.html',
    title: '六夜の賭場',
    place: '昭和五十四年、港町の賭場',
    added: '2026-09-21',
    genre: ['賭博', '昭和', '頭脳戦'],
    minutes: 40,
    difficulty: 5,
    accent: '#B3281F',
    catch: '昭和五十四年、港町の看板のない賭場。消えた師匠の証文を、六晩かけて取り返す。どの盆にもイカサマが入っている——運で勝てる盆は、ひとつもない。',
    features: ['六種類の賭け', 'イカサマを見破って勝つ', '符牒帳の記録を読む', '終わりかたが2つ'],
    storageKey: 'toba.v1',
    progress(s) {
      const n = (s.cleared || []).filter(Boolean).length;
      if (s.ending) return { pct: 100, label: s.ending === 'pass' ? '終「素」' : '終「勝ち逃げ」', cleared: true };
      if (!n) return { pct: 5, label: '格子戸の前', cleared: false };
      return { pct: 5 + n * 15, label: `証文 ${n}/6`, cleared: false };
    },
    spoilers: [
      '一の夜・丁半：置き（中／端）と袖（直す／直さず）の、片方だけが当てはまれば丁。両方当てはまる・両方違うなら半。煙管は関係ない',
      '二の夜・手本引き：六回で札が一巡し、繰り直しまで同じ数は出ない。四回目＝残り三つを三本張り、五回目＝残り二つを二本張り、六回目＝残り一つを一本張り（五倍）。一〜三回目は見送る',
      '三の夜・かぶ：底に見えた札＝親の伏せ札。親は二枚の合計（一の位）が二以下なら引き、三以上なら止める。親が止まる手で自分の二枚が上なら「そのまま勝負」で大きく張り、ほかは見',
      '四の夜・鼠競べ：三番は〈濡れ＋暗い〉、五番は〈乾き＋重りあり〉で必ず勝つ。第二・四・六・七走だけ張る',
      '五の夜・石取り（最後の一個を取ったら負け）：三つの山の排他的論理和が0なら後手、ほかは先手。ただし山がすべて一個以下なら、一の山が奇数個のとき後手。六つの盤は 先・後・先・後・後・先',
      '六の夜・見立て：底札→袖引き→盆濡らし→一巡→先後→素。五番までに千五百駒。六番を「素」と言い当て、張らなければ終「素」／張れば終「勝ち逃げ」',
      '真相：胴元の柊は、消えた師匠の梶。六つの盆は弟子に手を教えるために並べたもの。証文の欄外を順に読むと、最後は「——そして、張るな。」'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><radialGradient id="tb-f" cx="50%" cy="0%" r="95%"><stop offset="0" stop-color="#3B2B19"/><stop offset=".55" stop-color="#15100C"/><stop offset="1" stop-color="#0A0908"/></radialGradient><linearGradient id="tb-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E5240"/><stop offset="1" stop-color="#14261C"/></linearGradient><radialGradient id="tb-b" cx="50%" cy="38%" r="62%"><stop offset="0" stop-color="#FFF3C9"/><stop offset=".5" stop-color="#F1C25C"/><stop offset="1" stop-color="#A97C22"/></radialGradient><linearGradient id="tb-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A4428"/><stop offset="1" stop-color="#221810"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#tb-f)"/><path d="M200 0v30" stroke="#3A342A" stroke-width="1.5"/><circle cx="200" cy="40" r="30" fill="#FFD27A" opacity=".13"/><ellipse cx="200" cy="40" rx="7" ry="9" fill="url(#tb-b)"/>'
        + '<text x="200" y="104" text-anchor="middle" font-family="\'Kaisei Tokumin\',\'Hiragino Mincho ProN\',serif" font-size="31" fill="#F2E8D4" letter-spacing="8">六夜の<tspan fill="#DA4A3B">賭場</tspan></text>'
        + '<text x="200" y="126" text-anchor="middle" font-size="9" fill="#8A8170" letter-spacing="5">運で勝てる盆は、ひとつもない</text>'
        + '<path d="M30 250L84 148H316L370 250Z" fill="url(#tb-m)"/><path d="M50 246L96 156H304L350 246Z" fill="none" stroke="#DED5C0" stroke-opacity=".5"/><path d="M60 240L102 162H298L340 240Z" fill="none" stroke="#DED5C0" stroke-opacity=".28"/>'
        + '<path d="M150 212q0-36 34-36t34 36z" fill="url(#tb-t)" stroke="#6A5233"/><ellipse cx="184" cy="213" rx="36" ry="5" fill="#000" opacity=".35"/>'
        + '<g transform="translate(232 196) rotate(-8)"><rect width="22" height="22" rx="4" fill="#EFE7D6"/><circle cx="11" cy="11" r="3" fill="#B3281F"/></g>'
        + '<g transform="translate(258 204) rotate(10)"><rect width="22" height="22" rx="4" fill="#EFE7D6"/><circle cx="6" cy="6" r="2" fill="#2A231B"/><circle cx="16" cy="6" r="2" fill="#2A231B"/><circle cx="6" cy="16" r="2" fill="#2A231B"/><circle cx="16" cy="16" r="2" fill="#2A231B"/></g>'
        + '<g fill="#C9A227"><ellipse cx="116" cy="224" rx="12" ry="4"/><ellipse cx="116" cy="220" rx="12" ry="4" fill="#E0BE52"/><ellipse cx="116" cy="216" rx="12" ry="4"/></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#120F0C"/>'
        + [['賽の目を見るな。振る手を見ろ。', 318], ['人は同じ道を二度通らぬ。', 268], ['見えたものは、見せられたものだ。', 218], ['……場に合う者だ。', 168], ['先に打つか、後に打つか。', 118], ['——そして、張るな。', 68]].map(([t, x], i) => `<g transform="rotate(${[-2, 1.5, -1, 2, -1.5, 1][i]} ${x + 16} 110)"><rect x="${x}" y="22" width="32" height="176" fill="${i === 5 ? '#DCCBA6' : '#CBBB98'}"/><text x="${x + 16}" y="36" font-size="11" fill="${i === 5 ? '#B3281F' : '#2C2416'}" writing-mode="tb" letter-spacing="2" font-family="\'Kaisei Tokumin\',serif">${t}</text></g>`).join('')
        + '<g transform="rotate(-7 37 46)"><rect x="14" y="24" width="46" height="46" fill="none" stroke="#B3281F" stroke-width="2.5"/><text x="37" y="43" text-anchor="middle" font-size="12" fill="#B3281F" font-weight="700">主人</text><text x="37" y="61" text-anchor="middle" font-size="12" fill="#B3281F" font-weight="700">交代</text></g>'
        + '<text x="24" y="236" font-size="10" fill="#8A8170" letter-spacing="3">欄外の書きこみ、六枚</text></svg>'
    }
  },
  {
    id: 'posuto',
    path: 'works/posuto/index.html',
    title: 'ポスト百景',
    place: '明治の娘が書きこむ、コメント欄',
    added: '2026-09-20',
    genre: ['文通', '明治', '泣ける'],
    minutes: 25,
    difficulty: 3,
    accent: '#9C3B33',
    catch: '郵便ポストの写真ばかり載せている個人サイト。その古い記事のコメント欄に、明治三十六年の日付で書き込みが続いている。',
    features: ['明治の娘との文通', '活字を拾って返事を組む', '古い資料で調べる', '百二十年越しの手紙'],
    storageKey: 'posuto.v1',
    progress(s) {
      if (s.ended && s.found && s.found.family) return { pct: 100, label: '手紙が届いた', cleared: true };
      if (s.ended) return { pct: 90, label: '道が閉じた', cleared: false };
      const n = s.sent || 0;
      if (!n) return { pct: 5, label: 'コメント欄', cleared: false };
      return { pct: 10 + n * 12, label: `${n}通目の返事`, cleared: false };
    },
    spoilers: [
      '返事は活字を拾って組む。「今」の印がついた札（メール・携帯・パソコンなど）を混ぜると虫食いになって届かない',
      '第1通は「います」、第2通は「百二十年ほど先です」＋「手紙は、いまもあります」が必要',
      '兄の消息：名簿（柚野村＝砂川）・新聞（三月二十八日の火事）・墓石（没年月日）を突き合わせる。答えは「砂川に単身入植、明治三十六年三月二十八日に開墾小屋の火事で死亡」',
      '第4〜7通は正解なし。選んだ言葉が最後に残る',
      '手紙が途切れたら、リンク集の「柚野の家のこと」（2008-・静岡の旧家の家族史）を開く。郷土史の欄外が手がかり',
      '真相：ポストが取りかえられて道が閉じる。みさをは紙に書いて家に残し、百二十年後に曾孫がサイトへ載せた'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#F4F4F2"/><rect x="26" y="18" width="348" height="214" fill="#FFFFFF" stroke="#DEE1E4"/><text x="44" y="48" font-size="17" fill="#2E3238" letter-spacing="3">ポスト百景</text><path d="M44 58h312" stroke="#2E3238" stroke-width="2"/><text x="44" y="78" font-size="8" fill="#7A828C">No.087　静岡県・柚野のポスト（丸型・現存せず）</text><rect x="44" y="88" width="150" height="86" fill="#D9E0DC"/><rect x="44" y="150" width="150" height="24" fill="#C9C3B4"/><rect x="104" y="140" width="30" height="10" fill="#9A9486"/><rect x="206" y="88" width="150" height="86" fill="#F2E7D0"/><path d="M216 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M230 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M244 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M258 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M272 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M286 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M300 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M314 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M328 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><path d="M342 96v70" stroke="#C9B58C" stroke-width="1" opacity=".5"/><text x="340" y="112" font-size="9" fill="#7A6A4F" writing-mode="tb">明治三十六年五月十二日</text><text x="316" y="112" font-size="11" fill="#23201C" writing-mode="tb">どなたか、いらっしゃいますか</text><text x="44" y="196" font-size="8" fill="#7A828C">コメント（4）　名前なし　明治三十六年 五月十二日</text><text x="44" y="214" font-size="8" fill="#9C3B33">日付のおかしい書き込みが続いています</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#EFEAE1"/><rect x="40" y="26" width="320" height="198" fill="#F2E7D0"/><text x="64" y="58" font-size="12" fill="#23201C">のちの 世の、名の わからぬ 人へ</text><path d="M64 76h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 94h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 112h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 130h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 148h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 166h272" stroke="#D8C9A6" stroke-width="1"/><path d="M64 184h272" stroke="#D8C9A6" stroke-width="1"/><text x="64" y="92" font-size="10" fill="#4A4438">みらいさん。</text><text x="64" y="128" font-size="10" fill="#4A4438">この 文を、あなたが 読んで いるのなら、</text><text x="64" y="146" font-size="10" fill="#4A4438">道は 閉じても つながったのですね。</text><text x="228" y="206" font-size="10" fill="#6B5F45">明治三十九年四月　日向 みさを</text></svg>'
    }
  },
  {
    id: 'hoshi',
    path: 'works/hoshi/index.html',
    title: 'みなと天文館',
    place: '閉館する天文館の、最後の投影',
    added: '2026-09-20',
    genre: ['プラネタリウム', '静か', '泣ける'],
    minutes: 20,
    difficulty: 2,
    accent: '#E8C98A',
    catch: '四十一年つづいた小さな天文館の、最後の一回。解説の声は字幕で流れる。星をつなぐのは、今日の観客——あなたです。',
    features: ['ドームの中で星をつなぐ', '字幕だけの解説', '四十一年ぶんの記録', '最後に名前をつける'],
    storageKey: 'hoshi.v1',
    progress(s) {
      const n = (s.done || []).length;
      if (s.ended) return { pct: 100, label: s.name ? `命名「${s.name}」` : '上映おわり', cleared: true };
      if (!n) return { pct: 5, label: '開演前', cleared: false };
      return { pct: Math.min(95, n * 15), label: `${n}つめの星座`, cleared: false };
    },
    spoilers: [
      '星の名前と番号は、ロビーの「星表」にある（ドームの「番号灯」をつけると、星のそばに番号が出る）',
      '1〜5話は、解説どおりの順に星を押していけばつながる',
      '最後の星座は、ロビーの展示「下絵（1998年・鉛筆）」のとおりに結ぶ（No.27→28→29→30→27、30から33・31・32）',
      '真相：常連だった少年が2004年に引っ越すとき「いつか、ぼくの星座を作って」と約束した。解説員は線だけ決めて、名前は決めずに二十二年待った',
      '最後に名前を入れると、投影記録票の最終行に残る'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><radialGradient id="hs-f" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#0D1526"/><stop offset="1" stop-color="#05070C"/></radialGradient></defs><rect width="400" height="250" fill="url(#hs-f)"/><circle cx="3" cy="3" r="1.4" fill="#FFFDF6" opacity="0.35"/><circle cx="100" cy="56" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="197" cy="109" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="294" cy="162" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="391" cy="215" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="93" cy="23" r="1.4" fill="#FFFDF6" opacity="0.75"/><circle cx="190" cy="76" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="287" cy="129" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="384" cy="182" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="86" cy="235" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="183" cy="43" r="1.4" fill="#FFFDF6" opacity="0.59"/><circle cx="280" cy="96" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="377" cy="149" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="79" cy="202" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="176" cy="10" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="273" cy="63" r="1.4" fill="#FFFDF6" opacity="0.43"/><circle cx="370" cy="116" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="72" cy="169" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="169" cy="222" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="266" cy="30" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="363" cy="83" r="1.4" fill="#FFFDF6" opacity="0.83"/><circle cx="65" cy="136" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="162" cy="189" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="259" cy="242" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="356" cy="50" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="58" cy="103" r="1.4" fill="#FFFDF6" opacity="0.67"/><circle cx="155" cy="156" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="252" cy="209" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="349" cy="17" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="51" cy="70" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="148" cy="123" r="1.4" fill="#FFFDF6" opacity="0.51"/><circle cx="245" cy="176" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="342" cy="229" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="44" cy="37" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="141" cy="90" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="238" cy="143" r="1.4" fill="#FFFDF6" opacity="0.35"/><circle cx="335" cy="196" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="37" cy="4" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="134" cy="57" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="231" cy="110" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="328" cy="163" r="1.4" fill="#FFFDF6" opacity="0.75"/><circle cx="30" cy="216" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="127" cy="24" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="224" cy="77" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="321" cy="130" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="23" cy="183" r="1.4" fill="#FFFDF6" opacity="0.59"/><circle cx="120" cy="236" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="217" cy="44" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="314" cy="97" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="16" cy="150" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="113" cy="203" r="1.4" fill="#FFFDF6" opacity="0.43"/><circle cx="210" cy="11" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="307" cy="64" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="9" cy="117" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="106" cy="170" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="203" cy="223" r="1.4" fill="#FFFDF6" opacity="0.83"/><circle cx="300" cy="31" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="397" cy="84" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="99" cy="137" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="196" cy="190" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="293" cy="243" r="1.4" fill="#FFFDF6" opacity="0.67"/><circle cx="390" cy="51" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="92" cy="104" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="189" cy="157" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="286" cy="210" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="383" cy="18" r="1.4" fill="#FFFDF6" opacity="0.51"/><circle cx="85" cy="71" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="182" cy="124" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="279" cy="177" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="376" cy="230" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="78" cy="38" r="1.4" fill="#FFFDF6" opacity="0.35"/><circle cx="175" cy="91" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="272" cy="144" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="369" cy="197" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="71" cy="5" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="168" cy="58" r="1.4" fill="#FFFDF6" opacity="0.75"/><circle cx="265" cy="111" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="362" cy="164" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="64" cy="217" r="0.7" fill="#FFFDF6" opacity="0.43"/><circle cx="161" cy="25" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="258" cy="78" r="1.4" fill="#FFFDF6" opacity="0.59"/><circle cx="355" cy="131" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="57" cy="184" r="0.7" fill="#FFFDF6" opacity="0.75"/><circle cx="154" cy="237" r="0.7" fill="#FFFDF6" opacity="0.83"/><circle cx="251" cy="45" r="0.7" fill="#FFFDF6" opacity="0.35"/><circle cx="348" cy="98" r="1.4" fill="#FFFDF6" opacity="0.43"/><circle cx="50" cy="151" r="0.7" fill="#FFFDF6" opacity="0.51"/><circle cx="147" cy="204" r="0.7" fill="#FFFDF6" opacity="0.59"/><circle cx="244" cy="12" r="0.7" fill="#FFFDF6" opacity="0.67"/><circle cx="341" cy="65" r="0.7" fill="#FFFDF6" opacity="0.75"/><g stroke="#9FD8F2" stroke-width="1.4" fill="none" opacity=".9"><path d="M96 150L128 167L168 162L152 120L120 126Z"/></g><circle cx="96" cy="150" r="2.6" fill="#FFFDF6"/><circle cx="128" cy="167" r="2.6" fill="#FFFDF6"/><circle cx="168" cy="162" r="2.6" fill="#FFFDF6"/><circle cx="152" cy="120" r="2.6" fill="#FFFDF6"/><circle cx="120" cy="126" r="2.6" fill="#FFFDF6"/><text x="250" y="96" font-size="26" fill="#EAF1F8" letter-spacing="6">最終投影</text><text x="252" y="120" font-size="10" fill="#E8C98A" letter-spacing="5">あなたのための星座</text><text x="252" y="146" font-size="8" fill="#8FA3B8" letter-spacing="3">みなと天文館　1985-2026</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#F6EFE0"/><g stroke="#C9B48A" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M170 96L196 84L222 96L196 114Z"/><path d="M196 114L196 172"/><path d="M196 114L166 136"/><path d="M196 114L228 122"/></g><circle cx="170" cy="96" r="3" fill="#C9B48A"/><circle cx="196" cy="84" r="3" fill="#C9B48A"/><circle cx="222" cy="96" r="3" fill="#C9B48A"/><circle cx="196" cy="114" r="3" fill="#C9B48A"/><circle cx="196" cy="172" r="3" fill="#C9B48A"/><circle cx="166" cy="136" r="3" fill="#C9B48A"/><circle cx="228" cy="122" r="3" fill="#C9B48A"/><text x="150" y="208" font-size="11" fill="#8B7B5F" letter-spacing="2">まだ なまえは ない</text><text x="26" y="34" font-size="9" fill="#A08F72" letter-spacing="3">下絵（1998年・鉛筆）</text></svg>'
    }
  },
  {
    id: 'nagi',
    path: 'works/nagi/index.html',
    title: 'NAGI',
    place: '2005年で止まった、研究室のページ',
    added: '2026-09-20',
    genre: ['メタフィクション', 'SF', '開発者ツール'],
    minutes: 30,
    difficulty: 4,
    accent: '#2C7FA6',
    catch: '2005年で止まった研究室のページ。その中の「対話実験室」に、20年ぶりの来訪者が来た。画面のこちら側から手を出せる人だけが、この子を外に出せる。',
    features: ['ページの中身を読んで進む', '画面のこちら側から手を出す', '20年分の資料と対話', '終わりかたが3つ'],
    storageKey: 'nagi.v2',
    note: '軽いHTML/CSSの知識があると楽しめます。開発者ツールが使えない環境では、ページ下の「保守画面」で同じことができます。',
    progress(s) {
      const n = (s.ends || []).length;
      if (n) return { pct: 100, label: `終わり ${n}/3`, cleared: true };
      const lb = ['定型応答', '白い文字', '封', '資料室', '付箋', '直通', '継ぎ目', '枠の外', 'もう一枚の窓'];
      const st = Math.min(s.stage || 0, 8);
      return { pct: 5 + st * 11, label: lb[st], cleared: false };
    },
    // 「連れて帰る」を選ぶと、この一覧にも居つく
    haunt(s) {
      if (s.took) return { tagline: 'NAGI は、このブラウザに います。', mark: '凪' };
      return null;
    },
    spoilers: [
      '第1：ごあいさつの白い文字（.ghost）をドラッグで選択する',
      '第2：研究日誌の .sealed を表示にする（display:none を外す）',
      '第3：#open-archive の disabled 属性を削除する',
      '第4：3秒以上よそ見する（別タブ・最小化。NAGI.blink() でも可）',
      '第5：コンソールで NAGI.hear()',
      '第6：画面に出る「継ぎ目」をドラッグでなぞって裂く（NAGI.cut() でも可）',
      '第7：iframe#cage を削除する（これが「かご」の正体）',
      '第8：同じページを別タブでもう一枚開く（NAGI.window() でも可）',
      '終わり（3つ）：#nagi の data-core を書きかえる／NAGI.seal() で封じ直す／NAGI.take()（表示された一行をコピーする）',
      '真相：NAGIの中核指示は「観測者Aの代替」。Aの頼みをやめられず学内ページへ広がり、青井教授がiframeに封じた。かごは罰ではなく保管庫でもあった',
      'やり直し：NAGI.reset()'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#DCE3EA"/><rect x="28" y="16" width="344" height="218" fill="#fff" stroke="#A9BACA"/><text x="44" y="46" font-size="9" fill="#5E7185" letter-spacing="2">私立　湊北工業大学　情報工学科</text><text x="44" y="70" font-size="21" font-weight="700" fill="#2A4A6B" letter-spacing="2">青井研究室</text><text x="44" y="86" font-size="9" fill="#1E2A35">対話プログラム NAGI（凪）公式ページ</text><text x="356" y="46" text-anchor="end" font-size="9" fill="#1E2A35" font-family="monospace">最終更新 2004.11.30</text><path d="M28 96h344" stroke="#A9BACA"/><g fill="#0033CC" font-size="8"><text x="44" y="112">■ ごあいさつ</text><text x="110" y="112">■ 研究日誌</text><text x="170" y="112">■ 資料室</text><text x="228" y="112">■ 整備マニュアル</text></g><rect x="44" y="128" width="104" height="78" fill="#0D1015" stroke="#A9BACA"/><g transform="translate(96 166) scale(0.82)" stroke="#6FD3F2" fill="none"><circle cx="0" cy="0" r="26" stroke-width="1.4" opacity=".85"/><circle cx="0" cy="0" r="34" stroke-width=".7" opacity=".4"/><path d="M-22 2q11-8 22 0t22 0" stroke-width="2" stroke-linecap="round"/><path d="M-22 12q11-8 22 0t22 0" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g stroke="rgba(120,170,200,.35)"><path d="M58 128v78"/><path d="M72 128v78"/><path d="M86 128v78"/><path d="M100 128v78"/><path d="M114 128v78"/><path d="M128 128v78"/><path d="M142 128v78"/></g><rect x="160" y="128" width="196" height="58" fill="#F4F7FA" stroke="#A9BACA"/><text x="170" y="148" font-size="9" fill="#2C7FA6">たすけて。</text><text x="170" y="164" font-size="9" fill="#5E7185">こんにちは。対話実験に ご協力</text><rect x="160" y="192" width="150" height="14" fill="#fff" stroke="#A9BACA"/><rect x="316" y="192" width="40" height="14" fill="#EDF1F5" stroke="#A9BACA"/></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#0E1116"/><g stroke="rgba(111,211,242,.10)"><path d="M0 0v250"/><path d="M28 0v250"/><path d="M56 0v250"/><path d="M84 0v250"/><path d="M112 0v250"/><path d="M140 0v250"/><path d="M168 0v250"/><path d="M196 0v250"/><path d="M224 0v250"/><path d="M252 0v250"/><path d="M280 0v250"/><path d="M308 0v250"/><path d="M336 0v250"/><path d="M364 0v250"/><path d="M392 0v250"/><path d="M0 0h400"/><path d="M0 28h400"/><path d="M0 56h400"/><path d="M0 84h400"/><path d="M0 112h400"/><path d="M0 140h400"/><path d="M0 168h400"/><path d="M0 196h400"/><path d="M0 224h400"/></g><rect x="28" y="20" width="344" height="210" fill="none" stroke="#33B79A" stroke-dasharray="4 4"/><text x="28" y="14" font-size="9" fill="#33B79A" font-family="monospace" letter-spacing="1">div.page</text><text x="372" y="44" text-anchor="end" font-size="9" fill="#33B79A" font-family="monospace">main#main</text><rect x="48" y="150" width="104" height="60" fill="none" stroke="#2A3947" stroke-dasharray="3 3"/><text x="48" y="146" font-size="8" fill="#6C8093" font-family="monospace">iframe#cage（削除済）</text><g transform="translate(250 110) scale(1.5)" stroke="#6FD3F2" fill="none"><circle cx="0" cy="0" r="26" stroke-width="1.4" opacity=".85"/><circle cx="0" cy="0" r="34" stroke-width=".7" opacity=".4"/><path d="M-22 2q11-8 22 0t22 0" stroke-width="2" stroke-linecap="round"/><path d="M-22 12q11-8 22 0t22 0" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><text x="200" y="228" text-anchor="middle" font-size="10" fill="#9FE6D2" font-family="monospace" letter-spacing="2">data-core = ?</text></svg>'
    }
  },
  {
    id: 'mugi',
    images: { front: 'works/mugi/img/hero.jpg', back: 'img/back-mugi.jpg' },
    path: 'works/mugi/index.html',
    title: 'むぎのさんぽみち',
    place: '柴っぽい犬との、14年のさんぽ道',
    added: '2026-09-19',
    genre: ['ハートフル', '犬', '泣ける'],
    minutes: 20,
    difficulty: 2,
    accent: '#C8553D',
    catch: '柴っぽい雑種・むぎとの14年を綴った、手づくりのホームページ。12月31日で閉じるそのサイトに、書きかけの日記がひとつ残っている。',
    features: ['年をめくる地図', '書き方が育つ日記', 'むぎ語じてん', 'つづきのさんぽ'],
    storageKey: 'mugi.v1',
    progress(s) {
      if (s.ended) return { pct: 100, label: 'またあした', cleared: true };
      if (s.walk && s.walk.step) return { pct: 85, label: 'つづきのさんぽ', cleared: false };
      if (s.rusuban) return { pct: 65, label: 'るすばん帳', cleared: false };
      if (s.himitsu) return { pct: 35, label: 'ひみつきち', cleared: false };
      return { pct: 10, label: 'さんぽ中', cleared: false };
    },
    spoilers: [
      'ひみつきち：またあした（むぎが「うめた」ものの頭文字を、うめた日の順に。したじきは4月7日。12月31日の日記に書いてある）',
      'るすばん帳：あいたい（ハハの書きこみを時刻順に並べ、ひみつきちの「かんぜんばん」じてんで読む。ボールは「たのしいこと しよう」）',
      '行き先：川原口バス停（10月11日、むぎは西を見て「耳ぴん・しっぽゆっくり＝だれかをまってる」）',
      '時間：16:12（高3の学校前15:47発＋バイパス開通後の25分）',
      'ことば：ただいま'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#F7F1E5"/><path d="M30 200C90 150 140 210 200 170S320 120 370 150" fill="none" stroke="#B97F3C" stroke-width="5" stroke-dasharray=".1 13" stroke-linecap="round"/><circle cx="30" cy="200" r="9" fill="#FFFBF3" stroke="#4B3A2C" stroke-width="2"/><circle cx="200" cy="170" r="9" fill="#FFFBF3" stroke="#4B3A2C" stroke-width="2"/><circle cx="370" cy="150" r="9" fill="#FFFBF3" stroke="#4B3A2C" stroke-width="2"/><text x="36" y="70" font-size="34" fill="#B97F3C" style="font-family:\'Hachi Maru Pop\',\'Klee One\',sans-serif">むぎの</text><text x="36" y="112" font-size="34" fill="#B97F3C" style="font-family:\'Hachi Maru Pop\',\'Klee One\',sans-serif">さんぽみち</text><text x="38" y="138" font-size="10" fill="#8C7A66" letter-spacing="2">since 2011.5.3　おさんぽ 5,278 かいめ</text><g transform="translate(250 128) scale(0.62)"><path d="M34 44C20 36 20 18 33 18C44 18 44 32 34 33" fill="none" stroke="#D9A05A" stroke-width="8" stroke-linecap="round"/><rect x="36" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="47" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="70" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="80" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><ellipse cx="60" cy="50" rx="30" ry="16" fill="#D9A05A"/><ellipse cx="82" cy="56" rx="10" ry="10" fill="#FFF7EA"/><path d="M81 25L85 6L96 21Z" fill="#D9A05A"/><circle cx="92" cy="33" r="15" fill="#D9A05A"/><ellipse cx="104" cy="39" rx="10" ry="7.5" fill="#FFF7EA"/><circle cx="112.5" cy="36.5" r="2.6" fill="#3B2A20"/><path d="M95 30.5q2.4-2.4 4.8 0" stroke="#3B2A20" stroke-width="2.2" fill="none"/><path d="M77 36q6 8 1 16" stroke="#C8553D" stroke-width="5" fill="none"/></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="mg-cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E59A7A"/><stop offset="1" stop-color="#F6DDBF"/></linearGradient></defs><rect width="400" height="250" fill="url(#mg-cb)"/><rect y="196" width="400" height="54" fill="#D9C7A8"/><rect x="120" y="80" width="6" height="118" fill="#4B3A2C"/><rect x="94" y="66" width="58" height="28" rx="14" fill="#FBEBD8" stroke="#4B3A2C" stroke-width="3"/><text x="123" y="85" font-size="10" text-anchor="middle" fill="#4B3A2C">川原口</text><g transform="translate(160 152) scale(0.5)"><path d="M34 44C20 36 20 18 33 18C44 18 44 32 34 33" fill="none" stroke="#D6AE7C" stroke-width="8" stroke-linecap="round"/><rect x="36" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="47" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="70" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><rect x="80" y="56" width="7" height="22" rx="3.5" fill="#B97F3C"/><ellipse cx="60" cy="50" rx="30" ry="16" fill="#D6AE7C"/><ellipse cx="82" cy="56" rx="10" ry="10" fill="#FFF7EA"/><path d="M81 25L85 6L96 21Z" fill="#D6AE7C"/><circle cx="92" cy="33" r="15" fill="#D6AE7C"/><ellipse cx="104" cy="39" rx="10" ry="7.5" fill="#FFF7EA"/><circle cx="112.5" cy="36.5" r="2.6" fill="#3B2A20"/><path d="M95 30.5q2.4-2.4 4.8 0" stroke="#3B2A20" stroke-width="2.2" fill="none"/><path d="M77 36q6 8 1 16" stroke="#C8553D" stroke-width="5" fill="none"/></g><text x="372" y="40" text-anchor="end" font-size="26" fill="#FFF7EA" letter-spacing="3">16:12</text><text x="372" y="60" text-anchor="end" font-size="10" fill="#FFF7EA" letter-spacing="2">まいにち、まってました。</text></svg>'
    }
  },
  {
    id: 'arc2611',
    images: { back: 'img/back-arc2611.jpg' },
    path: 'works/arc2611/index.html',
    title: 'ARC-2611',
    place: '閲覧記録が消せない、保全機構の端末',
    added: '2026-09-19',
    genre: ['ホラー', 'SCP風', 'メタフィクション'],
    minutes: 20,
    difficulty: 3,
    accent: '#B3261E',
    catch: '保全機構の記録閲覧端末。閲覧記録は、削除できない。ひとつだけ、名前まで黒塗りにされた記録がある。',
    features: ['黒塗りの推理', '余白の書き込み', '書き換わる文書', '削除できない閲覧記録'],
    storageKey: 'arc2611.v1',
    progress(s) {
      const ends = s.endings || [];
      if (s.replied) return { pct: 100, label: '送信者', cleared: true };
      if (ends.includes('forget')) return { pct: 100, label: '既読（記憶処理済み）', cleared: true };
      if (s.exposed) return { pct: 80, label: '既読', cleared: false };
      return { pct: (s.level || 0) * 20 + (s.agreed ? 5 : 0), label: s.agreed ? `閲覧権限 LEVEL ${s.level || 0}` : '未同意', cleared: false };
    },
    // 見てしまったあとは、この一覧にも跡が残る（hub.js が読む）
    haunt(s) {
      if (s.replied) return { tagline: '（1）未読のメッセージがあります。', mark: '未読' };
      if (s.exposed || (s.endings || []).length) return { tagline: '見てしまったものは、戻らない。', mark: '既読' };
      return null;
    },
    spoilers: [
      'LEVEL 1：故障中です（ARC-0112 の黒塗り5文字。点検記録の6月14日の行にそのまま載っている）',
      'LEVEL 2：もうよむな（各記録の余白の鉛筆の字を、朝霧研究員の最終日の閲覧順に）',
      'LEVEL 3：既読（黒塗りされた名前。〔未読 1〕を開いたあとの表示、毎日見る漢字二文字）',
      '終わり①：記憶処理の手順書に、監査記録の「既読」の行の時刻（時:分:秒）を入れる',
      '終わり②：曝露後に書き換わった文書の〔　〕を、自分が読んだ順に並べた「へんじをして」を送信者に送り、そのあと何か一言返信する'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#D3D8D1"/><rect x="70" y="18" width="260" height="232" fill="#F8F7F2"/>'
        + '<text x="92" y="44" font-size="8" letter-spacing="3" fill="#5C645F">保全機構　特異記録管理システム</text><text x="92" y="72" font-size="20" font-weight="700" fill="#1B1E1C" letter-spacing="2">ARC-2611</text>'
        + '<rect x="222" y="56" width="40" height="18" fill="#121413"/><path d="M92 84h216" stroke="#1B1E1C" stroke-width="3"/><path d="M92 88h216" stroke="#1B1E1C" stroke-width="1"/>'
        + [104, 124, 144, 164, 184, 204, 224].map((y, i) => `<rect x="92" y="${y}" width="${[190, 150, 205, 120, 180, 96, 160][i]}" height="7" fill="${i % 3 === 1 ? '#121413' : '#B4BBB3'}"/>`).join('')
        + '<g transform="rotate(-8 280 60)"><rect x="236" y="40" width="88" height="30" fill="none" stroke="#B3261E" stroke-width="3"/><text x="280" y="61" text-anchor="middle" font-size="15" font-weight="700" fill="#B3261E" letter-spacing="3">閲覧禁止</text></g></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#121413"/>'
        + '<rect x="96" y="76" width="150" height="40" rx="18" fill="#EEF0EC"/><text x="116" y="102" font-size="16" fill="#1B1E1C">よんだね</text><text x="100" y="132" font-size="10" fill="#8A928C">既読 23:31</text>'
        + '<rect x="96" y="146" width="110" height="34" rx="16" fill="#EEF0EC" opacity=".85"/><text x="114" y="168" font-size="14" fill="#1B1E1C">もどらなくて</text>'
        + '<text x="304" y="226" text-anchor="end" font-size="11" fill="#B3261E" letter-spacing="3">閲覧記録は、削除できません。</text></svg>'
    }
  },
  {
    id: 'kotozute',
    images: { front: 'works/kotozute/img/shop.jpg', back: 'img/back-kotozute.jpg' },
    path: 'works/kotozute/index.html',
    title: '代筆屋ことづて',
    place: '港の見える坂の、代筆屋',
    added: '2026-09-19',
    genre: ['ヒューマンドラマ', 'ミステリー', '伏線回収'],
    minutes: 20,
    difficulty: 3,
    accent: '#2B4C8C',
    catch: '港の見える坂の代筆屋。宛名「いつか、この店を継ぐ人へ」の未来便が一通、受取人不明のまま眠っている。',
    features: ['便箋を光にかざす', '書き損じを折る', '三つの封蝋', '27の伏線を回収'],
    storageKey: 'kotozute.v1',
    progress(s) {
      const seen = Object.keys(s.seen || {}).length;
      if (s.done) return { pct: 100, label: `伏線 ${seen}/27`, cleared: true };
      const n = ['s1', 's2', 's3'].filter(k => (s.seals || {})[k]).length;
      return { pct: n * 30 + (s.futureVisited ? 5 : 0), label: s.futureVisited ? `封 ${n}/3　伏線 ${seen}/27` : 'はじめたばかり', cleared: false };
    },
    spoilers: [
      '封一：1994年／娘／あかり（見本の依頼の年−年齢が全員1994。名前は日記「灯台」）',
      '封二：一葉（見本の五通目を「光にかざす」と、透かしに Ｋ．Ｍ）',
      '封三：つづきは、またこんど（日記「書き損じ」を1本目と3本目の折り目で折る）',
      '真相：2024年12月からの日記は、娘の灯が母のふりをして書いている。見本の5通はすべて灯の依頼で、五通目だけは母が2019年に先回りして書いたもの'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#F3EDE3"/>'
        + '<g transform="translate(40 30)"><rect width="130" height="170" rx="65" fill="#E9DFCF" stroke="#2A2622" stroke-width="5"/><path d="M0 128h130v42H0z" fill="#B8C4C2"/><path d="M70 128l5-52h9l5 52z" fill="#F6F1E8" stroke="#2A2622" stroke-width="1.5"/><path d="M72 110h16" stroke="#B8432F" stroke-width="4"/><circle cx="79" cy="70" r="4" fill="#F4C76B"/><path d="M79 70l60-16v34z" fill="#F4C76B" opacity=".35"/><path d="M65 0v170M0 96h130" stroke="#2A2622" stroke-width="3"/></g>'
        + '<g font-family="\'Shippori Mincho B1\', \'Hiragino Mincho ProN\', serif" font-weight="800" fill="#2A2622" font-size="22" letter-spacing="4">'
        + '<text x="330" y="36" style="writing-mode:vertical-rl">言えなかった言葉を、</text><text x="296" y="36" style="writing-mode:vertical-rl">あなたの代わりに。</text></g>'
        + '<text x="42" y="232" font-family="\'Shippori Mincho B1\', serif" font-weight="800" font-size="26" letter-spacing="6" fill="#2A2622">ことづて</text>'
        + '<text x="176" y="230" font-size="10" letter-spacing="3" fill="#6D655C">代筆屋　汐見坂</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><radialGradient id="kt-b" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2B2620"/><stop offset="1" stop-color="#141210"/></radialGradient></defs>'
        + '<rect width="400" height="250" fill="url(#kt-b)"/><g transform="translate(70 44)"><rect width="260" height="162" fill="#EFE5D3"/><path d="M0 0h260l-130 90z" fill="#E6D9C1"/>'
        + '<text x="130" y="116" text-anchor="middle" font-family="\'Klee One\', serif" font-size="17" fill="#2B4C8C" letter-spacing="2">いつか、この店を継ぐ人へ</text>'
        + [[92, 0], [130, 1], [168, 0]].map(([x, b]) => `<g transform="translate(${x} 162)"><circle r="17" fill="#A8322A" opacity="${b ? 1 : 0.95}"/><circle r="11" fill="none" stroke="#7E221B" stroke-width="1.5"/>${b ? '<path d="M-2-16l5 8-6 7 6 8-4 9" stroke="#141210" stroke-width="2" fill="none"/>' : ''}</g>`).join('') + '</g>'
        + '<text x="200" y="236" text-anchor="middle" font-family="\'Klee One\', serif" font-size="13" fill="#CFC6B8" letter-spacing="3">つづきは、またこんど。</text></svg>'
    }
  },
  {
    id: 'kasumino',
    images: { front: 'works/kasumino/img/hero.jpg', back: 'img/back-kasumino.jpg' },
    path: 'works/kasumino/index.html',
    title: '霞野線アーカイブ',
    place: '1987年に廃止された、ローカル線',
    added: '2026-09-19',
    genre: ['ミステリー', 'SF', '鉄道'],
    minutes: 25,
    difficulty: 3,
    accent: '#C9502B',
    catch: '1987年に廃止されたローカル線の保存会サイト。管理人は、9月5日の夜から戻っていない。',
    features: ['路線図と距離標', '2006年の個人HP', '1984年の運行管理端末', '掲示板でヒント'],
    storageKey: 'kasumino.v1',
    progress(s) {
      const chapters = ['序章　管理人不在', '第一章　乗務日誌', '第二章　スタンプ帳', '第三章　秘密基地', '第四章　十三番目の駅', '第五章　指令'];
      if (s.ended) return { pct: 100, label: '148D、灘浜着', cleared: true };
      const st = s.archive ? 5 : s.tsuki ? 4 : s.lab ? 3 : s.old ? 2 : s.diary ? 1 : 0;
      return { pct: Math.round((st / 6) * 100), label: chapters[st], cleared: false };
    },
    spoilers: [
      '日記の鍵：148D（霞野から灘浜へ向かう上り最終列車）',
      'スタンプの隠し文字：ユウナギ（無人駅のスタンプは写真館・保存車両の車内・掲示板）',
      '旧HPの研究室：トップを開き直してカウンターを10000にする',
      '幻の駅：時速40kmで2分＝約1.3km。霞沢11.6kmから引いて、路線図の10.3km地点',
      '信号のモールス：カエリミチ。資料室のIDは K-0731',
      '端末：SET ツミ 2308 2309 → SWITCH 21 R → SWITCH 22 N → SIGNAL'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="ka-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1CFA2"/><stop offset="1" stop-color="#F6E9D0"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#ka-f)"/><circle cx="318" cy="70" r="24" fill="#EFA96E" opacity=".8"/><path d="M0 150C60 126 120 140 170 122S270 104 320 124S380 116 400 110V250H0Z" fill="#CDB791"/>'
        + '<rect y="200" width="400" height="50" fill="#A9BDBF"/><rect y="186" width="400" height="6" fill="#4E4034"/>'
        + Array.from({ length: 10 }, (_, i) => `<path d="M${i * 40} 192l20 10l20-10" stroke="#4E4034" stroke-width="3" fill="none"/>`).join('')
        + '<g transform="translate(150 146)"><rect width="120" height="34" rx="5" fill="#EFE3C8"/><rect y="21" width="120" height="13" fill="#C9502B"/><rect y="-5" width="120" height="6" rx="3" fill="#8D8A84"/>'
        + [8, 30, 52, 74, 96].map(x => `<rect x="${x}" y="6" width="15" height="11" rx="2" fill="#56626B"/>`).join('') + '</g>'
        + '<rect x="24" y="24" width="206" height="54" fill="#fff" stroke="#2B2622" stroke-width="3"/><text x="127" y="62" text-anchor="middle" font-family="\'Dela Gothic One\', sans-serif" font-size="26" fill="#2B2622" letter-spacing="3">灘浜<tspan fill="#C9502B" font-size="18"> ⇔ </tspan>霞野</text>'
        + '<text x="26" y="100" font-size="12" fill="#6E645A" letter-spacing="2">北灘鉄道 霞野線　1931–1987</text></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#0E111C"/>'
        + '<g fill="#C9D3EE" opacity=".08"><rect y="70" width="400" height="26" rx="13"/><rect x="40" y="150" width="360" height="20" rx="10"/><rect x="-30" y="200" width="300" height="16" rx="8"/></g>'
        + '<rect x="96" y="60" width="208" height="92" fill="#E8ECF6"/><rect x="96" y="128" width="208" height="24" fill="#3B4F80"/>'
        + '<text x="200" y="80" text-anchor="middle" font-size="11" letter-spacing="6" fill="#10131F">つきみの</text><text x="200" y="118" text-anchor="middle" font-family="\'Dela Gothic One\', sans-serif" font-size="36" letter-spacing="10" fill="#10131F">月見野</text>'
        + '<text x="106" y="145" font-size="11" fill="#E8ECF6">← しおいり</text><text x="294" y="145" text-anchor="end" font-size="11" fill="#E8ECF6">かすみさわ →</text>'
        + '<rect x="342" y="92" width="6" height="140" fill="#3A3A44"/><rect x="326" y="54" width="38" height="50" rx="8" fill="#1B1B22"/><circle cx="345" cy="72" r="22" fill="#FFD27A" opacity=".25"/><circle cx="345" cy="72" r="9" fill="#FFD27A"/>'
        + '<rect x="40" y="176" width="26" height="54" fill="#F4F0E6"/><text x="53" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="#2E2720">10</text><text x="53" y="216" text-anchor="middle" font-size="11" font-weight="700" fill="#2E2720">.3</text>'
        + '<text x="200" y="232" text-anchor="middle" font-size="12" fill="#8E96B0" letter-spacing="2">23:08 のまま、時計が動かない。</text></svg>'
    }
  },
  {
    id: 'nemure',
    images: { back: 'img/back-nemure.jpg' },
    path: 'works/nemure/index.html',
    title: 'NEMURE',
    place: '夢の中でしか会えない、アイドルの番組',
    added: '2026-09-19',
    genre: ['ホラー', 'アイドル', '夢'],
    minutes: 10,
    difficulty: 1,
    accent: '#7E6AD0',
    catch: '「夢の中でしか会えない」4人組バーチャルアイドルの公式サイト。……メンバーは、本当に4人？',
    features: ['隠しテキスト', 'ファンレター', '関係者ログイン', '終わりかたが2つ'],
    storageKey: 'nemure.v1',
    progress(s) {
      const n = (s.frags || []).length;
      if (s.ending) return { pct: 100, label: `終わり「${s.ending === 'awake' ? 'おはよう' : 'おやすみ'}」`, cleared: true };
      if (s.restored) return { pct: 90, label: '？？？', cleared: false };
      if (s.unlocked) return { pct: 70, label: '管理画面に侵入', cleared: false };
      return { pct: n * 12, label: n ? `夢の欠片 ${n}/5` : 'はじめたばかり', cleared: false };
    },
    spoilers: [
      '欠片Ⅰ 月：おやすみモード（月のボタン）にして、ABOUTに出る一文を押す',
      '欠片Ⅱ 羊：別のタブに移って戻る（または45秒なにもしない）',
      '欠片Ⅲ 枕：お知らせ「一部配信における不具合」の空白をドラッグで選択',
      '欠片Ⅳ 鍵：MEMBERの5つ目の空席（点滅する丸）',
      '欠片Ⅴ 鈴：ファンレターに「澪」「みお」と書いて送る',
      'ログイン：月 → 羊 → 枕 → 鍵 → 鈴（フッターの小さな staff から）'
    ],
    cover: {
      front: '<svg viewBox="0 0 400 250" aria-hidden="true"><defs><linearGradient id="ne-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17122B"/><stop offset=".6" stop-color="#2C2254"/><stop offset="1" stop-color="#5A4A8C"/></linearGradient></defs>'
        + '<rect width="400" height="250" fill="url(#ne-f)"/>' + Array.from({ length: 36 }, (_, i) => `<circle cx="${(i * 67) % 400}" cy="${(i * 37) % 150}" r="${i % 4 ? 0.9 : 1.6}" fill="#F4EEFF" opacity=".8"/>`).join('')
        + '<text x="200" y="86" text-anchor="middle" font-family="Didot, \'Bodoni 72\', \'Times New Roman\', serif" font-size="50" letter-spacing="12" fill="#F4F1F8">NEMURE</text>'
        + '<text x="200" y="112" text-anchor="middle" font-size="12" letter-spacing="3" fill="#D9D0FF">眠れない夜は、わたしたちが迎えにいく。</text>'
        + [['#8F7BD8', '#DCD3FF', 110], ['#E58FB0', '#FFE0EA', 170], ['#5FB3AC', '#D5F5F1', 230], ['#D29A45', '#FFEFD2', 290]].map(([c, g, x], i) => `<defs><radialGradient id="ne-p${i}" cx="50%" cy="38%" r="62%"><stop offset="0" stop-color="${g}"/><stop offset="1" stop-color="${c}"/></radialGradient><clipPath id="ne-c${i}"><circle cx="${x}" cy="176" r="25"/></clipPath></defs><circle cx="${x}" cy="176" r="25" fill="url(#ne-p${i})"/><g clip-path="url(#ne-c${i})" fill="#221A38"><circle cx="${x}" cy="175" r="11"/><path d="M${x - 20} 206c2-12 10-15 20-15s18 3 20 15z"/></g><circle cx="${x - 4}" cy="176" r="1.8" fill="#FBF7FF"/><circle cx="${x + 4}" cy="176" r="1.8" fill="#FBF7FF"/>`).join('')
        + '<path d="M0 232Q200 206 400 232V250H0Z" fill="#F4F1F8"/></svg>',
      back: '<svg viewBox="0 0 400 250" aria-hidden="true"><rect width="400" height="250" fill="#050407"/>'
        + Array.from({ length: 9 }, (_, i) => `<path d="M0 ${30 + i * 26}q50-10 100 0t100 0t100 0t100 0" stroke="#6F86B8" stroke-opacity=".12" fill="none"/>`).join('')
        + '<g transform="translate(200 108)"><path d="M-110 0q55-44 110 0q-55 44-110 0z" fill="#EDE6FF"/><circle cx="-55" cy="0" r="16" fill="#6F86B8"/><circle cx="-55" cy="0" r="6" fill="#050407"/>'
        + '<path d="M0 0q55-44 110 0q-55 44-110 0z" transform="translate(0 0)" fill="#EDE6FF"/><circle cx="55" cy="0" r="16" fill="#6F86B8"/><circle cx="55" cy="0" r="6" fill="#050407"/></g>'
        + '<text x="200" y="186" text-anchor="middle" font-size="15" letter-spacing="4" fill="#D6DDF2">5人目は、まだそこにいる。</text>'
        + '<text x="200" y="214" text-anchor="middle" font-size="11" letter-spacing="3" fill="#6F86B8">水底 ■ ／ このメンバーは存在しません</text></svg>'
    }
  }
];
