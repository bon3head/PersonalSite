# Lane A source log: PixiJS 3D primary docs

1. Fetched date for every entry below: 2026-11-12 (UTC). Fetcher: browser.open text fetch plus curl via exec. No secondary sources were used. No source was guessed.
2. Method note: raw files live under raw/ in this directory. Files marked NOT SAVED were read via browser.open or via a registry or API response printed to stdout, and no local copy was kept. SHA-256 values below were computed with sha256sum on the saved files on 2026-11-12.

## Primary web sources

3. https://pixijs.com/blog/pixi-3d-open-beta | Saved as raw/pixi-3d-open-beta.html | Size 101669 bytes | SHA-256 d327374a73798080e8957f02c735755bd51f1dde160e618c47812442209fb8f0 | Published 2026-11-12T00:00:00.000Z per the page itself | Status: open beta announcement, 35 guides, over 100 live examples, 3 tutorials claimed on this page.
4. https://pixijs.com/3d | Saved as raw/pixijs-3d-landing.html | Size 172629 bytes | SHA-256 190b99f40c42ca3c5136f3d975af73c0f316b6be5b789ae42cba0e18891cd37e | Status: product landing page for PixiJS 3D.
5. https://pixijs.com/llms.txt | Saved as raw/pixijs-llms.txt | Size 53943 bytes | SHA-256 599314c863223ebe85714300097d1784add9f77bd0fa98c0e894ec9e26351f3d | Status: PixiJS v8.23.0 docs index, includes one 3D line pointing to https://pixijs.com/3d/llms.txt.
6. https://pixijs.com/3d/llms.txt | Saved as raw/pixi3d-llms.txt | Size 32118 bytes | SHA-256 1031aaab6419586d4ece983355a2043d20742c4c230188784bab8b25f209835f | Status: PixiJS 3D v0.1.0 docs index, 554 lines as rendered, listing 35 guide pages plus the full API reference.

## Package registry sources

7. https://registry.npmjs.org/@pixi%2F3d/latest | NOT SAVED as a file | Fetched 2026-11-12 | Result: version 0.1.0, description "A 3D extension for PixiJS", dependencies {"meshoptimizer": "^1.2.0"}, peerDependencies {"pixi.js": "^8.23.0"}.
8. https://registry.npmjs.org/pixi.js/latest | NOT SAVED as a file | Fetched 2026-11-12 | Result: version 8.23.0.

## GitHub sources

9. https://api.github.com/repos/pixijs/pixijs | Saved as raw/github/pixijs-repo.json | Size 6887 bytes | SHA-256 c390a154cbf45735bde99308cecb3ddd0dde5eaed7559708fbc84b00349233d3 | Result: description "The HTML5 Creation Engine: Create beautiful digital content with the fastest, most flexible 2D WebGL renderer.", stargazers_count 48682.
10. https://api.github.com/repos/pixijs/pixijs-skills | Saved as raw/github/pixijs-skills-repo.json | Size 6903 bytes | SHA-256 24e9732de81266bd7bfa1e4d9434262f40d2c48c9830a35a55af7c04e71dd689 | Result: description "Official AI skills for PixiJS. These skills teach AI coding agents how to correctly use PixiJS".
11. https://github.com/pixijs/pixijs-skills | NOT SAVED as a file | Read via browser.open 2026-11-12 | Result: public repo, default branch main, current commit 93784384269b1d8677fb2ae166c81d750cba4281, 10 commits, 368 stars, 21 forks, MIT license, created 2026-04-01T09:23:51.000Z, 0 releases, 0 tags. README documents skills `pixijs` and `pixijs-3d`, install via `npx skills add https://github.com/pixijs/pixijs-skills`, Claude Code marketplace via `/plugin marketplace add pixijs/pixijs-skills`.
12. https://raw.githubusercontent.com/pixijs/pixijs/main/packages/3d/README.md | NOT SAVED, fetch FAILED | Fetched 2026-11-12 | Result: HTTP 404 body "404: Not Found" (14 bytes, file deleted after the failed fetch). The 3D package README does not live at this path in the pixijs/pixijs monorepo. Correct package path is UNKNOWN, see 03-limits-unknowns.md.

