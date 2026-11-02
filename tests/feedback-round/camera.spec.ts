// W7 camera suite (P-QA-1): T-SQ-CAM-1, T-SQ-CAM-2, T-SQ-CAM-3,
// plus fine walk lean sampling, the hero-band walk test (W6 open
// item b), and a pageshow (persisted) attempt. Runs on Chromium and
// on WebKit; the browser comes from the Playwright project, and the
// per-browser evidence file is reports/w7-cam-<browser>.json.
//
// Sampling method (same as W0): an in-page requestAnimationFrame
// loop reads window.__lanefield.camera, the rendered-camera
// diagnostic getter, so every sampled frame is a rendered frame.
// Pitch band is DESIGN tokens world.sidequests.camera.pitchMin -75
// and pitchMax -5. Pitch only; yaw gets no band. A sample fails on
// the first frame outside the band, or with laneCount not 6144.
//
// Draw calls, stated precisely: renderer.info.render.calls is a
// TOTAL, and the real app scene carries route marker meshes on top
// of the lane field (server adds one mesh, leaflink adds pin, halo,
// and ripple meshes, sidequests adds head and pole meshes), so the
// total is route-dependent and is recorded per trigger as data,
// never asserted as 1 here. The one-lane-draw invariant itself is
// T-LF-6 in the harness (field only, no controllers), which the
// full regression runs; this file asserts laneCount 6144 on every
// sampled real-app frame.
//
// SwiftShader note: engine frames take seconds, so a 700ms travel
// resolves in one engine frame. Morph tests therefore assert every
// sampled rendered frame and report the morph progress values
// actually observed, rather than claiming dense mid-travel sampling
// the sandbox cannot produce.
import { test, expect, type Page, type Browser } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

test.setTimeout(600000);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = 'http://localhost:5173';
const HARNESS = `${DEV}/tests/world-harness.html`;
const SQHARNESS = `${DEV}/tests/scenes/sidequests-harness.html`;
const MIN = -75;
const MAX = -5;

type Rect = [number, number, number, number];
interface Sample {
  pitch: number;
  yaw: number;
  laneCount: number;
  calls: number;
  morphP: number | null;
}
interface CamResult {
  test: string;
  browser: string;
  verdict: string;
  samples: number;
  minPitch: number | null;
  maxPitch: number | null;
  firstOutside: Sample | null;
  extra: Record<string, unknown>;
}
const RESULTS: CamResult[] = [];
let PROJECT_NAME = 'chromium';

function projectOf(browser: Browser): string {
  return browser.browserType().name();
}

function record(r: CamResult): void {
  RESULTS.push(r);
  console.log(`CAM-RESULT ${JSON.stringify(r)}`);
}

// A test that throws before its record() call still leaves evidence:
// afterEach adds a failure record so the JSON file never silently
// drops a test.
test.afterEach(async ({}, testInfo) => {
  PROJECT_NAME = testInfo.project.name || PROJECT_NAME;
  if (testInfo.status !== 'passed' && !RESULTS.some((r) => r.test === testInfo.title)) {
    RESULTS.push({
      test: testInfo.title,
      browser: PROJECT_NAME,
      verdict: `fail:${testInfo.status}`,
      samples: 0,
      minPitch: null,
      maxPitch: null,
      firstOutside: null,
      extra: { error: String(testInfo.error?.message ?? 'unknown').slice(0, 500) },
    });
  }
});

test.afterAll(() => {
  const browser = RESULTS.length > 0 ? RESULTS[0].browser : PROJECT_NAME;
  const out = join(ROOT, `reports/w7-cam-${browser}.json`);
  // Merge, never overwrite blind: the worker module state can reset
  // mid-run (observed: afterAll fired twice in one run), so a later
  // write must keep earlier results and replace same-name entries
  // with the newer record. A full run therefore converges to the
  // complete set even across a reset.
  let merged: CamResult[] = [];
  try {
    const prev = JSON.parse(readFileSync(out, 'utf8')) as { results?: CamResult[] };
    if (Array.isArray(prev.results)) merged = prev.results;
  } catch {
    merged = [];
  }
  for (const r of RESULTS) {
    const i = merged.findIndex((m) => m.test === r.test);
    if (i >= 0) merged[i] = r;
    else merged.push(r);
  }
  writeFileSync(out, JSON.stringify({ browser, results: merged }, null, 2));
  console.log(`CAM-RESULTS written to ${out} (${merged.length} results)`);
});

