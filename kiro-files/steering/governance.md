---
inclusion: always
---

# Governance — AI SDLC alignment

This project runs under the **AI SDLC — Digital Platforms** framework. Kiro must
respect these guardrails at all times. They are enforced by hooks, but treat them
as design constraints, not just gates.

## Always-true constraints

- **Mock-only.** No calls to core banking, card processing, case management, or
  any external service. The app is fully client-side with in-memory data.
- **No AI/ML in the decision path.** Triage decisions come only from the named,
  ordered rules in `design.md` §3.
- **No PII / PCI / secrets / external URLs** in source or data. `gov-pre-tool-use-audit`
  blocks writes containing them.
- **Approved tooling only:** Kiro IDE (Claude via Bedrock af-south-1) and
  SuperClaude. No Cursor/Windsurf/Aider/Continue, no Claude/OpenAI/Anthropic CLI.
- **Approved MCP servers only:** sequential-thinking, serena, aws-mcp,
  atlassian-rovo-mcp, aws-docs, playwright. `gov-mcp-guard` enforces the list on
  any `mcp.json` save — do not add others.

## Gate-aware behaviour

| Gate | Implication for Kiro |
| --- | --- |
| `gov-pre-tool-use-audit` | Don't generate destructive commands, deployments, or banned-API calls. Every commit needs a valid, assigned Jira key. |
| `gov-cve-build-gate` / `gov-cve-dep-change` | Keep dependencies minimal; malware blocks the build, CRITICAL/HIGH CVEs warn. Justify any new dep. |
| `gov-pre-commit-review` | Run before every PR. |
| `gov-post-task-test` | Each completed task should leave the Vitest suite green. |

## Compliance mapping

ISO/IEC 42001:2023 · NIST AI RMF 1.0 · PCI DSS v4.0 (no PCI in prompts/logs) ·
POPIA (no PII; data sovereignty af-south-1). Generate evidence with
`ai-sdlc check --report`.

## If a request conflicts with a guardrail

Stop and surface the conflict in chat rather than working around it. The Harness
Engineer decides; never disable a hook or add an unapproved tool to satisfy a
task.
