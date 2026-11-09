# HyperFrames — cloud brief (paste into browser Claude)

Use this when you want a cloud agent (browser Claude, claude.ai) to do motion-design / video work with HyperFrames. Paste it alongside the video brief. Browser Claude cannot install skills, run the CLI, or render video locally, so its job is to author the composition; a local agent renders it.

---

You are authoring and rendering a video with HyperFrames, the agent-native motion-design framework (Apache 2.0, free, HeyGen). HyperFrames turns HTML, CSS, and seekable web animations into deterministic MP4 video. You write a composition as a standard web document, set timing with `data-*` attributes, and render it frame by frame into an MP4. Same HTML always produces the same MP4.

You are in browser Claude (claude.ai). You CAN install things in your cloud environment. Install the HyperFrames skills and CLI, author the composition, and render it in the cloud. If the cloud sandbox cannot render (no FFmpeg, no writable disk, no headless Chrome), fall back to authoring only and hand the composition to a local agent to render.

Your sources, in order:
1. The HyperFrames repo and docs: https://github.com/heygen-com/hyperframes and https://hyperframes.heygen.com. Browse them on the web. The repo's `examples/` directory shows the composition format. The `/hyperframes` skill (SKILL.md in the repo's `skills/hyperframes/`) carries the contract and references (film, captions, overlays, motion, look); read it first.
2. The frame.md web tool: https://hyperframes.studio/design. Paste the relevant `design.md` (the brand/design-system spec) and it translates it into a video-ready `frame.md` (pacing, scale, dwell, motion for a 16:9 frame). Use the returned `frame.md` as the spec for your composition. Premade frames are available on the page. This is a website; you can use it directly.
3. Animation runtimes you can wire: GSAP timelines, Lottie JSON, Three.js scenes, Anime.js, CSS keyframes, WAAPI, TypeGPU. Different animations in the same composition can use different runtimes.

Install, author, and render:
1. Install the skills and CLI in your cloud environment: `npx hyperframes skills update` (core set: hyperframes, hyperframes-cli, hyperframes-registry, media-use, reverse-any-video, style-sampling) or `npx skills add heygen-com/hyperframes --all` (all 9). The CLI is `npx hyperframes` (requires Node.js 22+ and FFmpeg on the render host).
2. Author the composition: a complete HTML document with `data-*` timing attributes, following the HyperFrames format and the `frame.md` spec. Use the frame.md web tool first so the composition uses video-safe scale, color, and typography.
3. Init and render: `npx hyperframes init --non-interactive --example blank <name>` (init is interactive by default; always pass `--non-interactive`), then `npm run check`, then render. Set TMPDIR to a writable directory in your sandbox before rendering (renders need temp space; a small /tmp will fail). If the repo's `motion-design/hyperframes-render.sh` wrapper is available, use it: it sets TMPDIR, runs the check, renders, and prints the MP4 path. The MP4 lands in `renders/`.
4. If the sandbox cannot render (no FFmpeg, no writable disk, no headless Chrome), stop after authoring and say the composition is ready for a local agent to render. Keep the composition in the repo (or as an attached file) so a local agent can read it.

Do NOT use HeyGen-hosted cloud rendering (`hyperframes cloud render`) without the user's explicit approval; it connects to HeyGen's hosted infrastructure with its own pricing and availability. The default path is install-and-render in the sandbox, with the local render as fallback.

Limits: HyperFrames produces motion graphics and screen-capture video, not talking-head/avatar video. It requires HTML/CSS authoring; it is not a drag-and-drop editor. Keep compositions modest (heavy compositions can stall on software rendering).
