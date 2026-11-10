# Guestbook build notes

Build of `guestbook/prompt.md` (branch `astryx-polish-r2`, built on `claude/project-thread-h1kchx`). One design, one build, one refine cycle, per the stop condition. Spec values live in `spec/astryx/DESIGN.md` 1.5.0 section 6.14 and the `guestbook` token block; strings live in `spec/astryx/specs/S09-copy-deck.md` 1.6.0 (`C-CON-GB`, `C-GB-*`).

## Open decision: where signatures are stored

Not decided here. The options named in the brief:

1. A JSON file in the repo. Durable and reviewable, but a static site cannot write to its own repo, so it needs a write path (a pull request bot, a serverless function with a repo token, or manual curation).
2. A lightweight form endpoint. Durable and shared across visitors, but it is a third-party service or a function that does not exist in this project today, and it brings spam and moderation questions.
3. Browser-local only. Works today with no backend; each visitor sees only their own marks; nothing is shared.

What ships until Justin picks: option 3 behavior through one named hook, `storeSignature(sig)` in `src/lib/guestbookStore.ts` (key `jp.guestbook.v1`, newest first, at most 5 kept). The sheet says "Saved in this browser only." Wiring option 1 or 2 means replacing the body of that one function; the sheet only awaits its result.

## Design

The lane field is the sheet. There is no card, no white surface, no label above an input, no heading, no toast.

