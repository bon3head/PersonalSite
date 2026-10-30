// SideQuests scene receipts (S07): T-SQ-2, T-SQ-3, T-SQ-4, T-SQ-5,
// T-SQ-6, plus a reduced-motion extra. Runs against the vite dev server
// on port 5173 (playwright config webServer) and the scene harness page.
// Chromium only; SwiftShader frames take seconds, so per-test timeout is
// 180s and claim waits are generous. Twins bob continuously, so clicks
// go through clickTwin: a live bounding-box read plus a coordinate
// mouse click, the same trusted input without locator.click's
// stability wait, which a perpetually moving target can never satisfy.
import { test, expect, type Page } from '@playwright/test';
import { inflateSync } from 'node:zlib';

test.setTimeout(180000);

declare global {
  interface Window {
    __sqtestReady?: Promise<boolean>;
    __sqtest?: {
      field: { now: () => number };
      controller: {
        resume: () => void;
        walk: (i: number) => void;
        claimed: (i: number) => boolean;
        trailLength: (i: number) => number;
        headRestY: (i: number) => number;
        headY: (i: number) => number;
        headBobY: (i: number) => number;
      };
      side: {
        trails: { laneIds: number[]; arcStarts: number[]; arcLengths: number[] }[];
      };
      setActivityCalls: {
        kind: number;
        lanes: ArrayLike<number>;
        starts: ArrayLike<number>;
        uper: ArrayLike<number>;
      }[];
      drive: (t: number, dt: number) => void;
    };
  }
}

const BASE = 'http://localhost:5173';
const HARNESS = `${BASE}/tests/scenes/sidequests-harness.html`;

// ---- PNG decode (dependency-free): Chromium screenshots are 8-bit,
// non-interlaced, color type 2 (RGB) or 6 (RGBA). ----
function decodePng(buf: Buffer): { width: number; height: number; data: Buffer } {
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('not a PNG');
  }
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idats: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString('ascii');
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idats.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG: depth ${bitDepth} type ${colorType} interlace ${interlace}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idats));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  let src = 0;
  let prevRow: Buffer | null = null;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = raw.subarray(src, src + stride);
    src += stride;
    const recon = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? recon[i - channels] : 0;
      const b = prevRow ? prevRow[i] : 0;
      const c = i >= channels && prevRow ? prevRow[i - channels] : 0;
      let v = row[i];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 0xff;
      }
      recon[i] = v;
    }
    prevRow = recon;
    for (let px = 0; px < width; px++) {
      const dst = (y * width + px) * 4;
      const srcPx = px * channels;
      out[dst] = recon[srcPx];
      out[dst + 1] = recon[srcPx + 1];
      out[dst + 2] = recon[srcPx + 2];
      out[dst + 3] = channels === 4 ? recon[srcPx + 3] : 255;
    }
  }
  return { width, height, data: out };
}

// ---- Color helpers ----
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`unparsed color ${css}`);
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

async function loadHarness(page: Page, query = ''): Promise<void> {
  await page.goto(`${HARNESS}${query}`);
  const ok = await page.evaluate(() => window.__sqtestReady);
  expect(ok).toBe(true);
  // Markers rise with the spring after resume (stagger 80ms); settle
  // before asserting geometry or clicking.
  await page.waitForTimeout(1500);
}

