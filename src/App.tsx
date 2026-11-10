// App (S04 section 3): the DOM layer that persists across scenes.
// Page structure is exactly S04 section 3: wordmark, main with the
// readout and the canvas-region description, keymap nav, announcement region,
// sheets. One h1 per scene (the readout heading). No header, no
// footer.
//
// Wiring:
// - Theme mode follows data-regime (B1 integration contract): void and
//   field are dark, paper is light. A MutationObserver keeps mode in
//   sync when travel flips the regime.
// - Router (S03) owns URL state; its onSceneChange runs travel, whose
//   onSwap swaps the rendered readout while it is hidden. The readout
//   section keeps one DOM identity across swaps (Readout renders one
//   section whose content varies by scene), which is what travel
//   manipulates.
// - TravelHotkeys (S03 section 6) is mounted here.
// - The travel controller takes a lanefield prop; main.tsx starts the
//   world on idle but does not hand the instance to App yet, so the
//   prop defaults to null (DOM travel only, reduced timing) until the
//   coordinator wires the world instance through (see BUILD-STATE).
import { lazy, Suspense, useEffect, useRef, useState, type JSX } from 'react';
import { flushSync } from 'react-dom';
import { Theme } from '@astryxdesign/core/theme';
import { LayerProvider } from '@astryxdesign/core';
// B1's laneTheme.mjs ships no declarations, and a sibling .d.ts would
// sit in B1-owned themes/lane/. Suppress the implicit-any import here
// instead; laneTheme is passed straight to Astryx Theme as-is.
// @ts-ignore: untyped B1-owned module, no declarations shipped
import { laneTheme } from '../themes/lane/laneTheme.mjs';
import '../themes/lane/dist/lane.css';
import './chrome/chrome.css';
import {
  createRouter,
  parseHash,
  parsePath,
  stepScene,
  TravelHotkeys,
  REGIME_COLOR_SCHEME,
  SCENE_REGIME,
  type Router,
  type SceneId,
  type SheetId,
} from './router';
import {
  applyRegime,
  createTravelController,
  type SceneController,
  type TravelController,
} from './travel';
import { prefersReducedMotion } from './lib/reducedMotion';
import type { Lanefield } from './world/types';
import { createServerController, type ServerController } from './world/server';
import {
  createLeaflinkController,
  type LeaflinkController,
} from './world/leaflink';
import {
  createSideQuestsController,
  type SideQuestsController,
} from './world/sidequests';
import { createNotfoundController } from './world/notfound';
import SideQuestsTwins, { MARKER_LABELS, useTrailClaims } from './scenes/sidequests';
import { useGlitterbox } from './chrome/glitterbox';
import { T } from './tokens.generated';
import type { Rect } from './hero/heroGeometry';
import BrandHero from './hero/BrandHero';
import { C } from './copy';
import Keymap from './chrome/Keymap';
import Wordmark from './chrome/Wordmark';
import Readout from './chrome/Readout';
// Sheets load on demand: the BottomSheet closure is the largest
// astryx cost not needed for first paint, and both sheets start
// closed. A mount effect preloads them on idle so the first open
// is instant; Suspense fallback null matches a closed sheet.
const WhoamiSheet = lazy(() => import('./chrome/WhoamiSheet'));
const ContactSheet = lazy(() => import('./chrome/ContactSheet'));
const GuestbookSheet = lazy(() => import('./chrome/GuestbookSheet'));
import { entropySeed } from './motion/entropy';

// Polish item 5: read ?seed before the router's first pushState drops
// the query (the first draw happens inside travel, after the push), so
// a seeded URL replays. Browser only; prerender never draws.
if (typeof window !== 'undefined') entropySeed();

export interface AppProps {
  initialScene?: SceneId;
  initialSheet?: SheetId;
  lanefield?: Lanefield | null;
}

function initialSceneFromLocation(): SceneId {
  if (typeof window === 'undefined') return 'server';
  return parsePath(window.location.pathname);
}

function initialSheetFromLocation(): SheetId {
  if (typeof window === 'undefined') return null;
  return parseHash(window.location.hash);
}

const SCENE_ALT: Record<SceneId, string | null> = {
  server: C['C-SRV-ALT'],
  leaflink: C['C-LL-ALT'],
  sidequests: C['C-SQ-ALT'],
  // No C-404-ALT exists in S09; the 404 canvas region has no
  // description string, so no role=img div renders on 404 rather than
  // inventing one.
  notfound: null,
};

