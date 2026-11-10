// Server scene controller (S05, DESIGN 6.15). Owns the in-scene stack // lit-ok: spec section reference
// words, formed from lanes: every character of a word rides the tip of
// its own lane, which bends out of the horn to carry it and draws it
// back as the word fades. Words spawn on wordCadence, drift from the
// focus toward the viewer, cool signal to text2, and fade after
// wordFadeFrom; the lane's bend and tint follow the word's opacity, so a
// lane is exactly at rest when its word ends and never snaps.
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
import { currentVariant } from './camera';

export interface WordLaneDebug {
  word: string;
  char: string;
  slot: number;
  lane: number;
  glyph: [number, number, number];
  restTip: [number, number, number];
  texel: [number, number, number, number];
  opacity: number;
}

export interface ServerController extends SceneController {
  setReducedMotion(on: boolean): void;
  // Guestbook open (S05 guestbook row): words fade out and none spawn.
  setHidden(on: boolean): void;
  dispose(): void;
  /** Strings currently visible (animated actives plus reduced statics). */
  activeWords(): string[];
  /** Full spawn history, in order (collected over the test window). */
  spawnedWords(): string[];
  isPaused(): boolean;
  /** Every lit character with its lane (T-SRV-7). */ // lit-ok: spec section reference
  wordLanes(): WordLaneDebug[];
}

interface Glyph {
  mesh: Text;
  ch: string;
  lane: number;
  // Position in the word, counting spaces, so the advance stays true.
  index: number;
  rest: [number, number, number];
}

interface ActiveWord {
  slot: number;
  text: string;
  startSec: number;
  ySign: number;
  // Life fraction, frozen while a pause or hide fade runs.
  t: number;
  glyphs: Glyph[];
  opacity: number;
}

const S = T.world.server;
const WORDS: readonly string[] = S.words;
const DURATION_SEC = T.motion.ms.word / 1000; // lit-ok: ms to seconds
const CADENCE_SEC = T.motion.ms.wordCadence / 1000; // lit-ok: ms to seconds
const FAST_SEC = T.motion.ms.fast / 1000; // lit-ok: ms to seconds
const FONT = '/fonts/commit-mono-latin-400-normal.woff';
const GLYPHS_PER_SLOT = Math.max(...WORDS.map((w) => w.replace(/ /g, '').length));

type Rgb = [number, number, number];

// Raw sRGB components (0 to 1) from a token hex, matching the lane
// shader's color space (ShaderMaterial output is not color-managed).
function hexToRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(3, 5), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(5, 7), 16) / 255, // lit-ok: hex channel parse
  ];
}

// Blend: spawn at lane signal, not near-white hot, so words sit in the
// field instead of flashing (DESIGN 1.3.0 server spray blend). // lit-ok: spec section reference
const HOT = hexToRgb(T.color.signal);
const SIGNAL = hexToRgb(T.color.signal);
const TEXT2 = hexToRgb(T.color.void.text2);

function mixRgb(a: Rgb, b: Rgb, f: number, out: Rgb): Rgb {
  out[0] = a[0] + (b[0] - a[0]) * f;
  out[1] = a[1] + (b[1] - a[1]) * f;
  out[2] = a[2] + (b[2] - a[2]) * f; // lit-ok: blue channel
  return out;
}

