# B5d Receipts: Scatter layout generator

Card: B5d Scatter layout (wave 2). File: `src/world/layouts/scatter.ts`.
Contract: `export function generate(seed, out, layoutIndex): SideData`, pure,
no DOM, no three.js imports. Scatter carries no side data (returns `{}`).

## Playwright layout tests (tests/layouts/scatter.test.ts)

```
Running 5 tests using 1 worker

  ✓  1 scatter writes 6144 lanes of 8 points, all class 9 (243ms)
  ✓  2 scatter geometry: centers in sphere, lengths in range, points evenly spaced (83ms)
  ✓  3 scatter is deterministic across runs (5.6s)
  ✓  4 scatter generation is under 150ms (118ms)
  ✓  5 scatter touches only its own layout texels (97ms)

  5 passed (21.2s)
```

## Byte-identity vs B2's worker.ts genScatter

`node qa/layouts/scatter/verify-byte-identity.mjs` bundles the real
`src/world/worker.ts` with esbuild, runs it with a `self` shim, and
compares the scatter slice byte-for-byte against `generate()`.
Full receipt: `qa/layouts/scatter/byte-identity.json`.

- Seed 20271201: 0 mismatches, sha256 identical
  (`641a723e82f6846e203e8e89cd57e0c6093184c651c2d77f55fdd293dd8ba1b3`)
- Seed 20271208: 0 mismatches, sha256 identical
  (`8db1b5ccdd4b6a63d92d0e45347d65c6e92fb7bd2bd071dc9c38720bcadb5fe1`)
- Result: pass. The coordinator can register this generator in worker.ts
  without changing the layout hash.

## Static checks

- `node tools/lint-tokens.mjs`: clean (note: the lint scans comments, so
  section numbers were reworded out of comments to match B2's style).
- `node tools/banned-scan.mjs src/world/layouts tests/layouts`: clean.
- `npx tsc --noEmit`: zero errors in B5d files. The single repo error at
  run time was in B4's in-progress `src/App.tsx` (laneTheme.mjs types),
  not a B5d file.

## Note on T-404-1

The full browser T-404-1 (load `/nope`, H1 C-404-H1, weights one-hot
index 3, title C-TITLE-404) needs B4 chrome plus the B6d scene (wave 3).
These receipts cover the layout portion: lane count, class, geometry,
determinism, speed, isolation, and byte-identity with the engine's
current scatter output.
