# B5c Receipts: SideQuests layout generator

Run: `node qa/layouts/sidequests/run-test.mjs` (bundles
`src/world/layouts/sidequests.ts` with esbuild, checks the layout texture
slice for layout index 2). 19/19 checks pass.

## Allocation (default seed, layout index 2)

| Class | Lanes |
|---|---|
| grid (4) | 2080 (exact, matches allocation token) |
| outlines (5) | 376 (spec estimate about 400) |
| walkways (7) | 146 (spec estimate about 600; T-SQ-1 does not assert this count) |
| trails (8) | 139 (spec estimate about 180) |
| hatch (6) | 3403 (exact remainder) |
| total | 6144 |

Emission order is grid, outlines, walkways, trails, hatch. All 6144 lanes
have 8 finite points on plane y=0 with a valid class id at every point.

## Side data

- Buildings: 11 footprints (rect and L-shape polygons).
- Markers: (-13,-4), (16,10), (9,-12). Pairwise at least 9 apart, at
  least 8 from the trailhead (0,13), min footprint clearance 1.867
  (margin token 0.8).
- Trails: 3, with lane counts 48, 37, 54. Lane ids ordered from trailhead
  to marker; arc starts strictly increasing; dash lengths at most 0.3;
  max chord deviation 2.57, 2.59, 0.77 (all curved, none straight).
  First lane starts exactly at the trailhead; last lane ends within one
  final gap remainder (at most 0.2) of the marker, which is inherent to
  the dash/gap cut: a trail whose length falls in a gap interval ends
  with a gap, not a dash.
- Trail overlap: longest near-run between any pair is about 1.70 units
  (budget 2.0). Note the 1-2 pair is close to the budget; it passes but
  is the tightest margin in this layout.

## Determinism

SHA-256 of the full layout array, same seed, two runs:
`5fe3fe09c6e02217a6b0848afd89f085651e20e80079004335251f4dc0b32e18`.
Side data JSON identical across runs. A different seed differs.

## Timing

- Warm median of 5 runs: 74.9ms (samples 180.4, 61.0, 100.8, 67.6, 74.9).
  Budget 150ms. Single warm samples spike on this VM (scheduler noise),
  so the assertion uses the median.
- Cold first call in a fresh process: 105.4ms on this run, but 200-435ms
  on other runs. It stays near 200ms even with --no-lazy --no-opt, so it
  is not lazy compilation; it is one-time VM warmup plus noise. The
  worker runs off the main thread, so a cold worker start does not
  block UI. If a CI gate measures a single cold call, it will be flaky
  on this VM; measure warm median instead.

## Static checks

- `node tools/lint-tokens.mjs`: clean for this file (the only violations
  reported repo-wide are in `src/world/layouts/scatter.ts`, another
  worker's file, left untouched).
- `node tools/banned-scan.mjs src/world/layouts/sidequests.ts`: clean.
- `tsc --noEmit` on this file plus its token import: exit 0.

## Contract for the coordinator (worker registration)

`export function generate(seed, out, layoutIndex)` writes the sidequests
texels into the shared layout array at `lane * 32 + layout * 8 + point`
and returns `{ markers, trails, footprints }` where each trail is
`{ laneIds, arcStarts, arcLengths }` (arc lengths in world units, for
`setActivity` at 14 units per second). Register with layout index 2.
No DOM, no three imports, no worker import (rng is defined locally,
verbatim from the engine spec, to avoid a worker/layout cycle).
