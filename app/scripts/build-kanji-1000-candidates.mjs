#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'docs', 'research');
const CANDIDATE_CSV = path.join(OUT_DIR, 'kanji-1000-candidate-list.csv');
const AUDIT_MD = path.join(OUT_DIR, 'kanji-1000-existing-audit.md');
const SUMMARY_MD = path.join(OUT_DIR, 'kanji-1000-candidate-summary.md');

const CATEGORY_TARGETS = {
  life_admin: 250,
  jft_life: 250,
  exam_jlpt: 300,
  work_school: 120,
  culture_popular: 80
};

const CATEGORY_LABELS = {
  life_admin: '生活・行政',
  jft_life: 'JFT/いろどり生活日本語',
  exam_jlpt: 'JLPT N5-N3相当',
  work_school: '仕事・学校',
  culture_popular: '文化・人気'
};

const GRADE_STRINGS = {
  1: '一右雨円王音下火花貝学気九休玉金空月犬見口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六五',
  2: '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話',
  3: '悪安暗医委意育員院飲運泳駅央横屋温化荷界階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和開',
  4: '愛案以衣位囲胃印英栄塩億加果貨課芽改械害各覚完官管関観願希季紀喜旗器機議求泣救給挙漁共協鏡競極訓軍郡径型景芸欠結建健験固功好候航康告差菜最材昨札刷殺察参産散残士氏史司試児治辞失借種周祝順初松笑唱焼象照賞臣信成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲貯兆腸低底停的典伝徒努灯堂働特得毒熱念敗梅博飯飛費必票標不夫付府副粉兵別辺変便包法望牧末満未脈民無約勇要養浴利陸良料量輪類令冷例歴連老労録街',
  5: '圧移因永営衛易益液演応往桜恩可仮価河過賀解格確額刊幹慣眼基寄規技義逆久旧居許境均禁句群経潔件券険検限現減故個護効厚耕鉱構興講混査再災妻採際在財罪雑酸賛支志枝師資飼示似識質舎謝授修述術準序招承証条状常情織職制性政勢精製税責績接設舌絶銭祖素総造像増則測属率損退貸態団断築張提程適敵統銅導徳独任燃能破犯判版比肥非備俵評貧布婦富武復複仏編弁保墓報豊防貿暴務夢迷綿輸余預容略留領快',
  6: '異遺域宇映延沿我灰拡革閣割株干巻看簡危机貴疑吸供胸郷勤筋系敬警劇激穴絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除将傷障城蒸針仁垂推寸盛聖誠宣専泉洗染善奏窓創装層操蔵臓存尊宅担探誕段暖値宙忠著庁頂潮賃痛展討党糖届難乳認納脳派拝背肺俳班晩否批秘腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優幼欲翌乱卵覧裏律臨朗論揮'
};

const TARGETED_SEEDS = {
  life_admin:
    '在留資格証明書申請住住所市区町村県府都国番号氏名生年月日性別役所庁税保険年金銀行口座印鑑契約支払料金無料有料期限更新変更届通知確認許可認定登録受付窓口相談案内注意禁止危険安全災害避難警報消防救急病院診察薬症状健康介護入院退院感染検査予防交通駅電車道線乗降出口入口港空港航空郵便配送荷物水道電気ガス住宅部屋家賃管理証券件制法務権義責任',
  jft_life:
    '日本人人今何時分円百千万駅電車道口入出北南東西右左前後上下中外内名国語英会社店買食飲水火木金土雨空海山一二三四五六七八九十午半毎先学生学校文字読書聞話見行来帰休友父母子男女家室町村天気大大小少多早遅新古高安長短近遠便利不便好き嫌い良悪楽忙電話写真料理洗買売使作待持取置開閉',
  exam_jlpt:
    '一二三四五六七八九十百千万日月火水木金土曜年時分半今毎何誰上下左右前後中外内東西南北大小多少高安新古白黒赤青円人男女子父母友先生学校大学学生会社店駅電車車道入口出口国語英語日本本名町村県都京室家食飲買見聞読書話行来帰休会社仕事私自分今日明日昨日来週先週今年去年来年午前午後',
  work_school:
    '仕事勤務会社社員職業雇用契約給料賃金残業休暇出勤退勤退職面接履歴書研修技能実習特定介護製造建設農業宿泊外食教育学校先生学生留学試験合格不合格成績授業教室図書館入学卒業出席欠席遅刻早退宿題提出相談支援保育幼稚園小中高大学専門資格経験能力作業安全確認報告連絡',
  culture_popular:
    '愛夢希望幸心和桜花空海山川月星光旅道神社寺茶祭侍忍龍武美勇日本富士京都大阪東京北海道沖縄温泉料理寿司着物歌舞伎漢字書道芸術音楽映画漫画家族友達自然森林雨雪風春夏秋冬朝夕夜火水木金土鳥魚犬猫'
};

