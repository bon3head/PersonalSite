// T-S03-1 to T-S03-8 (S03 section 9) against the B0 stub engine.
// The app under test is the Vite dev server plus a harness injected via
// page.evaluate: the harness replaces #root with the S04 page structure,
// wires src/router.ts + src/travel.ts against src/world/stub.ts, and
// exposes window.__b3test. App.tsx is untouched (B4 owns it); the
// harness is the wave-1 stand-in for the real chrome.
//
// Keyboard: the harness routes keys through the REAL
// buildTravelHotkeyEntries from src/router.ts, using a native matcher
// with useHotkeys semantics (first match wins, skip disabled, skip
// inputs). The React TravelHotkeys wrapper is three lines around the
// same entries; B4 mounts it in App in wave 2.
import { expect, test, type Page } from '@playwright/test';

const DEV = 'http://localhost:5173';

const H1: Record<string, string> = {
  server: 'Justin Poli',
  leaflink: 'LeafLink',
  sidequests: 'SideQuests',
  notfound: 'Nothing at this address.',
};
const REGIME: Record<string, string> = {
  server: 'void',
  leaflink: 'paper',
  sidequests: 'field',
  notfound: 'void',
};
const TITLE: Record<string, string> = {
  server: 'Justin Poli',
  leaflink: 'LeafLink, Justin Poli',
  sidequests: 'SideQuests, Justin Poli',
  notfound: 'Not found, Justin Poli',
};
// Stub LAYOUT_ORDER: server, leaflink, sidequests, scatter.
const WEIGHT_INDEX: Record<string, number> = {
  server: 0,
  leaflink: 1,
  sidequests: 2,
  notfound: 3,
};

