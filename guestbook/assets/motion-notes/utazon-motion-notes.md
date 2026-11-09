# Utazon.fr Motion Tokens (2026-10-04)

Full 36-file design-extract completed (exit 0). Site rendered for real (301KB full-page screenshot, not blank).

## Extracted motion system (utazon-motion.gsap.js, generated from the live page)

Dominant ease (18x on page): `M0,0 C0.4,0 0.2,1 1,1` — custom expo-flavored ease-out. Register as GSAP CustomEase `custom1`.
Secondary: easeOut `M0,0 C0,0 0.2,1 1,1`, easeInOut `M0,0 C0.25,0.1 0.25,1 1,1`.

Durations: xs 0.15s, md 0.3s, xxl 1.8s.

Reveal system: everything runs 1.8s on `custom1`:
- fadeIn / slideUp (y:24) / slideDown (y:-24) / scaleIn (scale 0.96) / pop (scale 0.9), all from opacity 0.
- Scroll batch-reveals: trigger at 'top 85%', toggleActions 'play none none reverse' (reverses when scrolled back past).

## What this gives the v2 brief
A concrete, award-winning 2D motion calibration to set against bruno-arizio's split-text timings (Power4.easeOut, 0.1 stagger, 1.5s): utazon's language is slower, softer reveals (1.8s, 24px drift, expo ease-out) with reversible scroll triggers. The v2 brief should pick its 2D motion register deliberately between these two poles — or assign one per context (route transitions vs scroll reveals).
