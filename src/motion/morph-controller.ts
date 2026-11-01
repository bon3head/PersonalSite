// Route morph state machine (P-MORPH-1, DESIGN section 6.7, S03).
// State is snapshot, target, and start time. navigate() snapshots the
// current interpolated frame state, discards the old target, and
// retargets from that snapshot, so a second input mid-flight never
// jumps: at the retarget instant the sample equals the snapshot
// exactly, and it then moves toward the new target. No queue, no
// per-lane start stagger: every lane reads the same sample.
//
// Phases inside travel, from tokens motion.morph: Release, Gather,
// Reveal. Anchor travel between project anchors uses curve.track.
// Loom uses morph.loomFrom, recede uses morph.recedeTo, the
// project-to-project ring breath uses morph.ringBreath, silhouette
// pull uses morph.silhouettePull. Direction follows keymap order
// server (1), leaflink (2), sidequests (3); the 404 layout sits
// outside the order, so its direction is 0 and it still uses the
// same morph grammar.
//
// Ring factor shape, documented because three cases differ:
// - field to project: gather times one minus reveal, zero at both ends.
// - project to project: a breath that dips to ringBreath at the
//   Gather middle and regrows to full at the Gather end, then hands
//   off over the last quarter of travel, ending at zero like every
//   other case (the rest state carries ring strength zero).
// - project to field: one minus the collapse window.
// The silhouette strength follows the same envelope, scaled by the
// pull token, so the pull and the ring never disagree about phase.
//
// Degrade path (DESIGN section 6.10, token perf.degradeFrames): while
// a morph is in flight, observeFrame counts consecutive frames over
// the perf.p95Ms budget. At degradeFrames consecutive over-budget
// frames the controller latches degraded for the session: the
// silhouette target term becomes zero, so the pull decays with the
// morph envelope to zero by morph end and stays zero on later
// morphs. Lanes, gradient, and ring are untouched, and the morph
// state machine keeps running. The latch is reported on the debug
// hook and in the console once, which is the dev HUD log for this
// path; the frame budgets themselves are not changed.
import { T } from '../tokens.generated';
import { cubicBezier, easeSignature } from '../world/tween';
import { descriptorForLayout, type HeroDescriptor } from './hero-descriptors';
import type { LayoutId } from '../world/types';

// Keymap order (S03 section 6): server 1, leaflink 2, sidequests 3.
// The whoami sheet is W, a sheet over the current scene, not a route,
// so it has no layout here and no morph.
const KEYMAP_ORDER: Partial<Record<LayoutId, number>> = {
  server: 0,
  leaflink: 1,
  sidequests: 2,
};

// DESIGN section 6.7 windows that are prose constants, not tokens:
// the recede window for an outgoing mark, and the ring collapse
// window for travel to a field route.
const RECEDE_WINDOW: [number, number] = [0, 0.4];
const COLLAPSE_WINDOW: [number, number] = [0.2, 0.8];

export interface MorphSnapshot {
  center: [number, number];
  silhouetteCenter: [number, number];
  ringRadius: number;
  ringStrength: number;
  silhouetteRadius: number;
  silhouetteStrength: number;
}

export interface MorphSample {
  p: number;
  from: LayoutId;
  to: LayoutId;
  direction: 1 | 0 | -1;
  done: boolean;
  release: number;
  gather: number;
  reveal: number;
  collapse: number;
  ringFactor: number;
  ringCenter: [number, number];
  ringRadius: number;
  ringStrength: number;
  silhouetteCenter: [number, number];
  silhouetteRadius: number;
  silhouetteStrength: number;
  heroOpacityIn: number;
  heroScaleIn: number;
  heroOpacityOut: number;
  heroScaleOut: number;
  degraded: boolean;
}

