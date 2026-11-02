import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { createLanefield } from './world/lanefield';
import type { Lanefield } from './world/types';
import { parsePath, SCENE_LAYOUT } from './router';
import { initMotionPref } from './lib/reducedMotion';
import { initBrandPrefetch } from './lib/brandPrefetch';
import { T } from './tokens.generated';
import './styles/global.css';

initMotionPref();
initBrandPrefetch();

function startWorld(): void {
  const mount = document.getElementById('world');
  if (!mount) return;
  const lanefield = createLanefield(mount, {
    seed: T.world.seed,
    reducedMotion: document.documentElement.classList.contains('reduced-motion'),
    initial: SCENE_LAYOUT[parsePath(window.location.pathname)],
  });
  if (lanefield) {
    // WIRING-FIX: record the instance BEFORE dispatching. The event
    // is one-shot: on engines without requestIdleCallback (WebKit,
    // stock Safari) the setTimeout(0) fallback can fire before
    // createRoot's concurrent render runs App's effects, so no
    // listener exists yet and the event is lost. App reads this
    // holder on mount and wires immediately when it is already set,
    // so both orderings (event before mount, event after mount)
    // wire. This key is distinct from window.__lanefield, which
    // holds the debug handle, not the field instance.
    (window as unknown as { __lanefieldReady?: Lanefield }).__lanefieldReady =
      lanefield;
    window.dispatchEvent(
      new CustomEvent('lanefield-ready', { detail: lanefield }),
    );
  }
}

function startOnIdle(): void {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (ric) {
    ric(startWorld);
  } else {
    window.setTimeout(startWorld, 0);
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  // S03 section 7: the client hydrates the prerendered markup. In dev
  // #root is empty (no prerender step), so fall back to a fresh root
  // there; in production #root always carries the prerendered app.
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  );
  const root = rootEl.hasChildNodes()
    ? hydrateRoot(rootEl, app)
    : createRoot(rootEl);
  if (!rootEl.hasChildNodes()) {
    root.render(app);
  }
  // Test hook: travel.spec.ts setupHarness replaces #root with its own
  // router/travel harness. Without unmounting first, the real App's
  // router and hotkeys survive (window listeners) and push duplicate
  // history entries, so goBack lands on a duplicate instead of the
  // previous scene. Unmounting runs App's cleanup (router.dispose,
  // travel.dispose, hotkeys) before the harness takes over.
  (window as unknown as Record<string, unknown>).__unmountApp = () => {
    root.unmount();
  };
}
startOnIdle();
