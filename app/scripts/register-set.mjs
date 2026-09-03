#!/usr/bin/env node
// register-set.mjs
// 漢字データ JS ファイル群をセットとして sets.js に登録します。
//
// 使い方:
//   node scripts/register-set.mjs --setId tokyo --name 東京都 --kanji tou,kyou,to
//
// 引数:
//   --setId <id>          : セット ID（必須・kebab-case 推奨。例 tokyo）
//   --name <表示名>       : セット表示名（必須・例 東京都）
//   --kanji <カンマ区切り> : 含める漢字データのモジュール名（必須・例 tou,kyou,to）
//   --setsPath <path>     : sets.js のパス（既定 ../src/lib/data/sets.js）
//   --dataDir <path>      : 漢字データ JS の格納ディレクトリ（既定 ../src/lib/data/kanji/）
//   --force               : 既存セットを上書き
//
// 動作:
//   1. {dataDir}/kanji-{name}.js の存在確認（不在ならエラー）
//   2. sets.js を読み込み（無ければ scaffold を新規作成）
//   3. import 文・SETS エントリ・SET_ORDER エントリを追記（重複は --force なしならエラー）
//
// 依存: Node 標準モジュールのみ。AST パーサ不要。正規表現で SETS / SET_ORDER の末尾に追記する方式。

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ----- CLI 引数パース ------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

// ----- 既定パス ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATA_DIR = path.join(PRODUCT_ROOT, 'src/lib/data/kanji');
const DEFAULT_SETS_PATH = path.join(PRODUCT_ROOT, 'src/lib/data/sets.js');

// ----- ヘルパ --------------------------------------------------------------
async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function moduleNameToConst(name) {
  // 「tou」→「KANJI_TOU」、「ka_2」→「KANJI_KA_2」
  return 'KANJI_' + name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
}

// sets.js の最低限スキャフォールド -----------------------------------------
const SETS_SCAFFOLD = `// 漢字セット定義
// このファイルは scripts/register-set.mjs によって自動編集されます。
// import 文 / SETS エントリ / SET_ORDER エントリの追記は手書きでも可ですが、
// 重複・整合性のチェックのため可能ならスクリプト経由を推奨します。

// === imports (auto-managed) ===

// === SETS ===
export const SETS = {
};

// === SET_ORDER ===
export const SET_ORDER = [
];

export function getSetById(id) {
  return SETS[id];
}
`;

// ----- sets.js 読み込み（無ければ scaffold 生成） -------------------------
async function loadOrCreateSetsFile(setsPath) {
  if (await fileExists(setsPath)) {
    return await fs.readFile(setsPath, 'utf8');
  }
  await fs.mkdir(path.dirname(setsPath), { recursive: true });
  await fs.writeFile(setsPath, SETS_SCAFFOLD, 'utf8');
  return SETS_SCAFFOLD;
}

// ----- import 文の追記 -----------------------------------------------------
// 既存に同じ const があればスキップ。section が無ければ先頭に挿入する。
function addImports(src, kanjiNames) {
  let out = src;
  const importMarker = '// === imports (auto-managed) ===';
  let markerIdx = out.indexOf(importMarker);
  if (markerIdx === -1) {
    // marker が無い場合は SETS 宣言の直前に挿入
    const setsMatch = out.match(/^export const SETS\b/m);
    if (!setsMatch) {
      throw new Error('sets.js の構造を解析できません（SETS 宣言が見つかりません）。');
    }
    const insertAt = setsMatch.index;
    out =
      out.slice(0, insertAt) +
      importMarker +
      '\n\n' +
      out.slice(insertAt);
    markerIdx = out.indexOf(importMarker);
  }

  // marker 直後に既存 import 群がある（複数行）。新規 import を追記する。
  const afterMarker = markerIdx + importMarker.length;
  // marker から最初の空行（または「// ===」）までを imports ブロックとみなす
  const rest = out.slice(afterMarker);
  const blockEndRel = rest.search(/\n\/\/ === |\nexport const SETS\b/);
  const blockEnd = blockEndRel === -1 ? out.length : afterMarker + blockEndRel;

  const existingBlock = out.slice(afterMarker, blockEnd);
  const newImports = [];
  for (const name of kanjiNames) {
    const constName = moduleNameToConst(name);
    const importLine = `import { ${constName} } from './kanji-${name}.js';`;
    if (existingBlock.includes(importLine)) continue;
    newImports.push(importLine);
  }
  if (newImports.length === 0) return out;

  const insertion =
    (existingBlock.endsWith('\n') ? '' : '\n') + newImports.join('\n') + '\n';
  out = out.slice(0, blockEnd) + insertion + out.slice(blockEnd);
  return out;
}

