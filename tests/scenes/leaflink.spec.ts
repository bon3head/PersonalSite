// LeafLink scene tests (S06 section 9). T-LL-1 to T-LL-7.
// Real-engine tests build their own lanefield (separate from App's)
// so App's canvas and hotkeys never interfere with taps or weights.
import { test, expect, type Page } from '@playwright/test';

const DEV = 'http://localhost:5173';

// The dev server is shared with sibling workers; when the run that
// started it exits, it kills the server and every connected page's
// vite client reloads on reconnect, wiping test state. Close the HMR
// socket so a test page never reloads mid-test. Call before goto.
async function blockHmr(page: Page): Promise<void> {
  await page.routeWebSocket(
    (url) => url.hostname === 'localhost',
    (ws) => ws.close(),
  );
}

// Contrast ratio (WCAG relative luminance), for T-LL-5.
function luminance(rgb: [number, number, number]): number {
  const f = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
function contrast(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(s: string): [number, number, number] {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`unparsed color ${s}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

test('T-LL-1: exactly 6144 lanes, connected graph', async ({ page }) => {
  await blockHmr(page);
  await page.goto(`${DEV}/?world=0`);
  const res = await page.evaluate(async () => {
    const layout = await import('/src/world/layouts/leaflink.ts');
    const { T } = await import('/src/tokens.generated.ts');
    const out = new Float32Array(
      T.world.laneCount * T.world.pointsPerLane * T.world.layouts.length * 4,
    );
    const side = layout.generate(T.world.seed, out, 1);
    // Lane total from edge lane counts.
    let total = 0;
    for (const e of side.edges) total += e.laneCount;
    // Connectivity via union-find over edges.
    const n = side.nodes.length / 2;
    const parent = new Int32Array(n);
    for (let i = 0; i < n; i++) parent[i] = i;
    const find = (v: number): number => {
      let r = v;
      while (parent[r] !== r) r = parent[r];
      while (parent[v] !== r) {
        const nx = parent[v];
        parent[v] = r;
        v = nx;
      }
      return r;
    };
    for (const e of side.edges) {
      const ra = find(e.a);
      const rb = find(e.b);
      if (ra !== rb) parent[ra] = rb;
    }
    const root = find(0);
    let connected = 0;
    for (let v = 0; v < n; v++) if (find(v) === root) connected++;
    return { total, nodes: n, connected, edges: side.edges.length };
  });
  expect(res.total).toBe(6144);
  expect(res.connected).toBe(res.nodes);
  expect(res.nodes).toBe(1089);
});

test('T-LL-2: deterministic first minute (first 20 events identical)', async ({
  page,
}) => {
  await blockHmr(page);
  await page.goto(`${DEV}/?world=0`);
  const runs = await page.evaluate(async () => {
    const ctrl = await import('/src/world/leaflink.ts');
    const { T } = await import('/src/tokens.generated.ts');
    const run = (): Array<{ kind: string; node: number; time: number }> => {
      let mockTime = 100;
      const calls: Array<{ kind: number }> = [];
      const mock = {
        now: () => mockTime,
        setActivity: () => {
          calls.push({ kind: 1 });
        },
        clearActivity: () => {},
        onFrame: () => () => {},
        scene: { add: () => {}, remove: () => {} },
        screenToGround: () => null,
        worldToScreen: () => [0, 0],
      };
      const c = ctrl.createLeaflinkController(mock as never, {
        seed: T.world.seed,
      });
      const events: Array<{ kind: string; node: number; time: number }> = [];
      for (let step = 0; step < 400 && events.length < 20; step++) {
        mockTime += 0.1;
        c.processDue();
        const fresh = c.snapshotEvents();
        if (fresh.length > events.length) {
          events.push(...fresh.slice(events.length));
        }
      }
      const out = events.slice(0, 20);
      c.dispose();
      return out;
    };
    const a = run();
    const b = run();
    return { a, b };
  });
  expect(runs.a.length).toBe(20);
  expect(runs.b).toEqual(runs.a);
  // K-LL-4: intervals are not periodic (no two consecutive equal).
  const times = runs.a.map((e) => e.time);
  for (let i = 2; i < times.length; i++) {
    expect(times[i] - times[i - 1]).not.toBe(times[i - 1] - times[i - 2]);
  }
});

// Build a real lanefield + controller on the test page, travelling to
// leaflink. Returns a handle for activity records and pin snapshots.
// With noAppWorld, the page is expected at ?world=0 so App's idle
// world start returns null; this setup then drops the query (so its
// own createLanefield succeeds) after a tick for App's idle callback
// to have fired. One WebGL context instead of two: two concurrent
// SwiftShader contexts plus a React render OOM-closes the page.
async function realSetup(
  page: Page,
  opts?: { noAppWorld?: boolean },
): Promise<void> {
  await page.evaluate(async (noAppWorld) => {
    if (noAppWorld) {
      await new Promise((r) => setTimeout(r, 500));
      history.replaceState(null, '', '/');
    }
    const lane = await import('/src/world/lanefield.ts');
    const ctrl = await import('/src/world/leaflink.ts');
    const { T } = await import('/src/tokens.generated.ts');
    const mount = document.createElement('div');
    mount.id = 'll-test-mount';
    document.body.appendChild(mount);
    const field = lane.createLanefield(mount, {
      seed: T.world.seed,
      reducedMotion: false,
      initial: 'leaflink',
    });
    if (!field) throw new Error('no WebGL2');
    await field.ready;
    const activity: Array<{ kind: number; at: number }> = [];
    const orig = field.setActivity.bind(field);
    (field as unknown as Record<string, unknown>).setActivity = (
      lanes: Int32Array,
      start: Float32Array,
      fade: Float32Array,
      kind: 1 | 2,
      u: Float32Array,
    ): void => {
      activity.push({ kind, at: performance.now() });
      orig(lanes, start, fade, kind, u);
    };
    const canvas = mount.querySelector('canvas') as HTMLCanvasElement;
    const c = ctrl.createLeaflinkController(field, { target: canvas });
    (window as unknown as Record<string, unknown>).__lltest = {
      field,
      controller: c,
      activity,
      canvas,
    };
  }, opts?.noAppWorld ?? false);
}

async function disposeReal(page: Page): Promise<void> {
  await page.evaluate(() => {
    const t = (window as unknown as Record<string, unknown>).__lltest as
      | {
          controller: { dispose: () => void };
          field: { dispose: () => void };
        }
      | undefined;
    t?.controller.dispose();
    t?.field.dispose();
    document.getElementById('ll-test-mount')?.remove();
  });
}

// Render the LeafLink readout's OfferButton into a host above App's
// fullscreen canvas. Self-contained for page.evaluate (no Node closures).
async function renderOfferButton(): Promise<void> {
  // Retry dynamic imports: the dev server can restart between
  // Playwright runs and a cold import can race its warmup.
  const retryImport = async <T>(spec: string): Promise<T> => {
    let last: unknown = null;
    for (let i = 0; i < 5; i++) {
      try {
        return (await import(spec)) as T;
      } catch (err) {
        last = err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw last;
  };
  const render = await retryImport<{
    renderInto: (
      host: HTMLElement,
      comp: unknown,
      onOffer: () => void,
    ) => void;
  }>('/src/scenes/test-render.ts');
  const scenes = await retryImport<{ default: unknown }>(
    '/src/scenes/leaflink.tsx',
  );
  const t = (window as unknown as Record<string, unknown>).__lltest as {
    controller: { dropOfferAtCenter: () => void };
  };
  const host = document.createElement('div');
  host.id = 'll-offer-host';
  // Above App's fullscreen canvas (fixed, z-index 0) or the button
  // is covered and never visible to the locator.
  host.style.position = 'relative';
  host.style.zIndex = '10';
  document.body.appendChild(host);
  render.renderInto(host, scenes.default, () =>
    t.controller.dropOfferAtCenter(),
  );
}

test('T-LL-3: tap responds within 300ms', async ({ page }) => {
  test.setTimeout(180000);
  await blockHmr(page);
  await page.goto(DEV);
  await realSetup(page);
  const tapAt = Date.now();
  const box = await page.evaluate(() => {
    const c = (
      window as unknown as Record<string, Record<string, HTMLCanvasElement>>
    ).__lltest.canvas;
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  const found = await page.evaluate(async (tapAt) => {
    const t = (window as unknown as Record<string, unknown>).__lltest as {
      activity: Array<{ kind: number; at: number }>;
      controller: {
        snapshotPins: () => Array<{ visitor: boolean }>;
      };
    };
    const deadline = tapAt + 300;
    for (;;) {
      const hasRoute = t.activity.some((a) => a.kind === 1);
      const hasVisitor = t.controller
        .snapshotPins()
        .some((p) => p.visitor);
      if (hasRoute && hasVisitor) return true;
      if (Date.now() > deadline) return false;
      await new Promise((r) => setTimeout(r, 10));
    }
  }, tapAt);
  expect(found).toBe(true);
  await disposeReal(page);
});

test('T-LL-4: keyboard path (OfferButton Enter)', async ({ page }) => {
  // 300s harness budget: under sibling load a setup retry (full
  // realSetup ~60s each) plus the 60s button wait can exceed 180s.
  // The 300ms response gate below is unchanged.
  test.setTimeout(300000);
  // Setup retry: under concurrent sibling Playwright load the vite
  // server can restart mid-test and the page reloads, destroying the
  // context between realSetup and the render. Retry the whole setup
  // on context-destroyed errors only; the 300ms gate below is untouched.
  let setupDone = false;
  for (let attempt = 0; attempt < 3 && !setupDone; attempt++) {
    try {
      await blockHmr(page);
      await page.goto(`${DEV}/?world=0`);
      await realSetup(page, { noAppWorld: true });
      await page.evaluate(renderOfferButton);
      setupDone = true;
    } catch (err) {
      const msg = String(err);
      if (
        /Execution context was destroyed|Target page.*closed|navigation/.test(
          msg,
        )
      ) {
        try {
          await disposeReal(page);
        } catch {
          /* page gone; next attempt re-gotos */
        }
        continue;
      }
      throw err;
    }
  }
  if (!setupDone) throw new Error('T-LL-4 setup failed after 3 attempts');
  const button = page.locator('#ll-offer-host button');
  // Generous wait: sibling workers run SwiftShader Playwright suites
  // concurrently, and a React commit can stall under that load. The
  // 300ms response gate below is unchanged.
  await button.waitFor({ timeout: 60000 });
  const tapAt = Date.now();
  await button.focus();
  await page.keyboard.press('Enter');
  const found = await page.evaluate(async (tapAt) => {
    const t = (window as unknown as Record<string, unknown>).__lltest as {
      activity: Array<{ kind: number; at: number }>;
      controller: {
        snapshotPins: () => Array<{ visitor: boolean }>;
      };
    };
    const deadline = tapAt + 300;
    for (;;) {
      const hasRoute = t.activity.some((a) => a.kind === 1);
      const hasVisitor = t.controller
        .snapshotPins()
        .some((p) => p.visitor);
      if (hasRoute && hasVisitor) return true;
      if (Date.now() > deadline) return false;
      await new Promise((r) => setTimeout(r, 10));
    }
  }, tapAt);
  expect(found).toBe(true);
  await disposeReal(page);
});

test('T-LL-5: legend slip contrast', async ({ page }) => {
  test.setTimeout(120000);
  await blockHmr(page);
  await page.goto(DEV);
  await page.evaluate(async () => {
    // Paper regime so the paper tokens apply to the slip.
    document.documentElement.dataset.regime = 'paper';
    const render = await import('/src/scenes/test-render.ts');
    const scenes = await import('/src/scenes/leaflink.tsx');
    const { T } = await import('/src/tokens.generated.ts');
    const host = document.createElement('section');
    host.className = 'jp-readout jp-readout--leaflink';
    host.id = 'll-slip-host';
    document.body.appendChild(host);
    render.renderInto(host, scenes.default, () => {});
    (window as unknown as Record<string, unknown>).__lltokens = T.color.paper;
  });
  await page.locator('#ll-slip-host h1').waitFor({ timeout: 10000 });
  const res = await page.evaluate(() => {
    const host = document.getElementById('ll-slip-host') as HTMLElement;
    const slip = host.querySelector('.jp-readout-slip') as HTMLElement;
    const bg = getComputedStyle(slip).backgroundColor;
    const tokens = (window as unknown as Record<string, Record<string, string>>)
      .__lltokens;
    return { bg, tokens };
  });
  // Rendered slip background is the paper.raised token.
  expect(parseRgb(res.bg)).toEqual(parseHex(res.tokens.raised));
  // Receipt pairs: paper.text and paper.text2 on paper.raised.
  expect(
    contrast(parseHex(res.tokens.text), parseHex(res.tokens.raised)),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrast(parseHex(res.tokens.text2), parseHex(res.tokens.raised)),
  ).toBeGreaterThanOrEqual(4.5);
});

test('T-LL-6: no labels in scene', async ({ page }) => {
  test.setTimeout(180000);
  await blockHmr(page);
  await page.goto(DEV);
  await realSetup(page);
  // Field starts one-hot leaflink (lanefield oneHot(current) at init),
  // so the uW.y > 0.99 condition holds from ready. Traverse MY field's
  // scene (not App's): no object may carry a text string.
  const hasText = await page.evaluate(() => {
    const t = (window as unknown as Record<string, unknown>).__lltest as {
      field: {
        scene: { traverse: (cb: (o: unknown) => void) => void };
      };
    };
    let found = false;
    t.field.scene.traverse((o) => {
      const obj = o as Record<string, unknown>;
      if (typeof obj.text === 'string' && (obj.text as string).length > 0) {
        found = true;
      }
    });
    return found;
  });
  expect(hasText).toBe(false);
  await disposeReal(page);
});

test('T-LL-7: hue budget under 10 percent after 30s', async ({ page }) => {
  test.setTimeout(420000);
  await blockHmr(page);
  await page.goto(`${DEV}/?world=0`);
  await realSetup(page, { noAppWorld: true });
  // Let the heartbeat run a full 30s of simulation.
  await page.waitForTimeout(30000);
  const png = await page.screenshot();
  const frac = await page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(bmp, 0, 0);
    const data = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    // sRGB -> linear -> OKLab, chroma = sqrt(a^2 + b^2).
    const toLin = (c: number): number => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    let over = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = toLin(data[i]);
      const g = toLin(data[i + 1]);
      const b = toLin(data[i + 2]);
      const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
      const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
      const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
      const l3 = Math.cbrt(l);
      const m3 = Math.cbrt(m);
      const s3 = Math.cbrt(s);
      const a = l3 * 1.9779984951 - m3 * 2.428592205 + s3 * 0.4505937099;
      const bb = l3 * 0.0259040371 + m3 * 0.7827717662 - s3 * 0.808675766;
      const chroma = Math.sqrt(a * a + bb * bb);
      total++;
      if (chroma > 0.04) over++;
    }
    return over / total;
  }, png.toString('base64'));
  console.log('T-LL-7 hue fraction (chroma > 0.04):', frac);
  expect(frac).toBeLessThan(0.1);
  await disposeReal(page);
});
