// 「丁」の書き順データ（2画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/04e01.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U04E01 = {
  char: '丁',
  reading: 'ちょう',
  meaning: 'street/ward',
  word: '丁',
      meanings: { ja: 'street/ward', en: 'street/ward', vi: 'quận', ne: 'वडा' },
  strokeCount: 2,
  viewBox: '0 0 109 109',
  songLyric: '',  // TODO: 覚え歌全体（読み上げ用 1 行）を記入
  strokes: [
    {
      id: 1,
      color: '#ec4899',
      label: 'よこ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇐',
      // KanjiVG kvg:04e01-s1
      d: 'M14,24.17c2.44,0.56,6.92,0.82,9.35,0.56c18.9-1.99,39.53-5.36,60.62-6.48c4.05-0.21,6.5,0.27,8.53,0.55',
      numPos: { x: 7.5, y: 25.63 }
    },
    {
      id: 2,
      color: '#38bdf8',
      label: 'たてはね',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇚',
      // KanjiVG kvg:04e01-s2
      d: 'M55.77,23.08c1.07,1.07,1.75,2.92,1.75,5.06c0,14.67,0,54.55,0,59.55c0,11.31-8.46,0.51-9.96-0.75',
      numPos: { x: 49.5, y: 35.5 }
    }
  ]
};
