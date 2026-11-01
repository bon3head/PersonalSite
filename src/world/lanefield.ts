/// <reference types="vite/client" />
// Lanefield engine (S02): one WebGL2 canvas drawing every lane in
// one draw call, morphing between four layouts by uniform weights.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { LaneParams, Lanefield, LayoutId } from './types';
import { easeSignature, easePlain } from './tween';
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
  type MorphSnapshot,
} from '../motion/morph-controller';
import { descriptorForLayout } from '../motion/hero-descriptors';
import type { SilhouetteMaskKind } from './types';
import laneVert from './shaders/lane.vert.glsl?raw';
import laneFrag from './shaders/lane.frag.glsl?raw';

const LAYOUT_ORDER: readonly LayoutId[] = T.world.layouts;
const TEXEL_FLOATS = 4; // lit-ok: RGBA channels
const MS_TO_SEC = 0.001; // lit-ok: milliseconds to seconds
const SEC_TO_MS = 1000; // lit-ok: seconds to milliseconds

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
  let maskRequestedKind: SilhouetteMaskKind = 'none';
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
    // P-LF-4b silhouette pull, zero strength at rest.
    uSilhouetteMask: { value: placeholderTex },
    uSilhouetteCenter: { value: new THREE.Vector2(0, 0) },
    uSilhouetteRadius: { value: 0 },
    uSilhouetteStrength: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: laneVert,
    fragmentShader: laneFrag,
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
  let travel: { start: number; dur: number } | null = null;
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
  const morph = createMorphController(opts.initial);
  const morphDebug: {
    from: LayoutId;
    to: LayoutId;
    sample: ReturnType<typeof morph.sample> | null;
    degraded: boolean;
    degrade: () => void;
    degradeState: () => ReturnType<typeof morph.degradeState>;
  } = {
    from: opts.initial,
    to: opts.initial,
    sample: null,
    degraded: false,
    degrade: () => morph.forceDegrade(),
    degradeState: () => morph.degradeState(),
  };
  (window as unknown as { __morph?: typeof morphDebug }).__morph = morphDebug;
  const pointer = { x: 0, y: 0 };
  const clearColor = new THREE.Color();
  const governor = new Governor();
  let cssW = window.innerWidth;
  let cssH = window.innerHeight;
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
    paramsCurrent = lerpParams(paramsFrom, paramsTo, e);
    // P-MORPH-1: the ring and silhouette fields come from the morph
    // controller sample, whose centers are the hero descriptor
    // anchors and whose envelope is the Release, Gather, Reveal
    // state machine. The gradient and light fields above still come
    // from the param lerp; only the ring and silhouette envelope
    // moved into the controller, so endpoint params are unchanged.
    // Peak ring strength is half the radius, as in W4.
    const morphSample = morph.sample(t * SEC_TO_MS);
    paramsCurrent.ringCenter = [...morphSample.ringCenter];
    paramsCurrent.ringRadius = morphSample.ringRadius;
    paramsCurrent.ringStrength = morphSample.ringStrength;
    paramsCurrent.silhouetteCenter = [...morphSample.silhouetteCenter];
    paramsCurrent.silhouetteRadius = morphSample.silhouetteRadius;
    paramsCurrent.silhouetteStrength = morphSample.silhouetteStrength;
    morphDebug.from = morphSample.from;
    morphDebug.to = morphSample.to;
    morphDebug.sample = morphSample;
    morphDebug.degraded = morphSample.degraded;
    if (p >= 1) {
      travel = null;
      oneHot(current, weights);
      for (let i = 0; i < LAYOUT_ORDER.length; i++) groundWeights[i] = weights[i];
      paramsCurrent = cloneParams(paramsTo);
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
  }

  function hideNonLaneChildren(): void {
    for (const child of scene.children) {
      child.visible = child === laneMesh;
    }
  }

  // P-LF-4b mask load: resolve the params mask kind through the
  // brand manifest (SideQuests frame 0 PNG, LeafLink logo PNG), draw
  // it letterboxed into a small square canvas so aspect is preserved
  // and the contour band is texel-wide, and upload it as the lane
  // material texture. A load that finishes after the route moved on
  // is discarded, never applied to the wrong route. Any failure leaves
  // the placeholder bound, so lanes render unchanged.
  async function loadMask(kind: SilhouetteMaskKind): Promise<void> {
    if (kind === 'none') return;
    try {
      const res = await fetch('/brand/manifest.json');
      if (!res.ok) {
        if (maskRequestedKind === kind) maskRequestedKind = 'none';
        return;
      }
      const manifest = (await res.json()) as {
        heroes?: {
          sidequests?: { frame0?: { file?: string } };
          leaflink?: { png?: { file?: string } };
        };
      };
      const file =
        kind === 'sidequests'
          ? manifest.heroes?.sidequests?.frame0?.file
          : manifest.heroes?.leaflink?.png?.file;
      if (!file) {
        if (maskRequestedKind === kind) maskRequestedKind = 'none';
        return;
      }
      const img = new Image();
      img.src = `/brand/${file}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = SILHOUETTE_MASK_SIZE;
      canvas.height = SILHOUETTE_MASK_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (maskRequestedKind === kind) maskRequestedKind = 'none';
        return;
      }
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
      if (disposed) {
        tex.dispose();
        return;
      }
      if (paramsCurrent.silhouetteMask !== kind) {
        tex.dispose();
        return;
      }
      const old = maskTexture;
      maskTexture = tex;
      maskLoadedKind = kind;
      if (old !== placeholderTex) old.dispose();
    } catch {
      // Mask failure is not a field failure; the placeholder stays,
      // and a later route change may retry the load.
      if (maskRequestedKind === kind) maskRequestedKind = 'none';
    }
  }

  function syncMask(): void {
    const kind = paramsCurrent.silhouetteMask;
    if (kind === 'none' || kind === maskLoadedKind || kind === maskRequestedKind) return;
    // Brand bytes never precede the first field frame: the load starts
    // only after a frame has rendered.
    if (framesRendered < 1) return;
    maskRequestedKind = kind;
    void loadMask(kind);
  }

  function doFrame(t: number, dt: number, sampleGovernor: boolean): void {
    updateTravel(t);
    // P-MORPH-1 degrade observation: only frames inside a morph
    // count, and the controller itself gates on its own sample, so
    // a completed morph stops counting without extra state here.
    if (travel) morph.observeFrame(dt * SEC_TO_MS, performance.now());
    rig.update(basePose, t, weights, pointer, dt * SEC_TO_MS, reduced, finePointer);
    for (const cb of callbacks) cb(t, dt);
    // ITEM 6 clamp, the single and last camera write guard: after rig // lit-ok:
    // interpolation, walk lean (a callback above), and parallax have
    // combined, and before render. Active whenever the SideQuests
    // layout has any weight, which covers morph transit and the walk.
    // Other layouts keep their own poses untouched.
    if (weights[layoutIndex('sidequests')] > 0) clampSideQuestsPitch(camera);
    (uniforms.uTime.value as number) = t;
    (uniforms.uW.value as THREE.Vector4).set(weights[0], weights[1], weights[2], weights[3]);
    (uniforms.uFrozen.value as number) = reduced ? 1 : 0;
    // W4 param uniforms, from the interpolated current params.
    (uniforms.uGradLead.value as THREE.Vector3).set(...paramsCurrent.leadOklab);
    (uniforms.uGradTail.value as THREE.Vector3).set(...paramsCurrent.tailOklab);
    (uniforms.uSignalOklab.value as THREE.Vector3).set(...paramsCurrent.signalOklab);
    (uniforms.uGradTailLength.value as number) = paramsCurrent.tailLength;
    (uniforms.uLightMode.value as number) = lightModeIndex(paramsCurrent.lightMode);
    (uniforms.uLightRadius.value as number) = paramsCurrent.lightRadius;
    (uniforms.uLightGain.value as number) = paramsCurrent.lightGain;
    (uniforms.uRingCenter.value as THREE.Vector2).set(...paramsCurrent.ringCenter);
    (uniforms.uRingRadius.value as number) = paramsCurrent.ringRadius;
    (uniforms.uRingStrength.value as number) = paramsCurrent.ringStrength;
    (uniforms.uSilhouetteMask.value as THREE.Texture) = maskTexture;
    (uniforms.uSilhouetteCenter.value as THREE.Vector2).set(...paramsCurrent.silhouetteCenter);
    (uniforms.uSilhouetteRadius.value as number) = paramsCurrent.silhouetteRadius;
    (uniforms.uSilhouetteStrength.value as number) = paramsCurrent.silhouetteStrength;
    updateClearColor();
    if (sampleGovernor) {
      governor.sample(dt * SEC_TO_MS, performance.now());
      if (governor.effectiveDpr() !== currentDpr) applyDpr();
    }
    if (lanesOnly) hideNonLaneChildren();
    renderer.render(scene, camera);
    framesRendered += 1;
    syncMask();
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
      const activityBytes = actSpec.width * actSpec.height * TEXEL_FLOATS * TEXEL_FLOATS; // lit-ok: RGBA32F bytes
      const instanceBytes = instanceCount * 2 * TEXEL_FLOATS + 12 * TEXEL_FLOATS + 6 * 2; // lit-ok: aSeg plus quad position plus index
      const drawBytes = cssW * cssH * currentDpr * currentDpr * TEXEL_FLOATS * 2; // lit-ok: double-buffered RGBA
      return (layoutBytes + activityBytes + instanceBytes + drawBytes) / (1024 * 1024); // lit-ok: bytes to MB
    },
    getRecentFrames: () => governor.recentFrames(),
    isRingFull: () => governor.ringFull(),
  });

  function onResize(): void {
    cssW = window.innerWidth;
    cssH = window.innerHeight;
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
    travelTo(id: LayoutId, travelOpts?: { instant?: boolean }): Promise<void> {
      if (disposed || failed) return Promise.resolve();
      if (!travel && current === id) return Promise.resolve();
      if (travelOpts?.instant || reduced) {
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
      const morphSnapshot: MorphSnapshot = travel
        ? {
            center: [...paramsCurrent.ringCenter],
            silhouetteCenter: [...paramsCurrent.silhouetteCenter],
            ringRadius: paramsCurrent.ringRadius,
            ringStrength: paramsCurrent.ringStrength,
            silhouetteRadius: paramsCurrent.silhouetteRadius,
            silhouetteStrength: paramsCurrent.silhouetteStrength,
          }
        : (() => {
            const restDesc = descriptorForLayout(current);
            const atProject = restDesc.kind === 'mark';
            return {
              center: atProject ? [...restDesc.anchor] : [...paramsCurrent.ringCenter],
              silhouetteCenter: atProject
                ? [...restDesc.silhouetteCenter]
                : [...paramsCurrent.silhouetteCenter],
              ringRadius: paramsCurrent.ringRadius,
              ringStrength: paramsCurrent.ringStrength,
              silhouetteRadius: paramsCurrent.silhouetteRadius,
              silhouetteStrength: paramsCurrent.silhouetteStrength,
            };
          })();
      morph.navigate(id, now() * SEC_TO_MS, morphSnapshot);
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
      current = id;
      travel = { start: now(), dur: T.motion.ms.travel * MS_TO_SEC };
      return new Promise<void>((resolve) => {
        pendingResolves.push(resolve);
      });
    },
    setReducedMotion(on: boolean): void {
      if (reduced === on) return;
      reduced = on;
      (uniforms.uFrozen.value as number) = on ? 1 : 0;
      if (on) {
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
    setParams(p: Partial<LaneParams>): void {
      const apply = (target: LaneParams): void => {
        if (p.leadOklab) target.leadOklab = [...p.leadOklab];
        if (p.tailOklab) target.tailOklab = [...p.tailOklab];
        if (p.signalOklab) target.signalOklab = [...p.signalOklab];
        if (p.tailLength !== undefined) target.tailLength = p.tailLength;
        if (p.lightMode !== undefined) target.lightMode = p.lightMode;
        if (p.lightRadius !== undefined) target.lightRadius = p.lightRadius;
        if (p.lightGain !== undefined) target.lightGain = p.lightGain;
        if (p.ringCenter) target.ringCenter = [...p.ringCenter];
        if (p.ringRadius !== undefined) target.ringRadius = p.ringRadius;
        if (p.ringStrength !== undefined) target.ringStrength = p.ringStrength;
        if (p.silhouetteMask !== undefined) target.silhouetteMask = p.silhouetteMask;
        if (p.silhouetteCenter) target.silhouetteCenter = [...p.silhouetteCenter];
        if (p.silhouetteRadius !== undefined) target.silhouetteRadius = p.silhouetteRadius;
        if (p.silhouetteStrength !== undefined) target.silhouetteStrength = p.silhouetteStrength;
      };
      apply(paramsCurrent);
      if (travel) apply(paramsTo);
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
    onFrame(cb: (tSec: number, dtSec: number) => void): () => void {
      callbacks.add(cb);
      return () => {
        callbacks.delete(cb);
      };
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
      if (maskTexture !== placeholderTex) maskTexture.dispose();
      placeholderTex.dispose();
      renderer.dispose();
      canvas.remove();
      if (window.__lanefield === debugHandle.debug) delete window.__lanefield;
    },
  };
  return field;
}
