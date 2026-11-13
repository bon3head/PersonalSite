// Pins (DESIGN 6.14 Pins, 1.9.0). A signature is a pin: a disc on a
// lane tip with the name beside it as one straight label, linked into
// the lines by the guestbook.pin.linkLanes lanes nearest it. Every
// signature stored in this browser is a pin on every scene, all the
// time; the layer hides only while the guestbook sheet is open (the
// director's signing pin stands in for it there).
//
// The rest spot: the sign seed and the scene's camera target decide the
// candidates (pinSpots); a candidate counts only if the pin and its
// name land in the clear part of the screen (inside --jp-gutter, above
// the keymap, off the readout, the wordmark and the brand mark) and on
// a lane no server node holds. The pin the sheet just signed glides
// from where it stood to its spot (handoff).
import { T } from '../tokens.generated';
import type { GuestbookHooks, Lanefield } from '../world/types';
import { cubicBezier } from '../world/tween';
import { hash32 } from './entropy';
import { markPoolHex, type MarkRegime } from './markPool';

const PN = T.guestbook.pin;
const UINT32 = 4294967296; // lit-ok: 2^32, hash to unit
const easeMain = cubicBezier(...T.guestbook.easeMain);

// hash32(signSeed, PARAM, k) ids for the rest spot candidates.
export const PIN_PARAM = { angle: 9, radius: 10 } as const; // lit-ok: hash32 param ids

export type Vec3 = [number, number, number];

export interface PinSpot {
  lane: number;
  point: Vec3;
  // The pin's own lane first, then the nearest others (linkLanes in all).
  links: number[];
}

function u(seed: number, param: number, index: number): number {
  return hash32(seed, param, index) / UINT32;
}

const tipTmp: Vec3 = [0, 0, 0];

// The pin's own lane, then the lanes whose tips are nearest its point.
export function linkLanesFor(gb: GuestbookHooks, lane: number, point: Vec3, taken: ReadonlySet<number>): number[] {
  const links = [lane];
  const ex = new Set(taken);
  ex.add(lane);
  while (links.length < PN.linkLanes) {
    const l = gb.nearestLane(point[0], point[2], ex);
    if (l < 0) break;
    links.push(l);
    ex.add(l);
  }
  return links;
}

// The lane tip nearest a ground point, as a spot with its link lanes.
export function spotNear(gb: GuestbookHooks, x: number, z: number): PinSpot | null {
  const lane = gb.nearestLane(x, z, new Set());
  if (lane < 0) return null;
  gb.laneTip(lane, tipTmp);
  const point: Vec3 = [tipTmp[0], tipTmp[1], tipTmp[2]];
  return { lane, point, links: linkLanesFor(gb, lane, point, new Set()) };
}

// Rest spots for seeds given newest first (DESIGN 6.14 Pins: rest spot).
// accept(point, i, earlier) is the screen test for pin i against the
// spots already placed; the first candidate
// that passes it and keeps the gap wins, else the first that passes it,
// else the last candidate.
export function pinSpots(
  gb: GuestbookHooks,
  seeds: readonly number[],
  accept: (point: Vec3, index: number, earlier: readonly Vec3[]) => boolean = () => true,
  blocked: ReadonlySet<number> = new Set(),
): PinSpot[] {
  const f = gb.restFrame();
  const d = f.distance;
  const cx = f.target[0];
  const cz = f.target[2];
  const [r0, r1] = PN.restRadiusFrac;
  const gap = d * PN.minGapFrac;
  const taken = new Set<number>(blocked);
  const out: PinSpot[] = [];
  seeds.forEach((seed, index) => {
    let lane = -1;
    let point: Vec3 = [0, 0, 0];
    let clearLane = -1;
    let clearPoint: Vec3 = [0, 0, 0];
    for (let k = 0; k < PN.tries; k++) {
      const a = u(seed, PIN_PARAM.angle, k) * Math.PI * 2;
      const r = d * (r0 + (r1 - r0) * u(seed, PIN_PARAM.radius, k));
      const l = gb.nearestLane(cx + Math.cos(a) * r, cz + Math.sin(a) * r, taken);
      if (l < 0) break;
      gb.laneTip(l, tipTmp);
      const p: Vec3 = [tipTmp[0], tipTmp[1], tipTmp[2]];
      lane = l;
      point = p;
      if (!accept(p, index, out.map((o) => o.point))) continue;
      if (clearLane < 0) {
        clearLane = l;
        clearPoint = p;
      }
      if (out.every((o) => Math.hypot(o.point[0] - p[0], o.point[1] - p[1], o.point[2] - p[2]) >= gap)) {
        clearLane = l;
        clearPoint = p;
        break;
      }
    }
    if (clearLane >= 0) {
      lane = clearLane;
      point = clearPoint;
    }
    if (lane < 0) return;
    taken.add(lane);
    const links = linkLanesFor(gb, lane, point, taken);
    for (const l of links) taken.add(l);
    out.push({ lane, point, links });
  });
  return out;
}

