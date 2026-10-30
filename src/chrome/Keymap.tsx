// Keymap (S04 section 4): the only navigation. A <nav> fixed to the
// bottom edge with five items: three scene links and two panel
// buttons. Scene links are real anchors with data-route, so the
// router's document click interceptor handles them; panel buttons
// toggle sheets through the router. Each item carries a Kbd (hidden
// on coarse pointers by CSS) and a label from S09.
import type { JSX, RefObject } from 'react';
import { Kbd } from '@astryxdesign/core/Kbd';
import { C } from '../copy';
import type { SceneId, SheetId } from '../router';

export interface KeymapProps {
  scene: SceneId;
  sheet: SheetId;
  onToggleSheet: (sheet: Exclude<SheetId, null>) => void;
  whoamiButtonRef: RefObject<HTMLButtonElement | null>;
  contactButtonRef: RefObject<HTMLButtonElement | null>;
}

export default function Keymap(props: KeymapProps): JSX.Element {
  const { scene, sheet, onToggleSheet } = props;
  return (
    <nav className="jp-keymap" aria-label={C['C-KEYMAP-LABEL']}>
      <a
        href="/"
        data-route
        data-scene="server"
        aria-current={scene === 'server' ? 'page' : undefined}
        className="jp-keymap-item"
      >
        <Kbd keys={C['C-KEY-1'].key} />
        <span>{C['C-KEY-1'].label}</span>
      </a>
      <a
        href="/leaflink"
        data-route
        data-scene="leaflink"
        aria-current={scene === 'leaflink' ? 'page' : undefined}
        className="jp-keymap-item"
      >
        <Kbd keys={C['C-KEY-2'].key} />
        <span>{C['C-KEY-2'].label}</span>
      </a>
      <a
        href="/sidequests"
        data-route
        data-scene="sidequests"
        aria-current={scene === 'sidequests' ? 'page' : undefined}
        className="jp-keymap-item"
      >
        <Kbd keys={C['C-KEY-3'].key} />
        <span>{C['C-KEY-3'].label}</span>
      </a>
      <button
        type="button"
        ref={props.whoamiButtonRef}
        aria-haspopup="dialog"
        aria-expanded={sheet === 'whoami'}
        onClick={() => onToggleSheet('whoami')}
        className="jp-keymap-item"
      >
        <Kbd keys={C['C-KEY-W'].key} />
        <span>{C['C-KEY-W'].label}</span>
      </button>
      <button
        type="button"
        ref={props.contactButtonRef}
        aria-haspopup="dialog"
        aria-expanded={sheet === 'contact'}
        onClick={() => onToggleSheet('contact')}
        className="jp-keymap-item"
      >
        <Kbd keys={C['C-KEY-C'].key} />
        <span>{C['C-KEY-C'].label}</span>
      </button>
    </nav>
  );
}
