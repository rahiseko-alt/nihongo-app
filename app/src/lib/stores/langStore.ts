import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const DEFAULT_LANG = 'ja';
const STORAGE_KEY = 'senbon_ui_language';
const SUPPORTED_LANGS = new Set(['ja', 'en', 'zh', 'ko', 'vi', 'ne']);

function normalizeLang(value: string | null) {
  if (value === 'zh-CN' || value === 'zh-TW' || value === 'zh-Hans' || value === 'zh-Hant') return 'zh';
  if (value && SUPPORTED_LANGS.has(value)) return value;
  return DEFAULT_LANG;
}

const initialLang = browser ? normalizeLang(localStorage.getItem(STORAGE_KEY)) : DEFAULT_LANG;

if (browser) {
  localStorage.setItem(STORAGE_KEY, initialLang);
}

export const uiLang = writable<string>(initialLang);

if (browser) {
  uiLang.subscribe((value) => {
    const normalized = normalizeLang(value);
    localStorage.setItem(STORAGE_KEY, normalized);
    if (normalized !== value) uiLang.set(normalized);
  });
}
