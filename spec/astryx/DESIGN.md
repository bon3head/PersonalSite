# DESIGN.md: Justin Poli personal site, Astryx Keystone

Version 1.8.0, 2026-11-12. Single token home. Owner: the spec package in `spec/astryx/`.

**Rule zero.** If a value is not in this file, it does not exist. Every color, size, duration, easing, count, coordinate and camera pose the build uses is in the `design-tokens` JSON block in section 12. The build reads that block (`tools/extract-tokens.mjs`, spec S00) and generates `src/tokens.generated.ts` and `themes/lane/tokens.generated.json`. Source code imports values from the generated module. A hex literal, a `ms` literal, or a bare geometry number in `src/` outside generated files fails the token lint (S11, gate G-TOKENS). To change a value, change it here, bump the version, add a changelog line.

---

## 1. The idea

The whole site is one field of **6,144 lanes**. That number is not chosen for looks: the RTX 3070 Ti in Justin's inference server has 48 streaming multiprocessors with 128 CUDA cores each, 6,144 in total (NVIDIA GA104 public spec; receipt R-GPU in UNKNOWNS.md). Every line drawn anywhere on the site is one of those 6,144 lanes, rearranged.

- **Server** (home, `/`): the lanes run parallel and fire in lockstep, 32 at a time, the way warps do. They converge at one output point where nodes leave on the lanes and cool.
- **LeafLink** (`/leaflink`): the same lanes fall flat and become the streets of a neighborhood drawn in ink on paper. Requests and offers land as pins; a match is a route traced along the streets between them.
- **SideQuests** (`/sidequests`): the same lanes loosen into a chalk plan of a campus on blueprint blue: building outlines, hatching, walkways, and three dashed quest trails that light when you go to them.

Travel between scenes is the lanes re-forming in place while the camera moves. Nothing reloads. The arc is machine, then neighborhood, then people: lockstep, then networked, then wandering. One material, three behaviors.

## 2. The anti-template constraint

**Concrete, checkable statement:** the site has no navbar, no hero section, no cards and no scroll story. Its only navigation is a one-line terminal keymap pinned to the bottom edge (`1 server  2 leaflink  3 sidequests  w whoami  c contact`), and every line on every scene is drawn by the same 6,144-instance lane field, re-formed per scene.

**Test (G-ANTI):** `window.__lanefield.laneCount === 6144` in every scene; one draw call renders all lanes (`renderer.info.render.calls` attributable to lanes equals 1); DOM contains zero elements matching `[class*=card]`, zero `<header>` navbars, and the document height equals the viewport height at every route (no page scroll on desktop; on phones only the readout region may scroll). A reviewer can name the difference in one sentence: "the navigation is a TUI keymap and every scene is the same 6,144 GPU lanes rearranged."

## 3. Color

### 3.1 The blue, and why this blue

Astryx's stock accent is `#0064E0` light / `#2694FE` dark: Meta's blue. Shipping a blue accent on Astryx without moving off it is exactly the "Meta internal tool" failure the keystone rule warns about. So the blue was chosen by measurement, not taste alone.

Method (script: `tools/palette-receipt.py`, rerunnable): convert candidates and 51 reference blues (25 brand blues including Meta, Facebook, LinkedIn, Vercel, Docker, Codeberg, GitHub, Bootstrap, IBM, Zoom, Bluesky; plus Tailwind sky, blue, indigo 200 to 900 and cyan 300 to 400, because the Tailwind ramp is the AI-default palette) to OKLab; require Euclidean distance ΔE_ok at least 0.050 from every reference, at least 0.10 from Meta's four blues, and the WCAG pairs in 3.4.

Finding, stated plainly: every blue with OKLCH chroma above 0.14 at lightness 0.5 to 0.7 sits within ΔE_ok 0.05 of some brand or Tailwind stop. There is no ownable saturated mid blue. So the site owns blue by **lightness and job**, not by hue: a pale, moderately saturated **signal** that only ever appears as light on dark grounds, and a deep **ink** that only ever appears as marks on paper. Neither is ever a button fill at the brand-blue lightness band.

| Role | OKLCH | Hex | Nearest reference | ΔE_ok | ΔE_ok to Meta |
|---|---|---|---|---|---|
| `signal` (accent on dark) | 0.76 0.115 253 | `#7BB5F8` | Tailwind indigo-300 | 0.050 | 0.120 |
| `signal.dim` | 0.56 0.085 253 | `#4F77A5` | Tailwind sky-600 | 0.064 | 0.122 |
| `signal.hot` (in-scene core only) | 0.92 0.035 250 | `#D4E7FC` | Tailwind sky-200 | n/a, never text or UI | n/a |
| `ink` (accent on paper) | 0.33 0.095 256 | `#0E3565` | Tailwind sky-900 | 0.065 | 0.230 |
| `field` (SideQuests ground) | 0.285 0.075 258 | `#10294E` | Tailwind indigo-900 | 0.103 | 0.282 |

Why it reads alive: in the Server scene the signal blue is additive-looking light on a near-black ground, layered 6,144 times, with a `signal.hot` core on firing pulses. Saturation comes from density and motion, not from a loud hex.

**Second hue: none.** Cipher ember and petrol are dead and nothing replaces them. The quiet second voice is temperature, not hue: the paper and chalk neutrals sit at hue 85 (warm), the void and text neutrals at hue 250 to 255 (cool). That warm/cool split is what makes LeafLink feel warm with zero orange in it. Semantic error red exists for exactly one state (copy failed) and nowhere else.

### 3.2 Three light regimes (one hue, three figure/ground relationships)

| Regime | Used by | Ground | Raised | Text | Text 2 | Accent | Hairline |
|---|---|---|---|---|---|---|---|
| `void` | Server, 404 | `#0A0C0F` | `#15171B` | `#E6E8EA` | `#A7ABB0` | `signal` `#7BB5F8` | `#E6E8EA` at 13% |
| `paper` | LeafLink | `#F3F0EA` | `#E6E2DC` | `#14161A` | `#4E5359` | `ink` `#0E3565` | `#14161A` at 15% |
| `field` | SideQuests | `#10294E` | `#183662` | `chalk` `#F5F1E9` | `chalk.2` `#B6C6D7` | `signal` `#7BB5F8` | `#F5F1E9` at 16% |

Server is blue light on black. LeafLink is blue ink on paper. SideQuests is paper-white chalk on blue. The DOM switches regime by setting `data-regime` and `color-scheme` on `<html>` (S03 travel choreography): `void` and `field` are `color-scheme: dark`, `paper` is `color-scheme: light`, so every Astryx `light-dark()` token resolves to the right side automatically.

### 3.3 Hue budget

- Chrome (keymap, readouts, sheets): hue only on accent text, the active key, focus rings and the primary button. Nothing else in the DOM carries hue.
- Server: at most 30% of pixels carry hue (the verification render measured 24%; the lanes are the subject, so this budget is about keeping the left third and the top band empty, not about starving the field). Measured by G-HUE (S11): screenshot, count pixels with OKLCH chroma above 0.04.
- LeafLink: under 10% (`hueBudgetPct.leaflink`). Derivation, not yet a render: ink blended over paper crosses chroma 0.04 only at 55% alpha and up (30% blend measures 0.018, 55% measures 0.043, solid ink 0.095, halo tint 0.028). So local streets and halos never count; only arterials, routes and pins do. B6b's first render confirms the number; if it fails, the fix is arterial alpha, and the change is written here with a changelog line.
- SideQuests: the ground itself is blue, deliberately. This is the one regime where hue is the field, so the budget inverts: under 6% of pixels may be `signal` (`hueBudgetPct.sidequestsSignal`, counted as pixels within ΔE_ok 0.08 of signal); everything else is ground or chalk.
- No gradients anywhere in UI chrome. No glow on UI chrome. Light in the 3D scenes always has a source: a lane, a pulse, a marker.

### 3.4 Contrast receipts (WCAG 2.x ratio, computed, not eyeballed)

| Pair | Ratio | Requirement | Pass |
|---|---|---|---|
| void.text on void.ground | 15.94 | 4.5 text | yes |
| void.text2 on void.ground | 8.48 | 4.5 | yes |
| signal on void.ground | 9.15 | 4.5 (links, active key) | yes |
| signal on void.raised | 8.38 | 4.5 | yes |
| signal.dim on void.ground | 4.21 | 3.0 graphics only, never text | yes as graphic |
| void.text on void.raised | 14.61 | 4.5 | yes |
| paper.text on paper.ground | 15.92 | 4.5 | yes |
| paper.text2 on paper.ground | 6.82 | 4.5 | yes |
| paper.text2 on paper.raised | 6.02 | 4.5 | yes |
| ink on paper.ground | 10.76 | 4.5 | yes |
| ink on paper.raised | 9.49 | 4.5 | yes |
| ink on ink.tint | 8.69 | 4.5 | yes |
| chalk on field.ground | 12.86 | 4.5 | yes |
| chalk.2 on field.ground | 8.31 | 4.5 | yes |
| chalk on field.raised | 10.70 | 4.5 | yes |
| chalk.2 on field.raised | 6.91 | 4.5 | yes |
| signal on field.ground | 6.77 | 4.5 | yes |
| void.ground on signal (primary button label) | 9.15 | 4.5 | yes |
| paper.ground on ink (primary button label) | 10.76 | 4.5 | yes |
| error.dark on void.ground | 7.40 | 4.5 | yes |
| error.light on paper.ground | 5.74 | 4.5 | yes |

The build recomputes every pair from the token block (G-CONTRAST). Any pair under its requirement fails the build.

### 3.5 Gradients in lane motion, and the brand-marks exception

**Gradients exist only in the lane shader.** The page background stays flat field `#10294E` on SideQuests and flat ground elsewhere. CSS gradient functions stay banned in stylesheets, and the banned scan is unchanged. No gradient appears in UI chrome, ever.

**Lane gradient.** Each lane is a short gradient from head to tail: the head is the scene's lead stop, the tail decays toward ink, then field, at alpha. Moving lanes read as comet streaks, so the gradient is the motion. Interpolation happens in OKLab inside the shader, never in sRGB and never in HSV. Stop values come from the `scene.<route>.gradient` tokens, converted once to OKLab at build time (W4 owns that conversion step). The three stops are signal, ink, and field only; no new hue enters through any gradient. Per-page character comes from lead stop placement, tail length, and light mode, never from a new hue.

**Light source.** Each scene has one moving light parameter that shifts lanes toward signal near it. This is a sourced brightening: lanes get brighter near the light, nothing glows from nowhere.

**Dithering.** Dark blues band on 8-bit displays, so the shader adds a luminance-only dither of plus or minus half a level. The same factor scales all three channels, so hue does not change. Per-channel noise is forbidden: it would swing the hue of near-black pixels and trip the hue gate. T-LF-5 tests dithered near-black pixels against the gate.

