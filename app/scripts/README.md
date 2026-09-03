# scripts

> **配置**: 本スクリプト群は `scripts/` に配置。出力先はリポジトリルート相対で、データ JS は `src/lib/data/kanji/`、SVG は `static/svg/` に書き出す。
>
> ⚠️ **PDF について**: 一部のスクリプトは出典元の教材 PDF を `docs/research/smilekanji-pdfs/` へ書き出すが、**この PDF はリポジトリに同梱していない**（第三者著作物のため）。PDF を要する工程はローカルで各自 DL する必要がある。同梱データの出典は `THIRD-PARTY-NOTICES.md` を参照。
>
> ⚠️ **既知不整合（次回修正タスク）**: register-set.mjs の探索ロジックは旧モノレポ想定の `kanji-{name}.js` 形式（line 144「`{dataDir}/kanji-{name}.js` の存在確認」）を期待するが、正本実体は `src/lib/data/kanji/{name}.js`（kanji- プレフィックスなし）。次回パイプライン本格運用時に register-set.mjs 実装修正が必要。

漢字登録パイプラインのスクリプト群です。Session 267 で `愛知県` 3 文字セット追加に 1 セッション要した工程（KanjiVG SVG 個別 DL → smileplanet PDF 個別 DL → データ JS 手書き → sets.js 手動編集）を自動化し、教育漢字 1026 字 + 都道府県 47 字 = **1073 字**への拡張を 18 営業日 → 5-6 営業日に圧縮することを目的とします。

## 構成

| ファイル | 役割 |
|---|---|
| `import-kanji.mjs` | 漢字 1 字を引数で受け取り、KanjiVG SVG を DL してデータ JS を自動生成 |
| `register-set.mjs` | 漢字データ JS 群をセットとして `sets.js` に登録 |

依存は **Node 標準モジュールのみ**（fetch / fs / path / url）です。npm install は不要です。Node 18+ 推奨（fetch がネイティブ対応）。

---

## 全体フロー（マスター操作手順）

```
[1] import-kanji.mjs 実行
    ↓ KanjiVG SVG DL（自動）
    ↓ smileplanet PDF DL（任意・--songNumber/--songReading 指定時）
    ↓ データ JS 生成（自動・src/lib/data/kanji-{name}.js）
[2] PDF を見て songFragment / songLyric / reading / meaning / word を手書きで埋める
[3] register-set.mjs 実行
    ↓ kanji-{name}.js の存在確認
    ↓ sets.js に import 文 / SETS / SET_ORDER を追記
[4] 動作確認: getSetById('<setId>') が期待値を返すか確認
```

**自動化されている工程**: KanjiVG SVG 取得 / SVG パース（path / kvg:type / 番号位置） / データ JS のスケルトン生成 / smileplanet PDF DL / sets.js 編集

**手作業が残る工程**: PDF を見て動作語（songFragment）を漢字 1 字あたり画数分書き写す ＋ reading / meaning / word / songLyric の記入。OCR は範囲外（Phase 2 以降の課題）。

---

## import-kanji.mjs

漢字 1 字を引数で受け取り、KanjiVG SVG をダウンロードして `src/lib/data/kanji-{name}.js` を生成します。

### CLI

```bash
node scripts/import-kanji.mjs --kanji <字> --code <hex5> --name <ローマ字> [オプション]
```

### 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `--kanji <字>` | 必須 | 漢字 1 字（例: `東`） |
| `--code <hex5>` | 必須 | KanjiVG コードポイント 16 進 5 桁（例: `06771` = 東。`04e95` = 井） |
| `--name <ローマ字>` | 任意 | 出力ファイル名のスラッグ（既定: コードポイント）。`kanji-<name>.js` として保存される |
| `--grade <学年>` | 任意 | 1〜6（注記コメントに記録される） |
| `--songNumber <連番>` | 任意 | smileplanet 連番（例: `2104`）。指定時のみ PDF DL |
| `--songReading <読み>` | 任意 | smileplanet ファイル名読み（例: `tou`）。指定時のみ PDF DL |
| `--out <dir>` | 任意 | 出力先ディレクトリ（既定 `src/lib/data/`） |
| `--svgOut <dir>` | 任意 | SVG 保存先（既定 `static/svg/`） |
| `--pdfOut <dir>` | 任意 | PDF 保存先（既定 `docs/research/smilekanji-pdfs/`） |
| `--force` | 任意 | 既存データ JS を上書き |
| `--dryRun` | 任意 | ファイル書き込みせず生成内容を stdout 出力 |

