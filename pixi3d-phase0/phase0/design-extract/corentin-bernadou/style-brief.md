# Style brief — Corentin Bernadou (PARTIAL)

Source: design-extract fusion run on https://corentinbernadou.com/, 2026-11-12.
Run 1: 47 files, 81.8s, exit 0. VERIFY: `corentin-bernadou-VERIFY.json` (sha256 c4ba0d5d3e217d39cca565c4cbbd4bb2b85348b9b49d17d0e6742ccefaf08e20).
Retry: 47 files, 67.6s, exit 0. VERIFY: `corentin-bernadou-retry/corentin-bernadou-VERIFY.json` (sha256 9b1625078118effeb99c9e026a4dc5c57f562b5be48515a0a955cf0736946ff1).

## Evidence status: PARTIAL — stylesheet tokens stable, visual proof is the loader only

- Both viewport screenshots show only the black loading screen with an orange percentage bottom-right (24% run 1, 23% retry). The animation freeze pauses the loader, so capture always catches the load state. Visual grounding FAILS for the rendered hero.
- Token stability is verified: the two runs' DESIGN.md files are identical except the `generated_at` timestamp, and the contrast JSONs are byte-identical. Stylesheet tokens below are measured twice, not once.
- SEO metadata IS real: "Freelance creative developer Corentin Bernadou crafts expressive, animation-driven interactive experiences with clean visuals and precise motion." OpenGraph video and image present.
- Interaction sampling: 4 sampled, 0 deltas. Signature scorer: no signature element (highest Links 38 supporting, Navigation 30 generic).
- The type scale is genuinely tiny in the CSS (display 13.5px, body ~10px) — the site renders at a scaled-down zoom and is famous for it. Do NOT "fix" the scale by multiplying; record it as measured and let the masterspec decide whether the fork adopts the miniature scale or the editorial grid only.
- Consequence: use this brief for the editorial grid, the flat black/red discipline, and the Lenis-smooth motion values. Do NOT cite it for hero composition, which was never rendered here.

## Tokens (measured, stable across 2 runs)

| role | value | note |
|---|---|---|
| primary | `#ff0000` | 12 uses; action.primary on black 5.25:1 AA |
| secondary | `#ff4401` | 11 uses; on black 6.08:1 AA |
| page bg | `#070304` | page pair on `#ff4401` 5.94:1 AA |
| foreground | `#000000` | neutrals `#767676`, `#6d6d6d`, `#141414`, `#858585` |
| total unique colors | 7 | |
| dominance | `#000000` 80%, `#ff0000` 20% | |

CSS variables (measured values; palette is NOT imported into the portfolio — lane theme and blue accent win):

```css
--cb-primary: #ff0000;
--cb-secondary: #ff4401;
--cb-page: #070304;
--cb-fg: #000000;
```

## Typography (measured)

- Body size 10.1587px / line-height 13.2064px. Scale ratio 1.125 (major second) from 5.92593px; 100% of sizes on the ladder.
- Named scale: display 13.545px / 600, title-1 11.8519px / 600, h1 10.1587px / 600, body-sm 9.31217px / 600, micro 8.46561px / 400, sm-3 5.92593px / 700.
- Headings Title Case, tight. Voice neutral, third-person. Measure ~38 characters per line (narrow). No fluid type.
- No font families named in the extracted scale (engine reading); do not invent one. The portfolio uses Commit Mono.

## Layout (measured)

- Spacing base 2px; scale 2, 21, 42, 100px. Section rhythm 21px vertical padding. Gap scale 4.23, 8.47, 29.63, 108.36px.
- Content column 692px. Column system: 12 columns (canonical page grid). 1 grid container, 10 flex containers.
- Radii: sm 3px only. No discrete shadow tokens — flat material. Z-index layers: 7.
- Detected patterns: buttons, links, navigation, modals, badges. Reading order detected: feature-grid, pricing, nav.

## Motion (measured)

- Engine durations 300ms. Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad). Engine feel: responsive, scroll-linked.
- Static inventory: 19 declarations. Archive nav and list items: opacity 0.3s with the same easing; list-item children color 0.1s same easing. Lenis smooth-scroll class present (`.lenis.lenis-autoToggle`, 1ms overflow toggle).
- No keyframe animations in the static inventory; motion is transition-driven, not keyframe-driven.

## Stealable patterns (4)

1. Swiss editorial grid over a 3D scene: 12-column grid, 692px content column, hairline rules, tiny precise type. The 2D HUD in a Pixi fork can carry this grid while the View3D fills the rest — editorial discipline as the HUD system.
2. Flat black with one red: `#070304` page, `#ff0000` at 20% dominance, no gradients, no shadows, radius 3px. Depth comes from the 3D scene, never from elevation. Maps cleanly onto the lane theme: flat surfaces, hairlines, one accent.
3. Lenis-smooth scroll with 300ms ease-out-quad transitions: one easing everywhere, opacity and color only, no transform choreography in the DOM layer. The 3D camera does the moving; the HUD only fades.
4. Archive index as navigation: list items fade on hover (0.3s opacity), child color shifts in 0.1s. A project index that is a list, not cards — fits LeafLink / SideQuests as two rows, not two hero cards.

## Anti-patterns to avoid (3)

1. No miniature type by default: the 5–13px scale is a deliberate artifice that hurts readability and fails the portfolio's hiring purpose. Adopt the grid, not the point sizes.
2. No loader as the first impression: the measured site spends its first paint on a percentage counter. A fork must show content or the 3D scene immediately, with loading as a thin progress element (see Bruno brief pattern 3).
3. No red import: `#ff0000` / `#ff4401` are Corentin's brand. The portfolio keeps the lane theme and blue accent.

## Do-not-copy list

Corentin Bernadou name, logo, project work and imagery, OpenGraph video and image, Lenis as a brand (the library itself is MIT and usable; the site design is not), font files. No hotlinked assets.
