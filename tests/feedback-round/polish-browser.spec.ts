// Polish round 2 browser acceptance (DESIGN 1.2.0). Every test drives
// time with Playwright's fake clock (install before load, pauseAt after
// it, then runFor in 16ms steps), so samples sit at known travel times
// and a seeded run is reproducible frame for frame. Phone viewport 390x658
// is the device-run-2 in-app browser. Dev server on 5173 (config
// webServer, reused when running).
import { test, expect, type Page, type BrowserContext, type Browser } from '@playwright/test';

test.setTimeout(600000);

const DEV = process.env.POLISH_DEV ?? 'http://localhost:5173';
const PHONE = { width: 390, height: 658 };

type Sample = {
  p: number | null;
  done: boolean | null;
  heroC: [number, number] | null;
  heroO: number | null;
  ringS: number;
  silS: number;
  ringPx: [number, number] | null;
  readout: [number, number, number, number] | null;
  pitch: number;
  pan: [number, number];
  glitter: { target: number; value: number };
  bow: number | null;
  swirl: number | null;
};

async function open(browser: Browser, path: string, opts: { reduced?: boolean; viewport?: { width: number; height: number } } = {}): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({
    viewport: opts.viewport ?? PHONE,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-11-02T12:00:00Z') });
  await page.goto(`${DEV}${path}`);
  // install() alone lets page time keep flowing with wall time, so
  // rAF steps vary (16 or 32ms) and two runs drift. Pausing makes
  // runFor the only clock: frame-exact replay.
  await page.clock.pauseAt(new Date('2026-11-02T12:01:00Z'));
  let elapsed = 0;
  for (let i = 0; i < 600; i++) {
    await page.clock.runFor(50);
    elapsed += 50;
    const ok = await page.evaluate(() => {
      const w = window as unknown as { __lanefield?: { ready: boolean }; __lanefieldReady?: unknown };
      return Boolean(w.__lanefield?.ready && w.__lanefieldReady);
    });
    if (ok) break;
  }
  // Replay precondition: the brand manifest has arrived. It is real
  // network I/O, so without this wait the frame at which the hero
  // anchor first resolves (and Gather starts) depends on wall time.
  for (let i = 0; i < 600; i++) {
    // brandPrefetch sets this after the shared manifest fetch resolves
    // (resource timing is no help in dev: the buffer fills with modules).
    const has = await page.evaluate(() => Boolean((window as unknown as { __brandPrefetched?: unknown }).__brandPrefetched));
    if (has) break;
    await page.clock.runFor(50);
    elapsed += 50;
  }
  for (let i = 0; i < 40; i++) await page.clock.runFor(50);
  elapsed += 2000;
  // Put the first input on the 16ms frame grid. How long the layout
  // worker takes to get ready is wall time, so the number of 50ms
  // waits varies; without this the morph start falls at a different
  // phase between frames and every sample sits at a shifted p.
  const pad = (16 - (elapsed % 16)) % 16;
  if (pad > 0) await page.clock.runFor(pad);
  return { ctx, page };
}

function sample(page: Page): Promise<Sample> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __lanefieldReady: {
        getParams: () => { ringStrength: number; silhouetteStrength: number; ringCenter: [number, number] };
        worldToScreen: (p: [number, number, number]) => [number, number];
        focusOffset: () => [number, number];
      };
      __lanefield: { camera: { pitchDeg: number } };
      __morph: { sample: { p: number; done: boolean; bow: number; ringSwirl: number } | null; stage: () => { glitter: { target: number; value: number } } };
    };
    const f = w.__lanefieldReady;
    const pr = f.getParams();
    const hero = document.querySelector('[data-brand-mark]');
    const hr = hero ? hero.getBoundingClientRect() : null;
    const ro = document.querySelector('.jp-readout')?.getBoundingClientRect() ?? null;
    const s = w.__morph.sample;
    return {
      p: s ? s.p : null,
      done: s ? s.done : null,
      heroC: hr && hr.width > 0 ? [hr.left + hr.width / 2, hr.top + hr.height / 2] : null,
      heroO: hero ? Number(getComputedStyle(hero).opacity) : null,
      ringS: pr.ringStrength,
      silS: pr.silhouetteStrength,
      ringPx: pr.ringStrength > 0 ? f.worldToScreen([pr.ringCenter[0], 0, pr.ringCenter[1]]) : null,
      readout: ro && ro.height > 0 ? [ro.left, ro.top, ro.right, ro.bottom] : null,
      pitch: w.__lanefield.camera.pitchDeg,
      pan: f.focusOffset(),
      glitter: w.__morph.stage().glitter,
      bow: s ? s.bow : null,
      swirl: s ? s.ringSwirl : null,
    } as Sample;
  });
}

