# SOURCES.md: where each rule in AGENTS.md and agents/ comes from

Version 1.0.0, 2026-11-10. Every external page below was opened on 2026-11-10 and its byline read from the page. Paraphrases are marked as such; quoted phrases are the page's own words. No statement is attributed to a person beyond authorship of the cited page.

## 1. Anthropic, public

| Source | Byline, date | What this guide takes from it |
|---|---|---|
| [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Erik S. and Barry Zhang, 2024-12-19 | Start with the simplest thing that works. Workflow patterns: prompt chaining (the one-verb rule and generate, review, refine as separate calls), routing (task class to seat), orchestrator-workers (coordinate), evaluator-optimizer (generate and judge seats). Invest in the agent-computer interface. The page notes its tooling advice has aged since 2024. |
| [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | Jeremy Hadfield, Barry Zhang, Kenneth Lien, Florian Scholz, Jeremy Fox, Daniel Ford, 2025-06-13 | Multi-agent helps breadth-first work; "most coding tasks involve fewer truly parallelizable tasks than research". Multi-agent runs use about 15 times the tokens of chat. Each worker needs an objective, an output format, tool and source guidance, and boundaries. Scale effort to complexity. Workers "pass lightweight references back to the coordinator". Start evaluation with small samples. |
| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield, 2025-09-29 | Context is a finite attention budget; aim for the "smallest possible set of high-signal tokens". Just-in-time retrieval by paths and identifiers (the agent-map and include list). Structured notes outside the context window (BUILD-STATE.md, routing-log.md). Sub-agents return condensed summaries, often 1,000 to 2,000 tokens. Claude Code loads CLAUDE.md up front and greps the rest. |
| [Building agents with the Claude Agent SDK](https://claude.com/resources/articles/building-agents-with-the-claude-agent-sdk) (redirected from anthropic.com/engineering) | Thariq Shihipar, 2025-09-29 | The loop "gather context -> take action -> verify work -> repeat". Subagents for parallelization and context isolation. Verification by rules (lint), visual feedback (Playwright screenshots) and, less robustly, an LLM judge. The folder structure is a form of context engineering. |
| [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | Barry Zhang, Keith Lazuka, Mahesh Murag, 2025-10-16 | Progressive disclosure: name and description always loaded, body when relevant, bundled files when needed. This guide uses the same shape: AGENTS.md always, WORK-LOOPS.md and the specs when the seat needs them. Read bundled scripts before trusting them. |
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Justin Young, 2025-11-26 | Progress file and git history let a fresh session get up to speed; one feature per session; agents must not edit tests to pass; failure modes include declaring done early and marking work passing without testing. Matches BUILD-STATE.md, commit per card, and "done means green with evidence". |
| [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | Claude Code docs, read 2026-11-10 | Keep CLAUDE.md short and only for what the code cannot tell; the most useful line is the command that checks work. Ask for evidence, not "tests pass". A fresh reviewer helps because it has not seen the reasoning; delegating the same task does not make the answer smarter. Review against the spec and skip style, or fixes pile up. Must-run rules belong in hooks, not prose. |
| [Claude Code memory](https://code.claude.com/docs/en/memory) | Claude Code docs, read 2026-11-10 | Claude Code reads CLAUDE.md, not AGENTS.md; import with `@AGENTS.md`. Target under 200 lines per file. |
| [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | Claude Code docs, read 2026-11-10 | `.claude/agents/*.md` with `name`, `description`, `tools`, `model`, `effort`, `omitClaudeMd`. The description drives delegation. A read-only reviewer is enforced by its tool list. |
| [Claude Code skills](https://code.claude.com/docs/en/skills) | Claude Code docs, read 2026-11-10 | Skills follow the Agent Skills open standard; SKILL.md under 500 lines. Not used here: the guide must also serve agents that do not load skills. |

## 2. This project

| Source | What this guide takes from it |
|---|---|
| `/mnt/project-files/baseline/process/SPEC-DRIVEN-METHOD.md` (project files) | Specs precise enough for a swarm with less context; dependencies, verification, unknowns, version stamps. |
| `spec/astryx/BUILD-ORDER.md` | Agent rules 1 to 8, task card format, waves and gates, BUILD-STATE format, ownership lists (source of `agents/ownership.json`). |
| `spec/astryx/specs/S11-performance-qa.md` | Gate list, kill list, ship rule, G-ANTI fresh reviewer, SwiftShader caveat. |
| `spec/astryx/FINAL-POLISH-SPEC-2026-11-02.md` section 9 | The split into spec author, code QA reviewer and mechanistic runner; the code QA checklist. |
| `guestbook/references/routing.md`, `guestbook/README.md` | Routing rows 5 and 9, review rules, cross-row rules, the five auto-fire gates, one verb per prompt. |
| `motion-design/README.md`, `motion-design/hyperframes-skill.md` | HyperFrames loop, TMPDIR trap, no hosted render without approval, verify live numbers. |
| `BUILD-STATE.md` | The piped exit code that hid 11 failing tests; playwright webServer fix. |
| `spec/astryx/UNKNOWNS.md`, `spec/astryx/README.md`, project memory | Settled decisions (LeafLink mutual aid, phone hidden, GPA cut, Codeberg, browser-local guestbook storage). |

## 3. Where Anthropic guidance and the project framework differ

- Reviewer filtering. Claude Code best practices say to ask the reviewer for correctness gaps and skip style. The routing framework says report everything and filter afterwards, because "only report high severity" makes reviewers under-report. This guide does both in order: the judge reports everything with a severity, the generate seat fixes only correctness and written-rule findings.
- Different family versus different run. The framework prefers a judge from another model family; Anthropic's docs describe a fresh Claude reviewer. Both are allowed; another family first when available.
- Plan-blind review. The framework records as unknown whether a reviewer that has not seen the plan beats one that has. This guide gives the judge the spec but not the generator's reasoning, which is what Anthropic's docs describe.

## 4. Not verified, so not used

- Statements by named Anthropic staff outside the pages above. The only named author used is the byline of each page.
- The full model-routing framework files (`~/workspace/model-routing/framework/`): not in the repo; only the summary in `guestbook/references/routing.md` is used.
- The auto-fire gates' own definitions: only their one-line contracts in routing.md are used.
- code-review-graph and Graphify behaviour on this repo: not run (install refused in this session); see CODE-MAP.md.
