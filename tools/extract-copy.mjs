#!/usr/bin/env node
// S09 section 4 table -> src/copy.ts exporting C keyed by ID.
// Links become {label, href}. Fails (exit 1) on duplicate IDs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const s09 = readFileSync(join(root, 'spec/astryx/specs/S09-copy-deck.md'), 'utf8');

// Section 4 runs from "## 4. The table" to the next "## " heading.
const section = s09.split('## 4. The table')[1];
if (!section) {
  console.error('extract-copy: section 4 not found in S09-copy-deck.md');
  process.exit(1);
}
const table = section.split('\n## ')[0];
const rows = table.split('\n').filter((l) => l.startsWith('| ') && !l.includes('| ID |') && !l.includes('---'));

const entries = [];
const seen = new Set();
for (const row of rows) {
  // Split on pipes; cells may contain backticked code with no pipes inside.
  const cells = row.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length < 3) continue;
  const [id, , raw] = cells;
  if (seen.has(id)) {
    console.error(`extract-copy: duplicate ID ${id}`);
    process.exit(1);
  }
  seen.add(id);
  entries.push([id, raw]);
}

// Link rows: label `X`, href `URL` pattern, or "href as <other id>".
const out = [];
for (const [id, str] of entries) {
  const linkMatch = str.match(/^label `([^`]+)`, href `([^`]+)`$/);
  const aliasMatch = str.match(/^label `([^`]+)`, href as (\S+)$/);
  if (linkMatch) {
    out.push(`  '${id}': { label: ${JSON.stringify(linkMatch[1])}, href: ${JSON.stringify(linkMatch[2])} },`);
  } else if (aliasMatch) {
    // Resolve alias at generation time: the aliased entry must itself be a link.
    const target = entries.find(([eid]) => eid === aliasMatch[2]);
    if (!target) {
      console.error(`extract-copy: ${id} aliases unknown ID ${aliasMatch[2]}`);
      process.exit(1);
    }
    const tLink = target[1].match(/^label `([^`]+)`, href `([^`]+)`$/);
    if (!tLink) {
      console.error(`extract-copy: ${id} aliases non-link ID ${aliasMatch[2]}`);
      process.exit(1);
    }
    out.push(`  '${id}': { label: ${JSON.stringify(aliasMatch[1])}, href: ${JSON.stringify(tLink[2])} },`);
  } else if (str.startsWith('key `') && str.includes('`, label `')) {
    const km = str.match(/^key `([^`]+)`, label `([^`]+)`$/);
    if (!km) {
      console.error(`extract-copy: unparsable key row ${id}: ${str}`);
      process.exit(1);
    }
    out.push(`  '${id}': { key: ${JSON.stringify(km[1])}, label: ${JSON.stringify(km[2])} },`);
  } else if (/`[^`]+` \(coarse pointer\) \/ `[^`]+` \(fine pointer\)/.test(str)) {
    const hm = str.match(/^`([^`]+)` \(coarse pointer\) \/ `([^`]+)` \(fine pointer\)$/);
    if (!hm) {
      console.error(`extract-copy: unparsable hint row ${id}: ${str}`);
      process.exit(1);
    }
    out.push(`  '${id}': { coarse: ${JSON.stringify(hm[1])}, fine: ${JSON.stringify(hm[2])} },`);
  } else {
    // Plain string: unwrap if the whole cell is backtick-quoted.
    const wrapped = str.match(/^`([^`]*)`$/);
    out.push(`  '${id}': ${JSON.stringify(wrapped ? wrapped[1] : str)},`);
  }
}

mkdirSync(join(root, 'src'), { recursive: true });
const header = '// GENERATED from spec/astryx/specs/S09-copy-deck.md section 4. Do not edit.\n';
writeFileSync(
  join(root, 'src/copy.ts'),
  `${header}export const C = {\n${out.join('\n')}\n} as const;\n\nexport type CopyId = keyof typeof C;\n`,
);
console.log(`extract-copy: wrote ${entries.length} entries to src/copy.ts`);
