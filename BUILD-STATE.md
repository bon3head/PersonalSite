# BUILD-STATE.md

Coordinator-owned runbook state. One section per card, BUILD-ORDER section 4 format.

## B0 Foundation
status: doing
agent: B0 worker + coordinator unblock
commit: f4672f0
tests:
- T-S00-2: PASS. Full `npm run gen` re-run produces byte-identical output (tokens, copy 56 entries, fonts).
- T-S00-4: PASS. Planted `color: "#fff"` in a scratch file under src/chrome was caught by lint-tokens (exit 1); scratch removed.
- T-S00-5: PASS. `python3 -I tools/palette-receipt.py spec/astryx/DESIGN.md` exits 0; all distinctness and contrast pairs PASS (see qa/B0-RECEIPTS.md).
- `npm run lint` (lint-tokens + banned-scan src + palette-receipt): PASS, exit 0.
- T-S00-6: PASS. `ls public/fonts` lists four files; 400 woff2 is 48,128 bytes for package 5.2.5.
- T-S00-1: PENDING B1. Full `npm run build` runs `npm run theme` first, which needs B1's themes/lane/laneTheme.mjs. Will verify after B1 lands.
- T-S00-3: PENDING B1. `npm run theme:check` needs themes/lane/laneTheme.mjs (B1 owns it).
receipts: qa/B0-RECEIPTS.md
notes:
- All B0-owned files are written: package.json (exact pins), tsconfig, vite.config, index.html, global.css layer order, fonts.css, lib verbatim snippets, world types.ts + stub.ts, minimal App.tsx + main.tsx, all tools + banned.txt, palette-receipt.py copy, generated tokens + copy (56 entries).
- Generator idempotency verified by sha256 across runs.
- Stub exposes window.__lanefield with laneCount from T.world.laneCount (6144) and the S02 section 2 debug shape; draws nothing (info.calls 0).
- PIN CONFLICT RESOLVED (coordinator decision, spec bug not fact change): S00 pinned vite@7.3.7 with @vitejs/plugin-react@6.1.1, but 6.x declares peer vite ^8.0.0 (ERESOLVE). Fix: plugin-react to 5.2.0 (latest 5.x, supports Vite 7). Spec fix commit e6defe6 (S00 v1.0.2 + changelog), package.json + lockfile + fonts commit f4672f0. Vite 7 mature-line rationale preserved.
- S02 section 2 and BUILD-ORDER section 4 were read only because the card mandates their contents (types.ts API, BUILD-STATE format); no other out-of-card spec was used.
- Wave 0 gate G-BUILD completes after B1 lands (T-S00-1, T-S00-3 need laneTheme.mjs). Wave 1 starts now because B1 is the unblocker.
- COORDINATOR FIXES 2026-10-30 (B0 omissions, not spec changes): added @astryxdesign/cli@0.7.1 to devDependencies (S00 pins it but B0 omitted it; npm run theme failed with "astryx: not found"); added @types/three@0.186.0, @types/react@19.3.0, @types/react-dom@19.3.0 (three and React do not ship their own types); fixed main.tsx requestIdleCallback narrowing (window narrowed to never in else branch); rebuilt themes/lane/dist (lane.js was stale per theme:check). tsc --noEmit now exit 0, theme:check now clean.

