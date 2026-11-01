// W4 lane parameters and variant B attributes (lanefield.variance).
// Pure functions over the generated tokens: no DOM, no WebGL, so the
// same code serves the engine, the stub, and the tests. The GLSL
// shaders mirror hash11 and the length/phase formulas textually.
import { T } from '../tokens.generated';
import type { LaneAttributes, LaneParams, LayoutId } from './types';
import { easeSignature } from './tween';
import { maskKindForLayout } from './silhouette';

// GLSL hash11 mirror: fract(p * 0.1031); p *= p + 33.33; p *= p + p; // lit-ok:
// fract(p). Double precision here; the shader uses float precision,
// so values agree to float tolerance, not bit for bit.
export function hash11(p: number): number {
  let q = p * 0.1031; // lit-ok: GLSL hash11 constant
  q -= Math.floor(q);
  q *= q + 33.33; // lit-ok: GLSL hash11 constant
  q *= q + q;
  return q - Math.floor(q);
}

type SceneGradient = {
  leadOklab: readonly number[];
  tailOklab: readonly number[];
  signalOklab: readonly number[];
  tailLength: number;
  light: { mode: string; radius: number; gain: number };
};

function gradientFor(layout: LayoutId): SceneGradient {
  // Scatter has no scene gradient token; it reuses the server gradient.
  const route = layout === 'scatter' ? 'server' : layout;
  return T.scene[route].gradient as unknown as SceneGradient;
}

export function paramsForLayout(layout: LayoutId): LaneParams {
  const g = gradientFor(layout);
  const mode = g.light.mode as LaneParams['lightMode'];
  return {
    leadOklab: [...g.leadOklab] as [number, number, number],
    tailOklab: [...g.tailOklab] as [number, number, number],
    signalOklab: [...g.signalOklab] as [number, number, number],
    tailLength: g.tailLength,
    lightMode: mode,
    lightRadius: g.light.radius,
    lightGain: g.light.gain,
    ringCenter: [0, 0],
    ringRadius: 0,
    ringStrength: 0,
    silhouetteMask: maskKindForLayout(layout),
    silhouetteCenter: [0, 0],
    silhouetteRadius: 0,
    silhouetteStrength: 0,
  };
}

export function cloneParams(p: LaneParams): LaneParams {
  return {
    leadOklab: [...p.leadOklab],
    tailOklab: [...p.tailOklab],
    signalOklab: [...p.signalOklab],
    tailLength: p.tailLength,
    lightMode: p.lightMode,
    lightRadius: p.lightRadius,
    lightGain: p.lightGain,
    ringCenter: [...p.ringCenter],
    ringRadius: p.ringRadius,
    ringStrength: p.ringStrength,
    silhouetteMask: p.silhouetteMask,
    silhouetteCenter: [...p.silhouetteCenter],
    silhouetteRadius: p.silhouetteRadius,
    silhouetteStrength: p.silhouetteStrength,
  };
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

// Interpolate two param sets. Light mode is categorical, so it switches
// at the midpoint rather than blending; every numeric field lerps.
export function lerpParams(a: LaneParams, b: LaneParams, t: number): LaneParams {
  return {
    leadOklab: [
      mix(a.leadOklab[0], b.leadOklab[0], t),
      mix(a.leadOklab[1], b.leadOklab[1], t),
      mix(a.leadOklab[2], b.leadOklab[2], t),
    ],
    tailOklab: [
      mix(a.tailOklab[0], b.tailOklab[0], t),
      mix(a.tailOklab[1], b.tailOklab[1], t),
      mix(a.tailOklab[2], b.tailOklab[2], t),
    ],
    signalOklab: [...b.signalOklab],
    tailLength: mix(a.tailLength, b.tailLength, t),
    lightMode: t < 0.5 ? a.lightMode : b.lightMode, // lit-ok: midpoint mode switch
    lightRadius: mix(a.lightRadius, b.lightRadius, t),
    lightGain: mix(a.lightGain, b.lightGain, t),
    ringCenter: [mix(a.ringCenter[0], b.ringCenter[0], t), mix(a.ringCenter[1], b.ringCenter[1], t)],
    ringRadius: mix(a.ringRadius, b.ringRadius, t),
    ringStrength: mix(a.ringStrength, b.ringStrength, t),
    // Mask kind is categorical like light mode: it switches at the
    // midpoint. The engine overwrites center, radius, and strength
    // from the ring envelope during travel, same as the ring.
    silhouetteMask: t < 0.5 ? a.silhouetteMask : b.silhouetteMask,
    silhouetteCenter: [
      mix(a.silhouetteCenter[0], b.silhouetteCenter[0], t),
      mix(a.silhouetteCenter[1], b.silhouetteCenter[1], t),
    ],
    silhouetteRadius: mix(a.silhouetteRadius, b.silhouetteRadius, t),
    silhouetteStrength: mix(a.silhouetteStrength, b.silhouetteStrength, t),
  };
}

// Light mode as the shader uniform index: band 0, radial 1, wander 2,
// static 3. The mapping is an encoding of the token string, not a token. // lit-ok:
export function lightModeIndex(mode: LaneParams['lightMode']): number {
  switch (mode) {
    case 'band':
      return 0; // lit-ok: light mode encoding
    case 'radial':
      return 1; // lit-ok: light mode encoding
    case 'wander':
      return 2; // lit-ok: light mode encoding
    case 'static':
      return 3; // lit-ok: light mode encoding
  }
}

// Morph ring envelope factors at travel fraction p (0 to 1). This is
// the exact envelope updateTravel applies: traveling to a project
// layout grows the ring over Gather and collapses it over Reveal, so
// it is zero at both ends; traveling away collapses an active ring over
// the 0.20 to 0.80 window. Pure, so the unit test checks the same // lit-ok:
// numbers the engine uses.
export function ringEnvelope(p: number, isProject: boolean): {
  gather: number;
  reveal: number;
  collapse: number;
} {
  const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
  const morph = T.motion.morph;
  return {
    gather: isProject
      ? easeSignature(clamp01((p - morph.gather[0]) / (morph.gather[1] - morph.gather[0])))
      : 0,
    reveal: isProject
      ? easeSignature(clamp01((p - morph.reveal[0]) / (morph.reveal[1] - morph.reveal[0])))
      : 0,
    collapse: isProject
      ? 0
      : easeSignature(clamp01((p - 0.2) / (0.8 - 0.2))), // lit-ok: ring collapse window from DESIGN 6.7
  };
}

// Variant B attributes for one lane. The shader uses the same seeds:
// length from hash11(lane * 0.013 + 7), phase from // lit-ok:
// hash11(lane * 0.37 + 11). Length scale spans 1 minus variance to // lit-ok:
// 1 plus variance. Phase jitter is the seed times (1 minus server
// weight), so Lockstep (server weight 1) zeroes it exactly.
export function laneAttributes(lane: number, serverWeight: number): LaneAttributes {
  const variance = T.lanefield.variance;
  const bands = variance.depthBands;
  const band = ((lane % bands) + bands) % bands;
  const lengthScale = 1 + (hash11(lane * 0.013 + 7) - 0.5) * 2 * variance.lengthVariance; // lit-ok: variant B seeds
  const phaseJitterSeed = hash11(lane * 0.37 + 11); // lit-ok: variant B seeds
  return {
    band,
    lengthScale,
    phaseJitter: phaseJitterSeed * (1 - serverWeight),
    phaseJitterSeed,
  };
}
