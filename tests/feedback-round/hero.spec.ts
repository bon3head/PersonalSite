// W6 hero tests: P-HERO-1 mount, P-HERO-2 gates, P-HERO-3 motion.
// Browser timing note, same as the W4 suite: SwiftShader frames
// take seconds, so browser tests assert settled invariants and DOM
// timing, never a mid-travel wall-clock pixel sample; the pure
// geometry and motion functions are pinned by the Node unit tests
// below, which call the exact functions the component calls.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T } from '../../src/tokens.generated';
import {
  heroDisplayedSize,
  heroBeatEnvelope,
  heroWanderOffsetAt,
  placeHero,
  rectsIntersect,
} from '../../src/hero/heroGeometry';
import { fingerprintMaxDeltaE, areaRatio } from '../../src/hero/brandGates';

test.setTimeout(300000);

declare global {
  interface Window {
    __test?: {
      field: {
        worldToScreen: (p: [number, number, number]) => [number, number];
      };
    };
  }
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = 'http://localhost:5173';

type Rect = [number, number, number, number];

function intersects(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

async function waitHero(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-brand-mark]') as HTMLElement | null;
    if (!el || !el.style.left) return false;
    if (getComputedStyle(el).visibility === 'hidden') return false;
    const img = el.querySelector('img');
    const text = el.querySelector('.jp-hero-text');
    if (img) return img.naturalWidth > 0;
    return text !== null;
  }, null, { timeout: 60000, polling: 100 });
}

async function heroRect(page: Page): Promise<Rect> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-brand-mark]') as HTMLElement;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.right, r.bottom] as Rect;
  });
}

async function zoneRects(page: Page): Promise<{
  name: Rect | null;
  readout: Rect | null;
  keymap: Rect | null;
  twins: Rect[];
}> {
  return page.evaluate(() => {
    const rect = (sel: string): Rect | null => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.left, r.top, r.right, r.bottom] as Rect;
    };
    const nameEl = document.querySelector('.jp-wordmark') as HTMLElement | null;
    const hidden =
      !nameEl || nameEl.hidden || getComputedStyle(nameEl).display === 'none';
    const nr = hidden ? null : rect('.jp-wordmark');
    const name: Rect | null = nr
      ? [nr[0] - 12, nr[1] - 12, nr[2] + 12, nr[3] + 12]
      : null;
    const twins: Rect[] = [];
    const btns = document.querySelectorAll('button[aria-pressed]');
    for (let i = 0; i < btns.length; i++) {
      const r = btns[i].getBoundingClientRect();
      twins.push([r.left, r.top, r.right, r.bottom]);
    }
    return { name, readout: rect('.jp-readout'), keymap: rect('.jp-keymap'), twins };
  });
}

