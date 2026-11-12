# S05 Scene: the inference server (home, `/`)

Version 1.4.0, 2026-11-12. Depends on: S02, S03, S04, S09, DESIGN `world.server`, `world.camera.server`. Blocks: S10 poster, S11 scene gates.

## 1. Purpose

The hero identity. A visitor lands inside a rendering of Justin's local LLM inference server: the RTX 3070 Ti's 6,144 CUDA cores drawn as 6,144 lanes of light, firing 32 at a time in lockstep, converging to one output point where nodes leave on the lanes and cool as they drift away. The readout says, in his voice, what the machine is and who runs it. The visitor should understand in five seconds that this person runs real inference on hardware he owns.

## 2. Visual identity (what makes it this scene and no other)

- Ground: void `#0A0C0F`. Lanes: signal blue at 8% alpha, 1 CSS px, fading with view depth from 7 to 30 units so the far end dissolves into the void. Density builds the brightness: where bundles overlap the field reads bright, where they part you see single lanes. Pulses: signal-hot cores.
- Geometry: long, straight, parallel lanes receding into depth, organized into 48 visible bundles (the SMs), each bundle a 2 by 2 of partitions, each partition 32 lanes. In the last stretch the lanes bend inward into a horn and meet at one focus.
- Motion: lockstep. Pulses run in straight lines at constant speed with linear time. Groups of 32 fire together. A slow sweep raises activity across the SM columns every 6s, like load moving across the die.
- Text in the scene: none (1.4.0, DESIGN 6.15). No stack names, no words, no spray text. Seeded node groups leave the horn instead: each node is the tip of its own lane, bent out of the horn to carry it and drawn back as the group fades, so the nodes read as the machine's output on its own lines, never as floating sprites. The scene still says "this person runs real inference on hardware he owns" through the field, the readout, and the nodes, not through a tool list.
- Not a circuit board: no right-angle turns, no pads, no labels like U1 or SM0, no green, no copper. Not a dashboard: no numbers, no gauges, no "status".

**Hero is the field (W1).** The server hero is the lane-field motion itself: no brand mark, no `data-brand-mark` element, no ring, no logo on this route (descriptor: kind field, ring 0, mark none, DESIGN.md section 6.7). Project heroes morph into this field and back: on entry from a project, the logo recedes (scale 1.00 to `morph.recedeTo`, opacity to 0, window 0 to 0.40) and the ring collapses (0.20 to 0.80) while Lockstep re-forms (0.50 to 1.00). Gradient: `scene.server.gradient` (lead signal, tail field, tailLength 0.6, horizontal band light sweeping in lockstep with the lanes).

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

Pose `world.camera.server.fine`: camera at `(-7, 2.4, 8)` looking at `(0.5, 0, -3)`, fov 48, principal shift `+0.62` NDC in x. The lanes enter from the left middle of the frame, far ends dissolved by fog, and run right and toward the viewer into the horn, which sits near the right edge; the left third is void for the readout. Coarse: `(-3.5, 3, 12)` looking at `(0.3, 0, -3)`, fov 58, shift `-0.40` in y: the field fills the lower half, the readout owns the top.

These poses come from verification renders of the S02 shaders on 2026-10-30 (desktop 1440 by 900 and phone 390 by 844). The desktop shift is the DESIGN value decided by T-SRV-2 (0.62); any further change goes into DESIGN, not code.

**Readability guarantee:** at both poses, no lane pixel may be drawn inside the readout's bounding box plus `--spacing-6` padding. Verified by T-SRV-2. If a lane crosses it at some aspect ratio, adjust the shift value in DESIGN (not in code) and re-run.

### 3.3 Readout (variant `server`)

C-SRV-H1 (display-0, weight 200), C-SRV-P1, C-SRV-P2, C-SRV-P3. No links on this readout; the keymap carries navigation and the whoami sheet carries profile links. The world region `aria-label` is C-SRV-ALT.

## 4. Motion

