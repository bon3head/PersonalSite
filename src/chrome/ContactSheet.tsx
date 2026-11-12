// ContactSheet (S04 section 7.2): Astryx BottomSheet, purpose info,
// height hug, scrim on, label from S09, controlled by router state.
// The address is selectable text; the copy button uses CopyConfirm
// (copyText plus toast, Range selection on failure); the mail button
// is a secondary Button rendered as a mailto link; the resume button
// opens public/resume.pdf in a new tab (C-CON-RESUME).
import type { CSSProperties, JSX, RefObject } from 'react';
import { useRef } from 'react';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Link } from '@astryxdesign/core/Link';
import { C } from '../copy';
import { T } from '../tokens.generated';
import { useCopyConfirm } from './CopyConfirm';
import { useToastHostBridge } from './toastHostBridge';

export interface ContactSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocusRef: RefObject<HTMLElement | null>;
  // Opens the guestbook (DESIGN 6.14) in place of this sheet.
  onLeaveMark?: () => void;
}

export default function ContactSheet(props: ContactSheetProps): JSX.Element {
  const addressRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const { copyEmail } = useCopyConfirm();
  useToastHostBridge(props.isOpen, innerRef);
  const innerStyle = {
    '--jp-sheet-max': `${T.chrome.sheetMaxWidthPx}px`,
  } as CSSProperties;
  return (
    <BottomSheet
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      label={C['C-CON-LABEL']}
      purpose="info"
      height="hug"
      hasScrim
      finalFocusRef={props.finalFocusRef}
    >
      <div className="jp-sheet-inner" style={innerStyle} ref={innerRef}>
        <h2>{C['C-CON-H']}</h2>
        <p>
          <span ref={addressRef} className="jp-contact-email">
            {C['C-CON-EMAIL']}
          </span>
        </p>
        <div className="jp-sheet-actions">
          <Button
            variant="primary"
            label={C['C-CON-COPY']}
            onClick={() => void copyEmail(C['C-CON-EMAIL'], addressRef.current)}
          />
          <Button
            variant="secondary"
            label={C['C-CON-MAIL']}
            href={`mailto:${C['C-CON-EMAIL']}`}
          />
          <Button
            variant="secondary"
            label={C['C-CON-RESUME'].label}
            href={C['C-CON-RESUME'].href}
            target="_blank"
            rel="noopener"
          />
          {props.onLeaveMark && (
            <Button
              variant="secondary"
              label={C['C-CON-GB']}
              onClick={props.onLeaveMark}
            />
          )}
        </div>
        <div className="jp-sheet-links">
          <Link href={C['C-CON-LINK-LI'].href} isExternalLink>
            {C['C-CON-LINK-LI'].label}
          </Link>
        </div>
      </div>
    </BottomSheet>
  );
}
