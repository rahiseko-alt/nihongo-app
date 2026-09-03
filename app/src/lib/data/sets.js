// 漢字セット定義
//
// セット = 1 つ以上の漢字を 1 セッションで練習する単位
// Session 308: カテゴリー制導入 — 各セットに category 属性を追加
// カテゴリー: 'basic'(基本), 'cities'(主要都市), 'regions'(地方と自然)

import { KANJI_FEI } from './kanji/fei.js';
import { KANJI_AI } from './kanji/ai.js';
import { KANJI_CHI } from './kanji/chi.js';
import { KANJI_KEN } from './kanji/ken.js';
import { KANJI_KITA } from './kanji/kita.js';
import { KANJI_KAI } from './kanji/kai.js';
import { KANJI_DOU } from './kanji/dou.js';
import { KANJI_HIGASHI } from './kanji/higashi.js';
import { KANJI_KYOU } from './kanji/kyou.js';
import { KANJI_TO } from './kanji/to.js';
import { KANJI_FU } from './kanji/fu.js';
import { KANJI_OO } from './kanji/oo.js';
import { KANJI_SAKA } from './kanji/saka.js';
import { KANJI_GI } from './kanji/gi.js';
import { KANJI_OKA } from './kanji/oka.js';
import { KANJI_WA } from './kanji/wa.js';
import { KANJI_KA } from './kanji/ka.js';
import { KANJI_YAMA } from './kanji/yama.js';
import { KANJI_SHIKA } from './kanji/shika.js';
import { KANJI_JI } from './kanji/ji.js';
import { KANJI_SHIMA } from './kanji/shima.js';
import { KANJI_IBARA } from './kanji/ibara.js';
import { KANJI_JOU } from './kanji/jou.js';
import { KANJI_KAMI } from './kanji/kami.js';
import { KANJI_NA } from './kanji/na.js';
import { KANJI_KAWA } from './kanji/kawa.js';
import { KANJI_POPULAR_FOREIGNERS_500, KANJI_RESIDENT_EXAM_500 } from './kanji/pack-1000.js';

// ─── カテゴリー定義 ───
/** @type {Record<string, { id: string, icon: string }>} */
export const CATEGORIES = {
  saved:   { id: 'saved',   icon: '保' },
  popular: { id: 'popular', icon: '人' },
  exam:    { id: 'exam',    icon: '験' },
};

export const CATEGORY_ORDER = ['saved', 'popular', 'exam'];

