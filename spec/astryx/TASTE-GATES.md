# TASTE-GATES.md: the taste gates, run on this package

Version 1.0.0, 2026-10-30. Sources: `baseline/ui-ux/anti-slop-rubric.md`, `baseline/ui-ux/banned-slop-styles.md`, `baseline/ui-ux/ui-slop-patterns.md` section 6, `baseline/process/SPEC-DRIVEN-METHOD.md` section 5, `baseline/content/CONTENT-BRIEF.md`.

This file records what the gates found on the specs. It does not replace the gates on the built site: G-ANTI and G-CONTENT (S11 sections 6 and 7) rerun them on screenshots and on `src/copy.ts`.

## 1. Anti-template test

The question: can someone name one concrete way this does not look generated?

The answer the package is built to produce: "The navigation is a one-line terminal keymap, and every scene is the same 6,144 GPU lanes rearranged." Both halves are mechanical, so the build can check them without taste: `laneCount === 6144` on every route, one draw call for the lanes, zero card classes, no `<header>` navbar, document height equals viewport height (DESIGN 2, S11 G-ANTI).

Verdict: PASS on the spec. It becomes PASS on the site only when a reviewer who has read nothing but the screenshots says something that specific (S11 G-ANTI question 1).

## 2. Banned styles, run over every string in S09

Scope: 56 copy IDs, 86 backticked strings.

