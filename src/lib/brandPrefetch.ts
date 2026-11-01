// P-ASSET-3: prefetch brand assets only after the first lane-field
// frame plus idle. Nothing brand related is requested before that
// point, and no preload link for brand assets exists anywhere on
// the server route. This guards the server route first painted
// field frame: brand bytes must never delay it.
//
// Sequence: main.tsx starts the lane field on idle; the field
// dispatches lanefield-ready with the field instance; the first
// onFrame callback marks the first painted field frame; an idle
// callback (with a timeout fallback) then fetches the brand
// manifest and warms the browser cache for the hero files with
// plain image loads. The hero component itself (W6) reads the
// same manifest for its markup; this module only warms the cache.
//
// Under reduced motion only PNG files are prefetched, since the
// animated GIF is never shown in that mode.
type FrameSource = {
  onFrame: (cb: () => void) => () => void;
};

type BrandWindow = Window & {
  __brandPrefetchStarted?: boolean;
  __brandPrefetched?: string[];
  requestIdleCallback?: (
    cb: () => void,
    opts?: { timeout: number },
  ) => number;
};

const PREFETCH_IDLE_TIMEOUT = 2000;

async function prefetch(): Promise<void> {
  const w = window as BrandWindow;
  if (w.__brandPrefetched) return;
  try {
    const res = await fetch('/brand/manifest.json');
    if (!res.ok) return;
    const manifest = (await res.json()) as { prefetch?: string[] };
    const files = Array.isArray(manifest.prefetch) ? manifest.prefetch : [];
    const reduced = document.documentElement.classList.contains(
      'reduced-motion',
    );
    const wanted = reduced
      ? files.filter((f) => f.endsWith('.png'))
      : files;
    const done: string[] = [];
    for (const file of wanted) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `/brand/${file}`;
      done.push(file);
    }
    w.__brandPrefetched = done;
  } catch {
    // Prefetch must never break the page; a failed warm cache just
    // means the hero loads on demand in W6.
  }
}

function schedulePrefetch(): void {
  const w = window as BrandWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(
      () => {
        void prefetch();
      },
      { timeout: PREFETCH_IDLE_TIMEOUT },
    );
  } else {
    window.setTimeout(() => {
      void prefetch();
    }, PREFETCH_IDLE_TIMEOUT);
  }
}

export function initBrandPrefetch(): void {
  if (typeof window === 'undefined') return;
  const w = window as BrandWindow;
  if (w.__brandPrefetchStarted) return;
  w.__brandPrefetchStarted = true;
  window.addEventListener(
    'lanefield-ready',
    (ev: Event) => {
      const detail = (ev as CustomEvent).detail as FrameSource | null;
      if (!detail || typeof detail.onFrame !== 'function') return;
      const off = detail.onFrame(() => {
        off();
        schedulePrefetch();
      });
    },
    { once: true },
  );
}