// ---- T-HERO-1 (unit + browser): exactly one mark per project route.
test('T-HERO-1: exactly one mark per project route, none on server or whoami', async ({
  browser,
}) => {
  const cases: Array<{ route: string; count: number; mark: string | null }> = [
    { route: '/', count: 0, mark: null },
    { route: '/leaflink', count: 1, mark: 'leaflink' },
    { route: '/sidequests', count: 1, mark: 'sidequests' },
    { route: '/nope', count: 0, mark: null },
  ];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const c of cases) {
    await page.goto(`${DEV}${c.route}?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jp-keymap', { timeout: 30000 });
    if (c.count === 1) {
      await waitHero(page);
    } else {
      await page.waitForTimeout(1500);
    }
    const marks = await page.evaluate(() =>
      [...document.querySelectorAll('[data-brand-mark]')].map((el) =>
        el.getAttribute('data-brand-mark'),
      ),
    );
    expect(marks, `${c.route} marks`).toEqual(
      c.count === 1 ? [c.mark] : [],
    );
  }
  // Server route with the whoami sheet open: no mark.
  await page.goto(`${DEV}/?world=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.keyboard.press('w');
  await page.waitForTimeout(1200);
  const serverWhoami = await page.evaluate(() =>
    document.querySelectorAll('[data-brand-mark]').length,
  );
  expect(serverWhoami).toBe(0);
  // LeafLink route with the whoami sheet open: the sheet state shows
  // no mark either, since the hero renders only with no sheet open.
  await page.goto(`${DEV}/leaflink?world=0`, { waitUntil: 'domcontentloaded' });
  await waitHero(page);
  await page.keyboard.press('w');
  await page.waitForTimeout(1200);
  const leafWhoami = await page.evaluate(() =>
    document.querySelectorAll('[data-brand-mark]').length,
  );
  expect(leafWhoami).toBe(0);
  await context.close();
});

// ---- T-HERO-2 (file): fingerprint within DeltaE 3.
test('T-HERO-2: shipped mark pixels sit within fingerprintDeltaE of the fingerprint', async () => {
  const { execFileSync } = await import('node:child_process');
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'public', 'brand', 'manifest.json'), 'utf8'),
  ) as {
    heroes: {
      sidequests: { frame0: { file: string; fingerprint: string[] } };
      leaflink: { png: { file: string; fingerprint: string[] } };
    };
  };
  const script = `
import sys, json
import numpy as np
from PIL import Image
out = {}
for path in sys.argv[1:]:
    a = np.asarray(Image.open(path).convert("RGBA"))
    mask = a[:, :, 3] > 0
    px = a[mask][:, :3]
    uniq = np.unique(px, axis=0)
    out[path] = uniq.tolist()
print(json.dumps(out))
`;
  const paths = [
    join(ROOT, 'public', 'brand', manifest.heroes.sidequests.frame0.file),
    join(ROOT, 'public', 'brand', manifest.heroes.leaflink.png.file),
  ];
  const uniq = JSON.parse(
    execFileSync('python3', ['-c', script, ...paths], {
      encoding: 'utf8',
      timeout: 300000,
    }),
  ) as Record<string, number[][]>;
  for (const [key, entry] of [
    ['sidequests', manifest.heroes.sidequests.frame0],
    ['leaflink', manifest.heroes.leaflink.png],
  ] as const) {
    const path = join(ROOT, 'public', 'brand', entry.file);
    const colors = (uniq[path] as number[][]).map(
      (c) => [c[0], c[1], c[2]] as [number, number, number],
    );
    const worst = fingerprintMaxDeltaE(colors, entry.fingerprint);
    console.log(`T-HERO-2 ${key}: unique colors=${colors.length} maxDeltaE=${worst}`);
    expect(worst).toBeLessThan(T.brand.fingerprintDeltaE);
  }
});

// ---- Alt text rule: project name plus what the mark depicts, 12
// words or fewer, never starting with "image of".
test('T-HERO-ALT: manifest alt text follows the approved rule', () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'public', 'brand', 'manifest.json'), 'utf8'),
  ) as {
    heroes: {
      sidequests: { gif: { alt: string } };
      leaflink: { png: { alt: string } };
    };
  };
  expect(manifest.heroes.sidequests.gif.alt).toBe(
    'SideQuests logo, green handwritten wordmark with a star',
  );
  expect(manifest.heroes.leaflink.png.alt).toBe(
    'LeafLink logo, green leaves forming a smile',
  );
  for (const alt of [
    manifest.heroes.sidequests.gif.alt,
    manifest.heroes.leaflink.png.alt,
  ]) {
    expect(alt.split(/\s+/).length).toBeLessThanOrEqual(12);
    expect(alt.toLowerCase().startsWith('image of')).toBe(false);
  }
});

