// LeafLink readout content (S06 section 3.3, S04 section 6 variant
// leaflink). Order is spec order: H1, P1, FACTS, STACK, CODE link,
// hairline rule, LEGEND with interleaved CSS glyphs, SIM, OfferButton.
// Content comes from S09 by ID; nothing here invents copy.
//
// Wiring note: B4's Readout.tsx renders its own inline leaflink block.
// This component is the S06-correct content; B8 swaps it in for that
// block (see BUILD-STATE request). Until then it is tested standalone.
import type { CSSProperties, JSX } from 'react';
import { Link } from '@astryxdesign/core/Link';
import { Button } from '@astryxdesign/core/Button';
import { C } from '../copy';
import { T } from '../tokens.generated';

export interface LeaflinkReadoutProps {
  /** Visitor offer at the node nearest the map center. */
  onOffer: () => void;
}

const GLYPH_CLASS = [
  'jp-legend-glyph jp-legend-glyph--ring',
  'jp-legend-glyph jp-legend-glyph--dot',
  'jp-legend-glyph jp-legend-glyph--bar',
];

const GLYPH_SIZE: Array<{ width: number; height: number }> = [
  { width: T.chrome.legendGlyphPx.ring, height: T.chrome.legendGlyphPx.ring },
  { width: T.chrome.legendGlyphPx.dot, height: T.chrome.legendGlyphPx.dot },
  { width: T.chrome.legendGlyphPx.bar[0], height: T.chrome.legendGlyphPx.bar[1] },
];

function LegendGlyphs(): JSX.Element {
  // C-LL-LEGEND splits on ". " into three clauses in glyph order
  // (ring, dot, bar); each glyph sits before its clause's word.
  const clauses = C['C-LL-LEGEND'].split('. ');
  return (
    <span>
      {clauses.map((clause, i) => (
        <span key={clause}>
          <span
            aria-hidden="true"
            className={GLYPH_CLASS[i]}
            style={{
              width: GLYPH_SIZE[i].width,
              height: GLYPH_SIZE[i].height,
            }}
          />{' '}
          {clause}
          {i < clauses.length - 1 ? '. ' : ''}
        </span>
      ))}
    </span>
  );
}

export default function LeaflinkReadout(props: LeaflinkReadoutProps): JSX.Element {
  const ruleStyle = {
    border: 'none',
    borderTop: `1px solid ${T.color.paper.hairline}`,
  } as CSSProperties;
  return (
    <div className="jp-readout-slip">
      <h1 id="h-leaflink">{C['C-LL-H1']}</h1>
      <p>{C['C-LL-P1']}</p>
      <p className="jp-readout-supporting">{C['C-LL-FACTS']}</p>
      <p className="jp-readout-supporting">{C['C-LL-STACK']}</p>
      <div className="jp-readout-links">
        <Link href={C['C-LL-CODE'].href} isExternalLink>
          {C['C-LL-CODE'].label}
        </Link>
      </div>
      <hr className="jp-readout-rule" style={ruleStyle} />
      <p className="jp-readout-supporting">
        <LegendGlyphs />
      </p>
      <p className="jp-readout-caption">{C['C-LL-SIM']}</p>
      <Button
        variant="secondary"
        size="sm"
        label={C['C-LL-OFFER']}
        onClick={props.onOffer}
      />
    </div>
  );
}