const EXCLUDE_LAST = new Set(Array.from('蚕俵俳冊尺穀后孝蚊牙瓦餓貝臼丙凹凸鬱畝虞俺柿媛阪栃茨阜埼'));
const RISK_REDUCTION = new Set(charsOf('証険税保年金契約払届許可認定登録確認注意禁止危険災害避難警報消防救急病院診察薬症状感染検査雇勤退職欠席遅刻'));
const PRODUCTIVE = new Set(charsOf('人在留資格証明書申請住所市区町村県府都国番号氏名生年月日性別役所庁税保険年金銀行口座契約支払料期限更新変更届通知確認許可登録受付相談案内注意禁止危険安全災害避難病院診察薬健康介護交通駅電車道線会社店買食飲学校仕事勤務雇用給料休暇面接履歴研修技能実習特定教育授業出席欠席提出報告連絡'));

function charsOf(str) {
  return Array.from(str).filter((ch) => /\p{Script=Han}/u.test(ch));
}

function uniq(chars) {
  return [...new Set(chars)];
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

async function loadExisting() {
  const setsPath = path.join(ROOT, 'src', 'lib', 'data', 'sets.js');
  const mod = await import(pathToFileURL(setsPath).href);
  const records = [];
  for (const setId of mod.SET_ORDER) {
    const set = mod.SETS[setId];
    for (const k of set.kanji ?? []) {
      records.push({
        char: k.char,
        reading: k.reading || '',
        meaning: k.meaning || '',
        setId,
        category: set.category
      });
    }
  }
  const byChar = new Map();
  for (const row of records) {
    const cur = byChar.get(row.char) ?? {
      char: row.char,
      reading: row.reading,
      meaning: row.meaning,
      setIds: [],
      categories: new Set()
    };
    cur.setIds.push(row.setId);
    cur.categories.add(row.category);
    if (!cur.reading && row.reading) cur.reading = row.reading;
    if (!cur.meaning && row.meaning) cur.meaning = row.meaning;
    byChar.set(row.char, cur);
  }
  return [...byChar.values()].map((row) => ({
    ...row,
    categories: [...row.categories]
  }));
}

function buildGradeMap() {
  const map = new Map();
  for (const [grade, str] of Object.entries(GRADE_STRINGS)) {
    for (const ch of charsOf(str)) {
      map.set(ch, Number(grade));
    }
  }
  return map;
}

function sourceReasonFor(ch, category, gradeMap, targeted) {
  const grade = gradeMap.get(ch);
  const base = grade ? `文部科学省 学年別漢字配当表 ${grade}年` : '生活・在留文脈の追加候補';
  if (targeted.has(ch)) return `${base} / ${CATEGORY_LABELS[category]}の直接候補`;
  return `${base} / ${CATEGORY_LABELS[category]}の補完候補`;
}

function scoreCandidate(ch, categories, gradeMap) {
  const has = (cat) => categories.includes(cat);
  const grade = gradeMap.get(ch);
  const residentLife =
    (has('life_admin') ? 30 : 0) ||
    (has('work_school') ? 22 : 0) ||
    (has('jft_life') ? 18 : 0) ||
    (has('exam_jlpt') ? 15 : 0) ||
    (has('culture_popular') ? 4 : 0);
  const testStudy = Math.min(20,
    (has('exam_jlpt') ? 16 : 0) +
    (has('jft_life') ? 8 : 0) +
    (grade && grade <= 3 ? 8 : grade ? 5 : 0)
  );
  const productivity = Math.min(15,
    (grade ? 8 : 0) +
    categories.length * 4 +
    (PRODUCTIVE.has(ch) ? 8 : 0) +
    (grade && grade <= 3 ? 3 : 0)
  );
  const writingBackbone = grade ? Math.max(10, 16 - grade * 1.2) : 3;
  const riskReduction = RISK_REDUCTION.has(ch) ? 10 : has('life_admin') ? 7 : has('work_school') ? 5 : 0;
  const motivation = has('culture_popular') ? 10 : ['愛', '夢', '幸', '心', '和', '桜', '旅', '道', '神', '社', '寺', '茶', '祭'].includes(ch) ? 6 : 0;
  const selectionScore = Math.round(residentLife + testStudy + productivity + writingBackbone + riskReduction + motivation);
  const hasDirectPurpose = categories.some((cat) => cat !== 'exam_jlpt');
  const reviewStatus = selectionScore >= 70 ? 'accepted' : selectionScore >= 55 || (hasDirectPurpose && selectionScore >= 40) ? 'conditional' : 'rejected';
  return {
    selectionScore,
    reviewStatus,
    scoreBreakdown: `life:${residentLife}|study:${testStudy}|word:${productivity}|stroke:${writingBackbone}|risk:${riskReduction}|motivation:${motivation}`
  };
}

function buildCandidates(existing) {
  const gradeMap = buildGradeMap();
  const allEducation = uniq(Object.values(GRADE_STRINGS).flatMap(charsOf))
    .filter((ch) => !EXCLUDE_LAST.has(ch));
  const existingChars = existing.map((row) => row.char);
  const existingByChar = new Map(existing.map((row) => [row.char, row]));

  const categorySeeds = Object.fromEntries(
    Object.keys(CATEGORY_TARGETS).map((category) => [category, new Set(charsOf(TARGETED_SEEDS[category]))])
  );
  const highPriority = uniq([
    ...charsOf(TARGETED_SEEDS.life_admin),
    ...charsOf(TARGETED_SEEDS.jft_life),
    ...charsOf(TARGETED_SEEDS.work_school),
    ...charsOf(TARGETED_SEEDS.culture_popular),
    ...charsOf(TARGETED_SEEDS.exam_jlpt),
    ...existingChars
  ]);
  const poolChars = uniq([...highPriority, ...allEducation]);

  const priorityCounters = new Map();
  const scoredRows = poolChars.map((ch, index) => {
    const categories = Object.keys(categorySeeds).filter((category) => categorySeeds[category].has(ch));
    if (categories.length === 0) categories.push('exam_jlpt');
    const primaryCategory = categories[0];
    const nextPriority = (priorityCounters.get(primaryCategory) ?? 0) + 1;
    priorityCounters.set(primaryCategory, nextPriority);
    const existingRow = existingByChar.get(ch);
    const directCategories = categories.filter((category) => categorySeeds[category].has(ch));
    const sourceReason = directCategories.length
      ? `${gradeMap.get(ch) ? `文部科学省 学年別漢字配当表 ${gradeMap.get(ch)}年` : '生活・在留文脈の追加候補'} / ${directCategories.map((cat) => CATEGORY_LABELS[cat]).join('・')}の直接候補`
      : sourceReasonFor(ch, primaryCategory, gradeMap, categorySeeds[primaryCategory]);
    const score = scoreCandidate(ch, categories, gradeMap);
    return {
      char: ch,
      primaryCategory,
      primaryCategoryLabel: CATEGORY_LABELS[primaryCategory],
      categories: categories.join('|'),
      categoryLabels: categories.map((cat) => CATEGORY_LABELS[cat]).join('|'),
      priorityOverall: index + 1,
      priorityInPrimary: nextPriority,
      mextGrade: gradeMap.get(ch) || '',
      alreadyRegistered: existingRow ? 'yes' : 'no',
      existingReading: existingRow?.reading ?? '',
      sourceReason,
      selectionScore: score.selectionScore,
      scoreBreakdown: score.scoreBreakdown,
      reviewStatus: score.reviewStatus,
      poolOrder: index + 1
    };
  });
  const rows = scoredRows
    .sort((a, b) => b.selectionScore - a.selectionScore || a.poolOrder - b.poolOrder)
    .slice(0, 1000)
    .map((row, index) => ({ ...row, priorityOverall: index + 1 }));
  if (rows.length !== 1000) {
    throw new Error(`candidate count mismatch: ${rows.length}`);
  }
  if (new Set(rows.map((row) => row.char)).size !== 1000) {
    throw new Error('duplicate candidate characters found');
  }
  return rows;
}

function buildCsv(rows) {
  const header = [
    'char',
    'primaryCategory',
    'primaryCategoryLabel',
    'categories',
    'categoryLabels',
    'priorityOverall',
    'priorityInPrimary',
    'mextGrade',
    'alreadyRegistered',
    'existingReading',
    'selectionScore',
    'scoreBreakdown',
    'sourceReason',
    'reviewStatus'
  ];
  return [
    header.join(','),
    ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(','))
  ].join('\n') + '\n';
}

