# Lane D — Sources

Lane: D — Good Stuff demos, design-extract targets, and adjacent references.
Date: 2026-11-12. Scope: read-only research. No repo edits, no masterspec writing, no design-extract fusion run.
Fetch budget: stop at 25 fetches. Fetches used: 24 (search + open calls, including 1 failed Nightward fetch that was not retried).

## Method

1. Primary sources first: pixijs.com blog, pixijs.com/3d, pixijs.com/3d/guides, pixijs.com/3d/tutorials, pixijs.com/3d/examples, goodstuff.pixijs.io.
2. Demo mechanics are recorded only when the demo page or the PixiJS blog states them. Where a page returned no extractable text, that is recorded as a fetch gap, not filled in by inference.
3. Adjacent-framework claims reuse the versions already established in the prior turn and were re-checked with fresh searches in this lane (Three.js r186 / r187 note, Babylon.js 9.x, PlayCanvas 2.x, Phaser 4.2.1).
4. Design-extract targets are a prepared list only. Fusion (local-design-extract, 12-stage pipeline) is a separate step and was NOT run.

## Primary sources fetched and read

| # | Source | URL | What it established |
|---|--------|-----|---------------------|
| S1 | PixiJS blog — Introducing PixiJS 3D | https://pixijs.com/blog/pixi-3d-open-beta | Open beta 2026-11-12; View3D as display object; 2D/3D share a stage; WebGPU first, WebGL2 fallback; MIT; 35 guides, 100+ examples, 3 tutorials; Nightward and Mach 2 descriptions; racing game and shooting-gallery pointers; skill install command |
| S2 | PixiJS 3D landing | https://pixijs.com/3d | glTF 2.0, lights up to 32 per view, post-processing from @pixi/3d/extras, PBR materials, ParticleSystem3D, BatchedMesh3D, OrbitCamera / FPSCamera, Toon / Phong / flat |
| S3 | PixiJS 3D Introduction guide | https://pixijs.com/3d/guides/getting-started/intro | View3D / root / Container3D tree; 2D draw order and pointer-event catch; ContainerTexture; worldToScreen; +Y up, 1 unit = 1 metre, far 1000 by default; no physics engine — bring your own; Sprite3D, BatchedMesh3D, Model3D, materials, lights, environment, cameras, particles, post-processing, GraphDebugOverlay |
| S4 | PixiJS 3D tutorials index | https://pixijs.com/3d/tutorials | 3 tutorials: Floating Shapes (beginner, 8 steps, 20 min), Model Showroom (intermediate, 8 steps, 30 min), Shooting Gallery (intermediate, 8 steps, 40 min) |
| S5 | Shooting Gallery tutorial, Step 1 of 8 | https://pixijs.com/3d/tutorials/shooting-gallery | Booth build: targets on two rails, hit target falls in confetti burst, score on board over booth, round ends after 30 seconds; Material3D, CubeGeometry sharing, SpotLight |
| S6 | PixiJS 3D examples index | https://pixijs.com/3d/examples | Text extraction returned only the Post-processing category (15 items). Full category list not extractable from this fetch |
| S7 | Racing game example | https://pixijs.com/3d/examples?example=game_racing | Same extraction limit as S6: page returned the Post-processing list, not racing-game details. Existence and source-readable status come from S1 only |
| S8 | Good Stuff shelf | https://goodstuff.pixijs.io/ | Shelf listing: PixiJS 3D open-beta launch demo, Mach 2, Through the clouds, The Backrooms, Nightward; "Demos, experiments and shiny little things, powered by PixiJS" |
| S9 | Mach 2 demo page | https://goodstuff.pixijs.io/mach-2/ | Returned title only plus a logo image. No mechanics extractable from this fetch. Mechanics in file 02 come from S1 + S8 |
| S10 | Nightward demo page | https://goodstuff.pixijs.io/nightward/ | FETCH FAILED — no extractable content (browser.open error, not retried per instruction). Mechanics in file 02 come from S1 + S8 only |
| S11 | Corentin Bernadou portfolio | https://corentinbernadou.com/ | Live homepage: Issue N°003 / Coll. 2026, Ref. EDI-032026-R02, repeating project list (Moving Portraits, Issey Miyake SS25, Studies in Motion, Ruby Campbell, Shaped by Earth, Echoes in Light). Design detail comes from the Codrops case study, S12 |
| S12 | Codrops — Corentin Bernadou portfolio case study | https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/ | Balance of clear readable 2D interface and 3D environment; Swiss Style, orange / white / black; homepage 3D geometry incorporating previews of all projects; Three.js + GLSL; grid rules and Figma-inspired ruler easter egg |

## Secondary / verification sources (search results, used only where noted)

- Bruno Simon portfolio: https://bruno-simon.com/ — stack and awards verified via https://rickcreates.com/r/2026-01-21-brunos-portfolio and https://boringwebsites.blog/posts/bruno-simon-the-portfolio-you-drive-a-car-around
- Bruno Simon practicality warning: https://medium.com/@mateusz_muszarski/trying-to-build-an-awwwards-winning-brutalist-portfolio-the-process-the-mindset-and-the-tools-d8089487d366 — 20 portfolios, Wow vs Practicality, Bruno Simon Practicality 1 / Wow 5
- Edoardo Lunardi (reserve target): https://www.awwwards.com/sites/edoardo-lunardi (SOTD Nov 22, 2025, 7.18/10, DEV 7.35/10); domain edoardolunardi.dev per the Muszarski study above
- Three.js r186: https://github.com/mrdoob/three.js/releases/tag/r186 ; https://radiancefields.com/platforms/three-js — r186 shipped 2026-09-08 as three 0.186.0, native GaussianSplat via TSL
- Three.js r187 note: https://www.utsubo.com/blog/threejs-2026-what-changed — r187 (0.187.0) published 2026-10-30; r186 is therefore NOT the latest three.js release as of this lane
- Babylon.js 9: https://www.babylonjs.com/ ; https://tech-insider.org/phaser-vs-playcanvas-vs-babylonjs-2026/ — 9.0 March 2026, 9.34.0 listed 2026-11-04
- PlayCanvas: https://app.cinevva.com/guides/playcanvas-vs-threejs ; https://wpdean.com/what-is-playcanvas/ — full engine + cloud editor, WebGL2 + WebGPU (WebGPU labelled Beta), engine MIT, editor frontend MIT since 2025
- Phaser 4: https://github.com/phaserjs/phaser/releases ; https://generalistprogrammer.com/tutorials/best-html5-game-frameworks-2025 — 4.0.0 Caladan 2026-04-10, 4.2.1 current in the sources checked

## Sources deliberately NOT used as primary evidence

- Old community pixi3d (jnsmalm/pixi3d, v2.5.0, PixiJS v5–v7): superseded by official @pixi/3d for v8. Cited only in file 04 as a do-not-confuse note.
- Steam / itch.io "Nightward" / "Night Ward" results: different games (first-person horror, PS1 horror). Not the PixiJS Good Stuff Nightward. Excluded.
- Unopened Awwwards / FWA jury pages for Bruno Simon: award scores in file 03 come from the rickcreates case-study page, not from awwwards.com directly. Flagged as such.
