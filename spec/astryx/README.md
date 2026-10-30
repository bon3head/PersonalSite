# Astryx Keystone: spec package for Justin Poli's personal site

Version 1.0.0, 2026-10-30. Written to be built by agents that have not seen the conversation that produced it.

## The site in five lines

One WebGL field of 6,144 lanes, one per CUDA core on the RTX 3070 Ti in Justin's home inference server. On the home scene they run parallel and fire 32 at a time, converging to an output point where the stack's words come out and cool. Travel to LeafLink and the same lanes fall flat into ink streets on paper where requests and offers land and get routed to each other. Travel to SideQuests and they loosen into a chalk campus plan on blueprint blue with three quest trails you can walk. The only navigation is a terminal keymap on the bottom edge; nothing reloads.

## Reading order

1. `DESIGN.md`: every value. The `design-tokens` JSON block is authoritative and machine-read.
2. `BUILD-ORDER.md`: waves, task cards, gates. Agents start here after DESIGN.md.
3. `specs/`: one file per system or scene.
   - `S00-foundation.md` repo, pins, generators, lints
   - `S01-theme.md` the Astryx "lane" theme
   - `S02-lanefield-engine.md` renderer, data layout, GLSL, clock, camera, governor
   - `S03-travel-routing.md` routes, travel choreography, prerender
   - `S04-chrome.md` keymap, readouts, sheets
   - `S05-scene-server.md` home: the inference server
   - `S06-scene-leaflink.md` LeafLink: mutual aid map
   - `S07-scene-sidequests.md` SideQuests: campus plan and trails
   - `S08-scene-notfound.md` 404
   - `S09-copy-deck.md` every visible string, with sources
   - `S10-fallbacks-a11y.md` no-JS, no-WebGL, reduced motion, screen readers, posters
   - `S11-performance-qa.md` gates, budgets, kill list, ship rule
4. `UNKNOWNS.md`: open questions and Justin's decisions.
5. `TASTE-GATES.md`: the anti-slop, banned-style, anti-template and content-boundary runs on this package.
6. `tools/palette-receipt.py`: rerunnable color receipts (`python3 -I spec/astryx/tools/palette-receipt.py spec/astryx/DESIGN.md`).

## Sources this package is built from

`baseline/` (the 2026-10-30 package: theme, motion, ui-ux, material, design-extracts, 3d, content, process) and the live Astryx CLI 0.7.1 (`npx @astryxdesign/cli@0.7.1`), probed on 2026-10-30. The content brief is the factual boundary; S09 traces every string to it.

## Standing rules

Claude never deploys or merges. No em or en dashes in site copy. No value outside DESIGN.md. No string outside S09. The PCB direction and the cipher/ember theme are dead and must not return.
