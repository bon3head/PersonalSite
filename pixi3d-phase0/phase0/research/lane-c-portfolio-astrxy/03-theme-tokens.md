# Lane C — 03 Theme + Tokens: PersonalSite (Astryx build)

> CORRECTION — verified against live HEAD 2d75332 (2026-11-12, this edit). The Astryx-version correction in §1 STANDS and is now stronger: live HEAD 2d75332 also pins `@astryxdesign/core 0.7.1` / `cli 0.7.1` (package.json at 2d75332; no dep changes in the 30-commit range). The 0.7.14 upgrade documented in `~/workspace/astryx-update/` has NOT landed in the live repo either.
> Version note: `spec/astryx/DESIGN.md` header is v1.7.0 (2026-11-10) while the `design-tokens` JSON block version is 1.6.0 (`src/tokens.generated.ts:3`, `themes/lane/tokens.generated.json:399`). Consistent, not an error: §6.15 (server words formed from lanes) states "no new tokens, no copy change", so the token version did not bump with the doc version. Do not "fix" the 1.6.0/1.7.0 split without a spec change.
> New token subtrees at 2d75332 (tokens.generated.ts 1,130 lines, was 819): `guestbook` (hash, storageKey, nameMaxChars, lineMaxChars, ledgerMax, easeMain, easeSoft, ms, camera, part, mark, shiftNdc, fitWidthFrac, dim, focusRulePx, pillRadiusPx, panelDepthPx, perspectivePx), `glitter` ({holdMs 500, maxWeight 0.85, ringRadiusPx 120, swirl 0.9}), plus `zone, curve, morph, scene, lanefield, hero, entropy, brand, perf`. `themes/lane/laneTheme.mjs` is UNCHANGED at 53 lines at 2d75332 — the theme file did not move in the 92 commits.
> Copy: `src/copy.ts` 61 → 72 lines (+11 guestbook entries `C-CON-GB`, `C-GB-LABEL/NAME/LINE/LOCK/SEED/DONE/LOCAL/AGAIN/CLOSE/LEDGER`).

Read-only analysis. All values copied from the cited files, not from memory.

## 1. Astryx version — CORRECTION (verified in repo, contradicts memory)

- **In this repo: `@astryxdesign/core 0.7.1` and `@astryxdesign/cli 0.7.1`.**
  Evidence: `package.json:3,12`; `node_modules/@astryxdesign/core/package.json: "version": "0.7.1"`; `node_modules/@astryxdesign/cli/package.json: "version": "0.7.1"`.
- Memory / alignment synthesis said the integration was "updated to official 0.7.14 (npm stable)". That update is documented OUTSIDE this repo in `~/workspace/astryx-update/docs-deep-dive.md` ("Pin: 0.7.14 is the installable version. Repo HEAD is 0.7.15… npm stable latest is 0.7.14. Do NOT pin 0.7.15") and `~/workspace/astryx-update/cli-0.7.14-probe.txt`. It was NOT applied to `personalsite-astryx-build`: no `0.7.14` string appears anywhere in the repo outside `node_modules` (grep over `*.md`/`*.json` returned nothing).
- Consequence for the masterspec: the fork's Astryx baseline is **0.7.1 as pinned here**, and the 0.7.14 upgrade is a separate, unlanded decision. Claude must not assume 0.7.14 APIs, and must not silently bump the pin. If the fork upgrades, that is a spec change requiring a DESIGN.md version bump + changelog per BUILD-ORDER rules.
- Other pins (package.json, exact): `react 19.3.1`, `react-dom 19.3.1`, `@stylexjs/stylex 0.19.1`, `@fontsource/commit-mono 5.2.5`, `three 0.186.1`, `troika-three-text 0.52.5`, `vite 7.3.7`, `@vitejs/plugin-react 5.2.0`, `typescript 5.9.3`, `@playwright/test 1.64.1`, `lighthouse 13.5.0`. Note the recorded pin conflict: S00 originally pinned plugin-react 6.1.1, which declares peer vite ^8; fixed by pinning plugin-react 5.2.0 (BUILD-STATE B0, spec fix e6defe6, S00 v1.0.2).

