// PinsLayer (DESIGN 6.14 Pins, 1.9.0). Every signature stored in this
// browser is a pin on every scene: a disc on a lane tip with the name
// beside it. Each pin is a button; activating it shows the signature's
// line under the name. The layer sits above the field and below every
// sheet, and hides only while the guestbook sheet is open. Positions,
// colors and link lanes come from the controller in src/motion/pins.ts.
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { C } from '../copy';
import type { Lanefield } from '../world/types';
import { createPinsLayer, type PinsLayer as PinsController } from '../motion/pins';
import { readSignatures, SIGNATURES_EVENT, type Signature } from '../lib/guestbookStore';
import { T } from '../tokens.generated';

export interface PinsLayerProps {
  field: Lanefield | null;
}

export default function PinsLayer({ field }: PinsLayerProps): JSX.Element | null {
  const [sigs, setSigs] = useState<Signature[]>(() => readSignatures());
  const [openAt, setOpenAt] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const ctlRef = useRef<PinsController | null>(null);

  // The ledger changes on sign (this tab) and in other tabs (storage).
  useEffect(() => {
    const reload = (): void => setSigs(readSignatures());
    const onStorage = (e: StorageEvent): void => {
      if (e.key === null || e.key === T.guestbook.storageKey) reload();
    };
    window.addEventListener(SIGNATURES_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
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

  useEffect(() => {
    ctlRef.current?.setSeeds(sigs.map((s) => s.seed));
  }, [sigs, field]);

  if (!field?.guestbook || sigs.length === 0) return <ul className="jp-pins" ref={listRef} hidden />;

  return (
    <ul className="jp-pins" ref={listRef} aria-label={C['C-GB-LEDGER']}>
      {sigs.map((sig) => {
        const id = `${sig.at}-${sig.seed}`;
        const expanded = openAt === id;
        return (
          <li key={id} className="jp-pin" data-pin hidden>
            <span className="jp-pin-dot" aria-hidden="true" />
            <button
              type="button"
              className="jp-pin-hit"
              aria-expanded={sig.line ? expanded : undefined}
              onClick={() => setOpenAt(expanded ? null : id)}
            >
              <span className="jp-pin-label">{sig.name}</span>
              {sig.line && expanded && <span className="jp-pin-line">{sig.line}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
