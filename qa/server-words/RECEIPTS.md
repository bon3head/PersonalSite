# Server words formed from lanes: receipts (2026-11-10)

DESIGN 1.7.0 section 6.15, S05 1.3.0. Justin's pick for fix 4b of the guestbook phone brief: form the words from lanes, do not remove them (C-SRV-P2 no longer carries the stack names). All nine words in `world.server.words` are kept. Cloud run, SwiftShader, Chromium 1243, preview build.

| Check | Command | Exit |
|---|---|---|
| types (before and after) | `npx tsc --noEmit` | 0 and 0 (no new diagnostics) |
| build | `npm run build > build.log 2>&1; echo $? > build.exit` | 0 |
| lint (tokens, banned, palette) | `npm run lint` | 0 |
| theme:check | `npm run theme:check` | 0 |
| banned-scan dist | `node tools/banned-scan.mjs dist` | 0 |
| gen leaves generated files unchanged | `npm run gen; git status` | clean |
| targeted tests, final head | `npx playwright test -c qa/polish-2/playwright.local.config.ts tests/guestbook.spec.ts tests/scenes/server.spec.ts > t7.log 2>&1; echo $? > t7.exit` | 0 (15 passed, including new T-SRV-7, T-SRV-4, T-SRV-2 at 390 and 1440, T-GB-1 to T-GB-6) |
| server word shots | `node qa/server-words/shots.cjs http://localhost:4173 qa/server-words` | 0 |
| guestbook phone shots (signing, keyboard open, done) | `node qa/guestbook-phone/phone-shots.cjs http://localhost:4173 qa/server-words/guestbook` | 0; server words while the sheet is open: none |
| fade never snaps | `node qa/server-words/snap-check.cjs` (dev server) | opacity across hide, unhide, hide, pause, resume, pause: 1, 0.73, 0.60, 0.47, 0.33, 0.20, 0; lanes released; resume spawns again |

Not run: the full suite (`npm run gates`, about 20 minutes, known SwiftShader base failures T-TRANS-6 and T-S02-5); Justin asked for lean verification. T-GB-2 failed once in an early run (seed equality, `?world=0`, no lane field, untouched by this change) and passed on rerun and in the final run.

report.json: every lit glyph sits on its lane's bent tip (tip error 0), each character holds its own lane. At 390 the words stay inside the viewport; at 1440 they enter from past the right edge as before (desktop is not clamped).

The stills run the page clock at 0.05 of real time (QA script only) because SwiftShader frames take seconds while a word lives 2.6s.

## Review loops

Two separate-run judge passes (Claude, fresh context, read-only prompt).
- Loop 1, APPROVE with two written-rule minors: a reduced-motion pause left a fade no loop carries (lanes could stay bent into the next scene); resume and unhide cleared mid-fade words (lanes snapped). Both fixed, plus scratch buffers in place of per-frame allocation.
- Loop 2, REQUEST CHANGES on one major: a second pause or hide re-armed a running fade, snapping lanes back to full bend. Fixed with a guard (a running fade is never re-armed), reduced statics wait while paused; verified by snap-check above, then frozen at the two-loop cap.

Logged, not fixed: the gb texture (98 KB) now uploads every frame on home while a word is lit (real-device frame time is Justin's check, K-SRV-6); a glyph's rest tip is snapshotted at spawn, so during a 150ms travel-exit fade the glyph can drift off its morphing lane; words need the measured font advance, so a font load failure shows no words; lane picks near the converged focus act as a tie-break (lanes in index order). Taste (do the words read as part of the field?) is for Justin on device; in stills the carrying lanes read subtly because the scene's lanes are already signal blue.
