# Implementation Plan — Payment Dispute Triage

**Feature:** `payment-triage`
**Requirements:** Confluence *Use Case 1* (OM), REQ-01–07.
**Architecture:** 3-tier — React + Vite + Tailwind UI · Node/Express API · SQLite
+ Prisma (per `architecture.md`, Doc 1).
**Owner role:** Facilitator (sequencing); tasks assigned per role.
**Approach:** Build **engine + data first**, then API, then UI, then integration.
The Rules Engine stays pure TS, called in-process by the API. Tests marked `*`
are property-based (fast-check) or unit/integration tests.

Every commit references the assigned Jira key (clears `gov-pre-tool-use-audit`).

---

## Phase 0 — Governed setup (Harness Engineer)

- [ ] 0.1 `ai-sdlc install`; `ai-sdlc check` passes per workstation. _(governance)_
- [ ] 0.2 Confirm steering loads in Kiro; create + assign the Jira ticket. _(governance)_
- [ ] 0.3 Confirm **no Prisma MCP** is added to `mcp.json` — Prisma is a library
      only (`gov-mcp-guard`). _(governance)_

## Phase 1 — Workspace & types

- [ ] 1.1 Scaffold monorepo: `client/` (React+Vite+Tailwind), `server/`
      (Express+TS), shared `server/src/engine/`. Install Vitest, fast-check,
      @testing-library/react, Prisma, Express. _(REQ-06)_
- [ ] 1.2 Define domain types + the **enum code↔label map** (`engine/types.ts`,
      `client/src/labels.ts`) per design §2.1. _(REQ-01)_

## Phase 2 — Data store (SQLite + Prisma)

- [ ] 2.1 `prisma/schema.prisma`: Customer, Transaction, DisputeCase + enums
      (design §2.2). `prisma migrate dev` to create the local SQLite DB. _(REQ-06)_
- [ ] 2.2 `prisma/seed.ts`: 15–20 transactions across all payment types,
      statuses, and Recent/Moderate/Aged dates; linked customers. No PII/PCI. _(REQ-06)_
- [ ] 2.3 `*` Property 7 — `lookupTransaction(ref)`: ref in seed → record; not in
      seed → null. _(REQ-06)_

## Phase 3 — Rules Engine (pure TS)

- [ ] 3.1 `engine/ageCalculator.ts` — `calculateAge` (throw on future) +
      `classifyAgeBand` (0–7 / 8–30 / >30). _(REQ-02)_
- [ ] 3.2 `*` P1 age calc, `*` P2 future-date rejection. _(REQ-02)_
- [ ] 3.3 `engine/priorityCalculator.ts` — `determinePriority` High→Medium→Low→
      default Medium (design §3.2). _(REQ-03)_
- [ ] 3.4 `*` P3 priority assignment incl. evaluation order. _(REQ-03)_
- [ ] 3.5 `engine/actionRecommender.ts` — 6 rules R1→R6, first match wins;
      returns action + triggeredRuleId + ruleEvaluations + reason. _(REQ-04, REQ-05)_
- [ ] 3.6 `*` P4 determinism, `*` P5 precedence. _(REQ-04)_
- [ ] 3.7 `engine/triage.ts` orchestrator; assert worked examples A–G (design
      §3.4) table-driven. _(REQ-03, REQ-04)_

## Phase 4 — Engine checkpoint

- [ ] 4.1 All engine tests green before API/UI (`gov-post-task-test`). _(verification)_

## Phase 5 — Validation + API (Node/Express)

- [ ] 5.1 `engine/validation.ts` — mandatory fields, future date, positive amount
      → field-level errors. _(REQ-01, REQ-02)_
- [ ] 5.2 `*` P6 validation completeness. _(REQ-01)_
- [ ] 5.3 Express app + routes/controllers: `GET /api/transactions/:reference`,
      `POST /api/disputes` (validate → triage → persist via Prisma → 201),
      `GET /api/disputes/:id`, `GET /api/disputes`, `GET /api/health`. _(REQ-04, REQ-05, REQ-06)_
- [ ] 5.4 `*` API integration tests (supertest): lookup hit/miss; create dispute
      returns correct recommendation + persists; future date → 400; missing field
      → 400. _(REQ-01, REQ-04, REQ-06)_

## Phase 6 — UI (React + Vite + Tailwind)

- [ ] 6.1 `DisputeForm.tsx` — fields + dropdowns (label map), reference lookup
      pre-populates status, manual status on miss, inline validation. _(REQ-01, REQ-06)_
- [ ] 6.2 `DisputeSummary.tsx` — all attributes incl. age band + priority. _(REQ-07)_
- [ ] 6.3 `RecommendationPanel.tsx` — action label, rule-evaluation list with
      triggered rule highlighted, priority + age badges, plain-language reason. _(REQ-05)_
- [ ] 6.4 `*` Component tests: fields render, dropdown options correct,
      recommendation shows required info. _(REQ-01, REQ-05, REQ-07)_

## Phase 7 — Integration

- [ ] 7.1 `App.tsx` — submit → `POST /api/disputes` → summary + recommendation on
      one screen (no navigation). _(REQ-04, REQ-07)_
- [ ] 7.2 `*` End-to-end: submit a dispute, verify recommendation + single-screen
      summary; verify case persisted. _(REQ-04, REQ-07)_

## Phase 8 — Final checkpoint + governance + demo

- [ ] 8.1 All tests green; client + server run. _(verification)_
- [ ] 8.2 `gov-cve-build-gate` clean (scan React/Express/Prisma/etc.); review CVEs. _(governance)_
- [ ] 8.3 Grep source/seed for PII, card numbers, secrets, external URLs — none. _(governance)_
- [ ] 8.4 `gov-pre-commit-review`; `ai-sdlc check --report`. _(governance)_
- [ ] 8.5 Demo dry-run: drive cases A–G so all four actions appear; show a
      persisted case via `GET /api/disputes/:id`. _(REQ-04, REQ-05)_

---

## Execution waves (parallelisable)

| Wave | Tasks |
| --- | --- |
| 0 | 1.1 |
| 1 | 1.2, 2.1 |
| 2 | 2.2, 3.1, 3.3, 5.1 |
| 3 | 2.3, 3.2, 3.4, 3.5, 5.2 |
| 4 | 3.6, 3.7, 5.3 |
| 5 | 4.1, 5.4, 6.1 |
| 6 | 6.2, 6.3 |
| 7 | 6.4, 7.1 |
| 8 | 7.2 |

## Role ownership

| Phase | Lead | Supporting |
| --- | --- | --- |
| 0 Setup | Harness Engineer | Facilitator |
| 1–2 Types + data store | Architect | API Designer |
| 3–4 Engine | Architect | Quality Engineer |
| 5 Validation + API | API Designer | Architect, QE |
| 6 UI | UI/UX Designer | — |
| 7 Integration | UI/UX Designer | API Designer |
| 8 Verify + demo | Facilitator | Harness Engineer, QE |

## Definition of done

REQ-01–07 each have passing acceptance tests; the engine reproduces cases A–G;
disputes persist to SQLite and are retrievable via the API; the demo shows all
four actions with reasoning on a single screen; `ai-sdlc check --report` is clean;
the final PR passed `gov-pre-commit-review` against an assigned Jira ticket.
