# S11 Performance and QA: the gates

Version 1.0.0, 2026-10-30. Depends on: all specs. Blocks: ship.

## 1. Purpose

Turn every claim in the package into a check that passes or fails. A gate is a named group of tests; BUILD-ORDER.md says which gates must be green at each step. "Looks good" is never a gate. The final gate set is the definition of done.

## 2. Harness

- Playwright `1.64.1`, projects: `chromium-desktop` (1440 by 900, DPR 1), `chromium-phone` (390 by 844, DPR 3, `isMobile`, `hasTouch`), `webkit-phone` (same as phone on WebKit), `chromium-reduced` (`reducedMotion: 'reduce'`), `chromium-nojs` (`javaScriptEnabled: false`).
- Served from `vite preview` on the built `dist/` (never the dev server) so prerender, chunking and compression are real.
- Network for perf runs: Lighthouse mobile preset (simulated throttling, Moto G Power class).
- Every test writes its receipt to `qa/<gate>/<test-id>.json` (numbers, pass flag, timestamp, git SHA) and screenshots to `qa/<gate>/*.png`. `tools/qa-report.mjs` rolls them into `qa/QA-REPORT.md` with one line per test.
- WebGL in headless Chromium: launch with `--use-angle=swiftshader --enable-unsafe-swiftshader` so the canvas renders in CI. SwiftShader frame times are meaningless for performance; use it for correctness only. Frame-time gates come from real devices (G-PERF-DEVICE).

## 3. Gates

| Gate | Tests | What it proves |
|---|---|---|
| G-BUILD | T-S00-1 to T-S00-6 | Clean clone builds; generated files reproducible; lints catch violations |
| G-TOKENS | `tools/lint-tokens.mjs`, T-S01-2 | No value lives only in code; no stock Meta blue |
| G-CONTRAST | `palette-receipt.py`, T-S01-3, T-S01-4, T-SRV-2, T-LL-5, T-SQ-3 | Every text pair passes in every regime, including over the live scene |
| G-COPY | T-COPY-1 to T-COPY-3 | Every word is from the deck; no dashes, no banned items, no GPA, no phone |
| G-WORLD | T-S02-1 to T-S02-8 | 6,144 lanes, one call, deterministic, recoverable |
| G-TRAVEL | T-S03-1 to T-S03-8, K-S03-4 check | No reloads, deep links, history, interruptible, feedback under 250ms |
| G-CHROME | T-S04-1 to T-S04-7 | Keymap never wraps; targets 44px; axe clean; copy paths; focus |
| G-SCENES | T-SRV-*, T-LL-*, T-SQ-*, T-404-* | Each scene does what its spec says |
| G-HUE | T-SRV-5, T-LL-7, T-SQ-6 against `hueBudgetPct` | Hue discipline (DESIGN 3.3) |
| G-FALLBACK | T-S10-1 to T-S10-6 | No-JS, no-WebGL, reduced motion, posters |
| G-PERF-LAB | section 4 | Lighthouse and bundle budgets |
| G-PERF-DEVICE | section 5 | 60fps on a real phone (manual) |
| G-ANTI | section 6 | It does not look generated |
| G-CONTENT | section 7 | Every claim traces to the brief |

## 4. G-PERF-LAB (automated, every build)

| Metric | Budget (DESIGN `budgets`) | Measured how |
|---|---|---|
| LCP | under 2000ms, element is the route's H1 | Lighthouse mobile, median of 3 runs, per route |
| TBT | under 150ms | same |
| TTI | under 3000ms | same |
| CLS | under 0.02 | same (font swap is the risk; see the fallback metrics in DESIGN 4) |
| Long tasks | none over 50ms from navigation start to 5s after `ready`, and none during 3 travels | `PerformanceObserver({type: 'longtask', buffered: true})`, Chromium desktop and phone projects |
| Render-blocking CSS | under 45 KB gzip | sum of gzip sizes of CSS in `<head>` |
| App shell JS | under 110 KB gzip | entry chunk plus its static imports |
| World chunk | under 220 KB gzip | the `world` manual chunk (three, troika, engine), loaded on idle |
| Font preload | under 50 KB | the 400 woff2 |
| Draw calls | at most 12 in any scene | `__lanefield.info().calls` |
| Programs | constant after `ready` | `renderer.info.programs.length` |
| GPU memory estimate | under 64 MB | textures (layout 3.0 MB, activity 0.1 MB, troika atlas) plus instance buffers plus drawing buffer `w * h * dpr^2 * 4 * 2`; computed by `__lanefield.memoryEstimate()` and logged |

