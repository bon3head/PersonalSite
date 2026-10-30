# B6c SideQuests scene receipts

Card: B6c SideQuests scene (S07). Status: DONE (B6c-fix resolved the
one blocked item; see B6c-fix below). All 6 spec tests pass.

## B6c-fix (2026-10-30): readout clear zone + marker visibility

Fix: generator-only change in `src/world/layouts/sidequests.ts` (no
camera, readout, S04, or S07 change; no threshold lowered). The
controller regenerates side data via `generate(seed, scratch, 2)`, so
the fix flows to the harness and the live App automatically.

- Clear zone: fine readout box measured from the live DOM at 1440x900
  (x 1012..1392, y 88..508) projected to y=0 through the spec fine
  camera (pos (6,24,16), fov 36, shift -0.18 x) with pure math verified
  against THREE to 0.001px / 0.001 units. Zone AABB + 1-unit margin:
  x [5.239, 17.021], z [-19.232, -0.681]. Buildings intersecting it are
  rejected; walkways flip/straighten/detour around it; trail waypoints
  are nudged out and trail curves re-routed until clear. Verified: 0
  non-grid lane points (of 6144 x 8) inside the zone.
- New markers: (1,-1), (15,3), (-12,-7). Head projections at fine:
  (652, 391), (1349, 790), (240, 70) — all inside 1440x900 with 50px
  margin, so all three twins are pointer-clickable. Old marker 2
  (16,10) projected to (1392, 1259); the new set has no off-screen twin
  at the fine pose.
- New layout hash:
  `9677011ce9145b335d14119b28133090440475ea8b63a9f2efe9ff5934e00aa3`
  (was `5fe3fe09c6e02217a6b0848afd89f085651e20e80079004335251f4dc0b32e18`).
  Counts: grid 2080, outlines 361, walkways 140, trails 140, hatch
  3423, total 6144, buildings 11. Run-test: 21/21 (19 original + 2 new:
  zone exclusion, marker visibility).
- Test results (full file, Playwright-owned webServer, exit 0, 5.6m):
  - T-SQ-2 walk feedback: PASS (1.6m).
  - T-SQ-4 spring numbers (mock): PASS (1.9s). Trail 0 length 11.83
    (was 14.40), claimStart 0.850, minDrop -0.0276, settleErr 0.0000.
  - T-SQ-5 keyboard: PASS (40.8s).
  - T-SQ-3 readout contrast: PASS (53.6s). H1 7.49, P1 7.39, FACTS
    4.85, VENUE 5.17, HINT 5.00 (was 7.52, 2.37, 1.24, 1.48, 1.24).
    Max background luminance now 0.067-0.076 (field + faint grid)
    instead of up to 0.842 (chalk lanes).
  - T-SQ-6 hue budget: PASS (2.1m). Signal fraction 0.0013 (was
    0.0006), far under 0.06. (Kept keyboard lighting; the stale
    off-screen-marker comment in the test was corrected.)
  - Reduced-motion extra: PASS (13.0s).
- Coarse limitation (not gated, for the coordinator): the zone covers
  the FINE readout only. The coarse readout box (16,16)-(374,400) at
  390x844 projects to a west-north ground region the fine zone does
  not cover, and markers (15,3) and (-12,-7) project off-screen at the
  coarse pose (x 669 and x -88 at 390 wide). A union zone would cover
  40% of the plan and likely break placement; the coarse camera/readout
  question belongs to the coordinator. T-SQ-3 gates fine only.
- Repo checks: `npx tsc --noEmit` exit 0. `node tools/lint-tokens.mjs`
  clean. `node tools/banned-scan.mjs` clean for B6c-fix files.

## Files

- `src/world/sidequests.ts`: SideQuests controller
  (createSideQuestsController). Markers (head/pole InstancedMeshes, 2 draw
  calls), walk/claim/hover/rise/sink state machine, camera lean, twins
  projection via `lanefield.worldToScreen`.
- `src/scenes/sidequests.tsx`: SideQuestsTwins (3 Astryx ghost icon-only
  buttons, 44x44, transparent, aria-pressed from claimed state).
- `tests/scenes/sidequests.spec.ts`: T-SQ-2/3/4/5/6 + reduced-motion extra.
- `tests/scenes/sidequests-harness.html`: real + mock harness page
  (real lanefield on `?world` default, mock field on `?mock=1`).

## Design decisions (recorded, not re-litigated)

