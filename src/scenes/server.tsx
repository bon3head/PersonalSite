// Server scene readout content (S05 section 3.3, S04 section 6).
// The copy IDs are C-SRV-H1/P1/P2/P3 from S09; no links on this
// readout (the keymap carries navigation, the whoami sheet carries
// profile links). B4's chrome Readout currently inlines this same
// content for the server variant; this module is the canonical
// server-scene content component, and the coordinator may wire
// Readout to import it (see BUILD-STATE.md request).
import type { JSX } from 'react';
import { C } from '../copy';

export default function ServerReadoutContent(): JSX.Element {
  return (
    <>
      <h1 id="h-server">{C['C-SRV-H1']}</h1>
      <p>{C['C-SRV-P1']}</p>
      <p>{C['C-SRV-P2']}</p>
      <p>{C['C-SRV-P3']}</p>
    </>
  );
}
