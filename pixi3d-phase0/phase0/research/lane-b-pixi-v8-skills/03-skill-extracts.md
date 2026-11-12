# Lane B — Skill extracts

Rule applied: verbatim ONLY where it increases agent ability (API recipes, error traps, load patterns).
Each extract is short, attributed, and under 40% of its source file.
Paraphrase is used for the rest; the full source is linked, not copied.
Licenses: pixijs-skills MIT; PixiJS docs MIT (PixiJS project). Source file + URL per extract.

Quality-gate note per extract: what the extract prevents, and what still needs a live check
(`npx tsc --noEmit`, a runnable Vite + TypeScript app, or the referenced topic file).

## How to use the skills (router discipline)

### E1 — pixijs SKILL.md, "Read before you write" (paraphrased, 3 steps)
- Source: `skills/pixijs/SKILL.md`, https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/SKILL.md
- Content: (1) List every router row the task touches — each class constructed, options object passed, effect built, symptom fixed. A whole app usually lists 4–8. (2) Read each listed file before writing the code for that part, even for a one-line change; open the file itself, a grep hit is a fragment that drops the rule and the exception beside it. (3) Done when every file on the list has been opened; then check code against the pitfall group for each feature built.
- Why it helps an agent: forces topic-file reads before code generation, instead of pattern-matching from memory. This is the single highest-leverage rule in the skill.
- Quality-gate note: enforce in the masterspec as a pre-write checklist. A code-writing agent must name its router rows in its plan before emitting code. If no row fits, scan `references/index.md`, then the project's local PixiJS docs. For an uncovered signature, fetch `https://pixijs.download/release/docs/<module>.<Class>.html.md`.
- Verbatim fragment (short, from the same section): "Open the file itself; a Grep hit is a fragment that drops the rule and the exception beside it."

### E2 — pixijs SKILL.md, frontmatter description (paraphrased scope)
- Source: `skills/pixijs/SKILL.md` frontmatter, same URL as E1. License: MIT.
- Content: use before writing, fixing, or porting any PixiJS code, from a one-line fix to a whole app or game. Routes to topic files covering Application, Container scene graph, Sprite, Texture, AnimatedSprite, TilingSprite, NineSliceSprite, Graphics, Text, BitmapText, HTMLText, SplitText, Mesh, ParticleContainer, Assets, Ticker and onRender, events, filters and shaders, blendMode, generateTexture, cacheAsTexture, Color, Point, Matrix, DOMContainer, GifSprite, HTMLSource, accessibility, performance and teardown, WebGL/WebGPU/Canvas renderers, Web Workers, custom builds, project setup, migration from v7.
- Why it helps: the description is the trigger surface — it tells a later agent exactly when this skill applies, so the masterspec can cite it as the routing rule rather than re-listing topics.
- Quality-gate note: do not re-type this list into the masterspec as a claim about the framework; cite it as the skill's stated scope.

### E3 — pixijs-3d SKILL.md, frontmatter description (paraphrased scope)
- Source: `skills/pixijs-3d/SKILL.md`, https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs-3d/SKILL.md. License: MIT.
- Content: use whenever writing or editing code that uses PixiJS 3D (`@pixi/3d`): scenes, View3D, Mesh3D, Model3D, lights, shadows, cameras, OrbitCamera, FPSCamera, materials, Material3D, textures, glTF models and animation, BatchedMesh3D instancing, picking and pointer events, post-processing (bloom, SSAO), particles, render to texture, ContainerTexture, custom shader bits, 2D HUD over 3D, Sprite3D billboards, tone mapping and HDR environments, scene graph and transforms, vector/quaternion math, porting a Three.js app. Read it before writing any `@pixi/3d` code: the API is new and differs from Three.js and from pixi3d, an older, unrelated npm package.
- Why it helps: the "differs from Three.js and from pixi3d" warning is the trap that would otherwise produce silently wrong code from a Three.js-trained agent.
- Quality-gate note: the masterspec must forbid importing `pixi3d` (unrelated) and forbid Three.js API names in `@pixi/3d` code; the skill's `references/from-threejs.md` name table is the porting authority.

## Application lifecycle

### E4 — Application: construct, init, destroy (short verbatim + paraphrase)
- Source: `skills/pixijs/references/application.md`, https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/references/application.md
- Verbatim (12 lines, ~5% of the 262-line file):
  ```ts
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: "#1099bb",
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  });
  document.body.appendChild(app.canvas);
  ```
