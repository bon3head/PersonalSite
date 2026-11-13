#!/usr/bin/env node
// GENERATED-INPUT reader: spec/astryx/DESIGN.md -> src/tokens.generated.ts,
// themes/lane/tokens.generated.json, src/styles/tokens.generated.css.
// Fails (exit 1) if the block is missing, is not valid JSON, or
// world.laneCount !== world.server.sm.count * 128.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const designPath = join(root, 'spec/astryx/DESIGN.md');
const src = readFileSync(designPath, 'utf8');

const m = src.match(/```json design-tokens\n([\s\S]*?)\n```/);
if (!m) {
  console.error('extract-tokens: no ```json design-tokens block found in spec/astryx/DESIGN.md');
  process.exit(1);
}
let tokens;
try {
  tokens = JSON.parse(m[1]);
} catch (e) {
  console.error('extract-tokens: design-tokens block is not valid JSON:', e.message);
  process.exit(1);
}
if (tokens.world.laneCount !== tokens.world.server.sm.count * 128) {
  console.error(
    `extract-tokens: world.laneCount (${tokens.world.laneCount}) !== world.server.sm.count * 128 (${tokens.world.server.sm.count * 128})`,
  );
  process.exit(1);
}

// W4 build-time step: convert each scene gradient stop from its hex to
// OKLab once, here, so the shader interpolates in OKLab and no runtime
// code ever converts a token hex. Stop names resolve against the color
// tokens; an unknown stop name fails the build.
function hexToOklab(hex) {
  const srgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const [r, g, b] = lin;
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l3 = Math.cbrt(l);
  const m3 = Math.cbrt(m);
  const s3 = Math.cbrt(s);
  return [
    0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3,
    1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3,
    0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3,
  ];
}
const STOP_HEX = {
  signal: tokens.color.signal,
  signalDim: tokens.color.signalDim,
  ink: tokens.color.ink,
  field: tokens.color.field.ground,
  chalk: tokens.color.chalk,
};
for (const [route, scene] of Object.entries(tokens.scene)) {
  const grad = scene.gradient;
  if (!grad) continue;
  for (const key of ['leadStop', 'tailStop']) {
    const hex = STOP_HEX[grad[key]];
    if (!hex) {
      console.error(`extract-tokens: unknown gradient stop "${grad[key]}" in scene.${route}`);
      process.exit(1);
    }
  }
  grad.leadOklab = hexToOklab(STOP_HEX[grad.leadStop]);
  grad.tailOklab = hexToOklab(STOP_HEX[grad.tailStop]);
  grad.signalOklab = hexToOklab(tokens.color.signal);
}
const version = tokens.version;

const tsHeader = `// GENERATED from spec/astryx/DESIGN.md v${version}. Do not edit.\n`;
writeFileSync(
  join(root, 'src/tokens.generated.ts'),
  `${tsHeader}export const T = ${JSON.stringify(tokens, null, 2)} as const;\n`,
);
mkdirSync(join(root, 'themes/lane'), { recursive: true });
writeFileSync(
  join(root, 'themes/lane/tokens.generated.json'),
  `${JSON.stringify(tokens, null, 2)}\n`,
);

// CSS custom properties: regime colors as --jp-void-ground etc., type
// display tokens, gutters, keymap heights, durations, easings.
const lines = [`/* GENERATED from spec/astryx/DESIGN.md v${version}. Do not edit. */`, ':root {'];
const push = (name, value) => lines.push(`  ${name}: ${value};`);
for (const regime of ['void', 'paper', 'field']) {
  const r = tokens.color[regime];
  for (const [key, value] of Object.entries(r)) {
    push(`--jp-${regime}-${key}`, value);
  }
}
push('--jp-signal', tokens.color.signal);
push('--jp-signal-dim', tokens.color.signalDim);
push('--jp-signal-hot', tokens.color.signalHot);
push('--jp-ink', tokens.color.ink);
push('--jp-ink-tint', tokens.color.inkTint);
push('--jp-chalk', tokens.color.chalk);
push('--jp-chalk-2', tokens.color.chalk2);
push('--jp-error-dark', tokens.color.errorDark);
push('--jp-error-light', tokens.color.errorLight);
push('--jp-font-family', tokens.type.family);
push('--jp-text-display-0-size', tokens.type.display0.size);
push('--jp-text-display-0-weight', String(tokens.type.display0.weight));
push('--jp-text-display-0-leading', String(tokens.type.display0.leading));
push('--jp-text-display-0-tracking', tokens.type.display0.tracking);
push('--jp-text-display-1-size', tokens.type.display1.size);
push('--jp-text-display-1-weight', String(tokens.type.display1.weight));
push('--jp-text-display-1-leading', String(tokens.type.display1.leading));
push('--jp-text-display-1-tracking', tokens.type.display1.tracking);
push('--jp-text-key-size', tokens.type.key.size);
push('--jp-text-key-weight', String(tokens.type.key.weight));
push('--jp-gutter-base', `${tokens.space.gutterPx.base}px`);
push('--jp-gutter-640', `${tokens.space.gutterPx.from640}px`);
push('--jp-gutter-1280', `${tokens.space.gutterPx.from1280}px`);
push('--jp-keymap-h-coarse', `${tokens.space.keymapHeightPx.coarse}px`);
push('--jp-keymap-h-fine', `${tokens.space.keymapHeightPx.fine}px`);
push('--jp-readout-max-width', `${tokens.space.readoutMaxWidthPx}px`);
for (const [key, value] of Object.entries(tokens.motion.ms)) {
  push(`--jp-duration-${key}`, `${value}ms`);
}
push('--jp-ease-signature', `cubic-bezier(${tokens.motion.easeSignature.join(', ')})`);
push('--jp-ease-standard', tokens.motion.easePlain);
push('--jp-ease-gb-main', `cubic-bezier(${tokens.guestbook.easeMain.join(', ')})`);
push('--jp-ease-gb-soft', `cubic-bezier(${tokens.guestbook.easeSoft.join(', ')})`);
push('--jp-duration-gb-panel', `${tokens.guestbook.ms.panel}ms`);
push('--jp-gb-pill-radius', `${tokens.guestbook.pillRadiusPx}px`);
push('--jp-gb-panel-depth', `${tokens.guestbook.panelDepthPx}px`);
push('--jp-gb-perspective', `${tokens.guestbook.perspectivePx}px`);
push('--jp-gb-pin-radius', `${tokens.guestbook.pin.radiusPx}px`);
push('--jp-gb-pin-gap', `${tokens.guestbook.pin.gapPx}px`);
push('--jp-gb-pin-hit', `${tokens.guestbook.pin.hitPx}px`);
push('--jp-gb-focus-rule', `${tokens.guestbook.focusRulePx}px`);
push('--jp-sheet-max-width', `${tokens.chrome.sheetMaxWidthPx}px`);
lines.push('}');
mkdirSync(join(root, 'src/styles'), { recursive: true });
writeFileSync(join(root, 'src/styles/tokens.generated.css'), `${lines.join('\n')}\n`);
console.log(`extract-tokens: wrote tokens from DESIGN.md v${version}`);
