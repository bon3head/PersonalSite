// T-S04-1 to T-S04-7 (S04 section 11) plus axe on all routes, against
// the real App on the Vite dev server (no harness). The world starts
// on idle behind the chrome; no test waits for it.
//
// Note on T-S04-1 at 320/360px: the literal criteria (keymap height
// equals token height, all five items share one top) hold at every
// width, but the row overflows the viewport at 320px and 360px (see
// qa/chrome/S04-RECEIPTS.md for the measured widths and the math).
// Five labels at the 13px floor already total ~301px before gaps and
// gutters, so no spec-compliant sizing fits 320px. That overflow is
// recorded as an open spec question for the coordinator, not hidden
// by the test: T-S04-1 asserts the written criteria, and the
// containment measurement is reported alongside.
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DEV = 'http://localhost:5173';

const ROUTES = ['/', '/leaflink', '/sidequests', '/nope'];

// All chrome tests run with ?world=0: the real engine on SwiftShader
// renders multi-second frames (B2 measured 6.6s p50), which starves
// Playwright's locator polling so clicks never resolve. ?world=0 is
// the supported S02 no-world path (createLanefield returns null);
// chrome behavior is identical without the world, and no T-S04 test
// depends on lane morphing.
async function gotoRoute(page: Page, route: string): Promise<void> {
  await page.goto(DEV + route + '?world=0', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
}

test('T-S04-1 keymap never wraps', async ({ page }) => {
  const widths = [320, 360, 390, 768, 1024, 1440, 2560];
  const containment: Record<number, { fits: boolean; rightEdge: number }> = {};
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 800 });
    await gotoRoute(page, '/');
    const result = await page.evaluate(() => {
      const nav = document.querySelector('.jp-keymap') as HTMLElement;
      const items = [...document.querySelectorAll('.jp-keymap-item')];
      const tops = items.map((el) => el.getBoundingClientRect().top);
      const right = Math.max(
        ...items.map((el) => el.getBoundingClientRect().right),
      );
      return {
        navH: nav.getBoundingClientRect().height,
        tops,
        right,
        viewport: window.innerWidth,
      };
    });
    // Fine pointer: token height is 36 (T.space.keymapHeightPx.fine).
    expect(result.navH).toBe(36);
    // All five items share one top: no wrap.
    expect(new Set(result.tops).size).toBe(1);
    expect(result.tops.length).toBe(5);
    containment[w] = {
      fits: result.right <= result.viewport + 0.5,
      rightEdge: Math.round(result.right),
    };
  }
  // Recorded, not asserted: containment fails at 320/360 (see header).
  console.log(`T-S04-1 containment: ${JSON.stringify(containment)}`);
});

test('T-S04-2 coarse targets at least 44x44', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await gotoRoute(page, '/');
  // Coarse pointer: token height is 44 (T.space.keymapHeightPx.coarse).
  const navH = await page.evaluate(
    () => document.querySelector('.jp-keymap')!.getBoundingClientRect().height,
  );
  expect(navH).toBe(44);
  const items = await page.evaluate(() => {
    return [...document.querySelectorAll('.jp-keymap-item')].map((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
  });
  expect(items.length).toBe(5);
  for (const item of items) {
    expect(item.w).toBeGreaterThanOrEqual(44);
    expect(item.h).toBeGreaterThanOrEqual(44);
  }
  // Sheet controls: open contact, check the two action controls.
  // The copy control is a <button>; the mail control is a Button with
  // href, which Astryx renders as an <a>. Both must be 44px tall on
  // coarse (theme adaptation raises element-md to 44px).
  await page.click('.jp-keymap-item[aria-haspopup="dialog"] >> nth=1');
  await page.waitForSelector('text=justinf0829@gmail.com', { timeout: 10000 });
  const controls = await page.evaluate(() => {
    const pick = (text: string): { h: number } | null => {
      const el = [...document.querySelectorAll('dialog button, dialog a')].find(
        (e) => e.textContent?.trim() === text,
      );
      if (!el) return null;
      return { h: el.getBoundingClientRect().height };
    };
    return {
      copy: pick('Copy email'),
      mail: pick('Open mail app'),
    };
  });
  expect(controls.copy).not.toBeNull();
  expect(controls.mail).not.toBeNull();
  expect(controls.copy!.h).toBeGreaterThanOrEqual(44);
  expect(controls.mail!.h).toBeGreaterThanOrEqual(44);
  await context.close();
});

test('T-S04-3 axe clean on all routes, sheets closed and open', async ({
  page,
}) => {
  // 4 routes x 3 axe runs exceeds the 30s default test timeout.
  test.setTimeout(180000);
  for (const route of ROUTES) {
    await gotoRoute(page, route);
    // Sheets closed.
    let results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      `${route} closed: ${JSON.stringify(results.violations.map((v) => v.id))}`,
    ).toEqual([]);
    // Whoami open.
    await page.click('.jp-keymap-item >> text=whoami');
    await page.waitForSelector('text=Math Club, VP', { timeout: 10000 });
    results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      `${route} whoami: ${JSON.stringify(results.violations.map((v) => v.id))}`,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Math Club, VP')).toBeHidden({
      timeout: 10000,
    });
    // Contact open.
    await page.click('.jp-keymap-item >> text=contact');
    await page.waitForSelector('text=justinf0829@gmail.com', {
      timeout: 10000,
    });
    results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      `${route} contact: ${JSON.stringify(results.violations.map((v) => v.id))}`,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=justinf0829@gmail.com')).toBeHidden({
      timeout: 10000,
    });
  }
});

