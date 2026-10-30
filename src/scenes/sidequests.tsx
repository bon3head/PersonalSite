// SideQuests marker twins (S07 section 3.3): the DOM hit targets.
// Three Astryx ghost icon-only buttons, absolutely positioned over each
// marker's projected head position every frame (transform only). The
// visual is the 3D marker; the button is the target and the focus ring.
// Transparent so the marker shows through; 44 by 44 CSS px (twice the
// 22px hit radius from tokens). aria-pressed reflects claimed.
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { C } from '../copy';
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import type { SideQuestsController } from '../world/sidequests';

const MARKER_LABELS = C['C-SQ-MARKER'].split(',').map((s) =>
  s.replace(/`/g, '').trim(),
);

export default function SideQuestsTwins(props: {
  controller: SideQuestsController;
  lanefield: Lanefield;
}): JSX.Element {
  const { controller, lanefield } = props;
  const [claimed, setClaimed] = useState<boolean[]>(() =>
    MARKER_LABELS.map((_, i) => controller.claimed(i)),
  );
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const size = T.world.sidequests.marker.hitRadiusPx * 2;

  useEffect(() => {
    const unsub = controller.onStateChange(() => {
      setClaimed(MARKER_LABELS.map((_, i) => controller.claimed(i)));
    });
    const offFrame = lanefield.onFrame(() => {
      for (let i = 0; i < MARKER_LABELS.length; i++) {
        const el = btnRefs.current[i];
        if (!el) continue;
        const [x, y] = controller.headScreen(i);
        el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
      }
    });
    return () => {
      unsub();
      offFrame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style: CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: size,
    height: size,
    background: 'transparent',
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
