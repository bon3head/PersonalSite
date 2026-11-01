// P-LF-4b silhouette pull tests: T-LF-8 (one lane draw call with a
// mask texture bound) and T-LF-9 (the pull itself, pinned by the pure
// functions the engine and shader mirror).
//
// Browser timing note, same as lanefield.spec.ts: on SwiftShader a
// single frame takes 10 to 20 seconds, so T-LF-8 waits for the mask
// load state through the debug readout instead of sampling a
// mid-morph frame. Interpolation and displacement are covered by the
// Node unit tests below, which check the exact functions the engine
// calls.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SILHOUETTE_MASK_SIZE,
  maskKindForLayout,
  maskUv,
  silhouetteEnvelopeStrength,
  silhouettePullPoint,
} from '../../src/world/silhouette';
import { paramsForLayout, lerpParams } from '../../src/world/laneParams';
import { T } from '../../src/tokens.generated';

test.setTimeout(300000);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = process.env.W4_DEV ?? 'http://localhost:5173';
const HARNESS = `${DEV}/tests/world-harness.html`;

// ---- T-LF-9: pull displacement, pinned on the pure function.
test('T-LF-9: silhouette pull moves lanes near the contour toward it', () => {
  // Gradient toward +x, outside the mark (alpha 0), full strength.
  expect(silhouettePullPoint(3, 0, 0, 1, 0, 0.35)).toEqual([3.35, 0]);
  // Half inside the contour (alpha 0.5) moves half the strength.
  expect(silhouettePullPoint(3, 0, 0.5, 1, 0, 0.35)).toEqual([3.175, 0]);
  // Deep inside the mark (alpha 1) does not move, even with a gradient.
  expect(silhouettePullPoint(3, 0, 1, 1, 0, 0.35)).toEqual([3, 0]);
  // Inactive pull does not move anything: zero strength, zero gradient.
  expect(silhouettePullPoint(3, 0, 0, 1, 0, 0)).toEqual([3, 0]);
  expect(silhouettePullPoint(3, 0, 0, 0, 0, 0.35)).toEqual([3, 0]);
  // Diagonal gradient normalizes: a (3, 4) gradient at strength 0.5
  // moves (0.3, 0.4), the unit direction times the strength.
  const [dx, dz] = silhouettePullPoint(0, 0, 0, 3, 4, 0.5);
  expect(dx).toBeCloseTo(0.3, 10);
  expect(dz).toBeCloseTo(0.4, 10);
  // Alpha clamps: above 1 behaves as inside, below 0 as outside.
  expect(silhouettePullPoint(0, 0, 2, 1, 0, 0.35)).toEqual([0, 0]);
  expect(silhouettePullPoint(0, 0, -1, 1, 0, 0.35)).toEqual([0.35, 0]);
});

// ---- T-LF-9 (mask mapping and envelope): the route mechanism.
test('T-LF-9: mask kind, UV mapping, and envelope follow the route', () => {
  expect(maskKindForLayout('sidequests')).toBe('sidequests');
  expect(maskKindForLayout('leaflink')).toBe('leaflink');
  expect(maskKindForLayout('server')).toBe('none');
  expect(maskKindForLayout('scatter')).toBe('none');
  // The ring disc maps to the mask square: center to center, ring
  // edge to square edge.
  expect(maskUv(0, 0, 0, 0, 6)).toEqual([0.5, 0.5]);
  expect(maskUv(6, 0, 0, 0, 6)).toEqual([1, 0.5]);
  expect(maskUv(0, 6, 0, 0, 6)).toEqual([0.5, 1]);
  expect(maskUv(-6, -6, 0, 0, 6)).toEqual([0, 0]);
  // Envelope: zero before Gather, zero after Reveal, token peak at
  // full Gather with no Reveal.
  expect(silhouetteEnvelopeStrength(0, 0, T.morph.silhouettePull)).toBe(0);
  expect(silhouetteEnvelopeStrength(1, 1, T.morph.silhouettePull)).toBe(0);
  expect(silhouetteEnvelopeStrength(1, 0, T.morph.silhouettePull)).toBe(
    T.morph.silhouettePull,
  );
  expect(T.morph.silhouettePull).toBe(0.35);
  // Params: mask kind is per route, strength is zero at rest, and the
  // kind switches at the lerp midpoint like light mode.
  const side = paramsForLayout('sidequests');
  expect(side.silhouetteMask).toBe('sidequests');
  expect(side.silhouetteStrength).toBe(0);
  expect(side.silhouetteRadius).toBe(0);
  expect(paramsForLayout('leaflink').silhouetteMask).toBe('leaflink');
  expect(paramsForLayout('server').silhouetteMask).toBe('none');
  const server = paramsForLayout('server');
  expect(lerpParams(server, side, 0.49).silhouetteMask).toBe('none');
  expect(lerpParams(server, side, 0.5).silhouetteMask).toBe('sidequests');
  // The small mask texture edge is a fixed size, shared by the engine.
  expect(SILHOUETTE_MASK_SIZE).toBe(128);
});

