# S05 Scene: the inference server (home, `/`)

Version 1.0.1, 2026-10-30. Depends on: S02, S03, S04, S09, DESIGN `world.server`, `world.camera.server`. Blocks: S10 poster, S11 scene gates.

## 1. Purpose

The hero identity. A visitor lands inside a rendering of Justin's local LLM inference server: the RTX 3070 Ti's 6,144 CUDA cores drawn as 6,144 lanes of light, firing 32 at a time in lockstep, converging to one output point where the words of the stack come out hot and cool as they drift away. The readout says, in his voice, what the machine is and who runs it. The visitor should understand in five seconds that this person runs real inference on hardware he owns.

## 2. Visual identity (what makes it this scene and no other)

- Ground: void `#0A0C0F`. Lanes: signal blue at 8% alpha, 1 CSS px, fading with view depth from 7 to 30 units so the far end dissolves into the void. Density builds the brightness: where bundles overlap the field reads bright, where they part you see single lanes. Pulses: signal-hot cores.
- Geometry: long, straight, parallel lanes receding into depth, organized into 48 visible bundles (the SMs), each bundle a 2 by 2 of partitions, each partition 32 lanes. In the last stretch the lanes bend inward into a horn and meet at one focus.
- Motion: lockstep. Pulses run in straight lines at constant speed with linear time. Groups of 32 fire together. A slow sweep raises activity across the SM columns every 6s, like load moving across the die.
- Text in the scene: real stack words (DESIGN `world.server.words`) emerge at the focus, drift toward the viewer, cool from hot to signal to secondary, and vanish.
- Not a circuit board: no right-angle turns, no pads, no labels like U1 or SM0, no green, no copper. Not a dashboard: no numbers, no gauges, no "status".

## 3. Layout

### 3.1 Lane generator (`src/world/layouts/server.ts`, runs in the worker)

For lane `i` in `0..6143`:
```
sm = floor(i / 128);  part = floor((i % 128) / 32);  ln = i % 32
smCol = sm % 8;  smRow = floor(sm / 8)                     // 8 cols, 6 rows
pCol = part % 2; pRow = floor(part / 2)                    // 2 x 2
lCol = ln % 8;   lRow = floor(ln / 8)                      // 8 x 4
x = (smCol - 3.5) * 0.95 + (pCol - 0.5) * 0.27 + (lCol - 3.5) * 0.03
y = (smRow - 2.5) * 0.85 + (pRow - 0.5) * 0.23 + (lRow - 1.5) * 0.05
```
(all constants from `world.server`; listed here so the formula can be checked by hand).

Points `k = 0..5`: `(x, y, z0 + k * (z1 - z0) / 5)` with `[z0, z1] = zStraight = [-24, -2]`, class 0.
Point `k = 6`: `mix((x, y), focus.xy, convergeMix[0])` at `z = convergeZ[0]`, class 0.
Point `k = 7`: `mix((x, y), focus.xy, convergeMix[1])` at `z = convergeZ[1]`, class 0.
(The class is per lane, so all 8 points carry class 0; class 1 is reserved for a future converge-only style and unused in v1.)

Check by hand: lane 0 starts at `x = -3.5*0.95 - 0.5*0.27 - 3.5*0.03 = -3.565`, `y = -2.5*0.85 - 0.5*0.23 - 1.5*0.05 = -2.315`, `z = -24`.

### 3.2 Camera and framing

Pose `world.camera.server.fine`: camera at `(-7, 2.4, 8)` looking at `(0.5, 0, -3)`, fov 42, principal shift `+0.44` NDC in x. The lanes enter from the left middle of the frame, far ends dissolved by fog, and run right and toward the viewer into the horn, which sits near the right edge; the left third is void for the readout. Coarse: `(-3.5, 3, 12)` looking at `(0.3, 0, -3)`, fov 58, shift `-0.40` in y: the field fills the lower half, the readout owns the top.

These poses come from verification renders of the S02 shaders on 2026-10-30 (desktop 1440 by 900 and phone 390 by 844). The desktop shift is a starting value: the far ends of the lanes can still reach into a wide readout, so T-SRV-2 decides the final shift, and the change goes into DESIGN, not code.

**Readability guarantee:** at both poses, no lane pixel may be drawn inside the readout's bounding box plus `--spacing-6` padding. Verified by T-SRV-2. If a lane crosses it at some aspect ratio, adjust the shift value in DESIGN (not in code) and re-run.

### 3.3 Readout (variant `server`)

C-SRV-H1 (display-0, weight 200), C-SRV-P1, C-SRV-P2, C-SRV-P3. No links on this readout; the keymap carries navigation and the whoami sheet carries profile links. The world region `aria-label` is C-SRV-ALT.

## 4. Motion

