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

describe('漢字データの意味欄', () => {
  it('穴埋め文字列が意味として残っていない', () => {
    const found: string[] = [];

    for (const file of kanjiFiles()) {
      const source = readFileSync(join(KANJI_DIR, file), 'utf8');
      const meanings = source.match(/meanings: \{[^}]*\}/)?.[0];
      if (!meanings) continue;

      for (const [lang, placeholder] of Object.entries(PLACEHOLDERS)) {
        if (meanings.includes(`${lang}: '${placeholder}'`)) {
          found.push(`${file} (${lang}: ${placeholder})`);
        }
      }
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
