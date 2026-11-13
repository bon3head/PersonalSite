# Masterspec independent review triage

- Reviewer: Codex gpt-5.6-sol, separate seat, via local-second-opinion, 472.3s, cli 0.155.1, model reported via cli echo, not provider response metadata
- Summary: /tmp/review-pixi-masterspec/so/second-opinion.json
- Findings: /tmp/review-pixi-masterspec/so/codex.findings.json
- Verdict: BLOCK. 8 findings, F-001 to F-008, 6 major, 2 minor.
- Requirements check: API claims for BatchedMesh3D, ShaderBit, bounded RGBA32F, Camera3D, View3D, and absence of renderer.info supported by saved docs and probe evidence. D1 evidenced and testable. Projection workaround PASS, section 3.4 names the oversized-offset View3D workaround, preserves shift, labels remaining behavior unverified, assigns P1-5 and G-PX-SHIFT. Coverage of Lane C touchpoints, F1-F10, K-SRV-6, and named test seams substantial.
- Triage rule: CONCEDE with fix, or CONTEST with mechanism. All 8 findings verified against cited files, all conceded.

## F-001 major, correctness, CONCEDED and fixed
- D4 chose WebGL2 without the target-device measurements OPEN-DECISIONS.md requires, and invented a 20 percent reversal threshold.
- Fix: D4 is now conditional on the B10.1 device-matrix probe P1-14, with command, oracle, and receipt. The 20 percent bar is struck; the reversal threshold is derived by the probe card from measured variance or an approved requirement.

## F-002 major, correctness, CONCEDED and fixed
- D5 GLSL-only left plan task 2 uncovered and its falsification could not be executed by a WebGL-only B10.1.
- Fix: plan-masterspec.md task 2 amended to GLSL-only under D4, WGSL only as probe P1-15. D5 falsification now names P1-15 with command and exact result.

## F-003 major, correctness, CONCEDED and fixed
- Core shelf depends on ContainerTexture runtime behavior the pool leaves unexercised, with no probe item and no UNVERIFIED label.
- Fix: P1-13 added to B10.1, covering construction, first render, manual render with autoUpdate false, curved orientation, cleanup, and draw-count, with atlas fallback or BLOCKED before B10.8. Section 5.8 labels ContainerTexture UNVERIFIED.

## F-004 major, tests, CONCEDED and fixed
- M0/M1 comparison not controlled, and A1 silently changed the world-budget metric from one manual chunk to a fetched-chunk sum.
- Fix: M1c content-equivalent renderer comparison added. A1 restores the manual-chunk metric; the fetched sum is secondary only. Measured disposition is re-recorded in DESIGN.md and S11 with approval.

## F-005 major, tests, CONCEDED and fixed
- Gate matrix did not meet its own executable-command and verify-stop contract: bare grep -c zero-match exits, Playwright gates without exit-code files, LH without a preview server, DEVICE placeholders, G-ANTI without a command.
- Fix: zero-match greps wrapped, Playwright runs capture exit codes to files, LH starts and stops its own preview server, DEVICE iterates concrete qa/device/*.json files, G-ANTI gets a command and artifact check.

## F-006 major, tests, CONCEDED and fixed
- Runnable spec gates did not pass and two were structurally broken: S-2 and S-3 bare grep -c exit 1 on zero matches, S-3 searched strings present in its own command block, S-4 expected a commit that did not exist.
- Fix: S-2 and S-3 print 0 on a clean file, S-3 scans the file with section 8.7 removed. Gates re-run after this fix pass; S-4 passes only after the commit lands.

## F-007 minor, design, CONCEDED and fixed
- D2 and D3 gave future scope-change triggers, not runnable falsification tests.
- Fix: both labeled reopen criteria, with runnable tests added: dependency absence by package.json grep, no AudioContext or audio files, silent-operation and live-region checks.

## F-008 minor, docs, CONCEDED and fixed
- Leaked transcript wrapper tags at the end of the file, and an unsupported byte-identity provenance statement.
- Fix: trailing `</content>` and `</invoke>` tags removed. Provenance now carries a hash receipt: transcript Write 98,907 bytes sha256 7f458e46a51dfc35c186adfc5dd0cc92799585b2dacf9060ce3d2b4a9a985e69, matched before the header correction and fix pass.
