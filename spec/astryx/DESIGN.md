# DESIGN.md: Justin Poli personal site, Astryx Keystone

Version 1.0.0, 2026-10-30. Single token home. Owner: the spec package in `spec/astryx/`.

**Rule zero.** If a value is not in this file, it does not exist. Every color, size, duration, easing, count, coordinate and camera pose the build uses is in the `design-tokens` JSON block in section 12. The build reads that block (`tools/extract-tokens.mjs`, spec S00) and generates `src/tokens.generated.ts` and `themes/lane/tokens.generated.json`. Source code imports values from the generated module. A hex literal, a `ms` literal, or a bare geometry number in `src/` outside generated files fails the token lint (S11, gate G-TOKENS). To change a value, change it here, bump the version, add a changelog line.

---

## 1. The idea

The whole site is one field of **6,144 lanes**. That number is not chosen for looks: the RTX 3070 Ti in Justin's inference server has 48 streaming multiprocessors with 128 CUDA cores each, 6,144 in total (NVIDIA GA104 public spec; receipt R-GPU in UNKNOWNS.md). Every line drawn anywhere on the site is one of those 6,144 lanes, rearranged.

- **Server** (home, `/`): the lanes run parallel and fire in lockstep, 32 at a time, the way warps do. They converge at one output point where the words of the stack come out and cool.
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

## 4. Type

**One family: Commit Mono** (OFL 1.1, `@fontsource/commit-mono@5.2.5`, Latin subset, weights 200, 400, 700). Justin's hero object is a terminal UI he wrote in Go; the site speaks in that voice everywhere, so there is one typeface decision and it is on purpose. Not Inter, not system sans, not JetBrains Mono (the developer-portfolio default). Commit Mono is neutral enough for paragraphs at 16px and distinct at display sizes.

- Fallback stack: `"Commit Mono", "Commit Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace`. `Commit Mono Fallback` is a local `@font-face` over `Menlo, Consolas, "DejaVu Sans Mono"` with `size-adjust: 100%`, `ascent-override: 92%`, `descent-override: 24%`, `line-gap-override: 0%` (values to be tuned in S00 until CLS from font swap is under 0.01; record the final values here).
- Preload only the 400 woff2. 200 and 700 load on idle with `font-display: swap`.
- In-scene text (troika SDF) uses the 400 `.woff` file (troika does not read woff2).

Scale: Astryx `typography.scale` with base 16, ratio 1.25 (verified output of `astryx theme build`): 13, 16, 20, 25, 31, 39, 49, 61 px. Plus two local display steps outside the Astryx scale, because a name in a terminal voice needs a 3x jump to land:

| Token | Size | Weight | Leading | Tracking | Use |
|---|---|---|---|---|---|
| `--jp-text-display-0` | `clamp(3.5rem, 9.5vw, 8rem)` | 200 | 0.95 | -0.04em | "Justin Poli" on Server only |
| `--jp-text-display-1` | `clamp(2.25rem, 6vw, 4.5rem)` | 700 | 1.0 | -0.03em | Scene titles "LeafLink", "SideQuests" |
| `--text-heading-2` (Astryx) | 25px | 700 | 1.2 | -0.01em | Sheet titles |
| `--text-body` (Astryx) | 16px | 400 | 1.5 | 0 | Readout prose, max 52ch |
| `--text-supporting` (Astryx) | 13px | 400 | 1.54 | 0 | Facts lines, captions |
| `--jp-text-key` | 13px | 700 | 1 | 0 | Keymap key glyphs |
| `--jp-text-scene` | world units, see 12 | 400 | 1 | 0 | troika in-scene words |

Rules: extreme weights only (200 for the name, 700 for titles and keys, 400 for everything else). No all-caps text anywhere. No letter-spaced eyebrows. No text smaller than 13px. Numbers use `font-variant-numeric: tabular-nums`.

## 5. Space, radius, size, border, focus

- **Spacing**: Astryx scale unchanged (4px base: `--spacing-1` 0.25rem up to `--spacing-12` 3rem). Local: `--jp-gutter` 16px under 640px wide, 32px from 640, 48px from 1280. `--jp-keymap-h` 44px (coarse pointer) and 36px (fine pointer).
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
| `--jp-duration-word` | 2600ms | Server output word life (ambient) |

### 6.2 How travel obeys "nothing over 250ms"

Feedback is never over 250ms: the keymap item turns accent in 150ms and the lanes start moving on the next frame. Travel itself is 700ms of expo-out, which places 80% of the displacement in the first 210ms; the remaining 490ms is deceleration that never blocks input (a second key press mid-travel retargets from the current state, S03). So the perceived response is under 250ms and the full settle is a surface transition that never makes anyone wait. This is the deliberate reading of MOTION-LANGUAGE rules 1 to 4, recorded here so nobody "fixes" the 700ms.

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
| Server pulses and words | Frozen: one static frame, pulses drawn at fixed phases, three words placed at rest |
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

## 7. Component signatures

Named for their role on this site. Each has at least two variants or it is plain on purpose.