// ---- T-LF-9 (shader mirror): the vertex shader samples the mask and
// pulls after the ring deflection.
test('T-LF-9: vertex shader mirrors the pull after the ring', () => {
  const vert = readFileSync(join(ROOT, 'src', 'world', 'shaders', 'lane.vert.glsl'), 'utf8');
  expect(vert).toContain('uSilhouetteMask');
  expect(vert).toContain('uSilhouetteCenter');
  expect(vert).toContain('uSilhouetteRadius');
  expect(vert).toContain('uSilhouetteStrength');
  expect(vert).toContain('texture(uSilhouetteMask');
  expect(vert).toContain('1.0 - clamp(a, 0.0, 1.0)');
  // Pull applies to both endpoints, after the ring deflection.
  expect(vert.indexOf('deflectXZ(p0.xz)')).toBeLessThan(vert.indexOf('pullXZ(p0.xz)'));
  expect(vert.indexOf('deflectXZ(p1.xz)')).toBeLessThan(vert.indexOf('pullXZ(p1.xz)'));
  // One lane draw call by construction: the shader has no second
  // mesh path, and the mask is a sampler uniform, not a draw.
  expect(vert).not.toContain('gl_DrawID');
});

// ---- T-LF-9 (manifest contract): both per-route mask files exist in
// the pipeline output the engine resolves through the manifest.
test('T-LF-9: manifest names both per-route mask files', () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'public', 'brand', 'manifest.json'), 'utf8'),
  ) as {
    heroes: { sidequests: { frame0: { file: string } }; leaflink: { png: { file: string } } };
  };
  const frame0 = manifest.heroes.sidequests.frame0.file;
  const logo = manifest.heroes.leaflink.png.file;
  expect(frame0.endsWith('.png')).toBe(true);
  expect(logo.endsWith('.png')).toBe(true);
  expect(existsSync(join(ROOT, 'public', 'brand', frame0))).toBe(true);
  expect(existsSync(join(ROOT, 'public', 'brand', logo))).toBe(true);
});

// ---- T-LF-8: one lane draw call with a mask texture bound.
test('T-LF-8: one lane draw call with a mask texture bound', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${HARNESS}?initial=sidequests`);
  const ok = await page.evaluate(() => window.__testReady);
  expect(ok).toBe(true);
  await page.waitForFunction(
    () => window.__lanefield.frameStats().count >= 2,
    null,
    { timeout: 240000 },
  );
  // At rest the pull is zero, so the rest frame is unchanged, while
  // the route mask kind is already set from params.
  const rest = await page.evaluate(() => {
    const f = window.__test.field;
    const p = f.getParams();
    return { mask: p.silhouetteMask, strength: p.silhouetteStrength, radius: p.silhouetteRadius };
  });
  expect(rest.mask).toBe('sidequests');
  expect(rest.strength).toBe(0);
  expect(rest.radius).toBe(0);
  // Wait for the logo mask upload: the debug readout reports the
  // loaded kind and the small texture size.
  await page.waitForFunction(
    () => {
      const s = window.__lanefield.silhouette?.();
      return s !== undefined && s.loaded === 'sidequests';
    },
    null,
    { timeout: 240000 },
  );
  const bound = await page.evaluate(() => ({
    laneCount: window.__lanefield.laneCount,
    calls: window.__lanefield.info().calls,
    silhouette: window.__lanefield.silhouette?.(),
  }));
  console.log('T-LF-8 bound:', bound);
  expect(bound.laneCount).toBe(6144);
  expect(bound.calls).toBe(1);
  expect(bound.silhouette?.loaded).toBe('sidequests');
  expect(bound.silhouette?.width).toBe(128);
  expect(bound.silhouette?.height).toBe(128);
});
