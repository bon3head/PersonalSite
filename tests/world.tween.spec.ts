// Unit tests for S02 tween section numbers (T-S02-4).
import { test, expect } from '@playwright/test';
import { easeSignature, spring } from '../src/world/tween';

test('easeSignature(0.3) is between 0.80 and 0.86', () => {
  const v = easeSignature(0.3);
  expect(v).toBeGreaterThanOrEqual(0.8);
  expect(v).toBeLessThanOrEqual(0.86);
});

test('spring(0.7, 3.2) peaks 1.040 to 1.052 and settles within 0.01 of 1 after 0.6s', () => {
  const f = spring(0.7, 3.2);
  let peak = 0;
  for (let t = 0; t <= 2; t += 0.001) {
    const v = f(t);
    if (v > peak) peak = v;
  }
  expect(peak).toBeGreaterThanOrEqual(1.04);
  expect(peak).toBeLessThanOrEqual(1.052);
  for (let t = 0.6; t <= 2; t += 0.05) {
    expect(Math.abs(f(t) - 1)).toBeLessThan(0.01);
  }
});