// Handoff: the pin the sheet signed last, and where it stood when the
// sheet closed. The layer glides it from there to its rest spot.
// It waits for the seed to reach the ledger, at most motion.ms.wordCadence.
let handoff: { seed: number; point: Vec3; at: number } | null = null;
export function setHandoff(seed: number, point: Vec3): void {
  handoff = { seed, point: [...point], at: performance.now() };
}

// Link offsets: each link lane's tip bends into the pin point by amount.
// Appends to lanes and offsets (xyz per lane).
export function pushLinks(
  gb: GuestbookHooks,
  links: readonly number[],
  point: Vec3,
  amount: number,
  lanes: number[],
  offsets: number[],
): void {
  if (amount <= 0) return;
  for (const l of links) {
    gb.laneTip(l, tipTmp);
    lanes.push(l);
    offsets.push((point[0] - tipTmp[0]) * amount, (point[1] - tipTmp[1]) * amount, (point[2] - tipTmp[2]) * amount);
  }
}

// Label widths are measured once per text, so placing never forces layout.
const widths = new WeakMap<HTMLElement, { text: string; w: number }>();

// --jp-gutter in CSS px (it steps up with the viewport).
export function gutterPx(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--jp-gutter'));
  return Number.isFinite(v) && v > 0 ? v : T.space.gutterPx.base;
}

// Place a pin element (.jp-pin, holding .jp-pin-label) with its disc
// center at screen (x, y); the label flips left when it would cross the
// right edge minus the gutter. --jp-pin-room is the width left for text
// on the label's side (the signature's line wraps inside it).
export function placePin(el: HTMLElement, x: number, y: number, vw: number, gutter: number): [number, number] {
  const label = el.querySelector<HTMLElement>('.jp-pin-label');
  let w = 0;
  if (label) {
    const text = label.textContent ?? '';
    const known = widths.get(label);
    if (known && known.text === text) w = known.w;
    else {
      w = label.offsetWidth;
      widths.set(label, { text, w });
    }
  }
  const flip = x + PN.radiusPx + PN.gapPx + w > vw - gutter;
  const want = flip ? 'true' : 'false';
  if (el.dataset.flip !== want) el.dataset.flip = want;
  const room = Math.max(0, Math.round(flip ? x - PN.radiusPx - PN.gapPx - gutter : vw - gutter - x - PN.radiusPx - PN.gapPx));
  const roomPx = `${room}px`;
  if (el.style.getPropertyValue('--jp-pin-room') !== roomPx) el.style.setProperty('--jp-pin-room', roomPx);
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  return [x, y];
}

export function regimeNow(): MarkRegime {
  return document.documentElement.dataset.regime === 'paper' ? 'paper' : 'dark';
}

export interface PinDebug {
  seed: number;
  lane: number;
  point: Vec3;
  screen: [number, number];
  links: number[];
  color: string;
}

export interface PinsDebug {
  active: boolean;
  link: number;
  // Re-picks so far, and why the last one ran (frame, fit).
  repicks: number;
  why: string;
  pins: PinDebug[];
}

export interface PinsLayer {
  // Seeds newest first, in the same order as the layer's [data-pin] items.
  setSeeds(seeds: readonly number[]): void;
  dispose(): void;
}

