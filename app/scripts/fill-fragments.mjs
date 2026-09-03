#!/usr/bin/env node
// ⚠️ LSKF Phase A (Session 294): songFragment / songLyric は **削除済・再実行禁止**
//   - 本スクリプトは兄弟 learning-suite-kanji 由来。LSKF は外国人ターゲットで音声機能 MVP 除外
//   - 履歴保持のため残置するが、再実行すると削除済の覚え歌フィールドが復活する
//   - Phase 2 で音声機能再評価時のみ参考実装として参照可
//
// fill-fragments.mjs
// import-kanji.mjs で生成済みの 22 字データ JS スケルトンに、
// reading / meaning / word / songLyric / strokes[].songFragment / strokes[].label を一括埋め込む。
// 入力: KANJI_DATA テーブル（漢字単位の動作語マッピング・本ファイル下部に inline）
// 出力: ../src/lib/data/kanji/{name}.js を上書き（rahiseko-alt 正本管轄）
//
// Session 272 で一度限りの実行用。次回以降の追加漢字は本テーブルを拡張するか、別スクリプト化する。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCT_ROOT = path.resolve(__dirname, '..');
const KANJI_DIR = path.join(PRODUCT_ROOT, 'src/lib/data/kanji');

// --------------------------------------------------------------------
// 22 字 × 動作語マッピング（smileplanet PDF 自力解析・Session 272）
// fragments[i] = stroke (i+1) の songFragment
// labels[i]    = stroke (i+1) の label（label と songFragment は通常同一）
// --------------------------------------------------------------------
const KANJI_DATA = {
  kita: {
    reading: 'きた',
    meaning: 'ほっかいどうの北',
    word: 'きた',
    songLyric: 'ヒ、よこ、たて、よこ',
    fragments: ['ヒ', 'ヒ', 'よこ', 'たて', 'よこ']
  },
  kai: {
    reading: 'うみ',
    meaning: 'ほっかいどうの海',
    word: 'うみ',
    songLyric: 'シ、ノ、よこ、く、かくはね、ノ、よこ',
    fragments: ['シ', 'シ', 'シ', 'ノ', 'よこ', 'く', 'かくはね', 'ノ', 'よこ']
  },
  dou: {
    reading: 'どう',
    meaning: 'ほっかいどうの道',
    word: 'どう',
    songLyric: 'ソ、一、ノ、目、しんにょう',
    fragments: ['ソ', 'ソ', '一', 'ノ', '目', '目', '目', '目', '目', 'しんにょう', 'しんにょう', 'しんにょう']
  },
  higashi: {
    reading: 'ひがし',
    meaning: 'とうきょうとの東',
    word: 'とう',
    songLyric: 'よこ、日、たて、はらい、はらい',
    fragments: ['よこ', '日', '日', '日', '日', 'たて', 'はらい', 'はらい']
  },
  kyou: {
    reading: 'きょう',
    meaning: 'とうきょうとの京',
    word: 'きょう',
    songLyric: 'なべぶたに、口、小',
    fragments: ['なべぶた', 'なべぶた', '口', '口', '口', '小', '小', '小']
  },
  to: {
    reading: 'と',
    meaning: 'とうきょうとの都',
    word: 'と',
    songLyric: '土、ノ、日、おおざと',
    fragments: ['土', '土', '土', 'ノ', '日', '日', '日', '日', 'おおざと', 'おおざと', 'おおざと']
  },
  fu: {
    reading: 'ふ',
    meaning: 'きょうとふの府',
    word: 'ふ',
    songLyric: 'まだれ、イ、よこ、たてはね、てん',
    fragments: ['まだれ', 'まだれ', 'まだれ', 'イ', 'イ', 'よこ', 'たてはね', 'てん']
  },
  oo: {
    reading: 'おお',
    meaning: 'おおさかふの大',
    word: 'おお',
    songLyric: 'よこ、ノ、ハ',
    fragments: ['よこ', 'ノ', 'ハ']
  },
  saka: {
    reading: 'さか',
    meaning: 'おおさかふの阪',
    word: 'さか',
    songLyric: 'こざと、よこ、はらい、フ、右はらい',
    fragments: ['こざと', 'こざと', 'こざと', 'よこ', 'はらい', 'フ', '右はらい']
  },
  gi: {
    reading: 'ぎ',
    meaning: 'ぎふけんの岐',
    word: 'ぎ',
    songLyric: '山、十、フ、右はらい',
    fragments: ['山', '山', '山', '十', '十', 'フ', '右はらい']
  },
  oka: {
    reading: 'ふ',
    meaning: 'ぎふけんの阜',
    word: 'ふ',
    songLyric: 'ノ、たて、コ、コ、十',
    fragments: ['ノ', 'たて', 'コ', 'コ', 'コ', 'コ', '十', '十']
  },
  wa: {
    reading: 'わ',
    meaning: 'わかやまけんの和',
    word: 'わ',
    songLyric: 'ノ、木、口',
    fragments: ['ノ', '木', '木', '木', '木', '口', '口', '口']
  },
  ka: {
    reading: 'か',
    meaning: 'わかやまけんの歌',
    word: 'か',
    songLyric: 'よこ、口、たて、よこ、口、たてはね、ノ、よこはね、人',
    fragments: ['よこ', '口', '口', '口', 'たて', 'よこ', '口', '口', '口', 'たてはね', 'ノ', 'よこはね', '人', '人']
  },
  yama: {
    reading: 'やま',
    meaning: 'わかやまけんの山',
    word: 'やま',
    songLyric: 'たて、つる、たて',
    fragments: ['たて', 'つる', 'たて']
  },
  shika: {
    reading: 'しか',
    meaning: 'かごしまけんの鹿',
    word: 'しか',
    songLyric: 'たて、よこ、ノ、かく、よこ、たて、たて、よこ、たて、ヒ、ヒ',
    fragments: ['たて', 'よこ', 'ノ', 'かく', 'よこ', 'たて', 'たて', 'よこ', 'たて', 'ヒ', 'ヒ']
  },
  ji: {
    reading: 'じ',
    meaning: 'かごしまけんの児',
    word: 'じ',
    songLyric: 'たて、日、ノ、たてよこはね',
    fragments: ['たて', '日', '日', '日', '日', 'ノ', 'たてよこはね']
  },
  shima: {
    reading: 'しま',
    meaning: 'かごしまけんの島',
    word: 'しま',
    songLyric: '白、山、かくはね、よこ、のび',
    fragments: ['白', '白', '白', '白', '白', '山', 'かくはね', 'よこ', 'のび', 'のび']
  },
  ibara: {
    reading: 'いばら',
    meaning: 'いばらきけんの茨',
    word: 'いばら',
    songLyric: 'くさかんむり、ン、ノ、よこはね、ひと',
    fragments: ['くさかんむり', 'くさかんむり', 'くさかんむり', 'ン', 'ノ', 'よこはね', 'ひと', 'ひと', 'ひと']
  },
  jou: {
    reading: 'き',
    meaning: 'いばらきけんの城',
    word: 'き',
    songLyric: '土、成',
    fragments: ['土', '土', '土', '成', '成', '成', '成', '成', '成']
  },
  kami: {
    reading: 'かみ',
    meaning: 'かながわけんの神',
    word: 'かみ',
    songLyric: 'ネ、日、たて',
    fragments: ['ネ', 'ネ', 'ネ', 'ネ', '日', '日', '日', '日', 'たて']
  },
  na: {
    reading: 'な',
    meaning: 'かながわけんの奈',
    word: 'な',
    songLyric: '大、二、小',
    fragments: ['大', '大', '大', '二', '二', '小', '小', '小']
  },
  kawa: {
    reading: 'かわ',
    meaning: 'かながわけんの川',
    word: 'かわ',
    songLyric: 'ノ、たて、たて',
    fragments: ['ノ', 'たて', 'たて']
  }
};

