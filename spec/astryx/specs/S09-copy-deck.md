# S09 Copy deck: every visible string

Version 1.6.0, 2026-11-09. Depends on: `baseline/content/CONTENT-BRIEF.md` (the factual boundary). Blocks: S04, S05, S06, S07, S08, S10.
1.5.0: C-SQ-P1 rewritten (Justin-approved 2026-11-05): the "three trails / small adventures" line described the site visual, not the app ethos. New line names the ethos (anyone can host, each community runs its own instance) and what it is built on (ActivityPub).

## 1. Purpose

Every word the site shows, with an ID and a source. Builders copy strings from `src/copy.ts`, which is generated from the table in section 4 by `tools/extract-copy.mjs` (S00). No component may contain a string literal that is visible to users or screen readers; the copy lint (G-COPY, S11) fails the build if one appears.

## 2. Rules (from the brief, the rubric, and Justin's standing decisions)

1. Every factual claim traces to a source in the `Source` column. Sources: `BRIEF` = CONTENT-BRIEF.md (2026-10-30); `MEM` = Justin-confirmed facts recorded in project memory before this package (2026-10-04), used only where the brief is silent and the fact does not conflict.
2. No em dashes, no en dashes, anywhere. Use periods and commas.
3. Banned words: passionate, leverage, cutting-edge, seamless, delve, tapestry, ninja, rockstar, showcase, robust, elevate, unlock, journey, actually, simply, just (as emphasis). Banned frames: "not X, it's Y"; "not just X"; rule-of-three pile-ups; aphorism closers; "Here's".
4. Never shown, anywhere, including meta tags, alt text, comments that ship, or console output: the GPA (cut by Justin, 2026-10-04); the phone number (decision below); CanonClaw, ASH, Nexus, GRPO, Math Club Oracle (BRIEF "not proven"); any model name served by Ollama (UNKNOWN); any tokens-per-second, uptime, user count, match count or other metric (UNKNOWN).
5. No liveness claims. The Server scene renders the machine; it is not a live feed. No "live", "online", "status", "uptime" words.
6. Voice: first person, terse, plain verbs. The brief's scene-feeling words (breathing, heartbeats, alive) are direction for designers and never appear in copy (banned-slop-styles 7c: no organic metaphors for software).

**Decision recorded (D-PHONE):** the brief lists a phone number. It is not rendered. A personal phone number on a public page draws spam and the brief does not ask for it to be shown. Justin confirmed hidden on 2026-10-30.

**Decision recorded (D-LEAFLINK-KIND):** earlier project notes called LeafLink an "event discovery platform". The brief (2026-10-30, Justin explicit) calls it a mutual aid platform. The brief wins and this deck says mutual aid. Justin confirmed mutual aid on 2026-10-30.

## 3. Strings decided by Justin outside the brief

C-SQ-VENUE ("Built at Hack New Paltz. Working MVP in 24 hours.") is not in the brief. Justin confirmed it on 2026-10-04 and ruled on 2026-10-30 that it shows (D-SQ-VENUE). It is in the table below with source `MEM`. C-WHO-GAME ("Favorite game: Sekiro: Shadows Die Twice.") is not in the brief. Justin confirmed it on 2026-11-05 and it shows in the whoami sheet. It is in the table below with source `MEM`.

## 4. The table