- Paraphrased rules from the same file: constructor takes no arguments; v7 options are ignored with a deprecation warning. `app.renderer` is `undefined` until `init()` resolves, and `app.canvas` / `app.screen` throw until then. `app.destroy()` throws if `init()` has not resolved; chain destroy on the init promise in React cleanup. Full destroy form: `app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true, texture: true, textureSource: true })`. `releaseGlobalResources` drains global pools; without it a recreated app reuses pooled batches/textures (flicker / stale textures). Textures from `Assets.load` stay in the Assets cache; release with `Assets.unload(...)`.
- Why it helps: this is the exact scaffold a demo agent must copy; every line is a trap if varied (constructor options, pre-init access, destroy ordering).
- Quality-gate note: the demo scaffold must be runnable in Vite + TypeScript and pass `npx tsc --noEmit`. Top-level `await` fails `vite build` on Vite 6 and older — wrap init in an async IIFE.

### E5 — Resize: lay out from the renderer event (paraphrased)
- Source: `skills/pixijs/references/application.md`, same URL as E4.
- Content: a window resize is applied on the next animation frame, so a personal `window` resize listener still reads the old `app.screen`. Lay out from `app.renderer.on("resize", (width, height) => { title.position.set(width / 2, height / 2); })`. An element target needs `new ResizeObserver(() => app.queueResize())`; `queueResize()` coalesces repeated calls. `app.cancelResize()` is declared in typings but does not exist at runtime in 8.22 (calling it throws).
- Why it helps: prevents the classic "layout reads stale screen size on resize" bug, which fails silently.
- Quality-gate note: the demo must include a resize handler test (resize window / container, assert HUD recentres). Do not assert against `app.screen` inside a `window` resize listener.

## Assets

### E6 — Assets init order and extension-less URLs (paraphrased pitfalls)
- Source: `skills/pixijs/SKILL.md`, pitfalls, https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/SKILL.md
- Content: `await Assets.init({ basePath, manifest })` before the first `load`, `loadBundle`, or `backgroundLoad`; a later `init` is dropped. `Assets.load([a, b])` resolves to an object keyed by URL or alias — read `res[a]`. A URL with no file extension (`?id=`, `blob:`, API route) needs `Assets.load({ src, parser: 'texture' })`; without it the result is `null` with only a warning. Audio files have no loader and also resolve `null`.
- Why it helps: all three fail silently (null, dropped init, wrong key) and look like a loader bug.
- Quality-gate note: the demo asset manifest must use explicit aliases and `parser: 'texture'` for any extension-less URL. Assert loaded values are non-null before creating sprites.

### E7 — Texture.from / Sprite.from read the cache only (paraphrased pitfall)
- Source: `skills/pixijs/SKILL.md`, pitfalls, same URL as E6.
- Content: `Texture.from(url)` and `Sprite.from(url)` read the cache only (v7 fetched): `await Assets.load(url)` first. Wrap a `TextureSource` as `Sprite.from(source)` or `new Sprite(Texture.from(source))`; `new Sprite(source)` draws nothing.
- Why it helps: a v7-trained agent will write `Sprite.from(url)` and get a blank scene with no error.
- Quality-gate note: grep the demo source for `Sprite.from(` and `Texture.from(` with a URL literal and no preceding `Assets.load` for the same URL; fail the review if found.

## Ticker and frame loop

### E8 — Ticker callback receives the Ticker (paraphrased pitfalls)
- Source: `skills/pixijs/SKILL.md`, pitfalls, same URL as E6; corroborated by `https://pixijs.download/v8.23.0/docs/ticker.html.md`.
- Content: `app.ticker.add((t) => (s.x += 2 * t.deltaTime))`. `deltaTime` is ~1 per 60 fps frame, `deltaMS` is milliseconds. `app.ticker.update()` already renders, even with `autoStart: false`; skip the extra `app.render()`. Per-object frame logic: `obj.onRender = () => { ... }` (replaces v7 `updateTransform` overrides); it also runs while the object is invisible. Read canvas pixels from a listener at `UPDATE_PRIORITY.UTILITY`, which runs after the render.
- Why it helps: fixes the three most common loop bugs (bare delta argument, double render, v7 transform override).
- Quality-gate note: the demo loop must use `deltaTime` for motion and `deltaMS` only for wall-clock timers; assert no second `requestAnimationFrame` loop competes with `app.ticker`.

## Events

