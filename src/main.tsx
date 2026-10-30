import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { createLanefield } from './world/lanefield';
import { initMotionPref } from './lib/reducedMotion';
import { T } from './tokens.generated';
import './styles/global.css';

initMotionPref();

function startWorld(): void {
  const mount = document.getElementById('world');
  if (!mount) return;
  const lanefield = createLanefield(mount, {
    seed: T.world.seed,
    reducedMotion: document.documentElement.classList.contains('reduced-motion'),
    initial: 'server',
  });
  if (lanefield) {
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
