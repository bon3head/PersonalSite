# Design Language: Bruno's

> Extracted from `https://bruno-simon.com/` on November 12, 2026
> 546 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#ff0000` | rgb(255, 0, 0) | hsl(0, 100%, 50%) | 1 |
| Secondary | `#ff6a7c` | rgb(255, 106, 124) | hsl(353, 100%, 71%) | 6 |
| Accent | `#251f2b` | rgb(37, 31, 43) | hsl(270, 16%, 15%) | 3 |

### Tonal Ramps

Generated in OKLCH from each role colour, so the steps are perceptually even. The site's own colour keeps its position in the ladder.

| Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| primary | `#ffccb8` | `#ffbba6` | `#ffa28d` | `#ff7c67` | `#ff4535` | **`#ff0000`** | `#d60000` | `#b40000` | `#980000` | `#7f0000` | `#4e0000` |
| secondary | `#ffd8dd` | `#ffc9cf` | `#ffb3bb` | `#ff939f` | **`#ff6a7c`** | `#d8465d` | `#bb3149` | `#9b1e38` | `#83112b` | `#6d0621` | `#42000e` |
| accent | `#f8f3fd` | `#ede7f2` | `#dcd6e2` | `#c4bdcb` | `#a39cab` | `#867e8d` | `#706977` | `#5a5460` | `#49444f` | `#3b3640` | **`#251f2b`** |
| neutral | `#f5f5f5` | `#eaeaea` | `#d9d9d9` | `#c0c0c0` | `#9f9f9f` | `#828282` | `#6c6c6c` | **`#555555`** | `#464646` | `#393939` | `#1f1f1f` |

### Semantic Pairs

| Role | Background | Foreground | Contrast | Level |
|------|------------|------------|----------|-------|
| `action.primary` | `#ff0000` | `#000000` | 5.25:1 | AA |
| `action.secondary` | `#ff6a7c` | `#000000` | 7.6:1 | AAA |
| `action.accent` | `#251f2b` | `#ffffff` | 16.04:1 | AAA |

### Dominance

Share of painted background area — what the page looks like, as opposed to what it declares most often.

- `#ffffff` — 100%

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#ffffff` | hsl(0, 0%, 100%) | 887 |
| `#000000` | hsl(0, 0%, 0%) | 126 |
| `#555555` | hsl(0, 0%, 33%) | 14 |
| `#141414` | hsl(0, 0%, 8%) | 12 |
| `#767676` | hsl(0, 0%, 46%) | 2 |

### Text Colors

Text color palette: `#000000`, `#ffffff`, `#ffceca`, `#ff6a7c`, `#ff87a2`, `#555555`

### Gradients

```css
background-image: radial-gradient(farthest-side at 0px 0px, rgb(37, 31, 43), rgb(29, 23, 33));
```

```css
background-image: linear-gradient(rgba(29, 23, 33, 0), rgba(29, 23, 33, 0.6));
```

```css
background-image: radial-gradient(at 100% 0px, rgb(194, 21, 21), rgb(70, 18, 59));
```

```css
background-image: radial-gradient(at 100% 0px, rgb(37, 31, 43), rgb(29, 23, 33));
```

```css
background-image: radial-gradient(at 0px 0px, rgb(37, 31, 43), rgb(29, 23, 33));
```

```css
background-image: linear-gradient(rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#ffffff` | text, border, background | 887 |
| `#000000` | text, border, background | 126 |
| `#ffceca` | text, border, background | 58 |
| `#555555` | border, text | 14 |
| `#141414` | background | 12 |
| `#ff87a2` | text, border | 12 |
| `#ff6a7c` | text, border | 6 |
| `#251f2b` | background | 3 |
| `#767676` | border | 2 |
| `#ff0000` | background | 1 |

## Typography

### Font Families

- **Nunito** — used for body (157 elements)
- **Amatic SC** — used for all (19 elements)

### Type System

