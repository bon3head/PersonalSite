// Polish round 2 pure checks (DESIGN 1.2.0): entropy determinism and
// neutrality, morph anchor resolver behavior, bow endpoints, and the
// camera band under every seeded bow. Node only, no browser.
import { test, expect } from '@playwright/test';
import { T } from '../../src/tokens.generated';
import { createMorphController, type MorphAnchor } from '../../src/motion/morph-controller';
import {
  drawAt,
  morphEntropy,
  resetEntropy,
  setEntropyEnabled,
  NEUTRAL_ENTROPY,
} from '../../src/motion/entropy';
import type { LayoutId } from '../../src/world/types';

const TRAVEL_MS = T.motion.ms.travel;
const ROUTES: LayoutId[] = ['server', 'leaflink', 'sidequests', 'scatter'];

function scriptRun(seed: number, enabled: boolean): number[] {
  resetEntropy(seed);
  setEntropyEnabled(enabled);
  const out: number[] = [];
  // A fixed input script: 24 navigations cycling every destination.
  for (let i = 0; i < 24; i++) {
    const e = morphEntropy(ROUTES[i % ROUTES.length]);
    out.push(e.bow, e.swirl, e.pullScale);
  }
  setEntropyEnabled(true);
  return out;
}

test('T-ENT-1: same seed reproduces the same motion parameters', () => {
  expect(scriptRun(123456789, true)).toEqual(scriptRun(123456789, true));
});

test('T-ENT-2: different seeds vary the motion parameters', () => {
  const a = scriptRun(1, true);
  const b = scriptRun(2, true);
  let differing = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) differing++;
  // Server entries are rigid by token (bow 0, swirl 0), so only the
  // pull scale varies there; every other destination varies all three.
  expect(differing).toBeGreaterThan(a.length / 2);
});

test('T-ENT-3: reduced motion is neutral and seed independent', () => {
  const a = scriptRun(7, false);
  const b = scriptRun(99999, false);
  expect(a).toEqual(b);
  for (let i = 0; i < a.length; i += 3) {
    expect(a[i]).toBe(NEUTRAL_ENTROPY.bow);
    expect(a[i + 1]).toBe(NEUTRAL_ENTROPY.swirl);
    expect(a[i + 2]).toBeCloseTo(NEUTRAL_ENTROPY.pullScale, 12);
  }
});

test('T-ENT-4: draws stay in range for 2000 seeds; server stays rigid', () => {
  for (let s = 0; s < 2000; s++) {
    resetEntropy(s * 2654435761);
    for (const r of ROUTES) {
      const e = morphEntropy(r);
      const range = T.entropy.scene[r];
      expect(Math.abs(e.bow)).toBeLessThanOrEqual(range.bowWorld + 1e-12);
      expect(Math.abs(e.swirl)).toBeLessThanOrEqual(range.swirl + 1e-12);
      expect(e.pullScale).toBeGreaterThanOrEqual(T.entropy.pullScale[0]);
      expect(e.pullScale).toBeLessThanOrEqual(T.entropy.pullScale[1]);
      if (r === 'server') {
        expect(e.bow).toBe(0);
        expect(e.swirl).toBe(0);
      }
    }
    const u = drawAt(s, 'morph-bow', s);
    expect(u).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThan(1);
  }
});

test('T-ENT-5: bow is zero at both ends of every morph for any seed', () => {
  for (let s = 0; s < 200; s++) {
    resetEntropy(s);
    for (const from of ROUTES) {
      for (const to of ROUTES) {
        if (from === to) continue;
        const c = createMorphController(from);
        c.navigate(to, 0, undefined, { entropy: morphEntropy(to) });
        expect(c.sample(0).bowFactor).toBe(0);
        expect(Math.abs(c.sample(TRAVEL_MS).bowFactor)).toBeLessThan(1e-12);
        expect(c.sample(TRAVEL_MS).ringStrength).toBe(0);
      }
    }
  }
});

test('T-ANCHOR-1: an unresolved anchor draws no ring, then grows from zero', () => {
  let anchor: MorphAnchor | null = null;
  const c = createMorphController('server', { anchorFor: () => anchor });
  c.navigate('leaflink', 0);
  // Before the anchor exists (the readout swap has not happened yet),
  // the ring is zero even inside the Gather window.
  const early = c.sample(0.3 * TRAVEL_MS);
  expect(early.anchorReady).toBe(false);
  expect(early.ringStrength).toBe(0);
  expect(early.silhouetteStrength).toBe(0);
  // The anchor resolves at 0.3: the ring starts at zero on that frame
  // and grows on later frames, centered on the resolved anchor.
  anchor = { center: [4, -2], ringRadius: 3, silhouetteRadius: 5 };
  const first = c.sample(0.3 * TRAVEL_MS);
  expect(first.anchorReady).toBe(true);
  expect(first.ringStrength).toBe(0);
  const later = c.sample(0.5 * TRAVEL_MS);
  expect(later.ringStrength).toBeGreaterThan(0);
  expect(later.ringCenter).toEqual([4, -2]);
  expect(later.ringRadius).toBe(3);
  expect(later.silhouetteRadius).toBe(5);
});

test('T-ANCHOR-2: the ring departs from the origin and lands on the anchor', () => {
  const anchor: MorphAnchor = { center: [0, 0], ringRadius: 4, silhouetteRadius: 4 };
  const c = createMorphController('server', {
    anchorFor: () => anchor,
    groundAt: () => [10, 6],
  });
  c.navigate('sidequests', 0, undefined, { originPx: [100, 600] });
  const g0 = T.motion.morph.gather[0];
  const startGather = c.sample(g0 * TRAVEL_MS);
  expect(startGather.ringCenter[0]).toBeCloseTo(10, 6);
  expect(startGather.ringCenter[1]).toBeCloseTo(6, 6);
  const endGather = c.sample(T.motion.morph.gather[1] * TRAVEL_MS);
  expect(endGather.ringCenter[0]).toBeCloseTo(0, 6);
  expect(endGather.ringCenter[1]).toBeCloseTo(0, 6);
});

test('T-LF-7b: swirled deflection stays C1 and zero outside the ring', async () => {
  const { deflectPoint } = await import('../../src/world/deflection');
  const r = 5;
  const s = 2;
  for (const swirl of [-0.9, -0.35, 0, 0.35, 0.9]) {
    // Zero outside and at the boundary, for any swirl.
    expect(deflectPoint(r, 0, 0, 0, r, s, swirl)).toEqual([r, 0]);
    expect(deflectPoint(9, 1, 0, 0, r, s, swirl)).toEqual([9, 1]);
    // Displacement magnitude approaches zero continuously at the
    // boundary (C0) with a vanishing slope (C1): sample just inside.
    const eps = 1e-3;
    const [x1, z1] = deflectPoint(r - eps, 0, 0, 0, r, s, swirl);
    const disp = Math.hypot(x1 - (r - eps), z1);
    expect(disp).toBeLessThan(1e-4);
    // The tangential share is exactly swirl times the radial share.
    const [x2, z2] = deflectPoint(2, 0, 0, 0, r, s, swirl);
    const radial = x2 - 2;
    expect(z2).toBeCloseTo(radial * swirl, 12);
  }
});
