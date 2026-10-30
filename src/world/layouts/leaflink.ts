// LeafLink street layout generator (S06 layout section, S02 worker chapter).
// Pure function: no DOM, no three imports, no IO. All randomness comes from
// one mulberry32 stream, drawn in a fixed order, so the same seed always
// produces the same bytes.
//
// Contract:
//   generate(seed, out, layoutIndex) -> LeaflinkSideData
//   - seed: base seed. The stream is rng(seed + layoutIndex * streamOffset),
//     which matches the S06 stream for the leaflink layout (index one).
//   - out: the full layout texture buffer. Only the layoutIndex slice is
//     written. Texel for lane i, point k:
//     offset = (lane * LANE_STRIDE + layoutIndex * POINTS + k) * FLOATS,
//     RGB = world position, A = class id (local or arterial, per S02).
//   - returns the LeafLink graph: node positions, per-edge records, and
//     adjacency lists (per node, the incident edge indices in edge order).
//     The worker posts this side data with the layout; the scene controller
//     uses it for Dijkstra routing, tap-to-node snapping, and lane lists.
//
// Draw order (fixed; changing it changes the output):
//   - Node jitter: nodes in index order (j rows outer, i cols inner),
//     x draw then z draw per node.
//   - Edge drops: non-arterial edges in edge order, one draw each.
//   - Restore shuffle: Fisher-Yates over the dropped list.
//   - Diagonals: cells in order (j outer, i inner), one draw per cell,
//     plus a second draw for direction when a diagonal is added.
//
// Node index: j * N + i, where i is the x column and j the z row.
// Base position: x = (i - (N-1)/2) * pitch, z = (j - (N-1)/2) * pitch, y = 0.
// Edge order: horizontals first (j outer, i inner), then verticals
// (j outer, i inner), then diagonals in cell order. Lanes of an edge are
// contiguous ids in the order a to b; lane s of an edge with k lanes covers
// t in [s/k, (s+1)/k], with points evenly spaced on that interval.

import { T } from '../../tokens.generated';

export interface LeaflinkEdgeData {
  a: number;
  b: number;
  length: number;
  laneStart: number;
  laneCount: number;
  arterial: boolean;
}

export interface LeaflinkSideData {
  nodes: Float32Array;
  edges: LeaflinkEdgeData[];
  adjacency: number[][];
}

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

const LANE_COUNT = T.world.laneCount;
const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT;
const FLOATS_PER_TEXEL = 4; // lit-ok: RGBA channels
const CLASS_LOCAL = 2;
const CLASS_ARTERIAL = 3; // lit-ok: S02 class 3 leaflink.arterial

const N = T.world.leaflink.lattice.nodes;
const PITCH = T.world.leaflink.lattice.pitch;
const JITTER = T.world.leaflink.lattice.jitter;
const ARTERIAL_EVERY = T.world.leaflink.arterialEvery;
const ARTERIAL_JITTER_SCALE = T.world.leaflink.arterialJitterScale;
const EDGE_DROP = T.world.leaflink.edgeDropFraction;
const DIAG_ADD = T.world.leaflink.diagonalAddFraction;

interface RawEdge {
  a: number;
  b: number;
  arterial: boolean;
}

