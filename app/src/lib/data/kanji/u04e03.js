// 「七」の書き順データ（2画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/04e03.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U04E03 = {
  char: '七',
  reading: 'なな',
  meaning: 'seven',
  word: '七',
      meanings: { en: 'seven', ko: '일곱', vi: 'bảy', ne: 'सात' },
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
      // KanjiVG kvg:04e03-s1
      d: 'M15.5,51.75c1.82,0.5,4.38,0.88,6.96,0.5c16.91-2.45,50.92-8.12,64.44-8.74c3.02-0.14,4.84,0.24,6.35,0.49',
      numPos: { x: 8.5, y: 53.5 }
    },
    {
      id: 2,
      color: '#38bdf8',
      label: '',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇄',
      // KanjiVG kvg:04e03-s2
      d: 'M43,20c1.38,1.38,2.15,3.25,2.15,5.26C45.15,29.5,45,71.84,45,76c0,10.5,2.25,12.25,20.25,12.25c18.75,0,20-3.75,20-2.75',
      numPos: { x: 34.5, y: 19.63 }
    }
  ]
};
