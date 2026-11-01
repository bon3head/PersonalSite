// P-TOAST-1 receipts (S04 section 7.3): T-TOAST-1, T-TOAST-2, T-TOAST-3.
// Against the real App on the vite dev server. The world is off
// (?world=0): toast and sheet behavior is DOM-only, and the world
// is not needed to reproduce the top-layer paint order.
import { test, expect, type Page } from '@playwright/test';

const DEV = 'http://localhost:5173';

async function openContact(page: Page): Promise<void> {
  await page.goto(DEV + '/?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.click('.jp-keymap-item >> text=contact');
  await page.waitForSelector('text=justinf0829@gmail.com', { timeout: 10000 });
  await page.waitForSelector('dialog[open]', { timeout: 10000 });
}

test('T-TOAST-1 toast paints above the open Contact sheet', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await openContact(page);
  await page.click('text=Copy email');
  await page.waitForSelector('text=Copied.', { timeout: 10000 });
  // Enter animation is at most 225ms; settle before measuring.
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => {
    const toast = [
      ...document.querySelectorAll('[role="status"], [role="alert"]'),
    ].find((el) => el.textContent?.includes('Copied.')) as HTMLElement | undefined;
    if (!toast) return { found: false };
    const r = toast.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy) as Element | null;
    return {
      found: true,
      rect: [r.left, r.top, r.right, r.bottom],
      hitIsToast: hit === toast || (hit !== null && toast.contains(hit)),
      hitTag: hit?.tagName ?? null,
    };
  });
  expect(result.found).toBe(true);
  if (result.found) {
    expect(result.rect[0]).toBeGreaterThanOrEqual(0);
    expect(result.rect[2]).toBeLessThanOrEqual(390);
    expect(result.rect[1]).toBeGreaterThanOrEqual(0);
    expect(result.rect[3]).toBeLessThanOrEqual(844);
    expect(result.hitIsToast).toBe(true);
  }
  await context.close();
});

test('T-TOAST-2 toast inside the open dialog, not inert, announced role', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await openContact(page);
  await page.click('text=Copy email');
  await page.waitForSelector('text=Copied.', { timeout: 10000 });
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => {
    const toast = [
      ...document.querySelectorAll('[role="status"], [role="alert"]'),
    ].find((el) => el.textContent?.includes('Copied.')) as HTMLElement | undefined;
    if (!toast) return { found: false };
    const dialog = toast.closest('dialog');
    let inert = false;
    try {
      inert = toast.matches(':inert');
    } catch {
      inert = false;
    }
    return {
      found: true,
      inOpenDialog: dialog !== null && (dialog as HTMLDialogElement).open,
      inert,
      role: toast.getAttribute('role'),
      ariaLive: toast.getAttribute('aria-live'),
    };
  });
  expect(result.found).toBe(true);
  if (result.found) {
    // Inside the open dialog, the toast is not inert, so its
    // status role is announced while the sheet is open.
    expect(result.inOpenDialog).toBe(true);
    expect(result.inert).toBe(false);
    expect(result.role).toBe('status');
    expect(result.ariaLive).toBe('polite');
  }
  await context.close();
});

test('T-TOAST-3 toast does not move focus', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await openContact(page);
  await page.click('text=Copy email');
  await page.waitForSelector('text=Copied.', { timeout: 10000 });
  await page.waitForTimeout(600);
  const active = await page.evaluate(
    () => (document.activeElement as HTMLElement)?.textContent?.trim() ?? '',
  );
  expect(active).toContain('Copy email');
  await context.close();
});
