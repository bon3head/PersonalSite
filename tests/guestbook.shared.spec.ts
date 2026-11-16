// Shared guestbook marks (DESIGN 6.14 Storage and Shared marks, 1.10.0;
// S09 C-GB-PUBLIC, C-GB-HELD, C-GB-LIMIT, C-GB-OFFLINE, C-GB-COUNT*,
// C-GB-ALL). T-GBS-1..3 run the function, filter and build pull in Node
// with GitHub faked; T-GBS-4..5 run the sheet with the network routed;
// T-GBS-6 counts pins on the preview build.
import { expect, test, type Page, type Route } from '@playwright/test';
import { checkMark } from '../api/_filter.js';
import { G } from '../api/_guestbook.generated.js';
import { decodeMeta } from '../api/_github.js';
import { handle, visitorHash } from '../api/sign.js';
import { marksFromIssues } from '../tools/pull-guestbook.mjs';
import { C } from '../src/copy';
import { T } from '../src/tokens.generated';

const DEV = 'http://localhost:5173';
const PREVIEW = 'http://localhost:4173';
const HOST = 'site.test';

test.describe.configure({ mode: 'serial' });

test('T-GBS-1 filter refuses links, mentions, markup, phone numbers and listed words, keeps ordinary text', () => {
  const pass = ['Justin', 'Julian Shuster', 'Hi. Is this cool?', 'Mr. Smith', 'Hack New Paltz 2026', 'Scunthorpe', 'St. Louis', 'Ünïcode Ñame', 'cum laude grad', 'great work!'];
  const held = ['see example.com', 'www . spam', 'http://x', 'site dot com', 'f u c k', 'FUCK', 'sh1t', 'fuuuuck', '@torvalds', '<b>x', '555 123 4567', 'buy bitcoin', 't.me/x', 'b​itcoin', 'a`b'];
  for (const name of pass) expect(checkMark({ name }), name).toMatchObject({ ok: true });
  for (const name of held) expect(checkMark({ name }), name).toEqual({ ok: false, reason: 'held' });
  for (const line of held) expect(checkMark({ name: 'Ada', line }), line).toEqual({ ok: false, reason: 'held' });
  expect(checkMark({ name: '  \u0000 ' })).toEqual({ ok: false, reason: 'empty' });
  const c = checkMark({ name: 'a\tb‮c', line: 'x'.repeat(500), seed: -1 });
  expect(c.ok && c.mark.name).toBe('a bc');
  expect(c.ok && Array.from(c.mark.line).length).toBe(T.guestbook.lineMaxChars);
  expect(c.ok && c.mark.seed).toBe(0xffffffff);
});

interface Fake {
  issues: Array<Record<string, unknown>>;
  created: Array<Record<string, unknown>>;
  calls: string[];
  failCreate?: number;
}

function fakeGitHub(f: Fake): () => void {
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    f.calls.push(`${init?.method ?? 'GET'} ${url}`);
    const auth = new Headers(init?.headers).get('authorization');
    if (auth !== 'Bearer tok') return new Response('{}', { status: 401 });
    if ((init?.method ?? 'GET') === 'GET') return Response.json(f.issues);
    if (f.failCreate) return new Response('{}', { status: f.failCreate });
    const body = JSON.parse(String(init?.body));
    f.created.push(body);
    return Response.json({ number: 1 }, { status: 201 });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = real;
  };
}

