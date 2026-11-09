---
name: local-hyperframes
description: "Render deterministic MP4 video from HTML/CSS with HyperFrames, the agent-native motion-design framework (Apache 2.0, free, HeyGen). Use when the user asks for a video, motion graphic, product launch video, explainer, data-visualization video, slideshow, PR walkthrough, or to turn a design/HTML composition into an MP4. Local path renders here (Node 22+ and FFmpeg verified present); cloud path installs the skills and CLI in the cloud sandbox and renders there, with the local render as fallback. Do not use for talking-head/avatar video or drag-and-drop editing."
compatibility: "Muse workspace skill. Wraps the HyperFrames framework (Apache 2.0, heygen-com/hyperframes) and its 9 published agent skills; the wrapper, the local render proof, and the cloud handoff are authored here."
license: Apache-2.0 (HyperFrames, HeyGen)
metadata:
  version: "1.0.0"
  status: PROBATION
  owner: Justin Poli
  review_date: 2026-12-09
  source: https://github.com/heygen-com/hyperframes
  source_repo: https://github.com/heygen-com/hyperframes
  source_homepage: https://hyperframes.heygen.com
  verified: 2026-11-09
---

# HyperFrames — motion design (HTML/CSS to MP4)

## What it is

HyperFrames turns HTML, CSS, and seekable web animations into deterministic MP4 video. You write a composition as a standard web document, set timing with `data-*` attributes, and the CLI renders it frame by frame in headless Chrome. Same HTML source always produces the same MP4 (deterministic, no timing drift), which makes it suitable for CI/CD and automated pipelines.

- **License:** Apache 2.0, free, no commercial restrictions, no per-render fees. Self-hosted rendering costs only your compute. HeyGen offers a paid hosted cloud-rendering option; the self-hosted path costs nothing beyond infrastructure.
- **Maintainer:** HeyGen (venture-backed video company). Created March 2026. Verified 2026-11-09 via the GitHub API: 81,633 stars, 7,538 forks, 232 open issues, updated 2026-11-09. Secondary sources quote stale counts (45,000 stars, 39.2k stars, 174 open issues); use the live API numbers, not those.
- **Tagline (repo):** "Write HTML. Render video. Built for agents."

## When to use it

Use HyperFrames when the task is motion design or video from code: a product launch video, an explainer, a data-visualization video, a slideshow, a PR walkthrough, a motion graphic, or turning a design/HTML composition into an MP4. The router skill (`/hyperframes`) reads the request intent and routes to the right workflow; agents do not need to know the full API.

Do NOT use it for: talking-head video with a human presenter or AI avatar (HyperFrames produces motion graphics and screen-capture video, not avatar/webcam recordings); drag-and-drop editing (it requires writing HTML/CSS); or a task that needs a platform managing compute, storage, and CDN delivery end to end (HyperFrames renders but does not host or deliver the output).

## Animation runtimes

Wire animations with GSAP timelines, Lottie JSON, Three.js scenes, Anime.js, CSS keyframes, WAAPI, or TypeGPU. The framework handles seek-safe keyframe authoring across all runtimes; different animations in the same composition can use different runtimes. You are not locked to one animation library.

## The 9 published skills (authoritative count)

The repo ships **9 published skills** (README, verified 2026-11-09). Secondary sources saying "20 skills" or "19 installable skills" are stale/wrong. The 9 are in `skills/` in the repo:

- **Core set (6), installed by `npx hyperframes skills update`:** `/hyperframes` (the router/contract; read it first), `/hyperframes-cli`, `/hyperframes-registry`, `/media-use`, `/reverse-any-video`, `/style-sampling`.
- **On-demand (3), installed when needed:** `/figma`, `/slideshow`, `/remotion-to-hyperframes` (converts a Remotion React composition to HyperFrames HTML; one-way, does not preserve React component structure).
- **Repo-internal (6)** under `.claude/skills` / `.agents/skills`, excluded by default.

