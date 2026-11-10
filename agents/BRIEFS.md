# BRIEFS.md: the briefs one seat hands another

Version 1.0.0, 2026-11-10. A subagent or a second model starts cold: it knows only what the brief says. Anthropic found that vague delegation produced duplicated work and gaps, and that each worker needs an objective, an output format, guidance on tools and sources, and clear boundaries. This project adds one verb per brief and an explicit stop condition (`guestbook/references/routing.md`). Fill every field; delete none.

## 1. Task brief (any seat)

```
<brief>
verb: <one verb: plan | retrieve | generate | judge | run>
objective: <one sentence, the outcome, not the steps>
seat: task class <class>; discipline <from agent-map primary>; routing <row or "cross-row">
owns: <files this seat may change; everything else is read-only>
read first: <primary specs from agent-map>, AGENTS.md
context pack: <path to repomix xml, or "checkout">
done when: <tests and gates from agent-map blast radius, each with its command>
output: <exact format: files, table columns, or report shape>
boundary: <what not to touch or add; named patterns to avoid>
stop: <the stop condition, for example one generation plus one refine>
unknowns: <anything the brief does not decide; the seat stops and names it>
</brief>
```

## 2. Review brief (judge seat)

```
<review>
verb: judge
you did not write this change. Do not fix it.
reference: <spec or brief path>. Before reading the diff, write in five lines what a correct change must do.
diff: <base>...<head>
blast radius: <paste of node tools/agent-map.mjs impact --changed <base>>
check: requirements met; edge cases tested; stayed inside the boundary; repo checklist (agents/WORK-LOOPS.md judge step 5); gates in the blast radius pass.
report: every finding, with severity (blocker, major, minor, style), file:line, the rule or spec section it breaks, and a failing scenario. Do not drop low-severity findings; mark style-only ones as style.
stop: one report.
</review>
```

## 3. Return (every seat)

```
seat: <class> / <discipline>
result: <one paragraph>
evidence: <command> -> exit <n>; receipts at <paths>
changed: <files, or "none">
open: <BLOCKED or UNKNOWN items, each with the spec section>
routing: <model, effort, why> (also appended to agents/routing-log.md)
```

Keep the return to about 1,000 to 2,000 tokens. Put long output in a file and pass the path (Anthropic: subagents pass lightweight references back).

## 4. BUILD-STATE.md entry (build cards)

The format in `spec/astryx/BUILD-ORDER.md` section 4: status, agent, commit, tests, receipts, notes, and BLOCKED when blocked.
