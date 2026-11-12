# Lane F1 — API verification: PixiJS 3D v0.1.0 against the lane-field rewrite

- Date: 2026-11-12
- Versions verified: `@pixi/3d` 0.1.0, `pixi.js` 8.23.0 (npm registry + installed `package.json`)
- Sources fetched for this lane: all 23 remaining guides + 64 API reference pages from
  `https://3d.pixijs.download/v0.1.0/docs/`, saved under `raw/` (87 files, SHA-256 manifest
  `raw/SHA256SUMS`, all 92 listed files verify clean). Guide URLs and API page URLs are the
  `https://3d.pixijs.download/v0.1.0/docs/<slug>.html.md` form listed in
  `https://pixijs.com/3d/llms.txt`.
- Cross-check: every constructor signature below was also confirmed against the shipped
  type declarations in `node_modules/@pixi/3d/dist/*.d.ts` (0.1.0) and
  `node_modules/pixi.js/dist/pixi.js.d.ts` (8.23.0) during the probe `tsc --noEmit` run.
- No signature below is invented. Where the docs are silent, the entry says so.

## 1. BatchedMesh3D — VERIFIED, with one trap

- Constructor: `new BatchedMesh3D(options: BatchedMesh3DOptions)` — required option is
  `size: number` (slot count, fixed for life).
  Source: `raw/api/scene.BatchedMesh3D.html.md:56` (`> **new BatchedMesh3D**(\`options\`): \`BatchedMesh3D\``),
  `raw/api/scene.BatchedMesh3DOptions.html.md`.
- Slot setup (all three required per slot, plus passes):
  - `setGeometryAt(index, geometry: Geometry3D): void`
  - `setMaterialAt(index, material): void`
  - `setMatrixAt(index, matrix): void` — copies the matrix, allocates nothing.
  - `setPassesAt(index, passes: RenderPassBit): void` — REQUIRED. A slot does NOT take its
    passes from its material. `RenderPassBit.OPAQUE` for `alphaMode` `'opaque'`/`'mask'`,
    `TRANSPARENT` for `'blend'`, `TRANSMISSION` for transmissive materials, add `SHADOW` to
    cast shadows.
    Source: `raw/guides/scene-7.html.md` ("Filling the slots" section).
  - `setVisibleAt(index, visible): void` — every slot starts visible.
  - `invalidate(index): void` — required after texture swaps and after changing a slot's
    `billboardMode` / `receiveShadow` (in `items[index]`).
- TRAP (probe-confirmed, §2 of 02-probe-results.md): a slot in no pass draws nothing, with no
  error and no warning. The probe's first two render runs showed 0 pixels from a fully
  configured batch because `setPassesAt` was omitted. The guide states it; nothing in the
  runtime complains.
- A new slot's matrix is all zeros, so it draws nothing until `setMatrixAt` is called.
  Source: `raw/guides/scene-7.html.md`.
- Bulk matrix rewrite: `batched.matrices` → `BatchMatrices` (`data: Float32Array`,
  `stride`, `offset`, `update(first?, count?)`). Slot `i` is 16 floats from
  `offset + i * stride`, column-major; floats 12–14 are position.
  Source: `raw/api/scene.BatchMatrices.html.md`, `raw/guides/scene-7.html.md` ("Moving slots").
- Culling: batch has its own `cull` option, `'off'` by default (every slot in a pass draws).
  Source: `raw/guides/scene-7.html.md` ("Culling").
- `destroy({ geometry, material })` frees batch buffers only, unless flags are passed.
  Source: `raw/api/scene.BatchedMesh3D.html.md:412-416`.

## 2. Custom shaders (ShaderBit) — VERIFIED

- Type: `ShaderBit<VERTEX_TAGS, FRAGMENT_TAGS, BIND_GROUPS>` — a plain object.
  Fields: `name: string` (required, unique — two different bits with one name throw, and
  shaders are cached by bit names), `attributes?`, `interStage?`, `bindings?`,
  `gpu?`, `gl?`, `outputs?`, `overrideDefs?`, `requires?`, `structs?`, `textures?`.
  Source: `raw/api/rendering.ShaderBit.html.md`.
