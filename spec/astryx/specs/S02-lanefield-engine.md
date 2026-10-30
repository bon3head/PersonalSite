# S02 Lanefield engine: the 6,144-lane world

Version 1.0.0, 2026-10-30. Depends on: S00, DESIGN.md sections 1, 6, 8, 12 (`world`). Blocks: S03, S05, S06, S07, S08, S10, S11.

## 1. Purpose

One WebGL2 canvas, fixed behind the DOM, that draws all 6,144 lanes in one draw call and can morph them between four layouts (server, leaflink, sidequests, scatter) by changing four uniform weights. Scene specs add behavior on top (pulses, pins, trails); this spec owns the renderer, the data layout, the shaders, the clock, the camera, picking, the performance governor and failure handling. If this spec is built right, every scene is mostly a layout generator plus a little controller code.

## 2. Public API (TypeScript, `src/world/lanefield.ts`)

```ts
export type LayoutId = 'server' | 'leaflink' | 'sidequests' | 'scatter';
export type Regime = 'void' | 'paper' | 'field';

export interface Lanefield {
  ready: Promise<void>;                       // resolves after layouts uploaded, shaders compiled, first frame drawn
  travelTo(id: LayoutId, opts?: {instant?: boolean}): Promise<void>; // resolves when the 700ms travel ends (or immediately if instant)
  setReducedMotion(on: boolean): void;        // switches render loop to demand mode and freezes ambient motion
  setActivity(lanes: Int32Array, startSec: Float32Array, fadeAtSec: Float32Array, kind: 1 | 2, uPerSec: Float32Array): void; // S06 routes, S07 trails
  clearActivity(kind?: 1 | 2): void;
  now(): number;                              // world clock in seconds (the only clock; scene controllers use it)
  screenToGround(xCss: number, yCss: number): [number, number] | null; // ray to plane y=0, world xz
  worldToScreen(p: [number, number, number]): [number, number];         // CSS px
  onFrame(cb: (tSec: number, dtSec: number) => void): () => void;       // scene controllers tick here
  scene: THREE.Scene; camera: THREE.PerspectiveCamera;                  // controllers add pins, markers, words
  dispose(): void;
}
export function createLanefield(mount: HTMLElement, opts: {seed: number; reducedMotion: boolean; initial: LayoutId}): Lanefield | null; // null when WebGL2 is unavailable
```

Expose a read-only debug view on `window.__lanefield` in every build (tests depend on it): `{laneCount, layoutHash: string (SHA-256 hex of the layout Float32Array), weights(): number[4], cameraPose(): {pos, target, fov, shift}, info(): {calls, triangles, textures, geometries}, frameStats(): {p50, p90, p95, count}, dpr(): number, memoryEstimate(): number (MB, method in S11 section 4), ready: boolean}`.

## 3. Renderer setup

```ts
const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', premultipliedAlpha: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(groundColorForRegime, 1);
```

- Canvas: `position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 0`. The DOM sits above at z-index 1.
- Pixel ratio: `Math.min(devicePixelRatio, T.world.dprCap.fine or .coarse) * governorScale`, floor `T.world.dprCap.floor`.
- No post-processing. No bloom, no vignette, no grain. Light comes from lane density and pulses (DESIGN section 3.3, no glow without a source).
- Clear color is lerped per frame from the regime grounds by the same weights as the lanes, using the plain-ease curve over the travel duration (S03 section 4), never expo-out (a dark-to-paper flip under expo-out flashes).

## 4. Data layout

### 4.1 Layout texture

- `DataTexture(Float32Array(256 * 768 * 4), 256, 768, THREE.RGBAFormat, THREE.FloatType)`, `NearestFilter`, no mipmaps, `flipY false`, `needsUpdate` once.
- Texel index for lane `i` (0 to 6143), layout `l` (0 server, 1 leaflink, 2 sidequests, 3 scatter), point `k` (0 to 7): `idx = i * 32 + l * 8 + k`; texel `(idx & 255, idx >> 8)`.
- RGB: world position of the point. A: the lane's class id in that layout (same value at all 8 points).
- Class ids (global): 0 server.lane, 1 server.converge, 2 leaflink.local, 3 leaflink.arterial, 4 sq.grid, 5 sq.outline, 6 sq.hatch, 7 sq.walkway, 8 sq.trail, 9 scatter.lane. Activity overrides: 10 leaflink.route, 11 sq.trailLit.
- Style uniforms built from DESIGN classes: `uClassStyle[16]` vec2 (widthPx, alpha) and `uClassColor[16]` vec3 (linear RGB). Class colors: 0 and 1 signal; 2, 3, 10 ink; 4 to 8 chalk; 11 chalk core with signal rim (fragment, section 5.3); 9 signalDim.

