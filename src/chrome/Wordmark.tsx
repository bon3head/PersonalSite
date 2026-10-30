// Wordmark (S04 section 5): Justin Poli as a link to /, top-left at
// the gutter. Hidden on Server (the H1 is the name there) with the
// hidden attribute, not opacity.
import type { JSX } from 'react';
import { C } from '../copy';
import type { SceneId } from '../router';

export interface WordmarkProps {
  scene: SceneId;
}

export default function Wordmark(props: WordmarkProps): JSX.Element {
  return (
    <a
      className="jp-wordmark"
      href="/"
      data-route
      hidden={props.scene === 'server'}
    >
      {C['C-WORDMARK']}
    </a>
  );
}
