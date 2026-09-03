#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IN_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage2-zhtw.csv');
const OUT_CSV = path.join(ROOT, 'docs', 'research', 'kanji-translated-1000-stage3-ko.csv');

const KO = {
  在:'재',留:'류',資:'자격',格:'격',証:'증명',請:'신청',住:'거주',所:'장소',市:'시',区:'구',府:'부',都:'도',県:'현',国:'국',
  税:'세금',保:'보호',険:'보험',銀:'은',行:'은행',座:'좌석',契:'계약',約:'약속',支:'지불',払:'지불',料:'요금',届:'신고',通:'통지',
  知:'알다',確:'확인',認:'인정',許:'허가',可:'가능',登:'등록',録:'기록',受:'접수',付:'부착',窓:'창구',相:'상',談:'상담',注:'주의',
  意:'의미',禁:'금지',止:'정지',危:'위험',安:'안전',災:'재해',害:'해',避:'피난',難:'난이도',警:'경고',報:'보고',消:'소화',防:'방지',
  救:'구조',急:'긴급',病:'병',院:'병원',診:'진료',察:'관찰',薬:'약',症:'증상',状:'상태',健:'건강',康:'건강',介:'개호',護:'보호',
  感:'감염',染:'염색',検:'검사',査:'조사',交:'교통',線:'선',乗:'승차',降:'하차',港:'항구',航:'항공',郵:'우편',便:'편의/우편',
  配:'배달',送:'발송',荷:'짐',物:'물건',宅:'주택',部:'부분',屋:'집',賃:'임대료',管:'관리',理:'이치',券:'권',件:'건',制:'제도',
  法:'법',務:'업무',権:'권리',義:'의무',責:'책임',任:'책임',会:'회사',社:'회사',店:'가게',買:'구매',食:'식사',飲:'음료',
  学:'학습',校:'학교',教:'교육',字:'글자',文:'문장',読:'읽기',書:'쓰기',聞:'듣기',話:'대화',見:'보기',来:'오다',帰:'귀가',
  友:'친구',父:'아버지',母:'어머니',子:'아이',男:'남성',女:'여성',時:'시간',分:'분',円:'엔',駅:'역',電:'전기',車:'차',
  道:'길',前:'앞',後:'뒤',上:'위',下:'아래',中:'가운데',外:'밖',内:'안',東:'동',西:'서',南:'남',北:'북',
  愛:'사랑',希:'희망',望:'소망',勇:'용기',士:'선비'
};

function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1];if(q){if(ch==='\"'&&n==='\"'){cell+='\"';i++;}else if(ch==='\"')q=false;else cell+=ch;}else if(ch==='\"')q=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(ch!=='\r')cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function esc(v){const s=String(v??'');return /[",\n]/.test(s)?`\"${s.replaceAll('\"','\"\"')}\"`:s;}

const rows = parseCsv(await fs.readFile(IN_CSV,'utf8'));
const header = rows[0];
const ix = Object.fromEntries(header.map((h,i)=>[h,i]));

let changed = 0;
const out = rows.slice(1).map((r) => {
  const row = [...r];
  const ch = row[ix.char];
  if (KO[ch] && row[ix.ko] === row[ix.en]) {
    row[ix.ko] = KO[ch];
    changed++;
  }
  return row;
});

await fs.writeFile(OUT_CSV,[header.join(','),...out.map(r=>r.map(esc).join(','))].join('\n')+'\n','utf8');

const koEqualsEn = out.filter((r)=>r[ix.ko]===r[ix.en]).length;
const blankRows = out.filter((r)=>r.some((c)=>c==='')).length;
console.log(JSON.stringify({out:OUT_CSV,rows:out.length,changedKo:changed,koEqualsEn,blankRows},null,2));
