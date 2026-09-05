// 「刀」の書き順データ（2画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/05200.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U05200 = {
  char: '刀',
  reading: 'かたな',
  meaning: 'sword/saber',
  word: '刀',
      meanings: { ja: 'sword/saber', en: 'sword/saber', zh: '刀', ko: '도' },
  strokeCount: 2,
  viewBox: '0 0 109 109',
  songLyric: '',  // TODO: 覚え歌全体（読み上げ用 1 行）を記入
  strokes: [
    {
      id: 1,
      color: '#ec4899',
      label: 'よこおれ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇆',
      // KanjiVG kvg:05200-s1
      d: 'M23.34,27.56c2.19,0.76,4.95,0.62,6.87,0.41c15.78-1.72,41.52-5.94,50.19-6.72c5.64-0.51,8.15,2.77,7.83,6.31c-0.83,9.35-7.98,45.4-15.67,56.15C67,91.5,63.75,89,59.54,83.94',
      numPos: { x: 16.5, y: 28.5 }
    },
    {
      id: 2,
      color: '#38bdf8',
      label: 'ノ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇒',
      // KanjiVG kvg:05200-s2
      d: 'M49.81,29.06c0.7,2.01,0.74,3.8,0.37,5.63C46.59,52,36.12,73,16.62,86.88',
      numPos: { x: 41.5, y: 38.5 }
    }
  ]
};
