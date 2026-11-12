# PixiJS 3D portfolio fork - Phase 0 research index

- Date: 2026-11-12
- Goal contract: pixijs-3d-portfolio-fork-phase-0-research-and-collection-20261112
- Goal contract file: phase0/goal-contract.json
- Live base: 2d75332, Merge PR #9: server words formed from lanes, HEAD of origin/astryx-polish-r2 and origin/astryx-integration
- Git origin/main: c43c594, spec-only, not the live site
- Production: dpl_A9Hi8a8TywyP4WPJLxp2pM9YH3KC, READY, alias includes justinpoli.is-a.dev. Rollback: dpl_G3nFNBAQtfLwGuxZApdQk1LwXZjq (46d6a34)
- Masterspec synthesis: paused, not written

## Lanes

1. Lane A PixiJS 3D primary docs: research/lane-a-pixi3d-docs/
   - 01-sources.md c10a79b831bf52cc5102cf4030080f9e2c048c4e414569f15e6e408eb285a366
   - 02-api-surface.md 113a57fbd00b62425fba99336100fa8e1350332e00daab11e95318af70242fe0
   - 03-limits-unknowns.md 66e1ea94240536dd42e0426c349ecf4faa317365ea09930d525a48906cefd770
   - Versions: @pixi/3d 0.1.0, pixi.js 8.23.0
2. Lane B PixiJS v8 core and skills: research/lane-b-pixi-v8-skills/
   - 01-sources.md fc3d2a5ae7f849ded8de71148a826cd8e3778e1e61d135f47890cfa51d4ff0de
   - 02-v8-core-surface.md 80c42a7f667000625f12f9e52064b8fa839322536130323b278361a1240107fa
   - 03-skill-extracts.md e7cacb383cf3919bed1ba747951a4dfe44348dedbcf49b3cd7f664969f5e1af6
   - 04-limits-unknowns.md d654f48cb37e81922eb2811af1bef7a7cfbd49d6822f13e9c7c29cb769fafa8e
   - Conflict: v8 docs list WebGL Recommended/stable, WebGPU Experimental, against blog WebGPU first
3. Lane C Portfolio and Astryx, corrected to 2d75332: research/lane-c-portfolio-astrxy/
   - 01-repo-map.md 1308247da2d418608c42be23c8fe8d8a285b2ac948071b0d6a418bb471834908
   - 02-code-graph.md 7a4c1da398a0d20c3e4fe4798eb068897dbb823c0a95d996c630a8e03e8aacdf
   - 03-theme-tokens.md a6bd6703e1180b7137ce2639923361f3156fce87afab45f550b3f37de423000b
   - 04-replacement-surface.md 627ddb606ec0c0ded8222043f5ba9173288f9c7aa837a409d6b898d7a54ecb45
   - 05-limits-unknowns.md 326044c64f2f7d47f7c32bcaafb7bc748d1ea4587c2ac3234049543d675f512b
   - repomix.xml e80bf85fc61d539acf3ef3dbec4f46831c99d10610cf4b2fe469542e731c3d03, 148 files, 483415 tokens
   - Deps at live HEAD: three 0.186.1, troika 0.52.5, Astryx 0.7.1
4. Lane D Good Stuff demos and refs: research/lane-d-demos-refs/
   - 01-sources.md 745834b15169355ed2493e80a313510ba0cad23a345233ffc9fbace7b2457946
   - 02-good-stuff-demos.md 66de215e40dc202b76687ce987174ad455b4f83a9ad26b7f836027d6e8c2260c
   - 03-design-extract-targets.md 855c00d9bf7d3d3be7c215946a29efddee77f3b46287e2f860810ff53f209ad2
   - 04-adjacent-comparison.md 24c74a12679a81bed42103cb3541214d2dba03acf8163b2befb6b1db794cde12
   - 05-limits-unknowns.md 6138ff4fb34c423a93b0f86430bd845122a5fb061fa836039fd1c07697ae5e45

## Design extract

- design-extract/goodstuff/style-brief.md 45a75e2995de7f8a6b95795ac85193d21c9e4f21ab629502390058feb0c476bb, FULL, 49 files, contrast gate pass
- design-extract/bruno-simon/style-brief.md 81d347d639da2a07057e8bd0583959bc94f48d8e3799a29f3b7916e52018abc8, PARTIAL, DOM chrome only, viewport Chrome ERR_EMPTY_RESPONSE, 3D world unmeasured
- design-extract/corentin-bernadou/style-brief.md dc4ab3127f024adaf0e1a96397c63dbc07024b1dc09629f8b0d4a9f45bdba117, PARTIAL, loader only at 24 percent and 23 percent, stylesheet tokens stable
- design-extract/SYNTHESIS.md 8d43735e959acd72dc6a0a9962bdfaea5944e780438c7f81e8e71950c5232d39, 8 patterns transfer, 6 do not transfer, lane theme and blue accent win over extracted palettes

## Open issues carried forward

1. K-SRV-6: per-frame texture upload while a word is lit, gbTex needsUpdate at lanefield.ts:1554
2. Lane-carried letters reading subtly in stills
3. Bundle and Lighthouse impact of PixiJS 3D vs current three.js world: unmeasured
4. Physics and audio library choice: undecided, PixiJS 3D ships neither
5. Three.js r187 published 2026-10-30, r186 pin is one release behind

## Verification gates

1. test -f phase0/RESEARCH-INDEX.md
2. git branch pixi3d-phase0-20261112 tracks 2d75332 after rebase
3. Independent review by Codex gpt-5.6-sol, separate seat, findings recorded, not auto-applied
