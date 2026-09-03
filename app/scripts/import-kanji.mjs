#!/usr/bin/env node
// ⚠️ LSKF Phase A (Session 294): 生成テンプレートに残る songFragment / songLyric フィールドは
//    本プロダクトでは音声機能 MVP 除外のため使用しない。新規追加時は生成後にフィールド削除すること
//    （/learning-suite-add-kanji スキル経由で本ファイル使用時の規律）
//
// import-kanji.mjs
// 漢字 1 字を引数で受け取り、KanjiVG SVG をダウンロードしてデータ JS ファイルを自動生成します。
//
// 使い方:
//   node scripts/import-kanji.mjs --kanji 東 --code 06771 --name tou --grade 2 --songNumber 2104 --songReading tou
//
// 引数:
//   --kanji <字>          : 漢字 1 字（必須）
//   --code <hex>          : KanjiVG コードポイント 16 進 5 桁（必須・例 04e95 = 井）
//   --name <ローマ字>     : 出力ファイル名のスラッグ（任意・既定はコードポイント。kanji-<name>.js）
//   --grade <学年>        : 1-6（任意。注記用）
//   --songNumber <連番>   : smileplanet 連番（任意・例 2104）
//   --songReading <読み>  : smileplanet ファイル名読み（任意・例 tou）
//   --out <dir>           : 出力先ディレクトリ（既定 ../src/lib/data/kanji/）
//   --svgOut <dir>        : SVG 保存先（既定 ../static/svg/）
//   --pdfOut <dir>        : PDF 保存先（既定 ../docs/research/smilekanji-pdfs/）
//   --force               : 既存ファイルを上書き
//   --dryRun              : ファイル書き込みを行わず生成内容を stdout 出力
//
// 依存: Node 標準モジュールのみ（fetch / fs / path / url）。npm install 不要。

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

// ----- 既定パス（このスクリプトの位置を起点に解決） -----------------------
// scripts/ から見たリポジトリルートは ..
// - データ JS: ../src/lib/data/kanji/{name}.js（アプリが読む正本）
// - SVG: ../static/svg/{code}.svg（KanjiVG 原本）
// - PDF: ../docs/research/smilekanji-pdfs/{number}_{reading}.pdf
//   （出典元の教材 PDF。ローカル作業用で、リポジトリには同梱しない）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCT_ROOT = path.resolve(__dirname, '..'); // リポジトリルート
const DEFAULT_OUT = path.join(PRODUCT_ROOT, 'src/lib/data/kanji'); // 1 漢字 1 ファイル: {name}.js
const DEFAULT_SVG_OUT = path.join(PRODUCT_ROOT, 'static/svg');
const DEFAULT_PDF_OUT = path.join(PRODUCT_ROOT, 'docs/research/smilekanji-pdfs');

// ----- 既定の画ごとの色（KanjiVG 標準色をベースに循環） -------------------
const STROKE_COLORS = [
  '#ec4899', // pink
  '#38bdf8', // sky
  '#22c55e', // green
  '#f97316', // orange
  '#a855f7', // purple
  '#ef4444', // red
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#d946ef', // fuchsia
  '#0ea5e9', // light-blue
  '#65a30d', // green-dark
  '#dc2626', // red-dark
  '#7c3aed', // violet-dark
  '#0891b2', // cyan-dark
  '#16a34a', // green-mid
  '#ea580c', // orange-dark
  '#9333ea', // purple-dark
  '#db2777' // pink-dark
];

// ----- ストローク種別 → 既定ラベル（ヒント） -----------------------------
// KanjiVG kvg:type の代表値だけ拾う（網羅は不要・使用者が手で直す前提）
const TYPE_TO_LABEL = {
  '㇐': 'よこ',
  '㇑': 'たて',
  '㇒': 'ノ',
  '㇏': 'ハ',
  '㇔': 'てん',
  '㇕': 'よこおれ',
  '㇆': 'よこおれ',
  '㇗': 'たてはね',
  '㇙': 'たてはね',
  '㇚': 'たてはね'
};

