# BUILD-ORDER.md: how the swarm builds this

Version 1.0.0, 2026-10-30.

This file is the orchestration. It splits the build into task cards small enough for an agent with no other context, says which can run at the same time, and names the gate that must be green before the next wave starts. A coordinator (human or agent) hands out cards, checks gates, and updates `BUILD-STATE.md`.

## 1. Rules every agent follows

1. **Read only your card's inputs.** Every card lists the exact files to read. DESIGN.md and the relevant spec are always enough. If they are not, the spec has a bug: stop and report it, do not guess.
2. **Never invent a value.** Colors, sizes, durations, counts, camera poses come from `src/tokens.generated.ts` (generated from DESIGN.md). Never type a hex, a millisecond value or a geometry constant in `src/`. If a value is missing from DESIGN.md, stop and report.
3. **Never invent copy.** Strings come from `src/copy.ts` (generated from S09). If a string is missing, stop and report.
4. **Stay in your files.** Each card lists the files it owns. Do not edit files owned by another card. Shared files (`package.json`, `App.tsx`) are edited only by the card that owns them; others request changes in `BUILD-STATE.md`.
5. **Done means green.** A card is done when every test in its "Done when" list passes and its receipts are in `qa/`. Paste the test output into the card's entry in `BUILD-STATE.md`.
6. **Blocked means written down.** Write `BLOCKED: <question> (<spec section>)` under your card in `BUILD-STATE.md` and stop. Do not work around a spec.
7. **Commit per card** on the build branch with message `B<n>.<m>: <card title>`, plus the attribution lines your environment requires. Never merge, never deploy.
8. **Version stamps.** If a card changes a spec or DESIGN.md (only coordinator-approved), bump that file's version and add a changelog line with date and reason.

## 2. The waves

```
Wave 0   B0 Foundation ─────────────────────────────────────────────┐
                                                                     │ G-BUILD
Wave 1   B1 Theme      B2 Engine core      B3 Router + travel (stub) │
            │              │                    │                    │ G-TOKENS, G-CONTRAST(palette), G-WORLD(test layouts), G-TRAVEL(stub)
Wave 2   B4 Chrome     B5a Server layout   B5b LeafLink layout   B5c SideQuests layout   B5d Scatter layout
            │              │                    │                    │                    │ G-CHROME, layout unit tests
Wave 3   B6a Server scene   B6b LeafLink scene   B6c SideQuests scene   B6d 404 scene
            │                    │                    │                    │ G-SCENES, G-HUE, G-COPY
Wave 4   B7 Fallbacks and posters
            │ G-FALLBACK
Wave 5   B8 Integration, perf lab, anti and content gates
            │ G-PERF-LAB, G-ANTI, G-CONTENT, full G-* rerun
Wave 6   B9 Device run (Justin) and handoff
              G-PERF-DEVICE, ship rule (S11 section 9)
```

Maximum parallelism: 3 agents in wave 1, 5 in wave 2, 4 in wave 3. Waves 4 to 6 are single-agent.

## 3. Task cards

Each card: inputs, owns, builds, done when.

### B0 Foundation (wave 0, 1 agent)
- **Inputs:** S00, DESIGN.md (whole), S09 section 4, repo `spec/standard-implementations.md`.
- **Owns:** everything in S00 section 3 except `src/world/**`, `src/chrome/**`, `src/scenes/**`, `themes/lane/laneTheme.mjs`. Also creates `src/world/types.ts` with the S02 section 2 API types and `src/world/stub.ts`: a fake `createLanefield` that keeps weights and pose in memory, resolves `travelTo` after `T.motion.ms.travel` (or immediately when instant), and exposes the same `window.__lanefield` shape with `laneCount: 6144`. Creates `BUILD-STATE.md` with one section per card.
- **Builds:** package pins, generators, lints, layer order, index.html, `src/lib/*` verbatim snippets, a minimal `App.tsx` that renders C-SRV-H1 on the void ground.
- **Done when:** T-S00-1 to T-S00-6 pass. G-BUILD green.

### B1 Theme (wave 1)
- **Inputs:** S01, DESIGN.md sections 3 to 7 and 11, the `tokens.generated.json` from B0.
- **Owns:** `themes/lane/**`, `src/styles/global.css` regime block, `qa/astryx/**`.
- **Done when:** T-S01-1 to T-S01-5 (T-S01-5 can use a test page with one Button). G-TOKENS green for theme files.

