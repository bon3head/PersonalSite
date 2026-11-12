# Lane F1 — Probe results: minimal Vite probe, PixiJS 3D v0.1.0

- Date: 2026-11-12, agent run 17:29 EST, independent re-run 17:45 EST
- Versions: pixi.js 8.23.0, @pixi/3d 0.1.0, vite 6.4.6, typescript 5.9.2, bun 1.4.4 install
- Probe source: probe-src/src/main.ts (moved from probe-src/main.ts by the re-run; index.html references /src/main.ts, the saved root-level file did not build. Standard Vite layout, no code change.)
- Render path: WebGL2, headless Chromium, SwiftShader. No WebGPU in this environment.

## Reproduction
- Agent run, 17:29: probe-dom.html contains the full probe-result JSON, probe-screenshot.png shows the 10x10 cube grid.
- Independent re-run, 17:45: bun install, vite build, tsc --noEmit exit 0, Playwright headless render. Results reproduced exactly, pixel counts identical. Rerun screenshot: probe-screenshot-rerun.png.
- Build artifact hash match: dist index chunk index-U0AuYtK9.js, 632,212 B, identical filename and size in both runs.

## Results, all 10 steps
| Mechanism | Verdict | Detail |
|---|---|---|
| app.init webgl | PASS | renderer type 1 |
| View3D + Camera3D | PASS | new View3D({width,height,camera}), added to app.stage |
| RGBA32F texture | PASS | BufferImageSource Float32Array 256x24, format rgba32float |
| BatchedMesh3D + per-instance attributes | PASS | size 100, setMatrixAt x100, setInstanceDataAt x100, instanceData stride 4, fields {"tint":0}, update() ok |
| warmup / precompile | ABSENT | No public warmup API in 0.1.0 docs or dist/index.d.ts; compileShader is @internal, returns shader source text, not a GPU program |
| off-center projection | ABSENT | No shift/offset in Camera3DOptions; projection readonly Matrix4; computeProjection recomputes from fov/near/far/mode only |
| renderer statistics | PASS | No renderer.info equivalent; programmatic stats path is GraphDebugOverlay / captureGraphDebugSnapshot, extras, debug-only |
| render 10 frames | PASS | Agent run: 10 renders in 0.0ms, 34,397/230,400 pixels lit, 31,371 reddish. Re-run: 10 renders in 118.9ms, same pixel counts exactly. The agent 0.0ms is timer granularity, not a frame-time claim; 118.9ms is the credible number, about 11.9ms per frame in SwiftShader. |
| batch alone, custom ShaderBit | PASS | 28,149/230,400 pixels lit, 24,967 reddish. Custom bit draws. |
| batch alone, stock material | PASS | 28,025/230,400 pixels lit, 0 reddish. Control isolation holds: stock batch draws white, custom-bit batch draws tinted. |

- Console entries: 0 in both runs. Page warnings in re-run only: GPU stall due to ReadPixels, expected from the readback itself.
- Verdict counts: 8 PASS, 2 ABSENT, 0 FAIL.

## Bundle, measured
- dist total 1.2M, 17 JS chunks. Total gzip 351,485 B, about 343 KiB, all chunks.
- Index chunk 632,212 B raw, 187 kB gzip. Largest other chunks: CanvasRenderer 91,973 B, WebGLRenderer 76,468 B, RenderTargetSystem 70,105 B, WebGPURenderer 60,731 B.
- Chunk-size warning: index chunk over 500 kB after minification. Vite suggests dynamic import or manualChunks.
- Comparison to the current world budget T.budgets.worldChunkGzKb 220: the probe is not the full site, so no budget verdict is drawn here. The full comparison runs under MEASUREMENT-PROTOCOL.md.

## What the probe proves
- BatchedMesh3D with per-instance vec4 tint, custom ShaderBit with WGSL and GLSL, RGBA32F layout texture read in the vertex stage, and View3D plus Camera3D all work on WebGL2 in this build.
- The setPassesAt trap from 01 is real: a slot in no pass draws nothing with no error. The probe calls setPassesAt on every slot.

## What the probe does not prove
- WebGPU path: not run here, SwiftShader has no WebGPU. WGSL code is present in the ShaderBit but was not executed on a WebGPU backend.
- Real-device frame time, iPhone Safari behavior, and the S00 iPhone WebGPU buffer-limit question: unmeasured.
- Troika replacement at full fidelity: ContainerTexture was verified as an API in 01, not exercised in this probe.
- The off-center projection workaround: none proven. Rendering into a larger view and cropping is unproven, not attempted.