- **Scale ratio** — 1.25 (major third), anchored at 16px · 89% of sizes sit on the ladder
- **Fluid type** — none; sizes are fixed per breakpoint

### Named Scale

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| `display` | 64px / 4rem | 700 | normal | normal |
| `title-1` | 50px / 3.125rem | 700 | normal | normal |
| `h2` | 40px / 2.5rem | 700 | normal | normal |
| `title-2` | 34px / 2.125rem | 700 | normal | normal |
| `title-3` | 30px / 1.875rem | 900 | normal | normal |
| `title-4` | 25px / 1.5625rem | 700 | normal | 8px |
| `body` | 20px / 1.25rem | 400 | normal | normal |
| `body-sm` | 16px / 1rem | 400 | 20px | normal |
| `micro` | 13px / 0.8125rem | 700 | normal | normal |

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 64px | 4rem | 700 | normal | normal | div, button |
| 50px | 3.125rem | 700 | normal | normal | div, span, img |
| 40px | 2.5rem | 700 | normal | normal | h2 |
| 34px | 2.125rem | 700 | normal | normal | div |
| 30px | 1.875rem | 900 | normal | normal | span |
| 25px | 1.5625rem | 700 | normal | 8px | input |
| 20px | 1.25rem | 400 | normal | normal | html, head, meta, title |
| 16px | 1rem | 400 | 20px | normal | div, strong, table, tbody |
| 13px | 0.8125rem | 700 | normal | normal | span |

### Heading Scale

```css
h2 { font-size: 40px; font-weight: 700; line-height: normal; }
```

### Body Text

```css
body { font-size: 20px; font-weight: 400; line-height: normal; }
```

### Font Weights in Use

`400` (448x), `700` (96x), `500` (1x), `900` (1x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-3 | 3px | 0.1875rem |
| spacing-8 | 8px | 0.5rem |
| spacing-20 | 20px | 1.25rem |
| spacing-25 | 25px | 1.5625rem |
| spacing-30 | 30px | 1.875rem |
| spacing-34 | 34px | 2.125rem |
| spacing-38 | 38px | 2.375rem |
| spacing-50 | 50px | 3.125rem |
| spacing-80 | 80px | 5rem |
| spacing-90 | 90px | 5.625rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 4px | 34 |
| md | 8px | 19 |
| lg | 15px | 4 |

## Transitions & Animations

**Durations:** `0.15s`, `0.3s`

### Common Transitions

```css
transition: all;
transition: transform 0.15s 0.15s;
transition: opacity 0.3s;
transition: transform 0.15s;
transition: opacity 0.3s 0.3s;
transition: opacity 0.15s;
transition: 0.15s 0.15s;
transition: 0.15s;
```

### Keyframe Animations

**map-player-animation**
```css
@keyframes map-player-animation {
  0% { transform: scale(1); }
  20% { transform: scale(1.2); }
  40% { transform: scale(1); }
  60% { transform: scale(1.2); }
  80% { transform: scale(1); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (43 instances)

```css
.buttons {
  background-color: rgb(37, 31, 43);
  color: rgb(255, 255, 255);
  font-size: 20px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Inputs (4 instances)

```css
.inputs {
  color: rgb(255, 255, 255);
  border-color: rgb(255, 255, 255);
  border-radius: 0px;
  font-size: 16px;
  padding-top: 4px;
  padding-right: 35px;
}
```

### Links (19 instances)

```css
.links {
  color: rgb(255, 255, 255);
  font-size: 20px;
  font-weight: 700;
}
```

### Navigation (12 instances)

```css
.navigation {
  color: rgb(255, 255, 255);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: relative;
}
```

### Modals (5 instances)

```css
.modals {
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
  max-width: 800px;
}
```

### Dropdowns (2 instances)

```css
.dropdowns {
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

### Tables (5 instances)

```css
.tables {
  border-color: rgb(255, 255, 255);
  cell-style: [object Object];
}
```

### Tabs (3 instances)

```css
.tabs {
  color: rgb(255, 255, 255);
  font-size: 20px;
  font-weight: 400;
  padding-top: 10px;
  padding-right: 0px;
  border-color: rgb(255, 255, 255);
  border-radius: 0px;
}
```

### Tooltips (24 instances)

```css
.tooltips {
  background-color: rgb(20, 20, 20);
  color: rgb(255, 255, 255);
  font-size: 20px;
  border-radius: 6px;
  padding-top: 0px;
  padding-right: 15px;
}
```

### ProgressBars (1 instances)

```css
.progressBars {
  color: rgb(255, 255, 255);
  border-radius: 0px;
  font-size: 20px;
}
```

### Switches (2 instances)

```css
.switches {
  border-radius: 8px;
  border-color: rgba(255, 255, 255, 0.8);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 0, 0);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 0, 0);
  font-size: 20px;
  font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 0, 0);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 0, 0);
  font-size: 20px;
  font-weight: 400;
