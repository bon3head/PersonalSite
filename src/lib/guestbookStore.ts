// Guestbook storage (DESIGN 6.14 Storage and Shared marks, 1.10.0).
// Decided by Justin, 2026-11-15: marks are shared and auto-publish.
// storeSignature keeps the mark in this browser first (the visitor's
// own pin is instant); publishSignature then sends it to the function,
// which files it for the next deploy. readShared reads the published
// marks the build wrote to guestbook.shared.file.
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

// How the shared copy went (DESIGN 6.14 Storage): each maps to a note.
export type PublishResult = 'public' | 'held' | 'limit' | 'offline';

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

// The function's answer (api/sign.js) -> one of the four notes. The
// honeypot and fill time are the function's bot friction (6.14).
export async function publishSignature(sig: Signature, extra: { hp: string; fillMs: number }): Promise<PublishResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), T.guestbook.shared.timeoutMs);
  try {
    const res = await fetch(T.guestbook.shared.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sig, hp: extra.hp, fillMs: Math.round(extra.fillMs) }),
      signal: ctl.signal,
      credentials: 'omit',
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; reason?: string } | null;
    if (res.ok && body?.ok) return 'public';
    if (body?.reason === 'held' || body?.reason === 'empty') return 'held';
    if (body?.reason === 'limit') return 'limit';
    return 'offline';
  } catch {
    return 'offline';
  } finally {
    clearTimeout(timer);
  }
}

function isSignature(x: unknown): x is Signature {
  const s = x as Signature;
  return !!s && typeof s.name === 'string' && typeof s.line === 'string' && typeof s.seed === 'number' && typeof s.at === 'string';
}

export interface SharedMarks {
  count: number;
  marks: Signature[];
}

// The published marks, read once per page load. Missing file, bad
// JSON or no network: none, and the sheet shows the local ledger.
let shared: Promise<SharedMarks> | null = null;
export function readShared(): Promise<SharedMarks> {
  if (!shared) {
    shared = fetch(T.guestbook.shared.file, { cache: 'no-cache', credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        const list = (d as { marks?: unknown })?.marks;
        const marks = Array.isArray(list) ? list.filter(isSignature) : [];
        return { count: marks.length, marks };
      })
      .catch(() => ({ count: 0, marks: [] }));
  }
  return shared;
}

// This browser's marks merged with the shared ones by seed (a mark the
// visitor signed shows once, as theirs), newest first.
export function mergeMarks(own: readonly Signature[], others: readonly Signature[]): Signature[] {
  const seeds = new Set(own.map((s) => s.seed));
  const rest = others.filter((s) => !seeds.has(s.seed));
  return [...own, ...rest].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
