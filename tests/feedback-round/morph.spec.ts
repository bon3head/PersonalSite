// P-MORPH-1 tests (DESIGN section 6.7, S03 morph rules).
// Timing note, same as the W4 suite: on SwiftShader a single frame
// takes many seconds, so a 700ms travel jumps from start to finish
// in one frame. Browser tests therefore assert endpoints, settled
// invariants, and DOM timing, never a mid-travel wall-clock pixel
// sample; interpolation at 0, 25, 50, 75, 100 percent is covered by
// the unit tests below, which call the exact morph controller the
// engine samples per frame.
import { test, expect, type Page } from '@playwright/test';
import { createMorphController } from '../../src/motion/morph-controller';
import {
  descriptorForLayout,
  applyDescriptorToParams,
} from '../../src/motion/hero-descriptors';
import { paramsForLayout } from '../../src/world/laneParams';
import { poseFor } from '../../src/world/camera';
import { T } from '../../src/tokens.generated';

test.setTimeout(300000);

const DEV = 'http://localhost:5173';
const HARNESS = `${DEV}/tests/world-harness.html`;
const TRAVEL_MS = T.motion.ms.travel;

const H1: Record<string, string> = {
  server: 'Justin Poli',
  leaflink: 'LeafLink',
  sidequests: 'SideQuests',
};
const PATH: Record<string, string> = {
  server: '/',
  leaflink: '/leaflink',
  sidequests: '/sidequests',
};
const KEY: Record<string, string> = {
  server: '1',
  leaflink: '2',
  sidequests: '3',
};
const LAYOUT: Record<string, 'server' | 'leaflink' | 'sidequests'> = {
  server: 'server',
  leaflink: 'leaflink',
  sidequests: 'sidequests',
};

async function waitAppReady(page: Page): Promise<void> {
  await page.waitForSelector('.jp-keymap', { timeout: 30000 });
  await page.waitForSelector('.jp-readout h1', { timeout: 30000 });
  // Interval polling, not rAF: on SwiftShader a frame can take
  // seconds, which starves rAF-polled waits.
  await page.waitForFunction(() => window.__lanefield?.ready === true, null, {
    timeout: 240000,
    polling: 100,
  });
}

