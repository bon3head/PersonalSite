# AGENTS.md: how any agent works on this repo

Version 1.0.0, 2026-11-10. For every agent and model (Claude Code local or cloud, browser Claude, other vendors' CLIs). Claude Code reads it through `CLAUDE.md`. Sources for each rule: `agents/SOURCES.md`.

## 0. The repo in five lines

Justin Poli's portfolio. One WebGL field of 6,144 lanes, one draw call, re-formed per scene (server, leaflink, sidequests, 404) on the Astryx design system. Vite + React 19 + Astryx 0.7.1 + three 0.186 + Commit Mono. Every value lives in `spec/astryx/DESIGN.md`, every visible string in `spec/astryx/specs/S09-copy-deck.md`; code reads generated files. Specs come before code (`spec/astryx/BUILD-ORDER.md`). Justin decides, deploys and merges.

## 1. Derive your seat before you start

Nobody here plays a part. Your seat is three facts read off the ask and the code: the task class, the discipline, and the gates. Work them out in this order and write them at the top of your first note or commit.

1. **Task class, from the verb of the ask.** Match the deliverable, not the wording.

| The ask produces | Task class | Routing (agents/ROUTING.md) | Loop (agents/WORK-LOOPS.md) |
|---|---|---|---|
| a spec, plan, task cards, a decision record | plan | row not in repo: cross-row rules | plan |
| facts, a source check, a design reference, a tool vetting | retrieve | row 9 for design references | retrieve |
| new or changed code, shaders, copy drafts, compositions | generate | row 5, greenfield generation | generate |
| a verdict on someone else's output: PR review, spec review, QA | judge | review rules | judge |
| the same check over many inputs: seed sweeps, gate reruns, link checks | run | row not in repo: cheap-first | run |
| handing out cards, checking gates, updating BUILD-STATE.md | coordinate | row not in repo: cross-row rules | coordinate |

One verb per prompt. An ask with two verbs is two tasks with two seats (`guestbook/references/routing.md`).

2. **Discipline, from the files.** Name the files the work touches (or the diff), then run:

```
node tools/agent-map.mjs impact <files...>        # or: impact --changed [base]
```

`primary` is your discipline: the specs you read and the rules you follow, nothing more (BUILD-ORDER rule 1). `blast radius` is what the judge checks and which gates rerun. `needs Justin` means the change waits for his approval before it ships. The map is `agents/ownership.json`, built from BUILD-ORDER's ownership lists. If a file comes back `unmapped`, add a rule there in the same change.

3. **Context.** With a checkout, read the primary specs and the touched files, then look further only when you need to (just-in-time). Without one (browser Claude), build a pack: `npx repomix@1.19.0 --style xml --output <task>.xml --include "$(node tools/agent-map.mjs include <files...>)"`. Graph tools and what was verified: `agents/CODE-MAP.md`.

4. **Model and effort, from the task class.** `agents/ROUTING.md`. Cheap first; escalate by retrying failures, not by running everything high.

5. **Auto-fire gates, in order.** Section 2.

## 2. Auto-fire order (fixed, no skipping ahead)

The five gates are named in `guestbook/references/routing.md`. Their full definitions live in Justin's local workspace, not in this repo. The right column is the in-repo action that meets each contract.

| # | Gate | Contract | In this repo |
|---|---|---|---|
| 1 | local-goal-gate | goal contract with deterministic gates before work starts | write the "Done when" list (BUILD-ORDER card format) with the gates from step 2 before touching code |
| 2 | local-verify-stop | a DONE claim binds the receipted exit-0 run of the prescribed check | run the tests from step 2; `npm run gates` before a PR leaves draft; paste command and output |
| 3 | local-checkpoint-rollback | snapshot before risky edits; rollback restores byte-for-byte | commit or `git stash` first; rollback is `git checkout <sha> -- <files>` |
| 4 | local-lsp-gate | report only NEW diagnostics after an edit | `npx tsc --noEmit` before and after; report only lines that are new |
| 5 | gardner-coordinator-health | before declaring an agent dead or killing it, check its children, never the coordinator's own pulse | check the agent's subagents, background jobs and last commit before calling it stuck |

## 3. Separate seats

- The judge is never the generator's own run. A Claude-generated change is judged by another model family or by Claude on a different run with a fresh context (routing rules; Anthropic: a fresh reviewer has not seen the reasoning that produced the code).
- The judge gets the spec, the diff and the blast radius. It does not get the generator's notes or chat.
- The judge does not edit. In Claude Code, `.claude/agents/judge.md` has no Edit or Write tool; it keeps Bash only to run checks, and its prompt forbids changing files.
- The judge reports every finding with a severity and the rule it breaks. The generate seat fixes correctness and written-rule findings; style-only findings are logged, not fixed. Review loops cap at two.
- Taste (G-ANTI) is judged by a reviewer who has read nothing but the screenshots and the questions (S11 section 6).

## 4. Hard rules (no exceptions)

- Claude never deploys or merges. Pull requests open as drafts. No production changes.
- No value outside DESIGN.md. No hex, ms or geometry literal in `src/` outside generated files. Never hand-edit `*.generated.*` or `src/copy.ts`; run `npm run gen`.
- No string outside S09. Copy changes need Justin's approval. Never invent a fact, a receipt, a number or a quote; unknowns go in `spec/astryx/UNKNOWNS.md`.
- No em or en dashes and no italics in people-facing copy. Banned words: `tools/banned.txt` and S09.
- Decided, do not reopen: LeafLink is mutual aid; phone hidden; GPA cut; Codeberg is the code host; guestbook signatures are browser-local; GLITTERBOX is not in the guestbook; the PCB direction and cipher/ember theme are dead.
- Never lower a gate, skip or quarantine a test, or edit a budget to get green.
- Blocked means written down: `BLOCKED: <question> (<spec section>)` in BUILD-STATE.md, then stop. Do not work around a spec.
- Never use HeyGen hosted cloud render, paid services, or new dependencies without Justin's explicit approval.

## 5. Commands

| What | Command |
|---|---|
| Regenerate tokens, copy, fonts | `npm run gen` |
| Lint (tokens, banned words, palette) | `npm run lint` |
| Build | `npm run build` |
| All gates (about 20 minutes) | `npm run gates > /tmp/gates.log 2>&1; echo $? > /tmp/gates.exit` |
| One test file | `npx playwright test <file>` |
| Types | `npx tsc --noEmit` |
| Blast radius and seat | `node tools/agent-map.mjs impact <files>` |
| Rebuild the dependency graph | `node tools/agent-map.mjs build` |

Read exit codes from a file, never through a pipe: a piped exit code is the last command's, and that once hid 11 failing tests (BUILD-STATE.md, wave 1 gate).

## 6. Handoff and done

- Every task brief carries: one verb, objective, the files you own, the inputs to read, output format, boundary, stop condition (`agents/BRIEFS.md`).
- Return a short summary (about 1,000 to 2,000 tokens) plus file paths, not file dumps. Large outputs go in `qa/` or the project folder, referenced by path.
- Done means green with evidence: the command, its exit code and the receipt path. "Tests pass" alone is not evidence.
- Commit per card, message `B<n>.<m>: <card title>` for build cards, plus your environment's attribution lines.
- Log every routing decision with its reason and outcome in `agents/routing-log.md`.

## 7. Environment traps (recorded, recheck before relying on them)

- SwiftShader frame times are meaningless: use it for correctness, read `window.__lanefield` state, not timing (S11 section 2). Frame-time gates are real-device only.
- Cloud Playwright: pinned 1.64.1 wants its own Chromium; `qa/polish-2/playwright.local.config.ts` takes `PW_CHROMIUM=<path>` (recorded 2026-11-09).
- Blocked from cloud sandboxes as of 2026-11-09: codeberg.org, LinkedIn, hyperframes.studio, cdn.jsdelivr.net; inspomcp.dev only through WebFetch. npm is reachable.
- Repomix packs (`guestbook/repomix.xml`, `motion-design/repomix.xml`) go stale on any edit: regenerate with the command in that directory's README.
- Secondary sources quote stale numbers: verify against the live primary source (motion-design/README.md).

## 8. Where the rest lives

`agents/WORK-LOOPS.md` (each task class step by step), `agents/ROUTING.md`, `agents/CODE-MAP.md`, `agents/BRIEFS.md`, `agents/ownership.json`, `agents/SOURCES.md`. Project specs: `spec/astryx/README.md`. Build state: `BUILD-STATE.md`.

## Changelog

- 1.0.0, 2026-11-10: initial.
