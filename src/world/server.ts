// Server scene controller (S05). Owns the in-scene stack words: a troika
// Text pool spawned on wordCadence, drifting from the focus toward the
// viewer, cooling hot to signal to text2, fading after wordFadeFrom.
// Camera idle yaw and pointer parallax reside in the lanefield rig (S02
// camera section), not here; lane pulses reside in the fire() shader.
// The controller exposes pause/resume for travel (S03 SceneController)
// and debug accessors for the S05 word tests.
import * as THREE from 'three';
// @ts-ignore: troika ships types under dist/types but no package.json
// types field, so TS cannot find them (same untyped-module pattern as
// B4's laneTheme import).
import { Text } from 'troika-three-text';
import { T } from '../tokens.generated';
import type { Lanefield } from './types';
import type { SceneController } from '../travel';
import { easePlain } from './tween';

export interface ServerController extends SceneController {
  setReducedMotion(on: boolean): void;
  dispose(): void;
  /** Strings currently visible (animated actives plus reduced statics). */
  activeWords(): string[];
  /** Full spawn history, in order (collected over the test window). */
  spawnedWords(): string[];
  isPaused(): boolean;
}

interface ActiveWord {
  mesh: Text;
  text: string;
  startSec: number;
  ySign: number;
}

const S = T.world.server;
const WORDS: readonly string[] = S.words;
const DURATION_SEC = T.motion.ms.word / 1000; // lit-ok: ms to seconds
const CADENCE_SEC = T.motion.ms.wordCadence / 1000; // lit-ok: ms to seconds
const FAST_SEC = T.motion.ms.fast / 1000; // lit-ok: ms to seconds

function colorAt(t: number, out: THREE.Color): THREE.Color {
  const stops = S.wordColorStops;
  const hot = new THREE.Color(T.color.signalHot);
  const signal = new THREE.Color(T.color.signal);
  const text2 = new THREE.Color(T.color.void.text2);
  // Stops are fixed by DESIGN (0, mid, 1); no degenerate guard needed.
  if (t <= stops[1]) {
    const f = (t - stops[0]) / (stops[1] - stops[0]);
    return out.copy(hot).lerp(signal, f);
  }
  const f = (t - stops[1]) / (stops[2] - stops[1]);
  return out.copy(signal).lerp(text2, f);
}

function opacityAt(t: number): number {
  if (t <= S.wordFadeFrom) return 1;
  const f = (t - S.wordFadeFrom) / (1 - S.wordFadeFrom);
  return 1 - easePlain(f);
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
  const pool: Text[] = [];
  for (let i = 0; i < S.wordPool; i++) {
    const mesh = new Text();
    mesh.font = '/fonts/commit-mono-latin-400-normal.woff';
    mesh.fontSize = S.wordSize;
    mesh.textAnchor = 'center';
    mesh.anchorY = 'middle';
    mesh.visible = false;
    field.scene.add(mesh);
    pool.push(mesh);
  }

  let paused = false;
  let reduced = opts?.reducedMotion ?? false;
  let disposed = false;
  let nextWord = 0;
  let spawnCount = 0;
  let accSec = CADENCE_SEC;
  let fadeStartSec: number | null = null;
  const actives: ActiveWord[] = [];
  const spawned: string[] = [];
  const tmpColor = new THREE.Color();
  const tmpPos = new THREE.Vector3();

  function freeMesh(): Text | null {
    for (const m of pool) {
      if (!m.visible) return m;
    }
    return null;
  }

  function spawnWord(): void {
    if (paused || reduced || disposed) return;
    const mesh = freeMesh();
    if (!mesh) return;
    const text = WORDS[nextWord % WORDS.length];
    nextWord += 1;
    const ySign = spawnCount % 2 === 0 ? 1 : -1;
    spawnCount += 1;
    mesh.text = text;
    mesh.visible = true;
    mesh.fillOpacity = 1;
    colorAt(0, tmpColor);
    mesh.color = tmpColor.getHex();
    positionAt(0, ySign, tmpPos);
    mesh.position.copy(tmpPos);
    mesh.quaternion.copy(field.camera.quaternion);
    mesh.sync();
    actives.push({ mesh, text, startSec: field.now(), ySign });
    spawned.push(text);
  }

  function placeReducedStatics(): void {
    // Three words at rest at reducedWordAt fractions of their drift path,
    // with color and opacity at those points (S05 motion section).
    const at = S.reducedWordAt;
    for (let i = 0; i < at.length; i++) {
      const mesh = pool[i];
      if (!mesh) continue;
      const text = WORDS[i % WORDS.length];
      const t = at[i];
      const ySign = i % 2 === 0 ? 1 : -1;
      mesh.text = text;
      mesh.visible = true;
      mesh.fillOpacity = opacityAt(t);
      colorAt(t, tmpColor);
      mesh.color = tmpColor.getHex();
      positionAt(t, ySign, tmpPos);
      mesh.position.copy(tmpPos);
      mesh.quaternion.copy(field.camera.quaternion);
      mesh.sync();
      actives.push({ mesh, text, startSec: field.now(), ySign });
    }
  }

  function clearMeshes(): void {
    for (const m of pool) m.visible = false;
    actives.length = 0;
  }

  function onFrame(_tSec: number, dtSec: number): void {
    if (disposed) return;
    const now = field.now();
    if (fadeStartSec !== null) {
      const f = (now - fadeStartSec) / FAST_SEC;
      if (f >= 1) {
        clearMeshes();
        fadeStartSec = null;
      } else {
        for (const w of actives) w.mesh.fillOpacity = 1 - f;
      }
      return;
    }
    if (reduced) return;
    if (!paused) {
      accSec += dtSec;
      if (accSec >= CADENCE_SEC) {
        accSec -= CADENCE_SEC;
        spawnWord();
      }
    }
    for (let i = actives.length - 1; i >= 0; i--) {
      const w = actives[i];
      const t = (now - w.startSec) / DURATION_SEC;
      if (t >= 1) {
        w.mesh.visible = false;
        actives.splice(i, 1);
        continue;
      }
      positionAt(t, w.ySign, tmpPos);
      w.mesh.position.copy(tmpPos);
      w.mesh.quaternion.copy(field.camera.quaternion);
      colorAt(t, tmpColor);
      w.mesh.color = tmpColor.getHex();
      w.mesh.fillOpacity = opacityAt(t);
    }
  }

  const off = field.onFrame(onFrame);

  if (reduced) placeReducedStatics();

  return {
    pause(): void {
      if (paused || disposed) return;
      paused = true;
      if (actives.length > 0) fadeStartSec = field.now();
    },
    resume(): void {
      if (disposed) return;
      paused = false;
      fadeStartSec = null;
      clearMeshes();
      if (reduced) {
        placeReducedStatics();
      } else {
        accSec = CADENCE_SEC;
      }
    },
    setReducedMotion(on: boolean): void {
      if (reduced === on || disposed) return;
      reduced = on;
      fadeStartSec = null;
      clearMeshes();
      if (on) {
        placeReducedStatics();
      } else if (!paused) {
        accSec = CADENCE_SEC;
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      off();
      for (const m of pool) {
        field.scene.remove(m);
        m.dispose();
      }
      actives.length = 0;
    },
    activeWords(): string[] {
      return actives.filter((w) => w.mesh.visible).map((w) => w.text);
    },
    spawnedWords(): string[] {
      return [...spawned];
    },
    isPaused(): boolean {
      return paused;
    },
  };
}
