import type * as THREE from 'three';

export type LayoutId = 'server' | 'leaflink' | 'sidequests' | 'scatter';
export type Regime = 'void' | 'paper' | 'field';

// P-LF-4b silhouette mask kind: which project mark supplies the alpha
// mask, or none. The kind is a route identity; the engine resolves it
// to a manifest file (SideQuests frame 0 PNG, LeafLink logo PNG).
export type SilhouetteMaskKind = 'none' | 'sidequests' | 'leaflink';

// W4 lane parameters: the interpolated state of the lane field. Gradient
// stops are OKLab triples converted once at build time (extract-tokens);
// the shader interpolates between them along lane length. The ring is
// the P-LF-4a morph deflection ring: zero strength at rest. The
// silhouette fields are the P-LF-4b contour pull: zero strength at
// rest, center and radius tracking the ring during a morph until W6
// registers hero descriptors that override them through setParams.
export interface LaneParams {
  leadOklab: [number, number, number];
  tailOklab: [number, number, number];
  signalOklab: [number, number, number];
  tailLength: number;
  lightMode: 'band' | 'radial' | 'wander' | 'static';
  lightRadius: number;
  lightGain: number;
  ringCenter: [number, number];
  ringRadius: number;
  ringStrength: number;
  silhouetteMask: SilhouetteMaskKind;
  silhouetteCenter: [number, number];
  silhouetteRadius: number;
  silhouetteStrength: number;
}

// W4 variant B per-lane attributes (lanefield.variance). band is the
// depth band, lengthScale the fixed seeded length multiplier, and
// phaseJitter the seeded phase offset with Lockstep zeroed: it is
// exactly zero whenever the server weight is one.
export interface LaneAttributes {
  band: number;
  lengthScale: number;
  phaseJitter: number;
  phaseJitterSeed: number;
}

// Polish round (DESIGN polish tokens): a placed hero mark, in CSS px. The
// engine ground-projects it through the current camera every frame, so
// the morph ring, the silhouette pull, and every pulse sit under the
// logo on screen whatever the camera is doing. ringRadiusPx is clamped
// by the hero to its clearance from the readout, name zone, and keymap,
// so the bulge never reaches them.
export interface HeroAnchorPx {
  x: number;
  y: number;
  ringRadiusPx: number;
  silhouetteRadiusPx: number;
}

// Camera focus: pan the camera on the ground plane so a ground point
// sits at a screen point (damped, token focus.halfLifeMs, capped at
// focus.maxPanWorld). Translation only, never rotation.
export interface CameraFocus {
  ground: [number, number];
  screenPx: [number, number];
}

// Guestbook part (DESIGN, guestbook section): lanes inside radius move outward by
// push and to a per-lane seeded height up to depth, per depth band.
export interface GuestbookPart {
  center: [number, number];
  radius: number;
  push: number;
  depth: number;
  seedUnit: number;
  bands: [number, number, number];
}

// The resting camera frame the guestbook measures against.
export interface GuestbookFrame {
  pos: [number, number, number];
  target: [number, number, number];
  distance: number;
  forward: [number, number];
  right: [number, number];
}

// Guestbook camera layer: dolly is the fraction of the camera to well
// distance travelled toward the well (negative pulls back), yawRad
// turns about the vertical through the well, rise lifts by a fraction
// of that distance.
export interface GuestbookCamera {
  center: [number, number, number];
  dolly: number;
  yawRad: number;
  rise: number;
  // Principal-point shift blend: 0 keeps the scene shift, 1 uses shift.
  shiftMix: number;
  shift: [number, number];
}

export interface GuestbookHooks {
  setCamera(c: GuestbookCamera | null): void;
  setPart(p: GuestbookPart | null): void;
  // Mark color (DESIGN 6.14, 1.8.0): letter lanes mix from the regime // lit-ok: spec section reference
  // default toward rgb (raw sRGB, 0 to 1) by amount; null or 0 is the default.
  setColor(rgb: readonly [number, number, number] | null, amount: number): void;
  // offsets holds xyz per lane, in lane order. Lanes written before and
  // missing now return to zero.
  writeLanes(lanes: readonly number[], offsets: Float32Array): void;
  laneTip(lane: number, out: [number, number, number]): [number, number, number];
  nearestLane(x: number, z: number, exclude: ReadonlySet<number>): number;
  restFrame(): GuestbookFrame;
  // Contrast dim (DESIGN guestbook section): lanes inside the CSS px box
  // [left, top, right, bottom] dim by amount (0 to 1) of guestbook.dim.amount.
  setDim(box: [number, number, number, number] | null, amount: number): void;
  render(): void;
  reduced(): boolean;
}

