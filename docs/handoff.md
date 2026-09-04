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

**`app/` を CI で検査する経路を作り、`main` へマージし終えた。次の作業は決まっていない。**
`docs/plan.json` は26項目すべて `done` で、計画側に未着手の項目はない。

## 完了したこと

### このセッション

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

### 前のセッションまで

`main` に PR #41〜#51 相当をマージ済み（計画CLI 4本、`verify` の書き方の機械検査、
フック2本、並列実行の実地確認など）。詳細は `docs/decisions.md` を参照。

## 次にやること

**最初にユーザーへ「次はどれをやるか」を聞く。勝手にどれかを始めないこと。**

1. **`AGENTS.md` 冒頭の「目的」を実態に合わせる** — いまも「公式準拠のリポジトリ雛形
   そのものを作ること」のままだが、`app/` という実プロジェクトが既に入っている `[曖昧]`
   （どちらを正とするかはユーザーしか決められない）
2. **`automation` の分類を付け直す** — 前回の全体照合で、AI 単独では `verify` を
   なぞれない項目が実態より少なく見積もられていると判明した（`human` は4件のみ）
3. **`status` に `dropped`（取り下げ）を足す** — 「やらないと決めた」項目も `done` に
   するしかなく、完了率が実際より良く見える

### 以前からの積み残し

- GitHub Ruleset の実態は `[曖昧]`。ユーザーが Settings → Rules → Rulesets で確認してほしい
- **`app` ジョブは Ruleset の必須チェックには入っていない** `[曖昧]`。赤くてもマージを
  止めない可能性がある。必須にするかはユーザーの判断

## 注意点

**恒久的なリポジトリのルールはここに書かない。** `AGENTS.md`（指示）と `docs/decisions.md`
（根拠）を参照する。ここに書くのは、セッションをまたいで再発しうる作業上の落とし穴だけ。

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

- 記録時刻: 2026-09-04 05:20 UTC
- ブランチ: `claude/checkin-quq3ko`
- HEAD: `2719d4d`
- 未コミットの変更:

```
M docs/handoff.md
```
