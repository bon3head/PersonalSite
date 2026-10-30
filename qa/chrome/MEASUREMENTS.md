# B4 Chrome measurements and findings (2026-10-30)

## T-S04-1 keymap containment (logged, not asserted)
Widths measured at 16px keymap labels (--text-label). Nav height equals
the token height at every width, and all 5 items share one top (the
written T-S04-1 criteria, asserted). Containment:
- 320px: OVERFLOW, right edge x574
- 360px: OVERFLOW, right edge x622
- 390px: OVERFLOW, right edge x622
- 768px: fits, right edge x638
- 1024px: fits, right edge x638
- 1440px: fits, right edge x654
- 2560px: fits, right edge x654
Finding 1 (spec math problem, coordinator/Justin decision needed): five
labels total 37 chars. Commit Mono advance is about 10px/char at 16px
(about 8.125px at the 13px floor), so about 301px before any gaps or
gutters at 13px. No spec-compliant sizing fits 320px, and at 16px labels
even 390px overflows. The spec remedies (gap to spacing-3 under 360px,
never below 13px, never truncate) cannot fix 320/360px. B4 keeps the
spec-literal implementation; the question is whether to accept overflow
at 320/360, drop the 320px test point, allow a different narrow-width
keymap, or another remedy.

## T-S04-2 coarse targets (390x844, hasTouch, isMobile)
Nav height 44 (token). All 5 keymap items at least 44x44. Contact sheet
action controls at least 44 tall: Copy email button and Open mail app
link (Astryx Button with href renders as an anchor, not a button).

## T-S04-3 axe
Zero violations on /, /leaflink, /sidequests, /nope, each with sheets
closed, whoami open, and contact open. One app change was required:
the wordmark sat outside any landmark (axe region rule), so App wraps
it in a div role="banner". No <header> element (design bans navbars).

## T-S04-4 copy paths
Granted clipboard context: "Copied." toast (type info). Denied context
(clipboard.writeText rejects, execCommand returns false): "Copy failed.
The address is selected." toast (type error) and the selection equals
justinf0829@gmail.com. Never silent.

## T-S04-5 focus return
Enter on the keymap whoami/contact button opens the sheet; Escape
closes it and focus returns to the same keymap button.

## T-S04-6 keyboard-only tab order on /leaflink
Wordmark "Justin Poli", readout "Code" link (accessible name includes
Astryx Link's "(opens in new tab)" suffix), then keymap items server,
leaflink, sidequests, whoami, contact.

## T-S04-7 sheet timing
Sum of dialog getAnimations() durations at most 300ms (token
sheetMaxMs) for both sheets.

## Test environment finding: world starves Playwright clicks
With the real engine running on SwiftShader (B2 measured 6.6s p50
frames), Playwright locator.click hangs forever ("waiting for
locator") even though the element is visible, stable, enabled, and the
hit target is inside it. DOM .click() and mouse clicks work; a blank
page locator click works. With ?world=0, locator clicks work. All
T-S04 tests therefore run with ?world=0 (the supported S02 no-world
path); no T-S04 test depends on lane morphing. This is a SwiftShader
test-environment artifact, not an app bug; real devices render at
60fps. Same class of issue as B2's skipped T-S02-8.

## Other findings for the coordinator (from B4, unchanged)
2. banned-scan false positive on .jp-live (S04 section 8 mandates the
   class name; hyphen creates a word boundary for \blive\b). Requested
   fix: add 'jp-live' to ALLOWED_LIVE in tools/banned-scan.mjs plus an
   S00 section 5.2 note, same pattern as aria-live (S00 v1.0.3).
3. Travel-to-world wiring gap: App takes a lanefield prop defaulting to
   null because main.tsx starts the world on idle but discards the
   instance, and window.__lanefield exposes no travelTo. With null,
   travel does DOM-only travel and lanes do not morph on scene change.
   Needs main.tsx to pass the world instance into App, or App to own
   world start. Coordinator/B8 decision.
4. Prerender mismatch: main.tsx uses hydrateRoot, but
   tools/prerender.mjs still injects only a placeholder readout, not
   the full App render. Production hydration will mismatch until
   prerender renders App per route with initialScene/initialSheet
   props (App already accepts them SSR-safe). B3-owned file; B4 did
   not edit it.
5. Wordmark fade nuance: S04 section 5 says the wordmark "fades with
   the readout during travel", but travel.ts has no wordmark hook
   (TravelDom covers readout/announce/busy/keymap only). Needs a
   TravelDom extension or App-level coordination; B8 polish.
6. 404 role=img omitted intentionally: no C-404-ALT exists in S09, so
   App renders no role=img div on 404 rather than inventing a string.
   If B6d wants one, it needs an S09 addition via coordinator-approved
   spec change.
7. Keymap label size: S04 section 4 does not specify one; B4 uses
   --text-label (16px, theme-consistent with the wordmark). The 13px
   alternative would reduce but not fix narrow overflow (finding 1).
8. Keymap height under border-box: S04 section 4 literally says height
   = keymap-h + padding-bottom safe-area; under Astryx's universal
   border-box that would crush content by the safe-area inset on
   notched phones, so B4 uses height calc(keymap-h + safe-area) with
   padding-bottom safe-area (content stays exactly keymap-h; in tests
   safe-area is 0, so measured height equals token height).
9. laneTheme types: B1's laneTheme.mjs ships no declarations, and a
   sibling .d.ts would live in B1-owned themes/lane/. App.tsx imports
   it with a // @ts-ignore plus a comment (tsc clean). If B1 ships
   types later, the suppression can be dropped. A standalone shim in
   src/chrome/ does NOT work: TS2665 (cannot augment a real untyped
   module from elsewhere).