| Component | Role | Astryx base | Variants |
|---|---|---|---|
| `Lanefield` | The 6,144-lane world (WebGL) | none, authored (S02) | layouts: server, leaflink, sidequests, scatter |
| `Keymap` | The only navigation, one TUI line at the bottom edge | `Kbd` for key glyphs, `useHotkeys` for bindings | fine pointer (keys shown) / coarse pointer (keys hidden, 44px targets); item states: idle, hover, active |
| `Readout` | A scene's DOM text block | none, plain HTML on tokens | `server` (no container, left column), `leaflink` (paper.raised slip, 0 radius, hairline ring, legend position), `sidequests` (chalk dashed outline, trailhead position) |
| `WhoamiSheet` | Education and campus roles | `BottomSheet` (purpose info, height hug) | open, closed |
| `ContactSheet` | Email, copy, links | `BottomSheet`, `Button`, `Link` | open, closed; copy idle, copied, failed |
| `CopyConfirm` | Copy result | `Toast` via `useToast` | info "Copied." / error "Copy failed. The address is selected." |
| `OfferButton` | LeafLink keyboard path to drop an offer | `Button` variant `secondary` | idle, pressed |
| `QuestMarker` | SideQuests marker (WebGL plus DOM button twin) | none in WebGL; DOM twin is a `Button` ghost | open, lit, claimed |

Theme component overrides (in `themes/lane/laneTheme.mjs`, legal keys verified with `astryx theme targets <Name> --json` in S01): Button `base` radius `--radius-element`, no shadow, label weight 700; Button `variant:primary` background `--color-accent`, color `--color-on-accent`; Kbd `base` background transparent, hairline ring, radius 2px; BottomSheet `base` background `--jp-raised`, radius 0 on the top corners (a TUI pane, not a phone card), no shadow.

## 8. World constants (the Lanefield)

All geometry is in world units (1 unit reads as 1 meter). Exact values are in section 12 under `world`. Summary:

- Lane count 6144. Points per lane 8. Segments per lane 7. Instances 43,008. Layout count 4.
- Layout texture: RGBA32F, 256 by 768 texels. Texel index `lane * 32 + layout * 8 + point`. RGB position, A class id.
- Activity texture: RGBA32F, 256 by 24 texels, one texel per lane.
- Lane width is in CSS pixels, per class. Lines thinner than 1 device pixel are drawn at 1 device pixel with alpha scaled by their true width (no shimmer).
- Camera poses per scene and per breakpoint, principal-point shift so the subject sits beside the readout.

## 9. Imagery and assets

No photos, no illustrations, no icons except Astryx's built-in external-link indicator on `Link isExternalLink`. No logos of Ollama, Docker, Tailscale, NVIDIA or anyone else: product names appear as text only. No map tiles, no real street data, no Leaflet marker graphic. Every visual is procedural from S02, S05, S06, S07.

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
  "version": "1.0.0",
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
      "weight": 200,
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
      "wordCadence": 1100,
      "readoutInDelay": 400
    },
    "spring": {
      "dampingRatio": 0.7,
      "frequencyHz": 3.2
    },
    "leaflinkEventIntervalMs": [1000, 1600],
    "feedbackMaxMs": 250
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
      "words": ["Go TUI", "Ollama", "Tailscale", "Docker", "Open WebUI", "WSL2 Ubuntu", "Windows 11", "RTX 3070 Ti", "Smithtown, NY"],
      "wordSize": 0.32,
      "wordDrift": [-1.0, 0.5, 1.0],
      "wordPool": 6,
      "wordSpawnOffsetZ": 0.2,
      "wordColorStops": [0.0, 0.4, 1.0],
      "wordFadeFrom": 0.55,
      "reducedWordAt": [0.2, 0.5, 0.8],
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
          "fovDeg": 42,
          "shiftNdc": [0.44, 0.0]
        },
        "coarse": {
          "pos": [-3.5, 3.0, 12.0],
          "target": [0.3, 0.0, -3.0],
          "fovDeg": 58,
          "shiftNdc": [0.0, -0.4]
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

- 1.0.1, 2026-10-30: hueBudgetPct gains scatter 6. B6d measured the 404 scatter scene at 0.175% (chroma over 0.04) at 1280x800; 6% matches the sidequestsSignal budget and leaves 30x headroom. S08 sets no numeric budget, so this fills the gap rather than changing a spec value.
- 1.0.0, 2026-10-30: initial. Server lane alpha (0.08), SM pitch (0.95, 0.85), depth fog (7 to 30) and camera poses were set from real renders of the S02 shaders in headless Chromium; the first guess (alpha 0.34, pitch 0.64) saturated into a solid block. Blue chosen by OKLab distance against 51 reference blues; three regimes; Commit Mono; 6,144-lane world; travel 700ms expo-out with feedback under 250ms; Astryx 0.7.1 mapping verified by a probe `theme build`. Hue budgets moved into `hueBudgetPct`: the server budget is 30% because the verification render measured 24% (the first draft's 12% was a guess the render disproved).
