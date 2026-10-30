# 404 scene hue measurement (S08, G-HUE method)

Method: DESIGN 3.3 (screenshot, count pixels with OKLCH chroma above
0.04). Script: `measure-hue.mjs` (CDP screenshot, dependency-free PNG
decode, sRGB to OKLCH chroma). Viewport 1280x800, real world, direct
load of /nope, screenshot after world ready plus 3s of frames.

Result (2026-10-30, Chromium/SwiftShader):

- Screenshot 1280x800 (1,024,000 px)
- Hue pixels (chroma > 0.04): 1,795
- Hue pct: 0.175%

Budget status: DESIGN `hueBudgetPct` has no scatter entry and S08
sets no numeric budget, so there is no scatter budget to pass or
fail. For reference, the measured 0.175% sits below every existing
scene budget: server 30% (the other void-regime, lane-subject scene),
leaflink 10%, sidequests signal 6%. The scene passes any plausible
scatter budget. Recommendation for the coordinator: add a scatter
entry to `hueBudgetPct` (a 6% ceiling, matching the strictest scene
budget, would still leave 30x headroom) rather than leaving the
criterion unmeasurable for future runs.

Note: Playwright's screenshot waits for page stability, which never
comes with a continuously rendering WebGL canvas on SwiftShader, so
the script captures via CDP Page.captureScreenshot instead.
