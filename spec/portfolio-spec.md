# Portfolio Spec: Justin Poli — "The Engineer Who Verifies"
Status: DRAFT (pending design-extract tokens, then Claude review R1)
Date: 2026-10-04
Owner: Justin Poli (justinf0829@gmail.com, (631) 835-5490, Smithtown, NY)

## 0. Judgment calls (flagged, not smoothed)
1. Reference sites for design-extract were chosen by Cipher, not Justin: bruno-simon.com and corentinbernadou.com (both Awwwards SOTD, portfolio genre, three.js + GSAP). A third candidate (Hiroto Sato) was dropped after its domain resolved to a ceramic artist. Justin or Claude may veto or swap these; the design token section is swappable without touching IA or features.
2. Single self-contained HTML file (inline CSS/JS, embedded font subset, CDN-pinned three.js r186 + GSAP via importmap). Rationale: byte-verifiable deploy, zero build step, matches the proven vercel-demo-launch pipeline. Trade-off: no framework; all component logic is hand-rolled and must pass the standard-implementations reference.
3. Project roster stays locked to LeafLink + SideQuests per GOAL.md. A third "lab shelf" slot (e.g., playable sudoku lie detector) is specced as OPTIONAL and clearly marked; adding it needs Justin's explicit call.
4. Contact form ships with a pluggable endpoint adapter and a mailto + copy-email fallback. No backend is wired at launch; wiring needs Justin's explicit approval (Day-1 trust boundary: no outbound without absolute approval).
5. Codeberg (https://codeberg.org/bon3head) is the canonical code URL on the site, per his 2026-10-02 recruiting preference. GitHub bon3head is linked secondarily. No live repo stats: the GitHub API repo count was removed (copy deck v2.3 amendment, 2026-10-04) because it contradicted the Codeberg profile.

## 1. Goal and audience
Primary audience: technical hiring managers and senior engineers evaluating a new-grad SWE (backend/systems leaning, graduating Dec 2027) for full-time roles starting 2027.
Audited finding (locked): motion is near-zero hiring signal for backend/full-stack SWE roles. Therefore: evidence is the payload, motion is the delivery vehicle. Every visual decision must serve evidence legibility. Motion that does not serve evidence is cut.

## 2. Locked decisions (from GOAL.md and memory, not re-debatable here)
- Direction: "the engineer who verifies." Every project dossier leads with failure class, receipt, and falsifiability test.
- Roster: LeafLink, SideQuests. Both shipped (hackathon). No invented product claims anywhere: CanonClaw/ASH/Nexus are systems fluency, not products; Oracle/GRPO are not resume-ready.
- Stack: three.js r186, WebGPU feature detection with WebGL2 fallback, TSL materials/shaders, GSAP choreography, postprocessing. No framework.
- Voice: terse, technically dense. No em dashes in people-facing copy, ever. Banned-slop-styles gate on all copy.
- Motion: scroll-scrubbed cinematic is the standing preference; motion-heavy welcome allowed only if it never blocks content.

## 3. Anti-template constraint (named pre-build, per standing rule)
The site must NOT:
(a) open with a centered name + title + two CTA buttons hero;
(b) use a project card grid with stock-style thumbnails;
(c) use skill bar charts, percentage dials, or "services I offer" grids.
Instead: the hero is a systems-diagram scene (the verification rig, §9) with evidence-first copy, and projects are full dossiers, not cards. Any build violating (a)-(c) fails QA regardless of polish.

## 4. Information architecture
Single-page application with view routing (vanilla JS, PJAX-style transitions, no framework). Views:
- `/` Home: hero scene, proof strip, dossier index (2 dossiers, full-bleed rows, not cards), timeline, contact band.
- `/about`: now/then, colophon (stack, pipeline, verification method), principles (DVD: data, verification, determinism).
- `/work/leaflink`: dossier.
- `/work/sidequests`: dossier.
- `/lab` (OPTIONAL, flagged): experiments shelf.
- `/contact`: contact view (also reachable as footer band on home).
- 404 view with terminal-styled recovery.
Deep-linkable views; back/forward button support; each view has a unique title and meta description.

## 5. Page-by-page spec

### 5.1 Home
Sections in order:
1. Hero: full-viewport 3D verification-rig scene (§9), scroll-scrubbed assembly. Copy block (left-aligned, never centered): name, one-line thesis ("I build systems and prove they work." — copy deck to finalize; terse, no em dashes), two evidence links (dossiers). Scroll cue. All copy readable with WebGL disabled (scene is progressive enhancement; copy is DOM).
2. Proof strip: 3-4 receipted claims (e.g., "Shipped 2 hackathon projects, both placed 2nd" with links to repos/demos). Each claim carries its receipt inline. No unreceipted adjectives.
3. Dossier index: two full-bleed dossier rows. Each row: project name, one-line what-it-is, failure class it survived, receipt link, "read the dossier" link. Rows alternate media/text alignment (anti-template).
4. Timeline: education, roles (Math Club VP, Eleet Coders council, CS Teams treasurer), hackathons, job-hunt filings (no confidential details). Scroll-scrubbed progress line.
5. Contact band: email CTA, Codeberg/GitHub/LinkedIn links, copy-email button.

### 5.2 About
- Now/then: current status (CS senior, Dec 2027; job hunt), background (Smithtown, NY; SUNY New Paltz).
- Colophon: exact stack with pinned versions, the verification pipeline (deterministic build, byte-verify, receipt chain), "how this site was built" with link to the spec's public summary if Justin approves.
- Principles: DVD (data, verification, determinism) in his words, terse.

### 5.3 Dossier template (applies to LeafLink and SideQuests)
Fixed structure, no deviations:
1. Header: name, one-line what-it-is, ship date, team, role, repo + live demo links.
2. Failure class: what category of failure this project survived (e.g., "demo-day live demo risk," "scope collapse under timebox").
3. Receipt: verifiable artifacts (repo link, commit, demo recording, placement proof). Every claim hyperlinked.
4. Falsifiability test: "what would prove this project is weaker than claimed" — stated plainly.
5. Build notes: stack, hardest technical decision, what was cut and why.
6. Evidence gallery: screenshots with captions (lightbox modal, §6).
No testimonials, no skill tags cloud, no "key features" marketing list.

### 5.4 Contact
- Email CTA (justinf0829@gmail.com), copy-email button with confirmation state.
- Form: name, email, message. Client validation per standard-implementations (pragmatic email regex). Submit → endpoint adapter: tries configured endpoint; on no endpoint, falls back to mailto compose with prefilled body. Never silently drops a message: every submit path ends in a user-visible confirmation or an explicit fallback.
- Links: Codeberg (primary), GitHub, LinkedIn, phone.

### 5.5 404
Terminal-styled: `$ 404: route not found`, list of valid routes, link home. No cutesy illustration.

## 6. Components
- Nav: fixed, minimal. Left: wordmark "JP" or "justin poli" (copy deck). Right: Work, About, Contact, theme? (no theme toggle v1; cut). Mobile: hamburger → full overlay menu (accessible dialog pattern per code-examples.md §1).
- Hero scene (§9).
- Dossier row: full-bleed alternating layout.
- Timeline: vertical line, scroll-scrubbed progress fill, entries fade/slide on enter.
- Terminal (§7 novelty): interactive terminal section on home or about. Commands: help, whoami, projects, verify, contact, clear. Real implementation (not a fake typing animation): input parsing, command registry, history (up/down). Unknown command → helpful error listing commands (Postel: forgiving input, strict clear feedback).
- Lightbox modal: evidence gallery images. Focus trap, Escape closes, focus returns to trigger, aria-modal. Per code-examples.md §1. No modal-on-load anywhere (anti-pattern).
- Footer: sitemap, colophon line, "built and verified" note, copyright with year.
- Copy-email button: clipboard write with fallback (execCommand), confirmation state ("copied"), revert after 2s.

## 7. Novelty features (unique hero points, all real, no slop)
1. Verification-rig hero: the 3D scene is a stylized "rig" (node graph / pipeline diagram in 3D) that assembles on scroll: nodes = data, verification, determinism; edges light up as the dossier claims scroll into view. It is a diagram of his method, not decoration.
2. Interactive terminal (§6): a working terminal, not theater.
3. Dossier falsifiability sections: no other new-grad portfolio leads with "here is how you could prove me wrong." This is the differentiator; protect it in copy review.
4. Receipted proof strip: every claim hyperlinked to its artifact at first paint, not buried.
(Anti-slop check: none of these are gradient blobs, particle fields for their own sake, or stock imagery. The 3D serves the thesis.)

## 8. Motion design
Choreography (GSAP + ScrollTrigger, pinned versions in §11):
- Welcome: hero scene fades/scales in over 900ms; copy lines stagger up 24px, 60ms stagger. Total welcome under 1.4s. Skip intro button if load exceeds budget? No: keep it fast instead (perf budget §13).
- Scroll: hero rig assembles scrubbed to scroll (scrub: 1). Timeline progress line scrubbed. Section headers: y+28px fade on enter (once, not scrubbed). Dossier rows: subtle parallax on media (±6% max; Vestibular-safe).
- View transitions: 220ms fade + 12px y-shift on route change (PJAX-style). No full-page wipes.
- Micro: buttons scale 0.97 on active; links underline-grow on hover (desktop only); copy-email morphs to confirmation.
- Reduced motion: `prefers-reduced-motion: reduce` disables scrub, parallax, stagger, and transitions; content appears statically. This is a hard gate, not a nice-to-have.
- Performance: motion never blocks first paint of copy; all ScrollTriggers created after load; kill triggers on view change (no leaks).

## 9. 3D scene spec (verification rig)
- Renderer: three.js r186. Feature-detect WebGPU (`navigator.gpu`); use WebGPURenderer when available, else WebGLRenderer (WebGL2). If neither, scene container hides and the DOM copy carries the hero (no-JS/no-WebGL fallback, §14).
- Scene: abstract node-graph "rig": 3 primary nodes (DATA, VERIFY, DETERMINE as labeled sprites/planes), edges as lines/tubes that draw on scroll progress, subtle TSL-driven emissive pulse on the active node. Postprocessing: bloom (threshold high, subtle) + vignette. No particle-field wallpaper; every element maps to the thesis.
- Camera: slow dolly tied to scroll (scrubbed), clamped; idle drift ±2 degrees when tab visible and user idle (disabled under reduced motion).
- Sizing: canvas fills hero viewport, devicePixelRatio clamped to 2, resize observer, pause rendering when hero off-screen (IntersectionObserver) or tab hidden.
- Upstream anchors (anti-hallucination): three.js r186 WebGPURenderer docs, TSL (Three Shader Language) node docs, GSAP ScrollTrigger docs. Exact API usage must cite these in code comments at first use.

## 10. Functionality
- Router: hash-based or history-API routing within the single file. History API preferred (clean URLs) with server fallback: since deploy is a single static file, use hash routing OR history API with a 200.html/404.html rewrite... Vercel static upload serves one file; history-API deep links would 404 on refresh. Decision: hash-based routing (`#/work/leaflink`) for reliability on static hosting. Clean URLs are cut for robustness (Tesler: the system bears the complexity of static hosting; the user gets working deep links either way).
- Terminal: command registry object; commands: help, whoami, projects, verify, contact, clear, theme? (no). History via ArrowUp/Down. Unknown input → "unknown command: X. Try: help". Case-insensitive, trimmed (Postel).
- Lightbox: per §6; image preloading for gallery neighbors.
- Copy-email: per §6.
- Form: per §5.4; endpoint adapter pattern:
```js
const CONTACT_ENDPOINT = null; // set when Justin approves a backend
async function submitContact(data) {
  if (CONTACT_ENDPOINT) { /* POST JSON, handle errors, confirm */ }
  else { location.href = 'mailto:...?subject=...&body=' + encodeURIComponent(...); }
  // every path ends in visible confirmation
}
```
- No GitHub stats (copy deck v2.3 amendment, 2026-10-04): proof claim 04 is "Code is public." with the codeberg.org/bon3head link only. The site makes no GitHub API calls.
- No cookies, no tracking, no analytics v1 (cut for privacy posture; Vercel analytics is Justin's call post-launch).

## 11. Backend / API surface
v1 has no custom backend. The only network calls:
1. CDN: three.js r186 + GSAP (pinned versions, importmap; SRI hashes where the CDN provides them).
2. Fonts: embedded subset (no Google Fonts request at runtime; fonts inlined as woff2 data URIs).
3. Contact endpoint: null at launch (mailto fallback).
Future (needs Justin approval): contact form endpoint (Vercel serverless or form service), view counter. Specced as adapters, not built.

## 12. Design tokens (filled 2026-10-04 from design-extract v2: corentinbernadou.com + bruno-simon.com)
Full brief: `~/workspace/portfolio/design-extract/style-brief.md`.
- Canvas: warm near-black `#070304`; raised `#141414`; hairlines `#1f1f1f`.
- Ink: `#f5f5f5` primary, `#858585` secondary, `#575757` tertiary.
- Accent: UNLOCKED — reference ships brand red `#ff0000` (do not copy). Proposal: signal amber `#ffb000` (instrumentation connotation; verify AA). Claude/Justin to lock.
- Material: flat. No shadows, no gradients, no blur. Radius 3px max.
- Type: tight Title Case headings; narrow prose measure (~38-60ch); micro labels uppercase + letterspaced. Re-derive absolute scale at true 1x (extractor measured a scaled render).
- Spacing: 2px base; hairline rules separate sections, not cards; 12-column discipline.
- Motion: 300ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)`; scroll-linked hero/timeline.
- Do-not-copy: red brand color, issue-numbering system, grid-ruler tool, cursor-mask nav, logos, photography, proprietary fonts.
Anti-template re-check: these tokens produce editorial sections + full-bleed dossier rows; they do not produce (a) centered hero, (b) card grid, (c) skill bars (§3). Confirmed.

## 13. Copy requirements (copy deck is a build input)
- Voice: terse, technically dense. Short lines. No em dashes, ever. No colons in headlines where avoidable is not required here (that rule is application prose); still prefer plain sentences.
- Every factual claim about Justin hyperlinked to its receipt on first appearance (repo, commit, demo, transcript, certificate).
- Banned: "passionate," "leverage," "cutting-edge," "seamless," "delve," "tapestry," "I am excited to announce" energy, superhero metaphors, "ninja/rockstar." All copy passes `~/workspace/distill/banned-slop-styles.md` before build.
- Numbers: dates, team sizes must match MEMORY.md exactly (Dec 2027, etc.). No rounding that changes meaning. GPA is CUT from the site entirely (Justin's call 2026-10-04: subpar, would need a defense).
- The copy deck (final strings for every section) must be locked before build; the builder does not invent copy.

## 14. SEO, meta, performance budgets
- Title: "Justin Poli — Systems-minded SWE" (deck to finalize). Meta description one sentence, terse.
- OG tags with absolute URLs (set at deploy when the alias is known); favicon: inline SVG data URI (simple geometric mark, not emoji).
- Perf budgets: first contentful paint of DOM copy < 1.2s on broadband; total single-file size < 900KB excluding CDN libs; three.js scene init must not block copy paint (init after load event, async).
- Accessibility: semantic landmarks, skip link, focus-visible styles, all interactive targets ≥44px (§ui-ux-pro-max instincts), color contrast AA, keyboard-operable terminal and lightbox, `prefers-reduced-motion` honored.

## 15. Edge states and fallbacks
- No JavaScript: all copy, nav (as anchor list), dossiers, and contact email link readable. 3D, terminal, and transitions absent gracefully.
- No WebGL / WebGPU: hero copy renders over a static CSS gradient-free backdrop (flat color from token system); scene container hidden.
- Reduced motion: §8.
- 393px width: single column; nav collapses to accessible overlay menu; hero copy stacks above a minimized scene or static backdrop; tap targets ≥44px.
- Offline after first load: n/a (no service worker v1; cut).
- CDN failure: if three.js fails to load, scene init is skipped silently and the static hero stands. The page never shows a broken canvas or an error to the visitor.
- Form with no endpoint: mailto fallback (§5.4, §10).

## 16. QA gates (all must pass before Claude's final review)
Enforced skill set, no exceptions: `ux-instincts.md` (7 permanent checks), `anti-patterns.md` (HARD FAIL/DEFECT), `code-examples.md`, `standard-implementations.md`, `backend-gates.md` (when any endpoint ships), `quality-checklist.md`, `banned-slop-styles.md`, the anti-slop rubric.
1. `node --check` on the extracted script (guard browser-only init for harness eval).
2. ui-ux-pro-max full run: 7 instinct checks + anti-pattern scan + standard-implementations + quality checklist, against the rendered build at 393px and desktop. Zero HARD FAILs; DEFECTs fixed or one-line-justified.
3. backend-gates.md run if any endpoint ships (contact backend, serverless functions). Contact form with no backend must still pass the no-silent-drop and idempotency-equivalent checks via the mailto fallback path.
4. Banned-slop-styles on all people-facing copy; zero em dashes.
5. Anti-slop rubric on the finished build before surfacing.
6. Rendered screenshots: default state, one core interaction per view, every edge state (§15).
7. Reduced-motion pass: emulate `prefers-reduced-motion` and verify static correctness.
8. Keyboard-only pass: tab order, terminal, lightbox, menu, form.
9. Receipt audit: every factual claim on the site hyperlinked; click each link and confirm it resolves to the claimed artifact.

## 17. Build plan and roles
- Spec: Cipher (this document), reinforced by Claude (browser chat, up to 2 rounds) until spec-approved.
- Build: delegated to a build subagent working strictly from the approved spec + style-brief.md + copy deck. No deviations without a flagged judgment call.
- Testing/QA execution: Gemini (via agy) may execute test checklists and report results; Gemini writes no vital code (per Justin 2026-10-04).
- Final review: Claude (browser chat) reviews the built product (live preview URL + code excerpts) until product-approved, max 2 rounds. Then deploy.
- Deploy: vercel-demo-launch pipeline (static upload, byte-verify, visual QA). Production alias frozen at first deploy since a portfolio URL is printed/shared.

## 18. Upstream documentation anchors (anti-hallucination)
Load-bearing API claims in the build must cite these inline at first use:
- three.js r186: WebGPURenderer, TSL nodes, EffectComposer/postprocessing (threejs.org docs / three.js GitHub examples).
- GSAP 3.x: ScrollTrigger scrub, timelines (gsap.com/docs).
- W3C ARIA Authoring Practices: dialog (modal) pattern, combobox pattern (w3.org/WAI/ARIA/apg).
- WHATWG HTML: dialog element, form validation, placeholder vs label semantics.
- WCAG 2.2: contrast (1.4.3), target size (2.5.8), reduced motion (2.3.3).
Any API usage not traceable to one of these (or a source Claude accepts in review) is cut or flagged.

## 19. Open decisions (for Claude review, then Justin)
1. Copy deck authorship: who writes final strings (Justin, Claude, or Cipher draft + Justin edit)?
2. Lab shelf (/lab): build now or cut to v2?
3. Contact backend: wire a real endpoint at launch or ship mailto fallback?
4. Production URL/alias choice and whether the portfolio replaces or supplements the Codeberg page.
5. Favicon/wordmark final form.
6. Whether the terminal lives on home or about (spec default: home, after proof strip).
