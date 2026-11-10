# Guestbook on real phones: receipts (2026-11-10)

DESIGN 1.6.0 section 6.14, S05 1.2.0. Cloud run, SwiftShader, Chromium 1243, 390x844 at DPR 2, preview build.

| Check | Command | Exit |
|---|---|---|
| build | `npm run build > build.log 2>&1; echo $? > build.exit` | 0 |
| lint (tokens, banned, palette) | `npm run lint` | 0 |
| theme:check | `npm run theme:check` | 0 |
| banned-scan dist | `node tools/banned-scan.mjs dist` | 0 |
| types | `npx tsc --noEmit` | 0 |
| targeted tests | `npx playwright test -c qa/polish-2/playwright.local.config.ts tests/guestbook.spec.ts tests/scenes/server.spec.ts` | 0 (14 passed on the final head, including T-GB-6) |
| phone shots | `node qa/guestbook-phone/phone-shots.cjs http://localhost:4173 qa/guestbook-phone` | 0 |
| contrast | `python3 -I qa/guestbook-phone/contrast.py qa/guestbook-phone` | ALL PASS |

Not run: the full 169-test suite (Justin asked for lean verification; known base failures T-TRANS-6 and T-S02-5).

Keyboard-open is simulated: headless Chromium has no on-screen keyboard, so the script wraps `window.visualViewport` and shrinks its height by 336px, then fires `resize`. Real iOS keyboard behaviour (and the Safari vs in-app difference) is unverified until Justin's device check.

Contrast is the worst pixel behind each text (text hidden, background screenshotted) against the text color. First run failed at 2.22:1 because letter lanes were exempt from the dim and their bodies crossed the prompt; the dim now applies to every lane behind the panel. Final worst ratios: typed name 12.53, typed line 12.73, placeholder 6.70, seed 7.18, done copy 15.94, note 8.48 (floor 4.5). Full numbers: report.json.

Geometry (report.json): keyboard open, visual viewport 508px tall; panel bottom 492, Lock in pill 448 to 492, so both lines and the pill sit above the keyboard; the mark's glyphs land at y 25 to 126, inside the visible area. Server words while the sheet is open: none.

## Review loops

Two separate-run judge passes (Claude Opus, judge seat, fresh context).
- Loop 1, REQUEST CHANGES: reduced-motion dim box stale, reduced-motion words not cleared, frame followed the panel after lock-in, no test for the new rules, out-of-scope brand manifest diff. All fixed; T-GB-6 added (reduced motion: words hidden, dim box equals the panel rect, keyboard lift leaves one gutter, focus rule; close clears the dim and restores the words).
- Loop 2, REQUEST CHANGES on one major: the open-window snap could jump the camera if the keyboard rose within 700ms of open. Reverted to always easing (the original rule); mechanically verified with the run above, then frozen (review cap two).

Logged, not fixed (device checks or style): Android keyboard timing, 320x568 with keyboard up, per-frame getBoundingClientRect cost, leaflink pins and BrandHero still read innerWidth/innerHeight next to the canvas-box projection, single-seed contrast evidence.
