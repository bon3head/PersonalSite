// Guestbook (DESIGN 6.14, S09 C-GB-*). T-GB-1..3 run the chrome with
// ?world=0 (SwiftShader frames take seconds, see chrome.spec.ts);
// T-GB-4..5 run the real engine on the preview build and read the
// __lanefield and __guestbook debug state rather than pixels.
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DEV = 'http://localhost:5173';
const PREVIEW = 'http://localhost:4173';

async function openFromContact(page: Page): Promise<void> {
  await page.click('.jp-keymap button[aria-haspopup="dialog"] >> text=contact');
  await page.click('text=Leave a mark');
  await page.waitForSelector('.jp-gb[data-shown="true"]', { timeout: 30000 });
  await page.waitForFunction(
    () => document.activeElement?.classList.contains('jp-gb-input--name'),
    null,
    { timeout: 30000 },
  );
}

test('T-GB-1 opens as a sheet over the scene, signs, stores, closes', async ({ page }) => {
  await page.goto(DEV + '/leaflink?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  const keymapItems = await page.locator('.jp-keymap-item').count();
  await openFromContact(page);
  // Not a route, not a nav item.
  expect(new URL(page.url()).pathname).toBe('/leaflink');
  expect(new URL(page.url()).hash).toBe('#guestbook');
  expect(await page.locator('.jp-keymap-item').count()).toBe(keymapItems);
  // No conventional form: no label elements, no heading, pill control.
  const shape = await page.evaluate(() => {
    const dlg = document.querySelector('.jp-gb') as HTMLElement;
    const pill = dlg.querySelector('.jp-gb-pill') as HTMLElement;
    const r = pill.getBoundingClientRect();
    return {
      labels: dlg.querySelectorAll('label').length,
      headings: dlg.querySelectorAll('h1, h2, h3').length,
      pillRadius: parseFloat(getComputedStyle(pill).borderTopLeftRadius),
      pillHalfHeight: r.height / 2,
      panelBg: getComputedStyle(dlg.querySelector('.jp-gb-panel') as HTMLElement).backgroundColor,
      docH: document.documentElement.scrollHeight,
      vh: window.innerHeight,
    };
  });
  expect(shape.labels).toBe(0);
  expect(shape.headings).toBe(0);
  expect(shape.pillRadius).toBeGreaterThanOrEqual(shape.pillHalfHeight);
  expect(shape.panelBg).toBe('rgba(0, 0, 0, 0)');
  expect(shape.docH).toBe(shape.vh);
  const t0 = Date.now();
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  await page.keyboard.type('was here');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.jp-gb-done', { timeout: 30000 });
  expect(Date.now() - t0).toBeLessThan(30000);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jp.guestbook.v1') ?? '[]'));
  expect(stored[0].name).toBe('Ada');
  expect(stored[0].line).toBe('was here');
  expect(typeof stored[0].seed).toBe('number');
  const text = await page.locator('.jp-gb').innerText();
  expect(text).not.toMatch(/[\u2013\u2014]/);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.jp-gb', { state: 'detached', timeout: 30000 });
  expect(new URL(page.url()).hash).toBe('');
});

test('T-GB-2 every sign gets a fresh seed', async ({ page }) => {
  await page.goto(DEV + '/?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await openFromContact(page);
  const seeds: number[] = [];
  for (const name of ['Ada', 'Ada']) {
    await page.keyboard.type(name);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.jp-gb-done', { timeout: 30000 });
    const s = await page.evaluate(() => (window as unknown as { __guestbook: { signSeed: number } }).__guestbook.signSeed);
    seeds.push(s);
    await page.click('text=Sign again');
    await page.waitForSelector('.jp-gb-input--name', { timeout: 30000 });
    await page.locator('.jp-gb-input--name').focus();
  }
  expect(seeds[0]).not.toBe(seeds[1]);
});

test('T-GB-3 guestbook passes axe', async ({ page }) => {
  await page.goto(DEV + '/?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await openFromContact(page);
  const results = await new AxeBuilder({ page }).include('.jp-gb').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

interface GbDebug {
  phase: string;
  dolly: number;
  signSeed: number | null;
  letters: { lane: number }[];
}

async function engineFlow(page: Page): Promise<{ rest: number; open: number; settled: number; letters: number; dbg: GbDebug }> {
  await page.goto(PREVIEW + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__lanefield?.ready, null, { timeout: 120000 });
  // Camera to well distance, read after two more frames have rendered
  // (SwiftShader frames take seconds; the engine applies the camera on
  // the next frame).
  const dist = async (): Promise<number> => {
    // Reduced motion runs no loop: the engine renders once per change.
    const still = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (still) {
      await page.waitForTimeout(1000);
    } else {
      const n0 = await page.evaluate(() => window.__lanefield!.frameStats().count);
      await page.waitForFunction((n) => window.__lanefield!.frameStats().count >= n + 2, n0, { timeout: 120000 });
    }
    return page.evaluate(() => {
      const p = window.__lanefield!.cameraPose().pos;
      const g = (window as unknown as { __guestbook?: { well: number[] | null } }).__guestbook;
      const w = g?.well ?? window.__lanefield!.cameraPose().target;
      return Math.hypot(p[0] - w[0], p[1] - w[1], p[2] - w[2]);
    });
  };
  const rest = await dist();
  await openFromContact(page);
  await page.waitForFunction(() => (window as unknown as { __guestbook?: GbDebug }).__guestbook?.phase === 'open', null, { timeout: 60000 });
  await page.waitForTimeout(1000);
  const open = await dist();
  await page.keyboard.type('Ada L');
  await page.waitForTimeout(3000);
  const letters = await page.evaluate(
    () => (window as unknown as { __guestbook: GbDebug }).__guestbook.letters.filter((l) => l.lane >= 0).length,
  );
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.jp-gb-done', { timeout: 60000 });
  const settled = await dist();
  const dbg = await page.evaluate(() => (window as unknown as { __guestbook: GbDebug }).__guestbook);
  expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBe(1);
  expect(await page.evaluate(() => window.__lanefield!.laneCount)).toBe(6144);
  expect(await page.evaluate(() => window.__lanefield!.info().calls)).toBeLessThanOrEqual(12);
  return { rest, open, settled, letters, dbg };
}

test('T-GB-4 camera dollies in on open and pulls back wide on sign', async ({ page }) => {
  test.setTimeout(300000);
  const r = await engineFlow(page);
  expect(r.open).toBeLessThan(r.rest * 0.9);
  expect(r.settled).toBeGreaterThan(r.rest);
  expect(r.letters).toBe(4);
  expect(r.dbg.phase).toBe('settled');
});

test('T-GB-5 reduced motion keeps the camera still and the mark', async ({ browser }) => {
  test.setTimeout(300000);
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const r = await engineFlow(page);
  expect(Math.abs(r.open - r.rest)).toBeLessThan(0.01);
  expect(Math.abs(r.settled - r.rest)).toBeLessThan(0.01);
  expect(r.letters).toBe(4);
  await context.close();
});
