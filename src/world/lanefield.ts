/// <reference types="vite/client" />
// Lanefield engine (S02): one WebGL2 canvas drawing every lane in
// one draw call, morphing between four layouts by uniform weights.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { CameraFocus, GuestbookCamera, GuestbookFrame, GuestbookPart, HeroAnchorPx, LaneParams, Lanefield, LayoutId } from './types';
import { easeSignature, easePlain, damp, cubicBezier } from './tween';
import { CameraRig, poseFor, lerpPoseInto, clampSideQuestsPitch, type Pose } from './camera';
import { Governor } from './governor';
import { createDebugView } from './debug';
import {
  paramsForLayout,
  cloneParams,
  lerpParams,
  lightModeIndex,
  laneAttributes as laneAttributesFor,
} from './laneParams';
import {
  SILHOUETTE_MASK_SIZE,
} from './silhouette';
import {
  createMorphController,
  morphTravelDone,
  type MorphAnchor,
  type MorphSample,
  type MorphSnapshot,
} from '../motion/morph-controller';
import { morphEntropy, signed, setEntropyEnabled } from '../motion/entropy';
import { loadBrandManifest } from '../lib/brandManifest';
import { descriptorForLayout } from '../motion/hero-descriptors';
import type { SilhouetteMaskKind } from './types';
import laneVert from './shaders/lane.vert.glsl?raw';
import laneFrag from './shaders/lane.frag.glsl?raw';

const LAYOUT_ORDER: readonly LayoutId[] = T.world.layouts;
const TEXEL_FLOATS = 4; // lit-ok: RGBA channels
const MS_TO_SEC = 0.001; // lit-ok: milliseconds to seconds
const SEC_TO_MS = 1000; // lit-ok: seconds to milliseconds
const GB_UP = new THREE.Vector3(0, 1, 0);
const LANE_STRIDE = 32; // lit-ok: texels per lane in the layout texture (4 layouts x 8 points)
const POINTS_PER_LAYOUT = 8; // lit-ok: points per lane per layout

// GLSL hash11 port (lane.vert.glsl), for the lane length scale.
function hash11(p: number): number {
  let q = p * 0.1031; // lit-ok: shader hash constant
  q -= Math.floor(q);
  q *= q + 33.33; // lit-ok: shader hash constant
  q *= q + q;
  return q - Math.floor(q);
}

function layoutIndex(id: LayoutId): number {
  return LAYOUT_ORDER.indexOf(id);
}

function oneHot(id: LayoutId, out: number[]): void {
  for (let i = 0; i < LAYOUT_ORDER.length; i++) out[i] = i === layoutIndex(id) ? 1 : 0;
}

// Raw sRGB components (0 to 1) from a token hex string. Lane colors use
// these directly (ShaderMaterial output is not color-managed), never
// THREE.Color objects (those hold linear values and come out dark).
function hexToVec3(hex: string): THREE.Vector3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255; // lit-ok: hex channel parse
  const g = parseInt(hex.slice(3, 5), 16) / 255; // lit-ok: hex channel parse
  const b = parseInt(hex.slice(5, 7), 16) / 255; // lit-ok: hex channel parse
  return new THREE.Vector3(r, g, b);
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(3, 5), 16) / 255, // lit-ok: hex channel parse
    parseInt(hex.slice(5, 7), 16) / 255, // lit-ok: hex channel parse
  ];
}

// Regime grounds per layout: server void, leaflink paper, sidequests
// field, scatter void.
const GROUNDS: [number, number, number][] = [
  hexToRgb(T.color.void.ground),
  hexToRgb(T.color.paper.ground),
  hexToRgb(T.color.field.ground),
  hexToRgb(T.color.void.ground),
];
const GROUND_HEX: string[] = [
  T.color.void.ground,
  T.color.paper.ground,
  T.color.field.ground,
  T.color.void.ground,
];

