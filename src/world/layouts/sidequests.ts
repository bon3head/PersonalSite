// SideQuests plan generator: the chalk campus plan layout.
// Pure function. No DOM, no three imports. Writes texels for one layout
// into the shared layout texture array and returns the scene side data.
import { T } from '../../tokens.generated';

type Vec = [number, number];

export interface SideQuestsTrailSideData {
  laneIds: number[];
  arcStarts: number[];
  arcLengths: number[];
}

export interface SideQuestsSideData {
  markers: Vec[];
  trails: SideQuestsTrailSideData[];
  footprints: Vec[][];
}

interface Footprint {
  polygon: Vec[];
  rect: [number, number, number, number];
}

interface Curve {
  pointAt: (s: number) => Vec;
  length: number;
}

// Class ids from the engine spec layout section.
const CLS_GRID = 4; // lit-ok: grid class id
const CLS_OUTLINE = 5; // lit-ok: outline class id
const CLS_HATCH = 6; // lit-ok: hatch class id
const CLS_WALKWAY = 7; // lit-ok: walkway class id
const CLS_TRAIL = 8; // lit-ok: trail class id

// mulberry32, verbatim from the engine spec. The only RNG in this file.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); // lit-ok: mulberry32 mixing constants
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); // lit-ok: mulberry32 mixing constants
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // lit-ok: mulberry32 output scale
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerp2(a: Vec, b: Vec, t: number): Vec {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function cross2(a: Vec, b: Vec): number {
  return a[0] * b[1] - a[1] * b[0];
}

function straightLane(
  out: Float32Array,
  layoutIndex: number,
  laneId: number,
  a: Vec,
  b: Vec,
  cls: number,
): void {
  const laneBase =
    (laneId * (T.world.layouts.length * T.world.pointsPerLane) +
      layoutIndex * T.world.pointsPerLane) *
    4; // lit-ok: RGBA texel component count
  const n = T.world.pointsPerLane;
  const seg = T.world.segmentsPerLane;
  for (let k = 0; k < n; k++) {
    const t = k / seg;
    const base = laneBase + k * 4; // lit-ok: RGBA texel component count
    out[base] = a[0] + (b[0] - a[0]) * t;
    out[base + 1] = 0;
    out[base + 2] = a[1] + (b[1] - a[1]) * t;
    out[base + 3] = cls;
  }
}

function curveLane(
  out: Float32Array,
  layoutIndex: number,
  laneId: number,
  pointAt: (s: number) => Vec,
  a: number,
  b: number,
  cls: number,
): void {
  const laneBase =
    (laneId * (T.world.layouts.length * T.world.pointsPerLane) +
      layoutIndex * T.world.pointsPerLane) *
    4; // lit-ok: RGBA texel component count
  const n = T.world.pointsPerLane;
  const seg = T.world.segmentsPerLane;
  for (let k = 0; k < n; k++) {
    const s = a + ((b - a) * k) / seg;
    const p = pointAt(s);
    const base = laneBase + k * 4; // lit-ok: RGBA texel component count
    out[base] = p[0];
    out[base + 1] = 0;
    out[base + 2] = p[1];
    out[base + 3] = cls;
  }
}

// Centripetal Catmull-Rom segment evaluator, Barry-Goldman form.
// Knot distances are computed once per segment, not per sample.
function makeSegmentEvaluator(p0: Vec, p1: Vec, p2: Vec, p3: Vec): (t: number) => Vec {
  const eps = 1e-6; // lit-ok: degenerate segment guard
  const t0 = 0;
  const t1 = t0 + Math.max(Math.sqrt(Math.hypot(p1[0] - p0[0], p1[1] - p0[1])), eps);
  const t2 = t1 + Math.max(Math.sqrt(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])), eps);
  const t3 = t2 + Math.max(Math.sqrt(Math.hypot(p3[0] - p2[0], p3[1] - p2[1])), eps);
  return (t: number): Vec => {
    const u = t1 + t * (t2 - t1);
    const u0 = (u - t0) / (t1 - t0);
    const u1 = (u - t1) / (t2 - t1);
    const u2 = (u - t2) / (t3 - t2);
    const a1x = p0[0] + (p1[0] - p0[0]) * u0;
    const a1z = p0[1] + (p1[1] - p0[1]) * u0;
    const a2x = p1[0] + (p2[0] - p1[0]) * u1;
    const a2z = p1[1] + (p2[1] - p1[1]) * u1;
    const a3x = p2[0] + (p3[0] - p2[0]) * u2;
    const a3z = p2[1] + (p3[1] - p2[1]) * u2;
    const v0 = (u - t0) / (t2 - t0);
    const v1 = (u - t1) / (t3 - t1);
    const b1x = a1x + (a2x - a1x) * v0;
    const b1z = a1z + (a2z - a1z) * v0;
    const b2x = a2x + (a3x - a2x) * v1;
    const b2z = a2z + (a3z - a2z) * v1;
    const w = (u - t1) / (t2 - t1);
    return [b1x + (b2x - b1x) * w, b1z + (b2z - b1z) * w];
  };
}

