<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { SETS, SET_ORDER, CATEGORIES, CATEGORY_ORDER, getSetsByCategory } from '$lib/data/sets.js';
  import { onMount } from 'svelte';
  import { uiLang } from '$lib/stores/langStore.js';
  import { translations } from '$lib/data/translations.js';

  let titleVisible = $state(false);
  let contentVisible = $state(false);
  let bottomVisible = $state(false);

  let t = $derived(translations[$uiLang] || translations.ja);

  onMount(() => {
    setTimeout(() => { titleVisible = true; }, 100);
    setTimeout(() => { contentVisible = true; }, 1400);
    setTimeout(() => { bottomVisible = true; }, 2200);
  });

  function startPlay() {
    goto(`${base}/select`);
  }
</script>

<svelte:head>
  <title>{t.title} — {t.subtitle}</title>
</svelte:head>
<main class="page">

  <!-- 管理画面ボタン（左上） -->
  <button
    class="btn btn--icon settings-pos"
    onclick={() => goto(`${base}/admin`)}
    aria-label={t.studyRecord}
  >
    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 19H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M8 15V11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M12 15V7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M16 15V4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  </button>

  <!-- タイトル -->
  <div class="title-area" class:visible={titleVisible}>
    <div class="title-animation-container">

      <!-- 黄金英字「Senbon」レイヤー -->
      <div class="alphabet-layer">
        <svg class="title-svg" viewBox="0 0 280 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFE082"/>
              <stop offset="40%" stop-color="#D4AF37"/>
              <stop offset="75%" stop-color="#AA7C11"/>
              <stop offset="100%" stop-color="#F3E5AB"/>
            </linearGradient>
          </defs>
          <text
            x="140" y="45"
            text-anchor="middle"
            font-family="'Hiragino Mincho ProN', 'Yu Mincho', 'Georgia', serif"
            font-size="48"
            font-weight="900"
            fill="url(#gold-grad)"
            letter-spacing="8"
            class="title-text-svg"
          >Senbon</text>
        </svg>
      </div>

    </div>
    <span class="title-sub">{t.subtitle}</span>
  </div>

  <!-- 確定ボタン (下ブロック - 中央フェード完了後0.5秒あけてフェード1秒) -->
  {#if bottomVisible}
    <button class="start-play-btn btn btn--primary big shiny-btn-gold fade-in-1s" onclick={startPlay}>
      <svg viewBox="0 0 24 24" fill="currentColor" style="width:1.1rem;height:1.1rem;margin-right:0.4rem">
        <path d="M8 5v14l11-7z"/>
      </svg>
      {t.playBtn}
    </button>
  {/if}

  <!-- 同梱データの帰属表示（KanjiVG の CC BY-SA 3.0 が要求する義務。文面は原典どおり英語で出す） -->
  <footer class="credits" class:visible={bottomVisible}>
    <p>
      Stroke order data from
      <a href="http://kanjivg.tagaini.net" target="_blank" rel="noopener noreferrer">KanjiVG</a>
      by Ulrich Apel, licensed under
      <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>.
    </p>
    <p>
      Meanings and readings derived in part from
      <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">KANJIDIC2</a>
      (EDRDG, CC BY-SA 4.0) and the
      <a href="https://www.unicode.org/copyright.html" target="_blank" rel="noopener noreferrer">Unihan Database</a>
      (© Unicode, Inc.).
    </p>
  </footer>
</main>

<style>
  /* ─── ページ ─── */
  .page {
    position: relative;
    z-index: 2;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #F5F0E6;
    background-image: linear-gradient(
        to bottom,
        rgba(245, 240, 230, 0.15) 0%,
        rgba(245, 240, 230, 0.75) 50%,
        rgba(245, 240, 230, 0.92) 100%
      ),
      url('/assets/generated-images/2026-05-22-home-bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem 3rem;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }

  /* ─── 管理ボタン ─── */
  .settings-pos {
    position: fixed;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 100;
  }
  .icon-svg { width: 1.2rem; height: 1.2rem; }

  /* ─── タイトル (3段階プレミアムアニメーション) ─── */
  .title-area {
    position: relative;
    z-index: 3;
    margin-top: 10vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    opacity: 0;
    transform: translateY(-15px);
    transition: opacity 1.5s ease-out, transform 1.5s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .title-area.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .title-animation-container {
    position: relative;
    width: clamp(220px, 60vw, 320px);
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 段階1 & 2: 漢字「千本」レイヤー */
  /* 黄金英字「Senbon」レイヤー */
  .alphabet-layer {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    will-change: transform, opacity;
    animation: alphabet-fadeup 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes alphabet-fadeup {
    0% { opacity: 0; transform: translateY(5px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .title-svg {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 3px 6px rgba(38, 38, 38, 0.25));
  }

  /* 黄金「Senbon」レイヤー */
  .title-text-svg {
    fill: url(#gold-grad);
  }

  /* サブタイトル (Senbonとタイミングを揃える) */
  .title-sub {
    font-size: clamp(0.9rem, 3.5vw, 1.25rem);
    font-weight: 900;
    color: #C84A3A;
    letter-spacing: 0.45em;
    text-indent: 0.45em;
    margin-top: 0.6rem;
    opacity: 0;
    text-shadow: 0 2px 4px rgba(200, 74, 58, 0.12);
    will-change: transform, opacity;
    animation: sub-fadeup-premium 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes sub-fadeup-premium {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 0.95; transform: translateY(0); }
  }



  /* ─── 確定ボタン ─── */
  .start-play-btn {
    position: sticky;
    bottom: 1.5rem;
    z-index: 10;
    width: calc(100% - 2rem);
    max-width: 360px;
    margin-top: 4.8rem;
    display: flex !important;
    align-items: center;
    justify-content: center;
    animation: start-pulse 2.5s ease-in-out infinite;
    box-sizing: border-box;
  }
  @keyframes start-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(200,74,58,0.3), 0 0 10px rgba(212,175,55,0.15); }
    50%      { transform: scale(1.02); box-shadow: 0 10px 28px rgba(200,74,58,0.4), 0 0 18px rgba(212,175,55,0.3); }
  }

  /* ─── クレジット（第三者データの帰属表示） ─── */
  .credits {
    position: relative;
    z-index: 3;
    margin-top: 3.2rem;
    padding-bottom: 4.5rem; /* sticky な開始ボタンに文字が隠れないための逃げ */
    max-width: 32rem;
    text-align: center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 0.62rem;
    line-height: 1.7;
    color: rgba(38, 38, 38, 0.52);
    opacity: 0;
    transition: opacity 1.2s ease-out;
  }
  .credits.visible {
    opacity: 1;
  }
  .credits p {
    margin: 0.2rem 0;
  }
  .credits a {
    color: rgba(156, 45, 34, 0.75);
    text-decoration: none;
    border-bottom: 1px solid rgba(156, 45, 34, 0.26);
  }
  .credits a:hover {
    color: #9c2d22;
    border-bottom-color: rgba(156, 45, 34, 0.6);
  }

  /* ─── 共通：フェードイン1秒（コウヘイさん指定） ─── */
  .fade-in-1s {
    animation: fadeUp-1s 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    will-change: transform, opacity;
  }

  @keyframes fadeUp-1s {
    0%   { opacity: 0; transform: translateY(15px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  /* ─── ボタン共通（和風プレミアム立体・工芸品調） ─── */
  :global(.btn) {
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    font-weight: 900;
    cursor: pointer;
    border-radius: 0.4rem;
    border: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s, background-color 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    outline: none;
  }
  :global(.btn--primary) {
    background: linear-gradient(135deg, #e05c4c 0%, #C84A3A 60%, #9c2d22 100%);
    color: #F5F0E6;
    padding: 0.85rem 2.4rem;
    font-size: clamp(1.05rem, 4vw, 1.28rem);
    border: 1.5px solid #D4AF37;
    box-shadow: 0 6px 18px rgba(200, 74, 58, 0.28), inset 0 1px 2px rgba(255,255,255,0.28), inset 0 -4px 0 rgba(0,0,0,0.28);
    text-shadow: 0 2px 3px rgba(38, 38, 38, 0.25);
    letter-spacing: 0.08em;
  }
  :global(.btn--primary.big) {
    padding: 1rem 2.5rem;
    font-size: clamp(1.1rem, 4.5vw, 1.35rem);
  }
  :global(.btn--primary:hover) {
    background: linear-gradient(135deg, #e56b5c 0%, #d45645 60%, #ab3428 100%);
    box-shadow: 0 12px 30px rgba(200,74,58,0.48), 0 0 20px rgba(212,175,55,0.32), inset 0 1px 3px rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.28);
    transform: translateY(-2px);
  }
  :global(.btn--primary:active) {
    transform: translateY(2px);
    box-shadow: 0 4px 10px rgba(200,74,58,0.25), inset 0 1px 1px rgba(0,0,0,0.2), inset 0 -2px 0 rgba(0,0,0,0.28);
  }

  /* icon */
  :global(.btn--icon) {
    width: 2.6rem;
    height: 2.6rem;
    padding: 0;
    border-radius: 50%;
    background: rgba(245, 240, 230, 0.7);
    color: #262626;
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow: 0 4px 10px rgba(38, 38, 38, 0.08);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  }
  :global(.btn--icon:hover) {
    background: rgba(234, 227, 210, 0.9);
    color: #C84A3A;
    box-shadow: 0 6px 15px rgba(38, 38, 38, 0.15);
  }
  :global(.btn--icon:active) {
    transform: translateY(1.5px);
    box-shadow: 0 2px 4px rgba(38, 38, 38, 0.08);
  }

  /* 蒔絵シマー */
  :global(.shiny-btn-gold) {
    position: relative;
    overflow: hidden;
  }
  :global(.shiny-btn-gold::after) {
    content: '';
    position: absolute;
    top: -50%;
    left: -70%;
    width: 40%;
    height: 200%;
    background: linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0) 100%);
    transform: rotate(25deg);
    animation: shimmer 5s infinite linear;
  }
  @keyframes shimmer {
    0%   { left: -80%; }
    18%  { left: 150%; }
    100% { left: 150%; }
  }
</style>
