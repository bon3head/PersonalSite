# Design Language: Corentin Bernadou · Freelance Developer

> Extracted from `https://corentinbernadou.com/` on November 12, 2026
> 899 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#ff0000` | rgb(255, 0, 0) | hsl(0, 100%, 50%) | 12 |
| Secondary | `#ff4401` | rgb(255, 68, 1) | hsl(16, 100%, 50%) | 11 |

### Tonal Ramps

Generated in OKLCH from each role colour, so the steps are perceptually even. The site's own colour keeps its position in the ladder.

| Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| primary | `#ffccb8` | `#ffbba6` | `#ffa28d` | `#ff7c67` | `#ff4535` | **`#ff0000`** | `#d60000` | `#b40000` | `#980000` | `#7f0000` | `#4e0000` |
| secondary | `#ffd3b6` | `#ffc3a3` | `#ffac89` | `#ff8a62` | **`#ff4401`** | `#eb2d00` | `#cc0900` | `#ab0000` | `#900000` | `#780000` | `#490000` |
| neutral | `#f5f5f5` | `#eaeaea` | `#d9d9d9` | `#c0c0c0` | `#9f9f9f` | `#828282` | **`#767676`** | `#575757` | `#464646` | `#393939` | `#1f1f1f` |

### Semantic Pairs

| Role | Background | Foreground | Contrast | Level |
|------|------------|------------|----------|-------|
| `surface.page` | `#070304` | `#ff4401` | 5.94:1 | AA |
| `surface.raised` | `#ff0000` | `#000000` | 5.25:1 | AA |
| `action.primary` | `#ff0000` | `#000000` | 5.25:1 | AA |
| `action.secondary` | `#ff4401` | `#000000` | 6.08:1 | AA |

### Dominance

Share of painted background area — what the page looks like, as opposed to what it declares most often.

- `#000000` — 80%
- `#ff0000` — 20%
- `#858585` — 0%
- `#ff4401` — 0%

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#767676` | hsl(0, 0%, 46%) | 1108 |
| `#6d6d6d` | hsl(0, 0%, 43%) | 584 |
| `#000000` | hsl(0, 0%, 0%) | 84 |
| `#141414` | hsl(0, 0%, 8%) | 10 |
| `#858585` | hsl(0, 0%, 52%) | 5 |

### Background Colors

Used on large-area elements: `#070304`, `#ff0000`

### Text Colors

Text color palette: `#000000`, `#6d6d6d`, `#ff4401`, `#858585`, `#767676`, `#141414`

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#767676` | text, border | 1108 |
| `#6d6d6d` | text, border | 584 |
| `#000000` | text, border, background | 84 |
| `#ff0000` | background | 12 |
| `#ff4401` | text, border, background | 11 |
| `#141414` | text, border | 10 |
| `#858585` | text, border, background | 5 |

## Typography

### Type System

- **Scale ratio** — 1.125 (major second), anchored at 5.92593px · 100% of sizes sit on the ladder
- **Measure** — ~38 characters per line (narrow)
- **Fluid type** — none; sizes are fixed per breakpoint

### Named Scale

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| `display` | 13.545px / 0.8466rem | 600 | 17.6085px | -0.203175px |
| `title-1` | 11.8519px / 0.7407rem | 600 | 15.4074px | -0.203175px |
| `h1` | 10.1587px / 0.6349rem | 600 | 13.2064px | -0.203175px |
| `body-sm` | 9.31217px / 0.582rem | 600 | 12.1058px | -0.203175px |
| `micro` | 8.46561px / 0.5291rem | 400 | normal | normal |
| `sm-3` | 5.92593px / 0.3704rem | 700 | 5.92593px | -0.118519px |

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 13.545px | 0.8466rem | 600 | 17.6085px | -0.203175px | div |
| 11.8519px | 0.7407rem | 600 | 15.4074px | -0.203175px | a, span |
| 10.1587px | 0.6349rem | 600 | 13.2064px | -0.203175px | body, header, div, button |
| 9.31217px | 0.582rem | 600 | 12.1058px | -0.203175px | div, span |
| 8.46561px | 0.5291rem | 400 | normal | normal | html, head, meta, title |
| 5.92593px | 0.3704rem | 700 | 5.92593px | -0.118519px | text |

### Heading Scale

```css
h1 { font-size: 10.1587px; font-weight: 600; line-height: 13.2064px; }
```

### Body Text

```css
body { font-size: 10.1587px; font-weight: 600; line-height: 13.2064px; }
```

### Font Weights in Use

