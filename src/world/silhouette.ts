// P-LF-4b silhouette pull: pure geometry, shared by the vertex shader
// (GLSL mirror in lane.vert.glsl) and the unit test. The logo alpha
// mask is sampled in the shader; this module holds only the math that
// does not need the texture: which mask a route uses, how a world
// point maps to mask UV, how the ring envelope scales the pull, and
// how one point moves along the alpha gradient.
//
// Pull rule: a lane point moves along the alpha gradient, which points
// toward increasing alpha, that is, into the mark. The move size is
// strength times (1 - alpha), so a point already deep inside the mark
// (alpha 1) does not move, and a point just outside the contour
// (alpha near 0) moves the full strength toward the contour. The
// gradient is zero away from the contour, so only lanes near the
// contour move at all. There are no per-lane start delays: every lane
// reads the same silhouette uniforms at the same frame.
//
// Mask UV mapping: the ring disc maps to the mask square. u grows with
// world x, v grows with world z, and the texture is uploaded with
// flipY false, so the mapping is one line W6 can flip if the mounted
// hero shows the bunching mirrored. Center and radius track the ring
// until W6 registers hero descriptors, at which point a descriptor
// override through setParams replaces them without a shader change.
import type { LayoutId, SilhouetteMaskKind } from './types';

// Edge of the small mask texture, in texels. The engine downsamples
// the logo image to this square (letterboxed, aspect preserved) so one
// texel spans a visible band around the contour instead of a single
// source pixel.
export const SILHOUETTE_MASK_SIZE = 128; // lit-ok: small mask texture edge in texels

export function maskKindForLayout(layout: LayoutId): SilhouetteMaskKind {
  if (layout === 'sidequests') return 'sidequests';
  if (layout === 'leaflink') return 'leaflink';
  return 'none';
}

export function maskUv(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radius: number,
): [number, number] {
  return [(x - centerX) / (2 * radius) + 0.5, (z - centerZ) / (2 * radius) + 0.5];
}

// Ring-envelope scaling for the pull, mirroring the ring in
// updateTravel: zero before Gather, full at the Gather peak, zero
// again once Reveal completes. pull is the token
// morph.silhouettePull, in world units of peak displacement.
export function silhouetteEnvelopeStrength(gather: number, reveal: number, pull: number): number {
  return pull * gather * (1 - reveal);
}

export function silhouettePullPoint(
  x: number,
  z: number,
  alpha: number,
  gradX: number,
  gradZ: number,
  strength: number,
): [number, number] {
  if (strength === 0) return [x, z];
  const g = Math.sqrt(gradX * gradX + gradZ * gradZ);
  if (g < 1e-9) return [x, z]; // lit-ok: zero-gradient threshold
  const a = Math.max(0, Math.min(1, alpha));
  const mag = strength * (1 - a);
  if (mag === 0) return [x, z];
  return [x + (gradX / g) * mag, z + (gradZ / g) * mag];
}
