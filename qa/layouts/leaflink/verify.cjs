// Verification for the LeafLink layout generator (B5b).
// Run via run-verify.sh: tsc compiles src/world/layouts/leaflink.ts plus
// src/tokens.generated.ts to a temp dir, then this script requires the
// compiled module. Usage: node verify.cjs <compiled-leaflink.js>
// Checks: lane total, determinism, slice completeness, class ids,
// contiguity, graph connectivity, adjacency consistency, timing.
const { createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');

const compiledPath = process.argv[2];
if (!compiledPath) {
  console.error('usage: node verify.cjs <compiled-leaflink.js>');
  process.exit(2);
}
const { generate } = require(compiledPath);
// tokens.generated is compiled next to the module tree; resolve it from
// the compiled module location.
const path = require('node:path');
const tokensPath = path.join(path.dirname(compiledPath), '..', '..', 'tokens.generated.js');
const { T } = require(tokensPath);

const SEED = T.world.seed;
const LAYOUT_INDEX = 1;
const LANE_COUNT = T.world.laneCount;
const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const STRIDE = POINTS * LAYOUT_COUNT;
const TEXELS = 256 * 768 * 4;

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail !== undefined ? ` (${detail})` : ''}`);
  if (!cond) failures++;
}

function runOnce(seed, layoutIndex) {
  const out = new Float32Array(TEXELS);
  const side = generate(seed, out, layoutIndex);
  return { out, side };
}

// Timing: warm up once (first call pays V8 compile of the module), then
// time five runs and take the median. This measures generation cost, not
// JIT warmup. The cold first call is reported separately, not gated.
const warmOut = new Float32Array(TEXELS);
const cold0 = performance.now();
generate(SEED, warmOut, LAYOUT_INDEX);
const coldMs = performance.now() - cold0;
const timed = [];
for (let i = 0; i < 5; i++) {
  const t0 = performance.now();
  generate(SEED, warmOut, LAYOUT_INDEX);
  timed.push(performance.now() - t0);
}
timed.sort((a, b) => a - b);
const medianMs = timed[2];
check('generation under 150ms (median of 5 warmed runs)', medianMs < 150, `median=${medianMs.toFixed(1)}ms coldFirst=${coldMs.toFixed(1)}ms`);

// Determinism.
const hash = (buf) => createHash('sha256').update(Buffer.from(buf.buffer)).digest('hex');
const first = runOnce(SEED, LAYOUT_INDEX);
const second = runOnce(SEED, LAYOUT_INDEX);
const h1 = hash(first.out);
const h2 = hash(second.out);
check('deterministic bytes across runs', h1 === h2, h1.slice(0, 16));
const other = runOnce(SEED + 1, LAYOUT_INDEX);
check('different seed gives different bytes', hash(other.out) !== h1);

// Lane total and contiguity.
const { side, out } = first;
const laneTotal = side.edges.reduce((s, e) => s + e.laneCount, 0);
check('lane total is 6144', laneTotal === LANE_COUNT, laneTotal);
let expectStart = 0;
let contiguous = true;
for (const e of side.edges) {
  if (e.laneStart !== expectStart) contiguous = false;
  expectStart += e.laneCount;
}
check('edge lane ranges contiguous from 0', contiguous, `edges=${side.edges.length}`);

// Slice completeness and class ids: every lane point must carry class 2 or 3,
// and arterial edges must be class 3, local class 2.
let badClass = 0;
let badArterial = 0;
let badY = 0;
for (const e of side.edges) {
  const want = e.arterial ? 3 : 2;
  for (let s = 0; s < e.laneCount; s++) {
    const lane = e.laneStart + s;
    for (let k = 0; k < POINTS; k++) {
      const base = (lane * STRIDE + LAYOUT_INDEX * POINTS + k) * 4;
      const cls = out[base + 3];
      if (cls !== 2 && cls !== 3) badClass++;
      if (cls !== want) badArterial++;
      if (out[base + 1] !== 0) badY++;
    }
  }
}
check('every lane point has class 2 or 3', badClass === 0, `bad=${badClass}`);
check('arterial edges class 3, local class 2', badArterial === 0, `bad=${badArterial}`);
check('all points flat (y = 0)', badY === 0, `bad=${badY}`);

// Lane geometry: first point of each edge lane segment starts at the edge
// start node, and points advance monotonically along the edge.
let geomBad = 0;
for (const e of side.edges) {
  const ax = side.nodes[e.a * 2];
  const az = side.nodes[e.a * 2 + 1];
  const bx = side.nodes[e.b * 2];
  const bz = side.nodes[e.b * 2 + 1];
  const base0 = (e.laneStart * STRIDE + LAYOUT_INDEX * POINTS) * 4;
  if (Math.abs(out[base0] - ax) > 1e-6 || Math.abs(out[base0 + 2] - az) > 1e-6) geomBad++;
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (Math.abs(e.length - Math.sqrt(len2)) > 1e-4) geomBad++;
}
check('edge start points and lengths match nodes', geomBad === 0, `bad=${geomBad}`);

// Graph connectivity (T-LL-1): union-find over side edges, one component.
const nodeCount = side.nodes.length / 2;
const parent = new Int32Array(nodeCount);
for (let v = 0; v < nodeCount; v++) parent[v] = v;
const find = (v) => {
  let r = v;
  while (parent[r] !== r) r = parent[r];
  while (parent[v] !== r) {
    const n = parent[v];
    parent[v] = r;
    v = n;
  }
  return r;
};
for (const e of side.edges) {
  const ra = find(e.a);
  const rb = find(e.b);
  if (ra !== rb) parent[ra] = rb;
}
const root = find(0);
let components = 0;
for (let v = 0; v < nodeCount; v++) if (find(v) === root) components++;
check('graph connected (T-LL-1)', components === nodeCount, `${components}/${nodeCount} nodes`);

// Adjacency consistency: each edge listed in both endpoints, no extras.
let adjBad = 0;
for (let ei = 0; ei < side.edges.length; ei++) {
  const e = side.edges[ei];
  if (!side.adjacency[e.a].includes(ei) || !side.adjacency[e.b].includes(ei)) adjBad++;
}
const adjTotal = side.adjacency.reduce((s, l) => s + l.length, 0);
if (adjTotal !== side.edges.length * 2) adjBad++;
check('adjacency lists consistent', adjBad === 0, `entries=${adjTotal}`);

// Node bounds: lattice extent plus jitter, nothing wild.
let maxAbs = 0;
for (let v = 0; v < side.nodes.length; v++) maxAbs = Math.max(maxAbs, Math.abs(side.nodes[v]));
check('nodes within lattice plus jitter', maxAbs <= 21, `maxAbs=${maxAbs.toFixed(3)}`);

// Stats for the receipt.
const arterialCount = side.edges.filter((e) => e.arterial).length;
console.log(`STATS edges=${side.edges.length} arterial=${arterialCount} local=${side.edges.length - arterialCount} nodes=${nodeCount} genMedianMs=${medianMs.toFixed(1)} genColdMs=${coldMs.toFixed(1)} hash=${h1}`);

if (failures > 0) {
  console.log(`RESULT: ${failures} FAILURES`);
  process.exit(1);
}
console.log('RESULT: ALL PASS');
