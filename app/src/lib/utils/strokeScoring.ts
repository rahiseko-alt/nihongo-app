// 白紙採点機能（T034 相当）の採点ロジック。
// DOM/canvas に一切依存しない純粋関数として切り出し、Vitest から直接呼べるようにする。
// TraceCanvas.svelte はここから computeCoverage / gradeUserStrokes を import して使う
// （同じ判定ロジックを2箇所に書くと食い違うため、実装は必ずここ1箇所に置く）。

export interface Point {
  x: number;
  y: number;
}

/**
 * 目標の点列（pathSamples）を、ユーザーの軌跡（trace）がどれだけカバーしているかを
 * 0〜1 の比率で返す。TraceCanvas の「なぞり書き」モードで1画の完了判定に使っていた
 * ロジックをそのまま流用（車輪の再発明をしないため）。
 *
 * 判定の考え方:
 *   1. まず目標点列の始点・終点の近くをユーザーが通っているかを見る
 *      （始点/終点のどちらかに触れていない画は「その画をなぞっていない」とみなし、
 *      全点を未カバー扱いにする＝小さな偶然の重なりで誤って○にしないため）
 *   2. 始点・終点の両方に触れていれば、目標点列の各点についてユーザー軌跡との
 *      距離が distThreshold 以内かどうかを数え、カバー率を出す
 */
export function computeCoverage(
  pathSamples: Point[][],
  trace: Point[],
  distThreshold: number
): number {
  if (!trace.length) return 0;
  let total = 0;
  let covered = 0;
  const dt2 = distThreshold * distThreshold;
  for (const pathPts of pathSamples) {
    if (pathPts.length === 0) continue;
    const start = pathPts[0];
    const end = pathPts[pathPts.length - 1];
    let startCovered = false;
    let endCovered = false;
    for (const cp of trace) {
      const dxs = start.x - cp.x;
      const dys = start.y - cp.y;
      if (dxs * dxs + dys * dys <= dt2) startCovered = true;
      const dxe = end.x - cp.x;
      const dye = end.y - cp.y;
      if (dxe * dxe + dye * dye <= dt2) endCovered = true;
      if (startCovered && endCovered) break;
    }
    if (!startCovered || !endCovered) {
      total += pathPts.length;
      continue;
    }
    for (const pp of pathPts) {
      total++;
      for (const cp of trace) {
        const dx = pp.x - cp.x;
        const dy = pp.y - cp.y;
        if (dx * dx + dy * dy <= dt2) {
          covered++;
          break;
        }
      }
    }
  }
  return total > 0 ? covered / total : 0;
}

export type StrokeGradeReason = 'ok' | 'low-coverage' | 'missing' | 'extra';

export interface StrokeGradeResult {
  /** 0始まりの画番号（正解データ基準。'extra' のみ正解の画数を超えた番号） */
  index: number;
  passed: boolean;
  /** 0〜1 のカバー率。'missing' は 0、'extra' は採点対象外のため NaN */
  coverage: number;
  reason: StrokeGradeReason;
}

export interface GradeSummary {
  results: StrokeGradeResult[];
  /** 正解データの画数（採点対象の分母） */
  correctCount: number;
  /** ○がついた画数 */
  matchedCount: number;
  /** 採点対象の画数（= correctCount。'extra' は含まない） */
  totalJudged: number;
}

/**
 * ユーザーが描いた各画（userStrokes）を、正解の各画のサンプル点列
 * （correctPathSamples、samplePath() で生成したもの）と順序で対応づけて採点する。
 *
 * 対応づけの方針: 「ユーザーの1画目 ↔ 正解の1画目」という単純な順序対応を採用する。
 * 書き順そのものが学習対象のアプリなので、画の形が似ていても順番が違えば
 * 別の画と比べることになり、結果的に書き順のズレも検出できる（意図した挙動）。
 *
 * 画数が合わない場合の扱い:
 *   - ユーザーの画数が正解より少ない → 描かれなかった正解の画は 'missing' として ×
 *   - ユーザーの画数が正解より多い   → 正解の画数を超えた分は 'extra' として記録するが、
 *     採点（totalJudged・matchedCount）には含めない。存在しない画と比較しても
 *     意味のある○×にならないため、「書きすぎ」の記録だけ残して分母には数えない
 */
export function gradeUserStrokes(
  userStrokes: Point[][],
  correctPathSamples: Point[][],
  distThreshold: number,
  ratioThreshold: number
): GradeSummary {
  const correctCount = correctPathSamples.length;
  const strokeTotal = Math.max(userStrokes.length, correctCount);
  const results: StrokeGradeResult[] = [];

  for (let i = 0; i < strokeTotal; i++) {
    const correctSample = correctPathSamples[i];
    const userTrace = userStrokes[i];

    if (!correctSample) {
      results.push({ index: i, passed: false, coverage: NaN, reason: 'extra' });
      continue;
    }
    if (!userTrace || userTrace.length === 0) {
      results.push({ index: i, passed: false, coverage: 0, reason: 'missing' });
      continue;
    }
    const coverage = computeCoverage([correctSample], userTrace, distThreshold);
    const passed = coverage >= ratioThreshold;
    results.push({ index: i, passed, coverage, reason: passed ? 'ok' : 'low-coverage' });
  }

  const judged = results.filter((r) => r.reason !== 'extra');
  const matchedCount = judged.filter((r) => r.passed).length;

  return { results, correctCount, matchedCount, totalJudged: judged.length };
}