| Phase | What | Duration, easing, trigger |
|---|---|---|
| Entry (first load) | DOM readout is in the prerendered HTML and visible at first paint. The canvas fades from opacity 0 to 1 when `ready` resolves. No intro sequence, no boot animation. | `--duration-medium`, ease, on `ready` |
| Entry (travel in) | Lanes re-form into the server layout, camera settles at the server pose (S03). | 700ms, expo-out |
| Idle: pulses | Fragment `fire()` (S02 5.2): warp period hashed in `[3, 7]s`, duty 0.6, head speed 0.55 lane lengths per second, sigma 0.05, SM-column sweep every 6s. | Linear time, always on |
| Idle: words | Every `wordCadence` (1100ms) the next word in `world.server.words` (cycling) spawns at `focus + (0, 0, 0.2)` from a pool of 6 troika `Text` meshes. Over `--jp-duration-word` (2600ms): position moves by `wordDrift (-1.0, 0.5, 1.0)`, toward the camera and into the frame (y sign alternates per word), color goes signalHot at 0%, signal at 40%, void.text2 at 100%; opacity 1 until 55%, then `easePlain` to 0. Font size `wordSize` 0.32 world units, Commit Mono 400 `.woff`, billboarded (copy camera quaternion each frame), anchor center. | Linear position, eased opacity |
| Idle: camera | Yaw `±3 deg` around target over 20s sine; pointer parallax up to 1.5 deg (fine pointer). | Damped, half-life 180ms |
| Interaction | None beyond parallax. The scene does not respond to clicks; it is a machine running, not a toy. | n/a |
| Exit | Controller pauses words (pool hidden at t = 0 of travel, opacity tween to 0 over `--duration-fast`). Pulses fade with `uW.x`. | 150ms ease |
| Reduced motion | `uFrozen = 1` (pulses at their t = 0 phases, which still shows lit warps), three words placed at rest at 20%, 50%, 80% of their drift path with their color at those points, camera static. | Static |

## 5. Content

S09 IDs: C-TITLE-SERVER, C-SRV-H1, C-SRV-P1, C-SRV-P2, C-SRV-P3, C-SRV-ALT. In-scene words are `world.server.words`, each of which also appears in C-SRV-P2 (or is the location from the brief), so the scene never says anything the text does not.

## 6. Components

| Thing | Start from | Notes |
|---|---|---|
| Lanes | S02 Lanefield | layout `server` |
| Words | `troika-three-text` `Text` | pool of 6, `sync()` once at init per word string (pre-sync all 9 strings into 9 pooled meshes if memory allows; then no `sync()` at runtime) |
| Readout | S04 `Readout variant="server"` | |

## 7. Kill criteria

- K-SRV-1: any number, gauge, percentage, model name, "online", "live", or status shown in DOM or scene.
- K-SRV-2: any lane pixel inside the readout box (contrast violation by construction).
- K-SRV-3: the scene reads as a circuit board or as a "matrix rain" screensaver to a blind reviewer (S11 G-ANTI asks this question verbatim).
- K-SRV-4: words appear that are not in `world.server.words`.
- K-SRV-5: pulses in a warp are not in lockstep (any of the 32 lanes of a warp out of phase).
- K-SRV-6: frame p95 above 16.7ms on the reference phone (S11 G-PERF-DEVICE).

## 8. Receipts

| Test | Claim | How |
|---|---|---|
| T-SRV-1 | Geometry matches the formula | read the layout buffer for lanes 0, 127, 128, 6143 at k = 0 and compare to hand values (lane 0: `(-3.565, -2.315, -24)` within 1e-4) |
| T-SRV-2 | Readout is clear | screenshot at 1440 by 900 and 390 by 844 after 3s idle; inside the readout box plus padding, every pixel that is not text is within ΔE_ok 0.01 of void ground (render once with readout hidden and compare) |
| T-SRV-3 | Lockstep | in a debug render (`?debug=fire`), sample the fire value for all lanes of warp 10 at one frame: identical |
| T-SRV-4 | Words | collect troika text strings over 12s: the set equals `world.server.words` |
| T-SRV-5 | Hue budget | G-HUE: at most 30% of pixels have OKLCH chroma above 0.04 (`hueBudgetPct.server`) |
| T-SRV-6 | First paint has the name | Lighthouse: LCP element is the H1 `Justin Poli` |

## 9. Unknowns

U-SRV-1 (R-GPU): the 48 SM by 128 core structure is NVIDIA's public GA104 spec for the RTX 3070 Ti (6,144 CUDA cores). Justin accepted it on 2026-10-30 without a source check (UNKNOWNS R-GPU), so it does not block ship; anyone may still verify it against NVIDIA's spec page or a review (for example PC Perspective's Founders Edition review, pcper.com, June 2021) and record the URL in UNKNOWNS.md before launch. Which models Ollama serves: UNKNOWN, never shown.

## 10. Changelog

- 1.0.0, 2026-10-30: initial.
- 1.0.1, 2026-10-30: R-GPU accepted by Justin.
