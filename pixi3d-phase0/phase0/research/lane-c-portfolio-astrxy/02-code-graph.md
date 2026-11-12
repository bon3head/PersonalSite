# Lane C — 02 Code Graph: PersonalSite (Astryx build)

> CORRECTION — verified against live HEAD 2d75332 (2026-11-12, this edit). Lane C v1 was graphed at `astryx-build` 14ab8df (92 commits behind live HEAD). Live HEAD: `2d75332cb4f8ff430dd1905c0c36dc4fc18922bf` on `origin/astryx-polish-r2` and `origin/astryx-integration`; `origin/main` remains `c43c594` (spec-only, not the live site). Sections below are the 14ab8df graph UNLESS marked [2d75332]. New nodes in the 30-commit range 46d6a34..2d75332 (PR #9 lane-formed server words + PR #8 guestbook on real phones + PR #5 guestbook):
> - `src/chrome/GuestbookSheet.tsx` (349) + `src/motion/guestbook.ts` (646, `GuestbookDirector`) + `src/lib/guestbookStore.ts` (57, browser-local only) + `src/motion/entropy.ts` (162, `hash32`/`freshSeed`, no `Math.random` for motion).
> - `Lanefield` gains `guestbook: GuestbookHooks` and `words: LaneWordHooks` (types.ts:101-127, lanefield.ts:1423-1595), plus `getParams`/`setParams`, `laneAttributes`, `setHeroAnchor`/`heroAnchor`, `morphSample`, `pulse`, `setFocus`/`focusOffset`/`focusActive`, `projectAtRest`, `setGlitter`, `viewportCss`, `travelTo` gains `originPx` option. `LanefieldDebug` gains a diagnostic `camera` readout and optional `silhouette()` state.
> - `SheetId` gains `guestbook` (router.ts:10; hash from `T.guestbook.hash`, `#guestbook`); w/c hotkeys disabled while guestbook open. App lazy-loads GuestbookSheet (shares the engine chunk; warmed while Contact is open) and calls `server.setHidden(sheet === 'guestbook')` (App.tsx:321-326, 441-447). ContactSheet gains `onLeaveMark` → "Leave a mark" (`C-CON-GB`, ContactSheet.tsx:60-64).
> - Server words are now lane-formed (DESIGN 6.15, S05 1.3.0): each character rides its own lane tip via `field.words.writeLanes` + `setTint`; bend/tint follow word opacity; lanes never snap. Words share the guestbook offset texture `gbTex` (256×24 RGBA32F, 98,304 B; alpha 1 = guestbook, 2+slot = word; a guestbook write takes a lane back from words). `gbTex.needsUpdate = true` fires per frame while a word is lit (lanefield.ts:1554) — open issue K-SRV-6 (per-frame texture upload while a word is lit).
> - Token top level gains `zone, curve, morph, scene, lanefield, hero, entropy, glitter, guestbook, brand, perf` (tokens.generated.ts:3 version 1.6.0; DESIGN.md header v1.7.0 — see 03 §1).
> - `src/chrome/glitterbox.ts` (98) drives `field.setGlitter` (hold threshold `T.glitter.holdMs`); `T.glitter = {holdMs 500, maxWeight 0.85, ringRadiusPx 120, swirl 0.9}`.
> - `src/motion/` (stage 42, morph-controller 458, hero-descriptors 112) predate 46d6a34; `tools/agent-map.mjs` (202) is new in range. `vite.config.ts` adds a serve-only dev-HUD plugin; build script gains `brand` + `check:hud` steps.

Read-only analysis. All edges verified by reading the cited files. No inferred edges are presented as verified; see §7 for the two that were checked and found dead.

## 1. Entry points

```
index.html
  #world (fixed canvas mount, aria-hidden) + #root
  └─ /src/main.tsx
       ├─ initMotionPref()                       src/lib/reducedMotion.ts
       ├─ hydrateRoot | createRoot → <App/>      src/App.tsx (StrictMode)
       └─ startOnIdle() → requestIdleCallback → createLanefield(mount, {seed, reducedMotion, initial})
            └─ src/world/lanefield.ts  →  dispatchEvent('lanefield-ready', {detail: Lanefield})
                 └─ App listens, wires controllers + travel.setLanefield()

SSR / prerender path (build only, no browser):
  src/entry-server.tsx  renderRoute(scene, sheet) → renderToString(<App initialScene initialSheet />)
  tools/prerender.mjs   vite build --ssr src/entry-server.tsx → dist-server → dist/{index,leaflink/index,sidequests/index,404}.html
```

Key sequencing fact: the world starts on idle AFTER App mounts, and App attaches it late via the `lanefield-ready` event. Travel and controllers must therefore all tolerate `lanefield === null` (DOM-only travel with reduced timing). This late-attach contract is the single most important seam for a Pixi fork: the replacement engine must expose the same `ready` promise + `lanefield-ready` event + null-tolerance, or App/travel must change with it.

## 2. Scene graph (runtime object graph)

```
Lanefield (src/world/types.ts: Lanefield interface)
  ├─ scene: THREE.Scene
  │    ├─ laneMesh: THREE.Mesh(InstancedBufferGeometry 43,008 instances, ShaderMaterial lane.vert/frag)
  │    ├─ server words: troika Text pool ×6            (added by world/server.ts)
  │    ├─ leaflink pins/halos/ripples: 3 InstancedBufferGeometry meshes (world/leaflink.ts)
  │    └─ sidequests heads + poles: 2 InstancedMesh ×3  (world/sidequests.ts)
  ├─ camera: THREE.PerspectiveCamera  (owned by CameraRig, src/world/camera.ts)
  ├─ ready: Promise<void>               (resolves after worker layouts + compileAsync + first render)
  ├─ travelTo(layoutId, {instant})      (weight morph, T.motion.ms.travel; instant under reduced motion)
  ├─ setActivity(lanes, startSec, fadeAtSec, kind 1|2, uPerSec)   (writes activity DataTexture)
  ├─ clearActivity(kind?)
  ├─ screenToGround(xCss, yCss) → [x, z] | null      (ray to y=0 plane)
  ├─ worldToScreen([x,y,z]) → [xCss, yCss]           (project through shifted matrix)
  ├─ onFrame(cb) → unsubscribe                        (per-frame callback set; drives twins + controllers)
  └─ dispose()

App (src/App.tsx)
  ├─ router: createRouter()              src/router.ts (history.pushState / popstate / data-route clicks)
  ├─ travel: createTravelController()    src/travel.ts (controllers Map<SceneId, SceneController>)
  ├─ controllers (created on lanefield-ready):
  │    ├─ server:     createServerController(field, {reducedMotion})      world/server.ts
  │    ├─ leaflink:   createLeaflinkController(field, {target: #world, reducedMotion})  world/leaflink.ts
  │    ├─ sidequests: createSideQuestsController(field, {reducedMotion})  world/sidequests.ts
  │    └─ notfound:   createNotfoundController()  (no-op)                world/notfound.ts
  ├─ Readout (one <section>, content swaps at travel hidden point)
  ├─ SideQuestsTwins (only when scene==='sidequests' && wired)  scenes/sidequests.tsx
  ├─ Keymap / Wordmark / WhoamiSheet / ContactSheet / TravelHotkeys
  └─ window.__sceneControllers (test hook, Map)

CameraRig (world/camera.ts) — per-frame, inside lanefield.doFrame:
  basePose (from travel lerp) → + idle yaw (server/sidequests/scatter, weight-blended)
  → + leaflink drift → + pointer parallax (fine pointer only, damped) → applyPose()
  applyPose writes position/lookAt/fov + projectionMatrix.elements[8]/[9] = -shift (principal-point shift)
```

## 3. Call graph: travel (the cross-cutting flow)

```
User input: key 1/2/3, ArrowLeft/Right, click a[data-route], popstate, TravelHotkeys
  → router.go(scene) → history.pushState → onSceneChange → travel.travelTo(target)
    ├─ t=0: setKeymapAccent, aria-busy=true, old readout opacity→0,
    │        outgoing controller.pause(), lanefield.travelTo(SCENE_LAYOUT[target]) [async, not awaited]
    ├─ t=150ms (hiddenAt): readout.hidden=true, onSwap(target) → App setScene(target)
    ├─ t=350ms (regimeAt): applyRegime(target) — data-regime, color-scheme, theme-color, title
    ├─ t=400ms (inAt): readout.hidden=false, opacity→1, translateY 8px→0
    └─ t=T.motion.ms.travel (resolveAt): aria-busy=false, focus to new h1 if focus was inside,
         announce new h1, incoming controller.resume(), resolve
  Reduced motion or no world: all switch points collapse to 150ms, no translate, travel instant.
  Interruptible: new travelTo cancels pending timers, keeps current weights/pose as new start. No queue.
```

`SCENE_LAYOUT` (router.ts): server→server, leaflink→leaflink, sidequests→sidequests, notfound→scatter.
`SCENE_REGIME` (router.ts): server void, leaflink paper, sidequests field, notfound void. Regime drives `Theme mode` in App via MutationObserver (void/field dark, paper light).

## 4. Token flow (tokens → theme → components → world)

```
spec/astryx/DESIGN.md v1.0.0  (canonical; ```json design-tokens block, §12)
  │  tools/extract-tokens.mjs  (fails unless world.laneCount == server.sm.count * 128)
  ├─→ src/tokens.generated.ts        (T, 819 lines, "Do not edit")
  ├─→ themes/lane/tokens.generated.json  (same object, 818 lines)
  └─→ src/styles/tokens.generated.css   (--jp-* vars, 59 lines)
        │
        ├─→ themes/lane/laneTheme.mjs  (defineTheme 'lane'; typography Commit Mono;
        │      motion from T.motion.astryxMotion; tokens map [paper, void] pairs;
        │      components: button / kbd / bottom-sheet overrides)
        │      └─→ astryx theme build → themes/lane/dist/lane.css (398) + lane.js (304)
        │            └─→ imported by src/App.tsx  +  index.html body[data-astryx-theme="lane"]
        │
        ├─→ src/* imports { T } from './tokens.generated'
        │      ├─ world/*: lane counts, layout texture sizes, camera poses, class widths/alphas,
        │      │   fire params, word lists, governor, DPR caps, breakpoints
        │      ├─ travel.ts / router.ts: travelDom timings, motion ms, regimes
        │      ├─ chrome/* + scenes/*: readout widths, glyph px, hit radii, sheet sizes
        │      └─ shaders (via uniforms built in lanefield.ts / leaflink.ts, NOT imported directly)
        │
        └─→ src/styles/global.css + chrome.css  (consume --jp-* vars; lint-tokens forbids literals)
```

Enforcement: `tools/lint-tokens.mjs` (G-TOKENS) scans `src/**/*.{ts,tsx,css,glsl}` except `*.generated.*` and fails on any hex / ms / bare geometry literal. `tools/palette-receipt.py` (G-CONTRAST) checks every DESIGN.md color against 51 reference blues (OKLab ΔE ≥ 0.050, ≥ 0.10 from Meta blues) and every `contrastPairs` entry for WCAG. Rule zero (DESIGN.md §0): "If a value is not in this file, it does not exist."

Token shape (top level of `T`): `version 1.0.0`, `color`, `contrastPairs`, `type`, `space`, `radius`, `size`, `focus`, `motion`, `world`, `breakpoints`, `hueBudgetPct`, `budgets`, `chrome`, `a11y`, `posters`. World subtree: `laneCount 6144`, `pointsPerLane 8`, `segmentsPerLane 7`, `layouts [server, leaflink, sidequests, scatter]`, `layoutTexture {256×768, RGBA32F}`, `activityTexture {256×24, RGBA32F}`, `seed 20271201`, `dprCap {fine 2, coarse 1.75, floor 1}`, `server`, `leaflink`, `sidequests`, `scatter`, `camera`, `governor`.

## 5. Copy flow (copy deck → generated module → components)

```
spec/astryx/specs/S09-copy-deck.md §4 (table, source of truth)
  │  tools/extract-copy.mjs  (fails on duplicate IDs)
  └─→ src/copy.ts  (C, 56 entries, "Do not edit"; CopyId = keyof typeof C)
        ├─→ App.tsx: SCENE_ALT (C-*-ALT), titles via router SCENE_TITLE/SCENE_H1
        ├─→ router.ts: SCENE_TITLE, SCENE_H1
        ├─→ chrome/Readout.tsx, Keymap.tsx, WhoamiSheet.tsx, ContactSheet.tsx
        ├─→ scenes/{server,leaflink,sidequests,notfound}.tsx
        └─→ travel.ts: announcement reads rendered h1, falls back to SCENE_H1