- Side data regeneration: the controller calls the pure layout module's
  `generate(seed, scratch, 2)` at creation. Deterministic, identical to
  the worker's side data. This avoids touching B2-owned `lanefield.ts`
  (which receives worker side data but discards it) and coordinator-owned
  `worker.ts`. It also gives trail-point lookup from layout texels.
- Head rest y = poleHeight + radius * squashY = 0.8 + 0.49 = 1.29
  (head bottom exactly at pole top). T-SQ-4 measures relative to rest,
  so this interpretation does not affect the gate.
- Claimed head colors with exactly 2 draw calls: one head InstancedMesh
  with per-face vertex colors plus an instanced `aClaim` attribute and
  an onBeforeCompile mix toward signal (upper faces) / signalDim (lower
  faces). Instance-color multiplication cannot produce both exact tones
  from one multiplier (verified arithmetically), so the shader mix is
  required. Color transition uses easePlain over `T.motion.ms.fast`,
  never a spring (K-SQ-2). Spring is used only for marker y.
- Camera lean: lean target = base target + 0.25 * (drawing point - base
  target), damped with halfLifeMs 400 via `damp()`; applied in onFrame
  after rig.update, with `camera.updateMatrixWorld()` so twin projection
  uses the followed view. When converged within 0.01 world units, stops
  applying lookAt so the rig resumes full control (including parallax).
- Walk/claim: walk(i) ignores already-walking markers; claimed re-walk
  clears kind-2 activity and re-lights every other stored active trail
  from its original absolute start arrays, then lights the restarted
  trail fresh. Reduced walk: all starts = now, all uPerSec = 1,000,000,
  immediate claim. Claim detected in onFrame when
  t >= walkStart + walkLength / 14.
- Rise/sink: rest * rise-spring (staggered 80ms, starts on resume) +
  bob (0 when reduced) + hover lift (spring toward 0/0.15, ignored when
  reduced) + claim drop. Sink on pause: y scales by (1 - easeSignature)
  over travel 700ms, then suspended + meshes hidden. Controller starts
  suspended + invisible; explicit `resume()` required.
- Twins: labels from C-SQ-MARKER split on commas, backticks stripped.
  Per-frame transform set imperatively via refs (never in the style
  prop, so React never clobbers it). No onFocus/onBlur hover handlers:
  hover lift is fine-pointer only per S07; focus ring is the keyboard
  feedback.

## Test results (full file, Playwright-owned webServer)

Command: `npx playwright test tests/scenes/sidequests.spec.ts`
Result: 5 passed, 1 failed, exit 1 (5.1m, 2026-10-30).

- T-SQ-2 walk feedback: PASS (1.6m). 3 twins, each box 44x44 (+/-1px).
  Click twin 1: recorded setActivity kind 2, lanes exactly trail 0
  laneIds, starts[0] <= now(), starts[j] = starts[0] + arcStarts[j]/14
  (0.05s tol), uper[j] = 14/arcLengths[j] (0.1% tol). aria-pressed true.
- T-SQ-4 spring numbers (mock): PASS (1.4s). Trail 0 length 14.40,
  claimStart 1.033s, minDrop -0.0276 (gate [-0.035, -0.020]),
  settleErr 0.0000 (gate <= 0.005). Bob-corrected (headY - headBobY).
- T-SQ-5 keyboard: PASS (39.4s). Tab Tab focuses "Trail 2"; Enter
  lights trail 1 kind 2; aria-pressed true.
