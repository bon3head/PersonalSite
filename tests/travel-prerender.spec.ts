// Prerender receipts (S03 section 7) and T-S03-5 against built output.
// The build script's theme step needs B1's laneTheme.mjs, so wave 1
// builds with plain `vite build` (theme step skipped) and then runs
// tools/prerender.mjs. These tests drive that sequence via exec, then
// check the emitted files and serve them to collect console errors.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const PREVIEW = 'http://localhost:4173';

function buildAndPrerender(): void {
  execSync('npx vite build', { cwd: ROOT, stdio: 'pipe' });
  execSync('node tools/prerender.mjs', { cwd: ROOT, stdio: 'pipe' });
}

const ROUTES = [
  {
    file: 'index.html',
    title: 'Justin Poli',
    h1: 'Justin Poli',
    regime: 'void',
    scheme: 'dark',
    ground: '#0A0C0F',
  },
  {
    file: join('leaflink', 'index.html'),
    title: 'LeafLink, Justin Poli',
    h1: 'LeafLink',
    regime: 'paper',
    scheme: 'light',
    ground: '#F3F0EA',
  },
  {
    file: join('sidequests', 'index.html'),
    title: 'SideQuests, Justin Poli',
    h1: 'SideQuests',
    regime: 'field',
    scheme: 'dark',
    ground: '#10294E',
  },
  {
    file: '404.html',
    title: 'Not found, Justin Poli',
    h1: 'Nothing at this address.',
    regime: 'void',
    scheme: 'dark',
    ground: '#0A0C0F',
  },
];

test('prerender: all four route files with correct shell', () => {
  buildAndPrerender();
  for (const route of ROUTES) {
    const path = join(DIST, route.file);
    expect(existsSync(path), `${route.file} exists`).toBe(true);
    const html = readFileSync(path, 'utf8');
    expect(html).toContain(`<title>${route.title}</title>`);
    expect(html).toContain(`<h1 id="h-`);
    expect(html).toContain(`>${route.h1}</h1>`);
    expect(html).toContain(`data-regime="${route.regime}"`);
    expect(html).toContain(`color-scheme: ${route.scheme}`);
    expect(html).toContain(
      `<meta name="theme-color" content="${route.ground}" />`,
    );
    expect(html).toContain('Justin Poli. Computer science senior');
    // The client bundle still loads (hydration entry point present).
    expect(html).toContain('<script type="module"');
  }
});

test('prerender: copy strings match src/copy.ts', () => {
  const copy = readFileSync(join(ROOT, 'src', 'copy.ts'), 'utf8');
  for (const route of ROUTES) {
    expect(copy).toContain(route.title);
    expect(copy).toContain(route.h1);
  }
});

test('T-S03-5: zero console errors on served prerendered paths', async ({
  page,
}: {
  page: Page;
}) => {
  test.setTimeout(180000);
  buildAndPrerender();
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  for (const url of [
    `${PREVIEW}/`,
    `${PREVIEW}/leaflink/`,
    `${PREVIEW}/sidequests/`,
    `${PREVIEW}/404.html`,
  ]) {
    await page.goto(url);
    await page.waitForTimeout(500);
  }
  expect(errors).toEqual([]);
});
