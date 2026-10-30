# B6b LeafLink scene receipts

Card: B6b LeafLink scene (wave 3). Files: `src/world/leaflink.ts`
(controller), `src/scenes/leaflink.tsx` (readout content),
`src/scenes/test-render.ts` (test-only React render helper),
`tests/scenes/leaflink.spec.ts`.

## Full-suite result (final, 2026-10-30)

`npx playwright test tests/scenes/leaflink.spec.ts` — **7 passed, 0
failed (9.4m)**. Full output: `qa/scenes/leaflink/full-run.txt`.

- T-LL-1: exactly 6144 lanes, connected graph (2.0s). PASS.
  Lane total from edge lane counts: 6144. Connected 1089/1089.
  1933 edges (matches B5b).
- T-LL-2: deterministic first minute (2.2s). PASS. Two fresh
  controllers, same seed, mock lanefield, manual clock (0.1s
  steps), first 20 spawn events (kind, node, scheduled relative
  time) identical. K-LL-4: no two consecutive intervals equal. PASS.
- T-LL-3: tap responds within 300ms (1.0m). PASS. Real lanefield +
  controller, tap at canvas center, route activity (kind 1) and a
  visitor pin within 300ms.
- T-LL-4: keyboard path, OfferButton Enter (4.2m). PASS. Same
  route + visitor pin check as T-LL-3 via the readout button.
- T-LL-5: legend slip contrast (2.5s). PASS. Slip background
  equals paper.raised token; paper.text and paper.text2 on
  paper.raised both >= 4.5.
- T-LL-6: no labels in scene (1.2m). PASS. Real lanefield (initial
  leaflink, one-hot by construction) + controller: no scene object
  carries a text string.
- T-LL-7: hue budget under 10 percent after 30s (2.8m). PASS.
  Hue fraction (OKLCH chroma > 0.04): **0.01028 (1.03%)** in the
  final run; 0.01438 (1.44%) in an earlier single run. Both well
  under the 10% budget.

## Static checks (2026-10-30)

- `npx tsc --noEmit`: exit 0.
- `node tools/lint-tokens.mjs`: no violations in B6b files (the
  remaining report is B6c's `src/world/sidequests.ts:385`, not mine).
- `node tools/banned-scan.mjs` on all four B6b files: clean, exit 0.
- G-COPY: all visible strings in `src/scenes/leaflink.tsx` come
  from `src/copy.ts` (10 C-* references); the only JSX text is a
  `{' '}` separator between glyph and clause. The full G-COPY gate
  runs after wave 3 per BUILD-ORDER; this card is clean by
  construction.

## Design notes

- Controller regenerates the graph from layouts/leaflink.ts with a
  scratch buffer at construction; the engine does not plumb worker
  side data, so no lanefield change was needed.
- Sim timing is interval + lanefield clock, not frame-gated, so
  spawn/match times stay wall-clock true on slow frames.
- Visitor attempts run before sim attempts in each landing batch,
  so a spawned request matches the visitor offer it was spawned for.
- Reduced motion builds a static state (first pins + matches at
  once, routes fully drawn via past starts, halos full, no
  interval, no ripples). Tap/OfferButton still work (instant match).
- Pin/halo/ripple meshes: 3 draw calls, renderOrder halos -1,
  ripples 1, pins 2 (lanes 0). Screen-space sizing in the vertex
  shader; SDF ring/dot/disc/annulus in the fragment shader.
- Camera drift is engine-side (camera.ts leaflinkDrift); the
  controller does not move the camera.
- Readout content order follows S06 section 3.3 exactly (CODE
  before the rule, LEGEND glyphs interleaved per clause, SIM,
  OfferButton). B4's Readout.tsx renders its own inline leaflink
  block in a different order with no OfferButton; B8 swaps this
  component in (request recorded in BUILD-STATE).
- Test harness notes (environmental, not gates): the dev server is
  shared across sibling workers and a run that started it kills it
  on exit, so test pages block the HMR socket (`blockHmr`) to avoid
  mid-test reloads; T-LL-4/T-LL-7 run with `?world=0` + replaceState
  so only one SwiftShader WebGL context exists (two contexts plus
  a React render OOM-closes the page); T-LL-4 has a 300s harness
  timeout and setup retry on context-destroyed errors. The 300ms
  response gates are unchanged.

## Environment note (2026-10-30)

A VM restart / /tmp purge mid-session wiped ephemeral state (manual
vite server, /tmp logs, one in-flight suite run). All durable work
lives in ~/workspace and survived; the suite was re-run to green
afterward. The manual vite server log is NOT committed.