- Backend code: `gpu: { vertex?, fragment?, header? }` is WGSL; `gl: { vertex?, fragment?,
  header? }` is GLSL. Slots are keyed by template slot name, e.g. vertex
  `input` / `beforeTransform` / `afterTransform` / `end`, fragment `material` /
  `lighting` / `end`. A bit holding only one backend runs none of its code on the other
  renderer, with no error (Lane A trap 23, confirmed here).
  Source: `raw/api/rendering.ShaderBit.html.md`, `raw/guides/extras_materials.html.md`
  ("Adding your own shader code").
- Attachment, two ways:
  - `extraBits: readonly ShaderBit[]` on `BaseMaterial3DOptions` — composed into the
    material's shader, fixed for its lifetime. `material.clone({ extraBits })` adds bits to
    an existing (e.g. glTF-loaded) material.
  - `descriptor: { bitsGpu: ShaderBit[], bitsGl: ShaderBit[] }` on `BaseMaterial3DOptions`
    for a fully custom material. The material's textures and data are laid out from
    `bitsGpu`, so `bitsGl` must declare the same texture names in the same order, or the
    constructor throws.
    Source: `raw/api/materials.BaseMaterial3DOptions.html.md:114-185`.
- Bindings: `bindings.material` fields are per-material values, read as `material.<name>`
  in shader, written through `material.data.<name>`; after an in-place vector write call
  `material.update()`. A field is `f32`, `i32`, `u32`, `mat2x2<f32>`, or a `vec2/3/4` of
  `f32`; other value types throw. `bindings.global` / `bindings.camera` are engine-filled;
  do not add fields of your own there or the draw can fail. Engine fields are readable
  without declaring them (`camera.uCameraPosition` in WGSL, `uCameraPosition` in GLSL;
  `global.uTime`).
  Source: `raw/api/rendering.ShaderBit.html.md` (`bindings?` section).
- Textures: `textures?: string[]` declares the slots; each name gets `sampleX(uv)` (fragment
  stage only, mip from derivatives) and `sampleXDirect(uv)` (mip 0, either stage) helpers
  in both languages. Fill them via the `textures` option or `material.textures`. Pixi
  uploads images premultiplied by default; divide the sample's `rgb` by its `a` to read the
  stored colour.
  Source: `raw/api/rendering.ShaderBit.html.md` (`textures?` section).
- Ready-made bits in `@pixi/3d/extras`: `glossBit`, `dissolveBit`, `toonLightingBit`,
  `toonMaterialBit`, `mathConstantsBit`, `screenSpaceFuncsBit`, `instanceFetchBitGl`,
  `uvTransformBit`, `alphaMaskBit`, `passthroughFragment`.
  Source: `raw/api/rendering.ShaderBit.html.md`, `raw/guides/extras_materials.html.md`.
- Limits stated in the guides:
  - Shadows and outlines do not run a bit's vertex code: a bit that moves vertices leaves
    the slot's shadow and outline where the vertices were.
  - Code runs inside the same function as the material's own code; wrap in braces to avoid
    colliding with locals such as `baseColor`.
  - When `alphaMode` is `'opaque'` (default), the material sets `alpha` back to 1 after the
    bit's fragment code runs.
  - A custom template must add `{{vertexStoreAccess}}` / `{{fragmentStoreAccess}}` (WGSL)
    and `{{storeAccess}}` (GLSL) for `instance` bindings, and a pass descriptor must list
    `instanceFetchBitGl` in `bitsGl`.
    Source: `raw/guides/extras_materials.html.md`, `raw/api/rendering.ShaderBit.html.md`.

## 3. RGBA32F random access — VERIFIED (bounded)

- `pixi.js` texture formats include `'rgba32float'`.
  Source: `node_modules/pixi.js/dist/pixi.js.d.ts:10224` (`TEXTURE_FORMATS` union).
- `BufferImageSource` with a `Float32Array` resource defaults to `rgba32float`:
  "Without a `format`, the array type picks it: `Float32Array` gives `rgba32float`".
  `rgba32float` needs an optional feature for linear filtering.
  Source: `node_modules/pixi.js/dist/pixi.js.d.ts:16301-16309`.
- Shader-side read of a float texture: the documented path is the `ShaderBit.textures`
  helpers above — `sampleXDirect(uv)` reads mip 0 in either stage (vertex or fragment).
  There is NO documented `texelFetch` / integer-coordinate fetch equivalent in the 3D
  guides or API reference, and no documented way to call WGSL `textureLoad` from a bit.
  A bit that needs exact texel addressing must emulate it with `sampleXDirect` at
  `(index + 0.5) / size` UVs. That emulation was NOT pixel-verified by the probe (see
  03-limits-unknowns.md).
