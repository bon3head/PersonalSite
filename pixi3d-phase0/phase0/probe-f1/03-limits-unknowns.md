# Lane F1 — Limits and unknowns

## What was NOT verified
1. WebGPU backend: not run. SwiftShader has no WebGPU. The ShaderBit WGSL code is present but unexecuted on WebGPU. Backend selection stays open per OPEN-DECISIONS.md D4.
2. Real-device performance: SwiftShader frame time, about 11.9ms per frame for 10 renders, is not a device claim. Real-phone p95 frame time is unmeasured; see MEASUREMENT-PROTOCOL.md.
3. iPhone Safari and the S00 iPhone WebGPU buffer limits: unmeasured.
4. Off-center projection: ABSENT in the API, no workaround proven. The masterspec must either re-derive poses without a shift, emulate it by rendering into a larger view and cropping, unproven, or confirm with the vendor that no hook exists.
5. Shader warmup: ABSENT as a public API. No precompile path exists in 0.1.0; first-frame compile cost is unmeasured.
6. Renderer statistics: no renderer.info equivalent. The __lanefield debug contract must be re-specified around captureGraphDebugSnapshot data or dropped, per 01 section 7.
7. ContainerTexture as the troika replacement: API verified in 01, not exercised in the probe. Per-glyph lane-tip coupling is not demonstrated.
8. The 62-commit span in Lane C remains not fully read, per Lane C 05 unknown 23. The probe does not close it.
9. Bundle comparison against the full current site: the probe bundle, 1.2M raw, 343 KiB gzip total, is a minimal probe, not the site. No budget verdict is drawn.

## Limits of this lane
- The probe agent was interrupted after writing 01-api-verification.md and the probe artifacts, before writing 02 and 03. A resumed agent stalled in pending_init with no new output for over 13 minutes and was closed. 02 and 03 were written by the coordinator from the agent's completed run artifacts, probe-dom.html and probe-screenshot.png, and verified by an independent re-run that reproduced the pixel counts exactly.
- Probe-src layout fix: main.ts moved to src/main.ts to match index.html. No code changed.
- node_modules and dist were removed after the re-run to keep the committed pool clean. Bundle sizes are recorded in 02 from the measured build.
