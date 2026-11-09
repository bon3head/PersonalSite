# Style brief: Lusion (lusion.co + Everswap + Spatial Fusion)

Extracted 2026-11-09 with the design-extract 12-stage fusion pipeline, `--motion-runtime` on. Run: `~/workspace/design-extract/lusion/`, VERIFY manifest `lusion-VERIFY.json`, exit 0, 151 files. Sources: https://lusion.co, https://lusion.co/projects/everswap, https://lusion.co/projects/spatial_fusion. Site consistency 71/100 (C): typography 100, colors 67, borders 67, spacing 47.

Method note, disclosed: the skill's stock browser (`/opt/meta-chromium/chrome`) exits 13 on this box, so the run used a scratch copy of the pipeline (`design-extract/lusion-run/bin/`) with the Chrome path pointed at Playwright's bundled Chromium. Skill files untouched. First run exit 2 (screenshots timed out waiting for fonts; designlang engine found no browser); second run exit 0 after the same one-line swap in the engine driver. Viewport proof shot caught the homepage mid-load (black WebGL hero, loading bar visible); the tokens below come from the stylesheets and the engine, not from that screenshot.

## Tokens

```css
:root {
  /* site-wide: neutrals + acid lime secondary */
  --bg: #ffffff;
  --surface: #f0f1fa;
  --ink: #000000;
  --ink-soft: #121416;
  --neutral-500: #34393f;
  --neutral-400: #9e9fa3;
  --lime: #c1ff00;            /* secondary, site-wide */
  --lime-50: #dfff9c;
  --lime-200: #beed62;

  /* per-page primary: one accent per page, intentional not drift */
  --primary-home: #1a2ffb;    /* lusion.co */
  --primary-everswap: #756acc;
  --primary-spatial: #7731e9;
  --accent-home: #0016ec;

  /* type */
  --font-sans: "Aeonik", system-ui, sans-serif; /* proprietary; substitute Inter or General Sans */
  --type-base: 38.4px;       /* display base, huge */
  --type-headings: tight, sentence case;

  /* spacing scale (base 2) */
  --space: 1, 20, 40, 49, 56, 64, 80, 96, 128, 136;

  /* radii */
  --radius-sm: 3px;
  --radius-md: 10px;
  --radius-lg: 15px;
  --radius-xl: 18px;
  --radius-full: 88px;       /* pill buttons */

  /* motion: the signature */
  --dur-xs: 100ms;
  --dur-sm: 200ms;
  --dur-md: 300ms;
  --dur-lg: 500ms;
  --ease-main: cubic-bezier(0.35, 0, 0, 1);   /* 32 uses, dominant */
  --ease-soft: cubic-bezier(0.4, 0, 0.1, 1);  /* 26 uses */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* links */
  --ease-base: ease;                            /* header color/opacity */
}
```

Contrast gate: PASS on all three pages (recomputed, no substitutions). Homepage primary #1a2ffb on white 7.39:1; lime #c1ff00 on black 17.57:1; Spatial Fusion #7731e9 on white 6.18:1; Everswap secondary #756acc on black 4.69:1.

## Motion (the part to steal)

Static inventory, identical on all three pages (one shared stylesheet, `about.CNa9RfUh.css`): 75 transition declarations, 9 durations, 7 easings, 2 keyframes. Runtime observation: 10 animations observed, triggers load + scroll, scroll-linked.

- **Two-easing system.** Almost everything runs on `cubic-bezier(0.35, 0, 0, 1)` (32) or `cubic-bezier(0.4, 0, 0.1, 1)` (26). Plain `ease` (23) is reserved for header color and opacity only. No springs anywhere.
- **400ms is the default.** 39 of 75 declarations. 300ms (19) for text and link underlines, 500ms (19) for logo and CTA hover states, 100ms (2) for micro-dots only.
- **Transform dominates.** 46 of 75 declarations animate transform; color 20, background 12, opacity 5. Motion is movement, not fades.
- **Long moves are slow and staggered.** Menu-open stagger runs 5000ms; end-section arrows run 3000ms with 150ms stagger over 5 items; parallax is scroll-linked, transform-only, 3000ms, linear. Runtime choreography observed on load and on scroll.
- **Keyframes:** exactly two, `arrow-animation` and `text-animation`. Nothing else animates by keyframe; everything else is a transition.
- **Hover is transform + color, never scale.** Interaction sampling: 12 elements, 0 computed-style deltas on hover/focus in the sampled set, the motion lives in the menu/CTA/header transitions, not in hover states.

## Patterns to steal

1. **One accent per page.** The site-wide system is neutral + acid lime; each page gets a single saturated primary (blue / violet / purple). Steal the rule, not the hexes.
2. **Pill CTAs with dot + arrow.** Radius 88px, 400-500ms transform/color transitions, arrow SVG that slides on hover. The CTA is the most repeated interactive pattern (15 button-context declarations).
3. **Full-screen menu with 5s stagger.** Menu links, newsletter, talk, and labs sections stagger in over 5000ms with the soft bezier. The long duration is the luxury signal.
4. **Scroll-linked end section.** Parallax transform, 3000ms, linear, 150ms stagger across 5 items. The page ends on motion, not on a footer block.
5. **Huge tight sentence-case type.** Base 38.4px display type, tight headings, friendly voice. The type scale does the hierarchy work so the palette can stay flat.

## Anti-patterns to avoid

1. **Do not copy the black hero.** The viewport proof shows the failure mode: a WebGL hero that renders black until it loads. If the canvas is the hero, ship a poster frame or a solid fallback behind it.
2. **Do not use the per-page accents as a palette.** #1a2ffb, #756acc, and #7731e9 are three separate page identities. Mixing them on one page reads as drift, which is exactly what the 67 colors score measures.
3. **Do not add springs or extra easings.** The system is two beziers plus ease. A third easing family breaks the feel immediately.

## Signature elements

None at signature tier. Highest scorers are supporting only: Buttons 46, Navigation 45, Inputs 41, Dropdowns 39. The distinctiveness is in motion and in the per-page accent, not in a named component. That is a finding, not a failure.

## Do not copy

Lusion logo and wordmark, project photography and video stills, the Aeonik font files (substitute an open grotesque), the WebGL hero scenes, project case-study copy. Patterns, tokens, durations, and easings above are the stealable layer.

## Artifacts

- Tokens: `page0/lusion-p0-design-tokens.json`, `page0/lusion-p0-motion-tokens.json`, `lusion-site-system.json`, `lusion-site-coverage.md`
- Motion: `lusion-p0-motion-fusion.json`, `lusion-p0-motion-static.json` (identical on all three pages), `page0/lusion-p0-motion.css`, `page0/lusion-p0-motion.framer.js`, `page0/lusion-p0-motion.gsap.js`
- Proof: `lusion-p0-viewport.png`, `lusion-p0-brand.png`, `lusion-p0-contrast.json`, `lusion-p0-signature.json`, `lusion-VERIFY.json`
- Engine packs: `page0/lusion-p0-DESIGN.md`, `page0/lusion-p0-AGENT.md`, Tailwind v4 / shadcn / Figma variables alongside
