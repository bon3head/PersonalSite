// T-ASSET-5 (feedback round W3, P-ASSET-3): no brand asset request
// before the server route first lane-field frame (network log
// check). Runs against the vite dev server with the real lane
// field (no world=0 flag).
import { test, expect } from '@playwright/test';

const DEV = process.env.ASSET_DEV_BASE || 'http://localhost:5173';

test('T-ASSET-5: no brand request before the first field frame', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__brandFirstFrameAt = null;
    window.addEventListener(
      'lanefield-ready',
      (ev: Event) => {
        const lf = (ev as CustomEvent).detail as {
          onFrame: (cb: () => void) => () => void;
        };
        if (!lf || typeof lf.onFrame !== 'function') return;
        const off = lf.onFrame(() => {
          (window as any).__brandFirstFrameAt = Date.now();
          off();
        });
      },
      { once: true },
    );
  });
  const requests: Array<{ url: string; at: number }> = [];
  page.on('request', (req) => {
    requests.push({ url: req.url(), at: Date.now() });
  });
  await page.goto(DEV + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as any).__brandFirstFrameAt !== null,
    null,
    { timeout: 180000 },
  );
  const firstFrameAt = await page.evaluate(
    () => (window as any).__brandFirstFrameAt as number,
  );
  // Poll the test-side request log until the prefetch has fired: the
  // manifest plus all three hero files, all after the first frame.
  const deadline = Date.now() + 120000;
  while (
    requests.filter((r) => r.url.includes('/brand/')).length < 4 &&
    Date.now() < deadline
  ) {
    await page.waitForTimeout(1000);
  }
  const brand = requests.filter((r) => r.url.includes('/brand/'));
  // The prefetch itself records what it fetched for this check.
  const prefetched: string[] = await page.evaluate(
    () => (window as any).__brandPrefetched ?? [],
  );
  expect(brand.length).toBeGreaterThan(0);
  for (const r of brand) {
    expect(
      r.at,
      `brand request ${r.url} must not precede the first field frame`,
    ).toBeGreaterThanOrEqual(firstFrameAt);
  }
  // No preload link for brand assets on the server route.
  const preloads = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="preload"]')].map((el) =>
      el.getAttribute('href'),
    ),
  );
  expect(preloads.filter((h) => h && h.includes('/brand/'))).toEqual([]);
  // The hero files themselves must be among the prefetched set.
  expect(prefetched.join(' ')).toContain('.gif');
  expect(prefetched.join(' ')).toContain('.png');
  expect(prefetched.length).toBeGreaterThanOrEqual(3);
});
