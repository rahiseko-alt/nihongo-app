#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const KANJI_DIR = path.join(ROOT, 'src', 'lib', 'data', 'kanji');

async function main() {
  const files = (await fs.readdir(KANJI_DIR)).filter((file) => /^u[0-9a-f]{5}\.js$/i.test(file));
  const missing = [];
  const oldZh = [];
  for (const file of files) {
    const src = await fs.readFile(path.join(KANJI_DIR, file), 'utf8');
    const hasAll = ['ja:', 'en:', 'zh:', 'ko:', 'vi:', 'ne:'].every((key) => src.includes(key));
    if (!src.includes('meanings: {') || !hasAll) missing.push(file);
    if (/zhCN|zhTW/.test(src)) oldZh.push(file);
  }
  const result = { files: files.length, missing: missing.length, oldZh: oldZh.length, missingSamples: missing.slice(0, 20), oldZhSamples: oldZh.slice(0, 20) };
  console.log(JSON.stringify(result, null, 2));
  if (files.length !== 1000 || missing.length || oldZh.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
