# Masterspec synthesis routing, recalled 2026-11-12

Status: PAUSED. Do not start Claude masterspec writing until the F1 probe lane delivers 02-probe-results.md and 03-limits-unknowns.md and its JSON result block. Probe verdict determines whether the masterspec proceeds, is rescoped, or is killed.

## Gate order, fixed
1. Goal-gate first: goal contract with deterministic gates before work starts.
2. Verify-stop: bind receipted exit-0 verification before any DONE claim.
3. Checkpoint-rollback before risky edits: snapshot first, rollback restores byte-for-byte.
4. LSP-gate after code edits: report only NEW diagnostics.
5. Gardner-coordinator-health before declaring any coordinator or agent dead: children activity, workdir writes, session logs, never the coordinator's own pulse.

## Planning
- Writing-plans first: plan.md per subsystem, ponytail ladder over draft tasks before sizing, each task ends in an independently checkable deliverable.
- No plan composed without writing-plans may claim it exists. Skipped steps are named explicitly.

## Delegation
- General-delegation: one brief per task, context pinned by hash, machine-checked JSON result block, falsification fields for research work, verify-stop binding required.
- One bounded objective per brief. Verification must be a runnable file-backed script path, never inline python3 -c and never prose. Prove bindability by running the return check on the brief itself before the first spawn.
- A bound result is never re-checked by another agent: one verification, one binding, owned by the separate seat. The orchestrator aggregates, it does not re-verify.
- Goal contract copied verbatim from the store goal file, never paraphrased.

## Review seat
- Codex gpt-5.6-sol makes routine judgment calls and runs reviews, separate seat from builder, researcher, and spec author. No duplicated reviews or roles.
- Reviewer reviews only, never write access, never asked to fix or author tests.
- FAILED, SKIPPED, empty, or unparseable review output is incomplete review, never reported as no findings.
- Verify each returned finding against source before repeating. Agreement raises confidence, proves nothing.
- Model identity is provider-reported, never self-asserted. Record model as CLI reported it, as CLI echo, not provider metadata.

## Masterspec author
- Claude Code, high effort, opus-tuned prompt, separate context.
- Prompt built from files, no credentials, no personal details, no private messages.
- Full creative liberty within bounds: agent-first Astryx integration, current lane theme, blue accent, Commit Mono.
- Target: unique fork that pushes PixiJS 3D strengths, not a copy of the current site. Core mechanic: one View3D plus thin 2D HUD, curved demo shelf, LeafLink and SideQuests as two panels, ContainerTexture for live 2D on 3D.
- Cross-domain linkages required: Lane A/B API surface, Lane C replacement surface at 2d75332, Lane D demos, design-extract synthesis, F1 probe results, MEASUREMENT-PROTOCOL.md, OPEN-DECISIONS.md.
- Claude derives unblocks from data and acts agentically. Walls that need Justin are recorded as decisions in OPEN-DECISIONS.md, not guessed.

## Inputs, pinned
- Branch pixi3d-phase0-20261112, base 2d75332, commits f111fe1 and b1b499a.
- Phase 0 pool: RESEARCH-INDEX.md, REVIEW-FINDINGS-TRIAGE.md, probe-f1/ (pending completion).
- Live pins: @pixi/3d 0.1.0, pixi.js 8.23.0, three 0.186.1, Astryx 0.7.1 in repo.
- Known blockers to carry, not smooth over: off-center projection absent, renderer stats not preservable via public API, BatchedMesh3D setPassesAt silent-failure trap, K-SRV-6, bundle/Lighthouse unmeasured, physics/audio undecided, reduced-motion undecided.

## Approval
- Masterspec writing, publish, deploy, any people-facing send, any spend: exact action, explicit approval required. Production stays untouched.
- No ETAs. Never give expect-by or delivery-time estimates, including in briefs.
