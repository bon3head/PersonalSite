// SideQuests scene controller (S07): markers, trails, camera lean.
// Owns two draw calls: one InstancedMesh for the three marker heads,
// one for the three poles. The plan lanes themselves are the lanefield's.
// Side data (markers, trails) is regenerated here from the pure layout
// module with the same seed: the lanefield worker posts side data but
// the lanefield instance does not expose it, and regeneration is
// deterministic, so this copy is identical to the worker's.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import { generate, type SideQuestsSideData } from './layouts/sidequests';
import { poseFor } from './camera';
import { spring, damp, easePlain, easeSignature } from './tween';
import type { Lanefield } from './types';
import type { SceneController } from '../travel';

// Spring for marker position only (S07 motion rules, K-SQ-2: overshoot
// never on color, opacity, or camera). Color uses easePlain, camera
// uses damp.
const SPRING_ZETA = 0.7; // lit-ok: S07 section 4 marker spring damping ratio
const SPRING_FREQ = 3.2; // lit-ok: S07 section 4 marker spring frequency Hz
const INSTANT_RATE = 1000000; // lit-ok: S07 section 4 reduced-motion "very large" uPerSec
const CLAIM_EPSILON = 0.01; // lit-ok: camera follow convergence epsilon, world units

export interface SideQuestsController extends SceneController {
  readonly markerCount: number;
  walk(index: number): void;
  setHover(index: number | null): void;
  claimed(index: number): boolean;
  walking(index: number): boolean;
  trailLength(index: number): number;
  headRestY(index: number): number;
  headY(index: number): number;
  headBobY(index: number): number;
  headScreen(index: number): [number, number];
  onStateChange(cb: () => void): () => void;
  dispose(): void;
}

interface TrailActivity {
  lanes: Int32Array;
  starts: Float32Array;
  fades: Float32Array;
  uper: Float32Array;
}

interface MarkerState {
  x: number;
  z: number;
  claimed: boolean;
  walking: boolean;
  walkStart: number;
  walkLength: number;
  claimStart: number;
  riseStart: number;
  hoverFrom: number;
  hoverStart: number;
  hoverTarget: number;
  hoverLift: number;
  claimAnimStart: number;
  aClaim: number;
  activity: TrailActivity | null;
}

