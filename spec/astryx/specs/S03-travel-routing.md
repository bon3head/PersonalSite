# S03 Travel and routing: one space, four addresses

Version 1.0.0, 2026-10-30. Depends on: S00, S02 (API only; S03 can be built against a stub), DESIGN.md section 6. Blocks: S04, S05 to S08, S10, S11.

## 1. Purpose

The visitor moves between scenes without a reload. Each scene has a real URL (deep links, back and forward work, the page is shareable), but a URL change is a camera move and a lane re-formation inside the same world, never a navigation. This spec owns the router, the travel choreography between DOM and world, focus and announcements, and the prerendered HTML for every address.

## 2. Routes

| Path | Scene | Layout | Regime | Title (S09) |
|---|---|---|---|---|
| `/` | Server | `server` | `void` | C-TITLE-SERVER |
| `/leaflink` | LeafLink | `leaflink` | `paper` | C-TITLE-LEAFLINK |
| `/sidequests` | SideQuests | `sidequests` | `field` | C-TITLE-SIDEQUESTS |
| anything else | Not found | `scatter` | `void` | C-TITLE-404 |

Sheets are not routes. `#whoami` and `#contact` in the URL open the matching sheet over the current scene on load and are written to the URL when a sheet opens (`history.replaceState`, so closing a sheet does not cost a back press). Trailing slashes normalize to no slash. Uppercase normalizes to lowercase.

Scene order for adjacency keys: server (1), leaflink (2), sidequests (3). The 404 scene is outside the order.

## 3. Router (`src/router.ts`)

- State: `{scene: SceneId, sheet: 'whoami' | 'contact' | null}`.
- `go(scene)`: if `scene === current`, do nothing. Otherwise `history.pushState({scene}, '', path)`, then run travel (section 4).
- `popstate`: read `location.pathname`, run travel to that scene without pushing.
- Internal links are `<a href="/leaflink">` (real anchors, work with JS off). A click handler on the document intercepts same-origin clicks on anchors with `data-route`, unless a modifier key is held or the button is not the primary one, and calls `go`.
- On first load the scene comes from `location.pathname`; the world starts directly in that layout (`createLanefield({initial})`), no intro travel.

## 4. Travel choreography (the one transition)

Times are from the moment of input (`t = 0`). Durations come from DESIGN tokens.

| t (ms) | DOM | World |
|---|---|---|
| 0 | Keymap target item turns accent (`--duration-fast`, ease). Old readout starts fading: opacity 1 to 0, `--duration-fast`, ease. `aria-busy=true` on the readout region. | `travelTo(target)` starts: lane weights and camera pose tween over `--jp-duration-travel` (700) with `easeSignature`. Clear color tweens over 700 with `easePlain`. |
| 150 | Old readout removed from the accessibility tree (`hidden`). | |
| 350 | `<html data-regime>`, `color-scheme`, `<meta name=theme-color>` switch to the target regime. `document.title` updates. | Ground is halfway between regimes in luminance at this point (plain ease is symmetric near the middle), so the DOM text color flip lands where the old and new text colors are both low-contrast but no text is visible (readout hidden since 150). |
| 400 | New readout enters: opacity 0 to 1 and translateY 8px to 0, `--duration-medium` (300), `easeSignature`. | |
| 700 | | Travel resolves. Scene controller for the target starts its ambient loop; the previous controller has paused at t = 0. |
| 700 | `aria-busy=false`. Focus moves to the new readout's heading (`tabindex=-1`, `focus({preventScroll: true})`) only if focus was inside the old readout or on the keymap. The `aria-live=polite` region announces the new H1 (C-SR-TRAVEL). | |

Rules:
- **Interruptible.** A new `go()` during travel cancels the DOM timers, keeps the current lane weights and camera pose as the new start, and travels to the new target with a fresh 700ms. Weights stay normalized. No queueing, no waiting.
- **One dominant element.** Nothing else animates between 150 and 400 except the world.
- **Input never blocked.** Keys and taps work during travel.
- **Reduced motion.** World cuts instantly (`travelTo(target, {instant: true})`). DOM: old readout fades out over `--duration-fast`, regime switches at 150, new readout fades in over `--duration-fast` with no translate. Total 300ms, all opacity.
- **No world (WebGL2 missing).** The poster image crossfades with the readout using the reduced-motion timing, whether or not reduced motion is on.

