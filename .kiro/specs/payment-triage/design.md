# Design — Payment Dispute Triage

**Feature:** `payment-triage`
**Source of truth:** Confluence — *Use Case 1* (space OM). Aligned to REQ-01–07.
**Owner roles:** Architect (system + types), API Designer (engine contracts),
UI/UX Designer (components + flows)
**Status:** Aligned to OM canonical

---

## 1. Architecture

Client-side React + TypeScript application. Three layers, built **bottom-up**:
Mock Data Layer and Triage Engine first (pure TypeScript), then UI, then
integration. The engine is decoupled from the display (REQ-05.5).

```
┌──────────────────────── UI Layer (React) ───────────────────────┐
│   DisputeForm   │   DisputeSummary   │   RecommendationPanel     │
└─────────┬───────────────────────────────────────┬───────────────┘
          │ DisputeInput                            │ TriageResult
          ▼                                         ▲
┌──────────────────────── Triage Engine (pure TS) ─────────────────┐
│ validation → ageCalculator → priorityCalculator → actionRecommender │
│  returns TriageResult { recommendedAction, triggeredRule,         │
│  ruleEvaluations[], priorityLevel, ageBand, disputeAgeDays }      │
└─────────┬─────────────────────────────────────────────────────────┘
          │ reads (engine-only restriction, REQ-06.3/06.4)
          ▼
┌──────────────────────── Mock Data Layer ─────────────────────────┐
│  mockTransactions  +  MockDataService.lookupTransaction(ref)      │
└───────────────────────────────────────────────────────────────────┘
```

Principles: the engine is **pure and deterministic** (same input → same output);
every rule is **named and inspectable**; the engine performs no I/O and does not
import React.

---

## 2. Domain model (Architect — `src/engine/types.ts`)

### Enums (string unions, values verbatim from the glossary)

```ts
type PaymentType        = 'Card Payment' | 'EFT' | 'Internal Transfer';
type IssueCategory      = 'Duplicate Debit' | 'Failed Transfer'
                        | 'Missing Payment' | 'Unauthorized Transaction';
type TransactionStatus  = 'Completed' | 'Pending' | 'Failed' | 'Reversed';
type DisputeAgeBand     = 'Recent' | 'Moderate' | 'Aged';
type PriorityLevel      = 'High' | 'Medium' | 'Low';
type RecommendedAction  = 'Resolve Immediately' | 'Investigate Further'
                        | 'Escalate' | 'Refer to Another Team';
```

### Interfaces

| Type | Fields |
| --- | --- |
| `DisputeInput` | `customerName, transactionReference, transactionDate (Date), amount (number), paymentType, issueCategory, description?, transactionStatus` |
| `MockTransaction` | `transactionReference, transactionStatus, paymentType, amount, customerName` |
| `RuleEvaluation` | `ruleId, label, matched (boolean)` |
| `TriageResult` | `disputeAgeDays, ageBand, priorityLevel, recommendedAction, triggeredRuleId, ruleEvaluations: RuleEvaluation[], reason (string)` |

### Reference constants (`src/engine/constants.ts` — single source of truth)

| Constant | Value | Used by |
| --- | --- | --- |
| `HIGH_AMOUNT` | 10,000 (exclusive `>`) | priority High, rule 3 |
| `LOW_AMOUNT` | 1,000 | priority Low (`<`) / Medium band (`>=`) |
| `AGE_RECENT_MAX` | 7 days | Recent band |
| `AGE_MODERATE_MAX` | 30 days | Moderate band |

---

## 3. Triage Engine

### 3.1 Age calculator (`ageCalculator.ts`) — REQ-02

```
calculateAge(transactionDate, today):
  if transactionDate > today: throw FutureDateError
  return calendarDaysBetween(transactionDate, today)

classifyAgeBand(days):
  0..7    → Recent
  8..30   → Moderate
  > 30    → Aged
```

### 3.2 Priority calculator (`priorityCalculator.ts`) — REQ-03

Evaluate High → Medium → Low; **highest match wins**; else Medium.

```
determinePriority(amount, issueCategory, ageBand):
  High   if amount > 10,000 OR issueCategory = 'Unauthorized Transaction'
  Medium if 1,000 <= amount <= 10,000 AND ageBand in {Moderate, Aged}
  Low    if amount < 1,000 AND ageBand = Recent
  Medium otherwise   # default
```

### 3.3 Action recommender (`actionRecommender.ts`) — REQ-04

Ordered rules; **first match wins**. Returns the triggered rule, **all**
evaluations (for the display), and the action.

| # | Rule ID | Condition | Action |
| --- | --- | --- | --- |
| 1 | `R1-FAILED-RECENT` | `status = Failed` ∧ `ageBand = Recent` | Resolve Immediately |
| 2 | `R2-DUP-COMPLETED` | `category = Duplicate Debit` ∧ `status = Completed` | Investigate Further |
| 3 | `R3-UNAUTH-HIGHVAL` | `category = Unauthorized Transaction` ∧ `amount > 10,000` | Escalate |
| 4 | `R4-MISSING-EFT` | `category = Missing Payment` ∧ `type = EFT` | Investigate Further |
| 5 | `R5-AGED-HIGH` | `ageBand = Aged` ∧ `priority = High` | Escalate |
| 6 | `R6-DEFAULT` | none of the above | Refer to Another Team |

### 3.4 Reasoning (REQ-05.4)