// Arc-length table over the control polygon, for even lane sampling.
function makeCurve(ctrl: Vec[]): Curve {
  const samples: Vec[] = [];
  const cum: number[] = [];
  const push = (p: Vec): void => {
    if (samples.length > 0) {
      const prev = samples[samples.length - 1];
      cum.push(cum[cum.length - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    } else {
      cum.push(0);
    }
    samples.push(p);
  };
  const perSeg = 64; // lit-ok: arc table density
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const evalSeg = makeSegmentEvaluator(p0, p1, p2, p3);
    const startS = i === 0 ? 0 : 1;
    for (let s = startS; s < perSeg; s++) {
      push(evalSeg(s / perSeg));
    }
  }
  push(ctrl[ctrl.length - 1]);
  const length = cum[cum.length - 1];
  const pointAt = (s: number): Vec => {
    if (s <= 0) return samples[0];
    if (s >= length) return samples[samples.length - 1];
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const segLen = cum[hi] - cum[lo];
    const t = segLen === 0 ? 0 : (s - cum[lo]) / segLen;
    return lerp2(samples[lo], samples[hi], t);
  };
  return { pointAt, length };
}

function makeStraightCurve(a: Vec, b: Vec): Curve {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return {
    length,
    pointAt: (s: number): Vec => {
      const t = length === 0 ? 0 : s / length;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    },
  };
}

function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const zi = poly[i][1];
    const xj = poly[j][0];
    const zj = poly[j][1];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const lenSq = dx * dx + dz * dz;
  let t = lenSq === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz));
}

function distToPolygon(p: Vec, poly: Vec[]): number {
  if (pointInPolygon(p, poly)) return 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const d = distToSegment(p, poly[i], poly[(i + 1) % poly.length]);
    if (d < best) best = d;
  }
  return best;
}

// Ray from origin along direction against one segment. Null when parallel.
function raySegment(o: Vec, dir: Vec, a: Vec, b: Vec): number | null {
  const e: Vec = [b[0] - a[0], b[1] - a[1]];
  const ao: Vec = [a[0] - o[0], a[1] - o[1]];
  const denom = cross2(dir, e);
  if (Math.abs(denom) < 1e-9) return null; // lit-ok: parallel epsilon
  const t = cross2(ao, e) / denom;
  const u = cross2(ao, dir) / denom;
  if (t <= 0 || u < 0 || u > 1) return null;
  return t;
}

function rayBoxExit(o: Vec, dir: Vec, rx0: number, rz0: number, rx1: number, rz1: number): number {
  let tExit = Infinity;
  if (Math.abs(dir[0]) >= 1e-9) { // lit-ok: parallel epsilon
    const ta = (rx0 - o[0]) / dir[0];
    const tb = (rx1 - o[0]) / dir[0];
    tExit = Math.min(tExit, Math.max(ta, tb));
  }
  if (Math.abs(dir[1]) >= 1e-9) { // lit-ok: parallel epsilon
    const ta = (rz0 - o[1]) / dir[1];
    const tb = (rz1 - o[1]) / dir[1];
    tExit = Math.min(tExit, Math.max(ta, tb));
  }
  return tExit;
}