`600` (837x), `400` (41x), `700` (21x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-2 | 2px | 0.125rem |
| spacing-21 | 21px | 1.3125rem |
| spacing-42 | 42px | 2.625rem |
| spacing-100 | 100px | 6.25rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 3px | 1 |

## CSS Custom Properties

### Colors

```css
--document-background-color: #070304;
--cross-color: #CACACA;
```

### Other

```css
--vh: 100vh;
--vw: 100vw;
--gutter: 3rem;
--canvas-z-index: 1;
--fs-mobile: 2.5vw;
--fs-tablet: calc(100vw / 768 * 10);
--fs-laptop: calc(100vw / 1512 * 10);
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| md | 768px | min-width |
| lg | 1024px | min-width |
| 1920px | 1920px | min-width |

## Transitions & Animations

**Easing functions:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

**Durations:** `0.3s`

### Common Transitions

```css
transition: all;
transition: opacity 0.3s;
transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
transition: color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Keyframe Animations

**pulse**
```css
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}
```

**nw-marquee**
```css
@keyframes nw-marquee {
  0% { transform: translate(0px); }
  100% { transform: translate(-100%); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (1 instances)

```css
.buttons {
  color: rgb(133, 133, 133);
  font-size: 10.1587px;
  font-weight: 600;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Links (183 instances)

```css
.links {
  color: rgb(118, 118, 118);
  font-size: 11.8519px;
  font-weight: 600;
}
```

### Navigation (10 instances)

```css
.navigation {
  color: rgb(109, 109, 109);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Modals (1 instances)

```css
.modals {
  background-color: rgb(7, 3, 4);
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Badges (2 instances)

```css
.badges {
  color: rgb(255, 68, 1);
  font-size: 13.545px;
  font-weight: 600;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(133, 133, 133);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(133, 133, 133);
  font-size: 10.1587px;
  font-weight: 600;
```

## Layout System

**1 grid containers** and **10 flex containers** detected.

### The System

- **Content column** — 692px wide
- **Column system** — 12 columns (canonical page grid)
- **Section rhythm** — 21px vertical padding (ladder: 21px)
- **Gap scale** — 4.2328px · 8.46561px · 29.6296px · 108.36px

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 692.487px | 0px |
| 192.169px | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 12-column | 1x |

### Grid Templates

```css
grid-template-columns: 91.8594px 91.8594px 91.875px 91.8594px 91.875px 91.8594px 91.8594px 91.875px 91.8594px 91.875px 91.8594px 91.8594px;
gap: 8.46561px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 2x |
| row/wrap | 4x |
| column/nowrap | 4x |

**Gap values:** `4.2328px`, `8.46561px`, `29.6296px`, `108.36px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 0 passing, 0 failing color pairs

## Design System Score

**Overall: 91/100 (Grade: A)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 100/100 |
| Spacing System | 85/100 |
| Shadow Consistency | 85/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 75/100 |

**Strengths:** Tight, disciplined color palette, Consistent typography system, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 71% of CSS is unused — consider purging
- 543 duplicate CSS declarations

## Z-Index Map

**7 unique z-index values** across 4 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 1000,1000 | div.g.r.i.d.-.h.e.l.p.e.r |
| dropdown | 100,100 | div.p.r.e.l.o.a.d.e.r, header.h.e.a.d.e.r, div.g.r.i.d.-.r.u.l.e.s |
| sticky | 10,11 | div.f.w.-.w.o.r.k.s, div, div |
| base | 0,2 | div.f.w._._.o.v.e.r.l.a.y, button.d.i.m.e.n.s.i.o.n.s. .o.-.h.i.d.d.e.n, div.f.w.-.t.i.t.l.e.s |

## SVG Icons

**1 unique SVG icons** detected. Dominant style: **outlined**.

| Size Class | Count |
|------------|-------|
| lg | 1 |

**Icon colors:** `currentColor`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| H | self-hosted | 100 900 | normal |

## Motion Language

**Feel:** responsive · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `md` | `300ms` | 300 |

### Easing Families

- **ease-out** (360 uses) — `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `pulse` | fade | opacity | 1 |

## Brand Voice

**Tone:** neutral · **Pronoun:** third-person · **Headings:** Title Case (tight)

### Top CTA Verbs

- **px** (1)

### Button Copy Patterns

- "1280px × 800px" (1×)

### Sample Headings

> Corentin Bernadou
> Freelance Developer

## Page Intent

**Type:** `landing` (confidence 0.31)
**Description:** Freelance creative developer Corentin Bernadou crafts expressive, animation-driven interactive experiences with clean visuals and precise motion.

Alternates: blog-post (0.35)

## Section Roles

Reading order (top→bottom): feature-grid → pricing → nav

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | feature-grid | — | 0.8 |
| 1 | nav | — | 0.9 |
| 2 | pricing | Corentin Bernadou | 0.4 |

## Material Language

**Label:** `flat` (confidence 0.55)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.285 |
| Shadow profile | none |
| Avg shadow blur | 0px |
| Max radius | 3px |
| backdrop-filter in use | no |
| Gradients | 0 |

## Quick Start

To recreate this design in a new project:

2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
