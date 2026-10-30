// CopyConfirm (S04 section 7.3): the copy result toast, through
// Astryx useToast with stock anatomy and token colors. This hook
// encapsulates the copy plus toast behavior so ContactSheet stays a
// pure layout component. On copy failure the address text node is
// selected with a Range so the user can copy manually.
import { useToast } from '@astryxdesign/core';
import { C } from '../copy';
import { copyText } from '../lib/copyText';

export interface CopyConfirm {
  copyEmail: (email: string, addressEl: HTMLElement | null) => Promise<void>;
}

export function useCopyConfirm(): CopyConfirm {
  const showToast = useToast();
  async function copyEmail(email: string, addressEl: HTMLElement | null): Promise<void> {
    const ok = await copyText(email);
    if (ok) {
      showToast({ body: C['C-TOAST-OK'], type: 'info', uniqueID: 'copy' });
      return;
    }
    if (addressEl) {
      const range = document.createRange();
      range.selectNodeContents(addressEl);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    showToast({ body: C['C-TOAST-FAIL'], type: 'error', uniqueID: 'copy' });
  }
  return { copyEmail };
}
