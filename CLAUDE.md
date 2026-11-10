@AGENTS.md

## Claude Code

- Derive the seat first (AGENTS.md section 1). Generate, plan and coordinate stay in this session; judge, retrieve and run go to the seat files in `.claude/agents/`.
- The judge seat (`judge`) is read-only and runs in its own context. Use it before any PR leaves draft, after any generation, and on any spec up for approval. Never judge your own run in the same context.
- G-ANTI goes to `taste-judge`, which skips this file and reads only the screenshots and questions you give it.
- Effort follows agents/ROUTING.md: `/effort high` for greenfield generation; low for lookups.
- Rules that must never bend (no deploy, no merge, no force push) belong in hooks or deny rules, not in prose. None are configured in this repo yet.
