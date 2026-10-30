# BUILD-STATE.md

Coordinator-owned runbook state. One section per card, BUILD-ORDER section 4 format.

## B0 Foundation
status: blocked
agent: B0 worker
commit: 2b7d469
tests:
- T-S00-2 (partial, generators only): PASS. extract-tokens + extract-copy re-run produce byte-identical output (sha256 verified across runs). Full `npm run gen` untested: copy-fonts needs node_modules (see BLOCKED).
- T-S00-4: PASS. Planted `color: "#fff"` in a scratch file under src/chrome was caught by lint-tokens (exit 1); scratch removed.
- T-S00-5: PASS. `python3 -I tools/palette-receipt.py spec/astryx/DESIGN.md` exits 0; all distinctness and contrast pairs PASS (see qa/B0-RECEIPTS.md).
- `npm run lint` (lint-tokens + banned-scan src + palette-receipt): PASS, exit 0.
- T-S00-1: NOT RUN. Blocked on pin conflict (see BLOCKED).
- T-S00-3: NOT RUN. Blocked on missing laneTheme.mjs (B1 owns it) and on the pin conflict.
- T-S00-6: NOT RUN. Blocked on pin conflict (fontsource package not installed).
receipts: qa/B0-RECEIPTS.md
notes:
- All B0-owned files are written: package.json (exact pins), tsconfig, vite.config, index.html, global.css layer order, fonts.css, lib verbatim snippets, world types.ts + stub.ts, minimal App.tsx + main.tsx, all tools + banned.txt, palette-receipt.py copy, generated tokens + copy (56 entries).
- Generator idempotency verified by sha256 across runs.
- Stub exposes window.__lanefield with laneCount from T.world.laneCount (6144) and the S02 section 2 debug shape; draws nothing (info.calls 0).
- S02 section 2 and BUILD-ORDER section 4 were read only because the card mandates their contents (types.ts API, BUILD-STATE format); no other out-of-card spec was used.
BLOCKED: S00 section 2 pins vite@7.3.7 and @vitejs/plugin-react@6.1.1, but plugin-react 6.1.1 declares peer vite@^8.0.0, so npm install and npm ci fail with ERESOLVE (S00 section 2). Which pin changes: Vite to 8.x, or plugin-react to a Vite 7 compatible line?

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
