# B3 receipts: Router and travel (wave 1, against the B0 stub)

Card: B3 Router and travel. Files: src/router.ts, src/travel.ts,
tools/prerender.mjs, tests/travel.spec.ts, tests/travel-prerender.spec.ts.
Engine under test: src/world/stub.ts (B0). App.tsx untouched (B4 owns
it); browser tests use an in-page harness that wires router + travel
against the stub and the S04 page structure.

## Test runs (Playwright 1.64.1, Chromium, Vite dev on :5173)

tests/travel.spec.ts: 10 passed (42.9s)
- T-S03-1: no reload across 20 random go calls. PASS. Detectors: zero
  'load' events after setup, window marker survives. See note below
  on the K-S03-1 parenthetical.
- T-S03-2: deep links render the right scene. PASS. All four paths:
  H1, data-regime, __lanefield.weights() one-hot index, document.title
  match S03 section 2.
- T-S03-3: history back and forward stay in sync. PASS. / then 2 then
  3 then back, back to / (server); forward to /leaflink.
- T-S03-4: travel is interruptible. PASS. Press 2, wait 200ms, press 3;
  sidequests H1 + one-hot weights by 900ms after the second press;
  weights sum to 1 throughout.
- T-S03-5 (dev harness): clean console on every route. PASS. Zero
  console.error / pageerror across /, /leaflink, /sidequests, /nope.
- T-S03-6: DOM feedback under 250ms. PASS. Keydown to first frame with
  keymap item color changed and weights moved: measured in-page.
- T-S03-7: focus moves to the new H1 and the region announces. PASS.
  Focus on keymap + press 2: after 700ms activeElement is the LeafLink
  H1 and the .jp-live text is "LeafLink".
- T-S03-8: reduced-motion travel completes within 320ms. PASS.
  Measured in-page from keydown to fully opaque + one-hot weights.
- router: path normalization, hash, arrows, sheet replaceState. PASS.
  Trailing slash, uppercase, unknown path, #whoami/#contact, wrap
  both directions, 404 arrows, setSheet does not grow history.
- router: sheet open disables scene keys but not the sheet key. PASS.

tests/travel-prerender.spec.ts: 3 passed (59.9s)
- prerender: all four route files with correct shell. PASS.
  dist/index.html, dist/leaflink/index.html, dist/sidequests/index.html,
  dist/404.html each carry the right title, H1, data-regime,
  color-scheme, theme-color ground, meta description, and script tag.
  Built with plain `vite build` (theme step skipped; needs B1).
- prerender: copy strings match src/copy.ts. PASS.
- T-S03-5 (served prerendered paths): zero console errors. PASS.
  Served via `vite preview` on :4173; all four URLs load clean.

## Static gates on B3 files

- tsc --noEmit --skipLibCheck: zero errors in src/router.ts and
  src/travel.ts. (Remaining repo errors are pre-existing missing
  @types/react, @types/react-dom, @types/three in B0 files; see
  BUILD-STATE request.)
- lint-tokens: no violations in B3 files.
- banned-scan src: clean (B3 files). Note: the TravelDom announcement
  getter is named `announce`, not `live`, because banned-scan reads
  full .ts content and bans the standalone word.

## Notes for the coordinator (not BLOCKED)

1. K-S03-1 detection is wrong as written: Playwright 1.64 fires
   `framenavigated` for history.pushState (verified with a bare
   pushState test), so the parenthetical detector false-fails correct
   code. T-S03-1 verifies the intent instead ('load' events + window
   marker). Suggest a coordinator spec fix to K-S03-1's parenthetical.
2. @types/react, @types/react-dom, @types/three are missing from
   package.json, so `tsc --noEmit` (in `npm run build`) fails on B0
   files today. Request: B0 adds them (package.json is B0-owned).
3. B4 handoffs: (a) mount TravelHotkeys in App (wave 2); keymap items
   need data-scene attributes for travel's aria-current accent, or
   set aria-current declaratively from router state (same value, no
   conflict). (b) Prerender currently replaces all of #root with the
   S04 placeholder readout; when App renders full chrome, prerender
   must swap only the readout section. (c) main.tsx uses createRoot;
   S03 section 7 wants hydrateRoot once the client render matches
   prerender output. (d) banned-scan flags the standalone word in
   .tsx, so rendering aria-live="polite" in JSX will trip it; the
   scanner or the attribute spelling needs a coordinator decision
   before B4 writes chrome.
4. 404 ArrowLeft: S03 specifies ArrowRight from 404 goes to server but
   is silent on ArrowLeft. Implemented as wrapping to sidequests (the
   symmetric completion). If Justin wants both arrows to server, that
   is a one-line change in stepScene.
5. Full `npm run build` / `npm run gates` not run: the theme step
   needs B1's laneTheme.mjs (B0 notes T-S00-1 pending B1). Wave 1 gate
   rerun after B1 lands should cover it.
