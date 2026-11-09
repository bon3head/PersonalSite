// Guestbook storage (DESIGN 6.14). Where signatures are stored is an
// open decision for Justin: a JSON file in the repo, a form endpoint,
// or browser-local only. No backend exists, so this module keeps them
// in this browser and says so on the sheet (C-GB-LOCAL).
//
// storeSignature is the single hook to wire later. Whatever store is
// chosen replaces its body; the sheet only awaits its result.
import { T } from '../tokens.generated';
import { safeStorage } from './safeStorage';

export interface Signature {
  name: string;
  line: string;
  seed: number;
  at: string;
}

export interface StoreResult {
  ok: boolean;
  where: 'browser';
}

// Printable text only, trimmed, clamped to the token lengths.
function clean(text: string, max: number): string {
  return Array.from(text.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, max).join('');
}

export function readSignatures(): Signature[] {
  const raw = safeStorage.get(T.guestbook.storageKey);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (x): x is Signature =>
        !!x && typeof x.name === 'string' && typeof x.line === 'string' && typeof x.seed === 'number' && typeof x.at === 'string',
    );
  } catch {
    return [];
  }
}

export function makeSignature(name: string, line: string, seed: number): Signature {
  return {
    name: clean(name, T.guestbook.nameMaxChars),
    line: clean(line, T.guestbook.lineMaxChars),
    seed: seed >>> 0,
    at: new Date().toISOString(),
  };
}

// The storage hook. Browser-local today: newest first, at most
// guestbook.ledgerMax kept, nothing leaves the device.
export async function storeSignature(sig: Signature): Promise<StoreResult> {
  const list = [sig, ...readSignatures()].slice(0, T.guestbook.ledgerMax);
  const ok = safeStorage.set(T.guestbook.storageKey, JSON.stringify(list));
  return { ok, where: 'browser' };
}
