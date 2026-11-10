# CODE-MAP.md: grounding agents in the code and its dependency structure

Version 1.0.0, 2026-11-10. Prose tells an agent what the project wants; the graph tells it what a change touches. This file says which tools give that graph, what was verified about each, and the in-repo fallback that always works.

## 1. What each tool is for

| Need | Tool | Seat that uses it |
|---|---|---|
| The code and the spec together in one file, with file paths, for an agent with no checkout | Repomix | any seat in browser Claude; the judge from another vendor |
| What a change touches (blast radius), callers, tests for a function | code-review-graph `impact`, `query` | judge, generate (before editing a hub) |
| Offline AST graph of the codebase, reverse traversal, hubs | Graphify `update`, `affected`, `god-nodes` | plan, coordinate, judge |
| The same blast radius with no install, mapped to specs and gates | `node tools/agent-map.mjs` | every seat |

## 2. Verification status (checked 2026-11-10)

None of the three third-party tools is installed in this repo or named in its docs, except Repomix. Installing code-review-graph and Graphify was refused by this cloud session's permission policy, so nothing below was run here; the commands are read from the published packages' source.

- **Repomix.** In use: `guestbook/repomix.xml` and `motion-design/repomix.xml` were packed with 1.18.1 from `~/workspace/tools/bin/repomix` on Justin's machine. The npm registry lists 1.19.0 (homepage github.com/yamadashy/repomix). Flags used in this repo: `--style xml --output <file> --include "<globs>" --ignore "<globs>"`.
- **code-review-graph.** PyPI `code-review-graph` 2.3.9, repository github.com/tirth8205/code-review-graph, summary "Local-first knowledge graph for token-efficient code review through MCP and CLI". Its CLI (`code_review_graph/cli.py`) has `build`, `update`, `impact` (`--files`, `--depth` default 2, `--max-results` default 500, `--base` default `HEAD~1`), `query` (`callers_of`, `callees_of`, `imports_of`, `importers_of`, `tests_for`, `file_summary` and others), `architecture`, `communities`, and `install` to register it as an MCP server. Parses with tree-sitter. Not run on this repo.
- **Graphify.** PyPI `graphifyy` (two y) 0.9.105, repository github.com/Graphify-Labs/graphify, command `graphify`. Its help text lists `update <path>` ("re-extract code files and update the graph (no LLM needed)"), `affected "X"` (reverse traversal to nodes impacted by X, `--depth` default 2), `query`, `path`, `explain`, `god-nodes`, writing to `graphify-out/graph.json`. Community labeling (`label`, `cluster-only`) calls an LLM backend; `update` with `--no-cluster` does not. Not run on this repo.

To adopt either tool, Justin approves the dependency (AGENTS.md section 4), then the commands below go into AGENTS.md section 5.

## 3. Commands (once approved and installed)

```
# Repomix: pack exactly what this task needs
npx repomix@1.19.0 --style xml --output task.xml --include "$(node tools/agent-map.mjs include <files...>)"

# code-review-graph: blast radius of the branch against its base
code-review-graph build
code-review-graph impact --base astryx-polish-r2 --depth 2
code-review-graph query tests_for src/world/camera.ts

# Graphify: AST graph without an LLM, then reverse traversal
graphify update . --no-cluster
graphify affected "src/world/types.ts" --depth 2
graphify god-nodes --top 10
```

## 4. The in-repo map (always available)

`tools/agent-map.mjs` builds a file-level graph from static imports in `src/`, `tools/`, `tests/` and configs, plus the generator edges imports cannot see (DESIGN.md feeds the token files, S09 feeds `src/copy.ts`). It writes `agents/map/deps.json` and answers:

- `impact <files>`: reverse dependents up to `--depth` (default 3), then the primary discipline (from the files you change) and the blast radius (disciplines, gates and tests to rerun), using `agents/ownership.json`.
- `impact --changed [base]`: the same for the current diff.
- `include <files>`: the `--include` list for a Repomix pack of this task.

The graph on 2026-11-10 (101 nodes, 190 import edges):

- Hubs by importers: `src/tokens.generated.ts` (40), `src/world/types.ts` (24), `src/copy.ts` (14), `src/world/tween.ts` (9), `src/router.ts` (8). A change to DESIGN.md reaches 44 files within two hops; that is why token changes go through `npm run gen` and the full gates.
- `src/world/lanefield.ts` has one importer (`src/main.tsx`). Scenes and chrome reach the engine through the `src/world/types.ts` contract and `window.__lanefield`, which imports do not show. For an engine change, run `impact` on `src/world/types.ts` too.
- `src/motion/entropy.ts` reaches 24 files within three hops; seed changes are wide.

Limits: file level, not symbol level; static imports only; `?raw` shader imports resolve to the shader file. For symbol-level callers and tests, use code-review-graph once approved.
