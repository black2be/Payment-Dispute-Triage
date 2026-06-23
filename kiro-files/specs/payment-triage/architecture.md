# Architecture Document — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** Architect
**Aligned to:** `design.md`, `requirements.md` REQ-01–07. 3-tier baseline per the
uploaded `architecture.md` (Doc 1).

## Components

- Dispute Capture UI (React + Vite + Tailwind) — captures dispute details, validates mandatory fields, pre-populates from mock transaction lookup, renders the recommendation + summary on a single screen
- API Layer (Node.js + Express, TypeScript) — REST endpoints, input + enum validation, computes dispute age, orchestrates the rules engine, persists cases
- Rules Engine (pure TypeScript, in-process) — applies the six OM rules in precedence order (first match wins) to determine priority, recommended action, and the triggered-rule reasoning; imports neither Express nor Prisma
- Recommendation (decoupled) — generated via its own endpoint so the engine produces and the API can log a result even if the display is unavailable (REQ-05.5)
- Mock Data Store (SQLite + Prisma) — stores simulated customers, transactions, and dispute cases via seed scripts; local file, no network egress

## Data Model

- Customer — `id, name, accountNumber (mock token)` — has many Transaction, DisputeCase
- Transaction — `id, customerId, reference (unique), paymentType, amount, currency, status, transactionDate, description` — belongs to Customer; referenced by DisputeCase
- DisputeCase — `id, customerId, transactionId, paymentType, issueCategory, amount, description?, transactionDate, reportedAt, disputeAge, ageBand, priority, recommendedAction, triggeredRuleId, ruleEvaluations (Json), status (OPEN/IN_REVIEW/RESOLVED/CLOSED)` — belongs to Customer and Transaction

Notes: customer segment/risk intentionally omitted (OM rules don't use them). Enums
stored in code form (`UNAUTHORIZED_TRANSACTION`, `RESOLVE_IMMEDIATELY`); UI maps to
display labels. No PII/PCI — identifiers are mock tokens only.

## Integrations

- Core Banking (transaction/customer lookup) — Prisma seed data in SQLite — simulated
- Card Processing (card transaction records) — mock dataset — simulated
- Payments Platform (EFT / internal transfer records) — mock dataset — simulated
- Case Management — internal `DisputeCase` table — no external system
- Notifications — out of scope

## Key Decisions

- SQLite via Prisma — zero infrastructure, runs locally; a PostgreSQL move is a connection-string change
- Rules engine as an in-process TypeScript module — no network hop, pure and deterministic, trivial to unit-test
- First-match-wins rule evaluation — deterministic single output (REQ-04); priority is top-down highest-match-wins (REQ-03)
- Recommendation decoupled from creation (separate endpoint) — satisfies REQ-05.5 and lets the case persist independently
- Age bands from calendar days since the **transaction date** — Recent 0–7, Moderate 8–30, Aged >30 (REQ-02); the api-spec's age-from-submission was rejected
- Amount threshold at R10,000 for High priority / rule 3 — per OM requirements; the R25k/R50k variants were rejected
- Four recommended actions only (Resolve Immediately, Investigate Further, Escalate, Refer to Another Team) — the api-spec's 7-action set was not adopted
- Transaction reference lookup — enables form pre-population from mock data, falls back to manual status entry
- Thresholds as named constants — adjustable without modifying rule logic
- No authentication — single ops user assumed; auth would obscure the triage flow during evaluation
- Prisma is a library, not an MCP — keeps the approved-MCP list intact (`gov-mcp-guard`); SQLite is local, no egress
- Doc 2's enterprise scope (dashboard, segment/risk, extra entities) treated as future-state, not built
