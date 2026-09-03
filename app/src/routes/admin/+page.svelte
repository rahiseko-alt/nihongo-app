<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { getClearedKanji, clearClearedKanji } from '$lib/utils/clearedKanji';
  import { uiLang } from '$lib/stores/langStore.js';
  import { translations } from '$lib/data/translations.js';

  let clearedKanjiList: string[] = $state([]);
  let loading = $state(true);
  let showLearnedPanel = $state(false);

  let t = $derived(translations[$uiLang] || translations.ja);
  let toriiProgress = $derived(Math.min(clearedKanjiList.length, 1000));
  let learnedListLabel = $derived(t.learnedKanjiList);
  let closeLabel = $derived(t.closeBtn);

  function loadProgress() {
    loading = true;
    clearedKanjiList = getClearedKanji();
    loading = false;
  }

  onMount(() => {
    loadProgress();
  });

  function goHome() {
    goto(`${base}/`);
  }

  function toggleLearnedPanel() {
    showLearnedPanel = !showLearnedPanel;
  }

  function resetProgress() {
    if (!confirm(t.clearConfirm)) return;
    clearClearedKanji();
    loadProgress();
  }
</script>

<svelte:head>
  <title>{t.studyLogs} — {t.title}</title>
</svelte:head>

<main class="page">
  <button class="btn btn--icon home-pos" onclick={goHome} aria-label={t.goHome}>
    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 1.15rem; height: 1.15rem;">
      <path d="M3 12L12 3L21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 21H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  </button>

  {#if !showLearnedPanel}
    <button class="learned-toggle" onclick={toggleLearnedPanel} aria-expanded={showLearnedPanel}>
      {learnedListLabel}
    </button>
  {/if}

  <section class="scene animate-fade-in" aria-label={t.toriiCollection}>
    <div class="scene-head">
      <span class="scene-count">{toriiProgress} / 1000</span>
      <button class="reset-link" onclick={resetProgress}>{t.clearData}</button>
    </div>
    <div class="mist-sando" aria-hidden="true">
    </div>
  </section>

  <aside class="learned-panel" class:open={showLearnedPanel}>
    <div class="learned-header">
      <div class="learned-title-row">
        <strong>{learnedListLabel}</strong>
        <button class="learned-close" onclick={toggleLearnedPanel}>{closeLabel}</button>
      </div>
      <span>{toriiProgress}</span>
    </div>
    <div class="learned-list">
      {#if loading}
        <p class="learned-empty">{t.loadingData}</p>
      {:else if clearedKanjiList.length === 0}
        <p class="learned-empty">{t.toriiEmpty}</p>
      {:else}
        {#each clearedKanjiList as kanji}
          <span class="learned-item">{kanji}</span>
        {/each}
      {/if}
    </div>
  </aside>
</main>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
    background-color: #f5f0e6;
    background-image: linear-gradient(to bottom, rgba(245, 240, 230, 0.08) 0%, rgba(245, 240, 230, 0.58) 46%, rgba(245, 240, 230, 0.94) 100%), url('/assets/generated-images/2026-05-22-home-bg.png');
    background-size: 132% auto;
    background-position: 68% 58%;
    background-repeat: no-repeat;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    overflow: hidden;
    color: #262626;
  }

  .home-pos {
    position: fixed;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 120;
  }

  .scene {
    position: relative;
    width: 100%;
    height: 100vh;
    height: 100dvh;
  }

  .scene-head {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .scene-count {
    font-size: 1rem;
    color: #aa7c11;
    font-weight: 800;
    font-family: Georgia, "Times New Roman", serif;
    background: rgba(253, 251, 247, 0.62);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 999px;
    padding: 0.22rem 0.7rem;
  }

  .reset-link {
    border: 1px solid rgba(200, 74, 58, 0.45);
    border-radius: 999px;
    background: rgba(253, 251, 247, 0.62);
    color: #c84a3a;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
  }

  .mist-sando {
    position: relative;
    height: 100%;
    overflow: hidden;
    background:
      radial-gradient(120% 72% at 72% 74%, rgba(245, 240, 230, 0) 0%, rgba(245, 240, 230, 0.52) 58%, rgba(245, 240, 230, 0.78) 100%),
      linear-gradient(to bottom, rgba(245, 240, 230, 0.1), rgba(245, 240, 230, 0.7));
  }

  .mist-sando::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 160px;
    background: linear-gradient(to bottom, rgba(245, 240, 230, 0), rgba(245, 240, 230, 0.9));
  }

  .learned-toggle {
    position: fixed;
    left: 0.8rem;
    top: 4.1rem;
    z-index: 130;
    border: 1px solid rgba(212, 175, 55, 0.38);
    border-radius: 999px;
    background: rgba(253, 251, 247, 0.78);
    color: #262626;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.45rem 0.8rem;
    min-height: 0;
    white-space: nowrap;
  }

  .learned-panel {
    position: fixed;
    top: 0.6rem;
    left: 0.6rem;
    bottom: 0.6rem;
    width: min(280px, 72vw);
    z-index: 125;
    transform: translateX(-105%);
    transition: transform 0.28s ease;
    background: rgba(253, 251, 247, 0.88);
    border: 1px solid rgba(212, 175, 55, 0.34);
    border-radius: 0.8rem;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
  }

  .learned-panel.open {
    transform: translateX(0);
  }

  .learned-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.8rem 0.9rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.26);
    color: #c84a3a;
    font-size: 0.92rem;
    font-weight: 700;
  }

  .learned-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .learned-title-row strong {
    white-space: nowrap;
  }

  .learned-close {
    border: 1px solid rgba(212, 175, 55, 0.38);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.58);
    color: rgba(38, 38, 38, 0.72);
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    padding: 0.28rem 0.55rem;
    white-space: nowrap;
  }

  .learned-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.7rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.45rem;
    align-content: start;
  }

  .learned-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    border: 1px solid rgba(212, 175, 55, 0.32);
    border-radius: 0.42rem;
    background: rgba(255, 255, 255, 0.6);
    color: #262626;
    font-size: 1rem;
    font-weight: 700;
  }

  .learned-empty {
    margin: 0;
    color: rgba(38, 38, 38, 0.62);
    font-size: 0.85rem;
    line-height: 1.6;
    text-align: center;
    grid-column: 1 / -1;
    padding-top: 1rem;
  }

  :global(.btn) {
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    font-weight: 800;
    cursor: pointer;
    border-radius: 0.4rem;
    border: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.15s, background-color 0.25s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :global(.btn--icon) {
    width: 2.6rem;
    height: 2.6rem;
    padding: 0;
    border-radius: 50%;
    font-size: 1.1rem;
    background: rgba(245, 240, 230, 0.72);
    color: #262626;
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow: 0 3px 10px rgba(38, 38, 38, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  :global(.btn--icon:hover) {
    background: rgba(255, 255, 255, 0.9);
    color: #c84a3a;
  }

  @media (max-width: 640px) {
    .page {
      background-size: 184% auto;
      background-position: 64% 54%;
    }

    .learned-toggle {
      left: 0.65rem;
      top: 4rem;
      font-size: 0.72rem;
      padding: 0.4rem 0.65rem;
    }

    .learned-panel {
      top: 0.4rem;
      left: 0.4rem;
      bottom: 0.4rem;
      width: min(250px, 74vw);
    }
  }
</style>
