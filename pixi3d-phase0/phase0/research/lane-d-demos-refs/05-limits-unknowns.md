# Lane D — Limits and unknowns

## Fetch limits hit in this lane

1. Fetch budget: 24 of 25 fetches used. One further fetch (a second design-extract reserve target, or a demo sub-page) would have exceeded the budget. Stop condition met by budget, not by exhaustion of questions.
2. Nightward direct page (https://goodstuff.pixijs.io/nightward/) returned no extractable content. Per the developer instruction, the request was NOT repeated, including with changed arguments or through another tool. Nightward mechanics in file 02 rest on the PixiJS blog + shelf card only.
3. Mach 2 direct page (https://goodstuff.pixijs.io/mach-2/) returned title + logo only. Mechanics rest on the blog + shelf card only.
4. PixiJS 3D examples index (https://pixijs.com/3d/examples and ?example=game_racing) text extraction returned only the Post-processing category (15 items). The full example catalogue, the racing-game source, and per-example URLs were not extractable. The blog's "over 100 live examples" count is a claim, not a verified enumeration in this lane.
5. Good Stuff sub-pages for The Backrooms and Through the clouds were not fetched (budget). Their entries in file 02 are card-level only.
6. Shooting Gallery tutorial: only Step 1 of 8 was read. Steps 2–8 are unknown in this lane.
7. Bruno Simon and Edoardo Lunardi live pages were not opened as primary fetches in this lane (Bruno via case-study pages; Lunardi via Awwwards record + study text). Live-page details for those two are therefore second-hand in this lane and must be re-verified by the fusion step's own screenshot / computed-style pass.
8. Corentin Bernadou live homepage was fetched, but its text extraction is a repeating project list (366 lines, mostly repeats). Design detail comes from the Codrops case study, not from the live page's computed styles. Fusion must do its own style extraction.

## Unknowns (do not assert these in the masterspec without a follow-up lane)

### Good Stuff demos
- U1. Nightward: controls beyond "you only move"; weapon list; horde scaling; Grave Reaper trigger; HUD layout; score / timer; mobile controls; performance on phone vs desktop.
- U2. Mach 2: steering model; jump physics and physics library used (PixiJS 3D has no built-in physics); cubit / bugnik counts; zone names; Cosmos Cube end state; HUD contents.
- U3. The Backrooms: generation algorithm; lighting model; movement controls; whether it uses @pixi/3d at all.
- U4. Through the clouds: shader source; whether it uses @pixi/3d or PixiJS 2D shaders only; performance; relation to the pixijs.com hero code.
- U5. Open-beta launch demo: scene contents and interactions; whether the shelf-card text change between crawls reflects a shelf update.
- U6. Racing game example: mechanics, controls, HUD, source file structure. A later lane must read its source (the blog says it is readable).
- U7. Full examples catalogue: category list, per-example URLs, which examples have live playgrounds vs static code.
- U8. Playground URLs: glass-over-2D, container-texture monitor, nesting, instancing / batched-mesh playgrounds were cited from blog text, not opened as standalone pages.

### Design-extract targets
- U9. Good Stuff shelf: how the curved panels are built (geometry? shader? ContainerTexture per panel?), panel count, interaction model (drag / scroll / auto-orbit). Fusion's screenshot + DOM pass must answer this; the blog gives only the one-sentence architecture.
- U10. Bruno Simon: live-page token yield is expected to be low (most UI is 3D). Whether fusion returns a usable style-brief from it is unknown until the run. The fusion step must record a low-yield result honestly rather than forcing tokens.
- U11. Corentin Bernadou: whether the live site's current build (Issue N°003 / Coll. 2026) still matches the Codrops case study (March 2026). Re-verify at fusion time.
- U12. Edoardo Lunardi (reserve): no live page fetched in this lane. All details are from the Awwwards record and the Muszarski study.
- U13. Astryx theme reconciliation: how the extracted tokens from any target map onto the portfolio's current Astryx theme / blue accent. No theme file was read in this lane (out of scope for Lane D). The masterspec lane must reconcile, not assume.

### Adjacent frameworks
- U14. Three.js: whether the fork's masterspec should re-pin from r186 to r187, and what r187 changes break. Requires reading the r185–r187 migration guide.
- U15. Babylon.js / PlayCanvas latest patch versions differ by source date (9.31 vs 9.34; 2.22 vs 2.23). Pin at build time.
- U16. Bundle size, Lighthouse, and frame-time numbers for PixiJS 3D vs Three.js on the same portfolio content: no measurement exists in this lane. The prior turn's "Three.js portfolios 57–75 Lighthouse" figure is session context, not a measurement made here. A probe build must measure, not cite.
- U17. PixiJS 3D WebGL2 fallback performance on iPhone / Safari: the blog describes the CPU-culling switch, but no device measurement exists in this lane.
- U18. Physics / audio plan for any game-like finale: PixiJS 3D ships neither. The library choice (Rapier, Matter.js, Howler, WebAudio, or none) is undecided and must be decided by the masterspec, not assumed from Bruno Simon's stack (Rapier + Howler) or Mach 2 / Nightward (unknown stacks).

### Portfolio context (out of scope for Lane D, flagged for other lanes)
- U19. Current portfolio site's exact content lock, Astryx theme tokens, and repo branch state were not re-read in this lane. Lane C owns that. Do not import Lane C claims into Lane D files without citing Lane C.
- U20. Whether the fork branch already exists on the remote, and its name. Lane D wrote only to the phase0 research directory on this VM; no repo branch work was done.

## Risks carried forward

- R1. Beta API drift: PixiJS 3D API can change before 1.0. Any masterspec pattern that depends on an exact API name must cite the guide page it came from and note the beta status.
- R2. Shelf / demo link rot: Good Stuff cards changed text between crawls in this lane's sources (open-beta card). Demo URLs and contents may change before the build. Re-fetch at build time.
- R3. Usability trap: the most impressive reference (Bruno Simon) is also the least practical (Practicality 1 / Wow 5). The fork must carry the 2D-HUD guardrail explicitly, or it will repeat that failure.
- R4. Fusion yield risk: two of three design-extract targets are canvas-heavy and may return low token yield. The fusion step must not pad a thin brief.
- R5. Old pixi3d confusion: the community pixi3d package (v2.5.0, PixiJS v5–v7) shares a name with the new official @pixi/3d. Any agent or search result citing "pixi3d" without a version must be checked for which library it means.
