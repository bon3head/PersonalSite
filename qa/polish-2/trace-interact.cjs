// Interaction trace (polish items 3 and 6): on a phone viewport, run
// one page verb and sample the stage grammar every 16ms with the fake
// clock: subject position on screen vs the hero center, camera pan,
// hero opacity, ring strength and center, camera pitch.
const { chromium } = require('playwright');
const [, , path = '/sidequests', action = 'trail0', vw = '390', vh = '658', dur = '2600'] = process.argv;

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.clock.install({ time: new Date('2026-11-02T12:00:00Z') });
  await page.goto(`http://127.0.0.1:5173${path}${path.includes('?') ? '&' : '?'}seed=42`);
  // Pause so runFor is the only clock (install alone keeps flowing).
  await page.clock.pauseAt(new Date('2026-11-02T12:01:00Z'));
  let ready = false;
  for (let i = 0; i < 400 && !ready; i++) {
    await page.clock.runFor(50);
    ready = await page.evaluate(() => Boolean(window.__lanefield && window.__lanefield.ready && window.__lanefieldReady));
  }
  for (let i = 0; i < 40; i++) await page.clock.runFor(50);
  const sample = () =>
    page.evaluate(() => {
      const f = window.__lanefieldReady;
      const hero = document.querySelector('[data-brand-mark]');
      const hr = hero ? hero.getBoundingClientRect() : null;
      const pr = f.getParams();
      const twins = [...document.querySelectorAll('button[data-twin]')].map((b) => {
        const q = b.getBoundingClientRect();
        return [Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2)];
      });
      const sq = window.__sceneControllers && window.__sceneControllers.get('sidequests'); const head0 = sq && sq.headScreen ? [0, 1, 2].map((i) => sq.headScreen(i).map(Math.round)) : null;
      const ro = document.querySelector('.jp-readout').getBoundingClientRect();
      const trailBtns = [...document.querySelectorAll('.jp-sq-trail')].map((b) => b.getAttribute('aria-pressed'));
      const offer = [...document.querySelectorAll('.jp-readout button')].find((b) => /offer/i.test(b.textContent || ''));
      const offerRect = offer ? offer.getBoundingClientRect() : null;
      return {
        heroC: hr ? [Math.round(hr.left + hr.width / 2), Math.round(hr.top + hr.height / 2)] : null,
        heroO: hero ? +getComputedStyle(hero).opacity : null,
        pan: f.focusOffset().map((v) => +v.toFixed(2)),
        ringS: +pr.ringStrength.toFixed(3),
        ringPx: pr.ringStrength > 0 ? f.worldToScreen([pr.ringCenter[0], 0, pr.ringCenter[1]]).map(Math.round) : null,
        pitch: +window.__lanefield.camera.pitchDeg.toFixed(2),
        twins, head0, stage: window.__morph.stage(),
        readoutBottom: Math.round(ro.bottom),
        trailPressed: trailBtns,
        offerVisible: offerRect ? offerRect.bottom <= ro.bottom + 0.5 && offerRect.top >= ro.top : null,
        offerRect: offerRect ? [Math.round(offerRect.top), Math.round(offerRect.bottom)] : null,
      };
    });
  const rows = [{ tMs: 0, ...(await sample()) }];
  if (action.startsWith('trail')) {
    await page.locator('.jp-sq-trail').nth(+action.slice(5)).click();
  } else if (action.startsWith('walk')) {
    await page.evaluate((i) => window.__sceneControllers.get('sidequests').walk(i), +action.slice(4));
  } else if (action === 'offer') {
    await page.locator('.jp-readout button', { hasText: 'offer' }).click();
  } else if (action === 'glitter') {
    await page.mouse.move(70, 250);
    await page.mouse.down();
  }
  for (let t = 16; t <= +dur; t += 16) {
    await page.clock.runFor(16);
    if (action === 'glitter' && t === 800) await page.mouse.move(120, 280, { steps: 4 });
    if (action === 'glitter' && t === 1400) await page.mouse.up();
    rows.push({ tMs: t, ...(await sample()) });
  }
  console.log(JSON.stringify({ path, action, viewport: [+vw, +vh], errors, rows }));
  await browser.close();
})().catch((e) => {
  console.log(JSON.stringify({ fatal: String((e && e.stack) || e) }));
  process.exit(1);
});