### 4.2 Activity texture

`DataTexture(Float32Array(256 * 24 * 4))`, one texel per lane at `(i & 255, i >> 8)`. R start time (s), G fade-start time (s), B kind (0 none, 1 route, 2 trailLit), A reveal rate in lane-u per second (negative means the path runs from u=1 toward u=0). `setActivity` writes texels and sets `needsUpdate = true` once per call (a 98 KB upload, at most a few times per second).

### 4.3 Geometry

`InstancedBufferGeometry` with a 4-vertex quad: `position` attribute `(0,-1,0) (1,-1,0) (0,1,0) (1,1,0)`, index `[0,1,2, 2,1,3]`. Instance attribute `aSeg` (`InstancedBufferAttribute(Float32Array(43008 * 2), 2)`): for instance `n`, `aSeg = (lane = floor(n / 7), k = n % 7)`. `instanceCount = 43008`. `frustumCulled = false`.

### 4.4 Layout generation (Web Worker)

`src/world/worker.ts` generates all four layouts into one transferable `Float32Array` and posts it with any per-scene side data (LeafLink graph, SideQuests marker positions and trail lane lists). It uses the seeded PRNG below and nothing else for randomness. Generators are specified in S05 (server), S06 (leaflink), S07 (sidequests), S08 (scatter). Every generator must emit exactly 6,144 lanes of 8 points; the worker asserts this and posts an error otherwise (the world then fails closed to the poster, S10).

```ts
// mulberry32, verbatim. The only RNG in src/world.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Each layout gets its own stream: `rng(T.world.seed + layoutIndex * 1000003)`.

## 5. Shaders (GLSL ES 3.00, `THREE.ShaderMaterial` with `glslVersion: THREE.GLSL3`)

Material: `transparent: true`, `depthTest: false`, `depthWrite: false`, `blending: THREE.CustomBlending`, `blendSrc: THREE.OneFactor`, `blendDst: THREE.OneMinusSrcAlphaFactor`, `premultipliedAlpha: true`. Three injects `projectionMatrix`, `modelViewMatrix`, `position` for `ShaderMaterial`.

### 5.1 `lane.vert.glsl`

```glsl
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 aSeg;                 // (lane, k)
uniform sampler2D uLayouts;
uniform sampler2D uActivity;
uniform vec4 uW;              // layout weights, sum 1
uniform vec2 uViewport;       // drawing buffer size, device px
uniform float uDpr;
uniform float uTime;
uniform vec2 uClassStyle[16]; // widthPx (CSS), alpha
uniform vec3 uClassColor[16];
uniform vec2 uFog;            // view-depth fade [start, end], server and scatter only

out float vSide;
out float vHalf;
out float vU;
out vec3 vColor;
out float vAlpha;
flat out int vLane;
flat out int vKind;
flat out vec4 vAct;

vec4 pt(int lane, int lay, int k) {          // 'layout' is a GLSL keyword
  int idx = lane * 32 + lay * 8 + k;
  return texelFetch(uLayouts, ivec2(idx & 255, idx >> 8), 0);
}

