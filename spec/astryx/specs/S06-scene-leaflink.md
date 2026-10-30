# S06 Scene: LeafLink, mutual aid (`/leaflink`)

Version 1.0.0, 2026-10-30. Depends on: S02, S03, S04, S09, DESIGN `world.leaflink`, `world.camera.leaflink`. Blocks: S10 poster, S11 scene gates.

## 1. Purpose

Show what LeafLink does by doing it. The lanes fall flat and become the streets of a neighborhood drawn in ink on paper. Requests (rings) and offers (dots) land on the map at an irregular, human cadence; when a request and an offer are near each other, a route is traced along the streets between them and both pins get a soft halo: matched. The visitor can drop their own offer and watch the nearest open request route to it. The readout gives the facts: mutual aid, week-long hackathon, team of four, 2nd place, the stack, the code.

## 2. Visual identity

- Ground: paper `#F3F0EA` (warm, hue 85). Everything else is ink `#0E3565` at different weights: local streets 1.2px at 30%, arterials 2.2px at 55%, routes 3px at 100%, pins solid. Halos are ink tint `#C9DCEA`.
- This is the only light scene on the site. Its warmth comes from the warm paper against cool ink and from the timing, never from an orange.
- Geometry: an irregular street grid (jittered lattice with dropped and diagonal streets) seen from a high three-quarter angle like a paper map on a table.
- Motion: heartbeat cadence. Events at irregular intervals; each landing is a quick drop, each match a line drawn at constant speed. Nothing periodic.
- Not a Leaflet clone: no tiles, no zoom buttons, no attribution box, no teardrop markers, no real geography, no place names.

## 3. Layout

### 3.1 Street generator (`src/world/layouts/leaflink.ts`, worker)

Use `rng(seed + 1 * 1000003)`.

1. **Nodes.** Lattice `n = 33` by 33, pitch 1.25. Node `(i, j)` base position `((i - 16) * 1.25, 0, (j - 16) * 1.25)`. Jitter x and z each by `(r() * 2 - 1) * 0.28`. Nodes on an arterial row or column (`i % 8 == 0` or `j % 8 == 0`) get half jitter on the axis perpendicular to that arterial.
2. **Edges.** All horizontal `(i, j)-(i+1, j)` and vertical `(i, j)-(i, j+1)`: 2,112 edges. An edge is arterial if both endpoints share an arterial row (horizontal) or column (vertical).
3. **Drop.** Each non-arterial edge is dropped with probability 0.12. Then restore, in a seeded random order, any dropped edge whose endpoints are in different union-find components or whose endpoint would have degree 0. The final graph is connected.
4. **Diagonals.** For each cell `(i, j)` with `r() < 0.04`, add one diagonal: `(i, j)-(i+1, j+1)` if `r() < 0.5`, else `(i+1, j)-(i, j+1)`. Diagonals are local.
5. **Allocate exactly 6,144 lanes.** Edge lengths `L_e`, total `S`. Quota `q_e = 6144 * L_e / S`, `k_e = max(1, floor(q_e))`. If `sum k_e < 6144`, add 1 to the edges with the largest `q_e - floor(q_e)` until equal. If `sum k_e > 6144`, subtract 1 from edges with the largest `k_e` (never below 1) until equal. Assert equality.
6. **Emit.** Edge `e` from node `a` to node `b` with `k_e` lanes: lane `s` covers `t in [s / k_e, (s + 1) / k_e]`, 8 points evenly spaced on that interval, `y = 0`. Class 3 for arterial, else 2. Record per edge `{a, b, length, laneStart, laneCount, arterial}`; lanes of an edge are contiguous ids in the order `a` to `b`.
7. **Side data posted with the layout:** `nodes: Float32Array(x, z)`, `edges` as above, adjacency lists.

### 3.2 Camera and framing

