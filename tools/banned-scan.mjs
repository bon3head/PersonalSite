#!/usr/bin/env node
// G-COPY part (S00 section 5.2). Scans a directory for banned patterns
// (case-insensitive), one pattern per line in tools/banned.txt.
// Exception: the exact substrings "WebSocket live feed" and "on a live map"
// are allowed (LeafLink product strings C-LL-STACK, C-LL-P1); nothing else
// containing "live" is. Scanning dist/ scans text content of HTML and
// string literals of JS (simple extraction: everything between quotes or
// between tags). Usage: node tools/banned-scan.mjs <dir>.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) {
  console.error('banned-scan: usage: node tools/banned-scan.mjs <dir>');
  process.exit(1);
}
const target = join(root, dir);

const bannedRaw = readFileSync(join(root, 'tools/banned.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith('#'));

const ALLOWED_LIVE = ['WebSocket live feed', 'on a live map'];

function extractText(file, content) {
  if (file.endsWith('.html')) {
    // Text between tags.
    return content.replace(/<[^>]*>/g, ' ');
  }
  if (file.endsWith('.js') || file.endsWith('.mjs')) {
    // String literals: everything between quotes.
    const lits = [];
    const re = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`/g;
    let m;
    while ((m = re.exec(content)) !== null) lits.push(m[0]);
    return lits.join(' ');
  }
  return content;
}

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

const violations = [];
for (const file of walk(target)) {
  if (!/\.(ts|tsx|js|mjs|css|html)$/.test(file)) continue;
  // The banned list itself and the scanner are exempt.
  if (file.endsWith('tools/banned.txt') || file.endsWith('tools/banned-scan.mjs')) continue;
  let content = readFileSync(file, 'utf8');
  // Mask the two allowed "live" substrings before scanning.
  for (const ok of ALLOWED_LIVE) {
    content = content.split(ok).join(' ');
  }
  const text = extractText(file, content);
  for (const pattern of bannedRaw) {
    const re = new RegExp(pattern, 'i');
    if (re.test(text)) {
      violations.push(`${file}: banned pattern /${pattern}/`);
    }
  }
}

if (violations.length > 0) {
  console.error('banned-scan: violations found:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log(`banned-scan: clean (${target})`);
