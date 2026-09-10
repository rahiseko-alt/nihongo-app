import { describe, it, expect } from 'vitest';
import {
  SETS,
  SET_ORDER,
  CATEGORIES,
  CATEGORY_ORDER,
  getSetsByCategory,
  getKanjiByChar,
} from '../../src/lib/data/sets.js';
import { KANJI_HIRAGANA_46, KANJI_KATAKANA_46 } from '../../src/lib/data/kanji/kana-46.js';

// ひらがな・カタカナ（基本46字、濁音・半濁音・拗音は対象外）を追加した際の回帰テスト。
// docs/handoff.md に記録された T033 の教訓（sets.js に定義しても SET_ORDER に
// 入れない限り /select のどのタブからも開けない）を再発させないための検査を含む。

describe('ひらがな・カタカナのデータ', () => {
  it('ひらがな・カタカナとも46字ずつある', () => {
    expect(KANJI_HIRAGANA_46).toHaveLength(46);
    expect(KANJI_KATAKANA_46).toHaveLength(46);
  });

  it('全92字が KanjiVG 由来の書き順データを持つ（画数・d 属性が空でない）', () => {
    for (const k of [...KANJI_HIRAGANA_46, ...KANJI_KATAKANA_46]) {
      expect(k.char).toBeTruthy();
      expect(k.strokeCount).toBeGreaterThan(0);
      expect(k.strokes).toHaveLength(k.strokeCount);
      for (const s of k.strokes) {
        expect(typeof s.d).toBe('string');
        expect(s.d.length).toBeGreaterThan(0);
        expect(s.d.startsWith('M')).toBe(true);
      }
      expect(k.viewBox).toBe('0 0 109 109');
    }
  });

  it('全92字にローマ字の reading がある（かな未修得の学習者向けのため、ひらがな読みではなくローマ字）', () => {
    for (const k of [...KANJI_HIRAGANA_46, ...KANJI_KATAKANA_46]) {
      expect(k.reading).toBeTruthy();
      expect(/^[a-z]+$/.test(k.reading)).toBe(true);
    }
  });

  it('ひらがな・カタカナの字は重複しない', () => {
    const hiraChars = KANJI_HIRAGANA_46.map((k: any) => k.char);
    const kataChars = KANJI_KATAKANA_46.map((k: any) => k.char);
    expect(new Set(hiraChars).size).toBe(46);
    expect(new Set(kataChars).size).toBe(46);
  });

  it('対応するひらがな・カタカナは同じ読みを持つ（五十音順で対応している）', () => {
    for (let i = 0; i < 46; i++) {
      expect(KANJI_HIRAGANA_46[i].reading).toBe(KANJI_KATAKANA_46[i].reading);
    }
  });
});

describe('/select からひらがな・カタカナを開けること（T033 と同種の不具合の再発防止）', () => {
  it('sets.js の SETS に hiragana / katakana が定義されている', () => {
    expect(SETS.hiragana).toBeTruthy();
    expect(SETS.katakana).toBeTruthy();
    expect(SETS.hiragana.kanji).toHaveLength(46);
    expect(SETS.katakana.kanji).toHaveLength(46);
  });

  it('SET_ORDER に hiragana / katakana が含まれている（無いと /select のどのタブにも出ない）', () => {
    expect(SET_ORDER).toContain('hiragana');
    expect(SET_ORDER).toContain('katakana');
  });

  it('CATEGORY_ORDER に kana タブが追加されている（無いと select 画面にタブ自体が出ない）', () => {
    expect(CATEGORY_ORDER).toContain('kana');
    expect(CATEGORIES.kana).toBeTruthy();
  });

  it('getSetsByCategory("kana") で hiragana・katakana の両方が拾える', () => {
    const kanaSets = getSetsByCategory('kana');
    const ids = kanaSets.map((s: any) => s.id);
    expect(ids).toContain('hiragana');
    expect(ids).toContain('katakana');
  });

  it('getKanjiByChar でひらがな・カタカナの字が引ける（KANJI_INDEX の対象になっている）', () => {
    expect(getKanjiByChar('あ')?.char).toBe('あ');
    expect(getKanjiByChar('ン')?.char).toBe('ン');
  });
});
