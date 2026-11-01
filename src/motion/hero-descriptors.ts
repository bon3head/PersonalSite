// Hero descriptors (P-MORPH-1, DESIGN section 6.7 hero table, S03).
// One descriptor per route: the hero kind, the ground anchor the
// deflection ring and the silhouette disc center on, the ring radius,
// and the silhouette center and radius overrides. W6 mounts BrandHero
// from these descriptors; it needs no shader change, because the
// engine already accepts silhouetteCenter and silhouetteRadius
// overrides through setParams (P-LF-4b), and the morph controller
// drives the same fields through the lane params during travel.
//
// Anchor source: the scene camera pose target (fine variant
// canonical), ground-projected to [x, z]. That is the scene focal
// point the ring already grew around in W4; the descriptor makes
// that choice explicit and addressable instead of leaving it derived
// inside the engine. The leaflink and sidequests pose targets are
// identical across variants in the tokens, so the project anchors
// are variant-stable where the ring and silhouette matter; field
// routes carry ring 0, so their anchor variance is immaterial.
// Ring radius is the scene light radius token for the route;
// field routes have ring 0 and no mark.
//
// Mask UV orientation note for W6: the mask UV mapping in
// src/world/silhouette.ts grows u with world x and v with world z,
// and the mask texture is uploaded with flipY false. If the mounted
// hero shows the silhouette bunching mirrored, flip v in that mapping;
// do not change the descriptor values to compensate, since the disc
// center and radius are world geometry, not texture orientation.
import { T } from '../tokens.generated';
import { poseFor } from '../world/camera';
import type { LayoutId, SilhouetteMaskKind } from '../world/types';
import type { LaneParams } from '../world/types';

export type HeroKind = 'field' | 'mark' | 'field-quiet';

export interface HeroDescriptor {
  layout: LayoutId;
  kind: HeroKind;
  // Ground anchor [x, z] for the ring and the silhouette disc.
  anchor: [number, number];
  ringRadius: number;
  silhouetteCenter: [number, number];
  silhouetteRadius: number;
  maskKind: SilhouetteMaskKind;
  heroSizePx: number;
}

function lightRadiusFor(layout: LayoutId): number {
  const route = layout === 'scatter' ? 'server' : layout;
  return (T.scene[route].gradient as { light: { radius: number } }).light.radius;
}

export function descriptorForLayout(
  layout: LayoutId,
  variant: 'coarse' | 'fine' = 'fine',
): HeroDescriptor {
  const pose = poseFor(layout, variant);
  const anchor: [number, number] = [pose.target[0], pose.target[2]];
  const heroSizePx = T.hero.sizePx;
  if (layout === 'leaflink') {
    const radius = lightRadiusFor(layout);
    return {
      layout,
      kind: 'mark',
      anchor,
      ringRadius: radius,
      silhouetteCenter: [...anchor],
      silhouetteRadius: radius,
      maskKind: 'leaflink',
      heroSizePx,
    };
  }
  if (layout === 'sidequests') {
    const radius = lightRadiusFor(layout);
    return {
      layout,
      kind: 'mark',
      anchor,
      ringRadius: radius,
      silhouetteCenter: [...anchor],
      silhouetteRadius: radius,
      maskKind: 'sidequests',
      heroSizePx,
    };
  }
  return {
    layout,
    kind: 'field',
    anchor,
    ringRadius: 0,
    silhouetteCenter: [...anchor],
    silhouetteRadius: 0,
    maskKind: 'none',
    heroSizePx,
  };
}

// Apply a descriptor to a param set: the ring and silhouette fields
// take the descriptor values, everything else is untouched. W6 calls
// this when it mounts a hero; the morph controller applies the same
// fields per frame during travel.
export function applyDescriptorToParams(
  params: LaneParams,
  descriptor: HeroDescriptor,
): LaneParams {
  return {
    ...params,
    ringCenter: [...descriptor.anchor],
    ringRadius: descriptor.ringRadius,
    silhouetteCenter: [...descriptor.silhouetteCenter],
    silhouetteRadius: descriptor.silhouetteRadius,
    silhouetteMask: descriptor.maskKind,
  };
}