```

Canonical copy deck is `spec/copy-deck-v2.md` (v2.1, byte-exact sha 18caf965 per commit 5c25655). Content lock: LeafLink + SideQuests only; GPA cut; phone hidden; Codeberg canonical code host, GitHub linked from whoami only; LinkedIn `https://www.linkedin.com/in/justin-poli-15406030b`; email `justinf0829@gmail.com`. Banned-scan (`tools/banned-scan.mjs` + `banned.txt`) enforces G-COPY on src and dist.

## 6. Layout data flow (worker → textures → shaders)

```
main.tsx startWorld(seed = T.world.seed = 20271201)
  → lanefield.ts creates Worker(new URL('./worker.ts', import.meta.url))
    → worker.ts generateAll(seed):
         genServer(seed, out, 0)      layouts/server.ts    (grid arithmetic, no RNG)
         genLeaflink(seed, out, 1)    layouts/leaflink.ts  (33-node lattice + graph side data)
         genSidequests(seed, out, 2)  layouts/sidequests.ts (campus plan + markers/trails side data)
         genScatter(seed, out, 3)     layouts/scatter.ts   (random segments)
       → postMessage({layouts: Float32Array, side}, [layouts.buffer])  (transferable)
    → lanefield onmessage: length check (256×768×4 = 786,432 floats), upload to layoutTex,
       SHA-256 digest → layoutHash → debugHandle, compileAsync(scene, camera),
       renderOnce, resolve ready, startLoop
  → per frame: uniforms.uW = layout weights (travel morph), uTime, uViewport, uDpr, uFrozen
  → lane.vert: texelFetch(uLayouts, lane*32 + lay*8 + k) ×4 layouts, weight-blend positions,
       class width/alpha/color lookup, fog, activity lookup
  → lane.frag: fire pulses, route (kind 1, ink) / trail (kind 2, chalk core + signal rim)
  → controllers write activity via lanefield.setActivity (LeafLink kind 1, SideQuests kind 2)
```

