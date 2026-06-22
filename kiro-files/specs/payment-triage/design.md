# Design — Payment Dispute Triage

**Feature:** `payment-triage`
**Requirements source:** Confluence — *Use Case 1* (space OM), REQ-01–07.
**Architecture baseline:** uploaded `architecture.md` (Doc 1) — 3-tier React +
Express + SQLite/Prisma.
**Owner roles:** Architect (system + data model), API Designer (endpoints),
UI/UX Designer (components + flows)
**Status:** Aligned to OM requirements + Doc 1 architecture

---

## 1. Architecture (3-tier)

```
┌──────────────── Dispute Capture UI (React + Vite + Tailwind) ─────────────────┐
│   DisputeForm   │   DisputeSummary   │   RecommendationPanel   │   App         │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ REST / JSON (fetch)
                                ▼
┌──────────────────────── API Layer (Node.js + Express) ────────────────────────┐
│  routes → controllers → validation → triage()                                  │
│  Rules Engine (pure TypeScript, in-process — no network hop)                    │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ Prisma Client
                                ▼
┌──────────────────────── Mock Data Store (SQLite via Prisma) ──────────────────┐
│   Customer   │   Transaction   │   DisputeCase   (seeded via script)           │
└────────────────────────────────────────────────────────────────────────────────┘
```

Key decisions (from Doc 1, reconciled with the OM canonical):

- **Rules Engine is an in-process TypeScript module** called by the API — no
  network hop, pure and deterministic, trivial to unit-test. The engine never
  imports Express or Prisma.
- **SQLite via Prisma** — zero infrastructure, runs locally; a future PostgreSQL
  move is a connection-string change. The DB is local-only; **no network egress**.
- **Persisting the DisputeCase satisfies REQ-05.5**: the recommendation is
  produced and stored even if the display is unavailable.
- **No authentication** — a single ops user is assumed; auth would obscure the
  triage flow during evaluation.
- Thresholds are **named constants**, adjustable without touching rule logic.

> **Governance note:** Prisma is used as an **npm library**, not as an MCP server.
> Do **not** add a Prisma MCP to `mcp.json` — it is not on the approved list and
> `gov-mcp-guard` will block it. SQLite is a local file; no external connections.

---

## 2. Data model (Architect)

### 2.1 Enum mapping (code ↔ display label)

Prisma enum values must be identifier-safe, so the **DB and API use the code
form**; the **UI renders the OM glossary label** via a single `labels.ts` map.
Spelling follows the OM glossary (American `Unauthorized`).

| Enum | Code (DB/API) | Label (UI) |
| --- | --- | --- |
| PaymentType | `CARD_PAYMENT` / `EFT` / `INTERNAL_TRANSFER` | Card Payment / EFT / Internal Transfer |
| IssueCategory | `DUPLICATE_DEBIT` / `FAILED_TRANSFER` / `MISSING_PAYMENT` / `UNAUTHORIZED_TRANSACTION` | Duplicate Debit / Failed Transfer / Missing Payment / Unauthorized Transaction |
| TransactionStatus | `COMPLETED` / `PENDING` / `FAILED` / `REVERSED` | Completed / Pending / Failed / Reversed |
| AgeBand | `RECENT` / `MODERATE` / `AGED` | Recent / Moderate / Aged |
| Priority | `HIGH` / `MEDIUM` / `LOW` | High / Medium / Low |
| RecommendedAction | `RESOLVE_IMMEDIATELY` / `INVESTIGATE_FURTHER` / `ESCALATE` / `REFER_TO_ANOTHER_TEAM` | Resolve Immediately / Investigate Further / Escalate / Refer to Another Team |

### 2.2 Prisma schema (entities)

