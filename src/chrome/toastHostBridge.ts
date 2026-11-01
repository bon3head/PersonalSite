// Toast host bridge (S04 section 7.3, DESIGN section 7): toasts
// render in the top-most open layer. The Astryx toast viewport is a
// manual popover shown at app mount, and a sheet dialog opened later
// paints above it because BottomSheet never registers a modal
// outlet, so the viewport is never rehosted. The outlet hook is
// private to the Astryx package (not exported from its package
// entry or its Layer entry), so this bridge performs the same
// rehost from repo code: while a sheet is open, the viewport host
// node moves inside that sheet dialog and its popover is shown
// again, which puts it above the dialog in top-layer order and
// inside the dialog, where it is not inert. When the sheet closes,
// the host returns to its original parent. Focus is preserved
// across the move when focus was inside the host.
import { useEffect, useRef, type RefObject } from 'react';

interface HostRecord {
  parent: Node;
  next: Node | null;
}

function findViewport(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll('[popover="manual"]'),
  ) as HTMLElement[];
  const hosted = candidates.find((el) => {
    const parent = el.parentElement;
    return parent !== null && getComputedStyle(parent).display === 'contents';
  });
  return hosted ?? candidates[0] ?? null;
}

function showViewport(viewport: HTMLElement): void {
  let showing = false;
  try {
    showing = viewport.matches(':popover-open');
  } catch {
    showing = false;
  }
  if (showing) return;
  try {
    viewport.showPopover();
  } catch {
    // Already showing or not attached; the next move shows it again.
  }
}

function moveHost(
  host: HTMLElement,
  viewport: HTMLElement,
  target: Node,
  recordRef: RefObject<HostRecord | null>,
): void {
  const active = document.activeElement as HTMLElement | null;
  const hadFocus = active !== null && host.contains(active);
  if (recordRef.current === null && host.parentNode !== null) {
    recordRef.current = { parent: host.parentNode, next: host.nextSibling };
  }
  target.appendChild(host);
  showViewport(viewport);
  if (hadFocus && active !== null) {
    active.focus({ preventScroll: true });
  }
}

function restoreHost(
  host: HTMLElement,
  viewport: HTMLElement,
  record: HostRecord,
): void {
  const active = document.activeElement as HTMLElement | null;
  const hadFocus = active !== null && host.contains(active);
  if (record.next !== null && record.next.parentNode === record.parent) {
    record.parent.insertBefore(host, record.next);
  } else {
    record.parent.appendChild(host);
  }
  showViewport(viewport);
  if (hadFocus && active !== null) {
    active.focus({ preventScroll: true });
  }
}

export function useToastHostBridge(
  isOpen: boolean,
  contentRef: RefObject<HTMLElement | null>,
): void {
  const recordRef = useRef<HostRecord | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const dialog = dialogRef.current;
      const viewport = findViewport();
      const host = viewport?.parentElement ?? null;
      if (dialog === null || viewport === null || host === null) return;
      const record = recordRef.current;
      if (record === null) return;
      if (host.parentNode !== dialog) {
        recordRef.current = null;
        return;
      }
      if (!dialog.open || !dialog.isConnected) {
        restoreHost(host, viewport, record);
        recordRef.current = null;
        return;
      }
      // BottomSheet closes its dialog after its exit animation, so
      // restore on the close event rather than on the prop flip.
      const onClose = (): void => {
        restoreHost(host, viewport, record);
        recordRef.current = null;
      };
      dialog.addEventListener('close', onClose, { once: true });
      return () => dialog.removeEventListener('close', onClose);
    }

    const dialog = contentRef.current?.closest(
      'dialog',
    ) as HTMLDialogElement | null;
    if (dialog === null) return;
    dialogRef.current = dialog;
    const viewport = findViewport();
    const host = viewport?.parentElement ?? null;
    if (viewport === null || host === null) return;
    if (host.parentNode === dialog) {
      showViewport(viewport);
      return;
    }
    moveHost(host, viewport, dialog, recordRef);
    // If the dialog was not open yet when this effect ran, show the
    // popover again once the open attribute lands.
    const observer = new MutationObserver(() => {
      if (dialog.open) showViewport(viewport);
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, [isOpen, contentRef]);
}
