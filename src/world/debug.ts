// Debug view (S02 debug chapter) on window.__lanefield, plus the ?perf HUD
// and perf dump frame JSON download (S02 governor chapter).
import { T } from '../tokens.generated';
import type { LanefieldDebug } from './types';
import type { Pose } from './camera';

export interface DebugDeps {
  laneCount: number;
  getLayoutHash: () => string;
  getWeights: () => number[];
  getCameraPose: () => Pose;
  // Rendered camera world matrix elements (column-major),
  // refreshed from the rendered camera on every access.
  getCameraMatrix: () => readonly number[];
  getInfo: () => { calls: number; triangles: number; textures: number; geometries: number; programs: number };
  getFrameStats: () => { p50: number; p90: number; p95: number; count: number };
  getDpr: () => number;
  getMemoryEstimate: () => number;
  getRecentFrames: () => number[];
  isRingFull: () => boolean;
}

export interface DebugHandle {
  debug: LanefieldDebug;
  setLayoutHash: (hash: string) => void;
  setReady: (ready: boolean) => void;
  updateHud: () => void;
}

export function createDebugView(deps: DebugDeps): DebugHandle {
  const debug: LanefieldDebug = {
    laneCount: deps.laneCount,
    layoutHash: '',
    weights: () => [...deps.getWeights()],
    cameraPose: () => {
      const p = deps.getCameraPose();
      return { pos: [...p.pos], target: [...p.target], fov: p.fov, shift: [...p.shift] };
    },
    // Read-only rendered-camera snapshot. Forward is the camera local -Z
    // axis in world space: the negated third column of the world
    // matrix. This sees the walk lean override, which writes the
    // camera directly after the rig pose is applied.
    get camera() {
      const e = deps.getCameraMatrix();
      const pos: [number, number, number] = [e[12], e[13], e[14]]; // lit-ok: matrixWorld translation column
      const fx = -e[8]; // lit-ok: matrixWorld third column, negated to forward
      const fy = -e[9]; // lit-ok: matrixWorld third column, negated to forward
      const fz = -e[10]; // lit-ok: matrixWorld third column, negated to forward
      const fl = Math.sqrt(fx * fx + fy * fy + fz * fz); // lit-ok: vector length
      const forward: [number, number, number] = [fx / fl, fy / fl, fz / fl];
      const radToDeg = 180 / Math.PI; // lit-ok: radians to degrees conversion
      const pitchDeg = Math.asin(Math.max(-1, Math.min(1, forward[1]))) * radToDeg; // lit-ok: pitch clamp to asin domain
      const yawDeg = Math.atan2(forward[0], forward[2]) * radToDeg; // lit-ok: yaw from forward x/z
      let distance: number | null = null;
      let groundTarget: [number, number] | null = null;
      if (forward[1] < 0) {
        distance = -pos[1] / forward[1];
        groundTarget = [pos[0] + forward[0] * distance, pos[2] + forward[2] * distance];
      }
      return {
        pos,
        forward,
        pitchDeg,
        yawDeg,
        distance,
        groundTarget,
        projection: 'perspective' as const,
        fovDeg: deps.getCameraPose().fov,
      };
    },
    info: () => deps.getInfo(),
    frameStats: () => deps.getFrameStats(),
    dpr: () => deps.getDpr(),
    memoryEstimate: () => deps.getMemoryEstimate(),
    ready: false,
  };
  window.__lanefield = debug;

  const params = new URLSearchParams(window.location.search);
  const perf = params.get('perf') === '1';
  const dump = params.get('dump') === '1';
  let hud: HTMLElement | null = null;
  let dumped = false;
  if (perf) {
    hud = document.createElement('div');
    hud.style.position = 'fixed';
    hud.style.top = '0';
    hud.style.right = '0';
    hud.style.zIndex = '9999';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '12px';
    hud.style.color = T.color.chalk;
    hud.style.background = T.color.void.ground;
    hud.style.padding = '4px 8px';
    hud.style.whiteSpace = 'pre';
    document.body.appendChild(hud);
  }

  return {
    debug,
    setLayoutHash(hash: string) {
      debug.layoutHash = hash;
    },
    setReady(ready: boolean) {
      debug.ready = ready;
    },
    updateHud() {
      if (hud) {
        const s = deps.getFrameStats();
        const info = deps.getInfo();
        const fps = s.p50 > 0 ? 1000 / s.p50 : 0; // lit-ok: ms to fps
        hud.textContent =
          `fps ${fps.toFixed(0)} p90 ${s.p90.toFixed(1)}ms dpr ${deps.getDpr().toFixed(2)} calls ${info.calls}`;
      }
      if (dump && !dumped && deps.isRingFull()) {
        dumped = true;
        const blob = new Blob([JSON.stringify(deps.getRecentFrames())], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lanefield-frames.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  };
}
