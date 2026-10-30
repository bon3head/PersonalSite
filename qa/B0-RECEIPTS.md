# B0 receipts

## Generators
- `node tools/extract-tokens.mjs` -> "wrote tokens from DESIGN.md v1.0.0". Verifies world.laneCount (6144) === world.server.sm.count (48) * 128.
- `node tools/extract-copy.mjs` -> "wrote 56 entries to src/copy.ts".
- Idempotency: sha256 of src/tokens.generated.ts, src/copy.ts, themes/lane/tokens.generated.json, src/styles/tokens.generated.css identical across two runs.

## Lints
- `node tools/lint-tokens.mjs` -> "lint-tokens: clean".
- `node tools/banned-scan.mjs src` -> "banned-scan: clean".
- `npm run lint` -> exit 0 (lint-tokens + banned-scan src + palette-receipt).

## T-S00-4 (planted violation)
- Added `export const scratch = { color: "#fff" };` to src/chrome/__scratch__.tsx.
- lint-tokens reported: `src/chrome/__scratch__.tsx:1: hex color literal` and exited 1.
- Scratch file and directory removed after the test.

## T-S00-5 (palette receipt)
- `python3 -I tools/palette-receipt.py spec/astryx/DESIGN.md` -> exit 0.
- Distinctness PASS: signal #7BB5F8 (dE 0.050, dE_meta 0.120), signalDim #4F77A5 (0.064, 0.122), ink #0E3565 (0.065, 0.230), field.ground #10294E (0.103, 0.282).
- Contrast PASS: all 21 pairs at or above requirement (lowest: signalDim on void.ground 4.21 vs 3.0 graphics-only).

## Blocked tests (not run)
- T-S00-1 (clean build): npm install fails, see BLOCKED in BUILD-STATE.md.
- T-S00-3 (theme:check): laneTheme.mjs is B1's file; also blocked on install.
- T-S00-6 (fonts): fontsource package not installed; also blocked on install.
