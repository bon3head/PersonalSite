# B5c Receipts: SideQuests layout generator

Run: `node qa/layouts/sidequests/run-test.mjs` (bundles
`src/world/layouts/sidequests.ts` with esbuild, checks the layout texture
slice for layout index 2). 21/21 checks pass (19 original + 2 B6c-fix).

## Allocation (default seed, layout index 2)

| Class | Lanes |
|---|---|
| grid (4) | 2080 (exact, matches allocation token) |
| outlines (5) | 361 (spec estimate about 400) |
| walkways (7) | 140 (spec estimate about 600; T-SQ-1 does not assert this count) |
| trails (8) | 140 (spec estimate about 180) |
| hatch (6) | 3423 (exact remainder) |
| total | 6144 |

Emission order is grid, outlines, walkways, trails, hatch. All 6144 lanes
have 8 finite points on plane y=0 with a valid class id at every point.

## Side data

- Buildings: 11 footprints (rect and L-shape polygons).
- Markers: (1,-1), (15,3), (-12,-7). Pairwise at least 9 apart, at
  least 8 from the trailhead (0,13), min footprint clearance 0.909
  (margin token 0.8).
- Trails: 3, with lane counts 40, 44, 56. Lane ids ordered from trailhead
  to marker; arc starts strictly increasing; dash lengths at most 0.3;
  max chord deviation 2.90, 3.78, 2.95 (all curved, none straight).
  First lane starts exactly at the trailhead; last lane ends within one
  final gap remainder (at most 0.2) of the marker, which is inherent to
  the dash/gap cut: a trail whose length falls in a gap interval ends
  with a gap, not a dash.
- Trail overlap: longest near-run between any pair is about 0.80 units
  (budget 2.0).

## Determinism

SHA-256 of the full layout array, same seed, two runs:
`9677011ce9145b335d14119b28133090440475ea8b63a9f2efe9ff5934e00aa3`.
Side data JSON identical across runs. A different seed differs.

## Timing

- Warm median of 5 runs: 18.5ms (samples 33.9, 38.2, 18.0, 9.5, 18.5).
  Budget 150ms. Single warm samples spike on this VM (scheduler noise),
  so the assertion uses the median.
- Cold first call in a fresh process: 87.4ms on this run. The
  worker runs off the main thread, so a cold worker start does not
  block UI. If a CI gate measures a single cold call, it will be flaky
  on this VM; measure warm median instead.

## Static checks

- `node tools/lint-tokens.mjs`: clean for this file.
- `node tools/banned-scan.mjs src/world/layouts/sidequests.ts`: clean.
- `tsc --noEmit`: exit 0.

## B6c-fix: readout clear zone + marker visibility (2026-10-30)

Generator change (not a spec change: S07 section 3.2 already requires
only grid lanes behind the readout box, and the old generator violated
it; S07 section 3.1 marker positions are sampled, not fixed):

- Clear zone: the fine readout box measured from the live DOM at
  1440x900 (x 1012..1392, y 88..508) projected to y=0 through the spec
  fine camera (pos (6,24,16), fov 36, shift -0.18 x) via pure math
  verified against THREE's projection to 0.001px / 0.001 units. AABB +
  1-unit margin: x [5.239, 17.021], z [-19.232, -0.681] (about 40px on
  screen per margin unit). Buildings whose rect intersects the zone are
  rejected; walkway curves that enter it flip offsets, then straighten,
  then detour around a side (zone crossing is never allowed per the
  kill criterion); trail waypoints are nudged out of it and trail
  curves are re-routed until clear. Grid lanes are untouched (allowed).
  Hatch lives inside footprints, so it follows automatically.
- Marker visibility: candidates must also project (head y = poleHeight
  + radius * squashY = 1.29, from tokens) inside the 1440x900 viewport
  with a 50px margin. New head projections: (652, 391), (1349, 790),
  (240, 70). All three twins are pointer-clickable at the fine pose.
- New run-test checks (2): no non-grid lane point inside the zone
  (all 6144 lanes x 8 points verified: 0 inside); markers project
  inside the fine viewport with 50px margin.
- Coarse limitation (not gated, for the coordinator): the clear zone
  covers the FINE readout only. The coarse readout box (16,16)-(374,400)
  at 390x844 projects to a west-north ground region (x about -13.8 to
  6.3, z about -14 to -2.1) that the fine zone does not cover, and two
  of the new markers project off-screen at the coarse pose ((15,3) to
  x 669, (-12,-7) to x -88 at 390 wide). Covering both readouts would
  take a 30.8 x 13.3 union zone (40% of the plan) and would likely
  break building placement; the coarse camera/readout question belongs
  to the coordinator, not this generator fix. T-SQ-3 gates fine only.

## Contract for the coordinator (worker registration)

`export function generate(seed, out, layoutIndex)` writes the sidequests
texels into the shared layout array at `lane * 32 + layout * 8 + point`
and returns `{ markers, trails, footprints }` where each trail is
`{ laneIds, arcStarts, arcLengths }` (arc lengths in world units, for
`setActivity` at 14 units per second). Register with layout index 2.
No DOM, no three imports, no worker import (rng is defined locally,
verbatim from the engine spec, to avoid a worker/layout cycle).
Additional exports for tests: `readoutClearZone()` (the zone AABB) and
`projectToFineScreen(x, y, z)` (fine-pose projection at 1440x900).
