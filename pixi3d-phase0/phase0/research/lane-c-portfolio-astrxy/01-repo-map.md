# Lane C — 01 Repo Map: PersonalSite (Astryx build + Pixi3D phase-0 worktree)

> CORRECTION — verified against live HEAD 2d75332 (2026-11-12, this edit).
> Lane C v1 was read at `astryx-build` HEAD 14ab8df. That checkout is 92 commits behind live HEAD and is NOT the live site.
> Live HEAD: `2d75332cb4f8ff430dd1905c0c36dc4fc18922bf` "Merge PR #9: server words formed from lanes", on `origin/astryx-polish-r2` AND `origin/astryx-integration` (same SHA on both). `origin/main` is still `c43c594a23cbaf6039e37251962f1afa0b61cbac`, a spec-only chain, NOT the live site code.
> `14ab8df` is an ancestor of `2d75332` (verified via merge-base). Span: 14ab8df..46d6a34 = 62 commits, 46d6a34..2d75332 = 30 commits, 14ab8df..2d75332 = 92 commits / 301 files changed / +40,498 / -520.
> Production (per MEMORY.md production update 2026-11-12, Justin report, verified in git): polish branch is now the main page; deploy `dpl_A9Hi8a8TywyP4WPJLxp2pM9YH3KC`, READY, alias includes justinpoli.is-a.dev; rollback target `dpl_G3nFNBAQtfLwGuxZApdQk1LwXZjq` (46d6a34). Routes verified 200: /, /leaflink, /sidequests, /llms.txt, /llms-full.txt. OG image hash unchanged 3dcd695e.
> Line counts below in §§3–5 are the 14ab8df values UNLESS marked [2d75332]. The authoritative 2d75332 counts: DESIGN.md 1,131 lines (v1.7.0 header; tokens JSON v1.6.0), tokens.generated.ts 1,130, copy.ts 72, App.tsx 461, router.ts 276, lanefield.ts 1,595, server.ts 576, types.ts 227, stub.ts 233, lane.vert.glsl 197, lane.frag.glsl 147, GuestbookSheet.tsx 349 (new), motion/guestbook.ts 646 (new), guestbookStore.ts 57 (new), entropy.ts 162. Repomix (§6) was regenerated from 2d75332.

Scope: read-only inventory. Two directories inspected, no edits made to either repo.
Date: 2026-11-12. Lane: C (portfolio repo + Astryx theme structure).

## 1. The two directories

| Directory | What it is | Branch | HEAD |
|---|---|---|---|
| `/home/hatch/workspace/personalsite-astryx-build/` | Main build repo (git repo root). Remote `origin` = `https://github.com/bon3head/PersonalSite` | `astryx-build` | `14ab8df` "B0: ship preview Vercel project + qa receipts" |
| `/home/hatch/workspace/personalsite-pixi3d-phase0/` | Git worktree of the above (`.git` file points at `personalsite-astryx-build/.git/worktrees/personalsite-pixi3d-phase0`). Contains ONLY `README.md` + `spec/` (5 files tracked, not a full checkout) | `pixi3d-phase0-20261112` | `c43c594` "Fill LinkedIn URL + fourth LeafLink member (Colton A.) per Justin" |

Phase-0 worktree spec files are byte-identical to the astryx-build copies (sha256 first 16 hex match on all four):
- `spec/copy-deck-v2.md` `1a61ef364e2ff52d`
- `spec/portfolio-spec.md` `4ef6773ed168ce1f`
- `spec/standard-implementations.md` `bc20cdb49666550d`
- `spec/style-brief.md` `20e61417c1a0a20c`
- Difference vs astryx-build `spec/`: phase-0 worktree lacks `spec/astryx/` (the 12 S-specs + DESIGN.md + BUILD-ORDER.md + tools). The masterspec author must pull those from astryx-build, not from the phase-0 worktree.

Other worktrees on the same repo (not inspected, listed for context): `personalsite-astryx-baseline`, `-integration`, `-ll345`, `-ll345-merged`, `-polish-r2`, `-w0` through `-w7` (+ fix variants), `personalsite-hyperframes-review`. Do not assume any of them is current; astryx-build at 14ab8df is the reference.

## 2. Top-level inventory (astryx-build at 14ab8df: 154 tracked files; live HEAD 2d75332: 415 tracked files, 64 under src/)

