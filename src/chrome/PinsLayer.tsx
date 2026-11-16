// PinsLayer (DESIGN 6.14 Pins, 1.9.0; shared marks 1.10.0). Every
// signature stored in this browser, plus the guestbook.shared.pinsShown
// newest shared marks it does not already hold, is a pin on every
// scene: a disc on a lane tip with the name beside it. Each pin is a button whose text is the name; activating it
// shows the signature's line under it (aria-expanded, aria-controls).
// The layer sits above the field and below every sheet, and hides only
// while the guestbook sheet is open. Positions, colors and link lanes
// come from the controller in src/motion/pins.ts.
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { C } from '../copy';
import type { Lanefield } from '../world/types';
import { createPinsLayer, type PinsLayer as PinsController } from '../motion/pins';
import { readShared, readSignatures, SIGNATURES_EVENT, type Signature } from '../lib/guestbookStore';
import { T } from '../tokens.generated';

export interface PinsLayerProps {
  field: Lanefield | null;
}

export default function PinsLayer({ field }: PinsLayerProps): JSX.Element | null {
  // Read after mount: the prerendered HTML has no ledger, so the first
  // client render must match it (hydration), then the pins arrive.
  const [own, setOwn] = useState<Signature[]>([]);
  const [others, setOthers] = useState<Signature[]>([]);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const ctlRef = useRef<PinsController | null>(null);

  // The ledger changes on sign (this tab) and in other tabs (storage).
  useEffect(() => {
    const reload = (): void => setOwn(readSignatures());
    reload();
    let alive = true;
    void readShared().then((s) => {
      if (alive) setOthers(s.marks);
    });
    const onStorage = (e: StorageEvent): void => {
      if (e.key === null || e.key === T.guestbook.storageKey) reload();
    };
    window.addEventListener(SIGNATURES_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener(SIGNATURES_EVENT, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!field?.guestbook || !list) return;
    const ctl = createPinsLayer(field, list);
    ctlRef.current = ctl;
    return () => {
      ctl.dispose();
      ctlRef.current = null;
    };
  }, [field]);

  // Own marks first (placed first, so the newest takes the signing
  // pin's spot), then the newest shared marks not already here.
  const ownSeeds = new Set(own.map((s) => s.seed));
  const sigs = [...own, ...others.filter((s) => !ownSeeds.has(s.seed)).slice(0, T.guestbook.shared.pinsShown)];
  const seedKey = sigs.map((s) => s.seed).join(',');

  useEffect(() => {
    ctlRef.current?.setSeeds(sigs.map((s) => s.seed));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, field]);

  if (!field?.guestbook || sigs.length === 0) return <ul className="jp-pins" ref={listRef} hidden />;

  return (
    <ul className="jp-pins" ref={listRef} aria-label={C['C-GB-LEDGER']}>
      {sigs.map((sig) => {
        const id = `${sig.at}-${sig.seed}`;
        const lineId = `jp-pin-line-${sig.seed.toString(16)}`;
        const expanded = openAt === id;
        return (
          <li key={id} className="jp-pin" data-pin>
            <span className="jp-pin-dot" aria-hidden="true" />
            <button
              type="button"
              className="jp-pin-hit"
              aria-expanded={sig.line ? expanded : undefined}
              aria-controls={sig.line ? lineId : undefined}
              onClick={() => setOpenAt(expanded ? null : id)}
            >
              <span className="jp-pin-label">{sig.name}</span>
            </button>
            {sig.line && (
              <p className="jp-pin-line" id={lineId} hidden={!expanded}>
                {sig.line}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
