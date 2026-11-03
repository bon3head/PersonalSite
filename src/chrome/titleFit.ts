// Title fit sizing (S04 section 5, DESIGN section 5): a scene
// title renders at the smaller of its token size and the width its
// container allows divided by characters times the Commit Mono
// advance, measured from the loaded font. The server variant is
// skipped: its H1 is the name itself, and the wordmark is hidden
// on server, so it cannot intersect a visible name box; shrinking
// it would change the server hero for no zone benefit.
import { useLayoutEffect, type RefObject } from 'react';
import type { SceneId } from '../router';

const MIN_PX = 13;

function fitTitle(section: HTMLElement): void {
  if (section.className.includes('jp-readout--server')) return;
  const h1 = section.querySelector('h1') as HTMLElement | null;
  if (h1 === null) return;
  h1.style.fontSize = '';
  const computed = getComputedStyle(h1);
  const tokenSize = parseFloat(computed.fontSize);
  const available = h1.clientWidth;
  const text = h1.textContent ?? '';
  const chars = [...text].length;
  if (
    Number.isNaN(tokenSize) ||
    tokenSize <= 0 ||
    available <= 0 ||
    chars === 0
  ) {
    return;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  ctx.font = `${computed.fontWeight} 100px ${computed.fontFamily}`;
  const advance = ctx.measureText('0').width / 100;
  if (advance <= 0) return;
  const fit = available / (chars * advance);
  if (fit < tokenSize) {
    h1.style.fontSize = `${Math.max(fit, MIN_PX)}px`;
  }
}

export function useTitleFit(
  sectionRef: RefObject<HTMLElement | null>,
  scene: SceneId,
): void {
  // Layout effect (polish round): the title settles in the same commit
  // as the readout swap, before the hero (a later sibling) measures the
  // readout rect, so the hero never places against a pre-fit title.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (section === null) return;
    const compute = (): void => fitTitle(section);
    compute();
    if (typeof document.fonts !== 'undefined') {
      void document.fonts.ready.then(() => compute());
    }
    const observer = new ResizeObserver(() => compute());
    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionRef, scene]);
}