| Entity | Fields | Links |
| --- | --- | --- |
| **Customer** | `id, name, accountNumber` | → Transaction, DisputeCase |
| **Transaction** | `id, customerId, reference (unique), paymentType, amount, currency, status, transactionDate` | → Customer, DisputeCase |
| **DisputeCase** | `id, customerId, transactionId, paymentType, issueCategory, amount, description?, reportedAt, ageDays, ageBand, priority, recommendedAction, triggeredRuleId, ruleEvaluations (Json), status` | → Customer, Transaction |

Notes: customer **segment/risk are intentionally omitted** — the OM rules do not
use them. `ruleEvaluations` is stored as JSON so the full reasoning is auditable.
No PII/PCI: `accountNumber` is a mock token, never a real account/card number.

### 2.3 Reference constants (`constants.ts` — single source of truth)

| Constant | Value | Used by |
| --- | --- | --- |
| `HIGH_AMOUNT` | 10,000 (exclusive `>`) | priority High, rule 3 |
| `LOW_AMOUNT` | 1,000 | priority Low (`<`) / Medium band (`>=`) |
| `AGE_RECENT_MAX` | 7 days | Recent band |
| `AGE_MODERATE_MAX` | 30 days | Moderate band |

---

## 3. Rules Engine (unchanged from OM — pure TypeScript)

In-process module imported by the API. Inputs are passed in (including `today`);
no Prisma/Express imports; same input → same output.

### 3.1 Age — REQ-02

```
calculateAge(transactionDate, today):
  if transactionDate > today: throw FutureDateError
  return calendarDaysBetween(transactionDate, today)

classifyAgeBand(days):  0..7 → Recent | 8..30 → Moderate | >30 → Aged
```

### 3.2 Priority — REQ-03 (top-down, highest match wins; default Medium)

```
High   if amount > 10,000 OR issueCategory = UNAUTHORIZED_TRANSACTION
Medium if 1,000 <= amount <= 10,000 AND ageBand in {Moderate, Aged}
Low    if amount < 1,000 AND ageBand = Recent
Medium otherwise
```

### 3.3 Action — REQ-04 (first match wins)

| # | Rule ID | Condition | Action |
| --- | --- | --- | --- |
| 1 | `R1-FAILED-RECENT` | `status = FAILED` ∧ `ageBand = Recent` | Resolve Immediately |
| 2 | `R2-DUP-COMPLETED` | `category = DUPLICATE_DEBIT` ∧ `status = COMPLETED` | Investigate Further |
| 3 | `R3-UNAUTH-HIGHVAL` | `category = UNAUTHORIZED_TRANSACTION` ∧ `amount > 10,000` | Escalate |
| 4 | `R4-MISSING-EFT` | `category = MISSING_PAYMENT` ∧ `type = EFT` | Investigate Further |
| 5 | `R5-AGED-HIGH` | `ageBand = Aged` ∧ `priority = High` | Escalate |
| 6 | `R6-DEFAULT` | none of the above | Refer to Another Team |

`recommend()` returns the action, the `triggeredRuleId`, and **all**
`ruleEvaluations` (each rule + matched flag) for the display and for persistence.

### 3.4 Worked examples (deterministic oracle)

| Case | Type / Category / Amount / Status / Age | Priority | Triggered | Action |
| --- | --- | --- | --- | --- |
| A | Card / Unauthorized / R3,200 / Completed / 3 (Recent) | High | R6 | Refer to Another Team |
| B | EFT / Failed Transfer / R8,000 / Failed / 2 (Recent) | Medium | R1 | Resolve Immediately |
| C | EFT / Missing Payment / R12,500 / Pending / 10 (Moderate) | High | R4 | Investigate Further |
| D | Card / Duplicate Debit / R600 / Completed / 1 (Recent) | Low | R2 | Investigate Further |
| E | Internal / Unauthorized / R45,000 / Completed / 40 (Aged) | High | R3 | Escalate |
| F | Card / Missing Payment / R20,000 / Reversed / 35 (Aged) | High | R5 | Escalate |
| G | Internal / Failed Transfer / R5,000 / Completed / 15 (Moderate) | Medium | R6 | Refer to Another Team |

---