| ID | Where | String | Source |
|---|---|---|---|
| C-TITLE-SERVER | `<title>` on `/` | `Justin Poli` | BRIEF |
| C-TITLE-LEAFLINK | `<title>` on `/leaflink` | `LeafLink, Justin Poli` | BRIEF |
| C-TITLE-SIDEQUESTS | `<title>` on `/sidequests` | `SideQuests, Justin Poli` | BRIEF |
| C-TITLE-404 | `<title>` on 404 | `Not found, Justin Poli` | n/a |
| C-META-DESC | `<meta name=description>` all routes | `Justin Poli. Computer science senior at SUNY New Paltz, graduating December 2027. Runs his own LLM inference server at home.` | BRIEF |
| C-WORDMARK | Top-left link to `/` on every scene except Server | `Justin Poli` | BRIEF |
| C-KEY-1 | Keymap item 1 | key `1`, label `server` | n/a |
| C-KEY-2 | Keymap item 2 | key `2`, label `leaflink` | n/a |
| C-KEY-3 | Keymap item 3 | key `3`, label `sidequests` | n/a |
| C-KEY-W | Keymap item w | key `w`, label `whoami` | n/a |
| C-KEY-C | Keymap item c | key `c`, label `contact` | n/a |
| C-KEYMAP-LABEL | `aria-label` of the keymap `<nav>` | `Scenes and panels` | n/a |
| C-SRV-H1 | Server readout heading | `Justin Poli` | BRIEF |
| C-SRV-P1 | Server readout | `Computer science senior at SUNY New Paltz. I like to build my own tools.` | BRIEF |
| C-SRV-P2 | Server readout | `LeafLink and SideQuests both took 2nd place at their hackathons, and I run my own LLM inference server at home.` | BRIEF |
| C-SRV-ALT | `aria-label` of the Server canvas region | `Rendering of the inference server: 6,144 lanes, one per CUDA core on the RTX 3070 Ti, firing 32 at a time.` | BRIEF + R-GPU |
| C-LL-H1 | LeafLink readout heading | `LeafLink` | BRIEF |
| C-LL-P1 | LeafLink readout | `Mutual aid on a live map. When a neighbor needs what you have, the map connects you as it happens.` | BRIEF |
| C-LL-FACTS | LeafLink readout, supporting | `Week-long hackathon build. Team of four: Justin Poli, Julian Shuster, Devin Perez, Colton A. 2nd place.` | BRIEF |
| C-LL-STACK | LeafLink readout, supporting | `WebSocket live feed, Leaflet maps, tag and category search.` | BRIEF |
| C-LL-CODE | LeafLink link | label `Code`, href `https://codeberg.org/bon3head/LeafLink` | MEM (Justin confirmed 200, 2026-10-04) |
| C-LL-LEGEND | LeafLink legend line | `Ring: request. Dot: offer. Line: match.` | n/a (describes the drawing) |
| C-LL-SIM | LeafLink caption | `Simulated feed. Drop an offer and the nearest open request routes to it.` | n/a (describes the simulation) |
| C-LL-OFFER | OfferButton label | `Drop an offer` | n/a |
| C-LL-ALT | `aria-label` of the LeafLink canvas region | `Simulated LeafLink map: requests and offers appear as pins and matches are traced along the streets.` | n/a |
| C-SQ-H1 | SideQuests readout heading | `SideQuests` | BRIEF |
| C-SQ-P1 | SideQuests readout | `A community platform anyone can host, built as quests on ActivityPub. Each community runs its own instance and sets its own quests.` | BRIEF |
| C-SQ-FACTS | SideQuests readout, supporting | `Hackathon build with Julian Shuster. 2nd place.` | BRIEF |
| C-SQ-VENUE | SideQuests readout, supporting, directly after C-SQ-FACTS | `Built at Hack New Paltz. Working MVP in 24 hours.` | MEM (Justin 2026-10-04; shown per Justin 2026-10-30, D-SQ-VENUE) |
| C-SQ-CODE | SideQuests link | label `Code`, href `https://codeberg.org/bon3head/sidequests` | MEM (Justin confirmed 200, 2026-10-04) |
| C-SQ-HINT | SideQuests caption | `Tap a marker to walk its trail.` (coarse pointer) / `Click a marker to walk its trail.` (fine pointer) | n/a |
| C-SQ-MARKER | Accessible name of each marker's DOM twin | `Trail 1`, `Trail 2`, `Trail 3` | n/a |
| C-SQ-ALT | `aria-label` of the SideQuests canvas region | `Chalk plan of a campus with three dashed quest trails.` | n/a |
| C-WHO-LABEL | WhoamiSheet `label` prop | `whoami` | n/a |
| C-WHO-H | WhoamiSheet heading | `Justin Poli` | BRIEF |
| C-WHO-EDU | WhoamiSheet | `Computer Science, SUNY New Paltz. Graduating December 2027.` | BRIEF |
| C-WHO-PLACE | WhoamiSheet | `Home: Smithtown, NY. Campus: New Paltz, NY.` | BRIEF |
| C-WHO-ROLE-1 | WhoamiSheet | `Math Club, VP. I run event ops.` | BRIEF |
| C-WHO-ROLE-2 | WhoamiSheet | `Eleet Coders, council rep.` | BRIEF |
| C-WHO-ROLE-3 | WhoamiSheet | `CS Teams, treasurer.` | BRIEF |
| C-WHO-GAME | WhoamiSheet | `Favorite game: Sekiro: Shadows Die Twice.` | MEM (Justin confirmed; favorite game Sekiro) |
| C-WHO-LINK-CB | WhoamiSheet link | label `Codeberg`, href `https://codeberg.org/bon3head` | MEM (Codeberg is the canonical code host) |
| C-WHO-LINK-GH | WhoamiSheet link | label `GitHub`, href `https://github.com/bon3head` | BRIEF |
| C-WHO-LINK-LI | WhoamiSheet link | label `LinkedIn`, href `https://www.linkedin.com/in/justin-poli-15406030b` | BRIEF |
| C-CON-LABEL | ContactSheet `label` prop | `contact` | n/a |
| C-CON-H | ContactSheet heading | `Contact` | n/a |
| C-CON-EMAIL | ContactSheet, selectable text | `justinf0829@gmail.com` | BRIEF |
| C-CON-COPY | Button, primary | `Copy email` | n/a |
| C-CON-MAIL | Button, secondary, `href=mailto:justinf0829@gmail.com` | `Open mail app` | n/a |
| C-CON-LINK-LI | ContactSheet link | label `LinkedIn`, href as C-WHO-LINK-LI | BRIEF |
| C-CON-GB | ContactSheet control that opens the guestbook | `Leave a mark` | n/a |
| C-GB-LABEL | Guestbook dialog `aria-label` | `Guestbook` | n/a |
| C-GB-NAME | Guestbook name prompt, placeholder and `aria-label` | `your name` | n/a |
| C-GB-LINE | Guestbook line prompt, placeholder and `aria-label` | `one line, optional` | n/a |
| C-GB-LOCK | Guestbook lock-in control | `Lock in` | n/a |
| C-GB-SEED | Guestbook seed readout prefix | `seed` | n/a |
| C-GB-DONE | Guestbook result line after lock-in | `Your mark is in the field.` | n/a |
| C-GB-LOCAL | Guestbook storage note | `Saved in this browser only.` | n/a |
| C-GB-AGAIN | Guestbook control to sign again | `Sign again` | n/a |
| C-GB-CLOSE | Guestbook close control | `Close` | n/a |
| C-GB-LEDGER | Guestbook ledger `aria-label` | `Marks in this browser` | n/a |
| C-TOAST-OK | CopyConfirm info | `Copied.` | n/a |
| C-TOAST-FAIL | CopyConfirm error | `Copy failed. The address is selected.` | n/a |
| C-404-H1 | 404 readout | `Nothing at this address.` | n/a |
| C-404-P1 | 404 readout | `Press 1 for the server, or pick a scene below.` | n/a |
| C-NOGL | Shown once under the readout when the Lanefield cannot start | `The 3D view needs WebGL2. Everything on this page is in the text.` | n/a |
| C-SR-TRAVEL | `aria-live=polite` region, announced after travel | the new scene's H1 string | n/a |

