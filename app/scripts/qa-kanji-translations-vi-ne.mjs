#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-zh-vi-ne.csv');
const OUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-zh-vi-ne-qa.md');

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

function hasDevanagari(value) {
  return /[\u0900-\u097F]/.test(value);
}

function rowRef(i, row, ix, reason) {
  return `- row ${i + 2}: ${row[ix.char]} ${reason}`;
}

async function main() {
  const rows = parseCsv(await fs.readFile(INPUT, 'utf8'));
  const header = rows[0];
  const ix = Object.fromEntries(header.map((x, i) => [x, i]));
  const body = rows.slice(1);
  const unique = new Set(body.map((r) => r[ix.char]));

  const findings = {
    blankZh: [],
    blankVi: [],
    blankNe: [],
    viEqualsEn: [],
    neEqualsEn: [],
    neNoDevanagari: [],
    longVi: [],
    longNe: [],
    newline: [],
    fallbackVi: [],
    fallbackNe: []
  };

  body.forEach((row, i) => {
    if (!row[ix.zh]) findings.blankZh.push(rowRef(i, row, ix, 'blank zh'));
    if (!row[ix.vi]) findings.blankVi.push(rowRef(i, row, ix, 'blank vi'));
    if (!row[ix.ne]) findings.blankNe.push(rowRef(i, row, ix, 'blank ne'));
    if (row[ix.vi] && row[ix.vi] === row[ix.en]) findings.viEqualsEn.push(rowRef(i, row, ix, 'vi equals en'));
    if (row[ix.ne] && row[ix.ne] === row[ix.en]) findings.neEqualsEn.push(rowRef(i, row, ix, 'ne equals en'));
    if (row[ix.ne] && !hasDevanagari(row[ix.ne])) findings.neNoDevanagari.push(rowRef(i, row, ix, `ne has no Devanagari: ${row[ix.ne]}`));
    if ((row[ix.vi] ?? '').length > 28) findings.longVi.push(rowRef(i, row, ix, `long vi: ${row[ix.vi]}`));
    if ((row[ix.ne] ?? '').length > 28) findings.longNe.push(rowRef(i, row, ix, `long ne: ${row[ix.ne]}`));
    if ([ix.zh, ix.vi, ix.ne].some((col) => /[\r\n]/.test(row[col] ?? ''))) findings.newline.push(rowRef(i, row, ix, 'newline in meaning'));
    if (row[ix.vi] === 'khái niệm') findings.fallbackVi.push(rowRef(i, row, ix, `fallback vi for ${row[ix.en]}`));
    if (row[ix.ne] === 'अर्थ') findings.fallbackNe.push(rowRef(i, row, ix, `fallback ne for ${row[ix.en]}`));
  });

  const blockers = [
    body.length !== 1000 ? `row count ${body.length} is not 1000` : null,
    unique.size !== 1000 ? `unique kanji ${unique.size} is not 1000` : null,
    findings.blankZh.length ? `blank zh ${findings.blankZh.length}` : null,
    findings.blankVi.length ? `blank vi ${findings.blankVi.length}` : null,
    findings.blankNe.length ? `blank ne ${findings.blankNe.length}` : null,
    findings.viEqualsEn.length ? `vi equals en ${findings.viEqualsEn.length}` : null,
    findings.neEqualsEn.length ? `ne equals en ${findings.neEqualsEn.length}` : null,
    findings.neNoDevanagari.length ? `ne no Devanagari ${findings.neNoDevanagari.length}` : null,
    findings.newline.length ? `newline ${findings.newline.length}` : null
  ].filter(Boolean);

  const lines = [
    '# Kanji Translation QA',
    '',
    `Status: ${blockers.length ? 'FAIL' : 'PASS'}`,
    `Rows: ${body.length}`,
    `Unique kanji: ${unique.size}`,
    '',
    '## Counts',
    '',
    ...Object.entries(findings).map(([key, value]) => `- ${key}: ${value.length}`),
    '',
    '## Blockers',
    '',
    ...(blockers.length ? blockers.map((x) => `- ${x}`) : ['- none']),
    '',
    '## 100-Row Blocks',
    ''
  ];

  for (let start = 0; start < body.length; start += 100) {
    const block = body.slice(start, start + 100);
    const blockIssues = block.filter((row) => !row[ix.zh] || !row[ix.vi] || !row[ix.ne] || row[ix.vi] === row[ix.en] || row[ix.ne] === row[ix.en] || !hasDevanagari(row[ix.ne]));
    lines.push(`- ${start + 1}-${start + block.length}: rows=${block.length}, issues=${blockIssues.length}`);
  }

  lines.push('', '## Samples', '');
  for (const [key, value] of Object.entries(findings)) {
    if (!value.length) continue;
    lines.push(`### ${key}`, '', ...value.slice(0, 20), '');
  }

  await fs.writeFile(OUT, lines.join('\n') + '\n', 'utf8');
  console.log(JSON.stringify({ status: blockers.length ? 'FAIL' : 'PASS', rows: body.length, unique: unique.size, output: OUT, counts: Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length])) }, null, 2));
  if (blockers.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
