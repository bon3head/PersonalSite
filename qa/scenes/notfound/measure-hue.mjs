// Hue measurement for the 404 scene (S08, G-HUE method from DESIGN
// 3.3: screenshot, count pixels with OKLCH chroma above 0.04).
// DESIGN hueBudgetPct has no scatter entry and S08 sets no numeric
// budget, so this script MEASURES and reports; it does not invent a
// budget. The number is compared against the server 30% ceiling (the
// other void-regime, lane-subject scene) in HUE.md.
// Usage: vite dev on 5173, then node qa/scenes/notfound/measure-hue.mjs
import { chromium } from 'playwright';
import { inflateSync } from 'node:zlib';

// Minimal PNG decoder: 8-bit RGB or RGBA, non-interlaced.
function decodePng(buf) {
  let off = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idats = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      // IHDR: width 4, height 4, bit depth 1, color type 1,
      // compression 1, filter 1, interlace 1.
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG unsupported');
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`unsupported color type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idats));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = y * stride;
    const prev = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? pixels[row + i - channels] : 0;
      const b = y > 0 ? pixels[prev + i] : 0;
      const c = y > 0 && i >= channels ? pixels[prev + i - channels] : 0;
      const v = raw[src++];
      let recon;
      if (filter === 0) recon = v;
      else if (filter === 1) recon = (v + a) & 0xff;
      else if (filter === 2) recon = (v + b) & 0xff;
      else if (filter === 3) recon = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        recon = (v + pr) & 0xff;
      } else throw new Error(`bad filter ${filter}`);
      pixels[row + i] = recon;
    }
  }
  return { width, height, channels, pixels };
}

// sRGB -> OKLCH chroma (OKLab, Bjorn Ottosson).
function oklchChroma(r, g, b) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return Math.sqrt(a * a + bb * bb);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5173/nope', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () =>
    typeof window.__lanefield !== 'undefined' &&
    window.__lanefield.ready === true,
  { timeout: 120000 },
);
// Let a few frames render so the strokes are on screen.
await page.waitForTimeout(3000);
// Playwright's screenshot waits for page stability, which never comes
// with a continuously rendering WebGL canvas on SwiftShader (B4's
// starvation finding). Capture via CDP directly: it grabs the current
// composited frame without waiting for stability.
const client = await page.context().newCDPSession(page);
const { data } = await client.send('Page.captureScreenshot', {
  format: 'png',
});
const shot = Buffer.from(data, 'base64');
await browser.close();

const { width, height, channels, pixels } = decodePng(shot);
let hue = 0;
const total = width * height;
for (let i = 0; i < total; i++) {
  const o = i * channels;
  if (oklchChroma(pixels[o], pixels[o + 1], pixels[o + 2]) > 0.04) hue++;
}
console.log(`screenshot ${width}x${height} (${total} px)`);
console.log(`hue pixels (chroma > 0.04): ${hue}`);
console.log(`hue pct: ${((hue / total) * 100).toFixed(3)}%`);
