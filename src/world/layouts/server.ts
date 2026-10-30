// Server layout generator (S05 layout chapter). Runs in the worker.
// Pure function: no DOM, no three imports. Writes every lane of the field
// with its full point set into the layout texture buffer at the slice for
// layoutIndex. Texel index for a lane, layout, and point follows the worker
// chapter formula (lane stride times lane, plus layout times points per
// lane, plus point). RGB is the world position, A is the class id. Every
// point carries class 0 (server.lane); class 1 (server.converge) is reserved
// and unused in v1.
// The layout is pure grid arithmetic: it consumes no randomness, so the
// seed exists only for interface compatibility with the worker contract
// (S02 worker chapter: each layout gets its own seeded stream; the server
// layout draws nothing from it).
import { T } from '../../tokens.generated';

const POINTS = T.world.pointsPerLane;
const LAYOUT_COUNT = T.world.layouts.length;
const LANE_STRIDE = POINTS * LAYOUT_COUNT; // texels per lane across all layouts
const FLOATS_PER_TEXEL = 4; // lit-ok: RGBA channels

export function generate(seed: number, out: Float32Array, layoutIndex: number): void {
  void seed; // no randomness consumed: grid arithmetic only, see header
  const sm = T.world.server.sm;
  const part = T.world.server.partition;
  const ln = T.world.server.lane;
  const zStraight = T.world.server.zStraight;
  const convergeZ = T.world.server.convergeZ;
  const convergeMix = T.world.server.convergeMix;
  const focus = T.world.server.focus;
  const smColCenter = (sm.cols - 1) / 2;
  const smRowCenter = (sm.rows - 1) / 2;
  const partColCenter = (part.cols - 1) / 2;
  const partRowCenter = (part.rows - 1) / 2;
  const laneColCenter = (ln.cols - 1) / 2;
  const laneRowCenter = (ln.rows - 1) / 2;
  const lanesPerSm = part.perSm * ln.perPartition;
  const straightPoints = POINTS - 2; // the last two points are converge points
  const zSpan = zStraight[1] - zStraight[0];
  const zStep = zSpan / (straightPoints - 1);
  for (let i = 0; i < T.world.laneCount; i++) {
    const smIndex = Math.floor(i / lanesPerSm);
    const partIndex = Math.floor((i % lanesPerSm) / ln.perPartition);
    const laneIndex = i % ln.perPartition;
    const smCol = smIndex % sm.cols;
    const smRow = Math.floor(smIndex / sm.cols);
    const partCol = partIndex % part.cols;
    const partRow = Math.floor(partIndex / part.cols);
    const laneCol = laneIndex % ln.cols;
    const laneRow = Math.floor(laneIndex / ln.cols);
    const x =
      (smCol - smColCenter) * sm.pitch[0] +
      (partCol - partColCenter) * part.pitch[0] +
      (laneCol - laneColCenter) * ln.pitch[0];
    const y =
      (smRow - smRowCenter) * sm.pitch[1] +
      (partRow - partRowCenter) * part.pitch[1] +
      (laneRow - laneRowCenter) * ln.pitch[1];
    const laneBase = (i * LANE_STRIDE + layoutIndex * POINTS) * FLOATS_PER_TEXEL;
    for (let k = 0; k < straightPoints; k++) {
      const base = laneBase + k * FLOATS_PER_TEXEL;
      out[base] = x;
      out[base + 1] = y;
      out[base + 2] = zStraight[0] + k * zStep;
      out[base + 3] = 0; // lit-ok: S02 class 0 server.lane
    }
    const convergeX0 = x + (focus[0] - x) * convergeMix[0];
    const convergeY0 = y + (focus[1] - y) * convergeMix[0];
    const base6 = laneBase + straightPoints * FLOATS_PER_TEXEL;
    out[base6] = convergeX0;
    out[base6 + 1] = convergeY0;
    out[base6 + 2] = convergeZ[0];
    out[base6 + 3] = 0; // lit-ok: S02 class 0 server.lane
    const convergeX1 = x + (focus[0] - x) * convergeMix[1];
    const convergeY1 = y + (focus[1] - y) * convergeMix[1];
    const base7 = laneBase + (straightPoints + 1) * FLOATS_PER_TEXEL;
    out[base7] = convergeX1;
    out[base7 + 1] = convergeY1;
    out[base7 + 2] = convergeZ[1];
    out[base7 + 3] = 0; // lit-ok: S02 class 0 server.lane
  }
}
