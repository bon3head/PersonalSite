// Camera rig (S02 camera chapter): pose selection, principal-point shift,
// idle yaw, leaflink drift, and pointer parallax.
// travel-ready pose lerp, idle yaw / leaflink drift, pointer parallax,
// and screen/ground projection using the shifted matrices.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { LayoutId } from './types';
import { damp } from './tween';

export interface Pose {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  shift: [number, number];
}

const DEG_TO_RAD = Math.PI / 180; // lit-ok: degree to radian conversion
const IDLE_YAW_LAYOUTS = ['server', 'sidequests', 'scatter'] as const;

// Variant: coarse when narrow, or when a coarse pointer is on a
// below-desktop viewport. Re-evaluated on resize and orientation change.
export function isCoarseVariant(): boolean {
  if (window.innerWidth < T.breakpoints.coarseOrNarrowBelowPx) return true;
  if (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < T.breakpoints.desktopFromPx) {
    return true;
  }
  return false;
}

export function currentVariant(): 'coarse' | 'fine' {
  return isCoarseVariant() ? 'coarse' : 'fine';
}

export function poseFor(layout: LayoutId, variant: 'coarse' | 'fine' = currentVariant()): Pose {
  const p = T.world.camera[layout][variant];
  return {
    pos: [...p.pos] as [number, number, number],
    target: [...p.target] as [number, number, number],
    fov: p.fovDeg,
    shift: [...p.shiftNdc] as [number, number],
  };
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    pos: [mix(a.pos[0], b.pos[0]), mix(a.pos[1], b.pos[1]), mix(a.pos[2], b.pos[2])],
    target: [mix(a.target[0], b.target[0]), mix(a.target[1], b.target[1]), mix(a.target[2], b.target[2])],
    fov: mix(a.fov, b.fov),
    shift: [mix(a.shift[0], b.shift[0]), mix(a.shift[1], b.shift[1])],
  };
}

// Lerp into a preallocated pose (no allocation; for the per-frame path).
export function lerpPoseInto(a: Pose, b: Pose, t: number, out: Pose): void {
  const mix = (x: number, y: number) => x + (y - x) * t;
  out.pos[0] = mix(a.pos[0], b.pos[0]);
  out.pos[1] = mix(a.pos[1], b.pos[1]);
  out.pos[2] = mix(a.pos[2], b.pos[2]);
  out.target[0] = mix(a.target[0], b.target[0]);
  out.target[1] = mix(a.target[1], b.target[1]);
  out.target[2] = mix(a.target[2], b.target[2]);
  out.fov = mix(a.fov, b.fov);
  out.shift[0] = mix(a.shift[0], b.shift[0]);
  out.shift[1] = mix(a.shift[1], b.shift[1]);
}

const UP = new THREE.Vector3(0, 1, 0);

