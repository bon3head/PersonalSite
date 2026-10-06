# V3 Quality Rubric — full-bleed procedural circuit

## R1. Procedural validity (the engine's logic)
- R1.1 All traces route at 45-degree increments only. No arbitrary angles. Check: generator code review + sampled trace-angle measurement.
- R1.2 Every trace belongs to a valid net: pad-to-pad, pad-to-via, or via-to-via. No floating copper. Check: automated netlist validation pass in QA.
- R1.3 ICs land on pads with pin alignment; pin count matches footprint. Check: sampled components against footprints.
- R1.4 Vias connect layers per the PCB build spec rules; layer transitions only at vias. Check: netlist layer-transition audit.
- R1.5 Power pours/traces visually distinct from signal traces. Check: render review.
- R1.6 Deterministic: same seed produces a byte-identical netlist across loads. Check: hash the netlist on two separate loads, compare.

## R2. Interaction validity (nothing faked)
- R2.1 Pulses travel ONLY along routed traces between connected components. KILL if a pulse ever goes off-net. Check: pulse-path vs netlist trace.
- R2.2 Propagation delay proportional to trace length. Check: measured delay scales with path length.
- R2.3 Hover a chip -> pulse propagates on its nets; click a chip -> fanout highlight of its net. Both resolve against the netlist, never hardcoded. Check: trigger on a sampled chip, verify path equals its net.
- R2.4 Every terminal command maps to documented nets (e.g. `verify` fires the VERIFY chip's nets). Check: command-to-net map in spec, exercised in QA.
- R2.5 Route change activates the relevant sub-circuit plus camera move. Check: per-route activation observed.

## R3. Integration completeness (the nervous system)
- R3.1 Every interactive element is wired to a net: nav, dossier cards, proof-strip items, copy-email button, form focus/submit, terminal, scroll. Check: enumerate all interactive elements; each has a wiring entry in the spec.
- R3.2 No dead UI: interacting with any control produces a circuit response. Check: sweep every control, observe response.
- R3.3 Scroll drives signal-flow intensity and/or camera drift along the board, as defined in the spec. Check: scroll sweep, observe defined behavior.

## R4. Visual quality (central feature, full-bleed)
- R4.1 Canvas is fixed full-viewport behind ALL content on ALL routes. Check: screenshots per route.
- R4.2 Readability: scrims guarantee contrast behind every copy block. KILL if the background ever harms readability. Check: per-route contrast review.
- R4.3 The board is noticeable: it reads as the point of the page, not wallpaper. Check: screenshot review.

## R5. Motion quality
- R5.1 Shared curve cubic-bezier(0.4, 0, 0.2, 1); register timings hold (0.15s presses, 0.3s micro, 0.5s reveals, 0.9s headings, 1.8s camera).
- R5.2 Camera flights are interruptible and settle deterministically.
- R5.3 Reduced motion: fully resolved static board, all content complete, no rAF-driven animation. Check: emulated reduced-motion render.
- R5.4 Mobile tier uses rise/dissolve/descend transitions.

## R6. Performance
- R6.1 Tier system works: detection plus the runtime downgrade ladder.
- R6.2 GPU/texture memory RE-BASELINED for the full-viewport canvas; the old ~110MB estimate is a watch item, not a fact. Check: measured figure reported.
- R6.3 Chunk budget respected at full-bleed size.
- R6.4 60fps on desktop tier; scroll-driven effects without jank.

## R7. Content integrity
- R7.1 3D reads facts from SCENE_DATA/DOM only. No invented claims. Check: DOM-to-SCENE_DATA equality.
- R7.2 Copy unchanged from deck v2.3: spot-check claim 04 ("Code is public." + Codeberg only), zero em dashes, zero visible TBD.
- R7.3 `verify site` stays OFF unless Justin explicitly opts in.

## R8. Kill criteria
- R8.1 The three shan-shui kill criteria are restated in the spec and recorded in QA.
- R8.2 Interaction kills: pulse off-net -> kill the interaction; background harms readability -> kill the background treatment, not the copy.
- R8.3 A tripped kill criterion cuts the feature. Never patched around.

## R9. UI/UX law compliance (scored 0-100, ship requires 100)
Permanent checks, always on: Fitts (all tappable targets >=44px; primary action largest/nearest expected cursor-thumb; destructive small/far); Hick (max one primary action per view; secondary under progressive disclosure); Jakob (platform-conventional patterns for nav/forms/search; any invented pattern flagged as a judgment call justifying its novelty budget); Gestalt grouping — proximity, similarity, uniform connectedness (related adjacent + shared styling; unrelated separated by whitespace/containment); Tesler (when simplifying, state who absorbs the displaced complexity — user or system; no cost-shifting); Doherty (every interaction acknowledges within 400ms; skeleton/optimistic states hold the budget). Selective checks when trigger holds: Von Restorff (exactly one isolation element per view); Peak-end (every flow ends cleanly, no dead ends; one peak moment per journey); Serial position (critical items at nav/list ends); Miller CORRECTED (chunk never count, simultaneous demands under ~4, never cite "7+-2"); Postel single copy (forgiving inputs + strict clear validation feedback); Ovsiankina + goal-gradient for multi-step flows with endowed head start — the Zeigarnik MEMORY claim is banned (failed replication), as are "7+-2", duplicate Postel's, and "minimize target distance" as a standalone law. Scoring: 100 * passed/applicable.

## R10. Novelty (scored 0-100, ship requires 100)
Concrete checks: N1 no template read (not classifiable as shadcn/Awwwards-template on side-by-side inspection; custom design language); N2 netlist-driven circuit interaction real and central (R2 passing prerequisite; no novelty claimed on decoration); N3 at least one interaction unseen on portfolio sites (e.g. trace-length-timed propagation, chip fanout probing); N4 terminal is a first-class control surface for the 3D scene, not just nav; N5 novelty budget spent where differentiation pays (Jakob respected elsewhere). Scoring: 100 * passed/5.

## R11. Performance mandate (scored 0-100, ship requires 100)
Hard numbers, measured never estimated: P1 60fps sustained on desktop tier across a 10s window mixing scroll, pulses, camera flight (frame timing reported); P2 LCP < 2.5s, TTI < 3.5s desktop broadband (measured); P3 GPU/texture memory measured under the re-baselined budget with method reported; P4 downgrade ladder engages on weak devices, lowest tier fully readable with static board; P5 every interaction acknowledges within 400ms; P6 single file <= 500KB uncompressed, CDN deps pinned (three@0.186.0, gsap@3.15.0), no new dep without written justification; P7 no scroll jank (compositor-friendly properties). Scoring: 100 * passed/7.

R9, R10 and R11 are NON-NEGOTIABLE: scored 0-100, ship requires 100 on each. Anything below triggers refactor-and-improve, re-scored, loop until met. The bar is never lowered.

## Spec amendments (Cipher review, 2026-10-05)
These are requirements on the V3 spec. Where they touch scoring, the checks below apply in addition to the dimensions above.
- A1. Touch equivalents. Every hover-driven interaction has a defined tap equivalent; the spec picks one model and states it. Scored under R2.3 (the tap path resolves against the netlist like hover), R3.2 (no control is dead on touch) and R9 Fitts (touch targets >=44px).
- A2. Reduced motion per interaction. Under prefers-reduced-motion every wired interaction has an instant, non-animated equivalent (e.g. an instant highlight state instead of a traveling pulse), enumerated in the spec. No interaction may go dead or stay animated. Scored under R5.3 and R3.2.
- A3. No-WebGL fallback. The spec states what renders when WebGL is unavailable entirely, separate from the tier ladder: full content, readable, and what replaces the board. Scored under R4.2 (readability), R6.1 and R11 P4 (lowest tier fully readable).
- A4. K3 in the netlist context (Cipher ruling, question closed). A seed change must produce a structurally different netlist GRAPH: different component placement and net connectivity/topology, not merely geometric jitter of the same graph. Check: generate at least 5 seeds, hash each netlist's graph (nodes plus edges, excluding pure trace geometry); KILL if any two graphs are isomorphic or differ only in trace geometry. Scored under R8.1; the V3 spec documents the operationalization and measurement method.
- A5. Excellence bar A to F (Justin's 3D++ / MOTION++ directive): TSL layer, scroll as camera, the boot peak moment, detail density, extract-level motion craft, pulse aesthetics. Defined in the V3 spec and scored within R1 to R11; no separate dimension, and the R11 performance mandate holds.

## Scoring
- R1 to R8: each check PASS / FAIL. No partial credit at ship time.
- R1 to R8: each dimension PASS iff all its checks pass.
- R9, R10, R11: scored 0-100 by their formulas; below 100 means refactor-and-improve, re-score, loop until met.
- SHIP iff R1 through R8 all pass AND R9 = R10 = R11 = 100.
- The builder self-scores first; Cipher re-scores independently. Disagreements go to evidence (file:line, screenshot, measurement).
