// LeafLink scene controller (S06). Owns the heartbeat simulation
// (spawns, landings, matches, routes, halos, fades) and the pin, halo
// and ripple meshes. Routes are drawn by the lane shader through
// lanefield.setActivity with kind 1; this file draws no route mesh.
//
// Simulation timing uses the lanefield clock and a short interval, not
// the frame loop, so spawn and match times stay wall-clock true even
// when frames are slow. Rendering attributes refresh on every frame
// and on every interval tick.
//
// The graph comes from the layout generator (layouts/leaflink.ts),
// run once here with a scratch buffer, so the controller never needs
// worker side data plumbed through the engine.
import * as THREE from 'three';
import { T } from '../tokens.generated';
import { easeSignature, easePlain } from './tween';
import {
  rng,
  generate,
  type LeaflinkSideData,
  type LeaflinkEdgeData,
} from './layouts/leaflink';
import type { Lanefield } from './types';
import type { SceneController } from '../travel';

export type LeaflinkPinKind = 'request' | 'offer';

export interface LeaflinkSpawnEvent {
  kind: LeaflinkPinKind;
  node: number;
  /** Seconds since controller start, scheduled time (deterministic). */
  time: number;
}

type PinState = 'landing' | 'open' | 'matched' | 'halo' | 'fading';

interface Pin {
  id: number;
  node: number;
  kind: LeaflinkPinKind;
  state: PinState;
  visitor: boolean;
  bornAt: number;
  landedAt: number;
  fadingAt: number;
  haloBornAt: number;
}

interface Match {
  id: number;
  req: Pin;
  off: Pin;
  lanes: Int32Array;
  starts: Float32Array;
  fadeAts: Float32Array;
  uPerSecs: Float32Array;
  tEnd: number;
  state: 'routing' | 'halo' | 'fading';
}

interface Ripple {
  node: number;
  bornAt: number;
}

export interface LeaflinkController extends SceneController {
  dispose(): void;
  /** Visitor offer at a node (tap path, OfferButton path uses center). */
  dropOfferAtNode(node: number): void;
  /** Visitor offer at the node nearest the map center. */
  dropOfferAtCenter(): void;
  /** Tap path: ground point to nearest node, then a visitor offer. */
  dropOfferAtGround(x: number, z: number): void;
  /** Test hook: process every sim event due at the current sim time. */
  processDue(): void;
  /** Snapshots for tests. */
  snapshotPins(): Array<{
    node: number;
    kind: LeaflinkPinKind;
    state: PinState;
    visitor: boolean;
  }>;
  snapshotEvents(): LeaflinkSpawnEvent[];
  matchCount(): number;
}

export interface LeaflinkControllerOpts {
  seed?: number;
  reducedMotion?: boolean;
  /** Element receiving pointerup for taps. Omit for keyboard only. */
  target?: HTMLElement | null;
  /** Inject graph data (tests). Default: generate from the seed. */
  sideData?: LeaflinkSideData;
}

const P = T.world.leaflink.pins;
const INTERVAL_MS = T.motion.leaflinkEventIntervalMs;
const ROUTE_SPEED = T.world.leaflink.routeSpeedUnitsPerSec;
const LANE_COUNT = T.world.laneCount;
const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const MAX_INSTANCES = P.maxPins; // lit-ok: instance caps equal the pin cap

// sRGB hex to linear vec3 (lanes use linear colors; pins must match).
function hexToLinear(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255; // lit-ok: hex channel scale
  const g = parseInt(hex.slice(3, 5), 16) / 255; // lit-ok: hex channel scale
  const b = parseInt(hex.slice(5, 7), 16) / 255; // lit-ok: hex channel scale
  const conv = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); // lit-ok: sRGB curve
  return [conv(r), conv(g), conv(b)];
}

