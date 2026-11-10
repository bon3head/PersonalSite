// Guestbook director (DESIGN 6.14). Drives the lane field while the
// guestbook sheet is open: the camera dolly, the 3D part, one lane per
// typed character bending toward the camera, the lock-in, and the
// pull-back. Everything here is motion of the existing field through
// field.guestbook (same mesh, same draw call, same WebGL context).
//
// Entropy: two fresh seeds per sign, both from freshSeed (entropy.ts,
// crypto.getRandomValues, or hash32 of the session seed under ?seed).
//   open seed: part heights (shader, uGbSeed), camera yaw and rise,
//              baseline wobble, letter heights while typing, noise.
//   sign seed: lock-in heights, settle offset and scale, pull-back
//              drift, and the hex in the seed readout.
// Each value is hash32(seed, PARAM, index), so a seed fully decides it.
//
// Curves: the two Lusion beziers only (T.guestbook.easeMain, easeSoft).
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import { cubicBezier } from '../world/tween';
import { currentVariant } from '../world/camera';
import { freshSeed, hash32 } from './entropy';

const easeMain = cubicBezier(...T.guestbook.easeMain);
const easeSoft = cubicBezier(...T.guestbook.easeSoft);
type Ease = (x: number) => number;

const UINT32 = 4294967296;
const DEG = Math.PI / 180;
const NOISE_GLYPHS = '0123456789ABCDEF';

