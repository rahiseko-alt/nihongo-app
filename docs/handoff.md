# 引継ぎ

セッションをまたいで作業を継続するための文書です。役割は**「次にどの branch を見ればいいか」の
ポインタ**に限ります。branch 固有の詳細（何が途中か、次に何をするか）はその branch 自身の
コミットや開いてある PR の本文に書き、ここには短いポインタだけを置いてください。恒久的な
リポジトリのルールもここには書きません（`AGENTS.md`・`docs/decisions.md` を参照）。

同時に複数 branch が進行中の場合は、「次にやること」に branch ごと1エントリで列挙してください。
この雛形は複数 branch の並行開発を想定した状態管理は持っていません。本格的に必要になったら
`docs/decisions.md`「3-b. セッション間の引継ぎ」を読んでから設計し直してください。

- `AGENTS.md` がこのファイルを `@` で import しているため、セッション開始時に自動で読み込まれます
- 未記録の変更が残っていると、`.claude/hooks/handoff-check.sh` が1セッションに1回だけ更新を求めます
- セッション終了時、`.claude/hooks/handoff-stamp.sh` が末尾の状態を機械的に**上書き**します（追記ではない）
- 作業開始時は `/checkin`、区切りでは `/handoff`、終了時は `/checkout` を実行してください

**このファイル（引継ぎ文）を更新したら、必ず `main` へマージしてください。** 次のセッションは
`main` を新規クローンし、この docs/handoff.md しか自動では読みません。実際のコード変更は、
未完了なら push 済みの branch/worktree に残したままで構いません（push していれば origin に
残るため消えません）。

---

## いま何をしているか

**`app/`（Senbon 本体）の意味欄の穴を1つ潰し、`main` へマージし終えた。次の作業は決まっていない。**

`docs/plan.json` は28項目すべて `done`。ただし**その28項目は土台（from-0）の話だけで、
`app/` に触れる項目は0件**。`AGENTS.md` の目的は「Senbon を作ること」に書き換わっているのに、
計画側にアプリの項目が1つも無い、という食い違いが残っている。

## 完了したこと

### このセッション

**ベトナム語・ネパール語の意味欄538字の穴埋め文字列を消した（マージ済み）**

