/* =========================================================
   ツブのとっておき — たからものの絵（格子）
   [色表, 行]。'.' は透明。ふちどりは自動でつく
   ========================================================= */
(function (G) {
  'use strict';
  const I = G.TI.ICON;
  const d = (id, pal, rows) => (I[id] = [pal, rows]);

  /* ---------- あかちゃん ---------- */
  d('hane', 'a:#ffffff b:#dfe6f0 c:#b9c6d8 k:#8a95a8', [
    '..........aa',
    '........aaab',
    '.......aaabb',
    '......aaabb.',
    '.....aaakb..',
    '....aaakbb..',
    '...aaakbb...',
    '...aakbb....',
    '..aakbb.....',
    '..akbb......',
    '..kb........',
    '.k..........',
    'k...........']);
  d('tanpopo', 'a:#ffffff b:#e6e9ef c:#c8d1dd g:#7fb35a h:#5f9a45', [
    '....a.a.a...',
    '..a.aaaaa.a.',
    '...aabbbaa..',
    '.aaabcccbaaa',
    '...aabcbaa..',
    '..a.abbba.a.',
    '....a.g.a...',
    '......g.....',
    '......g.....',
    '.....hg.....',
    '......g.....',
    '......gh....',
    '......g.....']);
  d('fusen', 'a:#e8574a b:#c23b35 c:#ff9a8a k:#8a6a5a', [
    '...aaaa...',
    '..acaaaa..',
    '.acaabaaa.',
    '.aaabaaba.',
    '.aabaaaaa.',
    '..aaabaa..',
    '...aaaa...',
    '....bb....',
    '.....k....',
    '....k.....',
    '.....k....',
    '......k...',
    '.....k....']);
  d('donguri', 'a:#b8763f b:#8f5528 c:#d9a060 d:#6b4a2e e:#9a7a4e k:#4a3020', [
    '.....k....',
    '....dk....',
    '..ddeddd..',
    '.deedeedd.',
    '.dddddddd.',
    '..aaaaaa..',
    '..acaaaab.',
    '..acaaaab.',
    '..aaaaaab.',
    '...aaaab..',
    '....aab...',
    '.....b....']);
  d('momiji', 'a:#e8573a b:#c23a25 c:#ff8a5a k:#8a4a2a', [
    '......a......',
    '.....aca.....',
    '..a..aca..a..',
    '..aa.aca.aa..',
    '...aaacaaa...',
    'aa..aacaa..aa',
    '.aaaaacaaaaa.',
    '..aaabcbaaa..',
    '...aab.baa...',
    '....a.k.a....',
    '......k......',
    '......k......']);
  d('matsubokkuri', 'a:#a8703f b:#7e5230 c:#c98f5a k:#5a3a22', [
    '.....k.....',
    '....bab....',
    '...acbca...',
    '..bacbcab..',
    '..cbacabc..',
    '..bacbcab..',
    '..cbacabc..',
    '...bacab...',
    '...cbabc...',
    '....bab....',
    '.....b.....']);
  d('ball', 'a:#e8574a b:#c23b35 w:#ffffff d:#ffd65a', [
    '....aaaa....',
    '..aaaaaaaa..',
    '.aawwaaaaaa.',
    '.awwaaaaaaab',
    'aaaaaaaaaaab',
    'dddddddddddd',
    'dddddddddddd',
    'aaaaaaaaaaab',
    '.aaaaaaaaabb',
    '.aaaaaaaabb.',
    '..aaaaabbb..',
    '....bbbb....']);
  d('kutsu', 'a:#f08a9a b:#d0647a w:#ffffff d:#ffe08a k:#8a4a5a', [
    '....aaaa....',
    '...awwwwa...',
    '..aawkkwa...',
    '..aakddka...',
    '.aaaaaaaaaa.',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaab',
    'wwwwwwwwwwww']);
  d('shovel', 'a:#5ea8d6 b:#3d7fb0 c:#9fd6f5 d:#ffd65a e:#e0a830', [
    '.........dd',
    '........dde',
    '.......dde.',
    '......dde..',
    '.....dde...',
    '...aaae....',
    '..acaa.....',
    '.acaaab....',
    '.aaaab.....',
    '.aaab......',
    '..bb.......']);
  d('bidama', 'a:#8fd0f2 b:#5ea8d6 c:#ffffff d:#3d7fb0 e:#7fe0c8', [
    '...aaaa...',
    '..acaaaa..',
    '.acceaaab.',
    '.aaeeaabb.',
    '.aaaeebbb.',
    '.aaabebbd.',
    '..abbbbd..',
    '...dddd...']);
  d('ehon', 'a:#f2c14e b:#d69d2f w:#fffaf0 c:#e8574a d:#8fd0f2', [
    'aaaaaaaaaaa.',
    'awwwwwwwwwab',
    'awwwddwwwwab',
    'awwdcddwwwab',
    'awwwddwwwwab',
    'awwwwwwwwwab',
    'awwwwwcwwwab',
    'awwwwcccwwab',
    'aaaaaaaaaaab',
    '.bbbbbbbbbbb']);
  d('tsumiki', 'a:#e8574a b:#c23b35 c:#5ea8d6 e:#3d7fb0 f:#f2c14e g:#d69d2f w:#ffffff', [
    '....ffff....',
    '....fwwf....',
    '....ffwg....',
    '....gggg....',
    '.aaaa..cccc.',
    '.awwa..cwwc.',
    '.aawb..ccwe.',
    '.aabb..ceee.',
    '.bbbb..eeee.']);
  d('suzu', 'a:#f2c14e b:#c9931f c:#fff0a0 d:#e8574a k:#6a4a20', [
    '....dd....',
    '...d..d...',
    '....aa....',
    '..aaaaaa..',
    '.acaaaaab.',
    '.caaaaaab.',
    '.aaaaaaab.',
    '.akkkkkab.',
    '.aaaakaab.',
    '..abbbbb..']);
  d('kureyon', 'a:#e8574a b:#c23b35 w:#fffaf0 c:#d9d2c0 k:#8a2a20', [
    '.........kk',
    '........aab',
    '.......aaab',
    '......wwab.',
    '.....wwcb..',
    '....aaab...',
    '...aaab....',
    '..wwcb.....',
    '.aaab......',
    'aaab.......',
    'bbb........']);
  d('rappa', 'a:#f2c14e b:#c9931f c:#fff0a0 d:#e8574a', [
    '..........a.',
    '.........aa.',
    'dd......aca.',
    'ddaaaaaaacaa',
    'ddbbbbbbacca',
    'dd......aaca',
    '.........aa.',
    '..........a.']);
  d('button', 'a:#c98f5a b:#a8703f c:#e2b384 k:#5a3a22', [
    '...aaaa...',
    '.aaccaaaa.',
    '.acaaaaab.',
    'aaakaakaab',
    'aaaaaaaabb',
    'aaakaakabb',
    '.aaaaaabb.',
    '.aabbbbbb.',
    '...bbbb...']);
  d('biscuit', 'a:#e2b06a b:#c98f4a c:#f2cf94 k:#8a5a2a', [
    '.aa....aa.',
    'aaaa..aaaa',
    'aacaaaaaaa',
    '.aakaakaa.',
    '.acaaaaaa.',
    '.aaakkaaa.',
    '..aaaaaa..',
    '...bbbb...']);
  d('nuigurumi', 'a:#fff4ea b:#e6d6c6 c:#ffb3c8 k:#3a2030', [
    '..aa..aa..',
    '..ac..ca..',
    '..ac..ca..',
    '..aa..aa..',
    '.aaaaaaaa.',
    '.akaaaaka.',
    '.aaacaaaa.',
    '..aaaaaa..',
    '.aabbbbaa.',
    '.aaaaaaaa.',
    '..bb..bb..']);
  d('hikari', 'a:#fff3c4 b:#e2c6ff c:#ffffff d:#b89cff', [
    '.....c.....',
    '....aca....',
    '...aaccb...',
    '..aaacbbb..',
    '.aaaacbbbd.',
    '..aacbbbd..',
    '...acbbd...',
    '....bbd....',
    '.....d.....']);

  /* ---------- こども ---------- */
  d('hikouki', 'a:#ffffff b:#dbe9f5 c:#a8c4dc', [
    'aa..........',
    '.aaaa.......',
    '..aaaaaa....',
    '...aaaaaaaa.',
    '....abbbbbbb',
    '...aabbcc...',
    '..aabcc.....',
    '.abcc.......',
    'ac..........']);
  d('kazaguruma', 'a:#e8574a b:#5ea8d6 c:#f2c14e e:#7fc47a k:#8a6a4a', [
    '...aa.......',
    '...aaa..bbb.',
    '....aa.bbb..',
    '.....akbb...',
    '..ccckee....',
    '.ccc..ee....',
    '..c...eee...',
    '......k.ee..',
    '......k.....',
    '......k.....',
    '......k.....',
    '......k.....']);
  d('kippu', 'a:#f7eed8 b:#e0d2b0 c:#5ea8d6 k:#6a5a4a d:#e8574a', [
    'aaaaaaaaaaaaaa',
    'accccccccccccb',
    'aaaaaaaaaaaaab',
    'akkakkkakkaaab',
    'aaaaaaaaaaaaab',
    'akkkkakkakdaab',
    'aaaaaaaaaaaaab',
    'bbbbbbbbbbbbbb']);
  d('ehagaki', 'a:#fffaf0 b:#e6dcc8 c:#8fd0f2 d:#7fc47a e:#f2c14e k:#8a7a6a r:#e8574a', [
    'aaaaaaaaaaaaaa',
    'accccccccccrra',
    'acccecccccarra',
    'accccccdccaaaa',
    'acccccdddccaka',
    'accccdddddcaka',
    'addddddddddaka',
    'aaaaaaaaaaaaab',
    'bbbbbbbbbbbbbb']);
  d('shabon', 'a:#c9e8ff b:#ffffff c:#ffb3de d:#f59ac8 k:#8a6a8a', [
    '......aa....',
    '.....abca...',
    '.....acba...',
    '......aa..a.',
    '.dd......aba',
    'd..d......a.',
    'd..d...aa...',
    '.dd...abca..',
    '..d...aaaa..',
    '...d........',
    '....d.......']);
  d('nukegara', 'a:#c98f5a b:#a8703f c:#e8c090 k:#6a4a2a', [
    '...kk.kk...',
    '..aaaaaaa..',
    '.aacaaacaa.',
    '.aaaaaaaaa.',
    'k.abbbbba.k',
    '.kaaaaaaak.',
    'k.abaaaba.k',
    '..aabbbaa..',
    '...aaaaa...',
    '....aaa....']);
  d('clover', 'a:#6fb46a b:#4d8f4f c:#9fd88a', [
    '..aa...aa..',
    '.acaa.acaa.',
    '.aaaa.aaaa.',
    '..aaabaaa..',
    '.....b.....',
    '..aaabaaa..',
    '.acaa.acaa.',
    '.aaaa.aaaa.',
    '..aa..baa..',
    '.......b...',
    '........b..']);
  d('katatsumuri', 'a:#e2b06a b:#b8804a c:#f2d094 k:#8a5a30', [
    '....aaaa....',
    '..aabbbbaa..',
    '.abbaaaabba.',
    'abaacccaaba.',
    'abacbbbcaba.',
    'abacbkbcaba.',
    'abaccbccaba.',
    '.abaaaaabba.',
    '..abbbbbaaa.',
    '...aaaaa.aaa']);
  d('tamago', 'a:#a8dcef b:#7fc0dc c:#d8f2fb w:#ffffff', [
    '.a.......a.',
    '.aa.a..aaa.',
    '.aaaaaaaaab',
    '.acaaaaaaab',
    '.caaaaaaabb',
    '.caaaaaaabb',
    '.aaaaaaaabb',
    '..aaaaaabb.',
    '...bbbbbb..']);
  d('asagao', 'a:#fffaf0 b:#e6dcc8 c:#5b79d6 d:#8fa8ff w:#ffffff e:#7fc47a k:#3a3040', [
    'aaaaaaaaaa',
    'abbbbbbbba',
    'aaaccccaaa',
    'aacdddccaa',
    'aacdwdcaaa',
    'aaccdccaaa',
    'aaaaeeaaaa',
    'aakkakkaaa',
    'aaaaaaaaab',
    'bbbbbbbbbb']);
  d('bansoko', 'a:#f2c9a0 b:#d9a878 c:#fbe3c8 d:#e8b890 k:#c9906a', [
    '.........aa.',
    '........aaaa',
    '.......aakaa',
    '......aakca.',
    '.....accda..',
    '....acdda...',
    '...addca....',
    '..aakca.....',
    '.aakaa......',
    'aaaa........',
    '.aa.........']);
  d('medal', 'a:#f2c14e b:#c9931f c:#fff0a0 r:#e8574a s:#5ea8d6 k:#8a6a20', [
    '.rr...ss.',
    '.rrr.sss.',
    '..rrsss..',
    '...rss...',
    '...aaa...',
    '..acaab..',
    '.accaaab.',
    '.acakaab.',
    '.aaakaab.',
    '..aaaab..',
    '...bbb...']);
  d('nawatobi', 'a:#e8574a c:#f2c14e d:#c9931f', [
    '.cc......cc.',
    '.cd......cd.',
    '.cd......cd.',
    '..a......a..',
    '..a......a..',
    '..a......a..',
    '...a....a...',
    '....aaaa....']);
  d('bou', 'a:#b8804a b:#8a5a2a c:#d9a86a g:#7fc47a', [
    '............gg',
    '...........ag.',
    '..........ab..',
    '.........ab...',
    '........cab...',
    '.......abb....',
    '......ab.a....',
    '.....ab..a....',
    '....ab........',
    '...ab.........',
    '..ab..........',
    '.ab...........',
    'ab............']);
  d('pikaishi', 'a:#b8c4d8 b:#8a96ac c:#ffffff d:#dde6f2', [
    '...aaaa...',
    '..adcaaa..',
    '.adccaaab.',
    '.aaddaaab.',
    '.aaaaaabb.',
    '..aaaabb..',
    '...bbbb...']);
  d('mushimegane', 'a:#c9d8e8 b:#8fb0cc c:#ffffff e:#6a4a2a f:#f2c14e', [
    '..ffff....',
    '.faaaaf...',
    'faccaaaf..',
    'facaaabf..',
    'faaaaabf..',
    'faaaabbf..',
    '.fabbbf...',
    '..ffffe...',
    '.......e..',
    '........e.',
    '.........e']);
  d('hoshiseal', 'a:#e8f2a8 b:#c8d880 c:#ffffff', [
    '.....a.....',
    '....aca....',
    '....aaa....',
    'aaaaaaaaaaa',
    '.aaaacaaab.',
    '..aaaaaab..',
    '..aaabaab..',
    '.aaab.baab.',
    '.aab...bab.',
    '.a.......b.']);
  d('ammonite', 'a:#d8c8a8 b:#b0a080 c:#ece2cc k:#8a7a5a', [
    '...aaaaa...',
    '..aakkkaa..',
    '.akaaaaaka.',
    '.akakkkaka.',
    '.akakaakka.',
    '.akakkaaka.',
    '.aakaaaaka.',
    '..aakkkka..',
    '...aaaaa...']);
  d('jishaku', 'a:#e8574a b:#c23b35 w:#e6e9ef k:#9aa0ac', [
    '.aaaaaaa.',
    'aaaaaaaaa',
    'aab...aab',
    'aab...aab',
    'aab...aab',
    'aab...aab',
    'www...www',
    'kkk...kkk']);
  d('card', 'a:#8fd0f2 b:#5ea8d6 w:#fffaf0 k:#3a4a6a', [
    'aaaaaaaaaaaaa',
    'awwwwwwwwwwwb',
    'awkkkkkwwwwwb',
    'awwwwwwwwwwwb',
    'awkkwkkkwkkwb',
    'awwwwwwwwwwwb',
    'awkkkwkkwwwwb',
    'bbbbbbbbbbbbb']);
  d('nigaoe', 'a:#fffaf0 b:#e6dcc8 c:#e8574a d:#5ea8d6 e:#3a2030 f:#f2c14e', [
    'aaaaaaaaaaaa',
    'aaaaeeeeaaaa',
    'aaaeffffeaaa',
    'aaeaeaaeaeaa',
    'aaeaaaaaaeaa',
    'aaeaacccaeaa',
    'aaaeaaaaeaaa',
    'aaaaeeeeaaaa',
    'aaaddddddaaa',
    'aaddddddddaa',
    'bbbbbbbbbbbb']);
  d('harmonica', 'a:#d8dde6 b:#9aa3b0 c:#ffffff k:#3a3a4a', [
    'aaaaaaaaaaaaa',
    'accccccccccca',
    'akakakakakaka',
    'aaaaaaaaaaaab',
    'bbbbbbbbbbbbb']);
  d('tsuru', 'a:#f59ac8 b:#d9719f c:#ffc4e0', [
    '......a.......',
    '.....aa.......',
    '....aaa.......',
    'a..acab......a',
    'aa.aabbb....aa',
    '.aaacabbbbaaa.',
    '..aaaabbbbaa..',
    '....aaabbb....',
    '.....aabb.....']);
  d('ribbon', 'a:#8e5cd9 b:#6a3ab0 c:#b89cff', [
    'aa.......aa',
    'acaa...aaba',
    'acaaa.aaaba',
    'accaaaaaaba',
    'acaabbbaaba',
    'aaaa.b.aaaa',
    '....aba....',
    '...aa.aa...',
    '..aa...aa..']);
  d('castanet', 'a:#e8574a b:#c23b35 c:#5ea8d6 e:#3d7fb0 k:#f2c14e', [
    '....kk.....',
    '...k..k....',
    '..aaaaaaa..',
    '.aacaaaaab.',
    '.aaaaaaaab.',
    '.cccccccce.',
    '.cccccccee.',
    '..eeeeeee..']);
  d('cookie', 'a:#e2b06a b:#c98f4a c:#f2cf94 k:#6a3a1a', [
    '...aaaaa...',
    '..acaakaa..',
    '.accaaaaab.',
    '.aakaaakab.',
    '.aaaaaaaab.',
    '.akaaakaab.',
    '..aaaaaab..',
    '...bbbbb...']);
  d('otedama', 'a:#e8574a b:#c23b35 c:#ff9a8a e:#f2c14e', [
    '....aa.....',
    '...aaaa....',
    '..aceaaa...',
    '.acaaaeaa..',
    '.aaaeaaaab.',
    '..aaaaaab..',
    '...bbbbb...']);
  d('tegami', 'a:#fffaf0 b:#e6dcc8 c:#c9b89a r:#f59ac8', [
    'aaaaaaaaaaaa',
    'acaaaaaaaaca',
    'aacaaaaaacaa',
    'aaacarracaaa',
    'aaaarrrraaaa',
    'aaaaarraaaaa',
    'aaaaaaaaaaab',
    'bbbbbbbbbbbb']);
  d('keito', 'a:#f59ac8 b:#d9719f c:#ffc4e0 k:#d9b35a', [
    '.k.........',
    '..k.aaaa...',
    '...kcaaaa..',
    '..acakbaab.',
    '.aaacbkaab.',
    '.abaaacbab.',
    '.aabaaacab.',
    '..abbaaab..',
    '...bbbb.aa.',
    '.........a.']);
  d('kanmuri', 'a:#ffffff b:#e6e9ef g:#7fc47a h:#4d8f4f p:#ffe08a', [
    '...aa.aa.aa...',
    '..apgaapgapa..',
    '.agg......gga.',
    '.aa........aa.',
    '.ga........ag.',
    '..aa......aa..',
    '...agaagaaga..',
    '....aa.aa.a...']);
  d('kuroneko', 'a:#2a2238 c:#4a3a68 d:#f2c14e e:#c9931f r:#e8574a', [
    '.a......a.',
    '.aa....aa.',
    '.aaaaaaaa.',
    '.adaaaada.',
    '.aaaacaaa.',
    '..aaaaaa..',
    '..rrrrrr..',
    '....dd....',
    '...deed...',
    '....ee....']);
  d('hotaru', 'a:#c9e8ff n:#2a3a5a c:#fff9a8 d:#b8a070 k:#8a7a50', [
    '...dddd...',
    '...kkkk...',
    '..aaaaaa..',
    '.aannnnaa.',
    '.anncnnna.',
    '.annnncna.',
    '.ancnnnna.',
    '.annncnna.',
    '.aannnnaa.',
    '..aaaaaa..']);

  /* ---------- しょうじょ ---------- */
  d('chizu', 'a:#f7eed8 b:#e0d2b0 c:#8fd0f2 d:#7fc47a r:#e8574a', [
    'aaaabaaaabaaaa',
    'acccbcdcbccdca',
    'accdbdddbcccca',
    'acddbccdbccrca',
    'acccbccdbdccca',
    'acccbcccbddcca',
    'aaaabaaaabaaab',
    'bbbbbbbbbbbbbb']);
  d('coin', 'a:#d8b86a b:#b0904a c:#f2dca0 k:#8a6a2a', [
    '...aaaaa...',
    '..acccaab..',
    '.acaakaaab.',
    '.acakkkaab.',
    '.aaaakaaab.',
    '.aaakakaab.',
    '..aaaaabb..',
    '...bbbbb...']);
  d('tsubame', 'a:#2f3b7a b:#222b5c c:#5563b8 w:#ffffff', [
    '..........aa',
    '........aaab',
    '.......acab.',
    '......acab..',
    '.....acab...',
    '....acab....',
    '...acab.....',
    '..acab......',
    '..wab.......',
    '.ww.........',
    'w...........']);
  d('photo', 'w:#ffffff b:#e6e9ef c:#8fd0f2 e:#b9e2f7 k:#5a6a7a', [
    'wwwwwwwwwwwww',
    'wcccccccccccw',
    'wcceccccceccw',
    'wccccckcccccw',
    'wcckkkkkkkccw',
    'wccccckcccccw',
    'weccccccceccw',
    'wwwwwwwwwwwww',
    'bbbbbbbbbbbbb']);
  d('tako', 'a:#e8574a b:#f2c14e c:#5ea8d6 k:#8a6a4a r:#e8574a', [
    '.....a.....',
    '....aab....',
    '...aaabb...',
    '..aaaabbb..',
    '.ccckkkbbb.',
    '..ccccbbb..',
    '...cccbb...',
    '....ccb....',
    '.....k.....',
    '......k....',
    '.....rkr...',
    '......k....',
    '.....rkr...']);
  d('oshibana', 'a:#fffaf0 b:#e6dcc8 p:#f59ac8 q:#ffc4e0 g:#7fc47a y:#f2c14e', [
    'aaaaaaaaaa',
    'aaappaaaaa',
    'aapqqpaaaa',
    'aapqypaaaa',
    'aaappgaaaa',
    'aaaaagaaaa',
    'aaaaagaaaa',
    'aaaagaaaaa',
    'aaaaaaaaab',
    'bbbbbbbbbb']);
  d('mushikago', 'a:#7fc47a b:#4d8f4f c:#c9f0b8 k:#f2c14e', [
    '....kkkk....',
    '...k....k...',
    '.aaaaaaaaaa.',
    '.acbcbcbcba.',
    '.acbcbcbcba.',
    '.acbcbcbcba.',
    '.acbcbcbcba.',
    '.aaaaaaaaaa.']);
  d('nae', 'g:#7fc47a h:#4d8f4f c:#9fd88a a:#c9754a b:#a55a38', [
    '...gg.gg...',
    '..gcg.gcg..',
    '...gghgg...',
    '.....h.....',
    '..aaaaaaa..',
    '..abbbbba..',
    '...aaaaa...',
    '...aaaaa...',
    '....aaa....']);
  d('zukan', 'a:#6fb46a b:#4d8f4f c:#fffaf0', [
    'aaaaaaaaab.',
    'aaaaaaaaabb',
    'aaaaccaaabb',
    'aaccaaccabb',
    'aaaccccaabb',
    'aaaccccaabb',
    'aaaaaaaaabb',
    'aaaaaaaaabb',
    'bbbbbbbbbb.']);
  d('tsuno', 'a:#e8dcc0 b:#c9b890 c:#fff6e0', [
    '.a......a.',
    '.a..a..aa.',
    '.aa.a.aa..',
    '..aaaaa...',
    '...aaa....',
    '....ab....',
    '....ab....',
    '....ab....',
    '...abb....']);
  d('baton', 'a:#e8574a b:#c23b35 w:#ffffff', [
    '..........aa',
    '.........aab',
    '........aab.',
    '.......wwb..',
    '......wwb...',
    '.....aab....',
    '....aab.....',
    '...wwb......',
    '..wwb.......',
    '.aab........',
    'aab.........',
    'bb..........']);
  d('hachimaki', 'w:#ffffff b:#e6e9ef r:#e8574a', [
    '..............ww',
    'wwwwwwwwwwwwwww.',
    'wwwwwwrrwwwwww..',
    'wwwwwrrrrwwwwww.',
    'bbbbbbrrbbbbbbw.',
    '..............ww']);
  d('shojo', 'a:#fffaf0 y:#f2c14e r:#e8574a k:#5a4a3a', [
    'yyyyyyyyyyyy',
    'yaaaaaaaaaay',
    'yaakkkkkkaay',
    'yaaaaaaaaaay',
    'yakkkakkkkay',
    'yakkkkakkkay',
    'yaaaaaaaarry',
    'yaaaaaaaarry',
    'yyyyyyyyyyyy']);
  d('supporter', 'a:#3a3a4a b:#2a2a38 c:#5a5a70 w:#ffffff', [
    '..aaaaaa..',
    '..acaaab..',
    '..acaaab..',
    '..awwwwb..',
    '..acaaab..',
    '..acaaab..',
    '..aaaaab..',
    '...bbbb...']);
  d('whistle', 'a:#c9d0da b:#9aa3b0 c:#ffffff r:#e8574a k:#6a707a', [
    'rr.........',
    'r.r........',
    '.r.aaaaaa..',
    '..aacccaaa.',
    'kaaaaaaaaab',
    'kaaaaaaaabb',
    '..aaaaaabb.',
    '...bbbbbb..']);
  d('seiza', 'a:#2f3b7a c:#fff6c9 e:#d9d2c0', [
    '..eeeeee..',
    '.eaaaaaae.',
    'eaacaaacae',
    'eaaacaaaae',
    'eacaaacaae',
    'eaaaacaaae',
    'eacaaaaaae',
    '.eaaaaaae.',
    '..eeeeee..']);
  d('test100', 'a:#fffaf0 b:#e6dcc8 r:#e8574a k:#8a8a9a', [
    'aaaaaaaaaaaaaa',
    'aaarrrrrrrrraa',
    'aararaaaaaaara',
    'arraarraarraar',
    'aararrarrarrar',
    'aararraararrar',
    'aararrarrarrar',
    'arrraarraarrar',
    'arraaaaaaaaara',
    'aaarrrrrrrrraa',
    'akkkkkakkkkaaa',
    'aaaaaaaaaaaaab',
    'bbbbbbbbbbbbbb']);
  d('megane', 'a:#5a4a6a c:#c9e8ff w:#ffffff', [
    '.aaaa...aaaa.',
    'aacwaa.aacwaa',
    'accccaaacccca',
    'aaccaa.aaccaa',
    '.aaaa...aaaa.']);
  d('furuhon', 'a:#8a4a3a b:#6a3428 y:#d9b35a w:#f2e6c8', [
    '.aaaaaaaaa.',
    'aayaaaaaaab',
    'aaaaaaaaaab',
    'aayyyyyaaab',
    'aaaaaaaaaab',
    'aaaaaaaaaab',
    'aayaaaaaaab',
    'aaaaaaaaaab',
    'wwwwwwwwwwb',
    '.bbbbbbbbb.']);
  d('denkyu', 'a:#fff3a0 b:#f2c14e w:#ffffff e:#c9d0da k:#8a909a r:#e8574a', [
    '...aaa....',
    '..awaaa...',
    '.awaaaab..',
    '.aaaaaab..',
    '..aaaab...',
    '...eee....',
    '...kkk....',
    '...eee....',
    '....r.....',
    '....r.r...',
    '.....rr...']);
  d('pick', 'a:#f59ac8 b:#d9719f c:#ffd0e8', [
    '.aaaaaaa.',
    'aacaaaaab',
    'acaaaaaab',
    'aaaaaaaab',
    '.aaaaaab.',
    '..aaaab..',
    '...aab...',
    '....b....']);
  d('sketch', 'a:#fffaf0 b:#e6dcc8 k:#8a8a9a c:#8fd0f2 e:#f59ac8 g:#7fc47a', [
    'k.k.k.k.k.k',
    'aaaaaaaaaaa',
    'aaccaaaaaaa',
    'acccaaeeaaa',
    'aaaaaeeeeaa',
    'agggaaeeaaa',
    'aaaaaaaaaab',
    'bbbbbbbbbbb']);
  d('hanken', 'a:#f59ac8 b:#d9719f w:#fffaf0 k:#6a3a5a', [
    'aaaaaaa.aaaa',
    'awwwwwa.awwa',
    'awkkkwa.akwa',
    'awwwwwa.awwa',
    'awkkwwa.awwa',
    'aaaaaaa.aaab',
    'bbbbbbb.bbbb']);
  d('headphone', 'a:#3a3a4a c:#5a5a70 p:#f59ac8 q:#d9719f', [
    '...aaaaa...',
    '..aa...aa..',
    '.aa.....aa.',
    '.a.......a.',
    'pp.......pp',
    'ppq.....qpp',
    'ppq.....qpp',
    '.p.......p.']);
  d('enogu', 'a:#e6e9ef b:#b9c0cc c:#5b79d6 e:#3d5ab0 k:#8a909a', [
    '.........kk',
    '........kab',
    '.......aab.',
    '......aab..',
    '.....ccb...',
    '....cce....',
    '...aab.....',
    '..aab......',
    '.aab.......',
    'aab........',
    'cc.........']);
  d('recipe', 'a:#fff4dc b:#ead6b0 k:#8a6a4a r:#e0674a', [
    'aaaaaaaaaaa',
    'arrrrrrrrra',
    'aaaaaaaaaaa',
    'akkkaakkkka',
    'aaaaaaaaaaa',
    'akkakkkkaaa',
    'aaaaaaaaaaa',
    'akkkkakkaaa',
    'aaaaaaaaaab',
    'bbbbbbbbbbb']);
  d('muffler', 'a:#f2c14e b:#d69d2f c:#e8574a k:#c9b8a0', [
    '.k.......k',
    '..k.....k.',
    '...aaaaaa.',
    '...acacac.',
    '...aaaaaa.',
    '...acacac.',
    '...aaaaaa.',
    '...acacac.',
    '...aaaaab.',
    '...a.a.a..']);
  d('bento', 'a:#e8574a b:#c23b35 w:#fffaf0 c:#ff9a8a', [
    '....aa.aa....',
    '.....aaa.....',
    '.aaaaaaaaaaa.',
    '.acawawawaca.',
    '.aaaaaaaaaaa.',
    '.aawawawawaa.',
    '.aaaaaaaaaab.',
    '.bbbbbbbbbbb.']);
  d('cup', 'a:#ffffff b:#e0dde8 c:#8fd0f2 e:#5ea8d6', [
    '.aaaaa.a...',
    'aaaaaaaaa..',
    'acccccca.aa',
    'aeeeeeea.ab',
    '.aaaaaaaab.',
    '..aaaaab...',
    '.bbbbbbbb..']);
  d('nakanaori', 'a:#ffe0ee b:#f59ac8 c:#fff0f6', [
    '..aa..aa..',
    '.aaaaaaaa.',
    'aacaaaaaab',
    'acaaabaaab',
    'aaaaaaaaab',
    '.aaaaaaab.',
    '..aaaaab..',
    '...aaab...',
    '....ab....']);
  d('yoruhana', 'a:#e2c6ff b:#b89cff c:#fff6ff y:#fff0a8 g:#5f7a9a', [
    '....a.a....',
    '...acaca...',
    '.aa.aca.aa.',
    '.accayacca.',
    '..aayyyaa..',
    '.accayacca.',
    '.aa.aba.aa.',
    '...a.g.a...',
    '.....g.....',
    '....gg.....',
    '.....g.....']);
  d('kagi', 'a:#d9c27a b:#a8904a c:#fff0b8 v:#b89cff', [
    '..aaaa.......',
    '.acaaaa......',
    '.aa..aa......',
    '.aa.vaa......',
    '.aaaaaaaaaaab',
    '..aaaab..a.ab',
    '.........a.a.']);

  /* ---------- むすめ ---------- */
  d('goggle', 'a:#8a5a3c b:#6a4028 c:#9fe4ff e:#5ea8d6 w:#ffffff', [
    '.aaaaa..aaaaa.',
    'aacwceaaacwcea',
    'aacceeaaacceea',
    '.aaaaa..aaaaa.',
    'b............b']);
  d('guide', 'a:#5ea8d6 b:#3d7fb0 w:#fffaf0 y:#f2c14e r:#e8574a g:#7fc47a', [
    '.y..r..g...',
    '.yy.rr.gg..',
    'aaaaaaaaaa.',
    'awwwwwwwwab',
    'aaaaaaaaaab',
    'aawwwwwaaab',
    'aaaaaaaaaab',
    'aaaaaaaaaab',
    'bbbbbbbbbb.']);
  d('mokei', 'a:#e6e9ef b:#b9c0cc r:#e8574a', [
    '......a......',
    '......a......',
    '.....aaa.....',
    'aaaaaaaaaaaaa',
    '.bbbbaaabbbb.',
    '.....aaa.....',
    '......a......',
    '....raaar....',
    '......a......']);
  d('kubiwa', 'a:#e8574a b:#c23b35 y:#f2c14e z:#c9931f', [
    '...aaaaa...',
    '.aa.....aa.',
    'a.........a',
    'a.........a',
    '.aa.....aa.',
    '...aabaa...',
    '....yzy....',
    '.....z.....']);
  d('nagagutsu', 'a:#f2c14e b:#d69d2f c:#fff0a0', [
    '..aaaa....',
    '..acaa....',
    '..acab....',
    '..acab....',
    '..aaab....',
    '..aaab....',
    '..aaaaaaa.',
    '..aaaaaaab',
    '..bbbbbbbb']);
  d('shokubutsu', 'a:#6fb46a b:#4d8f4f c:#fffaf0 g:#3f7a3a', [
    '.c.c.c.....',
    'aaaaaaaaaa.',
    'aagggaaaaab',
    'aagagaaaaab',
    'aaggaaaaaab',
    'aaaagaaaaab',
    'aaaaaaaaaab',
    'aaaaaaaaaab',
    'bbbbbbbbbb.']);
  d('rope', 'a:#f28a3a b:#c9661f c:#ffc080 k:#8a909a', [
    '...aaaaa...',
    '..abbbbba..',
    '.aba...aba.',
    '.aba.k.aba.',
    '.aba...aba.',
    '..abbbbba..',
    '...aaaaa...',
    '.......kk..',
    '........k..']);
  d('shuryo', 'a:#fffaf0 b:#e6dcc8 r:#e8574a k:#6a5a4a y:#f2c14e', [
    'aaaaaaaaaaaa',
    'aaaaarraaaaa',
    'aaaarrrraaaa',
    'aaaaarraaaaa',
    'aaaaaaaaaaaa',
    'akkkkkkkkkka',
    'aaaaaaaaaaaa',
    'akkkkkkaayya',
    'aaaaaaaaayyb',
    'bbbbbbbbbbbb']);
  d('sneaker', 'a:#ffffff b:#d8dde6 r:#e8574a k:#6a707a g:#9a9aa6', [
    '....aaaa....',
    '...arraa....',
    '..aarkkaa...',
    '.aaarrraaa..',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaab',
    'gggggggggggg']);
  d('lens', 'a:#3a3a4a c:#8fd0f2 e:#5ea8d6 w:#ffffff', [
    '...aaaaa...',
    '..aacccaa..',
    '.aacwcccaa.',
    '.accccccea.',
    '.accccceea.',
    '.aacccceaa.',
    '..aaeeaaa..',
    '...aaaaa...']);
  d('keisan', 'a:#fffaf0 b:#e6dcc8 k:#4552b8 c:#8a8a9a', [
    'caaaaaaaaaa',
    'aakkkakkkaa',
    'caaaaaaaaaa',
    'aakakkkkaka',
    'caaaaaaaaaa',
    'aakkkkaakka',
    'caaaaaaaaab',
    'bbbbbbbbbbb']);
  d('pamph', 'a:#2f3b7a b:#222b5c w:#fffaf0 y:#f2c14e', [
    'aaaaaaaaaa',
    'aaayyyaaaa',
    'aayaaayaaa',
    'aaayyyaaaa',
    'aaaaaaaaaa',
    'awwwwwwwwa',
    'awwwwwwwwa',
    'aaaaaaaaab',
    'bbbbbbbbbb']);
  d('ticket', 'a:#8e5cd9 b:#6a3ab0 w:#fffaf0 y:#f2c14e k:#3a2a4a', [
    'aaaaaaaa.aaa',
    'awyywwwa.aya',
    'awwwwwwa.aaa',
    'awkkkkwa.aya',
    'awwwwwwa.aaa',
    'aaaaaaab.aab',
    'bbbbbbbb.bbb']);
  d('kashi', 'a:#f59ac8 b:#d9719f w:#fffaf0 y:#fff0a8', [
    'aaaaaaaaab',
    'aaaayaaaab',
    'aaayyyaaab',
    'aaaayaaaab',
    'aaaaaaaaab',
    'aaaaaaaaab',
    'aaaaaaaaab',
    'wwwwwwwwwb',
    'bbbbbbbbbb']);
  d('fude', 'a:#b8804a b:#8a5a2a c:#d9d2c0 k:#3a3040 p:#f59ac8', [
    '..........aa',
    '.........aab',
    '........aab.',
    '.......aab..',
    '......aab...',
    '.....ccb....',
    '....ccb.....',
    '...kkb......',
    '..kkk.......',
    '.pkk........',
    'pp..........']);
  d('apron', 'a:#fff4dc b:#ead6b0 c:#e0674a k:#c9b89a', [
    '.kk....kk.',
    '..k....k..',
    '...aaaa...',
    '..aaaaaa..',
    'kkaaaaaakk',
    '..acccca..',
    '..aaaaaa..',
    '..abbbba..',
    '..aaaaaa..',
    '...bbbb...']);
  d('pan', 'a:#d9954a b:#b8702a c:#f2c07a k:#8a4a1a', [
    '...aaaaaa...',
    '..aaccaccaa.',
    '.aaccaccaaab',
    '.akaakaakaab',
    'aaaaaaaaaaab',
    'aaaaaaaaaabb',
    '.bbbbbbbbbb.']);
  d('shashin', 'a:#c98f5a b:#a8703f c:#8fd0f2 s:#ffe3cf h:#7a4a3a e:#3a2030 f:#f2c14e', [
    'aaaaaaaaaaaa',
    'acccccccccca',
    'acchhccffcca',
    'achsshffsfca',
    'acsesceseeca',
    'acsssccsssca',
    'achhhhffffca',
    'aaaaaaaaaaab',
    'bbbbbbbbbbbb']);
  d('hoshikakera', 'a:#fff3a0 b:#f2d060 c:#ffffff v:#e2c6ff', [
    'v....c....v',
    '....aca....',
    '...aacaa...',
    '.aaaaaaaaa.',
    '..aaacaab..',
    '...aaaab...',
    '..aab.bab..',
    '.ab.....bv.',
    'v..........']);
  d('tsuki', 'a:#fff4c4 b:#e8d890 c:#ffffff v:#e2c6ff', [
    '....aaa..v',
    '..acab....',
    '.acab.....',
    '.aab......',
    '.aab.....v',
    '.aabb.....',
    '..aabbb...',
    '...aaaab..',
    '.....v....']);

  /* ---------- できごと ---------- */
  d('yoyo', 'a:#8fd0f2 b:#5ea8d6 c:#ffffff r:#e8574a y:#f2c14e w:#e6e9ef', [
    '.....w.....',
    '.....w.....',
    '.....w.....',
    '...aaaaa...',
    '..acaaaab..',
    '.arryyrrab.',
    '.aaaaaaaab.',
    '..aaaaabb..',
    '...bbbbb...']);
  d('omen', 'a:#ffffff b:#e0dde8 r:#e8574a k:#3a2030', [
    'aa.......aa',
    'araa...aara',
    'arraaaaarra',
    'aaaaaaaaaaa',
    'aarkaaakraa',
    'aaaaaaaaaaa',
    '.aaaaaaaaa.',
    '..aaarraa..',
    '...aaaaa...',
    '....aba....']);
  d('ringoame', 'a:#e8574a b:#c23b35 c:#ff9a8a k:#d9c29a', [
    '...aaaaa...',
    '..acaaaab..',
    '.accaaaaab.',
    '.acaaaaaab.',
    '.aaaaaaaab.',
    '..aaaaabb..',
    '...bbbbb...',
    '.....k.....',
    '.....k.....',
    '.....k.....']);
  d('senko', 'k:#6a5a4a r:#e8574a y:#fff0a0 o:#f2a04a', [
    '..........y',
    '.......y.y.',
    '........o..',
    '.......y.y.',
    '......kk...',
    '.....kk....',
    '....kk.....',
    '...kk......',
    '..rr.......',
    '.rr........',
    'rr.........']);
  d('hoshikuji', 'a:#fff3c4 b:#e8d890 y:#f2c14e', [
    'aaaaaaaaaa',
    'aaaayaaaaa',
    'aaayyyaaaa',
    'ayyyyyyyaa',
    'aayyyyyaaa',
    'aayyaayyaa',
    'aaaaaaaaab',
    'bbbbbbbbbb']);
  d('badge', 'a:#5ea8d6 b:#3d7fb0 w:#ffffff', [
    '...aaaaa...',
    '..aaaaaaa..',
    '.aaaawaaab.',
    '.awwwwwwab.',
    '.aaaawaaab.',
    '.aaawwwaab.',
    '..aaaaabb..',
    '...bbbbb...']);
  d('shikasenbei', 'a:#e2b06a b:#c98f4a c:#f2cf94 w:#fffaf0 k:#6a4a2a', [
    '...aaaaa...',
    '..acaaaaa..',
    '.acaaaaaab.',
    '.wwwwwwwww.',
    '.wkkwkkkkw.',
    '.wwwwwwwww.',
    '.aaaaaaaab.',
    '..aaaaabb..',
    '...bbbbb...']);
  d('bokuto', 'a:#d9b07a b:#b8804a c:#f2d0a0 k:#3a3040 r:#e8574a', [
    '...........ca',
    '..........cab',
    '.........cab.',
    '........cab..',
    '.......cab...',
    '......cab....',
    '.....cab.....',
    '...k.ab......',
    '....kk.......',
    '...rkk.......',
    '..rr..k......',
    '.rr..........']);
  d('planeta', 'a:#232a5c w:#fff6c9 c:#fffaf0 k:#8a8aa6', [
    'aaaaaaaa.ccc',
    'awaaawaa.ckc',
    'aaawaaaa.ccc',
    'aawaaawa.ckc',
    'aaaaaaaa.ccc']);
  d('keyholder', 'k:#c9d0da a:#7fc47a b:#4d8f4f e:#3a2030 r:#e8574a', [
    '....kk.....',
    '...k..k....',
    '....kk.....',
    '.....k.....',
    '...aaaaa...',
    '..aaaaaaa..',
    '..aeaaaea..',
    '..aaarraa..',
    '..aaaaaab..',
    '...bbbbb...']);
  d('omamori', 'a:#e8574a b:#c23b35 y:#f2c14e w:#fffaf0', [
    '...yyy...',
    '..y...y..',
    '...yyy...',
    '..aaaaa..',
    '.aayyyaa.',
    '.aawwwaa.',
    '.aawwwab.',
    '.aaaaaab.',
    '.aayyyab.',
    '.aaaaaab.',
    '..bbbbb..']);
})(window);
