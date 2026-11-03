# FINAL POLISH SPEC, polish round 2 (DESIGN 1.2.0)

2026-11-02. Author: Claude (spec and main features, in thread). Reviewers: CLI Astra (code QA and polish), AGY 3.8 flash (mechanistic runner, stochastic stress). Input: device run 2 (DEVICE-RUN-2.md, the screenshots), leaflink-readme.md, the repo pack at c64193d, PATCH-PLAN-2026-10-31.md, ITEM-6-RULING-2026-10-31.md.

DVD, altitude first: every claim below has Data (a measured receipt, file:line), a Verification (a check that failed before the change and passes after), and Determinism (fake clock, fixed seed, fixed viewport, so a rerun reproduces it).

## 0. Status

All six items are implemented as a patch against the repo pack (`polish-round-2.patch`, 40 files, applies clean to c64193d). Nothing is committed, nothing is deployed, V2 production is untouched. DESIGN.md is bumped to 1.2.0 with measurements in the changelog. No gate lowered, no budget changed, no new dependency.

**Verified in this container**

| Check | Result |
|---|---|
| `git apply` on a clean c64193d worktree, then `tsc --noEmit`, `lint-tokens`, `banned-scan` (src and dist), `palette-receipt.py` | pass |
| Production build, SSR, prerender, `check:hud` | pass |
| Every test in `tests/` that needs no browser (morph, polish T-ENT-1 to 5 and T-ANCHOR-1/2, hero unit and area, lanefield T-LF-7/2b/7b, silhouette, theme, tween, scatter, and the rest) | 47 pass, 1 skipped (T-S02-8, SwiftShader longtask, gated on device by design) |
| Browser acceptance (`polish-browser.spec.ts`, repo runner 1.64.1 driving the container's Chromium 1243 headless shell, SwiftShader, paused fake clock) | 7 of 7 pass. The first run failed 2 of them and found two real defects and one harness flaw, all fixed (5.2, 5.6, 6.5) |
| Fake-clock traces at 390x658 (`qa/polish-2/trace-*.cjs`, numbers in `receipts.json`) | every before/after number in this document; geometry exact, ms stamps good to about one frame (see the clock note in 5.6) |

**Not verified here (say so, do not assume)**

- Device frame times. SwiftShader frame times are not iPhone frame times. G-PERF-DEVICE (p95 16.7ms, p99 33ms, no long task over 50ms in a morph) stays a device run 3 measurement. Section 6 gives the cost argument; the device proves it.
- Real brand assets. Codeberg is not reachable from this container, so the marks were stand-ins at the manifest's exact dimensions. Placement and ring geometry depend only on dimensions; T-ASSET-* were not rerun. The Codeberg key stays in the Secure Vault; nothing here asked for it or used it.
- The repo's full Playwright suite to completion. It ran on the installed 1243 build (the pinned 1248 is not installed here) for 118 of 155 tests before it was stopped for time; every failure was then rerun or compared with c64193d, and section 10.1 has each one's status. Tests 119 to 155 (rest of `tests/scenes/server.spec.ts`, sidequests, world engine) did not run here.
- `sidequests-readme.md` was not attached. Item 3's SideQuests reading uses only what the brief states (decentralized, self-hostable, quests, ActivityPub) plus the shipped S09 copy. If the readme says something that changes the verb, item 3's SideQuests row changes with it.

**Two readings stated, not assumed**

- The yellow blobs in the screenshots are read as Justin's iOS markup annotations. The lane shader cannot produce yellow (its outputs are OKLab mixes of signal, ink, and field only, palette-receipt.py passes). If a yellow was actually rendered on device, that is a P0 hue violation and device run 3 must screenshot it with markup off.
- GLITTERBOX is not defined anywhere in the repo, the plan, or the device notes. It is read as the glitter, handmade-web joy element Justin described in the Oct 15 portfolio conversation. Section 6 rules on that reading.

## 1. Item 1: morphs plus load jarring

### 1.1 Repro (390x658, fake clock, `?seed=42`, server to LeafLink with key 2)

| Symptom | Root cause, file:line (baseline c64193d) | Measured |
|---|---|---|
| LeafLink logo centers, then re-justifies | `src/travel.ts:223` sets `el.hidden = true` on the readout at `readoutHiddenAtMs` 150, so it leaves layout. `BrandHero.tsx:379` reads the readout rect, gets null while hidden, and `heroGeometry.ts:153` falls back to the viewport center. When the readout returns (`travel.ts:253`), `BrandHero.tsx:452` re-tracks per frame and the mark jumps. | Mark center 198,326 then 262,166: 172.3px move |
| Camera and scene load before the text | `morph-controller.ts:238` computes `heroOpacityIn` but nothing consumes it, so the mark pops to opacity 1 at mount. The camera is about 83% of the way by p 0.3 (expo-out [0.23,1,0.32,1]), the text starts at Reveal 0.55 (385ms). Nothing fills 0.17 to 0.55. | 0 loom frames; 270ms empty window |
| Camera re-adjust is jarring | Not the camera. Three DOM and ring defects land as the camera settles: the mark jump above; the ring centered on the camera target (`hero-descriptors.ts:56`, anchor = pose target) instead of the mark; and a frozen bulge: `BrandHero.tsx:192` calls `lanefield.setParams(applyDescriptorToParams(lanefield.getParams(), desc))`, which copies the mid-morph `ringStrength` into `paramsTo`, and `lanefield.ts:981` (`if (travel) apply(paramsTo)`) makes it permanent. | Ring to mark after Gather 135.5px; ring strength at rest 1.268 (LeafLink), 0.932 (SideQuests) |
| Mask and light mode snap mid-morph | `laneParams.ts:93` and `:102` switch light mode and mask at the 0.5 midpoint; `lanefield.ts:516` `syncMask` lazy-loads the mask mid-flight. | one-frame categorical change |
| Outgoing mark pops out | `morph-controller.ts:55` RECEDE_WINDOW [0, 0.4] runs past the readout swap at 0.214, where the mark unmounts. | opacity 0.6 to 0 in one frame |
| Title fit lands a frame late | `titleFit.ts:47` measures in `useEffect`; `App.tsx:202` `onSwap` is not synchronous, so the hero mounts after the frame that samples it. | one-frame wrong size |

### 1.2 Decisions

1. The camera curve and the 700ms stay (DESIGN 6.2 note). The fix is DOM and ring ownership, not motion retiming.
2. **Conceal, do not remove.** Travel conceals the readout with `visibility: hidden`, `inert`, and `aria-hidden` so its rect exists throughout. Assistive tech and focus behave as with `hidden`; layout does not.
3. **Place once.** The swap is `flushSync(() => setScene(next))`, so the new scene, the hero, and its layout effect commit inside the swap callback. The hero computes its placement in a `useLayoutEffect` keyed on `[entry, project, lanefield, viewport]` and never re-tracks per frame.
4. **Engine owns the ring.** One function, `applyRing`, runs after the final camera write of every frame and is the only writer of ring and silhouette fields. `setParams` no longer writes them into the travel target. Rest invariant: zero strength outside a morph, pulse, or hold.
5. **Anchor is the mark.** The hero registers a screen anchor (center, ring radius, silhouette radius); the engine ground-projects it through the current camera each frame. Ring radius = `max(pad, min(halfExtent + hero.ringPadPx, clearance))`, so the bulge never reaches the readout, the name zone, or the keymap.
6. **Loom fills the window.** New token `motion.morph.loom` [0.30, 0.70]: the mark looms in at its final position while the camera settles and the ring grows under it. Gather starts at 0.22 (after the swap at 0.214, where the anchor first exists). Recede becomes a token [0, 0.20], ending before the swap.
7. **No categorical snaps.** Light mode crossfades (`uLightModeFrom`, `uLightMix`); both masks preload once after the first frame via `renderer.initTexture`.

### 1.3 Main feature code

`src/travel.ts`, replacing `el.hidden`:

```ts
function concealKeepLayout(el: HTMLElement): void {
  el.style.visibility = 'hidden';
  el.inert = true;
  el.setAttribute('aria-hidden', 'true');
}
function reveal(el: HTMLElement): void {
  el.style.visibility = '';
  el.inert = false;
  el.removeAttribute('aria-hidden');
}
```

`src/App.tsx`, the swap:

```ts
onSwap: (next: SceneId) => flushSync(() => setScene(next)),
```

`src/world/lanefield.ts`, frame order (the invariant Astra reviews against):

```ts
updateTravel(t);                       // params lerp, light crossfade, bow.now
updatePan(dtMs);                       // item 3 focus pan
camOffset = pan + bow.dir * bow.now;   // item 5 bow, translation only
rig.update(..., camOffset);
for (const cb of callbacks) cb(t, dt); // scene controllers (walk lean)
clampSideQuestsPitch(camera);          // ITEM 6 clamp, last camera write
applyRing(t, dtMs);                    // single ring owner, after the camera
drawWeights = blend(weights, scatter, glitter.value); // item 6
```

`applyRing` precedence: morph sample while traveling; else GLITTERBOX hold; else a pulse traveling from its origin into the anchor; else zero strength at the anchor (rest invariant). `resolveAnchor(layout)` returns null when the anchor was registered at a different viewport size, and the morph controller starts Gather at the first frame the anchor resolves (`anchorSeenP`), so a ring never renders at an unresolved position.

### 1.4 Tasks

| # | Failing check first | Smallest change | Receipt |
|---|---|---|---|
| 1.a | T-FLUSH-1 (browser): mark center constant within 1px from its first visible frame. Fails at 172.3px. | `concealKeepLayout`/`reveal` in travel.ts; `flushSync` swap; `titleFit` to `useLayoutEffect`; BrandHero places once in a layout effect. | 172.3px to 0px |
| 1.b | T-RING-1 (browser): ring center within 2px of the LeafLink mark after p 0.75. Fails at 135.5px. | `setHeroAnchor` plus `resolveAnchor` plus `applyRing`; descriptors keep only the fallback anchor. | 135.5px to 0px; SideQuests 352px to 8.1px |
| 1.c | T-RING-1 rest half: ring and silhouette strength exactly 0 ten frames after the morph. Fails at 1.268. | `setParams` stops writing ring fields to `paramsTo`; travel end zeroes both. | 1.268 to 0 |
| 1.d | T-FLUSH-1 loom half: at least 5 frames with opacity strictly between 0.02 and 0.98. Fails at 0. | Consume the loom window in BrandHero's rAF loop. | 0 to 13 frames |
| 1.e | T-MORPH-RECEDE (pure): the recede window ends before `readoutHiddenAtMs`. Fails at 0.4. | Token `motion.morph.recede` [0, 0.2]. | ends at 140ms vs swap 150ms |
| 1.f | Not automated this round (open task for Astra): sample `uLightMix` every 16ms across server to LeafLink and assert it is monotone with no frame step over 0.1. Verified here by code reading only. | `lightAt(mode)` in the fragment shader, mixed by `uLightMix`; mask cache preloads both. | pending |

## 2. Item 2: ripple and bulge placement

### 2.1 Repro

| Symptom | Root cause | Measured |
|---|---|---|
| Lands in the wrong place | Ring anchored at the descriptor world point (`hero-descriptors.ts:56`), which is the camera target, not the mark. The tap ripple at `BrandHero.tsx:571` uses the same anchor. | 135.5px off (LeafLink), 352px (SideQuests) |
| Snaps | `BrandHero.tsx:401` origin guard: the ring jumps to the anchor when the anchor first resolves, and the frozen `paramsTo` ring snaps back on each `setParams`. | one-frame jump |
| Nudges elements | Ring radius from the descriptor, not clamped to clearance, so lane deflection pushes lanes under the readout and keymap; on SideQuests the marker DOM twins lag their markers because the Astryx Button transitions transform (`scenes/sidequests.tsx:48`, measured `transition: transform 0.15s`). | twins lag by 0.15s |

### 2.2 Decisions

- Same anchor as item 1 for every ring use: morph, tap pulse, land pulse. One source of truth.
- Field to project morphs depart from the pressed keymap item (`keyOrigin(dom, target)` in travel.ts, ground-projected per frame) and travel to the anchor on `curve.track` over Gather, so the bulge visibly comes out of the control the visitor touched and never snaps.
- Radius clamp to clearance (`clearanceFrom` in heroGeometry.ts). The vertex shader's deflection stays C1 with the new tangential term (`p + (dir + tangent*uRingSwirl)*(S f^2)`), verified by T-LF-7b.
- Twins get `transition: 'none'`. Placement of the mark avoids the SideQuests marker tap targets at their resting projection (`projectAtRest` plus `restHead`), so a mark never covers a control.

### 2.3 Tasks

| # | Failing check first | Change | Receipt |
|---|---|---|---|
| 2.a | T-ANCHOR-1 (pure): with no anchor the ring and silhouette are zero even inside Gather; on the frame the anchor resolves the ring starts at zero, then grows centered on the anchor with its radii. | `setHeroAnchor`, `resolveAnchor` (null on a viewport mismatch), `anchorSeenP`. | pass |
| 2.b | T-ANCHOR-2 (pure): the ring center is at the ground-projected key origin at Gather start and on the anchor at Gather end. | `MorphNavigateOptions.originPx`, `keyOrigin`. | pass |
| 2.c | T-LF-7b (pure): swirled deflection is C1 at the ring edge and zero outside. | `deflectPoint(..., swirl)`, `uRingSwirl`. | pass |
| 2.d | Twin computed style `transition-duration` is 0s (browser, part of trace-interact). Fails at 0.15s. | `transition: 'none'` on twins. | 0.15s to 0s |
| 2.e | T-HERO-6: both marks fit the area cap with `hero.landBeatScale` 1.04 headroom. | Headroom term in placement. | pass |

## 3. Item 3: mobile intuitiveness plus camera tracking

### 3.1 The symbolic link, stated once

The image must show what the message says, in the visitor's own hands:

- **LeafLink** (leaflink-readme.md): mutual aid on a map. An offer meets a need, nothing central watches. The image: the visitor drops an offer, a route draws to a request, and when it lands, a pulse travels from that spot on the map into the LeafLink mark. The thing they did ends inside the mark.
- **SideQuests**: decentralized, self-hostable quests. The image: the visitor picks a trail, the camera brings that trail's marker into view beside the mark (where a clear pan exists, 10.2), the trail draws to it, and the claim lands with one beat on the sign. The quest they walked ends next to the sign, never under it.

### 3.2 Repro

| Symptom | Root cause | Measured |
|---|---|---|
| LeafLink verb not reachable on a phone | `scenes/leaflink.tsx:65`: the facts block sits before the offer button, so at 390x658 the button is below the 46dvh slip (`chrome.css:322`). | button 571..603 vs slip bottom 598: hidden |
| SideQuests walk happens off screen | Markers sit under the readout or off screen at phone aspect; S07 lean (`sidequests.ts:284` `followPoint.set(start…)`) snaps toward the trailhead and the pitch clamp then pins it. | pitch -64.49 to -75 in one frame; marker never in the clear band |
| Claim fires early | `sidequests.ts:129` `walkLength` sums dash lengths only; `layouts/sidequests.ts:943` advances `s += dash + gap`. | claim at 60% of the arc |
| No visible verb on SideQuests (coarse) | Twins are the only controls and they are invisible tap targets on markers. | 0 visible controls |
| Mark beats on a timer | `heroGeometry.ts:175` `heroBeatScaleAt` is periodic, contradicting DESIGN 6.3 (LeafLink is event driven). | periodic beat |

### 3.3 Decisions

1. **Stage grammar** (`src/motion/stage.ts`, DESIGN 6.12): controllers emit `subject`, `land`, `beat`, `release`; BrandHero is the only listener that moves the camera or the mark. One owner each.
2. **Coarse-only focus pan.** On coarse viewports (`useCoarse`: width under 768, or coarse pointer under 1024), `subject` pans the camera so the subject (the destination: the LeafLink request node, the SideQuests trail's marker) sits at a focus spot just above or below the mark (`focusSpotsFor`): its center one 44px coarse target plus `hero.ringPadPx` plus the mark's motion margin from the mark edge, clear of the readout, name zone, and keymap. Only a spot whose straight pan never sweeps the subject under the mark counts (`pathCrossesMark`); of those, the nearest (`nearestSpot`); with none, no pan. The pan is a ground translation of position and target: pitch never changes, the SideQuests band [-75, -5] is untouched, ITEM 6 clamp stays the last write. Damped with `focus.halfLifeMs` 200, capped at `focus.maxPanWorld` 20. Fine viewports never pan (the whole map is in view) and keep the S07 lean.
3. **Hold, do not chase.** The pan holds the destination at its spot for the whole walk, so the drawing head travels toward a marker already in view. The first version followed the drawing head with a look-ahead; that swept the marker across the mark mid-walk and failed T-HERO-BAND-WALK, so the `track` event and the look-ahead were removed.
4. **Tap on the mark is the page verb.** LeafLink: drop an offer at the map center. SideQuests: walk the next open trail. A half-strength pulse from the tap point gives feedback in the same frame.
5. **Event beats.** `heroBeatEnvelope(msSinceBeat, amp)` replaces the periodic beat. Any LeafLink match landing beats at `hero.beatScale` 1.015; the visitor's own match lands at `hero.landBeatScale` 1.04.
6. **LeafLink order.** H1, P1, legend, SIM, OfferButton, rule, facts, stack, code. The verb comes before the reference material.
7. **SideQuests coarse trail row.** Three visible Astryx ghost `sm` buttons "Trail 1/2/3" in the plate (`.jp-sq-trail`, dashed bar glyph, `aria-pressed` when claimed). On coarse the twins become pointer-only (`aria-hidden`, `tabIndex -1`); on fine they stay the accessible controls.
8. **Reduced motion.** No pan, no recede, no pulse. The verb still works and the claim still lands.

### 3.4 Main feature code

`src/world/lanefield.ts`, the pan (one subtraction, because the ground under a fixed screen point moves by exactly the camera translation):

```ts
const g = groundAt(focus.screenPx[0], focus.screenPx[1]);
tx = pan[0] + focus.ground[0] - g[0];
tz = pan[1] + focus.ground[1] - g[1];
// clamp |(tx,tz)| to T.focus.maxPanWorld, then damp with T.focus.halfLifeMs
```

`src/hero/BrandHero.tsx`, choosing the spot on `subject`:

```ts
const at = lanefield.worldToScreen([e.ground[0], 0, e.ground[1]]);
const clear = focusSpotsRef.current.filter((sp) => !pathCrossesMark(at, sp, rect, project));
focusSpotRef.current = nearestSpot(clear, at); // null: no pan for this subject
```

`src/world/sidequests.ts`, and the length fix: `walkLength = arcStarts[last] + arcLengths[last]`.

### 3.5 Tasks

| # | Failing check first | Change | Receipt |
|---|---|---|---|
| 3.a | T-LL-VERB (browser): offer button inside the slip at scrollTop 0, 390x658. Fails (571..603 vs 598). | Reorder `scenes/leaflink.tsx`; coarse rhythm (spacing-3 steps) in chrome.css. | 535..567 inside 598 |
| 3.b | T-SQ-TRACK trails 1 to 3 (browser, 390x844): the tapped trail's head is in the band between readout bottom and keymap top no later than the claim; pitch range under 0.01 degrees. | Stage bus, focus pan to a spot beside the mark, lean yields on coarse, `followPoint` starts at `baseTarget`, `walkLength` fix. | Trail 2 passes, pitch constant. Trails 1 and 3 get no pan (every straight pan sweeps them under the mark) and are marked `test.fail` (10.2). The first, mark-center version had trail 3 in band at 1568ms against a 1728ms claim at 390x658, but it put the marker under the mark. |
| 3.c | Fine walk trace: pan 0, lean present. | Pan gated by `useCoarse`. | pitch -54.55 to -56.94, pan 0 |
| 3.d | T-HERO-UNIT: `heroBeatEnvelope` is 1 at rest and never periodic. Fails against `heroBeatScaleAt`. | Replace with the envelope. | pass |
| 3.e | T-REDUCED-POLISH (browser): reduced motion has pan [0,0] every frame. | `reduced` short-circuit in `updatePan`. | pass |

## 4. Item 4: SideQuests text flush

### 4.1 Repro

Device run 2: dashed trails and building outlines cross the SideQuests copy, because the S07 container is "no fill, 1px dashed chalk outline" with `outline-offset: var(--spacing-3)`, so the dashed line floats 12px outside bare text and lanes run through letters. The copy reads as debris on the plan, not as a sign.

### 4.2 Decision: the trailhead sign

Astryx is the primary influence: the same slip anatomy as the LeafLink paper slip (one component, 0 radius, Astryx spacing scale, Commit Mono only). The hand-drawn squiggle's rawness enters through exactly two marks, both already the plan's own vocabulary, never through a new typeface, a rough filter, or a wobble.

**Plate**

| Property | Value |
|---|---|
| Fill | `--jp-field-raised` (no lane ever runs through a letter) |
| Edge | `outline: 1px dashed var(--jp-chalk-2)`, `outline-offset: 0` (the S07 dashed line, now flush on the plate as its cut line) |
| Radius | 0 |
| Padding | `--spacing-4` |
| Contrast | chalk on field.raised 10.70:1; chalk.2 on field.raised 6.91:1 |

**Type** (no new sizes, all existing tokens, Commit Mono only, sentence case)

| Element | Token |
|---|---|
| H1 | `display-1` size, weight, leading, tracking (same as LeafLink) |
| P1 | `text-body` |
| Supporting and caption | `text-supporting` |
| Steps on coarse | `--spacing-3` between H1 and P1, P1 and supporting, supporting and caption, and before the links (fine keeps the server rhythm) |

**Rawness, exactly**

- The hint "Tap a marker to walk its trail" gets inline glyphs placed before the words they name: a chalk diamond (1px hairline square, rotated 45 degrees, scale 0.8, sized from `chrome.legendGlyphPx.dot` 10) before "marker", and a dashed bar (`legendGlyphPx.bar` 16x3, `border-top-style: dashed`) before "trail". Both are `aria-hidden`; the copy text is unchanged.
- The coarse trail row uses the dashed bar as each button's icon; a claimed trail turns accent and its bar goes solid. Accent stays on the active control only.

What is deliberately not done: no handwriting font (Commit Mono only), no SVG roughen filter, no rotated text, no drop shadow, no card. The dashed edge is a 1px outline, flush, so the rectangle reads as cut from the plan, not as a floating card.

### 4.3 Tasks

| # | Failing check first | Change | Receipt |
|---|---|---|---|
| 4.a | Screenshot check at 390x658 and 1440x900: no lane pixel inside the plate rect (sample the canvas under the plate; all samples equal field.raised). Fails on baseline. | Plate CSS above. | AGY captures; Astra reviews |
| 4.b | `palette-receipt.py` contrast rows for chalk and chalk.2 on field.raised. | none (existing tokens) | 10.70, 6.91 |
| 4.c | Accessibility: hint text content unchanged; glyphs `aria-hidden`. | `HintWithGlyphs` in Readout.tsx. | T-S09 copy tests pass |

## 5. Item 5: stochastic shapeshifter motion

### 5.1 Decision

Motion varies per visit and per page; layout never does. One 32-bit session seed drives every random motion choice. Draws are counter based, so a value depends only on the seed and the draw count of its channel, never on frame timing. That is what makes it testable: same seed plus same input sequence gives the same frames.

### 5.2 Entropy source (`src/motion/entropy.ts`)

```ts
// splitmix32 finalizer over (seed, channel, index). Pure and total.
export function hash32(s: number, channel: number, index: number): number {
  let z = (s ^ Math.imul(channel, 0x9e3779b9) ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}
export function drawAt(s: number, channel: EntropyChannel, index: number): number {
  return hash32(s, CHANNEL_ID[channel], index) / 4294967296;
}
```

- Seed: `?seed=<uint32>` (token `entropy.seedParam`), else one `crypto.getRandomValues` value. Read once at app boot (`App.tsx` module scope calls `entropySeed()`), because the first draw happens inside travel, after the router's `pushState` has already replaced the URL without its query. `Math.random` is not used for motion.
- Found by T-ENT-REPLAY, not by the pure suite: reading the seed lazily at first draw silently fell back to a random seed, so two `?seed=1234` loads gave bow -0.642 and -1.131 on the same first morph. The pure tests call `resetEntropy(seed)` directly and could not see it. After the fix both loads draw bow -0.330 from seed 1234.
- Channels: `morph-bow`, `morph-swirl`, `morph-pull`, `pulse-swirl`, `glitter-swirl`, each with its own counter.
- `world.seed` (layout hash, LeafLink sim sequence, T-LL-2) is separate and never changes.
- Debug: `window.__entropy = { seed, enabled, counters }`.

### 5.3 Parameter ranges and per-page variation

| Parameter | Range | Where it acts |
|---|---|---|
| Camera bow | signed, up to `entropy.scene.<to>.bowWorld` | lateral ground translation times sin(pi times eased progress): zero at both ends, rides the camera's own curve, pitch invariant |
| Ring swirl | signed, up to `entropy.scene.<to>.swirl` | tangential share of the ring push, same C1 falloff |
| Pull scale | `entropy.pullScale` [0.85, 1.15] | multiplier on `morph.silhouettePull` |
| Pulse swirl | signed, up to `entropy.pulseSwirl` 0.6 | taps and land pulses |
| Glitter swirl | signed, up to `glitter.swirl` 0.9 | GLITTERBOX hold |

| Destination | bowWorld | swirl | Why |
|---|---|---|---|
| server | 0 | 0 | Lockstep: the server arrives rigid, every time |
| leaflink | 1.5 | 0.35 | moderate, organic |
| sidequests | 2.5 | 0.7 | widest, wandering |
| scatter | 2.0 | 0.9 | glitter only |

Keyed by destination, so each page keeps its signature (DESIGN 6.3) while no two visits are identical.

### 5.4 Perf budget

Cost is one float uniform (`uRingSwirl`), one two-float ground offset added to an existing camera write, and five hashes per morph (not per frame, not per lane). No new draw call, no new texture, no per-lane CPU work. The vertex shader adds one multiply-add on the existing deflection term. p95 16.7ms holds by construction; device run 3 measures it (section 8.3), and if it does not hold, the fix is a DESIGN.md patch with the measurement, never a quiet lowering.

### 5.5 Reduced motion

Deterministic: `setEntropyEnabled(false)` makes `unit()` return 0.5 and `signed()` return 0, so bow 0, swirl 0, pull scale 1, identical for every seed. `+ 0` folds the negative zero a signed draw times a zero range produces.

### 5.6 Stochastic verification

| Test | Asserts |
|---|---|
| T-ENT-1 (pure) | same seed reproduces: a fixed 24-navigation script cycling all destinations gives `toEqual` (bow, swirl, pull scale) arrays |
| T-ENT-2 (pure) | different seeds vary: more than half the script's values differ between seed 1 and seed 2 (server bow and swirl are rigid by token, so only its pull scale varies) |
| T-ENT-3 (pure) | reduced motion is neutral and seed independent: seeds 7 and 99999 give identical arrays of exactly bow 0, swirl 0, pull scale 1 |
| T-ENT-4 (pure) | ranges for 2,000 seeds: every draw inside its token range, server bow and swirl exactly 0 (`toBe(0)`, so no negative zero), `drawAt` in [0, 1) |
| T-ENT-5 (pure) | for 200 seeds and every from/to pair, the bow factor is 0 at p 0 and at p 1 and the ring strength is 0 at travel end |
| T-ENT-REPLAY (browser) | the full script 2, 3, 1 sampled every 16ms (bow, swirl, ring strength, pan) is `toEqual` for seed 1234 twice and `not.toEqual` for seed 98765 |
| AGY seed sweep (section 9) | 512 seeds: replay identical, distribution in range, frame budget per seed |

**The clock has to be paused.** T-ENT-REPLAY's next failure was the harness, not the product: `page.clock.install` alone keeps page time flowing with wall time, so under load a step was sometimes 32ms instead of 16ms (sampled p 0.1243 then 0.17 in one run, 0.1471 in the other). The tests and both trace scripts now call `page.clock.pauseAt` after load, so `runFor` is the only clock, and the first input is put on the 16ms frame grid. With that, two seed-1234 loads match to the last digit (ring strength 0.4046 on the same frame in both). The round-2 receipts were taken before the pause: their geometry is exact, their ms stamps are good to about one frame.

**What "same seed reproduces" means, precisely.** Same seed, same input script, same viewport, same loaded state. The last term matters: the hero anchor, and so the Gather start, resolves on the first frame after the brand manifest has arrived (a ring never renders at an unresolved anchor). The manifest is real network I/O, so a replay that starts sampling before it arrives can differ in ring strength by a frame or two of Gather while bow and swirl stay identical. T-ENT-REPLAY's first run showed exactly that (ring strength 0 vs 0.400 on the third sampled frame, bow and swirl equal), so the test now waits for `window.__brandPrefetched` before the script starts. This is a test precondition, not a product change: on a cold first visit the mark simply places a little later, once, at its final position.

## 6. Item 6: GLITTERBOX plus UI overhaul

### 6.1 Ruling

**GLITTERBOX is IN, as a hold mode of the lane field. No tab, no page, no copy, no new asset.**

Press and hold the field for `glitter.holdMs` 500 (or hold the g key): the drawn layout weights blend toward the scatter layout up to `glitter.maxWeight` 0.85, and a swirled ring of `glitter.ringRadiusPx` 120 follows the finger. Let go and the scene re-forms over one travel duration (700ms, signature curve), finishing at exactly zero. It never changes the route, the readout, the travel weights, or any text.

### 6.2 Why this and not the alternatives

- **Not a tab.** A fifth keymap item would put a toy at the same rank as the projects, and the keymap is the only navigation. The 1.1.0 item 6 ruling (no flat blueprint view) stands for the same reason: no second way of looking at the site that competes with the site.
- **Not a sticker layer, sparkle sprites, or a cursor effect.** Decorative particles and cursor trails are banned outright, and they would be a second material. The site's claim is that everything is made of the same 6,144 lanes; glitter is that material coming apart and re-forming, which proves the claim instead of decorating it.
- **Not nothing.** The handmade-web joy is worth having, and a hidden, opt-in, zero-copy mode costs no clarity: a visitor who never holds never sees it.
- **The particle rule is met, not bent.** Section 10 bans decorative particles; this draws no new particle, only the existing lanes at a different layout weight, and only while the visitor is holding.

### 6.3 Input rules (`src/chrome/glitterbox.ts`)

- Hold threshold equals the LeafLink tap limit, so a LeafLink tap (shorter) still drops an offer and a hold never does.
- Moving `world.leaflink.tapMaxMovePx` or more before activation cancels (that gesture is not a hold).
- Once active, moving stirs: the ring follows the pointer.
- Off under reduced motion, while a sheet is open, and during travel (the engine refuses then as well).
- The g key ignores modifiers, repeats, and editable focus.
- `#world canvas` gets `-webkit-touch-callout: none` and `user-select: none`, so iOS gives the hold to the page.

### 6.4 UI overhaul, scoped to what device run 2 showed

- Keymap grouping: scenes left, panels (whoami, contact) right, via `.jp-keymap-item[data-route] + .jp-keymap-item[aria-haspopup] { margin-left: auto; }`. One rule, no new element.
- The project slip anatomy is unified (items 3 and 4): one slip, two materials.
- No other chrome changes. The rest of the chrome passed device run 2.

### 6.5 Tasks

| # | Failing check first | Change | Receipt |
|---|---|---|---|
| 6.a | T-GLITTER-1 (browser): no activation at 400ms; active by 600ms; ring within 2px of the pointer; glitter weight and ring strength exactly 0 1.5s after release; a 120ms tap still drops a visitor offer and never glitters. | `useGlitterbox`, `lanefield.setGlitter`, draw-weight blend, `applyRing` glitter branch. | activates at 496ms, ring under the pointer every frame, exactly 0 at release plus 700ms |
| 6.d | Same test, release half. Failed on the first implementation: the release damped with a 300ms half-life, so 1.5s after release the weight was still 0.0176 (an exponential tail that breaks the rest invariant for about 3s, then an epsilon snap). | Release is a finite ramp: `value = releaseFrom * (1 - easeSignature(age / motion.ms.travel))`, exactly 0 at 700ms; rise still damps over `motion.ms.fast`. | 0.0176 to 0 |
| 6.b | T-REDUCED-POLISH (browser): 800ms hold under reduced motion never activates. | `prefersReducedMotion` gate. | pass |
| 6.c | Travel weights unchanged during a hold (T-LF-2b reads `weights`, not `drawWeights`). | Separate `drawWeights` array. | pass |

## 7. Files touched

New: `src/motion/entropy.ts`, `src/motion/stage.ts`, `src/lib/brandManifest.ts`, `src/lib/coarse.ts`, `src/chrome/glitterbox.ts`, `tests/feedback-round/polish.spec.ts`, `tests/feedback-round/polish-browser.spec.ts`, `qa/polish-2/` (RECEIPTS.md, receipts.json, trace-morph.cjs, trace-interact.cjs, playwright.local.config.ts), this spec.

Modified: `src/world/morph-controller.ts`, `src/world/lanefield.ts`, `src/world/camera.ts`, `src/world/types.ts`, `src/world/stub.ts`, lane vertex and fragment shaders, `src/world/deflection.ts`, `src/travel.ts`, `src/App.tsx`, `src/chrome/titleFit.ts`, `src/hero/BrandHero.tsx` (rewrite), `src/hero/heroGeometry.ts`, `src/scenes/sidequests.tsx`, `src/world/sidequests.ts`, `src/world/leaflink.ts`, `src/chrome/Readout.tsx`, `src/scenes/leaflink.tsx`, `src/chrome/chrome.css`, `src/lib/brandPrefetch.ts`, `src/motion/entropy.ts` boot read in `src/App.tsx`, `spec/astryx/DESIGN.md`, generated tokens (TS, CSS, JSON), and three existing tests updated to read the new tokens (morph.spec.ts ENV, RECEDE, BREATH; hero.spec.ts T-HERO-UNIT and T-HERO-6; chrome.spec.ts T-S04-6 order). Each of those updates follows an intended spec change and computes from tokens; no threshold was loosened.

## 8. Acceptance

### 8.1 Pure (repo runner, no browser)

Every test in `tests/` that launches no browser, run with the repo runner: 47 pass, 1 skipped (T-S02-8, the startup longtask probe, which is device gated by design because SwiftShader cannot measure it). The polish set is `tests/feedback-round/polish.spec.ts` (T-ENT-1 to 5, T-ANCHOR-1/2, T-LF-7b) plus the updated morph, hero, and chrome tests listed in section 7.

### 8.2 Browser (`tests/feedback-round/polish-browser.spec.ts`)

Phone viewport 390x658, `isMobile`, `hasTouch`, fake clock, `?seed=42` unless stated. Dev server on 5173.

| Test | Covers | Result here |
|---|---|---|
| T-FLUSH-1 | 1.a, 1.d | pass |
| T-RING-1 | 1.b, 1.c (LeafLink tolerance 2px, SideQuests 22px for its wander drift) | pass |
| T-LL-VERB | 3.a | pass |
| T-SQ-TRACK trails 1, 2, 3 | 3.b | trail 2 pass; trails 1 and 3 expected failures (10.2) |
| T-GLITTER-1 | 6.a, 6.d | pass |
| T-ENT-REPLAY | 5.6 | pass (bow and swirl bit-identical for one seed; worst ring-strength gap 6.5e-14, asserted under 1e-9; another seed differs by more than 1e-3) |
| T-REDUCED-POLISH | 3.e, 5.5, 6.b | pass |

Run here with `qa/polish-2/playwright.local.config.ts`: the repo config unchanged plus `executablePath` from `PW_CHROMIUM` and SwiftShader flags. On a machine with the pinned browser, the repo's own config runs them unchanged.

    PW_CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell \
    POLISH_DEV=http://127.0.0.1:5173 \
    npx playwright test -c qa/polish-2/playwright.local.config.ts tests/feedback-round/polish-browser.spec.ts

Runtime under SwiftShader is about 30 minutes for the seven (T-ENT-REPLAY alone is 9), because every 16ms step renders a 6,144-lane frame in software.

SideQuests mark drift: after the morph the SideQuests mark moves 12.6px as it drifts along its wander path. That is the S09 passive motion, not a re-justify, which is why T-FLUSH-1 asserts constancy on LeafLink only and T-RING-1 gives SideQuests a 22px tolerance that covers drift plus the 8px clearance offset.

### 8.3 Device run 3 (Justin, iPhone in-app browser and Safari)

1. Server to LeafLink, 10 times: the mark appears where it ends, grows in while the camera settles, and the text follows. Nothing jumps.
2. LeafLink at rest for 10 seconds: no bulge anywhere; the mark beats only when a match lands.
3. Drop an offer from the button (visible without scrolling) and by tapping the mark: the route draws, the pulse travels into the mark, one bigger beat.
4. SideQuests: tap Trail 1, 2, 3 in the plate: where a clear pan exists the marker moves beside the sign and the trail draws to it; the claimed marker is never under the sign; the horizon never tilts. Note which trails move and which stay put (input to 10.2).
5. SideQuests copy: no lane crosses any letter.
6. Hold the field anywhere for half a second: glitter under the finger, stir, release, re-form. A quick tap on LeafLink still drops an offer.
7. Same URL with `?seed=7` twice: the same morph arcs. Without a seed, two reloads: different arcs, same pages.
8. Low Power Mode on and off: the HUD p95 and p99 through steps 1, 3, 4, 6, recorded as measured (G-PERF-DEVICE).
9. Reduced motion on: everything works; no glitter, no pan, the mark simply appears.
10. Screenshots with markup off (settles the yellow reading).

## 9. Review roles

### 9.1 Astra checklist (code QA and polish)

- [ ] Frame order in `doFrame` matches section 1.3; `clampSideQuestsPitch` is still the last camera write; `applyRing` is the only writer of ring and silhouette fields (`grep ringStrength src`).
- [ ] No `Math.random` in motion code (`grep -n "Math.random" src`).
- [ ] Every new number lives in DESIGN.md section 12 or carries `// lit-ok:` with a reason; `lint-tokens` passes.
- [ ] `banned-scan` passes on src and dist (no bare "live", no em dashes, no all caps, no eyebrows).
- [ ] Green appears only inside `data-brand-mark`; palette-receipt passes.
- [ ] No gradients in chrome; no glass, blur, drop shadows, cards. The `.jp-sq-glyph--marker` 1px inset ring follows the existing hairline idiom (`chrome.css:176`, `:358`), not a shadow.
- [ ] The SideQuests plate and the lanes never read as a circuit board: dashed edge only, no corner nodes, no right-angle connectors.
- [ ] `flushSync` is only in `onSwap`; no other synchronous render was added.
- [ ] The stage bus has one listener that moves the camera or the mark (BrandHero).
- [ ] Coarse twins have `aria-hidden` and `tabIndex -1`; fine twins remain focusable; the trail row has `aria-pressed`.
- [ ] App chunk budget (section 10) acknowledged as pre-existing.

### 9.2 AGY 3.8 flash seed sweep (mechanistic runner)

1. Replay: for 512 seeds (0 to 511 plus 64 random uint32 logged), run T-ENT-REPLAY's script twice; assert identical traces. Output: seed, pass, first differing frame if any.
2. Distribution: from the same runs, histogram bow and swirl per destination; assert every value inside its token range, server values exactly 0, and the sign split between 45% and 55%.
3. Rest invariant under stress: for 64 seeds, 200 random key presses with random 0 to 900ms gaps (seeded, so the sweep itself replays); after each idle of 1.5s assert ring and silhouette strength 0.
4. Glitter stress: 100 holds with random durations 0 to 2000ms and random moves; assert no activation under 500ms, no offer dropped by a hold, zero ring 1.5s after release.
5. Frame budget: on the device-matched headless run, record per seed the rAF delta p95 and p99 through the script (relative only; G-PERF-DEVICE stays the device number). Flag any seed whose p95 is more than 10% above the median seed: the cost should be seed independent.
6. Report as a table: seed, replay, ranges, rest, glitter, p95, p99. Failures go back to Claude with the seed, which reproduces them exactly.

## 10. Known and not fixed here

- **App chunk 163.5KB gz against a 110KB budget.** Pre-existing: the baseline at c64193d is 161.6KB. This round adds 1.9KB (0.7KB of it is the entropy module, now in the app chunk so the seed is read at boot). The world chunk is 209.7KB against 220KB (baseline 204.9). The overage predates this round and needs its own task (likely splitting the Astryx core import); the budget is not changed here.
- `sidequests-readme.md` not attached (section 0).

### 10.1 Existing suite on the patched tree (118 of 155 run, failures rerun)

| Test | Failure | Status |
|---|---|---|
| T-SQ-CAM-1 trails 1, 2, 3 | `keyboard walk: never focused Trail 1, last focused null` | **Caused by this patch, fixed.** On coarse the keyboard path moved from the twins to the trail row, whose buttons had a visible label but no `aria-label`, which T-SQ-5's keyboard walk reads. Fix: `aria-label={label}` on each trail row button (the name the twin had). Rerun: 3 of 3 pass. |
| T-SQ-CAM-2 forced flat pose | same message | **Caused by this patch, fixed.** It mounts the scene harness, which has no trail row, so coarse twins made pointer-only left no keyboard path at all. Fix: twins go pointer-only only when App says the row is docked (`trailRowDocked`). Rerun: pass, and the world-harness variant passes too. |
| T-HERO-BAND-WALK | after the label fix: the mark rect overlaps marker twins during and at the end of a coarse walk (8 samples over 3 walks) | **Caused by this patch, fixed.** The coarse pan brought the subject to the mark center, so the claimed marker landed under the mark and the mark (itself a tap target) covered the marker's tap target. That gate is right. Fix, in four measured steps: spot beside the mark instead of its center (overlaps 8 to 16 samples, still failing); clear the mark's motion margin and a full target of separation (9); stop chasing the drawing head and hold the destination (5); count only spots whose straight pan never crosses the mark (0). Rerun: pass. Cost: see 10.2. |
| T-SQ-CAM-2 world harness | `ENOENT reports/w7-cam-chromium.json` in the file's afterAll | Environment: the container had no `reports/` directory. Created; not a code defect. |
| T-SRV-2 at 390x844 | `browser.newContext: Protocol error ... Failed to find browser context` | Environment: the headless shell dropped a context under SwiftShader load. Not a code defect; rerun on device run 3 hardware or the pinned browser. |
| T-ASSET-1, T-HERO-2 | manifest vs SOURCES.json; LeafLink stand-in maxDeltaE 35.5 | Expected: brand images here are stand-ins at the real dimensions (section 0). Rerun after the Codeberg pull. |
| T-TRANS-6 | one travel weight changed by 1 during a 60s idle (URL and H1 unchanged) | **Open, not reproduced outside the suite.** Fails in the suite on the patch (twice). A direct probe on the patch (load, then 60s idle on each of server, LeafLink, SideQuests, weights read every 6s) shows weights constant at one-hot on all three. The baseline run did not reach the assertion (its `gotoApp` timed out waiting for the keymap under the same load), so it is not yet known whether this is pre-existing. Astra task: run on c64193d and the patch on real GPU hardware; if only the patch fails, log `weights()` each second inside the test. |
| T-LL-3 | tap did not produce a route and a visitor pin within 300ms | **Pre-existing.** Fails the same way on c64193d in this container (a 300ms wall-clock budget with two lane fields under SwiftShader). Not a patch regression; it is a device-run measurement. |
- Real brand assets not tested (section 0).

### 10.2 Open decision for Justin: phone camera pan vs T-HERO-BAND-WALK

The existing gate T-HERO-BAND-WALK says the mark never overlaps a marker during a walk. It is right, and it holds. It also limits item 3 on phones. The pan moves the whole plan in a straight line, and for some trails every straight pan that would bring the marker into view crosses the mark on the way. Those trails now get no pan. Measured: at 390x844, trail 2 pans into view beside the mark and trails 1 and 3 stay where they are. At 390x658 (Justin's in-app browser) there is no spot beside the mark at all (above is the readout, below is the keymap), so no SideQuests trail pans. That viewport behaves as before this round. The LeafLink verb, the readout order, the trail row, and the land beat are unaffected.

Three ways forward, none taken here because each changes a gate or a fixed value:

1. **Smaller mark on short phones** (DESIGN `hero.minSizePx` or a height-keyed size). That leaves room for a spot beside the mark. It changes a token, so it needs a DESIGN.md patch with the 390x658 measurement.
2. **Two-leg pan**: first sideways clear of the mark, then into the spot. No gate change, but more motion and more code. Measure the cost on device.
3. **Amend T-HERO-BAND-WALK** to count only an opaque, interactive mark. During a walk the mark is receded to opacity 0, and it could also get `pointer-events: none`. That is a gate change, so it is Justin's call, made through a DESIGN.md patch.

My recommendation is 1: it is one token with a measurement, keeps every gate, and gives the phone the feature it was asked for. T-SQ-TRACK trails 1 and 3 are marked `test.fail` so the suite reports the gap and flags the moment it closes.

## 11. DESIGN.md diff (1.1.0 to 1.2.0)

The full patch is in `polish-round-2.patch`. Prose and token changes:

```diff
diff --git a/spec/astryx/DESIGN.md b/spec/astryx/DESIGN.md
index b70a9f0..e901229 100644
--- a/spec/astryx/DESIGN.md
+++ b/spec/astryx/DESIGN.md
@@ -1,6 +1,6 @@
 # DESIGN.md: Justin Poli personal site, Astryx Keystone
 
-Version 1.1.0, 2026-11-01. Single token home. Owner: the spec package in `spec/astryx/`.
+Version 1.2.0, 2026-11-02. Single token home. Owner: the spec package in `spec/astryx/`.
 
 **Rule zero.** If a value is not in this file, it does not exist. Every color, size, duration, easing, count, coordinate and camera pose the build uses is in the `design-tokens` JSON block in section 12. The build reads that block (`tools/extract-tokens.mjs`, spec S00) and generates `src/tokens.generated.ts` and `themes/lane/tokens.generated.json`. Source code imports values from the generated module. A hex literal, a `ms` literal, or a bare geometry number in `src/` outside generated files fails the token lint (S11, gate G-TOKENS). To change a value, change it here, bump the version, add a changelog line.
 
@@ -166,6 +166,8 @@ Durations (Astryx motion config `{fast: 150, medium: 300, ratio: 0.67}`, verifie
 
 Feedback is never over 250ms: the keymap item turns accent in 150ms and the lanes start moving on the next frame. Travel itself is 700ms of expo-out, which places 80% of the displacement in the first 210ms; the remaining 490ms is deceleration that never blocks input (a second key press mid-travel retargets from the current state, S03). So the perceived response is under 250ms and the full settle is a surface transition that never makes anyone wait. This is the deliberate reading of MOTION-LANGUAGE rules 1 to 4, recorded here so nobody "fixes" the 700ms.
 
+**1.2.0 note (device run 2).** The camera curve and the 700ms stay. What read as a jarring camera re-adjust was three DOM and ring defects that landed at the moment the camera settled (the mark parked at the viewport center while the readout was display none and jumped 160px when it returned; the ring sat at the camera target, off the mark; a ring strength survived every morph as a frozen bulge), plus an empty window between camera arrival (about 0.17 of travel) and the text (0.55). The mark now looms in over `motion.morph.loom` (0.30 to 0.70), inside that window, at its final position, with the ring growing under it; see 6.7.
+
 ### 6.3 Motion signature per scene (the three must never be swapped)
 
 | Scene | Signature | Mechanism |
@@ -214,10 +216,17 @@ Motion is never the only carrier of information: every fact on a scene is in DOM
 All phases run inside `--jp-duration-travel` (700ms) with the signature curve unless stated. Times are fractions of travel and overlap on purpose. Values are proposed tokens (`motion.morph`, `morph.*`); the device run confirms them.
 
 - **Release** (0.00 to 0.30): the outgoing signature loosens: Lockstep sync to free, heartbeat amplitude to 0, or wander damped. Gradient parameters start interpolating. Curve: signature.
-- **Gather** (0.15 to 0.75): the deflection ring grows from 0 to r at the target anchor, so lanes bend open around a circle. Silhouette pull (strength `morph.silhouettePull` 0.35, proposed) draws lanes near the ring toward the logo alpha-mask contour, so the lanes visibly become the logo outline. Curve: signature for radius; `curve.track` if the anchor moves.
-- **Reveal** (0.55 to 1.00): the logo looms in: opacity 0 to 1, scale `morph.loomFrom` 0.92 to 1.00. The incoming signature starts at 1.00. The SideQuests spring overshoot is allowed only in its own arrival. Curve: signature.
+- **Gather** (0.22 to 0.75, 1.2.0; was 0.15): the deflection ring grows from 0 to r at the target anchor, so lanes bend open around a circle. Silhouette pull (strength `morph.silhouettePull` 0.35 times the seeded pull scale, 6.11) draws lanes near the ring toward the logo alpha-mask contour, so the lanes visibly become the logo outline. Curve: signature for radius; `curve.track` for center travel. Gather starts after the readout swap (0.214), because the anchor is the placed mark (below), which exists from the swap commit; if an anchor is not resolved by Gather start, Gather begins at the first frame it resolves, and a ring never renders at an unresolved position.
+- **Loom** (0.30 to 0.70, 1.2.0): the logo looms in at its final position: opacity 0 to 1, scale `morph.loomFrom` 0.92 to 1.00, while the camera settles and before the text. Curve: signature.
+- **Reveal** (0.55 to 1.00): the incoming title and copy enter. The incoming signature starts at 1.00. The SideQuests spring overshoot is allowed only in its own arrival. Curve: signature.
+
+**Anchor (1.2.0).** The ring and silhouette center on the placed hero mark, not on the camera target: the hero registers its screen center and two radii (`lanefield.setHeroAnchor`), and the engine ground-projects them through the current camera after the final camera write of every frame. The ring radius is the larger mark half-extent plus `hero.ringPadPx`, clamped to the mark center's clearance from the readout, the name zone, and the keymap, so the bulge never reaches them. The silhouette radius is the mark half-extent, so the mask square spans the mark. Field to project morphs depart from the pressed keymap item (ground-projected per frame) and travel to the anchor on `curve.track` over Gather.
+
+**Rest invariant (1.2.0).** Outside a morph, ring and silhouette strength are zero unless a pulse or a GLITTERBOX hold is active. Ring fields are engine owned: `setParams` no longer writes them into the travel target, and travel end zeroes both strengths.
 
-**Other directions.** Project to server or whoami: the logo recedes (scale 1.00 to `morph.recedeTo` 0.96, opacity to 0, window 0 to 0.40), the ring collapses (0.20 to 0.80), and Lockstep or Quiet re-forms (0.50 to 1.00). Project to project (for example LeafLink to SideQuests): logo A recedes, the ring shrinks to `morph.ringBreath` 0.6r and regrows to r (a breath), the ring travels between anchors on `curve.track` if the anchors differ, and logo B looms in during Reveal.
+**No categorical snaps (1.2.0).** Light mode crossfades from the outgoing to the incoming mode over the param curve (`uLightModeFrom`, `uLightMix`) instead of switching at the midpoint. Both silhouette masks load once after the first frame and are uploaded before use, so no morph swaps a mask in mid-flight.
+
+**Other directions.** Project to server or whoami: the logo recedes (scale 1.00 to `morph.recedeTo` 0.96, opacity to 0, window `motion.morph.recede` 0 to 0.20, 1.2.0; was 0 to 0.40, which ran past the readout swap at 0.214 where the mark unmounts, so the mark popped out), the ring collapses (0.20 to 0.80), and Lockstep or Quiet re-forms (0.50 to 1.00). Project to project (for example LeafLink to SideQuests): logo A recedes, the ring shrinks to `morph.ringBreath` 0.6r and regrows to r (a breath), the ring travels between anchors on `curve.track` if the anchors differ, and logo B looms in during Reveal.
 
 **Controller rules.** State is snapshot, target, and start time. Navigate takes a snapshot of the current interpolated values, sets the target and start time, and pushes history immediately, so back works mid-flight. The previous morph is discarded, never queued (retargeting). Direction follows keymap order 1, 2, 3, W; history back and forward use the same path with direction from that order. Outgoing title and copy exit over 150ms at t = 0. The incoming title arrives at Reveal start. Focus moves to the new H1 at Reveal start, under the existing focus condition (only if focus was inside the old readout or on the keymap), and never while the Contact sheet focus lock is active. No per-lane start-time stagger: all lanes start at t = 0 and vary only in path, never in start time.
 
@@ -231,9 +240,11 @@ All phases run inside `--jp-duration-travel` (700ms) with the signature curve un
 
 **Placement.** Outside the name clear zone, the readout clear zone, and the keymap. Minimum hero size (`hero.minSizePx`) keeps 375x667 at document height equal to viewport height. The displayed rectangle must also satisfy the brand area cap (section 3.5); W6 fits each mark inside the cap from its aspect ratio.
 
-**Passive motion.** Continuous, never pausing and restarting on a timer. LeafLink: a small scale on each beat, peak `hero.beatScale` 1.015 (proposed). SideQuests: drift along the wander path, settling with the existing spring.
+**Placement (1.2.0).** Computed once per page configuration in the readout swap commit (travel conceals the readout with visibility, inert, and aria-hidden, so its rect exists), against the name zone, the readout, the keymap, and the SideQuests marker tap targets at their resting projection. Never re-tracked per frame; recomputed only on viewport resize.
+
+**Passive motion.** LeafLink (1.2.0): event driven, never periodic (section 6.3). Each LeafLink match that lands beats the mark once (`hero.beatScale` 1.015 over `motion.ms.medium`); the visitor's own match lands with `hero.landBeatScale` 1.04. The shipped periodic beat contradicted 6.3 and is removed. SideQuests: drift along the wander path, settling with the existing spring. Both marks carry `hero.landBeatScale` headroom in the area cap.
 
-**Active motion.** Pointer or touch-drag tilts the plane within `hero.tiltMaxDeg` 8 (proposed) and shifts the lane depth bands for parallax. A tap sends one ripple through the ring: 150ms out, 700ms settle. No gyroscope, because it needs a permission prompt on iOS.
+**Active motion.** Pointer or touch-drag tilts the plane within `hero.tiltMaxDeg` 8 and shifts the lane depth bands for parallax. A tap on the mark is the page verb (1.2.0): LeafLink drops an offer at the map center, SideQuests walks the next open trail, with an immediate half-strength pulse from the tap point as feedback. No gyroscope, because it needs a permission prompt on iOS.
 
 ### 6.9 Lane field variant B
 
@@ -243,6 +254,28 @@ Variant B values (all proposed, token `lanefield.variance`): three depth bands,
 
 Budget, held on every route and during morphs (tokens `perf.*`): p95 frame time 16.7ms or less, p99 33ms or less, no long task over 50ms during a morph. Measurement: a dev-only HUD reading requestAnimationFrame deltas, the Safari Web Inspector timeline over a cable, normal mode and Low Power Mode, with whatever frame rate Low Power Mode produces recorded rather than assumed. Device run 2 measures against this budget; if a budget number is wrong, it changes here with the measurement, never by quiet lowering.
 
+### 6.11 Seeded entropy (1.2.0)
+
+One 32-bit session seed drives every random motion choice: `?seed=<uint32>` (token `entropy.seedParam`) replays a run exactly; otherwise one value from `crypto.getRandomValues`. The seed is read once at app boot, before the router's first `pushState` drops the query. Draws are counter based: draw(channel, n) is a pure hash of (seed, channel, n) (splitmix32 finalizer), so a value depends only on the seed and how many draws that channel has made, never on frame timing. Channels: morph bow, morph swirl, morph pull, pulse swirl, glitter swirl. `Math.random` is not used for motion. The layout seed `world.seed` is separate and never changes (layout hash, LeafLink sim sequence, T-LL-2 stay fixed).
+
+| Parameter | Range | Applied |
+|---|---|---|
+| Camera bow | signed, magnitude up to `entropy.scene.<to>.bowWorld` (server 0, LeafLink 1.5, SideQuests 2.5, scatter 2.0) | Lateral ground translation of camera position and target, times sin(pi times the signature-eased progress): zero at both ends, rides the camera's own curve, never changes pitch |
+| Ring swirl | signed, up to `entropy.scene.<to>.swirl` (server 0, LeafLink 0.35, SideQuests 0.7, scatter 0.9) | Tangential share of the ring push on the same falloff, so the swirled push stays C1 and zero outside the ring |
+| Pull scale | `entropy.pullScale` 0.85 to 1.15 | Multiplier on `morph.silhouettePull` |
+| Pulse swirl | signed, up to `entropy.pulseSwirl` 0.6 | Ring swirl for taps and land pulses |
+| Glitter swirl | signed, up to `glitter.swirl` 0.9 | Swirl direction for a GLITTERBOX hold |
+
+Per page variation is keyed by the destination, so each page keeps its signature: server arrives rigid (Lockstep, no bow, no swirl), LeafLink moderate, SideQuests widest. Reduced motion disables entropy: every draw takes its neutral value (bow 0, swirl 0, pull scale 1), identical for every seed. Cost is uniform-only (one float uniform, `uRingSwirl`, and a ground offset on the camera), no new draw call, so the 16.7ms p95 budget is unchanged.
+
+### 6.12 Stage grammar and camera tracking (1.2.0)
+
+One interaction grammar for both project pages (src/motion/stage.ts): **subject** (the page verb started: the visitor's LeafLink match routing, a SideQuests walk) recedes the mark and, on coarse viewports, pans the camera so the subject (the destination: the request node, the trail's marker) sits at a focus spot just above or below the mark, its center `size.coarseMinTargetPx` plus `hero.ringPadPx` plus the mark's motion margin from the mark edge. Only a spot whose straight pan never sweeps the subject under the mark counts (T-HERO-BAND-WALK); of those, the nearest; with none, no pan. The pan holds that spot for the whole walk, so the drawing head travels toward a marker already in view; **land** (route reached the request, trail claimed) sends a pulse from the subject's screen position into the mark and looms the mark back with one land beat; **beat** (any LeafLink match landing) beats the mark once; **release** returns the camera. The pan is a ground translation (pitch never changes, the camera band is untouched), damped with `focus.halfLifeMs` 200 and capped at `focus.maxPanWorld` 20. Fine viewports never pan: the whole plan and map are in view, and the S07 lean stays. On coarse, the lean yields to the pan. Reduced motion: no pan, no recede, no pulse; the verb still works.
+
+### 6.13 GLITTERBOX (1.2.0)
+
+Press and hold the lane field for `glitter.holdMs` 500 (the LeafLink tap limit, so taps keep their meaning), or hold the g key, and the drawn layout weights blend toward the scatter layout up to `glitter.maxWeight` 0.85 while a swirled ring of `glitter.ringRadiusPx` 120 follows the pointer; release re-forms the scene over `motion.ms.travel` on the signature curve, reaching exactly zero (no exponential tail). It never changes the route, the readout, the travel weights, or any copy, and it is off under reduced motion, while a sheet is open, and during travel. Lanes stay lanes (each still one of the 6,144 cores); section 10's particle rule is met because the mode is opt-in and draws nothing but the existing lane field.
+
 ## 7. Component signatures
 
 Named for their role on this site. Each has at least two variants or it is plain on purpose.
@@ -251,12 +284,12 @@ Named for their role on this site. Each has at least two variants or it is plain
 |---|---|---|---|
 | `Lanefield` | The 6,144-lane world (WebGL) | none, authored (S02) | layouts: server, leaflink, sidequests, scatter |
 | `Keymap` | The only navigation, one TUI line at the bottom edge | `Kbd` for key glyphs, `useHotkeys` for bindings | fine pointer (keys shown) / coarse pointer (keys hidden, 44px targets); item states: idle, hover, active |
-| `Readout` | A scene's DOM text block | none, plain HTML on tokens | `server` (no container, left column), `leaflink` (paper.raised slip, 0 radius, hairline ring, legend position), `sidequests` (chalk dashed outline, trailhead position) |
+| `Readout` | A scene's DOM text block | none, plain HTML on tokens | `server` (no container, left column), `leaflink` (paper.raised slip, 0 radius, hairline ring, legend position; 1.2.0 order: H1, P1, legend, SIM, OfferButton, rule, facts, stack, code), `sidequests` (1.2.0: field.raised plate, 0 radius, 1px dashed chalk.2 edge flush on the plate; legend glyphs in the hint; coarse trail row) |
 | `WhoamiSheet` | Education and campus roles | `BottomSheet` (purpose info, height hug) | open, closed |
 | `ContactSheet` | Email, copy, links | `BottomSheet`, `Button`, `Link` | open, closed; copy idle, copied, failed |
 | `CopyConfirm` | Copy result | `Toast` via `useToast` | info "Copied." / error "Copy failed. The address is selected." |
 | `OfferButton` | LeafLink keyboard path to drop an offer | `Button` variant `secondary` | idle, pressed |
-| `QuestMarker` | SideQuests marker (WebGL plus DOM button twin) | none in WebGL; DOM twin is a `Button` ghost | open, lit, claimed |
+| `QuestMarker` | SideQuests marker (WebGL plus DOM button twin) | none in WebGL; DOM twin is a `Button` ghost (transition none) | open, lit, claimed; fine: twins are the accessible controls; coarse (1.2.0): the accessible controls dock in the plate as a visible Trail 1, 2, 3 row, and twins are pointer-only (aria-hidden, tabindex -1) |
 | `BrandHero` | Project hero mark (LeafLink, SideQuests) | none; `picture` markup over the lane field | F0 animated GIF, F1 first-frame PNG, F2 text mark, F3 image without deflection |
 
 Theme component overrides (in `themes/lane/laneTheme.mjs`, legal keys verified with `astryx theme targets <Name> --json` in S01): Button `base` radius `--radius-element`, no shadow, label weight 700; Button `variant:primary` background `--color-accent`, color `--color-on-accent`; Kbd `base` background transparent, hairline ring, radius 2px; BottomSheet `base` background `--jp-raised`, radius 0 on the top corners (a TUI pane, not a phone card), no shadow.
@@ -321,7 +354,7 @@ The `field` regime is a site-level override on `[data-regime=field]` that re-poi
 
 ```json design-tokens
 {
-  "version": "1.1.0",
+  "version": "1.2.0",
   "color": {
     "void": {
       "ground": "#0A0C0F",
@@ -468,8 +501,10 @@ The `field` regime is a site-level override on `[data-regime=field]` that re-poi
     "feedbackMaxMs": 250,
     "morph": {
       "release": [0.0, 0.3],
-      "gather": [0.15, 0.75],
-      "reveal": [0.55, 1.0]
+      "gather": [0.22, 0.75],
+      "reveal": [0.55, 1.0],
+      "loom": [0.3, 0.7],
+      "recede": [0.0, 0.2]
     }
   },
   "world": {
@@ -854,7 +889,30 @@ The `field` regime is a site-level override on `[data-regime=field]` that re-poi
     "sizePx": 280,
     "minSizePx": 160,
     "tiltMaxDeg": 8,
-    "beatScale": 1.015
+    "beatScale": 1.015,
+    "ringPadPx": 12,
+    "landBeatScale": 1.04
+  },
+  "entropy": {
+    "seedParam": "seed",
+    "pullScale": [0.85, 1.15],
+    "pulseSwirl": 0.6,
+    "scene": {
+      "server": {"bowWorld": 0.0, "swirl": 0.0},
+      "leaflink": {"bowWorld": 1.5, "swirl": 0.35},
+      "sidequests": {"bowWorld": 2.5, "swirl": 0.7},
+      "scatter": {"bowWorld": 2.0, "swirl": 0.9}
+    }
+  },
+  "focus": {
+    "halfLifeMs": 200,
+    "maxPanWorld": 20.0
+  },
+  "glitter": {
+    "holdMs": 500,
+    "maxWeight": 0.85,
+    "ringRadiusPx": 120,
+    "swirl": 0.9
   },
   "brand": {
     "gifMaxBytes": 900000,
@@ -928,6 +986,19 @@ Scene specs restate some of these numbers inside formulas so a reviewer can chec
 
 ## 13. Changelog
 
+- 1.2.0, 2026-11-02: polish round 2 (device run 2). Every line traces to a repro in FINAL-POLISH-SPEC-2026-11-02.md.
+  - "motion.morph.gather 0.15 to 0.22: the ring starts after the readout swap, where the placed mark (its anchor) first exists."
+  - "motion.morph.loom 0.30 to 0.70 (new): the mark looms at its final position while the camera settles, filling the empty window before the text."
+  - "motion.morph.recede 0 to 0.20 (new token; was a 0 to 0.40 prose constant that ran past the swap, so the outgoing mark popped out)."
+  - "Ring and silhouette center on the placed mark (screen anchor, ground-projected per frame), radius clamped to clearance; rest invariant: zero strength outside a morph, pulse, or hold. Measured at 390x658: ring to mark after Gather 135px to 0px (LeafLink); rest strength 1.27 to 0."
+  - "Hero placement once per configuration in the swap commit, against a laid-out readout; no per-frame re-track. Measured LeafLink mark move during a morph 172px to 0px."
+  - "Light mode crossfades; both masks preload after the first frame."
+  - "hero.ringPadPx 12, hero.landBeatScale 1.04 (new); LeafLink beat event driven (the periodic beat contradicted 6.3)."
+  - "entropy.* (new): seeded bow, swirl, pull scale, pulse and glitter swirl; reduced motion neutral."
+  - "focus.halfLifeMs 200, focus.maxPanWorld 20 (new): coarse camera pan to a focus spot beside the mark, never sweeping a marker under it (T-HERO-BAND-WALK passes at 390x844). Pitch constant. At 390x658 trail 3 has no such pan and stays unpanned (open item)."
+  - "glitter.* (new): GLITTERBOX hold mode."
+  - "Readout: LeafLink verb first (offer button was 5px below the 46dvh slip at 390x658); SideQuests plate, legend glyphs, coarse trail row; coarse rhythm on both project slips."
+  - "Proposed values: entropy ranges, focus, glitter, loom, and landBeatScale are proposed; device run 3 confirms them."
 - 1.1.0, 2026-11-01: W1 feedback round spec patch.
   - "Gradients permitted inside lane-field motion only, cooked in OKLab from signal, ink and field."
   - "Server hero is the field; project heroes are brand marks; three-phase morph between them."
```
