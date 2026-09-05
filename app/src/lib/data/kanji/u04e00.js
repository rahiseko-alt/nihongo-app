// 「一」の書き順データ（1画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/04e00.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U04E00 = {
  char: '一',
  reading: 'いち',
  meaning: 'one',
  word: '一',
      meanings: { en: 'one', ko: '하나', vi: 'một', ne: 'एक' },
  strokeCount: 1,
  viewBox: '0 0 109 109',
  songLyric: '',  // TODO: 覚え歌全体（読み上げ用 1 行）を記入
  strokes: [
    {
      id: 1,
      color: '#ec4899',
      label: 'よこ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇐',
      // KanjiVG kvg:04e00-s1
      d: 'M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49',
      numPos: { x: 4.25, y: 54.13 }
    }
  ]
};
