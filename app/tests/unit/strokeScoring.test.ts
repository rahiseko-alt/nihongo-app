import { describe, it, expect } from 'vitest';
import { computeCoverage, gradeUserStrokes, type Point } from '../../src/lib/utils/strokeScoring';

/** 直線 (x0,y0)→(x1,y1) を n+1 個の等間隔点でサンプルした点列を作る（samplePath の簡易版） */
function sampleLine(x0: number, y0: number, x1: number, y1: number, n = 10): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
  }
  return pts;
}

describe('computeCoverage', () => {
  it('軌跡が目標の線をそのままなぞっていれば 1 に近い', () => {
    const target = sampleLine(0, 0, 100, 0);
    const trace = sampleLine(0, 0, 100, 0, 40); // より密なサンプル
    expect(computeCoverage([target], trace, 5)).toBeCloseTo(1, 5);
  });

  it('軌跡が全く離れた位置なら 0', () => {
    const target = sampleLine(0, 0, 100, 0);
    const trace = sampleLine(0, 500, 100, 500);
    expect(computeCoverage([target], trace, 5)).toBe(0);
  });

  it('軌跡が空なら 0', () => {
    const target = sampleLine(0, 0, 100, 0);
    expect(computeCoverage([target], [], 5)).toBe(0);
  });

  it('始点・終点のどちらかに触れていない場合は未カバー扱い（偶然の部分一致で○にしない）', () => {
    const target = sampleLine(0, 0, 100, 0);
    // 中間だけ触れて、終点(100,0)には触れない軌跡
    const trace = sampleLine(40, 0, 60, 0);
    expect(computeCoverage([target], trace, 5)).toBe(0);
  });
});

describe('gradeUserStrokes', () => {
  const DIST_THRESHOLD = 5;
  const RATIO_THRESHOLD = 0.18;

  it('全画が正しくなぞられていれば全て ok で満点', () => {
    const correct = [sampleLine(0, 0, 100, 0), sampleLine(0, 0, 0, 100)];
    const user = [sampleLine(0, 0, 100, 0, 30), sampleLine(0, 0, 0, 100, 30)];
    const summary = gradeUserStrokes(user, correct, DIST_THRESHOLD, RATIO_THRESHOLD);
    expect(summary.correctCount).toBe(2);
    expect(summary.totalJudged).toBe(2);
    expect(summary.matchedCount).toBe(2);
    expect(summary.results.every((r) => r.reason === 'ok' && r.passed)).toBe(true);
  });

  it('明後日の方向に描いた画は low-coverage で ×', () => {
    const correct = [sampleLine(0, 0, 100, 0)];
    const user = [sampleLine(0, 500, 100, 500)]; // 全く違う場所
    const summary = gradeUserStrokes(user, correct, DIST_THRESHOLD, RATIO_THRESHOLD);
    expect(summary.matchedCount).toBe(0);
    expect(summary.results[0].reason).toBe('low-coverage');
    expect(summary.results[0].passed).toBe(false);
  });

  it('ユーザーの画数が正解より少ない場合、描かれなかった画は missing で ×（分母には数える）', () => {
    const correct = [sampleLine(0, 0, 100, 0), sampleLine(0, 0, 0, 100), sampleLine(0, 100, 100, 100)];
    const user = [sampleLine(0, 0, 100, 0, 30)]; // 1画目だけ描いた
    const summary = gradeUserStrokes(user, correct, DIST_THRESHOLD, RATIO_THRESHOLD);
    expect(summary.correctCount).toBe(3);
    expect(summary.totalJudged).toBe(3);
    expect(summary.matchedCount).toBe(1);
    expect(summary.results[0].reason).toBe('ok');
    expect(summary.results[1].reason).toBe('missing');
    expect(summary.results[1].coverage).toBe(0);
    expect(summary.results[2].reason).toBe('missing');
  });

  it('ユーザーの画数が正解より多い場合、超過分は extra として記録するが分母には含めない', () => {
    const correct = [sampleLine(0, 0, 100, 0)];
    const user = [sampleLine(0, 0, 100, 0, 30), sampleLine(0, 0, 0, 100, 30)]; // 2画目は余分
    const summary = gradeUserStrokes(user, correct, DIST_THRESHOLD, RATIO_THRESHOLD);
    expect(summary.correctCount).toBe(1);
    expect(summary.totalJudged).toBe(1); // extra は分母に含めない
    expect(summary.matchedCount).toBe(1);
    expect(summary.results).toHaveLength(2);
    expect(summary.results[1].reason).toBe('extra');
    expect(Number.isNaN(summary.results[1].coverage)).toBe(true);
  });

  it('画の対応は順序（1画目↔1画目）で行われるため、順番が違うと×になり得る', () => {
    // 正解: 1画目=横線, 2画目=縦線。ユーザーが順番を逆にして描いた場合
    const correct = [sampleLine(0, 0, 100, 0), sampleLine(0, 0, 0, 100)];
    const userReversed = [sampleLine(0, 0, 0, 100, 30), sampleLine(0, 0, 100, 0, 30)];
    const summary = gradeUserStrokes(userReversed, correct, DIST_THRESHOLD, RATIO_THRESHOLD);
    // 縦線を1画目の横線と比べる・横線を2画目の縦線と比べることになるため、
    // 形が違う直線同士では基本的にカバー率が閾値を下回り × になる
    expect(summary.results[0].reason).toBe('low-coverage');
    expect(summary.results[1].reason).toBe('low-coverage');
    expect(summary.matchedCount).toBe(0);
  });
});
