/* =========================================================
   ヤドカリと七つの灯台 — 島・色・ことば
   ========================================================= */
window.YK = (() => {
  'use strict';
  const base = {
    foam: '#ffffff',
    bed: { top: '#c3b58c', front: '#a0926a' },
    sand: { top: '#f0dcb0', front: '#d0ad78', lip: '#f8ebcc', strata: 'rgba(150,105,55,.22)', dots: 'rgba(170,125,75,.32)', dots2: 'rgba(255,255,255,.45)', n: 6 },
    rock: { top: '#a9b3b5', front: '#7c878c', lip: '#c6cdcf', strata: 'rgba(50,60,70,.22)', dots: 'rgba(85,95,105,.3)', dots2: 'rgba(230,235,236,.4)', dw: 0.1, dh: 0.08, n: 4 },
    high: { top: '#98c96c', front: '#8b7b63', lip: '#b8e08e', strata: 'rgba(60,45,30,.28)', grass: '#6aa24a', dots: 'rgba(255,255,255,.22)', dots2: 'rgba(80,130,60,.3)', n: 3 },
    cliff: { top: '#6e6962', front: '#57524c', lip: '#8a847b', strata: 'rgba(0,0,0,.25)', dots: 'rgba(0,0,0,.18)', n: 3 },
    fill1: { top: '#d7c7a2', front: '#b19e78', lip: '#e6d8b8', dots: 'rgba(105,105,105,.55)', dots2: 'rgba(165,165,165,.55)', n: 9, dw: 0.08, dh: 0.07, strata: 'rgba(90,80,60,.2)' },
    fill2: { top: '#b3b8b6', front: '#8a8f8e', lip: '#cdd1cf', dots: 'rgba(80,85,85,.5)', dots2: 'rgba(210,214,212,.6)', n: 9, dw: 0.08, dh: 0.07, strata: 'rgba(40,45,45,.22)' },
  };
  const pal = (o) => ({ ...base, ...o });
  const PALS = {
    asa: pal({ deep: '#4aa8bd', deep2: '#bfe4e6', water: '#35a9c0' }),
    hiru: pal({ deep: '#2f9cc0', deep2: '#9fdcef', water: '#2ba3c8' }),
    gogo: pal({ deep: '#3a93b0', deep2: '#bfe0da', water: '#2f9fbd', tint: '#fff3dc' }),
    yugata: pal({ deep: '#5a7fa8', deep2: '#f2b79a', water: '#4f8fb5', tint: '#ffd9bf' }),
    yoi: pal({ deep: '#3a4f8c', deep2: '#8d7fb3', water: '#4574a8', tint: '#dcd6f2', night: true }),
    yoru: pal({ deep: '#142a5c', deep2: '#23325f', water: '#2d5c97', tint: '#b3bbe8', night: true }),
    hoshi: pal({ deep: '#1b1d52', deep2: '#2a2350', water: '#3f4aa0', tint: '#b9b2e6', night: true }),
  };

  const ISLES = [
    { n: 1, name: 'はじまりの岬', time: 'asa', ja: '朝', sky: '#bfe4e6' },
    { n: 2, name: 'しおみ浜', time: 'hiru', ja: '昼まえ', sky: '#9fdcef' },
    { n: 3, name: '流木の入り江', time: 'hiru', ja: '昼', sky: '#9fdcef' },
    { n: 4, name: 'うず潮の瀬戸', time: 'gogo', ja: '昼すぎ', sky: '#bfe0da' },
    { n: 5, name: '貝がらの磯', time: 'yugata', ja: '夕方', sky: '#f2b79a' },
    { n: 6, name: '月かげの岩礁', time: 'yoi', ja: '日ぐれ', sky: '#8d7fb3' },
    { n: 7, name: 'ともしび島', time: 'yoru', ja: '夜', sky: '#23325f' },
    { n: 8, name: '星砂の島', time: 'hoshi', ja: '真夜中', sky: '#2a2350', secret: true },
  ];

  // はじめて出てくる仕組みのひとこと
  const TIPS = {
    walk: '歩く：矢印キー／画面をなぞる。段差は一段まで。',
    stone: '石を押して海に落とすと、うまって足場になる。',
    climb: '押しても動かない石や箱には、のぼれる。',
    conch: 'ほら貝をふくと、潮が満ちる。もう一度ふくと、引く。',
    crate: '流木の箱は、水に浮く。浮いた箱には乗れる。',
    lift: '満ち潮になると、浮いた箱ごと一段高くなる。',
    rockfill: '満ち潮の砂に石を落とすと、岩になる。',
    flow: '潮の流れにのった箱は、流されていく。',
    plate: '貝の板を押さえると、杭が沈む。水の重さでも押さえられる。',
    two: '灯りが二つある島もある。',
    undo: 'まちがえたら「もどす」。何度でもやり直せる。',
  };

  const GULL = [
    'カモメが片目をあけた。',
    'カモメが、指さす先を見ている。',
    'カモメが、はじめから歩いてみせてくれる。',
  ];

  return { PALS, ISLES, TIPS, GULL, HINT_MIN: [2, 5, 8] };
})();
