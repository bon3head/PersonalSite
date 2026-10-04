# Style Brief: Portfolio (v2)
Source: design-extract on corentinbernadou.com (Awwwards SOTD Mar 25 2026) and bruno-simon.com (Awwwards SOTD Jan 21 2026); both portfolio genre, three.js + GSAP.
Date: 2026-10-04. Raw artifacts: `~/workspace/portfolio/design-extract/`.

## Design language
Dark editorial instrument panel. Near-black warm canvas, one hot accent, flat material, hairline structure, tight Swiss typography. Restraint is the luxury: 7 total unique colors detected on the reference; nothing decorative survives without a job.

## Tokens
```css
:root {
  --bg-0: #070304;        /* page canvas (warm near-black) */
  --bg-1: #141414;        /* raised surfaces */
  --ink-0: #f5f5f5;       /* primary text */
  --ink-1: #858585;       /* secondary text */
  --ink-2: #575757;       /* tertiary / captions */
  --accent: #ff4401;      /* PLACEHOLDER: reference brand color, do not ship as-is */
  --accent-deep: #980000;
  --line: #1f1f1f;        /* hairline rules */
  --radius: 3px;          /* max radius anywhere */
  --space-base: 2px;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --dur-md: 300ms;
}
```
Accent judgment call (flagged): the reference ships red `#ff0000` as brand. Justin's site needs its own signal color. Proposal: signal amber `#ffb000` (instrumentation/lab connotation, fits "engineer who verifies"; AA on near-black at large sizes, check body sizes). Alternative: keep the red-orange family. Claude/Justin to lock.

## Typography
- Headings: tight, Title Case, semibold. Narrow measure for prose (~38-60ch).
- Type ladder (from bruno-simon, measured at true 1x; ratio ~1.25 major third from 16px): display 64 / title-1 50 / h2 40 / title-2 34 / title-3 30 / body 20 / body-sm 16 / micro 13 (bold). Line-height tight on headings (1.05-1.15), body 1.5-1.6.
- Body: neutral grotesk (embedded open-licensed equivalent; no proprietary font files). Display accent: one expressive face for the hero thesis line only (reference uses a handwritten display face; Justin's pick is a judgment call, must stay terse-compatible).
- Micro labels: uppercase, letterspaced, tertiary ink (section eyebrows, captions, receipts).

## Spacing and layout
- 2px base increments; section rhythm generous (reference: 21px vertical unit at its scale; translate to 8pt-ish rhythm at real scale).
- Narrow editorial content column for prose; full-bleed for dossier rows and the hero scene.
- 12-column grid discipline; hairline rules (`--line`) separate sections instead of cards.

## Material
- Flat. No shadows, no gradients, no glassmorphism, no backdrop blur. Radius 3px max on UI chrome (reference range 3-8px; media may go to 8px, never pill-shaped).
- Depth comes from the 3D scene and from layering ink tones, not from elevation tokens.
- Note: bruno-simon color tokens were noisy (extractor caught a loading state; 100% white dominance). Color system stays on the Bernadou-derived dark canvas; do not lift Bruno's red.

## Motion (from motion tokens)
- 300ms ease-out `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for UI feedback; "responsive" feel.
- Scroll-linked choreography for the hero rig and timeline (GSAP ScrollTrigger scrub).
- Matches the spec §8 budgets (welcome <1.4s, transitions 220ms).

## Stealable patterns
1. Hairline-ruled editorial sections with micro-label eyebrows.
2. Narrow prose measure with full-bleed media breaks.
3. Scroll-linked 3D geometry behind flat editorial content (depth without decoration).
4. Persistent micro-labels as wayfinding (section numbers, receipt tags).

## Anti-patterns to avoid (from this reference)
- Do not lift the red brand color or the issue-numbering editorial system ("Issue N°003") — that is Bernadou's identity.
- Do not copy the grid-ruler interaction or the cursor mask nav — signature interactions, not patterns.
- The reference's fixed tiny type scale is a zoom artifact; do not reproduce absolute px values.

## Do-not-copy list
Logos, brand marks, photography, the red `#ff0000` brand color, issue-numbering system, grid-ruler tool, cursor-mask nav, proprietary fonts. Substitute: open-licensed grotesk, Justin's own accent, original 3D rig.