async function setupHarness(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const routerMod = await import('/src/router.ts');
    const travelMod = await import('/src/travel.ts');
    const stubMod = await import('/src/world/stub.ts');
    const { T } = await import('/src/tokens.generated.ts');

    // Block main.tsx's idle world start from racing us: it no-ops
    // without #world, and the stub ignores its mount argument anyway.
    document.getElementById('world')?.remove();

    const initialScene = routerMod.parsePath(window.location.pathname);
    const initialSheet = routerMod.parseHash(window.location.hash);

    const root = document.getElementById('root');
    if (!root) throw new Error('no #root');
    root.innerHTML =
      `<a class="jp-wordmark" href="/" data-route>Justin Poli</a>` +
      `<main id="scene" aria-busy="false">` +
      `<section class="jp-readout jp-readout--${initialScene}" aria-labelledby="h-${initialScene}">` +
      `<h1 id="h-${initialScene}" tabindex="-1">${routerMod.SCENE_H1[initialScene]}</h1>` +
      `</section></main>` +
      `<nav class="jp-keymap" aria-label="Scenes and panels">` +
      `<a href="/" data-route data-scene="server">Server</a>` +
      `<a href="/leaflink" data-route data-scene="leaflink">LeafLink</a>` +
      `<a href="/sidequests" data-route data-scene="sidequests">SideQuests</a>` +
      `</nav>` +
      `<div class="jp-live" aria-live="polite" aria-atomic="true"></div>`;
    const style = document.createElement('style');
    style.textContent =
      `.jp-keymap a { color: rgb(230, 232, 234); }` +
      `.jp-keymap a[aria-current="page"] { color: rgb(123, 181, 248); }` +
      `.jp-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }`;
    document.head.appendChild(style);

    // The stub draws nothing; it is the weights/pose source of truth.
    const mount = document.createElement('div');
    const lanefield = stubMod.createLanefield(mount, {
      seed: T.world.seed,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches,
      initial: routerMod.SCENE_LAYOUT[initialScene],
    });
    if (!lanefield) throw new Error('stub returned null');

    const getReadout = () =>
      document.querySelector<HTMLElement>('.jp-readout');
    const getLive = () =>
      document.querySelector<HTMLElement>('.jp-live');
    const getBusy = () => document.querySelector<HTMLElement>('#scene');
    const getKeymap = () =>
      document.querySelector<HTMLElement>('.jp-keymap');
    const getKeymapItem = (scene: string) =>
      document.querySelector<HTMLElement>(
        `.jp-keymap [data-scene="${scene}"]`,
      );

    const travel = travelMod.createTravelController(initialScene, {
      lanefield,
      dom: {
        readout: getReadout,
        announce: getLive,
        busy: getBusy,
        keymap: getKeymap,
        keymapItem: getKeymapItem,
      },
      isReducedMotion: () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      onSwap: (scene: string) => {
        const section = getReadout();
        if (!section) return;
        section.className = `jp-readout jp-readout--${scene}`;
        section.setAttribute('aria-labelledby', `h-${scene}`);
        const h1 = section.querySelector('h1');
        if (h1) {
          h1.id = `h-${scene}`;
          h1.textContent = routerMod.SCENE_H1[scene as never];
        }
      },
    });

    let sheet: routerMod.SheetId = initialSheet;
    const router = routerMod.createRouter(
      { scene: initialScene, sheet },
      {
        onSceneChange: (scene: string) => {
          void travel.travelTo(scene as never);
        },
        onSheetChange: (next: routerMod.SheetId) => {
          sheet = next;
        },
      },
    );
    // Native matcher over the real entries, with useHotkeys semantics:
    // first match wins, disabled entries skipped, inputs skipped.
    const ARROWS: Record<string, string> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    window.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const entries = routerMod.buildTravelHotkeyEntries({
        go: (s: string) => router.go(s as never),
        step: (dir: 1 | -1) => {
          router.go(routerMod.stepScene(router.state.scene, dir));
        },
        toggleSheet: (next: 'whoami' | 'contact') => {
          router.setSheet(router.state.sheet === next ? null : next);
        },
        sheet: router.state.sheet,
      });
      const keyName = ARROWS[event.key] ?? event.key.toLowerCase();
      for (const entry of entries) {
        if (entry.isDisabled) continue;
        if (entry.keys.toLowerCase() === keyName) {
          entry.onPress(event);
          break;
        }
      }
    });

    // Regime + title for the initial scene (no intro travel on load).
    travelMod.applyRegime(initialScene as never);
    const keymap = getKeymap();
    if (keymap && initialScene !== 'notfound') {
      getKeymapItem(initialScene)?.setAttribute('aria-current', 'page');
    }

    (window as unknown as Record<string, unknown>).__b3test = {
      router,
      travel,
    };
  });
}

async function h1Text(page: Page): Promise<string | null> {
  return page.evaluate(
    () => document.querySelector('main#scene h1')?.textContent ?? null,
  );
}

async function weights(page: Page): Promise<number[]> {
  return page.evaluate(() => window.__lanefield?.weights() ?? []);
}

test('T-S03-1: no reload across 20 random go calls', async ({ page }) => {
  // K-S03-1 intent: no route change causes a document load. The spec's
  // parenthetical suggests page.on('framenavigated'), but Playwright
  // 1.64 fires framenavigated for history.pushState too (verified: a
  // bare pushState emits it), so that detector false-fails correct
  // code. The correct detectors are 'load' events (document loads
  // only) and a window marker surviving (a reload wipes JS state).
  // Flagged in BUILD-STATE for a coordinator spec fix to K-S03-1.
  const loads: string[] = [];
  page.on('load', () => loads.push(page.url()));
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__b3marker = true;
  });
  const loadsAfterSetup = loads.length;
  await page.evaluate(() => {
    const t = (window as unknown as Record<string, any>).__b3test;
    const scenes = ['server', 'leaflink', 'sidequests', 'notfound'];
    let seed = 12345;
    for (let i = 0; i < 20; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      t.router.go(scenes[seed % scenes.length]);
    }
  });
  await page.waitForTimeout(900);
  expect(loads.length).toBe(loadsAfterSetup);
  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__b3marker,
    ),
  ).toBe(true);
});

