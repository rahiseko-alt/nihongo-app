#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IN_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage4-merged300.csv');
const OUT_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage7-ko-unihan.csv');
const READINGS_TXT = path.join(ROOT, 'docs', 'research', 'unihan', 'Unihan_Readings.txt');

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

function esc(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function parseHangulMap(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const [u, field, rhs] = parts;
    if (field !== 'kHangul') continue;
    const cp = parseInt(u.replace('U+', ''), 16);
    const ch = String.fromCodePoint(cp);
    const first = rhs.split(' ')[0]?.split(':')[0]?.trim();
    if (first && !map.has(ch)) map.set(ch, first);
  }
  return map;
}

const rows = parseCsv(await fs.readFile(IN_CSV, 'utf8'));
const header = rows[0];
const ix = Object.fromEntries(header.map((h, i) => [h, i]));
const hangulMap = parseHangulMap(await fs.readFile(READINGS_TXT, 'utf8'));

let changed = 0;
const out = rows.slice(1).map((r) => {
  const row = [...r];
  const ch = row[ix.char];
  if (row[ix.ko] === row[ix.en] && hangulMap.has(ch)) {
    row[ix.ko] = hangulMap.get(ch);
    changed++;
  }
  return row;
});

await fs.writeFile(OUT_CSV, [header.join(','), ...out.map((r) => r.map(esc).join(','))].join('\n') + '\n', 'utf8');
const metrics = {
  rows: out.length,
  unique: new Set(out.map((r) => r[ix.char])).size,
  blankRows: out.filter((r) => r.some((c) => c === '')).length,
  koEqualsEn: out.filter((r) => r[ix.ko] === r[ix.en]).length,
  enEqualsJa: out.filter((r) => r[ix.en] === r[ix.jaMeaning]).length,
  zhCNEqualsChar: out.filter((r) => r[ix.zhCN] === r[ix.char]).length,
  zhTWEqualsChar: out.filter((r) => r[ix.zhTW] === r[ix.char]).length,
  changedKoByUnihan: changed
};
console.log(JSON.stringify({ out: OUT_CSV, ...metrics }, null, 2));
