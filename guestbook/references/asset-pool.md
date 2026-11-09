# Asset pool — surfaces Claude can pull from and transform

A deep pool of assets for the guestbook build. Each entry names what it offers, where it lives in this repo, and how to transform it. GLITTERBOX is deliberately NOT in this pool (axed 2026-11-09: the guestbook is entropic and 3D, not glitter).

## 1. Lusion motion system (the motion reference)

- **Files:** `guestbook/references/lusion-style-brief.md`, `guestbook/assets/lusion-p0-motion-tokens.json`, `guestbook/assets/lusion-p0-motion.css`, `guestbook/assets/lusion-p0-design-tokens.json`
- **Source:** design-extract run 2026-11-09 (12-stage fusion pipeline, `--motion-runtime` on) on lusion.co, lusion.co/projects/everswap, lusion.co/projects/spatial_fusion. VERIFY manifest exit 0.
- **What it offers:** Two-easing system (`cubic-bezier(0.35, 0, 0, 1)` dominant, 32 uses; `cubic-bezier(0.4, 0, 0.1, 1)` soft, 26 uses). 400ms default duration (39 of 75 declarations). Transform dominates (46 of 75 animate transform; color 20, background 12, opacity 5). Long moves slow and staggered (menu-open 5000ms, parallax 3000ms linear with 150ms stagger over 5 items). Pill CTAs (88px radius, dot + arrow that slides on hover). One accent per page. Huge tight sentence-case type (38.4px display base).
- **How to transform it:** Steal the motion system (the two beziers, 400ms default, transform-dominant, staggered long moves), not the hexes or the hero. Apply the beziers to the camera dolly and the lane depth moves. Apply the stagger to the lane parting (150ms stagger over the lanes that part around the sheet).
- **Do not copy:** Lusion logo and wordmark, project photography and video stills, the Aeonik font files (substitute an open grotesque), the WebGL hero scenes, project case-study copy.

## 2. Oklou 3D boot sequence (the 3D camera choreography)

- **File:** `guestbook/assets/motion-notes/oklou-motion-notes.md`
- **Source:** design-extract run 2026-10-04 (36 files, exit 0, site rendered for real, boot/tuning sequence captured via timed Playwright frames).
- **What it offers:** Radio tuning into a 3D space. Choreography: pre-start gate (giant glowing segmented TUNER, start button as the audio-unlock gesture), loading (thin progress bar), fade to full black (~2s, a hard transition beat), 3D tuner fades in (seven-segment FM display, curved blue EQ arc, LED dots), auto-sweep (frequency digits roll on their own, no input required), camera push-in (dollies toward the display mid-sweep), lock-in (display resolves to "FM OK.00" then "AM OKLOU" — noise becomes identity), pull-back reveal (camera pulls to wide, tuner small in the distance). The long cinematic motion lives in the 3D intro, not the DOM. Durations: xs 0.15s, md 0.3s, lg 0.5s (a tighter, snappier register than utazon's 1.8s reveals).
- **How to transform it:** Steal the camera choreography for the guestbook: push-in on open (dolly toward the field), lock-in on sign (the mark resolves from noise into identity), pull-back to wide after signing. The "noise becomes identity" payoff is the signing moment. Do not copy the radio tuner or the audio.

## 3. Bruno Simon 3D (discovery by moving through space)

- **File:** `guestbook/assets/motion-notes/bruno-simon-immersion.md`
- **Source:** design-extract run 2026-10-04 (studied via the Boring Websites Blog deep-dive; the live site crashed the remote Chromium renderer).
- **What it offers:** Vehicle as interface. Visitor gets a toy car + physics engine (Rapier). Projects, about text, and contact details are parked around a small 3D world as physical monuments/signposts. Driving into one opens the relevant link. Camera is an above-and-behind bird's-eye follow cam. Controls are arrows/WASD, space to jump, enter to interact, touch on mobile. Perf discipline: matcaps (baked lighting into textures) instead of real-time lights, modest object count, an options menu to dial quality. Tech: Three.js, Rapier, Howler. Awwwards SOTM + Site of the Year 2020.
- **How to transform it:** Steal the idea that the visitor discovers by moving through 3D space, and the perf discipline (no real-time lights, modest object count, no second renderer). The guestbook mark is a monument in the field that the visitor places by moving through it. Do not copy the car, the physics engine, or the driving controls.

## 4. Utazon and Cleanlystudio (the ease convergence)

- **Files:** `guestbook/assets/motion-notes/utazon-motion-notes.md`, `guestbook/assets/motion-notes/cleanlystudio-motion-notes.md`
- **Source:** design-extract runs 2026-10-04.
- **What they offer:** The Material-standard ease convergence (`M0,0 C0.4,0 0.2,1 1,1`, the same ease as oklou's dominant ease) and the reversible scroll reveal pattern (scroll batch-reveals at 'top 85%', toggleActions 'play none none reverse'). Utazon's reveals are 1.8s (longer, more cinematic); oklou's are 0.5s (tighter, snappier).
- **How to transform it:** Use the reversible reveal pattern for the sheet's open/close (play on open, reverse on close). The ease convergence confirms the Lusion soft bezier is the right family; do not add a third easing.

## 5. Astryx design substrate (the floor)

- **File:** `guestbook/references/astryx-design-spec.md`
- **Source:** local-astryx-design skill, SPEC written 2026-10-18.
- **What it offers:** Astryx (Meta's MIT design system, CLI-first) as the design substrate. Load-bearing decisions: Astryx is the FLOOR, design-extract is the CEILING (extract-first ordering; Astryx never replaces reference extraction). Raw templates are banned as shipped output. Substrate-invisibility is an explicit rule (default accent, default neutral theme, and default radius/easing ladder may not ship unmodified). Version pinning is mandatory (CLI beta 0.7.1 verified 2026-10-18).
- **How to transform it:** Use Astryx tokens/components for discipline (the token system, the component structure), but the style brief (Lusion, oklou, bruno-simon) gives the taste. Do not ship the default Astryx accent, theme, or radius/easing ladder unmodified.

## 6. The site's own 3D field (the material)

- **Files (in the repo):** `src/world/camera.ts`, `src/world/layouts/server.ts`, `src/world/lanefield.ts`, `spec/astryx/DESIGN.md` (section 12 token block, section 6.13 GLITTERBOX — not used here)
- **What it offers:** One WebGL canvas, 6,144 lanes, one draw call. Lanes have x/y/z positions; the camera has a position, target, and field of view. The coarse server camera (DESIGN 1.4.0): pos [-3.5, 5.0, 12.0], target [0.3, 0.0, -3.0], fovDeg 52, shiftNdc [0.0, -0.3], pitch -17.91. Morphs between 3D scene layouts (server, leaflink, sidequests, scatter). Travel 700ms, wordCadence 1600ms.
- **How to transform it:** The guestbook uses this camera and this field. No second WebGL context, no second renderer. The sheet opens as a camera move (dolly in), the lanes part in 3D (z-translation with a seeded random depth offset), the signature is a 3D mark at a depth in the field. The entropy seed drives the depth offsets and the camera drift.

## What is NOT in this pool (axed)

- **GLITTERBOX.** Axed 2026-11-09 by Justin's direction. The GLITTERBOX views (ascii, automata, bio, chaos, fractal, glitter, moire) and the 31 palettes are not in this pool and are not to be used for the guestbook. GLITTERBOX is a separate mode of the site (press-and-hold to scatter, DESIGN 6.13); it does not belong in the guestbook. The guestbook is entropic and 3D, not glitter.