const VERT = /* glsl */ `
precision highp float;
precision highp int;
in vec3 aCenter;
in float aKind;
in float aScale;
in float aOpacity;
uniform vec2 uViewport;
uniform float uRadiusPx;
out vec2 vUv;
out float vKind;
out float vOpacity;
void main() {
  vUv = position.xy + 0.5; // lit-ok: shader constant
  vKind = aKind;
  vOpacity = aOpacity;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(aCenter, 1.0); // lit-ok: shader constant
  vec2 ndc = clip.xy / clip.w;
  vec2 off = position.xy * 4.0 * uRadiusPx * aScale / uViewport; // lit-ok: shader constant
  gl_Position = vec4((ndc + off) * clip.w, clip.z, clip.w);
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vUv;
in float vKind;
in float vOpacity;
uniform vec3 uColor;
uniform vec3 uTint;
uniform float uUseKind;
uniform float uShape;
uniform float uInner;
out vec4 outColor;
void main() {
  vec2 c = vUv - 0.5; // lit-ok: shader constant
  float d = length(c) * 2.0; // lit-ok: shader constant
  float shape = uUseKind > 0.5 ? vKind : uShape; // lit-ok: shader constant
  float a = 0.0; // lit-ok: shader constant
  vec3 col = uColor;
  if (shape < 0.5) {
    a = smoothstep(uInner - 0.05, uInner + 0.05, d) * (1.0 - smoothstep(0.95, 1.0, d)); // lit-ok: shader constant
  } else if (shape < 1.5) { // lit-ok: shader constant
    a = 1.0 - smoothstep(0.95, 1.0, d); // lit-ok: shader constant
  } else if (shape < 2.5) { // lit-ok: shader constant
    col = uTint;
    a = 1.0 - smoothstep(0.95, 1.0, d); // lit-ok: shader constant
  } else {
    a = smoothstep(uInner - 0.05, uInner + 0.05, d) * (1.0 - smoothstep(0.95, 1.0, d)); // lit-ok: shader constant
  }
  a *= vOpacity;
  if (a < 0.003) discard; // lit-ok: shader constant
  outColor = vec4(col * a, a);
}
`;

function makePinMaterial(
  useKind: number,
  shape: number,
  inner: number,
): THREE.ShaderMaterial {
  const ink = hexToLinear(T.color.ink);
  const tint = hexToLinear(T.color.inkTint);
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uViewport: { value: new THREE.Vector2(1, 1) },
      uRadiusPx: { value: P.radiusPx.fine },
      uColor: { value: new THREE.Vector3(ink[0], ink[1], ink[2]) },
      uTint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
      uUseKind: { value: useKind },
      uShape: { value: shape },
      uInner: { value: inner },
    },
  });
}

function makeInstancedMesh(
  mat: THREE.ShaderMaterial,
  max: number,
  withKind: boolean,
): {
  mesh: THREE.Mesh;
  geo: THREE.InstancedBufferGeometry;
  center: THREE.InstancedBufferAttribute;
  kind: THREE.InstancedBufferAttribute | null;
  scale: THREE.InstancedBufferAttribute;
  opacity: THREE.InstancedBufferAttribute;
} {
  const plane = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  const index = plane.getIndex();
  if (index) geo.setIndex(index);
  geo.setAttribute('position', plane.getAttribute('position'));
  geo.setAttribute('uv', plane.getAttribute('uv'));
  const center = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); // lit-ok: xyz
  geo.setAttribute('aCenter', center);
  let kind: THREE.InstancedBufferAttribute | null = null;
  if (withKind) {
    kind = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    geo.setAttribute('aKind', kind);
  } else {
    // Shader still declares aKind; feed a constant zero column.
    kind = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    geo.setAttribute('aKind', kind);
  }
  const scale = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
  geo.setAttribute('aScale', scale);
  const opacity = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
  geo.setAttribute('aOpacity', opacity);
  geo.instanceCount = 0;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, geo, center, kind, scale, opacity };
}

