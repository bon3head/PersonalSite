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
import { useEffect, useRef, useState, type JSX } from 'react';
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
  type TravelController,
} from './travel';
import { prefersReducedMotion } from './lib/reducedMotion';
import type { Lanefield } from './world/types';
import { C } from './copy';
import Keymap from './chrome/Keymap';
import Wordmark from './chrome/Wordmark';
import Readout from './chrome/Readout';
import WhoamiSheet from './chrome/WhoamiSheet';
import ContactSheet from './chrome/ContactSheet';

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

  // Router + travel, created once, disposed on unmount.
  useEffect(() => {
    const travel = createTravelController(initialScene, {
      lanefield: props.lanefield ?? null,
      dom: {
        readout: () => readoutRef.current,
        announce: () => liveRef.current,
        busy: () => mainRef.current,
        keymap: () => document.querySelector('.jp-keymap'),
        keymapItem: (s: SceneId) =>
          document.querySelector(`[data-scene="${s}"]`),
      },
      isReducedMotion: prefersReducedMotion,
      onSwap: (next: SceneId) => setScene(next),
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
    // arrives, attach it so scene changes morph lanes.
    const onLanefield = (event: Event): void => {
      const detail = (event as CustomEvent).detail as Lanefield | null;
      travel.setLanefield(detail ?? null);
    };
    window.addEventListener('lanefield-ready', onLanefield);
    return () => {
      window.removeEventListener('lanefield-ready', onLanefield);
      router.dispose();
      travel.dispose();
      routerRef.current = null;
      travelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Readout scene={scene} sectionRef={readoutRef} />
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
        />
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
