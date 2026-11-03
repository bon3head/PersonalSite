# Polish round 2 receipts (DESIGN 1.2.0)

Produced 2026-11-02 against the repo pack at c64193d plus the polish patch.
Numbers are in receipts.json; this file says how they were made.

## How the traces run

- `trace-morph.cjs <path> <key> <label> <vw> <vh>` and
  `trace-interact.cjs <path> <action> <vw> <vh> <durMs>` drive the dev
  server (vite on 127.0.0.1:5173) with Playwright's fake clock
  (`page.clock.install`, `page.clock.pauseAt` after load, then
  `runFor(16)` per sample), so every sample sits at a known travel time
  and two runs with the same seed and input are frame-for-frame
  comparable. They use the machine's Playwright (NODE_PATH set to the
  global root), not the repo pin.
- Clock note (found by T-ENT-REPLAY): the receipts below were taken
  before `pauseAt` was added. `clock.install` alone keeps page time
  flowing with wall time, so a sampled step was sometimes 32ms instead
  of 16ms. Geometry (px distances, strengths, pitch, pan) is exact;
  times (ms stamps, the loom frame count) are good to about one frame.
- Viewport 390x658 is Justin's device-run-2 in-app browser (screenshots
  are 922 px wide at 2.364 px per CSS px; the web view spans about 658
  CSS px between the toolbars).
- Headless Chromium with SwiftShader WebGL. Geometry, DOM rects, uniform
  values, and camera pose are exact; frame times are not device frame
  times (G-PERF-DEVICE stays a device-run measurement).
- Brand images were stand-ins at the manifest's exact dimensions (Codeberg
  is not reachable from the planning container). Placement and ring
  geometry depend only on dimensions; T-ASSET-* were not rerun here.
- REDUCED=1 emulates prefers-reduced-motion.

## What each number shows

| Receipt | Before | After |
|---|---|---|
| LeafLink mark move during server to LeafLink | 172.3 px (198,326 to 262,166) | 0 px (268,164 throughout) |
| Ring center to mark center after Gather, LeafLink | 135.5 px | 0.0 px |
| Ring strength at rest after the morph | 1.268 (LeafLink), 0.932 (SideQuests) | 0 |
| Loom frames (opacity strictly between 0 and 1) | 0 (mark pops in at 1) | 13 |
| LeafLink offer button inside the 46dvh slip at 390x658 | no (571..603 vs bottom 598, after reorder only) | yes (535..567) |
| SideQuests trail 3: marker enters the clear band | never during the walk (markers under the readout or off-screen) | 1568 ms, claim 1728 ms, lands 8 px from the mark |
| SideQuests pitch during a coarse walk | -64.49 snapping to the -75 band edge in one frame | -64.49 constant (pan is translation) |
| Desktop walk | lean | lean kept (-54.55 to -56.94), pan 0 |
| GLITTERBOX hold | n/a | activates at 496 ms of hold, ring under the pointer every frame |
| Reduced motion travel | jump | jump; mark opacity 1 only; ring 0 |
| Marker twin hit target | transform transition 0.15 s (lags its marker) | transition none |

## Rerun

    npx vite --host 127.0.0.1 --port 5173 --strictPort &
    NODE_PATH=$(npm root -g) node qa/polish-2/trace-morph.cjs '/?seed=42' 2 s-ll 390 658
    NODE_PATH=$(npm root -g) node qa/polish-2/trace-interact.cjs /sidequests trail2 390 658 2400