function buildAuditMd(existing, candidateRows) {
  const included = new Set(candidateRows.map((row) => row.char));
  const missing = existing.filter((row) => !included.has(row.char));
  const meaningMissing = existing.filter((row) => !row.meaning);
  const readingMissing = existing.filter((row) => !row.reading);
  const duplicates = existing.filter((row) => row.setIds.length > 1);

  return `# Kanji 1000 Existing Audit

Date: 2026-05-31

## Scope

- Existing UI sets checked: \`popular_foreigners_50\`, \`resident_exam_50\`
- Unique existing kanji: ${existing.length}
- Existing kanji included in candidate 1000: ${existing.length - missing.length}
- Existing kanji not included in candidate 1000: ${missing.length}

## Findings

- Reading missing: ${readingMissing.length}
- Meaning missing: ${meaningMissing.length}
- Present in multiple existing sets: ${duplicates.length}

## Existing Kanji

| char | reading | meaning | sets | categories | includedInCandidate1000 |
|---|---|---|---|---|---|
${existing.map((row) => `| ${row.char} | ${row.reading || ''} | ${row.meaning || ''} | ${row.setIds.join(' / ')} | ${row.categories.join(' / ')} | ${included.has(row.char) ? 'yes' : 'no'} |`).join('\n')}

## Notes

- Current app data has many blank \`meaning\` fields. Translation work must happen in the master list before app import.
- Existing kanji are treated as candidates, not automatically accepted forever; Phase 2 validity review can still replace weak choices.
`;
}

