#!/usr/bin/env node
// Agent map: the repo's own dependency graph and blast radius, with no
// third-party install. It is the in-repo fallback for code-review-graph
// `impact` and graphify `affected` (see agents/CODE-MAP.md), so any agent,
// local or cloud, can see what a change touches and which discipline,
// specs and gates that pulls in.
//
// Usage (from the repo root):
//   node tools/agent-map.mjs build                 write agents/map/deps.json
//   node tools/agent-map.mjs impact <file...>      blast radius of these files
//   node tools/agent-map.mjs impact --changed [base]  files changed vs base (default astryx-polish-r2)
//   node tools/agent-map.mjs seat <file...>        disciplines, specs, gates, tests for these files
//   node tools/agent-map.mjs include <file...>     --include list for a repomix pack of this task
//   options: --depth N (default 3), --json
//
// Edges are static imports: `import ... from 'x'`, `export ... from 'x'`,
// `import('x')`, and `import 'x'`, resolved for relative specifiers only
// (bare package imports are recorded as external, not followed). Generated
// files are nodes like any other, so a DESIGN.md token change shows up
// through src/tokens.generated.ts.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['src', 'tools', 'tests', 'themes/lane/laneTheme.mjs', 'vite.config.ts', 'playwright.config.ts', 'qa/polish-2'];
const EXT = /\.(ts|tsx|mjs|js|cjs)$/;
const RESOLVE_EXT = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx'];

const toPosix = (p) => p.split(sep).join('/');

function* walk(p) {
  const abs = join(root, p);
  if (!existsSync(abs)) return;
  if (statSync(abs).isFile()) { if (EXT.test(p)) yield toPosix(p); return; }
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const child = toPosix(join(p, e.name));
    if (e.isDirectory()) yield* walk(child);
    else if (EXT.test(e.name)) yield child;
  }
}

const IMPORT_RE = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

function resolveSpec(fromFile, spec) {
  const clean = spec.split('?')[0];
  if (!clean.startsWith('.')) return { external: clean };
  const base = toPosix(relative(root, resolve(root, dirname(fromFile), clean)));
  for (const ext of RESOLVE_EXT) {
    const cand = base + ext;
    if (existsSync(join(root, cand)) && statSync(join(root, cand)).isFile()) return { file: cand };
  }
  // .js specifiers that point at .ts sources
  const swapped = base.replace(/\.js$/, '.ts');
  if (existsSync(join(root, swapped))) return { file: swapped };
  return { missing: base };
}

function build() {
  const nodes = new Set();
  const edges = [];
  const external = {};
  for (const scan of SCAN) {
    for (const file of walk(scan)) {
      nodes.add(file);
      const text = readFileSync(join(root, file), 'utf8');
      for (const m of text.matchAll(IMPORT_RE)) {
        const spec = m[1] || m[2] || m[3];
        const r = resolveSpec(file, spec);
        if (r.file) { nodes.add(r.file); edges.push([file, r.file]); }
        else if (r.external) (external[file] ||= new Set()).add(r.external);
      }
    }
  }
  const ext = Object.fromEntries(Object.entries(external).map(([k, v]) => [k, [...v].sort()]));
  return { nodes: [...nodes].sort(), edges: edges.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1])), external: ext };
}

// Source edges that imports cannot see, in the same [dependent, dependency]
// orientation as import edges: generators read DESIGN.md and S09, so the
// generated files depend on them (tools/extract-tokens.mjs, extract-copy.mjs).
const SOURCE_EDGES = [
  ['src/tokens.generated.ts', 'spec/astryx/DESIGN.md'],
  ['src/styles/tokens.generated.css', 'spec/astryx/DESIGN.md'],
  ['themes/lane/tokens.generated.json', 'spec/astryx/DESIGN.md'],
  ['src/copy.ts', 'spec/astryx/specs/S09-copy-deck.md'],
  ['themes/lane/laneTheme.mjs', 'themes/lane/tokens.generated.json'],
];

function loadOwnership() {
  return JSON.parse(readFileSync(join(root, 'agents/ownership.json'), 'utf8'));
}

function globToRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
    else if (c === '*') re += '[^/]*';
    else if ('.+()^$|{}[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

function seatsFor(files, own) {
  const hits = [];
  for (const f of files) {
    for (const rule of own.rules) {
      if (rule.paths.some((g) => globToRe(g).test(f))) hits.push({ file: f, ...rule });
    }
  }
  return hits;
}

function impact(graph, files, depth) {
  const rev = new Map();
  for (const [a, b] of [...graph.edges, ...SOURCE_EDGES]) {
    if (!rev.has(b)) rev.set(b, new Set());
    rev.get(b).add(a);
  }
  const seen = new Map(files.map((f) => [f, 0]));
  let frontier = [...files];
  for (let d = 1; d <= depth && frontier.length; d++) {
    const next = [];
    for (const f of frontier) for (const dep of rev.get(f) || []) {
      if (!seen.has(dep)) { seen.set(dep, d); next.push(dep); }
    }
    frontier = next;
  }
  return [...seen.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
}

function changedFiles(base) {
  const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: root, encoding: 'utf8' });
  const wt = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  return [...new Set((out + wt + untracked).split('\n').filter(Boolean))];
}

