# Lane D — Adjacent comparison

Scope: compare PixiJS 3D (open beta, 2026-11-12) against the adjacents already established in the prior turn — Three.js r186, Babylon.js 9.x, PlayCanvas, Phaser 4 — with primary-source URLs only for new claims. Versions were re-checked in this lane; where a newer version appeared, it is noted rather than silently replacing the pinned version.

## PixiJS 3D (baseline for the comparison)

- Package: `@pixi/3d`, requires `pixi.js` 8.23.0 or later. Install: `npm install pixi.js @pixi/3d`. MIT.
- Core idea: a 3D scene is a display object (View3D) on the same stage as 2D. Multiple View3Ds per stage, each with its own scene and camera. 2D draws over / behind by display-list order. 2D onto 3D via ContainerTexture; 3D position to 2D via worldToScreen.
- Rendering: WebGPU first, same code on WebGL2, only the backend in use is downloaded. Auto-batching / instancing, compute-shader culling on most WebGPU browsers, CPU culling on Safari / iPhone / iPad for typical scenes.
- Built-ins: glTF 2.0 (skins, morph targets, animation, Draco / meshopt), PBR / Phong / flat / toon, up to 32 lights per view, soft PCF + cascaded shadows, HDR / tone mapping, post-processing (Bloom, SSAO, FXAA, tilt-shift, outlines) from @pixi/3d/extras, ParticleSystem3D, BatchedMesh3D, OrbitCamera / FPSCamera, Sprite3D billboards.
- NOT built in: physics ("There's no physics engine; bring your own" — Introduction guide). No audio system, no XR, no visual editor stated in the beta post or guides.
- Status: open beta. API can still change before 1.0. Closed beta produced 30+ bug reports / feature requests.
- Agent surface: `pixijs-3d` skill (ships in the npm package), `npx skills add https://github.com/pixijs/pixijs-skills`, docs as llms.txt.

## Three.js — r186 pinned, r187 already out

- Version: r186 shipped 2026-09-08 as npm `three` 0.186.0 (patch 0.186.1, 2026-09-24). Source: https://github.com/mrdoob/three.js/releases/tag/r186
- NEW IN THIS LANE: r187 (0.187.0) published 2026-10-30. Source: https://www.utsubo.com/blog/threejs-2026-what-changed — "Latest three.js release: r187 (npm three@0.187.0), published October 30, 2026. Previous: r186 (September 8, 2026)." The prior turn's r186 pin is therefore one release behind as of 2026-11-12. The masterspec must decide: stay pinned at r186 (session-log pin) or re-pin to r187 and re-verify the migration guide.
- r186 headline: native GaussianSplat renderer in core, written in TSL, targeting WebGL and WebGPU from one implementation; loaders for PLY / SPZ / .splat / .ksplat and glTF KHR_gaussian_splatting. Source: https://radiancefields.com/platforms/three-js
- r186 removals (migration risk): PCFSoftShadowMap removed, `rangeFog` and `viewportResolution` TSL exports deleted, minified builds removed, CommonJS build deprecated. Source: utsubo changelog summary above.
- Rendering: WebGPURenderer (`three/webgpu`) with automatic WebGL2 fallback; TSL shaders compile to WGSL / GLSL. Largest ecosystem, most examples, React Three Fiber, most hiring familiarity.
- 2D: none built in. HUD is DOM / HTML overlay or a second canvas. No auto-batching by default; instancing is manual.
- vs PixiJS 3D: Three.js wins on ecosystem, Gaussian splats, shader control (TSL), and maturity. PixiJS 3D wins when the product is 2D + 3D in one canvas (HUD, text, sprites, menus in the same stage and event system, auto-batching). For a portfolio fork whose differentiator IS the 2D HUD, PixiJS 3D is the better fit; for a pure 3D world or a splat showcase, Three.js is.
- Do not confuse: Three.js is a rendering library, not a full engine — same category as PixiJS 3D, not the same category as Babylon.js / PlayCanvas.

## Babylon.js — 9.x full engine

