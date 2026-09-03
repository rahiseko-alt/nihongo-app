#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-existing-94.csv');

const MEANINGS = {
  一: ['one', '一', '一', '하나'], 二: ['two', '二', '二', '둘'], 三: ['three', '三', '三', '셋'],
  四: ['four', '四', '四', '넷'], 五: ['five', '五', '五', '다섯'], 六: ['six', '六', '六', '여섯'],
  七: ['seven', '七', '七', '일곱'], 八: ['eight', '八', '八', '여덟'], 九: ['nine', '九', '九', '아홉'],
  十: ['ten', '十', '十', '열'], 百: ['hundred', '百', '百', '백'], 千: ['thousand', '千', '千', '천'],
  万: ['ten thousand', '万', '萬', '만'], 上: ['up', '上', '上', '위'], 下: ['down', '下', '下', '아래'],
  中: ['middle', '中', '中', '가운데'], 左: ['left', '左', '左', '왼쪽'], 右: ['right', '右', '右', '오른쪽'],
  前: ['front', '前', '前', '앞'], 後: ['back', '后', '後', '뒤'], 内: ['inside', '内', '內', '안'],
  外: ['outside', '外', '外', '밖'], 人: ['person', '人', '人', '사람'], 女: ['woman', '女', '女', '여자'],
  男: ['man', '男', '男', '남자'], 子: ['child', '孩子', '孩子', '아이'], 母: ['mother', '母亲', '母親', '어머니'],
  父: ['father', '父亲', '父親', '아버지'], 友: ['friend', '朋友', '朋友', '친구'], 日: ['day', '日', '日', '날'],
  時: ['time', '时间', '時間', '시간'], 今: ['now', '现在', '現在', '지금'], 午: ['noon', '午', '午', '정오'],
  半: ['half', '半', '半', '반'], 天: ['sky', '天', '天', '하늘'], 東: ['east', '东', '東', '동쪽'],
  西: ['west', '西', '西', '서쪽'], 南: ['south', '南', '南', '남쪽'], 北: ['north', '北', '北', '북쪽'],
  京: ['capital', '京', '京', '수도'], 都: ['metropolis', '都', '都', '도시'], 県: ['prefecture', '县', '縣', '현'],
  国: ['country', '国', '國', '나라'], 土: ['earth', '土', '土', '흙'], 山: ['mountain', '山', '山', '산'],
  海: ['sea', '海', '海', '바다'], 空: ['sky', '天空', '天空', '하늘'], 雨: ['rain', '雨', '雨', '비'],
  水: ['water', '水', '水', '물'], 火: ['fire', '火', '火', '불'], 木: ['tree', '树', '樹', '나무'],
  金: ['money', '金', '金', '돈'], 気: ['spirit', '气', '氣', '기운'], 文: ['sentence', '文', '文', '글'],
  字: ['character', '字', '字', '글자'], 語: ['language', '语言', '語言', '언어'], 話: ['talk', '说话', '說話', '말'],
  読: ['read', '读', '讀', '읽다'], 書: ['write', '写', '寫', '쓰다'], 聞: ['hear', '听', '聽', '듣다'],
  見: ['see', '看', '看', '보다'], 学: ['study', '学', '學', '배우다'], 校: ['school', '学校', '學校', '학교'],
  先: ['ahead', '先', '先', '먼저'], 入: ['enter', '进入', '進入', '들어가다'], 出: ['exit', '出去', '出去', '나가다'],
  会: ['meet', '会', '會', '만나다'], 帰: ['return', '回去', '回去', '돌아가다'], 来: ['come', '来', '來', '오다'],
  行: ['go', '去', '去', '가다'], 名: ['name', '名字', '名字', '이름'], 円: ['yen', '日元', '日圓', '엔'],
  生: ['life', '生', '生', '삶'], 白: ['white', '白', '白', '흰색'], 英: ['English', '英语', '英語', '영어'],
  駅: ['station', '车站', '車站', '역'], 電: ['electricity', '电', '電', '전기'], 車: ['car', '车', '車', '차'],
  道: ['road', '道路', '道路', '길'], 家: ['house', '家', '家', '집'], 室: ['room', '房间', '房間', '방'],
  店: ['shop', '店', '店', '가게'], 社: ['company', '公司', '公司', '회사'], 食: ['eat', '吃', '吃', '먹다'],
  飲: ['drink', '喝', '喝', '마시다'], 買: ['buy', '买', '買', '사다'], 何: ['what', '什么', '什麼', '무엇'],
  毎: ['every', '每', '每', '매'], 分: ['minute', '分', '分', '분'], 本: ['book', '书', '書', '책'],
  村: ['village', '村', '村', '마을'], 町: ['town', '町', '町', '마을'], 口: ['mouth', '口', '口', '입'],
  休: ['rest', '休息', '休息', '쉬다']
};

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function main() {
  const setsPath = path.join(ROOT, 'src', 'lib', 'data', 'sets.js');
  const { SETS, SET_ORDER } = await import(pathToFileURL(setsPath).href);
  const byChar = new Map();
  for (const setId of SET_ORDER) {
    for (const k of SETS[setId].kanji) {
      if (!byChar.has(k.char)) byChar.set(k.char, { char: k.char, reading: k.reading || '', category: SETS[setId].category });
    }
  }
  const header = ['char', 'reading', 'jaMeaning', 'en', 'zhCN', 'zhTW', 'ko', 'category', 'status'];
  const rows = [...byChar.values()].map((row) => {
    const m = MEANINGS[row.char] || ['', '', '', ''];
    return [row.char, row.reading, m[0], m[0], m[1], m[2], m[3], row.category, m[0] ? 'ok' : 'missing_translation'];
  });
  await fs.writeFile(OUT, [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n') + '\n', 'utf8');
  const missing = rows.filter((r) => r[8] !== 'ok');
  console.log(JSON.stringify({ out: OUT, rows: rows.length, missingTranslations: missing.map((r) => r[0]) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