/** @type {Record<string, any>} */
export const SETS = {
  fei: {
    id: 'fei',
    name: '飛',
    label: '飛（とぶ）',
    category: 'basic',
    kanji: [KANJI_FEI],
  },
  aichi: {
    id: 'aichi',
    name: '愛知県',
    label: '愛知県（あいちけん）',
    reading: 'あいちけん',
    kanjiReadings: ['あい', 'ち', 'けん'],
    category: 'regions',
    kanji: [KANJI_AI, KANJI_CHI, KANJI_KEN],
  },
  hokkaido: {
    id: 'hokkaido',
    name: '北海道',
    label: '北海道（ほっかいどう）',
    reading: 'ほっかいどう',
    kanjiReadings: ['ほっ', 'かい', 'どう'],
    category: 'regions',
    kanji: [KANJI_KITA, KANJI_KAI, KANJI_DOU],
  },
  tokyoto: {
    id: 'tokyoto',
    name: '東京都',
    label: '東京都(とうきょうと)',
    reading: 'とうきょうと',
    kanjiReadings: ['とう', 'きょう', 'と'],
    category: 'cities',
    kanji: [KANJI_HIGASHI, KANJI_KYOU, KANJI_TO],
  },
  kyoto: {
    id: 'kyoto',
    name: '京都府',
    label: '京都府(きょうとふ)',
    reading: 'きょうとふ',
    kanjiReadings: ['きょう', 'と', 'ふ'],
    category: 'cities',
    kanji: [KANJI_KYOU, KANJI_TO, KANJI_FU],
  },
  osaka: {
    id: 'osaka',
    name: '大阪府',
    label: '大阪府(おおさかふ)',
    reading: 'おおさかふ',
    kanjiReadings: ['おお', 'さか', 'ふ'],
    category: 'cities',
    kanji: [KANJI_OO, KANJI_SAKA, KANJI_FU],
  },
  gifu: {
    id: 'gifu',
    name: '岐阜県',
    label: '岐阜県(ぎふけん)',
    reading: 'ぎふけん',
    kanjiReadings: ['ぎ', 'ふ', 'けん'],
    category: 'regions',
    kanji: [KANJI_GI, KANJI_OKA, KANJI_KEN],
  },
  wakayama: {
    id: 'wakayama',
    name: '和歌山県',
    label: '和歌山県(わかやまけん)',
    reading: 'わかやまけん',
    kanjiReadings: ['わ', 'か', 'やま', 'けん'],
    category: 'regions',
    kanji: [KANJI_WA, KANJI_KA, KANJI_YAMA, KANJI_KEN],
  },
  kagoshima: {
    id: 'kagoshima',
    name: '鹿児島県',
    label: '鹿児島県(かごしまけん)',
    reading: 'かごしまけん',
    kanjiReadings: ['か', 'ご', 'しま', 'けん'],
    category: 'regions',
    kanji: [KANJI_SHIKA, KANJI_JI, KANJI_SHIMA, KANJI_KEN],
  },
  ibaraki: {
    id: 'ibaraki',
    name: '茨城県',
    label: '茨城県(いばらきけん)',
    reading: 'いばらきけん',
    kanjiReadings: ['いばら', 'き', 'けん'],
    category: 'regions',
    kanji: [KANJI_IBARA, KANJI_JOU, KANJI_KEN],
  },
  kanagawa: {
    id: 'kanagawa',
    name: '神奈川県',
    label: '神奈川県(かながわけん)',
    reading: 'かながわけん',
    kanjiReadings: ['かな', 'が', 'わ', 'けん'],
    category: 'cities',
    kanji: [KANJI_KAMI, KANJI_NA, KANJI_KAWA, KANJI_KEN],
  },
  popular_foreigners_500: {
    id: 'popular_foreigners_500',
    name: '人気漢字 500',
    label: '外国人に人気の実用漢字 500',
    reading: 'にんきかんじ',
    category: 'popular',
    kanji: KANJI_POPULAR_FOREIGNERS_500,
  },
  resident_exam_500: {
    id: 'resident_exam_500',
    name: '試験漢字 500',
    label: '在留外国人向け試験対策漢字 500',
    reading: 'しけんかんじ',
    category: 'exam',
    kanji: KANJI_RESIDENT_EXAM_500,
  },
};

// トップ画面の選択 UI 表示順
export const SET_ORDER = [
  'popular_foreigners_500',
  'resident_exam_500',
];

// デフォルトセット（パラメータ未指定時）
export const DEFAULT_SET_ID = 'popular_foreigners_500';

/**
 * @param {string} id
 */
export function getSetById(id) {
  return SETS[id] || SETS[DEFAULT_SET_ID];
}

/**
 * カテゴリーIDでセットをフィルタリング
 * @param {string} categoryId
 * @returns {any[]}
 */
export function getSetsByCategory(categoryId) {
  return SET_ORDER
    .map((id) => SETS[id])
    .filter((s) => s.category === categoryId);
}

/** @type {Record<string, any>} */
export const KANJI_INDEX = {};
for (const setId of SET_ORDER) {
  const set = SETS[setId];
  for (const k of set?.kanji ?? []) {
    if (k?.char && !KANJI_INDEX[k.char]) KANJI_INDEX[k.char] = k;
  }
}

/**
 * @param {string} ch
 * @returns {any | null}
 */
export function getKanjiByChar(ch) {
  return KANJI_INDEX[ch] ?? null;
}
