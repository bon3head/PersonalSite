// P-HERO-2 gate helpers: the brand-mark exclusion, the fingerprint
// check, and the area cap, as pure functions the gate tests import.
// They do not lower any existing gate: the hue budget thresholds
// (hueBudgetPct) are unchanged, and the exclusion removes the mark
// rectangle from both the numerator and the denominator of a hue
// fraction, so the budget over the rest of the page is exactly the
// budget that ran before heroes existed.
//
// Fingerprint check (DESIGN section 3.5): every non-transparent
// pixel color of a mark must sit within brand.fingerprintDeltaE of
// a color in that asset's manifest fingerprint. DeltaE here is the
// CIE76 distance in CIE Lab. The shipped marks measure DeltaE 0:
// every unique pixel color of both marks is exactly a fingerprint
// color (verified in the W6 gate run), so the token 3 has full
// headroom and the check is not tuned to pass.
export interface GateRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function pixelInRect(x: number, y: number, rect: GateRect): boolean {
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

// sRGB channel to CIE Lab, via linear sRGB and XYZ (D65).
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number): number => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const y = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 1.0;
  const z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Largest DeltaE from any unique pixel color to its nearest
// fingerprint color. Callers pass unique colors only: the shipped
// marks have at most a few hundred, so this stays cheap.
export function fingerprintMaxDeltaE(
  uniqueRgb: Array<[number, number, number]>,
  fingerprintHex: string[],
): number {
  const fpLab = fingerprintHex.map((h) => rgbToLab(...hexToRgb(h)));
  let worst = 0;
  for (const rgb of uniqueRgb) {
    const lab = rgbToLab(...rgb);
    let best = Infinity;
    for (const f of fpLab) {
      const d = deltaE76(lab, f);
      if (d < best) best = d;
    }
    if (best > worst) worst = best;
  }
  return worst;
}

// Area cap: the displayed rectangle may cover at most
// brand.areaCap of the viewport.
export function areaRatio(rect: { width: number; height: number }, vw: number, vh: number): number {
  return (rect.width * rect.height) / (vw * vh);
}