Layout texture addressing (S02): texel index = `(lane * LANE_STRIDE + layoutIndex * POINTS + k) * 4`, RGB = world position, A = class id (0–15; classes: 0 server lane, 1 server converge, 2–3 leaflink local/arterial, 4–8 sidequests grid/outline/hatch/walkway/trail, 9 scatter lane, 10 leaflink route, 11 sidequests trailLit). 6,144 lanes × 8 points × 4 layouts = 196,608 texels = 256×768. Instance count: 6,144 × 7 segments = 43,008 quads, one draw call.

## 7. Verified dead / stub edges (do not treat as live)

1. `src/world/stub.ts` `createLanefield` is NOT imported by `src/main.tsx` (real engine wired). It is still imported by `tests/travel.spec.ts` (lines 56, 83, 85) as the weights/pose source of truth. A Pixi fork must decide whether the stub stays three-based for travel tests or gets a Pixi-backed equivalent.
2. `src/scenes/server.tsx` and `src/scenes/notfound.tsx` are canonical content components that `src/chrome/Readout.tsx` does NOT yet delegate to (it inlines the same content; leaflink IS wired via `scenes/leaflink.tsx`). Per their file headers this is a BUILD-STATE request (B8), not a bug. A fork should wire all three or document why not.
3. `spec/portfolio-spec.md` (§2 stack: "three.js r186, WebGPU feature detection with WebGL2 fallback, TSL, GSAP, no framework") describes the PRE-Astryx single-file plan and contradicts the shipped Astryx build (S00: WebGPU skipped on purpose, WebGL2 only, React + Vite). The Astryx package governs the shipped code; portfolio-spec governs only the judgment calls in its §0/§2 (roster, anti-template, evidence-first).

## 8. Build gates (S11) — the fork must re-earn these

G-BUILD, G-TOKENS, G-CONTRAST, G-COPY, G-WORLD (6,144 lanes, one call, deterministic, recoverable), G-TRAVEL, G-CHROME, G-SCENES, G-HUE (`hueBudgetPct`: server 30, leaflink 10, sidequestsSignal 6, scatter 6), G-FALLBACK (no-JS, no-WebGL, reduced motion, posters), G-PERF-LAB (Lighthouse + bundle budgets, §4), G-PERF-DEVICE (real-phone p95 ≤ 16.7ms, manual), G-ANTI (taste gate, human-judged), G-CONTENT (traceability). Kill list (S11 §8) includes G-PERF-DEVICE p95 > 16.7ms at DPR 1.0. `npm run gates` = build + lint + theme:check + banned-scan dist + playwright test.
