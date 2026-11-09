# Motion design with HyperFrames

HyperFrames turns HTML, CSS, and seekable web animations into deterministic MP4 video. You write a composition as a standard web document, set timing with `data-*` attributes, and render it frame by frame into an MP4. Same HTML always produces the same MP4. It is the motion-design capability for this repo and for any agent working from it, local or cloud.

- **What it is:** HyperFrames (heygen-com/hyperframes, Apache 2.0, free, HeyGen). Tagline: "Write HTML. Render video. Built for agents." Verified 2026-11-09 via the GitHub API: 81,633 stars, 7,538 forks, 232 open issues, created 2026-03-10, updated 2026-11-09. Secondary sources quote stale counts; use the live API numbers.
- **Skills:** the repo ships 9 published skills (6 core + 3 on-demand) + 6 repo-internal. The "20 skills" / "19 skills" figures in secondary sources are stale/wrong. Core set: hyperframes, hyperframes-cli, hyperframes-registry, media-use, reverse-any-video, style-sampling. On-demand: figma, slideshow, remotion-to-hyperframes.
- **Runtimes:** GSAP, Lottie, Three.js, Anime.js, CSS keyframes, WAAPI, TypeGPU.
- **frame.md:** the design-system translation layer. Takes a `design.md` and inverts it for the 16:9 frame (scale, color grading, typography, pacing, dwell, motion). Web tool: https://hyperframes.studio/design (paste a design.md, get a frame.md; premade frames available), verified live 2026-11-09. This is the bridge from the site's Astryx DESIGN.md tokens (`spec/astryx/DESIGN.md`) to video.

## How Claude uses this

**Local (this VM):** Node v24.22.1 + FFmpeg 8.1.2 are present. CLI `npx hyperframes` v0.9.26. Core skills are installed in `~/.claude/skills/` and `~/.agents/skills/`. Loop: `npx hyperframes init --non-interactive --example blank <name>` (init is interactive by default; agents must pass `--non-interactive`) → `npm run check` → render. Render proof 2026-11-09: a valid H.264 1920x1080 30fps 10.0s MP4 in 56.3s (smoke test). Use the wrapper script `hyperframes-render.sh` for renders (see below).

**Cloud (browser Claude):** Claude CAN install things in its cloud environment. Install the skills and CLI in the sandbox (`npx hyperframes skills update` for the core set, or `npx skills add heygen-com/hyperframes --all` for all 9), author the composition, then init (`--non-interactive`), check, and render in the cloud. Use the frame.md web tool first to translate the relevant `design.md` into a video-ready `frame.md`. If the sandbox cannot render (no FFmpeg, no writable disk, no headless Chrome), fall back to authoring only and hand the composition to a local agent to render. Do NOT use HeyGen-hosted cloud rendering (`hyperframes cloud render`) without the user's explicit approval (HeyGen hosted service, own pricing/availability); AWS Lambda is the self-contained alternative but needs Lambda setup.

## Files

| File | What it is |
| --- | --- |
| `README.md` | This file. Index and the two paths (local + cloud). |
| `hyperframes-skill.md` | The full HyperFrames skill (the same content as the workspace skill `local-hyperframes`). Read it first when doing motion-design work from this repo. |
| `cloud-brief.md` | The copyable cloud brief. Paste it into browser Claude alongside a video brief. It tells Claude to install, author, and render in the cloud, with the local render as fallback. |
| `hyperframes-render.sh` | The render wrapper. Sets TMPDIR to a directory on the large disk automatically, runs `npm run check`, renders, and prints the MP4 path. Usage: `./hyperframes-render.sh [project-dir]` (defaults to the current directory; second argument or `HF_TMPDIR` env overrides the temp dir). |
| `repomix.xml` | The whole motion-design context packed for Claude in one XML file (repomix 1.18.1). Attach it to browser Claude alongside the brief. Regenerate with the command in the repomix section below after any file change. (6 files, ~30,000 tokens.) |

## The TMPDIR quirk (smoothed)

`/tmp` is a 512MB tmpfs on the local box. Renders fail with "Low disk space" unless temp is redirected. The wrapper script (`hyperframes-render.sh`) handles this automatically by setting TMPDIR to a directory on the large disk. If you render without the wrapper, always set TMPDIR yourself (e.g. `TMPDIR=~/workspace/hyperframes-smoke/tmp npm run render`). In a cloud sandbox, set TMPDIR (or `HF_TMPDIR`) to a writable directory before rendering; a small /tmp fails the same way.

## Non-interactive flags (smoothed)

- `init` is interactive by default. Agents must pass `--non-interactive`: `npx hyperframes init --non-interactive --example blank <name>`.
- `skills update` takes skill names as arguments and is non-interactive: `npx hyperframes skills update reverse-any-video style-sampling`. It does NOT accept `--non-interactive` (unknown flag). Without names it never expands a partial install and never removes a skill.
- `npx hyperframes skills` (list) is interactive; avoid it in agent runs. Use `skills update` instead.

## Limits

No talking-head/avatar video (motion graphics + screen capture only). No drag-and-drop editor. No end-to-end hosting/delivery (renders but does not host). Early-stage framework (232 open issues as of 2026-11-09). Heavy compositions can stall on software GL. HyperFrames is Node-based (requires Node.js 22+); use npx/node for it only.

## Repomix

`repomix.xml` is the whole motion-design context in one file, packed with repomix 1.18.1 (XML style). It contains the motion-design directory, `spec/astryx/DESIGN.md`, and `spec/astryx/specs/S09-copy-deck.md` (the site's design system and copy, so video compositions can use the site's tokens). Regenerate from the repo root after any file change:

```
~/workspace/tools/bin/repomix --style xml --output motion-design/repomix.xml --include "motion-design/**,spec/astryx/DESIGN.md,spec/astryx/specs/S09-copy-deck.md" --ignore "node_modules/**,dist/**,dist-server/**"
```
