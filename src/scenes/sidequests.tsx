// SideQuests marker controls (S07 section 3.3, polish round).
//
// Fine pointers: three Astryx ghost icon-only buttons positioned over
// each marker's projected head every frame (transform only), 44 by 44
// CSS px, transparent; the visual is the 3D marker, the button is the
// target and the focus ring. aria-pressed reflects claimed.
//
// Coarse (phones): device-run-2 measured all three marker heads under
// the readout or off-screen at 390x658 (heads at x 14 to 134, y 64 to
// 134, readout 16..374 by 52..436). The accessible controls therefore
// dock into the trailhead sign as a visible row (TrailRow, rendered by
// Readout), and the floating buttons stay as pointer-only hit targets
// (aria-hidden, out of the tab order) for markers the camera has
// panned into view. One accessible set per variant, never two.
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { C } from '../copy';
import { T } from '../tokens.generated';
import type { Lanefield } from '../world/types';
import type { SideQuestsController } from '../world/sidequests';
import { useCoarse } from '../lib/coarse';

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

// Coarse trailhead row: the page verb, visible without scrolling.
// Labels are C-SQ-MARKER; the glyph is a dashed trail bar that turns
// solid accent when claimed (chrome.css). Disabled until the world
// arrives, so the readout height never changes when it does.
export function TrailRow(props: {
  claimed: boolean[];
  onWalk: ((i: number) => void) | null;
}): JSX.Element {
  return (
    <div className="jp-sq-trails">
      {MARKER_LABELS.map((label, i) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          label={label}
          className="jp-sq-trail"
          icon={
            <span
              className="jp-sq-glyph jp-sq-glyph--trail"
              aria-hidden="true"
              style={{
                width: T.chrome.legendGlyphPx.bar[0],
                height: 0,
                borderTopWidth: T.chrome.legendGlyphPx.bar[1],
              }}
            />
          }
          aria-label={label}
          aria-pressed={props.claimed[i]}
          isDisabled={props.onWalk === null}
          onClick={() => props.onWalk?.(i)}
        />
      ))}
    </div>
  );
}

export default function SideQuestsTwins(props: {
  controller: SideQuestsController;
  lanefield: Lanefield;
  // True only where the coarse trail row is rendered (App). Twins go
  // pointer-only on coarse only then, so a mount without the row (the
  // scene harness) keeps its keyboard path.
  trailRowDocked?: boolean;
}): JSX.Element {
  const { controller, lanefield } = props;
  const claimed = useTrailClaims(controller);
  const coarse = useCoarse() && props.trailRowDocked === true;
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
          aria-hidden={coarse ? true : undefined}
          tabIndex={coarse ? -1 : undefined}
          onClick={() => controller.walk(i)}
          onMouseEnter={() => controller.setHover(i)}
          onMouseLeave={() => controller.setHover(null)}
          style={style}
        />
      ))}
    </>
  );
}
