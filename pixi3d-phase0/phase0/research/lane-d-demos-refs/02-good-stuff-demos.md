# Lane D — Good Stuff demos and PixiJS 3D examples / playgrounds

Shelf: https://goodstuff.pixijs.io/ — "Demos, experiments and shiny little things, powered by PixiJS" and "Good Stuff is where the PixiJS team keeps its demos and experiments: small, finished pieces you can open, play with and pass around."

Shelf architecture (from the PixiJS blog, primary source): "The shelf of demos at goodstuff.pixijs.io is built this way. Each of its screens is a 2D scene drawn onto a curved 3D panel." That is the View3D + ContainerTexture pattern in production on PixiJS's own site. This is the single most reusable pattern in this lane for a portfolio fork: each project is a live 2D scene on a curved 3D panel, not a static thumbnail.

## 1. Nightward — survival game, moonlit graveyard

- URL attempted: https://goodstuff.pixijs.io/nightward/ — FETCH FAILED, no extractable content. Not retried. All mechanics below come from the PixiJS blog and the Good Stuff shelf card, not from playing the game.
- Shelf card: "Hold a moonlit graveyard with a lantern and six weapons that fire on their own. Outlast the horde, then slay the Grave Reaper."
- Blog mechanics (verbatim substance): "a survival game set in a moonlit graveyard. You only move. Six weapons fire on their own while the horde grows, until the Grave Reaper rises from the crypt."
- 2D/3D mix: "Its pixel-art sprites stand in a 3D scene as lit billboards that cast shadows, with bloom, tilt-shift, and fog over the top."
- Asset pipeline: "The game draws its art and makes its music in code, so it loads no image or audio files."
- Reusable pattern for a portfolio fork:
  1. Sprite3D lit billboards — 2D art (pixel art, or in the fork: project thumbnails / diagrams) standing in 3D, casting shadows, so flat assets gain depth without a 3D model.
  2. Move-only input — one input axis (move) with auto-fire systems. For a portfolio: scroll / pointer-move drives the camera, content systems fire on their own (auto-advancing panels, ambient particles).
  3. Code-generated art and audio — zero-asset load. For a portfolio fork: procedural hero art and WebAudio ambience instead of heavy GLB / image payloads on first paint.
  4. Post stack as mood: bloom + tilt-shift + fog over one scene. Directly maps to the tilt-shift / bloom examples in file 02 §6.
- UNKNOWN: controls beyond "you only move", wave / horde scaling numbers, weapon list, Grave Reaper trigger condition, HUD layout, score or timer, mobile controls, frame-rate or device behaviour. None of these were extractable. Do not assert them.

## 2. Mach 2 — half-pipe runner

- URL: https://goodstuff.pixijs.io/mach-2/ — fetch returned title only plus a logo image. No mechanics extractable from the page itself.
- Shelf card: "Ride a twisting half-pipe through space as Sonar. Steer, jump, grab cubits, dodge bugniks and reach the Cosmos Cube."
- Blog mechanics: "a half-pipe runner. You steer round the pipe, jump, and collect cubes through five zones, with a PixiJS 2D HUD over the run. It plays on WebGPU or WebGL2, with a keyboard or on a phone."
- 2D/3D mix: 3D half-pipe world + PixiJS 2D HUD over the run. This is the canonical View3D-fullscreen + 2D-HUD-over-top layout the blog recommends for a full game ("make one View3D fill the screen, build a whole 3D game inside it, and put your UI over the top as a regular 2D container").
- Reusable pattern for a portfolio fork:
  1. Fullscreen View3D + 2D HUD — the portfolio's nav, project titles, and evidence links live in 2D containers over the 3D scene. No DOM overlay to keep in sync.
  2. Zone structure — five zones with collectibles. Maps to a portfolio as five sections / zones (hero, projects, evidence, about, contact) with a collectible or progress marker per zone.
  3. Steer / jump / dodge verbs — lateral movement around a curved track. Maps to orbit / lateral camera travel between project panels on a curved shelf.
  4. Keyboard + phone input parity — stated in the blog, not verified by playing. Treat as a design requirement to test, not a verified fact.
- UNKNOWN: steering model, jump physics (note: PixiJS 3D has no physics engine — "There's no physics engine; bring your own"), cubit / bugnik counts, zone names, Cosmos Cube end state, HUD contents. None extractable. Do not assert them.