- Version: 9.0 released March 2026 (clustered lighting, volumetric lighting, Frame Graph); 9.34.0 listed 2026-11-04 in one comparison source; 9.31.2 published 2026-10-22 in another. Exact latest patch differs by source date — treat "9.x, 9.3x patch line" as the version, re-check at build time. Sources: https://www.babylonjs.com/ ; https://tech-insider.org/phaser-vs-playcanvas-vs-babylonjs-2026/
- Category: full 3D engine. PBR, advanced lighting, shadows, particles, skeletal animation, morph targets, glTF import, visual Inspector / debugger, Playground, Node Material Editor. Physics via Havok (WASM, integrated). WebXR (VR / AR) first-class. Babylon Native targets DirectX / Metal / Vulkan / OpenGL beyond the browser.
- Rendering: WebGL (default Engine) + WebGPU via separate WebGPUEngine class with awaited initAsync(); WebGPU available since 5.0 (May 2022). Note: WebGPU is NOT the default engine class — a migration nuance the masterspec must not flatten.
- License: Apache 2.0. Bundle: @babylonjs/core ~158 kB gzip full bundle per one dossier (tree-shakeable); single-file UMD build ~8.7 MB (do not use that figure as the bundler figure).
- vs PixiJS 3D: Babylon.js wins when physics, XR, an inspector, or a full game engine out of the box are required. PixiJS 3D wins on leanness, on 2D-native HUD, and on not paying for an engine when the product is a portfolio demo. Babylon.js is overkill for this fork; cite it as the "if the fork grows physics / XR, re-evaluate" alternative, not as a build candidate.

## PlayCanvas — full engine + cloud editor

- Version: engine 2.x line (2.22.4 cited 2026-09-23 in one source; 2.23.x in a comparison table dated 2026-10-10). Treat as "2.2x" and re-check at build time. Sources: https://app.cinevva.com/guides/playcanvas-vs-threejs ; https://wpdean.com/what-is-playcanvas/
- Category: full game engine + browser-based visual editor with real-time collaboration (Figma-for-3D positioning). Entity-component system, physics, animation, audio, input, asset pipeline wired together.
- Rendering: WebGL2 + WebGPU dual backend; WebGPU labelled Beta in the official docs, automatic WebGL2 fallback; compute-based WebGPU path for Gaussian splats in recent builds.
- License / cost: engine MIT; editor frontend MIT on GitHub since 2025; hosted editor has a free tier plus paid plans (Personal ~$15/mo, Organization ~$50/seat/mo in the sources checked). Hosted backend remains a PlayCanvas service.
- vs PixiJS 3D: PlayCanvas wins for team / non-technical collaboration, visual scene authoring, and one-click publishing / hosting. PixiJS 3D wins for code-first, local, agent-driven builds with no hosted-service coupling and no per-seat cost. For this fork (single developer + agents, local repo, Vercel deploy), PlayCanvas's editor is not a benefit worth its coupling. Cite as the "if a non-technical collaborator needs to edit scenes visually" alternative.

## Phaser 4 — 2D framework, not a 3D adjacent

- Version: 4.0.0 Caladan shipped 2026-04-10 (stable); 4.1.0 Salusa 2026-04-30; 4.2.1 Giedi 2026-07-09 current in the sources checked. Sources: https://github.com/phaserjs/phaser/releases ; https://generalistprogrammer.com/tutorials/best-html5-game-frameworks-2025
- Category: complete 2D game framework — WebGL rendering (Canvas deprecated in v4), Arcade + Matter.js physics, audio, input, scene management, tilemaps, cameras, tweens, particles, asset loader. MIT. ~500 kB framework.
- 3D: none. "2D only — no 3D rendering capabilities." WebGPU is future groundwork, not a shipping feature.
- vs PixiJS 3D: not a competitor. Phaser is the answer if the fork were a pure 2D game. It is included here to prevent a category error: do not propose Phaser as a 3D alternative, and do not propose PixiJS 3D as a Phaser replacement (PixiJS 3D has no physics / audio / scene management). The fork's game-like finale, if any, needs its own physics/audio plan (see file 05).

## Comparison matrix (text, no scores)

- Leanest 2D+3D in one canvas: PixiJS 3D.
- Largest 3D ecosystem / most control: Three.js r186/r187.
- Most batteries-included (physics + XR + inspector): Babylon.js 9.x.
- Best visual / collaborative authoring: PlayCanvas.
- Best pure 2D game toolkit: Phaser 4 (not 3D).
- Only one with a native 2D HUD in the same stage and event system: PixiJS 3D. This is the fork's deciding factor, and it is the only claim in this matrix that depends on PixiJS 3D rather than on a generic feature list.

## What changed since the prior turn

1. Three.js r187 exists (2026-10-30). The r186 pin is stale by one release.
2. Babylon.js patch line moved to 9.31–9.34 depending on source date. Pin a specific patch at build time, not "9.x".
3. PlayCanvas engine is 2.22–2.23, not 2.19–2.21 as in older notes. Same re-pin advice.
4. Phaser 4.2.1 is the current line in all sources checked; no change.
5. PixiJS 3D itself is the change that reframes the older guidance ("PixiJS is 2D only, use Three.js / Babylon.js for 3D"). That guidance is now stale for 2D-heavy 3D work and must not be repeated as current in the masterspec.