## 2. The lane theme (`themes/lane/laneTheme.mjs`, 53 lines)

`defineTheme({name: 'lane'})` from `@astryxdesign/core/theme`. Reads `tokens.generated.json` via JSON import. No literal colors anywhere in the file.

- Typography: `scale: T.type.scale`; body/heading/code all `Commit Mono` with fallbacks `"Commit Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- Radius: `{base: T.radius.base, multiplier: T.radius.multiplier}`.
- Motion: `{...T.motion.astryxMotion, easing: T.motion.easePlain}`.
- Tokens (each a `[light, dark]` pair = `[paper, void]` unless noted):
  `--color-accent: [paper.accent, void.accent]`, `--color-on-accent: [paper.ground, void.ground]`, `--color-text-accent` / `--color-icon-accent`: same accent pair, `--color-accent-muted: [accentMutedLight, accentMutedDark]`, `--color-background-body/surface/card/popover: [paper.ground/raised, void.ground/raised]`, `--color-text-primary/--color-icon-primary: [paper.text, void.text]`, `--color-text-secondary/--color-icon-secondary: [paper.text2, void.text2]`, `--color-border: [paper.hairline, void.hairline]`, `--color-error: [errorLight, errorDark]`, `--focus-outline-color: [paper.accent, void.accent]`, shadows all `none`, `--size-element-sm/md/lg` from `T.size.elementPx`.
- Adaptations: coarse pointer → `--size-element-md/lg` become `T.size.coarseMinTargetPx`.
- Components (keys validated against `qa/astryx/targets-*.json`): `button` (borderRadius var(--radius-element), fontWeight 700, boxShadow none; `variant:primary` background accent / color on-accent), `kbd` (transparent, radius var(--radius-inner), inset 1px border), `bottom-sheet` (borderRadius 0, boxShadow none).
- Built output: `themes/lane/dist/lane.css` (398 lines), `lane.js` (304), `lane.css.d.ts`, `lane.d.ts`, via `astryx theme build themes/lane/laneTheme.mjs --out themes/lane/dist/lane.css`. B1 receipt: tokenCount 93, sizeKB 12.4, warnings [] (BUILD-STATE B1, T-S01-1).
- App usage: `src/App.tsx` imports `laneTheme` (with `@ts-ignore`: B1 ships no declarations) and `themes/lane/dist/lane.css`, wraps in `<Theme theme={laneTheme} mode={mode}>` + `<LayerProvider>`. `index.html` sets `body[data-astryx-theme="lane"]`. Mode follows `data-regime`: void/field dark, paper light (MutationObserver in App).
- `theme.template.ts` at repo root (19,763 B) is the upstream Astryx theme template/reference, NOT the lane theme. Do not confuse the two.

## 3. Color system (DESIGN.md §3, tokens `T.color`)

Three regimes, one hue family (blue), owned by lightness and job, not by hue. Second hue: none. Ember/copper dead; nothing replaces them. Warm/cool split is temperature only: paper/chalk neutrals hue 85 (warm), void/text neutrals hue 250–255 (cool). Semantic error red exists for exactly one state (copy failed).

| Token | Hex | Job |
|---|---|---|
| `color.void.ground` | `#0A0C0F` | Server ground (near-black) |
| `color.void.raised` | `#15171B` | Raised on void |
| `color.void.text` / `text2` | `#E6E8EA` / `#A7ABB0` | Text on void |
| `color.void.accent` | `#7BB5F8` | Signal blue on dark |
| `color.paper.ground` | `#F3F0EA` | LeafLink ground (warm paper) |
| `color.paper.raised` | `#E6E2DC` | Raised on paper |
| `color.paper.text` / `text2` | `#14161A` / `#4E5359` | Text on paper |
| `color.paper.accent` | `#0E3565` | Ink blue on paper |
| `color.field.ground` | `#10294E` | SideQuests ground (blueprint blue) |
| `color.field.raised` | `#183662` | Raised on field |
| `color.field.text` / `text2` | `#F5F1E9` / `#B6C6D7` | Chalk text on field |
| `color.field.accent` | `#7BB5F8` | Signal blue on field |
| `color.signal` | `#7BB5F8` | Signal (accent on dark) |
| `color.signalDim` | `#4F77A5` | Dim signal |
| `color.signalHot` | `#D4E7FC` | In-scene core only, never text/UI |
| `color.ink` | `#0E3565` | Ink (accent on paper) |
| `color.inkTint` | `#C9DCEA` | Ink tint |
| `color.chalk` / `chalk2` | `#F5F1E9` / `#B6C6D7` | Chalk marks on field |
| `color.errorDark` / `errorLight` | `#F47B74` / `#B02A2D` | Copy-failed state only |
| `color.accentMutedLight` / `accentMutedDark` | `#0E35651F` / `#7BB5F829` | Muted accent |

