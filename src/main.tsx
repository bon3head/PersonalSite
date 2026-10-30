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
  if (rootEl.hasChildNodes()) {
    hydrateRoot(rootEl, app);
  } else {
    createRoot(rootEl).render(app);
  }
}
startOnIdle();
