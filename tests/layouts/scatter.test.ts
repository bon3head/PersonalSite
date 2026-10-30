// Layout tests for the S08 scatter generator (B5d card).
// Covers the layout-level claims behind T-404-1: 6,144 lanes of 8 points,
// class 9, sphere radius, segment length range, determinism, speed,
// and isolation (no other layout's texels touched).
// Bulk checks aggregate into counts first: one expect per texel would
// block the worker event loop for minutes (Playwright expect overhead).
import { test, expect } from '@playwright/test';
import { generate } from '../../src/world/layouts/scatter';
import { T } from '../../src/tokens.generated';

const LANE_COUNT = T.world.laneCount;
const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT;
const FLOATS_PER_TEXEL = 4;
const SCATTER_LAYOUT = 3;
const BUF_LEN = T.world.layoutTexture.width * T.world.layoutTexture.height * FLOATS_PER_TEXEL;
const EPS = 1e-4;

function texelBase(lane: number, k: number): number {
  return (lane * LANE_STRIDE + SCATTER_LAYOUT * POINTS + k) * FLOATS_PER_TEXEL;
}

test('scatter writes 6144 lanes of 8 points, all class 9', () => {
  const out = new Float32Array(BUF_LEN);
  const side = generate(T.world.seed, out, SCATTER_LAYOUT);
  expect(side).toEqual({});
  let classed = 0;
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let k = 0; k < POINTS; k++) {
      if (out[texelBase(lane, k) + 3] === 9) classed++;
    }
  }
  expect(classed).toBe(LANE_COUNT * POINTS);
});

test('scatter geometry: centers in sphere, lengths in range, points evenly spaced', () => {
  const out = new Float32Array(BUF_LEN);
  generate(T.world.seed, out, SCATTER_LAYOUT);
  const radius = T.world.scatter.radius;
  const segMin = T.world.scatter.segLength[0];
  const segMax = T.world.scatter.segLength[1];
  let sphereBad = 0;
  let lenBad = 0;
  let stepBad = 0;
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const p0 = texelBase(lane, 0);
    const p7 = texelBase(lane, POINTS - 1);
    const mx = (out[p0] + out[p7]) / 2;
    const my = (out[p0 + 1] + out[p7 + 1]) / 2;
    const mz = (out[p0 + 2] + out[p7 + 2]) / 2;
    if (Math.sqrt(mx * mx + my * my + mz * mz) > radius + EPS) sphereBad++;
    const len = Math.sqrt(
      (out[p7] - out[p0]) ** 2 + (out[p7 + 1] - out[p0 + 1]) ** 2 + (out[p7 + 2] - out[p0 + 2]) ** 2,
    );
    if (len < segMin - EPS || len > segMax + EPS) lenBad++;
    const step = len / (POINTS - 1);
    for (let k = 0; k < POINTS - 1; k++) {
      const a = texelBase(lane, k);
      const b = texelBase(lane, k + 1);
      const d = Math.sqrt(
        (out[b] - out[a]) ** 2 + (out[b + 1] - out[a + 1]) ** 2 + (out[b + 2] - out[a + 2]) ** 2,
      );
      if (Math.abs(d - step) >= EPS) stepBad++;
    }
  }
  expect(sphereBad).toBe(0);
  expect(lenBad).toBe(0);
  expect(stepBad).toBe(0);
});

test('scatter is deterministic across runs', () => {
  const a = new Float32Array(BUF_LEN);
  const b = new Float32Array(BUF_LEN);
  generate(T.world.seed, a, SCATTER_LAYOUT);
  generate(T.world.seed, b, SCATTER_LAYOUT);
  expect(a).toEqual(b);
});

test('scatter generation is under 150ms', () => {
  const out = new Float32Array(BUF_LEN);
  const start = performance.now();
  generate(T.world.seed, out, SCATTER_LAYOUT);
  const ms = performance.now() - start;
  expect(ms).toBeLessThan(150);
});

test('scatter touches only its own layout texels', () => {
  const sentinel = -777;
  const out = new Float32Array(BUF_LEN).fill(sentinel);
  generate(T.world.seed, out, SCATTER_LAYOUT);
  let touched = 0;
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let lay = 0; lay < LAYOUT_COUNT; lay++) {
      if (lay === SCATTER_LAYOUT) continue;
      for (let k = 0; k < POINTS; k++) {
        const base = (lane * LANE_STRIDE + lay * POINTS + k) * FLOATS_PER_TEXEL;
        if (out[base] !== sentinel || out[base + 3] !== sentinel) touched++;
      }
    }
  }
  expect(touched).toBe(0);
});