## Saved guide pages (all under https://3d.pixijs.download/v0.1.0/docs/, saved to raw/guides/)

13. getting-started.html.md | SHA-256 9588b377bffb4f30fb2d043330f08416f0d7c33e74781e7373f424e3eef412a0 | Size 6994 bytes | Title: Introduction.
14. getting-started-1.html.md | SHA-256 3b14e914b933916a7f89285f51e985d3d0aebdfa27b0cd664ffe0b7946bb84be | Size 4632 bytes | Title: Installation.
15. getting-started-2.html.md | SHA-256 27fc12cb0939673847ca7152f0cc35b32345c5b5d52fd7b0b67a9ed38c242f3b | Size 8614 bytes | Title: Quick start.
16. getting-started-3.html.md | SHA-256 5dcd962341edfdade54f707abf12dd61dd89bcadb06de00193fb5dd73d1812e0 | Size 9765 bytes | Title: Porting from Three.js.
17. core-concepts.html.md | SHA-256 2d99283c246bdc9c9a22eaa03bd57e9ce32460cff7e5a4c9e52bef764ddde73b | Size 11557 bytes | Title: Scene graph and transforms.
18. core-concepts-1.html.md | SHA-256 585bf821b706fd3ccd87b501426535d90430a2f48be3e962fa8037b1bfee1b69 | Size 10636 bytes | Title: View3D and 2D content.
19. core-concepts-3.html.md | SHA-256 702cb4485b9b48735ede3fe50fbd631a5c73dc00341c2af23c8fb31bf0fb8443 | Size 5011 bytes | Title: WebGL and WebGPU.
20. core-concepts-5.html.md | SHA-256 7b1226e1f186aa05bbc07e18b45835a48a0a9a6ee0b621352b7b7a70cf92236c | Size 11114 bytes | Title: Performance.
21. scene-4.html.md | SHA-256 e15f3a9e0c91917b18a7ed47227e113cd9c24e5b96d70b4f8b048e0c3d9bb85e | Size 7185 bytes | Title: Lights.
22. scene-5.html.md | SHA-256 0a1fa010c094f4d6b7e83738553ab3d7a89beb8cbe8c93c7dffb701423eab36f | Size 10856 bytes | Title: Shadows.
23. extras_post-processing.html.md | SHA-256 de5d6f58f528fb270b6ca33d93c15ebabd2c233614f1fe12f1cd35e8854facbd | Size 12530 bytes | Title: Post-processing.
24. assets.html.md | SHA-256 c915e57d2180a8aee32a357e90484b0c631f1f50ecfff50be3559dd7184d1b81 | Size 12328 bytes | Title: Loading models.

## Guide inventory check

25. The 3D llms.txt index lists 35 guide pages (non API reference entries). Count by section in https://pixijs.com/3d/llms.txt: getting-started 4, core-concepts 6, scene 10, materials 3, environment 1, assets 2, animation 1, events 1, rendering 1, extras post-processing 2, extras particles 1, maths 1, extras camera controls 1, extras debug 1. Total 35. This matches the blog claim of 35 guides. Of those 35, 12 were saved and read in full (entries 13 to 24 above). The remaining 23 were NOT fetched; their one line descriptions in https://pixijs.com/3d/llms.txt are the only evidence recorded for them.
26. Examples and tutorials were NOT individually fetched. The blog claims over 100 live examples and 3 tutorials. No example index file and no tutorial file is saved under raw/. Example URLs seen inside guides follow the pattern /3d/examples?example=<slug>, for example start_hello-cube, start_model-viewer, scene_hierarchy, shadows_basics, post_bloom. Tutorial titles and URLs are UNKNOWN.
27. Fetch budget: 25 distinct primary URLs were fetched (4 web pages, 2 llms files, 2 registry endpoints, 2 GitHub API endpoints, 1 GitHub repo page, 1 failed README attempt, 12 guide pages, plus 1 llms continuation read counted inside the same llms fetch). No further fetches were made after the budget was reached.
