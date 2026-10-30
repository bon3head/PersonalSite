# S08 Scene: not found (any unknown path)

Version 1.0.0, 2026-10-30. Depends on: S02, S03, S04, S09, DESIGN `world.scatter`, `world.camera.scatter`. Blocks: S11.

## 1. Purpose

An unknown address. The lanes have nowhere to go, so they scatter into short unrouted strokes floating in the void. The readout says so in one line and points at the keymap. Small, on-system, and the fastest way back is one key.

## 2. Visual identity

Void ground, signal dim strokes at 22% alpha, 1px, scattered in a sphere of radius 8. Slow yaw. Nothing else. It must look unfinished on purpose: the absence of structure is the message.

## 3. Layout

Generator (`src/world/layouts/scatter.ts`, worker, `rng(seed + 3 * 1000003)`): for each lane, a center uniformly inside the sphere of radius `scatter.radius` (rejection sample in the cube), a direction uniformly on the unit sphere, a length uniform in `segLength [0.2, 0.6]`; 8 points evenly spaced along the segment; class 9.

Camera: `(0, 0, 14)` looking at the origin, fov 40 (fine); `(0, 0, 18)`, fov 52 (coarse). No shift. Idle yaw `±4 deg` over 24s.

Readout: variant `server` (left column fine, top coarse), C-404-H1 as `<h1>` at `--jp-text-display-1`, C-404-P1 at `--text-body`. The wordmark is shown. The keymap shows no active scene item.

## 4. Motion

Entry: travel to `scatter` (700ms expo-out) when reached by `popstate` to an unknown path; on a direct load it starts in place. Idle: yaw only. Reduced motion: static. `ArrowRight` or `1` goes to the server.

## 5. Content

C-TITLE-404, C-404-H1, C-404-P1. HTTP status 404 is the host's job (`dist/404.html`, S03 section 7).

## 6. Kill criteria

- K-404-1: any joke, illustration, or "lost in space" copy.
- K-404-2: the page is a dead end (keymap missing or inactive).

## 7. Receipts

| Test | Claim | How |
|---|---|---|
| T-404-1 | Unknown path renders the scene | load `/nope`: H1 C-404-H1, `weights()` one-hot index 3, title C-TITLE-404 |
| T-404-2 | One key home | press `1`: URL `/`, server readout visible, no document load |

## 8. Changelog

- 1.0.0, 2026-10-30: initial.
