// The coarse variant as a React value (polish round). Same rule as the
// camera variant (src/world/camera.ts isCoarseVariant): narrow, or a
// coarse pointer below desktop width. Readout docking of the SideQuests
// trail controls and the marker buttons both read this one hook, so
// they always agree within a render. The server snapshot is false
// (fine), and React re-renders after hydration on a phone.
import { useSyncExternalStore } from 'react';
import { T } from '../tokens.generated';

const QUERY =
  `(max-width: ${T.breakpoints.coarseOrNarrowBelowPx - 1}px), ` +
  `(pointer: coarse) and (max-width: ${T.breakpoints.desktopFromPx - 1}px)`;

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function snapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

export function useCoarse(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
