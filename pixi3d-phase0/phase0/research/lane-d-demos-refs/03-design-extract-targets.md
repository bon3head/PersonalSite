# Lane D — Design-extract targets (prepared list only)

Status: PREPARED, NOT RUN. No design-extract fusion was run in this lane. The local-design-extract 12-stage pipeline (fusion-run.js, style-brief.md, VERIFY manifest, WCAG contrast gate) is a separate step. This file is the target list with URLs and rationale for that step.

Constraint carried from the parent task: the fork must NOT be a copy of the current portfolio site. It must be a unique fork that pushes the PixiJS 3D strengths. Targets below are for pattern / token extraction (type, colour, spacing, signature components, motion), never for copying brand assets, logos, photography, or proprietary fonts. Do-not-copy lists are part of the fusion output.

Theme constraint carried from the parent task: the fork stays inside the agent-first Astryx integration and the theme currently used on the portfolio. Extracted tokens must be reconciled against that theme in the fusion step; a target whose palette conflicts with the portfolio theme is a pattern source, not a palette source.

## Target 1 — Good Stuff demo shelf (primary, PixiJS-native)

- URL: https://goodstuff.pixijs.io/
- Genre: PixiJS demo shelf / 2D-on-curved-3D-panel gallery.
- Why it fits the Pixi View3D + 2D HUD architecture: it IS the architecture. The blog states each shelf screen is a 2D scene drawn onto a curved 3D panel. A portfolio fork built the same way gets the shelf for free: one View3D, N curved panels, each panel a live 2D container (project title, evidence, links), 2D HUD over the top for nav and contact.
- Stealable patterns:
  1. Curved-panel shelf — panels curve around the camera; the visitor orbits / scrolls along the shelf instead of scrolling a flat list.
  2. Live 2D on 3D — panel contents are live scenes (animated, clickable), not baked textures. A project panel can animate its own diagram while the shelf moves.
  3. Launch-card hierarchy — one large launch card (currently the PixiJS 3D open-beta card) + smaller demo cards. Maps to one hero project + supporting projects.
  4. "Tiny worlds" framing — small, finished, pass-around pieces. Maps to the fork's scope: a small finished demo, not a monorepo.
  5. Neon / dark shelf chrome with bright card art — contrast system to extract, then reconcile against the portfolio theme.
- Extraction notes for the fusion step: run fusion on the shelf homepage; expect the 3D canvas to dominate the computed-style pass, so record the 2D chrome (cards, type, spacing) separately from the 3D scene. Screenshot proof must include a panel in focus and the shelf at rest. Contrast gate: card text over dark shelf is the pair to check.
- Risk: the shelf is a demo index, not a portfolio. Its nav is minimal and its content is other people's demos. Extract the shelf mechanics and card system, not the information architecture.

## Target 2 — Bruno Simon portfolio (primary, maximalist / explorable-world pole)

- URL: https://bruno-simon.com/
- Genre: creative-developer portfolio as a drivable 3D world / small game.
- Awards / standing (from the rickcreates case-study page, not from awwwards.com directly): Awwwards Site of the Day 2026-01-21, score 8.11 (Design 8.05 / Usability 7.83 / Creativity 8.62 / Content 8.18), Developer Award 7.65, Site of the Month January 2026, FWA of the Day 2025-12-13, FWA of the Month December 2025, FWA of the Year 2025. Original 2019 version won Site of the Month and Site of the Year 2020.
- Stack (same case-study page): three.js r183 WebGPURenderer, TSL, Rapier, GSAP, Howler.js, Draco, KTX (Basis), WebSocket. Whole island built in Blender, whose file doubles as the level editor. Single game loop, fixed system order.
- Why it fits the Pixi View3D + 2D HUD architecture: it is the extreme opposite pole and therefore the control case. Bruno's world has effectively no HTML interface — all UI elements are 3D objects in the world. A Pixi fork can do the same world-as-navigation idea (drive / walk between projects) while keeping the part Bruno sacrifices: a legible 2D HUD. The fork's thesis is "Bruno's explorable world, plus Pixi's 2D HUD, so evidence stays readable."
- Stealable patterns:
  1. Navigation as explorable world — projects are places, not links. Drive / walk to a project to open it.
  2. Single-loop architecture — one ticker, fixed system order (render, physics, audio, HUD). Maps to Pixi's app.ticker with explicit ordering.
  3. Quality / backend options page — shows whether WebGPU or WebGL is in use, graphics quality adjustable. Maps to a Pixi fork diagnostics / quality toggle (WebGPU vs WebGL2, post-effects on/off).
  4. Persistent world state — day-night cycle, seasons, weather, multiplayer presence in the 2025 rebuild. For a fork: time-of-day lighting on the scene as a cheap mood system, not a full simulation.
  5. Public source + Blender files (MIT) — the implementation is inspectable. A later lane may read the source; this lane did not.