// Server words formed from lanes (DESIGN 6.15). offsets holds xyz per // lit-ok: spec section reference
// lane, slots the word pool slot per lane. Word lanes written before and
// missing now return to zero; lanes the guestbook holds are skipped.
export interface LaneWordHooks {
  writeLanes(lanes: readonly number[], offsets: Float32Array, slots: readonly number[]): void;
  // Raw sRGB components (0 to 1) and opacity for one pool slot.
  setTint(slot: number, rgb: readonly [number, number, number], opacity: number): void;
  held(lane: number): boolean;
  // Debug read of one lane's offset texel (T-SRV-7). // lit-ok: spec section reference
  texel(lane: number): [number, number, number, number];
}

export interface Lanefield {
  ready: Promise<void>;
  travelTo(
    id: LayoutId,
    opts?: { instant?: boolean; originPx?: [number, number] | null },
  ): Promise<void>;
  setReducedMotion(on: boolean): void;
  // W4: interpolated lane parameters. setParams merges into the current
  // params (and into an in-flight travel target, so travel does not
  // overwrite an explicit override). getParams returns a copy.
  getParams(): LaneParams;
  setParams(p: Partial<LaneParams>): void;
  // W4: variant B attributes for one lane at the current weights.
  laneAttributes(lane: number): LaneAttributes;
  setActivity(
    lanes: Int32Array,
    startSec: Float32Array,
    fadeAtSec: Float32Array,
    kind: 1 | 2,
    uPerSec: Float32Array,
  ): void;
  clearActivity(kind?: 1 | 2): void;
  now(): number;
  screenToGround(xCss: number, yCss: number): [number, number] | null;
  worldToScreen(p: [number, number, number]): [number, number];
  onFrame(cb: (tSec: number, dtSec: number) => void): () => void;
  // Polish round additions (DESIGN polish tokens).
  setHeroAnchor(layout: LayoutId, anchor: HeroAnchorPx | null): void;
  heroAnchor(layout: LayoutId): HeroAnchorPx | null;
  // Current morph sample (hero loom and recede read it), null before
  // the first frame.
  morphSample(): import('../motion/morph-controller').MorphSample | null;
  // One ring pulse at the current layout's hero anchor. The bulge
  // departs from originPx (when given) and travels into the anchor.
  pulse(opts?: { originPx?: [number, number] | null; strengthScale?: number }): void;
  setFocus(focus: CameraFocus | null): void;
  // Current ground-plane pan [x, z] (SideQuests lean adds it to its base).
  focusOffset(): [number, number];
  // True while a focus target is set (the SideQuests lean yields to it).
  focusActive(): boolean;
  // Project a world point through a layout's resting pose.
  projectAtRest(layout: LayoutId, p: [number, number, number]): [number, number];
  // GLITTERBOX hold: blend toward the scatter layout around a screen
  // point while held; release re-forms the scene.
  setGlitter(on: boolean, centerPx?: [number, number]): void;
  guestbook: GuestbookHooks;
  words: LaneWordHooks;
  // The canvas's CSS size, which the projection uses.
  viewportCss(): [number, number];
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  dispose(): void;
}

export interface LanefieldDebug {
  laneCount: number;
  layoutHash: string;
  weights(): number[];
  cameraPose(): {
    pos: [number, number, number];
    target: [number, number, number];
    fov: number;
    shift: [number, number];
  };
  // Diagnostic camera readout (W0, ruling step 1a): current values from the
  // rendered camera, including the SideQuests walk lean lookAt override
  // that cameraPose (rig pose only) does not see. pitchDeg is the
  // elevation of the forward vector above horizontal in degrees:
  // negative looks down, fully downward is flat top-down. yawDeg is
  // atan2(forward.x, forward.z) in degrees. distance is the distance
  // along the view ray to the y = 0 plane, null when looking up.
  readonly camera: {
    pos: [number, number, number];
    forward: [number, number, number];
    pitchDeg: number;
    yawDeg: number;
    distance: number | null;
    groundTarget: [number, number] | null;
    projection: 'perspective';
    fovDeg: number;
  };
  info(): { calls: number; triangles: number; textures: number; geometries: number };
  // P-LF-4b mask state, when the engine supplies it: the requested
  // mask kind from params, the kind uploaded, and the uploaded
  // texture size (small square for a logo mask, 1 square for the
  // transparent placeholder). Absent on the stub, which draws
  // nothing.
  silhouette?: () => { kind: SilhouetteMaskKind; loaded: SilhouetteMaskKind; width: number; height: number };
  frameStats(): { p50: number; p90: number; p95: number; count: number };
  dpr(): number;
  memoryEstimate(): number;
  ready: boolean;
}

declare global {
  interface Window {
    __lanefield?: LanefieldDebug;
  }
}
