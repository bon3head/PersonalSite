// P-HERO-1 and P-HERO-3 pure geometry: displayed size, placement,
// and passive motion. No DOM, no WebGL, so the same code serves the
// component and the tests.
//
// Displayed size (the W3 open decision, decided here): the size the
// resize-to-displayed-times-3-DPR rule would resize to if an asset
// ever went over budget. It is derived from the tokens, never guessed:
// width is the smallest of hero.sizePx, the width the brand area cap
// allows at this viewport for this mark aspect ratio, and the
// viewport width minus both gutters. Height follows the intrinsic
// aspect ratio. The area cap is a hard gate: where it allows less
// than hero.minSizePx (viewports smaller than the tested phones),
// the cap wins and the hero shrinks below minSizePx rather than
// breaking the cap or overflowing the viewport. On the three tested
// phones both hold: LeafLink cap widths are 173, 198, and 219 px,
// all above minSizePx 160, and SideQuests is capped by sizePx 280
// on every phone.
//
// Placement: a grid search over top-left positions, scored by the
// smallest clearance to any blocker (name clear zone, readout,
// keymap, marker tap targets, viewport edges), capped, minus a
// small pull toward the viewport center. The search runs on the
// measured DOM rects, so it holds on every viewport the readout
// occupies, including the narrow 375 px phone where the
// LeafLink readout leaves only the band above it and the
// SideQuests readout leaves only the band below it. Blockers are
// expanded by the motion margin before the search, so the beat
// scale and the wander drift can never push the moving rect into
// a blocker: the rest rect already clears every blocker by at
// least the motion margin, and the motion amplitude is smaller
// than that margin (see heroMotion below).
import { T } from '../tokens.generated';

export type HeroProject = 'leaflink' | 'sidequests';

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PlacedRect extends Rect {
  width: number;
  height: number;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function expandRect(r: Rect, margin: number): Rect {
  return {
    left: r.left - margin,
    top: r.top - margin,
    right: r.right + margin,
    bottom: r.bottom + margin,
  };
}

function gutterFor(vw: number): number {
  const g = T.space.gutterPx;
  if (vw >= 1280) return g.from1280;
  if (vw >= 640) return g.from640;
  return g.base;
}

// Displayed size from tokens plus viewport plus intrinsic aspect.
// scaleHeadroom is the peak passive scale of the project (LeafLink
// beatScale, 1 for SideQuests): the area cap must hold at the beat
// peak too, not only at rest, so the area width is divided by the
// headroom before the min, which keeps peak area at or under the
// cap. At 375 px wide the LeafLink width is 170 px after headroom,
// still above minSizePx 160.
export function heroDisplayedSize(
  vw: number,
  vh: number,
  intrinsicW: number,
  intrinsicH: number,
  scaleHeadroom = 1,
): { width: number; height: number; areaRatio: number; cappedByArea: boolean } {
  const aspectHOverW = intrinsicH / intrinsicW;
  const capArea = T.brand.areaCap * vw * vh;
  const maxWByArea = Math.sqrt(capArea / aspectHOverW) / scaleHeadroom;
  const maxWByViewport = vw - 2 * gutterFor(vw);
  const width = Math.min(T.hero.sizePx, maxWByArea, maxWByViewport);
  const height = width * aspectHOverW;
  return {
    width,
    height,
    areaRatio: (width * height) / (vw * vh),
    cappedByArea: maxWByArea < T.hero.sizePx,
  };
}

// Motion margin per project: the largest excursion the passive
// motion can add to the rest rect, plus slack. LeafLink beat scale
// expands a 280 px mark by (beatScale - 1) / 2 on each side, about
// 2.1 px; SideQuests wander drift is 8 px across and 6 px down
// (heroMotion), so its margin is 12 px.
export function heroMotionMargin(project: HeroProject): number {
  return project === 'sidequests' ? 12 : 8;
}

// Grid search for the best top-left. Step 8 px keeps the search
// under 20k candidates even at desktop size. Blockers are expanded
// by the motion margin by the caller (see placeHero), so a feasible
// candidate keeps its moving rect clear of every blocker.
export function placeHero(
  vw: number,
  vh: number,
  w: number,
  h: number,
  blockers: Rect[],
  motionMargin: number,
): PlacedRect {
  const expanded = blockers.map((b) => expandRect(b, motionMargin));
  const cx = vw / 2;
  const cy = vh / 2;
  let best: PlacedRect | null = null;
  let bestScore = -Infinity;
  const step = 8;
  for (let top = 0; top + h <= vh; top += step) {
    for (let left = 0; left + w <= vw; left += step) {
      const rect: PlacedRect = { left, top, right: left + w, bottom: top + h, width: w, height: h };
      let feasible = true;
      let minGap = Infinity;
      for (const b of expanded) {
        if (rectsIntersect(rect, b)) {
          feasible = false;
          break;
        }
        // Separation gap on the separating axis (rects do not
        // overlap, so at least one axis separates them).
        const gapX = Math.max(b.left - rect.right, rect.left - b.right, 0);
        const gapY = Math.max(b.top - rect.bottom, rect.top - b.bottom, 0);
        const gap = Math.max(gapX, gapY);
        if (gap < minGap) minGap = gap;
      }
      if (!feasible) continue;
      // Viewport edge clearance counts the same way.
      const edgeGap = Math.min(rect.left, rect.top, vw - rect.right, vh - rect.bottom);
      if (edgeGap < minGap) minGap = edgeGap;
      const cappedGap = Math.min(minGap, 64);
      const distCenter = Math.hypot(rect.left + w / 2 - cx, rect.top + h / 2 - cy);
      const score = cappedGap - 0.04 * distCenter;
      if (score > bestScore) {
        bestScore = score;
        best = rect;
      }
    }
  }
  if (best) return best;
  // No fully clear position exists (should not happen on the tested
  // viewports): fall back to centered, so the hero still renders
  // instead of vanishing.
  return {
    left: Math.max(0, (vw - w) / 2),
    top: Math.max(0, (vh - h) / 2),
    right: Math.min(vw, (vw + w) / 2),
    bottom: Math.min(vh, (vh + h) / 2),
    width: w,
    height: h,
  };
}

// Distance from a point to the nearest blocker edge (0 inside one).
// The hero clamps its ring radius to this, so the bulge never reaches
// the readout, the name zone, or the keymap.
export function clearanceFrom(x: number, y: number, blockers: Rect[]): number {
  let best = Infinity;
  for (const b of blockers) {
    const dx = Math.max(b.left - x, 0, x - b.right);
    const dy = Math.max(b.top - y, 0, y - b.bottom);
    const d = Math.hypot(dx, dy);
    if (d < best) best = d;
  }
  return best;
}

// Stage focus spots (DESIGN 6.12, polish round): the screen points
// the coarse camera pan may bring the subject to. Not the mark center:
// the claimed marker would then land under the mark, and the mark (a
// tap target) would cover the marker's tap target (T-HERO-BAND-WALK).
// One spot above and one below the mark, each kept only if it fits
// clear of the readout, name zone, and keymap. The caller picks the
// spot on the subject's own side, so the pan is short (inside
// focus.maxPanWorld) and never drags the subject across the mark.
export function focusSpotsFor(
  mark: Rect,
  vw: number,
  vh: number,
  blockers: Rect[],
  project: HeroProject,
): Array<[number, number]> {
  const half = T.size.coarseMinTargetPx / 2;
  // Marker center to mark edge: the marker's own half target, one more
  // half target of separation (the damped pan can leave the subject
  // short of the spot while it settles), the ring pad, and the mark's
  // motion margin (it drifts by that much).
  const gap = 2 * half + T.hero.ringPadPx + heroMotionMargin(project);
  const cx = (mark.left + mark.right) / 2;
  const out: Array<[number, number]> = [];
  for (const y of [mark.top - gap, mark.bottom + gap]) {
    if (y - half < 0 || y + half > vh || cx - half < 0 || cx + half > vw) continue;
    if (clearanceFrom(cx, y, blockers) >= half) out.push([cx, y]);
  }
  return out;
}

// True when moving a coarse target in a straight line from `from` to
// `to` would pass over the mark (expanded by the motion margin and the
// target's half size). A pan moves the whole plan in a straight line,
// so such a pan would sweep the subject under the mark.
export function pathCrossesMark(
  from: [number, number],
  to: [number, number],
  mark: Rect,
  project: HeroProject,
): boolean {
  const pad = T.size.coarseMinTargetPx / 2 + heroMotionMargin(project);
  const steps = 32; // lit-ok: segment samples, at most a few px apart on a phone
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const x = from[0] + (to[0] - from[0]) * k;
    const y = from[1] + (to[1] - from[1]) * k;
    if (x > mark.left - pad && x < mark.right + pad && y > mark.top - pad && y < mark.bottom + pad) return true;
  }
  return false;
}

