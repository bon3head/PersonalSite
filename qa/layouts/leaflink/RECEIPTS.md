# B5b LeafLink layout generator: receipts

Card: B5b (wave 2). File: `src/world/layouts/leaflink.ts`.
Contract: `generate(seed, out, layoutIndex) -> LeaflinkSideData`, pure,
no DOM, no three imports. All values from `T` (tokens.generated).

## What it builds (S06 layout section)

- Nodes: 33 by 33 lattice, pitch 1.25, jitter 0.28, half jitter on the
  axis perpendicular to an arterial row or column (arterialJitterScale).
- Edges: 2112 grid edges (horizontals then verticals); arterial when both
  endpoints share an arterial row (horizontal) or column (vertical).
- Drop: non-arterial edges dropped at 0.12, then restored in shuffled
  order when endpoints are in different components or an endpoint would
  have degree 0. Final graph connected (asserted, throws otherwise).
- Diagonals: per cell at 0.04, direction at 0.5, local class.
- Allocation: quota by edge length, floor with min 1, remainder by
  largest fractional part, subtract from largest counts if over.
  Asserts exactly 6144 lanes.
- Emit: lane s of an edge covers t in [s/k, (s+1)/k], points evenly
  spaced, y = 0, class 3 arterial else 2. Lanes contiguous per edge.
- Side data: nodes Float32Array(x, z), edges {a, b, length, laneStart,
  laneCount, arterial}, adjacency lists (incident edge indices per node).
- RNG stream: mulberry32 verbatim, rng(seed + layoutIndex * 1000003),
  which is the S06 stream for layout index 1. Draw order documented in
  the file header; changing it changes the output bytes.

## Verification (qa/layouts/leaflink/verify.cjs, run-verify.sh)

Compiles the generator plus tokens with the repo tsc and runs the
checks in plain Node. Full output in verify-output.txt.

- Lane total 6144, edge ranges contiguous from 0.
- Deterministic: sha256 6cd5e76a30bc1f6a1cd523a145643060365e7b2c63f15ea963afe020c7b97104
  identical across runs; different seed gives different bytes.
- Every lane point class 2 or 3; arterial edges class 3, local class 2.
- All points flat (y = 0); edge start points and lengths match nodes.
- T-LL-1: graph connected, 1089/1089 nodes in one component.
- Adjacency lists consistent (3866 entries = 2 per edge).
- Nodes within lattice plus jitter (maxAbs 20.135).
- Stats: 1933 edges (320 arterial, 1613 local), 1089 nodes.
- Timing: median 59.9ms over 5 warmed runs (under the 150ms budget).
  Cold first call measured 238.8ms on this run under parallel-worker
  load; that number is V8 compile plus box load, not generation cost,
  and is reported here rather than hidden. Warmed medians across runs
  ranged 5 to 60ms depending on load.
- lint-tokens: clean for this file (remaining repo failures are other
  workers' files). banned-scan: clean for this file. tsc --noEmit:
  no leaflink errors.

## Notes for the coordinator

- Registration: call generate(seed, out, 1) and post the returned side
  data with the layout. The worker currently posts side: {}; this card
  does not touch worker.ts (coordinator-owned registration).
- The adjacency lists carry edge indices, not neighbor node indices;
  the scene controller derives neighbors and lengths from the edges
  array. Documented in the file header.
- No BLOCKED items. No spec changes. No files outside the card touched.
