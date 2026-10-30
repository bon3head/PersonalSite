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
