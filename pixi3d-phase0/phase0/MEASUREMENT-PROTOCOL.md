# Measurement protocol, per review F7

Purpose: turn the unmeasured Pixi-versus-Three bundle, Lighthouse, frame-time, draw-call, and GPU-memory gap into a testable gate. Protocol only; measurements are not yet run.

## Baseline
- Controlled baseline: live HEAD 2d75332, production build, same content and hosting as the probe. No content changes between baseline and probe runs.

## Probe
- Pinned Pixi probe: pixi.js 8.23.0, @pixi/3d 0.1.0, same shelf content as baseline, same hosting.

## Bundle
- Raw, minified, and gzip sizes per chunk, with attribution: pixi.js, @pixi/3d, text solution, world chunk, HUD chunk. Use vite build output plus a bundle report. Compare against budget T.budgets.worldChunkGzKb 220, re-recorded after measurement.

## Lighthouse
- Repeated cold runs, at least 3 per variant, same configuration, same device profile. Record performance, accessibility, best practices, SEO, and the exact Lighthouse version and throttling settings. Report median and range, not a single run.

## Runtime
- Backend and browser matrix: WebGL2 and WebGPU where available, Chrome and Safari, desktop and real phone. Record p95 frame time, draw calls, triangles, textures, geometries, GPU memory estimate, and the __lanefield debug contract values or their Pixi-backed equivalents.

## Acceptance
- Delta and budget acceptance criteria must be stated before the probe runs: bundle delta limit, Lighthouse performance floor, p95 frame-time ceiling on the real phone, and draw-call ceiling. A masterspec gate that does not state these numbers in advance is not testable.