function intersects(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

function checkBand(samples: Sample[]): {
  min: number | null;
  max: number | null;
  firstOutside: Sample | null;
  morphPMin: number | null;
  morphPMax: number | null;
  callsMin: number | null;
  callsMax: number | null;
} {
  let min: number | null = null;
  let max: number | null = null;
  let firstOutside: Sample | null = null;
  let morphPMin: number | null = null;
  let morphPMax: number | null = null;
  let callsMin: number | null = null;
  let callsMax: number | null = null;
  for (const s of samples) {
    if (min === null || s.pitch < min) min = s.pitch;
    if (max === null || s.pitch > max) max = s.pitch;
    if (callsMin === null || s.calls < callsMin) callsMin = s.calls;
    if (callsMax === null || s.calls > callsMax) callsMax = s.calls;
    if (s.morphP !== null) {
      if (morphPMin === null || s.morphP < morphPMin) morphPMin = s.morphP;
      if (morphPMax === null || s.morphP > morphPMax) morphPMax = s.morphP;
    }
    if (firstOutside === null) {
      // Band edges carry a 1e-6 float epsilon, the same tolerance
      // W4 used for the clamp: the clamped edge reads -75.0000000000041
      // through the matrix getter, 4e-12 below the token edge.
      if (s.pitch < MIN - 1e-6 || s.pitch > MAX + 1e-6 || s.laneCount !== 6144) {
        firstOutside = s;
      }
    }
  }
  return { min, max, firstOutside, morphPMin, morphPMax, callsMin, callsMax };
}

async function waitReady(page: Page): Promise<void> {
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForFunction(() => window.__lanefield?.ready === true, null, {
    timeout: 240000,
    polling: 100,
  });
}

async function waitFrames(page: Page, n: number): Promise<void> {
  const base = await page.evaluate(() => window.__lanefield.frameStats().count);
  const target = base + n;
  await page.waitForFunction(
    (t: number) => window.__lanefield.frameStats().count >= t,
    target,
    { timeout: 240000, polling: 100 },
  );
}

async function waitTravelDone(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const m = (window as unknown as Record<string, { sample?: { done?: boolean } | null }>).__morph;
      return m !== undefined && m.sample !== null && m.sample !== undefined && m.sample.done === true;
    },
    null,
    { timeout: 240000, polling: 100 },
  );
  await page.waitForTimeout(1500);
}

async function startSampler(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__camSamples = [];
    w.__camStop = false;
    const tick = (): void => {
      if (w.__camStop === true) return;
      const lf = window.__lanefield;
      // Only rendered frames count: __lanefield exists before the
      // first render (calls 0, pose already at rest), and ready
      // flips only after that first render completes.
      if (lf && lf.ready === true) {
        const c = lf.camera;
        const morph = (window as unknown as Record<string, { sample?: { p?: number } | null }>).__morph;
        (w.__camSamples as Sample[]).push({
          pitch: c.pitchDeg,
          yaw: c.yawDeg,
          laneCount: lf.laneCount,
          calls: lf.info().calls,
          morphP: morph?.sample?.p ?? null,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function stopSampler(page: Page): Promise<Sample[]> {
  return page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__camStop = true;
    const s = w.__camSamples as Sample[];
    w.__camSamples = [];
    return s;
  });
}

async function iphonePage(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  return { context, page: await context.newPage() };
}

async function walkByKeyboard(page: Page, name: string): Promise<void> {
  // Pointer clicks cannot reach twins that project off-screen on a
  // phone (measured: Trail 2 at x 627, Trail 3 at x -96 on 390 wide;
  // only Trail 1 is on-screen). Keyboard walking is the first-class
  // path (T-SQ-5): Tab until the target twin holds focus, then
  // Enter. Enter is pressed only when the target itself is focused,
  // so a keymap item or link can never be activated by mistake.
  for (let i = 0; i < 30; i++) {
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label'),
    );
    if (focused === name) break;
    await page.keyboard.press('Tab');
  }
  const focused = await page.evaluate(
    () => document.activeElement?.getAttribute('aria-label'),
  );
  if (focused !== name) {
    throw new Error(`keyboard walk: never focused ${name}, last focused ${focused}`);
  }
  await page.keyboard.press('Enter');
}

async function waitClaimed(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true', {
    timeout: 180000,
  });
}

