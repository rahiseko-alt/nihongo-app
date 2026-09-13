import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORDS_N5, CATEGORIES, CATEGORY_ORDER, SETS, SET_ORDER } from '../../src/lib/data/sets.js';
import { EN_WORD_MEANING, getWordMeaning } from '../../src/lib/utils/wordMeaning.js';

// T036: 単語まるごと書字練習。docs/plan.json T036 の verify に対応する回帰テスト。
// v7計画（round6の敵対検証で見つかったバグの修正込み）のAC群を機械的に検証する。

const PLAY_PAGE = readFileSync(
  join(import.meta.dirname, '../../src/routes/play/+page.svelte'),
  'utf8',
);
const SELECT_PAGE = readFileSync(
  join(import.meta.dirname, '../../src/routes/select/+page.svelte'),
  'utf8',
);
const WORDS_N5_SRC = readFileSync(
  join(import.meta.dirname, '../../src/lib/data/kanji/words-n5.js'),
  'utf8',
);

describe('WORDS_N5データ（AC0/AC1/AC2）', () => {
  it('有効な単語は69件（友達・富士山は構成文字のストロークデータ欠落のため除外）', () => {
    expect(WORDS_N5).toHaveLength(69);
  });

  it('各単語のchars.lengthはword自体の文字数と一致する（日曜日のような重複文字も含む）', () => {
    for (const w of WORDS_N5) {
      expect(w.chars.length).toBe(Array.from(w.word).length);
    }
  });

  it('日曜日はchars配列に日が2回、独立した要素として残る（省略されない）', () => {
    const nichiyoubi = WORDS_N5.find((w) => w.word === '日曜日');
    expect(nichiyoubi).toBeTruthy();
    expect(nichiyoubi!.chars.map((c: any) => c.char)).toEqual(['日', '曜', '日']);
  });

  it('word文字列に重複が無い（69語とも異なる単語）', () => {
    const words = WORDS_N5.map((w) => w.word);
    expect(new Set(words).size).toBe(69);
  });

  it('words-n5.js はKANJI_INDEX/getKanjiByCharを経由しない（SETS/SET_ORDER衝突リスクの排除）', () => {
    expect(WORDS_N5_SRC).not.toMatch(/getKanjiByChar/);
    expect(WORDS_N5_SRC).not.toMatch(/KANJI_INDEX/);
  });
});

describe('EN_WORD_MEANING（AC9関連データ・T030教訓の再発防止）', () => {
  it('69件全部に値があり、69語すべてを網羅する', () => {
    expect(Object.keys(EN_WORD_MEANING)).toHaveLength(69);
    for (const w of WORDS_N5) {
      expect(getWordMeaning(w.word)).toBeTruthy();
    }
  });

  it('値が単語自身の文字列と一致する行が無い（T030の中国語欄と同種の欠陥の再発防止）', () => {
    for (const [word, meaning] of Object.entries(EN_WORD_MEANING)) {
      expect(meaning).not.toBe(word);
      expect(meaning.length).toBeGreaterThan(0);
    }
  });
});

