# V3 Spec: The Circuit

Status: DRAFT for Cipher's audit. Spec only; nothing here is built. Justin's rule for this step: "claude formalizes, Cipher approves."
Date: 2026-10-05
Scored against: `spec/v3-quality-rubric.md` (R1 to R11, amendments A1 to A5). Section 15 maps every rubric check to the section that satisfies it and the QA test that proves it. Section 17 says which reference each major decision comes from.
Inputs, all relayed by Bonehead in the build thread on 2026-10-05:
- the V3 request (full-bleed background, netlist as the single source of truth, valid interactions, the integration principle);
- Cipher's amendments (touch, reduced motion per interaction, no-WebGL);
- Cipher's K3 ruling (netlist graph, question closed);
- Justin's 3D++ / MOTION++ excellence bar (A to F);
- Justin's PCB shan-shui build spec (quoted verbatim in the v2 work order and still the authority for painters, router, palette, filters and limits);
- the reference package (oklou.com boot extract, the triple ease convergence, the oklou duration split, the 2trung and bruno-arizio code recipes, the bruno-simon immersion notes), relayed 2026-10-05. It overrides nothing in R1 to R11.

Binding sources that stay in force: spec/portfolio-spec.md, spec/style-brief.md, spec/standard-implementations.md, spec/copy-deck-v2.md (v2.2 plus the v2.3 amendment), and the approved v2 rulings J1 to J7 where this spec does not replace them (section 14 says which).

Stack: unchanged. One self-contained HTML file, three.js 0.186.0 (`three/webgpu`, `three/tsl`), GSAP 3.15.0 with ScrollTrigger, CustomEase and SplitText from the same pinned package. No new dependency (R11 P6). Every API this spec relies on was checked against the vendored 0.186.0 and 3.15.0 sources (section 13, with file and line).

## 0. Thesis and what changes from v2

v2 put the board in a slot beside the copy. That underuses an engine that was built to be a background. In v3 the board is the page's ground: a fixed full-viewport canvas behind every route, with the copy floating above it on readability scrims.

The board is a working circuit, not a picture of one:
- The engine emits a **netlist**: components with real footprints, pins with functions, nets with a class, copper segments on two layers, and vias.
- The netlist is the single source of truth. The static copper is painted from it, the live pulses travel on it, and every interaction resolves against it.
- Nothing on screen can move along copper that the netlist does not contain. That is what "nothing faked" means here, and the GPU implementation makes it true by construction (section 4.3).

DATA, VERIFY and DETERMINE stop being labels on three chips. They become circuit structures with recognisable topology: a length-matched input bus, a dual-path check with a loop-back, and an output driver (section 3).

Every control on the site is wired to a net (section 5). The terminal is the board's debug port. Scroll is a circuit control. Route changes power a sub-circuit and fly the camera there.

What v3 replaces from v2 (`spec/motion-brief-v2.md`):
- §1.2 stage slots: replaced by the scrim system (section 1). The mask idea is inverted: instead of masking 3D into slots, readability zones are masked over the 3D.
- §2.2 cluster grammar: rebuilt as netlist patterns (section 3).
- §3.1 particle phases: particles now ride the DATA bus lanes only (section 6.2).
- §4 engine: keeps Justin's painters, palette, filters and limits; adds the netlist model, a second copper layer and the validity pass (section 2).
- §8 anti-slop item 2 ("no circuit-board background behind text"): superseded by Justin's v3 direction, with readability now guaranteed by scrims and protected by a kill criterion (R8.2).

Everything else in v2 stays: one renderer, one scene, one camera; SCENE_DATA read from the DOM; the shared curve and its registers; the tier ladder; the reduced-motion diorama; seed `PCB_HERO_001`.

## 1. Architecture: full bleed, readability masked over the circuit (R4)

### 1.1 Layers
| z | Layer | Notes |
|---|---|---|
| 0 | `#place` canvas | `position: fixed; inset: 0; pointer-events: none`, on every route, at every viewport. One `WebGPURenderer` for the app lifetime (WebGL2 backend fallback and fresh-canvas retry kept from v1). |
| 1 | `main`, nav, footer | All DOM content. Copy blocks carry `data-scrim`. |
| 2 | dialogs (menu, lightbox) | Native `<dialog>`; the board dims behind them (section 5). |

The canvas renders the full viewport. There are no stage slots. Where the camera points is set per route by a **focus zone** (section 7.3): `camera.setViewOffset(...)` shifts the projection centre into the open area beside the copy, so the subject sits where nothing covers it, while the board continues edge to edge.

### 1.2 The scrim system
A **scrim** is a readability zone the shader applies over the rendered board. It is not a CSS gradient and not a DOM layer. It is the final node in the render pipeline, so it covers everything the canvas draws: board, IC bodies, pulses, particles, bloom and the chromatic fringe.

- **Sources:** every copy block is marked `data-scrim`: hero copy column, each section's text column, each dossier section, the about rows, the form, the terminal panel, the nav bar and the footer. Each mark resolves to one rect.
- **Rect pipeline:** document-space rects are measured on load, resize (`ResizeObserver` on `main`), font load (`document.fonts.ready`), route swap and reveal completion. Per frame they are offset by `scrollY` only, with no layout reads in the frame loop. The nav and footer use fixed viewport rects.
- **Uniforms:** `uScrim` is a `uniformArray` of 32 `vec4` (x, y, w, h in device px), with `uScrimCount` and `uScrimPreset` (pad, feather, exposure). 32 covers the densest route (home has 19 blocks) with headroom.
- **Field:** per pixel, `r = max over i of zone(p, rect_i)`, where `zone` is 1 inside the rect inflated by `pad`, falls to 0 across `feather` with `smoothstep`, and uses a rounded-rect signed distance (radius 3px, the style-brief radius).
- **Tone map inside the zone:**

```
core  = step(0.999, r)                      // inside the padded rect
lum   = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722))
inked = mix(BG0, BG1, clamp(lum / 0.55, 0.0, 1.0))   // the board compressed into the two-tone range
out   = mix(color.rgb, inked, r)
out   = core > 0.5 ? min(out, BG1) : out    // hard cap: max channel <= #141414 in every core pixel
```

`BG0` is `#070304` and `BG1` is `#141414`. Inside a scrim the board stays visible as a faint two-tone engraving: its structure continues under the copy, but it can never get brighter than `#141414`.

### 1.3 Contrast guarantee (computed with the WCAG 2.x formula)
The worst-case background inside every scrim core is `#141414` (relative luminance 0.0070):

| Text | On `#141414` | Requirement | Result |
|---|---|---|---|
| ink-0 `#f5f5f5` | 16.9:1 | 4.5:1 | pass |
| ink-1 `#858585` (micro labels, secondary) | 4.99:1 | 4.5:1 | pass |
| amber `#ffb000` (links, errors) | 10.0:1 | 4.5:1 | pass |

This is a guarantee, not a target. It holds because every text node sits inside a scrim core (QA proves containment), and the core cap is a `min()` applied after everything else in the pipeline.

### 1.4 Per-route presets
| Route | pad | feather | exposure outside scrims | Where the board shows at full strength |
|---|---|---|---|---|
| home hero | 24px | 96px | 1.0 | right of the copy column (≥1100px); the 56vh window band under the copy (<1100px) |
| home sections | 20px | 64px | 0.85 | margins and gaps between blocks; the right half at ≥1100px |
| dossiers | 20px | 64px | 0.9 | right column (the v2 sticky column becomes an open window) |
| about | 20px | 64px | 0.9 | right column |
| contact | 20px | 64px | 0.9 | right column; the 40vh window band on mobile |
| 404 | 24px | 96px | 1.0 | everything but the terminal-styled box |
| mobile (all) | 12px | 32px | 0.9 | gutters, gaps, and one unscrimmed window band per route (the v2 band positions) |

Exposure only scales the board outside scrims. It never touches the core cap.

### 1.5 Readability kill (R4.2, R8.2)
If any check finds a scrim core pixel brighter than `#141414`, or a text rect not contained in a scrim core, the background treatment is killed, not the copy. The kill switch sets `FEATURES.fullBleed = false`, which renders the board only in the v2 windows and leaves copy over flat `#070304`. Section 12 has the procedure.

## 2. The netlist engine (R1, R8.1)

### 2.1 Data model
The engine's output is one canonical object. Rendering, pulses, interaction and QA all read it.

```
Netlist {
  version: 3, seed, grid: 10, board: { w: 15000, h: 800, edge: 14 },
  layers: ['F', 'B'],                                  // top and bottom copper
  footprints: { [fp]: { pads: [{ n, dx, dy, shape, w, h }], body: { w, h }, pins: n } },
  components: [{ ref, fp, x, y, rot, role, anchor?, pins: [{ n, fn, net }], logic? }],
  nets: [{ id, cls, width, pins: ['U1.3', 'R4.1'], segs: [{ l, a: [x, y], b: [x, y] }], vias: [{ x, y }] }],
  pours: [{ net, l, poly: [[x, y], ...] }]
}
```

- `fn` is one of `in`, `out`, `bidir`, `pwr`, `gnd`, `nc`.
- `cls` is one of `data`, `signal`, `power`, `ground`.
- `logic` maps input pins to the output pins they drive, with a gate delay (section 4.2). Passives carry `pass: true` (a two-pad part conducts end to end).
- Coordinates are integers in board px, on the 10px grid.

**Canonical form:** keys sorted, components by `ref`, nets by `id`, segments in walk order from the net's driver pin, all numbers integers. The SHA-256 of the canonical JSON (UTF-8) is the **netlist hash**. R1.6 compares it across loads.