// ---- T-HERO-2 (browser): hue gate passes with the exclusion, and a
// planted green pixel outside the rectangle fails it.
test('T-HERO-2: hue gate passes with the exclusion, planted pixel outside fails it', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${DEV}/leaflink?world=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await waitHero(page);
  const rect = await heroRect(page);
  const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
  const scaled: Rect = [rect[0] * dpr, rect[1] * dpr, rect[2] * dpr, rect[3] * dpr];
  const fracExcluding = async (): Promise<number> => {
    const shot = await page.screenshot();
    return page.evaluate(
      async ({ b64, hero }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = img.width;
        cv.height = img.height;
        const ctx = cv.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
        const toLin = (c: number): number => {
          const s = c / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        let over = 0;
        let total = 0;
        for (let y = 0; y < cv.height; y++) {
          for (let x = 0; x < cv.width; x++) {
            if (x >= hero[0] && x < hero[2] && y >= hero[1] && y < hero[3]) continue;
            const i = (y * cv.width + x) * 4;
            const r = toLin(data[i]);
            const g = toLin(data[i + 1]);
            const b = toLin(data[i + 2]);
            const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
            const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
            const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
            const l3 = Math.cbrt(l);
            const m3 = Math.cbrt(m);
            const s3 = Math.cbrt(s);
            const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
            const bb = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;
            const chroma = Math.sqrt(a * a + bb * bb);
            total++;
            if (chroma > 0.04) over++;
          }
        }
        return over / total;
      },
      { b64: shot.toString('base64'), hero: scaled },
    );
  };
  const clean = await fracExcluding();
  console.log(`T-HERO-2 leaflink hue fraction excluding hero: ${clean}`);
  expect(clean).toBeLessThan(T.hueBudgetPct.leaflink / 100);
  // Planted green block outside the hero rectangle: 390 by 200 px
  // in the lower readout band, where the hero never sits on this
  // route. It must count, because it is outside the rectangle.
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.id = 'hero-planted';
    div.style.position = 'fixed';
    div.style.left = '0px';
    div.style.top = `${window.innerHeight - 260}px`;
    div.style.width = `${window.innerWidth}px`;
    div.style.height = '200px';
    div.style.background = '#15B171';
    div.style.zIndex = '5';
    document.body.appendChild(div);
  });
  const planted = await fracExcluding();
  console.log(`T-HERO-2 leaflink hue fraction with planted block: ${planted}`);
  expect(planted).toBeGreaterThan(T.hueBudgetPct.leaflink / 100);
  await context.close();
});

// ---- T-HERO-3: hero rectangle avoids name, readout, keymap, and
// marker tap targets on 3 phones, across beat and wander cycles.
// One test per phone and route: a single test holding six world
// loads exceeds the per-test timeout on SwiftShader, and a split
// also isolates which combination fails.
for (const vp of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  for (const route of ['/leaflink', '/sidequests']) {
    test(`T-HERO-3: hero rectangle avoids every zone and marker target on ${route} ${vp.width}x${vp.height}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: vp,
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      await page.goto(`${DEV}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.jp-keymap', { timeout: 30000 });
      await page.waitForFunction(() => window.__lanefield?.ready === true, null, {
        timeout: 240000,
        polling: 100,
      });
      await waitHero(page);
      // Readout entrance and hero placement settle before sampling.
      await page.waitForTimeout(2500);
      const samples = route === '/leaflink' ? 8 : 10;
      const gapMs = route === '/leaflink' ? 200 : 300;
      for (let s = 0; s < samples; s++) {
        const hero = await heroRect(page);
        const zones = await zoneRects(page);
        const blockers: Array<{ name: string; rect: Rect }> = [];
        if (zones.name) blockers.push({ name: 'name', rect: zones.name });
        if (zones.readout) blockers.push({ name: 'readout', rect: zones.readout });
        if (zones.keymap) blockers.push({ name: 'keymap', rect: zones.keymap });
        zones.twins.forEach((t, i) => blockers.push({ name: `twin${i}`, rect: t }));
        for (const b of blockers) {
          expect(
            intersects(hero, b.rect),
            `${route} ${vp.width}x${vp.height} sample ${s}: hero ${JSON.stringify(hero)} vs ${b.name} ${JSON.stringify(b.rect)}`,
          ).toBe(false);
        }
        // Motion bounds at the sampled frame: beat scale at or under
        // the token, wander offset magnitude at or under 10 px.
        const motion = await page.evaluate(() => {
          const el = document.querySelector('[data-brand-mark]') as HTMLElement;
          const t = getComputedStyle(el).transform;
          if (t === 'none') return { scale: 1, dx: 0, dy: 0 };
          const m = t.match(/matrix\(([^)]+)\)/);
          if (!m) return { scale: 1, dx: 0, dy: 0 };
          const v = m[1].split(',').map(Number);
          return {
            scale: Math.sqrt(v[0] * v[0] + v[1] * v[1]),
            dx: v[4],
            dy: v[5],
          };
        });
        if (route === '/leaflink') {
          expect(motion.scale).toBeLessThanOrEqual(T.hero.beatScale + 0.001);
        } else {
          expect(Math.hypot(motion.dx, motion.dy)).toBeLessThanOrEqual(10.5);
        }
        await page.waitForTimeout(gapMs);
      }
      await context.close();
    });
  }
}