// --------------------------------------------------------------------
// メイン
// --------------------------------------------------------------------
async function main() {
  let updated = 0;
  let skipped = 0;
  for (const [name, data] of Object.entries(KANJI_DATA)) {
    const file = path.join(KANJI_DIR, `${name}.js`);
    let src;
    try {
      src = await fs.readFile(file, 'utf8');
    } catch {
      console.warn(`[fill-fragments] ${name}.js 不在・スキップ: ${file}`);
      skipped++;
      continue;
    }

    let out = src;

    // 1) reading / meaning / word / songLyric を埋める
    out = out.replace(
      /reading: '',\s*\/\/[^\n]*/,
      `reading: '${data.reading}',`
    );
    out = out.replace(
      /meaning: '',\s*\/\/[^\n]*/,
      `meaning: '${data.meaning}',`
    );
    out = out.replace(
      /word: '',\s*\/\/[^\n]*/,
      `word: '${data.word}',`
    );
    out = out.replace(
      /songLyric: '',\s*\/\/[^\n]*/,
      `songLyric: '${data.songLyric}',`
    );

    // 2) 各 stroke の label と songFragment を埋める
    // パターン: "label: 'XXX',     // TODO: ...\n      songFragment: '', // TODO: PDF を見て..."
    let strokeIdx = 0;
    out = out.replace(
      /label: '([^']*)',\s*\/\/[^\n]*\n\s*songFragment: '',\s*\/\/[^\n]*/g,
      (match, oldLabel) => {
        const fragment = data.fragments[strokeIdx];
        if (fragment === undefined) {
          console.warn(`[fill-fragments] ${name}: stroke ${strokeIdx + 1} の fragment が未定義`);
          strokeIdx++;
          return match;
        }
        strokeIdx++;
        return `label: '${fragment}',\n      songFragment: '${fragment}',`;
      }
    );

    if (strokeIdx !== data.fragments.length) {
      console.warn(`[fill-fragments] ${name}: stroke 数不一致（更新=${strokeIdx} / 期待=${data.fragments.length}）`);
    }

    if (out === src) {
      console.warn(`[fill-fragments] ${name}: 変更なし（既に埋められている可能性）`);
      skipped++;
    } else {
      await fs.writeFile(file, out, 'utf8');
      console.log(`[fill-fragments] ${name}.js 更新 (${data.fragments.length} strokes)`);
      updated++;
    }
  }

  console.log('');
  console.log(`=== 結果: 更新 ${updated} / スキップ ${skipped} / 計 ${Object.keys(KANJI_DATA).length} ===`);
}

main().catch((err) => {
  console.error('[fill-fragments] 失敗:', err.message);
  process.exit(1);
});
