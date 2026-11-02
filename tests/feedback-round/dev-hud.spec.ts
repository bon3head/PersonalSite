// P-DEV-1 tests (T-DEV-1): the dev HUD appears on the dev server
// under ?hud=1 and is absent from the production bundle and from
// the production preview server under ?hud=1. The production
// bundle check reads dist/ directly; the gates build production
// first, so a missing dist/ here is a failure, not a skip.
import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

test.setTimeout(300000);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = 'http://localhost:5173';
const PREVIEW = 'http://localhost:4173';
const MARKERS = ['jp-dev-hud', 'mountDevHud', 'src/dev/hud', 'data-dev-hud'];

test('T-DEV-1 dev: HUD renders lane field state under ?hud=1', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${DEV}/sidequests?hud=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForFunction(() => window.__lanefield?.ready === true, null, {
    timeout: 240000,
    polling: 100,
  });
  await page.waitForSelector('#jp-dev-hud', { timeout: 60000 });
  const text = await page.locator('#jp-dev-hud').textContent();
  console.log(`T-DEV-1 dev HUD text: ${text}`);
  expect(text).toContain('laneCount: 6144');
  expect(text).toContain('calls: 1');
  expect(text).toContain('pitchDeg:');
  expect(text).toContain('yawDeg:');
  expect(text).toContain('distance:');
  expect(text).toContain('morph:');
  expect(text).toContain('hero:');
  expect(text).toContain('frameP95gov:');
  expect(text).toContain('frameP99hud:');
  expect(text).toContain('degrade:');
  const pitch = await page.evaluate(() => window.__lanefield.camera.pitchDeg);
  expect(pitch).toBeGreaterThanOrEqual(-75);
  expect(pitch).toBeLessThanOrEqual(-5);
});

test('T-DEV-1 prod: no HUD marker in the production bundle', async () => {
  const hits: string[] = [];
  let scanned = 0;
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      throw new Error(`T-DEV-1 prod: dist/ missing at ${dir}; run the production build first`);
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(html|js|css|json)$/.test(e.name)) {
        scanned += 1;
        const content = readFileSync(p, 'utf8');
        for (const m of MARKERS) {
          if (content.includes(m)) hits.push(`${p}: marker ${m}`);
        }
      }
    }
  };
  walk(join(ROOT, 'dist'));
  console.log(`T-DEV-1 prod: scanned ${scanned} dist files, hits=${hits.length}`);
  expect(hits).toEqual([]);
  expect(scanned).toBeGreaterThan(0);
});

test('T-DEV-1 preview: no HUD element on the production preview under ?hud=1', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}/sidequests?hud=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForFunction(() => window.__lanefield?.ready === true, null, {
    timeout: 240000,
    polling: 100,
  });
  await page.waitForTimeout(2000);
  const count = await page.locator('#jp-dev-hud').count();
  console.log(`T-DEV-1 preview: #jp-dev-hud count=${count}`);
  expect(count).toBe(0);
});