- WebGL2 float-render-target gate: a `'beforeToneMapping'` effect and the cube-map lighting
  copy need `EXT_color_buffer_float`; rendering throws on a device without it.
  Source: `raw/guides/core-concepts-4.html.md:24`,
  `raw/guides/environment.html.md:43`, `raw/api/scene.View3D.html.md:484`.
- The current site's layout texture is 256×768 RGBA32F (786,432 floats) and the activity
  texture 256×24 (24,576 floats). Nothing in the Pixi docs caps a `BufferImageSource` at
  those sizes; the probe used 256×24 successfully. 256×768 was NOT probed.

## 4. Per-instance attributes — VERIFIED

- Declaration: `instanceData?: InstanceDataOptions` on `BatchedMesh3DOptions`. Each field
  is a `vec4` in the `{ value, type }` shape of a pixi `UniformGroup` entry; `value` is
  what every slot starts with. Names are letters/digits/single underscores, starting with
  a letter. Fields are fixed for the batch's lifetime.
  Source: `raw/api/scene.BatchedMesh3DOptions.html.md:225-263`.
- Shader read: a bit declares the fields it reads in `bindings.instance` and reads them as
  `instance.<name>` in either stage. Example from the docs:
  `bindings: { instance: { tint: 'vec4<f32>' } }`,
  `gpu: { fragment: { material: 'albedo *= instance.tint.rgb;' } }` (same in `gl`).
  Source: `raw/api/scene.BatchedMesh3DOptions.html.md:239-248`.
- Per-slot write: `setInstanceDataAt(index, name, x, y, z, w): void`.
  Bulk write: `batched.instanceData` → `BatchInstanceData` (`data: Float32Array`,
  `u32Data: Uint32Array` same memory, `stride`, `offset`, `fields: Record<string, number>`,
  `update(first?, count?)`). Field `name` of slot `i` is the four numbers from
  `offset + i * stride + fields[name]`. Call `update()` once when done, or writes may never
  upload. `update()` here uploads none of the matrices.
  Source: `raw/api/scene.BatchInstanceData.html.md`,
  `raw/api/scene.BatchedMesh3D.html.md:3158-3219`.
- Costs/limits: changing a value uploads only the instance data, not the matrices. Each
  field read in fragment code takes a varying, so keep those few. Shadows don't run
  material bits, so a bit that moves vertices from instance data doesn't move the slot's
  shadow.
  Source: `raw/api/scene.BatchedMesh3DOptions.html.md:250-252`.
- Probe confirmation: 100-slot batch, `tint` field, `stride=4`, `fields={tint:0}`,
  `setInstanceDataAt` ×100 and bulk `data` write + `update()` all ran; the tint is visible
  in the render (24,967 reddish pixels vs 0 for the stock batch). See 02-probe-results.md.

## 5. Backend-specific shader code (WGSL vs GLSL) — VERIFIED

- One bit carries both: `gpu` (WGSL) and `gl` (GLSL), each `{ vertex?, fragment?, header? }`.
  Both are optional; omitting one silences the bit on that backend with no error.
- The compiler merges a `ShaderDescriptor`'s bits into one program per backend, filling each
  template slot with the bits' code in list order.
  Source: `raw/api/rendering.ShaderBit.html.md`, `raw/api/rendering.ShaderDescriptor.html.md`.
- `ShaderDescriptorOptions` / `ShaderDescriptor` is the per-backend bit list a material or
  pass is built from. A custom template needs the output slots (`{{fragmentDeclareOutputs}}`
  / `{{fragmentWriteOutputs}}` in WGSL, `{{declareOutputs}}` / `{{writeOutputs}}` in GLSL).
  Source: `raw/api/rendering.ShaderBit.html.md` (`outputs?` section).
- `requires?: ShaderBit[]` lists bits holding helpers/constants the bit calls; the compiler
  adds each required bit once, just ahead of the first bit that requires it. A required bit
  that the material doesn't list can't add texture slots, material fields, or instance fields.
  Source: `raw/api/rendering.ShaderBit.html.md` (`requires?` section).