function req(body: unknown, opts: { origin?: string | null; type?: string; method?: string; ip?: string } = {}): Request {
  const headers = new Headers({ host: HOST, 'x-vercel-forwarded-for': opts.ip ?? '203.0.113.7' });
  if (opts.origin !== null) headers.set('origin', opts.origin ?? `https://${HOST}`);
  headers.set('content-type', opts.type ?? 'application/json');
  const method = opts.method ?? 'POST';
  return new Request(`https://${HOST}/api/sign`, {
    method,
    headers,
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

const good = { name: 'Ada', line: 'was here', seed: 42, at: '2026-11-16T00:00:00.000Z', hp: '', fillMs: 5000 };

test('T-GBS-2 the function checks the request, rate limits by day and files a labeled issue', async () => {
  process.env.GUESTBOOK_TOKEN = 'tok';
  process.env.GUESTBOOK_SALT = 'salt';
  process.env.GUESTBOOK_REPO = 'bon3head/PersonalSite';
  const f: Fake = { issues: [], created: [], calls: [] };
  const restore = fakeGitHub(f);
  const logs: string[] = [];
  const realLog = console.log;
  console.log = (...a: unknown[]) => logs.push(a.join(' '));
  try {
    expect((await handle(req(good, { method: 'GET' }))).status).toBe(405);
    expect((await handle(req(good, { origin: null }))).status).toBe(403);
    expect((await handle(req(good, { origin: 'https://evil.test' }))).status).toBe(403);
    expect((await handle(req(good, { type: 'text/plain' }))).status).toBe(415);
    expect((await handle(req({ ...good, line: 'x'.repeat(G.bodyMaxBytes) }))).status).toBe(413);
    expect((await handle(req('{nope'))).status).toBe(400);
    // Bot friction: answers as filed, files nothing.
    const trap = await handle(req({ ...good, hp: 'http://spam' }));
    expect(trap.status).toBe(202);
    expect((await handle(req({ ...good, fillMs: 10 }))).status).toBe(202);
    expect((await handle(req({ ...good, line: 'visit spam.com' }))).status).toBe(422);
    expect(f.calls).toEqual([]);

    // Filed.
    const ok = await handle(req(good));
    expect(ok.status).toBe(201);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect(await ok.json()).toEqual({ ok: true, where: 'shared' });
    expect(f.calls[0]).toContain('labels=guestbook');
    expect(f.calls[0]).toContain('creator=bon3head');
    expect(f.calls[0]).toContain('state=all');
    const issue = f.created[0];
    expect(issue.labels).toEqual(['guestbook']);
    expect(issue.title).toBe('mark: Ada');
    const body = String(issue.body);
    expect(body).toContain('\n    name: Ada\n    line: was here\n');
    expect(body).not.toContain('203.0.113.7');
    const meta = decodeMeta(body);
    const day = new Date().toISOString().slice(0, 10);
    expect(meta).toMatchObject({ name: 'Ada', line: 'was here', seed: 42, v: visitorHash('salt', day, '203.0.113.7') });
    expect(logs.join('\n')).not.toMatch(/tok|203\.0\.113|Ada/);

    // Per visitor per day.
    const now = new Date().toISOString();
    const mine = { created_at: now, user: { login: 'bon3head' }, body: `x "v":"${meta.v}" x` };
    f.issues = Array.from({ length: G.perVisitorPerDay }, () => mine);
    expect((await handle(req(good))).status).toBe(429);
    // Another visitor is fine; yesterday's and other authors' do not count.
    expect((await handle(req(good, { ip: '198.51.100.1' }))).status).toBe(201);
    const other = { created_at: now, user: { login: 'bon3head' }, body: 'x' };
    f.issues = [
      ...Array.from({ length: G.globalPerDay - 1 }, () => other),
      { created_at: '2000-01-01T00:00:00Z', user: { login: 'bon3head' }, body: 'x' },
      { created_at: now, user: { login: 'someone' }, body: 'x' },
      { created_at: now, user: { login: 'bon3head' }, body: 'x', pull_request: {} },
    ];
    expect((await handle(req(good, { ip: '198.51.100.2' }))).status).toBe(201);
    f.issues.push(other);
    expect((await handle(req(good, { ip: '198.51.100.3' }))).status).toBe(429);

    // GitHub failure and missing config read as offline.
    f.issues = [];
    f.failCreate = 500;
    const down = await handle(req(good));
    expect(down.status).toBe(502);
    expect(await down.json()).toEqual({ ok: false, reason: 'offline' });
    delete process.env.GUESTBOOK_TOKEN;
    expect((await handle(req(good))).status).toBe(503);
  } finally {
    console.log = realLog;
    restore();
    delete process.env.GUESTBOOK_TOKEN;
    delete process.env.GUESTBOOK_SALT;
  }
});

test('T-GBS-3 the build pull re-filters, dedupes by seed and sorts newest first', () => {
  const mk = (name: string, seed: number, at: string, extra = '') => ({
    created_at: at,
    body: `<!-- guestbook:v1 ${JSON.stringify({ name, line: extra, seed, at: '1999-01-01T00:00:00Z' })} -->`,
  });
  const file = marksFromIssues([
    mk('Old', 1, '2026-11-01T00:00:00Z'),
    mk('New', 2, '2026-11-15T00:00:00Z'),
    mk('Dupe', 2, '2026-11-14T00:00:00Z'),
    mk('Spam', 3, '2026-11-15T00:00:00Z', 'go to spam.com'),
    { created_at: '2026-11-15T00:00:00Z', body: 'hand written, no marker' },
    { created_at: '2026-11-15T00:00:00Z', body: '<!-- guestbook:v1 {broken -->' },
  ]);
  expect(file.v).toBe(1);
  expect(file.count).toBe(2);
  expect(file.marks.map((m: { name: string }) => m.name)).toEqual(['New', 'Old']);
  // The issue's own time wins over the time in the body.
  expect(file.marks[0].at).toBe('2026-11-15T00:00:00.000Z');
});

const SHARED = {
  v: 1,
  count: 2,
  marks: [
    { name: 'Grace', line: 'hello', seed: 7, at: '2026-11-15T00:00:00.000Z' },
    { name: 'Linus', line: '', seed: 8, at: '2026-11-14T00:00:00.000Z' },
  ],
};

async function routeShared(page: Page, file: unknown, sign: (route: Route) => Promise<void>): Promise<string[]> {
  const bodies: string[] = [];
  await page.route('**/guestbook.json', (r) => r.fulfill({ json: file }));
  await page.route('**/api/sign', async (r) => {
    bodies.push(r.request().postData() ?? '');
    await sign(r);
  });
  return bodies;
}

async function openAndSign(page: Page, name: string): Promise<void> {
  await page.click('.jp-keymap button[aria-haspopup="dialog"] >> text=contact');
  await page.click('text=Leave a mark');
  await page.waitForSelector('.jp-gb[data-shown="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.activeElement?.classList.contains('jp-gb-input--name'), null, { timeout: 30000 });
  await page.keyboard.type(name);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.jp-gb-done', { timeout: 30000 });
}

test('T-GBS-4 sign publishes, says so, and the count opens every mark', async ({ page }) => {
  const bodies = await routeShared(page, SHARED, (r) => r.fulfill({ status: 201, json: { ok: true, where: 'shared' } }));
  await page.goto(DEV + '/leaflink?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await openAndSign(page, 'Ada');
  await expect(page.locator('.jp-gb-note')).toHaveText(C['C-GB-PUBLIC']);
  // Own mark stays local at once.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jp.guestbook.v1') ?? '[]'));
  expect(stored[0].name).toBe('Ada');
  const sent = JSON.parse(bodies[0]);
  expect(sent).toMatchObject({ name: 'Ada', hp: '' });
  expect(sent.fillMs).toBeGreaterThan(0);
  // Count, then the full list in place of the ledger.
  const count = page.locator('.jp-gb-count');
  await expect(count).toHaveText(`2 ${C['C-GB-COUNT']}`);
  await expect(count).toHaveAttribute('aria-expanded', 'false');
  await count.click();
  await expect(count).toHaveAttribute('aria-expanded', 'true');
  const all = page.locator(`ul[aria-label="${C['C-GB-ALL']}"] li .jp-gb-ledger-name`);
  await expect(all).toHaveText(['Ada', 'Grace', 'Linus']);
  // Honeypot is off screen and out of the tab order.
  const trap = await page.locator('.jp-gb-trap').count();
  expect(trap).toBe(0); // only in the write stage
  const text = await page.locator('.jp-gb').innerText();
  expect(text).not.toMatch(/[–—]/);
});

for (const [status, reason, id] of [
  [422, 'held', 'C-GB-HELD'],
  [429, 'limit', 'C-GB-LIMIT'],
  [503, 'offline', 'C-GB-OFFLINE'],
] as const) {
  test(`T-GBS-5 ${reason}: the mark stays here and the note says ${id}`, async ({ page }) => {
    await routeShared(page, { v: 1, count: 1, marks: [SHARED.marks[0]] }, (r) =>
      r.fulfill({ status, json: { ok: false, reason } }),
    );
    await page.goto(DEV + '/leaflink?world=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jp-keymap', { timeout: 30000 });
    await openAndSign(page, 'Ada');
    await expect(page.locator('.jp-gb-note')).toHaveText(C[id]);
    await expect(page.locator('.jp-gb-count')).toHaveText(`1 ${C['C-GB-COUNT-ONE']}`);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jp.guestbook.v1') ?? '[]'));
    expect(stored[0].name).toBe('Ada');
  });
}

test('T-GBS-5b no shared file: no count, the ledger shows as before, network failure reads offline', async ({ page }) => {
  await page.route('**/guestbook.json', (r) => r.fulfill({ status: 404, body: '' }));
  await page.route('**/api/sign', (r) => r.abort());
  await page.goto(DEV + '/leaflink?world=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.click('.jp-keymap button[aria-haspopup="dialog"] >> text=contact');
  await page.click('text=Leave a mark');
  await page.waitForSelector('.jp-gb[data-shown="true"]', { timeout: 30000 });
  // The honeypot exists in the write stage, off screen, not tabbable.
  const trap = await page.evaluate(() => {
    const el = document.querySelector('.jp-gb-trap') as HTMLInputElement;
    const r = el.getBoundingClientRect();
    return { tab: el.tabIndex, hidden: el.getAttribute('aria-hidden'), right: r.right };
  });
  expect(trap).toEqual({ tab: -1, hidden: 'true', right: expect.any(Number) });
  expect(trap.right).toBeLessThan(0);
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.jp-gb-done', { timeout: 30000 });
  await expect(page.locator('.jp-gb-note')).toHaveText(C['C-GB-OFFLINE']);
  expect(await page.locator('.jp-gb-count').count()).toBe(0);
  await expect(page.locator(`ul[aria-label="${C['C-GB-LEDGER']}"] li .jp-gb-ledger-name`)).toHaveText(['Ada']);
});

test('T-GBS-6 pins: own marks plus the newest shared ones, capped at pinsShown, deduped by seed', async ({ page }) => {
  const marks = Array.from({ length: 8 }, (_, i) => ({
    name: `S${i}`,
    line: '',
    seed: 100 + i,
    at: `2026-11-${String(15 - i).padStart(2, '0')}T00:00:00.000Z`,
  }));
  await page.route('**/guestbook.json', (r) => r.fulfill({ json: { v: 1, count: marks.length, marks } }));
  await page.addInitScript((seed) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(
        'jp.guestbook.v1',
        JSON.stringify([{ name: 'Mine', line: '', seed, at: '2026-11-16T00:00:00.000Z' }]),
      );
      sessionStorage.setItem('seeded', '1');
    }
  }, 100);
  await page.goto(PREVIEW + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.jp-pins [data-pin]').length > 0, null, { timeout: 60000 });
  const names = await page.locator('.jp-pins [data-pin] .jp-pin-label').allTextContents();
  // Seed 100 is both own and shared: shows once, as own.
  expect(names).toEqual(['Mine', 'S1', 'S2', 'S3', 'S4', 'S5'].slice(0, 1 + T.guestbook.shared.pinsShown));
});