describe('/select 新カテゴリー「語」の登録（AC3/AC13）', () => {
  it('CATEGORIES.words とCATEGORY_ORDERへの追加のみで、SETS/SET_ORDERは無変更', () => {
    expect(CATEGORIES.words).toBeTruthy();
    expect(CATEGORY_ORDER).toContain('words');
    // 語カテゴリー用のエントリをSETS/SET_ORDERに追加していないことを確認
    // （KANJI_INDEX衝突リスクを構造的に排除する設計、1-1節）
    expect(Object.keys(SETS).some((id) => id.startsWith('word_') || id.startsWith('words:'))).toBe(
      false,
    );
    expect(SET_ORDER.some((id) => id.startsWith('word_') || id.startsWith('words:'))).toBe(false);
  });

  it('既存4カテゴリー（saved/popular/exam/kana）はCATEGORY_ORDER内の並びを保ったまま残る', () => {
    expect(CATEGORY_ORDER.slice(0, 4)).toEqual(['saved', 'popular', 'exam', 'kana']);
  });

  it('タブのラベル三項演算子に words 分岐が追加され、categoryExamへ誤フォールバックしない', () => {
    expect(SELECT_PAGE).toMatch(/catId === 'words' \? t\.categoryWords/);
  });

  it('goToPlay() の words 分岐が重複除去とWORDS_N5順ソートを行う', () => {
    const block = SELECT_PAGE.slice(
      SELECT_PAGE.indexOf("activeCategory === 'words'"),
      SELECT_PAGE.indexOf('function goHome'),
    );
    expect(block).toMatch(/new Set\(/);
    expect(block).toMatch(/\.sort\(\(a, b\) => a - b\)/);
    expect(block).toMatch(/\/play\?words=/);
  });
});

describe('/play 単語モードの安全な切り分け（AC13a/AC13b、round4で見つかった実バグの再発防止）', () => {
  // play/+page.svelte の rawWordIndices と全く同じアルゴリズムを再現して検証する
  // （コンポーネントを直接レンダーする仕組みがこのリポジトリに無いため、
  //  既存テスト群と同じくロジックの機械検証で代替する）。
  function parseWordIndices(param: string | null, wordsLength: number): number[] {
    return (param ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < wordsLength);
  }
  function normalize(indices: number[]): number[] {
    return [...new Set(indices)].sort((a, b) => a - b);
  }

  it('?words= が無い（null）とき、既存フローを乗っ取らない（空配列になる）', () => {
    expect(parseWordIndices(null, 69)).toEqual([]);
  });

  it('?words= が空文字列・カンマのみ・空白のみのとき、いずれも空配列になる', () => {
    expect(parseWordIndices('', 69)).toEqual([]);
    expect(parseWordIndices(',', 69)).toEqual([]);
    expect(parseWordIndices('  ', 69)).toEqual([]);
  });

  it('Number("")===0 が範囲チェックを通過して[0]になる実バグが再発していない', () => {
    // 空文字列を Number() に渡す前に filter(Boolean) で除去できていないと
    // Number('') === 0 が 0 <= 0 < 69 を満たしてしまい、既存の/playの全フロー
    // （通常表示・?kanji=・?sets=）が単語モードに乗っ取られる（round4で発見）。
    expect(parseWordIndices('', 69)).not.toContain(0);
  });

  it('範囲外・数値化できない値は除外される', () => {
    expect(parseWordIndices('999', 69)).toEqual([]);
    expect(parseWordIndices('abc', 69)).toEqual([]);
  });

  it('重複インデックスは1件に正規化される', () => {
    expect(normalize(parseWordIndices('5,5,5', 69))).toEqual([5]);
  });

  it('非正規順のURL直叩きでもWORDS_N5の並び順に正規化される', () => {
    expect(normalize(parseWordIndices('8,2,5', 69))).toEqual([2, 5, 8]);
  });

  it('play/+page.svelte のソースで、空文字列の除去(filter(Boolean))がNumber変換より前にある', () => {
    const block = PLAY_PAGE.slice(
      PLAY_PAGE.indexOf('let rawWordIndices'),
      PLAY_PAGE.indexOf('let wordIndices ='),
    );
    const filterPos = block.indexOf('.filter(Boolean)');
    const numberPos = block.indexOf('.map((s) => Number(s))');
    expect(filterPos).toBeGreaterThan(-1);
    expect(numberPos).toBeGreaterThan(-1);
    expect(filterPos).toBeLessThan(numberPos);
  });

  it('?words= が指定されると?kanji=/?sets=より優先される（activeSetsの評価順）', () => {
    const block = PLAY_PAGE.slice(
      PLAY_PAGE.indexOf('let activeSets = $derived(\n    wordSets.length'),
      PLAY_PAGE.indexOf('let activeSets = $derived(\n    wordSets.length') + 400,
    );
    expect(block.indexOf('wordSets.length > 0')).toBeLessThan(
      block.indexOf('customKanjiSet?.kanji?.length'),
    );
  });
});

describe('/play 単語モードの完了判定・表示切り替え（AC6/AC7/AC8/AC11、round6で見つかったバグの再発防止）', () => {
  it('完了判定はcurrentIndexの位置比較のみで、clearedKanjiの集合包含は使っていない', () => {
    // addClearedKanji（1文字の習得記録、既存のまま）は使うが、
    // 完了判定にgetClearedKanjiの集合包含チェックは一切登場しない。
    expect(PLAY_PAGE).not.toMatch(/getClearedKanji/);
    expect(PLAY_PAGE).toMatch(/import \{ addClearedKanji \}/);
  });

  it('jlpt-word-lineは単語モードで抑制される（!activeSet.isWordSet 条件）', () => {
    expect(PLAY_PAGE).toMatch(/\{#if !activeSet\.isWordSet && \(k\.jlptLevel/);
  });

  it('word-context-charの中身はstageWordContext（配列位置ベース）に差し替えられる', () => {
    expect(PLAY_PAGE).toMatch(
      /\{@const ctx = activeSet\.isWordSet \? stageWordContext\(activeSet\.name, i\) : wordContext\(k\)\}/,
    );
  });

  it('stageWordContextは配列位置で切り出す（indexOfではない）', () => {
    const block = PLAY_PAGE.slice(
      PLAY_PAGE.indexOf('function stageWordContext'),
      PLAY_PAGE.indexOf('function stageWordContext') + 300,
    );
    expect(block).not.toMatch(/indexOf/);
    expect(block).toMatch(/\.slice\(0, i\)/);
    expect(block).toMatch(/\.slice\(i \+ 1\)/);
  });

  it('stageWordContext相当のアルゴリズムは日曜日の1文字目・3文字目で異なる前後文字を返す', () => {
    function stageWordContext(word: string, i: number) {
      const chars = Array.from(word);
      return { prefix: chars.slice(0, i).join(''), suffix: chars.slice(i + 1).join('') };
    }
    expect(stageWordContext('日曜日', 0)).toEqual({ prefix: '', suffix: '曜日' });
    expect(stageWordContext('日曜日', 2)).toEqual({ prefix: '日曜', suffix: '' });
  });

  it('完了キャプションは「単語の最後の文字」ガード付きで、途中の文字では出ない（round6の誤発火バグ修正）', () => {
    expect(PLAY_PAGE).toMatch(
      /\{#if activeSet\.isWordSet && currentIndex === kanjis\.length - 1 && hasNextStage\}/,
    );
  });

  it('{#each kanjis as k, i (i)} キーで、日曜日のような文字重複語でも重複キーにならない', () => {
    expect(PLAY_PAGE).toMatch(/\{#each kanjis as k, i \(i\)\}/);
    expect(PLAY_PAGE).not.toMatch(/\{#each kanjis as k, i \(k\.char\)\}/);
  });
});

describe('新規UI文言は翻訳キー経由で、日本語の直書きが残っていない（round6のi18n欠落バグ修正）', () => {
  it('praise-card / caption / title-small の新規文言はいずれも t.xxx() 経由', () => {
    expect(PLAY_PAGE).toMatch(/wordCompletionText = \$derived\.by/);
    expect(PLAY_PAGE).toMatch(/t\.wordsCompletedList\(/);
    expect(PLAY_PAGE).toMatch(/t\.wordsCompletedCount\(/);
    expect(PLAY_PAGE).toMatch(/t\.wordStageComplete\(/);
    expect(PLAY_PAGE).toMatch(/t\.wordStageCount\(/);
  });
});