```
.gitignore  BUILD-STATE.md (43,158 B)  README.md  index.html  package.json
package-lock.json (156,861 B)  playwright.config.ts  theme.template.ts (19,763 B)
tsconfig.json  vite.config.ts
public/fonts/  (Commit Mono woff/woff2, 4 files)
spec/  src/  themes/  tools/  tests/  qa/  dist/  dist-server/  test-results/
feedback-2026-10-31/  feedback-2026-11-02/  feedback-2026-11-03/  feedback-2026-11-04/
is-a-dev/  writeup/  node_modules/ (not tracked)
```

Untracked in astryx-build (per `git status`): `feedback-2026-10-31/`, `-11-02/`, `-11-03/`, `-11-04/`, `is-a-dev/`, `writeup/`. The `feedback-*` dirs contain nested repomix packs and patches (one file alone is 461,625 tokens); they were EXCLUDED from the clean repomix pack in this lane.

## 3. `src/` inventory (all files read; line counts via `wc -l`)

### 3.1 Entry, routing, travel, copy

| File | Lines | Role |
|---|---|---|
| `src/main.tsx` | 62 | Client entry. `initMotionPref()`, hydrate-or-create root, `startOnIdle()` → `createLanefield` on `requestIdleCallback`, dispatches `lanefield-ready` CustomEvent. World starts on idle, after App mounts. |
| `src/entry-server.tsx` | 11 | SSR/prerender entry. `renderRoute(scene, sheet)` → `renderToString(<App initialScene initialSheet />)`. |
| `src/App.tsx` | 302 | Persistent DOM layer. `<Theme theme={laneTheme} mode>` + `LayerProvider`, Wordmark, Readout (one DOM identity across swaps), Keymap, sheets, TravelHotkeys. Creates scene controllers on `lanefield-ready`; `wired` state gates OfferButton + SideQuestsTwins. `window.__sceneControllers` test hook. |
| `src/router.ts` | 273 | Routes + hotkeys. `SceneId = server \| leaflink \| sidequests \| notfound`. Paths `/`, `/leaflink`, `/sidequests`, `/404`. Sheets are hash-only (`#whoami`, `#contact`, replaceState). `SCENE_ORDER` server→leaflink→sidequests; 404 outside order. `SCENE_REGIME`: server void, leaflink paper, sidequests field, notfound void. Hotkeys 1/2/3, arrows (wrap), w, c via Astryx `useHotkeys`. |
| `src/travel.ts` | 262 | Travel choreography. `applyRegime` flips `data-regime`, color-scheme, theme-color meta, title at the hidden switch point. `createTravelController`: interruptible, generation-guarded, readout fade (150ms hidden, 350ms regime switch, 400ms re-enter, 8px translateY), pause outgoing controller / resume incoming, focus + polite announcement handling. All durations from tokens. |
| `src/copy.ts` | 61 | GENERATED from S09 §4. `C` object, 56 entries, `CopyId` type. No invented strings allowed downstream. |
| `src/lib/copyText.ts` | 22 | Clipboard helper. |
| `src/lib/reducedMotion.ts` | 29 | `prefersReducedMotion()` + `initMotionPref()`. |
| `src/lib/safeStorage.ts` | 24 | Safe storage wrapper. |

### 3.2 Chrome (DOM UI, Astryx components)

| File | Lines | Role |
|---|---|---|
| `src/chrome/Readout.tsx` | 103 | Scene readout variants; imports `LeaflinkReadout` from `../scenes/leaflink` (wired). One `<section>` identity preserved across swaps. |
| `src/chrome/Keymap.tsx` | 78 | Bottom-edge terminal keymap. Astryx `Kbd`. `aria-current="page"` on active scene. |
| `src/chrome/Wordmark.tsx` | 23 | Wordmark. |
| `src/chrome/WhoamiSheet.tsx` | 54 | Astryx `BottomSheet` + `Link`. |
| `src/chrome/ContactSheet.tsx` | 64 | Astryx `BottomSheet` + `Button` + `Link`. |
| `src/chrome/CopyConfirm.ts` | 34 | Astryx `useToast` copy feedback. |
| `src/chrome/chrome.css` | 458 | Chrome styles (unlayered-CSS rule applies; token lint). |

### 3.3 Scenes (readout content + DOM twins)

