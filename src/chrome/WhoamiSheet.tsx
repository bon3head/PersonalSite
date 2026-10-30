// WhoamiSheet (S04 section 7.1): Astryx BottomSheet, purpose info,
// height hug, scrim on, label from S09, controlled by router state.
// On fine pointers the inner content is constrained to sheetMaxWidthPx
// and left-aligned with the keymap gutter (chrome.css).
import type { CSSProperties, JSX, RefObject } from 'react';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Link } from '@astryxdesign/core/Link';
import { C } from '../copy';
import { T } from '../tokens.generated';

export interface WhoamiSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocusRef: RefObject<HTMLElement | null>;
}

export default function WhoamiSheet(props: WhoamiSheetProps): JSX.Element {
  const innerStyle = {
    '--jp-sheet-max': `${T.chrome.sheetMaxWidthPx}px`,
  } as CSSProperties;
  return (
    <BottomSheet
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      label={C['C-WHO-LABEL']}
      purpose="info"
      height="hug"
      hasScrim
      finalFocusRef={props.finalFocusRef}
    >
      <div className="jp-sheet-inner" style={innerStyle}>
        <h2>{C['C-WHO-H']}</h2>
        <p>{C['C-WHO-EDU']}</p>
        <p>{C['C-WHO-PLACE']}</p>
        <ul>
          <li>{C['C-WHO-ROLE-1']}</li>
          <li>{C['C-WHO-ROLE-2']}</li>
          <li>{C['C-WHO-ROLE-3']}</li>
        </ul>
        <div className="jp-sheet-links">
          <Link href={C['C-WHO-LINK-CB'].href} isExternalLink>
            {C['C-WHO-LINK-CB'].label}
          </Link>
          <Link href={C['C-WHO-LINK-GH'].href} isExternalLink>
            {C['C-WHO-LINK-GH'].label}
          </Link>
          <Link href={C['C-WHO-LINK-LI'].href} isExternalLink>
            {C['C-WHO-LINK-LI'].label}
          </Link>
        </div>
      </div>
    </BottomSheet>
  );
}