// ---- T-HERO-4: reduced motion shows static PNG and identity transform.
test('T-HERO-4: reduced motion shows static PNG and identity transform', async ({
  browser,
}) => {
  for (const route of ['/leaflink', '/sidequests']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${DEV}${route}?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jp-keymap', { timeout: 30000 });
    await waitHero(page);
    await page.waitForTimeout(2000);
    const state = await page.evaluate(() => {
      const el = document.querySelector('[data-brand-mark]') as HTMLElement;
      const img = el.querySelector('img') as HTMLImageElement | null;
      return {
        src: img?.getAttribute('src') ?? null,
        transform: getComputedStyle(el).transform,
      };
    });
    expect(state.src, `${route} reduced-motion img`).toMatch(/\.png$/);
    expect(state.src, `${route} reduced-motion img is not a gif`).not.toMatch(/\.gif$/);
    expect(state.transform).toBe('none');
    await context.close();
  }
  // Runtime switch: normal first, then reduced motion forces PNG.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
  await waitHero(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => {
    const img = document.querySelector('[data-brand-mark] img') as HTMLImageElement | null;
    return img !== null && (img.getAttribute('src') ?? '').endsWith('.png');
  }, null, { timeout: 60000, polling: 100 });
  await context.close();
});

// ---- T-HERO-5: fallbacks.
test('T-HERO-5: fallback chain F0 to F2', async ({ browser }) => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'public', 'brand', 'manifest.json'), 'utf8'),
  ) as {
    heroes: {
      sidequests: { gif: { file: string }; frame0: { file: string } };
      leaflink: { png: { file: string } };
    };
  };
  const gifFile = manifest.heroes.sidequests.gif.file;
  const frame0File = manifest.heroes.sidequests.frame0.file;
  const logoFile = manifest.heroes.leaflink.png.file;
  const gifBytes = readFileSync(join(ROOT, 'public', 'brand', gifFile));

  // GIF 404 goes to F1 (frame0 PNG).
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**/brand/${gifFile}`, (route) => route.fulfill({ status: 404, body: 'nope' }));
    await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (f) => {
        const img = document.querySelector('[data-brand-mark] img') as HTMLImageElement | null;
        return img !== null && (img.getAttribute('src') ?? '').includes(f);
      },
      frame0File,
      { timeout: 60000, polling: 100 },
    );
    await context.close();
  }
  // GIF and PNG 404s go to F2 with alt text visible.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**/brand/${gifFile}`, (route) => route.fulfill({ status: 404, body: 'nope' }));
    await page.route(`**/brand/${frame0File}`, (route) => route.fulfill({ status: 404, body: 'nope' }));
    await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-brand-mark] .jp-hero-text');
      return el !== null && el.textContent === 'SideQuests';
    }, null, { timeout: 60000, polling: 100 });
    const aria = await page.evaluate(() => {
      const el = document.querySelector('[data-brand-mark] .jp-hero-text');
      return el?.getAttribute('aria-label') ?? null;
    });
    expect(aria).toBe('SideQuests logo, green handwritten wordmark with a star');
    await context.close();
  }
  // Truncated GIF goes to F1 via size mismatch.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**/brand/${gifFile}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/gif',
        body: gifBytes.subarray(0, 1000),
      }),
    );
    await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (f) => {
        const img = document.querySelector('[data-brand-mark] img') as HTMLImageElement | null;
        return img !== null && (img.getAttribute('src') ?? '').includes(f);
      },
      frame0File,
      { timeout: 60000, polling: 100 },
    );
    await context.close();
  }
  // Stalled GIF over timeout goes to F1.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**/brand/${gifFile}`, async (route) => {
      await new Promise((r) => setTimeout(r, 8000));
      await route.fulfill({ status: 200, contentType: 'image/gif', body: gifBytes });
    });
    await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (f) => {
        const img = document.querySelector('[data-brand-mark] img') as HTMLImageElement | null;
        return img !== null && (img.getAttribute('src') ?? '').includes(f);
      },
      frame0File,
      { timeout: 60000, polling: 100 },
    );
    await context.close();
  }
  // LeafLink PNG 404 goes to F2.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**/brand/${logoFile}`, (route) => route.fulfill({ status: 404, body: 'nope' }));
    await page.goto(`${DEV}/leaflink?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-brand-mark] .jp-hero-text');
      return el !== null && el.textContent === 'LeafLink';
    }, null, { timeout: 60000, polling: 100 });
    await context.close();
  }
});

// ---- T-HERO-5 (F3): no WebGL, the image still shows without deflection.
test('T-HERO-5-F3: hero renders with no field', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${DEV}/sidequests?world=0`, { waitUntil: 'domcontentloaded' });
  await waitHero(page);
  const canvasCount = await page.evaluate(
    () => document.querySelectorAll('#world canvas').length,
  );
  expect(canvasCount).toBe(0);
  const img = await page.evaluate(() => {
    const el = document.querySelector('[data-brand-mark] img') as HTMLImageElement | null;
    return el !== null && el.naturalWidth > 0;
  });
  expect(img).toBe(true);
  await context.close();
});

