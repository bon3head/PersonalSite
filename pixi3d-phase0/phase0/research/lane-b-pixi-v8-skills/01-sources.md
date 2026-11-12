# Lane B — Sources

Scope: PixiJS v8 2D core and agent-skills surface. Read-only research, 2026-11-12.
Fetch budget: 24 fetches used (including 3 failed fetches). Stop rule in brief met.

## Primary sources fetched — VERIFIED

1. PixiJS blog, PixiJS 3D open beta — https://pixijs.com/blog/pixi-3d-open-beta
   - Status: fetched in parent context, 2026-11-12. Published 2026-11-12. Open beta, MIT, `npm install pixi.js @pixi/3d`, requires `pixi.js` 8.23.0 or later.
2. PixiJS 3D landing — https://pixijs.com/3d
   - Status: fetched. glTF 2.0, lights up to 32 per view, post-processing, PBR, particles, BatchedMesh3D, OrbitCamera / FPSCamera, toon / Phong / flat.
3. PixiJS Skills landing — https://pixijs.com/llms
   - Status: fetched. Install: `npx skills add https://github.com/pixijs/pixijs-skills`. One skill each for 2D and 3D, 40+ agents supported, official and maintained, updated alongside the library.
4. PixiJS llms.txt (v8.23.0) — https://pixijs.com/llms.txt — 881 lines
   - Status: fetched, lines 0–497 read in two passes. Index of every v8 guide and API page, regenerated on each release. Each entry links to a Markdown copy.
   - Sections confirmed: core-concepts, accessibility, app, assets, color, environment, events, extensions, filters, maths, rendering, scene, text, gif, ticker, utils, migrations, Optional.
5. PixiJS 3D llms.txt (v0.1.0) — https://pixijs.com/3d/llms.txt — 554 lines
   - Status: fetched, lines 0–261 read. Index for `@pixi/3d` v0.1.0 docs at `https://3d.pixijs.download/v0.1.0/docs/`.
   - Sections confirmed: getting-started, core-concepts, scene, materials, environment, assets, animation, events, rendering, extras:post-processing, extras:particles, maths.
6. pixijs-skills repo — https://github.com/pixijs/pixijs-skills
   - Status: fetched. Public, default branch main, commit `93784384269b1d8677fb2ae166c81d750cba4281`, 10 commits, 368 stars, 21 forks, MIT License, created 2026-04-01. No releases, no tags at fetch time.
   - Structure: `skills/pixijs/SKILL.md` + `references/`, `skills/pixijs-3d/SKILL.md` + `references/`, `examples/`, `assets/`, `.claude-plugin/`, `.cursor-plugin/`, `AGENTS.md` / `CLAUDE.md` symlink, `LICENSE`, `README.md`.
   - Install paths: `npx skills add https://github.com/pixijs/pixijs-skills` (recommended, 40+ agents); Claude Code `/plugin marketplace add pixijs/pixijs-skills`; Cursor Settings → Rules → Add Rule → Remote Rule (Github) `pixijs/pixijs-skills`; clone/copy into `~/.claude/skills/`, `~/.cursor/skills/`, `~/.config/opencode/skills/`, `~/.codex/skills/`, `~/.pi/agent/skills/`.
   - Sync note: each skill is synced from its library repo on each release; content issues/PRs go to `pixijs/pixijs` (2D) and `pixijs/3d` (3D).
7. `skills/pixijs/SKILL.md` — https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/SKILL.md — 368 lines, MIT
   - Status: fetched in full (lines 0–234, 234–368). Router skill: list router rows touched, read each topic file before writing that part, then check pitfalls. See 03-skill-extracts.md.
8. `skills/pixijs-3d/SKILL.md` — https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs-3d/SKILL.md — 467 lines, MIT
   - Status: fetched in full (lines 0–318, 318–467). Mental model, complete starting app, conventions, silent pitfalls, recipe table, Three.js name map. See 03-skill-extracts.md.
9. `skills/pixijs/references/application.md` — https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/references/application.md — 262 lines
   - Status: fetched in full. Lifecycle, ResizePlugin, resolution-after-init, render loop, CullerPlugin, custom Application plugins.
10. PixiJS v8 docs, Assets overview — https://pixijs.download/v8.23.0/docs/assets.html.md — 444 lines
    - Status: fetched in full. Supported types, `Assets.load`, aliases, bundles, background loading, load strategies (`throw` / `skip` / `retry`, retryCount 3, retryDelay 250 ms), cache management.