```

## Layout System

**0 grid containers** and **56 flex containers** detected.

### The System

- **Gap scale** — 3px · 10px · 30px
- **Fluid layout** — 4 clamp/viewport declarations

```css
.menu .inner { width: calc(-10px + 100vw); }
.menu .contents .content-inner { width: calc(0.5 * min(1000px, -120px + 100vw)); }
.menu .contents .content-inner { width: calc(-10px + 100vw); }
.map { max-width: 100vmin; }
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 49x |
| column/nowrap | 7x |

**Gap values:** `3px`, `10px`, `30px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 2 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#ffceca` | `#251f2b` | 11.4:1 | AAA |

## Design System Score

**Overall: 90/100 (Grade: A)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 90/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 85/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 50/100 |

**Strengths:** Tight, disciplined color palette, Consistent typography system, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance

**Issues:**
- 6 !important rules — prefer specificity over overrides
- 91% of CSS is unused — consider purging
- 863 duplicate CSS declarations

## Gradients

**6 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| radial | — | 3 | bold |
| linear | — | 2 | brand |
| radial | at 100% 0px | 2 | brand |
| radial | at 100% 0px | 2 | brand |
| radial | at 0px 0px | 2 | brand |
| linear | — | 2 | brand |

```css
background: radial-gradient(farthest-side at 0px 0px, rgb(37, 31, 43), rgb(29, 23, 33));
background: linear-gradient(rgba(29, 23, 33, 0), rgba(29, 23, 33, 0.6));
background: radial-gradient(at 100% 0px, rgb(194, 21, 21), rgb(70, 18, 59));
background: radial-gradient(at 100% 0px, rgb(37, 31, 43), rgb(29, 23, 33));
background: radial-gradient(at 0px 0px, rgb(37, 31, 43), rgb(29, 23, 33));
```

## Z-Index Map

**2 unique z-index values** across 1 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| base | 1,9 | div.t.o.o.l.t.i.p, div.t.o.o.l.t.i.p, div.t.o.o.l.t.i.p |

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| Pally-Regular | self-hosted | 400 | normal |
| Pally-Medium | self-hosted | 500 | normal |
| Pally-Bold | self-hosted | 700 | normal |
| Amatic SC | google-fonts | 700 | normal |
| Nunito | google-fonts | 400, 700, 900 | normal |

**Google Fonts URL:** `https://fonts.googleapis.com/`

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 1 | objectFit: fill, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (1x)

## Motion Language

**Feel:** mixed · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `150ms` | 150 |
| `md` | `300ms` | 300 |

## Component Anatomy

### button — 4 instances

**Slots:** label

## Page Intent

**Type:** `landing` (confidence 0.45)
**Description:** Bruno Simon's creative portfolio

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.254 |
| Shadow profile | none |
| Avg shadow blur | 0px |
| Max radius | 15px |
| backdrop-filter in use | no |
| Gradients | 6 |

## Imagery Style

**Label:** `mixed` (confidence 0.6)
**Counts:** total 1, svg 1, icon 1, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Nunito` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