## 5. G-PERF-DEVICE (manual, required before ship)

Cloud runners cannot measure real GPU frame times. Before ship, one person runs this on a real phone (Justin's iPhone is the reference device; add any Android phone if available):

1. Open the deployed preview with `?perf=1`.
2. On each scene, idle 20s, then travel 1 to 2 to 3 to 1 twice, then on LeafLink tap 5 times, then on SideQuests walk all three trails.
3. Tap the HUD to export (`?perf=1&dump=1` downloads the JSON). Attach the JSON to `qa/device/<device>-<date>.json` and record p50, p95 and the final DPR in `qa/device/README.md`.

Pass: p95 frame time at most 16.7ms on every scene and during travel, with the governor's final DPR at least 1.25 on the reference phone. If p95 fails at DPR 1.0, that is a kill (K-SRV-6 and friends): the fix is in the shader or overdraw, never fewer lanes.

## 6. G-ANTI (taste gate, human-judged, scripted questions)

A reviewer who has not read the specs looks at six screenshots (three scenes at desktop and phone) and the ContactSheet next to Astryx's stock BottomSheet docs example, then answers in writing:

1. Name one concrete way this does not look generated. Pass if the answer is specific (for example "the navigation is a terminal keymap" or "every scene is the same lines rearranged"). Fail if the reviewer cannot.
2. Does any scene look like a circuit board, a matrix-rain screensaver, a Leaflet map, or a game HUD? Any yes fails.
3. Does the contact sheet look like the stock Astryx example? Yes fails.
4. Point at anything that glows without a source, any gradient, any card, any eyebrow, any stat. Any found fails.
5. Read the copy aloud. Does any sentence sound like a landing page? Quote it; quoted lines go back to S09.

Then run the mechanical checklist from `baseline/ui-ux/ui-slop-patterns.md` section 6 and record each line as CLEAN or FLAG in `qa/anti/checklist.md`. One FLAG is fixed before ship.

## 7. G-CONTENT (traceability)

`tools/trace-content.mjs` loads `src/copy.ts` and checks every ID whose S09 source is `BRIEF` or `MEM` against an allow-list of fact tokens extracted by hand from CONTENT-BRIEF.md into `qa/content/facts.json` (names, places, dates, placements, stack items, URLs). Any capitalized word or number in a BRIEF/MEM string that is not in the facts list fails. Example: `C-LL-FACTS` contains `Week-long`, `four`, `Justin Poli`, `Julian Shuster`, `Devin Perez`, `Colton A.`, `2nd place`: all in facts. A string that grew a "50 users" would fail.

## 8. Kill list (any one stops the ship, whatever else passes)

- A pulse, route or trail that is not on a lane.
- Any lane count other than 6,144.
- Any text under its contrast requirement, at rest or during travel.
- Any fact not traceable to the brief, or any item from S09 rule 4 shipped.
- Any document reload on scene change.
- Any page scroll.
- Feedback over 250ms on a keymap press.
- G-PERF-DEVICE p95 over 16.7ms at DPR 1.0.
- G-ANTI question 1 unanswerable, or any yes on question 2.

## 9. Ship rule

All gates green, the kill list empty, G-PERF-DEVICE recorded, every UNKNOWN in UNKNOWNS.md either resolved or explicitly accepted by Justin in writing. Claude never deploys or merges: the build hands a commit SHA, the `dist/` byte counts and the QA report to whoever deploys.

## 10. Changelog

- 1.0.0, 2026-10-30: initial.