### 動作

1. KanjiVG SVG DL: `https://github.com/KanjiVG/kanjivg/raw/master/kanji/{code}.svg` → `static/svg/{code}.svg`
2. SVG パース（正規表現）:
   - `<path id="kvg:{code}-sN" kvg:type="..." d="..."/>` → 画ごとの d / type
   - `<text transform="matrix(1 0 0 1 X Y)">N</text>` → 番号位置 numPos
   - `viewBox="..."` → そのまま転記
3. smileplanet 引数が揃っていれば PDF を `https://www.smileplanet.net/prekanji/dl/{songNumber}_{songReading}.pdf` から DL
4. データ JS を生成（`KANJI_<NAME>` 定数を export）
5. 「次の手順」を stdout に表示

### コードポイント早見（既存 5 字）

| 漢字 | 16 進 | 例 `--name` |
|---|---|---|
| 井 | `04e95` | `i` |
| 飛 | `098db` | `fei` |
| 愛 | `0611b` | `ai` |
| 知 | `077e5` | `chi` |
| 県 | `0770c` | `ken` |

KanjiVG のコードポイントは **Unicode コードポイントの 16 進 5 桁**です。`String.fromCodePoint(0x04e95) === '井'`。確認は `node -e "console.log('東'.codePointAt(0).toString(16))"` で OK。

### 生成されるデータ JS のスキーマ

既存 `kanji-i.js`（手動作成）と同形式。`KANJI_<NAME>` 1 定数を export し、フィールドは:

```js
export const KANJI_TOU = {
  char: '東',
  reading: '',     // TODO: 手書き
  meaning: '',     // TODO: 手書き
  word: '',        // TODO: 縦書き表示用
  strokeCount: 8,
  viewBox: '0 0 109 109',
  songLyric: '',   // TODO: 覚え歌全体（読み上げ 1 行）
  strokes: [
    {
      id: 1,
      color: '#ec4899',  // 自動: 25 色循環
      label: 'よこ',     // 自動: KanjiVG kvg:type → 「よこ/たて/ノ/...」のヒント。手で修正可
      songFragment: '',  // TODO: 動作語を 1 画ずつ手書き
      type: '㇐',
      d: 'M...',         // 自動: KanjiVG SVG から
      numPos: { x: 16.5, y: 38.5 }  // 自動: KanjiVG number テキストから
    },
    // ...
  ]
};
```

**自動で埋まるフィールド**: `char`、`strokeCount`、`viewBox`、`strokes[].id / .color / .type / .d / .numPos`、および `strokes[].label`（kvg:type 由来のヒント）

**手書きが必要なフィールド**: `reading`、`meaning`、`word`、`songLyric`、`strokes[].songFragment`、必要に応じて `strokes[].label`

---

## register-set.mjs

漢字データ JS ファイル群をセットとして `src/lib/data/sets.js` に登録します。

### CLI

```bash
node scripts/register-set.mjs --setId <id> --name <表示名> --kanji <カンマ区切り> [オプション]
```

### 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `--setId <id>` | 必須 | セット ID（kebab-case 推奨。例: `tokyo`） |
| `--name <表示名>` | 必須 | セット表示名（例: `東京都`） |
| `--kanji <名前リスト>` | 必須 | 含める漢字データのモジュール名（カンマ区切り。例: `tou,kyou,to`） |
| `--setsPath <path>` | 任意 | sets.js のパス（既定 `src/lib/data/sets.js`） |
| `--dataDir <path>` | 任意 | 漢字データの格納ディレクトリ（既定 `src/lib/data/`） |
| `--force` | 任意 | 同 setId の既存セットを上書き |

### 動作

1. `{dataDir}/kanji-{name}.js` の存在確認（不在ならエラー）
2. `sets.js` を読み込み（無ければ自動でスキャフォールド作成）
3. import 文 / `SETS` エントリ / `SET_ORDER` エントリを追記
4. 同じ `setId` が既に存在する場合、`--force` 無しならエラー