## 3. The Backrooms — Level 0, found on tape

- URL: not fetched as a standalone page (shelf card only; fetch budget reserved for the two named games and the docs). Shelf card: "Level 0, found on tape. Endless yellow office rooms, generated and lit as you walk."
- 2D/3D mix: UNKNOWN beyond the card. No mechanics, lighting model, generation algorithm, or HUD stated on the shelf page.
- Reusable pattern (card-level only, low confidence): procedural endless rooms, generated and lit as you walk — an infinite-scroll metaphor. For a portfolio fork this suggests procedurally generated corridor / room-per-project navigation, but the pattern is UNVERIFIED beyond the one-sentence card. Flag for a later fetch if the masterspec needs it.
- UNKNOWN: everything except the card sentence.

## 4. Through the clouds — night flight, raymarched volumetric clouds

- URL: not fetched as a standalone page (shelf card only). Shelf card: "A night flight through raymarched volumetric clouds, after the pixijs.com hero."
- 2D/3D mix: PixiJS shaders (shelf category), not labelled PixiJS 3D. Do not claim it uses @pixi/3d.
- Reusable pattern (card-level only): shader-driven atmosphere as a hero background — raymarched volumetric clouds behind 2D text. For a portfolio fork: a shader sky / cloud layer behind the 2D HUD, with the 3D scene in front. Low confidence beyond the card; flag for later fetch.
- UNKNOWN: flight controls, shader source, performance, whether it shares code with the pixijs.com hero.

## 5. PixiJS 3D open-beta launch demo — "A new dimension" / "Open to everyone"

- Shelf card (current crawl): "PixiJS 3D — Open to everyone. Neon on. Logo down. The closed beta goes out with a bang, and PixiJS 3D opens its doors." An earlier crawl variant read: "A new dimension. Lights on. Logo up. A little taste of what happens when PixiJS steps into 3D."
- 2D/3D mix: UNKNOWN beyond the card. The blog's glass-logo playground (3D glass bending the 2D poster behind it, drag to turn) is a related but separate playground, not necessarily this demo.
- Reusable pattern: launch / hero moment as a single bold 3D object (logo, trophy, cube) over a 2D poster. The blog's own suggestion: "a spinning trophy in a menu".
- UNKNOWN: scene contents, interactions, whether the card text changed between crawls because the shelf was updated for open beta (plausible, not verified).

## 6. PixiJS 3D examples and playgrounds

### 6.1 Tutorials (3, verified from https://pixijs.com/3d/tutorials)

1. Floating Shapes — beginner, 8 steps, 20 min. "Build a scene of soft clay shapes floating behind 2D text, with a view, lights, materials, primitive geometry and a camera that follows the pointer." Closest tutorial to a portfolio hero: 3D shapes behind 2D text, pointer-follow camera.
2. Model Showroom — intermediate, 8 steps, 30 min. "Show an animated glTF model on a stand, lit by a photo of a real place, with an orbiting camera, 2D buttons that crossfade its animations, and a label that follows it." Closest tutorial to a project-detail view: glTF + orbit + 2D buttons + worldToScreen label.
3. Shooting Gallery — intermediate, 8 steps, 40 min. Full mechanics in §6.2 below.

### 6.2 Shooting Gallery tutorial (https://pixijs.com/3d/tutorials/shooting-gallery, Step 1 of 8 read)

- Premise: "You'll build a fairground booth at night, with targets sliding along two rails. Hit a target and it falls back in a burst of confetti, the score goes up on a board over the booth, and the round ends after 30 seconds."
- Step 1 (Build the booth) mechanics verified from the page: Hemisphere environment (sky / ground colours); camera placed in front of the booth, moved back on narrow screens; Material3D palette (wood, cream, red with clearcoat, wall, brass metallic 1, emissive bulb); one CubeGeometry scaled for every box, one CylinderGeometry for both posts; brass rails for targets; 8-stripe awning with 9 emissive bulbs; two SpotLights (intensity 50, range 18, coneAngle 32, penumbra 0.5, castShadow true).
- 2D/3D mix: score "on a board over the booth" and (per the tutorials index) "a score in 2D and on a 3D board" — the same number in two places, 2D HUD + ContainerTexture on a 3D board. This dual-score pattern is directly reusable: a portfolio metric shown both in the 2D HUD and on a 3D panel in-world.
- Reusable pattern for a portfolio fork:
  1. Shared-geometry booth construction — one CubeGeometry, scaled per part. Cheap, legible, fast-by-default batching.
  2. Ray-picked hit → fall + confetti burst → score++. Maps to click-a-project-panel → panel animates → evidence counter increments.
  3. Timed round (30 seconds) — a bounded interaction loop. Maps to a timed "tour" or demo mode in the portfolio fork.
  4. Narrow-screen camera pull-back — responsive 3D, not just responsive 2D.
