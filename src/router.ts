import { useHotkeys } from '@astryxdesign/core';
import type { Hotkey } from '@astryxdesign/core';
import { C } from './copy';
import type { LayoutId, Regime } from './world/types';

// S03 section 2: routes. Scene order for adjacency keys: server (1),
// leaflink (2), sidequests (3). The 404 scene is outside the order.
export type SceneId = 'server' | 'leaflink' | 'sidequests' | 'notfound';
export type SheetId = 'whoami' | 'contact' | null;

export const SCENE_ORDER: SceneId[] = ['server', 'leaflink', 'sidequests'];

export const SCENE_PATH: Record<SceneId, string> = {
  server: '/',
  leaflink: '/leaflink',
  sidequests: '/sidequests',
  notfound: '/404',
};

export const SCENE_LAYOUT: Record<SceneId, LayoutId> = {
  server: 'server',
  leaflink: 'leaflink',
  sidequests: 'sidequests',
  notfound: 'scatter',
};

export const SCENE_REGIME: Record<SceneId, Regime> = {
  server: 'void',
  leaflink: 'paper',
  sidequests: 'field',
  notfound: 'void',
};

// DESIGN section 3.2 prose: void and field are color-scheme dark, paper
// is color-scheme light, so Astryx light-dark() tokens resolve correctly.
export const REGIME_COLOR_SCHEME: Record<Regime, 'dark' | 'light'> = {
  void: 'dark',
  paper: 'light',
  field: 'dark',
};

export const SCENE_TITLE: Record<SceneId, string> = {
  server: C['C-TITLE-SERVER'],
  leaflink: C['C-TITLE-LEAFLINK'],
  sidequests: C['C-TITLE-SIDEQUESTS'],
  notfound: C['C-TITLE-404'],
};

export const SCENE_H1: Record<SceneId, string> = {
  server: C['C-SRV-H1'],
  leaflink: C['C-LL-H1'],
  sidequests: C['C-SQ-H1'],
  notfound: C['C-404-H1'],
};

// S03 section 2: trailing slashes normalize to no slash, uppercase
// normalizes to lowercase. Unknown paths are the 404 scene.
export function parsePath(pathname: string): SceneId {
  let p = pathname.toLowerCase();
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  switch (p) {
    case '/':
      return 'server';
    case '/leaflink':
      return 'leaflink';
    case '/sidequests':
      return 'sidequests';
    default:
      return 'notfound';
  }
}

export function sceneToPath(scene: SceneId): string {
  return SCENE_PATH[scene];
}

// S03 section 2: sheets are not routes. #whoami and #contact open the
// matching sheet over the current scene.
export function parseHash(hash: string): SheetId {
  if (hash === '#whoami') return 'whoami';
  if (hash === '#contact') return 'contact';
  return null;
}

export function sheetToHash(sheet: SheetId): string {
  if (sheet === 'whoami') return '#whoami';
  if (sheet === 'contact') return '#contact';
  return '';
}

// S03 section 6: ArrowLeft / ArrowRight move in scene order, wrapping.
// From 404, ArrowRight goes to server; ArrowLeft wraps to the end of the
// order (sidequests), the symmetric completion of the wrapping rule.
export function stepScene(current: SceneId, dir: 1 | -1): SceneId {
  if (current === 'notfound') {
    return dir === 1 ? 'server' : 'sidequests';
  }
  const idx = SCENE_ORDER.indexOf(current);
  const next = (idx + dir + SCENE_ORDER.length) % SCENE_ORDER.length;
  return SCENE_ORDER[next];
}

export interface RouterState {
  scene: SceneId;
  sheet: SheetId;
}

export interface RouterCallbacks {
  onSceneChange: (scene: SceneId, source: 'go' | 'pop') => void;
  onSheetChange: (sheet: SheetId) => void;
}

export interface Router {
  readonly state: RouterState;
  go: (scene: SceneId) => void;
  setSheet: (sheet: SheetId) => void;
  dispose: () => void;
}

function currentUrl(scene: SceneId, sheet: SheetId): string {
  return sceneToPath(scene) + sheetToHash(sheet);
}