**Hue gate method (kept, stated plainly).** The gate measures OKLab distance from signal, not an HSV hue band. T-SQ-6 screenshots the route, converts every pixel to OKLab, counts pixels within DeltaE_ok 0.08 of signal `#7BB5F8`, and requires under 6 percent on SideQuests; server and LeafLink use the same method against their budgets (30 and 10). The patch plan section 3.2 statement that an HSV equivalent band is measured in W0 is not satisfiable from the gate as written (W0 section 4): the gate measures OKLab distance from signal, not an HSV hue band. W1 keeps the OKLab method and adds no HSV measurement. If a later round wants an HSV measurement, it adds it as a new gate; it must not be claimed from the OKLab gate.

**Brand-marks exception.** The no-logo rule in section 9 has one scoped exception: the two project marks (LeafLink and SideQuests) render in native color. Exactly one `data-brand-mark` element exists on LeafLink and on SideQuests; none exists on server or whoami. Outside that element's rectangle, the existing hue budget is unchanged. Inside it, only colors in that asset's fingerprint are allowed, within DeltaE 3 (token `brand.fingerprintDeltaE`). Area cap: the rectangle may cover at most 12 percent of the viewport at 390x844 (token `brand.areaCap`, measured in W6). Surrounding motion stays in the Astryx blue family; only the mark itself carries native color.

## 4. Type

**One family: Commit Mono** (OFL 1.1, `@fontsource/commit-mono@5.2.5`, Latin subset, weights 200, 400, 700). Justin's hero object is a terminal UI he wrote in Go; the site speaks in that voice everywhere, so there is one typeface decision and it is on purpose. Not Inter, not system sans, not JetBrains Mono (the developer-portfolio default). Commit Mono is neutral enough for paragraphs at 16px and distinct at display sizes.

- Fallback stack: `"Commit Mono", "Commit Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace`. `Commit Mono Fallback` is a local `@font-face` over `Menlo, Consolas, "DejaVu Sans Mono"` with `size-adjust: 100%`, `ascent-override: 92%`, `descent-override: 24%`, `line-gap-override: 0%` (values to be tuned in S00 until CLS from font swap is under 0.01; record the final values here).
- Preload only the 400 woff2. 200 and 700 load on idle with `font-display: swap`.
- In-scene text (troika SDF) uses the 400 `.woff` file (troika does not read woff2).

Scale: Astryx `typography.scale` with base 16, ratio 1.25 (verified output of `astryx theme build`): 13, 16, 20, 25, 31, 39, 49, 61 px. Plus two local display steps outside the Astryx scale, because a name in a terminal voice needs a 3x jump to land:

| Token | Size | Weight | Leading | Tracking | Use |
|---|---|---|---|---|---|
| `--jp-text-display-0` | `clamp(3.5rem, 9.5vw, 8rem)` | 400 | 0.95 | -0.04em | "Justin Poli" on Server only |
| `--jp-text-display-1` | `clamp(2.25rem, 6vw, 4.5rem)` | 700 | 1.0 | -0.03em | Scene titles "LeafLink", "SideQuests" |
| `--text-heading-2` (Astryx) | 25px | 700 | 1.2 | -0.01em | Sheet titles |
| `--text-body` (Astryx) | 16px | 400 | 1.5 | 0 | Readout prose, max 52ch |
| `--text-supporting` (Astryx) | 13px | 400 | 1.54 | 0 | Facts lines, captions |
| `--jp-text-key` | 13px | 700 | 1 | 0 | Keymap key glyphs |