void main() {
  int lane = int(aSeg.x + 0.5);
  int k = int(aSeg.y + 0.5);
  vec3 p0 = vec3(0.0); vec3 p1 = vec3(0.0);
  float widthCss = 0.0; float alpha = 0.0; vec3 color = vec3(0.0);
  for (int l = 0; l < 4; l++) {
    float w = uW[l];
    if (w <= 0.0) continue;
    vec4 a = pt(lane, l, k);
    vec4 b = pt(lane, l, k + 1);
    p0 += w * a.xyz; p1 += w * b.xyz;
    int cls = int(a.w + 0.5);
    widthCss += w * uClassStyle[cls].x;
    alpha    += w * uClassStyle[cls].y;
    color    += w * uClassColor[cls];
  }

  vec4 act = texelFetch(uActivity, ivec2(lane & 255, lane >> 8), 0);
  int kind = int(act.b + 0.5);
  if (kind > 0 && uTime >= act.r) {
    int cls = kind == 1 ? 10 : 11;
    float on = kind == 1 ? uW.y : uW.z;          // routes exist only in leaflink, trails only in sidequests
    widthCss = mix(widthCss, uClassStyle[cls].x, on);
  }

  vec4 c0 = projectionMatrix * modelViewMatrix * vec4(p0, 1.0);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p1, 1.0);
  if (c0.w < 0.01 || c1.w < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

  vec2 s0 = c0.xy / c0.w * 0.5 * uViewport;
  vec2 s1 = c1.xy / c1.w * 0.5 * uViewport;
  vec2 d = s1 - s0;
  float len = length(d);
  vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);

  float wDev = widthCss * uDpr;
  float drawW = max(wDev, 1.0);                  // never thinner than 1 device px
  float coverage = min(wDev, 1.0);               // sub-pixel lanes fade instead of shimmer
  float halfW = drawW * 0.5;                     // 'half' is reserved in GLSL ES
  float ext = halfW + 1.0;                        // 1px feather for analytic AA

  vec4 c = mix(c0, c1, position.x);
  c.xy += nrm * position.y * ext / (0.5 * uViewport) * c.w;
  gl_Position = c;

  vSide = position.y * ext;
  vHalf = halfW;
  vU = (float(k) + position.x) / 7.0;
  vColor = color;
  float depth = mix(c0.w, c1.w, position.x);
  float fogAmt = smoothstep(uFog.x, uFog.y, depth) * (uW.x + uW.w);
  vAlpha = alpha * coverage * (1.0 - fogAmt);
  vLane = lane;
  vKind = kind;
  vAct = act;
}
```

### 5.2 `lane.frag.glsl`

```glsl
precision highp float;
precision highp int;

in float vSide; in float vHalf; in float vU; in vec3 vColor; in float vAlpha;
flat in int vLane; flat in int vKind; flat in vec4 vAct;

uniform float uTime;
uniform vec4 uW;
uniform vec3 uHot;            // signalHot, linear
uniform vec3 uRouteColor;     // ink, linear
uniform vec3 uTrailCore;      // chalk, linear
uniform vec3 uTrailRim;       // signal, linear
uniform vec2 uFirePeriod;     // seconds [min, max]
uniform float uFireDuty, uFireSpeed, uFireSigma, uSweepPeriod, uFirePeak;
uniform float uFadeSec;
uniform float uFrozen;        // 1.0 under reduced motion: pulses at fixed phases

out vec4 outColor;

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

float fire(int lane, float u, float t) {
  float warp = float(lane >> 5);
  float sm = float(lane >> 7);
  float h = hash11(warp * 17.0 + 3.0);
  float period = mix(uFirePeriod.x, uFirePeriod.y, h);
  float phase = fract(t / period + h);
  float occ = step(phase, uFireDuty);            // 'active' is reserved in GLSL ES
  float sweep = 0.5 + 0.5 * sin(6.2831853 * (t / uSweepPeriod - mod(sm, 8.0) / 8.0));
  float head = fract(t * uFireSpeed + hash11(warp + 101.0));
  float dd = u - head; dd -= floor(dd + 0.5);
  float pulse = exp(-(dd * dd) / (uFireSigma * uFireSigma));
  return occ * pulse * (0.55 + 0.45 * sweep);
}

