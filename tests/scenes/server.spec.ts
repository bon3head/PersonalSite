// Server scene tests (S05). T-SRV-1 and T-SRV-3 run in Node; the rest
// run in the browser against the vite dev server.
import { test, expect } from '@playwright/test';
import { generate } from '../../src/world/layouts/server';
import { T } from '../../src/tokens.generated';
import { C } from '../../src/copy';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = 'http://localhost:5173';
const VOID_GROUND: [number, number, number] = [10, 12, 15];

// ---- T-SRV-1: geometry matches the formula (B5a proved the generator;
// this re-verifies the controller's input through the same entry point).
test('T-SRV-1: server layout hand values', () => {
  const buf = new Float32Array(
    T.world.layoutTexture.width * T.world.layoutTexture.height * 4,
  );
  generate(T.world.seed, buf, 0);
  const point = (lane: number, k: number): [number, number, number] => {
    const stride = T.world.pointsPerLane * T.world.layouts.length;
    const base = (lane * stride + 0 * T.world.pointsPerLane + k) * 4;
    return [buf[base], buf[base + 1], buf[base + 2]];
  };
  const close = (a: number, b: number) => {
    expect(Math.abs(a - b)).toBeLessThan(1e-4);
  };
  const [x0, y0, z0] = point(0, 0);
  close(x0, -3.565);
  close(y0, -2.315);
  close(z0, -24);
  const [x6, y6, z6] = point(0, 6);
  close(x6, -1.7825);
  close(y6, -1.1575);
  close(z6, 0.4);
  const [x7, y7, z7] = point(0, 7);
  close(x7, -0.2852);
  close(y7, -0.1852);
  close(z7, 2.2);
  expect(T.world.laneCount).toBe(6144);
});

// ---- T-SRV-3: lockstep. JS port of the S02 fire() GLSL: the phase,
// period, and head all hash on warp (lane >> 5) and sm (lane >> 7),
// never on the lane within a warp, so every lane of a warp fires
// identically at the same u and t. Also verifies the shipped shader
// source hashes on warp, not on lane.
function hash11(p: number): number {
  p = (p * 0.1031) % 1;
  p *= p + 33.33;
  p *= p + p;
  return p - Math.floor(p);
}
function fire(lane: number, u: number, t: number): number {
  const warp = Math.floor(lane / 32);
  const sm = Math.floor(lane / 128);
  const h = hash11(warp * 17 + 3);
  const period =
    T.world.server.fire.periodSec[0] +
    (T.world.server.fire.periodSec[1] - T.world.server.fire.periodSec[0]) * h;
  const phase = (t / period + h) % 1;
  const occ = phase < T.world.server.fire.dutyCycle ? 1 : 0;
  const sweep =
    0.5 +
    0.5 * Math.sin(6.2831853 * (t / T.world.server.fire.sweepPeriodSec - (sm % 8) / 8));
  const head = (t * T.world.server.fire.speedLengthsPerSec + hash11(warp + 101)) % 1;
  let dd = u - head;
  dd -= Math.floor(dd + 0.5);
  const pulse = Math.exp(-(dd * dd) / (T.world.server.fire.sigma * T.world.server.fire.sigma));
  return occ * pulse * (0.55 + 0.45 * sweep);
}

