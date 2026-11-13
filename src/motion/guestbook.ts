// Guestbook director (DESIGN 6.14). Drives the lane field while the
// guestbook sheet is open: the camera dolly, the 3D part, the signing pin
// (DESIGN 6.14 Pins, 1.9.0: a disc on a lane tip with the name as one
// straight label, linked into the lines), the lock-in, and the
// pull-back that moves the pin to its rest spot. Everything here is
// motion of the existing field through field.guestbook (same mesh,
// same draw call, same WebGL context) plus one DOM pin.
//
// Entropy: two fresh seeds per sign, both from freshSeed (entropy.ts,
// crypto.getRandomValues, or hash32 of the session seed under ?seed).
//   open seed: part heights (shader, uGbSeed), camera yaw and rise.
//   sign seed: the pin's rest spot (pins.ts), the label's resolve
//              noise, pull-back drift, the mark color from
//              guestbook.mark.colorPool (1.8.0), and the readout hex.
// Each value is hash32(seed, PARAM, index), so a seed fully decides it.
//
// Curves: the two Lusion beziers only (T.guestbook.easeMain, easeSoft).
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import { cubicBezier } from '../world/tween';
import { currentVariant } from '../world/camera';
import { freshSeed, hash32 } from './entropy';
import { markPoolHex } from './markPool';
import { gutterPx, placePin, pushLinks, regimeNow, setHandoff, spotNear, type PinSpot, type Vec3 } from './pins';
import { parsePath, SCENE_LAYOUT } from '../router';

const easeMain = cubicBezier(...T.guestbook.easeMain);
const easeSoft = cubicBezier(...T.guestbook.easeSoft);
type Ease = (x: number) => number;

const UINT32 = 4294967296;
const DEG = Math.PI / 180;
const NOISE_GLYPHS = '0123456789ABCDEF';


// Parameter ids for hash32(seed, PARAM, index). 9 and 10 are the pin's
// rest spot candidates (pins.ts PIN_PARAM); the retired letter ids
// (3 to 7, 11) stay unused so replayed seeds keep their meaning.
const P = {
  yaw: 1,
  rise: 2,
  scramble: 8,
  drift: 12,
  partSeed: 13,
  readout: 14,
} as const;

function u(seed: number, param: number, index = 0): number {
  return hash32(seed, param, index) / UINT32;
}

function s(seed: number, param: number, index = 0): number {
  return u(seed, param, index) * 2 - 1;
}

class Tween {
  from = 0;
  to = 0;
  start = 0;
  dur = 0;
  ease: Ease = easeMain;
  constructor(v = 0) {
    this.from = v;
    this.to = v;
  }
  value(t: number): number {
    if (this.dur <= 0 || t >= this.start + this.dur) return this.to;
    if (t <= this.start) return this.from;
    return this.from + (this.to - this.from) * this.ease((t - this.start) / this.dur);
  }
  go(t: number, to: number, dur: number, ease: Ease, delay = 0): void {
    this.from = this.value(t);
    this.to = to;
    this.start = t + delay;
    this.dur = dur;
    this.ease = ease;
    if (dur <= 0 && delay <= 0) this.from = to;
  }
  done(t: number): boolean {
    return this.dur <= 0 || t >= this.start + this.dur;
  }
}

export type GuestbookPhase = 'closed' | 'open' | 'locking' | 'settled' | 'closing';

export interface GuestbookPinDebug {
  lane: number;
  point: Vec3;
  screen: [number, number];
  label: string;
  links: number[];
  link: number;
}

export interface GuestbookDebug {
  phase: GuestbookPhase;
  openSeed: number;
  signSeed: number | null;
  signs: number[];
  dolly: number;
  yawDeg: number;
  bands: [number, number, number];
  // The signing pin (1.9.0), null without a field.
  pin: GuestbookPinDebug | null;
  well: [number, number, number] | null;
  dim: number;
  dimBox: [number, number, number, number] | null;
  // Mark color (1.8.0): the sign seed's pool color, null before lock-in.
  color: string | null;
  colorMix: number;
  // Part per scene (1.8.0): the layoutScale in effect.
  partScale: number;
}