| File | Lines | Role |
|---|---|---|
| `src/scenes/server.tsx` | 20 | Canonical server readout (H1 + P1/P2/P3). Note: B4 Readout inlines the same content; this module is canonical but wiring is a BUILD-STATE request, not yet delegated. |
| `src/scenes/leaflink.tsx` | 85 | LeafLink readout: H1, P1, FACTS, STACK, CODE link, hairline, LEGEND with CSS glyphs, SIM, OfferButton (Astryx `Button`). Wired into Readout.tsx:17,76. |
| `src/scenes/sidequests.tsx` | 77 | Marker twins: 3 Astryx ghost icon-only buttons, 44×44 CSS px, positioned per frame from `controller.headScreen(i)` via `lanefield.onFrame`. Transparent; visual is the 3D marker. |
| `src/scenes/notfound.tsx` | 19 | 404 readout (H1 + P1). Mirrors Readout inline block element-for-element for future delegation. |
| `src/scenes/test-render.ts` | 14 | Test-only render helper (react-dom/client). |

### 3.4 World (the 3D engine — the Pixi replacement surface; full detail in 04)

| File | Lines | Role |
|---|---|---|
| `src/world/types.ts` | 48 | `Lanefield` interface (the seam). `LayoutId`, `Regime`, `LanefieldDebug`. Exposes `scene: THREE.Scene`, `camera: THREE.PerspectiveCamera`. |
| `src/world/lanefield.ts` | 687 | Engine core. WebGL2 canvas, `THREE.WebGLRenderer`, one `InstancedBufferGeometry` (6,144 lanes × 7 segments = 43,008 instances), one `ShaderMaterial` (GLSL3), layout + activity `DataTexture`s (RGBA32F), worker layout generation, Governor DPR, CameraRig, travel weight morph, context-lost/restore, `window.__lanefield` debug. |
| `src/world/camera.ts` | 212 | `CameraRig`: pose selection, principal-point shift (projection matrix elements [8]/[9]), idle yaw, LeafLink drift, pointer parallax, `screenToGround` / `worldToScreen`. |
| `src/world/server.ts` | 245 | Server scene controller. Troika `Text` pool (6 words), spawn/drift/cool/fade. Adds meshes to `field.scene`. |
| `src/world/leaflink.ts` | 1,051 | LeafLink controller. Heartbeat sim (spawns, landings, matches, routes via `lanefield.setActivity` kind 1), pin/halo/ripple instanced meshes with inline GLSL `ShaderMaterial`s, Dijkstra routing on layout graph, tap-to-offer. |
| `src/world/sidequests.ts` | 518 | SideQuests controller. 2 draw calls: `InstancedMesh` octahedron marker heads (vertex colors, `onBeforeCompile` signal uniforms) + `InstancedMesh` cylinder poles. Trails via `setActivity` kind 2, camera follow, spring marker motion. |
| `src/world/notfound.ts` | 42 | No-op controller (documented decision; scatter layout + rig own everything). No three import. |
| `src/world/stub.ts` | 108 | B0 stub `createLanefield` — draws nothing, in-memory weights/poses. Still used by `tests/travel.spec.ts`; NOT imported by `main.tsx` (real engine wired). |
| `src/world/worker.ts` | 59 | Web Worker: `generateAll(seed)` → one transferable `Float32Array` layout buffer + side data. mulberry32 RNG. |
| `src/world/governor.ts` | 97 | DPR governor. Only quality lever is resolution; lane count never changes. 600-frame ring, p50/p90/p95. |
| `src/world/tween.ts` | 34 | `cubicBezier` solver, `easeSignature` (expo-out), `easePlain`, `spring`, `damp`. No three import. |
| `src/world/debug.ts` | 92 | `window.__lanefield` debug view, `?perf=1` HUD, `?perf=1&dump=1` JSON download. |
| `src/world/layouts/server.ts` | 80 | Pure generator, no three import. Grid arithmetic, no randomness. |
| `src/world/layouts/leaflink.ts` | 290 | Pure generator, no three import. 33-node lattice, jitter, edge drops, diagonals; returns graph side data. |
| `src/world/layouts/sidequests.ts` | 1,004 | Pure generator, no three import. Campus plan: 11 buildings, hatch, walkways, 3 trails, markers; returns side data. Includes its own `projectToFineScreen` / `readoutClearZone` (verified against three camera math, lines 480, 534, 564). |
| `src/world/layouts/scatter.ts` | 63 | Pure generator, no three import. Random short segments in radius 8. |
| `src/world/shaders/lane.vert.glsl` | 86 | GLSL ES 3.0 vertex shader. `texelFetch` layout texture, weight-blend 4 layouts, per-class width/alpha/color, fog. |
| `src/world/shaders/lane.frag.glsl` | 63 | GLSL ES 3.0 fragment shader. Fire pulses (hash, sweep, head), route/trail coloring, freeze flag. |

