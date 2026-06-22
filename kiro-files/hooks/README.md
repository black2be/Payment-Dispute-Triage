# Hooks

Project automation hooks (Harness Engineer owned). These supplement — never
replace or disable — the AI SDLC governance hooks (`gov-*`).

| Hook | Trigger | Purpose |
| --- | --- | --- |
| `lint-on-save` | Save `src/**/*.ts(x)` | ESLint + safe auto-fixes |
| `typecheck-on-save` | Save `src/**/*.ts(x)` | `tsc --noEmit` strict |
| `test-on-change` | Save domain/service/test files | Run related Vitest suite |

## Notes

- These `*.kiro.hook` files describe trigger + agent action. Import/enable them in
  the Kiro **Agent Hooks** panel; in Kiro the canonical definition is created via
  the panel, and these files are the version-controlled record.
- The governance `gov-*` hooks (pre-tool-use audit, CVE gate, MCP guard, pre-commit
  review, deployment gate) are installed by `ai-sdlc install` and live in
  `~/.kiro/hooks/`. Do not duplicate or override them here.
- A "docs-on-change" hook (auto-update docs when code changes) can be added later;
  keep it manual at first to avoid noisy churn during the hackathon.