- Anti-pattern to record (do NOT copy): usability cost. In the 20-portfolio Wow / Practicality study, Bruno Simon scored Practicality 1 / Wow 5; only 8 of 20 sites were usable within 3 seconds on a throttled phone and 9 were not usable within 10 seconds. The fork must beat that with the 2D HUD: real links on the first screen, content reachable without entering the world.
- Extraction notes for the fusion step: fusion's computed-style pass will see very little DOM (most UI is 3D). The useful extraction is structural, not token-level: world layout, project-as-place placement, options-page pattern, onboarding (how a first-time visitor learns to drive). Record the fusion run's limits honestly in the VERIFY manifest rather than forcing token output from a canvas.
- Risk: Three.js / WebGPU stack, not Pixi. Extract patterns, not code. Do not port Rapier physics or the Blender level-editor workflow; PixiJS 3D has no physics engine.

## Target 3 — Corentin Bernadou portfolio (primary, editorial / 2D-first pole)

- URL: https://corentinbernadou.com/
- Genre: creative-developer portfolio, Swiss editorial design + WebGL geometry.
- Standing: freelance developer, Bordeaux, France; Awwwards Jury since 2025; first portfolio redesign in six years (2025/2026). Prior design-extract source for the current portfolio site (dark editorial, hairline rules, flat material per session memory — that memory claim is context, not a fresh verification in this lane).
- Design (Codrops case study, primary for this target): "find a balance between a 2D interface that stays clear and readable, and a 3D environment that adds depth and movement"; Swiss Style, deliberately limited palette of orange, white, and black; typography and printed-poster layouts; homepage "overarching 3D geometry that incorporates previews of all my projects"; Three.js + GLSL for WebGL; SCSS / BEM; grid-rules easter egg (click the central cross, grid rules frame the title); interactive Figma-inspired ruler (place markers on the interface).
- Live homepage verified in this lane: Issue N°003 / Coll. 2026, Ref. EDI-032026-R02, repeating project list — Moving Portraits, Issey Miyake SS25, Studies in Motion, Ruby Campbell, Shaped by Earth, Echoes in Light.
- Why it fits the Pixi View3D + 2D HUD architecture: it is the closest existing proof of the fork's intended balance — readable 2D editorial surface first, 3D geometry second, with the 3D carrying project previews. In Pixi terms: 2D HUD / editorial layer is the primary surface; View3D is the geometry behind / beside it, and ContainerTexture puts the 2D project previews onto 3D geometry.
- Stealable patterns:
  1. Editorial grid as the primary system — hairline rules, issue / reference numbers (EDI-032026-R02), archive list with codes (ISB_104 etc. on the archive page). Maps to a portfolio fork's evidence ledger: each project gets a reference code.
  2. One 3D geometry holding all project previews — a single hero object (in the original, a rotating 3D cube made of project thumbnails) instead of one scene per project.
  3. Grid-rules and ruler easter eggs — the layout itself becomes interactive. Maps to a Pixi fork hidden interaction: a 2D HUD toggle that reveals the grid / measurement layer over the 3D scene.
  4. Limited palette (orange / white / black in the original) — a 3-colour discipline to reconcile against the portfolio's blue Astryx theme. Extract the discipline (3 colours, high contrast), not the orange.
  5. Archive as a dense list — project index as typographic list, separate from the 3D hero. Maps to a 2D HUD archive panel beside the 3D shelf.
- Extraction notes for the fusion step: this is the best fusion candidate of the three — real DOM, real type scale, real tokens. Run the full 12-stage pipeline here first. Expect signature-element candidates: the central cross / grid-rules trigger, the rotating thumbnail cube, the issue / ref line.
- Risk: the original is Three.js + GLSL, not Pixi. Extract tokens and the 2D/3D balance, not shaders. The orange palette conflicts with the portfolio's blue theme — flag in the brief, do not import it.

## Reserve target — Edoardo Lunardi portfolio (not primary; use if a target fails fusion)

- URL: https://edoardolunardi.dev (domain per the Muszarski study and the Wahab Shaikh personal-web list; Awwwards record at https://www.awwwards.com/sites/edoardo-lunardi)
- Genre: practical creative-frontend portfolio.
- Standing: Awwwards Site of the Day Nov 22, 2025, score 7.18/10, DEV Award 7.35/10; senior frontend developer, Vienna; clients include Buck, Disney, Porsche, Red Bull.
- Why it is a reserve: in the 20-portfolio study it scored Practicality 5 / Wow 4 — one of only 4 of 20 scoring 4+ on both. Its lesson is "real links on the first screen" and "the show beside the content, never in front of it." That is the fork's usability guardrail, but the site itself is less 3D-driven than Targets 1–3, so it is a guardrail reference, not a primary extraction target.
- Stealable pattern (single): first-screen real links + 3D as accompaniment, never as gate.
- Status: NOT fetched as a live page in this lane. Do not cite live-page details for it.

## Target selection rationale (summary)

- Three poles, one thesis: Good Stuff (Pixi-native shelf mechanics) + Bruno Simon (explorable world, maximalist pole) + Corentin Bernadou (editorial 2D-first pole). The fork sits between Bruno and Corentin, built with Good Stuff's mechanics.
- The 2D HUD is the fork's differentiator in every target note: Bruno proves a world without a HUD costs usability; Corentin proves a readable 2D surface can carry a 3D scene; Good Stuff proves Pixi can put live 2D on 3D panels.
- Fusion order (recommendation for the next step, not executed here): Corentin first (best DOM/token yield), Good Stuff second (shelf mechanics, expect canvas limits), Bruno third (structural only, expect low token yield). If any target fails the contrast gate or returns no signature element, record that as a finding, not a failure.
