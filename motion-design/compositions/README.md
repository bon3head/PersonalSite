# HyperFrames compositions

Two motion pieces authored from `motion-design/frame.md`, which translates `spec/astryx/DESIGN.md` 1.4.0 for a 1920x1080, 30fps frame. Both draw the real Server lane layout (DESIGN section 12 `world.server`: 48 SMs x 4 partitions x 32 lanes = 6,144 lanes) through a perspective camera on a 2D canvas. Every frame is a pure function of time; nothing reads a clock or `Math.random`.

| Project | Length | What it shows |
|---|---|---|
| `server-ident/` | 12s | The camera dollies in from wide to the Server pose on the signature curve. Warps of 32 fire in lockstep (linear, no easing) and `world.server.words` come out of the focus and cool. The readout (S09 C-SRV-H1, C-SRV-P1, C-SRV-P2) looms in once the camera settles, and the keymap line follows. |
| `guestbook-sign/` | 11s | The guestbook choreography from DESIGN 1.5.0 section 6.14 (PR #5), with its `guestbook` tokens verbatim. **Open:** the camera dollies toward the well with a seeded yaw and rise. Lanes inside the part radius push outward and move to seeded per-lane heights, with the three depth bands staggered. **Type:** each character claims the lane whose tip is nearest its slot, the lane bends toward the camera with weight (k/7)^2, and the glyph rides the lane tip at its true depth with seeded noise. **Lock in:** the camera pushes in, the noise goes to zero, the heights snap to the sign seed, and the glyphs and the hex readout resolve left to right. **Hold**, then **pull back** past rest with a seeded drift while the mark settles at a seeded offset and scale and the part relaxes to its residual. Lusion main and soft curves only. The seed readout moves on translateZ under perspective, never on opacity. |

## Entropy

`guestbook-sign` takes two seeds, as the site does. `openSeed` sets part heights, camera yaw and rise, baseline wobble and typing noise. `signSeed` sets lock-in heights, settle offset and scale, pull-back drift and the hex readout. Values come from counter-based splitmix32 draws, `draw(seed, PARAM, index)`, with the PARAM ids from `src/motion/guestbook.ts`. The hash is not byte-identical to the site's `hash32`, so a seed here does not replay the same mark as on the site. On the site each seed is a fresh `crypto.getRandomValues` draw. In video they are variables, so a render is exact for its seeds: `npx hyperframes render --variables '{"openSeed":N,"signSeed":M}'`. `server-ident` takes `seed`, but the Server scene arrives rigid, so the seed only picks the sign of its idle drift.

**Copy.** The typed name is the `signer` variable. It defaults to `Justin Poli` (S09 C-SRV-H1, approved). No `C-GB-*` string is shown until Justin approves S09 1.6.0. The `seed` prefix is left off the readout for the same reason.

## Render

```
cd motion-design/compositions/<project>
npm run check
../../hyperframes-render.sh . "$PWD/.hf-tmp"
```

Fonts (Commit Mono 400 and 700, OFL, from `@fontsource/commit-mono@5.2.5`) and GSAP 3.15.0 are vendored in `assets/`, so a render makes no network fetch. `assets/lanefield.js` is shared and the copies in the two projects are identical. Edit one and copy it to the other.

## Deviations, stated plainly

- `frame.md` was written by hand in the HyperFrames FRAME.md preset format, because the hyperframes.studio/design web tool was blocked from the cloud sandbox. Run DESIGN.md through the tool locally and diff the result.
- Web values that do not survive video were refit, and each one is recorded in `frame.md`:
  - Lane alpha went from 0.08 to 0.16, because thin low-alpha lines vanish under H.264.
  - The type floor went from 13px to 28px.
  - Signature moves get a x3 dwell factor.
  - The server camera backs off along its own line, with shiftNdc changed from 0.62 to 0.56, so the focus stays inside action-safe.
- Video timings are the 6.14 web timings x2 (open 1.4s, letter 0.8s, lock-in 0.8s, hold 0.6s, pull-back 3.2s), with one keystroke every 0.2s. The glyph floor is 28px, against 14px on the web.
- No sound. Both pieces are under 15s and the brief did not ask for audio.
