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

**`main` の CI が赤かったのを緑に戻した。それ以外は未着手で、次の作業は決まっていない。**

前のセッションの引継ぎは「雛形リポジトリ、`docs/plan.json` 28項目すべて完了」と書いていたが、
**実態と食い違っていた**。その後 `app/`（Senbon 漢字アプリ、SvelteKit）が `main` へ直接
追加されており（`70edcb7` `42533b5`）、root の `pnpm run check` が壊れていた。

`docs/plan.json` は26項目すべて `done`。`pnpm run plan:next` は「着手できる項目がありません」を返す。

## 完了したこと

### このセッション

**root の検査対象から `app/` を切り離し、`pnpm run check` を緑に戻した。**

- PR: [#1](https://github.com/rahiseko-alt/nihongo-app/pull/1) — `fix: keep root checks off the app/ subproject`
- 直した中身
  - `.prettierignore` に `app/` を追加 — root の Prettier は Svelte を扱えないのに
    `app/src` 等を対象にしており、1067ファイルが未整形として落ちていた
  - `vitest.config.ts` を新規追加 — root の vitest 対象を `src/**/*.test.ts` に限定。
    それまで `app/tests/*` を拾い、SvelteKit の生成物 `app/.svelte-kit/tsconfig.json`
    が無くて2ファイルが変換エラーになっていた
  - `THIRD-PARTY-NOTICES.md` を整形 — root で唯一、本当に未整形だったファイル
  - `docs/neglected-log.md` に Gate `080 回帰` で1件記録
- 検証: `pnpm run check`（整形・型・テスト46件すべて緑）／`pnpm run build` 通過
- **`docs/plan.json` の項目ではないため `completion-checker` は呼んでいない**

### 前のセッションまで

`main` に PR #41〜#51 相当をマージ済み（計画CLI 4本、`verify` の書き方の機械検査、
フック2本、並列実行の実地確認など）。詳細は `docs/decisions.md` を参照。

## 次にやること

**最初にユーザーへ「次はどれをやるか」を聞く。勝手にどれかを始めないこと。**

1. **`app/` を CI で検査する経路を作る** — このセッションで `app/tests` の2件が CI から
   外れた。`app/` は `package-lock.json`（npm）を持ち、pnpm 前提の root の CI にそのまま
   載らない。`app/` を pnpm workspace に入れるか、CI に別ジョブを足すかの判断が要る。
   **PR #1 の本文にもこの懸念を書いてある**
2. **`automation` の分類を付け直す** — 前回の全体照合で、AI 単独では `verify` を
   なぞれない項目が実態より少なく見積もられていると判明した（`human` は4件のみ）
3. **`status` に `dropped`（取り下げ）を足す** — 「やらないと決めた」項目も `done` に
   するしかなく、完了率が実際より良く見える
4. **`AGENTS.md` 冒頭の「目的」を実態に合わせる** — いまも「公式準拠のリポジトリ雛形
   そのものを作ること」のままだが、`app/` という実プロジェクトが既に入っている `[曖昧]`
   （どちらを正とするかはユーザーしか決められない）

### 以前からの積み残し

- GitHub Ruleset の実態は `[曖昧]`。ユーザーが Settings → Rules → Rulesets で確認してほしい

## 注意点

**恒久的なリポジトリのルールはここに書かない。** `AGENTS.md`（指示）と `docs/decisions.md`
（根拠）を参照する。ここに書くのは、セッションをまたいで再発しうる作業上の落とし穴だけ。

- **引継ぎ文が実態と食い違っていることがある。** 今回、引継ぎには `app/` の存在も
  `main` の CI が赤いことも書かれていなかった。**`/checkin` では引継ぎを鵜呑みにせず、
  `git log origin/main` と `pnpm run check` を必ず自分で走らせること**
- **サブプロジェクトを足したら、root のツールの対象範囲を必ず見直す。** Prettier・
  vitest・tsconfig は既定で下位ディレクトリを全部拾う。`app/` はこれで壊れた
- **`app/` は npm（`package-lock.json`）で管理されている。** `AGENTS.md` の
  「npm と yarn は使わない」と食い違っている `[曖昧]`（意図的かどうか不明）
- **計画が全部 `done` のとき `pnpm run plan:next` は「着手できる項目がありません」と出る。**
  故障ではなく正常な結果
- **`done` が「要件の取り下げ」を意味する項目が3件ある**（`T019` `T020` `T006`）。
  完了率をそのまま信用しないこと。経緯は `docs/decisions.md`「23.」「26.」
- **「動いた」と「届いた」は別物。** 実行の成否は API で確認できるが、通知が人の手元に
  届いたかは人に聞くしかない
- **`automation` を決めるときは「そのコマンドを誰が入力するか」まで下りて確かめる**
- **判定役に渡す記録には必ず対象の id を書く**
- **ドキュメントに具体例を載せるときは、その例を実際に実行・検証してから載せる**
- **`node -e` の中でトップレベル `return` は書けない**。フックの中で使うときは関数で包む
- **PR をスカッシュでマージするとリモートのブランチが自動削除される。** そのまま
  `--force-with-lease` すると `stale info` で失敗する。`git fetch --prune` してから通常の push
- **`git push` がプロキシの 503 で失敗することがある。** 指数バックオフで数回リトライする
- **この引継ぎ文の本文に、自動記録の目印（`session-end-stamp` の HTML コメント）を
  そのまま書かないこと。** 書くと自動記録がそこで本文を切り落とす
- 公式の `settings` ページだけは全文を読めていない（サイズ超過）

<!-- session-end-stamp -->

## セッション終了時点の状態（自動記録）

- 記録時刻: 2026-09-01 09:23 UTC
- ブランチ: `claude/checkin-ktuswb`
- HEAD: `a095b96`
- 未コミットの変更: なし
