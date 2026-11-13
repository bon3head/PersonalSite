// Mark color pool (DESIGN 6.14 Mark color, 1.8.0). A signature, and a
// server node group (6.15), takes one color from guestbook.mark.colorPool
// by its seed: pool[hash32(seed, COLOR, 0) mod pool length]. Pool entries
// are names of existing section 12 colors ("signal", "paper.text"), so no
// new hue exists. Same seed, same color.
import { T } from '../tokens.generated';
import { hash32 } from './entropy';

export type MarkRegime = keyof typeof T.guestbook.mark.colorPool;

// hash32 param id for the color draw (guestbook director P ids end at 14).
export const MARK_COLOR_PARAM = 15;

function resolve(name: string): string {
  let v: unknown = T.color;
  for (const part of name.split('.')) v = (v as Record<string, unknown>)[part];
  if (typeof v !== 'string') throw new Error(`markPool: unknown color ${name}`);
  return v;
}

export function markPoolHex(regime: MarkRegime, seed: number): string {
  const pool: readonly string[] = T.guestbook.mark.colorPool[regime];
  return resolve(pool[hash32(seed, MARK_COLOR_PARAM, 0) % pool.length]);
}

export function markPoolAll(regime: MarkRegime): string[] {
  return T.guestbook.mark.colorPool[regime].map(resolve);
}