### 3.1 The blue lock (DESIGN.md §3.1, verified by measurement, not taste)

Stock Astryx accent (`#0064E0` light / `#2694FE` dark, Meta blue) is explicitly rejected: shipping it would read as a Meta internal tool. Method (`tools/palette-receipt.py`, rerunnable): candidates + 51 reference blues (25 brand blues incl. Meta, Facebook, LinkedIn, Vercel, Docker, Codeberg, GitHub, Bootstrap, IBM, Zoom, Bluesky; plus Tailwind sky/blue/indigo 200–900 and cyan 300–400) converted to OKLab; require ΔE_ok ≥ 0.050 from every reference, ≥ 0.10 from Meta's four blues, plus the WCAG pairs in §3.4. Finding: every blue with OKLCH chroma above 0.14 at lightness 0.5–0.7 sits within ΔE_ok 0.05 of some brand or Tailwind stop — no ownable saturated mid blue exists. So the site owns blue by lightness and job: pale signal as light on dark grounds, deep ink as marks on paper, neither ever a button fill at brand-blue lightness.

Measured roles: signal `#7BB5F8` (OKLCH 0.76 0.115 253; nearest Tailwind indigo-300, ΔE_ok 0.050, ΔE to Meta 0.120); signalDim `#4F77A5` (0.56 0.085 253; sky-600, 0.064, 0.122); signalHot `#D4E7FC` (0.92 0.035 250; sky-200, n/a); ink `#0E3565` (0.33 0.095 256; sky-900, 0.065, 0.230); field `#10294E` (0.285 0.075 258; indigo-900, 0.103, 0.282).

T-S01-2 gate: grep for `0064E0, 2694FE, 0082FB, 3E9EFB` in `themes/lane/dist/lane.css` returns nothing (BUILD-STATE B1, PASS). T-S01-3: body backgroundColor void rgb(10,12,15), paper rgb(243,240,234), field rgb(16,41,78). T-S01-4: primary Button background void rgb(123,181,248) signal, paper rgb(14,53,101) ink.

### 3.2 Contrast pairs (`T.contrastPairs`, 4.5:1 unless noted)

void.text/void.ground 4.5, void.text2/void.ground 4.5, signal/void.ground 4.5, signal/void.raised 4.5, signalDim/void.ground 3, void.text/void.raised 4.5, paper.text/paper.ground 4.5, paper.text2/paper.ground 4.5, paper.text2/paper.raised 4.5, ink/paper.ground 4.5, ink/paper.raised 4.5, ink/inkTint 4.5, chalk/field.ground 4.5, chalk2/field.ground 4.5, chalk/field.raised 4.5, chalk2/field.raised 4.5, signal/field.ground (in tokens list; see tokens.generated.ts:123–144 for the full table — do not retype from memory, read the file).

## 4. Typography — Commit Mono lock