### 2.2 Footprint library
| Footprint | Pins | Used for |
|---|---|---|
| QFP16, QFP32, QFP64 | 4 sides, pitch 20px | ICs (Justin's spec: pins 16, 32 or 64) |
| SOIC8, SOIC16 | 2 sides | ID EEPROM, shift registers, line drivers |
| SOT223 | 3 plus tab | the regulator |
| R0603, C0603 | 2 | resistors, decoupling and load caps |
| LED0603 | 2 | indicator LEDs, the SideQuests ring |
| TP | 1 | test points |
| HDR1xN | N | input headers, receipt connectors, the debug header |
| EDGE10 | 10 gold fingers | J1 on the board's bottom edge |
| XTAL2 | 2 | the VERIFY reference clock |
| MTG | 1 (plated) | mounting holes, tied to ground |
| DISP | 4 (serial: clock, data, power, ground) | the DETERMINE dot-matrix display |

Pads are generated from the footprint table only. A component's pad positions are the footprint offsets rotated and translated: nothing else can place a pad.

### 2.3 Generation pipeline (deterministic; seeded by cyrb53 into xorshift, as v2)
1. **Anchors, seed-independent:** the rig, both dossier clusters (from SCENE_DATA, section 3), the power entry and regulator, the debug header, the backbone repeaters and J1. These sit at fixed coordinates, so every route always shows its true content.
2. **Filler planner, seeded:** per 600px cell, with a 1024px lookahead (Justin's spec), it places footprints from the library on the grid with keep-outs. It assigns pin functions, then creates **intent nets** under the logic rules: one driver per data or signal net, every power pin on a power net from the regulator, every ground pin to the ground pour.
3. **Router, two layers:** maze routing on per-layer occupancy grids at 10px. Moves are the 8 legal vectors only (±grid,0 / 0,±grid / ±grid,±grid).
   - Cost = length + bends × 40 + layer changes × 1000. This is Justin's `crossings × 1000` term, reinterpreted. A same-layer crossing of two nets is a short circuit, so it is illegal, never merely expensive. The 1000 penalty now buys a via pair that takes the trace under the obstacle on the bottom layer (judgment call V3-J2).
   - Diagonal moves reserve both cells they cross, so two diagonals can never X-cross between grid nodes.
   - When every route fails, the intent net is dropped, its pins become `nc`, and any component left with no nets is removed. Nothing illegal is ever drawn.
4. **Pours:** the ground pour fills the bottom layer inside the board edge minus clearances. Stitching vias tie top-layer ground pads to it. Power pours (the LeafLink EVENT bar) are top-layer polygons fed by a regulator-net trace.
5. **Validity pass:** section 2.4. It always runs in the shipped engine. In QA it also runs as an independent checker that does not share code with the generator.

### 2.4 Validity invariants and how each is enforced
| ID | Invariant | Enforced by | Rubric |
|---|---|---|---|
| V1 | Every segment direction is one of the 8 unit vectors; both endpoints are on the 10px grid | the router emits only legal moves; the validator rejects anything else | R1.1, K1 |
| V2 | Each net's copper is one connected graph containing all its pins. Every segment endpoint lands on a pad, a via, or another segment end of the same net. A via has degree ≥ 2 (no via to nowhere). No other dangling ends | net graph walk in the validator | R1.2 |
| V3 | No copper of two different nets on the same layer is closer than 6px edge to edge (centreline distance ≥ wA/2 + wB/2 + 6) | occupancy grid with inflated keep-outs; validator segment-pair test with a uniform grid hash | R1.2 |
| V4 | Every pad equals footprint offset × rotation + origin. The pin count equals the footprint's pin count. IC bodies sit inside their pad ring | pads come only from the footprint table; validator recomputes them | R1.3 |
| V5 | A net changes layer only at a via. A via joins F and B, never sits inside an IC body or on a pad, and is ≥ 20px from any other via (Justin's spec: outer ring r6, hole r2) | router places vias only at legal cells; validator checks every layer change | R1.4 |
| V6 | Power and ground nets are ≥ 6px wide; data and signal nets 2 or 3px. Pours belong only to power or ground nets. Every power pour is fed by at least one trace | planner widths; validator | R1.5 |
| V7 | Every data or signal net has exactly one driver (`out`) and at least one receiver. Every power net has exactly one source. No two outputs share a net | planner logic rules; validator | R1.2, R2.1 |
| V8 | The same seed and the same SCENE_DATA give a byte-identical canonical netlist | no `Math.random`, no time, no float accumulation in coordinates (integer grid) | R1.6 |

Any violation in the shipped engine removes the offending net and prunes orphaned components before anything is painted, and increments a `repairs` counter. QA requires `repairs === 0` on `PCB_HERO_001` and on the 20 kill-criterion seeds. A repair on the hero seed is a build failure, not a warning.

### 2.5 Painting from the netlist
Justin's painters stay as specced: `paintBoardEdge`, `paintCopperPour`, `paintICPackage`, `paintHeatsink`, `paintPassiveCluster`, `paintTrace` (stroke with `noi: 0`, flat width), `paintConnector`, all on his literal palette.
- They now take netlist records as input.
- Top-layer copper paints at full `COPPER_TRACE`.
- Bottom-layer copper paints at 30% opacity under the mask, read as seen through the board. This keeps the layer visible without competing with the top.
- Vias paint as Justin's ring plus hole.
- `traceGlow` stays capped per J1 (power traces and pours only, stdDeviation 2, opacity 0.35).

Chunking, rasterisation and limits are v2's (5 × 3000×800 desktop, 3 × 1200×800 mobile, under 5000 SVG nodes and 20000 trace points as totals per J2).

### 2.6 Kill criteria for the engine (R8.1, restated)
1. **K1: more than 5% of visible traces violate H/V/45° or look hand-drawn.** Bar: 0 violations of V1 over `PCB_HERO_001` plus 20 seeds. Every `paintTrace` call carries `noi: 0` and one width per net.
2. **K2: removing components leaves a generic tech background.** Automated: at least 90% of trace length is on nets whose both ends are component pins (with V2 this is 100% by construction; QA still measures it). Human: the components on/off pair at 1440×900 for Cipher, as in v2.
3. **K3: seed changes produce only cosmetic noise.** Operationalized per Cipher's ruling (A4):
   - **Graph:** for each seed, build the netlist graph G = (V, E). V holds one node per component, labelled with its footprint and its pin-function multiset. E holds one edge per net-to-component incidence, labelled with the net class. Trace geometry (segments, vias, coordinates) is excluded.
   - **Placement:** separately, the multiset of (footprint, x, y, rot) for filler components, quantised to the 10px grid.
   - **Measurement:**
     - Generate at least 5 seeds (QA uses 20 plus `PCB_HERO_001`).
     - Compute a Weisfeiler-Lehman graph hash (3 refinement rounds over the labels) for each graph.
     - Any two equal hashes go to an exact isomorphism test (VF2-style backtracking seeded by the WL colour classes).
     - Placement multisets compare by Jaccard.
   - **Kill:** if any two graphs are isomorphic, or two seeds differ only in trace geometry (isomorphic graphs with equal placement), K3 trips and the generator is cut back to the locked hero seed (`?seed=` disabled).
   - **Pass:** all graphs are pairwise non-isomorphic and every placement Jaccard is under 0.5.
   - This replaces the v2 "net count differs by 10%" sub-check, which closes the open v2 question.

## 3. DATA, VERIFY, DETERMINE as circuit structures (R2, R7.1, excellence D)

### 3.1 The three patterns
Each pattern is a recognisable netlist topology, not a label. QA identifies each one by its pattern in the graph and fails if a pattern is missing.

| Stage | Netlist pattern | Recognisable as |
|---|---|---|
| **DATA** | An input header drives a W-lane parallel bus into U1's inputs. The lanes are **length-matched** within one grid step using 45° serpentines (meanders built from legal moves only). Each lane has a series resistor near the header. | Parallel lanes that bend together and, because they are matched, deliver every bit at the same instant. Ambient packets and the bus particles travel here. |
| **VERIFY** | U1's outputs fan out to two paths into U2: path A directly, path B through the reference stage (the receipt connectors and the crystal-clocked reference). U2 is a comparator with `logic.mode = 'and-window'`: its STATUS output fires only when both inputs have arrived. STATUS loops back to U1's ENABLE pin through a resistor, and it also drives the test points. | A cycle in the component graph (U1 → U2 → U1) plus two converging paths of different length. The check visibly waits for the slower path, then fires. |
| **DETERMINE** | U2's result drives U3, an output driver with wide (6px) output traces. These run to the RESULT LED, the DISP display module (serial), and the output backbone toward J1. | One input, wide fan-out to indicators and the edge connector. |

### 3.2 The home rig (world X 0)
- **DATA:** an 8-lane matched bus from HDR1x8 J2 into U1 (QFP16 as v2).
- **VERIFY:** U2 (QFP32) has a reference path through crystal Y1 with two load caps. Three test points and the status LED D_STATUS sit on the STATUS net, and the loop-back resistor is R_FB.
- **DETERMINE:** U3 (QFP16) drives the RESULT LED and starts the output backbone.
- **Debug port:** HDR1x6 J_DBG sits beside U2, wired to U1's UART-RX, U2's TEST, U3's OUT-EN, the shared RESET net, U_ID (the SOIC8 ID EEPROM) and ground. The terminal drives the board through it (section 5.2).
- **Power entry:** HDR1x2 J0 at the board's left edge feeds the SOT223 regulator U_REG, which has input and output caps. A ≥ 6px power tree runs to every IC's power pin, each with its own C0603 decoupling cap within 40px.

### 3.3 The backbone
- U3's output runs along the bottom of the board (y 740, as v2's bus) to J1 at world X 120.
- It passes through a SOIC16 line driver (repeater) at X 28, X 58 and X 88. Each repeater feeds that location's cluster input header through a short tap.
- Long lines get repeaters on real boards, and these give pulses a valid path into each cluster.
- Gate delay applies at each repeater (section 4.2).

### 3.4 Dossier clusters, built from SCENE_DATA only
| SCENE_DATA field | Structure | LeafLink | SideQuests |
|---|---|---|---|
| `team` | DATA lane count, from the cluster's input header (one lane per member, no names) | 4 lanes | 2 lanes |
| `event` + `timebox` | LeafLink: one undivided power pour bar on U1's supply (`week-long` has no day count, so nothing is divided). SideQuests: a ring of 24 LEDs driven by three daisy-chained SOIC16 shift registers (8 outputs each). The chain is serial, so a pulse shifts through it hour by hour. | pour bar | 24-LED ring, 3 registers |
| `receipts` (linked http links only) | one HDR1x4 receipt connector per linked receipt on U2's path B (the reference the check compares against) | 1 | 1 |
| `tests` (falsifiability items) | one test point per item on U2's STATUS fan-out | 4 | 4 |
| `failureClass` | SideQuests only: the FAILURE CLASS state runs the shift-register chain to all 24 LEDs, which shows the timebox constraint the failure class names. LeafLink has none (unconfirmed, not rendered). | none | chain fill |
| `result` | RESULT LED on U3, plus the DISP module: its dot matrix lights the result string rasterised from the DOM (`2nd place`), driven over U3's serial nets | `2nd place` | `2nd place` |

Silkscreen stays limited to the six approved strings (`DATA`, `VERIFY`, `DETERMINE`, `TEAM`, `EVENT`, `RESULT`). Reference designators (U1, R4) are not printed (V3-J5).

### 3.5 Detail density: things worth finding, all valid per R1 (excellence D)
The bruno-simon lesson (reference package, item 5): the world is persistent and explorable, detail density rewards poking around, and the journey is the portfolio. v3 takes that with no game mechanics. The board is one place across every route, route changes are camera journeys (7.2), and the probe (5.1) is how a visitor pokes around. The DOM over its scrims is the HUD; no new HUD text is added.
- Decoupling caps at every IC power pin, with their short power and ground stubs.
- Length-matched serpentines on every DATA bus.
- Stitching vias along the ground pour edge and around the debug header.
- Series termination resistors on the DATA lanes and the backbone.
- The crystal with its two load caps on VERIFY's reference path.
- D_STATUS, the LED on U2's STATUS net beside the `VERIFY` silkscreen that latches at boot lock (7.4).
- The ID EEPROM that `whoami` queries.
- The regulator with input and output caps, and the power tree at 6px.
- Four plated mounting holes at the anchor-zone corners, tied to the ground pour.
- The SideQuests 24-LED ring on its shift-register chain.
- The RESULT LEDs and the DISP modules.

Every one of these is a footprint with pads, nets and a function, and every one can be probed (section 5.1). No fiducials or decorative copper are added, because unconnected copper fails V2.

## 4. Propagation model (R2, excellence F)

### 4.1 The physics everything hangs on
A pulse is a front moving along copper at constant speed **v = 2000 board px/s** (20 world units/s). A camera frame at home is about 19 units wide, so a pulse crosses it in about one second.

- The front is at distance `s(t) = v · (t - t0)` from its origin, measured along the copper.
- Arrival time at any copper point is `t0 + d/v + Σ gate delays`, where `d` is the shortest path length along the net graph from the origin.
- Delay is therefore proportional to trace length (R2.2). QA measures it.

### 4.2 Crossing components (the logic rules)
A pulse reaching a pad stops unless the component's `logic` passes it on:
- **Passives** (`pass: true`) conduct pad to pad with 0 delay.
- **ICs and repeaters** pass from an `in` pin to the mapped `out` pins after a **gate delay of 40 ms**, and only along their `logic` map.
- **U2 (VERIFY) is `and-window`:** STATUS fires only when both path A and path B have arrived within 600 ms. It fires 40 ms after the later arrival. If only one path arrives, the pulse dies at U2. That is what a failed check looks like.
- **Shift registers** advance one output per clock edge: 1/24 of the 0.9s state duration per step.
- **Depth limits:** a hover pulse goes 1 hop (the chip's own nets). A command or route pulse follows its defined path (section 5). Nothing propagates without a cap.

### 4.3 Implementation: on-net by construction (R2.1)
- **Trace overlay:** one `InstancedMesh` of segment quads, one instance per netlist segment, on top of the board texture at y = 0.002.
  - Per-instance attributes: endpoints `a` and `b`, `width`, `layer`, `net`, `segIndex`.
  - The material is `MeshBasicNodeMaterial` with `transparent: true`. Its `colorNode` and `opacityNode` are 0 unless a pulse lights the fragment.
- **Pulse slots:** 8 slots on desktop, 4 on mobile. On spawn, the CPU runs Dijkstra over the origin's reachable net graph, following the section 4.2 logic. It writes each reached segment's start distance into `segDist`, a `DataTexture` of 8 rows × 8192 columns of float32. Unreached segments get +∞. Each slot also carries `t0`, `class` and `strength` in a `uniformArray`.
- **Fragment shader**, for each active slot:

```
d     = segDist[slot][segIndex] + along * segLen        // along: 0..1 from the segment start in walk direction
x     = v * (time - t0[slot]) - d                       // distance behind the front
lit   = x >= 0 ? exp(-x / TRAIL) * (1 - smoothstep(0, HEAD, -x)) : 0   // decay trail, sharp head
```

  The trail constant `TRAIL` is 90 px; the head is 12 px.
- **The guarantee:** a fragment can light only if its segment has a finite `segDist`, and only the Dijkstra walk over the netlist writes finite values. A pulse cannot appear where there is no copper of a reached net. QA asserts this by reading back which segments lit and comparing them with the walk (section 15).
- **Vias and layers:** when the walk crosses a via, the via's ring instance flashes (a scale-in ring at full class colour, 0.15s). The pulse continues on the other layer at the same speed. On the bottom layer its intensity is ×0.5, read through the board.
- **Pads:** an arriving front flashes the pad (0.15s). A receiving LED lights for real (the LED lit state is part of the netlist state, not an effect).

### 4.4 Pulse aesthetics (excellence F)
Colour is coded by net class, using only colours already in the site and board palettes, so no new accent is introduced:

| Class | Pulse colour | Where |
|---|---|---|
| data | ink-0 `#f5f5f5` | DATA buses, the UART line from the debug header |
| signal | amber `#ffb000` | VERIFY paths, STATUS, the backbone, command pulses |
| power | PAD copper `rgba(220,150,70,1)` | the power tree, during boot only |
| ground | never pulses | static pour |

- Pulses always have decay trails (section 4.3). Vias always flash on layer transitions.
- Bloom (threshold 0.9) catches only pulse heads and lit LEDs.
- **Chromatic fringe on pulse peaks only (excellence A):** where `lit > 0.85` the shader evaluates `lit` at `x ± 1.5 device px` along the segment tangent. It uses those values for the red and blue channels of the head, an RGB split confined to the head geometry.
  - Capped at 1.5px.
  - Multiplied by `(1 - r)`, so it is zero inside every scrim.
  - Off on mobile and on every tier below 2.
  - It is computed from the pulse's own intensity along its own trace, so it cannot appear off-net.
  - Judgment call V3-J3, because v2 banned RGB split.

### 4.5 Ambient traffic and scroll intensity
- **DATA buses carry packets at all times:** a word every 2 s at rest, with every lane firing from the header together (matched lanes arrive together at U1).
- **Packet rate** = `0.5 Hz + 5.5 Hz × flow`, where `flow = clamp(|ScrollTrigger velocity| / 3000 px/s, 0, 1)`, smoothed with the frame-rate-independent lerp from v2 §1.3.
- Bus particle speed is multiplied by `1 + 1.5 × flow` (section 6.2).
- Only DATA buses carry ambient traffic. VERIFY and DETERMINE fire only on events. The method runs when it is asked to.

## 5. The nervous system: every control wired to a net (R2.3 to R2.5, R3, A1, A2)

### 5.1 One interaction model for chips, on every input device (A1)
The canvas has `pointer-events: none`, so it never steals input from content. A document-level `pointermove` and `click` listener hit-tests the board only when the event target is not inside a `data-scrim` block or an interactive element. The hit test is an analytic ray-plane intersection at y = 0, followed by a lookup in a uniform-grid spatial hash of netlist component bodies. No `Raycaster` scan over meshes is needed.

| Input | Chip gesture | Result |
|---|---|---|
| Mouse or pen (`hover: hover`) | hover | **pulse**: 1-hop pulse out of every `out` and `bidir` pin on the chip's nets (section 4.2) |
| Mouse or pen | click | **probe**: fanout highlight of every net on the chip's pins, steady at 60%, with the far-end components ringed in an amber hairline. Click empty board or press Esc to clear. |
| Touch (`hover: none`) | **tap = pulse plus probe**, the single model | One tap fires the 1-hop pulse and pins the probe highlight. A second tap on the same chip, a tap on empty board, or scrolling more than 1 viewport clears it. |

Long-press was rejected: it is undiscoverable, it collides with iOS and Android text-selection and context menus, and it breaks Jakob's law for a gesture that has no platform convention.

**Keyboard:** chips are not in the tab order. Chip probing is a pointer enhancement over content that is complete in the DOM. Every DOM control below has a keyboard path: its `focus` fires the same response as hover.

**Target size (Fitts):** chip hit areas are the component body inflated to at least 44 CSS px at the current zoom. When two inflated areas overlap, the nearer centre wins.

### 5.2 The terminal is the debug port (R2.4, R10 N4)
The terminal's six commands and their approved output strings are unchanged. What changes is that the terminal is wired to J_DBG, the debug header next to U2:

| Terminal event | Net path (all resolved by the section 4 walk) | Response |
|---|---|---|
| input focus | J_DBG power pin | the header's pins light steady (signal amber at 40%) while focused |
| each keypress | J_DBG.UART → U1 UART-RX (data net) | one short data pulse per key: typing is data entering the board |
| `help` | J_DBG → U1, U2, U3 debug pins in parallel | three pulses fan out together: the map of what can be driven |
| `whoami` | J_DBG → U_ID (ID EEPROM) and back on its data-out net | a round trip into the board's identity chip |
| `projects` | J_DBG → U3 OUT-EN → backbone → repeater taps at X 28 and X 58 | the pulse leaves the rig and reaches LeafLink first, then SideQuests (arrival ordered by length) |
| `projects leaflink`, `projects sidequests` | the same backbone path to that cluster's tap, plus the route flight (section 7.2) | pulse and camera leave together |
| `verify` | J_DBG → U2 TEST → a full check: U1 → path A and path B → U2 `and-window` → STATUS → loop-back to U1, then the test points, then U3 → RESULT LED | the method run end to end, in sync with the printed lines |
| `contact` | U3 → backbone → every repeater → J1 | the output leaves the board at the edge connector |
| `clear` | J_DBG.RESET → U1, U2, U3 reset pins | one reset pulse, then every lit state, probe and highlight clears |
| unknown command | J_DBG.UART → U1 only | the keystroke data arrives and nothing downstream fires, because no command decoded |

### 5.3 Wiring table: every interactive element (R3.1, R3.2, A1, A2)
"Path" is always a netlist path that the section 4 walk resolves. "RM" is the reduced-motion equivalent (A2): an instant state change rendered once, held 1.2s or for the life of the hover or focus, then cleared in one frame. Nothing travels and nothing loops. "No-WebGL" is section 9.3.

| Element | Path | Pointer and keyboard | Touch | RM equivalent |
|---|---|---|---|---|
| Skip link | current route's main sub-circuit | on activate: steady fanout of that sub-circuit for 1.2s | tap: same | instant fanout, 1.2s |
| Wordmark, nav Work / About / Contact, footer route links, 404 route links, menu-dialog links | backbone from the current anchor to the target anchor | hover or focus: the path lights steady at 40%. Activate: a signal pulse runs the path and the route flight starts (7.2) | press (pointerdown): path lights at once; tap: pulse plus flight | instant path highlight; route change uses the 200ms crossfade |
| Menu button | J_DBG broadcast → backbone → every anchor's tap | open: pulses fan out to all anchors and the board dims to exposure 0.6 behind the dialog. Close: highlights clear | same | instant: all anchor taps lit while open |
| Menu close | clears the broadcast state | instant clear | same | same |
| Hero dossier links (2) | backbone → that cluster's tap, plus that cluster's fanout | hover or focus: path and cluster lit steady. Activate: pulse plus flight | press lights; tap: pulse plus flight | instant highlight |
| Proof claim 01 (both 2nd) | both clusters' U3 → RESULT LED nets | hover or focus within: both RESULT LEDs light | tap anywhere on the claim outside its links: toggles the same | instant |
| Proof claim 02 (SideQuests) | SideQuests cluster fanout and its shift-register chain | hover: cluster lit, chain runs once | tap toggles | instant: cluster lit, all 24 LEDs on |
| Proof claim 03 (LeafLink) | LeafLink cluster fanout | hover: cluster lit | tap toggles | instant |
| Proof claim 04 (code is public) | both receipt connectors' nets | hover: both connectors lit | tap toggles | instant |
| Receipt links (proof strip, dossier index, dossier pages) | the matching receipt connector's net, matched by href against SCENE_DATA | hover or focus: connector lit. pointerdown: a pulse leaves the connector toward U2 (the link then navigates) | press: same | instant highlight |
| Terminal input | section 5.2 | section 5.2 | same (virtual keyboard keypresses) | each event: instant highlight of its path |
| Dossier index rows | that cluster's fanout | hover or focus within: cluster lit | tap on the row outside its controls toggles | instant |
| "Read the dossier" buttons | backbone → cluster tap | as hero dossier links | as hero dossier links | instant, then crossfade |
| Email links (home band, contact page) | final repeater → J1 finger 1 | hover or focus: finger net lit. Activate: pulse to J1 | press and tap: same | instant |
| Copy email buttons | final repeater → J1, all ten fingers | on copy: a pulse to the contact cluster (Justin's wiring), alongside the existing 0.3s label morph | same | instant J1 highlight, 1.2s |
| Codeberg, GitHub, LinkedIn, Phone links | J1 fingers 2, 3, 4, 5 (one finger per external interface) | hover or focus: that finger's net lit. Activate: pulse to the finger | press: same | instant |
| Contact form fields (name, email, message) | the contact input bus: three lanes into the contact line driver, one per field | focus: that lane powers (steady 40%). Each keypress: one data pulse on the lane | same | focus: instant lane highlight |
| Form submit, valid | three lanes → line driver (`and-window` over the three lanes) → J1 | all three lanes fire, the driver fires, and the pulse leaves at J1 after the visible confirmation (never before, never instead, v2 rule) | same | instant: lanes, driver and J1 lit for 1.2s |
| Form submit, invalid | only the valid fields' lanes fire; the driver waits for all three and does not fire | the pulse visibly dies at the driver, mirroring the inline error | same | instant: the valid lanes lit, the driver dark |
| Next dossier link, All work link | backbone → the next cluster's tap, or the path to home's work section | as nav | as nav | instant, then crossfade |
| Lightbox open (evidence) | that dossier's U3 → DISP serial nets | open: the display module refreshes (a pulse on its clock and data nets) | same | instant: display lit |
| Lightbox previous / next | DISP serial nets | one refresh pulse per step | same | instant |
| Lightbox close | clears the display highlight | instant | same | same |
| Chips on the board | section 5.1 | hover = pulse, click = probe | tap = pulse plus probe | hover or tap: instant fanout highlight (no travel) |
| Scroll | section 7.1 | camera drift along the board's rail, plus flow intensity (4.5) | same (native touch scroll) | no drift: poses switch at section thresholds with the 200ms crossfade; flow off |
| Route change (any source) | the target sub-circuit powers (section 7.2) | one composed move | rise, dissolve, descend | crossfade to the resolved target pose |

The QA sweep (R3.2) enumerates every `a[href]`, `button`, `input`, `textarea` and `[tabindex]` in the built file. It fails if any element has no wiring entry, and it fires each one, asserting the response arrives within 400 ms (R9 Doherty, R11 P5).

### 5.4 Route change activates its sub-circuit (R2.5)
| Route | Sub-circuit powered on arrival | Camera |
|---|---|---|
| home | the rig: power tree on, DATA bus ambient traffic | the home rail (7.1) |
| leaflink, sidequests | the cluster: its tap, input lanes, U1 to U3, LED, DISP | v2 dossier poses on the focused IC, with the v2 state machine (DATA → VERIFY → DETERMINE as sections cross top 60%) now driving real pulses |
| about | the rig in plan view; each PRINCIPLES item fires its IC's stage (U1, U2, U3) as it crosses top 60% | v2 plan view |
| contact | the contact cluster (input bus, line driver, final repeater, J1) | the contact pose fixed in commit c7f0b3c (looking back up the output trace at J1) |
| 404 | nothing powers; the board edge is dark beyond it | v2 void pose |

"Powered" means the sub-circuit's nets switch to their active state: base copper raised from 0 to 25% class colour in the overlay, ambient traffic running where the pattern has any. Everything else on the board stays at rest.

## 6. TSL layer (excellence A, R4.3)

### 6.1 Two-tone dithered backdrop
Kept from v2 §3.2: `scene.backgroundNode` is a Bayer 4×4 two-tone field over `screenCoordinate`, capped at `#141414`. In v3 it is visible only beyond the board's top and bottom edges and in the 404 void, because the board fills the viewport elsewhere. The scan band still tracks `scroll.current`. Source: 2trung's fullscreen TSL `backgroundNode` with Bayer dither and a scroll-scrubbed visibility uniform (reference package, item 4).

### 6.2 GPU particle field on the DATA buses (2trung's TSL points recipe, reference package item 4)
- **Construction:** `new THREE.Sprite(new PointsNodeMaterial(...))` with `sprite.count = N`. Instanced sprites are the sized path under WebGPU, because `Points` primitives are 1px there (W:29598, W:29645).
- **Counts:** N is 4,096 on tier 2 and 1,024 on tier 1. Tier 0 has none.
- **Every particle is a data packet on a lane:**
  - Attributes: `aLane` (lane index) and `aPhase` (0..1, from the seeded hash).
  - Lane polylines come from the netlist's DATA bus segments. They are resampled by arc length into a `DataTexture` of lanes × 256 positions.
  - Position: `lanePos(aLane, fract(aPhase + time · v · (1 + 1.5 · flow) / laneLen))`, sampled with `texture()` in `positionNode`.
- **Packet behaviour:** particles are absorbed at U1's input pins (alpha 0 over the last 2% of the lane) and re-emitted at the header.
- **Off-lane is impossible:** position is a pure function of the lane texture. No particle can sit off copper (R2.1), and none drifts free (v2's noise cloud is removed).
- **Colour:** ink-0 at 70%, under the bloom threshold. A DATA packet is not a verified result, so it is never amber.
- **Fake depth of field:** v2's `alpha *= 1 - smoothstep(0, 2.5, |viewDist - uFocusDist|)`, 2trung's alpha-against-depth trick. No post pass.
- **Taken from 2trung:** node-driven colour, opacity, position and size on one `PointsNodeMaterial`, and fake depth of field. **Not taken:** curl-noise displacement, because it would move packets off copper (R2.1), and per-particle chromatic clones (fringe is for pulse heads only, 4.4).

### 6.3 Chromatic fringe
Section 4.4: pulse heads only, capped at 1.5px, zero inside scrims, tier 2 only. Source: 2trung splits RGB by drawing three channel clones nudged in screen space with no post pass. v3 does the same offset inside the trace shader, sampling `lit` at ±1.5px per channel, so it costs no extra draw and stays on the head's own segment.

### 6.4 Render pipeline
`RenderPipeline` (W:90575; `PostProcessing` is deprecated since r183) chains the following:
- `pass(scene, camera)` with MRT `{ output, emissive }` (W:43207, W:37166). Pulse heads, lit LEDs and the DISP write emissive.
- `bloom(scenePass.getTextureNode('emissive'), 0.35, 0.2, 0.9)` (BloomNode.js:597), tier 2 only.
- The scrim node (section 1.2).
- `fxaa()` (FXAANode.js:364) on `renderOutput(...)`.

MSAA is off (`samples: 0`). The trace overlay antialiases analytically with `fwidth`, the board texture is mipmapped, and FXAA handles IC body edges. At full-viewport size, 4× MSAA alone would cost about 140 MB of render targets at 1440×900 and DPR 1.5 (section 8.3).

## 7. Motion (R5, excellence B, C, E)

**The timing split (reference package, item 3, from oklou.com):** the DOM runs on the tight register, and the circuit carries the cinematic timing. DOM micro-interactions are 0.15s and 0.3s, reveals 0.5s with a 0.08s stagger, starting at `top 85%`. The long durations (1.8s camera, the 4.8s boot, pulse travel at physics speed) all live in the canvas. The one DOM exception is the route heading at 0.9s, which R5.1 fixes; its split-line reveal follows bruno-arizio's transition-wired split text (stagger 0.1, wired to the route change), on the shared curve instead of Power4. **The curve:** `cubic-bezier(0.4, 0, 0.2, 1)` is the default, not a choice. utazon.fr (18 uses), cleanlystudio.pro (104) and oklou.com (9) converge on it independently (reference package, item 2), and v2 already registered it as `jp`.

### 7.1 Scroll is a circuit control (excellence B, R3.3)
**Camera drift on a rail.** Each route has a rail: a `CatmullRomCurve3` through board waypoints, one per section. A ScrollTrigger per section (`start: 'top center'`, `end: 'bottom center'`, `scrub: true`) writes the rail parameter `s`. The frame loop eases toward it with v2's single lerp (one smoothing source), and the camera rides `rail(s)`.

| Home section | Waypoint (world X) | What the camera shows |
|---|---|---|
| hero | 0, the rig | the method assembling as hero progress drives real pulses (DATA bus traffic, then a VERIFY check at p 0.15 to 0.60, then DETERMINE and the LED at 0.90) |
| 01 Receipts | 3 | U3 and the start of the backbone; the claim wiring (5.3) lights clusters that are still ahead on the rail |
| 02 Terminal | 7, J_DBG | the debug port the terminal drives, in frame while the terminal is on screen |
| 03 Dossiers | 30, then 60 | each row's cluster arrives as its row crosses centre |
| 04 Timeline | 60 to 100 | the long backbone run and the repeater at 88 |
| 05 Contact | 120, J1 | the edge connector the copy-email and email pulses reach |

Dossiers keep v2's discrete pose states (0.9s on `jp`), with a scrubbed drift of ±1 unit along X inside each state. About keeps the plan view and the pan to the fab notes. Contact keeps the c7f0b3c pose with ±0.5 units of scrubbed drift.

**Signal-flow intensity:** section 4.5 (`flow` from ScrollTrigger velocity drives packet rate and bus particle speed).

**Jank rules (R11 P7):**
- Rail waypoints are fixed per section.
- Section rects are cached on resize, never read per frame.
- ScrollTrigger runs with `scrub: true` (no GSAP smoothing), and native scroll is never hijacked.
- Each cluster's meshes sit in one `Group`. A ScrollTrigger `onToggle` per rail section sets `group.visible`, so the GPU skips clusters that are off screen (2trung, reference package item 4). Copper on the board texture is unaffected; only the live overlay and IC meshes are gated.

### 7.2 Route change: one composed move (excellence E, R2.5, R5.1, R5.2)
Architecture from bruno-arizio (reference package, item 4): one persistent renderer, scene and camera, with a module per route that exposes `enter()` and `leave()`. Each returns a promise, and the router awaits `leave()` before it builds the next `enter()`. Here those modules add their tracks to one master `gsap.timeline()` per navigation, which owns every track, so the move is composed, not three tweens racing:

| t (s) | Track | What | Duration, ease |
|---|---|---|---|
| 0.00 | DOM out | old view `opacity 1 → 0`, `y 0 → -12` | 0.3, `jp` |
| 0.00 | Scrim out | old scrim zones collapse (feather to 0, then count to 0) | 0.3, `jp` |
| 0.00 | Camera | proxy `k` 0 → 1. The camera follows `curve(k)`, v2's CatmullRom through a raised midpoint, via a critically damped spring (half-life 0.12s) | 1.8, `jp` |
| 0.00 | Circuit | a signal pulse runs the backbone from the old anchor to the new one (physics speed; it leads the camera) | physics |
| 0.30 | DOM swap | new view shown, scroll reset, focus to h1 (v1 behaviour) | instant |
| 0.45 | Scrim in | new zones grow from their rects (feather 0 → preset) | 0.5, `jp` |
| 0.45 | Heading | `SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto' })` lines from `yPercent: 100` | 0.9, stagger 0.1, `jp` |
| 0.45 | DOM in | rest of the view `opacity 0 → 1`, `y 24 → 0` | 0.5, `jp` |
| 1.20 | Circuit | the target sub-circuit powers (5.4) as the camera nears it | 0.3 base-copper rise, `jp` |

Interrupts:
- **Wheel, key or touch:** `master.seek(Math.max(master.time(), 0.95))`. All DOM and scrim tracks complete at once and copy is fully visible within one frame. The camera cannot snap, because it follows `k` through the spring.
- **New navigation mid-flight:** `master.kill()`. The next master starts from the camera's current pose, so there is never a snap back.

Settling (R5.2): the spring snaps to its target when |Δ| < 1e-4 and the frame loop goes idle. QA's two-load test asserts byte-identical poses and pixels, as v2.

Pulses are physics, not tweens: they move at constant v (section 4.1) and are never eased. Everything else uses the one curve and the five registers:

| Register | Duration | Used by |
|---|---|---|
| press | 0.15s | button press, pad and via flashes |
| micro | 0.3s | hover states, the copy-email morph, scrim collapse, highlight on and off |
| reveal | 0.5s | scroll reveals (once, `ScrollTrigger.batch` with `start: 'top 85%'` and stagger 0.08, after oklou), scrim growth, DOM in. Oklou reverses reveals on scroll-up (`play none none reverse`); v3 keeps v2 J3, play once, which Cipher approved |
| heading | 0.9s | route h1 lines, dossier pose states |
| camera | 1.8s | flights |

All of these use `CustomEase.create('jp', 'M0,0 C0.4,0 0.2,1 1,1')` and its CSS twin `cubic-bezier(0.4, 0, 0.2, 1)`.

### 7.3 Focus zones
Each route defines the region of the viewport where its subject should land: right of the copy column at ≥1100px, and the window band on mobile. `camera.setViewOffset(fullW, fullH, x, y, w, h)` (C:47049) shifts the projection so the rail's look target projects into the centre of the focus zone, while the frame still renders full bleed.

### 7.4 The peak moment: the board powers on and locks onto VERIFY (excellence C, R9 peak-end)
The boot is the one composed signature moment. Its arc is taken from oklou.com's intro (reference package, item 1): **noise, then sweep, then lock-in, where the readout resolves into the identity.** Oklou's tuner rolls digits through static and locks on its name. Here the board fires unsynchronised traffic, its VERIFY check searches and fails while the reference clock settles, and the first passing check locks the loop and lights VERIFY. Every step is a real netlist event in power-on order, so the peak is also the clearest proof that the circuit is real.

The physics of the sweep is crystal start-up, which real oscillators do: Y1's tick interval starts irregular and converges to a steady 250ms. Path B into U2 departs on Y1 edges, so while Y1 is unsettled its arrivals fall outside the 600ms `and-window` and each check dies at U2. The tick schedule is a fixed table, so the lock lands at the same time on every load (R1.6, R5.2). U1's ENABLE gates only its UART input; the data path runs from power-up.

One part needs a footprint the earlier sections did not list: **D_STATUS**, an LED0603 on U2's STATUS net beside the `VERIFY` silkscreen, the role oklou's lit TUNED label plays. It is a valid component with pads and a net (R1.2), and it can be probed.

| t (s, from WebGL ready) | Event (netlist) | What the visitor sees | Oklou step |
|---|---|---|---|
| before 0 | nothing: the renderer is loading | flat `#070304` behind the hero copy. The black beat is the real load time; nothing is added to it (R11 P2, Doherty) | (2), (3) |
| 0.00 | board appears unpowered at rest exposure 0.25 | a hard cut, no crossfade | (3), (4) |
| 0.00 to 0.70 | power front from J0 → U_REG → power tree (power class, copper pulses at v) | copper light runs the power tree. Each decoupling cap flashes as it is reached, and board exposure rises behind the front (`uPowerFront`, driven by arrival times) | (4) |
| ≈0.70 | each IC's power pin reached → that IC powers | IC body edges brighten (0.15s); local nets rise to rest | (4) |
| 0.80 to 1.40 | **noise:** filler nets fire packets on a seeded, unsynchronised schedule (on-net, from each net's driver). DATA words reach U1. Y1 starts with irregular ticks | scattered traffic all over the board, the static between stations | (5) |
| 1.40 to 2.80 | **sweep:** five checks. Each DATA word leaves U1 on path A and path B; path B waits on a Y1 edge; the arrivals miss the window and the pulse dies at U2's input pad. Y1's interval converges toward 250ms | five visible failed checks (a dim flash at U2's pad each time), the crystal net ticking faster and steadier like rolling digits | (5) |
| 1.60 to 2.80 | camera push-in toward U2 (1.2s, `jp`) | the check fills more of the frame as it nears lock | (6) |
| 2.80 | **lock:** both arrivals inside the window → STATUS fires → D_STATUS lights amber and stays lit; the test points flash; R_FB loop-back drives U1 ENABLE high. The noise schedule ends and filler nets drop to rest | the board goes quiet except for one steady amber LED beside `VERIFY`. Noise becomes identity | (7) |
| 2.90 to 3.90 | J_DBG → U1 UART (now enabled): the approved boot line `jp shell. type help for commands.` as 33 data pulses, 30ms apart | **each character prints when its pulse arrives at U1**, in the terminal log and in the hero boot readout (V3-J1) | |
| 3.00 to 4.80 | camera pull-back to the hero rest pose (1.8s, `jp`) | the rig settles small beside the copy, VERIFY still lit | (8) |
| ≈3.10 | first verified word → U3 → RESULT LED | one full method pass; the LED lights | |
| ≈4.80 | hand-off | the readout crossfades (0.3s) to the existing scroll cue; scroll owns the board | (8) |

Content never waits for the boot: the hero copy is on screen at first paint (CSS reveal, settles by 0.68s, v2 §5.4). Oklou keeps "skip intro" on screen throughout so the cinematic never traps anyone. Here the same rule holds without new copy: scroll, wheel, key, pointer or touch during the boot jumps it to its end state (locked, powered, line printed) in one frame, and the boot runs on the first load of a session only. The shell accepts input from its first frame and typing ends the boot. The shell stays "a working shell, not a typing animation" because no character prints on a timer: each one is a pulse arriving through the netlist.

Not taken from oklou: the start gate. Oklou's click-to-start exists to unlock audio. This site has no audio, and a gate would hold the content behind a click, which fails Doherty, Tesler, R11 P2 and the rule that content never waits (V3-J9).

Under reduced motion the board renders powered and locked (D_STATUS lit) and the boot line prints whole (section 9.1).

### 7.5 Mobile (R5.4)
- **Flights:** route changes on tier 1 rise, dissolve and descend over the same 1.8s as v2 (J5 kept). The camera rises over 0.6s while the board fades over 0.3s, translates while hidden, then the board fades in over 0.3s as the camera descends over 0.6s.
- **Scroll:** the rail drift still runs, but at half amplitude.
- **Pulses:** 4 pulse slots. No chromatic fringe, no bloom.
- **Touch model:** section 5.1.

## 8. Performance (R6, R11)

### 8.1 Tiers and the ladder (R6.1, R11 P4)
Detection is kept from v2. Tier 1 is width < 820px, or `deviceMemory` ≤ 4, or `hardwareConcurrency` ≤ 4. Tier 2 is everything else. Tier 0 applies when the renderer fails, or when the ladder reaches the bottom.

| | Tier 0 | Tier 1 | Tier 2 |
|---|---|---|---|
| Canvas | one static frame of the resolved board with scrims, re-rendered on demand only (no loop) | DPR cap 1.25 | DPR cap 1.5, and render pixels capped at 4.2 MP (`dpr = min(cap, sqrt(4.2e6 / (w·h)))`) |
| Board | full netlist, static | 3 × 1200px chunks | 5 × 3000px chunks plus 2× anchor detail |
| Pulses | instant highlights (the RM equivalents) | 4 slots | 8 slots |
| Bus particles | 0 | 1,024 | 4,096 |
| Bloom, fringe | off | off | on |

Runtime ladder, never stepping up within a session. If the median of 120 consecutive active frames exceeds 18ms (60fps needs 16.7; 18 allows for jitter), it steps down once, in this order:
1. Bloom and fringe off.
2. Bus particles halved.
3. Pulse slots 8 → 4.
4. DPR 1.0.
5. Tier 0.

Tier 0 is fully readable: the scrims and the contrast guarantee apply to its static frame exactly as to a live one (R11 P4).

### 8.2 Hard budgets (R11)
| ID | Budget | How it is measured |
|---|---|---|
| P1 | 60fps sustained on tier 2: median ≤ 16.7ms, p95 ≤ 20ms, under 1% of frames over 33ms, across a 10s scripted window mixing scroll, pulses and one camera flight | `?perf=1` runs the script and reports frame timing from `renderer.info.render.timestamp` plus `requestAnimationFrame` deltas, as JSON on screen and in the console (section 16: needs a real GPU) |
| P2 | LCP < 2.5s, TTI < 3.5s, desktop broadband (40 Mbps, 20ms RTT) | Playwright with CDP network throttling. LCP from `PerformanceObserver('largest-contentful-paint')`. TTI by Lighthouse's definition: the first 5s window after FCP with no long task and at most 2 in-flight requests, computed from `PerformanceObserver('longtask')` and resource timing |
| P3 | GPU memory ≤ 192 MB tier 2, ≤ 48 MB tier 1 | section 8.3 |
| P4 | ladder engages; tier 0 fully readable | throttled run (CPU ×4 plus SwiftShader) must reach tier 0, then the scrim pixel probe and axe run on it |
| P5 | every interaction acknowledges within 400ms | the 5.3 sweep timestamps input events against the first frame showing the response (origin flash or highlight) |
| P6 | single file ≤ 500 KB uncompressed; CDN deps pinned; no new dependency | byte count in QA; importmap SRI check. v2 is 237,912 bytes; v3 is estimated at 330 KB (netlist engine +55 KB, interaction and wiring +30 KB) |
| P7 | no scroll jank | DOM animates only `transform` and `opacity`; no layout reads in the frame loop; netlist generation runs in `requestIdleCallback` slices ≤ 8ms; QA asserts zero long tasks over 50ms during a scroll sweep after boot |

### 8.3 GPU memory, re-baselined for full bleed (R6.2, R6.3, R11 P3)
v2's "about 110 MB" counted chunk textures only. At full bleed the render targets matter as much as the board, so the baseline is recomputed with both. These are estimates. The build measures them and reports the measured figure.

| Allocation | Tier 2 at 1440×900, DPR 1.5 (2160×1350, 2.92 MP) | Tier 1 at 393×852, DPR 1.25 (0.52 MP) |
|---|---|---|
| chunk textures (RGBA8 plus mips ×4/3) | 5 × 3000×800 = 64.0 MB | 3 × 1200×800 = 15.4 MB |
| anchor detail (2×) | 20.5 MB at rest, 41.0 MB peak in a flight | none |
| scene colour (RGBA16F) plus depth (32-bit) | 23.3 + 11.7 MB | 4.2 + 2.1 MB |
| bloom chain (half res, mip pyramid) | ≈ 15.6 MB | none |
| output and FXAA (RGBA8) | 11.7 MB | 2.1 MB |
| netlist data (segDist, lanes, instance attributes) | ≈ 1.0 MB | ≈ 0.4 MB |
| **total** | **≈ 148 MB at rest, ≈ 169 MB peak** | **≈ 24 MB** |
| budget | 192 MB | 48 MB |

At 2560×1440 (DPR capped by the 4.2 MP rule to 1.07), the render targets total about 72 MB, so the tier 2 peak is about 178 MB, still inside 192 MB.

**Method (reported with the number):**
- A build-side allocation registry wraps every texture and render-target creation. It records width × height × bytes per texel × mip factor × samples.
- That registry total is cross-checked against `renderer.info.memory.texturesSize` and `total`, which are in bytes in r186 (W:32409-32427).
- Both are reported at rest and at the peak of a flight.
- A measured figure over budget fails P3. The fix is a smaller detail texture or a lower DPR cap, never a raised budget.

The chunk budget (R6.3) holds at full bleed: 5 desktop chunks cover the whole 150-unit board, so no camera position needs more, and mobile streams 3 chunks around the rail position.

## 9. Reduced motion, fallbacks, no WebGL (R5.3, A2, A3)

### 9.1 Reduced motion
Under `prefers-reduced-motion: reduce`, with the v1 live listener:
- **Board:** fully resolved and powered. The rig's method pass is complete with its LED lit, each cluster sits in DETERMINE state with its LED, DISP, test points and (SideQuests) all 24 ring LEDs lit, and the contact cluster is powered.
- **No loop:** no rAF-driven animation. The render loop is off, and three's internal animation loop is parked (`renderer._animation.stop()`, because it rAFs even with no loop set, W:30248). ScrollTrigger is disabled, because its `_rafBugFix` keep-alive rAFs while enabled (G/ScrollTrigger.js:61). Both fixes are already proven in v2 (0 rAF calls in QA).
- **Rendering:** one frame per route enter, resize, or interaction state change.
- **Interactions:** every wired interaction uses its instant equivalent from the RM column of 5.3. Nothing travels, nothing loops, nothing goes dead.
- **Camera:** route changes use the 200ms canvas crossfade (opacity only). Scroll drift is replaced by pose switches at section thresholds, each with the same crossfade.
- **2D:** no split text and no reveals; content is complete at first paint.
- **Boot:** the board renders powered and locked (D_STATUS lit, noise schedule skipped), and the boot line prints whole.

### 9.2 Tier 0 (WebGL present, too slow, or the ladder bottom)
One static frame of the resolved board, with scrims, re-rendered only on interaction (RM equivalents) and on route change. Fully readable by the same contrast guarantee.

### 9.3 No WebGL at all (A3)
When neither WebGPU nor WebGL2 initialises, or the CDN fails:
- **Content:** complete and identical. Every word reads without the canvas (the existing colophon promise).
- **Board replacement:** the same engine still runs, because it is CPU and SVG. It renders the current route's anchor region in plan view as one SVG. The SVG becomes a fixed full-viewport `<img id="board-static">` (`object-fit: cover`, z 0) through an SVG `feComponentTransfer` filter that maps every colour into the two tones `#070304` to `#141414`. The board reads as a faint engraving with every pixel at or below `#141414`, so the 1.3 contrast table holds everywhere with no scrims needed.
- **Route change:** swaps the image (instant, or the 200ms crossfade when motion is allowed).
- **Interactions:** controls keep their native behaviour (links navigate, the terminal answers, the form submits). There is no circuit, so there are no circuit responses, and this is the only state in which a control has no circuit response. The no-WebGL state is detected and recorded in `html[data-renderer="none"]`, and QA asserts it.
- **No JavaScript:** flat `#070304` and complete content (v1, kept).

## 10. UI/UX law compliance (R9, target 100)
Score = 100 × passed / applicable. Every permanent check applies. A selective check applies only when its trigger holds. Banned claims are never cited: Zeigarnik memory, "7±2", a duplicate Postel, and "minimize target distance" as a standalone law.

### 10.1 Permanent checks
| Law | How v3 satisfies it | QA |
|---|---|---|
| **Fitts** | Every DOM target is ≥ 44px (v1 gate, kept). Chip hit areas are inflated to ≥ 44 CSS px (5.1). One primary action per view, styled `btn--primary` (amber fill, the largest control in its block): home **Copy email** in the contact band, dossiers the header **Repo** receipt, contact **Send** (already primary in v1), 404 `cd ~`. The first, second and fourth are restyles with no copy change (V3-J6). About has none. On mobile each primary sits at the end of its block in the thumb zone. There are no destructive actions on the site (terminal `clear` only clears the shell's own output). | target-size sweep at 393px and desktop; primary is the largest control in its block |
| **Hick** | At most one primary per view (above). Secondary actions are plain links. The chip probe is progressive disclosure: invisible until the pointer reaches the board, never required. | count `btn--primary` per view = 1, or 0 on about |
| **Jakob** | Conventional: top nav with `aria-current`, hash routes that behave like pages (back and forward, focus to h1), a form with visible labels and inline errors, `mailto`, and a copy button with a label morph. Invented patterns, each flagged with its novelty budget: chip hover, tap and probe on the canvas (R10 N3); the terminal driving the board (R10 N4; a shell is conventional for this audience of engineers); the boot readout (V3-J1). | pattern inventory review |
| **Gestalt** | Proximity: style-brief spacing tokens, with related items adjacent. Containment: each scrim is one region per related block, so the board's engraving separates unrelated blocks. Similarity: one link style, one receipt style. Uniform connectedness: a hovered DOM item and its circuit light together (5.3), which connects copy to its structure. | screenshot review |
| **Tesler** | The system absorbs the complexity: tier detection, the ladder, scrims, reduced motion from the OS, the single touch gesture, and probe clearing on scroll. The visitor configures nothing and reads no instructions. No cost is shifted to the user. | review against this list |
| **Doherty** | Every input is acknowledged by the next rendered frame (≤ 17ms at 60fps, ≤ 33ms in the idle 30fps pulse). The acknowledgement is the origin flash or highlight, never the end of a long pulse. DOM acknowledgements: terminal echo, label morph and form status all start at once. Route DOM-out starts at t = 0. | 5.3 sweep, input-to-response under 400ms on every control |

### 10.2 Selective checks
| Law | Trigger | How v3 satisfies it |
|---|---|---|
| **Von Restorff** | a view with a primary action | Exactly one isolated element per view: its `btn--primary`, the only amber-filled control on the view (other amber is text or hairline, per the style brief). Amber pulses on the board are transient and sit under scrims, never beside the primary. About has no primary, so the check does not apply there. |
| **Peak-end** | every journey | One peak per journey: the boot (7.4), on first load only. Every flow ends cleanly. A dossier ends on Next dossier plus All work. Contact ends on the visible confirmation and the J1 pulse. The 404 lists every route. The terminal always answers `help`. No view is a dead end. |
| **Serial position** | nav and ordered lists | The nav runs Work … Contact (the two critical items at the ends). Proof claims open with 01 (both placed 2nd) and close with 04 (code is public). Each dossier opens with its header facts and closes with evidence and onward links. |
| **Miller (corrected)** | any view with simultaneous demands | Content is chunked, never counted: numbered dossier sections, grouped meta rows. No view asks for more than three things at once (contact: form, email, hosts). |
| **Postel (single copy)** | form and terminal input | Forgiving input: trimmed, case-insensitive email and commands. Strict, clear validation: `EMAIL_RE` with `Enter a valid email address.` (standard-implementations, verbatim). The circuit mirrors it, with the pulse dying at the driver (5.3). |
| **Ovsiankina plus goal-gradient** | a multi-step flow | Not applicable: the site has no multi-step flow (the contact form is one step). Excluded from the denominator, and stated here so the auditor can disagree with evidence. |

## 11. Novelty (R10, target 100)
| Check | How v3 satisfies it |
|---|---|
| **N1 no template read** | A custom design language: a working circuit engraved under the copy in two tones, mono micro labels, and one amber signal. No cards, no CSS gradients, no glass, no blur, no centered hero, no project grid (v2 anti-slop, kept). Cipher's side-by-side check against shadcn and Awwwards templates decides. |
| **N2 netlist interaction real and central** | R2 is the prerequisite. Every circuit response in 5.3 resolves against the netlist, and the board is the page's ground on every route. No novelty is claimed for decoration. |
| **N3 an interaction unseen on portfolio sites** | Three: trace-length-timed propagation (pulses arrive in order of copper length, through gate delays); chip fanout probing on tap or click; and a VERIFY check that visibly waits for the slower of two paths before firing (`and-window`). None appears in the six references studied (2trung, bruno-arizio, bruno-simon, utazon, cleanlystudio, oklou). That they are unseen elsewhere is an inference beyond those six, flagged as such. |
| **N4 terminal as a first-class control surface** | The terminal is the debug port (5.2). Keystrokes are data on the UART net, every command drives named nets, and `clear` resets the board. |
| **N5 novelty spent where it pays** | The novelty budget goes to the canvas and the terminal only. Nav, routing, forms, links and the copy button stay conventional (R9 Jakob). |

## 12. Content integrity and kill switches (R7, R8)

### 12.1 Content integrity
- **R7.1:** SCENE_DATA is read from the DOM as in v2. QA asserts equality for every field, plus the structures built from them:
  - lane count equals team size;
  - ring LED count equals the hours number in the DOM (24), or there is no ring;
  - test points equal the falsifiability items;
  - receipt connectors equal the linked receipts;
  - the DISP text equals the DOM result string.
- **R7.2:**
  - The visible copy diff against v2 is 0 lines. QA checks this as in v2.
  - Claim 04 reads `Code is public.` with the Codeberg link only.
  - Zero em or en dashes, and zero visible TBD.
  - The hero boot readout repeats the approved `TERM.boot` string (V3-J1). If Justin declines it, the readout is off and the boot prints only into the terminal log.
- **R7.3:** `verify site` stays off (v2 J6).

### 12.2 Kill switches (R8.2, R8.3)
Every v3 feature sits behind a flag in one `FEATURES` object: `fullBleed`, `pulses`, `probe`, `fringe`, `busParticles`, `scrollRail`, `boot`, `seedExplore`.

| Kill | Trigger (QA, or the auditor's evidence) | Cut |
|---|---|---|
| Pulse off-net (R2.1) | any lit segment outside the netlist walk, in the readback test (15) | `pulses = false`. Every wiring falls back to its instant highlight, which reads only netlist segments; if that also fails, `probe = false` too |
| Background harms readability (R4.2) | any scrim-core pixel above `#141414`, any text rect outside a scrim core, or an axe contrast failure | `fullBleed = false`: the board shows only in the v2 windows and copy sits over flat `#070304` |
| K1 / K2 / K3 (2.6) | as specified | K1 or K2: the generator is cut back to the anchors only. K3: `seedExplore = false` and the locked hero seed |
| Chromatic fringe over copy | any fringe pixel inside a scrim | `fringe = false` |

A tripped kill sets its flag to false in the shipped file and the feature is gone. It is never tuned, masked or special-cased to get back under the bar (R8.3).

## 13. Upstream APIs relied on (verified in the vendored sources)
Paths: **W** `three@0.186.0/build/three.webgpu.js`, **C** `build/three.core.js`, **T** `build/three.tsl.js`, **J** `examples/jsm/`, **G** `gsap@3.15.0/`. Imports: `three/webgpu` → W (it also re-exports C), `three/tsl` → T, `three/addons/*` → J (three package.json:16-19). The two optional doc fetches (TSL_AI_RULES.md, webgpu-claude-skill) were skipped by decision. If they are approved later, this table is re-checked against them.

| API | Where | Used for | Note |
|---|---|---|---|
| `WebGPURenderer({ antialias, forceWebGL, samples })` | W:90424 | the one renderer; WebGL2 backend fallback | `samples: 0` (6.4) |
| `renderer.init()`, `setAnimationLoop()` | W:62446, W:63729 | boot, frame loop | `init` starts `_animation` unconditionally (W:62504) |
| `renderer._animation.start()` / `.stop()` | W:30246 | parking the internal rAF in reduced motion and when idle | private API, pinned version; proven in v2 |
| `renderer.info.memory.*Size`, `.total` | W:32409-32427 | P3 cross-check | bytes |
| `RenderPipeline(renderer, outputNode)` | W:90575 | post chain | `PostProcessing` is deprecated (W:91048) |
| `pass()`, `PassNode.setMRT()`, `getTextureNode()` | W:43207, W:42701, W:42807 | scene pass with emissive MRT | |
| `mrt`, `output`, `emissive` | W:37166, W:5534, W:5390 | bloom source | |
| `bloom(node, strength, radius, threshold)` | J/tsl/display/BloomNode.js:597 | tier 2 bloom | params are uniforms (`.value`) |
| `fxaa(node)` | J/tsl/display/FXAANode.js:364 | AA without MSAA | needs sRGB input: `renderOutput()` first (W:12059) |
| `MeshBasicNodeMaterial` (`colorNode`, `opacityNode`) | W:24429, W:21693 | trace overlay, IC bodies | |
| `PointsNodeMaterial` on `Sprite` with `count` | W:29598, C:22467 | bus particles | `sizeNode` is a no-op on `Points` under WebGPU |
| `InstancedMesh` | C:25412 | trace segments, IC bodies, via rings | one draw each |
| `DataTexture`, `CanvasTexture` | C:24892, C:29504 | segDist, lanes; chunk rasters | |
| `texture.anisotropy` | C:7426 | chunks | WebGPU applies it only with all-linear filters (W:79479) |
| `scene.backgroundNode` | W:58048 | dither backdrop | |
| `PerspectiveCamera.setViewOffset()` | C:47049 | focus zones | |
| `CatmullRomCurve3` | three core | flights, rails | |
| `renderer.readRenderTargetPixelsAsync(rt, x, y, w, h)` | W:64887 | QA only: the pulse readback (Q7) reads the segment-id target | not in the shipped path |
| TSL `Fn`, `uniform`, `uniformArray`, `attribute`, `texture`, `screenCoordinate`, `screenUV`, `positionWorld`, `mix`, `smoothstep`, `step`, `clamp`, `select`, `If`, `Loop`, `mx_noise_vec3`, `time` | T:23, 634, 635, 94; W:13787, 14594, 14610, 15606, 8384, 8430, 8217, 8396, 8804, 5117, 19957, 50279, 38761 | all shaders | `timerLocal` and `timerGlobal` are gone; use `time`. `cond` is gone; use `select` |
| Compute (`Fn().compute()`, `renderer.compute`) | W:11504, W:64539 | **not used** | stateless shaders only; the WebGL2 fallback runs compute through transform feedback without atomics (W:74914), so v3 avoids it |
| `ScrollTrigger.create`, `.batch`, `.refresh`, `.disable`, `.enable`, `self.getVelocity()` | G/ScrollTrigger.js:2252, 2302, 2256, 1975, 2007 | rails, reveals, flow, reduced motion | `_rafBugFix` rAFs while enabled (:61) |
| `CustomEase.create(id, data)` | G/CustomEase.js:290 | the one curve | |
| `SplitText.create(el, { type, mask, autoSplit, aria, onSplit })` | G/SplitText.js:315, options at :204 | route headings | `mask: 'lines'` wraps with `overflow: clip` (:273) |
| `gsap.context()`, `gsap.timeline()`, `ticker.lagSmoothing(0)` | G/gsap-core.js:4260, :1353 | route scope, master timeline, wall-clock timing | |

## 14. Judgment calls for Cipher (and Justin where marked)

### 14.1 New in v3
| ID | Call | Default in this spec | Why, and the alternative |
|---|---|---|---|
| **V3-J1** (Justin) | The hero shows an `aria-hidden` boot readout that repeats the approved `TERM.boot` line while the boot prints it into the terminal log. | On | It puts the peak moment (7.4) where the visitor is looking. Tension: the home lede says the terminal is "a working shell, not a typing animation". The defence is that no character prints on a timer; each one prints when its pulse arrives at U1. If Justin reads it as a typing animation anyway, set it off: the boot then prints only into the terminal log and the hero shows the board alone. No copy changes either way. |
| **V3-J2** | Justin's router term `crossings × 1000` is read as `layerChanges × 1000`. Same-layer crossings are illegal. | Applied | On a real board, two nets crossing on one layer are a short circuit, which would fail R1.2. The 1000 penalty keeps its intent (avoid crossings) and now buys a via pair under the obstacle. Alternative: a one-layer board with crossings dropped, which gives far fewer routable nets and fails K2 more often. |
| **V3-J3** | Chromatic fringe on pulse heads (excellence A), although the v2 design gate banned RGB split and chromatic aberration. | On, tier 2 only | Justin asked for it on pulse peaks only. It is confined to lit heads (`lit > 0.85`), capped at 1.5px, zero inside every scrim, and computed from the pulse's own trace, so it cannot appear off-net or over copy. Kill: any fringe pixel inside a scrim (12.2). |
| **V3-J4** | v2 anti-slop item 2 ("no circuit-board background behind text") is superseded. | Superseded | Justin's v3 direction is a full-bleed board. Readability moves from geometry (slots) to a measured guarantee (scrims, 1.3) with a kill criterion (R4.2, R8.2). The other v2 anti-slop items stay. |
| **V3-J5** | No reference designators (U1, R4) in silkscreen. | Off | The six approved silkscreen strings stay the only board text. Designators would add unapproved copy and visual noise. This spec uses them only as names. |
| **V3-J6** (Justin) | One `btn--primary` per view: home Copy email, dossier header Repo, contact Send (unchanged), 404 `cd ~`. | Applied | R9 Fitts, Hick and Von Restorff need one primary per view. Today only Send is primary, so home and the dossiers have none. These are restyles of existing controls; no string changes. Alternative: keep v1 styling and accept that the Von Restorff check fails, which fails R9. |
| **V3-J7** | Pulse colours stay inside the palette: data `#f5f5f5`, signal amber `#ffb000`, power `PAD` copper, ground unlit. | Applied | Colour by net type (excellence F) without adding hues. Amber stays the one signal colour, so a lit amber trace always means a decision or check, as in the copy. |
| **V3-J8** | The board is the bottom layer on every route, including about, contact and 404. | Applied | R4.1 requires it on all routes. The 404 uses the home rig at rest exposure. |
| **V3-J9** | Oklou's boot arc is adopted (noise, sweep, lock onto VERIFY), but not its start gate, audio, 2s artificial black beat, or "skip intro" button. | Applied | The gate exists to unlock audio, and the site has none. A gate or an added black beat would hold content (Doherty, Tesler, R11 P2). A skip button would be new copy; any input already skips in one frame. The boot grows from about 3.2s to 4.8s, all of it in the canvas. |

### 14.2 v2 rulings carried into v3
| v2 ruling | Status in v3 |
|---|---|
| J1 traceGlow capped (power traces and pours only, stdDeviation 2, opacity 0.35) | Kept (2.5) |
| J2 engine limits are totals | Kept (2.5) |
| J3 scroll reveals play once | Kept (7.2 registers) |
| J4 Material ease | Kept: one curve (7.2) |
| J5 mobile rise, dissolve, descend | Kept (7.5) |
| J6 `verify site` off | Kept off (12.1). `verify` is wired to the VERIFY nets (5.2) with its approved output unchanged. |
| J7 approved | Kept |
| v2 §1.2 stage slots, §2.2 cluster grammar, §3.1 particle phases, §8 item 2 | Replaced (section 0) |

### 14.3 Anti-slop list for v3
Banned: glass, blur, `backdrop-filter`, drop shadows, CSS gradients other than the link underline, a centred hero, a project card grid, decorative particles (particles ride DATA lanes only), decorative copper (fails V2), fiducials, scanlines, noise overlays on copy, chromatic fringe anywhere but pulse heads, any animation that loops while the visitor does nothing other than the DATA bus packets, and any board text other than the six silkscreen strings.

## 15. QA plan and traceability

### 15.1 Tests
Run headless as in v2 (`qa.mjs` plus a v3 harness), with `__JP_QA` overrides for seed, tier, time and feature flags. Every test is automated unless marked human.

| ID | Test | Method |
|---|---|---|
| Q1 | Netlist validator | Independent checker (no shared code with the generator) asserts V1 to V8 and `repairs === 0` on `PCB_HERO_001` plus 20 seeds |
| Q2 | Angle sample | 1000 random segments: direction is one of 8 unit vectors; a pixel probe along each painted segment confirms paint matches netlist geometry |
| Q3 | Footprint sample | 20 random components per seed: pads recomputed from the footprint table, pin count equal, body inside pad ring |
| Q4 | Layer audit | Every F/B transition in every net is at a via; via spacing and placement rules |
| Q5 | Power distinct (human plus automated) | Screenshot pair at 1440×900 for Cipher; automated check that power copper is ≥ 6px and uses `PAD` copper while signal uses `COPPER_TRACE` |
| Q6 | Determinism | Canonical netlist sha256 equal on two loads; camera pose and frame pixels equal at rest on two loads with `QA.time` pinned |
| Q7 | Pulse readback | For each wiring entry (5.2, 5.3) and the chip gestures: a QA-only segment-id pass writes the instance id of every segment with `lit > 0.01` into a render target, read with `readRenderTargetPixelsAsync`. The set must equal the walk's reached set, and must be a subset of the netlist. Any id outside it trips the R2.1 kill |
| Q8 | Delay ∝ length | For 30 sampled (source, target) pairs: arrival time measured from `segDist` frames equals `pathLength / v + gates × 40ms` within one frame, and the fit of time against length has R² ≥ 0.99 |
| Q9 | Chip gestures | Hover, click and tap (touch emulation) on 20 sampled chips per route: pulse set equals the chip's 1-hop nets, probe set equals all nets on its pins. Touch second-tap and scroll clear |
| Q10 | Command-to-net map | Each terminal command run in the shell; reached set equals the 5.2 row |
| Q11 | Route activation | Each route: target sub-circuit powered and camera at its pose after settle |
| Q12 | Control sweep | Every interactive element from a DOM query (not from the spec table, so a missed element fails): pointer, keyboard and touch each produce the 5.3 circuit response within one frame. Run again under reduced motion: response present, no rAF after settle, no tween running |
| Q13 | Scroll sweep | Scripted scroll through home: rail parameter tracks section progress; packet rate follows `flow`; long-task and layout-shift counts zero (P7) |
| Q14 | Full bleed | Per route at 8 desktop viewports and 393px: canvas rect equals viewport, `position: fixed`, behind content (`z-index` and `elementFromPoint` checks) |
| Q15 | Readability | DOM hidden, scrims rendered: max scrim-core pixel ≤ `#141414`; every text rect inside a scrim core; axe contrast clean on every view; fringe pixels inside scrims = 0 |
| Q16 | Noticeable (human) | Per-route screenshots for Cipher, plus the K2 components on/off pair |
| Q17 | Motion registers | Read every tween's duration and ease from GSAP and every CSS transition: only the five registers, only `jp` / its CSS twin; pulses carry no ease |
| Q18 | Interrupts | Wheel, key and touch mid-route: copy visible next frame, camera continuous; new navigation mid-flight starts from current pose (gap 0) |
| Q19 | Reduced motion | Every route: resolved board, complete content, zero tweens, 0 rAF calls over 1.5s after settle, board locked (D_STATUS lit), boot line printed whole |
| Q20 | Mobile | 393px: tier 1, rise/dissolve/descend transitions, no horizontal scroll, every target ≥ 44px |
| Q21 | Tiers and ladder | Forced tiers 0, 1, 2 via `__JP_QA`; CPU throttle exercises the full ladder down to tier 0; tier 0 shows the static frame and full content |
| Q22 | No WebGL | WebGL and WebGPU disabled: `html[data-renderer="none"]`, the static board image, full content, axe clean |
| Q23 | Memory | Allocation registry totals and `renderer.info.memory` bytes at rest and peak flight, per tier, against 192 / 48 MB |
| Q24 | Frame timing (needs a real GPU) | `?perf=1` overlay records 10s mixing scroll, pulses and a flight: median and p99 frame time, dropped frames |
| Q25 | LCP and TTI | Lighthouse desktop, broadband profile, three runs, median |
| Q26 | Doherty | Input-to-acknowledgement for every control: first changed frame after the event, under 400ms (target one frame) |
| Q27 | Budget | File bytes ≤ 500,000; CDN URLs pinned to three@0.186.0 and gsap@3.15.0 with SRI; no new dependency |
| Q28 | Content integrity | SCENE_DATA equals DOM for every field and every derived count (12.1); visible copy diff against v2 = 0 lines; claim 04; zero em or en dashes; zero visible TBD; banned words absent; `verify site` absent |
| Q29 | K3 | WL hash plus exact isomorphism plus placement Jaccard over 21 seeds (2.6) |
| Q30 | Kill flags | Each `FEATURES` flag set false: the site still passes Q12, Q15, Q19 and Q28 (a cut never breaks content) |
| Q31 | R9 and R10 review | Primary count per view, target sizes, pattern inventory, and Cipher's side-by-side template check (human) |
| Q32 | Boot | Two loads: lock at t = 2.80s ± one frame on both; exactly five failed checks, each a path-A pulse dying at U2; noise pulses all pass Q7; any input mid-boot reaches the locked end state in one frame; a second load in the same session skips the boot |

### 15.2 Matrix
| Rubric | Spec section | QA |
|---|---|---|
| R1.1 45° only | 2.3, 2.4 V1 | Q1, Q2 |
| R1.2 valid nets, no floating copper | 2.4 V2, V3, V7 | Q1 |
| R1.3 ICs on pads, pin count | 2.2, 2.4 V4 | Q1, Q3 |
| R1.4 vias, layer transitions | 2.4 V5 | Q1, Q4 |
| R1.5 power distinct | 2.4 V6, 2.5, 4.4 | Q5 |
| R1.6 deterministic | 2.3, 2.4 V8 | Q6 |
| R2.1 pulses on-net only (KILL) | 4.3, 12.2 | Q7 |
| R2.2 delay ∝ length | 4.1, 4.2 | Q8 |
| R2.3 chip hover and click, plus tap (A1) | 5.1 | Q9 |
| R2.4 commands to nets | 5.2 | Q10 |
| R2.5 route sub-circuit plus camera | 5.4, 7.2 | Q11 |
| R3.1 every element wired | 5.3 | Q12 |
| R3.2 no dead UI (A1 touch, A2 RM) | 5.1, 5.3, 9.1 | Q12 |
| R3.3 scroll drives flow and camera | 4.5, 7.1 | Q13 |
| R4.1 full bleed on all routes | 1.1, 1.4, V3-J8 | Q14 |
| R4.2 readability (KILL) | 1.2, 1.3, 1.5, 12.2 | Q15, Q22 |
| R4.3 noticeable | 1.4, 3, 6, 7.4 | Q16 |
| R5.1 curve and registers | 7.2 | Q17 |
| R5.2 interruptible, deterministic settle | 7.2 | Q18, Q6 |
| R5.3 reduced motion (A2) | 9.1, 5.3 RM column | Q19, Q12 |
| R5.4 mobile transitions | 7.5 | Q20 |
| R6.1 tiers and ladder (A3) | 8.1, 9.2, 9.3 | Q21, Q22 |
| R6.2 memory re-baselined | 8.3 | Q23 |
| R6.3 chunk budget at full bleed | 2.5, 8.3 | Q23 |
| R6.4 60fps, no jank | 8.1, 8.2, 7.1 jank rules | Q24, Q13 |
| R7.1 SCENE_DATA only | 3.4, 12.1 | Q28 |
| R7.2 copy unchanged | 12.1 | Q28 |
| R7.3 `verify site` off | 12.1, 14.2 | Q28 |
| R8.1 K1 to K3 restated and recorded (A4) | 2.6 | Q1, Q5, Q16, Q29 |
| R8.2 interaction kills | 12.2 | Q7, Q15, Q30 |
| R8.3 kill cuts, never patched | 12.2 | Q30, review |
| R9 permanent: Fitts, Hick, Jakob, Gestalt, Tesler, Doherty | 10.1, 5.1, V3-J6 | Q20, Q26, Q31 |
| R9 selective: Von Restorff, Peak-end, Serial position, Miller, Postel (Ovsiankina n/a) | 10.2, 7.4 | Q31, Q12 |
| R10 N1 to N5 | 11 | Q31, Q7 to Q10 (N2 prerequisite) |
| R11 P1 60fps | 8.2 | Q24 |
| R11 P2 LCP, TTI | 8.2 | Q25 |
| R11 P3 memory | 8.3 | Q23 |
| R11 P4 ladder, readable lowest tier (A3) | 8.1, 9.2, 9.3 | Q21, Q22 |
| R11 P5 acknowledgement under 400ms | 10.1 Doherty | Q26 |
| R11 P6 file size, pinned deps | 8.2, 13 | Q27 |
| R11 P7 no scroll jank | 7.1 | Q13 |
| A1 touch | 5.1, 5.3 | Q9, Q12, Q20 |
| A2 reduced motion per interaction | 5.3 RM column, 9.1 | Q12, Q19 |
| A3 no WebGL | 9.3 | Q22 |
| A4 K3 graph ruling | 2.6 | Q29 |
| A5 excellence A to F | 15.3 | as listed there |

### 15.3 Excellence bar A to F
"Every effect earned by the netlist": each item below reads its geometry or timing from the netlist, and each is scored inside R1 to R11 (A5).

| Item | Implementation | Netlist dependency | Rubric dimensions | QA |
|---|---|---|---|---|
| **A** TSL layer | Two-tone dithered backdrop as `scene.backgroundNode` (6.1); GPU particles on DATA bus lanes only, from a lane texture built from bus segments (6.2); chromatic fringe on pulse heads only (4.4, V3-J3) | particles sample lane polylines from DATA nets; fringe samples the pulse's own `lit` along its segment | R4.3, R2.1 (fringe on-net), R4.2 (fringe zero in scrims), R10 N1, R11 P1 and P3 | Q7, Q15, Q16, Q23, Q24 |
| **B** Scroll as camera | Per-route rails through board waypoints with scrubbed ScrollTriggers; flow from scroll velocity drives packet rate and particle speed (7.1, 4.5) | waypoints are netlist anchors; packets run DATA nets | R3.3, R11 P7, R5.1 | Q13 |
| **C** Boot peak | Oklou's arc on the netlist: power tree, ICs, then noise (filler traffic), sweep (five failed checks while Y1 settles, camera push-in), lock (STATUS fires, D_STATUS latches beside `VERIFY`, loop-back enables U1), then the boot line as 33 UART pulses each printing on arrival at U1, one method pass, and the pull-back (7.4) | every step is a walk event; the failed checks are the `and-window` rule; the lock is the loop-back | R9 Peak-end, R2.1, R2.2, R4.3, R1.6 and R5.2 (fixed lock time), R5.3 (locked and printed whole under RM) | Q7, Q8, Q19, Q32 |
| **D** Detail density | Decoupling, serpentines, stitching vias, terminations, crystal and load caps, ID EEPROM, regulator, mounting holes, LED ring, DISP (3.5) | each is a footprint with nets and a function; probe-able | R1.1 to R1.5, K2, R4.3 | Q1, Q3, Q16 |
| **E** One composed route move | One master timeline per navigation for DOM, scrims, camera spring, backbone pulse and sub-circuit power; seek-to-end interrupts (7.2) | the pulse runs the backbone between anchors; the sub-circuit is the route's nets | R2.5, R5.1, R5.2 | Q11, Q17, Q18 |
| **F** Pulse aesthetics | Trails (TRAIL 90px, HEAD 12px), colour by net class (V3-J7), via flashes on layer change, constant speed and gate delays so delay ∝ length (4.1 to 4.4) | segDist from the Dijkstra walk; via flash at netlist layer transitions | R2.1, R2.2, R1.5, R4.3 | Q7, Q8 |

## 16. What cannot be measured from the cloud, and open items

### 16.1 Needs a real device or a human
- **R11 P1 and R6.4 (60fps):** the cloud browser renders on SwiftShader (v2 measured about 690ms per frame there). The `?perf=1` overlay (Q24) must be run on a real desktop GPU by Justin or Cipher, and the figures recorded before ship. Until then P1 is unscored, not passed.
- **R11 P2 (LCP, TTI):** Lighthouse runs in the cloud, but CPU and network there are not "desktop broadband". The cloud figure is reported as indicative; the ship figure comes from a real machine.
- **WebGPU success path:** only the WebGL2 backend runs here. Every v3 shader avoids compute and WebGPU-only features (section 13), so both backends run the same node graph, but the WebGPU path still needs one real-device check.
- **Human checks:** R4.3 noticeable, K2 human pair, R1.5 render review, and R10 N1 template check are Cipher's.

### 16.2 Open items
- V3-J1 and V3-J6 need Justin's yes or no. Both have defaults that do not change copy.
- Memory figures in 8.3 are computed estimates from the allocation plan. The measured figure (Q23) replaces them at build, and if it exceeds 192 MB on tier 2 the chunk plan is cut before anything else.
- The two optional reference docs (TSL_AI_RULES.md, webgpu-claude-skill) were not read, by decision. If they are approved later, section 13 and section 6 are re-checked against them before the build.
- The PCB shan-shui build spec file itself is not in this environment. This spec relies on its verbatim text as quoted in the v2 work order.

## 17. Where each decision comes from
Every major decision, with its source. "Package" is the 2026-10-05 reference package; its items are numbered as relayed. Where a reference conflicts with the rubric, an approved ruling or the copy, the reference loses, and the row says so.

| Decision | Section | Source |
|---|---|---|
| Full-bleed fixed canvas behind all routes | 1.1 | Justin's V3 direction; R4.1 |
| Scrims over the board (the v2 mask inverted), contrast cap `#141414` | 1.2, 1.3 | V3 direction; v2 brief §1.2; R4.2 |
| Netlist as the single source of truth; validity V1 to V8 | 2 | V3 direction; R1, R2.1 |
| Painters, palette, router cost, limits | 2.3, 2.5 | Justin's PCB shan-shui build spec (router term reinterpreted, V3-J2) |
| K1 to K3, K3 as graph non-isomorphism | 2.6 | shan-shui build spec kill criteria; Cipher's ruling A4 |
| DATA, VERIFY, DETERMINE topologies | 3.1 | V3 direction; spec s1 positioning ("the engineer who verifies") |
| Clusters from SCENE_DATA only | 3.4 | v2 brief; R7.1 |
| Explorable board, detail density, no game mechanics, DOM as HUD | 3.5, 5.1 | Package item 5 (bruno-simon); excellence D |
| Constant-speed pulses, gate delays, delay ∝ length | 4.1, 4.2 | V3 direction; R2.2; excellence F |
| On-net by construction (segDist from the walk) | 4.3 | R2.1 kill |
| Trails, colour by net class, via flashes | 4.4 | Excellence F; palette from the style brief (V3-J7) |
| Chromatic fringe on pulse heads, in-shader channel offset | 4.4, 6.3 | Excellence A; package item 4 (2trung channel clones, adapted); V3-J3 |
| Flow from scroll velocity | 4.5, 7.1 | Excellence B; R3.3 |
| One tap model on touch, long-press rejected | 5.1 | Cipher's amendment A1; R9 Jakob |
| Terminal as debug port | 5.2 | V3 direction; R2.4; R10 N4 |
| RM column for every control | 5.3, 9.1 | Cipher's amendment A2 |
| Dithered backdrop with scroll-scrubbed band | 6.1 | v2 brief §3.2; package item 4 (2trung backgroundNode) |
| Bus particles on lanes, fake DOF, no curl | 6.2 | Excellence A; package item 4 (2trung points recipe, curl rejected for R2.1) |
| `RenderPipeline`, MRT bloom, FXAA, MSAA off | 6.4 | three r186 sources (section 13); memory budget 8.3 |
| DOM tight, circuit cinematic | 7 (intro) | Package item 3 (oklou split) |
| The curve `cubic-bezier(0.4, 0, 0.2, 1)` | 7, 7.2 | Package item 2 (utazon, cleanlystudio, oklou); v2 J4; R5.1 |
| Reveals 0.5s, stagger 0.08, `top 85%`, play once | 7.2 | Package item 3 (oklou timing, cleanlystudio 0.5s); v2 J3 keeps play once over oklou's reverse |
| Route headings 0.9s split lines, stagger 0.1, transition-wired | 7.2 | R5.1 (duration); package item 4 (bruno-arizio split text, Power4 replaced by the shared curve) |
| Camera 1.8s | 7.2 | R5.1; utazon's 1.8s pole (package item 3) |
| Persistent renderer, route modules with async `enter` and `leave`, one master timeline | 7.2 | Package item 4 (bruno-arizio); v2 architecture; excellence E |
| `group.visible` gated by ScrollTrigger `onToggle` | 7.1 | Package item 4 (2trung) |
| Boot arc: noise, sweep, lock onto VERIFY, push-in, pull-back | 7.4 | Package item 1 (oklou); excellence C |
| No start gate, no audio, no skip button, any input skips | 7.4, V3-J9 | Package item 1 (oklou's never-trap rule kept); R9 Doherty and Tesler; R11 P2; copy rules |
| Mobile rise, dissolve, descend | 7.5 | v2 J5; R5.4 |
| Tiers, ladder, memory re-baseline | 8 | R6, R11; v2 measurements |
| No-WebGL static board | 9.3 | Cipher's amendment A3 |
| One primary per view | 10, V3-J6 | R9 Fitts, Hick, Von Restorff |
| Kill flags | 12.2 | R8.2, R8.3 |
