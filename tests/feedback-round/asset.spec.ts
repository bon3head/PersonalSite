// T-ASSET-1 to T-ASSET-4 (feedback round W3, P-ASSET-2).
// These run against files on disk plus the manifest; they need no
// browser. T-ASSET-5 lives in asset-prefetch.spec.ts (P-ASSET-3).
//
// Fringe rule (T-ASSET-4): an edge pixel is an opaque or
// semi-opaque pixel with a fully transparent 4-neighbour. It fails
// when all three channels are at least 240 (near white). A second
// count covers semi-transparent near-white pixels anywhere, since
// those would also read as a white halo on the navy field.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BRAND = join(ROOT, 'public', 'brand');
const MANIFEST = join(BRAND, 'manifest.json');
const SOURCES = join(ROOT, 'assets-src', 'brand', 'SOURCES.json');

const GIF_MAX_BYTES = 900000;
const GIF_MAX_DECODED = 48000000;

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function pyOut(script: string, args: string[]): string {
  return execFileSync('python3', ['-c', script, ...args], {
    encoding: 'utf8',
    timeout: 300000,
  });
}

function loadManifest(): any {
  expect(existsSync(MANIFEST), 'manifest.json must exist').toBe(true);
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

function loadSources(): any {
  return JSON.parse(readFileSync(SOURCES, 'utf8'));
}

test('T-ASSET-1: manifest matches the files and SOURCES.json', async () => {
  const manifest = loadManifest();
  const sources = loadSources();
  const byFile = new Map<string, any>();
  for (const s of sources.sources) byFile.set(s.file, s);
  const shipped: any[] = [
    manifest.heroes.sidequests.gif,
    manifest.heroes.sidequests.frame0,
    manifest.heroes.leaflink.png,
  ];
  expect(shipped.length).toBe(3);
  for (const entry of shipped) {
    const p = join(BRAND, entry.file);
    expect(existsSync(p), `${entry.file} must exist in public/brand`).toBe(true);
    expect(sha256(p)).toBe(entry.sha256);
    expect(entry.bytes).toBe(readFileSync(p).length);
    expect(entry.sourceSha256).toBe(entry.sha256);
  }
  // The shipped source files must match the SOURCES.json pins.
  expect(manifest.heroes.sidequests.gif.sourceSha256).toBe(
    byFile.get('sidequests.gif').sha256,
  );
  expect(manifest.heroes.leaflink.png.sourceSha256).toBe(
    byFile.get('logo.png').sha256,
  );
  // The manifest must name the shipped LeafLink mark and the decision.
  expect(manifest.leaflinkHeroDecision.mark).toBe('logo.png');
  // Nothing excluded may appear as a shipped file.
  const names = shipped.map((e) => e.file);
  expect(names.join(' ')).not.toContain('alpha');
  expect(names.join(' ')).not.toContain('leaves');
  expect(names.join(' ')).not.toContain('circuit');
  expect(names.join(' ')).not.toContain('gears');
});

test('T-ASSET-2: shipped GIF and PNG files are under budget', async () => {
  const manifest = loadManifest();
  const shipped: any[] = [
    manifest.heroes.sidequests.gif,
    manifest.heroes.sidequests.frame0,
    manifest.heroes.leaflink.png,
  ];
  for (const entry of shipped) {
    expect(entry.bytes).toBeLessThanOrEqual(GIF_MAX_BYTES);
    const decoded = entry.width * entry.height * 4 * entry.frames;
    expect(decoded).toBeLessThanOrEqual(GIF_MAX_DECODED);
    expect(entry.decodedBytes).toBe(decoded);
  }
  // Spot values from the W0 measurements, re-verified here.
  expect(manifest.heroes.sidequests.gif.bytes).toBe(42591);
  expect(manifest.heroes.sidequests.gif.decodedBytes).toBe(16527360);
  expect(manifest.heroes.leaflink.png.bytes).toBe(174622);
});

test('T-ASSET-3: GIF frame 0 equals the PNG pixel for pixel', async () => {
  const manifest = loadManifest();
  const gif = join(BRAND, manifest.heroes.sidequests.gif.file);
  const png = join(BRAND, manifest.heroes.sidequests.frame0.file);
  const script = `
import sys, json
import numpy as np
from PIL import Image
gif_path, png_path = sys.argv[1], sys.argv[2]
g = Image.open(gif_path)
g.seek(0)
ga = np.asarray(g.convert("RGBA"), dtype=np.int16)
pa = np.asarray(Image.open(png_path).convert("RGBA"), dtype=np.int16)
assert ga.shape == pa.shape, f"shape {ga.shape} vs {pa.shape}"
diff = int(np.abs(ga - pa).max()) if ga.size else 0
# Composite both on the navy field ground and compare that too: the
# user-visible result must also be identical, not just the RGBA planes.
navy = np.array([16, 41, 78], dtype=np.float64)
def composite(a):
    alpha = a[:, :, 3:4] / 255.0
    return a[:, :, :3] * alpha + navy * (1.0 - alpha)
cdiff = float(np.abs(composite(ga.astype(np.float64)) - composite(pa.astype(np.float64))).max())
print(json.dumps({"maxRgbaDiff": diff, "maxNavyCompositeDiff": cdiff}))
`;
  const out = JSON.parse(pyOut(script, [gif, png]));
  expect(out.maxRgbaDiff).toBe(0);
  expect(out.maxNavyCompositeDiff).toBe(0);
});

test('T-ASSET-4: no near-white edge pixels on the navy field', async () => {
  const manifest = loadManifest();
  const shipped: any[] = [
    manifest.heroes.sidequests.gif,
    manifest.heroes.sidequests.frame0,
    manifest.heroes.leaflink.png,
  ];
  const script = `
import sys, json
import numpy as np
from PIL import Image
def scan(path):
    im = Image.open(path)
    n = getattr(im, "n_frames", 1)
    edge = 0
    near_white_edge = 0
    semi_near_white = 0
    for i in range(n):
        im.seek(i)
        a = np.asarray(im.convert("RGBA"), dtype=np.int16)
        alpha = a[:, :, 3]
        opaque = alpha > 0
        trans = alpha == 0
        neigh = np.zeros_like(trans)
        neigh[1:, :] |= trans[:-1, :]
        neigh[:-1, :] |= trans[1:, :]
        neigh[:, 1:] |= trans[:, :-1]
        neigh[:, :-1] |= trans[:, 1:]
        edge_px = opaque & neigh
        edge += int(edge_px.sum())
        near = edge_px & (a[:, :, 0] >= 240) & (a[:, :, 1] >= 240) & (a[:, :, 2] >= 240)
        near_white_edge += int(near.sum())
        semi = (alpha > 0) & (alpha < 255) & (a[:, :, 0] >= 240) & (a[:, :, 1] >= 240) & (a[:, :, 2] >= 240)
        semi_near_white += int(semi.sum())
    return {"edgePx": edge, "nearWhiteEdgePx": near_white_edge, "semiNearWhitePx": semi_near_white}
print(json.dumps({p: scan(p) for p in sys.argv[1:]}))
`;
  const paths = shipped.map((e) => join(BRAND, e.file));
  const out = JSON.parse(pyOut(script, paths));
  for (const p of paths) {
    expect(out[p].nearWhiteEdgePx, `${p} near-white edge pixels`).toBe(0);
    expect(out[p].semiNearWhitePx, `${p} semi near-white pixels`).toBe(0);
    expect(out[p].edgePx).toBeGreaterThan(0);
  }
});
