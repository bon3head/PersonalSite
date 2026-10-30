# S07 Scene: SideQuests, community engagement (`/sidequests`)

Version 1.0.1, 2026-10-30. Depends on: S02, S03, S04, S09, DESIGN `world.sidequests`, `world.camera.sidequests`, `motion.spring`. Blocks: S10 poster, S11 scene gates.

## 1. Purpose

SideQuests turned a campus into a place people show up to. This scene is a chalk plan of a campus on blueprint blue, built from the same 6,144 lanes: a faint grid, building outlines with hatching, curved walkways, and three dashed quest trails leading from a trailhead to three markers. Tap a marker and its trail lights up dash by dash from the trailhead, the camera leans along with it, and the marker plants itself. It is the playful scene: the one place on the site where things overshoot.

## 2. Visual identity

- Ground: field `#10294E`, the accent family used as the ground (the only scene where hue is the field). Chalk `#F5F1E9` for lines, chalk 2 for secondary, signal blue only on lit trails and claimed markers (under 6% of pixels).
- Vocabulary: architectural plan, not a game map. Grid at 10%, outlines at 85%, 45-degree hatching at 22%, walkways at 45%, trails as dashes at 55%, lit trails at 100% with a signal rim.
- Motion: spring and wander. Markers bob on slow sines with different phases; a claimed marker drops into place with one overshoot (damping ratio 0.7); trails are curves, never straight.
- Not a game HUD: no score, no XP, no badges, no progress bar, no quest names (the real quests are UNKNOWN), no completion message.

## 3. Layout

### 3.1 Plan generator (`src/world/layouts/sidequests.ts`, worker)

Use `rng(seed + 2 * 1000003)`. Plane `y = 0`, extent 36 by 28 centered at the origin (`x in [-18, 18]`, `z in [-14, 14]`).

1. **Grid (2,080 lanes, class 4).** Vertical lines at `x = -18, -17, ..., 18` (37 lines), each split into 28 lanes of length 1 along z. Horizontal lines at `z = -14, ..., 14` (29 lines), each split into 36 lanes of length 1 along x. `37 * 28 + 29 * 36 = 2080`.
2. **Buildings (11).** Rejection-sample axis-aligned footprints inside `x in [-16, 16]`, `z in [-12, 10]` (the strip `z > 10` stays open for the trailhead). Width and depth uniform in `[2.0, 6.5]`. With probability 0.35 the footprint is an L: remove one corner rectangle whose sides are 30% to 50% of the footprint's sides. Bounding boxes keep `minGap` 1.2 apart. Up to 500 attempts; if fewer than 11 fit, restart the whole step with `rng(seed + 2 * 1000003 + attempt)`. Each building gets one entrance at the midpoint of its edge that faces the most open space (largest distance to the nearest other footprint along the edge normal).
3. **Outlines (class 5).** Each footprint edge of length `L` is split into `max(1, round(L / 0.5))` straight lanes.
4. **Walkways (class 7).** Build the minimum spanning tree over the 11 entrances (Euclidean). Keep its 9 shortest edges. Each walkway is a centripetal Catmull-Rom through: entrance A, `lerp(A, B, 0.33) + n * o1`, `lerp(A, B, 0.66) + n * o2`, entrance B, where `n` is the unit normal of AB and `o1, o2 = (r() * 0.15 + 0.15) * |AB| * (r() < 0.5 ? -1 : 1)`. If sampled points fall inside any footprint, flip the offset signs; if still inside, use a straight line. Split by arc length into lanes of about 0.4 units (`count = max(1, round(arcLength / 0.4))`); each lane's 8 points are sampled along its arc interval, so walkway lanes are curved.
5. **Markers (3) and trails (class 8).** Trailhead `start = (0, 0, 13)`. Candidate marker points: every integer grid point in the building region that is at least 0.8 from any footprint and at least 8 from the start. Pick 3 by seeded farthest-point sampling (first pick random, then the candidate maximizing the minimum distance to picks so far), requiring at least 9 units between markers. Each trail is a centripetal Catmull-Rom through `start`, three waypoints at `lerp(start, marker, f) + perp * (r() * 2 - 1) * 3` for `f = 0.25, 0.5, 0.75` (nudged 0.8 out of any footprint they land in), and the marker. Cut by arc length into dashes: dash 0.3, gap 0.2; each dash is one lane with 8 points on its arc. Keep each trail's lane ids in order from start to marker.
6. **Hatch (class 6), the remainder.** `N = 6144 - (2080 + outlines + walkways + trails)`; assert `N > 0`. Inside each footprint polygon, generate 45-degree lines at spacing 0.35, clip to the polygon, giving segments. If the segment count exceeds `N`, multiply spacing by 1.1 and retry. Allocate exactly `N` lanes across segments by length with the S06 step 5 algorithm (quota, `max(1, floor)`, distribute remainder, trim excess). Assert the grand total is 6,144.
7. **Side data:** marker positions, the three trails' ordered lane id lists with per-lane arc start and length, footprints (for tests).

Expected counts with the default seed (record actuals in the build state file): outlines about 400, walkways about 600, trails about 180, hatch about 2,880.

### 3.2 Camera and framing

Fine: camera `(6, 24, 16)` looking at the origin, fov 36, shift `-0.18` NDC in x (the plan sits left, the trailhead readout right). Coarse: `(3, 30, 14)`, fov 46, shift `-0.22` in y (plan lower, readout top). Idle yaw `±2 deg` over 30s.

**Readability rule:** only grid lanes (class 4, 10% alpha) may appear behind the readout box. T-SQ-3 checks the worst-case text contrast against the actual pixels.

### 3.3 Markers (`src/world/sidequests.ts`)