export interface MorphDegradeState {
  degraded: boolean;
  consecutiveOverBudget: number;
  longTaskFrames: number;
  maxFrameMs: number;
  degradedAtMs: number | null;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const windowRaw = (p: number, w: readonly [number, number]): number =>
  clamp01((p - w[0]) / (w[1] - w[0]));
const windowEased = (p: number, w: readonly [number, number]): number =>
  easeSignature(windowRaw(p, w));
const trackEase = cubicBezier(...T.curve.track);
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

function restSnapshot(layout: LayoutId): MorphSnapshot {
  const d = descriptorForLayout(layout);
  return {
    center: [...d.anchor],
    silhouetteCenter: [...d.silhouetteCenter],
    ringRadius: 0,
    ringStrength: 0,
    silhouetteRadius: 0,
    silhouetteStrength: 0,
  };
}

function snapshotFromSample(sample: MorphSample): MorphSnapshot {
  return {
    center: [...sample.ringCenter],
    silhouetteCenter: [...sample.silhouetteCenter],
    ringRadius: sample.ringRadius,
    ringStrength: sample.ringStrength,
    silhouetteRadius: sample.silhouetteRadius,
    silhouetteStrength: sample.silhouetteStrength,
  };
}

export interface MorphController {
  readonly from: LayoutId;
  readonly to: LayoutId;
  navigate: (to: LayoutId, nowMs: number, snapshot?: MorphSnapshot) => void;
  navigateReduced: (to: LayoutId, nowMs: number) => void;
  sample: (nowMs: number) => MorphSample;
  observeFrame: (dtMs: number, nowMs: number) => void;
  forceDegrade: () => void;
  degradeState: () => MorphDegradeState;
  descriptorFor: (layout: LayoutId) => HeroDescriptor;
}

export function createMorphController(initial: LayoutId): MorphController {
  let from: LayoutId = initial;
  let to: LayoutId = initial;
  let startMs = 0;
  let durationMs = T.motion.ms.travel;
  let snapshot: MorphSnapshot = restSnapshot(initial);
  let jumped = true;
  let lastSample: MorphSample | null = null;
  let degraded = false;
  let degradedLogged = false;
  let degradedAtMs: number | null = null;
  let consecutiveOverBudget = 0;
  let longTaskFrames = 0;
  let maxFrameMs = 0;

  function directionFor(a: LayoutId, b: LayoutId): 1 | 0 | -1 {
    const oa = KEYMAP_ORDER[a];
    const ob = KEYMAP_ORDER[b];
    if (oa === undefined || ob === undefined) return 0;
    return ob > oa ? 1 : ob < oa ? -1 : 0;
  }

  function sample(nowMs: number): MorphSample {
    const morph = T.motion.morph;
    const p = jumped ? 1 : clamp01((nowMs - startMs) / durationMs);
    const done = p >= 1;
    const release = windowEased(p, morph.release);
    const gather = windowEased(p, morph.gather);
    const gatherRaw = windowRaw(p, morph.gather);
    const reveal = windowEased(p, morph.reveal);
    const collapse = windowEased(p, COLLAPSE_WINDOW);
    const toDesc = descriptorForLayout(to);
    const fromDesc = descriptorForLayout(from);
    const toProject = toDesc.kind === 'mark';
    const fromProject = fromDesc.kind === 'mark';
    const blend = toProject ? gather : collapse;
    // Ring envelope per case (see the header note).
    let ringFactor: number;
    if (toProject && fromProject) {
      const breath =
        1 - (1 - T.morph.ringBreath) * Math.sin(Math.PI * gatherRaw);
      const handoff = windowEased(p, [morph.gather[1], 1]);
      ringFactor = breath * (1 - handoff);
    } else if (toProject) {
      ringFactor = gather * (1 - reveal);
    } else if (fromProject) {
      ringFactor = 1 - collapse;
    } else {
      ringFactor = 0;
    }
    // Anchor travel: project to project moves the center between
    // anchors on curve.track from the snapshot center; travel to a
    // project grows at the target anchor; travel to a field collapses
    // in place at the snapshot center.
    let ringCenter: [number, number];
    let silhouetteCenter: [number, number];
    if (toProject && fromProject) {
      const t = trackEase(p);
      ringCenter = [
        mix(snapshot.center[0], toDesc.anchor[0], t),
        mix(snapshot.center[1], toDesc.anchor[1], t),
      ];
      silhouetteCenter = [
        mix(snapshot.silhouetteCenter[0], toDesc.silhouetteCenter[0], t),
        mix(snapshot.silhouetteCenter[1], toDesc.silhouetteCenter[1], t),
      ];
    } else if (toProject) {
      ringCenter = [...toDesc.anchor];
      silhouetteCenter = [...toDesc.silhouetteCenter];
    } else {
      ringCenter = [...snapshot.center];
      silhouetteCenter = [...snapshot.silhouetteCenter];
    }
    const ringRadius = toProject
      ? toDesc.ringRadius
      : snapshot.ringRadius * (1 - collapse);
    const silhouetteRadius = toProject
      ? toDesc.silhouetteRadius
      : snapshot.silhouetteRadius * (1 - collapse);
    // Strength blends from the snapshot so a retarget never jumps:
    // at p 0 the blend weight is 0 and the sample equals the snapshot.
    // The project-to-project breath factor starts at 1, so its target
    // term is additionally gated by Gather: without that gate the
    // breath would jump the strength to full at the retarget instant
    // instead of growing from the snapshot.
    const targetFactor =
      toProject && fromProject ? ringFactor * gather : ringFactor;
    const ringStrength =
      snapshot.ringStrength * (1 - blend) +
      (toProject ? toDesc.ringRadius * 0.5 * targetFactor : 0);
    const pullTarget = degraded ? 0 : T.morph.silhouettePull;
    const silhouetteStrength =
      snapshot.silhouetteStrength * (1 - blend) +
      (toProject ? pullTarget * targetFactor : 0);
    // Hero loom and recede (W6 consumes these; no hero is mounted in
    // W5, so they are computed state, not rendered output).
    const heroOpacityIn = toProject ? reveal : 0;
    const heroScaleIn = toProject
      ? mix(T.morph.loomFrom, 1, reveal)
      : 1;
    const recede = windowEased(p, RECEDE_WINDOW);
    const heroOpacityOut = fromProject ? 1 - recede : 0;
    const heroScaleOut = fromProject ? mix(1, T.morph.recedeTo, recede) : 1;
    const out: MorphSample = {
      p,
      from,
      to,
      direction: directionFor(from, to),
      done,
      release,
      gather,
      reveal,
      collapse,
      ringFactor,
      ringCenter,
      ringRadius,
      ringStrength,
      silhouetteCenter,
      silhouetteRadius,
      silhouetteStrength,
      heroOpacityIn,
      heroScaleIn,
      heroOpacityOut,
      heroScaleOut,
      degraded,
    };
    lastSample = out;
    return out;
  }

  return {
    get from() {
      return from;
    },
    get to() {
      return to;
    },
    navigate(next: LayoutId, nowMs: number, snap?: MorphSnapshot): void {
      const base =
        snap ?? (lastSample ? snapshotFromSample(lastSample) : restSnapshot(to));
      from = to;
      to = next;
      startMs = nowMs;
      durationMs = T.motion.ms.travel;
      snapshot = base;
      jumped = false;
    },
    navigateReduced(next: LayoutId, nowMs: number): void {
      from = to;
      to = next;
      startMs = nowMs;
      durationMs = T.motion.ms.travel;
      snapshot = restSnapshot(next);
      jumped = true;
      lastSample = null;
    },
    sample,
    observeFrame(dtMs: number, nowMs: number): void {
      if (dtMs > maxFrameMs) maxFrameMs = dtMs;
      if (dtMs > T.perf.longTaskMs) longTaskFrames += 1;
      // Only frames inside a morph count toward the degrade latch.
      if (jumped || lastSample === null || lastSample.done) return;
      if (dtMs > T.perf.p95Ms) {
        consecutiveOverBudget += 1;
      } else {
        consecutiveOverBudget = 0;
      }
      if (!degraded && consecutiveOverBudget >= T.perf.degradeFrames) {
        degraded = true;
        degradedAtMs = nowMs;
        if (!degradedLogged) {
          degradedLogged = true;
          console.info(
            '[morph] degrade latched: silhouette pull 0 for session',
          );
        }
      }
    },
    forceDegrade(): void {
      if (degraded) return;
      degraded = true;
      degradedAtMs = null;
      if (!degradedLogged) {
        degradedLogged = true;
        console.info('[morph] degrade latched: silhouette pull 0 for session');
      }
    },
    degradeState(): MorphDegradeState {
      return {
        degraded,
        consecutiveOverBudget,
        longTaskFrames,
        maxFrameMs,
        degradedAtMs,
      };
    },
    descriptorFor(layout: LayoutId): HeroDescriptor {
      return descriptorForLayout(layout);
    },
  };
}
