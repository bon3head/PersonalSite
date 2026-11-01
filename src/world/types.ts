import type * as THREE from 'three';

export type LayoutId = 'server' | 'leaflink' | 'sidequests' | 'scatter';
export type Regime = 'void' | 'paper' | 'field';

// W4 lane parameters: the interpolated state of the lane field. Gradient
// stops are OKLab triples converted once at build time (extract-tokens);
// the shader interpolates between them along lane length. The ring is
// the P-LF-4a morph deflection ring: zero strength at rest.
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

export interface Lanefield {
  ready: Promise<void>;
  travelTo(id: LayoutId, opts?: { instant?: boolean }): Promise<void>;
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