World total: 4,318 lines (incl. layouts 1,437 + shaders 149). Layout generators are pure functions with zero three imports — portable as-is to any renderer.

### 3.5 Styles, tokens, themes

| File | Lines | Role |
|---|---|---|
| `src/tokens.generated.ts` | 819 | GENERATED from `spec/astryx/DESIGN.md` v1.0.0 `design-tokens` JSON block. `T` const object. Do not edit. |
| `src/styles/tokens.generated.css` | 59 | GENERATED CSS vars (`--jp-*`). |
| `src/styles/global.css` | 85 | Global styles, imports fonts.css. |
| `src/styles/fonts.css` | 32 | Commit Mono @font-face (200/400/700 woff2 + fallback metrics). |
| `themes/lane/laneTheme.mjs` | 53 | Astryx `defineTheme({name: 'lane'})`. Reads `tokens.generated.json`. No literal colors. |
| `themes/lane/tokens.generated.json` | 818 | GENERATED tokens JSON (same source as tokens.generated.ts). |
| `themes/lane/dist/lane.css` | 398 | Built theme CSS (`astryx theme build`). |
| `themes/lane/dist/lane.js` | 304 | Built theme JS. |
| `themes/lane/dist/lane.css.d.ts` / `lane.d.ts` | 9 / 10 | Built theme types. |
| `theme.template.ts` (repo root) | 19,763 B | Astryx theme template / reference (upstream template, not the lane theme). |

### 3.6 Tools (build-time generators + lints)

| File | Lines | Role |
|---|---|---|
| `tools/extract-tokens.mjs` | 89 | DESIGN.md `design-tokens` JSON → `src/tokens.generated.ts` + `themes/lane/tokens.generated.json` + `src/styles/tokens.generated.css`. Fails if `world.laneCount !== server.sm.count * 128` (48×128 = 6,144). |
| `tools/extract-copy.mjs` | 82 | S09 §4 table → `src/copy.ts`. Fails on duplicate IDs. |
| `tools/copy-fonts.mjs` | 28 | `@fontsource/commit-mono` files → `public/fonts/`. |
| `tools/lint-tokens.mjs` | 121 | G-TOKENS: scans `src/**/*.{ts,tsx,css,glsl}` (excl. `*.generated.*`), fails on hex/ms/geometry literals. |
| `tools/banned-scan.mjs` | 90 | G-COPY: scans dir for `tools/banned.txt` patterns (case-insensitive). |
| `tools/banned.txt` | 30 | Banned patterns list. |
| `tools/prerender.mjs` | 135 | After `vite build`: fills per-route readout into `dist/index.html`, writes `dist/leaflink/index.html`, `dist/sidequests/index.html`, `dist/404.html`, sets title/meta/regime. Requires SSR bundle first. |
| `tools/palette-receipt.py` | 65 | OKLab distance of every DESIGN.md color to 51 reference blues + WCAG contrast of `contrastPairs`. Also mirrored at `spec/astryx/tools/palette-receipt.py`. |

### 3.7 Specs