- UNKNOWN: steps 2–8 contents (targets, confetti, scoring, bloom / "Add juice", timer). Only Step 1 was read. Do not assert later steps.

### 6.3 Racing game example

- Blog: "To see how a full game fits together, play our racing game in the examples and read its source." URL: https://pixijs.com/3d/examples?example=game_racing
- Fetch result: the page text extraction returned only the Post-processing category list (see §6.4), not racing-game details. Mechanics, controls, HUD, and source structure are UNKNOWN from this lane. The blog's claim (playable + source-readable) is VERIFIED as a claim; the game's contents are not.
- Reusable pattern (blog-level only): a full game as a single worked example with readable source — the masterspec should cite this example as the structural reference for a complete PixiJS 3D app, and a later lane should read its source.

### 6.4 Examples index — Post-processing category (15 items, verified from https://pixijs.com/3d/examples)

Anti-aliasing (MSAA / FxaaEffect); Bloom; Custom effect (vignette, edge blur); Custom mesh pass (x-ray); Custom tone mapping; Depth of field; Stacking effects (view3d.passes, in order); Outlines and wireframes; Motion blur; Passes per mesh; Portals (second camera into a render texture); Render graph; Scene outputs; Ambient occlusion (SsaoEffect); Tilt shift (one slab of depth sharp, scene reads as miniature).

Note: the blog claims "over 100 live examples" across categories. Only the Post-processing category (15) was extractable in this lane. Other categories, total count, and per-example source links are UNKNOWN. Do not assert the full example list.

### 6.5 Playgrounds (2D/3D mix, from the blog)

- Glass over 2D: "This logo is 3D glass, and it bends the 2D poster drawn behind it. Drag the logo to turn it."
- Container texture: "a 2D scene with a bouncing wordmark and a clock runs on the screen of a 3D monitor."
- Nesting: "A 3D scene can show a 2D container that holds another 3D scene", as many levels deep as wanted.
- Instancing / batched mesh playground: 100,000 objects with shadows, all at 60 fps (blog claim; device and backend not stated in the claim).
- These playgrounds were cited from the blog text, not opened individually. Their URLs were not extracted as standalone verbatim links in this lane. Flag for a later lane if the masterspec needs direct playground URLs.

## 7. Demo-to-portfolio pattern map (summary)

| Demo / tutorial | Pattern | Portfolio-fork use |
|---|---|---|
| Good Stuff shelf | Live 2D scene on each curved 3D panel | Project panels: each project is a live 2D scene, not a thumbnail |
| Nightward | Lit billboard sprites + bloom / tilt-shift / fog + code-generated art/audio | Flat project art in 3D with shadows; procedural hero; zero-asset first paint |
| Mach 2 | Fullscreen View3D + 2D HUD; 5 zones; keyboard + phone | Fullscreen scene + 2D HUD; 5 sections as zones; input parity as a test requirement |
| Shooting Gallery | Shared geometry; hit → fall + confetti → dual score (2D + 3D board); 30 s round; narrow-screen camera pull-back | Click panel → animate → evidence counter in HUD and in-world; timed tour mode; responsive camera |
| Floating Shapes | Clay shapes behind 2D text; pointer-follow camera | Hero: soft 3D shapes behind the name / headline, camera follows pointer |
| Model Showroom | glTF on a stand; orbit camera; 2D buttons crossfade animations; label follows model | Project detail: model / artefact on a stand, orbit, 2D buttons switch views, label tracks the object |
| Racing game | Full game with readable source | Structural reference for a complete app; source to be read in a later lane |
| Through the clouds | Raymarched volumetric clouds as hero atmosphere | Shader sky behind 2D HUD (low confidence, card-level only) |
| The Backrooms | Endless generated rooms, lit as you walk | Procedural corridor-per-project navigation (low confidence, card-level only) |