## B1 Theme
status: done
agent: B1 worker
commit: e8a3f7c08d97233f8701df626077a9acccab962c
tests:
- T-S01-1: PASS. `astryx theme build` JSON: name lane, tokenCount 93, sizeKB 12.4, warnings [] (notices only: Commit Mono named but not loaded, handled by S00 fonts.css per S01 section 2).
- T-S01-2: PASS. grep -i for 0064E0, 2694FE, 0082FB, 3E9EFB on themes/lane/dist/lane.css returns nothing.
- T-S01-3: PASS. Playwright body backgroundColor: void rgb(10, 12, 15), paper rgb(243, 240, 234), field rgb(16, 41, 78).
- T-S01-4: PASS. Primary Button background: void rgb(123, 181, 248) signal, paper rgb(14, 53, 101) ink, field rgb(123, 181, 248) signal.
- T-S01-5: PASS. Coarse mobile emulation: BUTTON 134x44 (min 44x44).
- K-S01-2: PASS. Button boxShadow none on all three regimes.
- theme:check: PASS. Outputs up to date with laneTheme.mjs.
- G-TOKENS: clean for B1 files (themes/lane, global.css regime block, qa/astryx). lint-tokens violations exist only in src/world (B2 files, not B1).
- Resolved values match S01 section 2: durations 100/150/225/200/300/450ms, ease-standard ease, radii 0/2/4/6/14px.
- U-S01-1 resolved: component keys are button, kbd, bottom-sheet exactly (qa/astryx/targets-*.json).
- U-S01-2 resolved: JSON import attributes accepted by the CLI loader (laneTheme.mjs uses `with {type: 'json'}`).
receipts: qa/astryx/ (targets-*.json, Button/Link/Kbd/Toast/BottomSheet.txt, doctor.json, S01-RECEIPTS.md, test-page.html, test-main.tsx, run-s01-tests.mjs)
notes:
- laneTheme.mjs created first per card (unblocks B0 T-S00-1, T-S00-3).
- theme.template.ts from `astryx init --features theme` is reference only, not imported.
- dist/ is gitignored by the `dist/` pattern; S01 step 5 requires committing themes/lane/dist/*, so it is force-added.
- INTEGRATION CONTRACT (for B4 app wiring): the app MUST pass Theme mode derived from data-regime (void/field to dark, paper to light). Theme's default system mode sets its own color-scheme on the wrapper div, which overrides the regime block inside the app and makes void/field resolve the light accent. The regime block alone is not sufficient; mode must follow regime.
- REQUEST (coordinator, package.json is B0-owned): `npm run theme` fails with `astryx: not found` because @astryxdesign/cli is not in devDependencies (only core is). All B1 theme operations ran via `npx -y @astryxdesign/cli@0.7.1` with identical output. Add @astryxdesign/cli@0.7.1 to devDependencies so `npm run theme` and `npm run theme:check` resolve, otherwise the gates script cannot run theme:check.
- INTEGRATION CONTRACT (for B3/B4 app wiring): the app MUST pass Theme `mode` derived from data-regime (void/field -> dark, paper -> light). Theme's default system mode sets its own color-scheme on the wrapper div, which overrides the regime block inside the app and makes void/field resolve the light accent. The B1 test harness mirrors this wiring (test-main.tsx derives mode from data-regime via MutationObserver). The regime block alone is not sufficient; mode must follow regime.
- Regime block: S01 section 6 block plus B0 text/accent mappings (--jp-text, --jp-text-2, --jp-accent per regime), which jp-chrome needs. Layer order untouched.

## B2 Engine core
status: done (with 2 flagged items below, neither worked around)
agent: B2 worker
commit: 7c634e3acd5c1317896eb021a927ee479dc7db55
tests:
- T-S02-1: PASS. laneCount 6144, info().calls 1, with and without ?debug=lanesOnly.
- T-S02-1b: PASS. Same with ?debug=lanesOnly.
- T-S02-2: PASS on Chromium. layoutHash identical across two fresh loads: 3b87e7043d19b4d025a963f0cbb1a3cc93c21b237591072eb075a2be90acd8f9. WebKit half untested here (no WebKit browser), not passed.
- T-S02-3: PASS. Every recorded weight sum within 1e-4 of 1 during server to leaflink travel; final weights one-hot leaflink. SwiftShader yields few samples per 700ms travel; dense sampling re-checked at G-PERF-DEVICE.
- T-S02-4: PASS. easeSignature(0.3) in [0.80, 0.86]; spring(0.7, 3.2) peaks 1.040-1.052, within 0.01 of 1 after 0.6s.
- T-S02-5: MECHANISM PASS, SPEC EXPECTATION CONTRADICTED (see BLOCKED). Target projects to exactly (1 + shiftX)/2 of width. Focus measured 0.909 and 0.939 of width vs spec 0.72/0.66.
- T-S02-6: PASS. info().programs unchanged across 3 full travels.
- T-S02-7: PASS. WEBGL_lose_context lose/restore, layoutHash unchanged, calls 1, zero console.error.
- T-S02-8: SKIPPED on SwiftShader (every software frame is a longtask: measured first render 14.2s, frames 6.6s p50 / 14.2s p90). Gate moves to G-PERF-DEVICE on iPhone. Not passed.
- Full suite: 9 passed, 1 skipped (7.1m, Chromium SwiftShader). Tween specs pass.
receipts: qa/world/B2-RECEIPTS.md
notes:
- BLOCKED: T-S02-5 spec expectation is geometrically inconsistent (S02 section 9). Focus (0,0,2.2) is not on the view axis; hand computation from token pose gives 92.4% of width plus up to 3.8 points idle yaw, measured 0.909/0.939. Needs a one-line coordinator spec fix (centered test point or shift-delta check). Camera mechanism itself verified exactly.
- Bug found and fixed: camera.aspect was constructed as 1 and only corrected on resize, so first-load projection used a square aspect (focus at 1.101 of width pre-fix). Fix sets aspect from viewport at init; locked by the focus-band assertion in T-S02-5.
- Spec-conformant extension: info() gains a programs field (T-S02-6 requires it; all specified fields still present).
- Interpretation: uFadeSec uses T.world.leaflink.pins.fadeMs (only fade duration in tokens); S06/S07 may refine.
- Tool gates: lint-tokens clean, banned-scan clean, tsc zero errors in src/world. Repo-wide tsc is red for a PRE-EXISTING gap: @types/react and @types/three absent from package.json (B0 files fail too). Coordinator decision needed; B2 does not touch package.json.
- Engine spec timeout raised to 180s per test (SwiftShader frames take seconds; assertions unchanged).

## B3 Travel routing
status: done
agent: B3 worker
commit: 5d37848
tests:
- T-S03-1: PASS. No reload across 20 random go calls (zero 'load' events after setup, window marker survives). Note: K-S03-1's framenavigated parenthetical is wrong for Playwright 1.64 (pushState fires it); test verifies intent, spec fix requested.
- T-S03-2: PASS. Deep links: H1, data-regime, weights one-hot, title match S03 section 2 on all four paths.
- T-S03-3: PASS. History back/back/forward stays in sync (URL + scene).
- T-S03-4: PASS. Interruptible: press 2, 200ms, press 3; sidequests by 900ms; weights sum 1 throughout.
- T-S03-5: PASS. Zero console.error on dev harness routes and on served prerendered paths (vite preview :4173).
- T-S03-6: PASS. DOM feedback under 250ms (in-page keydown-to-color+weights measurement).
- T-S03-7: PASS. Focus on keymap + press 2: activeElement is LeafLink H1, live region text "LeafLink" after 700ms.
- T-S03-8: PASS. Reduced-motion travel completes within 320ms (in-page keydown-to-opaque measurement).
- router: PASS. Path normalization, hash parsing, arrow wrap, 404 arrows, setSheet replaceState (no history growth).
- router: PASS. Sheet open disables scene keys but not the sheet's own key.
- prerender: PASS. All four route files with correct title, H1, regime, color-scheme, theme-color, description, script tag; copy strings match src/copy.ts.
- tsc --skipLibCheck: zero errors in router.ts, travel.ts. lint-tokens: clean for B3 files. banned-scan src: clean.
receipts: qa/travel/B3-RECEIPTS.md
notes:
- Built against src/world/stub.ts (B0). App.tsx untouched (B4 owns it); browser tests use an in-page harness wiring router + travel against the stub and the S04 page structure.
- TravelDom announcement getter named `announce`, not `live`: banned-scan reads full .ts content and bans the standalone word.
- 404 ArrowLeft implemented as wrapping to sidequests (S03 specifies ArrowRight from 404 only); one-line change in stepScene if Justin wants both arrows to server.
- Requests for coordinator/B0: (1) fix K-S03-1 parenthetical (framenavigated fires on pushState) — RESOLVED by coordinator, S03 v1.0.1; (2) add @types/react, @types/react-dom, @types/three to package.json — RESOLVED by coordinator, commit 834944e.
- B4 handoffs: mount TravelHotkeys in App; keymap items need data-scene (or declarative aria-current, same value); prerender must swap only the readout once App renders full chrome; main.tsx createRoot to hydrateRoot per S03 section 7; banned-scan vs aria-live in JSX — RESOLVED by coordinator: S00 v1.0.3 allows exact substring aria-live (not visible copy).
- 404 ArrowLeft: coordinator accepts B3's wrapping to sidequests (S03 silent on ArrowLeft; symmetric completion, one-line change if Justin wants both arrows to server).
- Full npm run build / gates not run: theme step needs B1's laneTheme.mjs (T-S00-1 pending B1). Prerender tested via plain vite build + vite preview.

## B4 Chrome
status: todo
agent:
commit:
tests:
receipts:
notes:

## B5a Server scene
status: todo
agent:
commit:
tests:
receipts:
notes:

## B5b LeafLink scene
status: todo
agent:
commit:
tests:
receipts:
notes:

## B5c SideQuests scene
status: todo
agent:
commit:
tests:
receipts:
notes:

## B5d Notfound scene
status: todo
agent:
commit:
tests:
receipts:
notes:

## B6a Server QA
status: todo
agent:
commit:
tests:
receipts:
notes:

## B6b LeafLink QA
status: todo
agent:
commit:
tests:
receipts:
notes:

## B6c SideQuests QA
status: todo
agent:
commit:
tests:
receipts:
notes:

## B6d Notfound QA
status: todo
agent:
commit:
tests:
receipts:
notes:

## B7 Fallbacks a11y
status: todo
agent:
commit:
tests:
receipts:
notes:

## B8 Performance QA
status: todo
agent:
commit:
tests:
receipts:
notes:

## B9 Ship
status: todo
agent:
commit:
tests:
receipts:
notes:
