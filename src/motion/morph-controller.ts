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
// Polish round (DESIGN 1.2.0, section 6.7): three inputs make the
// morph land flush on the page instead of on fixed world anchors.
// - anchorFor(layout) resolves a hero anchor for this frame. The
//   lanefield passes a resolver that ground-projects the placed hero
//   center through the current camera, so the ring and silhouette sit
//   under the logo on screen in every frame. A resolver that returns
//   null means the anchor is not known yet: the ring stays at zero for
//   that target, so a ring never renders at an unplaced position. The
//   Gather window then starts at the first frame the anchor exists
//   (never earlier than motion.morph.gather[0]), so the ring grows from
//   zero instead of jumping. With no resolver (the pure tests), the
//   hero descriptor anchors are used exactly as before.
// - origin: navigate may pass a ground point the ring departs from
//   (the pressed keymap item, ground-projected per frame through
//   groundAt). Field to project morphs move the ring center from the
//   origin to the anchor on curve.track over Gather.
// - entropy: navigate may pass a seeded MorphEntropy (bow, swirl,
//   pull scale). The sample carries bowFactor (sin of pi times the
//   signature-eased progress, zero at both ends) and ringSwirl; the
//   silhouette pull target scales by pullScale. Neutral entropy gives
//   the pre-polish envelope exactly.
// Hero loom uses motion.morph.loom and recede uses motion.morph.recede
// (tokens), so the outgoing mark is gone before the readout swap and
// the incoming mark looms in while the camera settles, before the text.
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
import { NEUTRAL_ENTROPY, type MorphEntropy } from './entropy';
import type { LayoutId } from '../world/types';

// Keymap order (S03 section 6): server 1, leaflink 2, sidequests 3.
// The whoami sheet is W, a sheet over the current scene, not a route,
// so it has no layout here and no morph.
const KEYMAP_ORDER: Partial<Record<LayoutId, number>> = {
  server: 0,
  leaflink: 1,
  sidequests: 2,
};

// DESIGN section 6.7 window that is a prose constant, not a token:
// the ring collapse window for travel to a field route. The recede
// and loom windows are tokens (motion.morph.recede, motion.morph.loom).
const COLLAPSE_WINDOW: [number, number] = [0.2, 0.8];

export interface MorphAnchor {
  center: [number, number];
  ringRadius: number;
  silhouetteRadius: number;
}

export interface MorphOptions {
  anchorFor?: (layout: LayoutId) => MorphAnchor | null;
  groundAt?: (px: [number, number]) => [number, number] | null;
}

export interface MorphNavigateOptions {
  originPx?: [number, number] | null;
  entropy?: MorphEntropy;
}

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
  bowFactor: number;
  bow: number;
  ringSwirl: number;
  anchorReady: boolean;
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
  navigate: (
    to: LayoutId,
    nowMs: number,
    snapshot?: MorphSnapshot,
    navOpts?: MorphNavigateOptions,
  ) => void;
  navigateReduced: (to: LayoutId, nowMs: number) => void;
  sample: (nowMs: number) => MorphSample;
  observeFrame: (dtMs: number, nowMs: number) => void;
  forceDegrade: () => void;
  degradeState: () => MorphDegradeState;
  descriptorFor: (layout: LayoutId) => HeroDescriptor;
}

function descriptorAnchor(layout: LayoutId): MorphAnchor {
  const d = descriptorForLayout(layout);
  return {
    center: [...d.anchor],
    ringRadius: d.ringRadius,
    silhouetteRadius: d.silhouetteRadius,
  };
}

// Shared morph completion predicate, single domain, no division.
// Both the controller sample and the lanefield travel check call
// this exact function with the same millisecond start, sample, and
// duration, so their done states cannot disagree in floating point.
// The old split used a seconds-domain ratio in lanefield and a
// millisecond ratio in the controller, which disagreed at
// representable timestamps. Elapsed comparison avoids the division
// rounding entirely.
export function morphTravelDone(startMs: number, nowMs: number, durationMs: number): boolean {
  return nowMs - startMs >= durationMs;
}

export function createMorphController(
  initial: LayoutId,
  opts: MorphOptions = {},
): MorphController {
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
  let originPx: [number, number] | null = null;
  let entropy: MorphEntropy = NEUTRAL_ENTROPY;
  // Travel fraction at which the target anchor first resolved during
  // this morph; null until then. Reset on every navigate.
  let anchorSeenP: number | null = null;

  const resolve = (layout: LayoutId): MorphAnchor | null =>
    opts.anchorFor ? opts.anchorFor(layout) : descriptorAnchor(layout);

  function directionFor(a: LayoutId, b: LayoutId): 1 | 0 | -1 {
    const oa = KEYMAP_ORDER[a];
    const ob = KEYMAP_ORDER[b];
    if (oa === undefined || ob === undefined) return 0;
    return ob > oa ? 1 : ob < oa ? -1 : 0;
  }

  function sample(nowMs: number): MorphSample {
    const morph = T.motion.morph;
    const p = jumped ? 1 : clamp01((nowMs - startMs) / durationMs);
    const done = jumped || morphTravelDone(startMs, nowMs, durationMs);
    const release = windowEased(p, morph.release);
    const toDesc = descriptorForLayout(to);
    const fromDesc = descriptorForLayout(from);
    const toProject = toDesc.kind === 'mark';
    const fromProject = fromDesc.kind === 'mark';
    const toAnchor = toProject ? resolve(to) : null;
    if (toProject && toAnchor && anchorSeenP === null) anchorSeenP = p;
    const anchorReady = !toProject || toAnchor !== null;
    // Gather starts at the later of its token start and the first frame
    // the target anchor resolved, so a late anchor grows from zero.
    const gatherWin: [number, number] = [
      Math.min(Math.max(morph.gather[0], anchorSeenP ?? morph.gather[0]), morph.gather[1] - 0.05),
      morph.gather[1],
    ];
    const gather = anchorReady ? windowEased(p, gatherWin) : 0;
    const gatherRaw = anchorReady ? windowRaw(p, gatherWin) : 0;
    const reveal = windowEased(p, morph.reveal);
    const loom = windowEased(p, morph.loom);
    const collapse = windowEased(p, COLLAPSE_WINDOW);
    const blend = toProject ? gather : collapse;
    // Ring envelope per case (see the header note).
    let ringFactor: number;
    if (toProject && fromProject) {
      const breath =
        1 - (1 - T.morph.ringBreath) * Math.sin(Math.PI * gatherRaw);
      const handoff = windowEased(p, [morph.gather[1], 1]);
      ringFactor = anchorReady ? breath * (1 - handoff) : 0;
    } else if (toProject) {
      ringFactor = gather * (1 - reveal);
    } else if (fromProject) {
      ringFactor = 1 - collapse;
    } else {
      ringFactor = 0;
    }
    // Centers. Project to project moves between anchors on curve.track
    // from the snapshot center; field to project departs from the
    // origin (when given) and lands on the anchor over Gather; travel
    // to a field collapses in place at the snapshot center.
    const toCenter: [number, number] = toAnchor ? toAnchor.center : [...snapshot.center];
    const originGround = originPx && opts.groundAt ? opts.groundAt(originPx) : null;
    let ringCenter: [number, number];
    let silhouetteCenter: [number, number];
    if (toProject && fromProject) {
      const t = trackEase(p);
      ringCenter = [
        mix(snapshot.center[0], toCenter[0], t),
        mix(snapshot.center[1], toCenter[1], t),
      ];
      silhouetteCenter = [
        mix(snapshot.silhouetteCenter[0], toCenter[0], t),
        mix(snapshot.silhouetteCenter[1], toCenter[1], t),
      ];
    } else if (toProject) {
      const t = trackEase(gatherRaw);
      ringCenter = originGround
        ? [mix(originGround[0], toCenter[0], t), mix(originGround[1], toCenter[1], t)]
        : [...toCenter];
      silhouetteCenter = [...toCenter];
    } else {
      ringCenter = [...snapshot.center];
      silhouetteCenter = [...snapshot.silhouetteCenter];
    }
    const ringRadius = toProject
      ? (toAnchor ? toAnchor.ringRadius : 0)
      : snapshot.ringRadius * (1 - collapse);
    const silhouetteRadius = toProject
      ? (toAnchor ? toAnchor.silhouetteRadius : 0)
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
      (toProject ? ringRadius * 0.5 * targetFactor : 0);
    const pullTarget = degraded ? 0 : T.morph.silhouettePull * entropy.pullScale;
    const silhouetteStrength =
      snapshot.silhouetteStrength * (1 - blend) +
      (toProject ? pullTarget * targetFactor : 0);
    // Hero loom (motion.morph.loom) and recede (motion.morph.recede).
    const heroOpacityIn = toProject ? loom : 0;
    const heroScaleIn = toProject
      ? mix(T.morph.loomFrom, 1, loom)
      : 1;
    const recede = windowEased(p, morph.recede);
    const heroOpacityOut = fromProject ? 1 - recede : 0;
    const heroScaleOut = fromProject ? mix(1, T.morph.recedeTo, recede) : 1;
    // Camera bow rides the camera's own curve: zero at both ends.
    const bowFactor = jumped ? 0 : Math.sin(Math.PI * easeSignature(p));
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
      bowFactor,
      bow: entropy.bow,
      ringSwirl: entropy.swirl,
      anchorReady,
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
    navigate(
      next: LayoutId,
      nowMs: number,
      snap?: MorphSnapshot,
      navOpts?: MorphNavigateOptions,
    ): void {
      const base =
        snap ?? (lastSample ? snapshotFromSample(lastSample) : restSnapshot(to));
      from = to;
      to = next;
      startMs = nowMs;
      durationMs = T.motion.ms.travel;
      snapshot = base;
      jumped = false;
      originPx = navOpts?.originPx ?? null;
      entropy = navOpts?.entropy ?? NEUTRAL_ENTROPY;
      // An anchor that already resolves at navigate time (a repeat
      // visit, or the descriptor fallback) is ready from p 0.
      anchorSeenP =
        descriptorForLayout(next).kind === 'mark' && resolve(next) !== null ? 0 : null;
    },
    navigateReduced(next: LayoutId, nowMs: number): void {
      from = to;
      to = next;
      startMs = nowMs;
      durationMs = T.motion.ms.travel;
      snapshot = restSnapshot(next);
      jumped = true;
      lastSample = null;
      originPx = null;
      entropy = NEUTRAL_ENTROPY;
      anchorSeenP = null;
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
