#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RESEARCH = path.join(ROOT, 'docs', 'research');
const KANJIDIC_GZ = path.join(RESEARCH, 'kanjidic2.xml.gz');
const BASE_200 = path.join(RESEARCH, 'kanji-translated-200.csv');
const CANDIDATES = path.join(RESEARCH, 'kanji-1000-candidate-list.csv');

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function parseSimpleCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
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

function kanaToHiragana(s) {
  return s.replace(/[ァ-ン]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

async function loadKanjidic() {
  const xml = gunzipSync(await fs.readFile(KANJIDIC_GZ)).toString('utf8');
  const map = new Map();
  const blocks = xml.match(/<character>[\s\S]*?<\/character>/g) || [];
  for (const block of blocks) {
    const literal = block.match(/<literal>(.*?)<\/literal>/)?.[1];
    if (!literal) continue;
    const meanings = [...block.matchAll(/<meaning>([^<]+)<\/meaning>/g)].map((m) => m[1]);
    const kun = [...block.matchAll(/<reading r_type="ja_kun">([^<]+)<\/reading>/g)].map((m) => m[1].split('.')[0]);
    const on = [...block.matchAll(/<reading r_type="ja_on">([^<]+)<\/reading>/g)].map((m) => kanaToHiragana(m[1]));
    map.set(literal, {
      reading: kun[0] || on[0] || literal,
      meaning: meanings.slice(0, 2).join('/') || literal
    });
  }
  return map;
}

async function main() {
  const kanjidic = await loadKanjidic();
  const baseRows = parseSimpleCsv(await fs.readFile(BASE_200, 'utf8'));
  const baseHeader = baseRows[0];
  const base = new Map(baseRows.slice(1).map((row) => [row[0], row]));

  const candidateRows = parseSimpleCsv(await fs.readFile(CANDIDATES, 'utf8'));
  const chIndex = candidateRows[0].indexOf('char');
  const catIndex = candidateRows[0].indexOf('primaryCategory');
  const candidateChars = candidateRows.slice(1).map((row) => ({ char: row[chIndex], category: row[catIndex] }));

  const ordered = [];
  const seen = new Set();
  for (const row of base.values()) {
    ordered.push(row);
    seen.add(row[0]);
  }
  for (const c of candidateChars) {
    if (ordered.length >= 1000) break;
    if (seen.has(c.char)) continue;
    seen.add(c.char);
    const d = kanjidic.get(c.char) || { reading: c.char, meaning: c.char };
    ordered.push([
      c.char,
      d.reading,
      d.meaning,
      d.meaning,
      c.char,
      c.char,
      d.meaning,
      c.category,
      'draft_kanjidic_review'
    ]);
  }

  for (const size of [300, 400, 500, 600, 700, 800, 900, 1000]) {
    const out = path.join(RESEARCH, `kanji-translated-${size}.csv`);
    const rows = ordered.slice(0, size);
    await fs.writeFile(out, [baseHeader.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n') + '\n', 'utf8');
  }

  const checks = [];
  for (const size of [300, 400, 500, 600, 700, 800, 900, 1000]) {
    const rows = parseSimpleCsv(await fs.readFile(path.join(RESEARCH, `kanji-translated-${size}.csv`), 'utf8')).slice(1);
    checks.push({
      size,
      rows: rows.length,
      unique: new Set(rows.map((r) => r[0])).size,
      blankRows: rows.filter((r) => r.some((cell) => cell === '')).length,
      draftRows: rows.filter((r) => r[8] !== 'ok').length
    });
  }
  console.log(JSON.stringify(checks, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
