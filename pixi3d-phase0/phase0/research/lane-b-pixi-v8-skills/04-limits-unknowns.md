# Lane B — Limits and unknowns

> ERRATUM per independent review F9, 2026-11-12. Lane A resolved the npm versions from the registry API: @pixi/3d 0.1.0 with peer pixi.js ^8.23.0, pixi.js latest 8.23.0, recorded in Lane A 01-sources.md entries 7-8. The UNKNOWN entries in item 1 below refer to the npmjs.com UI fetch returning 403, not to the registry API. Distinguish npmjs.com UI failure from registry.npmjs.org API success. Pin @pixi/3d 0.1.0 and pixi.js 8.23.0, and re-verify at build time from the installed package.

## What was NOT verified

1. npm package metadata — UNKNOWN
   - `https://www.npmjs.com/package/pixi.js` returned HTTP 403 (access denied). No verified latest version, dependencies, unpacked size, or weekly downloads for `pixi.js` or `@pixi/3d` from npmjs.
   - Secondary search results conflict on bundle size and must NOT be quoted as fact: one source measured full `pixi.min.js` at 185 kB brotli (17 Oct 2026); another lists `pixi.min.js` 821.0 kB / `pixi.min.mjs` 821.6 kB for 8.22.0 (uncompressed release files, 2.4 MB `pixi.js`); a third says ~450 kB minified. These measure different artifacts (brotli vs minified vs uncompressed, full bundle vs tree-shaken). The masterspec must require a local build measurement (`vite build` + bundle report) instead of quoting any of these.
   - `@pixi/3d` npm version is UNKNOWN from npm. Docs pin v0.1.0 (`https://3d.pixijs.download/v0.1.0/docs/`). The blog says `@pixi/3d` needs `pixi.js` 8.23.0 or later. Whether the npm latest is 0.1.0, a beta tag, or newer was not verified.
   - `pixi.js` latest on npm is UNKNOWN from npm. Docs pin 8.23.0. A secondary source says the latest GitHub release as of 1 Oct 2026 was v8.22.0; that is secondary and stale relative to the 8.23.0 docs pin. Pin to 8.23.0 in the demo until a live `npm view pixi.js version` (or registry) check lands.

2. PixiJS v8 Application overview doc page — UNVERIFIED
   - `https://pixijs.download/v8.23.0/docs/app.html.md` timed out on fetch. Application surface in 02 is covered by the skill reference `application.md` and the llms.txt app section, not by the overview prose itself. If the masterspec needs the overview's exact wording, re-fetch that URL.

3. Masks — PARTIALLY COVERED
   - No standalone mask doc page was fetched. Mask behaviour in 02 comes from the pixijs skill pitfalls/router only: add a mask as a child of the masked Container; a Sprite mask reads the red channel unless `setMask({ mask, channel: 'alpha' })`; sub-pages under `scene-core-concepts` (`mask`, `setMask`, inverse, sprite-mask channel). The masterspec must instruct the coding agent to open `scene-core-concepts` masking sub-pages before writing mask code, and to verify with a rendered test.

4. Render graph (v8 2D) — UNKNOWN / TERMINOLOGY GAP
   - The v8 pages read use "systems / pipes / render targets", not a single RenderGraph API. The 3D docs use "How a frame renders" and `View3D#passes` / `Pass3D` / `RenderPassBit`. Do not write a masterspec requirement for a v8 2D "render graph" API without first fetching `https://pixijs.download/v8.23.0/docs/core-concepts-2.html.md` (Render Loop) and the 3D "How a frame renders" page, and naming the exact classes.
   - Rendering doc tail (lines 500–770) not read; it may contain render-graph / systems detail that would close this gap.

5. Skill reference subpages — NOT FETCHED (except application.md)
   - Only `skills/pixijs/references/application.md` was fetched in full. All other 2D topic files (`assets`, `events`, `filters`, `scene-container`, `scene-sprite`, `scene-text`, `performance`, `custom-rendering`, etc.) and all 3D recipe files (`scene-graph`, `materials`, `models-and-animation`, `post-processing`, `from-threejs`, etc.) are listed by name and trigger in 02/03, not summarised from their content. The masterspec must install the skills in the demo repo and require the coding agent to open them; it must not treat the router table as a substitute for the files.

6. llms.txt tails — NOT READ
   - `https://pixijs.com/llms.txt` lines 498–881 and `https://pixijs.com/3d/llms.txt` lines 262–554 were not read (fetch budget). Any API class not named in 02 may exist in those tails. The coding agent must consult llms.txt for uncovered signatures, per the skill's own instruction.

7. Performance / GC guides — NOT FETCHED
   - `core-concepts-6` (Garbage Collection) and `core-concepts-7` (Performance Tips) exist in llms.txt; content not fetched. Performance claims in 02 come from the skill router and the filters/ticker docs only. The demo needs a measured FPS / draw-call / memory check, not a quoted tip.

8. WebGPU default — CONFLICTING STATEMENTS, RESOLVED CONSERVATIVELY
   - v8 rendering doc: WebGL is default and Recommended; WebGPU is Experimental, feature-complete but browser inconsistencies may cause unexpected behaviour, use WebGL for production.
   - 3D blog: "WebGPU first", same code runs on WebGL2.
   - 3D skill: `app.init` uses WebGL unless `preference: 'webgpu'`.
   - Resolution for the demo: state the preference explicitly in `app.init`, test on both backends, and do not claim WebGPU is the production default. The masterspec must carry this as an open decision, not a settled fact.

9. `pixi.js` Canvas renderer — LIMITED COVERAGE
   - Canvas renderer is Experimental, skips filters, and draws nothing for `Mesh` (skill). No Canvas-renderer doc page was fetched. The demo should not rely on Canvas fallback for filtered or mesh content.

10. Examples / templates — NOT FETCHED
    - `npm create pixi.js@latest` templates, the `examples/` folder in pixijs-skills, and the 100+ live 3D examples / 35 guides cited in the blog were not fetched (budget). The masterspec must not name a specific template or example by content; it must instruct the agent to list templates from `npm create pixi.js@latest` at build time.

11. 3D docs version vs blog — NOTE
    - 3D llms.txt pins v0.1.0 while the blog announces an open beta on 2026-11-12. Whether v0.1.0 is the beta build or an earlier snapshot was not verified. Pin versions from the installed package at build time and record the installed version in the demo README.

## Limits of this lane

- Read-only research; no repo edits, no masterspec writing, no code run. No local `npm view`, `vite build`, or browser render was performed, so no bundle size, FPS, or visual claim in this lane is measured.
- Extracts in 03 are under 40% of any single source file by construction (short verbatim fragments plus paraphrase). Full skill files were NOT copied into this lane; the demo repo must install them via `npx skills add https://github.com/pixijs/pixijs-skills`.
- Fetch count: 24 (including 3 failed). Stop rule met. Any gap above needs a follow-up fetch lane, not a guess.
