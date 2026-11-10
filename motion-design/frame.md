---
version: alpha
name: Astryx Keystone, Frame (video / frame layer)
description: >
  Video-first companion to spec/astryx/DESIGN.md (v1.4.0). The unit is the frame (1920x1080,
  30fps). Atoms are identical and sacred: the void ground, the one blue in two jobs (signal on
  dark, ink on paper), Commit Mono only, the 6,144-lane field as the only drawn material.
  Composition, scale, pacing, dwell and motion are rewritten for a 16:9 timeline.
unit: the frame, 1920x1080 primary at 30fps
principle: atoms are sacred, composition is free, every number traces to DESIGN.md section 12
source: spec/astryx/DESIGN.md 1.4.0 and spec/astryx/specs/S09-copy-deck.md 1.5.0
translation: >
  Written by hand in the HyperFrames FRAME.md preset format (skills/hyperframes/assets/frame-presets).
  The hyperframes.studio/design web tool was not reachable from the cloud sandbox on 2026-11-09
  (egress proxy refused hyperframes.studio:443). Re-run DESIGN.md through the web tool locally
  and diff against this file before treating it as final.

colors:
  void-ground: "#0A0C0F"
  void-raised: "#15171B"
  void-text: "#E6E8EA"
  void-text2: "#A7ABB0"
  signal: "#7BB5F8"
  signal-dim: "#4F77A5"
  signal-hot: "#D4E7FC"
  ink: "#0E3565"
  field: "#10294E"
  hairline: "rgba(230,232,234,0.13)"

typography:
  display-name: { fontFamily: "Commit Mono", cqw: 6.6, weight: 400, lineHeight: 0.95, tracking: "-0.04em" }
  display-title: { fontFamily: "Commit Mono", cqw: 3.75, weight: 700, lineHeight: 1.0, tracking: "-0.03em" }
  body: { fontFamily: "Commit Mono", cqw: 1.45, weight: 400, lineHeight: 1.5 }
  supporting: { fontFamily: "Commit Mono", cqw: 1.46, weight: 400, lineHeight: 1.54 }
  key: { fontFamily: "Commit Mono", cqw: 1.46, weight: 700, lineHeight: 1.0 }
  scene-word: { fontFamily: "Commit Mono", cqw: 1.25, weight: 400, lineHeight: 1.0 }

spacing:
  edge: "5cqw"          # 96px action-safe inset at 1920 (inside the 90% box)
  title-safe: "10cqw"   # load-bearing copy sits inside the 80% box
  keymap-h: "4.2cqw"
  gap-md: "1.6cqw"

motion:
  ease-standard: "ease"                                  # house curve: feedback, text exits
  ease-signature: "cubic-bezier(0.23, 1, 0.32, 1)"        # camera, loom, readout entrance
  ease-lusion-main: "cubic-bezier(0.35, 0, 0, 1)"         # guestbook only (guestbook/prompt.md)
  ease-lusion-soft: "cubic-bezier(0.4, 0, 0.1, 1)"        # guestbook only
  pulse: "linear"                                         # Lockstep: no easing on pulses
  travel: "0.7s on the web; 2.1s in frame (x3 dwell factor, see Pacing)"
  loom: "scale 0.92 to 1.00, signature curve"
  word-life: "2.6s, cadence 1.1s, drift (-1.0, 0.5, 1.0) world units"

