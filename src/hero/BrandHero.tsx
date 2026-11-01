// P-HERO-1, P-HERO-2, P-HERO-3: the project hero mark (DESIGN
// sections 3.5, 6.8, 9). One data-brand-mark element per project
// route, none on server or whoami: App renders this component only
// for leaflink and sidequests with no sheet open, and the attribute
// sits on the single wrapper element, never on the img, so the
// count query in T-HERO-1 sees exactly one.
//
// Markup: a picture element. The source media query points at the
// first-frame PNG under reduced motion, and the img points at the
// animated GIF (SideQuests) or the logo PNG (LeafLink, whose
// animated candidate was not shipped by W3). Explicit width and
// height are the displayed size from heroGeometry, and
// decoding is async. The hero is a DOM plane in front of the lane
// field, not a second lane draw call and not a second WebGL scene:
// it never touches the renderer, it only calls lanefield.setParams
// for the descriptor registration and the tap ripple ring strength.
//
// Fallback chain (each level tested in T-HERO-5):
// F0: the GIF blob size matches the manifest bytes, img.decode()
// resolves within brand.decodeTimeoutMs, and the natural size
// matches the manifest dimensions, so the animated GIF shows.
// F1: any of those checks fails, so the first-frame PNG shows,
// static, after its own decode and size check.
// F2: the PNG also fails, so a text mark shows: the project name
// in Commit Mono 700, signal color, sentence case, centered.
// F3: no lanefield at all (WebGL unavailable, or ?world=0 in tests),
// so the same F0, F1, or F2 image shows without deflection: this
// component never requires the field, it only uses it when present.
//
// Manifest consumption (the W3 open choice, decided here): fetch
// /brand/manifest.json at hero mount. A build-time import of a
// public/ file is not a module-graph import: public files are
// copied verbatim, so an import would bundle a second copy that
// can drift from the shipped files. The runtime fetch reads the
// same manifest the engine mask load and the P-ASSET-3 prefetch
// read, and the prefetch already warmed the cache after the first
// field frame, so the mount fetch hits that cache. If the manifest
// fetch itself fails, there is no trustworthy file name, so the
// hero goes straight to F2 rather than guessing a hash-named file.
//
// Reduced motion: a matchMedia listener forces the static PNG at
// runtime even if picture does not re-evaluate, and freezes all
// motion (static PNG, identity transform): the rAF motion loop
// never starts, and tilt and ripple are no-ops.
//
// Placement: measured DOM rects (name clear zone, readout, keymap,
// marker tap targets) through heroGeometry.placeHero, recomputed
// on mount, on resize, and after the readout entrance settles, so
// the rect avoids every zone on the measured page, not on an
// assumed layout. The descriptor anchor is world geometry for the
// ring and silhouette, not the DOM position: the DOM position is
// clearance-driven, because on phones the anchor projection falls
// inside the readout band, which the placement rule forbids.
//
// Alt text (approved, from the manifest): SideQuests, 8 words;
// LeafLink, 7 words. Both are the project name plus what the mark
// depicts, 12 words or fewer, never starting with "image of".
// The same strings drive the F2 text mark's project name through
// the copy module, so no new copy is introduced here.
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { T } from '../tokens.generated';
import { C } from '../copy';
import { descriptorForLayout } from '../motion/hero-descriptors';
import { applyDescriptorToParams } from '../motion/hero-descriptors';
import type { Lanefield } from '../world/types';
import {
  heroDisplayedSize,
  heroMotionMargin,
  placeHero,
  heroBeatScaleAt,
  heroWanderOffsetAt,
  type HeroProject,
  type PlacedRect,
  type Rect,
} from './heroGeometry';
import './hero.css';

type Stage = 'loading' | 'gif' | 'png' | 'text';

interface ManifestEntry {
  file: string;
  width: number;
  height: number;
  bytes: number;
  alt: string;
}

interface Manifest {
  heroes: {
    sidequests: { gif: ManifestEntry; frame0: ManifestEntry };
    leaflink: { png: ManifestEntry };
  };
  budgets: { decodeTimeoutMs: number };
}

