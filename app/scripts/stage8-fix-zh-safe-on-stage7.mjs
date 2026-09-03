#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IN_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage7-ko-unihan.csv');
const OUT_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage8-zhko.csv');
const VARIANT_TXT = path.join(ROOT, 'docs', 'research', 'unihan', 'Unihan_Variants.txt');

function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1];if(q){if(ch==='\"'&&n==='\"'){cell+='\"';i++;}else if(ch==='\"')q=false;else cell+=ch;}else if(ch==='\"')q=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(ch!=='\r')cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function esc(v){const s=String(v??'');return /[",\n]/.test(s)?`\"${s.replaceAll('\"','\"\"')}\"`:s;}

function parseMaps(text){
  const tradToSimp = new Map();
  const simpToTrad = new Map();
  for(const line of text.split(/\r?\n/)){
    if(!line || line.startsWith('#')) continue;
    const [src,field,rhs] = line.split('\t');
    if(!src || !field || !rhs || !src.startsWith('U+')) continue;
    const srcCh = String.fromCodePoint(parseInt(src.slice(2),16));
    const target = rhs.split(' ').find(t=>t.startsWith('U+'));
    if(!target) continue;
    const tarCh = String.fromCodePoint(parseInt(target.slice(2),16));
    if(field==='kSimplifiedVariant'){ tradToSimp.set(srcCh, tarCh); if(!simpToTrad.has(tarCh)) simpToTrad.set(tarCh, srcCh); }
    if(field==='kTraditionalVariant'){ simpToTrad.set(srcCh, tarCh); if(!tradToSimp.has(tarCh)) tradToSimp.set(tarCh, srcCh); }
  }
  return {tradToSimp, simpToTrad};
}

const rows = parseCsv(await fs.readFile(IN_CSV,'utf8'));
const h = rows[0];
const ix = Object.fromEntries(h.map((x,i)=>[x,i]));
const {tradToSimp, simpToTrad} = parseMaps(await fs.readFile(VARIANT_TXT,'utf8'));

let cnChanged=0, twChanged=0;
const out = rows.slice(1).map(r=>{
  const row=[...r];
  const ch=row[ix.char];
  if(row[ix.zhCN]===ch && tradToSimp.has(ch)){ row[ix.zhCN]=tradToSimp.get(ch); cnChanged++; }
  const currentCN=row[ix.zhCN];
  if(row[ix.zhTW]===ch && currentCN!==ch && simpToTrad.has(currentCN)){ const tw=simpToTrad.get(currentCN); if(tw && tw!==row[ix.zhTW]){ row[ix.zhTW]=tw; twChanged++; } }
  return row;
});

await fs.writeFile(OUT_CSV,[h.join(','),...out.map(r=>r.map(esc).join(','))].join('\n')+'\n','utf8');
const metrics={rows:out.length,unique:new Set(out.map(r=>r[ix.char])).size,blankRows:out.filter(r=>r.some(c=>c==='')).length,zhCNEqualsChar:out.filter(r=>r[ix.zhCN]===r[ix.char]).length,zhTWEqualsChar:out.filter(r=>r[ix.zhTW]===r[ix.char]).length,koEqualsEn:out.filter(r=>r[ix.ko]===r[ix.en]).length,enEqualsJa:out.filter(r=>r[ix.en]===r[ix.jaMeaning]).length,cnChanged,twChanged};
console.log(JSON.stringify({out:OUT_CSV,...metrics},null,2));