export default function App(props: AppProps): JSX.Element {
  const initialScene = props.initialScene ?? initialSceneFromLocation();
  const initialSheet = props.initialSheet ?? initialSheetFromLocation();
  // Rendered scene: swaps at travel's hidden point (onSwap), not at
  // go(), so the readout content never changes while visible.
  const [scene, setScene] = useState<SceneId>(initialScene);
  const [sheet, setSheet] = useState<SheetId>(initialSheet);
  // Mounted flips true in a mount effect. The sheets are lazy and
  // must not render during hydration: a lazy component suspending
  // on the hydration pass throws React error 419 (measured: the
  // baseline is clean, the un-gated lazy sheets throw at ~400ms).
  // Both sheets start closed, so rendering them only after mount
  // is behavior-identical; the server and the hydration pass both
  // render no sheet content.
  const [mounted, setMounted] = useState(false);
  // The guestbook chunk loads on first request only (it shares the
  // engine chunk), and stays mounted after that so its close can move.
  const [gbRequested, setGbRequested] = useState(initialSheet === 'guestbook');
  useEffect(() => {
    if (sheet === 'guestbook') setGbRequested(true);
    // Warm the guestbook chunk while Contact (its one entry) is open,
    // so Leave a mark opens without a load gap.
    if (sheet === 'contact') void import('./chrome/GuestbookSheet');
  }, [sheet]);
  const [mode, setMode] = useState<'dark' | 'light'>(
    () => REGIME_COLOR_SCHEME[SCENE_REGIME[initialScene]],
  );

  const readoutRef = useRef<HTMLElement | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const whoamiButtonRef = useRef<HTMLButtonElement | null>(null);
  const contactButtonRef = useRef<HTMLButtonElement | null>(null);
  const routerRef = useRef<Router | null>(null);
  const travelRef = useRef<TravelController | null>(null);
  // Scene controllers, created when the world arrives (lanefield-ready).
  // The Map object is shared with the travel controller by reference,
  // so populating it later still drives pause/resume on travel.
  const controllersRef = useRef<Map<SceneId, SceneController>>(new Map());
  // Wired field + controllers for rendering (twins, OfferButton). Null
  // until the world arrives; the App shows lanes + readout only.
  const [wired, setWired] = useState<{
    field: Lanefield;
    leaflink: LeaflinkController;
    sidequests: SideQuestsController;
  } | null>(null);

  // Theme mode follows data-regime (B1 contract).
  useEffect(() => {
    const sync = (): void => {
      const regime = document.documentElement.getAttribute('data-regime');
      setMode(regime === 'paper' ? 'light' : 'dark');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-regime'],
    });
    return () => observer.disconnect();
  }, []);

  // Preload the sheet chunks on idle: the sheets are lazy (their
  // BottomSheet closure is not needed for first paint), but the
  // first open must feel instant, so warm the cache after mount.
  // requestIdleCallback with a setTimeout fallback, same shape as
  // main.tsx startOnIdle. Also flips mounted, which gates the
  // lazy sheets off the hydration pass (see the mounted state).
  useEffect(() => {
    setMounted(true);
    const preload = (): void => {
      void import('./chrome/WhoamiSheet');
      void import('./chrome/ContactSheet');
    };
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void) => void;
      }
    ).requestIdleCallback;
    if (ric) {
      ric(preload);
    } else {
      setTimeout(preload, 0);
    }
  }, []);

  // Router + travel, created once, disposed on unmount.
  useEffect(() => {
    // Create scene controllers for a field (or clear them). Called once
    // if the App mounts with a field, and on every lanefield-ready.
    const wireField = (field: Lanefield | null): void => {
      if (field) {
        const server = createServerController(field, {
          reducedMotion: prefersReducedMotion(),
        });
        const leaflink = createLeaflinkController(field, {
          target: document.getElementById('world'),
          reducedMotion: prefersReducedMotion(),
        });
        const sidequests = createSideQuestsController(field, {
          reducedMotion: prefersReducedMotion,
        });
        const notfound = createNotfoundController();
        controllersRef.current.set('server', server);
        controllersRef.current.set('leaflink', leaflink);
        controllersRef.current.set('sidequests', sidequests);
        controllersRef.current.set('notfound', notfound);
        // P-MORPH-1 sub-task 1: pause every non-active controller at
        // wire time. Controllers used to start unpaused and pause
        // only on travel away, so a direct load to an inactive
        // scene's route never paused the others and their ambient
        // sims rendered into the shared scene over the active scene.
        // The active route is the travel controller's current scene
        // (not the mount route: the visitor may have traveled before
        // the world arrived). Travel resumes the target controller
        // at morph end, so no controller stays paused after its
        // route is visited.
        const active = travelRef.current?.current ?? initialScene;
        for (const [id, controller] of controllersRef.current) {
          if (id !== active) controller.pause();
        }
        setWired({ field, leaflink, sidequests });
        // Test hook: scene tests pause controllers to measure lanes
        // without scene text (S05 T-SRV-2 excludes text pixels).
        (window as unknown as {
          __sceneControllers?: Map<SceneId, SceneController>;
        }).__sceneControllers = controllersRef.current;
      } else {
        controllersRef.current.clear();
        setWired(null);
        delete (window as unknown as {
          __sceneControllers?: Map<SceneId, SceneController>;
        }).__sceneControllers;
      }
    };
    const travel = createTravelController(initialScene, {
      lanefield: props.lanefield ?? null,
      controllers: controllersRef.current,
      dom: {
        readout: () => readoutRef.current,
        announce: () => liveRef.current,
        busy: () => mainRef.current,
        keymap: () => document.querySelector('.jp-keymap'),
        keymapItem: (s: SceneId) =>
          document.querySelector(`[data-scene="${s}"]`),
      },
      isReducedMotion: prefersReducedMotion,
      // Synchronous commit (polish round): the incoming readout and the
      // hero mount, lay out, and register the hero anchor inside the
      // swap callback, before the next frame samples the morph.
      onSwap: (next: SceneId) => flushSync(() => setScene(next)),
    });
    travelRef.current = travel;
    const router = createRouter(
      { scene: initialScene, sheet: initialSheet },
      {
        onSceneChange: (next: SceneId) => {
          void travel.travelTo(next);
        },
        onSheetChange: (next: SheetId) => setSheet(next),
      },
    );
    routerRef.current = router;
    applyRegime(initialScene);
    // The world starts on idle in main.tsx, after App mounts. When it
    // arrives, attach it so scene changes morph lanes, and create the
    // scene controllers so travel pause/resume drives words, sim, and
    // markers. wireField pauses every non-active controller, so only
    // the active route's controller simulates at mount.
    const onLanefield = (event: Event): void => {
      const detail = (event as CustomEvent).detail as Lanefield | null;
      travel.setLanefield(detail ?? null);
      wireField(detail);
    };
    window.addEventListener('lanefield-ready', onLanefield);
    // WIRING-FIX: the event is one-shot and may already have fired
    // before this effect ran (WebKit / stock Safari: no
    // requestIdleCallback, so main.tsx's setTimeout(0) fallback
    // dispatches before createRoot's concurrent render runs this
    // effect). If main.tsx already recorded the instance in
    // __lanefieldReady, wire it now instead of waiting for an event
    // that will never re-fire. The listener above still covers the
    // other ordering (field arriving after mount). The props path
    // is unchanged and takes precedence when both are present, so
    // the field is wired exactly once here.
    const alreadyReady = (window as unknown as {
      __lanefieldReady?: Lanefield;
    }).__lanefieldReady;
    const existing = props.lanefield ?? alreadyReady ?? null;
    if (existing) {
      travel.setLanefield(existing);
      wireField(existing);
    }
    return () => {
      window.removeEventListener('lanefield-ready', onLanefield);
      router.dispose();
      travel.dispose();
      for (const c of controllersRef.current.values()) {
        (c as { dispose?: () => void }).dispose?.();
      }
      controllersRef.current.clear();
      delete (window as unknown as {
        __sceneControllers?: Map<SceneId, SceneController>;
      }).__sceneControllers;
      routerRef.current = null;
      travelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guestbook open (DESIGN 6.14, S05 1.2.0): the server words step out
  // of the field so the mark has it to itself.
  useEffect(() => {
    const server = controllersRef.current.get('server') as ServerController | undefined;
    server?.setHidden?.(sheet === 'guestbook');
  }, [sheet, wired]);

  // Polish round wiring (DESIGN 6.12, 6.13).
  const claims = useTrailClaims(wired?.sidequests ?? null);
  const lastWalkRef = useRef<number>(-1);
  const walkTrail = wired
    ? (i: number): void => {
        lastWalkRef.current = i;
        wired.sidequests.walk(i);
      }
    : null;
  // SideQuests page verb from the mark: the first open trail, else the
  // next one after the last walked.
  const nextTrail = (): number => {
    const open = claims.findIndex((c) => !c);
    return open >= 0 ? open : (lastWalkRef.current + 1) % MARKER_LABELS.length;
  };
  // Marker tap targets at rest (resting projection, not the moving camera).
  const sqRestBlockers = wired
    ? (): Rect[] => {
        const r = T.world.sidequests.marker.hitRadiusPx;
        return MARKER_LABELS.map((_, i) => {
          const [x, y] = wired.field.projectAtRest('sidequests', wired.sidequests.restHead(i));
          return { left: x - r, top: y - r, right: x + r, bottom: y + r };
        });
      }
    : null;
  useGlitterbox(wired?.field ?? null, sheet !== null);

  function toggleSheet(target: Exclude<SheetId, null>): void {
    const router = routerRef.current;
    if (!router) return;
    router.setSheet(router.state.sheet === target ? null : target);
  }

  const alt = SCENE_ALT[scene];

  return (
    <Theme theme={laneTheme} mode={mode}>
      <LayerProvider>
        <div role="banner">
          <Wordmark scene={scene} />
        </div>
        <main id="scene" aria-busy="false" ref={mainRef}>
          <Readout
            scene={scene}
            sectionRef={readoutRef}
          />
          {scene === 'sidequests' && wired && (
            <SideQuestsTwins
              controller={wired.sidequests}
              lanefield={wired.field}
            />
          )}
          {/* P-HERO-1: exactly one brand mark per project route, none
              on server. Device run 4: the hero stays mounted when
              a sheet opens, so a whoami or contact sheet still
              shows the mark, and it renders before the field
              arrives (or with no field at all, the F3 path), so
              the mark never depends on WebGL. wired is null until
              lanefield-ready; the hero takes the field when it
              exists and null otherwise. */}
          {scene === 'leaflink' && (
            <BrandHero
              project="leaflink"
              lanefield={wired?.field ?? null}
              onVerb={wired ? () => wired.leaflink.dropOfferAtCenter() : null}
            />
          )}
          {scene === 'sidequests' && (
            <BrandHero
              project="sidequests"
              lanefield={wired?.field ?? null}
              onVerb={walkTrail ? () => walkTrail(nextTrail()) : null}
              restBlockers={sqRestBlockers}
            />
          )}
          {alt !== null && (
            <div role="img" aria-label={alt} />
          )}
        </main>
        <Keymap
          scene={scene}
          sheet={sheet}
          onToggleSheet={toggleSheet}
          whoamiButtonRef={whoamiButtonRef}
          contactButtonRef={contactButtonRef}
        />
        <div
          className="jp-live"
          aria-live="polite"
          aria-atomic="true"
          ref={liveRef}
        />
        {mounted && (
          <Suspense fallback={null}>
            <WhoamiSheet
              isOpen={sheet === 'whoami'}
              onOpenChange={(open) => {
                if (!open) routerRef.current?.setSheet(null);
              }}
              finalFocusRef={whoamiButtonRef}
            />
            <ContactSheet
              isOpen={sheet === 'contact'}
              onOpenChange={(open) => {
                if (!open) routerRef.current?.setSheet(null);
              }}
              finalFocusRef={contactButtonRef}
              onLeaveMark={() => routerRef.current?.setSheet('guestbook')}
            />
          </Suspense>
        )}
        {mounted && gbRequested && (
          <Suspense fallback={null}>
            <GuestbookSheet
              isOpen={sheet === 'guestbook'}
              onRequestClose={() => routerRef.current?.setSheet(null)}
              field={wired?.field ?? null}
              finalFocusRef={contactButtonRef}
            />
          </Suspense>
        )}
        <TravelHotkeys
          go={(next: SceneId) => routerRef.current?.go(next)}
          step={(dir: 1 | -1) => {
            const router = routerRef.current;
            if (router) router.go(stepScene(router.state.scene, dir));
          }}
          toggleSheet={toggleSheet}
          sheet={sheet}
        />
      </LayerProvider>
    </Theme>
  );
}