test('T-S04-4 copy paths', async ({ browser }) => {
  // Granted clipboard: OK toast.
  const granted = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const okPage = await granted.newPage();
  await gotoRoute(okPage, '/');
  await okPage.click('.jp-keymap-item >> text=contact');
  await okPage.waitForSelector('text=justinf0829@gmail.com', {
    timeout: 10000,
  });
  await okPage.click('text=Copy email');
  await okPage.waitForSelector('text=Copied.', { timeout: 10000 });
  await granted.close();

  // Denied clipboard + execCommand stubbed false: FAIL toast and the
  // address is the current selection.
  const denied = await browser.newContext();
  const failPage = await denied.newPage();
  await failPage.addInitScript(() => {
    // Force the execCommand fallback path to fail.
    document.execCommand = () => false;
    // Block the async clipboard path so copyText falls through.
    if (navigator.clipboard) {
      navigator.clipboard.writeText = () =>
        Promise.reject(new Error('denied'));
    }
  });
  await gotoRoute(failPage, '/');
  await failPage.click('.jp-keymap-item >> text=contact');
  await failPage.waitForSelector('text=justinf0829@gmail.com', {
    timeout: 10000,
  });
  await failPage.click('text=Copy email');
  await failPage.waitForSelector('text=Copy failed. The address is selected.', {
    timeout: 10000,
  });
  const selection = await failPage.evaluate(() =>
    window.getSelection()?.toString(),
  );
  expect(selection).toBe('justinf0829@gmail.com');
  await denied.close();
});

test('T-S04-5 focus returns to the keymap button on sheet close', async ({
  page,
}) => {
  await gotoRoute(page, '/');
  // Whoami: focus its keymap button, open with Enter, close with Escape.
  const whoamiButton = page.locator('.jp-keymap-item', { hasText: 'whoami' });
  await whoamiButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=Math Club, VP', { timeout: 10000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('text=Math Club, VP')).toBeHidden({
    timeout: 10000,
  });
  const afterWhoami = await page.evaluate(
    () => (document.activeElement as HTMLElement)?.textContent?.trim(),
  );
  expect(afterWhoami).toContain('whoami');
  // Contact: same path.
  const contactButton = page.locator('.jp-keymap-item', { hasText: 'contact' });
  await contactButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=justinf0829@gmail.com', {
    timeout: 10000,
  });
  await page.keyboard.press('Escape');
  await expect(page.locator('text=justinf0829@gmail.com')).toBeHidden({
    timeout: 10000,
  });
  const afterContact = await page.evaluate(
    () => (document.activeElement as HTMLElement)?.textContent?.trim(),
  );
  expect(afterContact).toContain('contact');
});

test('T-S04-6 keyboard-only tab order', async ({ page }) => {
  // Leaflink shows the wordmark and one readout link before the keymap.
  await gotoRoute(page, '/leaflink');
  const order: string[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '(none)';
      return el.textContent?.trim() ?? el.tagName;
    });
    order.push(label);
  }
  // Wordmark first, then the readout Code link, then the OfferButton
  // (leaflink scene control, S06), then the five keymap items in
  // order (labels: server, leaflink, sidequests, whoami, contact;
  // keymap items render as "1server" etc. with the Kbd).
  expect(order[0]).toBe('Justin Poli');
  expect(order[1]).toContain('Code');
  expect(order[2]).toContain('Drop an offer');
  expect(order[3]).toContain('server');
  expect(order[4]).toContain('leaflink');
  expect(order[5]).toContain('sidequests');
  expect(order[6]).toContain('whoami');
  expect(order[7]).toContain('contact');
});

test('T-S04-7 sheet open animation at most 300ms', async ({ page }) => {
  await gotoRoute(page, '/');
  await page.click('.jp-keymap-item >> text=whoami');
  await page.waitForSelector('text=Math Club, VP', { timeout: 10000 });
  const total = await page.evaluate(() => {
    const dialog = document.querySelector('dialog');
    if (!dialog) return -1;
    const animations = dialog.getAnimations();
    return animations.reduce(
      (sum, a) => sum + (Number(a.effect?.getTiming().duration) || 0),
      0,
    );
  });
  expect(total).toBeGreaterThanOrEqual(0);
  expect(total).toBeLessThanOrEqual(300);
  await page.keyboard.press('Escape');
});
