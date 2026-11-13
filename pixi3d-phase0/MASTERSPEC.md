# MASTERSPEC: PixiJS 3D portfolio fork

Version 1.0.0, 2026-11-12. Status: DRAFT for Justin's approval. Specification only: no implementation code, no deploy, no production change.

Path: `pixi3d-phase0/MASTERSPEC.md`. Recovered to this path by the coordinator from the authoring session transcript after every write in that session was refused for lack of permission. Receipt: session cbc99c89 transcript Write to `phase0/MASTERSPEC.md`, 98,907 bytes, sha256 7f458e46a51dfc35c186adfc5dd0cc92799585b2dacf9060ce3d2b4a9a985e69. The recovered file matched that hash before the coordinator's header correction and the F-001 to F-008 fix pass; current hash is recorded in the commit message.

## 0. Seat, pins, conventions

### 0.1 Seat (AGENTS.md section 1)

- Task class: plan (the deliverable is a spec). Loop: plan.
- Discipline: lane-field engine (S02), camera (S02 camera chapter), scenes (S05, S06, S07, S08), chrome (S04), fallbacks (S10), performance QA (S11), DESIGN.md tokens. `node tools/agent-map.mjs impact ...` could not be run in the authoring session (Bash permission denied). Card B10.0 runs it first and records the output (section 9.2).
- Gates for this document: section 8.7 (spec gates S-1 to S-4).

### 0.2 Pins (do not contradict)

