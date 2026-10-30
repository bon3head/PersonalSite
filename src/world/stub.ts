import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { Lanefield, LayoutId } from './types';

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

  const debug = {
    laneCount: T.world.laneCount,
    layoutHash: '0'.repeat(64), // lit-ok: SHA-256 hex digest length
    weights: () => [...weights],
    cameraPose,
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
      if (travelOpts?.instant) return Promise.resolve();
      return new Promise((resolve) => {
        window.setTimeout(resolve, T.motion.ms.travel);
      });
    },
    setReducedMotion(on: boolean): void {
      reduced = on;
      void reduced;
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
