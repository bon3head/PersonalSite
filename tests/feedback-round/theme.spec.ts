// W6 theme tests: T-THEME-1 gradient parameters match tokens,
// T-THEME-2 per-route colorfulness and edge density inside one band.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T } from '../../src/tokens.generated';
import { paramsForLayout } from '../../src/world/laneParams';
import { descriptorForLayout } from '../../src/motion/hero-descriptors';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---- T-THEME-1: per-route gradient parameters match tokens.
test('T-THEME-1: per-route gradient parameters match tokens', () => {
  for (const route of ['server', 'leaflink', 'sidequests'] as const) {
    const params = paramsForLayout(route);
    const token = T.scene[route].gradient as {
      leadOklab: number[];
      tailOklab: number[];
      signalOklab: number[];
      tailLength: number;
      light: { mode: string; radius: number; gain: number };
    };
    expect(params.leadOklab).toEqual(token.leadOklab);
    expect(params.tailOklab).toEqual(token.tailOklab);
    expect(params.signalOklab).toEqual(token.signalOklab);
    expect(params.tailLength).toBe(token.tailLength);
    expect(params.lightMode).toBe(token.light.mode);
    expect(params.lightRadius).toBe(token.light.radius);
    expect(params.lightGain).toBe(token.light.gain);
    const desc = descriptorForLayout(route);
    if (route === 'server') {
      expect(desc.kind).toBe('field');
      expect(desc.ringRadius).toBe(0);
      expect(desc.maskKind).toBe('none');
    } else {
      expect(desc.kind).toBe('mark');
      expect(desc.ringRadius).toBe(token.light.radius);
      expect(desc.silhouetteRadius).toBe(token.light.radius);
    }
    expect(desc.heroSizePx).toBe(T.hero.sizePx);
  }
  // Gradient stops stay in the signal, ink, field family: lead and
  // tail are token stops, never a new hue introduced by W6.
  expect(T.color.signal).toBe('#7BB5F8');
  expect(T.color.ink).toBe('#0E3565');
  expect(T.color.field.ground).toBe('#10294E');
});

// ---- T-THEME-2: per-route colorfulness and edge density inside
// one band. Colorfulness is mean OKLab chroma over opaque pixels;
// edge density is edge pixels (opaque with a transparent
// 4-neighbour) over opaque pixels. The band is a single absolute
// band both marks sit inside, stated here rather than fitted per
// route: colorfulness [0.08, 0.20], edge density [0, 0.06].
// Measured values (printed by the test): SideQuests colorfulness
// about 0.152, edge density about 0.049; LeafLink colorfulness
// about 0.109, edge density about 0.013. Both inside both bands.
test('T-THEME-2: per-route colorfulness and edge density inside one band', async () => {
  const { execFileSync } = await import('node:child_process');
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'public', 'brand', 'manifest.json'), 'utf8'),
  ) as {
    heroes: {
      sidequests: { frame0: { file: string } };
      leaflink: { png: { file: string } };
    };
  };
  const script = `
import sys, json
import numpy as np
from PIL import Image
def chroma(rgb):
    def lin(c):
        v = c / 255.0
        return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    r = lin(rgb[:, :, 0].astype(np.float64))
    g = lin(rgb[:, :, 1].astype(np.float64))
    b = lin(rgb[:, :, 2].astype(np.float64))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l3 = np.cbrt(l); m3 = np.cbrt(m); s3 = np.cbrt(s)
    a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3
    bb = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3
    return np.sqrt(a * a + bb * bb)
out = {}
for path in sys.argv[1:]:
    a = np.asarray(Image.open(path).convert("RGBA"))
    alpha = a[:, :, 3] > 0
    trans = a[:, :, 3] == 0
    neigh = np.zeros_like(trans)
    neigh[1:, :] |= trans[:-1, :]
    neigh[:-1, :] |= trans[1:, :]
    neigh[:, 1:] |= trans[:, :-1]
    neigh[:, :-1] |= trans[:, 1:]
    edge = int((alpha & neigh).sum())
    out[path] = {
        "colorfulness": float(chroma(a[:, :, :3])[alpha].mean()),
        "edgeDensity": edge / int(alpha.sum()),
    }
print(json.dumps(out))
`;
  const paths = [
    join(ROOT, 'public', 'brand', manifest.heroes.sidequests.frame0.file),
    join(ROOT, 'public', 'brand', manifest.heroes.leaflink.png.file),
  ];
  const scores = JSON.parse(
    execFileSync('python3', ['-c', script, ...paths], {
      encoding: 'utf8',
      timeout: 300000,
    }),
  ) as Record<string, { colorfulness: number; edgeDensity: number }>;
  for (const path of paths) {
    const s = scores[path];
    console.log(`T-THEME-2 ${path}: colorfulness=${s.colorfulness.toFixed(4)} edgeDensity=${s.edgeDensity.toFixed(4)}`);
    expect(s.colorfulness).toBeGreaterThanOrEqual(0.08);
    expect(s.colorfulness).toBeLessThanOrEqual(0.2);
    expect(s.edgeDensity).toBeGreaterThanOrEqual(0);
    expect(s.edgeDensity).toBeLessThanOrEqual(0.06);
  }
});
