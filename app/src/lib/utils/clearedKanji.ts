const STORAGE_KEY = 'lskf_cleared_kanji_v1';

function read(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.length > 0) : [];
  } catch (e) {
    console.warn('[clearedKanji] localStorage parse failed', e);
    return [];
  }
}

function write(chars: string[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(chars)]));
}

export function getClearedKanji(): string[] {
  return read();
}

export function addClearedKanji(char: string): string[] {
  const current = read();
  if (!char || current.includes(char)) return current;
  const next = [...current, char];
  write(next);
  return next;
}

export function clearClearedKanji() {
  write([]);
}
