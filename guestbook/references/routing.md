# Model-routing framework (the pipeline this work follows)

Source: `~/workspace/model-routing/framework/` (routing-table.md, prompt-library.md, auto-fire-rules.md), built from the research program 2026-11-09. The framework is research-based (first-party docs, peer-reviewed papers, session derivations), not asserted.

## Routing for this task

This is **greenfield generation** (routing-table row 5): new code and new designs from a brief. Medium-high difficulty, medium-deep, medium-high complexity, generation domain.

- **Model + effort:** Claude Opus 5.5 `high` (or GPT-6 Astra starting at `low`). Alternate GPT-6.1 Sol `medium`.
- **Mechanism:** Single-shot generation, then self-correction chaining as separate calls: generate a draft, review it against criteria, refine based on the review, each step a separate call so results can be logged, evaluated, or branched. No cheap-model self-critique loop (self-refinement works only on strong bases; a weaker model gained nothing from Reflexion, 0.26 vs 0.26 pass@1).
- **Fallback chain:** Opus 5.5 → Sonnet 5.5 `high` → Sol `medium`. If the fallback is a weaker model, drop the self-refine step rather than running it weakly.
- **Threshold:** None numeric; the stop condition is a fixed timestep or a stop indicator in the feedback.
- **Budget:** One generation + one refine cycle per brief by default; a second refine cycle only on a failed external check (tests, retrieval). Numeric token budget UNKNOWN (no first-party doc publishes one).

## Prompt template (Claude greenfield)

From prompt-library.md. Technique: multishot examples in `<example>` tags + XML structure + self-correction chaining + name-the-patterns-to-avoid. Sources: first-party-docs.md:451 (multishot examples, XML tags), first-party-docs.md:467 (self-correction chaining), claude-code-deep-research.md:59 (a vague "avoid generic" swaps one default for another; naming specific patterns to avoid works).

The prompt in `guestbook/prompt.md` follows this template. Rules that apply to every prompt:
- One verb per prompt. A prompt that asks a model to do two things is two prompts.
- Every prompt carries an explicit boundary and stop condition.
- Review prompts must ask whether the output stayed inside the brief's boundary, not only whether it is good.
- No prompt routes review to the model that generated the artifact, and no review prompt lets the reviewer grade its own output without an independent reference.

## Inspo design-reference step (before any UI generation)

For this work, Inspo replaces the framework's Mobbin/Refero step (Justin's explicit direction, 2026-11-09, after vetting Inspo against both). Before generating any UI, use Inspo web-gallery browsing for real reference screens/flows (the design-extract pipeline's reference step, with Inspo as a curated, searchable source).

- **What Inspo is:** https://inspomcp.dev — an open-source design-reference archive (MIT, free, no account, no paywall). 832 real production sites, 2,320 captured pages (desktop and mobile), each with traced palettes, real fonts, detected tech stack, and a per-site DESIGN.md (semantic palette roles, type ramp, spacing scale, CSS variables, container width). 68 canonical reference components with copy-pasteable JSX. Semantic search via Together AI embeddings. Repo: https://github.com/Nutlope/inspo. Vetted 2026-11-09: the gallery is live and browsable on the web; the hosted MCP endpoint (https://inspomcp.dev/api/mcp, free, no auth) is confirmed live but is NOT usable by browser Claude, which cannot connect MCP servers.
- **Why it replaces both:** Inspo gives the screens/flows Mobbin gave (2,320 captured pages, searchable by component type, layout pattern, visual style) and the per-site DESIGN.md tokens Refero gave, in one place, free. Mobbin's free tier is only the 4 latest apps and Justin does not spend on Mobbin; Refero is paid and proprietary. Inspo is MIT and free, so both constraints disappear.
- **Access path (browser Claude):** Browse the gallery at https://inspomcp.dev directly on the web. Search/filter by component type, layout pattern, or visual style; open a site to see its captures and design notes. Do NOT use the Inspo MCP server (browser Claude cannot connect MCP servers). Do NOT use Mobbin or Refero for this work.
- **Supersedes:** The framework's standing Mobbin/Refero decision (routing-table row 9, auto-fire-rules.md: product MCP gated off, Free-tier browsing, Refero + design-extract as the live path) is superseded for this guestbook work only, by Justin's explicit direction. The framework files themselves (~/workspace/model-routing/framework/) still record the Mobbin/Refero decision; updating them is a separate program-level decision.
- **Trade-offs (verified from the source):** The archive is a snapshot, not continuously updated; sites that redesign after capture show outdated screens until refreshed. Mobile shots still need a retina-scale re-shoot. Component crops are not yet complete for every entry. The hosted endpoint logs tool-call metadata (tool name, success, duration) but not query text or IPs.
- **Workflow:** Identify the platform, product category, user goal, and design question; browse Inspo screens/flows; review several relevant products rather than relying on one example; preserve the product name and Inspo URL for each important reference; separate visible observations from interpretation and recommendations; adapt findings to the user's brand, audience, design system, accessibility needs, and product constraints.
- **Evidence limits (same as Mobbin's own):** An Inspo example shows a product used a design; it does not prove the design improved conversion or another metric. A recurring pattern is a convention, not automatically a best practice. Do not copy protected designs, branding, text, or assets verbatim. Evaluate accessibility independently.
- **Routing:** Design-reference lookup is routing-table row 9 (retrieval, not reasoning, `low` effort + Inspo web-gallery browsing, never the best model at high effort).

## Review (after generation)

- **Reviewer:** A different model family than the generator, never the same run. Review is routed to the strongest available judge, never the weakest available model. For a Claude-generated artifact, the reviewer is GPT-6 Astra `xhigh` (first-party named use case) or Claude Opus 5.5 `high` on a different run.
- **Review technique:** Reference-guided judging (judge answers independently first, then grades against its own reference; cut the failure rate from 70% to 15%) + report-everything-then-filter (a "only report high-severity" instruction makes the reviewer under-report).
- **Cap:** Review loops at two; the second rebuild is justified only by data-forced mechanical breakage, then freeze after mechanical verification.

## Auto-fire order (AGENTS.md, fixed, no skipping ahead)

1. local-goal-gate — goal contract with deterministic gates before work starts.
2. local-verify-stop — DONE claims on code edits bind the receipted exit-0 run of the prescribed verification command before delivery.
3. local-checkpoint-rollback — snapshot before risky edits; rollback restores byte-for-byte.
4. local-lsp-gate — report only NEW LSP diagnostics after an edit.
5. gardner-coordinator-health — before declaring any coordinator or agent dead, or killing one: check children, never the coordinator's own pulse.

## Cross-row rules (load-bearing)

- Cheap-first is the default; the strong model is reserved for queries the cheap model cannot answer reliably.
- Escalate by retrying failures, not by running everything high.
- Order of moves: sweep effort on the current model first, then try the stronger model alone at low effort, and add a model pairing only if it beats the single model's whole score-vs-spend curve.
- Session stickiness: prefer changing reasoning effort over switching models inside a session; a model switch pays a cache-rebuild cost.
- Log the decision, or the table never improves: every routing decision is logged with the reason and the outcome.
- No row may depend on a single vendor's router as its only mechanism.

## Unknowns (carried, not smoothed over)

- Numeric token or per-day budgets per task class: UNKNOWN.
- Muse Spark (Meta): identity, effort levels, strengths, limits all UNKNOWN. No row routes to Muse Spark.
- Whether plan-blind review outperforms same-context review on real review tasks: no source runs that comparison.