Install: `npx hyperframes skills update` installs the core set from the release tag matching your CLI version (so skills match the CLI that runs them). Or `npx skills add heygen-com/hyperframes` (interactive picker; `--all` for all 9, `--skill <name>` for one). Skills work with Claude Code, Codex, Cursor, Gemini CLI, IBM Bob, and other coding agents that support skills. Plugins exist for Claude Code, Codex, Cursor, and Gemini (`.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `gemini-extension.json` in the repo).

## Local path (here, this VM) — proven

Prerequisites are verified present on this box (2026-11-09): Node.js v24.22.1 (requires 22+), FFmpeg 8.1.2. The CLI is `npx hyperframes` (version 0.9.26 verified). The core skill set is already installed on this box (2026-11-09, in both `~/.claude/skills/` and `~/.agents/skills/`): hyperframes, hyperframes-cli, hyperframes-registry, media-use, reverse-any-video, style-sampling. Do not reinstall it unless `npx hyperframes skills update` reports it out of date. On-demand skills (`/figma`, `/slideshow`, `/remotion-to-hyperframes`) are not installed; install one with `npx hyperframes skills update <name>` when a task needs it.

Production loop:
1. `npx hyperframes init --non-interactive --example blank <name>` — scaffolds a project. `init` is interactive by default; agents must pass `--non-interactive`. Examples include `blank`, `warm-grain`, `swiss-grid`. The scaffold includes `index.html`, `hyperframes.json`, `meta.json`, `package.json`, plus `AGENTS.md` and `CLAUDE.md`.
2. `npm run check` (in the project dir) — lints the composition. Must pass before rendering.
3. `npm run render` — writes the MP4 to `renders/<name>_<timestamp>.mp4`.

**TMPDIR (load-bearing, this box):** `/tmp` is a 512MB tmpfs. Renders fail with "Low disk space" (0.5 GB free at /tmp) unless temp is redirected. Use the wrapper script `motion-design/hyperframes-render.sh` (in the repo) for renders: it sets TMPDIR to a directory on the large disk automatically, runs `npm run check`, then renders, and prints the MP4 path. Usage: `./hyperframes-render.sh [project-dir]` (defaults to the current directory; second argument or `HF_TMPDIR` env overrides the temp dir). If you render without the wrapper, always set TMPDIR yourself (e.g. `TMPDIR=~/workspace/hyperframes-smoke/tmp npm run render`). Never render with the default /tmp on this box.

**Render proof (2026-11-09):** smoke test at `~/workspace/hyperframes-smoke/smoke-test/`. `npm run check` passed. `npm run render` (with TMPDIR set) produced `renders/smoke-test_2026-11-09_16-40-25.mp4`: H.264, 1920x1080, 30fps, 10.0s, 29,706 bytes, rendered in 56.3s (software GPU, screenshot capture). Verified with ffprobe. The first render attempt failed on /tmp disk space; the TMPDIR redirect fixed it. That failure mode is the environment, not a HyperFrames defect.

Note: HyperFrames is Node-based (requires Node.js 22+). Use npx/node for HyperFrames only. This is a tool requirement, not a choice; Justin's Bun-over-Node preference does not apply to a tool that only runs on Node.

## frame.md — the design-system translation layer

`frame.md` converts an existing brand token file or `design.md` into a video-ready spec. It takes the web-context design spec and inverts it for the frame: same tokens, same rules, but rewritten for video (correct scale, color grading, typography, pacing, dwell, motion for a 16:9 timeline). The output is a `DESIGN.md` superset any agent or CLI tool can read without guessing at video-safe values.

- **Web tool (cloud-usable):** https://hyperframes.studio/design — paste a `design.md`, get a `frame.md`. Premade frames are available (Biennale Yellow, BlockFrame, Blue Professional, Bold Poster, Broadside, Capsule, Cartesian, Cobalt Grid, Coral, Creative Mode, Daisy Days, Editorial Forest, and more). Verified live 2026-11-09. Browser Claude can use this tool directly (it is a website).
- **How it connects here:** the site's design system is `spec/astryx/DESIGN.md` (Astryx tokens, in the portfolio repo). Feed it to the frame.md tool to get a video-ready spec, then compose the video from that spec. This is the bridge from the site's tokens to video.

## Cloud path (browser Claude and other cloud agents)

A cloud agent CAN install things in its cloud environment (Justin's direction, 2026-11-09). The cloud path is install-then-render, the same as local, inside the cloud sandbox. A copyable brief for a cloud agent is in `references/cloud-brief.md` (paste it into browser Claude alongside the video brief):

1. **Install.** In the cloud environment, install the HyperFrames skills and CLI the same way as local: `npx hyperframes skills update` (core set) or `npx skills add heygen-com/hyperframes --all` (all 9). The CLI is `npx hyperframes` (requires Node.js 22+ and FFmpeg on the render host; if the sandbox lacks them, install them or fall back to the local render below).
2. **Author the composition.** Write the video as an HTML document with `data-*` timing attributes, using the HyperFrames format (see the `/hyperframes` skill and the repo's `examples/`). Use the frame.md web tool (https://hyperframes.studio/design) to translate the relevant `design.md` into a video-ready `frame.md` first, so the composition uses video-safe scale, color, and typography.
3. **Render in the cloud.** Init with `npx hyperframes init --non-interactive --example blank <name>` (init is interactive by default; agents must pass `--non-interactive`), run `npm run check`, then render. Use the wrapper script (`motion-design/hyperframes-render.sh` in the repo) if it is available; otherwise set TMPDIR to a writable directory in the sandbox before rendering (renders need temp space; a small /tmp will fail the same way as on this box). The MP4 lands in `renders/`.
4. **Fallback (if the cloud sandbox cannot render).** If the sandbox has no FFmpeg, no writable disk, or no headless Chrome, the render fails there. Fall back to the local render path: keep the composition in the repo (or as an attached file) so a local agent can read it, and hand it to a local agent to render (`npm run check` then render with TMPDIR set). The cloud agent authors; the local agent renders.
5. **Do NOT use HeyGen-hosted cloud rendering** (`hyperframes cloud render`) without Justin's explicit approval. It connects to HeyGen's hosted infrastructure, which carries its own pricing and availability terms. The AWS Lambda path (`hyperframes lambda deploy`, package `@hyperframes/aws-lambda`) is the self-contained alternative but requires setting up Lambda yourself. The default cloud path is install-and-render in the sandbox, with the local render as fallback.

## Limits and trade-offs (verified)

- Requires Node.js 22+ and FFmpeg on every rendering host. No Docker image is documented for local development.
- Early-stage framework (created March 2026, 232 open issues as of 2026-11-09). Plan for occasional rendering quirks in edge cases (animation rendering, media handling).
- Cloud rendering ties to HeyGen's hosted service (pricing/availability); AWS Lambda is the self-contained alternative but needs Lambda setup.
- No talking-head/avatar video. No drag-and-drop editor. No end-to-end hosting/delivery (renders but does not host).
- The "20 skills" and "19 skills" figures in secondary sources are stale; the repo ships 9 published skills. Star/fork counts in secondary sources are stale; verify against the GitHub API.
- Heavy compositions can stall on software GL (the smoke render noted "Screenshot capture (slower): BeginFrame did not run. Needs chrome-headless-shell and no --resolution upscale"). Prefer the default capture path and keep compositions modest until a GPU path is verified.
