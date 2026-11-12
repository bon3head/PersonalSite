# Design Language: Good Stuff · PixiJS

> Extracted from `https://goodstuff.pixijs.io/` on November 12, 2026
> 203 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#e91e63` | rgb(233, 30, 99) | hsl(340, 82%, 52%) | 36 |
| Secondary | `#ffa838` | rgb(255, 168, 56) | hsl(34, 100%, 61%) | 1 |
| Accent | `#ef4d95` | rgb(239, 77, 149) | hsl(333, 84%, 62%) | 1 |

### Tonal Ramps

Generated in OKLCH from each role colour, so the steps are perceptually even. The site's own colour keeps its position in the ladder.

| Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| primary | `#ffcee1` | `#ffbdd3` | `#ffa6c0` | `#ff82a4` | `#ff5181` | **`#e91e63`** | `#ca004f` | `#a9003d` | `#8e0030` | `#760025` | `#480011` |
| secondary | `#ffeab1` | `#ffdd9e` | `#ffcb82` | **`#ffa838`** | `#dc8b13` | `#bd6b00` | `#a25600` | `#864200` | `#713400` | `#5d2800` | `#371300` |
| accent | `#ffd2f7` | `#ffc3eb` | `#ffacda` | `#ff8bc2` | **`#ef4d95`** | `#da3884` | `#bc206d` | `#9d0758` | `#840048` | `#6e003a` | `#42001f` |

### Semantic Pairs

| Role | Background | Foreground | Contrast | Level |
|------|------------|------------|----------|-------|
| `surface.page` | `#0d0b16` | `#ffffff` | 19.51:1 | AAA |
| `action.primary` | `#e91e63` | `#000000` | 4.83:1 | AA * |
| `action.secondary` | `#ffa838` | `#000000` | 10.91:1 | AAA * |
| `action.accent` | `#ef4d95` | `#000000` | 6.17:1 | AA * |

\* No colour the site already uses for text reaches 4.5:1 on that surface — the foreground shown is black or white, substituted in.

### Dominance

Share of painted background area — what the page looks like, as opposed to what it declares most often.

- `#0c0b12` — 99%
- `#e91e63` — 1%
- `#ffffff` — 0%

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#ffffff` | hsl(0, 0%, 100%) | 379 |

### Background Colors

Used on large-area elements: `#0d0b16`

### Text Colors

Text color palette: `#ffffff`, `#e91e63`

### Gradients

```css
background-image: linear-gradient(rgba(13, 11, 22, 0), rgb(13, 11, 22) 176px);
```

```css
background-image: radial-gradient(90% 120% at 50% 0%, rgba(233, 30, 99, 0.24), rgba(0, 0, 0, 0) 60%), linear-gradient(rgba(42, 33, 70, 0.5), rgba(14, 11, 26, 0.8));
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#ffffff` | text, border, background | 379 |
| `#e91e63` | background, text, border | 36 |
| `#0c0b12` | background | 31 |
| `#ef4d95` | background | 1 |
| `#8b5cf6` | background | 1 |
| `#5b7fd6` | background | 1 |
| `#d6b84a` | background | 1 |
| `#ffa838` | background | 1 |

## Typography

### Font Families

- **Roboto** — used for all (31 elements)
- **Outfit** — used for all (20 elements)
- **Roboto Mono** — used for mono (23 elements)

### Type System

- **Scale ratio** — irregular (11 distinct sizes, no modular ratio fits)
- **Measure** — ~56 characters per line (comfortable, medium confidence from 3 samples)
- **Fluid type** — 2 clamp/viewport font sizes, 16px → 20px

