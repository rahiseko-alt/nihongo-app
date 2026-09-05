import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const KANJI_DIR = join(import.meta.dirname, '../../src/lib/data/kanji');

// 意味欄の穴埋め文字列。値が入っていると play 画面の getMeaningForeign が
// `??` の英語フォールバックに落ちず、この文字列がそのまま学習者に表示される。
const PLACEHOLDERS: Record<string, string> = {
  vi: 'khái niệm', // ベトナム語の「概念」
  ne: 'अर्थ', // ネパール語の「意味」
};

function kanjiFiles(): string[] {
  return readdirSync(KANJI_DIR).filter((f) => f.endsWith('.js') && f !== 'pack-1000.js');
}

// pack-1000.js が読み込んでいるファイルだけが 6 言語の意味欄を持つ。
// これより古い手書きの 28 ファイルは meanings を持たず、play 画面では
// EN_MEANING の表から引かれるため、ここでの検査対象にしない。
function packFiles(): string[] {
  const pack = readFileSync(join(KANJI_DIR, 'pack-1000.js'), 'utf8');
  return [...pack.matchAll(/from '\.\/([^']+\.js)'/g)].map((m) => m[1]);
}

function readMeanings(file: string): { char?: string; meanings: Record<string, string> } | null {
  const source = readFileSync(join(KANJI_DIR, file), 'utf8');
  const block = source.match(/meanings: \{([^}]*)\}/);
  if (!block) return null;

  const meanings: Record<string, string> = {};
  for (const [, lang, value] of block[1].matchAll(/(\w+): '([^']*)'/g)) meanings[lang] = value;

  return { char: source.match(/char: '([^']*)'/)?.[1], meanings };
}

describe('漢字データの意味欄', () => {
  it('穴埋め文字列が意味として残っていない', () => {
    const found: string[] = [];

    for (const file of kanjiFiles()) {
      const entry = readMeanings(file);
      if (!entry) continue;

      for (const [lang, placeholder] of Object.entries(PLACEHOLDERS)) {
        if (entry.meanings[lang] === placeholder) {
          found.push(`${file} (${lang}: ${placeholder})`);
        }
      }
    }

    expect(found).toEqual([]);
  });

  // 中国語欄に漢字そのものを入れても、学習者は上に表示されている字と同じものを
  // 見るだけで何も分からない。意味として成立していないので置かない。
  it('中国語欄が漢字そのものと同じになっていない', () => {
    const found: string[] = [];

    for (const file of kanjiFiles()) {
      const entry = readMeanings(file);
      if (!entry?.char) continue;
      if (entry.meanings.zh === entry.char) found.push(`${file} (zh: ${entry.meanings.zh})`);
    }

    expect(found).toEqual([]);
  });

  // 韓国語欄は途中まで Unihan の kHangul（＝漢字の読み）で埋められていた。
  // ハングル1文字は意味ではなく読みである可能性が高く、英語のまま残っている
  // ものは訳が入っていない印。どちらも消して英語フォールバックに落とす。
  it('韓国語欄に読みや英語が残っていない', () => {
    const found: string[] = [];

    for (const file of kanjiFiles()) {
      const ko = readMeanings(file)?.meanings.ko;
      if (!ko) continue;
      if (/^[\x20-\x7E]+$/.test(ko)) found.push(`${file} (ko が英語: ${ko})`);
      else if ([...ko].length === 1) found.push(`${file} (ko が1文字: ${ko})`);
    }

    expect(found).toEqual([]);
  });

  // 日本語欄は play 画面で常に 1 行目に出る。英語がそのまま入っていると、
  // 日本語行と英語行に同じ文字列が並んでしまう。訳が無いなら空欄にする。
  it('日本語欄に英語が残っていない', () => {
    const found: string[] = [];

    for (const file of kanjiFiles()) {
      const ja = readMeanings(file)?.meanings.ja;
      if (ja && /^[\x20-\x7E]+$/.test(ja)) found.push(`${file} (ja が英語: ${ja})`);
    }

    expect(found).toEqual([]);
  });

  it('1000字パックの意味欄そのものは消えていない', () => {
    const files = packFiles();
    expect(files.length).toBeGreaterThan(0);

    const withoutMeanings = files.filter(
      (file) => !readFileSync(join(KANJI_DIR, file), 'utf8').includes('meanings:'),
    );

    expect(withoutMeanings).toEqual([]);
  });
});
