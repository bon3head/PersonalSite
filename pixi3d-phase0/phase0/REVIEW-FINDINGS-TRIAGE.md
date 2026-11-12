# Independent review findings triage

- Reviewer: Codex gpt-5.6-sol, separate seat, via local-second-opinion, 329.7s, cli 0.155.1, model reported via cli echo, not provider response metadata
- Summary: /tmp/review-pixi-phase0/so2/second-opinion.json
- Findings: /tmp/review-pixi-phase0/so2/codex.findings.json, sha ec75e23161d6fbfc8544d1c00b11098e31ccf3212f0cbbc71e9d7423d8ac2b71
- Verdict in findings file: BLOCK. Reverser text: requested verdict FAIL. Pool is not yet safe as masterspec input.
- Requirements check: PASS on all 24 indexed SHA-256 hashes, 2d75332 and pins @pixi/3d 0.1.0, pixi.js 8.23.0, three 0.186.1, Astryx 0.7.1 confirmed, vendor scale claims labeled unmeasured, K-SRV-6 confirmed at lanefield.ts:1554, extracted palettes and unmeasured Corentin hero / Bruno world explicitly excluded. FAIL on renderer semantics, exact migration APIs, measurement protocol, reduced-motion behavior, physics/audio scope, and Lane C stale/incomplete replacement guidance.
- Triage rule: CONCEDE with fix, or CONTEST with mechanism. All 10 findings were verified against the cited files before triage. No finding was contested.

## F1 major, correctness, CONCEDE as gap, probe required
- Claim: pool lacks exact PixiJS 3D API needed to specify the core lane-field rewrite.
- Evidence: Lane A 03:76-77, Lane C 04:35-37, 04:56, 04:100.
- Fix applied in this triage: none in docs alone can close it. Probe lane spawned: fetch full API reference at 3d.pixijs.download, verify BatchedMesh3D, custom materials, render passes, RGBA32F access, WGSL/GLSL parity, blend state, projection shift, shader warmup, renderer statistics, and run a minimal Vite probe. Masterspec authoring is blocked on the probe result.

## F2 major, correctness, CONCEDED and fixed
- Claim: pool conflates vendor architectural positioning with actual runtime default and fallback.
- Fix: Lane C 04 section 8 rewritten to three separate facts: WebGPU-first design positioning, WebGL-first runtime default, conservative production recommendation. Backend selection open pending target-device measurements.

## F3 major, docs, CONCEDED and fixed
- Claim: stale 14ab8df instructions survive in Lane C 05, entries 16-18.
- Fix: entries struck and replaced with 2d75332 worktree, 148-file pack, and verified live state.

## F4 major, tests, CONCEDED and fixed
- Claim: replacement inventory omits a direct Three.js test-harness dependency.
- Evidence verified: tests/scenes/sidequests-harness.html:15 import * as THREE, :35-36 new THREE.Scene and THREE.PerspectiveCamera.
- Fix: harness entry added to Lane C 04.

## F5 major, correctness, CONCEDED and fixed
- Claim: motion/guestbook.ts has another renderer-bound dependency besides Lanefield hooks.
- Evidence verified: guestbook.ts:19 imports currentVariant from ../world/camera, camera.ts:5 imports * as THREE.
- Fix: camera-helper dependency recorded in Lane C 04 correction header.

## F6 major, design, CONCEDED and fixed
- Claim: synthesis promotes unmeasured Bruno-world behavior into a prescriptive transfer rule.
- Fix: SYNTHESIS item 4 relabeled HYPOTHESIS, not extracted evidence. Bruno-derived world, lighting, material, and interaction rules stay out of the masterspec.

## F7 major, tests, CONCEDE as gap, protocol defined
- Claim: pool records performance gap but supplies no reproducible comparison plan.
- Fix: MEASUREMENT-PROTOCOL.md added, defining controlled 2d75332 baseline versus pinned Pixi probe, chunk attribution, repeated cold Lighthouse runs, backend/browser/device matrix, real-phone p95 frame time, and delta/budget acceptance criteria. Measurements themselves are not yet run.

## F8 major, design, CONCEDE as open decisions
- Claim: two behavior-defining decisions remain open: reduced-motion behavior and physics/audio scope.
- Fix: OPEN-DECISIONS.md added, listing decisions, options, and the masterspec requirement to choose explicitly, including choosing none. No decision was invented here.

## F9 minor, docs, CONCEDED and fixed
- Claim: Lane B retains version unknowns Lane A resolved from npm registry API.
- Fix: erratum added to Lane B 04, pointing to Lane A registry receipts, distinguishing npmjs.com UI 403 from registry.npmjs.org API success.

## F10 minor, docs, CONCEDED and fixed
- Claim: r187 publication claim propagated without primary-source evidence.
- Fix: Lane D 04 entry marked PROVISIONAL, third-party blog, verify against official tag and registry before any upgrade decision. Live pin remains three 0.186.1.