async function finishTrigger(
  testName: string,
  browser: Browser,
  page: Page,
  extra: Record<string, unknown>,
): Promise<Sample[]> {
  const samples = await stopSampler(page);
  const band = checkBand(samples);
  const verdict =
    samples.length > 0 && band.firstOutside === null ? 'pass' : 'fail';
  record({
    test: testName,
    browser: projectOf(browser),
    verdict,
    samples: samples.length,
    minPitch: band.min,
    maxPitch: band.max,
    firstOutside: band.firstOutside,
    extra: { ...extra, morphPMin: band.morphPMin, morphPMax: band.morphPMax, callsMin: band.callsMin, callsMax: band.callsMax },
  });
  expect(samples.length, `${testName}: sampler collected no frames`).toBeGreaterThan(0);
  expect(
    band.firstOutside,
    `${testName}: first outside-band frame ${JSON.stringify(band.firstOutside)}`,
  ).toBeNull();
  return samples;
}

// ---- T-SQ-CAM-1 triggers ----

test('T-SQ-CAM-1 cold load', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await startSampler(page);
  await waitReady(page);
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 cold load', browser, page, { trigger: 'coldLoad' });
  await context.close();
});

test('T-SQ-CAM-1 reload', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await startSampler(page);
  await waitReady(page);
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 reload', browser, page, { trigger: 'reload' });
  await context.close();
});

test('T-SQ-CAM-1 morph from server', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  await page.keyboard.press('3');
  await waitTravelDone(page);
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 morph from server', browser, page, {
    trigger: 'morphFromServer',
  });
  await context.close();
});

test('T-SQ-CAM-1 morph from leaflink', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/leaflink`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  await page.keyboard.press('3');
  await waitTravelDone(page);
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 morph from leaflink', browser, page, {
    trigger: 'morphFromLeaflink',
  });
  await context.close();
});

test('T-SQ-CAM-1 fast retarget', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  await page.keyboard.press('3');
  await page.keyboard.press('2');
  await page.keyboard.press('3');
  await waitTravelDone(page);
  await waitFrames(page, 1);
  const url = page.url();
  await finishTrigger('T-SQ-CAM-1 fast retarget', browser, page, {
    trigger: 'retarget',
    finalUrl: url,
  });
  expect(url).toContain('/sidequests');
  await context.close();
});

for (const trail of [1, 2, 3]) {
  test(`T-SQ-CAM-1 walk trail ${trail}`, async ({ browser }) => {
    const { context, page } = await iphonePage(browser);
    await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await expect(page.getByRole('button', { name: /Trail \d/ })).toHaveCount(3);
    await page.waitForTimeout(1500);
    await startSampler(page);
    await walkByKeyboard(page, `Trail ${trail}`);
    await waitClaimed(page, `Trail ${trail}`);
    await waitFrames(page, 1);
    await finishTrigger(`T-SQ-CAM-1 walk trail ${trail}`, browser, page, {
      trigger: `walkTrail${trail}`,
    });
    await context.close();
  });
}

test('T-SQ-CAM-1 resize and orientation change', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await waitFrames(page, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await waitFrames(page, 1);
  await page.setViewportSize({ width: 375, height: 667 });
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 resize and orientation change', browser, page, {
    trigger: 'resizeOrientation',
  });
  await context.close();
});

test('T-SQ-CAM-1 visibility hidden 60s then shown', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  let method = 'idle-60s';
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
    method = 'cdp-frozen-60s';
    await page.waitForTimeout(60000);
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  } catch {
    method = 'idle-60s-no-cdp';
    await page.waitForTimeout(60000);
  }
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 visibility hidden 60s then shown', browser, page, {
    trigger: 'visibility',
    method,
  });
  await context.close();
});

test('T-SQ-CAM-1 reduced motion morph', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${DEV}/`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await startSampler(page);
  await page.keyboard.press('3');
  await waitTravelDone(page);
  // No engine-frame wait here: under reduced motion the loop is
  // stopped and frameStats never advances, so settle on wall time.
  await page.waitForTimeout(2000);
  await finishTrigger('T-SQ-CAM-1 reduced motion morph', browser, page, {
    trigger: 'reducedMotionMorph',
  });
  await context.close();
});

