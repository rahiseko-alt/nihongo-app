import { describe, it, expect } from 'vitest';
import { recalc } from '../../src/lib/db/repository.js';
import type { KanjiProgressRow } from '../../src/lib/db/types.js';

describe('recalc', () => {
  it('first correct attempt produces 普通 (100%) → 得意 と判定', () => {
    const next = recalc(undefined, '飛', true);
    expect(next.total_attempts).toBe(1);
    expect(next.correct_count).toBe(1);
    expect(next.accuracy_pct).toBe(100);
    expect(next.label).toBe('得意');
    expect(next.srs_interval_days).toBe(1);
    expect(next.srs_repetition).toBe(1);
  });

  it('first incorrect attempt → 重点 / interval=1 / ease_factor 減', () => {
    const next = recalc(undefined, '飛', false);
    expect(next.total_attempts).toBe(1);
    expect(next.correct_count).toBe(0);
    expect(next.accuracy_pct).toBe(0);
    expect(next.label).toBe('重点');
    expect(next.srs_interval_days).toBe(1);
    expect(next.srs_repetition).toBe(0);
    expect(next.srs_ease_factor).toBeCloseTo(2.3);
  });

  it('連続正解で SRS interval が 1→3→7→14→30 と伸びる', () => {
    let prev: KanjiProgressRow | undefined;
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      const n = recalc(prev, '愛', true);
      intervals.push(n.srs_interval_days);
      prev = n;
    }
    expect(intervals).toEqual([1, 3, 7, 14, 30]);
  });

  it('30 を超えると ease_factor (2.5) で増える: 30→max(60, 75)', () => {
    let prev: KanjiProgressRow | undefined;
    for (let i = 0; i < 5; i++) prev = recalc(prev, '愛', true);
    const sixth = recalc(prev, '愛', true);
    expect(sixth.srs_interval_days).toBe(75);
  });

  it('accuracy 50-79% は 苦手 / 80-99% は 普通', () => {
    // 5 試行で 4 正解 = 80% → 普通
    let prev: KanjiProgressRow | undefined;
    prev = recalc(prev, '岡', true);
    prev = recalc(prev, '岡', true);
    prev = recalc(prev, '岡', true);
    prev = recalc(prev, '岡', true);
    prev = recalc(prev, '岡', false);
    expect(prev.accuracy_pct).toBe(80);
    expect(prev.label).toBe('普通');

    // さらに 1 不正解で 4/6 = 66.67% → 苦手
    prev = recalc(prev, '岡', false);
    expect(prev.accuracy_pct).toBeCloseTo(66.67, 1);
    expect(prev.label).toBe('苦手');
  });

  it('ease_factor は 1.3 を下限とする', () => {
    let prev: KanjiProgressRow | undefined;
    for (let i = 0; i < 10; i++) prev = recalc(prev, '北', false);
    expect(prev!.srs_ease_factor).toBeGreaterThanOrEqual(1.3);
  });
});
