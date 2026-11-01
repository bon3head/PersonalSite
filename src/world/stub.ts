import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { LaneParams, Lanefield, LayoutId } from './types';
import {
  paramsForLayout,
  cloneParams,
  laneAttributes as laneAttributesFor,
} from './laneParams';

const LAYOUT_ORDER: LayoutId[] = ['server', 'leaflink', 'sidequests', 'scatter'];

function layoutWeights(id: LayoutId): number[] {
  return LAYOUT_ORDER.map((l) => (l === id ? 1 : 0));
}

function isCoarse(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

// B0 stub: a fake createLanefield that keeps weights and pose in memory.
// It draws nothing. B2 replaces it with the real engine; the window
// shape stays the same.
export function createLanefield(
  mount: HTMLElement,
  opts: { seed: number; reducedMotion: boolean; initial: LayoutId },
): Lanefield | null {
  void mount;
  void opts.seed;
  let current: LayoutId = opts.initial;
  let weights = layoutWeights(current);
  let params: LaneParams = paramsForLayout(current);
  let reduced = opts.reducedMotion;
  let disposed = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    T.world.camera.server.fine.fovDeg,
    1,
    T.world.camera.near,
    T.world.camera.far,
  );

  function cameraPose(): {
    pos: [number, number, number];
    target: [number, number, number];
    fov: number;
    shift: [number, number];
  } {
    const pose = T.world.camera[current][isCoarse() ? 'coarse' : 'fine'];
    return {
      pos: [...pose.pos] as [number, number, number],
      target: [...pose.target] as [number, number, number],
      fov: pose.fovDeg,
      shift: [...pose.shiftNdc] as [number, number],
    };
  }

  // Stub camera readout: same pitch/yaw/distance math as debug.ts,
  // derived from the token pose since the stub draws nothing.
  function cameraReadout(): {
    pos: [number, number, number];
    forward: [number, number, number];
    pitchDeg: number;
    yawDeg: number;
    distance: number | null;
    groundTarget: [number, number] | null;
    projection: 'perspective';
    fovDeg: number;
  } {
    const pose = cameraPose();
    const dx = pose.target[0] - pose.pos[0];
    const dy = pose.target[1] - pose.pos[1];
    const dz = pose.target[2] - pose.pos[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz); // lit-ok: vector length
    const forward: [number, number, number] = [dx / len, dy / len, dz / len];
    const radToDeg = 180 / Math.PI; // lit-ok: radians to degrees conversion
    const pitchDeg = Math.asin(Math.max(-1, Math.min(1, forward[1]))) * radToDeg; // lit-ok: pitch clamp to asin domain
    const yawDeg = Math.atan2(forward[0], forward[2]) * radToDeg; // lit-ok: yaw from forward x/z
    let distance: number | null = null;
    let groundTarget: [number, number] | null = null;
    if (forward[1] < 0) {
      distance = -pose.pos[1] / forward[1];
      groundTarget = [pose.pos[0] + forward[0] * distance, pose.pos[2] + forward[2] * distance];
    }
    return {
      pos: pose.pos,
      forward,
      pitchDeg,
      yawDeg,
      distance,
      groundTarget,
      projection: 'perspective',
      fovDeg: pose.fov,
    };
  }

  const debug = {
    laneCount: T.world.laneCount,
    layoutHash: '0'.repeat(64), // lit-ok: SHA-256 hex digest length
    weights: () => [...weights],
    cameraPose,
    get camera() {
      return cameraReadout();
    },
    info: () => ({ calls: 0, triangles: 0, textures: 0, geometries: 0 }),
    frameStats: () => ({ p50: 0, p90: 0, p95: 0, count: 0 }),
    dpr: () => window.devicePixelRatio,
    memoryEstimate: () => 0,
    ready: true,
  };
  window.__lanefield = debug;

  const field: Lanefield = {
    ready: Promise.resolve(),
    travelTo(id: LayoutId, travelOpts?: { instant?: boolean }): Promise<void> {
      if (disposed) return Promise.resolve();
      current = id;
      weights = layoutWeights(id);
      params = paramsForLayout(id);
      if (travelOpts?.instant) return Promise.resolve();
      return new Promise((resolve) => {
        window.setTimeout(resolve, T.motion.ms.travel);
      });
    },
    setReducedMotion(on: boolean): void {
      reduced = on;
      void reduced;
    },
    getParams(): LaneParams {
      return cloneParams(params);
    },
    setParams(p: Partial<LaneParams>): void {
      if (p.leadOklab) params.leadOklab = [...p.leadOklab];
      if (p.tailOklab) params.tailOklab = [...p.tailOklab];
      if (p.signalOklab) params.signalOklab = [...p.signalOklab];
      if (p.tailLength !== undefined) params.tailLength = p.tailLength;
      if (p.lightMode !== undefined) params.lightMode = p.lightMode;
      if (p.lightRadius !== undefined) params.lightRadius = p.lightRadius;
      if (p.lightGain !== undefined) params.lightGain = p.lightGain;
      if (p.ringCenter) params.ringCenter = [...p.ringCenter];
      if (p.ringRadius !== undefined) params.ringRadius = p.ringRadius;
      if (p.ringStrength !== undefined) params.ringStrength = p.ringStrength;
    },
    laneAttributes(lane: number) {
      return laneAttributesFor(lane, weights[LAYOUT_ORDER.indexOf('server')]);
    },
    setActivity(): void {
      // Stub draws nothing; activity is accepted and dropped.
    },
    clearActivity(): void {
      // Stub draws nothing.
    },
    now(): number {
      return performance.now() * 0.001; // lit-ok: ms to seconds conversion
    },
    screenToGround(): [number, number] | null {
      return null;
    },
    worldToScreen(): [number, number] {
      return [0, 0];
    },
    onFrame(): () => void {
      return () => {
        // Stub has no render loop; nothing to unsubscribe.
      };
    },
    scene,
    camera,
    dispose(): void {
      disposed = true;
      if (window.__lanefield === debug) delete window.__lanefield;
    },
  };
  return field;
}