export function createLeaflinkController(
  lanefield: Lanefield,
  opts: LeaflinkControllerOpts = {},
): LeaflinkController {
  const seed = opts.seed ?? T.world.seed;
  const reduced = opts.reducedMotion ?? false;
  const rand = rng(seed + 7); // lit-ok: S06 controller stream

  // Graph: injected, or generated once from the layout generator.
  let side: LeaflinkSideData;
  if (opts.sideData) {
    side = opts.sideData;
  } else {
    const scratch = new Float32Array(
      LANE_COUNT * POINTS * LAYOUT_COUNT * 4, // lit-ok: RGBA texels
    );
    side = generate(seed, scratch, 1);
  }
  const nodeCount = side.nodes.length / 2; // lit-ok: xz pairs
  const nodeX = (v: number): number => side.nodes[v * 2]; // lit-ok: xz pairs
  const nodeZ = (v: number): number => side.nodes[v * 2 + 1]; // lit-ok: xz pairs

  // Edge lookup by endpoint pair (graph is simple: at most one edge).
  const edgeByPair = new Map<string, number>();
  for (let e = 0; e < side.edges.length; e++) {
    const a = side.edges[e].a;
    const b = side.edges[e].b;
    edgeByPair.set(`${Math.min(a, b)},${Math.max(a, b)}`, e);
  }

  // --- Clock (pauses freeze it; routes and pins freeze with it). ---
  const t0 = lanefield.now();
  let pausedTotal = 0;
  let pausedAt: number | null = null;
  let paused = false;
  const simNow = (): number => {
    const now = lanefield.now();
    const held = pausedAt !== null ? now - pausedAt : 0;
    return now - pausedTotal - held;
  };
  const rel = (t: number): number => t - t0;

  // --- State. ---
  const pins: Pin[] = [];
  const matches: Match[] = [];
  const ripples: Ripple[] = [];
  const events: LeaflinkSpawnEvent[] = [];
  let pinId = 0;
  let matchId = 0;
  let nextEventAt = t0 + P.firstEventAfterMs / 1000; // lit-ok: ms to sec
  let disposed = false;

  // --- Meshes (pins 1, halos 1, ripples 1 draw call). ---
  const pinMesh = makeInstancedMesh(
    makePinMaterial(1, 0, P.ringInner),
    MAX_INSTANCES,
    true,
  );
  const haloMesh = makeInstancedMesh(
    makePinMaterial(0, 2, 0),
    MAX_INSTANCES,
    false,
  );
  const rippleMesh = makeInstancedMesh(
    makePinMaterial(0, 3, P.rippleInner), // lit-ok: annulus shape
    MAX_INSTANCES,
    false,
  );
  pinMesh.mesh.renderOrder = 2; // lit-ok: after lanes and ripples
  haloMesh.mesh.renderOrder = -1; // lit-ok: before lanes
  rippleMesh.mesh.renderOrder = 1; // lit-ok: after lanes, before pins
  lanefield.scene.add(pinMesh.mesh);
  lanefield.scene.add(haloMesh.mesh);
  lanefield.scene.add(rippleMesh.mesh);

  const isCoarse = (): boolean =>
    window.innerWidth < T.breakpoints.coarseOrNarrowBelowPx ||
    (window.matchMedia('(pointer: coarse)').matches &&
      window.innerWidth < T.breakpoints.desktopFromPx);

  // --- Graph search. ---
  // Hop-limited BFS: nodes within maxHops of start, with distances.
  function bfsDistances(start: number, maxHops: number): Map<number, number> {
    const dist = new Map<number, number>();
    dist.set(start, 0);
    const queue = [start];
    while (queue.length > 0) {
      const u = queue.shift() as number;
      const du = dist.get(u) as number;
      if (du >= maxHops) continue;
      for (const e of side.adjacency[u]) {
        const edge = side.edges[e];
        const v = edge.a === u ? edge.b : edge.a;
        if (!dist.has(v)) {
          dist.set(v, du + 1);
          queue.push(v);
        }
      }
    }
    return dist;
  }

  // Dijkstra over (node, hops) states, pruned past maxHops. Stops at
  // the first popped state that holds an open opposite-kind pin: pops
  // are in distance order, so that pin is the nearest by edge length.
  function nearestOpenPin(
    from: number,
    kind: LeaflinkPinKind,
    maxHops: number,
  ): { pin: Pin; path: number[] } | null {
    const openByNode = new Map<number, Pin>();
    for (const p of pins) {
      if (p.state === 'open' && p.kind === kind) openByNode.set(p.node, p);
    }
    if (openByNode.size === 0) return null;
    const H = maxHops + 1;
    const dist = new Float64Array(nodeCount * H).fill(Infinity);
    const prev = new Int32Array(nodeCount * H).fill(-1);
    const prevH = new Int8Array(nodeCount * H).fill(-1);
    // Binary heap of [d, node, hops], smallest distance first.
    const heap: Array<[number, number, number]> = [];
    const push = (d: number, v: number, h: number): void => {
      heap.push([d, v, h]);
      let i = heap.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1; // lit-ok: heap parent
        if (heap[parent][0] <= heap[i][0]) break;
        const tmp = heap[parent];
        heap[parent] = heap[i];
        heap[i] = tmp;
        i = parent;
      }
    };
    const pop = (): [number, number, number] | null => {
      if (heap.length === 0) return null;
      const top = heap[0];
      const last = heap.pop() as [number, number, number];
      if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const left = i * 2 + 1; // lit-ok: heap child
          const right = left + 1; // lit-ok: heap child
          let smallest = i;
          if (left < heap.length && heap[left][0] < heap[smallest][0]) {
            smallest = left;
          }
          if (right < heap.length && heap[right][0] < heap[smallest][0]) {
            smallest = right;
          }
          if (smallest === i) break;
          const tmp = heap[smallest];
          heap[smallest] = heap[i];
          heap[i] = tmp;
          i = smallest;
        }
      }
      return top;
    };
    dist[from * H] = 0;
    push(0, from, 0);
    while (heap.length > 0) {
      const item = pop();
      if (!item) break;
      const [d, u, h] = item;
      if (d > dist[u * H + h]) continue;
      if (u !== from) {
        const hit = openByNode.get(u);
        if (hit) {
          const path: number[] = [];
          let v = u;
          let hh = h;
          while (v !== -1) {
            path.push(v);
            const pv = prev[v * H + hh];
            const ph = prevH[v * H + hh];
            v = pv;
            hh = ph;
          }
          path.reverse();
          return { pin: hit, path };
        }
      }
      if (h >= maxHops) continue;
      for (const e of side.adjacency[u]) {
        const edge = side.edges[e];
        const v = edge.a === u ? edge.b : edge.a;
        const nd = d + edge.length;
        const nh = h + 1;
        if (nd < dist[v * H + nh]) {
          dist[v * H + nh] = nd;
          prev[v * H + nh] = u;
          prevH[v * H + nh] = h;
          push(nd, v, nh);
        }
      }
    }
    return null;
  }

  function nearestNode(x: number, z: number): number {
    let best = 0;
    let bestD = Infinity;
    for (let v = 0; v < nodeCount; v++) {
      const dx = nodeX(v) - x;
      const dz = nodeZ(v) - z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  // --- Routes. ---
  function buildRoute(
    path: number[],
    tNow: number,
  ): {
    lanes: Int32Array;
    starts: Float32Array;
    fadeAts: Float32Array;
    uPerSecs: Float32Array;
    totalLength: number;
    tEnd: number;
  } {
    const laneIds: number[] = [];
    const starts: number[] = [];
    const uPerSecs: number[] = [];
    let arc = 0;
    let total = 0;
    const edgeLens: number[] = [];
    for (let i = 0; i + 1 < path.length; i++) {
      const u = path[i];
      const v = path[i + 1];
      const e = edgeByPair.get(
        `${Math.min(u, v)},${Math.max(u, v)}`,
      ) as number;
      edgeLens.push(side.edges[e].length);
      total += side.edges[e].length;
    }
    for (let i = 0; i + 1 < path.length; i++) {
      const u = path[i];
      const v = path[i + 1];
      const e = edgeByPair.get(
        `${Math.min(u, v)},${Math.max(u, v)}`,
      ) as number;
      const edge = side.edges[e];
      const k = edge.laneCount;
      const laneLen = edge.length / k;
      const forward = edge.a === u && edge.b === v;
      for (let s = 0; s < k; s++) {
        const lane = forward ? edge.laneStart + s : edge.laneStart + (k - 1 - s); // lit-ok: reverse lane order
        const frac = forward ? s / k : (k - 1 - s) / k; // lit-ok: reverse lane offset
        laneIds.push(lane);
        starts.push(tNow + (arc + frac * edge.length) / ROUTE_SPEED);
        uPerSecs.push(
          (forward ? ROUTE_SPEED : -ROUTE_SPEED) / laneLen, // lit-ok: signed rate
        );
      }
      arc += edge.length;
    }
    const tEnd = tNow + total / ROUTE_SPEED;
    const fadeAt = tEnd + P.holdMs / 1000; // lit-ok: ms to sec
    return {
      lanes: new Int32Array(laneIds),
      starts: new Float32Array(starts),
      fadeAts: new Float32Array(laneIds.map(() => fadeAt)),
      uPerSecs: new Float32Array(uPerSecs),
      totalLength: total,
      tEnd,
    };
  }

  function activeMatchCount(): number {
    return matches.filter((m) => m.state !== 'fading').length;
  }

  function fadeMatchNow(m: Match, tNow: number): void {
    // Oldest match gives up its lanes immediately (cap path).
    const fadeAts = new Float32Array(m.lanes.length).fill(tNow);
    lanefield.setActivity(m.lanes, m.starts, fadeAts, 1, m.uPerSecs);
    m.state = 'fading';
    m.req.state = 'fading';
    m.off.state = 'fading';
    m.req.fadingAt = tNow;
    m.off.fadingAt = tNow;
  }

  function createMatch(req: Pin, off: Pin, path: number[], tNow: number): void {
    const route = buildRoute(path, tNow);
    lanefield.setActivity(route.lanes, route.starts, route.fadeAts, 1, route.uPerSecs);
    matches.push({
      id: matchId++,
      req,
      off,
      lanes: route.lanes,
      starts: route.starts,
      fadeAts: route.fadeAts,
      uPerSecs: route.uPerSecs,
      tEnd: route.tEnd,
      state: 'routing',
    });
    req.state = 'matched';
    off.state = 'matched';
  }

  function tryMatch(pin: Pin, tNow: number, hopLimit: number): void {
    if (pin.state !== 'open') return;
    if (activeMatchCount() >= P.maxMatches) return;
    const want: LeaflinkPinKind = pin.kind === 'request' ? 'offer' : 'request';
    const found = nearestOpenPin(pin.node, want, hopLimit);
    if (!found) return;
    const other = found.pin;
    const req = pin.kind === 'request' ? pin : other;
    const off = pin.kind === 'offer' ? pin : other;
    createMatch(req, off, found.path, tNow);
  }

  function tryMatchVisitor(pin: Pin, tNow: number): void {
    if (pin.state !== 'open') return;
    if (activeMatchCount() >= P.maxMatches) {
      // Oldest match fades immediately to make room (S06 tap section).
      const oldest = matches
        .filter((m) => m.state !== 'fading')
        .sort((a, b) => a.tEnd - b.tEnd)[0];
      if (oldest) fadeMatchNow(oldest, tNow);
    }
    if (activeMatchCount() >= P.maxMatches) return;
    const found = nearestOpenPin(pin.node, 'request', nodeCount);
    if (!found) return;
    createMatch(found.pin, pin, found.path, tNow);
  }

  // --- Spawns. ---
  function pickSpawnNode(): number | null {
    for (let attempt = 0; attempt < 64; attempt++) { // lit-ok: spawn retry cap
      const node = Math.floor(rand() * nodeCount);
      const near = bfsDistances(node, 1);
      let blocked = false;
      for (const p of pins) {
        if (near.has(p.node)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return node;
    }
    return null;
  }

  function placePin(
    kind: LeaflinkPinKind,
    node: number,
    tNow: number,
    visitor: boolean,
  ): Pin {
    const pin: Pin = {
      id: pinId++,
      node,
      kind,
      state: 'landing',
      visitor,
      bornAt: tNow,
      landedAt: tNow + T.motion.ms.mediumMin / 1000, // lit-ok: ms to sec
      fadingAt: 0,
      haloBornAt: 0,
    };
    pins.push(pin);
    ripples.push({ node, bornAt: tNow });
    return pin;
  }

  function doSpawn(tScheduled: number): void {
    if (pins.length >= P.maxPins) return;
    const kind: LeaflinkPinKind =
      rand() < P.requestFraction ? 'request' : 'offer'; // lit-ok: kind draw
    const node = pickSpawnNode();
    if (node === null) return;
    placePin(kind, node, tScheduled, false);
    events.push({ kind, node, time: rel(tScheduled) });
  }

  function scheduleNext(after: number): void {
    const lo = INTERVAL_MS[0];
    const hi = INTERVAL_MS[1];
    nextEventAt = after + (lo + rand() * (hi - lo)) / 1000; // lit-ok: ms to sec
  }

  function spawnVisitorRequestNear(offerNode: number, tNow: number): void {
    const dist = bfsDistances(offerNode, P.visitorRequestHops[1]);
    const band: number[] = [];
    for (const [v, d] of dist) {
      if (d >= P.visitorRequestHops[0] && d <= P.visitorRequestHops[1]) {
        band.push(v);
      }
    }
    let node: number | null = null;
    if (band.length > 0) {
      node = band[Math.floor(rand() * band.length)];
    } else {
      const full = bfsDistances(offerNode, nodeCount);
      const far: number[] = [];
      for (const [v, d] of full) {
        if (d >= P.visitorRequestHops[0]) far.push(v);
      }
      if (far.length > 0) node = far[Math.floor(rand() * far.length)];
    }
    if (node === null) return;
    if (pins.length >= P.maxPins) return;
    placePin('request', node, tNow, false);
  }

  // --- Core sim step (interval + test hook). ---
  function processDue(): void {
    if (disposed || paused || reduced) return;
    const now = simNow();
    while (nextEventAt <= now) {
      const at = nextEventAt;
      scheduleNext(at);
      doSpawn(at);
    }
    // Landings first, so simultaneous landings can match each other.
    // Visitor attempts run before sim attempts: a spawned request must
    // match the visitor offer it was spawned for, not another open offer.
    const newly: Pin[] = [];
    for (const p of pins) {
      if (p.state === 'landing' && p.landedAt <= now) {
        p.state = 'open';
        newly.push(p);
      }
    }
    for (const p of newly) {
      if (p.visitor) tryMatchVisitor(p, now);
    }
    for (const p of newly) {
      if (!p.visitor) tryMatch(p, now, P.matchMaxHops);
    }
    // Match lifecycle.
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      if (m.state === 'routing' && m.tEnd <= now) {
        m.state = 'halo';
        m.req.state = 'halo';
        m.off.state = 'halo';
        m.req.haloBornAt = m.tEnd;
        m.off.haloBornAt = m.tEnd;
      } else if (
        m.state === 'halo' &&
        m.tEnd + P.holdMs / 1000 <= now // lit-ok: ms to sec
      ) {
        m.state = 'fading';
        m.req.state = 'fading';
        m.off.state = 'fading';
        m.req.fadingAt = now;
        m.off.fadingAt = now;
      } else if (
        m.state === 'fading' &&
        Math.max(m.req.fadingAt, m.off.fadingAt) + P.fadeMs / 1000 <= now // lit-ok: ms to sec
      ) {
        matches.splice(i, 1);
        for (const pin of [m.req, m.off]) {
          const at = pins.indexOf(pin);
          if (at !== -1) pins.splice(at, 1);
        }
      }
    }
    // Stale open pins fade out (no match, no halo).
    for (let i = pins.length - 1; i >= 0; i--) {
      const p = pins[i];
      if (p.state === 'open' && now - p.bornAt > P.staleMs / 1000) { // lit-ok: ms to sec
        p.state = 'fading';
        p.fadingAt = now;
      } else if (
        p.state === 'fading' &&
        p.fadingAt + P.fadeMs / 1000 <= now && // lit-ok: ms to sec
        !matches.some((m) => m.req === p || m.off === p)
      ) {
        pins.splice(i, 1);
      }
    }
  }

  // --- Render attributes. ---
  function updateInstances(): void {
    const now = simNow();
    // Viewport + radius follow the window (no resize listener needed).
    const coarse = isCoarse();
    const radius = coarse ? P.radiusPx.coarse : P.radiusPx.fine;
    for (const m of [pinMesh, haloMesh, rippleMesh]) {
      const mat = m.mesh.material as THREE.ShaderMaterial;
      (mat.uniforms.uViewport.value as THREE.Vector2).set(
        window.innerWidth,
        window.innerHeight,
      );
      (mat.uniforms.uRadiusPx.value as number) = radius;
    }
    // Pins.
    let n = 0;
    for (const p of pins) {
      if (n >= MAX_INSTANCES) break;
      pinMesh.center.setXYZ(n, nodeX(p.node), 0.01, nodeZ(p.node)); // lit-ok: pin plane height
      (pinMesh.kind as THREE.InstancedBufferAttribute).setX(
        n,
        p.kind === 'request' ? 0 : 1,
      );
      let scale = 1;
      let opacity = 1;
      if (p.state === 'landing') {
        const t = Math.min(
          Math.max((now - p.bornAt) / (T.motion.ms.mediumMin / 1000), 0), // lit-ok: ms to sec
          1,
        );
        const e = easeSignature(t);
        scale = P.dropScaleFrom - (P.dropScaleFrom - 1) * e;
        opacity = e;
      } else if (p.state === 'fading') {
        const t = Math.min(
          Math.max((now - p.fadingAt) / (P.fadeMs / 1000), 0), // lit-ok: ms to sec
          1,
        );
        opacity = 1 - easePlain(t);
      }
      pinMesh.scale.setX(n, scale);
      pinMesh.opacity.setX(n, opacity);
      n++;
    }
    pinMesh.geo.instanceCount = n;
    pinMesh.center.needsUpdate = true;
    (pinMesh.kind as THREE.InstancedBufferAttribute).needsUpdate = true;
    pinMesh.scale.needsUpdate = true;
    pinMesh.opacity.needsUpdate = true;
    // Halos (matched pins from tEnd through fade).
    let h = 0;
    for (const p of pins) {
      if (h >= MAX_INSTANCES) break;
      if (p.state !== 'halo' && p.state !== 'fading') continue;
      if (p.state === 'fading' && !matches.some((m) => m.req === p || m.off === p)) {
        continue; // stale fade has no halo
      }
      haloMesh.center.setXYZ(h, nodeX(p.node), 0.01, nodeZ(p.node)); // lit-ok: halo plane height
      let scale = P.haloScale;
      let opacity = 1;
      if (p.state === 'halo') {
        const t = Math.min(
          Math.max((now - p.haloBornAt) / (T.motion.ms.medium / 1000), 0), // lit-ok: ms to sec
          1,
        );
        scale = P.haloScale * easeSignature(t);
      } else {
        const t = Math.min(
          Math.max((now - p.fadingAt) / (P.fadeMs / 1000), 0), // lit-ok: ms to sec
          1,
        );
        opacity = 1 - easePlain(t);
      }
      haloMesh.scale.setX(h, scale);
      haloMesh.opacity.setX(h, opacity);
      h++;
    }
    haloMesh.geo.instanceCount = h;
    haloMesh.center.needsUpdate = true;
    haloMesh.scale.needsUpdate = true;
    haloMesh.opacity.needsUpdate = true;
    // Ripples (900ms, pruned here).
    let r = 0;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      const age = now - rip.bornAt;
      if (age > T.motion.ms.ripple / 1000) { // lit-ok: ms to sec
        ripples.splice(i, 1);
        continue;
      }
    }
    for (const rip of ripples) {
      if (r >= MAX_INSTANCES) break;
      const t = Math.min(
        Math.max((now - rip.bornAt) / (T.motion.ms.ripple / 1000), 0), // lit-ok: ms to sec
        1,
      );
      const e = easePlain(t);
      rippleMesh.center.setXYZ(r, nodeX(rip.node), 0.01, nodeZ(rip.node)); // lit-ok: ripple plane height
      rippleMesh.scale.setX(r, 1 + (P.rippleScaleTo - 1) * e);
      rippleMesh.opacity.setX(r, P.rippleAlphaFrom * (1 - e));
      r++;
    }
    rippleMesh.geo.instanceCount = r;
    rippleMesh.center.needsUpdate = true;
    rippleMesh.scale.needsUpdate = true;
    rippleMesh.opacity.needsUpdate = true;
  }

  // --- Reduced motion: static map, first pins and matches at once. ---
  function buildReducedState(): void {
    const tNow = simNow();
    // Spawn pins from the seeded sequence until the reduced cap.
    while (pins.length < P.reducedPins) {
      const kind: LeaflinkPinKind =
        rand() < P.requestFraction ? 'request' : 'offer'; // lit-ok: kind draw
      const node = pickSpawnNode();
      if (node === null) break;
      const pin = placePin(kind, node, tNow, false);
      pin.state = 'open';
    }
    // Complete matches in spawn order until the reduced cap.
    let done = 0;
    for (const p of [...pins]) {
      if (done >= P.reducedMatches) break;
      if (p.state !== 'open') continue;
      const want: LeaflinkPinKind = p.kind === 'request' ? 'offer' : 'request';
      const found = nearestOpenPin(p.node, want, P.matchMaxHops);
      if (!found) continue;
      const other = found.pin;
      const req = p.kind === 'request' ? p : other;
      const off = p.kind === 'offer' ? p : other;
      const route = buildRoute(found.path, tNow - 10); // lit-ok: fully drawn start
      lanefield.setActivity(
        route.lanes,
        route.starts,
        new Float32Array(route.lanes.length).fill(tNow + 3600), // lit-ok: far fade
        1,
        route.uPerSecs,
      );
      matches.push({
        id: matchId++,
        req,
        off,
        lanes: route.lanes,
        starts: route.starts,
        fadeAts: new Float32Array(route.lanes.length).fill(tNow + 3600), // lit-ok: far fade
        uPerSecs: route.uPerSecs,
        tEnd: tNow - 10, // lit-ok: already done
        state: 'halo',
      });
      req.state = 'halo';
      off.state = 'halo';
      req.haloBornAt = tNow - 10; // lit-ok: halo already full
      off.haloBornAt = tNow - 10; // lit-ok: halo already full
      done++;
    }
    ripples.length = 0;
  }

  // --- Visitor entry points. ---
  function evictForVisitor(tNow: number): boolean {
    if (pins.length < P.maxPins) return true;
    const victim = pins.find((p) => p.state === 'open' && !p.visitor);
    if (!victim) return false;
    victim.state = 'fading';
    victim.fadingAt = tNow;
    return true;
  }

  function dropOfferAtNode(node: number): void {
    if (disposed || paused) return;
    const tNow = simNow();
    if (!evictForVisitor(tNow)) return;
    if (reduced) {
      const pin = placePin('offer', node, tNow, true);
      pin.state = 'open';
      const found = nearestOpenPin(node, 'request', nodeCount);
      if (found) {
        const route = buildRoute(found.path, tNow - 10); // lit-ok: fully drawn start
        lanefield.setActivity(
          route.lanes,
          route.starts,
          new Float32Array(route.lanes.length).fill(tNow + 3600), // lit-ok: far fade
          1,
          route.uPerSecs,
        );
        matches.push({
          id: matchId++,
          req: found.pin,
          off: pin,
          lanes: route.lanes,
          starts: route.starts,
          fadeAts: new Float32Array(route.lanes.length).fill(tNow + 3600), // lit-ok: far fade
          uPerSecs: route.uPerSecs,
          tEnd: tNow - 10, // lit-ok: already done
          state: 'halo',
        });
        found.pin.state = 'halo';
        found.pin.haloBornAt = tNow - 10; // lit-ok: halo already full
        pin.state = 'halo';
        pin.haloBornAt = tNow - 10; // lit-ok: halo already full
      }
      ripples.length = 0;
      updateInstances();
      return;
    }
    const hasOpenRequest = pins.some(
      (p) => p.state === 'open' && p.kind === 'request',
    );
    if (!hasOpenRequest) spawnVisitorRequestNear(node, tNow);
    placePin('offer', node, tNow, true);
  }

  function dropOfferAtCenter(): void {
    dropOfferAtNode(nearestNode(0, 0));
  }

  function dropOfferAtGround(x: number, z: number): void {
    dropOfferAtNode(nearestNode(x, z));
  }

  // --- Pointer tap (S06 tap section). ---
  let downAt: number | null = null;
  let downX = 0;
  let downY = 0;
  const onPointerDown = (event: PointerEvent): void => {
    downAt = performance.now();
    downX = event.clientX;
    downY = event.clientY;
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (downAt === null) return;
    const dt = performance.now() - downAt;
    const dx = event.clientX - downX;
    const dy = event.clientY - downY;
    downAt = null;
    if (dt >= T.world.leaflink.tapMaxMs) return;
    if (Math.hypot(dx, dy) >= T.world.leaflink.tapMaxMovePx) return;
    const ground = lanefield.screenToGround(event.clientX, event.clientY);
    if (!ground) return;
    dropOfferAtGround(ground[0], ground[1]);
  };
  const target = opts.target ?? null;
  if (target) {
    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointerup', onPointerUp);
  }

  // --- Lifecycle. ---
  const offFrame = lanefield.onFrame(() => {
    if (disposed || paused) return;
    updateInstances();
  });
  let timer: ReturnType<typeof setInterval> | null = null;
  if (!reduced) {
    timer = setInterval(() => {
      if (disposed || paused) return;
      processDue();
      updateInstances();
    }, 50); // lit-ok: sim tick
  }

  if (reduced) {
    buildReducedState();
    updateInstances();
  } else {
    updateInstances();
  }

  function pause(): void {
    if (paused || disposed) return;
    paused = true;
    pausedAt = lanefield.now();
  }

  function resume(): void {
    if (!paused || disposed) return;
    paused = false;
    if (pausedAt !== null) {
      pausedTotal += lanefield.now() - pausedAt;
      pausedAt = null;
    }
    // Something lands soon after return (S06 motion table).
    if (nextEventAt <= simNow()) {
      nextEventAt = simNow() + P.firstEventAfterMs / 1000; // lit-ok: ms to sec
    }
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    if (timer !== null) clearInterval(timer);
    offFrame();
    if (target) {
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointerup', onPointerUp);
    }
    lanefield.scene.remove(pinMesh.mesh);
    lanefield.scene.remove(haloMesh.mesh);
    lanefield.scene.remove(rippleMesh.mesh);
    pinMesh.geo.dispose();
    haloMesh.geo.dispose();
    rippleMesh.geo.dispose();
    (pinMesh.mesh.material as THREE.ShaderMaterial).dispose();
    (haloMesh.mesh.material as THREE.ShaderMaterial).dispose();
    (rippleMesh.mesh.material as THREE.ShaderMaterial).dispose();
    lanefield.clearActivity(1);
  }

  return {
    pause,
    resume,
    dispose,
    dropOfferAtNode,
    dropOfferAtCenter,
    dropOfferAtGround,
    processDue,
    snapshotPins: () =>
      pins.map((p) => ({
        node: p.node,
        kind: p.kind,
        state: p.state,
        visitor: p.visitor,
      })),
    snapshotEvents: () => [...events],
    matchCount: () => matches.length,
  };
}