### 生成・編集される sets.js のスキーマ

```js
// === imports (auto-managed) ===
import { KANJI_I } from './kanji-i.js';
import { KANJI_TOU } from './kanji-tou.js';
// ...

// === SETS ===
export const SETS = {
  'i': {
    id: 'i',
    name: '井 1 字',
    kanji: [KANJI_I]
  },
  'tokyo': {
    id: 'tokyo',
    name: '東京都',
    kanji: [KANJI_TOU /* , KANJI_KYOU, KANJI_TO */]
  }
};

// === SET_ORDER ===
export const SET_ORDER = [
  'i',
  'tokyo'
];

export function getSetById(id) {
  return SETS[id];
}
```

**重要**: `sets.js` が存在しない初回実行時は scaffold を新規作成します。**既存ファイルは破壊しません**（追記方式）。

---

## 「東京都」セット追加の例（フル手順）

```bash
# 1. cwd を learning-suite ルートにする
cd "$(git rev-parse --show-toplevel)"

# 2. 「東」「京」「都」の SVG を DL してデータ JS を生成（PDF も DL）
node scripts/import-kanji.mjs --kanji 東 --code 06771 --name tou --grade 2 --songNumber 2104 --songReading tou
node scripts/import-kanji.mjs --kanji 京 --code 04eac --name kyou --grade 2 --songNumber 2105 --songReading kyou
node scripts/import-kanji.mjs --kanji 都 --code 090fd --name to --grade 3 --songNumber 3001 --songReading to

# 3. PDF を開いて動作語を確認
#    docs/research/smilekanji-pdfs/2104_tou.pdf 等
#    src/lib/data/kanji-tou.js の TODO を埋める:
#      - reading（とう）
#      - meaning（東西の東）
#      - word（東きょう など縦書き表示用）
#      - songLyric（覚え歌全体・1 行）
#      - strokes[].songFragment（各画の動作語）
#    kanji-kyou.js / kanji-to.js も同様

# 4. セット登録
node scripts/register-set.mjs --setId tokyo --name 東京都 --kanji tou,kyou,to

# 5. 動作確認（dev サーバ起動済みの状態で）
#    URL: /play?setId=tokyo（実装次第）
#    あるいは Node REPL から:
node --input-type=module -e "import('./src/lib/data/sets.js').then(m => console.log(m.getSetById('tokyo')))"
```

---

## 既存 5 字（井 / 飛 / 愛 / 知 / 県）への回帰確認

### 実施方法

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p /tmp/regression
node scripts/import-kanji.mjs --kanji 井 --code 04e95 --name i   --out /tmp/regression/ --svgOut /tmp/regression/svg/
node scripts/import-kanji.mjs --kanji 飛 --code 098db --name fei --out /tmp/regression/ --svgOut /tmp/regression/svg/ --force
node scripts/import-kanji.mjs --kanji 愛 --code 0611b --name ai  --out /tmp/regression/ --svgOut /tmp/regression/svg/ --force
node scripts/import-kanji.mjs --kanji 知 --code 077e5 --name chi --out /tmp/regression/ --svgOut /tmp/regression/svg/ --force
node scripts/import-kanji.mjs --kanji 県 --code 0770c --name ken --out /tmp/regression/ --svgOut /tmp/regression/svg/ --force

# 各ファイルが ESM として読めるか確認
cd /tmp/regression
for n in i fei ai chi ken; do
  node --input-type=module -e "import('./kanji-$n.js').then(m => console.log('$n', m['KANJI_${n^^}'].char, m['KANJI_${n^^}'].strokeCount))"