| Phase | What | Duration, easing, trigger |
|---|---|---|
| Entry (first load) | DOM readout is in the prerendered HTML and visible at first paint. The canvas fades from opacity 0 to 1 when `ready` resolves. No intro sequence, no boot animation. | `--duration-medium`, ease, on `ready` |
| Entry (travel in) | Lanes re-form into the server layout, camera settles at the server pose (S03). | 700ms, expo-out |
| Morph out to a project | The field loosens during Release; the ring grows at the target anchor during Gather; the project mark looms in during Reveal (DESIGN.md section 6.7). No mark ever appears on server itself. | Inside travel 700ms |
| Idle: pulses | Fragment `fire()` (S02 5.2): warp period hashed in `[3, 7]s`, duty 0.6, head speed 0.55 lane lengths per second, sigma 0.05, SM-column sweep every 6s. | Linear time, always on |
| Idle: nodes (1.4.0) | Every `wordCadence` one node group spawns at `focus + (0, 0, wordSpawnOffsetZ)`, one of `nodes.pool` slots, with its own seed `hash32(sessionSeed, server-node, n)`. The seed sets the count (`nodes.count`), the offsets (inside `nodes.spreadFrac` of the drift length, at least `nodes.minGap` apart) and the color (one entry of `guestbook.mark.colorPool.dark`). Over `--jp-duration-word` the group's drift point moves by `wordDrift`, toward the camera and into the frame (y sign alternates per group); opacity 1 until `nodes.fadeFrom`, then `easePlain` to 0. Each node is a billboarded disc of radius `nodes.radius`. | Linear position, eased opacity |
| Nodes on lanes (1.4.0) | DESIGN 6.15. Each node is carried by one lane: at spawn it takes the nearest free lane by tip (3D distance to its spawn point; no lane shared with another node on screen or held by the guestbook). Each frame the lane's guestbook-style offset bends its tip to `rest tip + bend x (node point - rest tip)`, with bend = the group's opacity, and the node sits exactly on that tip. The lane takes the group's color and lifts its alpha toward the tip by the same opacity. When the group ends its lanes are at rest (bend 0) and are released. | Per frame |
| Nodes on phones | On the coarse camera variant each group is kept fully inside the viewport, inset by `--jp-gutter`: the group's billboarded box (every node offset plus the node radius) is projected and, if any edge would cross the inset viewport, the group slides back along the camera's right and up axes by the overflow. Fine (desktop) groups are not clamped. | Per frame |
| Guestbook open | While the guestbook sheet is open (DESIGN 6.14), nodes fade out over `--duration-fast` as on travel exit (their lanes relax with them) and none spawn; on close the cadence restarts. Reduced motion: the statics clear at once on open and return on close. | 150ms ease |
| Idle: camera | Yaw `±3 deg` around target over 20s sine; pointer parallax up to 1.5 deg (fine pointer). | Damped, half-life 180ms |
| Interaction | None beyond parallax. The scene does not respond to clicks; it is a machine running, not a toy. | n/a |
| Exit | Controller pauses nodes (opacity tween to 0 over `--duration-fast` from t = 0 of travel, lanes relaxing with it, then every node lane is released). Pulses fade with `uW.x`. | 150ms ease |
| Reduced motion | `uFrozen = 1` (pulses at their t = 0 phases, which still shows lit warps), three node groups placed at rest at `nodes.reducedAt` (20%, 50%, 80%) of their drift path with their color, opacity and lane bend at those points (each node on its bent lane tip), camera static. | Static |

## 5. Content

S09 IDs: C-TITLE-SERVER, C-SRV-H1, C-SRV-P1, C-SRV-P2, C-SRV-P3, C-SRV-ALT. The scene itself carries no text (1.4.0): no stack names, no words.

## 6. Components