test('T-SQ-CAM-1 back and forward restore', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.keyboard.press('1');
  await waitTravelDone(page);
  await startSampler(page);
  await page.goBack();
  await page.waitForTimeout(2000);
  await waitFrames(page, 1);
  await page.goForward();
  await page.waitForTimeout(2000);
  await waitFrames(page, 1);
  await finishTrigger('T-SQ-CAM-1 back and forward restore', browser, page, {
    trigger: 'backForward',
    finalUrl: page.url(),
  });
  await context.close();
});

// ---- T-SQ-CAM-2 (W1 re-scope): force the flat pose, assert the
// rendered frame lands inside the band and the trail walk still
// completes. No W0 trigger is reproduced here by design.
test('T-SQ-CAM-2 forced flat pose clamps and walk completes', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(SQHARNESS, { waitUntil: 'domcontentloaded' });
  const ok = await page.evaluate(() => window.__sqtestReady);
  expect(ok).toBe(true);
  await page.waitForTimeout(1500);
  await startSampler(page);
  const baseCount = await page.evaluate(() => window.__lanefield.frameStats().count);
  await page.evaluate(() => {
    const f = (window as unknown as Record<string, { field: { camera: { position: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void; updateMatrixWorld: () => void }; onFrame: (cb: () => void) => () => void } }>).__sqtest.field;
    const cam = f.camera;
    const off = f.onFrame(() => {
      cam.position.set(0, 30, 0);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
    });
    (window as unknown as Record<string, unknown>).__cam2off = off;
  });
  await page.waitForFunction(
    (base: number) => window.__lanefield.frameStats().count > base,
    baseCount,
    { timeout: 240000 },
  );
  const clamped = await page.evaluate(() => window.__lanefield.camera.pitchDeg);
  console.log(`T-SQ-CAM-2 clamped pitch: ${clamped}`);
  await walkByKeyboard(page, 'Trail 1');
  await waitClaimed(page, 'Trail 1');
  const samples = await finishTrigger('T-SQ-CAM-2 forced flat pose', browser, page, {
    trigger: 'forcedFlat',
    clampedPitch: clamped,
    walkCompleted: true,
  });
  expect(Math.abs(clamped - -75)).toBeLessThan(0.5);
  expect(samples.length).toBeGreaterThan(0);
  await context.close();
});

// ---- T-SQ-CAM-3: reduced motion jumps straight to the resting pose.
test('T-SQ-CAM-3 reduced motion jump to resting pose', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await startSampler(page);
  await waitReady(page);
  // No engine-frame wait here: under reduced motion the loop is
  // stopped, so settle on wall time and let the compositor sampler
  // collect the resting pose.
  await page.waitForTimeout(3000);
  const samples = await stopSampler(page);
  const band = checkBand(samples);
  const distinct = [...new Set(samples.map((s) => Math.round(s.pitch * 100) / 100))];
  const verdict = samples.length > 0 && band.firstOutside === null ? 'pass' : 'fail';
  record({
    test: 'T-SQ-CAM-3 reduced motion jump',
    browser: projectOf(browser),
    verdict,
    samples: samples.length,
    minPitch: band.min,
    maxPitch: band.max,
    firstOutside: band.firstOutside,
    extra: { distinctPitches: distinct },
  });
  expect(samples.length).toBeGreaterThan(0);
  expect(band.firstOutside).toBeNull();
  expect(distinct.length, `reduced motion pitches should be at most rest plus one transient: ${distinct}`).toBeLessThanOrEqual(2);
  await context.close();
});