- Helpers: `mathConstantsBit` declares `PI` / `INV_PI`; `screenSpaceFuncsBit` provides
  `screenUVFromWorld` / `sampleScreenCopy`; `instanceFetchBitGl` sets each instance's
  `modelMatrix` on WebGL for a pass's own template.
  Source: `raw/api/rendering.mathConstantsBit.html.md`,
  `raw/api/rendering.screenSpaceFuncsBit.html.md`,
  `raw/api/rendering.instanceFetchBitGl.html.md`.
- WGSL-only caution from the docs: the compiler doesn't check that `textureSample`, `dpdx`,
  or `dpdy` sits in uniform control flow; keep it there. A branch on a `material` value is
  uniform; under a branch on a per-fragment value the derivative (and so the mip level) is
  undefined.
  Source: `raw/api/rendering.ShaderBit.html.md` (`gpu?` section).

## 6. Warmup / precompile — ABSENT (no public API)

- No `warmup`, `precompile`, `compileAsync`, or `preload` symbol exists in the 35 guides, the
  API reference pages fetched, or the shipped `dist/index.d.ts` (grep for
  `warmup|warmUp|compileAsync|precompile` across all three returns nothing except the
  `@internal` `compileShader`, below).
- `compileShader(context: ShaderCompilerContext, plugins: ShaderCompilerPlugin[]): string`
  is exported from `@pixi/3d` but marked `@internal` in
  `node_modules/@pixi/3d/dist/core/shader/compileShader.d.ts:3-4`. It returns shader source
  text; it does not compile a GPU program and is not a warmup path.
- Documented behaviour instead (`raw/guides/core-concepts-4.html.md:50-75`):
  - Each material/geometry/bones/morph/view-setting combination compiles once per renderer,
    on the first frame that needs it; that frame can stall, most of all on WebGL.
  - View settings built into shaders: `toneMapping`, `environment` (type switch),
    shadows (first light to cast), `shadowFilter`. Values read as data (exposure, fog,
    light colours/intensities, light count) compile nothing.
  - Mitigation the docs give: "Choose the view's settings before the first render where
    you can, and change them on a loading screen or in a settings menu rather than during
    play."
- Consequence for the fork: the three.js `renderer.compileAsync(scene, camera)` call in
  `lanefield.ts:480,540` has no Pixi equivalent. First-frame stall must be absorbed on a
  loading screen or measured and budgeted; it cannot be warmed up through a public API.

## 7. Renderer statistics — ABSENT as an API; debug tooling only

- There is no `renderer.info` equivalent (`calls`/`triangles`/`textures`/`geometries`/
  `programs`) in the guides, API reference, or shipped `.d.ts`. Grep for `getStats|stats`
  in `dist/index.d.ts` and `dist/extras/index.d.ts` returns nothing.
- The only statistics surface is the debug tooling in `@pixi/3d/extras`:
  - `GraphDebugOverlay({ view, renderer })` — an HTML panel. Record, use the app, Stop
    (also stops by itself after `maxRecordedFrames`). Workload tab: each mesh-drawing pass,
    its draws and triangles, reused/repacked/rebuilt status per frame; one row per scene
    meshes and one row per `BatchedMesh3D`. Render Graph tab: every pass the view built,
    including skipped ones, with textures read/written. Recording adds CPU time to each
    frame — "stop it before you measure frame times."
  - `captureGraphDebugSnapshot(graph: RenderGraph): GraphDebugGraphSnapshot` — captures
    the passes and resources of a render graph's last resolve as plain data. It needs the
    view's `RenderGraph`, which is internal (`View3D._graph`); there is no public getter.
  - `RenderGraphDebugger` — captures a snapshot of a view's last frame and explains what
    changed since the previous capture.
  - `WireframePass` — redraws opted-in meshes as lines (a pass, not a counter).
  Source: `raw/guides/extras_debug.html.md`,
  `raw/api/extras_debug.captureGraphDebugSnapshot.html.md`,
  `raw/api/extras_debug.RenderGraphDebugger.html.md`,
  `raw/api/extras_debug.GraphDebugOverlay.html.md`.
- Consequence for the fork: the `__lanefield.info()` debug contract (`renderer.info.render.
  calls/triangles`, `memory.textures/geometries`, `programs`) asserted by
  `tests/world.engine.spec.ts` and read by G-WORLD / G-PERF-LAB cannot be preserved with
  Pixi-backed numbers through a public API. It must be re-specified (e.g. around
  `captureGraphDebugSnapshot` data captured from the debug overlay path) or dropped.