// ----- ヘルパ --------------------------------------------------------------
function pad5(hex) {
  // 「4e95」→「04e95」のように 5 桁化
  return hex.toLowerCase().padStart(5, '0');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  // 画像/PDF は ArrayBuffer、SVG/HTML は text で取得（拡張子で分岐）
  const ext = path.extname(destPath).toLowerCase();
  if (ext === '.svg') {
    const text = await res.text();
    await fs.writeFile(destPath, text, 'utf8');
  } else {
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
  }
}

// ----- SVG パース ----------------------------------------------------------
// KanjiVG の path / 番号位置を抽出する。
//   <path id="kvg:04e95-s1" kvg:type="㇐" d="M..."/>
//   <text transform="matrix(1 0 0 1 16.50 38.50)">1</text>
// path の出現順 = 画順（KanjiVG 仕様）。番号テキストの順序も画順と一致する。
function parseKanjiVgSvg(svgText, code) {
  const code5 = pad5(code);

  // path 抽出（self-closing or </path>）
  // kvg:type は属性欠落しているケースもあるため optional
  // d 属性 + id（ストローク番号付与確認用）+ type（任意）
  const pathRe = new RegExp(
    `<path\\s+([^>]*?)id="kvg:${code5}-s(\\d+)"([^>]*?)\\/>`,
    'g'
  );
  const strokes = [];
  let m;
  while ((m = pathRe.exec(svgText)) !== null) {
    const before = m[1] || '';
    const num = parseInt(m[2], 10);
    const after = m[3] || '';
    const all = before + after;

    const dMatch = all.match(/\bd="([^"]+)"/);
    const typeMatch = all.match(/kvg:type="([^"]+)"/);
    if (!dMatch) continue;

    strokes.push({
      num,
      d: dMatch[1],
      type: typeMatch ? typeMatch[1] : ''
    });
  }
  // 念のため番号順にソート（正規 KanjiVG は出現順=画順だが安全のため）
  strokes.sort((a, b) => a.num - b.num);

  // 番号位置の text transform=matrix(1 0 0 1 X Y) を抽出
  const numRe =
    /<text\s+transform="matrix\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)">\s*(\d+)\s*<\/text>/g;
  const numPosByNum = new Map();
  while ((m = numRe.exec(svgText)) !== null) {
    const x = parseFloat(m[5]);
    const y = parseFloat(m[6]);
    const num = parseInt(m[7], 10);
    numPosByNum.set(num, { x, y });
  }

  // viewBox を取得
  const vbMatch = svgText.match(/viewBox="([^"]+)"/);
  const viewBox = vbMatch ? vbMatch[1] : '0 0 109 109';

  return { strokes, numPosByNum, viewBox };
}