- PR: [#6](https://github.com/rahiseko-alt/nihongo-app/pull/6)（`main` にマージ済み、`d3c6d14`）
- **GitHub Actions 上でもジョブ `check` `app` の両方が成功したことを確認済み**
- **症状**: 練習画面の読みバッジ（`app/src/routes/play/+page.svelte:348`）は `読み【意味】` を出す。
  1,000字のうち538字で意味欄が `vi: 'khái niệm'`（＝「概念」）/ `ne: 'अर्थ'`（＝「意味」）のままだった。
  `getMeaningForeign` は `??` で読むため、**値が入っている＝英語フォールバックに落ちず、そのまま出る**。
  セット「在留外国人向け試験対策漢字 500」は357字が該当し、1文字目「果」から同じ語が出ていた
- **直し方**: 538ファイルから `vi` / `ne` を**キーごと削除**。空文字にしないのは、`''` が nullish ではなく
  フォールバックに落ちない（「未設定」表示になる）ため
- `app/tests/unit/kanjiMeanings.test.ts` を新規追加。穴埋め文字列が再発したら**ファイル名を挙げて**落ちる
- **検証**（`app/` で実行）: `pnpm run test` 17件成功／`pnpm run check` 1357ファイル **0 ERRORS** 6 WARNINGS
  （未使用CSSセレクタのみ・既存）／`pnpm run build` 成功
- **テストが空振りでないことも確認**。1ファイルに穴埋め文字列を戻すと
  `expected [ 'u0679c.js (vi: khái niệm)' ] to deeply equal []` で落ちた
- **ビルドした実物を Chromium で開いて目視確認済み**。ベトナム語で「果」を開いたバッジが
  `はたす【khái niệm】` → `はたす【fruit/reward】` に変わった。ネパール語・日本語も同画面で確認
- **`docs/plan.json` の項目ではないため `completion-checker` は呼んでいない**

**`app/` の実態調査（上記の発端）**

- 規模: ルート4本（`+page` / `select` / `play` / `admin`、計 2,560 行）、
  漢字データ 1,028 ファイル、テスト2本（15件）、`scripts/` に生成・QA スクリプト25本
- 同じ意味欄で**まだ直していない穴が3つ**ある（PR #6 の対象外）
  - **韓国語の意味欄に英語が入っている 74字**（例: 両 →「both/old Japanese coin」）。
    現状すでに英語表示なので、画面の見え方は変わらない
  - **中国語の意味欄が漢字そのものと同じ 632字**（例: 果 →「果」）。訳になっていないが、
    消すべきかは判断が要る（中国語話者には字だけで通じる可能性がある）`[曖昧]`
  - **`ko` の意味欄 703/1000 が1文字**。ハングル1字は「意味」ではなく音である可能性が高い `[曖昧]`（未確認）
- **全1,000字で `songLyric` / `songFragment`（覚え歌）が空**。ただし**アプリ側はこの2つを一度も参照していない**
  ため、画面には影響しない
- `docs/neglected-log.md` に Gate `021 必須データが欠落しないか` として記録済み

**チェックイン時の点検結果**: `main` は `7be30bd`。オープンな PR なし、CI 赤なし、コンフリクトなし。
root の `pnpm run check` は緑（46件）。

### 前のセッション

**1つ目: root の検査対象から `app/` を切り離し、`pnpm run check` を緑に戻した（マージ済み）**

- PR: [#1](https://github.com/rahiseko-alt/nihongo-app/pull/1)（`main` にマージ済み、`ede0fcb`）
- `.prettierignore` に `app/` を追加／`vitest.config.ts` を新規追加し root の対象を
  `src/**/*.test.ts` に限定／`THIRD-PARTY-NOTICES.md` を整形

**2つ目: `app/` を CI で検査する経路を作った（マージ済み）**

- PR: [#2](https://github.com/rahiseko-alt/nihongo-app/pull/2)（`main` にマージ済み、`b7f102a`）
- 直した中身
  - `.github/workflows/ci.yml` にジョブ `app` を追加。`app/` で install →
    svelte-check → vitest → build を実行する。ジョブ名 `check` は Ruleset の必須チェック
    なので触らず、別名のジョブにした
  - `app/package.json` に `prepare: svelte-kit sync || echo ""` を追加。これが無いと
    `.svelte-kit/tsconfig.json` が生成されず、svelte-check も vitest も落ちる
  - `app/package-lock.json` を削除し `app/pnpm-lock.yaml` に置き換え（npm → pnpm 統一）。
    **ユーザーに確認したうえで実施**
  - `docs/neglected-log.md` に Gate `080 回帰` の解消を記録
- 検証（`app/` で CI と同じ手順を実行）: `pnpm install --frozen-lockfile` 成功／
  svelte-check 1356ファイル **0 ERRORS** 6 WARNINGS（未使用CSSセレクタのみ）／
  vitest **15件すべて成功**／`pnpm run build` 成功。root 側も `check`（テスト46件）と
  `build` が緑。**GitHub Actions 上でもジョブ `check` `app` の両方が成功したことを確認済み**
- **`docs/plan.json` の項目ではないため `completion-checker` は呼んでいない**

**3つ目: `AGENTS.md` の目的を Senbon の開発に書き換えた（マージ済み）**

- PR: [#4](https://github.com/rahiseko-alt/nihongo-app/pull/4)（`main` にマージ済み、`87837a0`）
- 直した中身
  - `AGENTS.md` の「目的」を「漢字学習アプリ Senbon を作ること」に変更。土台が雛形
    from-0 であること、主な作業対象が `app/` であることを併記
  - `AGENTS.md` の「コマンド」を root 用と `app/` 用に分割
  - `docs/decisions.md` に「28.」として根拠を記録
- **書き換えた理由**: `AGENTS.md` はエージェントが最初に読む唯一の正本なのに、`app/` への
  言及が0件だった。読んだエージェントは「目的は雛形作り」と理解して作業を始める。
  **実際にこのセッションの最初でそうなった**
- 選択肢は「アプリ主体」「両方を並列」「書き換えない」の3つを提示し、**ユーザーが
  「アプリ主体」を選択**
- 検証: 載せた5コマンドを実際に実行。`app/` で install（`prepare` の発火を出力で確認）／
  svelte-check 0 ERRORS／vitest 15件成功／build 成功。root も `check`（46件）と `build` が緑。
  **GitHub Actions 上でもジョブ `check` `app` の両方が成功したことを確認済み**
- **`AGENTS.md` が 243 行になり、公式の目安 200 行を超えている** `[曖昧]`（超過は以前から）

### 前のセッションまで

`main` に PR #41〜#51 相当をマージ済み（計画CLI 4本、`verify` の書き方の機械検査、
フック2本、並列実行の実地確認など）。詳細は `docs/decisions.md` を参照。

## 次にやること

**最初にユーザーへ「次はどれをやるか」を聞く。勝手にどれかを始めないこと。**

**最初にユーザーへ「次はどれをやるか」を聞く。勝手にどれかを始めないこと。**

1. **意味欄の残り3つの穴** — 韓国語欄に英語 74字／中国語欄が漢字そのもの 632字／
   韓国語欄が1文字 703字。**中国語と韓国語をどうするかはユーザーの判断が要る**
   （英語に落とすか、そのままでよいか）。件数と場所は `docs/neglected-log.md` に記録済み
2. **`app/` の項目を `docs/plan.json` に追記する** — 計画28項目は土台の話で完結しており、
   アプリの作業項目が0件。追記は末尾のみ・既存項目は書き換えない（`pnpm run plan:next-id` で採番）
3. **`automation` の分類を付け直す** — 前回の全体照合で、AI 単独では `verify` を
   なぞれない項目が実態より少なく見積もられていると判明した（`human` は4件のみ）
4. **`status` に `dropped`（取り下げ）を足す** — 「やらないと決めた」項目も `done` に
   するしかなく、完了率が実際より良く見える

### 以前からの積み残し

- GitHub Ruleset の実態は `[曖昧]`。ユーザーが Settings → Rules → Rulesets で確認してほしい
- **`app` ジョブは Ruleset の必須チェックには入っていない** `[曖昧]`。赤くてもマージを
  止めない可能性がある。必須にするかはユーザーの判断

## 注意点

**恒久的なリポジトリのルールはここに書かない。** `AGENTS.md`（指示）と `docs/decisions.md`
（根拠）を参照する。ここに書くのは、セッションをまたいで再発しうる作業上の落とし穴だけ。

- **`app/` の画面を実際に見る手順**（このセッションで通した）: `app/` で `pnpm run build` →
  `pnpm run preview --port <ポート>` を**バックグラウンドで**起動 → Playwright で開く。
  Chromium の実体は `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  （`/opt/pw-browsers/chromium/` は空のディレクトリで、そこを指すと落ちる）。
  言語は `localStorage` の `senbon_ui_language` に `ja|en|zh|ko|vi|ne` を入れて切り替える。
  1文字だけ開くなら `/play?kanji=<文字>` に直接行ける
- **preview を起動したまま `pnpm run build` をやり直すと preview が死ぬ。** 出力ファイルの
  ハッシュ名が変わり、開いている側が「Failed to fetch dynamically imported module」で止まる。
  **ビルドし直したら preview も起動し直すこと**
- **`curl` と `nohup ... &` は環境側でブロックされた。** サーバの起動確認は Playwright の
  アクセス自体で代用した。バックグラウンド実行は `run_in_background` を使う
- **穴埋めデータを消すときは、空文字ではなくキーごと削除する。** `''` は nullish ではないため
  `??` のフォールバックに落ちず、「未設定」表示になる
- **`app/` の README を実装の説明として信用しないこと。** README は「6言語すべてに意味と読みがある」
  と書いているが、実際は538字が穴埋め文字列のまま。**書いてあることと入っているデータは別物**
- **`app/` を提案する前に必ず中身を読むこと。** このセッションは `ls` の結果だけで選択肢を出し、
  ユーザーに「リポジトリを全部読んだのか」と指摘された。ファイル名一覧は実態ではない
- **`app/` は pnpm に統一した。** `app/package-lock.json` は削除済み。npm のコマンドを
  使わないこと
- **SvelteKit は `svelte-kit sync` を先に走らせないと何も動かない。** `.svelte-kit/tsconfig.json`
  は生成物で、リポジトリには入っていない。`app/package.json` の `prepare` が install 時に
  自動で走るようにしてある
- **引継ぎ文が実態と食い違っていることがある。** 前回、引継ぎには `app/` の存在も
  `main` の CI が赤いことも書かれていなかった。**`/checkin` では引継ぎを鵜呑みにせず、
  `git log origin/main` と `pnpm run check` を必ず自分で走らせること**
- **サブプロジェクトを足したら、root のツールの対象範囲を必ず見直す。** Prettier・
  vitest・tsconfig は既定で下位ディレクトリを全部拾う。`app/` はこれで壊れた
- **スカッシュマージ後、作業ブランチのリモートが古いまま残ることがある。** `--force` は
  このリポジトリで禁止（かつ環境側でもブロックされた）。`git merge origin/<branch>` で
  取り込んでから通常の push をすれば通る
- **`rm -rf` は環境側でブロックされることがある。** clean-room の再現は
  `pnpm install --frozen-lockfile` の出力で代替した
- **計画が全部 `done` のとき `pnpm run plan:next` は「着手できる項目がありません」と出る。**
  故障ではなく正常な結果
- **`done` が「要件の取り下げ」を意味する項目が3件ある**（`T019` `T020` `T006`）。
  完了率をそのまま信用しないこと。経緯は `docs/decisions.md`「23.」「26.」
- **CI の `pnpm/action-setup` 段階で4分ほど止まることがある。** 前回それで待たされたが
  最終的に成功した。すぐ異常と判断しないこと
- **「動いた」と「届いた」は別物。** 実行の成否は API で確認できるが、通知が人の手元に
  届いたかは人に聞くしかない
- **`automation` を決めるときは「そのコマンドを誰が入力するか」まで下りて確かめる**
- **判定役に渡す記録には必ず対象の id を書く**
- **ドキュメントに具体例を載せるときは、その例を実際に実行・検証してから載せる**
- **`node -e` の中でトップレベル `return` は書けない**。フックの中で使うときは関数で包む
- **`git push` がプロキシの 503 で失敗することがある。** 指数バックオフで数回リトライする
- **この引継ぎ文の本文に、自動記録の目印（`session-end-stamp` の HTML コメント）を
  そのまま書かないこと。** 書くと自動記録がそこで本文を切り落とす
- 公式の `settings` ページだけは全文を読めていない（サイズ超過）

<!-- session-end-stamp -->

## セッション終了時点の状態（自動記録）

- 記録時刻: 2026-09-05 00:22 UTC
- ブランチ: `claude/checkin-77sawa`
- HEAD: `7be30bd`
- 未コミットの変更: なし
