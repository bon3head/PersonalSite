// Performance governor (S02 governor chapter) and frame statistics.
// The only quality lever is resolution: lane count and classes never change.
// Also owns the ring of recent frame times used by frameStats and ?perf dumps.
import { T } from '../tokens.generated';

const RING_SIZE = 600; // lit-ok: perf dump frame count

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

export class Governor {
  private windowSamples: number[] = [];
  private windowStartMs: number;
  private ring = new Float64Array(RING_SIZE);
  private ringCount = 0;
  private ringHead = 0;
  private totalFrames = 0;
  private goodWindows = 0;
  private scale = 1;
  private base = 1;
  private floor = 1;

  constructor() {
    this.windowStartMs = performance.now();
  }

  // base: min(devicePixelRatio, cap). floor: absolute DPR floor.
  setBase(base: number, floor: number): void {
    this.base = base;
    this.floor = floor;
    this.scale = Math.min(this.scale, 1);
    if (this.base > 0 && this.scale < this.floor / this.base) {
      this.scale = this.floor / this.base;
    }
  }

  scaleFactor(): number {
    return this.scale;
  }

  effectiveDpr(): number {
    return Math.max(this.floor, this.base * this.scale);
  }

  sample(dtMs: number, nowMs: number): void {
    this.windowSamples.push(dtMs);
    this.ring[this.ringHead] = dtMs;
    this.ringHead = (this.ringHead + 1) % RING_SIZE;
    if (this.ringCount < RING_SIZE) this.ringCount++;
    this.totalFrames++;
    if (nowMs - this.windowStartMs < T.world.governor.sampleWindowMs) return;
    const sorted = [...this.windowSamples].sort((a, b) => a - b);
    const p90 = percentile(sorted, 0.9); // lit-ok: p90 quantile
    this.windowSamples.length = 0;
    this.windowStartMs = nowMs;
    const g = T.world.governor;
    if (p90 > g.stepDownAboveMs) {
      this.goodWindows = 0;
      const minScale = this.base > 0 ? this.floor / this.base : 1;
      this.scale = Math.max(this.scale - g.dprStep, minScale);
    } else if (p90 < g.stepUpBelowMs) {
      this.goodWindows++;
      if (this.goodWindows * g.sampleWindowMs >= g.stepUpAfterMs) {
        this.scale = Math.min(1, this.scale + g.dprStep);
        this.goodWindows = 0;
      }
    } else {
      this.goodWindows = 0;
    }
  }

  stats(): { p50: number; p90: number; p95: number; count: number } {
    const valid = Array.from(this.ring.slice(0, this.ringCount)).sort((a, b) => a - b);
    return {
      p50: percentile(valid, 0.5),
      p90: percentile(valid, 0.9), // lit-ok: p90 quantile
      p95: percentile(valid, 0.95), // lit-ok: p95 quantile
      count: this.totalFrames,
    };
  }

  // Last ring entries in chronological order, for ?perf=1&dump=1.
  recentFrames(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.ringCount; i++) {
      out.push(this.ring[(this.ringHead - this.ringCount + i + RING_SIZE) % RING_SIZE]);
    }
    return out;
  }

  ringFull(): boolean {
    return this.ringCount >= RING_SIZE;
  }
}
