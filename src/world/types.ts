import type * as THREE from 'three';

export type LayoutId = 'server' | 'leaflink' | 'sidequests' | 'scatter';
export type Regime = 'void' | 'paper' | 'field';

export interface Lanefield {
  ready: Promise<void>;
  travelTo(id: LayoutId, opts?: { instant?: boolean }): Promise<void>;
  setReducedMotion(on: boolean): void;
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