async function gotoApp(page: Page, route: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(DEV + route, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForTimeout(1500);
}

async function travelByKey(page: Page, scene: string): Promise<void> {
  await page.keyboard.press(KEY[scene]);
  await page.waitForFunction(
    (h1) => document.querySelector('.jp-readout h1')?.textContent === h1,
    H1[scene],
    { timeout: 120000, polling: 100 },
  );
  await page.waitForTimeout(1500);
}

// ---- Descriptors: shape W6 consumes, no shader change needed.
test('T-MORPH-DESC: hero descriptors carry anchor, ring, silhouette', () => {
  const leaf = descriptorForLayout('leaflink');
  const sq = descriptorForLayout('sidequests');
  const server = descriptorForLayout('server');
  expect(leaf.kind).toBe('mark');
  expect(leaf.maskKind).toBe('leaflink');
  expect(leaf.ringRadius).toBe(T.scene.leaflink.gradient.light.radius);
  expect(leaf.silhouetteRadius).toBe(leaf.ringRadius);
  expect(leaf.anchor).toEqual([
    poseFor('leaflink', 'fine').target[0],
    poseFor('leaflink', 'fine').target[2],
  ]);
  expect(sq.kind).toBe('mark');
  expect(sq.maskKind).toBe('sidequests');
  expect(sq.ringRadius).toBe(T.scene.sidequests.gradient.light.radius);
  expect(sq.anchor).toEqual([0, 0]);
  expect(server.kind).toBe('field');
  expect(server.ringRadius).toBe(0);
  expect(server.maskKind).toBe('none');
  // applyDescriptorToParams moves only the ring and silhouette
  // fields; gradient and light fields are untouched.
  const base = paramsForLayout('server');
  const applied = applyDescriptorToParams(base, leaf);
  expect(applied.ringCenter).toEqual(leaf.anchor);
  expect(applied.silhouetteCenter).toEqual(leaf.silhouetteCenter);
  expect(applied.silhouetteRadius).toBe(leaf.silhouetteRadius);
  expect(applied.silhouetteMask).toBe('leaflink');
  expect(applied.leadOklab).toEqual(base.leadOklab);
  expect(applied.lightRadius).toBe(base.lightRadius);
});

// ---- Controller phases at 0, 25, 50, 75, 100 percent, every pair.
test('T-MORPH-PHASES: sample invariants at every quarter of every pair', () => {
  const layouts = ['server', 'leaflink', 'sidequests', 'scatter'] as const;
  for (const from of layouts) {
    for (const to of layouts) {
      if (from === to) continue;
      const c = createMorphController(from);
      c.navigate(to, 0);
      for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
        const s = c.sample(frac * TRAVEL_MS);
        expect(s.p).toBeCloseTo(frac, 10);
        expect(Number.isFinite(s.ringStrength)).toBe(true);
        expect(Number.isFinite(s.silhouetteStrength)).toBe(true);
        expect(s.ringStrength).toBeGreaterThanOrEqual(0);
        expect(s.silhouetteStrength).toBeGreaterThanOrEqual(0);
        expect(s.silhouetteStrength).toBeLessThanOrEqual(
          T.morph.silhouettePull + 1e-9,
        );
        expect(Number.isFinite(s.ringCenter[0])).toBe(true);
        expect(Number.isFinite(s.ringCenter[1])).toBe(true);
      }
      const end = c.sample(TRAVEL_MS);
      expect(end.done).toBe(true);
      expect(end.ringFactor).toBe(0);
      expect(end.ringStrength).toBe(0);
      expect(end.silhouetteStrength).toBe(0);
      expect(end.to).toBe(to);
    }
  }
});

// ---- Controller: field to project envelope, loom at Reveal.
test('T-MORPH-ENV: gather peaks, reveal looms, ends hand off to rest', () => {
  const c = createMorphController('server');
  c.navigate('leaflink', 0);
  const start = c.sample(0);
  expect(start.ringFactor).toBe(0);
  expect(start.silhouetteStrength).toBe(0);
  expect(start.ringCenter).toEqual(descriptorForLayout('leaflink').anchor);
  const mid = c.sample(0.45 * TRAVEL_MS);
  expect(mid.gather).toBeGreaterThan(0);
  expect(mid.ringStrength).toBeGreaterThan(0);
  expect(mid.silhouetteStrength).toBeGreaterThan(0);
  expect(mid.silhouetteStrength).toBeLessThanOrEqual(T.morph.silhouettePull);
  // Loom window is a token (motion.morph.loom, DESIGN 1.2.0): sample
  // its midpoint, where the mark is part way in.
  const loomMid = 0.5 * (T.motion.morph.loom[0] + T.motion.morph.loom[1]);
  const revealMid = c.sample(loomMid * TRAVEL_MS);
  expect(revealMid.heroOpacityIn).toBeGreaterThan(0);
  expect(revealMid.heroOpacityIn).toBeLessThan(1);
  expect(revealMid.heroScaleIn).toBeGreaterThan(T.morph.loomFrom);
  expect(revealMid.heroScaleIn).toBeLessThan(1);
  const end = c.sample(TRAVEL_MS);
  expect(end.heroOpacityIn).toBe(1);
  expect(end.heroScaleIn).toBe(1);
});

