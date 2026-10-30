# S04 Chrome: Keymap, Readout, sheets, wordmark

Version 1.0.0, 2026-10-30. Depends on: S00, S01, S03, S09. Blocks: S05 to S08, S10, S11.

## 1. Purpose

The DOM layer that persists across scenes. It is deliberately small: one terminal keymap line at the bottom edge (the only navigation), one readout per scene, two sheets that rise from the keymap like TUI panes, a toast, a wordmark. It carries all text, all links, all keyboard paths. The world behind it is decoration only for assistive tech (`aria-hidden`), so the chrome must be complete on its own.

## 2. Visual identity

The chrome is a terminal UI in Commit Mono set on the scene's ground, flat, no containers except where a scene's readout variant calls for one. It changes color with the regime automatically through Astryx `light-dark()` tokens and the field override (S01 section 6). It never changes shape between scenes; only the readout's variant does.

## 3. Page structure (exact landmarks)

```html
<body data-astryx-theme="lane">
  <div id="world" aria-hidden="true"><!-- canvas, poster img --></div>
  <div id="root">
    <a class="jp-wordmark" href="/" data-route>Justin Poli</a>      <!-- hidden on Server -->
    <main id="scene" aria-busy="false">
      <section class="jp-readout jp-readout--server" aria-labelledby="h-server"> ... </section>
      <div role="img" aria-label="C-SRV-ALT text"></div>            <!-- describes the world; S05 to S08 set it -->
    </main>
    <nav class="jp-keymap" aria-label="Scenes and panels"> ... </nav>
    <div class="jp-live" aria-live="polite" aria-atomic="true"></div> <!-- visually hidden -->
    <!-- BottomSheets portal here (Astryx LayerProvider) -->
  </div>
</body>
```

One `<h1>` per scene: the readout heading. No `<header>`, no `<footer>`.

## 4. Keymap (`src/chrome/Keymap.tsx`)

**Anatomy:** a `<nav>` fixed to the bottom edge, full width, height `--jp-keymap-h` (36px fine, 44px coarse), padding-bottom `env(safe-area-inset-bottom)`, background `--jp-ground` (opaque, so it reads over any lane), a 1px top hairline ring. Inside, one row of five items, left-aligned with `--jp-gutter` inset, gap `--spacing-6` (fine) or evenly distributed (coarse).

Each item is a real link or button:
- Scenes: `<a href="/" data-route aria-current="page"?>`, `<a href="/leaflink" ...>`, `<a href="/sidequests" ...>`.
- Panels: `<button aria-haspopup="dialog" aria-expanded>` for whoami and contact.
- Content: on fine pointers `<Kbd keys="1" />` followed by a space and the label `server` (S09 C-KEY-*). On coarse pointers the Kbd is hidden (`display: none`, not just transparent) and the label is the full target (44px tall, at least 44px wide).

**States** (color shift only, `--duration-fast`, `--ease-standard`):
| State | Label color | Kbd ring |
|---|---|---|
| idle | `--color-text-secondary` | `--color-border` |
| hover / focus-visible | `--color-text-primary` | `--color-text-secondary` |
| active scene (`aria-current=page`) or open panel (`aria-expanded=true`) | `--color-accent` | `--color-accent` |

**Rules:** never wraps (width test at 320px CSS: all five items fit on one line; if not, reduce gap to `--spacing-3` under 360px, never shrink text below 13px, never truncate). No icons. No hamburger. No transform on hover.

## 5. Wordmark (`src/chrome/Wordmark.tsx`)

`Justin Poli` (C-WORDMARK) as a link to `/`, top-left at `--jp-gutter`, `--text-label`, weight 700, color `--color-text-primary`. Hidden on Server (the H1 is the name there) with `hidden`, not opacity. Fades with the readout during travel.

## 6. Readout (`src/chrome/Readout.tsx`)

One component, three variants, plus the 404 which reuses `server`. Content comes from S09 by ID; the variant decides placement and container. Max width `--jp-readout-max` (520px), prose max 52ch.

| Variant | Placement fine (width at least 1024) | Placement coarse or narrow | Container |
|---|---|---|---|
| `server` | Left column: `left: gutter`, vertically anchored so its bottom sits `3 * --spacing-12` above the keymap; width `chrome.serverReadoutWidth` (min(36vw, 480px)) | Top: `top: gutter + 8px`, full width minus gutters | None. Text sits on void ground. S05 guarantees the lanes never paint behind it (camera shift). |
| `leaflink` | Bottom-left legend slip: `left: gutter`, `bottom: keymap + gutter`, width 360px | Bottom sheet-like slip above the keymap, full width minus gutters, max height 46dvh, scrolls internally | `--jp-raised` (paper.raised) fill, 0 radius, hairline ring. It is a map legend: it is allowed to cover map; the map is never behind its text. |
| `sidequests` | Top-right trailhead: `right: gutter`, `top: gutter + 40px`, width 380px | Top, full width minus gutters | No fill. A 1px dashed chalk outline (`outline: 1px dashed var(--color-text-secondary); outline-offset: --spacing-3`), like a sign drawn on the plan. Text sits on field ground; S07 keeps everything except the 10% grid out from behind it with the camera shift (S07 section 3.2). |

