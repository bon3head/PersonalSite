// P-HERO-1, P-HERO-2, P-HERO-3, polish round 2 (DESIGN 1.2.0 sections
// 3.5, 6.7, 6.8, 6.12, 9): the project hero mark. One data-brand-mark
// element per project route, none on server or whoami: App renders
// this component only for leaflink and sidequests with no sheet open,
// and the attribute sits on the single wrapper element.
//
// Markup and fallback chain are unchanged from W6: a picture element
// whose reduced-motion source is the first-frame PNG and whose img is
// the animated GIF (SideQuests) or the logo PNG (LeafLink). F0 GIF,
// F1 first-frame PNG, F2 text mark (the project name), F3 no field.
//
// What changed in polish round 2, each tied to a device-run-2 repro:
//
// 1. Placement is computed once per page configuration, synchronously,
//    in a layout effect at mount (the readout swap commit). Travel now
//    conceals the readout with visibility plus inert instead of the
//    hidden attribute, so the readout rect exists at this point, and
//    the brand manifest is read from the shared cache, so no network
//    turn sits between mount and placement. There is no per-frame
//    re-track: the old re-track placed against a hidden readout
//    (LeafLink: logo centered at 198,326 for 225ms, then a 160px jump
//    to 262,166 when the readout returned) and chased moving marker
//    projections during the morph. SideQuests marker blockers come from
//    the resting projection (lanefield.projectAtRest), which does not
//    move with the camera, so the placement is the same in every frame.
//    Placement re-runs only on viewport resize.
// 2. The placed center is registered as the lane field hero anchor, so
//    the morph ring, the silhouette pull, and every pulse sit under the
//    logo on screen (the old ring sat at the camera target: 103px left
//    and 88px below the LeafLink logo, 124px above the SideQuests logo
//    inside the readout). The ring radius is clamped to the clearance
//    from the readout, name zone, and keymap, so the bulge never
//    disturbs them.
// 3. Opacity and scale follow the morph sample: the incoming mark looms
//    over motion.morph.loom, the outgoing mark recedes over
//    motion.morph.recede (complete before its DOM unmounts at the swap).
//    The old component ignored both, so marks popped in and out.
// 4. Stage grammar (src/motion/stage.ts): subject recedes the mark and
//    pans the camera so the subject sits in the mark's clear spot;
//    land sends a pulse from the subject into the mark and looms it
//    back with one land beat; beat is an event-driven heartbeat (the
//    old LeafLink beat was periodic, against DESIGN 6.3); release
//    returns the camera.
// 5. A tap on the mark does the page verb (LeafLink: drop an offer at
//    the map center; SideQuests: walk the next open trail), with an
//    immediate small pulse from the tap point as feedback, instead of a
//    decorative ripple that did nothing.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { T } from '../tokens.generated';
import { C } from '../copy';
import type { Lanefield } from '../world/types';
import {
  brandManifestSync,
  loadBrandManifest,
  type BrandManifest,
  type BrandManifestEntry,
} from '../lib/brandManifest';
import { onStage } from '../motion/stage';
import { useCoarse } from '../lib/coarse';
import { easeSignature } from '../world/tween';
import {
  clearanceFrom,
  heroBeatEnvelope,
  heroDisplayedSize,
  heroMotionMargin,
  heroWanderOffsetAt,
  placeHero,
  type HeroProject,
  type PlacedRect,
  type Rect,
  focusSpotsFor,
  nearestSpot,
  pathCrossesMark,
} from './heroGeometry';
import './hero.css';

type Stage = 'loading' | 'gif' | 'png' | 'text';

interface Entry {
  gif: BrandManifestEntry | null;
  png: BrandManifestEntry;
  alt: string;
}

const PROJECT_NAME: Record<HeroProject, string> = {
  leaflink: C['C-LL-H1'],
  sidequests: C['C-SQ-H1'],
};

function entryFor(project: HeroProject, m: BrandManifest | null): Entry | null {
  if (!m) return null;
  if (project === 'sidequests') {
    return { gif: m.heroes.sidequests.gif, png: m.heroes.sidequests.frame0, alt: m.heroes.sidequests.gif.alt };
  }
  return { gif: null, png: m.heroes.leaflink.png, alt: m.heroes.leaflink.png.alt };
}

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

// A short eased transition between two values (stage recede and loom).
interface Ramp {
  from: number;
  to: number;
  startMs: number;
  durMs: number;
}

function rampAt(r: Ramp, nowMs: number): number {
  const k = r.durMs <= 0 ? 1 : Math.min(1, Math.max(0, (nowMs - r.startMs) / r.durMs));
  return r.from + (r.to - r.from) * easeSignature(k);
}

