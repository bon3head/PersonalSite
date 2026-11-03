// GLITTERBOX (polish item 6, DESIGN section 6.13): press and hold
// anywhere on the lane field (or hold the g key) and the 6,144 lanes
// come apart into glitter around the touch, swirling with a seeded
// direction; let go and they re-form the scene. No tab, no page, no
// copy, no new asset: it is a mode of the one material the site is
// made of, available on every scene, and it never changes the route.
//
// Input rules, chosen so nothing existing changes meaning:
// - Hold threshold is glitter.holdMs (equal to the LeafLink tap
//   limit), so a LeafLink tap (under that time) still drops an offer
//   and a hold never does.
// - Moving more than the tap move limit before the hold elapses
//   cancels it (that gesture is not a hold).
// - Once active, moving stirs: the ring follows the pointer.
// - Disabled under reduced motion, while a sheet is open, and during
//   travel (the engine refuses then as well).
// - The g key is ignored with modifiers, on repeat, and when focus is
//   in an editable field.
import { useEffect } from 'react';
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import { prefersReducedMotion } from '../lib/reducedMotion';

export function useGlitterbox(field: Lanefield | null, blocked: boolean): void {
  useEffect(() => {
    if (!field || blocked) return;
    const mount = document.getElementById('world');
    let timer: ReturnType<typeof setTimeout> | null = null;
    let active = false;
    let start: [number, number] | null = null;
    let keyHeld = false;
    const stop = (): void => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      start = null;
      if (active) field.setGlitter(false);
      active = false;
    };
    const onDown = (e: PointerEvent): void => {
      if (prefersReducedMotion()) return;
      start = [e.clientX, e.clientY];
      timer = setTimeout(() => {
        timer = null;
        if (!start) return;
        active = true;
        field.setGlitter(true, start);
      }, T.glitter.holdMs);
    };
    const onMove = (e: PointerEvent): void => {
      if (active) {
        field.setGlitter(true, [e.clientX, e.clientY]);
      } else if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) >= T.world.leaflink.tapMaxMovePx) {
        stop();
      }
    };
    const editable = (el: Element | null): boolean =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'g' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (editable(document.activeElement) || prefersReducedMotion()) return;
      keyHeld = true;
      field.setGlitter(true, [window.innerWidth / 2, window.innerHeight / 2]);
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      if (e.key !== 'g' || !keyHeld) return;
      keyHeld = false;
      field.setGlitter(false);
    };
    mount?.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stop);
    return () => {
      stop();
      if (keyHeld) field.setGlitter(false);
      mount?.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stop);
    };
  }, [field, blocked]);
}