Typography inside every variant: H1 `--jp-text-display-0` on server, `--jp-text-display-1` on leaflink and sidequests; paragraphs `--text-body`; facts and stack lines `--text-supporting` in `--color-text-secondary`; links `Link` (Astryx) with `isExternalLink`, color accent, underline on hover only. Spacing: H1 to first paragraph `--spacing-6`, paragraph to paragraph `--spacing-4`, prose to supporting lines `--spacing-6`, supporting lines `--spacing-2` apart, links row `--spacing-6` above, links `--spacing-6` apart.

Phones: the readout region may scroll (`overflow-y: auto`, `overscroll-behavior: contain`); the page itself never scrolls (`html, body { height: 100%; overflow: hidden; }`). Touch on the canvas region must not be captured by the readout.

## 7. Sheets

Both are Astryx `BottomSheet` with `purpose="info"`, `height="hug"`, `hasScrim` true, `label` from S09, controlled by router state. On fine pointers the sheet's inner content is constrained to 640px and left-aligned with the keymap gutter (a pane rising above the keymap), not centered. The scrim color is the regime ground at 60% (`--color-overlay` override in `jp-regime`), never a blur.

### 7.1 WhoamiSheet

Heading `<h2>` C-WHO-H. Lines in order: C-WHO-EDU, C-WHO-PLACE, then the three roles as a `<ul>` with no bullets (each `<li>` one line), then a links row: C-WHO-LINK-CB, C-WHO-LINK-GH, C-WHO-LINK-LI (Astryx `Link`, `isExternalLink`).

### 7.2 ContactSheet

Heading `<h2>` C-CON-H. The address C-CON-EMAIL as selectable text in `--text-large` weight 700 (`user-select: all`). A button row: `Button variant="primary" label=C-CON-COPY` and `Button variant="secondary" label=C-CON-MAIL href="mailto:justinf0829@gmail.com"`. Then C-CON-LINK-LI.

Copy behavior: `copyText` from `src/lib/copyText.ts` (verbatim from repo `spec/standard-implementations.md`). On `true`: `showToast({body: C-TOAST-OK, type: 'info', uniqueID: 'copy'})`. On `false`: select the address text node with a `Range`, `showToast({body: C-TOAST-FAIL, type: 'error', uniqueID: 'copy'})`. Never silent.

### 7.3 CopyConfirm

Astryx `Toast` through `useToast`, stock anatomy, colors from tokens. Enter animation is Astryx's own (verify it is at most 225ms; if longer, override the duration via the theme `components.toast` target).

## 8. Live region

`.jp-live` is visually hidden (the standard clip pattern). S03 writes the new scene's H1 text into it after travel. Nothing else writes to it.

## 9. Motion summary

| Element | Trigger | Animation |
|---|---|---|
| Keymap item | hover, focus, active | color, 150ms, ease |
| Readout | travel | out: opacity 150ms ease; in: opacity and translateY 8px, 300ms expo-out, 400ms after input |
| Wordmark | travel | same as readout |
| BottomSheet | open, close | Astryx built-in; must be at most 300ms (check with `getAnimations()`), opacity and transform only |
| Toast | show | Astryx built-in, at most 225ms |
| Everything | reduced motion | opacity only, 150ms |

## 10. Kill criteria

- K-S04-1: the keymap wraps, truncates, or shows a hamburger at any width from 320 to 2560px.
- K-S04-2: any chrome element uses a shadow, gradient, blur, or a radius other than 0, 2px or 4px.
- K-S04-3: any hover changes size or position.
- K-S04-4: a sheet opened by keyboard does not return focus to its keymap button on close.
- K-S04-5: the page scrolls (document `scrollHeight > innerHeight`) at any route on any tested viewport.
- K-S04-6: any visible text is not from S09.

## 11. Receipts

| Test | Claim | How |
|---|---|---|
| T-S04-1 | No wrap | Playwright at 320, 360, 390, 768, 1024, 1440, 2560 wide: keymap `getBoundingClientRect().height` equals token height and all five items share one `top` |
| T-S04-2 | Targets | coarse emulation: each keymap item and sheet control at least 44 by 44 |
| T-S04-3 | axe clean | `@axe-core/playwright` on each route with each sheet closed and open: zero violations |
| T-S04-4 | Copy paths | grant clipboard permission: toast C-TOAST-OK; deny it and stub `execCommand` to false: toast C-TOAST-FAIL and the address is the current selection |
| T-S04-5 | Focus return | open each sheet with Enter on its keymap button, close with Escape, `activeElement` is that button |
| T-S04-6 | Keyboard only | Tab order: wordmark (when shown), readout links, OfferButton or marker twins when present, keymap items in order |
| T-S04-7 | Sheet timing | sum of animation durations from `getAnimations()` on open at most 300ms |

## 12. Unknowns

U-S04-1: whether BottomSheet's built-in open animation exceeds 300ms; resolved in T-S04-7, fixed by theme override if needed.

## 13. Changelog

- 1.0.0, 2026-10-30: initial.
