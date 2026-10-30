#!/usr/bin/env node
// G-TOKENS (S00 section 5.1 + section 6 unlayered-CSS rule).
// Scans src/**/*.{ts,tsx,css,glsl} excluding *.generated.*. Exit 1 on any
// violation, listing file:line for each.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const violations = [];

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|css|glsl)$/.test(e.name) && !/\.generated\./.test(e.name)) yield p;
  }
}

function stripBlockComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripLineComments(text) {
  return text.replace(/\/\/[^\n]*/g, '');
}

// Remove @layer blocks (balanced braces) from CSS, returning the remainder.
function stripLayerBlocks(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@layer', i);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);
    // Find the opening brace of the layer block (may be "@layer name {"
    // or "@layer name, other;"). If it ends with ';' there is no block.
    const semi = css.indexOf(';', at);
    const brace = css.indexOf('{', at);
    if (brace === -1 || (semi !== -1 && semi < brace)) {
      i = semi === -1 ? css.length : semi + 1;
      continue;
    }
    let depth = 0;
    let j = brace;
    while (j < css.length) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }
    i = j + 1;
  }
  return out;
}

for (const file of walk(srcDir)) {
  const rel = relative(root, file);
  const raw = readFileSync(file, 'utf8');
  const isCss = file.endsWith('.css');
  const isWorld = rel.startsWith('src/world/');
  const lines = raw.split('\n');
  lines.forEach((line, idx) => {
    const n = idx + 1;
    const fail = (rule) => violations.push(`${rel}:${n}: ${rule}: ${line.trim().slice(0, 100)}`);
    if (/#[0-9a-fA-F]{3,8}\b/.test(line)) fail('hex color literal');
    if (isCss && /\b\d+(\.\d+)?m?s\b/.test(line)) fail('duration literal in CSS');
    if (!isCss && /['"`][^'"`]*\b\d+(\.\d+)?m?s\b[^'"`]*['"`]/.test(line)) fail('duration literal in TS string');
    if (/cubic-bezier\(/.test(line)) fail('cubic-bezier outside generated file');
    if (/--duration-medium-max/.test(line)) fail('--duration-medium-max');
    if (/box-shadow\s*:[^;]*\b(?!inset\b)\w/.test(line) && !/box-shadow\s*:\s*inset/.test(line)) fail('box-shadow with non-inset value');
    if (/backdrop-filter/.test(line)) fail('backdrop-filter');
    if (/filter\s*:\s*blur/.test(line)) fail('filter: blur');
    if (/linear-gradient|radial-gradient/.test(line)) fail('gradient');
    if (/text-transform\s*:\s*uppercase/.test(line)) fail('text-transform: uppercase');
    if (isWorld && !line.includes('// lit-ok:')) {
      // Standalone numeric literals only: digits inside identifiers
      // (Int32Array, p50) are not literals. Other than 0, 1, 2, 0.5, -1
      // outside array indexes need // lit-ok:.
      const noStrings = line.replace(/(['"`])(?:\\\1|.)*?\1/g, '');
      const nums = noStrings.match(/(?<![A-Za-z0-9_$])-?\d+(?:\.\d+)?(?![A-Za-z0-9_$])/g) || [];
      const allowed = new Set(['0', '1', '2', '0.5', '-1']);
      const bad = nums.filter((x) => !allowed.has(x));
      // Heuristic: numbers inside [..] (array index) or for-loop bounds
      // are exempt; if the line is only such a use, skip. We approximate
      // by exempting lines whose bad numbers all sit inside brackets.
      if (bad.length > 0) {
        const bracketed = (noStrings.match(/\[[^\]]*\]/g) || []).join(' ');
        const outside = bad.filter((x) => {
          const inBracket = new RegExp(`\\[[^\\]]*\\b${x.replace('.', '\\.')}\\b[^\\]]*\\]`).test(bracketed);
          return !inBracket;
        });
        if (outside.length > 0) fail(`numeric literal in src/world (${outside.join(', ')}) without // lit-ok:`);
      }
    }
  });
  if (isCss) {
    const noComments = stripBlockComments(raw);
    let rest = stripLayerBlocks(noComments);
    // Allow @import lines and @font-face blocks outside layers.
    rest = rest.replace(/@import[^;]+;/g, '');
    rest = rest.replace(/@font-face\s*\{[^}]*\}/g, '');
    rest = rest.replace(/@charset[^;]+;/g, '');
    if (/[^\s{};][^{};]*\{/.test(rest)) {
      violations.push(`${rel}: unlayered CSS rule outside @layer blocks`);
    }
  }
}

if (violations.length > 0) {
  console.error('lint-tokens: violations found:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('lint-tokens: clean');