export class CameraRig {
  private camera: THREE.PerspectiveCamera;
  private pos = new THREE.Vector3();
  private target = new THREE.Vector3();
  private offset = new THREE.Vector3();
  private forward = new THREE.Vector3();
  private right = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private applied: Pose;
  private composed: Pose;
  private smoothX = 0;
  private smoothY = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.applied = poseFor('server');
    this.composed = poseFor('server');
  }

  // Apply a pose to the camera, including the principal-point shift.
  // Positive shift[0] moves the image right in NDC.
  // Writes the applied pose in place (no allocation on the frame path).
  applyPose(pose: Pose): void {
    const cam = this.camera;
    cam.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    cam.lookAt(pose.target[0], pose.target[1], pose.target[2]);
    cam.fov = pose.fov;
    cam.updateProjectionMatrix();
    cam.projectionMatrix.elements[8] = -pose.shift[0];
    cam.projectionMatrix.elements[9] = -pose.shift[1];
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    this.applied.pos[0] = pose.pos[0];
    this.applied.pos[1] = pose.pos[1];
    this.applied.pos[2] = pose.pos[2];
    this.applied.target[0] = pose.target[0];
    this.applied.target[1] = pose.target[1];
    this.applied.target[2] = pose.target[2];
    this.applied.fov = pose.fov;
    this.applied.shift[0] = pose.shift[0];
    this.applied.shift[1] = pose.shift[1];
  }

  // Compose one frame's camera from a base pose: idle yaw (weights blend
  // the amplitude during travel), leaflink drift, pointer parallax.
  // All three are off under reduced motion.
  update(
    base: Pose,
    tSec: number,
    weights: readonly number[],
    pointer: { x: number; y: number },
    dtMs: number,
    reduced: boolean,
    finePointer: boolean,
  ): void {
    this.pos.set(base.pos[0], base.pos[1], base.pos[2]);
    this.target.set(base.target[0], base.target[1], base.target[2]);
    if (!reduced) {
      let yaw = 0;
      for (const name of IDLE_YAW_LAYOUTS) {
        const idx = T.world.layouts.indexOf(name);
        const deg = T.world.camera.idleYawDeg[name];
        const period = T.world.camera.idleYawPeriodSec[name];
        yaw += weights[idx] * deg * DEG_TO_RAD * Math.sin((2 * Math.PI * tSec) / period);
      }
      if (yaw !== 0) {
        this.offset.copy(this.pos).sub(this.target);
        this.offset.applyAxisAngle(UP, yaw);
        this.pos.copy(this.target).add(this.offset);
      }
      const wLeaf = weights[T.world.layouts.indexOf('leaflink')];
      if (wLeaf !== 0) {
        const amp = T.world.camera.leaflinkDrift.amp;
        const period = T.world.camera.leaflinkDrift.periodSec;
        const dx = wLeaf * amp[0] * Math.sin((2 * Math.PI * tSec) / period);
        const dz = wLeaf * amp[1] * Math.sin((2 * Math.PI * tSec) / period * 0.7); // lit-ok: S02 drift factor
        this.pos.x += dx;
        this.pos.z += dz;
        this.target.x += dx;
        this.target.z += dz;
      }
      if (finePointer) {
        const halfLife = T.world.camera.parallaxDampHalfLifeMs;
        this.smoothX = damp(this.smoothX, pointer.x, halfLife, dtMs);
        this.smoothY = damp(this.smoothY, pointer.y, halfLife, dtMs);
        const deg = T.world.camera.parallaxDeg * DEG_TO_RAD;
        const yawOff = this.smoothX * deg;
        const pitchOff = -this.smoothY * deg;
        if (yawOff !== 0) {
          this.offset.copy(this.pos).sub(this.target);
          this.offset.applyAxisAngle(UP, yawOff);
          this.pos.copy(this.target).add(this.offset);
        }
        if (pitchOff !== 0) {
          this.forward.copy(this.target).sub(this.pos).normalize();
          this.right.crossVectors(this.forward, UP).normalize();
          this.offset.copy(this.pos).sub(this.target);
          this.offset.applyAxisAngle(this.right, pitchOff);
          this.pos.copy(this.target).add(this.offset);
        }
      }
    }
    this.composed.pos[0] = this.pos.x;
    this.composed.pos[1] = this.pos.y;
    this.composed.pos[2] = this.pos.z;
    this.composed.target[0] = this.target.x;
    this.composed.target[1] = this.target.y;
    this.composed.target[2] = this.target.z;
    this.composed.fov = base.fov;
    this.composed.shift[0] = base.shift[0];
    this.composed.shift[1] = base.shift[1];
    this.applyPose(this.composed);
  }

  currentPose(): Pose {
    return {
      pos: [...this.applied.pos],
      target: [...this.applied.target],
      fov: this.applied.fov,
      shift: [...this.applied.shift],
    };
  }

  // Ray from CSS px through the (shifted) camera to the plane y = 0.
  screenToGround(xCss: number, yCss: number, cssW: number, cssH: number): [number, number] | null {
    this.camera.updateMatrixWorld();
    const ndcX = (xCss / cssW) * 2 - 1;
    const ndcY = -(yCss / cssH) * 2 + 1;
    this.tmp.set(ndcX, ndcY, 0.5).unproject(this.camera);
    const dir = this.tmp.sub(this.camera.position).normalize();
    if (dir.y >= 0) return null;
    const dist = -this.camera.position.y / dir.y;
    const px = this.camera.position.x + dir.x * dist;
    const pz = this.camera.position.z + dir.z * dist;
    return [px, pz];
  }

  // Project a world point to CSS px through the shifted matrix.
  worldToScreen(p: [number, number, number], cssW: number, cssH: number): [number, number] {
    this.camera.updateMatrixWorld();
    this.tmp.set(p[0], p[1], p[2]).project(this.camera);
    return [(this.tmp.x + 1) / 2 * cssW, (1 - this.tmp.y) / 2 * cssH];
  }
}