function colorAt(t: number, out: Rgb): Rgb {
  const stops = S.wordColorStops;
  // Stops are fixed by DESIGN (0, mid, 1); no degenerate guard needed.
  if (t <= stops[1]) return mixRgb(HOT, SIGNAL, (t - stops[0]) / (stops[1] - stops[0]), out);
  return mixRgb(SIGNAL, TEXT2, (t - stops[1]) / (stops[2] - stops[1]), out);
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

function makeGlyph(): Text {
  const mesh = new Text();
  mesh.font = FONT;
  mesh.fontSize = S.wordSize;
  mesh.textAnchor = 'center';
  mesh.anchorX = 'center';
  mesh.anchorY = 'middle';
  mesh.visible = false;
  return mesh;
}

export function createServerController(
  field: Lanefield,
  opts?: { reducedMotion?: boolean },
): ServerController {
  const f = field as Partial<Lanefield>;
  const lanes = f.words && f.guestbook ? { words: f.words, gb: f.guestbook } : null;
  const laneCount = T.world.laneCount;

  // One glyph mesh per character per pool slot.
  const pool: Text[][] = [];
  for (let s = 0; s < S.wordPool; s++) {
    const row: Text[] = [];
    for (let i = 0; i < GLYPHS_PER_SLOT; i++) {
      const mesh = makeGlyph();
      field.scene.add(mesh);
      row.push(mesh);
    }
    pool.push(row);
  }

  // Commit Mono advance and line box, measured from the loaded font.
  let advance = 0;
  let boxY: [number, number] = [0, 0];
  const measure = makeGlyph();
  measure.text = '0';

  let paused = false;
  let hidden = false;
  let reduced = opts?.reducedMotion ?? false;
  let disposed = false;
  let nextWord = 0;
  let spawnCount = 0;
  let accSec = CADENCE_SEC;
  let fadeStartSec: number | null = null;
  const actives: ActiveWord[] = [];
  const spawned: string[] = [];
  const tmpRgb: Rgb = [0, 0, 0];
  const tmpColor = new THREE.Color();
  const tmpPos = new THREE.Vector3();
  const tmpPoint = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const tips = new Float32Array(laneCount * 3); // lit-ok: xyz per lane
  const tip: [number, number, number] = [0, 0, 0];

  function freeSlot(): number {
    for (let s = 0; s < S.wordPool; s++) {
      if (!actives.some((w) => w.slot === s)) return s;
    }
    return -1;
  }

  function cameraAxes(): void {
    camRight.set(1, 0, 0).applyQuaternion(field.camera.quaternion);
    camUp.set(0, 1, 0).applyQuaternion(field.camera.quaternion);
  }

  // Phones (S05 phone row): keep the billboarded word box inside the
  // viewport inset by the gutter, sliding the drift point along the
  // camera's right and up axes by the overflow. Fine (desktop) words are
  // not clamped.
  const corner = new THREE.Vector3();
  function clampToView(chars: number, pos: THREE.Vector3): void {
    if (currentVariant() !== 'coarse') return;
    if (!f.worldToScreen || !f.viewportCss || advance <= 0) return;
    const half = (chars * advance) / 2;
    const bounds = [-half, boxY[0], half, boxY[1]];
    const [vw, vh] = f.viewportCss();
    const m = T.space.gutterPx.base;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const bx of [bounds[0], bounds[2]]) {
      for (const by of [bounds[1], bounds[3]]) {
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
    const pxPerWorldX = wPx / Math.max(1e-6, bounds[2] - bounds[0]); // lit-ok: zero-width guard
    const pxPerWorldY = hPx / Math.max(1e-6, bounds[3] - bounds[1]); // lit-ok: zero-height guard
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

  // Drift point of a word at life t, clamped on phones.
  function wordPoint(w: ActiveWord, t: number, out: THREE.Vector3): THREE.Vector3 {
    positionAt(t, w.ySign, out);
    clampToView(w.text.length, out);
    return out;
  }

  // Character point: the drift point plus the advance along camera right.
  function charPoint(w: ActiveWord, g: Glyph, center: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    const k = g.index - (w.text.length - 1) / 2;
    return out.copy(center).addScaledVector(camRight, k * advance);
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
    for (const w of actives) for (const g of w.glyphs) if (g.lane >= 0) taken.add(g.lane);
    return taken;
  }

  // Claim a slot, glyphs and lanes for one word at life t.
  function placeWord(text: string, ySign: number, t: number): ActiveWord | null {
    const slot = freeSlot();
    if (slot < 0) return null;
    const w: ActiveWord = { slot, text, startSec: field.now() - t * DURATION_SEC, ySign, t, glyphs: [], opacity: 0 };
    cameraAxes();
    snapshotTips();
    const taken = takenLanes();
    // Lanes are picked against the spawn point at the focus, so each
    // letter leaves the horn from the lane nearest its place in the word.
    wordPoint(w, 0, tmpPos);
    let n = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      const mesh = pool[slot][n];
      n += 1;
      const g: Glyph = { mesh, ch, lane: -1, index: i, rest: [0, 0, 0] };
      charPoint(w, g, tmpPos, tmpPoint);
      g.lane = nearestFree(tmpPoint, taken);
      if (g.lane >= 0) {
        taken.add(g.lane);
        g.rest = [tips[g.lane * 3], tips[g.lane * 3 + 1], tips[g.lane * 3 + 2]]; // lit-ok: xyz
      }
      if (mesh.text !== ch) {
        mesh.text = ch;
        mesh.sync(() => renderStill());
      }
      w.glyphs.push(g);
    }
    actives.push(w);
    return w;
  }

  function renderStill(): void {
    if (disposed) return;
    if (reduced || fadeStartSec === null) f.guestbook?.render();
  }

  // Pose one word at life t with an extra fade factor (pause, hide).
  function poseWord(w: ActiveWord, t: number, fade: number): void {
    const op = opacityAt(t) * fade;
    w.t = t;
    w.opacity = op;
    colorAt(t, tmpRgb);
    tmpColor.setRGB(tmpRgb[0], tmpRgb[1], tmpRgb[2], THREE.SRGBColorSpace);
    const hex = tmpColor.getHex();
    wordPoint(w, t, tmpPos);
    for (const g of w.glyphs) {
      charPoint(w, g, tmpPos, tmpPoint);
      if (g.lane >= 0) {
        // The glyph rides the bent tip: rest + bend x (point - rest).
        tmpPoint.set(
          g.rest[0] + (tmpPoint.x - g.rest[0]) * op,
          g.rest[1] + (tmpPoint.y - g.rest[1]) * op,
          g.rest[2] + (tmpPoint.z - g.rest[2]) * op, // lit-ok: z component
        );
      }
      g.mesh.position.copy(tmpPoint);
      g.mesh.quaternion.copy(field.camera.quaternion);
      g.mesh.color = hex;
      g.mesh.fillOpacity = op;
      g.mesh.visible = true;
    }
    lanes?.words.setTint(w.slot, tmpRgb, op);
  }

  // One texture write per frame for every lit word lane.
  function writeLanes(): void {
    if (!lanes) return;
    const ids: number[] = [];
    const slots: number[] = [];
    let count = 0;
    for (const w of actives) for (const g of w.glyphs) if (g.lane >= 0) count += 1;
    const offsets = new Float32Array(count * 3); // lit-ok: xyz per lane
    let j = 0;
    for (const w of actives) {
      for (const g of w.glyphs) {
        if (g.lane < 0) continue;
        ids.push(g.lane);
        slots.push(w.slot);
        offsets[j * 3] = g.mesh.position.x - g.rest[0];
        offsets[j * 3 + 1] = g.mesh.position.y - g.rest[1];
        offsets[j * 3 + 2] = g.mesh.position.z - g.rest[2]; // lit-ok: z component
        j += 1;
      }
    }
    lanes.words.writeLanes(ids, offsets, slots);
  }

  function spawnWord(): void {
    if (paused || hidden || reduced || disposed || advance <= 0) return;
    const text = WORDS[nextWord % WORDS.length];
    const ySign = spawnCount % 2 === 0 ? 1 : -1;
    const w = placeWord(text, ySign, 0);
    if (!w) return;
    nextWord += 1;
    spawnCount += 1;
    spawned.push(text);
    poseWord(w, 0, 1);
    writeLanes();
  }

  function placeReducedStatics(): void {
    // Three words at rest at reducedWordAt fractions of their drift path,
    // with color, opacity and lane bend at those points (S05 motion).
    if (advance <= 0) return;
    const at = S.reducedWordAt;
    for (let i = 0; i < at.length; i++) {
      const w = placeWord(WORDS[i % WORDS.length], i % 2 === 0 ? 1 : -1, at[i]);
      if (w) poseWord(w, at[i], 1);
    }
    writeLanes();
    f.guestbook?.render();
  }

  // Release every word: glyphs hidden, lanes back to zero, tints off.
  function clearWords(): void {
    for (const w of actives) {
      for (const g of w.glyphs) g.mesh.visible = false;
      lanes?.words.setTint(w.slot, tmpRgb, 0);
    }
    actives.length = 0;
    lanes?.words.writeLanes([], new Float32Array(0), []);
  }

  measure.sync(() => {
    if (disposed) return;
    const bb = (measure.textRenderInfo as { blockBounds?: number[] } | undefined)?.blockBounds;
    if (!bb) return;
    advance = bb[2] - bb[0];
    boxY = [bb[1], bb[3]]; // lit-ok: blockBounds y channels
    if (reduced && !hidden && !paused && actives.length === 0) placeReducedStatics();
  });

  function onFrame(_tSec: number, dtSec: number): void {
    if (disposed) return;
    const now = field.now();
    if (fadeStartSec !== null) {
      const k = (now - fadeStartSec) / FAST_SEC;
      if (k >= 1) {
        clearWords();
        fadeStartSec = null;
      } else {
        cameraAxes();
        for (const w of actives) poseWord(w, w.t, 1 - k);
        writeLanes();
      }
      return;
    }
    if (reduced) return;
    if (!paused && !hidden) {
      accSec += dtSec;
      if (accSec >= CADENCE_SEC) {
        accSec -= CADENCE_SEC;
        spawnWord();
      }
    }
    if (actives.length === 0) return;
    cameraAxes();
    for (let i = actives.length - 1; i >= 0; i--) {
      const w = actives[i];
      const t = (now - w.startSec) / DURATION_SEC;
      if (t >= 1) {
        for (const g of w.glyphs) g.mesh.visible = false;
        lanes?.words.setTint(w.slot, tmpRgb, 0);
        actives.splice(i, 1);
        continue;
      }
      poseWord(w, t, 1);
    }
    writeLanes();
  }

  const off = field.onFrame(onFrame);

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
      clearWords();
      if (hidden) return;
      if (reduced) {
        placeReducedStatics();
      } else {
        accSec = CADENCE_SEC;
      }
    },
    setHidden(on: boolean): void {
      if (hidden === on || disposed) return;
      hidden = on;
      if (on) {
        // Reduced motion runs no loop to carry a fade: clear and render now.
        if (reduced) {
          fadeStartSec = null;
          clearWords();
          f.guestbook?.render();
        } else if (actives.length > 0) {
          fadeStartSec = field.now();
        }
        return;
      }
      fadeStartSec = null;
      clearWords();
      if (paused) return;
      if (reduced) placeReducedStatics();
      else accSec = CADENCE_SEC;
    },
    setReducedMotion(on: boolean): void {
      if (reduced === on || disposed) return;
      reduced = on;
      fadeStartSec = null;
      clearWords();
      if (on && !hidden) {
        placeReducedStatics();
      } else if (!paused) {
        accSec = CADENCE_SEC;
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      off();
      clearWords();
      for (const row of pool) {
        for (const m of row) {
          field.scene.remove(m);
          m.dispose();
        }
      }
      measure.dispose();
    },
    activeWords(): string[] {
      return actives.filter((w) => w.glyphs.some((g) => g.mesh.visible)).map((w) => w.text);
    },
    spawnedWords(): string[] {
      return [...spawned];
    },
    isPaused(): boolean {
      return paused;
    },
    wordLanes(): WordLaneDebug[] {
      const out: WordLaneDebug[] = [];
      for (const w of actives) {
        for (const g of w.glyphs) {
          const p = g.mesh.position;
          out.push({
            word: w.text,
            char: g.ch,
            slot: w.slot,
            lane: g.lane,
            glyph: [p.x, p.y, p.z],
            restTip: [...g.rest],
            texel: lanes && g.lane >= 0 ? lanes.words.texel(g.lane) : [0, 0, 0, 0],
            opacity: w.opacity,
          });
        }
      }
      return out;
    },
  };
}
