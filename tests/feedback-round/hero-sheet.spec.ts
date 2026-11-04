// Device run 4 regression: the hero mark stays visible when a popup
// sheet opens and after it closes. Previously App rendered BrandHero
// only with no sheet open, so opening whoami or contact unmounted
// the mark. The fix keeps the mark mounted regardless of sheet state;
// the sheet overlays, but the mark is never hidden, faded, or
// unmounted. Kept permanently: do not delete this spec.
// Browser timing note, same as the W4 suite: SwiftShader frames take
// seconds, so this spec asserts settled invariants (mounted, opacity,
// non-empty box), never a mid-travel wall-clock pixel sample.
import { test, expect, type Page } from '@playwright/test';

test.setTimeout(300000);

const DEV = 'http://localhost:5173';

interface MarkState {
  count: number;
  opacity: number;
  visibility: string;
  box: number;
  connected: boolean;
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

async function markState(page: Page): Promise<MarkState> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-brand-mark]') as HTMLElement | null;
    if (!el) {
      return { count: 0, opacity: 0, visibility: 'hidden', box: 0, connected: false };
    }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      count: 1,
      opacity: parseFloat(cs.opacity),
      visibility: cs.visibility,
      box: (r.right - r.left) * (r.bottom - r.top),
      connected: document.contains(el),
    };
  });
}

function expectVisible(s: MarkState, where: string): void {
  expect(s.count, `${where} count`).toBe(1);
  expect(s.connected, `${where} connected`).toBe(true);
  expect(s.visibility, `${where} visibility`).not.toBe('hidden');
  expect(s.opacity, `${where} opacity`).toBeGreaterThanOrEqual(0.99);
  expect(s.box, `${where} box`).toBeGreaterThan(0);
}

async function openSheet(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForSelector('dialog[open]', { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function closeSheet(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForFunction(
    () => document.querySelector('dialog[open]') === null,
    null,
    { timeout: 10000, polling: 100 },
  );
  await page.waitForTimeout(500);
}

// ---- T-HERO-SHEET (browser): mark visible with any sheet open and
// after it closes, on both project routes; server never has a mark.
test('T-HERO-SHEET: mark stays visible when a sheet opens and after it closes', async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const route of ['/leaflink', '/sidequests']) {
    await page.goto(`${DEV}${route}?world=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jp-keymap', { timeout: 30000 });
    await waitHero(page);
    expectVisible(await markState(page), `${route} baseline`);
    await openSheet(page, 'w');
    expectVisible(await markState(page), `${route} whoami open`);
    await closeSheet(page, 'w');
    expectVisible(await markState(page), `${route} whoami closed`);
    await openSheet(page, 'c');
    expectVisible(await markState(page), `${route} contact open`);
    await closeSheet(page, 'c');
    expectVisible(await markState(page), `${route} contact closed`);
  }
  // Server route never has a mark, sheet open or not.
  await page.goto(`${DEV}/?world=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await openSheet(page, 'w');
  expect((await markState(page)).count, 'server whoami open count').toBe(0);
  await closeSheet(page, 'w');
  expect((await markState(page)).count, 'server whoami closed count').toBe(0);
  await context.close();
});
