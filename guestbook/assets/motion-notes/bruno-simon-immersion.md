# Bruno Simon Immersion Study (2026-10-04)

Direct browser exploration FAILED: bruno-simon.com loads ("Bruno's", "Let's play" / "See the original") but the heavy WebGL scene crashes the remote Chromium renderer (browser_renderer_unresponsive). Studied instead via the Boring Websites Blog deep-dive (updated 3 days ago): https://boringwebsites.blog/posts/bruno-simon-the-portfolio-you-drive-a-car-around

Note: the blog claims the source is public on GitHub under MIT, but the GitHub API 404s on bruno-simon/folio (verified 2026-10-04). The blog is stale on that point or the repo moved. No code to study; patterns below are behavioral.

## The mechanics

- **Vehicle as interface.** Visitor gets a toy car + physics engine (Rapier). Projects, about text, contact details are parked around a small 3D world as physical monuments/signposts. Driving into one opens the relevant link. "The portfolio is not displayed so much as discovered, one collision at a time."
- **Entry.** Car in an almost-empty plane, one line of intro text, no menu bar. "There is a car, and there are arrow keys."
- **Camera.** Above-and-behind bird's-eye follow cam. Readable for someone who has never touched a driving game.
- **Controls.** Arrows/WASD to drive, space to jump, enter to interact, touch on mobile, full gamepad mapping. Flat learning curve: "Discovery does the teaching."
- **Game-feel systems.** Achievements for milestones, leaderboard for a small racing circuit, "whispers" visitor message board, easter eggs (drive off the edge, bowling pins, shrines to each social account), a global counter ticking each time a visitor flings their car into oblivion.
- **Sound.** Engine note, collision knocks, background music (Howler.js, music by Kounine, permissive licence). The world has weight.
- **Perf discipline.** Matcaps (baked lighting into textures) instead of real-time lights, modest object count, an options menu to dial quality/audio/renderer. Runs on cheap phones. "A 3D toy that only ran on powerful hardware would have stayed a niche curiosity."
- **Tech.** Three.js rendering, Rapier physics, Howler audio. Awwwards SOTM + Site of the Year 2020.

## The lesson (the part that transfers)

- "A portfolio can be a place, not a document." People remember places they moved through; they never remember a page they scrolled.
- "The website stops describing the work and simply becomes it." The proof of skill is the thing the visitor is already using. For Justin: the thesis "I build systems and prove they work" is proven BY the site being a verified system.
- The gap between looking and doing is the entire design. "A visitor who does nothing at all still sees a tidy little diorama. A visitor who presses a key is suddenly inside it."
- The honest tradeoff: a portfolio you must drive asks more of the visitor; screen-reader users are poorly served. Simon judged memorability worth the friction. Justin's call: immersion WITHOUT the friction — awesome, not a game.

## Stealable patterns for the v2 brief (no game mechanics required)

1. Persistent 3D place across the whole visit (not a hero widget). Routes = locations in the place; navigation = moving through it.
2. Content as spatial destinations: each dossier a distinct 3D vignette you "arrive at" via camera transition, not a hard cut.
3. HUD-like 2D overlay that never competes: the terminal is already this. Keep it.
4. One verb, zero instructions: scroll is the only input. No tutorial, no tour, no nagging.
5. Small payoffs for the curious: easter eggs in the terminal (`verify` already hints at this), hidden interactions in the 3D.
6. Perf as a feature: baked looks over real-time expense, modest object counts, quality scaling, reduced-motion = static diorama (still tidy, still complete).
7. Sound is optional weight — skip it unless it serves; the site must be complete silent.