| File | Lines | Role |
|---|---|---|
| `spec/portfolio-spec.md` | 202 | PRE-ASTRYX DRAFT (2026-10-04). Single self-contained HTML file, three.js r186 + GSAP via importmap, no framework. Status: DRAFT. Superseded as a build plan by the Astryx package; retained as the judgment-call record (roster lock, anti-template constraint, evidence-first). |
| `spec/style-brief.md` | 60 | PRE-ASTRYX (2026-10-04). Design-extract from corentinbernadou.com + bruno-simon.com. Tokens use placeholder accent `#ff4401` / proposed amber `#ffb000` — NOT shipped. Superseded by DESIGN.md tokens. Do not lift its colors. |
| `spec/copy-deck-v2.md` | 221 | Copy deck v2.1, canonical. Byte-exact in phase-0 worktree (sha 18caf965 per commit 5c25655). |
| `spec/standard-implementations.md` | 157 | Standard-implementations reference (hand-rolled component rules for the no-framework plan; partially superseded by Astryx components — verify per-item before citing). |
| `spec/astryx/DESIGN.md` | 771 | CANONICAL token + design source, v1.0.0, 2026-10-30. Rule zero: if a value is not in this file, it does not exist. Contains the `design-tokens` JSON block. |
| `spec/astryx/BUILD-ORDER.md` | 123 | Orchestration: waves B0–B9, card ownership, gates, "never invent a value / never invent copy / stay in your files / done means green". |
| `spec/astryx/README.md` | 36 | One-paragraph concept + spec index. |
| `spec/astryx/TASTE-GATES.md` | 106 | Taste gates. |
| `spec/astryx/UNKNOWNS.md` | 48 | v1.1.0. Decisions D-* + facts R-* + content unknowns U-*. Ship rule: each resolved or explicitly accepted by Justin in writing. |
| `spec/astryx/specs/S00-foundation.md` | 156 | Repo, toolchain, pins, generators, lints. |
| `spec/astryx/specs/S01-theme.md` | 142 | Astryx "lane" theme. |
| `spec/astryx/specs/S02-lanefield-engine.md` | 352 | The 6,144-lane world. |
| `spec/astryx/specs/S03-travel-routing.md` | 104 | Travel and routing: one space, four addresses. |
| `spec/astryx/specs/S04-chrome.md` | 129 | Keymap, Readout, sheets, wordmark. |
| `spec/astryx/specs/S05-scene-server.md` | 103 | Server scene. |
| `spec/astryx/specs/S06-scene-leaflink.md` | 103 | LeafLink scene. |
| `spec/astryx/specs/S07-scene-sidequests.md` | 103 | SideQuests scene. |
| `spec/astryx/specs/S08-scene-notfound.md` | 43 | 404 scene. |
| `spec/astryx/specs/S09-copy-deck.md` | 111 | Copy deck (source of `src/copy.ts`). |
| `spec/astryx/specs/S10-fallbacks-a11y.md` | 60 | No-JS, no-WebGL, reduced motion, screen readers, posters. |
| `spec/astryx/specs/S11-performance-qa.md` | 98 | Performance + QA gates (see §5). |
| `spec/astryx/tools/palette-receipt.py` | 65 | Mirror of `tools/palette-receipt.py`. |

### 3.8 Tests (2,588 lines, Playwright)

`tests/chrome.spec.ts` (281), `tests/travel.spec.ts` (500), `tests/travel-prerender.spec.ts` (106), `tests/world.engine.spec.ts` (191), `tests/world.layouts.server.spec.ts` (110), `tests/world.tween.spec.ts` (23), `tests/layouts/scatter.test.ts` (103), `tests/scenes/leaflink.spec.ts` (462), `tests/scenes/server.spec.ts` (336), `tests/scenes/sidequests.spec.ts` (407), `tests/scenes/notfound.spec.ts` (69), plus `tests/world-harness.html`, `tests/scenes/sidequests-harness.html`.

### 3.9 QA receipts (not code, listed for completeness)

`qa/` contains per-card receipts: `B0-RECEIPTS.md`, `astryx/` (S01 receipts, doctor.json, targets-*.json), `chrome/`, `layouts/{leaflink,scatter,server,sidequests}/`, `scenes/{leaflink,notfound,server,sidequests}/`, `travel/`, `world/`, plus server render PNGs. These are evidence the masterspec author can cite; they were not re-verified in this lane.

### 3.10 Files added or materially changed between 14ab8df and 2d75332 [2d75332]