// Where the panel is, for the phone frame and the contrast dim
// (DESIGN 6.14, 1.6.0). lift is the keyboard lift in CSS px.
export interface GuestbookPanelSource {
  panel: HTMLElement;
  lift: () => number;
}

// The free region in layout CSS px: the visual viewport above the
// panel's resting top edge (no depth move, with the keyboard lift).
export function freeRegion(src: GuestbookPanelSource | null): { left: number; top: number; width: number; height: number } {
  const vv = window.visualViewport;
  const left = vv ? vv.offsetLeft : 0;
  const top = vv ? vv.offsetTop : 0;
  const width = vv ? vv.width : window.innerWidth;
  let bottom = top + (vv ? vv.height : window.innerHeight);
  if (src) bottom = Math.min(bottom, src.panel.offsetTop - src.lift());
  return { left, top, width, height: Math.max(1, bottom - top) };
}

export interface GuestbookDirector {
  open(): void;
  // The visual viewport or the panel moved: re-measure (renders once
  // under reduced motion, where no loop runs).
  reframe(): void;
  setText(name: string): void;
  lock(): Promise<number>;
  again(): void;
  close(): Promise<void>;
  // Seed readout: rolling hex before lock-in, the sign seed after.
  onReadout(cb: (hex: string) => void): void;
  dispose(): void;
}

// Part per scene (DESIGN 6.14, 1.8.0): the part is scaled by
// guestbook.part.layoutScale for the scene under the sheet (off on the
// flat ground scenes, where it read as one huge ring).
function partScale(): number {
  return T.guestbook.part.layoutScale[SCENE_LAYOUT[parsePath(window.location.pathname)]];
}

function hexRgb(hex: string): [number, number, number] {
  const c = (i: number): number => parseInt(hex.slice(i, i + 2), 16) / 255;
  return [c(1), c(3), c(5)];
}

