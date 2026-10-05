# Motion Brief v2: The Board

Status: DRAFT for Cipher's audit. Nothing in here is built yet. Justin's directive for this step: "claude formalizes, Cipher approves."
Date: 2026-10-05
Inputs: Justin's v2 direction, the OSS study (2trung/portfolio, bruno-arizio), the bruno-simon write-up, Justin's PCB shan-shui spec, and the 2D motion extracts from utazon.fr and cleanlystudio.pro. All of these were relayed by Bonehead in the build thread on 2026-10-05.
Binding sources: spec/portfolio-spec.md, spec/style-brief.md, spec/standard-implementations.md, and spec/copy-deck-v2.md (v2.2 plus the v2.3 amendment).

## 0. Thesis and what this brief replaces

The site becomes a place: one circuit board, seen in 3D, that persists across every route. Home, the two dossiers, About and Contact are locations on that board. Navigating between routes moves the camera across it.

The board is not a backdrop. It is the verification rig built out as hardware:
- DATA, VERIFY and DETERMINE are the three IC packages at its centre.
- The traces between them are the method.
- Each dossier is a component cluster wired from that project's real data.

The thesis "I build systems and prove they work" is shown by the site itself. The 3D reads its facts from the page's DOM, so it cannot claim anything the page does not. The QA harness checks that the two agree.