// ---- Fine walk lean sampling (not sampled in W0).
test('T-SQ-CAM fine walk lean on all trails', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await expect(page.getByRole('button', { name: /Trail \d/ })).toHaveCount(3);
  await page.waitForTimeout(1500);
  await startSampler(page);
  await waitFrames(page, 2);
  const restSamples = await stopSampler(page);
  const restPitches = restSamples.map((s) => s.pitch).sort((a, b) => a - b);
  const restPitch = restPitches[Math.floor(restPitches.length / 2)];
  const trails: Record<string, unknown>[] = [];
  for (const trail of [1, 2, 3]) {
    await startSampler(page);
    await walkByKeyboard(page, `Trail ${trail}`);
    await waitClaimed(page, `Trail ${trail}`);
    await waitFrames(page, 1);
    const walkSamples = await stopSampler(page);
    const pitches = walkSamples.map((s) => s.pitch);
    const walkMin = Math.min(...pitches);
    const walkMax = Math.max(...pitches);
    const band = checkBand(walkSamples);
    trails.push({
      trail,
      samples: walkSamples.length,
      walkMin,
      walkMax,
      steepening: restPitch - walkMin,
      firstOutside: band.firstOutside,
    });
    expect(band.firstOutside).toBeNull();
  }
  const verdict = trails.every((t) => t.firstOutside === null) ? 'pass' : 'fail';
  record({
    test: 'T-SQ-CAM fine walk lean',
    browser: projectOf(browser),
    verdict,
    samples: restSamples.length,
    minPitch: restPitches[0] ?? null,
    maxPitch: restPitches[restPitches.length - 1] ?? null,
    firstOutside: null,
    extra: { restPitch, trails },
  });
  console.log(`T-SQ-CAM fine walk lean: restPitch=${restPitch} trails=${JSON.stringify(trails)}`);
  await context.close();
});

// ---- W6 open item (b): marker walk crossing the hero band.
// Sample hero vs marker tap targets, readout, name, and keymap
// every 250ms wall clock during each walk separately, so an
// overlap attributes to the walk in progress (not just a twin
// index) and carries both rects. Sampling continues one engine
// frame past the claim, so an overlap that clears on the next
// field frame (re-track) is distinguishable from one that
// persists at walk end.
test('T-HERO-BAND-WALK hero never overlaps a marker during walks', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await expect(page.getByRole('button', { name: /Trail \d/ })).toHaveCount(3);
  await page.waitForTimeout(1500);
  const startInterval = (): Promise<void> =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const rect = (el: Element | null): Rect | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [r.left, r.top, r.right, r.bottom];
      };
      w.__heroWalkSamples = [];
      w.__heroWalkTimer = setInterval(() => {
        const hero = document.querySelector('[data-brand-mark]');
        const btns = [...document.querySelectorAll('button[aria-pressed]')];
        (w.__heroWalkSamples as unknown[]).push({
          hero: rect(hero),
          twins: btns.map((b) => rect(b)),
          readout: rect(document.querySelector('.jp-readout')),
          name: rect(document.querySelector('.jp-wordmark')),
          keymap: rect(document.querySelector('.jp-keymap')),
        });
      }, 250);
    });
  const stopInterval = (): Promise<Array<{
    hero: Rect | null;
    twins: Rect[];
    readout: Rect | null;
    name: Rect | null;
    keymap: Rect | null;
  }>> =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      clearInterval(w.__heroWalkTimer as ReturnType<typeof setInterval>);
      const s = w.__heroWalkSamples as Array<{
        hero: Rect | null;
        twins: Rect[];
        readout: Rect | null;
        name: Rect | null;
        keymap: Rect | null;
      }>;
      w.__heroWalkSamples = [];
      return s;
    });
  const overlaps: Array<{
    walk: number;
    sample: number;
    vs: string;
    hero: Rect;
    other: Rect;
    atWalkEnd: boolean;
  }> = [];
  let totalSamples = 0;
  for (const trail of [1, 2, 3]) {
    await startInterval();
    await walkByKeyboard(page, `Trail ${trail}`);
    await waitClaimed(page, `Trail ${trail}`);
    await waitFrames(page, 1);
    const samples = await stopInterval();
    totalSamples += samples.length;
    samples.forEach((s, i) => {
      if (!s.hero) return;
      const atWalkEnd = i === samples.length - 1;
      s.twins.forEach((t, ti) => {
        if (t && intersects(s.hero as Rect, t)) {
          overlaps.push({ walk: trail, sample: i, vs: `twin${ti}`, hero: s.hero as Rect, other: t, atWalkEnd });
        }
      });
      if (s.readout && intersects(s.hero as Rect, s.readout)) {
        overlaps.push({ walk: trail, sample: i, vs: 'readout', hero: s.hero as Rect, other: s.readout, atWalkEnd });
      }
      if (s.name && intersects(s.hero as Rect, s.name)) {
        overlaps.push({ walk: trail, sample: i, vs: 'name', hero: s.hero as Rect, other: s.name, atWalkEnd });
      }
      if (s.keymap && intersects(s.hero as Rect, s.keymap)) {
        overlaps.push({ walk: trail, sample: i, vs: 'keymap', hero: s.hero as Rect, other: s.keymap, atWalkEnd });
      }
    });
  }
  record({
    test: 'T-HERO-BAND-WALK',
    browser: projectOf(browser),
    verdict: overlaps.length === 0 ? 'pass' : 'fail',
    samples: totalSamples,
    minPitch: null,
    maxPitch: null,
    firstOutside: null,
    extra: { overlaps: overlaps.slice(0, 20), overlapCount: overlaps.length },
  });
  console.log(`T-HERO-BAND-WALK: samples=${totalSamples} overlaps=${JSON.stringify(overlaps.slice(0, 20))}`);
  expect(overlaps).toEqual([]);
  await context.close();
});

