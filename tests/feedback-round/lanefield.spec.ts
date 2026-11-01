// W4 lane field tests: P-LF-1, P-LF-2, P-LF-3, P-LF-4a, and the ITEM 6
// camera clamp check. The formal T-SQ-CAM-1/2/3 suite belongs to W7;
// the clamp check here forces the flat pose in a harness and asserts
// the rendered frame lands inside the band.
//
// Timing note: on SwiftShader a single frame takes 10 to 20 seconds,
// so a 700ms travel jumps from start to finish in one frame. Browser
// tests therefore assert endpoints and invariants, never a mid-travel
// wall-clock sample; interpolation itself is covered by the Node unit
// test below, which checks the exact functions the engine calls.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ringFalloff, ringFalloffDerivative, deflectPoint } from '../../src/world/deflection';
import {
  paramsForLayout,
  lerpParams,
  ringEnvelope,
} from '../../src/world/laneParams';
import { T } from '../../src/tokens.generated';

test.setTimeout(300000);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = process.env.W4_DEV ?? 'http://localhost:5173';
const HARNESS = `${DEV}/tests/world-harness.html`;

async function loadHarness(page: import('@playwright/test').Page, query = ''): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${HARNESS}${query}`);
  const ok = await page.evaluate(() => window.__testReady);
  expect(ok).toBe(true);
  // Wait for two sampled loop frames, so at least one full frame has
  // rendered through the new shaders before any pixel is read.
  await page.waitForFunction(
    () => window.__lanefield.frameStats().count >= 2,
    null,
    { timeout: 240000 },
  );
}

// ---- T-LF-7: deflection ring derivative continuity (unit test).
test('T-LF-7: ring deflection is C1 across the boundary', () => {
  const r = 6;
  const s = 3;
  expect(ringFalloff(0, r)).toBe(1);
  expect(ringFalloff(r, r)).toBe(0);
  expect(ringFalloff(r + 1, r)).toBe(0);
  expect(ringFalloff(-1, r)).toBe(1);
  // Analytic derivative at the boundary from inside is zero, matching
  // the zero derivative outside.
  expect(Math.abs(ringFalloffDerivative(r, r))).toBe(0);
  expect(Math.abs(ringFalloffDerivative(r + 0.5, r))).toBe(0);
  // Numeric derivative just inside the boundary also tends to zero.
  const eps = 1e-4;
  const numeric = (ringFalloff(r, r) - ringFalloff(r - eps, r)) / eps;
  expect(Math.abs(numeric)).toBeLessThan(1e-3);
  // Deflection pushes radially outward inside, leaves outside alone.
  const [x, z] = deflectPoint(3, 0, 0, 0, r, s);
  expect(x).toBeGreaterThan(3);
  expect(z).toBe(0);
  expect(deflectPoint(9, 0, 0, 0, r, s)).toEqual([9, 0]);
  expect(deflectPoint(r, 0, 0, 0, r, s)).toEqual([r, 0]);
  // The shipped vertex shader mirrors the same falloff formula.
  const vert = readFileSync(join(ROOT, 'src', 'world', 'shaders', 'lane.vert.glsl'), 'utf8');
  expect(vert).toContain('1.0 - x * x');
  expect(vert).toContain('uRingCenter');
  expect(vert).toContain('uRingRadius');
  expect(vert).toContain('uRingStrength');
});

// ---- T-LF-2b (unit): parameter interpolation and ring envelope use
// the exact functions the engine calls.
test('T-LF-2b: params interpolate and the ring envelope peaks mid-travel', () => {
  const server = paramsForLayout('server');
  const leaf = paramsForLayout('leaflink');
  expect(server.leadOklab).toEqual(T.scene.server.gradient.leadOklab);
  expect(leaf.lightMode).toBe('radial');
  expect(leaf.lightRadius).toBe(6);
  const mid = lerpParams(server, leaf, 0.5);
  expect(mid.leadOklab[0]).toBeCloseTo(
    (server.leadOklab[0] + leaf.leadOklab[0]) / 2,
    10,
  );
  expect(mid.tailLength).toBeCloseTo((server.tailLength + leaf.tailLength) / 2, 10);
  // Light mode is categorical: it switches at the midpoint.
  expect(lerpParams(server, leaf, 0.49).lightMode).toBe('band');
  expect(lerpParams(server, leaf, 0.5).lightMode).toBe('radial');
  // Ring envelope: zero at both ends, active mid-travel for a project
  // target, and zero throughout for a non-project target.
  const envStart = ringEnvelope(0, true);
  const envMid = ringEnvelope(0.45, true);
  const envEnd = ringEnvelope(1, true);
  expect(envStart.gather).toBe(0);
  expect(envMid.gather).toBeGreaterThan(0);
  expect(envMid.gather * (1 - envMid.reveal)).toBeGreaterThan(0);
  expect(envEnd.reveal).toBe(1);
  expect(ringEnvelope(0.45, false).gather).toBe(0);
  expect(ringEnvelope(0.45, false).collapse).toBeGreaterThanOrEqual(0);
  expect(ringEnvelope(0.45, false).collapse).toBeLessThan(1);
});

// ---- T-LF-1: variant B attributes vary per lane, are fixed, and
// Lockstep zeroes phase jitter.
test('T-LF-1: per-lane band, length, and phase attributes', async ({ page }) => {
  await loadHarness(page, '?initial=leaflink');
  const attrs = await page.evaluate(() => {
    const f = window.__test.field;
    const out = [];
    for (let lane = 0; lane < 300; lane++) out.push(f.laneAttributes(lane));
    return out;
  });
  const bands = new Set(attrs.map((a) => a.band));
  expect(bands).toEqual(new Set([0, 1, 2]));
  for (const a of attrs) {
    expect(a.lengthScale).toBeGreaterThanOrEqual(0.82);
    expect(a.lengthScale).toBeLessThanOrEqual(1.18);
  }
  expect(new Set(attrs.map((a) => a.lengthScale)).size).toBeGreaterThan(50);
  expect(attrs.some((a) => a.phaseJitter !== 0)).toBe(true);
  // Fixed per lane: a second read matches exactly.
  const again = await page.evaluate(() => {
    const f = window.__test.field;
    return [f.laneAttributes(7), f.laneAttributes(100)];
  });
  expect(again[0]).toEqual(attrs[7]);
  expect(again[1]).toEqual(attrs[100]);
  // On the server route, Lockstep zeroes phase jitter for every lane.
  await page.evaluate(() => window.__test.field.travelTo('server'));
  const serverAttrs = await page.evaluate(() => {
    const f = window.__test.field;
    const out = [];
    for (let lane = 0; lane < 100; lane++) out.push(f.laneAttributes(lane).phaseJitter);
    return out;
  });
  expect(serverAttrs.every((v) => v === 0)).toBe(true);
});

// ---- T-LF-2: persistent canvas and endpoint params across travel.
test('T-LF-2: canvas persists and params land on the target tokens', async ({ page }) => {
  await loadHarness(page, '?initial=server');
  const result = await page.evaluate(async () => {
    const f = window.__test.field;
    const canvasBefore = document.querySelector('#world canvas');
    await f.travelTo('leaflink');
    const end = f.getParams();
    const canvasAfter = document.querySelector('#world canvas');
    return {
      sameAfter: canvasBefore === canvasAfter,
      endLead: end.leadOklab,
      endTail: end.tailOklab,
      endRingStrength: end.ringStrength,
      endLightMode: end.lightMode,
      endLightRadius: end.lightRadius,
    };
  });
  expect(result.sameAfter).toBe(true);
  // At rest the params equal the leaflink tokens and the ring is zero.
  for (let i = 0; i < 3; i++) {
    expect(Math.abs(result.endLead[i] - T.scene.leaflink.gradient.leadOklab[i])).toBeLessThan(1e-6);
    expect(Math.abs(result.endTail[i] - T.scene.leaflink.gradient.tailOklab[i])).toBeLessThan(1e-6);
  }
  expect(result.endRingStrength).toBe(0);
  expect(result.endLightMode).toBe('radial');
  expect(result.endLightRadius).toBe(6);
  // setParams/getParams round-trip.
  const roundTrip = await page.evaluate(() => {
    const f = window.__test.field;
    f.setParams({ tailLength: 0.25 });
    return f.getParams().tailLength;
  });
  expect(roundTrip).toBe(0.25);
});

// ---- Pixel helpers: decode a screenshot in the page and classify
// pixels in OKLab. Ground hexes come from the tokens.
function oklabJs(): string {
  return `
    const srgbToLinear = (c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const toOklab = (r, g, b) => {
      const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
      const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
      const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
      const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
      const l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
      return [
        0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3,
        1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3,
        0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3,
      ];
    };
    const hueDeg = (a, b) => {
      let h = (Math.atan2(b, a) * 180) / Math.PI;
      if (h < 0) h += 360;
      return h;
    };
  `;
}

async function analyzeScreenshot(
  page: import('@playwright/test').Page,
  groundHex: string | null,
): Promise<{ lanePixels: number; inBand: number; darkColored: number; darkInBand: number }> {
  const shot = await page.screenshot();
  const b64 = shot.toString('base64');
  return page.evaluate(
    async ({ b64, groundHex }) => {
      const src = (window as unknown as { __oklabSrc: string }).__oklabSrc;
      const run = new Function(
        'b64',
        'groundHex',
        `${src}; return (async () => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          const cv = document.createElement('canvas');
          cv.width = img.width; cv.height = img.height;
          const ctx = cv.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
          let gL = 0, ga = 0, gb2 = 0;
          if (groundHex) {
            const gr = parseInt(groundHex.slice(1, 3), 16);
            const gg = parseInt(groundHex.slice(3, 5), 16);
            const gb = parseInt(groundHex.slice(5, 7), 16);
            [gL, ga, gb2] = toOklab(gr, gg, gb);
          }
          let lanePixels = 0, inBand = 0, darkColored = 0, darkInBand = 0;
          for (let i = 0; i < data.length; i += 4) {
            const [L, a, b] = toOklab(data[i], data[i + 1], data[i + 2]);
            const d = Math.sqrt((L - gL) ** 2 + (a - ga) ** 2 + (b - gb2) ** 2);
            const chroma = Math.sqrt(a * a + b * b);
            const hue = hueDeg(a, b);
            if (groundHex && d > 0.05) {
              lanePixels++;
              if (chroma < 0.04 || (hue >= 230 && hue <= 285)) inBand++;
            }
            if (L < 0.35 && chroma > 0.04) {
              darkColored++;
              if (hue >= 230 && hue <= 285) darkInBand++;
            }
          }
          return { lanePixels, inBand, darkColored, darkInBand };
        })();`,
      );
      return run(b64, groundHex) as Promise<{
        lanePixels: number;
        inBand: number;
        darkColored: number;
        darkInBand: number;
      }>;
    },
    { b64, groundHex },
  );
}

// ---- T-LF-3: sampled lane pixels sit in the hue band, every route.
for (const [route, ground] of [
  ['server', T.color.void.ground],
  ['leaflink', T.color.paper.ground],
  ['sidequests', T.color.field.ground],
] as const) {
  test(`T-LF-3: lane pixels in the hue band on ${route}`, async ({ page }) => {
    await loadHarness(page, `?initial=${route}`);
    await page.evaluate((src) => {
      (window as unknown as { __oklabSrc: string }).__oklabSrc = src;
    }, oklabJs());
    const result = await analyzeScreenshot(page, ground);
    console.log(`T-LF-3 ${route}: lanePixels=${result.lanePixels} inBand=${result.inBand}`);
    expect(result.lanePixels).toBeGreaterThan(500);
    expect(result.inBand / result.lanePixels).toBeGreaterThanOrEqual(0.95);
  });
}

// ---- T-LF-5: dithered near-black pixels pass the hue gate.
test('T-LF-5: near-black lane pixels pass the hue gate', async ({ page }) => {
  await loadHarness(page, '?initial=server');
  await page.evaluate((src) => {
    (window as unknown as { __oklabSrc: string }).__oklabSrc = src;
  }, oklabJs());
  const result = await analyzeScreenshot(page, null);
  console.log(`T-LF-5: darkColored=${result.darkColored} darkInBand=${result.darkInBand}`);
  expect(result.darkColored).toBeGreaterThan(500);
  expect(result.darkInBand / result.darkColored).toBeGreaterThanOrEqual(0.98);
});

// ---- T-LF-4: no CSS gradient in site-authored styles, every route.
// Scoping note, stated plainly: the strict form (no gradient in any
// computed style) fails on the base too, because the Astryx theme
// runtime injects two fade divs with hashed x* classes and a
// linear-gradient background (verified identical on the sibling W3
// tree, which has none of the W4 changes). Those divs are theme
// output, not site CSS, and W4 does not own the theme. This test
// therefore asserts (a) zero gradient functions in site-authored
// source (src styles plus index.html inline styles), and (b) zero
// gradient computed styles on any element except the known theme
// fade divs, which are logged and capped at two, each matching the
// theme fade pattern, so a new gradient anywhere still fails.
for (const route of ['', '/leaflink', '/sidequests']) {
  test(`T-LF-4: no CSS gradient on route ${route || '/'}`, async ({ page }) => {
    const { readdirSync, statSync } = await import('node:fs');
    const cssFiles: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.css')) cssFiles.push(p);
      }
    };
    walk(join(ROOT, 'src'));
    const sources = [
      ...cssFiles.map((f) => readFileSync(f, 'utf8')),
      readFileSync(join(ROOT, 'index.html'), 'utf8'),
    ];
    for (const text of sources) {
      expect(text).not.toMatch(/linear-gradient|radial-gradient/);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${DEV}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jp-keymap', { timeout: 30000 });
    const result = await page.evaluate(() => {
      const siteHits: string[] = [];
      const themeHits: string[] = [];
      for (const el of document.querySelectorAll('*')) {
        const bg = getComputedStyle(el).backgroundImage;
        if (!bg || !bg.includes('gradient')) continue;
        const classes = ((el as HTMLElement).className?.toString() ?? '').split(/\s+/).filter(Boolean);
        const isThemeRuntime =
          classes.length > 0 && classes.every((c) => /^x[0-9a-z]+$/.test(c));
        const entry = `${el.tagName} ${bg.slice(0, 100)}`;
        if (isThemeRuntime) themeHits.push(entry);
        else siteHits.push(entry);
      }
      return { siteHits, themeHits };
    });
    console.log(`T-LF-4 ${route || '/'}: theme fade divs excluded:`, result.themeHits);
    expect(result.siteHits).toEqual([]);
    expect(result.themeHits.length).toBeLessThanOrEqual(2);
    for (const h of result.themeHits) {
      expect(h).toMatch(/linear-gradient\(rgb\(.*\) 60%, rgba\(0, 0, 0, 0\)\)/);
    }
  });
}

// ---- T-LF-6: one draw call and fixed attributes through a morph,
// and no lane-indexed start delay in the shaders.
test('T-LF-6: lane count, draw calls, and attributes fixed through a morph', async ({ page }) => {
  await loadHarness(page, '?initial=server');
  const before = await page.evaluate(() => ({
    laneCount: window.__lanefield.laneCount,
    calls: window.__lanefield.info().calls,
    attr: window.__test.field.laneAttributes(100),
  }));
  expect(before.laneCount).toBe(6144);
  expect(before.calls).toBe(1);
  const during = await page.evaluate(async () => {
    const f = window.__test.field;
    const travel = f.travelTo('sidequests');
    const samples = [];
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      samples.push({
        laneCount: window.__lanefield.laneCount,
        calls: window.__lanefield.info().calls,
        attr: f.laneAttributes(100),
      });
    }
    await travel;
    return {
      samples,
      after: {
        laneCount: window.__lanefield.laneCount,
        calls: window.__lanefield.info().calls,
        attr: f.laneAttributes(100),
      },
    };
  });
  // Note: on SwiftShader the travel resolves on the first slow frame,
  // so samples may be pre- or post-travel states; the invariants hold
  // in both, which is what edge-only entry and exit requires.
  for (const s of during.samples) {
    expect(s.laneCount).toBe(6144);
    expect(s.calls).toBe(1);
    expect(s.attr.band).toBe(before.attr.band);
    expect(s.attr.lengthScale).toBe(before.attr.lengthScale);
  }
  expect(during.after.laneCount).toBe(6144);
  expect(during.after.calls).toBe(1);
  // band, lengthScale, and the phase seed are fixed; the effective
  // phaseJitter varies by design with the server weight (zero on the
  // server route, the seed elsewhere), so it is not compared here.
  expect(during.after.attr.band).toBe(before.attr.band);
  expect(during.after.attr.lengthScale).toBe(before.attr.lengthScale);
  expect(during.after.attr.phaseJitterSeed).toBe(before.attr.phaseJitterSeed);
  // No per-lane start delay: the shaders never subtract a lane-indexed
  // time offset from uTime.
  const frag = readFileSync(join(ROOT, 'src', 'world', 'shaders', 'lane.frag.glsl'), 'utf8');
  const vert = readFileSync(join(ROOT, 'src', 'world', 'shaders', 'lane.vert.glsl'), 'utf8');
  expect(frag).not.toMatch(/uTime\s*-\s*float\(vLane\)/);
  expect(vert).not.toMatch(/uTime\s*-\s*float\(/);
});

// ---- T-TRANS-1: the same canvas node across routes in the real app.
test('T-TRANS-1: canvas node persists across routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${DEV}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelector('#world canvas') !== null,
    null,
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    (window as unknown as { __w4canvas: Element | null }).__w4canvas =
      document.querySelector('#world canvas');
  });
  for (const key of ['2', '3', '1']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(1200);
    const same = await page.evaluate(() => {
      const ref = (window as unknown as { __w4canvas: Element | null }).__w4canvas;
      const now = document.querySelector('#world canvas');
      const all = document.querySelectorAll('#world canvas');
      return { same: ref === now, count: all.length };
    });
    expect(same.count).toBe(1);
    expect(same.same).toBe(true);
  }
});

// ---- T-SQ-CLAMP-1 (targeted ITEM 6 check; formal T-SQ-CAM suite is W7):
// force the SideQuests camera to the flat pose every frame and assert
// the rendered pitch lands inside the band, with position untouched.
// Frame-gated: samples are read only after a new loop frame renders.
test('T-SQ-CLAMP-1: forced flat pose clamps inside the band', async ({ page }) => {
  await loadHarness(page, '?initial=sidequests');
  const baseCount = await page.evaluate(() => window.__lanefield.frameStats().count);
  await page.evaluate(() => {
    const f = window.__test.field;
    const cam = f.camera;
    const off = f.onFrame(() => {
      cam.position.set(0, 30, 0);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
    });
    (window as unknown as { __w4clampOff: () => void }).__w4clampOff = off;
  });
  await page.waitForFunction(
    (base) => window.__lanefield.frameStats().count > base,
    baseCount,
    { timeout: 240000 },
  );
  const clamped = await page.evaluate(() => window.__lanefield.camera);
  console.log('T-SQ-CLAMP-1 clamped pitch:', clamped.pitchDeg, 'pos:', clamped.pos);
  // Band edges with float epsilon: the clamped value is -75 to within
  // 4e-12 in the observed run.
  expect(clamped.pitchDeg).toBeGreaterThanOrEqual(-75 - 1e-6);
  expect(clamped.pitchDeg).toBeLessThanOrEqual(-5 + 1e-6);
  // Clamped to the steep edge, not left at flat -90.
  expect(Math.abs(clamped.pitchDeg - -75)).toBeLessThan(0.01);
  expect(clamped.pos[0]).toBeCloseTo(0, 5);
  expect(clamped.pos[1]).toBeCloseTo(30, 5);
  expect(clamped.pos[2]).toBeCloseTo(0, 5);
  // Release the forced pose; the next frame returns inside the band.
  const count2 = await page.evaluate(() => window.__lanefield.frameStats().count);
  await page.evaluate(() => {
    (window as unknown as { __w4clampOff: () => void }).__w4clampOff();
  });
  await page.waitForFunction(
    (base) => window.__lanefield.frameStats().count > base,
    count2,
    { timeout: 240000 },
  );
  const rest = await page.evaluate(() => window.__lanefield.camera.pitchDeg);
  console.log('T-SQ-CLAMP-1 rest pitch:', rest);
  expect(rest).toBeGreaterThanOrEqual(-75 - 1e-6);
  expect(rest).toBeLessThanOrEqual(-5 + 1e-6);
});
