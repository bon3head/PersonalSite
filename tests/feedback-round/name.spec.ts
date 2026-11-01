// P-NAME-1 receipt (S04 section 5, DESIGN section 5): T-NAME-1.
// No intersection between the name box and the title box, every
// route, 3 phones plus desktop, plus 30 sampled frames on
// SideQuests while the scene is live.
import { test, expect, type Page } from '@playwright/test';

test.setTimeout(180000);

const DEV = 'http://localhost:5173';
const ROUTES = ['/', '/leaflink', '/sidequests', '/nope'];

type Rect = [number, number, number, number];

function intersects(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

async function gotoRoute(page: Page, route: string, world: boolean): Promise<void> {
  await page.goto(DEV + route + (world ? '' : '?world=0'), {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForSelector('.jp-readout h1', { timeout: 30000 });
}

async function measure(page: Page): Promise<{
  name: Rect | null;
  title: Rect;
  titleFits: boolean;
}> {
  return page.evaluate(() => {
    const nameEl = document.querySelector('.jp-wordmark') as HTMLElement | null;
    const titleEl = document.querySelector('.jp-readout h1') as HTMLElement;
    const nr = nameEl ? nameEl.getBoundingClientRect() : null;
    const tr = titleEl.getBoundingClientRect();
    const hidden =
      nameEl === null ||
      (nameEl as HTMLElement).hidden ||
      getComputedStyle(nameEl).display === 'none';
    return {
      name:
        nr && !hidden
          ? ([nr.left, nr.top, nr.right, nr.bottom] as Rect)
          : null,
      title: [tr.left, tr.top, tr.right, tr.bottom] as Rect,
      titleFits: titleEl.scrollWidth <= titleEl.clientWidth + 1,
    };
  });
}

test('T-NAME-1 name box never intersects the title box', async ({
  browser,
}) => {
  const viewports = [
    { width: 375, height: 667, coarse: true },
    { width: 390, height: 844, coarse: true },
    { width: 430, height: 932, coarse: true },
    { width: 1440, height: 900, coarse: false },
  ];
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.coarse,
      isMobile: vp.coarse,
    });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await gotoRoute(page, route, false);
      // Readout entrance settles after travel plus delay plus 300ms.
      await page.waitForTimeout(1600);
      const m = await measure(page);
      if (m.name !== null) {
        expect(
          intersects(m.name, m.title),
          `${route} ${vp.width}x${vp.height}: name ${JSON.stringify(m.name)} vs title ${JSON.stringify(m.title)}`,
        ).toBe(false);
      }
      expect(
        m.titleFits,
        `${route} ${vp.width}x${vp.height}: title text overflows its box`,
      ).toBe(true);
    }
    await context.close();
  }
});

test('T-NAME-1 sidequests title rests across sampled frames while live', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await gotoRoute(page, '/sidequests', true);
  // Entrance plus travel settle before sampling.
  await page.waitForTimeout(2500);
  const samples = await page.evaluate(async () => {
    const out: { name: Rect | null; title: Rect }[] = [];
    for (let i = 0; i < 30; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const nameEl = document.querySelector('.jp-wordmark') as HTMLElement | null;
      const titleEl = document.querySelector(
        '.jp-readout h1',
      ) as HTMLElement;
      const nr = nameEl ? nameEl.getBoundingClientRect() : null;
      const tr = titleEl.getBoundingClientRect();
      out.push({
        name: nr ? ([nr.left, nr.top, nr.right, nr.bottom] as Rect) : null,
        title: [tr.left, tr.top, tr.right, tr.bottom] as Rect,
      });
    }
    return out;
  });
  expect(samples.length).toBe(30);
  const tops = samples.map((s) => s.title[1]);
  const lefts = samples.map((s) => s.title[0]);
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
  expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(1);
  for (const s of samples) {
    if (s.name !== null) {
      expect(intersects(s.name, s.title)).toBe(false);
    }
  }
  await context.close();
});