async function run(page: Page, ms: number): Promise<Sample[]> {
  const out: Sample[] = [];
  for (let t = 16; t <= ms; t += 16) {
    await page.clock.runFor(16);
    out.push(await sample(page));
  }
  return out;
}

const dist = (a: [number, number], b: [number, number]): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('T-FLUSH-1: the LeafLink mark is placed once at the swap and never moves', async ({ browser }) => {
  const { ctx, page } = await open(browser, '/?seed=42');
  await page.keyboard.press('2');
  const rows = await run(page, 1600);
  // The readout keeps a layout box through the whole swap window.
  expect(rows.every((r) => r.readout !== null)).toBe(true);
  const placed = rows.filter((r) => r.heroC !== null);
  expect(placed.length).toBeGreaterThan(0);
  const first = placed[0].heroC as [number, number];
  for (const r of placed) expect(dist(r.heroC as [number, number], first)).toBeLessThanOrEqual(1);
  // Loom: opacity rises from 0 to 1 with intermediate frames, never a pop.
  const op = placed.map((r) => r.heroO as number);
  expect(op[0]).toBeLessThan(0.05);
  expect(op.filter((o) => o > 0.02 && o < 0.98).length).toBeGreaterThanOrEqual(5);
  expect(op[op.length - 1]).toBe(1);
  await ctx.close();
});

test('T-RING-1: after Gather the ring sits under the mark; at rest it is zero', async ({ browser }) => {
  for (const [key, tol] of [['2', 2], ['3', 22]] as const) {
    const { ctx, page } = await open(browser, '/?seed=42');
    await page.keyboard.press(key);
    const rows = await run(page, 1600);
    const late = rows.filter((r) => r.p !== null && r.p >= 0.75 && !r.done && r.ringPx && r.heroC);
    expect(late.length).toBeGreaterThan(0);
    for (const r of late) expect(dist(r.ringPx as [number, number], r.heroC as [number, number])).toBeLessThanOrEqual(tol);
    // Rest invariant: zero ring and pull once the morph is over.
    const rest = rows.filter((r) => r.done).slice(10);
    for (const r of rest) {
      expect(r.ringS).toBe(0);
      expect(r.silS).toBe(0);
    }
    await ctx.close();
  }
});

test('T-LL-VERB: device run 3 cut the offer button; the leaflink slip has no offer button and does not scroll', async ({ browser }) => {
  const { ctx, page } = await open(browser, '/leaflink?seed=42');
  const box = await page.evaluate(() => {
    const ro = document.querySelector('.jp-readout') as HTMLElement;
    const offer = [...ro.querySelectorAll('button')].find((b) => /offer/i.test(b.textContent ?? ''));
    return { hasOffer: offer !== undefined, scrollTop: ro.scrollTop };
  });
  expect(box.hasOffer).toBe(false);
  expect(box.scrollTop).toBe(0);
  await ctx.close();
});

for (const trail of [0, 1, 2]) {
test(`T-SQ-TRACK trail ${trail + 1}: on a phone the tapped trail ends in the clear band; pitch constant`, async ({ browser }) => {
  // 390x844 (the T-HERO-BAND-WALK phone). At 390x658 there is no focus
  // spot beside the mark clear of the readout and keymap, so no pan
  // happens there (open decision, FINAL-POLISH-SPEC 10.2).
  // Device run 3 cut the hint and trail row, shrinking the readout, so
  // the clear band is taller and all three trails now end in the band
  // at 390x844. The test.fail for trails 1 and 3 is removed. The 390x658
  // accept-no-pan decision (FINAL-POLISH-SPEC 10.2) is separate and
  // unchanged; this test runs at 390x844 only.
  const { ctx, page } = await open(browser, '/sidequests?seed=42', { viewport: { width: 390, height: 844 } });
  const keymapTop = await page.evaluate(() => (document.querySelector('.jp-keymap') as HTMLElement).getBoundingClientRect().top);
  // TrailRow is cut (device run 3); walk via the controller, the same walk
  // the twins call.
  await page.evaluate((i) => {
    const w = window as unknown as { __sceneControllers: Map<string, { walk: (i: number) => void }> };
    w.__sceneControllers.get('sidequests')?.walk(i);
  }, trail);
  let claimAt = -1;
  let firstInBand = -1;
  const pitches: number[] = [];
  for (let t = 16; t <= 3000; t += 16) {
    await page.clock.runFor(16);
    const s = await page.evaluate((i) => {
      const w = window as unknown as { __sceneControllers: Map<string, { headScreen: (i: number) => [number, number] }>; __lanefield: { camera: { pitchDeg: number } } };
      const head = w.__sceneControllers.get('sidequests')?.headScreen(i) ?? [0, 0];
      const ro = (document.querySelector('.jp-readout') as HTMLElement).getBoundingClientRect();
      const pressed = document.querySelectorAll('[data-twin]')[i]?.getAttribute('aria-pressed');
      return { head, roBottom: ro.bottom, pressed, pitch: w.__lanefield.camera.pitchDeg };
    }, trail);
    pitches.push(s.pitch);
    if (firstInBand < 0 && s.head[1] > s.roBottom && s.head[1] < keymapTop && s.head[0] >= 0 && s.head[0] <= 390) firstInBand = t;
    if (claimAt < 0 && s.pressed === 'true') claimAt = t;
  }
  expect(claimAt).toBeGreaterThan(0);
  expect(firstInBand).toBeGreaterThan(0);
  expect(firstInBand).toBeLessThanOrEqual(claimAt);
  expect(Math.max(...pitches) - Math.min(...pitches)).toBeLessThan(0.01);
  await ctx.close();
});
}