function buildSummaryMd(rows) {
  const primaryCounts = Object.fromEntries(Object.keys(CATEGORY_TARGETS).map((cat) => [
    cat,
    rows.filter((row) => row.primaryCategory === cat).length
  ]));
  const tagCounts = Object.fromEntries(Object.keys(CATEGORY_TARGETS).map((cat) => [
    cat,
    rows.filter((row) => row.categories.split('|').includes(cat)).length
  ]));
  const statusCounts = rows.reduce((acc, row) => {
    acc[row.reviewStatus] = (acc[row.reviewStatus] ?? 0) + 1;
    return acc;
  }, {});
  const gradeCounts = new Map();
  for (const row of rows) {
    const key = row.mextGrade || '追加候補';
    gradeCounts.set(key, (gradeCounts.get(key) ?? 0) + 1);
  }
  const registered = rows.filter((row) => row.alreadyRegistered === 'yes').length;

  return `# Kanji 1000 Candidate Summary

Date: 2026-05-31

## Purpose

在留外国人向けの漢字登録に使う、登録前レビュー用の1000字候補リスト。
このファイルとCSVはまだアプリ本体には反映しない。Phase 2で妥当性検討し、Phase 3以降で訳語を併記・検証してから登録する。

## Source Policy

- Primary backbone: 文部科学省「学年別漢字配当表」
- Product-purpose overlay: 在留生活、行政、医療、災害、仕事、学校、JFT-Basic/生活日本語、JLPT初中級、文化・人気の用途
- JFT-Basic reference: 国際交流基金は生活場面で必要な日本語コミュニケーション能力を測定し、「文字と語彙」で漢字の意味と用法を扱う
- いろどり reference: 国際交流基金「いろどり 生活の日本語」は生活日本語教材で、文型・漢字リストを提供

## Source Links

- 文部科学省 学年別漢字配当表: https://www.mext.go.jp/a_menu/shotou/cs/1319951.htm
- 国際交流基金 JFT-Basic: https://www.jpf.go.jp/jft-basic/about/index.html
- 国際交流基金 いろどり 生活の日本語 付属教材・資料: https://www.irodori.jpf.go.jp/resources.html

## Candidate Counts

The revised list is scored before translation. Rows are unique by kanji; categories are tags, so a kanji can support multiple learning contexts.

| category | label | old target | primary rows | tagged rows |
|---|---|---:|---:|---:|
${Object.entries(CATEGORY_TARGETS).map(([cat, target]) => `| ${cat} | ${CATEGORY_LABELS[cat]} | ${target} | ${primaryCounts[cat]} | ${tagCounts[cat]} |`).join('\n')}

## Selection Status

| status | count |
|---|---:|
| accepted | ${statusCounts.accepted ?? 0} |
| conditional | ${statusCounts.conditional ?? 0} |
| rejected | ${statusCounts.rejected ?? 0} |

## Grade Distribution

| source grade | count |
|---|---:|
${[...gradeCounts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'ja')).map(([grade, count]) => `| ${grade} | ${count} |`).join('\n')}

## Existing Data Coverage

- Candidate rows already registered in app: ${registered}
- Candidate rows not yet registered: ${rows.length - registered}

## Review Gate Before Import

Phase 2 must check:

1. Category fit: each character belongs in its assigned category for a real resident-life reason.
2. Over/under representation: no category is padded with low-value characters just to hit a number.
3. Difficulty balance: abstract legal/administrative characters are useful, but not too dense for beginners.
4. Exclusions: characters excluded from the 1026 education backbone should be reconsidered only if resident-life value is high.
5. Duplicates: none in the final 1000.

## Files

- Candidate CSV: \`docs/research/kanji-1000-candidate-list.csv\`
- Existing audit: \`docs/research/kanji-1000-existing-audit.md\`
`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const existing = await loadExisting();
  const rows = buildCandidates(existing);
  await fs.writeFile(CANDIDATE_CSV, buildCsv(rows), 'utf8');
  await fs.writeFile(AUDIT_MD, buildAuditMd(existing, rows), 'utf8');
  await fs.writeFile(SUMMARY_MD, buildSummaryMd(rows), 'utf8');
  console.log(`wrote ${CANDIDATE_CSV}`);
  console.log(`wrote ${AUDIT_MD}`);
  console.log(`wrote ${SUMMARY_MD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