## 5. Scene controllers

Each scene module in `src/world/` exports `{id, start(lf: Lanefield), pause(), resume(), reduced(on: boolean)}`. The travel module calls `pause()` on the outgoing controller at t = 0 and `resume()` on the incoming one at t = 700 (or immediately on instant travel). Controllers must be idempotent and must not allocate per frame.

## 6. Keyboard

Bindings registered once with Astryx `useHotkeys` (S04 owns the visual Keymap):

| Key | Action |
|---|---|
| `1` `2` `3` | `go('server' / 'leaflink' / 'sidequests')` |
| `ArrowLeft` / `ArrowRight` | previous / next in scene order, wrapping; from 404, `ArrowRight` goes to server |
| `w` | toggle WhoamiSheet |
| `c` | toggle ContactSheet |
| `Escape` | close the open sheet (BottomSheet handles this itself; do not double-handle) |

Bindings are disabled while a sheet is open, except `Escape` and the sheet's own key (`isDisabled` on the entries). They are never active inside inputs (there are none, but the Astryx default protects future ones).

## 7. Prerender (`tools/prerender.mjs`)

After `vite build`, render the React app to string for each of `/`, `/leaflink`, `/sidequests` and the 404 with `react-dom/server` `renderToString`, inject into `dist/index.html`'s `#root`, set `<title>`, `<meta name=description>`, `<html data-regime>` and `style="color-scheme"`, and write:

- `dist/index.html` (server), `dist/leaflink/index.html`, `dist/sidequests/index.html`, `dist/404.html`.

The client hydrates with `hydrateRoot`. Hydration must not change any text (React reports mismatches in dev; T-S03-5 fails on any `console.error` during hydration). Static hosting serves `404.html` for unknown paths with status 404. Hosting is configured by the deployer (Claude never deploys); the build only emits these files.

## 8. Kill criteria

- K-S03-1: any route change causes a document load (Playwright: `page.on('framenavigated')` fires for the main frame after the first load).
- K-S03-2: back or forward leaves the URL and the scene out of sync.
- K-S03-3: travel ever waits for something (a fetch, a shader compile, a font) before the lanes start moving.
- K-S03-4: text visible on screen at less than its contrast requirement at any sampled frame of a travel (G-TRAVEL-CONTRAST: Playwright samples screenshots every 50ms through a server-to-leaflink travel and checks that any pixel region with readable text has its required contrast against the pixels behind it; the readout is hidden between 150 and 400ms, so this should be trivially true).
- K-S03-5: a deep link to `/sidequests` shows any other scene's readout, even for one frame.

## 9. Receipts

| Test | Claim | How |
|---|---|---|
| T-S03-1 | No reload | K-S03-1 check across 20 random `go` calls |
| T-S03-2 | Deep links | load each of the four paths directly; readout H1, `data-regime`, `__lanefield.weights()` one-hot index, and `document.title` match section 2 |
| T-S03-3 | History | `/` then `2` then `3` then back, back: URL `/`, scene server; forward: `/leaflink` |
| T-S03-4 | Interruptible | press `2`, wait 200ms, press `3`; travel ends on sidequests by 900ms after the second press; weights normalized throughout |
| T-S03-5 | Clean hydration | zero `console.error` on each prerendered path |
| T-S03-6 | Feedback under 250ms | timestamp keydown to the first frame where keymap item color changed and `weights()` moved: under 250ms on the CI runner (long-task-free) |
| T-S03-7 | Focus and announce | with focus on the keymap, press `2`; after 700ms `document.activeElement` is the LeafLink H1 and the live region text is `LeafLink` |
| T-S03-8 | Reduced motion timing | with `reducedMotion: 'reduce'`, travel completes (new readout fully opaque) within 320ms and `weights()` is one-hot within one frame |

## 10. Unknowns

None.

## 11. Changelog

- 1.0.0, 2026-10-30: initial.
