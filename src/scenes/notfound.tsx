// Notfound readout content (S08 section 3, S04 section 6). The 404
// readout reuses the server variant placement (left column fine, top
// coarse); this module owns the content itself so the scene's strings
// live in exactly one place. Readout.tsx (B4-owned) renders the same
// H1 and paragraph for scene notfound; this component matches it
// element for element (h1 id h-notfound, one paragraph) so a future
// wiring can delegate without changing the DOM the tests assert on.
// Content comes from copy.ts (S09) by ID, never typed here.
import type { JSX } from 'react';
import { C } from '../copy';

export default function NotfoundReadout(): JSX.Element {
  return (
    <>
      <h1 id="h-notfound">{C['C-404-H1']}</h1>
      <p>{C['C-404-P1']}</p>
    </>
  );
}
