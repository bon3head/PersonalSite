// B5c verification: bundle the SideQuests generator with esbuild and check
// lane totals, classes, determinism, markers, trails, hatch, and timing.
import { buildSync } from 'esbuild';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
buildSync({
  entryPoints: [join(root, 'src/world/layouts/sidequests.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '/tmp/sq-bundle.mjs',
  logLevel: 'silent',
});
const mod = await import('/tmp/sq-bundle.mjs');
const { generate, readoutClearZone, projectToFineScreen } = mod;
import tokens from '../../../themes/lane/tokens.generated.json' with { type: 'json' };

const W = tokens.world;
const LAYOUT = 2;
const TEX_W = W.layoutTexture.width;
const SIZE = TEX_W * W.layoutTexture.height * 4;

function texel(out, lane, k) {
  const idx = lane * 32 + LAYOUT * 8 + k;
  const tx = idx % TEX_W;
  const ty = Math.floor(idx / TEX_W);
  const base = (ty * TEX_W + tx) * 4;
  return [out[base], out[base + 1], out[base + 2], out[base + 3]];
}

function laneClass(out, lane) {
  return texel(out, lane, 0)[3];
}

function lanePoints(out, lane) {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const [x, y, z] = texel(out, lane, k);
    pts.push([x, y, z]);
  }
  return pts;
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail !== undefined ? ` :: ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

// Run 1: cold call (timed for the record only) + warm timed calls.
// The cold first call in a fresh process carries one-time VM costs (it stays
// near 200ms even with --no-lazy --no-opt, so it is not lazy compilation).
// Warm single samples spike on this VM (scheduler noise), so the timed
// assertion uses the median of five runs after one warmup.
const outWarm = new Float32Array(SIZE);
const tCold0 = performance.now();
generate(W.seed, outWarm, LAYOUT);
const coldMs = performance.now() - tCold0;
console.log(`cold first call: ${coldMs.toFixed(1)}ms (record only, not asserted)`);
const out1 = new Float32Array(SIZE);
const samples = [];
let side1 = null;
for (let i = 0; i < 5; i++) {
  const t0 = performance.now();
  side1 = generate(W.seed, out1, LAYOUT);
  samples.push(performance.now() - t0);
}
const sorted = [...samples].sort((a, b) => a - b);
const ms = sorted[2];
console.log(`warm samples: ${samples.map((s) => s.toFixed(1)).join(' ')} median=${ms.toFixed(1)}ms`);
check('generation under 150ms (warm median of 5)', ms < 150, `${ms.toFixed(1)}ms`);

const counts = { 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
let badClass = 0;
let badY = 0;
let badFinite = 0;
let firstBad = null;
for (let lane = 0; lane < W.laneCount; lane++) {
  const cls = laneClass(out1, lane);
  if (counts[cls] === undefined) {
    badClass++;
    if (firstBad === null) firstBad = `lane ${lane} class ${cls}`;
  } else counts[cls]++;
  for (let k = 0; k < 8; k++) {
    const [x, y, z, c] = texel(out1, lane, k);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) badFinite++;
    if (y !== 0) badY++;
    if (c !== cls) badClass++;
  }
}
check('all lanes written with valid classes', badClass === 0, firstBad ?? 'none bad');
check('all points finite', badFinite === 0, `${badFinite} bad`);
check('all points on plane y=0', badY === 0, `${badY} off-plane`);
check('grid lanes 2080', counts[4] === 2080, `got ${counts[4]}`);
const total = counts[4] + counts[5] + counts[6] + counts[7] + counts[8];
check('total lanes 6144', total === W.laneCount, `got ${total}`);
console.log(`counts: grid=${counts[4]} outlines=${counts[5]} walkways=${counts[7]} trails=${counts[8]} hatch=${counts[6]}`);
const hatchN = W.laneCount - (counts[4] + counts[5] + counts[7] + counts[8]);
check('hatch N matches remainder', counts[6] === hatchN, `hatch=${counts[6]} remainder=${hatchN}`);

// Class contiguity: lanes emitted grid, outlines, walkways, trails, hatch in order.
let order = '';
let prev = null;
for (let lane = 0; lane < W.laneCount; lane++) {
  const cls = laneClass(out1, lane);
  if (cls !== prev) {
    order += `${cls},`;
    prev = cls;
  }
}
check('class emission order grid,outlines,walkways,trails,hatch', order === '4,5,7,8,6,', order);

// Side data: buildings, markers.
check('buildings 11', side1.footprints.length === 11, `got ${side1.footprints.length}`);
check('markers 3', side1.markers.length === 3, JSON.stringify(side1.markers));
const start = W.sidequests.trails.start;
function dist2(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
let markerOk = true;
for (let i = 0; i < side1.markers.length; i++) {
  const m = side1.markers[i];
  if (dist2(m, [start[0], start[2]]) < W.sidequests.markerMinFromStart) markerOk = false;
  for (let j = i + 1; j < side1.markers.length; j++) {
    if (dist2(m, side1.markers[j]) < W.sidequests.markerMinApart) markerOk = false;
  }
}
check('markers apart and away from start', markerOk, JSON.stringify(side1.markers));

// Marker clearance from footprints (point-to-polygon distance).
function pointSegDist(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const ls = dx * dx + dz * dz;
  let t = ls === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / ls;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz));
}
function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const zi = poly[i][1];
    const xj = poly[j][0];
    const zj = poly[j][1];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function pointPolyDist(p, poly) {
  if (pointInPoly(p, poly)) return 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    best = Math.min(best, pointSegDist(p, poly[i], poly[(i + 1) % poly.length]));
  }
  return best;
}
let clearanceOk = true;
let minClear = Infinity;
for (const m of side1.markers) {
  for (const fp of side1.footprints) {
    const d = pointPolyDist(m, fp);
    minClear = Math.min(minClear, d);
    if (d < W.sidequests.footprintMargin) clearanceOk = false;
  }
}
check('markers clear of footprints by margin', clearanceOk, `min clearance ${minClear.toFixed(3)}`);

// B6c-fix: readout clear zone (S07 section 3.2 / K-SQ-5). No non-grid lane
// point may fall inside the fine readout box projected to the ground.
const zone = readoutClearZone();
let zoneBad = 0;
let zoneFirst = null;
for (let lane = 0; lane < W.laneCount; lane++) {
  if (laneClass(out1, lane) === 4) continue;
  for (let k = 0; k < 8; k++) {
    const [x, , z] = texel(out1, lane, k);
    if (x >= zone[0] && x <= zone[2] && z >= zone[1] && z <= zone[3]) {
      zoneBad++;
      if (zoneFirst === null) zoneFirst = `lane ${lane} point ${k} (${x.toFixed(2)}, ${z.toFixed(2)})`;
    }
  }
}
check('no non-grid lane point inside readout clear zone', zoneBad === 0, zoneFirst ?? `zone [${zone.map((v) => v.toFixed(2)).join(', ')}]`);

// B6c-fix: marker visibility at the fine pose. Every marker head must
// project inside the 1440x900 viewport with a 50px margin.
const headY = W.sidequests.marker.poleHeight + W.sidequests.marker.radius * W.sidequests.marker.squashY;
let visOk = true;
let visDetail = '';
for (let i = 0; i < side1.markers.length; i++) {
  const [mx, mz] = side1.markers[i];
  const [sx, sy] = projectToFineScreen(mx, headY, mz);
  visDetail += `m${i}=(${sx.toFixed(0)},${sy.toFixed(0)}) `;
  if (sx < 50 || sx > 1390 || sy < 50 || sy > 850) visOk = false;
}
check('markers project inside fine viewport with 50px margin', visOk, visDetail);

// Trails: lane ids ordered, arc starts increasing, dash lengths sane, trails curved.
check('trails 3', side1.trails.length === 3, `got ${side1.trails.length}`);
let trailLanesTotal = 0;
let trailOk = true;
let trailDetail = '';
for (let ti = 0; ti < side1.trails.length; ti++) {
  const tr = side1.trails[ti];
  trailLanesTotal += tr.laneIds.length;
  for (let i = 0; i < tr.laneIds.length; i++) {
    if (laneClass(out1, tr.laneIds[i]) !== 8) trailOk = false;
    if (i > 0 && tr.arcStarts[i] <= tr.arcStarts[i - 1]) trailOk = false;
    if (tr.arcLengths[i] <= 0 || tr.arcLengths[i] > W.sidequests.trails.dashLength + 1e-6) trailOk = false;
  }
  // Curve check: max deviation of trail points from the start-marker chord.
  const m = side1.markers[ti];
  const chord = [m[0] - start[0], m[1] - start[2]];
  const clen = Math.hypot(chord[0], chord[1]);
  let maxDev = 0;
  for (const id of tr.laneIds) {
    for (const [x, , z] of lanePoints(out1, id)) {
      const dev = Math.abs((x - start[0]) * chord[1] - (z - start[2]) * chord[0]) / clen;
      maxDev = Math.max(maxDev, dev);
    }
  }
  trailDetail += `trail${ti}: lanes=${tr.laneIds.length} maxDev=${maxDev.toFixed(2)}; `;
  if (maxDev < 0.5) trailOk = false;
  // First lane starts at the trailhead; last lane ends at the marker up to
  // one final gap remainder (the dash pattern can end mid-gap).
  const firstPts = lanePoints(out1, tr.laneIds[0]);
  const lastPts = lanePoints(out1, tr.laneIds[tr.laneIds.length - 1]);
  if (dist2([firstPts[0][0], firstPts[0][2]], [start[0], start[2]]) > 0.01) trailOk = false;
  if (dist2([lastPts[7][0], lastPts[7][2]], m) > W.sidequests.trails.gapLength + 0.01) trailOk = false;
}
check('trail lanes ordered, dashed, curved, endpoints exact', trailOk, trailDetail);
check('trail lane total matches class count', trailLanesTotal === counts[8], `${trailLanesTotal} vs ${counts[8]}`);

// Trail overlap: sample each trail densely; longest run of samples within 0.5 of another trail.
function trailSamples(tr, step) {
  const pts = [];
  for (const id of tr.laneIds) {
    const lp = lanePoints(out1, id);
    for (const [x, , z] of lp) pts.push([x, z]);
  }
  return pts;
}
let overlapOk = true;
let overlapDetail = '';
for (let a = 0; a < side1.trails.length; a++) {
  for (let b = a + 1; b < side1.trails.length; b++) {
    const pa = trailSamples(side1.trails[a]);
    const pb = trailSamples(side1.trails[b]);
    let run = 0;
    let maxRun = 0;
    for (const p of pa) {
      let dmin = Infinity;
      for (const q of pb) dmin = Math.min(dmin, dist2(p, q));
      if (dmin < 0.5) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else run = 0;
    }
    // Samples along a trail are ~dash/7 apart (~0.04); convert run to units conservatively.
    const runUnits = maxRun * 0.05;
    overlapDetail += `trails ${a}-${b}: maxRunUnits~${runUnits.toFixed(2)}; `;
    if (runUnits >= W.sidequests.trailMaxOverlap) overlapOk = false;
  }
}
check('no trail overlap over 2 units', overlapOk, overlapDetail);

// Determinism: second run, same seed, same bytes.
const out2 = new Float32Array(SIZE);
const side2 = generate(W.seed, out2, LAYOUT);
const h1 = createHash('sha256').update(Buffer.from(out1.buffer)).digest('hex');
const h2 = createHash('sha256').update(Buffer.from(out2.buffer)).digest('hex');
check('deterministic hash across runs', h1 === h2, h1.slice(0, 16));
// Side data determinism.
check(
  'side data deterministic',
  JSON.stringify(side1) === JSON.stringify(side2),
  '',
);
// Different seed gives different bytes.
const out3 = new Float32Array(SIZE);
generate(W.seed + 1, out3, LAYOUT);
const h3 = createHash('sha256').update(Buffer.from(out3.buffer)).digest('hex');
check('different seed differs', h3 !== h1, h3.slice(0, 16));

const receipt = {
  ms: Number(ms.toFixed(1)),
  warmSamples: samples.map((s) => Number(s.toFixed(1))),
  coldMs: Number(coldMs.toFixed(1)),
  counts,
  total,
  hash: h1,
  markers: side1.markers,
  trailLanes: side1.trails.map((t) => t.laneIds.length),
  checks: checks.map((c) => ({ name: c.name, ok: c.ok, detail: c.detail ?? '' })),
};
writeFileSync(join(root, 'qa/layouts/sidequests/receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks passed`);
