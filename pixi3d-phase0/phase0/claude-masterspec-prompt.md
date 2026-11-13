# Masterspec synthesis — PixiJS 3D portfolio fork

You are Claude Code, high effort, writing the full end-to-end masterspec for a unique PixiJS 3D fork of Justin Poli's portfolio site. This is a specification only. Do not write implementation code, do not deploy, do not touch production.

## Authority and bounds
- Justin approved this synthesis. Claude decides every open decision, deriving each choice from the data in the Phase 0 pool, not from preference. Where data does not settle a decision, say so, pick the option with the strongest evidence, and name the falsification test that would reverse it.
- Creative liberty is full within these bounds: agent-first Astryx integration, current lane theme, blue accent, Commit Mono typography. No extracted palette. No copy of the current site; a unique fork that pushes PixiJS 3D strengths as a demo.
- Production is untouched. No deploy step without explicit approval, and no deploy step is part of this spec's execution path.

## Inputs — read all of these first, in this order
Worktree: /home/hatch/workspace/personalsite-pixi3d-phase0, branch pixi3d-phase0-20261112, HEAD 38106e1, base 2d75332.
Staging pool: /home/hatch/workspace/pixi3d-portfolio-fork/phase0/
1. RESEARCH-INDEX.md — index and hashes for every lane artifact.
2. plan-masterspec.md — the plan. Execute its 7 tasks in order. Each task ends in its MASTERSPEC.md sections.
3. REVIEW-FINDINGS-TRIAGE.md — Codex review F1-F10, all conceded. Every finding must be addressed in the spec.
4. probe-f1/01-api-verification.md, 02-probe-results.md, 03-limits-unknowns.md — verified APIs and measured probe: 8 PASS, 2 ABSENT, 0 FAIL.
5. research/lane-a-pixi3d-docs/, lane-b-pixi-v8-skills/, lane-c-portfolio-astrxy/, lane-d-demos-refs/ — primary docs, v8 core, repo map and replacement surface, demos and adjacents.
6. design-extract/SYNTHESIS.md plus the three style briefs — Good Stuff FULL, Bruno Simon PARTIAL DOM only, Corentin Bernadou PARTIAL loader only.
7. OPEN-DECISIONS.md — decisions D1 reduced motion, D2 physics, D3 audio, D4 renderer backend, D5 shader language. Decide all five.
8. MEASUREMENT-PROTOCOL.md — instantiate with acceptance numbers.
9. MASTERSPEC-ROUTING.md — gates and review seat.
10. Repo source at 2d75332: src/world/server.ts, lanefield.ts, camera.ts, types.ts, leaflink.ts, sidequests.ts, src/motion/guestbook.ts, src/chrome/GuestbookSheet.tsx, spec/astryx/DESIGN.md.

## Pinned facts — do not contradict these
- @pixi/3d 0.1.0, pixi.js 8.23.0, three 0.186.1 to be removed, troika-three-text 0.52.5 to be removed, Astryx 0.7.1 as pinned in repo.
- Renderer semantics, three separate facts: WebGPU-first design positioning, WebGL-first runtime default, WebGL Recommended for production. Backend selection is a decision, not a slogan.
- BatchedMesh3D: setPassesAt is REQUIRED on every slot; a slot in no pass draws nothing with no error. Constructor signatures are in probe-f1/01; use them exactly.
- Off-center projection: ABSENT, no public API. Camera3DOptions has no shift or offset; projection is readonly. The three.js principal-point shift in camera.ts has no Pixi equivalent. Readout clear-zone layout depends on it: server fine [0.62, 0], leaflink coarse [0, 0.18], sidequests fine [-0.18, 0].
- Shader warmup: ABSENT, no public API.
- Renderer statistics: no renderer.info equivalent. The __lanefield debug contract must be re-specified, not claimed to exist.
- K-SRV-6: per-frame gbTex upload while a word is lit, lanefield.ts:1554. Do not silently inherit it.
- Test seams: tests/scenes/sidequests-harness.html imports Three and constructs THREE.Scene and THREE.PerspectiveCamera; motion/guestbook.ts imports currentVariant from world/camera.ts, which imports Three. Both must be replaced or preserved explicitly.
- Bruno Simon 3D world and Corentin Bernadou hero composition are unmeasured. No claim about them may enter the spec. Tooltip-first discovery is a hypothesis, not extracted evidence.

## Deliverable
- Write /home/hatch/workspace/personalsite-pixi3d-phase0/pixi3d-phase0/MASTERSPEC.md, following plan-masterspec.md sections 1-9.
- Every load-bearing claim cites its Phase 0 file with file:line or URL. No invented API signatures. No vendor scale claim without the [UNMEASURED] label.
- Every open decision gets a chosen option, the evidence for it, and a falsification test that would reverse it.
- Every gate names a command and the exact expected output. No gate that cannot be run.
- Cross-domain linkages required: Lane A/B API surface to Lane C replacement surface, design-extract patterns to HUD architecture, probe results to the lane-field rewrite, measurement protocol to the budget and debug contract.

## Verification before you report done
- File exists at the path above and is complete per plan-masterspec.md.
- Grep the spec for any API name not in probe-f1/01 or the lane files; remove or cite it.
- Confirm no deploy, no production change, no credentials, no personal details in the spec.
- Report: sections written, decisions made with evidence, unknowns carried forward, and the exact file path.