test('T-S03-2: deep links render the right scene', async ({ page }) => {
  const cases: Array<[string, string]> = [
    ['/', 'server'],
    ['/leaflink', 'leaflink'],
    ['/sidequests', 'sidequests'],
    ['/definitely-not-a-route', 'notfound'],
  ];
  for (const [path, scene] of cases) {
    await page.goto(`${DEV}${path}`);
    await setupHarness(page);
    expect(await h1Text(page)).toBe(H1[scene]);
    expect(
      await page.evaluate(() => document.documentElement.dataset.regime),
    ).toBe(REGIME[scene]);
    const w = await weights(page);
    expect(w[WEIGHT_INDEX[scene]]).toBe(1);
    expect(w.reduce((a, b) => a + b, 0)).toBe(1);
    expect(await page.title()).toBe(TITLE[scene]);
  }
});

test('T-S03-3: history back and forward stay in sync', async ({
  page,
}) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  await page.keyboard.press('2');
  await page.waitForFunction(
    () => document.querySelector('main#scene h1')?.textContent === 'LeafLink',
  );
  await page.keyboard.press('3');
  await page.waitForFunction(
    () =>
      document.querySelector('main#scene h1')?.textContent === 'SideQuests',
  );
  await page.goBack();
  await page.waitForFunction(
    () => document.querySelector('main#scene h1')?.textContent === 'LeafLink',
  );
  expect(page.url()).toBe(`${DEV}/leaflink`);
  await page.goBack();
  await page.waitForFunction(
    () =>
      document.querySelector('main#scene h1')?.textContent === 'Justin Poli',
  );
  expect(page.url()).toBe(`${DEV}/`);
  expect(await h1Text(page)).toBe('Justin Poli');
  await page.goForward();
  await page.waitForFunction(
    () => document.querySelector('main#scene h1')?.textContent === 'LeafLink',
  );
  expect(page.url()).toBe(`${DEV}/leaflink`);
});

test('T-S03-4: travel is interruptible', async ({ page }) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  await page.keyboard.press('2');
  await page.waitForTimeout(200);
  const t1 = await page.evaluate(() => performance.now());
  await page.keyboard.press('3');
  await page.waitForFunction(
    () =>
      document.querySelector('main#scene h1')?.textContent === 'SideQuests' &&
      (window.__lanefield?.weights() ?? []).reduce((a, b) => a + b, 0) ===
        1 &&
      (window.__lanefield?.weights() ?? [])[2] === 1,
    undefined,
    { timeout: 900 },
  );
  const t2 = await page.evaluate(() => performance.now());
  expect(t2 - t1).toBeLessThanOrEqual(900);
  expect(await weights(page)).toEqual([0, 0, 1, 0]);
});

test('T-S03-5: clean console on every route (dev harness)', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  for (const path of ['/', '/leaflink', '/sidequests', '/nope']) {
    await page.goto(`${DEV}${path}`);
    await setupHarness(page);
    await page.waitForTimeout(300);
  }
  expect(errors).toEqual([]);
});

test('T-S03-6: DOM feedback under 250ms', async ({ page }) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  const ms = await page.evaluate(async () => {
    const item = document.querySelector<HTMLElement>(
      '.jp-keymap [data-scene="leaflink"]',
    );
    if (!item) throw new Error('no leaflink keymap item');
    const before = getComputedStyle(item).color;
    let t0 = 0;
    let done: (v: number) => void;
    const result = new Promise<number>((r) => {
      done = r;
    });
    window.addEventListener(
      'keydown',
      () => {
        t0 = performance.now();
      },
      { capture: true, once: true },
    );
    const tick = (): void => {
      const colorChanged = getComputedStyle(item).color !== before;
      const weightsMoved =
        (window.__lanefield?.weights() ?? [])[1] === 1;
      if (colorChanged && weightsMoved) {
        done(performance.now() - t0);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '2', bubbles: true }),
    );
    return result;
  });
  expect(ms).toBeLessThan(250);
});