### Named Scale

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| `h2` | 115.2px / 7.2rem | 700 | 109.44px | -4.608px |
| `title-1` | 76.8px / 4.8rem | 700 | 76.8px | -2.688px |
| `h1` | 69.12px / 4.32rem | 700 | 60.8256px | -2.4192px |
| `title-2` | 28px / 1.75rem | 700 | 29.4px | normal |
| `title-3` | 24px / 1.5rem | 700 | normal | normal |
| `title-4` | 17.92px / 1.12rem | 400 | 28.672px | normal |
| `title-5` | 16px / 1rem | 400 | normal | normal |
| `title-6` | 15px / 0.9375rem | 600 | 15px | normal |
| `title-7` | 14px / 0.875rem | 600 | normal | normal |
| `title-8` | 12px / 0.75rem | 600 | 12px | 1.44px |
| `body` | 11px / 0.6875rem | 600 | 11px | 1.1px |

### Fluid Declarations

```css
.section-lede { font-size: clamp(17px, 1.4vw, 20px); }
.lede { font-size: clamp(16px, 1.25vw, 19px); }
```

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 115.2px | 7.2rem | 700 | 109.44px | -4.608px | h2, div, span |
| 76.8px | 4.8rem | 700 | 76.8px | -2.688px | h2, span, svg, path |
| 69.12px | 4.32rem | 700 | 60.8256px | -2.4192px | h1, div, span |
| 28px | 1.75rem | 700 | 29.4px | normal | strong |
| 24px | 1.5rem | 700 | normal | normal | h2 |
| 17.92px | 1.12rem | 400 | 28.672px | normal | p |
| 16px | 1rem | 400 | normal | normal | html, head, meta, title |
| 15px | 0.9375rem | 600 | 15px | normal | a, svg, path, span |
| 14px | 0.875rem | 600 | normal | normal | a, span, svg, path |
| 12px | 0.75rem | 600 | 12px | 1.44px | p, a |
| 11px | 0.6875rem | 600 | 11px | 1.1px | li, p, span, svg |

### Heading Scale

```css
h2 { font-size: 115.2px; font-weight: 700; line-height: 109.44px; }
h2 { font-size: 76.8px; font-weight: 700; line-height: 76.8px; }
h1 { font-size: 69.12px; font-weight: 700; line-height: 60.8256px; }
h2 { font-size: 24px; font-weight: 700; line-height: normal; }
```

### Body Text

```css
body { font-size: 11px; font-weight: 600; line-height: 11px; }
```

### Font Weights in Use

`400` (112x), `600` (49x), `700` (38x), `500` (4x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-5 | 5px | 0.3125rem |
| spacing-38 | 38px | 2.375rem |
| spacing-56 | 56px | 3.5rem |
| spacing-64 | 64px | 4rem |
| spacing-72 | 72px | 4.5rem |
| spacing-112 | 112px | 7rem |
| spacing-176 | 176px | 11rem |
| spacing-192 | 192px | 12rem |
| spacing-208 | 208px | 13rem |
| spacing-234 | 234px | 14.625rem |
| spacing-258 | 258px | 16.125rem |
| spacing-338 | 338px | 21.125rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| lg | 16px | 5 |
| full | 26px | 5 |
| full | 44px | 1 |
| full | 50px | 5 |
| full | 999px | 32 |

## Elevation

2 levels from 5 raw shadows · colored tint

**xs** — blur 0px, y 3px, used 1×
```css
box-shadow: rgba(255, 255, 255, 0.18) 3px 3px 0px 0px;
```

**sm** — blur 22px, y 8px, used 1× · tinted (hue 340°)
```css
box-shadow: rgba(233, 30, 99, 0.35) 0px 8px 22px 0px;
```

## Inset Shadows

```css
box-shadow: rgb(233, 30, 99) 0px 0px 0px 2px inset;
```

```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 2px inset;
```

```css
box-shadow: rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(4, 2, 12, 0.9) 0px 40px 80px -30px;
```

## CSS Custom Properties

### Colors

```css
--spring: cubic-bezier(.34, 1.56, .64, 1);
```

### Other

```css
--pink: #e91e63;
--pink-deep: #c2185b;
--pink-light: #f06695;
--violet: #8b5cf6;
--lilac: #b79cf9;
--sky: #38bdf8;
--orange: #f2a65a;
--ground: #0d0b16;
--surface: #15151d;
--surface-raised: #1c1b27;
--line: rgba(255, 255, 255, .09);
--ink: #fff;
--ink-soft: rgba(255, 255, 255, .74);
--ink-faint: rgba(255, 255, 255, .5);
--display: "Outfit", system-ui, sans-serif;
--body: "Roboto", system-ui, sans-serif;
--mono: "Roboto Mono", ui-monospace, monospace;
--ease: cubic-bezier(.215, .61, .355, 1);
--gutter: clamp(16px, 3.2vw, 44px);
--topbar: 76px;
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 520px | max-width |
| 860px | 860px | max-width |

## Transitions & Animations

**Easing functions:** `cubic-bezier(0.34, 1.56, 0.64, 1)`, `cubic-bezier(0.215, 0.61, 0.355, 1)`

**Durations:** `0.3s`, `0.4s`, `0.5s`, `0.45s`, `0.25s`, `0.35s`

### Common Transitions

```css
transition: all;
transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s cubic-bezier(0.215, 0.61, 0.355, 1), background 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s cubic-bezier(0.215, 0.61, 0.355, 1), border-color 0.25s cubic-bezier(0.215, 0.61, 0.355, 1);
transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.25s cubic-bezier(0.215, 0.61, 0.355, 1);
transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), text-shadow 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (2 instances)

