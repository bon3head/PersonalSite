#!/usr/bin/env node
// Copy Commit Mono font files from the @fontsource package into public/fonts/.
// S00 section 3: commit-mono-latin-{200,400,700}-normal.woff2 and
// commit-mono-latin-400-normal.woff.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'node_modules/@fontsource/commit-mono/files');
const out = join(root, 'public/fonts');
mkdirSync(out, { recursive: true });

const files = [
  'commit-mono-latin-200-normal.woff2',
  'commit-mono-latin-400-normal.woff2',
  'commit-mono-latin-700-normal.woff2',
  'commit-mono-latin-400-normal.woff',
];
for (const f of files) {
  const src = join(pkg, f);
  if (!existsSync(src)) {
    console.error(`copy-fonts: missing ${src} (run npm ci first)`);
    process.exit(1);
  }
  copyFileSync(src, join(out, f));
}
console.log(`copy-fonts: copied ${files.length} files to public/fonts/`);