| Thing | Start from | Notes |
|---|---|---|
| Lanes | S02 Lanefield | layout `server` |
| Nodes | three.js `Mesh` with one shared `CircleGeometry` (`nodes.radius`, `nodes.segments`), one per node | `nodes.pool` slots, each holding the top of `nodes.count` meshes; one `MeshBasicMaterial` per slot (the group's color and opacity) |
| Node lanes | S02 Lanefield guestbook offset texture | texel alpha 2 + slot marks a node lane; one `vec4` tint per slot (`uWordTint`, sized by `nodes.pool` through a shader define) |
| Readout | S04 `Readout variant="server"` | |

## 7. Kill criteria

- K-SRV-1: any number, gauge, percentage, model name, "online", "live", or status shown in DOM or scene.
- K-SRV-2: any lane pixel inside the readout box (contrast violation by construction).
- K-SRV-3: the scene reads as a circuit board or as a "matrix rain" screensaver to a blind reviewer (S11 G-ANTI asks this question verbatim).
- K-SRV-4: any word, stack name or other text drawn in the scene (1.4.0).
- K-SRV-7: a node that is not on its lane tip, or a lane that jumps when its group ends.
- K-SRV-5: pulses in a warp are not in lockstep (any of the 32 lanes of a warp out of phase).
- K-SRV-6: frame p95 above 16.7ms on the reference phone (S11 G-PERF-DEVICE).

## 8. Receipts

| Test | Claim | How |
|---|---|---|
| T-SRV-1 | Geometry matches the formula | read the layout buffer for lanes 0, 127, 128, 6143 at k = 0 and compare to hand values (lane 0: `(-3.565, -2.315, -24)` within 1e-4) |
| T-SRV-2 | Readout is clear | screenshot at 1440 by 900 and 390 by 844 after 3s idle; inside the readout box plus padding, every pixel that is not text is within ΔE_ok 0.01 of void ground (render once with readout hidden and compare) |
| T-SRV-3 | Lockstep | in a debug render (`?debug=fire`), sample the fire value for all lanes of warp 10 at one frame: identical |
| T-SRV-4 | Nodes, no words (1.4.0) | over 16s in the real app: groups spawn, every group's count is inside `nodes.count`, no two nodes of a group closer than `nodes.minGap`, two groups with different seeds differ (count, offsets or color), the color is a `colorPool.dark` entry and the same seed gives the same group; the scene holds no text mesh, and none of the 1.3.0 stack names appears in `dist/` scene code |
| T-SRV-7 | Nodes on lanes (1.4.0) | in the real app on server: every visible node sits on its lane's bent tip (within 1e-3 world units), every lit node holds a distinct lane, the guestbook texture carries a node texel for each, and after the nodes are hidden and the fade ends no node texel remains |
| T-SRV-5 | Hue budget | G-HUE: at most 30% of pixels have OKLCH chroma above 0.04 (`hueBudgetPct.server`) |
| T-SRV-6 | First paint has the name | Lighthouse: LCP element is the H1 `Justin Poli` |

## 9. Unknowns

U-SRV-1 (R-GPU): the 48 SM by 128 core structure is NVIDIA's public GA104 spec for the RTX 3070 Ti (6,144 CUDA cores). Justin accepted it on 2026-10-30 without a source check (UNKNOWNS R-GPU), so it does not block ship; anyone may still verify it against NVIDIA's spec page or a review (for example PC Perspective's Founders Edition review, pcper.com, June 2021) and record the URL in UNKNOWNS.md before launch. Which models Ollama serves: UNKNOWN, never shown.

## 10. Changelog

- 1.4.0, 2026-11-12: nodes only (Justin's Nov 12 critique, item 3; DESIGN 1.8.0 section 6.15). The stack words are removed from the scene entirely, which reverses the 1.3.0 pick; seeded node groups ride the lane tips instead, with a color from the guestbook mark pool. Word rows become node rows; K-SRV-4, K-SRV-7, T-SRV-4 and T-SRV-7 are rewritten for nodes. Readout copy (C-SRV-P1 to P3) unchanged.
- 1.3.0, 2026-11-10: words are formed from lanes (Justin's pick on the guestbook phone brief, fix 4b): one lane per character bends out of the horn to carry it and draws it back as the word fades (DESIGN 6.15). The words, their order, timing, drift, color stops and phone clamp are unchanged; every stack name stays. Components row and the stale 1100ms, pool 6, size 0.32 figures follow the tokens. K-SRV-7 and T-SRV-7 are new.
- 1.2.0, 2026-11-10: words stay inside the viewport on phones, and hide while the guestbook is open (Justin's phone demo brief). The site-wide question (form the words from lanes, or remove them) is open with Justin: C-SRV-P2 no longer carries the stack words, so removal would take them off the site.
- 1.1.0, 2026-11-01: W1 server hero is the field (section 2) with the server gradient group and morph out row. No lane, camera, or copy change.
- 1.0.1, 2026-10-30: R-GPU accepted by Justin.
- 1.0.0, 2026-10-30: initial.