// ---- Controller: project to project breath and anchor travel.
test('T-MORPH-BREATH: ring dips to ringBreath, regrows, anchor tracks', () => {
  const c = createMorphController('leaflink');
  c.navigate('sidequests', 0);
  // Gather middle: gather raw progress 0.5, handoff still 0, so the
  // ring factor equals the breath token exactly. The middle comes from
  // the gather token (DESIGN 1.2.0 moved its start to 0.22).
  const gatherMid = 0.5 * (T.motion.morph.gather[0] + T.motion.morph.gather[1]);
  const dip = c.sample(gatherMid * TRAVEL_MS);
  expect(dip.ringFactor).toBeCloseTo(T.morph.ringBreath, 10);
  const regrown = c.sample(0.75 * TRAVEL_MS);
  expect(regrown.ringFactor).toBeGreaterThan(0.95);
  // The anchor travels on curve.track, so at 0.75 it is close to
  // but not yet exactly at the target anchor; it lands exactly at 1.
  const sqAnchor = descriptorForLayout('sidequests').anchor;
  expect(Math.abs(regrown.ringCenter[0] - sqAnchor[0])).toBeLessThan(0.2);
  expect(Math.abs(regrown.ringCenter[1] - sqAnchor[1])).toBeLessThan(0.2);
  expect(c.sample(TRAVEL_MS).ringCenter).toEqual(sqAnchor);
  const early = c.sample(0.25 * TRAVEL_MS);
  const leafAnchor = descriptorForLayout('leaflink').anchor;
  expect(early.ringCenter[0]).toBeGreaterThanOrEqual(
    Math.min(leafAnchor[0], sqAnchor[0]) - 1e-9,
  );
  expect(early.ringCenter[0]).toBeLessThanOrEqual(
    Math.max(leafAnchor[0], sqAnchor[0]) + 1e-9,
  );
});

// ---- Controller: recede on travel to a field route.
test('T-MORPH-RECEDE: outgoing mark recedes over motion.morph.recede', () => {
  const c = createMorphController('leaflink');
  c.navigate('server', 0);
  // The recede window ends before the readout hidden point, so the
  // outgoing mark is gone before its DOM unmounts at the swap.
  expect(T.motion.morph.recede[1] * TRAVEL_MS).toBeLessThan(
    T.chrome.travelDom.readoutHiddenAtMs,
  );
  const mid = c.sample(0.5 * T.motion.morph.recede[1] * TRAVEL_MS);
  expect(mid.heroOpacityOut).toBeGreaterThan(0);
  expect(mid.heroOpacityOut).toBeLessThan(1);
  expect(mid.heroScaleOut).toBeGreaterThanOrEqual(T.morph.recedeTo);
  expect(mid.heroScaleOut).toBeLessThanOrEqual(1);
  const end = c.sample(TRAVEL_MS);
  expect(end.heroOpacityOut).toBe(0);
  expect(end.heroScaleOut).toBe(T.morph.recedeTo);
  expect(end.direction).toBe(-1);
});

// ---- Controller: retarget never jumps, direction follows keymap order.
test('T-MORPH-RETARGET: second input retargets from the current sample', () => {
  const c = createMorphController('server');
  c.navigate('leaflink', 0);
  const at200 = c.sample(200);
  expect(c.sample(200).direction).toBe(1);
  c.navigate('sidequests', 200);
  const at201 = c.sample(201);
  expect(at201.to).toBe('sidequests');
  expect(at201.direction).toBe(1);
  const centerDelta = Math.hypot(
    at201.ringCenter[0] - at200.ringCenter[0],
    at201.ringCenter[1] - at200.ringCenter[1],
  );
  expect(centerDelta).toBeLessThan(0.05);
  expect(Math.abs(at201.ringStrength - at200.ringStrength)).toBeLessThan(0.05);
  expect(
    Math.abs(at201.silhouetteStrength - at200.silhouetteStrength),
  ).toBeLessThan(0.05);
  const end = c.sample(900);
  expect(end.done).toBe(true);
  expect(end.to).toBe('sidequests');
  expect(end.ringCenter).toEqual(descriptorForLayout('sidequests').anchor);
});