// Click a twin by its live center point. locator.click stalls on these
// buttons because they bob continuously (the position never stabilizes
// for the click's wait); a coordinate mouse click is the same trusted
// input without the stability wait. The box read itself resolves fine.
async function clickTwin(page: Page, name: string): Promise<void> {
  const box = await page.locator(`button[aria-label="${name}"]`).boundingBox();
  if (!box) throw new Error(`twin ${name} has no box`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('T-SQ-2: walk feedback', async ({ page }) => {
  await loadHarness(page);
  const twins = page.getByRole('button', { name: /Trail \d/ });
  await expect(twins).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const box = await twins.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box as { width: number }).width - 44)).toBeLessThanOrEqual(1);
    expect(Math.abs((box as { height: number }).height - 44)).toBeLessThanOrEqual(1);
  }
  const twin1 = page.getByRole('button', { name: 'Trail 1' });
  await clickTwin(page, 'Trail 1');
  // On the next rAF the trail's first lane has start <= now().
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  const activity = await page.evaluate(() => {
    const t = window.__sqtest;
    const calls = t.setActivityCalls;
    const trail0 = t.side.trails[0];
    const call = calls.find(
      (c: { lanes: ArrayLike<number> }) => c.lanes[0] === trail0.laneIds[0],
    );
    if (!call) return null;
    return {
      kind: call.kind,
      lanes: Array.from(call.lanes as ArrayLike<number>),
      starts: Array.from(call.starts as ArrayLike<number>),
      uper: Array.from(call.uper as ArrayLike<number>),
      now: t.field.now(),
      arcStarts: trail0.arcStarts,
      arcLengths: trail0.arcLengths,
      laneIds: trail0.laneIds,
    };
  });
  expect(activity).not.toBeNull();
  expect(activity?.kind).toBe(2);
  expect(activity?.lanes).toEqual(activity?.laneIds);
  expect(activity?.starts[0]).toBeLessThanOrEqual(activity?.now as number);
  for (let j = 0; j < (activity?.starts.length as number); j++) {
    const expectedStart = (activity?.starts[0] as number) + (activity?.arcStarts[j] as number) / 14;
    expect(Math.abs((activity?.starts[j] as number) - expectedStart)).toBeLessThan(0.05);
    const expectedUper = 14 / (activity?.arcLengths[j] as number);
    expect(Math.abs((activity?.uper[j] as number) - expectedUper) / expectedUper).toBeLessThan(0.001);
  }
  // After length/14 + 0.2s (plus SwiftShader frame time), claimed.
  await expect(twin1).toHaveAttribute('aria-pressed', 'true', { timeout: 120000 });
});

test('T-SQ-4: spring numbers', async ({ page }) => {
  await page.goto(`${HARNESS}?mock=1`);
  const ok = await page.evaluate(() => window.__sqtestReady);
  expect(ok).toBe(true);
  const result = await page.evaluate(() => {
    const t = window.__sqtest;
    const c = t.controller;
    t.drive(0, 0);
    c.resume();
    c.walk(0);
    const walkLength = c.trailLength(0);
    const rest = c.headRestY(0);
    const samples: { t: number; y: number; bob: number; claimed: boolean }[] = [];
    const end = walkLength / 14 + 1.2;
    for (let tt = 0; tt <= end; tt += 1 / 60) {
      t.drive(tt, 1 / 60);
      samples.push({ t: tt, y: c.headY(0), bob: c.headBobY(0), claimed: c.claimed(0) });
    }
    return { samples, rest, walkLength };
  });
  const claimIdx = result.samples.findIndex((s) => s.claimed);
  expect(claimIdx).toBeGreaterThan(0);
  const claimStart = result.samples[claimIdx].t;
  let minCorrected = Infinity;
  for (const s of result.samples) {
    if (s.t <= claimStart) continue;
    minCorrected = Math.min(minCorrected, s.y - s.bob);
  }
  const drop = minCorrected - result.rest;
  expect(drop).toBeLessThanOrEqual(-0.02);
  expect(drop).toBeGreaterThanOrEqual(-0.035);
  const settle = result.samples.reduce((best, s) =>
    Math.abs(s.t - (claimStart + 0.6)) < Math.abs(best.t - (claimStart + 0.6)) ? s : best,
  );
  expect(Math.abs(settle.y - settle.bob - result.rest)).toBeLessThanOrEqual(0.005);
  console.log(
    `T-SQ-4: trail0 length=${result.walkLength.toFixed(2)} claimStart=${claimStart.toFixed(3)} minDrop=${drop.toFixed(4)} settleErr=${Math.abs(settle.y - settle.bob - result.rest).toFixed(4)}`,
  );
});

