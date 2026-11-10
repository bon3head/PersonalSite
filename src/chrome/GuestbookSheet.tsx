// GuestbookSheet (DESIGN 6.14). A sheet in the router's sense (hash
// #guestbook over the current scene), not a page and not a card: the
// lane field is the surface. Two prompt lines with no labels above
// them, a pill to lock in, and a seed readout. The 3D motion lives in
// the field (src/motion/guestbook.ts); this panel moves in depth on
// translateZ under perspective, never on opacity.
//
// Storage is browser-local only (Justin, 2026-11-10). storeSignature
// (src/lib/guestbookStore) is the single hook, and the sheet says so.
import type { FormEvent, JSX, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { C } from '../copy';
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import { createGuestbookDirector, type GuestbookDirector, type GuestbookPanelSource } from '../motion/guestbook';
import { makeSignature, readSignatures, storeSignature, type Signature } from '../lib/guestbookStore';

export interface GuestbookSheetProps {
  isOpen: boolean;
  onRequestClose: () => void;
  field: Lanefield | null;
  finalFocusRef: RefObject<HTMLElement | null>;
}

type Stage = 'write' | 'locking' | 'done';

export default function GuestbookSheet(props: GuestbookSheetProps): JSX.Element | null {
  const { isOpen, field } = props;
  // mounted: rendered at all (stays true through the exit move).
  // shown: the panel sits at depth 0 (false is pushed back in depth).
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);
  const [stage, setStage] = useState<Stage>('write');
  const [name, setName] = useState('');
  const [line, setLine] = useState('');
  const [seedHex, setSeedHex] = useState('');
  const [ledger, setLedger] = useState<Signature[]>([]);
  const glyphRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const lineRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef<HTMLParagraphElement | null>(null);
  const directorRef = useRef<GuestbookDirector | null>(null);
  const directorFieldRef = useRef<Lanefield | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const liftRef = useRef(0);
  const panelSrc = (): GuestbookPanelSource | null =>
    panelRef.current ? { panel: panelRef.current, lift: () => liftRef.current } : null;

  // Keyboard (DESIGN 6.14, 1.6.0): the visual viewport tells how much of
  // the layout viewport the keyboard covers; the panel lifts by exactly
  // that on translateY, and the director re-frames the well above it.
  useEffect(() => {
    if (!mounted) return;
    const vv = window.visualViewport;
    const update = (): void => {
      const root = rootRef.current;
      if (!root) return;
      const panel = panelRef.current;
      const covered = vv ? root.clientHeight - (vv.offsetTop + vv.height) : 0;
      // The panel's resting gap to the layout bottom (keymap plus gutter);
      // over the keyboard it keeps one gutter (the panel's own inset).
      const restGap = panel ? root.clientHeight - (panel.offsetTop + panel.offsetHeight) : 0;
      const gutter = panel ? parseFloat(getComputedStyle(panel).left) || 0 : 0;
      const lift = covered > 0 ? Math.max(0, Math.round(covered + gutter - restGap)) : 0;
      if (lift !== liftRef.current) {
        liftRef.current = lift;
        root.style.setProperty('--jp-gb-lift', `${lift}px`);
      }
      directorRef.current?.reframe();
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      // A remount starts from no lift, so its first update always writes.
      liftRef.current = 0;
    };
  }, [mounted]);

  // Open and close. The director is created per open so it binds the
  // field as it is now (the field may arrive after first paint).
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    const director = directorRef.current;
    if (!director) {
      setMounted(false);
      return;
    }
    setShown(false);
    let alive = true;
    void director.close().then(() => {
      document.documentElement.removeAttribute('data-gb');
      if (!alive) return;
      director.dispose();
      if (directorRef.current === director) directorRef.current = null;
      setMounted(false);
      props.finalFocusRef.current?.focus();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || !isOpen) return;
    const prev = directorRef.current;
    if (prev && directorFieldRef.current === field) return;
    if (prev) {
      // The field arrived while the sheet was open (deep link before
      // the engine started): rebind the director to it, keep the text.
      prev.dispose();
      const director = createGuestbookDirector(field, glyphRef.current, panelSrc());
      directorRef.current = director;
      directorFieldRef.current = field;
      director.onReadout(setSeedHex);
      director.open();
      if (stage === 'write') director.setText(name);
      if (!panelRef.current?.contains(document.activeElement)) nameRef.current?.focus();
      return;
    }
    const director = createGuestbookDirector(field, glyphRef.current, panelSrc());
    directorRef.current = director;
    directorFieldRef.current = field;
    director.onReadout(setSeedHex);
    setStage('write');
    setName('');
    setLine('');
    setLedger(readSignatures());
    document.documentElement.setAttribute('data-gb', 'open');
    director.open();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isOpen, field]);

  // The panel's height changes with the stage, and it reaches its
  // resting box once shown: re-frame the well and the dim (reduced
  // motion has no loop, so this is its only render of the final box).
  useEffect(() => {
    directorRef.current?.reframe();
  }, [stage, ledger, shown]);

  // One frame after mount the panel moves from depth to 0.
  useEffect(() => {
    if (!mounted || !isOpen) return;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted, isOpen]);

  // The panel is visibility hidden until shown; focus the prompt then.
  useEffect(() => {
    if (!shown || !isOpen) return;
    const root = panelRef.current;
    if (root && !root.contains(document.activeElement)) (nameRef.current ?? doneRef.current)?.focus();
  }, [shown, isOpen]);

  // Modal: focus that lands outside the sheet (the Contact sheet
  // returning its focus as it closes) comes back to the prompt.
  useEffect(() => {
    if (!mounted || !isOpen) return;
    const onFocusIn = (e: FocusEvent): void => {
      const root = panelRef.current?.closest('.jp-gb');
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        (nameRef.current ?? doneRef.current)?.focus();
      }
    };
    // Escape closes from anywhere, focus inside the sheet or not.
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      props.onRequestClose();
    };
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isOpen]);

  useEffect(
    () => () => {
      document.documentElement.removeAttribute('data-gb');
      directorRef.current?.dispose();
      directorRef.current = null;
    },
    [],
  );

  if (!mounted) return null;

  function onName(value: string): void {
    setName(value);
    directorRef.current?.setText(value);
  }

  async function lockIn(e: FormEvent): Promise<void> {
    e.preventDefault();
    const director = directorRef.current;
    if (!director || stage !== 'write') return;
    if (!name.trim()) {
      nameRef.current?.focus();
      return;
    }
    setStage('locking');
    const seed = await director.lock();
    await storeSignature(makeSignature(name, line, seed));
    setLedger(readSignatures());
    setStage('done');
    setTimeout(() => doneRef.current?.focus(), 0);
  }

  function again(): void {
    setName('');
    setLine('');
    setStage('write');
    directorRef.current?.again();
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  // Tab stays inside the sheet (aria-modal).
  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>): void {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('input:not([readonly]), button:not([disabled]), [tabindex="-1"][data-gb-focus]'),
    ).filter((el) => el.tabIndex >= 0);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const locked = stage !== 'write';

  return (
    <div
      className="jp-gb"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={C['C-GB-LABEL']}
      data-shown={shown ? 'true' : 'false'}
      onKeyDown={onKeyDown}
    >
      <div className="jp-gb-catch" aria-hidden="true" onClick={props.onRequestClose} />
      <div className="jp-gb-glyphs" aria-hidden="true" ref={glyphRef} />
      <form className="jp-gb-panel" ref={panelRef} onSubmit={(e) => void lockIn(e)} noValidate>
        {stage !== 'done' && (
          <>
            <div className="jp-gb-prompt jp-gb-prompt--name">
              <span className="jp-gb-caret" aria-hidden="true" />
              <input
                ref={nameRef}
                className="jp-gb-input jp-gb-input--name"
                aria-label={C['C-GB-NAME']}
                placeholder={C['C-GB-NAME']}
                value={name}
                maxLength={T.guestbook.nameMaxChars}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                enterKeyHint="next"
                readOnly={locked}
                onChange={(e) => onName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (name.trim()) lineRef.current?.focus();
                  }
                }}
              />
            </div>
            <div className="jp-gb-prompt jp-gb-prompt--line">
              <span className="jp-gb-caret" aria-hidden="true" />
              <input
                ref={lineRef}
                className="jp-gb-input jp-gb-input--line"
                aria-label={C['C-GB-LINE']}
                placeholder={C['C-GB-LINE']}
                value={line}
                maxLength={T.guestbook.lineMaxChars}
                autoComplete="off"
                enterKeyHint="done"
                readOnly={locked}
                onChange={(e) => setLine(e.target.value)}
              />
            </div>
            <div className="jp-gb-row">
              <button
                type="submit"
                className="jp-gb-pill jp-gb-pill--primary"
                aria-disabled={!name.trim() || locked}
              >
                <span className="jp-gb-dot" aria-hidden="true" />
                <span>{C['C-GB-LOCK']}</span>
              </button>
              <span className="jp-gb-seed">
                <span>{C['C-GB-SEED']}</span> <span className="jp-gb-seed-hex">{seedHex}</span>
              </span>
            </div>
          </>
        )}
        {stage === 'done' && (
          <>
            <p className="jp-gb-done" role="status" tabIndex={-1} data-gb-focus ref={doneRef}>
              {C['C-GB-DONE']}
            </p>
            <p className="jp-gb-note">{C['C-GB-LOCAL']}</p>
            <ul className="jp-gb-ledger" aria-label={C['C-GB-LEDGER']}>
              {ledger.map((sig) => (
                <li key={`${sig.at}-${sig.seed}`}>
                  <span className="jp-gb-ledger-name">{sig.name}</span>
                  {sig.line && <span className="jp-gb-ledger-line">{sig.line}</span>}
                </li>
              ))}
            </ul>
            <div className="jp-gb-row">
              <button type="button" className="jp-gb-pill jp-gb-pill--primary" onClick={again}>
                <span className="jp-gb-dot" aria-hidden="true" />
                <span>{C['C-GB-AGAIN']}</span>
              </button>
              <button type="button" className="jp-gb-pill" onClick={props.onRequestClose}>
                <span>{C['C-GB-CLOSE']}</span>
              </button>
              <span className="jp-gb-seed">
                <span>{C['C-GB-SEED']}</span> <span className="jp-gb-seed-hex">{seedHex}</span>
              </span>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
