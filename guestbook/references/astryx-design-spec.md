# SPEC — local-astryx-design skill

Written 2026-10-18 before build. Justin's ask: use Astryx (Meta's MIT design
system, CLI-first) as the design substrate for agents, alongside the existing
design-extract pipeline, without producing slop and without the substrate
showing through in the output.

## Load-bearing decisions
1. Astryx is the FLOOR, design-extract is the CEILING. The skill mandates
   extract-first ordering (AGENTS.md doctrine); Astryx never replaces reference
   extraction. Tokens/components give discipline; the style brief gives taste.
2. Raw templates are banned as shipped output. `template copy` is starting
   clay only; the ownership path (swizzle/eject/theme build) is required
   before anything people-facing.
3. Substrate-invisibility is an explicit rule: default accent (#0064E0),
   default neutral theme, and default radius/easing ladder may not ship
   unmodified. The personal theme is the mechanism.
4. Version pinning is mandatory. CLI is beta (0.7.1 verified 2026-10-18),
   drifts fast; every command example pins `@<version>`. `upgrade` codemods
   are the bump path.
5. Reads are split by context: `search`, `docs`, `template --list`,
   `theme list` work with zero project setup; `component`, `hook`,
   `swizzle`, `theme targets`/`build` need `@astryxdesign/core` resolvable
   from cwd. The skill teaches both and fails loudly otherwise
   (ERR_CORE_NOT_FOUND is the signal, not a bug).
6. Error handling: branch on the stable `code` field, never the prose.

## Open build-time calls (settled during build)
- Skill name: `local-astryx-design` (matches repo convention).
- Format follows `local-design-extract/SKILL.md`: Purpose / When to use /
  Workflow / Command reference / Operating rules / Provenance.
- No bin/ scripts: the CLI is the instrument; the skill is a playbook.
  A wrapper script adds nothing the CLI's own --json doesn't already give.

## Kill criteria
- If `npx @astryxdesign/cli` stops resolving or the JSON envelope shape
  changes (apiVersion bump), the command reference section is stale and the
  skill must be re-verified before use. `astryx manifest --json` is the
  re-verification entry point.