// ----- データ JS ファイル生成 ---------------------------------------------
function buildDataJs(opts) {
  const {
    kanji,
    code5,
    name,
    grade,
    strokes,
    numPosByNum,
    viewBox,
    songNumber,
    songReading
  } = opts;

  const nameUpper = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const constName = `KANJI_${nameUpper}`;

  const lines = [];
  lines.push(`// 「${kanji}」の書き順データ（${strokes.length}画）`);
  lines.push(`// 字形ストロークデータ: KanjiVG (Copyright (C) 2009-2011 Ulrich Apel)`);
  lines.push(`//   ライセンス: CC BY-SA 3.0  https://creativecommons.org/licenses/by-sa/3.0/`);
  lines.push(`//   出典: http://kanjivg.tagaini.net  (kanji/${code5}.svg)`);
  lines.push(`// viewBox: ${viewBox}（KanjiVG 標準）`);
  lines.push(`// 書き順は KanjiVG 正規順（自動抽出）`);
  if (grade) lines.push(`// 学年: ${grade}`);
  if (songNumber && songReading) {
    lines.push(`// 動作語出典: smileplanet ${songNumber}_${songReading}.pdf（手書きで songFragment / songLyric を埋めること）`);
  } else {
    lines.push(`// 動作語: 未取得（PDF を確認して songFragment / songLyric を手書きで埋めること）`);
  }
  lines.push(`export const ${constName} = {`);
  lines.push(`  char: '${kanji}',`);
  lines.push(`  reading: '',  // TODO: ひらがな読みを記入`);
  lines.push(`  meaning: '',  // TODO: 意味（短文）を記入`);
  lines.push(`  word: '',     // TODO: 縦書き表示用の単語（例: '井と'）を記入`);
  lines.push(`  strokeCount: ${strokes.length},`);
  lines.push(`  viewBox: '${viewBox}',`);
  lines.push(`  songLyric: '',  // TODO: 覚え歌全体（読み上げ用 1 行）を記入`);
  lines.push(`  strokes: [`);
  for (let i = 0; i < strokes.length; i++) {
    const s = strokes[i];
    const num = s.num;
    const color = STROKE_COLORS[(num - 1) % STROKE_COLORS.length];
    const labelHint = TYPE_TO_LABEL[s.type] || '';
    const np = numPosByNum.get(num) || { x: 0, y: 0 };
    lines.push(`    {`);
    lines.push(`      id: ${num},`);
    lines.push(`      color: '${color}',`);
    lines.push(`      label: '${labelHint}',     // TODO: 動作語に合わせて修正可（既定は KanjiVG kvg:type 由来のヒント）`);
    lines.push(`      songFragment: '', // TODO: PDF を見て動作語を記入`);
    lines.push(`      type: '${s.type}',`);
    lines.push(`      // KanjiVG kvg:${code5}-s${num}`);
    lines.push(`      d: '${s.d}',`);
    lines.push(`      numPos: { x: ${np.x}, y: ${np.y} }`);
    lines.push(`    }${i < strokes.length - 1 ? ',' : ''}`);
  }
  lines.push(`  ]`);
  lines.push(`};`);
  lines.push('');
  return { content: lines.join('\n'), constName };
}