## 8. Off-center projection — ABSENT (no public API)

- `Camera3D` constructor: `new Camera3D(options?: Camera3DOptions)`.
  Source: `raw/api/scene.Camera3D.html.md:46`.
- Options are `fov`, `near`, `far`, `mode` (`'perspective'` | `'orthographic'`),
  `orthographicSize`, `zoom`, plus node options (`angle`, `position`, `rotation`,
  `quaternion`, `scale`, `origin`, `clippingPlane`, `boundsVolume`, `renderTexture`,
  event/cursor/hit-volume options). There is NO `shift`, `offset`, or projection-matrix
  option anywhere in `raw/api/scene.Camera3DOptions.html.md` (full heading list checked).
- `projection: readonly Matrix4` — "Projection matrix, from camera space to clip space".
  `viewProjection: readonly Matrix4`. `computeProjection(aspect, out: Matrix4): Matrix4`
  — "Writes the projection this camera's settings give for an aspect ratio into `out`".
  The projection is recomputed from `fov`/`near`/`far`/`mode`/`zoom` only.
  Source: `raw/api/scene.Camera3D.html.md:1558-1673, 2448-2483`.
- Camera aim: the camera looks along its local -Z; `lookAt(target)` turns it to face a point.
  Source: `raw/guides/scene-2.html.md:7-16`.
- Consequence for the fork: the three.js principal-point shift in `camera.ts`
  (`projectionMatrix.elements[8] = -pose.shift[0]; elements[9] = -pose.shift[1]`) has no
  Pixi equivalent. The readout clear-zone layout depends on that shift
  (`T.world.camera.*.shiftNdc`: server fine `[0.62, 0]`, leaflink coarse `[0, 0.18]`,
  sidequests fine `[-0.18, 0]`). Workarounds are UNKNOWN: no documented view-offset,
  custom-projection, or projection-matrix injection point exists in the fetched docs.
  The masterspec must either re-derive the poses without a shift, emulate it (e.g. by
  rendering into a larger view and cropping, unproven), or confirm with the vendor that
  no such hook exists.

## 9. Adjacent signatures the fork needs (verified in passing)

- `new View3D(options?: View3DOptions)`: `width`, `height`, `camera?`, `root?`,
  `anchor?`, `autoResize?`, `background?`, `environment?`, `exposure?`, `fog?`,
  `graph?`, `passes?`, `resolution?`, `shadowFilter?`, `shadowQuality?`,
  `toneMapping?`, `composite?`, `cull?`.
  Source: `raw/api/scene.View3DOptions.html.md`.
  `view3d.root` is the scene root; `view3d.addChild` throws (Lane A).
- `new Camera3D({ fov: 45, near: 0.1, far: 500 })`; `camera.mode = 'orthographic'`,
  `camera.orthographicSize = 4`; `Camera3D.defaultOptions.fov = 50`,
  `Camera3D.defaultOptions.far = 2000`.
  Source: `raw/api/scene.Camera3D.html.md:22-30, 1728-1730`.
- `new Material3D(options)`: `baseColor`, `baseColorTexture`, `roughness`, `metalness`,
  `alphaMode` (default `'opaque'`), `alphaCutoff`, `doubleSided`, `flatShading`,
  `extraBits`, `descriptor`, `textures`, `passes`, `uvTransform`, `vertexColors`, `fog`.
  Source: `raw/api/materials.BaseMaterial3DOptions.html.md`,
  `raw/api/materials.Material3DOptions.html.md`.
- `RenderPassBit`: `OPAQUE`, `TRANSPARENT`, `TRANSMISSION`, `SHADOW` (plus mesh-pass bits).
  Source: `raw/api/rendering.RenderPassBit.html.md`.
- `ContainerTexture` (2D-on-3D text path, troika replacement candidate): draws a live 2D
  PixiJS `Container` onto a 3D surface; `ContainerSource` is its texture source.
  Source: `raw/api/rendering.ContainerTexture.html.md`,
  `raw/guides/rendering.html.md`.
- `MAX_LIGHTS` = 32 lights per view; 16 shadow maps shared per view (Lane A limits 11–12,
  confirmed in `raw/api/scene.MAX_LIGHTS.html.md`).