void main() {
  float edge = 1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vSide));
  vec3 col = vColor;
  float a = vAlpha;

  if (uW.x > 0.0) {                              // server pulses, weighted out in other layouts
    float t = uFrozen > 0.5 ? 0.0 : uTime;
    float f = fire(vLane, vU, t) * uW.x;
    col = mix(col, uHot, f);
    a = mix(a, uFirePeak, f);
  }

  if (vKind > 0 && uTime >= vAct.r) {            // routes (1) and lit trails (2)
    float rate = vAct.a;
    float travelled = (uTime - vAct.r) * abs(rate);
    float along = rate >= 0.0 ? vU : 1.0 - vU;
    float shown = step(along, travelled);
    float fade = vAct.g > 0.0 ? 1.0 - clamp((uTime - vAct.g) / uFadeSec, 0.0, 1.0) : 1.0;
    float on = (vKind == 1 ? uW.y : uW.z) * shown * fade;
    vec3 target = vKind == 1 ? uRouteColor : mix(uTrailRim, uTrailCore, edge);
    col = mix(col, target, on);
    a = mix(a, 1.0, on);
  }

  a *= edge;
  if (a < 0.003) discard;
  outColor = vec4(col * a, a);
}
```

Color uniforms are raw sRGB components, not linearized: `new THREE.Vector3(r / 255, g / 255, b / 255)` from the DESIGN hex. `ShaderMaterial` output is not color-managed, so writing sRGB values and blending them in sRGB makes the canvas match CSS colors exactly (the clear color, set with `setClearColor(hex)`, is converted by three and reads back as the exact ground hex). Do not pass `THREE.Color` objects to these uniforms: they hold linear values and the lanes come out dark and oversaturated (seen in the verification render).

**Verified 2026-10-30:** both shaders compiled and rendered the server layout with zero errors in Chromium (SwiftShader WebGL2) with three 0.186.1, one draw call, 43,008 instances. Two GLSL ES reserved words (`layout`, `active`) in the first draft were caught there and renamed.

## 6. Clock and render loop

- One clock: `now() = (performance.now() - t0) / 1000`. `uTime` is set from it each frame. Scene controllers read `now()` for activity timestamps so shader and CPU agree.
- Loop: `requestAnimationFrame`. Each frame: compute `dt`, run travel tween, camera, `onFrame` callbacks, update uniforms, render. No allocation inside the frame (preallocate vectors).
- `document.visibilitychange` hidden: stop the loop; visible: restart and reset `dt` to avoid a jump.
- Reduced motion: demand mode. Render once after `ready`, after each `travelTo`, on resize, and on interaction callbacks. `uFrozen = 1`.
- Shaders: compile every material at init with `await renderer.compileAsync(scene, camera)` before the first visible frame, including pins, markers and the troika text material (add one hidden instance of each so it compiles). Nothing compiles during travel or interaction (G-PERF checks `renderer.info.programs.length` is constant after `ready`).

## 7. Tween, spring, damp (`src/world/tween.ts`, verbatim)

```ts
// Cubic bezier solver (same method as WebKit UnitBezier). Returns y for x in [0,1].
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) return sy(t); const d = dsx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    while (hi - lo > 1e-6) { const v = sx(t); if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}
export const easeSignature = cubicBezier(...T.motion.easeSignature);  // expo-out
export const easePlain = cubicBezier(...T.motion.easePlainBezier);     // CSS 'ease' as a curve, for WebGL-side values

// Underdamped spring step response, 0 -> 1. zeta < 1.
export function spring(zeta: number, freqHz: number) {
  const w = 2 * Math.PI * freqHz, wd = w * Math.sqrt(1 - zeta * zeta), k = zeta / Math.sqrt(1 - zeta * zeta);
  return (tSec: number) => 1 - Math.exp(-zeta * w * tSec) * (Math.cos(wd * tSec) + k * Math.sin(wd * tSec));
}

