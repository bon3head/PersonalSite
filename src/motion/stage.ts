// Stage events (polish item 3, DESIGN section 6.12): one interaction
// grammar shared by both project pages.
//
//   subject  the page verb started (LeafLink visitor match routing,
//            SideQuests trail walk). The hero recedes and the camera
//            pans the subject's ground point into the hero's clear
//            spot, so the thing the visitor caused is what they see.
//   land     the subject finished (route reached the request, trail
//            claimed). A ring pulse departs from the subject's screen
//            position and travels into the mark; the mark looms back
//            with one land beat. This is the image-to-message link:
//            what happened on the map lands in the project's mark.
//   beat     an ambient event on the page (any LeafLink match lands):
//            one small beat on the mark, never on a timer.
//   release  the story is over: the camera pan returns to rest.
//
// Controllers emit; BrandHero is the only listener that moves the
// camera or the mark, so there is exactly one owner for each.
import type { LayoutId } from '../world/types';

export type StageLayout = Extract<LayoutId, 'leaflink' | 'sidequests'>;

export type StageEvent =
  | { type: 'subject'; layout: StageLayout; ground: [number, number] }
  | { type: 'land'; layout: StageLayout; ground: [number, number] }
  | { type: 'beat'; layout: StageLayout }
  | { type: 'release'; layout: StageLayout };

type Listener = (e: StageEvent) => void;

const listeners = new Set<Listener>();

export function emitStage(e: StageEvent): void {
  for (const l of [...listeners]) l(e);
}

export function onStage(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
