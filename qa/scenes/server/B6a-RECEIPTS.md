# B6a Server scene receipts (S05)

Worker: B6a. Date: 2026-10-30. Branch: astryx-build.

## Files

- `src/world/server.ts`: Server scene controller. Troika Text pool
  (wordPool from tokens), spawn on wordCadence, drift from focus,
  color hot to signal to text2 at wordColorStops, opacity 1 until
  wordFadeFrom then easePlain to 0, billboarded, anchor center,
  Commit Mono 400 `.woff`. Pause fades the pool over `--duration-fast`
  then hides; resume restarts spawning; reduced mode places three
  static words at reducedWordAt fractions. Exposes `pause`,
  `resume`, `setReducedMotion`, `dispose`, `activeWords`,
  `spawnedWords`, `isPaused` (SceneController-compatible).
- `src/scenes/server.tsx`: Server readout content component
  (C-SRV-H1/P1/P2/P3). B4's chrome Readout already inlines this
  content for the server variant; this module is the canonical
  server-scene content (see wiring request below).
- `tests/scenes/server.spec.ts`: T-SRV-1 through T-SRV-6 plus a
  G-COPY content check.

## Test results (each run individually, exit codes read directly)

- T-SRV-1 geometry hand values: PASS (lane 0 k=0 (-3.565, -2.315,
  -24), k=6 (-1.7825, -1.1575, 0.4), k=7 (-0.2852, -0.1852, 2.2),
  6144 lanes). Re-verifies B5a's generator through the same entry
  point.
- T-SRV-2 readout clear at 1440x900: PASS (max delta E under 0.01
  in the readout box plus spacing-6 padding, readout hidden).
- T-SRV-2 readout clear at 390x844: FAIL, max delta E 0.1536
  (see BLOCKED below). Reproduced in isolation, three times.
- T-SRV-3 lockstep: PASS (JS port of the S02 fire() GLSL gives
  identical values for all 32 lanes of warp 10 at three (u, t)
  samples; shipped lane.frag.glsl hashes on warp (lane >> 5) and sm
  (lane >> 7), never on the lane within a warp).
- T-SRV-4 words: PASS (12s collection against the real controller
  with a stub field; spawned set equals world.server.words exactly,
  9 of 9; count at least 9). One earlier run failed on a vite HMR
  reload from a sibling worker's concurrent save; re-run passed.
- T-SRV-5 hue budget: PASS in isolation (fraction of pixels with
  OKLCH chroma above 0.04 is at most the 30% server budget). An
  earlier run failed on "browser has been closed" mid-screenshot
  (shared-infrastructure flake, not a budget failure).
- T-SRV-6 LCP element is the H1: PASS (PerformanceObserver with
  buffered:true registered via addInitScript; last LCP entry is
  H1 "Justin Poli". Note: getEntriesByType alone returns nothing
  in headless Chromium because LCP is observer-gated.)
- G-COPY server readout matches S09 copy: PASS (rendered H1 and
  three paragraphs equal C-SRV-H1/P1/P2/P3 exactly).

## Static checks (B6a files only)

- `npx tsc --noEmit`: exit 0 for B6a files (repo-wide errors at run
  time were only in sibling B6c's sidequests.tsx, untouched).
- `node tools/lint-tokens.mjs`: clean for B6a files (repo-wide
  violations at run time were only siblings' files, untouched).
- `node tools/banned-scan.mjs src`: clean for B6a files
  (repo-wide violation at run time was only sibling B6d's
  notfound.tsx, untouched).
- Troika import uses `// @ts-ignore` (same untyped-module pattern
  as B4's laneTheme import): troika ships types under dist/types
  but no package.json types field, so TS cannot find them.

## BLOCKED: T-SRV-2 phone background (engine, B2-owned file)

At 390x844 (coarse pose), the canvas background in the readout box
region renders as pure black [0,0,0], delta E 0.1536 from void
ground #0A0C0F, failing the 0.01 bound. At 1440x900 (fine pose)
the same region renders void ground and passes. No lane pixels
intrude at either viewport (the phone maxDelta is exactly the
black-vs-void distance; a lane intrusion would read much larger),
so the coarse camera shift is correct for lanes; the defect is
the background color only.

Evidence that it is the engine, not the test:

- GL clearColor calls intercepted in the page show the engine
  sets [10,12,15,1] (void ground) last, at both viewports.
- Setting html/body background to void ground does not change
  the result (maxDelta still 0.1537), so it is not page
  background showing through a transparent canvas.
- The wordmark rect is 0x0 on the server scene, so no DOM text
  accounts for the deviation.
- Reproduced in isolation (no sibling tests running), three
  times, same value 0.1536.

The defect lives in `src/world/lanefield.ts` (clear-color path:
`setClearColor` plus `updateClearColor` with ColorManagement
conversion), which B6a does not own. Fix belongs to B2 or the
coordinator; B6a's test threshold is not lowered to accommodate
it.

## Wiring requests for the coordinator (shared files, not B6a-owned)

1. `src/App.tsx`: pass a controllers map to
   `createTravelController` including the server controller
   (`createServerController(field)`), so travel pause/resume
   drives the word pool. The controller is written and tested;
   only the wiring is missing. Until wired, the live App shows
   no words (lanes and readout work).
2. `src/chrome/Readout.tsx` (optional refactor): import
   `ServerReadoutContent` from `src/scenes/server.tsx` for the
   server variant instead of inlining the same C-SRV-* JSX.
   Both read the same copy keys, so they cannot drift on copy;
   the refactor only removes duplication.

## Notes

- Camera idle yaw and pointer parallax are owned by the
  lanefield rig (S02 camera section), not this controller; lane
  pulses are owned by the fire() shader. The controller owns
  words only, plus pause/resume/reduced hooks.
- Word pool uses the token pool size (6), not 9: S05 section 6
  allows 9 pooled meshes only "if memory allows," while the
  token fixes the pool at 6. Sync happens at spawn; with
  cadence 1100ms and duration 2600ms at most 3 words are alive
  at once, so the pool never exhausts.
- T-SRV-4 uses a stub field (plain scene/camera/onFrame/now
  objects) rather than a real lanefield because `?world=0`
  makes `createLanefield` return null and a second real
  lanefield would contend with the App's on SwiftShader. The
  controller logic under test (spawn cadence, strings, drift,
  color, opacity, pause/resume) does not need WebGL. A live-App
  word test becomes possible once request 1 above lands.