Once approved, this brief supersedes:
- portfolio-spec.md §7.1 (rig description).
- §8 (view transitions, the welcome timing and the motion curve).
- §9 (scene spec).
- style-brief.md "Motion" (the 300ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` token).

Everything else in the spec stays in force, including:
- the IA in §4;
- the dossier structure in §5.3;
- the terminal command set in §6;
- the budgets in §14;
- the fallbacks in §15;
- the copy rules in §13.

Stack is unchanged: one self-contained HTML file, three.js r186 (`three/webgpu`, WebGPU with WebGL2 backend), GSAP 3.15.0, no framework. Two GSAP plugins from the same pinned package are added through the importmap with SRI: `SplitText` and `CustomEase`. Both ship in `gsap@3.15.0` (verified in the npm tarball). This follows the standard-implementations rule of using the library's implementation rather than hand-rolling one.

## 1. Persistent-canvas architecture (bruno-arizio pattern D)

### 1.1 One renderer, one scene, one camera
- **Canvas:** one `WebGPURenderer` canvas, created once at boot and never torn down on navigation.
  - It is `position: fixed; inset: 0; z-index: 0; pointer-events: none`, appended to `body`.
  - All DOM content sits at `z-index: 1`.
  - The v1 retry path (WebGPU throws on first render, so rebuild on WebGL2 with a fresh canvas) carries over unchanged.
- **Scene and camera:** one `Scene` and one `PerspectiveCamera` (fov 35, near 0.1, far 400).
  - There are no other cameras and no render-to-texture views.
  - One camera keeps the place singular: the visitor is always in exactly one spot.
- **Post-processing:** one `RenderPipeline` with the v1 `pass()`, `bloom()` and vignette chain.
  - Bloom stays: threshold 0.9, strength 0.35, radius 0.2.
  - Only the amber signal and the lit LEDs exceed the threshold.
- **No lights:** the scene has no lights at all. Every material is an unlit node material (`MeshBasicNodeMaterial`, `LineBasicNodeMaterial`, `PointsNodeMaterial`).
  - Depth comes from flat face tones and hairline edges, never from shading.
  - Bruno-simon's perf lesson was "baked over real time". The flat design system takes it one step further: nothing is lit, so there is nothing to bake.

### 1.2 Stage slots: where the 3D may paint
The fixed canvas covers the viewport, but only the backdrop (§3.2) paints everywhere. The board, the ICs and the particles paint only inside the current route's **stage slot**.

A stage slot is a DOM element marked `data-stage`. Layout guarantees it never overlaps copy: it is its own CSS grid column on desktop and its own band on mobile.

The renderer reads the slot's rect on scroll and resize into a `uStage` uniform (vec4, device px). A shared TSL node discards board, IC and particle fragments outside the rect. The bloom output is multiplied by the same mask, so glow cannot bleed onto copy.

This mechanism enforces the v1 audit rule ("the canvas must never paint over the copy column") at every viewport, not only the ones tested.

| Route | Desktop ≥1100px slot | Mobile <1100px slot |
|---|---|---|
| `#/` | hero right column (v1 geometry: left edge `max(0,(100%-1440)/2) + gutter + 560 + 48`) | 56vh band under the hero copy |
| `#/work/leaflink`, `#/work/sidequests` | sticky right column: `position: sticky; top: nav height; height: 100vh minus nav`, beside the dossier text | 56vh band after the dossier header, not sticky |
| `#/about` | sticky right column | 48vh band after the lead |
| `#/contact` | sticky right column | 40vh band after the lead |
| 404 | right column, static | none |

Below the home hero (proof strip, terminal, dossier index, timeline, contact band) there is no stage slot. Reading zones get the backdrop only. Evidence first (spec §1).

### 1.3 Scroll state
- One object, `scroll = { current, previous, target, velocity }`.
- **Target:** ScrollTrigger computes the target as a 0 to 1 progress for the current route's scrubbed range, with `scrub: true` so GSAP adds no smoothing of its own.
- **Lerp:** the frame loop eases toward the target: `current += (target - current) * (1 - Math.pow(0.9, dt / 16.67))`. This is frame-rate independent and gives exactly one smoothing source.
- **Velocity:** `velocity = current - previous`.
- **Uniforms:** every shader uniform tied to scroll reads `scroll.current`.

### 1.4 Scene classes
All classes add their groups to the same scene. Construction is lazy on first visit; after that the instance is kept and toggled with `group.visible`.

| Class | Owns | Board location (world X) |
|---|---|---|
| `Place` | renderer, scene, camera, pipeline, backdrop node, chunk streamer, particle system, `uStage`, scroll state, tier | whole board |
| `HomeScene` | rig ICs U1 DATA, U2 VERIFY, U3 DETERMINE, the signal overlay, the hero boot sequence | 0 |
| `DossierScene(LEAFLINK)` | LeafLink cluster (§2) | 30 |
| `DossierScene(SIDEQUESTS)` | SideQuests cluster (§2) | 60 |
| `AboutScene` | plan-view camera over the rig, fab-notes silkscreen block | 90 |
| `ContactScene` | edge connector J1 on the board's bottom edge, the output trace from U3 | 120 |
| `VoidScene` | camera pose above the board's top edge, looking into the void | 120, raised |

Every scene class exposes the same interface:

```
pose(tier)          -> { position, target } for desktop and mobile
slot()              -> the route's [data-stage] element
enter(tl, from)     -> adds its in-animation to the shared transition timeline
leave(tl, to)       -> adds its out-animation
update(state, dt)   -> per-frame, only while visible
setReducedMotion(b) -> jump to the resolved, frozen state
```

**Board coordinates:**
- The board lies on the XZ plane at y = 0, with 1 world unit = 100 board px.
- The board strip is 800 board px tall (8 units) and runs along +X.
- Anchors sit 30 units apart. 30 units is one desktop chunk of 3000 px, so on desktop the five active chunks cover every route anchor (§7).

### 1.5 Navigation and the Transition
The existing hash router calls `Place.go(route)`. `go` is `async onChange(slug)`:
1. Await `current.leave`.
2. Await `Transition.run(from, to)`.
3. Await `next.enter`.

Each step is choreographed on one GSAP timeline, so interrupting is a single `tl.kill()`.

`Transition.run(from, to)` on desktop and tablet:

| t (s) | Track | What happens | Duration, ease |
|---|---|---|---|
| 0.00 | DOM out | old view `opacity 1 -> 0`, `y 0 -> -12px` | 0.3s, `jp` |
| 0.00 | Camera | flight from `from.pose` to `to.pose` along a CatmullRom curve through a raised midpoint (both X midpoint, y + 40%, so the camera lifts, crosses, and settles) | 1.8s, `jp` |
| 0.00 | Look target | tweened separately from position | 1.8s, `jp` |
| 0.00 | Slot | `uStage` rect morphs from the old slot rect to the new one; it starts at the new rect when the old slot was off screen | 0.9s, `jp` |
| 0.30 | DOM swap | new view becomes `display: block` at opacity 0, scroll resets to 0, focus moves to the new h1 (v1 behaviour, kept) | instant |
| 0.45 | DOM in | h1 split-line reveal (§5) | 0.9s, stagger 0.1 |
| 0.45 | DOM in | rest of the view `opacity 0 -> 1`, `y 24 -> 0` as one block | 0.5s, `jp` |

Timing results:
- **Body copy:** readable (≥ 90% opacity) at 0.45 + 0.32 = 0.77s.
- **h1:** fully settled by 1.65s at most (4 lines).
- **Camera:** lands at 1.8s.

**Interrupts:**
- **Wheel, key or touch during a transition:** jumps only the DOM sub-timeline to `progress(1)`. The camera keeps flying. Content never waits on motion (spec §8).
- **New navigation mid-flight:** kills the timeline and starts the next flight from the camera's current pose, never snapping back.

**Back and forward:** the same transition. The flight curve is recomputed from the current pose, so going back retraces the path.

**Mobile:** the flight would cross chunks the 3-chunk streamer has not generated (§7), so it becomes rise, dissolve, descend:
- The camera rises to overview altitude over 0.6s.
- Board opacity goes `1 -> 0` over 0.3s while the backdrop band sweeps.
- The camera translates in X while the board is hidden.
- The board fades back in over 0.3s, and the camera descends over 0.6s.
- Total: 1.8s, the same track timing as desktop. It is never a hard cut.

**Deep link on first load:** the camera starts at the target pose and the boot sequence (§5.4) plays there.

## 2. Per-route 3D content: data-driven vignettes

### 2.1 Rule: the scene reads the page
At boot, `Place` builds `SCENE_DATA` by reading the rendered DOM: the dossier meta rows, receipt links, falsifiability list items and result label. Vignette builders may read only `SCENE_DATA`. No fact is hard-coded in the scene.

When a receipt lands in the DOM, its component appears on the board with no scene code change. QA asserts every `SCENE_DATA` value equals its DOM source string.

Built from copy deck v2.2/v2.3 as it stands today:

| Field | LeafLink | SideQuests | DOM source |
|---|---|---|---|
| team | 4 (`Justin Poli, Julian Shuster, Devin Perez, Colton A.`) | 2 (`Justin Poli, Julian Shuster`) | meta row TEAM, split on ", " |
| event | `Week-long hackathon` | `Hack New Paltz` | meta row EVENT |
| timebox | none numeric ("week-long" is not given a day count; no invention) | 24 hours (`working MVP in 24 hours`) | one-liner / index row |
| failure class | none (unconfirmed, not rendered on the site) | `scope collapse under timebox` | 02 FAILURE CLASS section |
| linked receipts | 1 (repo) | 1 (repo) | receipt section anchors with an http(s) href |
| falsifiability tests | 4 | 4 | falsifiability list items |
| result | `2nd place` | `2nd place` | meta row RESULT |

### 2.2 The cluster grammar (both dossiers, identical rules)

| Element | DATA / VERIFY / DETERMINE | Count from | Drawn as |
|---|---|---|---|
| TEAM pads | DATA | `team` | one circular pad per member on the cluster's left edge, each routed into U1. Silkscreen `TEAM` (an existing deck label). |
| EVENT | DATA | `event`, `timebox` | LeafLink: one undivided copper pour bar beside U1 with silkscreen `EVENT`. SideQuests: a ring of exactly 24 pads around U1, one per hour, with silkscreen `EVENT`. The ring is the constraint behind its failure class and its second falsifiability line. |
| U1 | DATA | n/a | 16-pin IC package with a 3D body. |
| Receipt connectors | VERIFY | `linked receipts` | one `paintConnector` per linked receipt, routed into U2. Pending receipts are not drawn: same rule as the DOM, no empty slots and no visible TBD. |
| U2 | VERIFY | n/a | 32-pin IC package with a 3D body. |
| Test points | VERIFY | `falsifiability tests` | one test-point pad per falsifiability line, ringed around U2 with no labels. Each lights amber when its list item is read (§2.3). |
| U3 | DETERMINE | n/a | 16-pin IC package with a 3D body. |
| RESULT LED | DETERMINE | `result` | one LED from `paintPassiveCluster`, wired from U3, lit amber at the DETERMINE state. Silkscreen `RESULT`. |
| Result glyph | DETERMINE | `result` | particles density-sampled from the string `2nd place` (§3.1), forming above U3. |

The only silkscreen strings are `DATA`, `VERIFY`, `DETERMINE`, `TEAM`, `EVENT` and `RESULT`. All six are existing approved deck strings. Silkscreen is rendered as SVG text using the already-embedded JetBrains Mono subset.

### 2.3 Dossier state machine (desktop sticky slot)
These are discrete states, tweened over 0.9s on `jp` when a section crosses `top 60%`. They are not scrubbed: in a reading context the vignette is a legend for the section being read.

| Section in view | State |
|---|---|
| 01 HEADER | DATA: TEAM pads and EVENT lit, U1 focused (camera target U1) |
| 02 FAILURE CLASS (SideQuests only) | DATA, emphasised: the 24-pad ring fills clockwise, 24 steps over 0.9s |
| RECEIPT | VERIFY: receipt connectors lit, signal U1 -> U2, camera target U2 |
| FALSIFIABILITY TEST | each test point lights as its `li` crosses `top 70%` (0.3s, `jp`) |
| EVIDENCE | DETERMINE: signal U2 -> U3, LED on, particles form `2nd place`, camera target U3 |

On mobile the vignette band is not sticky. Its state is scrubbed by the band's own pass through the viewport: entering means DATA, the middle means VERIFY, leaving means DETERMINE.

### 2.4 The other routes
- **Home:** the rig U1 -> U2 -> U3 at world X 0, scroll-scrubbed (§3.3).
- **About:** plan view (camera straight down over the rig).
  - The PRINCIPLES items map 1:1 to U1, U2 and U3 (Data, Verification, Determinism). Each IC highlights as its item crosses `top 60%`.
  - During COLOPHON the camera pans to the fab-notes block: a silkscreen area in the board corner carrying the deck's existing footer colophon line, `One HTML file. three.js r186, GSAP, no framework.`
- **Contact:** the output trace from U3 runs to edge connector J1 on the board's bottom edge. After the form's visible confirmation appears (never before, never instead), one amber pulse travels U3 -> J1 (1.8s, `jp`).
- **404:** the camera sits above the board's top edge looking into the warm-black void, with the board edge visible at the bottom of the slot. Static. The terminal-styled DOM 404 is unchanged.

## 3. TSL layer (2trung patterns A and B)

### 3.1 Particle field: the dataset being verified (pattern A)
One shared particle system serves every route and is re-targeted on route enter.

- **Construction:**
  - `new THREE.Sprite(new THREE.PointsNodeMaterial(...))` with `sprite.count = N`.
  - r186 docs: `Points` primitives are fixed at 1 px on WebGPU, so instanced sprites are the sized path. Verified in `src/materials/nodes/PointsNodeMaterial.js`.
- **Counts:** N is 16,384 on desktop (128²) and 4,096 on mobile (64²). Tier 0 has none.
- **Per-instance attributes:** `aSeed` (vec3), `aLattice` (vec3: its cell on U2's lattice), `aTarget` (vec3: its point in the route's DETERMINE shape).
- **Stateless and deterministic:** position is a pure function of attributes and uniforms. There is no simulation buffer and no compute pass. Same scroll gives the same frame, which is the Determinism principle applied to the renderer.

```
noisePos  = U1.top + aSeed * 1.2 + curl(aSeed + uTime * 0.05) * 0.35 * (1 - uVerify)
latticePos= U2.top + aLattice
shapePos  = U3.top + aTarget
pos       = mix(mix(noisePos, latticePos, uVerify), shapePos, uDetermine)
```

- **Curl noise:** a finite-difference curl of `mx_noise_vec3`. TSL in r186 has no built-in curl; `mx_noise_vec3` is exported and was verified in `Three.TSL.js`.
- **DETERMINE shape:**
  - Home: the particles settle into U3's die lattice, an exact grid.
  - Dossiers: the string `2nd place` is drawn in JetBrains Mono 600 to an offscreen 512×128 canvas. N points are density-sampled from its alpha (CPU, once per route enter, under 4 ms) and laid out flat above U3.
- **Colour:** in the DATA phase particles are ink-1 `#858585`. At `uVerify = 1` they are ink-0 `#f5f5f5`. They turn amber `#ffb000` only for the DETERMINE shape at `uDetermine > 0.95`.
- **Fake depth of field:** `alpha *= 1 - smoothstep(0.0, 2.5, abs(viewDist - uFocusDist))`, with `uFocusDist` set to the distance to the focused IC. No post pass.
- **Rejected from pattern A:** chromatic aberration (the three additive RGB clones). RGB split reads as glitch or cyberpunk, breaks the palette, and encodes nothing.
- **Job test:** a particle whose position at some scroll value cannot be explained as raw data, verified data or a determined result is cut.

### 3.2 Fullscreen dithered backdrop (pattern B)
- **Setup:** `scene.backgroundNode` is a compiled TSL fragment over `screenCoordinate` (camera independent, verified exported in r186).
- **Two tones only:** `bg-0 #070304` and `bg-1 #141414`. Output is `mix(bg0, bg1, step(bayer4(screenCoordinate / dpr), field))`.
- **Bayer matrix:** the 4×4 threshold matrix lives in a `uniformArray` of 16 floats (normalised 0..15/16) and is indexed per CSS pixel, so the dither grain is identical at every DPR.
- **Field:**

```
band  = 1 - smoothstep(0.0, 0.18, abs(screenUV.y - (1.0 - uBand)))   // the verify scan line
ptr   = (1 - smoothstep(0.0, 140.0 * dpr, distance(screenCoordinate, uPointer))) * uPointerActive
field = clamp(0.10 + band * 0.45 + ptr * 0.35, 0.0, 0.85) * uBackdrop
```

- **What it encodes:** the band is the verify pass. It sits at `uBand = scroll.current`, so it doubles as a reading-progress line for the route. On home it tracks the signal's position along the rig.
- **Pointer:** a radial falloff around a lagged pointer uniform (lerp 0.12 per frame). There is no liquid-flow simulation texture, so no ping-pong FBO: a cheap pure function in keeping with §3.1.
- **Contrast guarantee:** the backdrop can never be brighter than `#141414`. Ink-1 `#858585` on `#141414` is 4.99:1 and ink-0 is 16.9:1, so copy passes AA over the backdrop at every pixel. Computed with the WCAG formula, re-checked in QA.
- **Visibility:** `uBackdrop` is driven by a GSAP timeline at exact scroll fractions: 1.0 at rest, 0.6 while a camera flight is in progress, 1.0 again on land.

### 3.3 Uniform and scroll wiring

| Uniform | Type | Source | Mapping |
|---|---|---|---|
| `uScroll` | float | `scroll.current` | route progress 0..1 |
| `uVerify` | float | home: hero progress; dossier: state tween | home: `clamp((p - 0.15) / 0.45, 0, 1)` |
| `uDetermine` | float | same | home: `clamp((p - 0.60) / 0.30, 0, 1)` |
| `uSignal` | float | derived | `0.5 * uVerify + 0.5 * uDetermine`: position of the amber pulse along the U1 -> U2 -> U3 polyline |
| `uBand` | float | `scroll.current` | backdrop scan line |
| `uTime` | float | `performance.now()` seconds | frozen under reduced motion |
| `uPointer` | vec2 | `pointermove`, device px, lerp 0.12 | desktop with `(hover: hover) and (pointer: fine)` only |
| `uPointerActive` | float | 1 on move, eases to 0 after 2s idle | |
| `uStage` | vec4 | stage slot rect, device px | §1.2 |
| `uFocusDist` | float | camera to focused IC | §3.1 |
| `uBackdrop` | float | GSAP | §3.2 |

The home hero scroll range keeps v1's ScrollTrigger (`start: 'top top', end: 'bottom bottom'`), now with `scrub: true` plus the §1.3 lerp:

| Hero progress p | Phase | What the visitor sees |
|---|---|---|
| 0.00 to 0.15 | DATA | particles drift in a noise cloud over U1 |
| 0.15 to 0.60 | VERIFY | the amber signal runs U1 -> U2, particles converge and lock to U2's lattice |
| 0.60 to 0.90 | DETERMINE | the signal runs U2 -> U3, particles settle on U3, and the LED lights at 0.90 |
| 0.90 to 1.00 | hold | resolved; the camera dolly finishes (clamped, v1 range) |

Pointer on the rig: a ray against the three IC bounding boxes only (three tests, cheap). The hovered IC lifts 0.06 units and its traces brighten from copper to amber over 0.3s.

## 4. Shan-shui fold-in: the chosen approach

**Decision:** keep Justin's SVG-string engine exactly as specced, and use its output as textures on the board plane inside the persistent three.js scene. Each chunk's SVG string is turned into a Blob, then `img.decode()`, then a `THREE.Texture` (sRGB) on a plane at y = 0.

The engine, painters, router, palette, filters and limits are unchanged. Only the final step, where the SVG lands, is new.

Why this and not the other options:
- **Porting the painter grammar to TSL** would rewrite Justin's authority spec, drop the SVG filters (`traceGlow`, `maskGrain`), and turn the SVG node limits into meaningless numbers.
- **Compositing the SVG as a DOM layer under the canvas** cannot follow the 3D camera, so the board would slide against the rig on every flight. It would also mean running two scroll systems.
- **Scoping it to one route's backdrop** makes it wallpaper, which is exactly what kill criterion 2 forbids.

As textures, the board is the ground of the place and the rig sits on it. The router's output feeds both the SVG trace painter and the WebGL amber signal overlay, so the static copper and the live signal can never disagree.

### 4.1 Engine, as specced (unchanged)
- **Painters:** `paintBoardEdge`, `paintCopperPour`, `paintICPackage` (pins 16|32|64), `paintHeatsink`, `paintPassiveCluster`, `paintTrace` (stroke with `noi: 0`, flat width), `paintConnector`. A tag dispatch table maps planner tags to painters.
- **Router:** 45 degree, 10 px grid.
  - Candidate paths per net: H then V; V then H; H, 45°, H; V, 45°, V; 45° then H; 45° then V.
  - Each candidate is converted to legal vectors (±grid,0 / 0,±grid / ±grid,±grid).
  - Score = length + bends × 40 + crossings × 1000.
  - Candidates entering an IC body or a via keep-out are rejected.
  - If every candidate is rejected, the net is dropped. An illegal trace is never drawn.
- **Pads and vias:**
  - Every trace termination gets a pad of radius traceWidth × 2.
  - Vias are an outer copper ring (r6) plus a dark hole (r2), never floating, never inside an IC body, never closer than 20 px.
- **Palette** (inside the board edge only): `PCB_MASK rgba(12,28,24,1)`, `PCB_DARK rgba(5,12,10,1)`, `COPPER rgba(180,92,35,1)`, `COPPER_TRACE rgba(220,130,45,0.9)`, `SILK rgba(210,210,190,0.8)`, `PAD rgba(220,150,70,1)`.
  - The board is a bounded object with visible edges, sitting in the warm-black `#070304` void. The site palette owns everything outside the board edge.
  - Amber `#ffb000` is reserved for the live WebGL signal, the lit test points and LEDs, and the DETERMINE glyph. Copper is static; amber means verified now.
- **Filters:** `maskGrain` (feTurbulence) is the solder-mask texture. `traceGlow` applies to power traces and large pours only, capped at stdDeviation 2 board px and opacity 0.35. Judgment call J1 in §9.
- **Seeds:**
  - Default for everyone: `PCB_HERO_001`.
  - `?seed=explore` uses `Date.now()`; any other `?seed=` value is hashed to 32 bits.
  - Anchors are placed by a fixed layout that ignores the seed: rig ICs, both clusters, fab notes and J1. The seed drives the filler planner only, so every route always shows its true content.
- **Limits** (the spec's hard limits read as totals across the active board; J2 in §9):
  - Desktop: 5 active chunks, each 3000×800 px.
  - Mobile: 3 active chunks, each 1200×800 px, with at most 120 components in total.
  - Fewer than 5000 SVG nodes, fewer than 20000 trace points, 1024 px planner lookahead.
- **License:** LingDong's MIT notice for shan-shui-inf is kept verbatim in a comment above the engine.

### 4.2 Rasterisation budget
- **Resolution:** chunks rasterise at 1 texel per board px.
- **Detail textures:** the 1200 px anchor zone around each route anchor also rasterises at 2× on desktop, because close-ups need it.
- **GPU memory:** about 48 MB of chunk textures plus 4 anchor detail textures at about 15 MB each, around 110 MB on desktop. Mobile is 3 × 1200 × 800 × 4 B, about 11.5 MB.
- **Generation order:**
  1. The home chunk, seed-locked, renders first.
  2. The other chunks follow in `requestIdleCallback` slices of at most 8 ms of planner and router work each, nearest anchor first.
  3. Rasterisation happens off the critical path, after `load`.
- **Mobile downgrade:** if the first chunk's decode takes more than 80 ms, `maskGrain` is dropped for the session on mobile.

### 4.3 Kill criteria and how each is checked
1. **More than 5% of visible traces violate H/V/45° or look hand-drawn.** Checked in QA over 20 seeds plus `PCB_HERO_001`:
   - Every router segment direction must be one of the 8 legal unit vectors, with endpoints on the 10 px grid.
   - Every `paintTrace` call must carry `noi: 0` and one constant width.
   - The pass bar is 0 violations, stricter than 5%: the router cannot emit illegal segments by construction, and QA proves it.
2. **Removing components leaves a generic tech background.** Checked two ways:
   - Automated: at least 90% of total trace length must belong to nets whose both ends are component pins. No via-to-nowhere filler, no free-floating traces.
   - Human: QA renders `PCB_HERO_001` twice (components on and off) at 1440×900 and attaches the pair for Cipher's review. If the components-off render could be any tech wallpaper while the on render clearly shows the rig and clusters, the components carry the identity and the criterion passes. If both read as wallpaper, it fails.
3. **Seed changes produce only cosmetic noise.** Checked over 20 seed pairs: filler component footprints are quantised to the 10 px grid.
   - The Jaccard overlap of footprints must be under 0.5.
   - The multiset of planner tags must differ.
   - Net count must differ by at least 10%.
   - Anchors are excluded from the comparison because they are meant to be identical.

## 5. 2D motion system

### 5.1 One curve, settled
The field has converged on one curve: `M0,0 C0.4,0 0.2,1 1,1`, which is CSS `cubic-bezier(0.4, 0, 0.2, 1)`, the Material Design standard easing. utazon.fr uses it 18 times and cleanlystudio.pro 104 times.

It is registered once as `CustomEase.create('jp', 'M0,0 C0.4,0 0.2,1 1,1')`, with a CSS twin `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. It is the only curve on the site, 2D and camera alike. It replaces the style brief's `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, and bruno-arizio's `Power4.easeOut` is not used.

A measured property that drives the duration choices below: this curve is not front-loaded like an expo or power out.
- It reaches 2.6% at 10% of its duration, 50% at 35%, 90% at 63% and 95% at 73% (sampled numerically).
- Power4.out reaches 90% at 37%.

So the duration on this curve decides when text becomes readable. Time-to-90% is the number each context below is set by.

### 5.2 Three registers, one per context

| Context | Register | Duration / stagger | Time to 90% | Why |
|---|---|---|---|---|
| Micro-interactions | utazon's short step | press 0.15s; hover and state changes (underline grow, copy-email morph, focus ring) 0.3s | 0.09s / 0.19s | feedback must land inside one perceptual beat (about 100 ms) so the control feels attached to the finger |
| Scroll reveals | cleanlystudio's crisp register | 0.5s, stagger 0.06s | 0.32s | this is the evidence payload, revealed dozens of times per visit. At 1.8s a claim would sit near half opacity for 0.6s while someone tries to read it, which breaks "motion never blocks content" (spec §8) |
| Route-change headings | bruno-arizio's split-text character, retimed to the curve | h1 lines 0.9s, stagger 0.1s, at most 4 staggered lines | 0.57s per line | bruno-arizio's 1.5s on Power4.out hits 90% at 0.55s. 0.9s on our curve hits 90% at 0.57s, so it matches his arrival with the shared curve |
| Camera flights and the slot morph | utazon's luxurious register | camera 1.8s, slot rect 0.9s | 1.14s | the place is where slowness belongs: the camera carries the immersion, and nothing a visitor reads waits on it (body copy is readable at 0.77s, §1.5) |

So the slow 1.8s register is spent only on the 3D camera, the crisp 0.5s register on reading, and the split-text character on the one moment per route that is allowed to perform.

### 5.3 Exact specs
- **Scroll reveals:**
  - `ScrollTrigger.batch('[data-reveal]', { start: 'top 85%', once: true, onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'jp', stagger: 0.06 }) })`.
  - Initial state is `autoAlpha: 0, y: 24`, set by CSS under `html.js` only, so no-JS shows everything.
  - Vocabulary: `slideUp` (y 24 to 0) for text blocks, `fadeIn` for hairline rules and eyebrows, `scaleIn` (0.96 to 1) for the terminal panel only. `pop` (0.9) is not used: it reads playful, not instrumented.
  - `once: true`, the equivalent of toggleActions `play none none none`. Both references reverse; we do not. Reversing re-hides a claim near the bottom of the viewport every time someone scrolls up to re-read it, adding motion with no information.
- **Route h1:**
  - `SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto' })`, then `from(lines, { yPercent: 100, duration: 0.9, ease: 'jp', stagger: 0.1 })`.
  - `mask: 'lines'` clips each line (bruno-arizio's `y: 100%` reveal) without extra markup.
  - `aria: 'auto'` (the 3.15 default) labels the parent and hides the split spans, so screen readers hear the heading once.
  - `autoSplit` re-splits on resize and font load.
  - Lines beyond 4 reveal with line 4.
- **Route out:** the old view `opacity: 0, y: -12`, 0.3s, `jp`.
- **Timeline section:** the v1 progress line stays scrubbed (`scrub: true` plus the §1.3 lerp).
- **Dossier rows on home:** media parallax stays capped at ±6% (spec §8).

### 5.4 Opening choreography (2trung pattern C, without a preloader)
There is no preloader and no shutter: a preloader holds back copy that is already in the DOM. The opening is staged on one clock, starting at first paint:

| t | What | Spec |
|---|---|---|
| first paint | hero copy lines reveal through CSS `@keyframes` | y 24 to 0, opacity 0 to 1, 0.5s, `var(--ease)`, stagger 0.06s, so the copy settles by 0.68s with no JS dependency (budget: under 1.4s, spec §8) |
| first paint | static SVG rig (v1 fallback) visible in the hero slot | already in the DOM |
| `load` + idle | three.js and GSAP initialise | as v1 |
| WebGL ready | SVG rig crossfades to the live board | 0.5s, `jp` |
| then | board boot: traces draw in router order, nets staggered | 1.2s total |
| then | one amber signal pass U1 -> U2 -> U3, then hand-off to scroll control | 1.8s, `jp` |

If the visitor scrolls during boot, boot jumps to its end state and scroll takes over immediately.

## 6. Immersion without a game

### 6.1 What the visitor experiences
1. **Arrive at home.** The copy is already there. Beside it, a static diagram becomes a lit board, its traces route themselves, and one signal pulse runs the method end to end. There is no text explaining any of it and no instructions. The one verb is scroll.
2. **Scroll the hero.** The scroll drives verification:
   - Loose data drifts over DATA.
   - The signal reaches VERIFY and the data locks into a grid.
   - It reaches DETERMINE, settles, and the LED lights.

   The visitor has watched the thesis happen.
3. **Read the evidence.** Proof strip, terminal, dossier index and timeline sit over a quiet two-tone backdrop whose scan line tracks progress. No 3D competes with reading.
4. **Open a dossier.** The camera lifts off the rig, crosses the board, and settles over that project's cluster. While reading, the cluster acts as a legend for each section:
   - team pads, then receipts, then one test point per falsifiability line;
   - finally the result, with particles forming `2nd place`.
5. **Next dossier.** The camera flies cluster to cluster. **About** is a plan view of the method, with each principle lighting its IC and a pan to the fab notes. **Contact** follows the output trace to the edge connector, and a sent message sends one pulse to it. **404** looks off the edge of the board.

The board is the same place every time (seed `PCB_HERO_001`), so return visitors find things where they left them.

### 6.2 The HUD
The terminal is the HUD. It stays exactly where the approved IA puts it (home, after the proof strip), with exactly the six approved commands and the approved output strings. What v2 adds is that the terminal steers the place:
- `projects leaflink` and `projects sidequests` already navigate, and now they fly the camera.
- `verify` runs one signal pass across the rig in sync with its existing output.
- `contact` runs a pulse U3 -> J1.

No persistent HUD overlay is added. Extra chrome would compete with the evidence, and the nav already says where you are (`aria-current`).

### 6.3 Payoffs for the curious
These need no game mechanics and add no commands:
1. **Terminal drives the world** (6.2). No new copy.
2. **Seed exploration:** `?seed=explore` grows a different board around the same anchors. Every structural rule still holds, which is kill criterion 3 shown live. No new copy.
3. **Hover the rig:** an IC lifts and its traces turn amber (§3.3). No new copy.
4. **PROPOSED, needs copy approval:** a `verify site` argument, parsed like `projects leaflink`, so the command count stays at six. It hashes the bytes the visitor actually received (`fetch(location.href)`, then `crypto.subtle.digest('SHA-256')`), counts the page's claims and linked receipts from the DOM, and prints them. The receipt chain becomes something a visitor can run. Its output strings are listed in §10 and ship only if approved; if declined, nothing changes.

**Out of scope for v2:**
- achievements, leaderboards, a visitor message board, a global counter;
- audio of any kind (silent-complete);
- vehicles or any steering verb.

Each of these is either a game mechanic or needs a backend. A backend would break the "No cookies. No tracking. No analytics." colophon promise.

## 7. Performance, reduced motion, mobile

### 7.1 Tiers
The tier is chosen once at boot. It can be stepped down at runtime and never steps up within a session.

| | Tier 0 (static) | Tier 1 (mobile) | Tier 2 (desktop) |
|---|---|---|---|
| Who | no WebGPU or WebGL2, CDN failed, or an engine error | viewport under 820px, or `deviceMemory` ≤ 4, or `hardwareConcurrency` ≤ 4 | everything else |
| Canvas | none: v1 static SVG rig plus flat bg-0 | DPR cap 1.25 | DPR cap 1.5 |
| Backdrop | CSS flat colour | yes | yes |
| Board | none | 3 chunks of 1200 px, ≤ 120 components, maskGrain off if decode > 80 ms | 5 chunks of 3000 px, 2× anchor detail |
| Particles | 0 | 4,096 | 16,384 |
| Bloom | n/a | off | on |
| Flights | n/a | rise, dissolve, descend | full flight |

**Runtime downgrade:** if the median frame time over 120 frames exceeds 22 ms, step down once, in this order:
1. Bloom off.
2. Particles halved.
3. DPR 1.0.
4. Tier 0.

### 7.2 GPU gating (2trung onToggle pattern)
- **Per route:** each scene group has `visible = true` only while its route is current or is the flight target. Everything else is skipped by the renderer.
- **Per section:** the particle group is visible only while a stage slot that uses it is in view. ScrollTrigger `onToggle` sets `group.visible` on the home hero and on the dossier slots.
- **Render on demand:** the frame loop runs at 60 fps while any of these are true:
  - scroll is moving (`abs(target - current) > 1e-4`);
  - a tween is active;
  - the pointer moved in the last 2s.

  Otherwise it drops to 30 fps for the idle pulse, and stops entirely when the stage slot is off screen and the backdrop is static. A hidden tab stops the loop (v1, kept).
- **Budgets:**
  - Single-file size under 300 KB (the spec cap is 900 KB). The engine is at most 45 KB and the scene code at most 60 KB.
  - First paint of DOM copy is unaffected, because all 3D initialises after `load` (v1 rule, kept).

### 7.3 Reduced motion: a frozen, tidy diorama
Under `prefers-reduced-motion: reduce`, with a live listener (v1 snippet, kept verbatim):
- `uTime` is frozen and scroll scrub is off.
- **Resolved state:** every scene shows its end state. The rig is fully connected, particles sit on their DETERMINE lattice or glyph (never mid-noise), every linked receipt connector and test point is lit, and the LED is on.
- **Static rendering:** one frame per route enter and per resize, with no loop.
- **Routes:** route changes show the target pose with a 200 ms canvas opacity crossfade. Opacity is not vestibular motion, so this is the only motion permitted.
- **2D:** no split text, no reveals; content is present at first paint.
- **No pointer reactivity.**

The diorama must look composed: QA screenshots each route under reduced motion.

### 7.4 What mobile gets
Mobile is a full experience at lower density:
- The board, the rig, both clusters, the particle field at 4,096 and the backdrop all render.
- Stage slots are bands, not sticky columns (§1.2).
- Flights are rise, dissolve, descend (§1.5).
- There is no pointer reactivity and no hover lift.
- Tap targets stay at 44 px or more.

## 8. Anti-slop: what v2 must not become
1. A game. No vehicles, scores, achievements, leaderboards, levels or "press WASD".
2. A tech wallpaper. No circuit-board background behind text, no AI-circuit art, no neon cyberpunk, no Tron symmetry, no spaghetti traces. The board stays inside its stage slot and edges.
3. Decorative particles. Every particle is data in one of three phases (§3.1). No starfields, no ambient dust, no cursor trails.
4. Glitch effects. No RGB split, chromatic aberration, scanline CRT, noise flicker or "hacker" text scramble.
5. Generic UI. No shadcn-default cards, glass, backdrop blur, decorative shadows, gradients or pill buttons. No centered hero, no project-card grid, no skill bars (spec §3).
6. A preloader, a percentage counter, or anything that holds back copy already in the DOM.
7. Motion that blocks reading. No reveal longer than 0.5s on body copy, no scroll-jacking, no smooth-scroll library overriding native scroll, no reversible re-hiding of read content.
8. Invented facts in 3D. No day counts for "week-long", no member names or initials on the board, no stats, no placement numbers beyond `2nd place`, no drawn component for a receipt that is not linked.
9. A second accent. Amber `#ffb000` is the only signal colour. PCB copper stays inside the board edge and never marks state.
10. SaaS branding, logos, or any lifted signature interaction from the references (Bernadou's grid ruler and cursor mask, Bruno's car).

## 9. Judgment calls for Cipher (flagged, not smoothed)
- **J1.** `traceGlow` is kept per Justin's PCB spec (power traces and pours only, capped), even though the design constraints say "flat". It is the one place two authorities rub. Fallback if Cipher reads it as decorative: drop the filter, and the board loses nothing structural.
- **J2.** The PCB spec's hard limits (under 5000 SVG nodes, under 20000 trace points) are read as totals across all active chunks, not per chunk. This is the stricter reading.
- **J3.** Scroll reveals play once, not reversibly, unlike both references (§5.3).
- **J4.** The shared curve is the Material standard ease, not an expo ease-out. It starts slowly (2.6% at 10%), which is why reading contexts use the 0.5s register.
- **J5.** On mobile, flights rise, dissolve and descend instead of making a continuous flight (§1.5), because the 3-chunk streamer cannot generate the board fast enough.
- **J6.** `verify site` (§6.3, §10) is proposed, not assumed.
- **J7.** SideQuests's 24-pad ring encodes "24 hours" exactly. LeafLink's EVENT bar is deliberately undivided because the deck gives no day count.

## 10. Proposed copy delta (needs approval before build; not in deck v2.3)
Only if J6 is approved. Each line is the full string; values in braces are computed at runtime.
```
verify site
  sha256  {hex digest of the bytes this browser received}
  bytes   {byte length}
  claims  {count of proof-strip claims}, receipts linked {count of http(s) receipt links}
  compare with the committed file: {site repo URL, TBD: needs Justin's call on publishing it}
```
Error line, when hashing is unavailable (http, or no SubtleCrypto): `verify site needs a secure context. The receipts above still resolve.`

No other new strings. The canvas keeps its single approved accessible label, `Diagram of the method. Data feeds verify, verify feeds determine.`, which stays true on every route because every vignette is that diagram.

## 11. Acceptance checks the build must add to the §16 QA harness
1. **Stage mask:** at 8 desktop viewports and 393px, on every route, sampled canvas pixels outside the stage slot are no brighter than `#141414`, and every copy element's rect is clear of the slot.
2. **SCENE_DATA:** every field equals its DOM source string (§2.1).
3. **Kill criteria:** criteria 1 to 3 run as specified in §4.3. Criterion 2 also gets the human screenshot pair.
4. **Determinism:** the same seed and the same scroll value produce byte-identical board SVG strings and identical particle positions across two loads.
5. **Reduced motion:** every route renders a resolved diorama with zero running tweens and no rAF loop after the first frame.
6. **Interrupts:** navigating mid-flight never snaps the camera, and wheel input mid-transition makes copy fully visible within one frame.
7. **Perf:** on the tier 2 SwiftShader baseline, the median frame time over the hero scroll is recorded, and the downgrade ladder is exercised by throttling.
8. **Existing gates:** zero "TBD" outside comments, axe clean, `node --check`, and every existing v1 gate still passes.