### E9 — eventMode static, pointertap, drag (paraphrased pitfalls)
- Source: `skills/pixijs/SKILL.md`, pitfalls, same URL as E6; corroborated by `https://pixijs.download/v8.23.0/docs/events.html.md`.
- Content: give every listening object `eventMode = 'static'` (default `'passive'` never fires its own listeners) and `cursor = 'pointer'`. Clicks on empty canvas: `app.stage.eventMode = 'static'` and `app.stage.hitArea = app.screen`. Buttons listen to `pointertap` (`click` is mouse only, `tap` touch only); a double click is `e.detail === 2`. Drag with `globalpointermove` (plain `pointermove` fires only over the object), end on `pointerup` and `pointerupoutside`, convert with `parent.toLocal(e.global)`, keep points with `p.copyFrom(e.global)` (event objects are reused).
- Why it helps: every line is a silent failure (no event, mouse-only button, drag that stops at the object edge, reused event object overwritten).
- Quality-gate note: the demo interaction test must exercise pointertap on touch-sized targets and a drag that leaves the object bounds.

## Filters

### E10 — WebGPU filters need a gpu program (paraphrased pitfall)
- Source: `skills/pixijs/SKILL.md`, pitfalls, same URL as E6; corroborated by `https://pixijs.download/v8.23.0/docs/filters.html.md`.
- Content: custom GLSL via `Filter.from({ gl: { vertex: defaultFilterVert, fragment }, resources })`; in the fragment sample `uTexture`, get 0–1 coordinates from `vTextureCoord * uInputSize.xy / uOutputFrame.zw` (both `highp`), keep colour premultiplied. On the WebGPU renderer (`preference: 'webgpu'`) every filter needs a `gpu` program too, or all filters on that container are skipped. The Canvas renderer skips filters. Effects reaching past the shape need `padding`; a full-screen stage filter needs `app.stage.filterArea = app.screen`.
- Why it helps: a WebGL-only custom filter silently disappears on WebGPU, which is the demo's stated preference.
- Quality-gate note: if the demo uses a custom filter and `preference: 'webgpu'`, the filter must ship both `gl` and `gpu` programs, or the filter must be dropped and the effect baked. Verify visually on a WebGPU-capable browser, not only in code review.

## Text

### E11 — Text fill default and BitmapText for per-frame strings (paraphrased pitfalls)
- Source: `skills/pixijs/SKILL.md`, pitfalls, same URL as E6; corroborated by `https://pixijs.download/v8.23.0/docs/scene-10.html.md`.
- Content: `new Text({ text, style: { fill: 0xffffff } })` — the default fill is black, invisible on the default black background. Strings that change every frame (score, timer, FPS) go in `BitmapText`; each `Text` change redraws a canvas and re-uploads it. Load web fonts with `await Assets.load({ src, data: { family } })` before creating text; `HTMLText` sees only fonts loaded this way.
- Why it helps: invisible default text and per-frame `Text` churn are the two text bugs that survive code review.
- Quality-gate note: the demo HUD must use `BitmapText` for any per-frame value and `Text` only for static labels, with an explicit non-black fill.

## 3D — starting app and conventions

