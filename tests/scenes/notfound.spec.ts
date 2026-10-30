// T-404-1 and T-404-2 (S08 section 7) against the real App on the
// Vite dev server. Unlike the chrome tests, T-404-1 needs the real
// world (no ?world=0): it asserts the layout weights are one-hot
// scatter after a direct load of an unknown path. SwiftShader frames
// take seconds, so the timeout is 180s like the engine tests.
// T-404-2 asserts key-home behavior and does not depend on the world,
// so it runs with ?world=0 for speed (the supported S02 no-world path).
import { expect, test, type Page } from '@playwright/test';

test.setTimeout(180000);

const DEV = 'http://localhost:5173';

const H1_404 = 'Nothing at this address.';
const TITLE_404 = 'Not found, Justin Poli';
const H1_SERVER = 'Justin Poli';

async function waitForWorld(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      typeof window.__lanefield !== 'undefined' &&
      window.__lanefield.ready === true,
    { timeout: 120000 },
  );
}

test('T-404-1: unknown path renders the scene', async ({ page }) => {
  await page.goto(`${DEV}/nope`, { waitUntil: 'domcontentloaded' });
  // Readout and title are DOM-only and settle immediately.
  await expect(page.locator('main#scene h1')).toHaveText(H1_404, {
    timeout: 30000,
  });
  expect(await page.title()).toBe(TITLE_404);
  // World: waits for the worker layouts + first render, then the
  // weights must be one-hot scatter (index 3). Direct load starts
  // in place: main.tsx starts the world at the URL scene's layout.
  await waitForWorld(page);
  const weights = await page.evaluate(() => window.__lanefield.weights());
  expect(weights).toEqual([0, 0, 0, 1]);
});

test('T-404-2: one key home', async ({ page }) => {
  // No-reload detection (S03 K-S03-1, corrected): 'load' events fire
  // only on document loads, and a window marker survives pushState
  // navigation but not a reload.
  const loads: string[] = [];
  page.on('load', () => loads.push(page.url()));
  await page.goto(`${DEV}/nope?world=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await expect(page.locator('main#scene h1')).toHaveText(H1_404);
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__b6dmarker = true;
  });
  const loadsAfterSetup = loads.length;
  await page.keyboard.press('1');
  await page.waitForFunction(
    () =>
      document.querySelector('main#scene h1')?.textContent === 'Justin Poli',
    { timeout: 30000 },
  );
  expect(page.url()).toBe(`${DEV}/`);
  await expect(page.locator('main#scene h1')).toHaveText(H1_SERVER);
  expect(loads.length).toBe(loadsAfterSetup);
  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__b6dmarker,
    ),
  ).toBe(true);
});