// The spot nearest the subject's current screen position.
export function nearestSpot(
  spots: Array<[number, number]>,
  at: [number, number],
): [number, number] | null {
  let best: [number, number] | null = null;
  let d = Infinity;
  for (const s of spots) {
    const k = Math.hypot(s[0] - at[0], s[1] - at[1]);
    if (k < d) {
      d = k;
      best = s;
    }
  }
  return best;
}

// Passive motion (DESIGN sections 6.3 and 6.8), pure functions of time
// so tests can pin them exactly.
//
// LeafLink beat (polish round): event driven, never periodic. DESIGN
// 6.3 says the LeafLink heartbeat is "event-driven at irregular
// intervals ... never periodic"; the shipped beat was a fixed-period
// sine at the interval midpoint, which contradicted it. A beat is now
// one smooth bump of duration motion.ms.medium, started by a stage
// event (a match landing), peak 1 + amplitude. Overlapping beats take
// the larger value, so a burst of matches reads as one strong beat.
export function heroBeatEnvelope(msSinceBeat: number, amplitude: number): number {
  const d = T.motion.ms.medium;
  if (msSinceBeat < 0 || msSinceBeat >= d) return 1;
  return 1 + amplitude * Math.sin((Math.PI * msSinceBeat) / d);
}

// SideQuests wander: drift along a slow path at the marker bob period,
// settling with the existing spring shape (a sine pair, no overshoot
// on the hero itself; the spring belongs to the markers).

export function heroWanderOffsetAt(tMs: number): { dx: number; dy: number } {
  const periodMs = T.world.sidequests.marker.bobPeriodSec * 1000;
  const phase = (2 * Math.PI * tMs) / periodMs;
  return { dx: 8 * Math.sin(phase), dy: 6 * Math.cos(phase) };
}
