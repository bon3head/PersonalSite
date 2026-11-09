# Guestbook signup sheet

A guestbook signup sheet for the portfolio site. Anyone can easily sign, but not in a boring conventional way. It goes all out on motion. It is entropic and 3D: every sign is driven by a fresh entropy seed (seeded randomness, stochastic variation, unique every time), and the motion lives in 3D space (camera dolly, depth, lanes moving in 3D), not on a flat plane. It integrates with the site's morphs and page transitions.

Creative direction (revised 2026-11-09): entropic and 3D. GLITTERBOX is axed from this work (not the signing gesture, not an asset pool).

## How Claude uses this (browser Claude)

This work is built for **browser Claude (claude.ai)**. Browser Claude has no local file access and no repo checkout. Its access paths are:
1. **Attach `guestbook/repomix.xml`** — the whole context in one XML file (22 files, ~57,000 tokens). Every repo file is inside it under a `<file path="...">` attribute. This is the primary source.
2. **Paste `guestbook/prompt.md`** — the build brief. It has an `<access>` section that tells Claude exactly where its sources are.
3. **Browse the web** — Mobbin (https://mobbin.com, free tier, for screens/flows), Refero Styles (https://styles.refero.design/, 2,000+ real design systems as DESIGN.md files, for token-system references), the reference sites (https://lusion.co, https://bruno-simon.com, https://oklou.com), the live site (https://justinpoli.is-a.dev), and the public GitHub repo (https://github.com/bon3head/PersonalSite, branch `astryx-polish-r2`, public).
4. **Launch prompt** — if you want the shortest path, paste the one-paragraph launch prompt in `guestbook/launch-prompt.md` instead of the full `prompt.md`. It tells Claude to read the repo files and the brief. Use the full `prompt.md` when you want the complete brief pasted in.

## Status

Prompt written 2026-11-09, revised same day (GLITTERBOX axed, entropic + 3D). Not built yet. The prompt in `prompt.md` is the build brief for Claude.

## File map

| File | What it is |
|---|---|
| `prompt.md` | The build brief for Claude. Paste it into browser Claude (claude.ai), alongside the attached `repomix.xml`. One verb, explicit boundary and stop condition. Has an `<access>` section that tells browser Claude exactly where its sources are. |
| `launch-prompt.md` | The short launcher. Paste this into browser Claude instead of the full `prompt.md` when you want the shortest path. It tells Claude to read the brief and the context pack from the repomix.xml. |
| `repomix.xml` | The whole context packed for Claude in one XML file (repomix 1.18.1). Attach it to browser Claude alongside `prompt.md` or `launch-prompt.md`. 22 files, ~57,000 tokens. Regenerate with the command in the repomix section below after any file change. |
| `references/asset-pool.md` | The deep pool of assets Claude can pull from and transform, with each entry's source, what it offers, and how to transform it. GLITTERBOX is explicitly NOT in this pool. |
| `references/lusion-style-brief.md` | Lusion design extract, run 2026-11-09 with the design-extract 12-stage fusion pipeline (`--motion-runtime` on). The motion system to steal. Source: lusion.co, lusion.co/projects/everswap, lusion.co/projects/spatial_fusion. |
| `references/routing.md` | The model-routing framework that governs this work: greenfield generation (row 5), Claude Opus 5.5 `high`, the Claude greenfield prompt template, the Mobbin design-reference step (free-tier browsing, product MCP gated off), and the auto-fire rules. |
| `references/site-context.md` | The site the sheet lives in: Astryx design system, DESIGN.md, the 6,144-lane WebGL field, morphs, page transitions, budgets, brand rules. Every claim quoted from DESIGN.md or the code. |
| `references/astryx-design-spec.md` | The Astryx design skill SPEC (Astryx is the FLOOR, design-extract is the CEILING). |
| `assets/lusion-p0-motion-tokens.json` | Lusion motion tokens (durations, easings, choreography). |
| `assets/lusion-p0-motion.css` | Lusion motion CSS (the transitions, as extracted). |
| `assets/lusion-p0-design-tokens.json` | Lusion design tokens. |
| `assets/motion-notes/oklou-motion-notes.md` | Oklou 3D boot sequence: radio tuning into a 3D space, camera push-in, lock-in payoff, pull-back reveal. |
| `assets/motion-notes/bruno-simon-immersion.md` | Bruno Simon 3D: vehicle as interface, discovery by moving through space, perf discipline. |
| `assets/motion-notes/utazon-motion-notes.md` | Utazon motion notes (ease convergence, reversible reveals). |
| `assets/motion-notes/cleanlystudio-motion-notes.md` | Cleanlystudio motion notes. |

## Repomix package (for Claude)

`repomix.xml` is the whole context in one file, packed with repomix 1.18.1 (XML style). It contains the guestbook directory, `spec/astryx/DESIGN.md`, `spec/astryx/specs/S09-copy-deck.md`, `src/world/camera.ts`, `src/world/layouts/server.ts`, `src/App.tsx`, `src/router.ts`, and `package.json`. 22 files, ~57,000 tokens, ~206,000 chars.

To regenerate after any file change, from the repo root:

```
~/workspace/tools/bin/repomix --style xml --output guestbook/repomix.xml --include "guestbook/**,spec/astryx/DESIGN.md,spec/astryx/specs/S09-copy-deck.md,src/world/camera.ts,src/world/layouts/server.ts,src/App.tsx,src/router.ts,package.json" --ignore "node_modules/**,dist/**,dist-server/**"
```

Note: repomix packs the files as they are on disk when it runs, so regenerate after editing any included file (including this README, the prompt, or a reference). The XML is read-only for Claude; changes go to the original files, not the packed version.

## Pipeline (from session logs)

This work follows the model-routing framework in `~/workspace/model-routing/framework/` (routing-table.md, prompt-library.md, auto-fire-rules.md), built from the research program 2026-11-09. The rules that matter here:

1. **Routing.** This is greenfield generation (routing-table row 5): new code and new designs from a brief. Claude Opus 5.5 `high`. The prompt uses the Claude greenfield template: multishot examples + XML structure + self-correction chaining + named banned patterns.
2. **Design-reference step first.** Before generating any UI, browse Mobbin free-tier pages for real guestbook/signup flows (auto-fire-rules.md). The product MCP at api.mobbin.com/mcp is gated off and never fires (account confirmed Free, Justin does not spend on Mobbin). Free tier: the 4 latest apps and public pages. If the free tier returns no match, fall back to Refero/design-extract and mark the design as ungrounded.
3. **Design-extract grounding.** The Lusion extract (`references/lusion-style-brief.md`) is the motion reference. Steal the motion system (two beziers, 400ms default, transform-dominant, staggered long moves), not the hexes or the hero. The oklou 3D boot is the camera choreography reference (push-in, lock-in, pull-back). Bruno Simon is the discovery-by-moving-through-3D-space reference.
4. **One verb per prompt.** The prompt asks Claude to do one thing: design and build the guestbook signup sheet. Review is a separate prompt, a separate call, on a different model family.
5. **Boundary and stop condition.** The prompt carries an explicit boundary (no FUN tab, no new route, no new nav item, no backend, no GLITTERBOX, no change to existing copy or scenes) and a stop condition (one design + one build + one refine cycle; a second refine only on a failed external check).

## How an agent uses this directory

1. Read `prompt.md` first. It is the build brief. Paste `repomix.xml` alongside it so Claude has the full context in one file.
2. Read `references/site-context.md` for the site's tokens, timings, and constraints. Do not invent site facts from memory; quote DESIGN.md or the code.
3. Read `references/asset-pool.md` for the deep pool of assets to pull from and transform. Do not use GLITTERBOX; it is axed.
4. Read `references/routing.md` for the routing and review rules. The reviewer is a different model family than the generator, never the same run.
5. Follow the AGENTS.md auto-fire order: goal-gate, verify-stop, checkpoint-rollback, lsp-gate, coordinator health. No DONE claim without a verify-stop binding.

## Open decision

Where signatures are stored. The prompt leaves this for Claude to name rather than invent. Options: a JSON file in the repo, a lightweight form endpoint, or a client-side list with a clear note that it is local-only. If Justin picks one, pin it in `prompt.md` before the build starts.