Fine: camera `(0, 30, 21)` looking at `(0, 0, 1.5)`, fov 34, no shift (the legend slip is opaque and may cover map). Coarse: `(0, 34, 18)`, fov 42, shift `+0.18` in y so the map's center rides above the bottom slip. Idle drift: pos and target translate together by `(3 sin(2 pi t / 40), 0, 2 sin(2 pi t / 40 * 0.7))`.

### 3.3 Readout (variant `leaflink`, the legend slip)

C-LL-H1 (display-1), C-LL-P1, C-LL-FACTS, C-LL-STACK, C-LL-CODE (link), then a hairline rule, then C-LL-LEGEND with three inline glyphs drawn in CSS (a 10px ink ring, a 10px ink dot, a 16px by 3px ink bar) each before its word, then C-LL-SIM, then the `OfferButton` (C-LL-OFFER, Astryx `Button variant="secondary" size="sm"`). World region `aria-label` C-LL-ALT.

## 4. The simulation (`src/world/leaflink.ts`, main thread controller)

Deterministic: its own `rng(seed + 7)`. Same seed, same first minute of events (screenshot tests rely on it).

- **Spawn.** Next event after a uniform delay in `leaflinkEventIntervalMs` `[1000, 1600]`. Kind: request with probability `requestFraction` 0.55, else offer. Position: a random node at least 2 hops from every existing pin. Skip the spawn (reschedule) if `maxPins` 24 pins exist.
- **Landing.** Pin scale from `dropScaleFrom` 1.6 to 1 and opacity 0 to 1 over `--duration-medium-min` (200ms), `easeSignature`. A ripple ring expands from 1x to `rippleScaleTo` 3x pin radius with alpha from 0.4 to 0 over `--jp-duration-ripple` (900ms), `easePlain`.
- **Match.** After landing, find the nearest open pin of the opposite kind by Dijkstra on edge length, giving up beyond `matchMaxHops` 9 hops. If found and fewer than `maxMatches` 6 matches are in flight: convert the node path to a lane list (for each edge in order, its lanes in traversal order; reverse order and negative rate when the path runs `b` to `a`). For each lane: `start = tNow + arcBefore / routeSpeed`, `uPerSec = routeSpeed / laneLength` (signed), `fadeAt = tEnd + holdMs / 1000`, where `routeSpeed = 6` units per second and `tEnd` is when the last lane finishes. Call `setActivity(lanes, start, fadeAt, 1, uPerSec)`.
- **Answered.** At `tEnd`, both pins grow an ink-tint halo disc from 0 to 2.2x pin radius over `--duration-medium` (300ms), `easeSignature`. Hold `holdMs` 4000. Then route (shader fade, `uFadeSec = fadeMs / 1000`), both pins and halos fade over `fadeMs` 600, `easePlain`, and are removed.
- **Unmatched pins** stay until matched; if a pin is older than 20s it fades out like a matched one (keeps the map from silting up).

### 4.1 Pins and halos (draw calls: pins 1, halos 1, ripples 1)

Each is an `InstancedMesh` of a unit quad lying on `y = 0.01`, with a tiny shader that sizes it in screen space: project the center, offset corners by `radiusPx * scale * uDpr` device pixels. Fragment draws an SDF: request ring (annulus inner 0.62, outer 1.0), offer dot (disc), halo (disc, ink tint), ripple (annulus inner 0.86, outer 1.0). Colors are ink and ink tint, premultiplied over, same blending as lanes. Draw order: halos, lanes (already drawn), ripples, pins (set `renderOrder`). Pin radius `pins.radiusPx` 7 CSS px fine, 8 coarse.

## 5. Interaction

