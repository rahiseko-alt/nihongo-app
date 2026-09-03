<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { uiLang } from '$lib/stores/langStore.js';

  let { children } = $props();

  // ─── Canvas桜パーティクル ───
  let sakuraCanvas: HTMLCanvasElement | undefined = $state();

  interface Petal {
    x: number;
    y: number;
    size: number;
    speed: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    rotation: number;
    rotSpeed: number;
    opacity: number;
    phase: number;
  }

  function initSakuraCanvas() {
    if (!sakuraCanvas) return;
    const ctx = sakuraCanvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!sakuraCanvas) return;
      sakuraCanvas.width = window.innerWidth;
      sakuraCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 花弁オブジェクト 40個 (A-1)
    const petals: Petal[] = [];

    for (let i = 0; i < 40; i++) {
      const size = 3 + Math.random() * 8; // 3段階: 小3-5, 中5-8, 大8-11
      petals.push({
        x: Math.random() * sakuraCanvas.width,
        y: Math.random() * sakuraCanvas.height - sakuraCanvas.height,
        size,
        speed: 0.3 + Math.random() * 0.8 + (size / 11) * 0.5,  // 大きいほど速い (パララックス) (A-2: speed >= 1.0含む)
        wobbleSpeed: 0.008 + Math.random() * 0.015,
        wobbleAmp: 15 + Math.random() * 30,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: 0.01 + Math.random() * 0.03,
        opacity: 0.15 + (size / 11) * 0.45,  // 大=前景=はっきり、小=背景=薄い
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    function draw() {
      if (!sakuraCanvas || !ctx) return;
      ctx.clearRect(0, 0, sakuraCanvas.width, sakuraCanvas.height);
      const w = sakuraCanvas.width;
      const h = sakuraCanvas.height;

      for (const p of petals) {
        // 位置更新
        p.y += p.speed;
        p.x += Math.sin(p.phase) * p.wobbleAmp * 0.02;  // Math.sin横揺れ
        p.phase += p.wobbleSpeed;
        p.rotation += p.rotSpeed;

        // 画面外に出たらリセット
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;

        // 花弁を描画 (ベジェ曲線)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `hsl(${340 + Math.random() * 20}, 70%, ${82 + Math.random() * 10}%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size * 0.5, -p.size, p.size, -p.size * 0.5, 0, p.size * 0.3);
        ctx.bezierCurveTo(-p.size, -p.size * 0.5, -p.size * 0.5, -p.size, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }

  onMount(() => {
    if (!browser) return;
    const cleanupSakura = initSakuraCanvas();
    return () => {
      if (cleanupSakura) cleanupSakura();
    };
  });
</script>

<!-- 桜パーティクルCanvas (A-1, A-7, A-8, A-9, A-10) -->
<canvas bind:this={sakuraCanvas} class="sakura-canvas" aria-hidden="true"></canvas>

<!-- 光芒エフェクト (God Ray) (A-3, A-4) -->
<div class="god-rays" aria-hidden="true">
  <div class="god-ray ray-1"></div>
  <div class="god-ray ray-2"></div>
  <div class="god-ray ray-3"></div>
</div>

<!-- 多言語切り替えセレクト（右上） (A-5) -->
<div class="lang-selector">
  <button class="lang-tab" class:active={$uiLang === 'ja'} onclick={() => uiLang.set('ja')}>日本語</button>
  <button class="lang-tab" class:active={$uiLang === 'en'} onclick={() => uiLang.set('en')}>EN</button>
  <button class="lang-tab" class:active={$uiLang === 'zh'} onclick={() => uiLang.set('zh')}>中文</button>
  <button class="lang-tab" class:active={$uiLang === 'ko'} onclick={() => uiLang.set('ko')}>한국어</button>
  <button class="lang-tab" class:active={$uiLang === 'vi'} onclick={() => uiLang.set('vi')}>Tiếng Việt</button>
  <button class="lang-tab" class:active={$uiLang === 'ne'} onclick={() => uiLang.set('ne')}>नेपाली</button>
</div>

<div class="page-wrapper">
  {#key $page.url.pathname}
    <div in:fade={{ duration: 250 }} out:fade={{ duration: 250 }} class="transition-container">
      {@render children()}
    </div>
  {/key}
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #F5F0E6; /* 和紙ベース */
    color: #262626; /* 墨 */
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif", system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(button) {
    font-family: inherit;
    cursor: pointer;
  }

  .page-wrapper {
    display: grid;
    grid-template-areas: "main";
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: hidden;
  }

  .transition-container {
    grid-area: main;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: min(94vw, 34rem);
    flex-direction: column;
    position: relative;
    z-index: 2;
  }

  /* ─── 桜Canvasレイヤー ─── */
  .sakura-canvas {
    position: fixed;
    inset: 0;
    z-index: 99; /* コンテンツの前面に舞い散らせる */
    pointer-events: none;
    width: 100vw;
    height: 100vh;
  }

  /* ─── God Ray 光芒エフェクト ─── */
  .god-rays {
    position: fixed;
    inset: 0;
    z-index: 98; /* 桜のすぐ後ろ、コンテンツの前面 */
    pointer-events: none;
    overflow: hidden;
  }
  .god-ray {
    position: absolute;
    top: -30%;
    width: 40%;
    height: 130%;
    background: radial-gradient(ellipse at top, rgba(255, 248, 220, 0.12) 0%, transparent 70%);
    filter: blur(40px); /* A-4: blur >= 30px */
    transform-origin: top center;
  }
  .ray-1 {
    left: 10%;
    transform: rotate(-8deg);
    animation: ray-pulse-1 8s ease-in-out infinite;
  }
  .ray-2 {
    left: 45%;
    width: 30%;
    transform: rotate(3deg);
    animation: ray-pulse-2 10s ease-in-out infinite;
  }
  .ray-3 {
    right: 5%;
    width: 25%;
    transform: rotate(12deg);
    animation: ray-pulse-3 7s ease-in-out infinite;
    background: radial-gradient(ellipse at top, rgba(212, 175, 55, 0.06) 0%, transparent 70%);
  }
  @keyframes ray-pulse-1 {
    0%, 100% { opacity: 0.3; transform: rotate(-8deg) scaleY(1); }
    50%      { opacity: 0.6; transform: rotate(-6deg) scaleY(1.05); }
  }
  @keyframes ray-pulse-2 {
    0%, 100% { opacity: 0.25; transform: rotate(3deg) scaleY(1); }
    50%      { opacity: 0.55; transform: rotate(5deg) scaleY(1.08); }
  }
  @keyframes ray-pulse-3 {
    0%, 100% { opacity: 0.2; transform: rotate(12deg) scaleY(1); }
    50%      { opacity: 0.5; transform: rotate(10deg) scaleY(1.03); }
  }

  /* ─── 多言語セレクト (右上) ─── */
  .lang-selector {
    position: fixed;
    top: 0.8rem;
    right: 0.8rem;
    z-index: 100; /* 最前面 */
    display: flex;
    background: rgba(245, 240, 230, 0.45);
    border: 1px solid rgba(212, 175, 55, 0.25);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 0.2rem;
    border-radius: 999px;
    box-shadow: 0 4px 15px rgba(38, 38, 38, 0.06), inset 0 1px 3px rgba(255, 255, 255, 0.5);
  }
  .lang-tab {
    background: transparent;
    border: none;
    outline: none;
    color: #5c5752;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "serif";
  }
  .lang-tab:hover { color: #262626; background: rgba(212, 175, 55, 0.1); }
  .lang-tab.active {
    background: linear-gradient(135deg, #3a3a3a, #1a1a1a);
    color: #D4AF37;
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  }
  @media (max-width: 640px) {
    .lang-selector {
      top: 0.55rem;
      right: 0.55rem;
      max-width: calc(100vw - 4.7rem);
      row-gap: 0.12rem;
    }
    .lang-tab {
      font-size: 0.66rem;
      padding: 0.24rem 0.42rem;
    }
  }
</style>