// Parameter ids for hash32(seed, PARAM, index).
const P = {
  yaw: 1,
  rise: 2,
  wobblePhase: 3,
  wobbleFreq: 4,
  wobbleJitter: 5,
  height: 6,
  noise: 7,
  scramble: 8,
  settleAngle: 9,
  settleRadius: 10,
  settleScale: 11,
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

interface Letter {
  char: string;
  index: number;
  lane: number;
  x: Tween;
  z: Tween;
  h: Tween;
  rise: Tween;
  dying: boolean;
  resolveAt: number;
  span: HTMLSpanElement | null;
}

export type GuestbookPhase = 'closed' | 'open' | 'locking' | 'settled' | 'closing';

export interface GuestbookDebug {
  phase: GuestbookPhase;
  openSeed: number;
  signSeed: number | null;
  signs: number[];
  dolly: number;
  yawDeg: number;
  bands: [number, number, number];
  letters: { char: string; lane: number; h: number; x: number; z: number }[];
  well: [number, number, number] | null;
  dim: number;
  dimBox: [number, number, number, number] | null;
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

function hex8(n: number): string {
  return (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function createGuestbookDirector(
  field: Lanefield | null,
  glyphLayer: HTMLElement | null,
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
  let letters: Letter[] = [];
  let text = '';
  let readoutCb: ((hex: string) => void) | null = null;
  let lastReadout = '';
  let unsubscribe: (() => void) | null = null;
  let lockStart = 0;
  let closeResolve: (() => void) | null = null;
  let closeAt = 0;

  // Geometry at open.
  let well: [number, number, number] = [0, 0, 0];
  let dist = 1;
  let right: [number, number] = [1, 0];
  let forward: [number, number] = [0, -1];
  let spacing = 1;
  let glyphWorld = 1;
  let pxPerUnitIn = 1;
  let targetPx: [number, number] = [0, 0];
  let baseWell: [number, number, number] = [0, 0, 0];
  let shiftTo: [number, number] = [0, 0];
  let regionW = window.innerWidth;
  let regionL = 0;
  let lastDimBox: [number, number, number, number] | null = null;

  const dolly = new Tween();
  const yaw = new Tween();
  const rise = new Tween();
  const bands = [new Tween(), new Tween(), new Tween()];
  const shiftX = new Tween();
  const shiftZ = new Tween();
  const scale = new Tween(1);
  const noise = new Tween();
  const shiftMix = new Tween();
  // The phone-frame shift eases when the free region changes.
  const frameX = new Tween();
  const frameY = new Tween();
  const dim = new Tween();

  const tip: [number, number, number] = [0, 0, 0];
  const glyphPos: [number, number, number] = [0, 0, 0];

  // Canvas NDC that puts the well at the free region's center offset by
  // shiftNdc in that region's NDC (DESIGN 6.14 phone frame).
  function frameShift(): [number, number] {
    const [sx, sy] = g.shiftNdc[currentVariant()];
    const r = freeRegion(panelSrc);
    regionW = r.width;
    regionL = r.left;
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

  function measureWell(): void {
    if (!field || !gb) return;
    updateFrame(nowMs(), true);
    const frame = gb.restFrame();
    well = [...frame.target];
    dist = Math.hypot(frame.pos[0] - well[0], frame.pos[1] - well[1], frame.pos[2] - well[2]) || 1;
    right = frame.right;
    forward = frame.forward;
    // Fit: the dollied-in mark spans at most fitWidthFrac of the width.
    const a = field.worldToScreen(well);
    const b = field.worldToScreen([well[0] + right[0], well[1], well[2] + right[1]]);
    const pxRest = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]));
    pxPerUnitIn = reduced() ? pxRest : pxRest / (1 - g.camera.dollyIn);
    targetPx = [a[0], a[1]];
    baseWell = [...well];
    fitSpacing(Array.from(text).length);
  }

  // Reduced motion: the camera does not move, so the scene's own
  // framing stands (on fine server the target sits right of center).
  // Slide the well along the target's screen row until n letters fit
  // inside the viewport; the mark stays in the field, at rest.
  function reframeStill(n: number): void {
    if (!field) return;
    const w = regionW;
    const half = (n * spacing * pxPerUnitIn) / 2;
    const margin = (w * (1 - g.fitWidthFrac)) / 2;
    const x = Math.max(regionL + margin + half, Math.min(targetPx[0], regionL + w - margin - half));
    const ground = x === targetPx[0] ? null : field.screenToGround(x, targetPx[1]);
    well = ground ? [ground[0], baseWell[1], ground[1]] : [...baseWell];
  }

  // Letter spacing: the token spacing, shrunk so n letters fit
  // fitWidthFrac of the viewport width at the dollied-in camera.
  function fitSpacing(n: number): void {
    const fitWorld = (regionW * g.fitWidthFrac) / pxPerUnitIn;
    spacing = Math.min(dist * g.mark.spacingFrac, fitWorld / Math.max(1, n));
    glyphWorld = Math.min(dist * g.mark.glyphFrac, spacing * 1.1);
  }

  function heightFor(seed: number, i: number): number {
    const [lo, hi] = g.mark.heightFrac;
    return dist * lerp(lo, hi, u(seed, P.height, i));
  }

  // Slot i of n on the baseline, ground coordinates, with seeded wobble.
  function slot(i: number, n: number): [number, number] {
    const along = (i - (n - 1) / 2) * spacing;
    const phase0 = u(openSeed, P.wobblePhase) * Math.PI * 2;
    const freq = lerp(0.35, 0.9, u(openSeed, P.wobbleFreq));
    const wob = dist * g.mark.wobbleFrac * (Math.sin(phase0 + i * freq) + 0.5 * s(openSeed, P.wobbleJitter, i));
    return [
      well[0] + right[0] * along + forward[0] * wob,
      well[2] + right[1] * along + forward[1] * wob,
    ];
  }

  function relayout(t: number): void {
    const all = letters.filter((l) => !l.dying);
    const n = all.length;
    all.forEach((l, i) => {
      const [x, z] = slot(i, n);
      l.x.go(t, x, dur(g.ms.letter), easeMain);
      l.z.go(t, z, dur(g.ms.letter), easeMain);
    });
  }

  function makeSpan(): HTMLSpanElement | null {
    if (!glyphLayer) return null;
    const span = document.createElement('span');
    span.className = 'jp-gb-glyph';
    glyphLayer.appendChild(span);
    return span;
  }

  function setText(next: string): void {
    if (phase !== 'open') {
      text = next;
      return;
    }
    const t = nowMs();
    const chars = Array.from(next.slice(0, g.nameMaxChars));
    const alive = letters.filter((l) => !l.dying);
    // Keep the common prefix; retire the rest; add new letters.
    let keep = 0;
    while (keep < alive.length && keep < chars.length && alive[keep].char === chars[keep]) keep++;
    for (let i = keep; i < alive.length; i++) {
      alive[i].dying = true;
      alive[i].rise.go(t, 0, dur(g.ms.letterOut), easeMain);
    }
    text = chars.join('');
    fitSpacing(chars.length);
    if (reduced()) reframeStill(chars.length);
    const used = new Set(letters.map((l) => l.lane));
    const n = chars.length;
    for (let i = keep; i < n; i++) {
      const [x, z] = slot(i, n);
      const lane = chars[i] === ' ' || !gb ? -1 : gb.nearestLane(x, z, used);
      if (lane >= 0) used.add(lane);
      const l: Letter = {
        char: chars[i],
        index: i,
        lane,
        x: new Tween(x),
        z: new Tween(z),
        h: new Tween(heightFor(openSeed, i)),
        rise: new Tween(0),
        dying: false,
        resolveAt: 0,
        span: chars[i] === ' ' ? null : makeSpan(),
      };
      l.rise.go(t, 1, dur(g.ms.letter), easeMain);
      letters.push(l);
    }
    letters.forEach((l) => {
      if (!l.dying) l.index = letters.filter((m) => !m.dying).indexOf(l);
    });
    relayout(t);
    kick();
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
    const partRadius = dist * g.part.radiusFrac;
    gb.setPart({
      center: [well[0], well[2]],
      radius: partRadius,
      push: dist * g.part.pushFrac,
      depth: dist * g.part.depthFrac,
      seedUnit: u(openSeed, P.partSeed),
      bands: [bands[0].value(t), bands[1].value(t), bands[2].value(t)],
    });
    // Letters.
    const step = Math.floor(t / g.ms.noiseStep);
    const amp = noise.value(t);
    const sc = scale.value(t);
    const sx = shiftX.value(t);
    const sz = shiftZ.value(t);
    const lanes: number[] = [];
    const offsets: number[] = [];
    for (const l of letters) {
      const r = l.rise.value(t);
      if (l.lane < 0) continue;
      gb.laneTip(l.lane, tip);
      const n1 = amp * s(openSeed, P.noise, step * 64 + l.index);
      const n2 = amp * 0.5 * s(openSeed, P.noise, step * 64 + l.index + 32);
      const ox = (l.x.value(t) + sx + right[0] * n2 - tip[0]) * r;
      const oz = (l.z.value(t) + sz + right[1] * n2 - tip[2]) * r;
      const oy = (l.h.value(t) * sc + n1) * r;
      if (r > 0) {
        lanes.push(l.lane);
        offsets.push(ox, oy, oz);
      }
      glyphPos[0] = tip[0] + ox;
      glyphPos[1] = tip[1] + oy;
      glyphPos[2] = tip[2] + oz;
      placeGlyph(l, glyphPos, r, step);
    }
    gb.writeLanes(lanes, new Float32Array(offsets));
    // Retire finished dying letters.
    letters = letters.filter((l) => {
      if (l.dying && l.rise.done(t)) {
        l.span?.remove();
        return false;
      }
      return true;
    });
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

  function placeGlyph(l: Letter, p: [number, number, number], r: number, step: number): void {
    const span = l.span;
    if (!span || !field) return;
    const a = field.worldToScreen(p);
    const b = field.worldToScreen([p[0] + right[0] * glyphWorld, p[1], p[2] + right[1] * glyphWorld]);
    const [lo, hi] = g.mark.glyphPx;
    const size = Math.max(lo, Math.min(hi, Math.hypot(b[0] - a[0], b[1] - a[1])));
    const k = (size / hi) * Math.max(r, 0);
    let ch = l.char;
    if (signSeed !== null && !reduced()) {
      const t = nowMs();
      if (t < l.resolveAt) ch = NOISE_GLYPHS[hash32(signSeed, P.scramble, step * 64 + l.index) % NOISE_GLYPHS.length];
    }
    if (span.textContent !== ch) span.textContent = ch;
    span.style.transform = `translate3d(${a[0].toFixed(1)}px, ${a[1].toFixed(1)}px, 0) translate(-50%, -100%) scale(${k.toFixed(4)})`;
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
      letters: letters.filter((l) => !l.dying).map((l) => ({ char: l.char, lane: l.lane, h: l.h.value(t), x: l.x.value(t), z: l.z.value(t) })),
      well: field ? [...well] : null,
      dim: dim.value(t),
      dimBox: lastDimBox,
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
    measureWell();
    const yawTo = s(openSeed, P.yaw) * g.camera.yawDeg * DEG;
    const riseTo = s(openSeed, P.rise) * g.camera.riseFrac;
    dolly.go(t, g.camera.dollyIn, dur(T.motion.ms.travel), easeMain);
    shiftMix.go(t, 1, dur(T.motion.ms.travel), easeMain);
    yaw.go(t, yawTo, dur(T.motion.ms.travel), easeMain);
    rise.go(t, riseTo, dur(T.motion.ms.travel), easeMain);
    bands.forEach((b, i) => b.go(t, 1, dur(T.motion.ms.travel), easeMain, dur(i * g.ms.bandStagger)));
    shiftX.go(t, 0, dur(T.motion.ms.travel), easeMain);
    shiftZ.go(t, 0, dur(T.motion.ms.travel), easeMain);
    scale.go(t, 1, dur(T.motion.ms.travel), easeMain);
    noise.go(t, reduced() ? 0 : dist * g.mark.noiseFrac, dur(T.motion.ms.travel), easeMain);
    dim.go(t, 1, dur(g.ms.panel), easeMain);
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
      if (phase !== 'open') {
        kick();
        return;
      }
      const n = Array.from(text).length;
      updateFrame(nowMs(), false);
      fitSpacing(n);
      if (reduced()) reframeStill(n);
      relayout(nowMs());
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
      const alive = letters.filter((l) => !l.dying);
      const n = Math.max(1, alive.length);
      alive.forEach((l, i) => {
        l.h.go(t, heightFor(seed, i), dur(g.ms.lockIn), easeSoft);
        l.resolveAt = t + (g.ms.lockIn * (i + 1)) / n;
      });
      noise.go(t, 0, dur(g.ms.lockIn), easeSoft);
      if (!reduced()) dolly.go(t, g.camera.dollyIn + g.camera.pushIn, g.ms.lockIn, easeSoft);
      // Pull back to wide after the hold, and settle the mark.
      const back = dur(g.ms.lockIn + g.ms.hold);
      const pull = dur(T.motion.ms.wordCadence);
      const angle = u(seed, P.settleAngle) * Math.PI * 2;
      const [r0, r1] = g.mark.settleRadiusFrac;
      const radius = dist * g.part.radiusFrac * lerp(r0, r1, u(seed, P.settleRadius));
      const [k0, k1] = g.mark.settleScale;
      if (!reduced()) {
        dolly.go(t, g.camera.pullBack, pull, easeSoft, back);
        yaw.go(t, yaw.to + s(seed, P.drift) * g.camera.driftYawDeg * DEG, pull, easeSoft, back);
      }
      shiftX.go(t, Math.cos(angle) * radius, pull, easeSoft, back);
      shiftZ.go(t, Math.sin(angle) * radius, pull, easeSoft, back);
      scale.go(t, lerp(k0, k1, u(seed, P.settleScale)), pull, easeSoft, back);
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
      for (const l of letters) {
        l.dying = true;
        l.rise.go(t, 0, dur(g.ms.letterOut), easeMain);
      }
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
      for (const tw of [dolly, yaw, rise, shiftX, shiftZ, noise, shiftMix, dim, ...bands]) tw.go(t, 0, d, easeMain);
      for (const l of letters) {
        l.dying = true;
        l.rise.go(t, 0, d, easeMain);
      }
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
    phase = 'closed';
    unsubscribe?.();
    unsubscribe = null;
    for (const l of letters) l.span?.remove();
    letters = [];
    text = '';
    if (gb) {
      gb.setCamera(null);
      gb.setPart(null);
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
