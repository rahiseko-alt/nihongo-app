#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage4-merged300.csv');
const REVIEW400 = path.join(ROOT, 'docs', 'research', 'kanji-translated-400-reviewed.csv');
const OUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage5-merged400.csv');

function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1];if(q){if(ch==='\"'&&n==='\"'){cell+='\"';i++;}else if(ch==='\"')q=false;else cell+=ch;}else if(ch==='\"')q=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(ch!=='\r')cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function esc(v){const s=String(v??'');return /[",\n]/.test(s)?`\"${s.replaceAll('\"','\"\"')}\"`:s;}

const baseRows = parseCsv(await fs.readFile(BASE,'utf8'));
const revRows = parseCsv(await fs.readFile(REVIEW400,'utf8'));
const h = baseRows[0];
const ib = Object.fromEntries(h.map((x,i)=>[x,i]));
const hr = revRows[0];
const ir = Object.fromEntries(hr.map((x,i)=>[x,i]));

const revMap = new Map(revRows.slice(1).map(r=>[r[ir.char], r]));
let merged = 0;

const out = baseRows.slice(1).map((r)=>{
  const row=[...r];
  const hit=revMap.get(row[ib.char]);
  if(hit){
    row[ib.reading]=hit[ir.reading];
    row[ib.jaMeaning]=hit[ir.jaMeaning];
    row[ib.en]=hit[ir.en];
    row[ib.zhCN]=hit[ir.zhCN];
    row[ib.zhTW]=hit[ir.zhTW];
    row[ib.ko]=hit[ir.ko];
    row[ib.status]='ok';
    merged++;
  }
  return row;
});

await fs.writeFile(OUT,[h.join(','),...out.map(r=>r.map(esc).join(','))].join('\n')+'\n','utf8');
const metrics = {
  rows: out.length,
  unique: new Set(out.map(r=>r[ib.char])).size,
  blankRows: out.filter(r=>r.some(c=>c==='')).length,
  enEqualsJa: out.filter(r=>r[ib.en]===r[ib.jaMeaning]).length,
  koEqualsEn: out.filter(r=>r[ib.ko]===r[ib.en]).length,
  zhCNEqualsChar: out.filter(r=>r[ib.zhCN]===r[ib.char]).length,
  zhTWEqualsChar: out.filter(r=>r[ib.zhTW]===r[ib.char]).length,
  mergedFrom400: merged
};
console.log(JSON.stringify({out:OUT,...metrics},null,2));
