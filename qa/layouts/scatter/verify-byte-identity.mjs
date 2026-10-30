// Byte-identity verification for the B5d scatter generator.
// Bundles the REAL src/world/worker.ts (B2's inline genScatter) with esbuild,
// runs it with a `self` shim, and compares its scatter slice byte-for-byte
// against src/world/layouts/scatter.ts generate() at the same seed.
// Writes a receipt JSON next to this script. Exit 1 on any mismatch.
// Run: node qa/layouts/scatter/verify-byte-identity.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..', '..', '..');
const esbuild = join(root, 'node_modules', '.bin', 'esbuild');

const bundle = (entry, out) => {
  execFileSync(esbuild, [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${out}`], {
    stdio: 'pipe',
  });
};

const workerBundle = '/tmp/b5d-worker-bundle.cjs';
const scatterBundle = '/tmp/b5d-scatter-bundle.cjs';
bundle(join(root, 'src', 'world', 'worker.ts'), workerBundle);
bundle(join(root, 'src', 'world', 'layouts', 'scatter.ts'), scatterBundle);

// Shim the worker global before requiring the worker bundle.
let posted = null;
globalThis.self = {
  postMessage: (msg) => {
    posted = msg;
  },
  onmessage: null,
};
await import(workerBundle);
const { generate } = await import(scatterBundle);

const SEED = 20271201;
const BUF_LEN = 256 * 768 * 4;
const LANE_STRIDE = 32;
const POINTS = 8;
const SCATTER_LAYOUT = 3;

const checkSeed = (seed) => {
  posted = null;
  globalThis.self.onmessage({ data: { seed } });
  if (!posted || posted.error) throw new Error(`worker failed: ${posted?.error}`);
  const workerLayouts = posted.layouts;
  const mine = new Float32Array(BUF_LEN);
  generate(seed, mine, SCATTER_LAYOUT);
  let mismatches = 0;
  let firstMismatch = -1;
  for (let lane = 0; lane < 6144; lane++) {
    for (let k = 0; k < POINTS; k++) {
      const base = (lane * LANE_STRIDE + SCATTER_LAYOUT * POINTS + k) * 4;
      for (let c = 0; c < 4; c++) {
        if (workerLayouts[base + c] !== mine[base + c]) {
          mismatches++;
          if (firstMismatch < 0) firstMismatch = base + c;
        }
      }
    }
  }
  const slice = (buf) => {
    const out = new Float32Array(6144 * POINTS * 4);
    for (let lane = 0; lane < 6144; lane++) {
      for (let k = 0; k < POINTS; k++) {
        const src = (lane * LANE_STRIDE + SCATTER_LAYOUT * POINTS + k) * 4;
        const dst = (lane * POINTS + k) * 4;
        out[dst] = buf[src];
        out[dst + 1] = buf[src + 1];
        out[dst + 2] = buf[src + 2];
        out[dst + 3] = buf[src + 3];
      }
    }
    return out;
  };
  const hash = (arr) => createHash('sha256').update(Buffer.from(arr.buffer)).digest('hex');
  return {
    seed,
    mismatches,
    firstMismatch,
    workerSliceSha256: hash(slice(workerLayouts)),
    mineSliceSha256: hash(slice(mine)),
  };
};

const results = [checkSeed(SEED), checkSeed(SEED + 7)];
const pass = results.every((r) => r.mismatches === 0 && r.workerSliceSha256 === r.mineSliceSha256);
const receipt = {
  check: 'B5d scatter byte-identity vs B2 worker.ts genScatter',
  seeds: results,
  pass,
  generatedAt: new Date().toISOString(),
};
writeFileSync(join(dir, 'byte-identity.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
process.exit(pass ? 0 : 1);