Rules: 700 for titles and keys, 400 for the name and everything else (name thickened from 200 per Justin's critique, 2026-10-30: the hairline name did not pop). No all-caps text anywhere. No letter-spaced eyebrows. No text smaller than 13px. Numbers use `font-variant-numeric: tabular-nums`.

## 5. Space, radius, size, border, focus

- **Spacing**: Astryx scale unchanged (4px base: `--spacing-1` 0.25rem up to `--spacing-12` 3rem). Local: `--jp-gutter` 16px under 640px wide, 32px from 640, 48px from 1280. `--jp-keymap-h` 44px (coarse pointer) and 36px (fine pointer).
- **Name clear zone**: the wordmark bounding box expanded by `zone.name.padPx` (12px) on every side. No title, readout, hero, or keymap may intersect it. W0 measured the coarse name box as left 16, top 16, right 126, bottom 40, so the coarse clear box is left 4, top 4, right 138, bottom 52. Titles size to fit: a title renders at the smaller of its token size and the available width divided by characters times the Commit Mono advance, and it never enters the zone. T-NAME-1 checks the zone on every route.
- **Radius**: Astryx `radius: {base: 2, multiplier: 1}` gives inner 2px, element 4px, container 6px, page 14px (verified). The site uses only `--radius-none` and `--radius-element` (4px). One radius system. The LeafLink legend slip has 0 radius (paper is cut, not rounded). Pins and markers are geometric shapes, not radii.
- **Control sizes**: Astryx `--size-element-sm/md/lg` overridden to 32/36/44px; every touch target is at least 44 by 44 CSS px on coarse pointers (adaptation rule `pointer: coarse` sets md and lg to 44px).
- **Border**: `--border-width` 1px. Borders are drawn as `box-shadow: inset 0 0 0 1px var(--jp-hairline)` (hairline rings, crisp on all DPRs).
- **Shadows**: none. Astryx `--shadow-low/med/high` are overridden to `none`. Elevation is tonal (ground to raised).
- **Focus**: Astryx focus tokens, color `--color-accent` per regime, width 2px, offset 3px. Focus is always visible on keyboard navigation (`:focus-visible`).
- **Blur and glass**: never.

## 6. Motion

### 6.1 Durations and easings

Two easings, both from the measured motion language:

| Token | Value | Use |
|---|---|---|
| `--ease-standard` (Astryx, overridden) | `ease` | The house curve. All feedback: hover, press, focus, toggle, sheet open. |
| `--jp-ease-signature` | `cubic-bezier(0.23, 1, 0.32, 1)` (expo-out) | Signature moves only: scene travel geometry and camera, readout entrance, pin landing. |

Durations (Astryx motion config `{fast: 150, medium: 300, ratio: 0.67}`, verified output: fast-min 100, fast 150, fast-max 225, medium-min 200, medium 300, medium-max 450):

| Token | Value | Use |
|---|---|---|
| `--duration-fast-min` | 100ms | Press-down state |
| `--duration-fast` | 150ms | Hover color shift, readout fade-out, reduced-motion crossfade |
| `--duration-fast-max` | 225ms | Toast enter |
| `--duration-medium-min` | 200ms | Pin landing |
| `--duration-medium` | 300ms | Sheet open and close, readout entrance |
| `--duration-medium-max` | 450ms | Not used. Defined by Astryx; any use fails G-TOKENS. |
| `--jp-duration-travel` | 700ms | Scene travel (geometry and camera). Engine token from the measured set. |
| `--jp-duration-ripple` | 900ms | LeafLink pin ripple (ambient) |
| `--jp-duration-word` | 2600ms | Server output node life (ambient) |

### 6.2 How travel obeys "nothing over 250ms"

Feedback is never over 250ms: the keymap item turns accent in 150ms and the lanes start moving on the next frame. Travel itself is 700ms of expo-out, which places 80% of the displacement in the first 210ms; the remaining 490ms is deceleration that never blocks input (a second key press mid-travel retargets from the current state, S03). So the perceived response is under 250ms and the full settle is a surface transition that never makes anyone wait. This is the deliberate reading of MOTION-LANGUAGE rules 1 to 4, recorded here so nobody "fixes" the 700ms.

**1.2.0 note (device run 2).** The camera curve and the 700ms stay. What read as a jarring camera re-adjust was three DOM and ring defects that landed at the moment the camera settled (the mark parked at the viewport center while the readout was display none and jumped 160px when it returned; the ring sat at the camera target, off the mark; a ring strength survived every morph as a frozen bulge), plus an empty window between camera arrival (about 0.17 of travel) and the text (0.55). The mark now looms in over `motion.morph.loom` (0.30 to 0.70), inside that window, at its final position, with the ring growing under it; see 6.7.

### 6.3 Motion signature per scene (the three must never be swapped)

| Scene | Signature | Mechanism |
|---|---|---|
| Server | **Lockstep** | Linear time, periodic. 32-lane warps pulse together; no easing on pulses. Rigid, metronomic, machine. |
| LeafLink | **Heartbeat cadence** | Event-driven at irregular intervals (seeded 1000 to 1600ms). Landing is a 200ms expo-out drop from 1.6x scale; ripple is 900ms `ease`. Human rhythm, never periodic. |
| SideQuests | **Spring and wander** | Critically underdamped spring, damping ratio 0.7 (one visible overshoot of about 4.6%, no oscillation after). Idle markers bob on a slow sine. The only scene allowed to overshoot. |

### 6.4 Reduced motion (`prefers-reduced-motion: reduce`, listener per standard-implementations)

| Normal | Reduced |
|---|---|
| Travel 700ms morph and camera | Cut: lanes and camera jump to target; DOM crossfade 150ms `ease` |
| Server pulses and nodes | Frozen: one static frame, pulses drawn at fixed phases, three node groups placed at rest |
| LeafLink event stream | Static: 6 pins and 3 completed routes placed; no new events |
| SideQuests bob and spring | Off; tapping a marker lights its trail instantly |
| Camera idle drift and parallax | Off |
| Render loop | `demand` mode: render only on resize, travel, or interaction |

Motion is never the only carrier of information: every fact on a scene is in DOM text.

### 6.5 Laws

1. Feedback at most 250ms, plain `ease`, color shift first. Hovers change color, never scale.
2. One dominant element per transition: during travel, the lanes. The DOM readout fades out before and in after, never during the dominant move.
3. Animate only `transform` and `opacity` in the DOM. In WebGL, animate uniforms only; geometry buffers are never rewritten per frame.
4. Ambient loops never block or delay input.
5. 60fps on phones is a requirement with a measured receipt, not a hope (S11).

### 6.6 SideQuests camera band (feedback-11 cut, ruling step 2a)

**Scope decision, stated explicitly.** The band applies to every frame of the SideQuests camera path, including init, restore, morph, walk, resize, and reduced motion. It is not scoped to the fully active scene only: the band is wide enough to admit morph transit, so no scope carve-out is needed and T-SQ-CAM-1 can assert every sampled frame without exception.

**Band.** Tokens `world.sidequests.camera.pitchMin` -75 and `world.sidequests.camera.pitchMax` -5. Pitch is the elevation of the camera forward vector above horizontal in degrees: negative looks down, flat top-down is -90. The band is a pitch interval only; yaw gets no band.

**W0 numbers behind the band.** Coarse rest pitch -64.49, coarse walk lean steepens to -69.62 (lean range 5.13 degrees), coarse morph server to SideQuests traverses -10.97 to -64.49, fine rest -54.55, steepest legitimate frame anywhere -69.62, flat top-down -90, headroom from steepest legitimate to flat 20.38 degrees. Fine endpoints derived from the token camera poses by the same geometry that reproduces every W0 coarse measurement exactly (coarse server -10.97, coarse LeafLink about -64.1, coarse rest -64.49, fine rest -54.55): fine server endpoint -10.22, fine LeafLink endpoint -56.98. Fine walk lean was not sampled in W0; if it steepens like coarse (5.13 degrees), fine walk sits near -59.68, and W7 must sample it.

**Margins.** Steep edge: steepest legitimate -69.62 to band edge -75 is 5.38 degrees of margin past the worst legitimate frame, and band edge -75 to flat -90 leaves 15.00 degrees of headroom, so no clamped frame reads as flat. Shallow edge: shallowest legitimate morph frame -10.97 (coarse server endpoint) to band edge -5 is 5.97 degrees of margin; fine server endpoint -10.22 to band edge -5 is 5.22 degrees. Both morph endpoint pairs sit inside the band on both variants (coarse: -10.97 and -64.49, -64.11 and -64.49; fine: -10.22 and -54.55, -56.98 and -54.55), so interpolation between endpoints cannot pass through top-down, and the clamp at the single final write point catches any overshoot.

**Yaw.** Yaw wraps through plus and minus 180 during morphs (W0: LeafLink morph spans -179.98 to -167.78, server morph spans -166.19 to 168.71 across the wrap), so yaw is not bandable as a single interval, and yaw is not the axis that produces the flat read. No yaw band is set.

**Rules.** No frame falls outside the band under the chosen scope. The camera initializes from the scene resting pose before the first draw; no default or identity camera may ever reach a frame. On pageshow with persisted state and on visibilitychange to visible, the camera restores from the resting pose or the last valid clamped state, never from a reset default. Where the clamp engages during a walk, the walk still finishes its trail; only the camera tilt stops at the band edge. The plan layout is ambient and is never presented flat from above.

### 6.7 Route morph (three phases inside travel 700ms)

All phases run inside `--jp-duration-travel` (700ms) with the signature curve unless stated. Times are fractions of travel and overlap on purpose. Values are proposed tokens (`motion.morph`, `morph.*`); the device run confirms them.

- **Release** (0.00 to 0.30): the outgoing signature loosens: Lockstep sync to free, heartbeat amplitude to 0, or wander damped. Gradient parameters start interpolating. Curve: signature.
- **Gather** (0.22 to 0.75, 1.2.0; was 0.15): the deflection ring grows from 0 to r at the target anchor, so lanes bend open around a circle. Silhouette pull (strength `morph.silhouettePull` 0.35 times the seeded pull scale, 6.11) draws lanes near the ring toward the logo alpha-mask contour, so the lanes visibly become the logo outline. Curve: signature for radius; `curve.track` for center travel. Gather starts after the readout swap (0.214), because the anchor is the placed mark (below), which exists from the swap commit; if an anchor is not resolved by Gather start, Gather begins at the first frame it resolves, and a ring never renders at an unresolved position.
- **Loom** (0.30 to 0.70, 1.2.0): the logo looms in at its final position: opacity 0 to 1, scale `morph.loomFrom` 0.92 to 1.00, while the camera settles and before the text. Curve: signature.
- **Reveal** (0.55 to 1.00): the incoming title and copy enter. The incoming signature starts at 1.00. The SideQuests spring overshoot is allowed only in its own arrival. Curve: signature.

**Anchor (1.2.0).** The ring and silhouette center on the placed hero mark, not on the camera target: the hero registers its screen center and two radii (`lanefield.setHeroAnchor`), and the engine ground-projects them through the current camera after the final camera write of every frame. The ring radius is the larger mark half-extent plus `hero.ringPadPx`, clamped to the mark center's clearance from the readout, the name zone, and the keymap, so the bulge never reaches them. The silhouette radius is the mark half-extent, so the mask square spans the mark. Field to project morphs depart from the pressed keymap item (ground-projected per frame) and travel to the anchor on `curve.track` over Gather.

**Rest invariant (1.2.0).** Outside a morph, ring and silhouette strength are zero unless a pulse or a GLITTERBOX hold is active. Ring fields are engine owned: `setParams` no longer writes them into the travel target, and travel end zeroes both strengths.

**No categorical snaps (1.2.0).** Light mode crossfades from the outgoing to the incoming mode over the param curve (`uLightModeFrom`, `uLightMix`) instead of switching at the midpoint. Both silhouette masks load once after the first frame and are uploaded before use, so no morph swaps a mask in mid-flight.

**Other directions.** Project to server or whoami: the logo recedes (scale 1.00 to `morph.recedeTo` 0.96, opacity to 0, window `motion.morph.recede` 0 to 0.20, 1.2.0; was 0 to 0.40, which ran past the readout swap at 0.214 where the mark unmounts, so the mark popped out), the ring collapses (0.20 to 0.80), and Lockstep or Quiet re-forms (0.50 to 1.00). Project to project (for example LeafLink to SideQuests): logo A recedes, the ring shrinks to `morph.ringBreath` 0.6r and regrows to r (a breath), the ring travels between anchors on `curve.track` if the anchors differ, and logo B looms in during Reveal.

**Controller rules.** State is snapshot, target, and start time. Navigate takes a snapshot of the current interpolated values, sets the target and start time, and pushes history immediately, so back works mid-flight. The previous morph is discarded, never queued (retargeting). Direction follows keymap order 1, 2, 3, W; history back and forward use the same path with direction from that order. Outgoing title and copy exit over 150ms at t = 0. The incoming title arrives at Reveal start. Focus moves to the new H1 at Reveal start, under the existing focus condition (only if focus was inside the old readout or on the keymap), and never while the Contact sheet focus lock is active. No per-lane start-time stagger: all lanes start at t = 0 and vary only in path, never in start time.

**Hero descriptors per route.** server: kind field, ring 0, mark none. leaflink: kind mark, anchor at the hero anchor, ring r, mark leaflink. sidequests: kind mark, anchor at the hero anchor, ring r, mark sidequests. whoami: kind field-quiet, ring 0, mark none.

**Reduced motion.** All parameters jump at t = 0, the DOM crossfades over 150ms, the ring jumps, and the GIF shows its static frame. No intermediate frame exists outside the camera band.

**Degrade path.** If p95 frame time during a morph exceeds budget for 30 consecutive frames, silhouette pull drops to 0 for the rest of the session. Lanes, gradient, and ring stay. This is logged to the dev HUD.

### 6.8 Hero motion

**Placement.** Outside the name clear zone, the readout clear zone, and the keymap. Minimum hero size (`hero.minSizePx`) keeps 375x667 at document height equal to viewport height. The displayed rectangle must also satisfy the brand area cap (section 3.5); W6 fits each mark inside the cap from its aspect ratio.

**Placement (1.2.0).** Computed once per page configuration in the readout swap commit (travel conceals the readout with visibility, inert, and aria-hidden, so its rect exists), against the name zone, the readout, the keymap, and the SideQuests marker tap targets at their resting projection. Never re-tracked per frame; recomputed only on viewport resize.

**Passive motion.** LeafLink (1.2.0): event driven, never periodic (section 6.3). Each LeafLink match that lands beats the mark once (`hero.beatScale` 1.015 over `motion.ms.medium`); the visitor's own match lands with `hero.landBeatScale` 1.04. The shipped periodic beat contradicted 6.3 and is removed. SideQuests: drift along the wander path, settling with the existing spring. Both marks carry `hero.landBeatScale` headroom in the area cap.

**Active motion.** Pointer or touch-drag tilts the plane within `hero.tiltMaxDeg` 8 and shifts the lane depth bands for parallax. A tap on the mark is the page verb (1.2.0): LeafLink drops an offer at the map center, SideQuests walks the next open trail, with an immediate half-strength pulse from the tap point as feedback. No gyroscope, because it needs a permission prompt on iOS.

### 6.9 Lane field variant B

Variant B values (all proposed, token `lanefield.variance`): three depth bands, with speed multipliers 0.85, 1.00, 1.15 and signal alpha multipliers 0.55, 0.80, 1.00; lane length variance plus or minus 18 percent; seeded phase jitter; density clusters that move with the scene signature. Rules: Lockstep keeps zero phase jitter, so it stays in lockstep. Lanes enter and leave only at viewport edges; none appears or vanishes in place. The established cadence stays. Variants A and C are not built; no dev switch exists for them.

### 6.10 Performance budget

Budget, held on every route and during morphs (tokens `perf.*`): p95 frame time 16.7ms or less, p99 33ms or less, no long task over 50ms during a morph. Measurement: a dev-only HUD reading requestAnimationFrame deltas, the Safari Web Inspector timeline over a cable, normal mode and Low Power Mode, with whatever frame rate Low Power Mode produces recorded rather than assumed. Device run 2 measures against this budget; if a budget number is wrong, it changes here with the measurement, never by quiet lowering.

### 6.11 Seeded entropy (1.2.0)

One 32-bit session seed drives every random motion choice: `?seed=<uint32>` (token `entropy.seedParam`) replays a run exactly; otherwise one value from `crypto.getRandomValues`. The seed is read once at app boot, before the router's first `pushState` drops the query. Draws are counter based: draw(channel, n) is a pure hash of (seed, channel, n) (splitmix32 finalizer), so a value depends only on the seed and how many draws that channel has made, never on frame timing. Channels: morph bow, morph swirl, morph pull, pulse swirl, glitter swirl. `Math.random` is not used for motion. The layout seed `world.seed` is separate and never changes (layout hash, LeafLink sim sequence, T-LL-2 stay fixed).

| Parameter | Range | Applied |
|---|---|---|
| Camera bow | signed, magnitude up to `entropy.scene.<to>.bowWorld` (server 0, LeafLink 1.5, SideQuests 2.5, scatter 2.0) | Lateral ground translation of camera position and target, times sin(pi times the signature-eased progress): zero at both ends, rides the camera's own curve, never changes pitch |
| Ring swirl | signed, up to `entropy.scene.<to>.swirl` (server 0, LeafLink 0.35, SideQuests 0.7, scatter 0.9) | Tangential share of the ring push on the same falloff, so the swirled push stays C1 and zero outside the ring |
| Pull scale | `entropy.pullScale` 0.85 to 1.15 | Multiplier on `morph.silhouettePull` |
| Pulse swirl | signed, up to `entropy.pulseSwirl` 0.6 | Ring swirl for taps and land pulses |
| Glitter swirl | signed, up to `glitter.swirl` 0.9 | Swirl direction for a GLITTERBOX hold |

Per page variation is keyed by the destination, so each page keeps its signature: server arrives rigid (Lockstep, no bow, no swirl), LeafLink moderate, SideQuests widest. Reduced motion disables entropy: every draw takes its neutral value (bow 0, swirl 0, pull scale 1), identical for every seed. Cost is uniform-only (one float uniform, `uRingSwirl`, and a ground offset on the camera), no new draw call, so the 16.7ms p95 budget is unchanged.

### 6.12 Stage grammar and camera tracking (1.2.0)

One interaction grammar for both project pages (src/motion/stage.ts): **subject** (the page verb started: the visitor's LeafLink match routing, a SideQuests walk) recedes the mark (LeafLink 1.3.0 exception: no recede, so the logo stays visible on dot taps and dots sit behind it) and, on coarse viewports, pans the camera so the subject (the destination: the request node, the trail's marker) sits at a focus spot just above or below the mark, its center `size.coarseMinTargetPx` plus `hero.ringPadPx` plus the mark's motion margin from the mark edge. Only a spot whose straight pan never sweeps the subject under the mark counts (T-HERO-BAND-WALK); of those, the nearest; with none, no pan. The pan holds that spot for the whole walk, so the drawing head travels toward a marker already in view; **land** (route reached the request, trail claimed) sends a pulse from the subject's screen position into the mark and looms the mark back with one land beat; **beat** (any LeafLink match landing) beats the mark once; **release** returns the camera. The pan is a ground translation (pitch never changes, the camera band is untouched), damped with `focus.halfLifeMs` 200 and capped at `focus.maxPanWorld` 20. Fine viewports never pan: the whole plan and map are in view, and the S07 lean stays. On coarse, the lean yields to the pan. Reduced motion: no pan, no recede, no pulse; the verb still works.

### 6.13 GLITTERBOX (1.2.0)

Press and hold the lane field for `glitter.holdMs` 500 (the LeafLink tap limit, so taps keep their meaning), or hold the g key, and the drawn layout weights blend toward the scatter layout up to `glitter.maxWeight` 0.85 while a swirled ring of `glitter.ringRadiusPx` 120 follows the pointer; release re-forms the scene over `motion.ms.travel` on the signature curve, reaching exactly zero (no exponential tail). It never changes the route, the readout, the travel weights, or any copy, and it is off under reduced motion, while a sheet is open, and during travel. Lanes stay lanes (each still one of the 6,144 cores); section 10's particle rule is met because the mode is opt-in and draws nothing but the existing lane field.

### 6.14 Guestbook (1.5.0)

The guestbook is a sheet in the router's sense (S03 section 2: sheets are not routes): hash `#guestbook` over the current scene, opened from one control inside the Contact sheet. No route, no tab, no keymap item. It has no card and no white surface: the lane field is the sheet. Copy is S09 `C-GB-*`.

**Choreography (camera, after the oklou boot: push-in, lock-in, pull-back).**

| Beat | When | Camera | Lanes | Curve |
|---|---|---|---|---|
| Open | `motion.ms.travel` 700 | Dolly toward the target by `guestbook.camera.dollyIn` of the target distance, seeded yaw up to `guestbook.camera.yawDeg`, seeded rise up to `guestbook.camera.riseFrac` | Lanes inside `guestbook.part.radiusFrac` part outward by `pushFrac` and move to a per-lane seeded height up to `depthFrac` (y, toward or away from the camera); the three depth bands start `guestbook.ms.bandStagger` apart | Lusion main |
| Type | each character, `guestbook.ms.letter` 400 in, `letterOut` 300 out | Held | One lane per character bends toward the camera (bend weight `(k / 7)^guestbook.mark.bendPower`) to a seeded height in `heightFrac`, on a baseline with seeded wobble `wobbleFrac`; the glyph rides the lane tip at its true depth. Until lock-in every letter lane carries seeded noise `noiseFrac`, redrawn every `guestbook.ms.noiseStep` | Lusion main |
| Lock in | `guestbook.ms.lockIn` 400 | Push in a further `pushIn` | Noise goes to zero, heights snap to the sign seed's values, glyphs resolve left to right: noise becomes identity | Lusion soft |
| Hold | `guestbook.ms.hold` 300 | Held | Held | none |
| Pull back | `motion.ms.wordCadence` 1600 | Out to `pullBack` (past rest, wide), seeded drift up to `driftYawDeg` | The mark settles at a seeded offset in `settleRadiusFrac` of the part radius and a seeded height scale in `settleScale`; the part relaxes to `part.residual` | Lusion soft |
| Close | `motion.ms.travel` 700 | Back to rest | Every guestbook offset returns to zero | Lusion main |

The well (part center and mark baseline center) is the scene camera's ground target, where the lanes are. On open the camera's principal-point shift moves with the dolly from the scene value to `guestbook.shiftNdc` (the well rises to the upper middle of the viewport, above the prompt), and the dolly translates the camera along the ray to the well. The readout and hero are hidden while the sheet is open, so the mark has the field to itself. All world fractions are fractions of the camera to well distance at open, so the same mark reads the same size on every scene; letter spacing shrinks when needed so the dollied-in mark fits `guestbook.fitWidthFrac` of the viewport width. Two curves only, both from the Lusion extract (`guestbook.easeMain` `0.35, 0, 0, 1`; `guestbook.easeSoft` `0.4, 0, 0.1, 1`); no spring. Motion is transform: camera, lane positions, glyph translate and perspective scale. The DOM panel moves on translateZ under perspective, never on opacity.

**Part per scene (1.8.0).** The part (push and seeded height) is scaled by `guestbook.part.layoutScale` for the scene under the sheet: 1 on server, 0 on leaflink, sidequests and scatter. On the flat ground scenes the camera looks down at the plan from close, so the part read as one huge ring that swallowed the scene (the bulge in Justin's Nov 12 iPhone screenshots, critique brief item 4); there the lanes stay where they are and the mark rides them, with the same dolly, letters, lock-in and pull-back. Server keeps the part, where the lanes are a horn in depth and it reads as a part.

**Phone frame (1.6.0). Every guestbook measurement reads the screen the visitor actually sees, so the mark and the panel land in the same place in Safari and in in-app browsers. The field's projection uses the canvas's own CSS box (it is drawn at `100vw` by `100dvh`), never `innerWidth` and `innerHeight`, which disagree with it on phones. The free region is the visual viewport (`window.visualViewport`, falling back to the layout viewport) above the panel's top edge; the well lands at the free region's center offset by `guestbook.shiftNdc` in that region's NDC, and fit width (`fitWidthFrac`) is a fraction of the free region's width. The director recomputes this on every frame while the visitor writes; from lock-in on the frame holds, so the lock-in, settle and pull-back camera is exactly as before. When it changes (the keyboard opening, a toolbar collapsing) the shift eases to the new value over `guestbook.ms.panel` on the Lusion main curve, never a jump.

**Keyboard.** While the sheet is open the panel listens to visual viewport resize and scroll. When the keyboard covers the bottom of the layout viewport, the panel lifts on translateY so its bottom edge sits `--jp-gutter` above the keyboard (lift = covered height + gutter - the panel's resting gap to the layout bottom) and both prompt lines and the lock in pill stay fully visible. The lift moves on the panel transition (`guestbook.ms.panel`, Lusion main). The focused prompt line carries an inset rule of `guestbook.focusRulePx` in `accent` along its bottom edge; unfocused lines carry a 1px `hairline`. No outline box, no fill.

**Contrast.** The lanes behind the panel dim while the sheet is open, so the field itself dims and no surface is drawn: the lane shader multiplies lane alpha by `1 - guestbook.dim.amount` inside the panel's box grown by `guestbook.dim.padPx`, feathering back to full over `guestbook.dim.featherPx` outside it (a rounded falloff, not an edge). Letter lanes dim too where their bodies pass behind the panel (an undimmed letter lane crossing the text measured 2.2:1); the mark itself sits above the panel in the free region, so it is never dimmed. The dim rides the panel's on-screen box every frame (it follows the lift and the depth move) and its amount moves with the panel on open and close. Floor: typed text, placeholder, seed readout and done copy each hold at least 4.5:1 against the brightest pixel behind them, measured over the densest lanes at 390px; the placeholder meets the same floor as typed text. No card, no white surface, no gradient, no shadow.

**Scene nodes.** The server scene's nodes (S05, on lanes per 6.15) hide while the sheet is open (they fade out over `motion.ms.fast` like a travel pause, their lanes relaxing with them, and do not spawn; under reduced motion they clear at once, since no loop carries a fade), so the mark has the field to itself; they resume on close. T-GB-6 covers the nodes, the dim box, the keyboard lift and the focus rule under reduced motion.

**Entropy.** Two fresh 32-bit seeds per sign: an open seed at open (part heights, camera yaw and rise, baseline wobble, typing noise) and a sign seed at lock-in (lock-in heights, settle offset and scale, pull-back drift, and the hex shown in the seed readout). Source: `crypto.getRandomValues`. With `?seed` in the URL (6.11), each seed is instead `hash32(sessionSeed, channel, n)` for channels `guestbook-open` and `guestbook-sign`, so a run replays. Values derive from a seed by `hash32(seed, param, index)`.

**Engine cost.** One extra RGBA32F data texture the size of the activity texture (256 by 24, 98,304 bytes): per lane xyz offset plus a bend flag, written only while the guestbook moves. Twelve uniforms (that texture, bend power, part center, radius, push, depth, seed, band progress, letter color, and from 1.6.0 the dim box, dim amount and dim feather). Same mesh, same draw call, same WebGL context. Letter lanes skip the ring and silhouette so the glyph and the lane tip agree. Until lock-in, letter lanes and glyphs draw in `signalHot` on void and field, `ink` on paper.

**Mark color (1.8.0).** Every signature gets its own color from a set pool, so no two marks look alike. At lock-in the sign seed picks one entry of `guestbook.mark.colorPool` for the current regime, `pool[hash32(signSeed, color, 0) mod pool length]` (`dark` on void and field, `paper` on paper), and the letter lanes and glyphs move to it over `guestbook.ms.lockIn` on the Lusion soft curve, with the heights. Every pool entry is a name of an existing color in section 12, so no new hue exists: the pool is the blue family and the two chalks on dark ground, the ink family on paper. Same sign seed, same color. Close and sign again return to the default color. Reduced motion takes the color at once.

**Reduced motion.** No camera move, no noise, no part motion: the field renders once per change with the mark at its seeded resting position and height. Same content, same 3D mark.

**No WebGL.** The sheet works without the field: the name, line, lock in, and storage are DOM; the mark has no 3D.

**Storage.** Decided by Justin, 2026-11-10: browser-local only. Signatures are stored in this browser through one named hook, `storeSignature` in `src/lib/guestbookStore.ts`, key `guestbook.storageKey`, at most `guestbook.ledgerMax` kept, and the sheet says so (`C-GB-LOCAL`).

### 6.15 Server nodes on the lanes (1.8.0, supersedes the 1.7.0 words)

The server scene shows no words. Justin's pick, 2026-11-12 (critique brief item 3): nodes only, no stack names anywhere in the scene. This replaces the 1.7.0 rule, which formed the stack words from lanes.

Every `wordCadence` one node group leaves the horn. A group is `world.server.nodes.count` nodes (the count is seeded), each the tip of its own lane, the same lane carry as the guestbook mark (6.14): at spawn each node takes the nearest free lane by tip (3D distance from the lane's resting tip to the node's spawn point at the focus); a lane is never shared by two nodes on screen and never taken while the guestbook holds it. Each frame that lane's offset bends its tip from rest to the node's point, `tip = rest + bend x (point - rest)`, with the guestbook bend weight `(k / 7)^guestbook.mark.bendPower` along the lane, root anchored, skipping the ring, pull and part. A node is a flat disc of radius `nodes.radius` world units, billboarded, sitting exactly on the bent tip at its true depth: a point where the line ends, never text.

Entropy: each group has a seed, `hash32(sessionSeed, server-node, n)` for the n-th group (6.11, so `?seed` replays it). The seed decides the count, each node's offset from the group's drift point (in the camera's right and up plane, inside a disc of `nodes.spreadFrac` of the drift length, no two nodes closer than `nodes.minGap` world units, drawn by seeded rejection so the group never crowds), and the group's color: one entry of `guestbook.mark.colorPool.dark` (the server is void), the same pool and the same rule as the guestbook mark. Groups drift by `wordDrift` from the focus toward the viewer (y sign alternates per group), as the words did.

Bend is the group's opacity: 1 while lit, then down with the fade after `world.server.nodes.fadeFrom`, so the lane draws its node back into the horn and is exactly at rest when the group ends. No lane ever snaps. The lane wears the group's color, and its alpha lifts toward the tip (`max(alpha, u)`), both by the group's opacity, so lane and node fade together while the lockstep pulses keep running under them. Pause, travel exit and the guestbook (6.14) fade the nodes over `motion.ms.fast` with their lanes relaxing, then release every node lane. Reduced motion: three groups sit at rest at their `nodes.reducedAt` points, lanes bent and tinted there.

Engine: node lanes share the guestbook offset texture (texel alpha 1 is a guestbook letter lane; alpha 2 plus the slot index is a node lane, slot below `world.server.nodes.pool`) and one `vec4` tint per slot (color, opacity), the slot count passed to the shader as a define. One lane draw call, unchanged. Nodes are plain three.js meshes, one per node, at most `nodes.pool` times the top of `nodes.count`; no font, no glyphs.

## 7. Component signatures

Named for their role on this site. Each has at least two variants or it is plain on purpose.

| Component | Role | Astryx base | Variants |
|---|---|---|---|
| `Lanefield` | The 6,144-lane world (WebGL) | none, authored (S02) | layouts: server, leaflink, sidequests, scatter |
| `Keymap` | The only navigation, one TUI line at the bottom edge | `Kbd` for key glyphs, `useHotkeys` for bindings | fine pointer (keys shown) / coarse pointer (keys hidden, 44px targets); item states: idle, hover, active |
| `Readout` | A scene's DOM text block | none, plain HTML on tokens | `server` (no container, left column), `leaflink` (paper.raised slip, 0 radius, hairline ring; 1.3.0 order: H1, P1, rule, facts, stack, code), `sidequests` (1.3.0: field.raised plate, 0 radius, 1px dashed chalk.2 edge flush on the plate) |
| `WhoamiSheet` | Education and campus roles | `BottomSheet` (purpose info, height hug) | open, closed |
| `ContactSheet` | Email, copy, links | `BottomSheet`, `Button`, `Link` | open, closed; copy idle, copied, failed |
| `CopyConfirm` | Copy result | `Toast` via `useToast` | info "Copied." / error "Copy failed. The address is selected." |
| `QuestMarker` | SideQuests marker (WebGL plus DOM button twin) | none in WebGL; DOM twin is a `Button` ghost (transition none) | open, lit, claimed; fine: twins are the accessible controls; coarse (1.3.0): twins are the accessible controls (the tutorial row is cut; device run 3) |
| `BrandHero` | Project hero mark (LeafLink, SideQuests) | none; `picture` markup over the lane field | F0 animated GIF, F1 first-frame PNG, F2 text mark, F3 image without deflection |

Theme component overrides (in `themes/lane/laneTheme.mjs`, legal keys verified with `astryx theme targets <Name> --json` in S01): Button `base` radius `--radius-element`, no shadow, label weight 700; Button `variant:primary` background `--color-accent`, color `--color-on-accent`; Kbd `base` background transparent, hairline ring, radius 2px; BottomSheet `base` background `--jp-raised`, radius 0 on the top corners (a TUI pane, not a phone card), no shadow.

**Toast layer decision.** Toasts render in the top-most open layer. W0 confirmed the cause is top-layer paint order: the Contact sheet is a native dialog opened with showModal, the toast viewport is a manual popover shown earlier, and the later-opened dialog paints above the earlier-shown popover because BottomSheet never registers a modal outlet, so the toast host is never rehosted above the dialog. That is not a z-index contest, so no `layer.*` tokens are added: the W2 fix is portal rehost on modal open or outlet exposure for the sheet, and W2 decides between those two. If W2 finds a stacking-context cause instead, it records that finding and revisits this decision rather than quietly adding tokens.

## 8. World constants (the Lanefield)

All geometry is in world units (1 unit reads as 1 meter). Exact values are in section 12 under `world`. Summary:

- Lane count 6144. Points per lane 8. Segments per lane 7. Instances 43,008. Layout count 4.
- Layout texture: RGBA32F, 256 by 768 texels. Texel index `lane * 32 + layout * 8 + point`. RGB position, A class id.
- Activity texture: RGBA32F, 256 by 24 texels, one texel per lane.
- Lane width is in CSS pixels, per class. Lines thinner than 1 device pixel are drawn at 1 device pixel with alpha scaled by their true width (no shimmer).
- Camera poses per scene and per breakpoint, principal-point shift so the subject sits beside the readout.

## 9. Imagery and assets

No photos, no illustrations, no icons except Astryx's built-in external-link indicator on `Link isExternalLink`. No logos of Ollama, Docker, Tailscale, NVIDIA or anyone else: product names appear as text only. No map tiles, no real street data, no Leaflet marker graphic. Every visual is procedural from S02, S05, S06, S07.

**Brand-marks exception (the only logos on the site).** The two project marks ship as real GIF assets from Codeberg, pinned by commit SHA and recorded with sha256 in a manifest (W3 owns the pipeline). SideQuests hero: `sidequests.gif` from opensourcery/sidequests (branch dev, app/assets/sidequests.gif), 1920x538, 4 frames, 42591 bytes. LeafLink hero: W3 confirms whether `leaves.gif` (bon3head/LeafLink, branch main, app/assets/leaves.gif, 305x400, 50 frames, 828040 bytes) or `logo.png` (same repo, public/logo.png, 1024x1024 RGBA, 174622 bytes) is the shipped mark; `logo.png` is also the reduced-motion PNG and the F1 fallback source for LeafLink. `sidequests-alpha.gif` is DO NOT USE: it adds the word "alpha" below the logo and stays reference only. The hero holds exactly one mark per project route. Feedback-05 and feedback-08 are not placed on any page this round; circuit.gif and gears.gif are creative liberty only, never heroes.

**Delivery markup (per project hero).** A `picture` element: a `source` for reduced motion pointing at the first-frame PNG, and an `img` pointing at the GIF with the approved alt text, explicit width and height, `decoding="async"`, and `data-brand-mark` set to the project. The first-frame PNG is extracted from the GIF at build time and is identical to GIF frame 0. The PNG renders first, at Reveal. The GIF loads behind it and replaces it on `img.decode()` resolve, with no fade, since an identical frame means no visible onset. A script listener on reduced motion forces the PNG at runtime even if `picture` does not re-evaluate.

**Fallback chain (each level is tested).** F0: the GIF decodes and its natural size matches the manifest, so the animated GIF shows. F1: network or decode error, size mismatch with the manifest (truncated file), or not decoded within `brand.decodeTimeoutMs` 4000 (proposed), with no retry loop, so the first-frame PNG shows, static. F2: the PNG also fails, so a text mark shows: the approved alt text's project name in Commit Mono 700, signal color, sentence case, centered in the ring. Lanes still deflect, so the hero still exists. F3: WebGL unavailable (the existing field fallback), so the F0, F1, or F2 image shows without deflection, over the flat field.

**Build-time checks.** Frame count, loop duration, per-frame delays, dimensions, transparency flag, edge fringe (near-white pixels next to transparent ones), the union of all frame palettes (the hue fingerprint), and byte size. If the GIF is matted against white, W3 re-mattes its edge pixels per frame against transparency; T-ASSET-4 must pass on the navy field, or W3 stops.

**Budgets (proposed).** 900 KB transferred per GIF (token `brand.gifMaxBytes` 900000) and decoded memory (width times height times 4 times frames) of 48 MB or less (token `brand.gifMaxDecoded` 48000000). If over budget, first run lossless `gifsicle -O3`, then resize to displayed size times 3 DPR, keeping the same GIF and the same animation. If still over budget, stop and report. Switching format away from GIF needs Justin's yes, because he asked for the actual GIFs. W0 measured budgets: sidequests.gif 42591 bytes transferred and 16527360 bytes decoded (15.8 MB); leaves.gif 828040 bytes transferred and 24400000 bytes decoded (23.3 MB); both inside budget.

**Alt text rule.** Alt text is the project name plus what the mark depicts, 12 words or fewer, never starting with the words "image of". The final alt strings are drafted in W0 section 6 and finalized by W3; W1 writes only this rule. W0 drafts, recorded here as drafts and not as final copy: "SideQuests logo, green handwritten wordmark with a star"; "LeafLink logo, animated green maple leaf"; "LeafLink logo, green leaves forming a smile". The same string drives the F2 text mark, so the alt text physically appears in the theme when the image fails. No other copy changes in this round.

## 10. What this system never does

Gradients in chrome. Glow without a source. Glass or blur. Drop shadows. Cards, nested or not. Eyebrows. All caps. Stat grids. Counters of fake activity. "Live" or "online" indicators of any kind. Decorative particle fields (every drawn element is a lane, a pulse, a pin, a marker or a word, and each encodes something). Cursor trails. Scroll-jacking. Bounce on color or opacity. Orthogonal-routed lines, pads, silkscreen labels or designators (the PCB direction is dead and the lane field must never read as a circuit board: lanes are parallel, flat streets, or curves; they never turn 90 degrees in a routed pattern in the Server scene).

## 11. Astryx mapping (what the substrate supplies and what overrides it)

Built with `@astryxdesign/cli@0.7.1` and `@astryxdesign/core@0.7.1`. `defineTheme` from scratch (no `extends`), so nothing of the stock neutral theme ships untouched. A probe build of this mapping on 2026-10-30 produced 84 tokens, 11.3 KB CSS, zero warnings.

| Astryx token | Value here |
|---|---|
| `--color-accent` | `[ink, signal]` = `['#0E3565', '#7BB5F8']` |
| `--color-on-accent` | `['#F3F0EA', '#0A0C0F']` |
| `--color-text-accent`, `--color-icon-accent`, `--focus-outline-color` | same as accent |
| `--color-accent-muted` | `['#0E35651F', '#7BB5F829']` |
| `--color-background-body` | `[paper.ground, void.ground]` |
| `--color-background-surface`, `-card`, `-popover` | `[paper.raised, void.raised]` |
| `--color-text-primary` | `[paper.text, void.text]` |
| `--color-text-secondary` | `[paper.text2, void.text2]` |
| `--color-border` | `['#14161A26', '#E6E8EA21']` |
| `--color-error` | `[error.light, error.dark]` |
| `--shadow-low`, `--shadow-med`, `--shadow-high` | `none` |
| `--ease-standard` | `ease` |
| typography | Commit Mono for body, heading, code; scale base 16 ratio 1.25 |
| radius | base 2, multiplier 1 |
| motion | fast 150, medium 300, ratio 0.67 |

The `field` regime is a site-level override on `[data-regime=field]` that re-points `--color-background-body`, `-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-border` to field and chalk values (Astryx has two modes; this site has three regimes; the third is layered after the theme in `@layer jp-regime`).

## 12. The token block (machine-readable, authoritative)

```json design-tokens
{
  "version": "1.8.0",
  "color": {
    "void": {
      "ground": "#0A0C0F",
      "raised": "#15171B",
      "text": "#E6E8EA",
      "text2": "#A7ABB0",
      "accent": "#7BB5F8",
      "hairline": "#E6E8EA21"
    },
    "paper": {
      "ground": "#F3F0EA",
      "raised": "#E6E2DC",
      "text": "#14161A",
      "text2": "#4E5359",
      "accent": "#0E3565",
      "hairline": "#14161A26"
    },
    "field": {
      "ground": "#10294E",
      "raised": "#183662",
      "text": "#F5F1E9",
      "text2": "#B6C6D7",
      "accent": "#7BB5F8",
      "hairline": "#F5F1E929"
    },
    "signal": "#7BB5F8",
    "signalDim": "#4F77A5",
    "signalHot": "#D4E7FC",
    "ink": "#0E3565",
    "inkTint": "#C9DCEA",
    "chalk": "#F5F1E9",
    "chalk2": "#B6C6D7",
    "errorDark": "#F47B74",
    "errorLight": "#B02A2D",
    "accentMutedLight": "#0E35651F",
    "accentMutedDark": "#7BB5F829"
  },
  "contrastPairs": [
    ["void.text", "void.ground", 4.5],
    ["void.text2", "void.ground", 4.5],
    ["signal", "void.ground", 4.5],
    ["signal", "void.raised", 4.5],
    ["signalDim", "void.ground", 3.0],
    ["void.text", "void.raised", 4.5],
    ["paper.text", "paper.ground", 4.5],
    ["paper.text2", "paper.ground", 4.5],
    ["paper.text2", "paper.raised", 4.5],
    ["ink", "paper.ground", 4.5],
    ["ink", "paper.raised", 4.5],
    ["ink", "inkTint", 4.5],
    ["chalk", "field.ground", 4.5],
    ["chalk2", "field.ground", 4.5],
    ["chalk", "field.raised", 4.5],
    ["chalk2", "field.raised", 4.5],
    ["signal", "field.ground", 4.5],
    ["void.ground", "signal", 4.5],
    ["paper.ground", "ink", 4.5],
    ["errorDark", "void.ground", 4.5],
    ["errorLight", "paper.ground", 4.5]
  ],
  "type": {
    "family": "\"Commit Mono\", \"Commit Mono Fallback\", ui-monospace, \"SF Mono\", Menlo, Consolas, monospace",
    "fontPackage": "@fontsource/commit-mono@5.2.5",
    "weights": [200, 400, 700],
    "preloadWeight": 400,
    "scale": {
      "base": 16,
      "ratio": 1.25
    },
    "display0": {
      "size": "clamp(3.5rem, 9.5vw, 8rem)",
      "weight": 400,
      "leading": 0.95,
      "tracking": "-0.04em"
    },
    "display1": {
      "size": "clamp(2.25rem, 6vw, 4.5rem)",
      "weight": 700,
      "leading": 1.0,
      "tracking": "-0.03em"
    },
    "key": {
      "size": "13px",
      "weight": 700
    },
    "minSizePx": 13,
    "measureCh": 52
  },
  "space": {
    "gutterPx": {
      "base": 16,
      "from640": 32,
      "from1280": 48
    },
    "keymapHeightPx": {
      "coarse": 44,
      "fine": 36
    },
    "readoutMaxWidthPx": 520
  },
  "radius": {
    "base": 2,
    "multiplier": 1,
    "used": ["--radius-none", "--radius-element"]
  },
  "size": {
    "elementPx": {
      "sm": 32,
      "md": 36,
      "lg": 44
    },
    "coarseMinTargetPx": 44
  },
  "focus": {
    "widthPx": 2,
    "offsetPx": 3
  },
  "motion": {
    "easePlain": "ease",
    "easePlainBezier": [0.25, 0.1, 0.25, 1],
    "easeSignature": [0.23, 1, 0.32, 1],
    "astryxMotion": {
      "fast": 150,
      "medium": 300,
      "ratio": 0.67
    },
    "ms": {
      "fastMin": 100,
      "fast": 150,
      "fastMax": 225,
      "mediumMin": 200,
      "medium": 300,
      "travel": 700,
      "ripple": 900,
      "word": 2600,
      "wordCadence": 1600,
      "readoutInDelay": 400
    },
    "spring": {
      "dampingRatio": 0.7,
      "frequencyHz": 3.2
    },
    "leaflinkEventIntervalMs": [1000, 1600],
    "feedbackMaxMs": 250,
    "morph": {
      "release": [0.0, 0.3],
      "gather": [0.22, 0.75],
      "reveal": [0.55, 1.0],
      "loom": [0.3, 0.7],
      "recede": [0.0, 0.2]
    }
  },
  "world": {
    "laneCount": 6144,
    "pointsPerLane": 8,
    "segmentsPerLane": 7,
    "layouts": ["server", "leaflink", "sidequests", "scatter"],
    "layoutTexture": {
      "width": 256,
      "height": 768,
      "format": "RGBA32F"
    },
    "activityTexture": {
      "width": 256,
      "height": 24,
      "format": "RGBA32F"
    },
    "seed": 20271201,
    "dprCap": {
      "fine": 2.0,
      "coarse": 1.75,
      "floor": 1.0
    },
    "server": {
      "sm": {
        "count": 48,
        "cols": 8,
        "rows": 6,
        "pitch": [0.95, 0.85]
      },
      "partition": {
        "perSm": 4,
        "cols": 2,
        "rows": 2,
        "pitch": [0.27, 0.23]
      },
      "lane": {
        "perPartition": 32,
        "cols": 8,
        "rows": 4,
        "pitch": [0.03, 0.05]
      },
      "zStraight": [-24.0, -2.0],
      "convergeZ": [0.4, 2.2],
      "convergeMix": [0.5, 0.92],
      "focus": [0.0, 0.0, 2.2],
      "classes": {
        "lane": {
          "widthPx": 1.0,
          "alpha": 0.08
        },
        "converge": {
          "widthPx": 1.0,
          "alpha": 0.08
        }
      },
      "fire": {
        "warpSize": 32,
        "speedLengthsPerSec": 0.55,
        "sigma": 0.05,
        "dutyCycle": 0.6,
        "periodSec": [3.0, 7.0],
        "sweepPeriodSec": 6.0,
        "peakAlpha": 1.0
      },
      "wordDrift": [-1.0, 0.5, 1.0],
      "wordSpawnOffsetZ": 0.2,
      "nodes": {
        "pool": 4,
        "count": [3, 6],
        "radius": 0.035,
        "segments": 16,
        "spreadFrac": 0.22,
        "minGap": 0.12,
        "fadeFrom": 0.55,
        "reducedAt": [0.2, 0.5, 0.8]
      },
      "fog": [7.0, 30.0]
    },
    "leaflink": {
      "extent": [40.0, 40.0],
      "lattice": {
        "nodes": 33,
        "pitch": 1.25,
        "jitter": 0.28
      },
      "edgeDropFraction": 0.12,
      "diagonalAddFraction": 0.04,
      "arterialEvery": 8,
      "classes": {
        "local": {
          "widthPx": 1.2,
          "alpha": 0.3
        },
        "arterial": {
          "widthPx": 2.2,
          "alpha": 0.55
        },
        "route": {
          "widthPx": 3.0,
          "alpha": 1.0
        }
      },
      "pins": {
        "maxPins": 24,
        "maxMatches": 6,
        "matchMaxHops": 9,
        "radiusWorld": 0.32,
        "holdMs": 4000,
        "fadeMs": 600,
        "dropScaleFrom": 1.6,
        "rippleScaleTo": 3.0,
        "rippleAlphaFrom": 0.4,
        "requestFraction": 0.55,
        "minSpacingHops": 2,
        "haloScale": 2.2,
        "staleMs": 20000,
        "ringInner": 0.62,
        "rippleInner": 0.86,
        "radiusPx": {
          "fine": 7,
          "coarse": 8
        },
        "firstEventAfterMs": 300,
        "reducedPins": 6,
        "reducedMatches": 3,
        "visitorRequestHops": [3, 6]
      },
      "routeSpeedUnitsPerSec": 6.0,
      "tapMaxMovePx": 6,
      "tapMaxMs": 500,
      "arterialJitterScale": 0.5
    },
    "sidequests": {
      "extent": [36.0, 28.0],
      "allocation": {
        "grid": 2080,
        "outlinesTarget": 400,
        "walkwaysTarget": 600,
        "trailsTarget": 180,
        "hatch": "remainder"
      },
      "gridPitch": 1.0,
      "buildings": {
        "count": 11,
        "minSide": 2.0,
        "maxSide": 6.5,
        "lShapeFraction": 0.35,
        "minGap": 1.2,
        "region": [
          [-16.0, 16.0],
          [-12.0, 10.0]
        ],
        "lShapeCut": [0.3, 0.5],
        "maxAttempts": 500
      },
      "hatchAngleDeg": 45,
      "hatchSpacing": 0.35,
      "walkways": 9,
      "trails": {
        "count": 3,
        "dashLength": 0.3,
        "gapLength": 0.2,
        "start": [0.0, 0.0, 13.0]
      },
      "classes": {
        "grid": {
          "widthPx": 1.0,
          "alpha": 0.1
        },
        "outline": {
          "widthPx": 1.6,
          "alpha": 0.85
        },
        "hatch": {
          "widthPx": 1.0,
          "alpha": 0.22
        },
        "walkway": {
          "widthPx": 1.4,
          "alpha": 0.45
        },
        "trail": {
          "widthPx": 2.0,
          "alpha": 0.55
        },
        "trailLit": {
          "widthPx": 2.6,
          "alpha": 1.0
        }
      },
      "marker": {
        "radius": 0.35,
        "squashY": 1.4,
        "poleHeight": 0.8,
        "poleRadius": 0.02,
        "bobAmp": 0.06,
        "bobPeriodSec": 2.4,
        "hitRadiusPx": 22,
        "claimScale": 1.25,
        "riseStaggerMs": 80,
        "hoverLift": 0.15,
        "claimDrop": 0.6,
        "bobPhases": [0.0, 2.1, 4.2]
      },
      "trailDrawUnitsPerSec": 14.0,
      "outlineLaneLength": 0.5,
      "walkwayLaneLength": 0.4,
      "walkwayOffset": [0.15, 0.3],
      "waypointFractions": [0.25, 0.5, 0.75],
      "waypointOffset": 3.0,
      "footprintMargin": 0.8,
      "markerMinFromStart": 8.0,
      "markerMinApart": 9.0,
      "hatchSpacingGrow": 1.1,
      "trailMaxOverlap": 2.0,
      "cameraFollow": {
        "weight": 0.25,
        "halfLifeMs": 400
      },
      "camera": {
        "pitchMin": -75,
        "pitchMax": -5
      }
    },
    "scatter": {
      "radius": 8.0,
      "segLength": [0.2, 0.6],
      "classes": {
        "lane": {
          "widthPx": 1.0,
          "alpha": 0.22
        }
      }
    },
    "camera": {
      "server": {
        "fine": {
          "pos": [-7.0, 2.4, 8.0],
          "target": [0.5, 0.0, -3.0],
          "fovDeg": 48,
          "shiftNdc": [0.62, 0.0]
        },
        "coarse": {
          "pos": [-3.5, 5.0, 12.0],
          "target": [0.3, 0.0, -3.0],
          "fovDeg": 52,
          "shiftNdc": [0.0, -0.3]
        }
      },
      "leaflink": {
        "fine": {
          "pos": [0.0, 30.0, 21.0],
          "target": [0.0, 0.0, 1.5],
          "fovDeg": 34,
          "shiftNdc": [0.0, 0.0]
        },
        "coarse": {
          "pos": [0.0, 34.0, 18.0],
          "target": [0.0, 0.0, 1.5],
          "fovDeg": 42,
          "shiftNdc": [0.0, 0.18]
        }
      },
      "sidequests": {
        "fine": {
          "pos": [6.0, 24.0, 16.0],
          "target": [0.0, 0.0, 0.0],
          "fovDeg": 36,
          "shiftNdc": [-0.18, 0.0]
        },
        "coarse": {
          "pos": [3.0, 30.0, 14.0],
          "target": [0.0, 0.0, 0.0],
          "fovDeg": 46,
          "shiftNdc": [0.0, -0.22]
        }
      },
      "scatter": {
        "fine": {
          "pos": [0.0, 0.0, 14.0],
          "target": [0.0, 0.0, 0.0],
          "fovDeg": 40,
          "shiftNdc": [0.0, 0.0]
        },
        "coarse": {
          "pos": [0.0, 0.0, 18.0],
          "target": [0.0, 0.0, 0.0],
          "fovDeg": 52,
          "shiftNdc": [0.0, 0.0]
        }
      },
      "near": 0.1,
      "far": 120.0,
      "idleYawDeg": {
        "server": 3.0,
        "leaflink": 0.0,
        "sidequests": 2.0,
        "scatter": 4.0
      },
      "idleYawPeriodSec": {
        "server": 20.0,
        "sidequests": 30.0,
        "scatter": 24.0
      },
      "leaflinkDrift": {
        "amp": [3.0, 2.0],
        "periodSec": 40.0
      },
      "parallaxDeg": 1.5,
      "parallaxDampHalfLifeMs": 180
    },
    "governor": {
      "sampleWindowMs": 2000,
      "p90TargetMs": 16.7,
      "stepDownAboveMs": 20.0,
      "stepUpBelowMs": 12.0,
      "stepUpAfterMs": 10000,
      "dprStep": 0.25
    }
  },
  "breakpoints": {
    "coarseOrNarrowBelowPx": 768,
    "desktopFromPx": 1024
  },
  "hueBudgetPct": {"server": 30, "leaflink": 10, "sidequestsSignal": 6, "scatter": 6},
  "zone": {
    "name": {
      "padPx": 12
    }
  },
  "curve": {
    "track": [0.65, 0, 0.35, 1]
  },
  "morph": {
    "loomFrom": 0.92,
    "recedeTo": 0.96,
    "ringBreath": 0.6,
    "silhouettePull": 0.35
  },
  "scene": {
    "server": {
      "gradient": {
        "leadStop": "signal",
        "tailStop": "field",
        "tailLength": 0.6,
        "light": {"mode": "band", "radius": 8.0, "gain": 1.0}
      }
    },
    "leaflink": {
      "gradient": {
        "leadStop": "ink",
        "tailStop": "field",
        "tailLength": 1.0,
        "light": {"mode": "radial", "radius": 6.0, "gain": 1.0}
      }
    },
    "sidequests": {
      "gradient": {
        "leadStop": "field",
        "tailStop": "signal",
        "tailLength": 0.8,
        "light": {"mode": "wander", "radius": 5.0, "gain": 1.0}
      }
    },
    "whoami": {
      "gradient": {
        "leadStop": "ink",
        "tailStop": "field",
        "tailLength": 0.5,
        "light": {"mode": "static", "radius": 10.0, "gain": 0.5}
      }
    }
  },
  "lanefield": {
    "variance": {
      "depthBands": 3,
      "bandSpeed": [0.85, 1.0, 1.15],
      "bandAlpha": [0.55, 0.8, 1.0],
      "lengthVariance": 0.18,
      "phaseJitterSeeded": true,
      "lockstepPhaseJitter": 0
    }
  },
  "hero": {
    "sizePx": 280,
    "minSizePx": 160,
    "tiltMaxDeg": 8,
    "beatScale": 1.015,
    "ringPadPx": 12,
    "landBeatScale": 1.04
  },
  "entropy": {
    "seedParam": "seed",
    "pullScale": [0.85, 1.15],
    "pulseSwirl": 0.6,
    "scene": {
      "server": {"bowWorld": 0.0, "swirl": 0.0},
      "leaflink": {"bowWorld": 1.5, "swirl": 0.35},
      "sidequests": {"bowWorld": 2.5, "swirl": 0.7},
      "scatter": {"bowWorld": 2.0, "swirl": 0.9}
    }
  },
  "focus": {
    "halfLifeMs": 200,
    "maxPanWorld": 20.0
  },
  "glitter": {
    "holdMs": 500,
    "maxWeight": 0.85,
    "ringRadiusPx": 120,
    "swirl": 0.9
  },
  "guestbook": {
    "hash": "#guestbook",
    "storageKey": "jp.guestbook.v1",
    "nameMaxChars": 24,
    "lineMaxChars": 80,
    "ledgerMax": 5,
    "easeMain": [0.35, 0, 0, 1],
    "easeSoft": [0.4, 0, 0.1, 1],
    "ms": {
      "letter": 400,
      "letterOut": 300,
      "lockIn": 400,
      "hold": 300,
      "noiseStep": 60,
      "bandStagger": 75,
      "panel": 400
    },
    "camera": {
      "dollyIn": 0.26,
      "pushIn": 0.1,
      "pullBack": -0.24,
      "yawDeg": 9,
      "riseFrac": 0.06,
      "driftYawDeg": 14
    },
    "part": {
      "radiusFrac": 0.6,
      "pushFrac": 0.12,
      "depthFrac": 0.07,
      "residual": 0.4,
      "layoutScale": {
        "server": 1.0,
        "leaflink": 0.0,
        "sidequests": 0.0,
        "scatter": 0.0
      }
    },
    "mark": {
      "spacingFrac": 0.05,
      "heightFrac": [0.075, 0.095],
      "wobbleFrac": 0.012,
      "glyphFrac": 0.055,
      "noiseFrac": 0.02,
      "bendPower": 2,
      "settleRadiusFrac": [0.05, 0.15],
      "settleScale": [0.55, 0.85],
      "glyphPx": [14, 96],
      "colorPool": {
        "dark": ["signalHot", "signal", "inkTint", "chalk", "chalk2"],
        "paper": ["ink", "signalDim", "paper.text", "paper.text2"]
      }
    },
    "shiftNdc": {
      "fine": [0.0, 0.02],
      "coarse": [0.0, 0.08]
    },
    "fitWidthFrac": 0.8,
    "dim": {
      "amount": 0.94,
      "padPx": 24,
      "featherPx": 64
    },
    "focusRulePx": 2,
    "pillRadiusPx": 88,
    "panelDepthPx": 600,
    "perspectivePx": 900
  },
  "brand": {
    "gifMaxBytes": 900000,
    "gifMaxDecoded": 48000000,
    "decodeTimeoutMs": 4000,
    "fingerprintDeltaE": 3,
    "areaCap": 0.12
  },
  "perf": {
    "p95Ms": 16.7,
    "p99Ms": 33,
    "longTaskMs": 50,
    "degradeFrames": 30
  },
  "budgets": {
    "lcpMs": 2000,
    "ttiMs": 3000,
    "tbtMs": 150,
    "cls": 0.02,
    "longTaskMaxMs": 50,
    "renderBlockingCssGzKb": 45,
    "appShellJsGzKb": 110,
    "worldChunkGzKb": 220,
    "fontPreloadKb": 50,
    "frameP95MsPhone": 16.7,
    "drawCallsMax": 12,
    "gpuMemoryMbMax": 64
  },
  "chrome": {
    "readoutEnterTranslatePx": 8,
    "readoutTopExtraPx": 8,
    "serverReadoutWidth": "min(36vw, 480px)",
    "serverReadoutBottomGap": "calc(3 * var(--spacing-12))",
    "readoutClearPadding": "var(--spacing-6)",
    "legendWidthPx": 360,
    "trailheadWidthPx": 380,
    "trailheadTopExtraPx": 40,
    "coarseReadoutMaxHeight": "46dvh",
    "legendGlyphPx": {
      "ring": 10,
      "dot": 10,
      "bar": [16, 3]
    },
    "keymapNarrowBelowPx": 360,
    "scrimAlpha": 0.6,
    "sheetMaxWidthPx": 640,
    "sheetMaxMs": 300,
    "toastMaxMs": 225,
    "travelDom": {
      "readoutHiddenAtMs": 150,
      "regimeSwitchAtMs": 350,
      "readoutInDelayMs": 400,
      "reducedRegimeSwitchAtMs": 150
    }
  },
  "a11y": {
    "contrastMoreAlphaScale": 1.4,
    "contrastMoreHairlineAlpha": 0.3
  },
  "posters": {
    "webpQuality": 72,
    "fallbackQuality": 60,
    "maxKb": 90,
    "fine": [1440, 900, 1],
    "coarse": [390, 844, 2]
  }
}
```

Scene specs restate some of these numbers inside formulas so a reviewer can check them by hand; the code always reads them from `T` (the generated module), never from the spec text.

## 13. Changelog

- 1.8.0, 2026-11-12: nodes only (Justin's Nov 12 critique, brief `guestbook/critique-2026-11-12-brief.md`). Section 6.15 is rewritten and supersedes the 1.7.0 words: the server stack words are removed entirely (`world.server.words`, `wordSize`, `wordColorStops`, `wordPool`, `wordFadeFrom`, `reducedWordAt` and the `--jp-text-scene` row are gone) and seeded node groups ride the lane tips instead (`world.server.nodes.*`, new). New `guestbook.mark.colorPool`: each signature takes a color from the pool by its sign seed (6.14 Mark color); pool entries name existing colors only, no new hue. Section 1, 6.1, 6.4 and 6.14 wording follows. This deliberately reverses Justin's Nov 9 pick (words formed from lanes). New `guestbook.part.layoutScale` (6.14 Part per scene): the part is off on the flat ground scenes, which fixes the LeafLink and SideQuests bulge (critique item 4).
- 1.7.0, 2026-11-10: server words formed from lanes (section 6.15, S05 1.3.0), Justin's pick for fix 4b of the guestbook phone brief over removing them, since C-SRV-P2 no longer carries the stack names. Each character rides its own lane tip; bend and tint follow the word's opacity so lanes never snap. Word lanes reuse the guestbook offset texture (alpha 2 plus slot) with one tint per `wordPool` slot; lane draw calls unchanged; no new tokens, no copy change.
- 1.6.0, 2026-11-10: guestbook on real phones (Justin's iPhone demo, Safari and an in-app browser). Section 6.14 gains phone frame, keyboard, contrast and scene-word rules; tokens `guestbook.dim.*` (amount 0.94, pad 24px, feather 64px) and `guestbook.focusRulePx` 2 are new and proposed until a device run confirms them. Contrast is the lane-dim option because G-TOKENS bans gradients in CSS (a CSS radial scrim would fail the lint). The projection now reads the canvas's CSS box, which was `100dvh` tall while the camera aspect used `innerHeight`. Uniforms nine to twelve; draw calls unchanged. Lock-in choreography unchanged.
- 1.5.0, 2026-11-09: guestbook (section 6.14, `guestbook.*` new). Brief: `guestbook/prompt.md` on astryx-polish-r2 (entropic and 3D). Two Lusion beziers enter as guestbook-only curves (`guestbook.easeMain`, `guestbook.easeSoft`, from `guestbook/references/lusion-style-brief.md`); the site curves are unchanged. Pill radius 88 from the same extract. Engine adds one RGBA32F 256 by 24 texture (98,304 bytes) and nine uniforms; draw calls unchanged. Proposed values: every `guestbook.*` number is proposed until a device run confirms it. Storage: browser-local only (Justin, 2026-11-10); a shared store, if ever wanted, is a separate change.

- 1.4.0, 2026-11-05: coarse server camera refit for the S09 1.4.0 landing intro. The shorter intro left a black band between the copy (readout bottom 33.8% at 390x844) and the lane field (dense from 54%). Coarse server pose only; fine unchanged. pos y 3.0 to 5.0, fovDeg 58 to 52, shiftNdc y -0.4 to -0.3. Pitch -10.97 to -17.91, inside the SideQuests band (-75 to -5) so morph sampling stays in band; no server band exists. Verified geometrically (all 6144 lanes projected through the shifted camera at 390x844): field spans 40.0% to 83.9% (was 54.3% to 86.6%), zero segments in the readout box plus padding, so T-SRV-2 holds. Lane count, grid, and copy unchanged.
- 1.3.0, 2026-11-03: device run 3 (morphs good, minor interactivity fixes). Every line traces to DEVICE-RUN-3.md.
  - "Tutorial and offer UI cut: LeafLink legend, SIM caption, and Drop an offer button removed; SideQuests hint and coarse TrailRow removed. Features stay: map taps and logo verb still drop offers, marker twins still walk trails, hero verbs unchanged."
  - "Coarse SideQuests twins are the accessible set (aria-hidden and tabindex -1 lifted); the cut row was the accessible set, so without this companion change keyboard trail walking would regress to pointer-only."
  - "LeafLink mark does not recede on subject (6.12 exception): logo stays visible on dot taps, dots sit behind it; SideQuests recede unchanged; coarse pan still applies."
  - "LeafLink pause hides pin, halo, and ripple meshes and clears activity kind 1, so morphing back to server restores the main blue lane motion instead of leaving dots on screen."
  - "Server spray blend (provisional, AGY pending): wordSize 0.32 to 0.22, wordPool 6 to 4, wordCadence 1100ms to 1600ms, hot stop signalHot to signal. Words, font, and drift unchanged."
  - "Tests follow the cut: T-LL-VERB rewritten to assert no offer button and no slip scroll; T-SQ-TRACK walks via the controller (TrailRow gone) and reads claim state from the twins; T-S04-6 tab order drops the offer button (wordmark, Code link, keymap); T-LL-4 removed (its keyboard offer path was the cut button; no keyboard offer path remains)."
- 1.2.0, 2026-11-02: polish round 2 (device run 2). Every line traces to a repro in FINAL-POLISH-SPEC-2026-11-02.md.
  - "motion.morph.gather 0.15 to 0.22: the ring starts after the readout swap, where the placed mark (its anchor) first exists."
  - "motion.morph.loom 0.30 to 0.70 (new): the mark looms at its final position while the camera settles, filling the empty window before the text."
  - "motion.morph.recede 0 to 0.20 (new token; was a 0 to 0.40 prose constant that ran past the swap, so the outgoing mark popped out)."
  - "Ring and silhouette center on the placed mark (screen anchor, ground-projected per frame), radius clamped to clearance; rest invariant: zero strength outside a morph, pulse, or hold. Measured at 390x658: ring to mark after Gather 135px to 0px (LeafLink); rest strength 1.27 to 0."
  - "Hero placement once per configuration in the swap commit, against a laid-out readout; no per-frame re-track. Measured LeafLink mark move during a morph 172px to 0px."
  - "Light mode crossfades; both masks preload after the first frame."
  - "hero.ringPadPx 12, hero.landBeatScale 1.04 (new); LeafLink beat event driven (the periodic beat contradicted 6.3)."
  - "entropy.* (new): seeded bow, swirl, pull scale, pulse and glitter swirl; reduced motion neutral."
  - "focus.halfLifeMs 200, focus.maxPanWorld 20 (new): coarse camera pan to a focus spot beside the mark, never sweeping a marker under it (T-HERO-BAND-WALK passes at 390x844). Pitch constant. At 390x658 trail 3 has no such pan and stays unpanned (open item)."
  - "glitter.* (new): GLITTERBOX hold mode."
  - "Readout: LeafLink verb first (offer button was 5px below the 46dvh slip at 390x658); SideQuests plate, legend glyphs, coarse trail row; coarse rhythm on both project slips."
  - "Proposed values: entropy ranges, focus, glitter, loom, and landBeatScale are proposed; device run 3 confirms them."
- 1.1.0, 2026-11-01: W1 feedback round spec patch.
  - "Gradients permitted inside lane-field motion only, cooked in OKLab from signal, ink and field."
  - "Server hero is the field; project heroes are brand marks; three-phase morph between them."
  - "Brand-marks exception: SideQuests and LeafLink marks in native color, scoped by fingerprint and area cap."
  - "Layer order: toasts render in the top-most open layer."
  - "Name clear zone; titles size to fit."
  - "Lane field variant B."
  - "Performance budget recorded; measured on device."
  - "SideQuests flat plan view (feedback-11) removed: camera clamped to a measured band in every frame; plan layout remains ambient; trail walk and copy unchanged."
  - "Hue gate keeps the OKLab distance-from-signal method; no HSV band is claimed or added."
  - "No layer.* tokens: W0 confirmed a top-layer cause, so the fix is portal rehost or outlet exposure, not z-index."
  - "Version bump: changelog 1.0.4 and section 12 JSON 1.0.0 agree at 1.1.0."
  - "Camera band scope: the band applies to every frame of the SideQuests camera path, including morph transit, so the shallow edge sits at or above the shallowest morph frame; see section 6.6 for margins."
  - "Proposed values: scene gradient values, morph phase values, variant B values, hero size values, and brand budgets are proposed; the device run confirms them."
- 1.0.4, 2026-10-30: server fine shiftNdc x 0.58 to 0.62. The 0.58 pose passed T-SRV-2 once but failed twice after (0.047, 0.61) because idle yaw (3 deg) plus pointer parallax (1.5 deg) can combine to ~4.5 deg of left rotation, and the 0.58 margin (58px) does not survive it: geometric sweep to +/-5 deg shows 310 lane segments in the box at yaw -5 deg for 0.58. Shift 0.62 is clear at every yaw to +/-5 deg (minX 617 at yaw 0, zero hits at worst yaw), so it survives max yaw plus max parallax. Output point moves to ~1471px (31px past the right edge); server words drift left ~135px from the output, so they still enter view as they cool.
- 1.0.3, 2026-10-30: server fine camera fov 42 to 48, shiftNdc x 0.44 to 0.58. T-SRV-2 fine failed at every shift-only pose because the 3-degree idle yaw (20s period) pushes lanes left into the readout box at some yaw phases; shift alone cannot clear the box at all yaws. Verified geometrically (all 6144 lanes x 7 segments projected through the shifted camera, yaw swept -3 to +3 deg): fov 48 + shift 0.58 has zero segments in the box at every yaw (leftmost projection 588px, 58px right of the box edge); fov 48 + shift 0.50 still hits 1067 segments at yaw -3 deg. Output point projects to 1442px (2px past the right edge); server words drift left from the output, so they enter view as they cool. T-SRV-2 fine passes at this pose.
- 1.0.2, 2026-10-30: display0 weight 200 to 400. Justin's critique on the server render: the hairline (200) name did not pop; 400 gives it dimension while staying in the preloaded weight. Rules line updated (700 titles/keys, 400 name and prose).
- 1.0.1, 2026-10-30: hueBudgetPct gains scatter 6. B6d measured the 404 scatter scene at 0.175% (chroma over 0.04) at 1280x800; 6% matches the sidequestsSignal budget and leaves 30x headroom. S08 sets no numeric budget, so this fills the gap rather than changing a spec value.
- 1.0.0, 2026-10-30: initial. Server lane alpha (0.08), SM pitch (0.95, 0.85), depth fog (7 to 30) and camera poses were set from real renders of the S02 shaders in headless Chromium; the first guess (alpha 0.34, pitch 0.64) saturated into a solid block. Blue chosen by OKLab distance against 51 reference blues; three regimes; Commit Mono; 6,144-lane world; travel 700ms expo-out with feedback under 250ms; Astryx 0.7.1 mapping verified by a probe `theme build`. Hue budgets moved into `hueBudgetPct`: the server budget is 30% because the verification render measured 24% (the first draft's 12% was a guess the render disproved).
