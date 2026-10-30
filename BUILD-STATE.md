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
status: todo
agent:
commit:
tests:
receipts:
notes:

## B2 Engine core
status: todo
agent:
commit:
tests:
receipts:
notes:

## B3 Travel routing
status: todo
agent:
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
