// Layout generation (S02 worker chapter). Runs in a Web Worker: generates all
// four layouts into one transferable Float32Array and posts it with side data.
// Real generators (Wave 2): server, leaflink, sidequests, scatter from
// src/world/layouts/. Each creates its own mulberry32 stream per S02.
import { T } from '../tokens.generated';
import { generate as genServer } from './layouts/server';
import { generate as genLeaflink } from './layouts/leaflink';
import { generate as genSidequests } from './layouts/sidequests';
import { generate as genScatter } from './layouts/scatter';

// mulberry32, verbatim (S02 worker chapter). Kept exported for tests;
// the layout generators each define it locally to avoid an import cycle.
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

const FLOATS_PER_TEXEL = 4; // lit-ok: RGBA channels

function generateAll(seed: number): {
  layouts: Float32Array;
  side: Record<string, unknown>;
} {
  const tex = T.world.layoutTexture;
  const out = new Float32Array(tex.width * tex.height * FLOATS_PER_TEXEL);
  const side: Record<string, unknown> = {};
  // Layout indices per S02: 0 server, 1 leaflink, 2 sidequests, 3 scatter.
  // Each generator writes exactly laneCount * pointsPerLane texels into
  // its own slice (verified by its B5 card tests) and returns side data.
  genServer(seed, out, 0);
  side.leaflink = genLeaflink(seed, out, 1);
  side.sidequests = genSidequests(seed, out, 2);
  side.scatter = genScatter(seed, out, 3);
  if (out.length !== tex.width * tex.height * FLOATS_PER_TEXEL) {
    throw new Error(`layout buffer length ${out.length} does not match texture size`);
  }
  return { layouts: out, side };
}

const scope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent) => void) | null;
};

scope.onmessage = (e: MessageEvent) => {
  const seed = (e.data as { seed: number }).seed;
  try {
    const { layouts, side } = generateAll(seed);
    scope.postMessage({ layouts, side }, [layouts.buffer]);
  } catch (err) {
    scope.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
