<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import TraceCanvas from '$lib/components/TraceCanvas.svelte';
  import { SETS, getSetById, getKanjiByChar } from '$lib/data/sets.js';
  import { addClearedKanji } from '$lib/utils/clearedKanji';
  import { fade } from 'svelte/transition';
  import { uiLang } from '$lib/stores/langStore.js';
  import { translations } from '$lib/data/translations.js';

  // Svelte 5のリアクティブ翻訳マッピング
  let t = $derived(translations[$uiLang] || translations.ja);

  const typedSets = SETS as Record<string, any>;

  // Session 267 v5: 複数 sets= 対応（カンマ区切り）/ 単数 ?set= 互換も維持
  let rawKanjiChars = $derived(
    ($page.url.searchParams.get('kanji') ?? '')
      .split(',')
      .map((s) => decodeURIComponent(s).trim())
      .filter(Boolean)
  );

  let rawSetIds = $derived(
    ($page.url.searchParams.get('sets') ?? $page.url.searchParams.get('set') ?? 'popular_foreigners_500')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  let customKanjiSet = $derived(rawKanjiChars.length > 0 ? {
    id: 'custom_kanji',
    name: t.selectedKanjiSetName,
    reading: 'せんたくかんじ',
    kanji: rawKanjiChars.map((ch) => getKanjiByChar(ch)).filter(Boolean)
  } : null);
  let activeSets = $derived(
    customKanjiSet?.kanji?.length
      ? [customKanjiSet]
      : rawSetIds.map((id) => typedSets[id]).filter(Boolean)
  );
  // Session 273: 1 セット = 1 ステージ。複数選択時はセット毎にステージを進める
  let stageIndex = $state(0);
  let activeSet = $derived(activeSets[stageIndex] ?? activeSets[0] ?? getSetById('popular_foreigners_500'));
  let kanjis = $derived(activeSet.kanji);
  // 表示用セット名（現ステージのみ）
  let activeSetNames = $derived(activeSet.name);
  // 次ステージの有無（praise overlay の動線分岐）
  let hasNextStage = $derived(stageIndex < activeSets.length - 1);

  function goHome() {
    goto(`${base}/`);
  }
  function goSelect() {
    goto(`${base}/select`);
  }
  let currentIndex = $state(0);
  let activeKanji = $derived(kanjis[currentIndex] ?? kanjis[0]);
  let activeMeaningRows = $derived(getMeaningRows(activeKanji, $uiLang));

  let phase = $state('practice');
  let traceComps: any[] = $state([]);
  let animationStarted = $state(false);
  let showPraise = $state(false);
  let showDoneBtn = $state(false);
  let countdown = $state(0); // 0 = 非表示 / 3,2,1 = カウントダウン中
  let cdEl: HTMLDivElement | undefined = $state();
  // Session 266 v2: 各枠の「スタート押下済み」「できた!押下済み」を独立管理
  // → 全枠で最初からスタートボタンが表示され、押された枠だけ個別に start
  let startedFlags: boolean[] = $state([]);
  let completedFlags: boolean[] = $state([]);
  let savedFlags: boolean[] = $state([]);

  const EN_MEANING: Record<string, string> = {
    一: 'one', 二: 'two', 三: 'three', 四: 'four', 五: 'five', 六: 'six', 七: 'seven', 八: 'eight', 九: 'nine', 十: 'ten',
    百: 'hundred', 千: 'thousand', 万: 'ten thousand',
    上: 'up', 下: 'down', 中: 'middle', 左: 'left', 右: 'right', 前: 'before', 後: 'after', 内: 'inside', 外: 'outside',
    人: 'person', 女: 'woman', 男: 'man', 子: 'child', 母: 'mother', 父: 'father', 友: 'friend',
    日: 'day', 時: 'time', 今: 'now', 午: 'noon', 半: 'half', 天: 'sky',
    東: 'east', 西: 'west', 南: 'south', 北: 'north', 京: 'capital', 都: 'metropolis', 県: 'prefecture', 国: 'country', 土: 'earth', 山: 'mountain', 海: 'sea', 空: 'sky', 雨: 'rain',
    水: 'water', 火: 'fire', 木: 'tree', 金: 'gold', 気: 'spirit',
    文: 'sentence', 字: 'character', 語: 'language', 話: 'talk', 読: 'read', 書: 'write', 聞: 'hear', 見: 'see',
    学: 'study', 校: 'school', 先: 'ahead', 入: 'enter', 出: 'exit', 会: 'meet', 帰: 'return', 来: 'come', 行: 'go',
    名: 'name', 円: 'yen', 生: 'life', 白: 'white', 英: 'english', 駅: 'station', 電: 'electricity', 車: 'car', 道: 'road',
    家: 'house', 室: 'room', 店: 'shop', 社: 'company', 食: 'eat', 飲: 'drink', 買: 'buy',
    何: 'what', 毎: 'every', 分: 'minute', 本: 'book', 村: 'village', 町: 'town', 口: 'mouth', 神: 'god', 奈: 'Nara'
  };

  const ZH_MEANING: Record<string, string> = {
    一: '一', 二: '二', 三: '三', 四: '四', 五: '五', 六: '六', 七: '七', 八: '八', 九: '九', 十: '十',
    百: '百', 千: '千', 万: '万',
    上: '上', 下: '下', 中: '中', 左: '左', 右: '右', 前: '前', 後: '后', 内: '内', 外: '外',
    人: '人', 女: '女', 男: '男', 子: '孩子', 母: '母亲', 父: '父亲', 友: '朋友',
    日: '日', 時: '时间', 今: '现在', 午: '午', 半: '半', 天: '天',
    東: '东', 西: '西', 南: '南', 北: '北', 京: '京', 都: '都', 県: '县', 国: '国', 土: '土', 山: '山', 海: '海', 空: '天空', 雨: '雨',
    水: '水', 火: '火', 木: '木', 金: '金', 気: '气',
    文: '文', 字: '字', 語: '语言', 話: '说', 読: '读', 書: '写', 聞: '听', 見: '看',
    学: '学', 校: '学校', 先: '先', 入: '入', 出: '出', 会: '会', 帰: '回', 来: '来', 行: '去',
    名: '名字', 円: '日元', 生: '生', 白: '白', 英: '英语', 駅: '车站', 電: '电', 車: '车', 道: '道路',
    家: '家', 室: '房间', 店: '店', 社: '公司', 食: '吃', 飲: '喝', 買: '买',
    何: '什么', 毎: '每', 分: '分', 本: '书', 村: '村', 町: '町', 口: '口', 神: '神', 奈: '奈'
  };

  const KO_MEANING: Record<string, string> = {
    一: '하나', 二: '둘', 三: '셋', 四: '넷', 五: '다섯', 六: '여섯', 七: '일곱', 八: '여덟', 九: '아홉', 十: '열',
    百: '백', 千: '천', 万: '만',
    上: '위', 下: '아래', 中: '가운데', 左: '왼쪽', 右: '오른쪽', 前: '앞', 後: '뒤', 内: '안', 外: '밖',
    人: '사람', 女: '여자', 男: '남자', 子: '아이', 母: '어머니', 父: '아버지', 友: '친구',
    日: '날', 時: '시간', 今: '지금', 午: '정오', 半: '반', 天: '하늘',
    東: '동쪽', 西: '서쪽', 南: '남쪽', 北: '북쪽', 京: '수도', 都: '도시', 県: '현', 国: '나라', 土: '흙', 山: '산', 海: '바다', 空: '하늘', 雨: '비',
    水: '물', 火: '불', 木: '나무', 金: '금', 気: '기운',
    文: '글', 字: '글자', 語: '언어', 話: '말하다', 読: '읽다', 書: '쓰다', 聞: '듣다', 見: '보다',
    学: '배우다', 校: '학교', 先: '먼저', 入: '들어가다', 出: '나가다', 会: '만나다', 帰: '돌아가다', 来: '오다', 行: '가다',
    名: '이름', 円: '엔', 生: '삶', 白: '흰색', 英: '영어', 駅: '역', 電: '전기', 車: '차', 道: '길',
    家: '집', 室: '방', 店: '가게', 社: '회사', 食: '먹다', 飲: '마시다', 買: '사다',
    何: '무엇', 毎: '매', 分: '분', 本: '책', 村: '마을', 町: '거리', 口: '입', 神: '신', 奈: '나라'
  };

  const FALLBACK_MEANING: Record<string, Record<string, string>> = {
    en: EN_MEANING,
    zh: ZH_MEANING,
    ko: KO_MEANING,
  };

  // その言語に登録がなければ空文字を返す。別の言語で埋めない
  // ——埋めると、訳が入っているのか他言語に落ちているのかが画面から区別できない。
  function getMeaning(k: any, lang: string) {
    if (!k?.char) return '';
    return k.meanings?.[lang] ?? FALLBACK_MEANING[lang]?.[k.char] ?? '';
  }

  function getLangLabel(lang: string) {
    if (lang === 'ja') return t.meaningJaLabel;
    if (lang === 'zh') return t.meaningForeignLabelZh;
    if (lang === 'ko') return t.meaningForeignLabelKo;
    if (lang === 'vi') return t.meaningForeignLabelVi;
    if (lang === 'ne') return t.meaningForeignLabelNe;
    return t.meaningForeignLabelEn;
  }

  // 意味は「日本語 / 英語 / 選んだ言語」を常に同じ並びで出す。選んだ言語が
  // 日本語か英語のときは、同じ行が二度出ないよう 2 行になる。
  function getMeaningRows(k: any, lang: string) {
    const langs = lang === 'ja' || lang === 'en' ? ['ja', 'en'] : ['ja', 'en', lang];
    return langs.map((code) => ({
      code,
      label: getLangLabel(code),
      value: getMeaning(k, code),
    }));
  }

  // kanjis 変化時にフラグ配列を初期化
  $effect(() => {
    const len = kanjis.length;
    startedFlags = Array(len).fill(false);
    completedFlags = Array(len).fill(false);
    savedFlags = Array(len).fill(false);
  });

  // sets 変化時に currentIndex / stageIndex リセット（セット切替時の状態クリア）
  $effect(() => {
    rawSetIds.join(','); // 依存追跡
    currentIndex = 0;
    stageIndex = 0;
    showPraise = false;
    animationStarted = false;
    phase = 'practice';
  });

  // countdown 変更ごとにアニメ再起動（要素は破棄せず animation だけリセット）
  $effect(() => {
    const v = countdown;
    if (!cdEl || v <= 0) return;
    cdEl.style.animation = 'none';
    void cdEl.offsetWidth; // reflow を強制してアニメをリセット
    cdEl.style.animation = '';
  });

  // Session 273: 次ステージへ進む（複数選択時のセット間遷移）
  function nextStage() {
    if (!hasNextStage) return;
    showPraise = false;
    showDoneBtn = false;
    animationStarted = false;
    currentIndex = 0;
    traceComps.forEach((t) => t?.clearAll?.());
    stageIndex = stageIndex + 1;
    startedFlags = Array(kanjis.length).fill(false);
    completedFlags = Array(kanjis.length).fill(false);
    savedFlags = Array(kanjis.length).fill(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Session 273: 最終ステージ完了後の「もういっかい」= 全選択を最初のステージから
  function restartAll() {
    showPraise = false;
    showDoneBtn = false;
    animationStarted = false;
    currentIndex = 0;
    traceComps.forEach((t) => t?.clearAll?.());
    stageIndex = 0;
    startedFlags = Array(kanjis.length).fill(false);
    completedFlags = Array(kanjis.length).fill(false);
    savedFlags = Array(kanjis.length).fill(false);
  }

  async function runCountdownThen(action: () => void) {
    // Session 265: カウントダウン音声は削除（マスター指示）。視覚のみで 3-2-1 表示
    // 数字表示 970ms × 3 = 2.91 秒
    for (let i = 3; i >= 1; i--) {
      countdown = i;
      await new Promise((r) => setTimeout(r, 970));
      if (!animationStarted) {
        countdown = 0;
        return;
      }
    }
    countdown = 0;
    // 余韻 300ms → ナビスタート
    await new Promise((r) => setTimeout(r, 300));
    if (!animationStarted) return;
    action?.();
  }

  // Session 267 B1 修正: 配列要素直接代入を spread (.with) に統一して reactivity を確実発火
  //   → completedFlags.every() が done 後に再評価されず praise が出ないバグを解消
  /** @type {number[]} */
  let kanjiStartTs: number[] = $state([]);
  async function startKanji(i: number) {
    currentIndex = i;
    startedFlags = startedFlags.with(i, true);
    completedFlags = completedFlags.with(i, false);
    animationStarted = true;
    showDoneBtn = false;
    kanjiStartTs = kanjiStartTs.length === kanjis.length ? kanjiStartTs.slice() : Array(kanjis.length).fill(0);
    kanjiStartTs[i] = Date.now();
    await runCountdownThen(() => traceComps[i]?.replayDemo?.());
  }

  // 「もういっかい」: praise から最初に戻す（全枠リセット・スタートボタン復活）
  function retry() {
    showPraise = false;
    showDoneBtn = false;
    currentIndex = 0;
    traceComps.forEach((t) => t?.clearAll?.());
    startedFlags = Array(kanjis.length).fill(false);
    completedFlags = Array(kanjis.length).fill(false);
    savedFlags = Array(kanjis.length).fill(false);
    animationStarted = false;
  }

  async function replayKanji(i: number) {
    currentIndex = i;
    animationStarted = true;
    showDoneBtn = false;
    traceComps[i]?.clearAll?.();
    completedFlags = completedFlags.with(i, false);
    startedFlags = startedFlags.with(i, true);
    kanjiStartTs = kanjiStartTs.length === kanjis.length ? kanjiStartTs.slice() : Array(kanjis.length).fill(0);
    kanjiStartTs[i] = Date.now();
    await runCountdownThen(() => traceComps[i]?.replayDemo?.());
  }

  function recordKanjiCompletion(i: number) {
    const k = kanjis[i];
    if (!k?.char || savedFlags[i]) return;
    addClearedKanji(k.char);
    savedFlags = savedFlags.with(i, true);
  }

  function handleKanjiComplete(i: number) {
    if (i !== currentIndex) return;
    animationStarted = false;
    showDoneBtn = true;
  }

  function handleNaviDone(i: number) {
    handleKanjiComplete(i);
  }

  function doneAll() {
    recordKanjiCompletion(currentIndex);
    traceComps[currentIndex]?.freezeCompleted?.();
    completedFlags = completedFlags.with(currentIndex, true);
    showDoneBtn = false;
    showPraise = true;
  }

  function nextKanji() {
    if (currentIndex >= kanjis.length - 1) return;
    recordKanjiCompletion(currentIndex);
    traceComps[currentIndex]?.freezeCompleted?.();
    completedFlags = completedFlags.with(currentIndex, true);
    currentIndex = currentIndex + 1;
    animationStarted = false;
    showDoneBtn = false;
    startedFlags = startedFlags.with(currentIndex, false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function goNextPage() {
    if (currentIndex < kanjis.length - 1) {
      nextKanji();
      return;
    }
    if (hasNextStage) {
      recordKanjiCompletion(currentIndex);
      traceComps[currentIndex]?.freezeCompleted?.();
      completedFlags = completedFlags.with(currentIndex, true);
      nextStage();
      return;
    }
    doneAll();
  }

</script>

<svelte:head>
  <title>{t.writeSet(activeSetNames)} — {t.title}</title>
</svelte:head>

<main class="page">
  <button class="btn btn--icon home-pos" onclick={goHome} aria-label={t.goHome}>
    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12L12 3L21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 21H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  </button>

  {#if phase === 'practice'}
    <div class="topbar topbar-sticky">
      <div class="topbar-side-spacer" aria-hidden="true"></div>
      <div class="title-small">「{activeSetNames}」</div>
      <button class="btn btn--icon settings-btn" onclick={() => goto(`${base}/admin`)} aria-label={t.studyRecord}>
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 19H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 15V11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M12 15V7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M16 15V4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>


    <div class="play-area">
      <div class="canvas-area">
        {#each kanjis as k, i (k.char)}
          {#if i === currentIndex}
            <div class="canvas-wrap">
              <div class="canvas-host" class:locked={!startedFlags[i] || completedFlags[i]}>
                {#if !startedFlags[i]}
                  <div class="start-overlay">
                    <button
                      class="btn btn--primary frame-btn frame-btn--pulse"
                      onclick={() => startKanji(i)}
                    ><svg viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;margin-right:0.3em;vertical-align:middle;"><path d="M8 5v14l11-7z"/></svg> {t.startBtn}</button>
                  </div>
                {/if}
                <div class="reading-badge" aria-hidden="true">
                  <span class="reading-badge-reading"
                    >{activeSet.kanjiReadings?.[i] ?? k.reading ?? ''}</span
                  >
                  <dl class="reading-badge-meanings">
                    {#each activeMeaningRows as row (row.code)}
                      <div class="reading-badge-meaning">
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    {/each}
                  </dl>
                </div>
                <div class="page-indicator" aria-hidden="true">{i + 1} / {kanjis.length}</div>
                <TraceCanvas
                  bind:this={traceComps[i]}
                  kanji={k}
                  onRestart={() => startKanji(i)}
                  onNaviDone={() => handleNaviDone(i)}
                  onComplete={() => handleKanjiComplete(i)}
                />
                {#if countdown > 0}
                  <div class="countdown-overlay" aria-live="assertive">
                    <div class="countdown-num" bind:this={cdEl}>{countdown}</div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    {#if showDoneBtn}
      <div class="page-nav">
        <button class="btn btn--primary page-nav-btn shiny-btn-gold" onclick={goNextPage}>
          {currentIndex < kanjis.length - 1 || hasNextStage ? t.nextStage : t.doneBtn}
        </button>
        <button class="btn btn--secondary page-nav-btn" onclick={() => replayKanji(currentIndex)}>{t.tryAgain}</button>
        {#if currentIndex === kanjis.length - 1}
          <button class="btn btn--secondary page-nav-btn page-nav-btn--select" onclick={goSelect}>{t.backToSelectBtn}</button>
        {/if}
      </div>
    {/if}

    {#if showPraise}
      <div class="praise-overlay" role="dialog" aria-modal="true">
        <!-- 桜吹雪 + 金箔紙吹雪パーティクル -->
        <div class="sakura-container" aria-hidden="true">
          <div class="petal p1"></div>
          <div class="petal p2"></div>
          <div class="petal p3"></div>
          <div class="petal p4"></div>
          <div class="petal p5"></div>
          <div class="petal p6"></div>
          <div class="petal p7"></div>
          <div class="petal p8"></div>
          <div class="petal p9"></div>
          <div class="petal p10"></div>
          <div class="petal p11"></div>
          <div class="petal p12"></div>
          <div class="confetti c1"></div>
          <div class="confetti c2"></div>
          <div class="confetti c3"></div>
          <div class="confetti c4"></div>
          <div class="confetti c5"></div>
          <div class="confetti c6"></div>
          <div class="confetti c7"></div>
          <div class="confetti c8"></div>
          <div class="confetti c9"></div>
          <div class="confetti c10"></div>
          <div class="confetti c11"></div>
          <div class="confetti c12"></div>
        </div>
        <div class="praise-card">
          <div class="praise-actions">
            {#if hasNextStage}
              <button class="btn btn--primary big next-btn shiny-btn" onclick={nextStage}>{t.nextStage}</button>
              <button class="btn btn--secondary big" onclick={retry}>{t.tryAgain}</button>
            {:else}
              <button class="btn btn--primary big shiny-btn-gold" onclick={restartAll}>{t.tryAgain}</button>
              <button class="btn btn--secondary big" onclick={() => goto(`${base}/`)}>{t.goHome}</button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1.5rem;
    position: relative;
    background-color: #F5F0E6; /* 和紙 */
    background-image: 
      url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNNTQuNjI3IDBsLjgzLjgzLTI5LjQ2IDI5LjQ1OC0yOS40NTgtMjkuNDU4LjgzLS44MyAyOC42MjggMjguNjI3IDI4LjYzLTI4LjYyN3pNMzAgNjBsLTI5LjQ1OC0yOS40NTguODMtLjgzIDI4LjYyOCAyOC42MjcgMjguNjMtMjguNjI3LjgzLjgzLTI5LjQ2IDI5LjQ1OHoiIGZpbGw9IiM3ODcxNmMiIGZpbGwtb3BhY2l0eT0iMC4wOCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+'),
      linear-gradient(to bottom, rgba(245, 240, 230, 0.6) 0%, rgba(245, 240, 230, 0.95) 100%),
      url('/assets/generated-images/2026-05-22-home-bg.png');
    background-size: 60px 60px, cover, cover;
    background-position: center, center, center;
    background-repeat: repeat, no-repeat, no-repeat;
    background-blend-mode: multiply, normal, normal;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    overflow-x: hidden;
  }

  /* 設定ボタンの位置（左上） */
  .settings-pos {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 4;
  }
  .home-pos {
    position: fixed;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 120;
  }



  /* === start phase === */
  .start-screen {
    position: relative;
    z-index: 1;
    min-height: 75vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2rem;
    width: 100%;
    max-width: 480px;
  }
  .kanji-display {
    font-size: clamp(3.2rem, 14vw, 5.8rem); /* モバイル向けに極微調整 */
    line-height: 1.2;
    color: #262626; /* 墨 */
    /* 高級和紙 (金粉ちりばめ風) */
    background: linear-gradient(135deg, #FCFAF2 0%, #FAF5EA 60%, #F5EFE1 100%);
    border: 1.5px solid rgba(212, 175, 55, 0.25); /* 金蒔絵の細枠 */
    border-radius: 0.8rem;
    padding: 0.8rem 2.4rem;
    box-shadow: 
      0 8px 24px rgba(38, 38, 38, 0.08), 
      inset 0 0 16px rgba(212, 175, 55, 0.08), /* 金粉グロー */
      inset 0 -3px 0 rgba(38, 38, 38, 0.04);
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }
  .start-screen h1 {
    font-size: clamp(1.25rem, 4.5vw, 1.7rem);
    color: #262626;
    margin: 0;
    font-weight: 700;
    line-height: 1.6;
    padding: 0.5rem 1rem;
  }

  /* === practice phase === */
  .topbar {
    z-index: 10;
    width: 100%;
    max-width: 480px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .topbar-sticky {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(245, 240, 230, 0.95); /* 和紙半透明 */
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 0.5rem 0.75rem;
    border-radius: 0 0 0.8rem 0.8rem;
    border: 1px solid rgba(38, 38, 38, 0.1);
    border-top: none;
    box-shadow: 0 2px 10px rgba(38, 38, 38, 0.08);
  }
  .topbar-side-spacer,
  .settings-btn {
    flex: 0 0 2.6rem;
  }
  .title-small {
    flex: 1;
    text-align: center;
    font-size: clamp(1.2rem, 5vw, 1.6rem);
    font-weight: 700;
    color: #262626; /* 墨 */
    background: #ffffff; /* 白紙 */
    border: 1px solid rgba(38, 38, 38, 0.1);
    border-radius: 999px;
    padding: 0.2rem 1rem;
    margin: 0 0.5rem;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }

  /* なぞり書きのひらがなバッジ */
  .reading-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    z-index: 4;
    font-size: clamp(1rem, 3.5vw, 1.25rem);
    font-weight: 700;
    color: #F5F0E6; /* 和紙 */
    background: #355070; /* 深藍 */
    border-radius: 0.3rem;
    padding: 0.1rem 0.4rem;
    pointer-events: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
  }
  .reading-badge-reading {
    line-height: 1.2;
  }
  .reading-badge-meanings {
    margin: 0;
    font-size: 0.7em;
    font-weight: 500;
    line-height: 1.35;
  }
  /* 3 行を同じ形で並べる。値が空の行もラベルだけ残し、
     「まだ登録がない」ことが読み手に伝わるようにする。 */
  .reading-badge-meaning {
    display: grid;
    grid-template-columns: 4.5em 1fr;
    column-gap: 0.4rem;
  }
  .reading-badge-meaning dt {
    opacity: 0.7;
  }
  .reading-badge-meaning dd {
    margin: 0;
    min-height: 1.35em;
  }

  .play-area {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 480px;
    display: flex;
    justify-content: center;
    margin-top: 4rem;
  }
  
  .canvas-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    width: 100%;
    align-items: center;
    justify-content: center;
  }
  .canvas-wrap {
    flex: 1 1 0;
    min-width: 0;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .canvas-host {
    position: relative;
    width: 100%;
  }
  .canvas-host.locked :global(canvas) {
    pointer-events: none;
    touch-action: none;
  }
  .page-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 4;
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    font-weight: 800;
    color: #262626;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(53, 80, 112, 0.35);
    border-radius: 0.35rem;
    padding: 0.1rem 0.45rem;
    pointer-events: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  /* === スマホ縦配置の最適化 === */
  @media (max-width: 600px) {
    .play-area {
      margin-top: 3.5rem;
    }
    .canvas-wrap {
      width: 100%;
      max-width: min(100%, 430px);
      margin: 0 auto;
    }
    .reading-badge {
      top: 0.4rem;
      left: 0.4rem;
      font-size: 0.9rem;
    }
  }

  .start-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    pointer-events: auto;
    background: rgba(245, 240, 230, 0.4);
    backdrop-filter: blur(2px);
    border-radius: 4px;
  }

  .page-nav {
    width: min(480px, calc(100vw - 2rem));
    margin: 0.5rem auto 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.45rem;
  }
  .page-nav-btn {
    min-width: 5.25rem;
    padding: 0.45rem 0.7rem;
    font-size: 0.85rem;
    line-height: 1.15;
    white-space: nowrap;
  }
  .page-nav-btn--select {
    min-width: 8.25rem;
  }
  @media (max-width: 600px) {
    .page-nav {
      width: min(100%, calc(100vw - 1.5rem));
      margin-top: 0.4rem;
      padding-right: 0.25rem;
    }
    .page-nav-btn {
      min-width: 4.75rem;
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
    }
    .page-nav-btn--select {
      min-width: 7.2rem;
    }
  }

  /* === カウントダウンオーバーレイ（上品な朱色表示） === */
  .countdown-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 6;
    pointer-events: none;
    background: transparent;
  }
  .countdown-num {
    font-size: clamp(5rem, 20vw, 8rem);
    font-weight: 800;
    color: #C84A3A; /* 朱 */
    text-shadow: 1px 2px 4px rgba(38, 38, 38, 0.15);
    animation: countdown-pop 0.97s ease-out forwards;
    line-height: 1;
  }
  @keyframes countdown-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    18%  { transform: scale(1.2); opacity: 1; }
    80%  { transform: scale(1.0); opacity: 1; }
    100% { transform: scale(1.0); opacity: 1; }
  }

  /* === 評価オーバーレイ（和風モダン和紙カード） === */
  .praise-overlay {
    position: fixed;
    inset: 0;
    background: rgba(38, 38, 38, 0.6); /* 墨の透過 */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    animation: fadeIn 0.3s ease-out;
  }
  .praise-card {
    position: relative;
    background: #F5F0E6; /* 和紙 */
    border: 1px solid rgba(38, 38, 38, 0.15);
    border-radius: 0.8rem;
    padding: 2.5rem 2rem;
    text-align: center;
    box-shadow: 0 15px 40px rgba(38, 38, 38, 0.25);
    width: 90%;
    max-width: 360px;
    animation: pop 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .praise-actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    align-items: stretch;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pop {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  /* === ボタン統一デザイン（和風プレミアム立体・工芸品調） === */
  :global(.btn) {
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    font-weight: 900;
    cursor: pointer;
    border-radius: 0.4rem; /* 和風モダンな角丸控えめ */
    border: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s, background-color 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    outline: none;
  }
  
  /* primary（メイン CTA・朱漆三層塗り・金蒔絵フレーム） */
  :global(.btn--primary) {
    /* 朱漆グラデーション */
    background: linear-gradient(135deg, #e05c4c 0%, #C84A3A 60%, #9c2d22 100%);
    color: #F5F0E6; /* 和紙 */
    padding: 0.85rem 2.4rem;
    font-size: clamp(1.05rem, 4vw, 1.28rem);
    border: 1.5px solid #D4AF37; /* 金蒔絵の枠線 */
    box-shadow: 
      0 6px 18px rgba(200, 74, 58, 0.28), 
      inset 0 1px 2px rgba(255, 255, 255, 0.28),
      inset 0 -4px 0 rgba(0, 0, 0, 0.28);
    text-shadow: 0 2px 3px rgba(38, 38, 38, 0.25);
    letter-spacing: 0.08em;
  }
  :global(.btn--primary.big) {
    padding: 1.1rem 3.8rem;
    font-size: clamp(1.25rem, 5vw, 1.55rem);
    box-shadow: 
      0 10px 24px rgba(200, 74, 58, 0.38), 
      0 0 12px rgba(212, 175, 55, 0.15),
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -4px 0 rgba(0, 0, 0, 0.28);
  }
  :global(.btn--primary:hover) {
    background: linear-gradient(135deg, #e56b5c 0%, #d45645 60%, #ab3428 100%);
    box-shadow: 
      0 12px 30px rgba(200, 74, 58, 0.48), 
      0 0 20px rgba(212, 175, 55, 0.32),
      inset 0 1px 3px rgba(255, 255, 255, 0.35),
      inset 0 -4px 0 rgba(0, 0, 0, 0.28);
    transform: translateY(-2px);
  }
  :global(.btn--primary:active) {
    transform: translateY(2px);
    box-shadow: 
      0 4px 10px rgba(200, 74, 58, 0.25), 
      inset 0 1px 1px rgba(0, 0, 0, 0.2),
      inset 0 -2px 0 rgba(0, 0, 0, 0.28);
  }

  /* secondary（補助・墨塗蒔絵枠線ボタン） */
  :global(.btn--secondary) {
    background: linear-gradient(135deg, #FAF6EE 0%, #F5F0E6 100%); /* 和紙極上 */
    color: #262626; /* 墨 */
    padding: 0.75rem 2rem;
    font-size: clamp(0.98rem, 3.6vw, 1.15rem);
    border: 1.5px solid rgba(38, 38, 38, 0.8);
    box-shadow: 
      0 4px 10px rgba(38, 38, 38, 0.08), 
      inset 0 1px 2px rgba(255, 255, 255, 0.6),
      inset 0 -3px 0 rgba(0, 0, 0, 0.1);
    letter-spacing: 0.05em;
  }
  :global(.btn--secondary.big) {
    padding: 1rem 2.8rem;
    font-size: clamp(1.15rem, 4.5vw, 1.35rem);
  }
  :global(.btn--secondary:hover) {
    background: linear-gradient(135deg, #ffffff 0%, #eae3d2 100%);
    border-color: #C84A3A; /* 朱漆枠線へ変化 */
    color: #C84A3A;
    box-shadow: 
      0 6px 14px rgba(200, 74, 58, 0.15), 
      inset 0 1px 2px rgba(255, 255, 255, 0.6),
      inset 0 -3px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-1.5px);
  }
  :global(.btn--secondary:active) {
    transform: translateY(1.5px);
    box-shadow: 0 2px 4px rgba(38, 38, 38, 0.08);
  }

  /* icon（和風モダン円形・螺鈿金箔仕立て） */
  :global(.btn--icon) {
    width: 3.1rem;
    height: 3.1rem;
    padding: 0;
    border-radius: 50%;
    /* 金箔グラデーション背景 */
    background: linear-gradient(135deg, #FFE082 0%, #D4AF37 50%, #AA7C11 100%);
    color: #1a1a1a; /* 漆黒アイコン */
    border: 1px solid rgba(255, 255, 255, 0.45);
    box-shadow: 
      0 6px 16px rgba(38, 38, 38, 0.16), 
      inset 0 1px 2px rgba(255, 255, 255, 0.5);
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  }
  :global(.btn--icon:hover) {
    background: linear-gradient(135deg, #FFF0B2 0%, #E6C250 50%, #C29625 100%);
    color: #C84A3A; /* 朱漆ホバー */
    box-shadow: 
      0 8px 22px rgba(38, 38, 38, 0.24), 
      0 0 10px rgba(212, 175, 55, 0.3);
    transform: rotate(15deg) scale(1.08);
  }
  :global(.btn--icon:active) {
    transform: translateY(2px) scale(0.95);
    box-shadow: 0 3px 8px rgba(38, 38, 38, 0.15);
  }
  :global(.btn--disabled),
  :global(.btn[disabled]) {
    cursor: default;
    opacity: 0.5;
    pointer-events: none;
    filter: grayscale(0.5);
  }

  /* === 桜吹雪 + 金箔紙吹雪セレブレーション === */
  .sakura-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 21;
    overflow: hidden;
  }

  /* 桜花弁ベース */
  .petal {
    position: absolute;
    top: -40px;
    width: 14px;
    height: 14px;
    background: radial-gradient(ellipse at 30% 30%, #ffb7c5 0%, #f48fb1 60%, #e57395 100%);
    border-radius: 50% 0 50% 50%;
    opacity: 0.85;
    will-change: transform;
  }

  /* 金箔紙吹雪ベース */
  .confetti {
    position: absolute;
    top: -30px;
    width: 8px;
    height: 12px;
    opacity: 0.9;
    will-change: transform;
  }

  /* --- 桜花弁 12 枚（3 落下パターン × 4） --- */
  .p1  { left:  5%; width: 16px; height: 16px; animation: sakura-fall-a 4.2s 0.0s ease-in-out infinite; }
  .p2  { left: 15%; width: 12px; height: 12px; animation: sakura-fall-b 5.0s 0.3s ease-in-out infinite; }
  .p3  { left: 25%; width: 14px; height: 14px; animation: sakura-fall-c 4.8s 0.6s ease-in-out infinite; }
  .p4  { left: 35%; width: 10px; height: 10px; animation: sakura-fall-a 5.5s 0.9s ease-in-out infinite; }
  .p5  { left: 45%; width: 15px; height: 15px; animation: sakura-fall-b 4.0s 0.2s ease-in-out infinite; }
  .p6  { left: 55%; width: 11px; height: 11px; animation: sakura-fall-c 5.2s 1.1s ease-in-out infinite; }
  .p7  { left: 65%; width: 13px; height: 13px; animation: sakura-fall-a 4.6s 0.5s ease-in-out infinite; }
  .p8  { left: 75%; width: 16px; height: 16px; animation: sakura-fall-b 5.8s 0.8s ease-in-out infinite; }
  .p9  { left: 85%; width: 12px; height: 12px; animation: sakura-fall-c 4.3s 1.4s ease-in-out infinite; }
  .p10 { left: 10%; width: 14px; height: 14px; animation: sakura-fall-b 5.1s 1.7s ease-in-out infinite; }
  .p11 { left: 50%; width: 10px; height: 10px; animation: sakura-fall-a 4.9s 2.0s ease-in-out infinite; }
  .p12 { left: 90%; width: 13px; height: 13px; animation: sakura-fall-c 5.4s 0.4s ease-in-out infinite; }

  /* --- 金箔紙吹雪 12 枚（3 落下パターン × 4） --- */
  .c1  { left:  8%; background: linear-gradient(135deg, #FFE082, #D4AF37); animation: confetti-fall-a 3.8s 0.1s ease-in-out infinite; }
  .c2  { left: 18%; background: linear-gradient(135deg, #D4AF37, #AA7C11); animation: confetti-fall-b 4.5s 0.4s ease-in-out infinite; }
  .c3  { left: 28%; background: linear-gradient(135deg, #FFE082, #D4AF37); animation: confetti-fall-c 4.1s 0.7s ease-in-out infinite; }
  .c4  { left: 38%; background: linear-gradient(135deg, #D4AF37, #FFE082); animation: confetti-fall-a 5.0s 1.0s ease-in-out infinite; }
  .c5  { left: 48%; background: linear-gradient(135deg, #FFE082, #AA7C11); animation: confetti-fall-b 3.6s 0.2s ease-in-out infinite; }
  .c6  { left: 58%; background: linear-gradient(135deg, #D4AF37, #FFE082); animation: confetti-fall-c 4.7s 1.3s ease-in-out infinite; }
  .c7  { left: 68%; background: linear-gradient(135deg, #FFE082, #D4AF37); animation: confetti-fall-a 4.3s 0.6s ease-in-out infinite; }
  .c8  { left: 78%; background: linear-gradient(135deg, #AA7C11, #D4AF37); animation: confetti-fall-b 5.3s 0.9s ease-in-out infinite; }
  .c9  { left: 88%; background: linear-gradient(135deg, #FFE082, #D4AF37); animation: confetti-fall-c 3.9s 1.5s ease-in-out infinite; }
  .c10 { left: 12%; background: linear-gradient(135deg, #D4AF37, #FFE082); animation: confetti-fall-b 4.6s 1.8s ease-in-out infinite; }
  .c11 { left: 42%; background: linear-gradient(135deg, #FFE082, #AA7C11); animation: confetti-fall-a 5.1s 2.1s ease-in-out infinite; }
  .c12 { left: 72%; background: linear-gradient(135deg, #D4AF37, #FFE082); animation: confetti-fall-c 4.4s 0.3s ease-in-out infinite; }

  /* 桜花弁 落下パターンA: 左揺れメイン */
  @keyframes sakura-fall-a {
    0%   { transform: translateY(-40px) rotate(0deg) scale(1);    opacity: 0; }
    10%  { opacity: 0.9; }
    25%  { transform: translateY(25vh) rotate(90deg) translateX(-30px) scale(0.9); }
    50%  { transform: translateY(50vh) rotate(200deg) translateX(20px) scale(1.05); }
    75%  { transform: translateY(75vh) rotate(310deg) translateX(-15px) scale(0.85); }
    100% { transform: translateY(105vh) rotate(420deg) translateX(10px) scale(0.7); opacity: 0; }
  }

  /* 桜花弁 落下パターンB: 右揺れメイン + 大きいwobble */
  @keyframes sakura-fall-b {
    0%   { transform: translateY(-40px) rotate(0deg) scale(0.8);  opacity: 0; }
    10%  { opacity: 0.85; }
    25%  { transform: translateY(22vh) rotate(-80deg) translateX(40px) scale(1.1); }
    50%  { transform: translateY(48vh) rotate(-180deg) translateX(-25px) scale(0.9); }
    75%  { transform: translateY(72vh) rotate(-300deg) translateX(35px) scale(1.0); }
    100% { transform: translateY(108vh) rotate(-400deg) translateX(-10px) scale(0.6); opacity: 0; }
  }

  /* 桜花弁 落下パターンC: ゆっくり蛇行 */
  @keyframes sakura-fall-c {
    0%   { transform: translateY(-40px) rotate(45deg) scale(1.1);  opacity: 0; }
    10%  { opacity: 0.8; }
    20%  { transform: translateY(18vh) rotate(120deg) translateX(20px) scale(0.95); }
    40%  { transform: translateY(38vh) rotate(220deg) translateX(-35px) scale(1.05); }
    60%  { transform: translateY(58vh) rotate(330deg) translateX(25px) scale(0.85); }
    80%  { transform: translateY(80vh) rotate(400deg) translateX(-20px) scale(0.9); }
    100% { transform: translateY(110vh) rotate(500deg) translateX(5px) scale(0.65); opacity: 0; }
  }

  /* 金箔 落下パターンA: ゆらゆら回転 */
  @keyframes confetti-fall-a {
    0%   { transform: translateY(-30px) rotateX(0deg) rotateZ(0deg) scale(1);   opacity: 0; }
    8%   { opacity: 0.95; }
    25%  { transform: translateY(25vh) rotateX(90deg) rotateZ(45deg) translateX(-20px) scale(0.9); }
    50%  { transform: translateY(52vh) rotateX(180deg) rotateZ(120deg) translateX(15px) scale(1.1); }
    75%  { transform: translateY(78vh) rotateX(270deg) rotateZ(200deg) translateX(-10px) scale(0.85); }
    100% { transform: translateY(108vh) rotateX(360deg) rotateZ(300deg) translateX(5px) scale(0.7); opacity: 0; }
  }

  /* 金箔 落下パターンB: フラッター */
  @keyframes confetti-fall-b {
    0%   { transform: translateY(-30px) rotateY(0deg) rotateZ(0deg) scale(0.9);  opacity: 0; }
    8%   { opacity: 0.9; }
    30%  { transform: translateY(28vh) rotateY(120deg) rotateZ(-60deg) translateX(30px) scale(1.05); }
    55%  { transform: translateY(55vh) rotateY(240deg) rotateZ(-150deg) translateX(-20px) scale(0.8); }
    80%  { transform: translateY(82vh) rotateY(340deg) rotateZ(-250deg) translateX(15px) scale(0.95); }
    100% { transform: translateY(110vh) rotateY(400deg) rotateZ(-340deg) translateX(-5px) scale(0.6); opacity: 0; }
  }

  /* 金箔 落下パターンC: 斜め落下 */
  @keyframes confetti-fall-c {
    0%   { transform: translateY(-30px) rotate(0deg) scale(1.1);   opacity: 0; }
    8%   { opacity: 0.85; }
    25%  { transform: translateY(24vh) rotate(70deg) translateX(-25px) scale(0.9); }
    50%  { transform: translateY(50vh) rotate(160deg) translateX(30px) scale(1.0); }
    75%  { transform: translateY(76vh) rotate(260deg) translateX(-18px) scale(0.85); }
    100% { transform: translateY(106vh) rotate(360deg) translateX(8px) scale(0.65); opacity: 0; }
  }

  /* 漆器光沢反射エフェクト (シマー・極美) */
  :global(.shiny-btn), :global(.shiny-btn-gold) {
    position: relative;
    overflow: hidden;
  }
  :global(.shiny-btn::after) {
    content: '';
    position: absolute;
    top: -50%;
    left: -70%;
    width: 35%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.38) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(25deg);
    animation: shimmer 6s infinite linear;
  }
  /* 蒔絵の黄金反射エフェクト (シマー・極美) */
  :global(.shiny-btn-gold::after) {
    content: '';
    position: absolute;
    top: -50%;
    left: -70%;
    width: 40%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(212, 175, 55, 0) 0%,
      rgba(212, 175, 55, 0.55) 50%,
      rgba(212, 175, 55, 0) 100%
    );
    transform: rotate(25deg);
    animation: shimmer 5s infinite linear;
  }

  @keyframes shimmer {
    0% { left: -80%; }
    18% { left: 150%; }
    100% { left: 150%; }
  }
</style>
