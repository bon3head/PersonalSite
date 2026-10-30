# B6d 404 scene receipts (S08)

## Tests (tests/scenes/notfound.spec.ts)

- T-404-1: unknown path renders the scene. Load /nope (real App,
  real world): H1 C-404-H1 ("Nothing at this address."), title
  C-TITLE-404 ("Not found, Justin Poli"), weights one-hot index 3
  after world ready. PASS (32.6s, Chromium/SwiftShader).
- T-404-2: one key home. Load /nope?world=0, press 1: URL /, server
  readout visible (H1 "Justin Poli"), no document load (load-event
  count unchanged, window marker survives). PASS (8.0s).

## Hue (qa/scenes/notfound/HUE.md)

Measured 0.175% (1,795 of 1,024,000 px above OKLCH chroma 0.04) at
1280x800. No scatter budget exists in DESIGN or S08; the number
sits below every existing scene budget (server 30%, leaflink 10%,
sidequests signal 6%).

## G-COPY (404 route)

- banned-scan on B6d files (src/world/notfound.ts,
  src/scenes/notfound.tsx, tests/scenes/notfound.spec.ts): clean.
- The 404 route copy is C-404-H1 + C-404-P1 (from copy.ts, S09),
  both free of banned patterns; the prerendered dist/404.html is
  covered by the gates banned-scan dist (HTML) check.
- Kill criteria: no joke, illustration, or "lost in space" copy
  (K-404-1); keymap present and active on 404, ArrowRight/1 home
  (K-404-2, covered by T-404-2 and router stepScene).

## Controller (src/world/notfound.ts)

SceneController with documented no-op pause/resume: the engine
owns camera pose (poseFor scatter), idle yaw (weight-blended,
4deg over 24s from tokens), reduced-motion static, and weights.
No activity, picking, pins, or trails exist to pause.

## Readout content (src/scenes/notfound.tsx)

NotfoundReadout renders C-404-H1 + C-404-P1 with the same DOM
(h1 id h-notfound, one paragraph) as Readout.tsx's notfound branch
(B4-owned, already rendering this content in the live App).

## Integration fix required and applied (main.tsx, coordinator-owned)

Direct load of any non-server scene started the world at the
server layout (main.tsx hardcoded `initial: 'server'`), so T-404-1
first failed with weights [1,0,0,0] instead of [0,0,0,1] while H1
and title passed. Fix (verified): start the world at the URL
scene's layout, `initial: SCENE_LAYOUT[parsePath(...)]`. This
fixes direct load for all B6 scenes, not just 404. Applied in
this card's commit; coordinator acknowledgment requested in
BUILD-STATE since main.tsx is coordinator-owned.
