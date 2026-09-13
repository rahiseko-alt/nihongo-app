import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const KANJI_DIR = join(import.meta.dirname, '../../src/lib/data/kanji');

// pack-1000.js / words-n5.js は個別の字ファイルを束ねる集約ファイルで、
// 対象外（T036: words-n5.js のコメント文言が正規表現に誤って引っかかる
// ことがあるため、pack-1000.js と同様に除外する）。
function kanjiFiles(): string[] {
  return readdirSync(KANJI_DIR).filter(
    (f) => f.endsWith('.js') && f !== 'pack-1000.js' && f !== 'words-n5.js',
  );
}

function readEntry(file: string): { char?: string; word?: string; jlptLevel?: string } {
  const source = readFileSync(join(KANJI_DIR, file), 'utf8');
  return {
    char: source.match(/char: '([^']*)'/)?.[1],
    word: source.match(/word: '([^']*)'/)?.[1],
    jlptLevel: source.match(/jlptLevel: '([^']*)'/)?.[1],
  };
}

describe('JLPT級と代表単語', () => {
  it('jlptLevel: N5 の字は、字そのものではない実在の単語をwordに持つ', () => {
    const emptyWord: string[] = [];
    const selfReferential: string[] = [];

    for (const file of kanjiFiles()) {
      const entry = readEntry(file);
      if (entry.jlptLevel !== 'N5') continue;
      if (!entry.word) emptyWord.push(file);
      else if (entry.word === entry.char) selfReferential.push(file);
    }

    expect(emptyWord).toEqual([]);
    expect(selfReferential).toEqual([]);
  });

  it('N5タグの字数は、独立した2つの公開リストが一致した71字と一致する', () => {
    const n5Files = kanjiFiles().filter((file) => readEntry(file).jlptLevel === 'N5');
    expect(n5Files.length).toBe(71);
  });
});