// The pins layer controller: rest spots per scene, link lanes, and
// the position and color of each [data-pin] element under list.
export function createPinsLayer(field: Lanefield, list: HTMLElement): PinsLayer {
  const gb = field.guestbook ?? null;
  const words = field.words ?? null;
  let seeds: number[] = [];
  let spots: PinSpot[] = [];
  // key: the frame the spots were picked for; seen: last frame's key.
  // A changed key is re-picked only once it holds for a frame, so a
  // travel (the rest frame moves every frame) never re-picks mid-morph:
  // the pins ride their lanes through it and re-pick on arrival.
  let key = '';
  let seen = '';
  let active = false;
  let linkFrom = 0;
  let linkStart = 0;
  let wroteLanes = false;
  let gutter: number = T.space.gutterPx.base;
  const glides = new Map<number, { from: Vec3; start: number }>();
  // Whether each spot passed the accept test when it was picked.
  let fit: boolean[] = [];
  let repicks = 0;
  let why = '';
  const pt: Vec3 = [0, 0, 0];

  const nowMs = (): number => field.now() * 1000; // lit-ok: seconds to ms
  const reduced = (): boolean => gb?.reduced() ?? true;
  const dur = (ms: number): number => (reduced() ? 0 : ms);
  const isOpen = (): boolean => document.documentElement.dataset.gb === 'open';

  function linkValue(t: number): number {
    const d = dur(T.guestbook.ms.letter);
    if (d <= 0) return 1;
    const k = Math.max(0, Math.min(1, (t - linkStart) / d));
    return linkFrom + (1 - linkFrom) * easeMain(k);
  }

  // Screen boxes a pin must stay off (readout, wordmark, brand mark).
  function blockers(): DOMRect[] {
    // Fixed elements have no offsetParent, so test the box itself.
    return Array.from(document.querySelectorAll<HTMLElement>('.jp-readout, .jp-readout-slip, .jp-wordmark, .jp-hero'))
      .filter((el) => !el.hidden)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
  }

  // loose: the at-rest recheck. It skips the edges (the idle sway moves a
  // pin a few px) and shrinks the pin's box by pin.gapPx, so only a box
  // that really lands on a pin (a readout laid out late) moves it.
  function accepter(loose = false): (point: Vec3, index: number, earlier?: readonly Vec3[]) => boolean {
    const [vw, vh] = field.viewportCss();
    const m = gutter;
    const keymap = list.getBoundingClientRect().bottom;
    const boxes = blockers();
    // Labels are laid out (visibility hidden until placed), so widths are real.
    const items = list.querySelectorAll<HTMLElement>('[data-pin] .jp-pin-label');
    const half = PN.hitPx / 2;
    // The pin's box: disc plus name, label on the side that fits; tall is
    // the hit box, short is what shows (disc and label line).
    const box = (point: Vec3, index: number, tall: boolean): [number, number, number, number] => {
      const [x, y] = field.worldToScreen(point);
      const w = items[index]?.offsetWidth ?? 0;
      const right = x + PN.radiusPx + PN.gapPx + w;
      const flip = right > vw - m;
      const x0 = flip ? x - PN.radiusPx - PN.gapPx - w : x - PN.radiusPx;
      const x1 = flip ? x + PN.radiusPx : right;
      const h = tall ? half : Math.max(PN.radiusPx, (items[index]?.offsetHeight ?? 0) / 2);
      return [x0, y - h, x1, y + h];
    };
    return (point, index, earlier = []) => {
      const [x0, y0, x1, y1] = box(point, index, true);
      if (loose) {
        const g = PN.gapPx;
        return boxes.every((b) => x1 - g < b.left || x0 + g > b.right || y1 - g < b.top || y0 + g > b.bottom);
      }
      if (x0 < m || x1 > vw - m || y0 < m || y1 > Math.min(vh, keymap) - m) return false;
      if (!boxes.every((b) => x1 < b.left || x0 > b.right || y1 < b.top || y0 > b.bottom)) return false;
      // Off every earlier pin's visible box, by pin.gapPx.
      const [s0, t0, s1, t1] = box(point, index, false);
      const g = PN.gapPx;
      return earlier.every((e, j) => {
        const [e0, f0, e1, f1] = box(e, j, false);
        return s1 + g < e0 || s0 - g > e1 || t1 + g < f0 || t0 - g > f1;
      });
    };
  }

  // Lanes the server nodes hold: a pin never takes one (K-SRV-7).
  function nodeLanes(): Set<number> {
    const held = new Set<number>();
    if (!words) return held;
    for (let l = 0; l < T.world.laneCount; l++) if (words.nodeHeld(l)) held.add(l);
    return held;
  }

  function recompute(t: number): void {
    if (!gb) return;
    gutter = gutterPx();
    const before = new Map<number, Vec3>();
    spots.forEach((s, i) => before.set(seeds[i] ?? -1, [...s.point]));
    const prevLanes = spots.map((s) => s.links.join(','));
    const acc = accepter();
    spots = pinSpots(gb, seeds, acc, nodeLanes());
    fit = spots.map((s, i) => acc(s.point, i, spots.slice(0, i).map((o) => o.point)));
    // A pin that moved glides from where it was; link lanes that changed
    // ease in again, so nothing snaps.
    let relinked = false;
    spots.forEach((s, i) => {
      const from = before.get(seeds[i]);
      if (from && Math.hypot(from[0] - s.point[0], from[1] - s.point[1], from[2] - s.point[2]) > 0) {
        glides.set(i, { from, start: t });
      }
      if (prevLanes[i] !== undefined && prevLanes[i] !== s.links.join(',')) relinked = true;
    });
    if (relinked) {
      linkFrom = 0;
      linkStart = t;
    }
  }

  function frameKey(): string {
    if (!gb) return '';
    const f = gb.restFrame();
    const [vw, vh] = field.viewportCss();
    return `${f.target.map((v) => v.toFixed(3)).join(',')}|${f.distance.toFixed(3)}|${vw}x${vh}|${seeds.join(',')}`;
  }

  function publish(link: number, screens: [number, number][]): void {
    const dbg: PinsDebug = {
      active,
      repicks,
      why,
      link,
      pins: spots.map((s, i) => ({
        seed: seeds[i],
        lane: s.lane,
        point: [...s.point],
        screen: screens[i] ?? [NaN, NaN],
        links: [...s.links],
        color: markPoolHex(regimeNow(), seeds[i]),
      })),
    };
    (window as unknown as { __pins?: PinsDebug }).__pins = dbg;
  }

  function frame(): void {
    if (!gb) return;
    if (isOpen()) {
      // The director owns the guestbook lanes while the sheet is open.
      active = false;
      wroteLanes = false;
      return;
    }
    const t = nowMs();
    if (!active) {
      // Back from the sheet: re-pick (the server nodes took their lanes
      // back first) and ease the link lanes in.
      active = true;
      linkFrom = 0;
      linkStart = t;
      key = '';
      seen = '';
    }
    const k = frameKey();
    if (k !== key && (k === seen || reduced() || key === '')) {
      const first = key === '';
      key = k;
      repicks++;
      why = 'frame';
      recompute(t);
      if (first) glides.clear();
    }
    seen = k;
    // At rest, a pin that fit when picked but no longer does (the readout
    // laid out late on a deep link, a font swapped in) re-picks.
    if (k === key && glides.size === 0 && fit.some(Boolean)) {
      const acc = accepter(true);
      if (spots.some((s, i) => fit[i] && !acc(s.point, i))) {
        repicks++;
        why = 'fit';
        recompute(t);
      }
    }
    // The pin the sheet just signed glides from where it stood.
    if (handoff) {
      const i = seeds.indexOf(handoff.seed);
      if (i >= 0) {
        glides.set(i, { from: handoff.point, start: t });
        handoff = null;
      } else if (performance.now() - handoff.at > T.motion.ms.wordCadence) {
        handoff = null;
      }
    }
    const link = linkValue(t);
    const lanes: number[] = [];
    const offsets: number[] = [];
    const items = list.querySelectorAll<HTMLElement>('[data-pin]');
    const [vw] = field.viewportCss();
    const regime = regimeNow();
    const screens: [number, number][] = [];
    const d = dur(T.motion.ms.travel);
    spots.forEach((s, i) => {
      // The pin rides its lane's current tip (travel morphs it).
      gb.laneTip(s.lane, pt);
      s.point[0] = pt[0];
      s.point[1] = pt[1];
      s.point[2] = pt[2];
      const gl = glides.get(i);
      if (gl) {
        const e = d <= 0 ? 1 : easeMain(Math.max(0, Math.min(1, (t - gl.start) / d)));
        for (let c = 0; c < 3; c++) s.point[c] = gl.from[c] + (pt[c] - gl.from[c]) * e;
        if (e >= 1) glides.delete(i);
      }
      pushLinks(gb, s.links, s.point, link, lanes, offsets);
      const el = items[i];
      const [x, y] = field.worldToScreen(s.point);
      screens.push([x, y]);
      if (!el) return;
      const color = markPoolHex(regime, seeds[i]);
      if (el.dataset.color !== color) {
        el.dataset.color = color;
        el.style.color = color;
      }
      placePin(el, x, y, vw, gutter);
      if (el.dataset.placed !== 'true') el.dataset.placed = 'true';
    });
    for (let i = spots.length; i < items.length; i++) items[i].dataset.placed = 'false';
    if (lanes.length > 0 || wroteLanes) {
      gb.writeLanes(lanes, new Float32Array(offsets));
      wroteLanes = lanes.length > 0;
    }
    publish(link, screens);
  }

  const off = field.onFrame(() => frame());

  // Reduced motion runs no loop: the renders around the sheet's close run
  // while it still counts as open, so render once more when it is gone.
  const observer = new MutationObserver(() => {
    if (!isOpen() && reduced()) gb?.render();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gb'] });

  return {
    setSeeds(next: readonly number[]): void {
      seeds = [...next];
      if (reduced()) gb?.render();
    },
    dispose(): void {
      off();
      observer.disconnect();
      if (gb && wroteLanes && !isOpen()) {
        gb.writeLanes([], new Float32Array(0));
        gb.render();
      }
    },
  };
}