The 30-commit range 46d6a34..2d75332 (PR #5 guestbook, #6 motion films, #7 multi-agent guide, #8 guestbook on real phones, #9 lane-formed server words; 107 files, +15,077 / -116) added:

| File | Lines [2d75332] | Role |
|---|---|---|
| `src/chrome/GuestbookSheet.tsx` | 349 | Guestbook sheet (DESIGN 6.14). Hash `#guestbook` over current scene; lane field is the surface. Two prompt lines, pill to lock in, seed readout. Panel moves in depth on translateZ under perspective, never opacity. Storage browser-local only (Justin 2026-11-10). Drives field via `motion/guestbook.ts` director. No three import. |
| `src/motion/guestbook.ts` | 646 | Guestbook director (DESIGN 6.14). Camera dolly, 3D part, one lane per typed character bending toward camera, lock-in, pull-back. All motion through `field.guestbook` — same mesh, same draw call, same WebGL context. Two fresh seeds per sign from `entropy.ts`; Lusion beziers only (`T.guestbook.easeMain/easeSoft`). No three import. |
| `src/lib/guestbookStore.ts` | 57 | Browser-local signature store. `storeSignature` is the single hook; newest first, at most `guestbook.ledgerMax` kept, nothing leaves the device. |
| `src/motion/entropy.ts` | 162 | Seeded entropy (DESIGN 6.11). Session seed from `?seed=` or `crypto.getRandomValues`; counter-based `hash32(seed, channel, index)` draws; no `Math.random` for motion. Layout seed (`T.world.seed`) separate, never changes. |
| `tools/agent-map.mjs` | 202 | Agent map tool (new in range). |
| `src/chrome/glitterbox.ts` | 98 | GLITTERBOX hold interaction (press-hold lane field / hold g; 6,144 lanes come apart into glitter, release re-forms). Calls `field.setGlitter(true/false, startPx)` after `T.glitter.holdMs` hold threshold. Live in production per MEMORY.md. |
| `src/motion/stage.ts`, `morph-controller.ts`, `hero-descriptors.ts` | 42 / 458 / 112 | Motion/polish modules. Present at 2d75332; predate 46d6a34 (added in the 62-commit 14ab8df..46d6a34 span), NOT in the 30-commit range. |

Changed in the 30-commit range (line counts 46d6a34 → 2d75332): `src/world/server.ts` 247 → 576 (lane-formed words, PR #9), `src/world/lanefield.ts` 1,353 → 1,595 (guestbook/word hooks, uniforms), `src/world/types.ts` 161 → 227 (GuestbookHooks, LaneWordHooks, LaneParams, glitter/pulse/focus APIs), `src/world/stub.ts` 198 → 233 (stub guestbook/words/getParams/setGlitter), `src/world/shaders/lane.vert.glsl` 157 → 197, `lane.frag.glsl` 124 → 147, `src/App.tsx` 433 → 461 (lazy GuestbookSheet, `server.setHidden` on sheet open), `src/router.ts` 273 → 276 (`SheetId` += `guestbook`, hash from `T.guestbook.hash`, w/c hotkeys disabled while guestbook open), `src/copy.ts` 61 → 72 (+11 guestbook entries: `C-CON-GB`, `C-GB-LABEL/NAME/LINE/LOCK/SEED/DONE/LOCAL/AGAIN/CLOSE/LEDGER`), `src/tokens.generated.ts` 1,045 → 1,130, `spec/astryx/DESIGN.md` 1,027 → 1,131 (v1.7.0; §6.14 guestbook, §6.15 server words), `spec/astryx/specs/S05-scene-server.md` v1.3.0, `S09-copy-deck.md` (+guestbook strings), `src/chrome/ContactSheet.tsx` (+`onLeaveMark` → "Leave a mark", `C-CON-GB`), `src/chrome/chrome.css` (+252 lines), `tools/extract-tokens.mjs` (+9 lines).
- `package.json` UNCHANGED in the 30-commit range (no dep changes): Astryx still 0.7.1, three still 0.186.1, troika still 0.52.5 at live HEAD. `vite.config.ts` at 2d75332 adds a serve-only dev-HUD plugin (`devHudServeOnly`, never in build) and the build script is now `brand && gen && theme && tsc && vite build && vite build --ssr ... && prerender && check:hud` with a `prebuild` numpy/PIL check and a `brand` script (`tools/build-brand-assets.mjs`).
- `BUILD-STATE.md` at 2d75332 is byte-identical in size (43,158 B) and statuses to the 14ab8df copy (B6a still blocked; B7/B8/B9 still todo). The runbook was NOT updated across the 92 commits — treat its statuses as stale for post-B5 work; the live evidence is the git log + qa receipts + deploy record, not BUILD-STATE.

## 4. Package, build, gates

`package.json` (name `justin-poli-personal-site`, private, type module):
- Dependencies: `@astryxdesign/core 0.7.1`, `@fontsource/commit-mono 5.2.5`, `@stylexjs/stylex 0.19.1`, `react 19.3.1`, `react-dom 19.3.1`, `three 0.186.1`, `troika-three-text 0.52.5`.
- DevDependencies: `@astryxdesign/cli 0.7.1`, `@axe-core/playwright 4.14.0`, `@playwright/test 1.64.1`, `@types/react 19.3.0`, `@types/react-dom 19.3.0`, `@types/three 0.186.0`, `@vitejs/plugin-react 5.2.0`, `lighthouse 13.5.0`, `typescript 5.9.3`, `vite 7.3.7`.
- Scripts: `build` = `gen && theme && tsc --noEmit && vite build && vite build --ssr src/entry-server.tsx --outDir dist-server && node tools/prerender.mjs`; `dev` = `gen && vite`; `gates` = `build && lint && theme:check && banned-scan dist && playwright test`; `gen` = `extract-tokens && extract-copy && copy-fonts`; `lint` = `lint-tokens && banned-scan src && palette-receipt.py DESIGN.md`; `theme` / `theme:check` = `astryx theme build themes/lane/laneTheme.mjs --out themes/lane/dist/lane.css [--check]`; `test` = `playwright test`.
- `vite.config.ts`: React plugin, `target es2022`, `assetsInlineLimit 0`, `manualChunks`: anything in `node_modules/three`, `node_modules/troika-three-text`, or `/src/world/` → chunk `world`.
- `tsconfig.json`, `playwright.config.ts` (webServer: vite dev 5173, preview 4173 — added after the first gates run failed on ERR_CONNECTION_REFUSED).
- `index.html`: `<html data-regime="void" style="color-scheme: dark">`, meta theme-color `#0A0C0F`, Commit Mono 400 preload, inline critical CSS (ground per regime), `#world` fixed canvas mount (`position fixed, inset 0, z-index 0`, `aria-hidden`), `#root` z-index 1, script `/src/main.tsx`.

## 5. Build state (BUILD-STATE.md, 43,158 B)

All cards B0–B5d, B6b–B6d done. Statuses: B0 done, B1 done, B2 done, B3 done, B4 done, B5a done, B5b done, B5c done, B5d done, **B6a Server QA: blocked**, B6b done, B6c done, B6d done, **B7 Fallbacks/a11y: todo, B8 Performance QA: todo, B9 Ship: todo**. Ship decision recorded at commit c3fd464 ("Wave 3 close with accepted known items"). S11 §9 ship rule: all gates green, kill list empty, G-PERF-DEVICE recorded, every UNKNOWN resolved or explicitly accepted by Justin in writing; "Claude never deploys or merges: the build hands a commit SHA, the dist/ byte counts and the QA report to whoever deploys."

## 6. Repomix pack

Clean pack at `repomix.xml` in this lane dir, REGENERATED from live HEAD 2d75332 (worktree `/home/hatch/workspace/worktrees/personalsite-astryx-polish-r2/`): 148 files, 483,415 tokens, 1,584,574 chars, 1.6M, sha256 `e80bf85fc61d539acf3ef3dbec4f46831c99d10610cf4b2fe469542e731c3d03`. Built with repomix 1.18.1 from an explicit 154-file list (`git ls-files` at 2d75332 minus node_modules, dist*, test-results, feedback-*, is-a-dev, writeup, qa/, reports/, public/fonts, guestbook/, motion-design/, agents/, .claude/, woff/png); 6 listed files were not packed by repomix (same exclusion pattern as v1; package-lock.json is the largest skipped file).
- Superseded v1 pack (read at 14ab8df): 97 files, 246,819 tokens, sha256 `252c36e6aaae290f4efed83539f04ed04e235143f345c4949c0be183b37cbf96` — DO NOT USE; it predates the guestbook + lane-formed server words work.
- NOT in the pack (tracked at 2d75332, excluded by scope, not missing): top-level reference dirs `guestbook/` (launch prompt, asset pool, Lusion style brief, motion notes), `motion-design/` (HyperFrames compositions incl. guestbook-sign + server-ident, frame.md, hyperframes skill), `agents/` (BRIEFS.md, CODE-MAP.md, ROUTING.md, SOURCES.md, WORK-LOOPS.md, deps.json, ownership.json, routing-log.md), `.claude/agents/` (judge/run/retrieve/taste-judge). `src/motion/` (entropy, guestbook, hero-descriptors, morph-controller, stage) IS in the pack via `src/`.
- A first naive `repomix .` run in v1 produced 921,408 tokens / 154 files, 50.1% of it a single nested `feedback-2026-11-02/repo-pack.xml`; that pack was overwritten by the clean one and must not be used.