### E12 — pixijs-3d quick start (short verbatim scaffold, ~14% of the 467-line file)
- Source: `skills/pixijs-3d/SKILL.md`, https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs-3d/SKILL.md
- Verbatim (condensed to the load-bearing lines; the full file's quick-start block is lines 37–171):
  ```ts
  import { CubeGeometry, DirectionalLight, Material3D, Mesh3D, View3D } from '@pixi/3d';
  import { OrbitCamera } from '@pixi/3d/extras';
  import { Application, Assets } from 'pixi.js';
  const app = new Application();
  await app.init({ resizeTo: window, backgroundColor: 0x87b7e6, antialias: true });
  const view = new View3D({ autoResize: true, shadowQuality: 'medium',
    environment: { skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 } });
  app.stage.addChild(view);
  const sun = new DirectionalLight({ color: 0xfff2dc, intensity: 3, castShadow: true });
  sun.rotation.set(-Math.PI / 4, Math.PI / 6, 0);
  view.root.addChild(sun);
  const source = await Assets.load<Scene3DSource>('/assets/models/Duck.glb');
  const duck = new Model3D({ source, position: { x: 0, y: 0, z: 3 } });
  view.root.addChild(duck);
  view.camera.position.set(0, 5, 12);
  view.camera.lookAt({ x: 0, y: 1, z: 0 });
  new OrbitCamera({ view, enableDamping: true });
  app.ticker.add((ticker) => { duck.rotation.y += 0.01 * ticker.deltaTime; });
  ```
- Notes from the same file, paraphrased: `PlaneGeometry` lies in XY with a +Z normal — rotate -90° around X for a floor. Lights are nodes under `view.root`. Lights and cameras face local -Z. The file's own node transforms set a model's size; read `duck.getLocalBounds()` before scaling.
- Why it helps: this is the only verified complete starting app for `@pixi/3d` v0.1.0 in the fetched sources. A demo agent should start from it verbatim and vary one thing at a time.
- Quality-gate note: the demo must boot from this scaffold (or cite the exact lines it deviates from and why) and load a real `.glb` through `Assets.load<Scene3DSource>`, not a placeholder cube only.

### E13 — 3D conventions that prevent Three.js carry-over (paraphrased)
- Source: `skills/pixijs-3d/SKILL.md`, Conventions, same URL as E12.
- Content: everything 3D goes under `view.root`; a mesh on `app.stage` does nothing useful. Constructors take one options object; same values are plain properties afterwards. Camera `fov` is vertical field of view in degrees (default 60), `near` 0.1, `far` 1000, `mode` `'perspective'` or `'orthographic'` with `orthographicSize` (half the view's width in world units, default 5). `Material3D` is PBR; glow is opt-in `emissive: { color, strength }`, never a plain colour. `FlatMaterial` is unlit. Custom looks come from shader bits in `extraBits`, not a ShaderMaterial class. Models: `Assets.load<Scene3DSource>(url)` then `new Model3D({ source })`; clips play through `model.player`. Extras live in `@pixi/3d/extras`. `BatchedMesh3D` draws thousands of instances in one call. HUD is ordinary Pixi objects added to the stage after the view; `view.worldToScreen(point)` places a 2D label at a 3D position. `app.init` uses WebGL unless `preference: 'webgpu'`. No enums: `shadowQuality`, `alphaMode`, `mode` are string literals.
- Why it helps: each line maps a Three.js habit to its PixiJS 3D replacement, which is exactly where a Three.js-trained agent invents wrong code.
- Quality-gate note: the masterspec must include the skill's Three.js name table (`Scene` → `View3D` on `app.stage`; `renderer.render` → Pixi renders it; `OrbitControls` → `OrbitCamera`; `MeshStandardMaterial` → `Material3D`; `GLTFLoader` → `Assets.load<Scene3DSource>` + `Model3D`; `AnimationMixer` → `model.player`; `InstancedMesh` → `BatchedMesh3D`; `Raycaster` → pointer events or `view.raycast`; `EffectComposer` → `view.passes`).

## 3D — silent pitfalls (highest value for a demo agent)

### E14 — Rotation vs quaternion on lookAt / glTF nodes (paraphrased pitfall)
- Source: `skills/pixijs-3d/SKILL.md`, Pitfalls, same URL as E12.
- Content: `lookAt`, `reparentChild`, and loaded glTF nodes set `quaternion`, and a node turns by whichever of `rotation` or `quaternion` was written last. On those nodes `rotation.y += x` replaces the real turn, so turn them with `quaternion.multiply(q)`. `addChild` keeps a node's local numbers, so it jumps to the same offset under its new parent; `reparentChild` keeps its place in the world. `view.root` holds the camera: clearing or hiding `view.root` makes rendering throw — put level content under its own `Container3D` and clear that.
- Why it helps: the demo's spinning-model animation is exactly the code that hits this. A naive `rotation.y +=` on a loaded model silently replaces its orientation.
- Quality-gate note: any per-frame rotation of a loaded model must use `quaternion.multiply`, or the model must be wrapped in a parent `Container3D` whose `rotation` is animated instead. Assert the model still faces +Z after 10 seconds of animation.

### E15 — Tone mapping, light scale, and alphaMode (paraphrased pitfalls)
- Source: `skills/pixijs-3d/SKILL.md`, Pitfalls, same URL as E12.
- Content: views default to `toneMapping: 'none'`, where lit colour clips above 1 — set `toneMapping: 'aces'` for strong lights, HDR environments, or bloom. Direct lights and `AmbientLight` are divided by π and the hemisphere is not: a sun near 3 and a hemisphere near 0.7 light `baseColor` fully, and an `AmbientLight` of 0.2 is barely visible. Porting from Three.js: a HemisphereLight(sky, ground, i) becomes `environment: { skyColor, groundColor, intensity: i / Math.PI }`; directional, point, spot, and ambient intensities port 1:1. `alphaMode` defaults to `'opaque'`, which ignores `alpha` and texture alpha (transparent PNG texels draw black) — set `'blend'` or `'mask'`.
- Why it helps: these three defaults produce a washed-out, too-dark, or black-texel render with no error, and each looks like a lighting bug.
- Quality-gate note: the demo lighting spec must state `toneMapping`, sun intensity, hemisphere intensity, and `alphaMode` per material explicitly, with a screenshot check for clipping and black texels.

### E16 — ContainerTexture on opaque material, and model material sharing (paraphrased pitfalls)
- Source: `skills/pixijs-3d/SKILL.md`, Pitfalls, same URL as E12.
- Content: a `ContainerTexture` on an opaque material draws black where the 2D is transparent — add a backdrop, `clearColor`, or `alphaMode: 'blend'`. A loaded model draws its source's materials, so a write to one changes every model from that file — give one model copies with `model.materials = (m) => m.clone()`, and build a changed loaded material with `clone(options)`, not `new Material3D`, which drops its textures. A glTF file's own node transforms already size it and stand it Y-up facing +Z — read `getLocalBounds()` before scaling and add no fix-up rotation.
- Why it helps: these are the two traps in the "live 2D on a 3D surface" and "two copies of one model, different colours" demo features.
- Quality-gate note: any `ContainerTexture` use must state its `alphaMode` / backdrop; any per-model material change must go through `model.materials` cloning, verified by rendering two instances side by side.

### E17 — Camera / input ordering and hit-testing (paraphrased pitfalls)
- Source: `skills/pixijs-3d/SKILL.md`, Pitfalls, same URL as E12.
- Content: `OrbitCamera`, `FPSCamera`, `ParticleSystem3D`, and a model's animation `player` update themselves on `Ticker.shared`, not `app.ticker`, so their step can land after the frame's code or a frame late — pass `autoUpdate: false` and call `update(ticker)` from the `app.ticker` callback when order matters (`orbit.update()` returns `true` when the camera moved). 3D nodes default to `eventMode: 'passive'` — set `'static'` or nothing picks. `pointertap` fires for every mouse button, so check `e.button`. A full-screen view hit-tests its whole rectangle, so it blocks clicks to 2D objects behind it — put interactive 2D above the view or set `view.hitArea`. `OrbitCamera.enabled = false` only stops input; `update()` keeps re-aiming the camera, so also set `autoUpdate = false` (or `destroy()`) before moving the camera yourself. `FPSCamera` walking follows the pitch, so looking down sinks the camera — re-pin `position.y` after `update()` for a ground walker.
- Why it helps: ordering and hit-test bugs make the demo feel broken (camera one frame late, HUD buttons unclickable) with no console error.
- Quality-gate note: the demo must drive cameras from `app.ticker` with `autoUpdate: false` when camera motion is choreographed, and must test HUD clicks with the full-screen view present.

### E18 — Current 3D library limitations (paraphrased, from the skill)
- Source: `skills/pixijs-3d/SKILL.md`, "Current library limitations", same URL as E12.
- Content: a glTF mesh without normals (Fox.glb is one) lights as if every face pointed +Z, black when it turns away — rebuild flat normals with `getAttributeData`. `SphereGeometry` maps images mirrored left to right — `uvTransform: new Matrix(-1, 0, 0, 1, 1, 0)` plus `rotation.y = Math.PI` fixes it. A `Sprite3D` created with no `position`, `scale`, or `anchor` draws 1×1 units instead of its texture size until one of them changes — always pass a `position`.
- Why it helps: these are known-broken cases in v0.1.0, not agent errors. Knowing them prevents a wasted debug loop.
- Quality-gate note: the demo asset list must exclude normal-less glTF files or include the flat-normal rebuild step; sphere-mapped images must carry the uvTransform fix.

## Skill reference router (2D) — names only, content not fetched

- Foundations: `application`, `core-concepts`, `ticker`, `environments`, `create`, `migration-v8`.
- Scene: `scene-core-concepts`, `scene-container`, `scene-sprite`, `scene-graphics`, `scene-text`, `scene-mesh`, `scene-particle-container`, `scene-dom-container`, `scene-gif`, `html-source`.
- Utilities: `assets`, `events`, `math`, `color`, `accessibility`.
- Effects and rendering: `blend-modes`, `filters`, `custom-rendering`, `performance`.
- 3D recipe files: `scene-graph`, `math`, `scene-and-lighting`, `cameras`, `models-and-animation`, `materials`, `geometry`, `instancing`, `particles`, `environment-and-sky`, `post-processing`, `render-to-texture`, `custom-shaders`, `2d-and-3d-together`, `picking-and-input`, `from-threejs`.
- The masterspec must instruct the coding agent to open the router file for each topic it touches before writing that part. Do not paste these files into the masterspec; install the skills in the demo repo instead (see E1).