done
```

### Session 267 実施結果（worktree agent）

| 漢字 | code | strokes 抽出 | viewBox | ESM import |
|---|---|---|---|---|
| 井 | 04e95 | 4 ✅ | `0 0 109 109` ✅ | OK ✅ |
| 飛 | 098db | 9 ✅ | `0 0 109 109` ✅ | OK ✅ |
| 愛 | 0611b | 13 ✅ | `0 0 109 109` ✅ | OK ✅ |
| 知 | 077e5 | 8 ✅ | `0 0 109 109` ✅ | OK ✅ |
| 県 | 0770c | 9 ✅ | `0 0 109 109` ✅ | OK ✅ |

**井のバイト一致確認**（worktree 内に `src/lib/data/kanji-i.js` が存在し対比可能だったため）:

| フィールド | 既存値 | 生成値 | 一致 |
|---|---|---|---|
| `strokeCount` | 4 | 4 | YES |
| `viewBox` | `0 0 109 109` | `0 0 109 109` | YES |
| `strokes[0].d` | `M23.5,36.9...` | `M23.5,36.9...` | YES |
| `strokes[0].type` | `㇐` | `㇐` | YES |
| `strokes[0].numPos` | `{x:16.5,y:38.5}` | `{x:16.5,y:38.5}` | YES |
| `strokes[0].color` | `#ec4899` | `#ec4899` | YES |
| `strokes[0].label` | `よこ` | `よこ`（kvg:type=㇐ → 'よこ' ヒット） | YES |
| 全 4 画について上記すべて | 一致 | 一致 | YES |

差異なし。**全自動抽出可能フィールドが既存手書きデータと一致しました**。

### 既知 spec 欠陥（注意点）

1. **画数の流派差**: KanjiVG の path 数は標準字書（漢検）と稀に異なる場合があります（康熙字書系統との差）。本ツールは KanjiVG 数を採用します。教育漢字 1026 字で稀に 1〜2 画ずれが発生する可能性あり、目視チェックを推奨します。
2. **`label` 自動推定の精度**: 既定の label は `kvg:type` 由来のヒント（よこ / たて / ノ / ハ など 10 種程度のみ）です。複合画（払い・はね混合等）は空文字が入ります。songFragment と整合させるには手調整が必要です。
3. **smileplanet PDF URL の安定性**: `https://www.smileplanet.net/prekanji/dl/{番号}_{読み}.pdf` 形式は調査時点（Session 267）の URL 規約に基づきます。404 になる場合は手動で PDF を `docs/research/smilekanji-pdfs/` に置いてください（PDF が無くてもデータ JS 生成は可能で、songFragment が空のまま生成されます）。
4. **OCR は範囲外**: PDF からの動作語自動抽出は本ツール対象外です（Phase 2 課題）。マスター手作業前提です。
5. **多言語スラッグ**: `--name` にローマ字以外（漢字・かな・ハイフン以外の記号）を渡すと、生成される const 名が `KANJI_` + 大文字化 + 非英数アンダースコア化で正規化されます。互いに衝突する可能性があるため、ローマ字またはローマ字+数字+アンダースコアを推奨します。

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `HTTP 404 for ...kanjivg/raw/master/kanji/{code}.svg` | code が間違っている | Unicode コードポイント 16 進を `node -e "console.log('東'.codePointAt(0).toString(16))"` で再確認 |
| `SVG に画パスが見つかりません` | code が SVG ファイル名と不一致 | `--code 06771` のように 5 桁ゼロ埋めで指定（`6771` でも自動でゼロ埋めされますが念のため） |
| `セット 'xxx' は既に存在します` | 同じ setId で再登録 | 別 ID を選ぶか `--force` を付ける |
| `漢字データが見つかりません: kanji-xxx.js` | --name が間違い | `src/lib/data/` を見て正しいスラッグを確認 |
| `sets.js の SETS 宣言を解析できません` | 手動編集で `SETS = {...}` のフォーマットを崩した | `// === SETS ===` マーカーと `export const SETS = { ... };` 構造を保つ |

---

## 設計意図（次のセッションへの引き継ぎ）

- **規律**: Node 標準モジュールのみで完結。AST パーサ（typescript-eslint / acorn 等）は導入しない
- **Refactor-on-Write**: scripts/ は既存ファイル（`kanji-i.js` / `04e95.svg`）を破壊しない設計（追記方式 + scaffold 新規作成）
- **手作業の最小化**: 1073 字対応で OCR 等の高度自動化は Phase 2 課題。Phase 1 では「PDF 見て動作語を写経」だけ手作業で残し、それ以外は全自動
- **回帰可能性**: 既存 5 字を `--out /tmp/regression/` で生成して既存ファイルと突き合わせ可能。CI 化未対応（Phase 2 課題）
