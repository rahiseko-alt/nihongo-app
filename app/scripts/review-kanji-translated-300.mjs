#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'docs', 'research', 'kanji-translated-300.csv');
const OUT = path.join(ROOT, 'docs', 'research', 'kanji-translated-300-reviewed.csv');

const REVIEW = {
  月:['つき','月','month/moon','月','月','달'], 理:['り','理・理由','reason','理','理','이치'], 年:['とし','年','year','年','年','해'],
  大:['おおきい','大きい','big','大','大','크다'], 小:['ちいさい','小さい','small','小','小','작다'], 高:['たかい','高い','high','高','高','높다'],
  仕:['し','仕事の仕','serve/work','工作','工作','일'], 事:['こと','事','matter/thing','事','事','일'], 自:['じぶん','自分','self','自己','自己','자기'],
  早:['はやい','早い','early','早','早','이르다'], 楽:['たのしい','楽しい','fun','快乐','快樂','즐겁다'], 作:['つくる','作る','make','制作','製作','만들다'],
  務:['む','務め','duty','事务','事務','업무'], 少:['すくない','少ない','few','少','少','적다'], 多:['おおい','多い','many','多','多','많다'],
  古:['ふるい','古い','old','古','古','오래되다'], 不:['ふ','不・否定','not','不','不','불'], 法:['ほう','法律','law','法律','法律','법'],
  力:['ちから','力','power','力量','力量','힘'], 赤:['あか','赤','red','红','紅','빨강'], 青:['あお','青','blue','蓝','藍','파랑'],
  王:['おう','王','king','王','王','왕'], 玉:['たま','玉','ball/jewel','玉','玉','구슬'], 糸:['いと','糸','thread','线','線','실'],
  耳:['みみ','耳','ear','耳','耳','귀'], 手:['て','手','hand','手','手','손'], 正:['ただしい','正しい','correct','正确','正確','바르다'],
  石:['いし','石','stone','石头','石頭','돌'], 草:['くさ','草','grass','草','草','풀'], 足:['あし','足','foot/leg','脚','腳','발'],
  竹:['たけ','竹','bamboo','竹','竹','대나무'], 虫:['むし','虫','insect','虫','蟲','벌레'], 田:['た','田','rice field','田','田','논'],
  目:['め','目','eye','眼睛','眼睛','눈'], 立:['たつ','立つ','stand','站立','站立','서다'], 券:['けん','券','ticket','券','券','권'],
  件:['けん','件','case','件','件','건'], 制:['せい','制度','system','制度','制度','제도'], 権:['けん','権利','right','权利','權利','권리'],
  義:['ぎ','義務','duty','义务','義務','의무'], 責:['せき','責任','responsibility','责任','責任','책임'], 任:['にん','任せる','duty','任','任','책임'],
  用:['よう','用いる','use','使用','使用','사용'], 教:['おしえる','教える','teach','教','教','가르치다'], 合:['あう','合う','fit/meet','合','合','맞다'],
  図:['ず','図','map/diagram','图','圖','그림'], 園:['えん','園','garden/school','园','園','원'], 門:['もん','門','gate','门','門','문'],
  曜:['よう','曜日','weekday','星期','星期','요일'], 黒:['くろ','黒','black','黑','黑','검정'], 週:['しゅう','週','week','周','週','주'],
  引:['ひく','引く','pull','拉','拉','끌다'], 羽:['はね','羽','feather','羽毛','羽毛','깃털'], 雲:['くも','雲','cloud','云','雲','구름'],
  科:['か','科','department','科','科','과'], 回:['かい','回','times/turn','回','回','회'], 絵:['え','絵','picture','画','畫','그림'],
  角:['かど','角','corner/angle','角','角','모서리'], 活:['かつ','活動','activity','活动','活動','활동'], 間:['あいだ','間','space/time','间','間','사이'],
  丸:['まる','丸','circle','圆','圓','동그라미'], 岩:['いわ','岩','rock','岩石','岩石','바위'], 顔:['かお','顔','face','脸','臉','얼굴'],
  汽:['き','汽車の汽','steam','汽','汽','증기'], 記:['き','記録','record','记录','記錄','기록'], 弓:['ゆみ','弓','bow','弓','弓','활'],
  牛:['うし','牛','cow','牛','牛','소'], 強:['つよい','強い','strong','强','強','강하다'], 兄:['あに','兄','older brother','哥哥','哥哥','형'],
  形:['かたち','形','shape','形状','形狀','모양'], 計:['けい','計る','measure/plan','计算','計算','계산'], 元:['もと','元','origin','元','元','근원'],
  言:['いう','言う','say','说','說','말하다'], 原:['はら','原','original/field','原','原','원래'], 戸:['と','戸','door','门','門','문'],
  工:['こう','工事','construction','工程','工程','공사'], 公:['こう','公','public','公','公','공공'], 広:['ひろい','広い','wide','宽','寬','넓다'],
  考:['かんがえる','考える','think','考虑','考慮','생각하다'], 黄:['き','黄','yellow','黄','黃','노랑'], 谷:['たに','谷','valley','谷','谷','골짜기'],
  才:['さい','才能','talent','才能','才能','재능'], 細:['ほそい','細い','thin','细','細','가늘다'], 算:['さん','計算','calculate','计算','計算','계산'],
  矢:['や','矢','arrow','箭','箭','화살'], 姉:['あね','姉','older sister','姐姐','姐姐','누나'], 思:['おもう','思う','think','想','想','생각하다'],
  紙:['かみ','紙','paper','纸','紙','종이'], 弱:['よわい','弱い','weak','弱','弱','약하다'], 首:['くび','首','neck','脖子','脖子','목'],
  場:['ば','場所','place','场所','場所','장소'], 色:['いろ','色','color','颜色','顏色','색'], 親:['おや','親','parent','父母','父母','부모'],
  数:['かず','数','number','数量','數量','수'], 声:['こえ','声','voice','声音','聲音','목소리'], 晴:['はれ','晴れ','clear weather','晴','晴','맑음'],
  切:['きる','切る','cut','切','切','자르다'], 船:['ふね','船','ship','船','船','배'], 組:['くみ','組','group','组','組','조'],
  走:['はしる','走る','run','跑','跑','달리다']
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (q) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
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

const rows = parseCsv(await fs.readFile(SRC, 'utf8'));
const header = rows[0];
const out = rows.slice(1).map((row) => {
  const r = REVIEW[row[0]];
  if (!r) return row;
  return [row[0], r[0], r[1], r[2], r[3], r[4], r[5], row[7], 'ok'];
});
await fs.writeFile(OUT, [header.join(','), ...out.map((row) => row.map(esc).join(','))].join('\n') + '\n', 'utf8');
const bad = out.filter((row) => row.some((cell) => cell === '') || row[8] !== 'ok');
console.log(JSON.stringify({ out: OUT, rows: out.length, unique: new Set(out.map((row) => row[0])).size, badRows: bad.length, draftRows: out.filter((row) => row[8] !== 'ok').length }, null, 2));