const PROJECT_NAME: Record<HeroProject, string> = {
  leaflink: C['C-LL-H1'],
  sidequests: C['C-SQ-H1'],
};

function rectOf(el: Element | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

async function decodeWithTimeout(img: HTMLImageElement, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      img.decode(),
      new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new Error('decode timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export default function BrandHero(props: {
  project: HeroProject;
  lanefield: Lanefield | null;
}): JSX.Element {
  const { project, lanefield } = props;
  const [stage, setStage] = useState<Stage>('loading');
  const [entry, setEntry] = useState<{
    gif: ManifestEntry | null;
    png: ManifestEntry;
    alt: string;
  } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<PlacedRect | null>(null);
  const [reduced, setReduced] = useState<boolean>(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const descriptorRef = useRef<ReturnType<typeof descriptorForLayout> | null>(null);
  const entryRef = useRef<typeof entry>(null);
  const placementRef = useRef<PlacedRect | null>(null);
  entryRef.current = entry;
  const rippleRef = useRef<{ startMs: number } | null>(null);
  const tiltRef = useRef<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const downRef = useRef<{ x: number; y: number } | null>(null);

  // Reduced-motion listener.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (): void => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Descriptor registration through the P-LF-4b setParams path.
  // Ring and silhouette center and radius come from the descriptor;
  // strengths stay at rest (zero), so registration alone draws
  // nothing new: the ring only appears during a morph or a ripple.
  useEffect(() => {
    const desc = descriptorForLayout(project);
    descriptorRef.current = desc;
    if (lanefield) {
      try {
        lanefield.setParams(applyDescriptorToParams(lanefield.getParams(), desc));
      } catch {
        // Registration must never break the hero: the mark still
        // renders, and the engine keeps its own params.
      }
    }
  }, [project, lanefield]);

  // Asset load: manifest fetch, then the F0, F1, F2 chain.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const timeoutMs = T.brand.decodeTimeoutMs;
    async function loadPng(png: ManifestEntry): Promise<boolean> {
      try {
        const done = (async (): Promise<boolean> => {
          const img = await loadImage(`/brand/${png.file}`);
          await decodeWithTimeout(img, timeoutMs);
          return img.naturalWidth === png.width && img.naturalHeight === png.height;
        })();
        const raced = await Promise.race([
          done,
          new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), timeoutMs);
          }),
        ]);
        return raced;
      } catch {
        return false;
      }
    }
    async function run(): Promise<void> {
      let manifest: Manifest;
      try {
        const res = await fetch('/brand/manifest.json');
        if (!res.ok) throw new Error('manifest fetch failed');
        manifest = (await res.json()) as Manifest;
      } catch {
        if (!cancelled) setStage('text');
        return;
      }
      if (cancelled) return;
      const png =
        project === 'sidequests'
          ? manifest.heroes.sidequests.frame0
          : manifest.heroes.leaflink.png;
      const gif = project === 'sidequests' ? manifest.heroes.sidequests.gif : null;
      const alt = project === 'sidequests'
        ? manifest.heroes.sidequests.gif.alt
        : manifest.heroes.leaflink.png.alt;
      setEntry({ gif, png, alt });
      if (reduced) {
        if (await loadPng(png)) {
          if (!cancelled) setStage('png');
        } else if (!cancelled) {
          setStage('text');
        }
        return;
      }
      if (gif) {
        // The whole GIF attempt races the decode timeout: a stalled
        // fetch must fall to F1 at the timeout, not when the fetch
        // eventually resolves. The attempt returns its object URL
        // instead of setting state, so a late winner after the
        // timeout cannot promote a stalled GIF to F0.
        const attempt = (async (): Promise<string | null> => {
          try {
            const res = await fetch(`/brand/${gif.file}`);
            if (!res.ok) return null;
            const blob = await res.blob();
            // Manifest size check: a truncated GIF has fewer bytes
            // than the manifest records, so it fails here even if a
            // decoder would accept its first frame.
            if (blob.size !== gif.bytes) return null;
            const img = await loadImage(URL.createObjectURL(blob));
            await decodeWithTimeout(img, timeoutMs);
            if (img.naturalWidth !== gif.width || img.naturalHeight !== gif.height) {
              URL.revokeObjectURL(img.src);
              return null;
            }
            return img.src;
          } catch {
            return null;
          }
        })();
        const raced = await Promise.race([
          attempt.then((url) => ({ url, timedOut: false })),
          new Promise<{ url: null; timedOut: true }>((resolve) => {
            setTimeout(() => resolve({ url: null, timedOut: true }), timeoutMs);
          }),
        ]);
        if (raced.url && !cancelled) {
          objectUrl = raced.url;
          setGifUrl(objectUrl);
          setStage('gif');
          return;
        }
        // Timeout or failure: fall through to F1. A late attempt
        // resolution is ignored because only the race winner sets
        // state, and its URL is never assigned to objectUrl here.
        // A late URL is revoked here so it does not leak.
        void attempt.then((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      }
      if (cancelled) return;
      if (await loadPng(png)) {
        if (!cancelled) setStage('png');
      } else if (!cancelled) {
        setStage('text');
      }
    }
    void run();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [project, reduced]);

  // Placement from measured rects, recomputed on mount, resize,
  // and after the readout entrance settles. Marker twins move
  // after the world starts (their rects sit at the origin until
  // the first field frame positions them), so placement is also
  // re-tracked on every field frame below: a twin that drifts
  // into the hero band pushes the hero to a clear position, and
  // the 4 px hysteresis keeps bob from jittering the hero.
  const computePlacement = (): PlacedRect | null => {
    const currentEntry = entryRef.current;
    if (!currentEntry) return null;
    const headroom = project === 'leaflink' ? T.hero.beatScale : 1;
    const size = heroDisplayedSize(window.innerWidth, window.innerHeight, currentEntry.png.width, currentEntry.png.height, headroom);
    const blockers: Rect[] = [];
    const wordmark = document.querySelector('.jp-wordmark') as HTMLElement | null;
    if (wordmark && !wordmark.hidden && getComputedStyle(wordmark).display !== 'none') {
      const r = rectOf(wordmark);
      if (r) {
        blockers.push({
          left: r.left - T.zone.name.padPx,
          top: r.top - T.zone.name.padPx,
          right: r.right + T.zone.name.padPx,
          bottom: r.bottom + T.zone.name.padPx,
        });
      }
    }
    const readout = rectOf(document.querySelector('.jp-readout'));
    if (readout) blockers.push(readout);
    const keymap = rectOf(document.querySelector('.jp-keymap'));
    if (keymap) blockers.push(keymap);
    // Marker tap targets: the SideQuests twins carry aria-pressed.
    // The hero never overlaps one, so a logo tap (ripple) and a
    // marker tap (walk) can never conflict.
    const twins = document.querySelectorAll('button[aria-pressed]');
    for (let i = 0; i < twins.length; i++) {
      const r = rectOf(twins[i]);
      if (r) blockers.push(r);
    }
    return placeHero(
      window.innerWidth,
      window.innerHeight,
      size.width,
      size.height,
      blockers,
      heroMotionMargin(project),
    );
  };

  useEffect(() => {
    placementRef.current = placement;
  }, [placement]);

  useEffect(() => {
    if (!entry) return;
    const compute = (): void => {
      const next = computePlacement();
      if (next) setPlacement(next);
    };
    compute();
    const timer = setTimeout(compute, 1500);
    window.addEventListener('resize', compute);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, project]);

  useEffect(() => {
    if (!lanefield) return;
    const off = lanefield.onFrame(() => {
      const next = computePlacement();
      const current = placementRef.current;
      if (!next) return;
      if (
        !current ||
        Math.abs(next.left - current.left) > 4 ||
        Math.abs(next.top - current.top) > 4
      ) {
        setPlacement(next);
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanefield]);

  // Passive motion, tilt, and ripple, all through one rAF loop
  // that writes the wrapper transform directly (no React state per
  // frame). Reduced motion never starts the loop: the transform
  // stays identity. Ripple writes the ring strength uniform through
  // setParams: 150 ms out (motion.ms.fast) to the morph peak
  // (half the descriptor ring radius), then 700 ms settle
  // (motion.ms.travel) back to zero.
  useEffect(() => {
    if (reduced) {
      const el = wrapRef.current;
      if (el) el.style.transform = '';
      return;
    }
    let raf = 0;
    let stopped = false;
    const frame = (nowMs: number): void => {
      if (stopped) return;
      const el = wrapRef.current;
      if (el) {
        let scale = 1;
        let dx = 0;
        let dy = 0;
        if (project === 'leaflink') {
          scale = heroBeatScaleAt(nowMs);
        } else {
          const w = heroWanderOffsetAt(nowMs);
          dx = w.dx;
          dy = w.dy;
        }
        const { rx, ry } = tiltRef.current;
        el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      const ripple = rippleRef.current;
      if (ripple && lanefield && descriptorRef.current) {
        const elapsed = nowMs - ripple.startMs;
        const outMs = T.motion.ms.fast;
        const settleMs = T.motion.ms.travel;
        const peak = descriptorRef.current.ringRadius * 0.5;
        if (elapsed >= outMs + settleMs) {
          rippleRef.current = null;
          try {
            lanefield.setParams({ ringStrength: 0 });
          } catch {
            // Ripple cleanup must never break the page.
          }
          (window as unknown as { __heroRipple?: { strength: number } }).__heroRipple = { strength: 0 };
        } else if (elapsed < outMs) {
          const strength = peak * (elapsed / outMs);
          try {
            lanefield.setParams({
              ringCenter: [...descriptorRef.current.anchor],
              ringRadius: descriptorRef.current.ringRadius,
              ringStrength: strength,
            });
          } catch {
            // Ripple write failure is not a hero failure.
          }
          (window as unknown as { __heroRipple?: { strength: number } }).__heroRipple = { strength };
        } else {
          const strength = peak * (1 - (elapsed - outMs) / settleMs);
          try {
            lanefield.setParams({ ringStrength: strength });
          } catch {
            // Ripple write failure is not a hero failure.
          }
          (window as unknown as { __heroRipple?: { strength: number } }).__heroRipple = { strength };
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [reduced, project, lanefield]);

  const onPointerMove = (e: React.PointerEvent): void => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    const nx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * T.hero.tiltMaxDeg;
    const ny = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * T.hero.tiltMaxDeg;
    const clamp = (v: number): number => Math.max(-T.hero.tiltMaxDeg, Math.min(T.hero.tiltMaxDeg, v));
    tiltRef.current = { rx: clamp(-ny), ry: clamp(nx) };
  };

  const onPointerDown = (e: React.PointerEvent): void => {
    downRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent): void => {
    const down = downRef.current;
    downRef.current = null;
    if (reduced || !down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > 10) return;
    rippleRef.current = { startMs: performance.now() };
  };

  const onPointerLeave = (): void => {
    tiltRef.current = { rx: 0, ry: 0 };
  };

  const style: CSSProperties = placement
    ? {
        left: placement.left,
        top: placement.top,
        width: placement.width,
        height: placement.height,
      }
    : { visibility: 'hidden' };

  const pngSrc = entry ? `/brand/${entry.png.file}` : '';
  const imgSrc = stage === 'gif' && gifUrl ? gifUrl : pngSrc;
  const imgW = placement ? Math.round(placement.width) : undefined;
  const imgH = placement ? Math.round(placement.height) : undefined;

  return (
    <div
      ref={wrapRef}
      className="jp-hero"
      data-brand-mark={project}
      style={style}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      {stage === 'text' ? (
        <div className="jp-hero-text" role="img" aria-label={entry?.alt ?? PROJECT_NAME[project]}>
          {PROJECT_NAME[project]}
        </div>
      ) : stage === 'loading' || !entry ? null : (
        <picture>
          <source media="(prefers-reduced-motion: reduce)" srcSet={pngSrc} />
          <img
            src={imgSrc}
            alt={entry.alt}
            width={imgW}
            height={imgH}
            decoding="async"
            draggable={false}
          />
        </picture>
      )}
    </div>
  );
}