// ---- T-HERO-6: area cap holds, at rest and at the beat peak.
test('T-HERO-6: area cap holds on phones and desktop', () => {
  const viewports = [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1440, height: 900 },
  ];
  for (const vp of viewports) {
    // Polish round: both marks peak at the land beat
    // (hero.landBeatScale), so both sizes carry that headroom and the
    // peak area stays under the cap.
    const peak = T.hero.landBeatScale;
    // SideQuests: landscape mark, capped by sizePx.
    const sq = heroDisplayedSize(vp.width, vp.height, 1920, 538, peak);
    expect(sq.areaRatio).toBeLessThanOrEqual(T.brand.areaCap);
    expect(sq.areaRatio * peak * peak).toBeLessThanOrEqual(T.brand.areaCap + 1e-9);
    expect(sq.width).toBeLessThanOrEqual(T.hero.sizePx);
    // LeafLink: square mark, area-capped on phones.
    const ll = heroDisplayedSize(vp.width, vp.height, 1024, 1024, peak);
    expect(ll.areaRatio).toBeLessThanOrEqual(T.brand.areaCap);
    expect(ll.areaRatio * peak * peak).toBeLessThanOrEqual(T.brand.areaCap + 1e-9);
    if (vp.width >= 375) {
      expect(ll.width).toBeGreaterThanOrEqual(T.hero.minSizePx);
    }
    expect(
      areaRatio({ width: ll.width, height: ll.height }, vp.width, vp.height),
    ).toBeLessThanOrEqual(T.brand.areaCap);
  }
});