export default function BrandHero(props: {
  project: HeroProject;
  lanefield: Lanefield | null;
  // The page verb, run on a tap on the mark (LeafLink offer at center,
  // SideQuests next open trail). Absent until the world arrives.
  onVerb?: (() => void) | null;
  // Extra blockers at rest (SideQuests marker tap targets from the
  // resting projection). Read at placement time only.
  restBlockers?: (() => Rect[]) | null;
}): JSX.Element {
  const { project, lanefield } = props;
  const [entry, setEntry] = useState<Entry | null>(() => entryFor(project, brandManifestSync()));
  const [stage, setStage] = useState<Stage>('loading');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<PlacedRect | null>(null);
  const [viewport, setViewport] = useState<[number, number]>(() =>
    typeof window === 'undefined' ? [0, 0] : [window.innerWidth, window.innerHeight],
  );
  const [reduced, setReduced] = useState<boolean>(false);
  // Camera tracking is a phone behavior: on fine viewports the whole
  // plan and map are already in view, so the S07 lean stays and the
  // camera never pans.
  const coarse = useCoarse();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<PlacedRect | null>(null);
  const focusSpotsRef = useRef<Array<[number, number]>>([]);
  const focusSpotRef = useRef<[number, number] | null>(null);
  const tiltRef = useRef<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const stageRef = useRef<{ opacity: Ramp; scale: Ramp; beats: Array<{ startMs: number; amp: number }> }>({
    opacity: { from: 1, to: 1, startMs: 0, durMs: 0 },
    scale: { from: 1, to: 1, startMs: 0, durMs: 0 },
    beats: [],
  });
  const verbRef = useRef(props.onVerb ?? null);
  verbRef.current = props.onVerb ?? null;
  const blockersRef = useRef(props.restBlockers ?? null);
  blockersRef.current = props.restBlockers ?? null;

  // Reduced-motion listener.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (): void => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Manifest: from the shared cache when it has arrived (the normal
  // case after the first field frame), otherwise one shared fetch.
  useEffect(() => {
    if (entry) return;
    let cancelled = false;
    void loadBrandManifest().then((m) => {
      if (cancelled) return;
      const e = entryFor(project, m);
      if (e) setEntry(e);
      else setStage('text');
    });
    return () => {
      cancelled = true;
    };
  }, [entry, project]);

  // Viewport changes re-place the mark (and only they do).
  useEffect(() => {
    const onResize = (): void => setViewport([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Placement, synchronous in the mount commit (see header item 1).
  useLayoutEffect(() => {
    if (!entry) return;
    const [vw, vh] = [window.innerWidth, window.innerHeight];
    // Both marks peak at the land beat, so the area cap holds at that scale.
    const headroom = T.hero.landBeatScale;
    const size = heroDisplayedSize(vw, vh, entry.png.width, entry.png.height, headroom);
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
    const zoneBlockers = [...blockers];
    for (const b of blockersRef.current?.() ?? []) blockers.push(b);
    const placed = placeHero(vw, vh, size.width, size.height, blockers, heroMotionMargin(project));
    placementRef.current = placed;
    focusSpotsRef.current = focusSpotsFor(
      { left: placed.left, top: placed.top, right: placed.left + placed.width, bottom: placed.top + placed.height },
      vw,
      vh,
      zoneBlockers,
      project,
    );
    setPlacement(placed);
    if (lanefield) {
      const cx = placed.left + placed.width / 2;
      const cy = placed.top + placed.height / 2;
      const half = Math.max(placed.width, placed.height) / 2;
      const clearance = clearanceFrom(cx, cy, zoneBlockers);
      lanefield.setHeroAnchor(project, {
        x: cx,
        y: cy,
        ringRadiusPx: Math.max(T.hero.ringPadPx, Math.min(half + T.hero.ringPadPx, clearance)),
        silhouetteRadiusPx: half,
      });
    }
  }, [entry, project, lanefield, viewport]);

  // Asset load: the F0, F1, F2 chain (unchanged from W6).
  useEffect(() => {
    if (!entry) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const timeoutMs = T.brand.decodeTimeoutMs;
    async function loadPng(png: BrandManifestEntry): Promise<boolean> {
      try {
        const done = (async (): Promise<boolean> => {
          const img = await loadImage(`/brand/${png.file}`);
          await decodeWithTimeout(img, timeoutMs);
          return img.naturalWidth === png.width && img.naturalHeight === png.height;
        })();
        return await Promise.race([
          done,
          new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), timeoutMs);
          }),
        ]);
      } catch {
        return false;
      }
    }
    async function run(e: Entry): Promise<void> {
      if (reduced || !e.gif) {
        if (await loadPng(e.png)) {
          if (!cancelled) setStage('png');
        } else if (!cancelled) {
          setStage('text');
        }
        return;
      }
      const gif = e.gif;
      // The whole GIF attempt races the decode timeout; only the race
      // winner sets state, and a late URL is revoked.
      const attempt = (async (): Promise<string | null> => {
        try {
          const res = await fetch(`/brand/${gif.file}`);
          if (!res.ok) return null;
          const blob = await res.blob();
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
        attempt.then((url) => ({ url })),
        new Promise<{ url: null }>((resolve) => {
          setTimeout(() => resolve({ url: null }), timeoutMs);
        }),
      ]);
      if (raced.url && !cancelled) {
        objectUrl = raced.url;
        setGifUrl(objectUrl);
        setStage('gif');
        return;
      }
      void attempt.then((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      if (cancelled) return;
      if (await loadPng(e.png)) {
        if (!cancelled) setStage('png');
      } else if (!cancelled) {
        setStage('text');
      }
    }
    void run(entry);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry, reduced]);

  // Stage listener (header item 4). One owner for focus and the mark.
  useEffect(() => {
    if (!lanefield) return;
    const layout = project;
    const off = onStage((e) => {
      if (e.layout !== layout) return;
      const st = stageRef.current;
      const nowMs = performance.now();
      const p = placementRef.current;
      // Next to the mark, never under it: on subject, the spot on the
      // subject's own side (focusSpotsFor); the mark center only when
      // no side fits. The pan holds the destination marker at that spot
      // for the whole walk (following the drawing head instead swept the
      // marker across the mark mid-walk, T-HERO-BAND-WALK).
      // Only spots whose straight pan never sweeps the subject under
      // the mark count; with none, there is no pan for this subject.
      if (e.type === 'subject') {
        const at = lanefield.worldToScreen([e.ground[0], 0, e.ground[1]]);
        const rect = p ? { left: p.left, top: p.top, right: p.left + p.width, bottom: p.top + p.height } : null;
        const clear = rect ? focusSpotsRef.current.filter((sp) => !pathCrossesMark(at, sp, rect, project)) : [];
        focusSpotRef.current = nearestSpot(clear, at);
      }
      const center: [number, number] | null = focusSpotRef.current;
      const dur = T.motion.ms.medium;
      if (e.type === 'subject') {
        if (center && coarse) lanefield.setFocus({ ground: e.ground, screenPx: center });
        if (reduced) return;
        st.opacity = { from: rampAt(st.opacity, nowMs), to: 0, startMs: nowMs, durMs: dur };
        st.scale = { from: rampAt(st.scale, nowMs), to: T.morph.recedeTo, startMs: nowMs, durMs: dur };
      } else if (e.type === 'land') {
        const origin = lanefield.worldToScreen([e.ground[0], 0, e.ground[1]]);
        lanefield.pulse({ originPx: origin });
        if (reduced) return;
        st.opacity = { from: rampAt(st.opacity, nowMs), to: 1, startMs: nowMs, durMs: dur };
        st.scale = { from: rampAt(st.scale, nowMs), to: 1, startMs: nowMs, durMs: dur };
        st.beats.push({ startMs: nowMs + T.motion.ms.fast, amp: T.hero.landBeatScale - 1 });
      } else if (e.type === 'beat') {
        if (reduced) return;
        st.beats.push({ startMs: nowMs, amp: T.hero.beatScale - 1 });
      } else if (e.type === 'release') {
        lanefield.setFocus(null);
      }
    });
    return () => {
      off();
      lanefield.setFocus(null);
    };
  }, [lanefield, project, reduced, coarse]);

  // One rAF loop writes opacity and transform directly (no React state
  // per frame): morph loom or recede, stage ramp, beats, wander, tilt.
  // Reduced motion never starts it: opacity 1, identity transform.
  useEffect(() => {
    const el = wrapRef.current;
    if (reduced) {
      if (el) {
        el.style.transform = '';
        el.style.opacity = '';
      }
      return;
    }
    let raf = 0;
    let stopped = false;
    const frame = (nowMs: number): void => {
      if (stopped) return;
      const node = wrapRef.current;
      if (node) {
        let morphO = 1;
        let morphS = 1;
        const s = lanefield?.morphSample() ?? null;
        if (s && !s.done) {
          if (s.to === project) {
            morphO = s.heroOpacityIn;
            morphS = s.heroScaleIn;
          } else if (s.from === project) {
            morphO = s.heroOpacityOut;
            morphS = s.heroScaleOut;
          }
        }
        const st = stageRef.current;
        let beat = 1;
        st.beats = st.beats.filter((b) => nowMs - b.startMs < T.motion.ms.medium);
        for (const b of st.beats) beat = Math.max(beat, heroBeatEnvelope(nowMs - b.startMs, b.amp));
        let dx = 0;
        let dy = 0;
        if (project === 'sidequests') {
          const w = heroWanderOffsetAt(nowMs);
          dx = w.dx;
          dy = w.dy;
        }
        const scale = morphS * rampAt(st.scale, nowMs) * beat;
        const { rx, ry } = tiltRef.current;
        node.style.opacity = (morphO * rampAt(st.opacity, nowMs)).toFixed(4);
        node.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
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
    downRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  // A tap is the page verb, with a small pulse from the tap point as
  // immediate feedback (under 250ms, DESIGN 6.5 law 1).
  const onPointerUp = (e: React.PointerEvent): void => {
    const down = downRef.current;
    downRef.current = null;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved >= T.world.leaflink.tapMaxMovePx) return;
    if (performance.now() - down.t >= T.world.leaflink.tapMaxMs) return;
    if (!reduced) lanefield?.pulse({ originPx: [e.clientX, e.clientY], strengthScale: 0.5 });
    verbRef.current?.();
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
