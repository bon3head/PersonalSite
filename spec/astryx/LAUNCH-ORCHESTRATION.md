# LAUNCH PROMPT: Personal Site, Astryx Keystone build orchestration

You wrote the Astryx Keystone launch prompt. The spec package it asked for is done, and Justin has ruled on every open decision. Your job now is to **orchestrate the build**: run the swarm through BUILD-ORDER.md until the ship rule holds, then hand the result back. You are the coordinator BUILD-ORDER.md describes. You hand out cards, check gates, and keep BUILD-STATE.md true. You write code only when a card has no other taker.

## Where everything is

- Repo `bon3head/PersonalSite`, branch `claude/astryx-keystone-spec-9q82ep`, commit `c4c2662`. The package is under `spec/astryx/`. A mirror copy is in project files at `astryx-keystone/` if you have that mount. If the two differ, the repo wins.
- Make a new build branch off `c4c2662`. Suggested name `astryx-build`; use a different one if your environment requires it. The site goes at the repo root, exactly as S00 section 3 lays it out. Do not touch `spec/` except through the change protocol below.
- The baseline package (`baseline/`: content brief, ui-ux taste files, process) is the source the specs were built from. You should not need it. If you do, the spec has a bug.

## Read in this order before handing out anything

1. `spec/astryx/README.md`
2. `spec/astryx/DESIGN.md`. The `design-tokens` JSON block is authoritative and machine-read. If a value is not there, it does not exist.
3. `spec/astryx/BUILD-ORDER.md`. Waves 0 to 6, cards B0 to B9, gates, BUILD-STATE format, critical path.
4. `spec/astryx/UNKNOWNS.md` and `spec/astryx/TASTE-GATES.md`.
5. Skim `specs/S00` to `S11` so you can judge a BLOCKED report. Workers read only their card's inputs.

## Decisions already made (do not re-ask Justin)

- LeafLink is a **mutual aid** platform. Any older "event discovery" wording is wrong.
- SideQuests shows `C-SQ-VENUE`: "Built at Hack New Paltz. Working MVP in 24 hours."
- The phone number is never shown. GPA is cut.
- R-GPU (48 SMs x 128 cores = 6,144) is accepted by Justin without a source check. It does not block ship.
- Repo links go to Codeberg. GitHub `bon3head` is linked from whoami only.
- Blue: signal `#7BB5F8`, ink `#0E3565`, field `#10294E`. No second hue. Cipher/ember and the PCB direction are dead and never come back.

## How to run it

- Run the waves in BUILD-ORDER section 2 order, with up to 3 workers in wave 1, 5 in wave 2 and 4 in wave 3. Give each worker its card text, its input files, and BUILD-ORDER section 1 verbatim. Give a worker nothing else from this conversation; the specs were written so that is enough.
- A wave is done only when its gate is green and the receipts are in `qa/`. Before starting the next wave, rerun the gate yourself from a clean clone (`rm -rf node_modules dist && npm ci && npm run gates` once B0 lands). Do not take a worker's word for it.
- Do the swaps BUILD-ORDER names at the wave boundaries: real engine in place of the stub after wave 1, real generators in place of the test layouts after wave 2.
- **Retire the top risk early.** As soon as wave 1 lands, ask Justin for a preview deploy of B2's test layouts and for one G-PERF-DEVICE run on his iPhone (S11 section 5, `?perf=1`). Cloud headless frame times mean nothing; SwiftShader is for correctness only. If p95 is over 16.7ms at DPR 1.0, fix the shader or the overdraw. Never cut the lane count.
- Commit per card, as `B<n>.<m>: <card title>`, plus the attribution lines your environment requires. Push the build branch after each green gate.

## When a worker is blocked or a spec is wrong

- A worker that hits a gap writes `BLOCKED: <question> (<spec section>)` in BUILD-STATE.md and stops. Workers never guess and never work around a spec.
- You decide whether it is a spec bug. If it is, fix it in `spec/astryx/` within the spec's own rules: bump that file's version, add a dated changelog line saying why, and commit it separately as `spec: <what>`. If the fix needs a value, it goes into DESIGN.md first and code reads it from there.
- If the fix would change a fact, a copy string, the concept, the palette, or anything in UNKNOWNS section 1, stop and ask Justin. Bring one question with your recommendation. Everything else you decide yourself and record.

## Standing rules (no exceptions)

- **Never deploy, never merge.** Justin (or Cipher) deploys. You hand over a commit.
- **No invented facts.** Every visible string comes from S09 through `src/copy.ts`. Where something is UNKNOWN, it stays unknown and is not depicted.
- **No em or en dashes** in site copy, commit messages or reports. No banned words (S09 rule list and `tools/banned.txt`).
- **No value lives only in code.** Hexes, durations and geometry come from `src/tokens.generated.ts`. `lint-tokens` enforces this.
- **Gates are never lowered to pass.** If a budget proves wrong on real measurement, change it in DESIGN.md with the measurement in the changelog line, the way the server hue budget went from 12% to 30% after a render measured 24%. Never quietly.
- Codeberg and LinkedIn are blocked from cloud runners. T-COPY-4 is a manual click on the preview, not something to fake.

## Reporting to Justin

- Send a short status at the end of each wave: gate results, the commit SHA, and anything BLOCKED. No play-by-play in between.
- At handoff (B9), report:
  - the final commit SHA;
  - total `dist/` byte count, plus per-file bytes and sha256 as a manifest (`find dist -type f | sort | xargs sha256sum` and `wc -c`), committed as `qa/DIST-MANIFEST.txt`;
  - `qa/QA-REPORT.md` with one line per test;
  - G-ANTI answers from a fresh reviewer who saw only the screenshots;
  - what Justin still has to do on a real device.
- Attach files. Do not paste them.
- Ship rule (S11 section 9): all gates green, kill list empty, G-PERF-DEVICE recorded, every UNKNOWN resolved or accepted by Justin in writing. Until it holds, the site is not done, whatever it looks like.