// Distance along the ray to the nearest other footprint, else to the region edge.
function rayClearance(
  o: Vec,
  dir: Vec,
  others: Footprint[],
  region: [number, number, number, number],
): number {
  let best = Infinity;
  for (const fp of others) {
    const poly = fp.polygon;
    for (let i = 0; i < poly.length; i++) {
      const t = raySegment(o, dir, poly[i], poly[(i + 1) % poly.length]);
      if (t !== null && t < best) best = t;
    }
  }
  if (best !== Infinity) return best;
  const exit = rayBoxExit(o, dir, region[0], region[1], region[2], region[3]);
  if (exit !== Infinity) return exit;
  return Math.hypot(region[2] - region[0], region[3] - region[1]);
}

// Entrance at the midpoint of the edge facing the most open space.
function entranceFor(fp: Footprint, others: Footprint[]): Vec {
  const poly = fp.polygon;
  let cx = 0;
  let cz = 0;
  for (const v of poly) {
    cx += v[0];
    cz += v[1];
  }
  cx /= poly.length;
  cz /= poly.length;
  const b = T.world.sidequests.buildings;
  const [rx0, rx1] = b.region[0];
  const [rz0, rz1] = b.region[1];
  let best: Vec | null = null;
  let bestD = -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    const mx = (a[0] + c[0]) / 2;
    const mz = (a[1] + c[1]) / 2;
    const dx = c[0] - a[0];
    const dz = c[1] - a[1];
    let nx = dz;
    let nz = -dx;
    if (nx * (mx - cx) + nz * (mz - cz) < 0) {
      nx = -nx;
      nz = -nz;
    }
    const len = Math.hypot(nx, nz);
    if (len === 0) continue;
    nx /= len;
    nz /= len;
    const d = rayClearance([mx, mz], [nx, nz], others, [rx0, rz0, rx1, rz1]);
    if (d > bestD) {
      bestD = d;
      best = [mx, mz];
    }
  }
  if (best === null) throw new Error('sidequests: no entrance edge');
  return best;
}

// Rectangle with one corner cut out, vertices in boundary order.
function lPolygon(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  corner: number,
  cx: number,
  cz: number,
): Vec[] {
  switch (corner) {
    case 0:
      return [
        [x0 + cx, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
        [x0, z0 + cz],
        [x0 + cx, z0 + cz],
      ];
    case 1:
      return [
        [x0, z0],
        [x1 - cx, z0],
        [x1 - cx, z0 + cz],
        [x1, z0 + cz],
        [x1, z1],
        [x0, z1],
      ];
    case 2:
      return [
        [x0, z0],
        [x1, z0],
        [x1, z1 - cz],
        [x1 - cx, z1 - cz],
        [x1 - cx, z1],
        [x0, z1],
      ];
    default:
      return [
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0 + cx, z1],
        [x0 + cx, z1 - cz],
        [x0, z1 - cz],
      ];
  }
}

function sampleBuilding(r: () => number): Footprint {
  const b = T.world.sidequests.buildings;
  const w = b.minSide + r() * (b.maxSide - b.minSide);
  const d = b.minSide + r() * (b.maxSide - b.minSide);
  const [rx0, rx1] = b.region[0];
  const [rz0, rz1] = b.region[1];
  const x0 = rx0 + r() * (rx1 - rx0 - w);
  const z0 = rz0 + r() * (rz1 - rz0 - d);
  const x1 = x0 + w;
  const z1 = z0 + d;
  if (r() < b.lShapeFraction) {
    const corner = Math.floor(r() * 4); // lit-ok: corner count
    const cutX = w * (b.lShapeCut[0] + r() * (b.lShapeCut[1] - b.lShapeCut[0]));
    const cutZ = d * (b.lShapeCut[0] + r() * (b.lShapeCut[1] - b.lShapeCut[0]));
    return { polygon: lPolygon(x0, z0, x1, z1, corner, cutX, cutZ), rect: [x0, z0, x1, z1] };
  }
  return { polygon: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], rect: [x0, z0, x1, z1] };
}