export function createSideQuestsController(
  lanefield: Lanefield,
  opts: {
    seed?: number;
    reducedMotion?: () => boolean;
  },
): SideQuestsController {
  const seed = opts.seed ?? T.world.seed;
  const reducedMotion = opts.reducedMotion ?? ((): boolean => false);
  const marker = T.world.sidequests.marker;
  const trailRate = T.world.sidequests.trailDrawUnitsPerSec;
  const follow = T.world.sidequests.cameraFollow;

  // Regenerate side data deterministically (same seed as the worker).
  const tex = T.world.layoutTexture;
  const scratch = new Float32Array(
    tex.width * tex.height * 4, // lit-ok: RGBA texel component count
  );
  const side: SideQuestsSideData = generate(seed, scratch, 2); // lit-ok: S02 layout index sidequests
  const layoutCount = T.world.layouts.length;
  const pointsPerLane = T.world.pointsPerLane;

  // Texel index for lane L, sidequests layout, point k (S02 layout chapter).
  function lanePoint(lane: number, k: number): [number, number, number] {
    const base =
      (lane * (layoutCount * pointsPerLane) +
        2 * pointsPerLane + // lit-ok: S02 layout index sidequests
        k) *
      4; // lit-ok: RGBA texel component count
    return [scratch[base], scratch[base + 1], scratch[base + 2]];
  }

  // Point at arc distance d along trail i, from the lane points.
  function trailPointAt(i: number, d: number): [number, number, number] {
    const trail = side.trails[i];
    let lane = trail.laneIds.length - 1;
    for (let j = 0; j < trail.laneIds.length; j++) {
      if (d < trail.arcStarts[j] + trail.arcLengths[j]) {
        lane = j;
        break;
      }
    }
    const laneId = trail.laneIds[lane];
    const local = Math.min(
      Math.max(d - trail.arcStarts[lane], 0),
      trail.arcLengths[lane],
    );
    const frac = trail.arcLengths[lane] > 0 ? local / trail.arcLengths[lane] : 0;
    const f = frac * (pointsPerLane - 1);
    const k0 = Math.min(Math.floor(f), pointsPerLane - 2);
    const k1 = k0 + 1;
    const t = f - k0;
    const p0 = lanePoint(laneId, k0);
    const p1 = lanePoint(laneId, k1);
    return [
      p0[0] + (p1[0] - p0[0]) * t,
      p0[1] + (p1[1] - p0[1]) * t,
      p0[2] + (p1[2] - p0[2]) * t,
    ];
  }

  const restY = marker.poleHeight + marker.radius * marker.squashY;

  const markers: MarkerState[] = side.markers.map(([x, z], i) => {
    let walkLength = 0;
    for (const len of side.trails[i].arcLengths) walkLength += len;
    return {
      x,
      z,
      claimed: false,
      walking: false,
      walkStart: 0,
      walkLength,
      claimStart: -1,
      riseStart: -1,
      hoverFrom: 0,
      hoverStart: 0,
      hoverTarget: 0,
      hoverLift: 0,
      claimAnimStart: -1,
      aClaim: 0,
      activity: null,
    };
  });

  // Head geometry: octahedron, squashed y, flat two-tone vertex colors
  // (chalk upper faces, chalk 2 lower faces, by face centroid y).
  const headGeoRaw = new THREE.OctahedronGeometry(marker.radius, 0);
  const headGeo = headGeoRaw.index ? headGeoRaw.toNonIndexed() : headGeoRaw;
  headGeo.scale(1, marker.squashY, 1);
  const posAttr = headGeo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3); // lit-ok: RGB channels
  const chalk = new THREE.Color(T.color.chalk);
  const chalk2 = new THREE.Color(T.color.chalk2);
  for (let f = 0; f < posAttr.count; f += 3) { // lit-ok: vertices per triangle face
    const cy =
      (posAttr.getY(f) + posAttr.getY(f + 1) + posAttr.getY(f + 2)) / 3; // lit-ok: face centroid mean
    const c = cy > 0 ? chalk : chalk2;
    for (let v = 0; v < 3; v++) { // lit-ok: vertices per triangle face
      colors[(f + v) * 3] = c.r;
      colors[(f + v) * 3 + 1] = c.g;
      colors[(f + v) * 3 + 2] = c.b;
    }
  }
  headGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // lit-ok: RGB channels
  const claimAttr = new THREE.InstancedBufferAttribute(
    new Float32Array(markers.length),
    1,
  );
  headGeo.setAttribute('aClaim', claimAttr);

  const headMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  headMat.onBeforeCompile = (shader): void => {
    shader.vertexShader =
      'attribute float aClaim;\nvarying float vClaim;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvClaim = aClaim;',
      );
    shader.fragmentShader =
      'varying float vClaim;\nuniform vec3 uSignal;\nuniform vec3 uSignalDim;\n' +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 claimedCol = vColor.r > 0.9 ? uSignal : uSignalDim; // lit-ok: chalk/chalk2 red threshold
        diffuseColor.rgb = mix(diffuseColor.rgb, claimedCol, vClaim);`,
      );
    shader.uniforms.uSignal = { value: new THREE.Color(T.color.signal) };
    shader.uniforms.uSignalDim = { value: new THREE.Color(T.color.signalDim) };
  };
  headMat.customProgramCacheKey = (): string => 'sq-head';

  const heads = new THREE.InstancedMesh(headGeo, headMat, markers.length);
  const poleGeo = new THREE.CylinderGeometry(
    marker.poleRadius,
    marker.poleRadius,
    marker.poleHeight,
    6, // lit-ok: S07 section 3.3 pole radial segments
  );
  const poles = new THREE.InstancedMesh(
    poleGeo,
    new THREE.MeshBasicMaterial({ color: T.color.chalk2 }),
    markers.length,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < markers.length; i++) {
    dummy.position.set(markers[i].x, marker.poleHeight / 2, markers[i].z);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);
    dummy.position.set(markers[i].x, 0, markers[i].z);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  }
  heads.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;
  heads.visible = false;
  poles.visible = false;
  lanefield.scene.add(heads);
  lanefield.scene.add(poles);

  // Per-frame head y (without bob separation for the test hook).
  const headYs: number[] = markers.map(() => 0);
  const headBobs: number[] = markers.map(() => 0);
  let suspended = true;
  let sinking = false;
  let sinkStart = 0;
  const followPoint = new THREE.Vector3();
  let followApplied = false;
  const stateListeners = new Set<() => void>();
  const notify = (): void => {
    for (const cb of stateListeners) cb();
  };

  function baseTarget(): [number, number, number] {
    const pose = poseFor('sidequests');
    return [pose.target[0], pose.target[1], pose.target[2]];
  }

  function springAt(start: number, t: number): number {
    if (t < start) return 0;
    return spring(SPRING_ZETA, SPRING_FREQ)(t - start);
  }

  function walk(i: number): void {
    const m = markers[i];
    if (m.walking) return;
    const now = lanefield.now();
    const trail = side.trails[i];
    const lanes = new Int32Array(trail.laneIds);
    const starts = new Float32Array(trail.laneIds.length);
    const fades = new Float32Array(trail.laneIds.length);
    const uper = new Float32Array(trail.laneIds.length);
    if (reducedMotion()) {
      for (let j = 0; j < trail.laneIds.length; j++) {
        starts[j] = now;
        uper[j] = INSTANT_RATE;
      }
    } else {
      for (let j = 0; j < trail.laneIds.length; j++) {
        starts[j] = now + trail.arcStarts[j] / trailRate;
        uper[j] = trailRate / trail.arcLengths[j];
      }
    }
    if (m.claimed) {
      // Re-walk: clear all kind-2 activity, re-light every other active
      // trail from its stored arrays (absolute start times resume the
      // draw), then light this trail fresh.
      lanefield.clearActivity(2);
      for (let j = 0; j < markers.length; j++) {
        if (j !== i && markers[j].activity) {
          const a = markers[j].activity as TrailActivity;
          lanefield.setActivity(a.lanes, a.starts, a.fades, 2, a.uper);
        }
      }
    }
    lanefield.setActivity(lanes, starts, fades, 2, uper);
    m.activity = { lanes, starts, fades, uper };
    m.walking = true;
    m.walkStart = now;
    const start = trailPointAt(i, 0);
    followPoint.set(start[0], start[1], start[2]);
    if (reducedMotion()) {
      m.walking = false;
      m.claimed = true;
      m.aClaim = 1;
      claimAttr.setX(i, 1);
      claimAttr.needsUpdate = true;
      notify();
    }
  }

  function doClaim(i: number, t: number): void {
    const m = markers[i];
    m.walking = false;
    m.claimed = true;
    m.claimStart = t;
    m.claimAnimStart = t;
    notify();
  }

  const offFrame = lanefield.onFrame((t, dt) => {
    const dtMs = dt * 1000; // lit-ok: seconds to milliseconds
    const reduced = reducedMotion();
    let anyWalking = false;
    let walkingTrail = -1;
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (m.walking && t >= m.walkStart + m.walkLength / trailRate) {
        doClaim(i, t);
      }
      if (m.walking) {
        anyWalking = true;
        walkingTrail = i;
      }
      // Claim color transition over fast ms with plain ease; instant
      // when reduced. Not a spring (K-SQ-2).
      if (m.claimAnimStart >= 0 && m.aClaim < 1) {
        if (reduced) {
          m.aClaim = 1;
        } else {
          const p = Math.min(
            (t - m.claimAnimStart) / (T.motion.ms.fast / 1000), // lit-ok: ms to seconds
            1,
          );
          m.aClaim = easePlain(p);
        }
        claimAttr.setX(i, m.aClaim);
        claimAttr.needsUpdate = true;
      }
      // Hover lift by spring toward its target; ignored when reduced.
      if (!reduced && (m.hoverTarget !== m.hoverLift || m.hoverStart > 0)) {
        const s = springAt(m.hoverStart, t);
        m.hoverLift = m.hoverTarget + (m.hoverFrom - m.hoverTarget) * (1 - s);
        if (s >= 1) {
          m.hoverLift = m.hoverTarget;
          m.hoverStart = 0;
        }
      } else if (reduced) {
        m.hoverLift = 0;
      }
      // Head y composition.
      let y: number;
      if (suspended) {
        y = 0;
      } else if (sinking) {
        const p = Math.min((t - sinkStart) / (T.motion.ms.travel / 1000), 1); // lit-ok: ms to seconds
        const bob = reduced
          ? 0
          : marker.bobAmp *
            Math.sin(
              (2 * Math.PI * t) / marker.bobPeriodSec + marker.bobPhases[i],
            );
        y = (restY + bob + m.hoverLift) * (1 - easeSignature(p));
        if (p >= 1) {
          suspended = true;
          sinking = false;
          heads.visible = false;
          poles.visible = false;
          y = 0;
        }
      } else if (m.riseStart >= 0 && t < m.riseStart) {
        y = 0;
      } else if (m.riseStart >= 0) {
        const bob = reduced
          ? 0
          : marker.bobAmp *
            Math.sin(
              (2 * Math.PI * t) / marker.bobPeriodSec + marker.bobPhases[i],
            );
        y = restY * springAt(m.riseStart, t) + bob + m.hoverLift;
      } else {
        const bob = reduced
          ? 0
          : marker.bobAmp *
            Math.sin(
              (2 * Math.PI * t) / marker.bobPeriodSec + marker.bobPhases[i],
            );
        y = restY + bob + m.hoverLift;
      }
      // Claim drop: from rest + claimDrop down to rest by spring, one
      // overshoot below rest (S07 motion rules). Added on top of bob and
      // hover so the test can subtract bob for the spring numbers test.
      if (m.claimStart >= 0 && !reduced) {
        y += marker.claimDrop * (1 - springAt(m.claimStart, t));
        if (t - m.claimStart > 1) {
          m.claimStart = -1;
        }
      }
      headYs[i] = y;
      headBobs[i] = reduced
        ? 0
        : marker.bobAmp *
          Math.sin(
            (2 * Math.PI * t) / marker.bobPeriodSec + marker.bobPhases[i],
          );
      dummy.position.set(m.x, y, m.z);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
    }
    heads.instanceMatrix.needsUpdate = true;

    // Camera lean: target damps (half-life from DESIGN) toward a point
    // a quarter of the way from the base target to the current drawing point
    // while drawing, then back to the base pose. Applied after the rig
    // (onFrame runs after rig.update, before render), so it survives to
    // the frame; when converged the rig resumes full control.
    const base = baseTarget();
    let lean: [number, number, number] | null = null;
    if (!reduced && anyWalking && walkingTrail >= 0) {
      const m = markers[walkingTrail];
      const d = Math.min(
        Math.max((t - m.walkStart) * trailRate, 0),
        m.walkLength,
      );
      const pt = trailPointAt(walkingTrail, d);
      lean = [
        base[0] + follow.weight * (pt[0] - base[0]),
        base[1] + follow.weight * (pt[1] - base[1]),
        base[2] + follow.weight * (pt[2] - base[2]),
      ];
    } else if (followApplied) {
      lean = base;
    }
    if (lean) {
      followPoint.x = damp(followPoint.x, lean[0], follow.halfLifeMs, dtMs);
      followPoint.y = damp(followPoint.y, lean[1], follow.halfLifeMs, dtMs);
      followPoint.z = damp(followPoint.z, lean[2], follow.halfLifeMs, dtMs);
      const dx = followPoint.x - base[0];
      const dy = followPoint.y - base[1];
      const dz = followPoint.z - base[2];
      if (
        !anyWalking &&
        Math.sqrt(dx * dx + dy * dy + dz * dz) < CLAIM_EPSILON
      ) {
        followApplied = false;
      } else {
        lanefield.camera.lookAt(followPoint.x, followPoint.y, followPoint.z);
        lanefield.camera.updateMatrixWorld();
        followApplied = true;
      }
    }
  });

  return {
    markerCount: markers.length,
    walk,
    setHover(index: number | null): void {
      if (reducedMotion()) return;
      const t = lanefield.now();
      for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        const target = index === i ? marker.hoverLift : 0;
        if (target !== m.hoverTarget) {
          m.hoverFrom = m.hoverLift;
          m.hoverStart = t;
          m.hoverTarget = target;
        }
      }
    },
    claimed(index: number): boolean {
      return markers[index].claimed;
    },
    walking(index: number): boolean {
      return markers[index].walking;
    },
    trailLength(index: number): number {
      return markers[index].walkLength;
    },
    headRestY(_index: number): number {
      return restY;
    },
    headY(index: number): number {
      return headYs[index];
    },
    headBobY(index: number): number {
      return headBobs[index];
    },
    headScreen(index: number): [number, number] {
      const m = markers[index];
      return lanefield.worldToScreen([m.x, headYs[index], m.z]);
    },
    onStateChange(cb: () => void): () => void {
      stateListeners.add(cb);
      return () => {
        stateListeners.delete(cb);
      };
    },
    pause(): void {
      if (suspended || sinking) return;
      sinking = true;
      sinkStart = lanefield.now();
    },
    resume(): void {
      const now = lanefield.now();
      suspended = false;
      sinking = false;
      heads.visible = true;
      poles.visible = true;
      for (let i = 0; i < markers.length; i++) {
        markers[i].riseStart =
          now + (i * marker.riseStaggerMs) / 1000; // lit-ok: ms to seconds
        markers[i].claimStart = -1;
      }
    },
    dispose(): void {
      offFrame();
      lanefield.scene.remove(heads);
      lanefield.scene.remove(poles);
      headGeo.dispose();
      headMat.dispose();
      poleGeo.dispose();
      (poles.material as THREE.Material).dispose();
    },
  };
}
