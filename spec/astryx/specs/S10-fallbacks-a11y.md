# S10 Fallbacks and accessibility: the site with the world turned off

Version 1.0.0, 2026-10-30. Depends on: S02 to S09. Blocks: S11.

## 1. Purpose

The world is the signature, not the content. Everything a visitor needs (who Justin is, what he built, how to reach him) must work with JavaScript off, with WebGL2 missing, with reduced motion on, with a screen reader, with a keyboard only, and on a slow phone. This spec defines each degraded mode and the posters that stand in for the world.

## 2. Modes

| Mode | Detection | Behavior |
|---|---|---|
| No JS | n/a | Prerendered HTML for each route (S03 section 7). Readout text, links, keymap as plain links. Poster image of the scene behind the readout (`<img>` in `#world` with `alt=""` because the region label carries the description). Sheets are unavailable without JS, so the prerendered HTML includes a `<noscript>` block below the readout with C-WHO-* and C-CON-* content as plain text and links (the email as a `mailto:` link). |
| No WebGL2 | `createLanefield` returns null, or `?world=0` | Poster per scene, crossfading with the readout on travel (reduced-motion timing). C-NOGL shown once as a supporting line under the readout. All interactions that are world-only (LeafLink offers, SideQuests walks) are hidden: `OfferButton` and marker twins are not rendered, and C-LL-SIM and C-SQ-HINT are not rendered. |
| Reduced motion | `prefers-reduced-motion: reduce` via the standard listener (`src/lib/reducedMotion.ts`, verbatim from the repo's standard implementations); reacts live to changes | DESIGN section 6.4 table. The world renders in demand mode. |
| Reduced transparency or more contrast | `prefers-contrast: more` | Lane alphas multiplied by 1.4 (capped at 1) via a uniform scale, hairlines at 30%. Text colors unchanged (they already pass). |
| Save data | `navigator.connection?.saveData === true` | The world does not load; posters are used (same as no WebGL2, without C-NOGL; instead nothing extra is shown). |
| Context lost | S02 section 11 | Poster under the canvas until restored. |

## 3. Posters (`tools/posters.mjs`)

At build time, run the built site in Playwright Chromium (`executablePath: '/opt/pw-browsers/chromium'` in cloud runners if the bundled one is missing) with `?posters=1`, which: forces reduced motion (the frozen diorama), hides the DOM chrome, waits for `__lanefield.ready`, and screenshots the canvas at 1440 by 900 (fine pose) and 390 by 844 at DPR 2 (coarse pose) for each of the four layouts. Encode as WebP quality 72. Write `public/posters/{scene}-{fine|coarse}.webp`. Budget: each under 90 KB (the frozen field compresses well; if over, lower quality to 60, never resize below the viewport). Serve with `<picture>` and a `(max-width: 767px)` media query. Posters load lazily (`loading="lazy"`, `fetchpriority="low"`) and never compete with the font or the H1 for first paint; in the normal path they are never requested at all (the world mount decides at runtime whether to insert the `<img>`).

## 4. Screen readers

- The world container is `aria-hidden="true"`. Each scene's `<main>` contains a `role="img"` element with the scene's ALT string (S09) so the drawing is described once, in words, and only the drawing.
- Heading structure per route: one `h1` (the readout heading), sheets use `h2`.
- Travel announces the new scene H1 through the polite live region (S03).
- Marker twins: `aria-pressed` for claimed. OfferButton: plain button, no live announcement (the legend explains the drawing; spamming route announcements every second would be noise).
- The keymap uses `aria-current="page"` for the active scene and `aria-expanded` for panels.

## 5. Keyboard

Every action has a key path: scenes `1 2 3` and arrows, panels `w c`, `Escape` closes, `Tab` reaches every link, the OfferButton and the three marker twins. Focus is always visible (`:focus-visible` ring from Astryx focus tokens). Focus never lands on the canvas.

## 6. Kill criteria

- K-S10-1: any fact on the site that is reachable only through the world (every number and name in the scenes must also be in DOM text).
- K-S10-2: JS-off view of any route is missing the readout, the keymap, or a way to the email address.
- K-S10-3: axe reports any violation in any mode.
- K-S10-4: reduced motion still moves anything other than opacity crossfades.

## 7. Receipts

| Test | Claim | How |
|---|---|---|
| T-S10-1 | No-JS complete | Playwright with `javaScriptEnabled: false` on all four routes: H1 present, keymap links present, `mailto:` link present, poster `<img>` present |
| T-S10-2 | No-WebGL path | `?world=0`: C-NOGL visible, no OfferButton, no twins, travel works with poster crossfade |
| T-S10-3 | Reduced motion is still | `reducedMotion: 'reduce'`: two screenshots 2s apart on each scene are pixel-identical |
| T-S10-4 | axe in every mode | axe on each route in normal, no-JS, no-WebGL and reduced modes: zero violations |
| T-S10-5 | Posters in budget | each poster file under 90 KB |
| T-S10-6 | Posters stay out of the normal path | normal load of `/` with WebGL2: zero requests to `/posters/` |

## 8. Unknowns

U-S10-1: VoiceOver on iOS behavior with `BottomSheet` is Astryx's responsibility; check once on a real device (manual, S11 G-DEVICE).

## 9. Changelog

- 1.0.0, 2026-10-30: initial.