// ----- SETS エントリの追記 -------------------------------------------------
// 既存 SETS = { ... } の末尾の `}` 直前に新エントリを挿入する。
function addSetEntry(src, setId, displayName, kanjiNames, force) {
  const setsRe = /export const SETS\s*=\s*\{([\s\S]*?)\}\s*;/m;
  const m = src.match(setsRe);
  if (!m) {
    throw new Error('sets.js の SETS 宣言を解析できません。');
  }
  const body = m[1];

  // 既に同じ setId が存在するかチェック
  const idKey = `'${setId}'`;
  const idKeyDouble = `"${setId}"`;
  const idKeyBare = setId.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/) ? setId : null;
  const hasExisting =
    new RegExp(`^\\s*(?:${idKey}|${idKeyDouble}${idKeyBare ? `|${idKeyBare}` : ''})\\s*:`, 'm').test(body);
  if (hasExisting && !force) {
    throw new Error(`セット '${setId}' は既に存在します。--force で上書きしてください。`);
  }

  // エントリ生成
  const constList = kanjiNames.map((n) => moduleNameToConst(n)).join(', ');
  const newEntry = `  '${setId}': {
    id: '${setId}',
    name: '${displayName}',
    kanji: [${constList}]
  }`;

  let newBody;
  if (hasExisting) {
    // 既存エントリを置換
    const entryRe = new RegExp(
      `^(\\s*)(?:${idKey}|${idKeyDouble}${idKeyBare ? `|${idKeyBare}` : ''})\\s*:\\s*\\{[\\s\\S]*?\\n\\1\\}\\s*,?`,
      'm'
    );
    newBody = body.replace(entryRe, newEntry);
  } else {
    // 末尾に追記。既存エントリがあれば末尾にカンマを補う。
    const trimmed = body.replace(/\s+$/, '');
    if (trimmed === '') {
      newBody = '\n' + newEntry + '\n';
    } else {
      // 末尾エントリにカンマが無い場合は付与
      const needsComma = !trimmed.endsWith(',');
      newBody = (needsComma ? trimmed + ',' : trimmed) + '\n' + newEntry + '\n';
    }
  }

  return src.replace(setsRe, `export const SETS = {${newBody}};`);
}

// ----- SET_ORDER エントリの追記 -------------------------------------------
function addSetOrder(src, setId, force) {
  const orderRe = /export const SET_ORDER\s*=\s*\[([\s\S]*?)\]\s*;/m;
  const m = src.match(orderRe);
  if (!m) {
    throw new Error('sets.js の SET_ORDER 宣言を解析できません。');
  }
  const body = m[1];

  const tokenSingle = `'${setId}'`;
  const tokenDouble = `"${setId}"`;
  if (body.includes(tokenSingle) || body.includes(tokenDouble)) {
    if (!force) {
      // ID が SETS に既存・かつ SET_ORDER にも既存 → 何もしない（force 無しでも整合的）
      return src;
    }
    return src; // 同じ id を 2 回追加しない
  }

  const trimmed = body.replace(/\s+$/, '');
  let newBody;
  if (trimmed === '') {
    newBody = `\n  '${setId}'\n`;
  } else {
    const needsComma = !trimmed.endsWith(',');
    newBody = (needsComma ? trimmed + ',' : trimmed) + `\n  '${setId}'\n`;
  }
  return src.replace(orderRe, `export const SET_ORDER = [${newBody}];`);
}

// ----- メイン --------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.setId || !args.name || !args.kanji) {
    console.error('エラー: --setId, --name, --kanji は必須です。');
    console.error('例: node scripts/register-set.mjs --setId tokyo --name 東京都 --kanji tou,kyou,to');
    process.exit(2);
  }

  const setId = String(args.setId);
  const displayName = String(args.name);
  const kanjiNames = String(args.kanji)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (kanjiNames.length === 0) {
    console.error('エラー: --kanji が空です。');
    process.exit(2);
  }
  const dataDir = path.resolve(args.dataDir ? String(args.dataDir) : DEFAULT_DATA_DIR);
  const setsPath = path.resolve(args.setsPath ? String(args.setsPath) : DEFAULT_SETS_PATH);
  const force = !!args.force;

  console.log(`[register-set] setId = ${setId}, name = ${displayName}`);
  console.log(`[register-set] kanji = ${kanjiNames.join(', ')}`);
  console.log(`[register-set] sets.js = ${setsPath}`);

  // -------- 1) 漢字データ JS の存在確認 -----------------------------------
  for (const name of kanjiNames) {
    const dataFile = path.join(dataDir, `kanji-${name}.js`);
    if (!(await fileExists(dataFile))) {
      console.error(`エラー: 漢字データが見つかりません: ${dataFile}`);
      console.error(`先に node scripts/import-kanji.mjs --kanji <字> --code <hex> --name ${name} を実行してください。`);
      process.exit(3);
    }
  }

  // -------- 2) sets.js 読み込み（無ければ scaffold 生成） -----------------
  const wasScaffolded = !(await fileExists(setsPath));
  let src = await loadOrCreateSetsFile(setsPath);
  if (wasScaffolded) {
    console.log(`[register-set] sets.js を新規作成（scaffold）: ${setsPath}`);
  }

  // -------- 3) import / SETS / SET_ORDER 追記 -----------------------------
  src = addImports(src, kanjiNames);
  src = addSetEntry(src, setId, displayName, kanjiNames, force);
  src = addSetOrder(src, setId, force);

  await fs.writeFile(setsPath, src, 'utf8');
  console.log(`[register-set] 登録完了: ${setId} (${displayName}) → ${kanjiNames.join(', ')}`);
  console.log('');
  console.log('=== 次の手順 ===');
  console.log(`1) ブラウザで動作確認: import { getSetById } from '$lib/data/sets.js'; getSetById('${setId}')`);
  console.log('2) 既存セット（i など）が壊れていないか目視確認');
}

main().catch((err) => {
  console.error('[register-set] 失敗:', err.message);
  process.exit(1);
});
