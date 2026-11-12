# Open decisions for the masterspec, per review F8

These decisions are recorded here, not made here. The masterspec must choose explicitly, including choosing none. No default was invented in this file.

## D1 Reduced motion
- Specify reduced-motion outcomes for idle motion, drag and spin, focus, camera transitions, and fallback content. The shelf has drag, spin, focus, and ambient motion, but no reduced-motion state machine exists in the pool.
- Options: full static fallback, reduced ambient only, reduced camera only, or per-element reduced states. Record the chosen state machine and its test.

## D2 Physics
- PixiJS 3D ships no physics. The pool proposes game-like patterns while leaving physics as an unbounded library choice.
- Options: no physics, a pinned lightweight library with loading, accessibility, and teardown rules, or a custom minimal simulation. Record the choice with the loading and teardown rules.

## D3 Audio
- PixiJS 3D ships no audio.
- Options: no audio, or a pinned audio path with loading, autoplay, mute, and teardown rules. Record the choice.

## D4 Renderer backend
- Three facts are settled in Lane C 04 section 8: WebGPU-first design positioning, WebGL-first runtime default, WebGL Recommended for production. Backend selection for the fork is not settled.
- Options: WebGL2-first, WebGPU-first with WebGL2 fallback, or explicit preference per device class. Select only after target-device measurements under MEASUREMENT-PROTOCOL.md, and address the S00 iPhone WebGPU buffer-limit evidence.

## D5 Shader language
- WGSL, GLSL, or both for the lane shader, LeafLink pin shader, and guestbook/word-tint uniforms. A dual-shader fork doubles the highest-risk surface. Record the choice with the probe evidence from F1.
