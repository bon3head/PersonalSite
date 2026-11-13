// Server scene controller (S05 1.5.0, DESIGN 6.15). Nodes only: the // lit-ok: spec section reference
// scene carries no words. Three seeded node groups rest out of the horn
// and stay (DESIGN 1.9.0: no spawn cadence, no fade with age); each node rides // lit-ok: spec version
// the tip of its own lane, which bends out of the horn to carry it.
// Groups fade in over motion.ms.fast when placed and out over the same
// on pause, travel exit and guestbook open; the lane's bend and tint
// follow the group's opacity, so a lane never snaps.
// The group seed is hash32(sessionSeed, server-node, n) and decides the
// node count, the offsets (seeded rejection, never crowded) and the
// color (guestbook.mark.colorPool.dark, the same pool as the guestbook
// mark). Camera idle yaw and pointer parallax reside in the lanefield
// rig (S02 camera section), lane pulses in the fire() shader. The
// controller exposes pause/resume for travel (S03 SceneController) and
// debug accessors for the S05 node tests.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { Lanefield } from './types';
import type { SceneController } from '../travel';
import { currentVariant } from './camera';
import { hash32, serverNodeSeed } from '../motion/entropy';
import { markPoolHex } from '../motion/markPool';

export interface NodeLaneDebug {
  group: number;
  slot: number;
  lane: number;
  node: [number, number, number];
  restTip: [number, number, number];
  texel: [number, number, number, number];
  opacity: number;
}

export interface NodeGroupDebug {
  n: number;
  seed: number;
  slot: number;
  count: number;
  color: string;
  // Offsets in the camera's right and up plane, world units.
  offsets: [number, number][];
}

export interface ServerController extends SceneController {
  setReducedMotion(on: boolean): void;
  // Guestbook open (S05 guestbook row): nodes fade out, back in on close.
  setHidden(on: boolean): void;
  dispose(): void;
  /** Groups currently visible (the resting groups). */
  activeGroups(): NodeGroupDebug[];
  /** Every placement, in order (each rest placement appends its groups). */
  spawnedGroups(): NodeGroupDebug[];
  isPaused(): boolean;
  /** Every lit node with its lane (T-SRV-7). */ // lit-ok: spec section reference
  nodeLanes(): NodeLaneDebug[];
  /** Pure: the group a seed makes (T-SRV-4 reproducibility). */ // lit-ok: spec section reference
  groupFor(seed: number): Omit<NodeGroupDebug, 'n' | 'slot'>;
}

interface Node {
  mesh: THREE.Mesh;
  lane: number;
  off: [number, number];
  rest: [number, number, number];
}

interface ActiveGroup {
  n: number;
  seed: number;
  slot: number;
  color: string;
  rgb: Rgb;
  startSec: number;
  ySign: number;
  // Life fraction, frozen while a pause or hide fade runs.
  t: number;
  nodes: Node[];
  opacity: number;
}

type Rgb = [number, number, number];

const S = T.world.server;
const N = S.nodes;
const DURATION_SEC = T.motion.ms.word / 1000; // lit-ok: ms to seconds
const FAST_SEC = T.motion.ms.fast / 1000; // lit-ok: ms to seconds
const NODES_PER_SLOT = N.count[1];
const UINT32 = 4294967296; // lit-ok: 2^32, hash to unit
const DRIFT_LEN = Math.hypot(S.wordDrift[0], S.wordDrift[1], S.wordDrift[2]);
const SPREAD = DRIFT_LEN * N.spreadFrac;
// Seeded rejection: tries per node before the group stops growing.
const TRIES = 64; // lit-ok: rejection budget per node

// hash32 param ids for a group seed.
const P = { count: 1, radius: 2, angle: 3 } as const; // lit-ok: hash32 param ids

function u(seed: number, param: number, index: number): number {
  return hash32(seed, param, index) / UINT32;
}

// Raw sRGB components (0 to 1) from a token hex, matching the lane
// shader's color space (ShaderMaterial output is not color-managed).
function hexToRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(3, 5), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(5, 7), 16) / 255, // lit-ok: hex channel parse
  ];
}