11. PixiJS v8 docs, Events overview — https://pixijs.download/v8.23.0/docs/events.html.md — 499 lines
    - Status: fetched in full. Federated events, eventMode table, pointer/mouse/touch event lists, global move events, hit testing, capture phase, cursor management, performance tips.
12. PixiJS v8 docs, Filters overview — https://pixijs.download/v8.23.0/docs/filters.html.md — 590 lines
    - Status: fetched in full. Five built-in filters, advanced blend modes, custom `Filter.from` GLSL ES 3.0, filter options, performance.
13. PixiJS v8 docs, Ticker overview — https://pixijs.download/v8.23.0/docs/ticker.html.md — 288 lines
    - Status: fetched in full. `add` / `addOnce` / `remove`, start/stop, UPDATE_PRIORITY (HIGH 50, NORMAL 0, LOW -50), minFPS / maxFPS, speed, deltaTime / deltaMS / elapsedMS / FPS, `Ticker.shared`, cleanup.
14. PixiJS v8 docs, Scene Graph — https://pixijs.download/v8.23.0/docs/core-concepts-1.html.md — 160 lines
    - Status: fetched in full. Tree, parent/child inheritance, render order, RenderGroups, culling (`cullable`, `cullArea`), local vs global vs screen coordinates, `toGlobal` / `toLocal`.
15. PixiJS v8 docs, Container — https://pixijs.download/v8.23.0/docs/scene-1.html.md — 292 lines
    - Status: fetched in full. Children management, `reparentChild`, lifecycle events, `getChildByLabel`, `zIndex` / `sortableChildren`, render groups (`isRenderGroup`), `cacheAsTexture`.
16. PixiJS v8 docs, Sprite — https://pixijs.download/v8.23.0/docs/scene-3.html.md — 89 lines
    - Status: fetched in full. Single image/texture, anchor, scale vs width/height, texture swap.
17. PixiJS v8 docs, Text — https://pixijs.download/v8.23.0/docs/scene-10.html.md — 249 lines
    - Status: fetched in full. `Text` vs `BitmapText` vs `HTMLText`, decision guide, performance comparison, `SplitText`.
18. PixiJS v8 docs, Rendering — https://pixijs.download/v8.23.0/docs/rendering.html.md — 770 lines, lines 0–499 read
    - Status: fetched, partial (first 499 lines). Renderer types, `autoDetectRenderer`, `render()`, resize, `generateTexture`, mip levels, layers/slices, flipY, RenderTargets, multiple color attachments, depth-only targets, binding targets, copying between targets.
19. Web search — PixiJS v8 Application / Assets / stage / container / ticker documentation
    - Status: search only, not a primary source. Corroborated async-init gotcha, `Assets.load` before sprite creation, ticker `deltaTime`, WebGL default since v8.1.0. Secondary sources in results are NOT cited as primary evidence in 02/03.
20. Web search — npm `pixi.js` 8.23.0 / `@pixi/3d` version, dependencies, bundle size
    - Status: search only, inconclusive. See 04-limits-unknowns.md. No verified npm metadata obtained.

## Failed / not obtained

- https://pixijs.com/docs — HTTP 404. Do not use. Correct entry is `https://pixijs.com/llms.txt` and `https://pixijs.download/v8.23.0/docs/`.
- https://pixijs.download/v8.23.0/docs/app.html.md — fetch timed out (upstream fetch failed, no HTTP status). Covered instead by skill `references/application.md` (source 9) and the llms.txt app section. App-overview prose itself remains UNVERIFIED from the primary doc page.
- https://www.npmjs.com/package/pixi.js — HTTP 403 access denied. npm package metadata (exact latest version, dependencies, unpacked size, weekly downloads) NOT verified. Do not quote npmjs figures.
- https://pixijs.com/llms.txt lines 498–881 — not read (budget). Contains remaining Optional / API entries. Index structure above line 497 is verified; tail is not.
- https://pixijs.download/v8.23.0/docs/rendering.html.md lines 500–770 — not read. Render-graph / systems detail in the tail is not covered.
- https://pixijs.com/3d/llms.txt lines 262–554 — not read. Tail (maths API, remaining extras) is not covered.
- Skill reference subpages other than `application.md` — not fetched (budget). Router table in 02 lists them by name only, with their stated trigger, not their content.

## License note

- PixiJS, PixiJS 3D, and pixijs-skills are MIT licensed (repo LICENSE, SKILL.md frontmatter `license: MIT`, blog). Extracts in 03-skill-extracts.md are short, attributed, under 40% of any single source file, per brief.