| Check | Result |
|---|---|
| Em or en dash, anywhere in the package (all `.md` and `tools/`) | 0 |
| Lexical bans (section 1 of the ban list plus Justin's: passionate, leverage, cutting-edge, seamless, delve, tapestry, ninja, rockstar; plus signature, iconic, actually, simply, just, alone, honest, watch, notice) | 0 |
| GPA, `2.77`, phone digits | 0 |
| "live" | 2 allowed, both quoting the brief's description of LeafLink: "on a live map" (C-LL-P1) and "WebSocket live feed" (C-LL-STACK). S00 `banned.txt` allows exactly these two substrings and nothing else. |
| Contrast frames ("not X, it's Y") | 0 |
| Rule of three | **1 found, fixed.** C-LL-P1 read "Someone needs something, someone nearby has it, and the map connects them as it happens": three beats in the same cadence. Now "When a neighbor needs what you have, the map connects you as it happens." (S09 changelog) |
| Aphorism closers, organic metaphors (breathes, lives), inserted jokes, stage-managing ("watch") | 0 |
| Eyebrows, serial numbers, stat cards | 0. The design has no slot for any of them (S04 readout anatomy is heading plus prose plus one link). |

The feel-words from the launch prompt and the scene keywords in the brief ("heartbeat", "adventure", "gathering", "real-time pulse") are used in the specs to steer motion and are kept out of the copy on purpose. The page says what each project is; the motion carries the feeling.

## 3. UI slop checklist (ui-slop-patterns section 6), predicted from the specs

| Line | Verdict | Where it is enforced |
|---|---|---|
| No purple to cyan gradient | CLEAN. No gradients at all; one hue. | DESIGN 3, 10 |
| No glow without a light source | CLEAN. Brightness comes from lane overlap and pulses that travel on lanes; no bloom pass, no shadows (S00 lint bans non-inset `box-shadow`; S01 theme). | S02 renderer, S01 |
| No nested cards | CLEAN. Zero cards; G-ANTI greps for them. | DESIGN 2 |
| Every icon labels something | CLEAN. No icons. Keys are letters in `Kbd`. | S04 |
| Every graph has a labeled denominator | CLEAN. No graphs, no numbers on screen (K-SRV-1). | S05 |
| One typeface, on purpose | CLEAN. Commit Mono only, three weights, chosen because the navigation is a terminal. | DESIGN 4 |
| No all-caps eyebrow | CLEAN. No uppercase transforms anywhere. | DESIGN 4, 10 |
| No button wraps its label | CLEAN by test: T-S04-1 asserts the keymap never wraps at 320px. | S04 |
| One radius system | CLEAN. Astryx radius scale only; Kbd uses `--radius-inner`. | DESIGN 5, S01 |
| Squint test | Unverified until screenshots exist. On the renders made for S05, the readout column and the field separate clearly at blur. The contact action is one key (`c`) from every scene. | S11 G-ANTI |

## 4. Anti-slop rubric, run over this package as model output

| Dimension | Verdict | Evidence |
|---|---|---|
| 1. Sycophancy | CLEAN | The package overrules the launch prompt's framing where evidence demanded it (section 6 below) and records its own wrong guesses (DESIGN changelog: the first lane alpha and the 12% hue budget, both disproved by renders). |
| 2. Verdict evasion | CLEAN | Each decision has a default applied and a one-line reversal (UNKNOWNS section 1). No "it depends". |
| 3. Scaffold as substance | FLAG, accepted | Every spec has the same section shape. That is the SPEC-DRIVEN-METHOD contract, which exists so agents can find things. The content inside each section is not templated: S05 is a formula and a camera, S06 is a simulation, S07 is a plan generator. |
| 4. Verbosity as coverage | CLEAN with one risk | Values live once, in the DESIGN token block. Specs restate a few numbers only inside formulas so a reviewer can check them by hand (DESIGN 12 says code never reads the spec text). The risk is drift between the restatements and the tokens; `lint-tokens` (S00) and the scene unit tests are the guard. |
| 5. Superlative substitution | CLEAN | No adjective carries a claim. "Bold" in the prompt became a mechanism (one lane field, three regimes), not a word in the copy. |
| 6. Entrenchment | CLEAN | First server render saturated into a solid block; the parameters were changed and the change written down rather than defended. Counter-cases are in section 7. |
| 7. Framing parroting | CLEAN | See section 6: the prompt said "seamless travel"; the package does not fly a camera between three places, it re-forms one object. |
| 8. Citation theater | **FLAG, open** | C-SRV-ALT and the whole geometry rest on the RTX 3070 Ti having 48 SMs of 128 CUDA cores (6,144). That is NVIDIA's public GA104 spec, but no source was opened while writing this package. It is registered as R-GPU, and the ship rule (S11 section 9) blocks until someone opens the source and records the URL. Every other factual string traces to a brief line (section 5). |
| 9. Hedge accounting | CLEAN | Every UNKNOWN names the test or the person that resolves it (UNKNOWNS sections 2 to 4). |
| 10. Legacy protectiveness | CLEAN | PCB board, cipher/ember theme, GSAP and the single-file constraint of the earlier site are all dead here and named dead (README standing rules). Nothing from v1 to v6 was carried forward for sunk cost. |

## 5. Content boundary trace

Every BRIEF or MEM string in S09, against the line of `CONTENT-BRIEF.md` it rests on.

| Copy ID | Claim | Brief line |
|---|---|---|
| C-SRV-P1, C-WHO-EDU, C-META-DESC | CS senior, SUNY New Paltz, December 2027 | 9 |
| C-WHO-PLACE | Smithtown, NY; New Paltz, NY | 10 |
| C-WHO-LINK-GH, C-WHO-LINK-LI, C-CON-LINK-LI | bon3head; justin-poli-15406030b | 11 |
| C-CON-EMAIL | justinf0829@gmail.com (phone on the same line is withheld, D-PHONE) | 12 |
| C-WHO-ROLE-1 to 3 | Math Club VP (runs event ops), Eleet Coders council rep, CS Teams treasurer | 14 to 15 |
| C-SRV-P3 | builds his own tools, ships under time pressure | 22 to 23 |
| C-SRV-P2 | Go TUI, Ollama, Tailscale, Docker, Open WebUI, WSL2 Ubuntu, Windows 11 host in Smithtown, RTX 3070 Ti | 29 to 32 |
| C-SRV-ALT | 6,144 cores, 32 per warp | R-GPU (not in the brief; see 4.8) |
| C-LL-P1 | mutual aid, live map, neighbors, real time | 48, 54, 56, 59 |
| C-LL-FACTS | team of four named, week-long, 2nd place | 51 |
| C-LL-STACK | WebSocket live feed, Leaflet maps, tag and category search | 52 |
| C-SQ-P1 | community engagement, quests, everyday spaces, people show up | 67, 73 to 75 |
| C-SQ-FACTS | hackathon, co-built with Julian Shuster, 2nd place | 69 to 70 |
| C-LL-CODE, C-SQ-CODE, C-WHO-LINK-CB | Codeberg repos | MEM (Justin, 2026-10-04); D-CODE-HOST |
| C-SQ-OPT-1 | Hack New Paltz, 24 hours | MEM only, OFF by default (D-SQ-VENUE) |

Never shown, by rule: GPA (brief line 10; cut by Justin 2026-10-04), phone, model names Ollama serves, any metric, any liveness claim about the server or the projects.

Conflict flagged for Justin: the brief calls LeafLink mutual aid; earlier project notes called it an event discovery platform. The specs follow the brief (D-LEAFLINK-KIND).

## 6. Reframes taken

- **"Seamless travel between scenes" became "one object that re-forms", not a camera flight.** Flying a camera between three separate places is the 3D-portfolio default. Here there is one field of lanes and travel changes its layout weights; the camera only settles. That is why the three scenes read as one site.
- **"Blue accent" became "blue owned by lightness and job".** The measurement in DESIGN 3.1 showed no saturated mid blue is ownable, and Astryx ships Meta's. So signal is only light on dark and ink is only marks on paper; neither is ever a brand-band button fill.
- **"Bold" became one structural decision instead of many effects.** One draw call, three light regimes, one typeface, zero ornaments.
- **The hero became the server itself.** The brief's strongest fact is that he runs his own inference on hardware he owns. The geometry is that hardware's core count, so the picture is a claim, not decoration.

## 7. Counter-cases, stated fairly

- **"This is a particle hero."** The ban list kills decorative dot fields "even when the dots are data-driven". The defense: the lanes are not behind a headline, they are the scene's only drawing; on LeafLink they are the streets the matches travel, on SideQuests the plan and the trails. If a blind reviewer still reads the Server scene as ambient decoration (G-ANTI question 2, "matrix rain screensaver"), that is K-SRV-3 and the scene is redesigned, not defended.
- **Density saturation.** At the first-guess alpha the 6,144 lanes fused into a solid block. The tuned values fixed it on desktop and phone renders in SwiftShader, but a real phone at DPR 3 draws thinner lines with different blending. G-PERF-DEVICE screenshots are the check; alpha is a token, so the fix is one number.
- **700ms travel versus "nothing over 250ms".** Travel is longer than the feedback budget. DESIGN 6.2 reconciles it: the key press lights within one frame, the readout swaps by 150ms, 80% of the displacement happens in the first 210ms, and travel is interruptible. If testers still feel the wait, the duration token drops; the choreography table is written in fractions so it scales.
- **Monospace type reads "developer portfolio".** Commit Mono is the common choice for that genre. It is kept because the navigation is a terminal and the person is a systems engineer; the defense is that it is the only typeface and it is used at display size weight 200, which the genre rarely does. A reviewer naming the type as the generic part would be a fair hit.
- **"Live map" on a simulated feed.** C-LL-P1 describes what LeafLink is (the brief's words), while the scene runs a simulation. C-LL-SIM says "Simulated feed" on the same screen so nobody reads the drawing as live data.

## 8. Changelog

- 1.0.0, 2026-10-30: initial run on the package.