components:
  lanefield:
    material: "the only drawn material; every line is one of 6,144 lanes (48 SM x 4 partitions x 32)"
    layout: "DESIGN.md world.server: SM grid 8x6 pitch (0.95,0.85), partition 2x2 pitch (0.27,0.23), lane 8x4 pitch (0.03,0.05), straight z -24 to -2, converge z 0.4 to 2.2 into focus (0,0,2.2)"
    camera: "world camera.server.fine: pos (-7.0, 2.4, 8.0), target (0.5, 0, -3.0), fov 48, shiftNdc (0.62, 0)"
    alpha: "web 0.08 at 1px; frame 0.16 at 1.4px (a 5 to 8 percent line vanishes under H.264)"
    depth-bands: "3 bands, speed x0.85 / 1.00 / 1.15, alpha x0.55 / 0.80 / 1.00"
    fire: "warps of 32 fire together, linear time, speed 0.55 lengths per second, sigma 0.05, period 3 to 7s seeded per warp"
  readout:
    placement: "left column, title-safe, never over the focus"
    content: "S09 strings only, verbatim"
  keymap:
    content: "1 server  2 leaflink  3 sidequests  w whoami  c contact"
    placement: "one line on the bottom title-safe edge, keys 700 signal, labels 400 text2"
  scene-word:
    content: "world.server.words only"
    color: "signal-hot at 0, signal at 0.4, void-text2 at 1.0 of life"
---

# Astryx Keystone, Frame

## Overview

At frame scale the site is one shot of light on black. The 6,144 lanes are the subject and the
only drawn material; the copy is a quiet left column in one monospace face. Saturation comes from
density and motion, never from a loud hex. One hue (the signal blue) in two jobs, plus warm and
cool neutrals. No second hue, ever.

## The Frame

- **Primary:** 1920x1080 at 30fps. Display sizes in `cqw` (px / 1920 x 100).
- **Safe areas:** content inside the 90% action-safe box; load-bearing text inside 80% title-safe.
- **Hue budget:** at most 30% of pixels carry hue on the Server frame (DESIGN 3.3). The left
  third and the top band stay near-empty so the readout breathes.
- **Squint test:** the name dominates the copy at 4 to 5x its size; the lanes dominate the frame by area.
- **Silence:** 40 to 55 percent of the frame reads as void ground.

## Pacing (the inversion for video)

The web values are interaction feedback; a viewer of a film cannot press a key, so every move
gets dwell. Factor x3 on signature moves, x1 on lockstep pulses (they are the clock and must keep
their measured speed).

| Web token | Web | Frame |
|---|---|---|
| travel (camera, morph) | 700ms | 2.1s |
| readout entrance | 300ms | 0.9s |
| loom | 0.30 to 0.70 of travel | 0.9s, starts with the camera settle |
| word life / cadence | 2600ms / 1100ms | unchanged |
| text dwell after entrance | n/a | at least 2.5s before any exit |

## Colors

Tokens identical to the source. `void-ground` is the ground. `signal` is light on dark only and
never a fill behind text. `signal-hot` lives only in pulse cores. `ink` and `field` belong to the
LeafLink and SideQuests regimes and do not appear on Server frames. Gradients exist only inside
lanes (head to tail, OKLab-style toward the ground). Full-frame gradients band under H.264: never.

## Typography

Commit Mono only (OFL 1.1, @fontsource/commit-mono 5.2.5, shipped in `assets/fonts/`). 400 for
the name and everything else, 700 for titles and keys. No all caps, no letter-spaced eyebrows, no
italics. Legibility floor 1.46cqw (28px, the HyperFrames phone-readable floor: 2.6% of the 1080 short side); the web 13px floor does not hold in video.

## Depth and surface

Flat chrome: no shadow, no glass, no blur, no glow without a source. Depth is real 3D only, from
the lane field under a perspective camera.

## Do

- Draw every line as a lane. Light always has a source: a lane, a pulse, the focus.
- Keep pulses linear and in warps of 32 on Server.
- Move the camera on the signature curve; let it settle before text arrives.
- Quote copy from S09 by ID.

## Don't

- No photos, illustrations, icons, third-party logos. Product names appear as text only.
- No decorative particles, cursor trails, counters of fake activity, live/online words.
- No orthogonal routing (the PCB direction is dead), no cards, no stat grids.
- No em or en dashes. No banned words (S09 rule 3).

## Pre-render self-audit

- Hue budget under 30% on Server frames.
- Every visible string has an S09 ID or is a `world.server.words` entry.
- Camera and loom on the signature curve; pulses linear.
- Nothing inside 5cqw of the frame edge except the lane field itself.
