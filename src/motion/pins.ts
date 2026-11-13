// Pins (DESIGN 6.14 Pins, 1.9.0). A signature is a pin: a disc on a
// lane tip with the name beside it as one straight label, linked into
// the lines by the guestbook.pin.linkLanes lanes nearest it. Every
// signature stored in this browser is a pin on every scene, all the
// time; the layer hides only while the guestbook sheet is open (the
// director's signing pin stands in for it there).
//
// The rest spot: the sign seed and the scene's rest camera decide it
// (pinSpots); a candidate counts only if the pin and its name land in
// the clear part of the screen (inside the gutter, above the keymap,
// off the readout, the wordmark and the brand mark). The pin the sheet
// just signed glides from where it stood to its spot (handoff).
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
// accept(point, i) is the screen test for pin i; the first candidate
// that passes it and keeps the gap wins, else the first that passes it,
// else the last candidate.
export function pinSpots(
  gb: GuestbookHooks,
  seeds: readonly number[],
  accept: (point: Vec3, index: number) => boolean = () => true,
): PinSpot[] {
  const f = gb.restFrame();
  const d = f.distance;
  const cx = f.target[0];
  const cz = f.target[2];
  const [r0, r1] = PN.restRadiusFrac;
  const gap = d * PN.minGapFrac;
  const taken = new Set<number>();
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
      if (!accept(p, index)) continue;
      if (clearLane < 0) {
        clearLane = l;
        clearPoint = p;
      }
      if (out.every((o) => Math.hypot(o.point[0] - p[0], o.point[2] - p[2]) >= gap)) {
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
let handoff: { seed: number; point: Vec3 } | null = null;
export function setHandoff(seed: number, point: Vec3): void {
  handoff = { seed, point: [...point] };
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

// Place a pin element (.jp-pin, holding .jp-pin-label) with its disc
// center at screen (x, y); the label flips left near the right edge.
export function placePin(el: HTMLElement, x: number, y: number, vw: number): [number, number] {
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
  const flip = x + PN.radiusPx + PN.gapPx + w > vw - T.space.gutterPx.base;
  const want = flip ? 'true' : 'false';
  if (el.dataset.flip !== want) el.dataset.flip = want;
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
  let seeds: number[] = [];
  let spots: PinSpot[] = [];
  let key = '';
  let settleAt = 0;
  let active = false;
  let linkFrom = 0;
  let linkStart = 0;
  let wroteLanes = false;
  let glide: { index: number; from: Vec3; start: number } | null = null;
  const pt: Vec3 = [0, 0, 0];

  const nowMs = (): number => field.now() * 1000; // lit-ok: seconds to ms
  const dur = (ms: number): number => (gb?.reduced() ? 0 : ms);

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

  function accepter(): (point: Vec3, index: number) => boolean {
    const [vw, vh] = field.viewportCss();
    const m = T.space.gutterPx.base;
    const keymap = list.getBoundingClientRect().bottom;
    const boxes = blockers();
    const items = list.querySelectorAll<HTMLElement>('[data-pin] .jp-pin-label');
    const half = PN.hitPx / 2;
    return (point, index) => {
      const [x, y] = field.worldToScreen(point);
      const w = items[index]?.offsetWidth ?? 0;
      // The pin's box: disc plus name, label on the side that fits.
      const right = x + PN.radiusPx + PN.gapPx + w;
      const flip = right > vw - m;
      const x0 = flip ? x - PN.radiusPx - PN.gapPx - w : x - PN.radiusPx;
      const x1 = flip ? x + PN.radiusPx : right;
      const y0 = y - half;
      const y1 = y + half;
      if (x0 < m || x1 > vw - m || y0 < m || y1 > Math.min(vh, keymap) - m) return false;
      return boxes.every((b) => x1 < b.left || x0 > b.right || y1 < b.top || y0 > b.bottom);
    };
  }

  function recompute(): void {
    if (!gb) return;
    spots = pinSpots(gb, seeds, accepter());
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
    const open = document.documentElement.dataset.gb === 'open';
    if (open) {
      // The director owns the guestbook lanes while the sheet is open.
      active = false;
      wroteLanes = false;
      return;
    }
    const t = nowMs();
    if (!active) {
      active = true;
      linkFrom = 0;
      linkStart = t;
    }
    // Re-pick spots when the scene's rest frame, the viewport or the
    // ledger changes, and once more after a travel settles the lanes.
    const k = frameKey();
    if (k !== key) {
      key = k;
      recompute();
      settleAt = t + T.motion.ms.travel;
    } else if (settleAt > 0 && t >= settleAt) {
      settleAt = 0;
      recompute();
    }
    // The pin the sheet just signed glides from where it stood.
    if (handoff) {
      const i = seeds.indexOf(handoff.seed);
      if (i >= 0) glide = { index: i, from: handoff.point, start: t };
      handoff = null;
    }
    const link = linkValue(t);
    const lanes: number[] = [];
    const offsets: number[] = [];
    const items = list.querySelectorAll<HTMLElement>('[data-pin]');
    const [vw] = field.viewportCss();
    const regime = regimeNow();
    const screens: [number, number][] = [];
    spots.forEach((s, i) => {
      // The pin rides its lane's current tip (travel morphs it).
      gb.laneTip(s.lane, pt);
      s.point[0] = pt[0];
      s.point[1] = pt[1];
      s.point[2] = pt[2];
      if (glide && glide.index === i) {
        const d = dur(T.motion.ms.travel);
        const e = d <= 0 ? 1 : easeMain(Math.max(0, Math.min(1, (t - glide.start) / d)));
        for (let c = 0; c < 3; c++) s.point[c] = glide.from[c] + (pt[c] - glide.from[c]) * e;
        if (e >= 1) glide = null;
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
      if (el.hidden) el.hidden = false;
      placePin(el, x, y, vw);
    });
    for (let i = spots.length; i < items.length; i++) items[i].hidden = true;
    if (lanes.length > 0 || wroteLanes) {
      gb.writeLanes(lanes, new Float32Array(offsets));
      wroteLanes = lanes.length > 0;
    }
    publish(link, screens);
  }

  const off = field.onFrame(() => frame());

  return {
    setSeeds(next: readonly number[]): void {
      seeds = [...next];
      key = '';
      if (gb?.reduced()) gb.render();
    },
    dispose(): void {
      off();
      if (gb && wroteLanes && document.documentElement.dataset.gb !== 'open') {
        gb.writeLanes([], new Float32Array(0));
        gb.render();
      }
    },
  };
}