// Frame-rate independent exponential smoothing toward target.
export function damp(current: number, target: number, halfLifeMs: number, dtMs: number) {
  return target + (current - target) * Math.pow(2, -dtMs / halfLifeMs);
}
```

Test: `easeSignature(0.3)` is between 0.80 and 0.86 (this is what puts 80% of travel inside the first 210ms of 700ms). `spring(0.7, 3.2)` peaks between 1.040 and 1.052 and is within 0.01 of 1 after 0.6s.

## 8. Camera (`src/world/camera.ts`)

- Pose `{pos, target, fovDeg, shiftNdc}` from `T.world.camera[layout][variant]`, variant `coarse` when `innerWidth < T.breakpoints.coarseOrNarrowBelowPx`, or when `(pointer: coarse)` matches and `innerWidth < T.breakpoints.desktopFromPx`; otherwise `fine`. Re-evaluate on resize and orientation change.
- Principal point shift (puts the subject beside the readout without cropping): after `camera.updateProjectionMatrix()`, set `camera.projectionMatrix.elements[8] = -shift[0]; camera.projectionMatrix.elements[9] = -shift[1]; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();`. Positive `shift[0]` moves the image right in NDC.
- Travel: pose components lerp by `easeSignature(t)`; fov and shift too.
- Idle yaw: rotate `pos` about the vertical axis through `target` by `idleYawDeg * sin(2 pi t / idleYawPeriodSec)` for the active layout (weights blend the yaw amplitude during travel). LeafLink uses `leaflinkDrift` instead: translate pos and target together by `(amp.x sin(2 pi t/P), 0, amp.y sin(2 pi t/P * 0.7))`. Off under reduced motion.
- Pointer parallax (fine pointer only, off under reduced motion): yaw and pitch offsets up to `parallaxDeg` from pointer NDC, smoothed with `damp(..., parallaxDampHalfLifeMs)`.

## 9. Picking

- `screenToGround`: unproject a ray from CSS px through the camera (account for the shift by using `projectionMatrixInverse`), intersect plane y = 0.
- `worldToScreen`: project with the shifted matrix to CSS px.
- Markers and pins are hit-tested in screen space: hit if the pointer is within `marker.hitRadiusPx` (22px, so a 44px target) of the projected center. No GPU picking. No raycasting against lane geometry.

## 10. Performance governor (`src/world/governor.ts`)

- Keep a ring buffer of frame `dt` over `governor.sampleWindowMs`. Every window: if p90 is above `stepDownAboveMs`, reduce the DPR scale by `dprStep`, never below `dprCap.floor`. If p90 stays under `stepUpBelowMs` for `stepUpAfterMs`, raise by one step up to the cap.
- Lane count never changes. Classes never drop. The only quality lever is resolution. This keeps the anti-template invariant true on every device.
- `?perf=1` shows a monospace HUD in the top-right (fps, p90 ms, dpr, calls) and records `frameStats` to `window.__lanefield`; `?perf=1&dump=1` downloads a JSON of the last 600 frames.

## 11. Failure handling

- WebGL2 missing (`canvas.getContext('webgl2')` is null) or `?world=0`: `createLanefield` returns null; S10 shows the poster and C-NOGL.
- Worker error or lane-count assertion failure: same as missing WebGL2, and `console.error('[lanefield] layout failed', detail)`.
- `webglcontextlost`: `preventDefault()`, stop loop, show the poster under the canvas. `webglcontextrestored`: re-upload textures from the cached Float32Arrays, recompile, resume. Test with `WEBGL_lose_context`.
- `dispose()`: dispose geometry, material, textures, troika text, renderer; remove listeners; terminate worker. The site never disposes in normal use (one world for the whole visit); `dispose` exists for tests and HMR.

## 12. Kill criteria

- K-S02-1: lane count anything other than 6144, or more than one draw call for lanes.
- K-S02-2: any frame allocates (Chrome performance profile shows minor GC during a 10s idle on Server).
- K-S02-3: a shader program is compiled after `ready`.
- K-S02-4: lanes shimmer or crawl when the camera idles (sub-pixel handling broken): reviewer watches 10s of Server at 1x DPR.
- K-S02-5: any main-thread task over 50ms during startup or travel (long-task observer, S11).
- K-S02-6: the field reads as a circuit board to a reviewer who has not seen the PCB versions (blind check in S11).

## 13. Receipts

| Test | Claim | How |
|---|---|---|
| T-S02-1 | 6,144 lanes, one call | `__lanefield.laneCount === 6144`; temporarily hide pins, markers and words via `?debug=lanesOnly`, then `info().calls === 1` |
| T-S02-2 | Deterministic layouts | `layoutHash` identical across two fresh loads and across Chromium and WebKit |
| T-S02-3 | Weights sum to 1 at every frame of a travel | sample `weights()` each rAF during `travelTo`; `abs(sum - 1) < 1e-4` |
| T-S02-4 | Easing math | unit tests of section 7 numbers |
| T-S02-5 | Principal shift | on Server fine pose, `worldToScreen(focus)` x is within 2% of `0.5 + shift/2` of viewport width (66%) |
| T-S02-6 | No compile after ready | `renderer.info.programs.length` unchanged across 3 full travels |
| T-S02-7 | Context loss recovers | lose and restore context, `layoutHash` unchanged, frame renders, no console error except the one expected warning |
| T-S02-8 | Startup off the main thread | long tasks during `ready` all under 50ms (PerformanceObserver `longtask`) |

## 14. Unknowns

U-S02-1: real-device frame times (Justin's phone) are not measurable from a cloud runner; S11 G-PERF-DEVICE needs one manual run. U-S02-2: troika `BatchedText` availability in 0.52.5; if absent, the six word meshes cost six draw calls (still inside `drawCallsMax` 12).

## 15. Changelog

- 1.0.0, 2026-10-30: initial.