test('T-SRV-3: warp 10 fires in lockstep', () => {
  for (const [u, t] of [
    [0.1, 1.3],
    [0.5, 4.7],
    [0.9, 9.1],
  ] as const) {
    const values = new Set<number>();
    for (let lane = 320; lane < 352; lane++) values.add(fire(lane, u, t));
    expect(values.size).toBe(1);
  }
  // The shipped shader must hash on warp, not lane: the fire function
  // body references lane only through the warp/sm shifts.
  const shaders = join(ROOT, 'src', 'world', 'shaders');
  const frag = readFileSync(join(shaders, 'lane.frag.glsl'), 'utf8');
  expect(frag).toContain('lane >> 5');
  expect(frag).toContain('lane >> 7');
  expect(frag).not.toMatch(/hash11\(float\(lane\)/);
});

// ---- Pixel helpers: decode a Playwright screenshot inside the page
// (canvas 2D) and return aggregates, so full-page RGBA never crosses
// the protocol. OKLab math per the Oklab spec; delta E is Euclidean
// distance in OKLab.
interface PixelStats {
  maxDelta: number;
  overChroma: number;
  total: number;
}

async function analyzeShot(
  page: import('@playwright/test').Page,
  shot: Buffer,
  region: { x: number; y: number; w: number; h: number } | null,
  mode: 'delta' | 'chroma',
): Promise<PixelStats> {
  const b64 = shot.toString('base64');
  return page.evaluate(
    async ({ b64, region, mode, ground }) => {
      const srgbToLinear = (c: number): number => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const toOklab = (r: number, g: number, b: number): [number, number, number] => {
        const R = srgbToLinear(r);
        const G = srgbToLinear(g);
        const B = srgbToLinear(b);
        const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
        const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
        const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
        const lc = Math.cbrt(l);
        const mc = Math.cbrt(m);
        const sc = Math.cbrt(s);
        return [
          0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
          1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
          0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc,
        ];
      };
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('img load failed'));
        img.src = 'data:image/png;base64,' + b64;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const r = region ?? { x: 0, y: 0, w: img.width, h: img.height };
      const data = ctx.getImageData(r.x, r.y, r.w, r.h).data;
      const [gL, gA, gB] = toOklab(ground[0], ground[1], ground[2]);
      let maxDelta = 0;
      let overChroma = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const [L, A, B] = toOklab(data[i], data[i + 1], data[i + 2]);
        total += 1;
        if (mode === 'delta') {
          const d = Math.sqrt((L - gL) ** 2 + (A - gA) ** 2 + (B - gB) ** 2);
          if (d > maxDelta) maxDelta = d;
        } else {
          if (Math.sqrt(A * A + B * B) > 0.04) overChroma += 1;
        }
      }
      return { maxDelta, overChroma, total };
    },
    { b64, region, mode, ground: VOID_GROUND },
  );
}

async function waitReady(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => window.__lanefield?.ready === true, {
    timeout: 240000,
  });
}

// ---- T-SRV-2: readout is clear (no lane pixel inside readout box +
// padding). Hide the readout, screenshot, and require every pixel in
// the region to be within delta E 0.01 of void ground.
for (const vp of [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
] as const) {
  test(`T-SRV-2: readout clear at ${vp.w}x${vp.h}`, async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(`${DEV}/`);
    await waitReady(page);
    await page.waitForTimeout(3000);
    const box = await page.evaluate(() => {
      const el = document.querySelector('.jp-readout');
      if (!el) throw new Error('no readout');
      const r = el.getBoundingClientRect();
      const pad = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--spacing-6'),
      );
      const dpr = window.devicePixelRatio || 1;
      const x = Math.max(0, Math.floor((r.left - pad) * dpr));
      const y = Math.max(0, Math.floor((r.top - pad) * dpr));
      const w = Math.min(
        Math.floor(window.innerWidth * dpr) - x,
        Math.ceil((r.width + pad * 2) * dpr),
      );
      const h = Math.min(
        Math.floor(window.innerHeight * dpr) - y,
        Math.ceil((r.height + pad * 2) * dpr),
      );
      // Hide the readout so the canvas behind it is what we sample.
      (el as HTMLElement).style.visibility = 'hidden';
      return { x, y, w, h };
    });
    const shot = await page.screenshot();
    const stats = await analyzeShot(page, shot, box, 'delta');
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.maxDelta).toBeLessThan(0.01);
  });
}