```css
.buttons {
  background-color: rgba(20, 18, 30, 0.55);
  color: rgb(255, 255, 255);
  font-size: 16px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 50%;
}
```

### Cards (6 instances)

```css
.cards {
  border-radius: 0px;
  box-shadow: rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(4, 2, 12, 0.9) 0px 40px 80px -30px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (21 instances)

```css
.links {
  color: rgb(255, 255, 255);
  font-size: 14px;
  font-weight: 400;
}
```

### Navigation (1 instances)

```css
.navigation {
  color: rgb(255, 255, 255);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: absolute;
}
```

### Footer (1 instances)

```css
.footer {
  background-color: rgb(13, 11, 22);
  color: rgba(255, 255, 255, 0.5);
  padding-top: 56px;
  padding-bottom: 64px;
  font-size: 14px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(20, 18, 30, 0.55);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 16px;
  font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 72px 64px 72px 64px;
  border-radius: 44px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 400;
```

## Layout System

**13 grid containers** and **23 flex containers** detected.

### The System

- **Content column** — 1009px wide, 64px gutters (6% edge density)
  - Width ladder: 665px · 1009px · 1180px
- **Column system** — 2 columns
- **Section rhythm** — 176px vertical padding (ladder: 56px · 64px · 72px · 112px · 176px)
- **Gap scale** — 8px · 10px · 12px · 14px · 18px
- **Fluid layout** — 4 clamp/viewport declarations

```css
.hero-copy { max-width: min(560px, 70vw); }
.about { padding: clamp(120px,24vh,240px) var(--gutter) clamp(140px,22vh,240px); }
.closing { padding: clamp(160px,26vh,280px) var(--gutter) clamp(80px,14vh,160px); }
.closing-card { padding: clamp(56px, 9vh, 96px) clamp(24px, 5vw, 72px); }
```

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 1180px | 0px |
| 664.906px | 0px |
| 1040px | 64px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 1-column | 7x |
| 2-column | 1x |

### Grid Templates

```css
grid-template-columns: 1198.09px;
gap: 14px;
grid-template-columns: 599.047px 599.047px;
grid-template-columns: 54px;
gap: 12px;
grid-template-columns: 52px;
grid-template-columns: 52px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 12x |
| row/wrap | 11x |

**Gap values:** `8px`, `10px`, `12px`, `14px`, `18px`

## Accessibility (WCAG 2.1)

**Overall Score: 0%** — 0 passing, 6 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio | Level | Used On |
|------------|------------|-------|-------|---------|
| `#ffffff` | `#e91e63` | 4.35:1 | FAIL | a (1x) |
| `#ffffff` | `#ef4d95` | 3.41:1 | FAIL | span (1x) |
| `#ffffff` | `#8b5cf6` | 4.23:1 | FAIL | span (1x) |
| `#ffffff` | `#5b7fd6` | 3.85:1 | FAIL | span (1x) |
| `#ffffff` | `#d6b84a` | 1.94:1 | FAIL | span (1x) |
| `#ffffff` | `#ffa838` | 1.92:1 | FAIL | span (1x) |

## Design System Score

**Overall: 79/100 (Grade: C)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 80/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 100/100 |
| Border Radius Consistency | 90/100 |
| Accessibility | 0/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Clean elevation system, Consistent border radii, Good CSS variable tokenization

**Issues:**
- 6 WCAG contrast failures
- 164 duplicate CSS declarations

## Gradients

**3 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | — | 2 | brand |
| radial | — | 3 | bold |
| linear | — | 2 | brand |

```css
background: linear-gradient(rgba(13, 11, 22, 0), rgb(13, 11, 22) 176px);
background: radial-gradient(90% 120% at 50% 0%, rgba(233, 30, 99, 0.24), rgba(0, 0, 0, 0) 60%);
background: linear-gradient(rgba(42, 33, 70, 0.5), rgba(14, 11, 26, 0.8));
```

## Z-Index Map

**6 unique z-index values** across 3 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| dropdown | 100,100 | a.s.k.i.p.-.l.i.n.k |
| sticky | 20,50 | header.t.o.p.b.a.r, div.c.u.r.s.o.r, div.c.u.r.t.a.i.n |
| base | 0,1 | div.s.t.a.g.e, section.h.e.r.o, section.a.b.o.u.t |

## SVG Icons

**6 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| sm | 6 |

**Icon colors:** `currentColor`, `rgb(0, 0, 0)`, `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| Outfit | self-hosted | 100 900 | normal |
| Roboto | self-hosted | 400, 600 | normal |
| Roboto Mono | self-hosted | 100 700 | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 5 | objectFit: fill, borderRadius: 0px, shape: square |

**Aspect ratios:** 2.53:1 (2x), 1:1 (2x), 4:3 (1x)

## Motion Language

**Feel:** springy · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `sm` | `250ms` | 250 |
| `md` | `300ms` | 300 |
| `lg` | `450ms` | 450 |

### Easing Families

- **spring** (31 uses) — `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **ease-out** (21 uses) — `cubic-bezier(0.215, 0.61, 0.355, 1)`

### Spring / Overshoot Easings

- `cubic-bezier(0.34, 1.56, 0.64, 1)`

## Component Anatomy

### button — 2 instances

**Slots:** label, icon

## Brand Voice

**Tone:** friendly · **Pronoun:** third-person · **Headings:** Sentence case (tight)

### Sample Headings

> Good Stuff
> Open to everyone
> Mach 2
> Through the clouds
> The Backrooms
> Good Stuff
> Open to everyone
> Mach 2
> Through the clouds
> The Backrooms

## Page Intent

**Type:** `landing` (confidence 0.61)
**Description:** Good Stuff by PixiJS: demos, experiments and shiny little things, all running live in your browser.

Alternates: blog-post (0.35)

## Section Roles

Reading order (top→bottom): nav → logo-wall → logo-wall → content → content → footer

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.9 |
| 1 | logo-wall | Good Stuff | 0.85 |
| 2 | logo-wall | Good Stuff | 0.85 |
| 3 | content | — | 0.3 |
| 4 | content | — | 0.3 |
| 5 | footer | — | 0.95 |

## Material Language

**Label:** `material-you` (confidence 0.45)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.572 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 999px |
| backdrop-filter in use | no |
| Gradients | 3 |

## Imagery Style

**Label:** `flat-illustration` (confidence 0.267)
**Counts:** total 5, svg 5, icon 3, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Roboto` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
