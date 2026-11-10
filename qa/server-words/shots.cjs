// Server words formed from lanes (DESIGN 6.15, S05 1.3.0): screenshots.
// Usage: node qa/server-words/shots.cjs <baseUrl> <outDir>
// Waits until a word is lit (opacity above 0.5), then screenshots and
// records each lit glyph's screen position and its lane-tip error.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2];
const OUT = process.argv[3];
const SLOW = 0.05; // page clock rate for the stills
fs.mkdirSync(OUT, { recursive: true });

const runs = [
  { name: 's1-server-390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 's2-server-1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 's3-server-390-reduced', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const report = {};
  for (const r of runs) {
    const { name, ...opts } = r;
    const ctx = await browser.newContext(opts);
    // SwiftShader frames take seconds while a word lives 2.6s of real
    // time, so the page clock runs at SLOW of real time for a still that
    // catches a lit word (QA only; the app is unchanged).
    await ctx.addInitScript((slow) => {
      const real = performance.now.bind(performance);
      const t0 = real();
      performance.now = () => t0 + (real() - t0) * slow;
    }, SLOW);
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__lanefield && window.__lanefield.ready, null, { timeout: 120000 });
    await page.waitForFunction(() => {
      const m = window.__sceneControllers;
      const rows = m && m.get('server') ? m.get('server').wordLanes() : [];
      return rows.some((x) => x.opacity > 0.5);
    }, null, { timeout: 120000 });
    const data = await page.evaluate(() => {
      const f = window.__lanefieldReady;
      const rows = window.__sceneControllers.get('server').wordLanes();
      return rows.map((x) => ({
        word: x.word, char: x.char, lane: x.lane, opacity: +x.opacity.toFixed(3),
        screen: f.worldToScreen(x.glyph).map((v) => Math.round(v)),
        tipErr: Math.max(...[0, 1, 2].map((i) => Math.abs(x.restTip[i] + x.texel[i] - x.glyph[i]))),
      }));
    });
    await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 180000 });
    report[name] = { viewport: r.viewport, glyphs: data };
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
