# Cleanlystudio.pro Motion Tokens (2026-10-04)

Full 36-file design-extract completed (exit 0). Real render (3MB full-page screenshot).

## The convergence finding
Cleanlystudio uses the IDENTICAL ease curve as utazon.fr: `M0,0 C0.4,0 0.2,1 1,1` — 104x on the page. That curve is cubic-bezier(0.4, 0, 0.2, 1), the Material Design standard easing. Two independent award-winning sites converged on the same curve.

The difference is duration register:
- cleanlystudio: 0.5s reveals (fadeIn, slideUp/slideDown 24px, scaleIn 0.96, pop 0.9), scroll triggers at 'top 85%', toggleActions 'play none none reverse'
- utazon: 1.8s on the same curve and same patterns

## Three poles for the v2 2D-motion register
1. bruno-arizio: Power4.easeOut, 0.1 stagger, 1.5s split-text (snappy, choreographed, transition-wired)
2. cleanlystudio: Material-standard expo ease, 0.5s (quick, crisp)
3. utazon: same ease, 1.8s (slow, soft, luxurious)

The brief should pick the register deliberately — the curve itself is settled (the field converged), the open choice is duration/stagger character per context.
