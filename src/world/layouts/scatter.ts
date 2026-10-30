// Scatter layout generator (S08). Pure function: writes the scatter
// layout into `out` at the S02 texel indices and returns no side data.
// The coordinator registers this in src/world/worker.ts, replacing B2's
// inline genScatter. Output is byte-identical to B2's genScatter by
// construction: same seed stream, same RNG call order, same arithmetic.
import { T } from '../../tokens.generated';

// mulberry32, verbatim (S02 worker chapter). The only RNG in src/world.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0; // lit-ok: mulberry32 increment
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); // lit-ok: mulberry32 scramble
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); // lit-ok: mulberry32 scramble
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // lit-ok: mulberry32 output scale
  };
}

// Scatter carries no side data (no graph, no markers, no trail lane lists).
export interface SideData {
  // intentionally empty
}

const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT; // texels per lane across all layouts
const FLOATS_PER_TEXEL = 4; // lit-ok: RGBA channels
const SCATTER_CLASS = 9; // lit-ok: S02 class 9 scatter.lane

export function generate(seed: number, out: Float32Array, layoutIndex: number): SideData {
  const rand = rng(seed + layoutIndex * 1000003); // lit-ok: S02 layout stream offset
  const radius = T.world.scatter.radius;
  const segMin = T.world.scatter.segLength[0];
  const segSpan = T.world.scatter.segLength[1] - T.world.scatter.segLength[0];
  for (let lane = 0; lane < T.world.laneCount; lane++) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (;;) {
      cx = (rand() * 2 - 1) * radius;
      cy = (rand() * 2 - 1) * radius;
      cz = (rand() * 2 - 1) * radius;
      if (cx * cx + cy * cy + cz * cz <= radius * radius) break;
    }
    const z = rand() * 2 - 1;
    const phi = rand() * 2 * Math.PI;
    const r = Math.sqrt(1 - z * z);
    const dx = r * Math.cos(phi);
    const dy = r * Math.sin(phi);
    const dz = z;
    const len = segMin + rand() * segSpan;
    for (let k = 0; k < POINTS; k++) {
      const f = k / (POINTS - 1) - 0.5;
      const base = (lane * LANE_STRIDE + layoutIndex * POINTS + k) * FLOATS_PER_TEXEL;
      out[base] = cx + dx * f * len;
      out[base + 1] = cy + dy * f * len;
      out[base + 2] = cz + dz * f * len;
      out[base + 3] = SCATTER_CLASS;
    }
  }
  return {};
}
