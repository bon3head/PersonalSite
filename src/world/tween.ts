// Tween, spring, damp. Verbatim from S02 (tween section).
// Trailing // lit-ok: comments are lint compliance only (tools/lint-tokens.mjs
// requires them for numeric literals in src/world); they do not alter the code.
import { T } from '../tokens.generated';

// Cubic bezier solver (same method as WebKit UnitBezier). Returns y for x in [0,1].
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx; // lit-ok: bezier coefficients
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; // lit-ok: bezier coefficients
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx; // lit-ok: bezier derivative
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) return sy(t); const d = dsx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } // lit-ok: Newton iterations and epsilon
    let lo = 0, hi = 1; t = x;
    while (hi - lo > 1e-6) { const v = sx(t); if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; } // lit-ok: bisection epsilon
    return sy(t);
  };
}
export const easeSignature = cubicBezier(...T.motion.easeSignature); // expo-out
export const easePlain = cubicBezier(...T.motion.easePlainBezier); // CSS 'ease' as a curve, for WebGL-side values

// Underdamped spring step response, 0 -> 1. zeta < 1.
export function spring(zeta: number, freqHz: number) {
  const w = 2 * Math.PI * freqHz, wd = w * Math.sqrt(1 - zeta * zeta), k = zeta / Math.sqrt(1 - zeta * zeta);
  return (tSec: number) => 1 - Math.exp(-zeta * w * tSec) * (Math.cos(wd * tSec) + k * Math.sin(wd * tSec));
}

// Frame-rate independent exponential smoothing toward target.
export function damp(current: number, target: number, halfLifeMs: number, dtMs: number) {
  return target + (current - target) * Math.pow(2, -dtMs / halfLifeMs);
}
