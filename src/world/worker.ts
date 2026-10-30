// Layout generation (S02 worker chapter). Runs in a Web Worker: generates all
// four layouts into one transferable Float32Array and posts it with side data.
// Uses the seeded PRNG below and nothing else for randomness.
// Test layouts (server-test, leaflink-test, sidequests-test) stand in for the
// real generators, which arrive in Wave 2. Scatter is the real S08 generator.
import { T } from '../tokens.generated';

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

const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT; // texels per lane across all layouts
const FLOATS_PER_TEXEL = 4; // lit-ok: RGBA channels
const EXPECTED_TEXELS_PER_LAYOUT = T.world.laneCount * POINTS;

// Write one point: lane i, layout lay, point k. Returns texels written (1).
function put(
  out: Float32Array,
  lane: number,
  lay: number,
  k: number,
  x: number,
  y: number,
  z: number,
  cls: number,
): number {
  const base = (lane * LANE_STRIDE + lay * POINTS + k) * FLOATS_PER_TEXEL;
  out[base] = x;
  out[base + 1] = y;
  out[base + 2] = z;
  out[base + 3] = cls;
  return 1;
}

// server-test: straight lanes on a grid, running along z.
// Server lane class throughout. Stand-in for the S05 generator.
function genServerTest(rand: () => number, out: Float32Array, lay: number): number {
  void rand;
  const cols = 96; // lit-ok: test grid 96 cols, 6144 lanes implies 64 rows
  const xPitch = 0.12; // lit-ok: test grid pitch
  const zPitch = 0.35; // lit-ok: test grid pitch
  const laneLen = 0.3; // lit-ok: test lane length
  const zStart = T.world.server.zStraight[0];
  let written = 0;
  for (let lane = 0; lane < T.world.laneCount; lane++) {
    const col = lane % cols;
    const row = Math.floor(lane / cols);
    const x = (col - (cols - 1) / 2) * xPitch;
    const zBase = zStart + row * zPitch;
    for (let k = 0; k < POINTS; k++) {
      const z = zBase + (k / (POINTS - 1)) * laneLen;
      written += put(out, lane, lay, k, x, 0, z, 0); // lit-ok: S02 class 0 server.lane
    }
  }
  return written;
}

// leaflink-test: random flat segments in the leaflink extent.
// Local class, every arterialEvery-th lane arterial class.
// Stand-in for the S06 generator.
function genLeaflinkTest(rand: () => number, out: Float32Array, lay: number): number {
  const ex = T.world.leaflink.extent[0] / 2;
  const ez = T.world.leaflink.extent[1] / 2;
  const lenMin = 0.5; // lit-ok: test segment length range
  const lenSpan = 2.5; // lit-ok: test segment length range
  let written = 0;
  for (let lane = 0; lane < T.world.laneCount; lane++) {
    const cx = (rand() * 2 - 1) * ex;
    const cz = (rand() * 2 - 1) * ez;
    const ang = rand() * 2 * Math.PI;
    const len = lenMin + rand() * lenSpan;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const cls = lane % T.world.leaflink.arterialEvery === 0 ? 3 : 2; // lit-ok: S02 class 3 arterial, 2 local
    for (let k = 0; k < POINTS; k++) {
      const f = k / (POINTS - 1) - 0.5;
      written += put(out, lane, lay, k, cx + dx * f * len, 0, cz + dz * f * len, cls);
    }
  }
  return written;
}

// sidequests-test: small circles' chords in the sidequests extent.
// Classes cycle through grid, outline, hatch, walkway, trail.
// Stand-in for the S07 generator.
function genSidequestsTest(rand: () => number, out: Float32Array, lay: number): number {
  const ex = T.world.sidequests.extent[0] / 2;
  const ez = T.world.sidequests.extent[1] / 2;
  const rMin = 0.3; // lit-ok: test chord radius range
  const rSpan = 0.9; // lit-ok: test chord radius range
  const classes = [4, 5, 6, 7, 8]; // lit-ok: S02 class ids 4 to 8
  let written = 0;
  for (let lane = 0; lane < T.world.laneCount; lane++) {
    const cx = (rand() * 2 - 1) * ex;
    const cz = (rand() * 2 - 1) * ez;
    const radius = rMin + rand() * rSpan;
    const ang = rand() * 2 * Math.PI;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const cls = classes[lane % classes.length];
    for (let k = 0; k < POINTS; k++) {
      const f = k / (POINTS - 1) - 0.5;
      written += put(out, lane, lay, k, cx + dx * f * 2 * radius, 0, cz + dz * f * 2 * radius, cls);
    }
  }
  return written;
}

// scatter: the real S08 generator. Center uniformly inside the
// sphere of scatter.radius (rejection sample in the cube), direction
// uniformly on the unit sphere, length uniform in segLength. Scatter class.
function genScatter(rand: () => number, out: Float32Array, lay: number): number {
  const radius = T.world.scatter.radius;
  const segMin = T.world.scatter.segLength[0];
  const segSpan = T.world.scatter.segLength[1] - T.world.scatter.segLength[0];
  let written = 0;
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
      written += put(out, lane, lay, k, cx + dx * f * len, cy + dy * f * len, cz + dz * f * len, 9); // lit-ok: S02 class 9 scatter.lane
    }
  }
  return written;
}

const GENERATORS = [genServerTest, genLeaflinkTest, genSidequestsTest, genScatter];

function generateAll(seed: number): Float32Array {
  const tex = T.world.layoutTexture;
  const out = new Float32Array(tex.width * tex.height * FLOATS_PER_TEXEL);
  for (let lay = 0; lay < LAYOUT_COUNT; lay++) {
    const rand = rng(seed + lay * 1000003); // lit-ok: S02 layout stream offset
    const written = GENERATORS[lay](rand, out, lay);
    if (written !== EXPECTED_TEXELS_PER_LAYOUT) {
      throw new Error(`layout ${lay} emitted ${written} texels, expected ${EXPECTED_TEXELS_PER_LAYOUT}`);
    }
  }
  if (out.length !== tex.width * tex.height * FLOATS_PER_TEXEL) {
    throw new Error(`layout buffer length ${out.length} does not match texture size`);
  }
  return out;
}

const scope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent) => void) | null;
};

scope.onmessage = (e: MessageEvent) => {
  const seed = (e.data as { seed: number }).seed;
  try {
    const layouts = generateAll(seed);
    scope.postMessage({ layouts, side: {} }, [layouts.buffer]);
  } catch (err) {
    scope.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
