#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IN_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage1-zh.csv');
const OUT_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage2-zhtw.csv');
const VARIANT_TXT = path.join(ROOT, 'docs', 'research', 'unihan', 'Unihan_Variants.txt');

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

function parseTradMap(text) {
  const simpToTrad = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const [src, field, rhs] = parts;
    if (field !== 'kTraditionalVariant') continue;
    if (!src.startsWith('U+')) continue;
    const srcChar = String.fromCodePoint(parseInt(src.slice(2), 16)); // simplified
    const target = rhs.split(' ').find((x) => x.startsWith('U+'));
    if (!target) continue;
    const trad = String.fromCodePoint(parseInt(target.slice(2), 16));
    if (!simpToTrad.has(srcChar)) simpToTrad.set(srcChar, trad);
  }
  return simpToTrad;
}

const rows = parseCsv(await fs.readFile(IN_CSV, 'utf8'));
const header = rows[0];
const ix = Object.fromEntries(header.map((h, i) => [h, i]));
const simpToTrad = parseTradMap(await fs.readFile(VARIANT_TXT, 'utf8'));

let changed = 0;
const out = rows.slice(1).map((r) => {
  const row = [...r];
  const ch = row[ix.char];
  const cn = row[ix.zhCN];
  const tw = row[ix.zhTW];
  // Safe rule: only patch when tw is untouched (=char), cn differs from char, and cn has known traditional variant.
  if (tw === ch && cn !== ch && simpToTrad.has(cn)) {
    const candidate = simpToTrad.get(cn);
    if (candidate && candidate !== tw) {
      row[ix.zhTW] = candidate;
      changed++;
    }
  }
  return row;
});

await fs.writeFile(OUT_CSV, [header.join(','), ...out.map((r) => r.map(esc).join(','))].join('\n') + '\n', 'utf8');

const zhCNEqualsChar = out.filter((r) => r[ix.zhCN] === r[ix.char]).length;
const zhTWEqualsChar = out.filter((r) => r[ix.zhTW] === r[ix.char]).length;

console.log(JSON.stringify({ out: OUT_CSV, rows: out.length, changedZhTW: changed, zhCNEqualsChar, zhTWEqualsChar }, null, 2));