## 4. API specification (API Designer) — Node.js + Express, REST/JSON

| Method + path | Purpose | REQ |
| --- | --- | --- |
| `GET /api/transactions/:reference` | Mock lookup to pre-populate the form → `200 MockTransaction` or `404` | REQ-06.1/06.2 |
| `POST /api/disputes` | Validate → `triage()` → persist DisputeCase → `201 { caseId, ...TriageResult }` | REQ-01, REQ-04, REQ-05 |
| `GET /api/disputes/:id` | Fetch a stored case incl. `ruleEvaluations` and reason | REQ-05, REQ-07 |
| `GET /api/disputes` | List stored cases (for review/evidence) | REQ-05.5 |
| `GET /api/health` | Liveness | — |

Conventions: validation errors return `400 { errors: [{ field, message }] }`
(never raw strings). Future transaction date → `400` (REQ-02.2). Request/response
enums use the **code form**; the UI maps to labels. `POST /api/disputes` is the
single triage entry point; the Rules Engine runs in-process inside the controller.

---

## 5. UI / UX (UI/UX Designer) — React + Vite + Tailwind

### 5.1 Components

| Component | Purpose | REQ |
| --- | --- | --- |
| `DisputeForm` | Capture fields; dropdowns; reference lookup pre-populates status; inline validation | REQ-01, REQ-06 |
| `DisputeSummary` | All dispute attributes incl. computed age band + priority | REQ-07 |
| `RecommendationPanel` | Action label, rule-evaluation list with triggered rule highlighted, plain-language reason | REQ-05 |
| `App` | Orchestrate: submit → `POST /api/disputes` → summary + recommendation on one screen | REQ-04, REQ-07 |

### 5.2 Single-screen flow (REQ-07.2)

```
DisputeForm ──submit──▶ POST /api/disputes ──▶ DisputeSummary + RecommendationPanel
     ▲                                                  │ (same screen, no navigation)
     └──────────────── edit & re-submit ◀───────────────┘
```

### 5.3 DisputeForm (REQ-01, REQ-06)

Fields: Customer name · Transaction reference (on match → `GET
/api/transactions/:reference` pre-populates Transaction_Status; on miss → manual
status dropdown, REQ-06.2) · Transaction date (no future date, REQ-02.2) · Amount
(positive) · Payment_Type · Issue_Category · Description (optional). Inline,
field-level errors name the specific missing field (REQ-01.3).

### 5.4 RecommendationPanel (REQ-05) & palette

Action label (coloured) + Priority and Age badges + plain-language reason + the
six rule evaluations with the triggered one highlighted. Colour always paired
with a text label.

| Action | Colour | Priority badge | Age badge |
| --- | --- | --- | --- |
| Resolve Immediately | green | High = red | Aged = red |
| Investigate Further | amber | Medium = amber | Moderate = amber |
| Escalate | red | Low = grey | Recent = green |
| Refer to Another Team | blue | | |

---

## 6. Integrations (all simulated — mock seed data, no live systems)

| Integration | How | REQ |
| --- | --- | --- |
| Core Banking (transaction/customer lookup) | Prisma seed data in SQLite | REQ-06 |
| Card Processing (card records) | Mock dataset | REQ-06 |
| Case Management | Internal `DisputeCase` table — no external system | REQ-06.3 |
| Notifications | Out of scope | — |

---

## 7. Governance mapping (Harness Engineer)

| Control | Where satisfied |
| --- | --- |
| Mock-only engine, no live integrations | §1, §6 — SQLite local seed; no network egress |
| No PII/PCI | §2.2 mock tokens only |
| Rules-based, inspectable | §3 named rules + persisted `ruleEvaluations` |
| Approved MCP only | §1 note — Prisma is a library, **no Prisma MCP** |
| CVE/malware gate | deps: React, Vite, Tailwind, Express, Prisma, Vitest, fast-check — keep minimal, scan on build |
| Explainability/audit | §3.4 examples + persisted reasoning per case |