function hex8(n: number): string {
  return (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function createGuestbookDirector(
  field: Lanefield | null,
  pinLayer: HTMLElement | null,
  panelSrc: GuestbookPanelSource | null = null,
): GuestbookDirector {
  const g = T.guestbook;
  const gb = field?.guestbook ?? null;
  const reduced = (): boolean => gb?.reduced() ?? true;
  const dur = (ms: number): number => (reduced() ? 0 : ms);
  const nowMs = (): number => (field ? field.now() * 1000 : performance.now());

  let phase: GuestbookPhase = 'closed';
  let openSeed = 0;
  let signSeed: number | null = null;
  const signs: number[] = [];
  let text = '';
  let readoutCb: ((hex: string) => void) | null = null;
  let lastReadout = '';
  let unsubscribe: (() => void) | null = null;
  let lockStart = 0;
  let closeResolve: (() => void) | null = null;
  let closeAt = 0;

  // Geometry at open.
  let well: [number, number, number] = [0, 0, 0];
  let lastDimBox: [number, number, number, number] | null = null;
  let spot: PinSpot | null = null;
  let lastScreen: [number, number] = [NaN, NaN];
  let lastLabel = '';

  const dolly = new Tween();
  const yaw = new Tween();
  const rise = new Tween();
  const bands = [new Tween(), new Tween(), new Tween()];
  const shiftMix = new Tween();
  // The phone-frame shift eases when the free region changes.
  const frameX = new Tween();
  const frameY = new Tween();
  const dim = new Tween();
  // Link lanes into the pin: 0 none, 1 tips exactly at the pin.
  const link = new Tween();
  // The pin's point, from its start spot to its rest spot.
  const pinX = new Tween();
  const pinY = new Tween();
  const pinZ = new Tween();
  // Mark color (1.8.0): 0 is the regime default, 1 the pool color.
  const colorMix = new Tween();
  let markHex: string | null = null;
  let markRgb: [number, number, number] | null = null;
  let shiftTo: [number, number] = [0, 0];
  const tipNow: Vec3 = [0, 0, 0];
  let gutter: number = T.space.gutterPx.base;

  // The signing pin's DOM: a disc and the label (DESIGN 6.14 Pins).
  let pinEl: HTMLElement | null = null;
  let labelEl: HTMLElement | null = null;

  function makePin(): void {
    if (!pinLayer || pinEl) return;
    const el = document.createElement('div');
    el.className = 'jp-pin jp-pin--signing';
    const dot = document.createElement('span');
    dot.className = 'jp-pin-dot';
    const label = document.createElement('span');
    label.className = 'jp-pin-label';
    el.append(dot, label);
    pinLayer.appendChild(el);
    pinEl = el;
    labelEl = label;
  }

  // Canvas NDC that puts the well at the free region's center offset by
  // shiftNdc in that region's NDC (DESIGN 6.14 phone frame).
  function frameShift(): [number, number] {
    const [sx, sy] = g.shiftNdc[currentVariant()];
    const r = freeRegion(panelSrc);
    if (!field) return [sx, sy];
    const [vw, vh] = field.viewportCss();
    const px = r.left + (r.width / 2) * (1 + sx);
    const py = r.top + (r.height / 2) * (1 - sy);
    return [(px / vw) * 2 - 1, 1 - (py / vh) * 2];
  }

  function updateFrame(t: number, snap: boolean): void {
    const [x, y] = frameShift();
    const eps = 1e-3; // lit-ok: NDC change below a pixel is ignored
    if (snap) {
      frameX.go(t, x, 0, easeMain);
      frameY.go(t, y, 0, easeMain);
    } else {
      if (Math.abs(x - frameX.to) > eps) frameX.go(t, x, dur(g.ms.panel), easeMain);
      if (Math.abs(y - frameY.to) > eps) frameY.go(t, y, dur(g.ms.panel), easeMain);
    }
    shiftTo = [frameX.value(t), frameY.value(t)];
  }

  // The well and the signing pin's start spot: the lane tip nearest the
  // scene camera's ground target.
  function measureWell(t: number): void {
    if (!field || !gb) return;
    gutter = gutterPx();
    updateFrame(t, true);
    measureSpot(t);
  }

  function measureSpot(t: number): void {
    if (!gb) return;
    const frame = gb.restFrame();
    well = [...frame.target];
    spot = spotNear(gb, well[0], well[2]);
    // Reduced motion: the camera does not move, so the well may sit under
    // the panel or the keyboard. Then the pin starts in the free region's
    // center instead (below), so it is in view while typing.
    if (reduced() && field && spot) {
      const r = freeRegion(panelSrc);
      const [x, y] = field.worldToScreen(spot.point);
      const m = gutter;
      if (x < r.left + m || x > r.left + r.width - m || y < r.top + m || y > r.top + r.height - m) {
        // The lane tips can all sit out of view (on server they converge
        // at the output point, low on a phone). Put the pin on the ground
        // under the region's center; where no ground is under it (server),
        // in the plane through the well that faces the camera (its ground
        // right and world up), where the screen map is linear to first
        // order. The nearest lanes bend into it.
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const ground = field.screenToGround(cx, cy);
        let point: Vec3 | null = ground ? [ground[0], well[1], ground[1]] : null;
        const frame0 = gb.restFrame();
        const rx = frame0.right[0];
        const rz = frame0.right[1];
        const s0 = field.worldToScreen(well);
        const sr = field.worldToScreen([well[0] + rx, well[1], well[2] + rz]);
        const su = field.worldToScreen([well[0], well[1] + 1, well[2]]);
        const ax = sr[0] - s0[0];
        const ay = sr[1] - s0[1];
        const bx = su[0] - s0[0];
        const by = su[1] - s0[1];
        const det = ax * by - ay * bx;
        if (!point && Math.abs(det) > 1e-6) { // lit-ok: degenerate projection guard
          const dx = cx - s0[0];
          const dy = cy - s0[1];
          const a = (dx * by - dy * bx) / det;
          const b = (ax * dy - ay * dx) / det;
          point = [well[0] + rx * a, well[1] + b, well[2] + rz * a];
        }
        if (point) {
          const links: number[] = [];
          const ex = new Set<number>();
          while (links.length < g.pin.linkLanes) {
            const l = gb.nearestLane(point[0], point[2], ex);
            if (l < 0) break;
            links.push(l);
            ex.add(l);
          }
          spot = { lane: -1, point, links };
        }
      }
    }
    const p = spot ? spot.point : well;
    pinX.go(t, p[0], 0, easeMain);
    pinY.go(t, p[1], 0, easeMain);
    pinZ.go(t, p[2], 0, easeMain);
  }

  function setText(next: string): void {
    if (phase !== 'open') {
      text = next;
      return;
    }
    text = Array.from(next.slice(0, g.nameMaxChars)).join('');
    kick();
  }

  // The label: the name as typed; after lock-in each character shows
  // seeded hex noise until its turn, left to right (DESIGN 6.14 Lock in).
  function labelText(t: number, step: number): string {
    const chars = Array.from(text);
    if (signSeed === null || reduced()) return chars.join('');
    const n = Math.max(1, chars.length);
    return chars
      .map((ch, i) => {
        if (ch === ' ') return ch;
        const at = lockStart + (g.ms.lockIn * (i + 1)) / n;
        return t < at ? NOISE_GLYPHS[hash32(signSeed as number, P.scramble, step * 64 + i) % NOISE_GLYPHS.length] : ch;
      })
      .join('');
  }

  function frame(): void {
    if (!gb || !field) return;
    const t = nowMs();
    // Phone frame and contrast dim (DESIGN 6.14, 1.6.0).
    // Frame follows the free region only while writing: after lock-in the
    // settle and pull-back keep their own camera (lock-in unchanged).
    if (phase === 'open') updateFrame(t, false);
    if (panelSrc) {
      const b = panelSrc.panel.getBoundingClientRect();
      lastDimBox = [b.left, b.top, b.right, b.bottom];
      gb.setDim(lastDimBox, dim.value(t));
    }
    // Camera and part.
    const dist = gb.restFrame().distance;
    if (!reduced()) {
      gb.setCamera({
        center: well,
        dolly: dolly.value(t),
        yawRad: yaw.value(t),
        rise: rise.value(t),
        shiftMix: shiftMix.value(t),
        shift: shiftTo,
      });
    } else {
      gb.setCamera(null);
    }
    const ps = partScale();
    gb.setPart({
      center: [well[0], well[2]],
      radius: dist * g.part.radiusFrac,
      push: dist * g.part.pushFrac * ps,
      depth: dist * g.part.depthFrac * ps,
      seedUnit: u(openSeed, P.partSeed),
      bands: [bands[0].value(t), bands[1].value(t), bands[2].value(t)],
    });
    // The pin and its link lanes. While writing, the start spot follows
    // its lane: if the lanes moved under it (the layouts arrived after a
    // deep link opened the sheet, a resize), re-pick the nearest tip.
    if (phase === 'open' && spot && spot.lane >= 0) {
      gb.laneTip(spot.lane, tipNow);
      const eps = 1e-4; // lit-ok: world units, below a pixel
      if (Math.abs(tipNow[0] - spot.point[0]) + Math.abs(tipNow[1] - spot.point[1]) + Math.abs(tipNow[2] - spot.point[2]) > eps) {
        measureSpot(t);
      }
    }
    const step = Math.floor(t / g.ms.noiseStep);
    const point: Vec3 = [pinX.value(t), pinY.value(t), pinZ.value(t)];
    const lanes: number[] = [];
    const offsets: number[] = [];
    if (spot) pushLinks(gb, spot.links, point, link.value(t), lanes, offsets);
    gb.writeLanes(lanes, new Float32Array(offsets));
    gb.setColor(markRgb, colorMix.value(t));
    placeLive(point, t, step);
    // Seed readout: rolling until lock-in, then resolving digit by digit.
    if (readoutCb) {
      let hex: string;
      if (signSeed === null) {
        hex = reduced() ? hex8(openSeed) : hex8(hash32(openSeed, P.readout, step));
      } else {
        const final = hex8(signSeed);
        const roll = hex8(hash32(signSeed, P.readout, step));
        const k = reduced() ? 8 : Math.floor(Math.max(0, Math.min(1, (t - lockStart) / g.ms.lockIn)) * 8);
        hex = final.slice(0, k) + roll.slice(k);
      }
      if (hex !== lastReadout) {
        lastReadout = hex;
        readoutCb(hex);
      }
    }
    publish(t);
    if (phase === 'closing' && t >= closeAt) finishClose();
  }

  function placeLive(point: Vec3, t: number, step: number): void {
    if (!field) return;
    makePin();
    if (!pinEl || !labelEl) return;
    const label = labelText(t, step);
    if (labelEl.textContent !== label) labelEl.textContent = label;
    lastLabel = label;
    const mix = colorMix.value(t);
    const color = markHex && mix > 0 ? `color-mix(in srgb, ${markHex} ${(mix * 100).toFixed(1)}%, var(--jp-accent))` : '';
    if (pinEl.style.color !== color) pinEl.style.color = color;
    const [vw] = field.viewportCss();
    const [x, y] = field.worldToScreen(point);
    lastScreen = placePin(pinEl, x, y, vw, gutter);
  }

  function publish(t: number): void {
    const dbg: GuestbookDebug = {
      phase,
      openSeed,
      signSeed,
      signs: [...signs],
      dolly: dolly.value(t),
      yawDeg: yaw.value(t) / DEG,
      bands: [bands[0].value(t), bands[1].value(t), bands[2].value(t)],
      pin: spot
        ? {
            lane: spot.lane,
            point: [pinX.value(t), pinY.value(t), pinZ.value(t)],
            screen: [...lastScreen],
            label: lastLabel,
            links: [...spot.links],
            link: link.value(t),
          }
        : null,
      well: field ? [...well] : null,
      dim: dim.value(t),
      dimBox: lastDimBox,
      color: markHex,
      colorMix: colorMix.value(t),
      partScale: partScale(),
    };
    (window as unknown as { __guestbook?: GuestbookDebug }).__guestbook = dbg;
  }

  // Reduced motion: no loop runs, so render once per change.
  function kick(): void {
    if (!gb) {
      publish(nowMs());
      return;
    }
    if (reduced()) gb.render();
  }

  function subscribe(): void {
    if (!field || unsubscribe) return;
    unsubscribe = field.onFrame(() => frame());
  }

  function openFresh(t: number): void {
    openSeed = freshSeed('guestbook-open');
    signSeed = null;
    lastReadout = '';
    measureWell(t);
    const yawTo = s(openSeed, P.yaw) * g.camera.yawDeg * DEG;
    const riseTo = s(openSeed, P.rise) * g.camera.riseFrac;
    dolly.go(t, g.camera.dollyIn, dur(T.motion.ms.travel), easeMain);
    shiftMix.go(t, 1, dur(T.motion.ms.travel), easeMain);
    yaw.go(t, yawTo, dur(T.motion.ms.travel), easeMain);
    rise.go(t, riseTo, dur(T.motion.ms.travel), easeMain);
    bands.forEach((b, i) => b.go(t, 1, dur(T.motion.ms.travel), easeMain, dur(i * g.ms.bandStagger)));
    dim.go(t, 1, dur(g.ms.panel), easeMain);
    link.go(t, 0, 0, easeMain);
    link.go(t, 1, dur(g.ms.letter), easeMain);
    // A fresh open (and sign again) starts from the default color.
    colorMix.go(t, 0, 0, easeMain);
    markHex = null;
    markRgb = null;
  }

  return {
    open(): void {
      if (phase !== 'closed' && phase !== 'closing') return;
      if (phase === 'closing') {
        closeResolve?.();
        closeResolve = null;
      }
      phase = 'open';
      subscribe();
      openFresh(nowMs());
      const pending = text;
      text = '';
      if (pending) setText(pending);
      kick();
    },
    setText,
    reframe(): void {
      if (phase === 'closed' || phase === 'closing') return;
      if (phase === 'open') updateFrame(nowMs(), false);
      if (phase === 'open' && reduced()) measureSpot(nowMs());
      kick();
    },
    lock(): Promise<number> {
      if (phase !== 'open') return Promise.resolve(signSeed ?? 0);
      const t = nowMs();
      signSeed = freshSeed('guestbook-sign');
      signs.push(signSeed);
      const seed = signSeed;
      lockStart = t;
      phase = 'locking';
      // Mark color (DESIGN 6.14, 1.8.0): the sign seed picks the pool color.
      markHex = markPoolHex(regimeNow(), seed);
      markRgb = hexRgb(markHex);
      colorMix.go(t, 1, dur(g.ms.lockIn), easeSoft);
      if (!reduced()) dolly.go(t, g.camera.dollyIn + g.camera.pushIn, g.ms.lockIn, easeSoft);
      // Pull back to wide after the hold. The pin holds where it stands;
      // on close the pins layer glides it to its rest spot (pins.ts).
      const back = dur(g.ms.lockIn + g.ms.hold);
      const pull = dur(T.motion.ms.wordCadence);
      if (!reduced()) {
        dolly.go(t, g.camera.pullBack, pull, easeSoft, back);
        yaw.go(t, yaw.to + s(seed, P.drift) * g.camera.driftYawDeg * DEG, pull, easeSoft, back);
      }
      bands.forEach((b) => b.go(t, g.part.residual, pull, easeSoft, back));
      kick();
      const total = back + pull;
      return new Promise((resolve) => {
        const finish = (): void => {
          if (phase === 'locking') phase = 'settled';
          kick();
          resolve(seed);
        };
        if (total <= 0) finish();
        else setTimeout(finish, total);
      });
    },
    again(): void {
      const t = nowMs();
      text = '';
      phase = 'open';
      openFresh(t);
      kick();
    },
    close(): Promise<void> {
      if (phase === 'closed') return Promise.resolve();
      const t = nowMs();
      phase = 'closing';
      const d = dur(T.motion.ms.travel);
      for (const tw of [dolly, yaw, rise, shiftMix, dim, ...bands]) tw.go(t, 0, d, easeMain);
      link.go(t, 0, dur(g.ms.letterOut), easeMain);
      closeAt = t + d;
      return new Promise((resolve) => {
        closeResolve = resolve;
        if (!field || d <= 0) {
          // Render the zero state once, then clear.
          kick();
          finishClose();
        }
      });
    },
    onReadout(cb: (hex: string) => void): void {
      readoutCb = cb;
    },
    dispose(): void {
      finishClose();
      readoutCb = null;
    },
  };

  function finishClose(): void {
    // Hand the signed pin to the pins layer where it stands.
    if (signSeed !== null && spot) setHandoff(signSeed, [pinX.value(nowMs()), pinY.value(nowMs()), pinZ.value(nowMs())]);
    signSeed = null;
    phase = 'closed';
    unsubscribe?.();
    unsubscribe = null;
    pinEl?.remove();
    pinEl = null;
    labelEl = null;
    text = '';
    if (gb) {
      gb.setCamera(null);
      gb.setPart(null);
      gb.setColor(null, 0);
      gb.setDim(null, 0);
      lastDimBox = null;
      gb.writeLanes([], new Float32Array(0));
      gb.render();
    }
    publish(nowMs());
    const r = closeResolve;
    closeResolve = null;
    r?.();
  }
}
