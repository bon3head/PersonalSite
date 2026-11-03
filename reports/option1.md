# Polish round 2, option 1: smaller mark on short phones

## Verdict: BLOCKED (stop condition triggered)

Option 1 does not work at 390x658. A smaller mark was implemented
properly through the DESIGN token path, measured in the browser, and
it still leaves no usable focus spot beside the mark, and no
SideQuests trail pans. Per the directive stop condition, work stops
here. No fallback to option 2 (two-leg pan) or option 3 (amend
T-HERO-BAND-WALK) was implemented. No token change ships, no
DESIGN.md 1.2.1 entry was written, no `test.fail` marking was
removed, and no gate was changed. The candidate change was reverted,
so this worktree is back to the polish-patch state (verified: `git
status` after cleanup matches the status recorded before any edit).
Nothing is committed.

What Justin must decide now (this is his call, not the implementer's):

1. Accept no pan at 390x658 (that viewport behaves as before this
   round, which the spec already records as acceptable), or
2. Pick option 2 (two-leg pan), or
3. Pick option 3 (amend T-HERO-BAND-WALK), or
4. Order a new spot-geometry decision (for example side spots or a
   smaller spot gap). That is not option 1 as decided, and it changes
   a threshold, so it needs its own decision and DESIGN patch.

## 1. Failing check first (task 1, patch state, 390x658)

Probe method: the polish-browser `open()` fake-clock pattern
(`page.clock.install`, `pauseAt` after load, wait for
`__lanefieldReady` and `__brandPrefetched`, then 16ms steps),
viewport 390x658, `/sidequests?seed=42`. Geometry read from
`[data-brand-mark="sidequests"]`, `.jp-wordmark` expanded by the
12px name pad, `.jp-readout`, `.jp-keymap`. Focus spots recomputed
with the exact `focusSpotsFor` rule in
`src/hero/heroGeometry.ts:189`: half 22 (from
`size.coarseMinTargetPx` 44), gap 68 (2 x 22 + `hero.ringPadPx` 12 +
SideQuests motion margin 12), spot kept only if its clearance from
every blocker is at least 22.

Baseline numbers (before any code change):

| Rect | Left | Top | Right | Bottom | Width x height |
|---|---|---|---|---|---|
| Mark (SideQuests) | 56 | 510 | 336 | 588.45 | 280 x 78.45 |
| Name zone (wordmark + 12px pad) | 4 | 4 | 138 | 52 | 134 x 48 |
| Readout | 16 | 52 | 374 | 480 | 358 x 428 |
| Keymap | 0 | 614 | 390 | 658 | 390 x 44 |

| Quantity | Value |
|---|---|
| Band between readout bottom (480) and keymap top (614) | 134 px |
| Gap above mark (readout bottom to mark top) | 30 px |
| Gap below mark (mark bottom to keymap top) | 25.55 px |
| Left clearance beside mark (viewport edge to mark left) | 56 px |
| Right clearance beside mark (mark right to viewport edge) | 54 px |
| Focus spot above mark (y = 510 - 68 = 442) | clearance 0, inside readout |
| Focus spot below mark (y = 588.45 + 68 = 656.45) | clearance 0, inside keymap |
| Focus spots kept by `focusSpotsFor` | none |

Per-trail walks at 390x658, baseline (T-SQ-TRACK criteria: head in
the band between readout bottom and keymap top no later than the
claim, pitch range under 0.01 degrees):

| Trail | Claim at (ms) | First head in band (ms) | Pitch range (deg) | Pan? |
|---|---|---|---|---|
| 1 | 1408 | never | 2.2890 | no |
| 2 | 1552 | never | 3.4646 | no |
| 3 | 1984 | never | 3.6981 | no |

Note: pitch range at 658 is large for every trail because with no
pan the walk keeps its lean. The pitch criterion only becomes
reachable once a pan exists and the lean yields to it, as it does
at 390x844 for trail 2 (section 5). The failing check is therefore
twofold: no spot, and no pan for any trail.

## 2. Where the size is decided (finding that shapes the candidate)

`src/hero/heroGeometry.ts:75` `heroDisplayedSize`, line 86:

```ts
const width = Math.min(T.hero.sizePx, maxWByArea, maxWByViewport);
```

`src/hero/BrandHero.tsx:218` calls it with the viewport and the
manifest aspect. Two facts matter:

- `hero.minSizePx` 160 is NOT an input to the size computation. It
  appears in `heroGeometry.ts` comments only, and in
  `tests/feedback-round/hero.spec.ts:565` as a lower-bound assertion
  on the LeafLink width. Lowering it globally would change no
  displayed size at all, so it cannot be the option 1 mechanism.
- The SideQuests mark at 390x658 is 280 wide because `sizePx` 280
  is the binding term (area cap allows 331.5, viewport allows 374).
  Its height follows the 1920x538 aspect: 280 x 0.2802 = 78.45.

So the candidate used the height-keyed form the directive prefers:
only short phones change, nothing else moves.

## 3. Candidate implemented and measured (then reverted)

Candidate tokens (added to the DESIGN.md `hero` block, regenerated
with `tools/extract-tokens.mjs`, never hand-edited in generated
files): `hero.shortSizePx` 200, `hero.shortHeightPx` 700.
`heroDisplayedSize` used `min(sizePx, shortSizePx)` as the size cap
when `vh <= shortHeightPx`, else `sizePx`. `tsc --noEmit` passed
after the change. This candidate is NOT in the tree anymore; it was
reverted after measurement (section 6).

Candidate numbers at 390x658 (same probe, same seed):

| Rect / quantity | Value |
|---|---|
| Mark (SideQuests) | left 96, top 526, right 296, bottom 582.03; 200 x 56.03 |
| Name zone, readout, keymap | identical to baseline (4..138 x 4..52; 16..374 x 52..480; 0..390 x 614..658) |
| Gap above mark | 46 px |
| Gap below mark | 31.97 px |
| Left / right clearance beside mark | 96 px / 94 px |
| Focus spot above mark (y = 526 - 68 = 458) | clearance 0, inside readout (bottom 480) |
| Focus spot below mark (y = 582.03 + 68 = 650.03) | clearance 0, inside keymap (top 614) |
| Focus spots kept | none |

Per-trail walks at 390x658, candidate:

| Trail | Claim at (ms) | First head in band (ms) | Pitch range (deg) | Pan? |
|---|---|---|---|---|
| 1 | 1408 | never | 2.2892 | no |
| 2 | 1552 | never | 3.4304 | no |
| 3 | 1984 | never | 3.6982 | no |

Claim times are identical to baseline, which is expected: the walk
itself is unchanged; only the (absent) pan could have moved the
head into the band. The smaller mark changed nothing about panning.

## 4. Why no credible smaller mark can work (threshold proof)

This is arithmetic from the measured blocker rects and the
`focusSpotsFor` code, not a guess. The readout bottom (480) and
keymap top (614) are independent of mark size: they were identical
in the baseline and candidate runs. Placement keeps the mark clear
of blockers expanded by the 12px SideQuests motion margin, so any
placed mark satisfies mark top >= 492 and mark bottom <= 602.

- Above spot: spot center y = mark top - 68 must clear the readout
  by at least 22, so y >= 502, so mark top >= 570. With mark bottom
  <= 602, mark height <= 32 px.
- Below spot: spot center y = mark bottom + 68 must clear the
  keymap by at least 22, so y <= 592, so mark bottom <= 524. With
  mark top >= 492, mark height <= 32 px.

For SideQuests (aspect 538/1920 = 0.2802), height 32 means width
114 px, down from 280. For LeafLink (square), height 32 means a
32 px mark, against `minSizePx` 160. A 114 px wide SideQuests mark
and a 32 px LeafLink mark are not a "smaller mark" in the sense of
option 1; they are a degenerate mark that also breaks the
`minSizePx` intent for LeafLink. Every mark taller than 32 px,
including the tried 200 px wide SideQuests mark (56.03 tall) and
a 160 px wide SideQuests mark (44.83 tall), has no focus spot at
390x658 under the current spot geometry.

Side note, for the "beside" reading: `focusSpotsFor` generates only
above and below spots at the mark center x. The 56/54 px (baseline)
and 96/94 px (candidate) of horizontal clearance beside the mark
cannot become a pan spot without new spot code, which is not a
token change and is not option 1.

## 5. Re-measurement at 390x844 (task 5, patch state)

Existing T-SQ-TRACK run
(`tests/feedback-round/polish-browser.spec.ts:175`, `test.fail` at
line 182 for trails 1 and 3):

| Trail | Result | Notes |
|---|---|---|
| 1 | Fails the band/pitch criteria, as marked `test.fail` | Runner reports an expected failure as passed; the underlying assertions fail, which is the marked state. |
| 2 | Passes | Attempt 1 timed out in `page.goto` (10 min test timeout, SwiftShader load, before any measurement; environment flake, not a code result). Attempt 2 passed in 47.3 s. |
| 3 | Fails the band/pitch criteria, as marked `test.fail` | Same status as trail 1. |

Contrast geometry at 390x844 (geometry-only probe, same seed,
mark 280 x 78.45, readout identical at 52..480, keymap 800..844):

- Band between readout bottom and keymap top: 320 px (vs 134 at 658).
- Mark top 574, bottom 652.45; gap above 94 px, gap below 147.55 px.
- Above spot y = 506, clearance 26 (>= 22, kept). Below spot
  y = 720.45, clearance 79.55 (>= 22, kept).

So the spot model is confirmed in both directions: spots exist at
844 where the band is 320 px, and cannot exist at 658 where the
band is 134 px unless the mark is at most 32 px tall. Trails 1 and
3 fail at 844 on `pathCrossesMark` (every straight pan sweeps them
under the mark), not on spot existence, which matches spec 10.2.

## 6. test.fail decisions per (viewport, trail) combo

| Combo | Decision |
|---|---|
| (390x844, trail 1) | KEEP `test.fail` (line 182). Still fails. |
| (390x844, trail 2) | No marking exists; passes. Nothing to remove. |
| (390x844, trail 3) | KEEP `test.fail` (line 182). Still fails. |
| (390x658, trails 1, 2, 3) | No 390x658 tracking check exists in `polish-browser.spec.ts`, and none was added. Adding an expected-fail check for a blocked option would enshrine the gap without a fix; the probe method in section 1 plus the numbers in sections 1 and 3 let the verifier recreate the check when an option is chosen. |

No gate was changed, no test was weakened, no budget or threshold
was changed.

## 7. DESIGN.md 1.2.1 entry: NOT written

Task 3 asked for a separate 1.2.1 entry holding the token change
and the 390x658 numbers. There is no valid token change, so writing
that entry would falsely imply option 1 works. DESIGN.md stays at
1.2.0, and the candidate tokens were reverted from DESIGN.md,
`heroGeometry.ts`, and the regenerated files
(`src/tokens.generated.ts`, `themes/lane/tokens.generated.json`,
`src/styles/tokens.generated.css`). Post-revert checks: no
`shortSizePx` or `shortHeightPx` anywhere in `spec/`, `src/`, or
`themes/`; `lint-tokens` clean; `tsc --noEmit` clean.

Draft entry withheld (NOT APPLIED, for the record only):

```text
- 1.2.1: NOT APPLIED. Option 1 candidate (hero.shortSizePx 200 under
  hero.shortHeightPx 700) measured at 390x658: mark 200 x 56.03,
  focus spots none (above y 458 inside readout, below y 650.03
  inside keymap), no trail pans. Threshold: band 134 px admits a
  focus spot only for mark height at most 32 px. No token ships.
```

## 8. README verb check (task 6): pass, no redesign

- SideQuests readme
  (`personalsite-astryx-build/feedback-2026-11-02/sidequests-readme.md`):
  line 5 calls it "a decentralized, self-hostable community-driven
  platform"; line 7 bases it on ActivityPub; line 13 says quests
  are "a fun way to get help with something". All four spec verb
  elements match: decentralized, self-hostable, quests as help,
  ActivityPub.
- LeafLink readme
  (`personalsite-astryx-build/feedback-2026-11-02/leaflink-readme.md`,
  26 lines): "communities to keep each other informed, aware, and
  supported by sharing announcements, asking questions, and sharing
  knowledge (seeds) without centralization or surveillance". That
  is consistent with the spec verb "mutual aid on a map" (community
  support, nothing central watches). The readme does not use the
  literal words "mutual aid" or "map"; the map is the site's
  presentation of LeafLink, not a readme claim. No contradiction,
  so no stop was triggered and item 3 was not redesigned.

## 9. Worktree state and receipts

- Worktree: `~/workspace/worktrees/personalsite-astryx-polish-r2`,
  branch `astryx-polish-r2`, base c64193d. Nothing committed.
  Nothing touched outside this worktree: no integration worktree,
  no origin, no V2 production, no PR.
- Setup: `npm ci` passed (272 packages, 0 vulnerabilities).
  Playwright used the installed chromium headless shell 1243 with
  SwiftShader flags, dev server on 127.0.0.1:5173 started manually
  (the repo config also waits on the 4173 preview server, which
  would time out without a build, so runs used a temporary
  no-webServer config; that config file was deleted after use).
  The dev server was stopped by PID after the runs.
- Scratch deleted after use: the 390x658 probe spec, the 390x844
  geometry probe spec, the temporary Playwright config, the vite
  log, and `test-results/`. Only this report is new in the tree.
- Run costs under SwiftShader: 390x658 probe about 5 to 6 min per
  run; 390x844 T-SQ-TRACK about 11.6 min for 3 trails (including the
  attempt 1 goto timeout), 47.3 s for the trail 2 retry.

## 10. Unknowns carried

- Exact 390x844 claim and first-in-band timestamps per trail were
  not captured: T-SQ-TRACK asserts ordering and pitch range but
  does not print timestamps. Only pass/fail per trail is known
  there.
- Whether Justin would accept any mark at or under 114 px wide for
  SideQuests (32 px for LeafLink) is his decision, not a
  measurement. It was not tested in the browser because it is
  outside the decided option 1 shape.
- Device run 3 numbers (real iPhone frame times, real brand assets)
  remain unmeasured, as in the spec section 0. Nothing here changes
  that status.
- Whether the 390x658 readout height (428 px) or keymap height
  (44 px) differs in Justin's actual in-app browser (webview
  chrome, safe areas) is unmeasured; the numbers here are the
  container's 390x658 viewport, which is the spec's stated device
  run 2 viewport.
