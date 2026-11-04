// SideQuests marker controls (S07 section 3.3, polish round).
//
// Fine pointers: three Astryx ghost icon-only buttons positioned over
// each marker's projected head every frame (transform only), 44 by 44
// CSS px, transparent; the visual is the 3D marker, the button is the
// target and the focus ring. aria-pressed reflects claimed.
//
// Coarse (phones): device run 3 cut the trailhead row, so the Twins
// are the accessible set on coarse too (device-run-2 measured all
// three marker heads under the readout or off-screen at 390x658;
// the camera pan on walk brings the walked marker into view).
// One accessible set per variant, never two.
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { C } from '../copy';
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import type { SideQuestsController } from '../world/sidequests';

export const MARKER_LABELS = C['C-SQ-MARKER'].split(',').map((s) =>
  s.replace(/`/g, '').trim(),
);

// Claimed state per trail, following controller state changes.
export function useTrailClaims(controller: SideQuestsController | null): boolean[] {
  const [claimed, setClaimed] = useState<boolean[]>(() =>
    MARKER_LABELS.map((_, i) => (controller ? controller.claimed(i) : false)),
  );
  useEffect(() => {
    if (!controller) return;
    setClaimed(MARKER_LABELS.map((_, i) => controller.claimed(i)));
    return controller.onStateChange(() => {
      setClaimed(MARKER_LABELS.map((_, i) => controller.claimed(i)));
    });
  }, [controller]);
  return claimed;
}

export default function SideQuestsTwins(props: {
  controller: SideQuestsController;
  lanefield: Lanefield;
}): JSX.Element {
  const { controller, lanefield } = props;
  const claimed = useTrailClaims(controller);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const size = T.world.sidequests.marker.hitRadiusPx * 2;

  useEffect(() => {
    const offFrame = lanefield.onFrame(() => {
      for (let i = 0; i < MARKER_LABELS.length; i++) {
        const el = btnRefs.current[i];
        if (!el) continue;
        const [x, y] = controller.headScreen(i);
        el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
      }
    });
    return offFrame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // transition none (polish round): the Astryx Button transitions
  // transform over the fast duration for press feedback. The twin is
  // moved by transform every frame, so that transition made every hit
  // target trail its marker by 150ms (measured: transitionProperty
  // includes transform, duration 0.15s), and a tap on a moving marker
  // could land beside its button. Position must track the frame.
  const style: CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: size,
    height: size,
    background: 'transparent',
    transition: 'none',
  };

  return (
    <>
      {MARKER_LABELS.map((label, i) => (
        <Button
          key={label}
          ref={(el: HTMLButtonElement | null) => {
            btnRefs.current[i] = el;
          }}
          variant="ghost"
          isIconOnly
          label={label}
          data-twin={i}
          aria-pressed={claimed[i]}
          onClick={() => controller.walk(i)}
          onMouseEnter={() => controller.setHover(i)}
          onMouseLeave={() => controller.setHover(null)}
          style={style}
        />
      ))}
    </>
  );
}
