// Readout (S04 section 6): one component, three variants, plus the
// 404 which reuses the server variant placement. Content comes from
// S09 by ID; the variant decides placement and container. The section
// element itself is what travel manipulates (hidden, opacity,
// transform), so it keeps a stable DOM identity across scene swaps:
// App renders one Readout and changes its scene prop, never unmounts
// it mid-travel.
//
// Variant geometry values that exist only as TS tokens (no CSS var)
// are passed as --jp-ro-* custom properties via inline style; the
// stylesheet in chrome.css consumes them.
import type { CSSProperties, JSX, RefObject } from 'react';
import { Link } from '@astryxdesign/core/Link';
import { C } from '../copy';
import { T } from '../tokens.generated';
import type { SceneId } from '../router';
import LeaflinkReadout from '../scenes/leaflink';

export type ReadoutVariant = 'server' | 'leaflink' | 'sidequests' | 'notfound';

const VARIANT: Record<SceneId, ReadoutVariant> = {
  server: 'server',
  leaflink: 'leaflink',
  sidequests: 'sidequests',
  notfound: 'notfound',
};

const H1_ID: Record<SceneId, string> = {
  server: 'h-server',
  leaflink: 'h-leaflink',
  sidequests: 'h-sidequests',
  notfound: 'h-notfound',
};

export interface ReadoutProps {
  scene: SceneId;
  sectionRef: RefObject<HTMLElement | null>;
  /** Visitor offer (leaflink variant only). Undefined until wired. */
  onOffer?: () => void;
}

export default function Readout(props: ReadoutProps): JSX.Element {
  const { scene } = props;
  const variant = VARIANT[scene];
  const style = {
    '--jp-ro-width':
      variant === 'server' || variant === 'notfound'
        ? T.chrome.serverReadoutWidth
        : variant === 'leaflink'
          ? `${T.chrome.legendWidthPx}px`
          : `${T.chrome.trailheadWidthPx}px`,
    '--jp-ro-bottom-gap': T.chrome.serverReadoutBottomGap,
    '--jp-ro-top-extra':
      variant === 'sidequests'
        ? `${T.chrome.trailheadTopExtraPx}px`
        : `${T.chrome.readoutTopExtraPx}px`,
    '--jp-ro-max-height': T.chrome.coarseReadoutMaxHeight,
  } as CSSProperties;

  return (
    <section
      ref={props.sectionRef}
      className={`jp-readout jp-readout--${variant}`}
      aria-labelledby={H1_ID[scene]}
      style={style}
    >
      {scene === 'server' && (
        <>
          <h1 id={H1_ID.server}>{C['C-SRV-H1']}</h1>
          <p>{C['C-SRV-P1']}</p>
          <p>{C['C-SRV-P2']}</p>
          <p>{C['C-SRV-P3']}</p>
        </>
      )}
      {scene === 'leaflink' && (
        <LeaflinkReadout onOffer={props.onOffer ?? (() => {})} />
      )}
      {scene === 'sidequests' && (
        <div className="jp-readout-slip">
          <h1 id={H1_ID.sidequests}>{C['C-SQ-H1']}</h1>
          <p>{C['C-SQ-P1']}</p>
          <p className="jp-readout-supporting">{C['C-SQ-FACTS']}</p>
          <p className="jp-readout-supporting">{C['C-SQ-VENUE']}</p>
          <p className="jp-readout-caption">
            <span className="jp-sq-hint--coarse">{C['C-SQ-HINT'].coarse}</span>
            <span className="jp-sq-hint--fine">{C['C-SQ-HINT'].fine}</span>
          </p>
          <div className="jp-readout-links">
            <Link href={C['C-SQ-CODE'].href} isExternalLink>
              {C['C-SQ-CODE'].label}
            </Link>
          </div>
        </div>
      )}
      {scene === 'notfound' && (
        <>
          <h1 id={H1_ID.notfound}>{C['C-404-H1']}</h1>
          <p>{C['C-404-P1']}</p>
        </>
      )}
    </section>
  );
}