- T-SQ-6 hue budget: PASS (1.3m). All three trails lit via keyboard
  (see note below), all claimed. Signal pixels (OKLab distance < 0.08
  from #7BB5F8): 801 / 1,296,000 = 0.0006, far under the 6% budget.
- Reduced-motion extra: PASS (19.9s). Click twin 1: kind 2, all starts
  equal, all uper >= 100000, aria-pressed true within 5s.
- T-SQ-3 readout contrast: FAIL (1.0m). See BLOCKED.

## T-SQ-3 failure data (1440x900, /sidequests, readout hidden)

Per-line contrast (text color vs lightest pixel behind its box):

- "SideQuests" (chalk #F5F1E9): maxBgLum 0.074, contrast 7.52. PASS.
- P1 (chalk): maxBgLum 0.343, contrast 2.37. FAIL. Brightest pixel
  (152,160,170): a trail/walkway lane behind the paragraph.
- FACTS (chalk2 #B6C6D7): maxBgLum 0.700, contrast 1.24. FAIL.
  Brightest pixel (218,218,215): a building outline behind the line.
- VENUE (chalk2): maxBgLum 0.842, contrast 1.48. FAIL. Brightest
  pixel (240,236,230): near-pure chalk lane behind the line.
- HINT (chalk2): maxBgLum 0.694, contrast 1.24. FAIL.

Readout box on the real route: x 1024-1380, y 100 to ~470
(S04 section 6 placement, B4-built). S07 section 3.1 (plan generator)
contains no rule keeping that screen footprint's ground region clear
of buildings, walkways, or trails, while S07 section 3.2 demands only
grid lanes behind the readout box. The rule is unsatisfiable by
construction with the current layout + camera + readout placement.
No B6c-owned file can fix it: the layout is B5c's generator, the
camera is tokens/DESIGN, the readout position is S04/B4.

## Marker 2 off-screen at the fine pose (product finding, not a gate fail)

Engine projection at the spec fine pose (pos ~(6,24,16), fov 36,
shift [-0.18, 0], viewport 1440x900, via `lanefield.worldToScreen`):

- Marker 1 (-13,-4) -> (144, 135). On screen.
- Marker 2 (16,10) -> (1392, 1259). 359px BELOW the 900px viewport.
- Marker 3 (9,-12) -> (1122, 145). On screen.
- Ground band at x=16: z=5 projects to y=954 (just off bottom), so
  the visible band at x=16 ends near z=4. Marker 2 at z=10 is well
  inside the cropped near region. This holds at any desktop aspect
  (vertical fov is aspect-independent).

Consequence: no pointer click can reach twin 2 on a fine viewport.
T-SQ-6 therefore lights trails by keyboard (Tab/Enter x3), which is a
first-class interaction per T-SQ-5 and satisfies T-SQ-6's gate ("all
trails lit", pixel budget). Twin 2 still exists and is focusable, so
K-SQ-4 (twins missing or unfocusable) is not triggered, but a pointer
user cannot walk trail 2. Fix options (coordinator decision, all
outside B6c files): constrain the layout generator to keep markers in
the camera-visible band, or change the fine camera (pull back / raise /
widen fov), or accept keyboard-only for trail 2 on fine viewports.

## Repo checks

- `npx tsc --noEmit`: exit 0.
- `node tools/lint-tokens.mjs`: clean.
- `node tools/banned-scan.mjs` on B6c files: clean. (Repo-wide run
  flags `src/scenes/notfound.tsx` (B6d file, banned pattern `\blive\b`),
  untouched.)
- G-COPY for /sidequests: no copy added by B6c files (every string
  comes from `src/copy.ts`; twins use C-SQ-MARKER labels). The route
  readout content is B4's Readout (S09 strings). Full G-COPY gate
  (T-COPY manual click) belongs to the Wave 3 gate run.

## Test lessons (for the coordinator / future scene workers)

- `locator.click` and `locator.boundingBox` stall on the bobbing twins:
  their wait includes a stability condition a perpetually moving target
  never satisfies. Tests use `clickTwin` (live box read + coordinate
  mouse click, same trusted input) or keyboard. Bounding-box reads also
  stalled intermittently under CPU starvation; see next point.
- Stale SwiftShader browsers starve the box: two leaked
  chrome-headless-shell sets drove load to ~8.5 and hung CDP round
  trips for full 180s timeouts. Kill strays before a scene run.
- Do not run a second vite on 5173: a hand-started vite flaps against
  Playwright's webServer (reuseExistingServer) and produces
  ERR_CONNECTION_REFUSED mid-run. Let Playwright own the server.
- SwiftShader frame time dominates: claim waits need the 120-150s
  timeouts; T-SQ-6 must wait for all three claims in ONE waitForFunction
  (three sequential 150s waits exceed the 180s test timeout).

## BLOCKED (resolved by B6c-fix above)

- Was BLOCKED: T-SQ-3 readability rule unsatisfiable (S07 sections
  3.1/3.2). Resolution: generator clear zone (option (a) from the
  original question). No camera, readout, S04, or S07 change; no
  threshold lowered. The old marker-2 off-screen finding is likewise
  resolved by the marker visibility constraint.

## Wiring request (coordinator, App.tsx, same pattern as B6a)

- Pass a controllers map to the travel controller including
  createSideQuestsController(field), so travel pause/resume drives the
  markers (rise/sink, trail persistence). Until wired, the live App
  shows no markers and no twins.
- Render SideQuestsTwins (from `src/scenes/sidequests.tsx`) when the
  scene is sidequests, alongside the existing Readout. The readout
  content itself is already built by B4; this card's scene file is the
  twins component, not readout content.
