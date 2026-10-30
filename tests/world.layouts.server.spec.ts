// Layout tests for the real server generator (S05 section 3.1, T-SRV-1).
// Pure function tests: no browser needed, Playwright runs these in Node.
import { test, expect } from '@playwright/test';
import { generate } from '../src/world/layouts/server';
import { T } from '../src/tokens.generated';

const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT;
const SEED = T.world.seed;
const SERVER_LAYOUT = 0;

function fullBuffer(): Float32Array {
  return new Float32Array(T.world.layoutTexture.width * T.world.layoutTexture.height * 4);
}

function point(buf: Float32Array, lane: number, lay: number, k: number): [number, number, number, number] {
  const base = (lane * LANE_STRIDE + lay * POINTS + k) * 4;
  return [buf[base], buf[base + 1], buf[base + 2], buf[base + 3]];
}

function close(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(1e-4);
}

test('T-SRV-1: lanes 0, 127, 128, 6143 at k=0 match hand values', () => {
  const buf = fullBuffer();
  generate(SEED, buf, SERVER_LAYOUT);
  const expected: Record<number, [number, number, number]> = {
    0: [-3.565, -2.315, -24],
    127: [-3.085, -1.935, -24],
    128: [-2.615, -2.315, -24],
    6143: [3.565, 2.315, -24],
  };
  for (const [lane, [x, y, z]] of Object.entries(expected)) {
    const [ax, ay, az, cls] = point(buf, Number(lane), SERVER_LAYOUT, 0);
    close(ax, x);
    close(ay, y);
    close(az, z);
    expect(cls).toBe(0);
  }
});

test('T-SRV-1: converge points k=6, k=7 for lane 0 mix toward focus', () => {
  const buf = fullBuffer();
  generate(SEED, buf, SERVER_LAYOUT);
  const [x6, y6, z6, c6] = point(buf, 0, SERVER_LAYOUT, 6);
  close(x6, -1.7825);
  close(y6, -1.1575);
  close(z6, 0.4);
  expect(c6).toBe(0);
  const [x7, y7, z7, c7] = point(buf, 0, SERVER_LAYOUT, 7);
  close(x7, -0.2852);
  close(y7, -0.1852);
  close(z7, 2.2);
  expect(c7).toBe(0);
});

test('server layout: exactly 6144 lanes of 8 points, all finite, all class 0', () => {
  const buf = fullBuffer();
  generate(SEED, buf, SERVER_LAYOUT);
  let written = 0;
  let bad = 0;
  for (let lane = 0; lane < T.world.laneCount; lane++) {
    for (let k = 0; k < POINTS; k++) {
      const [x, y, z, cls] = point(buf, lane, SERVER_LAYOUT, k);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || cls !== 0) bad++;
      written++;
    }
  }
  expect(bad).toBe(0);
  expect(written).toBe(T.world.laneCount * POINTS);
  // Straight points run z from -24 to -2; the two converge points sit at 0.4 and 2.2.
  const [, , z0] = point(buf, 0, SERVER_LAYOUT, 0);
  const [, , z5] = point(buf, 0, SERVER_LAYOUT, 5);
  close(z0, -24);
  close(z5, -2);
});

test('server layout: deterministic across runs and seeds (pure grid arithmetic)', () => {
  const a = fullBuffer();
  const b = fullBuffer();
  generate(SEED, a, SERVER_LAYOUT);
  generate(SEED, b, SERVER_LAYOUT);
  expect(a).toEqual(b);
  const c = fullBuffer();
  generate(SEED + 1, c, SERVER_LAYOUT);
  expect(c).toEqual(a);
});

test('server layout: generation under 150ms in Node', () => {
  const buf = fullBuffer();
  const t0 = performance.now();
  generate(SEED, buf, SERVER_LAYOUT);
  const ms = performance.now() - t0;
  expect(ms).toBeLessThan(150);
});

test('server layout: writes only its own layout slice', () => {
  const buf = fullBuffer();
  generate(SEED, buf, SERVER_LAYOUT);
  const other = fullBuffer();
  generate(SEED, other, 1);
  // Same geometry in a different slice: values equal, positions differ.
  const [x0] = point(buf, 0, SERVER_LAYOUT, 0);
  const [x1] = point(other, 0, 1, 0);
  close(x0, x1);
  const [otherSlice] = point(buf, 0, 1, 0);
  expect(otherSlice).toBe(0);
});
