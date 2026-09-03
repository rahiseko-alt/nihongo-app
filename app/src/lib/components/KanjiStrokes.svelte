<script lang="ts">
  // kanji: 表示対象の漢字データ（lib/data/kanji/ 配下）
  // visibleStrokes: 表示する画番号配列（例 [1,2,3]）。null で全画表示
  // showNumbers: 書き順番号を表示するか
  interface Stroke {
    id: number;
    color: string;
    d: string;
    numPos: { x: number; y: number };
  }
  interface Kanji {
    viewBox: string;
    strokes: Stroke[];
  }

  let {
    kanji,
    visibleStrokes = null,
    showNumbers = true
  }: {
    kanji: Kanji;
    visibleStrokes?: number[] | null;
    showNumbers?: boolean;
  } = $props();

  const visible = $derived(visibleStrokes ?? kanji.strokes.map((s: Stroke) => s.id));
</script>

<div class="kanji-box">
  <svg viewBox={kanji.viewBox} xmlns="http://www.w3.org/2000/svg" class="kanji-svg">
    <!-- マス目（中央十字・破線） -->
    <line x1="54.5" y1="0" x2="54.5" y2="109" class="grid" />
    <line x1="0" y1="54.5" x2="109" y2="54.5" class="grid" />

    {#each kanji.strokes as s}
      {#if visible.includes(s.id)}
        <path d={s.d} stroke={s.color} class="stroke" />
        {#if showNumbers}
          <text x={s.numPos.x} y={s.numPos.y} fill={s.color} class="num-text">{s.id}</text>
        {/if}
      {/if}
    {/each}
  </svg>
</div>

<style>
  .kanji-box {
    border: 2px solid #1f2937;
    background: #ffffff;
    aspect-ratio: 1;
    width: 100%;
  }
  .kanji-svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .grid {
    stroke: #cbd5e1;
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  .stroke {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .num-text {
    font-size: 8px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }
</style>
