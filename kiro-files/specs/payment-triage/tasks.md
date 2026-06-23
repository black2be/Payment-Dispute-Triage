# Implementation Plan — Payment Dispute Triage

**Feature:** `payment-triage`
**Requirements:** Confluence *Use Case 1* (OM), REQ-01–07.
**Architecture:** 3-tier on the **`node-conf-starter`** monorepo — React + Vite +
Tailwind `client/` · Node/Express (ESM) `server/` · SQLite + Prisma in
`server/prisma/`.
**Owner role:** Facilitator (sequencing); tasks assigned per role.
**Approach:** Clone the starter, then build **engine + data first**, then API,
then UI, then integration. The Rules Engine stays pure TS, called in-process by
the API. Tests marked `*` are property-based (fast-check), unit, integration, or
Playwright e2e.

Every commit references the assigned Jira key (clears `gov-pre-tool-use-audit`).

---

## Phase 0 — Governed setup (Harness Engineer)

- [ ] 0.1 `ai-sdlc install`; `ai-sdlc check` passes per workstation. _(governance)_
- [ ] 0.2 Confirm steering loads in Kiro; create + assign the Jira ticket. _(governance)_
- [ ] 0.3 Confirm **no Prisma MCP** is added to `mcp.json` — Prisma is a library
      only (`gov-mcp-guard`). _(governance)_

## Phase 1 — Base the repo on the starter

- [ ] 1.1 Use **`thandog/node-conf-starter`** as the base (clone/"Use this
      template"); keep `.kiro/` + `kiro-files/` at the root. `nvm use` (Node 22),
      `npm install` at root (workspaces set up `server/` + `client/`). _(setup)_
- [ ] 1.2 Remove the starter's sample endpoints (`/api/info`, `/api/echo`); keep
      `/health`, `/api/health`. Confirm `npm run dev` runs both apps (client 5173,
      server 3001, Vite proxies `/api/*`). _(setup)_
- [ ] 1.3 Add deps: `fast-check`, `supertest` (server, dev). Playwright already in
      the starter. Define domain types + the **enum code↔label map**
      (`server/src/engine/types.ts`, `client/src/labels.ts`) per design §2.1. _(REQ-01)_

## Phase 2 — Data store (SQLite + Prisma in `server/prisma/`)

- [ ] 2.1 `server/prisma/schema.prisma`: Customer, Transaction, DisputeCase +
      enums (design §2.2). `npm run db:generate && npm run db:migrate
      --workspace=server` to create the local SQLite DB. _(REQ-06)_
- [ ] 2.2 `server/prisma/seed.ts`: 15–20 transactions across all payment types,
      statuses, and Recent/Moderate/Aged dates; linked customers. No PII/PCI. _(REQ-06)_
- [ ] 2.3 `*` Property 7 — `lookupTransaction(ref)`: ref in seed → record; not in
      seed → null. _(REQ-06)_

## Phase 3 — Rules Engine (pure TS, `server/src/engine/`)

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
      §3.4) table-driven. Engine tests live in `server/tests/`. _(REQ-03, REQ-04)_

## Phase 4 — Engine checkpoint

- [ ] 4.1 All engine tests green before API/UI (`gov-post-task-test`). _(verification)_

## Phase 5 — Validation + API (Node/Express)

- [ ] 5.1 `engine/validation.ts` — mandatory fields, future date, positive amount,
      **enum membership** (reject injected unsupported Payment_Type/Issue_Category,
      TC-042/043) → field-level errors. _(REQ-01, REQ-02)_
- [ ] 5.2 `*` P6 validation completeness. _(REQ-01)_
- [ ] 5.3 Express `routes/` + `middleware/` (design §4): reference data
      (`GET /api/customers`·`/:id`, `GET /api/transactions`·`/:reference`);
      disputes (`POST /api/disputes` validate→age/priority→persist OPEN;
      `GET /api/disputes` + filters; `GET /api/disputes/:id`;
      `GET /api/disputes/:id/recommendation` runs the 6 OM rules, decoupled;
      `PATCH /api/disputes/:id/status` lifecycle extension); keep starter `/health`,
      `/api/health`. Error-handling middleware returns `400 {errors[]}`. _(REQ-01, REQ-04, REQ-05, REQ-06)_
- [ ] 5.4 `*` API integration tests (supertest, `server/tests/`): customer/
      transaction lookup hit/miss; create persists with correct priority/age;
      recommendation endpoint returns the correct action for cases A–G; future date
      → 400; missing/invalid-enum field → 400; status PATCH transitions. _(REQ-01, REQ-04, REQ-06)_

## Phase 6 — UI (React + Vite + Tailwind, `client/`)

- [ ] 6.1 `DisputeForm.tsx` — fields + dropdowns (label map), reference lookup
      pre-populates status, manual status on miss, inline validation. _(REQ-01, REQ-06)_
- [ ] 6.2 `DisputeSummary.tsx` — all attributes incl. age band + priority. _(REQ-07)_
- [ ] 6.3 `RecommendationPanel.tsx` — action label, rule-evaluation list with
      triggered rule highlighted, priority + age badges, plain-language reason. _(REQ-05)_
- [ ] 6.4 `*` Component tests (Vitest + Testing Library, `client/tests/`): fields
      render, dropdown options correct, recommendation shows required info. _(REQ-01, REQ-05, REQ-07)_

## Phase 7 — Integration

- [ ] 7.1 `App.tsx` — submit → `POST /api/disputes` → `GET /:id/recommendation`
      → render summary + recommendation on one screen (no navigation). _(REQ-04, REQ-07)_
- [ ] 7.2 `*` Playwright e2e (`client/e2e/`): submit a dispute, verify the
      recommendation + single-screen summary; verify the case persisted via the
      API. `npm run test:e2e`. _(REQ-04, REQ-07)_

## Phase 8 — Final checkpoint + governance + demo

- [ ] 8.1 `npm test` (both workspaces) + `npm run test:e2e` green; `npm run dev`
      runs client + server. _(verification)_
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
