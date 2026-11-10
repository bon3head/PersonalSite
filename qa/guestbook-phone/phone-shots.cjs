// Phone-width receipts for the guestbook (DESIGN 6.14, 1.6.0).
// Usage: node qa/guestbook-phone/phone-shots.cjs <baseUrl> <outDir>
// Keyboard-open is SIMULATED: headless Chromium has no on-screen
// keyboard, so window.visualViewport is wrapped and its height shrunk
// by KB px, then resize fires (what iOS Safari does on keyboard open).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2];
const OUT = process.argv[3];
const KB = 336; // iPhone portrait keyboard height used for the simulation
fs.mkdirSync(OUT, { recursive: true });

function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
function parseRgb(s) { const m = s.match(/\d+(\.\d+)?/g).map(Number); return m.slice(0, 3); }

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((kbDefault) => {
    const real = window.visualViewport;
    const et = new EventTarget();
    window.__kb = 0;
    const fake = {
      get offsetLeft() { return 0; }, get offsetTop() { return 0; },
      get width() { return real ? real.width : innerWidth; },
      get height() { return (real ? real.height : innerHeight) - window.__kb; },
      get scale() { return 1; }, get pageLeft() { return 0; }, get pageTop() { return 0; },
      addEventListener: et.addEventListener.bind(et), removeEventListener: et.removeEventListener.bind(et),
      dispatchEvent: et.dispatchEvent.bind(et),
    };
    Object.defineProperty(window, 'visualViewport', { get: () => fake, configurable: true });
    window.__setKb = (px) => { window.__kb = px; fake.dispatchEvent(new Event('resize')); };
  }, KB);
  const page = await ctx.newPage();
  await page.goto(BASE + '/?seed=7#guestbook', { waitUntil: 'load' });
  await page.waitForSelector('.jp-gb[data-shown="true"]', { timeout: 120000 });
  await page.waitForFunction(() => window.__lanefield && window.__guestbook && window.__guestbook.phase === 'open', null, { timeout: 180000 });
  await page.waitForTimeout(4000);
  await page.locator('.jp-gb-input--name').fill('Justin');
  await page.waitForTimeout(6000);

  async function contrast(label) {
    // Background only: hide text, glyphs and caret, then read pixels.
    const targets = await page.evaluate(() => {
      const pick = (sel, kind) => [...document.querySelectorAll(sel)].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el, kind === 'placeholder' ? '::placeholder' : null);
        return { sel, kind, box: [r.left, r.top, r.width, r.height], color: cs.color };
      });
      const out = [];
      const name = document.querySelector('.jp-gb-input--name');
      if (name) out.push(...pick('.jp-gb-input--name', name.value ? 'typed' : 'placeholder'));
      const line = document.querySelector('.jp-gb-input--line');
      if (line) out.push(...pick('.jp-gb-input--line', line.value ? 'typed' : 'placeholder'));
      out.push(...pick('.jp-gb-seed', 'seed'), ...pick('.jp-gb-done', 'done'), ...pick('.jp-gb-note', 'note'));
      return out.filter((t) => t.box[2] > 0 && t.box[3] > 0);
    });
    await page.addStyleTag({ content: '.jp-gb-panel, .jp-gb-panel *, .jp-gb-panel *::placeholder { color: transparent !important; caret-color: transparent !important; } .jp-gb-caret, .jp-gb-dot { visibility: hidden !important; } .jp-gb-pill, .jp-gb-prompt { border-color: transparent !important; box-shadow: none !important; }', }).then((h) => h.evaluate((n) => n.setAttribute('data-qa', 'hide')));
    await page.screenshot({ path: path.join(OUT, `bg-${label}.png`) });
    await page.evaluate(() => document.querySelector('style[data-qa="hide"]').remove());
    return targets.map((t) => ({ state: label, ...t, bg: `bg-${label}.png` }));
  }

  async function geometry(label) {
    return page.evaluate((label) => {
      const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const vvH = window.visualViewport.height;
      const glyphs = [...document.querySelectorAll('.jp-gb-glyph')].map((g) => { const r = g.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; });
      return { state: label, visualViewportH: vvH, panel: q('.jp-gb-panel'), name: q('.jp-gb-input--name'), line: q('.jp-gb-input--line'), pill: q('.jp-gb-pill--primary'), glyphs, focusedShadow: document.activeElement && document.activeElement.closest('.jp-gb-prompt') ? getComputedStyle(document.activeElement.closest('.jp-gb-prompt')).boxShadow : null };
    }, label);
  }
  const report = { contrast: [], geometry: [] };
  await page.screenshot({ path: path.join(OUT, 'p1-signing-390.png') });
  report.geometry.push(await geometry('signing'));
  report.contrast.push(...await contrast('signing'));

  await page.locator('.jp-gb-input--line').focus();
  await page.evaluate((kb) => window.__setKb(kb), KB);
  await page.waitForTimeout(6000);
  await page.locator('.jp-gb-input--line').fill('hello from a phone');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'p2-keyboard-open-390.png') });
  report.geometry.push(await geometry('keyboard-open'));
  report.contrast.push(...await contrast('keyboard-open'));

  await page.evaluate(() => window.__setKb(0));
  await page.locator('.jp-gb-pill--primary').click();
  await page.waitForSelector('.jp-gb-done', { timeout: 120000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, 'p3-done-390.png') });
  report.geometry.push(await geometry('done'));
  report.contrast.push(...await contrast('done'));

  // Words hidden while open (server controller).
  report.serverWordsWhileOpen = await page.evaluate(() => { const m = window.__sceneControllers; const s = m && m.get('server'); return s ? s.activeWords() : 'no controller'; });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
