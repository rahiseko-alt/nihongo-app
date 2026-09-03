// 「人」の書き順データ（2画）
// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)
//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/
//   出典: http://kanjivg.tagaini.net  (kanji/04eba.svg)
// viewBox: 0 0 109 109（KanjiVG 標準）
// 書き順は KanjiVG 正規順（自動抽出）
// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）
export const KANJI_U04EBA = {
  char: '人',
  reading: 'ひと',
  meaning: 'person',
  word: '人',
      meanings: { ja: 'person', en: 'person', zh: '人', ko: '사람', vi: 'người', ne: 'मानिस' },
  strokeCount: 2,
  viewBox: '0 0 109 109',
  songLyric: '',  // TODO: 覚え歌全体（読み上げ用 1 行）を記入
  strokes: [
    {
      id: 1,
      color: '#ec4899',
      label: 'ノ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇒',
      // KanjiVG kvg:04eba-s1
      d: 'M54.5,20c0.37,2.12,0.23,4.03-0.22,6.27C51.68,39.48,38.25,72.25,16.5,87.25',
      numPos: { x: 45.5, y: 19.5 }
    },
    {
      id: 2,
      color: '#38bdf8',
      label: 'ハ',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）
      songFragment: '', // TODO: PDF を見て動作語を記入
      type: '㇏',
      // KanjiVG kvg:04eba-s2
      d: 'M46,54.25c6.12,6,25.51,22.24,35.52,29.72c3.66,2.73,6.94,4.64,11.48,5.53',
      numPos: { x: 52.5, y: 55.63 }
    }
  ]
};
