# Plan — Masterspec synthesis, PixiJS 3D portfolio fork

- **Goal:** One masterspec that a coding agent can execute end to end to build the unique PixiJS 3D fork, deciding every open decision from data.
- **Spec:** phase0/RESEARCH-INDEX.md, phase0/REVIEW-FINDINGS-TRIAGE.md, phase0/probe-f1/01-api-verification.md, phase0/probe-f1/02-probe-results.md, phase0/MASTERSPEC-ROUTING.md, phase0/OPEN-DECISIONS.md, phase0/MEASUREMENT-PROTOCOL.md.
- **Global constraints:** Base 2d75332, branch pixi3d-phase0-20261112. Pins: @pixi/3d 0.1.0, pixi.js 8.23.0, three 0.186.1 removed, Astryx 0.7.1 as pinned in repo. Lane theme and blue accent, Commit Mono. No extracted palette. Production untouched, no deploy. No submittable coursework prose, not applicable here. No ETAs in any brief or spec.
- **Review focus:** Off-center projection with no public API, expected behavior is a named workaround with evidence, not a silent drop of the shift. BatchedMesh3D slot in no pass draws nothing silently, expected behavior is a setPassesAt call on every slot plus a test that fails when one is omitted. First-frame shader compile with no warmup API, expected behavior is a stated cost and a design that tolerates it. Renderer statistics with no public info API, expected behavior is a re-specified debug contract, not a claim that Pixi numbers exist.

## File structure
- Created: pixi3d-phase0/MASTERSPEC.md, the deliverable. Modified: none in src/. Read: phase0/research/*, phase0/design-extract/*, phase0/probe-f1/*, repo src/world/*, spec/astryx/DESIGN.md.

## Tasks
1. Vision and architecture. Deliverable: MASTERSPEC.md sections 1-2, one View3D plus thin 2D HUD, curved demo shelf, LeafLink and SideQuests as two panels, ContainerTexture for live 2D on 3D. Check: every claim cites a Phase 0 file or probe result.
2. Lane-field rewrite. Deliverable: sections 3-4, BatchedMesh3D, per-instance attributes, RGBA32F layout texture, custom ShaderBit GLSL only under D4, WGSL only as the P1-15 probe, setPassesAt on every slot, bulk matrix rewrite path. Check: constructor signatures match probe-f1/01 exactly. Amended 2026-11-12 per masterspec review F-002: the prior wording "WGSL plus GLSL" is struck; D5 supersedes it.
3. Scenes: server, leaflink, sidequests. Deliverable: section 5, per-scene migration from Lane C 04, troika replacement via ContainerTexture or pre-rendered atlas, guestbook and word hooks, K-SRV-6 disposition. Check: every three touchpoint in Lane C 04 maps to a Pixi mechanism or a stated redesign.
4. HUD, chrome, and theme. Deliverable: section 6, Astryx lane theme, blue accent, Commit Mono, editorial grid HUD, tooltip-first discovery as hypothesis, reduced-motion state machine. Check: no extracted palette, no Bruno 3D claims.
5. Open decisions, decided by Claude from data. Deliverable: section 7, decisions D1-D5 with a chosen option each, evidence cited, and a falsification test per decision. Check: no decision left open, no decision invented without evidence.
6. Measurement and gates. Deliverable: section 8, MEASUREMENT-PROTOCOL.md instantiated with acceptance numbers, world chunk budget re-measured, debug contract re-specified, test seams for the SideQuests harness and camera currentVariant. Check: every gate names a command and an expected output.
7. Build, ship, and rollout. Deliverable: section 9, branch, preview deploy, review seat, verify-stop binding, production untouched. Check: no deploy step without explicit approval.

## Interfaces
- Task 1 consumes Phase 0 pool. Tasks 2-4 consume task 1 architecture and probe-f1/01. Task 5 consumes tasks 2-4 plus OPEN-DECISIONS.md. Task 6 consumes tasks 2-5. Task 7 consumes task 6 gates.
- Each task produces its MASTERSPEC.md sections; later tasks cite section numbers, never repeat text.

## Self-review
- Spec coverage: every Lane C touchpoint, every F1-F10 finding, every probe verdict maps to a task above.
- Proportion: the plan is the skeleton, the masterspec is the body. No task body is transcribed here.
