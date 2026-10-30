import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createLanefield } from './world/stub';
import { T } from './tokens.generated';
import './styles/global.css';
import './lib/reducedMotion';

function startWorld(): void {
  const mount = document.getElementById('world');
  if (!mount) return;
  createLanefield(mount, {
    seed: T.world.seed,
    reducedMotion: document.documentElement.classList.contains('reduced-motion'),
    initial: 'server',
  });
}

function startOnIdle(): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startWorld);
  } else {
    window.setTimeout(startWorld, 0);
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
startOnIdle();