test('T-SQ-5: keyboard', async ({ page }) => {
  await loadHarness(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(focused).toBe('Trail 2');
  await page.keyboard.press('Enter');
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  const activity = await page.evaluate(() => {
    const t = window.__sqtest;
    const trail1 = t.side.trails[1];
    const call = t.setActivityCalls.find(
      (c: { lanes: ArrayLike<number> }) => c.lanes[0] === trail1.laneIds[0],
    );
    return call ? { kind: call.kind, lanes: Array.from(call.lanes as ArrayLike<number>) } : null;
  });
  expect(activity).not.toBeNull();
  expect(activity?.kind).toBe(2);
  const twin2 = page.getByRole('button', { name: 'Trail 2' });
  await expect(twin2).toHaveAttribute('aria-pressed', 'true', { timeout: 120000 });
});

test('T-SQ-3: readout contrast', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/sidequests`);
  await page.waitForFunction(() => window.__lanefield?.ready === true, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const lines = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.jp-readout h1, .jp-readout p')];
    return els.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        text: (el.textContent as string).slice(0, 40),
        box: { x: r.x, y: r.y, width: r.width, height: r.height },
        color: getComputedStyle(el).color,
      };
    });
  });
  expect(lines.length).toBeGreaterThan(0);
  await page.evaluate(() => {
    const readout = document.querySelector('.jp-readout') as HTMLElement | null;
    if (readout) readout.style.visibility = 'hidden';
  });
  const shot = await page.screenshot();
  const png = decodePng(shot);
  for (const line of lines) {
    const { x, y, width, height } = line.box;
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(png.width, Math.ceil(x + width));
    const y1 = Math.min(png.height, Math.ceil(y + height));
    let maxLum = 0;
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const off = (py * png.width + px) * 4;
        const lum = relativeLuminance(png.data[off], png.data[off + 1], png.data[off + 2]);
        if (lum > maxLum) maxLum = lum;
      }
    }
    const [tr, tg, tb] = parseRgb(line.color);
    const textLum = relativeLuminance(tr, tg, tb);
    const light = Math.max(textLum, maxLum);
    const dark = Math.min(textLum, maxLum);
    const contrast = (light + 0.05) / (dark + 0.05);
    console.log(`T-SQ-3: "${line.text}" color=${line.color} maxBgLum=${maxLum.toFixed(3)} contrast=${contrast.toFixed(2)}`);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});

test('T-SQ-6: hue budget', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadHarness(page);
  // Light all three trails by keyboard. (B6c-fix: markers are now
  // constrained to the fine viewport, so pointer clicks can also reach
  // all three twins; keyboard walking is kept here because it is a
  // first-class interaction (T-SQ-5) and the gate here is the pixel
  // budget with all trails lit, not the input device.)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button[aria-label^="Trail"]')].every(
        (b) => b.getAttribute('aria-pressed') === 'true',
      ),
    null,
    { timeout: 150000 },
  );
  await page.waitForTimeout(2000);
  const shot = await page.screenshot();
  const png = decodePng(shot);
  const [sr, sg, sb] = hexToRgb('#7BB5F8');
  const [sL, sa, sb2] = rgbToOklab(sr, sg, sb);
  let signal = 0;
  const total = png.width * png.height;
  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const [L, a, b] = rgbToOklab(png.data[off], png.data[off + 1], png.data[off + 2]);
    const d = Math.sqrt((L - sL) ** 2 + (a - sa) ** 2 + (b - sb2) ** 2);
    if (d < 0.08) signal++;
  }
  const fraction = signal / total;
  console.log(`T-SQ-6: signalPixels=${signal} total=${total} fraction=${fraction.toFixed(4)}`);
  expect(fraction).toBeLessThan(0.06);
});

test('T-SQ-7 (extra): reduced motion', async ({ page }) => {
  await page.goto(`${HARNESS}?reduced=1`);
  const ok = await page.evaluate(() => window.__sqtestReady);
  expect(ok).toBe(true);
  await page.waitForTimeout(500);
  const twin1 = page.getByRole('button', { name: 'Trail 1' });
  await clickTwin(page, 'Trail 1');
  const activity = await page.evaluate(() => {
    const t = window.__sqtest;
    const trail0 = t.side.trails[0];
    const call = t.setActivityCalls.find(
      (c: { lanes: ArrayLike<number> }) => c.lanes[0] === trail0.laneIds[0],
    );
    if (!call) return null;
    return {
      kind: call.kind,
      starts: Array.from(call.starts as ArrayLike<number>),
      uper: Array.from(call.uper as ArrayLike<number>),
    };
  });
  expect(activity).not.toBeNull();
  expect(activity?.kind).toBe(2);
  // Whole trail at once: all starts equal, all rates very large.
  const starts = activity?.starts as number[];
  for (const s of starts) expect(Math.abs(s - starts[0])).toBeLessThan(0.001);
  for (const u of activity?.uper as number[]) expect(u).toBeGreaterThanOrEqual(100000);
  // Claims instantly, no frame wait.
  await expect(twin1).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
});
