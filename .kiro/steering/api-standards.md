---
inclusion: manual
---

# Engine contracts (load with #api-standards)

There is no backend. These are the **pure engine/service function contracts**
from `design.md` §4 — keep their shapes exact so the engine could later lift into
a service unchanged.

## Function contracts (do not drift from design §4)

- `lookupTransaction(ref) -> MockTransaction | null` _(REQ-06)_
- `calculateAge(txnDate, today) -> number` (throws `FutureDateError`) _(REQ-02)_
- `classifyAgeBand(days) -> 'Recent' | 'Moderate' | 'Aged'` _(REQ-02)_
- `determinePriority(amount, category, ageBand) -> 'High' | 'Medium' | 'Low'` _(REQ-03)_
- `recommend(input, ageBand, priority) -> { action, triggeredRuleId, ruleEvaluations }` _(REQ-04)_
- `validate(partialInput) -> FieldError[]` _(REQ-01, REQ-02)_
- `triage(input, today) -> TriageResult` — single UI entry point; idempotent for
  identical inputs; callable with no display present (REQ-05.5).

## Rules

- Functions are **pure/compute-only** — no writes to any system of record, no
  real network I/O.
- `validate` returns `{ field, message }[]`; never throw raw strings to the UI.
- Field names and enum values match the glossary **verbatim** so engine, data, UI
  and tests align.
- Amounts are ZAR numbers; never format currency in the engine — format in the UI.