### B2 Engine core (wave 1)
- **Inputs:** S02 (whole), DESIGN.md sections 6, 8, 12 `world`, `motion`, `budgets`.
- **Owns:** `src/world/lanefield.ts`, `shaders/*`, `worker.ts` (with a pluggable generator registry), `camera.ts`, `tween.ts`, `governor.ts`, `debug.ts`, `tests/world.*.spec.ts`.
- **Builds:** everything in S02 using four **test layouts** in place of real generators: server-test (6,144 straight lanes on a 96 by 64 grid), leaflink-test (6,144 random flat segments), sidequests-test (6,144 small circles' chords), scatter (implement the real S08 generator here; it is ten lines).
- **Done when:** T-S02-1 to T-S02-8 pass on the test layouts; unit tests of section 7 numbers pass.

### B3 Router and travel (wave 1)
- **Inputs:** S03, S04 sections 3 and 8, S09 titles, DESIGN `chrome.travelDom`, `motion`.
- **Owns:** `src/router.ts`, `src/travel.ts`, `tools/prerender.mjs`, `tests/travel.*.spec.ts`.
- **Builds:** against `src/world/stub.ts`. Readouts are placeholder components that render the right H1 from copy.
- **Done when:** T-S03-1 to T-S03-8 pass against the stub (T-S03-6 measures DOM feedback only in this wave).

**Gate after wave 1:** G-TOKENS, palette receipt, G-WORLD (test layouts), G-TRAVEL (stub). Then the coordinator swaps the stub for the real engine in `main.tsx` (one line) and reruns G-TRAVEL.

### B4 Chrome (wave 2)
- **Inputs:** S04, S01 section 5, S09, DESIGN sections 4, 5, 7, `chrome`.
- **Owns:** `src/chrome/**`, `src/App.tsx`, `tests/chrome.*.spec.ts`.
- **Done when:** T-S04-1 to T-S04-7 pass; axe zero on all routes with placeholder readouts.

### B5a to B5d Layout generators (wave 2, 4 agents in parallel)
- **Inputs:** S02 section 4.4 (worker contract, RNG), and one of: S05 section 3.1 (B5a), S06 section 3.1 (B5b), S07 section 3.1 (B5c), S08 section 3 (B5d). DESIGN `world.<layout>`.
- **Owns:** `src/world/layouts/<layout>.ts`, `tests/layouts/<layout>.test.ts`.
- **Contract:** `export function generate(seed: number, out: Float32Array, layoutIndex: number): SideData` writes 6,144 lanes by 8 points into `out` at the S02 texel indices and returns side data. Pure function, no DOM, no three.js imports.
- **Done when:** lane total 6,144; determinism (hash equal across two runs); the scene's T-*-1 unit test passes (T-SRV-1, T-LL-1, T-SQ-1); generation under 150ms in Node on CI.

**Gate after wave 2:** G-CHROME, all layout unit tests. The coordinator registers the four real generators in the worker (replacing B2's test layouts) and reruns G-WORLD.

### B6a to B6d Scenes (wave 3, 4 agents in parallel)
- **Inputs:** the scene's spec (S05, S06, S07 or S08) whole; S02 sections 2, 5, 6, 8, 9 (API, shaders, clock, camera, picking); S04 section 6 (readout variants); DESIGN `world.<scene>`, `world.camera.<scene>`.
- **Owns:** `src/world/<scene>.ts` (controller), `src/scenes/<scene>.tsx` (readout content), `tests/scenes/<scene>.spec.ts`.
- **Done when:** every T-* in the scene spec passes; the scene's hue budget passes; G-COPY passes for the scene's route.

**Gate after wave 3:** G-SCENES, G-HUE, G-COPY on all routes.

### B7 Fallbacks and posters (wave 4)
- **Inputs:** S10, S03 section 7.
- **Owns:** `tools/posters.mjs`, `public/posters/**`, noscript blocks, mode detection in `main.tsx`, `tests/fallback.*.spec.ts`.
- **Done when:** T-S10-1 to T-S10-6. G-FALLBACK green.

### B8 Integration and lab gates (wave 5)
- **Inputs:** S11 whole; QA receipts so far.
- **Owns:** `tools/qa-report.mjs`, `tools/trace-content.mjs`, `qa/content/facts.json`, `qa/anti/**`, Lighthouse config.
- **Builds:** reruns every gate from a clean clone; writes `qa/QA-REPORT.md`; runs G-ANTI with a fresh reviewer agent that has read nothing but the screenshots and the questions; runs G-CONTENT.
- **Done when:** every automated gate green, the kill list empty, `QA-REPORT.md` committed.

### B9 Device run and handoff (wave 6)
- **Who:** Justin (or whoever deploys a preview; Claude never deploys).
- **Does:** S11 section 5 on the reference phone, attaches the JSON, resolves or accepts each UNKNOWN in UNKNOWNS.md.
- **Done when:** S11 section 9 ship rule holds. The build agent posts the commit SHA, `dist/` byte counts and the QA report link.

## 4. BUILD-STATE.md format (created by B0)

```
## B2 Engine core
status: todo | doing | blocked | done
agent: <name>
commit: <sha>
tests: <paste of passing output, or failing test ids>
receipts: qa/world/...
notes: <one line per decision taken inside the spec's latitude>
BLOCKED: <question> (<spec section>)   # only when blocked
```

## 5. Critical path and risk

The critical path is B0, B2, B5 (slowest generator, likely SideQuests), B6c, B8, B9. The highest risks, in order: (1) real-phone frame time on the Server scene (6,144 thin lanes with per-fragment pulses), retired early by running G-PERF-DEVICE on B2's test layouts as soon as wave 1 lands, using a preview deploy; (2) the field theme override losing to Astryx's scoped CSS (S01 section 6), retired in B1; (3) troika text on the WebGL path compiling mid-travel, retired by S02 section 6 precompile and T-S02-6.

## 6. Changelog

- 1.0.0, 2026-10-30: initial.
