---
inclusion: always
---

# Kiro Instructions — Payment Dispute Triage (read first)

You are building a **rules-based payment-dispute triage prototype** for a banking
operations user, under the **AI SDLC — Digital Platforms** governance framework.
This file orients you. The other steering files refine it. When they conflict,
the more specific file wins; if still unclear, ask in chat rather than guess.

## Prime directive

Help an operations user answer one question per case: *given this payment
dispute, what is the most appropriate next step right now?* — and always show
**why**. Optimise for a clear, well-scoped, demonstrable prototype over breadth.

## Non-negotiable guardrails

1. **Mock data only.** No live core-banking/card/case-management integrations.
   All "integrations" are mock seed data in a **local SQLite file** (Prisma) — no
   network egress from API or DB.
2. **Rules-based only.** No AI/ML in the decision path. Every recommendation comes
   from the named, ordered rules in `design.md` §3 and must be reproducible.
3. **No PII / PCI / secrets / external URLs** in source or data. Mock identifiers
   only. (`gov-pre-tool-use-audit` will block writes that contain them.)
4. **Approved tooling & MCP only.** Kiro + SuperClaude; the six approved MCP
   servers. **Prisma is a library, not an MCP** — don't add it to `mcp.json`. Do
   not add tools/MCP servers, disable hooks, or generate destructive/deploy
   commands.
5. **Every commit references an assigned Jira key** so it clears commit validation.

## Where everything lives

| You need… | Read |
| --- | --- |
| What/why/scope | `product.md` |
| Stack & hard constraints | `tech.md` |
| File layout & naming | `structure.md` |
| Coding & rules-engine patterns | `conventions.md` |
| Governance gates | `governance.md` |
| Test expectations (auto when a test file is open) | `testing-standards.md` |
| Service/API contract (load with `#api-standards`) | `api-standards.md` |
| **What to build** | `#[requirements.md](../specs/payment-triage/requirements.md)` |
| **How to build it** | `#[design.md](../specs/payment-triage/design.md)` |
| **In what order** | `#[tasks.md](../specs/payment-triage/tasks.md)` |
| Reusable screen builder | skill `react-page-from-ui-spec` |

## How to work

1. **Drive from the spec.** Execute `tasks.md` top to bottom (it follows the OM
   source's execution waves). Each task names the REQ it satisfies — keep that
   traceability.
2. **Engine + data first, then API, then UI.** Build the Prisma schema/seed and
   the pure `server/src/engine/` (types → ageCalculator → priorityCalculator →
   actionRecommender → triage) with property tests, then the Express API, then the
   React client.
3. **Test as you go.** A task is done only when its Vitest suite is green
   (`gov-post-task-test`). The worked examples in `design.md` §3.5 (cases A–G)
   must always pass.
4. **Respect the layering rule:** `client → server routes/middleware → engine +
   Prisma` (on the `node-conf-starter` monorepo). The engine
   (`server/src/engine/`) is pure — it imports neither Express, Prisma, nor React.
5. **Stay deterministic.** Same input + same `today` → same recommendation.
   Action rules are first-match-wins (R1→R6); priority is highest-match-wins.
   Inject `today`; no `Date.now()`, uncontrolled randomness, or network in the
   engine.
6. **Surface conflicts.** If a request would breach a guardrail, stop and say so —
   don't work around it.

## Definition of done

All requirements REQ-01–07 have passing acceptance tests; the engine reproduces
cases A–G; the demo shows all four actions (Resolve Immediately, Investigate
Further, Escalate, Refer to Another Team) with reasoning on a single screen;
`ai-sdlc check --report` is clean; the final PR passed `gov-pre-commit-review`
against an assigned Jira ticket.
