#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RESEARCH = path.join(ROOT, 'docs', 'research');
const BASE = path.join(RESEARCH, 'kanji-translated-1000-stage4-merged300.csv');
const OUT = path.join(RESEARCH, 'kanji-translated-1000-final-safe.csv');
const REVIEW_FILES = [
  'kanji-translated-400-reviewed.csv',
  'kanji-translated-500-reviewed.csv',
  'kanji-translated-600-reviewed.csv',
  'kanji-translated-700-reviewed.csv',
  'kanji-translated-800-reviewed.csv',
  'kanji-translated-900-reviewed.csv',
  'kanji-translated-1000-reviewed.csv'
].map((f) => path.join(RESEARCH, f));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const n = text[i + 1];
    if (q) {
      if (ch === '"' && n === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function esc(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function rowPenalty(row, ix) {
  let p = 0;
  if (row[ix.en] === row[ix.jaMeaning]) p += 1;
  if (row[ix.ko] === row[ix.en]) p += 1;
  if (row[ix.zhCN] === row[ix.char]) p += 1;
  if (row[ix.zhTW] === row[ix.char]) p += 1;
  return p;
}

function qualityMetrics(rows, ix) {
  return {
    rows: rows.length,
    unique: new Set(rows.map((r) => r[ix.char])).size,
    blankRows: rows.filter((r) => r.some((c) => c === '')).length,
    enEqualsJa: rows.filter((r) => r[ix.en] === r[ix.jaMeaning]).length,
    koEqualsEn: rows.filter((r) => r[ix.ko] === r[ix.en]).length,
    zhCNEqualsChar: rows.filter((r) => r[ix.zhCN] === r[ix.char]).length,
    zhTWEqualsChar: rows.filter((r) => r[ix.zhTW] === r[ix.char]).length
  };
}

const baseRows = parseCsv(await fs.readFile(BASE, 'utf8'));
const header = baseRows[0];
const ix = Object.fromEntries(header.map((h, i) => [h, i]));
let current = baseRows.slice(1).map((r) => [...r]);
const stats = [];

for (const file of REVIEW_FILES) {
  const rows = parseCsv(await fs.readFile(file, 'utf8'));
  const h2 = rows[0];
  const ix2 = Object.fromEntries(h2.map((h, i) => [h, i]));
  const map = new Map(rows.slice(1).map((r) => [r[ix2.char], r]));
  let accepted = 0;
  let rejected = 0;
  current = current.map((row) => {
    const cand = map.get(row[ix.char]);
    if (!cand) return row;
    const baseP = rowPenalty(row, ix);
    const candRow = [...row];
    candRow[ix.reading] = cand[ix2.reading];
    candRow[ix.jaMeaning] = cand[ix2.jaMeaning];
    candRow[ix.en] = cand[ix2.en];
    candRow[ix.zhCN] = cand[ix2.zhCN];
    candRow[ix.zhTW] = cand[ix2.zhTW];
    candRow[ix.ko] = cand[ix2.ko];
    candRow[ix.status] = 'ok';
    const candP = rowPenalty(candRow, ix);
    if (candP < baseP) {
      accepted++;
      return candRow;
    }
    rejected++;
    return row;
  });
  stats.push({ file: path.basename(file), accepted, rejected, metrics: qualityMetrics(current, ix) });
}

await fs.writeFile(
  OUT,
  [header.join(','), ...current.map((r) => r.map(esc).join(','))].join('\n') + '\n',
  'utf8'
);

console.log(JSON.stringify({ out: OUT, steps: stats }, null, 2));
