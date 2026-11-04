// LeafLink readout content (S06 section 3.3, S04 section 6 variant
// leaflink). Order is spec order: H1, P1, hairline rule, FACTS,
// STACK, CODE link.
// Content comes from S09 by ID; nothing here invents copy.
//
// Wiring note: B4's Readout.tsx renders its own inline leaflink block.
// This component is the S06-correct content; B8 swaps it in for that
// block (see BUILD-STATE request). Until then it is tested standalone.
import type { CSSProperties, JSX } from 'react';
import { Link } from '@astryxdesign/core/Link';
import { C } from '../copy';
import { T } from '../tokens.generated';

export default function LeaflinkReadout(): JSX.Element {
  const ruleStyle = {
    border: 'none',
    borderTop: `1px solid ${T.color.paper.hairline}`,
  } as CSSProperties;
  return (
    <div className="jp-readout-slip">
      <h1 id="h-leaflink">{C['C-LL-H1']}</h1>
      <p>{C['C-LL-P1']}</p>
      <hr className="jp-readout-rule" style={ruleStyle} />
      <p className="jp-readout-supporting">{C['C-LL-FACTS']}</p>
      <p className="jp-readout-supporting">{C['C-LL-STACK']}</p>
      <div className="jp-readout-links">
        <Link href={C['C-LL-CODE'].href} isExternalLink>
          {C['C-LL-CODE'].label}
        </Link>
      </div>
    </div>
  );
}
