// Test-only render helper. Imported by tests/scenes/leaflink.spec.ts
// through vite (which resolves react-dom/client); a bare specifier in
// page.evaluate cannot resolve because vite never transforms it.
import { createRoot } from 'react-dom/client';
import { createElement, type ComponentType } from 'react';

export function renderInto(
  host: HTMLElement,
  Comp: ComponentType<{ onOffer: () => void }>,
  onOffer: () => void,
): void {
  const root = createRoot(host);
  root.render(createElement(Comp, { onOffer }));
}