// ---- T-SRV-4: words. Drive the real controller against a stub field
// (no WebGL needed for word logic: spawn, drift, color, opacity all run
// on the meshes themselves). Collect spawned strings over 12s; the set
// must equal world.server.words exactly.
test('T-SRV-4: word set equals world.server.words over 12s', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(`${DEV}/?world=0`);
  const spawned = await page.evaluate(async () => {
    const serverMod = await import('/src/world/server.ts');
    const cbs: Array<(t: number, dt: number) => void> = [];
    let clock = 0;
    const field = {
      scene: { add: () => {}, remove: () => {} },
      camera: { quaternion: { x: 0, y: 0, z: 0, w: 1 } },
      now: () => clock,
      onFrame: (cb: (t: number, dt: number) => void) => {
        cbs.push(cb);
        return () => {
          const i = cbs.indexOf(cb);
          if (i >= 0) cbs.splice(i, 1);
        };
      },
    };
    const ctl = serverMod.createServerController(field as never);
    await new Promise<void>((resolve) => {
      const step = 0.05;
      const timer = setInterval(() => {
        clock += step;
        for (const cb of [...cbs]) cb(clock, step);
        if (clock >= 12) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
    const out = ctl.spawnedWords();
    ctl.dispose();
    return out;
  });
  expect(new Set(spawned)).toEqual(new Set(T.world.server.words));
  expect(spawned.length).toBeGreaterThanOrEqual(T.world.server.words.length);
});

// ---- T-SRV-5: hue budget. At most 30% of pixels have OKLCH chroma
// above 0.04 on the server route.
test('T-SRV-5: server hue budget', async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${DEV}/`);
  await waitReady(page);
  await page.waitForTimeout(3000);
  const shot = await page.screenshot();
  const stats = await analyzeShot(page, shot, null, 'chroma');
  expect(stats.total).toBeGreaterThan(0);
  expect(stats.overChroma / stats.total).toBeLessThanOrEqual(
    T.hueBudgetPct.server / 100,
  );
});

// ---- T-SRV-6: first paint has the name. The LCP entry's element is
// the H1 "Justin Poli". LCP entries are observer-gated in Chromium:
// getEntriesByType returns nothing unless an observer subscribed before
// the paint, so register the observer via addInitScript first.
test('T-SRV-6: LCP element is the H1', async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__lcpEntries = [];
    const obs = new PerformanceObserver((list) => {
      const arr = (window as unknown as Record<string, unknown[]>).__lcpEntries;
      for (const e of list.getEntries()) arr.push(e);
    });
    obs.observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(`${DEV}/`);
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  const lcp = await page.evaluate(() => {
    const entries = (window as unknown as Record<string, Array<{ element?: Element | null }>>).__lcpEntries ?? [];
    if (entries.length === 0) return null;
    const last = entries[entries.length - 1];
    const el = last.element;
    if (!el) return { tag: null, text: null };
    return { tag: el.tagName, text: (el.textContent ?? '').trim() };
  });
  expect(lcp).not.toBeNull();
  expect(lcp?.tag).toBe('H1');
  expect(lcp?.text).toBe(C['C-SRV-H1']);
});

// ---- G-COPY for the / route: the rendered readout matches S09 copy
// exactly (banned-scan runs as a gate; this pins the content).
test('G-COPY: server readout matches S09 copy', async ({ page }) => {
  await page.goto(`${DEV}/`);
  const text = await page.evaluate(() => {
    const section = document.querySelector('.jp-readout--server');
    if (!section) return null;
    const h1 = section.querySelector('h1')?.textContent ?? '';
    const ps = [...section.querySelectorAll('p')].map((p) => p.textContent ?? '');
    return { h1, ps };
  });
  expect(text).not.toBeNull();
  expect(text?.h1).toBe(C['C-SRV-H1']);
  expect(text?.ps).toEqual([C['C-SRV-P1'], C['C-SRV-P2'], C['C-SRV-P3']]);
});