// The group a seed makes: count in nodes.count, offsets inside a disc of
// SPREAD with no two closer than nodes.minGap. Pure.
export function nodeGroup(seed: number): { count: number; color: string; offsets: [number, number][] } {
  const [lo, hi] = N.count;
  const want = lo + (hash32(seed, P.count, 0) % (hi - lo + 1));
  const offsets: [number, number][] = [];
  let draw = 0;
  for (let i = 0; i < want; i++) {
    for (let k = 0; k < TRIES; k++, draw++) {
      const r = SPREAD * Math.sqrt(u(seed, P.radius, draw));
      const a = u(seed, P.angle, draw) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (offsets.every(([ox, oy]) => Math.hypot(ox - x, oy - y) >= N.minGap)) {
        offsets.push([x, y]);
        break;
      }
    }
  }
  return { count: offsets.length, color: markPoolHex('dark', seed), offsets };
}

function positionAt(t: number, ySign: number, out: THREE.Vector3): THREE.Vector3 {
  const d = S.wordDrift;
  const f = S.focus;
  return out.set(
    f[0] + d[0] * t,
    f[1] + d[1] * ySign * t,
    f[2] + S.wordSpawnOffsetZ + d[2] * t,
  );
}

export function createServerController(
  field: Lanefield,
  opts?: { reducedMotion?: boolean },
): ServerController {
  const f = field as Partial<Lanefield>;
  const lanes = f.words && f.guestbook ? { words: f.words, gb: f.guestbook } : null;
  const laneCount = T.world.laneCount;

  // One disc mesh per node per pool slot, one material per slot.
  const disc = new THREE.CircleGeometry(N.radius, N.segments);
  const materials: THREE.MeshBasicMaterial[] = [];
  const pool: THREE.Mesh[][] = [];
  for (let s = 0; s < N.pool; s++) {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
    materials.push(mat);
    const row: THREE.Mesh[] = [];
    for (let i = 0; i < NODES_PER_SLOT; i++) {
      const mesh = new THREE.Mesh(disc, mat);
      mesh.visible = false;
      mesh.renderOrder = 1;
      field.scene.add(mesh);
      row.push(mesh);
    }
    pool.push(row);
  }

  let paused = false;
  let hidden = false;
  let reduced = opts?.reducedMotion ?? false;
  let disposed = false;
  let fadeStartSec: number | null = null;
  let fadeInStartSec: number | null = null;
  const actives: ActiveGroup[] = [];
  const spawned: NodeGroupDebug[] = [];
  const tmpPos = new THREE.Vector3();
  const tmpPoint = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const tips = new Float32Array(laneCount * 3); // lit-ok: xyz per lane
  const tip: [number, number, number] = [0, 0, 0];
  // Reused every frame by writeLanes (no per-frame allocation).
  const scratchIds: number[] = [];
  const scratchSlots: number[] = [];
  const scratchOffsets = new Float32Array(N.pool * NODES_PER_SLOT * 3); // lit-ok: xyz per lane

  function freeSlot(): number {
    for (let s = 0; s < N.pool; s++) {
      if (!actives.some((g) => g.slot === s)) return s;
    }
    return -1;
  }

  function cameraAxes(): void {
    camRight.set(1, 0, 0).applyQuaternion(field.camera.quaternion as THREE.Quaternion);
    camUp.set(0, 1, 0).applyQuaternion(field.camera.quaternion as THREE.Quaternion);
  }

  // Phones (S05 phone row): keep the billboarded group box inside the
  // viewport inset by the gutter, sliding the drift point along the
  // camera's right and up axes by the overflow. Fine (desktop) groups
  // are not clamped.
  const corner = new THREE.Vector3();
  function clampToView(g: ActiveGroup, pos: THREE.Vector3): void {
    if (currentVariant() !== 'coarse') return;
    if (!f.worldToScreen || !f.viewportCss) return;
    let bx0 = Infinity;
    let bx1 = -Infinity;
    let by0 = Infinity;
    let by1 = -Infinity;
    for (const nd of g.nodes) {
      bx0 = Math.min(bx0, nd.off[0] - N.radius);
      bx1 = Math.max(bx1, nd.off[0] + N.radius);
      by0 = Math.min(by0, nd.off[1] - N.radius);
      by1 = Math.max(by1, nd.off[1] + N.radius);
    }
    if (!Number.isFinite(bx0)) return;
    const [vw, vh] = f.viewportCss();
    const m = T.space.gutterPx.base;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const bx of [bx0, bx1]) {
      for (const by of [by0, by1]) {
        corner.copy(pos).addScaledVector(camRight, bx).addScaledVector(camUp, by);
        const [sx, sy] = f.worldToScreen([corner.x, corner.y, corner.z]);
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
    }
    const wPx = Math.max(1, x1 - x0);
    const hPx = Math.max(1, y1 - y0);
    const pxPerWorldX = wPx / Math.max(1e-6, bx1 - bx0); // lit-ok: zero-width guard
    const pxPerWorldY = hPx / Math.max(1e-6, by1 - by0); // lit-ok: zero-height guard
    let dx = 0;
    let dy = 0;
    if (wPx > vw - 2 * m) dx = vw / 2 - (x0 + x1) / 2;
    else if (x0 < m) dx = m - x0;
    else if (x1 > vw - m) dx = vw - m - x1;
    if (hPx > vh - 2 * m) dy = vh / 2 - (y0 + y1) / 2;
    else if (y0 < m) dy = m - y0;
    else if (y1 > vh - m) dy = vh - m - y1;
    if (dx !== 0) pos.addScaledVector(camRight, dx / pxPerWorldX);
    if (dy !== 0) pos.addScaledVector(camUp, -dy / pxPerWorldY);
  }

  // Drift point of a group at life t, clamped on phones.
  function groupPoint(g: ActiveGroup, t: number, out: THREE.Vector3): THREE.Vector3 {
    positionAt(t, g.ySign, out);
    clampToView(g, out);
    return out;
  }

  // Node point: the drift point plus its seeded offset in the camera plane.
  function nodePoint(nd: Node, center: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    return out.copy(center).addScaledVector(camRight, nd.off[0]).addScaledVector(camUp, nd.off[1]);
  }

  // Every lane's resting tip at the current weights, for nearest picks.
  function snapshotTips(): void {
    if (!lanes) return;
    for (let l = 0; l < laneCount; l++) {
      lanes.gb.laneTip(l, tip);
      tips[l * 3] = tip[0];
      tips[l * 3 + 1] = tip[1];
      tips[l * 3 + 2] = tip[2]; // lit-ok: z component
    }
  }

  function nearestFree(p: THREE.Vector3, taken: ReadonlySet<number>): number {
    if (!lanes) return -1;
    let best = -1;
    let bestD = Infinity;
    for (let l = 0; l < laneCount; l++) {
      if (taken.has(l) || lanes.words.held(l)) continue;
      const dx = tips[l * 3] - p.x;
      const dy = tips[l * 3 + 1] - p.y;
      const dz = tips[l * 3 + 2] - p.z; // lit-ok: z component
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    return best;
  }

  function takenLanes(): Set<number> {
    const taken = new Set<number>();
    for (const g of actives) for (const nd of g.nodes) if (nd.lane >= 0) taken.add(nd.lane);
    return taken;
  }

  function debugOf(g: ActiveGroup): NodeGroupDebug {
    return { n: g.n, seed: g.seed, slot: g.slot, count: g.nodes.length, color: g.color, offsets: g.nodes.map((nd) => [...nd.off]) };
  }

  // Claim a slot, meshes and lanes for group n at life t.
  function placeGroup(n: number, ySign: number, t: number): ActiveGroup | null {
    const slot = freeSlot();
    if (slot < 0) return null;
    const seed = serverNodeSeed(n);
    const made = nodeGroup(seed);
    const g: ActiveGroup = {
      n,
      seed,
      slot,
      color: made.color,
      rgb: hexToRgb(made.color),
      startSec: field.now() - t * DURATION_SEC,
      ySign,
      t,
      nodes: [],
      opacity: 0,
    };
    materials[slot].color.setRGB(g.rgb[0], g.rgb[1], g.rgb[2], THREE.SRGBColorSpace);
    cameraAxes();
    snapshotTips();
    const taken = takenLanes();
    // Placeholders first so the phone clamp sees the whole group box.
    g.nodes = made.offsets.map((off, i) => ({ mesh: pool[slot][i], lane: -1, off, rest: [0, 0, 0] }));
    // Lanes are picked against the spawn point at the focus, so each
    // node leaves the horn from the lane nearest its place in the group.
    groupPoint(g, 0, tmpPos);
    for (const nd of g.nodes) {
      nodePoint(nd, tmpPos, tmpPoint);
      nd.lane = nearestFree(tmpPoint, taken);
      if (nd.lane >= 0) {
        taken.add(nd.lane);
        nd.rest = [tips[nd.lane * 3], tips[nd.lane * 3 + 1], tips[nd.lane * 3 + 2]]; // lit-ok: xyz
      }
    }
    actives.push(g);
    return g;
  }

  // Pose one group at life t with an extra fade factor (pause, hide).
  function poseGroup(g: ActiveGroup, t: number, fade: number): void {
    const op = fade;
    g.t = t;
    g.opacity = op;
    materials[g.slot].opacity = op;
    groupPoint(g, t, tmpPos);
    for (const nd of g.nodes) {
      nodePoint(nd, tmpPos, tmpPoint);
      if (nd.lane >= 0) {
        // The node rides the bent tip: rest + bend x (point - rest).
        tmpPoint.set(
          nd.rest[0] + (tmpPoint.x - nd.rest[0]) * op,
          nd.rest[1] + (tmpPoint.y - nd.rest[1]) * op,
          nd.rest[2] + (tmpPoint.z - nd.rest[2]) * op, // lit-ok: z component
        );
      }
      nd.mesh.position.copy(tmpPoint);
      nd.mesh.quaternion.copy(field.camera.quaternion as THREE.Quaternion);
      nd.mesh.visible = op > 0;
    }
    lanes?.words.setTint(g.slot, g.rgb, op);
  }

  // One texture write per frame for every lit node lane.
  function writeLanes(): void {
    if (!lanes) return;
    const ids = scratchIds;
    const slots = scratchSlots;
    const offsets = scratchOffsets;
    ids.length = 0;
    slots.length = 0;
    for (const g of actives) {
      for (const nd of g.nodes) {
        if (nd.lane < 0) continue;
        const j = ids.length;
        ids.push(nd.lane);
        slots.push(g.slot);
        offsets[j * 3] = nd.mesh.position.x - nd.rest[0];
        offsets[j * 3 + 1] = nd.mesh.position.y - nd.rest[1];
        offsets[j * 3 + 2] = nd.mesh.position.z - nd.rest[2]; // lit-ok: z component
      }
    }
    lanes.words.writeLanes(ids, offsets, slots); // reads ids.length lanes, so the whole scratch is safe
  }

  // The three resting groups (S05 idle nodes), group n at restAt[n] of
  // its drift path. fadeIn eases them in over motion.ms.fast; reduced
  // motion places them at once.
  function placeStatics(fadeIn: boolean): void {
    const at = N.restAt;
    for (let i = 0; i < at.length; i++) {
      const g = placeGroup(i, i % 2 === 0 ? 1 : -1, at[i]);
      if (g) {
        spawned.push(debugOf(g));
        poseGroup(g, at[i], fadeIn ? 0 : 1);
      }
    }
    fadeInStartSec = fadeIn ? field.now() : null;
    writeLanes();
    f.guestbook?.render();
  }

  // Release every group: meshes hidden, lanes back to zero, tints off.
  function clearGroups(): void {
    for (const g of actives) {
      for (const nd of g.nodes) nd.mesh.visible = false;
      lanes?.words.setTint(g.slot, g.rgb, 0);
    }
    actives.length = 0;
    fadeInStartSec = null;
    lanes?.words.writeLanes([], new Float32Array(0), []);
  }

  function onFrame(): void {
    if (disposed) return;
    const now = field.now();
    if (fadeStartSec !== null) {
      const k = (now - fadeStartSec) / FAST_SEC;
      if (k >= 1) {
        clearGroups();
        fadeStartSec = null;
      } else {
        cameraAxes();
        for (const g of actives) poseGroup(g, g.t, Math.min(g.opacity, 1 - k));
        writeLanes();
      }
      return;
    }
    if (reduced || actives.length === 0) return;
    let k = 1;
    if (fadeInStartSec !== null) {
      k = Math.min(1, (now - fadeInStartSec) / FAST_SEC);
      if (k >= 1) fadeInStartSec = null;
    }
    // Re-pose every frame against the camera (idle yaw, parallax). The
    // fade in is linear like the fade out, so a reversal never jumps.
    cameraAxes();
    for (const g of actives) poseGroup(g, g.t, k);
    writeLanes();
  }

  const off = field.onFrame(onFrame);

  // Visible now: place the resting groups (fade in unless reduced). A
  // fade out still running turns around from where it is, so the lanes
  // never jump (K-SRV-7). // lit-ok: spec rule id
  function rest(): void {
    if (fadeStartSec !== null && !reduced && actives.length > 0) {
      const op = actives[0].opacity;
      fadeStartSec = null;
      fadeInStartSec = field.now() - op * FAST_SEC;
      return;
    }
    fadeStartSec = null;
    clearGroups();
    placeStatics(!reduced);
  }

  // Hide: fade out (reduced motion has no loop to carry it: clear now).
  function fadeOut(): void {
    if (reduced) {
      fadeStartSec = null;
      clearGroups();
      f.guestbook?.render();
    } else if (actives.length > 0 && fadeStartSec === null) {
      fadeStartSec = field.now();
    }
  }

  rest();

  return {
    pause(): void {
      if (paused || disposed) return;
      paused = true;
      fadeOut();
    },
    resume(): void {
      if (disposed) return;
      paused = false;
      if (hidden) return;
      rest();
    },
    setHidden(on: boolean): void {
      if (hidden === on || disposed) return;
      hidden = on;
      if (on) {
        fadeOut();
        return;
      }
      if (!paused) rest();
    },
    setReducedMotion(on: boolean): void {
      if (reduced === on || disposed) return;
      reduced = on;
      if (!hidden && !paused) rest();
      else {
        fadeStartSec = null;
        clearGroups();
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      off();
      clearGroups();
      for (const row of pool) for (const m of row) field.scene.remove(m);
      for (const m of materials) m.dispose();
      disc.dispose();
    },
    activeGroups(): NodeGroupDebug[] {
      return actives.filter((g) => g.nodes.some((nd) => nd.mesh.visible)).map(debugOf);
    },
    spawnedGroups(): NodeGroupDebug[] {
      return spawned.map((g) => ({ ...g, offsets: g.offsets.map((o) => [...o] as [number, number]) }));
    },
    isPaused(): boolean {
      return paused;
    },
    nodeLanes(): NodeLaneDebug[] {
      const out: NodeLaneDebug[] = [];
      for (const g of actives) {
        for (const nd of g.nodes) {
          const p = nd.mesh.position;
          out.push({
            group: g.n,
            slot: g.slot,
            lane: nd.lane,
            node: [p.x, p.y, p.z],
            restTip: [...nd.rest],
            texel: lanes && nd.lane >= 0 ? lanes.words.texel(nd.lane) : [0, 0, 0, 0],
            opacity: g.opacity,
          });
        }
      }
      return out;
    },
    groupFor(seed: number): Omit<NodeGroupDebug, 'n' | 'slot'> {
      const made = nodeGroup(seed);
      return { seed, count: made.count, color: made.color, offsets: made.offsets };
    },
  };
}
