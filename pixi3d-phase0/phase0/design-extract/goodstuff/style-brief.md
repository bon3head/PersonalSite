# Style brief — Good Stuff (PixiJS)

Source: design-extract fusion run on https://goodstuff.pixijs.io/, 2026-11-12.
Run: 49 files, 427.6s, exit 0. VERIFY: `goodstuff-VERIFY.json` (sha256 f782cfaf51f2e9cc4032f712690cd2d0a0c0de09b6429d3d9a0073c6b33a8784).
Evidence status: FULL. Viewport screenshot visually verified: dark starfield, pink Good Stuff wordmark, curved demo shelf, drag-to-spin hint, LAUNCH DEMO / ABOUT PIXIJS 3D buttons.
Contrast gate: pass, 4 pairs, 0 failures. Interaction sampling: 12 sampled, 0 deltas (canvas-driven page; DOM hover deltas are not the interaction surface).
Evidence: `page0/goodstuff-p0-DESIGN.md`, `goodstuff-p0-motion-fusion.json`, `goodstuff-p0-viewport.png` (sha256 be1d3e32cabce49e27f84b6c83c2a688a1942d663f857d792cd91ae38de31518), `goodstuff-p0-brand.png`.

## Tokens (measured)

| role | value | note |
|---|---|---|
| page bg | `#0d0b16` | painted area `#0c0b12` 99% |
| primary | `#e91e63` | 36 uses; action.primary on black 4.83:1 AA |
| secondary | `#ffa838` | 1 use; on black 10.91:1 AAA |
| accent | `#ef4d95` | 1 use; on black 6.17:1 AA |
| foreground | `#ffffff` | page pair 19.51:1 AAA |
| total unique colors | 8 | |

CSS variables (measured values, do not import the palette into the portfolio; the portfolio keeps the lane theme and blue accent — see synthesis note):

```css
--gs-page: #0d0b16;
--gs-primary: #e91e63;
--gs-secondary: #ffa838;
--gs-accent: #ef4d95;
--gs-fg: #ffffff;
```

## Typography (measured)

- Families: Roboto 31 uses, Outfit 20 uses, Roboto Mono 23 uses. Body size reported 11px (engine reading; treat as unreliable for body copy — the hero type is the real scale).
- Named scale: h2 115.2px / 700, title-1 76.8px / 700, h1 69.12px / 700, title-2 28px / 700, title-3 24px / 700.
- Voice: friendly, Sentence case headings, tight.
- Measure: ~56 characters per line. 2 clamp/viewport fluid sizes.

## Layout (measured)

- Content column 1009px, gutters 64px, section rhythm 176px vertical padding.
- Spacing base 2px; scale 5, 38, 56, 64, 72, 112, 176, 192, 208, 234px. Gap scale 8, 10, 12, 14, 18px.
- Radii: lg 16px, full 999px. Shadows: 2 levels, one tinted pink (`rgba(233, 30, 99, 0.35) 0px 8px 22px 0px`).
- 13 grid containers, 23 flex containers. Reading order: nav, logo-wall, logo-wall, content, content, footer.

## Motion (measured)

- Engine durations 250ms, 300ms, 450ms. Easings: `cubic-bezier(0.34, 1.56, 0.64, 1)` (springy overshoot), `cubic-bezier(0.215, 0.61, 0.355, 1)`. Engine feel: springy, scroll-linked.
- Static inventory: 15 declarations, 7 durations including 3000–45000ms (long ambient/starfield durations).
- Signature scorer: no signature element (highest: Links 38, Buttons 38, Cards 37 — all supporting tier). The signature is the 3D shelf itself, which the DOM scorer cannot see. That is a finding, not a failure.

## Stealable patterns (5)

1. Curved demo shelf: each demo is a 2D scene drawn onto a curved 3D panel; the shelf rotates on drag. Direct PixiJS 3D pattern — 2D content on 3D surfaces via ContainerTexture, one View3D, drag-to-spin.
2. Starfield ambient layer: near-black page with sparse white specks; depth comes from the 3D scene, not from gradients or shadows.
3. Two-button hero: one filled primary CTA (LAUNCH DEMO) plus one outlined secondary (ABOUT PIXIJS 3D), both pill-shaped, no button soup.
4. Tag chips above the CTAs: small mono pills (3D, ANIMATION, WEBGPU / WEBGL) that name the tech without a paragraph.
5. Drag affordance as text, not chrome: "DRAG TO SPIN" with a small icon, centered under the scene, low contrast, no modal or tooltip.

## Anti-patterns to avoid (3)

1. No pink import: the `#e91e63` palette is PixiJS brand, not the portfolio palette. Steal the shelf mechanics, not the colors.
2. No hero paragraph: the subhead is two lines, then the scene does the talking. Do not add a tutorial block above the 3D.
3. No DOM hover chrome on a canvas page: 0 interaction deltas measured — hover states live in the 3D scene and pointer events, not in CSS.

## Do-not-copy list

PixiJS logo and wordmark, Good Stuff name, demo game art (Nightward, Mach 2, Backrooms), Roboto/Outfit font files (substitute the portfolio's Commit Mono), PixiJS brand pink. No hotlinked assets.