// ---- Rest checks: T-NAME-1 on /sidequests with the world on,
// readout clear zone at rest, lane count 6144 (total calls recorded).
test('T-SQ-CAM rest name title readout and lanes', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-brand-mark]') as HTMLElement | null;
    if (!el || !el.style.left) return false;
    const img = el.querySelector('img');
    const text = el.querySelector('.jp-hero-text');
    if (img) return img.naturalWidth > 0;
    return text !== null;
  }, null, { timeout: 60000, polling: 100 });
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  for (let s = 0; s < 5; s++) {
    const m = await page.evaluate(() => {
      const r = (sel: string): Rect | null => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return [b.left, b.top, b.right, b.bottom];
      };
      const nameEl = document.querySelector('.jp-wordmark') as HTMLElement | null;
      const hidden = !nameEl || nameEl.hidden || getComputedStyle(nameEl).display === 'none';
      return {
        name: hidden ? null : r('.jp-wordmark'),
        title: r('.jp-readout h1'),
        hero: r('[data-brand-mark]'),
        readout: r('.jp-readout'),
        keymap: r('.jp-keymap'),
        twins: [...document.querySelectorAll('button[aria-pressed]')].map((b) => {
          const bb = b.getBoundingClientRect();
          return [bb.left, bb.top, bb.right, bb.bottom] as Rect;
        }),
        laneCount: window.__lanefield.laneCount,
        calls: window.__lanefield.info().calls,
        pitch: window.__lanefield.camera.pitchDeg,
      };
    });
    if (m.name && m.title) {
      checks.push({ name: 'name-title', ok: !intersects(m.name, m.title), detail: `${JSON.stringify(m.name)} vs ${JSON.stringify(m.title)}` });
    }
    if (m.hero && m.readout) {
      checks.push({ name: 'hero-readout', ok: !intersects(m.hero, m.readout), detail: `${JSON.stringify(m.hero)} vs ${JSON.stringify(m.readout)}` });
    }
    if (m.hero && m.keymap) {
      checks.push({ name: 'hero-keymap', ok: !intersects(m.hero, m.keymap), detail: '' });
    }
    m.twins.forEach((t, i) => {
      if (m.hero) checks.push({ name: `hero-twin${i}`, ok: !intersects(m.hero, t), detail: '' });
    });
    checks.push({ name: 'lanes', ok: m.laneCount === 6144, detail: `laneCount=${m.laneCount} calls=${m.calls} pitch=${m.pitch}` });
    await page.waitForTimeout(300);
  }
  const failed = checks.filter((c) => !c.ok);
  record({
    test: 'T-SQ-CAM rest name title readout and lanes',
    browser: projectOf(browser),
    verdict: failed.length === 0 ? 'pass' : 'fail',
    samples: checks.length,
    minPitch: null,
    maxPitch: null,
    firstOutside: null,
    extra: { failed: failed.slice(0, 10) },
  });
  expect(failed).toEqual([]);
  await context.close();
});

