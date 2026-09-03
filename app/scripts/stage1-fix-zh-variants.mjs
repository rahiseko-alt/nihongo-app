#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IN_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-reviewed.csv');
const OUT_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage1-zh.csv');
const VARIANT_TXT = path.join(ROOT, 'docs', 'research', 'unihan', 'Unihan_Variants.txt');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (q) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        q = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      q = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function esc(s) {
  const v = String(s ?? '');
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

function parseUnihanVariants(text) {
  const simp = new Map(); // trad -> simp
  const trad = new Map(); // simp -> trad
  const simpToTrad = new Map();
  const tradToSimp = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const [src, field, rhs] = parts;
    if (!src.startsWith('U+')) continue;
    const srcChar = String.fromCodePoint(parseInt(src.slice(2), 16));
    const targets = rhs.split(' ').filter((x) => x.startsWith('U+')).map((x) => String.fromCodePoint(parseInt(x.slice(2), 16)));
    if (!targets.length) continue;
    if (field === 'kSimplifiedVariant') {
      simp.set(srcChar, targets[0]); // src is trad
      tradToSimp.set(srcChar, targets[0]);
      if (!simpToTrad.has(targets[0])) simpToTrad.set(targets[0], srcChar);
    }
    if (field === 'kTraditionalVariant') {
      trad.set(srcChar, targets[0]); // src is simp
      simpToTrad.set(srcChar, targets[0]);
      if (!tradToSimp.has(targets[0])) tradToSimp.set(targets[0], srcChar);
    }
  }
  return { simp, trad, simpToTrad, tradToSimp };
}

function toZhCNOnly(ch, maps) {
  const { tradToSimp } = maps;
  if (tradToSimp.has(ch)) return tradToSimp.get(ch);
  return ch;
}

const csvRows = parseCsv(await fs.readFile(IN_CSV, 'utf8'));
const header = csvRows[0];
const ix = Object.fromEntries(header.map((h, i) => [h, i]));
const variantText = await fs.readFile(VARIANT_TXT, 'utf8');
const maps = parseUnihanVariants(variantText);

let changedZhCN = 0;
let remainingCNEqualsChar = 0;
let remainingTWEqualsChar = 0;

const outRows = csvRows.slice(1).map((row) => {
  const ch = row[ix.char];
  const cn = toZhCNOnly(ch, maps);
  const next = [...row];
  if (next[ix.zhCN] !== cn) {
    next[ix.zhCN] = cn;
    changedZhCN++;
  }
  // Keep zhTW untouched in this stage; only guaranteed-improvement updates.
  if (next[ix.zhCN] === ch) remainingCNEqualsChar++;
  if (next[ix.zhTW] === ch) remainingTWEqualsChar++;
  return next;
});

await fs.writeFile(
  OUT_CSV,
  [header.join(','), ...outRows.map((r) => r.map(esc).join(','))].join('\n') + '\n',
  'utf8'
);

console.log(
  JSON.stringify(
    {
      out: OUT_CSV,
      rows: outRows.length,
      changedZhCN,
      remainingCNEqualsChar,
      remainingTWEqualsChar
    },
    null,
    2
  )
);
