<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { SETS, SET_ORDER, CATEGORIES, CATEGORY_ORDER, getSetsByCategory, getKanjiByChar } from '$lib/data/sets.js';
  import { uiLang } from '$lib/stores/langStore.js';
  import { translations } from '$lib/data/translations.js';
  import { addSavedKanjiChar, loadSavedKanjiChars, moveSavedKanjiChar, removeSavedKanjiChar } from '$lib/utils/savedKanji';

  let t = $derived(translations[$uiLang] || translations.ja);

  let activeCategory = $state('popular');
  let selectedIds: string[] = $state([]);
  let savedChars: string[] = $state([]);

  let filteredSets = $derived(getSetsByCategory(activeCategory));

  let categoryDesc = $derived(
    activeCategory === 'popular'
      ? t.categoryDescPopularOnly
      : t.categoryDescExamOnly
  );

  let isKanjiCategory = $derived(true);
  let charSourceSet = $derived(
    activeCategory === 'popular' ? SETS.popular_foreigners_500 :
    activeCategory === 'exam' ? SETS.resident_exam_500 :
    null
  );
  let charOptions = $derived((activeCategory === 'saved'
    ? savedChars.map((ch) => getKanjiByChar(ch)).filter(Boolean)
    : (charSourceSet?.kanji ?? [])
  ).map((k: any, i: number) => ({
    id: `${activeCategory}:${k.char}:${i}`,
    char: k.char,
    reading: k.reading ?? '',
  })));

  onMount(() => {
    savedChars = loadSavedKanjiChars();
    const onStorage = () => {
      savedChars = loadSavedKanjiChars();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  });

  function toggleSet(itemId: string) {
    if (selectedIds.includes(itemId)) {
      selectedIds = selectedIds.filter(id => id !== itemId);
    } else {
      selectedIds = [...selectedIds, itemId];
    }
  }

  function switchCategory(catId: string) {
    if (activeCategory === catId) return;
    activeCategory = catId;
    selectedIds = [];
  }

  function setCharsPreview(setData: any) {
    const chars = setData.kanji.map((k: any) => k.char);
    if (chars.length <= 8) return chars.join('');
    return `${chars.slice(0, 8).join('')}…(${chars.length}字)`;
  }

  function goToPlay() {
    if (selectedIds.length === 0) return;
    if (isKanjiCategory) {
      const chars = selectedIds
        .map((id) => id.split(':')[1])
        .filter(Boolean)
        .join(',');
      goto(`${base}/play?kanji=${encodeURIComponent(chars)}`);
      return;
    }
    const ordered = SET_ORDER.filter((id) => selectedIds.includes(id));
    goto(`${base}/play?sets=${ordered.join(',')}`);
  }

  function goHome() {
    goto(`${base}/`);
  }

  function moveSaved(from: number, to: number) {
    savedChars = moveSavedKanjiChar(savedChars, from, to);
  }

  function removeSaved(ch: string) {
    savedChars = removeSavedKanjiChar(ch);
    selectedIds = selectedIds.filter((id) => !id.includes(`:${ch}:`));
  }

  function toggleSaveChar(ch: string) {
    if (savedChars.includes(ch)) {
      removeSaved(ch);
      return;
    }
    savedChars = addSavedKanjiChar(ch);
  }

  function selectAllInCategory() {
    const ids = charOptions.map((item: any) => item.id);
    selectedIds = ids;
  }
</script>

<main class="page">
  <button class="btn btn--icon home-pos" onclick={goHome} aria-label={t.goHome}>
    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12L12 3L21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 21H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  </button>

  <div class="category-container">
    <nav class="category-tabs fade-in-1s" aria-label="Kanji categories">
      {#each CATEGORY_ORDER as catId, i}
        {@const cat = CATEGORIES[catId]}
        {@const label = catId === 'saved' ? t.categorySaved : catId === 'popular' ? t.categoryPopular : t.categoryExam}
        <button
          class="cat-tab"
          class:active={activeCategory === catId}
          onclick={() => switchCategory(catId)}
          style:animation-delay="{i * 0.08}s"
        >
          <span class="cat-tab-icon">{cat.icon}</span>
          <span class="cat-tab-label">{label}</span>
          {#if activeCategory === catId}
            <div class="cat-tab-ink"></div>
          {/if}
        </button>
      {/each}
    </nav>

    <div class="kanji-list-card fade-in-1s">
      <div class="bulk-actions">
        <button class="bulk-btn" onclick={selectAllInCategory}>{t.selectAllBtn}</button>
      </div>
      {#if isKanjiCategory}
        {#each charOptions as item (item.id)}
          {#if activeCategory === 'saved'}
            <div
              class="kanji-item-btn kanji-item-btn--char"
              class:selected={selectedIds.includes(item.id)}
              role="button"
              tabindex="0"
              onclick={() => toggleSet(item.id)}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSet(item.id)}
            >
              <div class="kanji-item-reading">{item.reading || '　'}</div>
              <div class="kanji-item-char"><span>{item.char}</span></div>
              <div class="saved-tools">
                <button class="saved-tool-btn" onclick={(e) => { e.stopPropagation(); moveSaved(charOptions.findIndex((c:any) => c.char === item.char), Math.max(0, charOptions.findIndex((c:any) => c.char === item.char) - 1)); }} aria-label="up">↑</button>
                <button class="saved-tool-btn" onclick={(e) => { e.stopPropagation(); moveSaved(charOptions.findIndex((c:any) => c.char === item.char), Math.min(charOptions.length - 1, charOptions.findIndex((c:any) => c.char === item.char) + 1)); }} aria-label="down">↓</button>
                <button class="saved-tool-btn saved-tool-btn--danger" onclick={(e) => { e.stopPropagation(); removeSaved(item.char); }} aria-label="remove">✕</button>
              </div>
            </div>
          {:else}
            <div
              class="kanji-item-btn kanji-item-btn--char"
              class:selected={selectedIds.includes(item.id)}
              role="button"
              tabindex="0"
              onclick={() => toggleSet(item.id)}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSet(item.id)}
            >
              <div class="kanji-item-reading">{item.reading || '　'}</div>
              <div class="kanji-item-char"><span>{item.char}</span></div>
              <div class="saved-tools">
                <button
                  class="saved-tool-btn"
                  class:saved-tool-btn--active={savedChars.includes(item.char)}
                  onclick={(e) => { e.stopPropagation(); toggleSaveChar(item.char); }}
                  aria-label="save"
                >
                  {savedChars.includes(item.char) ? t.savedBtn : t.saveBtn}
                </button>
              </div>
            </div>
          {/if}
        {/each}
      {:else}
        {#each filteredSets as s (s.id)}
          <button
            class="kanji-item-btn"
            class:selected={selectedIds.includes(s.id)}
            onclick={() => toggleSet(s.id)}
          >
            <div class="kanji-item-char">
              <span>{setCharsPreview(s)}</span>
            </div>
            <div class="kanji-item-name">{s.name}</div>
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <div class="a-btn-wrapper">
    <button class="btn btn--primary big shiny-btn-gold" onclick={goToPlay}>{t.startPracticeBtn}</button>
  </div>
</main>

<style>
  .page {
    position: relative;
    z-index: 2;
    height: 100vh; /* 画面固定にしてスクロールを内部に閉じ込める */
    height: 100dvh;
    overflow: hidden; /* ページ全体のスクロールは禁止 */
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
    justify-content: flex-start;
    padding: 2rem 1rem;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
    box-sizing: border-box;
  }

  .home-pos {
    position: fixed;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 140;
    background: rgba(245, 240, 230, 0.96);
    border: 1px solid rgba(212, 175, 55, 0.32);
    box-shadow: 0 8px 18px rgba(38, 38, 38, 0.2);
  }
  .icon-svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .category-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 5vh;
    flex: 1; /* 画面の残りスペースをすべて占有 */
    min-height: 0; /* 内部スクロールを機能させるために必須 */
  }

  .a-btn-wrapper {
    margin-top: auto; /* Flexbox内で残りの空間を埋めて一番下に押しやる */
    margin-bottom: 2rem;
    z-index: 20;
  }

  /* ─── カテゴリータブ ─── */
  .category-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
    padding: 0.3rem;
    background: rgba(245, 240, 230, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.15);
    border-radius: 0.6rem;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    width: 100%;
    max-width: 380px;
  }
  .cat-tab {
    flex: 1;
    position: relative;
    background: transparent;
    border: none;
    outline: none;
    padding: 0.6rem 0.4rem;
    border-radius: 0.4rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }
  .cat-tab-icon {
    font-size: 1.3rem;
    line-height: 1;
  }
  .cat-tab-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #78716c;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  .cat-tab:hover .cat-tab-label { color: #262626; }
  .cat-tab.active {
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 12px rgba(38, 38, 38, 0.08);
  }
  .cat-tab.active .cat-tab-label {
    color: #262626;
  }
  .cat-tab-ink {
    position: absolute;
    bottom: 0.15rem;
    left: 20%;
    right: 20%;
    height: 2.5px;
    background: linear-gradient(90deg, transparent, #C84A3A, #C84A3A, transparent);
    border-radius: 2px;
    animation: ink-draw 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    transform-origin: left;
  }
  @keyframes ink-draw {
    0% { transform: scaleX(0); opacity: 0; }
    100% { transform: scaleX(1); opacity: 1; }
  }

  /* ─── カテゴリー説明パネル ─── */
  .category-desc-panel {
    width: 100%;
    max-width: 380px;
    padding: 0.8rem 1.2rem;
    background: rgba(245, 240, 230, 0.4);
    border: 1px solid rgba(212, 175, 55, 0.12);
    border-radius: 0.5rem;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    margin-bottom: 1rem;
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  .category-desc-text {
    margin: 0;
    font-size: 0.82rem;
    color: #5c5752;
    font-weight: 600;
    font-style: italic;
    text-align: center;
  }

  /* ─── スクロール可能な漢字リストカード ─── */
  .kanji-list-card {
    width: 100%;
    max-width: 380px;
    flex: 1; /* 親要素の中で最大限に広がる */
    min-height: 0; /* はみ出し防止用 */
    margin-bottom: 1rem;
    background: #FDFBF7;
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 40%);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 0.8rem;
    box-shadow: 0 10px 30px rgba(38, 38, 38, 0.08), 
                inset 0 0 20px rgba(212, 175, 55, 0.05);
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    box-sizing: border-box;
  }
  .bulk-actions {
    width: 100%;
    margin-bottom: 0.35rem;
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 2;
    background: #FDFBF7;
    padding-bottom: 0.25rem;
  }
  .bulk-btn {
    border: 1px solid rgba(120, 113, 108, 0.35);
    border-radius: 0.35rem;
    background: rgba(255, 255, 255, 0.9);
    color: #262626;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.25rem 0.7rem;
    cursor: pointer;
  }
  
  .kanji-list-card::-webkit-scrollbar {
    width: 6px;
  }
  .kanji-list-card::-webkit-scrollbar-track {
    background: rgba(245, 240, 230, 0.5);
    border-radius: 4px;
  }
  .kanji-list-card::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.4);
    border-radius: 4px;
  }

  .kanji-item-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    background: transparent;
    border: 1px solid rgba(120, 113, 108, 0.2);
    border-radius: 0.4rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }
  .kanji-item-btn--char {
    justify-content: flex-start;
    gap: 1rem;
  }
  .saved-tools {
    margin-left: auto;
    display: flex;
    gap: 0.4rem;
  }
  .saved-tool-btn {
    min-width: 3.2rem;
    height: 1.7rem;
    border: 1px solid rgba(120, 113, 108, 0.45);
    border-radius: 0.3rem;
    background: #fff;
    color: #262626;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.35rem;
  }
  .saved-tool-btn--active {
    color: #2f6f44;
    border-color: rgba(47, 111, 68, 0.45);
    background: #eef9f1;
  }
  .saved-tool-btn--danger {
    color: #9c2d22;
    border-color: rgba(156, 45, 34, 0.45);
  }
  .kanji-item-reading {
    width: 4.6rem;
    text-align: left;
    font-size: 0.95rem;
    font-weight: 700;
    color: #355070;
  }
  .kanji-item-btn:hover {
    background: rgba(245, 240, 230, 0.8);
  }
  .kanji-item-btn.selected {
    background: rgba(212, 175, 55, 0.1);
    border-color: #D4AF37;
    box-shadow: inset 0 0 10px rgba(212, 175, 55, 0.1);
  }
  .kanji-item-char {
    font-size: 1.5rem;
    font-weight: 900;
    color: #262626;
    letter-spacing: 0.1em;
  }
  .kanji-item-name {
    font-size: 0.85rem;
    color: #5c5752;
    font-weight: 600;
  }

  /* ボタン共通 */
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
</style>