const args = process.argv.slice(2);
const cmd = args.shift();
const flag = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const asJson = args.includes('--json'); if (asJson) args.splice(args.indexOf('--json'), 1);
const depth = Number(flag('--depth', '3'));

if (cmd === 'build') {
  const g = build();
  mkdirSync(join(root, 'agents/map'), { recursive: true });
  writeFileSync(join(root, 'agents/map/deps.json'), JSON.stringify({ generatedBy: 'node tools/agent-map.mjs build', sourceEdges: SOURCE_EDGES, ...g }, null, 1) + '\n');
  console.log(`agents/map/deps.json: ${g.nodes.length} nodes, ${g.edges.length} import edges, ${SOURCE_EDGES.length} source edges`);
} else if (cmd === 'impact' || cmd === 'seat' || cmd === 'include') {
  let files = args;
  if (args[0] === '--changed') files = changedFiles(args[1] || 'astryx-polish-r2');
  if (!files.length) { console.error('agent-map: no files given'); process.exit(1); }
  files = files.map((f) => toPosix(f).replace(/^\.\//, ''));
  const own = loadOwnership();
  const graph = build();
  const touched = cmd !== 'seat' ? impact(graph, files, depth) : files.map((f) => [f, 0]);
  const uniq = (xs) => [...new Set(xs)];
  const primarySeats = seatsFor(files, own);
  const radiusSeats = seatsFor(touched.map(([f]) => f), own);
  const primary = {
    disciplines: uniq(primarySeats.map((s) => s.discipline)),
    specs: uniq(primarySeats.flatMap((s) => s.specs)),
    notes: uniq(primarySeats.map((s) => s.notes).filter(Boolean)),
    needsJustin: uniq(primarySeats.filter((s) => s.needsJustin).map((s) => s.id)),
  };
  const radius = {
    disciplines: uniq(radiusSeats.map((s) => s.discipline)),
    gates: uniq(radiusSeats.flatMap((s) => s.gates)),
    tests: uniq(radiusSeats.flatMap((s) => s.tests || [])),
  };
  const unmapped = touched.map(([f]) => f).filter((f) => !radiusSeats.some((s) => s.file === f));
  const result = { input: files, depth: cmd === 'impact' ? depth : 0, touched: touched.map(([file, hop]) => ({ file, hop })), primary, radius, unmapped };
  if (cmd === 'include') {
    // Comma-separated list for `repomix --include`: the touched files plus
    // every spec path the primary seat names that exists in the repo.
    const specPaths = primary.specs.map((t) => t.split(' ')[0]).filter((t) => existsSync(join(root, t)));
    const always = ['AGENTS.md', 'spec/astryx/DESIGN.md', 'spec/astryx/specs/S09-copy-deck.md'];
    console.log(uniq([...always, ...specPaths, ...touched.map(([f]) => f)]).join(','));
  } else if (asJson) console.log(JSON.stringify(result, null, 1));
  else {
    console.log(`touched (${touched.length}):`);
    for (const [f, h] of touched) console.log(`  hop ${h}  ${f}`);
    console.log('primary (the files you change decide the specialization):');
    console.log(`  disciplines: ${primary.disciplines.join('; ') || 'none'}`);
    console.log(`  read specs:  ${primary.specs.join('; ') || 'none'}`);
    for (const n of primary.notes) console.log(`  rule:        ${n}`);
    if (primary.needsJustin.length) console.log(`  needs Justin: ${primary.needsJustin.join(', ')}`);
    console.log('blast radius (what the judge checks and which gates rerun):');
    console.log(`  disciplines: ${radius.disciplines.join('; ') || 'none'}`);
    console.log(`  gates:       ${radius.gates.join('; ') || 'none'}`);
    console.log(`  tests:       ${radius.tests.join('; ') || 'none'}`);
    if (unmapped.length) console.log(`unmapped (add a rule to agents/ownership.json): ${unmapped.join(', ')}`);
  }
} else {
  console.error('usage: node tools/agent-map.mjs build | include <files...> | impact <files...|--changed [base]> [--depth N] [--json] | seat <files...> [--json]');
  process.exit(1);
}