function fits(cand: Footprint, placed: Footprint[]): boolean {
  const g = T.world.sidequests.buildings.minGap / 2;
  const [cx0, cz0, cx1, cz1] = cand.rect;
  for (const p of placed) {
    const [px0, pz0, px1, pz1] = p.rect;
    const overlapX = cx0 - g < px1 + g && px0 - g < cx1 + g;
    const overlapZ = cz0 - g < pz1 + g && pz0 - g < cz1 + g;
    if (overlapX && overlapZ) return false;
  }
  return true;
}

// Rejection-sampled footprints; restarts on a fresh stream when the count misses.
function placeBuildings(mainR: () => number, base: number): Footprint[] {
  const b = T.world.sidequests.buildings;
  let attempt = 0;
  for (;;) {
    attempt++;
    const r = attempt === 1 ? mainR : rng(base + attempt);
    const placed: Footprint[] = [];
    for (let t = 0; t < b.maxAttempts && placed.length < b.count; t++) {
      const cand = sampleBuilding(r);
      if (fits(cand, placed)) placed.push(cand);
    }
    if (placed.length === b.count) return placed;
    if (attempt > 100) throw new Error('sidequests: building placement failed'); // lit-ok: restart cap
  }
}

function curveHitsFootprint(curve: Curve, footprints: Footprint[]): boolean {
  const checks = 40; // lit-ok: inside-footprint sampling density
  for (let i = 1; i < checks; i++) {
    const p = curve.pointAt((curve.length * i) / checks);
    for (const fp of footprints) {
      const [rx0, rz0, rx1, rz1] = fp.rect;
      if (p[0] < rx0 || p[0] > rx1 || p[1] < rz0 || p[1] > rz1) continue;
      if (pointInPolygon(p, fp.polygon)) return true;
    }
  }
  return false;
}

// True when the point is at least the margin clear of one footprint.
// The expanded bounding box rejects most pairs before any edge math.
function clearOfFootprint(p: Vec, fp: Footprint, margin: number): boolean {
  const [rx0, rz0, rx1, rz1] = fp.rect;
  if (p[0] < rx0 - margin || p[0] > rx1 + margin || p[1] < rz0 - margin || p[1] > rz1 + margin) {
    return true;
  }
  if (pointInPolygon(p, fp.polygon)) return false;
  const poly = fp.polygon;
  for (let i = 0; i < poly.length; i++) {
    if (distToSegment(p, poly[i], poly[(i + 1) % poly.length]) < margin) return false;
  }
  return true;
}

// Push a point out of a polygon along the centroid ray until clear by the margin.
function nudgeOut(p: Vec, poly: Vec[], margin: number): Vec {
  let cx = 0;
  let cz = 0;
  for (const v of poly) {
    cx += v[0];
    cz += v[1];
  }
  cx /= poly.length;
  cz /= poly.length;
  let dx = p[0] - cx;
  let dz = p[1] - cz;
  let len = Math.hypot(dx, dz);
  if (len === 0) {
    dx = 1;
    dz = 0;
    len = 1;
  }
  dx /= len;
  dz /= len;
  let q: Vec = [p[0], p[1]];
  for (let i = 0; i < 400; i++) { // lit-ok: nudge step cap
    if (!pointInPolygon(q, poly) && distToPolygon(q, poly) >= margin) return q;
    q = [q[0] + dx * 0.1, q[1] + dz * 0.1]; // lit-ok: nudge step size
  }
  return q;
}

