// SSR entry for prerendering. Renders the full App to a string per route
// so hydrateRoot on the client finds matching markup (S03 section 7).
// App is SSR-safe when given initialScene/initialSheet props: it reads
// window.location only as a fallback, and all DOM access lives in effects.
import { renderToString } from 'react-dom/server';
import App from './App';
import type { SceneId, SheetId } from './router';

export function renderRoute(scene: SceneId, sheet: SheetId): string {
  return renderToString(<App initialScene={scene} initialSheet={sheet} />);
}
