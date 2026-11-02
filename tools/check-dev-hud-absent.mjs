#!/usr/bin/env node
// T-DEV-1 (P-DEV-1): the dev HUD must be absent from the production
// bundle. Scans a build output directory for HUD markers and exits
// nonzero if any marker is found, so a leaking HUD fails the build
// instead of shipping. Markers: the HUD element id, the mount
// function name, the dev module path, and the dev gate query.
// Usage: node tools/check-dev-hud-absent.mjs [dir, default dist]
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] ?? 'dist';
const target = join(root, dir);

const MARKERS = ['jp-dev-hud', 'mountDevHud', 'src/dev/hud', 'data-dev-hud'];

function* walk(d) {
  let entries;
  try {
    entries = readdirSync(d, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const hits = [];
let scanned = 0;
for (const file of walk(target)) {
  if (!/\.(html|js|css|json)$/.test(file)) continue;
  scanned += 1;
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const m of MARKERS) {
    if (content.includes(m)) hits.push(`${file}: marker ${m}`);
  }
}

if (hits.length > 0) {
  console.error('check-dev-hud-absent: HUD markers found in production bundle:');
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log(`check-dev-hud-absent: ok, ${scanned} files scanned in ${dir}, no HUD markers`);