// Diagonal hatch segments clipped to every footprint polygon.
function hatchSegments(footprints: Footprint[], spacing: number): Array<[Vec, Vec]> {
  const segs: Array<[Vec, Vec]> = [];
  const angle = (T.world.sidequests.hatchAngleDeg * Math.PI) / 180; // lit-ok: degrees to radians
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);
  const nx = -dz;
  const nz = dx;
  for (const fp of footprints) {
    const poly = fp.polygon;
    let cMin = Infinity;
    let cMax = -Infinity;
    for (const v of poly) {
      const c = v[0] * nx + v[1] * nz;
      if (c < cMin) cMin = c;
      if (c > cMax) cMax = c;
    }
    const first = Math.ceil(cMin / spacing) * spacing;
    for (let c = first; c <= cMax; c += spacing) {
      const hits: number[] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const da = a[0] * nx + a[1] * nz - c;
        const db = b[0] * nx + b[1] * nz - c;
        if ((da < 0 && db >= 0) || (da >= 0 && db < 0)) {
          const t = da / (da - db);
          const px = a[0] + (b[0] - a[0]) * t;
          const pz = a[1] + (b[1] - a[1]) * t;
          hits.push(px * dx + pz * dz);
        }
      }
      hits.sort((a, b) => a - b);
      for (let h = 0; h + 1 < hits.length; h += 2) {
        const s0 = hits[h];
        const s1 = hits[h + 1];
        if (s1 - s0 <= 0) continue;
        const a: Vec = [nx * c + dx * s0, nz * c + dz * s0];
        const b: Vec = [nx * c + dx * s1, nz * c + dz * s1];
        segs.push([a, b]);
      }
    }
  }
  return segs;
}

