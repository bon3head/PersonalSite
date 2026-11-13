// Seeded entropy for motion variety (polish item 5, DESIGN section 6.11).
//
// One 32-bit session seed drives every random motion choice. The seed
// comes from the URL (?seed=<uint32>, token entropy.seedParam) when
// present, so any run can be replayed exactly; otherwise one value is
// drawn from crypto.getRandomValues at first use. Nothing in src uses
// Math.random for motion.
//
// Draws are counter-based: draw(channel, n) is a pure hash of (seed,
// channel, n), so a value depends only on the seed and how many draws
// that channel has made, never on frame timing or call interleaving
// across channels. Same seed plus same input sequence gives the same
// motion; a different seed varies it.
//
// Reduced motion disables entropy: unit() returns 0.5 and signed()
// returns 0, so every motion parameter takes its neutral value and the
// result is identical for every seed.
//
// The layout seed (T.world.seed) is separate and never changes: lane
// geometry, the LeafLink sim sequence, and the layout hash stay fixed.
// Entropy only moves motion parameters (camera bow, ring swirl,
// silhouette pull scale, pulse swirl, glitter swirl).
import { T } from '../tokens.generated';
import type { LayoutId } from '../world/types';

export type EntropyChannel =
  | 'morph-bow'
  | 'morph-swirl'
  | 'morph-pull'
  | 'pulse-swirl'
  | 'glitter-swirl'
  | 'guestbook-open'
  | 'guestbook-sign'
  | 'server-node';

const CHANNEL_ID: Record<EntropyChannel, number> = {
  'morph-bow': 1,
  'morph-swirl': 2,
  'morph-pull': 3,
  'pulse-swirl': 4,
  'glitter-swirl': 5,
  'guestbook-open': 6,
  'guestbook-sign': 7,
  'server-node': 8,
};

export interface MorphEntropy {
  // Signed lateral camera offset at the arc peak, world units.
  bow: number;
  // Signed tangential share of the ring push (0 is a pure radial push).
  swirl: number;
  // Multiplier on morph.silhouettePull.
  pullScale: number;
}

export const NEUTRAL_ENTROPY: MorphEntropy = { bow: 0, swirl: 0, pullScale: 1 };

let seed: number | null = null;
let seedFromUrl = false;
let enabled = true;
const counters = new Map<EntropyChannel, number>();

// splitmix32 finalizer over (seed, channel, index). Pure and total.
export function hash32(s: number, channel: number, index: number): number {
  let z = (s ^ Math.imul(channel, 0x9e3779b9) ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}

// Guestbook (DESIGN 6.14): a fresh 32-bit seed per open and per sign.
// Source: crypto.getRandomValues, one new value per call. With ?seed in
// the URL the value is hash32(sessionSeed, channel, n) instead, so a
// seeded run replays exactly. Never Math.random.
export function freshSeed(channel: 'guestbook-open' | 'guestbook-sign'): number {
  entropySeed();
  const n = counters.get(channel) ?? 0;
  counters.set(channel, n + 1);
  publish();
  if (!seedFromUrl && typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  }
  return hash32(entropySeed(), CHANNEL_ID[channel], n);
}

// Server node groups (DESIGN 6.15, 1.8.0): the n-th group's seed is
// hash32(sessionSeed, server-node, n), so ?seed replays the scene.
export function serverNodeSeed(n: number): number {
  return hash32(entropySeed(), CHANNEL_ID['server-node'], n);
}

// Pure draw in [0, 1) for a given seed, channel, and index.
export function drawAt(s: number, channel: EntropyChannel, index: number): number {
  return hash32(s, CHANNEL_ID[channel], index) / 4294967296;
}

function initialSeed(): number {
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get(T.entropy.seedParam);
    if (q !== null && /^\d{1,10}$/.test(q)) {
      seedFromUrl = true;
      return Number(q) >>> 0;
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
    }
  }
  return T.world.seed >>> 0;
}

export function entropySeed(): number {
  if (seed === null) seed = initialSeed();
  return seed;
}

// Test and replay hook: set the seed and restart every channel.
export function resetEntropy(next?: number): void {
  seed = next === undefined ? initialSeed() : next >>> 0;
  counters.clear();
  publish();
}

export function setEntropyEnabled(on: boolean): void {
  enabled = on;
  publish();
}

export function entropyEnabled(): boolean {
  return enabled;
}

// Next draw on a channel, in [0, 1). 0.5 when entropy is disabled.
export function unit(channel: EntropyChannel): number {
  const n = counters.get(channel) ?? 0;
  counters.set(channel, n + 1);
  publish();
  if (!enabled) return 0.5;
  return drawAt(entropySeed(), channel, n);
}

// Next draw on a channel, in [-1, 1). 0 when entropy is disabled.
export function signed(channel: EntropyChannel): number {
  return unit(channel) * 2 - 1;
}

function sceneRanges(layout: LayoutId): { bowWorld: number; swirl: number } {
  return T.entropy.scene[layout];
}

// Per-morph parameters, keyed by the destination layout so each page
// keeps its signature: server arrives rigid (Lockstep, both ranges 0),
// LeafLink moderate, SideQuests and the scatter layout widest.
export function morphEntropy(to: LayoutId): MorphEntropy {
  const r = sceneRanges(to);
  // "+ 0" folds a negative zero (signed draw times a zero range) to 0.
  const bow = signed('morph-bow') * r.bowWorld + 0;
  const swirl = signed('morph-swirl') * r.swirl + 0;
  const [lo, hi] = T.entropy.pullScale;
  const pullScale = lo + (hi - lo) * unit('morph-pull');
  return { bow, swirl, pullScale };
}

function publish(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as { __entropy?: unknown }).__entropy = {
    seed: seed ?? null,
    enabled,
    counters: Object.fromEntries(counters),
  };
}