- Face: Commit Mono only (body/heading/code in laneTheme). Weights 200/400/700, latin subset, woff2, `font-display: swap` (`src/styles/fonts.css`). Files copied by `tools/copy-fonts.mjs` from `@fontsource/commit-mono 5.2.5` into `public/fonts/`: `commit-mono-latin-200-normal.woff2`, `-400-normal.woff2`, `-700-normal.woff2`, `-400-normal.woff` (400 woff2 = 48,128 bytes, B0 T-S00-6). Preload in `index.html`: 400 woff2. Fallback face "Commit Mono Fallback" (local Menlo/Consolas/DejaVu Sans Mono, size-adjust 100%, ascent-override 92%, descent-override 24%).
- Type scale: `T.type.scale` (from DESIGN.md; Astryx theme build resolves to `--font-size-*` / `--text-heading-*-size` in lane.css). The pre-Astryx style-brief ladder (display 64 → micro 13, ratio ~1.25, from bruno-simon.com) is SUPERSEDED — do not use it; the Astryx scale in `T.type` governs.
- Global CSS var: `--jp-font-family: "Commit Mono", "Commit Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace` (`src/styles/tokens.generated.css:30`).

## 5. Token governance (the part a Pixi fork must preserve or explicitly replace)

- Single token home: `spec/astryx/DESIGN.md` v1.0.0, `design-tokens` JSON block (§12). `tools/extract-tokens.mjs` generates `src/tokens.generated.ts` + `themes/lane/tokens.generated.json` + `src/styles/tokens.generated.css`. Generator idempotency verified byte-identical across runs (B0 T-S00-2).
- Rule zero: if a value is not in DESIGN.md, it does not exist. Change a value → change DESIGN.md, bump version, add changelog line (BUILD-ORDER rule 8).
- G-TOKENS (`tools/lint-tokens.mjs`): no hex, ms, or bare geometry literals in `src/` outside `*.generated.*` files. Numeric literals in `src/world` require trailing `// lit-ok:` comments. A Pixi fork that adds `pixi.js` / `@pixi/3d` code under `src/world/` inherits this lint: every numeric literal needs a `lit-ok` comment or the lint must be amended by spec change, not by ignoring it.
- Budgets (`T.budgets`): LCP 2000ms, TTI 3000ms, TBT 150ms, CLS 0.02, longTaskMaxMs 50, renderBlockingCssGzKb 45, appShellJsGzKb 110, **worldChunkGzKb 220**, fontPreloadKb 50, frameP95MsPhone 16.7, drawCallsMax 12, gpuMemoryMbMax 64. The world-chunk budget (220 KB gzip) currently covers three + troika + engine; a Pixi fork must re-budget it (pixi.js + @pixi/3d replace three + troika) and record the new number in DESIGN.md, not in code.
- Hue budgets (`T.hueBudgetPct`): server 30, leaflink 10, sidequestsSignal 6, scatter 6 (G-HUE).
- Chrome tokens (`T.chrome`): readoutEnterTranslatePx 8, serverReadoutWidth `min(36vw, 480px)`, legendWidthPx 360, trailheadWidthPx 380, coarseReadoutMaxHeight 46dvh, legendGlyphPx ring/dot 10, bar [16,3], keymapNarrowBelowPx 360, scrimAlpha 0.6, sheetMaxWidthPx 640, travelDom {readoutHiddenAtMs 150, regimeSwitchAtMs 350, readoutInDelayMs 400, reducedRegimeSwitchAtMs 150}.
- Motion tokens (`T.motion`): ms {travel, word, wordCadence, fast, medium, ...}, easeSignature (expo-out cubic-bezier), easePlainBezier (CSS ease as a curve), astryxMotion (passed to laneTheme). `src/world/tween.ts` implements `easeSignature`/`easePlain` from these exact numbers — the tween module is renderer-agnostic and portable.

## 6. What the pre-Astryx style brief contributes (and does not)

`spec/style-brief.md` (2026-10-04, design-extract on corentinbernadou.com + bruno-simon.com): "Dark editorial instrument panel. Near-black warm canvas, one hot accent, flat material, hairline structure, tight Swiss typography. Restraint is the luxury: 7 total unique colors detected on the reference." Its token block uses `--bg-0 #070304`, `--accent #ff4401` (flagged PLACEHOLDER, do not ship), proposed amber `#ffb000`. NONE of these values shipped. The shipped palette is the DESIGN.md blue system in §3 above. The brief's durable contributions are the design-language sentences and the type-ladder measurement method, not any hex. A Pixi fork's style work starts from DESIGN.md, not from style-brief.md.