test('T-GLITTER-1: hold glitters under the pointer, release re-forms, a tap keeps its meaning', async ({ browser }) => {
  const { ctx, page } = await open(browser, '/leaflink?seed=42');
  await page.mouse.move(70, 250);
  await page.mouse.down();
  await page.clock.runFor(400);
  expect((await sample(page)).glitter.target).toBe(0);
  await page.clock.runFor(200);
  const on = await run(page, 320);
  expect(on[on.length - 1].glitter.target).toBe(1);
  const last = on[on.length - 1];
  expect(dist(last.ringPx as [number, number], [70, 250])).toBeLessThanOrEqual(2);
  await page.mouse.up();
  const off = await run(page, 1500);
  expect(off[off.length - 1].glitter.value).toBe(0);
  expect(off[off.length - 1].ringS).toBe(0);
  // A short tap on the map still drops a visitor offer and never glitters.
  await page.mouse.move(70, 250);
  await page.mouse.down();
  await page.clock.runFor(120);
  await page.mouse.up();
  const after = await run(page, 400);
  expect(after.every((r) => r.glitter.target === 0)).toBe(true);
  const visitor = await page.evaluate(() => {
    const w = window as unknown as { __sceneControllers: Map<string, { snapshotPins: () => Array<{ visitor: boolean }> }> };
    return (w.__sceneControllers.get('leaflink')?.snapshotPins() ?? []).some((p) => p.visitor);
  });
  expect(visitor).toBe(true);
  await ctx.close();
});

test('T-ENT-REPLAY: same seed replays the morph exactly, another seed varies it', async ({ browser }) => {
  // Three full loads under SwiftShader: sampled every third 16ms frame
  // (the clock still advances in 16ms steps, so frames are identical).
  test.setTimeout(1800000);
  async function script(seed: number): Promise<number[]> {
    const { ctx, page } = await open(browser, `/?seed=${seed}`);
    const trace: number[] = [];
    for (const key of ['2', '3']) {
      await page.keyboard.press(key);
      for (let t = 16; t <= 720; t += 16) {
        await page.clock.runFor(16);
        if ((t / 16) % 3 !== 0) continue;
        const r = await sample(page);
        trace.push(r.bow ?? 0, r.swirl ?? 0, r.ringS, r.pan[0], r.pan[1]);
      }
    }
    await ctx.close();
    return trace;
  }
  const a = await script(1234);
  const b = await script(1234);
  const c = await script(98765);
  // Same seed: equal to 1e-9. The entropy draws (bow, swirl) match
  // bit for bit; ring strength can differ in the last float digits
  // because the absolute page time at the first key press depends on
  // how long the layout worker took (wall time), and the engine's
  // (t - start) arithmetic rounds differently on a different base.
  expect(a.length).toBe(b.length);
  let worst = 0;
  for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
  expect(worst).toBeLessThan(1e-9);
  // Different seed: the morph differs by far more than that.
  let spread = 0;
  for (let i = 0; i < a.length; i++) spread = Math.max(spread, Math.abs(a[i] - c[i]));
  expect(spread).toBeGreaterThan(1e-3);
});

test('T-REDUCED-POLISH: reduced motion has no loom, no ring, no pan, no glitter', async ({ browser }) => {
  const { ctx, page } = await open(browser, '/?seed=42', { reduced: true });
  await page.keyboard.press('3');
  const rows = await run(page, 800);
  for (const r of rows) {
    expect(r.ringS).toBe(0);
    expect(r.pan).toEqual([0, 0]);
  }
  const shown = rows.filter((r) => r.heroO !== null && r.heroC !== null);
  expect(shown.length).toBeGreaterThan(0);
  for (const r of shown) expect(r.heroO).toBe(1);
  await page.mouse.move(70, 250);
  await page.mouse.down();
  await page.clock.runFor(800);
  expect((await sample(page)).glitter.target).toBe(0);
  await page.mouse.up();
  await ctx.close();
});
