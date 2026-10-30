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

## B1 Theme
status: done
agent: B1 worker
commit: (filled after commit)
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
- REQUEST (coordinator, package.json is B0-owned): `npm run theme` fails with `astryx: not found` because @astryxdesign/cli is not in devDependencies (only core is). All B1 theme operations ran via `npx -y @astryxdesign/cli@0.7.1` with identical output. Add @astryxdesign/cli@0.7.1 to devDependencies so `npm run theme` and `npm run theme:check` resolve, otherwise the gates script cannot run theme:check.
- INTEGRATION CONTRACT (for B3/B4 app wiring): the app MUST pass Theme `mode` derived from data-regime (void/field -> dark, paper -> light). Theme's default system mode sets its own color-scheme on the wrapper div, which overrides the regime block inside the app and makes void/field resolve the light accent. The B1 test harness mirrors this wiring (test-main.tsx derives mode from data-regime via MutationObserver). The regime block alone is not sufficient; mode must follow regime.
- Regime block: S01 section 6 block plus B0 text/accent mappings (--jp-text, --jp-text-2, --jp-accent per regime), which jp-chrome needs. Layer order untouched.

## B2 Engine core
status: doing
agent: B2 worker
commit:
tests:
receipts:
notes:

## B3 Travel routing
status: doing
agent: B3 worker
commit:
tests:
receipts:
notes:

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
