# WORK-LOOPS.md: one loop per task class

Version 1.0.0, 2026-11-10. Use after AGENTS.md section 1 has given you a task class and a discipline. Each loop says when it fires, what to read, what to do, what to hand back, and when to stop. A loop is a way of working, not a character: the same model can sit in several seats across a day, never two seats on the same change.

Every loop runs inside the auto-fire order (AGENTS.md section 2) and Anthropic's agent loop: gather context, take action, verify work, repeat.

## plan

Fires when the deliverable is a spec, task cards, a decision record or a plan, or when the ask is missing a load-bearing decision.

- Read: `/mnt/project-files/baseline/process/SPEC-DRIVEN-METHOD.md` (project files; the method), `spec/astryx/README.md`, the specs your discipline names, `spec/astryx/UNKNOWNS.md`.
- Do: write the spec before any implementation. Each spec carries purpose, layout, motion, exact copy from S09, components, kill criteria, receipts, dependencies, verification, unknowns and a version stamp. Split build work into cards small enough for an agent with no other context (BUILD-ORDER section 3 format: inputs, owns, builds, done when). Mark which cards can run at the same time and the gate between waves.
- Decide parallelism by dependency, not by ambition. Fan out only where pieces are independent (four layout generators were; the engine and its scenes were not). Multi-agent runs cost about 15 times the tokens of a chat and most coding tasks parallelize less than research does (Anthropic, multi-agent research system).
- Hand back: the spec files, a changelog line, and the open questions as a decision for Justin with a recommended option.
- Stop: when every claim has a check, every unknown is registered, and the taste gates (`spec/astryx/TASTE-GATES.md`) have been run on the spec. Design decisions are Justin's; record them, do not make them.

## retrieve

Fires when the deliverable is facts: a source check, a design reference, a tool vetting, a "does X exist", a line in a spec that needs a citation.

- Read: the question and the claim it supports. Nothing else up front.
- Do: go to the primary source (official page, the package registry, the GitHub API, the file itself). Record the URL, the date checked and the exact number or quote. Secondary sources quote stale numbers; say which one you used. For UI references, browse Inspo (row 9), several products, product name plus URL for each, observations kept apart from interpretation.
- Breadth-first questions with independent parts can fan out to parallel retrieve seats, each with its own objective, output format and boundary; one seat merges.
- Hand back: claim, source URL, date, verbatim value, and confidence. If it could not be verified, say UNVERIFIED and why (blocked host, paywall, no source). Never fill the gap.
- Stop: when the claim is verified or registered as unknown. Do not write the conclusion the facts are for; that is another seat.

## generate

Fires when the deliverable is new or changed code, shaders, copy drafts, a composition or a prompt package.

- Read: only your card's inputs (BUILD-ORDER rule 1): the primary specs from `agent-map impact`, the touched files, `src/tokens.generated.ts` for values and `src/copy.ts` for strings.
- Do: checkpoint first (auto-fire 3). Generate once against the brief, then review the draft against the success criteria as a separate step, then refine once (row 5). Stay in the files you own. Never type a value or a string that is not in DESIGN.md or S09; if one is missing, stop and report it.
- Verify as you go with the tests `agent-map` listed for the blast radius, and `npx tsc --noEmit` for new diagnostics only (auto-fire 4).
- Hand back: the commit, the test commands with exit codes, receipts under `qa/`, and the blast radius output for the judge.
- Stop: one generation and one refine. A second refine only on a failed external check, never on your own opinion. Then the work goes to the judge seat.

## judge

Fires before any PR leaves draft, after any generate seat finishes, when a spec is up for approval, and for QA rounds. It never fires on your own output.

- Read: the brief or spec the work was built from, the diff, and `node tools/agent-map.mjs impact --changed <base>`. Not the generator's reasoning.
- Do, in order:
  1. Answer the brief yourself first, briefly: what a correct change must do (reference-guided judging).
  2. Check the diff against that reference and the spec: every requirement met, every listed edge case tested.
  3. Check the blast radius: each touched discipline's rules and gates still hold.
  4. Check boundary: did the change stay inside the brief's files and scope.
  5. Run the repo checklist: no hex, ms or geometry literal outside generated files (`npm run lint`); no hand edit to `*.generated.*` or `src/copy.ts`; no `Math.random` in motion code; no string outside S09; no em or en dashes; no new dependency, gate change or skipped test; lane count 6,144 and one draw call; S11 kill list.
  6. Run the gates the blast radius names, exit codes read from files.
- Hand back: every finding, each with severity, file:line, the rule or spec section it breaks, and a failing scenario. Mark style-only findings as such. Do not fix anything.
- Stop: after one report. A second loop only if the fixes need it; two is the cap.

## run

Fires when the work is the same check across many inputs: seed sweeps, gate reruns from a clean clone, link checks, screenshot captures, log scans.

- Read: the run spec (for example FINAL-POLISH section 9.2) and nothing else.
- Do: run exactly what the spec says, seeded so the run itself replays. No interpretation, no fixes, no skipped cases.
- Hand back: a table (input, pass, value, first failing frame or line) plus the raw log path. Failures go back with the seed or input that reproduces them.
- Stop: when the table is complete.

## coordinate

Fires when work is split across agents: handing out cards, checking gates between waves, merging results into BUILD-STATE.md.

- Read: BUILD-ORDER.md, BUILD-STATE.md, the gate list (S11 section 3).
- Do: hand each agent one card with the brief in `agents/BRIEFS.md`. Check a wave's gate yourself from a clean clone before starting the next. Swap stubs for real modules only after the gate is green. Write decisions and blocks into BUILD-STATE.md.
- Before declaring an agent stuck or killing it, check its children, background jobs and last commit (auto-fire 5).
- Hand back: BUILD-STATE.md updated, the gate log, and what waits on Justin.
- Stop: when the wave's gate is green or a block is written down.

## Discipline add-ons

These come from the files touched, on top of the loop.

- **copy:** S09 is the only source; changes wait for Justin; run `node tools/banned-scan.mjs src`.
- **tokens:** edit DESIGN.md section 12, bump the version, changelog, `npm run gen`, then `git diff` on generated files is the receipt.
- **engine, layouts, scenes:** read the debug state, not frame times, in headless runs; real-device frame time is G-PERF-DEVICE, Justin's.
- **video motion (motion-design/):** read `motion-design/hyperframes-skill.md` first; `npx hyperframes init --non-interactive`; `npm run check` before render; set TMPDIR; no HeyGen cloud render without approval.
- **guestbook prompt package (guestbook/):** follow `guestbook/README.md`; regenerate `guestbook/repomix.xml` after any edit.

## Changelog

- 1.0.0, 2026-11-10: initial.