## 5. Kill criteria

- K-COPY-1: any string on the site that is not in this table (G-COPY scans rendered DOM text of every route and every sheet against the table).
- K-COPY-2: any em dash (U+2014) or en dash (U+2013) in `dist/` HTML, JS or CSS content strings.
- K-COPY-3: any banned word or any rule-4 item found in `dist/` (case-insensitive grep, list in `tools/banned.txt`, S00).
- K-COPY-4: C-SQ-VENUE missing from the SideQuests readout.

## 6. Receipts

| Test | Claim | How |
|---|---|---|
| T-COPY-1 | Every rendered string has an ID | Playwright visits each route, opens each sheet, collects `innerText` of `body`, splits on lines, and checks each line against the generated copy set. Zero unknown lines. |
| T-COPY-2 | No dashes | `grep -rP "[\x{2013}\x{2014}]" dist/` returns nothing. |
| T-COPY-3 | No banned items | `node tools/banned-scan.mjs dist/` exits 0. Includes `2.77`, `631`, `835-5490`, `GPA`. |
| T-COPY-4 | Links resolve | Manual (Codeberg and LinkedIn are blocked from cloud runners): Justin or the deployer clicks each external link once on the deployed preview and records HTTP status in `qa/links.md`. |

## 7. Unknowns

None open. D-SQ-VENUE (shown), D-LEAFLINK-KIND (mutual aid) and D-PHONE (hidden) were decided by Justin on 2026-10-30.

## 8. Changelog

- 1.6.0, 2026-11-09: guestbook strings (C-CON-GB, C-GB-*), for the guestbook brief on astryx-polish-r2. No existing string changed. Proposed; Justin approves before ship.

- 1.0.0, 2026-10-30: initial deck from CONTENT-BRIEF.md.
- 1.0.0, 2026-10-30 (taste pass): C-LL-P1 rewritten from a three-beat list ("Someone needs something, someone nearby has it, and the map connects them") to two clauses; the triplet was a rule-of-three flag in TASTE-GATES section 2. Source unchanged: brief "neighbors helping neighbors", "live map", "in real time".
- 1.1.0, 2026-10-30: Justin's decisions. C-SQ-OPT-1 becomes C-SQ-VENUE and always shows (D-SQ-VENUE); the `optional` flag is removed. Mutual aid and hidden phone confirmed.
- 1.2.0, 2026-11-05: de-slop pass (Justin approved 2026-11-05). C-SRV-P3 cut: generic claim with no name, number, or date; the server readout now ends on "I wrote its terminal interface in Go." C-SQ-P1 rewritten from jargon ("Community engagement") to plain facts: anyone can host, three trails, everyday places, show up. Source unchanged: BRIEF. Grounded in a read of brittanychiang.com, joshwcomeau.com, leerob.io (one-line identity, named facts, human detail; no adjectives about own skill).
- 1.3.0, 2026-11-05: human line (Justin approved 2026-11-05). C-WHO-GAME added to the whoami sheet: "Favorite game: Sekiro: Shadows Die Twice." Same read as 1.2.0 (Brittany Chiang, Lee Robinson end on a human detail). Source: MEM.