The engine builds a plain-language `reason` from the triggered rule, e.g.
*"Failed transaction raised within 7 days — safe to resolve immediately."* Each
rule has a fixed reason template.

### 3.5 Worked examples (deterministic expected output)

| Case | Type / Category / Amount / Status / Age | Priority | Triggered | Action |
| --- | --- | --- | --- | --- |
| A | Card / Unauthorized / R3,200 / Completed / 3 (Recent) | High | R6 | Refer to Another Team |
| B | EFT / Failed Transfer / R8,000 / Failed / 2 (Recent) | Medium | R1 | Resolve Immediately |
| C | EFT / Missing Payment / R12,500 / Pending / 10 (Moderate) | High | R4 | Investigate Further |
| D | Card / Duplicate Debit / R600 / Completed / 1 (Recent) | Low | R2 | Investigate Further |
| E | Internal / Unauthorized / R45,000 / Completed / 40 (Aged) | High | R3 | Escalate |
| F | Card / Missing Payment / R20,000 / Reversed / 35 (Aged) | High | R5 | Escalate |
| G | Internal / Failed Transfer / R5,000 / Completed / 15 (Moderate) | Medium | R6 | Refer to Another Team |

> Note (case A): a low-value Unauthorized dispute is High priority (REQ-03.2) but
> action falls to R6 because rule 3 needs amount > 10,000 and rule 5 needs Aged.
> This is the intended behaviour of the source rules.

---

## 4. Engine & service contracts (API Designer)

Pure functions — no network I/O, no writes to any system of record. Field names
and enum values match the spec verbatim.

| Function | Signature | REQ |
| --- | --- | --- |
| `lookupTransaction` | `(ref: string) => MockTransaction \| null` | REQ-06.1/06.2 |
| `calculateAge` | `(txnDate: Date, today: Date) => number` (throws on future) | REQ-02 |
| `classifyAgeBand` | `(days: number) => DisputeAgeBand` | REQ-02.3 |
| `determinePriority` | `(amount, category, ageBand) => PriorityLevel` | REQ-03 |
| `recommend` | `(input: DisputeInput, ageBand, priority) => { action, triggeredRuleId, ruleEvaluations }` | REQ-04 |
| `validate` | `(partial: DisputeInput) => FieldError[]` | REQ-01, REQ-02 |
| `triage` | `(input: DisputeInput, today: Date) => TriageResult` (orchestrates the above) | REQ-04/05 |

`validate` returns `{ field, message }[]` (never throws raw strings). `triage` is
idempotent for identical inputs and is the single entry point the UI calls. Per
REQ-05.5, `triage` can be called without any display present and its result
logged.

---

## 5. UI / UX (UI/UX Designer)

### 5.1 Components

| Component | Purpose | REQ |
| --- | --- | --- |
| `DisputeForm` | Capture all fields; dropdowns; mock pre-population; inline validation | REQ-01, REQ-06 |
| `DisputeSummary` | Show all dispute attributes incl. computed age band + priority | REQ-07 |
| `RecommendationPanel` | Action label, rule evaluations with triggered rule highlighted, plain-language reasoning | REQ-05 |
| `App` | Orchestrate form → engine → summary + recommendation on one screen | REQ-04, REQ-07 |

### 5.2 Single-screen flow (REQ-07.2)

```
DisputeForm (left/top)  ──submit──▶  triage()  ──▶  DisputeSummary + RecommendationPanel
        ▲                                                     │ (same screen, no navigation)
        └────────────── edit & re-submit ◀────────────────────┘
```

### 5.3 DisputeForm (REQ-01, REQ-06)

Fields: Customer name · Transaction reference (on valid match → pre-populate
Transaction_Status, REQ-06.1) · Transaction date (no future date, REQ-02.2) ·
Amount (positive) · Payment_Type (Card Payment / EFT / Internal Transfer) ·
Issue_Category (Duplicate Debit / Failed Transfer / Missing Payment /
Unauthorized Transaction) · Description (free text, optional). If the reference
has no match, Transaction_Status becomes a manual dropdown (REQ-06.2). Inline,
field-level errors name the specific missing field (REQ-01.3).

### 5.4 RecommendationPanel (REQ-05)

Top: the **action label** with its bucket colour. Below: **Priority_Level** and
**Dispute_Age band** badges, a plain-language **reason**, and the **rule
evaluation list** showing all six rules with the triggered one highlighted
(matched/not-matched indicators). Colour is always paired with a text label.

### 5.5 Action bucket palette (fixed)

| Action | Colour | Bucket |
| --- | --- | --- |
| Resolve Immediately | green | Immediate Resolution |
| Investigate Further | amber | Further Investigation |
| Escalate | red | Escalation |
| Refer to Another Team | blue | External Team Referral |

Priority badge: High red · Medium amber · Low grey. Age badge: Aged red ·
Moderate amber · Recent green.

---

## 6. Governance mapping (Harness Engineer)

| Control | Where satisfied |
| --- | --- |
| Mock-only (engine) | §1 client-side, §4 pure functions, REQ-06.3 |
| No PII/PCI | §2 mock fields only; no card/account numbers |
| Rules-based, inspectable | §3 named ordered rules + `ruleEvaluations` in §5.4 |
| CVE/malware gate | minimal deps: React, Vite, Vitest, fast-check |
| Explainability | §3.5 worked examples + §5.4 rule-evaluation UI |