test('T-S03-7: focus moves to the new H1 and the region announces', async ({
  page,
}) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  await page.evaluate(() => {
    document
      .querySelector<HTMLElement>('.jp-keymap [data-scene="server"]')
      ?.focus();
  });
  await page.keyboard.press('2');
  await page.waitForTimeout(800);
  const active = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? { tag: el.tagName, text: el.textContent } : null;
  });
  expect(active?.tag).toBe('H1');
  expect(active?.text).toBe('LeafLink');
  expect(
    await page.evaluate(
      () => document.querySelector('.jp-live')?.textContent,
    ),
  ).toBe('LeafLink');
});

test('T-S03-8: reduced-motion travel completes within 320ms', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  // Measure in-page: t0 is the keydown itself (capture listener), not
  // the test-side press call, so Playwright dispatch latency is not
  // charged against the 320ms budget.
  const ms = await page.evaluate(async () => {
    let t0 = 0;
    let done: (v: number) => void;
    const result = new Promise<number>((r) => {
      done = r;
    });
    window.addEventListener(
      'keydown',
      () => {
        t0 = performance.now();
      },
      { capture: true, once: true },
    );
    const tick = (): void => {
      const readout = document.querySelector<HTMLElement>('.jp-readout');
      const opaque =
        readout !== null && getComputedStyle(readout).opacity === '1';
      const weightsHot = (window.__lanefield?.weights() ?? [])[1] === 1;
      if (opaque && weightsHot) {
        done(performance.now() - t0);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '2', bubbles: true }),
    );
    return result;
  });
  expect(ms).toBeLessThanOrEqual(320);
  const w = await weights(page);
  expect(w).toEqual([0, 1, 0, 0]);
});

test('router: path normalization, hash, arrows, sheet replaceState', async ({
  page,
}) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  const results = await page.evaluate(() => {
    const out: Record<string, unknown> = {};
    return import('/src/router.ts').then((m) => {
      out.trailing = m.parsePath('/leaflink/');
      out.upper = m.parsePath('/LEAFLINK');
      out.unknown = m.parsePath('/zzz');
      out.hashWhoami = m.parseHash('#whoami');
      out.hashContact = m.parseHash('#contact');
      out.hashOther = m.parseHash('#nope');
      out.wrapRight = m.stepScene('sidequests', 1);
      out.wrapLeft = m.stepScene('server', -1);
      out.from404Right = m.stepScene('notfound', 1);
      out.from404Left = m.stepScene('notfound', -1);
      const t = (window as unknown as Record<string, any>).__b3test;
      const lenBefore = window.history.length;
      t.router.setSheet('whoami');
      out.sheetUrl = window.location.hash;
      out.sheetLenSame = window.history.length === lenBefore;
      t.router.setSheet(null);
      out.sheetCleared = window.location.hash === '';
      return out;
    });
  });
  expect(results).toEqual({
    trailing: 'leaflink',
    upper: 'leaflink',
    unknown: 'notfound',
    hashWhoami: 'whoami',
    hashContact: 'contact',
    hashOther: null,
    wrapRight: 'server',
    wrapLeft: 'sidequests',
    from404Right: 'server',
    from404Left: 'sidequests',
    sheetUrl: '#whoami',
    sheetLenSame: true,
    sheetCleared: true,
  });
});

test('router: sheet open disables scene keys but not the sheet key', async ({
  page,
}) => {
  await page.goto(`${DEV}/`);
  await setupHarness(page);
  await page.evaluate(() => {
    const t = (window as unknown as Record<string, any>).__b3test;
    t.router.setSheet('whoami');
  });
  await page.keyboard.press('2');
  await page.waitForTimeout(300);
  expect(await h1Text(page)).toBe('Justin Poli');
  await page.keyboard.press('w');
  await page.waitForTimeout(100);
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toBe('');
});