Three markers, one `InstancedMesh` for heads and one for poles (2 draw calls). Head: `OctahedronGeometry(0.35)` scaled y by 1.4, flat two-tone with no lighting: vertex colors chalk on the upper four faces, chalk 2 on the lower four (`MeshBasicMaterial({vertexColors: true})`). Pole: `CylinderGeometry(0.02, 0.02, 0.8, 6)` in chalk 2. The head sits on top of the pole, `y` from 0.8 plus bob. Claimed: head color uniform switches both tones to signal and signal dim.

**DOM twins are the hit targets.** Three `<button>`s (Astryx `Button variant="ghost" isIconOnly`, `label` C-SQ-MARKER, `aria-pressed` reflects claimed) absolutely positioned over each marker's projected head position every frame (`transform: translate(x, y)` only), 44 by 44 CSS px, transparent, focus ring visible on `:focus-visible`. No canvas hit testing is needed in this scene.

### 3.4 Readout (variant `sidequests`, the trailhead sign)

C-SQ-H1 (display-1), C-SQ-P1, C-SQ-FACTS, C-SQ-VENUE, C-SQ-CODE (link), C-SQ-HINT (pointer-appropriate variant). Dashed chalk outline per S04. World region `aria-label` C-SQ-ALT.

## 4. Motion

| Phase | What | Duration, easing, trigger |
|---|---|---|
| Entry (travel in) | Lanes loosen into the plan; ground to field (plain ease); camera to the plan pose. Markers rise from `y = 0` to rest with the spring (staggered 80ms apart) after travel resolves. | 700ms expo-out; spring 0.7 / 3.2Hz |
| Idle | Marker bob `0.06 * sin(2 pi t / 2.4 + phase_i)`, phases `0, 2.1, 4.2` rad. Camera yaw. | Sine, linear time |
| Hover (fine pointer) | Hovered twin: marker head lifts 0.15 units by spring; cursor pointer. Leaving returns it by spring. | Spring |
| Walk (tap, click, Enter or Space on a twin) | `setActivity(trailLanes, start_i = now + arcStart_i / 14, fadeAt 0, kind 2, uPerSec = 14 / laneLength_i)`; the first dash lights on the next frame. Camera target damps toward the current drawing point with weight 0.25 (half-life 400ms) while drawing, then back to the pose. | 14 units per second; first feedback under one frame |
| Claim (trail fully drawn) | Marker head color to signal over `--duration-fast` ease; head drops from `y + 0.6` to rest by spring (one overshoot, about 4.6% of 0.6 below rest). `aria-pressed=true`. | Spring |
| Re-walk a claimed marker | Clear that trail's activity and walk again. | As walk |
| Exit | Controller pauses; trails stay lit (state is kept for the visit); markers sink to `y = 0` with `uW.z`. | With travel |
| Reduced motion | No bob, no yaw, no hover lift. Walk lights the whole trail at once (`uPerSec` very large) and claims instantly; colors switch without transition. | Static |

Claimed state lives in memory for the visit only. Nothing is stored.

## 5. Content

S09 IDs: C-TITLE-SIDEQUESTS, C-SQ-H1, C-SQ-P1, C-SQ-FACTS, C-SQ-VENUE, C-SQ-CODE, C-SQ-HINT, C-SQ-MARKER, C-SQ-ALT. No text in the scene.

## 6. Components

| Thing | Start from | Notes |
|---|---|---|
| Plan lanes | S02 Lanefield | layout `sidequests` |
| Markers | three.js `InstancedMesh`, `OctahedronGeometry`, `CylinderGeometry`, `MeshBasicMaterial` | no lights in the scene |
| Marker twins | Astryx `Button variant="ghost" isIconOnly` | the visual is the 3D marker; the button is the target and the focus ring |
| Readout | S04 `Readout variant="sidequests"` | |

## 7. Kill criteria

- K-SQ-1: any score, badge, XP, progress bar, quest name, or "you did it" message.
- K-SQ-2: overshoot anywhere other than marker position (never on color, opacity, or the camera).
- K-SQ-3: any trail is straight or any two trails overlap for more than 2 units.
- K-SQ-4: a marker can only be operated by pointer (twins missing or unfocusable).
- K-SQ-5: anything but grid lanes behind the readout.
- K-SQ-6: signal pixels over 6% with all three trails lit.

## 8. Receipts

| Test | Claim | How |
|---|---|---|
| T-SQ-1 | Exact allocation | worker unit test: grid 2,080, total 6,144, hatch N matches, 11 buildings, 3 markers at least 9 apart |
| T-SQ-2 | Walk feedback | Playwright clicks twin 1; on the next rAF the trail's first lane has `start <= now()`; after `length / 14 + 0.2` s, `aria-pressed="true"` |
| T-SQ-3 | Readout contrast | screenshot; for each text line box, compute contrast of the text color against the lightest pixel behind it (render once with readout hidden): at least 4.5 |
| T-SQ-4 | Spring numbers | sample marker head y during claim: minimum is between 0.020 and 0.035 below rest, settles within 0.005 by 0.6s |
| T-SQ-5 | Keyboard | Tab to twin 2, Enter: same as T-SQ-2 for trail 2 |
| T-SQ-6 | Hue budget | all trails lit, G-HUE signal fraction under `hueBudgetPct.sidequestsSignal` (6%) |

## 9. Unknowns

U-SQ-1: SideQuests' real quests, campus, UI and stack beyond the win: UNKNOWN, not depicted (markers are unlabeled; the plan is generic, not SUNY New Paltz). Venue and 24-hour MVP (C-SQ-VENUE) shown per Justin, 2026-10-30.

## 10. Changelog

- 1.0.0, 2026-10-30: initial.
- 1.0.1, 2026-10-30: C-SQ-VENUE always shown (Justin).
