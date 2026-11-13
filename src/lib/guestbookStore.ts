// Guestbook storage (DESIGN 6.14). Decided by Justin, 2026-11-10:
// browser-local only. This module keeps signatures in this browser
// and the sheet says so (C-GB-LOCAL).
//
// storeSignature is the single hook. A shared store, if ever wanted,
// replaces its body in its own change; the sheet only awaits it.
import { T } from '../tokens.generated';
import { safeStorage } from './safeStorage';

// Fired on window after a signature is stored, so the pins layer
// (DESIGN 6.14 Pins) redraws from the ledger.
export const SIGNATURES_EVENT = 'jp:signatures';

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
  window.dispatchEvent(new Event(SIGNATURES_EVENT));
  return { ok, where: 'browser' };
}