export function generate(
  seed: number,
  out: Float32Array,
  layoutIndex: number,
): SideQuestsSideData {
  const sq = T.world.sidequests;
  const texW = T.world.layoutTexture.width;
  const texH = T.world.layoutTexture.height;
  const expected = texW * texH * 4; // lit-ok: RGBA component count
  if (out.length < expected) throw new Error('sidequests: layout array too small');
  const base = seed + layoutIndex * 1000003; // lit-ok: layout stream stride
  const r = rng(base);

  let lane = 0;

  // Grid: vertical lines then horizontal lines, unit lanes.
  const extX = sq.extent[0];
  const extZ = sq.extent[1];
  const pitch = sq.gridPitch;
  const xMin = -extX / 2;
  const zMin = -extZ / 2;
  const vLines = Math.round(extX / pitch) + 1;
  const hLines = Math.round(extZ / pitch) + 1;
  const vPerLine = Math.round(extZ / pitch);
  const hPerLine = Math.round(extX / pitch);
  for (let i = 0; i < vLines; i++) {
    const x = xMin + i * pitch;
    for (let j = 0; j < vPerLine; j++) {
      const z0 = zMin + j * pitch;
      straightLane(out, layoutIndex, lane, [x, z0], [x, z0 + pitch], CLS_GRID);
      lane++;
    }
  }
  for (let j = 0; j < hLines; j++) {
    const z = zMin + j * pitch;
    for (let i = 0; i < hPerLine; i++) {
      const x0 = xMin + i * pitch;
      straightLane(out, layoutIndex, lane, [x0, z], [x0 + pitch, z], CLS_GRID);
      lane++;
    }
  }
  if (lane !== sq.allocation.grid) throw new Error('sidequests: grid lane count mismatch');

  // Buildings, entrances, outlines.
  const footprints = placeBuildings(r, base);
  const entrances: Vec[] = [];
  for (let i = 0; i < footprints.length; i++) {
    const others = footprints.filter((_, j) => j !== i);
    entrances.push(entranceFor(footprints[i], others));
  }
  const outlineLen = sq.outlineLaneLength;
  for (const fp of footprints) {
    const poly = fp.polygon;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const c = poly[(i + 1) % poly.length];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const count = Math.max(1, Math.round(len / outlineLen));
      for (let s = 0; s < count; s++) {
        straightLane(out, layoutIndex, lane, lerp2(a, c, s / count), lerp2(a, c, (s + 1) / count), CLS_OUTLINE);
        lane++;
      }
    }
  }

  // Walkways: shortest edges of the entrance spanning tree, curved.
  const n = entrances.length;
  const inTree = new Array<boolean>(n).fill(false);
  const minDist = new Array<number>(n).fill(Infinity);
  const parent = new Array<number>(n).fill(-1);
  minDist[0] = 0;
  const mstEdges: Array<[number, number, number]> = [];
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (u === -1 || minDist[i] < minDist[u])) u = i;
    }
    inTree[u] = true;
    if (parent[u] !== -1) mstEdges.push([parent[u], u, minDist[u]]);
    for (let v = 0; v < n; v++) {
      if (!inTree[v]) {
        const d = Math.hypot(entrances[v][0] - entrances[u][0], entrances[v][1] - entrances[u][1]);
        if (d < minDist[v]) {
          minDist[v] = d;
          parent[v] = u;
        }
      }
    }
  }
  mstEdges.sort((a, b) => a[2] - b[2]);
  const walkwayEdges = mstEdges.slice(0, sq.walkways);
  const [offMin, offMax] = sq.walkwayOffset;
  for (const [ai, bi] of walkwayEdges) {
    const A = entrances[ai];
    const B = entrances[bi];
    const abx = B[0] - A[0];
    const abz = B[1] - A[1];
    const abLen = Math.hypot(abx, abz);
    const nx = -abz / abLen;
    const nz = abx / abLen;
    const o1 = (offMin + r() * (offMax - offMin)) * abLen * (r() < 0.5 ? -1 : 1);
    const o2 = (offMin + r() * (offMax - offMin)) * abLen * (r() < 0.5 ? -1 : 1);
    const c1: Vec = [A[0] + abx * 0.33 + nx * o1, A[1] + abz * 0.33 + nz * o1]; // lit-ok: walkway control fractions
    const c2: Vec = [A[0] + abx * 0.66 + nx * o2, A[1] + abz * 0.66 + nz * o2]; // lit-ok: walkway control fractions
    let curve = makeCurve([A, c1, c2, B]);
    if (curveHitsFootprint(curve, footprints)) {
      const f1: Vec = [A[0] + abx * 0.33 - nx * o1, A[1] + abz * 0.33 - nz * o1]; // lit-ok: walkway control fractions
      const f2: Vec = [A[0] + abx * 0.66 - nx * o2, A[1] + abz * 0.66 - nz * o2]; // lit-ok: walkway control fractions
      curve = makeCurve([A, f1, f2, B]);
      if (curveHitsFootprint(curve, footprints)) {
        curve = makeStraightCurve(A, B);
      }
    }
    const count = Math.max(1, Math.round(curve.length / sq.walkwayLaneLength));
    for (let s = 0; s < count; s++) {
      const a = (curve.length * s) / count;
      const b = (curve.length * (s + 1)) / count;
      curveLane(out, layoutIndex, lane, curve.pointAt, a, b, CLS_WALKWAY);
      lane++;
    }
  }

  // Markers: integer points clear of footprints and the trailhead, far apart.
  const start: Vec = [sq.trails.start[0], sq.trails.start[2]];
  const bld = sq.buildings;
  const [rx0, rx1] = bld.region[0];
  const [rz0, rz1] = bld.region[1];
  const candidates: Vec[] = [];
  for (let gx = Math.ceil(rx0); gx <= Math.floor(rx1); gx++) {
    for (let gz = Math.ceil(rz0); gz <= Math.floor(rz1); gz++) {
      const p: Vec = [gx, gz];
      if (Math.hypot(p[0] - start[0], p[1] - start[1]) < sq.markerMinFromStart) continue;
      let clear = true;
      for (const fp of footprints) {
        if (!clearOfFootprint(p, fp, sq.footprintMargin)) {
          clear = false;
          break;
        }
      }
      if (clear) candidates.push(p);
    }
  }
  if (candidates.length < sq.trails.count) throw new Error('sidequests: too few marker candidates');
  const markers: Vec[] = [candidates[Math.floor(r() * candidates.length)]];
  while (markers.length < sq.trails.count) {
    let best: Vec | null = null;
    let bestD = -1;
    for (const c of candidates) {
      if (markers.includes(c)) continue;
      let minD = Infinity;
      for (const m of markers) {
        minD = Math.min(minD, Math.hypot(c[0] - m[0], c[1] - m[1]));
      }
      if (minD >= sq.markerMinApart && minD > bestD) {
        bestD = minD;
        best = c;
      }
    }
    if (best === null) throw new Error('sidequests: no marker candidate far enough apart');
    markers.push(best);
  }

  // Trails: dashed curves from the trailhead to each marker.
  const trailsSide: SideQuestsTrailSideData[] = [];
  for (const marker of markers) {
    const dx = marker[0] - start[0];
    const dz = marker[1] - start[1];
    const len = Math.hypot(dx, dz);
    const px = -dz / len;
    const pz = dx / len;
    const wps: Vec[] = [];
    for (const f of sq.waypointFractions) {
      const off = (r() * 2 - 1) * sq.waypointOffset;
      let wp: Vec = [start[0] + dx * f + px * off, start[1] + dz * f + pz * off];
      for (let guard = 0; guard < 10; guard++) { // lit-ok: nudge re-check cap
        let moved = false;
        for (const fp of footprints) {
          if (pointInPolygon(wp, fp.polygon)) {
            wp = nudgeOut(wp, fp.polygon, sq.footprintMargin);
            moved = true;
          }
        }
        if (!moved) break;
      }
      wps.push(wp);
    }
    const curve = makeCurve([start, ...wps, marker]);
    const dash = sq.trails.dashLength;
    const gap = sq.trails.gapLength;
    const laneIds: number[] = [];
    const arcStarts: number[] = [];
    const arcLengths: number[] = [];
    let s = 0;
    while (s < curve.length) {
      const e = Math.min(s + dash, curve.length);
      curveLane(out, layoutIndex, lane, curve.pointAt, s, e, CLS_TRAIL);
      laneIds.push(lane);
      arcStarts.push(s);
      arcLengths.push(e - s);
      lane++;
      s += dash + gap;
    }
    trailsSide.push({ laneIds, arcStarts, arcLengths });
  }

  // Hatch: the remainder, allocated across clipped diagonal segments by length.
  const hatchN = T.world.laneCount - lane;
  if (hatchN <= 0) throw new Error('sidequests: no lanes left for hatch');
  let spacing = sq.hatchSpacing;
  let segments: Array<[Vec, Vec]> = [];
  for (let attempt = 0; attempt < 100; attempt++) { // lit-ok: spacing growth cap
    segments = hatchSegments(footprints, spacing);
    if (segments.length <= hatchN) break;
    spacing *= sq.hatchSpacingGrow;
  }
  if (segments.length > hatchN) throw new Error('sidequests: hatch segments exceed remainder');
  if (segments.length === 0) throw new Error('sidequests: no hatch segments');
  const segLens = segments.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const segTotal = segLens.reduce((sum, l) => sum + l, 0);
  const quotas = segLens.map((l) => (hatchN * l) / segTotal);
  const counts = quotas.map((q) => Math.max(1, Math.floor(q)));
  let sum = counts.reduce((s, c) => s + c, 0);
  if (sum < hatchN) {
    const order = quotas.map((_, i) => i).sort((a, b) => {
      const fa = quotas[a] - Math.floor(quotas[a]);
      const fb = quotas[b] - Math.floor(quotas[b]);
      return fb - fa;
    });
    let oi = 0;
    while (sum < hatchN) {
      counts[order[oi % order.length]]++;
      sum++;
      oi++;
    }
  }
  if (sum > hatchN) {
    while (sum > hatchN) {
      let bestIdx = -1;
      for (let i = 0; i < counts.length; i++) {
        if (counts[i] > 1 && (bestIdx === -1 || counts[i] > counts[bestIdx])) bestIdx = i;
      }
      if (bestIdx === -1) throw new Error('sidequests: hatch trim failed');
      counts[bestIdx]--;
      sum--;
    }
  }
  for (let e = 0; e < segments.length; e++) {
    const [a, b] = segments[e];
    const k = counts[e];
    for (let s = 0; s < k; s++) {
      straightLane(out, layoutIndex, lane, lerp2(a, b, s / k), lerp2(a, b, (s + 1) / k), CLS_HATCH);
      lane++;
    }
  }

  if (lane !== T.world.laneCount) throw new Error('sidequests: lane total mismatch');
  return {
    markers,
    trails: trailsSide,
    footprints: footprints.map((fp) => fp.polygon),
  };
}
