<script lang="ts">
  // LSKF Phase A (Session 294): 覚え歌・TTS 完全削除 + 多色画数 UI 3 状態化
  // - 兄弟 learning-suite-kanji の TraceCanvas から speechSynthesis / 覚え歌縦ストリップを除去
  // - ghost-stroke を「未着手 / 完了 / 現在」3 状態クラスに分解（言語非依存の差別化コア）
  // - hintLevel prop は Phase A 未使用・Phase B (study_log.hint_used 連動) のための placeholder
  interface Stroke {
    id: number;
    color: string;
    d: string;
    numPos: { x: number; y: number };
    label?: string;
  }
  interface Kanji {
    viewBox: string;
    strokes: Stroke[];
  }

  import { computeCoverage, gradeUserStrokes, type GradeSummary, type Point } from '$lib/utils/strokeScoring';

  let {
    kanji,
    onRestart = () => {},
    active = true,
    onNaviDone = () => {},
    onComplete = () => {},
    onGraded = (_summary: GradeSummary) => {},
    hintLevel = 0
  }: {
    kanji: Kanji;
    onRestart?: () => void;
    active?: boolean;
    onNaviDone?: () => void;
    onComplete?: () => void;
    onGraded?: (summary: GradeSummary) => void;
    hintLevel?: number;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D | null = null;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  let progress: number[] = $state([]);
  let pathLengths: number[] = $state([]);
  let currentStrokeIdx = $state(-1);
  let animFrameId: number | null = null;
  let paused = $state(false);
  let pauseResolver: null | (() => void) = null;
  let runEpoch = 0;
  let completedNotified = false;
  let fragmentPathSamples: { x: number; y: number }[][] = [];
  let childTrace: { x: number; y: number }[] = [];
  let recentTrace: { x: number; y: number; ts: number }[] = [];

  // 白紙採点モード用の状態。
  // - blankMode: true の間は ghost-stroke（お手本の輪郭）を一切表示しない
  // - userStrokes: pointerup のたびに1画ぶんとして確定した SVG 座標の点列を積む
  //   （何画描いたかを後の採点で使うため、画ごとに配列を分けて保持する）
  let blankMode = $state(false);
  let userStrokes: Point[][] = $state([]);
  let currentUserStroke: Point[] = [];
  let gradeResult: GradeSummary | null = $state(null);

  const PEN_WIDTH = 8;
  const PEN_COLOR = '#1e293b';
  // Session 266: 描画速度一定化（マスター指示「画数に限らず 1 ナビの速度を一定」）
  const STROKE_VELOCITY = 60;          // SVG ユニット/秒（viewBox 109 単位系）
  const MIN_STROKE_DURATION_MS = 700;  // 極短画の最低時間（点など）
  const MAX_STROKE_DURATION_MS = 3500; // 極長画の最大時間（長いはらいなど）
  const STROKE_GAP_MS = 160;           // 画と画の間
  const PATH_SAMPLE_STEP = 10;
  const COVERAGE_DIST_THRESHOLD = 20;
  const COVERAGE_RATIO_THRESHOLD = 0.18;
  const RECENT_TRACE_WINDOW_MS = 1400;

  $effect(() => {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    setupCanvas();

    const ns = 'http://www.w3.org/2000/svg';
    pathLengths = kanji.strokes.map((s: Stroke) => {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', s.d);
      return p.getTotalLength();
    });

    // お題の漢字(kanji)が変化したときにprogressを適正サイズで0初期化し、インデックスをリセット
    progress = kanji.strokes.map(() => 0);
    currentStrokeIdx = -1;
    completedNotified = false;

    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  });

  function setupCanvas() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const newWidth = Math.round(rect.width * dpr);
    const newHeight = Math.round(rect.height * dpr);

    if (canvas.width === newWidth && canvas.height === newHeight) return;

    let snapshot: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (tmpCtx) {
        tmpCtx.drawImage(canvas, 0, 0);
        snapshot = tmpCanvas;
      }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = PEN_WIDTH;
    ctx.strokeStyle = PEN_COLOR;
    ctx.fillStyle = PEN_COLOR;
    ctx.globalCompositeOperation = 'source-over';

    if (snapshot) {
      ctx.drawImage(snapshot, 0, 0, rect.width, rect.height);
    }
  }

  function getPos(e: PointerEvent) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function canvasToSvg(p: { x: number; y: number }) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const parts = (kanji.viewBox || '0 0 109 109').split(/\s+/).map(Number);
    const vbW = parts[2] || 109;
    const vbH = parts[3] || 109;
    return { x: (p.x / rect.width) * vbW, y: (p.y / rect.height) * vbH };
  }

  function samplePath(d: string, step: number) {
    if (typeof document === 'undefined') return [];
    const ns = 'http://www.w3.org/2000/svg';
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    const len = p.getTotalLength();
    const points: { x: number; y: number }[] = [];
    if (len <= 0) return points;
    const n = Math.max(8, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) {
      const s = (len * i) / n;
      const pt = p.getPointAtLength(s);
      points.push({ x: pt.x, y: pt.y });
    }
    return points;
  }

  function pushRecentTracePoint(p: { x: number; y: number }) {
    const ts = Date.now();
    recentTrace.push({ x: p.x, y: p.y, ts });
    const cutoff = ts - RECENT_TRACE_WINDOW_MS;
    if (recentTrace.length > 320 || (recentTrace[0]?.ts ?? ts) < cutoff) {
      recentTrace = recentTrace.filter((pt) => pt.ts >= cutoff);
    }
  }

  function resumeNav() {
    if (!paused) return;
    paused = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
  }

  function tryResumeNav() {
    if (!paused || fragmentPathSamples.length === 0) return;
    const coverage = computeCoverage(fragmentPathSamples, childTrace, COVERAGE_DIST_THRESHOLD);
    if (coverage >= COVERAGE_RATIO_THRESHOLD) {
      resumeNav();
    }
  }

  function notifyComplete() {
    if (completedNotified) return;
    completedNotified = true;
    onComplete();
  }

  function pointerDown(e: PointerEvent) {
    if (!canvas || !ctx) return;
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    const p = getPos(e);
    drawing = true;
    lastX = p.x;
    lastY = p.y;
    const svgP = canvasToSvg(p);
    pushRecentTracePoint(svgP);
    if (paused) {
      childTrace = [...childTrace, svgP];
    }
    // 白紙採点用: このポインタ操作を新しい1画として記録し始める
    currentUserStroke = [svgP];
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function pointerMove(e: PointerEvent) {
    if (!drawing || !ctx) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    const svgP = canvasToSvg(p);
    pushRecentTracePoint(svgP);
    if (paused) {
      childTrace.push(svgP);
      tryResumeNav();
    }
    currentUserStroke.push(svgP);
    lastX = p.x;
    lastY = p.y;
  }

  function pointerUp(e: PointerEvent) {
    if (!drawing || !canvas) return;
    // 白紙採点用: ペンを離した時点で1画ぶんとして確定し、画ごとの配列に積む
    if (currentUserStroke.length > 0) {
      userStrokes = [...userStrokes, currentUserStroke];
    }
    currentUserStroke = [];
    drawing = false;
    if (canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    tryResumeNav();
  }

  function clearAll() {
    if (ctx && canvas) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    runEpoch++;
    fragmentPathSamples = [];
    childTrace = [];
    recentTrace = [];
    paused = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    progress = kanji.strokes.map(() => 0);
    currentStrokeIdx = -1;
    completedNotified = false;
    blankMode = false;
    userStrokes = [];
    currentUserStroke = [];
    gradeResult = null;
  }

  function animateStroke(strokeIdx: number) {
    return new Promise<void>((resolve) => {
      currentStrokeIdx = strokeIdx;
      const rawDur = (pathLengths[strokeIdx] / STROKE_VELOCITY) * 1000;
      const dur = Math.max(MIN_STROKE_DURATION_MS, Math.min(MAX_STROKE_DURATION_MS, rawDur));
      let startTs: number | null = null;
      function step(ts: number) {
        if (startTs == null) startTs = ts;
        const t = Math.min((ts - startTs) / dur, 1);
        const next = progress.slice();
        next[strokeIdx] = t;
        progress = next;
        if (t >= 1) {
          animFrameId = null;
          resolve();
        } else {
          animFrameId = requestAnimationFrame(step);
        }
      }
      animFrameId = requestAnimationFrame(step);
    });
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function strokeGroupKey(stroke: Stroke) {
    return stroke.label ?? String(stroke.id);
  }

  async function replayDemo() {
    runEpoch++;
    const myEpoch = runEpoch;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    fragmentPathSamples = [];
    childTrace = [];
    recentTrace = [];
    paused = false;
    // お手本アニメーションは常にガイド表示（ghost-stroke）が見える状態で再生する
    blankMode = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    progress = kanji.strokes.map(() => 0);
    currentStrokeIdx = -1;
    completedNotified = false;

    let strokeIdx = 0;
    while (strokeIdx < kanji.strokes.length) {
      const groupStart = strokeIdx;
      const groupKey = strokeGroupKey(kanji.strokes[strokeIdx]);

      while (strokeIdx < kanji.strokes.length && strokeGroupKey(kanji.strokes[strokeIdx]) === groupKey) {
        if (myEpoch !== runEpoch) return;
        await animateStroke(strokeIdx);
        if (myEpoch !== runEpoch) return;

        strokeIdx++;
        if (strokeIdx < kanji.strokes.length && strokeGroupKey(kanji.strokes[strokeIdx]) === groupKey) {
          await sleep(STROKE_GAP_MS);
          if (myEpoch !== runEpoch) return;
        }
      }

      fragmentPathSamples = kanji.strokes
        .slice(groupStart, strokeIdx)
        .map((stroke: Stroke) => samplePath(stroke.d, PATH_SAMPLE_STEP));
      const now = Date.now();
      childTrace = recentTrace
        .filter((pt) => now - pt.ts <= RECENT_TRACE_WINDOW_MS)
        .map((pt) => ({ x: pt.x, y: pt.y }));
      paused = true;
      tryResumeNav();
      if (!paused) {
        if (myEpoch !== runEpoch) return;
        if (strokeIdx < kanji.strokes.length) {
          await sleep(STROKE_GAP_MS);
          if (myEpoch !== runEpoch) return;
        }
        continue;
      }
      await new Promise<void>((r) => { pauseResolver = r; });
      if (myEpoch !== runEpoch) return;

      if (strokeIdx < kanji.strokes.length) {
        await sleep(STROKE_GAP_MS);
        if (myEpoch !== runEpoch) return;
      }
    }

    progress = kanji.strokes.map(() => 1);
    currentStrokeIdx = kanji.strokes.length;
    notifyComplete();
    onNaviDone();
  }

  // 「できた!」で次漢字に遷移する時、現在漢字を完了状態固定（既書字保持・アニメ停止）
  function freezeCompleted() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    runEpoch++;
    fragmentPathSamples = [];
    childTrace = [];
    recentTrace = [];
    paused = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    progress = kanji.strokes.map(() => 1);
    currentStrokeIdx = kanji.strokes.length;
  }

  // 白紙採点モードを開始する: キャンバスとお手本ガイドを両方消し、
  // 何も描かれていない状態から自由に書けるようにする
  function startBlank() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    runEpoch++;
    if (ctx && canvas) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    fragmentPathSamples = [];
    childTrace = [];
    recentTrace = [];
    paused = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    progress = kanji.strokes.map(() => 0);
    currentStrokeIdx = -1;
    completedNotified = false;
    userStrokes = [];
    currentUserStroke = [];
    gradeResult = null;
    blankMode = true;
  }

  // 白紙モードで書いた各画を正解データと採点し、結果を表示したうえでお手本を再生する。
  // 採点そのもの（画の対応づけ・○×判定）は DOM に依存しない strokeScoring.ts の
  // 純粋関数に切り出してあり、ここでは正解データのサンプリングと結果の受け渡しのみ行う。
  function checkAnswer(): GradeSummary {
    const correctPathSamples = kanji.strokes.map((s: Stroke) => samplePath(s.d, PATH_SAMPLE_STEP));
    const summary = gradeUserStrokes(userStrokes, correctPathSamples, COVERAGE_DIST_THRESHOLD, COVERAGE_RATIO_THRESHOLD);
    gradeResult = summary;
    onGraded(summary);
    // 結果表示のあと、正しい書き順をお手本としてアニメーションで見せる
    void replayDemo();
    return summary;
  }

  export { clearAll, replayDemo, freezeCompleted, startBlank, checkAnswer };
</script>

<div class="trace-wrap">
  <div class="canvas-stack">
    <svg
      class="ghost-svg"
      viewBox={kanji.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {#if !blankMode}
        <line x1="54.5" y1="0" x2="54.5" y2="109" class="grid" />
        <line x1="0" y1="54.5" x2="109" y2="54.5" class="grid" />
        {#each kanji.strokes as s, i}
          {@const ratio = kanji.strokes.length > 1 ? i / (kanji.strokes.length - 1) : 1}
          {@const inkColor = `rgb(${Math.round(115 - 89 * ratio)}, ${Math.round(115 - 89 * ratio)}, ${Math.round(115 - 89 * ratio)})`}
          <path
            d={s.d}
            stroke={inkColor}
            class="ghost-stroke"
            class:current={i === currentStrokeIdx && currentStrokeIdx < kanji.strokes.length}
            class:done={progress[i] >= 1}
            class:pending={progress[i] === 0 && i !== currentStrokeIdx}
            style:--c={inkColor}
            style:stroke-dasharray={pathLengths[i]}
            style:stroke-dashoffset={pathLengths[i] * (1 - progress[i])}
          />
        {/each}
        {#each kanji.strokes as s, i}
          {#if progress[i] >= 1}
            {@const ratio = kanji.strokes.length > 1 ? i / (kanji.strokes.length - 1) : 1}
            {@const inkColor = `rgb(${Math.round(115 - 89 * ratio)}, ${Math.round(115 - 89 * ratio)}, ${Math.round(115 - 89 * ratio)})`}
            <text x={s.numPos.x} y={s.numPos.y} fill={inkColor} class="num-text">
              {s.id}
            </text>
          {/if}
        {/each}
      {/if}
      {#if gradeResult}
        {#each gradeResult.results as r (r.index)}
          {#if r.reason !== 'extra' && kanji.strokes[r.index]}
            <text
              x={kanji.strokes[r.index].numPos.x}
              y={kanji.strokes[r.index].numPos.y}
              class="grade-mark"
              class:grade-ok={r.passed}
              class:grade-ng={!r.passed}
            >{r.passed ? '○' : '×'}</text>
          {/if}
        {/each}
      {/if}
    </svg>

    <canvas
      bind:this={canvas}
      onpointerdown={pointerDown}
      onpointermove={pointerMove}
      onpointerup={pointerUp}
      onpointercancel={pointerUp}
      onpointerleave={pointerUp}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>
  </div>
</div>

<style>
  .trace-wrap {
    position: relative;
    width: 100%;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  .canvas-stack {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 2px solid #1f2937;
    border-radius: 4px;
    background: #ffffff;
    overflow: hidden;
  }
  .ghost-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .grid {
    stroke: #cbd5e1;
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  /* LSKF Phase A: 3 状態の多色画数 UI（差別化コア・言語非依存） */
  .ghost-stroke {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: opacity 0.2s, filter 0.2s;
  }
  .ghost-stroke.pending {
    opacity: 0.09;
  }
  .ghost-stroke.done {
    opacity: 0.275;
  }
  .ghost-stroke.current {
    opacity: 0.5;
    filter: drop-shadow(0 0 4px var(--c, #fbbf24));
  }
  .num-text {
    font-size: 8px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
    opacity: 0.35;
  }
  /* 白紙採点の結果マーク（各画の番号位置に○/×を重ねる） */
  .grade-mark {
    font-size: 11px;
    font-weight: 900;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 2px;
  }
  .grade-mark.grade-ok {
    fill: #16a34a;
  }
  .grade-mark.grade-ng {
    fill: #dc2626;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    touch-action: none;
    cursor: crosshair;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    user-select: none;
  }
</style>
