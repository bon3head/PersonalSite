// Brand manifest cache (polish round). One fetch of
// /brand/manifest.json per page, shared by the prefetch, the hero, and
// the lane field mask preload. brandManifestSync() returns the parsed
// manifest once it has arrived, so the hero can place itself
// synchronously inside the readout swap commit (DESIGN 6.7) instead of
// waiting a network turn and mounting at a provisional position.
export interface BrandManifestEntry {
  file: string;
  width: number;
  height: number;
  bytes: number;
  alt: string;
}

export interface BrandManifest {
  heroes: {
    sidequests: { gif: BrandManifestEntry; frame0: BrandManifestEntry };
    leaflink: { png: BrandManifestEntry };
  };
  budgets?: { decodeTimeoutMs: number };
  prefetch?: string[];
}

let cached: BrandManifest | null = null;
let inflight: Promise<BrandManifest | null> | null = null;

export function brandManifestSync(): BrandManifest | null {
  return cached;
}

export function loadBrandManifest(): Promise<BrandManifest | null> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/brand/manifest.json');
      if (!res.ok) return null;
      cached = (await res.json()) as BrandManifest;
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