// ---- Controller: reduced motion is a jump, degrade latches.
test('T-MORPH-REDUCED-DEGRADE: jump on reduced, latch at 30 frames', () => {
  const reduced = createMorphController('server');
  reduced.navigateReduced('leaflink', 0);
  const jump = reduced.sample(0);
  expect(jump.done).toBe(true);
  expect(jump.p).toBe(1);
  expect(jump.ringStrength).toBe(0);
  expect(jump.silhouetteStrength).toBe(0);
  expect(jump.heroOpacityIn).toBe(1);

  const c = createMorphController('server');
  c.navigate('leaflink', 0);
  c.sample(0);
  for (let i = 0; i < 29; i++) c.observeFrame(20, i);
  expect(c.degradeState().degraded).toBe(false);
  c.observeFrame(20, 29);
  expect(c.degradeState().degraded).toBe(true);
  // A later morph in the same session carries no silhouette pull.
  c.navigate('sidequests', 1000);
  const peak = c.sample(1000 + 0.45 * TRAVEL_MS);
  expect(peak.silhouetteStrength).toBe(0);
  expect(peak.ringStrength).toBeGreaterThan(0);

  const reset = createMorphController('server');
  reset.navigate('leaflink', 0);
  reset.sample(0);
  for (let i = 0; i < 29; i++) reset.observeFrame(20, i);
  reset.observeFrame(10, 29);
  for (let i = 0; i < 29; i++) reset.observeFrame(20, 30 + i);
  expect(reset.degradeState().degraded).toBe(false);
  const forced = createMorphController('server');
  forced.navigate('leaflink', 0);
  forced.forceDegrade();
  expect(forced.degradeState().degraded).toBe(true);
  expect(forced.sample(0.45 * TRAVEL_MS).silhouetteStrength).toBe(0);
});

