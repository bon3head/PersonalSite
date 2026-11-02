// Dev-only HUD (P-DEV-1). This module is never imported by a
// production entry. The serve-only Vite plugin in vite.config.ts
// injects a loader into the dev server index page, and the loader
// imports this module only when the URL carries ?hud=1. In a
// production build the plugin does not run, no import exists, and
// tools/check-dev-hud-absent.mjs fails the build if any HUD marker
// reaches dist/. The HUD reads the existing debug hooks only
// (window.__lanefield and window.__morph); it adds no product UI
// and no new debug hook. Frame p95 comes from the governor stats
// on __lanefield; frame p99 comes from the HUD own requestAnimation
// frame ring, since the governor ring exposes p50, p90, and p95
// only. Morph phase is derived from the sample windows: rest when
// done, Reveal once gather has completed, Gather while gather is
// open, Release otherwise.
import { T } from '../tokens.generated';
import { descriptorForLayout } from '../motion/hero-descriptors';
import type { MorphSample } from '../motion/morph-controller';
import type { LayoutId } from '../world/types';

interface MorphDebug {
  from: LayoutId;
  to: LayoutId;
  sample: MorphSample | null;
  degraded: boolean;
  degradeState: () => {
    degraded: boolean;
    consecutiveOverBudget: number;
    longTaskFrames: number;
    maxFrameMs: number;
    degradedAtMs: number | null;
  };
}

declare global {
  interface Window {
    __morph?: MorphDebug;
  }
}

const RING_SIZE = 600;
const MS = 'ms';

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

function fmt(n: number, digits: number): string {
  return n.toFixed(digits);
}

export function mountDevHud(): void {
  if (document.getElementById('jp-dev-hud')) return;
  const el = document.createElement('div');
  el.id = 'jp-dev-hud';
  el.setAttribute('data-dev-hud', '1');
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.right = '0';
  el.style.zIndex = '9999';
  el.style.fontFamily = 'Commit Mono, monospace';
  el.style.fontSize = '12px';
  el.style.color = T.color.chalk;
  el.style.background = T.color.void.ground;
  el.style.padding = '4px 8px';
  el.style.whiteSpace = 'pre';
  el.style.textAlign = 'left';
  document.body.appendChild(el);

  const ring = new Float64Array(RING_SIZE);
  let ringCount = 0;
  let ringHead = 0;
  let lastMs: number | null = null;

  const frame = (nowMs: number): void => {
    if (lastMs !== null) {
      const dt = nowMs - lastMs;
      ring[ringHead] = dt;
      ringHead = (ringHead + 1) % RING_SIZE;
      if (ringCount < RING_SIZE) ringCount += 1;
    }
    lastMs = nowMs;
    const sorted = Array.from(ring.slice(0, ringCount)).sort((a, b) => a - b);
    const hudP95 = percentile(sorted, 0.95);
    const hudP99 = percentile(sorted, 0.99);

    const lf = window.__lanefield;
    const morph = window.__morph;
    if (!lf) {
      el.textContent = 'jp-dev-hud\nwaiting for lanefield';
      requestAnimationFrame(frame);
      return;
    }
    const cam = lf.camera;
    const info = lf.info();
    const stats = lf.frameStats();
    const sample = morph ? morph.sample : null;
    let morphLine = 'morph: none';
    let heroLine = 'hero: none';
    if (sample) {
      const phase = sample.done
        ? 'rest'
        : sample.gather >= 1
          ? 'Reveal'
          : sample.gather > 0
            ? 'Gather'
            : 'Release';
      morphLine =
        'morph: ' + sample.from + ' -> ' + sample.to +
        ' p=' + fmt(sample.p, 2) +
        ' phase=' + phase +
        ' done=' + String(sample.done) +
        ' release=' + fmt(sample.release, 2) +
        ' gather=' + fmt(sample.gather, 2) +
        ' reveal=' + fmt(sample.reveal, 2);
      const desc = descriptorForLayout(sample.to);
      heroLine =
        'hero: ' + desc.layout + ' ' + desc.kind +
        ' anchor=[' + fmt(desc.anchor[0], 2) + ',' + fmt(desc.anchor[1], 2) + ']' +
        ' ring=' + fmt(desc.ringRadius, 2);
    } else if (morph) {
      // At rest no sample exists yet: the morph hook still carries
      // the current route in from/to, so report rest plus that
      // route descriptor instead of an empty panel.
      morphLine = 'morph: ' + morph.from + ' -> ' + morph.to + ' p=1.00 phase=rest done=true';
      const desc = descriptorForLayout(morph.to);
      heroLine =
        'hero: ' + desc.layout + ' ' + desc.kind +
        ' anchor=[' + fmt(desc.anchor[0], 2) + ',' + fmt(desc.anchor[1], 2) + ']' +
        ' ring=' + fmt(desc.ringRadius, 2);
    }
    const deg = morph ? morph.degradeState() : null;
    const degLine = deg
      ? 'degrade: ' + String(deg.degraded) +
        ' over=' + String(deg.consecutiveOverBudget) +
        ' longTask=' + String(deg.longTaskFrames) +
        ' max=' + fmt(deg.maxFrameMs, 1) + MS
      : 'degrade: unknown';
    el.textContent =
      'jp-dev-hud\n' +
      'laneCount: ' + String(lf.laneCount) + '\n' +
      'calls: ' + String(info.calls) + '\n' +
      'pitchDeg: ' + fmt(cam.pitchDeg, 2) + '\n' +
      'yawDeg: ' + fmt(cam.yawDeg, 2) + '\n' +
      'distance: ' + (cam.distance === null ? 'null' : fmt(cam.distance, 2)) + '\n' +
      morphLine + '\n' +
      heroLine + '\n' +
      'frameP95gov: ' + fmt(stats.p95, 1) + MS +
      ' frameP95hud: ' + fmt(hudP95, 1) + MS +
      ' frameP99hud: ' + fmt(hudP99, 1) + MS +
      ' frames: ' + String(stats.count) + '\n' +
      degLine;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