// ---- T-HERO-UV: mask UV orientation is not mirrored. The mounted
// hero is the DOM image, upright; the mask is the same image drawn
// letterboxed into a square canvas and uploaded with flipY false,
// and the shader maps u with world x and v with world z. This test
// pins the three facts the orientation claim rests on: the source
// mapping grows v with z, the upload sets flipY false, and the
// camera projection puts larger world z lower on screen (so v
// growing with z is screen-down, the same direction as image rows
// growing downward). If any of those flipped, the bunching would
// mirror: the SideQuests mark is strongly asymmetric vertically
// (row quartile 2 holds 95268 opaque pixels against 17061 in
// quartile 0), so a flip would move the bunching mass visibly.
test('T-HERO-UV: mask UV mapping is not mirrored', async ({ browser }) => {
  const { maskUv } = await import('../../src/world/silhouette');
  expect(maskUv(0, 0, 0, 0, 6)).toEqual([0.5, 0.5]);
  expect(maskUv(6, 0, 0, 0, 6)).toEqual([1, 0.5]);
  expect(maskUv(0, 6, 0, 0, 6)).toEqual([0.5, 1]);
  const lanefieldSrc = readFileSync(join(ROOT, 'src', 'world', 'lanefield.ts'), 'utf8');
  expect(lanefieldSrc).toContain('tex.flipY = false');
  const vert = readFileSync(join(ROOT, 'src', 'world', 'shaders', 'lane.vert.glsl'), 'utf8');
  expect(vert).toContain('(p - uSilhouetteCenter) / (2.0 * uSilhouetteRadius) + 0.5');
  // Camera projection: larger world z projects lower on screen on
  // the SideQuests coarse pose, so v growing with z is screen-down.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${DEV}/tests/world-harness.html?initial=sidequests`, {
    waitUntil: 'domcontentloaded',
  });
  // __testReady is a promise, not a boolean: resolve it through a
  // flag, with interval polling (rAF polling starves on SwiftShader).
  await page.evaluate(() => {
    const w = window as unknown as {
      __uvReady?: boolean;
      __testReady?: Promise<boolean>;
    };
    w.__uvReady = false;
    void w.__testReady?.then((v) => {
      w.__uvReady = v;
    });
  });
  await page.waitForFunction(
    () => (window as unknown as { __uvReady?: boolean }).__uvReady === true,
    null,
    { timeout: 280000, polling: 1000 },
  );
  const proj = await page.evaluate(() => {
    const f = window.__test.field;
    const low = f.worldToScreen([0, 0, -5]);
    const high = f.worldToScreen([0, 0, 5]);
    const left = f.worldToScreen([-5, 0, 0]);
    const right = f.worldToScreen([5, 0, 0]);
    return { low, high, left, right };
  });
  expect(proj.high[1]).toBeGreaterThan(proj.low[1]);
  expect(proj.right[0]).toBeGreaterThan(proj.left[0]);
  await context.close();
});

// ---- Unit pins for the pure motion and placement functions.
test('T-HERO-UNIT: beat, wander, and placement follow the tokens', () => {
  // Event-driven beat (DESIGN 6.3, polish round): one bump of
  // motion.ms.medium after an event, 1 before and after it, never a
  // periodic function of time.
  const amp = T.hero.beatScale - 1;
  const d = T.motion.ms.medium;
  expect(heroBeatEnvelope(-1, amp)).toBe(1);
  expect(heroBeatEnvelope(0, amp)).toBe(1);
  expect(heroBeatEnvelope(d / 2, amp)).toBeCloseTo(T.hero.beatScale, 10);
  expect(heroBeatEnvelope(d, amp)).toBe(1);
  expect(heroBeatEnvelope(d * 5, amp)).toBe(1);
  for (let t = 0; t < d; t += 10) {
    expect(heroBeatEnvelope(t, amp)).toBeLessThanOrEqual(T.hero.beatScale + 1e-12);
    expect(heroBeatEnvelope(t, amp)).toBeGreaterThanOrEqual(1);
  }
  for (let t = 0; t < 5000; t += 100) {
    const w = heroWanderOffsetAt(t);
    expect(Math.hypot(w.dx, w.dy)).toBeLessThanOrEqual(10.5);
  }
  // Placement on the narrow phone: LeafLink hero fits above the
  // readout, SideQuests hero fits below it, neither touching a zone.
  const leafBlockers = [
    { left: 4, top: 4, right: 138, bottom: 52 },
    { left: 16, top: 300, right: 359, bottom: 607 },
    { left: 0, top: 623, right: 375, bottom: 667 },
  ];
  const leafPlaced = placeHero(375, 667, 170, 170, leafBlockers, 8);
  expect(leafPlaced.bottom).toBeLessThanOrEqual(300 - 8);
  expect(leafPlaced.top).toBeGreaterThanOrEqual(52 + 8);
  for (const b of leafBlockers) {
    expect(rectsIntersect(leafPlaced, b)).toBe(false);
  }
  const sqBlockers = [
    { left: 4, top: 4, right: 138, bottom: 52 },
    { left: 16, top: 52, right: 359, bottom: 436 },
    { left: 0, top: 623, right: 375, bottom: 667 },
  ];
  const sqPlaced = placeHero(375, 667, 280, 79, sqBlockers, 12);
  expect(sqPlaced.top).toBeGreaterThanOrEqual(436 + 12);
  expect(sqPlaced.bottom).toBeLessThanOrEqual(623 - 12);
  for (const b of sqBlockers) {
    expect(rectsIntersect(sqPlaced, b)).toBe(false);
  }
});
