# Style brief — Bruno Simon (PARTIAL)

Source: design-extract fusion run on https://bruno-simon.com/, 2026-11-12.
Run 1: 47 files, 125.9s, exit 0. VERIFY: `bruno-simon-VERIFY.json` (sha256 ef6a14f37d49119b16d7880b31707fd08f30038ac1b401b62c3f2dc14368d416).
Retry: FUSION FAILED, 3 files, 65.4s, exit 2 — `goto: net::ERR_EMPTY_RESPONSE at https://bruno-simon.com/`, VERIFY: `bruno-simon-retry/bruno-simon-VERIFY.json` (sha256 8f8bf337fddf9a698cc730fcb0922cfa29951f2ac777972ba55f868e5724fbe0).

## Evidence status: PARTIAL — DOM chrome only, 3D scene unmeasured

- Viewport screenshot is a Chrome error page: "This page isn't working — bruno-simon.com didn't send any data. ERR_EMPTY_RESPONSE." Visual grounding FAILS for the rendered site.
- SEO metadata IS real and was extracted: site_name "Three.js Journey", title "Bruno Simon", description "Bruno Simon's creative portfolio", share image at bruno-simon.com/social/share-image.png. The HTML shell loaded at least once; the WebGL app did not render in this environment.
- Interaction sampling: 1 sampled, 0 deltas. Signature scorer: highest Buttons 50 (supporting), ProgressBars 43, Tooltips 39 — all supporting tier, no signature element.
- Dominance `#ffffff` 100% and 10 unique colors are DOM-computed only. The 3D driving world paints via WebGL canvas, which computed-style extraction cannot see. Every token below is DOM chrome, not the scene.
- Consequence: use this brief for the 2D HUD layer only (buttons, tooltips, progress bar, snackbar). Do NOT cite these tokens as the look of the 3D world. A masterspec that needs the 3D scene must re-extract from a live render or from the Three.js Journey source, not from this run.

## Tokens (measured, DOM chrome only)

| role | value | note |
|---|---|---|
| primary | `#ff0000` | 1 use; action.primary on black 5.25:1 AA |
| secondary | `#ff6a7c` | 6 uses; on black 7.6:1 AAA |
| accent | `#251f2b` | 3 uses; on white 16.04:1 AAA |
| foreground | `#000000` | neutrals `#ffffff`, `#555555`, `#141414`, `#767676` |
| total unique colors | 10 | |

CSS variables (DOM chrome only):

```css
--bs-primary: #ff0000;
--bs-secondary: #ff6a7c;
--bs-accent: #251f2b;
--bs-fg: #000000;
```

## Typography (measured, DOM chrome only)

- Families: Nunito 157 uses, Amatic SC 19 uses (handwritten display face for labels).
- Body size 20px. Scale ratio 1.25 (major third) from 16px; 89% of sizes on the ladder.
- Named scale: display 64px / 700, title-1 50px / 700, h2 40px / 700, title-2 34px / 700, title-3 30px / 900, title-4 25px / 700, body 20px / 400, body-sm 16px / 400, micro 13px / 700.
- Voice: neutral. No fluid type; fixed sizes per breakpoint.

## Layout (measured, DOM chrome only)

- Spacing base 2px; scale 3, 8, 20, 25, 30, 34, 38, 50, 80, 90px. Gap scale 3, 10, 30px.
- Radii: sm 4px, md 8px, lg 15px. No discrete shadow tokens — flat material. Z-index layers: 2.
- 0 grid containers, 56 flex containers. Detected patterns: buttons, inputs, links, navigation, modals, dropdowns, tables, tabs, tooltips, progressBars, switches.

## Motion (measured, DOM chrome only)

- Engine durations 150ms, 300ms. Static inventory: 11 declarations.
- Inline-style transitions: button box-shadow 150ms `cubic-bezier(0.4, 0, 0.2, 1)`; #details opacity 250ms same easing; #main-content opacity 100ms same easing; snackbar show/hide animations 250ms each.
- Engine feel: mixed, scroll-linked. The 3D driving motion (camera, car physics) is not in this inventory — it lives in the WebGL loop.

## Stealable patterns (4, HUD layer only)

1. Drivable world as the whole page: the 3D scene IS the site; the 2D chrome is minimal (a few buttons, tooltips, one progress bar). For a portfolio fork: one View3D fills the screen, HUD is a thin 2D layer on the same stage.
2. Tooltip-first discovery: 24 tooltips measured. Hovering world objects reveals labels in 2D; the 3D scene never carries text itself.
3. Progress bar as the only persistent HUD element: one ProgressBar component, page-specific name, supporting tier. A single loading/progress element beats a HUD full of widgets.
4. Snackbar for transient feedback: 250ms show/hide, opacity-driven, no modal. State changes announce in 2D and vanish.

## Anti-patterns to avoid (3)

1. No usability warning ignored: prior Lane D research records Bruno Simon at Practicality 1 / Wow 5 in a 20-portfolio study. A drivable world that hides the content is a demo, not a portfolio. The fork needs the content reachable without driving.
2. No red import: `#ff0000` is Bruno's brand accent. The portfolio keeps the lane theme and blue accent.
3. No fixed-size type without a mobile pass: fixed sizes per breakpoint, no fluid type measured. A fork must add the fluid scale the source lacks.

## Do-not-copy list

Bruno Simon name and likeness, Three.js Journey branding, the drivable-world level design and car model, Amatic SC / Nunito font files (substitute Commit Mono), share image, favicons. No hotlinked assets.
