const STORAGE_KEY = 'lskf.savedKanjiChars.v1';

export function loadSavedKanjiChars(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'string');
  } catch (e) {
    console.warn('[savedKanji] localStorage parse failed', e);
    return [];
  }
}

export function saveSavedKanjiChars(chars: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
}

export function addSavedKanjiChar(ch: string): string[] {
  const current = loadSavedKanjiChars();
  if (current.includes(ch)) return current;
  const next = [...current, ch];
  saveSavedKanjiChars(next);
  return next;
}

export function removeSavedKanjiChar(ch: string): string[] {
  const next = loadSavedKanjiChars().filter((c) => c !== ch);
  saveSavedKanjiChars(next);
  return next;
}

export function moveSavedKanjiChar(chars: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= chars.length || to >= chars.length) return chars;
  const next = chars.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  saveSavedKanjiChars(next);
  return next;
}
