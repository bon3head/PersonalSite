# B2 Engine core receipts

Engine: `src/world/lanefield.ts` plus `camera.ts`, `governor.ts`,
`debug.ts`, `tween.ts`, `worker.ts`, `shaders/lane.vert.glsl`,
`shaders/lane.frag.glsl`. Test layouts only; real generators land in
Wave 2. Harness: `tests/world-harness.html` (vite dev port 5222).

## Final suite output (Chromium, SwiftShader WebGL2)

```
Running 10 tests using 1 worker
  PASS T-S02-1: 6,144 lanes, one draw call (34.9s)
  PASS T-S02-1b: one draw call with ?debug=lanesOnly (24.4s)
  PASS T-S02-2: layoutHash identical across two fresh loads (Chromium) (1.0m)
  PASS T-S02-3: weights sum to 1 at every frame of a travel (50.3s)
  PASS T-S02-5: principal shift moves the image by shift/2 of viewport width (43.3s)
  PASS T-S02-6: no shader compile after ready across 3 travels (2.0m)
  PASS T-S02-7: context loss recovers with layoutHash unchanged (1.5m)
  SKIP T-S02-8: no longtask during startup (SwiftShader; gate is G-PERF-DEVICE)
  PASS tween: easeSignature(0.3) between 0.80 and 0.86
  PASS tween: spring(0.7, 3.2) peaks 1.040 to 1.052, within 0.01 of 1 after 0.6s
  1 skipped, 9 passed (7.1m)
```

Layout hash (SHA-256 of the layout Float32Array, identical across two
fresh loads):
`3b87e7043d19b4d025a963f0cbb1a3cc93c21b237591072eb075a2be90acd8f9`

Probe (1280x720, server fine pose): camera target projects to exactly
(921.6, 360) = (0.72 x width, 0.5 x height); focus projects to x
fraction 0.909 and 0.939 across runs (idle yaw phase varies).

## Gate status

- T-S02-1 PASS: `__lanefield.laneCount === 6144`,
  `info().calls === 1`, with and without `?debug=lanesOnly`.
- T-S02-2 PASS on Chromium (hash above, two fresh loads). WebKit half
  NOT run here (no WebKit browser in this environment); recorded as
  untested, not passed.
- T-S02-3 PASS: every recorded weight sum within 1e-4 of 1 during a
  server to leaflink travel; final weights one-hot leaflink. Note:
  SwiftShader frames take seconds, so a 700ms travel completes within
  one frame and yields few samples; sum preservation is exact by
  construction (lerp between two one-hot vectors). Dense per-rAF
  sampling is a real-device property, re-checked at G-PERF-DEVICE.
- T-S02-4 PASS: tween unit tests (easeSignature and spring bounds).
- T-S02-5 MECHANISM PASS, SPEC EXPECTATION CONTRADICTED (see below).
  Target projection is exactly (1 + shiftX)/2 of width, proving the
  shift moves the image by shift/2 of viewport width.
- T-S02-6 PASS: `info().programs` unchanged across 3 full travels
  (leaflink, sidequests, scatter). Uses the `programs` field extension
  (see below).
- T-S02-7 PASS: WEBGL_lose_context lose/restore; layoutHash unchanged;
  one draw call after restore; zero console.error.
- T-S02-8 SKIPPED in this environment (see below). Not passed.

## BLOCKED: T-S02-5 spec expectation is geometrically inconsistent

The spec says: on the server fine pose, `worldToScreen(focus)` x within
2% of `0.5 + shift/2` of viewport width (formula 72%, parenthetical
66%). Focus (0,0,2.2) is not on the view axis, so neither value can
hold. Hand computation from the token pose (pos (-7,2.4,8), target
(0.5,0,-3), fov 42, shift (0.44,0), 16:9): view-space focus
(2.52,-0.81,-9.02); unshifted NDC x 0.4085 = 70.4% of width; shifted
(+0.44) = 92.4% of width; idle yaw adds up to 3.8 points. Measured
focus x fraction: 0.909 and 0.939 across runs, inside the predicted
[0.886, 0.962] band. The camera mechanism (section 8) is implemented
exactly and verified by the target projection. Fix is a one-line spec
change: either a centered test point or a shift-delta check. Do not
guess a different expected value.

## Bug found and fixed during testing: camera aspect init

`camera.aspect` was constructed as 1 and only corrected on resize; no
resize fires on first load, so first-load projection used a square
aspect. Symptom: focus projected to 1.101 of width before the fix
(off-screen right), 0.909 and 0.939 after. Fix: set
`camera.aspect = cssW / cssH` at init before the first `applyPose`.
Locked by the focus-band assertion in T-S02-5 (0.87 to 0.98).

## T-S02-8 skipped: SwiftShader makes the bound unmeasurable here

Measured longtasks during startup in this VM: 104ms, 69ms, and a
14,208ms first-render task; steady SwiftShader frames run 6.6s (p50)
to 14.2s (p90). Every software frame is a longtask by construction, so
the 50ms bound cannot hold under SwiftShader. The startup-off-thread
property itself is proven by construction and by T-S02-2 (layouts
arrive from the worker; the hash is computed from worker output).
The bound is re-checked on real hardware via G-PERF-DEVICE
(`?perf=1` on iPhone), per the standing rule that SwiftShader is for
correctness only.

## Spec-conformant extensions and interpretations

- `info()` gains a `programs` field (all specified fields still
  present). T-S02-6 requires checking `renderer.info.programs.length`,
  which the section 2 debug shape does not list.
- `uFadeSec` uses `T.world.leaflink.pins.fadeMs` (600ms to 0.6s), the
  only fade duration in tokens. S06/S07 may refine this when their
  controllers land; it is a single uniform.
- `memoryEstimate()` follows the S11 section 4 formula (layout 3.0 MB
  plus activity plus instance buffers plus double-buffered drawing
  buffer, over 1024x1024); troika atlas is 0 for B2 (no troika yet).
- Clear color uses plain-ease ground weights, not the expo-out lane
  weights (S02 section 3: the dark-to-paper flip under expo-out
  flashes). At rest both are one-hot, so the clear color is exactly
  the regime ground hex.

## Tool gates

- `node tools/lint-tokens.mjs`: clean.
- `node tools/banned-scan.mjs src`: clean.
- `npx tsc --noEmit`: zero errors in `src/world/` files. Repo-wide
  tsc is red for a PRE-EXISTING reason unrelated to B2: `@types/react`
  and `@types/three` are absent from package.json, so B0's `types.ts`
  and `stub.ts` (and every three import) fail with TS7016, plus
  node_modules `@astryxdesign/core` react-type errors. Needs a
  coordinator decision (add the two @types packages); B2 does not
  touch package.json.

## Environment notes for the suite

- Per-test timeout raised to 180s in `tests/world.engine.spec.ts`
  (SwiftShader frames take seconds; assertions unchanged).
- Suite runtime 7.1 minutes, dominated by software rendering.
- No live browser was used by this worker (text fetch only); all
  browser evidence above comes from local Playwright runs.