// Class styles (widthPx, alpha) and colors, S02 class chapter.
// Signal for server classes, ink for leaflink and the route, chalk for
// sidequests classes, signalDim for scatter, chalk core with signal rim
// for the lit trail (the fragment shader mixes the rim). Trailing
// entries are unused and never sampled (alpha zero).
function classStyle(): THREE.Vector2[] {
  const s = T.world;
  const defs: [number, number][] = [
    [s.server.classes.lane.widthPx, s.server.classes.lane.alpha],
    [s.server.classes.converge.widthPx, s.server.classes.converge.alpha],
    [s.leaflink.classes.local.widthPx, s.leaflink.classes.local.alpha],
    [s.leaflink.classes.arterial.widthPx, s.leaflink.classes.arterial.alpha],
    [s.sidequests.classes.grid.widthPx, s.sidequests.classes.grid.alpha],
    [s.sidequests.classes.outline.widthPx, s.sidequests.classes.outline.alpha],
    [s.sidequests.classes.hatch.widthPx, s.sidequests.classes.hatch.alpha],
    [s.sidequests.classes.walkway.widthPx, s.sidequests.classes.walkway.alpha],
    [s.sidequests.classes.trail.widthPx, s.sidequests.classes.trail.alpha],
    [s.scatter.classes.lane.widthPx, s.scatter.classes.lane.alpha],
    [s.leaflink.classes.route.widthPx, s.leaflink.classes.route.alpha],
    [s.sidequests.classes.trailLit.widthPx, s.sidequests.classes.trailLit.alpha],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  return defs.map(([w, a]) => new THREE.Vector2(w, a));
}

export function createLanefield(
  mount: HTMLElement,
  opts: { seed: number; reducedMotion: boolean; initial: LayoutId },
): Lanefield | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('world') === '0') return null;
  const lanesOnly = params.get('debug') === 'lanesOnly';

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100dvh';
  canvas.style.zIndex = '0';
  mount.appendChild(canvas);

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
  });
  if (!gl) {
    canvas.remove();
    return null;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const t0 = performance.now();
  const now = () => (performance.now() - t0) * MS_TO_SEC;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    poseFor(opts.initial).fov,
    1,
    T.world.camera.near,
    T.world.camera.far,
  );
  // ITEM 6 init: the camera starts from the resting pose, never from // lit-ok:
  // the THREE default at the origin. rig.applyPose re-applies this
  // pose with its principal-point shift before the first draw.
  {
    const initPose = poseFor(opts.initial);
    camera.position.set(initPose.pos[0], initPose.pos[1], initPose.pos[2]);
    camera.lookAt(initPose.target[0], initPose.target[1], initPose.target[2]);
  }
  const rig = new CameraRig(camera);

  // Layout texture: RGBA32F, full layout texture size, one texel per
  // (lane, layout, point).
  const texSpec = T.world.layoutTexture;
  const layoutData = new Float32Array(texSpec.width * texSpec.height * TEXEL_FLOATS);
  const layoutTex = new THREE.DataTexture(
    layoutData,
    texSpec.width,
    texSpec.height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  layoutTex.magFilter = THREE.NearestFilter;
  layoutTex.minFilter = THREE.NearestFilter;
  layoutTex.generateMipmaps = false;
  layoutTex.flipY = false;
  layoutTex.needsUpdate = true;

  // Activity texture: one texel per lane.
  const actSpec = T.world.activityTexture;
  const activityData = new Float32Array(actSpec.width * actSpec.height * TEXEL_FLOATS);
  const activityTex = new THREE.DataTexture(
    activityData,
    actSpec.width,
    actSpec.height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  activityTex.magFilter = THREE.NearestFilter;
  activityTex.minFilter = THREE.NearestFilter;
  activityTex.generateMipmaps = false;
  activityTex.flipY = false;
  activityTex.needsUpdate = true;

  // Guestbook offsets (DESIGN, guestbook section): one texel per lane, same size as
  // the activity texture. RGB is a world offset, A the bend flag. Only
  // letter lanes carry a texel; every other lane reads zero.
  const gbData = new Float32Array(actSpec.width * actSpec.height * TEXEL_FLOATS);
  const gbTex = new THREE.DataTexture(
    gbData,
    actSpec.width,
    actSpec.height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  gbTex.magFilter = THREE.NearestFilter;
  gbTex.minFilter = THREE.NearestFilter;
  gbTex.generateMipmaps = false;
  gbTex.flipY = false;
  gbTex.needsUpdate = true;
  const gbWritten = new Set<number>();
  // Server words formed from lanes (DESIGN 6.15): word lanes share the // lit-ok: spec section reference
  // texture, texel alpha 2 plus the pool slot. A guestbook lane is never
  // taken by a word; a guestbook write takes a lane back from the words.
  const WORD_ALPHA_BASE = 2; // lit-ok: texel alpha 1 is guestbook, 2 plus slot a word
  const wordWritten = new Set<number>();
  const wordTint = Array.from({ length: T.world.server.nodes.pool }, () => new THREE.Vector4(0, 0, 0, 0));

  // Geometry: one instanced quad per segment, all segment instances.
  const geometry = new THREE.InstancedBufferGeometry();
  const quad = new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]);
  geometry.setAttribute('position', new THREE.BufferAttribute(quad, 3)); // lit-ok: xyz components
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  const instanceCount = T.world.laneCount * T.world.segmentsPerLane;
  const seg = new Float32Array(instanceCount * 2);
  for (let n = 0; n < instanceCount; n++) {
    seg[n * 2] = Math.floor(n / T.world.segmentsPerLane);
    seg[n * 2 + 1] = n % T.world.segmentsPerLane;
  }
  geometry.setAttribute('aSeg', new THREE.InstancedBufferAttribute(seg, 2));
  geometry.instanceCount = instanceCount;

  // P-LF-4b mask texture: a transparent 1x1 placeholder is bound from
  // the first frame, so the shader always has a texture and the lane
  // field stays one draw call. A logo mask replaces it once loaded;
  // the placeholder gradient is zero, so it never moves a lane. The
  // mask is a bound texture on the existing lane material, never a
  // second mesh or draw call.
  const placeholderData = new Uint8Array([0, 0, 0, 0]);
  const placeholderTex = new THREE.DataTexture(
    placeholderData,
    1,
    1,
    THREE.RGBAFormat,
  );
  placeholderTex.magFilter = THREE.NearestFilter;
  placeholderTex.minFilter = THREE.NearestFilter;
  placeholderTex.generateMipmaps = false;
  placeholderTex.needsUpdate = true;
  let maskTexture: THREE.Texture = placeholderTex;
  let maskLoadedKind: SilhouetteMaskKind = 'none';
  let framesRendered = 0;

  const fire = T.world.server.fire;
  const variance = T.lanefield.variance;
  const initialParams = paramsForLayout(opts.initial);
  const uniforms: Record<string, THREE.IUniform> = {
    uLayouts: { value: layoutTex },
    uActivity: { value: activityTex },
    uW: { value: new THREE.Vector4(0, 0, 0, 0) },
    uViewport: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uClassStyle: { value: classStyle() },
    uFog: { value: new THREE.Vector2(T.world.server.fog[0], T.world.server.fog[1]) },
    uHot: { value: hexToVec3(T.color.signalHot) },
    uRouteColor: { value: hexToVec3(T.color.ink) },
    uTrailCore: { value: hexToVec3(T.color.chalk) },
    uTrailRim: { value: hexToVec3(T.color.signal) },
    uFirePeriod: { value: new THREE.Vector2(fire.periodSec[0], fire.periodSec[1]) },
    uFireDuty: { value: fire.dutyCycle },
    uFireSpeed: { value: fire.speedLengthsPerSec },
    uFireSigma: { value: fire.sigma },
    uSweepPeriod: { value: fire.sweepPeriodSec },
    uFirePeak: { value: fire.peakAlpha },
    // Fade duration source: the only fade duration in tokens (leaflink
    // pin fade). S06/S07 may refine this when their controllers land.
    uFadeSec: { value: T.world.leaflink.pins.fadeMs * MS_TO_SEC },
    uFrozen: { value: opts.reducedMotion ? 1 : 0 },
    // W4 lane params: gradient stops are OKLab triples from the build.
    uGradLead: { value: new THREE.Vector3(...initialParams.leadOklab) },
    uGradTail: { value: new THREE.Vector3(...initialParams.tailOklab) },
    uSignalOklab: { value: new THREE.Vector3(...initialParams.signalOklab) },
    uGradTailLength: { value: initialParams.tailLength },
    uLightMode: { value: lightModeIndex(initialParams.lightMode) },
    uLightRadius: { value: initialParams.lightRadius },
    uLightGain: { value: initialParams.lightGain },
    // W4 variant B attributes, fixed per lane in the shader.
    uLengthVariance: { value: variance.lengthVariance },
    uDepthBands: { value: variance.depthBands },
    uBandSpeed: { value: new THREE.Vector3(...variance.bandSpeed) },
    uBandAlpha: { value: new THREE.Vector3(...variance.bandAlpha) },
    // W4 deflection ring, zero strength at rest.
    uRingCenter: { value: new THREE.Vector2(0, 0) },
    uRingRadius: { value: 0 },
    uRingStrength: { value: 0 },
    // Polish round: tangential share of the ring push (seeded swirl),
    // and the light mode crossfade (no midpoint snap during travel).
    uRingSwirl: { value: 0 },
    uLightModeFrom: { value: lightModeIndex(initialParams.lightMode) },
    uLightMix: { value: 1 },
    // P-LF-4b silhouette pull, zero strength at rest.
    uSilhouetteMask: { value: placeholderTex },
    uSilhouetteCenter: { value: new THREE.Vector2(0, 0) },
    uSilhouetteRadius: { value: 0 },
    uSilhouetteStrength: { value: 0 },
    // Guestbook (DESIGN, guestbook section): letter lane offsets and the 3D part.
    uGbOffsets: { value: gbTex },
    uGbBend: { value: T.guestbook.mark.bendPower },
    uGbCenter: { value: new THREE.Vector2(0, 0) },
    uGbRadius: { value: 0 },
    uGbPush: { value: 0 },
    uGbDepth: { value: 0 },
    uGbSeed: { value: 0 },
    uGbPart: { value: new THREE.Vector3(0, 0, 0) },
    uGbColor: { value: hexToVec3(T.color.signalHot) },
    // Server word lanes (DESIGN 6.15): sRGB color and opacity per pool slot. // lit-ok: spec section reference
    uWordTint: { value: wordTint },
    // Guestbook contrast (DESIGN guestbook section, phone polish): lanes behind the panel dim.
    // Box in drawing-buffer px (x0, y0, x1, y1, origin bottom left).
    uGbDimBox: { value: new THREE.Vector4(0, 0, 0, 0) },
    uGbDim: { value: 0 },
    uGbDimFeather: { value: 1 },
  };
  const gbHot = hexToVec3(T.color.signalHot);
  const gbInk = hexToVec3(T.color.ink);
  // Mark color (DESIGN 6.14, 1.8.0): the signature's pool color, mixed in by gbMarkMix. // lit-ok: spec section reference
  const gbMark = new THREE.Vector3(0, 0, 0);
  let gbMarkMix = 0;
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: laneVert,
    fragmentShader: laneFrag,
    defines: { WORD_SLOTS: T.world.server.nodes.pool },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    premultipliedAlpha: true,
    glslVersion: THREE.GLSL3,
  });
  const laneMesh = new THREE.Mesh(geometry, material);
  laneMesh.frustumCulled = false;
  scene.add(laneMesh);

  // State (all preallocated; nothing allocates on the frame path).
  let disposed = false;
  let failed = false;
  let reduced = opts.reducedMotion;
  let current: LayoutId = opts.initial;
  let variant: 'coarse' | 'fine' = window.innerWidth < T.breakpoints.coarseOrNarrowBelowPx ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < T.breakpoints.desktopFromPx)
    ? 'coarse'
    : 'fine';
  let finePointer = window.matchMedia('(pointer: fine)').matches;
  const weights: number[] = [0, 0, 0, 0];
  oneHot(current, weights);
  const groundWeights: number[] = [...weights];
  const basePose: Pose = poseFor(current, variant);
  const travelFromPose: Pose = poseFor(current, variant);
  const travelToPose: Pose = poseFor(current, variant);
  const travelFromW: number[] = [0, 0, 0, 0];
  const travelToW: number[] = [0, 0, 0, 0];
  // startMs is the exact millisecond value handed to the controller,
  // stored so the travel completion check uses the same inputs as
  // the controller sample. One stored value, not two computations.
  let travel: { start: number; dur: number; startMs: number } | null = null;
  let pendingResolves: (() => void)[] = [];
  // W4 interpolated lane params: current value, plus the travel
  // snapshot/target pair. At rest, current equals the scene tokens.
  let paramsCurrent: LaneParams = cloneParams(initialParams);
  let paramsFrom: LaneParams = cloneParams(initialParams);
  let paramsTo: LaneParams = cloneParams(initialParams);
  // P-MORPH-1 morph controller: owns the route morph state machine
  // (snapshot, target, start time) and the ring and silhouette
  // envelope. updateTravel samples it per frame; the debug hook
  // below is a stable object whose fields update in place, so
  // tests can read the current sample without a new interface method.
  setEntropyEnabled(!opts.reducedMotion);
  const morph = createMorphController(opts.initial, {
    anchorFor: (layout) => resolveAnchor(layout),
    groundAt: (px) => groundAt(px[0], px[1]),
  });
  const morphDebug: {
    from: LayoutId;
    to: LayoutId;
    sample: ReturnType<typeof morph.sample> | null;
    degraded: boolean;
    degrade: () => void;
    degradeState: () => ReturnType<typeof morph.degradeState>;
    stage: () => unknown;
  } = {
    from: opts.initial,
    to: opts.initial,
    sample: null,
    degraded: false,
    degrade: () => morph.forceDegrade(),
    degradeState: () => morph.degradeState(),
    // Polish round test hook: focus target, pan, glitter, pulse state.
    stage: () => ({
      focus,
      pan: [...pan],
      groundUnderFocus: focus ? groundAt(focus.screenPx[0], focus.screenPx[1]) : null,
      glitter: { ...glitter, centerPx: [...glitter.centerPx] },
      pulse: pulseState ? { ...pulseState } : null,
    }),
  };
  (window as unknown as { __morph?: typeof morphDebug }).__morph = morphDebug;
  // Polish round state (DESIGN polish tokens). Hero anchors are CSS px with
  // the viewport they were measured in; a stale viewport resolves null.
  const anchors = new Map<LayoutId, { a: HeroAnchorPx; w: number; h: number }>();
  let ringSwirl = 0;
  let lightModeFrom = lightModeIndex(initialParams.lightMode);
  let lightMix = 1;
  let pulseState: {
    startSec: number;
    originPx: [number, number] | null;
    swirl: number;
    scale: number;
  } | null = null;
  let focus: CameraFocus | null = null;
  const pan: [number, number] = [0, 0];
  const bow = { amount: 0, dir: [0, 0] as [number, number], now: 0 };
  const camOffset: [number, number] = [0, 0];
  const glitter = { target: 0, value: 0, centerPx: [0, 0] as [number, number], swirl: 0, releaseAt: -1, releaseFrom: 0 };
  const drawWeights: number[] = [0, 0, 0, 0];
  const scatterIndex = LAYOUT_ORDER.indexOf('scatter');
  const trackEase = cubicBezier(...T.curve.track);
  const pointer = { x: 0, y: 0 };
  // Guestbook camera layer (DESIGN, guestbook section): dolly toward the target as a
  // fraction of the target distance, yaw about the target, rise.
  let gbCam: GuestbookCamera | null = null;
  const gbPose: Pose = poseFor(current, variant);
  const gbVec = new THREE.Vector3();
  const gbVec2 = new THREE.Vector3();
  const clearColor = new THREE.Color();
  const governor = new Governor();
  // Projection size is the canvas's own CSS box (100vw by 100dvh), not
  // innerWidth/innerHeight, which differ from it on phones (DESIGN guestbook section).
  function canvasCss(): [number, number] {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    return [w, h];
  }
  let [cssW, cssH] = canvasCss();
  let currentDpr = 1;
  let raf = 0;
  let loopRunning = false;
  let lastT = 0;
  const callbacks = new Set<(tSec: number, dtSec: number) => void>();

  function dprBase(): number {
    const cap = variant === 'coarse' ? T.world.dprCap.coarse : T.world.dprCap.fine;
    return Math.min(window.devicePixelRatio, cap);
  }

  function applyDpr(): void {
    governor.setBase(dprBase(), T.world.dprCap.floor);
    currentDpr = governor.effectiveDpr();
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(cssW, cssH, false);
    (uniforms.uViewport.value as THREE.Vector2).set(cssW * currentDpr, cssH * currentDpr);
    (uniforms.uDpr.value as number) = currentDpr;
  }

  function updateClearColor(): void {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < LAYOUT_ORDER.length; i++) {
      r += groundWeights[i] * GROUNDS[i][0];
      g += groundWeights[i] * GROUNDS[i][1];
      b += groundWeights[i] * GROUNDS[i][2];
    }
    clearColor.setRGB(r, g, b, THREE.SRGBColorSpace);
    renderer.setClearColor(clearColor, 1);
  }

  function updateTravel(t: number): void {
    if (!travel) return;
    const p = Math.min(1, (t - travel.start) / travel.dur);
    const e = easeSignature(p);
    const ge = easePlain(p);
    for (let i = 0; i < LAYOUT_ORDER.length; i++) {
      weights[i] = travelFromW[i] + (travelToW[i] - travelFromW[i]) * e;
      groundWeights[i] = travelFromW[i] + (travelToW[i] - travelFromW[i]) * ge;
    }
    lerpPoseInto(travelFromPose, travelToPose, e, basePose);
    // W4 params interpolate with the signature curve, same as weights.
    // The ring and silhouette fields are not lerped: applyRing owns
    // them after the final camera write (polish round).
    paramsCurrent = lerpParams(paramsFrom, paramsTo, e);
    // Light mode crossfades instead of switching at the midpoint.
    lightModeFrom = lightModeIndex(paramsFrom.lightMode);
    lightMix = e;
    // Camera bow: a lateral arc on the camera's own curve, zero at
    // both ends (seeded, keyed by the destination layout).
    bow.now = bow.amount * Math.sin(Math.PI * e);
    if (morphTravelDone(travel.startMs, t * SEC_TO_MS, T.motion.ms.travel)) {
      finishTravel();
    }
  }

  // Unconditional travel completion: clears travel, publishes the
  // destination rest state, and drains pending promises, without
  // going through any floating point completion predicate. Called
  // from updateTravel when the shared predicate reports done, and
  // from setReducedMotion when a morph must complete before the
  // freeze regardless of timestamp rounding.
  function finishTravel(): void {
    if (!travel) return;
    travel = null;
    bow.now = 0;
    lightMix = 1;
    oneHot(current, weights);
    for (let i = 0; i < LAYOUT_ORDER.length; i++) groundWeights[i] = weights[i];
    paramsCurrent = cloneParams(paramsTo);
    // Rest invariant: no ring or pull survives a morph. A strength
    // carried into the target params (the pre-polish registration
    // path) would otherwise persist as a permanent bulge.
    paramsCurrent.ringStrength = 0;
    paramsCurrent.silhouetteStrength = 0;
    const pose = poseFor(current, variant);
    basePose.pos[0] = pose.pos[0];
    basePose.pos[1] = pose.pos[1];
    basePose.pos[2] = pose.pos[2];
    basePose.target[0] = pose.target[0];
    basePose.target[1] = pose.target[1];
    basePose.target[2] = pose.target[2];
    basePose.fov = pose.fov;
    basePose.shift[0] = pose.shift[0];
    basePose.shift[1] = pose.shift[1];
    const resolves = pendingResolves;
    pendingResolves = [];
    for (const resolve of resolves) resolve();
  }

  function hideNonLaneChildren(): void {
    for (const child of scene.children) {
      child.visible = child === laneMesh;
    }
  }

  // P-LF-4b mask load, polish round: both masks load once, right after
  // the first rendered frame (brand bytes never precede it), into a
  // cache keyed by kind. The uniform picks the cached texture for the
  // current mask kind every frame, so a first visit never swaps the
  // mask in mid-morph. Each mask is the brand PNG letterboxed into a
  // small square canvas (aspect preserved, contour band texel wide).
  // Any failure leaves the placeholder bound, so lanes render unchanged.
  const maskCache = new Map<SilhouetteMaskKind, THREE.Texture>();
  let masksRequested = false;
  async function loadMaskTexture(file: string): Promise<THREE.Texture | null> {
    const img = new Image();
    img.src = `/brand/${file}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = SILHOUETTE_MASK_SIZE;
    canvas.height = SILHOUETTE_MASK_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = Math.min(
      SILHOUETTE_MASK_SIZE / img.naturalWidth,
      SILHOUETTE_MASK_SIZE / img.naturalHeight,
    );
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.clearRect(0, 0, SILHOUETTE_MASK_SIZE, SILHOUETTE_MASK_SIZE);
    ctx.drawImage(img, (SILHOUETTE_MASK_SIZE - w) / 2, (SILHOUETTE_MASK_SIZE - h) / 2, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.flipY = false;
    tex.colorSpace = THREE.NoColorSpace;
    tex.needsUpdate = true;
    // Upload now, so first use costs no frame. The upload does not
    // bind the texture; binding happens only in syncMask, which is
    // guarded during a morph.
    renderer.initTexture(tex);
    return tex;
  }
  async function preloadMasks(): Promise<void> {
    const manifest = await loadBrandManifest();
    if (!manifest || disposed) return;
    const files: Array<[SilhouetteMaskKind, string | undefined]> = [
      ['sidequests', manifest.heroes?.sidequests?.frame0?.file],
      ['leaflink', manifest.heroes?.leaflink?.png?.file],
    ];
    for (const [kind, file] of files) {
      if (!file) continue;
      try {
        const tex = await loadMaskTexture(file);
        if (!tex) continue;
        if (disposed) {
          tex.dispose();
          return;
        }
        maskCache.set(kind, tex);
      } catch {
        // Mask failure is not a field failure; the placeholder stays.
      }
    }
  }
  function syncMask(): void {
    // DESIGN 6.7, no categorical snaps: a preload finishing mid-morph // lit-ok: section reference
    // must not replace the bound mask until the morph ends. The mask
    // kind flips at the morph midpoint, so an unguarded adoption would
    // snap the contour during Gather. At rest, adoption runs before
    // the uniform copy, so the adopted texture renders on the same
    // first at-rest frame.
    if (travel) return;
    const kind = paramsCurrent.silhouetteMask;
    const tex = kind === 'none' ? undefined : maskCache.get(kind);
    maskTexture = tex ?? placeholderTex;
    maskLoadedKind = tex ? kind : 'none';
  }

  // --- Polish round: screen anchors, focus pan, pulse, glitter. ---
  function groundAt(x: number, y: number): [number, number] | null {
    return rig.screenToGround(x, y, cssW, cssH);
  }

  // Ground-project a hero anchor through the current camera. Called
  // only after the final camera write of the frame (applyRing) or at
  // navigate time, so the ring lands under the logo on screen.
  function resolveAnchor(layout: LayoutId): MorphAnchor | null {
    const rec = anchors.get(layout);
    if (!rec || rec.w !== cssW || rec.h !== cssH) return null;
    const c = groundAt(rec.a.x, rec.a.y);
    const r = groundAt(rec.a.x + rec.a.ringRadiusPx, rec.a.y);
    const sr = groundAt(rec.a.x + rec.a.silhouetteRadiusPx, rec.a.y);
    if (!c || !r || !sr) return null;
    return {
      center: c,
      ringRadius: Math.hypot(r[0] - c[0], r[1] - c[1]),
      silhouetteRadius: Math.hypot(sr[0] - c[0], sr[1] - c[1]),
    };
  }

  function updatePan(dtMs: number): void {
    let tx = 0;
    let tz = 0;
    if (focus && !reduced) {
      const g = groundAt(focus.screenPx[0], focus.screenPx[1]);
      if (g) {
        // The ground under a fixed screen point moves by exactly the
        // camera translation, so the target pan is one subtraction.
        tx = pan[0] + focus.ground[0] - g[0];
        tz = pan[1] + focus.ground[1] - g[1];
        const len = Math.hypot(tx, tz);
        const cap = T.focus.maxPanWorld;
        if (len > cap) {
          tx *= cap / len;
          tz *= cap / len;
        }
      } else {
        tx = pan[0];
        tz = pan[1];
      }
    }
    pan[0] = reduced ? tx : damp(pan[0], tx, T.focus.halfLifeMs, dtMs);
    pan[1] = reduced ? tz : damp(pan[1], tz, T.focus.halfLifeMs, dtMs);
  }

  function setRingFields(
    center: [number, number],
    radius: number,
    strength: number,
    silCenter: [number, number],
    silRadius: number,
    silStrength: number,
    swirl: number,
  ): void {
    paramsCurrent.ringCenter = center;
    paramsCurrent.ringRadius = radius;
    paramsCurrent.ringStrength = strength;
    paramsCurrent.silhouetteCenter = silCenter;
    paramsCurrent.silhouetteRadius = silRadius;
    paramsCurrent.silhouetteStrength = silStrength;
    ringSwirl = swirl;
  }

  // Single owner of the ring and silhouette fields, after the final
  // camera write: the morph envelope while traveling, otherwise the
  // glitter hold or a pulse at the current layout's anchor, otherwise
  // zero strength (the rest invariant).
  function applyRing(t: number, dtMs: number): void {
    const s = morph.sample(t * SEC_TO_MS);
    morphDebug.from = s.from;
    morphDebug.to = s.to;
    morphDebug.sample = s;
    morphDebug.degraded = s.degraded;
    if (!s.done) {
      setRingFields(
        [...s.ringCenter], s.ringRadius, s.ringStrength,
        [...s.silhouetteCenter], s.silhouetteRadius, s.silhouetteStrength,
        s.ringSwirl,
      );
      return;
    }
    // Glitter hold: the ring follows the finger, swirled.
    // Rise damps toward the cap; release is a finite signature ramp
    // over one travel duration, so the scene is exactly re-formed (and
    // the rest invariant holds again) at a known time, with no
    // exponential tail and no epsilon snap.
    if (glitter.target > 0) {
      glitter.releaseAt = -1;
      glitter.value = damp(glitter.value, T.glitter.maxWeight, T.motion.ms.fast, dtMs);
    } else if (glitter.value > 0) {
      if (glitter.releaseAt < 0) {
        glitter.releaseAt = t;
        glitter.releaseFrom = glitter.value;
      }
      const q = ((t - glitter.releaseAt) * SEC_TO_MS) / T.motion.ms.travel;
      glitter.value = q >= 1 ? 0 : glitter.releaseFrom * (1 - easeSignature(q));
    }
    if (glitter.value > 0) {
      const c = groundAt(glitter.centerPx[0], glitter.centerPx[1]);
      const r = groundAt(glitter.centerPx[0] + T.glitter.ringRadiusPx, glitter.centerPx[1]);
      if (c && r) {
        const radius = Math.hypot(r[0] - c[0], r[1] - c[1]);
        const k = glitter.value / T.glitter.maxWeight;
        setRingFields(c, radius, radius * 0.5 * k, c, radius, 0, glitter.swirl);
        return;
      }
    }
    const a = resolveAnchor(current);
    if (pulseState && a) {
      const age = t - pulseState.startSec;
      const out = T.motion.ms.fast * MS_TO_SEC;
      const settle = T.motion.ms.travel * MS_TO_SEC;
      if (age >= out + settle) {
        pulseState = null;
      } else if (age >= 0) {
        const env = age < out ? easeSignature(age / out) : 1 - easePlain((age - out) / settle);
        const q = trackEase(Math.min(1, age / (out + settle * 0.5)));
        const o = pulseState.originPx ? groundAt(pulseState.originPx[0], pulseState.originPx[1]) : null;
        const from = o ?? a.center;
        const center: [number, number] = [
          from[0] + (a.center[0] - from[0]) * q,
          from[1] + (a.center[1] - from[1]) * q,
        ];
        const k = env * pulseState.scale;
        setRingFields(
          center, a.ringRadius, a.ringRadius * 0.5 * k,
          [...a.center], a.silhouetteRadius, T.morph.silhouettePull * 0.5 * k,
          pulseState.swirl,
        );
        return;
      }
    }
    setRingFields(a ? [...a.center] : [0, 0], a ? a.ringRadius : 0, 0, a ? [...a.center] : [0, 0], a ? a.silhouetteRadius : 0, 0, 0);
  }

  function doFrame(t: number, dt: number, sampleGovernor: boolean): void {
    updateTravel(t);
    // Adoption before the uniform copy, so a texture adopted on the
    // travel-completion frame renders on that same first at-rest
    // frame, not the following one. Previously syncMask ran after
    // render, delaying the adopted texture by one frame.
    syncMask();
    // P-MORPH-1 degrade observation: only frames inside a morph
    // count, and the controller itself gates on its own sample, so
    // a completed morph stops counting without extra state here.
    if (travel) morph.observeFrame(dt * SEC_TO_MS, performance.now());
    updatePan(dt * SEC_TO_MS);
    camOffset[0] = pan[0] + bow.dir[0] * bow.now;
    camOffset[1] = pan[1] + bow.dir[1] * bow.now;
    let camBase = basePose;
    if (gbCam) {
      // Yaw both points about the vertical through the well, then
      // translate along the ray to the well (the well keeps its screen
      // position), then rise. Orientation changes by the yaw only.
      const c = gbCam.center;
      gbVec.set(basePose.pos[0] - c[0], basePose.pos[1] - c[1], basePose.pos[2] - c[2]);
      const dist = gbVec.length();
      gbVec.applyAxisAngle(GB_UP, gbCam.yawRad);
      gbVec2.set(basePose.target[0] - c[0], basePose.target[1] - c[1], basePose.target[2] - c[2]);
      gbVec2.applyAxisAngle(GB_UP, gbCam.yawRad);
      const lift = gbCam.rise * dist;
      gbPose.pos[0] = c[0] + gbVec.x * (1 - gbCam.dolly);
      gbPose.pos[1] = c[1] + gbVec.y * (1 - gbCam.dolly) + lift;
      gbPose.pos[2] = c[2] + gbVec.z * (1 - gbCam.dolly);
      gbPose.target[0] = c[0] + gbVec2.x - gbVec.x * gbCam.dolly;
      gbPose.target[1] = c[1] + gbVec2.y - gbVec.y * gbCam.dolly + lift;
      gbPose.target[2] = c[2] + gbVec2.z - gbVec.z * gbCam.dolly;
      gbPose.fov = basePose.fov;
      gbPose.shift[0] = basePose.shift[0] + (gbCam.shift[0] - basePose.shift[0]) * gbCam.shiftMix;
      gbPose.shift[1] = basePose.shift[1] + (gbCam.shift[1] - basePose.shift[1]) * gbCam.shiftMix;
      camBase = gbPose;
    }
    rig.update(camBase, t, weights, pointer, dt * SEC_TO_MS, reduced, finePointer, camOffset);
    for (const cb of callbacks) cb(t, dt);
    // ITEM 6 clamp, the single and last camera write guard: after rig // lit-ok:
    // interpolation, walk lean (a callback above), and parallax have
    // combined, and before render. Active whenever the SideQuests
    // layout has any weight, which covers morph transit and the walk.
    // Other layouts keep their own poses untouched.
    if (weights[layoutIndex('sidequests')] > 0) clampSideQuestsPitch(camera);
    // Ring, silhouette, pulse, and glitter after the final camera write.
    applyRing(t, dt * SEC_TO_MS);
    // GLITTERBOX: the drawn weights blend toward the scatter layout;
    // the travel weights (and every test reading them) are untouched.
    for (let i = 0; i < LAYOUT_ORDER.length; i++) {
      drawWeights[i] = weights[i] * (1 - glitter.value) + (i === scatterIndex ? glitter.value : 0);
    }
    (uniforms.uTime.value as number) = t;
    (uniforms.uW.value as THREE.Vector4).set(drawWeights[0], drawWeights[1], drawWeights[2], drawWeights[3]);
    (uniforms.uFrozen.value as number) = reduced ? 1 : 0;
    // W4 param uniforms, from the interpolated current params.
    (uniforms.uGradLead.value as THREE.Vector3).set(...paramsCurrent.leadOklab);
    (uniforms.uGradTail.value as THREE.Vector3).set(...paramsCurrent.tailOklab);
    (uniforms.uSignalOklab.value as THREE.Vector3).set(...paramsCurrent.signalOklab);
    (uniforms.uGradTailLength.value as number) = paramsCurrent.tailLength;
    (uniforms.uLightMode.value as number) = lightModeIndex(travel ? paramsTo.lightMode : paramsCurrent.lightMode);
    (uniforms.uLightModeFrom.value as number) = travel ? lightModeFrom : lightModeIndex(paramsCurrent.lightMode);
    (uniforms.uLightMix.value as number) = travel ? lightMix : 1;
    (uniforms.uRingSwirl.value as number) = ringSwirl;
    (uniforms.uLightRadius.value as number) = paramsCurrent.lightRadius;
    (uniforms.uLightGain.value as number) = paramsCurrent.lightGain;
    (uniforms.uRingCenter.value as THREE.Vector2).set(...paramsCurrent.ringCenter);
    (uniforms.uRingRadius.value as number) = paramsCurrent.ringRadius;
    (uniforms.uRingStrength.value as number) = paramsCurrent.ringStrength;
    (uniforms.uSilhouetteMask.value as THREE.Texture) = maskTexture;
    (uniforms.uSilhouetteCenter.value as THREE.Vector2).set(...paramsCurrent.silhouetteCenter);
    (uniforms.uSilhouetteRadius.value as number) = paramsCurrent.silhouetteRadius;
    (uniforms.uSilhouetteStrength.value as number) = paramsCurrent.silhouetteStrength;
    const paperW = groundWeights[layoutIndex('leaflink')];
    (uniforms.uGbColor.value as THREE.Vector3).copy(gbHot).lerp(gbInk, paperW).lerp(gbMark, gbMarkMix);
    updateClearColor();
    if (sampleGovernor) {
      governor.sample(dt * SEC_TO_MS, performance.now());
      if (governor.effectiveDpr() !== currentDpr) applyDpr();
    }
    if (lanesOnly) hideNonLaneChildren();
    renderer.render(scene, camera);
    framesRendered += 1;
    // Mask preload starts right after the first rendered frame, here
    // rather than in syncMask, because syncMask now runs before
    // render. Gating it on the frame count inside syncMask delayed
    // it to a later frame, and on a static page with no further
    // frame it might never start. Every page renders at least once
    // at setup, so this trigger always fires on the first frame,
    // bounding the preload delay to that frame.
    if (!masksRequested && framesRendered >= 1) {
      masksRequested = true;
      void preloadMasks();
    }
    debugHandle.updateHud();
  }

  function renderOnce(): void {
    doFrame(now(), 0, false);
  }

  function loop(): void {
    if (!loopRunning) return;
    raf = requestAnimationFrame(loop);
    const t = now();
    const dt = t - lastT;
    lastT = t;
    doFrame(t, dt, true);
  }

  function startLoop(): void {
    if (loopRunning || reduced || failed || disposed) return;
    loopRunning = true;
    lastT = now();
    raf = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    loopRunning = false;
    cancelAnimationFrame(raf);
  }

  // Debug view and perf HUD.
  let layoutHash = '';
  const debugHandle = createDebugView({
    laneCount: T.world.laneCount,
    getLayoutHash: () => layoutHash,
    getWeights: () => weights,
    getCameraPose: () => rig.currentPose(),
    getCameraMatrix: () => {
      camera.updateMatrixWorld();
      return [...camera.matrixWorld.elements];
    },
    getInfo: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      programs: renderer.info.programs?.length ?? 0,
    }),
    getFrameStats: () => governor.stats(),
    getDpr: () => currentDpr,
    getSilhouette: () => {
      const image = maskTexture.image as { width?: number; height?: number } | null;
      return {
        kind: paramsCurrent.silhouetteMask,
        loaded: maskLoadedKind,
        width: image?.width ?? 0,
        height: image?.height ?? 0,
      };
    },
    getMemoryEstimate: () => {
      const layoutBytes = texSpec.width * texSpec.height * TEXEL_FLOATS * TEXEL_FLOATS; // lit-ok: RGBA32F bytes
      const activityBytes = 2 * actSpec.width * actSpec.height * TEXEL_FLOATS * TEXEL_FLOATS; // lit-ok: activity plus guestbook RGBA32F bytes
      const instanceBytes = instanceCount * 2 * TEXEL_FLOATS + 12 * TEXEL_FLOATS + 6 * 2; // lit-ok: aSeg plus quad position plus index
      const drawBytes = cssW * cssH * currentDpr * currentDpr * TEXEL_FLOATS * 2; // lit-ok: double-buffered RGBA
      return (layoutBytes + activityBytes + instanceBytes + drawBytes) / (1024 * 1024); // lit-ok: bytes to MB
    },
    getRecentFrames: () => governor.recentFrames(),
    isRingFull: () => governor.ringFull(),
  });

  function onResize(): void {
    [cssW, cssH] = canvasCss();
    camera.aspect = cssW / cssH;
    const nextVariant: 'coarse' | 'fine' = window.innerWidth < T.breakpoints.coarseOrNarrowBelowPx ||
      (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < T.breakpoints.desktopFromPx)
      ? 'coarse'
      : 'fine';
    finePointer = window.matchMedia('(pointer: fine)').matches;
    if (nextVariant !== variant) {
      variant = nextVariant;
      if (travel) {
        const pose = poseFor(current, variant);
        travelToPose.pos[0] = pose.pos[0];
        travelToPose.pos[1] = pose.pos[1];
        travelToPose.pos[2] = pose.pos[2];
        travelToPose.target[0] = pose.target[0];
        travelToPose.target[1] = pose.target[1];
        travelToPose.target[2] = pose.target[2];
        travelToPose.fov = pose.fov;
        travelToPose.shift[0] = pose.shift[0];
        travelToPose.shift[1] = pose.shift[1];
      } else {
        const pose = poseFor(current, variant);
        basePose.pos[0] = pose.pos[0];
        basePose.pos[1] = pose.pos[1];
        basePose.pos[2] = pose.pos[2];
        basePose.target[0] = pose.target[0];
        basePose.target[1] = pose.target[1];
        basePose.target[2] = pose.target[2];
        basePose.fov = pose.fov;
        basePose.shift[0] = pose.shift[0];
        basePose.shift[1] = pose.shift[1];
      }
    }
    applyDpr();
    if (reduced) renderOnce();
  }

  function onPointerMove(e: PointerEvent): void {
    if (!finePointer) return;
    pointer.x = (e.clientX / cssW) * 2 - 1;
    pointer.y = -(e.clientY / cssH) * 2 + 1;
  }

  function onVisibility(): void {
    if (document.hidden) {
      stopLoop();
    } else {
      // Restore from the last valid state, never from a reset default:
      // basePose is untouched while hidden. Only a camera still at the
      // origin (no resting pose ever applied) falls back to the
      // resting pose.
      if (camera.position.lengthSq() === 0) {
        const pose = poseFor(current, variant);
        basePose.pos[0] = pose.pos[0];
        basePose.pos[1] = pose.pos[1];
        basePose.pos[2] = pose.pos[2];
        basePose.target[0] = pose.target[0];
        basePose.target[1] = pose.target[1];
        basePose.target[2] = pose.target[2];
        basePose.fov = pose.fov;
        basePose.shift[0] = pose.shift[0];
        basePose.shift[1] = pose.shift[1];
      }
      lastT = now();
      startLoop();
      if (reduced) renderOnce();
    }
  }

  function onPageShow(e: PageTransitionEvent): void {
    if (!e.persisted) return;
    // Back-forward cache restore: restart from the resting pose of the
    // current scene, never from a reset default, and drop in-flight
    // travel (its promises resolve, since the morph is abandoned).
    const pose = poseFor(current, variant);
    basePose.pos[0] = pose.pos[0];
    basePose.pos[1] = pose.pos[1];
    basePose.pos[2] = pose.pos[2];
    basePose.target[0] = pose.target[0];
    basePose.target[1] = pose.target[1];
    basePose.target[2] = pose.target[2];
    basePose.fov = pose.fov;
    basePose.shift[0] = pose.shift[0];
    basePose.shift[1] = pose.shift[1];
    travel = null;
    paramsCurrent = paramsForLayout(current);
    paramsFrom = cloneParams(paramsCurrent);
    paramsTo = cloneParams(paramsCurrent);
    morph.navigateReduced(current, now() * SEC_TO_MS);
    const resolves = pendingResolves;
    pendingResolves = [];
    for (const resolve of resolves) resolve();
    rig.applyPose(basePose);
    lastT = now();
    startLoop();
    if (reduced) renderOnce();
  }

  function onContextLost(e: Event): void {
    e.preventDefault();
    stopLoop();
  }

  async function onContextRestored(): Promise<void> {
    layoutTex.needsUpdate = true;
    activityTex.needsUpdate = true;
    await renderer.compileAsync(scene, camera);
    renderOnce();
    startLoop();
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', () => void onContextRestored());

  // Initial sizing and clear color (exact regime ground hex at rest).
  // Aspect must be set here, not only on resize: no resize event fires on
  // first load, and the camera was constructed with aspect 1.
  camera.aspect = cssW / cssH;
  renderer.setClearColor(GROUND_HEX[layoutIndex(opts.initial)], 1);
  applyDpr();
  rig.applyPose(basePose);

  // Worker: generate layouts off the main thread.
  let resolveReady!: () => void;
  let rejectReady!: (err: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  } catch (err) {
    failed = true;
    console.error('[lanefield] layout failed', err);
    rejectReady(err instanceof Error ? err : new Error(String(err)));
  }
  if (worker) {
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { layouts?: Float32Array; side?: unknown; error?: string };
      if (data.error || !data.layouts) {
        failed = true;
        console.error('[lanefield] layout failed', data.error ?? 'no layouts');
        rejectReady(new Error(data.error ?? 'no layouts'));
        return;
      }
      const received = data.layouts;
      const expected = texSpec.width * texSpec.height * TEXEL_FLOATS;
      if (received.length !== expected) {
        failed = true;
        console.error('[lanefield] layout failed', `length ${received.length} expected ${expected}`);
        rejectReady(new Error('layout length mismatch'));
        return;
      }
      (layoutTex.image as { data: Float32Array }).data = received;
      layoutTex.needsUpdate = true;
      void (async () => {
        const digest = await crypto.subtle.digest('SHA-256', received as BufferSource);
        const bytes = new Uint8Array(digest);
        let hex = '';
        for (const b of bytes) hex += b.toString(16).padStart(2, '0'); // lit-ok: hex radix
        layoutHash = hex;
        debugHandle.setLayoutHash(hex);
        await renderer.compileAsync(scene, camera);
        renderOnce();
        debugHandle.setReady(true);
        resolveReady();
        startLoop();
      })();
    };
    worker.onerror = (e: ErrorEvent) => {
      failed = true;
      console.error('[lanefield] layout failed', e.message);
      rejectReady(new Error(e.message));
    };
    worker.postMessage({ seed: opts.seed });
  }

  const field: Lanefield = {
    ready,
    travelTo(
      id: LayoutId,
      travelOpts?: { instant?: boolean; originPx?: [number, number] | null },
    ): Promise<void> {
      if (disposed || failed) return Promise.resolve();
      if (!travel && current === id) return Promise.resolve();
      // A route change ends any pulse or glitter hold and drops focus.
      // The blend value is zeroed too: applyRing returns early during
      // a morph, so a retained value would keep the field blended
      // toward scatter for the whole travel and push the release past
      // its 700ms spec (DESIGN 6.13). // lit-ok: spec value reference
      pulseState = null;
      glitter.target = 0;
      glitter.value = 0;
      glitter.releaseAt = -1;
      focus = null;
      if (travelOpts?.instant || reduced) {
        bow.amount = 0;
        bow.now = 0;
        lightMix = 1;
        current = id;
        oneHot(id, weights);
        for (let i = 0; i < LAYOUT_ORDER.length; i++) groundWeights[i] = weights[i];
        travel = null;
        morph.navigateReduced(id, now() * SEC_TO_MS);
        // An instant travel never enters updateTravel, so publish
        // the jumped sample here; otherwise the debug hook would
        // still show the previous morph after a reduced travel.
        morphDebug.from = morph.from;
        morphDebug.to = morph.to;
        morphDebug.sample = morph.sample(now() * SEC_TO_MS);
        morphDebug.degraded = morphDebug.sample.degraded;
        paramsCurrent = paramsForLayout(id);
        paramsFrom = cloneParams(paramsCurrent);
        paramsTo = cloneParams(paramsCurrent);
        const pose = poseFor(id, variant);
        basePose.pos[0] = pose.pos[0];
        basePose.pos[1] = pose.pos[1];
        basePose.pos[2] = pose.pos[2];
        basePose.target[0] = pose.target[0];
        basePose.target[1] = pose.target[1];
        basePose.target[2] = pose.target[2];
        basePose.fov = pose.fov;
        basePose.shift[0] = pose.shift[0];
        basePose.shift[1] = pose.shift[1];
        pendingResolves = [];
        if (reduced) renderOnce();
        return Promise.resolve();
      }
      for (let i = 0; i < LAYOUT_ORDER.length; i++) {
        travelFromW[i] = weights[i];
        travelToW[i] = i === layoutIndex(id) ? 1 : 0;
      }
      // P-MORPH-1 retarget snapshot: mid-flight, the snapshot is the
      // current interpolated ring and silhouette state, so the new
      // morph starts exactly where the old one is. At rest, the ring
      // fields are zero and the center is the origin, so a project
      // rest state snapshots its descriptor anchor instead; a field
      // rest state keeps the zero center, which collapses in place.
      // At rest the ring fields already sit on the current layout's
      // resolved hero anchor (applyRing), so one snapshot form covers
      // mid-flight and rest; a project with no placed hero falls back
      // to its descriptor anchor so a collapse still has a center.
      const restDesc = descriptorForLayout(current);
      const restAnchor = !travel && restDesc.kind === 'mark' ? resolveAnchor(current) : null;
      const morphSnapshot: MorphSnapshot = {
        center: restAnchor
          ? [...restAnchor.center]
          : !travel && restDesc.kind === 'mark'
            ? [...restDesc.anchor]
            : [...paramsCurrent.ringCenter],
        silhouetteCenter: restAnchor
          ? [...restAnchor.center]
          : !travel && restDesc.kind === 'mark'
            ? [...restDesc.silhouetteCenter]
            : [...paramsCurrent.silhouetteCenter],
        ringRadius: restAnchor ? restAnchor.ringRadius : paramsCurrent.ringRadius,
        ringStrength: paramsCurrent.ringStrength,
        silhouetteRadius: restAnchor ? restAnchor.silhouetteRadius : paramsCurrent.silhouetteRadius,
        silhouetteStrength: paramsCurrent.silhouetteStrength,
      };
      // Seeded per-morph variety, keyed by the destination layout
      // (neutral under reduced motion, which never reaches here).
      const ent = morphEntropy(id);
      // Single shared clock and shared completion predicate: one now
      // call feeds both the morph controller and travel, and both
      // completion checks call the same predicate with the same
      // millisecond inputs, so their done states cannot disagree.
      // Separate calls, or separate predicates, let a frame land
      // with the controller done but travel still non-null, blocking
      // adoption on the first controller-rest frame.
      const t0 = now();
      const startMs = t0 * SEC_TO_MS;
      morph.navigate(id, startMs, morphSnapshot, {
        originPx: travelOpts?.originPx ?? null,
        entropy: ent,
      });
      paramsFrom = cloneParams(paramsCurrent);
      paramsTo = paramsForLayout(id);
      travelFromPose.pos[0] = basePose.pos[0];
      travelFromPose.pos[1] = basePose.pos[1];
      travelFromPose.pos[2] = basePose.pos[2];
      travelFromPose.target[0] = basePose.target[0];
      travelFromPose.target[1] = basePose.target[1];
      travelFromPose.target[2] = basePose.target[2];
      travelFromPose.fov = basePose.fov;
      travelFromPose.shift[0] = basePose.shift[0];
      travelFromPose.shift[1] = basePose.shift[1];
      const pose = poseFor(id, variant);
      travelToPose.pos[0] = pose.pos[0];
      travelToPose.pos[1] = pose.pos[1];
      travelToPose.pos[2] = pose.pos[2];
      travelToPose.target[0] = pose.target[0];
      travelToPose.target[1] = pose.target[1];
      travelToPose.target[2] = pose.target[2];
      travelToPose.fov = pose.fov;
      travelToPose.shift[0] = pose.shift[0];
      travelToPose.shift[1] = pose.shift[1];
      // Bow direction: perpendicular to the target travel on the
      // ground, or the destination camera's right axis when the two
      // targets nearly coincide (LeafLink and SideQuests do).
      {
        const dx = travelToPose.target[0] - travelFromPose.target[0];
        const dz = travelToPose.target[2] - travelFromPose.target[2];
        const len = Math.hypot(dx, dz);
        if (len > 0.5) {
          bow.dir[0] = -dz / len;
          bow.dir[1] = dx / len;
        } else {
          const fx = travelToPose.target[0] - travelToPose.pos[0];
          const fz = travelToPose.target[2] - travelToPose.pos[2];
          const fl = Math.hypot(fx, fz) || 1;
          bow.dir[0] = -fz / fl;
          bow.dir[1] = fx / fl;
        }
        bow.amount = ent.bow;
      }
      current = id;
      travel = { start: t0, dur: T.motion.ms.travel * MS_TO_SEC, startMs };
      return new Promise<void>((resolve) => {
        pendingResolves.push(resolve);
      });
    },
    setReducedMotion(on: boolean): void {
      if (reduced === on) return;
      reduced = on;
      setEntropyEnabled(!on);
      if (on) {
        pulseState = null;
        glitter.target = 0;
        glitter.value = 0;
      }
      (uniforms.uFrozen.value as number) = on ? 1 : 0;
      if (on) {
        // An in-flight morph must complete before the freeze, or the
        // frozen scene keeps a non-null travel and a mid-morph mask.
        // finishTravel clears travel, publishes the destination rest
        // state, and resolves the travel promise unconditionally,
        // without going through any floating point completion
        // predicate, so no timestamp rounding can leave travel set.
        // Jumping the controller matches it, so travel null and
        // controller done coincide in the frozen frame.
        if (travel) {
          finishTravel();
          morph.navigateReduced(current, now() * SEC_TO_MS);
          morphDebug.from = morph.from;
          morphDebug.to = morph.to;
          morphDebug.sample = morph.sample(now() * SEC_TO_MS);
          morphDebug.degraded = morphDebug.sample.degraded;
        }
        stopLoop();
        renderOnce();
      } else {
        startLoop();
      }
    },
    setActivity(
      lanes: Int32Array,
      startSec: Float32Array,
      fadeAtSec: Float32Array,
      kind: 1 | 2,
      uPerSec: Float32Array,
    ): void {
      for (let j = 0; j < lanes.length; j++) {
        const base = lanes[j] * TEXEL_FLOATS;
        activityData[base] = startSec[j];
        activityData[base + 1] = fadeAtSec[j];
        activityData[base + 2] = kind;
        activityData[base + 3] = uPerSec[j];
      }
      activityTex.needsUpdate = true;
      if (reduced) renderOnce();
    },
    clearActivity(kind?: 1 | 2): void {
      if (kind === undefined) {
        activityData.fill(0);
      } else {
        for (let lane = 0; lane < T.world.laneCount; lane++) {
          const base = lane * TEXEL_FLOATS;
          if (activityData[base + 2] === kind) {
            activityData[base] = 0;
            activityData[base + 1] = 0;
            activityData[base + 2] = 0;
            activityData[base + 3] = 0;
          }
        }
      }
      activityTex.needsUpdate = true;
      if (reduced) renderOnce();
    },
    getParams(): LaneParams {
      return cloneParams(paramsCurrent);
    },
    // Ring and silhouette center, radius, and strength are owned by the
    // morph envelope, pulses, and glitter (applyRing): setParams keeps
    // accepting them for compatibility, but applyRing rewrites them on
    // the next frame, and they never enter the travel target, so an
    // override can no longer outlive a morph as a frozen bulge.
    setParams(p: Partial<LaneParams>): void {
      const apply = (target: LaneParams, includeRing: boolean): void => {
        if (p.leadOklab) target.leadOklab = [...p.leadOklab];
        if (p.tailOklab) target.tailOklab = [...p.tailOklab];
        if (p.signalOklab) target.signalOklab = [...p.signalOklab];
        if (p.tailLength !== undefined) target.tailLength = p.tailLength;
        if (p.lightMode !== undefined) target.lightMode = p.lightMode;
        if (p.lightRadius !== undefined) target.lightRadius = p.lightRadius;
        if (p.lightGain !== undefined) target.lightGain = p.lightGain;
        if (p.silhouetteMask !== undefined) target.silhouetteMask = p.silhouetteMask;
        if (!includeRing) return;
        if (p.ringCenter) target.ringCenter = [...p.ringCenter];
        if (p.ringRadius !== undefined) target.ringRadius = p.ringRadius;
        if (p.ringStrength !== undefined) target.ringStrength = p.ringStrength;
        if (p.silhouetteCenter) target.silhouetteCenter = [...p.silhouetteCenter];
        if (p.silhouetteRadius !== undefined) target.silhouetteRadius = p.silhouetteRadius;
        if (p.silhouetteStrength !== undefined) target.silhouetteStrength = p.silhouetteStrength;
      };
      apply(paramsCurrent, true);
      if (travel) apply(paramsTo, false);
    },
    laneAttributes(lane: number) {
      return laneAttributesFor(lane, weights[layoutIndex('server')]);
    },
    now,
    screenToGround(xCss: number, yCss: number): [number, number] | null {
      return rig.screenToGround(xCss, yCss, cssW, cssH);
    },
    worldToScreen(p: [number, number, number]): [number, number] {
      return rig.worldToScreen(p, cssW, cssH);
    },
    viewportCss(): [number, number] {
      return [cssW, cssH];
    },
    onFrame(cb: (tSec: number, dtSec: number) => void): () => void {
      callbacks.add(cb);
      return () => {
        callbacks.delete(cb);
      };
    },
    setHeroAnchor(layout: LayoutId, anchor: HeroAnchorPx | null): void {
      if (anchor) anchors.set(layout, { a: { ...anchor }, w: cssW, h: cssH });
      else anchors.delete(layout);
    },
    heroAnchor(layout: LayoutId): HeroAnchorPx | null {
      const rec = anchors.get(layout);
      return rec && rec.w === cssW && rec.h === cssH ? { ...rec.a } : null;
    },
    morphSample(): MorphSample | null {
      return morphDebug.sample;
    },
    pulse(p?: { originPx?: [number, number] | null; strengthScale?: number }): void {
      if (reduced || disposed || travel) return;
      pulseState = {
        startSec: now(),
        originPx: p?.originPx ?? null,
        swirl: signed('pulse-swirl') * T.entropy.pulseSwirl,
        scale: p?.strengthScale ?? 1,
      };
    },
    setFocus(next: CameraFocus | null): void {
      focus = next ? { ground: [...next.ground], screenPx: [...next.screenPx] } : null;
    },
    focusOffset(): [number, number] {
      return [pan[0], pan[1]];
    },
    focusActive(): boolean {
      return focus !== null;
    },
    projectAtRest(layout: LayoutId, p: [number, number, number]): [number, number] {
      return rig.projectAtPose(poseFor(layout, variant), p, cssW, cssH);
    },
    setGlitter(on: boolean, centerPx?: [number, number]): void {
      const allowed = on && !reduced && !travel && !disposed;
      if (allowed && glitter.target === 0) {
        glitter.swirl = signed('glitter-swirl') * T.glitter.swirl;
      }
      glitter.target = allowed ? 1 : 0;
      if (centerPx) {
        glitter.centerPx[0] = centerPx[0];
        glitter.centerPx[1] = centerPx[1];
      }
    },
    guestbook: {
      setCamera(c: GuestbookCamera | null): void {
        gbCam = c ? { ...c, center: [...c.center], shift: [...c.shift] } : null;
      },
      setColor(rgb: readonly [number, number, number] | null, amount: number): void {
        if (!rgb || amount <= 0) {
          gbMarkMix = 0;
          return;
        }
        gbMark.set(rgb[0], rgb[1], rgb[2]);
        gbMarkMix = Math.min(1, amount);
      },
      setPart(p: GuestbookPart | null): void {
        if (!p) {
          (uniforms.uGbRadius.value as number) = 0;
          (uniforms.uGbPart.value as THREE.Vector3).set(0, 0, 0);
          return;
        }
        (uniforms.uGbCenter.value as THREE.Vector2).set(p.center[0], p.center[1]);
        (uniforms.uGbRadius.value as number) = p.radius;
        (uniforms.uGbPush.value as number) = p.push;
        (uniforms.uGbDepth.value as number) = p.depth;
        (uniforms.uGbSeed.value as number) = p.seedUnit * SEC_TO_MS;
        (uniforms.uGbPart.value as THREE.Vector3).set(p.bands[0], p.bands[1], p.bands[2]);
      },
      writeLanes(lanes: readonly number[], offsets: Float32Array): void {
        const keep = new Set(lanes);
        for (const lane of gbWritten) {
          if (keep.has(lane)) continue;
          gbData.fill(0, lane * TEXEL_FLOATS, lane * TEXEL_FLOATS + TEXEL_FLOATS);
        }
        gbWritten.clear();
        for (let j = 0; j < lanes.length; j++) {
          wordWritten.delete(lanes[j]);
          const base = lanes[j] * TEXEL_FLOATS;
          gbData[base] = offsets[j * 3];
          gbData[base + 1] = offsets[j * 3 + 1];
          gbData[base + 2] = offsets[j * 3 + 2]; // lit-ok: z component
          gbData[base + 3] = 1; // lit-ok: alpha channel index
          gbWritten.add(lanes[j]);
        }
        gbTex.needsUpdate = true;
      },
      laneTip(lane: number, out: [number, number, number]): [number, number, number] {
        const tipK = T.world.segmentsPerLane;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let tx = 0;
        let ty = 0;
        let tz = 0;
        for (let l = 0; l < LAYOUT_ORDER.length; l++) {
          const w = weights[l];
          if (w <= 0) continue;
          const s0 = (lane * LANE_STRIDE + l * POINTS_PER_LAYOUT) * TEXEL_FLOATS;
          const s1 = s0 + tipK * TEXEL_FLOATS;
          sx += w * layoutData[s0];
          sy += w * layoutData[s0 + 1];
          sz += w * layoutData[s0 + 2];
          tx += w * layoutData[s1];
          ty += w * layoutData[s1 + 1];
          tz += w * layoutData[s1 + 2];
        }
        const len = 1 + (hash11(lane * 0.013 + 7) - 0.5) * 2 * variance.lengthVariance; // lit-ok: shader lenScale constants
        out[0] = sx + (tx - sx) * len;
        out[1] = sy + (ty - sy) * len;
        out[2] = sz + (tz - sz) * len;
        return out;
      },
      nearestLane(x: number, z: number, exclude: ReadonlySet<number>): number {
        const tip: [number, number, number] = [0, 0, 0];
        let best = -1;
        let bestD = Infinity;
        for (let lane = 0; lane < T.world.laneCount; lane++) {
          if (exclude.has(lane)) continue;
          field.guestbook.laneTip(lane, tip);
          const d = (tip[0] - x) * (tip[0] - x) + (tip[2] - z) * (tip[2] - z);
          if (d < bestD) {
            bestD = d;
            best = lane;
          }
        }
        return best;
      },
      restFrame(): GuestbookFrame {
        const p = basePose;
        const dx = p.pos[0] - p.target[0];
        const dy = p.pos[1] - p.target[1];
        const dz = p.pos[2] - p.target[2];
        const flat = Math.hypot(dx, dz) || 1;
        return {
          pos: [p.pos[0], p.pos[1], p.pos[2]],
          target: [p.target[0], p.target[1], p.target[2]],
          distance: Math.hypot(dx, dy, dz),
          // Ground directions as seen from the camera.
          forward: [-dx / flat, -dz / flat],
          right: [dz / flat, -dx / flat],
        };
      },
      setDim(box: [number, number, number, number] | null, amount: number): void {
        if (!box || amount <= 0) {
          (uniforms.uGbDim.value as number) = 0;
          return;
        }
        const pad = T.guestbook.dim.padPx;
        const d = currentDpr;
        (uniforms.uGbDimBox.value as THREE.Vector4).set(
          (box[0] - pad) * d,
          (cssH - box[3] - pad) * d,
          (box[2] + pad) * d,
          (cssH - box[1] + pad) * d,
        );
        (uniforms.uGbDimFeather.value as number) = T.guestbook.dim.featherPx * d;
        (uniforms.uGbDim.value as number) = Math.min(1, amount) * T.guestbook.dim.amount;
      },
      render(): void {
        if (!loopRunning && !disposed && !failed) renderOnce();
      },
      reduced(): boolean {
        return reduced;
      },
    },
    words: {
      writeLanes(lanes: readonly number[], offsets: Float32Array, slots: readonly number[]): void {
        const keep = new Set(lanes);
        for (const lane of wordWritten) {
          if (keep.has(lane) || gbWritten.has(lane)) continue;
          gbData.fill(0, lane * TEXEL_FLOATS, lane * TEXEL_FLOATS + TEXEL_FLOATS);
        }
        wordWritten.clear();
        for (let j = 0; j < lanes.length; j++) {
          if (gbWritten.has(lanes[j])) continue;
          const base = lanes[j] * TEXEL_FLOATS;
          gbData[base] = offsets[j * 3];
          gbData[base + 1] = offsets[j * 3 + 1];
          gbData[base + 2] = offsets[j * 3 + 2]; // lit-ok: z component
          gbData[base + 3] = WORD_ALPHA_BASE + slots[j]; // lit-ok: alpha channel index
          wordWritten.add(lanes[j]);
        }
        gbTex.needsUpdate = true;
      },
      setTint(slot: number, rgb: readonly [number, number, number], opacity: number): void {
        const v = wordTint[slot];
        if (!v) return;
        v.set(rgb[0], rgb[1], rgb[2], opacity);
      },
      held(lane: number): boolean {
        return gbWritten.has(lane);
      },
      texel(lane: number): [number, number, number, number] {
        const b = lane * TEXEL_FLOATS;
        return [gbData[b], gbData[b + 1], gbData[b + 2], gbData[b + 3]]; // lit-ok: texel channels
      },
    },
    scene,
    camera,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      stopLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (worker) worker.terminate();
      geometry.dispose();
      material.dispose();
      layoutTex.dispose();
      activityTex.dispose();
      gbTex.dispose();
      for (const tex of maskCache.values()) tex.dispose();
      maskCache.clear();
      placeholderTex.dispose();
      renderer.dispose();
      canvas.remove();
      if (window.__lanefield === debugHandle.debug) delete window.__lanefield;
    },
  };
  return field;
}
