# Synthesis — design extracts for a PixiJS 3D portfolio fork

Runs: 2026-11-12. Good Stuff FULL (49 files, 427.6s, exit 0). Bruno Simon PARTIAL, DOM chrome only, retry failed ERR_EMPTY_RESPONSE exit 2. Corentin Bernadou PARTIAL, stylesheet tokens stable across 2 runs (identical except timestamp), visual proof loader-only.
Constraint carried in: the fork keeps the Astryx lane theme and blue accent with Commit Mono. No extracted palette is imported. Patterns transfer; colors and brand do not.

## What transfers (ranked)

1. Curved demo shelf (Good Stuff, FULL). Each project is a 2D scene on a curved 3D panel; drag spins the shelf. This is the fork's core mechanic: LeafLink and SideQuests as two panels on one View3D shelf, HUD in 2D on the same stage. PixiJS 3D native via ContainerTexture. Highest confidence: measured, visually verified, and the framework's own demo of the pattern.
2. One View3D, thin 2D HUD (Bruno Simon, PARTIAL but the architecture is visible in the DOM: 56 flex containers, 1 progress bar, 24 tooltips, snackbar). The 3D scene fills the screen; the HUD is buttons, tooltips, and one progress element. Transfers as the fork's layering rule: scene does the showing, HUD does the naming.
3. Editorial grid as the HUD system (Corentin Bernadou, PARTIAL, tokens stable). 12-column grid, 692px column, hairline rules, flat surfaces, radius 3px, one easing (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`, 300ms) for all HUD fades. Transfers as the 2D layer's design system, restyled in lane tokens.
4. Tooltip-first discovery, relabeled HYPOTHESIS per independent review F6, 2026-11-12, not extracted evidence. Bruno Simon's 3D scene was never rendered in this environment; interaction sampling covered one DOM element, and 24 tooltips counted in the DOM do not establish that world-object hover produces labels or that the scene contains no text. Do not cite Bruno Simon as evidence for this rule. The mechanism itself, pointer events on Mesh3D with labels as Pixi Text in a 2D container, is framework-native per Lane A and Lane B, and transfers as a design hypothesis to be verified in the probe, not as a Bruno-derived rule.
5. Two-button hero, pill CTAs, tag chips (Good Stuff). One filled primary plus one outlined secondary, mono tech chips above (3D, ANIMATION, WEBGPU / WEBGL). Transfers as the fork's landing chrome, in lane tokens.
6. Drag affordance as quiet text (Good Stuff). "DRAG TO SPIN" under the scene, low contrast, no modal. Transfers as the fork's only onboarding.
7. Flat black discipline (Corentin Bernadou). No gradients, no shadows, depth from the 3D scene only. Transfers as a rule: the HUD has no elevation; the View3D owns depth. Matches the lane theme's flat surfaces and hairlines.
8. Archive index as navigation (Corentin Bernadou). Projects as list rows with 0.3s opacity hover, not cards. Transfers as the LeafLink / SideQuests index inside the HUD.

## What does NOT transfer

1. Any extracted palette. Good Stuff pink `#e91e63`, Bruno red `#ff0000`, Corentin red `#ff0000` / `#ff4401` are brand colors. The fork keeps blue accent. Palette transfer is explicitly out.
2. Drivable world as the whole site (Bruno Simon). Prior research records Practicality 1 / Wow 5: a world that hides the content is a demo, not a portfolio. The fork's shelf must keep both projects reachable without driving, and the content (failure class, receipt, falsifiability test per the portfolio spec) must be one tap away.
3. Miniature type (Corentin Bernadou, 5–13px scale). Deliberate artifice, hurts readability and the hiring purpose. Adopt the grid, not the point sizes. The fork uses the lane type scale.
4. Loader as first paint (Corentin Bernadou). Both captures show only a 23–24% counter. The fork shows the scene or content immediately; loading is a thin progress element.
5. DOM hover chrome as the interaction model (all three: 0 interaction deltas measured on Good Stuff and Corentin, 1 sampled on Bruno). Hover states live in the 3D scene and Pixi pointer events, not in CSS. A masterspec that writes CSS hover states for the 3D content is wrong.
6. Bruno Simon's 3D scene tokens. Unmeasured — the site never rendered in this environment. No claim about its world, lighting, or materials may enter the masterspec from this run.

## Motion synthesis (measured values only)

- HUD easing, single value: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, 300ms, opacity and color only (Corentin).
- Springy overshoot for scene transitions: `cubic-bezier(0.34, 1.56, 0.64, 1)` at 250–450ms (Good Stuff). Reserve overshoot for the shelf spin and panel focus; never for HUD text.
- DOM button transitions: 150ms `cubic-bezier(0.4, 0, 0.2, 1)` on box-shadow (Bruno). HUD button timing, if buttons exist in 2D.
- Ambient durations 3000–45000ms exist in the Good Stuff static inventory (starfield). Ambient motion belongs in the View3D ticker, not in CSS animations.

## Gaps the masterspec must close (not solved here)

1. Bruno Simon 3D scene: re-extract from a live render or from source; do not invent its look.
2. Corentin Bernadou hero composition: never rendered here; do not cite it.
3. Bundle and Lighthouse impact of the PixiJS 3D shelf vs the current three.js world: unmeasured in Phase 0.
4. Physics and audio choice for any game-like finale: PixiJS 3D ships neither (Lane A verified).
5. Reduced-motion behavior for the shelf spin: none of the three sources yielded a measured reduced-motion rule; the masterspec must specify one.

## Files

- `goodstuff/style-brief.md` — FULL brief, visually verified.
- `bruno-simon/style-brief.md` — PARTIAL brief, DOM chrome only, retry failed.
- `corentin-bernadou/style-brief.md` — PARTIAL brief, tokens stable across 2 runs, loader-only visual.
- Raw runs: `goodstuff/`, `bruno-simon/`, `bruno-simon-retry/`, `corentin-bernadou/`, `corentin-bernadou-retry/`, each with a `*-VERIFY.json`.
