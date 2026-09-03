#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-zh-vi-ne.csv');
const KANJI_DIR = path.join(ROOT, 'src', 'lib', 'data', 'kanji');

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], n = text[i + 1];
    if (q) {
      if (ch === '"' && n === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function escJs(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function codeOf(ch) {
  return ch.codePointAt(0).toString(16).padStart(5, '0');
}

async function patchFile(row) {
  const file = path.join(KANJI_DIR, `u${codeOf(row.char)}.js`);
  let src = await fs.readFile(file, 'utf8');
  const block = `  meanings: { ja: '${escJs(row.jaMeaning)}', en: '${escJs(row.en)}', zh: '${escJs(row.zh)}', ko: '${escJs(row.ko)}', vi: '${escJs(row.vi)}', ne: '${escJs(row.ne)}' },\n`;
  if (src.includes('meanings: {')) {
    src = src.replace(/meanings:\s*\{[\s\S]*?\},\s*\n/, block);
  } else {
    src = src.replace(/(  word:[^\n]*\n)/, `$1${block}`);
  }
  await fs.writeFile(file, src, 'utf8');
}

async function main() {
  const parsed = parseCsv(await fs.readFile(CSV_PATH, 'utf8'));
  const header = parsed[0];
  const ix = Object.fromEntries(header.map((x, i) => [x, i]));
  const rows = parsed.slice(1).map((r) => ({
    char: r[ix.char],
    reading: r[ix.reading],
    jaMeaning: r[ix.jaMeaning],
    en: r[ix.en],
    zh: r[ix.zh],
    ko: r[ix.ko],
    vi: r[ix.vi],
    ne: r[ix.ne]
  }));
  if (rows.length !== 1000) throw new Error(`expected 1000 rows, got ${rows.length}`);

  for (const row of rows) await patchFile(row);
  console.log(JSON.stringify({ patched: rows.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
