# routing-log.md

Every routing decision, one line each, newest last: date, task, task class, model and effort, reason, outcome. The routing framework requires the log ("log the decision, or the table never improves").

| Date | Task | Class | Model / effort | Reason | Outcome |
|---|---|---|---|---|---|
| 2026-11-10 | Write AGENTS.md and agents/ (this guide) | plan | Claude, this session's default model and effort | no planning row in the repo; single session, no fan-out, since the work was one dependent document set | delivered as a draft PR; awaiting a judge on a different run |
| 2026-11-10 | Seat file `retrieve.md` model pick | plan | sonnet / low | row 9 says low effort and never the best model; the model name is not in the repo | untested |
| 2026-11-10 | Form server words from lanes (DESIGN 6.15, S05 1.3.0) | plan then generate | Claude, this session's default model and effort | specs before code; scene controller plus lane engine change in one session | specs, code and T-SRV-7 delivered; targeted tests green |
| 2026-11-10 | Judge the server words diff, loop 1 | judge | Claude, separate run, fresh context, read-only prompt | AGENTS.md section 3: never the generator's own context | APPROVE with two written-rule minors (reduced pause release, no snap on resume or unhide); both fixed |
| 2026-11-10 | Judge the fix commit, loop 2 | judge | Claude, separate run, fresh context, read-only prompt | review the loop-1 fixes only | REQUEST CHANGES on one major (re-arming a running fade snapped lanes); fixed with a one-line guard, mechanically verified, frozen at the two-loop cap |