| Item | Pin | Source |
|---|---|---|
| Base | 2d75332 (Merge PR #9), branch pixi3d-phase0-20261112, HEAD 38106e1 | RESEARCH-INDEX.md:6; MASTERSPEC-ROUTING.md:38 |
| @pixi/3d | 0.1.0 (peer pixi.js ^8.23.0, dependency meshoptimizer ^1.2.0) | lane-a 02-api-surface.md:4 |
| pixi.js | 8.23.0 | lane-a 01-sources.md:16 |
| three | 0.186.1, removed by this fork | lane-c 04-replacement-surface.md:118 |
| troika-three-text | 0.52.5, removed by this fork | lane-c 04-replacement-surface.md:118 |
| @types/three | 0.186.0, removed by this fork | lane-c 04-replacement-surface.md:118 |
| Astryx | @astryxdesign/core and cli 0.7.1, unchanged | lane-c 03-theme-tokens.md:12-15 |
| Theme | lane theme, blue accent (signal #7BB5F8 on dark, ink #0E3565 on paper), Commit Mono | lane-c 03-theme-tokens.md:35-66, :72-76 |

### 0.3 Citation convention

- Pool paths are relative to `pixi3d-phase0/phase0/` (the worktree copy of the staging pool, same file set as RESEARCH-INDEX.md).
- Short forms: `01:` is `probe-f1/01-api-verification.md`, `02-probe:` is `probe-f1/02-probe-results.md`, `03-probe:` is `probe-f1/03-limits-unknowns.md`. `lane-a`, `lane-b`, `lane-c`, `lane-d` are `research/lane-a-pixi3d-docs/`, `research/lane-b-pixi-v8-skills/`, `research/lane-c-portfolio-astrxy/`, `research/lane-d-demos-refs/`. `SYNTHESIS.md` and the style briefs are under `design-extract/`. `probe main.ts` is `probe-f1/probe-src/src/main.ts`.
- `raw/...` is `probe-f1/raw/...`, the F1 fetch of the v0.1.0 API reference and guides (SHA-256 manifest `probe-f1/raw/SHA256SUMS`, 01:5-8).
- Repo paths (`src/...`, `spec/...`, `tests/...`, `qa/...`, `BUILD-STATE.md`) are relative to the worktree root at 2d75332. `DESIGN.md` is `spec/astryx/DESIGN.md`; `S10`, `S11` are `spec/astryx/specs/S10-fallbacks-a11y.md`, `S11-performance-qa.md`.
- Labels: VERIFIED (stated in a primary doc page saved in the pool), PROBED (exercised and rendered by the F1 probe), UNVERIFIED (named in a doc, not exercised; card B10.1 verifies it before any build card uses it), UNMEASURED (no measurement exists; every vendor number carries this label), UNKNOWN (no source).
- Later sections cite earlier ones by number and do not repeat their text (plan-masterspec.md:22).

---

## 1. Vision

### 1.1 What the fork is

One Pixi stage. One fullscreen View3D holding the 6,144-lane field, a curved two-panel project shelf, and the scene objects. A thin Pixi 2D layer above the view that pins letters and labels to 3D points. The Astryx DOM chrome above the canvas stays the accessible source of every fact.

The fork keeps the four addresses (`/`, `/leaflink`, `/sidequests`, `/404`), the four layouts, the lane theme, the blue accent and Commit Mono. It is not a copy of the current site. Three things are new, and each is a PixiJS 3D strength the three.js build could not have in one canvas:

1. **The shelf.** On the server scene (home), LeafLink and SideQuests stand as two curved panels over the lane field. Each panel is a live 2D Pixi scene drawn onto a curved 3D surface through `ContainerTexture`. Drag spins the shelf; tap a panel and the field re-forms into that project's layout while the camera travels. This is the Good Stuff shelf pattern, the framework's own production use of View3D plus ContainerTexture (lane-d 02-good-stuff-demos.md:5; SYNTHESIS.md:8; goodstuff/style-brief.md:52).
2. **Letters in the same stage as the lanes.** Server words become Pixi 2D glyphs pinned to the lane tips through the camera projection: one atlas, one 2D draw. 2D and 3D share one display list and one event system, the one capability only PixiJS 3D has among the adjacents (lane-d 04-adjacent-comparison.md:56; lane-a 02-api-surface.md:20, :22).
3. **One batch for the field.** The 6,144 lanes are one `BatchedMesh3D` with per-lane instance data, one material and one geometry, so one draw call by the framework's batching rule (raw/guides/scene-7.html.md:47), driven by uniforms only (DESIGN.md:196).

### 1.2 What the fork is not

- Not a drivable world. Content stays reachable without entering the 3D (SYNTHESIS.md:20). Every fact remains DOM text (DESIGN.md:190).
- Not a palette import. Good Stuff pink and Bruno and Corentin reds stay out (SYNTHESIS.md:19). The lane theme wins (SYNTHESIS.md:4).
- No claim about the Bruno Simon 3D world or the Corentin Bernadou hero composition. Both are unmeasured (bruno-simon/style-brief.md:7-13; corentin-bernadou/style-brief.md:7-14; SYNTHESIS.md:24, :35-36). Nothing in this spec derives from either.
- No physics, no audio, no WebGPU path, no post-processing in v1 (section 7).

### 1.3 Design thesis, traced

| Thesis line | Evidence |
|---|---|
| The scene does the showing, the HUD does the naming | SYNTHESIS.md:9 (architecture visible in DOM counts only; no Bruno world claim) |
| Live 2D on 3D panels instead of thumbnails | lane-d 03-design-extract-targets.md:13-17; goodstuff/style-brief.md:52 |
| The HUD has no elevation; the View3D owns depth | SYNTHESIS.md:14; lane theme shadows `none` (lane-c 03-theme-tokens.md:26) |
| Real links on the first screen, 3D as accompaniment | lane-d 03-design-extract-targets.md:62-63 (reserve target, guardrail only) |

---

## 2. Architecture

### 2.1 Layers, back to front

| # | Layer | Owner | Pointer |
|---|---|---|---|
| 1 | Pixi `Application` canvas inside `#world` (fixed, inset 0, z-index 0, aria-hidden), WebGL2 | `src/world/pixi/app.ts` | receives the pointer only where the DOM above is `pointer-events: none` |
| 2 | `View3D`, oversized and offset (3.4). `root` holds the lane batch, the shelf container and per-scene containers (pins, markers) | `src/world/pixi/view.ts` | `eventMode: 'static'` only on shelf panels (5.8) |
| 3 | Pixi 2D HUD `Container`, added to `app.stage` after the view so it draws over it (lane-a 02-api-surface.md:20): server glyphs, panel hover labels, shelf affordance | `src/world/pixi/hud.ts` | every HUD node `eventMode: 'none'` (lane-b 02-v8-core-surface.md:83, :98) |
| 4 | Astryx DOM chrome in `#root` (z-index 1): Readout, Keymap, Wordmark, sheets, twins, OfferButton | unchanged files under `src/chrome`, `src/scenes` | unchanged |

Layer 4 is untouched by the renderer swap except through the `Lanefield` interface (lane-c 04-replacement-surface.md:112). The late-attach seam stays as is: the world starts on idle after App mounts, with the `ready` promise, the `lanefield-ready` event and null tolerance (lane-c 02-code-graph.md:31).

### 2.2 Module map

The new directory `src/world/pixi/` holds every file that imports `pixi.js` or `@pixi/3d`. Nothing else imports them except `src/world/lanefield.ts` (the facade) and the scene controllers through `WorldLayers` (5.10).

| File | Role | Replaces |
|---|---|---|
| `src/world/pixi/app.ts` | `import '@pixi/3d/webgl'` and `import 'pixi.js/events'` at top, then `app.init` (3.1) | renderer block, lanefield.ts:127-150 |
| `src/world/pixi/view.ts` | View3D, Camera3D, off-center emulation (3.4) | `applyPose` shift in camera.ts; lanefield.ts:155-156 |
| `src/world/projection.ts` | Pure TS camera math: view matrix from a pose, shifted perspective, project, unproject to ground, pitch clamp. No renderer import | three math in camera.ts:79-97, :124-142, :229-269 |
| `src/world/variant.ts` | `isCoarseVariant`, `currentVariant`; imports tokens only | camera.ts:20-32 (seam, 5.11) |
| `src/world/pixi/laneBatch.ts` | lane `BatchedMesh3D`, strip geometry, instance data, textures (4) | lanefield.ts:168-251 |
| `src/world/pixi/laneBit.ts` | lane `ShaderBit`, GLSL only (D5) | `src/world/shaders/lane.vert.glsl`, `lane.frag.glsl` |
| `src/world/pixi/batch.ts` | `createBatch()`, the only code that calls the four slot setters; records each slot in the ledger (4.6) | none |
| `src/world/pixi/ledger.ts` | engine resource ledger and upload counters (8.4) | `renderer.info` reads, lanefield.ts:398-402 |
| `src/world/pixi/glcount.ts` | test-only WebGL2 call interceptor (8.4) | `renderer.info` |
| `src/world/pixi/hud.ts` | 2D HUD container, BitmapFont install, glyph pool | troika `Text` |
| `src/world/pixi/shelf.ts` | shelf container, curved panel geometry, ContainerTextures, drag and snap | none (new) |
| `src/world/pixi/pins.ts` | LeafLink pin, halo, ripple batch | leaflink.ts:114-234 |
| `src/world/pixi/markers.ts` | SideQuests heads and poles batch | sidequests.ts:151-208 |
| `src/world/pixi/layers.ts` | `WorldLayers` type (5.10) | `scene`/`camera` in types.ts |

Every new file gets an `agents/ownership.json` rule in the same change (AGENTS.md section 1, step 2).

### 2.3 Frame loop

One loop: `app.ticker` (lane-b 02-v8-core-surface.md:17, :55-58). The `doFrame` structure is renderer-agnostic and ports as is; only the final render call changes (lane-c 04-replacement-surface.md:44).

Per frame, in this fixed order inside one `app.ticker.add` callback at `UPDATE_PRIORITY.HIGH`:

1. Clock: seconds from `ticker.deltaMS / 1000`, never `deltaTime` (lane-a 02-api-surface.md:68; lane-a 03-limits-unknowns.md:42).
2. Travel weights, morph sample, glitter, focus (unchanged math).
3. The camera rig composes the pose on plain tuples (`projection.ts`); `view.ts` applies it: `camera.position.set`, `camera.lookAt`, effective `fov`, view offset (3.4).
4. Controller `onFrame` callbacks: server, leaflink, sidequests, guestbook director, shelf.
5. Uniform writes: `material.data.<field> = ...`, then `material.update()` after in-place vector writes (01:71-78).
6. Instance-data and texture uploads only from dirty flags (4.5), counted in the ledger.
7. HUD layout from `projection.ts` (5.3).
8. Governor sample. Pixi renders at `UPDATE_PRIORITY.LOW` (lane-b 02-v8-core-surface.md:58).

No second `requestAnimationFrame` loop (lane-b 03-skill-extracts.md:78). No extra that self-updates on `Ticker.shared` is used (no OrbitCamera, no particles), so the ordering trap in lane-b 03-skill-extracts.md:161 does not arise.

Reduced motion switches to demand mode: `app.ticker.stop()`, and `app.render()` only on resize, travel or interaction (DESIGN.md:188; lane-b 02-v8-core-surface.md:17). See 6.6.

### 2.4 Data flow

```
worker.ts generateAll(seed)                       unchanged (no three import; lane-c 04-replacement-surface.md:111)
  -> Float32Array layouts, 256 x 768 x 4 floats   unchanged (lane-c 02-code-graph.md:155)
  -> laneBatch: BufferImageSource rgba32float -> texture "layoutMap"           (4.3)
controllers -> setActivity(...)                   unchanged API; writes texture "activityMap" (4.3)
server words -> claim and release lanes           instance data at event time only (5.2, K-SRV-6)
guestbook director -> field.guestbook.*           unchanged API; instance data dirty spans (5.6)
every frame -> material.data uniforms             animate uniforms only (DESIGN.md:196)
```

### 2.5 Cross-domain linkage (required by the plan)

Lane A/B API surface to the Lane C replacement surface:

| Lane C replacement surface (lane-c 04-replacement-surface.md) | Lane A/B API that replaces it | Section |
|---|---|---|
| `THREE.WebGLRenderer`, WebGL2, fixed canvas (:32) | `new Application()`, `await app.init({ preference: 'webgl', ... })` (lane-a 02-api-surface.md:10; PROBED, probe main.ts:53-59) | 3.1 |
| `THREE.Scene`, `PerspectiveCamera` (:34) | `new View3D({ width, height, camera })`, `new Camera3D({ fov, near, far })` (01:259-268; PROBED) | 3.2 |
| principal-point shift in `applyPose` (:52, :56) | ABSENT (01:231-255); emulated by an oversized, offset View3D | 3.4 |
| `DataTexture` RGBA32F layout and activity (:35) | `BufferImageSource` with a Float32Array as `rgba32float` (01:103-108; PROBED at 256x24); `ShaderBit.textures` plus `sampleXDirect` (01:79-84) | 4.3 |
| `InstancedBufferGeometry`, 43,008 instances, `aSeg` (:36) | `BatchedMesh3D({ size, instanceData })`, `setInstanceDataAt`, bulk `instanceData` (01:17-42, :124-151; PROBED) | 4.1, 4.2 |
| `ShaderMaterial` GLSL3, custom blend, no depth (:37) | `FlatMaterial({ alphaMode: 'blend', extraBits })`, `material.state.depthTest = false` (raw/api/materials.FlatMaterial.html.md:3-8, :201-212, :410-412) | 4.4 |
| `renderer.info` (:42) | none (01:203-229); GL interception plus ledger | 8.4 |
| `compileAsync` (:43) | ABSENT (01:180-201); staged warm frames behind the late-attach seam | 3.5 |
| troika `Text` per glyph (:5, :58-67) | 2D `BitmapText` from one `BitmapFont` atlas over the view, pinned by projection (lane-b 02-v8-core-surface.md:109-110, :139) | 5.3 |
| LeafLink inline GLSL pins (:69-80) | `BatchedMesh3D`, `FlatMaterial`, bit using `position`, `alpha`, `instance.*` | 5.4 |
| SideQuests `onBeforeCompile`, `InstancedMesh` (:82-92) | `BatchedMesh3D`, custom `Geometry3D` with `colors`, bit | 5.5 |
| clear colour per regime (:39) | `view.background = <ColorSource>` per frame (raw/api/scene.View3D.html.md:312-330) | 3.6 |
| DPR governor (:40) | `renderer.resize(w, h, resolution)` (lane-b 02-v8-core-surface.md:16; lane-a 02-api-surface.md:69) | 3.7 |
| test harness and guestbook camera import (:10, :121) | renderer-neutral `variant.ts`, `projection.ts`, mock `WorldLayers` | 5.11 |

Design-extract patterns to HUD architecture:

| Pattern | HUD architecture element | Section |
|---|---|---|
| Curved demo shelf (SYNTHESIS.md:8) | `shelf.ts`, two panels | 5.8 |
| One View3D, thin 2D HUD (SYNTHESIS.md:9) | layer table | 2.1 |
| Editorial grid (SYNTHESIS.md:10) | HUD positions on `T.space` grid tokens; DOM chrome unchanged | 6.3 |
| Tooltip-first discovery, HYPOTHESIS (SYNTHESIS.md:11) | panel hover label with its own falsification test | 6.5 |
| Drag affordance as quiet mark (SYNTHESIS.md:13) | non-text affordance until copy is approved | 6.4 |
| Flat discipline (SYNTHESIS.md:14) | no shadows, no lights, FlatMaterial everywhere | 4.4, 6.3 |

Probe results to the lane-field rewrite:

| F1 probe result (02-probe:13-28) | Consequence | Section |
|---|---|---|
| BatchedMesh3D with instance data PASS | the lane batch is built on it | 4 |
| Custom ShaderBit draws PASS; stock control isolates it | lane, pin and marker bits; console capture in every test | 4.4, 8.6 |
| RGBA32F 256x24 PASS, read in the vertex stage at a constant UV | 256x768 and texel addressing re-probed in B10.1 | 4.3, 8.5 |
| setPassesAt trap is real (02-probe:38) | `createBatch()` invariant plus a negative-control test | 4.6 |
| Warmup ABSENT | staged warm frames, long-task budget | 3.5 |
| Off-center projection ABSENT | oversize-offset emulation plus a parity gate | 3.4 |
| Statistics: no `renderer.info` | debug contract re-specified | 8.4 |
| Bundle 343 KiB gzip total, index chunk 187 kB gzip (02-probe:30-34) | world-chunk acceptance stated in advance | 8.2 |

Measurement protocol to the budget and debug contract:

| MEASUREMENT-PROTOCOL.md line | Budget or contract it binds | Section |
|---|---|---|
| Bundle per chunk with attribution (:11-12) | `budgets.worldChunkGzKb` 220 (DESIGN.md:1037) | 8.2 A1 |
| Lighthouse repeated cold runs (:14-15) | S11 section 4 LCP, TBT, TTI, CLS | 8.2 A3 |
| Runtime matrix, `__lanefield` values or Pixi equivalents (:17-18) | debug contract | 8.2 A4 to A9, 8.4 |
| Acceptance stated before the probe runs (:20-21) | fixed by this document | 8.2 |

---

## 3. Lane-field rewrite, part 1: engine, view, camera

### 3.1 Application init

- `src/world/pixi/app.ts` imports `@pixi/3d` (through `@pixi/3d/webgl`) at module top, before any `app.init`. Importing after init leaves a View3D drawing nothing with no error (lane-a 02-api-surface.md:11; lane-a 03-limits-unknowns.md:34). The world chunk is lazy, but `app.init` lives inside it, so the import precedes init by construction.
- Init: `const app = new Application(); await app.init({ preference: 'webgl', skipExtensionImports: true, antialias: false, autoDensity: true, resolution, resizeTo: <#world host> })`. The constructor takes no arguments (lane-b 02-v8-core-surface.md:10). `preference: 'webgl'` is PROBED (probe main.ts:53-59; renderer type 1, 02-probe:16).
- `skipExtensionImports: true` with explicit `import '@pixi/3d/webgl'` and `import 'pixi.js/events'` keeps the WebGPU backend out of the bundle (lane-a 02-api-surface.md:12). The minimal extension set is UNVERIFIED; B10.1 item P1-8 lists every extension the fork needs by running tsc and the rendered smoke test.
- `antialias: false` matches the current renderer (lane-c 04-replacement-surface.md:32).
- Resize: `new ResizeObserver(() => app.queueResize())` on the host; layout reads `app.renderer.on('resize', ...)`, never a window listener (lane-b 02-v8-core-surface.md:15; lane-b 03-skill-extracts.md:52-56). The projection reads the canvas CSS box, never `innerWidth` (DESIGN.md:296).
- Backend assertion after init: `app.renderer.type` must equal the WebGL renderer type (1 in the probe). Otherwise `createLanefield` returns null and the no-WebGL fallback runs (S10:14). This assertion is what makes GLSL-only bits safe (D5).
- `tsconfig.json` must resolve `@pixi/3d/extras` types with `moduleResolution: "bundler"` (lane-a 02-api-surface.md:13). B10.2 checks it.
- Teardown: `app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true, texture: true, textureSource: true })`, chained on the init promise (lane-b 02-v8-core-surface.md:20).
- Forbidden: the unrelated `pixi3d` package and three.js names in Pixi code (lane-b 03-skill-extracts.md:26-30; lane-d 05-limits-unknowns.md:51).

### 3.2 View3D and camera

- `new View3D({ width: Wv, height: Hv, camera, anchor, background, cull: 'off', toneMapping: 'none', resolution })`. Options VERIFIED in raw/api/scene.View3DOptions.html.md (`anchor` :37-39, `background` :78-80, `cull` :149, `resolution` :311). `cull: 'off'` because lane positions come from a texture, so CPU bounds would be wrong; `'off'` is the guide's fix for vertex-moved meshes (lane-a 03-limits-unknowns.md:50), and on WebGL2 culling runs on the CPU anyway (lane-a 02-api-surface.md:61).
- `autoResize` stays off: the view is sized explicitly (3.4), and setting `width` or `height` turns it off anyway (lane-a 02-api-surface.md:17).
- Content goes under `view.root`, never `view.addChild` (lane-a 02-api-surface.md:19). Each scene owns its own `Container3D` under root. Nothing ever clears or hides `view.root`, and the camera is never inside a hidden group (lane-a 03-limits-unknowns.md:48-49).
- `new Camera3D({ fov, near: T.world.camera.near, far: T.world.camera.far })` (01:265; DESIGN.md:838-839, near 0.1 and far 120). Pose application: `camera.position.set(x, y, z)`, `camera.lookAt({ x, y, z })` (01:245; probe main.ts:231-232), `camera.fov = fovEff` (3.4).
- No lights, no environment, no shadows: every material is `FlatMaterial`, which is unlit (raw/api/materials.FlatMaterial.html.md:3-8). That removes the shadow compile stalls (lane-a 03-limits-unknowns.md:53) and the float render-target gate (lane-a 03-limits-unknowns.md:26).

### 3.3 Colour pipeline

- `FlatMaterial.colorSpace` is `'display'`, and under `toneMapping: 'none'` at exposure 1 it draws colours as authored (raw/api/materials.FlatMaterial.html.md:6-8, :45-51). That is the raw-sRGB contract lanefield.ts already uses (lane-c 04-replacement-surface.md:31).
- Decision: one pipeline, raw sRGB from token hex, for lanes, pins, markers and panels. LeafLink's `hexToLinear` path (leaflink.ts:105-110; lane-c 04-replacement-surface.md:72) is dropped. Evidence: FlatMaterial display space above; the two-path disagreement is unresolved today (lane-c 05-limits-unknowns.md:32). Verification: G-CONTRAST and the T-LL pixel tests rerun (8.6). Falsification: if T-LL-5 contrast over the live scene fails only after this change, restore linear conversion for pins and record why.

### 3.4 Off-center projection: named workaround with evidence

**Problem.** three.js `applyPose` writes `projectionMatrix.elements[8] = -shift[0]` and `elements[9] = -shift[1]` (src/world/camera.ts:130-131). Pixi has no shift, offset or projection injection; `projection` is readonly and recomputed from fov, near, far, mode and zoom only (01:231-255; 02-probe:21). The readout clear zone depends on the shift (server fine [0.62, 0], leaflink coarse [0, 0.18], sidequests fine [-0.18, 0]; DESIGN.md:783-836), and so does the guestbook dolly (`GuestbookCamera.shiftMix`, src/world/types.ts:96-98; `guestbook.shiftNdc`, DESIGN.md:1001-1004).

**Derivation.** In column-major three.js storage, element 8 is row 0, column 2, and element 9 is row 1, column 2. For a camera-space point with `z < 0`, `w_clip = -z`, so `clip.x = P00*x + (-shift0)*z = P00*x + shift0*w_clip`. Dividing by `w_clip` gives `ndc.x = P00*x/(-z) + shift0`; likewise `ndc.y` gains `shift1`. The shift adds a constant to NDC at every depth. The shifted image is therefore the unshifted image translated by `shift0*W/2` CSS px to the right and `shift1*H/2` CSS px up, where W x H is the canvas CSS size. Clip-space z is untouched.

**Workaround.** Render the unshifted camera into a View3D larger than the canvas and translate the view:

1. Margins per variant from tokens, never hardcoded: `mx` is the largest `|shift0|` and `my` the largest `|shift1|` over every `T.world.camera.<layout>.<variant>.shiftNdc` and `T.guestbook.shiftNdc.<variant>`. With today's tokens: fine `mx = 0.62`, `my = 0.02`; coarse `mx = 0`, `my = 0.3` (DESIGN.md:787-835, :1002-1003).
2. View size: `Wv = W*(1 + mx)`, `Hv = H*(1 + my)` CSS px. Fixed per variant and canvas size, recomputed only on resize or variant change, never per frame.
3. Effective vertical fov: `tan(fovEff/2) = tan(fov/2) * Hv/H`. The pixel focal length is then `Hv / (2*tan(fovEff/2)) = H / (2*tan(fov/2))`, identical to the three.js camera on the W x H canvas, in both axes (square pixels, view aspect `Wv/Hv`).
4. Per frame, place the view so its centre lands on canvas point `(W/2 + shift0*W/2, H/2 - shift1*H/2)`. Because `|shift| <= margin`, the view always covers the canvas. Set `anchor` explicitly (`anchor?: number | PointData`, raw/api/scene.View3DOptions.html.md:37-39) and `view.position`. A View3D is a display object, and `worldToScreen` accounts for its anchor, position, scale and rotation (lane-a 02-api-surface.md:22).
5. If a runtime shift exceeds the margin (the guestbook free-region shift on a phone, DESIGN.md:296), the view resizes once to the new margin and the ledger logs it. It never resizes per frame.

**Verified and not.**
- VERIFIED: View3D `width` and `height` resize the 3D viewport (raw/api/scene.View3D.html.md:577-594; lane-a 02-api-surface.md:17); `anchor` and `position` exist; `worldToScreen` honours them; Camera3D `fov` is writable (lane-a 02-api-surface.md:53).
- UNVERIFIED (B10.1 item P1-5): a View3D that extends past the canvas renders correctly; and whether Pixi draws the view straight onto the canvas (the GPU clips offscreen fragments, cost is vertex only) or into an intermediate `Wv x Hv` target (fragment cost multiplied by up to `(1+mx)(1+my)`, 1.652 fine and 1.3 coarse with today's tokens). The guide says views draw straight onto the canvas by default (lane-a 02-api-surface.md:72), which favours the first case.
- Proof gate: G-PX-SHIFT (8.6). For every layout and variant pose plus the guestbook shift, 64 seeded world points: Pixi's `view.worldToScreen` and `projection.ts` (pure TS port of the three math) agree within 0.5 CSS px, and the T-S02-5 rule holds: the target projects to x = `(0.5 + shift0/2) * W` (BUILD-STATE.md:64, :71).

**Rejected alternatives.**
- Re-deriving poses without a shift. It changes every scene's perspective and voids the geometric verifications behind today's tokens (DESIGN.md:1092, :1127-1128). Rejected: higher risk, and nothing shows it can match the clear zones.
- Adding `shift*w` to the clip position in a vertex bit. The clip-space variable of `vertex.afterTransform` is not documented in the saved pages (raw/guides/extras_materials.html.md:117-121 lists only `beforeTransform` for vertex), and Pixi's own picking would not see the shift. Kept only as fallback F-SHIFT-2 if P1-5 fails and P1-3 documents the clip variable.

**Cost.** Vertex cost is unchanged. Fragment cost is unchanged if P1-5 confirms direct draw; otherwise it scales as above, is absorbed by the DPR governor, and is measured on the device under A4 (8.2).

### 3.5 First-frame shader compile (no warmup API)

- Fact: 0.1.0 has no public warmup or precompile; `compileShader` is internal and returns source text (01:180-189). Each material, geometry and view-setting combination compiles on the first frame that needs it and can stall, worst on WebGL (01:190-198).
- Stated cost: UNMEASURED. It lands on frames before `ready` and is bounded by the existing long-task gate: no long task over 50 ms from navigation start to 5 s after `ready` (S11:44).
- Design that tolerates it:
  1. Every view setting that compiles shaders is fixed before the first render and never changes: `toneMapping: 'none'`, no environment, no shadows, no post effects (01:193-198; lane-a 03-limits-unknowns.md:52-53).
  2. Every material family exists from init; no material is created after `ready` (the ledger asserts it, 8.4).
  3. Staged warm frames before `ready`: frame 1 renders the lane batch only, frame 2 adds the shelf panels, frame 3 the pins, frame 4 the markers, frame 5 the HUD atlas. Each stage is its own task, so two compile stalls cannot merge into one long task. During warm frames the `#world` host has CSS `opacity: 0`; the DOM readout, which holds the LCP element, is already visible (lane-c 02-code-graph.md:31). `ready` resolves after frame 5.
  4. Context restore reruns the same stages (3.8).
- Falsification: if one stage produces a long task over 50 ms on the reference phone (A7), split that stage by material. If one material alone exceeds 50 ms, write `BLOCKED: shader compile exceeds long-task budget on <device> (S11 section 4)` in BUILD-STATE.md and stop. No API exists to fix it from our side.

### 3.6 Regime ground

`view.background = <ground hex>` every frame, blended across the four layout weights exactly as lanefield.ts:275, :308-309 does today (lane-c 04-replacement-surface.md:39). The view covers the whole canvas (3.4), so its background is the canvas ground. VERIFIED: a colour background is in display space, ignores alpha, reads back as hex, and shows exactly under `'none'` (raw/api/scene.View3D.html.md:318-330). A view with no meshes draws no background (raw/api/scene.View3D.html.md:323-324), so the lane batch joins before the first frame. This path replaces the clear-colour code behind the B6a block (BUILD-STATE.md:224); T-SRV-2 is re-earned at both viewports (8.6).

### 3.7 DPR governor

`governor.ts` ports verbatim (lane-c 04-replacement-surface.md:111). Its only lever stays resolution; lane count never changes (S11:61). It applies through `renderer.resize(w, h, resolution)` (lane-b 02-v8-core-surface.md:16) under the caps `T.world.dprCap` (lane-c 02-code-graph.md:117). Adopted from the phone checklist: resolution cap 2, antialias off, settings fixed before the first render, FlatMaterial where no lighting is needed, hide with `visible`, no object creation in the ticker (lane-a 02-api-surface.md:69).

### 3.8 Context loss and restore

Today the loop stops on `webglcontextlost` and re-uploads, recompiles and resumes on restore (lane-c 04-replacement-surface.md:43). Pixi's restore behaviour is UNKNOWN in the pool. B10.1 item P1-9 forces a loss with the `WEBGL_lose_context` extension and records whether Pixi restores textures and programs itself. Either way: on loss, stop `app.ticker`; on restore, re-upload `layoutMap`, `activityMap`, `classMap` and instance data, rerun the staged warm frames (3.5), resume. G-WORLD "recoverable" is re-earned by G-PX-CTX (8.6).

---

## 4. Lane-field rewrite, part 2: batch, data, shader

### 4.1 Slot granularity: 6,144 slots, not 43,008

- The three.js field draws 43,008 instances (6,144 lanes x 7 segments), one quad each (lane-c 04-replacement-surface.md:36).
- `'blend'` slots are sorted every frame, hidden ones included (raw/guides/scene-7.html.md:103), and the transparent pass re-sorts while the camera moves (raw/guides/extras_debug.html.md:54). Lanes must blend, so slot count is a per-frame CPU cost.
- Decision: one slot per lane, 6,144 slots, each drawing a 7-segment strip geometry. Sort work drops sevenfold; per-lane data (guestbook and word offsets are per lane today, lane-c 05-limits-unknowns.md:48) maps to one slot; and all slots share one geometry and one material, so the batch is one draw call (raw/guides/scene-7.html.md:47; lane-a 02-api-surface.md:60).
- Strip geometry, built once with `new Geometry3D({ positions, uvs, indices, bounds3D })` (raw/api/geometry.Geometry3DOptions.html.md:55, :163-165, :291-293, :413-415): 7 quads, 28 vertices, 42 indices. Vertex `position = (along, across, k)` with `along` in {0, 1} (segment start or end), `across` in {-0.5, +0.5}, `k` in 0..6. `uvs = ((k + along)/7, across + 0.5)`, so fragment `vUV.x` is the position along the lane (raw/guides/extras_materials.html.md:125). The shader addressing `idx = lane*32 + lay*8 + k` is kept byte for byte (lane-c 04-replacement-surface.md:97).
- Fallback F-SLOT: if the 6,144-slot sort still breaks A4 on the reference phone, replace the batch with one `Mesh3D` over one `Geometry3D` of 6,144 strips (lane index encoded in `position`), which sorts as one object. Same bit, no instance data; per-lane offsets move to a 256x24 RGBA32F `laneState` texture written at event time only. Not the first choice because it gives up the per-instance attributes the probe verified.

### 4.2 The batch

```
new BatchedMesh3D({
  size: T.world.laneCount,                                  // 6144, fixed for life (01:17-20)
  instanceData: {
    lane: { value: [0, 0, 0, 0], type: 'vec4<f32>' },       // laneIndex, wordSlot+1 (0 = none), wordCharX, gbFlag
    offs: { value: [0, 0, 0, 0], type: 'vec4<f32>' },       // guestbook offset xyz, unused
  },
})
```

- Constructor and `instanceData` shape exactly as verified: `new BatchedMesh3D(options: BatchedMesh3DOptions)` with required `size: number`; each field a vec4 `{ value, type }` (01:17-20, :126-130; PROBED with `tint`, probe main.ts:146-149).
- Every slot, through `createBatch()` only (4.6): `setGeometryAt(i, strip)`, `setMaterialAt(i, laneMaterial)`, `setMatrixAt(i, identity)` (a new slot's matrix is all zeros and draws nothing, 01:37-38), `setPassesAt(i, RenderPassBit.TRANSPARENT)` (TRANSPARENT for `'blend'`, raw/guides/scene-7.html.md:41; 01:25-29).
- Bulk writes: `const { data, stride, offset, fields } = batch.instanceData;` field `f` of slot `i` starts at `offset + i*stride + fields[f]`; one `update(first, count)` per dirty run (01:136-143; PROBED, probe main.ts:160-165). Instance `update()` uploads no matrices (01:141-145).
- Matrices: identity for every lane, written once through `batch.matrices.data` (16 floats column-major per slot at `offset + i*stride`) and one `matrices.update()` (01:39-42). Never rewritten per frame.
- The batch's own `cull` stays `'off'`, the default (raw/guides/scene-7.html.md:161-167).
- Each field read in fragment code costs a varying (01:144-146); only `lane.x` (lane index) is read in the fragment.

### 4.3 Textures

| Name in the bit's `textures` | Size, format | Written | API |
|---|---|---|---|
| `layoutMap` | 256 x 768 RGBA32F, 786,432 floats | once per worker message | `new BufferImageSource({ resource, width, height, format: 'rgba32float' })`, `new Texture({ source })` (probe main.ts:89-95; PROBED at 256x24) |
| `activityMap` | 256 x 24 RGBA32F | on `setActivity` and `clearActivity` only | same |
| `classMap` | 16 x 2 RGBA32F: row 0 class style (widthCss, alpha), row 1 class colour | once at init | same. Replaces uniform arrays `uClassStyle[16]` and `uClassColor[16]`: `bindings.material` accepts only f32, i32, u32, mat2x2 and vec2, vec3, vec4 of f32 (01:73-74), not arrays |
| `silhouetteMask` | small square RGBA8 | when the mask kind changes (P-LF-4b) | `Assets.load` of the manifest PNG (lane-b 02-v8-core-surface.md:28) |

- Sampling: `sampleXDirect(uv)` reads mip 0 in either stage (01:79-84). No `texelFetch` equivalent is documented; exact addressing is emulated at `uv = (((idx mod 256) + 0.5)/256, (floor(idx/256) + 0.5)/768)` (01:109-115). Filtering must be nearest, through `texture.source.scaleMode` (lane-b 02-v8-core-surface.md:35); linear filtering of `rgba32float` needs an optional feature (01:107-108). UNVERIFIED at 256x768 and for exact addressing (01:113-115, :120-122): B10.1 items P1-1, P1-2; gate G-PX-TEXEL.
- Re-upload after a CPU write: `texture.source.update()` (lane-b 02-v8-core-surface.md:106). UNVERIFIED for `BufferImageSource`: B10.1 item P1-10.
- Premultiplication: Pixi premultiplies images by default (01:81-83). Float buffers are data; P1-1 confirms values read back unmodified, including alpha, which carries the class id 0..15 (lane-c 02-code-graph.md:155).
- The 256x24 `gbTex` is removed. Guestbook and word offsets move to instance data (4.5, 5.2, 5.6).

### 4.4 The lane bit (port of lane.vert.glsl and lane.frag.glsl)

- Material: `new FlatMaterial({ alphaMode: 'blend', extraBits: [laneBit], textures: { layoutMap, activityMap, classMap, silhouetteMask } })`, then `laneMaterial.state.depthTest = false` (raw/api/materials.FlatMaterial.html.md:201-212). `'blend'` turns depth writes off (raw/api/materials.FlatMaterial.html.md:410-412), matching today's `depthTest: false, depthWrite: false` (lane-c 04-replacement-surface.md:37). `extraBits` cannot change after construction (raw/guides/extras_materials.html.md:133).
- Blend equation: today premultiplied One, OneMinusSrcAlpha (lane-c 04-replacement-surface.md:37). The factors of the `'blend'` state are UNVERIFIED: B10.1 item P1-4 renders a known premultiplied colour over a known ground and compares the pixel with the closed form. If it differs, the card sets the premultiplied blend mode explicitly on `state` and retests.
- Bit shape: `{ name: 'pxLane', textures: [...], bindings: { instance: { lane: 'vec4<f32>', offs: 'vec4<f32>' }, material: { ... } }, gl: { vertex: { beforeTransform }, fragment: { material } } }`. The name is unique (two bits with one name throw, 01:50-54). Code is wrapped in braces (raw/guides/extras_materials.html.md:113). GLSL only; `gpu` is omitted (D5).
- Vertex, `vertex.beforeTransform`, which reads and writes `position` in mesh space (raw/guides/extras_materials.html.md:119; PROBED, probe main.ts:125-129): read `along`, `across`, `k` from the incoming `position`; fetch both endpoints of segment `k` in the four layouts from `layoutMap`; weight-blend with `uW`; apply ring, silhouette, glitter, variant B, guestbook part, guestbook offset (`instance.offs`) and word bend (5.2); write the world-space vertex to `position` (identity matrix, so mesh space is world space).
- Ribbon width. Today the width is applied in clip space in screen pixels (src/world/shaders/lane.vert.glsl:166-185). The documented vertex slot is mesh space only (raw/guides/extras_materials.html.md:117-119). B10.1 item P1-3 decides between:
  - P1-3 PASS, a documented clip-space variable in `vertex.afterTransform` or `vertex.end` (01:57-58 names the slots): port lines 166-185 nearly verbatim into that slot. `uViewport` becomes the view's device-pixel size `Wv*dpr x Hv*dpr` (3.4), so pixel widths are unchanged.
  - P1-3 FAIL: a world-space equivalent in `beforeTransform`. Offset each vertex by `normalize(cross(segDir, toCamera)) * across * widthCss * dpr * zView / focalPx`, where `toCamera` comes from `uCameraPosition` (engine field, readable without declaring, 01:75-77), `zView` is the depth along the camera forward (material field `uCamFwd`), and `focalPx = Hv*dpr / (2*tan(fovEff/2))` (material field). Exact at the segment centre depth; it differs from today only by the foreshortening of the offset direction.
  - Either path must pass G-PX-WIDTH (8.6).
- Fragment, `fragment.material`, which reads and writes `albedo` and `alpha` (raw/guides/extras_materials.html.md:120): fire pulse, route and trail colouring, OKLab gradient, word tint, guestbook dim, `uFrozen` (lane.frag.glsl). Inputs: `vUV.x` along the lane (:125), `instance.lane.x` for the lane id (readable in either stage, 01:131-132), `uTime` (:125). Values the vertex stage computes today (class, blended layout weight, activity) are recomputed in the fragment from `sampleXDirect`, unless B10.1 item P1-6 verifies a varying through `ShaderBit.interStage` (01:52 lists the field; the pool has no example).
- Uniforms: every scalar or vector `u*` uniform in lane.vert.glsl:6-33 and in the fragment becomes a `bindings.material` field written through `material.data.<name>` and `material.update()` (01:71-78). Word slots are 12 named vec4 fields: `w0..w5` (centre xyz, opacity) and `t0..t5` (tint rgb, unused). B10.1 records the compiled uniform count, because the closed beta fixed an Android bug where shaders asked for more uniforms than WebGL2 allows (lane-a 03-limits-unknowns.md:8).
- `// lit-ok:` discipline carries over: G-TOKENS scans `src/world`, including GLSL in strings (lane-c 03-theme-tokens.md:82; lane-c 04-replacement-surface.md:99).
- The opaque trap is avoided: with `alphaMode: 'blend'` the material does not reset `alpha` to 1 (raw/guides/extras_materials.html.md:123).

### 4.5 Upload discipline (K-SRV-6 and DESIGN law 3)

DESIGN.md:196: "In WebGL, animate uniforms only; geometry buffers are never rewritten per frame." The fork enforces it with counters:

| Buffer | Allowed writes | Ledger counter |
|---|---|---|
| matrices, lane batch | init only | `uploads.matrices` |
| matrices, pins | spawn events | `uploads.matrices` |
| matrices, markers | per frame, 6 slots, full motion only (5.5) | `uploads.markers` |
| lane `instanceData` | word claim and release (5.2); guestbook letter writes while the sheet is open (5.6) | `uploads.laneInstance` |
| `layoutMap` | worker message, context restore | `uploads.layout` |
| `activityMap` | `setActivity`, `clearActivity` | `uploads.activity` |
| pins `instanceData` | per frame, at most 72 slots (5.4) | `uploads.pins` |
| material uniforms | every frame | not counted |

### 4.6 setPassesAt invariant and its failing test

- Trap: a slot in no pass draws nothing, with no error (01:33-36; 02-probe:38). A slot does not take its passes from its material (raw/guides/scene-7.html.md:41).
- Rule: `createBatch(spec)` is the only caller of the four slot setters. For each slot it either sets geometry, material, matrix and a non-zero pass, or parks the slot as a spare with `setPassesAt(i, 0)` (the guide's way to take a hidden blend slot out of the sort, raw/guides/scene-7.html.md:103) and records it as `parked`. It writes `{ batch, slot, passes, parked }` to the ledger.
- Invariant, checked at `ready` and after every placement event: for every batch, `inPass + parked == size`, and no visible slot has pass 0.
- Negative control: the debug flag `?fault=nopass:<batch>:<slot>` makes `createBatch` skip `setPassesAt` for one slot without recording it. G-PX-PASSES (8.6) runs both cases. The normal build reports `slotsWithoutPass: 0`. The fault build must report `slotsWithoutPass: 1`, and that lane's projected tip must read as ground colour in a pixel probe. If the fault case comes out green, the test is broken and the gate fails.

---

## 5. Scenes and seams

### 5.1 Touchpoint map (every row of lane-c 04-replacement-surface.md)

| Touchpoint at 2d75332 | Pixi mechanism or redesign | Section |
|---|---|---|
| types.ts:1 `import type * as THREE` | removed; types.ts imports nothing renderer-specific | 5.10 |
| types.ts `scene`, `camera` fields (:178-179) | removed; `layers: WorldLayers or null` and `cameraAxes(out)` added | 5.10 |
| lanefield.ts:4 import | the facade imports `src/world/pixi/*` | 2.2 |
| lanefield.ts:28-34, :65-87 colour helpers | plain tuples, raw sRGB | 3.3 |
| lanefield.ts:127-150 renderer, colour space, tone mapping | `app.init`, `toneMapping: 'none'`, FlatMaterial display space | 3.1, 3.3 |
| lanefield.ts:155-156 scene, camera | View3D, Camera3D | 3.2 |
| lanefield.ts:168-196 DataTextures | BufferImageSource rgba32float | 4.3 |
| lanefield.ts:198-208 instanced geometry, `aSeg` | BatchedMesh3D with 6,144 slots, strip geometry, `instance.lane` | 4.1, 4.2 |
| lanefield.ts:212-248 ShaderMaterial, blend | FlatMaterial blend, `state.depthTest = false`, `pxLane` bit | 4.4 |
| lanefield.ts:250-251 mesh, `frustumCulled = false` | batch `cull: 'off'`, view `cull: 'off'` | 3.2, 4.2 |
| lanefield.ts:275, :308-309 clear colour | `view.background` per frame | 3.6 |
| lanefield.ts:293-294 pixel ratio, size | governor through `renderer.resize`; view size | 3.7, 3.4 |
| lanefield.ts:353-355 per-frame uniforms | `material.data` plus `update()` | 4.4 |
| lanefield.ts:398-402 `renderer.info` | GL interception plus ledger | 8.4 |
| lanefield.ts:480, :540 `compileAsync`; :488-489 context events | staged warm frames; restore path | 3.5, 3.8 |
| lanefield.ts render inside `doFrame` | Pixi ticker render | 2.3 |
| lanefield.ts dispose | full `app.destroy(...)`, `Assets.unload` for loaded assets | 3.1 |
| lanefield.ts:1456 `gbTex.needsUpdate` (guestbook) | instance-data dirty runs while the sheet is open | 5.6 |
| lanefield.ts:1554 `gbTex.needsUpdate` (words, K-SRV-6) | removed; event-time writes plus uniforms | 5.2 |
| lanefield.ts `placeholderTex`, `maskCache` (silhouette) | `silhouetteMask` texture slot with a 1x1 transparent placeholder | 4.3 |
| lanefield.ts:1423-1595 guestbook and words hooks | same interface, new storage | 5.2, 5.6 |
| new uniforms `uGb*`, `uWordTint`, `uRing*`, `uSilhouette*`, `uLengthVariance` and the rest | material fields; `uWordTint[]` becomes `t0..t5` | 4.4 |
| camera.ts:5 import, :68-77 vectors, :101-115 PerspectiveCamera | `projection.ts` tuples; the rig drives Camera3D | 5.9 |
| camera.ts:124-142 `applyPose` shift | oversized, offset view | 3.4 |
| camera.ts:229-269 `screenToGround`, `projectAtPose`, `worldToScreen` | `projection.ts`, exact port, verified against `view.worldToScreen` | 3.4, 8.6 |
| camera.ts:79-97 `clampSideQuestsPitch` | pure TS on the pose forward vector | 5.9 |
| server.ts:12 THREE, :16 troika `Text`, :73 woff font, :124 `makeGlyph` | HUD BitmapText pool, woff2 font | 5.3 |
| server.ts:149 `field.scene.add`, :541 `field.scene.remove` | `layers.hud.addChild`, `removeChild` | 5.3 |
| server.ts:174-176, :191-194 camera axes from the quaternion | `field.cameraAxes(out)` | 5.2 |
| server.ts:200-278 Vector3 math (`corner`, `wordPoint`, `charPoint`, `nearestFree`) | tuple math, same formulas | 5.2 |
| server.ts:331 `setRGB(..., SRGBColorSpace)` | raw sRGB tuple to tint | 5.3 |
| server.ts:350-372 `setTint` and `writeLanes` every frame | uniforms every frame; instance data at claim and release | 5.2 |
| server.ts:413-418 troika `blockBounds` measure | BitmapText measured advance and line box | 5.3 |
| leaflink.ts:14, :105-110, :114-234, :730-769, :1027-1029 | pins batch, raw sRGB, bit | 5.4 |
| sidequests.ts:8, :151-208, :230, :515 | markers batch, `Geometry3D` with `colors` | 5.5 |
| shaders lane.vert.glsl, lane.frag.glsl | `pxLane` bit | 4.4 |
| stub.ts:29-35 THREE.Scene, PerspectiveCamera | renderer-neutral stub, `layers: null` | 5.11 |
| vite.config.ts `manualChunks` three, troika, world | `pixi.js`, `@pixi/3d`, `/src/world/` into `world` | 8.2 |
| package.json three, troika, @types/three | removed; pixi.js 8.23.0 and @pixi/3d 0.1.0 added | 9.2 |
| tests/world.engine.spec.ts (`info()` shape) | rewritten to the 8.4 contract | 8.4 |
| tests/scenes/sidequests-harness.html:15, :35-36 | mock without three | 5.11 |
| src/motion/guestbook.ts:19 imports camera.ts, which imports three | imports `variant.ts` | 5.11 |
| layouts/sidequests.ts `projectToFineScreen`, `readoutClearZone` | unchanged; re-verified against `projection.ts` | 8.6 |
| copy.ts:57 C-NOGL "needs WebGL2" | stays true under D4; no copy change | 7 |

### 5.2 Server words formed from lanes, and K-SRV-6

- Today: every frame a word is lit, `writeLanes` writes every word-lane offset and `gbTex.needsUpdate = true` uploads the texture (lanefield.ts:1554; server.ts:353-373, :425-462; lane-c 05-limits-unknowns.md:9). S11 names this class of issue a kill (S11:61).
- The offset per lane is a closed form of a few per-word values (server.ts:326-351): `tip' = rest + (charPoint - rest) * op`, with `charPoint = center + camRight * kAdvance`. `center` is the word's drift point after the phone clamp (`wordPoint`, server.ts:238-243), `kAdvance = (index - (len - 1)/2) * advance` (server.ts:246-249), and `op` is the word opacity (server.ts:108-112).
- Disposition: FIXED by redesign, not inherited.
  - At claim (spawn, every `wordCadence` 1100 ms) and at release, write `instance.lane.y = slot + 1` and `instance.lane.z = kAdvance` for the claimed lanes, with one `instanceData.update(first, count)` per contiguous run. Nothing else is uploaded.
  - Every frame, write uniforms only: `w<slot> = (center.xyz, op)`, `t<slot> = (rgb, 0)` and `uCamRight` from `field.cameraAxes`. The vertex bit computes `rest` as the lane tip at the current weights (the point `laneTip` returns) and applies the formula. The fragment applies the DESIGN 6.15 lane tint rule: colour mixes toward the word colour and alpha lifts toward the tip, both by opacity (DESIGN.md:318).
  - Behaviour kept: lanes the guestbook holds are skipped (`held`); a guestbook write takes a lane back from words (lane-c 05-limits-unknowns.md:48); pause, hide and travel exit fade over `motion.ms.fast` and then release (DESIGN.md:318).
- One difference to review: today `rest` is snapshotted at spawn; the fork reads the tip at the current weights. While a word lives the server weights are constant, because travel pauses and fades the words first (server.ts:469-480), so the two agree except during glitter (DESIGN.md:277). G-PX-WORDS checks the CPU reference `tip'` (server.ts formulas) against the HUD glyph position within 0.5 CSS px, glitter off.
- Gate G-PX-UPLOAD (8.6): during 5 s of server idle with words, `laneInstance` uploads happen only on claim and release frames, `layout` and `activity` stay at 0.

### 5.3 Troika replacement: HUD glyph atlas

- Choice: a pre-rendered atlas. `BitmapFont.install(...)` from Commit Mono 400, loaded through `Assets.load({ src, data: { family } })` (lane-b 02-v8-core-surface.md:110; lane-b 03-skill-extracts.md:100), installed once with the character set of `T.world.server.words` only (no new strings). A pool of `T.world.server.wordPool x GLYPHS_PER_SLOT` `BitmapText` nodes in `layers.hud` (server.ts:74, :143-153).
- Why an atlas and not ContainerTexture: per-frame-changing text belongs in BitmapText (lane-b 02-v8-core-surface.md:110). All glyphs share one atlas texture, so they batch into one 2D draw, which matters against `drawCallsMax` 12 (DESIGN.md:1040). A ContainerTexture redraws its container on every render (raw/api/rendering.ContainerTexture.html.md:8-12), a cost per word slot with no gain.
- Placement each frame: the glyph's world point from 5.2, projected by `projection.ts` to canvas CSS px, written to the HUD node's `position`. Scale: `fontSize` is fixed once per variant at the largest projected glyph height along the word path (derived from `T.world.server.wordSize` and the poses, no new token) and scaled down per frame, never up. Colour: white fill, `tint` per frame from `colorAt` (server.ts:101-106), `alpha` from opacity.
- The HUD draws over the view (lane-a 02-api-surface.md:20). Words need no occlusion by lanes; lanes write no depth today.
- Font file: woff2 (troika needed the woff, lane-c 04-replacement-surface.md:67). `public/fonts/commit-mono-latin-400-normal.woff` stays only if another consumer exists; B10.6 checks with grep.
- UNVERIFIED: the options of `BitmapFont.install` (B10.1 item P1-7, tsc and render). Fallback F-TEXT: one plain `Text` per glyph with an explicit non-black fill (lane-b 03-skill-extracts.md:100), accepting more 2D draws as long as A5 holds.
- The phone clamp (`clampToView`, server.ts:201-236) ports as is on tuples, through `projection.ts` and `viewportCss`.

### 5.4 LeafLink

- Simulation, routing, state machine and test hooks port as is (lane-c 04-replacement-surface.md:79).
- Pins, halos, ripples: one `BatchedMesh3D({ size: 3 * T.world.leaflink.maxPins, instanceData: { pin: vec4 } })` (24 per kind today, lane-c 04-replacement-surface.md:75). Geometry: `PlaneGeometry({ width: 1, height: 1 })` laid flat by the slot matrix (rotated -PI/2 about X, lane-a 02-api-surface.md:32). Three `FlatMaterial`s (pin, halo, ripple) with textures drawn once from `Graphics` through `renderer.generateTexture` (lane-b 02-v8-core-surface.md:113, :118), `alphaMode: 'blend'`, `state.depthTest = false`.
- Bit `pxPin`: in `beforeTransform`, `position.xy *= instance.pin.x` (scale for the landing drop from 1.6x, DESIGN.md:176); in `fragment.material`, `alpha *= instance.pin.y` (opacity). Slot variable names VERIFIED (raw/guides/extras_materials.html.md:119-120).
- Matrices are written at spawn only. Per frame, `instance.pin` is written for at most 72 slots with one `update(0, 72)`, replacing `kind.setX` and `needsUpdate` (leaflink.ts:730-769).
- Unused slots are parked with `setPassesAt(i, 0)` (4.6).
- Tap-to-offer uses `projection.ts` `screenToGround`, an exact port of camera.ts:230-241.
- Draw calls: three materials with different textures, so up to 3 draws, as with today's 3 meshes.

### 5.5 SideQuests

- Simulation, spring (damping 0.7, 3.2 Hz), trails, follow and `headScreen` port as is (lane-c 04-replacement-surface.md:91).
- Heads: an octahedron `Geometry3D({ positions, colors, indices })`, 6 vertices and 8 faces, `colors` VERIFIED (raw/api/geometry.Geometry3DOptions.html.md:76-78), two-tone by face centroid as today (sidequests.ts:151-168). Poles: `CylinderGeometry({ radiusTop, radiusBottom, height })` (lane-b 02-v8-core-surface.md:133).
- One `BatchedMesh3D({ size: 6, instanceData: { claim: vec4 } })`: slots 0 to 2 are heads with `FlatMaterial({ vertexColors: true, extraBits: [pxHead] })` (option VERIFIED, raw/api/materials.BaseMaterial3DOptions.html.md:327); slots 3 to 5 are poles with a `FlatMaterial` in `chalk2`. All in the OPAQUE pass. Two draws, as today.
- The `onBeforeCompile` signal injection (sidequests.ts:169-196) becomes bit `pxHead` with material fields `signal`, `signalDim` and `instance.claim`, mixed into `albedo` in `fragment.material`.
- Bob and spring move markers by rewriting 6 slot matrices per frame through `matrices.data` and one `update(0, 6)`. This is the only per-frame matrix write; 6 slots, counted under `uploads.markers`. Under reduced motion bob is off (DESIGN.md:186), so nothing is written.
- Pitch band: `clampSideQuestsPitch` ports to tuples in `projection.ts`; T-SQ-CAM-1 asserts every sampled frame (DESIGN.md:202).
- DOM twins are unchanged, positioned from `headScreen` through `projection.ts` (lane-c 04-replacement-surface.md:92).

### 5.6 Guestbook and word hooks

- Interfaces unchanged (`GuestbookHooks`, `LaneWordHooks`, types.ts:101-127). `GuestbookSheet.tsx` and `motion/guestbook.ts` stay renderer-free (lane-c 04-replacement-surface.md:10).
- `guestbook.writeLanes(lanes, offsets)`: writes `instance.offs.xyz` and sets `instance.lane.w = 1` for the given lanes; lanes written before and missing now return to zero; one `update(first, count)` per dirty run. Writes happen per frame only while the director animates letters with the sheet open, bounded by `guestbook.nameMaxChars + guestbook.lineMaxChars` lanes (lane-c 03-theme-tokens.md:5). They count in `uploads.laneInstance` and are reported, not hidden.
- `guestbook.setCamera(c)`: dolly, yaw, rise and the `shiftMix` blend feed the same pose path; the shift goes through 3.4.
- `words.held(lane)` reads `instance.lane.w`. `words.texel(lane)` returns that slot's `instance.lane` and `instance.offs` for debug (T-SRV-7).
- `setDim`, `setPart`, `render`, `reduced`: uniforms and a demand-mode render.

### 5.7 404

Scatter layout, no-op controller (lane-c 02-code-graph.md:59). The shelf is hidden with `visible = false`, never removed (lane-a 02-api-surface.md:69).

### 5.8 The shelf (new)

- Server scene only. A `Container3D` named `shelf` under `view.root` with two panel `Mesh3D`s, LeafLink then SideQuests, in `SCENE_ORDER` (lane-c 01-repo-map.md:52).
- Panel geometry: one `Geometry3D` cylinder strip (positions, uvs with `v` growing upward, indices), shared by both panels. A ContainerTexture shows upright where `v` grows upward (raw/api/rendering.ContainerTexture.html.md:17-21).
- Panel material: `new FlatMaterial({ baseColorTexture: panelTexture })`, opaque, with `panelTexture = new ContainerTexture({ container, resolution, renderer: app.renderer })` (raw/api/rendering.ContainerTexture.html.md:26-31, :42-48). ContainerTexture is UNVERIFIED at runtime in this pool, per review F-003: documented, not exercised. P1-13 proves it before B10.8; the shelf is BLOCKED until then. The container's first child is a full backdrop in the destination regime's raised ground (`paper.raised` for LeafLink, `field.raised` for SideQuests; lane-c 03-theme-tokens.md:44, :48), so no transparent texel draws black (raw/api/rendering.ContainerTexture.html.md:14-15; lane-b 03-skill-extracts.md:155).
- Panel content: a live 2D miniature of the destination, drawn with `Graphics` from data that already exists: the LeafLink lattice side data from `layouts/leaflink.ts` and the SideQuests campus side data from `layouts/sidequests.ts` (lane-c 02-code-graph.md:140-143), in that regime's line colour (`ink` on paper, `chalk` on field). Pins stay unlabeled, markers generic, feeds simulated (lane-c 05-limits-unknowns.md:46). No text inside panels; scene names live in the DOM Keymap.
- Live, not per frame: `autoUpdate` stays false. `panelTexture.render()` runs before the scene render, never during it (raw/api/rendering.ContainerTexture.html.md:335-337): on LeafLink heartbeat events (seeded 1000 to 1600 ms, DESIGN.md:176) and once for SideQuests. At most one panel render per frame. Under reduced motion each panel renders once.
- Placement rule, with no new numbers in code: panel positions, radius and arc come from new `shelf.*` tokens (6.7), chosen so that at every server pose (fine and coarse, at the idle-yaw and parallax extremes, DESIGN.md:1127) the projected panel bounds miss the readout clear zone (T-SRV-2) and the word drift box. Verified geometrically by G-PX-SHELF (8.6), the same method as the DESIGN 1.0.3 and 1.0.4 changelog entries.
- Hue: panels add blue area to the server scene; T-SRV-5 (`hueBudgetPct.server` 30, lane-c 03-theme-tokens.md:84) must still pass, which bounds panel size.
- Drag: on the canvas outside the DOM, with `globalpointermove`, ending on `pointerup` and `pointerupoutside`, points copied with `copyFrom` (lane-b 03-skill-extracts.md:82-86). Drag changes the yaw of the `shelf` container (a transform, no buffer write). Release snaps to the nearest panel with `easeSignature` over `motion.ms.travel`; velocity decays with `damp` (tween.ts; lane-c 04-replacement-surface.md:111). No overshoot: the server signature is Lockstep, and only SideQuests may overshoot (DESIGN.md:173-177). Good Stuff's springy overshoot (SYNTHESIS.md:29) is therefore not adopted.
- Input conflicts: the GLITTERBOX hold is a press without movement for `glitter.holdMs` (DESIGN.md:277); a drag past `shelf.dragSlopPx` cancels the hold and spins the shelf. LeafLink tap-to-offer is on another scene.
- Tap: panel `eventMode = 'static'`, `cursor = 'pointer'`, `on('pointertap', ...)` checking `e.button === 0` (lane-a 02-api-surface.md:67; lane-b 03-skill-extracts.md:161). Tap calls `router.go(scene)` and the existing travel runs (lane-c 02-code-graph.md:73-85); the panel recedes while the field re-forms.
- Keyboard and screen readers: no new DOM control. The Keymap already routes 1, 2, 3 and the arrows, with `aria-current` (lane-c 01-repo-map.md:64). The canvas stays `aria-hidden`.

### 5.9 Camera rig

`CameraRig` keeps its math (poses, lerp, idle yaw, drift, parallax, focus offset; camera.ts:34-66, :151-218) on plain `[x, y, z]` tuples in `projection.ts`. `applyPose` becomes position, `lookAt`, `fovEff` and view offset (3.4). `projectAtRest` uses a scratch pose in `projection.ts` instead of a scratch camera (camera.ts:243-262). `currentPose()` and `__lanefield.cameraPose()` are unchanged.

### 5.10 Lanefield interface after the swap

- Removed: `scene: THREE.Scene` and `camera: THREE.PerspectiveCamera` (types.ts:178-179).
- Added: `layers: WorldLayers | null`, where `WorldLayers = { root3d: Container3D; hud: Container }` is declared in `src/world/pixi/layers.ts` (the only Pixi types the seam names); and `cameraAxes(out: { right: [number, number, number]; up: [number, number, number]; forward: [number, number, number] }): void`.
- Controllers create 3D or HUD content only when `layers` is non-null and keep simulating when it is null, the same guard server.ts uses for hooks today (server.ts:139-140).
- Every other member keeps its signature (types.ts:129-181).

### 5.11 Test seams

| Seam | Today | Fork | Gate |
|---|---|---|---|
| `currentVariant` | src/motion/guestbook.ts:19 imports `../world/camera`, which imports three (camera.ts:5; triage F5) | moved to `src/world/variant.ts` (tokens only); camera.ts re-exports it; guestbook.ts imports `../world/variant` | G-PX-SEAMS |
| SideQuests harness | imports three and builds `THREE.Scene`, `THREE.PerspectiveCamera` for the mock (tests/scenes/sidequests-harness.html:15, :35-36; triage F4) | the mock passes `layers: null` and `cameraAxes` from `projection.ts`; real mode builds the Pixi field | G-PX-SEAMS, `tests/scenes/sidequests.spec.ts` |
| `stub.ts` | three-based, used by travel tests (stub.ts:29-35; lane-c 02-code-graph.md:159) | renderer-neutral: no three, no Pixi, `layers: null`, full interface | G-PX-SEAMS, `tests/travel.spec.ts` |
| server.spec | real controller against a stub field | same pattern; the stub provides `cameraAxes` | `tests/scenes/server.spec.ts` |

---

## 6. HUD, chrome, theme

### 6.1 Astryx integration (agent-first)

- Astryx stays 0.7.1 as pinned (lane-c 03-theme-tokens.md:12-15). The 0.7.14 upgrade is a separate spec change, outside this fork (lane-c 05-limits-unknowns.md:27).
- Unchanged: the lane theme, `laneTheme.mjs`, the built `lane.css`, Theme `mode` from `data-regime` (lane-c 03-theme-tokens.md:18-30).
- One token source: Pixi 2D and 3D colours read `T` from `src/tokens.generated.ts`, the same data the lane theme reads. No hex in Pixi code (G-TOKENS, lane-c 03-theme-tokens.md:82).
- Agent-first: every new `src/world/pixi/*` file is mapped in `agents/ownership.json`, and `node tools/agent-map.mjs build` is rerun. Build cards follow the PixiJS skill router discipline: name the router topics a card touches and read each before writing code for it (lane-b 03-skill-extracts.md:13-18). Installing `pixijs-skills` (lane-a 02-api-surface.md:7) is new external tooling and needs Justin's approval (AGENTS.md section 4); until then, cards read the saved v0.1.0 guides in `probe-f1/raw/` as the router.

### 6.2 Typography

Commit Mono only. The DOM gets it through the lane theme (lane-c 03-theme-tokens.md:72-76); Pixi 2D through `Assets.load` of the woff2 with `data: { family }` before any text exists (lane-b 03-skill-extracts.md:100). The miniature scale from the Corentin extract is not adopted (SYNTHESIS.md:21).

### 6.3 HUD system

- The DOM chrome is the editorial layer and stays unchanged (Readout, Keymap, Wordmark, sheets).
- The Pixi 2D layer carries only marks bound to 3D points: server glyphs (5.3), panel hover labels (6.5), the shelf affordance (6.4). Marks that are not projected points snap to `T.space` grid tokens.
- Flat: no shadows, gradients or elevation in 2D (SYNTHESIS.md:14; lane theme shadows `none`). Depth belongs to the view.
- Easings: DESIGN 6.1's two curves only, `ease` and `easeSignature` (DESIGN.md:144-149). The extracted Corentin and Good Stuff easings (SYNTHESIS.md:28-30) are measured values of other brands and stay out, by the same rule as palettes.
- Hover changes colour only, never scale (DESIGN.md:194). Hover for 3D content lives in Pixi pointer events, not CSS (SYNTHESIS.md:23).

### 6.4 Copy

- No string outside S09. The fork adds no visible string on its critical path. C-NOGL stays true under D4 (copy.ts:57; lane-c 04-replacement-surface.md:112).
- Shelf affordance: Good Stuff's drag hint text (goodstuff/style-brief.md:56) would be new copy. Until Justin approves an S09 row, the affordance is a non-text mark (two chevrons drawn with `Graphics` in `void.text2`) under the shelf, aria-hidden, hidden under reduced motion. Proposed S09 row for approval: `C-SHELF-HINT`, wording left to Justin.
- Not built in v1 because each needs new copy: the two-button hero and tag chips (SYNTHESIS.md:12).

### 6.5 Tooltip-first discovery: HYPOTHESIS

- Status: a hypothesis, not extracted evidence (SYNTHESIS.md:11; triage F6). No Bruno Simon claim supports it.
- Mechanism: fine pointers only. `pointerover` on a panel shows a 2D label pinned above it through `projection.ts`, with text from existing scene H1 copy IDs (no new string), appearing with a colour change within `--duration-fast` 150 ms (DESIGN.md:156).
- Guardrails: nothing lives only in the label (every fact is DOM text, DESIGN.md:190); coarse pointers never see it; the label is aria-hidden.
- Mechanism test: Playwright hovers each panel's projected centre; the label appears within 250 ms (DESIGN.md:194) and leaving hides it.
- Falsification of the hypothesis: G-ANTI gets one scripted question for the taste judge, "From these screenshots alone, can you tell the two panels lead to two projects?", shown screenshots without hover. If the answer is no while the hover screenshots answer yes, discovery depends on hover, and the panel needs a visible non-hover cue before ship.

### 6.6 Reduced-motion state machine (D1 detail)

States `full` and `reduced`, driven live by `prefers-reduced-motion` through `src/lib/reducedMotion.ts` (S10:15). A change takes effect on the next frame in both directions; `setReducedMotion(on)` exists on the field and the controllers (types.ts:135; server.ts:523-533).

| Element | full | reduced | Test |
|---|---|---|---|
| Render loop | ticker | demand: render only on resize, travel, interaction (DESIGN.md:188) | T-S10-3 |
| Lane pulses (Lockstep, fire) | animated | frozen at fixed phases (`uFrozen`, DESIGN.md:184) | T-S10-3 |
| Server words | spawn, drift, fade | three statics at `reducedWordAt` on bent, tinted lanes (DESIGN.md:184, :318) | T-SRV reduced tests |
| LeafLink events | heartbeat | 6 pins and 3 routes placed, no new events (DESIGN.md:185) | T-LL reduced tests |
| SideQuests bob and spring | on | off; a tap lights the trail instantly (DESIGN.md:186) | T-SQ reduced tests |
| Camera idle yaw, drift, parallax | on | off (DESIGN.md:187) | T-S10-3 |
| Travel | 700 ms morph and camera | cut, DOM crossfade 150 ms (DESIGN.md:183) | G-TRAVEL reduced |
| Shelf ambient | none | none | G-PX-REDUCED |
| Shelf drag | continuous yaw, snap with `easeSignature` | no continuous motion: a drag past `shelf.dragSlopPx` or an arrow key selects the next panel with a cut (instant yaw change), because K-S10-4 kills any reduced-mode motion other than opacity crossfades (S10:41) | G-PX-REDUCED |
| Panel focus and tap | panel recedes during travel | cut with the travel cut | G-PX-REDUCED |
| Panel live content | event-driven re-render | one render, then static | G-PX-REDUCED |
| Glitter | on | off (DESIGN.md:277) | existing tests |
| Guestbook | DESIGN 6.14 | DESIGN 6.14 reduced rules | T-GB-6 |
| Fallback content | DOM readout | identical DOM readout | T-S10-4 axe |

### 6.7 New tokens (DESIGN.md change, version 1.8.0)

Names only here. Card B10.8 sets values by geometric verification, records them in the DESIGN.md changelog with the receipt, and runs `npm run gen`; generated files are never edited by hand.

`shelf.radius`, `shelf.arcDeg`, `shelf.panelSize` [w, h], `shelf.center` [x, y, z] per variant, `shelf.dragSlopPx`, `shelf.snapMs` (equal to `motion.ms.travel` unless the receipt says otherwise), `shelf.panelResolution`, `shelf.hintGap`. The `budgets` block is not edited by this fork (8.2).

---

## 7. Decisions

Each decision has a choice, its evidence, and a falsification test that would reverse it. None is left open.

### D1 Reduced motion: per-element reduced states

- Choice: per-element states, extending DESIGN 6.4 (DESIGN.md:179-190) with the shelf rows in 6.6.
- Evidence: the shipped design already defines reduced motion per element, with a live listener, demand rendering and a pixel-identity test (DESIGN.md:179-190; S10:15, :49). The kill list forbids any reduced-mode motion other than opacity crossfades (S10:41), which rules out "reduced ambient only" and "reduced camera only", because both leave drag-driven shelf motion. A full static fallback (poster) would throw the world away under reduced motion, while S10 requires the world to render in demand mode (S10:15). The design extracts yielded no measured reduced-motion rule (SYNTHESIS.md:39).
- Falsification: T-S10-3 (two screenshots 2 s apart pixel-identical on every scene under `reducedMotion: 'reduce'`) or G-PX-REDUCED fails for a shelf state that a cut cannot make still. Then the shelf is hidden under reduced motion (the DOM Keymap still navigates), and DESIGN 6.4 records that row.

### D2 Physics: none

- Choice: no physics library. Shelf inertia uses the existing `damp` and `easeSignature` (tween.ts, portable, lane-c 04-replacement-surface.md:111).
- Evidence: PixiJS 3D ships no physics (lane-a 03-limits-unknowns.md:14; lane-d 04-adjacent-comparison.md:11). Nothing in sections 1 to 6 collides two bodies. New dependencies need Justin's approval (AGENTS.md section 4). The only overshoot allowed is SideQuests' spring (DESIGN.md:177), already in tween.ts.
- Loading and teardown rules: none needed, there is no library.
- Runnable tests for the actual claims, per review F-007: `node -e "const p=require('./package.json');console.log(Object.keys({...p.dependencies,...p.devDependencies}).filter(k=>/physics|matter|cannon|rapier|planck/i.test(k)).length)"` expected `0`; no `Physics` or collision import in `src/` by grep, expected `0` matches. Reopen criterion, not a falsification test: an approved feature needs contact between two or more moving bodies, or a constraint solver. Then reopen with a pinned library under the loading and teardown rules OPEN-DECISIONS.md:10-11 asks for.

### D3 Audio: none

- Choice: no audio.
- Evidence: PixiJS 3D ships no audio (lane-a 03-limits-unknowns.md:15); Pixi `Assets` resolves audio files to null (lane-b 02-v8-core-surface.md:35); new dependencies need approval; every fact must work silently and as DOM text (DESIGN.md:190; S10:7); the current site has no audio, so no baseline exists to regress against.
- Runnable tests for the actual claims, per review F-007: no `AudioContext` or `new Audio` in `src/` by grep, expected `0` matches; no audio file in `public/` or `src/assets`, expected `0`; every interaction in sections 1 to 6 has a visual state and a DOM text or polite live-region equivalent, checked by T-S10-1. Reopen criterion, not a falsification test: Justin approves an interaction whose feedback cannot be carried visually and in a polite live region (S10). Then reopen with autoplay, mute and teardown rules.

### D4 Renderer backend: WebGL2 only, conditional on the device-matrix probe

- Choice: `preference: 'webgl'`; the WebGPU backend is not imported (`skipExtensionImports` plus `@pixi/3d/webgl`); the backend is asserted after init (3.1). CONDITIONAL, per review F-001: this choice is the shipped default only, and stays blocked for the build cards until B10.1 runs the WebGL2/WebGPU matrix on the required devices, reference iPhone and desktop Chrome, with the executable command, exact oracle, and receipt in P1-14. The governing decision record, OPEN-DECISIONS.md:17-19, requires backend selection only after those measurements, and this spec does not override it.
- Evidence, keeping the three facts separate (triage F2; lane-c 04-replacement-surface.md:106):
  1. Design positioning: PixiJS 3D is WebGPU-first (open-beta blog, as normalised in lane-c 04-replacement-surface.md:106).
  2. Runtime default: an omitted preference tries WebGL2 first (lane-a 02-api-surface.md:10).
  3. Production recommendation: the v8 docs list WebGL as Recommended and stable and WebGPU as Experimental (lane-b 02-v8-core-surface.md:14; lane-b 04-limits-unknowns.md:32-36).
  Further: the probe ran WebGL2 only and no WGSL ever executed (02-probe:40-41); a WebGPU `app.init` throws instead of falling back on a GPU without `indirect-first-instance` (lane-a 02-api-surface.md:70); the S00 iPhone WebGPU buffer-limit evidence (lane-c 04-replacement-surface.md:104) is unmeasured under Pixi (03-probe:6) and is avoided entirely by not shipping WebGPU; the CI environment cannot run WebGPU (02-probe:6), so a WebGPU path would ship untested, against "no gate that cannot be run".
- C-NOGL ("The 3D view needs WebGL2.") stays accurate; no copy change.
- Falsification: P1-14, the device-matrix probe, runs the WebGL2/WebGPU matrix on the reference iPhone and desktop Chrome with the S00 buffer-limit check. Reversal threshold: none is set here. The 20 percent bar in the prior draft was invented and is struck. A reversal threshold is derived by the probe card from an approved requirement or from the measured variance across the matrix runs, and is recorded in `probe-f1/04-probe2-results.md` before any decision is drawn from it. Then D4 and D5 reopen together as one spec change.

### D5 Shader language: GLSL only

- Choice: every bit carries `gl` code only; `gpu` is omitted.
- Evidence: a bit missing a backend silently runs nothing on it (01:58-59; lane-a 03-limits-unknowns.md:37). Under D4 the WGSL backend never runs, so WGSL would be untestable dead code doubling the highest-risk surface (OPEN-DECISIONS.md:22; lane-c 05-limits-unknowns.md:29). The probe's WGSL never executed (02-probe:41). The existing shaders are GLSL ES 3.0 (lane-c 04-replacement-surface.md:96), so GLSL keeps the port line for line where slots allow.
- Guard against the silent trap: the backend assertion (3.1) makes GLSL-only fail loudly (null field, S10 fallback) instead of drawing nothing.
- Falsification: D4 reopens through its falsification test, or P1-15 finds a GLSL construct the WebGL2 path rejects that WGSL would not. P1-15 is a WebGPU/WGSL probe in `probe-src`, never in the product: `npx vite build` and a headless render of the WGSL port of `pxLane` on desktop Chrome with WebGPU enabled, expected output is a rendered frame with the same pixel counts as the GLSL run within 1 percent, or a named compile error. Then D5 reopens with D4. Note, per review F-002: this choice supersedes plan-masterspec.md task 2, which required WGSL plus GLSL. The plan is amended in the same change: task 2 now reads "custom ShaderBit GLSL only under D4, WGSL only as the P1-15 probe".

### Derived decisions (lane-c 05-limits-unknowns.md:51-62)

| # | Decision | Choice | Evidence | Falsification |
|---|---|---|---|---|
| X1 | Astryx target | 0.7.1 as pinned | lane-c 03-theme-tokens.md:12-15 | Justin lands 0.7.14 as its own spec change first |
| X2 | Troika replacement | BitmapText atlas in the HUD | 5.3 | P1-7 fails and F-TEXT breaks A5 |
| X3 | Lanefield interface | drop `scene`, `camera`; add `layers`, `cameraAxes` | 5.10 | a controller needs a renderer type the seam cannot express |
| X4 | Debug contract | re-specified (8.4); tests updated, not deleted | 01:225-229; lane-c 05-limits-unknowns.md:34 | none needed: the contract is a spec choice |
| X5 | World chunk budget | 220 kB gzip unchanged, acceptance A1 | DESIGN.md:1037; AGENTS.md section 4 (never edit a budget to get green) | A1 fails after the mitigations: Justin decides a budget change through a BLOCKED line, not the build |
| X6 | C-NOGL | unchanged | D4 | D4 reopens |
| X7 | B6a block, Readout wiring gap | B6a: superseded by the clear-colour rewrite (3.6), re-earned by T-SRV-2 at both viewports. Server and 404 Readout wiring: carried, out of scope | BUILD-STATE.md:224, :227; lane-c 02-code-graph.md:160 | T-SRV-2 fails at either viewport after 3.6 |
| X8 | Stub | renderer-neutral | 5.11 | travel tests need renderer state the stub cannot model |
| X9 | three r187 | moot: three is removed; the provisional F10 claim needs no decision | lane-d 04-adjacent-comparison.md:18 | the fork is abandoned and three kept |
| X10 | Post-processing | none in v1 | float target gate (lane-a 03-limits-unknowns.md:26); graph rebuild and recompile on toggle (:52); A5 draw budget | a later approved card adds one `afterToneMapping` effect and passes A4, A5, A7 |

---

## 8. Measurement and gates

### 8.1 Protocol, instantiated (MEASUREMENT-PROTOCOL.md)

| Step | Variant | What runs | Output |
|---|---|---|---|
| M0 build | 2d75332 in a separate worktree | command block M0 below | `qa/pixi/m0/base-build.log` |
| M0 bundle | baseline | `tools/pixi/bundle-report.mjs` (created by B10.0): raw, minified and gzip per chunk, attributed by module path to pixi.js, @pixi/3d, three, troika, text, world engine, HUD | `qa/pixi/m0/bundle.txt` |
| M0 Lighthouse | baseline | `tools/pixi/lh-run.mjs` (created by B10.0): lighthouse 13.5.0 from devDependencies, mobile preset with simulated throttling (S11:13), 3 cold runs per route, records version and settings | `qa/pixi/m0/lh/*.json`, `summary.txt` |
| M1 bundle and Lighthouse | fork | same scripts | `qa/pixi/m1/` |
| M1c renderer comparison | fork with the 2d75332 content only, no new shelf or HUD behavior | same scripts, same routes as M0 | `qa/pixi/m1c/`; this is the controlled Pixi-versus-Three comparison, per review F-004. M1 is full-product acceptance, not the comparison. |
| M2 device | fork, LAN preview | `npx vite preview --host --port 4173`; the phone opens `http://<lan-ip>:4173/?perf=1` and runs the S11 section 5 script; export with `?perf=1&dump=1` | `qa/device/<device>-<date>.json` |
| M3 backend matrix | fork | WebGL2 only (D4): Chrome desktop, Safari desktop, Chrome Android if available, Safari on the reference iPhone | rows in `qa/device/README.md` |

```
# M0 baseline build
git worktree add /tmp/pp-base 2d75332
cd /tmp/pp-base && npm ci && npm run build > /tmp/base-build.log 2>&1; echo $? > /tmp/base-build.exit
cat /tmp/base-build.exit                       # expected: 0
node <fork>/tools/pixi/bundle-report.mjs /tmp/pp-base/dist > <fork>/qa/pixi/m0/bundle.txt
node <fork>/tools/pixi/lh-run.mjs --base http://127.0.0.1:4173 --routes /,/leaflink,/sidequests,/404 --runs 3 --out <fork>/qa/pixi/m0/lh
```

Rules (MEASUREMENT-PROTOCOL.md:14-15, :20-21): Lighthouse reports median and range, never one run. SwiftShader timings are never used for performance (S11:15; AGENTS.md section 7).

### 8.2 Acceptance, stated before any measurement

| # | Metric | Accept when | Source of the number |
|---|---|---|---|
| A1 | World JS: the `world` manual chunk, gzip, per S11:47, the existing metric. The fetched-chunk sum after `createLanefield` starts is recorded as a secondary number only, per review F-004, and never replaces the manual-chunk metric without a DESIGN.md and S11 update approved by Justin | at most 220.00 kB, delta against M0 reported, and the delta against M1c for the renderer comparison. Current receipt: 199.17 kB gzip, 707.56 kB raw (qa/w3-full-gates.log:43). Probe reference: minimal Pixi index chunk 187 kB gzip, including extras debug code (02-probe:30-33) | DESIGN.md:1037 |
| A2 | App shell JS | at most 110 kB gzip | DESIGN.md:1036 |
| A3 | Lighthouse per route, median of 3 cold runs | LCP under 2000 ms, TBT under 150 ms, TTI under 3000 ms, CLS under 0.02; performance score median at least the lowest of the 3 M0 baseline scores for that route | S11:40-43; the floor rule is set here |
| A4 | Real-phone p95 frame time on the reference iPhone, every scene and during travel | at most 16.7 ms with governor final DPR at least 1.25. Kill: p95 over 16.7 ms at DPR 1.0 | DESIGN.md:1039; S11:61, :88 |
| A5 | Draw calls in any scene | at most 12 (GL-intercepted, 8.4); lane field exactly 1 | DESIGN.md:1040; S11:49 |
| A6 | GPU memory estimate | under 64 MB (ledger formula, 8.4) | DESIGN.md:1041; S11:51 |
| A7 | Long tasks | none over 50 ms from navigation start to 5 s after `ready`, none during 3 travels; includes shader compile | S11:44 |
| A8 | Console | 0 errors and 0 Pixi warnings during gate runs (a failed shader compile logs instead of throwing, probe main.ts:35-36) | 02-probe:27 |
| A9 | Programs | 0 `createProgram` calls after `ready` (GL-intercepted) | S11:50, re-specified |

A failing row is never fixed by editing its number. If A1 or A4 still fails after the named mitigations, the card writes `BLOCKED: <metric> over budget (<source>)` in BUILD-STATE.md and stops (AGENTS.md section 4).

Mitigations, in order, before BLOCKED:
- A1: confirm no extras or WebGPU chunk is fetched; the minimal `skipExtensionImports` set (P1-8); `manualChunks` puts the debug path (`?perf`, `?glcount`, `?debug=graph`) in its own lazy chunk.
- A4: governor DPR; F-SLOT (4.1); P1-5 confirmation of direct draw for the oversized view; panel re-render rate.
- A5: BitmapText atlas (5.3); park unused slots; panels share one geometry.

### 8.3 World-chunk budget, re-measured

M0 re-measures the baseline world chunk at 2d75332, because the W3 receipt predates the guestbook and lane-word work (lane-c 01-repo-map.md:183). M1 measures the fork with attribution (MEASUREMENT-PROTOCOL.md:11-12). M1c measures the content-equivalent renderer comparison. All numbers and deltas go in `qa/pixi/m1/bundle.txt` and `qa/pixi/m1c/bundle.txt`. No card in this spec changes the `budgets.worldChunkGzKb` number. The measured disposition, M0, M1, and M1c numbers with the delta, is re-recorded in DESIGN.md and S11 with a version bump and Justin's approval, per MEASUREMENT-PROTOCOL.md:11-12 and review F-004. S11:47's description of the chunk ("three, troika, engine") becomes "pixi.js, @pixi/3d, engine" as a text change to S11 with a version bump.

### 8.4 Debug contract, re-specified

There is no `renderer.info` equivalent (01:203-207). The debug tooling needs the view's internal graph or options pages that are not in the pool (raw/api/extras_debug.captureGraphDebugSnapshot.html.md:3-15; raw/api/extras_debug.RenderGraphDebugger.html.md:16-22; no `RenderGraphDebuggerOptions` page was saved), and recording adds CPU time to every frame (raw/guides/extras_debug.html.md:42). So the contract stops claiming Pixi numbers exist. It splits into what the engine knows (a ledger) and what the GL context can be observed doing (call interception). GL-call interception already has precedent in this repo's QA (BUILD-STATE.md:224).

`window.__lanefield` (types.ts:183-221), fork version:

| Member | Status | Source |
|---|---|---|
| `laneCount`, `layoutHash`, `weights()`, `cameraPose()`, `camera`, `frameStats()`, `dpr()`, `ready`, `silhouette?` | kept, same shape | engine |
| `info()` | re-specified: `{ calls, triangles, textures, programs, source }`. With `?glcount=1`, `source` is `'gl'` and the values come from `glcount.ts`, installed before `app.init`, which wraps the `WebGL2RenderingContext.prototype` draw calls (`drawElements`, `drawArrays`, `drawElementsInstanced`, `drawArraysInstanced`), `createTexture`, `deleteTexture` and `createProgram`, counted per frame. Without the flag, `source` is `'ledger'` and `calls` is the ledger's expected draw count (distinct geometry, material and texture groups in a pass, raw/guides/scene-7.html.md:47) | `glcount.ts` or `ledger.ts` |
| `info().geometries` | dropped (nothing observable matches it); `ledger().geometries` replaces it | ledger |
| `memoryEstimate()` | kept, ledger formula: layoutMap 3,145,728 B + activityMap 98,304 B + classMap 512 B + silhouette mask + lane instance data 6,144 x 2 x 16 B (196,608 B) + lane matrices 6,144 x 64 B (393,216 B) + pins and markers + panel textures (`w*h*resolution^2*4` each) + glyph atlas + drawing buffer `w*h*dpr^2*4*2` (S11:51), times the oversize factor if P1-5 finds an intermediate target | ledger |
| `ledger()` | new: per batch `size`, `inPass`, `parked`, `slotsWithoutPass`; materials created (constant after `ready`); textures created; uploads per frame per buffer (4.5); view resizes | ledger |
| `backend()` | new: `'webgl2'` | app |
| `graph()` | new, debug chunk only, once P1-11 verifies the `RenderGraphDebuggerOptions` and `GraphDebugSnapshot` fields: lane-batch draws and triangles read from the debugger | `@pixi/3d/extras`, lazy |

`?perf=1` (device HUD and dump) never installs `glcount.ts`, so device frame times are not perturbed. Tests that read `info()` pass `?glcount=1`.

`tests/world.engine.spec.ts` is rewritten to this contract, not deleted (lane-c 05-limits-unknowns.md:34).

### 8.5 B10.1 probe items (verified before build cards rely on them)

Run in an extended `probe-f1/probe-src`, WebGL2 SwiftShader for correctness; results go to `probe-f1/04-probe2-results.md` in the verdict format of 02-probe-results.md.

| Item | Question | PASS means | On FAIL |
|---|---|---|---|
| P1-1 | a 256x768 rgba32float BufferImageSource uploads and reads back unmodified | sampled values equal buffer values at 256 seeded texels, alpha class ids exact | BLOCKED (no other layout path) |
| P1-2 | `sampleXDirect` at texel centres addresses exactly with nearest filtering | as P1-1, through the `idx` formula, in all four layout bands | BLOCKED |
| P1-3 | a clip-space variable exists in `vertex.afterTransform` or `vertex.end` | the documented name compiles and moves vertices in clip space | world-space width path (4.4) |
| P1-4 | the `'blend'` state equals premultiplied One, OneMinusSrcAlpha | the pixel equals the closed form within 1/255 per channel | set the premultiplied blend mode explicitly and retest |
| P1-5 | an oversized, offset View3D renders and maps exactly; direct draw or intermediate target | G-PX-SHIFT passes in the probe; intermediate-target presence recorded | F-SHIFT-2 if P1-3 passed, otherwise BLOCKED |
| P1-6 | `ShaderBit.interStage` carries a varying from vertex to fragment | a value written in the vertex stage reads back in the fragment | recompute in the fragment (4.4) |
| P1-7 | `BitmapFont.install` with Commit Mono; `BitmapText` over a View3D; one draw for 72 glyphs | glyphs render; GL count shows one 2D draw for them | F-TEXT |
| P1-8 | minimal extension imports with `skipExtensionImports` | build, tsc and render pass with only `@pixi/3d/webgl`, `pixi.js/events` and the listed text extension | add the missing extension and re-measure A1 |
| P1-9 | context loss and restore | after `loseContext` and `restoreContext`, lanes render again (pixel) and programs are recreated | the engine re-uploads and re-warms (3.8) |
| P1-10 | `texture.source.update()` re-uploads a BufferImageSource | changed values read back | recreate the Texture on write, counted as an upload |
| P1-11 | `RenderGraphDebugger` options and snapshot fields | the lane-batch row's draws (1) are readable from code | `graph()` stays undefined; A5 relies on GL counts |
| P1-12 | CPU cost per frame of a 6,144-slot blend batch | recorded with `performance.now` around `app.render` on desktop Chrome on real hardware (not SwiftShader); the device number comes from M2 | input to the F-SLOT decision under A4 |
| P1-13 | ContainerTexture on the curved shelf panel, per review F-003 | construction, first render, manual render with `autoUpdate` false, curved-geometry orientation, cleanup, draw-count impact; all PASS with the exact pixel and GL counts recorded | fallback: pre-rendered atlas, or BLOCKED before B10.8 if the panel cannot render live |
| P1-14 | Device matrix, WebGL2/WebGPU, per review F-001 | reference iPhone and desktop Chrome, S00 buffer-limit check, p95 frame time per scene; command, oracle, and receipt recorded in `probe-f1/04-probe2-results.md`; reversal threshold derived from measured variance or an approved requirement, none invented here | D4 stays conditional until this passes; BLOCKED if WebGPU cannot run the matrix |
| P1-15 | WebGPU/WGSL port of `pxLane`, per review F-002 | `npx vite build` and headless render on desktop Chrome with WebGPU; rendered frame pixel counts within 1 percent of the GLSL run, or a named compile error | D5 reopens with D4 if a GLSL construct is rejected that WGSL accepts |

### 8.6 Gates

Each gate names its card, its command and the exact expected output. Test files are written first by the named card, before the code they test. Exit codes are read from files, never through a pipe (AGENTS.md section 5).

| Gate | Card | Expected output |
|---|---|---|
| G-PX-DEPS-ADD | B10.2 | `8.23.0 0.1.0` |
| G-PX-DEPS | B10.9 | `8.23.0 0.1.0 none none none` |
| G-PX-NOTHREE | B10.9 | `1` then `0` |
| G-PX-SEAMS | B10.3 | `0`, `0`, `0`, `0` on four lines |
| G-PX-TYPES | every card | `0` (only new diagnostics reported against the pre-edit run, AGENTS.md section 2 gate 4) |
| G-PX-BACKEND | B10.4 | `1 passed`: `__lanefield.backend() === 'webgl2'`; a forced non-WebGL renderer yields a null field and the S10 poster |
| G-PX-SHIFT | B10.4 | `9 passed`: 8 layout and variant poses plus the guestbook shift; 64 points each within 0.5 CSS px; target at `(0.5 + shift0/2) * W` |
| G-PX-CTX | B10.4 | `1 passed`: loss and restore, lanes render, `ready` true |
| G-PX-PASSES | B10.5 | `2 passed`: normal build has `slotsWithoutPass` 0 in every batch; `?fault=nopass:lanes:17` has `slotsWithoutPass` 1 and lane 17's tip pixel equals ground within deltaE 0.01 |
| G-PX-TEXEL | B10.5 | `1 passed`: 256 seeded lanes x 4 layouts, projected tip pixel lit with `?debug=tips` |
| G-PX-WIDTH | B10.5 | `1 passed`: 16 sampled server lanes measure within 0.5 device px of `classMap` width x dpr |
| G-PX-UPLOAD | B10.6 | `1 passed`: 5 s of server idle, `laneInstance` uploads only on claim and release frames, `layout` 0, `activity` 0 |
| G-PX-WORDS | B10.6 | `1 passed`: every lit glyph within 0.5 CSS px of the CPU reference tip, glitter off |
| G-PX-SHELF | B10.8 | `4 passed`: panel bounds miss the readout box and the word box at fine and coarse across yaw and parallax extremes; tap travels to `/leaflink` and `/sidequests`; hover label within 250 ms; a drag past the slop cancels the glitter hold |
| G-PX-REDUCED | B10.8 | `3 passed`: shelf cut on drag and arrow; panels static; two screenshots 2 s apart identical with the shelf visible |
| G-PX-COUNTS | B10.9 | every test passed, including `info().calls` at most 12 on every scene with `?glcount=1`, lane batch 1, `programs` after `ready` 0, materials constant after `ready` |
| G-PX-LONGTASK | B10.9 | `1 passed`: A7 on the Chromium desktop and phone projects |
| G-PX-CONSOLE | every Playwright gate | shared console fixture in `tests/pixi/`: 0 errors, 0 Pixi warnings (A8) |
| G-SCENES, G-WORLD, G-TRAVEL, G-CHROME, G-HUE, G-FALLBACK, G-COPY, G-TOKENS, G-CONTRAST | B10.9 onward | `0` |
| G-PX-BUNDLE (A1, A2) | B10.10 | `0`, then `world_fetched_gz_kb=<n> limit=220 PASS` and `app_shell_gz_kb=<n> limit=110 PASS` |
| G-PX-LH (A3) | B10.10 | `0`, and `qa/pixi/m1/lh/summary.txt` has 4 lines ending in `PASS` |
| G-PX-DEVICE (A4) | B10.11, run by Justin on the reference iPhone | `p95_max_ms=<n> dpr_final=<n> PASS` with n at most 16.7 and dpr at least 1.25 |
| G-ANTI | B10.11 | `taste-judge` verdict PASS in `qa/pixi/g-anti.md`, from screenshots of three scenes at desktop and phone plus the 6.5 question (S11 section 6) |

Commands, one block per gate, in table order:

```
# G-PX-DEPS-ADD
node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};console.log(d['pixi.js']+' '+d['@pixi/3d'])"

# G-PX-DEPS
node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};console.log([d['pixi.js'],d['@pixi/3d'],d.three||'none',d['troika-three-text']||'none',d['@types/three']||'none'].join(' '))"

# G-PX-NOTHREE
grep -rlE "from ['\"](three|troika-three-text)['\"]|import \* as THREE" src tests > /tmp/nothree.txt; echo $? > /tmp/nothree.exit
cat /tmp/nothree.exit
wc -l < /tmp/nothree.txt

# G-PX-SEAMS, per review F-005: zero-match grep exits 1, so each count is wrapped to exit 0
grep -c "world/camera" src/motion/guestbook.ts; true
grep -cE "pixi|three" src/world/variant.ts; true
grep -c "three" tests/scenes/sidequests-harness.html; true
grep -cE "pixi|three" src/world/stub.ts; true

# G-PX-TYPES
npx tsc --noEmit > /tmp/tsc.log 2>&1; echo $? > /tmp/tsc.exit
cat /tmp/tsc.exit

# Playwright gates, per review F-005: each run captures its exit code in a file
for f in backend projection context passes texel width uploads words shelf reduced longtask; do npx playwright test tests/pixi/$f.spec.ts > /tmp/pw-$f.log 2>&1; echo $? > /tmp/pw-$f.exit; cat /tmp/pw-$f.exit; done
npx playwright test tests/world.engine.spec.ts > /tmp/pw-engine.log 2>&1; echo $? > /tmp/pw-engine.exit; cat /tmp/pw-engine.exit

# Existing gates
npm run gates > /tmp/gates.log 2>&1; echo $? > /tmp/gates.exit
cat /tmp/gates.exit

# G-PX-BUNDLE
node tools/pixi/bundle-report.mjs dist --check > /tmp/bundle.log 2>&1; echo $? > /tmp/bundle.exit
cat /tmp/bundle.exit
tail -n 2 /tmp/bundle.log

# G-PX-LH, per review F-005: starts and stops its own preview server
npx vite preview --port 4173 > /tmp/preview.log 2>&1 &
PREVIEW_PID=$!
sleep 3
node tools/pixi/lh-run.mjs --base http://127.0.0.1:4173 --routes /,/leaflink,/sidequests,/404 --runs 3 --out qa/pixi/m1/lh --baseline qa/pixi/m0/lh --check > /tmp/lh.log 2>&1; echo $? > /tmp/lh.exit
kill $PREVIEW_PID
cat /tmp/lh.exit
grep -c PASS qa/pixi/m1/lh/summary.txt

# G-PX-DEVICE, per review F-005: concrete files, no placeholders
for f in qa/device/*.json; do node tools/pixi/device-check.mjs "$f" > /tmp/device.log 2>&1; echo $? > /tmp/device.exit; cat /tmp/device.exit; done

# G-ANTI, per review F-005: command and artifact
node tools/pixi/taste-judge.mjs --screenshots qa/pixi/g-anti-shots/ --out qa/pixi/g-anti.md > /tmp/anti.log 2>&1; echo $? > /tmp/anti.exit
cat /tmp/anti.exit
grep -c "verdict: PASS" qa/pixi/g-anti.md; true
```

The G-SCENES rerun includes T-SRV-2 at 1440x900 and 390x844 (B6a supersession, X7), T-SRV-5 hue with panels, T-S02-5, T-SQ-CAM-1, the T-LL tests, T-GB-6, and re-verification of `layouts/sidequests.ts` `projectToFineScreen` and `readoutClearZone` against `projection.ts` (lane-c 04-replacement-surface.md:110).

### 8.7 Spec gates (runnable now on this document)

| Gate | Expected output |
|---|---|
| S-1 | `OK` |
| S-2 | `0` |
| S-3 | `0` |
| S-4 | `1` |

```
# S-1: file exists
test -f pixi3d-phase0/MASTERSPEC.md && echo OK

# S-2: no em or en dashes, per review F-006: bare grep -c exits 1 on zero matches, so the check prints 0 on a clean file. grep -P \x{2013} is rejected by this grep build, so the check is Python.
python3 -c "s=open('pixi3d-phase0/MASTERSPEC.md').read(); print('FAIL' if '\u2013' in s or '\u2014' in s else 0)"

# S-3: no deploy command, per review F-006: the gate block itself contains the searched strings, so it scans the file with section 8.7 removed
sed '/^### 8.7/,/^### 8.8/d' pixi3d-phase0/MASTERSPEC.md | grep -qi -e "vercel deploy" -e "vercel --prod" -e "deploy to production" && echo FAIL || echo 0

# S-4: committed (goal-contract-phase1.json verification)
git log --oneline -1 > /tmp/s4.txt; grep -c MASTERSPEC /tmp/s4.txt
```

### 8.8 Coverage

Review findings (REVIEW-FINDINGS-TRIAGE.md):

| Finding | Addressed in |
|---|---|
| F1 exact API missing | 0.3 labels; 2.5; 4; 8.5 (every unverified item has a probe item and a fallback); Appendix B |
| F2 renderer semantics conflated | D4 (three facts kept separate) |
| F3 stale 14ab8df instructions | 0.2 pins at 2d75332; every repo citation at 2d75332 |
| F4 harness depends on three | 5.11, G-PX-SEAMS |
| F5 guestbook camera import | 5.11, G-PX-SEAMS |
| F6 Bruno claims promoted | 1.2; 6.5 (hypothesis with a falsification test); no Bruno-derived rule anywhere |
| F7 no comparison plan | 8.1, 8.2 (numbers fixed first), 8.3 |
| F8 reduced motion, physics, audio open | 6.6; D1, D2, D3 |
| F9 Lane B version unknowns | 0.2 (registry pins, lane-b 04-limits-unknowns.md:3); B10.2 records installed versions |
| F10 r187 provisional | X9 |

Probe verdicts (02-probe:13-28): app.init PASS (3.1); View3D and Camera3D PASS (3.2); RGBA32F PASS (4.3, P1-1); batch with instance data PASS (4.2); warmup ABSENT (3.5); off-center ABSENT (3.4); statistics, a PASS that records the absence (8.4); render PASS with both isolation controls (8.6 console fixture; 4.6 negative control).

Lane C touchpoints: every row is in 5.1.

---

## 9. Build, ship, rollout

### 9.1 Branch and boundaries

- Work branch: `pixi3d-fork-20261112`, created from `pixi3d-phase0-20261112` once this spec is approved. One commit per card, message `B10.<m>: <card title>` plus attribution lines (AGENTS.md section 6).
- Pull requests open as drafts against `pixi3d-phase0-20261112`. Claude never merges or deploys (AGENTS.md section 4; S11:93).
- Production stays untouched. No deploy step is part of this execution path. A hosted preview is not needed: G-PX-DEVICE runs against a LAN preview (`npx vite preview --host`), which publishes nothing. If Justin wants a hosted preview, that is a separate request needing explicit approval of the exact action (MASTERSPEC-ROUTING.md:43-44).
- Approvals required before the card that needs them: the new dependencies pixi.js 8.23.0 and @pixi/3d 0.1.0 (B10.2); DESIGN.md 1.8.0 tokens (B10.8); any S09 copy row such as `C-SHELF-HINT`; installing `pixijs-skills`.

### 9.2 Cards, in order

Each card names its objective, owned files and done-when list (BUILD-ORDER card format), and ends with G-PX-TYPES and its own gates. From B10.9 on, `npm run gates` also runs. No pull request leaves draft before B10.9, because three and troika stay installed until their last importer is gone.

| Card | Objective | Files owned | Done when |
|---|---|---|---|
| B10.0 | Seat, baseline, measurement scripts | `qa/pixi/m0/*`, `tools/pixi/bundle-report.mjs`, `tools/pixi/lh-run.mjs`, `tools/pixi/device-check.mjs`, `agents/routing-log.md` row | `node tools/agent-map.mjs impact --changed 2d75332` output saved; M0 build exit 0; M0 bundle and Lighthouse recorded (8.1) |
| B10.1 | Probe 2 | `probe-f1/probe-src/*`, `probe-f1/04-probe2-results.md` | P1-1 to P1-15 each PASS or FAIL with detail; every FAIL routed to its fallback or a BLOCKED line |
| B10.2 | Dependencies and build config (approved first) | `package.json`, lockfile, `vite.config.ts`, `tsconfig.json` | G-PX-DEPS-ADD; G-PX-TYPES; `moduleResolution` is `bundler` |
| B10.3 | Seams | `src/world/variant.ts`, `projection.ts`, `stub.ts`, `types.ts`, the import line in `src/motion/guestbook.ts`, `tests/scenes/sidequests-harness.html` | G-PX-SEAMS; `tests/travel.spec.ts` and `tests/scenes/sidequests.spec.ts` pass |
| B10.4 | App, view, camera, projection emulation, context | `src/world/pixi/app.ts`, `view.ts`, `layers.ts`, `glcount.ts`, `ledger.ts`, `src/world/camera.ts` | G-PX-BACKEND, G-PX-SHIFT, G-PX-CTX |
| B10.5 | Lane batch and bit | `src/world/pixi/batch.ts`, `laneBatch.ts`, `laneBit.ts`, `src/world/lanefield.ts` | G-PX-PASSES, G-PX-TEXEL, G-PX-WIDTH; T-S02 tests |
| B10.6 | Server words | `src/world/server.ts`, `src/world/pixi/hud.ts` | G-PX-UPLOAD, G-PX-WORDS; T-SRV tests |
| B10.7 | LeafLink and SideQuests | `src/world/leaflink.ts`, `sidequests.ts`, `src/world/pixi/pins.ts`, `markers.ts` | T-LL tests, T-SQ tests, T-SQ-CAM-1 |
| B10.8 | Shelf, tokens, reduced motion (DESIGN 1.8.0 approved first) | `src/world/pixi/shelf.ts`, `spec/astryx/DESIGN.md`, generated files through `npm run gen` | G-PX-SHELF, G-PX-REDUCED, T-S10-3 |
| B10.9 | Remove three and troika; debug contract | `package.json`, `tests/world.engine.spec.ts`, S11 text | G-PX-DEPS, G-PX-NOTHREE, G-PX-COUNTS, G-PX-LONGTASK; `npm run gates` exit 0 |
| B10.10 | Measure | `qa/pixi/m1/*` | G-PX-BUNDLE, G-PX-LH |
| B10.11 | Device and taste | `qa/device/*`, `qa/pixi/g-anti.md` | G-PX-DEVICE (Justin on the reference iPhone), G-ANTI |

### 9.3 Review seat and verify-stop

- Every card's diff goes to a separate seat with the spec section, the diff and the blast radius only, never the generator's notes (AGENTS.md section 3). Seat: Codex gpt-5.6-sol (MASTERSPEC-ROUTING.md:22-27) or the repo `judge` agent in a fresh context. The reviewer never writes. Failed, skipped, empty or unparseable output is an incomplete review, never "no findings" (MASTERSPEC-ROUTING.md:25). Review loops cap at two.
- G-ANTI goes to `taste-judge` with screenshots and questions only (CLAUDE.md; S11 section 6).
- Verify-stop: a card is DONE only with the receipted exit-0 run of its gates: the command, the contents of its exit-code file, and a receipt path under `qa/pixi/` (AGENTS.md section 2 gate 2, section 6).
- Checkpoint: commit before every risky edit; rollback is `git checkout <sha> -- <files>` (AGENTS.md section 2 gate 3).
- Blocked means written down: `BLOCKED: <question> (<section>)` in BUILD-STATE.md, then stop.

### 9.4 Ship

S11:93 holds: all gates green, the kill list empty, G-PERF-DEVICE recorded, every unknown in Appendix A resolved or accepted by Justin in writing. The build hands Justin a commit SHA, the `dist/` byte counts and the QA report. Merge, deploy and any production switch are Justin's.

---

## Appendix A. Unknowns carried forward (to spec/astryx/UNKNOWNS.md as U-PX rows)

| ID | Unknown | Closed by |
|---|---|---|
| U-PX-1 | 256x768 RGBA32F and exact texel addressing | P1-1, P1-2 |
| U-PX-2 | clip-space vertex variable | P1-3 |
| U-PX-3 | blend factors of the `'blend'` state | P1-4 |
| U-PX-4 | oversized-view rendering and its fragment cost | P1-5, A4 |
| U-PX-5 | `interStage` varyings | P1-6 |
| U-PX-6 | BitmapFont install options and glyph draw count | P1-7 |
| U-PX-7 | minimal extension set and the resulting bundle | P1-8, A1 |
| U-PX-8 | context loss behaviour | P1-9 |
| U-PX-9 | BufferImageSource re-upload API | P1-10 |
| U-PX-10 | RenderGraphDebugger options and snapshot fields | P1-11 |
| U-PX-11 | 6,144-slot blend sort cost on the device | P1-12, A4 |
| U-PX-12 | first-frame compile cost on the device | A7 on the device |
| U-PX-13 | real-phone p95 of the fork | A4 |
| U-PX-14 | Lighthouse delta against 2d75332 | A3 |
| U-PX-15 | the 62-commit span 14ab8df..46d6a34 not fully read (lane-c 05-limits-unknowns.md:49; 03-probe:11) | each card reads its owned files at 2d75332 in full before editing |
| U-PX-16 | WebGPU on iPhone and the S00 buffer limits | the D4 falsification probe only |
| U-PX-17 | vendor scale claims (100,000 batched objects at 60 fps; 25,000 slots on phones) | [UNMEASURED] (lane-a 02-api-surface.md:59, :77; lane-a 03-limits-unknowns.md:68). No decision uses them |
| U-PX-18 | lane-carried letters reading subtly in stills (RESEARCH-INDEX.md:50) | G-ANTI question on server stills |

## Appendix B. API names used, with sources

| API | Source |
|---|---|
| `Application`, `app.init({ preference, antialias, autoDensity, resolution, resizeTo })`, `app.queueResize`, `app.renderer.on('resize')`, `app.destroy(...)` | lane-b 02-v8-core-surface.md:10-20; probe main.ts:50-59 |
| `skipExtensionImports`, `@pixi/3d/webgl`, `pixi.js/events` | lane-a 02-api-surface.md:12 (set UNVERIFIED, P1-8) |
| `app.ticker.add`, `UPDATE_PRIORITY`, `deltaMS`, `app.ticker.stop`, `app.render` | lane-b 02-v8-core-surface.md:17, :55-58 |
| `renderer.resize(w, h, resolution)`, `app.renderer.type` | lane-b 02-v8-core-surface.md:16; probe main.ts:61 |
| `View3D({ width, height, camera, anchor, background, cull, toneMapping, resolution })`, `view.root`, `view.background`, `view.width`, `view.height`, `view.worldToScreen` | 01:259-264; raw/api/scene.View3DOptions.html.md:37-311; raw/api/scene.View3D.html.md:312-349, :577-594; lane-a 02-api-surface.md:22 |
| `Camera3D({ fov, near, far })`, `position.set`, `lookAt`, `fov` | 01:233-246, :265; probe main.ts:69, :231-232 |
| `BatchedMesh3D({ size, instanceData })`, `setGeometryAt`, `setMaterialAt`, `setMatrixAt`, `setPassesAt`, `setVisibleAt`, `invalidate`, `matrices`, `instanceData`, `update(first, count)`, `cull` | 01:15-46, :124-151; raw/guides/scene-7.html.md:41-167 |
| `RenderPassBit.OPAQUE`, `RenderPassBit.TRANSPARENT` | 01:274; probe main.ts:154 |
| `Matrix4`, `makeTranslation` | probe main.ts:150-155 |
| `ShaderBit { name, textures, bindings.instance, bindings.material, gl.vertex.beforeTransform, gl.fragment.material, interStage }` | 01:48-99; raw/guides/extras_materials.html.md:108-127; probe main.ts:109-134 (`interStage` UNVERIFIED, P1-6) |
| slot variables `position`, `albedo`, `alpha`, `vUV`, `uTime`, `uCameraPosition`; helper `sampleXDirect` | raw/guides/extras_materials.html.md:117-125; 01:79-84 |
| `FlatMaterial({ alphaMode, extraBits, textures, baseColorTexture, vertexColors })`, `state.depthTest`, `colorSpace`, `material.data`, `material.update()` | raw/api/materials.FlatMaterial.html.md:3-51, :201-212, :402-419; raw/api/materials.BaseMaterial3DOptions.html.md:60-327; 01:71-78 |
| `Geometry3D({ positions, uvs, indices, colors, bounds3D })` | raw/api/geometry.Geometry3DOptions.html.md:55-415 |
| `PlaneGeometry`, `CylinderGeometry` | lane-a 02-api-surface.md:32; lane-b 02-v8-core-surface.md:133 |
| `BufferImageSource({ resource, width, height, format: 'rgba32float' })`, `Texture({ source })`, `texture.source.scaleMode`, `texture.source.update()` | 01:103-108; probe main.ts:89-95; lane-b 02-v8-core-surface.md:35, :106 (`update` UNVERIFIED for buffers, P1-10) |
| `ContainerTexture({ container, resolution, renderer, autoUpdate })`, `render(renderer?)`, `clearColor` | raw/api/rendering.ContainerTexture.html.md:1-360 |
| `Mesh3D({ geometry, material })`, `eventMode`, `cursor`, `on('pointertap')`, `globalpointermove`, `pointerup`, `pointerupoutside` | lane-a 02-api-surface.md:31, :67; lane-b 02-v8-core-surface.md:83-88; lane-b 03-skill-extracts.md:82-86, :161 |
| `Container`, `Graphics`, `renderer.generateTexture`, `BitmapFont.install`, `BitmapText`, `Text`, `Assets.load({ src, data: { family } })` | lane-b 02-v8-core-surface.md:40, :109-118; lane-b 03-skill-extracts.md:100 (`BitmapFont.install` options UNVERIFIED, P1-7) |
| `RenderGraphDebugger`, `captureGraphDebugSnapshot`, `GraphDebugOverlay` (debug chunk only) | raw/api/extras_debug.RenderGraphDebugger.html.md:16-48; raw/api/extras_debug.captureGraphDebugSnapshot.html.md:3-15; probe main.ts:210-211 (options UNVERIFIED, P1-11) |

## Changelog

- 1.0.0, 2026-11-12: initial masterspec from the Phase 0 pool at 38106e1.