// S03 section 3: go() pushes state then runs travel (via onSceneChange).
// popstate runs travel without pushing. setSheet uses replaceState, so
// closing a sheet does not cost a back press.
export function createRouter(
  initial: RouterState,
  callbacks: RouterCallbacks,
): Router {
  const state: RouterState = { ...initial };

  function onPopState(): void {
    const scene = parsePath(window.location.pathname);
    const sheet = parseHash(window.location.hash);
    const sceneChanged = scene !== state.scene;
    const sheetChanged = sheet !== state.sheet;
    state.scene = scene;
    state.sheet = sheet;
    if (sceneChanged) callbacks.onSceneChange(scene, 'pop');
    if (sheetChanged) callbacks.onSheetChange(sheet);
  }

  window.addEventListener('popstate', onPopState);

  function onDocumentClick(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement | null)?.closest?.('a[data-route]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self') return;
    event.preventDefault();
    go(parsePath(url.pathname));
  }

  document.addEventListener('click', onDocumentClick);

  function go(scene: SceneId): void {
    if (scene === state.scene) return;
    state.scene = scene;
    window.history.pushState({ scene }, '', currentUrl(scene, state.sheet));
    callbacks.onSceneChange(scene, 'go');
  }

  function setSheet(sheet: SheetId): void {
    if (sheet === state.sheet) return;
    state.sheet = sheet;
    window.history.replaceState(
      { scene: state.scene },
      '',
      currentUrl(state.scene, sheet),
    );
    callbacks.onSheetChange(sheet);
  }

  return {
    state,
    go,
    setSheet,
    dispose(): void {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onDocumentClick);
    },
  };
}

// S03 section 6: keyboard bindings. Registered once with Astryx
// useHotkeys (S04 owns the visual Keymap). Bindings are disabled while
// a sheet is open, except the sheet's own key (isDisabled on the
// entries). Escape is NOT handled here: BottomSheet handles it itself,
// do not double-handle. Never active inside inputs: useHotkeys defaults
// allowInInputs to false, which is the guard.
export interface TravelHotkeysProps {
  go: (scene: SceneId) => void;
  step: (dir: 1 | -1) => void;
  toggleSheet: (sheet: Exclude<SheetId, null>) => void;
  sheet: SheetId;
}

function noModifier(event: KeyboardEvent): boolean {
  return !event.metaKey && !event.ctrlKey && !event.altKey;
}

export function buildTravelHotkeyEntries(props: TravelHotkeysProps): Hotkey[] {
  const sheetOpen = props.sheet !== null;
  return [
    {
      keys: '1',
      onPress: (e) => {
        if (noModifier(e)) props.go('server');
      },
      isDisabled: sheetOpen,
    },
    {
      keys: '2',
      onPress: (e) => {
        if (noModifier(e)) props.go('leaflink');
      },
      isDisabled: sheetOpen,
    },
    {
      keys: '3',
      onPress: (e) => {
        if (noModifier(e)) props.go('sidequests');
      },
      isDisabled: sheetOpen,
    },
    {
      keys: 'left',
      onPress: (e) => {
        if (noModifier(e)) props.step(-1);
      },
      isDisabled: sheetOpen,
    },
    {
      keys: 'right',
      onPress: (e) => {
        if (noModifier(e)) props.step(1);
      },
      isDisabled: sheetOpen,
    },
    {
      keys: 'w',
      onPress: (e) => {
        if (noModifier(e)) props.toggleSheet('whoami');
      },
      isDisabled: props.sheet === 'contact',
    },
    {
      keys: 'c',
      onPress: (e) => {
        if (noModifier(e)) props.toggleSheet('contact');
      },
      isDisabled: props.sheet === 'whoami',
    },
  ];
}

// No JSX: this component only registers hotkeys and renders nothing, so
// it lives in a .ts file. B4 mounts it inside App in wave 2.
export function TravelHotkeys(props: TravelHotkeysProps): null {
  useHotkeys(buildTravelHotkeyEntries(props));
  return null;
}