// ----- メイン --------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.kanji || !args.code) {
    console.error('エラー: --kanji と --code は必須です。');
    console.error('例: node scripts/import-kanji.mjs --kanji 東 --code 06771 --name tou');
    process.exit(2);
  }

  const kanji = String(args.kanji);
  const code5 = pad5(String(args.code));
  const name = String(args.name || code5); // 既定はコードポイントをそのまま使う
  const grade = args.grade ? String(args.grade) : '';
  const songNumber = args.songNumber ? String(args.songNumber) : '';
  const songReading = args.songReading ? String(args.songReading) : '';
  const outDir = path.resolve(args.out ? String(args.out) : DEFAULT_OUT);
  const svgOutDir = path.resolve(args.svgOut ? String(args.svgOut) : DEFAULT_SVG_OUT);
  const pdfOutDir = path.resolve(args.pdfOut ? String(args.pdfOut) : DEFAULT_PDF_OUT);
  const force = !!args.force;
  const dryRun = !!args.dryRun;

  console.log(`[import-kanji] 漢字 = ${kanji}, code = ${code5}, name = ${name}`);
  console.log(`[import-kanji] 出力先 JS = ${outDir}`);
  console.log(`[import-kanji] SVG 保存先 = ${svgOutDir}`);

  // -------- 1) SVG ダウンロード（既存があればスキップ） --------------------
  await ensureDir(svgOutDir);
  const svgPath = path.join(svgOutDir, `${code5}.svg`);
  let svgText;
  if (await fileExists(svgPath)) {
    console.log(`[import-kanji] SVG は既に存在します: ${svgPath}（DL スキップ）`);
    svgText = await fs.readFile(svgPath, 'utf8');
  } else {
    const svgUrl = `https://github.com/KanjiVG/kanjivg/raw/master/kanji/${code5}.svg`;
    console.log(`[import-kanji] SVG を取得: ${svgUrl}`);
    if (dryRun) {
      console.log(`[import-kanji] (dryRun) SVG 書き込みをスキップ`);
      // dryRun でも fetch はする（後段のパースに必要）
      const res = await fetch(svgUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${svgUrl}`);
      svgText = await res.text();
    } else {
      await downloadFile(svgUrl, svgPath);
      svgText = await fs.readFile(svgPath, 'utf8');
      console.log(`[import-kanji] SVG 保存: ${svgPath}`);
    }
  }

  // -------- 2) SVG パース --------------------------------------------------
  const { strokes, numPosByNum, viewBox } = parseKanjiVgSvg(svgText, code5);
  if (strokes.length === 0) {
    throw new Error(
      `SVG に画パスが見つかりません（id="kvg:${code5}-sN" を期待）。code が正しいか確認してください。`
    );
  }
  console.log(`[import-kanji] 抽出した画数 = ${strokes.length}`);

  // -------- 3) smileplanet PDF DL（任意） ----------------------------------
  if (songNumber && songReading) {
    await ensureDir(pdfOutDir);
    const pdfName = `${songNumber}_${songReading}.pdf`;
    const pdfPath = path.join(pdfOutDir, pdfName);
    if (await fileExists(pdfPath)) {
      console.log(`[import-kanji] PDF は既に存在します: ${pdfPath}（DL スキップ）`);
    } else {
      const pdfUrl = `https://www.smileplanet.net/prekanji/dl/${pdfName}`;
      console.log(`[import-kanji] PDF を取得: ${pdfUrl}`);
      if (dryRun) {
        console.log(`[import-kanji] (dryRun) PDF 書き込みをスキップ`);
      } else {
        try {
          await downloadFile(pdfUrl, pdfPath);
          console.log(`[import-kanji] PDF 保存: ${pdfPath}`);
        } catch (err) {
          console.warn(`[import-kanji] 警告: PDF 取得に失敗しました（手動 DL してください）: ${err.message}`);
        }
      }
    }
  } else {
    console.log(`[import-kanji] --songNumber / --songReading 未指定のため PDF DL はスキップ`);
  }

  // -------- 4) データ JS 生成 ----------------------------------------------
  const { content, constName } = buildDataJs({
    kanji,
    code5,
    name,
    grade,
    strokes,
    numPosByNum,
    viewBox,
    songNumber,
    songReading
  });

  await ensureDir(outDir);
  // Session 272: 正本リポ（src/lib/data/kanji/{name}.js）対応・kanji- プレフィクスなし
  const dataFileName = `${name}.js`;
  const dataPath = path.join(outDir, dataFileName);
  if (dryRun) {
    console.log(`[import-kanji] (dryRun) 生成内容:`);
    console.log(content);
  } else {
    if ((await fileExists(dataPath)) && !force) {
      console.error(`エラー: ${dataPath} が既に存在します。--force で上書きしてください。`);
      process.exit(3);
    }
    await fs.writeFile(dataPath, content, 'utf8');
    console.log(`[import-kanji] データ JS 保存: ${dataPath}`);
  }

  // -------- 5) 次の手順を案内 ----------------------------------------------
  console.log('');
  console.log('=== 次の手順 ===');
  if (songNumber && songReading) {
    console.log(`1) PDF を開いて動作語を確認: ${path.join(pdfOutDir, `${songNumber}_${songReading}.pdf`)}`);
  } else {
    console.log('1) smileplanet で対応する PDF を確認（または独自に動作語を作成）');
  }
  console.log(`2) ${dataPath} を開き、TODO コメント付き項目を埋める:`);
  console.log('   - reading（ひらがな読み）');
  console.log('   - meaning（短文）');
  console.log('   - word（縦書き単語）');
  console.log('   - songLyric（覚え歌の読み上げ 1 行）');
  console.log('   - 各 stroke の label / songFragment（動作語）');
  console.log(`3) セット登録: node scripts/register-set.mjs --setId <id> --name <表示名> --kanji ${name}`);
  console.log(`   （複数字をまとめる場合: --kanji ${name},xxx,yyy のようにカンマ区切り）`);
  console.log('');
  console.log(`参考: 抽出した const 名 = ${constName}（import 時に使用）`);
}

main().catch((err) => {
  console.error('[import-kanji] 失敗:', err.message);
  process.exit(1);
});
