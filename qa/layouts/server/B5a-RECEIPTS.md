# B5a Server layout receipts

## Gate results (all green)

Playwright: `npx playwright test tests/world.layouts.server.spec.ts --reporter=list`

```
Running 6 tests using 1 worker

  ✓  1 T-SRV-1: lanes 0, 127, 128, 6143 at k=0 match hand values (459ms)
  ✓  2 T-SRV-1: converge points k=6, k=7 for lane 0 mix toward focus (150ms)
  ✓  3 server layout: exactly 6144 lanes of 8 points, all finite, all class 0 (506ms)
  ✓  4 server layout: deterministic across runs and seeds (pure grid arithmetic) (16.8s)
  ✓  5 server layout: generation under 150ms in Node (8ms)
  ✓  6 server layout: writes only its own layout slice (15ms)

  6 passed (35.8s)
```

## Deterministic hash

Full layout texture buffer (256x768 RGBA32F) with only the server slice
(layout index 0) written, seed `T.world.seed` (20271201):

```
sha256: f1d87a0bcab18ae8cf80130ddbd862bb5ed96b4ba800f75fd078dad7b631c698
rerun identical: true
```

Computed by importing the generator in Node (type stripping) and hashing
the Float32Array bytes. The layout is pure grid arithmetic, so the hash is
seed independent; the rerun check confirms byte identical output.

## Timing

Steady state generation: 8ms in the Playwright timing test (limit 150ms).
First run under Node type stripping measured 56.9ms including JIT warmup.

## Static checks

- `npx tsc --noEmit`: exit 0 (no errors in this card's files).
- `node tools/lint-tokens.mjs`: no flags on `src/world/layouts/server.ts`.
- `node tools/banned-scan.mjs src`: clean.

## Contract notes for the coordinator (worker registration)

- Signature: `export function generate(seed: number, out: Float32Array, layoutIndex: number): void`.
- `out` is the full layout texture buffer; the generator writes only its own
  layout slice at texel `lane * 32 + layout * 8 + point`, RGB = position,
  A = class id (0 for all points; class 1 reserved, unused in v1).
- The generator consumes no randomness (S05 formula is pure grid arithmetic),
  so `seed` is accepted and ignored; the worker may pass any seed.
- To register: replace `genServerTest` in `src/world/worker.ts` GENERATORS
  with a wrapper calling `generate(seed, out, lay)` and returning
  `T.world.laneCount * T.world.pointsPerLane` texels written.
