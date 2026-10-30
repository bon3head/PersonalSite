/// <reference types="vite/client" />
// Lanefield engine (S02): one WebGL2 canvas drawing every lane in
// one draw call, morphing between four layouts by uniform weights.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import type { Lanefield, LayoutId } from './types';
import { easeSignature, easePlain } from './tween';
import { CameraRig, poseFor, lerpPoseInto, type Pose } from './camera';
import { Governor } from './governor';
import { createDebugView } from './debug';
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

function classColor(): THREE.Vector3[] {
  const c = T.color;
  const hexes: string[] = [
    c.signal, // server lane
    c.signal, // server converge
    c.ink, // leaflink local
    c.ink, // leaflink arterial
    c.chalk, // sidequests grid
    c.chalk, // sidequests outline
    c.chalk, // sidequests hatch
    c.chalk, // sidequests walkway
    c.chalk, // sidequests trail
    c.signalDim, // scatter lane
    c.ink, // leaflink route
    c.chalk, // sidequests lit trail
    c.signal, // unused, value never sampled (alpha zero)
    c.signal, // unused
    c.signal, // unused
    c.signal, // unused
  ];
  return hexes.map(hexToVec3);
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

  const fire = T.world.server.fire;
  const uniforms: Record<string, THREE.IUniform> = {
    uLayouts: { value: layoutTex },
    uActivity: { value: activityTex },
    uW: { value: new THREE.Vector4(0, 0, 0, 0) },
    uViewport: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uClassStyle: { value: classStyle() },
    uClassColor: { value: classColor() },
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
    if (p >= 1) {
      travel = null;
      oneHot(current, weights);
      for (let i = 0; i < LAYOUT_ORDER.length; i++) groundWeights[i] = weights[i];
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

  function doFrame(t: number, dt: number, sampleGovernor: boolean): void {
    updateTravel(t);
    rig.update(basePose, t, weights, pointer, dt * SEC_TO_MS, reduced, finePointer);
    for (const cb of callbacks) cb(t, dt);
    (uniforms.uTime.value as number) = t;
    (uniforms.uW.value as THREE.Vector4).set(weights[0], weights[1], weights[2], weights[3]);
    (uniforms.uFrozen.value as number) = reduced ? 1 : 0;
    updateClearColor();
    if (sampleGovernor) {
      governor.sample(dt * SEC_TO_MS, performance.now());
      if (governor.effectiveDpr() !== currentDpr) applyDpr();
    }
    if (lanesOnly) hideNonLaneChildren();
    renderer.render(scene, camera);
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
    getInfo: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      programs: renderer.info.programs?.length ?? 0,
    }),
    getFrameStats: () => governor.stats(),
    getDpr: () => currentDpr,
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
      lastT = now();
      startLoop();
      if (reduced) renderOnce();
    }
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
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (worker) worker.terminate();
      geometry.dispose();
      material.dispose();
      layoutTex.dispose();
      activityTex.dispose();
      renderer.dispose();
      canvas.remove();
      if (window.__lanefield === debugHandle.debug) delete window.__lanefield;
    },
  };
  return field;
}