- **Drop an offer (pointer).** `pointerup` on the canvas region with total movement under 6 CSS px and duration under 500ms (a tap, not a drag): `screenToGround`, snap to the nearest node, place a visitor offer there (lands like any pin), then match it to the nearest open request with no hop limit. If no request is open, spawn one 3 to 6 hops away immediately (it lands first), then match. The response is guaranteed and starts within one frame.
- **Drop an offer (keyboard and assistive tech).** `OfferButton` does the same at the node nearest the map center. Announce nothing extra; the legend explains the drawing.
- Canvas region `pointer-events: auto` on this scene only where no DOM is on top; the legend slip and keymap take their own events.
- The visitor's pins obey the same caps; if `maxMatches` is reached, the oldest match fades immediately to make room.

## 6. Motion table

| Phase | What | Duration, easing, trigger |
|---|---|---|
| Entry (travel in) | Lanes flatten into streets; ground goes void (or field) to paper on plain ease; camera rises to the map pose. Simulation resumes at t = 700 with one event scheduled 300ms later so something lands soon. | 700ms expo-out; 700ms ease for ground |
| Idle | Spawns, landings, ripples, routes, halos, fades (section 4). Camera drift. | Heartbeat cadence |
| Interaction | Tap or OfferButton (section 5). Button press state is Astryx default. | Response next frame |
| Exit | Controller pauses: no new spawns; existing pins and routes freeze in place and fade with `uW.y`. On return, they resume. | With travel |
| Reduced motion | Static map: place the first 6 pins and complete the first 3 matches of the seeded sequence instantly (routes fully drawn, halos full), no spawns, no ripples, no drift. Tap and OfferButton still work; routes appear fully drawn at once. | Static |

## 7. Content

S09 IDs: C-TITLE-LEAFLINK, C-LL-H1, C-LL-P1, C-LL-FACTS, C-LL-STACK, C-LL-CODE, C-LL-LEGEND, C-LL-SIM, C-LL-OFFER, C-LL-ALT. The scene shows no text. Pins carry no labels, categories or names (LeafLink's real categories are UNKNOWN; inventing "groceries" or "ladder" would be fabricating product detail).

## 8. Kill criteria

- K-LL-1: any count, stat, name, category, place name or label on the map.
- K-LL-2: any orange, copper or warm accent hue (warmth must come from paper and timing).
- K-LL-3: the map looks like a Leaflet or OpenStreetMap screenshot, or uses tiles or a marker icon.
- K-LL-4: spawns are periodic (interval variance of the first 30 spawns is zero, or any two consecutive intervals are equal to the millisecond).
- K-LL-5: a tap does not produce a route within 1 frame plus the landing time.
- K-LL-6: the graph is disconnected (some tap can find no request).
- K-LL-7: hue budget over `hueBudgetPct.leaflink` (10%).

## 9. Receipts

| Test | Claim | How |
|---|---|---|
| T-LL-1 | Exactly 6,144 lanes, connected graph | worker unit test: lane total, union-find single component |
| T-LL-2 | Deterministic first minute | record the first 20 events (kind, node, time) twice from fresh loads: identical |
| T-LL-3 | Tap responds | Playwright taps the map center; within 300ms a route lane has activity start time at or before `now()` and a visitor pin exists |
| T-LL-4 | Keyboard path | focus OfferButton, press Enter: same as T-LL-3 |
| T-LL-5 | Legend slip contrast | all slip text pairs pass (paper.text, paper.text2 on paper.raised are in the receipt table) |
| T-LL-6 | No labels in scene | the scene graph contains no troika `Text` while `uW.y > 0.99` |
| T-LL-7 | Hue budget | G-HUE: under `hueBudgetPct.leaflink` (10%) of pixels with OKLCH chroma above 0.04, after 30s of simulation |

## 10. Unknowns

U-LL-1: LeafLink's real request and offer categories, UI and screenshots: UNKNOWN, not depicted. U-LL-2: "mutual aid" versus the older "event discovery" description (S09 D-LEAFLINK-KIND), for Justin to confirm. U-LL-3: whether LeafLink is still running: UNKNOWN; copy uses "Simulated feed" and never claims it is live now.

## 11. Changelog

- 1.0.0, 2026-10-30: initial.