export function generate(
  seed: number,
  out: Float32Array,
  layoutIndex: number,
): LeaflinkSideData {
  if (out.length < LANE_COUNT * LANE_STRIDE * FLOATS_PER_TEXEL) {
    throw new Error(
      `leaflink layout buffer too small: ${out.length}, need ${LANE_COUNT * LANE_STRIDE * FLOATS_PER_TEXEL}`,
    );
  }
  const rand = rng(seed + layoutIndex * 1000003); // lit-ok: S02 layout stream offset

  // Nodes.
  const nodeCount = N * N;
  const half = (N - 1) / 2;
  const nx = new Float32Array(nodeCount);
  const nz = new Float32Array(nodeCount);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const idx = j * N + i;
      let jx = (rand() * 2 - 1) * JITTER;
      let jz = (rand() * 2 - 1) * JITTER;
      if (i % ARTERIAL_EVERY === 0) jx *= ARTERIAL_JITTER_SCALE;
      if (j % ARTERIAL_EVERY === 0) jz *= ARTERIAL_JITTER_SCALE;
      nx[idx] = (i - half) * PITCH + jx;
      nz[idx] = (j - half) * PITCH + jz;
    }
  }

  // Grid edges: horizontals, then verticals.
  const edges: RawEdge[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N - 1; i++) {
      edges.push({ a: j * N + i, b: j * N + i + 1, arterial: j % ARTERIAL_EVERY === 0 });
    }
  }
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N; i++) {
      edges.push({ a: j * N + i, b: (j + 1) * N + i, arterial: i % ARTERIAL_EVERY === 0 });
    }
  }

  // Drop non-arterial edges, then restore in shuffled order any dropped
  // edge whose endpoints are in different components or whose endpoint
  // would have degree 0. The final graph is connected.
  const kept = new Uint8Array(edges.length).fill(1);
  const dropped: number[] = [];
  for (let e = 0; e < edges.length; e++) {
    if (!edges[e].arterial && rand() < EDGE_DROP) {
      kept[e] = 0;
      dropped.push(e);
    }
  }
  const parent = new Int32Array(nodeCount);
  for (let v = 0; v < nodeCount; v++) parent[v] = v;
  const find = (v: number): number => {
    let r = v;
    while (parent[r] !== r) r = parent[r];
    while (parent[v] !== r) {
      const next = parent[v];
      parent[v] = r;
      v = next;
    }
    return r;
  };
  const degree = new Int32Array(nodeCount);
  for (let e = 0; e < edges.length; e++) {
    if (!kept[e]) continue;
    const ra = find(edges[e].a);
    const rb = find(edges[e].b);
    if (ra !== rb) parent[ra] = rb;
    degree[edges[e].a]++;
    degree[edges[e].b]++;
  }
  for (let i = dropped.length - 1; i > 0; i--) {
    const swap = Math.floor(rand() * (i + 1));
    const tmp = dropped[i];
    dropped[i] = dropped[swap];
    dropped[swap] = tmp;
  }
  for (const e of dropped) {
    const a = edges[e].a;
    const b = edges[e].b;
    if (find(a) !== find(b) || degree[a] === 0 || degree[b] === 0) {
      kept[e] = 1;
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
      degree[a]++;
      degree[b]++;
    }
  }
  const root = find(0);
  for (let v = 0; v < nodeCount; v++) {
    if (find(v) !== root) throw new Error(`leaflink graph disconnected at node ${v}`);
    if (degree[v] === 0) throw new Error(`leaflink graph has isolated node ${v}`);
  }

  // Diagonals, local, appended after the grid edges.
  const finalEdges: RawEdge[] = [];
  for (let e = 0; e < edges.length; e++) {
    if (kept[e]) finalEdges.push(edges[e]);
  }
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      if (rand() < DIAG_ADD) {
        if (rand() < 0.5) {
          finalEdges.push({ a: j * N + i, b: (j + 1) * N + i + 1, arterial: false });
        } else {
          finalEdges.push({ a: j * N + i + 1, b: (j + 1) * N + i, arterial: false });
        }
      }
    }
  }

  // Allocate exactly LANE_COUNT lanes by edge length.
  const lengths: number[] = [];
  let total = 0;
  for (const e of finalEdges) {
    const dx = nx[e.b] - nx[e.a];
    const dz = nz[e.b] - nz[e.a];
    const len = Math.sqrt(dx * dx + dz * dz);
    lengths.push(len);
    total += len;
  }
  const quota: number[] = [];
  const counts: number[] = [];
  let sum = 0;
  for (let e = 0; e < finalEdges.length; e++) {
    const q = (LANE_COUNT * lengths[e]) / total;
    quota.push(q);
    const k = Math.max(1, Math.floor(q));
    counts.push(k);
    sum += k;
  }
  if (sum < LANE_COUNT) {
    const order = finalEdges
      .map((_, e) => e)
      .sort((p, q) => {
        const fp = quota[p] - Math.floor(quota[p]);
        const fq = quota[q] - Math.floor(quota[q]);
        if (fq !== fp) return fq - fp;
        return p - q;
      });
    let at = 0;
    while (sum < LANE_COUNT) {
      counts[order[at % order.length]]++;
      sum++;
      at++;
    }
  } else if (sum > LANE_COUNT) {
    while (sum > LANE_COUNT) {
      let best = -1;
      for (let e = 0; e < finalEdges.length; e++) {
        if (counts[e] <= 1) continue;
        if (best === -1 || counts[e] > counts[best]) best = e;
      }
      if (best === -1) throw new Error('leaflink allocation cannot reach lane total');
      counts[best]--;
      sum--;
    }
  }
  if (sum !== LANE_COUNT) throw new Error(`leaflink lane total ${sum}, expected ${LANE_COUNT}`);

  // Emit lanes and side data.
  const nodes = new Float32Array(nodeCount * 2);
  for (let v = 0; v < nodeCount; v++) {
    nodes[v * 2] = nx[v];
    nodes[v * 2 + 1] = nz[v];
  }
  const sideEdges: LeaflinkEdgeData[] = [];
  const adjacency: number[][] = [];
  for (let v = 0; v < nodeCount; v++) adjacency.push([]);
  let lane = 0;
  for (let e = 0; e < finalEdges.length; e++) {
    const edge = finalEdges[e];
    const kCount = counts[e];
    const cls = edge.arterial ? CLASS_ARTERIAL : CLASS_LOCAL;
    sideEdges.push({
      a: edge.a,
      b: edge.b,
      length: lengths[e],
      laneStart: lane,
      laneCount: kCount,
      arterial: edge.arterial,
    });
    adjacency[edge.a].push(e);
    adjacency[edge.b].push(e);
    for (let s = 0; s < kCount; s++) {
      for (let k = 0; k < POINTS; k++) {
        const t = (s + k / (POINTS - 1)) / kCount;
        const x = nx[edge.a] + t * (nx[edge.b] - nx[edge.a]);
        const z = nz[edge.a] + t * (nz[edge.b] - nz[edge.a]);
        const base = (lane * LANE_STRIDE + layoutIndex * POINTS + k) * FLOATS_PER_TEXEL;
        out[base] = x;
        out[base + 1] = 0;
        out[base + 2] = z;
        out[base + 3] = cls;
      }
      lane++;
    }
  }
  if (lane !== LANE_COUNT) throw new Error(`leaflink emitted ${lane} lanes, expected ${LANE_COUNT}`);

  return { nodes, edges: sideEdges, adjacency };
}
