# Oklou.com Motion Tokens (2026-10-04)

Full 36-file design-extract completed (exit 0). Site rendered for real (3.2MB full-page screenshot, not blank). Boot/tuning sequence captured separately via timed Playwright frames (local Chromium through the extract relay).

## Extracted motion system (oklou-motion.gsap.js, generated from the live page)

Dominant ease (9x on page): `M0,0 C0.4,0 0.2,1 1,1` — same Material-standard ease as utazon (18x) and cleanlystudio. Third convergence; register as GSAP CustomEase `custom1`.

Durations: xs 0.15s, md 0.3s, lg 0.5s — a tighter, snappier register than utazon's 1.8s reveals. The long cinematic motion lives in the 3D intro, not the DOM.

Reveal system (all 0.5s on custom1): fadeIn / slideUp (y:24) / slideDown (y:-24) / scaleIn (0.96) / pop (0.9), stagger 0.08. Scroll batch-reveals at 'top 85%', toggleActions 'play none none reverse' — same reversible pattern as utazon.

Design language: pure black (#000000, 100% of painted area), white 21:1 text, p22-underground body. Nav: ()KLOU logo, choke enough / music / live / about / merch + social row.

## Boot sequence: radio tuning into a 3D space (the priority)

Choreography, step by step (wall-clock, headless, approximate):

1. **Pre-start gate.** Black screen. Giant glowing segmented "TUNER" center, "start" button below, site nav visible. The start click is the audio-unlock gesture (browsers require it for the static track).
2. **Loading.** Black screen, thin progress bar center filling. Downloads: `mainv3.glb` (main world, from DigitalOcean Spaces), `/_nuxt/radioTuning.81ff4pq7.mp3` (the static/sweep audio), `/models/intro.glb` (intro scene, preloaded).
3. **Fade to full black.** ~2s in. Everything gone — a hard transition beat, no crossfade observed.
4. **3D tuner fades in.** A giant radio tuner in 3D: seven-segment "FM xx.xx MHz" display, curved blue EQ arc sweeping behind it, yellow LED dots, red preset digits 1-9, labels CLEAR / Y.BASS / OPLAY / TUNED (white, lit) / STEREO (red, lit).
5. **Auto-sweep.** Frequency digits roll on their own (observed FM 6K.78 -> 9K.85 with zero input). No drag or dial interaction required — the sweep is automatic. The blue EQ arc rotates as the digits roll.
6. **Camera push-in.** The camera dollies toward the display mid-sweep (close-up frame shows digits mid-roll).
7. **Lock-in.** The display resolves to "FM OK.00", then "AM OKLOU" — the station is the artist's name. TUNED stays lit. This is the payoff beat: noise becomes identity.
8. **Pull-back reveal.** Camera pulls to wide: nav returns, "skip intro" button bottom-center, speaker/mute toggle bottom-left, the tuner small in the distance locked on "AM OKLOU".

**Tuning mechanics:** sweep is AUTO (no user input in the test run). A horizontal drag mid-sequence did not visibly alter the sweep; the subsequent pull-back may have been timeline-driven, not drag-driven — treat drag as unconfirmed. Between-station state = rolling digits + sweeping EQ arc + `radioTuning.mp3` static (asset confirmed; not auditioned headlessly). Lock-in is purely visual: digits stop rolling and read "OK.00"/"OKLOU". Escape hatch: "skip intro" button present throughout (good: the cinematic never traps the user).

## What this gives the v2/v3 brief

- The tuning-then-lock structure is the stealable pattern: **noise -> sweep -> lock-in where the readout resolves into the brand**. For the portfolio: boot the circuit with static/pulse noise, sweep, lock onto "VERIFY" (or the visitor's name) as the resolved state.
- Third convergence on `cubic-bezier(0.4, 0, 0.2, 1)` across three independent award-level sites — this ease is now the default, not a choice.
- The start-gate pattern (click to unlock audio + begin) and the skippable intro are both worth copying: cinematic ambition with an escape hatch.
- Oklou splits motion labor cleanly: DOM gets the tight 0.15-0.5s register, the 3D intro carries all the long cinematic timing. Same split the v3 spec should use (DOM micro-interactions vs circuit choreography).
