# Implementation Plan — Payment Dispute Triage

**Feature:** `payment-triage`
**Source of truth:** Confluence — *Use Case 1* (space OM). Aligned to REQ-01–07.
**Owner role:** Facilitator (sequencing); tasks assigned per role.
**Approach:** Client-side React + TypeScript, deterministic rules engine. Build
**bottom-up** — Mock Data + Engine first, then UI, then integration. Tests marked
`*` are property-based (fast-check, 100+ iterations) or unit tests; they can be
trimmed for a faster MVP but are the verification backbone.

Every commit references the feature's assigned Jira key so it clears
`gov-pre-tool-use-audit`.

---

## Phase 0 — Governed setup (Harness Engineer)

- [ ] 0.1 `ai-sdlc install`; confirm `ai-sdlc check` passes per workstation. _(governance)_
- [ ] 0.2 Confirm steering files load in Kiro (`.kiro/steering/`). _(governance)_
- [ ] 0.3 Create + assign the Jira ticket for `payment-triage`. _(governance)_

## Phase 1 — Project structure & core types

- [ ] 1.1 Initialise React + TypeScript + Vite; install Vitest,
      @testing-library/react, fast-check. Create `src/engine/`, `src/data/`,
      `src/components/`; configure Vitest. _(REQ-06)_
- [ ] 1.2 Define domain types in `src/engine/types.ts`: `PaymentType`,
      `IssueCategory`, `TransactionStatus`, `DisputeAgeBand`, `PriorityLevel`,
      `RecommendedAction`, and `DisputeInput`, `TriageResult`, `RuleEvaluation`,
      `MockTransaction`. Values verbatim from design §2. _(REQ-01)_

## Phase 2 — Mock data layer

- [ ] 2.1 `src/data/mockTransactions.ts`: 15–20 typed records spanning all payment
      types, all statuses, and Recent/Moderate/Aged date ranges. No PII/PCI.
      Implement `MockDataService.lookupTransaction(ref)`. _(REQ-06)_
- [ ] 2.2 `*` Property 7 — mock lookup: any ref in the dataset returns its record;
      any ref not in the dataset returns `null`. _(REQ-06)_

## Phase 3 — Age calculator

- [ ] 3.1 `src/engine/ageCalculator.ts`: `calculateAge(txnDate, today)` (throw on
      future date) and `classifyAgeBand(days)` → Recent 0–7 / Moderate 8–30 /
      Aged > 30. _(REQ-02)_
- [ ] 3.2 `*` Property 1 — age = calendar days and band classification correct for
      any past/present date. _(REQ-02)_
- [ ] 3.3 `*` Property 2 — any future date is rejected with an error. _(REQ-02)_

## Phase 4 — Priority calculator

- [ ] 4.1 `src/engine/priorityCalculator.ts`: `determinePriority()` evaluating
      High → Medium → Low → default Medium per design §3.2. _(REQ-03)_
- [ ] 4.2 `*` Property 3 — priority matches the defined rules including evaluation
      order (High always wins). _(REQ-03)_

## Phase 5 — Action recommender

- [ ] 5.1 `src/engine/actionRecommender.ts`: `recommend()` with the 6 rules
      R1→R6 in precedence order; return triggered rule, all `ruleEvaluations`,
      and the action. Build the plain-language `reason`. _(REQ-04, REQ-05)_
- [ ] 5.2 `*` Property 4 — exactly one action is produced (never zero/multiple). _(REQ-04)_
- [ ] 5.3 `*` Property 5 — action matches the first applicable rule in precedence
      order. _(REQ-04)_
- [ ] 5.4 Assert worked examples A–G (design §3.5) as a table-driven test. _(REQ-03, REQ-04)_

## Phase 6 — Engine checkpoint

- [ ] 6.1 Add `triage(input, today)` orchestrator returning `TriageResult`; verify
      all engine tests pass before any UI work (`gov-post-task-test`). _(REQ-04, REQ-05)_

## Phase 7 — Form validation

- [ ] 7.1 `src/engine/validation.ts`: mandatory-field, future-date, and
      positive-amount checks returning field-level errors. _(REQ-01, REQ-02)_
- [ ] 7.2 `*` Property 6 — for any incomplete subset of mandatory fields,
      validation rejects and names each missing field. _(REQ-01)_

## Phase 8 — UI components

- [ ] 8.1 `DisputeForm.tsx`: all fields + dropdowns, mock pre-population of
      Transaction_Status, manual status when no match, inline validation. _(REQ-01, REQ-06)_
- [ ] 8.2 `DisputeSummary.tsx`: all dispute attributes incl. computed age band +
      priority. _(REQ-07)_
- [ ] 8.3 `RecommendationPanel.tsx`: action label, rule-evaluation list with
      triggered rule highlighted, priority + age badges, plain-language reasoning. _(REQ-05)_
- [ ] 8.4 `*` Unit tests: form renders all fields, dropdowns have correct options,
      recommendation display shows required info. _(REQ-01, REQ-05, REQ-07)_

## Phase 9 — Integration

- [ ] 9.1 `App.tsx`: wire form → `triage()` → summary + recommendation on a
      single screen (no navigation). _(REQ-04, REQ-07)_
- [ ] 9.2 `*` Integration tests: submit a dispute, verify the correct
      recommendation; verify summary + recommendation share one screen. _(REQ-04, REQ-07)_

## Phase 10 — Final checkpoint + governance + demo

- [ ] 10.1 All tests green; app runs. _(verification)_
- [ ] 10.2 `gov-cve-build-gate` clean (no malware); review CVE warnings. _(governance)_
- [ ] 10.3 Grep source/data for PII, card numbers, secrets, external URLs — none. _(governance)_
- [ ] 10.4 `gov-pre-commit-review` before the final PR; `ai-sdlc check --report`. _(governance)_
- [ ] 10.5 Demo dry-run: drive cases A–G so all four actions appear. _(REQ-04, REQ-05)_

---

## Execution waves (parallelisable)

| Wave | Tasks |
| --- | --- |
| 0 | 1.1 |
| 1 | 1.2 |
| 2 | 2.1, 3.1, 7.1 |
| 3 | 2.2, 3.2, 3.3, 4.1, 7.2 |
| 4 | 4.2, 5.1 |
| 5 | 5.2, 5.3, 5.4, 8.1 |
| 6 | 6.1, 8.2, 8.3 |
| 7 | 8.4, 9.1 |
| 8 | 9.2 |

## Role ownership

| Phase | Lead | Supporting |
| --- | --- | --- |
| 0 Setup | Harness Engineer | Facilitator |
| 1–2 Types + data | Architect | — |
| 3–6 Engine | Architect | Quality Engineer |
| 7 Validation | Architect | Quality Engineer |
| 8 UI | UI/UX Designer | API Designer |
| 9 Integration | UI/UX Designer | Architect |
| 10 Verify + demo | Facilitator | Harness Engineer, QE |

## Definition of done

REQ-01–07 each have passing acceptance tests; the engine reproduces worked
examples A–G; the demo shows all four actions on a single screen with reasoning;
`ai-sdlc check --report` is clean; the final PR passed `gov-pre-commit-review`
against an assigned Jira ticket.
