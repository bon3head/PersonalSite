// Repro for polish items 1 and 2: deterministic frame trace of a route
// morph on a phone viewport, driven by Playwright's fake clock so every
// sample is at a known travel time. Records readout state, hero rect and
// opacity, the morph ring center projected to screen, ring strength,
// silhouette mask state, and camera pitch.
const { chromium } = require('playwright');

const [, , fromPath = '/', key = '2', label = 'server-to-leaflink', vw = '390', vh = '844'] = process.argv;

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const ctx = await browser.newContext({
    viewport: { width: +vw, height: +vh },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  if (process.env.REDUCED === '1') await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.clock.install({ time: new Date('2026-11-02T12:00:00Z') });
  await page.goto(`http://127.0.0.1:5173${fromPath}`);
  // Pause so runFor is the only clock (install alone keeps flowing).
  await page.clock.pauseAt(new Date('2026-11-02T12:01:00Z'));
  // Advance until the world is ready and has rendered.
  let ready = false;
  for (let i = 0; i < 400 && !ready; i++) {
    await page.clock.runFor(50);
    ready = await page.evaluate(() => Boolean(window.__lanefield && window.__lanefield.ready && window.__lanefieldReady));
  }
  if (!ready) {
    console.log(JSON.stringify({ label, error: 'world not ready', errors }));
    await browser.close();
    return;
  }
  // Settle 2s at rest so the starting route is in its resting state.
  for (let i = 0; i < 40; i++) await page.clock.runFor(50);

  const sample = () =>
    page.evaluate(() => {
      const field = window.__lanefieldReady;
      const m = window.__morph && window.__morph.sample;
      const ro = document.querySelector('.jp-readout');
      const r = ro ? ro.getBoundingClientRect() : null;
      const hero = document.querySelector('[data-brand-mark]');
      const hr = hero ? hero.getBoundingClientRect() : null;
      const hs = hero ? getComputedStyle(hero) : null;
      const params = field ? field.getParams() : null;
      let ringPx = null;
      if (field && params && params.ringStrength > 0) {
        ringPx = field.worldToScreen([params.ringCenter[0], 0, params.ringCenter[1]]).map((v) => Math.round(v));
      }
      const cam = window.__lanefield.camera; const twins = [...document.querySelectorAll('button[aria-pressed]')].map((b) => { const q = b.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top)]; });
      const sil = window.__lanefield.silhouette ? window.__lanefield.silhouette() : null;
      return {
        p: m ? +m.p.toFixed(3) : null,
        readout: ro
          ? {
              hidden: ro.hidden,
              opacity: getComputedStyle(ro).opacity,
              rect: r && r.height > 0 ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null,
              h1: (ro.querySelector('h1') || {}).textContent || null,
            }
          : null,
        hero: hero
          ? {
              rect: hr && hr.width > 0 ? [Math.round(hr.left), Math.round(hr.top), Math.round(hr.right), Math.round(hr.bottom)] : null,
              visibility: hs.visibility,
              opacity: hs.opacity,
              center: hr && hr.width > 0 ? [Math.round(hr.left + hr.width / 2), Math.round(hr.top + hr.height / 2)] : null,
            }
          : null,
        ring: params ? { strength: +params.ringStrength.toFixed(3), radius: +params.ringRadius.toFixed(2), center: params.ringCenter.map((v) => +v.toFixed(2)), px: ringPx } : null,
        silhouette: sil ? { kind: sil.kind, loaded: sil.loaded, strength: params ? +params.silhouetteStrength.toFixed(3) : null } : null,
        twins, cam: { pitch: +cam.pitchDeg.toFixed(2), pos: cam.pos.map((v) => +v.toFixed(2)) },
      };
    });

  const rows = [];
  const t0 = Date.now();
  rows.push({ tMs: 0, ...(await sample()) });
  await page.keyboard.press(key);
  // Sample every 16ms for 1600ms: covers the 700ms morph, the readout
  // entrance, and the 1500ms hero settle timer.
  for (let tMs = 16; tMs <= (+process.env.DUR || 1600); tMs += 16) {
    await page.clock.runFor(16);
    rows.push({ tMs, ...(await sample()) });
  }
  console.log(JSON.stringify({ label, viewport: [+vw, +vh], errors, rows }));
  await browser.close();
})().catch((e) => {
  console.log(JSON.stringify({ label, fatal: String(e && e.stack || e) }));
  process.exit(1);
});