// ---- T-TRANS-2: lane invariants through every route pair, plus the
// G-ANTI DOM invariants at every settled route.
test('T-TRANS-2: lanes, draw call, doc height, no navbar, no cards', async ({
  page,
}) => {
  test.setTimeout(600000);
  // Harness chain: one load, then the six route pairs in sequence,
  // so the expensive layout build and shader compile happen once.
  // The lane field alone is measured here, so renderer calls are
  // the lane draw call, not controller meshes.
  const chain = ['leaflink', 'sidequests', 'server', 'sidequests', 'leaflink', 'server'];
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${HARNESS}?initial=server`);
  await page.waitForFunction(() => window.__testReady, null, {
    timeout: 240000,
    polling: 100,
  });
  await page.waitForFunction(
    () => window.__lanefield.frameStats().count >= 2,
    null,
    { timeout: 240000, polling: 100 },
  );
  for (const to of chain) {
    const during = await page.evaluate(async (target) => {
      const f = window.__test.field;
      const travel = f.travelTo(target);
      await new Promise((r) => setTimeout(r, 1000));
      const mid = {
        laneCount: window.__lanefield.laneCount,
        calls: window.__lanefield.info().calls,
      };
      await travel;
      return {
        mid,
        after: {
          laneCount: window.__lanefield.laneCount,
          calls: window.__lanefield.info().calls,
        },
      };
    }, to);
    expect(during.mid.laneCount).toBe(6144);
    expect(during.mid.calls).toBe(1);
    expect(during.after.laneCount).toBe(6144);
    expect(during.after.calls).toBe(1);
  }

  // App routes: G-ANTI at every settled route of a full key tour.
  await gotoApp(page, '/');
  const tour = ['leaflink', 'sidequests', 'server', 'sidequests', 'leaflink', 'server'];
  await page.evaluate(() => {
    (window as unknown as { __w5canvas?: Element | null }).__w5canvas =
      document.querySelector('#world canvas');
  });
  const canvasBefore = await page.evaluate(
    () => (window as unknown as { __w5canvas?: Element | null }).__w5canvas,
  );
  expect(canvasBefore).not.toBeNull();
  for (const scene of tour) {
    await travelByKey(page, scene);
    const anti = await page.evaluate(() => ({
      laneCount: window.__lanefield.laneCount,
      cards: document.querySelectorAll('[class*=card]').length,
      headers: document.querySelectorAll('header').length,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      canvas: document.querySelector('#world canvas'),
      url: window.location.pathname,
    }));
    expect(anti.laneCount).toBe(6144);
    expect(anti.cards).toBe(0);
    expect(anti.headers).toBe(0);
    expect(anti.scrollHeight).toBe(anti.innerHeight);
    expect(anti.url).toBe(PATH[scene]);
    const sameCanvas = await page.evaluate(
      () =>
        document.querySelector('#world canvas') ===
        (window as unknown as { __w5canvas?: Element | null }).__w5canvas,
    );
    expect(sameCanvas).toBe(true);
  }
});

// ---- T-TRANS-3: press 2 then 3 within 200ms ends on sidequests.
test('T-TRANS-3: retarget mid-flight ends on sidequests, weights one-hot', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.keyboard.press('2');
  await page.waitForTimeout(150);
  await page.keyboard.press('3');
  await page.waitForFunction(
    (h1) => document.querySelector('.jp-readout h1')?.textContent === h1,
    H1.sidequests,
    { timeout: 120000, polling: 100 },
  );
  await page.waitForTimeout(1500);
  // The morph debug hook updates on a rendered frame, and on
  // SwiftShader frames are sparse, so wait for the hook to catch up
  // to this travel before asserting it.
  await page.waitForFunction(
    () =>
      (window as unknown as { __morph?: { to?: string; sample?: { done?: boolean } } }).__morph?.to ===
        'sidequests' &&
      (window as unknown as { __morph?: { sample?: { done?: boolean } } }).__morph?.sample?.done ===
        true,
    null,
    { timeout: 120000, polling: 100 },
  );
  const end = await page.evaluate(() => ({
    url: window.location.pathname,
    weights: window.__lanefield.weights(),
    morph: (window as unknown as { __morph?: { to?: string; sample?: { done?: boolean } } }).__morph,
  }));
  expect(end.url).toBe('/sidequests');
  expect(end.weights[2]).toBeCloseTo(1, 2);
  for (let i = 0; i < 4; i++) {
    if (i !== 2) expect(Math.abs(end.weights[i])).toBeLessThan(0.01);
  }
  expect(end.morph?.to).toBe('sidequests');
  expect(end.morph?.sample?.done).toBe(true);
});

// ---- T-TRANS-4: reduced motion completes as a jump plus 150ms crossfade.
test('T-TRANS-4: reduced motion travel is a jump with a short crossfade', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await gotoApp(page, '/');
  const started = Date.now();
  await page.keyboard.press('2');
  await page.waitForFunction(
    () =>
      document.querySelector('.jp-readout h1')?.textContent === 'LeafLink' &&
      getComputedStyle(document.querySelector('.jp-readout') as HTMLElement)
        .opacity === '1',
    null,
    { timeout: 30000, polling: 50 },
  );
  const elapsed = Date.now() - started;
  // Design timing is a jump plus a 150ms crossfade (about 300ms
  // total); the precise timer is covered by the stub timing test
  // and the unit jump test, because on SwiftShader a single WebGL
  // frame blocks main-thread timers for seconds, so wall-clock
  // elapsed here measures frame blockage, not the design. What the
  // browser test proves is the reduced behavior: the morph sample
  // is a jump (p 1, done) rather than an interpolated morph, the
  // readout lands opaque, and the weights are one-hot.
  console.log(`T-TRANS-4: reduced travel wall-clock elapsed ${elapsed}ms`);
  expect(elapsed).toBeLessThan(30000);
  const reduced = await page.evaluate(() => ({
    weights: window.__lanefield.weights(),
    morph: (window as unknown as { __morph?: { sample?: { p?: number; done?: boolean } } }).__morph?.sample,
  }));
  expect(reduced.weights[1]).toBeCloseTo(1, 2);
  expect(reduced.morph?.p).toBe(1);
  expect(reduced.morph?.done).toBe(true);
  await context.close();
});

// ---- T-TRANS-5: browser back and forward run the morph.
test('T-TRANS-5: back and forward run the morph with keymap direction', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await travelByKey(page, 'leaflink');
  await travelByKey(page, 'sidequests');
  await page.goBack();
  await page.waitForFunction(
    (h1) => document.querySelector('.jp-readout h1')?.textContent === h1,
    H1.leaflink,
    { timeout: 120000, polling: 100 },
  );
  await page.waitForTimeout(1500);
  await page.waitForFunction(
    () =>
      (window as unknown as { __morph?: { to?: string } }).__morph?.to ===
      'leaflink',
    null,
    { timeout: 120000, polling: 100 },
  );
  const back = await page.evaluate(() => ({
    url: window.location.pathname,
    weights: window.__lanefield.weights(),
    morph: (window as unknown as { __morph?: { from?: string; to?: string } }).__morph,
  }));
  expect(back.url).toBe('/leaflink');
  expect(back.weights[1]).toBeCloseTo(1, 2);
  expect(back.morph?.from).toBe('sidequests');
  expect(back.morph?.to).toBe('leaflink');
  await page.goForward();
  await page.waitForFunction(
    (h1) => document.querySelector('.jp-readout h1')?.textContent === h1,
    H1.sidequests,
    { timeout: 120000, polling: 100 },
  );
  await page.waitForTimeout(1500);
  await page.waitForFunction(
    () =>
      (window as unknown as { __morph?: { to?: string } }).__morph?.to ===
      'sidequests',
    null,
    { timeout: 120000, polling: 100 },
  );
  const fwd = await page.evaluate(() => ({
    url: window.location.pathname,
    weights: window.__lanefield.weights(),
    morph: (window as unknown as { __morph?: { from?: string; to?: string } }).__morph,
  }));
  expect(fwd.url).toBe('/sidequests');
  expect(fwd.weights[2]).toBeCloseTo(1, 2);
  expect(fwd.morph?.from).toBe('leaflink');
  expect(fwd.morph?.to).toBe('sidequests');
});

// ---- T-TRANS-6: no navigation without user input over 60s idle.
test('T-TRANS-6: idle 60s per route causes no navigation', async ({
  page,
}) => {
  test.setTimeout(600000);
  await gotoApp(page, '/');
  for (const scene of ['server', 'leaflink', 'sidequests']) {
    if (scene !== 'server') await travelByKey(page, scene);
    const before = await page.evaluate(() => ({
      url: window.location.pathname,
      h1: document.querySelector('.jp-readout h1')?.textContent,
      weights: window.__lanefield.weights(),
    }));
    await page.waitForTimeout(60000);
    const after = await page.evaluate(() => ({
      url: window.location.pathname,
      h1: document.querySelector('.jp-readout h1')?.textContent,
      weights: window.__lanefield.weights(),
      morphDone: (window as unknown as { __morph?: { sample?: { done?: boolean } } }).__morph?.sample?.done,
    }));
    expect(after.url).toBe(before.url);
    expect(after.h1).toBe(before.h1);
    for (let i = 0; i < 4; i++) {
      expect(Math.abs(after.weights[i] - before.weights[i])).toBeLessThan(0.01);
    }
    expect(after.morphDone).not.toBe(false);
  }
});

// ---- T-NAME-2: name clear zone holds mid-morph.
test('T-NAME-2: name box never intersects the title box during a morph', async ({
  page,
}) => {
  await gotoApp(page, '/');
  // Press, then sample boxes on a wall-clock cadence through the
  // 700ms morph window and past it. A hidden readout reports an
  // empty rect, which cannot intersect; only non-empty pairs count.
  await page.keyboard.press('2');
  const samples = await page.evaluate(async () => {
    const out: Array<{ name: number[] | null; title: number[] }> = [];
    for (let i = 0; i < 24; i++) {
      const nameEl = document.querySelector('.jp-wordmark') as HTMLElement | null;
      const titleEl = document.querySelector('.jp-readout h1') as HTMLElement;
      const nr = nameEl ? nameEl.getBoundingClientRect() : null;
      const tr = titleEl.getBoundingClientRect();
      out.push({
        name: nr ? [nr.left, nr.top, nr.right, nr.bottom] : null,
        title: [tr.left, tr.top, tr.right, tr.bottom],
      });
      await new Promise<void>((r) => setTimeout(r, 50));
    }
    return out;
  });
  expect(samples.length).toBe(24);
  for (const s of samples) {
    if (s.name === null) continue;
    const [n0, n1, n2, n3] = s.name;
    const [t0, t1, t2, t3] = s.title;
    if (t2 === 0 || t3 === 0) continue;
    expect(n0 < t2 && n2 > t0 && n1 < t3 && n3 > t1).toBe(false);
  }
  await page.waitForFunction(
    (h1) => document.querySelector('.jp-readout h1')?.textContent === h1,
    H1.leaflink,
    { timeout: 120000, polling: 100 },
  );
});

// ---- T-SRV-2 box check at 100 percent of an entry into server.
// Same pixel rule as the scene suite (delta E under 0.01 against void
// ground, readout paused out first, steady state after 6s), but the
// route is reached by a morph from leaflink, not by direct load.
test('T-SRV-2-ENTRY: readout box clear at 100 percent of server entry', async ({
  page,
}) => {
  await gotoApp(page, '/leaflink');
  await travelByKey(page, 'server');
  await page.evaluate(() => {
    const ctrls = (
      window as unknown as {
        __sceneControllers?: Map<string, { pause: () => void }>;
      }
    ).__sceneControllers;
    ctrls?.get('server')?.pause();
  });
  await page.waitForTimeout(6000);
  const box = await page.evaluate(() => {
    const el = document.querySelector('.jp-readout');
    if (!el) throw new Error('no readout');
    const r = el.getBoundingClientRect();
    const pad = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--spacing-6'),
    );
    const dpr = window.devicePixelRatio || 1;
    const x = Math.max(0, Math.floor((r.left - pad) * dpr));
    const y = Math.max(0, Math.floor((r.top - pad) * dpr));
    const w = Math.min(
      Math.floor(window.innerWidth * dpr) - x,
      Math.ceil((r.width + pad * 2) * dpr),
    );
    const h = Math.min(
      Math.floor(window.innerHeight * dpr) - y,
      Math.ceil((r.height + pad * 2) * dpr),
    );
    (el as HTMLElement).style.visibility = 'hidden';
    return { x, y, w, h };
  });
  const shot = await page.screenshot();
  const stats = await analyzeShot(page, shot, box);
  expect(stats.total).toBeGreaterThan(0);
  expect(stats.maxDelta).toBeLessThan(0.01);
});

async function analyzeShot(
  page: Page,
  shot: Buffer,
  region: { x: number; y: number; w: number; h: number },
): Promise<{ maxDelta: number; total: number }> {
  const b64 = shot.toString('base64');
  return page.evaluate(
    async ({ b64, region, ground }) => {
      const srgbToLinear = (c: number): number => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const toOklab = (r: number, g: number, b: number): [number, number, number] => {
        const R = srgbToLinear(r);
        const G = srgbToLinear(g);
        const B = srgbToLinear(b);
        const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
        const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
        const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
        const lc = Math.cbrt(l);
        const mc = Math.cbrt(m);
        const sc = Math.cbrt(s);
        return [
          0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
          1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
          0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc,
        ];
      };
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('img load failed'));
        img.src = 'data:image/png;base64,' + b64;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(region.x, region.y, region.w, region.h).data;
      const [gL, gA, gB] = toOklab(ground[0], ground[1], ground[2]);
      let maxDelta = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const [L, A, B] = toOklab(data[i], data[i + 1], data[i + 2]);
        total += 1;
        const d = Math.sqrt((L - gL) ** 2 + (A - gA) ** 2 + (B - gB) ** 2);
        if (d > maxDelta) maxDelta = d;
      }
      return { maxDelta, total };
    },
    { b64, region, ground: [10, 12, 15] },
  );
}
