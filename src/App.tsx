import type { JSX } from 'react';
import { C } from './copy';

export default function App(): JSX.Element {
  return (
    <main>
      <h1 className="srv-h1">{C['C-SRV-H1']}</h1>
    </main>
  );
}