// ---- Pageshow (persisted) attempt: full-document navigation away
// and back. addInitScript installs the listener in every document,
// so a bfcache restore (listener survives, persisted true) is
// distinguishable from a reload (fresh listener, persisted false).
test('T-SQ-CAM pageshow persisted attempt', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__pageshowEvents = [];
    window.addEventListener('pageshow', (e) => {
      (w.__pageshowEvents as Array<{ persisted: boolean }>).push({ persisted: e.persisted });
    });
  });
  await page.goto(`${DEV}/sidequests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  const pitchBefore = await page.evaluate(() => window.__lanefield.camera.pitchDeg);
  await page.goto(`${DEV}/`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.goBack();
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    const lf = window.__lanefield;
    return {
      events: (w.__pageshowEvents as Array<{ persisted: boolean }> | undefined) ?? null,
      url: window.location.pathname,
      pitch: lf ? lf.camera.pitchDeg : null,
      laneCount: lf ? lf.laneCount : null,
      calls: lf ? lf.info().calls : null,
    };
  });
  const persisted = Array.isArray(after.events) && after.events.some((e) => e.persisted === true);
  const exercised = persisted && after.url === '/sidequests';
  record({
    test: 'T-SQ-CAM pageshow persisted attempt',
    browser: projectOf(browser),
    verdict: exercised ? 'pass' : 'not-exercised',
    samples: Array.isArray(after.events) ? after.events.length : 0,
    minPitch: null,
    maxPitch: null,
    firstOutside: null,
    extra: { events: after.events, url: after.url, pitchBefore, pitchAfter: after.pitch, laneCount: after.laneCount, calls: after.calls, exercised },
  });
  console.log(`T-SQ-CAM pageshow: events=${JSON.stringify(after.events)} url=${after.url} pitchBefore=${pitchBefore} pitchAfter=${after.pitch}`);
  // No expect on persisted here: if the sandbox does not restore
  // from bfcache, this test records not-exercised honestly instead
  // of claiming coverage. The pitch-after-restore band check runs
  // only when a restore actually happened.
  if (exercised) {
    expect(after.pitch).toBeGreaterThanOrEqual(MIN);
    expect(after.pitch).toBeLessThanOrEqual(MAX);
    expect(after.laneCount).toBe(6144);
  }
  await context.close();
});

// World harness path for CAM-2 type checks lives in lanefield.spec
// (T-SQ-CLAMP-1); this file additionally loads the world harness to
// confirm the clamp function engages on the bare field too.
test('T-SQ-CAM-2 world harness forced flat pose', async ({ browser }) => {
  const { context, page } = await iphonePage(browser);
  await page.goto(`${HARNESS}?initial=sidequests`, { waitUntil: 'domcontentloaded' });
  const ok = await page.evaluate(() => window.__testReady);
  expect(ok).toBe(true);
  await page.waitForFunction(
    () => window.__lanefield.frameStats().count >= 2,
    null,
    { timeout: 240000 },
  );
  const baseCount = await page.evaluate(() => window.__lanefield.frameStats().count);
  await page.evaluate(() => {
    const f = (window as unknown as Record<string, { field: { camera: { position: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void; updateMatrixWorld: () => void }; onFrame: (cb: () => void) => () => void } }>).__test.field;
    const cam = f.camera;
    f.onFrame(() => {
      cam.position.set(0, 30, 0);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
    });
  });
  await page.waitForFunction(
    (base: number) => window.__lanefield.frameStats().count > base,
    baseCount,
    { timeout: 240000 },
  );
  const clamped = await page.evaluate(() => window.__lanefield.camera);
  record({
    test: 'T-SQ-CAM-2 world harness forced flat pose',
    browser: projectOf(browser),
    verdict: clamped.pitchDeg >= MIN - 1e-6 && clamped.pitchDeg <= MAX + 1e-6 ? 'pass' : 'fail',
    samples: 1,
    minPitch: clamped.pitchDeg,
    maxPitch: clamped.pitchDeg,
    firstOutside: null,
    extra: { clampedPitch: clamped.pitchDeg, pos: clamped.pos },
  });
  expect(clamped.pitchDeg).toBeGreaterThanOrEqual(MIN - 1e-6);
  expect(clamped.pitchDeg).toBeLessThanOrEqual(MAX + 1e-6);
  expect(Math.abs(clamped.pitchDeg - -75)).toBeLessThan(0.5);
  await context.close();
});