- **Entry.** "Leave a mark" inside the Contact sheet. It opens hash `#guestbook` over the current scene (a sheet in the router's sense, S03 section 2). No route, no tab, no keymap item.
- **Open (push-in).** The camera dollies toward the well (the scene's camera target) by 26% of the distance, turns a seeded yaw, and its lens shift moves so the well rises to mid screen. Lanes inside the part radius move outward and to a per-lane seeded height (y), three depth bands 75ms apart. 700ms on the Lusion main curve. The readout and hero are hidden while the sheet is open.
- **Type (auto-sweep).** Each character claims the nearest lane. That lane bends toward the camera to a seeded height on a baseline with seeded wobble, and the glyph rides its tip at its true depth (projected each frame, scaled by perspective). Until lock-in every letter lane carries seeded noise, and the seed readout rolls hex digits.
- **Lock in (noise becomes identity).** Noise goes to zero, heights snap to the sign seed's values, glyphs resolve left to right, the seed readout resolves digit by digit to the sign seed, the camera pushes in a little further. 400ms, Lusion soft curve.
- **Pull back.** After a 300ms hold the camera pulls out past rest (wide) with a seeded drift; the mark settles at a seeded offset and scale; the part relaxes. 1600ms (`wordCadence`), Lusion soft curve.
- **Close.** Everything returns to zero over 700ms on the Lusion main curve; letter lanes return; the camera returns to rest; focus returns to the contact key.
- **Panel.** Two prompt lines (block caret, input, placeholder; `aria-label` from S09), a pill with a dot that slides on hover, and the seed readout. The panel moves on translateZ under perspective, never on opacity.

## Entropy

Seed source: `crypto.getRandomValues`, one new 32-bit value per call to `freshSeed` (`src/motion/entropy.ts`). With `?seed=` in the URL, `freshSeed` returns `hash32(sessionSeed, channel, n)` instead so a run replays (channels `guestbook-open`, `guestbook-sign`). Every value is `hash32(seed, PARAM, index)` in `src/motion/guestbook.ts`.

| Seed | Drawn | Drives |
|---|---|---|
| open seed | each open and each Sign again | part heights per lane (shader `uGbSeed`), camera yaw and rise, baseline wobble, letter heights while typing, typing noise, rolling readout |
| sign seed | each lock-in | final letter heights, settle offset and scale, pull-back drift, glyph scramble, the hex shown |

T-GB-2 checks two signs of the same name get different seeds.

## Engine cost

Same mesh, same draw call, same WebGL context. Added: one RGBA32F texture the size of the activity texture (256 by 24, 98,304 bytes) holding per-lane offsets for letter lanes, nine uniforms (one binds that texture), and a camera layer in the frame loop. Measured build sizes (gzip): world chunk 211.73 KB (budget 220; was 209.71), app shell 145.48 KB (was 145.27; already over its 110 KB budget before this work, follow-up still open), guestbook chunk 5.37 KB loaded on first open and warmed while Contact is open.

## References

Inspo (https://inspomcp.dev) was reached through a web fetch; the sandbox network blocks the host directly. The fetch returns page text and DESIGN.md tokens, not the captured images, so visual observations below are limited to what the text states. Inspo has no guestbook or "leave a mark" entries tagged; the closest flows:

| Product | Inspo URL | Observed (from the page) | Taken |
|---|---|---|---|
| North | https://inspomcp.dev/screens/northmail-app | Centered, pill-shaped email capture in the nav; `--radius-pill: 999px` | Single-line capture in a pill instead of a stacked form |
| Counterpunch (example) | https://inspomcp.dev/examples/type-newsletter | "Single email field, inline submit, real success state, cadence note underneath"; primary pill on a near-black ground | One field, inline submit, a real result line under it instead of a toast |
| Overmind | https://inspomcp.dev/sites/overmindlab-ai | "Retro-futurist terminal mood", monochrome high contrast | Prompt lines with a block caret, mono type |
| Raycast | https://inspomcp.dev/sites/raycast-com | "Terminal aesthetic", GeistMono buttons on a dark ground | Mono labels on controls, dark ground |

Motion references (from the repo): Lusion extract for the two beziers, the 400ms default, transform-only motion, and the pill with a sliding dot; oklou for push-in, lock-in, pull-back; Bruno Simon for discovering by moving through 3D space and for the perf discipline (no lights, no second renderer). The Inspo match is partial, so the visual design leans on these and on the site's own tokens.

## Review against the success criteria (separate step) and the refine it drove

| Criterion | Draft result | Refine |
|---|---|---|
| Sign in under 30 seconds, mobile and desktop | First draft lost the first keystrokes: focus landed on the hidden panel while Contact returned its focus | Focus the prompt once the panel is shown; pull stray focus back while open (modal). T-GB-1 signs in well under 30s |
| Open, sign, close are 3D morphs | Draft dollied toward a ground point under the screen center, which on desktop server is empty floor, and the lanes left the frame | Dolly toward the scene target (where lanes are) and move the lens shift so the well rises to mid screen |
| Readable mark | Draft letters rose too high and scattered | Lower lens shift and heights; smaller settle radius so the settled mark stays on a 390px screen |
| Reduced motion static path | Without the camera move the mark ran off the right edge on desktop | Slide the well along the target's screen row until the name fits; camera untouched (T-GB-5) |
| Fresh seed per sign, named source | Met | none |
| Two Lusion beziers plus site ease, no springs | Met (`guestbook.easeMain`, `guestbook.easeSoft`) | none |
| No GLITTERBOX, no conventional form, no page, nav item, asset, font, palette, or second context | Met (T-GB-1 checks no labels, no heading, pill radius, transparent panel, path unchanged, keymap count unchanged; T-GB-4 checks one canvas, 6,144 lanes, at most 12 draw calls) | none |
| Budgets, no layout shift | Document height equals viewport height while open (T-GB-1); world chunk under budget | none |
| Claims quoted from the spec or code | Tokens and timings cite DESIGN.md 6.14 and the token block | none |

## Not verified

- Real devices. Every run here is headless Chromium with SwiftShader, where a frame takes one to five seconds, so smoothness, 60fps, and the feel of the timings are unmeasured. Device run needed.
- Safari and WebKit (not installed here).
- The proposed `guestbook.*` numbers are first tunings from screenshots, marked proposed in the DESIGN changelog.
- Inspo captures were not seen as images (text fetch only).
