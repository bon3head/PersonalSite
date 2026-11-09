# HyperFrames compositions

Two motion pieces authored from `motion-design/frame.md`, which translates `spec/astryx/DESIGN.md` 1.4.0 for a 1920x1080, 30fps frame. Both draw the real Server lane layout (DESIGN section 12 `world.server`: 48 SMs x 4 partitions x 32 lanes = 6,144 lanes) through a perspective camera on a 2D canvas. Every frame is a pure function of time; nothing reads a clock or `Math.random`.

| Project | Length | What it shows |
|---|---|---|
| `server-ident/` | 12s | The camera dollies in from wide to the Server pose on the signature curve. Warps of 32 fire in lockstep (linear, no easing) and `world.server.words` come out of the focus and cool. The readout (S09 C-SRV-H1, C-SRV-P1, C-SRV-P2) looms in once the camera settles, and the keymap line follows. |
| `guestbook-sign/` | 10s | A motion study for the guestbook brief (`guestbook/prompt.md`), using the oklou choreography. The camera pushes in on the Lusion main curve while lanes part around the signing point, moving outward and in depth. A seeded 3D stroke draws itself as noise. At lock-in the noise collapses and every one of the 192 warps fires once together, so the 8x6 SM grid lights up as a single front. Then the camera pulls back to wide on the Lusion soft curve and the mark settles at a seeded depth in the field. It uses no copy, because the guestbook has none in S09 yet. The only text on screen is the seed. |

## Entropy

`guestbook-sign` takes a `seed` variable (uint32). On the site, the seed would be one `crypto.getRandomValues` draw per sign. In video it is a variable, so each render is exact for its seed and a new seed gives a different film: a different signing point, mark shape, settle depth, parting radii and camera bow. Draws are counter-based splitmix32, `draw(seed, channel, n)`, as in DESIGN 6.11. `server-ident` also takes `seed`, but the Server scene arrives rigid (bow 0), so the seed only picks the sign of its idle drift. To render with a fresh seed: `npx hyperframes render --variables '{"seed":<uint32>}'`. To render several seeds in one run, use `--batch rows.json`.

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
- No sound. Both pieces are under 15s and the brief did not ask for audio.
