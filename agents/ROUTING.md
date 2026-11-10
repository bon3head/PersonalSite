# ROUTING.md: task class to model and effort

Version 1.0.0, 2026-11-10. Source: `guestbook/references/routing.md` (a summary of Justin's model-routing framework, whose full files `routing-table.md`, `prompt-library.md` and `auto-fire-rules.md` live at `~/workspace/model-routing/framework/` on his machine and are not in this repo). Only what that summary states is written here. Rows it does not state are marked UNKNOWN, not guessed.

## 1. Rows stated in the repo

### Greenfield generation (routing-table row 5): new code and new designs from a brief

- Model and effort: Claude Opus 5.5 `high` (or GPT-6 Astra starting at `low`). Alternate GPT-6.1 Sol `medium`.
- Mechanism: generate, then review against criteria, then refine, each a separate call so it can be logged or branched. No cheap-model self-critique loop.
- Fallback chain: Opus 5.5, then Sonnet 5.5 `high`, then Sol `medium`. If the fallback is a weaker model, drop the self-refine step.
- Budget: one generation and one refine cycle per brief; a second refine only on a failed external check (tests, build, gates). Numeric token budget UNKNOWN.
- Prompt template: multishot examples in `<example>` tags, XML structure, self-correction chaining, and named patterns to avoid (a vague "avoid generic" swaps one default for another).

### Review (the judge seat)

- Reviewer: a different model family than the generator, never the same run, routed to the strongest available judge. For a Claude-generated artifact: GPT-6 Astra `xhigh`, or Claude Opus 5.5 `high` on a different run.
- Technique: reference-guided judging (the judge answers independently first, then grades against its own reference) and report-everything-then-filter (an "only report high severity" instruction makes the reviewer under-report).
- Cap: two review loops; the second rebuild only for data-forced mechanical breakage, then freeze after mechanical verification.
- Review prompts ask whether the output stayed inside the brief's boundary, not only whether it is good.

### Design-reference lookup (routing-table row 9): retrieval, not reasoning

- `low` effort plus Inspo web-gallery browsing (https://inspomcp.dev). Never the best model at high effort.
- Inspo replaces Mobbin and Refero for this project (Justin, 2026-11-09). The framework files still record Mobbin and Refero; updating them is a separate decision.

## 2. Rows not stated in the repo (UNKNOWN)

Planning and spec authoring, research synthesis, mechanical runs, coordination, and video motion have no row in the repo. Until Justin's framework is checked in or quoted, apply the cross-row rules (section 3) and log the pick.

Precedent, not a row: the 2026-11-02 polish round (`spec/astryx/FINAL-POLISH-SPEC-2026-11-02.md` section 9) split work as Claude for spec and main features, "CLI Astra" for code QA and polish, and "AGY 3.8 flash" as the mechanistic runner for seed sweeps.

## 3. Cross-row rules (load-bearing)

- Cheap first. The strong model is reserved for what the cheap model cannot answer reliably.
- Escalate by retrying failures, not by running everything high.
- Order of moves: sweep effort on the current model first, then try the stronger model alone at low effort, then a pairing only if it beats the single model's whole score-versus-spend curve.
- Session stickiness: prefer changing effort over switching models inside a session; a switch pays a cache-rebuild cost.
- Log every routing decision with the reason and the outcome (`agents/routing-log.md`).
- No row depends on a single vendor's router as its only mechanism.

## 4. How Claude Code applies this

The seat files in `.claude/agents/` encode the stated rows where Claude is the model, using the documented `model` and `effort` frontmatter fields (code.claude.com/docs/en/sub-agents):

| Seat file | Task class | model / effort | Basis |
|---|---|---|---|
| `judge.md` | judge | opus / high, no Edit or Write tools | review rule: Opus 5.5 high on a different run; a subagent is a separate run with its own context |
| `taste-judge.md` | judge (G-ANTI) | opus / high, Read only, no CLAUDE.md | S11 section 6: reviewer has read nothing but screenshots and questions |
| `retrieve.md` | retrieve | sonnet / low | row 9 says low effort and not the best model; the model pick is this file's, logged in routing-log.md |
| `run.md` | run | haiku / low | no row; cheap first; Anthropic's Claude Code docs name Haiku for simple subagent jobs |

Generate, plan and coordinate run in the main session at the effort the row says (`/effort high` for greenfield), because a subagent re-gathers context the session already has and is no smarter on the same task (Claude Code best practices).

A judge from another family (GPT-6 Astra) is the preferred reviewer for Claude-generated work. Claude Code cannot call it; when it is available, hand it the review brief in `agents/BRIEFS.md` and the `include` pack.

## Changelog

- 1.0.0, 2026-11-10: initial, from guestbook/references/routing.md.
