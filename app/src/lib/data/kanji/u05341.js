// 「十」の書き順データ（2画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/05341.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U05341 = {
  char: '十',
  reading: 'じゅう',
  meaning: 'ten',
  word: '十',
      meanings: { ja: 'ten', en: 'ten', zh: '十', ko: '열', vi: 'mười', ne: 'दश' },
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
      // KanjiVG kvg:05341-s1
      d: 'M11.88,50.98c3.18,0.89,6.62,0.61,9.87,0.35c19.92-1.58,45.23-4.76,63.38-5.82c3.85-0.23,7.23-0.07,11,0.56',
      numPos: { x: 5.5, y: 52.5 }
    },
    {
      id: 2,
      color: '#38bdf8',
      label: 'たて',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇑',
      // KanjiVG kvg:05341-s2
      d: 'M52.22,11.63c1.4,1.4,2.2,3.96,2.2,6.26c0,1.13-0.03,51.22-0.19,73.41c-0.03,3.96-0.06,6.83-0.08,8.08',
      numPos: { x: 42.75, y: 12.5 }
    }
  ]
};
